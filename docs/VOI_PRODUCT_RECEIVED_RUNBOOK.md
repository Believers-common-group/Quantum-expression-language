# VOI Product Received — Controlled Activation Runbook

Status: implementation gate for the first live QEL event only.

This runbook does not enable Inventory Transferred, Product Sold, Product Returned, or Payment Settled. Those event types remain fixtures until Product Received completes an end-to-end controlled run.

## 1. Acceptance boundary

A successful API response means:

1. the request matched the Product Received input schema;
2. the warehouse node was explicitly allowlisted;
3. the operator and EmpireOS licence reference matched the configured allowlist;
4. the idempotency key was not reused for a different request;
5. RiverOS returned an accepted receipt bound to the exact expression digest.

It does not by itself establish that the physical goods, quantities, documents, or legal claims are factually correct. Independent inspection and later attestations may still challenge or supersede the expression.

## 2. Required controlled inputs

Before activation, obtain and verify exactly one instance of each:

- VOI GRN ID and GRN document;
- GRN SHA-256 digest;
- one warehouse/Quantum Arc node identifier;
- one DigitalMe operator identifier;
- one EmpireOS warehouse-receiving licence reference;
- one purchase order identifier;
- one supplier identifier;
- one product batch, SKU, style code, quantity, and receiving timestamp;
- at least one additional receiving evidence artifact and digest;
- one RiverOS receipt endpoint with service credentials.

Do not place real secrets, personal identifiers, bank identifiers, or confidential documents in the repository.

## 3. Configuration

Use a secret manager or deployment environment. `.env.qel.example` is non-operational and contains placeholders only.

Required variables:

```text
QEL_PRODUCT_RECEIVED_ENABLED=true
QEL_INGEST_API_KEY=<secret>
QEL_WAREHOUSE_NODES=<comma-separated node IDs>
QEL_PRODUCT_RECEIVED_LICENSES=<JSON operator-to-licence mapping>
RIVEROS_RECEIPT_ENDPOINT=<HTTPS endpoint>
RIVEROS_API_KEY=<service secret, when required>
```

The service reports readiness at:

```text
GET /api/qel/pilot/voi/product-received/status
```

`ready` must be `true` before any controlled write.

## 4. Preflight validation

Copy `qel-spec/examples/voi/live/product-received-request.template.json` outside the repository and replace every placeholder.

Run schema and authority validation without creating an expression or requesting a RiverOS receipt:

```bash
curl --fail-with-body \
  -H 'Content-Type: application/json' \
  --data-binary @product-received-request.json \
  https://<console-host>/api/qel/pilot/voi/product-received/validate
```

Expected result:

```json
{
  "valid": true,
  "schemaValid": true,
  "operationalAuthorityValid": true,
  "errors": [],
  "requestDigest": "sha256:..."
}
```

## 5. Controlled submission

Use a unique idempotency key derived from the source system and GRN, without embedding confidential data. Example pattern:

```text
logic-erp:product-received:<controlled-random-id>
```

Submit:

```bash
curl --fail-with-body \
  -H 'Content-Type: application/json' \
  -H 'X-QEL-Ingest-Key: <secret>' \
  -H 'Idempotency-Key: <unique-key>' \
  --data-binary @product-received-request.json \
  https://<console-host>/api/qel/pilot/voi/product-received
```

The service returns HTTP `201` only after RiverOS accepts the expression and returns a matching digest receipt.

## 6. Evidence to retain

Retain outside the application log:

- source GRN and its calculated digest;
- submitted request digest;
- generated QEL expression ID and digest;
- RiverOS receipt ID, URI, timestamp, and digest;
- deployment version and configuration identifiers;
- operator and licence verification record;
- HTTP status and response body with secrets removed.

## 7. Idempotency

The console keeps an in-process replay cache for immediate duplicate protection. It is not the durable source of idempotency.

RiverOS must enforce the same `Idempotency-Key` durably across process restarts. Reusing a key for different content must fail. Reusing it for identical content may return the original receipt.

## 8. Failure and rollback

Set:

```text
QEL_PRODUCT_RECEIVED_ENABLED=false
```

and restart/redeploy the service to disable writes immediately.

A failed or disputed physical receipt must not be edited in place. Issue a later QEL correction, dispute, rejection, or supersession expression after those lifecycle operations are implemented.

## 9. Exit criteria

Product Received is considered proven for the pilot only when:

1. one real controlled GRN passes preflight;
2. the write endpoint returns one RiverOS-bound receipt;
3. the same idempotency key and same request replay safely;
4. the same key with changed content is rejected;
5. the expression and evidence can be independently retrieved and matched by digest;
6. an operator other than the allowlisted operator is rejected;
7. a warehouse other than the allowlisted node is rejected;
8. the operational team signs off on the evidence package.

Only after all eight conditions pass should Inventory Transferred be designed for live activation.
