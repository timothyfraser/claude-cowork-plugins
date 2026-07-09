# Systems AI Bot — Install Script (for Claude to run)

**How to use this document:** paste this entire page into a **new** Claude chat (Claude Cowork, Claude Desktop, or Claude Code) and say: *"Please run through this install checklist for me."* Claude does the mechanical parts it *can* do from where it's running, hands the rest to you with exact commands, and proves each connector works before moving on. You do only the parts a login/dialog genuinely requires a human for. Total time: 5–15 minutes.

**Who this is for:** Cornell Systems Engineering staff and faculty. You do **not** need to be a coder.
**Help:** Tim Fraser — tmf77@cornell.edu

> **⚠️ If any value in this document shows up as `{SOMETHING}`, `<redacted>`, or looks blanked-out** (an email, a URL, a token field) — your copy got mangled in transit (some chat gateways auto-redact emails/URLs). This document ships with **real** values filled in. Get a clean copy from Tim (tmf77@cornell.edu) rather than guessing at what a placeholder should be.

---

## Reference values (the real values Claude needs — one place, so nothing depends on inline text surviving)

- **Plugin repo:** `timothyfraser/claude-cowork-plugins`
- **Latest-release API:** `https://api.github.com/repos/timothyfraser/claude-cowork-plugins/releases/latest`
- **Latest-release page:** `https://github.com/timothyfraser/claude-cowork-plugins/releases/latest`
- **Program-assistant webhook URL:** `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/rag-ask`
- **Smartsheet webhook URL:** `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/smartsheet-user`
- **Canvas-faculty webhook URL:** `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/canvas-faculty`
- **Admin (for tokens/keys):** tmf77@cornell.edu
- **Release asset naming:** `<plugin>-cowork-<version>.plugin` = **Claude Cowork**; `<plugin>-desktop-<version>.mcpb` = **Claude Desktop**.
- **Outlook connector download URL:** `<TIM: paste your Box/Teams/SharePoint share link for outlook-connector.plugin here — "anyone with the link, no login" sharing so Claude can fetch it directly>`
- **Outlook connector SHA256 (build 2026-07-08):** `d438622587b56b9fa6746b55285de648de5dbe67f3c0d623f96b9feefdb15d6d`
  *(Not on the public GitHub Releases page — it's a fork of a third-party project with no declared upstream license, so it stays on Cornell-internal, link-based distribution rather than a public release.)*

---

## Where do tokens actually go? (one text file — recommended)

**Recommended: edit one plain text file.** After you install any of the three plugins once, it
automatically creates this file on your computer with a blank line ready for every token you might need:

- **Windows:** `C:\Users\<you>\.systemsbot\tokens.env`
- **Mac:** `~/.systemsbot/tokens.env`

Open it in Notepad (or any text editor), paste each token right after its `=` sign (no spaces, no
quotes), save, then **fully quit and reopen Claude**. That's it — one file, no settings menus,
works no matter which Claude app you have or which tabs your organization has enabled/disabled.

```
RAG_WEBHOOK_TOKEN=paste-your-program-assistant-token-here
SMARTSHEET_USER_PAT=paste-your-smartsheet-token-here
CANVAS_API_TOKEN=paste-your-canvas-token-here
CANVAS_GATE_KEY=paste-the-canvas-gate-key-here
```

Only fill in the lines for the plugins you're actually using — leave the rest blank. The file
never leaves your computer, is never sent anywhere but read locally by the plugin, and is never
committed to git or shared. The plugin also marks the folder so git will never track it (a
`.gitignore` naming the token files by name), and on Mac/Linux locks the file/folder to be
readable only by your own account. Still, treat it like a password file — don't copy it into a
shared folder. (On Windows, this relies on the normal per-account privacy of your own profile
folder — testing showed actively tightening Windows permissions can itself risk breaking access,
so we deliberately don't do that.)

**Alternative: the app's own config panel**, if you have access to it and prefer it. Some plugin
installs pop up a settings panel with labeled boxes (defined by the plugin's manifest); paste your
token into the box marked *sensitive* (shown masked, like a password field) and Save. This reaches
the same setting as the file — use whichever you can get to. If your organization has the
Extensions/Connectors tabs disabled or limited, the file always works regardless.

| Plugin | Token file line(s) to fill in | Config-panel field label (if you use that instead) |
|---|---|---|
| **program-assistant** | `RAG_WEBHOOK_TOKEN=` | **Webhook token (X-RAG-Token)** |
| **smartsheet** | `SMARTSHEET_USER_PAT=` | **Your Smartsheet Personal Access Token** |
| **canvas-faculty** | `CANVAS_API_TOKEN=` and `CANVAS_GATE_KEY=` | **Your Canvas API token (X-Canvas-Token)** and **Gate key (X-Gate-Key)** |

> **Don't see the token file yet?** It's created the first time you open/run the plugin. If it's
> still missing, just create the folder and file yourself at the path above with the four lines
> shown, or ask Claude to run `ask_program` (or any tool) once — the plugin creates it on startup.

---

## Instructions for Claude (read this whole block before doing anything)

You are helping a non-technical person install 1–4 Claude plugins. Do it one plugin at a time, and **prove each one works before moving on**.

### Step 0 — Figure out WHERE you are running (this changes everything below)

Before anything, determine which of these you are, because it decides what you can do for the user vs. what you must hand to them:

- **(A) Local with real desktop access** — you're Claude Code / a local agent with shell + filesystem tools that reach *this user's actual machine* (you can write to their Downloads and launch apps on their real OS). → You can do the download + launch steps yourself.
- **(B) Sandboxed / remote session** — you're a Cowork or cloud session whose shell (if any) runs in an **isolated VM**, not the user's real OS. You canNOT write to their real filesystem, reach their keychain, or pop a native install dialog on their desktop. This is common — **do not assume shell access means access to *their* machine.**

**How to tell:** if unsure, run a harmless probe (e.g. print the OS user / hostname / home dir) and ask the user one question: *"Does this path/username look like your own computer, or something generic like a cloud sandbox?"* When still unsure, **assume (B)** — it's the safe default.

- **If (A):** do steps 1–7 yourself, pausing at the human-only points (token entry, confirming a launch).
- **If (B):** you canNOT download to their machine or launch their installer. Instead: resolve and **verify the release metadata** (steps 1–3 read-only), then give the user the **exact copy-paste commands** for their own terminal (with the real URL and expected SHA-256 filled in), and walk them through steps 4–7. Say plainly: *"I'm running in a sandbox, so I can't touch your actual computer — here are the exact commands to run yourself; I'll verify the result with you."*

### Steps

1. **Detect the client.** Cowork or Desktop? The file differs: `.plugin` = Cowork, `.mcpb` = Desktop. If you can't tell, ask.
2. **Resolve the download URL** (works from A or B — it's just an API read). For **program-assistant/smartsheet/canvas-faculty**: query the latest-release API (see Reference values); in the `assets` array pick the entry whose `name` contains the plugin name **and** matches the client (`-cowork-….plugin` or `-desktop-….mcpb`); use its `browser_download_url`. For **Outlook**: there is no release API for it — use the fixed **"Outlook connector download URL"** from Reference values directly (no client-format branching; it's a single `.plugin` file for Cowork).
   - `curl -s https://api.github.com/repos/timothyfraser/claude-cowork-plugins/releases/latest`
   - PowerShell: `Invoke-RestMethod https://api.github.com/repos/timothyfraser/claude-cowork-plugins/releases/latest`
3. **Download + verify the checksum, and show your work.** For program-assistant/smartsheet/canvas-faculty: also download the `SHA256SUMS` asset from the same release. For Outlook: compare against the fixed **"Outlook connector SHA256"** value in Reference values instead (no `SHA256SUMS` file for this one). Either way, compute the file's SHA-256 and **print the computed hash and the expected hash side by side** so the user (and you) can see they match — don't just say "verified."
   - `curl -L -o <name> <url>` then `sha256sum <name>` (macOS: `shasum -a 256`; PowerShell: `Get-FileHash <name> -Algorithm SHA256`).
   - **Be honest about what this proves:** a matching hash confirms the file wasn't **corrupted or swapped in transit** — it does *not* prove **authenticity** (whoever controls the file/release could regenerate matching sums). For the three GitHub-released plugins, the trust anchor is fetching from the official repo over HTTPS with a release built by that repo's own Actions workflow. For Outlook, the trust anchor is that the link and pinned hash both come from this document, sourced directly from Tim. If a stronger guarantee ever matters, cross-check the hash against a value Tim gives you out-of-band.
4. **Confirm before launching anything.** Installing runs a downloaded bundle — treat it like any executable. **Present the file path, its verified SHA-256, and the release URL, and ask the user to confirm before you launch it.** Only after they say yes:
   - **(A) local:** launch it as a double-click would — Windows: `Start-Process "<path>"`; macOS: `open "<path>"`.
   - **(B) sandbox:** you can't launch on their machine — give them the one-line command to run themselves, or tell them to double-click the file they downloaded.
5. **Hand off for token entry.** This step works the same whether you're (A) or (B) — the user edits a file on their own computer either way, nothing depends on your own execution context. Tell them plainly: open `~/.systemsbot/tokens.env` (Windows: `C:\Users\<them>\.systemsbot\tokens.env`), paste the token after the matching `KEY=` line (see the table in "Where do tokens actually go?"), save, then fully quit and reopen Claude. If they'd rather use the app's own config panel instead, that's fine too — same effect.
6. **Prove it worked.** After they confirm (and restart Claude if the client needs it), call the plugin's own tool (`ask_program`, `smartsheet_whoami`, etc.) right here and show the real result. Never declare success without a live check.
7. **On any failure** (no matching asset, hash mismatch, tool errors) — stop and report the exact error; don't guess a workaround. A hash mismatch means **do not install** — re-download once, and if it still mismatches, stop and email Tim.

---

## Decide which connectors to install

| Connector | Install it if… | Prepare first | Fully automatable? |
|---|---|---|---|
| **1. Program Assistant** | you answer questions about the SysEng program | a token from Tim (email — see 1A) | ✅ from Releases |
| **2. Outlook** | you want Claude to read/search your mail & calendar | nothing — just your NetID login | ✅ from a direct link (see Reference values) |
| **3. Smartsheet** | you use Smartsheet at Cornell | your own Smartsheet token (see 3A) | ✅ from Releases |
| **4. Canvas (faculty)** | you're faculty asking about your own courses | your own Canvas token + a gate key from Tim | ✅ from Releases |

> **Note on Outlook (#2):** it's downloaded from a direct link rather than the public GitHub Releases page (it's a fork of a third-party project pending a licensing question — internal-only distribution for now), but the download/verify/launch steps below work exactly the same way.

No Smartsheet or Canvas account? **Skip that section** — everything else still works.

---

## 1. Program Assistant (answers program questions, with citations)

**1A. Get the webhook token (human step — Claude can't do this).** Email Tim (tmf77@cornell.edu): *"Please send me the program-assistant token."* Wait for it. Treat it like a password — it arrives over a channel Tim considers secure; don't paste it into the chat.

**1B–1D (Claude, per Step 0).** Find the `program-assistant` asset for this client, verify its checksum (show the hashes), confirm with you, and open the install dialog.

**1E (you — one file, see "Where do tokens actually go?").** Open `~/.systemsbot/tokens.env`
(Windows: `C:\Users\<you>\.systemsbot\tokens.env`), find the line `RAG_WEBHOOK_TOKEN=`, paste the
token from 1A right after the `=`, save, then fully quit and reopen Claude. (Prefer the app's own
config panel instead? Field labels: **"RAG webhook URL"** pre-filled, **"Webhook token
(X-RAG-Token)"** = the token from 1A.)

**1F (Claude proves it).** Call `ask_program` with *"Who is the director of the Systems Engineering program?"* and show the cited answer.

---

## 2. Outlook (your mail & calendar in Claude)

**2A–2D (Claude, per Step 0).** Download `outlook-connector.plugin` from the direct link in "Reference values" above (not the GitHub Releases page — see the note in the connector table). Compute its SHA256 and compare against the value in Reference values, printing both side by side — same integrity check as the other three, just against a pinned hash here instead of a live `SHA256SUMS` file. Confirm with you, then launch it (Step 0/4).

**2E (you — sign-in, no token box).** After it installs and Claude restarts, say *"Log into my Outlook."* A browser opens — sign in with **netid@cornell.edu** + Duo, click **Accept**.

**2F (Claude proves it).** Call `o365_whoami` (should be your name/email), then *"List my 5 most recent emails."*

---

## 3. Smartsheet (your sheets in Claude) — *only if you use Smartsheet*

**3A. Create your Smartsheet token (human step — your own login).**
- Sign in at **https://app.smartsheet.com**
- Bottom-left → **Account** → **Personal Settings** → **API Access**
- **Generate new access token**, name it `Claude assistant`, click OK.
- **Copy it now** — shown only once. (Lost it? Generate another — no harm.)

**3B–3D (Claude, per Step 0).** Find the `smartsheet` asset, verify checksum, confirm, open the dialog.

**3E (you — one file, see "Where do tokens actually go?").** Open `~/.systemsbot/tokens.env`,
find `SMARTSHEET_USER_PAT=`, paste the token from 3A after the `=`, save, then fully quit and
reopen Claude. (Prefer the config panel instead? Fields: **"Smartsheet webhook URL"** pre-filled,
**"Your Smartsheet Personal Access Token"** = the token from 3A, **"Allow write actions
(add/update/delete rows)"** — leave **OFF** unless you want Claude editing rows for you.)

**3F (Claude proves it).** Call `smartsheet_whoami` — should be **your** name and Cornell email (confirming it's scoped to you).

---

## 4. Canvas (faculty) — *only if you're faculty and want this*

**4A. Get the gate key (human step).** Email Tim: *"Please send me the Canvas faculty gate key."*
**4B. Create your Canvas token (human step, your login).** Canvas: **Account → Settings → Approved Integrations → New Access Token**.

**4C–4E (Claude, per Step 0).** Find the `canvas-faculty` asset, verify checksum, confirm, open the dialog.

**4F (you — one file, see "Where do tokens actually go?").** Open `~/.systemsbot/tokens.env`,
find `CANVAS_API_TOKEN=` and `CANVAS_GATE_KEY=`, paste the Step 4B token and the Step 4A gate key
after each `=`, save, then fully quit and reopen Claude. (Prefer the config panel instead? Fields:
**"Canvas faculty webhook URL"** pre-filled, **"Your Canvas API token (X-Canvas-Token)"** = 4B,
**"Gate key (X-Gate-Key)"** = 4A.)

**4G (Claude proves it).** Call `ask_canvas` with *"Which courses do I teach?"* and show the result.

---

## Bonus (nothing to install)

**Email auto-drafts.** Want the bot to pre-draft replies to routine program questions in your inbox (drafts only — you review and send)? Tell Tim. Nothing installs on your machine.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Claude says it can't reach your files / can't launch the installer | It's running in a **sandbox** (Step 0 case B), not on your computer. Have it give you the exact download + launch commands to run yourself, then continue at the token-entry step. |
| A value in this doc looks like `{...}` or is blanked out | Your copy got redacted in transit — get a fresh copy from Tim; don't guess the value. |
| Latest-release API shows no matching asset for your client | Check you're matching `-cowork-….plugin` (Cowork) vs `-desktop-….mcpb` (Desktop). If truly absent, email Tim — don't substitute a random file. |
| Checksum (computed vs expected) doesn't match | **Do not install.** Re-download once; if it still mismatches, stop and tell Tim. |
| Double-click / `Start-Process` / `open` does nothing | Open Claude first, then **Settings → Extensions / Plugins → Install** and pick the file. |
| Program assistant: "webhook 403/401" or "no ... token is set up" | Token missing/mistyped — open `~/.systemsbot/tokens.env`, check the right line has your token with no stray spaces/quotes, save, fully quit and reopen Claude. |
| Outlook: "Failed to refresh token" after a password change | Ask Claude to run **o365_logout**, then log in again. |
| Outlook: browser never opens for sign-in | Try off VPN; some proxies block the login redirect. |
| Smartsheet/Canvas: wrong person, or token error | Generate a fresh token, re-paste it in `~/.systemsbot/tokens.env` (or the plugin's settings panel), save, restart Claude. |
| Can't find `~/.systemsbot/tokens.env` | It's auto-created the first time you use the plugin. Still missing? Create the folder/file yourself, or just ask Claude to try any tool once. |
| Anything else | Email tmf77@cornell.edu with the exact error and which step you were on. |

**Security posture:** tokens live in a plain text file on your own computer (`~/.systemsbot/tokens.env`) or your OS's secure credential store if you use the config panel instead — either way, only on your machine, never in this chat, never in git, never shared. Every connector acts as *you and only you*. All AI runs on Cornell infrastructure. Nothing ever sends email on your behalf — the checksum step (for downloaded plugin files) verifies **integrity** (not corrupted/swapped in transit), and you confirm before any installer launches.

---

*Mirrored from the (private) Systems Engineering AI suite repo — edits happen there first.*
