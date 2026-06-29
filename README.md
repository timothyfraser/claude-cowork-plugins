# claude-cowork-plugins

A small suite of MCP plugins for Claude Cowork and Claude Desktop, built by [Tim Fraser](https://github.com/timothyfraser) for the Cornell University Systems Engineering program. These wrap APIs that the official Claude connectors don't cover, or that the official MCP servers gate behind paid plan tiers the average Cornell user doesn't have.

## Available plugins

| Plugin | Version | What it does |
|---|---|---|
| [program-assistant](plugins/program-assistant/) | 1.0.0 | Grounded, cited answers about the Cornell Systems Engineering program — courses, faculty, forms, deadlines — via a Cornell-hosted RAG service. |
| [smartsheet](plugins/smartsheet/) | 1.0.0 | Smartsheet lookups scoped to **your own** personal access token, via a Cornell-hosted n8n webhook (per-user identity — no shared token or service account). Read tools today; read/write toggle coming. |
| [canvas-faculty](plugins/canvas-faculty/) | 1.0.0 | Ask about your *own* Cornell Canvas courses and students — per-faculty, FERPA-scoped to your Canvas token via a Cornell-hosted n8n agent. |

More planned: Box (file access). Outlook (mail + calendar) is available as the built-in Cowork Microsoft 365 connector rather than a plugin here.

## Installation (for non-coders)

The short version:

1. Make sure you have Claude Cowork (or Claude Desktop) installed.
2. Go to the [Releases page](../../releases/latest) and download the file for the plugin you want:
   - `*-plugin` files for Claude Cowork
   - `*.mcpb` files for Claude Desktop
3. Double-click the downloaded file. Claude will open an install dialog asking for any API tokens the plugin needs.
4. Paste your API token, click Install.
5. In a Cowork or Desktop chat, ask Claude to do something with the service — e.g. "Use Smartsheet to list my sheets."

If a step doesn't work, see [docs/INSTALL.md](docs/INSTALL.md) for the screenshot walkthrough, or check the Box folder your program shares for the same guide in PDF.

## Generating API tokens

Each plugin needs an API token from the service it talks to. See [docs/PAT_GENERATION.md](docs/PAT_GENERATION.md) for step-by-step instructions per service.

## Trust and security

- These plugins are a **personal project** by Tim Fraser. They are **not officially supported by Cornell IT or by Anthropic**.
- API tokens you paste during install land in your operating system's keychain (macOS Keychain, Windows Credential Manager). They are never written to plain-text config files.
- The plugins only talk to the official API endpoints of each service (e.g., `api.smartsheet.com`). No telemetry, no phone-home.
- All source code is in this repo. To verify a release, compare the SHA-256 of the file you downloaded against the `SHA256SUMS` file in the same release.
- See [SECURITY.md](SECURITY.md) for the full security posture and how to report issues.

## Support

Best effort. This is maintained by one person, part-time, alongside a day job. There is no SLA.

- **Bugs / install problems**: email tmf77@cornell.edu with a short description and the exact error message.
- Please **don't** open GitHub issues for individual install help — they get lost. Email is faster.
- Pull requests welcome but reviewed on a best-effort basis.

## License

MIT. See [LICENSE](LICENSE).
