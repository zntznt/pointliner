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
**virtualized rendering** (handles large trees); the **generative + computational artifact layer**
(dice, grammar, estimates, math, aggregation, checks, variables, date math) — the differentiator no
peer tool has; and, as of June 2026, a **multi-document Zettelkasten** (disk-backed workspace,
cross-file links + backlinks, whole-folder search).

---

## What's worth doing next — value assessment (June 2026)
With Tier 1–2 and the PKM arc delivered, **the app is feature-saturated**: it's a mature
generative + computational Zettelkasten. So the highest *leverage* is no longer "more features" —
it's making the power it already has **discoverable**. Remaining work ranked by **value vs.
effort/risk** (V/E/R = High/Medium/Low):

**🟢 Best return**
1. ✓ **Daily notes / Journal** — V:M-H · E:L · R:L. **Delivered June 2026.** Toolbar `#btn-journal`
   (calendar-day icon), `/journal` slash verb, "Set as journal home" bullet-menu door.
   Append mode: auto-creates a "Journal" top-level home (or uses any user-designated home point)
   and a dated child entry for today (`YYYY-MM-DD`), then zooms in. File mode (workspace-gated):
   opens/creates a `YYYY-MM-DD.opml` per day in the folder. Config persists as `<_journal>` OPML
   head element. Pure cores: `todayISO`, `journalFileName`, `findOrCreateDatedEntry` (all
   Node-testable). Cornerstone journaling/log pattern; pairs with capture.
2. **Lean ↔ guided verbosity modes** — V:**H (highest ceiling)** · E:**H** · R:M. Addresses the app's
   *actual* weakness — powerful but hard to discover (the reason `ux-discipline.md`/`ux.md` exist).
   A lean default + guided overlays (hints, menu descriptions, the verbosity dial) serves new *and*
   power users, and makes self-contained-HTML exports usable by people you hand them to. **Highest
   raw value, worst ratio** — a deliberate cross-cutting investment, not a quick win.

**🟡 Situational**
3. ✓ **Cross-document unlinked references (view-only)** — V:M · E:L-M · R:M. **Delivered 2026-07-03.**
   The backlinks panel gains an "Unlinked references in other notes" section: mentions of the focused
   point's title/aliases in OTHER folder documents that aren't linked yet, click to open that document.
   Shipped **view-only** as decided (no cross-doc auto-Link write — the risky write-into-an-unopened-file
   path). Reuses WS-1's retained per-doc trees (`workspaceIndex.roots`) + the SAME name-matcher as the
   same-doc scan (factored into `unlinkedNameRegex`, so no noise-floor drift). Pure core
   `collectCrossUnlinkedRefs(target, ownDocId, wsIndex)`, Node-tested. The `UNLINKED_MIN_LEN`/word-boundary
   floor (inherited from same-doc) is the noise gate.
4. ✓ **Workspace "broken links" report** — V:L-M · E:L · R:L. **Delivered 2026-07-03.** File menu →
   Broken links opens an io-card report of every dangling link, same-doc AND cross-doc (the first
   consumer of the built-but-unread `workspaceIndex.outgoing`), each row jumping to the source point.
   Pure core `collectBrokenLinks(links, titleOf, wsIndex, ownDocId)` (Node-tested); concept-guide entry
   `broken-links` + `guide/` docs. E:L held: mostly wiring the already-computed broken data into a panel.
5. **Tag inheritance** — V:L-M · E:L-M · R:L. The only remaining "tag power" (tags-as-index
   already works: clicking `#tag` runs a workspace-wide search; **`OR` shipped** as QX-5, a standalone
   spaced `|` between search clauses). Minor; do tag inheritance only when a real query demands it.

**🟠 Niche / poor ratio** (Tier 3 below)
- **Board / Kanban view** — V:M (PM niche) · E:**H** · R:M (a whole new view).
- **Generative engine continuations** (more `evalMath` primitives, dice/grammar variants) — V:L-M ·
  E:L · R:L. Cheap + additive but the engine is **saturated**; excellent *interleave filler*, never
  a headline.
- **Clocking / time tracking** · **Reference notes** · **Plugins authoring UI / emoji packs** — all
  niche for a single-user tool.

**🔧 Tech debt** — **`makeDocCache` registry refactor**: no user value, cheap insurance; do
opportunistically the next time a doc-cache is added (see Tech debt below).

**⛔ Off the table (by decision)** — **CRDT / version-control pivot** (parked; would break the
single-file identity + reintroduce the out-of-scope sync/collab — revisit only if the "more than a
single file" gate trips); **Mirrors / cloned items** and **Archive done items** (shelved);
**cross-document write-through editing** and **implicit cross-doc name resolution** (parked,
revisit-gated — see the shelved entry below and `guidance/cross-document-direction.md` §4e).

> **TL;DR:** best cheap win = **Daily notes**; highest-impact investment = **verbosity /
> discoverability**; everything below #5 is interleave-filler or niche.

---

## Tier 1 — high priority (recurring across tools, high value)

### ✓ Node links & backlinks (the link layer) — delivered (2026-06-16)
Link any node to any other and see what links back. Anchored the whole cluster — **delivered end to
end**, same-document *and* cross-document.
- **Shipped (same-document):** `[[#id|label]]` token + `collectLinks` index + backlinks panel +
  copy-link + keyboard-first creation + the **`[[` picker** (live — UXP-4) + a **live-title/content
  "mirror"** (`[[#id|]]`); plus the Org-roam cluster: **link-and-create** ("+ New point", `#96`),
  **aliases** (`#98`), **unlinked references** (`#97`).
- **Shipped (cross-document, on the Phase-1 workspace):** `[[docId#nodeId|label]]` token + the
  **workspace-wide link index** (CF-1) + cross-doc **navigation** (CF-2) + the **`[[` picker across
  the folder** (CF-3) + **cross-doc backlinks** (CF-4) + **"+ New note"** link-and-create (CF-5).
  See `guidance/features.md` / `guidance/roadmap.md` (Phase 2).
- **Deferred / parked:** cross-document **unlinked references** (scanning other docs' prose — high
  cost, secondary value), and the **graph view** (parked — low actionable value for one notebook).
- **Why:** turned the tree into a navigable web — the core of PKM / Zettelkasten work. **Done.**

### ✓ Multiple documents / workspace — delivered (2026-06-16)
A workspace of many `.opml` notes in a real disk folder instead of one file at a time — **delivered**
(Phase 1, Chromium-gated). Connect a folder (File System Access + IndexedDB handle), durable
continuous auto-write, a document switcher (open/new/switch/delete), reopen-the-last-doc across
reloads, graceful degrade/reconnect on lost access, and a non-Chromium invite. Single-file mode stays
the universal default. The substrate that cross-file linking + whole-folder search ride on. See the
**Multi-document workspace** entry in `guidance/features.md` and Phase 1 in `guidance/roadmap.md`.
- **Why:** organization at scale + the substrate for cross-file linking; also relieves single-file
  scale pressures (localStorage autosave cap, whole-tree per-edit work).

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
queries are chips in the focus-shown panel — apply/forget by mouse or keyboard. `OR` has since
shipped (QX-5, a standalone spaced `|`); only tag inheritance remains.
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
  `guidance/generation-direction.md`. Since shipped: inline `{name := expr}` declaration + positional
  resolution (`typed-var-declaration-proposal.md`), and text modifiers (`a/an`/plural/capitalize,
  `modParts`/`applyMods`). Still deferred: picks in math, per-reference re-roll.

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
  as the `<_inbox>` OPML head element) is chosen via the inline tree navigator (the same
  `buildTreePicker` used by refile); each capture appends one **markdown-aware** point (a typed `- [ ]`
  becomes a to-do) as the inbox's last child. The dialog stays open after each capture (the
  brain-dump flow) with a running "✓ Captured N" confirmation. Enter captures, Shift+Enter is
  a line break.
- **Fit — medium (as predicted).** Reused the refile picker + the OPML-head config pattern; no
  new syntax.

### ✓ Refile (move a subtree via search) — shipped
Move a subtree to another location through a search picker (vs. drag/indent).
- **Shipped:** a "Refile…" bullet-menu door opens the **point-tree navigator** — a search box
  over the outline shown as an indented, expand/collapsible tree (↑/↓ move, →/← expand-collapse /
  dive-parent when the box is empty, type to filter to matches + ancestors; "Top level" leading,
  the moved subtree excluded). Selecting a target moves the subtree to become its last child;
  reuses `performDrop`'s reparent semantics + `isDescOf` for the self/own-descendant guard.
  Pure model `treeRows` + `pickerTitle`; DOM `renderTreeRows`/`buildTreePicker` (decoupled from the
  modal, reusable by a future sidebar); mover `refileNodeTo`.
- **Fit — medium (as predicted).** Reused the reparent infra; later upgraded the flat picker to a
  reusable tree navigator; no new syntax.

### ⊘ Archive done items — *shelved (decision, 2026-06-13)*
Move completed items to an archive (vs. just hide-done).
- **Decision: not built.** Redundant with hide-done today and superseded by queries/filters:
  search already surfaces done items regardless of the toggle, and `is:done` / `-is:done`
  give explicit control. A structural archive *move* would destroy the location context
  that filters use; the at-scale version (archive to another document) waits on the
  multi-doc workspace.

### Chrome discoverability follow-ups (phase 2 — deferred from the July 2026 phase 1)

Phase 1 (value-first agenda copy + the chrome drift guard locking `TB_GUIDE_MAP` and the
curated `CHROME_GUIDE` list) deliberately left these out; they are the phase-2 queue, all
from the fleet-B research (`user-research-2026-07-b.md`).

#### ☐ File-menu "junk drawer" reorganization
V:M · E:M · R:M. The File menu mixes files, views, tools and settings in one long list; the
tag browser, templates and other chrome features hide inside it. Group by intent (files /
views / tools / appearance) without breaking muscle memory (P1). Needs a before/after
click-path audit, not just a resort.

#### ☐ Calendar setup / binding UX
V:M · E:M · R:L. Custom calendars exist (`custom-calendars` guide entry) but creating one
and binding a document to it is syntax-first. A guided door (builder form or dialog) per
the P2 three-doors rule.

#### ☐ Mobile gesture discoverability
V:M · E:M-H · R:M. Long-press and swipe affordances exist but nothing teaches them on
first touch. A one-time Guided-tier hint (reuse the banner/tooltip patterns, never a
bespoke overlay).

#### ☐ Dedicated GUIDE entries: tag browser, per-pill format
V:L-M · E:L · R:L. Both currently map to the nearest entry in the chrome drift guard's
`CHROME_GUIDE` (tag browser → `hashtags`, per-pill format → `math`). Writing each its own
entry makes the door exact; update `CHROME_GUIDE` ids in the same change.

---

## Tier 3 — lower / niche

### ☐ Clocking / time tracking
Clock in/out on tasks + time reports. **Fit — medium, niche.**

### ☐ Reference notes (external-resource links)
Attach a URL/citation to a note so revisiting the source surfaces it (literature-note workflow).
**Fit — medium, niche.**

### ✓ Board / Kanban view — shipped (BV-1, 2026-07; plus cards + calendar views, `bases-direction.md` §4)
Render a level as columns. **Fit — hard** (an alternate view layer over the same tree).

### ✓ Recurring tasks (repeat + roll-forward-on-complete) — shipped (#462; completing rolls the date forward and re-opens)
From the 2026-07-02 design review (Planner Junkie). `every day`/`weekly`/etc. with the due/start
range advancing when the task is completed. **NOT a backend limit** — recurrence is pure
client-side date math (`addMonths`, `today`, `daysuntil` all exist), so it is in-scope-yet-missing,
unlike reminders (which need a server and stay out). **Fit — medium.** Proposed shape: a reserved
`repeat` property (same reserved-property model as `due`/`start`/`check`) holding a small phrase
parsed by a pure `null`-on-miss core (`parseRepeat`, pinned in `tests/test.mjs` like `parseDueDate`);
on `todoDoneFromText` flipping to done, advance `due`/`start` by the interval and re-open. Prefer
expressing intervals through evalMath where possible. **Needs an explicit P5 syntax-inventory
decision** in `ux-discipline.md` (the value vocabulary is new authoring surface, signed off the way
`due:`/`check` were), and the roll-forward MUST be a **visible, announced** action (flash
"Rescheduled to <date>", route through `#a11y-live`), never a silent render-time flip (P1/P4).

### ✓ "Random point from a subtree" generator — *shipped as `{roll: query}` (DECISION-191b)*
From the 2026-07-02 design review (Solo RPG Player, thread-tracking use). Shipped exactly along the
lines this entry asked for: a reserved keyword form inside the existing `{…}` syntax, no new sigil —
`rollParts` + a `resolveBrace` branch pick a random matching point live (`pickFromQuery`), promotion
wraps it in an anonymous grammar (`origin: {roll: …}`) so it freezes/re-rolls like any grammar pill,
and the §2 syntax inventory records it (DECISION-191b). "Advance a random open thread" is
`{roll: #thread is:todo}`; wrap in a pick var for a stable value. (Issue #546 flagged this row as
stale after the ship.)

### ⊘ Mirrors / cloned items — *shelved (but a useful slice now exists)*
The same node in multiple places with synced edits. Hardest item; conflicts with the strict
one-parent tree model. **Decision: full version shelved.** But the link **mirror** (`[[#id|]]`)
already covers the most-wanted slice: a display-only, one-way reflection of a node's live title
*and* rendered content (pills + state). It's not edit-back or shared-identity, but it handles
"I want this reference to always show that node's current state" — so the heavy mirror work stays
shelved with a clearer conscience. (The mirror shipped **cross-document** too — `[[docId#id|]]` —
in the 2026-07-18 cross-doc arc; see `guidance/cross-document-direction.md` and Tier-1 links above.)

### ⊘ Cross-document write-through + implicit cross-doc names — *parked, revisit-gated (2026-07-18)*
The two members of the cross-document family (`guidance/cross-document-direction.md` §4e) deliberately
left **out** of the shipped arc (§6 steps 1–4 + §5.2 delivered — the read-only family: cross-doc
mirror/transclusion, doc-level folder graph, folder-scoped reducers/query pills, backlink previews).
Recorded here so they sit with the other shelved directions, not buried in an active doc.
- **Write-through editing across documents** (editing another doc's point from a mirror, a folder
  query row, or a cross-doc board). **Parked:** it breaks the one-editable-`root` model — a second
  dirty/undo/autosave lane per foreign doc, reintroducing every sync/conflict hazard the single
  resident root avoids. **Revisit trigger:** the read-only family in daily use **and** a concrete ask.
- **Implicit cross-doc name resolution** (`{someOtherDocsVar}` / `{someOtherDocsRule}` just resolving
  across the folder). **Parked:** name collisions across a folder would be silent and unscoped, and
  the doc-cache model (`_varsVer`) has no cross-doc invalidation. **Sanctioned alternative today:**
  the **data-pack** lane (`plugins-direction.md`) for shared rules/vars. An *explicitly-addressed*
  future form (`{doc:name.var}`) would be a new §2 syntax-inventory decision, not a silent behavior.
- **Doable remainder filed as issues** (not parked — sequencing-deferred): **neighborhood graph**
  (§6 step 5) and a **folder-scoped `{roll:}`** (§6 step 4 remainder). See the open issue queue.

---

## Tech debt / internal refactors

### ☐ Doc-cache registry / `makeDocCache` refactor (deferred)

PR #99 *guarded* the whole-tree `_varsVer` invalidation invariant (named caches,
`// doc-cache` markers, a regression test with a proven negative control). The canonical registry is
now **nine** caches (CLAUDE.md; `collectPropKeys` was the ninth). A follow-on could
*cure* the class by construction: a `DOC_CACHES` registry that `resetDocCaches()` **and** the
invalidation test **derive from** (so a tenth cache is auto-covered), optionally routing the
*vanilla* caches through a `makeDocCache(name, compute)` factory while leaving `collectVars`
(Proxy / cycle-detection / `_varShadowedKeys`/`_varActiveExprs`/`_varCycles` side-effects) and
`stateCmds` (no dual-mode) **bespoke-but-registered**. Registry-first, factory-second.
**Do opportunistically the next time a doc-cache is added** — not worth a standalone hot-path
rewrite for zero user value. (A circulated brief mis-listed `allSequences` as a cache; the
actual eighth-set member is `collectSequences` — `allSequences` is an uncached wrapper.)

---

## Out of scope
- **Non-image file attachments** — nowhere clean to store binaries without bloating the file.
- **Code execution in code blocks** — security + complexity for a single-file browser app.
- **Column view** — largely served now by the bases suite + FR-1 column display roles (status/date/number); a standalone outline column view stays deferred.
- **Very broad export** (LaTeX / Beamer / ODT) — has OPML / Markdown / text; HTML / PDF could
  extend later, but the long tail isn't worth it.
