#!/usr/bin/env node
// Self-check for check-pr-conformance.mjs. Run: node .claude/hooks/check-pr-conformance.test.mjs
// Asserts the hook blocks (exit 2) the real PR-publishing failure modes and allows
// (exit 0) everything else, including shell-computed bodies it cannot read.
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const HOOK = join(here, 'check-pr-conformance.mjs');
const run = (command) => spawnSync('node', [HOOK],
  { input: JSON.stringify({ tool_input: { command } }), encoding: 'utf8' }).status;

const good = '## UX Conformance\n- P1 ✅ a\n- P2 ✅ b\n- P3 ✅ c\n- P4 ✅ d\n- P5 ✅ e\n';
const fg = join(here, '.tmp-good.md'), fb = join(here, '.tmp-bad.md');
writeFileSync(fg, good); writeFileSync(fb, '## Summary\nno statement\n');

const ALLOW = 0, BLOCK = 2;
const cases = [
  ['unrelated bash',           'git status',                                                   ALLOW],
  ['gh pr view',               'gh pr view 181',                                               ALLOW],
  ['create: no body',          'gh pr create --title x',                                       BLOCK],
  ['create: missing statement','gh pr create --body "just a summary"',                         BLOCK],
  ['create: UI: none',         'gh pr create --body "UI: none"',                               ALLOW],
  ['create: placeholder left', 'gh pr create --body "UX Conformance\nP1 ✅ <how> P2 ✅ b P3 ✅ c P4 ✅ d P5 ✅ e"', BLOCK],
  ['create: missing P3',       'gh pr create --body "UX Conformance\nP1 ✅ a P2 ✅ b P4 ✅ d P5 ✅ e"',            BLOCK],
  ['create: full valid',       'gh pr create --body "UX Conformance\nP1 ✅ a P2 ✅ b P3 ✅ c P4 ✅ d P5 ✅ e"',     ALLOW],
  ['edit: title only',         'gh pr edit 181 --title y',                                     ALLOW],
  ['body-file: valid',         `gh pr edit 181 --body-file ${fg}`,                             ALLOW],
  ['body-file: missing',       `gh pr edit 181 --body-file ${fb}`,                             BLOCK],
  ['body: $(cat) runtime',     'gh pr create --body "$(cat /tmp/x.md)"',                       ALLOW],
];

let fail = 0;
for (const [desc, cmd, exp] of cases) {
  const got = run(cmd);
  const ok = got === exp;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${desc} (exit ${got}, expected ${exp})`);
}
unlinkSync(fg); unlinkSync(fb);
console.log(fail ? `\n${fail} FAILED` : `\nall ${cases.length} passed`);
process.exit(fail ? 1 : 0);
