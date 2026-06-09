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

## 2. Two things, clearly named: **table** vs **base**

The static render and the interactive widget are **different objects with different names.** This naming *is* the feature — it makes the widget's special-ness intentional instead of an invisible quirk.

| | **Table** (static) | **Base** (dynamic) |
|---|---|---|
| What it is | plain markdown (`\| a \| b \|`), rendered read-only | an interactive data object |
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
| Static rendered markdown table | **table** | markdown table, grid |
| Interactive data object | **base** | dynamic table, widget, database |
| The whole-base top bar | **base header** | toolbar |
| The whole-base menu | **base menu** | table menu |
| The per-column menu | **Column menu** | column panel (the panel is its content) |
| Editable column-name chip | **name pill** | header chip |
| One-click column aggregates | **Calculate** | summary |

---

## 9. How we ship it (PR arc)

1. **PR 1 — static tables render anywhere. ✅ Shipped.** `mdToHtml` learns GFM pipe tables → static read-only `<table>` (`renderStaticTable`, reusing the table CSS); alignment from the delimiter, cells via `mdInline`, an optional `#+TBLFM:` computed + hidden. Render-layer only — `node.text` is untouched, edit mode shows the raw markdown (recipe line included). `tableDelimCells` is the GFM-strict false-positive guard. The markdown-first baseline; stands alone and fixes the original "convert the point and the table stops rendering" complaint.
2. **PR 2 — base rename + base header + conversions.** Rename the interactive table → **base**; non-destructive `/base` convert; `@table` static insert; the base header bar with Copy-as-markdown / Copy-with-TBLFM; the header-row interaction model + menu shortcuts.
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
