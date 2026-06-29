# Claude Code config for this repo

## PR conformance guard (`hooks/check-pr-conformance.mjs`)

A `PreToolUse(Bash)` hook (wired in `settings.json`) that **blocks** `gh pr create`
/ `gh pr edit` when the PR `--body` lacks a filled UX Conformance Statement (or an
explicit `UI: none`). It mirrors `.github/workflows/ux-conformance.yml` exactly, so
"passes the hook" equals "passes CI": the gate is enforced locally before the
command runs, not only after push.

Why it exists: the PR-publishing process (statement in the **PR description**, per
`.github/PULL_REQUEST_TEMPLATE.md` and CLAUDE.md "Opening PRs") was easy to skip
because nothing forced the check at PR-create time. This makes the miss impossible
locally, not merely discouraged.

- It only intercepts `gh pr create` / `gh pr edit`; every other Bash call passes
  through untouched.
- It **fails open** (allows) when it cannot statically read the body: a
  shell-computed body (`--body "$(cat …)"`) or an unreadable `--body-file`. CI is
  the backstop in those cases.
- Self-test: `node .claude/hooks/check-pr-conformance.test.mjs`.

If the check ever needs changing, change it in lockstep with the CI workflow so the
two never drift.
