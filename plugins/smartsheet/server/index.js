#!/usr/bin/env node
/**
 * Smartsheet (per-user) — Cowork/MCP plugin.
 *
 * A thin front-end over the Cornell n8n "Smartsheet (per-user)" webhook. Each tool
 * POSTs to the webhook with the CALLER'S OWN Smartsheet Personal Access Token (PAT)
 * carried in the `X-Smartsheet-Token` header. The webhook does the Smartsheet REST v2
 * work scoped to that PAT — so person A only ever sees what person A's Smartsheet
 * account can see. There is no shared service account: the user's PAT IS the identity
 * and the security boundary.
 *
 * The PAT lives ONLY in this plugin's local user config (OS keychain) — never bundled,
 * never committed, never sent anywhere but the Cornell n8n webhook over HTTPS.
 *
 * Config (user_config -> env):
 *   SMARTSHEET_WEBHOOK_URL   e.g. https://n8n-dev.lcmain.aaii.cucloud.net/webhook/smartsheet-user
 *   SMARTSHEET_USER_PAT      the user's own Smartsheet Personal Access Token
 *   SMARTSHEET_GATE_TOKEN    (optional) shared gate-header secret, if the webhook is hardened
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const WEBHOOK_URL = process.env.SMARTSHEET_WEBHOOK_URL;
const USER_PAT = process.env.SMARTSHEET_USER_PAT;
const TOKEN_HEADER = process.env.SMARTSHEET_TOKEN_HEADER || "X-Smartsheet-Token";
const GATE_TOKEN = process.env.SMARTSHEET_GATE_TOKEN; // optional hardening
const GATE_HEADER = process.env.SMARTSHEET_GATE_HEADER || "X-Gate-Token";
const TIMEOUT_MS = Number(process.env.SMARTSHEET_TIMEOUT_MS || 60000);

if (!WEBHOOK_URL) {
  console.error("SMARTSHEET_WEBHOOK_URL is not set. Configure it in the plugin settings.");
  process.exit(1);
}
if (!USER_PAT) {
  console.error("SMARTSHEET_USER_PAT is not set. Paste your own Smartsheet Personal Access Token in the plugin settings.");
  process.exit(1);
}

const ok = (payload) => ({ content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }] });

// POST {tool, ...args} to the n8n webhook with the user's PAT in the token header.
async function callWebhook(tool, args = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [TOKEN_HEADER]: USER_PAT,
        ...(GATE_TOKEN ? { [GATE_HEADER]: GATE_TOKEN } : {}),
      },
      body: JSON.stringify({ tool, ...args }),
      signal: ac.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Smartsheet webhook ${res.status}: ${text.slice(0, 400)}`);
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return data;
  } finally { clearTimeout(t); }
}

const tools = {
  smartsheet_whoami: {
    description:
      "Return the Smartsheet account identity of the configured Personal Access Token (email, name). Use this to confirm WHICH Smartsheet account the connector is acting as — everything else is scoped to this same account.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ok(await callWebhook("whoami")),
  },
  smartsheet_list_sheets: {
    description:
      "List all Smartsheet sheets the configured account can access (sheets owned by or shared with this user). Returns each sheet's id, name, and permalink. Use the id with smartsheet_get_sheet.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ok(await callWebhook("list_sheets")),
  },
  smartsheet_get_sheet: {
    description:
      "Get the full contents of one Smartsheet sheet (columns + rows + cell values) by its sheetId. Get the sheetId from smartsheet_list_sheets or smartsheet_search.",
    inputSchema: {
      type: "object",
      required: ["sheetId"],
      properties: {
        sheetId: { type: ["string", "number"], description: "The Smartsheet sheet id (from list_sheets or search)." },
      },
    },
    handler: async ({ sheetId }) => ok(await callWebhook("get_sheet", { sheetId })),
  },
  smartsheet_search: {
    description:
      "Search everything the configured Smartsheet account can access (sheets, rows, workspaces, reports, attachments...) for a text query. Returns matching items with their objectType and objectId. Useful to find a sheet by a word in its name or a row by its content.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "The text to search for across the user's Smartsheet content." },
      },
    },
    handler: async ({ query }) => ok(await callWebhook("search", { query })),
  },
  smartsheet_list_workspaces: {
    description:
      "List the Smartsheet workspaces the configured account can access (workspaces group sheets/reports/dashboards). Returns each workspace's id, name, and permalink.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => ok(await callWebhook("list_workspaces")),
  },
};

const server = new Server(
  { name: "smartsheet", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const tool = tools[name];
  if (!tool) return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  try {
    return await tool.handler(args || {});
  } catch (err) {
    return { content: [{ type: "text", text: `Error calling ${name}: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
