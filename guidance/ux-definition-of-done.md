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
- [ ] **Layout swept across widths** for any change to a fixed-height bar, a flex row, or a breakpoint: run the layout driver below and confirm **zero overlaps, zero wraps, zero page-level horizontal spill, zero unreachable controls**. A screenshot at one width is not a sweep — the toolbar overlap below was invisible at 900px and 105px wide at 1000px. *(UXP-256/257/258)*
- [ ] **Acceptance tests met** — the five self-checks below.

### The layout driver (the check that catches what a pin cannot)

`tests/test.mjs` can pin that a *rule exists*; it cannot see that two boxes land on top of each
other. Both toolbar defects (UXP-256, UXP-257) were found by a person looking at the app, months
after they shipped — the button-count ratchet catches *growth*, nothing measured *position*. This
driver is that measurement. It lives in the scratchpad, never in the repo (`CLAUDE.md`: verification
artifacts stay out of git); what is recorded here is the recipe and the numbers of record.

**What it measures, and why each one is a rectangle and not an eyeball:**

| check | how | the defect it would have caught |
|---|---|---|
| **Overlap** | rectangle intersection of every visible pair of `#toolbar-row` children | UXP-256: `#search-wrap` was `position:absolute` above 950px, so flex laid `#level-ctl` out as if it were not there — 21px of overlap at 9 buttons, **105px at 11** |
| **Wrap** | count of distinct child top-offsets, **ignoring differences under 12px** | UXP-258: a wrapped row makes the toolbar's height a function of the button count. The 12px guard is not cosmetic — without it, buttons of slightly different heights read as two lines and the first run called *every* width broken |
| **Spill** | `documentElement.scrollWidth - clientWidth` | a row that "fits" by pushing the page into a horizontal scroll has not fitted |
| **Reach** | scroll each control into view, then `elementFromPoint` at its centre | a scrolling strip that hides a control with no way to get to it |
| **Scroll cue** | the `.tb-more-l/.tb-more-r` classes at scrollLeft 0 / middle / max | a hidden scrollbar with a permanently-painted fade lies about there being more (P4) |

**Numbers of record.** Chromium, `hasTouch`, 11 toolbar buttons. Both columns are this driver's own
output — **before** is `c91028b` (the last build with all three defects), **after** is `HEAD`. Running
it against the broken build is the part that matters: a guard nobody has watched fail is not a guard.

| width | before — `c91028b` | after — `HEAD` |
|---|---|---|
| 1400 | clean | clean, strip does not scroll (no fade painted) |
| 1100 | **124px overlap**, search × level | 0 |
| 1000 | **130px overlap** + 36px search × strip; `btn-builder` unreachable | 0 |
| 950 → 820 | no overlap, no wrap | 0; strip scrolls 65 → 141px, fades track |
| 700 → 620 | **2–3 buttons unreachable** — clipped in the overflow with no reveal | 0 unreachable; scrolls 257 → 337px |
| 560 → 510 | **wrapped: row 88px tall** (and the 145px indent UXP-257 patched) | **1 line, 44px**; scrolls 8 → 58px |
| 430 → 340 | **wrapped: row 133px tall** | 1 line, 44px; scrolls 138 → 228px |

**9 of 12 widths failed on the old build; 0 fail on `HEAD`.** Page-level horizontal spill was 0 in
both — the row broke by stacking and by hiding, never by pushing the page wide, which is precisely
why nothing downstream noticed.

<details>
<summary>Layout driver (scratchpad Playwright — Chromium at <code>/opt/pw-browsers/</code>, never <code>npx playwright install</code>)</summary>

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const file = process.argv.find(a => a.endsWith('.html')) || '/home/user/pointliner/index.html';

const probe = async (w) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 380 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto('file://' + file); await p.waitForTimeout(500);
  await p.evaluate(() => { document.getElementById('storage-warn')?.remove();   // it covers the bar
    root.children = []; const n = mkNode('Alpha'); n.type = 'ul';
    root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); markDirty(); render(); });
  await p.waitForTimeout(250);
  const r = await p.evaluate(async () => {
    const row = document.getElementById('toolbar-row'), c = document.getElementById('tbtn-cluster');
    const vis = e => { const s = getComputedStyle(e), q = e.getBoundingClientRect();
                       return s.display !== 'none' && s.visibility !== 'hidden' && q.width && q.height; };
    const kids = [...row.children].filter(vis);
    // OVERLAP: every visible pair, as a rectangle intersection. Not "does it look wrong".
    const overlaps = [];
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = kids[i].getBoundingClientRect(), d = kids[j].getBoundingClientRect();
      const ox = Math.min(a.right, d.right) - Math.max(a.left, d.left);
      const oy = Math.min(a.bottom, d.bottom) - Math.max(a.top, d.top);
      if (ox > 0 && oy > 0) overlaps.push(`${kids[i].id || kids[i].className}x${kids[j].id || kids[j].className}:${Math.round(ox)}`);
    }
    // WRAP: distinct top-offsets, but only counting a gap big enough to BE a line (see the table).
    const tops = [];
    for (const k of kids) { const t = Math.round(k.getBoundingClientRect().top);
                            if (!tops.some(u => Math.abs(u - t) < 12)) tops.push(t); }
    // SCROLL CUE: the classes must track the position, not stand permanently on.
    const cls = () => [...c.classList].filter(x => x.startsWith('tb-more')).join('+') || '-';
    const over = c.scrollWidth - c.clientWidth;
    const atLeft = cls();
    c.scrollLeft = Math.round(over / 2); await new Promise(r2 => setTimeout(r2, 60));
    const atMid = cls();
    c.scrollLeft = over; await new Promise(r2 => setTimeout(r2, 60));
    const atRight = cls();
    // REACH: scroll each control into view, then hit-test its own centre.
    const unreachable = [];
    for (const x of [...c.querySelectorAll('button')].filter(vis)) {
      x.focus(); await new Promise(r2 => setTimeout(r2, 40));
      const q = x.getBoundingClientRect();
      const t = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2));
      if (!t || !(t === x || x.contains(t))) unreachable.push(x.id);
    }
    c.scrollLeft = 0;
    return { rowH: Math.round(row.getBoundingClientRect().height), lines: tops.length, overlaps,
             over: Math.round(over), atLeft, atMid, atRight, unreachable,
             spill: Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth) };
  });
  await ctx.close(); return r;
};

let bad = 0;
console.log('\n   width  rowH lines overflow  fade L/M/R          spill  overlaps  unreachable');
for (const w of [1400, 1100, 1000, 950, 820, 700, 620, 560, 510, 430, 390, 340]) {
  const r = await probe(w);
  const fail = r.lines > 1 || r.overlaps.length || r.unreachable.length || r.spill > 0
            || (r.over > 1 && (r.atLeft.includes('-l') || r.atRight.includes('-r')));  // cue must not lie
  if (fail) bad++;
  console.log(`   ${String(w).padStart(5)}  ${String(r.rowH).padStart(3)}  ${String(r.lines).padStart(4)}  ${String(r.over).padStart(7)}  ${`${r.atLeft}/${r.atMid}/${r.atRight}`.padEnd(20)}${String(r.spill).padStart(4)}  ${(r.overlaps.join(',') || '-').padEnd(9)} ${r.unreachable.join(',') || '-'}${fail ? '   <== FAIL' : ''}`);
}
console.log(`\n  widths that failed: ${bad}`);
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
