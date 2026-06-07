# Pointliner — Roadmap & Plan

Derived from the feature-gap backlog and the direction decisions below. This is the
"how we proceed" document; the gap analysis lives in `docs/backlog.md`, and the
discoverability / UX strategy in `docs/ux.md`.

## Decisions locked
1. **Direction: balance both** — interleave PKM/networked-notes features with generative
   ones (dice/grammar/math), rather than committing to one.
2. **Link scope: multi-document Zettelkasten** — a workspace of many notes/files, with
   **cross-file *and* same-file** linking on top.
3. **Mirrors / cloned items: shelved** — hardest item, conflicts with the strict
   one-parent tree; links cover much of the same need more cheaply. Revisit later.
4. **Storage: a folder of OPML files on real disk, hard-gated.** Each note/doc is its own
   `.opml` in a user-picked folder, written via the File System Access **directory picker**
   (Chromium). The multi-doc workspace is **gated behind establishing this durable backing** —
   durability over reach. Non-Chromium browsers keep the full single-file app and are *invited*
   to switch to unlock the workspace. (See "Storage reality + the durability decision" below.)

## Storage reality + the durability decision (verified June 2026)
The File System Access API has two halves:
- **Directory/file pickers** (`showDirectoryPicker` / `showSaveFilePicker`) — write to the
  user's *real, visible* disk. **Chromium-only** (Chrome/Edge/Opera). Firefox & Safari decline
  them (Mozilla's standards position calls them "harmful").
- **OPFS** (`navigator.storage.getDirectory()`) — a folder/file hierarchy in *private,
  browser-managed* storage. Works in all modern browsers, **but it is not the user's disk**:
  it's browser-bound and **clearing site data deletes it.**

**Decision — hard gate (durability over reach).** Safari/Firefox cannot auto-save to disk at
all, and OPFS-only storage can be silently wiped by clearing site data — an unacceptable way to
lose a Zettelkasten. So the multi-document workspace is **gated behind a real on-disk backing
folder**, which only the Chromium directory picker provides:
- **Chromium:** the user picks a folder once (`showDirectoryPicker`, `readwrite`); the handle is
  stored in IndexedDB and re-permissioned each session (one click via `queryPermission` /
  `requestPermission`); the app **auto-writes every edit to real `.opml` files** in that folder.
  Continuous, durable, user-owned.
- **Non-Chromium (Safari/Firefox):** the workspace is **not offered**. These users keep the full
  **single-file** app (manual open/save — still a real disk file, one at a time). The UI
  **invites** them to open in Chrome/Edge to unlock linked multi-note workspaces — a gentle
  in-app prompt where they'd reach for the feature, plus a note in the user docs.
- **OPFS demoted:** with the disk folder as source of truth, OPFS is at most a crash-buffer for
  the sub-second window between debounced disk writes — and the existing localStorage autosave
  already covers that, so OPFS likely isn't needed in v1.

**Scope of the gate — important:** the hard gate is on the **multi-document workspace only**.
**Same-document linking + backlinks** (links between nodes *within one file*) work in **every
browser, ungated** — they live entirely in the current tree and persist via the normal
single-file save, needing no folder backing. Only **cross-file** links require the gated
workspace. So a Safari/Firefox user gets full intra-document Zettelkasten linking; only the
multi-file network is Chromium-gated.

## Why multi-doc (rationale)
A heavy-user convenience + scale tier, **not** a necessity for most. Single-file is fine for the
majority because **rendering is virtualized** (only visible rows are in the DOM — big outlines
scroll fine). The real single-file ceilings, all O(total nodes): the **localStorage autosave cap
(~5 MB; the app already warns ~4.2 MB and disables autosave past it)**, and **whole-tree work per
edit** (`collectVars`/`collectRules` re-walk on every change, full-tree autosave stringify every
~0.8 s, full-tree undo snapshots). Multi-doc relieves both — smaller per-file trees + a disk store
with no 5 MB cap. (Both could *also* be fixed within single-file — autosave off localStorage,
incremental indexing — so multi-doc is convenience-first, scale-second, not the only lever.)
Net tiering: **single-file = universal default; multi-doc = gated power tier that also scales.**

## Foundation engineering defaults (recommended — confirm or override)
Two Phase-1 pieces don't need a product call; proceeding with these unless overridden:
- **Global node addressing:** give each document a stable id in its OPML head (`_docid`,
  assigned on first load, independent of filename so renames don't break links). A link
  targets `docId#nodeId` for cross-file, or `#nodeId` for same-file. Node ids stay per-doc
  (the existing random `uid()` is fine within a document).
- **Backlink index:** on opening a workspace, **scan all `.opml` files in the folder into an
  in-memory link/backlink index** (the same tree-walk pattern as `collectVars`, generalized
  across documents), rebuilt on change. This mirrors how local Zettelkasten tools build their
  index. A persistent on-disk index is a later optimization, deferred until corpus size demands it.

## Working method (unchanged — it's working)
Per feature: **verified pure core first** (parse/eval/index functions + seeded `node --test`
pins), *then* DOM/UI wiring handed to the coding agent. The heavy storage work in Phase 1 is
the exception — it's DOM/FSA-heavy and tests cover less of it, so it leans on manual browser
testing.

---

## Phases

### Phase 0 — Generative momentum (ship now, parallel, low risk)
Independent of the storage refactor; keeps the "balance" promise while Phase 1 is designed.
- **Table formulas** — cell references feeding `evalMath` for live table calc. Strong reuse
  of the existing math engine; pure formula parse/eval is verifiable. *(backlog: Table formulas)*
- **TODO states + priorities** — extend the `todo` type with a state cycle
  (TODO→NEXT→WAITING→DONE) and `[#A]/[#B]/[#C]` priorities. Mostly model + small UI.
  *(backlog: Rich TODO states + priorities)*

### Phase 1 — Multi-document foundation (the big lift; Chromium, real disk folder)
The largest, least-test-covered phase. Restructures the core single-`root`/single-autosave
assumptions into a workspace + current-document model.
1. **Capability gate + invite UX** — feature-detect `showDirectoryPicker`. If absent, the
   workspace is hidden and a gentle "open in Chrome/Edge to unlock linked notebooks" prompt
   appears where the user would reach for it; single-file mode stays fully functional.
2. **Backing folder** — `showDirectoryPicker({ mode: 'readwrite' })`; persist the handle in
   IndexedDB; on load, `queryPermission` / `requestPermission` to reconnect (one user click).
   The workspace doesn't open until a folder is established — this *is* the hard gate.
3. **Stable per-doc id** (`_docid` in OPML head; migrate-on-load if absent).
4. **Document switcher UI** — open / create / rename / delete `.opml` files in the folder.
5. **Continuous auto-write** — every edit debounced to its file (extend the existing autosave
   path); keep the localStorage autosave as the crash buffer for the debounce window. Persist
   which doc was last open.

### Phase 2 — Linking core
**Steps 1–4 are ungated** — they work in every browser on a single document (no folder backing,
no Phase 1 dependency). **Only step 5 (cross-file) requires the gated workspace.** This means
same-document Zettelkasten ships first and everywhere; the multi-file network rides on Phase 1.

> **Status:** steps 1–3 + a bonus mirror are **shipped** (same-document). `collectLinks` index
> + backlinks panel + `[[#id|label]]` token + copy-link + keyboard-first creation are in; the
> **mirror** (`[[#id|]]` transcludes the target's live rendered content, display-only, inline) is
> a real partial slice of the shelved "mirror" feature. Step 4 (picker) is built but **gated off**
> as a future opt-in overlay; step 5 (cross-file) waits on Phase 1. See `docs/features.md`.

1. ✅ **Same-file link token** `[[#nodeId|label]]` + resolver (click → zoom to target). Links are
   plain editable text in edit mode (not atomic pills); render as a widget in display mode.
2. ✅ **In-memory link index** — `collectLinks(rootNode)` tree-walk, cached on `_varsVer`
   (generalizes the `collectVars`/`collectRules` pattern); returns `{outgoing, backlinks, broken}`.
3. ✅ **Backlink index + backlinks panel** for the current node.
4. ◐ **Quick-switcher / `[[` picker** — built but gated off (`LINK_PICKER_ENABLED = false`);
   re-enable as an opt-in guidance overlay later. *(backlog: Node links & backlinks)*
5. **Generalize to cross-file** — `[[docId#nodeId|label]]` once Phase 1 lands; the index now
   spans all docs in the folder. **(This step — and only this step — needs the gated
   workspace.)** *(backlog: Node links & backlinks)*

### Phase 3 — Networked-notes UX
- **Link-and-create while typing**, **aliases**, **unlinked references**
  *(all sub-features of backlog: Node links & backlinks)*.

### Phase 4 — Later
- **Graph view** *(backlog: Node links & backlinks)*; **daily notes** and **dates + agenda
  view** *(backlog: Dates + agenda)*.

### Interleaving (the "balance")
Drop a contained generative feature between the heavy phases — e.g. another `evalMath`
primitive, a dice/oracle variant, or a grammar feature — so both identities keep moving and
Phase 1's weight is broken up.

---

## Open questions to resolve as we go
- Confirm the two foundation defaults above (global addressing, in-memory index).
- Phase 1 fallback UX: how gracefully does the app degrade for non-Chromium users — hide the
  workspace UI entirely, or show it disabled with an explanation?
- Link display: how does a `[[node]]` link render (title snapshot vs live title) and behave on
  click (zoom in current view vs open the target doc)?
- Where do these docs live long-term — alongside `CLAUDE.md` in the repo, or separate?

---

## Generative / internal-engine ideas (the "balance" side)
Self-contained, additive ideas for the generative engine — good interleaving material
between the heavy PKM phases. (Shipped items removed: dice success pools, date math,
and unit conversion are **done** — see `docs/features.md`. The oracle was reverted and
is listed below as pending.)
- **Oracle (tunable yes/no) — pending:** a configurable odds-based oracle pill — pick a
  likelihood, get a yes/no (optionally with degrees of yes/no and a random-event nudge),
  straight off the artifact recipe. **IP guardrail:** the odds bands and any result/word
  tables must be **original or user-defined** — do **not** copy the specific values or tables
  from any existing published oracle system; those are copyrighted. The mechanic (tunable
  yes/no odds) is fine; only the data has to be your own. (A prior version that used such
  tables verbatim was built then reverted for this reason — the artifact wiring is understood;
  only the data/values need to be original.)
- **Dice:** reroll (`r`); extend success pools with bane/botch counting.
- **Math:** more `evalMath` primitives as wanted (date-format variants, more units) — all
  additive, no architecture change.
- **Inline quick syntax** `{= expr}` / `{NdM}` that evaluates at render *without* a stored
  record — an additive second syntax alongside `[[type:key]]`. (Distinct from typed `{…}`
  shorthand, which *promotes* to a stored pill; this would be the render-only variant.)
- **Aggregations over children** (`sum`/`count`/`avg` of a subtree) — a new token type + a
  render-time subtree walk; reuse `markDirty`/`_varsVer` invalidation. *(heavier)*
- **Decks / bags** (draw without replacement) — the first feature needing **persisted
  per-instance state**; decide OPML-record (portable, ugly) vs. sidecar. Breaks the
  stateless purity. *(heavier)*
- **Retire the legacy per-feature cores** (`parseDice`/`parseMarkov`/`parseRolltable`) now
  that composition runs through the unified grammar engine — a cleanup refactor that removes
  duplicated code, not a capability add. Defer until the duplication causes friction.
- **Out of scope:** a `{query: tag=…}` / saved-views database layer. (The *links + backlinks*
  half of the old "Tier 3" is now the planned direction — see the phases above; only the
  query/DB part remains out of scope.)
