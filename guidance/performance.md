# Pointliner — Performance baseline

**Measured:** 2026-07-21 (storage section re-measured 2026-07-28) · **Build:** `main` @ `a631c2c`
· **Machines:** three (see below).
> **Partially re-measured 2026-08-07** at `main` @ `2294775`, 685 commits later — see
> "Re-measurement 2026-08-07" below. **`applySearch` has regressed ~65% at 50k** since this
> baseline; `toOpml` improved ~70%. The tables in this section are still the July numbers.
**Method:** synthetic trees of N nodes driven through the live code paths; times in ms.
Re-run harness at the bottom; re-measure and update the date/commit when the numbers
move materially.

> **A number in this document is a work item, never a scope line.** Ceilings here say what to
> optimise next; they do **not** define who the product is for, and `product-identity.md`'s
> exclusions do not rest on any of them. This has been got wrong once, in the direction that
> matters: the old "~17k nodes" storage figure was quoted in the identity doc as a boundary, so a
> browser-policy cap stood in for a product decision and outlived the number by months. The
> standing position (owner, 2026-07-28) is that **performance gets pushed on its own merits** —
> which is how search became faster than it has ever been, `toOpml` went 72 ms to 32 ms, and one
> confident optimisation was killed by measuring it (`structuredClone`, 5x slower than
> `JSON.stringify`).

### The two reference machines

| id | machine | browser | role |
|---|---|---|---|
| **M** | Apple Silicon Mac | headless Chromium | the fast reference |
| **W** | Windows 11, AMD Ryzen 7 5800H (8C/16T, 32 GB) | timings: Chromium 150 (Electron 43, wmux panel); storage probe: Edge 150. Both `http://127.0.0.1` | the mainstream-laptop reference |
| **D** | Debian container (4 GB RAM, vCPUs) | Node v22.14.0 for pure cores; **headless Chromium via Playwright** on `http://localhost` for DOM and storage runs | server-side / CI reference |

**M is a fast machine; W is an ordinary good one; D is the leanest.** Tables below carry D for
pure-core operations only (the DOM-bounded hot paths — render, keystroke, scroll — need a
browser; the keystroke claim is unchanged since it is bounded by the virtual-list window).
The one-line result of adding D: **pure cores run ~3–5× slower than M's browser JIT**, which
is the expected v8-in-Node vs the full Chromium JS engine — but the shape is identical
(linear scaling, same outliers at the same nodes). The performance optimization that shipped
with this (the `_computedNodeIds` set + mtInline batch + mdInline fast-path + globalRuleMap)
is DOM-bounded and will show its impact on the next browser re-run; the pure-core shape here
confirms no regression at 50k nodes.

> **One-line positioning:** as fast as the good lightweight virtualized outliners
> (Workflowy-class), and notably *better* than the reactive-graph-DB tools (Logseq /
> Roam) in the few-thousand-to-10k range that trips them up — because Pointliner has no
> eager reactive query layer. Its honest ceiling is **search latency**, and it arrives
> gradually: storage stopped being the wall once OPFS became the durable primary
> (measured 2026-07-28 — a 100k-point / 26 MB document autosaves and survives a reload).

---

## TL;DR

- **Comfortable to ~10k nodes on both machines.** Every common operation stays under the
  perceptible-lag line (~50ms); typing and scrolling stay at ~60fps. On W the *editing*
  envelope holds at 10k (structural edit ~11ms); what moves down is **search**, which
  becomes noticeable at 10k on W (~83ms) rather than at 25k on M (~82ms) — roughly **one
  size step earlier**.
- **Typing does not care which machine you are on.** Median keystroke is **0.1 ms on both**
  M and W in a fully-expanded 10k doc, worst case included. Scroll frames are 2.3ms (M) /
  4.1ms (W) — both comfortably inside a 16.7ms frame. This is the virtualization + lazy-cache
  design paying off: the hot paths are bounded by the *window*, and a window is the same
  size everywhere.
- **Storage is no longer the ceiling — OPFS carries the document past the `localStorage` wall.**
  The `localStorage` cap is unchanged and still real (4 MB writes, 5 MB throws, on every machine
  measured), but it now bounds only the *fast-boot copy*. `scheduleAutosave` writes **OPFS as the
  durable primary**, and OPFS has no 5 MB cap. Measured on D (2026-07-28): at 25k / 50k / 100k
  points the `localStorage` write fails and `autosaveDisabled` flips true, OPFS takes the whole
  payload (6.6 / 13.2 / **26.4 MB**), and **every point comes back after a reload** — 100,000 of
  100,000, with zero page errors. See "Past the `localStorage` wall".
- **The ceiling that remains is search, and it arrives gradually.** No cliff: at 100k points
  typing is still 5.8 ms median and a structural edit 313 ms, while an applied query is 1.6 s. So
  the document stops being *pleasant* long before it stops *working*, which is the opposite of the
  old storage wall's behaviour (fine, fine, fine, then auto-backup off).
- **The first thing you *feel* is search — past ~25k on M, past ~10k on W.** Each applied
  query walks the whole tree: 34 / 82 / 156ms at 10k / 25k / 50k on M, and 83 / 201 / 372ms
  on W. Structural edits (Enter / indent / delete / move: a full `render()` + a whole-tree
  `JSON.stringify` undo snapshot) came down ~3× since the June run and stay under ~30ms
  even at 50k on M, ~63ms on W. Plain typing pays neither cost.
- **Why it doesn't lag like Logseq/Roam at a few thousand nodes:** two deliberate choices —
  (1) a genuinely **virtualized DOM** (~35 row elements exist at any size), and (2) the
  **keystroke hot path does near-zero whole-tree work** (the 9 doc-caches are lazy *and*
  not read on every keystroke — only when you type a trigger like `/`, `{`, `#`).
- **The 2026-07-21 batch-table render optimization did not regress pure-core costs** at 50k nodes.
  The DOM-bounded gains (`repaintComputedDependents` target-set, `mtInline` batch, `mdInline`
  fast-path, `globalRuleMap`) will be verified on the next M/W browser re-run.

---

## Pure-core measurements — Debian container (D)

Measured 2026-07-21 at `a631c2c` in Node v22.14.0 via `tests/performance.mjs` (the same
load-cores sandbox the test suite uses). Times in ms; 10% of synthetic nodes carry math
pills to exercise the collector paths realistically. The browser tables below capture the
hot-path (render / keystroke / scroll) numbers these can't measure.

### Core sweep (N nodes, all collectors + serialization)

| nodes | `collectVars` | `collectRules` | `collectTags` | `collectLinks` | `toOpml` | `JSON.stringify` |
|---|---|---|---|---|---|---|
| 1,000 | 0.5 | 0.3 | 3.5 | 0.8 | 4.5 | 0.8 |
| 5,000 | 6.9 | 0.6 | 5.1 | 2.4 | 22.2 | 4.4 |
| 10,000 | 8.3 | 0.6 | 7.6 | 5.8 | 25.3 | 8.3 |
| 25,000 | 5.5 | 3.6 | 9.4 | 14.0 | 66.1 | 23.3 |
| 50,000 | 9.7 | 5.1 | 20.0 | 20.9 | 114.7 | 46.3 |

### Pill-heavy (5k nodes, 100% dice pills)

| `promoteLoadedShorthand` | `collectTags` | `collectVars` | `dicePills` |
|---|---|---|---|
| 62.2 | 7.7 | 1.4 | 5,000 |

`promoteLoadedShorthand` (62 ms) is the dominant cost — it walks the tree and classifies
every `{…}` body. On a real browser with a JS JIT this would be ~15–20 ms; the relative
shape is what matters here (it's linear in pills, as expected).

---

## Results

### Per-keystroke latency — the number that matters most

Real `input` events fired through the live `attachContentEvents` handler (`editableText` +
`markDirty` + `scheduleReconcile` + the `checkSlash`/`checkBrace`/`checkTag`/… chain), in a
**fully-expanded** 10k-node document (all 10,000 rows visible, nothing collapsed):

| metric | M (Mac) | W (Ryzen 5800H) |
|---|---|---|
| median | **0.1 ms** | **0.1 ms** |
| p95 | 0.2 ms | 0.2 ms |
| max | 1.8 ms | 0.6 ms |

Even forcing `markDirty()` *before every keystroke* (worst case — every doc-cache
invalidated) held the median at **0.1 ms** on both machines (W: p95 0.4, max 0.8): the input
handler does not read the caches on a plain keystroke. Typing is effectively O(1) regardless
of document size, **and effectively independent of the machine** — the two-machine run is
what turns that from a claim into a measurement. (W's lower *max* is not W being faster;
it is one machine's GC/JIT jitter versus the other's, at a scale where the number is noise.)

### Operation sweep (single ops, timed through the live functions)

**M — Apple Silicon Mac:**

| nodes | render | structural edit | search (plain term) | autosave `JSON.stringify` | `toOpml` | undo `snapshot` | doc size |
|------:|-------:|----------------:|--------------------:|--------------------------:|---------:|----------------:|---------:|
| 1k    | 7  | 2.7 | 13  | 0.8 | 4.6 | 0.7 | 0.25 MB |
| 5k    | 10 | 6.3 | 35  | 2.0 | 7.1 | 1.8 | 1.25 MB |
| 10k   | 5  | 4.5 | 34  | 3.4 | 8.0 | 2.8 | 2.5 MB |
| 25k   | 9  | 11  | 82  | 8.0 | 25  | 5.0 | 6.2 MB |
| 50k   | 21 | 29  | **156** | 17 | 37 | 22 | 12.5 MB |

**W — Windows 11 / Ryzen 7 5800H** (second pass, per the JIT-warmup caveat):

| nodes | render | structural edit | search (plain term) | autosave `JSON.stringify` | `toOpml` | undo `snapshot` | `buildIndex` | doc size |
|------:|-------:|----------------:|--------------------:|--------------------------:|---------:|----------------:|-------------:|---------:|
| 1k    | 4.3  | 4.3  | 11  | 0.7 | 1.7 | 0.4 | 0.7 | 0.25 MB |
| 5k    | 5.3  | 8.4  | 44  | 3.8 | 7.8 | 3.8 | 2.6 | 1.25 MB |
| 10k   | 9.7  | 11   | 83  | 7.2 | 14  | 8.2 | 5.5 | 2.5 MB |
| 25k   | 22   | 26   | 201 | 22  | 50  | 14  | 17  | 6.2 MB |
| 50k   | 40   | 63   | **372** | 38 | 91 | 41 | 30 | 12.5 MB |

**W ÷ M, the shape of the gap:**

| nodes | render | structural edit | search | `JSON.stringify` | `toOpml` | `snapshot` |
|------:|-------:|----------------:|-------:|-----------------:|---------:|-----------:|
| 1k  | 0.6× | 1.6× | 0.9× | 0.9× | 0.4× | 0.6× |
| 5k  | 0.5× | 1.3× | 1.2× | 1.9× | 1.1× | 2.1× |
| 10k | 1.9× | 2.4× | 2.4× | 2.1× | 1.8× | 2.9× |
| 25k | 2.4× | 2.4× | 2.5× | 2.8× | 2.0× | 2.7× |
| 50k | 1.9× | 2.2× | 2.4× | 2.2× | 2.5× | 1.9× |

**Read the ratio table's *shape*, not its 1k row.** At 1k–5k the ratios are noisy and
sometimes below 1× — those ops take single-digit milliseconds, where timer granularity and
GC jitter dominate and W's newer Chromium build is a confound. From 10k up, where the
numbers are large enough to mean something, the gap converges hard on a flat **~2–2.5×
across every O(total-nodes) path**. That flatness is itself the finding: **W is not slower
in a different way, it is the same curve scaled by a constant.** No path degrades
super-linearly on the slower machine, so nothing on M is hiding an algorithmic cliff that
only a weaker CPU would expose.

`render()` is virtualized on both, so the initial paint stays bounded (~5–21 ms on M,
~4–40 ms on W at any size). The genuine growth is in the O(total-nodes) paths (serialize /
search / snapshot), not render. Versus the 2026-06-29 run (`bdd7bad`, M): structural edit
and `snapshot` came down ~3× at the top end (88 → 29 ms and 30 → 22 ms at 50k) and search
dropped 231 → 156 ms at 50k.

### The corkboard (D, 2026-07-27, #955)

The board is **not virtualized** — like `buildTableWidget`, it rebuilds wholly on every render — so
its cost grows with the number of cards rather than with the window. Median render, zoomed, after an
edit, against the same document shown as an outline:

| children | as cards | as an outline |
|---|---|---|
| 20 | **2.3 ms** | 6.9 ms |
| 200 | **13.5 ms** | 6.7 ms |

At ordinary chapter sizes the board is *faster* than the outline, because it skips the virtualizer
entirely. It crosses over somewhere under a hundred children and is still well inside a frame at
200, which is already an implausible chapter. Recorded rather than optimised: if a board ever needs
virtualizing, this table is the starting point, and the honest trigger is card count, not document
size.

### Neighborhood graph, the `Nearby` scope (D, 2026-07-27, #898)

The cap exists to keep `graphLayout` off its O(N²) wall (1 s at 500 linked points, 21 s at 2,000 —
the measurement that got an all-points folder graph rejected). It does, and the shape of the result
is the claim worth recording: **the cost is flat in document size.**

| document | `collectLinks` | `nearbyAdjacency` | `nearbyGraphModel` | `graphLayout` | total |
|---|---|---|---|---|---|
| 5 000 points | 4.2 ms | 1.3 ms | 1.1 ms | 230.6 ms | **237 ms** |
| 50 000 points | 20.5 ms | 0.9 ms | 0.6 ms | 226.1 ms | **248 ms** |

Same neighbourhood in both: 1,201 points reachable within 2 hops, 150 drawn. The walk is ~1 ms; the
layout at the cap is everything. Ten times the document costs 11 ms more, all of it in
`collectLinks`, which the panel needs anyway.

`GRAPH_NEARBY_CAP` stays at 150, matching `GRAPH_UNLINKED_CAP` — and the ~230 ms layout it produces
is the same budget that cap was already chosen against ("layout stays under ~220 ms at every
measured size"). Two caps in one panel with the same measured bound should be the same number.

### Backlinks: the `varMapAt` stall, and the zoom-view section (D, 2026-07-27, #953)

Measured on the Debian container while building #953, so the "before" column is `origin/main`,
not a hypothetical.

**A pre-existing stall, found by instrumenting the feature rather than the bug.** Clicking into a
point runs `blGather` → `collectUnlinkedRefs`, which calls `displayText` on *every* node.
`displayText` calls `varMapAt`, a per-node cache that a generation bump clears, so the first click
after any edit warmed the positional variable map across the whole document.

| operation (5k points) | before | after |
|---|---|---|
| first `showBlPanel` of a generation (the click into a point) | **665 ms** | **62 ms** |
| ...of which `varMapAt` cold across the document | 542 ms | skipped |
| second `showBlPanel`, same generation | 14.5 ms | 13.5 ms |

The fix is a sniff guard in `displayText`: every artifact `flattenArtifacts` resolves is spelled
with a `[` or a `{` (`[[type:key]]` tokens, `[/]` and `[%]` cookies, `[o n/m]` clocks, `{meter:}`),
and the one branch needing neither (`flattenSpoilers`) never reads the map. Output verified
byte-identical over a seeded 13-case document covering every artifact kind.

**The zoom-view section itself.** Median render while zoomed, after an edit (the worst case: the
generation bump invalidates everything):

| points | `origin/main` | first cut (all work inline) | shipped (deferred) |
|---|---|---|---|
| 5 000 | 16.5 ms | 609 ms | **11.3 ms** |
| 50 000 | 23.7 ms | 256 ms | **29.0 ms** |

The 5k figure ends up *faster than main* because the sniff guard pays for the section and more. The
first cut is recorded because it is the instructive number: it is what "just render it" costs, and
it split into two O(document) halves, the mentions walk (256 ms at 50k) and — after that was
deferred — drawing the link rows (116 ms at 50k, because each source title goes through
`displayText` → `varMapAt` cold). Hence: nothing at all is drawn on a cold generation.

**The memo (`zoomBacklinks`) is not a perf win, and the numbers say so.** Defeating it moves the
benchmark by ~0.2 ms, because nothing expensive runs on the render path any more. It survives as
the "can I paint now?" signal: a hit paints the section complete and instantly, a miss defers and
costs a visible blank-then-fill. Without it every render would defer, including ones that changed
nothing.

### Scroll, doc-caches, and pill-heavy documents

| scenario | M | W |
|---|---|---|
| Scroll, per virtual-window recompute frame (10k expanded) | median **2.3 ms**, max 16 ms | median **4.1 ms**, max 7.9 ms |
| All 9 doc-caches cold re-walk at 10k | 6 ms | 15.7 ms |
| Pill-heavy render: 5k rows, each a dice pill + var ref + `#tag` | 24 ms † | 17.3 ms † |
| Pill-heavy structural edit (insert mid-tree) | 6.4 ms † | 27 ms † |
| Pill-heavy `collectTags` (5k tagged rows) | 11.7 ms † | 4.2 ms † |
| Pill-heavy `promoteLoadedShorthand` (5k pills, on load) | not measured | 52 ms |
| Pill-heavy `collectVars` (5k rows) | not measured | 2.8 ms |

*(The M scroll / pill-heavy rows are the 2026-06-29 run @ `bdd7bad`; the W scroll and
doc-cache rows are fresh from this run.)*

**† The pill-heavy rows are NOT comparable across the two columns — do not compute a ratio
from them.** The original M scenario was never committed to the harness and its tree shape
(tag cardinality, nesting, pill mix) is unrecorded, so the W column is a **reconstruction**
against a different build, not a re-run of the same test. The reconstruction is written down
in the harness section below precisely so this stops being true: **from now on these three
rows are reproducible and future machines will be comparable.** The tell that the old and new
scenarios differ is `collectTags`, where W — a machine ~2.4× slower on every honest
measurement — reports ~3× *faster*; that is a different workload (this reconstruction uses 7
distinct nested tags over 5k rows), not a real speedup.

What the W pill-heavy run does establish on its own terms: **rendering 5k rows of pill-dense
content is still virtualization-bounded** (17.3 ms, in the same band as the 5k plain render's
5.3 ms plus pill markup for the ~35 visible rows), and the cost that actually scales with pill
count is the **one-time load promotion** (52 ms for 5k pills) — which happens once per document
open, not per interaction. 4,999 real dice records were built, so the scenario was verified to
be genuine pills rather than literal text.

### Query bases (W, 5k matching points)

| measurement | W | M |
|---|---|---|
| `qbaseModel` cold (5k matching points, `QBASE_ROW_CAP` 100) | **15.4 ms** | ~8 ms ‡ |
| `qbaseModel` warm (generation-memoized) | **0 ms** | 0 ms ‡ |
| `qbaseModel` cold again after `markDirty()` | 13.4 ms | not measured |
| `queryRows` over the same 5k (capped) | 13.3 ms | not measured |

*(‡ M's figures are the 2026-07-16 Linux-container run, not the Mac — they were never
re-measured on M, so this row compares W against a third machine and is indicative only.)*

The two structural claims both hold on W: the projected model is **capped** (5,000 points
matched, 100 rows projected) and the memo is **real** (0 ms warm, and it correctly re-computes
after a generation bump rather than serving stale rows). So a query base's cost is bounded by
the cap and paid once per generation, not per render — which is what makes it safe to leave a
broad query in a document.

**Scroll is the headline here.** W's median frame is 4.1 ms against M's 2.3 ms — a ~1.8×
gap in the same band as everything else, but the number that matters is that **both sit far
under the 16.7 ms frame budget**, so both scroll at 60fps with room to spare. A ~2.5×
*slower again* machine than W would still make frame. The 9-cache cold re-walk is 15.7 ms on
W (2.6× M): still cheap enough that even pathological invalidation is not felt, which is the
whole point of the laziness — it is not that the walk is fast, it is that it almost never runs.

### The `localStorage` wall (still real, no longer the ceiling)

> **Superseded framing, 2026-07-28.** Everything in this subsection about the *cap itself* still
> measures true. What changed is what it bounds. This document previously called ~17k nodes "the
> hard ceiling" and never mentioned OPFS; `scheduleAutosave` has since made OPFS the durable
> primary, so the cap now limits only the fast-boot copy. The next subsection is the measurement
> that matters. The 17k arithmetic is kept because it is still exactly right for a browser with
> no OPFS.

Probed by writing increasing-size strings until `QuotaExceededError`:

| MB written | M (headless Chromium) | W (Edge 150 / Chromium, `http://127.0.0.1`) |
|---:|---|---|
| 4 MB | OK | OK |
| 5 MB | `QuotaExceededError` | `QuotaExceededError` |

→ ~5 MB cap ÷ ~240 bytes/node ≈ **~17,000 nodes** for the default in-browser autosave (a
touch lower in practice — the payload also carries sidecars + `focusedId` etc.). W's probe
computed ~17,476 nodes from the same arithmetic.

**Confirmed identical on both machines**, which is the expected result: this is a
browser-policy cap, not a hardware one. The corollary matters for how the ceiling is framed —
because the wall is storage and storage is policy, **the slower machine does not have a
smaller document ceiling.** W hits the same ~17k node wall as M; it just takes ~2.4× as long
to search the document on the way there.

> **Do not run this probe in an Electron host.** The first W attempt ran in the wmux Electron
> browser panel and reported writes succeeding to **32 MB**, failing at 48 MB — a ~6× "raised
> ceiling" that is purely an artifact: Electron does not apply Chromium's per-origin
> `localStorage` quota to app contexts. Re-run in a normal browser on a normal `http://`
> origin, which is where the 4 MB / 5 MB result above came from. This is the one measurement
> in this document that the harness host can silently invalidate, so it is worth re-checking
> the host before believing a surprising storage number.

### Past the `localStorage` wall (D, 2026-07-28, headless Chromium)

**The question this answers:** does the app keep *working* when the document outgrows
`localStorage`, and is OPFS actually the thing that saves it? Driven end to end — build the
document, let autosave land, inspect both sinks, reload, count what came back, then run the
operation sweep on the restored document.

`scheduleAutosave` writes **OPFS as the durable primary** and `localStorage` as a fast-boot copy:

```js
if (hasOPFS) writeOpfsAutosave(payload);             // durable primary (no 5MB cap)
if (!autosaveDisabled) writeLocalAutosave(payload);  // fast-boot copy + fallback where OPFS is absent
```

| points | payload | `localStorage` | OPFS | `autosaveDisabled` | warning | recovered on reload | restored via |
|---:|---:|---|---:|---|---|---:|---|
| 10,000 | 2.63 MB | 2.63 MB | 2.63 MB | false | none | 10,000 | `localStorage` |
| 25,000 | 6.60 MB | **write failed** | 6.60 MB | true | none | **25,000** | OPFS |
| 50,000 | 13.21 MB | **write failed** | 13.21 MB | true | none | **50,000** | OPFS |
| 100,000 | 26.43 MB | **write failed** | 26.43 MB | true | none | **100,000** | OPFS |

**Zero page errors at every size.** The crossing happens between 10k and 25k on this tree shape
(~265 bytes/point), and nothing about it is visible to the user: `autosaveDisabled` flips, the
`localStorage` copy stops being written, OPFS keeps the whole document, and the reload restores it
through `reconcileOpfsOnBoot` instead of the `localStorage` path.

**The silence is correct, and it is deliberate.** `storageAdvice` returns `null` for
`lsFailed && opfsOk` — *"OPFS is covering it; no loss risk"* — so the app does **not** cry wolf
about a document it is successfully storing. That distinction was built by #1113; this run is the
confirmation that it behaves as designed at 4× the old wall.

Working past the wall, on the restored document:

| points | keystroke med / p95 | render | structural edit | applied search |
|---:|---|---:|---:|---:|
| 10,000 | 0.6 / 1.1 ms | 11 ms | 29 ms | 125 ms |
| 25,000 | 2.0 / 2.8 ms | 18 ms | 75 ms | 368 ms |
| 50,000 | 2.6 / 3.7 ms | 25 ms | 70 ms | 678 ms |
| 100,000 | 5.8 / 6.2 ms | 52 ms | 313 ms | 1,633 ms |

Typing stays inside a frame budget at every size — the virtualized window again. **Search is what
degrades**, and it degrades smoothly rather than falling off a cliff.

#### Without OPFS, the old wall is exactly as it was

Measured by removing `navigator.storage.getDirectory`, and separately by making it reject with a
`SecurityError` (a locked-down profile). Both behave identically, which is the point of #1113's
capability-not-presence flag:

| | result |
|---|---|
| `autosaveDisabled` | true |
| warning | **hard**, shown |
| message | *"This document is too large for browser auto-backup. Your work is safe in memory, but save to a file to keep it. (Auto-backup paused.)"* |
| `unsavedToDisk()` | **true** — so the dirty dot shows and the `beforeunload` guard fires |
| after reload | work is gone (the boot falls back to the examples document) |

So the degradation is loud, names the remedy, and holds the unload guard. **The ~17k arithmetic
above is still the right number for this case** — it is the browser-without-OPFS ceiling, not the
product's.

OPFS is available in Chromium, Firefox 111+ and Safari 15.2+, so this is now the narrow case
rather than the common one — the reverse of how this document used to frame it.

---

## Re-measurement 2026-08-07 (machine X) — one regression, one large win

**Why this section exists.** The numbers above were taken at `a631c2c` on 2026-07-21. `main` is now
**685 commits** past that. Two weeks of that drift is enough that quoting the July table as current
was no longer safe.

**Method, and the part that matters.** Absolute ms from a new machine are NOT comparable to the M/W/D
columns above, so this did not re-run current `main` alone and diff against July's recorded figures —
that comparison would be worthless. The doc's own harness was run on **both** `a631c2c` and current
`main`, **on the same machine, in the same session**, and only that A/B is reported. Two deviations
from the harness as written, both to make the A/B tighter:

- **The RNG is seeded** (`_s = 123456789`, reset per sweep), so both builds get byte-identical trees.
  The published harness uses `Math.random`, which is fine for one build's absolute numbers and adds
  avoidable noise to a comparison.
- Driven headless via Playwright rather than pasted into DevTools, so the two builds run identically.

Second sweep pass read, per the harness instructions. **Three runs of each build**; the ranges below
are the actual spread, and the two distributions do not overlap on any row.

**Machine X:** Intel Xeon @ 2.10GHz, 4 cores, headless Chromium 1194, Linux container. A shared cloud
vCPU is slower and noisier than the M/W/D laptops above — which is exactly why only the ratio is
quoted, never the absolute.

### `applySearch('words')` — REGRESSED

| nodes | `a631c2c` (3 runs) | current `main` (3 runs) | change |
|---|---|---|---|
| 10k | 85, 86, 94 ms | 118, 116, 127 ms | **+36%** |
| 25k | 224, 218, 225 ms | 341, 328, 336 ms | **+51%** |
| 50k | 462, 455, 492 ms | 762, 775, 792 ms | **+65%** |

The regression **grows with N**, so it is not a fixed per-call cost added somewhere; it is per-node
work inside the search path.

**Coarse bisect (search, 50k):**

| commit | date | 50k search |
|---|---|---|
| `a631c2c` | 2026-07-21 | 462–492 ms |
| `8686599` | 2026-07-30 | 710 ms |
| `21140b3` | 2026-08-05 | 781 ms |
| `2294775` | 2026-08-07 | 762–792 ms |

**Most of it landed between 2026-07-21 and 2026-07-30** and has been flat since.

### The commit: #1089, tag inheritance (bisected 2026-08-07)

Binary search over the 144 first-parent merges in that window, 25k `applySearch` as the metric,
probe calibrated on both endpoints first (GOOD 273–284 ms, BAD 365–391 ms, threshold 325):

| commit | | 25k search |
|---|---|---|
| `be5daee1` | merge #1088 | **261, 278, 289 ms** |
| `07e5ba27` | merge #1089 | **386, 394, 407 ms** |

Three runs each, no overlap. `07e5ba2` is *"Tag inheritance (Tier 1 complete) + the search/serializer
performance pass it forced"* — so the cost was known at the time and already mitigated once.

**By query type (25k, median of 5), which splits the regression in two:**

| query | #1088 | #1089 | current `main` | change |
|---|---|---|---|---|
| `words` (text) | 273.7 | 401.6 | 388.0 | **+47%** |
| `#project` (tag) | 79.7 | 336.3 | 359.4 | **+322%** |
| `is:todo` | 33.0 | 169.0 | 188.4 | **+412%** |

- **The tag-query cost is the feature.** A tag search must now consider inherited tags, so it walks
  the ancestor chain. That is the semantics Tier 1 bought, not an accident, and it is not obviously
  "undoable" without giving up inheritance.
- **The text and `is:` cost is NOT inheritance.** `computeMatchSet` already carries a `needTags`
  guard — *"a text or is: query has nothing to inherit, so it should not pay for the chain at all"* —
  and that guard **shipped in #1089 itself**, so the chain is correctly skipped for those queries.
  Their regression therefore comes from #1089's rewrite of the per-node matchers
  (`termMatchesNode` / `queryMatchesNode` / `nodeMatchesSearch`), not from the inheritance walk.

**What is measured and what is not.** The boundary commit, the per-query-type split, and the presence
of the `needTags` guard in #1089 are all measured. **Which line of the matcher rewrite costs the time
is not** — that needs a profile, and is the next step. Do not quote a mechanism for the text-query
half until someone has run one.

### `toOpml` — IMPROVED, substantially

| nodes | `a631c2c` | current `main` | change |
|---|---|---|---|
| 10k | 20, 23, 20 ms | 5, 5, 5 ms | **−76%** |
| 25k | 66, 54, 65 ms | 16, 19, 15 ms | **−73%** |
| 50k | 142, 141, 129 ms | 44, 42, 49 ms | **−67%** |

Every save serializes, so this is a real win on the write path.

### Everything else, 50k (single run each, indicative only)

| operation | `a631c2c` | current | note |
|---|---|---|---|
| `buildIndex` | 34.2 | 34.3 | flat |
| `render` | 87.0 | 89.5 | flat |
| `collectVars` | 7.3 | 6.3 | flat/better |
| `JSON.stringify` | 188.7 | 199.3 | flat |
| `snapshot` | 197.2 | 132.3 | better |
| structural edit | 131.0 | 109.8 | better |
| keystroke median | 0.3 | 0.6 | both far under the perceptible floor |

### What this changes

- **The search cache question is now two questions, not one.** The tag half is the price of tag
  inheritance and a cache is the right shape for it (the same `searchBlob` WeakMap+generation
  precedent). The text/`is:` half is a ~47% regression in the per-node matcher with no feature
  attached, and it should be profiled and fixed on its own before any cache is layered over it —
  caching a matcher that got slower for an unexamined reason banks the wrong baseline.
- **Nothing in the 2026-08-05..07 session (PRs #1434–#1441) contributed**: `21140b3`, the commit
  before that work, already measured 781 ms.

## Bases (M measured 2026-07-18 · `main` @ `9fb9133` · W measured 2026-07-18 · `main` @ `5bd1c3e`)

Bases are the one surface the outline's row virtualization does NOT cover: a base is a
single outline row whose widget holds ALL its cell DOM. Measured through the live code
paths (real `input` events in a cell, the real focusout commit), 4 columns per row.
Each machine's bases numbers were taken on the **same machine as its outline numbers
above**, so the sections are directly comparable within a column (the 2026-07-16 first pass
ran on a slower Linux container; the M numbers are ~4× faster with the same shape and the
same conclusions). Render is given as plain base / projecting varbase — a projecting base
pays `collectVars` + projection in the same pass.

**Three machines have now run this sweep** (Linux container 2026-07-16, M, W) and all three
produced the same curve at different constants. Treat the *shape* — linear in cells, flat
typing, varbase focusout as the hot spot — as the durable finding, and the absolute
milliseconds as machine-specific.

**M — Apple Silicon Mac:**

| rows | widget build | full render (plain / varbase) | cell keystroke (med) | focusout commit | focusout, projecting varbase |
|-----:|-------------:|------------------------------:|---------------------:|----------------:|------------------------------:|
| 100  | ~1.3 ms | ~6 ms / ~6 ms     | <0.1 ms | ~0.1 ms | ~0.9 ms |
| 500  | ~6 ms   | ~14 ms / ~22 ms   | ~0.2 ms | ~0.3 ms | ~3.4 ms |
| 1k   | ~12 ms  | ~37 ms / ~45 ms   | ~0.3 ms | ~0.6 ms | ~7 ms |
| 5k   | ~60 ms  | ~140 ms / ~246 ms | ~1.6 ms | ~2.8 ms | ~36–43 ms |

**W — Windows 11 / Ryzen 7 5800H** (`collectVars` on a projecting varbase in the last column):

| rows | widget build | full render (plain / varbase) | cell keystroke (med) | focusout commit | focusout, projecting varbase | `collectVars` (varbase) |
|-----:|-------------:|------------------------------:|---------------------:|----------------:|------------------------------:|------------------------:|
| 100  | ~4 ms   | ~16 ms / ~19 ms   | ~0.1 ms | ~0.3 ms | ~1.8 ms  | ~0.6 ms |
| 500  | ~16 ms  | ~39 ms / ~66 ms   | ~0.4 ms | ~0.7 ms | ~9 ms    | ~8 ms |
| 1k   | ~32 ms  | ~64 ms / ~112 ms  | ~0.7 ms | ~1.3 ms | ~18 ms   | ~6.7 ms |
| 5k   | ~129 ms | ~376 ms / ~425 ms | ~3.2 ms | ~5.6 ms | ~81 ms   | ~33 ms |

**W ÷ M:** widget build ~2.2–3×, full render ~2.4–2.7×, cell keystroke ~2×, varbase
focusout ~2–2.6×. Same constant-factor story as the outline — **with one important
difference: here the constant bites, because bases are the one surface without row
virtualization.** On the outline a 2.4× multiplier lands on numbers small enough that it
does not change what a user can do; on a base it lands on numbers already near the
perceptible line, so it moves the envelope.

- **The envelope: comfortable to ~1k rows on M, ~500 rows on W, heavy by 5k on both.**
  Widget build is linear in cells; typing stays flat (the per-keystroke session parse reuse)
  until the whole-table serialize itself grows (~5k rows). The practical guidance shifts by
  one step for a mainstream laptop: a 1k-row base renders in ~64 ms on W (plain) / ~112 ms
  (varbase) — usable but no longer invisible, where the same table is ~37/45 ms on M.
- **Cell typing survives the machine change; painting does not.** W's cell keystroke stays
  at 0.1–0.7 ms up to 1k rows — the same "typing is flat" result as the outline. What grows
  is build/render/commit. So the base ceiling is a *paint* ceiling, not an *input* one, on
  both machines, which is exactly why the rows cap (below) is the right lever and in-widget
  virtualization is not obviously required.
- **The lever is the rows cap, not virtualization.** The BC rows cap (All/5/10/20) clips
  the inline DOM; a capped 5k-row base paints like a 20-row one in the outline. In-widget
  row virtualization was CONSIDERED AND REJECTED for now (bases-direction §7c): sticky
  header/focus/selection across a virtual window inside a `<table>` is high-complexity for
  a case the cap already handles. Revisit trigger: a real workflow needs a >1k-row base
  fully expanded (zoomed) at typing speed. **The W run does not trip that trigger** — it
  lowers the comfortable expanded size from ~1k to ~500 rows, which the cap still handles
  (a capped base paints like a 20-row one regardless of machine). It does raise the stakes
  if the trigger ever fires: on a mainstream laptop the un-capped 5k case is ~376–425 ms,
  not ~140–246 ms.
- **The varbase focusout was the real hot spot — fixed in the 2026-07-16 pass.** The B1
  sibling repaint patched ALL N×C cells on every cell blur of a projecting base (~870 ms
  at 5k rows on the container). `mtPatchCells` is now token-scoped there (only cells
  holding pill tokens can change from a sibling edit): ~1 ms at 100 rows, ~36–43 ms at 5k
  on M and ~1.8 ms / ~81 ms on W (the residue is the commit epilogue's prune + recompute
  over the large text, plus the cell scan). **The W numbers confirm the fix rather than
  qualify it**: the pre-fix container run was ~870 ms at 5k, so even the slower of the two
  current machines is ~10× better than the regression it replaced, and the residue still
  scales with the constant factor rather than blowing up.
- **Query bases are bounded by their cap** (`QBASE_ROW_CAP` 100): the projected model over
  5k matching points computes in ~8 ms cold (2026-07-16 container run) / **15.4 ms on W**,
  and is generation-memoized (**0 ms warm, re-measured on W**, correctly recomputing after a
  generation bump). Verified on W: 5,000 points matched, 100 rows projected — the cap holds.
- **Varbase projection cost rides the vars generation:** `collectVars` with a 5k-row
  projection is ~16 ms per cold read — lazy (only on the next read after an edit), but
  a reason big reference tables belong capped, not sprawling.

<details>
<summary>Bases harness (browser console, throwaway tab — same rules as the main harness)</summary>

```js
(() => {
  const ms = t0 => +(performance.now() - t0).toFixed(2);
  const mkBase = (rows, cols = 4, varbase = false) => {
    const header = ['Name', ...Array.from({ length: cols - 1 }, (_, i) => 'C' + (i + 1))];
    const lines = ['| ' + header.join(' | ') + ' |', '| ' + header.map(() => '---').join(' | ') + ' |'];
    for (let r = 0; r < rows; r++) lines.push('| Row' + r + ' | ' + Array.from({ length: cols - 1 }, (_, i) => (r * 7 + i) % 100).join(' | ') + ' |');
    const n = mkNode(lines.join('\n')); n.type = 'base';
    if (varbase) n.varbase = { name: 'Data' };
    return n;
  };
  const out = [];
  for (const N of [100, 500, 1000, 5000]) for (const vb of [false, true]) {
    const base = mkBase(N, 4, vb);
    root = mkRoot(); root.children = [base, mkNode(vb ? 'ref {= sum(Data.C1)}' : 'plain')];
    buildIndex(root, null); resetDocCaches(); if (vb) promoteLoadedShorthand(root); focusedId = null;
    let t = performance.now(); render(); const rnd = ms(t);
    t = performance.now(); buildTableWidget(base, false); const bw = ms(t);
    markDirty(); t = performance.now(); collectVars(); const cv = ms(t);
    const cell = document.querySelector(`.md-table-host[data-id="${base.id}"] td[data-r="1"][data-c="1"]`);
    cell.focus(); cell.dataset.enterVal = cell.textContent;
    const times = [];
    for (let k = 0; k < 20; k++) { cell.textContent = '4' + 'x'.repeat(k);
      const t0 = performance.now();
      cell.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'x' }));
      times.push(performance.now() - t0); }
    times.sort((a, b) => a - b);
    const t1 = performance.now(); cell.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); const foc = ms(t1);
    out.push({ rows: N, varbase: vb, render: rnd, widgetBuild: bw, collectVars: cv, keyMed: +times[10].toFixed(2), focusout: foc });
  }
  console.table(out);
})();
```

</details>

---

## The three ceilings, ranked by what a user hits first

> **Re-ranked 2026-07-28.** This list used to open with the storage wall, on the reasoning that
> it "wins the race" against search on every machine. That was true when `localStorage` was the
> only durable sink. With OPFS as the durable primary, a document sails past the old wall with no
> warning and no loss (measured to 100k points / 26 MB), so **search is now the ceiling a user
> hits first** on any browser with OPFS. Storage drops to third, and applies only to the browsers
> without it.

**The ranking is machine-independent; only the distance between rungs changes.** Search is the
first thing anyone feels, and the slower the machine the earlier it arrives.

1. **Search (M ~156 ms, W ~372 ms per query at 50k; D ~678 ms).** Each *applied* query (debounced
   140 ms, so not per-keystroke) is a full `computeMatchSet` walk; `is:failing` additionally
   runs `evalCheck` per node. Fine to ~10k on M (~34 ms), noticeable past ~25k (~82 ms). On
   W it is fine to ~5k (~44 ms) and noticeable from ~10k (~83 ms) — **the one ceiling the
   slower machine genuinely moves**, by about one size step. This is also the clearest
   candidate for future work: it is the only path where the 2.4× constant crosses a
   perceptual line inside the document sizes users actually reach. Since OPFS removed the storage
   wall that used to arrive first, this is now the ceiling users meet at all.

   **The tag-inheritance perf pass ended up making search faster than it has ever been** (container
   run, median of 9 applied queries over a 3-level tree, same page for both builds; `before` is the
   pre-inheritance `origin/main`):

   | query | 10k before → after | 50k before → after |
   |---|---|---|
   | `#campaign` (now inheriting) | 5.4 → **5.2 ms** | 26.6 → **12.1 ms** |
   | `Task` (text) | 18 → **7.5 ms** | 91.5 → **29.4 ms** |
   | `is:todo` | 1.4 → 1.7 ms | 6.8 → 6.2 ms |

   Three layers, in the order they were found. (1) The naive inheritance walk measured 21.9 →
   **81.3 ms** at 50k — per-node `RegExp` construction in `stripStateTags`/`tagHit`, 50k
   constructions per query; both are now memoised (a small Map, not one slot: a `#a #b` query
   alternates values and thrashes a single slot). (2) The `indexOf('#')` guard: the scan/strip
   regexes only ever *blank* characters, so a text without `#` can never match — and ~99% of real
   points carry no tag, so `extendAncTagText` also returns the SAME string reference down untagged
   spines instead of reallocating. That took tag queries *below* their pre-inheritance baseline.
   (3) The same sniff idea applied to `stripMd` (`MD_SNIFF`): one regex scan proves none of its
   twenty replaces can fire, so plain text skips all of them. That is the text-query win above, and
   it applies to every title, breadcrumb, and export path too, not just search. The W-machine
   ceiling above (~372 ms at 50k) predates all three and should scale down proportionally —
   re-measure on W before quoting it.
   **Whole-tree operation census (container run, 2026-07-26, 50k mixed doc, median of 5)** — taken
   to find the next ceiling after the search sniffs, and worth re-running before optimising
   anything, because it killed one "obvious" idea on the spot:

   | op | ms | verdict |
   |---|---|---|
   | undo restore (parse + reindex) | ~48 | `JSON.parse` floor — leave |
   | snapshot (`JSON.stringify`) | 37–45 | **`structuredClone` measured 5× SLOWER (221 ms)** — stringify IS the fast primitive; leave |
   | `toOpml` | 72 → **32** | rewritten: line accumulator instead of nested `children.map().join()`, direct attr concat instead of a 24-slot array+filter+join per node, and an `EX_SNIFF` escape guard in `ex()` (node ids are always plain, so every id skipped 8 regex scans). Output byte-identical — golden pin + browser round-trip (body is a fixed point through the real DOMParser) |
   | 9 doc-caches cold (sum) | ~24 | fusing the walks is the deferred registry refactor (backlog) — not taken opportunistically |
   | text query | ~28 | post-sniff; now also blob-cached — see below |
   | full `render()` | ~20 | flatten ~9 + window ~5 — bounded, leave |
   | `buildIndex` | ~6 | leave |
   | `recordTextEdit` ×1000 | ~1 | typing is effectively free, as designed |

   The autosave debounce burst for a folder-backed 50k doc is the compound beneficiary: it runs
   `JSON.stringify` (~44 ms) + `toOpml` (~72 → ~32 ms) synchronously, so the burst dropped from
   ~116 ms to ~76 ms. The remaining floor is the stringify itself.

   **Doc-cache 11, `searchBlob`, closed the text-query loop** (2026-07-26). The text term's haystack
   (`stripMd(textForDisplay(n)).toLowerCase()`) was recomputed per node per applied keystroke; it is
   now cached per generation, keyed by **node object in a WeakMap** — not by id, because workspace
   search walks foreign docs and a copied doc keeps its ids. Incremental typing at 50k (per applied
   keystroke, before = pre-inheritance baseline):

   | step | before | after |
   |---|---|---|
   | first keystroke (builds blobs) | ~127 ms | ~78 ms |
   | each further keystroke | ~90–157 ms | **~17 ms** |
   | first query after an edit (bump + rebuild) | ~98 ms | ~45 ms |

   The registry rule held: the cache checks `_varsVer`, `exitEdit`'s `markDirty()` is the bump, and
   the pin includes the negative control (an unbumped mutation keeps serving the stale blob — the
   same contract every other doc-cache has) plus an id-collision case proving the WeakMap choice.

2. **Structural-edit latency (grows with size, but stays under the line at 50k on both).**
   Each structural op pays `pushUndo` → `snapshot` (`JSON.stringify(root)`, O(total)) + a
   full `render()` + the next reads of the doc-caches. M: ~11 ms at 25k, ~29 ms at 50k —
   down ~3× from the June run's 88 ms. W: ~11 ms at 10k, ~26 ms at 25k, ~63 ms at 50k, so
   W crosses the ~50 ms perceptible line only at 50k. D: ~75 ms at 25k, ~70 ms at 50k,
   ~313 ms at 100k — the one operation that grows sharply once a document is genuinely huge,
   because the undo snapshot is O(total). *Plain text typing avoids all of this*
   (`recordTextEdit` is an O(1) per-node diff; no `render()`, no `snapshot()`).

3. **Storage — now only on browsers without OPFS (~17k nodes).** Where OPFS exists this rung
   is gone: measured to 100k points / 26.4 MB with full recovery on reload and no warning
   (see "Past the `localStorage` wall"). Where it does not, the old wall stands exactly as
   described — `localStorage` ~5 MB, ~240 bytes/node, `autosaveDisabled` plus a **hard**
   warning that names the remedy, and `unsavedToDisk()` true so the unload guard fires.
   The workspace-folder path (`flushWorkspaceFile` → `toOpml` to disk) remains a third
   durable sink with no cap, and is still the right answer for a user who wants their notes
   on their own disk rather than in browser storage.

---

## Why the architecture holds (the load-bearing design choices)

- **Virtualized DOM.** Only a viewport-sized window of rows is in the DOM (`renderWindow`,
  `OVERSCAN=10`, `EST_ROW=30`); ~35 elements at 10k or 50k alike. Render / scroll / per-node
  edit DOM work is bounded by the *window*, not the document. This is the single biggest
  reason it doesn't die where DOM-the-whole-tree outliners do.
- **Lazy, generation-keyed caches.** `markDirty()`/`resetDocCaches()` do exactly `_varsVer++`;
  the whole-tree collectors, all registered in `DOC_CACHES` (see CLAUDE.md) (`collectVars`, `collectRules`, `collectLinks`, `collectTags`,
  `collectCallables`, `collectSequences`, `knownStates`, `stateCmds`, `collectPropKeys`) re-walk only
  on the *next read after* an edit — and the keystroke path doesn't read them. A full cold re-walk of
  all nine is ~6 ms at 10k, so even pathological invalidation is cheap. (`allSequences` is an uncached
  wrapper over the cached `collectSequences`.)
- **Hybrid undo.** Text edits = O(1) `recordTextEdit` diffs; only *structural* ops snapshot
  the tree. `UNDO_MAX_ENTRIES=100`, `UNDO_MAX_BYTES≈24 MB` — on a large tree the byte budget
  caps history depth well below 100.
- **No reactive query engine.** Unlike Logseq/Roam (DataScript reactive queries re-running on
  edits), Pointliner computes lazily and renders on demand. That's precisely the layer whose
  absence keeps it fast at the scale those tools slow down.

---

## Competitive positioning (judgment, not measured)

The Pointliner numbers above are measured. The comparison below is **informed positioning
from public architecture/reputation, not benchmarks of those tools** — treat as such; a
rigorous comparison would install each tool and run the same operations.

- **Workflowy / Dynalist** — virtualized, cloud-sync. Same tier as Pointliner; snappy until
  tens of thousands of items, then sluggish; sync adds latency Pointliner doesn't have.
- **Logseq / Roam** — reactive graph DB in the browser (DataScript). The tools most cited for
  "lags after a few thousand blocks"; the reactive/index layer is the cost. **Pointliner is
  meaningfully faster here at the few-thousand-to-10k range**, by not having that layer.
- **Obsidian (+ outliner plugins)** — local markdown, CodeMirror. Fast per-file, but
  note-granular, not one giant outline; large vaults stress indexing, not the editor.
- **Org-mode** — plain text, extremely fast to edit; folding/agenda over huge files can stall.
  Different paradigm.
- **Tana** — cloud graph DB; powerful data model, perf tied to the backend.

**Net:** top of its weight class for a virtualized client outliner; better than the
reactive-DB tools at the scale that trips them; and, since OPFS became the durable primary, a
ceiling set by **search latency rather than storage** — measured working (typing, editing,
reloading) at 100k points / 26 MB, where the old framing said 17k. Against a cloud-backed
tool's theoretical max that is still lower, but it is reached without an account, a backend,
or a sync conflict.

**What the second machine adds to this claim.** The usual rejoinder to "it's fast" is "on
your machine." The strongest version of the positioning is now the *invariant*, not the
milliseconds: **typing costs 0.1 ms in a 10k-node document on both a fast Mac and an
ordinary Windows laptop, and scrolling makes frame on both.** The tools this compares
against slow down at a few thousand blocks *because of an architectural layer* (a reactive
query engine re-running on edit), which is a cost that a faster CPU reduces but does not
remove. Pointliner's costs are the opposite shape: the whole-tree paths scale cleanly with
the machine, and the paths a user touches every second do not scale with the document at
all. Note the honest edge, though — on W, search at 10k is 83 ms, so "no perceptible lag"
is a claim about editing, not about every applied query on a big document.

---

## Caveats (read before quoting these numbers)

- **Two machines, both decent — neither is a floor.** M is fast (Apple Silicon); W is a
  mainstream 2021-class laptop CPU. The prediction the old single-machine version of this
  doc made — "CPU-bound numbers scale with the machine, DOM-bounded numbers move little" —
  **was tested by adding W and held**: ~2–2.5× on the O(total) paths, ~1× on keystroke.
  That is now measured rather than assumed. But **neither machine is the slow end.** A
  low-power tablet, an old Chromebook, or a throttled/battery-saver laptop can be another
  2–4× below W, which would put search at 10k past 300 ms and a 1k-row base past 250 ms.
  Re-run on the slowest target device to find its real floor; the two columns here bracket
  a range, they do not define its bottom.
- **W's CPU numbers ran in an Electron-hosted Chromium; its storage number did not.** The
  timing runs used the wmux browser panel (Electron 43 / Chromium 150, `http://127.0.0.1`);
  same Blink engine, so the CPU numbers are trustworthy, though it is a newer Chromium build
  than M's headless run — a mild confound on the small-N ratios. The storage ceiling was
  re-probed separately in **Edge 150** (stock Chromium, same `http://` origin) because the
  Electron host does not apply Chromium's `localStorage` quota; that run reproduced M's
  4 MB / 5 MB result exactly. No Chrome is installed on W, so Edge is standing in for it —
  fine here, since the quota is Chromium policy that Edge shares.
- **The pill-heavy rows are a reconstruction, not a re-run.** See the † note in that section:
  M's original scenario was undocumented, so those three rows must not be compared across
  columns. Both harnesses are now recorded below, so the *next* machine will be comparable.
- **Synthetic trees.** Branching ~6, short-to-medium text, a realistic sprinkle of tags /
  links / pills. A real doc with very long paragraphs or thousands of pills in one point
  would shift the per-node render cost.
- **First-pass benchmarks lie.** The *original* run of this measured `render()`/`applySearch()`
  as direct function calls on a mostly-collapsed tree and reported suspiciously rosy edit
  numbers. The honest numbers above come from firing **real `input` events** through the
  live handler in a **fully-expanded** doc. If you re-measure, do it that way — the real
  keystroke path (caret math + reconcile + the trigger-check chain) is what matters, not a
  bare `render()` call. Also run the sweep **twice and read the second pass** — the first
  pass carries JIT warmup (search at 1k reads ~30 ms cold vs ~13 ms warm).
- **No incremental persistence.** Autosave re-serializes the whole tree on every debounce tick.
  That no longer caps the document (OPFS takes 26 MB without complaint), but it does mean the
  per-save cost grows with total size — `JSON.stringify` at 100k is the floor, and it is paid
  again on every undo snapshot. A delta-based or chunked save would cut both; it is a real
  architectural cost the single-file model trades away on purpose.

---

## Re-run harness

**When you add a machine to this doc,** run the *whole* harness on it (sweep + keystroke +
bases), record the CPU / OS / browser in the machines table, add a column rather than
replacing an existing one, and read the **second** sweep pass. Two things make a run
non-comparable and must be noted: a different browser engine build, and a non-Chrome host
(see the W caveats). Report ratios against M so the columns stay legible as the table grows.

Paste into the browser DevTools console with the app open (the perf-critical paths are
DOM-coupled, so this is a browser script, not a Node test — consistent with the repo's
"verification artifacts stay out of git" rule; this lives in the doc, not as a committed
script). It assigns the module-level `root`, so run it in a throwaway tab.

<details>
<summary>Harness — operation sweep + real-keystroke + storage ceiling</summary>

```js
// ── Pointliner perf harness ──────────────────────────────────────────────
// Run in the DevTools console with the app loaded. Reassigns `root`; use a scratch tab.
(() => {
  const ms = t0 => +(performance.now() - t0).toFixed(2);
  const buildTree = N => {            // realistic-ish: branching ~6, ~10% tagged, ~4% linked
    const r = mkNode(''); r.children = []; const all = [r]; let i = 0;
    while (all.length < N + 1) {
      const p = all[(Math.random() * all.length) | 0];
      if ((p.children?.length || 0) >= 6) continue;
      const n = mkNode(''); i++;
      let t = 'Point ' + i + ' with some words to render';
      if (i % 10 === 0) t += ' #project';
      if (i % 25 === 0) t += ' see [[#' + all[(Math.random()*all.length)|0].id + '|ref]]';
      n.text = t; n.type = 'ul'; n.children = []; p.children.push(n); all.push(n);
    }
    return { root: r, all };
  };
  const sweep = N => {
    const { root: nr, all } = buildTree(N);
    let t = performance.now(); root = nr; buildIndex(root, null); resetDocCaches();
    const idx = ms(t);
    focusedId = null; t = performance.now(); render(); const rnd = ms(t);
    markDirty(); t = performance.now(); collectVars(); const cv = ms(t);
    t = performance.now(); const json = JSON.stringify(root); const js = ms(t);
    t = performance.now(); toOpml(root); const op = ms(t);
    t = performance.now(); snapshot(); const sn = ms(t);
    t = performance.now(); applySearch('words'); const se = ms(t); applySearch('');
    const mid = all[(all.length / 2) | 0];
    t = performance.now(); insertSiblingAfter(mid.id); const ed = ms(t);
    return { nodes: N, MB: +(json.length / 1048576).toFixed(2), buildIndex: idx, render: rnd,
             collectVars: cv, jsonStringify: js, toOpml: op, snapshot: sn, search: se, structEdit: ed };
  };
  console.table([1000, 5000, 10000, 25000, 50000].map(sweep));

  // real per-keystroke latency, fully-expanded 10k doc
  const flat = N => { const r = mkNode(''); r.children = []; let i = 0;
    for (let g = 0; g < 10; g++) { const grp = mkNode('Group ' + g); grp.type='ul'; grp.children=[]; r.children.push(grp);
      for (let k = 0; k < (N-10)/10; k++) { i++; const n = mkNode('Task ' + i + ' with content #project'); n.type='ul'; n.children=[]; grp.children.push(n); } }
    return r; };
  root = flat(10000); buildIndex(root, null); resetDocCaches(); focusedId = null; render();
  const c = [...document.querySelectorAll('.node-content[data-id]')][2];   // any in the virtual window
  c.focus(); enterEdit(c, nodeById(c.dataset.id));
  const times = []; const base = c.textContent;
  for (let k = 0; k < 30; k++) { c.textContent = base + ' x'.repeat(k + 1);
    const t = performance.now(); c.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'x' })); times.push(performance.now() - t); }
  times.sort((a, b) => a - b);
  console.log('keystroke ms — median', +times[15].toFixed(2), 'p95', +times[28].toFixed(2), 'max', +times[29].toFixed(2));

  // localStorage ceiling
  const KEY = '__pl_quota_probe'; let okMB = 0, failMB = null;
  try { for (let mb = 1; mb <= 16; mb++) { try { localStorage.setItem(KEY, 'x'.repeat(mb * 1048576)); okMB = mb; } catch { failMB = mb; break; } } }
  finally { localStorage.removeItem(KEY); }
  console.log('localStorage OK up to', okMB, 'MB, failed at', failMB, 'MB → ~' + Math.round(okMB * 1048576 / 240) + ' nodes');

  // Past the wall: does OPFS carry the document? Build past the cap, let autosave land, then
  // RELOAD and count. Two traps that cost real time the first time this was run:
  //   1. The app boots on the Examples doc and `scheduleAutosave` deliberately never persists it
  //      (`if (_showingExamples) return`). Leave the flag set and NOTHING is written, which reads
  //      as "the app failed to save" when it is the pristine-first-run rule working correctly.
  //   2. `unsavedToDisk()` short-circuits on `!dirty`. Calling scheduleAutosave() without
  //      markDirty() reports `false` and looks like a missing unload guard. It is not.
  // So: clear the examples state, and markDirty() like a real edit does.
  if (_showingExamples) { _showingExamples = false; hideExamplesBanner(); }
  markDirty(); _userEdited = true; scheduleAutosave();
  setTimeout(async () => {
    let opfsMB = null;
    try { const d = await navigator.storage.getDirectory();
      for await (const [n, h] of d.entries()) if (h.kind === 'file' && /autosave/.test(n)) opfsMB = +((await h.getFile()).size / 1048576).toFixed(2);
    } catch (e) { opfsMB = 'ERR ' + e.name; }
    console.log('after autosave — localStorage', +(((localStorage.getItem('pointliner_autosave')||'').length)/1048576).toFixed(2),
      'MB | OPFS', opfsMB, 'MB | autosaveDisabled', autosaveDisabled,
      '| storageWarnState', storageWarnState, '| unsavedToDisk', unsavedToDisk());
    console.log('now RELOAD and check the point count — that is the only proof that survives.');
  }, 4000);
  // NOTE: #storage-warn is shared with the first-run examples banner, so its VISIBILITY is not a
  // storage signal. Read `storageWarnState` (null = the app is not warning about storage).

  // restore a clean doc
  root = mkNode(''); root.children = [mkNode('done')]; root.children[0].type = 'ul';
  buildIndex(root, null); resetDocCaches(); focusedId = null; render();
})();
```

</details>

<details>
<summary>Pill-heavy + query-base harness (added 2026-07-18 — the previously undocumented scenarios)</summary>

The pill-heavy scenarios were quoted in this doc from 2026-06-29 but never written down, so
they could not be reproduced on a second machine. This is the reconstruction; it is now the
definition of those rows. Pills are authored as typed `{…}` shorthand and promoted, so they
are real records — the `dicePills` count in the result is the guard against the scenario
silently degrading to literal text.

```js
// ── pill-heavy: 5k rows, each a dice pill + var ref + nested #tag ───────────
(() => {
  const ms = t0 => +(performance.now() - t0).toFixed(2);
  const pillTree = N => {
    const r = mkNode(''); r.children = [];
    const decl = mkNode('{strength := 10}'); decl.type = 'ul'; decl.children = [];
    r.children.push(decl);
    const all = [r, decl]; let i = 0;
    while (all.length < N + 1) {
      const p = all[(Math.random() * all.length) | 0];
      if ((p.children?.length || 0) >= 6) continue;
      const n = mkNode(''); i++;
      n.text = 'Item ' + i + ' rolls {2d6} at {strength} #project/sub' + (i % 7);  // 7 distinct tags
      n.type = 'ul'; n.children = []; p.children.push(n); all.push(n);
    }
    return { root: r, all };
  };
  const run = N => {
    const { root: nr, all } = pillTree(N);
    root = nr; buildIndex(root, null); resetDocCaches();
    let t = performance.now(); promoteLoadedShorthand(root); const promo = ms(t);
    focusedId = null;
    t = performance.now(); render(); const rnd = ms(t);
    const mid = all[(all.length / 2) | 0];
    t = performance.now(); insertSiblingAfter(mid.id); const ed = ms(t);
    markDirty(); t = performance.now(); collectTags(); const ct = ms(t);
    markDirty(); t = performance.now(); collectVars(); const cv = ms(t);
    let dice = 0; const walk = n => { dice += (n.dice?.length || 0); (n.children||[]).forEach(walk); };
    walk(root);
    return { nodes: N, promoteLoad: promo, render: rnd, structEdit: ed,
             collectTags: ct, collectVars: cv, dicePills: dice };
  };
  run(1000);                                   // warmup — discard
  console.table([run(5000)]);
})();

// ── query base: 5k matching points, cap + memo ─────────────────────────────
(() => {
  const ms = t0 => +(performance.now() - t0).toFixed(2);
  const N = 5000;
  const r = mkRoot(); r.children = [];
  for (let i = 0; i < N; i++) {
    const n = mkNode('Widget ' + i + ' tracked'); n.type = 'ul'; n.children = [];
    n.props = [{ key: 'cost', val: String(i % 90) },
               { key: 'due',  val: '2026-07-' + (1 + (i % 28)).toString().padStart(2, '0') }];
    r.children.push(n);
  }
  const qb = mkNode(''); qb.type = 'base';
  qb.qbase = { expr: 'tracked', cols: [
    { name: 'Name', field: 'title' }, { name: 'Cost', field: 'cost' },
    { name: 'Due', field: 'due' },    { name: 'Plus1', field: '= cost + 1' } ] };
  r.children.push(qb);
  root = r; buildIndex(root, null); resetDocCaches(); focusedId = null;
  let t = performance.now(); const m = qbaseModel(qb); const cold = ms(t);
  t = performance.now(); qbaseModel(qb); const warm = ms(t);
  markDirty(); t = performance.now(); qbaseModel(qb); const cold2 = ms(t);
  const rows = queryRows('tracked', root, null);   // NB: rootNode is required
  console.table([{ cold, warm, coldAfterDirty: cold2,
                   matched: rows.total, projected: m.rows?.length ?? m.length }]);
})();
```

</details>

<details>
<summary>Storage-ceiling probe — run this one in a NORMAL browser</summary>

The storage block in the main harness is valid only on a real browser origin. Running it in
an Electron host (the wmux panel, or any packaged-app webview) reports a ~6× inflated cap
because Electron does not apply Chromium's per-origin quota. Serve the app over `http://` and
run the probe there; the fine-grained step list below also characterises a raised quota
instead of just failing to fail.

```js
(() => {
  const KEY = '__pl_quota_probe'; let okMB = 0, failMB = null, err = '';
  const steps = [1,2,3,4,5,6,7,8,10,12,16,24,32,48,64,96,128];
  try { for (const mb of steps) {
    try { localStorage.setItem(KEY, 'x'.repeat(mb * 1048576)); okMB = mb; }
    catch (e) { failMB = mb; err = e.name; break; } } }
  finally { localStorage.removeItem(KEY); }
  console.log({ okMB, failMB, err, nodesEst: Math.round(okMB * 1048576 / 240),
                origin: location.origin });
  if (failMB === null) console.warn('No failure up to 128 MB — check you are not in an Electron/webview host.');
})();
```

</details>
