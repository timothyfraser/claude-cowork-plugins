# Systems AI Bot — Personal Install Checklist

**How to use this document:** copy this whole page into a chat with Claude (Claude Cowork, Claude Desktop, or Claude Code) and say: *"Please walk me through this checklist."* Claude will guide you one step at a time. You can also just follow it yourself — every step is point-and-click or copy-paste.

**Who this is for:** Cornell Systems Engineering staff and faculty. You do **not** need to be a coder.
**Time:** 10–25 minutes depending on how many connectors you install.
**Help:** Tim Fraser — tmf77@cornell.edu

> **Note to Claude (the assistant reading this):** You are helping a non-technical Cornell staff/faculty member install a set of pre-built connectors. Go one connector at a time, confirm each verification step before moving on, and never ask the user to paste a token into the chat — tokens go only into plugin settings dialogs. If a step fails, use the troubleshooting notes at the bottom before improvising.

---

## Before you start

- [ ] You have **Claude Cowork** or **Claude Desktop** installed and you can chat with Claude.
- [ ] You know which one you have (it matters for which file you download):
  - **Claude Cowork** → you'll install files ending in **`.plugin`**
  - **Claude Desktop** → you'll install files ending in **`.mcpb`**

Decide which connectors you want:

| Connector | Install it if… | Need anything first? |
|---|---|---|
| **1. Program Assistant** | you ever answer questions about the SysEng program | a token from Tim (one email) |
| **2. Outlook** | you want Claude to read/search your mail & calendar | nothing — just your NetID login |
| **3. Smartsheet** | you use Smartsheet at Cornell | a Smartsheet account (you'll make your own token in Step 3A) |

No Smartsheet account? **Skip connector 3** — everything else works without it.

---

## 1. Program Assistant (answers program questions, with citations)

**1A. Get the access token (one-time).**
- [ ] Email Tim (tmf77@cornell.edu): *"Please send me the program-assistant token."* He'll send it via a secure channel. Treat it like a password.

**1B. Download the plugin.**
- [ ] Go to: **https://github.com/timothyfraser/claude-cowork-plugins/releases/latest**
- [ ] Download the **program-assistant** file for your app: the `.plugin` file (Cowork) or the `.mcpb` file (Desktop).

**1C. Install.**
- [ ] Double-click the downloaded file. Claude opens an install dialog.
  - (Claude Desktop alternative: **Settings → Extensions → Install Extension** and pick the file.)
- [ ] Fill in the two settings when prompted:
  - **RAG webhook URL:** leave as pre-filled; if empty, paste `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/rag-ask`
  - **Webhook token:** paste the token from Tim (into the dialog, not into any chat).
- [ ] Click Install / Save.

**1D. Verify.** Ask Claude:
> *"Ask the program assistant: who is the director of the Systems Engineering program?"*

- [ ] ✅ You got an answer naming the director, with `[n]` citations. Done.

---

## 2. Outlook (your mail & calendar in Claude)

**2A. Get the plugin file.**
- [ ] Email Tim (tmf77@cornell.edu) for the current **`outlook-connector.plugin`** file (he shares it directly — it's not on the public downloads page yet).

**2B. Install.**
- [ ] Double-click `outlook-connector.plugin` (Cowork) and confirm the install dialog. No tokens needed — sign-in happens in your browser in the next step.

**2C. Sign in as yourself.**
- [ ] Ask Claude: *"Log into my Outlook."* A browser window opens → sign in with **netid@cornell.edu** + Duo → click **Accept**.

**2D. Verify.** Ask Claude:
> *"Who am I logged in as in Outlook?"* (should say your name/email)
> *"List my 5 most recent emails."*

- [ ] ✅ You saw your own name and your own inbox. Done.

---

## 3. Smartsheet (your sheets in Claude) — *only if you use Smartsheet*

**3A. Create your personal Smartsheet token (5 minutes, one-time).**
- [ ] Sign in at **https://app.smartsheet.com**
- [ ] Bottom-left corner → **Account** → **Personal Settings** → **API Access**
- [ ] Click **Generate new access token**, name it `Claude assistant`, click OK.
- [ ] **Copy the token now** — Smartsheet shows it only once. (Lost it? Just generate a new one.)

**3B. Download the plugin.**
- [ ] Go to: **https://github.com/timothyfraser/claude-cowork-plugins/releases/latest**
- [ ] Download the **smartsheet** file for your app (`.plugin` for Cowork, `.mcpb` for Desktop).

**3C. Install.**
- [ ] Double-click the file; in the install dialog:
  - **Smartsheet webhook URL:** leave as pre-filled.
  - **Your Smartsheet Personal Access Token:** paste the token from 3A.
  - **Allow write actions:** leave **OFF** (you can turn it on later if you want Claude to add/update rows for you).

**3D. Verify.** Ask Claude:
> *"Use smartsheet_whoami"* (should return **your** name and Cornell email)
> *"List my Smartsheets."*

- [ ] ✅ It's you, and those are your sheets. Done.

---

## Bonus (nothing to install)

**Email auto-drafts.** If you'd like the bot to pre-draft replies to routine program questions in your inbox (drafts only — you always review and send), just tell Tim. Enrollment is a one-line change on his side; nothing installs on your machine. See the [Use Cases guide](USE_CASES.md#2-email-drafts-written-for-you-the-email-responder) for exactly how it behaves.

**Canvas for faculty.** Faculty who want to ask about their own Canvas courses: ask Tim — it needs one extra key from him plus a Canvas token you create yourself.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Double-clicking the file does nothing | Open Claude first, then use **Settings → Extensions / Plugins → Install** and choose the file manually. |
| Program assistant: "webhook 403/401" error | The token was mistyped. Re-open the plugin settings and re-paste it (no spaces before/after). |
| Outlook: "Failed to refresh token" after a password change | Ask Claude to run **o365_logout**, then log in again. |
| Outlook: browser never opens for sign-in | Try off VPN; corporate proxies sometimes block the login redirect. |
| Smartsheet: wrong person or token error | Generate a fresh token (Step 3A) and re-paste it in the plugin settings. |
| Smartsheet: "can't see sheet X" | The connector sees exactly what your Smartsheet account sees. Ask the sheet owner to share it with you. |
| Anything else | Email tmf77@cornell.edu with the exact error message. |

**Security notes, so you never have to wonder:** your tokens live in your computer's secure credential storage (never in files or chats); every connector acts as *you and only you*; all AI processing runs on Cornell infrastructure; nothing ever sends email on your behalf.

---

*Mirrored from the (private) Systems Engineering AI suite repo — edits happen there first.*
