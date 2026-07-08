# Systems AI Bot — Install Script (for Claude to run)

**How to use this document:** paste this entire page into a **new** Claude chat (Claude Cowork, Claude Desktop, or Claude Code) and say: *"Please run through this install checklist for me."* Claude does the mechanical parts itself — checking your setup, downloading files, verifying them, and opening the install dialog for you. You only do the parts a website/app dialog makes a human do (typing a token into a popup, signing in with your own login). Total time: 5–15 minutes.

**Who this is for:** Cornell Systems Engineering staff and faculty. You do **not** need to be a coder.
**Help:** Tim Fraser — tmf77@cornell.edu

---

## Read this first — where do tokens actually go?

**There is no file to find and no file to edit.** Every plugin below pops open a small install dialog (a native window from Claude itself) the moment its file is opened. That dialog has labeled text boxes — you type the token directly into one of those boxes, click Install, and Claude stores it in your operating system's encrypted credential store (Windows Credential Manager / macOS Keychain). That's the entire mechanism. If you're looking for a config file, a `.env`, or a settings JSON to hand-edit — stop, there isn't one for these plugins; it's always this popup.

This document tells you, for each plugin, the **exact label** of each box in that popup, sourced directly from the plugin's manifest — not a guess.

---

## Instructions for Claude (read this whole block before doing anything)

You are helping a non-technical person install 1–3 Claude plugins. Work through the sections below **in order**, one plugin at a time. For each plugin:

1. **Detect the client.** Check whether this is Claude Cowork or Claude Desktop. If you can't tell from context, ask the user one question: *"Are you using Claude Cowork or Claude Desktop app?"* — don't guess, the file format differs (`.plugin` for Cowork, `.mcpb` for Desktop).
2. **Resolve the exact download URL yourself** — don't send the user to a webpage to hunt for a file. Query the GitHub API for the latest release and find the asset whose name matches this plugin and this client:
   ```
   curl -s https://api.github.com/repos/timothyfraser/claude-cowork-plugins/releases/latest
   ```
   (PowerShell: `Invoke-RestMethod https://api.github.com/repos/timothyfraser/claude-cowork-plugins/releases/latest`)
   In the `assets` array, find the entry whose `name` contains the plugin name and ends in `.plugin` (Cowork) or `.mcpb` (Desktop). Use its `browser_download_url`.
3. **Download it and verify the checksum** — also download the `SHA256SUMS` asset from the same release, compute the SHA-256 of the downloaded file, and confirm it matches the line for that filename. Tell the user explicitly that you verified it (this matters — it's the only integrity check between GitHub and their machine).
   ```
   curl -L -o <name> <browser_download_url>
   sha256sum <name>   # compare against the matching line in SHA256SUMS
   ```
4. **Open the install dialog yourself** — don't tell the user to go find the file in Downloads and double-click it. Launch it the same way a double-click would:
   - Windows (PowerShell): `Start-Process "<path-to-downloaded-file>"`
   - macOS: `open "<path-to-downloaded-file>"`
5. **Stop and hand off clearly.** Tell the user, by name, which dialog just opened and which field(s) to fill in (use the exact labels given per-plugin below — don't paraphrase them, the user is looking at the literal UI). Wait for them to confirm they clicked Install.
6. **Verify it worked yourself.** After the user confirms and restarts Claude if needed, call the plugin's own tool (e.g. `ask_program`, `smartsheet_whoami`) right there in the chat and show the user the real result. Don't just say "you're all set" — prove it.
7. If any step fails (asset not found, checksum mismatch, tool call errors), stop and report the exact error — don't guess at a fix.

If you don't have shell/file-download tools available in this session, don't silently skip steps 2–4 — tell the user plainly which step you can't do for them and give them the exact URL/command so they can run it themselves, then resume at step 5.

---

## Decide which connectors to install

| Connector | Install it if… | Anything to prepare first? |
|---|---|---|
| **1. Program Assistant** | you ever answer questions about the SysEng program | a token from Tim (one email — see 1A) |
| **2. Outlook** | you want Claude to read/search your mail & calendar | nothing — just your NetID login |
| **3. Smartsheet** | you use Smartsheet at Cornell | a Smartsheet account (you make your own token — see 3A) |
| **4. Canvas (faculty)** | you're faculty and want to ask about your own courses | a Canvas account + a gate key from Tim |

No Smartsheet or Canvas account? **Skip that section entirely** — everything else works without it.

---

## 1. Program Assistant (answers program questions, with citations)

**1A. Get the webhook token (one-time, human step — Claude cannot do this for you).**
Email Tim (tmf77@cornell.edu): *"Please send me the program-assistant token."* Wait for it before continuing. Treat it like a password — it's coming to you over a channel Tim considers secure, not pasted into this chat.

**1B–1D (Claude does this).** Following the instructions above: find the `program-assistant` asset matching this client, download it, verify its checksum, and launch it to open the install dialog.

**1E (you do this — the popup, not a file).** The dialog has two boxes:
- **"RAG webhook URL"** — leave as pre-filled. If blank, it's `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/rag-ask`.
- **"Webhook token (X-RAG-Token)"** — paste the token from 1A here.

Click **Install**.

**1F (Claude verifies).** Call `ask_program` with a real question, e.g. *"Who is the director of the Systems Engineering program?"* Show the user the actual cited answer that comes back — that's the proof it's wired up correctly.

---

## 2. Outlook (your mail & calendar in Claude)

**Known gap (2026-07-08): this connector isn't on the public releases page yet.** Claude cannot auto-download it the way it can for the others. Ask Tim to send you the `outlook-connector.plugin` file directly (Teams/Box/email attachment), then tell Claude the file's local path and it will do steps 4–6 (launch the dialog, and later verify).

**2A (you do this — sign-in, not a token).** There's no token box for this one. Once the dialog installs and Claude restarts, ask Claude: *"Log into my Outlook."* A browser window opens — sign in with **netid@cornell.edu** + Duo, click **Accept**.

**2B (Claude verifies).** Call `o365_whoami` and show the result (should be your name/email), then try *"List my 5 most recent emails."*

---

## 3. Smartsheet (your sheets in Claude) — *only if you use Smartsheet*

**3A. Create your personal Smartsheet token (5 minutes, human step — this needs your own login, Claude cannot do it for you).**
- Sign in at **https://app.smartsheet.com**
- Bottom-left corner → **Account** → **Personal Settings** → **API Access**
- Click **Generate new access token**, name it `Claude assistant`, click OK.
- **Copy the token now** — Smartsheet shows it only once. (Lost it? Generate a new one — no harm.)

**3B–3D (Claude does this).** Find the `smartsheet` asset matching this client, download it, verify its checksum, and launch it to open the install dialog.

**3E (you do this — the popup, not a file).** Three boxes:
- **"Smartsheet webhook URL"** — leave as pre-filled.
- **"Your Smartsheet Personal Access Token"** — paste the token from 3A.
- **"Allow write actions (add/update/delete rows)"** — leave **OFF** unless you want Claude adding/editing rows on your behalf.

Click **Install**.

**3F (Claude verifies).** Call `smartsheet_whoami` and show the result — it should be **your** name and Cornell email, confirming it's scoped to your own account, not a shared one.

---

## 4. Canvas (faculty) — *only if you're faculty and want this*

**4A. Get the gate key (one-time, human step).** Email Tim: *"Please send me the Canvas faculty gate key."*

**4B. Create your own Canvas token (human step, your own login).** In Canvas: **Account → Settings → Approved Integrations → New Access Token**.

**4C–4E (Claude does this).** Find the `canvas-faculty` asset, download it, verify its checksum, launch it.

**4F (you do this — the popup, not a file).** Three boxes:
- **"Canvas faculty webhook URL"** — leave as pre-filled.
- **"Your Canvas API token (X-Canvas-Token)"** — paste the token from 4B.
- **"Gate key (X-Gate-Key)"** — paste the key from 4A.

Click **Install**.

**4G (Claude verifies).** Call `ask_canvas` with *"Which courses do I teach?"* and show the real result.

---

## Bonus (nothing to install)

**Email auto-drafts.** If you want the bot to pre-draft replies to routine program questions in your inbox (drafts only — you always review and send), tell Tim. Nothing installs on your machine; it's a one-line change on his side.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| The GitHub API says no matching asset / release only has old files | The release may not be current — email tmf77@cornell.edu, don't guess at a substitute file. |
| Checksum doesn't match | Do not install it. Re-download once, and if it still mismatches, stop and tell Tim. |
| Double-clicking / `Start-Process`/`open` does nothing | Open Claude first, then use **Settings → Extensions / Plugins → Install** and choose the file manually. |
| Program assistant: "webhook 403/401" error | The token was mistyped in the dialog — reopen plugin settings and re-paste it (no leading/trailing spaces). |
| Outlook: "Failed to refresh token" after a password change | Ask Claude to run **o365_logout**, then log in again. |
| Outlook: browser never opens for sign-in | Try off VPN; corporate proxies sometimes block the login redirect. |
| Smartsheet/Canvas: wrong person or token error | Generate a fresh token and re-paste it in the plugin's settings dialog (not a file). |
| Anything else | Email tmf77@cornell.edu with the exact error message and which step you were on. |

**Security notes:** your tokens live in your computer's secure credential storage, entered only through each plugin's own install dialog — never in a file, never in this chat, never in git. Every connector acts as *you and only you*. All AI processing runs on Cornell infrastructure. Nothing ever sends email on your behalf.

---

*Mirrored from the (private) Systems Engineering AI suite repo — edits happen there first.*
