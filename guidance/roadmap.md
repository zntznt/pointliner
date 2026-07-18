# Pointliner — Roadmap & Plan

Derived from the feature-gap backlog and the direction decisions below. This is the
"how we proceed" document; the gap analysis lives in `guidance/backlog.md`, and the
discoverability / UX strategy in `guidance/ux.md`.

## Decisions locked
1. **Positioning: lead with solo-RPG; the engine stays two-family (#515, decided 2026-07-13).**
   The `{…}`→pill engine keeps both families — GENERATE (dice/grammar/oracles/decks) and COMPUTE
   (math/rollups/estimates/checks) — and the build order may still interleave them (that is a
   build-order question, not a pitch). But the **pitch is single-customer**: the README and the
   first-run framing name the **solo-RPG player** as THE customer, because solo-RPG is the one
   surface where every feature (dice, oracle, grammar, decks, rollups, checks, journal, agenda) is
   wanted by the same person at the same moment. The general-outliner framing is **demoted from
   headline to substrate** ("it is also a sharp computational outliner" as the pleasant surprise).
   Rationale: two independent product reviews converged on this as the top finding — "balance both"
   was a build-order instruction masquerading as positioning, and the two-identity pitch is the PKM
   graveyard (capable, the default for no one). The evidence already leans this way: 13 solo-RPG
   worked cases in `guide/solo-rpg/` vs zero PKM-specific content, and the PKM flank
   (outliner + links + search) is commoditized parity against Obsidian/Logseq/Roam, not preference.
   Costs almost nothing (both engines + the corpus exist); it is a pitch change, not a feature cut.
   *(Supersedes the former "Direction: balance both" — which conflated build order with positioning.
   Build-order interleaving of PKM and generative features is unchanged; only the customer the pitch
   names is now decided.)*
   **Amended (owner, 2026-07-16/17):** the "THE customer" phrasing mistook the founding problem
   for the product. **The identity is the substrate — a tool for thought**: an instrument for
   freeform, adaptable thinking in writing. Solo-RPG is the origin and stays served structurally
   (the discipline builds general instruments and the table's needs are met as instances of them),
   but it is provenance, not positioning — docs, copy, and pitches lead with the tool and do not
   retell the origin story. Canonical statement: `guidance/product-identity.md` §2.
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
6. **Extensibility: declarative data packs only; no code execution while single-`.html`.**
   Plugins = pure-data packs (grammar/variables/emoji) merged into the registries via a
   `<_plugins>` head element. **The app executes no document- or plugin-supplied code as a
   program for as long as it ships as a single, build-free `.html` file** — code plugins,
   functions-as-data, and executable code nodes are out, under the **same revisit trigger as the
   parked version-control pivot** ("Pointliner becomes more than a single file"). Themes-as-packs
   dropped. Full direction + the gate: `guidance/plugins-direction.md`.

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

### Phase 1 — Multi-document foundation (the big lift; Chromium, real disk folder) — ✅ DELIVERED
The largest, least-test-covered phase. Restructures the core single-`root`/single-autosave
assumptions into a workspace + current-document model.

> **Status: ✅ delivered (June 2026).** All five steps shipped, plus the `adoptDoc` state-seam
> that made the rest safe. See the **Multi-document workspace** entry in `guidance/features.md`.
> Because the File System Access picker/permission flow can't be driven headless, this phase was
> verified by a **human manual pass** at each step (the pure cores stayed Node-pinned).

1. ✅ **Capability gate + invite UX** — `showDirectoryPicker` feature-detect; non-Chromium hides
   the workspace and shows a File-menu invite ("open in Chrome/Edge to unlock linked notebooks" +
   Copy link). Single-file mode stays fully functional everywhere.
2. ✅ **Backing folder** — `showDirectoryPicker({mode:'readwrite'})`; handle persisted in IndexedDB;
   `queryPermission`/`requestPermission` reconnect on load; **continuous auto-write** + reopen-from-
   disk + `degradeWorkspace`/verified-reconnect on lost access (`#103`–`#106`).
3. ✅ **Stable per-doc id** — `_docid` in the OPML head, `ensureDocId`, migrate-on-load (`#100`).
4. ✅ **Document switcher UI** — open / create-in-folder / switch / delete `.opml` files; document-
   aware menu; reopen-the-last-doc across reloads (`#107`). *(Rename shipped, `#486` — click the file
   name; `commitFileName` renames via `workspaceFile.move` to a collision-safe target.)*
5. ✅ **Continuous auto-write** — every edit debounced to its file (`flushWorkspaceFile`); localStorage
   autosave kept as the crash buffer; the last-open note persisted + reopened (`#105`).
   *(Plus the `adoptDoc` runtime document-swap chokepoint, `#101`, and the `Ctrl+S` double-fire
   fix, `#102`.)*

> **Decision (2026-06-30) — Document tabs surface the switcher; the single-`root` model is UNCHANGED.**
> A tab strip (`#doc-tabs`, `role="tablist"`) under the toolbar lists the documents you've opened and
> switches between them — but it is a **pure UI layer over the existing `switchWorkspaceDoc → adoptDoc`
> swap**, NOT a move to N-docs-in-memory. **One document stays in memory**; a tab click re-parses from
> disk exactly as the switcher always did. This deliberately keeps the locked "workspace + current-
> document" model: the single global `root`/`nodeMap`/`_varsVer`-caches/autosave-slot are untouched.
> Scope fence (from the tabs feasibility analysis): **N-docs-resident and same-file-twice are OUT** —
> two tabs of one file would collide on node ids, `docId` (→ corrupt cross-doc links), and the shared
> backing file + autosave slot. A tab is one distinct workspace file. Tabs are **Chromium-workspace-
> only** (gated on `workspaceDir`, like the switcher); the non-Chromium one-file-at-a-time tier is
> unchanged. State is `openTabs` (filenames) persisted in IndexedDB (`OPEN_TABS_KEY`); pure cores
> `tabAdd`/`tabClose`/`tabCycle`. Keyboard: `Ctrl/⌘+Shift+]`/`[` (§3). This was not in the original
> roadmap — it is a recorded net-new decision that leverages existing capability, permitted by the
> no-backend / single-`.html` fences.

### Phase 2 — Linking core — ✅ DELIVERED (same-doc **and** cross-file)
**Steps 1–4 are ungated** — they work in every browser on a single document (no folder backing,
no Phase 1 dependency). **Only step 5 (cross-file) requires the gated workspace.** Same-document
Zettelkasten shipped first and everywhere; the multi-file network rode on Phase 1.

> **Status: ✅ delivered (June 2026).** Steps 1–4 + the mirror shipped same-document; **step 5
> (cross-file) is now done too**, via the **CF-1…CF-5** arc on top of the Phase-1 workspace:
> **CF-1** the workspace-wide link index (`scanWorkspace`/`buildWorkspaceIndex` over every `.opml`),
> **CF-2** the `[[docId#nodeId|label]]` token (render + click-to-navigate), **CF-3** the `[[` picker
> spanning the whole folder, **CF-4** cross-doc backlinks ("what links here, across my notebook"),
> **CF-5** cross-doc link-and-create ("+ New note"). See `guidance/features.md`.

1. ✅ **Same-file link token** `[[#nodeId|label]]` + resolver (click → zoom to target). Links are
   plain editable text in edit mode (not atomic pills); render as a widget in display mode.
2. ✅ **In-memory link index** — `collectLinks(rootNode)` tree-walk, cached on `_varsVer`
   (generalizes the `collectVars`/`collectRules` pattern); returns `{outgoing, backlinks, broken}`.
3. ✅ **Backlink index + backlinks panel** for the current node.
4. ✅ **Quick-switcher / `[[` picker** — **live** (UXP-4 resolved): typing `[[` opens the
   picker (pure `linkCandidates` core); apply writes the live-title form `[[#id|]]`;
   the picker is permanently on (the UXP-4 rollout kill switch was retired 2026-07-02).
   *(backlog: Node links & backlinks)*
5. ✅ **Generalize to cross-file** — `[[docId#nodeId|label]]`; the workspace-wide index spans every
   doc in the folder (CF-1…CF-5: token, picker, backlinks, "+ New note"). The cross-file lane is
   complete. *(backlog: Node links & backlinks)*

### Phase 3 — Networked-notes UX — ✅ DELIVERED
- ✅ **Link-and-create while typing** (same-doc "+ New point", `#96`; cross-doc "+ New note", CF-5),
  ✅ **aliases** (`#98` — a reserved `aliases` property feeding the picker + matching), ✅ **unlinked
  references** (`#97` — same-doc; the panel surfaces unlinked mentions with a one-click Link).
  *(Cross-doc unlinked references — scanning other docs' prose — is **deferred**: high cost, secondary
  value; see backlog. Graph view → Phase 4, parked.)*

### Phase 4 — Later
- ⊘ **Graph view** — **parked** (product call: low actionable value for a single notebook; the
  backlinks panel + cross-doc backlinks cover navigation). **daily notes** — ✅ shipped (the Journal /
  daily-notes feature: toolbar button + `/journal`, in-doc append + on-disk file-per-day modes,
  delivered June 2026); **dates + agenda view** — ✅ shipped (`@due`/agenda, 2026-06-13).
  *(backlog: Node links & backlinks / Dates)*

### Beyond the plan — ✅ Whole-folder search (delivered)
Not in the original phases, but the natural everyday gap once the notebook had many docs: **one
search box scans every `.opml` in the folder**. **WS-1** retains the parsed docs in the index and
adds the pure `searchWorkspace` (reusing `parseSearchQuery`/`queryMatchesNode` verbatim — same query
language, exact `is:` across docs); **WS-2** shows a "Found in other notes · N" results list under
the search box, click to switch+zoom. See `guidance/features.md`.

### Interleaving (build order)
Drop a contained generative feature between the heavy phases — e.g. another `evalMath`
primitive, a dice/oracle variant, or a grammar feature — so both engine FAMILIES keep moving and
Phase 1's weight is broken up. (This is a build-order convenience, not a positioning statement:
per decision #1 the PITCH leads with solo-RPG even while the engine stays two-family.)

### Next directions (June 2026)
With Phases 0–3 + cross-file links + whole-folder search delivered, the planned roadmap is
**essentially complete**. The app is now feature-saturated, so the next moves are a judgment call
rather than a fixed plan — **the prioritized value-vs-effort assessment lives in
`guidance/backlog.md` → "What's worth doing next"**. Highest-impact investment =
**lean↔guided discoverability modes**; the rest is interleave-filler or niche. (Daily notes, once the
"best cheap win" here, has since shipped — see Phase 4.) CRDT/version-control stays parked;
mirrors/archive stay shelved.

---

## Open questions to resolve as we go
- ~~Confirm the two foundation defaults above (global addressing, in-memory index).~~ **Resolved:** both shipped (cross-doc `docId` addressing + the in-memory workspace index).
- Phase 1 fallback UX: how gracefully does the app degrade for non-Chromium users — hide the
  workspace UI entirely, or show it disabled with an explanation? **Resolved:** a non-Chromium invite is shown (the workspace UI stays visible with an explanation).
- ~~Link display: how does a `[[node]]` link render (title snapshot vs live title) and behave on
  click (zoom in current view vs open the target doc)?~~ **Resolved for same-document:** live
  title (`[[#id|]]`), fixed caption (`[[#id|text]]`), or full content mirror (empty label);
  click zooms in the current view. The cross-doc half (open the target doc?) re-opens with
  Phase 2 step 5.
- ~~Where do these docs live long-term — alongside `CLAUDE.md` in the repo, or separate?~~ **Resolved:** they live in `guidance/` (dev-facing steering docs), separate from the user-facing `guide/`.

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
*bound picks* **scope** (`ctx.binds`, PR #51) was **reverted** — do not reintroduce that.
The `:=` *operator* itself later shipped as **typed inline variable declaration**
`{name := expr}` + **positional resolution** (`typed-var-declaration-proposal.md`, SHIPPED):
sugar onto the persistent variable system, not the reverted scope.)
- **Oracle (tunable yes/no) — ✅ shipped** (the `@` "Oracle (yes/no)" door; `openOracleDialog`/
  `ORACLE_BANDS`, a likelihood picker over **original** odds bands building an anonymous
  `Yes N | No M` weighted-alt pill). The earlier version that copied a published oracle's tables
  verbatim was reverted; the shipped one uses original bands. **IP guardrail (still binding for any
  future tweak):** odds bands and any result/word tables must be **original or user-defined** — do
  **not** copy specific values from any published oracle system; the mechanic is fine, only the data
  has to be your own.
- **Dice:** reroll-once (`rK`) — ✅ shipped (`4d6r1`). Still open: extend success pools with
  bane/botch counting (`generative-status.md` marks bane/botch won't-do).
- **Math:** more `evalMath` primitives as wanted (date-format variants, more units) — all
  additive, no architecture change.
- **Inline quick syntax** `{= expr}` / `{NdM}` that evaluates at render *without* a stored
  record — an additive second syntax alongside `[[type:key]]`. **Not shipped, and not as written:**
  the typed `{…}` shorthand that *promotes* to a stored pill **did** ship (you can type `{2d6}`/`{= …}`
  and get a pill — `promoteInlineShorthand`/`classifyBraceBody`), which covers the user-facing need.
  The render-only-without-record variant remains a P5-3 violation (a second path for the same
  capability) and ships only if it *subsumes* the promote behavior, one `{…}` semantics, not two; see
  `ux-remediation.md` UXP-20.
- **Aggregations over children** (`sum`/`count`/`avg`/`min`/`max` of a subtree) — ✅ **shipped as
  B1.** It took exactly the UXP-20-preferred route below: a render-time substitution before
  `evalMath` (`expandAggExpr`/`aggregateChildren`), no new token type, reusing `_varsVer`
  invalidation. `{= words(subtree|self|children)}` later joined the family over prose. See
  `guidance/features.md`.
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
- **Query pill: SHIPPED** (2026-07-02, owner call reversing the deferral below). A
  `{query: <search>}` pill renders a live list of matching points inline, recomputed each
  render, reusing `parseSearchQuery`/`queryMatchesNode` verbatim over the shared pure core
  `queryRows`. It is a **rendering of the live data, not a stored view** — no saved-view
  store, no query language of its own, no DB. **"Bases as queries"** (a base VIEW whose rows
  come from the same `queryRows` core) is the planned base-form sibling, the reason the core
  is factored out. See the register (QP-1).
- **Still out of scope:** a **saved-views database layer** (a store of named, persisted views
  as a data model). Resolved in full 2026-07-16 (`guidance/saved-views-proposal.md`): one-shot
  authored sort (SV-1) and a query base's config sort (SV-2) shipped as data operations /
  renderings; the persisted display predicate (SV-3) and the named view library (SV-4) are
  recorded NOes. The query pill and the query base (shipped: QP-2 Phases A, B, C) are renderings
  of the outline, never a second base of the data; the views DB is the thing that stays out.

## Bases program — complete (2026-07-16)

The bases suite ran its full arc under owner direction: a 4-lane adversarial review, four
improvement rounds (correctness; model/perf consolidation; UX coherence; measured baseline +
two recorded structural noes in `bases-direction.md` §7c), then the below-the-line pass
(QP-2 Phases B + C, FR-1 per-role editors, `var:` over projections, SV-1/SV-2). Every item in
`bases-direction.md` §4's deferred list is now shipped or a recorded, deliberate no; the only
revisit triggers are written beside their decisions (§7c, `saved-views-proposal.md`). Ledgers:
`bases-direction.md` §4 + §7b/§7c (records), `performance.md` §Bases (the measured envelope).
