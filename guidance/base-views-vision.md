# Base views: the rich-visualization vision

**Status: VISION / thinking doc, awaiting owner direction.** This reframes and enlarges the QP-2
query-base proposal. It is not a build plan yet; it is the architecture argument for turning bases
into a **view system** (table, kanban, gallery, calendar, list) under the single-file / no-backend /
plain-text-truth constraints. Read alongside `bases-direction.md` (the locked doctrine, which already
reserves the view-switcher strip and names views/typed-fields as deferred) and
`query-base-proposal.md` (QP-2, now understood as one axis of this larger picture).

---

## 1. The reframing: two orthogonal axes, not one feature

The QP-2 proposal framed "bases as queries" as the next step. That was aiming too small. The real
picture has **two independent axes** that the base doctrine's object/view split already implies:

- **Axis 1, the row source (the data object).** Where do the rows come from?
  - **Authored:** hand-entered rows (today's base).
  - **Query-sourced:** rows produced by a search over the outline (QP-2).
- **Axis 2, the view (the display).** How are the rows shown?
  - **Table** (today's only view), **kanban**, **gallery**, **calendar**, **list**.

These **multiply, they do not stack.** An authored base can be shown as kanban. A query base can be
shown as a gallery. Any row source composes with any view, because the doctrine already separates the
*object* (a base, the data) from the *view* (how it renders). The reserved `.mt-base-views` header
strip and §2's "when future views arrive (cards, board, list), table view becomes one named view" were
laid down for exactly this.

So the endgame is not "query bases." It is: **a base is a data object; a view is a lens; the base
carries a small view config; the switcher picks the lens.** Query-sourcing is one way to fill the
object; the views are how you look at it.

---

## 2. The keystone the deferred list hid: rich views REQUIRE field roles

Here is the insight that reshapes everything. Kanban, gallery, and calendar are **not** alternate
renderings of an untyped grid. They need semantics a grid cell does not carry:

- **Kanban** needs to know *which column is the group/status field* (it becomes the lanes) and how to
  *move a card between lanes* (drag writes that field).
- **Gallery** needs *which field is the cover/image* and *which is the title*.
- **Calendar** needs *which field is the date*.
- **List** is the soft case (it can fall back to title + a subtitle field).

Today a base cell is an **untyped string** (`model.rows[r][c]`, plain text in `node.text`; the only
per-column metadata is alignment and width). You cannot build kanban on top of that without first
answering "which field are the lanes," and **that answer is a lightweight role/type on a column.**

This is why `bases-direction.md` §4 deferred **views AND typed fields** together. They are not two
independent deferrals; they are **one feature wearing two names.** You cannot ship the rich views
without a minimal field-role concept, and a field-role concept is only worth building because the rich
views need it. **Field roles are the keystone**, and the honest version of "add kanban/gallery" starts
there.

Crucially, this stays inside the freeform philosophy (§3). A **role is optional and user-assigned**,
not a forced schema. A column with no role is a plain string column, exactly like today. You only tag
"this column is the status" when you want a kanban lane out of it. No mandatory title column, no lock-
in, no "every base is a list of pages." The role is a hint the views read, not a type system the data
must obey.

---

## 3. Why the single-file / no-backend constraint does NOT block this

Notion's richness comes from a server: it runs queries in a database and stores view configs in
tables. We have neither, and we do not need them, because every ingredient of a rich view is a
client-side operation we can already do or add cheaply:

| Rich-view ingredient | How it works here | Cost |
|---|---|---|
| Group rows by a field value (kanban lanes, calendar days) | pure array reduce over the row model | trivial, a pure core |
| Render a card / gallery tile | reuse the existing `mtInline` cell renderer inside a `<div>` card instead of a `<td>` | small, the renderer is already field-agnostic |
| Move a card between lanes | write the group field on that row (authored: a cell in `node.text`; query: the source node's property) | reuses the base edit path / QP-2 write-through |
| A cover image in a gallery | a cell holding an image markdown / URL, rendered via the existing `md-img` support | already exists |
| Which view + which field is group/cover/date | a tiny JSON view-config sidecar on the base node, `_view` OPML attribute | small, same mechanism as `_colw` |
| The view switcher UI | the reserved `.mt-base-views` strip, already held empty for this | already reserved |

Nothing here needs async, a framework, rich inline state, or a second file. The rendering stays
synchronous (a view is a pure function of the row model + the view config), which honors the
`mdToHtml`-is-synchronous invariant. The data stays plain-text-backed: authored cells stay in
`node.text`; the view config and field roles ride the node as underscore-prefixed OPML attributes,
exactly like the artifact sidecars and `colW` do.

**The one thing the constraint genuinely limits** is scale: a client-side group-and-render over a
large query result has no server pagination. That is the same cap/liveness boundary QP-2 Phase B
already names, and it is honest to say a 5000-card kanban is not the target. The target is the human-
scale board, and that is comfortably in reach.

---

## 3a. The load-bearing law: a base is always text that must render

Before the type catalogue, the rule everything below obeys, stated plainly:

> **A base is text.** Whether authored (a pipe table you typed) or query-sourced, the base is
> ultimately GFM pipe-table markdown in `node.text` (plus underscore-OPML sidecars, which are just
> serialized strings). A "column type" does **not** store a typed value anywhere. It is a **(parse,
> render, write-back) triple over a cell's text**: parse the cell string, render it richly, and any
> editor affordance writes plain text back into that same cell. **Nothing exists that cannot be
> reconstructed from the text and its sidecars.** If a visualization cannot round-trip through a
> copy-paste of the markdown, it does not exist.

This is why type roles and view config live in **sidecar attributes** (`_colrole`, `_view`), not in
`node.text`: they are pure view state with no markdown representation, exactly like column widths
already ride `_colw` and never the text. Formulas are the one thing that MUST stay in the text (the
`#+TBLFM:` line), because that is how `computeTable` finds and recomputes them and how a pasted table
recomputes elsewhere. So the split is: **content and formulas in the text (they must be, to
render/compute); type roles and view config in sidecars (pure view state, kept out so the markdown
stays clean and portable).** "Copy as markdown" keeps producing a clean GFM table; the roles and views
are a lens the renderer applies, never a schema the data obeys.

A role is therefore always **optional and non-destructive.** A column with no role is a plain text
column, exactly like today. This preserves the freeform philosophy: no forced schema, no mandatory
title column, no lock-in. You tag "this column is a date" only when you want the chip and the picker;
the cell is still `2026-06-13` in the markdown either way.

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

## 3c. The picker: rich type set, no overwhelm

A twenty-entry type list shown as a flat menu at column creation is exactly the barrage to avoid. The
design keeps the richness reachable without ever confronting the user with all of it:

1. **Never force a type at creation.** A new column is always plain **Text**, zero friction, the
   default today. Type is an *optional enrichment* from the Column menu ("Format as..."), reached when
   the user wants a view feature, never demanded up front. This inverts the Notion/Airtable "pick a
   type first" model and matches the freeform philosophy: a role is a hint you add, not a schema you
   satisfy.

2. **Contextual promotion.** When the picker opens, it reads the column's current values and floats
   the types that fit to the top. A column full of `2026-06-13`-shaped strings promotes **Date** as
   the first option; a column of `#tags` promotes **Tags**; a column of numbers promotes **Number**
   and **Currency**. The obvious conversion is the first thing you see, not buried at position nine.
   (This reuses `parseDueDate` and the existing value sniffers, so "does this column look like dates"
   is a pure check we already have.)

3. **Grouped by family, collapsible.** The full list is the seven families above (Text, Number, Date,
   Choice, Link/Media, Generative, Row-meta), each a small group header. The surface is seven headers,
   not twenty rows; you expand the family you want. A search box filters by name for power users.

4. **Applicability, not a wall.** A type whose values cannot coerce is de-emphasized (an "Image" type
   over a column of integers is grayed with a "convert anyway" escape hatch), never hidden entirely,
   so nothing is lost but the relevant choices lead. This respects the freeform philosophy (you can
   always force it) while keeping the default view sane.

The net effect: a beginner sees "Text" and never touches the picker; someone building a board opens
the Column menu on their status column, sees **Select** promoted at the top of the Choice family
because the values look like keywords, and turns it into lanes. The richness is deep but the entry
point is one obvious click.

---

## 4. The data model, made concrete

A base gains two small pieces of optional state, both view config, neither touching `node.text`:

1. **Column roles** (`node.colRole`, `_colrole` OPML, index-aligned with columns like `colW`): an
   optional per-column role from a **small closed set**: `title`, `status` (a select/group field),
   `date`, `image`, `number`, or none (a plain string column, the default). A role is a *hint*, not a
   storage type: the cell is still a string in `node.text`; the role tells views how to treat it and
   optionally constrains the editor (a `status` cell offers its known values; a `date` cell offers the
   date picker). This is the minimal "typed fields" the deferred list named, scoped to what views need
   and no more.

2. **View config** (`node.view`, `_view` OPML): `{ kind, groupBy, coverBy, dateBy, ... }` where `kind`
   is `table | kanban | gallery | calendar | list` and the `*By` fields name which column plays each
   role for this view. A base with no `view` config renders as table (today's behavior, unchanged).

For a **query base**, add the QP-2 pieces: the query expr and the column-to-field projection. The row
model is computed by `queryTableRows` instead of decoded from `node.text`, but downstream, a view is a
pure function of `{ rows, roles, viewConfig }` regardless of whether the base is authored or query-
sourced. **That is the payoff of separating the axes:** the view layer never asks where the rows came
from.

---

## 5. The views, sketched

Each view is a pure function `(rowModel, roles, viewConfig) -> DOM`, dispatched by the switcher, all
reusing `mtInline` for cell content:

- **Table** (shipped): the grid. The default and the fallback.
- **Kanban:** group rows by the `status` column into lanes; each row a card showing title + a few
  fields; drag a card to another lane writes the status field. The single richest view and the one
  that most needs a role (`status`).
- **Gallery:** a responsive card grid; each card shows the `image` cover, the `title`, and a couple of
  fields. Needs `image` + `title` roles.
- **Calendar:** place rows on days by the `date` column (reuses the existing `calendarMonthGrid` /
  agenda month machinery). Needs `date`.
- **List:** the soft view, title + subtitle, no roles strictly required; a good "zero-config" first
  extra view.

Every view degrades gracefully: no `status` role set → kanban shows a "pick a group field" empty
state (P4, never a crash), never a silent misgroup.

---

## 6. How this relates to QP-2, and the revised sequencing

QP-2 (query bases) is **one axis, not the whole feature.** The larger arc, if you want the endgame:

1. **Field roles (the keystone).** Add the optional `title/status/date/image/number` column role, the
   `_colrole` round-trip, and the role picker in the Column menu. Ships on authored bases first (a
   role is useful even in table view: a `status` cell offers its values, a `date` cell offers the
   picker). This is the "typed fields" deferral, scoped minimally. **This is the real first build**,
   because every rich view depends on it.
2. **The view system + list/gallery.** The `_view` config, the switcher in the reserved strip, a pure
   view-dispatch layer, and the two easiest views (list = zero-config, gallery = title+image+cover).
   Proves the view architecture with the low-semantic views.
3. **Kanban.** The richest view: lane grouping by `status`, card drag-to-move writing the field. Built
   once the role + view infrastructure exists.
4. **Calendar.** Reuses the agenda month grid; date-role grouping.
5. **Query bases (QP-2), composed in.** Because a view is source-agnostic, query bases get every view
   for free once the axes are separated; QP-2's own work is just the row source + column projection +
   the read-only/write-through decision. It can land before or after the views; the cleanest order is
   **roles → views → query-source**, so query bases arrive into a world that already has kanban and
   gallery.

Each is a normal PR with its own conformance gate. This is a multi-PR arc, deliberately, the same way
the bases MVP was.

---

## 7. What stays out of scope, even with all of this

The fence still holds against the scope-eating version:

- **No saved-views database.** A base carries *one* view config at a time (or a small switchable set,
  a later decision), not a store of named persisted filtered views as a data model. The switcher flips
  the lens; it does not manage a library of saved queries.
- **No relation engine.** Bases source from the outline (authored cells or a query over points), never
  from another base via relations. The freeform philosophy holds: no "every base is a list of linked
  pages."
- **No full type system.** Field roles are a small closed set of *view hints* (title/status/date/
  image/number), not a schema the data must validate against. A cell is always still a string in the
  text; the role only shapes how views read and how the editor helps.
- **No async / no second file / no framework.** Every view is a synchronous pure function of the row
  model; all new state rides the node as OPML attributes.

So the doctrine's §4 moves by exactly the coupled pair it always implied: **views + minimal field
roles go above the line together** (they are one feature), and query-sourcing (QP-2) is the third,
independent item. Filters-as-a-database, relations, and a real type system stay below.

---

## 8. The recommendation

Treat this, not QP-2 alone, as the direction. The endgame is **a base view system**, and its keystone
is **optional field roles**, because kanban/gallery/calendar are impossible without knowing which field
is the group/cover/date, and that knowledge is a lightweight role. The single-file constraint does not
block any of it; grouping and card layout are trivial client-side, and all new state fits the existing
OPML-sidecar pattern.

The honest first build is **field roles on authored bases** (useful on its own, the substrate for
everything after), then **the view system with list + gallery**, then **kanban**, then **calendar**,
with **query bases composing in** because a view is source-agnostic by construction.

Two decisions are yours before any of it:
1. **Approve the enlarged direction** (base view system + minimal field roles), which reopens the
   `bases-direction.md` §4 fence for the coupled views-plus-roles pair, restated with the boundaries in
   §7 above.
2. **Confirm the sequencing** (roles first, then views, then query-source), or redirect it.

If the direction is right, the next artifact is a build proposal for step 1 (field roles), the same
shape as the QP-2 proposal but scoped to the keystone. If you want a different shape (views before
roles, kanban first as a vertical slice, query-source first), say so and I will re-sequence.
