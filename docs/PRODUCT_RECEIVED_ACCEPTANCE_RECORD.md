# Product Received Acceptance Record

Complete this record outside the public repository for the first controlled VOI GRN. Commit only a redacted outcome summary after approval.

## Controlled identifiers

- Deployment version:
- Warehouse node:
- Operator DigitalMe ID (pseudonymous reference only):
- EmpireOS licence reference:
- Source system:
- GRN reference:
- Request digest:
- Idempotency key reference:

## Admission results

- [ ] Readiness endpoint returned `ready: true`.
- [ ] Request schema validation passed.
- [ ] Warehouse allowlist check passed.
- [ ] Operator/licence allowlist check passed.
- [ ] Initial submission returned HTTP 201.
- [ ] RiverOS receipt status was `accepted`.
- [ ] RiverOS expression digest matched the submitted expression digest.
- [ ] Identical replay returned the original accepted result.
- [ ] Changed payload with the same idempotency key returned HTTP 409.
- [ ] Unlicensed operator test returned HTTP 403.
- [ ] Non-allowlisted warehouse test returned HTTP 403.
- [ ] Evidence was independently retrieved and its digest matched.

## Result

- Controlled run status: PASS / FAIL
- Expression ID:
- Expression digest:
- RiverOS receipt ID:
- RiverOS evidence URI:
- Reviewer:
- Review date:
- Exceptions or disputes:

## Activation decision

- [ ] Keep Product Received enabled for the controlled node/operator pair.
- [ ] Disable Product Received and investigate.
- [ ] Authorize design work for Inventory Transferred.

The final checkbox must remain unchecked unless every admission result above passes and the operational reviewer accepts the evidence package.
