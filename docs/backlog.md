# Pointliner — Feature Backlog

A consolidated, prioritized list of features Pointliner lacks, distilled from comparing it
against leading outliner / PKM / networked-notes tools. Overlapping gaps are merged into one
entry. **Sync and real-time collaboration are out of scope** — this tracks single-user features.
Roadmap, sequencing, and storage decisions live in `docs/roadmap.md`.

**Status:** ☐ not started · ◐ partially present · ✓ done · ⊘ shelved
**Fit:** rough difficulty + how it slots into the architecture (plain-text `node.text` source of
truth, tree model with one parent per node, virtualized rendering, tree-walk caches keyed on
`_varsVer`).

## Already strong (context)
Outlining + folding + collapse-to-level; ordered / unordered / checkbox / description lists;
footnotes; rich inline + block markdown (headings, quote, code, divider); static tables;
hashtag tags with click-to-filter; OPML / Markdown / plain-text export; theming + touch;
**virtualized rendering** (handles large trees); and the **generative artifact layer**
(dice, grammar, math, variables, date math) — the differentiator no peer tool has.

---

## Tier 1 — high priority (recurring across tools, high value)

### ◐ Node links & backlinks (the link layer)
Link any node to any other and see what links back. Anchors a whole cluster — quick-switcher,
link-and-create, aliases, unlinked references, graph view.
- **Shipped (same-document):** `[[#id|label]]` token + `collectLinks` index + backlinks panel
  + copy-link + keyboard-first creation; plus a **live-title/content "mirror"** (`[[#id|]]`). The
  `[[` picker is built but gated off. **Remaining:** cross-document (needs the workspace), and the
  Org-roam cluster below (aliases, unlinked refs, graph). See `docs/features.md` / `docs/roadmap.md`.
- **Why:** turns the tree into a navigable web — the core of PKM / Zettelkasten work.
- **Foundation present:** every node already has a stable id that round-trips through OPML
  (`_id`), so addressable targets exist; only the link + index + backlink layer is missing.
- **Scope split:** *same-document* linking works everywhere, ungated; *cross-document* linking
  rides on the multi-doc workspace (gated). See plan.
- **Fit — medium core.** `[[…|label]]` token + resolver + a backlink index via tree-walk (the
  `collectVars`/`collectRules` cached-walk pattern). Pure, testable core; panel + switcher are
  the new UI.
- **Rough order:** (a) link token + resolver → (b) backlink index + panel → (c) quick-switcher
  (fuzzy jump by title; near-standalone) + link-and-create → (d) aliases + unlinked references →
  (e) graph view (later, hard).

### ☐ Multiple documents / workspace
A workspace of many docs instead of one file at a time.
- **Why:** organization at scale + the substrate for cross-file linking; also relieves
  single-file scale pressures (localStorage autosave cap, whole-tree per-edit work).
- **Fit — hard.** The core storage refactor; gated power tier. Storage + durability decisions
  are settled in `docs/roadmap.md`.

### ☐ Dates on items + agenda / calendar view
Give a node a due/scheduled date; aggregate dated items into an agenda or calendar. Merges
due-dates, deadlines/scheduling, and daily-notes/journaling.
- **Why:** task + time management; the most-wanted view beyond the raw outline.
- **Fit — medium-hard.** A date field/token + an agenda view that filters & sorts. Builds
  directly on the date math already shipped.

### ◐ Tag power
Tag *filtering* already works (click a `#tag` to filter). Missing: saved/pinned searches, tag
autocomplete, tag inheritance, and boolean queries (`A AND NOT B`).
- **Fit — medium.** Persist saved queries; build a tag set via tree-walk for autocomplete;
  inheritance + boolean evaluation layered on the existing filter.

---

## Tier 2 — contained, good value

### ☐ Table formulas — *high synergy*
Spreadsheet-style cell formulas in tables.
- **Fit — medium, high synergy.** Reuses `evalMath` + variables: cell references feeding the
  evaluator give live table calc cheaply.

### ☐ Rich TODO states + priorities
Custom task states (e.g. TODO → NEXT → WAITING → DONE) with cycling, plus A/B/C priorities.
Today the todo is a binary checkbox.
- **Fit — medium.** Extend the `todo` type with a state field + cycle action; priority = marker
  + sort key.

### ☐ Properties / structured per-node metadata
Per-node key-value metadata, enabling property-based filtering and a future column view.
- **Fit — medium.** A new per-node `props` sidecar + serialize.

### ◐ Per-bullet notes
A secondary note under a bullet. The model already carries an unused `note` field.
- **Fit — easy.** Surface a note editor under the row; add `_note` to OPML serialize/parse.

### ☐ Templates
Reusable subtree templates.
- **Fit — easy.** Reuses the copy / deep-clone infra; "save this subtree, stamp copies."

### ☐ Checkbox progress cookies `[2/5]` / `[40%]`
A parent shows how many child checkboxes are done.
- **Fit — easy.** Reuses the `countDescendants`-style walk over `todo` children.

### ☐ Capture / quick inbox
Fast capture of a task/note into a chosen inbox node without navigating there.
- **Fit — medium.** Pairs well with templates.

### ☐ Refile (move a subtree via search)
Move a subtree to another location through a search picker (vs. drag/indent).
- **Fit — medium.** Reuses the search index; add a "move to…" picker.

### ☐ Archive done items
Move completed items to an archive (vs. just hide-done).
- **Fit — easy.**

---

## Tier 3 — lower / niche

### ☐ Clocking / time tracking
Clock in/out on tasks + time reports. **Fit — medium, niche.**

### ☐ Reference notes (external-resource links)
Attach a URL/citation to a note so revisiting the source surfaces it (literature-note workflow).
**Fit — medium, niche.**

### ☐ Board / Kanban view
Render a level as columns. **Fit — hard** (an alternate view layer over the same tree).

### ⊘ Mirrors / cloned items — *shelved (but a useful slice now exists)*
The same node in multiple places with synced edits. Hardest item; conflicts with the strict
one-parent tree model. **Decision: full version shelved.** But the link **mirror** (`[[#id|]]`)
already covers the most-wanted slice: a display-only, one-way reflection of a node's live title
*and* rendered content (pills + state). It's not edit-back or shared-identity, but it handles
"I want this reference to always show that node's current state" — so the heavy mirror work stays
shelved with a clearer conscience.

---

## Out of scope
- **Non-image file attachments** — nowhere clean to store binaries without bloating the file.
- **Code execution in code blocks** — security + complexity for a single-file browser app.
- **Column view** — depends on properties; niche, defer.
- **Very broad export** (LaTeX / Beamer / ODT) — has OPML / Markdown / text; HTML / PDF could
  extend later, but the long tail isn't worth it.
