# The Outliner Frontier: What Ships vs. What's Genuinely Unbuilt

**Scope:** offline-capable, single-user, local-first outliners — profession-agnostic primitives evaluated for leverage by a writer, project manager, software engineer, and data scientist.
**Method:** 5 parallel research angles across ~30 tools and plugin ecosystems, primary-source fetches (docs, changelogs, manuals), followed by adversarial verification agents tasked with refuting every UNBUILT verdict via counterexample hunting (HN, Product Hunt, GitHub, plugin registries). Researched June 11, 2026.

---

## Verdict table


| #   | Capability                                                                           | Verdict                                  | Closest existing                                                                                                                                                                                                                       | Confidence |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| B1  | Typed fields + rollups up the tree                                                   | **EXISTS**                               | org-mode column view (recursive summaries); OmniOutliner; Tana (column calcs only, no formula fields)                                                                                                                                  | High       |
| B2  | Saved queries as live nodes                                                          | **EXISTS**                               | org agenda/sparse trees; Logseq `{{query}}`; Obsidian Bases (core, 2025); Tana live search                                                                                                                                             | High       |
| B3  | Transclusion / mirrors                                                               | **EXISTS**                               | Workflowy mirrors; Logseq embeds; org-transclusion (refresh-based)                                                                                                                                                                     | High       |
| B4  | Multiple projections of one tree                                                     | **EXISTS (with a node-granularity gap)** | Tana views; Obsidian Bases (note-granular, not node-granular); Workflowy boards                                                                                                                                                        | High       |
| B5  | Executable code nodes                                                                | **EXISTS (one mature impl.)**            | org-babel; plugins elsewhere                                                                                                                                                                                                           | High       |
| B6  | Node ↔ local-file binding                                                            | **EXISTS**                               | org-attach; OmniOutliner attachments                                                                                                                                                                                                   | High       |
| B7  | Scripting/plugin APIs                                                                | **EXISTS**                               | Bike 2 (JS extensions, CLI, MCP server); Omni Automation; Obsidian/Logseq APIs; Leo                                                                                                                                                    | High       |
| F1  | Tree-aware version control (subtree branch/diff/merge, node identity, field history) | **UNBUILT**                              | Loro movable-tree & Automerge 3 (libraries); Ink & Switch Patchwork (prose prototype); Gingko (whole-doc time-scrub); SiYuan/AFFiNE (linear snapshots); org-merge-driver (abandoned 2012)                                              | High       |
| F2  | Cross-node constraints / outline lint                                                | **UNBUILT**                              | Tana per-field soft warnings; TreeLine math fields; Obsidian Propsec & Schema (per-note frontmatter lint); Trilium inverse relations; Coda row validation (cloud, table-scoped)                                                        | High       |
| F3  | Uncertainty-native fields (distributions + Monte Carlo rollup)                       | **UNBUILT**                              | org column `est+` (low-high pairs — the lone outline-native gesture); Guesstimate (cloud grid, dormant); Squiggle (code); Analytica, TreeAge, @RISK (specialized desktop)                                                              | High       |
| F4  | Resumable execution state on a tree                                                  | **UNBUILT (tree criterion only)**        | Atuin Desktop (per-block state survives restarts — but strictly linear blocks, Nov 2025); Braintree Runbook (tree + resume, but Ruby CLI); org-babel (sessions die on restart)                                                         | High       |
| F5  | Enforced tree grammars (required children, validated live)                           | **UNBUILT**                              | Tana supertags (scaffold + warnings "visual only"); TreeLine child-type limits; oXygen XML (full concept, wrong domain)                                                                                                                | High       |
| F6  | Subtree-level churn/staleness/growth analytics                                       | **UNBUILT as built-in**                  | Obsidian Activity Heatmap (per-day/per-file); Scrivener targets; org clock analyzers; staleness = DIY Dataview recipes                                                                                                                 | Mod-high   |
| F7  | Live two-way projection: subtree ⇄ on-disk foreign file                              | **PARTIAL**                              | Leo/LeoJS @file/@clean (code/text — shipping and maintained, June 2025 release); org tangle/detangle (fragile); Scrivener external-folder sync (prose text only). Unbuilt for rich formats (docx/xlsx) and as a modern general feature | High       |


---

## Part 1 — The commodity baseline (conceded)

Everything in the "obvious advanced" tier ships today, mostly in org-mode alone: recursive column summaries (`+`, `min`, `mean`, `est+`), agenda queries, transclusion, babel execution, attachments, Elisp everywhere. Tana covers fields/queries/views but is architecturally sync-first (offline *mode* since Nov 2025: personal workspaces editable, AI/Publish disabled). Workflowy works fully offline but needs an account; Roam remains cloud-first. Obsidian Bases (core plugin, GA Aug 2025) brought database views to local Markdown — but its unit is the **note**, not the outline node.

That note-vs-node distinction is the one live gap in the baseline: node-granular typed data in a genuinely local-first tool is itself nearly vacant territory (Tana has the data model but not local-first; Obsidian has local-first but not node granularity; Logseq DB sits between and remains beta as of mid-2026).

## Part 2 — The open frontier, in order of leverage

### F1. Tree-aware version control — the largest prize

Branch a subtree, edit both variants, structurally diff (moves understood as moves, not delete+add), three-way merge, scrub any node's field history. Nothing ships this. Scrivener snapshots are linear per-document text copies; users have begged for branching on the forums for years. Git-on-markdown founders on line-orientation. The primitives arrived recently — Loro's movable tree (stable node IDs, fractional indexing, time travel, forks) was built *explicitly* citing outline notes as the use case, and Automerge 3 (2025) does fork/merge — but adopters so far are an analytics tool and a notebook, no outliner. Ink & Switch's Patchwork remains a prose research prototype.

- **Writer:** alternate endings as branches; merge back the one good paragraph. **PM:** baseline at kickoff, structural diff for the steering meeting. **Engineer:** design-doc evolution matching git intuition. **Data scientist:** the forking-paths audit trail — every analysis variant preserved.
- **Why open:** requires node identity, which file-format tools structurally lack; cloud-DB tools have identity but no merge UI incentive. Newly feasible via CRDT libraries.

### F2. Cross-node constraints (outline lint)

Declarative invariants spanning levels — sibling percentages sum to 100, child dates inside parent range, total ≤ budget — surfaced as lint, ideally solved bidirectionally. Verified absent everywhere: Tana's validation is per-field and "visual only"; Propsec/Obsidian Schema lint frontmatter per-note; Trilium enforces only relation symmetry; even the PM canon's "100% rule" for WBS has no tool that checks it. TreeLine computes across nodes but validates nothing.

- **Writer:** continuity rules (a character can't appear after their death date). **PM:** schedule/budget invariants checked like a compiler. **Engineer:** spec-coverage invariants. **Data scientist:** methodology preconditions ("no result node without a sample-size field").

### F3. Uncertainty-native fields

Ranges/distributions as field values, propagating up the tree via Monte Carlo. The demand was proven by Guesstimate (now dormant, cloud, grid-shaped); Squiggle keeps the semantics alive as a *language*; Analytica/TreeAge prove desktop feasibility in specialist form. org-mode's `est+` summary (combining low-high estimates up the tree) is the only outline-native trace — a 15-year-old hint nobody extended. No PKM/outliner plugin exists (verified across registries).

- **PM:** plans that admit they're uncertain — confidence intervals on the ship date, rolled up. **Data scientist:** Fermi decomposition and power calcs in the planning doc itself. **Engineer:** estimate ranges instead of point fictions. **Writer:** weakest fit (word-count forecasting).

### F4. Resumable execution on a tree

A program counter over nodes, per-node captured inputs/outputs, pause Friday/resume Monday. Atuin Desktop (local-first, open source) closed the hard persistence problem in Nov 2025 — block outputs and variables survive restarts — but is deliberately linear ("each block can only influence the blocks below it"). Braintree's Runbook gem proves tree + resumability, but as Ruby code. The combination — Atuin's persistence × outline structure (nested steps, collapse finished phases, hoist the active one) — is unclaimed.

- **Engineer:** runbooks/migrations with state. **Data scientist:** multi-day pipelines as living documents. **PM:** processes that remember where they stopped. **Writer:** least relevant.

### F5. Enforced tree grammars

Node types whose required fields *and required child structure* validate live, with scaffolding. Every tool stops at type-as-template: Tana scaffolds then merely warns; Anytype/Capacities don't validate; TreeLine limits child *type choices* without requiring anything. oXygen XML proves the full UX (auto-insert required children, red/yellow violation icons in the outline view) — in an XML editor. Cheap to build relative to F1; pairs naturally with F2 (grammar = structural constraints, lint = value constraints).

- All four personas get the same thing: templates that can't silently rot — experiment protocols, ADR formats, scene cards, WBS shapes.

### F6. Subtree analytics (profiler for your outline)

Churn heatmaps by *subtree* (not per-day), staleness detection, growth-over-time. Existing analytics are vault-wide counters or daily activity squares; staleness remains a DIY Dataview recipe. Easiest frontier item to build; depends on edit history, so it falls out of F1 nearly free.

### F7. Two-way file projection

A subtree materialized as an on-disk file whose edits flow back. **Exists for code/text** — Leo's @file/@clean has done move-aware round-trip for 25+ years and ships actively as LeoJS in VS Code (v1.0.11, June 2025); org-babel detangle is the fragile cousin; Scrivener syncs prose text (losing hierarchy metadata). **Unbuilt for rich formats** — the docx/xlsx leg founders on pandoc-class lossiness, by pandoc's own manual. Honest scope: text formats round-trip, rich formats export.

## Part 3 — Synthesis

The seven frontier items aren't independent. F1, F2, F3, F5, F6 share one prerequisite the current ecosystem splits on: **stable node identity over a real data model**, locally owned. Plain-file tools (org, Obsidian) can't cheaply have it; identity-bearing tools (Tana, Roam) put the database in the cloud; SiYuan/Logseq-DB have local identity but build none of these primitives on it. That architectural fork — not any single feature — is why the frontier looks the way it does.

So the boundary-pushing offline outliner is approximately: **a local CRDT node store (Loro-class) exposing version control (F1) as the foundation, with constraints+grammar (F2+F5) as the checking layer, uncertainty (F3) as the numeric layer, and resumable execution (F4) as the active layer.** F6 falls out of F1's history; F7 is the interop story, scoped honestly to text.

Priority by breadth of persona leverage: **F1 > F2+F5 > F3 > F4 > F6 > F7** — with the note that F2+F5 and F6 are dramatically cheaper than F1, and F3 is a weekend of math on top of typed fields (the hard part, distribution UX, is design not engineering).

---

## Key sources

- org-mode column view & summaries: [https://orgmode.org/manual/Column-attributes.html](https://orgmode.org/manual/Column-attributes.html) · babel: Org manual §16 · tangle/detangle: [https://orgmode.org/manual/Extracting-Source-Code.html](https://orgmode.org/manual/Extracting-Source-Code.html)
- Obsidian Bases changelogs: [https://obsidian.md/changelog/2025-08-18-desktop-v1.9.10/](https://obsidian.md/changelog/2025-08-18-desktop-v1.9.10/) · [https://obsidian.md/changelog/2025-10-01-desktop-v1.10.0/](https://obsidian.md/changelog/2025-10-01-desktop-v1.10.0/) · roadmap: [https://obsidian.md/roadmap/](https://obsidian.md/roadmap/)
- Tana fields/validation ("warning is visual only"): [https://outliner.tana.inc/learn/features/fields](https://outliner.tana.inc/learn/features/fields) · offline mode: [https://outliner.tana.inc/blog/tana-desktop-now-works-offline-your-knowledge-graph-anywhere](https://outliner.tana.inc/blog/tana-desktop-now-works-offline-your-knowledge-graph-anywhere) · node history request: [https://ideas.tana.inc/posts/20-nodes-historyversions](https://ideas.tana.inc/posts/20-nodes-historyversions)
- Workflowy mirrors/offline: [https://workflowy.com/learn/mirrors/](https://workflowy.com/learn/mirrors/) · [https://blog.workflowy.com/workflowy-goes-offline/](https://blog.workflowy.com/workflowy-goes-offline/)
- Bike 2 releases (JS extensions, CLI, MCP): [https://www.hogbaysoftware.com/bike/releases2/](https://www.hogbaysoftware.com/bike/releases2/)
- Logseq DB beta status: [https://github.com/logseq/logseq](https://github.com/logseq/logseq)
- Scrivener snapshots (linear): [https://www.literatureandlatte.com/blog/use-snapshots-in-scrivener-to-save-versions-of-your-projects](https://www.literatureandlatte.com/blog/use-snapshots-in-scrivener-to-save-versions-of-your-projects) · branching requests: [https://forum.literatureandlatte.com/t/feature-version-control-branching-inheritance-of-sections/139484](https://forum.literatureandlatte.com/t/feature-version-control-branching-inheritance-of-sections/139484) · external folder sync: [https://forum.literatureandlatte.com/t/auto-sync-to-external-folder/8368](https://forum.literatureandlatte.com/t/auto-sync-to-external-folder/8368)
- Loro movable tree (cites outliners): [https://loro.dev/blog/movable-tree](https://loro.dev/blog/movable-tree) · Automerge 3: [https://automerge.org/blog/automerge-3/](https://automerge.org/blog/automerge-3/) · Patchwork: [https://www.inkandswitch.com/project/patchwork/](https://www.inkandswitch.com/project/patchwork/)
- org-merge-driver (GSoC 2012, abandoned): [https://orgmode.org/worg/org-contrib/gsoc2012/student-projects/git-merge-tool/proposal.html](https://orgmode.org/worg/org-contrib/gsoc2012/student-projects/git-merge-tool/proposal.html)
- Gingko Writer history scrubbing: [https://gingkowriter.com/](https://gingkowriter.com/)
- TreeLine typed trees/math fields: [https://treeline.bellz.org/feature.html](https://treeline.bellz.org/feature.html)
- Obsidian Propsec (frontmatter schema lint): [https://github.com/ccmdi/propsec](https://github.com/ccmdi/propsec) · Obsidian Schema: [https://briansunter.com/projects/obsidian-schema](https://briansunter.com/projects/obsidian-schema)
- Trilium inverse relations: [https://docs.triliumnotes.org/user-guide/advanced-usage/attributes/relations](https://docs.triliumnotes.org/user-guide/advanced-usage/attributes/relations)
- Guesstimate (dormant, OSS): [https://github.com/getguesstimate/guesstimate-app](https://github.com/getguesstimate/guesstimate-app) · Squiggle: [https://www.squiggle-language.com/](https://www.squiggle-language.com/) · Analytica: [https://en.wikipedia.org/wiki/Analytica_(software)](https://en.wikipedia.org/wiki/Analytica_(software)) · TreeAge: [https://www.treeage.com/](https://www.treeage.com/)
- Atuin Desktop execution engine (persistence, linearity): [https://blog.atuin.sh/introducing-the-new-runbook-execution-engine/](https://blog.atuin.sh/introducing-the-new-runbook-execution-engine/) · Braintree Runbook (tree+resume, CLI): [https://github.com/braintree/runbook](https://github.com/braintree/runbook) · Runme sessions: [https://docs.runme.dev/usage/auto-save/](https://docs.runme.dev/usage/auto-save/)
- org-babel session loss: [https://kitchingroup.cheme.cmu.edu/blog/2015/03/19/Restarting-org-babel-sessions-in-org-mode-more-effectively/](https://kitchingroup.cheme.cmu.edu/blog/2015/03/19/Restarting-org-babel-sessions-in-org-mode-more-effectively/)
- oXygen outline validation/scaffolding: [https://www.oxygenxml.com/xml_editor/xml_outliner.html](https://www.oxygenxml.com/xml_editor/xml_outliner.html)
- Leo round-trip: [https://leo-editor.github.io/leo-editor/tutorial-basics.html](https://leo-editor.github.io/leo-editor/tutorial-basics.html) · LeoJS (maintained 2025): [https://boltex.github.io/leojs/](https://boltex.github.io/leojs/)
- Obsidian Activity Heatmap: [https://github.com/zakhij/obsidian-activity-heatmap](https://github.com/zakhij/obsidian-activity-heatmap) · Vault statistics: [https://github.com/jtprogru/obsidian-vault-full-statistics-plugin](https://github.com/jtprogru/obsidian-vault-full-statistics-plugin) · Git Changelog: [https://github.com/shumadrid/obsidian-git-changelog](https://github.com/shumadrid/obsidian-git-changelog)
- Scrivener statistics/targets: [https://www.literatureandlatte.com/blog/track-statistics-and-targets-in-your-scrivener-projects](https://www.literatureandlatte.com/blog/track-statistics-and-targets-in-your-scrivener-projects) · clj-org-analyzer: [https://github.com/rksm/clj-org-analyzer](https://github.com/rksm/clj-org-analyzer)
- SiYuan snapshots: [https://github.com/siyuan-note/siyuan/releases](https://github.com/siyuan-note/siyuan/releases) · AFFiNE history limits: [https://github.com/toeverything/AFFiNE/issues/13717](https://github.com/toeverything/AFFiNE/issues/13717)
- pandoc lossiness: [https://pandoc.org/MANUAL.html](https://pandoc.org/MANUAL.html) · Tinderbox watched folders (one-way): [https://acrobatfaq.com/atbref10/index/Import/Watched_folders/Notes.html](https://acrobatfaq.com/atbref10/index/Import/Watched_folders/Notes.html)
- WBS 100% rule (doctrine, unenforced): [https://www.workbreakdownstructure.com/100-percent-rule-work-breakdown-structure](https://www.workbreakdownstructure.com/100-percent-rule-work-breakdown-structure)

&nbsp;
