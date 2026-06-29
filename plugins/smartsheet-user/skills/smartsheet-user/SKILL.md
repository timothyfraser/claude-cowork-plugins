---
name: smartsheet-user
description: How to use the per-user Smartsheet connector (smartsheet_whoami, smartsheet_list_sheets, smartsheet_get_sheet, smartsheet_search, smartsheet_list_workspaces). Use whenever a user asks about THEIR Smartsheet sheets, rows, workspaces, or wants to look something up in Smartsheet. Every action is scoped to the user's own Smartsheet account via their personal access token.
---

# Smartsheet (your account)

This connector lets Claude read the user's **own** Smartsheet content. Each tool is scoped to the Personal Access Token (PAT) the user configured — so it only ever returns sheets, rows, and workspaces that **their** Smartsheet account owns or has been shared. There is no shared/service account: the user's PAT is the identity.

## Tools
- **`smartsheet_whoami`** — confirms which Smartsheet account is in use (email/name). Good first call to verify the connector is wired to the right person.
- **`smartsheet_list_sheets`** — lists the user's accessible sheets (id, name, permalink). Get a `sheetId` here.
- **`smartsheet_get_sheet(sheetId)`** — full contents of one sheet (columns + rows + cell values).
- **`smartsheet_search(query)`** — searches all the user's accessible Smartsheet content for a text term; returns matches with `objectType` + `objectId`.
- **`smartsheet_list_workspaces`** — lists the user's accessible workspaces (id, name, permalink).

## How to use it
- To read a specific sheet you usually need its id: call `smartsheet_list_sheets` (or `smartsheet_search`) first, find the sheet, then `smartsheet_get_sheet(sheetId)`.
- To find something by name or content, use `smartsheet_search(query)` — it spans sheets, rows, workspaces, reports, attachments.
- If a user asks "what Smartsheets do I have?", call `smartsheet_list_sheets`.
- If results look empty or wrong, call `smartsheet_whoami` to confirm the right account/token is configured.

## Caveats
- This is **read-oriented** (lookups). It does not create or modify sheets.
- Access is exactly the user's Smartsheet permissions — if they can't see a sheet in Smartsheet, this connector can't either (by design).
- If the user hasn't configured their PAT, tools error with a setup hint — point them to the plugin's ONBOARDING.md.
