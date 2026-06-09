# Pointliner — UX Remediation Register

## Every non-conformance is a tracked defect

This is the **fix list** that pairs with `ux-discipline.md`. The standard says what conformant looks like; this enumerates **every place the app does not yet conform**, as a numbered problem to be closed. It is a *retiring tracker* (like `accessibility.md`): an item leaves this file when it ships conformant and its row in the standard's matrix turns ✅.

**Governing rule:** under `ux-discipline.md` §0, **any non-conformance is a defect, not a preference.** There is no "that's just how that feature works" — a feature either conforms to the single interaction language or it is on this list. This explicitly includes **ad-hoc conventions invented per-feature** — every bespoke syntax, one-off shortcut, or improvised interaction that didn't come from the standard is, by definition, a non-conformance to fix (see the standing syntax-sprawl guard, UXP-20).

**Status:** ☐ open · ◐ in progress · ✓ closed (move the row out on close)
**Severity:** 🔴 breaks the unified language outright · 🟡 partial / inconsistent · 🟢 cosmetic-but-tracked

Each entry: the **problem**, the **rule** it violates, and the **target** (the conformant end-state the fix must reach). Verify the named symbol with grep before acting — some controls drift (per `accessibility.md`'s "verify before you label").

---

## Tier 1 — 🔴 Breaks the unified language (fix first)

*Note: UXP-1 (Paragraph Enter inversion) was closed as a **documented exception** — Paragraph is now the sanctioned prose-mode block (Enter = line break, Shift+Enter = new point), advertised in the `/` menu and empty-state hint; see P1-1 in `ux-discipline.md`.*

### UXP-2 ☐ Tables have no cell keyboard navigation
- **Problem:** cell movement is mouse-only; `Tab`/`Enter` do not move between cells, violating the deepest spreadsheet reflex.
- **Violates:** P2-3, keyboard grammar §3.
- **Target:** `Tab` / `Shift+Tab` = next / previous cell, `Enter` = next-row cell, within the table widget.

### UXP-3 ☐ Org `#+TBLFM:` formulas have no front door
- **Problem:** table formulas are entered only by typing a raw `#+TBLFM:` line in markdown — no affordance, no menu path. Built but undiscoverable.
- **Violates:** P2-1, P2-3.
- **Target:** a formula affordance (a `=`/formula entry on a cell or a formula bar) **plus** a cell-reference picker that writes the `@row$col` syntax for the user. The Org syntax stays as the power path.

### UXP-4 ☐ `[[` link picker is gated entirely off
- **Problem:** `LINK_PICKER_ENABLED = false` ships the most intuitive linking gesture with **no front door at any verbosity**.
- **Violates:** P2-1 ("built ≠ shipped-discoverable").
- **Target:** the picker surfaces at least at the Guided floor (its rollout/verbosity staging is owned by `ux.md`/roadmap, but "no door at any level" is not a conformant end-state). Copy-link + paste remains the power path.

### UXP-5 ☐ `Ctrl/⌘ + ↑/↓` collapse collides with caret-to-edges
- **Problem:** collapse/expand sits on `Ctrl+Arrow`, which conflicts with the near-universal "caret to start/end of document" and is one modifier away from `Alt+Arrow` (move).
- **Violates:** P1-2, keyboard grammar §3.
- **Target:** rebind collapse/expand to `Ctrl/⌘ + . / ,`; keep the chevron affordance; update `?` panel + tests.

---

## Tier 2 — 🟡 Partial / inconsistent

### UXP-6 ☐ Inline `{…}` shorthand fails silently
- **Problem:** an invalid/unrecognized brace body just stays as plain text with no signal — the user can't tell a typo from intended literal text.
- **Violates:** P4-1.
- **Target:** a subtle "not recognized as a formula" inline marker; pairs with the live-preview-before-promote target (UXP-7).

### UXP-7 ☐ Shorthand has no preview before it commits
- **Problem:** `{…}` promotes to a pill on exit with no preview of what it will become.
- **Violates:** P2-5.
- **Target:** live preview of the resulting pill while editing.

### UXP-8 ☐ Table `#ERR` gives no reason
- **Problem:** formula errors render a bare `#ERR` with no cause (cycle vs bad ref vs non-numeric).
- **Violates:** P4-2.
- **Target:** `#ERR (cycle)` / `(bad ref)` / `(non-numeric)` in the cell text and its `aria-label`.

### UXP-9 ☐ Variables have no overview
- **Problem:** variables affect math document-wide but there is no surface listing what exists and their resolved values.
- **Violates:** P2-4.
- **Target:** a variables panel (read-only is fine for v1), reusing the `collectVars` index.

### UXP-10 ☐ Hashtags have no index / autocomplete
- **Problem:** no tag list or completion, so tags drift (`#todo` vs `#todos`). (Already noted in backlog "Tag power.")
- **Violates:** P2-4.
- **Target:** tag autocomplete built from a tree-walk tag set.

### UXP-11 ☐ Some pills are reachable only via the insert dialog
- **Problem:** certain generators are creatable only through `@`/dialog, with no shorthand path, so authoring is inconsistent across pill types.
- **Violates:** P2-1 (three doors).
- **Target:** every inline-able generator has both a dialog and a shorthand; complex ones keep the dialog but appear in the `@` menu with a described entry.

### UXP-12 ☐ Structural/destructive actions don't all confirm
- **Problem:** delete-subtree, paste-points, cut, and bulk indent don't consistently surface a confirmation toast the way copy-link does.
- **Violates:** P4-3.
- **Target:** the existing toast fires for every structural/destructive action.

---

### UXP-20 ☐ Syntax sprawl — standing guard (P5)
- **Problem:** the loudest symptom of the scattered direction is the steady flood of new authoring syntaxes and grammars, each invented per-feature. The architecture *encourages* it (`CLAUDE.md`: "a new token type / expression primitive fits very well"), so the pressure is structural and continuous — this guard never fully closes.
- **Violates:** P5 (one authoring language).
- **Two live examples to police now** (both in `roadmap.md`):
  - a proposed **render-only `{= expr}` / `{NdM}` second syntax** "alongside `[[type:key]]`" → **P5-3 violation** unless it *replaces* the existing path; route it through the `{…}` engine, don't add a parallel one.
  - possible **`B3`-style table references** beside `@row$col` → reject; `@row$col` is "the one true form."
- **Target / standing rule:** every new generative or computed feature plugs into the `{…}` grammar engine or extends `evalMath`; no new top-level delimiter ships without sign-off **and** the retirement of what it overlaps. The §2/P5 inventory is the closed set; growing it is an explicit, recorded decision, never a side effect of a feature. This row stays open permanently as the gate the AI checks against — it is the antidote to "new ways of doing syntax pulled out of thin air."

## Tier 3 — Accessibility conformance (additive; sequenced in `accessibility.md`)

These are **not new tickets** — they are the standard's P3 requirements mapped onto the existing accessibility phases, listed here so a11y is visible as part of the *one* conformance picture rather than a separate track. **Do not front-run the deferred items**; do satisfy the interim labels now.

### UXP-13 ☐ Accessible names on icon-only controls — *a11y Phase 0*
- **Violates:** P3-1. **Target:** `aria-label` on `#btn-done`, level buttons, pill pencils, table add buttons, search; decorative glyphs `aria-hidden`.

### UXP-14 ☐ Keyboard operability on `<div>`/`<span>` controls — *a11y Phase 1*
- **Violates:** P3-2. **Target:** `role`/`tabindex` + `keydown` **beside** existing `mousedown` (caret invariant) on file-menu items, collapse button, bullet, breadcrumb, slash-menu items, `#sc-toggle`→`<button>`, table handles.

### UXP-15 ☐ Pill labels + live announcements — *a11y Phase 2*
- **Violates:** P3-5, P3-6 interim. **Target:** each pill `aria-label "{type}: {expr} = {result}"` updated on reroll; one `aria-live` region announces rerolls/changes. (Pill `tabindex` stays deferred.)

### UXP-16 ☐ Dialog focus-trap + restore — *a11y Phase 3*
- **Violates:** P3-2/P3-3. **Target:** `role="dialog"` + `aria-modal`, focus trap, focus restore on close for the insert/edit dialogs.

### UXP-17 ☐ Focus-visible + reduced-motion — *a11y Phase 4*
- **Violates:** P3-3. **Target:** the two additive CSS rules (`:focus-visible`, `prefers-reduced-motion`).

### UXP-18 ☐ Storage alert + muted contrast — *a11y Phase 5*
- **Violates:** P3-4/P3-5. **Target:** `role="alert"` on `#storage-warn`; raise `--muted` to pass WCAG AA in both themes (owner sign-off on the tone shift).

### UXP-19 ◐ Outline tree + table grid semantics — *deferred, dedicated pass*
- **Problem:** the virtualized outline isn't a `role="tree"` and tables aren't a `role="grid"`; high-risk to keep in sync across `render()`.
- **Violates:** P3 (full target). **Interim (required now):** per-row/per-pill `aria-label`s (UXP-15) so the deferral never means "unlabeled and silent." **Target (later):** `role="tree"`/`treeitem` + `role="grid"`/`gridcell` in a dedicated pass, sequenced in `accessibility.md`.

---

## Closing order (recommended)

1. **Tier 1** (UXP-2…5) — the breaks-the-language defects; cheap, high-trust, mostly keyboard/affordance consistency.
2. **Tier 2** (UXP-6…12) — discoverability + feedback gaps.
3. **Tier 3** (UXP-13…19) — follows `accessibility.md`'s existing phase order; interim labels (UXP-15) ship alongside whatever feature touches a pill.

When an item closes, flip its matrix cell in `ux-discipline.md` §9 to ✅ and delete its row here. The register is empty when the app speaks one language.
