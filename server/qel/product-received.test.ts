import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProductReceivedExpression,
  getProductReceivedReadiness,
  productReceivedRequestSchema,
  requestRiverOsReceipt,
  sha256Canonical,
  validateOperationalAuthority,
  type ProductReceivedConfig,
  type ProductReceivedRequest,
} from "./product-received";

const digest = `sha256:${"a".repeat(64)}`;

const request: ProductReceivedRequest = {
  grn: {
    id: "GRN-CONTROLLED-001",
    issued_at: "2026-07-21T10:30:00+05:30",
    source_system: "logic-erp",
    document_uri: "riveros://pending/grn-controlled-001",
    document_digest: digest,
  },
  warehouse: {
    node_id: "urn:vsr:node:warehouse-001",
    jurisdiction: "IN-KA",
  },
  operator: {
    id: "did:digitalme:operator-001",
    role: "receiving-operator",
    license_reference: "urn:empireos:license:warehouse-receiving-001",
  },
  shipment: {
    purchase_order_id: "PO-CONTROLLED-001",
    supplier_id: "urn:organization:supplier-001",
  },
  product: {
    batch_id: "urn:product-batch:voi:controlled-001",
    sku: "VOI-CONTROLLED-SKU",
    style_code: "VOI-CONTROLLED-STYLE",
    quantity: 10,
    unit: "piece",
  },
  occurred_at: "2026-07-21T10:30:00+05:30",
  evidence: [
    {
      type: "receiving-scan",
      uri: "riveros://pending/receiving-scan-controlled-001",
      digest,
    },
  ],
};

function config(overrides: Partial<ProductReceivedConfig> = {}): ProductReceivedConfig {
  return {
    enabled: true,
    ingestApiKey: "controlled-secret",
    riverOsEndpoint: "https://riveros.example.test/receipts",
    warehouseNodes: new Set([request.warehouse.node_id]),
    operatorLicenses: new Map([
      [request.operator.id, new Set([request.operator.license_reference])],
    ]),
    ...overrides,
  };
}

test("readiness requires every production gate", () => {
  const result = getProductReceivedReadiness(
    config({ enabled: false, riverOsEndpoint: undefined, warehouseNodes: new Set() }),
  );
  assert.equal(result.ready, false);
  assert.ok(result.missing.includes("QEL_PRODUCT_RECEIVED_ENABLED=true"));
  assert.ok(result.missing.includes("RIVEROS_RECEIPT_ENDPOINT"));
  assert.ok(result.missing.includes("QEL_WAREHOUSE_NODES"));
});

test("request schema and operational authority both pass for the controlled fixture", () => {
  assert.equal(productReceivedRequestSchema.safeParse(request).success, true);
  assert.deepEqual(validateOperationalAuthority(request, config()), []);
});

test("an unlicensed operator is rejected even when the request is structurally valid", () => {
  const errors = validateOperationalAuthority(
    request,
    config({ operatorLicenses: new Map() }),
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /operator and licence/);
});

test("expression remains an asserted claim and carries the GRN evidence", () => {
  const expression = buildProductReceivedExpression(request, {
    expressionId: "urn:qel:expression:test-product-received",
    issuedAt: "2026-07-21T05:00:05.000Z",
  });
  assert.equal(expression.status, "asserted");
  assert.equal(expression.type, "org.voijeans.inventory.product-received.v1");
  assert.equal((expression.payload as Record<string, unknown>).grn_id, request.grn.id);
  assert.equal((expression.evidence as Array<Record<string, unknown>>)[0].digest, digest);
});

test("RiverOS receipt must bind to the exact expression digest", async () => {
  const expression = buildProductReceivedExpression(request, {
    expressionId: "urn:qel:expression:test-riveros-receipt",
    issuedAt: "2026-07-21T05:00:05.000Z",
  });
  const expressionDigest = sha256Canonical(expression);

  const fakeFetch = async () =>
    new Response(
      JSON.stringify({
        receipt_id: "riveros-receipt-001",
        received_at: "2026-07-21T05:00:06.000Z",
        evidence_uri: "riveros://receipts/riveros-receipt-001",
        expression_digest: expressionDigest,
        status: "accepted",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );

  const receipt = await requestRiverOsReceipt(
    expression,
    "controlled-idempotency-key",
    config(),
    fakeFetch as typeof fetch,
  );
  assert.equal(receipt.expression_digest, expressionDigest);
});
