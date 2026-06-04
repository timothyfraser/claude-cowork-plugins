# Generating API tokens

Each plugin in this repo needs a token from the service it wraps. The token tells the service that requests coming from your Claude client are really you. **The token gives Claude the same level of access to the service that you yourself have**, so generate it under an account whose access is appropriate.

## Smartsheet

1. Sign in to Smartsheet at [app.smartsheet.com](https://app.smartsheet.com) with the account whose sheets you want Claude to see.
2. Click your profile icon (lower-left corner) → **Personal Settings**.
3. Switch to the **API Access** tab.
4. Click **Generate new access token**.
5. Name the token something memorable — e.g. `Claude Cowork`.
6. Copy the token immediately. **Smartsheet only shows it once.**
7. Paste the token into the plugin install dialog when prompted.

### Smartsheet plan requirements

The PAT generation flow is only available on **paid plans** (Pro and above). Smartsheet's free / individual tier cannot generate tokens. If the "Generate new access token" button is missing, ask your Smartsheet workspace admin to add you to a Business / Enterprise / AWM plan, or to share specific sheets with you so you can use a colleague's token (with permission).

### What the Smartsheet token can do

The PAT inherits **all** of your account's permissions. If you can read sheet X in the UI, so can the plugin. There is no per-sheet scoping at the token level. If you want narrow access, generate the token from an account that only has access to the sheets you want exposed.

### Revoking

To revoke a token: same path (`Profile → Personal Settings → API Access`) and delete the entry. Revoke immediately if you suspect a laptop has been compromised, or when rotating annually.

---

## Other services

Coming as more plugins ship. Drafts:

- **Outlook**: Microsoft Graph app registration with `Mail.ReadWrite` and `Calendars.ReadWrite` scopes. Cornell-managed accounts may require IT-side consent — talk to CIT before requesting.
- **Box**: developer token from `Box Dev Console → My Apps → Configuration → Generate Developer Token`. Short-lived (60 minutes) by default.
- **Canvas**: access token from Canvas → Account → Settings → Approved Integrations → New Access Token.

These sections will be filled in when the corresponding plugins ship.
