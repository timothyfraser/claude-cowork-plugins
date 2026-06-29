# SysEng Canvas Faculty Assistant — Cowork/MCP plugin

A thin front-end that lets Claude (Cowork or Desktop) answer questions about **your own** Cornell Canvas courses and students. All the work (the agent + read-only Canvas calls) happens on Cornell infrastructure — this plugin just calls a header-authed n8n webhook and forwards two secrets from your local config.

## What it does

One tool, **`ask_canvas(question)`** → returns `{ answer, question }`.
- Read-only access to **your** Canvas, scoped to **your** Canvas token: list your courses, list/search students, find students overlapping across your courses, grade trajectory, per-assignment analytics.
- **FERPA-scoped by construction:** every Canvas call uses *your* token, so you only ever see *your* courses — one faculty member can never see another's student data.
- Prefers aggregates; won't export student names/NetIDs/grades unless you explicitly ask.

## Architecture

```
Claude (Cowork)  →  ask_canvas  →  POST n8n /webhook/canvas-faculty
                                      headers: X-Gate-Key (cohort gate)
                                               X-Canvas-Token (YOUR token)
                                      →  webhook validates X-Gate-Key (else 403)
                                      →  Canvas Faculty Agent (Cornell LiteLLM)
                                      →  read-only Canvas tools scoped to your token
                                      →  { answer }
```
The agent + Canvas calls run on the Cornell n8n instance + Cornell LiteLLM gateway (FERPA-appropriate). **No Canvas data or model keys live in this plugin** — only the webhook URL, your Canvas token, and the gate key, all stored in the OS keychain.

## Two-secret design

| header | secret | where it comes from | purpose |
|---|---|---|---|
| `X-Gate-Key` | shared cohort gate key | the program administrator | header auth — the webhook rejects (403) any request without the right gate key |
| `X-Canvas-Token` | **your own** Canvas API token | you generate it in Canvas | per-user scoping — every Canvas call is made as you |

The gate key is the same for the faculty cohort; the Canvas token is unique per person. Both stay only in your local plugin config.

## Install & configure

See **[ONBOARDING.md](ONBOARDING.md)** for the zero-coding, step-by-step version. In short:

1. Install the `.mcpb` (Claude Desktop: Settings → Extensions → Install Extension) or add as a Cowork plugin.
2. When prompted, enter:
   - **Canvas faculty webhook URL** — e.g. `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/canvas-faculty`
   - **Your Canvas API token** — generate in Canvas (Account → Settings → Approved Integrations → New Access Token).
   - **Gate key** — the `X-Gate-Key` shared secret from the program administrator.
3. Try: *"How many courses am I teaching this term?"*

## Local dev / test

```bash
npm install
CANVAS_WEBHOOK_URL=https://.../webhook/canvas-faculty \
CANVAS_API_TOKEN=<your-canvas-token> \
CANVAS_GATE_KEY=<gate-key> \
  node server/index.js   # stdio MCP; drive with any MCP client
```

## Config (env / user_config)

| var | meaning |
|---|---|
| `CANVAS_WEBHOOK_URL` | the n8n Canvas faculty webhook endpoint |
| `CANVAS_API_TOKEN` | your own Canvas token, sent as `X-Canvas-Token` |
| `CANVAS_GATE_KEY` | the cohort gate secret, sent as `X-Gate-Key` |
| `CANVAS_TOKEN_HEADER` | token header name (default `X-Canvas-Token`) |
| `CANVAS_GATE_HEADER` | gate header name (default `X-Gate-Key`) |
| `CANVAS_TIMEOUT_MS` | request timeout (default 90000) |

## Trust model

- The **gate key** gates access to the webhook; treat it like a shared password. Rotate it by regenerating the n8n `Canvas Gate Key` credential and re-distributing.
- Your **Canvas token** authorizes Canvas calls **as you**; treat it like a password and revoke it in Canvas if leaked. It never leaves your machine except as the `X-Canvas-Token` header to the Cornell webhook.
- The webhook only performs read-only Canvas operations scoped to the supplied token.
