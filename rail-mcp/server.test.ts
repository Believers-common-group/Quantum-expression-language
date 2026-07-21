import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { handleMcpRequest } from "./server";

const NODE_ID = "vsr://mainnet/IN-KA/operational/warehouse/voi/bangalore/warehouse-001";

function resultOf(response: Record<string, unknown> | null): Record<string, unknown> {
  assert.ok(response);
  const result = response.result;
  assert.ok(result && typeof result === "object" && !Array.isArray(result));
  return result as Record<string, unknown>;
}

test("declares MCP tools during initialization", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "1" },
    },
  });

  const result = resultOf(response);
  assert.equal(result.protocolVersion, "2025-06-18");
  assert.deepEqual(result.capabilities, { tools: { listChanged: false } });
});

test("lists the six canonical rail and communications tools", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const tools = resultOf(response).tools;
  assert.ok(Array.isArray(tools));
  assert.equal(tools.length, 6);
  assert.deepEqual(
    tools.map((tool) => (tool as Record<string, unknown>).name),
    [
      "rail.logs.export",
      "rail.logs.import.prepare",
      "rail.logs.query",
      "rail.receipts.get",
      "comms.message.send",
      "comms.message.status",
    ],
  );
});

test("node export remains a safe preview without a live adapter", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "rail.logs.export",
      arguments: {
        node_id: NODE_ID,
        from: "2026-07-21T00:00:00Z",
        to: "2026-07-21T23:59:59Z",
        format: "qel-ndjson",
        redaction_policy: "strict",
        sign: true,
        archive: true,
        receipt_required: true,
        idempotency_key: "rail-1234567890abcdef",
      },
    },
  });

  const toolResult = resultOf(response);
  assert.equal(toolResult.isError, false);
  const structured = toolResult.structuredContent as Record<string, unknown>;
  assert.equal(structured.status, "preview");
  assert.equal(structured.execution_enabled, false);
});

test("rejects secrets embedded in tool arguments", async () => {
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "comms.message.send",
      arguments: {
        channels: ["dropbox"],
        subject: "Export ready",
        message: "See resource link.",
        idempotency_key: "rail-1234567890abcdef",
        api_key: "must-not-be-accepted"
      },
    },
  });

  const toolResult = resultOf(response);
  assert.equal(toolResult.isError, true);
  assert.match(JSON.stringify(toolResult), /Sensitive field is not permitted/);
});

test("communications can be accepted only into an explicitly enabled controlled outbox", { concurrency: false }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "rail-mcp-test-"));
  const oldEnabled = process.env.RAIL_MCP_EXECUTION_ENABLED;
  const oldOutbox = process.env.RAIL_MCP_OUTBOX_DIR;

  process.env.RAIL_MCP_EXECUTION_ENABLED = "true";
  process.env.RAIL_MCP_OUTBOX_DIR = directory;

  try {
    const response = await handleMcpRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "comms.message.send",
        arguments: {
          channels: ["notion", "dropbox"],
          classification: "internal-operational",
          subject: "Node export completed",
          message: "The controlled artifact is ready.",
          resource_links: ["rail://exports/exp-001"],
          receipt_required: true,
          idempotency_key: "rail-1234567890abcdef",
        },
      },
    });

    const toolResult = resultOf(response);
    assert.equal(toolResult.isError, false);
    const record = toolResult.structuredContent as Record<string, unknown>;
    assert.equal(record.status, "accepted-to-controlled-outbox");
    const communicationId = String(record.communication_id);
    const persisted = JSON.parse(await readFile(join(directory, `${communicationId}.json`), "utf8"));
    assert.equal(persisted.communication_id, communicationId);
    assert.equal(persisted.boundary.includes("not proof"), true);
  } finally {
    if (oldEnabled === undefined) delete process.env.RAIL_MCP_EXECUTION_ENABLED;
    else process.env.RAIL_MCP_EXECUTION_ENABLED = oldEnabled;
    if (oldOutbox === undefined) delete process.env.RAIL_MCP_OUTBOX_DIR;
    else process.env.RAIL_MCP_OUTBOX_DIR = oldOutbox;
    await rm(directory, { recursive: true, force: true });
  }
});
