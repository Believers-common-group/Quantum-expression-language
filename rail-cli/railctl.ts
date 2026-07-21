#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

type JsonObject = Record<string, unknown>;

type CommandDefinition = {
  display: string;
  pinyin: [string, string];
  tool: string;
  required: string[];
  defaults: JsonObject;
};

type CommandRegistry = {
  registry_version: string;
  commands: CommandDefinition[];
  options: Record<string, string>;
  list_options: string[];
  boolean_options: string[];
};

export type CompiledRailCommand = {
  registry_version: string;
  display: string;
  pinyin: string;
  tool: string;
  arguments: JsonObject;
  execution: {
    mode: "compile-only" | "execute";
    confirmation_required: boolean;
    authorization_required: true;
  };
};

export type CliControls = {
  execute: boolean;
  confirm?: string;
  mcpUrl?: string;
  authorizationFile?: string;
};

const REGISTRY_URL = new URL("./commands.v0.1.json", import.meta.url);
const MCP_PROTOCOL_VERSION = "2025-06-18";
const AUTHORIZATION_META_KEY = "org.believerscommon/authorization";

export async function loadRegistry(): Promise<CommandRegistry> {
  const content = await readFile(REGISTRY_URL, "utf8");
  return JSON.parse(content) as CommandRegistry;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const object = value as JsonObject;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function deterministicIdempotencyKey(tool: string, args: JsonObject): string {
  const digest = createHash("sha256")
    .update(stableJson({ tool, arguments: args }))
    .digest("hex");
  return `rail-${digest.slice(0, 40)}`;
}

function parseBoolean(raw: string | boolean): boolean {
  if (typeof raw === "boolean") return raw;
  if (["true", "1", "yes", "shi"].includes(raw.toLowerCase())) return true;
  if (["false", "0", "no", "fou"].includes(raw.toLowerCase())) return false;
  throw new Error(`Invalid boolean value: ${raw}`);
}

function normalizeDigest(value: unknown): string {
  if (typeof value !== "string") throw new Error("expected_digest must be a string");
  const digest = value.toLowerCase().replace(/^sha256:/, "");
  if (!/^[a-f0-9]{64}$/.test(digest)) {
    throw new Error("expected_digest must be a SHA-256 digest");
  }
  return `sha256:${digest}`;
}

function validateNodeId(value: unknown): void {
  if (typeof value !== "string" || !/^(vsr:\/\/|urn:vsr:node:)/.test(value)) {
    throw new Error("node_id must use vsr:// or urn:vsr:node: addressing");
  }
}

function requireControlValue(argv: string[], index: number, name: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function takeGlobalControls(argv: string[]): { commandArgv: string[]; controls: CliControls } {
  const controls: CliControls = { execute: false };
  const commandArgv: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--execute") {
      controls.execute = true;
      continue;
    }
    if (token === "--confirm") {
      controls.confirm = requireControlValue(argv, index, token);
      index += 1;
      continue;
    }
    if (token === "--mcp-url") {
      controls.mcpUrl = requireControlValue(argv, index, token);
      index += 1;
      continue;
    }
    if (token === "--authorization-file" || token === "--shouquan-wenjian") {
      controls.authorizationFile = requireControlValue(argv, index, token);
      index += 1;
      continue;
    }
    commandArgv.push(token);
  }

  return { commandArgv, controls };
}

export async function compileRailCommand(argv: string[]): Promise<{
  compiled: CompiledRailCommand;
  controls: CliControls;
}> {
  const registry = await loadRegistry();
  const { commandArgv, controls } = takeGlobalControls(argv);
  const [verb, object, ...optionTokens] = commandArgv;

  if (!verb || !object) {
    throw new Error("Usage: railctl <pinyin-verb> <pinyin-object> [options]");
  }

  const definition = registry.commands.find(
    (candidate) => candidate.pinyin[0] === verb && candidate.pinyin[1] === object,
  );
  if (!definition) {
    throw new Error(`Unknown Pinyin rail command: ${verb} ${object}`);
  }

  const args: JsonObject = { ...definition.defaults };
  for (let index = 0; index < optionTokens.length; index += 1) {
    const token = optionTokens[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }

    const pinyinOption = token.slice(2);
    const canonicalOption = registry.options[pinyinOption];
    if (!canonicalOption) throw new Error(`Unknown option: ${token}`);

    if (registry.boolean_options.includes(canonicalOption)) {
      const possibleValue = optionTokens[index + 1];
      if (possibleValue && !possibleValue.startsWith("--")) {
        args[canonicalOption] = parseBoolean(possibleValue);
        index += 1;
      } else {
        args[canonicalOption] = true;
      }
      continue;
    }

    const value = optionTokens[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Option ${token} requires a value`);
    }
    index += 1;

    if (registry.list_options.includes(canonicalOption)) {
      args[canonicalOption] = value.split(",").map((item) => item.trim()).filter(Boolean);
    } else if (canonicalOption === "limit") {
      const limit = Number.parseInt(value, 10);
      if (!Number.isInteger(limit) || limit < 1 || limit > 10_000) {
        throw new Error("limit must be an integer from 1 to 10000");
      }
      args[canonicalOption] = limit;
    } else {
      args[canonicalOption] = value;
    }
  }

  for (const required of definition.required) {
    const value = args[required];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      throw new Error(`Missing required option for ${definition.tool}: ${required}`);
    }
  }

  if ("node_id" in args) validateNodeId(args.node_id);
  if ("expected_digest" in args) args.expected_digest = normalizeDigest(args.expected_digest);

  if (
    ["rail.logs.export", "rail.logs.import.prepare", "comms.message.send"].includes(definition.tool) &&
    !("idempotency_key" in args)
  ) {
    args.idempotency_key = deterministicIdempotencyKey(definition.tool, args);
  }

  if (controls.execute && controls.confirm !== definition.tool) {
    throw new Error(`Execution requires --confirm ${definition.tool}`);
  }

  return {
    compiled: {
      registry_version: registry.registry_version,
      display: definition.display,
      pinyin: definition.pinyin.join(" "),
      tool: definition.tool,
      arguments: args,
      execution: {
        mode: controls.execute ? "execute" : "compile-only",
        confirmation_required: true,
        authorization_required: true,
      },
    },
    controls,
  };
}

export function buildToolCall(compiled: CompiledRailCommand, id = 2, authorization?: JsonObject): JsonObject {
  return {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: {
      name: compiled.tool,
      arguments: compiled.arguments,
      ...(authorization ? { _meta: { [AUTHORIZATION_META_KEY]: authorization } } : {}),
    },
  };
}

function extractSseJson(text: string): unknown {
  const dataLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  if (dataLines.length === 0) throw new Error("MCP server returned an empty SSE response");
  return JSON.parse(dataLines.at(-1) as string);
}

async function postMcp(
  url: string,
  body: JsonObject,
  token: string,
  sessionId?: string,
): Promise<{ payload?: unknown; sessionId?: string; status: number }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
      Authorization: `Bearer ${token}`,
      ...(sessionId ? { "MCP-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`MCP request failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
  }

  const returnedSessionId = response.headers.get("MCP-Session-Id") ?? sessionId;
  if (response.status === 202) return { status: response.status, sessionId: returnedSessionId };

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("text/event-stream") ? extractSseJson(text) : JSON.parse(text);
  return { status: response.status, sessionId: returnedSessionId, payload };
}

async function loadAuthorizationEnvelope(path: string): Promise<JsonObject> {
  const parsed = JSON.parse(await readFile(path, "utf8"));
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Authorization file must contain one JSON object");
  }
  return parsed as JsonObject;
}

export async function executeCompiledCommand(
  compiled: CompiledRailCommand,
  controls: CliControls,
): Promise<unknown> {
  const url = controls.mcpUrl ?? process.env.RAIL_MCP_URL;
  const token = process.env.RAIL_MCP_TOKEN;
  const authorizationFile = controls.authorizationFile ?? process.env.RAIL_AUTHORIZATION_FILE;
  if (!url) throw new Error("Execution requires RAIL_MCP_URL or --mcp-url");
  if (!token) throw new Error("Execution requires RAIL_MCP_TOKEN in the environment");
  if (!authorizationFile) {
    throw new Error("Execution requires RAIL_AUTHORIZATION_FILE or --authorization-file/--shouquan-wenjian");
  }
  const authorization = await loadAuthorizationEnvelope(authorizationFile);

  const initialize = await postMcp(
    url,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "railctl", version: "0.2.0" },
      },
    },
    token,
  );

  await postMcp(
    url,
    { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
    token,
    initialize.sessionId,
  );

  const result = await postMcp(url, buildToolCall(compiled, 2, authorization), token, initialize.sessionId);
  return result.payload;
}

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  try {
    const { compiled, controls } = await compileRailCommand(argv);
    if (!controls.execute) {
      process.stdout.write(`${JSON.stringify({
        compiled,
        request: buildToolCall(compiled),
        authorization: {
          required_for_execution: true,
          supplied_to_compile_output: false,
          source: controls.authorizationFile ?? process.env.RAIL_AUTHORIZATION_FILE ?? null,
        },
      }, null, 2)}\n`);
      return 0;
    }

    const response = await executeCompiledCommand(compiled, controls);
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  process.exitCode = await runCli();
}
