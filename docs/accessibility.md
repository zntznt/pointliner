# Accessibility remediation

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
- **File-menu items** — `#btn-new`, `#btn-open`, `#btn-save`, `#btn-save-as`,
  `#btn-theme`, `#btn-width` (and any other `.cmd-item`). These are `<div>`s with
  `mousedown` handlers today: no role, not focusable. They need `role="button"
  tabindex="0"` + keydown **before** the Phase-1 file-menu `role="dialog"` +
  focus-ring plan can do anything — a focus ring on an unfocusable div is dead.
  State that dependency explicitly when scheduling the work.
- `.collapse-btn` — also needs `aria-expanded` toggled on each collapse/expand.
- `.bullet` — keyboard activates the bullet popup (same as hover/long-press).
- `.crumb` items in the breadcrumb trail.
- `.cmd-item` in the slash menu.
- `.bpop-type` items in the bullet-type popup.
- `#sc-toggle` — **convert from `<span>` to `<button>`** (it has no semantic
  role at all today). This is the cleanest fix; a `<button>` is focusable and
  keyboard-operable for free.
- `#storage-warn-close` — same, convert to `<button>`.
- `.fn-key` footnote markers.
- `.ghost-row` (table "add row" affordance).
- Table column/row handles (`.mt-colh`, `.mt-rowh`).
- Table delete controls (`.mt-delcol`, `.mt-delrow`) — confirmed `<span>` elements
  inside the column/row handle `<th>`s, not buttons.

**Menu ARIA pattern — file menu and slash menu:**

The slash menu is a strict single-purpose picker (`role="menu"` + `role="menuitem"` +
arrow/Escape navigation) and fits the ARIA menu pattern cleanly.

**Do not apply `role="menu"` to the file menu.** The file menu is more of a
settings panel than a command menu: it contains a row of accent-color swatches
(radio-group semantics), a theme toggle, a width toggle, and storage controls —
persistent stateful widgets, not a list of commands. Forcing `role="menu"` means
Escape must close it and arrow keys must cycle focus through a heterogeneous set
of widgets, which fights both the color-swatch row and the current "click-outside
closes" model. Instead: add `role="dialog"` (`aria-label="Settings"`) with an
Escape-to-close handler and visible focus rings on each interactive element
inside — **after** those `.cmd-item` divs are made focusable (see above).

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

**Do not add `tabindex` to pills (deferred).** Pill spans are
`contenteditable="false"` inside an active `contenteditable` container. Adding
`tabindex="0"` to them makes the Tab key land inside the contenteditable, which
can disrupt the browser's own arrow-key caret navigation in ways that are hard to
predict across browsers and screen readers. The original brief itself flags this
as "test heavily" and "defer unless time allows." Strictly defer — Phase 2 is
labels + live region only. Pill focusability can be revisited if a screen-reader
user specifically requests it.

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

**Out of scope — `role="tree"`:** applying the ARIA tree pattern to the outline
is explicitly deferred. The virtual-list render model means ARIA tree attributes
(`role="tree"`, `role="treeitem"`, `aria-level`, `aria-setsize`,
`aria-posinset`, `aria-expanded`) would need to be set and kept in sync across
every `render()` call and every structural mutation. This is high-risk work that
belongs in a dedicated pass — it is not part of phases 0–5.
