#!/usr/bin/env node
// Self-check for check-pr-conformance.mjs. Run: node .claude/hooks/check-pr-conformance.test.mjs
// Asserts the hook blocks (exit 2) the real PR-publishing failure modes and allows
// (exit 0) everything else, including shell-computed bodies it cannot read.
//
// #1130: the two directions this file previously could not see.
//   • FALSE POSITIVE — the old hook tested the RAW COMMAND TEXT for the phrase, so a
//     grep, a doc edit, or a commit message that merely NAMED the procedure was
//     blocked while creating no PR. Every "prose" case below failed before the fix.
//   • FALSE NEGATIVE — the hook only ever ran on Bash, so every PR opened through the
//     GitHub MCP tools bypassed it entirely. Every "mcp" case below was unreachable.
// The trigger phrase is assembled at runtime (PHRASE) so this test file's own text
// cannot trip a text-matching guard, which is the bug it exists to pin.
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const HOOK = join(here, 'check-pr-conformance.mjs');
const PHRASE = ['gh', 'pr'].join(' ');

const run = (event) => spawnSync('node', [HOOK],
  { input: JSON.stringify(event), encoding: 'utf8' }).status;
const bash = (command) => run({ tool_name: 'Bash', tool_input: { command } });
const mcp  = (tool_name, tool_input) => run({ tool_name, tool_input });

const good = '## UX Conformance\n- P1 ✅ a\n- P2 ✅ b\n- P3 ✅ c\n- P4 ✅ d\n- P5 ✅ e\n';
const bad  = '## Summary\nno statement\n';
const fg = join(here, '.tmp-good.md'), fb = join(here, '.tmp-bad.md');
writeFileSync(fg, good); writeFileSync(fb, bad);

const ALLOW = 0, BLOCK = 2;
let fail = 0;
const check = (desc, got, exp) => {
  const ok = got === exp;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${desc} (exit ${got}, expected ${exp})`);
};

console.log('— Bash door: real invocations —');
[
  ['unrelated bash',            'git status',                                        ALLOW],
  ['pr view',                   `${PHRASE} view 181`,                                ALLOW],
  ['create: no body',           `${PHRASE} create --title x`,                        BLOCK],
  ['create: missing statement', `${PHRASE} create --body "just a summary"`,          BLOCK],
  ['create: UI: none',          `${PHRASE} create --body "UI: none"`,                ALLOW],
  ['create: placeholder left',  `${PHRASE} create --body "UX Conformance\nP1 ✅ <how> P2 ✅ b P3 ✅ c P4 ✅ d P5 ✅ e"`, BLOCK],
  ['create: missing P3',        `${PHRASE} create --body "UX Conformance\nP1 ✅ a P2 ✅ b P4 ✅ d P5 ✅ e"`,            BLOCK],
  ['create: full valid',        `${PHRASE} create --body "UX Conformance\nP1 ✅ a P2 ✅ b P3 ✅ c P4 ✅ d P5 ✅ e"`,     ALLOW],
  ['edit: title only',          `${PHRASE} edit 181 --title y`,                      ALLOW],
  ['body-file: valid',          `${PHRASE} edit 181 --body-file ${fg}`,              ALLOW],
  ['body-file: missing',        `${PHRASE} edit 181 --body-file ${fb}`,              BLOCK],
  ['body: $(cat) runtime',      `${PHRASE} create --body "$(cat /tmp/x.md)"`,        ALLOW],
  ['--body=inline form',        `${PHRASE} create --body="just a summary"`,          BLOCK],
  ['global --repo before pr',   `${PHRASE.replace(' pr', '')} --repo o/r pr create --body "just a summary"`, BLOCK],
  ['chained after &&',          `git push -u origin b && ${PHRASE} create --body "just a summary"`,          BLOCK],
  ['absolute path to gh',       `/usr/bin/${PHRASE} create --body "just a summary"`, BLOCK],
].forEach(([d, c, e]) => check(d, bash(c), e));

console.log('\n— Bash door: prose that creates no PR (#1130 false positives) —');
[
  ['grep for the phrase',       `grep -rn "${PHRASE} create" CLAUDE.md`,                        ALLOW],
  ['appending it to a doc',     `echo "run ${PHRASE} create --body ..." >> notes.md`,           ALLOW],
  ['commit message names it',   `git commit -m "documented ${PHRASE} create hygiene"`,          ALLOW],
  ['sed rewriting a doc',       `sed -i 's/x/${PHRASE} edit/' guidance/ux-definition-of-done.md`, ALLOW],
  ['printing the instruction',  `node -e "console.log('to publish, run ${PHRASE} create')"`,    ALLOW],
  ['a path that contains it',   `cat ./notes/${PHRASE.replace(' ', '-')}-create.md`,            ALLOW],
].forEach(([d, c, e]) => check(d, bash(c), e));

console.log('\n— Bash door: heredoc bodies (statically present, so read them) —');
check('heredoc: missing statement',
  bash(`${PHRASE} create --body-file - <<'EOF'\n${bad}EOF`), BLOCK);
check('heredoc: valid statement',
  bash(`${PHRASE} create --body-file - <<'EOF'\n${good}EOF`), ALLOW);
check('body-file - with no heredoc (unreadable, fail open)',
  bash(`cat body.md | ${PHRASE} create --body-file -`), ALLOW);

console.log('\n— MCP door (#1130 false negative: this was entirely unguarded) —');
[
  ['create: missing statement', 'mcp__github__create_pull_request', { title: 'x', body: bad },  BLOCK],
  ['create: no body at all',    'mcp__github__create_pull_request', { title: 'x' },             BLOCK],
  ['create: valid',             'mcp__github__create_pull_request', { title: 'x', body: good }, ALLOW],
  ['create: UI: none',          'mcp__github__create_pull_request', { body: 'UI: none' },       ALLOW],
  ['create: missing P3',        'mcp__github__create_pull_request', { body: '## UX Conformance\nP1 ✅ a\nP2 ✅ b\nP4 ✅ d\nP5 ✅ e' }, BLOCK],
  ['update: missing statement', 'mcp__github__update_pull_request', { pullNumber: 1, body: bad },  BLOCK],
  ['update: title only',        'mcp__github__update_pull_request', { pullNumber: 1, title: 'y' }, ALLOW],
  ['update: valid',             'mcp__github__update_pull_request', { pullNumber: 1, body: good }, ALLOW],
  ['an unrelated MCP tool',     'mcp__github__list_issues',         { owner: 'o', repo: 'r' },     ALLOW],
  ['reading a PR is not writing','mcp__github__pull_request_read',  { pullNumber: 1 },             ALLOW],
].forEach(([d, t, i, e]) => check(d, mcp(t, i), e));

console.log('\n— registration: the hook must actually be WIRED to both doors —');
// Pin the call site, not only the core. Every case above can pass while the hook is
// registered for nothing at all, which is precisely the #1130 failure in a different
// costume: correct logic on a path that never invokes it.
{
  const cfg = JSON.parse(readFileSync(join(here, '..', 'settings.json'), 'utf8'));
  const pre = cfg?.hooks?.PreToolUse ?? [];
  const wired = pre.filter(e => (e.hooks ?? []).some(h => String(h.command ?? '').includes('check-pr-conformance.mjs')));
  check('at least two matchers reference the hook', wired.length >= 2 ? 0 : -1, 0);
  const matchers = wired.map(e => String(e.matcher ?? ''));
  for (const tool of ['Bash', 'mcp__github__create_pull_request', 'mcp__github__update_pull_request']) {
    const hit = matchers.some(m => { try { return new RegExp(`^(${m})$`).test(tool); } catch { return false; } });
    check(`${tool} is covered by a registered matcher`, hit ? 0 : -1, 0);
  }
}

console.log('\n— malformed input must fail open, never wedge a call —');
check('no tool_input',   run({ tool_name: 'Bash' }), ALLOW);
check('empty event',     run({}), ALLOW);
check('body not a string', mcp('mcp__github__create_pull_request', { body: { md: good } }), BLOCK);

unlinkSync(fg); unlinkSync(fb);
console.log(fail ? `\n${fail} FAILED` : `\nall passed`);
process.exit(fail ? 1 : 0);
