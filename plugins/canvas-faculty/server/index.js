#!/usr/bin/env node
/**
 * Canvas Faculty Assistant — Cowork/MCP plugin (per-faculty, FERPA-scoped).
 *
 * A thin front-end over the Cornell n8n "Canvas: Faculty Agent" webhook. The single
 * tool `ask_canvas` POSTs the faculty member's question to the webhook, forwarding
 * TWO secrets as request headers:
 *   - X-Canvas-Token : the faculty member's OWN Canvas API token (per-user scoping —
 *                      every Canvas call the agent makes is scoped to this token, so a
 *                      faculty member only ever sees their own courses/students).
 *   - X-Gate-Key     : a shared cohort gate secret that the webhook validates (header
 *                      auth) before doing any work; a missing/wrong gate key -> 403.
 *
 * Both secrets live ONLY in this plugin's local config (OS keychain via user_config),
 * never centralized and never committed. The agent + all Canvas REST calls run on
 * Cornell-hosted infra (n8n + the Cornell LiteLLM gateway), which is FERPA-appropriate.
 *
 * Config — TWO ways to supply these, in priority order (both work; see token-loader.js):
 *   1. the plugin's own settings menu (user_config -> env, names below)
 *   2. a plain text file the user edits by hand, e.g. ~/.systemsbot/tokens.env, containing
 *      lines CANVAS_API_TOKEN=<your token> and CANVAS_GATE_KEY=<the gate key from Tim> —
 *      no menus, no admin rights. Auto-created with a commented template on first run.
 *   CANVAS_WEBHOOK_URL  e.g. https://n8n-dev.lcmain.aaii.cucloud.net/webhook/canvas-faculty
 *                       (has a built-in default below since it's not a secret)
 *   CANVAS_API_TOKEN    the faculty member's own Canvas token (sent as X-Canvas-Token)
 *   CANVAS_GATE_KEY     the shared cohort gate secret (sent as X-Gate-Key)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { resolveSecret, ensureTemplate, missingTokenMessage } from "./token-loader.js";

const DEFAULT_WEBHOOK_URL = "https://n8n-dev.lcmain.aaii.cucloud.net/webhook/canvas-faculty";
const CANVAS_TOKEN_HEADER = process.env.CANVAS_TOKEN_HEADER || "X-Canvas-Token";
const GATE_KEY_HEADER = process.env.CANVAS_GATE_HEADER || "X-Gate-Key";
const TIMEOUT_MS = Number(process.env.CANVAS_TIMEOUT_MS || 90000);

ensureTemplate();

const ok = (payload) => ({
  content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }],
});

const tools = {
  ask_canvas: {
    description:
      "Ask the Cornell Systems Engineering Canvas assistant about YOUR OWN Canvas courses. " +
      "It has read-only access scoped to your personal Canvas token, so it only ever sees courses where you are a teacher/TA/designer. " +
      "It can: list your courses, list students in a course, find students overlapping across courses, search students by name/NetID, " +
      "report a student's grade trajectory, and give per-assignment analytics (means, submission/late rates). " +
      "FERPA: prefer aggregates; it will not export student names/NetIDs/grades unless you explicitly ask. " +
      "Phrase a natural question, e.g. \"How many courses am I teaching this term?\" or \"Show assignment analytics for course 12345\".",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", description: "Your question about your own Canvas courses/students." },
      },
    },
    handler: async ({ question }) => {
      const webhookUrl = resolveSecret("CANVAS_WEBHOOK_URL") || DEFAULT_WEBHOOK_URL;
      const canvasToken = resolveSecret("CANVAS_API_TOKEN");
      const gateKey = resolveSecret("CANVAS_GATE_KEY");
      if (!canvasToken) {
        return { content: [{ type: "text", text: missingTokenMessage("CANVAS_API_TOKEN", "your Canvas API token") }], isError: true };
      }
      if (!gateKey) {
        return { content: [{ type: "text", text: missingTokenMessage("CANVAS_GATE_KEY", "the Canvas gate key from Tim") }], isError: true };
      }
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [CANVAS_TOKEN_HEADER]: canvasToken,
            [GATE_KEY_HEADER]: gateKey,
          },
          body: JSON.stringify({ question }),
          signal: ac.signal,
        });
        const text = await res.text();
        if (res.status === 403) {
          throw new Error(
            "Gate rejected (403). Your gate key is missing or wrong — re-check CANVAS_GATE_KEY in the plugin settings or your token file (get the current value from the program administrator)."
          );
        }
        if (res.status === 401) {
          throw new Error(
            "Unauthorized (401). Your Canvas token was missing or rejected — re-check CANVAS_API_TOKEN in the plugin settings or your token file."
          );
        }
        if (!res.ok) {
          throw new Error(`Canvas faculty webhook ${res.status}: ${text.slice(0, 300)}`);
        }
        let data;
        try { data = JSON.parse(text); } catch { data = { answer: text }; }
        return ok({ answer: data.answer ?? "", question: data.question ?? question });
      } finally {
        clearTimeout(t);
      }
    },
  },
};

const server = new Server(
  { name: "canvas-faculty", version: "1.2.0" },
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
