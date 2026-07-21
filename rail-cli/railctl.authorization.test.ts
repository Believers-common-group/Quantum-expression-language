import assert from "node:assert/strict";
import test from "node:test";

import { buildToolCall, compileRailCommand } from "./railctl";

const NODE_ID = "vsr://mainnet/IN-KA/operational/warehouse/voi/bangalore/warehouse-001";

test("compiles Pinyin node resolution to the canonical resolver", async () => {
  const { compiled } = await compileRailCommand([
    "chaxun",
    "jiedian",
    "--jiedian",
    NODE_ID,
  ]);
  assert.equal(compiled.tool, "rail.nodes.resolve");
  assert.equal(compiled.arguments.node_id, NODE_ID);
  assert.equal(compiled.execution.authorization_required, true);
});

test("places a signed capability in MCP metadata without changing tool arguments", async () => {
  const { compiled } = await compileRailCommand([
    "chaxun",
    "jiedian",
    "--jiedian",
    NODE_ID,
  ]);
  const envelope = {
    schema: "org.believerscommon.rail.authorization.v1",
    authorization_id: "auth-example-001",
  };
  const request = buildToolCall(compiled, 9, envelope);
  const params = request.params as Record<string, unknown>;
  assert.deepEqual(params.arguments, compiled.arguments);
  assert.deepEqual(params._meta, {
    "org.believerscommon/authorization": envelope,
  });
});

test("accepts the Pinyin authorization-file control without exposing file contents", async () => {
  const { controls } = await compileRailCommand([
    "chaxun",
    "jiedian",
    "--jiedian",
    NODE_ID,
    "--shouquan-wenjian",
    "/secure/authorization.json",
  ]);
  assert.equal(controls.authorizationFile, "/secure/authorization.json");
});
