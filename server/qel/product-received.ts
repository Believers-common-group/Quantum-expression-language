import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { z } from "zod";

const digestPattern = /^sha256:[a-f0-9]{64}$/;
const uriPattern = /^[a-z][a-z0-9+.-]*:\/\//i;

const evidenceSchema = z.object({
  type: z.string().min(1).max(100),
  uri: z.string().regex(uriPattern, "evidence URI must include a scheme"),
  digest: z.string().regex(digestPattern),
});

export const productReceivedRequestSchema = z.object({
  grn: z.object({
    id: z.string().min(1).max(120),
    issued_at: z.string().datetime({ offset: true }),
    source_system: z.enum(["logic-erp", "easycom", "manual-controlled"]),
    document_uri: z.string().regex(uriPattern, "GRN URI must include a scheme"),
    document_digest: z.string().regex(digestPattern),
  }),
  warehouse: z.object({
    node_id: z.string().min(1).max(200),
    jurisdiction: z.string().min(2).max(50),
  }),
  operator: z.object({
    id: z.string().min(1).max(200),
    role: z.string().min(1).max(100),
    license_reference: z.string().min(1).max(240),
  }),
  shipment: z.object({
    dispatch_expression: z.string().min(1).max(240).optional(),
    purchase_order_id: z.string().min(1).max(120),
    supplier_id: z.string().min(1).max(200),
  }),
  product: z.object({
    batch_id: z.string().min(1).max(200),
    sku: z.string().min(1).max(120),
    style_code: z.string().min(1).max(120),
    quantity: z.number().int().positive(),
    unit: z.literal("piece"),
  }),
  occurred_at: z.string().datetime({ offset: true }),
  evidence: z.array(evidenceSchema).min(1).max(20),
});

export type ProductReceivedRequest = z.infer<typeof productReceivedRequestSchema>;

export interface ProductReceivedConfig {
  enabled: boolean;
  ingestApiKey?: string;
  riverOsEndpoint?: string;
  riverOsApiKey?: string;
  warehouseNodes: Set<string>;
  operatorLicenses: Map<string, Set<string>>;
}

export interface ReadinessResult {
  ready: boolean;
  enabled: boolean;
  missing: string[];
  warehouseNodeCount: number;
  licensedOperatorCount: number;
}

export interface RiverOsReceipt {
  receipt_id: string;
  received_at: string;
  evidence_uri: string;
  expression_digest: string;
  status: "accepted";
}

export interface ProductReceivedSubmission {
  expression: Record<string, unknown>;
  expressionDigest: string;
  receipt: RiverOsReceipt;
  replayed: boolean;
}

function parseStringSet(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function parseOperatorLicenses(value: string | undefined): Map<string, Set<string>> {
  if (!value) return new Map();
  const parsed = JSON.parse(value) as Record<string, unknown>;
  const licenses = new Map<string, Set<string>>();

  for (const [operatorId, references] of Object.entries(parsed)) {
    if (!Array.isArray(references) || references.some((item) => typeof item !== "string")) {
      throw new Error(`QEL_PRODUCT_RECEIVED_LICENSES[${operatorId}] must be an array of strings`);
    }
    licenses.set(operatorId, new Set(references));
  }

  return licenses;
}

export function loadProductReceivedConfig(
  env: NodeJS.ProcessEnv = process.env,
): ProductReceivedConfig {
  return {
    enabled: env.QEL_PRODUCT_RECEIVED_ENABLED === "true",
    ingestApiKey: env.QEL_INGEST_API_KEY,
    riverOsEndpoint: env.RIVEROS_RECEIPT_ENDPOINT,
    riverOsApiKey: env.RIVEROS_API_KEY,
    warehouseNodes: parseStringSet(env.QEL_WAREHOUSE_NODES),
    operatorLicenses: parseOperatorLicenses(env.QEL_PRODUCT_RECEIVED_LICENSES),
  };
}

export function getProductReceivedReadiness(config: ProductReceivedConfig): ReadinessResult {
  const missing: string[] = [];
  if (!config.enabled) missing.push("QEL_PRODUCT_RECEIVED_ENABLED=true");
  if (!config.ingestApiKey) missing.push("QEL_INGEST_API_KEY");
  if (!config.riverOsEndpoint) missing.push("RIVEROS_RECEIPT_ENDPOINT");
  if (config.warehouseNodes.size === 0) missing.push("QEL_WAREHOUSE_NODES");
  if (config.operatorLicenses.size === 0) missing.push("QEL_PRODUCT_RECEIVED_LICENSES");

  return {
    ready: missing.length === 0,
    enabled: config.enabled,
    missing,
    warehouseNodeCount: config.warehouseNodes.size,
    licensedOperatorCount: config.operatorLicenses.size,
  };
}

export function constantTimeSecretMatches(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  if (providedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(providedBytes, expectedBytes);
}

export function validateOperationalAuthority(
  request: ProductReceivedRequest,
  config: ProductReceivedConfig,
): string[] {
  const errors: string[] = [];
  if (!config.warehouseNodes.has(request.warehouse.node_id)) {
    errors.push("warehouse node is not enabled for the Product Received pilot");
  }

  const allowedLicenses = config.operatorLicenses.get(request.operator.id);
  if (!allowedLicenses?.has(request.operator.license_reference)) {
    errors.push("operator and licence reference are not enabled for this pilot");
  }

  return errors;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
  return `{${entries.join(",")}}`;
}

export function sha256Canonical(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalize(value)).digest("hex")}`;
}

export function buildProductReceivedExpression(
  request: ProductReceivedRequest,
  options: { expressionId?: string; issuedAt?: string } = {},
): Record<string, unknown> {
  const issuedAt = options.issuedAt ?? new Date().toISOString();
  const expressionId = options.expressionId ?? `urn:qel:expression:${randomUUID()}`;

  const expression: Record<string, unknown> = {
    qel_version: "0.1.0-draft",
    id: expressionId,
    kind: "observation",
    type: "org.voijeans.inventory.product-received.v1",
    status: "asserted",
    issuer: {
      id: request.operator.id,
      role: request.operator.role,
    },
    actor: {
      id: request.operator.id,
      role: request.operator.role,
    },
    subject: {
      id: request.product.batch_id,
      type: "product-batch",
    },
    transition: {
      from: "dispatched",
      to: "received",
    },
    place: {
      node: request.warehouse.node_id,
      jurisdiction: request.warehouse.jurisdiction,
    },
    time: {
      occurred_at: request.occurred_at,
      observed_at: issuedAt,
      issued_at: issuedAt,
    },
    authority: [
      {
        type: "warehouse-receiving-mandate",
        reference: request.operator.license_reference,
        issuer: "urn:empireos:license-registry",
      },
    ],
    consent: {
      status: "not-applicable",
      basis: "commercial-custody-transfer",
    },
    evidence: [
      {
        type: "goods-receipt-note",
        uri: request.grn.document_uri,
        digest: request.grn.document_digest,
      },
      ...request.evidence,
    ],
    relationships: request.shipment.dispatch_expression
      ? [
          {
            relation: "caused_by",
            expression: request.shipment.dispatch_expression,
          },
        ]
      : [],
    payload: {
      grn_id: request.grn.id,
      grn_issued_at: request.grn.issued_at,
      source_system: request.grn.source_system,
      purchase_order_id: request.shipment.purchase_order_id,
      supplier_id: request.shipment.supplier_id,
      sku: request.product.sku,
      style_code: request.product.style_code,
      quantity: request.product.quantity,
      unit: request.product.unit,
    },
    proof: [
      {
        type: "OperationalIngestAssertion",
        verification_method: `${request.operator.id}#configured-ingest-authority`,
        proof_value: "pending-riveros-receipt",
      },
    ],
  };

  const payloadDigest = sha256Canonical(expression.payload);
  const proof = expression.proof as Array<Record<string, unknown>>;
  proof[0].payload_digest = payloadDigest;
  return expression;
}

export async function requestRiverOsReceipt(
  expression: Record<string, unknown>,
  idempotencyKey: string,
  config: ProductReceivedConfig,
  fetchImplementation: typeof fetch = fetch,
): Promise<RiverOsReceipt> {
  if (!config.riverOsEndpoint) throw new Error("RiverOS receipt endpoint is not configured");

  const expressionDigest = sha256Canonical(expression);
  const response = await fetchImplementation(config.riverOsEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      ...(config.riverOsApiKey ? { Authorization: `Bearer ${config.riverOsApiKey}` } : {}),
    },
    body: JSON.stringify({ expression, expression_digest: expressionDigest }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`RiverOS receipt request failed (${response.status}): ${detail}`);
  }

  const receiptSchema = z.object({
    receipt_id: z.string().min(1),
    received_at: z.string().datetime({ offset: true }),
    evidence_uri: z.string().regex(uriPattern),
    expression_digest: z.string().regex(digestPattern),
    status: z.literal("accepted"),
  });
  const receipt = receiptSchema.parse(await response.json());

  if (receipt.expression_digest !== expressionDigest) {
    throw new Error("RiverOS receipt digest does not match the submitted expression");
  }

  return receipt;
}
