#!/usr/bin/env node
/**
 * Systems Engineering Program Assistant — Cowork/MCP plugin.
 *
 * A thin front-end over the Cornell n8n RAG engine. The single tool `ask_program`
 * POSTs the user's question to an n8n webhook (header-authed) which runs the
 * hybrid RAG over the program corpus on Cornell-hosted infra (n8n + the Cornell
 * LiteLLM gateway) and returns a grounded, cited answer. No corpus or model keys
 * live in this plugin — only the webhook URL + a shared token (OS keychain).
 *
 * Config — TWO ways to supply these, in priority order (both work; see token-loader.js):
 *   1. the plugin's own settings menu (user_config -> env RAG_WEBHOOK_URL / RAG_WEBHOOK_TOKEN)
 *   2. a plain text file the user edits by hand, e.g. ~/.systemsbot/tokens.env, containing a
 *      line RAG_WEBHOOK_TOKEN=<your token> — no menus, no admin rights. Auto-created with a
 *      commented template on first run if no such file exists yet.
 *   RAG_WEBHOOK_URL   e.g. https://n8n-dev.lcmain.aaii.cucloud.net/webhook/rag-ask (has a
 *                     built-in default below since it's not a secret)
 *   RAG_WEBHOOK_TOKEN the X-RAG-Token shared secret
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { resolveSecret, ensureTemplate, missingTokenMessage } from "./token-loader.js";

const DEFAULT_WEBHOOK_URL = "https://n8n-dev.lcmain.aaii.cucloud.net/webhook/rag-ask";
const TOKEN_HEADER = process.env.RAG_WEBHOOK_TOKEN_HEADER || "X-RAG-Token";
const TIMEOUT_MS = Number(process.env.RAG_TIMEOUT_MS || 60000);

// Auto-create the shared token-file template (fail-soft; never overwrites an existing file).
ensureTemplate();

const ok = (payload) => ({ content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }] });

const tools = {
  ask_program: {
    description:
      "Ask the Cornell Systems Engineering program assistant a question. It answers ONLY from the program's curated knowledge base (course roster, faculty directory, program website, official forms) with inline [n] citations, and declines when the answer isn't in the sources. " +
      "Supports named skills: include `/skill-name` in the question to invoke a workflow, e.g. \"Use skill /who-to-contact with financial aid\" or \"/course-planning optimization Fall 2026\". " +
      "Available skills: course-planning, pathway-requirements, compare-pathways, degree-plan, faculty-finder, thesis-advisor, who-to-contact, forms-and-deadlines, process-walkthrough, capstone-examples, career-paths.",
    inputSchema: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", description: "The student/applicant question. May include a /skill-name invocation." },
      },
    },
    handler: async ({ question }) => {
      const webhookUrl = resolveSecret("RAG_WEBHOOK_URL") || DEFAULT_WEBHOOK_URL;
      const webhookToken = resolveSecret("RAG_WEBHOOK_TOKEN");
      if (!webhookToken) {
        return { content: [{ type: "text", text: missingTokenMessage("RAG_WEBHOOK_TOKEN", "program-assistant webhook token") }], isError: true };
      }
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [TOKEN_HEADER]: webhookToken,
          },
          body: JSON.stringify({ query: question }),
          signal: ac.signal,
        });
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`RAG webhook ${res.status}: ${text.slice(0, 300)}`);
        }
        let data;
        try { data = JSON.parse(text); } catch { data = { answer: text }; }
        return ok({ answer: data.answer ?? "", sources: data.sources ?? [] });
      } finally { clearTimeout(t); }
    },
  },
};

const server = new Server(
  { name: "program-assistant", version: "1.2.0" },
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
