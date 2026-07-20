# Quantum Expression Language

This repository contains the original QEL console prototype and the first extracted QEL v0.1 foundation.

## Repository state

The pre-extraction application is preserved at the immutable snapshot branch:

- `archive/qel-console-2026-07-21`

New standards work is isolated under:

- `qel-spec/` — normative language draft, schema, semantics, and conformance vectors
- `qel-core/` — Python reference validator, canonicalizer, hasher, and CLI
- `qel-spec/examples/voi/` — five-event VOI pilot
- `/api/qel/*` and `/qel-pilot` — read-only console reconnection

## Canonical definition

Quantum Expression Language (QEL) is a neutral, versioned language for expressing signed claims about observations, actions, states, authorizations, and attestations with explicit authority, consent, evidence, provenance, and lifecycle status.

A valid QEL expression is **not automatically a true fact**. It is a structurally valid, integrity-protected claim whose evidentiary weight depends on its issuer, authority, proof, evidence, independent attestations, and dispute status.

## Development

```bash
npm ci
npm run check
npm run build

python -m pip install -e './qel-core[dev]'
pytest qel-core/tests
qel validate qel-spec/examples/voi/001-product-received.json
qel hash qel-spec/examples/voi/001-product-received.json
```

See `docs/QEL_V0_1_EXTRACTION.md` for the extraction boundary and roadmap.
