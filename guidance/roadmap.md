# Pointliner — Roadmap & Plan

Derived from the feature-gap backlog and the direction decisions below. This is the
"how we proceed" document; the gap analysis lives in `guidance/backlog.md`, and the
discoverability / UX strategy in `guidance/ux.md`.

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
   **Alternative researched, parked:** a CRDT-backed model (Loro) — all technical gates pass,
   verdict YELLOW; full findings + phased roadmap at `parked/parked-version-control-pivot.md`.
   Not the active plan; revisit trigger is "Pointliner accepts a build step for other reasons."
5. **Visual identity: editorial, locked.** Embedded Fraunces display + Geist body over warm
   paper/ink palettes, contrast floors as merge criteria, tokened components — the full
   standard (decisions *and* the binding anti-decisions) is `guidance/design-language.md`.
   Visual changes conform to it the way UI changes conform to `ux-discipline.md`.

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
- **Table formulas** — ✓ **shipped.** Org-mode `#+TBLFM:` cell references + ranges feeding
  `evalMath` for live table calc; the reference layer is translated onto the existing math
  engine (pure, test-pinned). Formula rides in `node.text`, no new sidecar. See
  `guidance/features.md`. *(backlog: Table formulas)*
- **TODO states + priorities** — ✓ **shipped, and superseded by sequences.** Status
  states + `[#A]` priorities landed as `#KEYWORD [#A] body` (the `#` reuses the hashtag
  sigil), and the fixed TODO→NEXT→WAITING→DONE cycle became just the *default* **sequence** —
  user-definable state sets declared via `@sequence`, applied via `/`. Zero new syntax.
  See `guidance/features.md`. *(backlog: Rich TODO states + priorities)*

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

> **Status:** steps 1–4 + a bonus mirror are **shipped** (same-document). `collectLinks` index
> + backlinks panel + `[[#id|label]]` token + copy-link + keyboard-first creation are in; the
> **mirror** (`[[#id|]]` transcludes the target's live rendered content, display-only, inline) is
> a real partial slice of the shelved "mirror" feature. Step 4 (the `[[` picker) is **live**
> (un-gated by UXP-4; `LINK_PICKER_ENABLED` remains as a kill switch defaulting on); step 5
> (cross-file) waits on Phase 1. See `guidance/features.md`.

1. ✅ **Same-file link token** `[[#nodeId|label]]` + resolver (click → zoom to target). Links are
   plain editable text in edit mode (not atomic pills); render as a widget in display mode.
2. ✅ **In-memory link index** — `collectLinks(rootNode)` tree-walk, cached on `_varsVer`
   (generalizes the `collectVars`/`collectRules` pattern); returns `{outgoing, backlinks, broken}`.
3. ✅ **Backlink index + backlinks panel** for the current node.
4. ✅ **Quick-switcher / `[[` picker** — **live** (UXP-4 resolved): typing `[[` opens the
   picker (pure `linkCandidates` core); apply writes the live-title form `[[#id|]]`;
   `LINK_PICKER_ENABLED` survives only as a kill switch defaulting on.
   *(backlog: Node links & backlinks)*
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
- ~~Link display: how does a `[[node]]` link render (title snapshot vs live title) and behave on
  click (zoom in current view vs open the target doc)?~~ **Resolved for same-document:** live
  title (`[[#id|]]`), fixed caption (`[[#id|text]]`), or full content mirror (empty label);
  click zooms in the current view. The cross-doc half (open the target doc?) re-opens with
  Phase 2 step 5.
- Where do these docs live long-term — alongside `CLAUDE.md` in the repo, or separate?

---

## Generative / internal-engine ideas (the "balance" side)
Self-contained, additive ideas for the generative engine — good interleaving material
between the heavy PKM phases.

> **Expanded catalogue:** `guidance/enhancement-research.md` consolidates the June 2026
> comparable-tool research (Tracery / Perchance / Ink / Twine / tabletop oracles / Soulver /
> Calca / Frink / Squiggle / Guesstimate / org-mode / TiddlyWiki / Decker) into a ranked
> *inspiration → upgrade* menu — each mapped to a code seam and a P5 verdict — covering the
> generative engine, the computational engine, **and** single-file offline-ness. The bullets
> below are the short list; that doc is the detail (and names which items are deferred-by-lock).

(Shipped items removed: dice success pools, date math,
unit conversion, and **random variables** — a variable whose value is a frozen,
re-rollable grammar pick, the Perchance-style generation model — are **done**; see
`guidance/features.md` and `guidance/generation-direction.md`. The earlier per-expansion
*bound picks* attempt (`{a := …}`, PR #51) was **reverted** and is superseded by random
variables — do not reintroduce it. The oracle was reverted and is listed below as pending.)
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
  **⚠ UXP-20 flag:** as written this is a P5-3 violation — a second path for the same
  capability. It ships only if it *replaces/subsumes* the promote behavior (one `{…}`
  semantics, not two), with the inventory updated; see `ux-remediation.md` UXP-20.
- **Aggregations over children** (`sum`/`count`/`avg` of a subtree) — a render-time subtree
  walk; reuse `markDirty`/`_varsVer` invalidation. **⚠ UXP-20 route:** prefer an `evalMath`
  primitive / `resolveBrace` branch (children-scope functions inside `{…}`) over the
  "new token type" sketch — a new token needs the explicit-decision path. *(heavier)*
- **Decks / bags** (draw without replacement) — ✓ **shipped (2026-06-14) as stateful
  sequences.** `{shuffle|cycle|once|stopping: a|b|c}` — shuffle is the deck (draw without
  replacement, reshuffle when empty); the persisted per-instance state (`pos`/`bag`) rides
  on the **grammar record** and round-trips through the existing `_grammar` OPML attribute
  (the question "OPML-record vs sidecar" resolved in favour of the sidecar record). Pure
  cores `seqParts`/`nextSeqIndex`/`advanceSeq`/`makeSeqGen`; `@` "Deck" door.
  See `guidance/features.md`.
- **Retire the legacy per-feature cores** (`parseDice`/`parseMarkov`) now
  that composition runs through the unified grammar engine — a cleanup refactor that removes
  duplicated code, not a capability add. Defer until the duplication causes friction.
  **Roll tables: done** (June 2026) — the artifact collapsed into grammar entirely (a named
  table IS a one-rule grammar; legacy records migrate on load; `parseRolltable` survives
  migration-only). The decision record is in `ux-remediation.md` UXP-20.
- **Out of scope:** a `{query: tag=…}` / saved-views database layer. (The *links + backlinks*
  half of the old "Tier 3" is now the planned direction — see the phases above; only the
  query/DB part remains out of scope.)
