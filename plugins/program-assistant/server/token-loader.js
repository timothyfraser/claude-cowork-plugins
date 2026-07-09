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
// Two cheap, dependency-free hardening steps close part of that gap (see
// ensureGitignore / tightenPermissions below): the folder gets a .gitignore naming
// the token filenames explicitly (so it can never land in a git commit even if the
// folder ends up inside a repo), and — on POSIX only — the file/folder get chmod'd to
// owner-only (600/700). On Windows this is a deliberate no-op: real-machine testing
// showed actively re-ACLing via icacls can itself cause a lockout, so we rely instead
// on the existing protection every %USERPROFILE%\... subfolder already has (inherited
// ACLs restrict it to the owning user + admins by default).
//
// Performance/cost note: this whole module is a local router, not an LLM caller. It
// never invokes a model and never makes a network call itself — resolveSecret() reads
// the token file at most once per process (cached in _fileMap) and every subsequent
// call is an in-memory object lookup. The only network call in the plugin is the
// single webhook POST per tool call, which happens identically regardless of whether
// the token came from this file or the app's settings menu. Supplying tokens this way
// adds no LLM-token cost and no measurable latency.
//
// No required dependencies. Safe in read-only/sandbox environments (everything fails soft).

import { readFileSync, existsSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, basename } from "node:path";

const HOME = (() => { try { return homedir(); } catch { return ""; } })();

// The filenames we ever create/read inside the token folder — used to write a precise
// (not blanket) .gitignore naming exactly these, per the "name the specific file to
// ignore" security ask, rather than a broad "*" that could hide unrelated files.
const TOKEN_FILE_BASENAMES = ["tokens.env", "tokens.txt"];

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

// Write a .gitignore into `dir` naming the exact token filenames, if one isn't there
// yet. Always includes the known SUITE_KEYS basenames, PLUS `extraName` if given (so
// the rare HOME-unavailable fallback, which uses ".env" instead of "tokens.env", is
// still covered by name). Never overwrites an existing .gitignore (a user's own
// folder may already have one). Fail-soft: permission errors never throw.
function ensureGitignore(dir, extraName) {
  try {
    const gi = join(dir, ".gitignore");
    if (existsSync(gi)) return;
    const names = new Set(TOKEN_FILE_BASENAMES);
    if (extraName) names.add(extraName);
    writeFileSync(gi, [...names].join("\n") + "\n", { flag: "wx" });
  } catch { /* fail-soft: sandbox/read-only fs, race with another process, etc. */ }
}

// Best-effort owner-only permissions.
//   POSIX: chmod 700 (dir) / 600 (file) — standard, well-understood, safe.
//   Windows: DELIBERATELY A NO-OP. An earlier version of this function ran
//     `icacls <path> /inheritance:r /grant:r <user>:F` to strip inherited ACEs and
//     re-grant the current user. Testing on a real Windows machine showed this can
//     leave the just-created file/folder unreadable (EPERM) even though icacls itself
//     reported the grant succeeded — a real lockout risk, not a theoretical one. Since
//     %USERPROFILE%\... subfolders already inherit ACLs that restrict access to the
//     owning user (and admins) by default, the existing protection is adequate; the
//     active-hardening attempt traded a small, unproven security gain for a real risk
//     of breaking the very file we're trying to protect. So: do nothing on Windows.
function tightenPermissions(targetPath, isDir) {
  if (process.platform === "win32") return;
  try { chmodSync(targetPath, isDir ? 0o700 : 0o600); }
  catch { /* never let a permissions best-effort break the actual feature */ }
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
      // Repair-on-read: a user may have hand-created this file (bypassing
      // ensureTemplate), so it may still have loose default permissions and no
      // .gitignore. Tighten it now, same as a freshly created file. Fail-soft.
      tightenPermissions(p, false);
      const d = dirname(p);
      if (d) { tightenPermissions(d, true); ensureGitignore(d, basename(p)); }
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
//
// Also (regardless of whether the token file itself already existed): writes a
// .gitignore into the folder naming the token filenames explicitly, and best-effort
// tightens the folder/file to owner-only permissions. Both are no-ops (fail-soft) if
// they can't be applied, and never block or break token resolution.
export function ensureTemplate(entries = SUITE_KEYS) {
  const target = primaryTokenFile();
  const dir = dirname(target);

  // Protect the folder even if the token file was created by hand or already exists.
  try { if (dir) mkdirSync(dir, { recursive: true }); } catch { /* fail-soft */ }
  if (dir) ensureGitignore(dir, basename(target));

  for (const p of tokenFilePaths()) { try { if (existsSync(p)) return ""; } catch { /* ignore */ } }
  try {
    const out = [
      "# Systems AI Bot - your personal tokens.",
      "# Paste each token right after its = sign (no spaces, no quotes). Save the file, then",
      "# fully quit and reopen Claude. This file and folder are set to be readable only by",
      "# your own user account, and this folder is git-ignored - but still treat it like a",
      "# password file: don't copy it into a shared folder. You only need to fill in the",
      "# lines for the tools you use.",
      "",
    ];
    for (const e of entries) { out.push("# " + e.hint); out.push(e.name + "="); out.push(""); }
    writeFileSync(target, out.join("\n"), { flag: "wx" }); // wx: never overwrite
    if (dir) tightenPermissions(dir, true);
    tightenPermissions(target, false);
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
