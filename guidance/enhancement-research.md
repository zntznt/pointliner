# Enhancement Research — Generative, Computational & Single-File Upgrades

**What this is.** A consolidated menu of *inspiration → concrete upgrade* for Pointliner's two
most distinctive strengths: the **generative + computational engine** and its **absolute
single-file offline-ness**. It pairs (a) **borrowable mechanics** mined from comparable tools
with (b) **proposed upgrades**, each mapped to the real code seam it would touch and judged
against the closed-syntax discipline (P5).

**Method.** Five parallel research passes (June 2026) across ~25 tools — generative/text
(Tracery, Perchance, Ink, Twine/Harlowe/SugarCube, tabletop oracle systems), computation
(Soulver, Calca, Frink, Numi, Qalculate, Squiggle, Guesstimate, org-mode), and single-file
extensibility (TiddlyWiki, Decker, the File System Access API) — followed by a seam-map of
`index.html` so each idea names the function it plugs into. Source URLs are indexed at the end.

**How to read it.** This is a **candidate catalogue, not a spec or a commitment.** Every row is a
starting point; nothing here is approved until it goes through the project's normal gate (pure
core → tests → DOM → `ux-definition-of-done.md`). Status tags: ☐ not started · ◐ partial ·
✅ shipped · ⚑ flagged (needs a P5 sign-off / scope decision) · ⊘ out of bounds.

**Relationship to the other docs**

| Doc | Owns | This doc adds |
|---|---|---|
| `outliner-frontier-report.md` | What's genuinely *unbuilt across the industry* (F1–F7) | Where the borrowable mechanics come from + how they map to *our* seams |
| `backlog.md` | The prioritized *feature-gap* list (PKM-leaning) | The *engine/single-file* upgrade list (this is its generative companion) |
| `roadmap.md` | The locked phased plan + the "Generative / internal-engine ideas" bullet list | The detailed, sourced expansion of that bullet list |
| `generation-direction.md` | The **locked** Perchance-style generation model (random-pick variables) | The next layer of generative ideas, respecting that lock |
| `ux-discipline.md` §2 | The **closed syntax inventory** | The P5 verdict on each proposed addition |

> **Read `generation-direction.md` and `ux-discipline.md` §2/§P5 before acting on anything
> here.** Several attractive ideas below were already *tried and reverted* or are *deliberately
> deferred*; the guardrails section names them so they are not re-treaded.

---

## 0. The thesis — the prize is the *intersection* of the two strengths

No competitor sits where Pointliner does. Perchance's generators are web-only; org-babel needs
Emacs; Squiggle/Guesstimate are web apps; TiddlyWiki is self-contained but has **no** generative
or uncertainty engine. Pointliner is the only tool that could ship a **self-contained, offline,
interactive generative/computational document you hand to someone as one file** — a name
generator, a dungeon stocker, a Fermi-estimate model, a budget that rolls up with uncertainty —
that the recipient **re-rolls and recomputes locally**, with nothing installed.

Most upgrades below ladder toward that. The two highest-leverage standalone bets are **subtree
aggregation** (B1 — makes computation see the tree) and **uncertainty fields** (B2 — the one
genuinely *first-in-class* feature, per the frontier report's F3); the cheapest multiplier is
**self-contained HTML export** (C1), which turns every other upgrade into something shareable.

---

## 1. Guardrails (do not re-tread)

- **P5 closed syntax inventory.** New generative/computed content plugs into the `{…}` grammar
  engine (a new `resolveBrace` branch) or `evalMath` (a new `FN1/FN2/FN3` entry) — **not** a new
  delimiter. A genuinely new user-facing sigil is an explicit, *recorded* decision (and retires
  what it overlaps), never a feature side-effect. (`ux-discipline.md` §2, P5-1/P5-3.)
- **Reverted — must not return:** per-expansion **bound picks** `{a := …}` / `ctx.binds`
  (PR #51). The random-pick *variable* superseded it. (`generation-direction.md` §2.)
- **Deferred by an existing lock:** the inline `{a := …}` declaration shorthand; reference
  **modifiers** (`a/an`, plural, capitalize) — named as a *separable follow-up*; using a pick
  value in math; per-reference re-roll. (`generation-direction.md` §5.) These appear below as
  *candidates*; moving any of them forward reopens that doc.
- **Oracle IP fence.** A tunable yes/no oracle is welcome **mechanically**, but the odds bands
  and any result tables MUST be original or user-defined — never copied from a published system
  (a prior verbatim-table version was reverted). (`roadmap.md`.)
- **Stateless purity is the current default; decks/bags are the *named* open question.** Stateful
  randomness "has nowhere clean to live yet" (CLAUDE.md). It is an opening, not a wall — see A4.
- **`evalMath` always returns a number.** Date *formatting* is display-only; pick values are
  text and fail visibly in math. A distribution/symbolic value type is a real engine change
  (B2), not a one-line add.
- **Query pill SHIPPED** (2026-07-02): `{query: <search>}` renders a live embedded search
  inline (the pure `queryRows` core over `parseSearchQuery`/`queryMatchesNode`). A rendering
  of the live data, not a stored view. **Still out of scope (recorded):** a saved-views DB
  layer (named/persisted views as a data model); code execution; binary attachments.
  (`backlog.md`, `roadmap.md`.)
- **Synchronous render.** `mdToHtml`/`resolveBrace` are synchronous (render-context globals
  depend on it). Nothing here may make rendering async.

---

## 2. Engine seam-map (where upgrades plug in)

So every proposal below can name its target:

- **Grammar:** `resolveBrace` (content-sniffs one `{…}` body), `expandTemplate`/`expandRule`,
  `parseRules`/`parseAlt`/`pickWeightedAlt`, `splitTopLevel`/`matchBrace`, `collectRules`
  (doc-wide rule namespace, cached on `_varsVer`). Rule records are weighted-alt arrays or typed
  descriptors (`{kind:'markov', …}`). **No modifier system today.**
- **Expression eval:** `evalMath` — arity tables `FN1` (math + `from2to` unit conversions +
  date-component fns), `FN2` (`atan2`/`pow`/`hypot`), `FN3` (`date`), variadic `min`/`max`,
  constants (`pi`/`e`/`tau`/`today`). `ident()` resolves doc variables (numbers only).
- **Variables:** `collectVars`, `[[var:key]]` records (`{key,name,expr,kind?,rolled?}`),
  `rollPickSource` (freezes a pick), cycle detection.
- **Dice:** `parseDice`/`rollParsed` — success pools, exploding, keep/drop, Fate.
- **Tables:** `computeTable`/`evalOrgFormula`, `@row$col` refs + `vsum/vmean/vmax/vmin/vcount/
  vmedian`, translated onto `evalMath`.
- **Shorthand recipe:** `classifyBraceBody`/`braceTypeLabel` (edit-mode styling),
  `promoteBraceBody`/`promoteInlineShorthand` (typed `{…}` → pill on exit), `artifactToShorthand`
  (unfold pill → editable `{…}`), `makeGrammarRoll`, `renderXxxPill`, `pruneXxx`.
- **Persistence:** sidecar arrays → `_field` OPML attributes (JSON); `pruneXxx` drops orphans on
  `exitEdit`. **No per-instance counter/pool state exists yet** (the A4 gap).

---

## Part A — The generative engine

### A.1 Borrowable mechanics (the research)

**Tracery** — the engine's intellectual ancestor.
| Mechanic | Syntax | Why it matters |
|---|---|---|
| **Modifier suffix** (chainable) | `#animal.capitalize#`, `#animal.a#`, `#animal.s#` | The textbook "extend one grammar with no new delimiter": a `.name` table of pure `string→string` fns. The P5-preferred extension pattern. |
| `.a` / `.s` / `.ed` / `.capitalizeAll` | `#noun.a#` → "an owl" | Vowel-aware article, pluralize, past-tense, title-case — each a tiny pure fn. |
| **Saved symbols / actions** | `#[hero:#name#]story#` | Lock a random pick to a name for the rest of an expansion (read-back consistency). |
| **Anti-repeat reroll** | (engine behavior) | Rerolls when a rule's use-count exceeds the median — "feels less repetitive," no syntax. |

**Perchance** — the generation model random-pick variables already borrow from.
| Mechanic | Syntax | Why it matters |
|---|---|---|
| **Lock-and-reuse** | `[w = word.selectOne]` … `[w]` | Select + print + store in one token. ≈ our random-pick variable. |
| **`consumableList`** (draw w/o replacement) | `[cl = animal.consumableList]` then `[cl] [cl]` | **The deck/bag primitive** — the concrete answer to our open "stateful randomness" gap. |
| **`selectUnique(n)`** | `[animal.selectUnique(5)]` | One-shot N-without-repeat (stateless within the call). |
| **Item weight `^`** (fractions allowed) | `dog ^3`, `cat ^0.1` | Per-item weight on the item itself; cleaner than trailing `2`. |
| **Dynamic odds** | `^[hp > 5 ? 10 : 1]` | Weights are expressions over variables, recomputed per draw — couples grammar↔vars. |
| **Hierarchical item properties** | `[planet.country.town]`, `item.value` | A list entry becomes a small record: "roll a sword, read its `.value`." |
| **`evaluateItem`** | `[f = flower.selectOne.evaluateItem]` | Resolve nested `{…}` *before* freezing — a correctness rule for any frozen roll. |

**Ink (inkle)** — narrative sequences; the crown jewels for "text that changes each visit."
| Mechanic | Syntax | Why it matters |
|---|---|---|
| **Sequence markers** | `{!once}` · `{&cycle}` · `{stopping}` · `{~shuffle}` | Advance-and-stick / loop / show-once / random — each needs **one integer of visit state**. |
| **Conditional text** | `{cond: then \| else}` | A generative *if* over the `evalMath` boolean layer — one `resolveBrace` branch. |
| **Visit-count condition** | `{seen: a \| b}` | Branch on "generated before?" — same visit counter. |
| **LIST state machine** | `LIST kettle = cold, (boiling)` | A named, ordered enum with a current value + membership/`+=`/`-=` and `LIST_*` query fns. |
| **User functions** | `=== function lerp(a,b,k) === ~ return …` | Author-defined pure fns callable inline — P5-clean computation extension. |

**Twine (Harlowe / SugarCube)** — state discipline + bound selectors.
| Mechanic | Syntax | Why it matters |
|---|---|---|
| `(random: 1,6)` / `random(1,6)` | inclusive int range | → an `evalMath` `FN2` `random(lo,hi)`, no syntax. |
| **`(cycling-link:)` / `<<cycle>>`** | bound, click-advances options | A pill whose click steps *deterministically* through options (distinct verb from random re-roll). |
| **`(dropdown:)` / `<<listbox>>+<<optionsfrom>>`** | select sourced from a collection | A picker pill fed by a named `collectRules` list. |
| **`(shuffled:)`** | returns the whole list reordered | Shuffle-once-then-consume = the basis of a deck. |
| **`$` vs `_` discipline** | persisted vs ephemeral | The explicit rule for any future render-scratch value (never serialized) — supports retiring the reverted `:=` per-expansion model for good. |
| **`<<for>>`** | loop/repeat emission | → a `{Nx: …}` repeat brace ("roll N times"). |

**Tabletop oracle/table mechanics** (mechanics only — published *data* is copyrighted; see the IP fence).
| Mechanic | Shape | Why it matters |
|---|---|---|
| **Odds-ladder yes/no oracle** | `oracle_likely: yes 3 \| no 1`, or `{= random(1,100) >= 26 ? "yes" : "no"}` | The most-reused solo-gen primitive — a weighted-alt rule or a threshold compare. **User supplies the bands** (IP fence). |
| **State-modulated odds** | threshold = `f(odds, chaos)`, `chaos` a doc variable | An odds ladder modulated by a document-level state var — pure math + one var. (Auto-drift would need state.) |
| **d66 / positional read** | `{d66}` → `10*a+b` | Flat-distribution indexing from two d6 — a tiny `parseDice` mode. |
| **Index-shift modifier** | "roll on table, then +N to the row" | A rule indexed by an expression — one `expandRule` branch. |
| **Recursive / range-gated subtables** | a table entry calls another table | **Already our engine** (`{rule}` calling `{rule}`, with `↻`/`…` guards) — the *range-gated* branch is the one addition. |
| **Roll twice & combine / take higher** | `{2x: table}` + `min`/`max` | Multiplicity + extremal pick — a repeat brace plus existing `min`/`max`. |

### A.2 Proposed upgrades

| # | Upgrade | Inspired by | Seam | P5 | Status / effort |
|---|---|---|---|---|---|
| **A3** | **Conditional text** `{cond: then \| else}` | Ink | `condParts` + `resolveBrace` branch; classify/label/promote/unfold | new `{…}` sub-form; recorded | ✅ **shipped** — `condParts`/`resolveBrace`; an unresolvable condition → `{cond?}` marker |
| **A4** | **Stateful sequences + decks/bags** — `{shuffle:…}` (draw w/o replacement), `{cycle:…}`, `{once:…}`, `{stopping:…}` | Ink sequences + Perchance `consumableList` + Harlowe `(shuffled:)` | `resolveBrace` branch + a **counter/pool field on the grammar record** (already OPML-round-trips via `_grammar`) | new `{…}` sub-form; ⚑ records the "stateful randomness" decision | ✅ **shipped** — `{mode: a\|b\|c}` deck/cycle/once/stopping pill, state on the grammar record (`_grammar` round-trips), `@` "Deck" door; `seqParts`/`nextSeqIndex`/`advanceSeq`. **Resolved the named "stateful randomness" open question.** |
| **A5** | **Item weights as expressions / dynamic odds** | Perchance `^[expr]` | extend `parseAlt` so a weight may be a `{=expr}` | reuses `{=}`; no new sigil | ✅ **shipped** — a trailing `{= expr}` weight (`{a \| b {= str}}`) resolves against the doc vars at pick time (`pickWeightedAlt(alts, vars)`); unresolved → neutral 1, `≤0` disables the alt |
| **A1** | **Text modifiers** `.a/.an`, `.s` (plural), `.cap`, `.title` | Tracery + Perchance | `resolveBrace` post-identifier handling | ⚑ the one place that bumps P5 (a `.mod` lexical element) — needs sign-off; **already a deferred follow-on** in `generation-direction.md` §5 | ✅ **shipped** (the recorded P5 sign-off) — `{ref.mod}`, closed set `cap/title/upper/lower/a/s` + the additive follow-ons `ed`/`ord`; `modParts`/`applyMods`, routes through the grammar pill. Aliases (`.an`/`.capitalize`/`.plural`) + irregulars deferred. |
| **A2** | **Inline lock-and-reuse** `{name = …}` | Perchance `[w=…]`; Tracery saved symbols | — | ⚑ this *is* the deferred `{:=}`-class shorthand; the *declared* random-pick variable already ships the semantics | ◐ semantics shipped; inline form deferred (lock) |
| **A6** | **Hierarchical rule/item properties** `{sword.value}` | Perchance hierarchical lists | richer rule record + a `.prop` drill in `expandRule` | reuses `{…}` + the `.` from A1 | ✅ **shipped** — dotted sub-rules (`sword.damage: 1d8`) + `{item.field}` (`fieldParts` + a `resolveBrace` branch after `modParts`); cross-field consistency rides a **pick variable**, NOT the reverted per-expansion bind. v1 = single field; field×modifier chaining + multi-level nesting deferred. |
| **A7** | **Resolve-then-freeze discipline** (expand nested `{…}` before freezing) | Perchance `evaluateItem` | `rollPickSource` / `promoteBraceBody` freeze path | none (a correctness rule) | ☐ tiny — audit-and-pin |
| **A8** | **Knobs:** `{Nx: …}` repeat brace · `random(lo,hi)` (`FN2`) · `{d66}` dice mode · a **cycling-link pill** (deterministic advance) · user **seed** | Twine `<<for>>`/`(cycling-link:)` + d66 + procgen seeds | `resolveBrace` / `FN2` / `parseDice` / a new pill verb / RNG plumbing | mostly reuse; cycling-link is a new *interaction* (needs a P2 front door) | ◐ partial — **`{Nx: template}` repeat ✅ shipped** (`repeatParts`); dice **reroll `rK`** also shipped (PR brief). `{d66}` = **won't-do** (collides with a literal 66-sided die); `random(lo,hi)`/cycling-link/user-seed deferred. |
| **A-oracle** | **Tunable yes/no oracle** (front door over A3+A5) | tabletop oracles | a `@`-menu recipe building a weighted-alt rule | reuses A3/A5; **IP fence on data** | ✅ **shipped** — `@` "Oracle (yes/no)" door → a likelihood picker (Certain…Impossible, **original** neutral ratios) that builds an anonymous `Yes N \| No M` weighted-alt pill; the odds field accepts A5 `{= expr}` weights for dynamic odds |

**Why A4 is the headline.** Ink's `once/cycle/stopping` and Perchance's `consumableList` are the
*same* primitive as a deck/bag: a pill that remembers a counter (an int) or a remaining pool (an
array). That state already has a home — the grammar record sidecar, which serializes to
`_grammar` exactly like a frozen dice roll. Clean implementation: *shuffle once → freeze the
order/pool on the record → consume per draw → reshuffle on explicit re-roll* (the existing freeze
model). One open sub-decision (OPML-record vs sidecar) is settled by reusing the sidecar.

---

## Part B — The computational engine

### B.1 Borrowable mechanics (the research)

**Soulver / Calca / Frink / Numi / Qalculate** — living-document math.
| Mechanic | Tool · syntax | Why it matters | Host fit |
|---|---|---|---|
| **Date functions** `daysuntil`/`daysbetween`/`midpoint`/`weekofyear`/`adddays`/`yearfrac` | Soulver/Qalculate | pure epoch-day arithmetic on an engine that already has `today` + epoch dates | **P5✓** `FN1`/`FN2` adds |
| **Percentage phrasings** `10% of/off/on X`, `X is what % of Y` | Soulver | removes the "times or divide?" ambiguity; pure rewrites | **P5✓** parse forms / `FN2` |
| **Representation formatters** `asfraction`, `asbin`, `mixed(v,[units])` | Qalculate/Frink | display-layer like the existing `asdate()` identity | **P5✓** |
| **User-defined functions** `f(x,y)=x^2+2y` | Calca; Ink fns | doc-wide named formulas — the math analogue of named rules | **P5✓** parameterized var in `ident()` |
| **Line references / running totals** `line2 * 3`, subtotal blocks | Soulver/Numi | references to earlier results = a compute graph; outline already has stable ids | ⚑ a new resolve path (result-of-node), not a delimiter |
| **`=>` inline-result sugar** | Calca | terser keyboard-native authoring promoting to the math pill | **P5✓** alt authoring sugar |
| **Unit depth + conformance errors** | Frink/Calca/Qalculate | a bundled unit *data file* proves comprehensiveness fits single-file; "tell the user *why* it failed + suggest a fix" beats silent `null` | conversions **P5✓**; full dimension-tracking ⚑ engine change; **borrow the error-with-fix UX regardless** (P4) |
| **Manual-rate currency** `50 EUR in USD at 1.05` | Soulver | the **offline-safe** form (user supplies the rate) | **P5✓**; live rates ⊘ (network) |

**Squiggle / Guesstimate** — distributions as first-class values (the F3 frontier).
| Mechanic | Syntax | Why it matters |
|---|---|---|
| **`to` operator** | `5 to 10` ≡ lognormal with 5/95th percentiles → a 90% CI from two numbers | lowest-ceremony distribution syntax that exists; a `resolveBrace`/`evalMath` branch sniffed by `\d+\s+to\s+\d+` — reuses a plain English word, mints no delimiter |
| **Constructors** | `normal(5,1)`, `uniform(0,24)`, `normal({p5,p95})` | each a fn returning a sampler closure; alternative parameterizations |
| **`mixture`/`mx`** | `mx(normal(5,2), 10, weights:[.7,.3])` | **weighted alternation lifted to distributions** — the engine already parses weighted `|` |
| **Monte-Carlo propagation** | a distribution = a length-N **sample array**; `a+b` zips the arrays element-wise | the entire uncertainty-propagation model; N≈1000, **frozen** like a pick, re-sampled only on click |
| **Sparkline / summary** | `sparkline(d)` → `▁▂▄▆█▆▄▂▁`; `mean`, `quantile(d,.95)` | **a histogram that is literally a string** — the perfect inline, export-safe display |

**org-mode** — subtree rollups + dynamic content.
| Mechanic | Syntax | Why it matters |
|---|---|---|
| **Column-view summary operators** | `%Cost{+}` · `{:min}`/`{:max}`/`{:mean}` · `{X}`/`{X/}`/`{X%}` | `#+TBLFM` `vsum/vmean` generalized to the **outline tree** — a `prop{+}` rollup pill, render-time, no new sigil |
| **`est+` three-point estimate** | child ranges `1-10`; parent `{est+}` sums means + variances | the **cheap, no-sampling cousin of B2** — O(1) analytic rollup of uncertain estimates (exact for sums of independents) |
| **Dynamic blocks / columnview** | `#+BEGIN: columnview :format …` | walk a subtree → project properties into a table → apply summaries → render; we already have `renderStaticTable` + `computeTable` |
| **`#+TBLFM` extras** | `@<`/`@>`/`$<`/`$>` boundary refs · `vmedian`/`vsdev` · `remote(name,@2$3)` | position-robust refs, fuller vector fns, and **cross-table refs by name** (parallels `collectRules`/`collectVars`) — all on the "not yet supported" list |
| **Capture templates** | `%^{Prompt\|default\|opt}`, `%\1` back-ref | a **fill-in-the-blanks** grammar for the existing Templates feature → a `{?Name\|default\|opt}` stamp-time prompt |
| **Sparse trees** | matches + ancestors, rest folded | the canonical "filtered outline" render — what search/`is:`/`#tag` filtering should *show* (the refile picker already does this) |

### B.2 Proposed upgrades

| # | Upgrade | Inspired by | Seam | P5 | Status / effort |
|---|---|---|---|---|---|
| **B1** | **Subtree aggregation** — `{sum(cost)}` / `mean`/`count`/`max` over direct children's properties | org column-view; OmniOutliner summary rows | a `resolveBrace`/`evalMath` children-scope fn reading `node.props` across children at render (render globals already carry node context; reuse `markDirty`/`_varsVer`) | reuses `{…}` — roadmap already prefers this over a new token | ✅ **shipped** — `{= sum\|avg\|count\|min\|max(prop)}` over direct children (`expandAggExpr`/`aggregateChildren`, render-time + live); `min`/`max` return the ±∞ identity on an empty set; **date-shaped props aggregate as epoch-days** (`childPropNumber` → `parseDueDate`), so `max(due)` range checks work |
| **B2** | **Uncertainty fields** — `{5 to 10}` distribution value; Monte-Carlo rollup; `mean ± [p5,p95]` + unicode sparkline | Squiggle, Guesstimate, org `est+` | a sampled value type in `evalMath`; **reuse the dice sampler**; freeze the N-sample array like a pick; `est+` as the O(1) default for sum-of-ranges | ⚑ a value-type change + a `to` operator decision (the P5-preferred zone — an operator, like `%`/`^`) | ✅ **shipped** (frontier F3, first-in-class) — the `est` artifact with its OWN Monte-Carlo sampler (a distribution can't ride `evalMath`'s number-only contract); `lo to hi`/`normal`/`uniform` + `+−×÷`, Phase-2 `sum\|avg(prop)` tree rollup; storage `{key,expr,seed}` (reproducible). The `to` operator is the one recorded new sub-language. Deferred: `min/max/count`, mixtures, correlation, more families, analytic `est+`, cross-engine. |
| **B3** | **Living-document math** — line refs, running totals, `20% off 50`, `=>` | Soulver, Calca | per-node line-eval mode; `evalMath` | percent forms **P5✓**; result-of-node ⚑ new resolve path | ☐ medium |
| **B4** | **Deeper units + conformance errors** | Frink, Qalculate | grow `FN1` `from2to` / a general `convert(x,'km','mi')` / `x in mi`; bundle a unit data subset | conversions **P5✓**; dimension-tracking ⚑; **adopt the error-with-fix UX now (P4)** | ☐ small (additive) → large (full units) |
| **B5** | **Date/interval math** — durations, business-day diffs, `mixed` formatting | Frink, Numi, Soulver | `FN1`/`FN2`/`FN3` over the existing epoch-day model | **P5✓** | ☐ small |
| **B-tbl** | **TBLFM extensions** — `@</@>/$</$>` refs, `vmedian`/`vsdev`, `remote(name,ref)` | org | `parseOrgRef`/`computeTable` + a named-table index | reuses `@row$col`; `remote()` is on the explicit not-yet list | ☐ small–medium |
| **B-fn** | **User-defined math functions** `f(x)=…` | Calca; Ink fns | `ident()` + a parameterized var record | reuses `{name}` call form | ☐ medium |

**Why B1+B2 are the pair to win.** No offline outliner rolls *uncertain* estimates up a tree;
Pointliner already holds every prerequisite (a sampler in the dice engine, an evaluator,
variables, properties). org's `est+` is the only prior art and nobody extended it. B1 is the
bridge (math sees children); B2 is the differentiator (children may be distributions). The
single best small slice: **`{5 to 10}` input + a unicode-sparkline display + `est+` analytic
rollup as the no-sampling default**, with full Monte-Carlo reserved for non-sum operations.

---

## Part C — Single-file offline-ness

### C.1 Borrowable mechanics (the research)

**TiddlyWiki** — the canonical single-file self-editing app.
- **Save ladder (the answer to "a file that saves itself" with no server/network):**
  (1) **File System Access** saver — `showSaveFilePicker()` once, stash the `FileSystemFileHandle`
  in IndexedDB, re-permission via `queryPermission`/`requestPermission`, overwrite in place via
  `createWritable()`. True self-save. **Chromium-only.** (2) **Download saver** — Blob +
  `URL.createObjectURL` + `<a download>` — works *everywhere*, produces a new file the user swaps
  in. Mirror TiddlyWiki's "try the handle, fall back to download." (Avoid: the Node-server saver
  and native-helper bridges — Timimi/TiddlyFox — they need installs and *rot when browsers
  change*, the cautionary tale.)
- **`SaverFilter` dirty rule** — one declarative point for "what makes the doc dirty," separate
  from "how it saves" (≈ our single `markDirty()`).
- **Filter DSL** — one bracketed query grammar (`[tag[done]sort[title]]`) with run-prefix set
  algebra (no prefix = OR, `+` = AND, `-` = NOT, `~` = else) and `:map`/`:reduce`/`:filter`
  named prefixes. Validates our P5 discipline and offers `~`/else as a future search extension.
- **Transclusion `{{Tiddler||Template|params}}`** — the reference design for our link *mirror*
  (`[[#id|]]`), including parameterized transclusion.
- **`\define`/`\procedure`/`\function` macros** ≈ our named grammar rules; TiddlyWiki *retired
  four macro syntaxes onto one `$transclude`* — the exact "retire what you overlap" P5 move.
- **Plugins are tiddlers** — extension bundles ride as ordinary content records inside the single
  file (≈ our sidecar arrays); **shadow/override** layering gives revertible defaults by
  name-collision.

**Decker (modern HyperCard)** — single-file local creative computing.
- **`.html` deck = runtime wrapper + payload in a `<script>`** — exact validation of "one file =
  engine + document, self-executing offline"; the engine-vs-data split is a clean pattern.
- **Line-oriented chunked serialization** — `diff`-friendly, external-editor-friendly (relevant
  if git-friendliness ever beats OPML's one-attribute-blob).
- **Copy-on-write immutability** ≈ our "pure cores, `node.text` is source of truth"; **shadow
  `send`-to-outer** ≈ TiddlyWiki shadows (a recurring single-file "default, locally overridable"
  pattern).

**Browser save APIs** — `showSaveFilePicker`/`showDirectoryPicker` are **Chromium-only** (Firefox
& Safari decline them); the **download trick** is the universal floor; `navigator.storage.persist()`
+ IndexedDB/OPFS is a **crash buffer only** (sandboxed, *not* the user's file).

### C.2 Proposed upgrades

| # | Upgrade | Inspired by | Mechanism | Status / effort |
|---|---|---|---|---|
| **C1** | **"Save as one self-contained HTML"** — a file that *is* the document **and** the app | TiddlyWiki; Decker stacks | export = a copy of `index.html` with the current OPML inlined in the `#pl-embedded-doc` `<script type="application/xml">` data-island; on load `restoreEmbeddedDoc()` hydrates from it (wins over local autosave), opening **in display mode** as a re-rollable snapshot | ✅ **shipped** — File menu → *Self-contained HTML*; pure cores `embedOpmlIntoHtml`/`extractEmbeddedOpml`; browser-verified round-trip (export→reopen→live pills) |
| **C2** | **One-click in-place save + saver ladder + dirty guard** | TiddlyWiki savers | `showSaveFilePicker` retained handle (Chromium) → download fallback; unsaved-changes indicator + `beforeunload` | ☐ improves the single-file tier *now*, independent of the gated multi-doc FSA work — small–medium |
| **C3** | **Doc-defined vocabulary** — the document carries its own functions/rules | TiddlyWiki macros; Ink functions | parameterized rules `{greet(name)}` / user math fns `f(x)=x^2` over `collectRules`+variables — **no eval, no build** | ☐ the safe slice of self-extensibility (overlaps B-fn) — medium |
| **C4** | **Live query / filter as content** | TiddlyWiki filter DSL; org dynamic blocks; Logseq `{{query}}` | the query parser (`parseSearchQuery`/`queryMatchesNode`), the `collectX` indexes, and the link-mirror transclusion already exist | ⚑ **fenced** — the `{query:…}` saved-views DB layer is out of scope; flag, don't build without a scope decision |
| **C5** | **Reproducible/portable seeds** | TiddlyWiki permalinks; procgen seeds | a doc/pill seed so a shared generator reproduces (or deliberately re-rolls) | ☐ pairs with C1 + A8 — small |

---

## 3. Prioritization & sequencing

Ranked by leverage ÷ cost, in-bounds first:

1. **A3 conditional text + A5 item-weight expressions** — tiny, P5-clean; together they make the
   grammar genuinely expressive (and unblock a *user-built* oracle past the IP fence). *(A3, A5,
   and the A-oracle front door all shipped 2026-06-14.)*
2. **A4 stateful sequences / decks** — closes the *named* open question with an obvious sidecar
   home; high delight (decks, rotating flavor, draw-without-replacement).
3. **B1 subtree aggregation** — the roadmap's preferred shape; turns the outline into a
   calculator that sees its own structure (the PM/data unlock).
4. **C1 self-contained HTML export** — small, universal, and the strategic multiplier on
   everything else. *(Shipped — File menu → Self-contained HTML.)*
5. **B2 uncertainty fields** — the lone *first-in-class* feature; design-heavier (the `to`
   operator needs the P5 decision) but uniquely Pointliner's to claim. Ship the small slice
   (`{5 to 10}` + sparkline + `est+`) first.
6. **A8 knobs + B4/B5 additive `FN` growth** — cheap interleaving material between heavy phases.

*(Deferred-by-lock, needs sign-off):* **A1 modifiers** — highest QoL but the one real P5 cost;
**A2 inline lock** — semantics already shipped as the declared random-pick variable.

**Interleaving with the roadmap.** These are the concrete contents of `roadmap.md`'s
*"Interleaving (the balance)"* clause — contained generative/computational features dropped
between the heavy multi-document PKM phases, so both identities keep moving. None of them block,
or are blocked by, the multi-doc workspace; A4/B1/B2/C1 are all single-file, single-document
features that ship in any browser, ungated.

**Working method (unchanged).** Per item: a verified **pure core first** (parse/eval/index fn +
seeded `node --test` pins → add to `load-cores.mjs` `need`), *then* DOM/UI wiring, *then* the
`ux-definition-of-done.md` gate with a Conformance Statement. New user-facing syntax (A1, the B2
`to` operator) clears the P5 explicit-decision path and updates `ux-discipline.md` §2 first.

---

## 4. Source index

**Generative/text:** Tracery — github.com/galaxykate/tracery (readme.md, tracery.js).
Perchance — perchance.fandom.com (Unique Selections / Hierarchical Lists / Storing Selections),
perchance.org (learn-perchance-syntax-probability, consumable-list examples). Ink —
github.com/inkle/ink (Documentation/WritingWithInk.md). Twine — twine2.neocities.org (Harlowe 3),
motoslave.net/sugarcube/2/docs (SugarCube), twinery.org/cookbook. Tabletop — Ironsworn SRD
(tedtschopp.github.io/Ironsworn-SRD, CC-BY), Mythic Fate Chart (fantasygrounds.com forums), D66
(rpgmuseum.fandom.com/wiki/D66), Roll20 RecursiveTable (github.com/Roll20/roll20-api-scripts).

**Computation:** Soulver — documentation.soulver.app (line-references / totals / percentages /
dates / currencies). Calca — calca.io/reference. Frink — frinklang.org (+ frinkdata/units.txt).
Numi — github.com/Numi-Mac-License. Qalculate — qalculate.github.io/manual. Squiggle —
squiggle-language.com/docs (DistributionCreation, Api/Dist, Api/DistSampleSet). Guesstimate —
docs.getguesstimate.com, medium.com/guesstimate-blog. org-mode — orgmode.org/manual
(Column-attributes, Dynamic-Blocks, Capturing-column-view, References, Template-expansion,
Sparse-Trees); Three-point estimation (Wikipedia).

**Single-file:** TiddlyWiki — tiddlywiki.com/static (SavingMechanism, Filter Syntax, Macros,
PluginMechanism, TranscludeWidget). Decker — beyondloom.com/decker (format, lil). Browser save —
developer.mozilla.org/en-US/docs/Web/API/File_System_API, StorageManager/persist.

---

*Companion to `outliner-frontier-report.md` (industry-wide unbuilt frontier) and `backlog.md`
(PKM feature gaps). This catalogue is candidate material for `roadmap.md`'s interleaving clause —
not a commitment. Every row clears the normal gate before it ships, and the guardrails in §1 are
binding.*
