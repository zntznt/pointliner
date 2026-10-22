#!/usr/bin/env node
// Apply every mutant in tests/mutants.json and prove the guard it targets goes RED.
//
// WHY THIS EXISTS
// The suite's guards fail in two ways. One is the ordinary way, caught by the guard itself. The
// other is that the guard cannot fail at all, and that one is invisible: a vacuous check is
// indistinguishable from a passing check in every report CI produces. Measured over one session's
// work, roughly one new guard in six was vacuous, and every single one was the same SHAPE -- an
// EXISTENCE claim over a search space much larger than its subject:
//
//   `_src.includes(name)`            matched the guide's own copy of the name it was checking
//   `label.includes('base')`         matched "Query base" after `base` had been renamed away
//   accessible-name `includes`       matched "Footnotes" while checking for "Notes"
//   "the menu offered something"     the picker always renders rows
//   `indexOf(a) < indexOf(b)`        still true after the condition between them was negated
//
// Each was found by hand-mutating the app and watching the guard stay green. That act proved the
// guard at one instant and then evaporated into a commit message. This file makes it a standing
// property: the mutation is committed beside the guard, and CI re-proves it on every run.
//
// WHAT IT DOES NOT PROVE. That a guard can fail is necessary, not sufficient. It says nothing about
// whether the guard fails for the RIGHT reason, and nothing about what the guard does not cover.
// Mutation retires vacuity; it does not retire blind spots.
//
// SAFETY. This edits real files in the working tree, so it must never be able to lose work. The
// original text is held in memory AND written to a sidecar before the first edit; the restore runs
// in `finally` and again on SIGINT/SIGTERM; and a leftover sidecar from a killed process is
// restored on the next start before anything else happens.
//
// THE CHILD RUN IS CHOSEN HERE, ALL OF IT (#1597). Every verdict is read out of a `node --test`
// child's output, so whatever decides that output decides the verdict. This file used to decide
// none of it: it spawned whichever `node` was first on PATH and took that Node's DEFAULT reporter.
// Node 23 made `spec` the default even when stdout is not a terminal, where it had been TAP, so on
// Node 26 no run printed the `# fail N` summary this parses: every mutant read BROKEN, and the
// standing proof CLAUDE.md asks for could not be produced on current Node. CI never saw it because
// every job pins Node 22. NODE_OPTIONS reached the child too, so `--test-reporter=tap` there hid
// the bug, and on a fixed version would add a SECOND reporter and break every run. Now the child is
// this same Node binary, the reporter is TAP to stdout, named on the command line, and the
// environment is scrubbed of the two variables that can change either. `--self-test` proves the
// whole chain on whatever Node runs it, and every real run proves it first: see selfTest().
//
// USAGE
//     node tools/mutation-check.mjs              # self-test, then every unit-suite mutant
//     node tools/mutation-check.mjs --list       # print the registry, change nothing
//     node tools/mutation-check.mjs --only <id>  # self-test, then that one mutant
//     node tools/mutation-check.mjs --self-test  # only the self-test; touches nothing in the repo

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'tests', 'mutants.json');
const SIDECAR = join(ROOT, 'tools', '.mutation-backup.json');

// Every spawn is bounded. #1496's CI run wedged inside this loop for the full 25-minute job budget
// against a ~5s-per-mutant baseline, and from the outside a wedged child is indistinguishable from a
// slow one -- the same shape as the job-level timeout added for #1493, one level down. A killed
// child is reported as its own named failure below rather than being read as a suite that "did not
// compile", so a wedge names the mutant it wedged on instead of costing the whole run.
const SUITE_TIMEOUT_MS = 180000;   // 36x the ~5s baseline: generous for a loaded runner, fatal to a hang

// The reporter, named rather than inherited. TAP is the format parseTap() reads, and it is the one
// Node itself uses between a runner and its children. Its destination is named too: a reporter
// given without one is paired with stdout only by default, and defaults are what broke this.
const TEST_ARGV = ['--test', '--test-reporter=tap', '--test-reporter-destination=stdout'];

// The child's environment: the caller's, minus the two variables that change what the child
// prints. NODE_OPTIONS can carry its own --test-reporter (with ours, that is two reporters and an
// argument error), a --test-name-pattern or a --test-skip-pattern; the suite needs nothing from it,
// so it is dropped whole rather than filtered flag by flag. NODE_TEST_CONTEXT is set by a parent
// `node --test`; a child that inherits it switches to that parent's wire protocol and skips its
// files with a warning, which reads as a suite that ran nothing.
function childEnv(base) {
  const env = { ...base };
  delete env.NODE_OPTIONS;
  delete env.NODE_TEST_CONTEXT;
  return env;
}

// TAP escapes a test name: `#` becomes `\#` (an unescaped `#` opens a directive such as `# TODO`),
// and a backslash or a control character is backslash-escaped. Reading the escaped text as the name
// only worked while every `kills` STARTED with its `#`, because `\#1431 x` still contains `#1431 x`;
// "the guard for #1431" would never have been found. Decode it, and drop the directive.
const TAP_ESCAPES = { '\\': '\\', '#': '#', n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v' };
function tapName(raw) {
  let name = '', i = 0;
  for (; i < raw.length; i++) {
    if (raw[i] === '\\' && i + 1 < raw.length) { i++; name += TAP_ESCAPES[raw[i]] ?? raw[i]; continue; }
    if (raw[i] === '#') break;
    name += raw[i];
  }
  return { name: name.trim(), directive: raw.slice(i + 1).trim() };
}

// A suite that did not COMPILE prints no plan. Treating that as "the target test did not fail" is
// exactly how a harness lies: the first version of this file filtered for `not ok <name>`, read "no
// such line" as green, and reported a surviving mutant as killed. So the summary is demanded, and
// the LAST one is taken (a test's own output is relayed as `# ` comments and could print the same
// words earlier). The exit status must agree with it: a run that failed with no failures counted,
// or counted failures and exited clean, was not read correctly, and saying so beats guessing.
function parseTap(stdout, status) {
  const summary = [...stdout.matchAll(/^# fail (\d+)$/gm)].at(-1);
  if (!summary) return { ran: false };
  const fails = Number(summary[1]);
  if ((fails > 0) !== (status !== 0)) {
    return { ran: false, detail: `the exit status (${status}) disagrees with the TAP summary (${fails} failing)` };
  }
  const failed = new Set();
  for (const m of stdout.matchAll(/^not ok \d+ - (.*)$/gm)) {
    const t = tapName(m[1]);
    if (!/^todo\b/i.test(t.directive)) failed.add(t.name);   // a failing TODO is expected, not a failure
  }
  return { ran: true, fails, failed: [...failed] };
}

// `pattern` narrows the run to the guard under test. The registry grew from 46 mutants to well
// over a hundred, and one FULL suite run each (~7s) walked the CI job into its 25-minute timeout --
// a gate that times out has stopped gating. A narrowed run is ~0.7s, a 10x cut that scales with the
// registry instead of fighting it. The full run is still what decides a SURVIVED verdict (below),
// so nothing is traded away: the fast path only has to be able to say "the named guard went red".
function runSuite({ cwd, file, pattern, env }) {
  const argv = [...TEST_ARGV];
  // `kills` is documented as a SUBSTRING of the test name, and several contain regex metacharacters
  // ("Ctrl+Shift+X", "{2d6}", "convert()", "tests.yml"). --test-name-pattern is a regex, so an
  // unescaped one matches nothing. That direction is SAFE by construction rather than by luck: a
  // fast path that finds no failure falls through to the full suite below, which reaches the same
  // verdict slowly. The escape buys speed, and nothing depends on it for correctness.
  if (pattern) argv.push('--test-name-pattern', pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  argv.push(file);
  // process.execPath, not `node` from PATH: the child is the Node that is running this file, so the
  // self-test below proves the same binary the verdicts come from.
  const r = spawnSync(process.execPath, argv,
    { cwd, env: childEnv(env), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: SUITE_TIMEOUT_MS });
  if (r.error && r.error.code === 'ETIMEDOUT') {
    return { ran: false, timedOut: true, detail: `the suite did not finish within ${SUITE_TIMEOUT_MS / 1000}s and was killed` };
  }
  return parseTap(r.stdout || '', r.status);
}

let restore = null;
const undo = () => {
  if (!restore) return;
  writeFileSync(restore.path, restore.content, 'utf8');
  if (existsSync(restore.sidecar)) unlinkSync(restore.sidecar);
  restore = null;
};

// One mutant, one verdict: killed, SURVIVED, STALE or BROKEN. `root` is the tree the mutant's
// `file` is relative to and the suite runs in; the self-test points it at a scratch fixture.
function judge(m, { root, suite, env, sidecar }) {
  const path = join(root, m.file);
  const original = readFileSync(path, 'utf8');
  const hits = original.split(m.find).length - 1;
  if (hits !== 1) {
    // Not a failure of the guard: a failure of the REGISTRY. A find string that no longer matches
    // uniquely would silently apply nothing (or apply everywhere) and the mutant would "survive"
    // for a reason that has nothing to do with the guard.
    return { id: m.id, verdict: 'STALE', detail: `find string matches ${hits} times, expected exactly 1` };
  }
  writeFileSync(sidecar, JSON.stringify({ file: m.file, content: original }), 'utf8');
  restore = { path, content: original, sidecar };
  try {
    // A function replacer, so the replacement is applied LITERALLY: as a string, `$&` and `$'`
    // would splice in text the registry never wrote.
    writeFileSync(path, original.replace(m.find, () => m.replace), 'utf8');
    // FAST PATH: run only the guard this mutant names. A kill is decided by that one test, so if it
    // goes red there is nothing more to learn and the other ~2100 tests are pure cost.
    const quick = runSuite({ cwd: root, file: suite, pattern: m.kills, env });
    const killed = quick.ran && quick.failed.some(name => name.includes(m.kills));
    // A SURVIVED verdict is the expensive, interesting one: the whole suite runs, both to confirm
    // the mutant really is harmless to the named guard and to produce the honest diagnostic --
    // "N failing, none of them X" is what says something ELSE caught the mutation, and it is how
    // two guards in this registry were found to be pinning the wrong claim.
    const r = killed ? quick : runSuite({ cwd: root, file: suite, env });
    if (!r.ran) return { id: m.id, verdict: 'BROKEN',
      detail: r.timedOut ? 'the suite HUNG under this mutant and was killed by the per-run timeout'
                         : r.detail || 'the suite did not run to completion under this mutant' };
    if (r.failed.some(name => name.includes(m.kills))) return { id: m.id, verdict: 'killed', detail: `${r.fails} failing` };
    return { id: m.id, verdict: 'SURVIVED', detail: `${r.fails} failing, none of them ${JSON.stringify(m.kills)}` };
  } finally {
    undo();
  }
}

// THE SELF-TEST. A verdict is only as good as the reading of the child's output, and that reading
// broke once without a single test going red (#1597). So the whole chain -- spawn, reporter,
// environment, parse, name matching -- is run against a fixture whose verdicts are known, in a
// scratch directory outside the repo. Each case runs twice: in the caller's environment, and in one
// that carries exactly what broke or masked it before (a NODE_OPTIONS reporter, an inherited
// NODE_TEST_CONTEXT). Undo the explicit reporter and this fails on Node 23 and later; undo the
// environment scrub and it fails on every version. The `mutation-current-node` CI job runs it on
// the newest Node release, so the next change of default fails there instead of on a laptop.
const FIXTURE_GUARD = [
  "import { test } from 'node:test';",
  "import { readFileSync } from 'node:fs';",
  "const subject = readFileSync(new URL('./subject.txt', import.meta.url), 'utf8');",
  // A `#` mid-name and regex metacharacters: both have to survive TAP escaping and the pattern escape.
  "test('the fixture guard #7 (answer = yes) holds', () => {",
  "  if (!subject.includes('answer = yes')) throw new Error('the answer changed');",
  '});',
  "test('a bystander that always passes', () => {});",
  '',
].join('\n');
const FIXTURE_SUBJECT = 'answer = yes\nnote = keep\n';
const GUARD_NAME = 'guard #7 (answer = yes) holds';
const SELF_TEST_CASES = [
  { id: 'a-killing-mutant', file: 'subject.txt', find: 'answer = yes', replace: 'answer = no', kills: GUARD_NAME, expect: 'killed' },
  { id: 'a-harmless-mutant', file: 'subject.txt', find: 'note = keep', replace: 'note = gone', kills: GUARD_NAME, expect: 'SURVIVED' },
  { id: 'a-drifted-anchor', file: 'subject.txt', find: 'answer = maybe', replace: 'answer = no', kills: GUARD_NAME, expect: 'STALE' },
  // A suite that cannot even load has proved nothing about the guard, so it must never read as a kill.
  { id: 'a-suite-that-cannot-load', file: 'guard.test.mjs', find: "import { test } from 'node:test';",
    replace: "import { test } from 'node:test'; )", kills: GUARD_NAME, expect: 'not killed' },
];

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'mutation-check-self-test-'));
  try {
    writeFileSync(join(dir, 'guard.test.mjs'), FIXTURE_GUARD, 'utf8');
    writeFileSync(join(dir, 'subject.txt'), FIXTURE_SUBJECT, 'utf8');
    const hostile = { ...process.env, NODE_OPTIONS: '--test-reporter=spec', NODE_TEST_CONTEXT: 'child-v8' };
    const bad = [];
    for (const [where, env] of [['this environment', process.env], ['a hostile environment', hostile]]) {
      for (const c of SELF_TEST_CASES) {
        const r = judge(c, { root: dir, suite: 'guard.test.mjs', env, sidecar: join(dir, '.mutation-backup.json') });
        const ok = c.expect === 'not killed' ? r.verdict !== 'killed' : r.verdict === c.expect;
        if (!ok) bad.push(`${c.id}, in ${where}: ${r.verdict} (${r.detail}); expected ${c.expect}`);
      }
    }
    if (bad.length) {
      console.error(`mutation-check: SELF-TEST FAILED on Node ${process.version}, so no verdict from it can be trusted:\n  ` + bad.join('\n  '));
      return false;
    }
    console.log(`self-test: ${SELF_TEST_CASES.length * 2} fixture verdicts are right on Node ${process.version}`);
    return true;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ── main ──────────────────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

// The self-test touches nothing in the repo, so it runs BEFORE the crash recovery below: a recovery
// here could restore a file out from under a real run in progress in another terminal.
if (args.includes('--self-test')) process.exit(selfTest() ? 0 : 1);

// ── crash recovery, before anything else touches a file ──────────────────────────────────────────
if (existsSync(SIDECAR)) {
  const { file, content } = JSON.parse(readFileSync(SIDECAR, 'utf8'));
  writeFileSync(join(ROOT, file), content, 'utf8');
  unlinkSync(SIDECAR);
  console.error(`recovered ${file} from a previous interrupted run`);
}

const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const mutants = JSON.parse(readFileSync(REGISTRY, 'utf8')).mutants;

if (args.includes('--list')) {
  for (const m of mutants) console.log(`${m.id.padEnd(28)} ${m.suite.padEnd(8)} kills: ${m.kills}`);
  process.exit(0);
}

// Only the unit suite runs by default: one run is ~5s, so a dozen mutants is under a minute. A
// driven mutant costs ~80s, which is a different budget; those are recorded with suite:"browser"
// and skipped here. The skip is COUNTED and printed rather than silent -- a quiet skip reads as
// coverage that was never run, which is the failure this whole file exists to catch.
const selected = mutants.filter(m => (only ? m.id === only : m.suite === 'unit'));
const skipped = mutants.filter(m => !selected.includes(m));

// No verdict is worth reading until the reading itself is proved, on this Node, in this environment.
if (!selfTest()) process.exit(1);

process.on('SIGINT', () => { undo(); process.exit(130); });
process.on('SIGTERM', () => { undo(); process.exit(143); });

const results = [];
for (const m of selected) results.push(judge(m, { root: ROOT, suite: 'tests/test.mjs', env: process.env, sidecar: SIDECAR }));

for (const r of results) {
  const mark = r.verdict === 'killed' ? '  ok  ' : ' FAIL ';
  console.log(`${mark} ${r.id.padEnd(28)} ${r.verdict.padEnd(9)} ${r.detail}`);
}
if (skipped.length) console.log(`\n${skipped.length} mutant(s) not run here (driven; suite:"browser"): ${skipped.map(m => m.id).join(', ')}`);

const bad = results.filter(r => r.verdict !== 'killed');
if (bad.length) {
  console.error(`\n${bad.length} of ${results.length} mutants did not kill their guard.`);
  console.error('A SURVIVED mutant means the guard it names cannot fail: it is decorative, and the');
  console.error('behaviour it claims to protect is unprotected. Fix the GUARD, not the mutant.');
  console.error('A STALE mutant means the registry drifted from the code; re-anchor its find string.');
  process.exit(1);
}
console.log(`\nall ${results.length} mutants killed their guard.`);
