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

---

## Where do tokens actually go? (there is no config file)

Every plugin below opens a small **install dialog** — a native window from Claude — the moment its file is opened. That dialog has labeled text boxes; you type the token directly into one, click Install, and Claude stores it in your OS's encrypted credential store (Windows Credential Manager / macOS Keychain). **There is no `.env`, no JSON, no file to hand-edit** — if you're hunting for one, stop; it's always this popup. This document gives the **exact box labels** per plugin, taken from each plugin's manifest.

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
2. **Resolve the download URL** (works from A or B — it's just an API read). Query the latest-release API (see Reference values). In the `assets` array pick the entry whose `name` contains the plugin name **and** matches the client (`-cowork-….plugin` or `-desktop-….mcpb`); use its `browser_download_url`. Also note that the release is on the official repo `timothyfraser/claude-cowork-plugins` (see step 3 on why that matters).
   - `curl -s https://api.github.com/repos/timothyfraser/claude-cowork-plugins/releases/latest`
   - PowerShell: `Invoke-RestMethod https://api.github.com/repos/timothyfraser/claude-cowork-plugins/releases/latest`
3. **Download + verify the checksum, and show your work.** Download the asset and the `SHA256SUMS` asset from the same release, compute the file's SHA-256, and **print the computed hash and the expected hash side by side** so the user (and you) can see they match — don't just say "verified."
   - `curl -L -o <name> <browser_download_url>` then `sha256sum <name>` (macOS: `shasum -a 256`; PowerShell: `Get-FileHash <name> -Algorithm SHA256`), and `grep <name> SHA256SUMS`.
   - **Be honest about what this proves:** matching `SHA256SUMS` (which lives in the *same* release) confirms the file wasn't **corrupted or swapped in transit** — it does *not* prove **authenticity** (whoever controls the release could regenerate matching sums). The real trust anchors here are: you fetched from the official repo above over HTTPS, and the release was built by that repo's GitHub Actions release workflow. If a stronger guarantee ever matters, cross-check the hash against a value Tim gives you out-of-band.
4. **Confirm before launching anything.** Installing runs a downloaded bundle — treat it like any executable. **Present the file path, its verified SHA-256, and the release URL, and ask the user to confirm before you launch it.** Only after they say yes:
   - **(A) local:** launch it as a double-click would — Windows: `Start-Process "<path>"`; macOS: `open "<path>"`.
   - **(B) sandbox:** you can't launch on their machine — give them the one-line command to run themselves, or tell them to double-click the file they downloaded.
5. **Hand off for token entry.** Tell the user which dialog opened and which box(es) to fill — quote the **exact labels** from the per-plugin section below (the user is reading the literal UI; don't paraphrase). Wait for them to click Install.
6. **Prove it worked.** After they confirm (and restart Claude if the client needs it), call the plugin's own tool (`ask_program`, `smartsheet_whoami`, etc.) right here and show the real result. Never declare success without a live check.
7. **On any failure** (no matching asset, hash mismatch, tool errors) — stop and report the exact error; don't guess a workaround. A hash mismatch means **do not install** — re-download once, and if it still mismatches, stop and email Tim.

---

## Decide which connectors to install

| Connector | Install it if… | Prepare first | Fully automatable? |
|---|---|---|---|
| **1. Program Assistant** | you answer questions about the SysEng program | a token from Tim (email — see 1A) | ✅ from Releases |
| **2. Outlook** | you want Claude to read/search your mail & calendar | **a file from Tim** (not on Releases yet — see note) | ⚠️ needs a side-channel file |
| **3. Smartsheet** | you use Smartsheet at Cornell | your own Smartsheet token (see 3A) | ✅ from Releases |
| **4. Canvas (faculty)** | you're faculty asking about your own courses | your own Canvas token + a gate key from Tim | ✅ from Releases |

> **Heads-up on Outlook (#2):** unlike the other three, the Outlook connector is **not on the public Releases page yet**, so Claude can't auto-download it — you'll need Tim to send you the file directly first. If you want a clean "paste the doc and go" run, do connectors 1/3/4 now and handle Outlook separately.

No Smartsheet or Canvas account? **Skip that section** — everything else still works.

---

## 1. Program Assistant (answers program questions, with citations)

**1A. Get the webhook token (human step — Claude can't do this).** Email Tim (tmf77@cornell.edu): *"Please send me the program-assistant token."* Wait for it. Treat it like a password — it arrives over a channel Tim considers secure; don't paste it into the chat.

**1B–1D (Claude, per Step 0).** Find the `program-assistant` asset for this client, verify its checksum (show the hashes), confirm with you, and open the install dialog.

**1E (you — the popup).** Two boxes:
- **"RAG webhook URL"** — leave as pre-filled (if blank, use the program-assistant webhook URL from Reference values).
- **"Webhook token (X-RAG-Token)"** — paste the token from 1A.

Click **Install**.

**1F (Claude proves it).** Call `ask_program` with *"Who is the director of the Systems Engineering program?"* and show the cited answer.

---

## 2. Outlook (your mail & calendar in Claude)

**Not on Releases yet (2026-07-08).** Ask Tim for the `outlook-connector.plugin` file directly (Teams/Box/email). Once you have it locally, tell Claude the file path; Claude does the confirm-and-launch (Step 0/4) — there's no checksum step since it didn't come from the release.

**2A (you — sign-in, no token box).** After it installs and Claude restarts, say *"Log into my Outlook."* A browser opens — sign in with **netid@cornell.edu** + Duo, click **Accept**.

**2B (Claude proves it).** Call `o365_whoami` (should be your name/email), then *"List my 5 most recent emails."*

---

## 3. Smartsheet (your sheets in Claude) — *only if you use Smartsheet*

**3A. Create your Smartsheet token (human step — your own login).**
- Sign in at **https://app.smartsheet.com**
- Bottom-left → **Account** → **Personal Settings** → **API Access**
- **Generate new access token**, name it `Claude assistant`, click OK.
- **Copy it now** — shown only once. (Lost it? Generate another — no harm.)

**3B–3D (Claude, per Step 0).** Find the `smartsheet` asset, verify checksum, confirm, open the dialog.

**3E (you — the popup).** Three boxes:
- **"Smartsheet webhook URL"** — leave as pre-filled.
- **"Your Smartsheet Personal Access Token"** — paste the token from 3A.
- **"Allow write actions (add/update/delete rows)"** — leave **OFF** unless you want Claude editing rows for you.

Click **Install**.

**3F (Claude proves it).** Call `smartsheet_whoami` — should be **your** name and Cornell email (confirming it's scoped to you).

---

## 4. Canvas (faculty) — *only if you're faculty and want this*

**4A. Get the gate key (human step).** Email Tim: *"Please send me the Canvas faculty gate key."*
**4B. Create your Canvas token (human step, your login).** Canvas: **Account → Settings → Approved Integrations → New Access Token**.

**4C–4E (Claude, per Step 0).** Find the `canvas-faculty` asset, verify checksum, confirm, open the dialog.

**4F (you — the popup).** Three boxes:
- **"Canvas faculty webhook URL"** — leave as pre-filled.
- **"Your Canvas API token (X-Canvas-Token)"** — paste the token from 4B.
- **"Gate key (X-Gate-Key)"** — paste the key from 4A.

Click **Install**.

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
| Program assistant: "webhook 403/401" | Token mistyped in the dialog — reopen plugin settings, re-paste (no stray spaces). |
| Outlook: "Failed to refresh token" after a password change | Ask Claude to run **o365_logout**, then log in again. |
| Outlook: browser never opens for sign-in | Try off VPN; some proxies block the login redirect. |
| Smartsheet/Canvas: wrong person, or token error | Generate a fresh token, re-paste it in the plugin's settings dialog (not a file). |
| Anything else | Email tmf77@cornell.edu with the exact error and which step you were on. |

**Security posture:** tokens live only in your OS's secure credential store, entered through each plugin's install dialog — never in a file, this chat, or git. Every connector acts as *you and only you*. All AI runs on Cornell infrastructure. Nothing ever sends email on your behalf — the checksum step verifies **integrity** (not corrupted/swapped in transit), and you confirm before any installer launches.

---

*Mirrored from the (private) Systems Engineering AI suite repo — edits happen there first.*
