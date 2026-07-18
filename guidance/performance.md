# Pointliner — Performance baseline

**Measured:** 2026-07-18 · **Build:** `main` @ `9fb9133` · **Machine:** Apple Silicon Mac
(headless Chromium driving the full real app — not a Node micro-benchmark).
**Method:** synthetic trees of N nodes driven through the live code paths; times in ms.
Re-run harness at the bottom; re-measure and update the date/commit when the numbers
move materially.

> **One-line positioning:** as fast as the good lightweight virtualized outliners
> (Workflowy-class), and notably *better* than the reactive-graph-DB tools (Logseq /
> Roam) in the few-thousand-to-10k range that trips them up — because Pointliner has no
> eager reactive query layer. Its honest ceiling is **storage, not lag**: ~17k nodes via
> browser `localStorage`, with a clean fallback (a connected workspace folder writes to
> disk, no cap).

---

## TL;DR

- **Comfortable to ~10k nodes.** Every common operation stays under the perceptible-lag
  line (~50ms); typing and scrolling stay at ~60fps.
- **The real ceiling is ~17k nodes — and it's storage, not speed.** The default in-browser
  autosave serializes the whole document to `localStorage`, which browsers cap at ~5 MB
  (measured: 4 MB writes, 5 MB throws). At ~240 bytes/node that's ~17k nodes; past it the
  app trips its own `autosaveDisabled` guard, warns, and stops re-serializing. **Escape
  hatch:** connect a workspace folder — it writes to disk with no cap.
- **The first thing you *feel* is search past ~25k.** Each applied query walks the whole
  tree: ~34ms at 10k, ~82ms at 25k, ~156ms at 50k. Structural edits (Enter / indent /
  delete / move: a full `render()` + a whole-tree `JSON.stringify` undo snapshot) came
  down ~3× since the June run and now stay under ~30ms even at 50k. Plain typing pays
  neither cost.
- **Why it doesn't lag like Logseq/Roam at a few thousand nodes:** two deliberate choices —
  (1) a genuinely **virtualized DOM** (~35 row elements exist at any size), and (2) the
  **keystroke hot path does near-zero whole-tree work** (the 9 doc-caches are lazy *and*
  not read on every keystroke — only when you type a trigger like `/`, `{`, `#`).

---

## Results

### Per-keystroke latency — the number that matters most

Real `input` events fired through the live `attachContentEvents` handler (`editableText` +
`markDirty` + `scheduleReconcile` + the `checkSlash`/`checkBrace`/`checkTag`/… chain), in a
**fully-expanded** 10k-node document (all 10,000 rows visible, nothing collapsed):

| metric | value |
|---|---|
| median | **0.1 ms** |
| p95 | 0.2 ms |
| max | 1.8 ms |

Even forcing `markDirty()` *before every keystroke* (worst case — every doc-cache
invalidated) held the median at **0.1 ms**: the input handler does not read the caches on a
plain keystroke. Typing is effectively O(1) regardless of document size, by design.

### Operation sweep (single ops, timed through the live functions)

| nodes | render | structural edit | search (plain term) | autosave `JSON.stringify` | `toOpml` | undo `snapshot` | doc size |
|------:|-------:|----------------:|--------------------:|--------------------------:|---------:|----------------:|---------:|
| 1k    | 7  | 2.7 | 13  | 0.8 | 4.6 | 0.7 | 0.25 MB |
| 5k    | 10 | 6.3 | 35  | 2.0 | 7.1 | 1.8 | 1.25 MB |
| 10k   | 5  | 4.5 | 34  | 3.4 | 8.0 | 2.8 | 2.5 MB |
| 25k   | 9  | 11  | 82  | 8.0 | 25  | 5.0 | 6.2 MB |
| 50k   | 21 | 29  | **156** | 17 | 37 | 22 | 12.5 MB |

`render()` is virtualized, so the initial paint stays bounded (~5–21 ms at any size). The
genuine growth is in the O(total-nodes) paths (serialize / search / snapshot), not render.
Versus the 2026-06-29 run (`bdd7bad`): structural edit and `snapshot` came down ~3× at the
top end (88 → 29 ms and 30 → 22 ms at 50k) and search dropped 231 → 156 ms at 50k.

### Scroll (fully-expanded 10k doc) and pill-heavy documents

*(2026-06-29 run @ `bdd7bad` — these scenarios are not part of the embedded harness and
were not re-measured; the paths they exercise are the window-bounded ones that move least.)*

| scenario | result |
|---|---|
| Scroll, per virtual-window recompute frame (10k expanded) | median **2.3 ms**, max 16 ms (~60fps) |
| Pill-heavy render: 5k rows, each a dice pill + var ref + `#tag` | 24 ms |
| Pill-heavy structural edit (insert mid-tree) | 6.4 ms |
| All 9 doc-caches cold re-walk at 10k | 6 ms |
| Pill-heavy `collectTags` (5k tagged rows) | 11.7 ms |

### The hard ceiling: `localStorage`

Probed by writing increasing-size strings until `QuotaExceededError`:

| MB written | result |
|---:|---|
| 4 MB | OK |
| 5 MB | `QuotaExceededError` |

→ ~5 MB cap ÷ ~240 bytes/node ≈ **~17,000 nodes** for the default in-browser autosave (a
touch lower in practice — the payload also carries sidecars + `focusedId` etc.).

---

## Bases (measured 2026-07-18 · `main` @ `9fb9133` · same Apple Silicon Mac as above)

Bases are the one surface the outline's row virtualization does NOT cover: a base is a
single outline row whose widget holds ALL its cell DOM. Measured through the live code
paths (real `input` events in a cell, the real focusout commit), 4 columns per row.
Now measured on the **same machine as the outline numbers above**, so the sections are
directly comparable (the 2026-07-16 first pass ran on a slower Linux container; these Mac
numbers are ~4× faster with the same shape and the same conclusions). Render is given as
plain base / projecting varbase — a projecting base pays `collectVars` + projection in
the same pass.

| rows | widget build | full render (plain / varbase) | cell keystroke (med) | focusout commit | focusout, projecting varbase |
|-----:|-------------:|------------------------------:|---------------------:|----------------:|------------------------------:|
| 100  | ~1.3 ms | ~6 ms / ~6 ms     | <0.1 ms | ~0.1 ms | ~0.9 ms |
| 500  | ~6 ms   | ~14 ms / ~22 ms   | ~0.2 ms | ~0.3 ms | ~3.4 ms |
| 1k   | ~12 ms  | ~37 ms / ~45 ms   | ~0.3 ms | ~0.6 ms | ~7 ms |
| 5k   | ~60 ms  | ~140 ms / ~246 ms | ~1.6 ms | ~2.8 ms | ~36–43 ms |

- **The envelope: comfortable to ~1k rows on this hardware (a few hundred on slower
  machines), heavy by 5k.** Widget build is linear in cells; typing stays flat (the
  per-keystroke session parse reuse) until the whole-table serialize itself grows
  (~5k rows).
- **The lever is the rows cap, not virtualization.** The BC rows cap (All/5/10/20) clips
  the inline DOM; a capped 5k-row base paints like a 20-row one in the outline. In-widget
  row virtualization was CONSIDERED AND REJECTED for now (bases-direction §7c): sticky
  header/focus/selection across a virtual window inside a `<table>` is high-complexity for
  a case the cap already handles. Revisit trigger: a real workflow needs a >1k-row base
  fully expanded (zoomed) at typing speed.
- **The varbase focusout was the real hot spot — fixed in the 2026-07-16 pass.** The B1
  sibling repaint patched ALL N×C cells on every cell blur of a projecting base (~870 ms
  at 5k rows on the container). `mtPatchCells` is now token-scoped there (only cells
  holding pill tokens can change from a sibling edit): ~1 ms at 100 rows, ~36–43 ms at 5k
  on this Mac (the residue is the commit epilogue's prune + recompute over the large
  text, plus the cell scan).
- **Query bases are bounded by their cap** (`QBASE_ROW_CAP` 100): the projected model over
  5k matching points computes in ~8 ms cold (2026-07-16 container run, not re-measured)
  and is generation-memoized (0 ms warm).
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

1. **Storage wall (~17k nodes).** Not speed — `localStorage` ~5 MB. Handled gracefully
   (`autosaveDisabled` + `STORAGE_SOFT_LIMIT` warning; see `writeLocalAutosave`). The
   workspace-folder path (`flushWorkspaceFile` → `toOpml` to disk) has **no** such cap, so a
   power user with a huge doc uses the folder workflow.
2. **Search (~156 ms/query at 50k).** Each *applied* query (debounced 140 ms, so not
   per-keystroke) is a full `computeMatchSet` walk; `is:failing` additionally runs
   `evalCheck` per node. Fine to ~10k (~34 ms), noticeable past ~25k (~82 ms).
3. **Structural-edit latency (grows with size, but no longer perceptible even at 50k).**
   Each structural op pays `pushUndo` → `snapshot` (`JSON.stringify(root)`, O(total)) + a
   full `render()` + the next reads of the doc-caches. ~11 ms at 25k, ~29 ms at 50k —
   down ~3× from the June run's 88 ms. *Plain text typing avoids all of this*
   (`recordTextEdit` is an O(1) per-node diff; no `render()`, no `snapshot()`).

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

---

## Caveats (read before quoting these numbers)

- **Single machine, fast hardware.** Apple Silicon. The CPU-bound numbers (structural edit,
  pill-heavy render, search) scale with the machine — on weaker hardware the *comfortable*
  ceiling drops. The DOM-bounded numbers (keystroke, scroll) move little. Re-run on the
  slowest target device to find its real floor.
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
