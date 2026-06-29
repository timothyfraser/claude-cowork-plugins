# Smartsheet (per-user) — Cowork/MCP plugin

Lets Claude (Cowork or Desktop) read **your own** Smartsheet account. You paste your personal Smartsheet token once; every action is scoped to what *your* Smartsheet account can see — never anyone else's.

## What it does

Five read tools, each routed through a Cornell-hosted n8n webhook:

| tool | does |
|---|---|
| `smartsheet_whoami` | confirm which account the token belongs to (email/name) |
| `smartsheet_list_sheets` | list the sheets you can access |
| `smartsheet_get_sheet(sheetId)` | full columns + rows of one sheet |
| `smartsheet_search(query)` | search your accessible Smartsheet content |
| `smartsheet_list_workspaces` | list the workspaces you can access |

## Architecture & why per-user

```
Claude (Cowork)  →  smartsheet_* tool  →  POST n8n /webhook/smartsheet-user
                                            headers: X-Smartsheet-Token: <YOUR PAT>
                                            body:    { tool, ...args }
                                          →  HTTP Request → Smartsheet REST v2
                                             Authorization: Bearer <YOUR PAT>
                                          →  JSON result
```

Each user supplies **their own** Smartsheet Personal Access Token (PAT). The plugin forwards it as a request header; the webhook reads that header per-request and calls Smartsheet as that token's owner. So person A only accesses what's been shared with person A — there is **no shared service account**, and the PAT is the security boundary.

Routing through n8n (rather than calling Smartsheet directly from the plugin) is intentional: the same webhook can be extended with richer workflows later without re-shipping the plugin.

**Your token lives ONLY in this plugin's local config (OS keychain).** It is never bundled, never committed, and never sent anywhere but the Cornell n8n webhook over HTTPS.

## Install & configure

See **[ONBOARDING.md](./ONBOARDING.md)** for the zero-coding, step-by-step version (for non-coders).

Short version:
1. Install the plugin (Cowork plugin, or the `.mcpb` in Claude Desktop → Settings → Extensions).
2. When prompted, set:
   - **Smartsheet webhook URL** — defaults to `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/smartsheet-user`.
   - **Your Smartsheet Personal Access Token** — generate in Smartsheet (Account → Personal Settings → API Access → Generate new access token).
3. Try: *"Use smartsheet_whoami"* → should show **your** email. Then *"List my Smartsheets."*

## Config (env / user_config)

| var | meaning |
|---|---|
| `SMARTSHEET_WEBHOOK_URL` | the n8n per-user Smartsheet webhook endpoint |
| `SMARTSHEET_USER_PAT` | **your own** Smartsheet PAT, sent as `X-Smartsheet-Token` |
| `SMARTSHEET_TOKEN_HEADER` | header name (default `X-Smartsheet-Token`) |
| `SMARTSHEET_GATE_TOKEN` | (optional) shared gate-header secret if the webhook is hardened — see below |
| `SMARTSHEET_GATE_HEADER` | gate header name (default `X-Gate-Token`) |
| `SMARTSHEET_TIMEOUT_MS` | request timeout (default 60000) |

## Local dev / test

```bash
npm install
SMARTSHEET_WEBHOOK_URL=https://n8n-dev.lcmain.aaii.cucloud.net/webhook/smartsheet-user \
SMARTSHEET_USER_PAT=<your-pat> \
  node server/index.js   # stdio MCP; drive with any MCP client
```

## Trust & security model

- Your PAT = your identity = your access. The webhook can only ever act as the token's owner; it cannot escalate to anyone else's data.
- Treat your PAT like a password. To rotate: revoke it in Smartsheet (API Access), generate a new one, and re-enter it in the plugin settings.
- **Optional hardening (off by default):** the webhook can additionally require a shared "gate" header (`X-Gate-Token`) so only people who also hold a shared secret can reach it. If the administrator enables that on the webhook, set `SMARTSHEET_GATE_TOKEN` in the plugin config. By default the per-user PAT alone is the boundary (minimum friction is the priority).
