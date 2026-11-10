# Experimental local transport feasibility test

Run `node --test tests/experimental-transport.mjs` explicitly. It requires Node.js,
Playwright and its Chromium browser. A missing browser is a failure, not a skip.
The test starts temporary servers on ephemeral IPv4 loopback ports, then closes
those servers and the browser. Importing the companion opens no listener.

A real Chromium page, first loaded from `file://` and then from an isolated
local HTTP origin, reads and appends to an in-memory synthetic list through the
companion. A separate Node process reads the browser's append and appends its
own point; the browser then reads that result. No Pointliner document or app
state is accessed. This is neither an MCP implementation nor a product feature.

Each operation uses a fresh 256-bit random, single-use capability. The test
runner provisions browser capabilities via Playwright and native capabilities
via child-process IPC, not URLs, command-line arguments, or log output. The
companion distinguishes browser grants from native grants, checks the exact
loopback Host and endpoint, restricts operations and input sizes, and rejects
replays, invalid requests, unapproved origins and cross-role use. The browser
preflight rejects an unapproved web origin. Capabilities are consumed even when
an authorized request's body is invalid. A grant belongs to the experiment
lifetime; there is no production provisioning, revocation, expiry or persistence.

`Origin: null` is shared by unrelated opaque origins, NOT a file identity. CORS
is a browser read/access policy, NOT authentication; native callers can forge
Origin and Host headers. Separate grants provide authorization, not process
identity. An arbitrary local page is not authorized merely because it has a
null origin, but any page or process that obtains a grant can use it in the
appropriate request context. Test injection is not a secure user-consent or
pairing flow. Same-user processes may inspect process memory, IPC or browser
automation, and a local attacker can deny service or race a stolen grant. No
claim is made that this isolates hostile processes running as the same user.
The harness has not been security audited and is not suitable for real data.
Chromium behavior does not establish compatibility with other browsers or
browser network-policy settings.
