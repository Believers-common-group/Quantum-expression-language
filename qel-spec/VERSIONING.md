# QEL Versioning

QEL uses semantic versioning for the specification and a mandatory `qel_version` field in every expression.

## Compatibility

- Unknown major versions must be rejected.
- Newer minor versions may be accepted only when all required semantics are understood.
- Patch versions may clarify text and add test coverage without changing validation behavior.
- Deprecated fields remain parseable for the support period declared by the major version.

The initial draft version is `0.1.0` and is not yet ratified for legal or production reliance.
