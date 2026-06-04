# Security

## What these plugins do with your data

Each plugin in this repo is a thin wrapper around a third-party REST API (Smartsheet, etc.). The plugin runs **locally** on your computer (or in the Cowork process), exchanging requests directly with the official API endpoint of that service. It does not phone home, does not send your data to any third party, and does not store anything between calls.

## API tokens

- You generate the token in the source service's UI (e.g., Smartsheet → Personal Settings → API Access).
- You paste the token into Claude Desktop / Cowork during install.
- The token is stored in your **operating system keychain** (macOS Keychain Access / Windows Credential Manager). Plain-text config files are never touched.
- If you delete the plugin, revoke the token in the source service's UI as well — uninstalling Claude doesn't reach into a third party to revoke API access.

## Verifying a release

For every tagged release, the GitHub Release page includes a `SHA256SUMS` file. To verify you downloaded the official build (not a tampered fork):

```bash
# macOS / Linux
shasum -a 256 smartsheet-cowork-v1.0.0.mcpb
# Windows PowerShell
Get-FileHash -Algorithm SHA256 smartsheet-cowork-v1.0.0.mcpb
```

Compare the output to the matching line in `SHA256SUMS`. They must match exactly.

## What to do if you suspect a problem

- **You think you installed a tampered copy**: revoke any API tokens you pasted into the plugin (in the source service's UI), then delete the plugin from Claude.
- **You found a security bug in this repo's code**: email tmf77@cornell.edu with the words "security issue" in the subject. Please don't open a public GitHub issue with vulnerability details until there's a fix in place. There is no formal SLA, but issues will be looked at within a week.
- **A dependency you noticed is flagged in npm advisories**: open a GitHub issue with the advisory URL. Patches will be cut on best-effort basis.

## Scope of trust

These plugins do not implement any access control beyond what the source service's API already enforces. If your API token can read every sheet in your Smartsheet account, so can the plugin (and so can Claude when invoked by you). Generate **narrowly-scoped tokens** when the source service supports it, and rotate them periodically.

## What this project is NOT

- Not officially supported by Cornell IT, Cornell University, Anthropic, or any of the service providers whose APIs we wrap.
- Not FERPA-cleared. Do not feed regulated student data through these plugins unless you have done your own compliance review. The Cornell Systems Engineering program uses a separate, FERPA-cleared deployment path via Cornell's internal n8n + LiteLLM gateway — that is *not* this repo.
