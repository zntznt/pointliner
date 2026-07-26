# Pointliner — UX Definition of Done

## The conformance gate for every UI change

> On-merge gate. The project enforces a 12-step recipe for new *artifacts* but has **no gate for any other UI work** — keyboard, tables, menus, toolbar, links, states. This is that gate. It applies to **any change that touches the DOM, a shortcut, copy, or an interaction**, not just artifacts.

**How to use it**
- Run this checklist before declaring *any* UI-touching change done. A change that passes its tests but fails a box here is **not done** (Prime Directive, `ux-discipline.md` §0).
- Each box cites the rule it enforces — a reviewer (human or AI) MUST be able to name the rule.
- Not every box applies to every change; mark **N/A** with a one-word reason. Silence is not N/A.
- For a **new artifact**, this is **step 13** of `adding-an-artifact.md` — the recipe builds it, this gate ships it.
- The three engineering invariants (`node.text` plain text · keyboard *alongside* `mousedown` · per-row ARIA at render) are preconditions — a fix that violates one is rejected regardless of the boxes below.

---

## How this gate is run (the due process — every change, no exceptions)

The gate only works if it is **run and proven**, not assumed. The artifact that proves it is the **Conformance Statement** — its absence means the change is unfinished. The boxes in §§1–7 are *what* to check; this is *how* the check actually happens, every time.

**Trigger.** Any change that touches the DOM, a shortcut, copy, or an interaction. A pure logic / core-only change with no UI surface is exempt — say so in the statement (`UI: none`).

**Stage 1 — Author (the AI), before declaring "done":**
1. **Pre-check (P5/P2):** can this ride the `{…}` engine / `evalMath` / an existing affordance instead of new syntax or a new control? Reuse first.
2. **Build to the patterns:** keyboard grammar §3, the menu/pill/feedback patterns §7, the canonical vocabulary §1.
3. **Walk the checklist (§§1–7):** every box gets ✅ + a one-line *how*, or **N/A + a one-word reason**. No silent boxes.
4. **File new gaps:** any non-conformance the change cannot fully close MUST be filed in `ux-remediation.md` as a new `UXP-NN`. An *un-filed* non-conformance is a reject.
5. **Run the five acceptance tests + regression** (tests green, touch path, OPML round-trip).
6. **Emit the Conformance Statement** (template below) in the PR/commit body.

**Stage 2 — Reviewer (a human or a second agent):**
- **Do not re-derive — check the statement against the diff;** spot-check each ✅.
- Hunt the four invisible violations: **new syntax** (P5), a **new keybinding absent from §3** (P1), a **control converted to `click`/`<button>`** (caret invariant), a **silent failure / no-op** (P4).
- Confirm any deferred gap was filed as a `UXP`.
- **No statement, or any falsely-ticked box → not merged.** That binary is the enforcement.

**Conformance Statement — the required artifact:**
```
UX Conformance — <change>
P1 ✅ <how>   P2 ✅ <how>   P3 ✅ <how>   P4 ✅ <how>   P5 ✅ <how>
New non-conformances filed: UXP-NN | none
Acceptance tests: pass    Regression: tests green · touch · OPML
```
Use `N/A — <reason>` for any principle a change genuinely doesn't touch (a copy-only fix is `P1 N/A`). It is short by design — most boxes are one phrase. Its purpose is not ceremony: it makes a skipped gate or a false claim **visible and catchable against the diff**.

> **Where it goes (so CI passes):** Put the Conformance Statement in the **PR description** —
> not the commit message, not a comment. It must start with the literal words `UX Conformance`,
> carry a ✅ or N/A on each of P1–P5, and contain no `< >` placeholders. For a non-UI change the
> description is just `UI: none`. When creating the PR with `gh pr create`, pass all of this in
> `--body` (it overrides the PR template).

> **The rule in one line:** *no Conformance Statement, no merge.* A change is done when the statement is present, every box is honestly ✅ or N/A, and any gap it leaves is filed as a UXP.

---

## 1. Predictable — P1

- [ ] **No context inversion.** No key changes meaning by block type. `Enter`/`Shift+Enter` behave identically everywhere. *(P1-1)*
- [ ] **Fits the keyboard grammar.** Any new shortcut matches `ux-discipline.md` §3; if it introduces a new modifier meaning, §3 was edited first. *(P1-2)*
- [ ] **`Esc` resolves outward** in the standard order, if used. *(P1-3)*
- [ ] **Destructive keys guarded.** No data loss on a single keystroke without the empty-and-childless (or equivalent) guard. *(P1-4)*
- [ ] **Browser-claimable chords aren't the only path.** *(P1-5)*

## 2. Discoverable — P2

- [ ] **All three doors exist and agree:** visible affordance (≥ Guided floor) + typed path + menu path. *(P2-1)*
- [ ] **The menu teaches the syntax** — every menu item shows label + description + typed form. *(P2-2)*
- [ ] **No raw-markdown-only or syntax-only capability** — power syntax is retained, but an affordance exists. *(P2-3)*
- [ ] **Built ≠ hidden** — nothing is gated entirely off with no front door at any verbosity. *(P2-1)*
- [ ] **Generated/stateful data is inspectable** where relevant (variables, tags). *(P2-4)*
- [ ] **Lean-compatible** — the bare interaction ships first; helpers are a separate verbosity-gated overlay. *(`ux.md` build discipline)*

## 3. Reachable — P3 (additive only; defers to `accessibility.md` for sequencing)

- [ ] **Accessible name** on every interactive element (`aria-label`/visible label; not `title` alone); decorative glyph `aria-hidden`. *(P3-1)*
- [ ] **Keyboard operable** via a `keydown` listener **added beside** the existing `mousedown` — never by converting to `click`/`<button>`. *(P3-2, caret invariant)*
- [ ] **Focus-visible** on every new focus stop; **reduced-motion** respected for any new animation. *(P3-3)*
- [ ] **Not color-alone** — any new state/error also carries text or icon. *(P3-4)*
- [ ] **Off-focus changes announced** via the `aria-live` region (reroll, error, async result, a filter's match count). *(P3-5, `accessibility.md` guardrail 4)*
- [ ] **Tap targets clear WCAG 2.2 (24px), aim for the 36–38px strip idiom** under `@media(hover:none)` for every new tappable control; padding or an invisible `::after` overlay (the docked-strip `inset:-8px` recipe) may extend past the visual box. *(`accessibility.md` guardrail 5, reconciled 2026-07-06)*
- [ ] **Deferred items still labeled** — if it's a pill or outline row, it carries an accurate `aria-label` even though `tabindex`/`role=tree` are sequenced later. *(P3-6 interim)*
- [ ] **ARIA set per-row at render time**, not via a global post-pass. *(virtual-list invariant)*

## 4. Responsive — P4

- [ ] **No silent failure** — every rejected input signals why. *(P4-1)*
- [ ] **Errors explain the cause** — no bare `#ERR`/no-op. *(P4-2)*
- [ ] **Structural/destructive actions confirm** via the toast. *(P4-3)*
- [ ] **Reuses the feedback pattern** (toast / inline marker / `aria-live` / banner) — no bespoke feedback UI. *(P4-4)*
- [ ] **Drafts survive dismissal**: a transient input surface never silently discards non-empty typed input. *(`ux-discipline.md` §6 drafts)*

## 5. Coherent authoring language — P5

- [ ] **No new syntax.** This change introduces **zero** new top-level delimiters, sigils, or notation — it reuses a family from the inventory (`ux-discipline.md` §2/P5). *(P5-1)*
- [ ] **Generative/computed content goes through `{…}`** — a new `resolveBrace` branch or `evalMath` primitive, not a new delimiter. *(P5-2)*
- [ ] **No duplicate syntax.** If a new notation was unavoidable, it **replaces** the one it overlaps (and the old one is removed) — it does not sit beside it. *(P5-3)*
- [ ] **Inventory + `?` panel updated** for any sanctioned syntax change. *(P5-4)*
- [ ] **Subsume-first considered** — extending an existing grammar was evaluated before adding a sibling. *(P5-5)*

> If any box here is unchecked because the change *adds* syntax, that addition needs explicit owner sign-off recorded in the PR. The default answer to "should this be a new syntax?" is **no**.

## 6. Vocabulary & patterns

- [ ] **User-facing copy uses the canonical terms** (`ux-discipline.md` §1 — "point" not "node/item", "pill" not "widget", etc.). *(V-1)*
- [ ] **Internal `node`/`artifact` identifiers untouched.** *(V-2)*
- [ ] **Reuses the menu / pill / feedback / affordance patterns** rather than reinventing. *(§7)*
- [ ] **Copy describes outcomes, not mechanics**, in plain language. *(§8)*
- [ ] **Labels are sentence case**; "Markdown" is always capitalized in user-facing copy. *(§8)*
- [ ] **Dialog footers order dismiss/neutral first, the committing action last; danger takes the final slot.** *(§7.6)*
- [ ] **Dismiss buttons reuse `.close-btn` and the `fa-xmark` glyph**; no bespoke close styling. *(design-language §4)*

## 7. Regression & verification

- [ ] **Pins ship WITH the logic**, not just stay green (`node --test tests/test.mjs`). Any new pure sub-logic (a parse/eval/roll core, an index collector, a command pool, a model/layout, a lookup, a caret/text calc) gets a **new** seeded pin in `tests/test.mjs` + its name in `load-cores.mjs` `need`; new DOM wiring that can't run headless gets a **source-pin** (`_src.includes(…)`). A DOM-heavy feature is not exempt. "Existing tests stayed green" is **not** sufficient for a logic-bearing change. *(`CLAUDE.md` working method)*
- [ ] **Touch path shipped** for any new hover/mouse interaction (`@media(hover:none)` + long-press where applicable). *(`CLAUDE.md` touch invariant)*
- [ ] **Interaction driven in the running app**, not just source-pinned, for any focus/keyboard/caret/drag change: reproduce it in a headless browser and watch the primitive (`activeElement`, the handler firing, the caret offset). A source-pin proves presence, not behavior — a keydown handler on an unfocusable element is dead code that still passes its pin. *(builder keyboard-nav regression, #1021)*
- [ ] **OPML round-trip** preserved for any new persisted data (serialize + parse in the same change). *(`CLAUDE.md`)*
- [ ] **Design-language conformance** for any visual change (`guidance/design-language.md`): colors via tokens (semantic `--ok/--warn/--bad/--info`, `--acc-fg` on accent backgrounds, radii/shadows from the token sets), new color pairs ship their contrast ratio, the palette change lands in **both** homes (CSS *and* the `applyTheme`/`applyAccentCSS` strings), and both-mode + forced-theme screenshots were checked. *(design-language §3/§6)*
- [ ] **Drift guards stay green**: `node --test tests/test.mjs` carries the design pins (dual-home token parity, radius/weight/size floors, and the em-dash ban — now enforced across **all** user-facing copy: `README.md`, the whole `guide/` tree, every GUIDE body/example, and every command `desc`, not the three narrow spots it used to spot-check) and CI runs them on every PR. *(tests/test.mjs)*
- [ ] **Layout swept across widths** for any change to a fixed-height bar, a flex row, or a breakpoint: run the layout driver below and confirm **zero overlaps, zero wraps, zero controls off the viewport, zero unreachable controls** — and confirm the driver's own control surface passes first. A screenshot at one width is not a sweep: the toolbar overlap was invisible at 900px and 105px wide at 1000px, and the edit bar looked perfect at 375px while losing its Done button at 320px. *(UXP-256/257/258/259)*
- [ ] **Acceptance tests met** — the five self-checks below.

### The layout driver (the check that catches what a pin cannot)

`tests/test.mjs` can pin that a *rule exists*; it cannot see that two boxes land on top of each
other. Every layout defect this project has shipped was found by a person looking at the app, months
later: UXP-256 (105px overlap), UXP-257 (145px indent), UXP-259 (the edit bar's Done button off the
screen at 320px, present since before the toolbar work). The button-count ratchets catch *growth*;
nothing measured *position*. This driver is that measurement. It lives in the scratchpad, never in
the repo (`CLAUDE.md`: verification artifacts stay out of git); what is recorded here is the recipe,
the corrections it needed, and the numbers.

> **`#toolbar-row` is the control, and it is listed first for a reason. If the control fails, the
> driver is wrong — fix the driver before believing a single other row.** The first version of this
> sweep reported 11 broken widths on a surface verified clean the same day. Every "finding" in that
> run was an instrument bug.

**What it measures, and why each is a rectangle and not an eyeball:**

| check | how | the defect it catches |
|---|---|---|
| **Overlap** | rectangle intersection of every visible **in-flow** pair of children | UXP-256: `#search-wrap` was `position:absolute` above 950px, so flex laid `#level-ctl` out as if it were not there — 21px of overlap at 9 toolbar buttons, **105px at 11** |
| **Wrap** | distinct child top-offsets, **ignoring gaps under 12px and zero-height children** | UXP-258: a wrapped row makes the bar's height a function of the button count |
| **Offscreen** | a control past the viewport edge **with no scrollable ancestor to reveal it** | UXP-259: `#eb-done` 40px past the screen at 320px, `elementFromPoint` returning nothing |
| **Reach** | scroll each control into view, then `elementFromPoint` at its centre | a scrolling strip that hides a control with no way to get to it |
| **Scroll cue** | the `.more-l` / `.more-r` classes at scrollLeft 0 / middle / max | a hidden scrollbar with a permanently painted fade lies about there being more (P4) |

**The five corrections, each traced to a real CSS idiom the naive version misread.** Keep them: they
are why the control passes.

1. **Negative margins are not spill.** `#tbtn-cluster` is `padding:5px 5px 0 0; margin:-5px -5px 0 0`
   so a focus ring can escape the clip; it legitimately sits 5px past its parent's content box.
2. **A scroll container's overflow is its feature.** `#doc-tabs` is `overflow-x:auto` with a visible
   scrollbar. Report `scrollWidth` overflow separately and never as spill.
3. **Deliberate stacking is not overlap.** `#search-save` / `#search-clear` are `position:absolute`
   inside the field, sitting on the input by design. Compare in-flow children only.
4. **Reset focus between controls.** Focusing `#search-box` opens `#search-hint`, which then covers
   `#level-ctl`, so every control measured afterwards reads as unreachable. Blur between controls,
   skip `disabled` ones (`pointer-events:none` is correct for those), and only walk controls whose
   centre lies inside the container's own rect, which excludes popups that open on focus.
5. **Scrolled-out is not offscreen.** Icons scrolled out of a `.scroll-strip` are reachable by
   swiping. Only a control with no scrollable ancestor is genuinely lost.

**And one that does not belong in the generic driver at all:** on `#edit-bar`, calling `.focus()` on
a button moves focus out of the point being edited, which **ends the edit and hides the bar** — so
every reading after the first button comes from a hidden bar. The bar is tapped via
`mousedown`+`preventDefault` (the caret invariant), so reach there is measured by *scrolling*, not
focusing. A per-surface probe sometimes needs a different verb than the sweep.

**Numbers of record.** Chromium, `hasTouch`. `before` is `c91028b` (the last build with the toolbar
defects) and `af0ecbf` for the bars; `after` is `HEAD`.

| surface | before | after |
|---|---|---|
| `#toolbar-row` **(control)** | 124px overlap at 1100, 130px at 1000, `btn-builder` unreachable; wrapped to 88px then 133px tall below 560 | **0 failures at all 12 widths**; one 44px line, strip scrolls 65 → 337px |
| `#edit-bar` | `#eb-done` 20px past the viewport at 340, **40px at 320**, untappable | 53px, one line, Done flush and hit-testable at 320; tools scroll 13 → 52px |
| `#quick-bar` | clean (6 buttons fit) | clean; same structure as the edit bar so a 7th cannot silently break it |
| `#doc-tabs` | scrolls with a visible scrollbar; the `+` sits at the far end with 5 docs open | unchanged, not a defect |
| `#capture-strip .cap-row`, `#journal-strip .cap-row` | 2 lines ≤560 | unchanged — declared `.cap-row{flex-wrap:wrap}`, so marked `wraps: true` |
| `#agenda-strip .ag-top` | 2 lines ≤560 | unchanged — declared `flex-direction:column`, marked `wraps: true` |
| `#breadcrumb-row` | 2 lines ≤430 | unchanged — declared `flex-wrap:wrap`, marked `wraps: true` |
| `.io-foot`, `.guide-header`, `.fm-head` | clean | clean |
| `#search-wrap` | focused box covers `#level-ctl` by **117px** | **unchanged and not a defect** — identical at 1350 (wide design) and 900 (narrow design), i.e. the intended focus overlay, not a UXP-256 side effect |

The last two rows exist so neither gets re-filed. A by-design `flex-wrap` and an intended overlay
both look exactly like defects in a table of numbers; what distinguishes them is that they are
**identical across bands the change never touched**.

<details>
<summary>Layout driver (scratchpad Playwright — Chromium at <code>/opt/pw-browsers/</code>, never <code>npx playwright install</code>)</summary>

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const APP = 'file:///home/user/pointliner/index.html';

// The control is FIRST. Each surface names the row to measure and the setup that renders it;
// a surface that does not render is reported as such, never as "clean".
const SURFACES = [
  { sel: '#toolbar-row', touch: true, note: 'CONTROL — must pass, or the driver is wrong', setup: `` },
  { sel: '#edit-bar', touch: true, note: 'touch edit bar', setup: `
      const c = document.querySelectorAll('.node-content')[1], n = root.children[1];
      enterEdit(c, n); c.focus(); activeContentId = n.id; updateEditBar();` },
  { sel: '#quick-bar', touch: true, note: 'touch display-mode bar', setup: `
      activeContentId = null; updateEditBar(); updateQuickBar();` },
  { sel: '#doc-tabs', touch: false, note: '5 open documents', setup: `
      workspaceDir = { name: 'ws' };
      openTabs = ['inbox.opml','campaign-notes.opml','session-log.opml','characters.opml','worldbuilding.opml'];
      fileName = 'inbox.opml'; renderDocTabs();` },
  // `wraps: true` = this row is DECLARED to reflow (flex-wrap / flex-direction:column in its own
  // rule), so a second line is the design, not a defect. Marking intent explicitly is the point: a
  // driver that prints six permanent FAILs teaches people to ignore it, which is how the toolbar
  // defect survived four PRs. An UNexpected wrap on any other surface still fails.
  { sel: '#capture-strip .cap-row', touch: true, wraps: true, note: 'capture row (.cap-row wraps)', setup: `toggleCapture();` },
  { sel: '#journal-strip .cap-row', touch: true, wraps: true, note: 'journal row (.cap-row wraps)', setup: `openJournalStrip();` },
  { sel: '#agenda-strip .ag-top', touch: true, wraps: true, note: 'agenda (.ag-top stacks ≤560)', setup: `openAgenda();` },
  { sel: '#breadcrumb-row', touch: false, wraps: true, note: 'zoom trail (flex-wrap:wrap)', setup: `
      const deep = ['Campaign','Act one','The road north','A very long point title here'];
      root.children = []; let par = root;
      for (const t of deep) { const n = mkNode(t); n.type='ul'; n.children=[]; par.children.push(n);
        nodeMap.set(n.id,n); parentMap.set(n.id,par); par = n; }
      markDirty(); render(); zoomTo(par.id);` },
  { sel: '.io-foot', touch: false, note: 'dialog footer', setup: `
      openMathDialog({ title:'Insert a calculation', submitLabel:'Insert', onResult(){} });` },
  { sel: '.guide-header', touch: false, note: 'File menu header', setup: `openFileMenu();` },
  { sel: '.fm-head', touch: false, note: 'File menu doc header', setup: `openFileMenu();` },
  // `overflows: true` = a child is MEANT to exceed this box. #search-box:focus grows to 592px (the
  // help-popup width, so the two read as one unit) inside a 220px wrap in the 951-1279 band, which
  // reads as 372px of spill. Verified intentional, not a UXP-256 side effect: the focused field
  // covers #level-ctl by 117px at EVERY width, including 1350 and 900 — bands that change never
  // touched. Same reasoning as `wraps`: an unexplained red row trains people to skip the whole sweep.
  { sel: '#search-wrap', touch: false, overflows: true, note: 'search field (focus overlay BY DESIGN)', setup: `
      const sb = document.getElementById('search-box'); sb.focus();
      sb.value = 'is:todo'; sb.dispatchEvent(new Event('input', { bubbles: true }));` },
];
const WIDTHS = [1400, 1100, 950, 820, 700, 620, 560, 510, 430, 390, 360, 320];

const MEASURE = `window.__measure = async function (sel) {
  const host = document.querySelector(sel);
  if (!host) return { missing: true };
  const cs = getComputedStyle(host), hr = host.getBoundingClientRect();
  if (cs.display === 'none' || cs.visibility === 'hidden' || !hr.width || !hr.height) return { hidden: true };
  const vis = e => { const s = getComputedStyle(e), q = e.getBoundingClientRect();
                     return s.display !== 'none' && s.visibility !== 'hidden' && q.width > 0 && q.height > 0; };
  const name = e => e.id || (e.className && String(e.className).split(' ')[0]) || e.tagName.toLowerCase();
  const st = e => getComputedStyle(e);
  const kids = [...host.children].filter(vis);
  // (3) stacked-by-design children are excluded from the overlap check.
  const inFlow = kids.filter(k => !['absolute','fixed'].includes(st(k).position));
  const overlaps = [];
  for (let i = 0; i < inFlow.length; i++) for (let j = i + 1; j < inFlow.length; j++) {
    const a = inFlow[i].getBoundingClientRect(), d = inFlow[j].getBoundingClientRect();
    const ox = Math.min(a.right, d.right) - Math.max(a.left, d.left);
    const oy = Math.min(a.bottom, d.bottom) - Math.max(a.top, d.top);
    if (ox > 1 && oy > 1) overlaps.push(name(inFlow[i]) + 'x' + name(inFlow[j]) + ':' + Math.round(ox));
  }
  // Zero-area children have no visual line (.eb-spacer sits 20px below the buttons and read as a
  // second row), and a sub-12px difference is button-height noise, not a wrap.
  const tops = [];
  for (const k of inFlow) { const t = Math.round(k.getBoundingClientRect().top);
                            if (!tops.some(u => Math.abs(u - t) < 12)) tops.push(t); }
  // (2) a scroll container's overflow is its feature; (1) spill discounts negative margins.
  const scrolls = ['auto','scroll'].includes(cs.overflowX);
  const scrollOver = scrolls ? Math.round(host.scrollWidth - host.clientWidth) : 0;
  const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
  const inL = hr.left + padL, inR = hr.right - padR;
  let spill = 0, spiller = '';
  if (!scrolls) for (const k of inFlow) {
    const q = k.getBoundingClientRect(), ks = st(k);
    const mr = Math.min(0, parseFloat(ks.marginRight) || 0), ml = Math.min(0, parseFloat(ks.marginLeft) || 0);
    const s = Math.max(Math.round(q.right + mr - inR), Math.round(inL - (q.left - ml)));
    if (s > spill) { spill = s; spiller = name(k); }
  }
  // (5) past the viewport is only a failure with no scrollable ancestor to bring it back.
  const scrollableUp = el => { for (let p = el.parentElement; p; p = p.parentElement)
      if (['auto','scroll'].includes(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth + 1) return true;
    return false; };
  const offscreen = [];
  for (const el of host.querySelectorAll('button,[role=button],input,select,textarea')) {
    if (!vis(el) || el.disabled) continue;
    const q = el.getBoundingClientRect();
    if ((q.right > innerWidth + 1 || q.left < -1) && !scrollableUp(el)) offscreen.push(name(el));
  }
  // (4) reach, with state reset between controls and popups excluded by geometry.
  const unreachable = [];
  const inHost = el => { const q = el.getBoundingClientRect();
    const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
    return cx >= hr.left - 1 && cx <= hr.right + 1 && cy >= hr.top - 1 && cy <= hr.bottom + 1; };
  for (const el of host.querySelectorAll('button,[role=button],input,select,textarea,[tabindex]')) {
    if (!vis(el) || el.disabled) continue;
    document.activeElement?.blur?.(); await new Promise(r => setTimeout(r, 30));
    if (!vis(el) || !inHost(el)) continue;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    await new Promise(r => setTimeout(r, 40));
    if (!inHost(el)) continue;
    const q = el.getBoundingClientRect();
    const t = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2));
    if (!t || !(t === el || el.contains(t))) unreachable.push(name(el));
  }
  document.activeElement?.blur?.();
  return { kids: inFlow.length, h: Math.round(hr.height), lines: tops.length, overlaps,
           spill, spiller, scrollOver, offscreen, unreachable };
};`;

const SEED = `
  document.getElementById('storage-warn')?.remove();
  root.children = [];
  for (const t of ['Alpha point','Beta point with a longer title','Gamma']) {
    const n = mkNode(t); n.type = 'ul'; root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); }
  markDirty(); render();`;

for (const s of SURFACES) {
  console.log(`\n══ ${s.sel}  — ${s.note}${s.touch ? '  [touch]' : ''}`);
  console.log('   width kids   h lines  overlaps                 spill  scroll  offscreen        unreachable');
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w, height: 640 }, hasTouch: s.touch, isMobile: s.touch });
    const p = await ctx.newPage();
    await p.goto(APP); await p.waitForTimeout(500);
    await p.evaluate(SEED); await p.waitForTimeout(150);
    let setupErr = '';
    try { await p.evaluate(`(async () => { ${s.setup} })()`); } catch (e) { setupErr = String(e).slice(0, 90); }
    await p.waitForTimeout(350);
    await p.addScriptTag({ content: MEASURE });
    const r = await p.evaluate(sel => window.__measure(sel), s.sel);
    await ctx.close();
    if (r.missing) { console.log(`   ${String(w).padStart(5)}  (not in the DOM) ${setupErr}`); continue; }
    if (r.hidden)  { console.log(`   ${String(w).padStart(5)}  (hidden at this width)`); continue; }
    const fail = r.overlaps.length || r.offscreen.length || r.unreachable.length
              || (r.spill > 1 && !s.overflows) || (r.lines > 1 && !s.wraps);
    console.log(`   ${String(w).padStart(5)} ${String(r.kids).padStart(4)} ${String(r.h).padStart(3)} ${String(r.lines).padStart(4)}   ${(r.overlaps.join(',') || '-').padEnd(23)} ${String(r.spill).padStart(4)}${(r.spiller || '').slice(0,9).padStart(10)}  ${String(r.scrollOver).padStart(5)}  ${(r.offscreen.join(',') || '-').padEnd(15)}  ${r.unreachable.join(',') || '-'}${fail ? '   <== FAIL' : ''}`);
  }
}
await b.close();
```

</details>

---

## Acceptance tests (the five self-checks)

Run these against the change. If any fails, it is not done.

| # | Test |
|---|---|
| **P1** | A user could predict this interaction from the keyboard grammar without being told. |
| **P2** | A user who read no documentation could find and use this through visible UI (Guided). |
| **P3** | This is operable by keyboard alone, and a screen reader announces its name, state, and result. |
| **P4** | No action here leaves the user with "nothing happened and no reason why." |
| **P5** | This added zero new authoring syntaxes — or replaced one and updated the inventory + `?` panel. |

---

## Insertion point — `adding-an-artifact.md`

Append to the 12-step recipe:

> **13. UX conformance gate.** Before the artifact is done, run `ux-definition-of-done.md`. The recipe builds the pill; the gate ships it. Pay special attention to: the pill follows the §7.2 pill pattern (body-click rerolls in place, pencil opens the dialog); it carries an `aria-label` updated on reroll (P3-6); invalid authoring explains why (P4-1); and the `@`-menu entry prints the typed shorthand (P2-2).

*This gate is the enforcement half of `ux-discipline.md`. The standard says what good looks like; this says you may not merge until it is true.*
