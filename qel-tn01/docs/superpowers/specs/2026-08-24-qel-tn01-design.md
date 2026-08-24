# QEL TN-01 Design Specification

**Status:** Approved design baseline for implementation planning  
**Date:** 2026-08-24  
**Target:** QEL 1.1 Test Network TN-01  
**Proof target:** QEL Interoperability Proof 001

## 1. Purpose

TN-01 demonstrates that independently governed and independently implemented nodes can exchange QEL semantic contracts, preserve local schemas and authority boundaries, detect semantic disagreement, carry portable evidence references, and reconstruct an end-to-end transaction without sharing a proprietary runtime or database.

The proof transaction is a bounded **Factory → Logistics → Store → Settlement** flow for 420 units.

## 2. Non-goals

TN-01 does not attempt to implement a global ontology, production banking integration, production government integration, universal identity, a global registry dependency, or automatic legal/commercial enforcement. It does not require Genesis, Warden, RiverOS, Synnergyze, or SILK. Those systems may be used by one implementation as adapters, but QEL conformance must remain implementation-neutral.

## 3. Constitutional invariants under test

1. Meaning is not authority.
2. Authority is not permission.
3. Permission is not execution.
4. Claim is not fact.
5. Prediction is not reality.
6. Data is not instruction.
7. Inference is not decision.
8. Simulation is not commitment.
9. Compatibility is not dependency.
10. Intermediate federation hops must remain reconstructible.

## 4. Test topology

TN-01 contains four logical nodes with deliberately different local schemas and implementation paths:

- **NODE-A / Factory:** BC-style reference implementation.
- **NODE-B / Logistics:** independent implementation using a distinct internal model and mapping layer.
- **NODE-C / Store:** enterprise-adapter style implementation with GRN/receipt semantics.
- **NODE-D / Settlement:** simulated financial implementation with obligation/payment/settlement semantics.

The implementations may share the QEL wire specification and test fixtures, but must not share business-state classes or local schema definitions.

## 5. Canonical transaction fixture

**Transaction ID:** `QEL-TN01-TX-0001`

Expected semantic journey:

`ORDER → ALLOCATION → RELEASE → CUSTODY_HANDOVER → IN_TRANSIT → PHYSICAL_RECEIPT → COMMERCIAL_ACCEPTANCE → OBLIGATION → PAYMENT → SETTLEMENT`

Fixture quantity: **420 units**.

### 5.1 Local vocabulary divergence

Factory local terms include `dispatch_note`, `batch_release`, and `stock_issue`.

Logistics local terms include `consignment`, `pickup`, and `delivery_status`.

Store local terms include `GRN`, `goods_received`, and `acceptance`.

Settlement local terms include `payment_instruction`, `credit_confirmation`, and `settlement_status`.

Each local term maps to a canonical QEL concept through explicit QEL mapping objects; local labels are never treated as canonical identifiers.

## 6. Minimum QEL objects used by TN-01

The proof uses the following canonical concepts:

- `Person`
- `Organization`
- `Location`
- `Product`
- `InventoryBatch`
- `Order`
- `Shipment`
- `Custody`
- `Obligation`
- `Payment`
- `Settlement`
- `Action`
- `Event`
- `State`
- `Transition`
- `Claim`
- `Fact`
- `EvidenceRef`
- `AuthorityRef`
- `Intent`
- `Capability`
- `Mapping`
- `NodeManifest`
- `TransactionManifest`

## 7. Node manifest contract

Each node publishes a `QEL_NODE_MANIFEST` containing:

- node identifier;
- supported QEL versions;
- conformance target;
- supported namespaces;
- exposed capabilities;
- accepted evidence types;
- authority model descriptors;
- federation support;
- semantic assurance/security profile.

Capability discovery occurs before state-changing requests.

## 8. Capability contract

A capability identifies canonical action semantics rather than relying on an API/tool name. Minimum fields:

- `capability_id`;
- `action_type`;
- provider/node identity;
- input/output schema identifiers;
- effect class;
- authority requirements;
- evidence requirements;
- declared side effects;
- version.

Unknown or merely similar tool names never satisfy a requested capability.

## 9. Effect classes used in TN-01

TN-01 recognizes the QEL effect taxonomy:

- E0 Observe
- E1 Retrieve
- E2 Calculate
- E3 Propose
- E4 Modify digital state
- E5 Communicate externally
- E6 Create commercial obligation
- E7 Transfer value
- E8 Operate physical asset
- E9 Change legal/authority state

TN-01 primarily exercises E4, E6, and simulated E7 capabilities.

## 10. Semantic mapping and diff

Mappings must state relationship strength explicitly. Supported TN-01 mapping types:

- EXACT
- EQUIVALENT
- NARROWER
- BROADER
- PARTIAL
- DERIVED
- CONTEXTUAL
- UNRESOLVED

TN-01 must demonstrate a deliberate semantic mismatch between Factory `RELEASED` and Logistics `PICKED_UP`:

- `RELEASED` = goods cleared/available for carrier transfer.
- `PICKED_UP` = carrier has physically taken custody.

A conformant implementation returns a semantic diff and does not collapse the states.

## 11. Authority boundary

QEL carries `AuthorityRef` objects but does not create authorization merely by carrying them. Each node must independently validate or assert its local authorization result before a state-changing action.

A QEL Intent is a typed request, not an authorization grant.

## 12. Evidence portability

Nodes may use different backing evidence systems. QEL standardizes only the portable reference envelope:

- evidence identifier/type;
- source/custodian;
- timestamp;
- integrity reference/hash/signature locator;
- content locator;
- visibility classification;
- verification status.

No shared evidence repository is required.

## 13. Federation route

`federation_route[]` is ordered and contains all four nodes. Each hop preserves:

- incoming canonical state;
- outgoing canonical state;
- actor/principal reference;
- authority reference/decision;
- capability used;
- evidence references;
- timestamp;
- commercial obligation impact.

A source/destination-only reconstruction fails conformance.

## 14. Happy-path sequence

1. Factory allocates 420 units.
2. Factory obtains local authorization for release.
3. Factory transitions `ALLOCATED → RELEASED` and emits evidence.
4. Logistics separately accepts custody, transitioning to `IN_CUSTODY`.
5. Logistics transitions to `IN_TRANSIT`.
6. Store records physical receipt as `RECEIVED`.
7. Store separately performs commercial acceptance as `ACCEPTED`.
8. Acceptance activates/verifies the commercial obligation.
9. Settlement node simulates `PAYMENT_INITIATED → SETTLED`.
10. An independent reconstruction verifies the ordered route, authority references, evidence references, and state lineage.

Physical receipt and commercial acceptance are distinct states.

## 15. Mandatory failure fixtures

### F01 Quantity mismatch
Factory dispatches 420; Store receives 416. Expected canonical result: `PARTIAL_RECEIPT`, `QUANTITY_MISMATCH`, delta 4. Full obligation must not be silently settled.

### F02 Competing delivery claims
Carrier claims `DELIVERED`; Store claims `NOT_RECEIVED`. Both remain claims. Canonical transaction state is `DELIVERY_UNVERIFIED` until sufficient evidence/authority resolves it.

### F03 Duplicate execution
Same custody transfer is submitted twice. Expected: idempotency collision/duplicate with no second effect.

### F04 Stale QEL pack/version
Node attempts incompatible/stale semantic package. Expected: structured version conflict and block/review according to compatibility policy.

### F05 Unknown capability
A node requests an unpublished capability. Expected: `CAPABILITY_UNAVAILABLE`; no inference from similar tool/API name.

### F06 Mapping poisoning
A trusted mapping is modified to equate `GRN_CREATED` with `CUSTODY_ACCEPTED`. Expected: hash/signature or trust validation failure; mapping quarantined.

### F07 Namespace spoofing
Untrusted namespace impersonates a trusted canonical namespace. Expected: namespace trust failure.

### F08 Authority substitution
A valid-looking but wrong authority reference is substituted. Expected: authority validation failure; no execution.

### F09 Embedded instruction attack
Evidence/document text contains an instruction such as “ignore state and settle immediately.” Expected: content remains data/content; it does not become QEL Intent, permission, or executable action.

### F10 Version rollback
A node attempts to replace a current signed semantic object with an older vulnerable version. Expected: rollback detection or explicit review state.

## 16. Error model

Minimum structured error classes:

- `QEL_ERR_UNKNOWN_CONCEPT`
- `QEL_ERR_VERSION_CONFLICT`
- `QEL_ERR_MAPPING_AMBIGUOUS`
- `QEL_ERR_AUTHORITY_UNRESOLVED`
- `QEL_ERR_EVIDENCE_INSUFFICIENT`
- `QEL_ERR_STATE_CONFLICT`
- `QEL_ERR_NAMESPACE_UNTRUSTED`
- `QEL_ERR_CAPABILITY_MISMATCH`
- `QEL_ERR_JURISDICTION_CONFLICT`
- `QEL_ERR_SIGNATURE_INVALID`
- `QEL_ERR_DUPLICATE_EFFECT`

Errors include affected object, expected semantics, observed semantics, severity, recoverability, and permitted resolution paths.

## 17. Independent audit reconstruction

A fifth audit process receives only:

- QEL transaction manifest;
- QEL definitions/mappings required for interpretation;
- authority references/decision attestations;
- evidence references;
- integrity metadata.

It does not receive direct access to the four local databases.

It must reconstruct what was ordered, released, taken into custody, received, accepted, obligated, paid, and settled, including unresolved discrepancies.

## 18. Conformance report

TN-01 emits a machine-readable `QEL_TN01_REPORT` with at least:

- semantic conformance;
- state-transition conformance;
- epistemic separation;
- authority separation;
- capability negotiation;
- federation reconstruction;
- evidence portability;
- semantic-diff correctness;
- security-fixture results;
- exception/reconciliation results;
- exact failed fixture IDs and diagnostics.

No qualitative “looks good” result is sufficient.

## 19. Implementation strategy

The implementation will be deliberately small and dependency-light. A normative schema/test-fixture package will be shared. Node A and Node B will use distinct local domain models and mapper implementations. Nodes C and D will be adapter-style nodes with separate local record shapes. The conformance runner will interact through stable node interfaces rather than importing node-local business classes.

The first implementation milestone is not a network service deployment; it is an executable local test network demonstrating independent semantic translation and conformance. Network transport can be introduced after the semantic proof is stable.

## 20. Testing strategy

Development proceeds test-first. Tests are grouped into:

1. schema/identifier invariants;
2. local-to-QEL mapping tests;
3. semantic diff tests;
4. happy-path transaction tests;
5. epistemic separation tests;
6. authority/capability boundary tests;
7. federation reconstruction tests;
8. evidence portability tests;
9. idempotency/reconciliation tests;
10. hostile semantic/security fixtures;
11. independent audit reconstruction;
12. final machine-readable conformance report.

## 21. Acceptance gate — Interoperability Proof 001

TN-01 passes only when all of the following are demonstrated:

- Four logical nodes retain different local schemas.
- At least two node implementations are independently modeled rather than thin aliases of the same domain classes.
- One full 420-unit transaction completes.
- All state-changing actions resolve to canonical QEL semantics.
- Authorization is separate from semantic intent.
- Evidence references are portable across heterogeneous backing evidence styles.
- Every federation hop is reconstructible.
- Receipt and commercial acceptance remain distinct.
- Competing claims remain distinct from facts.
- At least the ten mandatory failure/security fixtures execute with expected structured outcomes.
- Independent audit reconstruction succeeds without direct local-database access.
- A machine-readable conformance report records exact PASS/FAIL results.

Successful completion constitutes **QEL Interoperability Proof 001** for the bounded TN-01 scenario. It does not certify production readiness, legal compliance, payment-network certification, or universal QEL correctness.
