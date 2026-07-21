import assert from "node:assert/strict";
import test from "node:test";

import { authorizeToolCall, authorizationMeta, verifyNodeRegistry } from "./authorization";
import { createTestSecurityFixture, TEST_NODE_ID } from "./test-security";

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

test("verifies a Warden-signed node registry and resolves exact nodes", () => {
  const fixture = createTestSecurityFixture();
  const verified = verifyNodeRegistry(fixture.registry, fixture.trustStore, fixture.context.now);
  assert.equal(verified.digest, fixture.registry.digest);
  assert.equal(verified.nodes.get(TEST_NODE_ID)?.operator_did, "did:digitalme:voi-warehouse-001");
});

test("authorizes an export only after both DigitalMe and Warden proofs verify", () => {
  const fixture = createTestSecurityFixture();
  const result = authorizeToolCall(
    "rail.logs.export",
    EXPORT_ARGS,
    authorizationMeta(fixture.envelope),
    fixture.context,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.decision.status, "authorized");
  assert.equal(result.decision.node_id, TEST_NODE_ID);
  assert.equal(result.decision.proof_methods.length, 2);
  assert.equal(result.node?.status, "controlled-pilot");
});

test("denies an authorization bound to a substituted registry digest", () => {
  const fixture = createTestSecurityFixture();
  fixture.envelope.registry_digest = `sha256:${"0".repeat(64)}`;
  const result = authorizeToolCall(
    "rail.logs.export",
    EXPORT_ARGS,
    authorizationMeta(fixture.envelope),
    fixture.context,
  );
  assert.deepEqual(result, {
    ok: false,
    code: "registry-binding-mismatch",
    message: "Authorization is bound to a different node-registry digest",
  });
});

test("denies expired authorizations", () => {
  const now = new Date("2026-07-21T12:00:00Z");
  const fixture = createTestSecurityFixture({
    now,
    authorizationExpiresAt: new Date(now.getTime() - 1),
  });
  const result = authorizeToolCall(
    "rail.logs.export",
    EXPORT_ARGS,
    authorizationMeta(fixture.envelope),
    fixture.context,
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "authorization-expired");
});

test("denies export windows larger than the Warden grant", () => {
  const fixture = createTestSecurityFixture({ maxExportSeconds: 3_600 });
  const result = authorizeToolCall(
    "rail.logs.export",
    EXPORT_ARGS,
    authorizationMeta(fixture.envelope),
    fixture.context,
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "export-window-exceeds-grant");
});

test("denies suspended registry nodes even with valid signatures", () => {
  const fixture = createTestSecurityFixture({ nodeStatus: "suspended" });
  const result = authorizeToolCall(
    "rail.logs.export",
    EXPORT_ARGS,
    authorizationMeta(fixture.envelope),
    fixture.context,
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "node-inactive");
});

test("denies tools omitted from the signed grant", () => {
  const fixture = createTestSecurityFixture({ grantedTools: ["rail.nodes.resolve"] });
  const result = authorizeToolCall(
    "rail.logs.export",
    EXPORT_ARGS,
    authorizationMeta(fixture.envelope),
    fixture.context,
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "tool-not-granted");
});
