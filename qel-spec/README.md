# QEL Specification v0.1

This directory is the extracted normative draft for Quantum Expression Language.

QEL expresses signed, versioned claims about occurrences and state transitions. It does not execute business logic, determine legal validity, or guarantee factual truth.

## Normative documents

- `CHARTER.md`
- `GOVERNANCE.md`
- `VERSIONING.md`
- `core/claim-semantics.md`
- `core/canonicalization.md`
- `core/qel-core.schema.json`

## Conformance

Files under `examples/` and `tests/` are machine-readable test vectors. Valid examples must pass the canonical schema and the reference implementation. Invalid examples must fail for the documented reason.

Status: **v0.1.0-draft — not ratified**.
