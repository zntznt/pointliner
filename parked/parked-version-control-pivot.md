# PARKED — The Version-Control Pivot (Path B), full record

> **STATUS: PARKED. NOT ACTIVE DIRECTION. DO NOT BUILD.**
> This captures a researched, spiked, and decided-upon *future* direction so it can be revived intact.
> It is deliberately **not** in `CLAUDE.md`'s "read before building" list — it must not be mistaken for
> the current plan (the arrays-direction lesson). The active roadmap is unchanged.
>
> **Revisit trigger:** *if and when Pointliner becomes "more than a single file"* — i.e. once you've
> accepted a build step / a packaged-app shell for other reasons. Until then, this stays parked.
>
> **One-line summary:** make Pointliner the only local-first outliner with real **branch / structural-
> diff / merge / per-node history**, by replacing the in-memory document with a CRDT (Loro). Spiked
> June 2026 → **feasible (YELLOW)**. The blocker isn't technical; it's the single-file identity.

---

## 1. Where this came from

A frontier analysis of offline outliners (`outliner-frontier-report.md`) found seven genuinely
unbuilt capabilities. **F1 — tree-aware version control** (branch a subtree, structurally diff with
moves understood as moves, three-way merge, scrub node history) was the largest prize: *nobody ships
it.* The reason is an architectural fork — plain-file tools (org, Obsidian) can't cheaply have stable
node identity; identity-bearing tools (Tana, Roam) put the database in the cloud. **Pointliner is
rare: it already has local node identity** (`uid()` → `_id` in OPML), putting it on the right side of
that fork. The CRDT libraries that make F1 newly feasible (Loro's movable tree) cite outliners as the
use case.

The other frontier items and their fit with Pointliner (for context, not part of this pivot):

- **Within reach on the existing engine (Path A):** F2 (cross-node constraints/lint), F5 (enforced
tree grammars), F3 (uncertainty-native fields). These ride the math/variable/grammar machinery and
do **not** need the CRDT.
- **Falls out of F1:** F6 (subtree churn/staleness analytics) — needs edit history, which F1 provides.
- **Off-identity:** F4 (resumable code execution), F7 (two-way rich-file projection). Out of scope.

---

## 2. The spike (ran June 12, 2026) — full findings

A throwaway feasibility spike tested whether Loro can back Pointliner, with fail-fast gates, on a
disposable branch, touching no real app code. **Engine:** `loro-crdt` 1.13.1 (WASM). All gates proven
programmatically (Node + headless Chromium from `file://`), no UI.

> The spike code was throwaway (branch `loro-feasibility`, commit `7f929a0` on `zntznt/pointliner` —
> may not survive cleanup). **This section is the durable record.** Re-derive from here if the branch
> is gone.


| Gate                        | Result                  | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0 — single-file offline** | **PASS**                | Loro ships a `base64` npm target (WASM embedded in JS). One esbuild pass → a single self-contained HTML that initialized, built a tree, and round-tripped a snapshot from `file://` with the browser **forced offline**. File-open → engine-ready: **195ms**. Cost: **+4.4MB** inlined engine (app ~0.73MB → ~5.1MB).                                                                                                                                                                                                    |
| **1 — model fit**           | **PASS**                | Outline → Loro **movable tree**; 8 scalar fields (`id,text,note,type,italic,underline,checked,collapsed`) → per-node `data` map; `footnotes[]` + 7 sidecars → `LoroMovableList`s. Deep-equal readback live and post-snapshot. **Forced decision:** Loro maps don't preserve JSON key order, so **sidecar records are stored as atomic JSON-string blobs** (whole-record LWW — matches the app's current sidecar semantics).                                                                                              |
| **2 — OPML round-trip**     | **PASS**                | Through the app's real `toOpml`/`fromOpml`: **byte-identical** both directions, `_id`s stable. (Document root's id is minted fresh by `fromOpml` by design — it isn't an `<outline>`.)                                                                                                                                                                                                                                                                                                                                   |
| **3 — history**             | **PASS**                | 5 edits + 1 move on one node; `doc.checkout(frontier)` reconstructed "3 edits ago" text and the pre-move parent; returning to present restored everything. Per-node history = checkout the doc at a version, read the node.                                                                                                                                                                                                                                                                                              |
| **4 — branch + merge**      | **PASS**                | Fork A edited text, fork B **moved** a different node; after bidirectional merge both survived, the moved node kept its **TreeID and app id** (a true move — not delete+create, not duplicated), forks converged byte-equal. Same-node concurrent edits converge **deterministically** (per-map-key LWW, no corruption) and the conflict is **detectable pre-merge** via `doc.diff(commonAncestor, forkHead)`. **Bonus:** `node.text` as a `LoroText` container would *character-merge* concurrent edits instead of LWW. |
| **5 — size/speed**          | **PASS (real numbers)** | 4,000 nodes: snapshot **1226KB** vs OPML **427KB** (**2.9× raw**; gzipped 580KB vs 27KB — OPML compresses far better). History-free shallow snapshot 1067KB. Build 413ms (one-time). **Single edit+commit ~0.01ms.** Load **69ms**. **One edit = a 103-byte incremental update** (excellent append-only autosave unit).                                                                                                                                                                                                  |


### Verdict: YELLOW — feasible; start B1 only after explicitly accepting two named costs

Everything the premise needs works: single-file-offline WASM, faithful model, lossless identity-
preserving round-trip, per-node time travel, and merges that keep moves as moves with detectable
conflicts. The caveats are not blockers but are identity-relevant:

1. **The engine weighs 4.4MB (permanent, un-mitigable).** Single file grows ~0.73MB → ~5.1MB (load
  fine at 195ms). The Gate-0 fallback (pure-JS **Yjs**) wouldn't help: Yjs has **no movable tree**,
   so its merge turns moves into delete+create → fails Gate 4. **Loro-WASM is effectively the only
   fit; the 4.4MB comes with it.**
2. **Storage grows ~3× raw / ~20× gzipped vs OPML**; binary needs base64 (+33%) for `localStorage` —
  a 4k-node doc eats ~1.6MB of the ~5MB quota vs ~0.6MB today. *Mitigations measured:* 103-byte
   incremental updates (append-only autosave + periodic compaction), shallow snapshots; OPML on disk
   stays the canonical interchange (Gate 2 proves losslessness).

### Reviewer notes layered on top of the findings (do not lose these)

- **Caveat #2 is largely retired by B5.** Real disk (the File System Access picker already on the
roadmap, or a packaged app) removes the `localStorage` ceiling entirely. The storage cost mainly
bites *before B5* and on browsers without file access. Downgrade it from "caveat" to "interim
constraint resolved by a planned phase."
- **Caveat #1 is the real, permanent decision** — not a perf problem (195ms) but an *identity* shift:
from "~0.73MB, zero dependencies, every byte hand-written" to "~5.1MB, 4.4MB of which is a third-
party engine." Say yes to that consciously.
- `**node.text` = `LoroText`, not LWW — leaning recommendation.** This is the consequential day-one
decision. F1's *headline* use case is the writer "branch alternate endings, merge back the good
paragraph." With LWW, two branches editing the same node's prose → one wins, the other paragraph is
*lost* (detectable, but lost). `LoroText` character-merges, which is what merging prose should do.
LWW would quietly defeat the motivating use case. Decide explicitly; lean `LoroText`.
- **Sidecar JSON-blob → coarse merge (known limitation).** Whole-record LWW means concurrent edits to
*different fields of the same* dice/grammar record conflict at the record level (one wins). Rare in
practice; acceptable; just known.
- **Feasible ≠ cheap.** The spike de-risked the *premise*, not the *labor*. B1 is still the XL
integration rewrite (every reader/writer rewired onto Loro). "Possible" was the question; "want to
spend the largest effort on either roadmap" is the decision.

### Two design decisions B1 must make on day one (both prototyped in the spike)

1. Sidecar records as **atomic JSON-string blobs** (byte-stable, whole-record LWW — matches current
  semantics).
2. `node.text` as **map value (LWW)** vs `**LoroText` (character-merge)** — see the lean above.

---

## 3. The phased roadmap (Path B)

One foundation pivot, then a staircase of visible wins, cheapest first. F2/F5 interleave because they
don't need the CRDT — they keep visible progress alive while the invisible B1 foundation is built.


| Phase                      | What (plain)                                                          | User sees        | Size | Risk                       |
| -------------------------- | --------------------------------------------------------------------- | ---------------- | ---- | -------------------------- |
| **B1 — Foundation**        | Replace in-memory model with a Loro CRDT; OPML becomes export/import. | *Nothing new*    | XL   | **Highest — one-way door** |
| **B2 — History scrubber**  | Scrub any node's past. Cheap because B1 stores history.               | First real win   | M    | Low–med                    |
| **B3 — Branches**          | Copy a subtree, edit both, switch between them.                       | Branches panel   | L    | Med–high (UX)              |
| **B4 — Diff + Merge**      | Compare branches, combine; moves shown as moves.                      | Diff + merge UI  | L    | High — closes F1           |
| **B5 — Multi-doc storage** | Today's `roadmap.md` Phase 1, folded in (built on the CRDT).          | Folder of docs   | L    | Med                        |
| **B6 — Subtree analytics** | Churn/staleness by section — reads B1's history.                      | Heatmaps         | S–M  | Low                        |
| **↔ F2 + F5**              | Constraints + grammars; ride the existing engine, no CRDT needed.     | Lint + templates | M    | Low–med                    |


**Decision markers:**

- **B1 is the gate.** Before it: fully reversible. At B1 you commit the data model. Pre-release = no
data to migrate (the one thing in your favor).
- **You can stop at B2** with a unique shipped win (per-node history) and a proven foundation.
- **F4 and F7 stay out.**
- With the CRDT underneath, cross-document links and (if ever wanted) device sync / live collaboration
become much easier — though staying offline-only remains a valid choice.

**Effect on the current roadmap:** Phase 1 (multi-doc) → becomes **B5**, built on the CRDT instead of
raw OPML, which *also* retires the painful "Chromium-only FSA gate / OPFS / Safari-users-get-less"
analysis if paired with a packaged app. Phase 2 (linking) unchanged; cross-doc links get easier.

---

## 4. The single-file decision (resolved direction for when revived)

`CLAUDE.md` states two invariants people lump together; they're **separable**:

- **"No build step, no runtime dependencies"** — the purity invariant.
- **"Open the file in a browser and it runs"** — single-file *distribution*.

**Resolved approach: adopt Loro as one sanctioned dependency via a build that outputs a single self-
contained HTML** ("build-to-single-file" — exactly the spike's own pipeline). This **keeps single-file
distribution** (the soul) and **sheds only the no-build purity.**

- **Gives up:** edit-one-file-and-refresh; contributors need Node + a build; the build can age; "grep
one file" erodes.
- **Keeps:** one `.html` artifact, offline, double-click.
- **Does NOT fix** the 4.4MB or the storage numbers — those are browser-single-file realities,
answered only by the FSA picker (B5) or a packaged app. "Loro as a dependency" is about clean
dependency management, not the caveats.
- **Discipline rule (mandatory if revived):** the build exists to bundle **the CRDT engine, full
stop** — not an open door to a dependency tree. One sanctioned dependency, reviewed deliberately.
- `**CLAUDE.md` change required:** the invariant "suggestions that require a build step do not fit"
becomes "one sanctioned build step, for the engine."
- **No-build escape hatch (ugly, but exists):** vendor Loro's prebuilt base64 bundle directly into
`index.html` as a committed blob — preserves both invariants at the cost of a 4.4MB blob in source
and manual updates. Most would prefer the build.

**The deeper framing:** single-file and the full frontier are quietly in tension. Three coherent
worlds — (a) magic single file + modest ambitions (Path A); (b) single file + frontier (Path B as the
spike found it, YELLOW); (c) packaged local app + frontier (Path B comfortably — Tauri is a natural
fit since Loro is also Rust — at the cost of the single-file soul). **Don't drop single-file to make
F1 easier; drop it (or not) based on what Pointliner should *be*.**

---

## 5. How to revive this

1. **Re-confirm the spike still holds** — Loro may have moved past 1.13.1; re-run gates 0/4/5 quickly
  if so (the gate methodology is in §2; scripts were at `loro-feasibility@7f929a0` if it survives).
2. **Make the two day-one design decisions** — sidecar JSON blobs (settled) and `node.text` =
  `LoroText` (leaning yes, for the writer merge use case).
3. **Decide the single-file question** (§4) — adopt the build-to-single-file + one-dependency rule,
  and update the `CLAUDE.md` invariant.
4. **Then, and only then, write the B1 build brief** — the XL foundation rewrite. Treat it with the
  resilience discipline used elsewhere: pure cores + real-path verification (the data-model swap is
   wide and shallow; unit tests under-catch it — verify every existing feature still works after).
5. F2/F5 can start any time independently (they don't need the CRDT) if you want frontier value
  without committing to B1.

---

*Parked deliberately and completely. The hard technical question (is it feasible?) is answered: yes,
YELLOW. What remains is the identity question (single file vs more), which is why this waits until
Pointliner is ready to be more than the file. Everything needed to pick it back up is in this one
document.*
