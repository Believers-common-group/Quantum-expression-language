import assert from "node:assert/strict";
import test from "node:test";

import { buildToolCall, compileRailCommand } from "./railctl";

const NODE_ID = "vsr://mainnet/IN-KA/operational/warehouse/voi/bangalore/warehouse-001";

test("compiles Pinyin node-log export into a canonical MCP tool call", async () => {
  const { compiled, controls } = await compileRailCommand([
    "daochu",
    "jiedian-rizhi",
    "--jiedian",
    NODE_ID,
    "--kaishi",
    "2026-07-21T00:00:00Z",
    "--jieshu",
    "2026-07-21T23:59:59Z",
  ]);

  assert.equal(controls.execute, false);
  assert.equal(compiled.tool, "rail.logs.export");
  assert.equal(compiled.arguments.format, "qel-ndjson");
  assert.equal(compiled.arguments.redaction_policy, "strict");
  assert.match(String(compiled.arguments.idempotency_key), /^rail-[a-f0-9]{40}$/);

  assert.deepEqual(buildToolCall(compiled), {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "rail.logs.export",
      arguments: compiled.arguments,
    },
  });
});

test("normalizes a controlled import digest and enforces quarantine", async () => {
  const digest = "A".repeat(64);
  const { compiled } = await compileRailCommand([
    "daoru",
    "jiedian-rizhi",
    "--jiedian",
    NODE_ID,
    "--laiyuan",
    "./warehouse-001.zip",
    "--sha256",
    digest,
  ]);

  assert.equal(compiled.tool, "rail.logs.import.prepare");
  assert.equal(compiled.arguments.expected_digest, `sha256:${digest.toLowerCase()}`);
  assert.equal(compiled.arguments.quarantine, true);
  assert.equal(compiled.arguments.validate, true);
});

test("compiles communications channels and resource links as lists", async () => {
  const { compiled } = await compileRailCommand([
    "fasong",
    "tongxin",
    "--pindao",
    "slack,notion,dropbox",
    "--zhuti",
    "Node export completed",
    "--xinxi",
    "The controlled export is ready.",
    "--ziyuan",
    "rail://exports/exp-001,rail://receipts/rcpt-001",
  ]);

  assert.equal(compiled.tool, "comms.message.send");
  assert.deepEqual(compiled.arguments.channels, ["slack", "notion", "dropbox"]);
  assert.deepEqual(compiled.arguments.resource_links, [
    "rail://exports/exp-001",
    "rail://receipts/rcpt-001",
  ]);
});

test("refuses execution without exact canonical confirmation", async () => {
  await assert.rejects(
    compileRailCommand([
      "chaxun",
      "huizhi",
      "--bianhao",
      "rcpt_001",
      "--execute",
      "--confirm",
      "rail.logs.export",
    ]),
    /Execution requires --confirm rail\.receipts\.get/,
  );
});

test("rejects unregistered node addressing", async () => {
  await assert.rejects(
    compileRailCommand([
      "chaxun",
      "jiedian-rizhi",
      "--jiedian",
      "warehouse-001",
    ]),
    /node_id must use vsr:\/\//,
  );
});
