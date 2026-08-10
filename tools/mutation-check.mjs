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
// USAGE
//     node tools/mutation-check.mjs           # every unit-suite mutant
//     node tools/mutation-check.mjs --list    # print the registry, change nothing
//     node tools/mutation-check.mjs --only <id>

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'tests', 'mutants.json');
const SIDECAR = join(ROOT, 'tools', '.mutation-backup.json');

// ── crash recovery, before anything else touches a file ──────────────────────────────────────────
if (existsSync(SIDECAR)) {
  const { file, content } = JSON.parse(readFileSync(SIDECAR, 'utf8'));
  writeFileSync(join(ROOT, file), content, 'utf8');
  unlinkSync(SIDECAR);
  console.error(`recovered ${file} from a previous interrupted run`);
}

const args = process.argv.slice(2);
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

function runUnitSuite() {
  const r = spawnSync('node', ['--test', 'tests/test.mjs'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  // A suite that did not COMPILE prints no plan. Treating that as "the target test did not fail"
  // is exactly how a harness lies: my first version filtered for `not ok <name>`, read "no such
  // line" as green, and reported a surviving mutant as killed. Demand the summary.
  const failLine = /^# fail (\d+)$/m.exec(out);
  if (!failLine) return { ran: false, out };
  const failed = new Set();
  for (const m of out.matchAll(/^not ok \d+ - (.+)$/gm)) failed.add(m[1].trim());
  return { ran: true, fails: Number(failLine[1]), failed: [...failed], out };
}

let restore = null;
const undo = () => { if (restore) { writeFileSync(restore.path, restore.content, 'utf8'); restore = null; } if (existsSync(SIDECAR)) unlinkSync(SIDECAR); };
process.on('SIGINT', () => { undo(); process.exit(130); });
process.on('SIGTERM', () => { undo(); process.exit(143); });

const results = [];
try {
  for (const m of selected) {
    const path = join(ROOT, m.file);
    const original = readFileSync(path, 'utf8');
    const hits = original.split(m.find).length - 1;
    if (hits !== 1) {
      // Not a failure of the guard: a failure of the REGISTRY. A find string that no longer matches
      // uniquely would silently apply nothing (or apply everywhere) and the mutant would "survive"
      // for a reason that has nothing to do with the guard.
      results.push({ id: m.id, verdict: 'STALE', detail: `find string matches ${hits} times, expected exactly 1` });
      continue;
    }
    writeFileSync(SIDECAR, JSON.stringify({ file: m.file, content: original }), 'utf8');
    restore = { path, content: original };
    writeFileSync(path, original.replace(m.find, m.replace), 'utf8');
    const r = runUnitSuite();
    undo();
    if (!r.ran) results.push({ id: m.id, verdict: 'BROKEN', detail: 'the suite did not run to completion under this mutant' });
    else if (r.failed.some(name => name.includes(m.kills))) results.push({ id: m.id, verdict: 'killed', detail: `${r.fails} failing` });
    else results.push({ id: m.id, verdict: 'SURVIVED', detail: `${r.fails} failing, none of them ${JSON.stringify(m.kills)}` });
  }
} finally {
  undo();
}

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
