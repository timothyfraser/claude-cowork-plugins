// token-loader.js — resolve plugin secrets with the least friction possible.
//
// Order of resolution for any secret:
//   1. an environment variable  (the app's config menu / user_config — the ORIGINAL
//      path; left fully intact so nothing that already works breaks), then
//   2. a plain text token file the user edits by hand — no menus, no OS keychain, no
//      admin rights. One file can hold every plugin's tokens (KEY=value per line).
//
// This exists because non-technical colleagues can reliably edit one text file in
// their own folder, but find the app's nested config menus confusing. Trade-off: a
// plaintext file in the user's home dir is less locked-down than the OS keychain —
// but it's a per-user token, scoped to that user's own account, on their own machine.
//
// No dependencies. Safe in read-only/sandbox environments (everything fails soft).

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

const HOME = (() => { try { return homedir(); } catch { return ""; } })();

// Every secret the suite might need — so whichever plugin runs first can create ONE
// complete template file that serves all of them.
export const SUITE_KEYS = [
  { name: "RAG_WEBHOOK_TOKEN",   hint: "Program Assistant: the webhook token from Tim (sent as X-RAG-Token)." },
  { name: "SMARTSHEET_USER_PAT", hint: "Smartsheet: your OWN Smartsheet Personal Access Token." },
  { name: "CANVAS_API_TOKEN",    hint: "Canvas (faculty): your OWN Canvas API token." },
  { name: "CANVAS_GATE_KEY",     hint: "Canvas (faculty): the gate key from Tim." },
];

// Candidate token files, highest priority first.
export function tokenFilePaths() {
  const paths = [];
  if (process.env.SYSTEMSBOT_TOKEN_FILE) paths.push(process.env.SYSTEMSBOT_TOKEN_FILE);
  if (HOME) {
    paths.push(join(HOME, ".systemsbot", "tokens.env"));
    paths.push(join(HOME, ".systemsbot", "tokens.txt"));
    paths.push(join(HOME, "systemsbot-tokens.env"));
    paths.push(join(HOME, "systemsbot-tokens.txt"));
  }
  paths.push(join(process.cwd(), ".env"));
  return paths;
}

// The one path we auto-create and point the user at.
export function primaryTokenFile() {
  if (process.env.SYSTEMSBOT_TOKEN_FILE) return process.env.SYSTEMSBOT_TOKEN_FILE;
  return HOME ? join(HOME, ".systemsbot", "tokens.env") : join(process.cwd(), ".env");
}

function parseEnvText(txt) {
  const map = {};
  for (const line of String(txt).split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const eq = s.indexOf("=");
    if (eq < 0) continue;
    const k = s.slice(0, eq).trim();
    let v = s.slice(eq + 1).trim();
    if (v.length >= 2 && ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'"))) {
      v = v.slice(1, -1);
    }
    if (k && !(k in map)) map[k] = v;
  }
  return map;
}

let _fileMap = null;
function fileMap() {
  if (_fileMap) return _fileMap;
  const merged = {};
  for (const p of tokenFilePaths()) {
    try {
      if (!existsSync(p)) continue;
      const m = parseEnvText(readFileSync(p, "utf8"));
      for (const k of Object.keys(m)) if (!(k in merged)) merged[k] = m[k]; // higher-priority file wins
    } catch { /* ignore unreadable file */ }
  }
  _fileMap = merged;
  return merged;
}

// Environment variable first (the menu path), then the token file. "" if unset/blank.
export function resolveSecret(name) {
  const ev = process.env[name];
  if (ev && String(ev).trim()) return String(ev).trim();
  const fv = fileMap()[name];
  if (fv && String(fv).trim()) return String(fv).trim();
  return "";
}

// Create a commented template token file IF none exists yet. Never modifies an
// existing file (won't clobber the user's pasted tokens). Fail-soft. Returns the
// path it created, or "".
export function ensureTemplate(entries = SUITE_KEYS) {
  for (const p of tokenFilePaths()) { try { if (existsSync(p)) return ""; } catch { /* ignore */ } }
  const target = primaryTokenFile();
  try {
    const dir = dirname(target);
    if (dir) mkdirSync(dir, { recursive: true });
    const out = [
      "# Systems AI Bot - your personal tokens.",
      "# Paste each token right after its = sign (no spaces, no quotes). Save the file, then",
      "# fully quit and reopen Claude. This file stays on your computer only - treat it like a",
      "# password and never share it. You only need to fill in the lines for the tools you use.",
      "",
    ];
    for (const e of entries) { out.push("# " + e.hint); out.push(e.name + "="); out.push(""); }
    writeFileSync(target, out.join("\n"), { flag: "wx" }); // wx: never overwrite
    return target;
  } catch { return ""; }
}

// A friendly, copy-pasteable message telling the user exactly how to supply a token.
export function missingTokenMessage(keyName, humanLabel) {
  const path = primaryTokenFile();
  return [
    `I can't do that yet — no ${humanLabel} is set up.`,
    ``,
    `One-time fix (about 30 seconds, no admin rights, no menus):`,
    `  1. Open this text file on your computer:`,
    `       ${path}`,
    `     (It should already exist with blank lines ready. If not, just create it.)`,
    `  2. Find the line starting with "${keyName}=" and paste your token right after the "=",`,
    `     for example:  ${keyName}=abc123yourtoken`,
    `  3. Save the file, then fully quit and reopen Claude.`,
    ``,
    `The file lives only on your computer. Treat the token like a password.`,
  ].join("\n");
}
