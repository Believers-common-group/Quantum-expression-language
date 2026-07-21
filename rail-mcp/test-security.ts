import { generateKeyPairSync, sign } from "node:crypto";

import {
  type AuthorizationEnvelope,
  type SecurityContext,
  type SignedNodeRegistry,
  type TrustStore,
  authorizationSigningPayload,
  calculateRegistryDigest,
  canonicalJson,
  registrySigningPayload,
} from "./authorization";

export const TEST_NODE_ID = "vsr://mainnet/IN-KA/operational/warehouse/voi/bangalore/warehouse-001";

function iso(date: Date): string {
  return date.toISOString();
}

function signPayload(payload: Record<string, unknown>, privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"]): string {
  return sign(null, Buffer.from(canonicalJson(payload), "utf8"), privateKey).toString("base64url");
}

export function createTestSecurityFixture(options?: {
  now?: Date;
  nodeStatus?: "controlled-pilot" | "active" | "suspended" | "revoked";
  authorizationExpiresAt?: Date;
  registryExpiresAt?: Date;
  grantedTools?: string[];
  grantedNodes?: string[];
  grantedChannels?: string[];
  grantedClassifications?: string[];
  maxExportSeconds?: number;
  maxQueryLimit?: number;
}): {
  context: SecurityContext;
  envelope: AuthorizationEnvelope;
  registry: SignedNodeRegistry;
  trustStore: TrustStore;
} {
  const now = options?.now ?? new Date("2026-07-21T12:00:00Z");
  const actor = generateKeyPairSync("ed25519");
  const policy = generateKeyPairSync("ed25519");
  const registryAuthority = generateKeyPairSync("ed25519");

  const trustStore: TrustStore = {
    schema: "org.believerscommon.rail.trust-store.v1",
    version: "test-1",
    keys: [
      {
        verification_method: "did:digitalme:operator-001#key-1",
        role: "digitalme-actor",
        public_key_pem: actor.publicKey.export({ type: "spki", format: "pem" }).toString(),
        status: "active",
      },
      {
        verification_method: "urn:warden:policy:test#key-1",
        role: "warden-policy",
        public_key_pem: policy.publicKey.export({ type: "spki", format: "pem" }).toString(),
        status: "active",
      },
      {
        verification_method: "urn:warden:registry:test#key-1",
        role: "warden-registry",
        public_key_pem: registryAuthority.publicKey.export({ type: "spki", format: "pem" }).toString(),
        status: "active",
      },
    ],
  };

  const registry: SignedNodeRegistry = {
    schema: "org.believerscommon.rail.node-registry.v1",
    registry_id: "registry_test_001",
    version: "0.1.0",
    issued_at: iso(new Date(now.getTime() - 60_000)),
    expires_at: iso(options?.registryExpiresAt ?? new Date(now.getTime() + 3_600_000)),
    nodes: [
      {
        node_id: TEST_NODE_ID,
        operator_did: "did:digitalme:voi-warehouse-001",
        status: options?.nodeStatus ?? "controlled-pilot",
        jurisdiction: "IN-KA",
        permitted_tools: [
          "rail.nodes.resolve",
          "rail.logs.export",
          "rail.logs.import.prepare",
          "rail.logs.query",
        ],
        authority_refs: ["urn:empireos:license:warehouse-receiving-test"],
        evidence_sink: "urn:riveros:node:receipt-test",
      },
    ],
    digest: "",
    proof: {
      type: "Ed25519Signature",
      role: "warden-registry",
      verification_method: "urn:warden:registry:test#key-1",
      created: iso(now),
      signature: "pending",
    },
  };
  registry.digest = calculateRegistryDigest(registry);
  registry.proof.signature = signPayload(registrySigningPayload(registry), registryAuthority.privateKey);

  const envelope: AuthorizationEnvelope = {
    schema: "org.believerscommon.rail.authorization.v1",
    authorization_id: "auth_test_operator_001",
    issuer_did: "did:digitalme:operator-001",
    subject_did: "did:digitalme:operator-001",
    audience: "qel-pinyin-rail-mcp",
    issued_at: iso(new Date(now.getTime() - 30_000)),
    not_before: iso(new Date(now.getTime() - 20_000)),
    expires_at: iso(options?.authorizationExpiresAt ?? new Date(now.getTime() + 600_000)),
    nonce: "test-nonce-0000000000001",
    registry_digest: registry.digest,
    grants: {
      tools: options?.grantedTools ?? [
        "rail.nodes.resolve",
        "rail.logs.export",
        "rail.logs.import.prepare",
        "rail.logs.query",
        "rail.receipts.get",
        "comms.message.send",
        "comms.message.status",
      ],
      nodes: options?.grantedNodes ?? [TEST_NODE_ID],
      channels: options?.grantedChannels ?? ["notion", "dropbox"],
      classifications: options?.grantedClassifications ?? ["internal-operational"],
      max_export_seconds: options?.maxExportSeconds ?? 86_400,
      max_query_limit: options?.maxQueryLimit ?? 500,
    },
    proofs: [
      {
        type: "Ed25519Signature",
        role: "digitalme-actor",
        verification_method: "did:digitalme:operator-001#key-1",
        created: iso(now),
        signature: "pending",
      },
      {
        type: "Ed25519Signature",
        role: "warden-policy",
        verification_method: "urn:warden:policy:test#key-1",
        created: iso(now),
        signature: "pending",
      },
    ],
  };

  const authorizationPayload = authorizationSigningPayload(envelope);
  envelope.proofs[0].signature = signPayload(authorizationPayload, actor.privateKey);
  envelope.proofs[1].signature = signPayload(authorizationPayload, policy.privateKey);

  return {
    context: { trustStore, registry, now },
    envelope,
    registry,
    trustStore,
  };
}
