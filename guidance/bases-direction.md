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

---

## 2. A base and its views — the object/view split

A **base** is a structured data object that lives in its own dedicated point. The **table view** is the base's default (and currently only) view — the interactive grid you see and edit. A **static markdown table** written inline in any point is a separate, independent thing: the portable, read-only rendered form of pipe-table markdown, not a view of a base.

This naming matters: "table" is a display form (and a markdown primitive); "base" is the data object. When future views arrive (cards, board, list), "table view" becomes one named view of a base rather than the thing itself — the naming holds.

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

**Named but DEFERRED (vision, not now — do not build on spec):**
- Other **views** (cards, list, board).
- **Typed fields** (number/date/select/checkbox as column *types*).
- **Filters / sorts as data operations**, saved views.
- **Relations / rollups** between bases.

> **Rule:** building anything in the deferred list requires reopening this doc and moving it above the line first. The vision is real and protected; the MVP is small on purpose.

---

## 5. Base layout & interaction model

A base in table view is laid out as:

1. **Base header bar** (top) — whole-base operations: Copy as markdown · Copy with TBLFM (§6). The home for a future **view switcher**.
2. **Header row** (the column-name row) — **the column-control surface** (see below).
3. **Data rows** — editable cells with keyboard navigation (UXP-2) and read-only computed cells (§7).
4. **Footer total row** — appears when a column has a Calculate aggregate; computed, read-only.

### Column-header interaction (the header row cells)

The column name lives in an **editable name pill**; the surrounding header-cell area is the control zone. This resolves edit-vs-menu **spatially**, with no hidden gestures:

- **Click the name pill** → edit the column name inline.
- **Click the header cell *around* the pill** → open the **Column menu** (Calculate, Alignment, Insert, Move, Delete…).
- **Hold + drag** (around the pill) → reorder the column.
- *(No double-click — the pill is the rename affordance.)*

> This **supersedes** the earlier `▾`-caret-on-a-handle column-header design. The header cell *is* the affordance. On narrow columns the around-pill click zone MUST never collapse to nothing (truncate the pill; keep a minimum header height), so "click for menu" always has somewhere to land.

### Menu keyboard shortcuts (required — `click` is mouse-only)

Base-context-scoped (do nothing outside a base); documented in `ux-discipline.md` §3 and the `?` panel:

- **`Ctrl/⌘ + M`** → **Column menu** (for the column the focused cell is in).
- **`Ctrl/⌘ + Shift + M`** → **Base menu** (whole-base operations).
- **`Shift+F10`** (and the Menu key where present) → Column menu — the OS-standard "context menu of the focused element" gesture, for assistive-tech parity.

Inline rename stays reachable by keyboard via UXP-2 navigation + type.

### Base width

A base always renders at **true full viewport width, edge-to-edge on both sides** — it ignores the narrow/full-width document toggle AND the indent/nesting depth. The base host breaks out of the outline column entirely: its left edge reaches the viewport left, its right edge the viewport right (small side margins on mobile). Bullet and collapse controls remain visible above the base via z-index. Horizontal scroll when a table overflows its container is inside the base widget, never the page.

The rationale: a base is a structured data object you interact with; dense columns need room. The narrow column toggle governs prose readability, not data density.

A static table follows the toggle (it is inline prose markup and naturally fills the content column via `width: 100%`). Static tables do not break out of the column; they stretch to fill it. Neither causes a page-level horizontal scrollbar.

---

## 6. Conversions

- **Insert / create:**
  - `@table` → insert a **static table** at the caret.
  - `/base` → create a **base**. **Converting an existing point to a base MUST be non-destructive** — existing text is preserved (kept as its own point, base placed adjacent), never overwritten. *(The current behavior of nuking the point's text is a bug this direction kills.)*
- **Promote (table → base):** "Convert to base" on a static table splits any surrounding content into sibling points — table-in-the-middle becomes point · base · point; table-at-the-end becomes point · base. The base then owns its own point.
- **Demote / export (base → markdown) — copy-only, never destructive:**
  - **Copy as markdown** — the current rendered values, ready to paste anywhere as a static table.
  - **Copy with TBLFM** — the values plus the `#+TBLFM:` recipe.
  - There is **no destructive "convert to static."** A base is not self-destructing.

---

## 7. Formula behavior (tables and bases alike)

- **Compute on every render.** `computeTable` is pure, so static tables compute their `#+TBLFM` too.
- **Computed cells are read-only**, visually marked, and carry the same "this is computed" warning a base uses — in **both** static tables and bases.
- **The `#+TBLFM:` line is hidden when rendered** (it's the recipe, not content) — for both.
- **TBLFM stays the formula engine for table-view bases now.** It is the backend; it works. A re-evaluation of the data/formula model is a **named future fork** that only opens *if and when* typed fields or other views arrive (§4) — **not** work to do on spec today.

---

## 8. Canonical vocabulary (feeds `ux-discipline.md` §1)

Binding terms for UI copy, `aria-label`s, docs, and this file:

| Concept | Canonical term | Not |
|---|---|---|
| Static rendered markdown table (inline pipe table in any point — display form, not a view of a base) | **table** | markdown table, grid |
| A structured data object with its own dedicated point, currently showing in table view | **base** | dynamic table, widget, database |
| The base's interactive grid display (its current default view) | **table view** | table (when referring specifically to the view a base shows) |
| The whole-base top bar | **base header** | toolbar |
| The whole-base menu | **base menu** | table menu |
| The per-column menu | **Column menu** | column panel (the panel is its content) |
| Editable column-name chip | **name pill** | header chip |
| One-click column aggregates | **Calculate** | summary |

---

## 9. How we ship it (PR arc)

1. **PR 1 — static tables render anywhere. ✅ Shipped.** `mdToHtml` learns GFM pipe tables → static read-only `<table>` (`renderStaticTable`, reusing the table CSS); alignment from the delimiter, cells via `mdInline`, an optional `#+TBLFM:` computed + hidden. Render-layer only — `node.text` is untouched, edit mode shows the raw markdown (recipe line included). `tableDelimCells` is the GFM-strict false-positive guard. The markdown-first baseline; stands alone and fixes the original "convert the point and the table stops rendering" complaint.
2. **PR 2 — base rename + base header + conversions.**
   - **PR 2a ✅ Shipped.** Internal rename of the interactive object `node.type` `table` → **base** (widget dispatch, edit mode, OPML `_type`, exports, `nt-base` CSS); the `/base` verb (label **Base**, retiring `/table`) and the `@table` insert verb (a static pipe-table starter); a **shared keyboard-first grid size picker** swapped into the slash-menu popup (arrows size, Enter creates, Esc cancels; default 3×3, max 8×8) feeding both verbs; and a **non-destructive convert** (`createBaseAt`) — an empty point becomes the base in place, a content-bearing point keeps its text with the base inserted as the next sibling (fixes the destroy-text-on-convert data-loss bug). No migration (pre-release).
   - **PR 2b — base header bar + copy ops. ✅ Shipped.** A slim full-width **base header bar** atop the base (built extensible — left zone reserved for the future view switcher; no base title for MVP) hosting a **base-menu opener** (`aria-label` "Base options"). The **base menu** (distinct from the Column menu) carries **Copy as markdown** (the current displayed state — computed values baked into the cells, no `#+TBLFM` — a frozen static-table snapshot via `baseFrozenMarkdown`) and **Copy with TBLFM** (raw cell literals plus the `#+TBLFM` recipe via `baseRecipeMarkdown`, so a paste recomputes through PR 1's static render). Opened by the opener **and** by **Ctrl/⌘+Shift+M** (base-context-scoped); §7.2 menu pattern (`role=menu/menuitem`, `↑↓`/`Enter`/`Esc`, reduced-motion, ARIA). Each copy confirms with a `flashHint` toast. *Still scoped for a later pass: the §5 header-row interaction model (name pill vs Column menu) and `Ctrl/⌘+M` for the Column menu.*
3. **PR 3 — promote.** "Convert to base" on a static table, with the §6 split logic.
4. **Later (this doc's deferred list, §4):** views, typed fields, filters.

Each PR runs the normal process — rationale → decisions → brief → Conformance Statement gate.

---

## 10. Relationship to existing work

- **Closes** the register gap "markdown tables don't render outside table points" (markdown-first, §1).
- **Absorbs** the UXP-3 Column panel / Calculate work — those become the base's column tools.
- **Supersedes** the `▾`-caret column-header cleanup design (replaced by the §5 header-row pill model).
- **Honors** the engineering invariants in `CLAUDE.md` (plain-text `node.text`, the caret invariant, virtualized render) — bases are still plain-text-backed; nothing here requires rich inline state.

---

*This is locked direction. Changes to it — especially moving anything out of the §4 deferred list — are deliberate decisions, recorded here, not incidental scope drift.*
