# QEL Genesis Executable Profile

This directory defines an additive, machine-readable profile for governed executable expressions on the persistent `genesis` integration branch.

It does **not** redefine QEL's canonical meaning. Existing QEL primitives remain authoritative: actor, object, place, time, authority, consent, evidence, provenance and signatures.

## Canonical executable grammar

```text
GIVEN {Thing / State / Context}
WHEN {Condition / Trigger}
USING {Algorithm / Method}
UNDER {Authority / Constraints / Policy}
THEN {Transformation / Decision / Effect}
PRODUCING {New State + Evidence + Cost + Timestamp}
```

The profile is a structured projection of those primitives. `GIVEN` binds object/state/context; `WHEN` binds trigger; `USING` identifies the declared transformation method; `UNDER` binds authority, consent, policy and constraints; `THEN` declares the effect; and `PRODUCING` records the resulting state, evidence, cost/resource accounting and timestamp semantics.

## Execution boundary

An expression is a **declarative contract**, not permission to bypass runtime controls. A later interpreter/orchestrator may execute a validated expression only through the relevant environment adapters, Warden authority, deterministic safety controls, Registry identities and evidence rules.

For LENSEOS specifically:

- QEL never commands raw voltage, electrodes or chemistry-specific waveforms.
- Applications and algorithms express semantic optical outcomes.
- Warden authorization is required where the expression declares it.
- Safety may clamp, deny or force a safe state after authorization.
- Physical units and component identities resolve through Commons Registry.
- Evidence is durable only where policy says the event is material.
- Cost fields are accounting hooks; unknown engineering values remain `null` rather than being fabricated.

## Files

- `qel-executable-expression.schema.json` — expression contract.
- `../lenseos/lenseos-expressions.json` — LENSEOS engineering-baseline expression pack.
- `../../tools/validate_genesis_qel.py` — structural and LENSEOS safety/lineage validator.

Initial change envelope: `GEN-CHG-20260809-LENSEOS-001`.
