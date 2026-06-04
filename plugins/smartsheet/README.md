# Smartsheet (PAT) — Claude plugin

A local MCP server that connects Claude (Cowork or Desktop) to Smartsheet using a personal access token. Works on any paid Smartsheet plan — it does not require Business/Enterprise/AWM the way the official Smartsheet MCP at `mcp.smartsheet.com` does.

## What's inside

- **MCP server** (`server/index.js`, Node 18+, no external runtime). 22 tools across reads, row CRUD, sharing, sheet lifecycle, column edits, and Excel/CSV export. See [CHANGELOG.md](CHANGELOG.md) for the full list.
- **Skill** (`skills/smartsheet-workflows/SKILL.md`) — teaches Claude the right call order (discover → get columns → write) and how to shape row, share, and column payloads.
- **Manifest** (`manifest.json`) — declares user config so the client prompts for the API token on install and stores it in the OS keychain.
- **Cowork manifest** (`.claude-plugin/plugin.json`) — added during the release build for the `.plugin` bundle.

## Install

Get the bundle from the [Releases page](https://github.com/timothyfraser/claude-cowork-plugins/releases/latest):

- Claude Desktop → `*.mcpb`
- Claude Cowork → `*.plugin`

Double-click the downloaded file. The client opens an install dialog. Paste a Smartsheet personal access token (see below for how to generate one), leave the API base URL alone unless you're on the EU or Gov region, optionally set an export directory, click Install.

To generate a token: Smartsheet → click your profile icon (lower left) → **Personal Settings** → **API Access** → **Generate new access token**. Paid plans only — Smartsheet's free / individual tier cannot generate tokens.

To verify the install: in any chat, ask *"Use Smartsheet to list the sheets I have access to."* If you see your sheets, you're connected.

## What it can do

Anything the PAT's user can do via the Smartsheet UI:

- **Read** sheets, columns, workspaces, search results, who-shares-what
- **Edit** rows (add, update, delete) and columns (add, rename, delete)
- **Share** sheets with users / groups and change their access level (Viewer → Editor → Admin)
- **Create** new sheets from scratch or by copying an existing one; delete them
- **Export** sheets to Excel (.xlsx) or CSV files on your disk
- **Identify** which Smartsheet account the PAT belongs to (`whoami`)

See [CHANGELOG.md](CHANGELOG.md) for the full v1.0 tool list.

## What it can't do (yet)

Attachments, discussions, webhooks, cross-sheet references, report CRUD, dashboards, and cell-format edits. The Smartsheet REST API supports all of these — they're just not wrapped here yet. PRs welcome.

If you need any of those right now and your account is Business/Enterprise/AWM, the official Smartsheet MCP at `mcp.smartsheet.com` covers them.

## Trust model

The token has the same read/write access its user has across Smartsheet. Treat it like a password. The token lives in your OS keychain (macOS Keychain, Windows Credential Manager) once you enter it in the install dialog — never in a plain-text config. Revoke it in Smartsheet's API Access tab if it leaks, if you suspect your laptop has been compromised, or as part of annual rotation.

This plugin makes no outbound calls to anywhere other than `api.smartsheet.com` (or `api.smartsheet.eu` / `api.smartsheetgov.com` if you change the base URL). No telemetry.
