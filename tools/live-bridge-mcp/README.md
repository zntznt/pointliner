# Experimental Pointliner MCP adapter

For disposable documents only. Node 22 on POSIX is required. Install once with `npm ci` in this directory, then configure an MCP client to launch `node /absolute/path/to/pointliner/tools/live-bridge-mcp/server.mjs` over stdio. No runtime network service or dependency installation is required beyond the existing local loopback bridge.

The session expires after 300 seconds by default, even while active. To choose an explicit absolute lifetime, add `--lifetime 1800` to the server launch arguments (integer seconds, 1–3600). This does not change the 10-second browser heartbeat lease; a lost browser still revokes the session.

Call `session_info` for the generated app path, pairing-file path, and port. Open the generated app, load a disposable document, and pair using the secret in the private file. The private pairing file protects against other OS users under normal filesystem permissions, not processes running as the same user. An agent with same-user file access can read it; instructions not to read it are not authorization. The helper and browser must be on the same machine unless a separately secured tunnel and file transfer are arranged. See `guide/live-bridge-agent-pipe.md` and `guide/live-bridge-read-only.md` for pairing and restrictions.

The agent can read the granted scope, append a plain-text point, and edit supported points using the latest read's `pointId`, `expected`, and `propsVersion`. Scope and format restrictions are enforced by Pointliner. A fresh read invalidates earlier property tokens. Cancellation, timeout, or disconnect after delivery can leave a write outcome unknown: inspect the document before retrying. No automatic retries are performed. Closing the MCP session ends the helper. This is not protection against hostile same-user processes, extensions, or compromised pages. Do not use private documents.

The adapter fails closed if more than 32 MCP requests are outstanding or stdout backs up. In-flight writes may have applied; inspect the document before retrying.

Individual MCP input frames are capped at 16 KiB and serialized bridge commands at 8192 bytes; oversized input fails closed. Helper error text is replaced with a generic error, and successful results are limited to supported fields. This does not protect against a malicious same-user process impersonating document content.

## Mac browser with a remote SSH helper

The MCP client must **already be running on the remote machine** and `session_info` must refer to that live session. This launcher does not start an MCP server. For a longer setup, configure that server's optional `--lifetime` before starting it; the launcher cannot extend a running session.

On the Mac, install `remote-mac.sh` from the same reviewed checkout (for example, copy it with `scp`), and run it in a terminal:

```sh
sh ./remote-mac.sh user@host PORT /remote/.../pointliner-mcp-XXXXXX/pointliner-live-YYYYYY/index.html /remote/.../pointliner-mcp-XXXXXX/pointliner-live-YYYYYY/pairing.txt
```

Replace the port and both paths with the exact **non-secret** values from `session_info`. The path pair must belong to the same generated app. A trusted SSH config alias, `HostName`, `User`, `IdentityFile`, SSH agent, and configured known-hosts files are supported. The first connection uses your SSH configuration and may prompt for authentication; verify the host fingerprint independently beforehand, as unknown or changed keys are rejected. It requires macOS `open` and OpenSSH. SSH configuration can execute local helpers such as `ProxyCommand`, so use only configuration you trust.

The script clears configured local, remote, and dynamic forwards on its SSH master, then adds only the **same port** from Mac `127.0.0.1` to remote `127.0.0.1` through its private control socket. The control request ignores SSH config so it cannot add those forwards back. Agent forwarding, X11 forwarding, and local commands are disabled for the master. An occupied port or failed authentication stops setup. It copies only the generated HTML into a mode-700 temporary directory, opens it, and explicitly asks before displaying the pairing secret through SSH. Paste the secret into the app, never into chat. **Terminal scrollback, terminal recording, and same-user processes can capture it**; the script does not put it in arguments, a local file, or the clipboard, but cannot prevent such capture. Choose the scope and disposable-document confirmation in the app.

Keep the launcher terminal open while working. Ctrl-C closes its SSH process and removes its local temporary directory on a best-effort basis. The MCP session has its own lifetime and cleanup; closing the tunnel does not guarantee cancellation of a write already delivered to the browser. Abrupt termination, power loss, or a stalled filesystem may leave local files behind. Check the printed connection state and restart from a fresh `session_info` if the session or tunnel ends.
