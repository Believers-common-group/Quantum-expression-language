# qel-core

Python reference implementation for QEL v0.1 draft.

Commands:

```bash
qel validate expression.json
qel canonicalize expression.json
qel hash expression.json
qel verify-digest expression.json
```

`verify-digest` checks only whether each declared `payload_digest` matches the canonical expression payload. It does not verify cryptographic signatures or factual truth.
