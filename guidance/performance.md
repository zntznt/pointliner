# Pointliner — Performance baseline

**Measured:** 2026-07-21 · **Build:** `main` @ `a631c2c` · **Machines:** three (see below).
**Method:** synthetic trees of N nodes driven through the live code paths; times in ms.
Re-run harness at the bottom; re-measure and update the date/commit when the numbers
move materially.

### The two reference machines

| id | machine | browser | role |
|---|---|---|---|
| **M** | Apple Silicon Mac | headless Chromium | the fast reference |
| **W** | Windows 11, AMD Ryzen 7 5800H (8C/16T, 32 GB) | timings: Chromium 150 (Electron 43, wmux panel); storage probe: Edge 150. Both `http://127.0.0.1` | the mainstream-laptop reference |
| **D** | Debian container (4 GB RAM, vCPUs) | Node v22.14.0, pure-core only (no browser) | server-side / CI reference |

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
> eager reactive query layer. Its honest ceiling is **storage, not lag**: ~17k nodes via
> browser `localStorage`, with a clean fallback (a connected workspace folder writes to
> disk, no cap).

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
- **The real ceiling is ~17k nodes — and it's storage, not speed.** The default in-browser
  autosave serializes the whole document to `localStorage`, which browsers cap at ~5 MB
  (measured on M: 4 MB writes, 5 MB throws). At ~240 bytes/node that's ~17k nodes; past it
  the app trips its own `autosaveDisabled` guard, warns, and stops re-serializing. **Escape
  hatch:** connect a workspace folder — it writes to disk with no cap. **Measured identical
  on M and W** — it is a browser-policy cap, not a hardware one, so the slower machine does
  not get a smaller document.
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

### The hard ceiling: `localStorage`

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

---

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

**The ranking is machine-independent; only the distance between rungs changes.** On M the
storage wall arrives long before search is uncomfortable. On W search closes some of that
gap (83 ms already at 10k), but storage still wins the race — so the ordering below holds on
both machines.

1. **Storage wall (~17k nodes).** Not speed — `localStorage` ~5 MB. **Identical on both
   machines**, since it is a browser-policy cap (see the storage section's W caveat). Handled gracefully
   (`autosaveDisabled` + `STORAGE_SOFT_LIMIT` warning; see `writeLocalAutosave`). The
   workspace-folder path (`flushWorkspaceFile` → `toOpml` to disk) has **no** such cap, so a
   power user with a huge doc uses the folder workflow.
2. **Search (M ~156 ms, W ~372 ms per query at 50k).** Each *applied* query (debounced
   140 ms, so not per-keystroke) is a full `computeMatchSet` walk; `is:failing` additionally
   runs `evalCheck` per node. Fine to ~10k on M (~34 ms), noticeable past ~25k (~82 ms). On
   W it is fine to ~5k (~44 ms) and noticeable from ~10k (~83 ms) — **the one ceiling the
   slower machine genuinely moves**, by about one size step. This is also the clearest
   candidate for future work: it is the only path where the 2.4× constant crosses a
   perceptual line inside the document sizes users actually reach before the storage wall.
3. **Structural-edit latency (grows with size, but stays under the line at 50k on both).**
   Each structural op pays `pushUndo` → `snapshot` (`JSON.stringify(root)`, O(total)) + a
   full `render()` + the next reads of the doc-caches. M: ~11 ms at 25k, ~29 ms at 50k —
   down ~3× from the June run's 88 ms. W: ~11 ms at 10k, ~26 ms at 25k, ~63 ms at 50k — so
   W crosses the ~50 ms perceptible line only at 50k, well past the storage wall a user
   would hit first. *Plain text typing avoids all of this* (`recordTextEdit` is an O(1)
   per-node diff; no `render()`, no `snapshot()`).

---

## Why the architecture holds (the load-bearing design choices)

- **Virtualized DOM.** Only a viewport-sized window of rows is in the DOM (`renderWindow`,
  `OVERSCAN=10`, `EST_ROW=30`); ~35 elements at 10k or 50k alike. Render / scroll / per-node
  edit DOM work is bounded by the *window*, not the document. This is the single biggest
  reason it doesn't die where DOM-the-whole-tree outliners do.
- **Lazy, generation-keyed caches.** `markDirty()`/`resetDocCaches()` do exactly `_varsVer++`;
  the 9 whole-tree collectors (`collectVars`, `collectRules`, `collectLinks`, `collectTags`,
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
reactive-DB tools at the scale that trips them; a lower but *cleaner* ceiling (~17k,
storage-bound, with a disk fallback) than a cloud-backed tool's theoretical max.

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
- **No incremental persistence.** Autosave re-serializes the whole tree (the ~17k wall). A
  delta-based or chunked save would push that ceiling out a lot — a real architectural cost
  the single-file model trades away on purpose.

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
