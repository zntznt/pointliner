# Experimental agent pipe

For disposable documents only, launch `node tools/live-agent.mjs --agent` with stdin, stdout and stderr attached to pipes or sockets on POSIX. Stdout emits newline-delimited JSON: a `ready` record gives the temporary app path, private pairing-file path and port, never the secret. Pair the generated app as described in the live bridge guide.

Send one JSON object per line, with a string or integer `id`: `{"id":1,"op":"read"}`, `{"id":2,"op":"append","text":"Example"}`, or `{"id":3,"op":"edit","pointId":"…","expected":"…","propsVersion":"…","text":"…"}`. Responses contain the matching `id` and `result` or `error`. `disconnect` immediately disables operations and gives the browser up to 1.5 seconds to receive a close notification. Bytes following disconnect in the same input chunk are rejected and cause a nonzero exit. If it cancels active or queued work, the process exits nonzero and reports uncertainty where output is available. Exit zero requires all accepted work to have responses and the disconnect acknowledgement to be written; broken or blocked output causes a nonzero exit. A delivered edit may already have applied after a timeout or shutdown. Inspect the document before retrying.

Frames are limited to 8192 bytes, with at most 16 waiting requests. Invalid input, queue overflow, output backpressure or broken output revokes the session. Neither mode protects against a hostile same-user process, SIGKILL, power loss, or blocked filesystem operations. The human terminal mode can stall on unread terminal output and should not be used unattended.

A complete request followed by stdin EOF is drained and its response written before exit; an incomplete frame fails the session.
