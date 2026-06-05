# SysEng Program Assistant — Cowork/MCP plugin

A thin front-end that lets Claude (Cowork or Desktop) ask the **Cornell Systems Engineering program assistant** a question and get a grounded, cited answer. All the heavy lifting (retrieval + generation) happens on Cornell infrastructure — this plugin just calls a header-authed n8n webhook.

## What it does

One tool, **`ask_program(question)`** → returns `{ answer, sources }`.
- Answers ONLY from the program's curated knowledge base (course roster, faculty directory, website, official forms), with inline `[n]` citations.
- Declines and redirects when the answer isn't in the corpus (no hallucination).
- Supports **named skills** via `/skill-name` in the question (e.g. `Use skill /who-to-contact with financial aid`, `/course-planning optimization Fall 2026`).

## Architecture

```
Claude (Cowork)  →  ask_program  →  POST n8n /webhook/rag-ask (X-RAG-Token)
                                       →  RAG: Query v2 (hybrid retrieve + LLM answer)
                                       →  { answer, sources }
```
The RAG runs on the Cornell n8n instance + Cornell LiteLLM gateway (FERPA-appropriate). **No corpus or model API keys live in this plugin** — only the webhook URL and a shared token, stored in the OS keychain.

## Install

1. Install the `.mcpb` (Claude Desktop: Settings → Extensions → Install Extension) or add as a Cowork plugin.
2. When prompted, enter:
   - **RAG webhook URL** — e.g. `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/rag-ask`
   - **Webhook token** — the `X-RAG-Token` shared secret (from the program administrator).
3. Try: *"Ask the program assistant what classes are offered in Fall 2026"* or *"Use skill /forms-and-deadlines for graduation"*.

## Local dev / test

```bash
npm install
RAG_WEBHOOK_URL=https://.../webhook/rag-ask RAG_WEBHOOK_TOKEN=... \
  node server/index.js   # stdio MCP; drive with any MCP client
```

## Config (env / user_config)

| var | meaning |
|---|---|
| `RAG_WEBHOOK_URL` | the n8n RAG webhook endpoint |
| `RAG_WEBHOOK_TOKEN` | shared secret sent as `X-RAG-Token` |
| `RAG_WEBHOOK_TOKEN_HEADER` | header name (default `X-RAG-Token`) |
| `RAG_TIMEOUT_MS` | request timeout (default 60000) |

## Trust model

The token authorizes calls to the program RAG webhook. Treat it like a password; rotate it by regenerating the n8n credential and re-entering it here. The webhook only returns grounded answers over program (non-High-risk) content.
