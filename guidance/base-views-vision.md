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
