# Pointliner — UX Remediation Register

## Every non-conformance is a tracked defect

This is the **fix list** that pairs with `ux-discipline.md`. The standard says what conformant looks like; this enumerates **every place the app does not yet conform**, as a numbered problem to be closed. It is a *retiring tracker* (like `accessibility.md`): an item leaves this file when it ships conformant and its row in the standard's matrix turns ✅.

**Governing rule:** under `ux-discipline.md` §0, **any non-conformance is a defect, not a preference.** There is no "that's just how that feature works" — a feature either conforms to the single interaction language or it is on this list. This explicitly includes **ad-hoc conventions invented per-feature** — every bespoke syntax, one-off shortcut, or improvised interaction that didn't come from the standard is, by definition, a non-conformance to fix (see the standing syntax-sprawl guard, UXP-20).

**Status:** ☐ open · ◐ in progress · ✓ closed (move the row out on close)
**Severity:** 🔴 breaks the unified language outright · 🟡 partial / inconsistent · 🟢 cosmetic-but-tracked

> **Current state (June 2026):** Tiers 1–3, the correctness batch, and the drift/a11y
> fixes (UXP-3…39) are ✓ closed. A six-domain **UX audit (June 2026)** then surfaced a
> fresh set of non-conformances, tracked below as **UXP-40…67**: **batch 1 (UXP-40…52) is
> ✓ closed** (data-safety + zero-risk conformance one-liners); **batch 2 (UXP-53…56) is
> ✓ closed** (the a11y-reachability batch — links, backlinks, footnote refs, todo picker);
> **batch 3 (UXP-58, UXP-59, UXP-64) is ✓ closed** (P4 feedback-consistency: error toasts,
> search empty-state, context-aware workspace snippet);
> **batch 4 (UXP-61, UXP-62, UXP-65, UXP-66) is ✓ closed** (visual + a11y consistency polish:
> theme-aware `--sh-up` panel shadow, agenda-calendar grid parity, transient Tab-group carve-out,
> non-colour urgency marker);
> **UXP-60 is ✓ closed** (Enter splits the point at the caret — `splitForSibling` + the
> `applyInlineReplace` fold dance, clone-both-then-prune sidecars);
> **UXP-57 is ✓ closed** (Shift+Arrow range selection in non-editing state — `flatRowStep` +
> `selFocusId` + `rangeSelectTo`; plain Arrow row-nav + `.node-cursor` visual);
> **batch 5 (UXP-63, UXP-67) is ✓ closed** (pill body-click P1 carve-out + the polish cluster:
> `/code` Enter hint, base `Ctrl+Enter` carve-out, menu `aria-controls`, distinct check-error glyph,
> canonical `.sh-row kbd` keycap, warm search `mark`, collapse = view-state). The cluster's one
> genuine behavior change — **Backspace merge-up** — was greenlit by the owner and shipped as
> **UXP-68 ✓ closed** (the inverse of UXP-60's caret-split). **UXP-20** remains the *standing* syntax-sprawl guard, which by design never
> closes. Closed entries are retained as the record of the decisions (and the regression
> tripwires) they encode.
> A **five-lens design audit (July 2026)** (design tokens, interaction, accessibility, copy,
> component consistency; every finding adversarially re-verified, 0 of 30 refuted) added
> **UXP-71…100** (registered as 70…99 in #280, renumbered +1 after a collision with the
> pre-existing UXP-70), tracked in their own section below;
> all thirty are ✓ closed (batches V1, D1, C1, V2, I1, V3, I2, July 2026).

Each entry: the **problem**, the **rule** it violates, and the **target** (the conformant end-state the fix must reach). Verify the named symbol with grep before acting — some controls drift (per `accessibility.md`'s "verify before you label").

---

## Tier 1 — 🔴 Breaks the unified language (fix first)

*Note: UXP-1 (Paragraph Enter inversion) was closed as a **documented exception** — Paragraph is now the sanctioned prose-mode block (Enter = line break, Shift+Enter = new point), advertised in the `/` menu and empty-state hint; see P1-1 in `ux-discipline.md`.*

*Note: UXP-2 (table cell keyboard navigation) shipped conformant — `Tab`/`Shift+Tab` wrap across rows, `Tab` at the last cell adds a row, `Enter` moves down and stops at the last row, landing cells select-on-entry; §3 grammar + §9 matrix updated.*

### UXP-3 ✓ Org `#+TBLFM:` formulas have no front door — **RESOLVED**
- **Problem:** table formulas are entered only by typing a raw `#+TBLFM:` line in markdown — no affordance, no menu path. Built but undiscoverable.
- **Violates:** P2-1, P2-3.
- **Part A (done):** column ▾ button on each column handle opens a "Calculate" panel (Sum / Average / Count / Min / Max / None). Selecting a function writes `@>$N=vKIND(@2$N..@-1$N)` in `#+TBLFM:`, auto-adds/removes the footer row, and marks computed cells read-only with a Σ prefix. Keyboard: `↑↓` navigate, `Enter`/`Space` apply, `Esc` closes. Touch: ▾ always visible.
- **Part B (done):** a **Formula** section in the cell context menu (`Shift+F10` on a cell, or the column-header click) — **Column formula…** (`$N=`) always, **Cell formula…** (`@R$C=`) on data rows — opens the formula dialog (the standard io dialog: focus-trapped, Esc/Enter, UXP-16). The **reference picker is the chip row**: every column by *name* inserts its `$N`, plus `cell above (@-1$C)` and `row № (@#)`; the hint teaches the full reference grammar (P2-2 — the menu teaches the syntax). A **live preview** computes the target cell through the real `computeTable` on every keystroke, reason-coded `#ERR` included (P4). Saving writes the assignment through the pure `tblfmSetAssign` (exact-lhs replace/append/remove — empty expression clears the formula); `mtSetFormula` recomputes and confirms via `flashHint`. Footer-row management stays with Calculate; the raw `#+TBLFM:` line (markdown edit) stays the power path. Pinned: `tblfmGetAssign`/`tblfmSetAssign` incl. the exact-lhs rule (`$3` never touches `@>$3`) and a round-trip through `parseTblfm`/`computeTable`.

### UXP-4 ✓ `[[` link picker is gated entirely off — **RESOLVED**
- **Problem:** `LINK_PICKER_ENABLED = false` shipped the most intuitive linking gesture with **no front door at any verbosity**.
- **Violated:** P2-1 ("built ≠ shipped-discoverable").
- **Resolved (un-gated + re-verified against the post-gate internals):** the flag is now `true` (kept as a kill switch). Typing `[[` opens the picker (candidates from the new pure core `linkCandidates(query, excludeId, rootNode)` — substring on `textForDisplay` titles, self excluded, pinned); the trigger regex excludes `#`, so typing/pasting a **raw `[[#id|]]` token is never intercepted** — Copy-link + paste stays the power path. Two upgrades shipped with the un-gating: **(1)** apply now writes the **live-title form `[[#id|]]`** (the same form Copy-link produces) instead of freezing the title as typed-at-apply-time; **(2)** because that makes stale captions visible, `exitEdit` now **repaints backlink sources** when a node's text changes — renaming a target updates every on-screen link/mirror immediately instead of waiting for the next full render (off-screen rows render fresh on scroll). Verified with an unfolded `{2d6}` in the same buffer (apply splices the live edit buffer in-session — no blur, no UXP-30 hazard). The picker carries the full caret-picker AT wiring from day one (see UXP-14). `?` panel gained the `[[` row.

### UXP-5 ✓ `Ctrl/⌘ + ↑/↓` collapse collides with caret-to-edges — **RESOLVED**
- **Problem:** collapse/expand sat on `Ctrl+Arrow`, which conflicts with the near-universal "caret to start/end of document" and is one modifier away from `Alt+Arrow` (move).
- **Violated:** P1-2, keyboard grammar §3.
- **Resolved:** collapse/expand rebound to `Ctrl/⌘ + . / ,` (`.` collapse, `,` expand) in `onKeyDown`; `Ctrl+Arrow` now falls through to the native caret-to-document-edge. The chevron affordance is unchanged; the `?` panel (`SHORTCUTS`) row updated to match. This binding was already specified in `ux-discipline.md` §3 — the code was the laggard, now in conformance.

---

## Tier 2 — 🟡 Partial / inconsistent

### UXP-6 ✓ Inline `{…}` shorthand fails silently — **RESOLVED**
- **Problem:** an invalid/unrecognized brace body just stayed as plain text with no signal — the user couldn't tell a typo from intended literal text. Worse, two bodies **styled as valid** but silently failed to promote: a dice-looking body that doesn't parse (`{2d6kh}` — `DICE_SNIFF` passed, `parseDice` failed) and a malformed expression (`{= 2*}` — `braceWouldPromote` only checked non-emptiness).
- **Violated:** P4-1.
- **Resolved (pure core `classifyBraceBody(body, rules, vars)`, pinned):** classifies a brace body the way `promoteBraceBody` will actually treat it on exit — `'artifact'` (promotes), `'invalid'` (reads as an attempted formula/roll/reference but will NOT promote), `'literal'` (prose braces, the deliberate escape hatch) — mirroring promoteBraceBody's branch order *including* its fall-throughs (`{2d6|1d4}` fails the dice parse but promotes as alternation). `braceWouldPromote` is now a thin wrapper on it, so edit-mode styling can never again disagree with promotion. In edit mode an `'invalid'` body renders as `.gr-src.gr-bad` — warn-toned dotted underline + "Not recognized — stays plain text" title — applied **live** as the closing `}` lands (`checkInlineHighlight` re-renders for invalid too, not just promotable). Intentional literal braces (`{hello world}`) get no marker. UXP-7 (preview of what a *valid* body becomes) remains open and pairs with this.

### UXP-7 ✓ Shorthand has no preview before it commits — **RESOLVED**
- **Problem:** `{…}` promotes to a pill on exit with no preview of what it will become.
- **Violated:** P2-5.
- **Resolved (pure core `braceTypeLabel(body, rules, vars)`, pinned):** a non-interactive tooltip (`#brace-preview`) appears below the closing `}` as soon as a valid `{body}` is complete at the caret, showing what pill type the body will promote to on exit: `→ dice`, `→ math`, `→ grammar · ruleName`, `→ var · name = value`. Positioned by the shared `positionCaretMenu`; shown synchronously in `checkInlineHighlight` after `editModeHTML` re-renders, so there is no one-frame race between show and the next input event. Hides automatically when any input changes the body or moves the caret away from the `}` — no user gesture required; also cleared on blur and on `normalizeGrSrcSpans` normalize. The `gr-bad` marker (invalid body, UXP-6) and the preview (valid body) are mutually exclusive — they coexist cleanly because `checkInlineHighlight` handles both paths. `pointer-events: none` keeps the overlay from intercepting mouse events. Pairs with UXP-6's typo signal to complete the `{…}` feedback loop: bad body → warn marker + AT announcement; good body → preview tooltip.

### UXP-8 ✓ Table `#ERR` gives no reason — **RESOLVED**
- **Problem:** formula errors rendered a bare `#ERR` with no cause (cycle vs bad ref vs non-numeric).
- **Violated:** P4-2.
- **Resolved (shared pure core `mathErrorReason`, pinned):** `computeTable` now emits `#ERR (cycle)` (cell self-reference, from the `CYCLE` throw), `#ERR (bad ref)` (an identifier names nothing declared), `#ERR (non-numeric)` (an identifier names a string-valued/pick variable), or a bare `#ERR` for generic malformed syntax. `mathErrorReason(expr, vars, cycles)` mirrors `evalMath`'s own rule — an identifier directly followed by `(` is a function call, not a variable — so function names need no enumeration. The same helper powers UXP-34 (math pills), so both surfaces report identically.

### UXP-9 ✓ Variables have no overview — **RESOLVED**
- **Problem:** variables affect math document-wide but there was no surface listing what exists and their resolved values — and more broadly, no way to discover *any* callable name (variable, grammar rule, named table, named chain) without reading every node.
- **Violated:** P2-4.
- **Resolved (two surfaces, no new syntax):**
  - **`{`-autocomplete** — typing `{` in edit mode opens a grouped picker (Variables / Rules / Tables / Chains) sourced from `collectCallables()` (wraps `collectVars` + the same token-gated tree-walk as `collectRules`; cached on `_varsVer`). Narrows on a bare identifier prefix; never fires after `=`, a dice pattern, or `|` (those are not name references). Variables show their resolved value inline. Applying completes `{name}`; the existing promotion-on-exit turns it into a pill — no new promotion path. §7.1 menu pattern: `↑/↓`/`Enter`/`Tab`/`Esc`, `role="menu"`/`menuitem`, caret-positioned like the `/` and `[[` menus.
  - **Variables panel** — `Ctrl/⌘+Shift+V` toggles a read-only slide-up panel (fn/bl-panel pattern) listing every declared variable with its resolved value (`↻ cycle` for cyclic refs); re-renders on `markDirty` while open. `role="region"`, labeled, close button.
- **Pure cores:** `collectCallables(rootNode)`, `filterBraceCandidates(callables, prefix)` — pinned in `tests/test.mjs`.

### UXP-10 ✓ Hashtags have no index / autocomplete — **RESOLVED**
- **Problem:** no tag list or completion, so tags drifted (`#todo` vs `#todos`). (Was backlog "Tag power.")
- **Violated:** P2-4.
- **Resolved (pure cores `collectTags(rootNode)` + `filterTagCandidates(tags, prefix)`, pinned):** a `#` tag picker on the §7.1 menu pattern (trigger → narrow → `↑/↓`/`Enter`/`Tab`/`Esc`, `role="menu"`/`menuitem`, caret-anchored via the now-shared `positionCaretMenu`). `collectTags` walks the tree with **mdInline's own sigil rule** (`#` not preceded by a letter/digit) after stripping `[[…]]` tokens — so link targets (`[[#id|…]]`) never read as tags — counts occurrences, sorts most-used first, and caches on `_varsVer`. Status keywords (`#TODO`) count deliberately: completing them is useful. The trigger fires on `#prefix` at the caret (never inside a `[[` link token); the in-progress tag's own count-1 self-occurrence is excluded, and a fully-typed lone exact match dismisses the menu. Applying writes the existing `#tag` syntax — zero new syntax (P5). The `?` panel gained the `#` row beside `/` and `@`.

### UXP-11 ✓ Some pills are reachable only via the insert dialog — **RESOLVED**
- **Problem:** certain generators are creatable only through `@`/dialog, with no shorthand path, so authoring is inconsistent across pill types.
- **Violated:** P2-1 (three doors).
- **Resolved (audit + documentation):** audit confirmed **every pill type is reachable via the `@` menu** — dice, roll table, Markov chain, grammar, math, variable, and sequence are all listed there; P2 is satisfied. The one documentation gap was the `SHORTCUTS` panel's `@` row, which said "…dice, math, variable…" (trailing `…` didn't name the rest). Updated to the explicit list: "link, image, footnote, dice, roll table, Markov chain, grammar, math, variable, sequence." Markov, rolltable, grammar, and sequence intentionally have no `{…}` typed shorthand — their configuration is richer than a one-liner, so the dialog is the right authoring path (P5-conformant by construction).

### UXP-12 ✓ Structural/destructive actions don't all confirm — **RESOLVED**
- **Problem:** delete-subtree, paste-points, cut, and bulk indent didn't consistently surface a confirmation toast the way copy-link does.
- **Violated:** P4-3.
- **Resolved:** the existing `flashHint` toast now fires for every structural/destructive action, with descendant-inclusive counts (`countPoints`/`ptsLabel`, vocabulary "point(s)"): delete-point/subtree (`Deleted N points — ⌘/Ctrl+Z to undo` — quiet for the Backspace-on-empty-leaf editing flow, where the effect is visible at the caret), multi-select delete and cut (`Cut …`, via `deleteSelected(verb)`), copy (`Copied N points`), paste from the node clipboard (`Pasted N points`), multi-line text paste (`Pasted as N points`), and bulk indent/outdent (`Indented/Outdented N points`). Destructive toasts teach the undo route in the same breath.

---

## Correctness defects with UX impact (P4 — silent corruption / silently wrong data)

From the engine audit; each re-verified live against the current code (June 2026). These are
engine bugs, but they violate P4 the same way a missing toast does — the user's data or the
data shown to the user is silently wrong — so they're tracked here, not in a separate list.

### UXP-30 ✓ 🔴 `@`-menu insertion corrupts text when an unfolded artifact precedes the caret — **RESOLVED**
- **Problem:** `insertInlineArtifact` captured the caret offset against the **unfolded** edit
  buffer (`getCaretOffset` while `{…}` text is live), then opened a dialog — which blurs the
  editor, firing `exitEdit` → `refoldArtifacts`, so `node.text` reverts to the **longer folded**
  token form. The dialog's `onResult` then called `applyInlineInsertion` with the stale unfolded
  offset, splicing the new `[[type:key]]` at the wrong position — possibly *inside* an existing
  token, corrupting it. Same family: the selection-toolbar link path and the `@table`
  size-picker's newline-padding peek.
- **Violated:** P4 (silent data corruption).
- **Resolved (pure core `foldedOffsetFor(node, offset)`, pinned):** the exact inverse of
  `unfoldedPrefixLen` — walks the folded text's inline-able tokens accumulating each one's
  `{…}` length, translating an unfolded offset into folded coordinates; an offset *inside* an
  unfolded span snaps to just after its token (a splice must never land inside a token).
  Applied centrally in `applyInlineReplace` — the choke point all three caller families flow
  through — at **splice time** rather than capture time, so it also absorbs
  `promoteInlineShorthand`'s length changes (a capture-time translation against the refold
  pairs alone could not). The contract is documented on the function: `start`/`end` are
  unfolded (edit-buffer) coordinates, which every caller satisfies since the `@` menu and
  selection toolbar exist only in edit mode. `applyInlineReplace` also now blurs a
  still-editing node first (the createBaseAt hazard), making it self-sufficient. The `@table`
  padding peek translates locally and passes the raw offset through.

### UXP-31 ✓ 🔴 Mid-edit undo entries record the unfolded buffer — **RESOLVED**
- **Problem:** `flushActiveTextEdit` (called by `pushUndo` before any structural op, and by
  `undo()`) recorded `editableText(el)` — the live **unfolded** `{…}` buffer — as a text-undo
  entry's `next`, and reset `dataset.prevText` to it, so the *following* `exitEdit` entry mixed
  coordinate systems too (`prev` unfolded, `next` folded). Undoing past that boundary after
  exiting edit restored raw unfolded `{…}` into `node.text` outside edit mode: the WeakMap
  refold data no longer applies, so the artifact's frozen roll + key were lost — the next
  edit/exit re-promoted it as a *fresh* pill with a new roll.
- **Violated:** P4 (silent data corruption; frozen state silently re-rolled).
- **Resolved (the invariant: undo entries and `dataset.prevText` are ALWAYS folded):**
  - `flushActiveTextEdit` records `foldedTextForSave(node)` as the entry's `next` and the new
    `prevText` baseline (the live `node.text` stays the unfolded buffer — the editing contract
    is untouched). `prevText` was already folded at the other end (`enterEdit` sets it *before*
    `unfoldArtifacts`; `exitEdit` records *after* `refoldArtifacts`), so every entry is now
    folded↔folded.
  - The multi-line **paste** path's baseline reset (`handlePaste`) leaked the same way — now
    also `foldedTextForSave`.
  - `applyEntry`'s strip-editing-state path abandoned an active session with `node.text` still
    holding the unfolded buffer (exitEdit never runs for it — the editing flag is deleted
    before render); it now calls `refoldArtifacts` on the abandoned node, so an undo/redo
    landing on a *different* node can't leave raw `{…}` in the model either.
  - New/edited shorthand in a flushed entry stays literal text (it had no frozen state at that
    moment) — faithful, and consistent with the promote-on-exit escape-hatch semantic. Pinned:
    `unfoldArtifacts ⇄ foldedTextForSave` round-trip, edited-shorthand passthrough.

### UXP-32 ✓ 🟡 File → Open / New serves the previous document's caches — **RESOLVED**
- **Problem:** `newFile` and `openFile` replaced `root` and called `markClean()` — but never bumped
  `_varsVer` (only `markDirty` does). Every `_varsVer`-keyed cache — `collectVars`,
  `collectRules`, `collectLinks`, `collectSequences`, `collectCallables`, state commands —
  kept serving the **previous** document's data until the first edit: the variables panel,
  backlinks, `{`-autocomplete, and status-badge state sets were silently wrong on a fresh open.
- **Violated:** P4 (silently wrong data presented as current).
- **Resolved:** a `resetDocCaches()` helper (`_varsVer++`, the same invalidation `markDirty`
  performs) is called beside **every** `buildIndex(root, null)` that swaps the tree — `newFile`,
  both `openFile` branches, `restoreSnapshot` (undo/redo), and both init load paths — so a fresh
  document never serves a stale cache. The can't-forget pattern (every tree swap pairs with the
  reset) is the durable guard for future load paths.

### UXP-33 ✓ 🟡 Anonymous `{a|b}` pills register a phantom doc-wide rule named `origin` — **RESOLVED**
- **Problem:** `promoteBraceBody` wrapped inline alternation as `origin: a | b` and bare-name
  references as `origin: {name}`; `collectRules` and `collectCallables` merged **every** pill's
  rules unconditionally, so each anonymous pill registered (and clobbered) a document-wide rule
  named `origin` the user never declared. `{origin}` typed anywhere resolved to whichever
  anonymous pill was gathered last — and since UXP-9, the `{`-autocomplete *advertised*
  `origin` as a callable rule.
- **Violated:** P4 (phantom name, surprising resolution), P5 (the namespace is polluted by an
  implementation detail).
- **Resolved:** shorthand-promoted grammar records carry an `anon: true` flag (set at the two
  `promoteBraceBody` synthetic-`origin` call sites); `collectRules` and `collectCallables` skip
  any flagged record, so the synthetic `origin` never enters the document-wide namespace or the
  `{`-autocomplete. A pill's own expansion is unaffected — `runGrammar` merges the pill's own
  `def` rules last, so its `origin` still resolves locally. Keying on the **flag**, never the
  name, leaves the dialog-example `origin:` convention for *named* grammars fully callable
  (pinned by a regression test). Pre-flag records in old saves aren't migrated — pre-release,
  consistent with the bare-keyword non-migration philosophy.

### UXP-34 ✓ 🟡 Math pill shows a stale value instead of an error on an unresolvable reference — **RESOLVED**
- **Problem:** when a math pill's referenced variable became unresolvable — deleted, cyclic, or
  redeclared as a non-numeric kind (e.g. a random/pick variable) — the pill fell back to its
  last-good `m.result` rather than surfacing the failure (`renderMathPill`: a `null` recompute
  against `globalVarMap` rendered the stored result). The stale number read as still-valid.
- **Violated:** P4-2 (errors explain the cause; no silent stale result).
- **Resolved:** when the live recompute is `null`, the pill now renders a reason-coded
  `#ERR (cycle | bad ref | non-numeric)` (via the shared `mathErrorReason`, the same helper as
  UXP-8) with an accurate `aria-label`, never the stale `m.result`. The error pill uses a new
  `math-err` class (dashed `--bad` border, red result) that — unlike the dead-record `math-bad` —
  **keeps the click-to-edit affordance**, so the user can fix the broken reference. Healthy pills
  also gained an `aria-label` in the same pass (incidental progress toward UXP-15; that item is
  not yet closed). Was pre-existing, not introduced by #62.

### UXP-35 ✓ Fast typing across a completing `}` garbles the buffer (caret-restore race) — **RESOLVED**
- **Problem:** `checkInlineHighlight` re-renders the edit buffer when a typed `}` completes a
  classifiable `{…}` and restores the caret **a frame later** (`requestAnimationFrame`, because
  the browser resets the selection after an input handler). Keystrokes landing in that gap
  splice at a stale caret position, scrambling the typed text. Pre-existing on the pre-UXP-6
  base — the invalid-body re-render added by UXP-6 widened the trigger set but did not create
  the race.
- **Violated:** P4 (silent text corruption while typing).
- **Resolved (generation counter):** every `checkInlineHighlight` call bumps a module-level
  `_highlightGen` and captures its own generation; the deferred rAF caret-restore runs **only
  if no later call has superseded it** (`myGen !== _highlightGen` → skip). A keystroke landing
  in the gap therefore invalidates the stale restore instead of having its splice point yanked
  out from under it — the *latest* input's coordinates always win. The IME guard and the
  no-anchor rule (UXP-28) are untouched.

### UXP-36 ✓ The `?` panel's `SHORTCUTS` array is a hand-maintained parallel registry — **RESOLVED (drift guard)**
- **Problem:** keybindings live in `onKeyDown`/document handlers; their documentation lives in a
  separate hand-edited `SHORTCUTS` array. The two have already drifted once (UXP-29 found a
  retired chord still documented and five live ones missing). Every keyboard change risks silent
  help-panel rot.
- **Violated:** P2/P4 (the help surface silently lies when it drifts).
- **Resolved (the test option from the target):** `tests/test.mjs` now reads the raw
  `index.html` source and pins the presence of the `SHORTCUTS` registry declaration plus
  representative live handler patterns (Ctrl+S, `collapseToLevel`, `toggleVarPanel`, the
  pill-pencil Enter/Space path). Renaming or removing a documented handler now trips a test
  instead of silently rotting the help panel. Full single-sourcing (one table read by both the
  handlers and the `?` panel) stays a welcome refactor, but the drift class is now wired.

### UXP-37 ✓ Dates + Agenda shipped without `?`-panel documentation — **RESOLVED (drift, closed in the same pass)**
- **Problem:** the Dates + Agenda feature (and the Timeline/Calendar views added in PR #73)
  shipped with their filter syntax documented only in the **focus-shown search legend** and the
  §2 inventory — **the `?` panel (`SHORTCUTS`) carried no `due:`/`start:` row** and **no entry at
  all** for the `/due` (Schedule) verb or the Agenda views. Exactly the help-panel drift UXP-36
  anticipated: a feature merged and its hand-maintained `?`-panel rows were never added. The §2
  inventory was also stale — it still described the Agenda as a "two-row horizontal strip" with
  Timeline/Calendar "planned," though both shipped.
- **Violated:** P5-4 (a typeable syntax — `due:`/`start:` — documented in the inventory + legend
  but **not** the `?` panel, which §2 names as a required front door), P2-1 (the Schedule verb and
  Agenda views had visible affordances but no `?`-panel door).
- **Resolved (this pass):** the `?` panel gained a **`due:today` / `due:overdue` / `start:<date`
  row** in *Search & filter* (mirroring the legend) and a new **Dates & agenda** section
  documenting `/due` (Schedule), the Agenda toolbar button, and its List / Timeline (Gantt) /
  Calendar views. The §2 inventory row was rewritten to the shipped vertical-bar layout, the §9
  matrix gained a *Dates / agenda* row, and the due-dates front-door src-pin test (`tests/test.mjs`)
  now pins both the `due:`/`start:` row and the *Dates & agenda* section — so the panel can't drift
  back out of sync (the UXP-36 pattern, applied to the rows themselves).

### UXP-38 ✓ Variables panel has no `aria-live` on content-refresh (P3-1) — **RESOLVED**
- **Problem:** when the user opens the variables panel (the `{` picker sidebar) and a variable's
  value changes — either because they edited a formula node or re-rolled a pick — the panel
  content updates visually, but the update is **not announced to assistive technology**. The
  panel itself has `role="region"` and an `aria-label`; the close button is named and
  keyboard-operable. Only the live-region gap remains.
- **Violated:** P3-1 (every status change reachable without sight). The pill itself already
  announces its own state correctly (per-state `aria-label` for ↻/？/—); this is the panel-
  level complement.
- **Resolved:** `#var-panel-list` carries `aria-live="polite"`, so a screen reader hears value
  changes when the panel is open. Because `markDirty` rebuilds the panel on **every keystroke**,
  a naive live region would spam — so `updateVarPanelContent` now computes a content **signature**
  (`JSON.stringify` of name + cycle-flag + value) and returns early when it is unchanged, leaving
  the existing DOM (and the live region) untouched. AT therefore only hears a change when one
  actually happens; the guard also removes needless per-keystroke DOM thrash. Src-pinned.

### UXP-39 ✓ Rendered hashtag `<a>` elements are not keyboard-operable (P3-1) — **RESOLVED**
- **Problem:** `<a class="hashtag">` elements in rendered content have no `href`, no `tabindex`,
  and no `keydown` handler — they activate only on `mousedown`. A keyboard user cannot Tab to
  a hashtag chip in rendered output and press Enter/Space to filter by it.
- **Violated:** P3-1 (every interactive element keyboard-operable). The *capability* (filter by
  `#tag`) has a keyboard front door — the search box and the `#` picker — so P3-2 is satisfied;
  this is the element-level interaction gap only.
- **Disposition:** same as todo-picker chips before UXP-16 — capability is keyboard-reachable
  via search, but the rendered widget itself is not independently operable.
- **Resolved:** the rendered chip now mirrors the established display-mode inline-widget pattern
  (`.note-ind` / `.prop-chip`): `role="button"` + `tabindex="-1"` (AT-focus reach, not a Tab
  stop — consistent with pills, **not** `tabindex="0"`) + `aria-label="Filter by #tag"` +
  a `.hashtag:focus-visible` outline, and an Enter/Space branch in the node-content `keydown`
  that calls the shared `searchHashtag` helper — the same filter the click runs, added **beside**
  `mousedown`+`preventDefault`, never replacing it (caret invariant). Src-pinned, and the real
  `mdInline` render output verified (the `#` inside the aria-label is not re-matched as a tag).

---

## UX audit (June 2026) — new defects (UXP-40…67)

A six-domain UX review (editing/keyboard, artifacts/pills, navigation/links, search/agenda/dates,
workspace/files, visual/responsive) against `ux-discipline.md` (P1–P5) + `design-language.md`.
**Batch 1 (UXP-40…52)** — the data-safety trio + zero-risk conformance one-liners — shipped + verified
together (behavioral fixes headless-pinned; declarative fixes verified by inspection + green suite).
**UXP-53…70** have since all been resolved (the rows below carry the per-entry evidence). The
dominant theme of that run: the a11y pass (UXP-19 pills / UXP-39 hashtags) had not reached the
*reference tokens* (links, footnotes) or *secondary panels* (backlinks, todo-picker) — that was the
UXP-53…56 batch. This file is append-only: closed rows are retained as the record, so the only
permanently-open entry is the standing syntax-sprawl guard (UXP-20).

### UXP-40 ✓ IME composition unguarded in `onKeyDown` — **RESOLVED** (batch 1) 🔴
- **Problem:** Enter/Tab/Backspace during a CJK/IME composition fired the structural editor
  (`insertSiblingAfter` / line-break / `deleteNode`), destroying the in-flight candidate. The `input`
  path was IME-guarded; the structural `keydown` path (`onKeyDown`) was not. Real data loss for IME users.
- **Violated:** P1 / P3.
- **Resolved:** `if (e.isComposing || e.keyCode === 229) return;` as the first line of `onKeyDown`.
  Headless-pinned (a composing keydown never inserts a sibling).

### UXP-41 ✓ Confirm-dialog Enter confirms despite focusing Cancel — **RESOLVED** (batch 1) 🔴
- **Problem:** `openConfirmDialog` focuses Cancel "so Enter doesn't accidentally discard," but the
  `ioBack` keydown made Enter call `finish(true)` **unconditionally** — defeating its own guard. Every
  Discard / Delete-permanently flow could be confirmed by a reflexive Enter.
- **Violated:** P1 / P4.
- **Resolved:** Enter now resolves to the focused button (`finish(document.activeElement === okBtn)`).
  Headless-pinned (Enter on Cancel → no confirm; Enter on OK → confirm).

### UXP-42 ✓ Single-node drag-reorder was not undoable — **RESOLVED** (batch 1) 🟡
- **Problem:** `performDrop` (single-bullet drag) called only `markDirty(); render()` — no `pushUndo()`,
  unlike every sibling path (`moveNode`, `performMultiDrop`, `refileNodeTo`, `deleteNode`). A misplaced
  drag was unrecoverable, and a later undo jumped past it.
- **Violated:** P4 (and P1 — drag-one diverged from drag-many).
- **Resolved:** `pushUndo()` before the splice. Headless-pinned (undo recorded; reorder still correct).

### UXP-43 ✓ `.io-btn.danger` white-on-pastel-red fails contrast in dark mode — **RESOLVED** (batch 1) 🟡
- **Problem:** `color:#fff` on `background:var(--bad)`; dark `--bad` is a pastel (`#f0928b`) → white ≈ 2:1,
  illegible label on the confirm dialog's primary button. The hardcoded `#fff` also bypasses the token system.
- **Violated:** `design-language.md` §3 (contrast floor; colored surface pairs with computed contrast ink).
- **Resolved:** the app's danger-tint recipe (`background:color-mix(--bad 14% / --hbg); color:var(--bad);
  border:--bad 40%`), matching `.nsb-btn.danger` / `#storage-warn` / `.prop-check-fail` — legible both themes.

### UXP-44 ✓ Confirm-dialog icon used a hardcoded non-theming red — **RESOLVED** (batch 1) 🟢
- **Problem:** `ic.style.cssText = 'background:rgba(201,64,64,.14);color:#c94040'` — a fresh literal red,
  not `--bad`; identical in both themes (no response), barely visible on the dark card.
- **Violated:** `design-language.md` §3 ("one red = `--bad`, never a fresh hex").
- **Resolved:** `color-mix(in srgb,var(--bad) 14%,transparent)` + `color:var(--bad)`.

### UXP-45 ✓ `math-err` pill clickable but not keyboard-focusable — **RESOLVED** (batch 1) 🟡
- **Problem:** the UXP-34 `math-err` pill "keeps the edit affordance so the user can fix the broken
  reference," but it lacked `tabindex` (its `est-err` sibling has it) — a keyboard user is told there's an
  error to fix but can't reach the fix.
- **Violated:** P3-2.
- **Resolved:** `tabindex="-1"` on the `math-err` span (mirrors `est-err`; the `.math-roll` keydown branch already handles it).

### UXP-46 ✓ Same-doc broken link gave AT no "broken" signal — **RESOLVED** (batch 1) 🟢
- **Problem:** `node-link-broken` (same-doc) carried no `aria-label`; "broken" was color/dotted-underline
  only — while the cross-doc twin already announced it. Color as sole carrier.
- **Violated:** P3-4.
- **Resolved:** `aria-label="<cap> (broken link)"` on the same-doc broken pill, mirroring the cross-doc one.

### UXP-47 ✓ `est-pill` omitted from the iOS touch-callout suppression — **RESOLVED** (batch 1) 🟢
- **Problem:** estimates are tappable (re-sample) like dice, but `.est-pill` was missing from the
  `-webkit-touch-callout:none` group, so an iOS long-press can trigger the text-selection callout.
- **Violated:** P3 (touch).
- **Resolved:** added `.est-pill` to the selector.

### UXP-48 ✓ `.bl-link-btn` focus ring used `--ring` (alpha glow) not solid `--acc` — **RESOLVED** (batch 1) 🟢
- **Problem:** `outline:2px solid var(--ring)` — a 2px solid outline of a ~20%-alpha colour is a faint,
  low-contrast ring, inconsistent with every other control's `2px solid var(--acc)`.
- **Violated:** `design-language.md` §4 (`--ring` = decorative glow; `:focus-visible` = solid accent).
- **Resolved:** `outline:2px solid var(--acc)`.

### UXP-49 ✓ Manual Save gave no confirmation (silent success) — **RESOLVED** (batch 1) 🟡
- **Problem:** `writeH` `markClean()`-ed with no toast, while every other save-class action flashes one.
  The most common save path was the silent one.
- **Violated:** P4 (every action confirms).
- **Resolved:** `writeH` now returns success; `saveFile`/`saveAsFile` flash `Saved "<name>"`, `dlOpml` flashes
  `Downloaded "<name>"`. The boolean keeps auto-write (`flushWorkspaceFile`) toast-free. Headless-pinned.

### UXP-50 ✓ Workspace-doc delete was silent on success — **RESOLVED** (batch 1) 🟢
- **Problem:** `deleteWorkspaceDoc` confirmed + alerted on failure, but a *successful* permanent delete
  acknowledged only by the row vanishing — under the destructive-toast discipline (UXP-12) elsewhere.
- **Violated:** P4.
- **Resolved:** `flashHint('Deleted "<name>"')` after a successful `removeEntry`.

### UXP-51 ✓ Non-Chromium "Copy link" claimed success while copying nothing — **RESOLVED** (batch 1) 🟡
- **Problem:** the `else` (no `navigator.clipboard`) branch of the Linked-notebooks invite flashed
  "Link copied" without copying — a false-success front door for the exact browsers it targets.
- **Violated:** P4.
- **Resolved:** route through `fallbackCopy` (the `execCommand` path `copyNodeLink` already uses) in both the
  no-clipboard and rejection branches — it actually copies, and only confirms on success.

### UXP-52 ✓ Search legend omitted `has:` / `key:value` — **RESOLVED** (batch 1) 🟢
- **Problem:** two shipped, parseable operators were in the `?` panel but absent from the always-visible
  focus-shown legend (the primary operator front door).
- **Violated:** P5-4 / P2-1 (every authoring syntax in a documented, reachable place).
- **Resolved:** a legend `sh-row` for `has:key` / `key:value` (with examples).

---

### UXP-53 ✓ Node-link pills keyboard-operable in display mode — **RESOLVED** 🟡
- **Problem:** `.node-link` / `-mirror` / `-broken` / `-cross` render as `<span contenteditable="false">`
  with **no `tabindex`/`role`/`aria-label`** and are absent from the pill-body keydown dispatch
  (`onKeyDown` ~7417) — link navigation is mouse-only; a screen reader gets an unnamed span.
  *Independently flagged by two reviewers.* The §9 matrix's "Links P3 ✅" is now inaccurate.
- **Violates:** P3-1/P3-2. **Target:** the UXP-39 pattern — `role="link"` + `tabindex="-1"` + `aria-label`
  on all `.node-link*` variants, and a `.node-link` branch in the keydown block (zoom same-doc / switch+zoom
  cross-doc) added **beside** `mousedown`+`preventDefault`. `renderLinkPill` (~2350) / `renderCrossLinkPill`.
- **Resolved:** all six link-pill variants (`renderLinkPill` broken/mirror×2/plain + `renderCrossLinkPill` broken/cross) carry `role="link"` + `tabindex="-1"` (broken/cross already had `aria-label`; plain/mirror are named by their content); a `.node-link` branch in the `onKeyDown` Enter/Space block dispatches the display-mode `mousedown` the existing handler processes (zoom same-doc / switch+zoom cross-doc), and a `.node-link:focus-visible` ring. Headless-pinned (role/tabindex present; Enter on a link navigates to its target).

### UXP-54 ✓ Backlinks panel rows keyboard-operable + reachable — **RESOLVED** 🟡
- **Problem:** `.bl-item` (same-doc) and `.bl-cross` rows in `renderBlPanel` (~14148) are plain `<div>`s
  with a `click` listener only — no `role`/`tabindex`/`keydown`, and the same-doc rows have **no accessible
  name** (cross-doc rows at least carry one). The panel surfaces on edit-focus but isn't a Tab stop, so a
  keyboard user sees "Linked from" appear but can't reach/follow any backlink. Same-doc rows also use the
  internal word "node" in `title` (V/§1 vocabulary).
- **Violates:** P3-1/P3-2 (+ vocabulary). **Target:** `role="button"`+`tabindex`+`aria-label`+Enter/Space on
  rows, a focus path into the panel, "point" in copy.
- **Resolved:** the same-doc + cross-doc backlink rows **and** the unlinked-ref title carry `role="link"` + `tabindex="0"` (matching the panel's existing `.bl-link-btn`) + `aria-label` + an Enter/Space `keydown` beside the `click`, with "point" vocabulary; **`scheduleBlHide` now keeps the panel open when focus is within `#bl-panel`** (the `scheduleFnHide` precedent), so focusing a row no longer dismisses it; `.bl-item:focus-visible` ring. Headless-pinned (role/tabindex/aria; panel stays open on row focus; Enter navigates to the source).

### UXP-55 ✓ Footnote refs keyboard / touch / AT-operable — **RESOLVED** 🟡
- **Problem:** `<sup class="fn-ref">` (mdInline ~2408) has no `tabindex`/`role`/`aria-label` and is driven
  only by `mouseover`/`mouseout` to reveal the footnote panel — no click, no Enter/Space, no
  `@media(hover:none)` tap fallback. Unreachable by keyboard and on touch; AT announces a bare `[1]`.
  Violates the app's own "hover-only affordances need a touch fallback" rule.
- **Violates:** P3 + touch invariant. **Target:** `role="button"`+`tabindex="-1"`+`aria-label="Footnote N"`,
  an Enter/Space + tap path opening/scrolling the panel, mirrored into the `@media(hover:none)` block.
- **Resolved:** the `fn-ref` render carries `role="button"` + `tabindex="-1"` + `aria-label="Footnote N"`; a new **`activateFnRef(key, nodeId)`** reveals + locks the footnote panel, highlights the matching entry, and scrolls it into view — wired as a content-`mousedown` branch (click/**tap**, display mode) and an `onKeyDown` Enter/Space branch, **beside** the existing hover reveal (kept for mouse). `.fn-ref:focus-visible` ring. The tap path is the touch fallback (`.fn-ref` was already in the touch-callout group). Headless-pinned.

### UXP-56 ✓ Todo state/priority picker keyboard-operable — **RESOLVED** 🟡
- **Problem:** `#bpop` is a full `role="menu"` (roving focus, Enter/Space, Esc-restore) as the bullet popup,
  but `showTodoPicker` (~8011) rebuilds it with mouse-only `<div class="tp-chip">` chips (no
  role/tabindex/keydown) and never moves focus in — so reached via the keyboard-operable bullet popup
  ("Set state / priority…"), focus is stranded on a dead picker. The capability has a keyboard door
  (`/state:`), so P3-2 holds, but the same element being a real menu in one mode and dead in another is P1.
- **Violates:** P1 / P3-1. **Target:** give the chips the `role`/`tabindex`/keydown the bullet popup already
  applies; move focus in when entered from the keyboard.
- **Resolved:** the `.tp-chip`s carry `role="menuitemradio"` + `tabindex="-1"` + `aria-checked` + `aria-label` (priority chips `aria-disabled` without a keyword); the **shared `#bpop` keydown handler now navigates `.tp-chip`** too (Arrows/Home/End/Enter/Esc — the same handler the bullet popup uses); `showTodoPicker` moves focus to the current (or first) chip and sets `bpopReturnFocus` so Esc restores focus to the point; `.tp-chip:focus-visible` ring. The same `#bpop` element is now a real menu in **both** modes (P1). Headless-pinned (role/tabindex/aria-checked; focus-in; ArrowDown roving; Enter applies).

### UXP-57 ✓ No `Shift+Arrow` point selection (P1/P3) 🟡 — **RESOLVED**
- **Problem:** the §3 "Shift = extend" law and the multi-select capability have **no keyboard door between
  points** — `rangeSelectTo` is reachable only from shift-**click**; `onKeyDown`'s arrow branches require
  `!e.shiftKey`. Keyboard users cannot grow a multi-point selection.
- **Violates:** P1 (Shift extends *everywhere except* between points) / P3-2. **Target:** `Shift+↑/↓` branches
  that, at the caret's first/last line, blur + `rangeSelectTo(prev/next)` from the current point as anchor.
- **Resolved:** Global keydown handler (`activeContentId == null`, `!ctrl`, `!alt`) intercepts `ArrowUp/Down`.
  **Plain Arrow**: moves `selFocusId` to the next/prev row via `flatRowStep(fromId, dir)`, scrolls it into
  view, applies `.node-cursor` highlight (subtle accent tint + outline). **Shift+Arrow**: fixes `selAnchorId`
  at the starting position (inherits the last-edited node via `enterEdit`) and extends to `nextId` via
  `rangeSelectTo` — identical model to shift-click. `selFocusId` is a new module-level cursor variable;
  `clearSelection` resets it; `updateSelVisuals` toggles `.node-cursor` on the cursor row (suppressed during
  editing and when a selection is active). Existing Delete/Escape/Tab/Ctrl+C/X on `selectedIds` are unchanged.
  Pure core `flatRowStep(id, dir, rows?, idx?)` is testable and pinned (5 cases). INPUT guard prevents
  conflict with search box. 6 new tests, 562/562 pass.

### UXP-58 ✓ Native `alert()` for workspace/file errors (P4 channel) 🟡 — **RESOLVED**
- **Problem:** ~9 sites surfaced errors via native `alert()` — un-themed, unannounced.
- **Fix:** `flashError(msg)` error-tone toast (same `#flash-hint` channel, `--bad` tint, 5s dwell,
  click-to-dismiss, `announce()` for AT). All nine `alert()` call sites replaced. No `.AbortError`
  guard logic changed.

### UXP-59 ✓ In-document search has no zero-results empty-state (P4) 🟡 — **RESOLVED**
- **Problem:** a query matching nothing blanked `#outline` — indistinguishable from a breakage.
- **Fix:** `render()` injects `<div id="search-empty">` (hidden by default) into `#outline` and shows it
  when `searchQuery && flatRows.length === 0`. Copy: "No points match 'q' — Esc to clear" ("…in this
  note…" variant when a workspace folder is connected). CSS: `#search-empty` inherits `--muted` and
  is centered under the outline's max-width.

### UXP-60 ✓ Enter doesn't split the point at the caret (P1 — product decision) 🟡 — **RESOLVED**
- **Problem:** `insertSiblingAfter` ignored the caret — Enter mid-text dropped an empty sibling and **orphaned
  the trailing text** on the original point. Every peer outliner (Workflowy/Logseq/Roam/Notion/Dynalist)
  splits at the caret; this was the most surprising deviation a new user hit. (§3 says "Enter = new point"
  but doesn't pin split-vs-append, so not a literal violation — a strong P1 expectation gap.)
- **Decision (split):** when the point is actively being edited and the caret has a **trailing half**, that
  half moves to the new sibling; the leading half and any **children stay on the source** (peer-standard).
  An empty trailing half (caret at end) falls through to the prior **empty-continuation append**, so the
  no-active-edit / programmatic paths (ghost-row) are unchanged.
- **Fix:** pure core `splitForSibling(text, offset, contPrefix) → {before, after}` (leading half + the
  continuation-prefixed trailing half, so a split to-do/quote stays one). `insertSiblingAfter` mirrors
  `applyInlineReplace`'s fold dance: capture the unfolded caret, `blur()` to commit (refold + promote +
  prune → folded text), then `foldedOffsetFor` translates the offset — which **snaps the caret out of any
  unfolded `{…}` pill** (never severs a working artifact) and absorbs promotions. Sidecars are cloned whole
  onto the new half (`cloneArtifactSidecars`) and each node's `pruneArtifacts` sheds the other half's
  orphaned records (clone-both-then-prune). Caret lands at the start of the new half's body
  (`focusNodeAtOffset`). `pruneArtifacts` is extracted and reused by `exitEdit`. **No new syntax (P5).**
  Pinned: 8 `splitForSibling` cases (caret-at-start/mid/end, to-do + quote continuation, inside-prefix,
  clamping, null-tolerance) + a wiring pin; headless-verified plain/to-do/children/caret/undo and both
  inline-unfolded (dice) and atomic (markov) artifacts moving with their sidecars.

### UXP-61 ✓ Bottom-docked panel shadows invisible in dark mode (design-language) 🟢 — **RESOLVED**
- **Problem:** `#fn-panel` / `#bl-panel` / `#var-panel` used a hardcoded `box-shadow:0 -4px 24px
  rgba(0,0,0,.08)` — vanishing on the dark `--bg`. The `--sh-1/2` tokens are *downward* (positive Y), so a
  blind swap would point the shadow the wrong way.
- **Fix:** a new theme-aware **upward** shadow token `--sh-up`, dual-homed across all four palette homes
  (light `:root` = `0 -4px 24px rgba(45,35,25,.10)`; dark `@media` + the `applyTheme` forced-dark string =
  `0 -6px 28px rgba(0,0,0,.5)`, the §3 "dark shadows stronger + black" rule; forced-light string mirrors the
  light value). The three panels use `box-shadow:var(--sh-up)`. Verified in dark mode + the forced-dark toggle
  (the dual-home check) — the slide-up elevation cue is visible again.

### UXP-62 ✓ Agenda Calendar grid diverges from the date-picker grid (P1/P3) 🟢 — **RESOLVED**
- **Problem:** two `role="grid"` calendars behaved differently — `buildDatePicker` wrapped weeks in
  `role="row"` and supported PageUp/PageDown month nav; the agenda `renderAgendaCalendar` appended cells
  directly to the grid (no `role="row"`) and handled only Arrows/Home/End.
- **Fix:** brought `renderAgendaCalendar` to parity. `paint()` now groups the 42 cells into six
  `.agc-week` `role="row"` wrappers (`.agc-week{display:contents}`, mirroring `.cal-week` so the CSS grid is
  untouched). PageUp/PageDown page the month (`navMonth(±1)` repaint) and restore focus to the same 42-cell
  slot in the new month. Verified: 6 `role="row"` weeks × 7 cells; PageDown June→July, PageUp July→June.

### UXP-63 ✓ Pill body-click semantics diverge without a signal (P1) 🟢 — **RESOLVED (recorded P1 carve-out)**
- **Problem:** body-click means **re-roll** (dice/grammar/markov/est/pick-var), **edit** (math/formula-var/
  seq-pill), or **advance** (deck) — three outcomes for one gesture, partially documented but not *signaled*.
- **Disposition:** mostly an accepted design tension (a deterministic pill has nothing to reroll; a deck
  advances by design). **Target:** record an explicit P1 carve-out and ensure each pill's `title`/`aria-label`
  states its click outcome (most already do — verify completeness).
- **Stronger target (independent convergence — recorded, not overriding the disposition above):** a
  separate interaction-coherence audit — *blind to this register* — reached the **same finding**
  independently and argued for a structural fix that also serves the **sighted** user (the
  aria-label-only target serves AT, not visual predictability). Approach: a pure, pinned
  **`interactionClass(type)` → `'generator' | 'reference' | 'navigator' | 'structural'`** consumed by
  **both** the pill renderers (one shared *visual* re-roll cue across every generator) **and** the
  content `mousedown` dispatch (the class's action) — so a generator can't be added without the
  cue/behavior and a reference can never re-roll. Two blind passes converging here is a fair argument
  that the lighter target under-serves predictability; **pursue if a shared visual cue is later
  wanted**, weighed against the project's deliberate-distinct-pills philosophy (deck-no-pencil,
  links-as-text). *(Source: the June 2026 interaction-coherence audit; its other findings were
  already covered by UXP-40…67 or declined — see the audit eval thread.)*
- **Resolution (the lighter target — the `interactionClass` refactor stays deferred per the disposition above):**
  the three sanctioned outcomes are now an **explicit P1 carve-out** in `ux-discipline.md` §7.2 — generators
  re-roll/re-sample · computed + declarative pills (math, formula var, display-only var, sequence) edit · a
  deck advances — *outcome by pill family, by design*. The label audit closed the only two gaps where the
  action lived in `title` but not `aria-label`: the normal **math pill** and the resolved **display-only var
  pill** `aria-label`s now end "— click to edit" (dice, grammar, markov, deck, estimate, random-pick var,
  formula var and the sequence pill already named their outcome). Every functional pill now states its click
  outcome to **both** sight (`title`) and AT (`aria-label`).

### UXP-64 ✓ Workspace-search snippet rarely reveals *why* a row matched (P4) 🟢 — **RESOLVED**
- **Problem:** snippet was always the title slice — hits on notes, properties, or `is:`/`due:` showed
  the title only, with no indication of why the row matched.
- **Fix:** `searchSnippet(node, terms)` pure core (Node-testable, 11 pinned assertions). Text/tag hits:
  window ~120 chars around the first needle hit, ellipsized. Structural hits: `key: val` for
  `prop:`/`has:`, `is:<value>` for `is:`, `due: <val>`/`start: <val>` for date terms. Fallback:
  title slice (previous behaviour). Wired into `searchWorkspace` — `snippet: searchSnippet(n, terms)`.

### UXP-65 ✓ Saved-search / workspace-result chips are full Tab stops (P3/P1) 🟢 — **RESOLVED (documented deviation)**
- **Problem:** `renderSavedSearches` chips and `renderWorkspaceSearchResults` rows use `tabindex="0"`, while
  every other in-content chip/pill is deliberately `tabindex="-1"` (roving, not a Tab stop).
- **Resolution (option B — recorded carve-out, no code change):** the `#search-hint` panel is a **transient,
  focus-shown** surface (present only while the search box has focus, dismissed on Esc/blur) holding a small,
  bounded set of already-labeled, keyboard-operable controls. Tabbing from the search box through them is
  reasonable; the panel is a **sanctioned transient Tab-group**, now documented in `ux-discipline.md` §3
  alongside the other recorded exceptions. (Option A — `-1` + arrow-roving across two chip groups wired
  through the search input — is disproportionate effort + input-conflict risk for a 🟢 nit, and is not
  pursued.) `:focus-visible` rings are kept as-is.

### UXP-66 ✓ Gantt/calendar urgency is color-only on the bars/items (P3-4) 🟢 — **RESOLVED**
- **Problem:** Gantt bar / calendar item-chip urgency was carried purely by background/border colour — a
  colour-blind sighted user couldn't distinguish an overdue item from an upcoming one (the date *chips* and
  the `aria-label` already convey urgency in text).
- **Fix:** a pure, pinned helper `urgencyMark(state)` → `'! '` for `overdue`, `''` otherwise (the critical
  state only, so the cue stays meaningful). Prefixed onto the visible text of **both** surfaces — the Gantt
  name (left column, paired with its bar) and the calendar item-chip — so an overdue item reads `! Title`.
  The marker is visual-only (the elements' `aria-label` already states urgency, so no double-announce).
  Verified: overdue items marked, non-overdue unmarked, on both the Gantt and the calendar.

### UXP-67 ✓ Polish cluster — minor P1/P3/visual nits 🟢 — **RESOLVED (batch 5; Backspace merge-up split to UXP-68)**
A grab-bag of small, independent items from the audit (low priority; each a one-line-ish fix):
- **Code-block Enter friction:** inside a `code` node every newline needs Shift+Enter (Enter ejects to a
  sibling) — conformant by the standard, but undocumented; advertise it in the `/code` menu `desc` (P2-2).
- **Base `Ctrl+Enter` divergence:** commits the cell edit in a base but zooms everywhere else — an
  undocumented per-block-type meaning for a reserved chord (P1).
- **No Backspace merge-up:** Backspace at offset 0 of a non-empty point does nothing (defensible P1-4 guard,
  but a peer-outliner expectation gap — decide deliberately).
- **Collapse/expand + collapse-to-level not in undo** — they `markDirty()` (persist to OPML) but no
  `pushUndo()`; a "collapse to level 1" on a big tree can't be undone (decide: view-state vs undoable).
- **Menus lack `aria-controls`/`aria-owns`** on the contenteditable that owns `aria-activedescendant`
  (`/`,`@`,`{`,`#`,`[[`) — some SRs won't associate the active option (P3).
- **Check chip same `⚠` glyph** for both fail and error (distinguished by colour + text only — conformant
  via text, but easy to confuse at a glance; consider a distinct error glyph).
- **Divergent `.sh-row kbd` keycap recipe** (flat, `--bg`, no 2px ledge) vs the canonical keycap (§4 "one rule").
- **Search `mark` is screen-yellow** (`rgba(255,200,0,…)`) not the warm `.md-hl` highlighter (§4 micro-layer).
- **`accent-color:var(--acc)` not set** on native controls (the §3 dual-home native-control invariant) —
  verify whether any native checkbox/range is actually used before fixing.
- **Missing-data pill glyphs inconsistent** across families (raw emoji fallback vs the FA family icon) — cosmetic.

**Resolution (batch 5) — per item:**
- **Code-block Enter friction** ✓ — the `/code` menu `desc` now advertises "Shift+Enter adds lines (Enter exits to a new point)" (P2-2).
- **Base `Ctrl+Enter` divergence** ✓ — sanctioned carve-out: in a base (`role=grid`) the chord commits the cell/header edit (grid-cell convention, cf. Table `Enter`). Recorded in `ux-discipline.md` §3 + an inline comment at the handler.
- **Menus lack `aria-controls`/`aria-owns`** ✓ — the `/`·`@` (shared), `[[`, `{`, `#` owners now set `aria-controls` to their listbox (`slash-menu-list`/`lp-menu`/`brace-menu`/`tag-menu`) beside `aria-activedescendant`, removed on close — matching the tree-picker's existing `aria-controls="tp-list"`.
- **Check chip same `⚠` glyph** ✓ — error now distinct: pass `✓` · fail `✗` · error `⚠` (colour + text + glyph all carry the verdict).
- **Divergent `.sh-row kbd` keycap** ✓ — adopts the canonical recipe (`--hbg` fill + 2px bottom ledge), the §4 "one keycap rule".
- **Search `mark` screen-yellow** ✓ — now the warm `.md-hl` highlighter (`color-mix` `#e2c044` light / `#caa53d` dark), light + dark homes.
- **`accent-color` on native controls** ✓ — verified **no action needed**: the app's only native form control is `.md-task-check`, which already sets `accent-color:var(--acc)`; no native checkbox/range/radio lacks it.
- **Collapse/expand + collapse-to-level not in undo** ✓ — **deliberate decision: collapse is view-state, not undoable** (the common outliner model; keeps the undo stack content-only). Recorded carve-out, no code change (the UXP-65 option-B pattern).
- **Missing-data pill glyphs inconsistent** ✓ — cosmetic, accepted as-is: a degraded **no-record** marker (the sidecar is gone), not an interaction surface; not worth an FA-subset rebuild.
- **No Backspace merge-up** → **split to UXP-68** — the one genuine **P1 behavior change** in the cluster, taken out of "polish" and tracked as its own owner decision (see below).

### UXP-68 ✓ Backspace at offset 0 merges the point upward (P1) 🟡 — **RESOLVED**
- **Problem:** Backspace at offset 0 of a **non-empty** point is a no-op (a defensible P1-4 data-safety guard). Every peer outliner (Workflowy/Logseq/Roam/Dynalist/Notion) **merges the point into the previous one** — the inverse of UXP-60's caret-split — so a new user reads the no-op as a bug.
- **Why split from UXP-67:** this is a core-keyboard behavior change, **not** polish — the same P1 product-decision class as UXP-57/60, so it takes the owner's explicit call before build rather than riding in on a grab-bag batch.
- **Fix:** pure core `mergeUpText(prevText, body)` → `{text, offset}` — joins **flush onto the target's last content line** (trims a stray trailing blank line on the target and a leading one on the body at the seam, so a parent point's filler `\n` never pushes the body to a spurious second line) + the folded join offset; 8 pinned cases — drives `mergeUpInto(id)` — the reverse of `insertSiblingAfter`'s fold dance: target = the previous visible point (`lastVis` of the prior sibling, else the parent — `deleteNode`'s focus model); `blur()` commits the active edit (refold + promote + prune → folded text); the merged-in body is `textForDisplay(node)` (prefix/marker stripped, folded tokens preserved); the point's children reparent onto the target; sidecars merge via `mergeArtifactSidecars` then `pruneArtifacts` sheds orphans; the caret lands at the join via `unfoldedPrefixLen(target, oldPrevText)`; one `pushUndo`. Gated on a collapsed caret at offset 0 **in edit mode**; declines at the first point or into a base/code block. A source wiring pin guards the structure; recorded in `ux-discipline.md` §3.
- **Disposition:** greenlit by the owner (2026-06-16) and shipped — peer-standard, the symmetric partner to the UXP-60 Enter-split.

---

### UXP-69 ✓ Inline-argument verbs (`/verb:value`) — keyboard-first scheduling (P2/P3/P4) 🟢 — **RESOLVED**
- **Problem:** typing `due:tomorrow` in a point produced no date, no chip, no error. Dates are properties set only via the Schedule dialog; there is no inline text→property promotion; and `due:` is a search-only operator (the UXP-20 "zero new authoring syntax" decision). A plausible input was swallowed silently (P4 violation + false affordance) — and, more broadly, several dialog-only verbs had **no keyboard-complete path** (P3 gap): you could open the door but not fill it without the mouse.
- **Decision (instead of inline text syntax):** bridge through the **existing `/` door**, not a new text sigil. `/due:value` / `/start:value` set the date inline and skip the dialog; a bare `/due` still opens it. This adds **no §2 syntax-inventory entry** and does not touch the `due:` search operator, so UXP-20 stands.
- **Fix:** pure core `parseDateSlash(query)` → `{key, raw} | null` (null for a bare verb → dialog fallthrough); `checkSlash` widened to capture an optional `:value` **gated to the arg-verbs only** (a colon on any other verb stays plain text — `/quote:x` keeps `:x`), with the strip **pinned to the trigger position** so a trimmed query never mangles surrounding text; `slashApply` validates via `parseDueDate`, flashes on a bad value (P4), and writes through the shared `setDateProp` (now used by the dialog too). `start` aliases the single `due` Schedule command. Discoverability: slash desc/example + the concept-guide Dates entry. 8 pinned `parseDateSlash` cases incl. the non-arg-verb-with-colon gate.
- **The reusable rule (the durable output):** any dialog-only verb can gain a `/verb:value` fast path to become keyboard-complete — a real P2/P3 win — **but the shared slash parser MUST be widened narrowly**: gate the `:value` arm to the opted-in verb, trigger-pin the strip, dialog on a bare verb, P4 on a bad value, value-parse a pure `null`-on-miss core. Codified as the binding contract in `ux-discipline.md` §7.1a + a §3 grammar row; mirrored into the always-loaded `CLAUDE.md` UX invariants and the `adding-an-artifact.md` step-8 note, so the next verb follows it by default rather than re-discovering the `/quote:x` footgun.
- **Disposition:** shipped (PR #163); the cross-cutting guideline baked into the standard so it applies to every future inline-argument verb.

---

### UXP-70 ✓ No touch front door for indent/outdent (P3) 🟢 — **RESOLVED**
- **Problem:** on a phone/tablet there was **no way to change a point's nesting depth** — the entire point of an outliner. Indent/outdent existed only via `Tab`/`Shift+Tab` (no touch keyboard equivalent) and the multi-select bar's Indent/Outdent buttons (multi-select is started by Shift+click / Shift+arrows, which touch can't trigger). HTML5 drag, the mouse reorder path, is explicitly disabled on touch (`bullet.draggable = !IS_TOUCH`), and the bullet long-press menu offered Move up/down but **not** indent/outdent. So touch users could reorder siblings but never re-nest. The conformance matrix's "move / indent" row read ✅ for touch, **overstating** coverage by conflating move (which had a path) with indent (which didn't).
- **Decision:** enhance the **drag** gesture rather than add popup buttons (the requested direction, and the gesture every peer outliner uses). Since HTML5 drag never fires on touch, add a **pointer-based touch drag** on the bullet: hold still → the existing menu; **drag the bullet sideways → pick up and drag to reorder + nest**, full parity with the mouse HTML5 drag. A vertical-first move stays a page scroll (so the gesture never steals scrolling).
- **Fix:** `attachBulletTouchGestures(bullet, node)` replaces `attachBulletLongPress` (it subsumes it). A `pointerdown` arms the 450ms menu timer; a horizontal-dominant move past 10px instead **starts a drag** (`setPointerCapture`, `touch-action:none` to stop scroll, haptic). During the drag it **reuses the mouse path's drop model verbatim** — `dropAt()` mirrors the `dragover` math (Y-45% → before/after, X-past-content-left → child), paints the same `#drop-line`/`.drop-child-hi` visuals, and `pointerup` commits via the unchanged `performDrop`/`isDescOf`. One hardening over the mouse path: a post-move touchend may emit no `click`, so `bulletLongPressed` (the trailing-click-zoom suppressor) is cleared on a 350ms timeout, else the next bullet tap gets swallowed. Single-node only in v1 (multi-select touch drag deferred — the reported gap is single-point depth). Discoverability (P2): a new concept-guide entry **"Moving and nesting points"** documents the keyboard, mouse, and touch-drag paths together (the bullet drag was previously undocumented even for mouse).
- **Disposition:** shipped. Verified under touch emulation: sideways-drag indents/outdents + reorders; hold-still still opens the menu; vertical move still scrolls.

---

### UXP-20 ☐ Syntax sprawl — standing guard (P5)
- **Problem:** the loudest symptom of the scattered direction is the steady flood of new authoring syntaxes and grammars, each invented per-feature. The architecture *encourages* it (`CLAUDE.md`: "a new token type / expression primitive fits very well"), so the pressure is structural and continuous — this guard never fully closes.
- **Violates:** P5 (one authoring language).
- **Decisions recorded (owner, 2026-06-12):**
  - **Roll tables collapsed into grammar — the first executed P5-5 subsumption.** A named
    roll table IS a one-rule grammar; the separate artifact, sidecar, dialog, and
    `entry weight`-per-line syntax are retired (legacy records migrate on load, frozen
    results preserved). The `@` menu keeps the "Roll table" door — it opens the
    table-flavored grammar dialog. The §2 inventory **shrank** by one row.
  - **`#+TBLFM:` `@row$col` stays the one formula form for BOTH static tables and bases.**
    The named-column `{= expr}` migration idea was rejected: it would split the formula
    language across the two table forms (bases named, static tables positional). Echoes
    the standing `B3` rejection below.
  - **Markov does NOT collapse.** Directed-walk semantics (`A -> B 2` = transition from a
    current state) are genuinely different from weighted alternation; the calling side is
    already unified (`{chainName}` via the typed-descriptor rule). The definition syntax
    stays.
- **Decision recorded (owner, 2026-06-13) — search queries ship as search-box operators.**
  The "Boolean tag queries" watch item below is resolved: the query language is operators
  over the **existing** vocabulary — implicit AND, `-` negation, `"a b"` phrases, `#tag`
  (the hashtag row reused, word-anchored and hierarchical, so `#thread` matches
  `#thread/torn-letter`), and `is:done`/`is:todo`/`is:note` (the one new
  field-prefix pattern, a closed set). **OR is deferred** (precedence isn't worth deciding
  until real queries demand it). **No `state:` operator** — `#KEYWORD` states are
  hashtag-shaped, so `#waiting` already filters by state. The `evalMath` route
  (`tag("x") and not done()`) was **rejected** for v1 — predicates over nodes are not math
  on numbers, and function-call syntax lives nowhere else in the app; a future `={expr}`
  per-point predicate stays reserved as the power-user escape hatch (e.g. date queries)
  and must not be foreclosed by the parser. Malformed tokens (unknown `is:` value, lone
  `-`, `#non-word`) stay **literal text terms** — the `{…}` invalid-body escape-hatch rule,
  so a query never silently matches everything. §2 inventory row added in the same change.
- **Decision recorded (owner, 2026-06-13) — progress cookies ship as the Org `[/]`/`[%]` token.**
  The watch-list item below is resolved. The `{…}`-aggregation route was **weighed and not taken
  for v1**: a cookie is not inline-composed generative content the user nests — it is a fixed
  per-point *display* summary, conceptually the sibling of `#+TBLFM:` (edit shows the recipe,
  render shows the computed value). It reuses the **`[…]` bracket authoring family** already in
  the app (`[ ]`/`[x]`, `[#A]`, `[^key]`, `[[…]]`) rather than minting a sigil, and is the
  notation every outliner/Org user already knows (P1/P2). The token is **plain text** in
  `node.text` (no sidecar, OPML round-trips for free); the count is computed at render against the
  point's own checkboxes + direct children, each checkbox counted individually and each
  keyword/sequenced child once (done-ness via the sequence-aware `todoDoneFromText`). A literal
  `[/]`/`[%]` renders as a cookie **only when the point owns tasks**, else it stays text (the
  escape-hatch rule). Front door: `@progress`. §2 inventory row + `?`-panel/menu entry added in
  the same change. The general children-aggregation primitive (`sum`/`count`/`avg` via `evalMath`)
  remains the separate, still-`{…}`-routed feature — cookies did not foreclose it.
- **Two live examples to police now** (both in `roadmap.md`):
  - a proposed **render-only `{= expr}` / `{NdM}` second syntax** "alongside `[[type:key]]`" → **P5-3 violation** unless it *replaces* the existing path; route it through the `{…}` engine, don't add a parallel one.
  - possible **`B3`-style table references** beside `@row$col` → reject; `@row$col` is "the one true form."
- **Forward watch list (June 2026)** — the planned roadmap/backlog features that carry P5 risk, with the conformant route decided *before* build, not during:
  - **Cross-file links `[[docId#nodeId|label]]`** (Phase 2 step 5) — an *extension of an existing inventory row* (the node-link token grows a doc-id segment), not a new delimiter. Conformant via P5-5 (subsume, don't sibling) — but it is still an inventory-row **edit** and must be recorded in §2 + the `?` panel in the same PR (P5-4), not slipped in as a side effect.
  - ~~**Dates + agenda** (backlog Tier 1)~~ — **decided + shipped 2026-06-13**: the P5-gated decision is that dates live as a `due` **property** (`node.props`, value `YYYY-MM-DD` or relative `today+N`) — zero new authoring syntax, reuses the existing properties system. The `due:` search operator is a date-aware extension of the existing `key:value` operator family (not a new family). Inventory row added to `ux-discipline.md` §2. Front doors: `/due` slash verb, bullet menu, Agenda panel (toolbar). Org's `<2026-06-12 Wed>` / `SCHEDULED:` notation NOT imported.
  - **Aggregations over children** (roadmap generative ideas) — the roadmap sketch says "a new token type"; the UXP-20-preferred route is an `evalMath` primitive or `resolveBrace` branch (e.g. a children-scope function) so it rides `{…}`. A new token type needs the explicit-decision path.
  - ~~**Progress cookies `[2/5]` / `[40%]`** (backlog)~~ — **decided + shipped 2026-06-13** (see the decision record above): the recorded-decision path was taken — the Org `[/]`/`[%]` cookie, reusing the `[…]` bracket family as a computed display value (no sidecar), with `@progress` as the front door. The `{…}`-aggregation primitive stays a separate future feature.
  - ~~**Properties / per-node metadata** (backlog)~~ — **shipped**: `node.props = [{key, val}]` sidecar, dialog editor (bullet menu + chip click), `has:key`/`key:value` search operators, chips below the note row. No new authoring syntax — dialog-only editing, no typed sigil.
  - ~~**Boolean tag queries** (backlog "Tag power")~~ — **decided + shipped 2026-06-13** (see the decision record above): search-box operators over the existing vocabulary, with the focus-shown legend + `?` panel as front doors.
  - **Oracle / decks / bags** (roadmap generative ideas) — conformant by construction *if* they register as grammar-engine callables the way markov does (`{name}` resolution via a typed descriptor in `collectRules`); flag any version that wants its own inline notation.
- **Audit recorded (owner, 2026-06-16) — inventory↔parser reconciliation.** A full sweep of the authoring entry points (inline `mdInline`, block `mdToHtml`, the `/` + `@` menus, the `{…}` grammar forms) found the closed §2 inventory under-documented the **Markdown family**: inline links/images/autolinks, GFM pipe tables, and definition lists shipped but were absent from the inventory and (most) from the `?` panel; `[text](url)` was in the `?` panel but not the inventory, and `++` underline the reverse. **Resolved (documentation only):** the §2 Markdown row + the `?` panel **Format (markdown)** section now list the full CommonMark/GFM surface the renderer ships — standard markdown, no app-specific syntax, no sign-off needed. **No new sprawl and no subsumption to execute** were found elsewhere (every other typeable form maps to a row; the roll-tables→grammar collapse already did the one available subsumption). A P5-4 completeness fix, not a P5-1 growth — the guard holds.
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
- **Addendum (Sequences MVP):** the hardcoded keyword set is gone — **user-configurable state sets shipped** as *sequences*. The built-in `TODO NEXT WAITING | DONE` is the default sequence; `@sequence` declares more (a `[[seq:key]]` pill, `collectSequences` document-wide); `/` applies any sequence's states; the badge renders only for a keyword that is a state in *some* sequence (a random capitalized word no longer matters), and done-ness derives from the keyword's side of its sequence's `|`. Zero new syntax — `@` declares, `/` applies, the keyword sits in the text exactly as before (see the P5 inventory note in `ux-discipline.md` §2).
- **Addendum (#STATUS syntax):** the status syntax now requires a `#` prefix (`#TODO body` instead of `TODO body`). Bare ALL-CAPS words are never status badges — only `#KEYWORD` is. This eliminates the false-positive risk (a capitalized word in body text accidentally becoming a badge). `#word` that is not a known state remains a normal clickable hashtag. Old bare-keyword saves are deliberately NOT migrated (a load-time rewrite would also capture plain prose typed after the change, re-introducing the false-positive); pre-release, they simply become plain text — retype as `#KEYWORD` if meant as statuses.

### UXP-25 ✓ `ol` ordinals render from the type, not the text (markdown-first) — **RESOLVED**
- **Problem:** a numbered point's ordinal came from `node.type === 'ol'` + sibling position; the text carried no `1.` — the same type-as-renderer pattern UXP-24 retired for to-dos.
- **Violated:** P1/P2 (markdown-first node model — only `paragraph` and `base` are special types).
- **Decision (owner, 2026-06-12): markdown-lazy numbering.** The text carries a literal `N.` prefix; *any* `N.` marks list-ness, and the **display renumbers visually** regardless of the literal value. No sibling-text rewriting on insert/move/delete; the text round-trips as valid markdown.
- **Resolved:** `deriveTypeFromText` now returns `'ol'` when the first line matches `OL_RE` (`\d+\.\s+`). `migrateNodePrefixes` writes `'1. '` into legacy `_type="ol"` nodes whose text lacks the prefix (same load-time migration pattern as divider/todo). `continuationPrefix` returns `'1. '` for any ol item so Enter continues the list. `applyBlockCmd` writes `'1. '` when converting to ol and strips `N. ` when converting away (parallel to the divider/todo handling). `renderContentHTML` for `type === 'ol'` strips the `N. ` prefix before passing the body to `mdToHtml`; the `.ol-num` DOM span (from `olNum()`) supplies the position-based visual ordinal — so the display renumbers correctly regardless of the literal prefix. The three `deriveTypeFromText`-fallback paths (normal `exitEdit`, zoom-title exit, undo restore) all include `'ol'` in the "revert to ul" branch. Pinned: `deriveTypeFromText`/`continuationPrefix`/`textForDisplay` pin, migration pin (adds prefix / leaves existing prefix alone).

### UXP-26 ✓ `divider` is type-only and destroys its text — **RESOLVED**
- **Problem:** typing `---` converted immediately (`checkMdBlockPrefix`) and **cleared `node.text`**; worse, `/divider` on a content-bearing point **erased its text outright** (`node.text = ''`) — real data loss, same family as UXP-23. The render depended wholly on the type flag. The audit also found the divider's **section-label feature was unreachable**: the hover reveal was gated on `node.text` being non-empty, but every creation path cleared the text — a built-but-dead capability.
- **Violated:** P1/P2 (markdown-first), P4 (the typed source and converted content were silently discarded).
- **Resolved (text model: first line = thematic break, lines below = label):** `deriveTypeFromText` now derives `divider` when the **first line** matches `HR_RE` (`---`/`***`/`___` — the same rule `mdToHtml` renders `<hr>` from), so the type is a derived hint like headings. Typing a break keeps it in `node.text` (still converts immediately — the divider row hides its content element, so staying in edit isn't useful — but nothing is erased). `/divider` is now **non-destructive**: existing content becomes the section label below the break (`---\ncontent`). Converting *away* strips the break line (like to-do markers); deleting the break in raw edit demotes to a plain point with the label preserved. Legacy `_type="divider"` nodes are migrated on load (`migrateNodePrefixes` writes the break in, label kept). Side effect: the label feature is **alive again** — hover reveals the content, click edits the raw markdown (`---` + label), the same edit-raw/render-pretty model as headings. Exports now include the label. Pinned: derive forms, migration, `textForDisplay` label-only, `mdToHtml` `<hr>`.

### UXP-27 ✓ Whole-node `italic`/`underline` flags live outside the text — **RESOLVED**
- **Problem:** `node.italic`/`node.underline` were per-node formatting booleans (`nc-italic`/`nc-underline` CSS) with no markdown trace — formatting state the text can't express or round-trip.
- **Violated:** P2/P5 (formatting belongs in the one markdown language: `*…*`, etc.).
- **Decision (owner, 2026-06-12): retire both flags** (the owner accepted dropping underline outright). **Implementation improved on the decision losslessly:** the audit found `++…++` → `<u>` already in `mdInline` *and* in the selection toolbar — underline has had an in-app syntax all along — so underline migrates to `++…++` instead of being dropped; no formatting is lost and no syntax is minted (P5 holds).
- **Resolved:** the flags were pure legacy — **no live UI ever set them**; the only writer was OPML load of old files (the live path is the selection toolbar writing `*…*`/`++…++`). On load, `migrateNodePrefixes` folds them into the text via the pure `migrateEmphasisText` (per line, after any block prefix so headings/quotes/list items keep their structure; blank/fence/HR/table/recipe lines untouched; both flags nest as `*++…++*`) and **deletes the properties**. `toOpml` no longer writes `_italic`/`_underline` (the parser still reads them, feeding the migration); the `nc-italic`/`nc-underline` render classes and CSS are gone; `mkNode`/`mkRoot` dropped the fields (CLAUDE.md shape updated). Pinned: per-flag wrapping, block-prefix and structural-line handling, fence skipping, flag deletion, and a `toOpml` never-writes guard.

### UXP-28 ✓ Style bleed after an editable `.gr-src` `{name}` span — **RESOLVED** (attempt #3)
- **Problem:** in edit mode, after a completed promotable `{name}`/`{…}` the browser merged subsequently typed text *into* the trailing `.gr-src` span, so the space and following prose rendered grammar-styled. On the **picker path** (`braceApply`) the caret landed inside the span's text node, bleeding from the first keystroke; reproduction proved a caret placed *after* the span (DIV boundary) **still bled** — Chrome extends the trailing inline element on insertion — so no caret-placement fix alone could work.
- **Violated:** P4 (rendering correctness / misleading feedback — prose looks like grammar source).
- **History:** PR #45 tried a ZWSP caret-anchor after `.gr-src` spans; **reverted in #46** — verified only on manually-typed text, it made picker-applied references **undeletable** (Backspace ate the invisible ZWSP, `editableText` came back unchanged, `checkInlineHighlight` regenerated the anchor: a no-op loop). The sibling **atomic-pill** anchor (offset 0) stays — pills are immune to that loop.
- **Resolved (post-input span normalization, self-healing):** `grSrcSpanClean(text)` (pure, pinned) — a span is clean iff its text is exactly one balanced `{…}`, the only shape `highlightGrammarText` emits. `normalizeGrSrcSpans(content, node)` runs in the `input` handler: when any live span is dirty (typed/pasted chars merged past `}`, or `}` deleted), it re-renders `editModeHTML` from `node.text` and restores the caret by logical offset — the merged tail re-binds as plain prose and the caret lands outside the span. Synchronous (before paint) so the styled flash is never visible; **adds nothing to the DOM**, so every Backspace consumes a real character — the #45 loop is structurally impossible. **IME guard:** skipped while `e.isComposing` (a re-render mid-composition would drop the composed text); a `compositionend` listener normalizes on commit.
- **Verified on the mandatory bar** (picker-apply path, not just manual typing): apply → type → tail renders plain; **Backspace ×19 and forward Delete** remove the reference with progress on every press (no loop; empty-buffer placeholder is the terminal state, identical to plain text); exit/re-enter correct (promotes, unfolds bounded); simulated IME composition right after the span is **not dropped** mid-composition and normalizes on `compositionend`; dice/rolltable/markov pills round-trip idempotently and delete without sticking.

## Design and UX audit (July 2026): UXP-71…100

*A five-lens audit (design tokens, interaction, accessibility, copy, component consistency) of
`index.html` against `design-language.md`, `ux-discipline.md`, `ux.md`, `accessibility.md`, and
`concept-guide.md`. Every finding was adversarially re-verified against the quoted rule and the
cited code before entering this register; 0 of 30 were refuted. Entries marked **GAP** violate no
written rule: they record a decision the guidelines do not yet govern, and each carries the
guideline sentence to add (collected at the end of this section). Symbols are cited by name per
the repo rule; verify with grep before acting. Effort tags: (trivial) / (small).
Numbering note: first registered as UXP-70…99 (PR #280), renumbered +1 after a collision with
the pre-existing UXP-70; PR #281 cites the old numbers (its 70/78/95 are 71/79/96 here).*

**Lens: design tokens (`design-language.md`)**

### UXP-71 ✓ Forced theme misses six hardcoded dark-mode rules (DL §3 dual-home) 🔴 (RESOLVED: PR #281)
- **Problem:** `.node-row:hover`, the `[data-editing]` row tint, `.md-hl`, `.mt-selected`, `mark`, and `.node-selected` each pair a light-mode literal with a `@media(prefers-color-scheme:dark)` override, but `applyTheme` rewrites only custom properties (no class or attribute toggle), so under a forced theme (OS-light + in-app Dark) none of the six dark variants ever apply: row hover degrades to a near-invisible black wash and the highlighter keeps its light hue.
- **Rule:** DL §3, "the palette lives in two homes; change both or neither".
- **Target (small):** promote each pair to dual-homed tokens (`--row-hover`, `--hl`, the selection/edit tints) declared in `:root`, the dark media query, AND both `applyTheme` strings; the six rules reference only tokens. Verify with the §6 forced-theme screenshot (OS-light + in-app dark).

### UXP-72 ✓ `#edit-bar` keeps a hardcoded cold-black upward shadow (DL §3/§4) 🟡 (RESOLVED: batch V2)
- **Problem:** `#edit-bar` ships `box-shadow:0 -2px 10px rgba(0,0,0,.06)`: not warm in light, invisible on the dark `--bg`, never swaps per theme, and a fourth ad-hoc shadow outside the token set. The exact defect class UXP-61 fixed on `#fn-panel`/`#bl-panel`/`#var-panel`.
- **Rule:** DL §4 shadow tokens; §3 theme-paired shadows.
- **Target (trivial):** `box-shadow:var(--sh-up)` (already dual-homed).

### UXP-73 ✓ Active toggles painted solid accent (DL §4 reserve rule) 🟡 (RESOLVED: batch V2)
- **Problem:** `.bpop-type.cur`, `.tp-chip.cur`, and `.mt-align-bar button.on` use solid `var(--acc)` fill, while the toolbar's own `button.active` correctly wears the 16%-tint recipe.
- **Rule:** DL §4, "solid accent fill is reserved for the focus outline, primary dialog actions, and the brand mark".
- **Target (trivial):** restyle all three to the tint recipe (16% accent mix background, accent ink, 35% border).

### UXP-74 ✓ Informational text below the 11px floor, one opacity-faded (DL §4/§3) 🟡 (RESOLVED: batch V2)
- **Problem:** the Gantt date readouts `.agg-today-lbl` and `.agg-hover-lbl` render at 8px; `.collapse-count` (the hidden-children count) renders at 9px AND is faded with `opacity:.6` against the role-not-failing-ink rule.
- **Rule:** DL §4, "no informational text below 11px effective (caps+tracking earns 10px for labels only)"; §4 eyebrows "never opacity-faded".
- **Target (small):** raise the Gantt labels to 10px caps+tracking or 11px plain; raise `.collapse-count` to 10-11px and replace the opacity fade with `color:var(--muted)`.

### UXP-75 ✓ Off-token border radii: 5px, 7px, 9px one-offs (DL §4) 🟢 (RESOLVED: batch V2)
- **Problem:** `.gr-src` 5px, `.fn-key` 7px, `.var-pick-card` 9px (plus a one-off 1.5px border width), `.nsb-btn` 5px; the locked set is 3/6/8/12/999.
- **Target (trivial):** map to the nearest token (`--r-sm` for `.gr-src`/`.nsb-btn`/`.fn-key`, `--r-md` for `.var-pick-card`); normalize the 1.5px border to 1px.

### UXP-76 ✓ Pill family hue registry drifted (DL §4, doc-only) 🟢 (RESOLVED: batch D1)
- **Problem:** `.est-pill{--pill:#5a4a8a}` exists in code but not in DL §4's family-hue list; the doc still lists the table hue `#5b3a6e`, which has zero code occurrences since the rolltable-into-grammar collapse.
- **Target (trivial):** update the §4 hue list: add `est #5a4a8a`, mark `table #5b3a6e` retired.

### UXP-77 ✓ Calendar day-of-week header off the one eyebrow recipe (DL §4) 🟢 (RESOLVED: batch V2)
- **Problem:** `.agc-dow span` is 10px/700/.05em; the recipe is 10px/600/.07em (conformant siblings: `.ag-rowlabel`, `.acc-row-lbl`).
- **Target (trivial):** `font-weight:600;letter-spacing:.07em`.

### UXP-78 ✓ Keycaps print two sizes: `.sh-row kbd` at 10px (DL §4) 🟢 (RESOLVED: batch V2)
- **Problem:** `.sh-row kbd` duplicates the keycap recipe at 10px against the canonical 11px rule (`.cmd-key`, `#search-key`). UXP-67's keycap item closed the fill/ledge axis; the size axis still diverges.
- **Target (trivial):** fold `.sh-row kbd` into the canonical 11px declaration.

### UXP-79 ✓ GAP: the modal scrim is one hardcoded rgba with no token or theme pairing 🟢 (RESOLVED: PR #281 + the D1 guideline sentence)
- **Problem:** `#io-back` uses a single warm-dark literal in both themes; over the dark `--bg` a 38% near-black scrim barely dims the page, so dark-mode dialogs get much weaker separation than light-mode ones. No guideline covers overlay/scrim color.
- **Target (small):** a dual-homed `--scrim` token (stronger in dark) in `:root`, the dark media query, and both `applyTheme` strings; use it on `#io-back`. Guideline sentence: see the additions list below.

### UXP-80 ✓ GAP: `font-weight:800` on the calendar today number; no written weight scale 🟢 (RESOLVED: batch V3 + the D1 guideline sentence)
- **Problem:** `.agc-cell.today .agc-dom` uses weight 800, the only text weight above 700 in the app (the 900s are Font Awesome font-selection classes). Nothing bounds UI text weights.
- **Target (trivial):** drop to 700 (the accent ink + tint plate already mark today). Guideline sentence: see below.

**Lens: interaction (`ux-discipline.md`, `ux.md`)**

### UXP-81 ✓ In-place dialog re-render clobbers `ioReturnFocus` (P3) 🟡 (RESOLVED: batch I1)
- **Problem:** `openTemplatePicker` and `openWorkspaceSwitcher` re-invoke themselves after an in-dialog action (forget a template, delete a doc) and unconditionally recapture `ioReturnFocus = document.activeElement`, which by then is a disconnected node or body; `closeIo` then restores focus to body instead of the pre-dialog element.
- **Rule:** §9 matrix "dialogs focus-trap + restore" (UXP-16); P3 keyboard operability.
- **Target (small):** capture `ioReturnFocus` only when the dialog is not already open (guard on `ioBack.classList.contains('on')`), the `wasOpen` precedent `openCaptureDialog` already uses; ideally centralize in one `openIo()` helper.

### UXP-82 ✓ Inbox-slot removal and saved-search forget: no toast, no undo (P4-3/P4-4, P1) 🟡 (RESOLVED: batch I1)
- **Problem:** `removeInboxSlot` and `forgetSavedSearch` remove doc-level config with only `markDirty()`, no `flashHint` and no `pushUndo`, while the sibling action (template Forget) does both. Same conceptual action, three behaviors.
- **Target (trivial):** add the `flashHint` confirmation to both, and `pushUndo` where the config is not trivially re-creatable, matching the template-forget pattern.

### UXP-83 ✓ Capture with empty text is a silent no-op (P4-1) 🟢 (RESOLVED: batch I1)
- **Problem:** `doCapture` returns early on empty text while the Capture button is enabled (it is only disabled when no inbox is set), so Enter or a click with an empty draft does nothing, silently.
- **Target (trivial):** disable the button while the draft is empty, or flash a brief hint through the existing cap-confirm aria-live line.

### UXP-84 ✓ GAP: Esc discards a typed capture draft, and skips the manager layer (P1-3 adjacent) 🟢 (RESOLVED: batch I2, owner call 2026-07-01: keep the draft)
- **Problem:** Esc in the capture input always calls `closeCapture()` even when the second-row inbox manager is open (one Esc collapses two layers, against the P1-3 one-layer-outward convention), and the next open wipes `captureDraft`, so a non-empty draft is lost with no warning. No guideline covers draft retention in transient input surfaces.
- **Target (small, owner call on the retention behavior):** first Esc closes only the manager; preserve `captureDraft` across close/reopen within a session, clearing it only on successful capture. Guideline sentence: see below.

### UXP-85 ✓ Gantt titles-column resize has no touch path (§7.5, CLAUDE.md touch invariant) 🟢 (RESOLVED: batch I2, owner call 2026-07-01: width toggle)
- **Problem:** `@media(hover:none)` hides `.agg-names-resize`, the only affordance for resizing the titles column, and no menu or preset twin exists in the agenda bar, so touch users cannot adjust it at all. (The base column resize is conformant because the Column menu carries Width presets.)
- **Target (small):** keep the separator visible on touch with a widened tap target and pointer-drag, or add a small width toggle (narrow/default/wide) to the agenda controls as the §7.5 twin.

**Lens: accessibility (`accessibility.md`, P3)**

### UXP-86 ✓ `#nsb-clear` has no accessible name (P3-1) 🟡 (RESOLVED: batch I1)
- **Problem:** the multi-select bar's clear button is a bare `✕` with no `aria-label` and no `title`; every sibling nsb button is text-labeled. AT hears "multiplication sign, button".
- **Target (trivial):** `aria-label="Clear selection"` (plus a matching `title`).

### UXP-87 ✓ `#search-clear` is missing its mandated aria-label (a11y Phase 0, unexecuted) 🟡 (RESOLVED: batch I1)
- **Problem:** `accessibility.md` Phase 0 explicitly instructs `aria-label="Clear search"` on `#search-clear`; the button still carries only a `title`. UXP-13's resolved list omits this control, so the doc's instruction was never executed.
- **Target (trivial):** add the label exactly as the a11y doc specifies.

### UXP-88 ✓ GAP: search filtering gives AT no result announcement 🟡 (RESOLVED: batch I1 + the D1 guideline sentence)
- **Problem:** `applySearch()` re-renders the outline with no `announce()` call, so a query matching 0 or 500 points is visually obvious but silent to a screen-reader user whose focus stays in `#search-box`. No guideline mandates filter-result announcements (P3-5 comes close).
- **Target (small):** after `render()`, announce a match count to `#a11y-live` (debounced by the existing search timer). Guideline sentence: see below.

### UXP-89 ✓ GAP: `#search-clear` stays a ~14px tap target on touch; no written tap-target floor 🟢 (RESOLVED: batch V3 + the D1 guardrail)
- **Problem:** the `@media(hover:none)` block enlarges pencils, toolbar buttons, tab closes, and nsb buttons, but never `#search-clear`, leaving a ~14px target beside a focused text field. The ~44px floor exists only as a CSS comment, in no guideline.
- **Target (small):** enlarge `#search-clear` in the `@media(hover:none)` block (padding or min-width/height 44px). Guideline sentence: see below.

### UXP-90 ✓ `#fm-dirty-dot` lacks the aria-label UXP-13 records as shipped (P3-1) 🟢 (RESOLVED: batch I1)
- **Problem:** UXP-13 claims "both dirty dots" resolved; only the toolbar `#dirty-dot` has `aria-label="Unsaved changes"`. The file-menu `#fm-dirty-dot` has `title` only: a 6px decorative span invisible to AT inside the file dialog.
- **Target (trivial):** add the aria-label, or fold the unsaved state into the adjacent `#fm-status` text AT already reads.

**Lens: copy and terminology (§1 vocabulary, `concept-guide.md`)**

### UXP-91 ✓ The document is called a "note" in the link picker and concept guide (§1, V-1) 🔴 (RESOLVED: PR #283)
- **Problem:** the `[[` picker's create row says `+ New note`, its aria-label says "Create a new note", the flash says `Created note`, and the GUIDE has "Searching all your notes" and "divide a long note into sections", all meaning the document (one `.opml`). Everywhere else says "document" (`Switch document…`, `New document "…" in the folder`).
- **Rule:** §1 canonical vocabulary: the document is a "document"; "note" is reserved for per-point notes. The vocabulary table is binding for aria-labels.
- **Target (small):** rename all five sites to "document".

### UXP-92 ✓ Agenda calendar/week aria-labels call points "items" (§1) 🟡 (RESOLVED: PR #283)
- **Problem:** the calendar's `+N` overflow and the week strip's "Earlier" aria-labels say "item(s)"; §1 bans "item" for a point.
- **Target (trivial):** "Show N more points for this day", "Earlier, N points".

### UXP-93 ✓ Concept guide cites a menu path that does not exist (`concept-guide.md` house rules) 🟡 (RESOLVED: PR #283)
- **Problem:** the GUIDE export entry's syn reads `File → Export Markdown`, but the real File menu is group "Export a copy" with the item labeled "Markdown". The house rule: verify every fact against the UI; a wrong path is worse than no entry.
- **Target (trivial):** `File → Export a copy → Markdown`; give the sibling `Web page (HTML)` example the same middle step.

### UXP-94 ✓ GUIDE export entry says "Share your outline" meaning the document (§1) 🟢 (RESOLVED: PR #283)
- **Problem:** the entry opens "Share your outline with someone…" then says "your document" later in the same body. §1 sanctions "the outline" only for the navigable tree/view.
- **Target (trivial):** "Share your document with someone who doesn't have the app".

### UXP-95 ✓ GAP: no written casing convention; "Markdown" and Title Case drift in the same menus 🟡 (RESOLVED: D1 sentence + PR #283)
- **Problem:** `Export to Markdown` vs `Edit as markdown` and `Copy as markdown` in the same bullet menu; `Save As…` (Title Case) vs sentence-case siblings (`Switch document…`, `Save as template`). No guideline covers label casing or proper-noun treatment.
- **Target (small):** normalize code to sentence case with "Markdown" always capitalized. Guideline sentence: see below.

**Lens: component consistency (DL §4, `ux-discipline.md` §7)**

### UXP-96 ✓ Error toast pairs `--bad` background with `--acc-fg` ink (DL §3) 🔴 (RESOLVED: PR #281)
- **Problem:** `flashError` sets `background:var(--bad);color:var(--acc-fg)`, but `--acc-fg` is computed against the *accent*, not against `--bad`. In dark mode `--bad` is a pastel; a deep accent (white `--acc-fg`) yields roughly 1.9:1 white-on-pastel-red on the app's error surface. The toast also hardcodes its shadow and radius off-token.
- **Rule:** DL §3 (`--acc-fg` exists precisely to prevent this class of pairing; new color pairs ship with their WCAG ratio); §4 token systems.
- **Target (small):** a `--bad-fg` twin computed in `applyAccentCSS`/theme strings (both palette homes), or restyle the toast to the badge recipe (16% `--bad` mix + `--bad` ink on the neutral toast surface); move shadow/radius onto `--sh-1`/`--r-md`.

### UXP-97 ✓ Close/dismiss buttons: two glyphs and five bespoke recipes (DL §1 corollary, §4) 🟡 (RESOLVED: batch V3)
- **Problem:** dismiss renders as `✕` (`#search-clear`, `#var-panel-close`, `#storage-warn-close`, saved-search chips), `×` (`.doc-tab-close`, `.cap-close`, `.guide-close`), and `fa-xmark` (via `setIcon`), with five divergent recipes including `.guide-close`'s `border-radius:50%` (outside the radius set). One concept, many faces.
- **Target (small):** one dismiss glyph (`fa-xmark` through `setIcon`, `✕` fallback per the icon policy) and one shared `.close-btn` recipe (muted ink, `--fg` on hover, `--r-sm`); drop the 50% radius. Guideline sentence: see below.

### UXP-98 ✓ GAP: the workspace-conflict dialog leads its footer with the danger button 🟡 (RESOLVED: batch I2, owner call 2026-07-01: reorder danger-last)
- **Problem:** the conflict footer appends `Keep my version` (`io-btn danger`) first, while `confirmDialog` and every other builder place dismiss/neutral first and the committing (or danger) action last. A code comment ("Primary first") shows the inversion was deliberate, so the rule needs writing either way.
- **Target (trivial, owner call):** reorder danger-last to match `confirmDialog`, or record the stacked-layout exception. Guideline sentence: see below.

### UXP-99 ✓ GAP: three row paddings for the same `.cmd-item` role 🟢 (RESOLVED: batch V3 + the D1 guideline sentence)
- **Problem:** base `.cmd-item` 6px 10px, `#slash-menu` 5px 8px, `#file-menu` 7px 9px; the touch block diverges the same way. DL §4 unifies the hover language but nothing governs row metrics.
- **Target (trivial):** collapse to the base padding and delete the overrides, or record the per-menu density as a decision. Guideline sentence: see below.

### UXP-100 ✓ Concept-guide nav tints are off-recipe (DL §4) 🟢 (RESOLVED: batch V2)
- **Problem:** `.guide-nav-btn.active` uses a 12% mix with no 35% border (vs the canonical 16%+35% worn by `button.active` and `.doc-tab.active`), and its hover uses 6% vs the 10% menu-hover language.
- **Target (trivial):** adopt the canonical recipes, or record the quieter nav variant as a DL decision.

### Proposed guideline additions (the gap half, one docs PR)

Each GAP above proposed one sentence; all ten shipped to the guidance docs in batch D1.
Kept as the cross-reference:
1. **DL §3 (scrim):** "Modal backdrops use the one `--scrim` token (warm-dark in light, deeper black in dark, dual-homed like every theme token); no other full-screen darkening value may be introduced." (UXP-79)
2. **DL §2/§4 (weights):** "UI text weights come from the set 400/500/600/700; nothing renders text heavier than 700 (icon-font weight classes exempt)." (UXP-80)
3. **`ux-discipline.md` §6 (drafts):** "A transient input surface (capture strip, search box) MUST NOT discard a non-empty draft on dismiss; the draft is kept for the next open or its loss is confirmed." (UXP-84)
4. **`accessibility.md` (filter announcements):** "Any action that filters or re-populates the visible outline without moving focus must write a short result summary (e.g. a match count) to `#a11y-live`." (UXP-88)
5. **`accessibility.md` (tap targets):** "Under `@media(hover:none)`, every tappable control must present at least a ~44px hit area; the visual box may stay smaller as long as padding or an overlay extends the target." (UXP-89)
6. **`ux-discipline.md` §1 (casing):** "Menu, button and dialog labels use sentence case (capitalize only the first word and proper nouns); 'Markdown' is a proper noun and is always capitalized in user-facing copy." (UXP-95)
7. **DL §4 (close buttons):** "Dismiss/close buttons share one recipe and one glyph (`fa-xmark`, `✕` fallback) everywhere; a panel may not mint its own close styling." (UXP-97)
8. **`ux-discipline.md` §7 (footer order):** "Dialog footers order buttons dismiss/neutral first, the committing action last; a danger action always occupies the final slot, never the first." (UXP-98)
9. **DL §4 (menu rows):** "`.cmd-item` rows share one padding in every menu; a menu adopts the shared row metrics rather than restyling them." (UXP-99)
10. **DL §4 (hue registry):** fold in UXP-76's registry fix (add `est #5a4a8a`, retire `table #5b3a6e`).

### Suggested closing batches (UXP-71…100)

- **Batch V1, theme plumbing (the 🔴 visual pair + its dependents):** UXP-71, 78, 95. One PR: introduce `--row-hover`/`--hl`/selection-edit tints, `--scrim`, `--bad-fg` across `:root`, the dark media query, `applyTheme`, and `applyAccentCSS`; verified with the §6 forced-theme screenshots and stated contrast ratios.
- **Batch V2, CSS recipe one-liners:** UXP-72, 72, 73, 74, 76, 77, 99. Pure CSS, screenshot-verified in both themes.
- **Batch C1, copy strings:** UXP-91, 91, 92, 93 (+ 94's code half). String edits only; includes the 🔴 vocabulary defect.
- **Batch I1, small-JS interaction + a11y:** UXP-81, 81, 82, 85, 86, 87, 89. Additive JS/attributes.
- **Batch D1, docs:** the ten guideline additions above + UXP-76. `UI: none`.
- **Owner calls before build (the UXP-57/68 precedent):** UXP-84 (draft retention), UXP-85 (which touch twin), UXP-98 (footer order was deliberately inverted).

---

### Post-audit findings (July 2026)

### UXP-101 ☐ No live `prefers-color-scheme` listener: an OS theme flip leaves accent tokens stale (DL §3) 🟡
- **Problem:** `applyTheme`/`applyAccentCSS` run at boot and on the in-app theme button, but nothing subscribes to `matchMedia('(prefers-color-scheme:dark)')` changes. With the theme on System, flipping the OS theme live updates the CSS media-query home instantly while the JS-computed accent tokens (`--acc`, `--acc-fg`, `--ring`, `--bullet-h`, `--qbdr`) keep their previous-theme values until a reload or a theme-button touch: the light indigo and white `--acc-fg` ink persist into dark, degrading contrast on every accent surface app-wide (found during the capture designer pass, PR #290; not capture-specific).
- **Rule:** DL §3, the dual-home invariant's runtime spirit ("native controls must always follow the active theme").
- **Target (trivial):** one subscription beside the boot `applyTheme()` call: `matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => { if (forcedTheme === null) applyTheme(); })`; `applyTheme` already recomputes `dark` and re-runs `applyAccentCSS`/`buildAccentSwatches`. Verify with the §6 forced-theme discipline plus a live-flip check (emulate colorScheme change without reload).

---

### Seven-persona design review (2026-07-02) — UXP-102…120

A seven-lens review fleet (UX, UI, Service Designer, Experience Designer, Graphic Designer, Planner Junkie, Solo RPG Player), each finding adversarially re-verified against the code and the locked standards (33 raw → 31 survived, 2 refuted). No invented syntax, no dependency, no locked-Decision contradiction, no em dashes surfaced. The confirmed conformance defects are UXP-102…120 below; two genuine *feature requests* (recurring tasks, "random point from a subtree") went to `backlog.md` instead. Entries carry a **[Batch N]** tag matching the recommended closing order at the end of this section. Verify every named symbol with grep before acting (the pre-review sweep already downgraded several findings the personas overstated — e.g. the touch turn-into door exists via bullet long-press, `start:overdue` exists, accent-on-computed-value is the sanctioned UXP-80 pattern).

### UXP-102 ◐ Shared-snapshot recipients silently lose edits on reload (P4 data-safety) 🔴  [Batch 1] (RESOLVED pending merge)
- **Problem:** a self-contained-HTML recipient edits; `markDirty`→`scheduleAutosave` writes their work with no embed gate, but `restoreAutosave` bails on `if (loadedFromEmbed) return`, so the next load re-hydrates the embedded island and discards the edits. `beforeunload` only guards `fileHandle || autosaveDisabled` (a snapshot has neither), so no unload prompt fires. The only notice is a ~1.4s boot flash, shown before the user has typed anything.
- **Rule:** P4 (no silent data loss); the storage/durability promise.
- **Resolved:** `beforeunload` now guards on the shared `unsavedToDisk()` predicate (which returns true for `loadedFromEmbed`), so a modified snapshot prompts on reload. `showSnapshotBanner()` shows a persistent, dismissible soft `#storage-warn` banner ("You're editing a shared snapshot. Reloading this page loses your changes. Export a copy to keep them.") fired from the boot snapshot path beside the existing one-time flash; its "Export a copy" button (`_warnAction='export'`) runs `exportSelfContainedHtml` without dismissing the banner (the doc stays an unsaved snapshot until re-exported). Ctrl+S not mode-scoped (P1 kept). Verified in-browser across the mode matrix.

### UXP-103 ◐ Permanent "unsaved" dot + reflexive discard dialogs contradict the autosave promise (P1/P4) 🔴  [Batch 1] (RESOLVED pending merge)
- **Problem:** in default (no-handle) mode, autosave never calls `markClean`, so `dirty` stays true forever: the one persistence signal is permanently in the alarm state, and `newFile`/`openFile` always fire "discard them permanently" though work is safe in localStorage/OPFS. Users learn to click Discard reflexively, defeating the dialog when it actually matters. `switchWorkspaceDoc` already suppresses this for folder-backed docs, proving the pattern exists but wasn't extended.
- **Rule:** P1 (a signal means the same thing everywhere), P4 (don't warn of loss when there is none).
- **Resolved:** two shared predicates now give the dot, the `beforeunload` guard, and the New/Open confirms one meaning (P1). `diskTargetOpen()` = `fileHandle || workspaceFile`; `unsavedToDisk()` = `dirty && (diskTargetOpen() || loadedFromEmbed || (autosaveDisabled && !hasOPFS))`. `markDirty`/`markClean` route the dot through `updateDirtyDot()` (tracks `unsavedToDisk()`, NOT the raw `dirty` flag, so it never sits permanently on for an auto-saving default-mode doc — did NOT naively `markClean()` the autosave tick, per the target's warning). `newFile`/`openFile` confirm only when `unsavedToDisk()`, reworded to "changes not saved to its file … discard them permanently" (accurate for the file-handle case, silent in safe default mode). Verified in-browser: default+dirty → dot hidden, `unsavedToDisk` false; file-handle/snapshot → true; autosave-disabled+OPFS → false.

### UXP-104 ◐ First-open gives "Start writing…" with zero pointer to the vocabulary (P2) 🔴  [Batch 1] (RESOLVED pending merge)
- **Problem:** a newcomer at a blank Pointliner sees only "Start writing…" (nested empties get `''`), no hint that `/`, `@`, `[[`, `{…}` exist — the entire point of the product. `ux.md` names this exact fix as the highest-leverage single investment and it is still unbuilt. `#btn-guide` and the once-triggered menus exist, so the gap is narrow: a blank canvas gives no cue the sigils exist. The `para` placeholder proves the pattern is affordable. (Service + Experience designers reached this independently.)
- **Rule:** P2 (every capability has a visible front door; the menu teaches the syntax).
- **Resolved:** the `content.dataset.ph` ternary now shows `Type / for blocks, @ to insert, or just write` at the structural entry points a newcomer lands on — top level OR a parent's first child (`isEntryPoint = depth === 0 || parent.children[0] === node`) — leaving deeper empties unlabeled so an experienced user isn't nagged per new point. Shipped unconditionally (matching the `para` hint); flagged in-code to become verbosity-dial-gated when that lands. Verified in-browser (renders on the empty top-level point).

### UXP-105 ◐ Touch has no visible @ insert door (P2, touch) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** on touch, the floating `#edit-bar` carries only structure (indent/outdent/move/Done). Inline generative pills (dice/grammar/var/math/link, `INSERT_CMDS`) are reachable only by typing `@` on the soft keyboard. Block turn-into and per-point annotate rows ARE touch-reachable via the bullet long-press `bpop`, so the gap is bounded to inline pills.
- **Rule:** P2 (visible affordance at the Guided floor; the three-door rule §4). The §9 matrix "/ and @ menus" P2 cell currently reads ✅ with no touch caveat — the same overstatement UXP-70 admitted for the move/indent row.
- **Resolved:** added an "Insert a pill" (`@`) button to `#edit-bar` (`eb-insert`, wired via the existing `ebBtn` mousedown+pointerdown+preventDefault, so the caret invariant holds). It focuses the active content and `document.execCommand('insertText', '@')` at the caret, which fires the normal input handler → `checkSlash` → the real `@` insert menu at the caret. This IS the typed path (no fabricated event, no fake sigil in `checkSlash`), so `slashApply`'s trigger-strip removes the `@` on pick exactly as usual. `#edit-bar` `aria-label` broadened "Move point"→"Edit point". §9 matrix "/ and @ menus" P2 cell updated with the touch caveat. Verified: the `execCommand('@')` path opens the insert menu (trigger `@`, 15 commands) on desktop; the bar itself shows only under `IS_TOUCH`.

### UXP-106 ◐ Emoji `:shortcode:` is the only authoring sigil with no caret-anchored picker (P2/P1) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** ~100 emoji shortcodes render only on an exact-typed name. Every other sigil (`#`,`{`,`[[`,`/`,`@`) opens a §7.1 caret picker; `:` opens nothing, and the `?`-panel shows only the literal `:emoji:` placeholder. Half-remembered codes (`:heart-eyes:` vs `:heart_eyes:`) yield silent literal text — the drift the `#` picker (UXP-10) was built to end.
- **Rule:** P2-1 (the menu teaches the syntax); P1 (a sigil-then-prefix opens a filtering menu everywhere else).
- **Resolved:** added `#emoji-menu` (the fifth caret picker) mirroring the tag picker function-for-function: `checkEmojiTrigger`/`renderEmojiMenu`/`emojiMove`/`emojiApply`, plus the pure `filterEmojiCandidates(prefix, map=EMOJI)` core (prefix-match, first-alias-wins glyph dedup, exact-self-match suppression) pinned by 6 tests. Trigger `/(?<![a-zA-Z0-9]):([a-z0-9_+-]*)$/i` (the `checkTagTrigger` boundary-guard shape, so `12:30` doesn't fire); wired into the input dispatch and the keydown/close paths beside the tag menu; `role=listbox`/`option` + `aria-activedescendant` AT wiring; reuses the shared `#brace-menu,#tag-menu` CSS. Writes the existing `:shortcode:` form (no new syntax). `?`-panel row desc updated ("type : to pick from a list"), §9 matrix emoji P2/P3 cells updated, `guide/writing-and-formatting.md` gained an Emoji section + `guide/features.md` a bullet. Verified end-to-end in-browser: `:sun` → picker with ☀️`:sun:` + 😎`:sunglasses:` → arrow/Enter → source `sky :sun:` → renders `sky ☀️`.

### UXP-107 ◐ Placeholder text opacity-fades `--muted` below the content contrast floor (DL §3) 🟡  [Batch 3] (RESOLVED pending merge)
- **Problem:** `.mt-name-pill:empty::before` (opacity .6), `.fn-content:empty::before` (.65, "Add a note…"), `.io-field input::placeholder` (.7), `.io-field textarea::placeholder` (.6) multiply floor-level `--muted` by opacity, landing ~2.4–2.97:1 light / ~3.1:1 dark. DL §3 names placeholders as content that MUST clear 4.5:1 and mandates de-emphasis by role, not failing ink. UXP-74 closed this exact pattern but only for `.collapse-count`.
- **Rule:** DL §3 (contrast floor; de-emphasize by role, never opacity-faded ink).
- **Resolved:** dropped the opacity on all four rules; plain `--muted` clears the floor and reads as lighter than filled content by role (the name pill is weight-400 vs filled 700; the io/fn placeholders sit against filled `--fg`, so `--muted` is inherently the lighter of the two). No new token needed. DL §3 gained a "placeholders are content and clear the floor" line. Verified in-browser both themes: `--muted` on `--bg` = 5.19:1 light / 6.37:1 dark.

### UXP-108 ◐ Zoomed page title can render smaller than a descendant h1 (DL §2) 🟡  [Batch 3] (RESOLVED pending merge)
- **Problem:** `.zoom-title` (`--zoom-title-size:30px`, opsz 60) is out-sized and out-graded by a markdown `# Heading` child (`2em`≈34px, opsz 84) inside the same zoomed page — the exact inversion DL §2 forbids. Worse at the 22px mobile breakpoint. The doc's own justification asserts a false "30px > 34px".
- **Rule:** DL §2 (the zoomed title outranks an inline h1; opsz tracks rendered size).
- **Resolved:** capped descendant headings in zoom mode rather than raising the title (which `fitZoomTitle` can shrink). A `body.zoomed` class is toggled beside the `base-zoom` toggle; `body.zoomed .node-content h1.md-h`→1.5em/opsz 60, `h2`→1.25em/opsz 34 (h3–h6 already sit below). Works at the 22px mobile title too (h1 25.5px < 30/22px title in both cases). DL §2 false inequality corrected to describe the step-down enforcement. Verified in-browser: zoomed title 30px vs child h1 25.5px, `titleOutranksH1: true`.

### UXP-109 ◐ Priority `[#A]` is a dead-end dimension: settable but unqueryable and un-rolled-up (P2) 🟡  [Batch 4] (RESOLVED pending merge)
- **Problem:** org priorities are settable (`setTodoPriority`, `cyclePriority`) but there is no `priority:` search operator (a raw `priority:A` falls through to the prop arm and matches nothing), and `collectDueDates` never reads priority so the agenda can't order/filter by it. Priority you can set but never query is decorative.
- **Rule:** P2 (a capability with no front door in search or the planning UI). Zero new syntax — the `state:`/`key:value` family already exists.
- **Resolved:** added a `priority:A` term to `parseSearchQuery` (single letter, uppercased, before the generic prop arm) and a `priority` arm in `termMatchesNode` reading `parseTodo(node.text).priority` (seq-aware via the passed `seqs`, so a non-todo never matches). `collectDueDates` now carries `priority` per item and the agenda sorts date-then-`priorityRank` (A<B<…<none) via the new pure `priorityRank` core. The `TAG_RE` companion bug is fixed by blanking the leading `[#X]` marker in `collectTags`'s walk (keeps it in lockstep with the render side, which already strips it). Doors: the focus-legend + `?`-panel search rows. Cores pinned (7 tests). Verified in-browser: `priority:a` matches `[#A]` only; agenda orders A before C before none.

### UXP-110 ◐ First generative roll arrives with no pop and no announcement (P4/experience) 🟡  [Batch 4] (RESOLVED pending merge)
- **Problem:** the `-rolled` pop class and the `announce(...)` fire on every reroll but never on the debut insert; `applyInlineReplace` then re-enters `enterEdit`, unfolding a freshly-rolled inline dice back to `{2d6}` source. The emotional peak — the first result — is the one moment with no visible or AT reward.
- **Rule:** P4 (a result is a response that should be visible + announced); the felt-quality of the generative loop.
- **Resolved:** added a shared `announceDebut(type, rec)` helper that speaks the fresh result (mirroring the reroll phrasing per type) and wired it into the generative `onResult` callbacks (dice/est/markov/grammar/rolltable/deck/oracle/math), after `applyInlineInsertion`. `applyInlineReplace`'s edit re-entry is untouched, per the target. **Scope note:** the visible `-rolled` pop can't persist on an inline insert because that edit re-entry unfolds the pill back to `{…}` source; the announce is the debut reward that survives, and the pop still fires on every subsequent click via the reroll path. Verified: `announceDebut('dice', …)` produces "Rolled 2d6: 7" through the same `announce()` all rerolls use.

### UXP-111 ◐ The yes/no oracle has no and/but swing (P2, solo origin) 🟡  [Batch 4] (RESOLVED pending merge)
- **Problem:** the most common solo ask is yes/no-plus-a-twist (Yes-and, No-but), but `ORACLE_BANDS`/`openOracleDialog` builds only `Yes N | No M`. The lonelog demo proves the gap: `d: {2d6}` rolls, but `-> Yes, and...` is hand-typed prose, so the shipped oracle doesn't produce the answer the player records.
- **Rule:** P2 (the origin use case's core generator is half-built); zero new syntax (a weighted-alt body the odds field already accepts).
- **Resolved:** added the pure `oracleSwingBody(yesW, noW)` core building the flat six-way `Yes, and 1 | Yes W | Yes, but 1 | No, but 1 | No W | No, and 1` (the plain answers keep the band weight; twists are a rarer 1). `ORACLE_SWING_BANDS`/`ORACLE_SWING_CHIPS` scale it per likelihood, and `openOracleDialog` now shows a second row of "Certain + swing … Impossible + swing" chips beside the plain ones (either fills the one editable odds field, the power path). Plain Yes/No stays the default. Oracle GUIDE body updated. **IP fence honored:** the ratios are original + user-tunable, not lifted from any published table (noted in-code). Cores pinned (2 tests). Verified in-browser: the dialog shows all five swing chips; a swing body rolls to one of the six answers.

### UXP-112 ◐ Agenda shows only DATED points; undated next-actions never surface in the planning UI (P2) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** most GTD next-actions are undated `#NEXT`/`#TODO` items, absent from List/Timeline/Calendar. They ARE reachable via `state:next`/`#next`/`is:todo` and can be starred as a saved search, so it is friction, not invisibility — but there is no front door inside the planning UI and the guide never points to it.
- **Rule:** P2 (visible front door inside the feature that owns the job).
- **Resolved:** added the pure `collectActions(rootNode, seqs)` core (mirrors `collectDueDates` minus the date gate: undated actionable to-dos only, done-ness off `todoDoneFromText`, ordered live-before-done then by `priorityRank`) and an **Actions** row in `renderAgendaList` (a new `action` kind in `mkAgChip`, no date badge, a `#A` priority marker, honors the Done toggle). The list empty-state now names actions too, and `renderAgendaList` shows the Actions row even when there are no dated points. Documented in the agenda GUIDE body + `guide/dates-and-planning.md` (agenda = scheduled work; `state:next`/`is:todo` = the action list). 2 pinned tests. Verified in-browser: rows render Due·Running·Actions; the Actions row holds the live undated to-dos, done ones hidden.

### UXP-113 ◐ `is:` family lacks `is:scheduled`/`is:unscheduled` (P2) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** the `is:` structural filter can't express "has any date" / "is dateless" — the axis for "tasks I forgot to schedule."
- **Rule:** P2/P5-4 (a new value in the established `is:` family, the `is:failing` precedent, with §2 sign-off + focus-legend + `?`-panel rows). Not new syntax.
- **Resolved:** added `scheduled`/`unscheduled` to the `is:` regex and an arm in `termMatchesNode` (`(node.props||[]).some(p => (due|start) && parseDueDate(p.val)!==null)`, `unscheduled` its negation; not to-do-gated, so any dated point counts). Doors: focus legend + `?`-panel rows + the `guide/features.md` search line (the drift guard required it). The `is:(…)` src-pin in `tests/test.mjs` updated to the new members. 2 pinned tests. Verified in-browser: `is:scheduled` matches the dated point, `is:unscheduled` its complement.

### UXP-114 ◐ No-reminders limitation is never communicated (P2, expectations copy) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** zero occurrences of reminder/notification in any GUIDE body; the one "reminder" mention (per-point notes) actively implies the app reminds you. A scheduler with no clear ceiling.
- **Rule:** P2 (set honest expectations at the front door).
- **Resolved:** added the honest sentence ("Pointliner has no background reminders or notifications; it runs entirely offline with no server, so the agenda is where you come to check what is due") to the agenda GUIDE body and `guide/dates-and-planning.md`. Softened the notes GUIDE "a reminder" example to "a note-to-self" so it no longer implies the app pings you. AP-style, no em dash.

### UXP-115 ◐ Progress cookie `[/]` scope is undisclosed (P2, disclosure-only) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** `[/]` on a project heading tallies only own text + direct children, not tasks two levels down, so the number is silently misleading at the altitude a planner places it. Recursion itself is a **recorded deferral** (UXP-20), NOT reopened here.
- **Rule:** P4 (a computed value should disclose its scope).
- **Resolved (disclosure only):** the `@progress` menu desc now reads "Live tally of this point's checkboxes and its direct sub-points" (was "checkboxes and child tasks"), disclosing the direct-children scope. No `[/subtree]` token minted, no per-type recursion — the deferral stands.

### UXP-116 ◐ Toasts fire into the bottom-center zone the fn/bl/var panels occupy (P4/experience) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** `flashHint`/`flashError` (`bottom:20px;left:50%`, z-index 800) stack visually over an open bottom-docked panel's content. The app already solved this exact collision for `#sc-toggle` via `syncHelpBtnBottom`.
- **Rule:** P4 feedback clarity / the calm-feel micro-layer.
- **Resolved:** added a shared `flashBottom()` helper summing the heights of any open `fn-panel`/`bl-panel`/`var-panel` (+20px gap + `env(safe-area-inset-bottom)`), called in BOTH `flashHint` and `flashError` cssText. Stays bottom-center (not top), so the toast location never becomes context-dependent (P1). Counts `#var-panel`, which `syncHelpBtnBottom` still omits (left as its own follow-on). Verified: `flashBottom()` returns the calc.

### UXP-117 ◐ `est` pill has no hover life while its siblings tilt on hover (DL §4/P1) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** `.dice-roll:hover .dice-ico` (18deg), `.mk-roll:hover .mk-ico` (90deg), `.gr-roll:hover .gr-ico` (180deg) tilt their icon to signal "I'm about to regenerate"; `.est-ico` re-samples exactly like dice yet has a dead icon, reading as non-interactive. Mouse-only decorative-layer inconsistency.
- **Rule:** P1 (same interactive family, same affordance); DL §5 bans variable-font hover *reflow*, not a static `transform:rotate`.
- **Resolved:** `.est-pill .est-ico` gained `transition:transform .25s ease` + `.est-pill:hover .est-ico{transform:rotate(-18deg)}` (purely additive, dice-parity, its own angle). Pick-vars (`var-pill` with `kind==='pick'`, `rerollPickVar`) remain the known follow-on — CSS can't select them per-instance. Verified in-browser.

### UXP-118 ◐ Micro-copy/consistency cluster (DL/P1/P2, low-risk one-liners) 🟢  [Batch 3] (RESOLVED pending merge)
A group of independent one-line fixes:
- **`.sh-row kbd` keycap divergence (DL §4):** ✓ fixed the two divergent axes in place (`padding:1px 5px;line-height:1.5` to match the canonical keycap). Kept it a separate selector rather than merging into `.cmd-key,#search-key,.sc-panel kbd` because that rule carries `margin-left:auto`/`align-self`/`flex-shrink` layout props specific to the cmd row, which would regress `.sh-row`'s own flex layout.
- **Pre-boot favicon hex (DL §1, first-paint):** ✓ swapped the static SVG fill `%234a90d9`→`%234338ca`, so the default-accent first paint is a no-op before `updateFavicon()` swaps in the dynamic accent-tinted data-URL. (The runtime favicon is a base64 PNG from `updateFavicon`; the static SVG only shows pre-boot.)
- **`SLASH_ARG_VERBS` doc drift (P5-4):** ✓ updated `ux-discipline.md` §3 and §7.1a to the full opted-in set (`due`, `start`, `check`, `alias`, `template`), naming the `SLASH_ARG_VERBS` const.
- **Dice/markov pill-internal opacity (DL §3):** ✓ resolved by the **doc-exception** route — added a DL §3 line carving out incidental connective glyphs (`+`, `=`, `→`, terminal `…`) as decoration exempt from the content floor (the information in a pill is full-contrast; only the punctuation between it fades). No CSS change; codifies what the July audit already treated as conformant-by-design.
- **Numeric-result accent competition (DL §4):** ✓ **confirmed not a defect** — accent *ink* on a computed value is the sanctioned UXP-80 pattern (§4 reserves the solid accent *fill*, not text ink). No change; re-inking in `--fg` would regress the cross-family "computed result" cue (P5). Recorded so it isn't re-flagged.

### UXP-119 ◐ Persistence/backup messaging polish (P2, non-Chromium durability) 🟢  [Batch 5] (RESOLVED pending merge)
A group of copy/labeling fixes around save, backup, and browser tiers (no new download control; no duplicated Save):
- **Non-Chromium backup nudge:** ✓ added `maybeBackupNudge(size)`, called from the autosave tick. On `!hasFSA` with no file/folder target and once the doc passes a modest size (`BACKUP_NUDGE_MIN`), it shows the soft `#storage-warn` banner once per session ("Your notes live in this browser only. Save to a file to keep a backup you can reopen."), whose "Save to file" button already triggers the download. Session-scoped (`_backupNudged`, not persisted), so it re-reminds on a later session but never nags twice in one sitting; skipped when a size warning is already showing.
- **Workspace-invite wrong expectation:** ✓ reworded the `#workspace-invite` flash to "Link copied. Save your document to a file first, then open it in Chrome or Edge and open the file there."
- **Export-a-copy framing:** ✓ the GUIDE 'export' body now leads with File → Save/Open as the OPML archive-and-restore format and frames the Export-a-copy options as one-way sharing; the "Web page (HTML)" desc (menu + GUIDE) now says it reopens as the live app.

### UXP-120 ◐ Shuffle-deck wrap has no courtesy cue (P4, solo) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** a `shuffle:` deck (sold as "non-repeating") silently reshuffles when the bag empties, with only a transient aria announce — no visible marker distinguishing first-pass from recycled. (Auto-recycle IS the documented contract; a missing courtesy cue at the wrap, not a betrayed guarantee.)
- **Rule:** P4 (a state change the user cares about should be visible, not only spoken).
- **Resolved:** `rerollGrammar`'s deck branch detects the wrap read-only BEFORE the draw (`mode==='shuffle'` + we've drawn before (`last != null`) + the bag is empty) and fires `flashHint('Deck reshuffled')`. No junk flag is written to the record (nothing new persisted to `_grammar`), and no persistent marker is added (`gr-seq-end` stays reserved for `once`). The first-ever draw does not fire it (no `last` yet). Verified in-browser: a 2-item shuffle deck flashes on the wrap draw (index 2), not before.

### Deferred / doc-only (from the same review, not UXP defects)
- **Solo-RPG worked recipes (guide-only, no engine change):** ✓ SHIPPED alongside Batch 4 as the `guide/solo-rpg/oracle-play/` case (walkthrough `oracle-play.md` + `oracle-play-demo.opml` + README table row). Covers the chaos-factor/interrupt-check scene loop (`{chaos := 3}` + `{proceed | interrupted {= chaos}}`, citing the dynamic-odds guide section), the meaning table (`{action} {subject}` two-rule grammar + a shuffle-deck variant), and thread tracking (a hand-authored `{shuffle: …threads…}` deck + the `#thread` query, with the note that a random-point-from-subtree generator is the backlog feature, not a recipe). Verified: the demo imports and promotes its `{…}` to live pills (`{chaos := 3}`→var, `{proceed | …}`→grammar).
- **Committed-roll re-roll protection (solo, ship only if tested):** the pill body IS the re-roll button (a LOCKED uniform decision); a deliberate misclick re-rolls an old logged beat. The reroll is announced + undoable (Ctrl+Z), so P4 is met. Cheapest honest step: document the Ctrl+Z protection in `lonelog.md`. An opt-in "freeze this result" lock (bullet-menu door + record boolean + CSS, additive) is legitimate but heavier than the harm warrants — build only if solo-play testing shows real accidental re-rolls.

### Recommended closing order (2026-07-02 review, UXP-102…120)
1. **Batch 1 — data-safety + the highest-leverage P2 (UXP-102, 103, 104).** Two data-integrity 🔴s and the one-string empty-state win. Do first; UXP-102/103 protect the user's work, UXP-104 is the single most-cited discoverability fix. Small diffs, high value.
2. **Batch 2 — discoverability doors (UXP-105, 106).** The touch @ insert door and the emoji picker: both build on the shared §7.1 caret-menu pattern, so do them together to reuse the wiring and the AT/GUIDE/matrix bookkeeping.
3. **Batch 3 — visual + feedback polish (UXP-107, 108, 116, 117, 118).** All CSS/copy, no logic; one design-verification pass (§6 both-themes + forced-theme shots) covers the whole batch. UXP-107/108 are the two 🟡 DL breaches; the rest are 🟢 one-liners.
4. **Batch 4 — planner + solo generative core (UXP-109, 110, 111, 120).** `priority:` search+rollup, the first-roll pop, the oracle swing, the deck-wrap cue. All reuse existing engines (search `key:value` family, the `onResult`/`rerollGrammar` paths, `ORACLE_BANDS`). Ship the solo-RPG guide recipes alongside.
5. **Batch 5 — planning surface + expectations copy (UXP-112, 113, 114, 115, 119).** The undated-actions row, `is:scheduled`, the no-reminders sentence, the `[/]` scope disclosure, the backup messaging. Mostly copy + additive `is:`/agenda arms; lowest urgency.

> **Feature requests (NOT conformance, tracked in `backlog.md`):** recurring tasks (a reserved `repeat` property + `parseRepeat` + roll-forward-on-complete) and a "random point from a subtree" generator (decks/grammar only draw from literal typed text today). Both need owner sign-off and, for recurrence, an explicit P5 syntax-inventory decision.

---

### Second seven-persona design review (2026-07-02, blind re-audit) — UXP-121…144

A second seven-persona review fleet audited the app **after** UXP-102…120 shipped, run **blind** (no knowledge of the prior review, and told not to mine this ledger) so it would find the next layer rather than re-litigate. 32 raw findings → adversarially verified → **21 confirmed** (2 more downgraded to low doc-nits; 11 refuted, including the whole UX-persona batch, which kept rediscovering already-shipped doors and the sanctioned UXP-63 body-click carve-out). The blind pass earned its keep twice: it caught a **regression I shipped** (UXP-121, the mobile half of UXP-108) and graded my own Batch-4 work (UXP-123/124). Entries carry a **[Batch N]** tag matching the closing order at the end. Verify every named symbol with grep before acting.

### UXP-121 ◐ Mobile zoom re-inverts: a child `# heading` out-sizes the zoom-title (DL §2 regression) 🔴  [Batch 1] (RESOLVED pending merge)
- **Problem:** UXP-108 caps zoomed descendant headings via `body.zoomed .node-content h1.md-h{1.5em}` (em-against-17px, unscoped for mobile), but in the `@media(max-width:560px)` block the `.zoom-title` drops to 22px while the child `# heading` stays 1.5em ≈ 25.5px at the same opsz 60 — 3.5px larger, the exact inversion DL §2 forbids, silently reintroduced at the breakpoint. `fitZoomTitle` only shrinks, so it can't recover. Desktop-only verification hid it (the miss that let it ship). (The blind reviewer estimated 768px; the actual mobile zoom-title breakpoint is 560px.)
- **Rule:** DL §2 (the zoomed title outranks an inline heading), reintroduced UXP-108 regression.
- **Resolved:** added to the existing `@media(max-width:560px)` block: `body.zoomed .node-content h1.md-h{font-size:1.15em;font-variation-settings:'opsz' 40}` (≈19.5px) and `h2.md-h{font-size:1.1em;font-variation-settings:'opsz' 22}` (≈18.7px) — both under the 22px title, h1>h2 preserved. Title not raised (DL §2). Verified per §6 with a narrow-width display shot: title 22px, child h1 ~19.5px, `titleOutranksH1: true`.

### UXP-122 ◐ PWA install icon draws a different mark than the favicon/wordmark (DL §1 regression) 🔴  [Batch 1] (RESOLVED pending merge)
- **Problem:** DL §1 locks "the mark and favicon must never diverge, change both in the same commit or neither." The three in-app homes (`.logo-mark`, `#favicon`, `updateFavicon`) render one compound evenodd path (solid accent disc with point+line knocked out). But `icon.svg` — the source of `icon-192/512.png`, the **installed-app** icon — drew a hollow stroked ring in fixed ink `#1f1d1a`, never the accent (its own comment admitted the fork).
- **Rule:** DL §1 (mark and favicon never diverge).
- **Resolved:** rebuilt `icon.svg` to use the ONE canonical compound path (the same `M256 512A256…` evenodd `d` as the favicon/`.logo-mark`/`updateFavicon`) filled indigo `#4338ca`, scaled 0.74 on the maskable warm-paper tile — so all four homes now draw the identical silhouette. Regenerated `icon-192.png`/`icon-512.png` from it (canvas Path2D render, the CLAUDE.md workflow). Verified the knockouts read cleanly at full size (screenshot: accent disc with the point + line as paper voids); the "fails at 48px" worry was unfounded.

### UXP-123 ◐ The oracle-play walkthrough's three "see the full rules" links all 404 (P4/docs) 🔴  [Batch 1] (RESOLVED pending merge)
- **Problem:** `guide/solo-rpg/oracle-play/oracle-play.md` (shipped in the prior review's Batch 4) had every deep-guide cross-link broken: lines 12 and 48 pointed at `generating-text.md#dynamic-odds`, and line 54 at `#name-generators` — neither slug exists.
- **Rule:** P4 (a promised affordance must work); the `guide/` cross-link contract (slugs are the contract).
- **Resolved:** fixed all three anchors to the real headings, **derived programmatically** with GitHub's own slug algorithm (not hand-typed — that was the error class): `#dynamic-odds`→`#when-the-odds-depend-on-something-dynamic-odds` (lines 12, 48) and `#name-generators`→`#name-things-youll-reuse-rules` (line 54, "the name-generator two-rule pattern" → the rules mechanism heading). Both slugs verified to resolve against `generating-text.md`'s actual headings.

### UXP-124 ◐ Swing oracle's flat weight-1 twists ignore the likelihood band (P1) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** `oracleSwingBody(yesW,noW)` (shipped UXP-111) kept the four twist arms at flat weight 1, so at "Certain" the No-family totalled ~12.5% and a full-reversal "No, and" came up as often as plain No — the band label no longer meant what it means on the plain oracle (P1).
- **Rule:** P1 (a band label means the same thing on the plain and swing oracle).
- **Resolved:** a new pure `oracleSwingSide(w)` splits each side into plain/and/but as fractions of its band weight (twist = 15%, plain = the rest, each floored at 1), scaling the band weight ×4 first so the ~70/15/15 split survives integer rounding at small bands (a Likely 3 would otherwise collapse to 1|1|1 and lose its lean). The Yes:No family split now tracks the plain oracle exactly at every band (verified: Certain 95/5, Likely 75/25, Even 50/50, Unlikely 25/75, Impossible 5/95) while every arm stays ≥1 (a swing still swings on the weak side). Stale comment fixed. 4 re-pinned tests (family-split percentages, not literal weights).

### UXP-125 ◐ The concept guide has no keyboard shortcut or persistent affordance (P2, ux.md floor) 🔴  [Batch 3] (RESOLVED pending merge)
- **Problem:** `ux.md` commits the complete reference be reachable from every mode via a keyboard shortcut + a persistent affordance. `openGuide` was a File-menu row + a shortcuts-panel footer button only.
- **Rule:** P2 (the ux.md "floor under the dial" commitment).
- **Resolved:** added the `Ctrl/⌘+Shift+/` chord (accepts either `/` or `?` under ctrl+shift, since Shift+/ is `?` on most layouts; works mid-edit) calling `openGuide`. Registered as `nav-guide` in the essentials registry so it self-documents in the `?` panel, and added a key chip (`#guide-key`) to the File-menu Concept guide row. The chord + File-menu row + panel footer + `?`-panel entry are the multi-door set. Documented in §3 keyboard grammar. Verified: the chord opens the guide.

### UXP-126 ◐ First-open has no first-run experience beyond one placeholder line (P2) 🟡  [Batch 3] (RESOLVED pending merge)
- **Problem:** on cold open a newcomer sees one empty bullet + three sigils; every distinguishing capability (pills) is invisible until they type a sigil.
- **Rule:** P2 (surface the teaching at the moment of need).
- **Resolved:** on a genuinely-fresh boot (`!_restoredFromAutosave && !loadedFromEmbed`), `maybeShowFirstRun()` adopts a `FIRST_RUN_EXAMPLES` OPML doc of live pills authored as plain `{…}` source (dice, grammar pick, math, a `sum(cost)` rollup over child points with `cost` props, an estimate, a to-do) — they promote to real pills via `promoteLoadedShorthand`. A soft banner offers "Start a blank outline" (`startBlankOutline`→`adoptDoc(mkRoot())`); the File-menu New is the later door. **It never becomes the user's saved doc:** `_showingExamples` suppresses `scheduleAutosave` until the first edit (`markDirty` clears the flag) or Start-blank, and `adoptDoc` clears it for any real doc. **Gotcha fixed in verification:** the guard must NOT use `hasWorkspace` (that's the FSA *capability*, not a connected folder — it suppressed examples on all Chromium); a stored workspace/file is reopened async and clears the flag via `adoptDoc`. Verified the full lifecycle in-browser: fresh boot shows live pills + banner + no autosave; edit → flag off + banner gone + autosave persists; returning reload shows the saved doc, not examples.

### UXP-127 ◐ Single-file tier has no reopen-last-file and misreports "saved" state (P4) 🟡  [Batch 3] (RESOLVED pending merge)
- **Problem:** the `fileHandle` path persisted no handle, so a returning session booted the localStorage copy with no memory of its disk file; `updateFmStatus` claimed "All changes saved" against an unbound handle and Ctrl+S fell into a fresh Save-As.
- **Rule:** P4 (don't claim "saved" with no write target; don't silently redirect Ctrl+S).
- **Resolved (full fix, not just the minimum):** a `LASTFILE_KEY` in IndexedDB persists the last STANDALONE `FileSystemFileHandle` + name (`saveLastFileHandle` on a standalone `adoptDoc`/`saveAsFile`; `clearLastFileHandle` on New / workspace-connect). A boot `reopenStoredFile()` (twin of `reopenStoredWorkspace`) rebinds it silently when `queryPermission` is granted, else shows a one-click "Reopen `<name>`" banner via `requestPermission` (mirrors `showReconnectBanner`, `_warnAction='reopenfile'`). `updateFmStatus` now distinguishes "named but unbound" ("Autosaved in this browser. Reopen `<name>` to save back to it") instead of claiming saved. `hasFSA`-gated. Verified: the named-but-unbound status reads correctly.

### UXP-128 ◐ Installable PWA has no in-app install affordance (P2, low) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** the manifest declares an installable standalone app, but `registerPWA` registers only the SW — the only door is the address-bar icon most users miss.
- **Rule:** P2 (an intended touchpoint has no visible door).
- **Resolved:** a `wireInstall()` IIFE captures `beforeinstallprompt` (`preventDefault`, stash the event), reveals a File-menu `#btn-install` row ("Install Pointliner"), and `prompt()`s on click (single-use: the event is nulled after). Hidden by default; `appinstalled` + a boot `matchMedia('(display-mode: standalone)')` check keep it hidden once installed. A real keyboard-operable + aria-labeled `<button>` (not caret-bound), design tokens only. Guarded inert on `file://`, so the download-and-run identity is untouched. (The row's `fa-download` glyph isn't in the FA subset, so it uses the sanctioned `⤓` unicode fallback via `paintIcon` — a subset rebuild would upgrade it, but that's github-egress-blocked here, same as UXP-134.)

### UXP-129 ☐ Agenda Actions row collapses NEXT (do-now) and WAITING (blocked) into one pile (P1) 🟡  [Batch 4]
- **Problem:** `collectActions` (shipped UXP-112) gathers undated to-dos and orders live-then-done, but never captures the state keyword, so `#WAITING` (blocked) sits undifferentiated among `#NEXT`/`#TODO` in a row labeled "Actions." A GTD user must mentally filter blocked items every scan.
- **Rule:** P1 (a state keyword reads the same everywhere).
- **Target:** thread the leading keyword into the item, render `#WAITING` points with a distinct muted "Waiting" badge (reuse `.ag-badge`; the WAITING icon already exists) and sort them after live NEXT/TODO. Keep it narrow to the built-in WAITING keyword; do NOT invent a general "states after the first active one" blocked notion (the model carries only active-vs-done via `doneFrom`).

### UXP-130 ☐ No unified overdue axis; start-only slips are invisible to search (P2) 🟡  [Batch 4]
- **Problem:** `due:overdue` matches only a `due` prop `< today`; a started-but-undeadlined point (start prop, no due) hits `if(!prop) return false` and returns nothing, reading as "nothing overdue" when a two-week-old started task sits right there. The agenda shows these (Running row) but there's no queryable twin and no single overdue axis spanning both keys.
- **Rule:** P2/P5-4 (a new value in the `is:` family, the `is:failing`/`is:scheduled` precedent). Not new syntax.
- **Target:** add `is:overdue` to the `is:` family: matches `(due<today || (no due && start<today)) && !done`, done-ness seq-aware via `todoDoneFromText(node.text, seqs)` (not `node.checked`). Leave the existing `due:overdue`/`start:overdue` untouched. Add the legend + `?`-panel + `guide/features.md` rows (the drift guard requires it). Pin tests.

### UXP-131 ☐ `key:value` search can't match a spaced value (P2) 🟡  [Batch 4]
- **Problem:** properties are the planner metadata layer (`owner:zeo`), but the value side is one word/hyphen token, so `owner:Jane Doe`, `area:Home Renovation`, `context:@errands` are storable (free-text input) yet unsearchable. Verified: the top-level tokenizer splits `owner:"Jane Doe"` on the interior space before any arm sees it. (`has:owner` still surfaces the point, so not invisible, only not value-filterable — supports medium.)
- **Rule:** P2 (a storable value should be filterable). Zero new syntax (reuse the existing `"…"` phrase quoting).
- **Target:** teach the top-level lexer to keep `key:"…"`/`key:'…'` as one token (reuse the phrase-quote convention), then add a prop arm that strips quotes and switches the compare to **contains** (matching the text-term spirit); this also fixes the `@errands` leading-sigil case. Update the search legend + `?`-panel + properties concept-guide entry. Pin the lexer + match tests.

### UXP-132 ☐ Agenda has no sort/group control beyond date (P2, low-end medium) 🟡  [Batch 4]
- **Problem:** `collectDueDates` hard-sorts epochDay-then-priority, so an `[#A]` due in three days always sorts below a no-priority item due tomorrow, with no toggle for a priority-first view. Achievable via search on the outline, but not from inside the agenda strip.
- **Rule:** P2 (a reasonable view the feature that owns the job can't produce).
- **Target:** add a "Sort" segmented control (Date · Priority) beside the existing chips, built with `mkAgToggle`, persisted like `agendaShowRunning`, re-sorting the same rows (a comparator swap). Optionally a free-text focus reusing `parseSearchQuery`/`queryMatchesNode` against the collected items (zero new syntax). Ship always-visible (no verbosity dial exists).

### UXP-133 ☐ Bulk action bar lacks Refile (P1) 🟢  [Batch 4]
- **Problem:** `#node-sel-bar` covers copy/indent/outdent/state/dates/check/props/type/delete but NOT Refile, so after a brain-dump you must refile each subtree one at a time. The infrastructure exists (`buildTreePicker` is reusable; the per-point dialogs accept a `targets[]` list).
- **Rule:** P1 (refile should behave the same for one or many).
- **Target:** add a "Refile" button to `#node-sel-bar` opening `buildTreePicker` once, applying `refileNodeTo` across the selected roots. The **top-most-subtrees-only dedupe is REQUIRED** (add a `selectionRoots()` helper: drop any selected node with a selected ancestor via `parentMap`) — `refileNodeTo`'s `isDescOf` guard covers filing-into-a-member but not overlapping roots. One summarizing toast.

### UXP-134 ◐ `fa-left-right` carries three unrelated meanings (width, estimate, refile) (DL §1 corollary) 🟡  [Batch 2] (REFILE RESOLVED; estimate glyph DEFERRED, build-blocked)
- **Problem:** DL §1 corollary: refile moved to `fa-arrow-right-arrow-left`, leaving `fa-left-right` for horizontal-span only. The glyph was worn by width (the sanctioned use), the whole estimate family, AND the Refile picker header.
- **Rule:** DL §1 corollary (one glyph, one concept).
- **Resolved (part 1, refile):** the Refile picker header (`buildTreePicker` in the "Refile to…" opener) now uses `fa-arrow-right-arrow-left` (the `fb` was already `⇄`) — a one-token regression fix, matching every other refile surface. So `fa-left-right` no longer means refile.
- **Deferred (part 2, estimate) — BUILD-BLOCKED, not skipped:** giving the estimate family its own glyph requires the FA subset rebuild (`tools/build-fa-subset.py` downloads pinned FA source from github, re-subsets the woff2, regenerates `FA_GLYPHS` + `::before`). This sandbox has `fontTools`+`brotli` but **no github egress** (SSL/cert blocked), so the woff2 cannot be rebuilt here. The 5 estimate refs (`id:'est'` door, `collectPillActions` row, the two `est-ico` spans, the estimate dialog header) still point at `fa-left-right`, so estimate and width still share the glyph — a residual DL §1-corollary drift. **Do part 2 in an environment with github access:** pick the glyph (a wave/tilde/bell — `∿`/`≈` fallbacks already hint the identity; `fa-bell` reads "distribution" cleanly), add it to `tools/build-fa-subset.py`'s ICONS, rebuild, splice the new `fa-embed` block + `FA_GLYPHS` line, then swap all 5 refs. Needs the owner's glyph pick.

### UXP-135 ◐ `.sh-saved-title` eyebrow omits `font-weight` (DL §4) 🟢  [Batch 2] (RESOLVED pending merge)
- **Problem:** DL §4 locks the eyebrow as one recipe: 10px / 600 / .07em caps in `--muted`. `.sh-saved-title` set 10px, uppercase, .06em, `--muted` but NO font-weight, inheriting body 400 — thinner than every sibling eyebrow.
- **Rule:** DL §4 (one eyebrow recipe).
- **Resolved:** added `font-weight:600` and bumped `.06em`→`.07em` to match the canonical eyebrow exactly. Verified computed: 600 / .07em.

### UXP-136 ◐ Insert-dialog `.io-chip:hover` uses the reserved commit fill (DL §4) 🟢  [Batch 2] (RESOLVED pending merge)
- **Problem:** the insert-dialog syntax-example chips lit to a full `--acc` fill on hover — reserved for the dialog's actual commit button (`.io-btn.primary`).
- **Rule:** DL §4 (solid accent fill reserved for the primary commit action; hover states use the tint recipe).
- **Resolved:** `.io-chip:hover` now uses `background:color-mix(in srgb,var(--acc) 6%,var(--cbg))` + `border-color:var(--acc)`, and drops the `color:var(--acc-fg)` (the ink inherits `--fg`). One persistent loud object per dialog. Verified computed.

### UXP-137 ☐ No way to freeze a rolled pill to plain text (P2/product, solo) 🟡  [Batch 5]
- **Problem:** the lonelog guide sells the pill's freeze as "an honest record … only changes if you deliberately click to re-roll," but the whole journal is clickable live pills and a display-mode mis-tap re-rolls a committed beat (Undo helps only if noticed). The only escape is a full export that flattens everything.
- **Rule:** P2/product (a missing affordance; the harm is silent-noticed-late mutation, recoverable via `pushUndo`, so medium not P4).
- **Target:** add a per-pill "Freeze to text" action (new `collectPillActions` row + bullet-menu entry). Do NOT call `flattenArtifacts` for one pill (it's a whole-string regex over ALL tokens). Factor a shared `frozenTokenText(type,key,node,varMap)` (dice `${expr} = ${total}`, markov `path.join(' → ')`, grammar `g.result`, est `formatDist`, var `formatVarValue`) so callers stay in lockstep (P1); splice just that `[[type:key]]` occurrence and drop the matching sidecar via `pruneXxx`. Wrap in `pushUndo`, `announce()` it (P4), handle the edit-mode unfold/refold buffer. No new syntax.

### UXP-138 ☐ A spent `once` deck pops as if it drew (P4) 🟢  [Batch 5]
- **Problem:** clicking an exhausted `once` deck is a dead event (`nextSeqIndex` returns -1, result stays `''`, repaints to muted `—`) yet still runs `pushUndo()`+`markDirty()` and re-adds `.gr-rolled`, firing the celebratory `roll-pop` on a non-event while title/aria still read "Click to advance." A `shuffle` deck gets a courteous reshuffle flash; `once` gets a false-positive flourish.
- **Rule:** P4 (feedback fires on a non-event).
- **Target:** gate on `g.mode==='once' && (g.pos||0) >= g.items.length` (do NOT include `stopping` — it never returns -1 and its repeat can be a real re-roll). In that case skip `pushUndo`/`markDirty`, don't add `.gr-rolled`, and branch verb/title/aria on the existing `ended` flag so it reads "Deck spent" not "Click to advance." A one-time `flashHint('Deck spent')` is fine. Leave `shuffle` and all real draws untouched.

### UXP-139 ☐ A natural max die roll looks like any other number (experience polish) 🟢  [Batch 5]
- **Problem:** the RPG-soul "click a pill, get a surprise" moment goes unmarked: a natural max face renders as bare `escHtml(String(...))`, indistinguishable from a 3. The engine values valence everywhere else (Fate colors, exploding chains, reroll strikes) but single-die extremes stay flat. Polish opportunity, not a conformance defect (the standard requires no crit marking and demands identity stay "at whisper level, never candy").
- **Rule:** product/experience (optional; must clear the DoD gate and the whisper-level rule).
- **Target:** IF pursued, a display-only class on the max face — but do NOT reuse `.dice-hit`'s accent-700 (that means a counted pool success and `.dice-total` owns it; one glyph, three meanings breaks DL §1). Give max its own whisper cue (accent ink at normal weight, or an accent underline). Key it on whether ANY face in the chain hit `p.sides` (an exploding die's last face is never the max, so `chain[len-1]===p.sides` silently never fires). Decoration, not information.

### UXP-140 ☐ The yes/no oracle answer has no valence (experience polish) 🟢  [Batch 5]
- **Problem:** "Yes," "No," "Yes, and," "No, but" all render identical neutral `.gr-result`, so the most "ask the universe" beat lands as data. Self-declared optional; a recorded non-fix is acceptable.
- **Rule:** product/experience (optional).
- **Target:** IF pursued, do it at the oracle door ONLY (a dedicated variant class on the anon oracle roll, never a content-sniff in `renderGrammarPill`). Use the §4 badge recipe as a BACKGROUND tint (`color-mix(--ok 16%)` for leading-Yes, `--muted` for leading-No) while the result INK stays full-contrast `--fg` (the verdict is load-bearing, must clear 4.5:1). Prefer `--muted` over `--warn` for No (a No is not an error).

### UXP-141 ☐ A `shuffle` deck nested in a rule silently degrades to a stateless pick (P1, doc-only) 🟢  [Batch 5]
- **Problem:** the oracle-play meaning-table section recommends a deck for draw-without-repeats, but folding `{shuffle:…}` into a named rule (`meaning: {shuffle: …} {subject}`) quietly makes it a uniform pick — repeats return with no signal that the no-repeat guarantee dropped. No shipped guide teaches the broken pattern (so low), but the recommendation invites it.
- **Rule:** P1 (a construct's guarantee changes by context invisibly).
- **Target (doc-only):** one line in `oracle-play.md` and `generating-text.md` noting a deck draws without repeats only as its own standalone pill; nested in a rule it becomes an ordinary pick. Do NOT add detection in `classifyBraceBody`/`parseRules` (they lack the nesting context, which only exists at expansion) — a persistent marker would inject non-content into a valid draw.

### UXP-142 ☐ No in-app acknowledgement that tasks don't recur (P2, expectations copy) 🟢  [Batch 5]
- **Problem:** the agenda GUIDE explains the no-reminders limit, but neither it nor the `dates` entry says a completed dated task stays put and tasks don't roll forward, so a user infers "the agenda is my planning home" then discovers recurrence must be hand-recreated with no hint. (The full `repeat`-property build stays a `backlog.md` feature needing P5 sign-off; the confirmable defect here is the missing sentence.)
- **Rule:** P2 (set honest expectations).
- **Target:** add one honest AP-style line to the `dates` and/or `agenda` GUIDE body: a completed dated point stays in place and tasks do not repeat automatically yet. No em dashes.

### UXP-143 ☐ Keyboard state-cycle to done gives no "now hidden" notice the mouse paths give (P1, low) 🟢  [Batch 5]
- **Problem:** (Downgraded from the blind review's medium — the stated "silent disappearance on blur" mechanism is false: the keyboard cycle repaints in place and does NOT `render()`, so the row stays visible until a later unrelated full render; the chord's P4 duty is met via the `#a11y-live` announce.) The residual real issue: the `Ctrl/⌘+Shift+S` cycle branch never calls `flashHiddenIfDone`, while all three mouse/menu commit paths do — an inconsistency in the "done, now hidden" cue.
- **Rule:** P1 (mouse and keyboard commit paths give different feedback).
- **Target:** unify at `exitEdit`, not the keystroke: fire the "Done, now hidden" notice when a just-committed done row will actually be hidden by the next render, covering all commit paths — do NOT bolt `flashHiddenIfDone` onto the transient cycle keystroke (it would over-notify every time the user cycles PAST done while still editing a visible point, a P4 over-notification).

### UXP-144 ☐ `Alt+1–9` doc-tab jump is absent from the §3 keyboard-grammar table (§3 completeness, low) 🟢  [Batch 5]
- **Problem:** (Downgraded — the blind review wrongly said it's absent from the `?` panel; it IS there (`file-tab-n` essential entry), and P5-4 is authoring-syntax-only so it doesn't bind a navigation accelerator.) The residual real gap: the §3 keyboard-grammar table lists the sibling `Ctrl/⌘+Shift+]`/`[` tab-cycle but omits bare `Alt+1–9`.
- **Rule:** §3 keyboard-grammar table completeness (not P5-4).
- **Target:** add an `Alt+1–9` row to the §3 table beside the tab-cycle line. Separately, the P1 observation that `Alt` is elsewhere the point-movement modifier (so `Alt+digit` overloads it onto navigation) is an **owner grammar decision** — flag it, do NOT change the binding without sign-off.

### Recommended closing order (2026-07-02 blind re-audit, UXP-121…144)
1. **Batch 1 — regressions + broken promises (UXP-121, 122, 123).** Two locked-Decision 🔴 regressions (mobile zoom inversion — a defect shipped in the prior review's Batch 3 — and the PWA icon divergence) plus the dead oracle-play links. Do first: they break a locked Decision or a promised affordance. Verify the mobile zoom per §6 with narrow-width shots (the discipline that would have caught it).
2. **Batch 2 — glyph + visual coherence + the swing fix (UXP-124, 134, 135, 136).** The stale swing-oracle weighting (P1, my Batch-4 code), the fa-left-right refile half (one-token fix) + estimate glyph (subset rebuild), the eyebrow weight, the io-chip hover. All small; the estimate glyph needs the FA subset workflow.
3. **Batch 3 — discoverability + durability (UXP-125, 126, 127, 128).** The concept-guide shortcut+affordance (🔴), the first-run Examples doc, the single-file reopen/misreport fix, the PWA install affordance. The heaviest batch (new surfaces + IndexedDB handle persistence).
4. **Batch 4 — planner surface (UXP-129, 130, 131, 132, 133).** Agenda NEXT/WAITING split, `is:overdue`, spaced `key:value` search, agenda sort, bulk Refile. All reuse existing engines (the `is:` family, the search lexer, `mkAgToggle`, `buildTreePicker`). Pure cores → pin → wire.
5. **Batch 5 — solo/experience polish + copy (UXP-137, 138, 139, 140, 141, 142, 143, 144).** Freeze-to-text, the spent-deck pop, crit/oracle valence (both optional), the shuffle-in-rule + recurrence copy, and the two downgraded UX doc-nits. Lowest urgency; several are opt-in or doc-only.

> **Feature request (NOT conformance, already in `backlog.md`):** the "random point / random child draw" (a `{…}` reference that resolves against a scope of the outline — a `#tag` or subtree) surfaced again as the solo-RPG thread/NPC-table gap. It is a genuinely new semantic (a grammar reference reaching live tree content outside its own body), needs owner sign-off, and is NOT a UXP. The blind reviewer agreed it is not the highest-leverage gap (discoverability is). Left in `backlog.md`.

---

## Tier 3 — Accessibility conformance (additive; sequenced in `accessibility.md`)

These are **not new tickets** — they are the standard's P3 requirements mapped onto the existing accessibility phases, listed here so a11y is visible as part of the *one* conformance picture rather than a separate track. **Do not front-run the deferred items**; do satisfy the interim labels now.

### UXP-13 ✓ Accessible names on icon-only controls — *a11y Phase 0* — **RESOLVED**
- **Violated:** P3-1. **Target:** `aria-label` on `#btn-done`, level buttons, pill pencils, table add buttons, search; decorative glyphs `aria-hidden`.
- **Resolved across two passes.** Chrome design pass: `#btn-done` (`aria-label` + `aria-pressed`, "done points" vocabulary), `#level-ctl` (`role="group"` + per-button labels), `#search-box` (`aria-label="Search points"`), the logo button, `#sc-toggle`, the accent swatches (`aria-label` + `aria-pressed`), both dirty dots. This pass: all eight **pill pencils** (`.dice-edit`, `.mk-edit`, `.rt-edit`, `.gr-edit`, both `.math-edit`, all three `.var-edit`) carry `role="button"` + `aria-label` matching their tooltip + `aria-hidden` on the decorative pen glyph; the selection-toolbar `#sel-tb .cmd-icon` buttons (including the link and footnote icons) are named from their command labels; `#storage-warn-close` is named. The once-listed **table add buttons no longer exist** — UXP-21's consolidation retired the standalone add/delete handles into the keyboard-operable Column/Row menus, so there is nothing left to name.

### UXP-14 ✓ Keyboard operability on `<div>`/`<span>` controls — *a11y Phase 1* — **RESOLVED**
- **Violated:** P3-2. **Target:** `role`/`tabindex` + `keydown` **beside** existing `mousedown` (caret invariant) on file-menu items, collapse button, bullet, breadcrumb, slash-menu items, `#sc-toggle`→`<button>`, table handles, and the static-table `.mt-promote` button.
- **✅ Done — the bullet / point-actions popup (the highest-leverage slice).** `.bullet` is now `role="button"`/`aria-haspopup="menu"`/`aria-label`/`tabindex="-1"` + Enter-Space keydown; `#bpop` is a full `role="menu"` (items `role="menuitem"` + `tabindex="-1"`, arrow/Home/End nav, Enter/Space activate, Esc closes + restores focus, focus-visible rings). The keyboard door is **`Shift+F10` / the Menu key** on the focused point (`onKeyDown`), added to §3. This makes **every per-point action keyboard-reachable in one stroke** — type switch, zoom, copy link, move, delete, and the static-table **convert-to-base** (which was filed here in PR 3 and is now operable). 
- **✅ Done — the file menu (chrome design pass).** `#logo-btn` is `role="button"`/`tabindex="0"`/`aria-haspopup="dialog"`/`aria-expanded` + Enter/Space keydown beside the click handler; `#file-menu` is a `role="dialog"` (per §7.1 it is a settings dialog, **not** a menu) with `role="button"`/`tabindex="-1"` rows, ↑/↓/Home/End roving focus as a convenience, Enter/Space activate, Esc closes + restores focus — to the **interrupted edit at its exact caret offset** when one was armed (`restoreChromeReturn`), else to the logo. Also done in the same pass: `#sc-toggle` (button semantics + Enter/Space; the panel takes focus on open so keys scroll it), `.ghost-row` (`role="button"`/`tabindex="0"` + Enter/Space), and the slash menu's screen-reader path (`role="listbox"`/`option` + `aria-activedescendant` on the editing element — focus never leaves the caret).
- **✅ Done — the long-tail sweep (this pass).** `.collapse-btn`: `role="button"` + `tabindex="-1"` + `aria-label` (Expand/Collapse) + `aria-expanded` + Enter/Space keydown beside the existing click handler. `.crumb`: navigable crumbs are `role="link"` + `tabindex="0"` + Enter/Space, named with their title. `#storage-warn-close` is now a real `<button>` (CSS-reset to keep its look), named. `.fn-key`: `role="button"` + `tabindex="0"` + Enter/Space → `returnToFnRef`, named ("Footnote [^key] — jump to reference"), beside the untouched mouse handlers. **Pill pencils**: Enter/Space on a focused pencil dispatches a bubbling `mousedown` in `onKeyDown`, so the content's existing pill-handler block runs unchanged — keyboard added *beside* the mousedown path, per the caret invariant (pencils are `tabindex="-1"`: reached programmatically/by AT, not flooding the Tab order). `#sel-tb .cmd-icon` buttons carry `role="button"` + names (toolbar reach itself remains selection-driven; the typed markdown path covers the capability for keyboard users). **✅ Done — caret-picker AT wiring:** the `{`, `#`, and `[[` pickers match the slash menu's screen-reader pattern — container `role="listbox"`, items `role="option"` with ids + `aria-selected`, `aria-activedescendant` on the editing element, removed on hide.
- **✅ Done — the row menu's keyboard door (closing slice).** `Shift+F10` / the Menu key on a focused base cell now opens the **cell's context menu**: the Column sections plus, on a data row, the Row sections (Insert above/below · Move up/down · Delete row, with the same bounds/min-rows guards as `showRowPanel`). **No new chord** — the existing cell context-menu key simply covers both of the cell's axes, the OS/spreadsheet-standard model, preserving the documented split (cell focused → cell context menu, bullet focused → base menu). Header and footer rows get column sections only. The `.mt-rowh` click menu stays the pointer path; `.mt-promote` focus-reach rides its `#bpop` menu entry (live). `?` panel row updated.

### UXP-15 ✓ Pill labels + live announcements — *a11y Phase 2* — **RESOLVED**
- **Violated:** P3-5, P3-6 interim.
- **Resolved:** every pill type carries an accurate `aria-label` in the **menu's vocabulary** ("Dice roll 2d6 = 7 — click to re-roll", "Markov chain walk: a → b", "Roll table loot: …", "Grammar: …", "Variable x = 5" incl. cyclic/shadowed/not-found states, "Sequence Flow — active: …; done: …"), including the dead-record `?` fallbacks. Labels live **in the renderers** (pure string builders, pinned), so every repaint — reroll included — refreshes them for free. The `#a11y-live` region now announces: all four generative **rerolls** (`rerollDice/Markov/Rolltable/Grammar`, joining the pick-var announcement), every **`flashHint` toast** (so the UXP-12 confirmations reach AT), and the **`gr-bad` typo marker** ("Not recognized — stays plain text") when an invalid `{…}` completes — the marker's AT twin. Shared `diceTotalStr` keeps the spoken total identical to the displayed one (success pools, Fate). Pill `tabindex`/focus reach was deferred as the target specified and **landed with the UXP-19 dedicated pass** (pills carry `tabindex="-1"` + Enter/Space activation), arming UXP-17's pill focus rules.

### UXP-16 ✓ Dialog focus-trap + restore — *a11y Phase 3* — **RESOLVED**
- **Violated:** P3-2/P3-3.
- **Resolved:** `#io-card` is now `role="dialog" aria-modal="true"`, with `aria-label` set to the dialog title on each open. All three open paths (`openInsertDialog`, `openVarDialog`, `openConfirmDialog`) capture `ioReturnFocus = document.activeElement` before showing; `closeIo` restores focus to that element on every close path (OK, Cancel, Esc, backdrop click). A static Tab-trap listener on `#io-back` cycles focus through all `input/textarea/button:not(:disabled)` elements in `#io-card` — Shift+Tab wraps from first to last, Tab wraps from last to first. Input `keydown` handlers changed from `e.stopPropagation()` to `if (e.key !== 'Tab') e.stopPropagation()` so Tab events bubble to the trap without exposing global editor shortcuts. The table Column/Row menus (`mtOpenMenu` / `hideColPanel`) gained the same focus-restore pattern via `mtPanelReturn`. **Not in scope:** `showTodoPicker` chips remain mouse-only `<div>`s — acceptable because the **capability** has a first-class keyboard door (the `/` menu applies every state and priority), so the picker is a pointer convenience, not the only path; chip-level keyboard nav can ride a future pass.

### UXP-17 ✓ Focus-visible + reduced-motion — *a11y Phase 4* — **RESOLVED**
- **Violated:** P3-3. **Target:** the two additive CSS rules (`:focus-visible`, `prefers-reduced-motion`).
- **Resolved across two passes.** Design pass 2: `:focus-visible` rules for the search field, zoom title, and all seven artifact pills (solid accent outline; the soft `--ring` glow is decoration, not the focus indicator). This pass — **the sweep**: an audit classified every `outline:none` (text surfaces keep the caret as their indicator; dialog fields/search/menu items already had visible replacements), and the remaining keyboard-focusable controls now show the app's standard 2px accent ring instead of the per-browser default — `.collapse-btn`, `.crumb`, `.fn-key`, `#storage-warn-close`, `.bullet`, the `.lvl-btn` group, `#btn-done`, `.io-btn`/`.io-chip` dialog buttons, all six pill-pencil classes, and (inset, so scrollable panels don't clip) `#file-menu .cmd-item` + `.mt-col-item`. **Reduced motion:** one global `@media(prefers-reduced-motion:reduce)` rule collapses every animation/transition to imperceptible (subsumes the two earlier per-widget rules, which remain harmlessly). Pill rules for the pills *themselves* armed when UXP-19 landed pill `tabindex`, as previously recorded.

### UXP-18 ✓ Storage alert + muted contrast — *a11y Phase 5* — **RESOLVED**
- **Violated:** P3-4/P3-5.
- **Resolved:** `--muted` passes AA in both themes (light `#6b665c` ≈4.9:1, dark `#a39a8d` ≈6.4:1), in CSS **and** the `applyTheme` forced-theme strings; status badges, priority chips, and hashtags moved to AA-passing theme-paired tokens (`--ok/--warn/--bad/--info`); `--acc-fg` fixed the white-on-pastel-accent dark-mode failure (all design pass 2). `role="alert"` is now on `#storage-warn`, so the storage warning is announced when shown — Phase 5 complete.

### UXP-19 ✓ Outline tree + table grid semantics — **RESOLVED** (the dedicated pass)
- **Problem:** the virtualized outline wasn't a `role="tree"` and tables weren't a `role="grid"`; high-risk to keep in sync across `render()`.
- **Violated:** P3 (full target). Interim per-row/per-pill `aria-label`s shipped earlier (UXP-15) so the deferral never meant "unlabeled and silent."
- **Resolved — outline (the flat-tree pattern):** `#vlist` is `role="tree"` + `aria-label="Outline"` + `aria-multiselectable`; the spacers are `role="presentation"`. Every row is `role="treeitem"` with `aria-level` (depth+1), `aria-posinset`/`aria-setsize` (1-based position among *visible* siblings — threaded through `pushRows`/`pushSearchRows`/`flatten` over the same visibility predicate that decides which rows exist, so the attributes report true positions even though only a window of rows is in the DOM: exactly what setsize/posinset exist for), `aria-expanded` on parents, and `aria-selected` mirroring multi-select (synced in `updateSelVisuals` beside the class toggle, and stamped fresh in `renderRow`). The reused live-edit element in `renderWindow` gets its level/position attributes refreshed in place. **Sync risk dissolved by construction:** every structural mutation already funnels through `render()` → `flatten()` → `renderRow()`, so the attributes can't drift — the one out-of-band path (selection) is the one with the explicit sync.
- **Resolved — base grid:** the interactive base `<table>` is `role="grid"` + `aria-label="Base"` — HTML-AAM then maps `tr`/`th`/`td` to row/columnheader/gridcell for free. Computed (formula-target) cells carry `aria-readonly="true"` (closing the deferred cell-readonly note in the Table-formulas matrix row); the pointer-only row-handle gutter (`.mt-rowh`) is `aria-hidden` (no focusable content; the keyboard door to row ops is the Shift+F10 cell context menu — UXP-14). The read-only static render keeps native table semantics.
- **Resolved — pill focus reach (the piece UXP-15/17 sequenced with this pass):** all seven pill types carry `tabindex="-1"` — programmatic/AT focus reach without flooding the Tab order (the pencil precedent) — and Enter/Space on a focused pill body dispatches the same bubbling `mousedown` the pencils use, so re-roll/edit runs through the existing handler block with zero duplicate logic. After a re-roll repaint the pill is re-focused by `data-key` (only when focus actually fell to body — an opened dialog keeps its own focus). UXP-17's pill `:focus-visible` rules are now armed.
- **Pinned:** tree role/level/position source pins, grid role + `aria-readonly`, per-renderer `tabindex` in the pill HTML, and the pill-body dispatch selector.

### UXP-29 ✅ Chrome-pass conformance fixes (recorded, closed in the same pass)
Defects found by the chrome design review, fixed together — recorded so the decisions don't silently regress:
- **Vocabulary (V-1):** the ghost row said "New item…" and the multi-drag image "`N items`" — the standard's canonical term is **point**. Both fixed; "Show completed" titles moved to "done points" for the same reason.
- **Blank icons (P4 silent failure):** seven referenced FA classes (`fa-shuffle`, `fa-list-check`, `fa-arrow-down-wide-short`, state-picker icons…) had no glyph in the embedded subset — the grammar/sequence pill icons and the bpop sort row painted empty boxes. Subset rebuilt (+`magnifying-glass`, `check`, `keyboard`), and `paintIcon` now self-heals: a class missing from the generated `FA_GLYPHS` set falls back to its unicode glyph instead of painting blank.
- **Help-panel drift (P4/P2):** the `?` panel documented the retired `⌘+⇧+M` chord and omitted `⇧+F10`, `⌘+⇧+L`, `⌘+⇧+V`, multi-select, and the `{…}`/`[^key]` shorthand (P5-4). Content re-synced; the panel also gained a front door in the file menu, and the `?` toggle now restacks above the footnote panel instead of vanishing (P2-1). *Durable fix (open):* the `SHORTCUTS` array is still a hand-maintained parallel registry — single-sourcing it with the keybindings remains on the backlog.
- **Theme toggle (recorded behavior change):** the binary Light/Dark flip silently lost System mode after one click; it now cycles **System → Light → Dark**, label shows the current mode, and the menu stays open while cycling.
- **One red (design-language §3):** the bpop Delete row hardcoded `#e55` and `#storage-warn` hardcoded `#c0392b`/`#d68910` — all moved to the `--bad`/`--warn` token recipes.

---

## Enhancements (tracked, not defects)

These are **not non-conformances** — the standard is satisfied — just nice-to-haves noted so they aren't lost.

- 🟢 **Table arrow-key cell nav** — `↑/↓/←/→` to cross cells and `Shift+Arrow` to extend the selection (beyond the conformant `Tab`/`Enter` nav from UXP-2). Today arrows move the caret within the cell; P2-3 is met without this.
- 🟢 **`mdInline` per-token sidecar scans** — each `[[type:key]]` match does a linear `.find` over the node's sidecar array, so rendering is O(tokens × sidecar size) per node. Harmless at realistic pill counts (single-digit per point); a `Map` keyed by `key` in `renderContentHTML` retires it whenever a render pass is touched anyway. From the engine audit, verified still present — a perf nit, not a defect.

## Closing order (recommended)

1. **Correctness defects** — engine-audit batch closed (UXP-30…34); the durable residue is the
   **folded-coordinates invariant** (undo entries, `dataset.prevText`, and any offset that
   outlives a blur are always folded — see UXP-30/31) which future edit-path work must preserve.
   UXP-35 (caret-restore typing race) closed via the `_highlightGen` generation counter.
2. **Tier 1** (UXP-3…5) — the breaks-the-language defects. **All closed** (UXP-3 ✓ both parts, UXP-4 ✓, UXP-5 ✓).
3. **Tier 2** (UXP-6…12) — discoverability + feedback gaps. **All closed.**
4. **Tier 3** (UXP-13…19) — followed `accessibility.md`'s phase order. (All closed: UXP-13…18 plus UXP-19, the dedicated tree/grid ARIA pass — Tier 3 is complete.)

When an item closes, flip its matrix cell in `ux-discipline.md` §9 to ✅ and delete its row here. **That point has been reached:** the app speaks one language; what remains is keeping it that way (UXP-20). New defects found from here enter as new numbered rows; UXP-20 is checked against every proposal *before* it becomes a defect.
