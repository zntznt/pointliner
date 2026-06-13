# Pointliner — Feature Backlog

A consolidated, prioritized list of features Pointliner lacks, distilled from comparing it
against leading outliner / PKM / networked-notes tools. Overlapping gaps are merged into one
entry. **Sync and real-time collaboration are out of scope** — this tracks single-user features.
Roadmap, sequencing, and storage decisions live in `guidance/roadmap.md`.

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
  + copy-link + keyboard-first creation + the **`[[` picker** (live — UXP-4); plus a
  **live-title/content "mirror"** (`[[#id|]]`). **Remaining:** cross-document (needs the
  workspace), and the Org-roam cluster below (aliases, unlinked refs, graph). See
  `guidance/features.md` / `guidance/roadmap.md`.
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
  are settled in `guidance/roadmap.md`.

### ✓ Dates on items + agenda / calendar view (2026-06-13)
Due dates live as a `due` property in `node.props` (value: `YYYY-MM-DD`, `today`, `today+N`).
Date-smart chips (Today / Tomorrow / Mon / 3d overdue, colour-coded by urgency). Agenda
panel (toolbar calendar button) groups all dated points: Overdue / Today / Coming up / Later;
click to zoom in. `/due` slash verb + bullet menu "Set due date" front door. Search operators:
`due:today`, `due:overdue`, `due:<date`, `due:>date`. Pure cores `parseDueDate`,
`formatDueDate`, `collectDueDates`. Zero new authoring syntax — reuses `node.props` and the
existing `key:value` search operator family. P5 gate signed off (recorded UXP-20 decision,
2026-06-13: `due` property is the home; inventory row added to `ux-discipline.md`).

### ◐ Tag power
Tag *filtering* already works (click a `#tag` to filter), **tag autocomplete shipped**
(the `#` picker, sourced from `collectTags`, most-used-first — UXP-10), **search query
operators shipped** (2026-06-13, the UXP-20-routed decision): implicit AND, `-` negation,
`"a b"` phrases, `#tag` (word-anchored), `is:done`/`is:todo`/`is:note` — with the
focus-shown legend under the search box + the `?` panel as front doors, and pure cores
(`parseSearchQuery`/`queryMatchesNode`) pinned in tests. Because `#KEYWORD` states are
hashtag-shaped, `#waiting` filters by state with no `state:` operator. **Saved searches
shipped** (2026-06-13): star the query to save it doc-level (OPML head element), saved
queries are chips in the focus-shown panel — apply/forget by mouse or keyboard. Missing:
tag inheritance and `OR` (deferred until real queries demand a precedence rule).
- **Fit — medium.** Inheritance layered on the tag-term matcher.

---

## Tier 2 — contained, good value

### ✓ Table formulas — *high synergy* (shipped)
Spreadsheet-style cell formulas in tables, via Org-mode `#+TBLFM:` conventions.
- **Fit — medium, high synergy.** Reuses `evalMath` + variables: cell references feeding the
  evaluator give live table calc cheaply.
- **Shipped:** `@ROW$COLUMN` references + ranges (`vsum`/`vmean`/`vmax`/`vmin`/`vcount`/
  `vmedian`) translated onto `evalMath`; formula stored as a trailing `#+TBLFM:` line in
  `node.text` (round-trips for free). See `guidance/features.md` for the supported grammar and the
  explicit not-yet list (named columns, `#+CONSTANTS:`, `remote()`, hline-relative `@I`, `B3`).

### ✓ Random variables (Perchance-style generation) — shipped
A variable whose value is a **frozen random pick**: declared like any variable (dialog
value-type choice), referenced `{name}` anywhere — every reference shows the same value —
re-rolled from the declaration pill (all references update together).
- **Fit — landed cleanly on the variable system** (`collectVars` + `[[var:key]]` + `{name}`),
  zero new syntax. The pick rolls once through the grammar engine and freezes on the record.
- **Supersedes** the reverted per-expansion bound-picks attempt (PR #51). Direction locked in
  `guidance/generation-direction.md`; deferred there: inline `{a := …}` shorthand, modifiers
  (`a/an`/plural/capitalize), picks in math, per-reference re-roll.

### ✓ Rich TODO states + priorities — shipped (as sequences)
Custom task states with priorities landed as `#KEYWORD [#A] body` (the `#` reuses the hashtag
sigil), and went *beyond* the fixed cycle: **sequences** are user-definable state sets
(`@sequence` declares; `/` applies; done-ness = the keyword's side of the sequence's `|`),
with `TODO NEXT WAITING | DONE` as the built-in default. Zero new syntax. See
`guidance/features.md`.

### ✓ Properties / structured per-node metadata — shipped
Per-node key-value metadata, enabling property-based filtering and a future column view.
- **Shipped:** `node.props` array of `{key, val}` pairs; `_props` OPML attribute (JSON);
  dialog editor from bullet menu ("Add property" / "Edit properties") and chip click;
  chips render below the note row (also in zoom view); `has:key` / `key:value` search operators
  wired into `parseSearchQuery` / `termMatchesNode`; exported as `[key: val · …]`
  continuation lines in markdown + plain text.

### ✓ Per-bullet notes — shipped
A secondary note under a point. Muted plain-text block (no markdown/pills by design —
a note is annotation, not content), aligned with the content via mirrored gutter rows.
Doors: bullet menu "Add note"/"Edit note" (hover, long-press, `Shift+F10`), click the
note to edit in place; Enter = line break (a prose field), Esc/blur commits, clearing
all text deletes. `_note` OPML attribute (write + parse), included in search, exported
as indented continuation lines in markdown/plain text. Undo via snapshot. Renders in
the zoom view under the title. **Globally toggleable** (`#btn-notes`, shown by default,
persisted); hidden notes leave a whisper-level indicator on the point — click/Enter/
Space reveals that one note. Typography conforms to `design-language.md` (existing
type steps, `--muted`, no italic, no opacity-faded placeholder).

### ✓ Templates — shipped
Reusable subtree templates.
- **Shipped:** named subtree snapshots on `root.templates` (`<_templates>` OPML head element);
  "Save as template" bullet-menu door (name dialog, save-over-name updates); `/template` slash verb
  opens a picker that deep-clones (`deepCloneNodeNewIds`, fresh ids) and stamps the chosen subtree —
  replacing an empty invoking point, else inserting after. Pure cores `upsertTemplate` /
  `removeTemplate` / `findTemplate`.
- **Fit — easy (as predicted).** Reused the copy / deep-clone infra + the saved-search OPML-head
  config pattern.

### ✓ Checkbox progress cookies `[2/5]` / `[40%]` — shipped
A point shows how many of its tasks are done.
- **Shipped (2026-06-13):** the Org `[/]` (fraction) / `[%]` (percent) cookie — plain text in
  `node.text`, computed at render (the edit-raw/render-pretty model, like `#+TBLFM:`; no sidecar,
  OPML round-trips for free). Counts every checkbox marker individually + each keyword/sequenced
  child once (done-ness sequence-aware via `todoDoneFromText`); scope = own text + direct children
  (recursion deferred). Goes success-hued when complete; live-updates on child toggle. Front door:
  `@progress`. Pure cores `tallyMarkers`/`progressCount`/`formatProgressCookie` test-pinned. P5:
  recorded syntax-inventory decision (reuses the `[…]` bracket family) — `ux-remediation.md` UXP-20.
- **Fit — easy.** Reused the task-marker scan + a one-level child walk.

### ✓ Capture / quick inbox — shipped
Fast capture of a task/note into a chosen inbox node without navigating there.
- **Shipped:** a toolbar inbox button (`#btn-capture`) opens a Capture dialog that overlays
  wherever you are (capturing never moves you). A designated inbox (`root.inboxId`, persisted
  as the `<_inbox>` OPML head element) is chosen via an inline point picker (reuses
  `refileCandidates`); each capture appends one **markdown-aware** point (a typed `- [ ]`
  becomes a to-do) as the inbox's last child. The dialog stays open after each capture (the
  brain-dump flow) with a running "✓ Captured N" confirmation. Enter captures, Shift+Enter is
  a line break.
- **Fit — medium (as predicted).** Reused the refile picker + the OPML-head config pattern; no
  new syntax.

### ✓ Refile (move a subtree via search) — shipped
Move a subtree to another location through a search picker (vs. drag/indent).
- **Shipped:** a "Refile…" bullet-menu door opens a modal quick-switcher (search input +
  filtered, keyboard-navigable list of candidate targets with breadcrumb paths; "Top level"
  always offered first). Selecting a target moves the subtree to become its last child;
  reuses `performDrop`'s reparent semantics + `isDescOf` for the self/own-descendant guard.
  Pure core `refileCandidates` (title-matched, excludes the moved subtree); mover `refileNodeTo`.
- **Fit — medium (as predicted).** Reused the reparent infra + the picker pattern; no new syntax.

### ⊘ Archive done items — *shelved (decision, 2026-06-13)*
Move completed items to an archive (vs. just hide-done).
- **Decision: not built.** Redundant with hide-done today and superseded by queries/filters:
  search already surfaces done items regardless of the toggle, and `is:done` / `-is:done`
  give explicit control. A structural archive *move* would destroy the location context
  that filters use; the at-scale version (archive to another document) waits on the
  multi-doc workspace.

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
