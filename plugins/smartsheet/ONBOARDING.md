# Connect your Smartsheet to Claude — 5-minute setup (no coding)

This lets Claude look things up in **your own** Smartsheet account — your sheets, your rows, your workspaces. It only ever sees what *your* Smartsheet account can see. Nobody else's. You do this once.

There are two short steps:
**A.** Get your personal Smartsheet token. **B.** Paste it into the Claude plugin.

---

## A. Get your personal Smartsheet token

A "token" is just a long password that lets Claude act as **you** in Smartsheet (and only you).

1. Go to **https://app.smartsheet.com** and sign in as you normally do.
2. In the **bottom-left corner**, click **Account** (it may show your initials or a small person icon).
3. Click **Personal Settings**.
4. In the left menu of that window, click **API Access**.
5. Click **Generate new access token**.
6. Give it a name you'll recognize, like **`Claude assistant`**, and click **OK / Generate**.
7. Smartsheet shows you the token **once**. **Copy it now** (click Copy, or select and copy it).
   - ⚠️ You can't see it again later. If you lose it, just come back here and generate a new one — that's fine.
8. Keep it on your clipboard for the next step (or paste it somewhere safe for a moment).

> Tip: A token looks like a long jumble of letters and numbers. Treat it like a password — don't email it or paste it into chats or documents.

---

## B. Paste it into the Claude plugin

1. In Claude, open the **Smartsheet (your account)** plugin settings.
   - (Cowork: open the plugin's settings/configure panel. Claude Desktop: **Settings → Extensions → Smartsheet (your account) → Configure**.)
2. You'll see three settings:
   - **Smartsheet webhook URL** — leave this as it is (it's already filled in for you).
   - **Your Smartsheet Personal Access Token** — **paste your token here** (the one you copied in step A).
   - **Allow write actions (add/update/delete rows)** — **leave OFF** for now. Turn it ON later only if
     you want Claude to be able to add/update/delete rows on your behalf. (Your token's own permissions are
     still the hard limit — this toggle is an extra explicit gate.)
3. Save / Done.

That's it. You're connected.

---

## C. Check that it worked

Ask Claude:

> **"Use smartsheet_whoami"**

Claude should reply with **your** name and Cornell email. That confirms it's wired to *your* Smartsheet account.

Then try:

> **"List my Smartsheets."**
> **"Search my Smartsheet for [a word you know is in one of your sheets]."**

---

## If something's off

- **It shows the wrong person, or an error about the token:** your token may have been mistyped or revoked. Generate a fresh one (Section A) and paste it again (Section B).
- **It says no sheets / can't find a sheet:** the connector can only see what your Smartsheet account can see. If a sheet was shared with a *different* email than the one your token belongs to, ask the sheet owner to share it with you, or run `smartsheet_whoami` to confirm which account you're signed in as.
- **Still stuck:** contact Tim Fraser (tmf77@cornell.edu).

---

## What this can (and can't) do

- ✅ **Look things up**: list your sheets and workspaces, open a sheet's contents, search across your Smartsheet.
- 🔒 **Stays as you**: it can never reach anyone else's Smartsheet data — only yours.
- ✏️ **Optional editing**: if you turn ON the **"Allow write actions"** setting in the plugin (off by default),
  Claude can also add new rows, update rows, or delete rows on your behalf. Your Smartsheet token's permissions
  are still the hard limit, so it can only do what your account can do; the toggle is just an extra "yes, I
  meant to allow this" gate. Leave it OFF if you only want read access.

Your token stays only on your own machine (in Claude's secure settings). It is never shared, never stored in any shared file, and only ever used to talk to your Smartsheet through Cornell's own server.
