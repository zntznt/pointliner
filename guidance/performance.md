# Pointliner — Performance baseline

**Measured:** 2026-06-29 · **Build:** `main` @ `bdd7bad` · **Machine:** Apple Silicon Mac
(headless Chrome via DevTools, the full real app — not a Node micro-benchmark).
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
- **The first thing you *feel* is structural editing past ~25k.** Enter / indent / delete /
  move each do a full `render()` + a whole-tree `JSON.stringify` undo snapshot: ~6ms at
  10k, ~30ms at 25k, ~88ms at 50k. Plain typing never pays this.
- **Why it doesn't lag like Logseq/Roam at a few thousand nodes:** two deliberate choices —
  (1) a genuinely **virtualized DOM** (~35 row elements exist at any size), and (2) the
  **keystroke hot path does near-zero whole-tree work** (the 8 doc-caches are lazy *and*
  not read on every keystroke — only when you type a trigger like `/`, `{`, `#`).

---

## Results

### Per-keystroke latency — the number that matters most

Real `input` events fired through the live `attachContentEvents` handler (`editableText` +
`markDirty` + `scheduleReconcile` + the `checkSlash`/`checkBrace`/`checkTag`/… chain), in a
**fully-expanded** 10k-node document (all 10,000 rows visible, nothing collapsed):

| metric | value |
|---|---|
| median | **0.2 ms** |
| p95 | 1.2 ms |
| max | 2.3 ms |

Even forcing `markDirty()` *before every keystroke* (worst case — every doc-cache
invalidated) held the median at **0.1 ms**: the input handler does not read the caches on a
plain keystroke. Typing is effectively O(1) regardless of document size, by design.

### Operation sweep (single ops, timed through the live functions)

| nodes | render | structural edit | search (plain term) | autosave `JSON.stringify` | `toOpml` | undo `snapshot` | doc size |
|------:|-------:|----------------:|--------------------:|--------------------------:|---------:|----------------:|---------:|
| 1k    | 11 | 2.5 | 10  | 0.7 | 4  | 0.3 | 0.24 MB |
| 5k    | 6  | 17  | 21  | 2.3 | 10 | 1.7 | 1.2 MB |
| 10k   | 10 | 6   | 34  | 2.2 | 10 | 3.2 | 2.4 MB |
| 25k   | 88 | 31  | 84  | 17  | 35 | 14  | 5.8 MB |
| 50k   | 41\* | 88 | **231** | 29 | 58 | 30 | 11.5 MB |

\* `render()` is virtualized so the initial paint is bounded; the apparent dip at 50k is
GC/JIT noise, not a real improvement. The genuine growth is in the O(total-nodes) paths
(serialize / search / snapshot), not render.

### Scroll (fully-expanded 10k doc) and pill-heavy documents

| scenario | result |
|---|---|
| Scroll, per virtual-window recompute frame (10k expanded) | median **2.3 ms**, max 16 ms (~60fps) |
| Pill-heavy render: 5k rows, each a dice pill + var ref + `#tag` | 24 ms |
| Pill-heavy structural edit (insert mid-tree) | 6.4 ms |
| All 8 doc-caches cold re-walk at 10k | 6 ms |
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

## Bases (measured 2026-07-16 · `main` @ post-#792 · Linux container, headless Chromium)

Bases are the one surface the outline's row virtualization does NOT cover: a base is a
single outline row whose widget holds ALL its cell DOM. Measured through the live code
paths (real `input` events in a cell, the real focusout commit), 4 columns per row.
**Hardware caveat:** this section was measured on a slower container CPU than the Apple
Silicon numbers above — compare within this table, not across sections.

| rows | widget build | full render (doc w/ base) | cell keystroke (med) | focusout commit | focusout, projecting varbase |
|-----:|-------------:|--------------------------:|---------------------:|----------------:|------------------------------:|
| 100  | ~10 ms  | ~45 ms   | 0.3 ms | ~1 ms  | ~5 ms |
| 500  | ~25 ms  | ~150 ms  | ~1 ms  | ~1 ms  | ~18 ms |
| 1k   | ~45 ms  | ~240 ms  | ~1.5 ms | ~3 ms | ~28 ms |
| 5k   | ~230 ms | ~1.6 s   | ~7–20 ms | ~12 ms | ~150 ms |

- **The envelope: a base is comfortable to a few hundred rows, usable to ~1k.** Widget
  build is linear in cells; typing stays flat (the per-keystroke session parse reuse) until
  the whole-table serialize itself grows (~5k rows).
- **The lever is the rows cap, not virtualization.** The BC rows cap (All/5/10/20) clips
  the inline DOM; a capped 5k-row base paints like a 20-row one in the outline. In-widget
  row virtualization was CONSIDERED AND REJECTED for now (bases-direction §7c): sticky
  header/focus/selection across a virtual window inside a `<table>` is high-complexity for
  a case the cap already handles. Revisit trigger: a real workflow needs a >1k-row base
  fully expanded (zoomed) at typing speed.
- **The varbase focusout was the real hot spot — fixed in the same pass.** The B1 sibling
  repaint patched ALL N×C cells on every cell blur of a projecting base (~870 ms at 5k
  rows). `mtPatchCells` is now token-scoped there (only cells holding pill tokens can
  change from a sibling edit): ~5 ms at 100 rows, ~150 ms at 5k (the residue is the
  commit epilogue's prune + recompute over the large text, plus the cell scan).
- **Query bases are bounded by their cap** (`QBASE_ROW_CAP` 100): the projected model over
  5k matching points computes in ~8 ms cold and is generation-memoized (0 ms warm).
- **Varbase projection cost rides the vars generation:** `collectVars` with a 5k-row
  projection is ~50–80 ms per cold read — lazy (only on the next read after an edit), but
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
2. **Structural-edit latency (degrades past ~25k).** Each structural op pays `pushUndo` →
   `snapshot` (`JSON.stringify(root)`, O(total)) + a full `render()` + the next reads of the
   doc-caches. ~30 ms at 25k, ~88 ms at 50k. *Plain text typing avoids all of this*
   (`recordTextEdit` is an O(1) per-node diff; no `render()`, no `snapshot()`).
3. **Search (~230 ms/query at 50k).** Each *applied* query (debounced 140 ms, so not
   per-keystroke) is a full `computeMatchSet` walk; `is:failing` additionally runs
   `evalCheck` per node. Fine to ~10k (~34 ms), noticeable past ~25k.

---

## Why the architecture holds (the load-bearing design choices)

- **Virtualized DOM.** Only a viewport-sized window of rows is in the DOM (`renderWindow`,
  `OVERSCAN=10`, `EST_ROW=30`); ~35 elements at 10k or 50k alike. Render / scroll / per-node
  edit DOM work is bounded by the *window*, not the document. This is the single biggest
  reason it doesn't die where DOM-the-whole-tree outliners do.
- **Lazy, generation-keyed caches.** `markDirty()`/`resetDocCaches()` do exactly `_varsVer++`;
  the 8 whole-tree collectors (`collectVars`, `collectRules`, `collectLinks`, `collectTags`,
  `collectCallables`, `allSequences`, `knownStates`, `stateCmds`) re-walk only on the *next
  read after* an edit — and the keystroke path doesn't read them. A full cold re-walk of all
  eight is ~6 ms at 10k, so even pathological invalidation is cheap.
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
  bare `render()` call.
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
