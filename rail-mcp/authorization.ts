import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { readFile } from "node:fs/promises";

type JsonObject = Record<string, unknown>;

type ProofRole = "digitalme-actor" | "warden-policy" | "warden-registry";

type DetachedProof = {
  type: "Ed25519Signature";
  role: ProofRole;
  verification_method: string;
  created: string;
  signature: string;
};

export type TrustStore = {
  schema: "org.believerscommon.rail.trust-store.v1";
  version: string;
  keys: Array<{
    verification_method: string;
    role: ProofRole;
    public_key_pem: string;
    status: "active" | "revoked";
  }>;
};

export type AuthorizationEnvelope = {
  schema: "org.believerscommon.rail.authorization.v1";
  authorization_id: string;
  issuer_did: string;
  subject_did: string;
  audience: "qel-pinyin-rail-mcp";
  issued_at: string;
  not_before: string;
  expires_at: string;
  nonce: string;
  registry_digest: string;
  grants: {
    tools: string[];
    nodes: string[];
    channels: string[];
    classifications: string[];
    max_export_seconds: number;
    max_query_limit: number;
  };
  proofs: DetachedProof[];
};

export type RailNodeRecord = {
  node_id: string;
  operator_did: string;
  status: "controlled-pilot" | "active" | "suspended" | "revoked";
  jurisdiction: string;
  permitted_tools: string[];
  authority_refs: string[];
  evidence_sink: string;
};

export type SignedNodeRegistry = {
  schema: "org.believerscommon.rail.node-registry.v1";
  registry_id: string;
  version: string;
  issued_at: string;
  expires_at: string;
  nodes: RailNodeRecord[];
  digest: string;
  proof: DetachedProof;
};

export type SecurityContext = {
  trustStore: TrustStore;
  registry: SignedNodeRegistry;
  now?: Date;
};

export type AuthorizationDecision = {
  decision_id: string;
  authorization_id: string;
  subject_did: string;
  issuer_did: string;
  tool: string;
  node_id: string | null;
  registry_id: string;
  registry_digest: string;
  proof_methods: string[];
  evaluated_at: string;
  status: "authorized";
};

export type AuthorizationResult =
  | { ok: true; decision: AuthorizationDecision; node?: RailNodeRecord }
  | { ok: false; code: string; message: string };

const AUTHORIZATION_META_KEY = "org.believerscommon/authorization";

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as JsonObject;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function withoutKeys<T extends JsonObject>(value: T, keys: string[]): JsonObject {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseTimestamp(value: unknown, name: string): Date {
  if (typeof value !== "string") throw new Error(`${name} must be an ISO date-time string`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${name} must be a valid ISO date-time string`);
  return parsed;
}

function assertStringArray(value: unknown, name: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${name} must be an array of strings`);
  }
}

function verifyProof(
  payload: JsonObject,
  proof: DetachedProof,
  role: ProofRole,
  trustStore: TrustStore,
  now: Date,
): string {
  if (!isObject(proof) || proof.type !== "Ed25519Signature" || proof.role !== role) {
    throw new Error(`Missing or invalid ${role} proof`);
  }
  parseTimestamp(proof.created, `${role}.created`);
  if (new Date(proof.created).getTime() > now.getTime() + 5 * 60_000) {
    throw new Error(`${role} proof creation time is in the future`);
  }
  const trustKey = trustStore.keys.find(
    (key) => key.verification_method === proof.verification_method && key.role === role,
  );
  if (!trustKey || trustKey.status !== "active") {
    throw new Error(`No active trust key for ${role}: ${proof.verification_method}`);
  }
  if (typeof proof.signature !== "string" || !/^[A-Za-z0-9_-]+$/.test(proof.signature)) {
    throw new Error(`${role} signature must be base64url`);
  }
  const verified = verifySignature(
    null,
    Buffer.from(canonicalJson(payload), "utf8"),
    createPublicKey(trustKey.public_key_pem),
    Buffer.from(proof.signature, "base64url"),
  );
  if (!verified) throw new Error(`${role} signature verification failed`);
  return proof.verification_method;
}

export function registrySigningPayload(registry: SignedNodeRegistry): JsonObject {
  return withoutKeys(registry as unknown as JsonObject, ["digest", "proof"]);
}

export function authorizationSigningPayload(envelope: AuthorizationEnvelope): JsonObject {
  return withoutKeys(envelope as unknown as JsonObject, ["proofs"]);
}

export function calculateRegistryDigest(registry: SignedNodeRegistry): string {
  return sha256(registrySigningPayload(registry));
}

function verifyTrustStore(trustStore: TrustStore): void {
  if (!isObject(trustStore) || trustStore.schema !== "org.believerscommon.rail.trust-store.v1") {
    throw new Error("Invalid rail trust store schema");
  }
  if (!Array.isArray(trustStore.keys) || trustStore.keys.length < 3) {
    throw new Error("Trust store must contain DigitalMe, Warden policy and Warden registry keys");
  }
  const ids = new Set<string>();
  for (const key of trustStore.keys) {
    if (!isObject(key) || typeof key.verification_method !== "string" || typeof key.public_key_pem !== "string") {
      throw new Error("Invalid trust-store key entry");
    }
    if (ids.has(key.verification_method)) throw new Error(`Duplicate trust key: ${key.verification_method}`);
    ids.add(key.verification_method);
  }
}

export function verifyNodeRegistry(
  registry: SignedNodeRegistry,
  trustStore: TrustStore,
  now = new Date(),
): { digest: string; nodes: Map<string, RailNodeRecord>; proofMethod: string } {
  verifyTrustStore(trustStore);
  if (!isObject(registry) || registry.schema !== "org.believerscommon.rail.node-registry.v1") {
    throw new Error("Invalid node-registry schema");
  }
  const issuedAt = parseTimestamp(registry.issued_at, "registry.issued_at");
  const expiresAt = parseTimestamp(registry.expires_at, "registry.expires_at");
  if (issuedAt.getTime() > now.getTime() + 5 * 60_000) throw new Error("Node registry is not yet valid");
  if (expiresAt.getTime() <= now.getTime()) throw new Error("Node registry has expired");
  if (!Array.isArray(registry.nodes)) throw new Error("Node registry nodes must be an array");

  const payload = registrySigningPayload(registry);
  const digest = sha256(payload);
  if (registry.digest !== digest) throw new Error("Node-registry digest does not match canonical content");
  const proofMethod = verifyProof(payload, registry.proof, "warden-registry", trustStore, now);

  const nodes = new Map<string, RailNodeRecord>();
  for (const node of registry.nodes) {
    if (!isObject(node) || typeof node.node_id !== "string" || !/^(vsr:\/\/|urn:vsr:node:)/.test(node.node_id)) {
      throw new Error("Node registry contains an invalid node_id");
    }
    if (nodes.has(node.node_id)) throw new Error(`Duplicate node registry entry: ${node.node_id}`);
    assertStringArray(node.permitted_tools, `${node.node_id}.permitted_tools`);
    assertStringArray(node.authority_refs, `${node.node_id}.authority_refs`);
    nodes.set(node.node_id, node as unknown as RailNodeRecord);
  }
  return { digest, nodes, proofMethod };
}

function verifyEnvelopeShape(envelope: AuthorizationEnvelope): void {
  if (!isObject(envelope) || envelope.schema !== "org.believerscommon.rail.authorization.v1") {
    throw new Error("Invalid authorization-envelope schema");
  }
  if (envelope.audience !== "qel-pinyin-rail-mcp") throw new Error("Authorization audience mismatch");
  if (typeof envelope.authorization_id !== "string" || envelope.authorization_id.length < 8) {
    throw new Error("authorization_id is invalid");
  }
  if (typeof envelope.issuer_did !== "string" || !envelope.issuer_did.startsWith("did:digitalme:")) {
    throw new Error("issuer_did must be a DigitalMe DID");
  }
  if (typeof envelope.subject_did !== "string" || !envelope.subject_did.startsWith("did:digitalme:")) {
    throw new Error("subject_did must be a DigitalMe DID");
  }
  if (!isObject(envelope.grants)) throw new Error("Authorization grants are required");
  assertStringArray(envelope.grants.tools, "grants.tools");
  assertStringArray(envelope.grants.nodes, "grants.nodes");
  assertStringArray(envelope.grants.channels, "grants.channels");
  assertStringArray(envelope.grants.classifications, "grants.classifications");
  if (!Number.isInteger(envelope.grants.max_export_seconds) || envelope.grants.max_export_seconds < 1) {
    throw new Error("grants.max_export_seconds must be a positive integer");
  }
  if (!Number.isInteger(envelope.grants.max_query_limit) || envelope.grants.max_query_limit < 1) {
    throw new Error("grants.max_query_limit must be a positive integer");
  }
  if (!Array.isArray(envelope.proofs)) throw new Error("Authorization proofs are required");
}

function deny(code: string, message: string): AuthorizationResult {
  return { ok: false, code, message };
}

export function authorizeToolCall(
  tool: string,
  args: JsonObject,
  meta: JsonObject | undefined,
  context: SecurityContext,
): AuthorizationResult {
  try {
    const now = context.now ?? new Date();
    const verifiedRegistry = verifyNodeRegistry(context.registry, context.trustStore, now);
    const candidate = meta?.[AUTHORIZATION_META_KEY];
    if (!isObject(candidate)) return deny("authorization-missing", `Missing ${AUTHORIZATION_META_KEY} metadata`);
    const envelope = candidate as unknown as AuthorizationEnvelope;
    verifyEnvelopeShape(envelope);

    const issuedAt = parseTimestamp(envelope.issued_at, "authorization.issued_at");
    const notBefore = parseTimestamp(envelope.not_before, "authorization.not_before");
    const expiresAt = parseTimestamp(envelope.expires_at, "authorization.expires_at");
    if (issuedAt.getTime() > now.getTime() + 5 * 60_000) return deny("authorization-not-yet-issued", "Authorization issue time is in the future");
    if (notBefore.getTime() > now.getTime()) return deny("authorization-not-yet-valid", "Authorization is not yet valid");
    if (expiresAt.getTime() <= now.getTime()) return deny("authorization-expired", "Authorization has expired");
    if (expiresAt.getTime() <= notBefore.getTime()) return deny("authorization-window-invalid", "Authorization validity window is invalid");
    if (envelope.registry_digest !== verifiedRegistry.digest) {
      return deny("registry-binding-mismatch", "Authorization is bound to a different node-registry digest");
    }

    const payload = authorizationSigningPayload(envelope);
    const actorProof = envelope.proofs.find((proof) => proof.role === "digitalme-actor");
    const policyProof = envelope.proofs.find((proof) => proof.role === "warden-policy");
    if (!actorProof || !policyProof) return deny("authorization-proof-missing", "DigitalMe actor and Warden policy proofs are both required");
    const proofMethods = [
      verifyProof(payload, actorProof, "digitalme-actor", context.trustStore, now),
      verifyProof(payload, policyProof, "warden-policy", context.trustStore, now),
    ];

    if (!envelope.grants.tools.includes(tool)) return deny("tool-not-granted", `Authorization does not grant ${tool}`);

    const nodeId = typeof args.node_id === "string" ? args.node_id : null;
    let node: RailNodeRecord | undefined;
    if (nodeId) {
      if (!envelope.grants.nodes.includes(nodeId)) return deny("node-not-granted", `Authorization does not grant node ${nodeId}`);
      node = verifiedRegistry.nodes.get(nodeId);
      if (!node) return deny("node-not-registered", `Node is not present in the signed registry: ${nodeId}`);
      if (!node.permitted_tools.includes(tool)) return deny("node-tool-not-permitted", `Node ${nodeId} does not permit ${tool}`);
      if (!["controlled-pilot", "active"].includes(node.status)) return deny("node-inactive", `Node ${nodeId} status is ${node.status}`);
    }

    if (tool === "rail.logs.export") {
      const from = parseTimestamp(args.from, "arguments.from");
      const to = parseTimestamp(args.to, "arguments.to");
      const seconds = (to.getTime() - from.getTime()) / 1000;
      if (seconds < 0) return deny("export-window-invalid", "Export end time precedes start time");
      if (seconds > envelope.grants.max_export_seconds) {
        return deny("export-window-exceeds-grant", `Export window exceeds ${envelope.grants.max_export_seconds} seconds`);
      }
    }

    if (tool === "rail.logs.query") {
      const limit = typeof args.limit === "number" ? args.limit : 100;
      if (limit > envelope.grants.max_query_limit) {
        return deny("query-limit-exceeds-grant", `Query limit exceeds ${envelope.grants.max_query_limit}`);
      }
    }

    if (tool === "comms.message.send") {
      const channels = Array.isArray(args.channels) ? args.channels.filter((item): item is string => typeof item === "string") : [];
      const unauthorizedChannel = channels.find((channel) => !envelope.grants.channels.includes(channel));
      if (unauthorizedChannel) return deny("channel-not-granted", `Authorization does not grant channel ${unauthorizedChannel}`);
      const classification = typeof args.classification === "string" ? args.classification : "internal-operational";
      if (!envelope.grants.classifications.includes(classification)) {
        return deny("classification-not-granted", `Authorization does not grant classification ${classification}`);
      }
    }

    const evaluatedAt = now.toISOString();
    const decision: AuthorizationDecision = {
      decision_id: sha256({ authorization_id: envelope.authorization_id, tool, args, registry_digest: verifiedRegistry.digest, evaluated_at: evaluatedAt }).slice(7, 39),
      authorization_id: envelope.authorization_id,
      subject_did: envelope.subject_did,
      issuer_did: envelope.issuer_did,
      tool,
      node_id: nodeId,
      registry_id: context.registry.registry_id,
      registry_digest: verifiedRegistry.digest,
      proof_methods: proofMethods,
      evaluated_at: evaluatedAt,
      status: "authorized",
    };
    return { ok: true, decision, ...(node ? { node } : {}) };
  } catch (error) {
    return deny("authorization-invalid", error instanceof Error ? error.message : String(error));
  }
}

export function authorizationMeta(envelope: AuthorizationEnvelope): JsonObject {
  return { [AUTHORIZATION_META_KEY]: envelope };
}

export async function loadSecurityContextFromEnvironment(): Promise<SecurityContext> {
  const trustStorePath = process.env.RAIL_TRUST_STORE_PATH;
  const registryPath = process.env.RAIL_NODE_REGISTRY_PATH;
  if (!trustStorePath || !registryPath) {
    throw new Error("RAIL_TRUST_STORE_PATH and RAIL_NODE_REGISTRY_PATH are required for tools/call");
  }
  const [trustStoreContent, registryContent] = await Promise.all([
    readFile(trustStorePath, "utf8"),
    readFile(registryPath, "utf8"),
  ]);
  return {
    trustStore: JSON.parse(trustStoreContent) as TrustStore,
    registry: JSON.parse(registryContent) as SignedNodeRegistry,
  };
}
