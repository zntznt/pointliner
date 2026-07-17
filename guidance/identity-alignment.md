# Identity alignment — the work list

**Status: ACTIVE program.** `product-identity.md` is the constitution; this file is the
gap list between it and the shipped app, tracked the `ux-remediation.md` way: each item
names the identity clause it serves, the concrete check or change, and a size. Items are
closed by a PR (build items) or a recorded owner decision (review items). The README's
conformance is handled separately (it is the reference execution of §2; only additive
changes land there).

Ground truth at creation (2026-07-17, verified in source): the first-run Welcome tour and
the "Start from an example" gallery exist (`FIRST_RUN_EXAMPLES`, `STARTERS`); the gallery
is already identity-mixed (Campaign oracle, Oracle-driven scene play, Living character
sheet + Project tracker, Reading log, Life dashboard, Weekly meal planner, Trip planner,
Decision helper, Study and flashcards); exports are OPML, Markdown, plain text, and
self-contained HTML. The items below are the deltas, not a rebuild.

---

## Tier 1 — the app is not yet loyal here (build items)

### IA-1 · A base has no exit back to text (§3b, freedom of form) — **the sharpest gap**
Every structure must be "one way of organizing thought, never THE way: opt-in,
reversible." Entering a base is one verb (`/base`, non-destructive); leaving one is not:
there is no "turn this base back into plain points / a typed table" door — the exit today
is Copy as Markdown + manual paste. That is a one-way door into structure, exactly what
§3b forbids.
**Action:** a base-menu door ("Convert to text" or "Break into points") that turns the
grid back into freeform content (the static pipe table in a point, and/or one point per
row) — undoable, announced, the inverse of "Convert table to base." Audit the other
structures for the same one-way smell (properties → delete cleanly ✓; sequences →
deletable ✓; varbase → "Stop using rows as variables" ✓; board/views → switch back ✓).
**Size:** S-M. The one genuinely missing verb.

### IA-2 · The first 30 seconds must deliver the atom (§7, §10.1)
The perception hypothesis lives or dies in the first minutes: type `{2d6}` → it becomes a
live pill → click → it re-rolls. The Welcome tour and empty-state hints exist; what needs
verifying is that the ATOM is the first thing they teach — before outliner mechanics,
before features.
**Action:** audit the first-run path (empty state hint copy, `FIRST_RUN_EXAMPLES`'s first
screen, the examples banner) against one measure: how many seconds/keystrokes from a
fresh open to a live pill the user made themselves. Reorder/rewrite copy so the atom
leads. No new UI expected — copy and ordering.
**Size:** S (audit) + S (copy fixes).

### IA-3 · Philosophy-speak sweep in user-facing copy (§3, the translation rule)
"Text should be alive" and its cousins are internal steering; external copy speaks in
problems a stranger recognizes. The rule is new, so shipped copy predates it.
**Action:** sweep the first-run banner, empty-state hints, the `?` panel intro, the GUIDE
category intros, and dialog hint lines for belief-language; translate to problem-language
where found. (The command descs are terse and mostly fine; this is about the greeting
surfaces.)
**Size:** S.

## Tier 2 — loyalty checks that likely pass but must be verified (review items)

### IA-4 · The substrate review of chronicle / lore dates / custom calendars (§8a, §9.2)
The recorded owner unease: genuinely good solo-RPG tools, but did they reach the
substrate or encode a schema? First-pass reading to structure the review: custom
calendars look substrate-shaped (they generalize "what is a date" the way sequences
generalized "what is a to-do state"); lore dates reuse two existing substrates
(properties + timeline); the chronicle construct (a log with a moving cursor) is the most
schema-shaped of the three — its substrate question is "what is the general instrument
for an ordered record with a moving now?"
**Action:** a written per-feature verdict (substrate / instance-of-substrate / schema),
each with either a generalization proposal or a keep-as-is note; ends in an owner
decision recorded in `product-identity.md` §8a.
**Size:** M (analysis + decision; build only if a generalization is chosen).

### IA-5 · The exit story, stated where users look (§3b, freedom to leave)
The exports exist and are good; what's missing is the FRAMING — the guide never says
"here is how you leave, whole." Freedom-to-leave is a promise worth stating where a
wavering user will look for it.
**Action:** a short "Taking your work elsewhere" passage in `guide/files-and-export.md`
(what each export preserves, what a pill becomes in flat text, OPML as the full-fidelity
form); one sentence in the guide README. Verify the Markdown export's pill-freezing is
legible for every artifact type while writing it.
**Size:** S.

### IA-6 · Menu sweep under the mission test (§9.1)
The `/` and `@` menus accumulated during the PKM build-out. Most entries compose with the
engine; any that are pure parity should be candidates for verbosity-gating (the `ux.md`
dial), not removal.
**Action:** one pass over `BLOCK_CMDS` + insert commands tagging each: composes /
substrate / parity. Output is a short table appended here; gating decisions are
follow-ups.
**Size:** S.

## Tier 3 — standing guards (no work now; re-check on every relevant PR)

- **IA-7 · No telemetry, ever, despite §10.** The hypotheses get validated by talking to
  users and reading their documents when offered — never by instrumenting the app.
  Analytics would violate §3b and the storage model in one stroke. Validation is manual;
  this is a feature of the identity, not a limitation. (Guard: any "usage insights"
  proposal cites this item and dies.)
- **IA-8 · The starter gallery stays identity-mixed.** Verified mixed today (7 general /
  3 RPG). New starters keep roughly that shape: the origin present, never the majority.
- **IA-9 · New domain-shaped features pass the substrate test BEFORE shipping** (§9.2) —
  the question is asked in the proposal, not retrofitted like IA-4.

---

## Order of work

1. **IA-1** (the missing exit verb — the one place the app contradicts §3b today)
2. **IA-2 + IA-3** together (one first-minutes pass: audit, reorder, translate)
3. **IA-4** (the substrate review — analysis PR ending in an owner decision)
4. **IA-5 + IA-6** (the exit story; the menu table)

Each lands as its own PR against this file; an item closes by linking the PR or the
recorded decision beside its heading.
