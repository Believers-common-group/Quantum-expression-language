# QEL Canonicalization

QEL v0.1 canonical JSON is UTF-8 JSON with:

1. object keys sorted lexicographically;
2. no insignificant whitespace;
3. Unicode emitted directly rather than ASCII escaped;
4. JSON numbers restricted by the schema to interoperable integer or decimal forms;
5. a single trailing newline excluded from the digest input.

The reference implementation uses Python's deterministic JSON encoder for v0.1 draft conformance. Before ratification, QEL must adopt a formally specified cross-language canonicalization profile such as RFC 8785 or an equivalent reviewed standard.

The expression digest is SHA-256 over the canonical UTF-8 bytes after removing the `proof` field. Proofs therefore secure the semantic payload and may be replaced or extended without changing the payload digest.
