> On-demand reference — read this only when adding a new artifact type or icon. Not loaded by default.

## Feature status

Implemented:

- **Dice** — `@dice`: `NdM`, `+/-` modifiers, `@var` modifiers, **exploding**
  (`2d6!`), **reroll-once** (`4d6r1` — reroll any die ≤K a single time, then keep the
  new value; the canonical `4d6r1kh3`; v1 excludes Fate / exploding / success pools,
  but composes with keep/drop; the struck original shows `1↻6` in the breakdown),
  **keep/drop high/low** (`4d6kh3`/`kl`/`dl`/`dh`), **Fate** (`4dF`),
  and **success-counting pools** — a comparison suffix (`>=`,`<=`,`>`,`<`,`=`)
  turns the term into "count the dice that match" instead of summing pips
  (`6d10>=7`, `4d6<=2`). Each rolled face is its own die, so **exploding composes**
  with pools (`6d6!>=5` — an exploded `6→5` yields TWO successes). Success pools
  stand alone (no modifier mixing, no keep/drop, no Fate — `parseDice` returns
  `null`). Rolls stored per-die as chains in `parts[].rolls`; success parts carry
  `parts[].success` (`{op,target}`), nested `parts[].hits` (parallel to `rolls`),
  and `parts[].successes`. Old flat-number saves still render via a compat branch
  in `diceBreakdownHTML`.
- **Markov chains** — `@markov`: weighted transition rules, walk N steps from a
  start state; click to re-walk. An optional **name** registers the chain so
  `{name}` runs a fresh walk from any grammar or shorthand (joined with ` → `).
- **Roll tables** — `@rolltable`: **a one-rule grammar** (the June 2026 collapse:
  the separate artifact/sidecar/dialog retired; the `@` door opens the
  **table-flavored grammar dialog**). `loot: sword | shield 2 | {2d6} gold` —
  entries compose through the grammar engine, the name is callable anywhere as
  `{name}`, click re-rolls. Legacy `[[rolltable:]]` records migrate on load
  (`migrateRolltables`; frozen result preserved — a migration never re-rolls).
- **Grammar** — `@grammar`: recursive-substitution generator (`runGrammar`).
  Named rules `name: a | b 2 | c`, one per line; one brace syntax `{...}` for rule
  refs `{color}`, named tables `{loot}`, named markov chains `{weather}`, variables
  `{strength}`, dice `{2d6}`, expressions `{= 2*r}`, inline alternation `{a|b}`, and
  **conditional text** `{cond: then | else}` (Ink-style — emit `then` when an
  `evalMath` comparison holds, else `else`; `else` optional, `{hp>0: alive|dead}`),
  all nestable. Conditional detection is syntactic (`condParts` — a comparison before
  a top-level `:`, no top-level `|` in the condition), so a plain `{a|b}`, a rule
  line, or a prose `{note: hi}` never read as a conditional; an unresolvable condition
  shows a visible `{cond?}` marker. To alternate *inside* a branch, brace it
  (`{c>0: {a|b} | x}`). A standalone `{cond: …}` promotes to an anonymous grammar pill
  (`promoteBraceBody` wraps it `origin: {…}` so it routes through `resolveBrace`) and
  unfolds back to its `{cond: …}` source for editing. Names are **document-wide** (`collectRules()` — grammar rules,
  which include collapsed roll tables, + named chains), so any pill can call
  anything declared anywhere. Cycles/depth caught at expansion (`↻`/`…`). Freezes
  its expansion like dice; click to re-generate. **Named pills show their callable
  name** and stay atomic in edit mode (the name is doc-wide config — unfolding
  would lose it); anonymous shorthand pills unfold to editable `{…}`.
- **Text modifiers** (A1) — a `.mod` suffix on a **rule or variable reference**
  shapes its output without authoring a rule per case: `{beast.a}` → "an ogre",
  `{noun.s}` → "foxes", `{name.cap}` → "Name". **Closed set of canonical tokens,
  one per function, NO aliases:** `cap` (Dog) · `title` (Old Dog) · `upper` (DOG) ·
  `lower` (dog) · `a` (vowel-aware article) · `s` (pluralize) · `ed` (regular past tense:
  `{verb.ed}` → walked/loved/tried) · `ord` (English ordinal: `{n.ord}` → 1st/2nd/11th;
  non-integer input unchanged). **Chainable**
  left-to-right: `{beast.a.cap}` → "A dragon". Detection (`modParts`) is syntactic — a
  base identifier then `.`-separated suffixes, *every* suffix a member of the set — so
  `{file.txt}` stays literal and `{cap}` (no dot) is just a name. The base resolves
  through the existing rule/var machinery (`resolveBrace` → `expandRule` / `formatVarValue`),
  then `applyMods` folds the modifiers; an undefined base shows a `{base?}` marker. A
  modified reference **routes through the grammar pill** (promoted `origin: {ref.mod}`)
  for both rule and var bases — never the var-pill path — so unfold/refold (back to
  `{ref.mod}`), prune, and export reuse the grammar machinery unchanged. Front doors:
  the `{.cap}` chip + modifier hint in the grammar dialog, and the `?`-panel
  Pills-&-shorthand row. **Bare references only** — not alternation/dice/math directly
  (`{a|b}.cap` is out of scope; name a rule first). Pure cores: `modParts`, `applyMods`,
  `pluralize`, `pastTense`, `ordinal`, `MODIFIERS`. Adding a modifier name is **additive
  within the existing closed `.mod` form** — no new P5 inventory decision (`ed`/`ord` were
  added this way).
  - **Known limitations (documented heuristics, by design):** the `a/an` article is a
    vowel-**letter** test, so "a hour" / "an university" come out wrong (no phonetic
    dictionary); plurals are **regular-only** (`child→childs`, `mouse→mouses` — irregulars
    out of scope); `title` capitalizes after whitespace only (`o'brien→O'brien`); and a
    `{numericVar.cap}` becomes a **grammar pill, so it freezes** (re-roll on click) rather
    than live-updating like a plain `{var}` pill — fine in practice, since the real use is
    `.s`/`.cap` on a **string** (random-pick) variable. Aliases
    (`.an`/`.capitalize`/`.plural`) are deferred follow-ons.
- **Hierarchical / property items (A6)** — a grammar item carries named **fields** via
  **dotted sub-rules**, read with `{item.field}`:
  ```
  weapon: sword | axe | bow
  sword.name: a sharp longsword
  sword.damage: 1d8
  sword.value: 50
  ```
  `{weapon}` picks an item **key** (`sword`); `{weapon.damage}` picks one then reads
  *that* item's `damage` sub-rule. NPCs whose name+trait+stat belong together, loot with
  a value, planets with a climate. `parseRules` accepts a **dotted rule name**
  (`/^[a-z_]\w*(\.[a-z_]\w*)*$/`); `fieldParts` detects a 2-segment `{base.field}` whose
  suffix is **not** a modifier (checked **after** `modParts`, so A1 modifiers win the `.`
  overlap — don't name a field after a modifier). `resolveBrace` resolves it three ways:
  a directly-named sub-rule (`{sword.damage}`) → that rule; else resolve `base` to a key
  and read `key.field` (`{weapon.damage}` → `sword.damage`); else a `{base.field?}` marker
  (P4). **Cross-reference consistency** — making `{item.name}` and `{item.damage}` the
  **same** item — rides the **random-pick variable** (declare `w = {weapon}`, then
  `{w.name}`/`{w.damage}` read the one frozen item; re-rolling `w` moves all fields
  together), **NOT** a per-expansion bind (the reverted `{a := …}`/`ctx.binds` model — see
  `generation-direction.md` §2 — must not return). Standalone `{rule.field}` works
  one-shot. Promotes to an anonymous grammar pill (`origin: {item.field}`), unfolds
  verbatim, round-trips in the grammar `def`. **v1 = a single field**; field-then-modifier
  chaining (`{w.damage.cap}`) and multi-level nesting (`{planet.country.town}`) are
  deferred. Front doors: the grammar-dialog hint + the `{weapon.damage}` `?`-panel row.
  Pure cores: `fieldParts`, the extended `parseRules`, the `resolveBrace` field branch.
- **Stateful sequences / decks** — `@` "Deck" (or type the shorthand):
  `{mode: a | b | c}` where `mode` is one of **shuffle** (a DECK — draw without
  replacement, reshuffle when the bag empties), **cycle** (loop in order), **once**
  (each item once, then nothing), **stopping** (advance, then stick on the last).
  Unlike every other generator these have **memory**: a grammar record carries
  `mode`/`items` + draw state (`pos` for cycle/once/stopping, a remaining `bag` for
  shuffle), which round-trips through the `_grammar` OPML attribute. The pill
  **advances** on body-click (not re-roll), shows a deck icon, has no pencil, and
  **unfolds** to its `{mode: …}` source for inline editing (the dice/anonymous-grammar
  model — draw state preserved when the source is left untouched, reset to a fresh
  deck if the items are edited). Each item is a grammar template (may roll dice / call
  a rule: `{shuffle: {2d6} gold | a {color} gem}`). Inside a *rule* a `{mode:…}`
  degrades to a uniform pick (no per-instance record there). Pure cores: `seqParts`
  (detect), `nextSeqIndex` (state machine), `advanceSeq` (emit), `makeSeqGen` (build).
  This resolved the long-standing "decks/bags have nowhere clean to live yet" question.
- **Repeat** — `{Nx: template}` emits a grammar template N times (1–99), re-expanded
  each time (so dice re-roll, rules re-pick independently), joined by a single space:
  `{3x: {beast}}` → "ogre wyrm ogre". Detection (`repeatParts`) is syntactic — a digit
  run + `x/X` before the first top-level `:` — disjoint from `condParts` (needs a
  comparison), `seqParts` (needs a reserved mode keyword), and `modParts` (needs a
  bare identifier + dot). N is a literal integer 1–99 only in v1 (a variable count can
  be modelled with a named rule). Promotes to an anonymous grammar pill via
  `makeGrammarRoll('origin: {Nx: …}', 'origin')` so unfold/refold/prune/export reuse
  the grammar machinery unchanged. Front doors: the `{Nx}` chip in the grammar dialog
  + the `{3x: {beast}}` row in the **Pills & shorthand** `?` panel.
- **Dynamic odds** (A5) — the weight in a weighted alternation may be a trailing
  `{= expr}` instead of a literal number: `{sword | shield {= str}}` weights "shield"
  by the variable `str`, resolved against the document vars **at pick time** (so the
  odds shift as state changes — Perchance-style dynamic weights). `parseAlt` detects a
  trailing `{= …}` weight (only when a non-empty template precedes it, so a bare
  `{= 2d6}` alt stays content); `pickWeightedAlt(alts, vars)` resolves it via `evalMath`
  — an unresolved expr falls back to neutral weight 1 (the alt is not dropped), a numeric
  `≤ 0` → 0 so `{= cond ? 1 : 0}` can conditionally disable an alt. No new syntax: it
  reuses the existing `{= …}` math form in the existing trailing-weight slot.
- **Yes/no oracle** — the `@` **"Oracle (yes/no)"** door: the most-reused solo-gen
  primitive (ask a question, get Yes/No at tunable odds), shipped as a friendly likelihood
  picker over weighted alternation — **not** new syntax. Pick a band (Certain / Likely /
  Even / Unlikely / Impossible — **original, neutral** weight ratios; the IP fence forbids
  copying a published oracle's tables) or edit the odds yourself; it builds an anonymous
  `Yes N | No M` weighted-alt pill that re-rolls Yes/No on click and unfolds to
  `{Yes N | No M}`. Because the odds field IS the weighted-alt body, the odds can be A5
  `{= expr}` weights for **state-modulated** odds (e.g. `Yes {= 3 + chaos} | No`).
  `openOracleDialog`/`ORACLE_BANDS`.
- **Estimate / uncertainty fields (B2)** — `@estimate` (or the `{lo to hi}` shorthand):
  an **uncertain value** sampled Monte-Carlo and displayed as **mean ± [p5,p95] + a
  unicode sparkline** (`7.2 (5 – 10) ▁▂▄▆█…`); click the pill to re-sample. This is the
  one **first-in-class** feature — no offline outliner rolls uncertain estimates up a
  tree. **A distribution can't ride `evalMath`** (which always returns a number), so the
  estimate artifact has its OWN sampler, separate from the math engine. The
  uncertain-expression mini-language: `lo to hi` (a 90% CI → lognormal with p5=lo,
  p95=hi; falls back to normal when a bound ≤ 0), `normal(m, s)`, `uniform(lo, hi)`,
  scalars, and `+ − × ÷` (sample arrays **zip** element-wise; scalars broadcast).
  **Phase 2 — the tree rollup**: `sum(prop)` / `avg(prop)` propagate uncertainty over
  **children's uncertain properties** (each child's `prop` is itself an uncertain
  expression like `5 to 10`; Monte-Carlo sample-array sum/avg) — the outline-native
  propagation, live as children change (the render node is `cookieNode`, same as B1).
  **Storage is `{key, expr, seed}`, not the samples** — a distribution is reproducible
  from its expression + seed, so the record is tiny, round-trips through OPML (`_est`),
  and a shared C1 self-contained doc reproduces the **exact** estimate; re-roll = a new
  random seed. Pure cores (all seeded, Node-tested): `rngFromSeed` (mulberry32),
  `parseUncertain` (tokenizer + recursive descent; `to` < `+−` < `×÷` < unary < atom),
  `sampleUncertain(expr, n, seed, node?)`, `distSummary`, `sparkline` (a histogram that
  is literally a string — export-safe), `formatDist`, `estParts` (the constructor
  sniff for typed shorthand — `to`/`normal`/`uniform` only, so a bare `{sum(cost)}`
  never silently diverges from `{= sum(cost)}` deterministic math; rollups are authored
  via the dialog). The pill freezes + re-samples on click like dice, the pencil edits,
  and it unfolds to its `{expr}` source for inline editing. The dialog has a live
  sparkline preview; `#ERR` chip on a malformed expression (never blank). **Out of
  scope (recorded follow-ons)**: min/max/count in the uncertain context, mixtures
  (`mx`), correlation/shared variables, more families (beta/…), the analytic `est+`
  no-sampling variant, and cross-engine use (an estimate's mean as a number in `{= …}`).
- **Math** — `@math`: recursive-descent evaluator; recomputes live as variables
  change. **Conditionals** already exist (`a>b ? x : y` and `if(a>b, x, y)`).
  **Unit conversions** are unary fns in `FN1` named `from2to` (`c2f`/`f2c`,
  `km2mi`/`mi2km`, `m2ft`, `cm2in`, `kg2lb`, `kmh2mph`, `l2gal`, …). **Date math**:
  `today` (a constant = epoch-days of the local date), `date(y,m,d)` (a 3-arg fn,
  `FN3`), and `year`/`month`/`day`/`weekday`/`quarter` (`FN1`, `quarter` → 1–4).
  **Date utility helpers**: `daysuntil(d)` (days from today to date `d`, negative if
  past — pairs with the `due`/`start` properties: `{= daysuntil(due)}` is the live
  countdown), `daysbetween(a, b)` (absolute whole-day gap, `FN2`). **General**:
  `clamp(x, lo, hi)` bounds `x` to `[lo, hi]` (`FN3`); `pctof(part, whole)` and
  `pctchange(from, to)` are percentage helpers (`FN2`, ÷0 → `∞`). Dates are **epoch-day
  numbers**, so differences are days and everything composes; `asdate(...)` is a
  numeric identity that the math pill *displays* as an ISO date — display-layer only,
  via `formatEpochDays` / `isDateExpr` / `formatMathDisplay`, so `evalMath` still
  always returns a number. **Subtree aggregation**: `{= sum(cost)}`, `{= avg(score)}`,
  `{= count(cost)}`, `{= min(cost)}`, `{= max(cost)}` roll up a **property** over the point's
  **direct children** (the argument is a property *key*, not a value). Substituted to a number
  before evalMath (`expandAggExpr` → `aggregateChildren` → `childPropNumber`, the `#+TBLFM:`
  translation model — no parser change, evalMath stays number-only). Render-time + no sidecar: the
  `{= …}` recipe stays in `node.text` and recomputes live as children change (the current
  render node is the existing `cookieNode` global; a property edit does a full `render()`).
  Only direct children whose value is a plain number count (dates/expressions skipped, never
  mis-summed); grandchildren are excluded. Empty set → `0` for sum/avg/count, but the **identity
  element** for the extremals — `min(∅)` = `+∞`, `max(∅)` = `-∞` — so an extremal/range constraint
  is *vacuously true* when no child carries the property (e.g. `min(stock) >= 1` with no stocked
  child → `+∞ >= 1` → true), not spuriously false on a 0 sentinel. **`min`/`max` are purely additive**
  (the spreadsheet `MIN(col)` overload): evalMath's numeric `min`/`max` already require ≥2 args, so
  a single-arg `min(ident)` was already an error there, and the aggregation regex matches only one
  bare identifier — a comma'd `min(a, b)` keeps the numeric-variadic meaning, untouched. **Date
  properties also aggregate** (`childPropNumber` tries `Number` first, then `parseDueDate`): a
  date-shaped value rolls up as **epoch-days**, so `max(due)` / `min(start)` give the latest/earliest
  child date (wrap in `asdate(...)` to display it as a date) and F2 gets real **date-range checks**
  (`max(due) <= deadline`). Only strict date-shaped strings parse; a plain word still → `null`.
  Works in the math pill (`{= …}`) and F2 `check` constraints, not in a grammar
  `{cond:…}`/composition (no node context there).
- **Outline constraints / lint** (F2) — a point may carry a reserved **`check` property**
  holding an `evalMath` boolean assertion that spans the point and its **direct children**:
  `sum(cost) <= budget`, `sum(weight) == 100`, `count(score) >= 3`, own-prop `hours <= 8`. **Zero
  new authoring syntax** — `check` is a reserved property key (the `start`/`due` dates precedent),
  the value is the existing `evalMath` language, and the rollups are the existing **B1** child
  aggregations (`sum`/`avg`/`count(prop)`). `evalCheck(node, vars)` → `'pass'`/`'fail'`/`'error'`/
  `null`: child aggregations are substituted first (`expandAggExpr`), then evalMath runs against
  `{ ...vars, ...own-numeric-props }` — the point's own numeric props (`nodePropVars`, finite
  `Number` only; the `check`/date keys excluded) **win** over doc variables (`globalVarMap`), and
  evalMath's own constants (`today`) win over both. `1` → pass, `0` → fail, `null` (malformed /
  missing-or-non-numeric ref) → **error**. The point shows a live **pass/fail/error chip**
  (`buildCheckChip`): pass is a muted `✓` (P4 — never silent), fail is `--bad`, error is a distinct
  `--warn` "can't evaluate" (P4 — fail **and** error both visible); a verdict that **flips** between
  renders announces via the `#a11y-live` region. The chip is keyboard-operable / focus-visible /
  click-to-edit through the same `.prop-chip` + `openPropChip` path as the date chips, routed to the
  **Check dialog** (`openCheckDialog`) — a single `evalMath` field with `sum( )`/`count( )`/`<=`/`==`
  chips, a scope-teaching hint, and a **live preview** that runs `evalCheck` against the current
  point and *explains why* an expression can't evaluate (`mathErrorReason`). **`is:failing`** is a
  new value in the existing `is:` search family — the doc-wide lint filter, matching a node whose
  check **fails or errors** (`termMatchesNode`/`queryMatchesNode` gained a `vars` param defaulting to
  `globalVarMap`). Front doors: the `/check` slash verb ("Check"), the bullet-menu "Add / edit check"
  door, the chip, and the `?` panel + focus-shown search-legend rows. `check` is reserved like
  `DATE_KEYS` — hidden from the generic Properties editor and merged back untouched on save; it
  round-trips through `_props` for free (no new OPML work). Pure cores `evalCheck`/`nodePropVars`/
  `checkExprOf`. **Numeric** extremal/range checks (`max(cost) <= cap`, `min(score) >= 1`,
  `max(end) - min(start) <= 30`) work via the B1 `min`/`max` aggregation; **date-property** extremals
  (`max(due) <= deadline`, `min(start) >= kickoff`) **now compute too** — `childPropNumber` aggregates
  date-shaped props as epoch-days. **Deferred:** multiple checks per point (one `check`/point — `evalMath` has no `&&`);
  upward / cross-parent references; structural / existence checks ("required children" — that is F5,
  enforced tree grammars); auto-fix solving.
- **Variables** — `@var`: named values usable in math (`2*pi*r`) and dice
  (`2d6+str_mod`); **may reference other variables**; reference cycles detected
  and flagged (`↻`, `.var-cycle`). Two **value types**, chosen in the dialog:
  - **Formula** (the default) — a math expression, evaluated live (`area = pi*r^2`).
  - **Random pick** — a *grammar source* (`dragon|wyrm 2|drake`, `2d6`, a rule/table
    name, or a template like `{color} {beast}`) expanded **once** via the grammar
    engine and **frozen** on the record (`kind:'pick'`, `rolled`). Every `{name}`
    reference document-wide shows the same frozen value; the declaration pill is a
    generative pill (**body-click re-rolls** — all references update together —
    pencil edits; re-roll announced via the `#a11y-live` region). The value is
    **text**: used in math or dice it fails visibly (`?` / disabled dialog submit /
    `#ERR`), never silently. `collectVars` returns the stored value unchanged on
    every pass — the engine runs only at declaration and explicit re-roll
    (`rollPickSource` is the pure core). Direction: `guidance/generation-direction.md`
    (v1; inline `{a := …}` shorthand, modifiers, and per-reference re-roll are
    explicitly deferred).
- **Typed shorthand** — write `{2d6}`, `{= 2*r}`, `{a|b|c}`, `{knownRule}` and it
  promotes to the matching pill when you leave the node (and on paste); while
  editing it stays grammar-styled text. Invalid/unknown bodies stay literal text.
- **Inline token editing** — out of edit mode, artifacts are pills; in edit mode,
  inline-able ones *unfold* to editable `{…}` grammar text (styled `.gr-src`) and
  complex ones stay atomic pills. Raw `[[…]]` tokens are never shown.
- **Pill interaction model** — in display mode a pill is a live widget: a body
  click re-rolls/re-generates in place and **stays rendered** (never enters edit
  mode), the pencil opens the dialog. To edit the surrounding text, click the text,
  not the pill. In edit mode, complex pills (tables/markov) reroll on body click.
- **Table formulas** — Org-mode `#+TBLFM:` spreadsheet conventions. The formula line
  lives as a trailing `#+TBLFM:` line *inside* `node.text` (Org-style), so it round-trips
  through OPML / Markdown / plain-text for free — no sidecar, no new attribute. **Cells hold
  literal/computed values; the TBLFM line is the recipe** (the core invariant). References use
  Org `@ROW$COLUMN` grammar (`@1` = header, `@2` = first data row): `@2$3` field · `$3`
  column(current row) · `@2` row(current col) · relative `@-1`/`$+1` · `@<`/`@>` first/last
  row · `$<`/`$>` first/last column · `@#`/`$#` current row/col *number*; rectangular ranges
  `@2$1..@>$3` feed `vsum`/`vmean`/`vmax`/`vmin`/`vcount`/`vmedian`. Assignments separated by
  `::`; column formulas (`$N=…`) fill data rows only (header skipped). **Field formulas take
  precedence over column/row formulas regardless of source order** (Org rule; applied in a
  second pass): `$4=$2*$3 :: @>$4=vsum(@2$4..@-1$4)` fills the body and overrides just the
  total cell — the footer-total idiom works without a second hline. Blank cells = 0 in scalar
  context, suppressed inside ranges; cycles/invalid → `#ERR` (never hangs). The
  reference layer (`orgResolveComp`/`parseOrgRef`/`parseTblfm`/`computeTable`) is **translated
  onto the existing `evalMath` engine** — so the full math grammar (units, dates, conditionals,
  functions, variables) works inside formulas. Edit affordance = plain editable text: the
  "✏ markdown" button shows the whole node (grid + `#+TBLFM:` line) as raw text, like links.
  Recompute fires on cell focusout and structural edits (`mtRecompute` → in-place
  `mtPatchCells`, or full `refreshTable`). **Not supported** (future work): named columns
  (`$name`), constants lines (`#+CONSTANTS:`), remote references (`remote(...)`), hline-relative
  rows (`@I`/`@II`), Calc-mode flags, and `B3`-style notation (`@row$col` is the one true form).
- **Collapse to level N** — `collapseToLevel(n)` / `expandAll()` set
  every node's `collapsed` flag by depth relative to the current viewport
  (`focusedId` or root). Toolbar segmented control `1·2·3·All`; keyboard
  `Ctrl/Cmd+1..6` is a best-effort accelerator (browsers may claim those chords
  for tab switching, so the toolbar is the reliable path).
- **Per-point notes** — a secondary, muted plain-text block under a point
  (`node.note`, `_note` OPML attr). **Plain text only by design** — a note is
  annotation, not content: no markdown, no pills, so none of the unfold/prune/
  promotion machinery applies. Doors: the bullet menu's "Add note"/"Edit note"
  (hover, long-press on touch, `Shift+F10` keyboard) and click-the-note to edit
  in place (the display IS the editor — no raw/pretty split for plain text).
  Enter = line break (a prose *field*, like a dialog textarea or table cell);
  Esc or blur commits; clearing all text deletes the note. Notes are searched
  (`nodeMatchesSearch`), highlighted, exported as indented continuation lines
  (markdown + plain text), and ride snapshots/clones for free. Layout: a second
  mirrored flex row with invisible gutter clones (collapse-btn / bullet / ol-num)
  keeps the note aligned with the content at every viewport and touch size; the
  live editor survives window re-renders via the `forceIncludeId` base-cell
  pattern. The note row's bullet slot carries a **gutter mark** — a small
  `fa-file-lines` glyph in `--muted`, constrained to the dot's 6px slot so the
  text edge is untouched — centered on the parent's bullet column, saying
  "this line is a note" (decorative, `aria-hidden`; the note's accessible name
  lives on the editor). The **zoom view** renders the zoomed point's note under its title
  (`.zoom-note`, same editor; Esc there just commits — focusing the title would
  flip it into raw edit). **Global toggle:** `#btn-notes` in the header (beside
  show-done; shown by default, persisted in the autosave payload) hides all
  notes; a hidden note is never silent — a whisper-level `.note-ind` glyph
  (`.fn-ref` metrics in `--muted` ink, `fa-file-lines`) trails the point text,
  display-mode only so it can never leak into the edit buffer, and click /
  Enter / Space reveals that one note for editing (it re-hides on blur).
  Typography per the design-language consult: `.88em` (the inline-code step),
  `line-height:1.5` (the sanctioned step), `--muted` ink, regular upright (no
  italic — that's the blockquote register), no border-left, and the placeholder
  uses plain `--muted` (the `opacity:.7` contrast-floor violation was fixed).
- **Search query operators** — the search box speaks a small filter language
  (the UXP-20-routed decision, 2026-06-13): bare terms AND together (the
  pre-existing behavior, now per-term), `"a b"` matches an exact phrase, `-term`
  negates any term form, `#tag` matches a tag **word-anchored** (mirrors
  `collectTags`' rule — `[[…]]` tokens blanked so link targets never read as
  tags; `#work` ≠ `#workshops`) — and because `#KEYWORD` states are
  hashtag-shaped, `#waiting` filters by state with no `state:` operator —
  and `is:todo` / `is:done` / `is:note` filter structurally (open to-do /
  finished to-do / has a note; done-ness derives from the text via
  `todoDoneFromText`, sequence-aware). Anything malformed (unknown `is:` value,
  lone `-`, `#non-word`) stays a **literal text term** — the `{…}` invalid-body
  escape-hatch rule, so a query never silently matches everything. `OR` is
  deliberately absent (no precedence rule until real queries demand one). Pure
  cores: `parseSearchQuery` (string → terms), `termMatchesNode` /
  `queryMatchesNode` (terms × node → bool, seqs injectable),
  `searchHighlightNeedles` (what `<mark>` highlights — positive text + tag terms;
  `is:` is structural). Wiring: `applySearch` parses once per query into
  `searchTerms`; `nodeMatchesSearch` delegates; `highlightContent` marks the
  earliest needle per text node. The search path ignores the show-done toggle
  (as it always has), so `is:done` / `-is:done` are the explicit override.
  Doors (P2): a **focus-shown legend** under the search box (`#search-hint`,
  CSS `:focus-within`, non-interactive, `aria-describedby` on the input) and a
  **"Search & filter" section in the `?` panel**. Hashtag click still writes
  `#tag` into the box — same language, now word-anchored instead of substring.
- **Saved searches** — star the current query to save it with the document.
  A saved search is the **raw query string** (no naming dialog — queries are
  short and self-describing), stored doc-level (`root.savedSearches`,
  `<_savedSearches>` element in the OPML head — doc-level config lives in the
  head as the one underscore-prefixed custom *element*; outlines carry custom
  *attributes*) so it travels with the file: saved queries reference the doc's
  own tags/states. Pure cores `toggleSavedSearch`/`isSavedSearch` (trim-exact
  membership, new-array discipline). UI: the `#search-save` star (☆/★ unicode
  via `setIcon` — bookmark model: filled = saved, click again forgets;
  `aria-pressed`; mousedown swallowed so the box keeps its caret) appears
  beside the clear ✕ whenever the box has a query; saved queries render as
  chips in a "Saved" section at the top of the focus-shown panel (the one
  `pointer-events:auto` island) — click/Enter/Space applies, the ✕ or
  Delete/Backspace forgets, Esc returns to the box; chips are Tab-reachable
  (still `:focus-within`, so the panel stays open). Saving marks the doc dirty
  (autosave + OPML); chips refresh on box focus so they're current after a
  file load.
- **Progress cookies** — a `[/]` (fraction) or `[%]` (percent) cookie in a
  point's text renders as a **live tally** of the tasks it contains. Counted:
  every checkbox marker `[ ]`/`[x]` in the point's **own text** plus its
  **direct child points** — each marker counted individually (so several
  checkboxes in one point each count) — and any keyword/sequenced child point
  with no marker counted as a single item, its done-ness from the
  **sequence-aware** `todoDoneFromText` (right of the `|` = done). Scope is own
  text + direct children (recursion deferred). The cookie is **plain text** in
  `node.text` (the recipe, like `#+TBLFM:`): edit mode shows `[/]`, display mode
  shows the computed `[2/5]` — no sidecar, no OPML attribute, round-trips for
  free. It goes **success-hued** (`.cookie-full`) when complete and is
  **live-updating** — toggling a checkbox repaints the cookie's point (own-text
  case) and, when a multi-marker child only partly completes, the parent too
  (the `toggleTaskInNode` parent-repaint branch; full state changes already
  `render()`). A literal `[/]`/`[%]` only becomes a cookie when the rendering
  point owns tasks (`cookieNode` is set); elsewhere it stays text — the
  escape-hatch rule. **Front door:** `@progress` (inserts `[/]`; the menu teaches
  `[%]`). Pure cores: `tallyMarkers` (text → {done,total}), `progressCount`
  (node × seqs → {done,total}), `formatProgressCookie`. Export
  (`flattenArtifacts`) freezes the cookie to its computed tally, like every
  other artifact in a one-way snapshot. P5: a recorded syntax-inventory decision
  — reuses the `[…]` bracket authoring family rather than minting a sigil
  (`guidance/ux-remediation.md` UXP-20).
- **Properties** — per-point structured key:value metadata. `node.props = [{key, val}]`
  is a sidecar array persisted as the `_props` OPML attribute (JSON; serialize +
  parse in the same change, like every sidecar). **Editor:** a dialog from the
  bullet menu ("Add property" / "Edit properties") or by clicking any chip — a
  dynamic key:value list with add/remove rows (Enter in a key field jumps to its
  value; Enter on the last value adds a row). **Display:** chips render in a row
  below the point's note (gutter mark reuses `.note-mark`), and again under the
  title in the zoom view; empty keys are dropped on save. **Search:** two operators
  added to `parseSearchQuery` / `termMatchesNode` — `has:key` (the point carries a
  property with that key) and `key:value` (key equals value), both case-insensitive;
  `is:` stays a reserved prefix so `is:tomorrow` and other unknown `is:` values fall
  through to literal text (the escape-hatch rule). **Export:** properties appear as a
  single `[key: val · …]` continuation line in the markdown and plain-text snapshots.
- **Templates** — save a point's subtree as a named, reusable snapshot and stamp
  fresh copies elsewhere. Templates are **doc-level config** on `root.templates =
  [{name, node}]`, serialized as the `<_templates>` **OPML head element** (the
  second underscore-prefixed custom *element*, beside `<_savedSearches>` — outlines
  carry custom attributes, the head carries custom elements). **Save door:** the
  bullet menu "Save as template" opens a name dialog defaulting to the point's text;
  saving over an existing name **updates** that template (trim-exact, mirroring the
  saved-search toggle). **Stamp door:** the `/template` slash verb opens a picker
  dialog listing saved templates (point counts shown, each with a "forget" ✕); an
  empty library shows guidance pointing at the save door (P2). Stamping
  **deep-clones** the stored subtree (`deepCloneNodeNewIds` — fresh ids top-to-leaf,
  now also deep-copying the `seq`/`props` sidecars so a stamp never shares mutable
  state with the saved template) and inserts it: **replacing** the invoking point
  when it's empty and childless (you typed `/template` on a blank line), otherwise as
  the **next sibling**. Every action toasts what it touched (P4). Pure cores:
  `upsertTemplate` / `removeTemplate` / `findTemplate` (all return new arrays, never
  mutate).
- **Refile** — move a point's whole subtree to another location through a search
  picker, instead of dragging or repeatedly indenting. **Door:** the bullet menu
  "Refile…" opens the **point-tree navigator** — a search box over the outline shown
  as an **indented, expand/collapsible tree** (not a flat list), so you pick a
  destination by reading the actual structure. Browse with **↑/↓** (move) and **→/←**
  (expand-collapse a parent, or dive-to-child / jump-to-parent — active only while the
  box is empty, so they move the text caret otherwise); **type to filter** to matching
  points **plus their ancestors** (auto-expanded, ancestors dimmed as context); **Enter**
  refiles, **Esc** cancels; the chevron twist also expands/collapses by mouse. **"Top
  level"** is the leading option (refile *out* of deep nesting) and the **moved subtree
  is excluded**. Selecting a target moves the subtree to become that point's **last
  child**, reusing the same reparent semantics as drag-drop (`performDrop`) and the
  `isDescOf` **self / own-descendant guard** (you can't refile a point into its own
  subtree — that would orphan the tree). The move toasts what it touched (P4) and
  focus follows the moved point. The navigator is a **reusable component**: pure model
  `treeRows(rootNode, {expanded, excludeId, query})` → ordered visible rows; DOM
  `renderTreeRows` (row builder) + `buildTreePicker` (modal wrapper) are decoupled from
  the modal so a future structural sidebar can reuse the same two halves. Label via
  `pickerTitle`; mover `refileNodeTo(moveId, targetId)`. No new syntax.
- **Capture / quick inbox** — fast-add a point into a designated inbox **from
  anywhere, without navigating there**. **Door:** the toolbar inbox button
  (`#btn-capture`) opens a **Capture dialog** that overlays wherever you are — so a
  capture never moves you off what you're doing. The **inbox** is a doc-level pointer
  (`root.inboxId` → a point's id, persisted as the `<_inbox>` **OPML head element**;
  node ids round-trip via `_id`, so the pointer survives reload; a deleted inbox is
  treated as unset). You pick / change the inbox via an **inline tree navigator** (the
  same `buildTreePicker`) that swaps into the same card and returns with your draft
  preserved. Each **Capture** appends **one markdown-aware point** —
  type derived from the text, so a typed `- [ ]` lands as a to-do, `# x` a heading — as
  the inbox's **last child**, then **clears and keeps the dialog open** (the brain-dump
  flow) with a running **"✓ Captured N"** confirmation and a toast. **Enter** captures,
  **Shift+Enter** is a line break. Until an inbox is set the Capture button is disabled
  and the action routes to the picker (no silent no-op — P4). Helpers `openCaptureDialog`
  / `doCapture` / `resolveInbox`. No new syntax.
- **Node links & mirror** — link any node to any other with `[[#TARGETID|label]]`
  (the target id lives in the text; no sidecar). `collectLinks(rootNode)` walks the
  tree and returns `{ outgoing, backlinks, broken }`, cached on `_varsVer` like
  `collectVars`. **Same-document only** (cross-document is gated behind the future
  multi-doc workspace).
  - **Caption vs. mirror:** `[[#id|My text]]` shows a fixed caption; **`[[#id|]]`
    (empty label) "mirrors"** the target — it renders the target's *live* content,
    pills included, in their current state, **display-only and inline**. Rename or
    re-roll the target and the mirror updates on next render. A missing target renders
    `.node-link-broken`.
  - **Re-entrancy-safe transclusion:** the mirror renders a node *inside* a link, which
    happens during `renderContentHTML`, so `renderNodeInline` must **save and restore**
    the render-context globals (NOT clear them), and a depth guard caps nesting at 1
    (nested links inside a mirror render title-only) — this prevents corrupting the outer
    render and A↔B cycles.
  - **Keyboard-first creation:** "Copy link to this node" (bullet menu + `Cmd/Ctrl+Shift+L`)
    puts `[[#id|]]` on the clipboard; paste it and the caret lands right after the `|`,
    ready for a label. Typing `[[#id]]` by hand works too. The **`[[`-triggered node picker**
    is live (`LINK_PICKER_ENABLED`, a kill switch defaulting **on** — UXP-4 resolved; candidates
    via the pure `linkCandidates`).
  - **Link-and-create (same-document, Phase 3):** typing `[[a title that doesn't exist yet`
    no longer dead-ends. The picker always offers a **"+ New point: ‹title›"** row — the last
    option, shown even when matches exist, absent when the query is empty/whitespace. Choosing it
    **creates a stub point titled with what you typed and links to it in one gesture** (the live-title
    `[[#id|]]` form) — the Zettelkasten "declare by linking" move. The stub lands in the **inbox if
    one is set, else at top level** (`resolveInbox() || root`), is **markdown-aware**
    (`- [ ] buy milk` → a to-do stub, via `deriveTypeFromText`/`todoDoneFromText` like capture), and
    you **stay where you are** — the new stub paints when the edit exits (a `_pendingFullRender` flag
    makes `exitEdit` do a whole-tree `render()` instead of the partial single-node re-render that would
    leave the sibling stub invisible), never a mid-edit `render()` (which would destroy the caret); one
    `pushUndo()` reverts both the node and the link. Pure core
    `linkCreateOption(rawQuery)` (trimmed raw-case title, or null → no row). **Zero new syntax** —
    reuses `[[` + `[[#id|]]`, no inventory addition. Same-document only (cross-file create is Phase 1).
  - **Unlinked references (same-document, Phase 3):** the backlinks panel gains a second section
    — **"Unlinked references · N"** — listing other points that **mention the focused point's title
    in plain prose but haven't linked to it yet**. Each row has a **Link** button that wraps the
    first outside-token occurrence of the title in `[[#id|]]` and refreshes the panel in one click
    (`pushUndo()` + `markDirty()` + `render()` + `showBlPanel()`). The row then moves to "Linked
    from". Match is **whole-word, case-insensitive** (word-boundary `(?<![a-zA-Z0-9])` guards so
    `cat` never matches `category`); tokens stripped before matching so a link's own label never
    counts. Min title length is 3 characters. Panel opens if *either* section is non-empty.
    Pure cores: `collectUnlinkedRefs(targetId, rootNode)` (tree walk, never cached — runs only
    on panel open/refresh) + `linkifyMention(text, title, targetId)` (converts first
    outside-token occurrence or returns `null`). **Zero new syntax** — reuses `[[#id|]]`. Link
    control is `role="button"`, keyboard-operable (Enter/Space) + `mousedown`+`preventDefault`
    (caret invariant), announced via `#a11y-live`. Same-document only (cross-file is Phase 1).
    **Aliases extend the match** (see below): a point is found as an unlinked reference via **any**
    of its names, and the Link action links whichever name actually appears in that point's text.
  - **Aliases (same-document, Phase 3):** a point can carry **alternate names** so linking and
    mention-detection find it under more than its canonical title. *"Wyrm"* aliased *"dragon, drake"*
    surfaces when you type `[[dragon` and when another point says "the dragon sleeps". **Storage = a
    reserved `aliases` property** (the `check`/dates precedent — a comma-separated `node.props` entry
    `{key:'aliases', val:'wyrm, drake'}` round-tripping through the existing `_props` OPML attribute;
    **zero new sidecar, zero new syntax**). Hidden from the generic Properties editor and merged back
    on save like the other reserved keys. Three front doors: the **bullet-menu "Add/Edit aliases"**
    item, the **aliases chip** (click → dialog), and the **`/alias` slash verb**. The `[[` picker
    matches any alias and shows an **"alias: X" hint** when an alias (not the title) caused the match
    (P4). **Aliases extend *matching*, not *display*** — a link still renders the canonical live title
    (use `[[#id|label]]` for a custom caption). Pure cores: `aliasesOf(node)` (comma-split, trimmed)
    + `nodeNames(node)` (canonical title first, then deduped aliases) — the shared name helper
    consumed by `linkCandidates` and `collectUnlinkedRefs`. Same-document only; an `alias:` search
    operator and cross-file alias matching are deferred.
  - **Edit mode:** a link is **plain editable text** `[[#id|label]]`, not an atomic pill —
    you edit the token as text (like a footnote ref `[^key]`). It renders as a link only in
    display mode. Clicking a link → zoom to the target.
- **Click-to-edit anywhere** — clicking any empty / non-interactive part of a node enters
  edit mode (caret at the click point, or **end-of-text as fallback**); interactive elements
  (bullet, links, pills, checkboxes, hashtags, footnote refs, table widgets) keep their own
  behavior, and shift-click still range-selects. Navigating into a node places the caret at
  the end.
- **Status states + priorities** — `#STATUS` keyword + `[#A]` priority at the **start of
  `node.text`** (headline style: `#TODO [#A] body`). The `#` reuses the existing hashtag
  sigil — no new delimiter. Bare `TODO` without `#` is plain text, never a badge. `#word`
  that is not a known state is a normal clickable hashtag. No new node field, no OPML
  attribute — keyword + priority are plain text and round-trip for free. States:
  `#TODO / #NEXT / #WAITING / #DONE` (done = `#DONE`); priorities: `A / B / C`.
  Old saves (bare `TODO body` form) are NOT migrated — they load as plain text
  (a load-time rewrite would also capture prose typed after the change); retype
  as `#KEYWORD` if meant as statuses.
  - **Done-ness derived from keyword:** `node.checked = todoIsDone(keyword)`, so the existing
    strikethrough (`.nt-todo.checked`) and the **hide-done filter (with the show-done toggle)
    keep working unchanged** — completed items hiding is a deliberate, load-bearing feature.
  - **Checkbox ⇄ keyword:** when a keyword is present, ticking the checkbox sets `#DONE` (the
    item then hides until show-done); unticking steps back to `#WAITING`. No keyword → legacy
    boolean behavior.
  - **Changing state — two easy paths (no modifier chords):**
    - **Click-choose:** clicking the colored state badge (or priority chip) opens a compact
      popover picker (`— / TODO / NEXT / WAITING / DONE` and `— / A / B / C`); one click sets
      it directly via `setTodoState` / `setTodoPriority` — *direct jump, not cycle*. For a
      no-keyword todo the same picker is reachable from the bullet popup / long-press
      ("Set state / priority…"), so it works on touch too. The picker reuses the `#bpop`
      element.
    - **Typing:** in edit mode the keyword is plain editable text at the line start, so just
      type `#TODO `/`#NEXT `/`#WAITING `/`#DONE ` (or edit/delete it) — it renders as a badge
      on exit and `checked` re-derives. Slash entries `/todo` `/next` `/waiting` `/done` make
      it discoverable; they also convert a non-todo node to a todo with that keyword.
  - **Display:** state badge (one accent for `#TODO`/`#NEXT`/`#WAITING`, muted for `#DONE`) +
    `[#A]` priority chip, injected at the start of the rendered body; the body renders as
    normal markdown. Edit mode shows keyword + priority as plain text (never atomic pills).
  - **Sort children:** bullet menu → "Sort children by state/priority" sorts children using
    `compareTodo` (not-done before done, then `A < B < C < none`, then active-state order).
  - **Sequences (user-definable state sets) — SHIPPED (MVP):** the built-in
    `TODO NEXT WAITING | DONE` is now the *default sequence*; declare your own with
    `@sequence` (name + states, e.g. `Flow: BACKLOG DOING | SHIPPED`) — a `[[seq:key]]`
    pill + `node.seq` sidecar, document-wide via `collectSequences` (cached on `_varsVer`),
    OPML `_seq`. Apply states via `/` (one menu section per sequence) or by typing `#KEYWORD`;
    the badge renders for any state of any sequence, the badge→picker offers the node's
    sequence's states, and done-ness derives from the keyword's side of the `|` (right = done
    — strikethrough / hide-done / sort all honor it). Keyword collisions: first sequence wins
    (default first). The `#` prefix is the only syntax addition: `@` declares, `/` applies,
    `#KEYWORD` sits in `node.text`.
  - **Not included (future work):** state *cycling* (advance-to-next) for custom sequences,
    per-item sequence switching beyond `/`+typing, priority `[#A]` semantics per sequence,
    inline `{}` reference of a sequence, `CANCELLED` in the default set, logbook /
    `CLOSED:` timestamps, per-file `#+TODO:` declarations, agenda/scheduling.

- **Self-contained HTML export** (C1) — File menu → **Self-contained HTML** writes one
  `.html` file that *is* the app **and** the document. `exportSelfContainedHtml()` clones
  the running page (`document.documentElement`), empties the rendered/dynamic DOM
  (`#outline`, `#var-panel-list`) so the file is lean and boots fresh, and inlines the
  current outline as **OPML** into the `#pl-embedded-doc` `<script type="application/xml">`
  data-island. The injection is a pure string op — `embedOpmlIntoHtml(html, opml)` (and its
  inverse `extractEmbeddedOpml`), Node-testable — operating on the serialized shell, not the
  DOM. Safe because `toOpml` never emits the literal `</script>` (user `<`/`>` become
  entities inside attributes), so raw OPML round-trips inside a `<script>` data-island.
  - **Opening one:** the app re-runs and `restoreEmbeddedDoc()` (before `restoreAutosave`,
    **winning over local autosave** — a shared snapshot must show exactly what was sent)
    hydrates `root` from the island. It opens **in display mode** (not edit-mode-on-point-1,
    so pills render and re-roll) and flashes a one-time **P4** notice that the file is a
    read-into-memory snapshot — edits live in the browser, re-export to save a copy.
  - **The app shell ships the data-island empty**, so the live editor is completely
    unaffected; hydrate is a no-op unless a file was produced by this export.
  - **Why it matters:** the "intersection multiplier" — it makes every generative /
    computational document a single offline file you hand to someone who re-rolls and
    recomputes locally, with nothing installed. (`guidance/enhancement-research.md` C1.)
  - **Not included (first slice):** in-place self-save / FileSystemAccess handle (that is
    C2); preserving the author's theme/accent prefs (those ride the JSON autosave, not the
    OPML); a localStorage-vs-snapshot merge (the snapshot is authoritative on load).

- **Workspace folder** (Phase 1, steps 3–5b — `guidance/roadmap.md`) — a durable on-disk
  backing folder, now a **notebook of documents you switch between**. **File menu →
  Connect folder…** (Chromium only, gated on `'showDirectoryPicker' in window`) picks a
  folder, writes the current document into it once as a `.opml`, and **remembers the
  folder** so the app reopens the doc from disk on every subsequent load. Mental model:
  *"put this notebook in a folder I’ll remember — the folder is the source of truth."*
  - **Reuses the existing Save path** — the folder just supplies the backing
    `fileHandle`; the initial write is `writeH` (the same OPML writer as Save As).
  - **Continuous auto-write** (Phase 1, step 4) — once a document is folder-backed
    (`workspaceFile !== null` — set by Connect or reopen), **every debounced edit writes
    the OPML to its file automatically**, no manual Save. The localStorage autosave stays as
    the sub-second crash buffer (now with a `savedAt` timestamp); the folder file is the
    durable store (so the continuous write still runs even when the autosave is paused for a
    too-large tree). The writer (`flushWorkspaceFile`) is a **coalesced async flush** — at
    most one write in flight; if edits land mid-write, a single re-run with the latest tree
    follows, so the file always converges on the newest state, never torn or stale. A
    real-disk write counts as saved, so the **dirty dot clears ~debounce after you pause**.
    **Lost access** (permission revoked / file or folder gone) degrades via a single
    `degradeWorkspace()` helper called from both the auto-write path and the manual Save
    path: auto-write stops, the affordance flips to **Reconnect**, and a single soft,
    dismissible banner shows (`showWorkspaceWarn`) — never a per-keystroke alert, never
    silent loss; manual Save still works. **Known gap:** deleting only the file while the
    folder survives is not reliably detected — Chrome doesn’t dependably throw on the next
    write to a file removed under a live handle, so the banner may not fire in that specific
    case; data is never lost (localStorage buffer and Ctrl+S / Save As both recover it). No
    polling detector is built. **Manual single-file mode is unchanged** — a doc opened via
    Open or saved via Save As (not in the workspace) keeps manual-Save behavior; continuous
    write is the workspace tier only. *(Done in step 5b: New lands in
    the folder and a Switch-document list. Not yet: rename (FSA has no atomic rename),
    nested subfolders, and external-edit conflict detection.)*
  - **Reopen on load — the folder is the source of truth** (Phase 1, step 5a): on every
    load after the initial connect, `reopenStoredWorkspace` reads the stored `{ dir, name }`
    from IndexedDB, verifies reachability (`reopenWorkspaceDoc` — `requestPermission`
    re-grants even a deleted folder, so the grant alone is not proof), and applies the
    **newer-wins rule**: if `file.lastModified ≥ lastAutosaveSavedAt()` the folder copy
    wins and the doc is reopened; otherwise the localStorage copy (which may hold
    post-degrade edits) is kept and the write target is rebound so the next edit
    reconverges the two. Either way the doc is folder-backed and auto-write resumes.
    The shared snapshot (C1) is authoritative and skips this. A gone file/folder is
    forgotten gracefully (IndexedDB key deleted, offers Connect again). **Reconnect
    (user gesture)** also verifies reachability: if the folder was deleted, it now
    honestly says "no longer available" and returns to the Connect state instead of
    claiming success.
  - **Document switcher** (Phase 1, step 5b): the connected folder is a notebook. **File
    menu → Switch document…** opens a list of the folder's `.opml` docs (`listWorkspaceNames`
    → the pure `workspaceDocList`: `.opml`-only, de-duped, case-insensitively sorted), the
    current one marked; click a row to **switch** (`switchWorkspaceDoc` — a plain dirty-
    guarded read, *not* `reopenWorkspaceDoc`'s newer-wins, which compares the current doc's
    autosave and is wrong for a different file), a trash control to **delete** (confirmed;
    `removeEntry`; deleting the current doc switches to the first remaining one, or creates a
    fresh doc when the folder empties), and **+ New document** to create one. Rows are
    keyboard-operable (↑/↓ move, Enter opens, Delete removes), labeled, focus-visible.
    **File → New** is rerouted: with a folder connected a new outline **lands in the folder**
    under a collision-safe name (`uniqueWorkspaceName` — `outline.opml` → `outline-2.opml` →
    …, case-insensitive) and auto-writes from the first edit. Each switch/create persists the
    new `{ dir, name }`, so reopen-on-load restores the doc you last had open.
  - **Detached state — Finding 8** (Phase 1, step 5b): when a folder is connected but the
    current doc **isn't in it** (e.g. you opened an external `.opml`), `workspaceFile` is
    null and `workspaceAffordance` returns `connected-detached`. The menu is honest about it
    — *"Workspace: ‹folder› · this document isn't in it"* — and offers **Save to workspace**
    (`saveToWorkspaceDoc`: files the current `root` into the folder under a collision-safe
    name and folder-backs it), replacing the misleading "Save writes here".
  - **Persistence:** a `FileSystemDirectoryHandle` is structured-cloneable but not
    JSON-serializable, so it can’t ride the localStorage autosave — it lives in **IndexedDB**
    (`idbOpen`/`idbGet`/`idbSet`/`idbDel`, a single `kv` store, key `workspaceDir`).
    The value is `{ dir, name }` (handle + file name); pre-5a stores (raw `dir`) trigger a
    silent one-time re-connect prompt on next load.
  - **Disconnect** forgets the connection and stops auto-writing. Does not delete the file
    or folder; manual Save still writes the same file.
  - **Affordance state machine:** the pure core `workspaceAffordance({hasWorkspace,
    connected, pending, backed})` → `invite | connected | connected-detached | reconnect |
    connect` (the capability gate wins first; then a live connection — split by `backed` =
    `!!workspaceFile` into the plain and detached states — then a pending handle). The
    fresh-file name comes from `workspaceFileName(doc, currentName)` (keep a real name; else
    derive from `firstLineTitle(doc)`; else `outline`; single `.opml` suffix;
    path-separators/reserved chars sanitized); `uniqueWorkspaceName(existing, base)` makes
    it collision-safe; `workspaceDocList(names)` shapes a raw listing; `lastAutosaveSavedAt()`
    reads `savedAt` from the localStorage autosave payload (0 if absent — covers fresh
    sessions and legacy saves without the field). All pure + Node-tested; the picker,
    IndexedDB, directory iteration, and re-permission flow are browser-side (the
    switch/new/delete logic is mock-handle-verified headless; real folder switching is
    Chromium-manual-verified).
  - **Non-Chromium** (Firefox/Safari — `hasWorkspace` false): the File menu shows a
    non-actionable **"Linked notebooks"** info row (`.cmd-note`) in place of the connect
    action. A **Copy link** button copies the current page URL so the user can paste it into
    Chrome or Edge and open the workspace there. No banner, no nag, no dismissal state — the
    row is always visible on non-Chromium and invisible on Chromium.
