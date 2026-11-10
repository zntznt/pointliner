# Experimental local live bridge

This is a disposable-document experiment, not a production security feature. Use only a copy of
`tests/fixtures/live-bridge-disposable.opml` or another throwaway OPML file with no private data.
The checkbox is an affirmation, not a technical guarantee that a document is disposable.

On Linux with Node.js and Chromium:

1. In a terminal from the checkout, run `node tools/live-agent.mjs`. It starts a helper on IPv4
   loopback and creates a private temporary experimental copy of the app. Open the **Experimental
   app** path printed by the command directly in Chromium. The ordinary `index.html` cannot connect.
2. Open a copy of the disposable OPML fixture in that experimental app. Do not use a real document.
3. The terminal also displays a port and a browser secret. Click the **Sandbox** point; open the
   **File** menu and choose **Live bridge**. Check the disposable-document confirmation, enter the
   port and secret, choose **Selected subtree**, and choose **Connect**. Alternatively explicitly choose **Whole document** to allow reading every point and appending a top-level point; no point selection is needed. Reopen the File menu to check that the status says
   **Connected**, then close the menu.
4. In the terminal, run `read`, then `append A disposable point`. With **Selected subtree**, read includes that point and its descendants, and append adds its direct child. With **Whole document**, read includes all points and append adds a top-level point. Leave point editing before issuing
   a command. Check the new point in the browser, then use Pointliner's undo.
5. Choose **Disconnect bridge** in the File menu, or enter `disconnect` in the terminal. Discard
   the test document afterward. The helper expires after five minutes. Document replacement also
   stops the browser session; closing the page stops processing but the helper may listen until expiry.
   When the agent disconnects, the browser normally reports **Disconnected by agent**. If the
   close notice cannot arrive within 1.5 seconds, it may instead report a lost connection.

If a command times out or a response is lost, the helper revokes the session and discards queued
work. A failed read has no append side effect and is reported separately. **An append may already have been applied before its response was lost. Inspect the disposable
document before retrying**, then restart the helper and pair again. Revocation discards queued work, but a command already delivered to the browser may still apply after disconnect or expiry. Inspect the document before retrying; disconnect is not a guarantee that an in-flight command was cancelled.

The browser and helper normally run on the same computer; SSH forwarding can connect a remote browser as described below. The helper supports one outstanding
command, not arbitrary filesystem access, shell commands, or code evaluation. Limits include 500
characters per appended point, 100 points in the shared branch, a 12 KB projection, and 1,000
model nodes in the document, including the document root. Append also requires room under the
depth limit. A busy editor or active IME composition rejects commands rather than modifying text.

The helper reads only this checkout's `index.html` to make its temporary app copy; it deletes that
copy when it exits normally. The normal app retains `connect-src 'none'`. The experimental copy
permits a connection to the helper's **specific** loopback port, even before pairing and after
revocation while that page remains open. If the port is reused, an injected script could reach a
different local service on it. Local processes, browser extensions, other local pages, and terminal
recording are outside this experiment's trust model. Do not use it with sensitive documents.

Paste the browser secret only into the experimental app. It is displayed on the controlling
terminal, not put in a URL or intentionally written to a log; terminal scrollback or recording can
retain it. Use a private terminal and clear its history. The CLI's separate secret stays in process
memory. No authentication or isolation guarantee is made.

Automated checks: `node --test tests/live-bridge-helper.mjs tests/live-bridge-browser.mjs`. The
browser tests require Playwright, Chromium and the Linux `script` PTY utility. They use only the
synthetic fixture; they never open a personal document.

## Test alongside a local AI agent

This is an interactive terminal workflow, **not MCP**. The agent needs a persistent PTY and access
to the same machine and filesystem as the browser. Do not send the secret in chat or ask the agent
to read the private pairing file. In `--pairing-file` mode the helper writes the browser secret to
an owner-only temporary file instead of the agent's PTY output. The file remains until normal helper
shutdown; an abrupt termination may leave it behind. The secret expires with the session. Local
processes under your account, filesystem backups and your own terminal/editor history remain risks.

Copy this prompt to an agent that can run a persistent PTY on your machine:

> In `/home/znt/pointliner`, start `node tools/live-agent.mjs --pairing-file` in a persistent PTY.
> Keep that process running. Tell me the experimental app path, helper port and private pairing-file
> path from its output, but do not read, print or paste the secret into chat or a tool log. Ask me
> to open the experimental app in Chromium, open only a copy of
> `tests/fixtures/live-bridge-disposable.opml`, select Sandbox, and connect through File > Live
> bridge using the secret I open privately from that pairing file. Wait until I confirm pairing and
> close the File menu. Then send `read` to the same PTY and report what it returns. After I approve
> the exact text, send `append` followed by that text, and ask me to verify it and undo it. If a
> command fails or times out, do not retry an append; ask me to inspect the document first. When I
> say to stop, send `disconnect`, verify a clean exit, and report any error. Never open or modify a
> real document, and do not commit or push.

The `/home/znt/pointliner` path is specific to this checkout; replace it if yours is elsewhere.
After the agent reports the three non-secret values, open the private pairing file locally in an
editor and paste its contents directly into the app's password field. Do not paste it into chat.
The app, agent and your browser must all be local to that same host; a remote-only agent cannot
safely hand you a local file without another secure channel. The agent can see and operate on the
shared disposable subtree after you pair, so keep the experiment free of private data.

## Remote SSH test

On the helper host, run `node tools/live-agent.mjs --pairing-file --port 39119 --lifetime 3600` in a persistent terminal. Lifetime is in seconds (1–3600; default 300). On your computer, keep `ssh -N -L 39119:127.0.0.1:39119 znt@100.102.43.48` running. Securely copy the printed experimental app, disposable fixture, and owner-only pairing file over SSH to a private local directory; open the copied app in Chromium and enter the copied secret privately. Never paste secrets into chat. The copied app is bound to that port; each new helper session has a fresh secret, so copy the new pairing file. Use only disposable data. The SSH tunnel does not fix the experiment's local security limitations.

## Edit an existing point

Run `read` first to obtain the point ID and exact current text. Then use, for example:

```text
edit {"pointId":"ID_FROM_READ","expected":"Initial","propsVersion":"PROPS_VERSION_FROM_READ","text":"Revised text"}
```

The point must still be in the granted scope and its text and timestamp properties must exactly match `expected` and `propsVersion` from the same read. The legacy `expectedProps` spelling is also accepted. A `null` propsVersion means the point has unsupported properties, including timestamp keys with surrounding whitespace. If the complete read response is too large, choose a smaller scope; the session stays connected.
Edits are deliberately limited to ordinary bullet points without notes, non-timestamp properties, or artifact
sidecars, and text containing only letters, numbers, spaces, periods, commas, apostrophes,
question marks and exclamation marks. Text that derives a structured type such as an ordered list is also rejected. Appends have the same plain-text restriction. This intentionally rejects markup, links and pill syntax. Accepted edits and appends receive normal created/edited timestamps.
A focused editor or composition blocks the operation. Each accepted edit is an ordinary undo
step; it is not selective undo after later edits. A lost response means the edit may already
have applied: inspect the document before retrying. This remains a disposable-document-only
experiment, not MCP or production security.
