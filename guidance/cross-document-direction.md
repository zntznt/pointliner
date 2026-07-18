# Cross-document interactions: direction study

**Status: ACTIVE direction (owner-directed, 2026-07-18).** The owner's call: *"we do want
cross-document interactions. not just aggregation but linking, mirroring, transclusion, graph
view, etc. we need to find what could make these work, the costs, etc. the argument against
these would be about performance and stability."* This supersedes the hedged "weigh hard
against the per-document identity" note in `user-research-2026-07.md` — the identity question
is settled in favor; what remains is engineering: mechanism, cost, staleness, and order.

This study inventories what already exists, measures the real costs at three folder scales,
analyzes each member of the family, and proposes an order. Nothing here is shipped by this
document; each phase is its own PR train with its own conformance gate.

---

## 1. What already exists (more than it looks)

The multi-doc lane has been building the substrate for this family for a while. Inventory,
by function name:

- **Cross-doc links, full loop (CF-1..CF-5, shipped June 2026).** `[[docId#nodeId|label]]`
  tokens; `buildWorkspaceIndex` (the CF-1 index); navigation via `switchWorkspaceDoc` (CF-2);
  the folder-spanning `[[` picker (CF-3, `idx.candidates`); cross-doc backlinks
  (`workspaceBacklinks`, CF-4); link-and-create "+ New note" (CF-5).
- **The workspace index retains every doc's parsed tree.** `buildWorkspaceIndex` returns
  `roots: Map<docId, root>` (WS-1) — added so whole-folder search could run the real query
  engine (`queryMatchesNode`) over other docs' trees. This is the load-bearing fact of the
  whole study; see §2.
- **Whole-folder search** (WS-1): the full operator set runs verbatim over retained roots,
  with per-doc context (`allSequences(root)` / `collectVars(root)`) computed lazily per doc
  when an `is:` term needs it. This is already a cross-document *compute* feature in
  production, and it works.
- **Refresh model:** `refreshWorkspaceIndex()` → `scanWorkspace(dir)` re-reads and re-parses
  every `.opml` in the folder. Called on workspace/FS events only (connect, reopen,
  reconnect, switch, new doc, delete, save-to, journal-file create, sync-conflict resolve) —
  deliberately NOT per-edit; `workspaceIndex` is not a `_varsVer` doc-cache.
- **Stability machinery that already exists:** `reconcileDuplicateDocIds` (docId collisions
  from file copies), the `_wsKnownModified`/`_wsKnownSize` fingerprints (#840, torn/foreign
  writes on the *active* file), `safeWriteOpml` (atomic create), the sync-conflict dialog
  (#842/#845), `unmarkedFilesNote` (#845, files without a `<_docid>` are counted, not
  silently dropped).
- **The explicit v1 fence to lift:** `renderCrossLinkPill` is "title-only (no
  mirror/transclusion across docs in v1)" — its own comment names this as a v1 boundary,
  not a permanent one.
- **The graph is same-doc only:** `renderGraph` feeds `graphModel(collectLinks(), …)` — the
  live root's links, nothing from the index.

## 2. The load-bearing fact: "one root in memory" governs EDITING, not reads

The roadmap's locked decision (one `root` in memory, no N-resident documents) is about the
*editable* document: one mutable tree, one undo stack, one autosave target, one set of
per-generation caches. That decision stands and nothing here touches it.

But reads are already N-resident: `workspaceIndex.roots` holds every doc's parsed tree, and
whole-folder search already walks them. So the entire cross-document family — mirroring,
transclusion, aggregation, graph, backlink previews — can be built as **read-only features
over the existing index**, plus a liveness upgrade (§5). No rearchitecture, no second
editable root, no change to the undo/autosave/cache model. Write-through (editing another
doc's point from here) is the one member that would break this frame, and it stays out
(§4e).

## 3. Measured costs (2026-07-18, commit 01588f9, headless Chromium on this container)

Method: synthetic folders built in-page (realistic point text; a `#task` tag on 1/4 points,
a `cost` prop on 1/4, a cross-doc link on 1/20), timed with `performance.now()`, heap via
`performance.memory`. The scan timing excludes file IO (it times `fromOpml` per doc +
`buildWorkspaceIndex`, the CPU side of `scanWorkspace`); disk reads add real but
OS-cache-friendly time on top. Re-run before citing these against a different build.

| Folder | Parse all docs | Build index | Retained heap | Folder-wide agg walk | Graph layout (320 iter) |
|---|---|---|---|---|---|
| 10 docs × 500 pts (5k) | 47 ms | 9 ms | ~3 MB | 1.5 ms | **1.05 s** @ 500 linked pts |
| 50 docs × 1k pts (50k) | 347 ms | 62 ms | ~16 MB | 5.7 ms | **21 s** @ 2,000 linked pts (capped) |
| 200 docs × 1k pts (200k) | 1,477 ms | 112 ms | ~104 MB | 30.8 ms | (same wall; 20k linked pts exist) |

Readings:

- **Scanning is cheap and already background.** Even a vault-scale folder parses in ~1.5s
  off the interaction path. A realistic notebook (10–50 docs) is 50–400 ms. Full-folder
  rescan on workspace events remains fine; per-edit rescan would not be, and stays banned.
- **Memory is fine at notebook scale, a real ceiling at vault scale.** ~0.5 KB/point
  retained. 104 MB at 200k points is tolerable on desktop but names the boundary: the
  feature family targets a *notebook* (tens of docs), not Sam's 4,000-note vault — which is
  already the product's stated non-target. If extreme folders appear, the escape hatch is
  dropping `roots` for docs over a size budget (index keeps titles/links; search/compute
  degrade per-doc with a visible note), not a rearchitecture.
- **Folder-wide aggregation is computationally a non-issue.** A full walk of every tree
  with a text match + prop read is 1.5–31 ms across the scales. The caveat: the benchmark
  walk is text-match-dominated (a bare regex + prop lookup); the real `queryMatchesNode`
  with per-doc seqs/vars costs a small multiple of that. Budget 2–5×: still tens of ms at
  vault scale, single-digit ms at notebook scale. The rule that makes it safe is **memoize
  on the index generation** (§5) — never walk per keystroke-render. An un-memoized folder
  reducer inside `renderMathPill` would run on every render pass and would be felt.
- **The graph is the one genuine performance wall.** The shipped force layout is
  O(N²)·320 iterations: 1 s at 500 linked points, 21 s at 2,000. A folder all-points graph
  is infeasible with this layout, full stop. A **doc-level** graph (docs as nodes, edges =
  link counts between docs — 10–200 nodes) is trivial, and a **neighborhood** graph (the
  current point ± 2 hops) is bounded by construction. Those are the two shapes to build;
  an all-points folder graph is rejected on measurement, not taste.

## 4. The family, member by member

### 4a. Cross-doc mirror / transclusion — first; cheapest; lifts a named v1 fence

`[[docId#nodeId|]]` (the explicit empty-label mirror form, #805/UXP-204) currently renders
title-only across docs. Render the target's content instead, from `workspaceIndex.roots`:

- **Mechanism:** in `renderCrossLinkPill`, when the label is empty and the index holds the
  target doc's root, find the node and render via the existing `renderNodeInline`
  discipline — save the render-context globals, set them for the *target doc's* node
  (sidecar lists come from the node itself; vars/rules need `collectVars(targetRoot)` /
  `collectRules(targetRoot)`, the explicit-root pure forms, cached per (docId, index
  generation)), render, restore. The same depth-guard (nested mirror renders title-only)
  already caps recursion; it must also cap *cross-doc* chains (A→B→A).
- **Staleness story:** the mirror shows the target **as last saved on disk** (the index is
  scan-fed). That is honest — the other document *is* its file — but it must be visible:
  the mirror pill's tooltip/aria carries "as saved" (and the §5 liveness upgrade shrinks
  the window). Same-doc mirrors stay live via the existing path; a `docId === root.docId`
  token already delegates to the same-doc pill.
- **Cost:** render-time only, per visible mirror; no new storage, no new syntax (the token
  form already exists and is documented). Risk is low; the render-context save/restore is
  the one place to be exact (CLAUDE.md already documents the discipline).

### 4b. Folder graph — second; doc-level first, neighborhood second, all-points rejected

- **Doc-level graph:** nodes = documents (from `idx.nameByDocId`), edges = aggregated
  cross-doc link counts (from `idx.outgoing` where `srcDocId !== dstDocId`), edge weight =
  count. 10–200 nodes: the existing `graphLayout`/`graphModel` handle it unchanged. Click a
  doc-node → switch to it (CF-2's `switchWorkspaceDoc`); click an edge → a list of the
  underlying links. Fits the existing graph panel; the door is a scope toggle in the panel
  head (`This document | Folder`), not a new surface.
- **Neighborhood graph (later, optional):** the current point + N hops across docs, bounded
  (cap ~150 nodes, "+K more" affordance). Gives the Obsidian-style local view without the
  layout wall.
- **All-points folder graph: rejected on measurement** (21 s at 2k linked points). Revisit
  only with a different layout algorithm (Barnes-Hut / WebGL), which is a dependency-shaped
  cost this single-file app does not want.

### 4c. Folder-scoped aggregation and queries — third; needs the §5 spine first

Sam's `{= sum("#project cost", cost)}` across the folder, plus folder-scoped `{query:}` /
`{count:}` / `{roll:}` pills.

- **Syntax (P5):** no new syntax. The query reducers and query pills already take a scope
  vocabulary (`self|children|subtree|N`); add one word, `folder`, to the existing scope
  argument — `{= sum("has:cost", cost, folder)}`, `{query: #openq folder}` (exact spelling
  to be fixed at build time against the existing scope-parse points; the principle is
  recorded here: a scope word in the existing slots, never a new delimiter). Without the
  word, everything stays per-document exactly as today.
- **Mechanism:** `queryReduce`/`queryRows` gain a folder arm that walks
  `workspaceIndex.roots` — the *same* walk whole-folder search already does, with the same
  per-doc lazy context. Own doc contributes its **live** tree (the live root replaces the
  index's stale copy of self); other docs contribute as-saved.
- **The two rules that make it safe:**
  1. **Memoized on the index generation** (§5): computed once per (generation, query,
     prop), never per render pass. The measured walk is 1.5–31 ms; memoized it is a map hit.
  2. **Staleness is explicit (P4):** the pill's tooltip/aria says "across N documents, as
     saved". A folder total that silently lags a doc edited yesterday in another window is
     exactly the silent-wrong-value class #887–#889 just eliminated; this family must not
     reintroduce it. Empty index / no workspace → the folder scope resolves to the
     document scope with a visible cue, never a silent 0.
- **Cost:** small engine arms + the memo layer. The dominant work is §5.

### 4d. Cross-doc backlink context previews — cheap, rides along

`workspaceBacklinks` returns titles; the backlinks panel could show the source line's
snippet, and `wsSnippet` (UXP-64) already computes exactly that for workspace search.
Reuse it in the panel. Small, do it with 4a.

### 4e. Out (recorded, revisit-gated): write-through and implicit cross-doc namespaces

- **Editing another doc's point from here** (via a mirror, a folder query row, or a
  cross-doc board) breaks the one-editable-root model: it needs a second dirty/undo/
  autosave lane and reintroduces every sync/conflict hazard per foreign doc. Out until the
  read-only family is shipped and stable; revisit trigger: the read family in daily use +
  a concrete ask.
- **Implicit cross-doc variable/rule resolution** (`{other-doc's-var}` just working) —
  name collisions across a folder are silent and unscoped; the doc-cache model
  (`_varsVer`) has no cross-doc invalidation. If sharing is wanted, the existing
  **data-pack** lane (`plugins-direction.md`) is the sanctioned shape for shared
  rules/vars. Explicitly-addressed forms (a future `{doc:name.var}`) would be a new
  syntax-inventory decision — not part of this study.

## 5. The spine both 4b and 4c need: index liveness + generation

The real engineering (and the stability half of the owner's caution) is not any single
feature — it is making the index a dependable substrate:

1. **A generation counter.** `workspaceIndex.gen`, bumped on every successful
   `refreshWorkspaceIndex`. Every cross-doc memo (folder reducers, per-doc
   `collectVars(root)` caches, the doc-level graph model) keys on it. This is the
   cross-doc twin of `_varsVer`, with the same registry discipline: one generation, every
   cache checks it, a new cache joins the list or it silently serves stale data.
2. **Incremental rescan.** Today every event re-parses the whole folder; fine at 50–400 ms,
   but the liveness upgrade wants more frequent refreshes. FSA has no file watcher, so:
   poll or opportunistically check `lastModified`/`size` per file (the #840 fingerprint
   model, generalized from the active file to the folder) and re-parse **only changed
   files**, merging into the index. Full rescan stays the fallback and the correctness
   anchor.
3. **Own-doc liveness.** The index's copy of the *current* doc is stale from the last disk
   write. Every cross-doc read path must substitute the live `root` for
   `roots.get(root.docId)` (whole-folder search already excludes the current doc for this
   reason; the folder reducers must include it, live).
4. **Refresh-on-save.** The autosave/folder-write debounce already fires on edit; after a
   successful folder write of the current doc, bump the own-doc entry (cheap: re-point
   `roots` at the just-serialized tree or re-parse the one file) instead of waiting for
   the next workspace event. This closes most of the staleness window for the common
   "edited it a minute ago in this window" case.
5. **Failure honesty (P4).** A doc that fails to parse during rescan keeps its previous
   index entry and is counted (the `unmarked`/skip model already does this for missing
   docIds); any folder-scoped answer computed while entries are stale-or-skipped can name
   it ("across 12 of 13 documents"). Torn sync writes are the known hazard; the fingerprint
   check before re-parse is the guard.
6. **Memory budget.** Notebook scale is a non-issue (§3). Record the escape hatch now so
   it is a policy, not an emergency: past a size budget (e.g. >100k points folder-wide),
   drop retained roots for the largest docs and degrade those docs to index-only
   (titles/links work; folder search/compute skip them with a visible count). Never crash,
   never silently miscount.

## 6. Recommended order

1. **Spine first, minimally:** the generation counter + own-doc liveness + refresh-on-save
   (§5.1, 5.3, 5.4). Small, unblocks everything, hardens what is already shipped.
2. **4a mirror/transclusion + 4d backlink previews** — the visible payoff, cheap, no new
   syntax, lifts a named v1 fence.
3. **4b doc-level folder graph** — bounded by construction, reuses the panel.
4. **4c folder-scoped reducers/queries** — the deepest one; by now the memo/staleness
   substrate exists. Incremental rescan (§5.2) lands with or just before this.
5. Neighborhood graph, and any 4e revisit, strictly after the above are in daily use.

Each step is a normal PR with tests on the pure cores (`buildWorkspaceIndex` extensions,
the doc-graph model, the folder reducer arm, the incremental-merge function) and the UX
gate on every surface.

## 7. Bookkeeping

- `user-research-2026-07.md`'s "cross-document aggregation" wish: the "weigh hard against
  the identity" caveat is superseded by the owner's 2026-07-18 direction; the wish now has
  this lane. (Sam's *vault migration* remains a non-goal; the target is the notebook.)
- `renderCrossLinkPill`'s "no mirror across docs in v1" comment: v2 is 4a here.
- The perf table in §3 is dated and commit-tagged per `performance.md` discipline; re-run
  the harness (the method is described inline) before claiming regressions or wins against
  a different build.
