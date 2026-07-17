# Query base (QP-2): proposal

**Status: SHIPPED IN FULL — Phase A 2026-07-02, Phases B and C 2026-07-16.** The proposal was
approved as "a mode of the existing base" (§6's recommendation); Phase B (the show-all cap toggle +
stable row identity) and Phase C (property-cell write-through, with the §0.4 footguns answered:
announced commits, undo-locality, properties-only writes) later shipped under the owner's
below-the-line call, and SV-2 added a persisted config sort. The authoritative shipped-record now
lives in `bases-direction.md` §4; this document is retained as the design rationale and the record
of what §5 deliberately kept out (the saved-views database layer stays out — see
`saved-views-proposal.md` for that decision). Read alongside `bases-direction.md`.

---

## 1. What a query base is, in one sentence

A **query base** is a base whose rows are **produced by a search** over the outline instead of
typed into the grid, with each column **projecting one field** of the matched points. It is the
table-view sibling of the query pill: the pill lists matches as links inline, the query base shows
them as a grid.

Example: `is:todo -is:done` sourcing a base with columns `Title`, `due`, `owner`, `{= words(self)}`
gives you a live, sortable-looking task table that updates itself as the document changes, with no
data duplicated anywhere.

---

## 2. Why this is in scope (the object/view argument)

The bases doctrine (§2) draws the load-bearing line: a **base is a data object**, a **table is a
view**. The deferred "filters as data operations, saved views" (§4) is a Notion-style feature:
filtering a base's **own stored rows**, a persisted lens over data the base owns. A query base is a
different kind:

- It **owns no data.** Its rows are a computed projection of points that live elsewhere in the
  outline. Editing the outline changes the base; the base stores nothing but the query and the
  column definitions.
- It is the **same principle QP-1 already shipped and you already blessed**: a rendering of a live
  search, not a stored view. The query pill proved that principle is in scope; the query base is
  that principle in the base's table view.

So the honest framing for the fence: **QP-2 does not build "filters on a base's stored data" (still
deferred). It builds a new kind of base whose view is sourced from a query.** That is a genuine
reopening of the fence and needs your call, but it is a narrow, principled one, not the scope-eating
version the fence exists to prevent. The freeform-bases philosophy (§3, "no forced schema, no every-
base-is-a-list-of-pages") is preserved: a query base's columns are still user-defined projections,
not an imposed relation model.

---

## 3. What the code says (the constraint that shapes everything)

The base architecture map (code-grounded) surfaced one fact that dictates the whole design:

> **A base is not a container of rows. Its entire grid is serialized pipe-table markdown in
> `node.text`.** `mtModel(node)` decodes it to `{aligns, rows}` (a `string[][]`); every cell edit
> writes back through `mtCommit` → `serializeTable` → `node.text`. Rows are **not** child nodes;
> they are text this base owns.

A query base's rows are the opposite: a **computed list of foreign points** the base does not own.
This inverts three things the base UI assumes:

1. **Cell ownership.** Today `rows[r][c]` is text this node owns (`input` handler writes it back at
   the cell-edit path). A query-base cell's value belongs to a foreign node found by the query. To
   edit it, you would have to resolve `id -> foreign node -> field` and mutate *that* node.
2. **Row mutation.** `mtInsertRow` / `mtDeleteRow` / `mtMoveRow` / Tab-to-add-row all splice
   `model.rows` and re-serialize. For a result set, hand-adding or reordering a row is meaningless.
3. **Persistence.** A normal base persists rows-as-text plus `_colw`. A query base must persist the
   query and the column definitions and must **not** persist rows (they recompute every render, like
   the pill).

**The one clean seam** the map found: `buildTableWidget(node)` reads its model from exactly one call,
`mtModel(node)` (index.html around line 5969). If a query base synthesizes its `{aligns, rows}` model
on the fly (project query results into a matrix), the renderer, `colStyle`, and `mtInline` mostly
work unchanged. The read path forks at one function; the write path is where the design decisions
live.

---

## 4. The design: a read-mostly query base, in three build phases

The inverted-ownership problem is real, so the proposal does **not** try to make a query base a
fully-editable grid backed by foreign nodes in v1. That is the version that fights the architecture.
Instead, ship the coherent subset first and earn each escalation.

### Phase A (MVP): a read-only query base

The smallest thing that is genuinely useful and genuinely clean.

- **Model.** A new node type or a base sub-mode (see §6 for that decision) carrying a **query
  sidecar** (`node.query`, reuse the existing `[[query:KEY]]` / `_query` mechanism) plus a **column
  spec**: an ordered list of `{name, field}` where `field` is one of: `title`, a **property key**
  (`due`, `owner`, `cost`), or `{= expr}` (a per-row computed value, reusing the math engine against
  that row's node). Column spec is new state and needs its own OPML attribute (`_qbcols`, JSON,
  serialize+parse in one change per the OPML invariant).
- **Row source.** A new pure core `queryTableRows(expr, cols, root)` extends `queryRows`: same
  tree-walk and match, but per matched node it **projects each column's field** into a cell string.
  `queryRows` today returns `{id, title}` only; `queryTableRows` returns `{rows: [{id, cells:[]}],
  total, truncated}`. This is the single largest net-new surface, and it is a pure, testable core
  (the same discipline as `queryRows`), which is exactly why Phase A is the right first cut.
- **Render.** `buildTableWidget` gets a computed model from `queryTableRows` instead of
  `mtModel(node)`. Cells are **read-only** (`.mt-computed`-style, the existing computed-cell
  treatment), so none of the ownership-inverting edit paths fire. Row-mutation affordances
  (`mtInsertRow`, Tab-to-add, the Row menu) are **suppressed** for a query base. Clicking a row's
  title cell navigates to that point (reuse the query pill's `.node-link` path).
- **Columns.** The Column menu keeps **Insert / Move / Delete / Width / Alignment** (they operate on
  the column spec, not on text), and gains a small **field picker** ("this column shows: Title /
  property... / formula..."). Calculate (aggregates) works, computed read-only over the result set.
- **Doors (P2).** `/querybase` (or `@` menu) creates one with a query prompt; the base menu gains
  "Edit query". A malformed query renders an empty grid with a clear empty state, never a crash
  (the pill's P4 discipline).

Phase A is fully coherent with the architecture: it reuses `buildTableWidget` through the one clean
seam, adds one pure core, invents no new edit path, and stores only query + column spec + widths.

### Phase B: cap, liveness, and stable identity

The pill caps at 10; a base wants the full result set. Uncapped live results need:

- **A sane default cap with a "showing N of M" strip** (the agenda-cell precedent) plus an explicit
  "show all", so a broad query cannot render thousands of rows and freeze the page. This is a real
  performance boundary, called out honestly rather than discovered in production.
- **Stable row identity across renders** (keyed on the matched node id) so focus and scroll survive a
  recompute, reconciled through the existing `mtPatchCells` cell-reuse machinery.

### Phase C (the escalation, only if you want it): write-through cells

The version where a query-base cell edit mutates the **source node's** field. This is the hardest
part and the one that reopens the fence furthest, so it is deliberately last and optional:

- Editing a cell resolves `id -> node -> field` and writes the property (or title, or the source
  markdown for a `{= }` column, which would be read-only). A commit re-runs the query.
- This is powerful (a task table you can edit in place) but it is the piece that most resembles a
  database view, so it should be its own decision after A and B prove the model. **The proposal does
  not ask you to approve Phase C now**, only to note it as the intended ceiling.

---

## 5. What this deliberately does NOT do

To keep the fence honest, the proposal names what stays out even with QP-2 approved:

- **No saved-views database layer.** A query base is one base with one query; it is not a store of
  named, persisted filtered views over a base's own data. That remains parked (roadmap, QP-1).
- **No typed fields / no relations / no other views.** Those bases-direction §4 deferrals stay
  deferred. A query base's columns project existing fields; they do not add a type system, and a
  query base is still a table view, not a board or cards.
- **No cross-base relations.** The freeform philosophy holds; a query base sources from the outline
  via search, not from another base via a relation engine.

So the fence moves by exactly one item: "a base whose rows are sourced from a query" goes above the
line. Everything else in §4 stays below it.

---

## 6. The one open design question for you

**Is a query base a new node type, or a mode of the existing base?**

- **New type (`querybase`):** cleanest separation. The base edit paths (`mtCommit`, row ops) never
  touch it because dispatch branches on the type; no risk of a text-write path firing on a computed
  grid. Cost: a second base-like type in the model, the type-switcher guards, and the OPML round-trip
  all need the new type.
- **A mode of `base`** (a `node.query` presence flag flips it into query mode): reuses the base's
  type, menu, and zoom-to-go-large behavior for free; a query base *is* a base, just sourced
  differently, which matches the object/view framing. Cost: every base edit path must check "am I a
  query base?" and bail, which is more scattered guards but less new surface.

My recommendation is **a mode of `base`**, because the object/view doctrine says a query base is a
base (a data object) showing a table view; the only difference is where its rows come from. The
guard-scattering cost is real but bounded (the map lists the exact ~5 functions that assume row
ownership), and it keeps "a base is a base" true, which the doctrine values. But this is the load-
bearing choice and it is yours.

---

## 7. Build sequence and cost, if approved

1. **Move the fence:** one edit to `bases-direction.md` §4 (query-sourced base above the line, with
   the "not a views DB" boundary restated), plus the QP-2 register entry flipped from planned to in-
   progress. This is the sign-off artifact.
2. **Phase A, PR 1:** the pure `queryTableRows` core + its pins (project title / prop / formula per
   row; cap+total; empty query), then the model-synthesis seam in `buildTableWidget`, read-only
   render, suppressed row ops, the column field-picker, `/querybase` door, `_qbcols` OPML round-trip.
   The bulk of the value, fully testable, no new edit path. Medium.
3. **Phase B, PR 2:** the cap + "showing N of M" + show-all, and render-stable row identity. Small-
   to-medium.
4. **Phase C, PR 3 (optional, separate decision):** write-through cell edits to source nodes. Its own
   proposal when the time comes.

Phase A is the real deliverable and the honest scope of "let's build QP-2." B and C are the ceiling,
sequenced so each is a decision you make with a working feature in front of you, not a promise made
up front.

---

## 8. The recommendation

Approve **Phase A as a mode of the existing base**, reopening the fence for exactly the query-sourced-
base item. It is coherent with the doctrine (object/view), reuses the shipped `queryRows` lineage and
the one clean `buildTableWidget` seam, invents one pure core and no new edit path, and stores only the
query and column spec. It is the base-form completion of the query work, and it is small on purpose,
the same way the bases MVP was.

If you would rather I adjust the shape (new type instead of mode, a different column-field model, or a
narrower Phase A), say which and I will revise before any code.
