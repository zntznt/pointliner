# Claude Code config for this repo

## PR conformance guard (`hooks/check-pr-conformance.mjs`)

A `PreToolUse` hook (wired in `settings.json`) that **blocks** a PR create/edit when
the body lacks a filled UX Conformance Statement (or an explicit `UI: none`). It
mirrors `.github/workflows/ux-conformance.yml` exactly, so "passes the hook" equals
"passes CI": the gate is enforced locally before the call runs, not only after push.

Why it exists: the PR-publishing process (statement in the **PR description**, per
`.github/PULL_REQUEST_TEMPLATE.md` and CLAUDE.md "Opening PRs") was easy to skip
because nothing forced the check at PR-create time. This makes the miss impossible
locally, not merely discouraged.

### It watches both doors

A PR can be published two ways, and the hook is registered for both:

| door | tools |
|---|---|
| Bash | `gh pr create`, `gh pr edit` |
| GitHub MCP | `mcp__github__create_pull_request`, `mcp__github__update_pull_request` |

**This is the #1130 fix, and the MCP half is the important one.** The hook originally
matched `Bash` only, so every PR opened through the MCP tools bypassed it completely
while the hook looked like an active safeguard. A guard that is inert on the path
actually in use is worse than no guard, because people stop watching for what it was
supposed to catch.

### It matches structurally, not by text

The original test was `/\bgh\s+pr\s+(create|edit)\b/` against the **raw command
string**, which blocked commands that create no PR at all: a `grep` for the phrase, a
doc edit that documents the procedure, a commit message that names it. The command is
now tokenized and `gh` must be the invoked binary with `pr create`/`pr edit` as its
first two positional arguments, so a quoted phrase can never trigger it.

### What it lets through, deliberately

- Anything that is not a PR create/edit.
- An **edit with no body** (a title-only change leaves an already-valid body alone).
- A body it cannot statically read: `--body "$(cat …)"`, an unreadable `--body-file`,
  or `--body-file -` fed by a pipe. A heredoc **is** readable and is checked. CI is
  the backstop in the cases it cannot see, and the header says so rather than implying
  the coverage is total.
- Any malformed hook input. A guard must never wedge unrelated calls.

### Tests

`node .claude/hooks/check-pr-conformance.test.mjs` — run by CI in
`.github/workflows/tests.yml`, because a guard whose self-check is never executed rots
exactly like the guard it tests. The cases build the trigger phrase at runtime, so the
test file's own text cannot trip a text-matching guard; that is the bug it pins.

If the check ever needs changing, change it in lockstep with the CI workflow so the
two never drift.
