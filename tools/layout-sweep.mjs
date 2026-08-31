#!/usr/bin/env node
// Measure where every control actually LANDS, at every width, on every chrome surface.
//
// WHY THIS EXISTS
// `tests/test.mjs` can pin that a CSS rule exists; it cannot see that two boxes land on top of each
// other, or that a button sits 40px past the screen. Every layout defect this project has shipped
// was found by a person looking at the app months later: UXP-256 (105px overlap), UXP-257 (145px
// indent), UXP-259 (the edit bar's Done button off the screen at 320px), #1523 (a dialog footer
// button with ZERO hit-testable pixels). The button-count ratchets catch growth; nothing measured
// position. This does.
//
// WHY IT IS CODE AND NOT A RECIPE (#1559)
// It used to live as a fenced code block inside `guidance/ux-definition-of-done.md`, copied into a
// scratchpad on demand, on the reasoning that verification artifacts stay out of git. The
// consequence is that nothing ran it and nothing could tell when it stopped working. It had in fact
// stopped: the first-run welcome chooser shipped after its numbers of record were taken, and
// `#io-back` then covered the viewport, so `elementFromPoint` returned the backdrop and EVERY
// control on EVERY non-dialog surface read as unreachable. The recipe went stale silently rather
// than breaking loudly, and that survived until someone re-ran it for an unrelated fix.
//
// This is the same argument #1427 made for `tests/browser.mjs`, and the same answer: a check nobody
// can tell has broken is not a check. `tests/browser.mjs` runs THE CONTROL below on every CI run,
// so a driver that stops working now fails a test instead of waiting to mislead the next reader.
//
// THE CONTROL IS FIRST, AND IT IS THE WHOLE DISCIPLINE.
// `#toolbar-row` is a surface verified clean. If it fails, the instrument is wrong -- fix the
// instrument before believing a single other row. The first version of this sweep reported 11 broken
// widths on a surface verified clean the same day; every "finding" in that run was an instrument
// bug. Three more instrument bugs have been found by that rule since, all in #1559.
//
// USAGE
//     node tools/layout-sweep.mjs                     # every surface, every width
//     node tools/layout-sweep.mjs --control           # just the control (what CI runs)
//     node tools/layout-sweep.mjs --surface io-foot   # substring match on selector or note
//     node tools/layout-sweep.mjs --widths 390,320
//     node tools/layout-sweep.mjs --app <path/to/index.html>

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

// ─── pure geometry cores ──────────────────────────────────────────────────────
// DOM-free by construction: they take plain {top,right,bottom,left} boxes and numbers. They are
// pinned in tests/test.mjs AND stringified into the page below, so the functions the tests prove
// are literally the functions the browser runs. A second in-page copy would be free to drift, and
// the whole point of this file is that drift stops being invisible.

// Two boxes share a line when they OVERLAP VERTICALLY.
// Not `Math.abs(topA - topB) < 12`: that magic number is exceeded by a short, vertically-centred
// child without anything wrapping. `#save-status` sits 13px down inside a 44px `#toolbar-row`, and
// the threshold version failed the CONTROL at all five widths <=560 while the bar stayed exactly
// one 44px line tall (#1559). Overlap is exact and needs no tuning.
export function sharesLine(a, b) {
  return Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
}

// How far a child escapes its host's content box, in px. 0 means it is inside.
// Two deliberate discounts, both real idioms in this codebase:
//  - NEGATIVE MARGINS are not spill. `#tbtn-cluster` is `padding:5px 5px 0 0; margin:-5px -5px 0 0`
//    so a focus ring can escape the clip; it legitimately sits 5px past its parent's content box.
//  - A CHILD THAT ABSORBS ITS OWN OVERFLOW is not spilling (#1559). The host-scrolls case was
//    already handled by the caller; this is one level down. `#tbtn-cluster` is not itself a
//    scroller, it CONTAINS a `.scroll-strip`. At 620px it extends 35px past the viewport and no
//    button is lost -- `offscreen` empty, `unreachable` empty, and an independent walk for buttons
//    past the viewport with no scrollable ancestor returns []. The strip absorbs it, by design.
export function spillPx(child, inL, inR, marginLeft, marginRight, absorbsOwnOverflow) {
  if (absorbsOwnOverflow) return 0;
  const mr = Math.min(0, marginRight || 0), ml = Math.min(0, marginLeft || 0);
  return Math.max(0, Math.max(Math.round(child.right + mr - inR), Math.round(inL - (child.left - ml))));
}

// A control is LOST when it sits past a viewport edge and nothing can scroll it back.
// Scrolled-out is not offscreen: icons scrolled out of a `.scroll-strip` are reachable by swiping.
export function isLost(rect, viewportW, hasScrollableAncestor) {
  if (hasScrollableAncestor) return false;
  return rect.right > viewportW + 1 || rect.left < -1;
}

// Is this control part of the surface being measured, for the purpose of judging REACH?
//
// The problem this solves in both directions (#1559). Focusing `#search-box` opens `#search-hint`,
// which covers `#level-ctl`, so every control measured afterwards reads as unreachable -- popups
// that open on focus have to be excluded. The old test was "the control's centre lies inside the
// host's rect", which excludes them, and ALSO silently excludes a control that has been pushed OUT
// of its own host. That is the most severe reachability failure there is, and it was the one the
// reach column could not report: #1523's "+ New pack" had SEVEN hit-testable pixels while
// `unreachable` sat empty.
//
// Vertical overlap separates the two cleanly, measured both ways: every control in the search
// popup has NEGATIVE vertical overlap with its host (-25 to -689px; it opens below the row), while
// a footer button shoved off the left of its card keeps FULL overlap (39px of a 39px row) because
// it is still laid out in that row. So: same band, still ours -- judge it.
//
// KNOWN LIMIT, measured and left in place deliberately. Off the row, this skips -- so a control
// scrolled out of a long flow pane is not judged, and #btn-restore reads clean at 320px where it is
// in fact off the window. The obvious repair is to skip only controls escaping through a positioned
// ancestor (the popup signature: all 44 search-hint controls sit inside a position:fixed box, while
// flow content does not). Tried, and REVERTED: it opens the walk to every scrolled-out row of the
// File menu, which scrollIntoView cannot reveal because the menu is fixed-position and taller than
// the window, so it reported ~45 unreachable controls per width where one was real. A column that
// cries wolf gets ignored, which is how the toolbar defect survived four PRs. The vertical extent of
// a scrolling sheet is UXP-261's question and the `past` column's job, not the reach walk's.
export function inMeasureBand(hostRect, rect) {
  return sharesLine(hostRect, rect);
}

// Does this row FAIL? One place, so the CLI and the CI gate cannot disagree about what "clean"
// means. `wraps`/`overflows` are per-surface declarations of intent: a row DECLARED to reflow
// (flex-wrap, flex-direction:column) is not failing when it reflows. Marking intent explicitly is
// the point -- a driver that prints six permanent FAILs teaches people to ignore it, which is how
// the toolbar defect survived four PRs.
export function rowFails(r, surface = {}) {
  if (r.missing || r.hidden) return false;
  return !!(r.overlaps.length || r.offscreen.length || r.unreachable.length || r.past > 1
    || (r.spill > 1 && !surface.overflows) || (r.lines > 1 && !surface.wraps));
}

// Where to hit-test a control: the centre of the part actually VISIBLE, given a clip box the caller
// computes (the viewport intersected with every clipping ancestor). Null when no part of it shows,
// which is the honest "nothing to aim at" answer rather than a coordinate off-window.
//
// The centre of the control's own BOX is wrong whenever the control is bigger than the area it
// shows in, and clipping to the VIEWPORT alone is not enough. #btn-restore is a 137px row at 360px
// inside a pane ending at y=588 in a 640px window: the box-centre aims at y=629 and the
// viewport-clipped centre at y=596, and BOTH land past the pane and hit the backdrop, so the control
// reads unreachable while 35px of it is plainly tappable. Clipped to the pane, the probe lands on it.
export function probePoint(rect, clip) {
  const left = Math.max(rect.left, clip.left), right = Math.min(rect.right, clip.right);
  const top = Math.max(rect.top, clip.top), bottom = Math.min(rect.bottom, clip.bottom);
  if (right - left < 1 || bottom - top < 1) return null;
  return { x: Math.round((left + right) / 2), y: Math.round((top + bottom) / 2) };
}

export const CORES = [sharesLine, spillPx, isLost, inMeasureBand, probePoint];

// ─── the surfaces ─────────────────────────────────────────────────────────────
// Each names the row to measure and the setup that renders it. A surface that does not render is
// reported as such, never as "clean".
export const SURFACES = [
  { sel: '#toolbar-row', touch: true, control: true, note: 'CONTROL — must pass, or the driver is wrong', setup: `` },
  { sel: '#edit-bar', touch: true, note: 'touch edit bar', setup: `
      const c = document.querySelectorAll('.node-content')[1], n = root.children[1];
      enterEdit(c, n); c.focus(); activeContentId = n.id; updateEditBar();` },
  { sel: '#quick-bar', touch: true, note: 'touch display-mode bar', setup: `
      activeContentId = null; updateEditBar(); updateQuickBar();` },
  { sel: '#doc-tabs', touch: false, note: '5 open documents', setup: `
      workspaceDir = { name: 'ws' };
      openTabs = ['inbox.opml','campaign-notes.opml','session-log.opml','characters.opml','worldbuilding.opml'];
      fileName = 'inbox.opml'; renderDocTabs();` },
  // `wraps: true` = this row is DECLARED to reflow, so a second line is the design, not a defect.
  { sel: '#capture-strip .cap-row', touch: true, wraps: true, note: 'capture row (.cap-row wraps)', setup: `toggleCapture();` },
  { sel: '#journal-strip .cap-row', touch: true, wraps: true, note: 'journal row (.cap-row wraps)', setup: `openJournalStrip();` },
  { sel: '#agenda-strip .ag-top', touch: true, wraps: true, note: 'agenda (.ag-top stacks <=560)', setup: `openAgenda();` },
  { sel: '#breadcrumb-row', touch: false, wraps: true, note: 'zoom trail (flex-wrap:wrap)', setup: `
      const deep = ['Campaign','Act one','The road north','A very long point title here'];
      root.children = []; let par = root;
      for (const t of deep) { const n = mkNode(t); n.type='ul'; n.children=[]; par.children.push(n);
        nodeMap.set(n.id,n); parentMap.set(n.id,par); par = n; }
      markDirty(); render(); zoomTo(par.id);` },
  // #1523: a dialog footer is one surface PER DOCUMENT STATE, not one surface. This was the
  // openMathDialog seed alone -- two buttons, which fit at every width, which is why the sweep
  // cleared `.io-foot` while Reusable packs' "+ New pack" had ZERO hit-testable pixels at 320.
  // openCalendarDialog and openUnitsDialog each grow a THIRD (danger) button once a calendar or
  // units already exist, so seed the configured state, never the state the app opens with.
  { sel: '.io-foot', touch: false, note: 'dialog footer, 2 btn', setup: `
      openMathDialog({ title:'Insert a calculation', submitLabel:'Insert', onResult(){} });` },
  { sel: '.io-foot', touch: true,  wraps: true, note: 'Reusable packs, 4 btn — found #1523', setup: `
      _packEditId = null; openDataPackManager();` },
  { sel: '.io-foot', touch: false, wraps: true, note: 'Reusable packs, 4 btn, MOUSE', setup: `
      _packEditId = null; openDataPackManager();` },
  { sel: '.io-foot', touch: true,  wraps: true, note: 'units ALREADY SET, 3 btn', setup: `
      applyUnitsChange('cp' + String.fromCharCode(10) + 'sp = 10 cp'); openUnitsDialog();` },
  { sel: '.io-foot', touch: true,  wraps: true, note: 'calendar ALREADY SET, 3 btn', setup: `
      applyCalendarChange(buildCalendarFromFields({ months:'Firstfrost: 30', week:'', eras:'', current:'1-01-01' }));
      openCalendarDialog();` },
  { sel: '.guide-header', touch: false, note: 'File menu header', setup: `openFileMenu();` },
  { sel: '.fm-head', touch: false, note: 'File menu doc header', setup: `openFileMenu();` },
  // `overflows: true` = a child is MEANT to exceed this box. #search-box:focus grows to the
  // help-popup width inside a 220px wrap in the 951-1279 band, which reads as spill. Verified
  // intentional: the focused field covers #level-ctl by 117px at EVERY width, including bands
  // UXP-256 never touched, and it stays hit-testable at its own centre at all of them.
  { sel: '#search-wrap', touch: false, overflows: true, note: 'search field (focus overlay BY DESIGN)', setup: `
      const sb = document.getElementById('search-box'); sb.focus();
      sb.value = 'is:todo'; sb.dispatchEvent(new Event('input', { bubbles: true }));` },
  // Round 2 (UXP-260/261): run every hover:none surface in BOTH input modes. Three defects have
  // been a narrow-window remedy gated on touch, so a mouse row is not a duplicate of the touch row.
  { sel: '.mt-baseheader', touch: true,  wraps: true, note: 'base header, touch', setup: `mkBase();` },
  { sel: '.mt-baseheader', touch: false, wraps: true, note: 'base header, MOUSE — found UXP-260', setup: `mkBase();` },
  { sel: '.mt-base-views', touch: true,  wraps: true, note: 'Table/Board/Cards/Calendar switcher', setup: `mkBase();` },
  { sel: '.graph-head',  touch: false, note: 'link graph header', setup: `mkLinks(); openGraph();` },
  { sel: '.tl-toggles',  touch: false, note: 'timeline filter toggles', setup: `mkDated(); openTimeline();` },
  { sel: '.tl-toggles',  touch: true,  note: 'timeline filter toggles, touch', setup: `mkDated(); openTimeline();` },
  { sel: '#file-menu .guide-body', touch: false, note: 'File menu two-pane body', setup: `openFileMenu();` },
  { sel: '#io-card .guide-body',   touch: false, note: 'concept guide two-pane — found UXP-261', setup: `openGuide('nav-move');` },
  { sel: '#io-card .builder-wrap', touch: false, note: 'All commands two-pane', setup: `
      mkLinks(); document.querySelector('.node-content')?.focus();
      await new Promise(r => setTimeout(r, 120)); document.getElementById('btn-builder').click();` },
];

export const WIDTHS = [1400, 1100, 950, 820, 700, 620, 560, 510, 430, 390, 360, 320];

// The save chip, frozen before measuring (#1559).
// `#save-status` is an in-flow flex child of `#toolbar-row` whose text tracks save state, so its
// width swings as autosave lands: "Saved" -> "✓Saved just now" is a 38px jump that shifts every
// child to its right, and it flipped the 620px verdict between two runs differing only in when the
// measurement landed. A geometry sweep must not race it. Below 561px the text is display:none (the
// glyph alone carries it), so this only binds above that.
//
// WHICH state to freeze is a real choice, and the answer is NOT "the widest" (#1560). Freezing to
// the widest reachable string -- "Not saved to a file · save one", the storage-blocked state, 183px
// against this one's 112px -- makes the CONTROL fail at 620 and 700, because it pushes #level-ctl's
// buttons past the viewport with no scrollable ancestor to bring them back. That is a REAL defect
// (driven through the app's own updateSaveStatus with its own globals, three buttons lost at 620),
// but the control's job is to validate the INSTRUMENT, so it has to sit in a state verified clean.
// The storage-blocked state is a surface worth sweeping in its own right; it gets its own row once
// #1560 is fixed, rather than shipping a permanently red line that teaches people to skip the sweep.
export const SAVE_STATUS_FREEZE = 'Saved just now';
export const SAVE_STATUS_FREEZE_KIND = 'saved';

export const SEED = `
  document.getElementById('storage-warn')?.remove();
  // #1523/#1559: DISMISS THE WELCOME CHOOSER, or the sweep measures nothing. It ships open on first
  // run and #io-back covers the whole viewport, so elementFromPoint returns the backdrop for every
  // control and every non-dialog surface reports 100% unreachable. This is the defect that made the
  // old recipe stale, and it is why the control is checked in CI now.
  if (typeof closeIo === 'function') closeIo();
  document.getElementById('io-back')?.classList.remove('on');
  // #1559: freeze the save chip so geometry does not depend on when the measurement lands.
  (() => {
    const el = document.getElementById('save-status');
    if (!el) return;
    if (typeof updateSaveStatus === 'function') window.updateSaveStatus = () => {};
    el.style.display = '';
    el.dataset.kind = ${JSON.stringify(SAVE_STATUS_FREEZE_KIND)};
    const ic = el.querySelector('.ss-ic'), tx = el.querySelector('.ss-text');
    if (ic) ic.textContent = '✓';
    if (tx) tx.textContent = ${JSON.stringify(SAVE_STATUS_FREEZE)};
  })();
  root.children = [];
  for (const t of ['Alpha point','Beta point with a longer title','Gamma']) {
    const n = mkNode(t); n.type = 'ul'; root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); }
  markDirty(); render();
  window.mkBase = () => { root.children = [];
    const rows = ['| Task | Status | Due | Cost |', '| --- | --- | --- | --- |',
                  '| Fix the roof | TODO | 2026-08-01 | 1200 |', '| Paint | DONE | 2026-08-09 | 300 |'];
    const n = mkNode(rows.join(String.fromCharCode(10))); n.type = 'base';
    root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); markDirty(); render(); };
  window.mkLinks = () => { root.children = [];
    for (const t of ['Target one', 'See [[Target one]] and [[Nowhere]]', 'Also [[Target one]]']) {
      const n = mkNode(t); n.type = 'ul'; root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); }
    markDirty(); render(); };
  window.mkDated = () => { root.children = [];
    for (const t of ['Ship it due:2026-08-01', 'Draft due:2026-09-15', 'Review start:2026-07-30']) {
      const n = mkNode(t); n.type = 'ul'; root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); }
    markDirty(); render(); };`;

// ─── the page-side measurement ────────────────────────────────────────────────
// Built from the SAME function objects exported above, so the cores under test are the cores that
// run. Everything below is glue: find the boxes, ask the cores.
// NO BACKTICKS BELOW THIS LINE: everything from here to the closing backtick is a template
// literal, and a stray backtick in a comment ends the string with a syntax error a long way from
// the cause. This has bitten three times.
export const MEASURE = CORES.map(f => f.toString()).join('\n') + `
window.__measure = async function (sel) {
  const host = document.querySelector(sel);
  if (!host) return { missing: true };
  const cs = getComputedStyle(host), hr = host.getBoundingClientRect();
  if (cs.display === 'none' || cs.visibility === 'hidden' || !hr.width || !hr.height) return { hidden: true };
  const vis = e => { const s = getComputedStyle(e), q = e.getBoundingClientRect();
                     return s.display !== 'none' && s.visibility !== 'hidden' && q.width > 0 && q.height > 0; };
  const name = e => e.id || (e.className && String(e.className).split(' ')[0]) || e.tagName.toLowerCase();
  const st = e => getComputedStyle(e);
  const box = e => { const q = e.getBoundingClientRect();
                     return { top: q.top, right: q.right, bottom: q.bottom, left: q.left }; };
  // Does this element, or anything inside it, absorb horizontal overflow by scrolling?
  const absorbs = e => {
    if (['auto','scroll'].includes(st(e).overflowX) && e.scrollWidth > e.clientWidth + 1) return true;
    for (const d of e.querySelectorAll('*'))
      if (['auto','scroll'].includes(st(d).overflowX) && d.scrollWidth > d.clientWidth + 1) return true;
    return false;
  };
  const scrollableUp = el => { for (let p = el.parentElement; p; p = p.parentElement)
      if (['auto','scroll'].includes(st(p).overflowX) && p.scrollWidth > p.clientWidth + 1) return true;
    return false; };
  // The region a control can actually be SEEN in: the window, cut down by every ancestor that
  // clips. Probing outside this lands on whatever does the clipping, which reads as unreachable.
  const clipBox = el => {
    let c = { top: 0, left: 0, right: innerWidth, bottom: innerHeight };
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = st(p);
      if (o.overflowX === 'visible' && o.overflowY === 'visible') continue;
      const q = p.getBoundingClientRect();
      c = { top: Math.max(c.top, q.top), left: Math.max(c.left, q.left),
            right: Math.min(c.right, q.right), bottom: Math.min(c.bottom, q.bottom) };
    }
    return c;
  };

  const kids = [...host.children].filter(vis);
  // Stacked-by-design children are excluded from the overlap check: #search-save / #search-clear
  // are position:absolute inside the field, sitting on the input on purpose.
  const inFlow = kids.filter(k => !['absolute','fixed'].includes(st(k).position));

  const overlaps = [];
  for (let i = 0; i < inFlow.length; i++) for (let j = i + 1; j < inFlow.length; j++) {
    const a = inFlow[i].getBoundingClientRect(), d = inFlow[j].getBoundingClientRect();
    const ox = Math.min(a.right, d.right) - Math.max(a.left, d.left);
    const oy = Math.min(a.bottom, d.bottom) - Math.max(a.top, d.top);
    if (ox > 1 && oy > 1) overlaps.push(name(inFlow[i]) + 'x' + name(inFlow[j]) + ':' + Math.round(ox));
  }

  // A COLUMN container is skipped outright: stacking is what column means, so counting its
  // children's tops always reports a wrap (.builder-wrap failed all 12 widths this way).
  const column = cs.display.includes('flex') && cs.flexDirection.startsWith('column');
  const lines = [];
  if (!column) for (const k of inFlow) { const q = box(k);
    if (!lines.some(u => sharesLine(u, q))) lines.push(q); }

  // A scroll container's own overflow is its feature; report it separately, never as spill.
  const scrolls = ['auto','scroll'].includes(cs.overflowX);
  const scrollOver = scrolls ? Math.round(host.scrollWidth - host.clientWidth) : 0;
  const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
  const inL = hr.left + padL, inR = hr.right - padR;
  let spill = 0, spiller = '';
  if (!scrolls) for (const k of inFlow) {
    const ks = st(k);
    const s = spillPx(box(k), inL, inR, parseFloat(ks.marginLeft) || 0, parseFloat(ks.marginRight) || 0, absorbs(k));
    if (s > spill) { spill = s; spiller = name(k); }
  }

  const offscreen = [];
  for (const el of host.querySelectorAll('button,[role=button],input,select,textarea')) {
    if (!vis(el) || el.disabled) continue;
    if (isLost(box(el), innerWidth, scrollableUp(el))) offscreen.push(name(el));
  }

  // Reach, with state reset between controls. Focusing one control can open a popup that covers the
  // next, so blur between them; skip disabled ones (pointer-events:none is correct for those).
  // walked is the inverse-vacuity guard. "unreachable: []" is also what a walk that judged NOTHING
  // reports, and the two are indistinguishable in the output -- the exact shape #1133 warns about.
  // The band filter below is a skip, so a filter that got too aggressive would silently empty the
  // walk and paint every surface clean. tests/browser.mjs asserts walked > 0.
  const unreachable = [];
  let walked = 0;
  // Judge every control from the SAME baseline. Revealing one control scrolls its pane, which moves
  // the next one, so without this the verdicts depend on document order: #btn-restore read
  // unreachable at 360px in the walk while an isolated probe at the same width reached it, and read
  // REACHABLE at 320px where an isolated probe could not reach it at all. Both directions wrong,
  // and the second is the dangerous one -- a defect hidden by the scroll position of its neighbour.
  const scrollers = [...host.querySelectorAll('*')].filter(e => {
    const o = st(e);
    return ['auto','scroll'].includes(o.overflowX) || ['auto','scroll'].includes(o.overflowY);
  });
  for (let e = host; e; e = e.parentElement) {
    const o = st(e);
    if (['auto','scroll'].includes(o.overflowX) || ['auto','scroll'].includes(o.overflowY)) scrollers.push(e);
  }
  const baseline = scrollers.map(e => [e, e.scrollLeft, e.scrollTop]);
  const resetScroll = () => { for (const [e, l, t] of baseline) { e.scrollLeft = l; e.scrollTop = t; } };

  for (const el of host.querySelectorAll('button,[role=button],input,select,textarea,[tabindex]')) {
    if (!vis(el) || el.disabled) continue;
    document.activeElement?.blur?.();
    resetScroll();
    await new Promise(r => setTimeout(r, 30));
    if (!vis(el) || !inMeasureBand(hr, box(el))) continue;
    // Reveal the control before judging it, then ask: is there ANY scroll position from which a
    // finger can land on it? Two attempts, because one is not enough and the difference is not
    // cosmetic. The nearest-nudge is the cheap, user-shaped one, but it is a NO-OP for an element
    // taller than its pane -- so it leaves whatever scroll position the PREVIOUS control in this
    // walk happened to set, and the verdict becomes order-dependent. That is what made #btn-restore
    // read unreachable at 360px in the sweep while an isolated probe of the same control at the
    // same width reached it comfortably. Centring is the deterministic retry.
    const reach = async (block) => {
      el.scrollIntoView({ block, inline: block === 'center' ? 'center' : 'nearest' });
      await new Promise(r => setTimeout(r, 40));
      if (!inMeasureBand(hr, box(el))) return null;
      const pt = probePoint(box(el), clipBox(el));
      if (!pt) return false;                       // no part of it is on screen at all
      const t = document.elementFromPoint(pt.x, pt.y);
      return !!t && (t === el || el.contains(t));
    };
    let got = await reach('nearest');
    if (got === null) continue;                    // left the host's band; not ours to judge
    walked++;
    if (got === false) got = await reach('center');
    if (!got) unreachable.push(name(el));
  }
  document.activeElement?.blur?.();
  resetScroll();

  // UXP-261: does the SHEET hang below the window? Measure the sheet, never the surface inside it:
  // including the host's own bottom made .io-foot report 56px past at every width, because the
  // footer sits below the fold of a scrollable #io-card, which is what scrolling is for.
  const sheet = host.closest('#io-card, #file-menu, #graph-panel, #timeline-panel') || host;
  const past = Math.round(sheet.getBoundingClientRect().bottom - innerHeight);
  return { kids: inFlow.length, h: Math.round(hr.height), lines: lines.length, overlaps,
           spill, spiller, scrollOver, offscreen, unreachable, walked, past: Math.max(0, past) };
};`;

// ─── the runner ───────────────────────────────────────────────────────────────
export async function sweep({ chromium, app, surfaces = SURFACES, widths = WIDTHS, onRow } = {}) {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
  const rows = [];
  try {
    for (const s of surfaces) {
      for (const w of widths) {
        const ctx = await browser.newContext({ viewport: { width: w, height: 640 }, hasTouch: !!s.touch, isMobile: !!s.touch });
        const page = await ctx.newPage();
        let setupErr = '';
        try {
          await page.goto(app);
          await page.waitForSelector('#outline', { timeout: 10000 });
          await page.waitForTimeout(500);
          await page.evaluate(SEED);
          await page.waitForTimeout(150);
          try { await page.evaluate(`(async () => { ${s.setup} })()`); }
          catch (e) { setupErr = String(e).split('\n')[0].slice(0, 120); }
          await page.waitForTimeout(350);
          await page.addScriptTag({ content: MEASURE });
          const r = await page.evaluate(sel => window.__measure(sel), s.sel);
          const row = { surface: s, width: w, setupErr, ...r, fail: rowFails(r, s) };
          rows.push(row);
          if (onRow) onRow(row);
        } finally { await ctx.close(); }
      }
    }
  } finally { await browser.close(); }
  return rows;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const argv = process.argv.slice(2);
  const flag = n => { const i = argv.indexOf(n); return i < 0 ? null : argv[i + 1]; };
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const app = flag('--app') ? 'file://' + resolve(flag('--app')) : 'file://' + join(ROOT, 'index.html');
  const only = flag('--surface');
  let surfaces = argv.includes('--control') ? SURFACES.filter(s => s.control)
    : only ? SURFACES.filter(s => s.sel.includes(only) || s.note.includes(only)) : SURFACES;
  const widths = flag('--widths') ? flag('--widths').split(',').map(Number) : WIDTHS;
  if (!surfaces.length) { console.error(`no surface matches ${JSON.stringify(only)}`); process.exit(2); }

  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.error('playwright is not installed (npm i -D playwright).'); process.exit(2); }

  let last = null, failures = 0;
  const rows = await sweep({ chromium, app, surfaces, widths, onRow(r) {
    if (r.surface !== last) {
      last = r.surface;
      console.log(`\n══ ${r.surface.sel}  — ${r.surface.note}${r.surface.touch ? '  [touch]' : ''}`);
      console.log('   width kids   h lines  overlaps                 spill  scroll  past  offscreen        unreachable');
    }
    const w = String(r.width).padStart(5);
    if (r.missing) return console.log(`   ${w}  (not in the DOM) ${r.setupErr}`);
    if (r.hidden)  return console.log(`   ${w}  (hidden at this width)`);
    if (r.fail) failures++;
    console.log(`   ${w} ${String(r.kids).padStart(4)} ${String(r.h).padStart(3)} ${String(r.lines).padStart(4)}   ` +
      `${(r.overlaps.join(',') || '-').padEnd(23)} ${String(r.spill).padStart(4)}${(r.spiller || '').slice(0,9).padStart(10)}  ` +
      `${String(r.scrollOver).padStart(5)}  ${String(r.past).padStart(4)}  ${(r.offscreen.join(',') || '-').padEnd(15)}  ` +
      `${r.unreachable.join(',') || '-'}${r.fail ? '   <== FAIL' : ''}`);
  } });
  console.log(`\n${rows.length} rows, ${failures} failing.`);
  process.exit(failures ? 1 : 0);
}
