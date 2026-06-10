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

*Note: UXP-2 (table cell keyboard navigation) shipped conformant — `Tab`/`Shift+Tab` wrap across rows, `Tab` at the last cell adds a row, `Enter` moves down and stops at the last row, landing cells select-on-entry; §3 grammar + §9 matrix updated.*

### UXP-3 ☐ Org `#+TBLFM:` formulas have no front door  *(Part A shipped — column aggregate panel)*
- **Problem:** table formulas are entered only by typing a raw `#+TBLFM:` line in markdown — no affordance, no menu path. Built but undiscoverable.
- **Violates:** P2-1, P2-3.
- **Part A (done):** column ▾ button on each column handle opens a "Calculate" panel (Sum / Average / Count / Min / Max / None). Selecting a function writes `@>$N=vKIND(@2$N..@-1$N)` in `#+TBLFM:`, auto-adds/removes the footer row, and marks computed cells read-only with a Σ prefix. Keyboard: `↑↓` navigate, `Enter`/`Space` apply, `Esc` closes. Touch: ▾ always visible.
- **Part B (open):** a cell-reference picker that writes the `@row$col` syntax for the user (for arbitrary field formulas). The Org syntax stays as the power path.

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

### UXP-9 ✓ Variables have no overview — **RESOLVED**
- **Problem:** variables affect math document-wide but there was no surface listing what exists and their resolved values — and more broadly, no way to discover *any* callable name (variable, grammar rule, named table, named chain) without reading every node.
- **Violated:** P2-4.
- **Resolved (two surfaces, no new syntax):**
  - **`{`-autocomplete** — typing `{` in edit mode opens a grouped picker (Variables / Rules / Tables / Chains) sourced from `collectCallables()` (wraps `collectVars` + the same token-gated tree-walk as `collectRules`; cached on `_varsVer`). Narrows on a bare identifier prefix; never fires after `=`, a dice pattern, or `|` (those are not name references). Variables show their resolved value inline. Applying completes `{name}`; the existing promotion-on-exit turns it into a pill — no new promotion path. §7.1 menu pattern: `↑/↓`/`Enter`/`Tab`/`Esc`, `role="menu"`/`menuitem`, caret-positioned like the `/` and `[[` menus.
  - **Variables panel** — `Ctrl/⌘+Shift+V` toggles a read-only slide-up panel (fn/bl-panel pattern) listing every declared variable with its resolved value (`↻ cycle` for cyclic refs); re-renders on `markDirty` while open. `role="region"`, labeled, close button.
- **Pure cores:** `collectCallables(rootNode)`, `filterBraceCandidates(callables, prefix)` — pinned in `tests/test.mjs`.

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

### UXP-21 ✓ Column header overloaded / hidden / under-sized controls (P1/P2/P3) — **RESOLVED**
- **Problem:** the table column header strip mixed several overloaded and hidden gestures with under-sized targets: a thin ▾ pill opener, a tiny ×-in-a-circle delete span, a **hidden double-click** that cycled alignment (discoverable only by accident), and an add-column "+" clipped to the thin handle row. Alignment, move, insert and delete had no consistent visible front door.
- **Violated:** P1-1 (overloaded/hidden gestures with no predictable home), P2-1 (built-but-undiscoverable column ops), P3-1/P3-2 (under-sized, drag-/double-click-only controls).
- **Resolved (consolidation):** all column operations live in **one** Column menu — **Calculate** (Sum/Average/Count/Min/Max/None), **Alignment** (Left/Center/Right, current shown active), **Width** (Fit/Narrow/Medium/Wide), **Insert column** (Left/Right), **Move column** (Left/Right, reusing `mtMoveItem`), and **Delete column** — all keyboard-operable per the §7.1 menu pattern. The hidden double-click-cycles-alignment handler is **removed**; drag-to-reorder and drag-to-resize each keep a **visible cue** and a keyboard-reachable twin in the menu; column **delete** lives in the menu; the add-column **"+"** is a full-height, non-clipped right-edge affordance.
- **Completed by Bases PR 2c (name-pill header):** the consolidation's last rough edge — the thin **`▾` caret opener on a separate `.mt-colh` handle row** — is now gone. The header **is** the affordance: the editable **name pill** (also the row-0 grid cell, so UXP-2 keyboard nav + type-to-overwrite rename reach it), the surrounding `.mt-colhead` `<th>` as the **click-for-menu / drag-to-reorder** zone, and the resize grip on its right border. The keyboard door is **`Shift+F10`** on a focused base cell (no dedicated chord). The once-planned **`⌘+M` Column / `⌘+Shift+M` Base** chords — which collided with the macOS minimize shortcut — were **dropped**, so the collision never shipped. *(This subsumes the P2-3 "no UI for column ops" portion; UXP-3 Part B — the arbitrary field-formula cell-reference picker — remains open.)*

### UXP-22 ✓ Markdown tables render only inside a `table`-type point (markdown-first) — **RESOLVED**
- **Problem:** a pipe table written in an ordinary point (bullet, paragraph, …) showed as raw `| a | b |` text — it rendered **only** when the whole point was the special `node.type === 'table'` widget. "Table" was the lone markdown construct whose appearance depended on a node type (every other — `#`, `>`, fences, lists — renders wherever it's written), and converting a base to another block type silently stopped its table from rendering.
- **Violated:** P1 (a construct that behaves consistently everywhere *except* tables), P2 (the markdown-first baseline, `bases-direction.md` §1).
- **Resolved (this PR):** `mdToHtml` now detects a GFM pipe table — a header row immediately followed by a *matching* delimiter row (`tableDelimCells` is the false-positive guard, so prose with pipes and a `---` thematic break are left alone) — on **any** line of **any** point, and emits a static, read-only `<table>` via `renderStaticTable`, **reusing the table CSS** so it looks identical to a base: alignment from the delimiter colons, cell content through `mdInline` (artifact tokens render as frozen pills), and an optional trailing `#+TBLFM:` line computed (`computeTable`) and **hidden** in the render. **Render-layer only** — `node.text` is never modified, so edit mode shows the full raw markdown (recipe line included), the same edit-raw / render-pretty model as headings. *(This is **PR 1** of the Bases arc, `bases-direction.md` §9. The table↔base **rename + base header** and the **Convert-to-base promote** remain PR 2 / PR 3; this PR does not touch the interactive base widget.)*

### UXP-23 ✓ Converting a point to a base destroyed its text (P4 data loss) — **RESOLVED**
- **Problem:** `applyBlockCmd`'s table branch did `if (!parseTable(node.text)) node.text = starterTableText()` — converting a point whose text wasn't already a table **silently overwrote that text** with an empty starter grid. A point with prose lost its content with no warning and no undo affordance at the moment of the gesture.
- **Violated:** P4 (no silent failure — a destructive action must never quietly discard the user's content).
- **Resolved (this PR, Bases PR 2a):** the rename `table` → **base** replaces that branch with `createBaseAt`, which is **non-destructive** via the pure `planBaseConvert`: an **empty** point becomes the base in place; a **content-bearing** point keeps its text as its own point and the base is inserted as the **next sibling** — text is *never* overwritten. The op is wrapped in `pushUndo()`. Pinned by `planBaseConvert` tests and confirmed by ephemeral browser verification (content preserved on convert).

### UXP-24 ✓ To-do rendered from the type flag, not the markdown (markdown-first) — **RESOLVED**
- **Problem:** `node.type === 'todo'` was an independent renderer: the checkbox came from the type (a rail `<input>` in the bullet), not from the text. Enter-inheriting a to-do produced `type='todo'` with **no `- [ ]` in the text** — a checkbox with no source, nothing to edit; typing `- [ ]` then **double-rendered** (rail checkbox + md-task checkbox); a `TODO`/`WAITING` keyword typed in a *plain* node rendered **no badge** because the badge was type-gated. Identical text rendered differently depending on an invisible flag.
- **Violated:** P1 (same text, different render), P2 (the markdown-first baseline, `bases-direction.md` §1 — same family as UXP-22).
- **Resolved (this PR):** to-do-ness now **derives from the text** — task form (first line `- [ ]`/`- [x]`) or Org keyword form (`TODO|NEXT|WAITING|DONE [#A]`). The rail checkbox is **removed**; the checkbox renders from the markdown via the existing md-task path, and the keyword badge renders for **any** node whose text starts with a keyword. `node.type='todo'` and `node.checked` are **derived hints** (`deriveTypeFromText`, `todoDoneFromText`) like headings. `/todo` and `/state:KW` are **markdown-writing helpers**; Enter is a **format-continuation aid** (`continuationPrefix` writes `- [ ] ` / the same keyword, DONE→TODO / `> ` for quotes). Legacy `_type="todo"` nodes are migrated on load (`migrateTodoText`). Pinned in `tests/test.mjs`.

### UXP-25 ☐ `ol` ordinals render from the type, not the text (markdown-first)
- **Problem:** a numbered point's ordinal comes from `node.type === 'ol'` + sibling position; the text carries no `1.` — the same type-as-renderer pattern UXP-24 just retired for to-dos.
- **Violates:** P1/P2 (markdown-first node model — only `paragraph` and `base` are special types).
- **Target:** list-ness derives from the text; the type stays a derived hint. (Auto-renumbering is the design question to solve first.)

### UXP-26 ☐ `divider` is type-only and destroys its text
- **Problem:** typing `---` converts immediately (`checkMdBlockPrefix`) and **clears `node.text`** — the one block whose markdown trace is erased; the render then depends wholly on the type flag.
- **Violates:** P1/P2 (markdown-first), P4-adjacent (the typed source is silently discarded).
- **Target:** `---` stays in the text (mdToHtml already renders `<hr>` from it); the type stays a derived hint.

### UXP-27 ☐ Whole-node `italic`/`underline` flags live outside the text
- **Problem:** `node.italic`/`node.underline` are per-node formatting booleans (`nc-italic`/`nc-underline` CSS) with no markdown trace — formatting state the text can't express or round-trip.
- **Violates:** P2/P5 (formatting belongs in the one markdown language: `*…*`, etc.).
- **Target:** retire the flags in favor of inline markdown (with an OPML migration), or document them as a sanctioned exception.

### UXP-28 ☐ Style bleed after an editable `.gr-src` `{name}` span (re-filed; PR #45's fix reverted)
- **Problem:** in edit mode, after a completed promotable `{name}`/`{…}` the browser can merge subsequently typed text *into* the trailing `.gr-src` span, so the space and following prose render grammar-styled. Worse on the **picker path**: after `braceApply` inserts `{name}`, `setCaretByOffset` descends into the span's text node, so continued typing bleeds from the first keystroke.
- **Violates:** P4 (rendering correctness / misleading feedback — prose looks like grammar source).
- **History:** PR #45 attempted a ZWSP caret-anchor after `.gr-src` spans + landing the caret inside it (`caretAfterGrSrc` offset 1). **Reverted:** verified only on manually-typed text, it broke the real flow — with the caret parked in the anchor, Backspace deleted the invisible ZWSP, `editableText` came back unchanged, and `checkInlineHighlight` re-rendered and **regenerated the anchor**: a no-op loop that made a picker-applied `{name}` reference **undeletable** (hard-baked). The sibling fix for **atomic pills** (contenteditable=false, anchor offset 0) does not have this loop and **stays** — pills aren't subject to `checkInlineHighlight` regeneration and Backspace deletes the whole pill.
- **Target:** typed text after a completed `{…}` renders as plain prose, the reference stays deletable, and the caret behaves through apply→type→delete cycles. Likely needs `braceApply`/`checkInlineHighlight` to place the caret *outside* the span without introducing a regenerable anchor (or to suppress regeneration while deleting).
- **Verification bar (mandatory for any future fix):** test the **picker-apply path** (`braceApply` via the `{` menu), not just manual typing — and test **Backspace/Delete** through the reference until it is fully removed. The #45 regression shipped precisely because verification covered synthetic typing only.

## Tier 3 — Accessibility conformance (additive; sequenced in `accessibility.md`)

These are **not new tickets** — they are the standard's P3 requirements mapped onto the existing accessibility phases, listed here so a11y is visible as part of the *one* conformance picture rather than a separate track. **Do not front-run the deferred items**; do satisfy the interim labels now.

### UXP-13 ☐ Accessible names on icon-only controls — *a11y Phase 0*
- **Violates:** P3-1. **Target:** `aria-label` on `#btn-done`, level buttons, pill pencils, table add buttons, search; decorative glyphs `aria-hidden`.

### UXP-14 ◐ Keyboard operability on `<div>`/`<span>` controls — *a11y Phase 1 (in progress)*
- **Violates:** P3-2. **Target:** `role`/`tabindex` + `keydown` **beside** existing `mousedown` (caret invariant) on file-menu items, collapse button, bullet, breadcrumb, slash-menu items, `#sc-toggle`→`<button>`, table handles, and the static-table `.mt-promote` button.
- **✅ Done — the bullet / point-actions popup (the highest-leverage slice).** `.bullet` is now `role="button"`/`aria-haspopup="menu"`/`aria-label`/`tabindex="-1"` + Enter-Space keydown; `#bpop` is a full `role="menu"` (items `role="menuitem"` + `tabindex="-1"`, arrow/Home/End nav, Enter/Space activate, Esc closes + restores focus, focus-visible rings). The keyboard door is **`Shift+F10` / the Menu key** on the focused point (`onKeyDown`), added to §3. This makes **every per-point action keyboard-reachable in one stroke** — type switch, zoom, copy link, move, delete, and the static-table **convert-to-base** (which was filed here in PR 3 and is now operable). 
- **☐ Remaining:** file-menu items, `.collapse-btn` (+`aria-expanded`), `.crumb`, slash-menu `.cmd-item`, `#sc-toggle`/`#storage-warn-close`→`<button>`, `.fn-key`, `.ghost-row`, table handles (`.mt-colh`/`.mt-rowh`/`.mt-delcol`/`.mt-delrow`), `.mt-promote` focus-reach (rides its `#bpop` menu entry, now live), `#sel-tb .cmd-icon` (selection-toolbar buttons — now also shown for base-cell selections; the typed markdown path covers the capability meanwhile).

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

## Enhancements (tracked, not defects)

These are **not non-conformances** — the standard is satisfied — just nice-to-haves noted so they aren't lost.

- 🟢 **Table arrow-key cell nav** — `↑/↓/←/→` to cross cells and `Shift+Arrow` to extend the selection (beyond the conformant `Tab`/`Enter` nav from UXP-2). Today arrows move the caret within the cell; P2-3 is met without this.

## Closing order (recommended)

1. **Tier 1** (UXP-3…5) — the breaks-the-language defects; cheap, high-trust, mostly keyboard/affordance consistency.
2. **Tier 2** (UXP-6…12) — discoverability + feedback gaps.
3. **Tier 3** (UXP-13…19) — follows `accessibility.md`'s existing phase order; interim labels (UXP-15) ship alongside whatever feature touches a pill.

When an item closes, flip its matrix cell in `ux-discipline.md` §9 to ✅ and delete its row here. The register is empty when the app speaks one language.
