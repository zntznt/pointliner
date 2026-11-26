# Table view of a list: proposal

**Status: slice 1 SHIPPED (2026-11-26); slices 2 and 3 within doctrine, not built; slice 4 needs an
owner decision.** Read alongside `bases-direction.md` (binding), `base-views-vision.md` §0 and §3b,
`query-base-proposal.md`, `saved-views-proposal.md` (§0.6, the saved-views line is drawn by kind),
`ux-discipline.md` (P5, the UXP-20 syntax guard) and issue #866 (the substrate test).

The question: a user has ordinary points with properties, for example

```
## Crops
  Kale {prop beds: 4} {prop yield: 30}
  Chard {prop beds: 2} {prop yield: 12}
  Beans {prop beds: 3} {prop yield: 20}
```

What does it take for them to SEE that as a table, sort it and edit it, without learning syntax?
Panel #7 (Tomasz, the CSA farm; #1330) and the 2026-08 panel (Dax, the GM; #1334) both wanted a
column view of data they had already typed and could not find one. `/base` exists; nobody reached it
from their own list, because `/base` makes an EMPTY grid.

---

## 1. The measured wall (repro)

Driven headless (Chromium, real keystrokes) on `main` at `7023de5`. A fresh document; click the first
point; type `## Crops`, Enter, Tab, then the three rows above (Enter between them), Escape.

| Door a cold user tries | What it offers for this list |
|---|---|
| The `## Crops` row's doors | `+ Add`, `+ Total beds`, `+ Total yield`, `+ Check`, `+ Variance`. Nothing shows the rows as a table. |
| The `## Crops` bullet menu (Shift+F10) | 27 items. The only table-shaped one is **Export table to CSV**, which leaves the app. |
| `/table` in the command builder | Base, Roll table, Roll on your document, Table, ... `Base` makes an empty 3x3 grid (`Column 1`, `Column 2`, `Column 3`); `Table` inserts an empty pipe table. Neither reads the list. |
| `/grid`, `/spreadsheet`, `/view` | `Base` (empty grid) only. |
| `/columns` | `Query base`, which opens a dialog asking for a search and a column spec. |
| Concept guide, search `table` | "Tables & bases: which one?" is the 7th hit, after Start here, Moving and nesting points, Zoom into a point, Point types, Definition lists, Image size. |
| Concept guide, search `grid` | Base views, Query bases. |

**The only path that works today** is the query base, and it needs four pieces of knowledge, none of
them on screen at the list:

1. that a query base exists and is how you see existing points as a table (its name says "query");
2. a search that picks THESE rows: `has:beds` works (`Crops`, `#crops` do not: the heading is not
   tagged, and a text term matches the heading itself);
3. the column mini-language, one per line: `Name: title`, `beds`, `yield`;
4. that `has:beds` searches the WHOLE document, so a second list that also tracks `beds` (last
   year's crops, a seed order) silently joins this table. No search operator scopes to "the points
   under this one": `parseSearchQuery` has no subtree or parent term, and `#tag` inheritance needs
   the heading to carry a tag the user never wrote.

Seeing it: four steps of syntax. Sorting it: the query editor's sort field takes typed text
(`beds desc`). Editing it: already works once it exists (QP-2 Phase C writes a property cell back to
the point, announced and undoable).

**Sibling defect found on the way (#1671, not fixed here):** `sectionToCsvRows`, the
Export table to CSV core, collects every property key, so the export carries `created` and `edited`
columns the user never typed. `inferRowShape` already skips these via `SHAPE_SKIP_KEYS`; the CSV
sibling does not.

---

## 2. The machinery that already exists

Everything needed to SHOW, SORT and EDIT a list as a grid is shipped. What is missing is the door
and a way to name "these rows" without a search.

| Need | Existing machinery | Function names |
|---|---|---|
| Recognize a list of same-shaped rows and its columns | Row-shape inference behind the `+ Add` / `+ Total` doors | `inferRowShape`, `dataPropKeys`, `SHAPE_SKIP_KEYS`, `inferPropType` |
| A door on such a list, in the row AND the zoomed/top-level view | The door family, one builder for both placements | `maybeAddRowAffordance`, `renderViewDoors`, `viewDoorHost`, `refreshRowChrome` |
| A grid whose rows are foreign points, not copied data | Query base (QP-2 A, B, C) | `queryTableRows`, `qbaseModel` (memoized per `_varsVer` + config), `isQueryBase`, `qbaseColList` |
| Create one non-destructively | `qbaseCreateAt`, the `/querybase` door, `openQBaseDialog`, `editQBase`, `parseQBaseCols` |
| Column roles without a menu | `qbaseColRoles` (`due`/`start` are dates, `= expr` is a number), read through `mtColRoles` |
| Edit a cell and write it to the point | Phase C write-through: `qbaseFieldWritable`, `propWriteRoute`, `setProp` / `setDateProp`, `pushUndo` per commit, the membership flash |
| Stable rows across a rebuild | `qids`, `data-nid` on each `<tr>`, `refreshTable` refocus |
| Sort | SV-2 config sort `qbase.sort` (`parseQBaseSort`, `mtSortOrder`), the strip's `by X ↑` tell |
| Board, Cards, Calendar views of the same rows | `mtViewSwitcherHtml`, BV-1..3 (query boards read-only) |
| Leave the table | Convert to text (`convertBaseToText`, freezes the projection), Copy as Markdown, Delete |
| Scope vocabulary for "the rows of this list" | `children` = depth 1 in the shared depth scope (`resolveScopeDepth`, UXP-159); `sum(cost)` on a heading is already child-scoped |
| Persist config with no new OPML surface | the `_qbase` JSON attribute (`showAll` and `sort` already ride it) |

---

## 3. Slices, smallest first

Every slice is checked against: the doctrine fences (`bases-direction.md` §3, §4, §6, §7c), P5 (no
new top-level syntax, UXP-20), #866 (the substrate test) and the saved-views line
(`base-views-vision.md` §0.6).

### Slice 1: a `+ Table view` door on a list, showing its own points (SHIPPED)

**What.** On a list that earns the row doors AND has at least one property column, a `+ Table view`
door sits beside `+ Add`. One click inserts a query base as the list's FIRST point (the "total on
top, list beneath" shape every starter uses), with:

- `qbase.scope = 'siblings'`: its rows are the points beside it in the same list, and only those;
- an empty search (every point in the list), so no query is written;
- columns from the inferred shape: `Name` (the point's title, clickable) plus one column per
  property key, in the list's order.

The keyboard door is the point menu (the `+` doors are `tabindex=-1`, the reason `+ Add` has
`/addrow`): **Show list as table view**, offered on the list's heading AND on any point in it
(`tableViewListFor`), so a list at the top of a document, whose root has no bullet, is reachable too.
The door's accessible name uses the same words (`Show list as table view: Crops`, P1).

The grid then sorts (the existing SV-2 sort) and edits (Phase C write-through) with no new code on
those paths. The strip names the source in words ("Points in Crops") instead of a search string. The
query editor keeps the scope as a checkbox ("Only the points in this list") so a user can widen it
to a real search, or narrow it with one (`beds:>2` within the list).

**Why relative, not an id.** The scope names the base's own parent, so duplicating the section,
stamping it from a template, or moving it keeps the table pointed at its own list. A stored node id
would keep pointing at the original.

**Fences.**
- *Doctrine:* query-sourced rows are above the line (§4, QP-2 A-C shipped). This narrows WHICH
  points a query base reads; it adds no predicate over a base's own rows (there are none), no view
  library, no typed field. The children stay ordinary points: nothing is converted into a base, so
  §6's "nothing turns into a base except `/base` and the promote" holds. The scope rides inside the
  existing `_qbase` JSON (the `showAll` / `sort` precedent), so it is not a new per-base node field
  and does not fire §7c's consolidation trigger.
- *P5:* no syntax at all. The door writes the config; the only text a user could ever see is the
  existing query editor's, now with a checkbox. The depth vocabulary it reuses (`children`) is the
  existing one.
- *#866:* passes. The instrument is general (any list of points with properties: crops, hives, NPCs,
  invoices); nothing encodes one domain's shape.
- *Saved-views line (§0.6):* untouched. The base persists a SOURCE (where its rows come from), not
  a filter over rows it owns, and there is still one config per base, never a library.

**Verdict: within doctrine, no owner call needed.**

### Slice 2: sort by clicking a query base's column header (not built)

**What.** A query base's read-only headers render no Column menu, so sorting means typing
`beds desc` in the editor. Clicking (and Enter on) a header would cycle ascending, descending,
document order, writing the same `qbase.sort` SV-2 already persists and the strip already shows.

**Fences.** SV-2 (persisted sort on query bases) is owner-approved; this is a second door onto the
same config, not a new capability. No syntax (P5), no predicate (§0.6), general (#866). The caret
invariant applies (mousedown + preventDefault, a keyboard path alongside, P3-3), and the header
needs a sort state announced (`aria-sort`).

**Verdict: within doctrine, no owner call needed.**

### Slice 3: choose columns by ticking, not by typing lines (not built)

**What.** The query editor's columns field is a textarea mini-language (`Name: field`, one per
line). For a list-scoped base, offer the list's property keys as checkboxes (from `inferRowShape`
plus any sparse key `dataPropKeys` sees), with the textarea kept for formulas.

**Fences.** Same column spec, same storage; a picker is a front door onto an existing field (P2),
no new syntax (P5). Formula columns stay text, which is where the math grammar already lives.

**Verdict: within doctrine, no owner call needed.**

### Slice 4: add, reorder and retitle rows from the table (needs an owner decision)

**What.** A list-scoped query base is the one query base where "add a row" has an unambiguous
meaning (a new point at the end of the list, with the shape's properties), and where reordering rows
maps to reordering points. Titles would write `node.text`.

**Fences.** Two recorded lines are in the way. `query-base-proposal.md` §3 suppresses row ops on a
query base ("hand-adding or reordering a row is meaningless" for a result set), and Phase C writes
properties only, never `node.text` ("a point owns its own text"). Both were written for
document-wide search results, where they are right. A list-scoped base is different in kind, but
lifting either line is the owner's call, not a build detail.

**Verdict: needs owner decision:** *"May a list-scoped query base (rows = the points of its own list)
create new points at the end of that list, move points within it, and write a point's title from its
Name cell? Or do rows stay owned by the outline, with `+ Add` on the list as the only way to grow it?"*

---

**Found and fixed on the way (layout sweep).** On `main` a list's door run (`+ Add` ... `+ Variance`)
already ran off a 320px and a 375px screen and gave the page a sideways scroll; a sixth door made it
worse. A row carrying doors now wraps them below its text (`.node-row:has(>.addrow-affordance)`), the
wrap the view bar already had. And the query strip's text could not ellipsize (its flex parent had no
`min-width:0`), so a long list title widened the page. Both are driven at 320px in `tests/browser.mjs`.

**Pure cores:** `queryTableRows(..., scope)`, `listTableSpec`, `tableViewListFor`, `qbaseSourceText`.
**Census:** every `qbase.*` config field must be written back by `editQBase` (it had to remember
`showAll` and `sort` by hand; `scope` would have been the third silent drop).

## 4. What slice 1 does not do

- No new search operator. A `parent:` or `under:` term would be new search vocabulary under the
  UXP-20 decision ("operators over the existing vocabulary"), and the door does not need one.
- No door on a list with no property column (a table of titles alone is the outline itself, the
  same reason the `list` view stays deferred in §4).
- No second door when the list already has its table view.
- Nothing on the top-level document root's text: the base is inserted as a point, so the #1658
  "write into the invisible root" trap does not apply, and the door works at the top level too.
