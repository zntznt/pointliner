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
- [ ] **A pin that cannot fail is not a pin.** Two habits, both measured as recurring: (1) **pin the call site, not only the core** — a perfectly tested `foo()` proves nothing about whether anything calls it correctly, and two such holes shipped in one PR (#1143); (2) **assert the collection is non-empty before iterating it** — `[].every(f)` is `true` and a `for…of` over nothing runs no assertions, so a silently-emptied input reads exactly like a clean codebase. Use `nonEmpty(coll, label)`, `between(src, a, b)` and `fnBody` (all in `tests/test.mjs`, all of which throw); never hand-roll `slice(indexOf(A), indexOf(B))` (a missing marker WIDENS the haystack to the rest of the file) and never a `+ N` byte window (it slides out of range as code is added above it, #1141). **Prove a new pin by reverting the fix and watching it go red.** *(#1133 / UXP-260)*
- [ ] **Check the SIBLINGS, not just the site.** When a behaviour is added to, or fixed on, one member of a family, **enumerate the family and drive every member**. The defect this catches is not a missing capability — it is a capability the codebase already has, applied to some siblings and not others, usually within a few lines and often with a comment explaining exactly why it was needed. Measured five times in a row: the base chrome's collapse chevron re-focused while the view buttons, rows cap and cells did not (UXP-302); the agenda's Scope chip announced and kept focus while the other seven chips did neither (UXP-303); `mtSortBase` recorded undo — and its flash *promised* the user it had — while eleven sibling base ops did not (UXP-304); every other invalid reference degraded visibly while the repeat chip crashed the renderer (UXP-305); UXP-19 restored pill focus for dice/grammar/estimate but not the clock, var pick or action pill (UXP-306). **Two ways to discharge it:** drive the family (a table of member × behaviour is the deliverable), and where the family is enumerable from the source, leave a **census ratchet** so the next omission fails a test instead of shipping — `#1387` asserts every `mtCommit` caller records undo or is a named exemption, `#1389` asserts no `classList` token can contain whitespace. **Measure the negative case too:** the spoiler looked identical to the clock in the source and correctly needed *no* fix, so its exemption is pinned rather than left out — "completing the set" without driving it would have been cargo cult. *(UXP-302 through UXP-306)*
- [ ] **Touch path shipped** for any new hover/mouse interaction (`@media(hover:none)` + long-press where applicable). *(`CLAUDE.md` touch invariant)*
- [ ] **Interaction driven in the running app**, not just source-pinned, for any focus/keyboard/caret/drag change: reproduce it in a headless browser and watch the primitive (`activeElement`, the handler firing, the caret offset). A source-pin proves presence, not behavior — a keydown handler on an unfocusable element is dead code that still passes its pin. *(builder keyboard-nav regression, #1021)*
- [ ] **OPML round-trip** preserved for any new persisted data (serialize + parse in the same change). *(`CLAUDE.md`)*
- [ ] **Design-language conformance** for any visual change (`guidance/design-language.md`): colors via tokens (semantic `--ok/--warn/--bad/--info`, `--acc-fg` on accent backgrounds, radii/shadows from the token sets), new color pairs ship their contrast ratio, the palette change lands in **both** homes (CSS *and* the `applyTheme`/`applyAccentCSS` strings), and both-mode + forced-theme screenshots were checked. *(design-language §3/§6)*
- [ ] **Drift guards stay green**: `node --test tests/test.mjs` carries the design pins (dual-home token parity, radius/weight/size floors, and the em-dash ban — now enforced across **all** user-facing copy: `README.md`, the whole `guide/` tree, every GUIDE body/example, and every command `desc`, not the three narrow spots it used to spot-check) and CI runs them on every PR. *(tests/test.mjs)*
- [ ] **Layout swept across widths** for any change to a fixed-height bar, a flex row, or a breakpoint: run the layout driver below and confirm **zero overlaps, zero wraps, zero controls off the viewport, zero unreachable controls** — and confirm the driver's own control surface passes first. A screenshot at one width is not a sweep: the toolbar overlap was invisible at 900px and 105px wide at 1000px, and the edit bar looked perfect at 375px while losing its Done button at 320px. *(UXP-256/257/258/259)*
- [ ] **Data shapes swept** for any change that renders a value derived from *document data* (a variable's value, a property, a base cell, an OPML attribute): run the data-shape sweep below. UXP-262 shipped because a numeric variable made one row's `desc` a Number and the shared escaper threw, rendering the whole All commands panel empty with no error surface. *(UXP-262)*
- [ ] **Acceptance tests met** — the five self-checks below.

### The data-shape sweep (the silent-failure class)

Not a layout check. This hunts the shape UXP-262 had: **a value that is normally a string arrives as
something else, and a shared renderer dies, taking a whole surface with it.** Seed documents a user
can legitimately author, open every surface, and watch for a `pageerror` or a surface that opens
with nothing in it.

> **Run the control first, exactly as with the layout driver.** Point the sweep at a build that has
> the defect (`git show <pre-fix>:index.html`) and confirm it reports the throw. A clean sweep only
> means something if you have watched the harness catch one.

**Two prongs, and one of them is mostly noise — this is worth knowing before you repeat it.**

*Prong A, fuzzing the pure cores by type, is a poor primary.* `CLAUDE.md` says cores return `null`
on invalid input, so a throw looks like a violation — but calling `buildIndex(42)` is type abuse no
document can produce. That framing reported **232 of 514 cores "violating"** the rule, which is
meaningless. Narrowing to *works on a string, throws on a number* — the shape a variable or property
value actually has — cuts it to ~40 candidates. Even then it is only a **map**, not a finding:
reachability is what prong B decides.

*Prong B, driving hostile-but-legal documents, is the real check*, because every input is something
a user can type.

**A CSP trap that will cost you a whole run.** The app ships a Content-Security-Policy without
`unsafe-eval`, so calling `eval()` **inside** the page is refused. A driver that does that reports
the same CSP error for every combination and opens nothing — the first run of this sweep scored a
perfect 80 of 80 "failures" that way. Interpolate the opener into the evaluated *source* instead;
Playwright compiles that over CDP, which the page CSP does not govern.

**Numbers of record** (5 documents × 16 surfaces = 80 runs):

| build | runs that threw | which |
|---|---|---|
| pre-UXP-262 (`origin/main` before the fix) | **1** | `numeric vars` × All commands — `(s \|\| "").replace is not a function`, 0 of 74 rows rendered |
| `HEAD` | **0** | — |

The control also proves the surfaces genuinely open rather than merely failing to throw: on the same
pre-fix run the File menu rendered 41 rows, the guide 83, the variables panel 20, the tag browser 9,
the graph 9, the timeline 12 — and All commands rendered **0**.

<details>
<summary>Data-shape sweep (scratchpad Playwright — same rules as the layout driver)</summary>

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const APP = 'file:///home/user/pointliner/index.html';   // point at a pre-fix build for the control

// Documents a user can legitimately write. Each pushes a different SHAPE through the pipes.
const DOCS = {
  'numeric vars':  ['{n := 42}', '{z := 0}', '{f := 1.5}', '{neg := -7}', 'ref {n} and {= n * 2}'],
  'numeric props': ['Task A', 'cost: 100', 'ratio: 1.5', 'zero: 0', 'blank:', 'Task B'],
  'numeric names': ['{rule Loot: 10 | 20 | 30}', '{Loot}', '{markov M: 1 2 3}', '{seq S: 5, 6}'],
  'numeric base':  ['| Item | Qty | Cost |', '| --- | --- | --- |', '| Rope | 5 | 12.5 |', '| Torch | 0 | 0 |'],
  'odd strings':   ['{s := }', '{t :=   }', 'prop: <b>&"x</b>', '{u := 0000}', 'x'.repeat(400)],
};
const SURFACES = [
  ['All commands',    `document.getElementById('btn-builder').click()`, '#io-card .builder-item'],
  ['File menu',       `openFileMenu()`,        '#file-menu .cmd-item'],
  ['Concept guide',   `openGuide('nav-move')`, '#io-card .guide-nav-btn'],
  ['Variables panel', `openVarPanel()`,        '#var-panel *'],
  ['Tag browser',     `openTagBrowser()`,      '#io-card *'],
  ['Agenda',          `openAgenda()`,          '#agenda-strip *'],
  ['Link graph',      `openGraph()`,           '#graph-panel *'],
  ['Timeline',        `openTimeline()`,        '#timeline-panel *'],
  ['Rolls log',       `toggleRollLog()`,       'body'],
  ['Capture',         `openCaptureDialog()`,   '#capture-strip *'],
  ['Journal',         `openJournalStrip()`,    '#journal-strip *'],
  ['Search is:pill',  `{const s=document.getElementById('search-box');s.focus();s.value='is:pill';s.dispatchEvent(new Event('input',{bubbles:true}))}`, '#outline *'],
  ['Search key:>N',   `{const s=document.getElementById('search-box');s.focus();s.value='cost:>50';s.dispatchEvent(new Event('input',{bubbles:true}))}`, '#outline *'],
  ['Search var:',     `{const s=document.getElementById('search-box');s.focus();s.value='var:n';s.dispatchEvent(new Event('input',{bubbles:true}))}`, '#outline *'],
  ['Export markdown', `toMarkdown ? toMarkdown(root) : null`, 'body'],
  ['Export OPML',     `toOpml(root)`,          'body'],
];

const rows = [];
for (const [docName, lines] of Object.entries(DOCS)) {
  for (const [sName, open, probe] of SURFACES) {
    const ctx = await b.newContext({ viewport: { width: 1100, height: 800 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e.message || e).slice(0, 70)));
    await p.goto(APP); await p.waitForTimeout(420);
    // The opener is interpolated into the evaluated SOURCE, never eval()'d at runtime -- see the
    // CSP note above.
    const r = await p.evaluate(`(async () => {
      document.getElementById('storage-warn')?.remove();
      root.children = [];
      for (const t of ${JSON.stringify(lines)}) { const n = mkNode(t); n.type = 'ul';
        root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); }
      if (typeof promoteLoadedShorthand === 'function') promoteLoadedShorthand(root);
      buildIndex(root, null); markDirty(); render();
      await new Promise(r => setTimeout(r, 200));
      let threw = null;
      try { ${open}; } catch (e) { threw = String(e.message || e).slice(0, 70); }
      await new Promise(r => setTimeout(r, 350));
      return { threw, n: document.querySelectorAll(${JSON.stringify(probe)}).length };
    })()`);
    await ctx.close();
    // A surface that opens EMPTY is the symptom, not just a throw: that is what a user sees.
    console.log(`   ${docName.padEnd(15)} ${sName.padEnd(16)} rendered ${r.n}${r.threw ? "  THREW: " + r.threw : ""}`);
    if (r.threw || errs.length) rows.push({ docName, sName, threw: r.threw || errs[0], n: r.n });
  }
}
console.log(`\n  runs that threw: ${rows.length}`);
for (const r of rows) console.log(`  ${r.docName} / ${r.sName}: ${r.threw} (rendered ${r.n})`);
await b.close();
```

</details>


### The layout driver (the check that catches what a pin cannot)

`tests/test.mjs` can pin that a *rule exists*; it cannot see that two boxes land on top of each
other. Every layout defect this project has shipped was found by a person looking at the app, months
later: UXP-256 (105px overlap), UXP-257 (145px indent), UXP-259 (the edit bar's Done button off the
screen at 320px, present since before the toolbar work). The button-count ratchets catch *growth*;
nothing measured *position*. This driver is that measurement.

**It is `tools/layout-sweep.mjs`.** It used to live only as a fenced code block here, copied into a
scratchpad on demand, on the reasoning that verification artifacts stay out of git. The consequence
was that nothing ran it and nothing could tell when it stopped working — and it had stopped: the
first-run welcome chooser shipped after the numbers below were taken, `#io-back` then covered the
viewport, and `elementFromPoint` returned the backdrop for **every control on every non-dialog
surface**. The recipe went stale silently rather than breaking loudly, and that survived until
someone re-ran it for an unrelated fix (#1559). This is the same argument #1427 made for
`tests/browser.mjs`, and the same answer. `tests/browser.mjs` now gates that the sweep still
*measures* — the seed clears the modal layer, the save chip is frozen, the reach walk judges a
non-zero number of controls — so a driver that stops working fails a test instead of waiting to
mislead the next reader. Its geometry cores are pure, and `tests/test.mjs` pins them; the tool
stringifies **those same function objects** into the page, so the tested cores are the ones that run.

```bash
node tools/layout-sweep.mjs                     # every surface, every width
node tools/layout-sweep.mjs --control           # just the control (what CI's gate mirrors)
node tools/layout-sweep.mjs --surface io-foot   # substring match on selector or note
node tools/layout-sweep.mjs --widths 390,320
```

What is recorded below is the reasoning: the corrections the instrument needed, and the numbers.

> **`#toolbar-row` is the control, and it is listed first for a reason. If the control fails, the
> driver is wrong — fix the driver before believing a single other row.** The first version of this
> sweep reported 11 broken widths on a surface verified clean the same day. Every "finding" in that
> run was an instrument bug.

**What it measures, and why each is a rectangle and not an eyeball:**

| check | how | the defect it catches |
|---|---|---|
| **Overlap** | rectangle intersection of every visible **in-flow** pair of children | UXP-256: `#search-wrap` was `position:absolute` above 950px, so flex laid `#level-ctl` out as if it were not there — 21px of overlap at 9 toolbar buttons, **105px at 11** |
| **Wrap** | distinct lines, where two children share a line if their rects **overlap vertically** | UXP-258: a wrapped row makes the bar's height a function of the button count |
| **Offscreen** | a control past the viewport edge **with no scrollable ancestor to reveal it** | UXP-259: `#eb-done` 40px past the screen at 320px, `elementFromPoint` returning nothing |
| **Reach** | scroll each control into view, then `elementFromPoint` at its centre. Judged for every control **sharing the host's line**, including one pushed outside it | a scrolling strip that hides a control with no way to get to it; a control shoved off its own container (#1523) |
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
6. **A column container is not a wrapped row.** `.builder-wrap` and `.ag-top` are
   `flex-direction:column`; counting their children's top offsets reports a wrap at every width.
7. **`past` measures the sheet, not the surface inside it.** Including the host's own bottom made
   `.io-foot` report 56px past at every width — the footer sits below the fold of a scrollable
   `#io-card`, which is what scrolling is for. Only the sheet cannot be scrolled into view.

8. **Leftward overflow is invisible to every scroll test (#1523).** `spill` already measures it (it
   takes `inL - q.left` as well as `q.right - inR`) and this is the column that catches it. Nothing
   else can: leftward overflow does not count toward `scrollWidth`, so a footer hanging off the left
   of the card reports `scrollWidth === clientWidth` on the row, on `#io-card` and on the document,
   and both `scrollLeft` and `scrollIntoView` are no-ops.

9. **Correction #4 was excluding the thing the reach column is FOR (#1559).** `inHost` skipped any
   control whose centre lay outside the host rect, to exclude popups that open on focus. It also
   silently skipped a control pushed *out* of its host — the most severe reachability failure there
   is, and the one `unreachable` therefore could not report: #1523's "+ New pack" had **seven**
   hit-testable pixels while that column sat empty. **Vertical overlap separates the two cleanly**,
   measured both ways: every control in the search popup has *negative* overlap with its host (−25
   to −689px; it opens below the row), while a footer button shoved off the left of its card keeps
   *full* overlap, because it is still laid out in that row. Same band, still ours — judge it.

10. **A child can absorb its own overflow (#1559).** Correction #2 discounts overflow when the
    **host** scrolls. `#tbtn-cluster` is not a scroller; it *contains* a `.scroll-strip`. Without
    the one-level-down discount it reports 7px of spill and fails the CONTROL while nothing is
    lost — `offscreen` empty, `unreachable` empty, and an independent walk for buttons past the
    viewport with no scrollable ancestor returning `[]`.

11. **Do not race a live status element (#1559).** `#save-status` is an in-flow flex child of
    `#toolbar-row` whose text tracks save state: "Saved" → "✓Saved just now" is a **38px** jump that
    shifts every child to its right, and it flipped the 620px verdict between two runs differing
    only in when the measurement landed. The seed freezes it. **Which** state to freeze is a real
    choice and the answer is not "the widest": the storage-blocked string is 183px against this
    one's 112px, and freezing to it makes the control fail for a genuine app defect (#1560) rather
    than an instrument one. The control has to sit in a state verified clean.

12. **`walked` is the inverse-vacuity guard (#1559).** `unreachable: []` is also what a walk that
    judged *nothing* reports, and the two are indistinguishable in the output. The band filter is a
    skip, so a filter that got too aggressive would silently empty the walk and paint every surface
    clean — the same shape as #1133. The measurement returns how many controls it actually judged,
    and the CI gate asserts it is non-zero.

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
| `.io-foot` 2 btn (`openMathDialog`) | clean | clean — this was the ONLY `.io-foot` row, and it is why the surface looked swept |
| `.io-foot` Reusable packs (4 btn), touch | **spill 32 → 72 → 102 → 142px** at 430/390/360/320; `offscreen` from 390 | 0 at all 7 widths; wraps to 2 lines ≤430, declared `flex-wrap:wrap` |
| `.io-foot` Reusable packs (4 btn), mouse | spill 33 / 63 / 103 at 390/360/320 | 0 at all 7 widths |
| `.io-foot` units already set (3 btn), touch | spill 21 / 51 / 91 at 390/360/320 | 0 at all 7 widths |
| `.io-foot` calendar already set (3 btn), touch | spill 27 / 67 / 97 / 137 at 430/390/360/320 | 0 at all 7 widths |
| `.guide-header`, `.fm-head` | clean | clean |
| `#search-wrap` | focused box covers `#level-ctl` by **117px** | **unchanged and not a defect** — identical at 1350 (wide design) and 900 (narrow design), i.e. the intended focus overlay, not a UXP-256 side effect |

**Numbers of record, #1559 (`tools/layout-sweep.mjs`, all 25 surfaces × 12 widths = 300 rows).**
Run with the instrument's own corrections in place. **One failing row**, and it is a real app defect
the fixed reach column found on its first run, not an instrument artefact:

| surface | result |
|---|---|
| 24 of 25 surfaces | **clean at all 12 widths** |
| `#toolbar-row` (the CONTROL) at 620 | `spill 37` on `#level-ctl`, `lvl-all` offscreen, 9 controls with no hit-testable pixel — **#1560** |

`#1560` is a **561–660px** band where the button cluster is squeezed to 5px and laid out past the
viewport. The standard width list steps 700 → 620 → 560, so it lands on only one width inside that
band; it was characterised by stepping 5px at a time. Because the control fails there, "all green"
cannot be read as "instrument healthy" at those widths until #1560 is fixed — which is why
`tests/browser.mjs` gates the instrument at 1400px and asserts the *measurement machinery* works
(seed clears the modal layer, chip frozen, `walked > 0`, cores agree with the pinned ones) rather
than asserting the app is clean everywhere.

The last two rows exist so neither gets re-filed. A by-design `flex-wrap` and an intended overlay
both look exactly like defects in a table of numbers; what distinguishes them is that they are
**identical across bands the change never touched**.

> **The code moved to `tools/layout-sweep.mjs` (#1559).** It is no longer reproduced here: a
> recipe that only a human can run is a recipe nothing notices has broken, which is exactly what
> happened. The surfaces list, the seed, the geometry cores and the runner all live in that file,
> its cores are pinned in `tests/test.mjs`, and `tests/browser.mjs` gates that it still measures.

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
