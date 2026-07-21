#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as readline from "node:readline";

import {
  type AuthorizationDecision,
  type RailNodeRecord,
  type SecurityContext,
  authorizeToolCall,
  loadSecurityContextFromEnvironment,
} from "./authorization";

type JsonObject = Record<string, unknown>;
type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: JsonObject;
};

type ToolContract = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: JsonObject;
};

type ContractRegistry = {
  protocol_version: string;
  contract_version: string;
  tools: ToolContract[];
};

const CONTRACTS_URL = new URL("./tool-contracts.v0.1.json", import.meta.url);
const SERVER_NAME = "qel-pinyin-rail-mcp";
const SERVER_VERSION = "0.2.0";

export async function loadToolContracts(): Promise<ContractRegistry> {
  return JSON.parse(await readFile(CONTRACTS_URL, "utf8")) as ContractRegistry;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as JsonObject;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableId(prefix: string, payload: unknown): string {
  const digest = createHash("sha256").update(stableJson(payload)).digest("hex");
  return `${prefix}_${digest.slice(0, 24)}`;
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function jsonRpcResult(id: JsonRpcId | undefined, result: unknown): JsonObject {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function jsonRpcError(id: JsonRpcId | undefined, code: number, message: string, data?: unknown): JsonObject {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}

function toolError(message: string, details?: JsonObject): JsonObject {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: { status: "rejected", message, ...(details ?? {}) },
    isError: true,
  };
}

function assertNoSensitiveKeys(value: unknown, path = "arguments"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveKeys(item, `${path}[${index}]`));
    return;
  }
  if (value === null || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value as JsonObject)) {
    if (/(secret|password|token|api[_-]?key|private[_-]?key)/i.test(key)) {
      throw new Error(`Sensitive field is not permitted in MCP arguments: ${path}.${key}`);
    }
    assertNoSensitiveKeys(child, `${path}.${key}`);
  }
}

function validateSchema(value: unknown, schema: JsonObject, path = "arguments"): string[] {
  const errors: string[] = [];
  const type = schema.type;

  if (type === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return [`${path} must be an object`];
    }
    const object = value as JsonObject;
    const properties = (schema.properties ?? {}) as Record<string, JsonObject>;
    const required = (schema.required ?? []) as string[];

    for (const name of required) {
      if (!(name in object)) errors.push(`${path}.${name} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const name of Object.keys(object)) {
        if (!(name in properties)) errors.push(`${path}.${name} is not allowed`);
      }
    }
    for (const [name, child] of Object.entries(object)) {
      if (properties[name]) errors.push(...validateSchema(child, properties[name], `${path}.${name}`));
    }
    return errors;
  }

  if (type === "array") {
    if (!Array.isArray(value)) return [`${path} must be an array`];
    const minItems = schema.minItems as number | undefined;
    if (minItems !== undefined && value.length < minItems) errors.push(`${path} must contain at least ${minItems} item(s)`);
    if (schema.uniqueItems === true && new Set(value.map(stableJson)).size !== value.length) {
      errors.push(`${path} must contain unique items`);
    }
    const items = schema.items as JsonObject | undefined;
    if (items) value.forEach((item, index) => errors.push(...validateSchema(item, items, `${path}[${index}]`)));
    return errors;
  }

  if (type === "string") {
    if (typeof value !== "string") return [`${path} must be a string`];
    const minLength = schema.minLength as number | undefined;
    const maxLength = schema.maxLength as number | undefined;
    if (minLength !== undefined && value.length < minLength) errors.push(`${path} is too short`);
    if (maxLength !== undefined && value.length > maxLength) errors.push(`${path} is too long`);
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path} does not match the required pattern`);
    }
  } else if (type === "boolean" && typeof value !== "boolean") {
    errors.push(`${path} must be a boolean`);
  } else if (type === "integer") {
    if (!Number.isInteger(value)) return [`${path} must be an integer`];
    const number = value as number;
    if (typeof schema.minimum === "number" && number < schema.minimum) errors.push(`${path} is below minimum`);
    if (typeof schema.maximum === "number" && number > schema.maximum) errors.push(`${path} is above maximum`);
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => stableJson(candidate) === stableJson(value))) {
    errors.push(`${path} is not an allowed value`);
  }
  if ("const" in schema && stableJson(schema.const) !== stableJson(value)) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
  }
  return errors;
}

function resourceLink(uri: string, name: string, mimeType = "application/json"): JsonObject {
  return { type: "resource_link", uri, name, mimeType };
}

function previewResult(tool: string, args: JsonObject, authorization: AuthorizationDecision): JsonObject {
  const receiptId = stableId("rcpt", { tool, args, authorization_id: authorization.authorization_id });
  const operationId = stableId("op", { tool, args, authorization_id: authorization.authorization_id });
  const resources = [
    resourceLink(`rail://operations/${operationId}`, `${tool} operation`),
    resourceLink(`rail://receipts/${receiptId}`, "Rail operation receipt"),
    resourceLink(`rail://authorizations/${authorization.authorization_id}`, "Authorization decision"),
  ];

  return {
    content: [
      { type: "text", text: `${tool} authorized and compiled in safe preview mode. No node or external destination was modified.` },
      ...resources,
    ],
    structuredContent: {
      status: "preview",
      operation_id: operationId,
      receipt_id: receiptId,
      tool,
      execution_enabled: false,
      authorization,
      resource_uris: resources.map((item) => item.uri),
    },
    isError: false,
  };
}

function resolveNodeResult(node: RailNodeRecord, authorization: AuthorizationDecision): JsonObject {
  const resources = [
    resourceLink(`rail://nodes/${encodeURIComponent(node.node_id)}`, "Signed rail node"),
    resourceLink(`rail://authorizations/${authorization.authorization_id}`, "Authorization decision"),
  ];
  return {
    content: [
      { type: "text", text: `Node ${node.node_id} resolved from signed registry ${authorization.registry_id}.` },
      ...resources,
    ],
    structuredContent: {
      status: "resolved",
      node,
      authorization,
      resource_uris: resources.map((item) => item.uri),
    },
    isError: false,
  };
}

async function sendCommunication(args: JsonObject, authorization: AuthorizationDecision): Promise<JsonObject> {
  const executionEnabled = process.env.RAIL_MCP_EXECUTION_ENABLED === "true";
  if (!executionEnabled) return previewResult("comms.message.send", args, authorization);

  if (args.classification === "confidential" && process.env.RAIL_MCP_CONFIDENTIAL_ENABLED !== "true") {
    return toolError("Confidential communications require RAIL_MCP_CONFIDENTIAL_ENABLED=true", {
      authorization: { status: "authorized", decision_id: authorization.decision_id },
    });
  }

  const outbox = process.env.RAIL_MCP_OUTBOX_DIR;
  if (!outbox) return toolError("Execution is enabled but RAIL_MCP_OUTBOX_DIR is not configured");

  const communicationId = stableId("comm", { args, authorization_id: authorization.authorization_id });
  const receiptId = stableId("rcpt", { communicationId, args, authorization_id: authorization.authorization_id });
  const record = {
    schema: "org.believerscommon.rail.communication.v1",
    communication_id: communicationId,
    receipt_id: receiptId,
    status: "accepted-to-controlled-outbox",
    recorded_at: new Date().toISOString(),
    channels: args.channels,
    classification: args.classification,
    subject: args.subject,
    message: args.message,
    resource_links: args.resource_links ?? [],
    idempotency_key: args.idempotency_key,
    authorization,
    boundary: "Outbox acceptance is not proof that an external channel delivered the message.",
  };

  await mkdir(outbox, { recursive: true });
  let persistedRecord = record;
  try {
    await writeFile(join(outbox, `${communicationId}.json`), `${JSON.stringify(record, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EEXIST") throw error;
    persistedRecord = JSON.parse(await readFile(join(outbox, `${communicationId}.json`), "utf8"));
  }

  return {
    content: [
      { type: "text", text: `Communication ${communicationId} accepted to the controlled outbox.` },
      resourceLink(`rail://communications/${communicationId}`, "Communication record"),
      resourceLink(`rail://receipts/${receiptId}`, "Communication receipt"),
      resourceLink(`rail://authorizations/${authorization.authorization_id}`, "Authorization decision"),
    ],
    structuredContent: persistedRecord,
    isError: false,
  };
}

async function communicationStatus(args: JsonObject, authorization: AuthorizationDecision): Promise<JsonObject> {
  const outbox = process.env.RAIL_MCP_OUTBOX_DIR;
  if (!outbox) return toolError("RAIL_MCP_OUTBOX_DIR is not configured");
  const id = String(args.communication_id);
  if (!/^comm_[a-f0-9]{24}$/.test(id)) return toolError("Invalid communication_id");

  try {
    const record = JSON.parse(await readFile(join(outbox, `${id}.json`), "utf8")) as JsonObject;
    return {
      content: [
        { type: "text", text: `Communication ${id}: ${String(record.status)}` },
        resourceLink(`rail://communications/${id}`, "Communication record"),
        resourceLink(`rail://authorizations/${authorization.authorization_id}`, "Authorization decision"),
      ],
      structuredContent: { ...record, read_authorization: authorization },
      isError: false,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return toolError(`Communication not found: ${id}`);
    throw error;
  }
}

async function callTool(
  contract: ToolContract,
  args: JsonObject,
  meta: JsonObject | undefined,
  providedSecurityContext?: SecurityContext,
): Promise<JsonObject> {
  try {
    assertNoSensitiveKeys(args);
  } catch (error) {
    return toolError(error instanceof Error ? error.message : String(error));
  }

  const validationErrors = validateSchema(args, contract.inputSchema);
  if (validationErrors.length > 0) return toolError("Tool arguments failed validation", { validation_errors: validationErrors });

  let securityContext: SecurityContext;
  try {
    securityContext = providedSecurityContext ?? await loadSecurityContextFromEnvironment();
  } catch (error) {
    return toolError(error instanceof Error ? error.message : String(error), {
      authorization: { status: "denied", code: "security-context-unavailable" },
    });
  }

  const authorization = authorizeToolCall(contract.name, args, meta, securityContext);
  if (!authorization.ok) {
    return toolError(authorization.message, {
      authorization: { status: "denied", code: authorization.code },
    });
  }

  if (contract.name === "rail.nodes.resolve") {
    if (!authorization.node) return toolError("Authorized node resolution returned no node");
    return resolveNodeResult(authorization.node, authorization.decision);
  }
  if (contract.name === "comms.message.send") return sendCommunication(args, authorization.decision);
  if (contract.name === "comms.message.status") return communicationStatus(args, authorization.decision);

  return previewResult(contract.name, args, authorization.decision);
}

export async function handleMcpRequest(
  request: JsonRpcRequest,
  securityContext?: SecurityContext,
): Promise<JsonObject | null> {
  const registry = await loadToolContracts();

  if (request.method === "notifications/initialized") return null;
  if (request.method === "initialize") {
    return jsonRpcResult(request.id, {
      protocolVersion: registry.protocol_version,
      capabilities: { tools: { listChanged: false } },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: "Authorized Pinyin rail-node and controlled communications command server",
      },
      instructions: "Every tools/call requires a dual-signed DigitalMe/Warden authorization envelope bound to a signed node-registry digest. Node operations remain preview-only.",
    });
  }
  if (request.method === "ping") return jsonRpcResult(request.id, {});
  if (request.method === "tools/list") {
    return jsonRpcResult(request.id, {
      tools: registry.tools.map(({ name, title, description, inputSchema }) => ({
        name,
        title,
        description,
        inputSchema,
        _meta: { "org.believerscommon/authorization-required": true },
      })),
    });
  }
  if (request.method === "tools/call") {
    const params = request.params ?? {};
    const name = params.name;
    const args = params.arguments;
    const meta = params._meta;
    if (typeof name !== "string") return jsonRpcError(request.id, -32602, "tools/call requires params.name");
    if (!isObject(args)) return jsonRpcError(request.id, -32602, "tools/call requires object params.arguments");
    if (meta !== undefined && !isObject(meta)) return jsonRpcError(request.id, -32602, "tools/call params._meta must be an object");
    const contract = registry.tools.find((candidate) => candidate.name === name);
    if (!contract) return jsonRpcError(request.id, -32602, `Unknown tool: ${name}`);
    return jsonRpcResult(request.id, await callTool(contract, args, meta as JsonObject | undefined, securityContext));
  }

  return jsonRpcError(request.id, -32601, `Method not found: ${request.method}`);
}

export async function runStdioServer(): Promise<void> {
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line) as JsonRpcRequest;
      const response = await handleMcpRequest(request);
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
      process.stdout.write(`${JSON.stringify(jsonRpcError(null, -32700, "Parse error"))}\n`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await runStdioServer();
}
