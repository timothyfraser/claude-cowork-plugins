---
name: smartsheet-workflows
description: Use whenever the user wants to read, search, share, create, modify, or download Smartsheet sheets. Covers the discovery pattern (search/list first), column-lookup-before-writes, sharing access levels, sheet creation column shapes, export to xlsx/csv, and known API gotchas.
---

# Smartsheet workflows (v0.2)

This plugin wraps the Smartsheet REST v2 API. Tool surface:

**Read**: `whoami`, `list_sheets`, `get_sheet`, `get_columns`, `search`, `list_workspaces`, `get_workspace`, `list_personal_folder`, `list_shares`
**Write**: `add_rows`, `update_rows`, `delete_rows`, `add_columns`, `update_columns`, `delete_columns`
**Share**: `share_sheet`, `update_share`, `unshare`
**Create**: `create_sheet`, `copy_sheet`
**Export**: `export_sheet`

## First-time check

Before doing real work, call `whoami` once. It confirms the PAT is configured correctly and tells you who the agent is acting as (some users have multiple Smartsheet accounts). If the call fails, the PAT is missing or expired — point the user at Smartsheet → Personal Settings → API Access.

## Discovery first, then act

Almost no useful Smartsheet operation can start from a sheet name alone — the API needs IDs. Pattern:

1. If the user references a sheet by name, call `search` (with `scopes: "sheetNames"`) or `list_sheets` first to resolve the sheet ID. Prefer `search` when the name is distinctive; prefer `list_sheets` when the user is browsing.
2. Once you have a `sheetId`, call `get_columns` before any write or column-edit. Cells and column edits are keyed by `columnId`, never by column title.
3. Then call `get_sheet` (with `rowsLimit`) to read content, or any write tool.

## Reading rows

`get_sheet` defaults to `rowsLimit: 100`. Underneath this maps to Smartsheet's `pageSize` param. Use `rowsLimit: 0` to fetch every row. **Big-sheet caution**: thousands of rows will overflow the model context window. Default to 100 and ask the user before going larger.

## Writing rows

Smartsheet's row payload is non-obvious. To append:

```json
[
  {
    "toBottom": true,
    "cells": [
      { "columnId": 1234567890123456, "value": "New task" },
      { "columnId": 9876543210987654, "value": "2026-06-01" }
    ]
  }
]
```

Key things:
- `columnId` is a number, not a string. Get it from `get_columns`.
- Position flags are `toBottom: true`, `toTop: true`, or `parentId` / `siblingId` for hierarchy.
- For PICKLIST / CONTACT_LIST columns, `value` must match an allowed option exactly (case-sensitive). Pull the column's `options` array from `get_columns` first.
- Date columns expect ISO 8601 (`YYYY-MM-DD`).
- To clear a cell, pass `value: null` — omitting the cell leaves the existing value alone.

## Updating rows

`update_rows` requires each row's `id` (row ID, not row number). Get row IDs from `get_sheet`. Only include the cells you want to change.

## Deleting rows

`delete_rows` takes `rowIds: [int...]`. Pass `ignoreRowsNotFound: true` if some IDs may have already been deleted. Smartsheet's delete is permanent (rows are recoverable from "Recently Deleted" for ~30 days in the UI, but not via the API).

## Sharing (`share_sheet`, `list_shares`, `update_share`, `unshare`)

Access levels (low → high privilege):
- `VIEWER` — read-only
- `EDITOR` — read + edit cells/rows
- `EDITOR_SHARE` — editor + can re-share
- `ADMIN` — full administrative access
- `OWNER` — only one per sheet; use ownership transfer carefully

The `share_sheet` body is an array of share entries. To switch someone from view to edit, first call `list_shares` to get the `shareId` (a string like `"AAAAATAdsdg…"`), then `update_share` with the new `accessLevel`. Don't try to "re-share" — the API rejects duplicate shares for the same user.

`sendEmail: true` triggers a Smartsheet-side notification email; with `subject` and `message`, those override the default invitation text.

## Creating sheets (`create_sheet`)

Every sheet needs at least one column with `primary: true` (typically the first `TEXT_NUMBER` column — this is the row label). Common pattern:

```json
{
  "name": "Project Tracker",
  "columns": [
    { "title": "Task",     "type": "TEXT_NUMBER", "primary": true },
    { "title": "Owner",    "type": "CONTACT_LIST" },
    { "title": "Status",   "type": "PICKLIST", "options": ["Not started","In progress","Done"] },
    { "title": "Due Date", "type": "DATE" }
  ]
}
```

If `folderId` is given, the sheet lands inside that folder; if `workspaceId`, inside that workspace; otherwise it goes to the user's home Sheets folder. You cannot pass both `folderId` AND `workspaceId`.

## Copying sheets (`copy_sheet`)

The `include` array controls what comes along. The safe default — when in doubt — is `include: ["data"]` (rows only, no attachments/discussions/shares). If the user is cloning a template, `include: ["forms","rules"]` keeps the workflow logic.

## Editing columns (`add_columns`, `update_columns`, `delete_columns`)

- Renaming a column is `update_columns` with just `title`. Safe.
- Changing a column's `type` is risky: existing cell values may not convert. Smartsheet rejects type changes that would lose data (e.g., TEXT_NUMBER → DATE on cells containing free text).
- Editing PICKLIST `options` is fine, but cells with values not in the new list become "invalid value" — they still display but show a warning. Inspect cells before pruning options.
- `delete_columns` removes the column and all its cells permanently. Confirm with the user before calling.

## Export to xlsx / CSV (`export_sheet`)

Saves the binary download to disk and returns the path (does NOT inline the file content — that would blow context).

```json
{ "sheetId": 1234567890, "format": "xlsx" }
```

Default output directory: `~/smartsheet-exports/` (or `$SMARTSHEET_EXPORT_DIR`). Override with `outputPath` (must be an absolute path).

After `export_sheet`, tell the user where the file landed. They can then drag it into Claude as an attachment, open it in Excel, etc.

## Search scopes

`search` defaults to searching everything (cell data, comments, sheet names, summary fields). If the user asks "find the sheet called X", restrict with `scopes: "sheetNames"` to avoid hits inside cells.

## Reading large sheets

If the user wants summary statistics across a big sheet, prefer reading the columns once, then paginating rows in chunks — or better, do the math yourself from a representative sample and tell the user it's a sample. Don't silently truncate.

## Errors to expect

- `403 errorCode 1004`: the token's user can't access that resource. Check sharing.
- `404`: usually a wrong `sheetId` or `shareId` — re-run search/list.
- `429`: rate limit. Back off and retry; Smartsheet allows ~300 requests / user / minute.
- `400 errorCode 1008` "Unable to parse request": v0.1 had a bug here on `get_sheet` (fixed in v0.2). If you still see it on a different tool, the request body shape is wrong — re-check the payload against the schema.

## What this plugin can't do

- Attachments, discussions, webhooks, cross-sheet references, report CRUD, dashboards. Those endpoints exist in the Smartsheet API but aren't wrapped here yet. If the user asks, tell them so and offer to extend the plugin or point them at the official Smartsheet MCP (which requires Business/Enterprise/AWM on their own account).
