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

### IA-1 · A base has no exit back to text (§3b, freedom of form) — **the sharpest gap** ✓ DONE (#858)
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
**Shipped 2026-07-17 (closes #858):** the base bullet menu gains a primary "Convert to text"
door (`convertBaseToText` + the pure-ish `baseToStaticText`). An authored/variable base keeps its
cell literals + the `#+TBLFM:` recipe, so the static table still computes and round-trips; a query
base freezes its current projection (title cells stay `[[#id]]` links that still navigate). Frozen
cell pills survive via the kept sidecars; every base view-state field is dropped; the node lands in
DISPLAY mode showing the rendered table (not edit mode); one undo restores the base. The audit of
the other structures held: properties/sequences delete cleanly, varbase has its off-switch,
views switch back — bases were the one missing reverse verb.
**Whole program filed as issues 2026-07-17:** IA-1…9 = #858…#866.

### IA-2 · The first 30 seconds must deliver the atom (§7, §10.1) ✓ DONE (#859)
The perception hypothesis lives or dies in the first minutes: type `{2d6}` → it becomes a
live pill → click → it re-rolls. The Welcome tour and empty-state hints exist; what needs
verifying is that the ATOM is the first thing they teach — before outliner mechanics,
before features.
**Action:** audit the first-run path (empty state hint copy, `FIRST_RUN_EXAMPLES`'s first
screen, the examples banner) against one measure: how many seconds/keystrokes from a
fresh open to a live pill the user made themselves. Reorder/rewrite copy so the atom
leads. No new UI expected — copy and ordering.
**Size:** S (audit) + S (copy fixes).
**Shipped 2026-07-17 (closes #859):** the audit found the first-run path was already largely
atom-forward — a genuinely-fresh boot loads the Welcome tour (`FIRST_RUN_EXAMPLES`) whose intro
paragraph opens by naming the atom. Two gaps closed: (1) the blank-canvas entry-point hint led with
`/` (outliner mechanics) and buried pills behind the `@` dialog; it now leads with the concrete atom
(`Try {2d6} for a live pill · / for a to-do or heading · or just write`), the fastest path to the
first live pill; (2) the tour intro described the atom but its first paragraph had no clickable pill
(the illustrative `{curly-brace}` is not one), so it now carries a real `{2d6}` (`Here is one now,
click it: {2d6}`). Both browser-verified; source-pinned.

### IA-3 · Philosophy-speak sweep in user-facing copy (§3, the translation rule) ✓ DONE (#860, verified clean)
"Text should be alive" and its cousins are internal steering; external copy speaks in
problems a stranger recognizes. The rule is new, so shipped copy predates it.
**Action:** sweep the first-run banner, empty-state hints, the `?` panel intro, the GUIDE
category intros, and dialog hint lines for belief-language; translate to problem-language
where found. (The command descs are terse and mostly fine; this is about the greeting
surfaces.)
**Size:** S.
**Done 2026-07-17 (closes #860):** the sweep of the greeting surfaces — the empty-state hints, the
examples banner ("These are live examples to explore. Click any pill…"), the dialog hint lines, and
the GUIDE/concept-guide copy — found NO philosophy-speak: the copy is already problem- and
action-oriented, exactly what the translation rule wants (the belief-language lives only in the
internal docs). No user-facing string needed the translation. Recorded as verified-clean rather than
changed, and the §3 rule now stands as the guard for future greeting copy.

## Tier 2 — loyalty checks that likely pass but must be verified (review items)

### IA-4 · The substrate review of chronicle / lore dates / custom calendars (§8a, §9.2) ✓ ANALYSIS DONE (#861 — owner to ratify)
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

**Verdict (2026-07-17, read against the shipped code — the reassuring answer):** none of the
three is a rigid domain schema. The unease is unwarranted for what's there; the one real finding is
an un-factored substrate, not a rushed one.

- **Custom calendars → SUBSTRATE (passes cleanly, keep as-is).** Dates are epoch-day *integers*; a
  calendar is a general `{months:[{name,days}], week:{length,days}, eras, epochDay}` bijection
  between (y,m,d) and epoch-days (`normalizeCalendar`/`calToEpoch`/`calComponents`). Gregorian is the
  built-in instance; a custom calendar is another instance of the same structure. Every date seam
  reads through `activeCalendar()`/`calComponents(epoch, cal)`, date math still works (epochs are
  numbers), and there is zero migration (a date string carries no calendar marker — its calendar is
  decided by WHERE the point lives, `resolveCalendarId`). This is the *sequences* pattern exactly:
  sequences generalized "what is a to-do state" (built-in TODO/DONE → any declared state set),
  custom calendars generalize "what is a date" (built-in Gregorian → any declared calendar). Textbook
  substrate — it lets you think in your world's time while composing with all date computation.
- **Lore dates → INSTANCE of two substrates (passes, thinnest possible, keep as-is).** A point with a
  `when:`/`date:` property = "this happened," surfaced as a neutral timeline row
  (`collectLoreDates`). No node type, no sidecar, no schema — a recognized *property key* (substrate
  1) feeding the *timeline* (substrate 2). There is nothing to generalize; it is already the
  substrate expressed as a convention.
- **Chronicle → substrate-REUSE with an un-extracted generalization, NOT a rigid schema.** The
  dating mechanism (`collectChronicleDates`: a home subtree organized `Y > M > D > beats`,
  tree-position dating) is *identical* to the journal (`collectJournalDates`). The chronicle is
  effectively "the journal, generalized to any designated home and any calendar" — the journal is the
  *rigid* special case (home hardcoded to the name "Journal", hardcoded Gregorian); the chronicle is
  the more general version. So the real finding is: **the journal and the chronicle are two instances
  of ONE un-extracted substrate — "a dated log subtree" — and the near-duplicate collectors are the
  tell.** Two edges are domain-shaped: (a) `root.gamelog = {targetId, calendarId, cursor}` is a
  *singular* binding ("one designated game log per doc"; the code even notes "#653 scopes this to the
  two logs; a general per-subtree `calendar:` prop is the deferred wider version"); (b) the CURSOR
  (`gamelog.cursor`, the "moving now") is the one genuinely novel construct, welded to the gamelog —
  and it is exactly the owner's substrate question, "the general instrument for an ordered record
  with a moving now." A journal could want a "today" marker; a reading log a "currently reading" one.

**Recommendation: keep all three shipped; record the finding; DO NOT refactor now.** The
substrate-completing move for the chronicle would be to extract "dated log" (unifying journal +
chronicle) and make the moving-now cursor a property of any dated log — a REFACTOR toward the
substrate, not a removal. But forcing it now would itself violate the discipline's own "build the
general instrument on demand, not on spec" rule (the same rule that governs the deferred list).
**Revisit trigger:** the next time the journal or the chronicle needs a substantive change, unify
them then — the change is already touching the duplicated code, so the extraction is nearly free.
The cursor generalization waits for a second real caller (a journal/log that wants a now-marker).
**Owner decision requested:** ratify keep-as-is + the recorded refactor trigger, or direct the
unification now.

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

1. ~~**IA-1** (the missing exit verb — the one place the app contradicts §3b today)~~ ✓ #858
2. ~~**IA-2 + IA-3** together (one first-minutes pass: audit, reorder, translate)~~ ✓ #859 (atom-forward hint + tour pill) · #860 (copy verified clean)
3. ~~**IA-4** (the substrate review — analysis PR ending in an owner decision)~~ ✓ #861 — verdict written, owner to ratify (recommendation: keep-as-is + a recorded unification trigger)
4. **IA-5 + IA-6** (the exit story; the menu table)

Each lands as its own PR against this file; an item closes by linking the PR or the
recorded decision beside its heading.
