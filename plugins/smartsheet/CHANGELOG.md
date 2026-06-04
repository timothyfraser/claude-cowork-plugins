# Changelog — smartsheet plugin

## 1.0.0 — 2026-06-04

First public release.

### Added (22 tools)
- **Auth check**: `whoami`
- **Reads**: `list_sheets`, `get_sheet`, `get_columns`, `search`, `list_workspaces`, `get_workspace`, `list_personal_folder`, `list_shares`
- **Row CRUD**: `add_rows`, `update_rows`, `delete_rows`
- **Sharing**: `share_sheet`, `update_share`, `unshare`
- **Sheet lifecycle**: `create_sheet`, `copy_sheet`, `delete_sheet`
- **Column edits**: `add_columns` (auto-defaults missing `index`), `update_columns`, `delete_columns`
- **Export**: `export_sheet` (xlsx and csv, saved to disk)

### Pre-1.0 bug fixes folded in
- `get_sheet rowsLimit > 0` previously sent an invalid `rowNumbers=1-N` param to Smartsheet (HTTP 400, errorCode 1008). Switched to the documented `pageSize` param.
- `add_columns` previously required callers to supply `column.index`, returning errorCode 1012 if omitted. Now auto-defaults the missing index to "append at end" by inspecting the existing column count.

### Known issues
- `outputPath` for `export_sheet` must use forward slashes on Windows when args are passed through a bash wrapper — pure shell quirk, not a server bug.
- Column-edit tools require ADMIN or OWNER access on the target sheet (Smartsheet 403 errorCode 1004 if you only have EDITOR or EDITOR_SHARE).
