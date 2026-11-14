# Experimental Pointliner MCP adapter

For disposable documents only. Node 22 on POSIX is required. Install once with `npm ci` in this directory, then configure an MCP client to launch `node /absolute/path/to/pointliner/tools/live-bridge-mcp/server.mjs` over stdio. No runtime network service or dependency installation is required beyond the existing local loopback bridge.

Call `session_info` for the generated app path, pairing-file path, and port. Open the generated app, load a disposable document, and pair using the secret in the private file. The private pairing file protects against other OS users under normal filesystem permissions, not processes running as the same user. An agent with same-user file access can read it; instructions not to read it are not authorization. The helper and browser must be on the same machine unless a separately secured tunnel and file transfer are arranged. See `guide/live-bridge-agent-pipe.md` and `guide/live-bridge-read-only.md` for pairing and restrictions.

The agent can read the granted scope, append a plain-text point, and edit supported points using the latest read's `pointId`, `expected`, and `propsVersion`. Scope and format restrictions are enforced by Pointliner. A fresh read invalidates earlier property tokens. Cancellation, timeout, or disconnect after delivery can leave a write outcome unknown: inspect the document before retrying. No automatic retries are performed. Closing the MCP session ends the helper. This is not protection against hostile same-user processes, extensions, or compromised pages. Do not use private documents.

The adapter fails closed if more than 32 MCP requests are outstanding or stdout backs up. In-flight writes may have applied; inspect the document before retrying.

Individual MCP input frames are capped at 16 KiB and serialized bridge commands at 8192 bytes; oversized input fails closed. Helper error text is replaced with a generic error, and successful results are limited to supported fields. This does not protect against a malicious same-user process impersonating document content.
