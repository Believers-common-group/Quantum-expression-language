# Pinyin Rail CLI and MCP Server v0.1

Status: **draft / controlled prototype**

This increment provides a Pinyin operator language for rail-node log operations and communications without making Pinyin itself the machine authority.

## Authority boundary

The four layers are deliberately separate:

1. Chinese script provides the human display term.
2. Tone-free ASCII Pinyin provides a terminal-safe operator alias.
3. A versioned registry maps that alias to one stable canonical tool name.
4. The MCP server validates and executes the canonical tool according to policy.

A transliteration table may help resolve characters or aliases, but it must never independently decide what a command means.

## Implemented commands

| Chinese | Pinyin CLI | Canonical MCP tool |
| --- | --- | --- |
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

The resulting canonical tool is `rail.logs.export`.

## Controlled execution

Live MCP execution requires all of the following:

- `--execute`
- exact confirmation using `--confirm <canonical-tool-name>`
- `RAIL_MCP_URL` or `--mcp-url`
- `RAIL_MCP_TOKEN` in the environment

Example:

```bash
RAIL_MCP_URL=https://rail.example.invalid/mcp \
RAIL_MCP_TOKEN='provided-by-secret-manager' \
npx tsx rail-cli/railctl.ts \
  fasong tongxin \
  --pindao notion,dropbox \
  --zhuti 'Warehouse export completed' \
  --xinxi 'The controlled artifact is ready.' \
  --ziyuan rail://exports/exp-001,rail://receipts/rcpt-001 \
  --execute \
  --confirm comms.message.send
```

Do not put tokens, passwords, private keys or API keys in command arguments. The CLI reads its MCP token only from the environment.

## MCP server

Start the stdio server with:

```bash
npx tsx rail-mcp/server.ts
```

The server implements:

- `initialize`
- `notifications/initialized`
- `ping`
- `tools/list`
- `tools/call`

The tool contracts are defined in `rail-mcp/tool-contracts.v0.1.json`.

The stdio server writes protocol messages only to stdout. Operational diagnostics go to stderr.

## Current execution boundary

### Node logs

The following tools validate arguments and return a stable preview receipt and resource links:

- `rail.logs.export`
- `rail.logs.import.prepare`
- `rail.logs.query`
- `rail.receipts.get`

They do not connect to a warehouse, RiverOS, Dropbox or another node in v0.1. A valid preview is not proof that a log exists or that an import is admissible.

Log imports are always expressed as `prepare` and default to quarantine. There is intentionally no `rail.logs.import.commit` tool in this increment.

### Communications

`comms.message.send` remains a preview unless:

```text
RAIL_MCP_EXECUTION_ENABLED=true
RAIL_MCP_OUTBOX_DIR=/controlled/path
```

When enabled, it writes a deterministic communication record to the controlled local outbox. This is an acceptance-to-outbox receipt, not proof of delivery to Slack, Notion, Dropbox, GitHub or RiverOS.

Confidential messages are additionally blocked unless:

```text
RAIL_MCP_CONFIDENTIAL_ENABLED=true
```

External channel adapters remain a later increment. They must consume the controlled outbox rather than receiving unrestricted raw CLI input.

## Example import preparation

```bash
npx tsx rail-cli/railctl.ts \
  daoru jiedian-rizhi \
  --jiedian urn:vsr:node:voi-warehouse-001 \
  --laiyuan ./warehouse-001-logs.zip \
  --sha256 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

The compiled request:

- normalizes the digest to `sha256:<hex>`;
- enforces validation and quarantine;
- generates a deterministic idempotency key;
- does not commit evidence.

## Tests

```bash
npm run test:rail
npm run check:rail
```

The tests cover command translation, digest normalization, list parsing, exact execution confirmation, node-address validation, MCP initialization, tool discovery, preview-only node operations, secret-field rejection and controlled-outbox communications.

## Next controlled increments

1. Add DigitalMe actor and Warden authorization claims to every call.
2. Add a signed node-registry resolver.
3. Add RiverOS receipt verification and durable idempotency.
4. Add adapter workers for GitHub, Slack, Notion and Dropbox.
5. Add `rail.logs.import.validate`, followed later by a separately governed commit action.
6. Add QEL expressions for export, import preparation and communication delivery receipts.

No production node, external channel or evidence system should be activated until the relevant identity, authority, redaction, retention, dispute and receipt controls are independently tested.
