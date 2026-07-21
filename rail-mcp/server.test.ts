import assert from "node:assert/strict";
import test from "node:test";

import { authorizationMeta } from "./authorization";
import { handleMcpRequest } from "./server";
import { createTestSecurityFixture, TEST_NODE_ID } from "./test-security";

function resultOf(response: Record<string, unknown> | null): Record<string, unknown> {
  assert.ok(response);
  const result = response.result;
  assert.ok(result && typeof result === "object" && !Array.isArray(result));
  return result as Record<string, unknown>;
}

const EXPORT_ARGS = {
  node_id: TEST_NODE_ID,
  from: "2026-07-21T00:00:00Z",
  to: "2026-07-21T23:59:59Z",
  format: "qel-ndjson",
  redaction_policy: "strict",
  sign: true,
  archive: true,
  receipt_required: true,
  idempotency_key: "rail-1234567890abcdef",
};

test("declares authorization requirements during initialization", async () => {
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
  assert.match(String(result.instructions), /authorization envelope/);
});

test("lists seven canonical tools", async () => {
  const response = await handleMcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const tools = resultOf(response).tools;
  assert.ok(Array.isArray(tools));
  assert.equal(tools.length, 7);
  assert.equal((tools[0] as Record<string, unknown>).name, "rail.nodes.resolve");
});

test("denies a tool call without signed metadata", async () => {
  const fixture = createTestSecurityFixture();
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "rail.logs.export", arguments: EXPORT_ARGS },
  }, fixture.context);
  const result = resultOf(response);
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result), /authorization-missing/);
});

test("resolves an exact node from the signed registry", async () => {
  const fixture = createTestSecurityFixture();
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "rail.nodes.resolve",
      arguments: { node_id: TEST_NODE_ID },
      _meta: authorizationMeta(fixture.envelope),
    },
  }, fixture.context);
  const result = resultOf(response);
  assert.equal(result.isError, false);
  const structured = result.structuredContent as Record<string, unknown>;
  assert.equal(structured.status, "resolved");
});

test("authorized export remains preview-only", async () => {
  const fixture = createTestSecurityFixture();
  const response = await handleMcpRequest({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "rail.logs.export",
      arguments: EXPORT_ARGS,
      _meta: authorizationMeta(fixture.envelope),
    },
  }, fixture.context);
  const result = resultOf(response);
  assert.equal(result.isError, false);
  const structured = result.structuredContent as Record<string, unknown>;
  assert.equal(structured.status, "preview");
  assert.equal(structured.execution_enabled, false);
});
