---
name: smartsheet-query
description: Look up Cornell Systems Engineering program data held in Smartsheet (read-only) via the n8n-hosted Smartsheet MCP. Use when a staff member asks what's in a program Smartsheet, to find a sheet, or to read rows/columns of a known sheet.
---

# Smartsheet query (read-only)

Use the `smartsheet_*` tools (served by the program's n8n MCP) to answer questions about data kept in
Smartsheet. Read-only — there are no write tools here.

## Typical flow
1. If you don't know the sheet, call `smartsheet_list_sheets` (or `smartsheet_search` with a keyword) to
   find the right sheet's **id** and name.
2. Call `smartsheet_get_sheet(sheetId)` for its rows, or `smartsheet_get_columns(sheetId)` for its schema.
3. Answer from what you retrieved; cite the sheet name. Don't guess values not in the result.

## Notes
- `smartsheet_whoami` is a cheap check of which shared account the connector uses.
- These tools read whatever the shared program PAT can see. Treat the contents as program/administrative
  data; surface only what the user needs.
- To **edit** a sheet, that's out of scope here — use the local per-user Smartsheet MCP (which has writes,
  scoped to the user's own PAT and the sandbox sheet).
