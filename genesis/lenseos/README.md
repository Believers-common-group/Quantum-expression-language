# LENSEOS × QEL

This directory applies the additive QEL Genesis Executable Profile to LENSEOS under change envelope `GEN-CHG-20260809-LENSEOS-001`.

## Primitive mapping

| Executable clause | Existing QEL semantics |
|---|---|
| `GIVEN` | object + current state + place/context |
| `WHEN` | time/event/condition |
| `USING` | declared method/algorithm; never authority by itself |
| `UNDER` | actor + authority + consent + constraints/policy |
| `THEN` | proposed transformation, decision or effect |
| `PRODUCING` | new state + evidence + provenance + timestamp + resource/cost accounting |

This mapping is additive. It does not change QEL's existing neutrality, authority-first, backward-interpretability, provenance or auditability principles.

## Expression pack

`lenseos-expressions.json` contains six engineering-baseline expressions:

1. `QEL-LNS-001 REDUCE_GLARE` — resolves a semantic glare-reduction outcome through Warden and deterministic LENSEOS safety.
2. `QEL-LNS-002 SAFETY_CLEAR` — expresses the privileged local safety path and visibility-preserving safe state.
3. `QEL-LNS-003 CALIBRATE_SURFACE` — binds calibration measurement, verification and immutable calibration lineage.
4. `QEL-LNS-004 REPLACE_COMPONENT` — preserves predecessor/successor Registry identity during service replacement.
5. `QEL-LNS-005 SERIALIZED_UNIT_BIRTH` — admits a production-accepted native `LNS-*` unit into the Network-Based Registry.
6. `QEL-LNS-006 VALIDATE_PRODUCT_RELEASE` — evaluates exact source/profile/configuration, safety, manufacturing and validation evidence before release promotion.

## Cross-repository dependencies

The expressions reference engineering baselines on the persistent Genesis branches:

- `Warden:genesis` — `WARDEN-LENSEOS-001` and authorization schema.
- `DigitalMe:genesis` — `DIGITALME-LENSEOS-001`, VisualProfile and Context Handoff.
- `Virtual-Silk-road:genesis` — VSR OS semantic LENSEOS intent/result API.
- `Commons-registry:genesis` — `BCR-0011` through `BCR-0018`, product-release lineage and serialized-unit birth schemas.

## Execution status

These expressions are **declarative contracts**, not a deployed interpreter. A deterministic QEL executor/orchestrator is a later implementation layer. Until then, this pack defines what a conforming executor must preserve:

- exact identity and source lineage;
- Warden authority where declared;
- consent where declared;
- deterministic safety boundaries;
- no raw optical actuation from QEL/application space;
- requested-versus-executed truth;
- evidence and provenance hooks;
- explicit resource/cost accounting hooks without invented values;
- timestamp semantics;
- safe failure behavior.

Validation command:

```bash
python3 tools/validate_genesis_qel.py
```
