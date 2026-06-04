# Changelog

All notable releases will be tagged in this repo and listed here.

## [1.0.0] — 2026-06-04

### smartsheet plugin

- First public release.
- 22 MCP tools: `whoami`, `list_sheets`, `get_sheet`, `get_columns`, `search`, `list_workspaces`, `get_workspace`, `list_personal_folder`, `list_shares`, `add_rows`, `update_rows`, `delete_rows`, `share_sheet`, `update_share`, `unshare`, `create_sheet`, `delete_sheet`, `copy_sheet`, `add_columns`, `update_columns`, `delete_columns`, `export_sheet`.
- Auth: Smartsheet PAT, stored in OS keychain.
- Bundled as `.mcpb` (Claude Desktop) and `.plugin` (Cowork).
- Tested live against the Smartsheet REST v2 API: every tool except `get_workspace` exercised against real sheets, zero data leftover.
