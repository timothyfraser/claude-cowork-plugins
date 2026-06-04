# Installing a plugin

This guide assumes you have Claude Cowork or Claude Desktop installed. If you don't, install that first from [claude.ai/download](https://claude.ai/download).

## Step 1 — Generate the API token

Each plugin needs a token from the service it talks to. See [PAT_GENERATION.md](PAT_GENERATION.md) for the per-service instructions. Have the token open in a tab — you'll paste it in step 3.

## Step 2 — Download the plugin file

Go to the [Releases page](https://github.com/timothyfraser/claude-cowork-plugins/releases/latest) and download the file for your client:

- **Claude Cowork**: download the `*.plugin` file (filename will look like `smartsheet-pat-v1.0.plugin`)
- **Claude Desktop**: download the `*.mcpb` file (filename will look like `smartsheet-cowork-v1.0.mcpb`)

If you're not sure which client you have, look at your taskbar:
- "Claude Cowork" → use `.plugin`
- "Claude" (no "Cowork") → use `.mcpb`

## Step 3 — Double-click the file

Your operating system will route the file to Claude. An install dialog opens.

Paste the API token from step 1 into the **API token** field. Leave the other fields at their defaults unless the plugin's per-plugin README says otherwise.

Click **Install**.

## Step 4 — Confirm it worked

Open a chat in Claude and try a simple read-only request, e.g.:

> Use Smartsheet to list the sheets I have access to.

If Claude responds with a list of your sheets, the plugin is connected. If it says it doesn't have Smartsheet access, see "Troubleshooting" below.

## Troubleshooting

### "I don't see the plugin after installing"

- Restart Claude Cowork / Desktop after the install dialog closes.
- Check **Settings → Extensions** (Claude Desktop) or **Settings → Plugins** (Cowork). The plugin should appear in the list.

### "Claude says it doesn't have access"

- Open Settings and confirm the plugin is **enabled** (not just installed).
- Confirm the API token you pasted is the right one — many services have separate "API tokens", "OAuth tokens", and "service account keys". For Smartsheet, the right one is the **Personal Access Token** from `Personal Settings → API Access`.

### "It says my token is invalid"

- Tokens expire and can be revoked. Generate a fresh one in the source service's UI.
- Remove and re-install the plugin to clear the old token from your keychain.

### Nothing here helps

Email **tmf77@cornell.edu** with:
1. Which plugin you're trying to install
2. The exact error message (a screenshot is fine)
3. Whether you're using Cowork or Desktop, and on which OS

I respond on a best-effort basis — usually within a few business days. There is no SLA.
