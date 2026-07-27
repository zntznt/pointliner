# Accessibility remediation

> **Status: complete.** Phases 0–5 shipped (UXP-13…18), and the dedicated
> tree/grid/pill-focus pass shipped as UXP-19 — see `ux-remediation.md` Tier 3.
> This file is retained for the guardrails (which are durable) and as the record
> of the phase decisions; new a11y obligations ride each feature per
> `ux-discipline.md` §5/P3.

Working tracker for incremental accessibility work. The goal is keyboard
operability and screen-reader usability without any visual redesign — all
changes are additive. Changes are phased so each is independently shippable and
verifiable.

This is a remediation **plan**, not a durable architecture invariant — that is
why it lives here and not in `CLAUDE.md`. The one rule that *is* a durable
invariant ("keyboard ops are added alongside `mousedown`, never replacing it")
is restated in `CLAUDE.md`; the rest of this file can be retired phase-by-phase
as the work ships.

> **Verify before you label.** This brief was written against a moving target;
> some controls named below are `<div class="cmd-item">`, not `<button>`, and a
> couple toolbar controls named in early drafts do not exist. Grep for the real
> element before adding attributes — the corrected lists below already reflect
> the current DOM, but confirm rather than trust.

## Hard guardrails (read before touching any interactive element)

1. **Do NOT convert `mousedown`+`preventDefault` handlers to `click` blindly.**
   Many controls — bullets, pill pencils, the collapse button, the breadcrumb —
   use `mousedown` with `e.preventDefault()` specifically to prevent focus moving
   away from the active contenteditable node. Converting to `click` silently breaks
   the edit-mode caret invariant. Keyboard operability is added *alongside*
   `mousedown`, not by replacing it.
2. **Attributes must be set per-row at render time.** There is no virtual list
   component to patch globally; ARIA attributes must be applied in the same
   `render()` pass that builds the DOM.
3. **No visual changes.** All fixes are attribute/CSS additions. Do not alter
   sizing, color, or layout as part of accessibility work.
4. **Filter changes announce.** Any action that filters or re-populates the visible
   outline without moving focus must write a short result summary (e.g. a match
   count) to `#a11y-live`.
5. **Tap-target floor.** Under `@media(hover:none)`, every tappable control must
   present a hit area that **clears WCAG 2.2 §2.5.8 (24×24px minimum)**, and the app
   targets **~36–38px** for it via padding or an invisible `::after` overlay past the
   visual box (the docked-strip idiom: a 20–22px chip with an `inset:-8px` overlay =
   36–38px). The visual box may stay smaller as long as the overlay extends the target.
   *(Reconciled 2026-07-06: the guardrail previously said "~44px", but every docked-strip
   chip in the app, capture/journal `.cap-*`, agenda `.ag-toggle`/`.ag-chip`, search
   `.sh-chip`, has consistently used the 36–38px overlay idiom, which passes WCAG 2.2. The
   doc, not the code, had drifted to an aspirational number nothing honored. If a future
   control genuinely needs a bigger target, deepen its overlay inset; the floor is
   "clears 24px, aim for the 36–38px strip idiom", not a hard 44.)*
6. **A listbox picks ONE focus model and commits to it fully.** Either *roving focus*
   (options get `tabindex="-1"`, and `.focus()` moves real focus onto the active option)
   OR *aria-activedescendant* (focus stays on the caret/container, options get NO `tabindex`,
   and `aria-activedescendant` tracks the active id — the slash menu's model, which preserves
   the caret invariant for an inline picker). **Never ship half of one:** calling `.focus()`
   on an option with no `tabindex` is a **no-op**, so the whole keydown handler (arrows/Home/
   End) is dead code that still passes a source-pin. Prefer activedescendant for inline caret
   pickers; roving focus is fine for a modal browser. Verify by driving the running app — press
   the arrow key and confirm `activeElement` actually moved. *(The builder command list shipped
   the roving path missing its `tabindex`; every arrow key was dead until #1021.)*
7. **A menu's CONTENTS must be computed from state that opening it does not change.** Guardrail 6
   covers a dead *focus* model; this is the other half, and it is the one that got past us. The
   Shift+F10 point menu built its Pills section from `node.text`, matching `[[type:key]]` tokens —
   but reaching a point with the keyboard means *focusing* it, and focus **unfolds** its pills,
   rewriting the text to `{2d6}`. So the rows were collected from text the act of opening had
   already changed, and the whole section came up empty for **every** pill family. The mouse path
   (hovering a bullet from display mode) read folded text and worked, which is exactly why it
   survived: the pointer door and the keyboard door disagreed, and only the pointer one was ever
   tried. The fix is to normalize first — `commitActiveEdit()` before collecting, scoped to the
   menu's own point so hovering never closes an unrelated edit. **The check:** open the menu both
   ways and compare the rows. Same menu, same point, same rows, or something reads mutated state.
   *(Found 2026-07-27 while driving a row a source pin had already declared present.)*

## Keyboard-door audit (2026-07-27)

Guardrails 6 and 7 both describe handlers that exist and never run, and both had bitten, so the
"Status: complete" above was worth testing rather than trusting. Every container-level arrow-nav
handler in `index.html` was enumerated (37 `ArrowDown` sites, 13 of them list navigation) and
**driven in a real browser**: focus the first option, press the arrow, observe.

The predicate allows for both sanctioned focus models — a surface passes if `activeElement` moved
**or** `aria-activedescendant` changed. A naive "did focus move?" check would have condemned the
`[[` picker, which deliberately keeps focus on the caret.

| surface | model | result |
|---|---|---|
| point bullet menu (`.cmd-item`) | roving | alive |
| base cell / column panel (`.mt-col-item`) | roving | alive |
| `[[` tree picker | activedescendant | alive |
| concept guide: left nav (`.guide-nav-btn`) | roving | alive |
| concept guide: search field | roving | alive |
| all commands: item list (`.builder-item`) | roving | alive *(the #1021 fix holds)* |
| all commands: search field | roving | alive |
| file menu rows | roving | alive |
| documents / broken-links rows (`.tpl-pick`) | roving | alive |
| roll palette (`.rp-chip`) | roving | alive |
| agenda calendar (`.agc-cell`) | roving | alive |
| graph overlay (`g.graph-node`) | roving | alive |
| date picker grid (`.cal-day`) | roving | alive |

**All thirteen alive.** The probe was calibrated first against a known-good surface and against a
deliberately broken copy of it (same handler, `tabindex` stripped), and reported them correctly as
alive and dead — a probe that has never caught a dead surface is not evidence.

Two false alarms during the run, both the harness's fault and worth recording so the next audit
does not repeat them: a one-row broken-links report reads as dead because `Math.min(i+1, len-1)`
correctly has nowhere to go, and the graph's `className` is an `SVGAnimatedString` rather than a
string. **Re-run this table when a new list surface ships**; the previous claim rested on phase
history, this one rests on a measurement with a date.

## Phase 0 — Accessible names (quick wins, zero risk)

Scope: icon-only controls that are **already real `<button>`/`<a>` elements**
(focusable, just unlabeled). Pure attribute additions. Controls that are `<div>`
or `<span>` are *not* in scope here — they are keyboard-dead and belong in Phase
1, where they are made focusable first.

Real buttons that need an `aria-label`:
- `#btn-done` (the ✓ "show completed" toggle in `#toolbar-row`).
- The level control buttons (`.lvl-btn`: 1 · 2 · 3 · All).
- Pill pencil buttons (`.dice-edit`, `.mk-edit`, `.rt-edit`, `.gr-edit`,
  `.math-edit`, `.var-edit`).
- Table add buttons (`.mt-addcol`, `.mt-addrow`) — confirmed `<button>` elements
  in `buildTableWidget`. Add an `aria-label` ("Add column", "Add row").
- Decorative `<i class="fas …">`/`.cmd-icon` glyphs inside a labeled control get
  `aria-hidden="true"` so the accessible name isn't doubled.
- `#search-box` gets `aria-label="Search outline"` (it has no `<label>`).
- `#search-clear` gets `aria-label="Clear search"` — it's a real `<button>` (confirmed)
  with only a `title` attribute today; only visible when a search query is active.

> **Corrections vs. the original brief.**
> - The brief listed "new file, save, export, undo/redo, import, accent swatches,
>   theme, width" as Phase-0 toolbar buttons. They are not. The visible toolbar
>   (`#toolbar-row`) holds the level control, `#btn-done`, the logo (`#logo-btn`,
>   a `<span>` → Phase 1), and `#search-clear` (a real `<button>` → Phase 0).
>   New / Open / Save / Save As / Theme / Width live in the **file menu** and are
>   `<div class="cmd-item">`, not `<button>` — see Phase 1. There are **no**
>   undo/redo or import buttons in the toolbar (undo/redo are keyboard-only).
>   Don't hunt for or invent controls that aren't there.
> - "Footnote-panel close button" was a phantom — `#fn-panel` has no close
>   button in the markup; the panel shows/hides based on editor focus. Removed.

## Phase 1 — Keyboard operability

Scope: interactive controls that aren't `<button>` or `<a>` and therefore
receive no keyboard focus by default.

**Pattern:** add `role="button" tabindex="0"` and a `keydown` handler that fires
the same action on Enter or Space — but **on a separate `keydown` listener, never
by replacing the existing `mousedown`**.

Controls that need this treatment:
- ✅ **File-menu items** — **done (chrome design pass).** `#logo-btn` has `role="button"`/`tabindex="0"`/`aria-haspopup="dialog"`/`aria-expanded` + Enter/Space keydown beside its click handler; `#file-menu` is `role="dialog"` (a settings panel, not a menu — see §7.1 note below and `ux-discipline.md`); row items have `role="button"`/`tabindex="-1"`, roving ↑/↓/Home/End focus, Enter/Space activate, Esc closes + restores focus (caret-exact via `restoreChromeReturn`). See UXP-14 in `ux-remediation.md`.
- `.collapse-btn` — also needs `aria-expanded` toggled on each collapse/expand.
- ✅ `.bullet` — **done.** Now `role="button"` + `aria-label` ("Point/Base actions") +
  `aria-haspopup="menu"` + `tabindex="-1"` + a `keydown` (Enter/Space) opening the popup.
  Reached from the keyboard via `Shift+F10` / the Menu key on the focused point
  (`onKeyDown`), which opens `#bpop` and moves focus into it. `tabindex="-1"` (not `0`)
  is deliberate: a focusable bullet per visible row would flood the Tab order of the
  virtual list.
- ✅ `#bpop` (the point-actions popup) — **done.** `role="menu"` + `role="menuitem"` +
  `tabindex="-1"` on every item (type-switcher buttons *and* action rows), arrow/Home/End
  navigation, Enter/Space activate (dispatch the item's `mousedown`), Escape closes and
  returns focus to the point. Focus-visible rings added (`#bpop .cmd-item:focus-visible`,
  `#bpop .bpop-type:focus-visible`). Same §7 menu pattern as the Column panel.
- `.crumb` items in the breadcrumb trail.
- ✅ `.cmd-item` in the slash menu — **done (chrome design pass, screen-reader path).** The slash menu uses `role="listbox"` on the dropdown + `role="option"` on each item + `aria-activedescendant` tracking on the editing element. Focus **never leaves the caret** (no `tabindex` on the rows), which avoids any caret-invariant conflict; keyboard navigation (`↑/↓/Enter/Esc`) was already wired. See UXP-14 in `ux-remediation.md`.
- ✅ `#sc-toggle` — **done (chrome design pass).** Now a `<button>` with Enter/Space keydown; the shortcuts panel takes focus on open so keyboard users can scroll it.
- `#storage-warn-close` — convert to `<button>`.
- `.fn-key` footnote markers.
- ✅ `.ghost-row` (table "add row" affordance) — **done (chrome design pass).** Now `role="button"`/`tabindex="0"` + Enter/Space keydown.
- Table column/row handles (`.mt-colh`, `.mt-rowh`).
- Table delete controls (`.mt-delcol`, `.mt-delrow`) — confirmed `<span>` elements
  inside the column/row handle `<th>`s, not buttons.
- `.mt-promote` — the static-table "Convert to base" button. Already a real `<button>`
  with an `aria-label`, a `:focus-visible` ring, and a `keydown` (Enter/Space) handler
  beside its `mousedown` (the P3-2 pattern is in place). What it still needs from this
  phase is *focus reachability*: it lives inside a `contenteditable` point where `Tab` =
  indent, so it isn't a focus stop until the bullet-popup keyboard path lands — the same
  door its menu entry ("Convert table to base" in `#bpop`) rides.

**Menu ARIA pattern — slash menu and file menu:**

The slash menu is a strict single-purpose picker. **Implemented:** `role="listbox"` on the container + `role="option"` on each item + `aria-activedescendant` tracking on the editing element — focus never leaves the caret, which avoids the caret-invariant conflict. Arrow/Enter/Esc keyboard nav was wired from the start.

**The file menu is not a menu — it is a settings dialog (✅ done).** It contains accent-color swatches (radio-group semantics), a theme cycle, a width toggle, and storage controls — persistent stateful widgets, not a list of commands. Applied: `role="dialog"` (`aria-label="Pointliner menu"`) with roving-focus row buttons, Escape-to-close + caret-restore, and visible focus rings. See UXP-14 in `ux-remediation.md`.

The bullet popup (`#bpop`) is similarly mixed — type-switcher items fit
`role="menuitem"`, but the Move up/down actions are more command-like. A
pragmatic middle ground: `role="menu"` on the popup container, `role="menuitem"`
on each item, arrow-key navigation, Escape closes. Keep it simple.

## Phase 2 — Pill labels and live announcements

Scope: dice/markov/rolltable/math/grammar/var pills.

- Each pill element gets an `aria-label` that describes its current value, e.g.
  `aria-label="Dice: 2d6 = 9"`, `aria-label="Math: area = 31.4"`,
  `aria-label="Roll table: treasure — 50 gold"`. The label is set in the
  `renderXxxPill` function and updated in-place after a reroll.
- Add one `aria-live="polite"` visually-hidden region (`#a11y-live`) to the page.
  After any reroll/regeneration, write a short text description into it
  (e.g. `"Rolled 2d6: 9"`). This tells screen-reader users that something changed
  without requiring focus to move.

**Pill `tabindex` (resolved in the UXP-19 dedicated pass — `tabindex="-1"`, not
`0`).** The risk this section flagged was specifically `tabindex="0"`: Tab landing
inside an active contenteditable disrupts caret navigation. The shipped form
sidesteps it — pills carry `tabindex="-1"` (programmatic/AT focus reach, the
pencil precedent; **not** in the Tab order, so Tab never lands inside the
contenteditable) plus Enter/Space activation that dispatches the same bubbling
`mousedown` the pencils use. The caret invariant holds because nothing about the
mouse path changed.

## Phase 3 — Modal dialog semantics

Scope: the artifact insert/edit dialogs (`.io-dialog` overlays).

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to the
  dialog's heading element.
- **Focus trap:** on open, move focus to the first focusable element inside the
  dialog; Tab/Shift-Tab cycle within it; Escape closes.
- **Focus restore:** on close, return focus to the element that opened the dialog
  (the pencil button or slash-menu trigger). Store that element in a variable
  before `showDialog`.
- The existing dialogs already use `<input>` and `<button>` elements, so
  Tab cycling inside them is already correct — only the trap and restore wiring
  is missing.

## Phase 4 — Focus visibility and reduced motion

Scope: CSS only.

```css
/* focus-visible ring — only for keyboard navigation, not mouse clicks */
:focus-visible {
  outline: 2px solid var(--acc);
  outline-offset: 2px;
}

/* reduced motion — respect user preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

These two rules are completely additive and have no effect on visual design in
the default state. Apply them near the end of the `<style>` block alongside the
existing `@media(hover:none)` block.

## Phase 5 — Alerts and contrast

**`role="alert"` on `#storage-warn`:** the storage quota warning currently
appears visually but is not announced to screen readers. Add `role="alert"` so
it is announced automatically when it appears.

**Contrast — `--muted` (both themes, computed against the real backgrounds):**

- **Light mode:** `--muted: #999` on `--bg: #fafaf8` is ≈2.8:1 — below the WCAG
  AA threshold of 4.5:1. The earlier "`#767676` is exactly 4.5:1 on white"
  recommendation was computed against pure white; on the actual `#fafaf8`
  background `#767676` only reaches ≈4.35:1 and still **fails**. Recomputed
  against `#fafaf8`, the lightest passing gray is ≈`#737373` (~4.54:1); use
  `#6f6f6f` (~4.8:1) for a small margin.
- **Dark mode:** `--muted: #6a6a6a` on `--bg: #1c1c1e` is ≈3.1:1 — also fails,
  and the original brief omitted it entirely. The lightest passing gray here is
  ≈`#838383` (~4.5:1); lighten a touch for margin.

Both are owner decisions because they shift the muted tone slightly — flag them
explicitly rather than changing them silently. The two `--muted` definitions live
together at the top of the `<style>` block (`:root` light, the dark-mode media
query); change both in the same edit.

**The dedicated pass — `role="tree"` / `role="grid"` / pill `tabindex` — SHIPPED
(UXP-19).** Originally deferred from phases 0–5 as high-risk; the risk dissolved
by construction once examined: every structural mutation already funnels through
`render()` → `flatten()` → `renderRow()`, so the tree attributes (`role="treeitem"`,
`aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded`, `aria-selected`)
are stamped in the single row builder and *can't* drift — the one out-of-band
path (multi-select) syncs `aria-selected` in `updateSelVisuals` beside its class
toggle. `aria-setsize`/`aria-posinset` are computed over the same visibility
predicate that decides which rows exist, so AT hears true positions even though
only a window of rows is in the DOM (the virtualized-tree pattern). The
interactive base table is `role="grid"` (HTML-AAM maps its `tr`/`th`/`td` for
free), computed cells are `aria-readonly`, and pills carry `tabindex="-1"` +
Enter/Space activation via the same bubbling-`mousedown` dispatch the pencils
use. Details in `ux-remediation.md` § UXP-19.

---

## Guardrail 5 has a CI guard now, and it is a proxy (UXP-249)

`tapFloorCandidates` (a pure core, pinned in `tests/test.mjs`) lists every class declaring
`cursor:pointer` that has **no touch treatment at all** — no rule inside an `@media(hover:none)`
block and no explicit `height`/`min-height` ≥ 24px. A ratchet asserts that count may only ever
**decrease**, so a newly added control with nothing done for touch fails CI instead of waiting for
the next audit. This exists because UXP-248 fixed nine controls and pinned those nine **by name**,
which did nothing about the tenth.

**A green ratchet does NOT mean the floor is met.** Its accuracy was measured, not assumed: it
catches **8 of the 9** classes UXP-248 found by driving. Three known limits, each a real finding
from that audit:

| it cannot see | the case that proves it |
|---|---|
| A control that is tappable without `cursor:pointer` | `.fm-title` — `cursor:text`, a click-to-rename field, measured 21px tall |
| An overlay **clipped** by an ancestor | `.cap-dest-name-btn` declared the `-8px` overlay and was clipped twice: by its parent's corner rounding and by its own name ellipsis |
| A target **shaved** by a neighbour's overlay | `.collapse-btn` is 24px wide and measured **23** — the bullet's own `-5px` overlay reached over it |

Only a hit-test sees those. **The measurement of record is still the driver**: probe
`elementFromPoint` outward from each control's centre in a `hover:none` context, never
`getBoundingClientRect` — the guardrail's own `::after` escape hatch means a bounding box is wrong in
both directions. Re-run it when touch work is done, and check `matchMedia('(hover:none)').matches`
first, or the numbers describe the desktop layout.
