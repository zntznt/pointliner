# Experimental live bridge

This experimental connection is for disposable documents only. It is not an MCP server or a security boundary against hostile local processes, browser extensions, or a compromised page. Ordinary Pointliner remains offline and does not show the bridge.

Run `node tools/live-agent.mjs --pairing-file` in a terminal. Open the printed experimental app, open a disposable OPML document, and select a point if sharing a subtree. Under File, choose Live bridge, choose the scope, enter the printed port and the secret from the private pairing file, and confirm the document is disposable. Never share the secret in chat. Use `--pairing-file`: without it the secret is printed to the terminal and could be captured by terminal recording. The app shares point IDs, hierarchy and text, not notes or properties.
The terminal accepts `read`, `append TEXT`, `edit JSON`, and `disconnect`. Append adds a plain-text child to the authorized selected point, or a top-level point for whole-document scope. Undo in Pointliner reverses it. The session expires, and changing documents or disconnecting ends it. Data already delivered to a client cannot be recalled. Pointliner refuses operations while a point is being edited; finish the edit first. Loopback credentials are bearer secrets, not proof of process identity. The current experiment does not protect private documents.
After pairing, authenticated browser polls renew a 10-second lease. If they stop, the helper revokes both credentials and discards queued work after that interval; network loss is not instant revocation. Browser background throttling or a suspended machine can end a legitimate session, and event-loop or system suspension can delay enforcement. Reconnect with a fresh helper session.

An already-sent poll can reach the helper after a document switch and renew the lease once. The stopped browser session does not process its response or read the replacement document; the helper can remain paired until disconnect succeeds or that renewed lease expires. Undo and redo keep the session, but each read revalidates the selected scope.

A timed-out append may already have applied. Inspect the document before retrying. Disconnect cannot recall a command already delivered to the browser.

Append accepts up to 500 characters: Unicode letters, combining marks and numbers, spaces, and `. , ! ? ' : -`. Empty text, line breaks, other punctuation (including brackets, braces, `#` and `*`), and structured list, heading, divider, or task prefixes are rejected. This deliberately excludes links, pills and formatted text.

The experimental CLI accepts `edit {"pointId":"…","expected":"…","propsVersion":"…","text":"…"}` using values from `read`. Editing is restricted to plain bullets with timestamp-only properties; structured text, notes and sidecars are rejected. An edit timeout may mean it applied: inspect the document before retrying. Checks compare current text and timestamp properties, not a monotonic revision; a change reverted to the same values cannot be detected.

Read returns opaque, session-local property versions, not property values. Each successful read replaces earlier versions; oversized or unsupported properties have a null version and cannot be edited. If a scope is too large for the response, choose a smaller scope.

Inherited CLI limitations: commands submitted while another command is running can be silently dropped, including disconnect; send one command at a time and wait for the prompt. The terminal input buffer is not bounded before a newline. Writes that would make the authorized scope unreadable are rejected before changing the document.
