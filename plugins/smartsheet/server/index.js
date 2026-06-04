#!/usr/bin/env node
/**
 * Smartsheet MCP server v1.0 (PAT-based).
 *
 * Wraps a broad slice of Smartsheet REST v2 endpoints as MCP tools.
 *
 * v1.0 surface (22 tools) — adds over the pre-1.0 9-tool predecessor:
 *  - whoami            : GET /users/me
 *  - delete_rows       : DELETE /sheets/{id}/rows?ids=...
 *  - list_shares       : GET /sheets/{id}/shares
 *  - share_sheet       : POST /sheets/{id}/shares
 *  - update_share      : PUT /sheets/{id}/shares/{shareId}
 *  - unshare           : DELETE /sheets/{id}/shares/{shareId}
 *  - create_sheet      : POST /sheets (or /folders/{id}/sheets or /workspaces/{id}/sheets)
 *  - delete_sheet      : DELETE /sheets/{id}
 *  - copy_sheet        : POST /sheets/{id}/copy
 *  - add_columns       : POST /sheets/{id}/columns (auto-defaults missing index)
 *  - update_columns    : PUT /sheets/{id}/columns/{columnId}
 *  - delete_columns    : DELETE /sheets/{id}/columns/{columnId}
 *  - export_sheet      : GET /sheets/{id} with Accept: xlsx|csv, saved to disk
 *
 * v1.0 bug fixes:
 *  - get_sheet uses `pageSize` instead of an invalid `rowNumbers=1-N` (was 400 errorCode 1008).
 *  - add_columns auto-defaults missing column.index to append-at-end (was errorCode 1012).
 *
 * Auth: Bearer token via SMARTSHEET_API_TOKEN env var.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, isAbsolute } from "node:path";
import { homedir } from "node:os";

const TOKEN = process.env.SMARTSHEET_API_TOKEN;
const BASE  = (process.env.SMARTSHEET_API_BASE || "https://api.smartsheet.com/2.0").replace(/\/$/, "");
const EXPORT_DIR = process.env.SMARTSHEET_EXPORT_DIR
  || resolve(homedir(), "smartsheet-exports");

if (!TOKEN) {
  console.error("SMARTSHEET_API_TOKEN is not set. Configure the token in the plugin settings.");
  process.exit(1);
}

// ---------- HTTP helpers ----------

async function ssRequest(method, path, { query, body } = {}) {
  const url = new URL(`${BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const init = {
    method,
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Accept": "application/json",
    },
  };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : {}; }
  catch { parsed = { raw: text }; }

  if (!res.ok) {
    const msg = parsed?.message || parsed?.raw || res.statusText;
    const errCode = parsed?.errorCode ? ` [errorCode ${parsed.errorCode}]` : "";
    throw new Error(`Smartsheet API ${res.status}${errCode}: ${msg}`);
  }
  return parsed;
}

// Binary fetch for export_sheet. Returns Buffer + content-type.
async function ssRequestBinary(path, { acceptType }) {
  const url = new URL(`${BASE}${path}`);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Accept": acceptType,
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Smartsheet API ${res.status}: ${errText.slice(0, 500)}`);
  }
  const buf = await res.arrayBuffer();
  return { buf: Buffer.from(buf), contentType: res.headers.get("content-type") || acceptType };
}

const ok = (payload) => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
});

// ---------- Tool implementations ----------

const tools = {
  // ===== v0.1 tools (with one bug fix) =====

  list_sheets: {
    description:
      "List all sheets accessible to the token holder. Supports pagination with includeAll=true (default) or page/pageSize.",
    inputSchema: {
      type: "object",
      properties: {
        includeAll: { type: "boolean", description: "Return all results in one response (default true).", default: true },
        page: { type: "integer", description: "Page number (1-based). Ignored when includeAll=true." },
        pageSize: { type: "integer", description: "Items per page (max 100). Ignored when includeAll=true." },
        modifiedSince: { type: "string", description: "ISO 8601 timestamp; only return sheets modified after this time." },
      },
    },
    handler: async (args = {}) => {
      const q = { includeAll: args.includeAll ?? true };
      if (!q.includeAll) {
        if (args.page) q.page = args.page;
        if (args.pageSize) q.pageSize = args.pageSize;
      }
      if (args.modifiedSince) q.modifiedSince = args.modifiedSince;
      return ok(await ssRequest("GET", "/sheets", { query: q }));
    },
  },

  get_sheet: {
    description:
      "Get a sheet by ID, including columns and rows. Use rowsLimit to cap the number of rows returned (very large sheets can blow the context window).",
    inputSchema: {
      type: "object",
      required: ["sheetId"],
      properties: {
        sheetId: { type: ["integer", "string"], description: "Smartsheet sheet ID." },
        rowsLimit: { type: "integer", description: "Max rows to return (default 100). Use 0 for all rows.", default: 100 },
        columnIds: { type: "string", description: "Comma-separated column IDs to restrict the response." },
        include: { type: "string", description: "Optional Smartsheet include flags, e.g. 'attachments,discussions,format'." },
      },
    },
    handler: async ({ sheetId, rowsLimit = 100, columnIds, include }) => {
      const q = {};
      if (columnIds) q.columnIds = columnIds;
      if (include) q.include = include;
      // v0.2 fix: use pageSize, not rowNumbers=1-N (the latter returns 400 errorCode 1008)
      if (rowsLimit && rowsLimit > 0) {
        q.page = 1;
        q.pageSize = rowsLimit;
      }
      return ok(await ssRequest("GET", `/sheets/${sheetId}`, { query: q }));
    },
  },

  get_columns: {
    description: "Get just the column definitions for a sheet (column IDs, titles, types). Cheap call useful before writing rows.",
    inputSchema: {
      type: "object",
      required: ["sheetId"],
      properties: { sheetId: { type: ["integer", "string"] } },
    },
    handler: async ({ sheetId }) =>
      ok(await ssRequest("GET", `/sheets/${sheetId}/columns`, { query: { includeAll: true } })),
  },

  search: {
    description: "Full-text search across sheets, dashboards, reports, and workspaces accessible to the token holder.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Search query." },
        scopes: { type: "string", description: "Optional comma-separated scopes, e.g. 'cellData,comments,sheetNames'." },
      },
    },
    handler: async ({ query, scopes }) => {
      const q = { query };
      if (scopes) q.scopes = scopes;
      return ok(await ssRequest("GET", "/search", { query: q }));
    },
  },

  list_workspaces: {
    description: "List workspaces accessible to the token holder.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ok(await ssRequest("GET", "/workspaces", { query: { includeAll: true } })),
  },

  get_workspace: {
    description: "Get a workspace's top-level contents (folders, sheets, reports, dashboards).",
    inputSchema: {
      type: "object",
      required: ["workspaceId"],
      properties: { workspaceId: { type: ["integer", "string"] } },
    },
    handler: async ({ workspaceId }) =>
      ok(await ssRequest("GET", `/workspaces/${workspaceId}`)),
  },

  list_personal_folder: {
    description: "List sheets and folders in the token holder's personal Home folder (the user's 'Sheets' area).",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ok(await ssRequest("GET", "/folders/personal")),
  },

  add_rows: {
    description:
      "Append one or more rows to a sheet. Each row is an object with `cells` (array of {columnId, value}) and an optional position flag like {toBottom: true}. Call get_columns first to look up columnIds.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "rows"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        rows: {
          type: "array",
          description: "Array of Smartsheet row objects. Example: [{toBottom: true, cells: [{columnId: 123, value: 'hello'}]}]",
          items: { type: "object" },
        },
      },
    },
    handler: async ({ sheetId, rows }) =>
      ok(await ssRequest("POST", `/sheets/${sheetId}/rows`, { body: rows })),
  },

  update_rows: {
    description:
      "Update cells in existing rows. Each row object requires an `id` and a `cells` array. Call get_sheet first to find row IDs.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "rows"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        rows: {
          type: "array",
          description: "Array of row objects to update. Example: [{id: 456, cells: [{columnId: 123, value: 'done'}]}]",
          items: { type: "object" },
        },
      },
    },
    handler: async ({ sheetId, rows }) =>
      ok(await ssRequest("PUT", `/sheets/${sheetId}/rows`, { body: rows })),
  },

  // ===== v0.2 new tools =====

  whoami: {
    description: "Return the Smartsheet user the PAT belongs to (email, plan, account info). Cheap auth-check.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ok(await ssRequest("GET", "/users/me")),
  },

  delete_rows: {
    description:
      "Delete one or more rows by ID. `rowIds` is an array of integers/strings. Pass `ignoreRowsNotFound: true` to skip 404 for missing rows.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "rowIds"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        rowIds: { type: "array", items: { type: ["integer", "string"] } },
        ignoreRowsNotFound: { type: "boolean", default: false },
      },
    },
    handler: async ({ sheetId, rowIds, ignoreRowsNotFound = false }) => {
      const ids = rowIds.map(String).join(",");
      const q = { ids };
      if (ignoreRowsNotFound) q.ignoreRowsNotFound = true;
      return ok(await ssRequest("DELETE", `/sheets/${sheetId}/rows`, { query: q }));
    },
  },

  list_shares: {
    description: "List who a sheet is shared with (users + groups, plus accessLevel for each).",
    inputSchema: {
      type: "object",
      required: ["sheetId"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        sharingInclude: { type: "string", description: "Optional 'workspaceShares' to include workspace-level shares." },
      },
    },
    handler: async ({ sheetId, sharingInclude }) => {
      const q = { includeAll: true };
      if (sharingInclude) q.include = sharingInclude;
      return ok(await ssRequest("GET", `/sheets/${sheetId}/shares`, { query: q }));
    },
  },

  share_sheet: {
    description:
      "Share a sheet with one or more users (by email) or groups (by groupId). " +
      "`shares` is an array; each entry needs an email OR groupId, and an accessLevel " +
      "(VIEWER | EDITOR | EDITOR_SHARE | ADMIN | OWNER). Pass sendEmail=true to notify; " +
      "optionally include subject/message for the invitation.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "shares"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        shares: {
          type: "array",
          items: {
            type: "object",
            required: ["accessLevel"],
            properties: {
              email: { type: "string" },
              groupId: { type: ["integer", "string"] },
              accessLevel: { type: "string", enum: ["VIEWER", "EDITOR", "EDITOR_SHARE", "ADMIN", "OWNER"] },
              subject: { type: "string" },
              message: { type: "string" },
              ccMe: { type: "boolean" },
            },
          },
        },
        sendEmail: { type: "boolean", default: false, description: "If true, Smartsheet emails the recipients." },
      },
    },
    handler: async ({ sheetId, shares, sendEmail = false }) => {
      const q = { sendEmail };
      return ok(await ssRequest("POST", `/sheets/${sheetId}/shares`, { query: q, body: shares }));
    },
  },

  update_share: {
    description:
      "Change someone's access level on a shared sheet. Get the shareId from list_shares first.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "shareId", "accessLevel"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        shareId: { type: "string", description: "The shareId from list_shares (a string)." },
        accessLevel: { type: "string", enum: ["VIEWER", "EDITOR", "EDITOR_SHARE", "ADMIN", "OWNER"] },
      },
    },
    handler: async ({ sheetId, shareId, accessLevel }) =>
      ok(await ssRequest("PUT", `/sheets/${sheetId}/shares/${shareId}`, { body: { accessLevel } })),
  },

  unshare: {
    description: "Revoke a user's or group's access to a sheet. Get the shareId from list_shares first.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "shareId"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        shareId: { type: "string" },
      },
    },
    handler: async ({ sheetId, shareId }) =>
      ok(await ssRequest("DELETE", `/sheets/${sheetId}/shares/${shareId}`)),
  },

  create_sheet: {
    description:
      "Create a new sheet. If `folderId` is given, creates in that folder; if `workspaceId` is given, creates in that workspace; otherwise creates in the user's personal Sheets folder. " +
      "Columns are required: at least one column must have primary=true (typically the first TEXT_NUMBER column).",
    inputSchema: {
      type: "object",
      required: ["name", "columns"],
      properties: {
        name: { type: "string" },
        columns: {
          type: "array",
          description: "Array of column defs. Example: [{title:'Name', type:'TEXT_NUMBER', primary:true}, {title:'Status', type:'PICKLIST', options:['Open','Done']}]",
          items: {
            type: "object",
            required: ["title", "type"],
            properties: {
              title: { type: "string" },
              type: { type: "string", description: "TEXT_NUMBER, DATE, CHECKBOX, PICKLIST, CONTACT_LIST, etc." },
              options: { type: "array", items: { type: "string" }, description: "For PICKLIST columns." },
              primary: { type: "boolean" },
              symbol: { type: "string", description: "Optional symbol set (e.g. 'STAR' for CHECKBOX)." },
            },
          },
        },
        folderId: { type: ["integer", "string"], description: "Create inside this folder instead of personal Sheets." },
        workspaceId: { type: ["integer", "string"], description: "Create inside this workspace instead of personal Sheets." },
      },
    },
    handler: async ({ name, columns, folderId, workspaceId }) => {
      let path = "/sheets";
      if (folderId) path = `/folders/${folderId}/sheets`;
      else if (workspaceId) path = `/workspaces/${workspaceId}/sheets`;
      return ok(await ssRequest("POST", path, { body: { name, columns } }));
    },
  },

  delete_sheet: {
    description:
      "Delete a sheet by ID. **Destructive**: the sheet and all its data are removed. " +
      "Smartsheet keeps deleted sheets in 'Recently Deleted' for ~30 days (UI only — not API recoverable).",
    inputSchema: {
      type: "object",
      required: ["sheetId"],
      properties: { sheetId: { type: ["integer", "string"] } },
    },
    handler: async ({ sheetId }) =>
      ok(await ssRequest("DELETE", `/sheets/${sheetId}`)),
  },

  copy_sheet: {
    description:
      "Copy an existing sheet to a destination folder, workspace, or the user's home. " +
      "destinationType is one of 'folder', 'workspace', or 'home'. " +
      "include controls what gets copied: any of 'data','attachments','discussions','cellLinks','forms','ruleRecipients','rules','shares','filters','all'.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "destinationType", "newName"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        destinationType: { type: "string", enum: ["folder", "workspace", "home"] },
        destinationId: { type: ["integer", "string"], description: "Required unless destinationType='home'." },
        newName: { type: "string" },
        include: { type: "array", items: { type: "string" }, description: "What to copy beyond structure." },
      },
    },
    handler: async ({ sheetId, destinationType, destinationId, newName, include }) => {
      const body = { destinationType, newName };
      if (destinationId !== undefined) body.destinationId = destinationId;
      const q = include?.length ? { include: include.join(",") } : undefined;
      return ok(await ssRequest("POST", `/sheets/${sheetId}/copy`, { body, query: q }));
    },
  },

  add_columns: {
    description:
      "Add one or more columns to a sheet. Each column needs a title and type; optionally `options` for PICKLIST and `index` for position.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "columns"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        columns: {
          type: "array",
          items: {
            type: "object",
            required: ["title", "type"],
            properties: {
              title: { type: "string" },
              type: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              index: { type: "integer", description: "0-based position; omit to append to the right." },
              symbol: { type: "string" },
            },
          },
        },
      },
    },
    handler: async ({ sheetId, columns }) => {
      // Smartsheet requires column.index on every add (errorCode 1012 if missing).
      // Auto-default missing indexes to append at the end.
      const needsIndex = columns.some(c => c.index === undefined || c.index === null);
      let augmented = columns;
      if (needsIndex) {
        const existing = await ssRequest("GET", `/sheets/${sheetId}/columns`, { query: { includeAll: true } });
        const count = (existing?.data || []).length;
        let next = count;
        augmented = columns.map((c) => {
          if (c.index !== undefined && c.index !== null) return c;
          return { ...c, index: next++ };
        });
      }
      return ok(await ssRequest("POST", `/sheets/${sheetId}/columns`, { body: augmented }));
    },
  },

  update_columns: {
    description:
      "Update one column's properties (title, type, picklist options, etc.). Only include the fields you want to change.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "columnId"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        columnId: { type: ["integer", "string"] },
        title: { type: "string" },
        type: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        index: { type: "integer" },
      },
    },
    handler: async ({ sheetId, columnId, ...rest }) =>
      ok(await ssRequest("PUT", `/sheets/${sheetId}/columns/${columnId}`, { body: rest })),
  },

  delete_columns: {
    description: "Delete a column from a sheet. **Destructive**: the column and all its cells are removed.",
    inputSchema: {
      type: "object",
      required: ["sheetId", "columnId"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        columnId: { type: ["integer", "string"] },
      },
    },
    handler: async ({ sheetId, columnId }) =>
      ok(await ssRequest("DELETE", `/sheets/${sheetId}/columns/${columnId}`)),
  },

  export_sheet: {
    description:
      "Download a sheet as Excel (.xlsx) or CSV. Saves to disk and returns the file path. " +
      "Default output directory is `$SMARTSHEET_EXPORT_DIR` or `~/smartsheet-exports/`. " +
      "Pass `outputPath` to override (absolute path).",
    inputSchema: {
      type: "object",
      required: ["sheetId", "format"],
      properties: {
        sheetId: { type: ["integer", "string"] },
        format: { type: "string", enum: ["xlsx", "csv"] },
        outputPath: { type: "string", description: "Optional absolute file path. Otherwise auto-generated in the export dir." },
      },
    },
    handler: async ({ sheetId, format, outputPath }) => {
      const acceptType = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
      const { buf } = await ssRequestBinary(`/sheets/${sheetId}`, { acceptType });
      const finalPath = outputPath && isAbsolute(outputPath)
        ? outputPath
        : resolve(EXPORT_DIR, `sheet-${sheetId}-${Date.now()}.${format}`);
      await mkdir(dirname(finalPath), { recursive: true });
      await writeFile(finalPath, buf);
      return ok({
        path: finalPath,
        bytes: buf.length,
        format,
        sheetId,
      });
    },
  },
};

// ---------- MCP wiring ----------

const server = new Server(
  { name: "smartsheet-cowork", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(tools).map(([name, t]) => ({
    name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const tool = tools[name];
  if (!tool) {
    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    return await tool.handler(args || {});
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error calling ${name}: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
