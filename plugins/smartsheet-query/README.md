# Smartsheet Query — Cowork plugin (remote n8n MCP)

Read-only Smartsheet access for Cornell Systems Engineering staff **without a local install**. This plugin
registers the program's **n8n MCP Server** (a remote SSE endpoint) so Cowork can list/search/inspect
Smartsheet content using a **single shared, server-side PAT** held in n8n — staff never handle the PAT.

## What it does
Connects Cowork to the n8n workflow **"Smartsheet Query (MCP)"** (`x2aXaY2lwird4YWb`), which exposes 5
read-only tools backed by the Smartsheet REST API:
- `smartsheet_whoami` — which Smartsheet account the shared token belongs to.
- `smartsheet_list_sheets` — id / name / permalink of accessible sheets.
- `smartsheet_search(query)` — full-text search across accessible content.
- `smartsheet_get_sheet(sheetId)` — rows + columns of one sheet.
- `smartsheet_get_columns(sheetId)` — column ids / types / titles.

Read-only by design. (Power users who need writes / the full 22-tool surface use the **local** Smartsheet
stdio MCP with their own PAT — see the suite README.)

## Architecture
```
Claude (Cowork)  ──SSE──▶  https://n8n-dev.lcmain.aaii.cucloud.net/mcp/smartsheet-query/sse
                            (Authorization: Bearer <token>)  ──▶  n8n MCP Server Trigger
                            ──▶ HTTP Request tools ──▶ Smartsheet REST API (shared PAT, server-side)
```
The PAT lives once in an n8n credential, not in any staffer's keychain. The bearer token only authorizes
the MCP endpoint.

## Register
The plugin declares a remote **SSE** MCP server in `.mcp.json` and reads the bearer token from the
`SMARTSHEET_MCP_TOKEN` environment variable. Get the token from the program administrator (it lives in the
repo's gitignored `.smartsheet_mcp_token`), set it, and add the plugin:

```bash
export SMARTSHEET_MCP_TOKEN=<token from program admin>
# then enable this plugin in Cowork, or equivalently register directly:
claude mcp add --transport sse smartsheet-query \
  "https://n8n-dev.lcmain.aaii.cucloud.net/mcp/smartsheet-query/sse" \
  --header "Authorization: Bearer $SMARTSHEET_MCP_TOKEN" --scope user
```

Verify: ask Cowork *"Use smartsheet_whoami"* → should return the shared account; *"list my Smartsheet sheets"*.

## Trust model
The bearer token authorizes the MCP endpoint; treat it like a password. Rotate by editing the n8n
credential **"Smartsheet MCP Access Token"** and redistributing. The shared **PAT** behind it is read-only
and should be scoped to the minimum sheets needed (swap the n8n credential to a dedicated shared
service-account PAT before broad rollout).
