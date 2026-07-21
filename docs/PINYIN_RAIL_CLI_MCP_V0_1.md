# Pinyin Rail CLI and MCP Server v0.2

Status: **draft / controlled prototype**

This increment provides a Pinyin operator language for rail-node log operations and communications without making Pinyin itself the machine authority. Every MCP tool call now requires a short-lived DigitalMe/Warden authorization envelope bound to a separately signed node registry.

## Authority boundary

The layers are deliberately separate:

1. Chinese script provides the human display term.
2. Tone-free ASCII Pinyin provides a terminal-safe operator alias.
3. A versioned registry maps that alias to one stable canonical tool name.
4. A DigitalMe actor proof demonstrates control of the requesting identity.
5. A Warden policy proof grants a bounded capability.
6. A Warden registry proof binds exact node definitions and permitted tools.
7. The MCP server validates the canonical tool, both authorization proofs, the registry signature and the requested scope.

A transliteration table may help resolve characters or aliases, but it must never independently decide what a command means.

## Implemented commands

| Chinese | Pinyin CLI | Canonical MCP tool |
| --- | --- | --- |
| 解析节点 | `chaxun jiedian` | `rail.nodes.resolve` |
| 导出节点日志 | `daochu jiedian-rizhi` | `rail.logs.export` |
| 导入节点日志 | `daoru jiedian-rizhi` | `rail.logs.import.prepare` |
| 查询节点日志 | `chaxun jiedian-rizhi` | `rail.logs.query` |
| 查询回执 | `chaxun huizhi` | `rail.receipts.get` |
| 发送通信 | `fasong tongxin` | `comms.message.send` |
| 查询通信状态 | `chaxun tongxin-zhuangtai` | `comms.message.status` |

The registry is `rail-cli/commands.v0.1.json`. Machine identifiers must remain stable even if a display phrase or alias is improved later.

## Compile-only default

The CLI is non-destructive by default. It compiles a Pinyin command into a JSON-RPC `tools/call` request and prints it.

```bash
npx tsx rail-cli/railctl.ts \
  daochu jiedian-rizhi \
  --jiedian vsr://mainnet/IN-KA/operational/warehouse/voi/bangalore/warehouse-001 \
  --kaishi 2026-07-21T00:00:00Z \
  --jieshu 2026-07-21T23:59:59Z
```

The resulting canonical tool is `rail.logs.export`. Compile-only output states that authorization is required, but it never prints the authorization envelope or its signatures.

## Signed authorization envelope

The schema is `rail-mcp/authorization-envelope.schema.v0.1.json`.

Each envelope contains:

- one DigitalMe issuer and subject DID;
- the MCP audience;
- issue, not-before and expiry timestamps;
- a nonce;
- the SHA-256 digest of the exact signed node registry;
- exact granted tools and nodes;
- allowed communication channels and classifications;
- maximum export duration and query limit;
- one Ed25519 DigitalMe actor proof;
- one Ed25519 Warden policy proof.

Both proofs sign the same canonical envelope content with the `proofs` field removed. A transport bearer credential does not replace this operation-level authorization.

## Signed node registry

The schema is `rail-mcp/node-registry.schema.v0.1.json`.

Each node record defines:

- exact VSR or URN node address;
- DigitalMe operator identity;
- node status;
- jurisdiction;
- permitted canonical tools;
- authority references;
- RiverOS or other evidence sink.

The registry contains a digest over canonical registry content excluding `digest` and `proof`, plus a Warden-registry Ed25519 proof over the same content.

The resolver rejects:

- an invalid or expired registry;
- a digest mismatch;
- an untrusted registry key;
- duplicate node identifiers;
- a node missing from the registry;
- suspended or revoked nodes;
- a tool not permitted by the node;
- an authorization bound to another registry digest.

The current deterministic JSON canonicalizer is an implementation draft. A ratified release must adopt and test a formally specified canonicalization profile such as RFC 8785 or an explicitly governed equivalent.

## Trust-store bootstrap

The server reads public trust anchors from `RAIL_TRUST_STORE_PATH`. The trust store contains public keys only, each bound to exactly one role:

- `digitalme-actor`;
- `warden-policy`;
- `warden-registry`.

The signed registry is read from `RAIL_NODE_REGISTRY_PATH`.

```text
RAIL_TRUST_STORE_PATH=/controlled/config/rail-trust-store.json
RAIL_NODE_REGISTRY_PATH=/controlled/config/signed-node-registry.json
```

Private signing keys must remain in DigitalMe secure storage, a secure enclave, HSM or another approved signer. They must not be committed, uploaded as MCP arguments or stored in the communications outbox.

## Controlled execution

Remote MCP execution requires all of the following:

- `--execute`;
- exact confirmation using `--confirm <canonical-tool-name>`;
- `RAIL_MCP_URL` or `--mcp-url`;
- `RAIL_MCP_TOKEN` in the environment;
- `RAIL_AUTHORIZATION_FILE` or `--authorization-file` / `--shouquan-wenjian`.

Example node resolution:

```bash
RAIL_MCP_URL=https://rail.example.invalid/mcp \
RAIL_MCP_TOKEN='provided-by-secret-manager' \
RAIL_AUTHORIZATION_FILE=/controlled/capabilities/operator-001.json \
npx tsx rail-cli/railctl.ts \
  chaxun jiedian \
  --jiedian vsr://mainnet/IN-KA/operational/warehouse/voi/bangalore/warehouse-001 \
  --execute \
  --confirm rail.nodes.resolve
```

The CLI loads the envelope only when executing and places it in MCP `tools/call` metadata under:

```text
org.believerscommon/authorization
```

Do not put transport credentials, passwords or private signing material in command arguments. The transport credential is read from the environment and the signed capability is read from a controlled file.

## MCP server

Start the stdio server with:

```bash
npx tsx rail-mcp/server.ts
```

The server implements:

- `initialize`;
- `notifications/initialized`;
- `ping`;
- `tools/list`;
- `tools/call`.

The tool contracts are defined in `rail-mcp/tool-contracts.v0.1.json`.

Every `tools/call` is denied unless the server can load its trust store and signed registry and verify the authorization metadata. This enforcement remains active even when a caller bypasses `railctl` and communicates with the MCP server directly.

The stdio server writes protocol messages only to stdout. Operational diagnostics go to stderr.

## Authorization decision

A successful tool result includes a sanitized authorization decision containing:

- decision identifier;
- authorization identifier;
- issuer and subject DID;
- canonical tool;
- node identifier when applicable;
- signed registry identifier and digest;
- verification-method identifiers;
- evaluation timestamp;
- `authorized` status.

It does not copy the envelope signatures or public-key material into operation or communication records.

## Current execution boundary

### Node resolution and logs

The following tools perform full identity, policy and registry authorization, then return a stable result without connecting to a live node:

- `rail.nodes.resolve`;
- `rail.logs.export`;
- `rail.logs.import.prepare`;
- `rail.logs.query`;
- `rail.receipts.get`.

`rail.nodes.resolve` returns the exact signed node record. Log operations return preview receipts and resource links. They do not connect to a warehouse, RiverOS, Dropbox or another node in v0.2. A valid authorization and preview are not proof that a log exists or that an import is admissible.

Log imports are always expressed as `prepare` and default to quarantine. There is intentionally no `rail.logs.import.commit` tool in this increment.

### Communications

`comms.message.send` also requires a valid signed capability granting every requested channel and the message classification. It remains a preview unless:

```text
RAIL_MCP_EXECUTION_ENABLED=true
RAIL_MCP_OUTBOX_DIR=/controlled/path
```

When enabled, it writes a deterministic communication record and sanitized authorization decision to the controlled local outbox. This is an acceptance-to-outbox receipt, not proof of delivery to Slack, Notion, Dropbox, GitHub or RiverOS.

Confidential messages are additionally blocked unless:

```text
RAIL_MCP_CONFIDENTIAL_ENABLED=true
```

External channel adapters remain a later increment. They must consume the controlled outbox rather than receiving unrestricted raw CLI input.

## Denial codes

The authorization layer returns explicit denial codes, including:

- `authorization-missing`;
- `authorization-expired`;
- `registry-binding-mismatch`;
- `tool-not-granted`;
- `node-not-granted`;
- `node-not-registered`;
- `node-tool-not-permitted`;
- `node-inactive`;
- `export-window-exceeds-grant`;
- `query-limit-exceeds-grant`;
- `channel-not-granted`;
- `classification-not-granted`.

A denial is returned as an MCP tool result with `isError: true`, allowing the client session to continue without converting a policy denial into a protocol crash.

## Tests

```bash
npm run test:rail
npm run check:rail
```

The tests generate Ed25519 key pairs in memory. No test private key is written to the repository. Coverage includes:

- command translation and node resolution;
- authorization metadata separation;
- signed registry verification;
- dual DigitalMe/Warden proof verification;
- registry-digest substitution denial;
- authorization expiry;
- export-window limits;
- suspended-node denial;
- missing tool grants;
- direct MCP calls without authorization;
- preview-only node operations.

## Next controlled increments

1. Add RiverOS receipt verification and durable idempotency.
2. Add a controlled adapter-worker protocol for GitHub, Slack, Notion and Dropbox.
3. Add QEL expressions for authorization decisions, export preparation, import preparation and communication delivery receipts.
4. Add `rail.logs.import.validate`, followed later by a separately governed commit action.
5. Ratify the canonicalization profile and publish conformance vectors across implementations.
6. Add trust-key rotation, revocation lists and registry supersession records.

No production node, external channel or evidence system should be activated until the relevant identity, authority, redaction, retention, dispute and receipt controls are independently tested.
