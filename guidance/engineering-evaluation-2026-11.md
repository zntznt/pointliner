# Engineering evaluation, 2026-11

An independent read of Pointliner's correctness, test quality and maintainability, done on `main` at
`6f04f8c` (2026-11-27). The code and tests were read and probed first; the audit and remediation
docs, the backlog and the issue tracker were read only afterwards, to drop duplicates.

Method: every defect below was reproduced on a clean tree, driving the real `index.html` in headless
Chromium (Playwright, app globals called through `page.evaluate`, plus keyboard-driven checks where
the bug is an interaction). Function names, not line numbers, per `CLAUDE.md`. Each confirmed defect
is filed as an `agent-review` issue, grouped by root cause.

## Scorecard

| Area | State | Evidence | Risk |
|---|---|---|---|
| Persistence (autosave, OPFS, reload) | Sound | Reload round trip byte-identical (`toOpml`, `dateModified` excluded) for the examples doc and all 15 starters; a reload mid-edit with an unfolded pill keeps the text; OPFS vs localStorage reconcile picks the newer copy | Low |
| Native format (OPML) | Sound | Every node and root field survives `toOpml` then `fromOpml`, including tab/CR/U+2028 in notes, astral text, `]]>`, 200k-char text, qbase, view, colW, inboxes with gaps, seed 0 | Low |
| Formula engine (`evalMath`, dice) | Mixed | 5 confirmed defects (#1694 to #1697); caps, cycles, divide by zero and recursion guards all hold | Medium: silent wrong numbers |
| Bases and query tables | Mixed | Cell numbers read with `parseFloat` (#1693); `qbaseModel` cache and sort order otherwise sound | Medium: silent wrong totals |
| Undo / redo | One real hole | Redo after fresh typing loses the typing (#1702); pill sidecar restore (#1507, #1571) holds | Medium: data loss |
| Import / export (CSV, Markdown, HTML) | Weakest | 4 issues (#1698 to #1701), one privacy, one security | High for shared files |
| Unit / pin suite (`tests/test.mjs`) | Strong but lopsided | 2416 pass in 11.5 s; about 26% of tests are source-only pins | Gaps on value edge cases |
| Mutation registry | Strong | 486 of 486 mutants killed, 436 s locally | Low |
| Browser suite (`tests/browser.mjs`) | Strong, slow | 129 of 163 ran and passed before the brief's 900 s cap; CI budgets 40 min | CI cost |
| Maintainability | Costly | 3.6 MB single file, 47k-line script, 30% comment-only lines, 46 guidance docs (~335k words) | Rising |

## Confirmed defects

All reproduce on `6f04f8c`. None was already open; the duplicates check is under "Dropped" below.

| Issue | Defect | Repro (shortest) | Severity |
|---|---|---|---|
| #1702 | Typing after an undo does not end the redo branch, so Ctrl+Shift+Z overwrites the new typing and no history step holds it. `redo()` does not call `flushActiveTextEdit()`; `undo()` does. | Type ` two`, blur, Ctrl+Z, type ` three`, Ctrl+Shift+Z: the point reads `one two`, ` three` is gone | Data loss |
| #1693 | Base cells read `1,000` as 1 and `$5` as blank, because `cellNum` is `parseFloat`; properties read `1,000` as 1000 (`propScalar`). Calculate and Sort both use `cellNum`. | `vsum` over 1,000, 50, 200 gives `251`; `$100, $40, $5` sorts as text | Wrong result, silent |
| #1694 | `computeTable` writes the 8-significant-figure display value into the cell text, so it is saved; and `formatMathResult` snaps any value under 1e-10 to `0`. | `$3=$1+$2` over 1000000.25 and 234567.64 saves `1234567.9`; `formatMathResult(3e-11)` is `"0"` | Wrong result, persisted |
| #1695 | `evalMath` resolves `e`, `pi`, `tau`, `inf` and `today` before user variables, with no warning at declaration. Dice see the variable, so one name means two things. | `evalMath('e*2', {e: 5})` is 5.4365637 | Wrong result, silent |
| #1696 | `if()` and `?:` take the else branch when the condition is NaN, unlike comparisons and `and`/`or`/`not`. | `if(log(-1), 10, 20)` is 20 | Wrong result, silent |
| #1697 | An exploding d1 is accepted and only stops at the 100-roll cap. | `{1d1!}` totals 100; `{999d1!}` paints 99,900 faces (about 1.7 s) | Wrong result, slow paint |
| #1698 | `pruneNoexport` prunes children but ships the head stores, so a footnote cited only by an excluded point is in the shared HTML. Empty-label links print an excluded point's title in Markdown and text. | `toOpml(pruneNoexport(r)).includes('SECRET FOOTNOTE')` is true | Privacy |
| #1699 | CSV export evaluates property values (`propExprValue`) and has no formula-injection guard in `csvCell`. | `10/12/2024` exports as `0.0004117259552042161`; `=HYPERLINK(...)` is written as is | Wrong result, security |
| #1700 | Delimited import splits lines before parsing quotes, does not escape `}` in written values, and sniffs two lines of prose as a table. | `"line1\nline2"` becomes two points; `x}y` becomes property `x` plus stray `y}` | Wrong result |
| #1701 | The Markdown round trip, which `markdown-import-proposal.md` makes the acceptance test, breaks nested code fences (indent kept), nested headings (capture the following siblings) and notes (come back as child points). | `A > [## H > [x]], B` re-imports as `A, ## H > [x, B]` | Wrong structure |

### Minor, recorded here, not filed

- Every non-finite result is labelled `#ERR (divide by zero)`, including `1e308*1e308` and `log(0)` (`renderMathPill`).
- `{= asdate(1e9)}` shows `NaN-NaN-NaN` (`formatEpochDays` has no invalid-date check).
- `{= SUM(cost)}` is `#ERR (bad ref)` while `sum(Cost)` works: the rollup regexes in `expandAggExpr` are case-sensitive, the rest of `evalMath` is not.
- Whitespace is stripped before parsing, so `{= 2 3}` is 23 and `{2d6 3}` reads as `2d63`.
- A quote point whose text is `> a\n> b` exports as `> a\n> > b`.
- A link label carrying a footnote marker (`Cited claim [^f1]`) exports as a broken Markdown link, because `mdLinkOut` escapes the marker and the footnote pass then reads the id as `f1\`.
- Internal links on the read-only HTML page point at `#id` anchors that no element carries, and open in a new tab.
- An untitled document comes back titled "Pointliner" (`toOpml` writes `r.text || 'Pointliner'`).

### Dropped as duplicates or decisions

- `-2^2` is 4: closed as by-design in #759 (spreadsheet convention).
- The 8-significant-figure display default: kept on purpose in #1333. #1694 is narrower: the cut value is SAVED by tables, and genuine tiny values vanish.
- Thousands commas in properties: fixed in #809. #1693 is the base-cell twin that fix did not reach.

## Test quality

**What guards well.** The mutation registry is real: every one of its 486 mutants is killed by the
guard it names, and the tool runs a self-test before it judges anything. Pure cores are pinned with
seeded values; serialization has a golden pin; the browser suite drives focus, caret and keyboard
classes that source pins cannot see.

**Where it does not.**

1. **Value edge cases are the blind spot, not wiring.** Every defect above sits in a pure core that
   IS tested, with inputs that never reach the failing branch: no grouped or currency cell, no large
   decimal in a table, no tiny value, no variable named like a constant, no NaN condition, no d1. The
   suite pins what a feature was built to do and rarely what a user will type next to it.
2. **Source-only pins are about a quarter of the suite.** A rough count (a test body that reads the
   source text and calls no core) gives 613 of 2313. They prove presence, as `CLAUDE.md` says, and the
   mutation registry is what keeps them honest; outside it, each is one more string to keep in step.
3. **Round trips are tested on clean fixtures.** The Markdown and CSV round-trip tests use plain
   values, so the shapes that break (#1700, #1701) never enter them. OPML is the exception and is sound.
4. **Redo after typing is untested.** Undo and redo are pinned for pills and snapshots, never for the
   ordinary keyboard sequence in #1702.

The cheapest high-value addition is a small table of adversarial INPUTS per core (cells, maths,
dice, CSV, Markdown), run as property-style round trips, rather than more pins of the shape already
present.

## Maintainability

- **Size.** `index.html` is 3.6 MB: a 3.0 MB app script of 47,358 lines, 509 KB of embedded fonts and
  20 KB of CSS. 1,673 top-level functions; 4 are never referenced (`docCaches`,
  `pickFromQueryFolder`, `tapFloorCandidates`, `chipTemplateLabels`). 30% of the script lines are
  comment-only, much of it issue history (why a line changed) rather than what the code does.
- **Coupling hot spots.** `markDirty()` fans out to autosave, the variables panel, the agenda and the
  blank-canvas invite; `render()` and `attachContentEvents` are the main interaction hubs; numeric
  reading is spread over at least four readers (`cellNum`, `propScalar`, `importCellValue`,
  `evalMath`), which is the root of #1693 and of #809 before it.
- **CI cost.** Six jobs in `tests.yml` (plus the conformance and FA workflows). Local timings: unit suite 11.5 s, mutation check 436 s, browser suite
  over 900 s (CI allows 40 min after #1572). The mutation check edits `index.html` in place, so it
  cannot run beside anything that reads the file; a killed run leaves the tree mutated until the next
  run restores it from `tools/.mutation-backup.json`, and SIGTERM waits for the running child.
- **Doc sprawl.** 46 guidance docs, about 335k words, plus `CLAUDE.md`. `ux-remediation.md` alone is
  6,818 lines. Every new doc must be indexed in two places (a test enforces it).

### The three changes that would most reduce future cost

1. **One numeric reader.** Route every "is this a number, and which" question (cells, properties,
   import, CSV export) through one pure core with one adversarial input table. It removes the class
   behind #1693, #1699 and #809, and the sort and Calculate copy then agree by construction.
2. **Move history out of the code.** Keep in-code comments to the current why, and move the issue
   narrative (the "#NNNN: this used to..." paragraphs) to the commit and issue where it already lives.
   About 14k comment-only lines are the largest single reading cost in the file, and they drift.
3. **Make the browser suite fit its budget.** Share one page across checks that only read state, or
   shard the job, so a local run finishes under 15 minutes. A gate that people cannot run locally is
   one they skip; today the full driven suite does not finish inside the brief's 900 s window.

## What was checked and found sound

- Autosave reload of the examples doc and all 15 starters: byte-identical OPML after reload.
- Reload mid-edit with an unfolded pill: text kept.
- The OPFS and localStorage boot reconcile and the debounce flush on `pagehide`.
- OPML field coverage both ways, and `fromOpml` hardening (duplicate ids, depth clamp, bad JSON).
- Self-contained HTML escaping (`</script>`, `<!--`, `$&`), read-only HTML escaping, BibTeX parsing.
- Dice and repeat caps, variable cycles and forward references, h:mm rollups, `0.1+0.2==0.3`.
- The undo sidecar restore for pills (#1507, #1571) and the snapshot preserve list.

Not checked: the folder workspace (it needs a real directory picker), `markdownVaultToPoints`
beyond reading, fictional calendars, `convert()` unit tables.
