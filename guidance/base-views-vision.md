# Base views: the rich-visualization vision

**Status: DELIVERED (2026-07); trimmed to the durable parts (2026-07-18).** What this doc argued
for has shipped: the view system + board (BV-1), cards (BV-2), calendar (BV-3), the FR-1 display
roles with per-role editors, query bases through QP-2 Phase C, and the SV-1/SV-2 sorts. The shipped
narrative (the axes reframing, the field-roles keystone argument, the view sketches, the data model,
the build-order recommendation) has been removed as history the ledgers now carry. **Two parts
remain, because they still bind future work:** §0 (the red-team corrections) and §3b (the column
type catalogue / possibility map). Everything else now lives in the docs named under "Where the rest
lives" at the foot of this file.

---

## 0. Red-team corrections (read first, these bind the rest of the doc)

A three-lens adversarial review (architecture / scope / product) attacked this doc against the actual
code. The verdict: the core architecture is **sound**, but the doc overstated in four ways that would
mislead a build decision. The corrections below **override** any looser phrasing later in the doc.

**0.1 "A view is source-agnostic" is true for the row MODEL, not for cell CONTENT (the fatal fix).**
The doc's headline claim (a view never asks where the rows came from) holds only at the row-model
layer. It is FALSE at the cell-content layer: `mtInline(node, raw)` is node-scoped, it sets
`cookieNode`, `renderVarMap = varMapAt(node)`, and the eight artifact render-globals from the *passed
node*. So any `[[type:KEY]]` pill, a `{= words(self)}`, or a positional `{name}` inside a cell resolves
against THAT node's sidecars. Correct for an authored base (its cells and sidecars co-own one node);
WRONG for a query base, whose cell content is projected from foreign points and would resolve against
the base host instead. **Binding rule:** a query base MUST pre-resolve foreign cell content to inert
plain strings inside `queryTableRows` before it reaches `mtInline` (or rebind the globals per cell).
The title-projection case is the common one and must be handled explicitly. The axes still multiply,
but only after this pre-resolution step, which the doc's "for free" framing omitted.

**0.2 Only static PAINT is free; INTERACTION on non-table views is net-new, mandatory cost.** The
"free tier" (links, images, tags, pills render in a cell) is real for *read-only paint*. It is NOT
true for interaction. The ~33 `mt*` edit/focus/keyboard handlers are bound to `<td data-r/data-c>`
grid geometry (`focusin`/`input`/`focusout`, `mtSpliceCell`, cell-caret nav); none of it applies to a
`<div>` card in kanban/gallery. So each non-table view must build its own edit/focus/keyboard/a11y
layer from scratch, under the caret invariant (CLAUDE.md's most load-bearing rule) and P3
reachability. The date/status cell editors are also net-new: `showTodoPicker` explicitly refuses
`node.type === 'base'`, and `attachDateCalendar` is wired to dialog fields, not cells. Every "trivial"
and "small" in the doc's cost table means *static paint + grouping*; the interaction layer is the real,
non-optional cost.

**0.3 A query base re-queries every render; gate it like search or it breaks the perf budget.**
Producing a query base's rows runs `queryRows`, an UNCACHED full tree walk (O(total nodes); ~34ms at
10k, ~230ms at 50k per `performance.md`), not one of the eight `_varsVer` doc-caches. Grouped as
kanban/gallery it recomputes on every `render()`, un-debounced, unlike the 140ms-debounced search box.
Left as-is this reintroduces the "eager reactive query layer" whose *absence* `performance.md` credits
for beating Logseq/Roam. **Binding rule:** memoize the query-base row model by `_varsVer` (and cap
it), so an unchanged query base does zero tree work on a plain re-render. Also: `buildTableWidget` has
no internal virtualization, so even a few-hundred-card board pays a full DOM rebuild per render.

**0.4 Query-sourced views RENDER for free but are READ-ONLY until QP-2 Phase C; write-through is
re-fenced.** "Query bases get every view for free" means every view's *rendering*, not its editing. A
query-sourced kanban paints for free but its defining gesture, drag-a-card-to-change-status, needs
QP-2 Phase C: resolve `id -> foreign source node -> property` and mutate it. That is the most-deferred,
fence-reopening-furthest piece, and it is a genuine footgun (a projection cell silently rewriting an
offscreen point, no undo-locality, no visual signal, against the "a point owns its own text" model).
It is NOT a settled cheap ingredient; it stays gated and is not part of any approval requested here.
**Authored** kanban drag-to-move is fine (it commits into the base's own `node.text` via `mtCommit`),
so authored boards ship fully without any foreign-node write; only query boards' drag waits for Phase C.

**0.5 "Field roles" IS the deferred typed-fields item; naming it honestly.** The doc routes roles
through the fence-reopen (so this is disclosed, not smuggled), but "a hint, not a type" undersells it.
A status role that offers its known values and constrains the editor IS the `bases-direction.md` §4
"typed fields" deferral (which names select by name), and its value-set needs a `knownStates`-style
collected cache. Honest framing: **an opt-in per-column constraint (a small schema you choose), not a
validated global type system, and not mandatory.** A column with no role stays a plain string, so the
freeform philosophy holds, but this is a real deferred-item move, not a free hint.

**0.6 The saved-views line is drawn by KIND, not count.** A view config persists only a lens plus a
role-mapping (`kind` + the `*By` fields) as a sidecar. It NEVER persists a filter/sort predicate over
rows, and there is NEVER a named, library-managed collection of views. The doctrine's deferred "saved
views" is filters/sorts-as-data-operations plus a saved-view library; that stays out. Quantity is not
the boundary (an earlier "or a small switchable set" hedge is withdrawn); the predicate/library line is.

**0.7 The type catalogue (§3b) and the minimal role set (§7) are in tension; reconcile before
building.** This doc carries both a ~20-type catalogue and a 6-role minimal fence. They are not the
same commitment. Treat §3b as the *possibility space* (what a cell can render) and §7 as the *v1 fence*
(what a first build ships). A build plan picks the minimal set; the catalogue is the map, not the
manifest.

The keystone insight (rich views require field roles) and the one solid technical leg (the `_view` /
`_colrole` sidecars round-trip through OPML and the self-contained-HTML export, verified) survive the
review intact and anchor the rescoped version.

---


## 0b. The mission thesis (moved)

The §0b mission thesis — *views in service of the generative layer; parity with database/PKM apps is
the scope creep the fences stop* — **graduated to `guidance/product-identity.md`** (§0b/§2, the
product's scope filter and the §0b mission test). Read it there; it is no longer a bases-only
argument.

---

## 3b. The column type catalogue (validated against the code)

Every type below was checked against what a base cell can actually store, compute, and render. A base
cell renders through the full inline markdown pipeline (`mtInline` -> `mdInline`), which is why the
"free" tier is large: links, images, tags, and pills already render in a cell today. Two things
(status chips, checkboxes) live only in the block parser, so they need a small cell-scoped render
branch. Cells are strictly single-line (`serializeTable` collapses newlines to spaces), so no
multi-line type exists.

Types are grouped into families (this grouping also drives the picker, see 3c). Each entry notes its
feasibility tier: **free** (renders today, the role is just a hint), **small** (needs an editor
affordance or a value-to-render mapping), or **heavier** (a new render path).

**Text family**
- **Text** (free): the default. Inline emphasis and code already render (`mdEmph`, inline-code
  stash). Every new column is this until enriched.
- **Long text** (free-ish, single-line only): same as text; a base cell cannot hold newlines, so
  "long text" is a soft label, not a multi-line type. Named so the picker can say so honestly rather
  than implying a textarea.

**Number family** (the computed heart, backed by TBLFM + evalMath)
- **Number** (small): stored as text; a role runs the value through `formatMathResult` and right-
  aligns. Free-form arithmetic already works via `#+TBLFM:` column formulas (`$3=$1*$2`).
- **Formula** (free, already shipped): a `#+TBLFM:` column/cell formula. The full math grammar is
  available: `+ - * / % ^`, comparisons, ternary/`if`, and every FN1/FN2/FN3 function (`sqrt`, trig,
  `log`, `clamp`, `pctof`, `pctchange`, `hypot`, the `c2f`/`km2mi`/`kg2lb` unit conversions), plus
  document variables by name (`$3=$1*tax`). Cross-row aggregates via `vsum`/`vmean`/`vmax`/`vmin`/
  `vcount`/`vmedian` over a range give column totals and footers.
- **Currency / Percent** (small): a Number with a display format (a `$`/`%` affix on the formatted
  value). Pure display over the same numeric machinery.
- **Rating (stars)** (heavier): a numeric value rendered as star glyphs; no star renderer exists, so
  it is a new cell-render path over an existing number.
- **Progress bar** (small-to-heavier): a numeric 0-100 rendered as a bar. The progress *cookie*
  (`[/]`, `[%]`) already renders in a cell but computes against the base node's tasks, so a
  per-row bar off a numeric cell is a small new renderer.

**Date and time family** (dates are epoch-day numbers; the machinery exists)
- **Date** (small): stored as ISO `YYYY-MM-DD` text, validated by `parseDueDate` (free), rendered as
  an urgency-colored chip (today/soon/overdue/future, the agenda chip CSS exists) and edited via the
  existing inline `buildDatePicker` calendar. The pieces all exist bound to properties today; the
  wiring to a cell is the "small" part. Date math (`daysuntil`, `daysbetween`, `today+N`, `date(y,m,d)`,
  `year`/`month`/`weekday`/`quarter`) works in a formula column over a numeric epoch-day.
- **Date range** (small): two date cells or a `start -> due` pair, reusing the agenda's range model.
- **Created / Modified** (heavier): auto-timestamps would need the base to write a timestamp on
  row edit, which a query base (foreign rows) cannot own. Named but flagged as needing a decision.

**Choice family** (the kanban keystone)
- **Select / Status** (heavier, the load-bearing one): a cell holds a keyword from an allowed set,
  rendered as a colored chip. The chip CSS (`.todo-state` variants) and the value-set engine
  (`collectSequences`, the built-in `TODO NEXT WAITING | DONE`) both exist, but the colored badge is
  produced in the block parser (`renderContentHTML`/`parseTodo`), NOT in `mdInline`, so a cell needs
  a new cell-scoped render branch that maps a value to a chip. This is the single most important
  "heavier" type because **kanban lanes are a Select column** and the editor offers its known values.
- **Multi-select / Tags** (free): `#tag #tag2` already renders as chips in a cell (the hashtag pass).
  A "tags" role is just a hint plus an authoring helper (the `#` picker).
- **Checkbox / Boolean** (small-to-heavier): an interactive checkbox is a block-parser construct
  (`md-task-check`), so a cell needs a cell-scoped emit + a toggle that splices the cell string. The
  widget and its accent CSS exist; the cell wiring is new.

**Link and media family** (the surprise free wins)
- **Link / Relation** (free): `[[#id|label]]` already renders as a live node-link pill in a cell,
  with the live target title and broken-link marking. This is the "relate to another point" column,
  essentially free; a role is only an authoring hint. Cross-document `[[docId#id|label]]` works too.
- **URL** (free): a bare `https://...` autolinks in a cell; `[text](url)` works too.
- **Image** (free): `![alt](url)` renders a thumbnail, and there is already dedicated cell CSS
  (`.mt-cell .md-img{max-height:120px}`). This is the **gallery cover** field, essentially free.
- **File / attachment** (out): no binary attachments (single-file constraint). A "file" column can
  only be a URL or link, so it collapses into URL. Named to say explicitly it is not a new type.

**Generative family** (unique to this app, free)
- **Pill columns** (free): any artifact pill renders in a cell (dice, math, grammar, estimate,
  variable, query). A cell can hold `{= sum(cost)}` or a dice pill. Caveat: pill keys resolve against
  the base node's shared sidecars, so this is document-authored, not per-cell config; useful but with
  a known sharp edge, noted so a design does not over-promise per-row pills.

**Row-meta family** (computed, free-ish)
- **Row index** (free): `$#` in a formula gives the 1-based row number.
- **Title / Name** (free, and the query-base default): for a query base, the matched point's title;
  for an authored base, just a text column the user designates. The gallery/list "title" role.

**What is deliberately NOT a column type** (the fence, restated as types):
- **No multi-line rich text** (single-line cells).
- **No relation-to-another-base** (freeform philosophy: relate to points via links, not a base-to-
  base relation engine).
- **No formula returning a string/label/boolean** (evalMath is number-only; a computed column
  produces a number, a date via `asdate(...)`, or `#ERR (reason)` shown as text).
- **No auto-computed created/modified on query bases** (foreign rows the base does not own).

So the type set is genuinely rich (roughly twenty entries across seven families), and the honest
tiering is: **most are free or small** because cells already run the full inline renderer, and the
two that anchor the rich views (Select for kanban, Date for calendar) are the ones worth the "small-
to-heavier" wiring. This is the explosion of possibility, and it fits the single-file, text-first
architecture without a single new storage type.

---

## Where the rest lives (shipped / superseded)

The removed sections became the following authoritative records:

- **The shipped-record ledger** (what exists, PR by PR — QP-2 A/B/C, FR-1 roles, BV-1..3, SV-1/SV-2):
  `bases-direction.md` §4/§7.
- **The mission thesis / scope filter** (former §0b, §1's reframing, §8's "is this the right
  endgame" question): `guidance/product-identity.md` §0b/§2 + the §9 substrate test.
- **The saved-views below-the-line decisions** (former §0.6, §7's out-of-scope, the SV-3/SV-4 NOs):
  `guidance/saved-views-proposal.md`.
- **The query-base rationale** (former §4 data model, §6 sequencing): `guidance/query-base-proposal.md`
  (Status: SHIPPED through Phase C).
- **The base-is-always-text law** (former §3a) and the layout/interaction model (former §5):
  `bases-direction.md` §3/§5.

The four build-order decisions (former §8) are all taken and shipped; that section is retired.
