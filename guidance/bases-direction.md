# Pointliner — Markdown-First & Bases (Direction)

## A locked direction and scope fence

This document is the **north star** for how Pointliner handles structured data — tables and **Bases** — and the markdown-first rendering principle underneath them. It is **binding direction**: future work (and any AI) MUST build toward this model and MUST NOT re-introduce the patterns it retires. It is also a **scope fence** — it names an ambitious vision *and* the hard line of what we build now vs. later, so "Bases" can't quietly expand to eat the roadmap.

Read alongside: `ux-discipline.md` (the binding UX standard — vocabulary + principles this feeds into), `roadmap.md` (sequencing), `ux-remediation.md` (the tracked gaps this closes).

**Pre-release note:** there is no released data, so **migration is explicitly a non-concern.** We build the clean model directly.

---

## 1. The markdown-first principle (north star)

> **Any markdown construct renders in any point.** Markdown is Pointliner's universal substrate: headings, quotes, lists, code, dividers, and **tables** all render wherever they're written, regardless of a point's type. Nothing requires a special node type just to *display*.

`mdToHtml` already honors this for everything except tables — they were the lone exception, rendered only when a point was the special `type === 'table'`. That exception is the thing this direction removes.

- **MUST:** a pipe table written in *any* point renders (read-only, static) via `mdToHtml`, the same way a `#` renders a heading.
- **MUST NOT:** add new special-case render paths that make a markdown construct depend on a node type to appear. If a construct is markdown, it renders from the markdown.
- **Exception:** no markdown table renders *inside* a table cell (cells are single-line; nested tables are out).

**The markdown-first node model (binding).** Only **`paragraph`** and **`base`** are special node types — paragraph for its Enter-behavior inversion, base for its structured grid object. **Everything else** — headings, quotes, code, lists, dividers, and **to-dos** — renders from the markdown in `node.text` via `mdToHtml`. `node.type` may remain a **derived hint** computed from the text (`deriveTypeFromText`) for bullet-dimming, the type-switcher, and OPML round-trip, but it is **not** the source of truth and **not** the renderer. To-dos conform since the UXP-24 fix: to-do-ness derives from the text (a `- [ ]` task marker or an Org `TODO|NEXT|WAITING|DONE` keyword), the checkbox/badge renders from that text, and the `/todo`–`/state:` commands and Enter-continuation are **helpers that write the markdown** — never type-setters. Slash commands format the whole node's markdown; pressing Enter inside a formatted node continues the format on the next node by writing its prefix (`- [ ] `, the keyword, `> `). The remaining type-driven stragglers (`ol` ordinals, `divider`, whole-node italic/underline flags) are tracked as UXP-25…27.

---

## 2. A base and its views — the object/view split

A **base** is a structured data object that lives in its own dedicated point. The **table view** is the base's default view — the interactive grid you see and edit — and since BV-1…3 (2026-07) it is one of four: **Table, Board, Cards, Calendar**. A **static markdown table** written inline in any point is a separate, independent thing: the portable, read-only rendered form of pipe-table markdown, not a view of a base.

This naming matters: "table" is a display form (and a markdown primitive); "base" is the data object. The views proved the split: "table view" is one named view of a base rather than the thing itself — the naming held.

| | **Table** (static) | **Base** (dynamic) |
|---|---|---|
| What it is | plain markdown (`\| a \| b \|`), rendered read-only | a structured data object displayed in table view |
| Lives | inline, in **any** point | its own dedicated point |
| How you get it | type markdown anywhere · `@table` inserts one | `/base` creates one |
| Powers | renders; computes & shows `#+TBLFM` values read-only | editing, Calculate, the Column menu, formulas — and, later, more views |
| Role | the portable, universal form | the "give this data more love" upgrade |

**Vocabulary is locked (see §8):** they are **"table"** and **"base."** Not "markdown table," "dynamic table," "grid," or "widget."

---

## 3. The freeform-bases philosophy (the differentiator + the fence)

> A **base is a freeform scaffold, not an opinionated database.** The user creates and owns their own columns. There is **no mandatory first "link/title" column, no forced schema, no lock-in.** Linking is *available* (a column may hold links — the functionality already exists in basic form) but never imposed. Bases exist to give data that needs more than prose or a static table a richer way to be **visualized and worked with — on the user's terms.**

This deliberately diverges from Notion/Obsidian (whose bases anchor on links to other entries). Here, a base is a blank, user-defined scaffold. This single philosophy rules out a large amount of scope creep by design: **no relation engine, no forced templates, no "every base is a list of pages."**

---

## 4. Scope fence — MVP vs deferred

**MVP ("base" = today's interactive table, elevated):**
- Renamed to **base**, with the **table view only**.
- A **base header bar** (whole-base operations).
- **Freeform, user-defined columns** (the Column menu / Calculate work from UXP-3 carries over).
- The conversions in §6.
- **Query-sourced rows (QP-2 Phase A) — moved above the line 2026-07-02 (owner call).** A base whose
  rows come from a search over the outline, **read-only in v1**: the query and column projections are
  the base's config; the rows recompute from the live document (memoized per generation, capped). Full
  design + the red-team corrections it must honor: `query-base-proposal.md` and
  `base-views-vision.md` §0. **Phase B shipped 2026-07-16 (owner call: work the below-the-line
  items):** the default cap (`QBASE_ROW_CAP` 100) gains an explicit, persisted opt-out — the strip's
  "Show all N" / "Cap at 100" toggle (`qbase.showAll`, riding the `_qbase` JSON; the query editor
  preserves it) — and **row identity**: `qbaseModel` carries the matched node id per row (`qids`),
  each `<tr>` is stamped `data-nid`, and `refreshTable` restores focus to the SAME source row after
  a rebuild (result order may shift, so it re-finds by id). **Phase C shipped 2026-07-16 (same owner
  call):** a query base's plain-PROPERTY cells write through to the source point —
  `qbaseFieldWritable` (a field that is not `title` and not a `=` formula) marks the cell
  editable (`.mt-qcell`, an explaining `title`), focusin swaps the role chip for the raw value,
  and blur resolves `tr.data-nid → nodeById → setProp` — never `node.text` (a point owns its own
  text). The §0.4 footguns are answered head-on: every commit is ANNOUNCED (a flash naming the
  field and the point, including when the edit makes the row leave the query — the membership
  check against the recomputed `qids`), and undo-LOCAL (`pushUndo` per commit, one Ctrl/Cmd+Z
  restores the foreign point). Enter/Shift+Enter/Tab mirror the authored-cell grammar (P1); the
  repaint rides the deferred, focus-aware `scheduleVarBaseRender`. Query boards/cards stay
  read-only (no status projection exists to drag, and views paint through the same read-only
  branches). This move leaves ONLY the saved-views database layer (filter/sort predicates
  persisted as data operations, named view libraries) BELOW the line. Views + typed fields also remain deferred here until their own build
  proposal is approved; the approved *direction* for them is `base-views-vision.md` §0b (views in
  service of the generative layer).

- **Field roles, minimal + generative-first (FR-1) — moved above the line 2026-07-02 (owner call,
  the base-views-vision §0b sequence).** An optional per-column DISPLAY role from a small closed
  set: `status` (a known state keyword renders as its colored chip, sequence-aware), `date` (a
  date-shaped value renders as an urgency chip), `number` (right-aligned, formatted). Honest per
  base-views-vision §0.5: this IS the minimal slice of the "typed fields" deferral, scoped to
  display hints over the untouched cell string (the §3a text-is-truth law; a non-conforming value
  falls through to the plain render, never an error). Rides `node.colRole` + `_colrole`, index-
  aligned like `colW`. **Query bases infer their roles instead (bases round 1, 2026-07-16):**
  read-only headers never render the Column menu, so `colRole` was unreachable there and
  Board/Calendar stayed permanently gated. `qbaseColRoles` derives the array from the projection
  (a `due`/`start` field → `date`, a `= expr` field → `number`; no status projection exists, so
  Board correctly stays gated on query bases) and `mtColRoles(node)` is the ONE accessor every
  colRole READ site consults (cell paint, view switcher, view gates, number right-align); write
  sites stay authored-only. **Per-role editors shipped 2026-07-16 (owner call: the
  below-the-line pass):** while a Date or Status cell is focused, a popover under the cell offers
  the value — the Schedule dialog's calendar (`buildDatePicker`) for a date, the owning sequence's
  state chips for a status (`showCellEditorPop`; picks act on mousedown + preventDefault so the
  cell keeps focus, write into the cell, and commit through the cell's own path — authored via the
  'input' commit, query via the Phase C blur write-through). Typing stays primary: the popover is
  an affordance, never a gate or a validator. Keyboard doors: the cell context menu gains "Set to"
  (states, through the one `mtSetCellValue` writer) and "Pick a date (calendar)…"; a query date
  cell (no context menu — its column ops are authored-only) enters the grid on the same
  Shift+F10 key. **Still below the line:** image/title roles and any validation.

  **Per-column number format shipped (ε, 2026-07-24).** A Number column can format as
  money/measure/percent, not only group thousands: `node.colFmt` (OPML `_colfmt`) holds a
  `parseNumFmt` record `{decimals?,prefix?,suffix?}|null` per column, index-aligned beside
  `colW`/`colRole` (spliced at every column op, dropped-when-all-null, deep-cloned, torn down on
  Convert to text). It reuses the `{= }` math pill's own `parseNumFmt`/`formatNumDisplay` cores —
  no new format engine — via `mtSetColFmt` and a "Number format…" item in the Column menu's Show as
  section (shown for a Number column, `openColFmtDialog` with the three math-pill fields). Applies to
  the cells AND the Calculate footer total; display-only over the untouched cell string (§3a). This
  is the FR-1 `number` role's "formatted" made per-column-configurable, not a typed field — no
  constraint, editor gate, or validation, so the §0.5 fence is untouched.

  **Authored-base role inference (#922, 2026-07-19; agent-review productivity persona).** An
  authored base with no hand-set roles now INFERS status/date columns from its data, so Board and
  Calendar light up without the manual Column-menu trip a database/planner user expects to skip.
  `inferColRolesFromModel(model, hasFooter, states, cal)` (pure): a column is `status` when every
  non-empty data cell is a recognized sequence keyword, `date` when every one `parseDueDate`-parses;
  a mixed/free-text column stays null. **Number is deliberately NOT inferred** — an id/year column
  must never silently reformat — so it remains an explicit choice. `mtColRoles` falls back to the
  memoized `inferredColRoles` (`_mtInferRoleCache`, ver-guarded + text-checked over `mtModelRead`,
  self-invalidated by the `_varsVer` bump like `mtModelRead`) ONLY while `node.colRole` is absent;
  the first explicit `mtSetColRole` SEEDS the array from the current inference so promoting one
  column to explicit mode doesn't drop the others' auto-detected roles, and from then on
  `node.colRole` is returned verbatim (explicit mode; data changes no longer re-infer). The "Show
  as" menu and the Alt+R cycle read the EFFECTIVE role via `mtColRoles`, so they reflect inference.
  This is the **substrate-test-clean** half of #922 (inference over declaration, an overridable
  hint): **schema-first base creation stays OUT** (the #922 panel verdict — un-dim views via
  inference, not a "declare your column types up front" wizard). **The header-defaults half of #922
  shipped alongside it (2026-07-19):** `focusNewBase` now lands the new-base caret on the FIRST
  HEADER cell (r0/c0), not the first data cell (r1/c0), with its "Column 1" placeholder selected
  (mtFocusCell selects contents), so naming the columns is the first action (the spreadsheet/database
  flow) and generic `Column 1/2/3` labels stop leaking into Cards/Board field labels. Row 0 always
  exists, so this is also more robust than the old r1/c0 target (which no-oped on a body-less 1×1
  starter). Not done under the header banner: auto-promoting an already-typed first data row to the
  header, and smarter default names than `Column N` — both would change existing data semantics and
  neither is needed once naming is the first thing you do.

- **The view system + the board view (BV-1) — moved above the line 2026-07-02 (owner call, the
  base-views-vision §0b sequence).** `node.view = {kind, groupBy}` (`_view` OPML; absent = table),
  the switcher in the reserved `.mt-base-views` strip (the zone §5 held for exactly this), and the
  **board**: lanes are the owning sequence's states in declared order (the FR-1 status column is the
  group field), cards are the data rows painted through the role-aware cell renderer. Authored bases
  move cards (the card menu everywhere, drag on desktop) by writing the keyword into the groupBy
  cell (the §3a text-is-truth law); a query base's board renders read-only (write-through stays
  parked, base-views-vision §0.4). **Still below the line:** cards/gallery/list/calendar views.

- **The cards view (BV-2) — moved above the line 2026-07-02 (owner call).** A reading view:
  every data row is a card in a responsive grid, first column the title, the rest its fields,
  painted through the role-aware cell renderer so chips, pills, and images compose (a per-cell
  grammar pill makes a re-rollable generative deck; an image paints as the cover). No group field.
  **No longer read-only (#955, 2026-07-27):** an authored base's cards edit, reorder, add and delete.
  The edit layer is not new — `mtWireCells(host, node)` was extracted from `buildTableWidget` and is
  called by both views, so a card's title and fields are literally grid cells (`.mt-cell` +
  `data-r`/`data-c`) in a different layout. Reorder/add/delete are doors onto `mtMoveRow` /
  `mtInsertRow` / `mtDeleteRow` through a card menu that carries the ROW ops only. A **query base's
  cards stay read-only** — write-through remains parked (base-views-vision §0.4).

- **The calendar view (BV-3) — moved above the line 2026-07-02 (owner call).** The FR-1 date
  column places each row on a compact month grid (the agenda's pure `agendaMonthCells` reused;
  month anchor is session-only view state). Rows without a parseable date surface in a visible
  strip, never silently dropped (P4, the red-team §0 correction honored). Read-only; chips paint
  through the role-aware renderer so a query base's title links navigate.

**Named but DEFERRED (vision, not now — do not build on spec):**
- The **list** view (weak value over the outline itself; build on demand, not on spec).
- **Typed fields beyond the FR-1 display roles** (checkbox/select-with-editor as column *types*,
  validation, per-role editors).
- **Filters / sorts as data operations**, saved views.
- **Relations / rollups** between bases.

> **Rule:** building anything in the deferred list requires reopening this doc and moving it above the line first. The vision is real and protected; the MVP is small on purpose.

---

## 5. Base layout & interaction model

A base in table view is laid out as:

1. **Base header bar** (top) — the **view switcher** strip (`.mt-base-views`), shipped with BV-1: text-only buttons for Table / Board / Cards / Calendar (see §2 and §4). When only one view applies it collapses to nothing; whole-base operations still live on the base's bullet menu (see "The base icon & menu" above), not on a header opener.
2. **Header row** (the column-name row) — **the column-control surface** (see below).
3. **Data rows** — editable cells with keyboard navigation (UXP-2) and read-only computed cells (§7).
4. **Footer total row** — appears when a column has a Calculate aggregate; computed, read-only. It is the **last data row** (no separate construct — `mtApplyAggregate` adds/removes it; detect it via `mtHasFooter` + `@>$N=`), but rendered as a **distinct summary strip**: tagged `.mt-total-row` (tighter height, a subtle top separator, `--cbg` fill — theme-aware), and each aggregated cell shows its **op name** (`aggKindLabel`: Sum/Average/Count/Min/Max, small/muted) beside a **bold value** instead of a generic `Σ`. Non-aggregated columns stay blank; "None" removes the row.

### The base icon & menu — a base is a distinct object, but a normal point

A base is a **normal point in the outline** — same indent, same narrow/full toggle, same navigation as everything else (see "Base width"). The one tell is its **bullet: the `/base` grid icon** (`fa-table-cells`) instead of a dot. The icon behaves like any bullet:

- **Click the icon → zoom into the base** (exactly like clicking any other point's bullet). Zooming in is how you make a base **large** — see "Base width".
- **Hover (desktop) / long-press (touch) → the base menu** (`showBulletPopup`), which is the node menu *minus the type switcher* and *plus* the base ops, in order:
  - **Edit as markdown** — swaps the grid for its raw markdown (`enterEdit`); this is the old `✏ markdown` toggle, now folded into the menu (there is no separate button).
  - **Copy as markdown** · **Copy with TBLFM**
  - **Zoom into** · **Copy link** · **Move up** · **Move down**
  - **Delete** — opens an **in-app confirmation** (`openConfirmDialog`, styled with the app overlay — never a native `confirm()`), since destroying a grid of data is heavier than deleting a line of prose.

The deliberate omission is the **type switcher**: a base has no "turn into heading/bullet/…" row, because a base cannot be converted into another block type (see §6).

### Column-header interaction (the header row cells)

The column name lives in an **editable name pill**; the surrounding header-cell area is the control zone. This resolves edit-vs-menu **spatially**, with no hidden gestures:

- **Click the name pill** → edit the column name inline.
- **Click the header cell *around* the pill** (hover/cursor signal the click target) → open the **Column menu** (Calculate, Alignment, Width, Insert, Move, Delete…).
- **Hold + drag** (around the pill) → reorder the column.
- *(No double-click — the pill is the rename affordance.)*

> **Shipped (Bases PR 2c).** This **supersedes** the earlier `▾`-caret-on-a-handle column-header design. The header cell *is* the affordance. The name pill is also the **row-0 grid cell** (`.mt-cell`), so keyboard cell navigation (UXP-2) reaches it and type-to-overwrite renames in place; the surrounding `.mt-colhead` `<th>` is the menu/reorder zone with the resize grip on its right border. On narrow columns the pill **truncates** (`text-overflow:ellipsis`) and the header keeps a `min-width`, so the around-pill click zone never collapses to nothing.

### Column width (resize)

Columns auto-size by default. A user can pin a column's width:

- **Drag the grip on a column's right border** (`.mt-col-resize`, revealed on hover, `col-resize` cursor) → set the width live; **double-click it** → auto-fit (clear the pin).
- **Column menu → Width** (Fit to content · Narrow · Medium · Wide) → the keyboard/touch door, mirroring how drag-reorder pairs with the menu's *Move*. Fine px control is mouse-drag; the presets cover keyboard + touch (the grip is hidden on touch, where mouse-drag can't fire).

Width is **base view-state, not content**: it lives on the node as `colW` (an array of `px | null`, `null` = auto) and serializes to the underscore-prefixed OPML attribute `_colw` — markdown pipe-tables have no width syntax, so it rides the node like the artifact sidecars, never `node.text`. It is therefore correctly **absent** from *Copy as markdown* / *Copy with TBLFM* (a pasted table elsewhere has no width concept). `colW` is kept index-aligned through insert/delete/move/reorder; an all-`null` array drops back to `undefined`. Cells pin via `box-sizing:border-box` width+min+max so the rendered width equals the stored px. *(Row height is intentionally out of scope — cells are single-line; see the PR discussion.)*

### Menu keyboard access (`click` is mouse-only)

The OS-standard **context-menu-of-the-focused-element** gesture is the single keyboard door (documented in `ux-discipline.md` §3 and the `?` panel):

- **`Shift+F10`** (and the Menu/Application key where present) on a **focused base cell** → the **Column menu** for that cell's column.
- The **base menu** (whole-base ops) is reached from the base's **bullet** — `Shift+F10` on the focused point opens its bullet popup, which for a base carries the whole-base ops. The bullet is a focusable `role="button"` opener.

> **Dropped the `⌘+M` collision (PR 2c).** The earlier plan used `Ctrl/⌘ + M` (Column menu) and `Ctrl/⌘ + Shift + M` (Base menu). `⌘+M` is the macOS "minimize window" system shortcut — a hard collision — so **both chords are dropped** in favor of `Shift+F10`. No dedicated chord remains for either menu.

Inline rename stays reachable by keyboard via UXP-2 navigation + type (the name pill is the row-0 grid cell).

### Base width — normal in the outline, full-width when zoomed in

A base does **not** break out of the column or get any special width in the outline. It behaves **exactly like every other point**: it fills its content column via `.md-table{width:100%}`, follows the **narrow/full-width toggle**, and **indents like everything else** (nesting is shown the ordinary way, no exceptions). A static markdown table behaves the same. There is no `updateBaseWidths`, no row breakout, no per-depth math — the outline stays a clean, uniform outliner.

To make a base **large**, you **zoom into it** (click its grid-icon bullet, like any point). A zoomed-in base is the whole view, so it renders **full-width**: `render()` sets `body.base-zoom` when `focusedId` is a base, and `body.base-zoom #outline{max-width:none}` lets the grid fill the editing area regardless of the toggle. (Normally, zooming into a point shows it as a header; a base instead shows its grid full-width — the "make it large" gesture.)

*(This supersedes every earlier width rule — "ignore nesting, full width always", the row-breakout, the corner-icon-for-square-gutters, all of it. Those turned width into a pile of exceptions and broke the clean outliner navigation. The model now is dead simple: **a base is a normal point; zoom in to go large.**)*

The rationale: dense data needs room, but the outline needs to stay navigable and uniform. Zoom is the existing, well-understood gesture for "focus on this one thing" — so it's also the gesture for "give this base the whole width."

A static table follows the toggle (it is inline prose markup, so it lives in the content column and respects narrow↔full). It stretches to fill that column via the same `.md-table{width:100%}`; it does **not** break out of the column. Neither base nor static table causes a page-level horizontal scrollbar.

---

## 6. Conversions

- **Insert / create:**
  - `@table` → insert a **static table** at the caret.
  - `/base` → create a **base**. **Converting an existing point to a base MUST be non-destructive** — existing text is preserved (kept as its own point, base placed adjacent), never overwritten. *(The current behavior of nuking the point's text is a bug this direction kills.)*
- **Promote (table → base) — ✅ shipped:** "Convert to base" on a static table splits any surrounding content into sibling points — table-in-the-middle becomes point · base · point; table-at-the-end becomes point · base; a point that *is* just the table converts in place. The base then owns its own point. Children stay attached to the node that keeps the original id; the table's `#+TBLFM:` recipe rides along and recomputes in the new base; the whole move is one undo step. **Two doors (P2):** a hover-revealed `▦ base` button at the table's top-right (always visible on touch, a real `<button>` with `aria-label` + a `keydown` Enter/Space path beside its `mousedown`), **and** a **"Convert table to base"** item in the point's **bullet menu** (`showBulletPopup`) — the discoverable menu path, shown whenever the point holds a table, that rides the bullet popup's keyboard plan (UXP-14). Pure cores: `planTablePromote(text, l0, l1)` does the split (the rendered table carries its line range as `data-l0`/`data-l1`; the menu re-derives it with `findFirstTableRange`), and both return `null` / bail with a hint on anything that isn't a valid table block, so a stale or mirrored range never corrupts text. The hover button is suppressed in search results, link mirrors, and the zoomed-title view, where the action can't apply.
- **Export (base → markdown, copy) — never destructive:**
  - **Copy as markdown** — the current rendered values, ready to paste anywhere as a static table.
  - **Copy with TBLFM** — the values plus the `#+TBLFM:` recipe.
- **Demote (base → text, IN PLACE) — ✅ shipped (IA-1, 2026-07-17).** "Convert to text" in the base
  bullet menu (primary) turns the base back into a **static markdown table in the same point**
  (`convertBaseToText`/`baseToStaticText`) — the true inverse of the table→base promote, and the
  `product-identity.md` §3b reversible-structure guarantee made concrete: entering structure is one
  verb, so leaving it must be too. Authored/variable bases keep cells + `#+TBLFM:` (still computes,
  round-trips); a query base freezes its current projection (title cells stay `[[#id]]` links). Frozen
  cell pills survive via the kept sidecars; every base view-state field (`qbase`/`varbase`/`view`/
  `colRole`/`colW`/`baseRows`) drops; the node lands in **display mode** showing the rendered table;
  one undo restores the base. *(This supersedes the former "there is no destructive convert to static;
  a base is not self-destructing" line — reversibility with a single-undo restore IS the safety, and
  §3b outranks the old caution.)*
- **No type conversion to another BLOCK type (base → bullet / heading / quote).** Still true and
  separate from the demote above: a base can't become a *prose line* (its grid doesn't translate), so
  the bullet menu omits the type switcher and `applyBlockCmd` hard-guards it (`node.type === 'base' &&
  id !== 'base' → return`). "Convert to text" is not this — it produces a static markdown TABLE, which
  is exactly where the grid's data does translate. The ways "out" of a base are now **Convert to text**,
  the copy ops, and Delete. Nothing turns *into* a base except `/base` (`createBaseAt`) and the
  static-table promote (`promoteStaticTable`).

---

## 7. Formula behavior (tables and bases alike)

- **Compute on every render.** `computeTable` is pure, so static tables compute their `#+TBLFM` too.
- **Computed cells are read-only**, visually marked, and carry the same "this is computed" warning a base uses — in **both** static tables and bases.
- **The `#+TBLFM:` line is hidden when rendered** (it's the recipe, not content) — for both.
- **TBLFM stays the formula engine for table-view bases now.** It is the backend; it works. A re-evaluation of the data/formula model is a **named future fork** that only opens *if and when* typed fields or other views arrive (§4) — **not** work to do on spec today.

---

## 7b. Variable bases (rows project as document variables)

**Shipped direction (2026-07-16, owner-approved plan; the recorded P5 note lives in `ux-discipline.md` §2).**
An authored base may be marked a **variable base** (`node.varbase = { name? }`, OPML `_varbase`; a query
base never qualifies — rows computed from a live search would make variables appear and disappear).
Column 0 holds item names; every column (including column 0, under its own header) projects each data
row as **dotted document variables**: row "Orc" + column "HP" → `orc.hp`, readable in grammar
(`{Orc.HP}`) and math (`{= Orc.HP + 5}`), chaining through `resolveVarDefs` like any formula variable.
An optional base name namespaces every projection (`monsters.orc.hp` — the prefix replaces the bare form).

- **Projection** is the pure `varBaseDefs(node)` (memoized per generation — `varBaseDefsMemo`, the
  `_varMapAtCache` self-invalidating precedent), consumed at TWO gather hooks: `collectVars`'s walk and
  `collectNodeDecls` (which covers both positional walks — `varMapAt` and `renderPosVarMaps`). A variable
  base is therefore a **declaration site at its document position**: nearest-above wins, last-wins on
  name collisions, exactly like `{name := …}` declarations.
- **Cell classification** (deliberately NOT `varDeclIsPick`, which reads a single bare word as an alias
  formula — wrong for data like `Type = undead`): leading `=` → formula (chains allowed); bare number →
  number; anything else → frozen TEXT verbatim (the `pickVals` channel — never rolled). So a `2d6` cell
  is text in v1.
- **Name sanitization** (`varBaseName`): lowercase, non-identifier runs → `_`, must land on
  `VAR_NAME_RE` or the segment is skipped ("Hill Giant" → `hill_giant`; "3rd Level" → skipped). The
  header row, the footer total row, empty cells, `#ERR` cells, and cells carrying `[[type:key]]` tokens
  never project.
- **Deliberately NOT projected:** bare row names (`{Orc}` alone) — bare identifiers share the
  grammar-rule namespace and rules win, a silent-shadow P1 trap; the display name is addressable as
  `{Orc.Name}` (column 0 under its own header) instead. Adding bare projection later is compatible.
- **Pill cells (shipped 2026-07-16, the follow-up round):** a cell that IS a single dice/grammar
  pill projects its FROZEN roll (`total`/`result`) through the pick channel — the pill is the store
  (no rolls sidecar; the record already freezes, re-rolls on click, and rides `_dice`/`_grammar`).
  Type `{2d6}` in a cell (the per-cell promotion, PR #788), click the pill to re-roll; `repaintAfterRoll` gives a
  projecting base the full-`render()` treatment so every referencing point repaints. Mixed
  token+text cells and other pill types still skip.
- **Column totals (shipped 2026-07-16):** `{= sum(base.col)}` / `avg`/`count`/`min`/`max` aggregate
  a NAMED base's column across all rows (`aggregateVarBaseColumn` over the resolved vars map; the
  `expandAggExpr` prop group admits one dot). Bare props keep the child-prop meaning unchanged;
  unmatched/3-segment/scoped dotted calls stay literal → visible `#ERR`.
- **Var-panel grouping (shipped 2026-07-16):** each projecting base's names collapse under one
  header in the Variables panel (label = the prefix name or "base", count, default collapsed,
  session-only expand state).
- **Text edits repaint like re-rolls (bases round 1, 2026-07-16):** editing a cell (or the whole
  table as markdown) on a projecting base repaints referencing points, not just the widget.
  In-base sibling pills patch on the cell focusout (`mtPatchCells`, recipe or not); the outline
  repaints via the deferred, focus-aware `scheduleVarBaseRender` (skipped while focus stays inside
  the base, handed to the live editor's `exitEdit` via `_pendingVarBaseRender` when one is open —
  never a synchronous render in focusout, which would steal focus from the next-clicked cell);
  the markdown-edit path of a projecting base full-`render()`s from `exitEdit`. Both commit
  chokepoints share ONE extracted tail — `mtCommitEpilogue(node)` (round 2): prune orphaned pill
  records, re-bump the vars generation past the per-cell promotion (the brace classification
  reads `collectVars`, which caches `varBaseDefsMemo` from the pre-promotion text — without the
  re-bump a projecting base serves the stale projection until the next edit), then re-run the
  recipe; it returns WHICH repaint is due — `'full'` after a recipe recompute, `'tokens'` on a
  projecting varbase with no recipe (round 4, measured: only cells holding pill tokens can
  change from a sibling value edit, and patching all N×C cells cost ~870 ms at 5k rows —
  `mtPatchCells`' token scope makes the blur O(pills)). `isVarBase(node)` is the single
  "projecting variable base" predicate (was seven inline twins). The markdown-edit path still
  promotes typed `{…}` per cell before the epilogue (mirroring the load path).
- **Model reads split by intent (round 2, 2026-07-16):** paint paths (the widget build, `mtPatchCells`,
  the cell focusin) read `mtModelRead(node)` — a ver-guarded, text-checked per-node parse memo in the
  `varBaseDefsMemo` family whose returned model is SHARED and treated as immutable — while every path
  that mutates rows then `mtCommit()`s stays on `mtModel(node)` (a fresh parse, safe to mutate). The
  per-keystroke cell input handler reuses its own last-commit parse (`_mtEditSession`), keyed on the
  text it just committed so any foreign mutation (recompute, undo, a slash apply) self-invalidates it.
  The variables panel no longer rebuilds synchronously inside `markDirty` (per keystroke); it
  debounces one trailing rebuild (`scheduleVarPanelUpdate`), while `openVarPanel` stays synchronous.
- **UX coherence (bases round 3, 2026-07-16):** the base bullet menu carries a **"View & rows
  shown"** door opening `showBaseSettingsMenu` — view + outline rows cap in ONE menu surface
  (`mtAddRowsCapSection` is shared with the chrome rows button's menu), so every whole-base
  setting is reachable from the base menu, not only as chrome buttons. The **cell context menu**
  (Shift+F10) leads with a "Cell pills" section when the focused cell holds pill tokens
  (`collectPillActions(node, cellRaw)` — the cell-scope override; clocks/spoilers stay
  node-scoped), since a focused cell shows the raw token with nothing to click. `/variables`
  opens the Variables panel from the slash menu (beside the toolbar button and Ctrl/Cmd+Shift+V).
  The in-app concept guide gained a **bases-overview** entry (which table-family feature to reach
  for), and user-facing copy says "table"/"base", never "grid" (§8).
- **`var:` over projections (shipped 2026-07-16, the below-the-line pass):** `var:orc.hp` (and
  the hierarchical `var:orc`, the #tag rule) matches the projecting BASE — the matcher checks
  `varBaseDefsMemo` beside `node.vars` declarations, and the parser admits dots. Documented in
  the `?` panel row and the search guide entry.
- **Deferred (reopen this doc to build):** projected-name shadow markers (no pill to mark).

### 7c. The two L-size structural items — considered, decided, recorded (round 4, 2026-07-16)

- **In-widget row virtualization: NO for now.** Measured (`guidance/performance.md` §Bases): a
  base is comfortable to a few hundred rows and usable to ~1k; widget build is linear in cells
  (~230 ms at 5k rows on slow hardware). The existing **rows cap** (BC: All/5/10/20) is the
  mechanism — a capped base paints like a 20-row one in the outline — and virtualizing rows
  *inside* a `<table>` (sticky header, focus/selection continuity, drag targets across a
  virtual window) is high-complexity for a case the cap already covers. **Revisit trigger:** a
  real workflow needs a >1k-row base fully expanded (zoomed) at typing speed.
- **`node.base = {}` field consolidation: NO for now.** Today a base rides seven parallel node
  fields (`colW`, `colRole`, `view`, `baseRows`, `qbase`, `varbase`, plus the shared
  `collapsed`) with seven OPML attrs, each hand-wired through clone/serialize/column ops. A
  single `node.base` object would give one-stop clone + serialize, but does not remove the real
  per-field work (the index-aligned arrays still need every column-op remap), costs a load-time
  migration plus churn across a stable, heavily test-pinned area, and the field inventory has
  stopped growing (the views/roles/qbase/varbase build-out is complete per
  `generative-status.md`). **Revisit trigger:** the next time a NEW per-base field must be
  added — do the consolidation then, when a change is already touching every wiring site.

---

## 8. Canonical vocabulary (feeds `ux-discipline.md` §1)

Binding terms for UI copy, `aria-label`s, docs, and this file:

| Concept | Canonical term | Not |
|---|---|---|
| Static rendered markdown table (inline pipe table in any point — display form, not a view of a base) | **table** | markdown table, grid |
| A structured data object with its own dedicated point, currently showing in table view | **base** | dynamic table, widget, database |
| The base's interactive grid display (its current default view) | **table view** | table (when referring specifically to the view a base shows) |
| The whole-base top bar | **base header** | toolbar |
| The base's bullet menu (whole-base ops + node ops) | **base menu** | table menu, ⋯ menu |
| The per-column menu | **Column menu** | column panel (the panel is its content) |
| Editable column-name chip | **name pill** | header chip |
| One-click column aggregates | **Calculate** | summary |

---

## 9. How we ship it (PR arc)

1. **PR 1 — static tables render anywhere. ✅ Shipped.** `mdToHtml` learns GFM pipe tables → static read-only `<table>` (`renderStaticTable`, reusing the table CSS); alignment from the delimiter, cells via `mdInline`, an optional `#+TBLFM:` computed + hidden. Render-layer only — `node.text` is untouched, edit mode shows the raw markdown (recipe line included). `tableDelimCells` is the GFM-strict false-positive guard. The markdown-first baseline; stands alone and fixes the original "convert the point and the table stops rendering" complaint.
2. **PR 2 — base rename + base header + conversions.**
   - **PR 2a ✅ Shipped.** Internal rename of the interactive object `node.type` `table` → **base** (widget dispatch, edit mode, OPML `_type`, exports, `nt-base` CSS); the `/base` verb (label **Base**, retiring `/table`) and the `@table` insert verb (a static pipe-table starter); a **shared keyboard-first grid size picker** swapped into the slash-menu popup (arrows size, Enter creates, Esc cancels; default 3×3, max 8×8) feeding both verbs; and a **non-destructive convert** (`createBaseAt`) — an empty point becomes the base in place, a content-bearing point keeps its text with the base inserted as the next sibling (fixes the destroy-text-on-convert data-loss bug). No migration (pre-release).
   - **PR 2b — base header bar + copy ops. ✅ Shipped.** A slim full-width **base header bar** atop the base (built extensible — left zone reserved for the future view switcher; no base title for MVP) hosting a **base-menu opener** (`aria-label` "Base options"). The **base menu** (distinct from the Column menu) carries **Copy as markdown** (the current displayed state — computed values baked into the cells, no `#+TBLFM` — a frozen static-table snapshot via `baseFrozenMarkdown`) and **Copy with TBLFM** (raw cell literals plus the `#+TBLFM` recipe via `baseRecipeMarkdown`, so a paste recomputes through PR 1's static render). Opened by the opener **and** by **Ctrl/⌘+Shift+M** (base-context-scoped); §7.2 menu pattern (`role=menu/menuitem`, `↑↓`/`Enter`/`Esc`, reduced-motion, ARIA). Each copy confirms with a `flashHint` toast. *Still scoped for a later pass: the §5 header-row interaction model (name pill vs Column menu) and `Ctrl/⌘+M` for the Column menu.* **Superseded:** the `⋯` opener, the `#mt-basemenu` dropdown and its `Ctrl/⌘+Shift+M` shortcut were later retired — the two copy ops (plus the node ops and a confirmed delete) now live on **the base bullet's menu** (§5 "The base bullet"). The header bar's reserved zone was later filled by the BV-1 view switcher (Table / Board / Cards / Calendar).
3. **PR 3 — promote. ✅ Shipped.** "Convert to base" on a static table, with the §6 split logic (see §6 "Promote" for the full behavior: hover-revealed `▦ base` button, point · base · point split, in-place for a table-only point, TBLFM carried + recomputed, one undo step, `planTablePromote` pure core pinned in tests).
   - **PR 2c — name-pill column header + Column-menu consolidation + keyboard repick. ✅ Shipped.** The column header is now the **name-pill model** (§5): the editable name pill (also the row-0 grid cell, so UXP-2 nav + type-to-overwrite rename reach it), the surrounding `.mt-colhead` `<th>` as the click-for-menu / drag-to-reorder zone, and the resize grip on its right border — replacing the old `.mt-colh` handle row + `▾` opener. The Column menu carries the consolidated ops (**Calculate · Alignment · Width · Insert · Move · Delete**). **Keyboard repick:** the colliding `⌘+M` (Column) / `⌘+Shift+M` (Base) chords are gone; the Column menu opens via **`Shift+F10`** on a focused base cell, and the base menu via the base bullet's popup (`Shift+F10` on the point). Mostly DOM/visual — model ops (`mtModel`, align/insert/move/delete) reused; cross-platform (Chromium + WebKit) verified.
4. **Since shipped (see §4):** views (BV-1 board / BV-2 cards / BV-3 calendar), typed-field column
   display roles (FR-1), and query bases / filters (QP-2 through Phase C). What remains deferred is
   the saved-views DB and relations (SV-3/SV-4, recorded NO in `saved-views-proposal.md`).

Each PR runs the normal process — rationale → decisions → brief → Conformance Statement gate.

---

## 10. Relationship to existing work

- **Closes** the register gap "markdown tables don't render outside table points" (markdown-first, §1).
- **Absorbs** the UXP-3 Column panel / Calculate work — those become the base's column tools.
- **Supersedes** the `▾`-caret column-header cleanup design (replaced by the §5 header-row pill model).
- **Honors** the engineering invariants in `CLAUDE.md` (plain-text `node.text`, the caret invariant, virtualized render) — bases are still plain-text-backed; nothing here requires rich inline state.

---

*This is locked direction. Changes to it — especially moving anything out of the §4 deferred list — are deliberate decisions, recorded here, not incidental scope drift.*
