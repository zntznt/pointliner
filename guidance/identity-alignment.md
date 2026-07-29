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

**Tested from the other side, 2026-07-29 (#1117 / UXP-269):** a later persona pass hit IA-2's fix
from the opposite direction. Two of six readers met the atom-first opening and concluded the app was
tabletop software. Measured on a fresh boot at 1280x800, the first screen held **13 points: four
dice/coin, then nine budget, and nothing else** - so the PKM researcher's summary ("a document about
rolling 2d6 and whether a weekend trip fits a GBP 400 budget") was a literally complete description
of it, not an unfair one.

**IA-2 was left standing, deliberately.** Its measure is seconds/keystrokes from a fresh open to a
live pill, and neither reader complained about that; both said, in effect, "I could not tell what
this was for." So the fix is **framing, not ordering**: one line above the die saying what a point
is, after which `{2d6}` arrives as a demonstration of liveness rather than as the subject matter. The
atom is still one line in, still above the fold (y=253 vs y=194), and still the first clickable thing
on the screen - IA-2's measure is unchanged. Recorded here so the next reader finds an argument
rather than a silent divergence from #1117's suggested direction.

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

### IA-4 · The substrate review of chronicle / lore dates / custom calendars (§8a, §9.2) ✓ DONE + RATIFIED (#861, keep-as-is)
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
**Owner decision (2026-07-17, ratified):** keep-as-is + the recorded refactor trigger; the
unification waits for the next substantive change to either log.

### IA-5 · The exit story, stated where users look (§3b, freedom to leave) ✓ DONE (#862)
The exports exist and are good; what's missing is the FRAMING — the guide never says
"here is how you leave, whole." Freedom-to-leave is a promise worth stating where a
wavering user will look for it.
**Action:** a short "Taking your work elsewhere" passage in `guide/files-and-export.md`
(what each export preserves, what a pill becomes in flat text, OPML as the full-fidelity
form); one sentence in the guide README. Verify the Markdown export's pill-freezing is
legible for every artifact type while writing it.
**Size:** S.
**Shipped 2026-07-17 (closes #862):** a "Taking your work elsewhere" section states the three exits
in the freedom-to-leave frame — OPML the full-fidelity reopenable archive, Markdown/plain-text the
one-way readable snapshots (each pill frozen to its shown value), self-contained HTML the live copy
for someone without the app — plus the guide-README pointer. The Markdown freezing was
browser-verified legible across types: `{2d6}` → `2d6 = 11`, `{sword | shield}` → `shield`,
`{= sum(cost)}` → the total, `{5 to 10}` → `5 to 10 ≈ 7.22 (4.87 – 9.86)` + sparkline.

### IA-6 · Menu sweep under the mission test (§9.1) ✓ DONE (#862, verified clean)
The `/` and `@` menus accumulated during the PKM build-out. Most entries compose with the
engine; any that are pure parity should be candidates for verbosity-gating (the `ux.md`
dial), not removal.
**Action:** one pass over `BLOCK_CMDS` + insert commands tagging each: composes /
substrate / parity. Output is a short table appended here; gating decisions are
follow-ups.
**Size:** S.

**Result (2026-07-17): the menu is clean — NO pure-parity command exists; nothing to gate.** Every
entry is one of three kinds: **engine** (the `{…}`/`evalMath` core — the 10%), **outliner/text
substrate** (the freeform-text foundation the engine rides on), or a **date/structure/organization
instrument** that either composes with the engine or is itself a substrate generalization.

| Tag | Commands | Why it belongs |
| --- | --- | --- |
| **Engine (composes — the 10% core)** | dice, markov, rolltable, rollpick, grammar, deck, oracle, math, var, est, count, query, meter, progress, clock, check | The generative/computational pills; this IS the product. |
| **Text / outliner substrate** | ul, ol, todo, para, code, divider, quote, secret, bold, italic, uline, inlcode, strike, mark, note, footnote, link, image, alias, refile | The plain-text primitives and restructuring the engine rides on; the freeform foundation (freedom-of-form). |
| **Structure that carries the engine** | base, querybase, table, prop | Structure whose cells/values carry pills, formulas and rollups (bases are generative-first by §0b; props are what `sum`/`check` compute over). Not database parity — structure that composes. |
| **Substrate generalizations** | sequence (generalizes "a to-do state"), due/dates (dates are epoch-day numbers the engine computes), journal/chronicle (instances of the "dated log" substrate, IA-4), custom-calendars (generalizes "a date") | Each generalizes a built-in rather than encoding a domain schema. |
| **Doors / reuse (neutral utility)** | template, savetemplate (freeform subtree reuse), variables (opens the panel), capture-inbox, export, files | Productivity primitives with no schema; text in, text out. |

The closest-to-parity candidates (`base`/`querybase`/`table`, `prop`) were exactly the surfaces the
bases program was disciplined to keep **composing** with the engine rather than drifting to
database parity — so they pass the mission test by construction. No verbosity-gating is warranted;
the finding, like IA-3 and IA-4, is that the menu is already loyal.

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
4. ~~**IA-5 + IA-6** (the exit story; the menu table)~~ ✓ #862 — exit story shipped; menu verified clean (no pure-parity command)

**Program complete (2026-07-17):** IA-1…6 closed. Tier-1 gaps fixed (IA-1 base→text exit; IA-2
atom-forward first run), the copy/menu/substrate reviews all came back loyal (IA-3, IA-4, IA-6
verified clean; IA-4 ratified keep-as-is), the exit story is stated (IA-5). The standing guards
(IA-7 no telemetry, IA-8 mixed gallery, IA-9 substrate-test-before-shipping) remain live on every
relevant PR.

Each lands as its own PR against this file; an item closes by linking the PR or the
recorded decision beside its heading.

---

## Steering review — whole-app pass (2026-07-17)

A three-lens read-only review fleet (solo-RPG contamination · outliner-as-end-vs-means ·
substrate opportunities) against the settled identity (`product-identity.md` §2/§3b/§3c/§9).
**Headline: the app is strongly loyal.** Behavior is clean — every structure is reversible
(re-confirmed the IA-1 audit: no one-way door, no forced schema), the blank doc leads
freeform+atom. The findings are almost entirely **copy/framing** (steer, don't rebuild) and
**forward-looking substrate opportunities** (grow the tool-for-thought identity). Items tagged
`SR-` (steering review). Filed as issues per the review-fleet convention.

### Group A — copy steering (de-theme RPG, de-bolt-on the engine) · issue #874 · **SHIPPED (closed 2026-07-24)**
Small copy/ordering fixes, one PR. Behavior unchanged.

> **Register catch-up (2026-07-24):** verification against the shipped app found SR-1 through SR-4
> already delivered by the IA-2 tour rewrite (#859) and later copy passes — the register (and issue
> #874) had simply never been closed. The one surviving residue (SR-5's dice body) shipped with this
> catch-up. Per-item notes below record where each landed.

- **SR-1 (RC-1, clearest §2 violation). ✓ SHIPPED (by #859).** The first-run tour
  (`FIRST_RUN_EXAMPLES`, index.html) said *"Playing a solo RPG? That is the game Pointliner is
  built around."* — provenance stated AS positioning. The rewritten tour now says "…from the game
  table Pointliner was born at, oracles and character sheets that play along" while pointing at the
  starters: the prescribed provenance-not-center framing, verbatim.
- **SR-2 (OM-1, the §10.1 perception risk). ✓ SHIPPED.** `guide/features.md` framed the engine as
  "an **outliner** … with two extra powers built in." Its opener now reads "Pointliner is a
  document that **generates** … and **computes** … the generating and computing are the point. The
  surface is an **outline** …" — the engine is the noun, the outline the surface it rides.
- **SR-3 (OM-2). ✓ MOOT (structure removed by #859).** The old tour spine filed the engine under
  `## Advanced` atop `## Basics`. That spine no longer exists: the rewritten tour leads WITH the
  atom (a `{2d6}` click is the first moment), so there is no basics/advanced graduation to fix.
- **SR-4 (RC-3). ✓ SHIPPED.** The `STARTERS` gallery led with two RPG starters. It is now
  interleaved: Project tracker (general) leads, then Campaign oracle, Reading log, Oracle-driven
  scene play.
- **SR-5 (RC-4). ✓ SHIPPED (residue closed 2026-07-24).** Generative GUIDE bodies now lead with a
  general example (grammar: lunch spot/loot/story prompts; markov: invented names; deck:
  flashcards/chores; roll-query and oracle: general leads, tabletop last). The one holdout — the
  dice body opening "Roll dice for tabletop RPGs, …" — was reordered general-first ("random
  generation, decision-making, tabletop RPGs or any time you need a number from a range"). The
  command NAMES (oracle, roll table) stay, as prescribed: the clearest general names for those
  mechanics, provenance-fine.

### Group B — substrate opportunities (grow the identity) · one issue each
Each points an already-proven pattern at a new surface, inside the one-language / no-new-syntax /
deterministic / plain-text tenets. Build on demand, not on spec — these are proposals, owner to pick.

- **SR-6 · Units as a declarable table (issue #875). SHIPPED.** `FN1` hardcoded ~14 pairwise
  conversions (`c2f`, `km2mi`, …); the calendars/sequences move applied to "what is a quantity":
  a built-in ratio table (length/mass/volume/time) plus any doc-declared `root.units`, feeding the
  `convert(x, from, to)` form. Declarative data only, deterministic, composes with all math (result
  is a number). Not an evalMath primitive — substituted to a number in the `expandAggExpr` pre-pass
  (`replaceConvert`), so the number-only invariant holds. Cores: `parseUnitDecls`/`unitTable`/
  `convertUnits`/`replaceConvert`/`unitsToText`; front door File → Custom units (`openUnitsDialog`);
  `<_units>` OPML head element; GUIDE `custom-units`. **OUT (recorded, held):** unit-suffixed literals
  (`3mi`) — that is new syntax (P5). The `convert()` FN form is in-bounds. Was: *highest
  capability-per-risk.*
- **SR-7 · Let estimates read variables (issue #876). SHIPPED (read-vars version).**
  `parseUncertain`/`sampleUncAst` were a second evaluator with NO `vars` param, so
  `{cost_low to cost_high}` was impossible. Threaded the doc `vars` map (`collectVars()` /
  render-set `globalVarMap`) through `parseUncertain(expr, vars)` → `sampleUncAst(…, vars)` →
  `sampleUncertain(…, vars)`, plus `estParts`/`makeEstRoll`: a bare word resolves to a declared
  variable (a `{k:'var'}` node broadcasting the scalar; a text var → `NaN` → `#ERR`, the
  type-safety contract). `parseUncertain(b, vars)` is the promotion gate so an unknown word stays
  literal; the map matches `promoteBraceBody`'s global-map sniffs so classify/promote/render agree.
  No new syntax; record stays `{key, expr, seed}`. **The L option — full evaluator unification so a
  distribution flows through `evalMath` — remains OUT (touches the "always a NUMBER" invariant; do
  NOT force).**
- **SR-8 · Query reducers + shared scoped-fold (issue #877). SHIPPED.** Only `count("query")` was
  special-cased in `expandAggExpr`; added `{= sum/avg/min/max("query", prop)}` — reduce a property
  over a live query set — via `queryReduce` (`collectScoped(scope, Infinity)` + `queryMatchesNode` +
  `childPropNumber` + a new shared `reduceAgg` identity helper that `aggregateChildren` was refactored
  onto; `queryCountIn` is now a thin `queryReduce('count', …)` delegate). The **shared scoped-fold
  enabler was already in place** (`resolveScopeDepth`/`collectScoped`, used by `expandAggExpr`/
  `subtreeWords`/`firstEmptyRollup`/`parseUncertain`), so this reused it. A **quoted** first arg is the
  disambiguator vs the bare child-prop rollup (no ordering dependency); an empty match reduces to the
  identity **silently**, like `count("query")` (a query matching nothing now is a valid dynamic answer,
  so it deliberately does not feed the `firstEmptyRollup` typo-guard). Works in checks for free
  (`evalCheck` → `expandAggExpr`): `sum("#task", cost) <= budget`. No new syntax (the quoted-query
  convention already existed for `count`).

### Notes (recorded, no new issue)
- **SR-9 (RC-2) — chronicle framing. SHIPPED (copy-only de-theme; owner-scoped).** The chronicle's
  *identity* read RPG-framed ("in-world log," "game log," "beat," "campaign," "GM") rather than "a
  dated log in any calendar." De-themed the **user-facing copy** across the core app (button title,
  strip placeholder + cursor labels, the four flash messages, the bullet-menu Set/Unset door, the
  calendar-clock aria + dialog hint, the Secret block's "GM notes") and the **general guide pages**
  (the `chronicle`/`custom-calendars`/`timeline` GUIDE entries; `guide/dates-and-planning.md` +
  `guide/features.md`) — dropping in-world/game-log/GM/beat/campaign/time-travel, keeping the neutral
  word **chronicle** (a dated record of events). The **solo-RPG worked examples (`guide/solo-rpg/`)
  stay themed** — provenance, served explicitly. **Internal identifiers kept unchanged** per the
  canonical-vocabulary rule (`root.gamelog`, `collectChronicleDates`, the `<_gamelog>` OPML element,
  the `'chronicle'` source key, `#btn-chronicle`) — **no data migration**, so every saved document
  opens byte-identical. The **dated-log collector unification** (IA-4's `collectJournalDates` +
  `collectChronicleDates` extraction) and the cursor generalization remain **deferred** — a copy
  change doesn't touch those collectors, so IA-4's build-on-demand trigger has not fired.
- **Beginner-arc plain-language passes — feature names kept as taught vocabulary (recorded rule).**
  The onboarding/discoverability arc's plain-language work (PR K starter copy, PR N chrome labels)
  deliberately fixed only **pure jargon** and left the app's **taught feature vocabulary** intact,
  the same distinction SR-9 drew for "chronicle": **Base** (deliberately not the markdown "Table"),
  **Chronicle, Oracle, Grammar, Deck, Markov** keep their names — they are the concept-guide's taught
  terms and carry meaning a rename would lose. Only **non-identity chrome jargon** was plainened:
  "Command browser" → **All commands** (which also fixed a three-way naming split) and "Data packs" →
  **Reusable packs**, both label-only (ids `builder`/`datapacks` and the data model unchanged, so the
  drift guards are undisturbed). The full arc ledger lives in `roadmap.md` § "Beginner-experience arc
  — complete (2026-07-24)".
