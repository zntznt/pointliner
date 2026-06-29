#!/usr/bin/env node
// PreToolUse(Bash) guard: block `gh pr create` / `gh pr edit` unless the PR body
// carries a filled UX Conformance Statement (or an explicit "UI: none").
//
// This mirrors .github/workflows/ux-conformance.yml EXACTLY, so "passes this hook"
// == "passes CI". It moves the failure from after-push to before-the-command-runs,
// because an agent that opens a PR without the statement is the recurring miss this
// guards against (the process is documented in CLAUDE.md ~line 145, but reading it
// was optional; this makes it not).
//
// Contract: reads the PreToolUse hook JSON on stdin ({ tool_input: { command } }).
// Exit 0 = allow. Exit 2 = block (stderr is shown to the agent as the reason).
// Any parse/lookup failure exits 0 (fail-open): a guard must never wedge unrelated
// Bash calls, and CI is still the backstop.

import { readFileSync } from 'node:fs';

function allow() { process.exit(0); }
function block(msg) { process.stderr.write(msg + '\n'); process.exit(2); }

let input = '';
try { input = readFileSync(0, 'utf8'); } catch { allow(); }

let cmd = '';
try { cmd = JSON.parse(input)?.tool_input?.command ?? ''; } catch { allow(); }

// Only intercept gh pr create / gh pr edit. Anything else (including gh pr view,
// gh pr checks, plain git) passes straight through.
if (!/\bgh\s+pr\s+(create|edit)\b/.test(cmd)) allow();

const UNKNOWN = Symbol('body-not-statically-knowable');

// Pull the body out of the command. Forms: --body "..."/--body '...' and
// --body-file PATH. Returns the body string, or null (no --body at all), or
// UNKNOWN (a shell-computed body we can't statically read → fail-open).
function extractBody(c) {
  // --body-file PATH  (read the file)
  let m = c.match(/--body-file[=\s]+("([^"]*)"|'([^']*)'|(\S+))/);
  if (m) {
    const path = m[2] ?? m[3] ?? m[4];
    try { return readFileSync(path, 'utf8'); } catch { return null; }
  }
  // --body "..."  or  --body '...'
  m = c.match(/--body[=\s]+"((?:[^"\\]|\\.)*)"/s);
  if (!m) m = c.match(/--body[=\s]+'((?:[^'])*)'/s);
  if (m) {
    let raw = m[1];
    // A body the SHELL computes at runtime ($(...), `...`, ${...}) is not visible to
    // this static check — we'd be inspecting the literal command text, not the real
    // body. Can't judge it, so fail-open (CI remains the backstop) rather than
    // false-block. Returning UNKNOWN is distinct from null (no body at all).
    if (/\$\(|`|\$\{/.test(raw)) return UNKNOWN;
    return raw.replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }
  return null; // no body flag at all (gh would use the PR template — also non-conforming)
}

const body = extractBody(cmd);

// Body is computed by the shell at runtime, can't inspect it, so allow (CI guards).
if (body === UNKNOWN) allow();

// gh pr create with NO --body uses the template, which still has <placeholders> →
// the agent must pass an explicit, filled --body. Treat "no recoverable body" on a
// create as a block; on an edit, fail-open (an edit may legitimately touch only the
// title and leave an already-valid body in place).
if (body === null) {
  if (/\bgh\s+pr\s+create\b/.test(cmd)) {
    block(prMessage('No --body was passed, so the PR would use the template, which still contains <placeholders>.'));
  }
  allow();
}

// ── the CI gate's exact checks ────────────────────────────────────────────────
// 0. Escape hatch: a pure logic / core-only change with no UI surface.
if (/(^|\n)\s*UI:\s*none\b/i.test(body)) allow();

// 1. The block must exist.
if (!/UX Conformance/i.test(body)) {
  block(prMessage('The PR body has no "UX Conformance" block (and is not "UI: none").'));
}
// 2. No leftover skeleton placeholders.
const ph = body.match(/<how>|<change>|<one-word reason>/gi);
if (ph) block(prMessage(`The statement still has ${ph.length} unfilled placeholder(s) like "<how>".`));
// 3. Each of P1..P5 carries a verdict (✅ or N/A) on its line.
const verdict = /(✅|N\/?-?A)/i;
const lines = body.split('\n');
const missing = ['P1', 'P2', 'P3', 'P4', 'P5'].filter(p =>
  !lines.find(l => new RegExp(`\\b${p}\\b`).test(l) && verdict.test(l)));
if (missing.length) block(prMessage(`No ✅ / N/A verdict found for: ${missing.join(', ')}.`));

allow();

function prMessage(why) {
  return [
    'BLOCKED: UX Conformance Statement missing from the PR body.',
    '',
    why,
    '',
    'This repo gates every UI-touching PR on a filled UX Conformance Statement in the',
    'PR DESCRIPTION (not the commit message). The CI gate would reject this PR too.',
    '',
    'Fix: follow .github/PULL_REQUEST_TEMPLATE.md. The body must contain either:',
    '  • "UI: none"  (for a pure logic / core-only change), OR',
    '  • a filled "UX Conformance" block: a one-line "how" or "N/A reason" on each',
    '    of P1 P2 P3 P4 P5, plus the "Acceptance tests:" and "Regression:" lines,',
    '    and NO <placeholder> text.',
    '',
    'See CLAUDE.md ("Opening PRs") and guidance/ux-definition-of-done.md',
    '("How this gate is run") for the canonical template and meanings.',
  ].join('\n');
}
