# Pointliner — UX Remediation ARCHIVE (closed entries)

> **This is the frozen historical record.** Every entry below is **closed/resolved** and is
> retained for its decisions and regression tripwires, NOT as active work. The live register is
> `ux-remediation.md`, which holds the still-open items: **UXP-20** (the standing syntax-sprawl
> guard, which by design never closes), **UXP-237**, and **UXP-240 / 242 / 243** from the
> graph+timeline pass. Do not file new defects here; file them in `ux-remediation.md`.
>
> Status glyphs on old headings are historical: a `◐ (RESOLVED pending merge)` heading from a
> July batch long since merged reads `resolved` in its body — trust the body, not the glyph.

---

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

### UXP-192 ✓ The `{` picker completed *names* but not the grammar *forms* — **RESOLVED**
- **Problem:** UXP-9 gave callable **names** a front door, but the ~dozen content-sniffed `{…}` sub-forms (`{= expr}`, `{= sum(prop)}`, `{= words(subtree)}`, `{NdM}`, `{a|b}`, `{cond: a|b}`, `{shuffle: a|b}`, `{Nx: t}`, `{ref.mod}`, `{item.field}`, `{5 to 10}`) had **no in-place door at all** — the picker bailed the moment you typed `=`/`|`/a digit/`:`, so the app's single most distinctive surface (the composition engine) was reachable only by prior knowledge or a trip to the `?` panel. This is the exact "cheap to add, expensive to learn" divergence P5 names: the merge gate counts *new delimiters* (0) while the *blind-typed* surface compounds (an authoring-surface audit put ~half the language behind no in-place teacher). Each form did have a dialog chip / `?`-panel row, but not a door **where you author**.
- **Violated:** P2-1 ("built ≠ shipped-discoverable"), P2-2 (the menu teaches the syntax).
- **Resolved (pure cores `filterBraceForms(prefix)` + the static `BRACE_FORMS` table, pinned):** typing `{` now opens a **"Grammar forms"** group *above* the callable names — one row per `{…}` shape, the muted hint showing the exact scaffold it inserts. Applying inserts that scaffold (the **existing** shorthand the engine already promotes) with its placeholder **selected for type-to-replace** (`selectLogicalRange` / `domPointForLogical`, token/`<br>`-aware). It mints **zero new syntax** (P5-conformant *by construction*): a form types what a user could already type — it just makes the closed inventory legible at the point of use, converting most of the "documented-only" tier to "menu-inserted" without a single new delimiter. Forms filter by label **or** keyword alias (`{sum`→roll-up, `{shuffle`→deck, `{normal`→estimate). The trigger is unchanged (bare-identifier prefix or empty); once you commit to `=`/`|`/a digit you're authoring directly and the UXP-7 live-preview tooltip takes over. Same §7.1 menu contract as UXP-9 (`↑/↓`/`Enter`/`Tab`/`Esc`, `role=option`/`aria-activedescendant`, mouse via `mousedown`+`preventDefault` — caret invariant). Directly narrows the UXP-20 standing guard: the generative surface is no longer floor-only.
  The roster is the full generative surface — math, roll-up, word count, dice, pick,
  conditional, deck, repeat, modifier, item field, estimate, **query, count, roll, meter,
  markov, oracle, sequence** — kept complete by a drift guard (below), so the picker can't
  fall behind as new `{…}` families ship (the failure mode that let the surface go
  undiscoverable in the first place). `{meter: …}` is a render-time computed display (the
  `[/]`-cookie model), so it inserts and renders live rather than promoting to a token.
- **Pure cores:** `filterBraceForms(prefix)` — pinned in `tests/test.mjs` (structural invariants on every scaffold + `sel` placeholder offsets + engine-recognition of each body + prefix/alias filtering). **Drift guard (extends the GUIDE/FA_GLYPHS drift-guard family):** `BRACE_FORMS parity` asserts every picker scaffold is a recognized brace form (promotes, or is the render-time meter) **and** that the picker rosters every user-facing brace family — a promotable form with no row fails CI. `guidance/adding-an-artifact.md` step 8 now requires any new `{…}` form to register a `BRACE_FORMS` row.

### UXP-193 ✓ The `{` picker completed the *form* but not the *body* — **RESOLVED (Phases 1–2)**
- **Problem:** UXP-192 made the `{…}` *forms* discoverable, but once a body committed to a form the picker closed and left you to type the body from memory. The biggest hidden vocabulary is math: `{= …}` draws on ~70 functions (`FN1`/`FN2`/`FN3`), the child roll-ups, constants, and the doc's variables — all reachable only from the `?` panel, never at the point of authoring. IDE-style member/function completion was missing.
- **Violated:** P2-1 (built ≠ shipped-discoverable), P2-2 (teach the syntax where it's typed).
- **Resolved (pure cores `mathFragmentAt` / `mathCompletions` / `mathFnGroup`, pinned):** the `{` picker gains a **second stage** — inside a `{= …}` body it completes the math vocabulary at the caret (`checkBraceTrigger` math-mode branch; `braceApply` mid-body insert on `braceState.mode === 'math'`). A function inserts `name()` with the caret **inside** the parens (chaining: `{= sqrt(str` → `strength`); constants/variables insert bare. Grouped **Functions / Roll-ups / Conversions / Dates / Constants / Variables**. It mints **zero new syntax** (P5) — it suggests the *existing* `evalMath` vocabulary — and reuses the brace-menu wholesale (same `↑/↓`/`Enter`/`Tab`/`Esc`, `role=option`, caret invariant, P1/P3). `{= ` opens only on the first identifier letter (decision A) so the ~70-function surface never floods; a number or operator never triggers. Because `mathCompletions` derives from `Object.keys(FN1/FN2/FN3)`, a new math function is completable **by construction** — no roster to drift (a `MATH_CONSTS` drift test pins the one hand-adjacent list). Design: `guidance/brace-completion-proposal.md`.
- **Resolved — Phase 2 (search / oracle / meter):** the four body contexts unified under one DOM dispatcher `bodyCompletion(inner, node)` and one `braceState.mode === 'body'` mid-body insert. **`{query:`/`{roll:`/`{count:}`** complete **search operators** (the field prefixes `is:`/`due:`/`start:`/`has:`/`state:`/`priority:`/`var:`, the ~20 `is:` values, `due:`/`start:` date keywords, `priority:`, `state:`, `var:`, and `#tags` from `collectTags`; a leading `-` NOT is preserved; the token model is whitespace-delimited so a query's own `:`/`|` never break it) — the single biggest hidden vocabulary after math, previously only in the focus legend. **`{oracle:}`** completes the five **likelihood bands** (odds shown as the hint). **`{meter:}`** completes the point's **own property keys** (node-local — no doc index). Zero new syntax (P5): all suggest existing search/oracle/property vocabulary. Pure cores `searchTokenAt`/`searchCompletions`/`oracleCompletions`/`meterTokenAt`/`meterCompletions`, pinned; **`SEARCH_IS_VALUES` is drift-guarded** against `parseSearchQuery`'s canonical `^is:(…)$` regex, so a new `is:` value can't ship uncompletable (extends the GUIDE/FA_GLYPHS/BRACE_FORMS drift-guard family). **`has:` completes the doc's property keys** via `collectPropKeys` — the **ninth `_varsVer` doc-cache** (mirrors `collectTags`; registered in the `doc-cache invalidation` test and CLAUDE.md's registry, eight→nine). Only generic `key:value` key-completion from a bare word (vs. `has:`) is left, to avoid overlapping the field-prefix suggestions.

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

### UXP-101 ◐ No live `prefers-color-scheme` listener: an OS theme flip leaves accent tokens stale (DL §3) 🟡 (RESOLVED pending merge)
- **Problem:** nothing subscribed to `matchMedia('(prefers-color-scheme:dark)')` changes, so on System an OS theme flip left the JS-computed accent tokens (`--acc`, `--acc-fg`, `--ring`, …) at their previous-theme values until a reload, degrading contrast app-wide.
- **Rule:** DL §3, the dual-home invariant's runtime spirit ("native controls must always follow the active theme").
- **Resolved:** added one subscription beside the boot `applyTheme()`: `matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => { if (forcedTheme === null) applyTheme(); })`. On System, an OS flip re-runs `applyTheme` (which recomputes `dark` and re-runs `applyAccentCSS`), so the accent tokens follow live; a forced theme is untouched. Pinned. Verified in-browser via a live-flip (matchMedia intercept): the accent swaps `#4338ca` (light) ↔ `#a5b4fc` (dark) on flip, no reload.

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

### UXP-129 ◐ Agenda Actions row collapses NEXT (do-now) and WAITING (blocked) into one pile (P1) 🟡  [Batch 4] (RESOLVED pending merge)
- **Problem:** `collectActions` never captured the state keyword, so `#WAITING` (blocked) sat undifferentiated among `#NEXT`/`#TODO` in the "Actions" row.
- **Rule:** P1 (a state keyword reads the same everywhere).
- **Resolved:** `collectActions` now carries `keyword` + a `waiting` flag per item, sorted in three tiers (live → WAITING → done, priority within each). `mkAgChip`'s `action` kind renders a muted "Waiting" eyebrow badge (`.ag-chip.ag-waiting .ag-badge`, 10px caps per DL §4) and names it in the aria. Narrow to the built-in WAITING keyword only (no general blocked notion). Pinned. Verified in-browser: NEXT leads, WAITING follows with its badge even at priority A.

### UXP-130 ◐ No unified overdue axis; start-only slips are invisible to search (P2) 🟡  [Batch 4] (RESOLVED pending merge)
- **Problem:** `due:overdue` matched only a `due` prop; a started-but-undeadlined slip (start, no due) returned nothing, reading as "nothing overdue."
- **Rule:** P2/P5-4 (a new value in the `is:` family, the `is:failing`/`is:scheduled` precedent). Not new syntax.
- **Resolved:** added `is:overdue` to the `is:` regex + a handler arm: a not-done point whose deadline (due, else start) is before today — the unified axis spanning both keys. done-ness seq-aware via `todoDoneFromText(text, seqs)`. The existing `due:overdue`/`start:overdue` are untouched. Doors: search legend + `?`-panel + `guide/features.md` + the `is:` src-pin updated. 1 pinned test covering due, start-only, future, done, and the deadline-drives cases. Verified in-browser: `is:overdue` matches the overdue due AND the started slip, excludes future/done.

### UXP-131 ◐ `key:value` search can't match a spaced value (P2) 🟡  [Batch 4] (RESOLVED pending merge)
- **Problem:** the top-level tokenizer split `owner:"Jane Doe"` on the interior space, so a spaced/free-text property value was storable but unsearchable.
- **Rule:** P2 (a storable value should be filterable). Zero new syntax (reuse the existing `"…"` phrase quoting).
- **Resolved:** extended the `parseSearchQuery` lexer regex to capture `key:"…"`/`key:'…'` as one token BEFORE the bare-phrase and word arms; it emits a `prop` term with `contains:true`. The `prop` handler in `termMatchesNode` now matches by `.includes()` when `contains` is set (bare `key:value` stays exact-equals). `is:` stays reserved (never a prop). This also fixes the `@errands` leading-sigil case (quote it). Doors: legend + `?`-panel + properties concept-guide. 5 pinned tests (spaced token, single quotes, is:-reserved, bare-unchanged, contains-vs-exact match). Verified in-browser.

### UXP-132 ◐ Agenda has no sort/group control beyond date (P2, low-end medium) 🟡  [Batch 4] (RESOLVED pending merge)
- **Problem:** the List hard-sorted by date, so an `[#A]` due in three days always sat below a no-priority item due tomorrow, with no priority-first toggle from inside the strip.
- **Rule:** P2 (a reasonable view the feature that owns the job can't produce).
- **Resolved:** added an `agendaSort` state ('date'|'priority') + a "Sort: date"/"Sort: priority" toggle in the agenda filters (built with `mkAgToggle`, persisted in the autosave payload + restored in `applyAutosaveData`). `renderAgendaList`'s Due/Running comparators branch on it (priority-first with date as the tiebreak; done still sinks). Always-visible. Verified in-browser: flipping to priority orders `[#A]` before `[#C]` despite a later due date.

### UXP-133 ◐ Bulk action bar lacks Refile (P1) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** `#node-sel-bar` had no Refile, so re-homing many captured points was one at a time.
- **Rule:** P1 (refile should behave the same for one or many).
- **Resolved:** added a Refile button to `#node-sel-bar` → `openBulkRefileDialog` (reuses `buildTreePicker`, now with an `excludeIds` Set threaded through `treeRows` so all selected roots are excluded as destinations). A pure `selectionRoots(ids, pmap)` helper drops any selected node with a selected ancestor (the REQUIRED overlapping-roots dedupe, via `parentMap`), and `refileNodesTo(ids, targetId)` moves all roots in ONE `pushUndo`/`render`/toast, each guarded by `isDescOf`. 2 pinned tests. Verified in-browser: selecting A,B,Parent,Child deduped to [a,b,p] and moved them into the target intact (Parent kept its child), root left with just the destination.

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

### UXP-137 ◐ No way to freeze a rolled pill to plain text (P2/product, solo) 🟡  [Batch 5] (RESOLVED pending merge)
- **Problem:** a display-mode mis-tap re-rolls a committed journal beat; the only escape was a full flattening export.
- **Rule:** P2/product (a missing affordance; recoverable via `pushUndo`, so medium not P4).
- **Resolved:** factored a shared pure `frozenTokenText(type,key,node,varMap)` out of `flattenArtifacts` (both now call it, so they stay in lockstep — pinned). Added a "Freeze to text" row to every pill type in `collectPillActions` (dice/grammar/math/est/markov/pick-var), calling `freezePillToText(node,type,key)`: it splices just that `[[type:key]]` occurrence to its frozen value, `pruneArtifacts` drops the orphaned sidecar, wrapped in `pushUndo` + `announce`. Display-mode only (where the pill actions open), so no unfold-buffer handling needed. Verified in-browser: a `[[dice:…]]` froze to "2d6 = 9" and its record was dropped.

### UXP-138 ◐ A spent `once` deck pops as if it drew (P4) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** clicking an exhausted `once` deck ran `pushUndo`/`markDirty` + re-added `.gr-rolled`, firing the pop on a non-event while the title read "Click to advance."
- **Rule:** P4 (feedback fires on a non-event).
- **Resolved:** `rerollGrammar` short-circuits a spent `once` deck (`g.mode==='once' && (g.pos||0) >= g.items.length`) with a `flashHint('Deck spent')` and no state change / no pop. `renderSeqGenPill` reads "spent" (title + aria) instead of "Click to advance" once ended, and shows `(spent)` in the aria value. `shuffle`/`cycle`/`stopping` untouched. Verified in-browser: a spent once deck reads "spent"; a live one still says "advance".

### UXP-139 ◐ A natural max die roll looks like any other number (experience polish) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** a natural max face rendered as a bare number, indistinguishable from a 3.
- **Rule:** product/experience (optional; whisper-level, must clear the DoD gate).
- **Resolved (pursued):** `diceBreakdownHTML` adds a `.dice-max` class to a face when ANY face in the chain equals `p.sides` (an exploding die's last face is never the max) AND the die is kept + non-rerolled + numeric-sided. Its own whisper cue (accent ink + a 1px underline, NOT `.dice-hit`'s accent-700 which means a pool success, per DL §1). Decoration only; the value stays full-contrast. Verified: a d6's 6 gets `.dice-max`, a 3 doesn't.

### UXP-140 ◐ The yes/no oracle answer has no valence (experience polish) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** "Yes," "No," "Yes, and," "No, but" all rendered identical neutral, so the oracle beat landed as data.
- **Rule:** product/experience (optional).
- **Resolved (pursued):** the oracle dialog sets `roll.oracle = true`; `renderGrammarPill` adds `.gr-yes` (leading Yes) or `.gr-no` (leading No) to the `.gr-result` span ONLY when `g.oracle` (no content-sniff on non-oracle grammar). The plate tints `color-mix(--ok 16%)` for Yes, `color-mix(--muted 16%)` for No (a No is not an error, so not `--warn`); the ink stays full-contrast `--fg`. Verified in-browser: Yes → green plate, No → muted plate, ink `--fg`, plain grammar untouched.

### UXP-141 ◐ A `shuffle` deck nested in a rule silently degrades to a stateless pick (P1, doc-only) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** folding `{shuffle:…}` into a named rule quietly makes it a uniform pick, so the no-repeat guarantee drops with no signal.
- **Rule:** P1 (a construct's guarantee changes by context invisibly).
- **Resolved (doc-only):** added the caveat to both `oracle-play.md` (the meaning-table deck section) and `generating-text.md` (the decks section): a deck draws without repeats only as its own standalone pill; nested in a rule it becomes an ordinary pick. No engine/detection change.

### UXP-142 ◐ No in-app acknowledgement that tasks don't recur (P2, expectations copy) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** nothing said a completed dated task stays put and tasks don't roll forward, so a user infers recurrence works.
- **Rule:** P2 (set honest expectations).
- **Resolved:** added an honest AP-style sentence to the agenda GUIDE body and `guide/dates-and-planning.md`: "A completed dated point stays where it is, and tasks do not repeat on their own yet, so a recurring task is one you re-date by hand." (The `repeat`-property build stays the `backlog.md` feature.)

### UXP-143 ◐ Keyboard state-cycle to done gives no "now hidden" notice the mouse paths give (P1, low) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** the keyboard `Ctrl/⌘+Shift+S` cycle branch never called `flashHiddenIfDone`, while all three mouse/menu commit paths did — an inconsistent "done, now hidden" cue.
- **Rule:** P1 (mouse and keyboard commit paths give different feedback).
- **Resolved:** unified at `exitEdit` (the one chokepoint every text commit passes through), NOT the keystroke: it computes `wasDone` from `prevText`, and after recomputing `node.checked`, calls `flashHiddenIfDone(node, wasDone)` so a point that just became done and will be hidden (show-done off) flashes the notice once — covering the keyboard cycle, typing `#DONE`, etc. No over-notification while mid-edit (it fires only on the commit). `#DONE` derives `node.type==='todo'`, so `isVisible` correctly gates the hide.

### UXP-144 ◐ `Alt+1–9` doc-tab jump is absent from the §3 keyboard-grammar table (§3 completeness, low) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** the §3 keyboard-grammar table listed the sibling `Ctrl/⌘+Shift+]`/`[` tab-cycle but omitted bare `Alt+1–9`.
- **Rule:** §3 keyboard-grammar table completeness (not P5-4).
- **Resolved:** added the `Alt+1–9` row to the §3 table beside the tab-cycle line, with the note that `Alt` is elsewhere the point-movement modifier so this overloads it onto navigation — an accepted convenience, flagged as an owner grammar decision if it ever bites (binding unchanged).

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

## Query expansion — missing search operators (2026-07-02): QX-1…6

*Numbering note: these carry the standalone **QX** code (query expansion). They were first registered as UXP-145…148, but that number space now belongs to the parallel review track, so the QX code vacates it (2026-07-02, owner call).*

*A data-model-vs-grammar analysis of the search subsystem (four parallel readers mapping structure, artifacts, dates/numbers, and grammar symmetry against the pure `parseSearchQuery`/`termMatchesNode` cores; every candidate adversarially verified against the actual code, 15 confirmed of 23, 8 refuted). Part of the query-expansion effort. These are **planned additions, not defects**: the grammar is conformant, these grow its vocabulary. Each reuses the existing field-prefix pattern (`is:x`, `has:x`, `kind:value`), so none mints new syntax (P5 holds); QX-2 and QX-4 are the sanctioned syntax-inventory growth decisions (a value-vocabulary add and an operator add), recorded like UXP-20/109/113/130. Code seams cited by symbol; the `is:` whitelist regex is at `parseSearchQuery` (grep `is:(done|todo|note`), the `has:`/`is:` matcher arms in `termMatchesNode`.*

### QX-1 ✓ `is:`/`has:` structural + artifact + symmetry filters 🟢 (batch 1, trivial) (RESOLVED: PR #307)
- **Gap:** structure and generated content are settable but unqueryable. Confirmed missing (no arm parses them today), all pure reads of the node object:
  - **`is:passing`** — `evalCheck(node, vars) === 'pass'`. The symmetry fill for the shipped `is:failing`. NOT the same as `-is:failing`: `evalCheck` returns `null` for check-less points, so `-is:failing` also matches un-checked points, `is:passing` does not. Reuses the `evalCheck` core already threaded into the matcher.
  - **`has:dice|markov|math|grammar|est|var|seq`** — the sidecar array (`node.dice` … `node.seq`; `var`→`vars`) is non-empty. Sidecars are pruned on `exitEdit`, so non-empty means a live pill. Falls through to the existing `props.some` scan, so a user property literally keyed `dice` still matches (the `has:<propkey>` contract holds).
  - **`is:pill`** — union of all seven sidecars (any artifact at all). Homed in the closed `is:` family, NOT `has:` (`has:pill` already parses as a property-key lookup, overloading it breaks the contract).
  - **`is:random`** — the generative subset (dice/markov/grammar/est plus `vars` with `kind:'pick'`); points that re-roll on click. Excludes math and display-only vars.
  - **`has:children` / `is:leaf` / `is:parent`** — `node.children.length`. `is:leaf`/`is:parent` are the negation-friendly pair; `has:children` the has-family completeness spelling (same predicate as `is:parent`).
  - **`has:footnote`** — `node.footnotes` non-empty. Distinct field from `node.note` (which `is:note` reads), so genuinely unqueryable. Reserve the word before the `props.some` scan.
  - **`is:collapsed` / `is:expanded`** — `node.collapsed` boolean (round-trips via `_collapsed`). Transient fold state, so medium value, but a trivial pure read.
- **Target (small, one PR):** widen the one `is:` whitelist regex to add `passing|pill|leaf|parent|collapsed|expanded|random`; the `has:` tokens need NO parser change (they already match the `has:` regex). All matcher edits live in the existing `is:` and `has:` arms of `termMatchesNode`: the `has:` arm gains a sidecar-map lookup + children + footnote checks BEFORE the `props.some` scan (fall through preserves `has:<propkey>`). One test-pin block over synthetic nodes (each sidecar populated, collapsed, leaf vs parent, footnoted, passing vs failing vs check-less, a pick-var node); ensure `termMatchesNode`/`queryMatchesNode`/`evalCheck` are in `load-cores` `need`.

### QX-2 ✓ Relative date windows `due:week|month`, `start:week|month` 🟡 (batch 2, small) — SANCTIONED SYNTAX-INVENTORY GROWTH (RESOLVED: PR #308)
- **Gap:** `due:`/`start:` support `today`/`overdue`/`YYYY-MM-DD`/`<date`/`>date` but no forward day-count window. `is:scheduled`/`overdue` do not cover "due within the next 7/30 days".
- **Target (small):** in the existing `due`/`start` parser arm, when `dval` is `week` or `month` push `op:'window'` with `epochDay = dueDateToday() + (week?7:30)`; in the matcher add an `op:'window'` branch returning `ep >= dueDateToday() && ep <= term.epochDay`. Pure integer range compare, reuses `parseDueDate` + the epoch-day machinery, NO new sigil (new value tokens in an existing operator vocabulary, the recorded P5 sign-off case). Pin the window compare against a stubbed `dueDateToday()`.

### QX-3 ✓ `var:NAME` declaration lookup 🟡 (batch 2, small) (RESOLVED: PR #308)
- **Gap:** no way to find the point that DECLARES a variable. New `kind:value` operator like `state:`/`priority:`.
- **Target (small):** new parser arm BEFORE the generic prop arm (placed like `priority:`), producing `kind:'var'`; matcher branch returns true if any `node.vars` entry has a truthy `expr` (the declaration test `collectVars` uses) and a `name` matching `term.value`, so it matches the declaring point, not display-only reference pills. Pin true on a declaring node (expr set), false on a reference-only node.

### QX-4 ✓ Numeric comparison on properties `key:>N` / `<N` / `>=N` / `<=N` 🟡 (batch 3, medium) — SANCTIONED SYNTAX-INVENTORY GROWTH (RESOLVED: PR #309)
- **Gap:** the highest user value of the set (quantitative filtering, `cost:>100`), and the one real parser extension. `key:value` is **exact-only** today (the generic prop arm requires a bare-word value), so `>N` fails that regex and falls to literal text. The comparison ops exist for `due:`/`start:` but only as DATE compares; this is a new numeric-property axis.
- **Target (medium, ships alone):** a genuinely new parser arm before the generic prop arm matching `key` + a comparison op + a signed decimal (`key !== 'is'`, two-char ops `>=`/`<=` ordered first for longest-match), producing `kind:'propnum'`. Matcher: find `node.props[key]`, `Number(val)`, reject non-finite (skips date strings and words), compare by op. Mirrors the numeric-first parse `childPropNumber`/`nodePropVars` already use. Mandatory test pin: all four ops, longest-match on `>=` vs `>`, negatives, decimals, and the matcher rejecting `cost foo` / a missing prop / a date-shaped val without throwing. Focused review for parser precedence.

### QX-5 ✓ `OR` disjunction: a standalone `|` splits AND-clauses 🟡 — SANCTIONED SYNTAX-INVENTORY GROWTH (RESOLVED: 2026-07-02)
- **Decision reversed from the deferral below (owner call, 2026-07-02).** The two blockers eroded: (a) `|` is the app's own alternation glyph (`{a|b}` grammar alternates, sequence declarations, markdown tables), so reusing it in search grows no sigil, and by the reuse-the-authoring-language rule it beats any alternative (an uppercase `OR` keyword would force case-sensitivity into a case-insensitive grammar); (b) the matcher-rewrite risk that justified deferral is retired by the behavioral pins QX-1…4 added.
- **Grammar:** a standalone spaced `|` splits the query into clauses; terms inside a clause AND; the query matches when ANY clause does. OR binds looser than the implicit AND; no grouping (parens deferred until real queries demand them, the same rule OR itself lived under). A glued `a|b`, a negated `-|`, and a quoted `"|"` all stay literal text (the escape hatch); an **empty clause** (leading, trailing, or doubled pipe) is **dropped, never auto-true**, so a stray pipe can never make a query match everything (P4).
- **Implementation:** a `{kind:'or'}` marker in the FLAT term list (`parseSearchQuery`); the clause split lives inside `queryMatchesNode`, so every caller (applySearch, the workspace search including its `needsCtx` lazy-context guard, `searchHighlightNeedles`) is unchanged. **Meaning change:** a saved search storing `a | b` used to require a literal pipe character and now means OR; the quoted `"|"` remains the literal form.

### QX-6 ✓ Link and tag presence filters: `has:link` / `has:tag` (pure) + `has:backlink` / `is:broken` (threaded index) 🟡 (RESOLVED: 2026-07-02, same PR as QX-5)
- **Correction to the original deferral:** `has:link` (an outgoing `[[#id|…]]` token in `node.text`) and `has:tag` (any hashtag sigil in the link-blanked text, the tag matcher's own regex) are PURE node reads, no index needed; the deferral over-generalized. Only `has:backlink` and `is:broken` need `collectLinks`, and the threading precedent already exists twice: `termMatchesNode` already receives `seqs` (for `is:done`) and `vars` (for `is:failing`), both cached collectors; `collectLinks` is generation-cached AND takes an optional `rootNode`, exactly what the workspace search's per-doc `needsCtx` pattern requires.
- **Target (small):** `links` as a fourth context param defaulting to the cached `collectLinks()`; the `has:` reserved words follow the QX-1 fall-through contract; extend `needsCtx` for link terms; pins for all four.

**Refuted candidates (considered, rejected by adversarial verify — kept so they are not re-proposed):** `is:note` reforms (already shipped); `has:note`/`is:has-note` (dup of `is:note`); `type:todo` (dup of `is:todo`); `has:tag`/`is:tagged` and `has:link`/`is:broken-link` (need the doc-wide `collectTags`/`collectLinks` index, NOT reads of the node object `termMatchesNode` is handed, so not pure-cheap — see deferred); `has:priority`/`priority:none` and `due:soon` (rate-limited before verdict, re-verify if pursued); a bare `is:heading` without a level (weaker than a `type:hN`, deferred pending demand).

**Deferred (real, NOT low-hanging):**
- **`OR` / disjunction** — was the one genuine structural grammar gap; the deferral was REVERSED and shipped as **QX-5 above** (2026-07-02). The original reasoning is kept for the record: it assumed the token must be new punctuation and the matcher must become a boolean tree; in practice `|` reuses the app's alternation glyph and a flat clause-split inside `queryMatchesNode` sufficed.
- **Tag / link presence filters** (`has:tag`, `has:backlink`, `is:broken-link`) — the read is doc-wide (`collectTags`/`collectLinks`), not available to `termMatchesNode` as handed. Feasible but needs threading the index in, so a separate design decision, not a one-liner.

**Batch + register plan:** QX-1 = batch 1 (one PR, one regex widen + two existing arms). QX-2 + QX-3 = batch 2 (relative windows + `var:`, one PR, both small new-arm changes). QX-4 = batch 3 (numeric compare, ships alone for focused parser-precedence review). **Docs each batch must freshen in the same change:** the `?` panel Search rows (grep the `is:todo`/`is:done` `sh-row`), the GUIDE array search entry (`covers:['search']`, the drift-guard requires every typed operator appear), the focus-shown search legend under the box, `guide/getting-around.md` search section, `guide/features.md` (user inventory) + `guidance/features.md` (engine reference), and the test pins in `tests/test.mjs` + `load-cores.mjs`.

## Seven-persona design review (2026-07-02, THIRD blind pass) — UXP-145…159

A third BLIND re-audit run after Reviews 1 (UXP-102…120) and 2 (UXP-121…144) shipped: same
seven-persona fleet, no knowledge that any prior review happened, told NOT to mine this ledger, and
explicitly told the app is mature and a short honest list is the right outcome. **21 raw → 15
survived adversarial verification, 6 refuted.** No high-severity findings; three mediums, the rest
low. The verify pass reframed several fixes away from hard-rule violations (a sequence `||` split, a
`[/subtree]` cookie marker, tightening `parseTodo`) toward zero-syntax alternatives, and flagged two
findings whose only honest fix is a **model extension needing owner sign-off** (logged below as
DECISION-PENDING, not batched). Recurring theme: **provenance divergence** — the same content renders
differently by which door made it (oracle tint, est debut). Second theme: **silent-truncation /
dead-end states** that confirm a non-event without teaching the next step.

### UXP-145 ◐ Oracle valence tint is dialog-only; the recommended demo imports flat (P1/P5, solo) 🟡  [Batch 1] (RESOLVED pending merge)
- **Problem:** the `.gr-yes`/`.gr-no` valence plate (UXP-140) was gated on a stored `g.oracle` flag set only by `openOracleDialog`, so typed shorthand and imported oracles (incl. the shipped demo) rendered untinted.
- **Rule:** P1/P5 (same content, same render).
- **Resolved:** added a pure `isYesNoOracle(g)` content-sniff — parses the origin rule's alternatives and tints only when EVERY alt leads with `/^(yes|no)\b/i`. `renderGrammarPill` now gates the plate on the sniff, not the flag, so typed, imported, and dialog-made oracles tint identically. Dropped the now-dead `roll.oracle` set. A trap case (result starts "Yes" but an alt is "Maybe") correctly stays untinted (family-level, not result-level). Ink stays `--fg`; whisper `--ok`/`--muted` plates unchanged. Pinned (`isYesNoOracle`). Verified in-browser: the shipped demo's weighted swing oracle now shows the green plate.

### UXP-146 ◐ Whole-folder search silently truncates at 50 with a count that reads complete (P4) 🟡  [Batch 1] (RESOLVED pending merge)
- **Problem:** `searchWorkspace` hard-caps at 50 and `renderWorkspaceSearchResults` read `Found in other documents · ${results.length}` with no truncation signal, so a planner could conclude they had seen everything.
- **Rule:** P4 (no silent success/failure).
- **Resolved:** `searchWorkspace` now sets `out.capped = true` when it hits the cap (a property on the returned array — items and iteration unchanged, the sole caller reads it), and `renderWorkspaceSearchResults` renders `· 50+` when capped. A trust signal, not data loss (every hit is still reachable via full in-doc search after jumping in). Pinned (cap-flag on/off). Verified in-browser: 60 matches → `Found in other documents · 50+`.

### UXP-147 ◐ Default-tier users can't recover an unnoticed destructive edit after reload/crash (P4/service) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** autosave overwrote ONE `AUTOSAVE_KEY` slot in place with no rolling history, so a destructive edit the user didn't notice in-session, then a reload/crash, took the only recovery path with it.
- **Rule:** P4 (the in-session Ctrl+Z promise should survive a reload).
- **Resolved:** `writeLocalAutosave` now rolls the OUTGOING value into a `pointliner_autosave_prev` slot before overwriting, throttled to once per `SNAPSHOT_EVERY_MS` (5 min) so the snapshot trails the live state by that window, and skipped past `STORAGE_SOFT_LIMIT` (the folder tier covers big docs). A "Restore earlier version" File-menu row (shown only when `hasEarlierVersion()`) calls `restoreEarlierVersion()` → `applyAutosaveData(prev)` behind the same `unsavedToDisk()` confirm New/Open use. O(1) storage, no backend. Verified in-browser: the outgoing state lands in the prev slot, the throttle holds a second write, the row appears, and the restore swaps the doc. (Left the OPFS-mirror snapshot to the same slot; localStorage is the always-present sink and the restore reads it — a second OPFS prev-slot is redundant for the default tier this targets.)

### UXP-148 ◐ Examples doc is a destroy-on-first-contact one-shot; the promised re-entry was never built (P2/service) 🟢  [Batch 2] (RESOLVED pending merge)
- **Problem:** the live Examples doc showed only on fresh boot and was destroyed on the first keystroke, with no re-entry despite the `maybeShowFirstRun` comment promising one.
- **Rule:** P2 (honor the code's own stated intent).
- **Resolved:** added a `btn-examples` File-menu row ("Examples" / "Open the sample document to explore what pills can do") → `openExamples()`, which runs `adoptDoc(fromOpml(FIRST_RUN_EXAMPLES), {fileName:'unsaved'})` with the `_adoptingExamples`/`_showingExamples` flags exactly as `maybeShowFirstRun`, behind the same `unsavedToDisk()` confirm New/Open use, then reshows the examples banner. Uses the in-subset `fa-dice-d20` glyph (ties the row to the generative pills it teaches). Verified in-browser: the row opens the clickable sample doc. Corrected the `maybeShowFirstRun` comment's promise, now kept.

### UXP-149 ◐ est pill debut announce drops its result; thinner than a re-roll (P4) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** the est debut announced only `Estimate ${expr}`, thinner than every sibling and thinner than a re-roll of the same pill.
- **Rule:** P4 (consistent feedback across the pill family).
- **Resolved:** `announceDebut` gained an optional `node` param; its est branch now samples via the same `sampleUncertain(expr, EST_N, seed, node) → distSummary` one-liner `rerollEst` runs, announcing `Estimate ${expr}: ${mean} (${p5} – ${p95})`. The est insert site passes the node. No pop (UXP-110 stands). Verified in-browser: a `3 to 8` est debuts as "Estimate 3 to 8: 5.16 (3.11 – 8.24)".

### UXP-150 ◐ Spent `once` deck toast withholds the reset route (P2, copy) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** a spent `{once:…}` deck's "Deck spent" toast + "spent" title withheld the recovery route (the `.gr-edit` pencil → `openDeckDialog` resets it).
- **Rule:** P2 (a dead-end toast should point at the door).
- **Resolved (copy only):** the spent-deck flash reads "Deck spent. Edit it to reshuffle"; the pill title/aria read "Spent. Edit to reset". No new gesture (the UXP-138 dead-click stands). Corrected the stale "NO pencil" comment at `renderSeqGenPill`'s header (the pill DOES have a `.gr-edit` pencil). Verified in-browser.

### UXP-151 ◐ Priorities above C render as uncolored chips (P5/graphic, importer) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** `[#D]`/`[#Z]` sorted and filtered first-class but had no hue (CSS had only `.todo-prio-a/-b/-c`), so out-of-range letters read as plain text.
- **Rule:** P5 (a consistent chip system).
- **Resolved:** the base `.todo-prio` now carries a muted `color-mix(--muted 16%)` background + `--muted` ink, so any letter reads as a priority chip; the `.todo-prio-a/-b/-c` variants (same specificity, defined later) override with their bad/warn/info hues, so A/B/C are unchanged. Did NOT tighten `parseTodo` (that would drop `[#D]` on import). Verified in-browser: `[#D]` is muted, `[#A]` keeps `--bad`.

### UXP-152 ◐ Non-FSA save status line says "saves to file" but downloads a copy (P1/P4, copy) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** on the non-FSA tier `Ctrl+S` downloads a fresh copy, but the status read `… ${fmtKey('S')} saves to file`.
- **Rule:** P1/P4 (an accurate status line).
- **Resolved:** the `dirty` branch of `updateFmStatus` now splits on `hasFSA`: FSA tiers keep "saves to file"; the non-FSA tier reads "downloads a copy". One-string change, no architecture. Verified both strings present in the DOM.

### UXP-153 ◐ Toggle buttons flip their accessible NAME while also carrying aria-pressed (P3) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** `#btn-notes`/`#btn-done` flipped their `aria-label` with state while also carrying `aria-pressed`, so AT announced e.g. "Hide notes, pressed" (self-contradicting); the other three toolbar toggles kept a stable name.
- **Rule:** P3 (a coherent toggle-button a11y model).
- **Resolved:** `#btn-notes` and `#btn-done` now have stable state-neutral names ("Notes", "Done points") in the HTML; `syncNotesBtn()`, the `#btn-done` click handler, and the `applyAutosaveData` restore all stopped rewriting the name and let `aria-pressed` + `.active` carry state, matching the three conforming siblings. Additive ARIA only, no activation change. Verified in-browser: toggling keeps the name stable and only flips `aria-pressed`.

### UXP-154 ◐ Four eyebrow labels drift off the locked .07em tracking (design-language §4) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** four caps eyebrows drifted to `.06em` off the one `.07em` recipe.
- **Rule:** design-language §4 (one eyebrow recipe).
- **Resolved:** converged `.io-field label`, `.guide-nav-group`, `.agg-today-lbl`, `.agg-hover-lbl` to `.07em`; also converged `.cal-dow span` (a caps day-of-week label at `.05em`, the same recipe drifted further). Left `.todo-state`/`.todo-prio` (a `.72em` chip, different component) alone, and documented `.collapse-count`'s `.05em` as an intentional numeric-badge micro-context (a tabular-num count, not caps text). Verified in-browser: `.io-field label` computes to 0.7px. 25 selectors now honor `.07em`.

### UXP-155 ◐ est sparkline uses px letter-spacing inside an em type system (P5/design-language §2) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** the est sparkline tightened glyphs with an absolute `-.5px` in an otherwise relative type system, so it didn't scale when a pill sat in a heading.
- **Rule:** P5 / design-language §2 (relative type units).
- **Resolved:** `.est-pill .est-spark` and `.est-preview-spark` now use `letter-spacing:-.03em` (≈ -.5px at 17px body, scales with context). Verified in-browser: computes to -0.51px at body size, and now scales up in a heading. No px tracking left in the em system.

### UXP-156 ◐ Row-level surfaces carry a bare 4px radius that belongs to no §4 recipe (design-language §4) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** `.node-row`, `.node-selected>.node-row`, `.node-cursor>.node-row`, `.drop-child-hi>.node-row>.node-content`, and `.fm-title` carried an eyeballed 4px between the ladder's 3px and 6px, blessed by no §4 recipe.
- **Rule:** design-language §4 (the radius ladder).
- **Resolved:** moved all five row-level surfaces onto `var(--r-sm)` (6px). The sanctioned badge/keycap 4px literals (conformant-by-spelling) are untouched. Verified in-browser: `.node-row` computes to 6px. Skipped the optional `--r-chip:4px` token (not required).

### UXP-157 ◐ `--ring` alpha disagrees between its two homes (tidiness, not an invariant breach) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** the `:root`/dark `--ring` fallbacks used `.2` while the live `applyAccentCSS` value (which always wins) uses `.25`, so a reader of the static CSS saw the wrong effect.
- **Rule:** none breached — bottom-of-low tidiness.
- **Resolved:** raised both static `--ring` fallbacks (light + dark `:root`) to `.25` to match the live `applyAccentCSS` value, so what renders and what the static CSS shows now agree. No user-visible change (the live `.25` already won). Verified: `--ring` resolves to `.25`.

### UXP-158 ◐ Custom sequences only treat literal WAITING as blocked (P1) 🟢 [Batch 5] (RESOLVED pending merge — OWNER APPROVED the model extension)
- **Problem:** `collectActions()` hardcoded `waiting: keyword === 'WAITING'`, so a custom sequence's own blocked state (e.g. BLOCKED) surfaced as a live next-action.
- **Owner decision (approved):** WAITING was confirmed an **org-mode artifact** (`TODO_STATES = ['TODO','NEXT','WAITING','DONE']`, an `Org-style` header, the canonical `#+SEQ_TODO` shape). The blocked meaning was the ONE string hack; badge/icon/color were already generic per-keyword machinery. Approved the `heldFrom` model extension.
- **Resolved:** `parseSequence` now accepts an OPTIONAL second pipe — `active | held | done` → `{states, heldFrom, doneFrom}`; a one-pipe sequence has `heldFrom === doneFrom` (no held band, unchanged). The default sequence sets `heldFrom` to WAITING's index (behavior-identical). New `keywordIsHeld(kw, seqs)` reads the `[heldFrom, doneFrom)` band structurally; `collectActions` uses it, dropping the `=== 'WAITING'` string. `seqDefString`/`renderSeqPill` render the middle pipe; the `_seq` OPML attribute round-trips `heldFrom` (JSON). The dialog label/hint, the `@`-menu desc, the GUIDE body, and `guide/tasks-and-organizing.md` teach the held band. 3 new pins (parseSequence 3-band, keywordIsHeld, seqDefString round-trip). Verified in-browser: a custom `Flow: DOING | BLOCKED | SHIPPED` flags `#BLOCKED` as waiting; the built-in WAITING is unchanged; the pill shows two pipes.

### UXP-159 ◐ Subtree rollups / progress cookies stop at direct children (P2) 🟢 [Batch 5] (RESOLVED pending merge — OWNER APPROVED, extended to ALL rollups)
- **Problem:** every child-scoped rollup (`sum/avg/count/min/max`, `[/]`/`[%]` cookies, the uncertain rollup) reached only direct children, shallow on a deep tree.
- **Owner decision (approved):** extend the existing `words(subtree|self|children)` scope vocabulary to a shared depth notion, **BOTH a keyword AND an optional number** (owner: "extend the courtesy to anything that can use it").
- **Resolved:** a shared pure core — `resolveScopeDepth(token)` (self→0, children→1, subtree→∞, N→N, junk→null) + `collectScoped(node, depth)`. Threaded through EVERY child-scoped op: `aggregateChildren` (`sum(cost, subtree)` / `sum(cost, 2)`), the uncertain Monte-Carlo rollup (`sum`/`avg` in the est DSL), `progressCount` (`[/subtree]` / `[/2]` cookies, both the render and flatten paths + the ancestor-refresh walk), and `words()` (now also `words(2)`). Bare forms are 100% unchanged (default depth 1). An unrecognized scope stays literal → #ERR (P4, never a silent wrong depth). 6 new pins (resolveScopeDepth, collectScoped, agg depth, expandAggExpr depth, words depth, progressCount depth). Verified in-browser: `sum(cost, subtree)`, `[/subtree]` (1/2 vs 2/3 by depth), all consumers.

### Closing order (Review 3)

1. **Batch 1 — the two mediums with user reach (UXP-145, 146).** Oracle valence content-sniff (the recommended demo renders flat — highest solo leverage) and the workspace-search truncation signal (a trust break on the planner's hardest query). Both zero-syntax, both need an in-browser check + a pin.
2. **Batch 2 — durability + the promised door (UXP-147, 148).** The pre-overwrite autosave snapshot + "Restore earlier version" row, and the Examples File-menu re-entry the code comment already promises. Heaviest batch (new storage slot + new File-menu surfaces); share the `unsavedToDisk()` confirm.
3. **Batch 3 — feedback + copy + a11y (UXP-149, 150, 151, 152, 153).** est debut parity, the spent-deck reset copy, the priority-chip neutral fallback, the non-FSA status reword, the toggle-button aria-pressed unification. Small, mostly one-string or one-rule each.
4. **Batch 4 — token convergence (UXP-154, 155, 156, 157).** The four `.06em` eyebrows → `.07em`, the est sparkline px → em, the row-radius leak → `--r-sm`, the optional `--ring` alpha align. Pure CSS convergence onto locked tokens; lowest urgency, do as one sweep.
5. **DECISION-PENDING (UXP-158, 159).** Not batched — surface to the owner. Each needs a model/inventory extension with P5 sign-off, not a code fix. Left here as recorded decisions.

---

---

## Query pill (2026-07-02): QP-1 shipped, QP-2 shipped (through Phase C)

*The query pill is the inline sibling of the future "bases as queries". Both are **renderings of the live data, not a stored view**, which is what puts them in scope: the roadmap parks a saved-views DATABASE layer, not a rendering of a search. The out-of-scope decision was reversed narrowly (owner call, 2026-07-02): renderings-of-a-search are in; a views DB stays parked. Recorded like the QX-5 OR reversal.*

### QP-1 ✓ Query pill: `{query: <search>}` renders a live embedded search 🟡 — SCOPE REVERSAL + NEW ARTIFACT (RESOLVED: 2026-07-02)
- **What:** a `[[query:KEY]]` artifact (sidecar `node.query = [{key, expr}]`) whose body is a normal search string. It renders a live list of matching points as links (capped at 10 with a `+N more`), recomputed every render, never stored. Zero new query language: it reuses `parseSearchQuery`/`queryMatchesNode` verbatim, so all 22 operators + OR compose inside it.
- **The shared core (the reason to build it now):** the pure `queryRows(expr, root, hostId, cap)` walks the tree and returns `{rows, total, truncated}`, excluding the host point (a query never lists itself). The pill is a thin renderer over it; **QP-2's query-base view reuses the same core**, so "bases as queries" is later a VIEW over an existing seam, not a reimplementation.
- **Re-entrancy:** the pill renders point TITLES only (`stripMd(textForDisplay)`), never re-entering `mdInline`, so unlike the link mirror it needs no save/restore guard. The render globals (`queryRenderList`) still thread through `renderContentHTML`/`renderNodeInline`/`mtInline` for the sidecar lookup.
- **Doors (P2):** the `@ Query` insert command (a dialog with a live match-count preview), typed `{query: expr}` promotion on exit (`queryParts`/`promoteBraceBody`), and edit via the pill's pencil or body-click (`editQuery`); a result link click navigates (reuses the `.node-link`/`followNodeLink` path). Atomic in edit mode (like seq). OPML round-trips via `_query`; pruned by `pruneQueries`.
- **Pins:** `queryRows` (cross-tree match, host exclusion, empty query, cap+total, full-grammar compose) and `queryParts` (sniff, empty/keywordless rejection, classify→artifact). Live-verified: render, result navigation, OPML round-trip, self-reference exclusion, typed promotion, empty state.

### BV-3 ✓ The calendar view (SHIPPED 2026-07-02)
- `{kind:'calendar', dateBy}` (the first FR-1 date column; guard flashes the fix when none). Pure
  core `calBaseItems` (strict parseDueDate; invalid/blank rows returned as `undated` and surfaced
  in a strip, the §0 P4 rule); reuses `agendaMonthCells`/`calendarMonthGrid`/`CAL_DOW`; month
  anchor session-only per node; nav + Today buttons; chips via mtCellHtml (query-base links
  navigate; the pill/link gates include `.cv-chip`).

### BV-2 ✓ The cards view (SHIPPED 2026-07-02)
- The reading view: rows as cards in a responsive grid (`buildCardsWidget`, `{kind:'cards'}` in
  `node.view`, no config). Cards paint through `mtCellHtml` so roles/pills/images compose; the pill
  click-gate widened to `.bv-card`/`.gv-card` so a per-cell grammar pill re-rolls IN a card (board
  cards inherit the same fix). Read-only on authored and query bases alike; images paint as covers.

### BV-1 ✓ The board view + the view system (SHIPPED 2026-07-02)
- The flagship view under the base-views-vision §0b thesis: lanes are the user's OWN sequence
  states in declared order (done-side lanes muted), cards are the rows painted through mtCellHtml
  (urgency chips, formatted numbers, pills). Pure core `boardLanes` (owning-sequence detection,
  no-state lane, footer exclusion); `node.view` + `_view` OPML; the switcher fills the reserved
  `.mt-base-views` strip. Card moves write the keyword into the groupBy cell via mtCommit (text is
  truth); the card menu (click/tap, Enter/Space, Shift+F10, reusing mtMenuBuilder) is the universal
  door with drag as the desktop enhancement; a query base's board is read-only per §0.4. Board
  without a status column flashes the P4 hint naming the fix.

### FR-1 ✓ Field roles, display-first (SHIPPED 2026-07-02): status/date/number column roles
- The keystone slice under the base-views-vision §0b thesis, generative-first: `status` reuses the
  sequence machinery (a custom state set becomes colored chips in a column, the future kanban's
  lanes), `date` reuses the urgency chips, `number` the math formatting. Display hints only over
  the untouched cell string; editors and further roles stay below the line (bases-direction §4).
- Mechanism: `node.colRole` (index-aligned like `colW`, `_colrole` OPML), the paint wrapper
  `mtCellHtml(node, raw, c)` swapped in at every data-cell paint site, a "Show as" section in the
  Column menu, and the three column ops keeping the array aligned.

### QP-2 ✓ Bases as queries: Phase A SHIPPED (owner sign-off 2026-07-02, thin-slice-first under the base-views-vision §0b mission thesis; read-only query base, pure core queryTableRows, memoized qbaseModel, /querybase door; Phases B/C remain below the line)
- **What:** the base-form sibling of QP-1. A base whose rows are not hand-entered but produced by a query over the document, with each column projecting one field of the matched points, rendered in the base's tabular form. Reuses the `queryRows` lineage for the row set; the base layer supplies the columns/display.
- **Full design:** `guidance/query-base-proposal.md` (the sign-off artifact). Key findings: a base's rows are serialized pipe-table markdown in `node.text`, not child nodes, so a query base's foreign-node rows invert cell ownership; the clean seam is feeding `buildTableWidget` a computed model in place of `mtModel(node)`. Proposed as three phases (A read-only MVP via a new pure `queryTableRows` core, B cap + live identity, C optional write-through), recommended as a MODE of the existing base, not a new type.
- **Not a DB:** still a rendering of the live outline, not a stored/persisted view model. The saved-views database layer stays out of scope; the fence moves by exactly one item.
- **Depends on:** reopening the `guidance/bases-direction.md` §4 scope fence (owner call), the first sanctioned move above its line.

## Seven-persona design review (2026-07-02, FOURTH pass — weighted to the newest surfaces) — UXP-160…175

A fourth pass run after Reviews 1-3 (UXP-102…159) + the QX search family + the base-views/query-pill
system all shipped. Same seven-persona fleet, told to WEIGHT attention on the newer additions (base
views, the held band UXP-158, rollup depth UXP-159, QX search, the review-3 fixes) while still seeing
everything. **27 raw → 25 survived adversarial verification, 24 of them on the newer surfaces** (the
weighting worked). One HIGH (a regression in my own UXP-158), a few mediums, the rest low. The verify
pass reframed several fixes off hard-rule violations (an auto-role base-view inference that contradicts
a locked Decision; a `due:week` unbounded window that would break QX-5 composability) and corrected
persona misreads (the `.ag-waiting` class is inert on a bare `.todo-state` span — needs a real
`.todo-state-held` rule). The base-views system produced NO correctness/interaction bug — every
base-view finding is coherence polish or discoverability copy.

### UXP-160 ◐ The @sequence dialog silently drops the held band (P4/P1, REGRESSION in UXP-158) 🔴  [Batch 1] (RESOLVED pending merge)
- **Problem:** the dialog `openSeqDialog` onSubmit called `onResult({ name, states, doneFrom })`, omitting `heldFrom`, so a dialog-authored `DOING | BLOCKED | SHIPPED` stored `heldFrom === undefined` and BLOCKED read as a live action.
- **Rule:** P4 (the second pipe vanishes silently) + P1/P5 (two doors, different data).
- **Resolved:** the onSubmit now forwards `heldFrom: p.heldFrom` (the dialog already computed it for its preview). `editSeq`'s `Object.assign(sq, result)` carries it, so create AND edit are fixed; editing down to one pipe re-derives `heldFrom === doneFrom`, clearing any stale held band. Pinned with a src-guard + a dialog-def round-trip contract. **Verified through the REAL dialog primary-button submit in-browser** (the exact path my UXP-158 verification missed): create stores `heldFrom:1`, `keywordIsHeld('BLOCKED')` is true; edit-down clears it.

### UXP-161 ◐ A custom held state has no chip color (renders identical to active) (P5/design-language §4) 🟡  [Batch 1] (RESOLVED pending merge)
- **Problem:** the inline badge, the board lane chip, and the base status cell all branched only on `keywordIsDone`, so a custom held keyword (BLOCKED) fell through to the active accent tint.
- **Rule:** design-language §4 (a state's look must be the same wherever it appears).
- **Resolved:** added a `.todo-state-isheld` rule (`color-mix(--muted 18%)` bg + `--muted` ink) declared after the color variants so it wins for any held keyword. All three sites now compute `keywordIsHeld(kw)` and append the class (NOT `.ag-waiting` — it needs the `.ag-chip`/`.ag-badge` structure a bare `.todo-state` lacks, per the SoloRPG verification). `boardLanes` gained a structural `held` flag (`[heldFrom, doneFrom)`), and a held lane head reads muted (`.bv-lane-held .bv-lane-head`). This also unifies the built-in WAITING's look (now muted everywhere, matching the agenda). 1 new pin (boardLanes held flag). Verified in-browser: the inline `#BLOCKED` badge computes to `--muted`; the board flags BLOCKED held.

### UXP-162 ◐ Held-ness honored in the Actions row but ignored by every DATED agenda surface (P1/P5) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** `collectDueDates` never computed held-ness, so a BLOCKED dated task painted full urgency (could glow overdue-red like a live point) while the Actions row de-emphasized it.
- **Rule:** P1/P5 (the held concept must read consistently).
- **Resolved:** `collectDueDates(root, seqs)` now derives `keyword` + `waiting: keywordIsHeld(keyword, seqs)` per item (structural, like the Actions row). `mkAgChip`'s `run` and deadline branches add a muted "Waiting" badge + `.ag-waiting` when `it.waiting && !it.done`. Critically, `.ag-waiting` is ADDED to the urgency class, not replacing it, and `.ag-chip.overdue .ag-badge.deadline{color:--bad}` out-specifies `.ag-waiting .ag-badge{color:--muted}` — so a blocked-overdue chip keeps its RED deadline badge (loud) while the Waiting badge reads muted. Overdue-red is NOT suppressed. Pinned. Verified in-browser: `ag-chip overdue ag-waiting`, deadline badge = `--bad`, Waiting badge = `--muted`.

### UXP-163 ◐ Rollup depth scope (UXP-159) has no front door (P2/P5-4) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** the UXP-159 depth arg (`sum(cost, subtree)`, `[/subtree]`, …) was taught by no door.
- **Rule:** P2 / P5-4 (every typeable capability needs a door).
- **Resolved (copy only):** (1) the @progress slash desc notes `[/subtree]` / `[/2]` count deeper + a `[/subtree]` example; (2) the math dialog hint appends "deeper with a scope: sum(cost, subtree) or sum(cost, 2)"; (3) the GUIDE 'rollups' body now says a rollup counts DIRECT children by default and teaches the scope, with `{= sum(cost, subtree)}` and `{= sum(cost, 2)}` example rows; (4) `guide/computing-numbers.md` gained the scoped-rollup block and its stale "unlike the property rollups" line was corrected (property rollups and `words()` now share the scope vocabulary). No syntax change.

### UXP-164 ◐ Base views (Table/Board/Cards/Calendar) have no concept-guide entry (P2) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** the base view switcher (Board/Cards/Calendar) had no GUIDE entry or copy saying the views exist.
- **Rule:** P2 (a Guided-floor door for a shipped capability).
- **Resolved (copy only):** added a `base-views` GUIDE entry (cat 'writing', NO `covers:[]` token — the switcher has no slash-command id, so a covers token would break the drift-guard subset assertion) covering Table/Board/Cards/Calendar + the Column-menu "Show as" (Status/Date) step, with three example rows. Extended the /base slash desc: "View it as a table, board, cards, or calendar." Tests confirm the no-covers entry doesn't trip the drift guard (818 green).

### UXP-165 ◐ "Restore earlier version" snapshot is a single global slot, not doc-scoped (P1, review3) 🟡  [Batch 3] (RESOLVED pending merge)
- **Problem:** the UXP-147 snapshot had no doc identity, so editing doc A then switching to B could hand B a restore of A (and a later Ctrl+S could write A's content into B's file — the P1 tail).
- **Rule:** P1 (a restore/save must not cross documents).
- **Resolved:** the snapshot's own `root.docId` (already embedded in the rolled autosave payload) is its identity. A new shared gate `earlierVersionForCurrentDoc()` parses the prev slot and returns it ONLY when `d.root.docId === root.docId` (a legacy snapshot with no docId is treated as non-matching — safer to skip). Both `hasEarlierVersion` and `restoreEarlierVersion` route through it, so a cross-doc snapshot is neither offered nor applied. `adoptDoc` also resets `_lastSnapshotAt = 0` on a doc swap so each doc gets a fresh snapshot window. No new storage key. 2 pins (the doc-scope gate + the adoptDoc reset). Verified in-browser: same-doc offers the snapshot; cross-doc and no-docId legacy do NOT.

### UXP-166 ◐ The base view switcher's active button ignores the app's active-toggle tint (P1/P5, design-language §4) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** `.mt-view-btn.on` used a neutral gray while §4 fixes one active-toggle recipe (accent mix + accent ink + accent border), so the switcher and the base's own alignment bar spoke two languages.
- **Rule:** design-language §4 (one active-toggle recipe).
- **Resolved:** `.mt-view-btn.on` now uses the standard recipe (`color-mix(--acc 16%)` bg, `--acc` ink, `color-mix(--acc 35%)` border), matching `.mt-align-bar button.on`. Verified in-browser: the active button computes to `--acc` tint + ink.

### UXP-167 ◐ Board/calendar cards read as recessed wells in dark mode (design-language §3) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** `.bv-card`/`.cv-chip` used `--bg` inside a `--cbg` lane/cell; in dark mode `--cbg` is lighter than `--bg`, so a card read recessed (the inversion §3 warns against).
- **Rule:** design-language §3 (dark-mode elevation).
- **Resolved:** the cards now use `--hbg` (the elevation token); lanes/cells stay `--cbg`. Verified in-browser exactly as the target predicted: DARK mode closes the gross recession (card was lum 25 vs lane 36 → now lum 35 vs 36, essentially level, the border carries the rise); LIGHT mode separates cleanly (hbg 250 vs cbg 233, a clean +17). `--hbg` is the sanctioned elevation token, so this is conformant even though dark mode's own token ladder is tight.

### UXP-168 ◐ Duplicate `.mt-base-views` CSS rule with conflicting gap (maintainability) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** `.mt-base-views` was declared twice with conflicting gaps; the stub won by source order, so the documented switcher-block rule was dead.
- **Rule:** predictability/maintainability (a dead same-specificity rule).
- **Resolved:** deleted the duplicate (kept the single canonical rule in the BV-1 switcher block, `gap:2px`) and corrected the "Empty for now" base-header comment (the switcher landed there). One `.mt-base-views` declaration remains (confirmed by grep).

### UXP-169 ◐ Board/Calendar switcher buttons advertise a task they punt (P2, base-views) 🟢  [Batch 4] (RESOLVED pending merge)
- **Problem:** the switcher always rendered all four buttons, but Board/Calendar punted (a flashHint) until a Status/Date column role existed.
- **Rule:** P2 (a control shouldn't advertise an action it will punt).
- **Resolved (softened, conformant):** `mtViewSwitcherHtml` now dims (`.mt-view-btn-dim`, opacity .45) + `aria-disabled`s + `title`s Board when no `status` column exists and Calendar when no `date` column exists. The button is still clickable (the click fires the explaining flashHint — the catch stays), and no role is inferred (a role is a hint the user adds, not a schema — vision §3). Verified in-browser: with a status column, Board is enabled and Calendar is dimmed.

### UXP-171 ◐ No is:held / is:blocked search operator (P2, qx-search) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** the is: family had no seq-agnostic held filter, so blocked work could only be found by the exact keyword (breaks with a custom held state).
- **Rule:** P2 (a structural axis the is: family should expose, like is:done).
- **Resolved:** added `held` to the is: regex + a `termMatchesNode` branch reading the leading keyword via `keywordIsHeld(km[1], seqs)` — the structural analog of is:done, seq-agnostic (matches the built-in WAITING and a custom BLOCKED alike). Not new syntax (a new is: value). Legend + `?`-panel + `guide/features.md` updated. Pinned. Verified in-browser: `is:held` matches #WAITING and #BLOCKED, not #TODO/#DONE.

### UXP-172 ◐ Cross-document links render as dead "link"-captioned pills in a self-contained export (P4, base-views) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** a broken cross-doc link with an empty label and no resolvable title collapsed `capText` to the literal "link" — a cluster of identical dead pills.
- **Rule:** P4 (a dead pill should name itself, not read "link").
- **Resolved (additive):** `renderCrossLinkPill`'s caption fallback is now the DOC NAME ("in <doc>") when available, else "another note" — never bare "link". Nothing written to `node.text` (avoided the toOpml-live-serialization trap). Verified in-browser: a broken cross-doc pill with no label/index reads "another note", not "link".

### UXP-173 ◐ Calendar out-of-month cells fade real point titles below the readable floor (design-language §3) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** a whole-cell `opacity` fade on an out-of-month calendar cell dragged its point-title chips under the contrast floor (§3: de-emphasize by role, not by opacity fade).
- **Rule:** design-language §3 (no fade under the floor).
- **Resolved (both calendars for P5 coherence):** replaced the whole-cell `opacity` on `.cv-out` and `.agc-cell.oom` with a recessed cell BACKGROUND (de-emphasis by role) + a `.6` opacity on just the day number (`.cv-dom`/`.agc-dom`). The point-title chips stay full-contrast `--fg`. Verified in-browser: cell opacity 1 (recessed bg), day number .6, chip color `--fg`.

### UXP-174 ◐ due:week / due:month are forward-only (exclude overdue) (DECISION — kept forward-only, added a clarity note) 🟢  [Batch 5] (RESOLVED pending merge)
- **Decision:** kept `due:week`/`due:month` forward-only (the composable-atom behavior is correct — an unbounded window would break `due:week | due:overdue` and overlap due:overdue).
- **Resolved:** took only the optional clarity touch — the legend + `?`-panel rows now read "due within the next 7 / 30 days, not overdue (add `| due:overdue` to include past-due)", so the forward-only behavior is stated at the door. No behavior change.

### UXP-175 ◐ Swing-oracle "but" results tint by Yes/No prefix only (experience, older surface) 🟢  [Batch 5] (RESOLVED pending merge)
- **Problem:** "Yes, but" (a complication) got the positive plate and "No, but" (a hopeful negative) got the muted plate — the tint pointed the wrong way on the two spicier swing draws.
- **Rule:** experience/P5 (the whisper shouldn't mislead).
- **Resolved:** `renderGrammarPill` now skips the valence tint when `g.result` contains a comma, so only the PLAIN Yes/No arms tint (they never carry a comma) and the "…, but"/"…, and" twists stay neutral rather than mislead. No third tint, no new sigil. Verified in-browser: plain Yes/No tint, "Yes, but"/"No, but" don't.

### Closing order (Review 4)

1. **Batch 1 — the held-band regression + its visual echo (UXP-160, 161).** The 🔴 dialog `heldFrom` drop (my UXP-158 regression — do FIRST) + the `.todo-state-isheld` chip/board color. Both fix the marquee feature through its real doors.
2. **Batch 2 — held-band reach + discoverability (UXP-162, 163, 164).** Held on dated agenda chips, the rollup-depth doors, the base-views GUIDE entry. Mostly copy + one small agenda thread.
3. **Batch 3 — the durability P1 (UXP-165).** Doc-scope the Restore-earlier-version snapshot. Alone (a data-safety fix warranting focused review).
4. **Batch 4 — base-view CSS coherence (UXP-166, 167, 168, 169).** The active-toggle tint, dark-mode card elevation, the duplicate rule, the switcher affordance. Pure CSS/markup on the newest surface.
5. **Batch 5 — small copy/search/experience (UXP-170 defer, 171, 172, 173, 174 decision, 175).** The estimate glyph (github-blocked, defer), is:held, the cross-doc caption, the calendar OOM fade, the due:week note (decision), the swing tint.

---

## Seven-persona design review (2026-07-03, FIFTH blind pass) — UXP-176…184

A fifth fully BLIND re-audit run after Reviews 1-4 (UXP-102…175) all shipped: same seven-persona
fleet, no knowledge that any prior review happened, told NOT to mine this ledger. **17 raw → 10
survived adversarial verification, 7 refuted.** No highs on merit beyond one (the query-pill keyboard
gap); the rest are medium/low a11y + token-drift alignments back to standards the app already obeys.
The verify pass retracted several plausible findings (the formula-var "odd pill out" — it opens its
editor by design like the math pill; the deck "silently recycles" — UXP-120 already announces it; an
inline numeric stepper — a P1/P5 sigil-growth violation). **Recurring theme: two inline interactive
chips (the query pill, the TODO state/priority badge) are the last elements left out of the P3 a11y
sweep** that made hashtags, footnote refs, links, and every other pill focusable + named +
Enter/Space-operable. Everything is a per-element alignment, nothing architectural.

### UXP-176 ◐ The query pill is focusable but has NO keyboard activation (P3-2) 🟡  [Batch 1] (RESOLVED pending merge)
- **Problem:** the query pill was focusable + promised editing, but was omitted from the content-keydown pill-activation selector every peer pill uses, so Enter/Space did nothing.
- **Rule:** P3-2 (a focusable interactive element must be keyboard-operable) + P1/P5.
- **Resolved:** added `.query-pill` to the pill-body `closest()` selector in the content keydown handler. The existing `e.target === pillBody` guard fires the query pill's mousedown (→ `editQuery`) on Enter/Space, exactly like the mouse path; a focused result-row `.node-link` is still handled by the earlier `.node-link` branch (navigates, doesn't edit). Mousedown branch untouched (caret invariant). Pinned (selector membership). Verified in-browser: Enter on a focused query pill dispatches its mousedown.

### UXP-177 ◐ The TODO state/priority badge has zero a11y attributes + no keyboard twin (P3-1/P3-2) 🟡  [Batch 1] (RESOLVED pending merge)
- **Problem:** the interactive inline `.todo-state`/`.todo-prio` badges (click → `showTodoPicker`) carried no role/tabindex/aria/keydown, so they were focus- and keyboard-unreachable and a screen reader announced only the bare keyword.
- **Rule:** P3-1/P3-2 (focusable + operable in place) + P1 (peer chips are all reachable).
- **Resolved:** the interactive inline badge (in `renderContentHTML`) now carries `role="button"`, `tabindex="-1"`, an aria-label ("State: TODO / Priority A. Change state or priority"), and a title. Added a `.todo-state,.todo-prio` keydown branch in the content handler that dispatches the badge's mousedown (→ `showTodoPicker`) on Enter/Space, guarded to the focused badge. Added `cursor:pointer` to `.todo-prio`. Left the base-CELL status badge (`mtCellHtml`) as display-only (not picker-bound), correctly. Pinned. Verified in-browser: Enter opens the picker; both badges carry the attrs.

### UXP-178 ◐ The query pill aria-label says "the pencil" but the whole body edits (P1/P5, copy) 🟢  [Batch 1] (RESOLVED pending merge)
- **Problem:** the aria-label promised "the pencil to edit" but the whole pill body edits, misdirecting AT users.
- **Rule:** P1/P5 (an aria-label must match the real affordance).
- **Resolved (copy only):** the `renderQueryPill` aria-label tail now reads "Click a result to jump, or click the pill to edit its search," and the GUIDE 'query' body's "or the pencil to change the search" → "or click the pill to change the search". Matches the body-click behavior + the empty-state copy.

### UXP-179 ◐ Seven base-view controls draw focus as a 25%-alpha `--ring` ghost, not the solid accent outline (P5/P3, design-language §4) 🟡  [Batch 2] (RESOLVED pending merge)
- **Problem:** seven base-view controls drew `:focus-visible` as `{outline:none;box-shadow:0 0 0 3px var(--ring)}` — a suppressed-outline alpha ghost that failed the §3 3:1 non-text floor and vanished under forced-colors.
- **Rule:** design-language §4 (the focus recipe) + P3 (contrast + forced-colors).
- **Resolved:** folded all seven into ONE selector list with the canonical `outline:2px solid var(--acc);outline-offset:1px` (the recipe used at 40+ sites). Deleted the seven scattered ghost rules — grep + a stylesheet scan confirm ZERO base-view ghost focus rules remain. Verified in-browser: the consolidated rule computes to a solid accent outline.

### UXP-180 ◐ Base column drag-over fills the header with `--acc` but never pairs `--acc-fg` (design-language §3) 🟢  [Batch 2] (RESOLVED pending merge)
- **Problem:** `.mt-colhead.mt-dragover{background:var(--acc)}` put the editable column title on a bare `--acc` fill with `--fg` ink (unpaired, under 4.5:1 in dark mode).
- **Rule:** design-language §3 (the `--acc`/`--acc-fg` pairing).
- **Resolved:** switched to the non-fill drop cue already used at `.bv-lane.bv-dragover` — `border-color:var(--acc);box-shadow:inset 0 0 0 2px var(--ring)`. The header keeps its `--cbg` background, so the title never sits on an unpaired accent fill. Verified in-browser: bg is `--cbg`, border `--acc`, inset ring.

### UXP-181 ◐ `.cv-dow` day-of-week eyebrow tracks .05em, off the locked .07em (design-language §4) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** `.cv-dow` tracked `.05em` while its `.cal-dow`/`.agc-dow` eyebrow siblings track the §4-locked `.07em`.
- **Rule:** design-language §4 (one eyebrow recipe).
- **Resolved:** `.cv-dow` `letter-spacing` `.05em` → `.07em`. Verified in-browser (computes to 0.833px = .07em). Single-selector token alignment.

### UXP-182 ◐ The 'saving' concept-guide desc calls ⌘S "save a copy" (P5, copy) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** the GUIDE 'saving' `desc:'save a copy to your computer'` was wrong for the FSA tier (⌘S re-writes the same file in place, flashes "Saved", not a copy).
- **Rule:** P5 (the door copy should match the behavior + the body).
- **Resolved:** the desc now reads "save to your file (or download a copy if your browser can’t write to disk)," matching the body + the Saved/Downloaded flashes.

### UXP-183 ◐ No presence/absence axis for priority (`priority:none` / `priority:any`) (P2/P5-4) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** `priority:` matched exactly one letter, so there was no presence/absence axis (unlike is:scheduled/is:unscheduled).
- **Rule:** P2/P5-4 (a queryable dimension should expose both directions).
- **Resolved:** added `priority:none` (a to-do without a `[#A]`) and `priority:any` (a to-do with one) — a parse arm before the generic prop arm, matched in `termMatchesNode` via `parseTodo` (todo-gated, seq-aware, so a non-todo line matches neither). Chose `priority:any` over `has:priority` to stay in the priority family (no `has:` arm, no collision with a user property literally keyed `priority`). Legend + `?`-panel rows added. Pinned. Verified in-browser: `priority:none` matches the unprioritized todo, `priority:any` the prioritized one, the plain note neither.

### UXP-184 ◐ A shuffle deck hides its position — no near-empty / cards-remaining cue (P2, solo) 🟢  [Batch 3] (RESOLVED pending merge)
- **Problem:** a shuffle deck showed only the last card, with no glanceable signal that the next draw recycles.
- **Rule:** P2 (a stateful pill's position should be glanceable).
- **Resolved:** `renderSeqGenPill` now adds a `.gr-seq-last` whisper (the deck icon tints `--acc`; the result ink is unchanged) + a "Last card. Click to reshuffle and draw" title/aria when a shuffle deck's bag emptied after a draw (`Array.isArray(g.bag) && g.bag.length === 0 && g.result !== ''`). The guard respects the lazy bag — a pristine/never-drawn deck (`bag === undefined`) is NOT flagged (verified). Verified in-browser: near-empty flags, pristine + mid-deck don't.

### Closing order (Review 5)

1. **Batch 1 — the a11y-sweep finish (UXP-176, 177, 178).** The query-pill keyboard activation, the TODO-badge a11y attrs + keydown twin, the query-pill aria-label copy. The one theme worth doing first; all reuse the existing pill/fn-ref activation pattern + additive ARIA.
2. **Batch 2 — base-view visual coherence (UXP-179, 180).** The seven focus-outline rules → the solid-accent recipe (fold into one selector), the column drag-over `--acc-fg` pairing. Pure CSS.
3. **Batch 3 — small token + copy + search + solo (UXP-181, 182, 183, 184).** The `.cv-dow` tracking, the saving-desc reword, the `priority:none` operator, the shuffle-deck near-empty cue. A grab-bag of one-liners.

---

## Seven-persona design review (2026-07-03, SIXTH blind pass) — UXP-185…190

A sixth fully BLIND re-audit after Reviews 1-5 (UXP-102…184) all shipped: same seven-persona fleet,
no knowledge that any prior review happened, told NOT to mine this ledger, and told explicitly that
finding little or nothing is the expected outcome for a codebase this mature. **6 raw → 6 survived,
0 refuted — ALL low-severity, zero medium, zero high, nothing structural.** The 0-refute count
reflects the fleet self-restraining to only genuine nits (the verify pass had nothing to kill). The
"what I did NOT find" summary is the headline: no broken keyboard path, no caret regression, no P3
failure, no new-sigil temptation, no dependency, no locked-Decision contradiction, no user-facing
em dash. Two themes: a small cluster of §1 vocabulary drift ("outline" used for the document), and a
few off-token literals splitting otherwise-unified visual families. This is a hygiene pass, one small
batch closes it.

### UXP-185 ◐ First-run copy names a File-menu item that doesn't exist + uses "outline" for the document (§1, P1/P5) 🟢  [Batch 1] (RESOLVED pending merge)
- **Problem:** the Examples doc's closing point ("open the File menu and choose Start a blank outline") names a control that reads "New" in single-file mode (`#btn-new`), and "Start a blank outline"/"New blank outline"/"start your own outline" use the banned document-sense of "outline" (§1 permits only "outliner" the app, "the outline" the tree). Copy inconsistency + a vocab slip, not a dead end (the banner button works).
- **Rule:** §1 vocabulary (no document-as-outline) + P1 (name the real control).
- **Target:** rewrite the closing point to name the real control + offer the immediate path ("open the File menu and choose New, or just start typing here"); change the toast/banner document-sense "outline" wording to "document". Sites: `showExamplesBanner` (`storageWarnBtn`/`storageWarnMsg`), `startBlankOutline` (`flashHint`), the `FIRST_RUN_EXAMPLES` closing `<outline>`. Keep the banner BUTTON label ("Start a blank outline") — it's prescribed by ux-discipline.md L81; if that string changes, update the doc in the same PR.

### UXP-186 ◐ Static `#new-desc` default "Start a fresh outline" uses the banned document-as-outline wording (§1, source hygiene) 🟢  [Batch 1] (RESOLVED pending merge)
- **Problem:** the `#btn-new` row's static markup default is "Start a fresh outline" (banned §1 wording). Verification correction: this is NOT user-visible — `#file-menu` is `display:none` and `openFileMenu`→`applyFileModeLabels` rewrites it to "Start a fresh document" synchronously before paint. So source hygiene / defense-in-depth, not a live defect.
- **Rule:** §1 vocabulary (the two homes should agree, so a refactor can't leak the banned word).
- **Target:** change the static markup default `Start a fresh outline` → `Start a fresh document`.

### UXP-187 ◐ Eleven inline-text marks hardcode `border-radius:2px`, off the §4 radius token set (design-language §4) 🟢  [Batch 1] (RESOLVED pending merge)
- **Problem:** `.md-hl`, `mark`, `.node-link`, `.node-link-broken`, `.node-link-mirror`, `.fn-ref:focus-visible`, `.note-ind:focus-visible`, `.agg-today-lbl`, `.agg-hover-lbl` (and kin) hardcode `border-radius:2px`, which is not in the §4 ladder (`--r-xs:3px`/`--r-sm:6px`/…). §4 says inline marks use `--r-xs` and "new radii come from this set". Sub-perceptual at `padding:0 1px`; the value is drift-prevention + family coherence (sibling `.logo`/`.crumb` already use `--r-xs`).
- **Rule:** design-language §4 (the radius ladder; no bare literals).
- **Target:** replace `border-radius:2px` on these inline marks with `var(--r-xs)`. (If 3px is judged to over-round a one-line highlight, add a named inline-mark radius to the §4 set instead of a bare literal — but the token swap is the clean default.) Leave the `.bullet-base-ic>i` 1px hairline (legitimately sub-token).

### UXP-188 ◐ `.todo-prio` padding (1px 5px) differs from `.todo-state` (1px 6px), splitting the shared chip recipe (design-language §4) 🟢  [Batch 1] (RESOLVED pending merge)
- **Problem:** §4's status-chip recipe is `padding:1px 6px`; `.todo-state` honors it but `.todo-prio` is `1px 5px`. Since `#TODO [#A]` renders the two chips shoulder-to-shoulder, the 1px inset delta is comparable at one eye fixation. Sub-perceptual, but an unexplained deviation reads as an oversight (the app's precedent, e.g. `.collapse-count`'s UXP-154 micro-context comment, is to justify a deviation).
- **Rule:** design-language §4 (one chip recipe).
- **Target:** change `.todo-prio` padding `1px 5px` → `1px 6px` to match `.todo-state` + the recipe.

### UXP-189 ◐ The "Restore earlier version" recovery net is absent from the concept guide (P2, CLAUDE.md guide contract) 🟢  [Batch 1] (RESOLVED pending merge)
- **Problem:** the docId-scoped rolling snapshot (UXP-147/165), restorable via the File-menu "Restore earlier version" row, is undocumented in the concept guide. `id:'saving'` says "you don't need to think about saving"; `id:'export'` frames OPML as "archive and restore"; neither names the one-click rollback. `#btn-restore` is `display:none` until `hasEarlierVersion()`, so a user browsing before any snapshot exists can't discover it, and the guide (the discoverability floor) never teaches it — a bullet/menu-only feature CLAUDE.md's contract says must be "documented by hand".
- **Rule:** P2 (a shipped recovery feature needs a Guided-floor door).
- **Target:** add one AP-style sentence to the `id:'saving'` GUIDE body ("If auto-save has overwritten something you wanted back, open the File menu and choose Restore earlier version to roll back to the last auto-saved snapshot") and optionally an examples row. No code change. No em dash.

### UXP-190 ◐ A code comment claims a `has:priority` search synonym that does not exist (maintainer trap) 🟢  [Batch 1] (RESOLVED pending merge)
- **Problem:** the `parseSearchQuery` priority-arm comment asserts `has:priority` is a wired synonym for `priority:any`. It is NOT — `has:priority` mints a generic `{kind:'has', value:'priority'}` term that falls through to the property scan (matches a point with a property literally keyed "priority", never a `[#A]` marker). Maintainer-facing only (no shipped copy is wrong; comments are copy-standard-exempt), but it could seed a bug if someone edits the code to match the comment.
- **Rule:** accuracy (a comment must not describe behavior that doesn't ship).
- **Target:** correct the comment to describe only what ships — `priority:none` and `priority:any` — and drop the `has:priority` claim. (Actually adding `has:priority` would need a reserved `has` arm + three doors; per the mature-app bar, the comment fix is the clean action.)

### Closing order (Review 6)

1. **Batch 1 — the whole hygiene pass (UXP-185, 186, 187, 188, 189, 190). RESOLVED (all ◐, one PR).** Fixed: the first-run/menu document-sense "outline" → "document" and the closing point → "choose New" (185/186, the banner BUTTON label kept per L81); nine inline-mark radii `2px` → `var(--r-xs)` plus `.agg-name-row` for consistency (187, leaving `#drop-line`'s 2px bar); `.todo-prio` padding `1px 5px` → `1px 6px` (188); a "Restore earlier version" sentence + examples row in the `id:'saving'` GUIDE (189); the stale `has:priority` comment corrected (190). 823 tests pass (incl. the CSS drift guards); confirmed by grep-diff (pure static token/copy swaps, no dynamic behavior).

---

## Lean floor (verbosity dial #2) — the keyboard-only, zero-dialog floor (2026-07-03)

**The spec (owner-defined):** Pointliner must be FULLY operable by keyboard with ZERO dialogs/menus/
submenus appearing. `/` and `@` work but render nothing; a qualifying command writes an INLINE STUB
with the caret on the blank (the dialog is the higher-verbosity affordance, not the floor); hover/
selection never spawns a submenu; everything stays clickable; the TOP BAR is exempt (always visible).

**Readiness audit (4-auditor fleet, 2026-07-03):** 96 capabilities → **57 already floor-ready, 39 gaps**
(22 dialog-only, 13 partial, 2 hover, 2 mouse). One recurring shape: argument/name-taking commands and
table/base structural ops have no inline twin, so their only completion path is a spawned surface. The
fix is a SYSTEMATIC PASS, not a rework — two proven templates already exist (the `SLASH_ARG_VERBS`
typed-arg bridge, the `promoteBraceBody` shorthand promoter). Phases: (1) the promoting-inline-stub
framework, (2) the `/`+`@` blind-render branch, (3) table/base keyed twins, (4) the dial itself.

### LF-1 ◐ Phase 1: the promoting inline-stub framework, proven on `/prop` (RESOLVED pending merge)
- **What:** the reusable keyboard-inline path for a SIDECAR-backed verb (properties have no inline text
  form, so a bare `key:▮` can't sit in the point). A bare `/prop` writes the stub `{prop ▮: }` (caret on
  the key blank); you fill it; on exit `promoteBraceBody`'s new `propDeclParts` branch writes `node.props`
  and CONSUMES the brace (returns `''` — a chip, not a pill). `/prop:owner=zeo` is the one-shot direct
  write (`parsePropSlash`). No dialog; the Property editor is the higher-verbosity door.
- **Built:** pure cores `propDeclParts` (sniff `{prop k: v}`, reserved date/check/alias keys excluded),
  `setProp` (add/replace/clear), `parsePropSlash` (one-shot); the `promoteBraceBody` branch + the
  promotion-loop tweak (`if (token != null)` so `''` counts as consumed, not "keep the brace");
  `classifyBraceBody` recognition; `prop` in `SLASH_ARG_VERBS` + the `/prop` verb + slashApply stub/
  one-shot branches; concept-guide `properties` entry updated. 848 tests (+5 pins). This is the pattern
  the follow-on stub verbs (bare `/due`, `/refile`, `/base`, `/savetemplate`, `/note`, the bulk verbs)
  each register onto — a few lines each.

### LF-1b ◐ Phase 1b: the first follow-on stub verbs — /base, /savetemplate (RESOLVED pending merge)
- **`/base`:** bare `/base` now creates a 3x3 grid directly (was: always the size picker); `/base:3x4`
  creates that size inline (`parseBaseSlash`, clamped 1-50 x 1-20, unicode × accepted). The size picker
  stays the higher-verbosity door via `@table`. Reuses `createBaseAt`.
- **`/savetemplate`:** a NEW verb — `/savetemplate:name` snapshots this point's subtree as a named
  template inline (deep-clone + `upsertTemplate`, the openSaveTemplateDialog write); bare
  `/savetemplate` opens the name dialog. This closes the "save a template is dialog-only" gap
  (stamping was already floor-ready via `/template:name`).
- Both in `SLASH_ARG_VERBS`; concept-guide `templates` entry updated + `savetemplate` covered. 850
  tests (+3 pins). No promotion machinery needed here (both are direct writes), unlike `/prop`. Still
  open in the class: bare `/due` + `/note` (need their own date/note promote stub), `/refile` (needs
  title→id resolution), the bulk multi-select verbs — each a focused follow-up.

### LF-1c ◐ Phase 1c: named-sequence pills edit inline (unfold), no dialog (RESOLVED pending merge)
- **What:** a named `[[seq:key]]` sequence pill now UNFOLDS to its `{seq Name: active | held? | done}`
  source in edit mode (like dice/math/est), so it's edited keyboard-only instead of via the seq
  dialog — closing an "edit is dialog-only" gap. The dialog (`.seq-edit` pencil) stays the
  higher-verbosity door. **Verified LOSSLESS:** unfold → refold returns the byte-exact token; the
  re-serialized form is identical (`seqDefString` re-emits states+bands, name via `seqDeclParts`); the
  held band survives; a mid-edit save re-folds to the token (`foldedTextForSave`), never raw `{seq …}`.
  Safe because a seq carries NO draw state (unlike a deck) and is callable by NAME not key.
- **Built:** `seq` added to `artifactToShorthand` + the three lockstep unfold regexes
  (`unfoldedPrefixLen`/`foldedOffsetFor`/`unfoldArtifacts`). Two prior pins that asserted the old
  atomic behavior were rewritten to the new unfold behavior + the lossless round-trip (the
  "intentional behavior change → update the pin in the same commit" rule). 850 tests.
- **NOT done here:** `query` unfold — deferred at the time (a query pill is `display:block`); DONE in
  LF-1g below (the block-ness turned out to be display-only). `est` rollup edit is a known separate
  lossy-trap gap (out of scope).

### LF-1d ◐ Phase 1d: bare /due + /note go keyboard-only (RESOLVED pending merge)
- **bare `/due`** (verbosity-split, amended #442 2026-07-10): in **lean** it writes the fill-in stub
  `{date due: ▮}` (caret on the value blank) — type the date, exit promotes it to the due chip; in
  **guided/standard** it opens the **Schedule dialog**, matching bare `/check` and `/alias` (P1 sibling
  consistency — the code had drifted to always-stub, contradicting the intended "bare /due opens the
  dialog" recorded above at §7.1a and UXP-20). The stub uses a date twin of the prop stub —
  `dateDeclParts` sniffs `{date due|start: VALUE}`, the `promoteBraceBody` branch routes to `setDateProp`
  VALIDATED (`parseDueDate`): valid → chip + brace consumed, empty → clears, INVALID → stays literal
  `{date …}` (the escape hatch, never a silent no-op). `/due:tomorrow` one-shot unchanged; the Schedule
  dialog is also reachable via the bullet menu / a date-chip click.
- **`/note`** is a NEW verb — creates (if absent) and focuses the inline note editor below the point
  via the existing `openNoteEditor`, the keyboard door the note previously lacked (bullet-menu only).
  Pure reuse, no stub needed. Concept-guide `notes` entry updated + `note` covered.
- 853 tests (+4 pins: `dateDeclParts`, the validated `{date}` promotion, the `/due` stub + `/note`
  src-pins). Still open in the class: `/refile` (title→id resolution), the bulk multi-select verbs.

### LF-2 ◐ Phase 2: the verbosity dial + blind-render for / and @ (RESOLVED pending merge)
- **The global lean switch, at last** — a `verbosity` setting ('guided' default | 'lean'), persisted in
  the autosave payload. In LEAN, the `/` and `@` menus stay fully keyboard-operable but render NOTHING:
  `checkSlash` still builds `slashState` (so Enter/arrows/Esc route and `slashApply` fires) but skips
  `renderSlashMenu`/`positionSlashMenu`. The load-bearing decouple: `isSlashMenuOpen()` now keys off
  `slashState != null`, not the visible `.on` class, so the keydown routing works while blind.
- **Doors:** `toggleVerbosity()` via `Ctrl/⌘+Shift+.` and a File-menu row ("Lean mode" / "Guided mode",
  the label offers the OTHER mode via `syncVerbosityLabel` on menu open). The top bar is exempt (always
  visible) per the floor spec — the dial only silences the `/`+`@` render here.
- 854 tests (+1 src-pin block: the dial state, the `isSlashMenuOpen` decouple, the `checkSlash`
  blind-render guard, the toggle/shortcut/persistence). **NOT done here** (follow-ups): the other lean
  behaviors the `ux.md` dial table lists — hiding hover pencils / tooltips / empty-state hints, minimal
  toolbar — layer on top of this switch; this PR is the load-bearing blind-menu core. **Verification
  note:** the live blind-menu flow is DOM-bound + the browser was unavailable this session, so it is
  src-pinned, not smoke-tested live — worth a manual smoke as a merge gate (see the PR).

### LF-1e ◐ Phase 1e: /refile goes keyboard-only (title→id resolution) (RESOLVED pending merge)
- **The last high-value authoring verb.** `/refile:TITLE` moves this point's subtree under the matching
  point inline (no picker); `/refile:top` lifts it to the top level; a bare `/refile` opens the tree
  picker (higher-verbosity door). An unmatched title flashes P4 ("No point named X"), never a silent
  no-op. `refileNodeTo`'s self/descendant guards mean a bad target can't corrupt the tree.
- **The design surface was title→id resolution** (the audit's flagged blocker). Pure core
  `resolveRefileTarget(title, moveId, rootNode)`: `top`/`top level` → root; an EXACT title/alias match
  (case-insensitive) wins over a partial (contains); else the first contains-match in document order.
  Critically it **excludes the moved point's whole subtree** (a single `walkFrom` pass with a `drop`
  flag), so a decoy with the same name UNDER the moved point can't resolve — otherwise the target would
  resolve then no-op. Reuses `nodeNames` (title + aliases) like the link picker.
- `refile` in `SLASH_ARG_VERBS`; concept-guide `refile` entry updated + covered; the arg-verb src-pin
  made membership-based so it stops churning per verb. 856 tests (+2 pins: the resolver's exact/partial/
  top/decoy-exclusion/null cases, and the `/refile` src-pin). Open in the class: the bulk multi-select
  verbs, `query` unfold.

### LF-1f ◐ Phase 1f: bulk to-do state/priority go keyboard-only (RESOLVED — the enumerable half; ceiling documented)
- **The finding refined:** the bulk multi-select verbs looked like a single gap, but there is a hard
  architectural split. **Entering text-edit (where you'd type `/`) CLEARS the selection** (`enterEdit`
  → `clearSelection`), so an inline `/due` over a selection is IMPOSSIBLE — a free-value bulk verb has
  no edit caret to type into once a selection is active. So the floor can only reach the ENUMERABLE
  bulk verbs (a fixed value set → a keystroke), not the free-value ones (date/prop/refile).
- **Built (the enumerable half):** `Ctrl/⌘+Shift+S` / `+P` on a SELECTION now cycle every selected
  point's to-do state / priority with NO picker — the SAME chords as the single-node cycle, extended to
  the selection when not editing (`activeContentId == null`), so no collision. Pure core
  `applyTodoCycleToNodes(nodes, mutator)` (loops a text-mutator, counts real changes, refreshes the
  `checked` cache); `bulkCycleTodo` wraps it with one undo + a render + a P4 flash when nothing changed.
  Reuses `cycleTodoState`/`cycleTodoPriority`. Shortcut-reference labels updated (this point OR the
  selection). 858 tests (+2 pins).
- **The documented CEILING (honest):** the FREE-VALUE bulk verbs — bulk date, arbitrary property, bulk
  refile — KEEP their action-bar modal (`nsb-dates`/`nsb-props`/`nsb-refile` → a dialog), because a
  free value needs a type target and `enterEdit` clears the selection, so there is no no-modal path
  without redefining the selection model (a much larger, riskier change, deliberately not forced). The
  action-bar buttons are `<button>`s (keyboard-reachable); only the value-entry modal is the ceiling.

### LF-1g ◐ Phase 1g: query pills edit inline (unfold), no dialog (RESOLVED pending merge)
- **The deferred half of LF-1c, now done.** A `[[query:key]]` pill unfolds to its `{query: expr}` source
  in edit mode (like dice/math/est/seq), so it's edited keyboard-only instead of via `editQuery`'s
  dialog. The dialog (the `.query-edit` pencil) stays the higher-verbosity door.
- **Why the earlier caution was over-cautious:** a query pill IS `display:block` (a multi-line widget),
  but that is a DISPLAY-mode CSS concern. `unfoldArtifacts` rewrites the token to `{query: …}` TEXT
  *before* `editModeHTML`/any render runs, so the block-ness never enters the caret machinery — the
  edit path just sees plain text of that length, no different from `{seq …}`. Verified LOSSLESS: a
  query record is JUST `{key, expr}`, `queryParts` re-promotes the expr verbatim, the key is a private
  sidecar handle nothing references; unfold→refold returns the byte-exact token, and `foldedTextForSave`
  re-folds a mid-edit query so a save never persists raw `{query: …}`.
- `query` added to `artifactToShorthand` + the three lockstep unfold regexes; the stale "in edit mode
  it stays atomic" comment at `editQuery` corrected. 860 tests (+2 pins). The unfold cluster is now
  complete (seq + query); only `est` rollup edit remains (a separate lossy-trap gap, out of scope).

### LF-3 ◐ Phase 3 (start): base column/row MOVE goes keyboard-only (Alt+Arrow) (RESOLVED pending merge)
- **The table/base structural residue starts here.** In an interactive base, **Alt+Arrow now MOVES the
  focused column (left/right) or row (up/down)** — a menu-free keyboard twin of the column panel's Move,
  which was mouse/menu-only. Same `Alt+Arrow = move` convention as the outline (P1). Wired into the base
  cell keydown, before the plain-arrow cell-nav branch; re-focuses the moved cell so a chain of moves
  works. Guards: the header (row 0) never moves (`Alt+Up` only `r > 1`), `Alt+Down` stops above the
  footer (`mtLastDataRow`), and an edge move is a no-op (never falls through to caret nav). Reuses the
  existing `mtMoveCol`/`mtMoveRow` (which already move `colW`/`colRole` in lockstep + re-render).
- Concept-guide `tables` entry updated (arrow = nav, Alt+arrow = move). 861 tests (+1 src-pin: the four
  move wirings + the header/footer guards; the mtMove* cores are DOM-bound, already mouse-tested).
- **Still open in the class (follow-ups):** column/row INSERT + DELETE by key (the panel's other ops),
  a keyed **column-role cycle** (Show as: Status/Date/Number/Plain — gates Board/Calendar entry), the
  **board-card move** by modifier-arrow, and column-resize step. Each a focused addition on this seam.

### LF-3b ◐ Phase 3: base column-role cycle by keyboard (Alt+R) (RESOLVED pending merge)
- **Alt+R cycles the focused COLUMN's display role** — Plain → Status → Date → Number → Plain (Shift+Alt+R
  backward) — the menu-free twin of the column panel's "Show as". This is the keyboard DOOR INTO Board and
  Calendar views: both need a column marked Status / Date, and that was column-menu-only. Flashes the new
  role (P4 — no menu to show it) and re-focuses the cell so a chain of Alt+R works.
- Pure core `cycleColRole(current, dir)` over `COL_ROLE_CYCLE` (`[null,'status','date','number']` — the
  exact set + order of the Show-as menu); wraps both ways; an unknown role starts the cycle. Reuses the
  existing `mtSetColRole` write. Concept-guide `tables` entry updated. 863 tests (+2 pins: the cycle
  core's set/order/wrap/unknown cases + the Alt+R src-pin with its P4 flash).
- **Still open in phase 3:** column/row INSERT + DELETE by key, the **board-card move** by modifier-arrow,
  column-resize step. Each a focused follow-up on the base-cell-keydown seam.

### LF-3c ◐ Phase 3: board-card move by keyboard (Alt+Left/Right) (RESOLVED pending merge)
- **Completes the Board keyboard story LF-3b opened.** With a card focused, **Alt+Left/Right moves it to
  the previous / next lane** — the keyboard twin of the card menu's "Move to" (and the desktop drag), which
  were mouse/menu-only. Wired into the existing card keydown (beside the Shift+F10 menu). Reuses `bvMoveCard`
  (writes the target keyword into the groupBy cell, re-renders, re-focuses the card, announces).
- Pure core `nextLaneKw(states, current, dir)`: the next lane keyword over `boardLanes().seq.states`,
  CLAMPING at both edges (a board move shouldn't wrap DONE back to the first lane); a no-state card
  advances into the first lane; case-insensitive; null at an edge → the caller flashes ("Already in the
  first/last lane", P4). Now that LF-3b (Alt+R role-cycle) unblocks ENTERING Board, this makes it fully
  keyboard-operable end to end. Concept-guide `base-views` entry updated. 865 tests (+2 pins: the
  clamp/no-state/case cases + the Alt+Arrow card-move src-pin with its P4 flash).
- **Still open in phase 3:** column/row INSERT + DELETE by key, column-resize step.

### LF-3d ◐ Phase 3: base column/row INSERT by keyboard (Alt+Shift+Arrow) (RESOLVED — insert; delete is the ceiling)
- **Alt+Shift+Arrow INSERTS a column (←/→ = left/right of the focused cell) or a row (↑/↓ = above/below)**
  — the menu-free twin of the column panel's Insert (mouse/menu-only). The arrow gives axis + side;
  re-focuses so the new empty cell is ready to type; flashes to confirm (P4, no menu). A row insert on the
  header (r===0) is skipped; `mtInsert*` are footer-aware (a row never lands after the Calculate footer).
  Reuses `mtInsertCol`/`mtInsertRow`. **Collision fix:** the Shift+Arrow cell-SELECTION guard now excludes
  `altKey`, so Alt+Shift+Arrow reaches the insert branch instead of being swallowed as selection.
- **The documented CEILING (honest):** column/row **DELETE stays the menu path** (reachable keyboard-only
  via Shift+F10 → the panel's "Delete column"/"Delete row", both `danger:true`). Delete is destructive, so
  a bare keyboard chord is a slip hazard; the deliberate menu confirm is the right higher-verbosity door,
  not a floor gap to force. Chord order in the base cell keydown: move (Alt+Arrow), role (Alt+R), insert
  (Alt+Shift+Arrow), then plain-arrow nav.
- Concept-guide `tables` entry updated. 866 tests (+1 src-pin: the four insert wirings, the header guard,
  the P4 flashes, and the Shift+Arrow-excludes-Alt collision fix).

### LF-3e ◐ Phase 3: base column-resize step by keyboard (Alt+, / Alt+.) — PHASE 3 COMPLETE (RESOLVED pending merge)
- **The last phase-3 structural gap.** `Alt+,` narrows / `Alt+.` widens the focused column (the `<`/`>`
  keys) — the keyboard twin of the fine resize DRAG (the coarse Narrow/Medium/Wide/Fit already had a
  Width menu). Base width = the pinned `colW`, or the MEASURED rendered header width when the column is
  auto (so the first press feels natural, not a jump). Flashes the new width (P4, no menu) + re-focuses.
- Pure core `stepColW(base, dir)` over `COL_W_STEP` (24px): clamps `[MIN_COL_W 56, MAX_COL_W 900]`,
  returns null at an edge (caller flashes "at its widest/narrowest"). Reuses `mtSetColWidth`. 868 tests
  (+2 pins: the step/clamp/edge/NaN cases + the Alt+,/. src-pin with the rendered-width measure + flash).
- **PHASE 3 IS NOW COMPLETE.** The base cell keyboard grammar: Alt+Arrow = move, Alt+Shift+Arrow =
  insert, Alt+R = role cycle, Alt+,/. = resize; board-card Alt+←/→ = lane move. The one documented
  CEILING is DELETE (stays the Shift+F10 menu, `danger:true` — a destructive op shouldn't have a bare
  chord). The whole LEAN FLOOR effort (LF-1..LF-3) is now essentially done: authoring verbs, pill unfold
  (seq+query), the lean MODE toggle (LF-2), and the table/base structural ops all keyboard-only; the
  remaining open item is phase 2b (helper-hiding gated on isLean(), which builds on the LF-2 toggle).

### LF-2b ◐ Phase 2b: lean mode is VISUALLY lean (hide the hover-reveal helpers) — LEAN FLOOR COMPLETE (RESOLVED pending merge)
- **The last piece. Lean mode now hides the visual helpers, not just the / and @ menus.** A single
  `body.lean-mode` class (toggled by `syncLeanClass()` from `toggleVerbosity` + the autosave restore)
  drives CSS that suppresses the hover-reveal pill pencils (dice/markov/grammar/math/seq/est/var/query
  edit buttons) + the static-table "Convert to base" prompt, so pill-dense lines stay calm at rest.
- **Additive + touch-safe (P3):** the pencils stay in the DOM and keyboard-operable — a `:focus-visible`
  rule STILL reveals a focused pencil in lean mode, so keyboard/AT users lose nothing. The suppressed
  rules are all `:hover` (mouse-only by nature); touch has no hover and the `@media(hover:none)` block
  keeps the pencils visible there (touch has no floor). This is opacity-on-a-hover-overlay, never
  `display:none` on a control. The flash copy now truthfully says "menus and helpers stay
  keyboard-operable but hidden."
- CSS + a one-line class toggle, no pure core. 869 tests (+1 src-pin: the class-sync helper, both call
  sites, the hover-suppress rule, and the focus-visible-still-reveals P3 guard).
- **CORRECTION (see LF-2c below):** LF-2b was over-claimed as "LEAN FLOOR COMPLETE". It shipped Lean's
  two BIGGEST strips (menus + hover pencils) but NOT all of the ux.md dial-table's Lean column — the
  empty-state hints + search legend still rendered in lean. That residue is closed in LF-2c. The core
  FLOOR (keyboard-usable, no dialogs, top bar unchanged) was and is done; "the dial matches its spec" is
  what LF-2c finishes.

### LF-2c ◐ Phase 2c: lean strips the remaining teaching helpers (empty-state hints + search legend) (RESOLVED pending merge)
- **What LF-2b missed.** A user challenge ("the verbosity dial is still not implemented, or is it?")
  surfaced that `isLean()` only gated the / @ menus (LF-2) + the hover pencils (LF-2b), but the ux.md
  dial table lists MORE helpers stripped in Lean that still rendered: the empty-state teaching hints and
  the focus-shown search legend. LF-2c closes that so Lean strips what the spec says it should.
- **Empty-state hints:** the entry-point placeholder (`Type / for blocks, @ to insert…`) and the para
  keyboard-hint (`Enter = line break…`) TEACH the syntax; in lean they go bare (`''` / `'…'`). The
  `Section label…` divider placeholder STAYS — it names the field (a label), not a helper.
- **Search legend:** the `.sh-row` cheatsheet rows (`is:done`, `#tag`, `"phrase"`) strip via a
  `body.lean-mode #search-hint .sh-row{display:none}` rule; `#sh-saved` (saved searches) + `#sh-workspace`
  (cross-doc matches) STAY — they're user data + controls, not helpers (the over-stripping guard is pinned).
- **The ux.md TOOLBAR row is DELIBERATELY NOT stripped.** The vision table says Toolbar → "minimal" in
  Lean, but the user's own lean spec overrides it: "never does the top bar or its toggleables disappear
  or alter their behaviour." User intent beats the older vision doc; the top bar is invariant in lean.
- **Pill tooltips (`title=`) NOT gated** (ponytail): they're hover-hold-only, ~zero at-rest clutter, and
  the table says "minimal" not "hidden" for Lean; gating 10 render sites for an already-inert helper is a
  poor ratio. Recorded as a conscious skip, not an oversight. **SUPERSEDED by LF-2d** (adjudicated
  2026-07-09 closing #394 point 5): LF-2d's single post-render `isStandardOrLean()` sweep shipped the
  strip without the 10-site gating this note feared, and Standard's "stop explaining" charter covers a
  "Click to re-roll" tooltip; the `aria-label` twin keeps the accessible name. LF-2d governs.
- CSS + a JS placeholder gate, no pure core. 870 tests (+1 src-pin: both hint gates, the legend-row rule,
  the saved-searches-survive guard, and the Section-label-survives guard).
- **The lean floor is now genuinely complete AS A TWO-POSITION DIAL (Guided/Lean).** [SUPERSEDED by LF-2d:
  the 3-position control shipped — the STANDARD tier is now built, at the user's explicit direction.]

### LF-2d ◐ The 3-POSITION verbosity control: guided → standard → lean (RESOLVED pending merge)
- **The objective, at the user's direction.** LF-2c shipped a 2-position dial and noted the ux.md middle
  STANDARD tier was vision-deferred; the user reversed that ("push 3 position control, that's the
  objective"). Built the full 3-tier control. `verbosity ∈ {guided, standard, lean}` over
  `VERBOSITY_TIERS`; `⌘⇧.` + the File-menu row now CYCLE (not flip); the body carries one `v-<tier>` class.
- **What STANDARD strips (the design, chosen "fuller Standard, new strips" via AskUserQuestion).** Against
  the real code the ux.md table's Standard column mostly collapsed into Guided (the slash menu is already
  label-only in every tier; pencils already hover-only outside lean), so a thin Standard would be ~95%
  Guided. Instead Standard = **"I know the commands, stop explaining, keep the conveniences"**: the
  teaching TEXT is off (empty-state hints, search legend, AND pill `title=` tooltips — the new strip) but
  the / @ menus render + pencils reveal on hover. Lean then ALSO blinds the menus + hides the pencils.
  Clean progression: guided = all on → standard = teaching text off → lean = keyboard canvas.
  - The hint + legend gates moved from `isLean()` to `isStandardOrLean()` (strip in both).
  - **New: pill-tooltip strip** — a central post-render sweep removes `title=` from the pill classes when
    `isStandardOrLean()`. SCOPED to pills: a link's `title` (cross-doc = the target doc name; external =
    the URL) is FUNCTIONAL info, not a helper, so it's left. Each pill keeps its `aria-label` twin, so P3
    is intact (only the redundant native tooltip goes).
  - **Toolbar still invariant** across all 3 tiers (ux.md says "minimal" for Lean, but the user's lean
    spec overrides: the top bar never changes). Recorded, not stripped.
- **The dial DISCOVERABILITY:** the File-menu row is now a cycle button — the label names the NEXT tier
  ("Switch to Standard/Lean/Guided"), the desc names the CURRENT tier + what's next, and each cycle flashes
  the tier's effect (VERBOSITY_FLASH). So the user always sees where they are + where the next press lands.
- CSS + state-machine + a scoped post-render sweep, no pure core. 870 tests (the 3 dial pins rewritten for
  the 3-tier reality: the cycle + predicates + persistence; lean-only blind-menu/pencils; standard+lean
  teaching-text strip incl. the tooltip sweep + the link-title/Section-label over-strip guards).
- **The verbosity dial is now the full 3-position control the vision (ux.md) sketched — Guided / Standard /
  Lean — matching the dial table (with the honest toolbar-invariant deviation per the user's floor spec).**

### EX-1 ◐ The first-run Examples document: a flat 10-line demo → a nested, progressive tour (RESOLVED pending merge)
- **Problem.** `FIRST_RUN_EXAMPLES` was a FLAT list of ~10 top-level points surfacing only ~6 features
  (dice, pick, math, sum-aggregation, estimate, to-do). It neither showed Pointliner's breadth nor gave
  the user a structure to build from.
- **Rebuilt (at the user's direction) as ONE nested tree** rooted under `# Welcome to Pointliner`, staged
  in three depth tiers (`## Basics` / `## Intermediate` / `## Advanced`) chosen via AskUserQuestion
  ("Progressive, 3 depth tiers"), each tier subject-grouped so the outline is readable AND a starting
  skeleton the user edits in place. Basics: write/format/to-dos, dice/pick, math. Intermediate:
  properties, dates+agenda, tags, search operators, links+backlinks. Advanced: named rules/tables, decks
  + cycles, the yes/no oracle, child aggregation (sum/avg over `{prop cost:}` children), inline variables
  (`{level := 3}` → `{= level*8}`), estimates, a lint `check`, bases/board, and a "Make it yours"
  (templates/refile/the verbosity dial). Max nesting depth 5; the Tip point teaches Tab/Shift+Tab so the
  nesting itself is a lesson.
- **Every `{…}` is a LIVE pill (32 total, 0 dead).** Verified BEFORE shipping: each brace body runs through
  `classifyBraceBody` (with the doc's own named rules + vars in context) and returns a real artifact class;
  the named-rule points (`weather:`/`reward:`) parse via `parseRules` so `{weather}`/`{reward}` resolve
  doc-wide; a promote+aggregate check confirms the `{prop cost:}` children feed `{= sum(cost)}` = 14. The
  OPML nesting is well-formed (balanced `<outline>` open/close, depth returns to 0). No test pins the
  content string, so no pin churn; the existing UXP-126/148 mechanism (first-run adopt + File-menu re-entry)
  is untouched. Browser down this session → the live-pill claim rests on the pure-core classify + parse
  checks, not a rendered screenshot; a smoke test should open the examples (File menu) and click a few pills.

### EX-2 ◐ The Examples File-menu row OVERWROTE the current document; make it INSERT (data-loss bug) (RESOLVED pending merge)
- **Problem (user-reported, serious).** The File-menu "Examples" row (UXP-148's `openExamples`) ran
  `adoptDoc(fromOpml(FIRST_RUN_EXAMPLES))` — it REPLACED the whole live document with the examples. The
  only guard was an `unsavedToDisk()` "Discard?" confirm, so a doc already saved (or workspace-autosaved)
  was swapped away with no warning, and even the confirm made "Examples" a data-loss gamble. UXP-148 built
  a real feature (re-entry to the live examples) on a destructive mechanism.
- **Rule:** P4 / no-silent-data-loss. A menu item named "Examples" must never cost you your document.
- **Resolved (non-destructive INSERT).** `openExamples` now parses the examples, takes its single
  `# Welcome` root subtree, `deepCloneNodeNewIds` it (fresh ids, no collision), `pushUndo()`, and APPENDS
  it to `root.children` (a new top-level point), then `buildIndex`/`markDirty`/`render`/`focusNode` and a
  flash naming the count + "Delete it when you are done." No `adoptDoc`, no discard confirm, no examples
  flags (it's a normal edit to the user's own doc, so autosave runs). The row relabelled "Add the Welcome
  tour" / "Insert the examples into this document to explore what pills can do". The FIRST-RUN path
  (`maybeShowFirstRun`, examples-as-the-empty-doc + the Start-blank banner) is unchanged — only the menu
  re-entry inserts. Mirrors the `stampTemplate` insert model. Pinned: `openExamples` appends a fresh-id
  clone, is undo-able, and contains NO `adoptDoc`/discard-confirm (the guard against reverting to the
  destructive path). Browser down → the insert is src-pinned + `deepCloneNodeNewIds` (fresh ids, deep
  props) verified; a smoke test should Add the tour on a NON-empty doc and confirm the doc survives + undo
  removes just the tour.

### FMENU-1 ◐ File-menu a11y + consistency cluster (Fixes #503 #504 #505 #506 #507) (RESOLVED pending merge)
- **Source: adversarial File-menu review.** The menu is otherwise solid (scrolls, roves, Escape restores
  the caret). Five Minor defects, all in `#file-menu` + `openFileMenu`/`closeFileMenu`/its keydown handler.
  Browser-verified each fix with Playwright.
- **#503 (dialog contract):** `role="dialog"` but no `aria-modal` and Tab walked straight out into the
  live outline. The codebase's own stance (the keydown comment) is "settings dialog, not a menu" — so
  MADE it a real dialog rather than demoting to `role=menu`: added `aria-modal="true"` + a Tab-wrap arm
  (Tab/Shift+Tab rove within `fmItems()`, the same list the arrows use). Verified: Tab from the last item
  wraps to the first, focus stays contained.
- **#504 (toggle state):** the three cycle rows had `role=button` but no programmatic state. Binary
  `#btn-width` now sets `aria-pressed`; the tri-state Theme announces its new label via `#a11y-live` on
  change; Verbosity was already announced (its `flashHint` routes through `announce`). No `menuitemradio`
  (that would contradict the "rows are buttons" decision).
- **#505 (copy coherence):** Width labeled the NEXT action ("Full width" while narrow) while Theme/Verbosity
  label the CURRENT state. Width now reads "Width: Full" / "Width: Narrow" — state visible without clicking.
- **#506 (stale caret-return):** `chromeReturn` armed on every open but only Escape cleared it, so
  edit A → menu → sub-surface → close → reopen → Escape yanked the caret back into A. Escape now
  restores-BEFORE-close (reads a live arm), and `closeFileMenu` clears `chromeReturn` on every other
  close path — the ghost is gone. (Sub-surface dialogs use their own `ioReturnFocus`, unaffected.)
- **#507 (role over-stamp):** the stamp forEach applied `role=button` to EVERY `.cmd-item`, clobbering
  the link semantics of the two external `<a>` rows and re-roling the native `<button>`. Gated to
  `tagName === 'DIV'` — anchors keep "opens in new window", the button keeps its native role.
- No pure core (all DOM-bound); browser-verified. 982 tests unchanged.

### SEQ-1 ◐ Finish absorbing the hardcoded to-do layer into the sequence system (Fixes #510 #509) (RESOLVED pending merge)
- **Source: adversarial architectural review of the to-do layer vs the sequence system.** Verdict up
  front: they are NOT two parallel systems — `DEFAULT_SEQUENCE` IS the built-in to-do set expressed as a
  sequence, first in `allSequences()`, and done-ness / held-ness / search / sort / progress / continuation
  / migration already flow through the sequence-aware functions. Well-made, ~90% unified. Only 3 bypass
  sites remained (one already fixed as #508's cause).
- **The absorption, finished:** (1) deleted `cycleTodoKeyword` + `TODO_CYCLE` — dead since #508 routed
  `cycleTodoState` through `sequenceForKeyword`; nothing else reached the raw default array. (2) deleted
  `todoIsDone` / `TODO_DONE` (#509) — dead artifact; done-ness derives from `keywordIsDone` (sequence-aware).
  (3) `todoSortKey`'s no-keyword fallback was `TODO_STATES.length` (a magic 4 coupling the sort to the
  default set's length); now `Infinity` — an unrecognized point sorts after every known state of any
  sequence, decoupled. That was the last hardcoded `TODO_STATES` reference in logic.
- **Kept separate BY DESIGN (not duplication):** priorities (`[#A]`) are an orthogonal axis the sequence
  system never modeled; per-name badge colors are deliberate polish. Neither is a correctness dependency.
- Behavior-preserving: 982 tests (net −3 — the deleted `todoIsDone`/`cycleTodoKeyword` pins went with
  their code; the sortKey pin updated to assert the `Infinity` fallback). No production call-site changes.

### EXPORT-1 ◐ Query pills leaked their raw [[query:KEY]] token into Markdown/plaintext export (Fixes #530) (RESOLVED pending merge)
- **Source: second adversarial review of the {…} grammar.** MINOR — cosmetic export leak, not
  corruption (OPML round-trips fine via the `_query` sidecar). Every OTHER newer sub-form flattens on
  export; `query` was the lone gap.
- **Root cause (P4 — a snapshot export must not emit a live token).** `flattenArtifacts`'s regex
  (`dice|markov|math|var|grammar|seq|est`) omitted `query`, and `frozenTokenText` had no `query`
  branch — so a `[[query:KEY]]` token fell through to a var lookup returning `''`, or was left verbatim.
  The render-side `TOKEN_RE` already listed `query`; only the export side was asymmetric. Parser-parity
  gap of the same family as #528/#494 (two sibling enumerations that drifted apart).
- **Fix:** add `query` to the flatten alternation + a `frozenTokenText` query branch that freezes to the
  same snapshot the pill shows — the query expr and its current matches (`queryRows` titles, capped with
  `+N more`), `(no matches)` when empty of results, `(empty query)` when the expr is blank, `''` when the
  record is gone (matching every other sub-form). Threaded an optional `rootNode = root` param (the
  codebase's established make-it-testable convention) so the branch is pinnable without the live global.
  Fixes both the whole-doc export AND the per-pill "Freeze to text" action (both route through
  `frozenTokenText`). 985 tests (+1).

### PROP-1 ◐ Empty props row after promoting a {…} pill: the "dead space" box (Fixes #494) (RESOLVED pending merge)
- **Source: user-reported (screenshot), then browser-reproduced with Playwright.** Promoting a `{1d6}`
  (or any `{…}`) to a pill left a bulleted, bordered but empty box below the point — not a real point
  (not in the outline model, no caret), pure dead space.
- **Root cause (P4 — hiding must not be silent, inverted: showing-nothing must not reserve space).**
  The outline row and the zoom view both gated the props row on `node.props?.length`. But `buildPropsArea`
  **skips** the app-maintained timestamp keys (`created`/`edited`, per #467) and renders `check` only as a
  live verdict chip — so a point whose props are *only* timestamps yields an **empty** `.props-area`. The
  gate ("has props") is strictly wider than the content ("renders a chip"). Promotion auto-stamps
  `created`/`edited`, so a just-promoted pill is exactly the timestamp-only case → an empty
  `node-props-row` (bullet gutter + zero-chip area) painted as the dead box. Same latent bug in the zoom
  `zoom-props-row`. Same shape as #528 (creation gate wider than the promote gate).
- **Fix:** a `hasVisibleProps(node)` predicate that mirrors buildPropsArea's own skip logic (a
  non-timestamp non-`check` prop exists, OR `checkExprOf(node) != null`); both gates use it. The row now
  appears only when a chip will. Browser-verified: 0 empty props rows post-repro, the `cost:30` control
  still renders its row. Pinned pure-core (984 tests, +1) — the suite had no timestamp-only props case.

### CQ-1 ◐ Code-quality audit: derived-hint desync + folder-write data loss + query sidecar drop (RESOLVED pending merge)
- **Source: a 7-lens static code-quality audit fleet** (no runtime; every major+ finding adversarially
  verified against source, then re-verified by me line-by-line before fixing). Verdict up front: **for a
  single-file zero-build vanilla-JS app, this is well-built and unusually disciplined** — injection is
  closed at the boundary (every pill escapes, no eval, safeUrl blocks javascript:), persistence is
  reconcile-guarded, ~906 pure-core tests. The real risk was ONE recurring class (derived-cache desync)
  plus one narrow on-disk data-loss path. Four confirmed, all fixed.
- **#1 (major, data loss on disk): folder reopen could clobber the real file with an empty tree.**
  `reopenWorkspaceDoc` (line ~19412): when the disk copy is authoritative but `fromOpml` throws
  (half-written by a sync tool, corrupt, over-depth), the catch rebound `workspaceFile = fh` as the
  auto-write target while leaving `root` as the stale/empty boot doc, anchored `_wsKnownModified` to the
  file's own mtime (staleness check passes), and returned true with no error. The next edit's
  `flushWorkspaceFile` (gated on `workspaceFile`) wrote the empty tree over the user's real file. Fixed:
  on a parse failure of the authoritative copy, `workspaceFile = null` (detach the auto-write target) +
  `flashError` ("Could not read X. Auto-save is paused so it will not be overwritten."). Invariant now:
  never make a file an auto-write target when you failed to load its authoritative content. OPFS/localStorage
  still hold the in-memory doc, so nothing is lost, just write-guarded.
- **#2/#3 (major+minor, same root cause): two edit paths re-derived `type` but forgot `checked`.**
  `node.checked` and `node.type` are BOTH derived from `node.text`; `applyEntry` (undo/redo, ~18677) and
  `exitZoomEdit` (~5634) re-derived only `type`, so an undone/zoom-edited to-do kept a stale `checked` and
  `isVisible` filtered the intact row out with Show-Done off (#2 major; #3 minor — self-heals on reload).
  Fixed structurally: one `rederiveFromText(node)` helper (type AND checked, matching exitEdit's fallback);
  the two incomplete sites route through it so a fourth path can't drop it again.
- **#4 (major): Enter-split / Backspace-merge silently destroyed a `{query:}` embedded search.**
  `ARTIFACT_SIDECARS` listed 8 sidecars but omitted `query`, so a `[[query:KEY]]` token moved with the
  text on a normal keystroke while its `node.query` record was left behind → the moved token rendered
  query-bad ("missing data"). The functions were existence-pinned only, so the bug hid behind green tests.
  Fixed: added `query`; recorded that `props`/`note` are point METADATA deliberately NOT carried.
- **Tests: +2 behavior pins that would have CAUGHT #2/#3/#4** (the query-carry pin fails against the
  unpatched code — the audit's point about existence-only pins). `rederiveFromText`, `cloneArtifactSidecars`,
  `mergeArtifactSidecars` registered as pure cores; `structuredClone` added to the test sandbox. 908 tests.
- **The minor/polish backlog** (regex scope hazards, five copy-pasted reroll one-liners, the 145-line table
  keydown maze, etc.) was NOT fixed here — logged from the audit for a future maintainability pass; none are
  bugs on a normal path.

### MOBILE-2 ◐ The "N done hidden" cue lives on the Done button (mobile-neophyte review) (RESOLVED pending merge)
- **The neophyte fleet's #1 finding, owner-adjudicated fix.** Ticking a to-do hides it (showDone
  defaults off), and the only cue was a 1400ms toast — an Apple-Notes user reads "ticked = deleted."
  Owner chose the persistent-count-cue direction over changing the default (the hide-done model is
  deliberate and useful; the problem is recovery discoverability, not the hide). Placement: the
  count rides the **Done toolbar button itself**, so the cue and the recovery control are the SAME
  element.
- **Built:** a pure `countHiddenDone(tree, shown)` core (counts checked `type:todo` points hidden
  while show-done is off; 0 when shown); `syncDoneBadge()` puts an accent count badge on `#btn-done`
  (`.has-hidden` reveals it, `>99` clamps to "99+") and rewrites the accessible name to
  "Done points: N hidden. Activate to show them." so it's not a visual-only cue; `render()` calls it,
  so the count tracks every check/uncheck, show-done toggle, doc swap, and undo. The transient
  `flashHiddenIfDone` toast stays as the immediate P4 beat; the badge is the standing answer.
- **Verified live (mobile viewport, real tick gestures):** tick 1 → row vanishes, badge "1" appears
  (top-right accent pill, radius 999px, aria "1 hidden. Activate to show them."); tick 2 → "2";
  tap Done → all rows return, badge clears, aria back to "Done points."
- 906 tests (+2: the pure count with boundary cases incl. non-todo-checked never counting, and the
  badge wiring/aria/reveal pins). One token-guard catch: the badge's 8px radius tripped the
  border-radius drift guard; switched to the `999px` pill token like the other rounded badges.

### MOBILE-1 ◐ First-run tap targets + duplicate-inbox guard (mobile-neophyte review) (RESOLVED pending merge)
- **Source: a fresh-eyes mobile-neophyte review fleet** (6 personas each attempting a concrete
  first-timer goal on a phone viewport, every finding adversarially re-verified against source).
  Verdict up front: **a genuine neophyte CAN use the app** — all six completed their core task. Two
  findings were clean, cheap, decision-respecting fixes; the rest were either working-as-designed,
  device-only unknowns, or blocked by a recorded decision (see the deferred note below).
- **Tap targets (major-by-convergence, 3 personas hit it): the first-run banner's controls were the
  ONLY first-screen controls the `@media(hover:none)` enlargement pass never reached.** `#storage-warn-save`
  ("Start a blank outline" / "Save to file") measured 127×23px and `#storage-warn-close` (the ✕) 29×20px,
  both under the 24px WCAG floor and far under the app's own 36-38px aim (guardrail 5) — on the literal
  first screen a phone user meets. Fixed: a `@media(hover:none)` block grows the buttons to `min-height:36px`
  and the ✕ to a 36×36 box with an invisible `::after` inset:-6px overlay (glyph stays small). Verified by
  applying the rule live: base 23/20px → touch 36/36px, clears the floor.
- **Duplicate-inbox slot (minor): re-picking an existing inbox appended a duplicate.** The "Add an inbox"
  tree-picker `onPick` computed `slot = inboxes.length + 1` unconditionally, so re-designating a point that
  was already an inbox produced `inboxes == [id, id]`. The bullet-menu Set-as-inbox path already guarded via
  `inboxSlotOf`; the picker now matches it — a re-pick retargets the existing slot and returns. Verified
  live: re-pick retargets to slot 1 (no dup), a new point still appends as slot 2.
- 904 tests (+2 pins; one pre-existing capture wiring-pin window widened for the guard's added lines).
- **Deferred (real neophyte pain, but each fix collides with a recorded decision — owner call, not a quick fix):**
  (a) **checkbox-vanish** — ticking a to-do hides it (showDone=false default); an Apple-Notes user reads
  "deleted." Owner chose the *persistent hidden-count cue* direction (its own PR, MOBILE-2). (b) **strip has
  no touch close** — design-language §4 explicitly records "the strip carries no dismiss button, it closes
  the way it opened," AND outside-tap-closes would break capture's core premise ("the outline stays live+editable
  underneath a brain-dump"); needs a design decision, not a batch fix. (c) **examples-tap shows raw `#`** —
  that's the universal markdown-first edit model, not an examples bug; redirecting the tap would violate P1.

### INBOX-5 ◐ Capture chips: the big zone selects, navigation moves to a ↗ segment (Fixes #421) (RESOLVED pending merge)
- **Owner-adjudicated re-examination of INBOX-2/3's own mapping.** The chip's biggest zone (the
  125px name) navigated AWAY (zoomed to the inbox point) while the actual capture-target selection
  lived on the 24px badge, with zero hover cues — the reviewer's first click got ripped out of
  their zoom, the exact disruption "capturing never navigates you" exists to prevent. Adjudicated:
  swap the mapping on BOTH strips, add titles everywhere.
- **Manager chips (4 segments now):** the badge AND the name both SELECT the capture target (one
  `selectSlot` handler — the whole visible chip is the safe action); a new small `↗` jump segment
  (`.cap-chip-jump`, `fa-arrow-up-right-from-square`, the cross-doc-link outward metaphor) zooms
  to that inbox's point; the ✕ removes. Order: badge | name | ↗ | ✕.
- **Main strip:** the destination NAME now opens/closes the manager (it carries `aria-expanded` and
  the open accent; the pencil is retired — the name does its job) and a trailing `.cap-dest-jump`
  ↗ navigates. Every segment on both strips carries a `title` (sighted mouse users can finally
  read the seams; aria-labels already covered AT).
- FA subset +1 glyph (64), verified painting; the concept-guide capture entry re-taught to the new
  zone map (it still described pencil-opens-manager / name-zooms).
- **Verified live on the exact harm scenario:** zoomed into a work point, opened the manager,
  clicked chip 2's NAME → capture target switched to slot 2 and the zoom STAYED PUT (was: ripped
  to the inbox); the chip's ↗ is the one zone that navigates (verified it zooms to the inbox).
- 902 tests (old INBOX-2/3 mapping pins REWRITTEN to the new contract in the same commit, incl.
  a pin that the retired pencil never returns and the four segment titles).

### CHROME-1 ◐ Visible column-menu door + agenda kind labels (Fixes #416 #419) (RESOLVED pending merge)
- **#416 (major, owner-adjudicated): the 29-item Column menu's only pointer door was invisible.**
  UXP-21's "the header IS the affordance" left the menu zone as unmarked whitespace around the name
  pill; the reviewer's own first click hit the name and got a rename. Adjudication: restore a slim
  visible opener, keep ONE menu (the #415 clamp+scrollbar already made the length livable), keep
  both doors. Shipped: a `▾` (`.mt-col-open`) in each header's right gutter — hover/focus-revealed
  on desktop, always visible on touch (`@media(hover:none)`), and `pointer-events:none` so clicks
  fall through to the header's existing menu zone (zero new handlers; the door was always there,
  now it's marked). Verified live: a click at the ▾'s own pixel opens the Column menu.
- **#419 (minor, owner-adjudicated): three control kinds wore one undifferentiated chip look.**
  The agenda cluster mixes view switchers (open a pane), filters (change the List), and a sort
  cycler as identical chips. Adjudication: eyebrow sub-groups, no behavior change. Shipped:
  caps-eyebrow kind labels (Views / Filters / Sort) leading each group, Sort split to its own row
  (the Titles cycler joins it in Timeline view). The stacking half of the issue was already fixed
  (one-view-at-a-time); the doc row was corrected in DOC-1. Verified live: labels render, Sort row
  separate.
- Both recorded in design-language §4. 902 tests (+1 pin). One guard catch en route: the ▾ at 9px
  tripped the 10px-floor drift guard — raised to 10px rather than extending the glyph-only
  exemption list (the guard's list is a deliberate decision, not a default).

### DATE-1 ◐ Schedule dialog: a day-pick commits-and-closes for single-date points (Fixes #418) (RESOLVED pending merge)
- **Adjudicated (owner, 2026-07-09): the cheap trim, not the anchored popover.** The most common
  date edit ("push this deadline a day") cost chip → day → Save, three interactions plus a modal
  covering the point being rescheduled; the anchored-popover alternative was judged too much new
  surface (focus-trap, touch-edge, second validation surface) for the win. The trim: picking a
  calendar day now SAVES AND CLOSES when the OTHER date field is empty — the single-date case the
  chips make frequent — while a point with both dates keeps the explicit Save (range edits stay
  deliberate; nothing changes there). Mechanism: `attachDateCalendar` gains an `onPicked` hook;
  each Schedule `dateField` wires it to `save()` gated on the sibling field being blank.
- Verified live both ways: due-calendar day-pick with start empty → dialog closed, `due` written,
  start untouched; day-pick on a start+due point → dialog stays open, model unchanged until Save.
  The chip → dialog routing, keyboard paths (`/due:value`), and bulk-selection apply are untouched.
- Recorded in the ux-discipline Dates row. 901 tests (+1 wiring pin).

### LBL-1 ◐ Label surfaces trusted node.type; raw "## " shown for flag-absent headings (Fixes #420) (RESOLVED pending merge)
- **Adjudicated (owner, 2026-07-09): derive in `textForDisplay`, never trust the flag alone.** The
  render derives everything from the text (`mdToHtml` never reads `node.type`), but every label
  surface (`crumbLabel`/`displayTitle` breadcrumbs, Refile/Add-inbox tree pickers, backlink rows)
  stripped block prefixes only when `node.type` matched — so a doc whose OPML carried no `_type`
  (foreign tools, the embedded first-run Examples) showed "## Advanced" raw in the crumb while the
  outline rendered "Advanced". Fixed with one derivation line after the flag check: strip
  `BLOCK_PREFIX_MAP[deriveTypeFromText(t)]` with full parity. Chosen over normalize-on-load
  because it never mutates user data and covers docs that skip the loader. Verified live: the
  defect-shape node (`## Advanced`, type `ul`) labels "Advanced" in the breadcrumb and
  `displayTitle`. Pinned (5 cases, incl. the hashtag-is-not-a-heading boundary).
- **Also adjudicated this pass (owner, 2026-07-09): #390 CLOSED, decision stands** — the agenda
  stays a vertical stack at every width; no responsive side-dock fork. The #389 ceiling + the
  one-view-at-a-time switcher bound the cost the issue measured; the recorded fallback if it still
  bites is a desktop pane max-height, not a sidebar.

### GLYPH-1 ◐ Glyph identities: template, progress, and Check get their own glyphs (Fixes #412 #413) (RESOLVED pending merge)
- **The fleet's two DL §1 glyph findings, closed with a real subset rebuild** (the egress block
  UXP-170 hit is gone; `tools/build-fa-subset.py --check` resolved all 63, build + splice clean).
- **#412: one glyph carried two unrelated concepts, twice.** `fa-clone` was deck AND both template
  verbs (+ `TEMPLATE_ICON`, so the picker/save-dialog/bullet-row too); `fa-circle-half-stroke` was
  theme AND the Progress door. The recorded identities keep their glyphs (deck = `fa-clone`,
  theme = `fa-circle-half-stroke`); **template → `fa-stamp`** (the stamp-a-copy verb) and
  **progress → `fa-bars-progress`**, updated at every referencing surface so door, dialog, and
  keyboard row agree.
- **#413: three check-family glyphs clustered in the one / menu** (To-do `fa-regular
  fa-square-check`, DONE `fa-solid fa-square-check`, Check `fa-solid fa-circle-check`). The task
  pair keeps its checkbox family (unchecked/checked ends of one concept, defensible); the **Check
  verb → `fa-clipboard-check`** (a pass/fail assertion), `CHECK_ICON` updated so the dialog +
  bullet-menu row agree. The file-menu's saved-status `fa-circle-check` is a success cue — a
  different concept — and stays.
- All three identities recorded in design-language §1 beside the fa-left-right precedent. The
  subset gains 3 glyphs (63 total); `ICONS` in the build script is the source of truth.
- **Verified painting (the step the workflow says never to skip):** all three new glyphs render
  the real FA font at non-zero width after `fonts.ready`, and the pre-existing identities
  (clone/half-stroke/square-check/d20/check/book) survived the rebuild.
- 896 tests (+1: the four identities + FA_GLYPHS/::before presence pinned).

### CSS-1 ◐ CSS consistency batch: nine token/recipe drifts (Fixes #395 #396 #397 #398 #399 #400 #410 #411 #414) (RESOLVED pending merge)
- **The fleet's CSS cluster, closed in one CSS-only pass** (plus drift-guard pins). Worst first:
- **#395 (major): the / and @ menu's SELECTED row painted its accent icon tile at 1.62:1 dark /
  2.13:1 light** — the `.cmd-item.hi .cmd-icon{color:var(--fg)}` hover rule out-specified
  `.cmd-icon.accent`'s `--acc-fg`. One higher-specificity pairing rule restores the §3 law (ink on
  solid accent is always `--acc-fg`). Browser-verified: ink now #16130f on #a5b4fc (9.29:1).
- **#396 (major): one menu-row concept, four highlight recipes.** Converged to the `.cmd-item`
  canon (10% accent tint, ink unchanged, `--r-md`, 6px 10px): `.lp-item` + `.bm-item` lose the
  13%+accent-ink variant, `.mt-col-item` and `#bpop` keyboard focus lose the disabled-look gray
  (focus bg = hover bg + ring, one language for pointer and keyboard). DL §4's hover-language
  sentence now names all the row surfaces.
- **#411 (major): the base header echo never rendered** — column names computed 700 (the
  `.mt-name-pill` rule) and the declared 2px header rule lost specificity to the td/th border.
  Now 600 (never 700; the UXP-107 empty-cue survives as 400-vs-600) and
  `.md-table th.mt-colhead{border-bottom-width:2px}` actually paints. Verified computed 600 + 2px.
- **#399/#410 (minor): focus-ring stragglers.** `.fm-title` (was the hover hairline), `.doc-tab-close`
  (was opacity-only), `.zoom-title` (the one 70%-diluted ring) join the standard 2px solid accent
  ring; the four newer toolbar toggles get it by CLASS (`.tbtn-toggle:focus-visible` replaces
  `#btn-done:...` in the UXP-17 rule, so future toolbar buttons inherit automatically).
- **#400 (minor): danger is `--bad` everywhere** — the column/card menu's Delete rows wore `--del`
  (byte-identical to `--muted`), reading closer to "unavailable" than "destructive".
- **#397 (minor): the doc-tab strip adopts the FULL chip grammar** (`--bdr-ui` functional border,
  600 weight, 11px + glyph) — the 22px fix had left the other axes; `.ag-toggle` (the canon) now
  pins its own explicit 22px.
- **#398 (minor): the Week pane re-minted the urgency tint** (32/28% + 9% vs the 35/30% + 10%
  List/Month share) and its own done opacity. Converged; the deliberate two-density rule (roomy
  List row vs packed grid cell) is now recorded in DL §4.
- **#414 (minor): the sub-floor type cluster** — `.sf-tip`, `.sh-ws-snip`, `.sh-row code`,
  `.agd-count`, `.agd-more` raised to the 11px floor; `.agg-tick` earns 10px via the caps-eyebrow
  exemption (matching its UXP-154 siblings); `.sc-or` drops the opacity fade (de-emphasis by role).
- 895 tests (+1 batch drift-guard pin covering all nine). CSS-only; no markup or behavior changes.

### DOC-1 ◐ Doc-truth pass: inventory rot, keyboard-grammar lag, dial-doc reversal + drift guards (Fixes #393 #408 #409 #394) (RESOLVED pending merge)
- **The fleet's doc-truth cluster: the binding standards had drifted from shipped code in both
  directions, and nothing enforced them.** One pass over ux-discipline.md §2/§3/§7.1a, ux.md, the
  `?` panel registry, plus three CI drift guards so the rot can't silently return.
- **#393/#408 (major): the closed syntax inventory certified wrongly.** §2's Search-query row said
  "AND-only; OR deferred; no `state:` operator" while QX-5 OR, `state:`, `priority:`, `var:`,
  `key:>N`, `due:week/month` and the `has:` family all shipped sanctioned; the Grammar-engine row
  omitted four shipped brace sub-forms (`{query:}`, `{roll:}`, `{prop}`, `{date due|start:}`); the
  Dates row described a retired 2×2 agenda. All rewritten to shipped reality with ledger citations.
  **Charter adjudication (#393 A): the brace overload is BLESSED and recorded** — the Owns column
  now reads "generative, computed, and **declared-config** inline content", naming the `{prop}`/
  `{date}` cluster a recorded widening (overloading the one brace beats minting a sigil, P5-1).
- **#409 (major): §3 keyboard grammar lagged four shipped chords** (verbosity dial fwd/rev, ⌘D
  duplicate, ⌘⇧⌫ delete point, ⌘⇧V variables panel — rows added), quoted a stale five-verb
  `SLASH_ARG_VERBS` set in two places (now the nine-verb membership formulation, regex
  authoritative), missed the LF-1f selection extension on the ⌘⇧S/⌘⇧P rows (noted), and the `?`
  panel taught every chord except the dial (GUIDE row added: "Verbosity dial: quieter / more
  guidance").
- **#394 (minor): ux.md still recorded the dial the app does NOT ship.** The Decision section
  claimed Standard was deferred-until-data (LF-2d shipped it by owner direction); the dial table
  contradicted the shipped strips on four rows. Rewritten to the shipped 3-tier reality: Standard
  strips the three teaching aids, Lean adds the caret-tip menu + focus-revealed pencils, modal
  chips are NOT tier-gated (that cell was never built), the toolbar is invariant by owner spec.
  **Tooltip adjudication (#394 point 5): LF-2d governs** — the LF-2c "conscious skip" note is
  marked superseded in place; the `isStandardOrLean()` sweep stands.
- **Enforcement (#393 B): three drift guards added to CI** — (1) every brace sniff function in
  index.html must have its syntax token in the §2 inventory; (2) the `is:` whitelist regex in
  `parseSearchQuery` must match the §2 row keyword-for-keyword; (3) every `SLASH_ARG_VERBS` member
  must appear in the §3 row. Shipping syntax without recording it now fails the suite.
- 894 tests (+3 drift guards). Doc-only except one GUIDE registry row (the dial chord entry).

### KBD-1 ◐ Editing-keyboard majors: fence split, Esc double-rung, silent date decline (Fixes #405 #406 #407) (RESOLVED pending merge)
- **The fleet triage's editing-keyboard batch: three majors on ordinary keystrokes.**
- **#405 (major): Enter mid-fence split a code block into two broken halves** (unterminated opener +
  orphaned closer, "line two" silently demoted to prose). New pure `inFence(text, offset)`: strictly
  inside a fence region (fence lines inclusive, region edges exclusive — those split into two VALID
  halves; an unclosed opener protects to end-of-text) the caret-split arm now declines and falls
  through to the eject arm — the advertised "Enter exits to a new point", block intact. The eject
  sibling matches the pre-existing caret-at-end eject exactly (verified, including its inherited
  type). Chose decline-over-fence-reclosing: it matches the shipped copy and the UXP-68 precedent
  (Backspace-merge already declines into code).
- **#406 (major): Esc while editing inside a zoom consumed two rungs in one press** (zoomOut's
  re-render killed the active edit, so zoom + blur collapsed together, violating the §3 one-rung
  ladder). The Esc arm now carries the edit across the re-render: capture caret, `zoomOut()`, then
  `focusNodeAtOffset(id, off)` (both sides unfolded, same offset space). Verified: Esc 1 = zoom out
  with the edit intact and the caret exactly preserved; Esc 2 = the unchanged blur rung. (Repro'd
  the double-rung on a served copy of main first.)
- **#407 (major): an invalid `{date due: }` value failed silently on exit while edit styling
  promised a pill.** The UXP-6 lockstep contract was broken for this branch: classify said
  "artifact", promote declined to literal with no signal. `classifyBraceBody` now returns `invalid`
  for a dateDecl body whose value fails `parseDueDate` (empty stays valid — it clears the date), so
  the gr-bad marker + AT announcement fire LIVE; and the exit decline now flashes the same
  "Not a valid date" message as the `/due:value` twin (P4 parity). Verified live on both surfaces.
- 891 tests (+5: inFence boundary pins, the split-arm veto wiring, the Esc carry-across pin, the
  classify date-lockstep pins incl. impossible calendar dates, the decline-flash pin).
- **Verification note:** an OS-unfocused Chrome window fires NO focus/blur events (`el.blur()` is
  event-silent), so blur-rung assertions must run in a focused window — the "residue" that cost an
  hour here was that artifact, not a defect.

### FEED-1 ◐ Toast error priority + docked-stack viewport ceiling (Fixes #391 #389) (RESOLVED pending merge)
- **Two adversarial-standard findings where the fleet challenged a locked decision's unstated
  corollary and the measurement sided with the fleet.** Both fixed inside the challenged decision
  (one feedback pattern kept; docking kept), and both standards now record the missing rule.
- **#391 (major): the single-toast channel silently swallowed errors.** `flashHint`/`flashError`
  share one element + one timer with last-writer-wins, so a "couldn't write to the folder" error was
  replaced mid-dwell by the next "Captured N" hint — the exact failure P4-1 exists for, on the
  channel capture made high-traffic. Fixed with the pure `toastGate(kind, now, holdUntil)`: an error
  owns the element for its 4s dwell (the dwell constant lives ONLY there); a mid-dwell hint defers
  (announced to AT immediately, the LAST one replays visually after the dwell, un-reannounced); a
  new error always preempts. Rule recorded in ux-discipline §6. Verified live: the issue's exact
  repro now shows the error red for the full dwell, then replays "Captured 3".
- **#389 (major): the everything-docks model had no height ceiling** — agenda-Month + capture +
  journal measured 123% of a landscape phone: the fixed chrome was taller than the screen, the
  outline permanently covered, the strips' own lower controls unreachable. Failsafe shipped:
  `#toolbar` clamps to `100dvh` (flex column, `>*{flex-shrink:0}`), and `#agenda-strip.on` — the one
  tall pane — is the designated shrink-and-scroll region (`flex-shrink:1;min-height:0;overflow-y:auto`).
  Ceiling rule recorded in design-language §4 so the NEXT docked surface is designed against it.
  Verified live at 844×373: toolbar = exactly the viewport (was ~483px natural), agenda scrolls
  internally (263 vs 357), desktop 1200×800 untouched (pane at full natural height, no scroll).
- 886 tests (+3: toastGate boundary pins, the flash-wiring src-pin incl. deferred-hints-still-announce,
  the CSS ceiling drift-guard).

### MENU-1 ◐ Base/board menu operability: flip clamp + card-opener event contract (Fixes #415 #417) (RESOLVED pending merge)
- **The fleet triage's board/base operability pair: two majors on the newest surfaces, shippable
  regardless of how the #416 mega-menu decision lands.** Both browser-verified live on the fixed file
  (localhost, real base + board rendered from an injected doc).
- **#415 (major): a tall Column/Row/Card menu opened from a mid-screen anchor rendered its head at
  negative y.** `mtOpenMenu`'s flip was `top = anchor.top - height` with no top clamp, so with the
  ~970px Column panel the Calculate/Formula sections (the head of the menu) sat above the viewport,
  unreachable by mouse and focus-invisible. Fixed: the flip now picks the side with more room, CLAMPS
  the panel on-screen via an inline `max-height`, and hands the overflow to the panel's own scrollbar;
  each open resets the previous clamp first. Verified: anchor at y 465-498 in a 709px viewport gives
  panel top 8px, max-height 455px, bottom edge at the anchor, scrollbar live (was top -47px).
- **#417 (major): the board card's move menu opened on `mousedown`, but the document-level closer
  listens on `click`** so the SAME gesture's click bubbled to document and closed the menu it had just
  opened. Mouse saw a flicker; touch (where drag is off) had **no working move door at all**, the LF-3c
  claim. Fixed: `showCardMenu` moved to a `click` listener with `stopPropagation` (the exact contract
  the header-cell opener already honors: "a click that reaches document is always outside"); `mousedown`
  keeps only the caret-invariant `preventDefault`. Verified: mousedown alone opens nothing, the full
  down/up/click gesture leaves the menu OPEN with the lane targets, an outside click still closes it.
- 883 tests (+2 src-pins: the clamp exists and resets per open; the card opener and the document closer
  agree on `click`, with `mousedown` pinned to never call `showCardMenu`).

### FR-1 ◐ First-run bundle: four fleet findings on the boot path (Fixes #401 #402 #403 #404) (RESOLVED pending merge)
- **The design-review fleet's worst cluster: the first frame a new user sees shipped with three stacked
  majors** (no prior sweep ever booted fresh). All four fixed in one pass, browser-verified on a real
  fresh boot of the fixed file served over localhost.
- **#403 (major, two-lens convergence): the tour's sole `{level := 3}` rendered struck-through.** The
  positional shadow loop marked a declaration dead whenever no same-name REFERENCE event followed it,
  even when no later declaration existed either; identifiers consumed only by math/grammar pills emit no
  reference events, so any computation-only variable was falsely flagged with a false tooltip. Fixed by
  extracting the loop into the pure `shadowedDeclKeys(events)`: shadowed now requires a LATER same-name
  DECLARATION to actually exist, making the tooltip true by construction. Pinned (6 boundary cases).
- **#401 (major): the first-run banner covered the Welcome H1.** `#storage-warn` is fixed below the
  toolbar but body padding compensated only for the toolbar. The body-pad ResizeObserver now observes the
  banner too and adds its height while `.on` (banners push the outline down, never overlap: the §4 rule
  the docked strips follow). Verified: banner bottom 107px, first row top 144px, no overlap.
- **#402 (major): fresh boot dropped the caret into the tour title**, so the first frame was raw
  `# Welcome to Pointliner` instead of the composed masthead. The boot rAF now skips `focusNode` when
  `_showingExamples` (the same read-first treatment the C1 snapshot gets). Verified: first row renders an
  `<h1>`, nothing is in edit mode.
- **#404 (minor): the welcome greeting wore the warn caution tint.** New `#storage-warn.invite` variant
  (accent tint recipe, `role=status` instead of `role=alert`), used only by `showExamplesBanner`;
  `hideStorageWarn` clears it and restores the alert role, and the CSS is ordered so `.soft` wins if a
  caution banner ever replaces the invite without a hide. Verified: `.invite` + `role=status` + accent bg.
- 881 tests (+1 pure-core pin). All four verified live; the issues close via this PR.

### STRIP-2 ◐ Workspace tabs + agenda date switchers: height + text-scale mismatch vs the strip band (user-reported) (RESOLVED pending merge)
- **User caught a real visual-consistency bug my a11y audit missed.** The prior pass judged these families
  against the tap-target FLOOR (and found them fine on touch), but the user's actual complaint was that the
  workspace doc tabs and the agenda date/month switchers are **visibly TALLER than every other pill in the
  strip band**, and the calendar text sizes are ad-hoc. Browser-measured: `.doc-tab`/`.doc-tab-add`/
  `.agc-nav` were **28px** vs the **22px** strip baseline (`.cap-chip`/`.ag-toggle`), a design-language §4
  violation ("every control in a docked-strip row shares one 22px height"). And the date text was 16/17/15/
  10px with no coherent scale.
- **Fixed (browser-verified before + after).** Heights: `.doc-tab` 28→22, `.doc-tab-add` 28→22 square,
  `.agc-nav` 28→22 square (all now === the 22px strip baseline). Text: `.agc-nav` glyph 16→13px + `.agc-title`
  15→13px (compact chrome that fits the 22px row); `.agc-dom` day numbers 10→11px + `.agc-dow` weekday
  eyebrows 10→11px (design-language §176: no informational text below 11px, the eyebrow caps/tracking role
  kept). Confirmed the calendar cells don't overflow with the 11px numbers, and the whole switcher row now
  aligns to 22px. `.agc-today` (already 11px/600) and the contrast/radii/focus/aria (all passing) untouched.
- **Lesson (compounding the STRIP-1 one):** an accessibility audit is not a visual-consistency audit. The
  first pass measured the a11y floor and declared "conformant"; it never compared the chip HEIGHTS to the
  sibling strip pills, which is the design-language §4 requirement the user actually saw violated. Measure
  the right property for the right standard.
- 880 tests (+1 drift-guard pin: the 22px heights + the 11px text floor + the compact 13px title/nav).

### STRIP-1 ◐ Conformance audit of the capture + journal strip pills (browser-measured) (RESOLVED pending merge)
- **A full conformance pass** on the docked-strip pill vocabulary (the `.cap-*` family shared by the
  capture and journal strips, per design-language §4 "docked strips share one grammar"), measured live in
  a browser against all three standards (design-language, ux-discipline, ux-definition-of-done). **Verdict:
  basically conformant, ship-worthy.** PASS on contrast (all ≥ 4.5 vs the 4.5 floor), radius tokens
  (`--r-sm`/`--r-xs`), focus-visible on every segment, one-glyph-per-concept (✕/pencil/+/slot), ARIA +
  accessible names, vocabulary ("point"/"inbox", correctly NOT "pill" since these are toolbar chips not
  inline artifacts), P4 feedback (every action flashes/announces), and cross-strip + cross-app consistency
  with `.ag-toggle`/`.sh-chip`. Two findings worth acting on:
- **F1 (type-scale, FIXED).** `.cap-chip` inherited the 17px body size and `.cap-chip-badge` used
  `font:inherit` (which reset to 17px, line-height 26.35px) instead of the 11px docked-strip scale. Latent
  (masked by the 10px slot-n being the only visible text) but a §4 violation + a trap for the next edit.
  Fixed to `font-size:11px` (line-height 15.4px, matches `.ag-toggle`), browser-verified. Drift-guard pinned.
- **F2 (tap targets, STANDARD RECONCILED).** The strip's touch hit-areas are 36–38px (a 20–22px chip +
  the `::after inset:-8px` overlay). This PASSES WCAG 2.2 §2.5.8 (24px) but missed the guardrail's written
  "~44px". Browser-measured that this is STRIP-WIDE (`.ag-toggle`/`.ag-chip`/`.sh-chip` all use the same
  36–38px idiom) → the CODE is internally consistent and the DOC drifted to an aspirational number nothing
  honored. Chosen fix (owner call): reconcile the standard, not touch every strip. `accessibility.md`
  guardrail 5 + the DoD now state the real floor ("clears WCAG 2.2 24px, aim for the 36–38px overlay
  idiom"), so code and spec agree. The strip pills conform as-is.
- 879 tests (+1 type-scale drift-guard pin). Browser-verified F1 fix + F2 measurement; no browser-down
  caveat.

### INBOX-4 ◐ The ✕-hidden bug's ACTUAL root cause: global button{flex-shrink:0} (browser-verified) (RESOLVED pending merge)
- **INBOX-1 and INBOX-3 both mis-diagnosed this.** After two "fixes" (`.cap-chip-rm{flex-shrink:0}`,
  then `.cap-chip{min-width:0}`) the ✕ STILL vanished on a long inbox label (user screenshot). I stopped
  guessing and opened the deployed page with the browser tools + measured computed styles. Finding: the
  chip WAS clamping to 230px and the ✕ WAS positioned, but `getComputedStyle('.cap-chip-pick').flexShrink`
  was `0` — the name button inherits the **global `button{flex-shrink:0}`** rule. So the label refused to
  shrink, its `min-width:0` + `text-overflow:ellipsis` never fired, and it pushed the ✕ out of the
  `overflow:hidden` chip (clipped = invisible). The prior two fixes were real but addressed the wrong
  element; neither could work while the label itself would not shrink.
- **Fix (browser-verified live before AND after).** `.cap-chip-pick{flex-shrink:1}` overrides the global
  rule → the label truncates with an ellipsis and the ✕ sits inside the chip. `.cap-dest-name-btn` had the
  identical latent bug (same global rule) → same `flex-shrink:1`. Confirmed in-page: chip stays 230px, ✕
  visible + inside, ellipsis fires; main-strip pencil stays inside its dest box.
- 878 tests. The chip pin was STRENGTHENED to assert `.cap-chip-pick{flex-shrink:1}` +
  `.cap-dest-name-btn{flex-shrink:1}` + that the global `button{flex-shrink:0}` it overrides still exists
  (the previous pins asserted the wrong properties and gave false confidence — that's why the bug survived
  two PRs). **Lesson: for a "sizing looks wrong" CSS bug, read the COMPUTED style in a browser before
  editing; a source grep can't see an inherited global rule.**

### INBOX-3 ◐ Oversized inbox chip still hid the ✕; manager chips didn't navigate (user-reported, follow-up) (RESOLVED pending merge)
- **Two reports after INBOX-1/2.** (1) The ✕ STILL vanished on a long-labelled inbox chip: INBOX-1's
  `flex-shrink:0` on `.cap-chip-rm` was necessary but not sufficient. The real cause is that `.cap-chip`
  is a flex ITEM in `.cap-mgr` with no `min-width` → defaults to `min-width:auto`, which refuses to
  shrink the chip below its content's intrinsic width, so a long name overflowed `max-width:230px` and
  pushed the ✕ out. Fixed by adding `min-width:0` to `.cap-chip` itself (the chip must be allowed to
  shrink; the name segment then truncates as designed). Two-level flex bug: BOTH the shrinkable child AND
  the chip-as-item needed the min-width:0 escape from auto. (2) Clicking a MANAGER chip only selected it
  as the capture target, it never navigated to that inbox's point ("each has a location that isn't
  necessarily the same place").
- **Built (chosen "name zooms, keep select separate" via AskUserQuestion).** Each manager chip is now
  three segments, mirroring the main-strip destination: a `.cap-chip-badge` (the slot number → SELECTS it
  as the capture target), the `.cap-chip-pick` NAME (→ `zoomInto` that inbox's point), and the ✕. Focus
  rings, touch tap-target overlays, and the touch corner-rounding retargeted for the new badge|name|✕
  order (the badge carries the left rounding).
- Concept-guide `capture` + `guide/tasks-and-organizing.md` updated. 878 tests (+1 pin: the three-segment
  split, badge→select, name→zoomInto, chip `min-width:0` + ✕ `flex-shrink:0`). Browser down → src-pinned;
  a smoke test should give an inbox a long name (the ✕ stays visible + deletes) and click a chip's name
  (zooms to its point) vs its badge (targets it).

### INBOX-2 ◐ Split the capture destination: name zooms into the inbox, a pencil opens the manager (user-requested) (RESOLVED pending merge)
- **Request.** The main-strip destination `.cap-dest-btn` was ONE button that did one thing (toggle the
  manager). The user wanted (a) an explicit PENCIL to open the manager (matching the pill-pencil
  affordance), and (b) the destination NAME/pill to be clickable to ZOOM into the inbox point (navigate
  to where captures land).
- **Built.** The dest is now a two-part control: a `.cap-dest-name-btn` (slot number + name → `zoomInto`
  the inbox point on click; when no inbox is set it opens the manager to choose one) + a `.cap-dest-edit`
  pencil (the same subsetted `fa-pen` glyph as `.dice-edit`; carries the `aria-expanded` state; toggles
  `captureManage`, the second strip). The `.cap-dest-btn` becomes a bordered `<div>` wrapping the two;
  the pencil is `flex-shrink:0` with a left divider like `.cap-chip-rm`, so a long name truncates the
  name button, never squishing the pencil (the same class of fix as INBOX-1's ✕). Focus-visible + the
  touch tap-target overlays retargeted from the old single button to the two children.
- Concept-guide `capture` entry + `guide/tasks-and-organizing.md` updated (pencil opens the manager,
  name zooms). 877 tests (+1 src-pin: the two-button split, name→zoomInto, pencil→toggle-manager + its
  aria-expanded, the unset-fallback, and the shrink-proof pencil glyph). Browser down → src-pinned; a
  smoke test should click the destination name (zooms to the inbox) and the pencil (opens the manager).

### INBOX-1 ◐ Can't delete an inbox with a long label; can't reorder inboxes (P2/P4, user-reported) (RESOLVED pending merge)
- **Two problems in the capture strip's inbox chips.** (1) DELETE: `.cap-chip-rm` (the ✕) had no
  `flex-shrink:0`, so a long point label (which `crumbLabel` puts in `.cap-chip-pick`) squished the ✕'s
  clickable width, and on touch (`.cap-chip{overflow:visible}`) the label could overflow and cover it,
  so the inbox couldn't be removed. Fixed with one line: `.cap-chip-rm{flex-shrink:0}`, the label (which
  already has `min-width:0` + `text-overflow:ellipsis`) truncates instead. (2) REORDER: no way to change
  which capture # (slot) an inbox answers to; the chips were fixed in `root.inboxes` order.
- **Reorder built.** Pure `reorderInboxList(list, from, to)` (splice-out + reinsert, 1-based, trims
  trailing nulls like `setInboxSlot`) + a `moveInboxSlot` DOM wrapper (pushUndo + markDirty). Wired two
  ways per the hover-with-touch-fallback rule: HTML5 drag on the chip (desktop, `!IS_TOUCH`, with a
  `.cap-chip-drag` opacity cue) AND `Alt+Left`/`Alt+Right` on a focused chip (the app-wide
  `Alt+Arrow=move` grammar; this is the touch + a11y path since HTML5 drag never fires on touch). A move
  keeps the moved inbox selected (`captureSlot = to`), re-renders, and announces the new slot.
- Documented in the concept-guide `capture` entry + `guide/tasks-and-organizing.md`. 876 tests (+2 pins:
  `reorderInboxList` move/no-op/out-of-range/null-trim/immutability; the drag + Alt+Arrow wiring + the
  `flex-shrink:0` delete fix). Browser down → the drag/keyboard flow is pure-core + src-pinned; a smoke
  test should give an inbox a long name, confirm the ✕ still deletes it, and drag / Alt+Arrow a chip to
  reorder.

### ESC-1 ◐ Backtick code spans did not escape pill promotion (P1, escape hatch) (RESOLVED pending merge)
- **Problem (user-reported).** Inline `` `code` `` is the universal "render this literally" convention,
  and `mdInline` already stashes it at render time, so a `` `{2d6}` `` *displays* as literal code. BUT
  `promoteInlineShorthand` scans `node.text` for `{` blindly on exitEdit (BEFORE any render) and mutates
  the source of truth, so it promoted `{2d6}` inside backticks to a `[[dice:KEY]]` token anyway, leaving
  the backticks wrapping a pill. There was no working way to type a literal `{2d6}` to write ABOUT the
  syntax (e.g. inside Pointliner-about-Pointliner notes). Two layers (render vs. promote) disagreed on
  what "inside code" meant, and promote (which runs first + mutates) won.
- **Fixed.** Pure `codeSpanRanges(text)` (finds inline `` ` `` spans, same regex as mdInline's `code`
  stash) + `inCodeSpan(ranges, i)`. Wired into every brace scanner so promote / mid-edit styling /
  display / the `{` picker all agree: a `{…}` inside a code span stays literal. Sites: `promoteInline
  Shorthand` (exit + load-time via `promoteLoadedShorthand`, which reuses it), `highlightGrammarText`
  (mid-edit `.gr-src` styling), and `checkBraceTrigger` (the rule-completion menu no longer opens inside
  code). Per-brace precision: `` `{a|b}` `` stays literal while a real `{2d6}` on the same line still
  promotes.
- 874 tests (+2 pins: `codeSpanRanges`/`inCodeSpan` find spans + match mdInline's regex; `` `{2d6}` ``
  survives promote verbatim while a bare one still promotes, mixed case included). Guide updated
  (`writing-and-formatting.md`: code marks also keep pills literal). Browser down → the live typing flow
  is pure-core-pinned; a smoke test should type `` `{2d6}` ``, click away, and confirm it stays text.

### DIAL-R ◐ Verbosity dial panel review: fix the blind-menu blocker + polish (RESOLVED pending merge)
- **A 6-lens design panel** (newcomer, power-user, a11y, consistency, discoverability, scope; 36 findings)
  reviewed the 3-position dial. Verdict: fundamentally well-built, scope discipline a model, 9 praise
  findings; ONE blocker + a few cheap polish items. Acted on the blocker + the highest-value polish; left
  the marginal ones the panel itself flagged as not-worth-it (e.g. rebalancing the tiers, per-helper
  dismissal, an FA icon swap that needs a network-blocked subset rebuild).
- **BLOCKER — the blind Lean menu (5/6 lenses converged; a11y: a screen-reader trap; power-user: no
  confirmation before Enter; newcomer: blank screen).** In Lean the / @ menu rendered NOTHING. Fixed:
  `renderLeanSlashTip()` shows a one-line STATUS readout of the current match (`<b>Dice</b> 1/6 ↵ insert`)
  at the caret (a `#lean-slash-tip` `role=status`, not a menu/submenu — no list, pointer-events off) AND
  `announce()`s it to `#a11y-live` so AT speaks it. Follows arrow-nav (`slashMove` updates it) + hides on
  close. Reuses a shared `placeAtCaret` (factored out of `positionSlashMenu`). Floor-respecting: no
  dialog/submenu, top bar untouched.
- **COPY (3 lenses) — flash + CUR_DESC rewritten** to name the real trio Standard/Lean strip (point
  hints, pill tooltips, AND the search cheatsheet — the last was never named yet is the only teacher of
  search syntax), split Lean's two distinct behaviors (menu → match tip; pencils → focus-reveal), one
  stable vocabulary, and append `⌘⇧.` to every flash.
- **RATCHET (2 lenses) — reverse cycle.** `⌘⇧,` (the `,`/`<` key) now cycles toward MORE guidance
  (`toggleVerbosity(-1)`), so a lost user isn't forced to loop forward through every tier to get help back.
  The collapse handlers (`Ctrl+.`/`Ctrl+,`) gained `!e.shiftKey` guards so the dial keys don't double-fire.
- **AT-REST TELL (2 lenses) — the File-menu row** now reads `Verbosity: Guided ●○○` (current tier + a
  3-stop dot track) so it's legibly a dial with a position, not a 2-way toggle. (The `fa-feather` icon
  swap the panel also suggested needs an FA subset rebuild = network-blocked; deferred, the `≈` fallback
  reads acceptably as "levels".)
- **CLEANUP — retired the legacy `lean-mode` body class** (dual source of truth with `v-lean`); the
  pencil-suppress CSS now keys on `body.v-lean` directly.
- 872 tests (2 dial pins rewritten for the new reality: the directional cycle + reverse shortcut; the
  lean match-tip + AT announce; `v-lean`-drives-CSS + no-lean-mode guard). Self-checked the reverse cycle
  wrap + dot track. Browser down → the lean tip's live behavior is src-pinned; a smoke test should enter
  Lean, type `/di`, and confirm the one-line "Dice" tip appears + is announced.

## Adversarial robustness pass WAVE 3 (2026-07-03, TENTH — the ingestion-depth target waves 1+2 deferred)

A focused single-target pass on the one break both prior waves explicitly LEFT for a third wave: the deep-tree recursion at the ingestion boundary. Confirmed real (a 12000-deep tree overflows toOpml/collectVars/collectRules/render at ~1500 levels), then fixed at the gate. Not a full fleet — the target was already named; this confirmed + closed it.

- **HARD-11 ◐ a pathologically deep tree overflows the recursive walkers on load/serialize (CRASH).** A hostile/corrupt OPML or self-contained HTML nested past ~1500 levels loads into memory via `fromOpml` (its `po()` and the downstream `toOpml`/`collectVars`/`collectRules`/`render` are recursive), then throws `RangeError: Maximum call stack size exceeded` on the first serialize or render — and re-crashes on every reopen. A real document is a handful of levels deep. FIX: (1) `po(el, depth)` throws past `MAX_OPML_DEPTH` (1000, well under the overflow point, well over any real doc), so the deep tree never enters memory — callers already catch `fromOpml` throws and `flashError('Could not open: …')`; (2) the defensive twin `treeDepthExceeds` (an ITERATIVE stack-based check, so it can't itself overflow) guards `applyAutosaveData`, which sets `root` from a raw JSON blob and bypasses `fromOpml` — a tampered-localStorage deep tree is rejected (falls back to Examples) instead of bricking boot. Verified: a 12000-deep tree is rejected, a 50-deep passes, the checker survives the depth it tests.

---

## Adversarial robustness pass WAVE 2 (2026-07-03, NINTH — fresh surfaces the first wave didn't own)

A second red-team fleet aimed at surfaces wave 1 never touched (interactive DOM/structural ops, cross-doc workspace, markdown/table compute, ingestion, caret/undo), with the wave-1 fixes + held surfaces declared OUT of scope. **8 raw → 4 reproduced, 3 held, 1 refuted.** The interactive structural surface held cleanly (the `isDescOf` drop guard, `render()`'s self-commit, unique-id gen, the `\x00` placeholder sentinel), but it found a worse bug than any in wave 1: a NORMAL gesture that silently destroys data. All 4 fixed in one PR (pure guards).

- **HARD-7 ◐ inline-format across an atomic pill deletes it + orphans its sidecar (DATA-LOSS).** Selecting text that crosses a `[data-token]` pill (named grammar/markov/seq/query/declaring-var) and clicking Bold/Italic/Link ran `execCommand`/`applyInlineReplace`, deleting the token from `node.text`; on blur the orphaned sidecar was pruned, cascade-breaking every OTHER point that referenced that doc-wide artifact. Silent (the user meant to format text). FIX: guard the top of `applyInlineFormat` — if the range `intersectsNode` any `[data-token]`, no-op + `flashHint`. Inline-able pills (dice/math/anon grammar) unfold to `{…}` and were already safe.
- **HARD-8 ◐ duplicate `_id` on import collapses the index → DOM/tree desync (DESYNC→data-loss).** An OPML/HTML with two `_id="X"` made `buildIndex`'s last-wins Map resolve one id to a single node while `render()` painted two rows; the ghost row's clicks/edits/drops misdirected to the other node, then autosave persisted the corrupted tree. FIX: a `seenIds` Set in `fromOpml`'s `po()` reassigns a duplicate to a fresh `uid()`, keeping the index 1:1. No-op for clean docs.
- **HARD-9 ◐ the `#ERR` computed-cell marker renders as a live hashtag (DEGRADATION).** `computeTable`'s `#ERR (…)` went through `mdInline`'s hashtag pass → a clickable `#ERR` pill that filters the whole doc (and `mtRecompute` baked it into the tag picker in an interactive base). FIX: both cell paths (`mtInline`, `renderStaticTable`'s `cellMd`) short-circuit `/^#ERR\b/` to `escHtml`, keeping the marker as plain text.
- **HARD-10 ◐ the fixed atomic-write temp name races a doc-switch flush (DEGRADATION).** `switchWorkspaceDoc`'s pre-swap flush bypasses the `_wsWriting` lock, so a switch racing the in-flight autosave put two writers on one `.NAME.pltmp`; the collision threw a spurious "could not save" prompt + a false `degradeWorkspace()`. No data was ever at risk (both wrote byte-identical bytes, `move()` is atomic). FIX: a per-write-unique temp suffix (`_wsTmpSeq`) so the two writers never share a temp; the stale "the lock prevents concurrent temps" comment corrected.

**HELD:** interactive reparent/drag/bulk-move (the universal `isDescOf` cycle guard, `render()` self-commits the active edit, bulk ops re-look-up per iteration); cross-node dice-token paste (per-node sidecars → a pasted `[[dice:KEY]]` on a fresh point shows a safe `dice-bad "?"` marker, never hijacks); the deep-recursion class exists but is NOT reachable via interactive ops (depth grows one level at a time — flagged for the `fromOpml` ingestion boundary as a future clamp, not a wave-2 break). **Refuted (1):** an overstated `splice(-1,1)` catastrophe branch inside the real HARD-8 — `parentOf` always resolves to the containing parent, so `findIndex` never returns -1; the core desync stood, only the catastrophe was cut.

---

## Adversarial robustness pass (2026-07-03, EIGHTH — attacks the MACHINE, not the design)

A red-team fleet (5 attackers: grammar/dice/math fuzzer, OPML/persistence corruptor, XSS/injection, edit-mode/save-race, search/date/table) whose job was to CRASH / CORRUPT / LEAK, not critique. Every finding required a reproduction, not an opinion. **20 raw attacks → 6 reproduced, 13 surfaces HELD, 1 refuted.** The app held up well — `ex()` escaping, `withFoldedActive`, `parseDueDate`'s ISO clamp, the null-return contract, and the depth/cycle guards all repelled their attacks. The 6 real breaks share ONE root cause: **the interactive creation paths clamp/escape, but the load-from-OPML path trusts the sidecar JSON** (the correct threat model for a file-opening local-first app). All 6 fixed in one PR (in-file guards, no dep/syntax/backend). 833 tests (+5 hardening pins).

- **HARD-1 ◐ `{Nx:}` repeat bomb (DATA-LOSS).** `{99x:{99x:{99x:{99x:a}}}}` (33 chars) multiplied WIDTH inside one depth increment → 192MB/OOM, and re-detonated on every reopen (persists in `node.text`), so a saved/shared doc became permanently un-openable. FIX: a `ctx.emitted` output budget (`GRAMMAR_OUTPUT_CAP` 100k) in `expandTemplate` (the one chokepoint) + a break in the repeat loop → returns the `…` marker. Verified: the bomb caps at ~40k in 10ms; `{3x: x}` → `x x x` unaffected.
- **HARD-2 ◐ markov `steps` unclamped on load (CRASH).** `makeMarkovRoll` clamps to 500 but only at the dialog; `expandRule`/`rerollMarkov` ran `walkMarkov` with a loaded `steps:1e9` → OOM. FIX: clamp inside `walkMarkov` (the single consumer), same 500 bound. Verified: `steps:1e9` → 501-element path.
- **HARD-3 ◐ over-long `#tag` regex crash (CRASH).** A ~32k `#tag` compiled to a `new RegExp` past V8's program limit → `SyntaxError` mid-`render()`; a persisted query pill threw on every render (doc won't display). FIX: cap the `#` arm at 512 in `parseSearchQuery` → falls through to a text term (only `termMatchesNode` builds a regex from tag text; `mdInline`/`collectTags` use a fixed pattern). Verified: 40k `#tag` → text term.
- **HARD-4 ◐ dice-label XSS (INJECTION).** `diceBreakdownHTML` built the label from `p.count`/`sides`/`target` with NO `escHtml` (while the roll faces beside it WERE escaped); a hostile `_dice` `count:"<img onerror=…>"` fired on open (a shared HTML opens in display mode, `restoreEmbeddedDoc` wins). Not reachable by typed `{2d6}` (parseDice coerces to int) — only via loaded sidecar JSON. FIX: `escHtml` the label in both the pool and plain arms. Verified: raw `<img>` gone, `&lt;img` escaped.
- **HARD-5 ◐ `dlOpml` silent-fail save (DEGRADATION).** A `toOpml` throw (deep-tree overflow) on the download path (Firefox/Safari) failed with zero feedback, unlike the FSA path. No data lost (autosave holds), but a Save that silently no-ops. FIX: try/catch → `flashError`, mirroring `writeH`.
- **HARD-6 ◐ `parseDueDate` relative-arm overflow (DEGRADATION).** `today+1e11` was unbounded (the ISO arm clamps 1900-2200) → a garbage epoch → `NaN-NaN-NaN` chip. FIX: bound the relative result to the same epoch-day window → null. Verified: `today+1e11` → null; `today+5` finite.

**HELD (attacked hard, did not break):** the grammar/dice/math null-return contract (`999999d999999`→null, self-grammar `↻`, deep recursion caught internally), `ex()` OPML/data-island escaping (a literal `</script>` never emits raw), every structured-attribute JSON parse (try/catch→`[]`, whitelist-filtered, "drop the bad keep the good"), `fromOpml` + persistence (malformed XML → clean Error every caller catches, quota → `autosaveDisabled`, folder write atomic temp+move), edit-mode serialize (`withFoldedActive` wraps every root serialize; `render()` refolds before wiping), search/date/table edges (`parseDueDate` rejects Feb 30, `computeTable` → visible `#ERR`, no wrong all-match).

---

## Standard-interrogation review (2026-07-03, SEVENTH pass — audits the RULEBOOK, not conformance)

A deliberately DIFFERENT seventh pass: after six conformance passes converged to hygiene, this one
inverts the question — are the LOCKED standards themselves right for real users, or optimized into a
local maximum? Five lenses (Notion/Obsidian defector, a11y realist, deep solo-RPG user, data-longevity
skeptic, product strategist) each challenged a specific locked decision from a real user's reality; a
steelman stage defended each rule as hard as possible. **24 challenges → 2 reconsider, 15 tension, 7
reaffirm, 0 strawman.** The soul held (offline-first, single-file, no-dependency, no-backend, closed
syntax, warm-paper ceiling all reaffirmed). Two genuine miscalibrations survived, BOTH hitting the
founding solo-RPG user. Findings are owner DECISIONS, not defects — most of this file's UXP items are
conformance fixes; these are strategic. Full memo in the session; the two actionable heads below.

### UXP-191 ◐ The px-locked base font silently ignores the browser font-size preference (P3-3) 🟡 (RESOLVED pending merge)
- **Problem:** `body{font-size:17px}` was a bare px root (zero rem font-sizes in the file), so a low-vision user's browser default-font-size setting — the primary, most-discoverable low-vision control, honored on virtually every text site — was silently overridden. The app honors `prefers-color-scheme` + `prefers-reduced-motion` but not this one signal, for the exact population a11y serves. Neither honored nor declared out of scope: silently broken.
- **Rule vs. reality:** P3-3 is a MUST (honor the user's system/browser signals). Not a taste call — an internal inconsistency with the app's own ethos, fixable at zero identity cost (no backend/dep/syntax/redesign).
- **Resolved:** `17px` → `1.0625rem` (== 17px at the default 16px root, byte-identical for default users; scales with the browser preference for everyone else). The whole em cascade rides it unchanged (h1.md-h `2em`, the `body.zoomed` step-downs, `fitZoomTitle`'s px measure). Pinned (base font must be rem). Verified: no `html{font-size}` override exists (so rem tracks the browser root), and the arithmetic gives 17px @16-root / 25.5px @24-root. **ponytail deferral:** the `max-width:720px` measure stays px — it's a cap that collapses to viewport (never breaks), only doesn't grow; re-clamp to `ch` only if large-font CPL drift is judged worth it.

### DECISION-191b ◐ No generator picks a random point from a live subtree (`{roll: query}`) 🟡 [design brief] (RESOLVED — owner signed off, shipped)

**OWNER DECISIONS (2026-07-03):** (1) SCOPE = subtree-by-default (the render node's descendants via `cookieNode`), whole-doc for free when the query names a `#tag` — no new query syntax, `parseSearchQuery` reused verbatim. (2) STATE = stateless inline expansion, no sidecar; consistency + freeze/re-roll ride the EXISTING pick-variable seam (`{w := {roll: …}}` → `rollPickSource` freezes, `rerollPickVar` re-rolls). Implementation rode this even leaner: `{roll:}` promotes to an anonymous `[[grammar:key]]` pill (`origin: {roll: …}`), so freeze / click-reroll / unfold / OPML round-trip ALL reuse the grammar machinery — zero new pill/sidecar/reroll fn.

**BUILT:** pure core `pickFromQuery(expr, rootNode, hostId)` (reuses `parseSearchQuery`/`queryMatchesNode`, collects ALL matches uncapped for a fair pick, excludes the host point, `''` on no match) + `rollParts` sniff (copies `queryParts`) + a `resolveBrace` `roll:` branch (before `condParts`) reading `cookieNode || root` + a `promoteBraceBody` branch + `classifyBraceBody` recognition. Doors: `?`-panel row, a `roll-query` concept-guide entry, `guide/features.md` + `generating-text.md`. 828 tests pass (pins: `rollParts`, `pickFromQuery` scope/exclusion/fair/empty, the `resolveBrace` dispatch+P4-marker, promotion→grammar-pill). Verification note: the `cookieNode` live-scoping read is a module `let` not reachable from the vm sandbox (same limit as `{= sum(subtree)}`), so it's core-tested via `pickFromQuery` + render-verified separately; the browser was unavailable this session, flagged in the PR.

<details><summary>original brief</summary>

### (superseded) DECISION-191b ☐ needs owner sign-off 🟡 [design brief]
- **The locked boundary:** every generative source (`{a|b}`, a named rule, a `{shuffle:}` deck) draws from LITERAL text authored in the rule/deck body; no reference form resolves to live tree content. backlog Tier 3 records it: "no `{thread}`-style generator that picks a random point under a parent … not expressible with the current engine."
- **Whom it costs (the founding user):** a solo GM keeps a live outline of open threads / NPCs and needs "advance a random open thread" / "a random NPC reacts." The dice engine — Pointliner's original reason to exist — can't see those points, so the GM must hand-copy every thread title into a `{shuffle: …}` deck body and re-edit it on every change. The living outline is invisible to the generator.
- **Why the boundary is not a wall:** the "grammar never reads the tree" premise is already false in shipped code — `{= sum(subtree)}` / `{= words(subtree)}` resolve by reading the render node's live descendants (`cookieNode`), and the `[[#id|]]` mirror transcludes another node's live content (CLAUDE.md's "one deliberate re-entrance"). Tree-reads-into-inline is an existing, controlled doorway crossed twice with sign-off. So this is an UNSCOPED design, not a forbidden one.
- **The design (for owner sign-off — NOT to build blind):** a new `resolveBrace` branch `{roll: <search-query>}` reusing the `parseSearchQuery` vocabulary (`{roll: is:todo under here}`) — NO new sigil, the P5-preferred "new brace branch, not a new delimiter". Rides the two existing tree-reading precedents. **Open decisions the owner must make:** (1) scope grammar — which subtree? whole doc? by `#tag` / `is:todo`? anchor on the render node like the rollups, or take an explicit scope? (2) the pick-consistency question a random pick over a live set reopens (deterministic rollups don't have it) — re-picked on every reference, memoized per render, or per click? Anchor the answer on the existing item-field pick-variable model (`w = {roll: …}` then `{w}` is stable). (3) the freeze/re-roll gesture (dice model: freeze on render, re-roll on click). Persistent-variable workaround does NOT cover this (can't declare a var over "whatever's under this parent now"). This is the memo's hardest push: the cost lands on the founding user and the fix violates no identity constraint. **Blocked on: owner decision (1)-(3), then build.**

</details>

### Reaffirmed (probed hard, the locked decision is RIGHT — do not revisit without cause)
No relation/rollup engine between bases · "one authoring language, never a new sigil" (P5) · the ~2em display ceiling + warm-paper-ink palette · no informational text < 11px · state-modulated odds via `{= expr}` weights · no render-time mutation (self-advancing counters) · seed-not-samples / data-not-code / plain-JSON-in-plain-XML. These are the product's soul and each earns its keep; the memo has the per-item steelman.

---

## Enhancements (tracked, not defects)

These are **not non-conformances** — the standard is satisfied — just nice-to-haves noted so they aren't lost.

- 🟢 **Table arrow-key cell nav** — `↑/↓/←/→` to cross cells and `Shift+Arrow` to extend the selection (beyond the conformant `Tab`/`Enter` nav from UXP-2). Today arrows move the caret within the cell; P2-3 is met without this.
- 🟢 **`mdInline` per-token sidecar scans** — each `[[type:key]]` match does a linear `.find` over the node's sidecar array, so rendering is O(tokens × sidecar size) per node. Harmless at realistic pill counts (single-digit per point); a `Map` keyed by `key` in `renderContentHTML` retires it whenever a render pass is touched anyway. From the engine audit, verified still present — a perf nit, not a defect.

## Test-user review fixes (July 2026) — UXP-194…199

> Source: the seven-persona test-user review (live headless-Chromium sessions; findings filed as
> `agent-review` issues #801–#827). This is fix batch 1 — the correctness core. Each entry cites
> its issue; the issue carries the full evidence.

### UXP-194 ✓ Computed pills went stale on ordinary edits (#801) 🔴 — **RESOLVED**
- **Problem:** an edit commit repainted only the edited point (the narrowed-repaint perf work), so
  every OTHER visible computed display lied until a full render: `{= 2*pi*r}` kept the old value
  after `r` changed, `{= words(subtree)}` never ticked, a `words(subtree) >= 500` check chip stayed
  ✗ after the target was crossed. Two personas independently; orchestrator-reproduced.
- **Fix:** `repaintComputedDependents(exceptId)` — on a text-changed `exitEdit`, patch the innerHTML
  of every other visible non-base point whose display depends on doc-wide state (math/vars/est/query
  sidecars, progress cookies) and rebuild visible check chips (`buildCheckChip` replaceWith). A full
  `render()` stays unsafe there (exitEdit can run inside a mid-click blur), so this reuses the
  backlink-source surgical-repaint idiom. Verified headless: var→dependent-pill, words() at creation
  + on child edit, check chips.

### UXP-195 ✓ Pending autosave lost on tab close (#802) 🔴 — **RESOLVED**
- **Problem:** the 800ms autosave debounce had no leave-flush — text typed in the final window
  before closing the tab silently vanished (the `beforeunload` guard covers disk mode only). The
  first-timer persona hit it organically twice.
- **Fix:** the debounce body extracted to `writeAutosavePayloadNow()`; `flushPendingAutosave()` runs
  it synchronously on `pagehide` and `visibilitychange→hidden` when a timer is pending (localStorage
  write is sync; OPFS/folder writes fire best-effort). Pinned: debounce reuses the extracted body +
  both hooks present.

### UXP-196 ✓ Emoji menu hijacked Enter after code colons (#804) 🔴 — **RESOLVED**
- **Problem:** `def f(x):` + Enter replaced the colon with an emoji (menu open, unfiltered, first
  candidate preselected); Shift+Enter inserted `:100:` and ate the line break. Every Python/C++
  colon line was a landmine (P1: Enter = new point, inverted).
- **Fix:** two gates. (1) The trigger lookbehind also excludes `)`, `:`, `]`, `}` so code colons
  never open the menu. (2) `emojiState.engaged` — set by typing ≥1 filter char or arrowing — gates
  apply: the shared `INLINE_MENU_NAV` dispatcher gained an optional `canApply`; an unengaged emoji
  menu closes and lets Enter/Tab **fall through** to their structural meaning instead of being
  swallowed. Verified headless: `def bfs(g, s):` + Enter → colon intact, new point created.

### UXP-197 ✓ Opening an .opml mutated custom-state keyword tasks (#807) 🔴 — **RESOLVED**
- **Problem:** `adoptDoc` ran `migrateNodePrefixes` BEFORE `resetDocCaches()`, so `parseTodo`'s
  `knownStates()` served the OUTGOING doc's cached state set — an incoming doc's custom-sequence
  keywords (`#BACKLOG …`) read as unknown and the legacy-todo migration prepended task markers:
  silent, permanent text mutation on File→Open (PM persona, verified 2×; ordering source-verified).
- **Fix:** `resetDocCaches()` now runs right before the migrations (the post-`buildIndex` reset
  stays — migrations may populate caches mid-run with half-migrated data). Pinned: reset-before-
  migrate order asserted against the source.

### UXP-198 ✓ Enter at the start of a parent divorced its children (#819) 🟡 — **RESOLVED**
- **Problem:** the UXP-60 caret-split keeps children on the leading half — correct mid-text, wrong
  at offset 0 where the leading half is EMPTY: the children ended up on an empty point above while
  the text moved below (the novelist orphaned a chapter's scenes making room for a title).
- **Fix:** `insertSiblingAfter` special-cases `foff === 0`: an empty continuation sibling is
  inserted ABOVE, text + children stay together, caret stays at the start of the text (peer
  standard). Also removes the latent double-marker case (`splitForSibling(text, 0, cont)` used to
  prepend `cont` to a text that still carried its own marker). Verified headless.

### UXP-199 ✓ Backspace merge-up glued words on marker-bearing points (#818) 🟡 — **RESOLVED**
- **Problem:** `mergeUpInto` took the merged-in body from `textForDisplay`, which strips the task
  marker/keyword AND trims the whitespace after it — so split `- [ ] alpha beta`, merge back →
  `- [ ] alphabeta`. Split→merge was not identity (power-user persona, UI + core level).
- **Fix:** new pure core `mergeBodyText(node)` — strips each marker form plus at most ONE canonical
  space (`TASK_STRIP_ONE`; ol/keyword/block-prefix forms likewise), preserving boundary whitespace
  as content. Pinned: task/keyword/quote/ol/plain cases + the byte-identity round-trip
  `splitForSibling → mergeBodyText → mergeUpText === original`.

### UXP-200 ✓ Keystrokes dropped in the post-Enter/Tab focus gap (#803) 🔴 — **RESOLVED**
- **Problem:** `focusNode`/`focusNodeAtOffset` deferred ALL focus placement to `requestAnimationFrame`,
  leaving a ~1-frame gap after Enter/Tab/structural ops during which keystrokes landed on a stale
  element or nowhere — silent text corruption at fast typing ("eggs"→"ggs"; the review's strongest
  convergence, 5 of 7 personas, organic at human speed under CPU load).
- **Fix:** both funnel into `_focusNodeGo(id, offset)`, which runs **synchronously when the row is
  already in the DOM** (structural ops `render()` first, so it always is) and keeps the rAF only as
  the fallback for rows not yet rendered (virtual-window scroll-ins). Verified headless: typing at
  5ms/char and 0ms/char across Enter + Tab boundaries harvests every character in the right point
  (previously mangled at those speeds).

### UXP-201 ✓ Exports emitted raw `[[#hexid|]]` link tokens (#806) 🟡 — **RESOLVED**
- **Problem:** `toMarkdown`/`toPlainText` called `flattenArtifacts` (which never handled node-link
  tokens), so every internal link exported as an opaque hex id — the knowledge graph became noise.
- **Fix:** the four exporter call sites now wrap in **`linkText`** — the existing canonical resolver
  displayText already used (label → live title → workspace-index title → bare id) — rather than
  teaching `flattenArtifacts` about links, which would have leaked resolved titles into the
  unlinked-references matcher (three tests caught exactly that on the first attempt). Pinned:
  exports contain the label / degrade to a bare id, and no `[[#` survives.

### UXP-202 ✓ Relative due dates floated forever (#808) 🔴 — **RESOLVED**
- **Problem:** `tomorrow`/`today+N`/weekday input was stored literally and re-anchored every day —
  a deadline typed relatively never arrived, and "3d overdue" stayed 3d overdue forever.
- **Fix:** `setDateProp` — the one chokepoint both the Schedule dialog and `/due:` share — resolves
  a parseable non-ISO value to its concrete ISO date at commit (`formatEpochDays(parseDueDate(v))`).
  `REPEAT_KEY` rides the same setter with a phrase value and is exempt; an unparsable value stays
  as typed for the callers' visible rejection (P4). Pinned: `tomorrow`/`today+7` → ISO, ISO stays
  byte-identical, repeat phrases untouched.

### UXP-203 ✓ Aggregations silently skipped non-numeric values — checks false-passed (#809) 🔴 — **RESOLVED**
- **Problem:** a child cost of `3,000` (or `12o`) silently dropped out of `sum(cost)`, flipping a
  failing budget check back to a green ✓ — the exact silent-wrong-success P4 exists to prevent.
- **Fix (both halves):** `childPropNumber` accepts strictly-grouped thousands separators ("3,000" =
  3000; "1,2" stays non-numeric), and the new pure `aggHasSkippedValues(node, expr)` makes
  `evalCheck` return **`error`** whenever an aggregated property skips a child's non-empty,
  non-numeric value (blank stays a deliberate unset; date-shaped values parse and never flag; dotted
  `base.col` totals are out of scope by construction). Pinned: comma/typo/blank/end-to-end verdict.

### UXP-204 ✓ Every created link was a whole-body transclusion (#805) 🔴 — **RESOLVED**
- **Problem:** the `[[` picker, Copy link, link-and-create, and linkify all emitted `[[#id|]]`, and
  the render collapsed `[[#id]]` into the same form (`label ?? ''`) — so the moment a target
  carried prose, every "link" embedded its entire rendered body (a one-line note measured 186px;
  the PKM persona's single blocker), with no UI door to a plain title reference.
- **Fix (better than the issue's suggested frozen labels — keeps rename propagation):** the pipe
  now carries meaning. `[[#id]]` (no pipe) = a **live-title reference** — what every creation door
  now emits (picker, Copy link, link-and-create, cross-doc forms); `[[#id|]]` (empty pipe, typed) =
  the **explicit mirror/transclusion**; `[[#id|text]]` = a fixed caption. One-line render change
  (pass `label` through instead of `?? ''` — `renderLinkPill` already handled `undefined` as
  title). `linkifyMention` now preserves the mention as the label (`[[#id|Karl Friston]]`), so
  one-click Link never rewrites prose. Copy reconciled in the guide entry, `guide/links-and-
  references.md`, and CLAUDE.md. Headless-verified: picker link = one-line title reference
  (28px, was 186px); typed `[[#id|]]` still transcludes. Existing mirrors in saved docs are
  untouched (`[[#id|]]` semantics unchanged).

### UXP-205 ✓ The oracle-play example shipped a dead meaning table (#810) 🔴 — **RESOLVED**
- **Problem:** `{action} {subject}` referenced rules written as plain child bullets, which never
  register (rules live on grammar records) — the flagship solo-play example promised "every {…}
  pill is live" and wasn't, in both the embedded example and the guide demo OPML.
- **Fix:** the meaning table is now two **live inline alternations** (`{hide | reveal | …}
  {a secret | an ally | …}`) — plain-text authorable, promotes on load, click each for a word —
  with a child note pointing at the two named-table patterns (@ Grammar rules; tag + roll on the
  tag). Both copies fixed in the same change; the walkthrough MD already taught the correct
  grammar-dialog pattern and is untouched. Pinned: no `{action} {subject}` in either copy.

### UXP-206 ✓ Lossy exports stamped [created/edited] noise on every point (#813) 🟡 — **RESOLVED**
- **Problem:** `toMarkdown`/`toPlainText` emitted the app-maintained timestamp props as
  `[created: … · edited: …]` continuation lines — 4 of 7 review personas flagged it (session log,
  manuscript, Zettelkasten, grocery list all polluted); no toggle existed.
- **Fix:** both exporters filter `TIMESTAMP_KEYS` from the props continuation line; user props
  still export; OPML (the storage format) keeps the timestamps. Pinned end-to-end.

### UXP-207 ✓ Tab/Shift+Tab/Alt-move teleported the caret to end-of-line (#814) 🟡 — **RESOLVED**
- **Fix:** `caretOffsetIfEditing(id)` captures the edit-buffer offset before the structural op;
  `indentNode`/`outdentNode`/`moveNode` restore via `focusNodeAtOffset` (the Enter-split idiom —
  the text is unchanged, so unfolded coordinates round-trip). Headless-verified: offset 8 stays 8
  across Tab, Shift+Tab, and Alt+move. The power-user persona's #1 switching blocker.

### UXP-208 ✓ Downward arrow entry landed at end-of-line; interior lines unreachable (#815) 🟡 — **RESOLVED**
- **Fix:** `navigateToNext` collapses to START (first line); `navigateToPrev` keeps its end-landing
  (that IS the last line — the symmetric twin). A multi-line point's interior lines are now
  reachable by vertical navigation from both directions. Column preservation stays deferred.

### UXP-209 ✓ Keyboard paste ignored the row cursor (#817) 🟡 — **RESOLVED**
- **Fix:** the Ctrl+V row-mode handler targets `selFocusId ?? selAnchorId` before the last-row
  fallback (focus sits on `<body>` in row-cursor mode, so the old activeElement path always fell
  through to the document end).

### UXP-210 ✓ Ctrl+Enter zoom was a keyboard dead-end (#816) 🟡 — **RESOLVED**
- **Fix:** `zoomInto` lands focus IN the zoomed view — the first child point (whose Esc handler
  already implements the one-rung zoom-out of §3/#406), falling back to the editable title on a
  childless point — plus a global Esc→`zoomOut()` when zoomed with focus stranded on `<body>`
  (post-dialog). Headless-verified: keyboard-only zoom now round-trips, one rung per Esc.

### UXP-211 ✓ Blank mobile quick-bar button — fa-dice not in the FA subset (#812) 🟡 — **RESOLVED**
- **Fix:** `#qb-roll` uses `fa-dice-d20` (verified in-subset; the pill icon uses it already). The
  one-line fix the issue suggested; a subset-coverage regression test remains a good follow-on.

### UXP-212 ✓ Pickers leaked raw [[type:key]] tokens (#821) 🟡 — **RESOLVED**
- **Fix:** `pickerTitle` (the refile/capture tree picker's one label chokepoint) routes through
  `displayText` (flatten + linkText + strip), and the `[[` picker's candidate rows resolve link
  tokens via `linkText`. Pinned end-to-end: a node with a link token yields a legible label.

### UXP-213 ✓ Refile picker default-selected the match's ancestor (#822) 🟡 — **RESOLVED**
- **Fix:** while filtering, the tree picker default-highlights the first row with `match: true`
  (treeRows already carried the flag) — ancestors stay visible as context but no longer steal
  Enter. Browsing (no query) keeps the positional highlight.

### UXP-214 ✓ Alt-move refusal at a boundary was silent (#825) 🟡 — **RESOLVED**
- **Fix:** `moveNode`'s boundary guard flashes "Already first/last under its parent" (P4) instead
  of returning silently.

### UXP-215 ✓ /base ignored an existing markdown table (#824) 🟡 — **RESOLVED**
- **Fix:** `createBaseAt` checks `findFirstTableRange(node.text)` first and routes an existing
  table through `promoteStaticTable` — the same path as the table's own ▦ Convert button — instead
  of dropping an unrelated empty starter beside it. The verb and the button now agree.

### UXP-216 ✓ Guide Esc was an invisible no-op from the nav/entry (#826) 🟡 — **RESOLVED**
- **Fix:** Esc from the guide's nav list and from the reading pane CLOSES the guide (the old nav
  Esc only moved focus to the search box — invisible, so "Esc, Esc, nothing" read as broken; the
  shortcut list promises "Esc: close panel"). Search-box Esc already closed; click-away unchanged.

### UXP-217 ✓ Bullet-click zoom unannounced; hover-in-edit DECLINED per #455 (#823) 🟡 — **RESOLVED (partial by design)**
- **Fixed half:** the first bullet-click zoom of a session flashes "Zoomed into one point. Esc or
  the breadcrumb takes you back" (P4) — the first-timer's "my list disappeared!" moment now
  explains itself. Once per session (`_zoomToastShown`).
- **Declined half (recorded):** re-enabling the hover popup during edit mode conflicts with the
  deliberate #455 decision (the menu positions over the content; a cursor drifting into the gutter
  mid-type would cover the text). Reversing a recorded decision is an owner call, not a fix-batch
  side effect — if beginner menu access while editing is wanted, that is a design pass on the
  bullet interaction model (e.g. click-opens-menu), flagged here for the owner.

### UXP-218 ✓ Two #827 grab-bag items: 2-arg log + Ctrl+Shift+Z redo 🟢 — **RESOLVED**
- **`log(x, base)` (student persona):** FN2 gained `log(x, base)` and evalMath's function dispatch is
  now ARITY-FIRST (`args.length === N && name in FNn`) rather than first-table-wins, so an overloaded
  name resolves by arg count. `log(1024, 2)` = 10; 1-arg `log(100)` stays base-10 (FN1); wrong-arity
  calls still error. Verified: log/pow/sqrt/min/max/atan2/date all intact.
- **Ctrl+Shift+Z redo (novelist persona):** the chord was dead because the handler checked
  `e.key === 'Z'` (uppercase) but browsers report LOWERCASE `'z'` with Ctrl held even when Shift is
  down (root-caused with a capture-phase keydown probe). Now accepts `'z'` or `'Z'`. Headless-verified:
  type → Ctrl+Z removes → Ctrl+Shift+Z restores. Ctrl+Y unchanged.
- The rest of #827 (hashtag digit-guard, guide keywords overlapping #835, copy nits) stays open on #827.

### UXP-219 ✓ First click in a heading-bearing doc misplaced the caret ~one line (#820) 🟡 — **RESOLVED**
- **Symptom (P4/P1):** the very first click into a wrapping point on a cold page load landed the
  caret about one visual line too high (e.g. offset 40 where the click was over offset 112); every
  click after that was exact. Reproduced only in documents with a heading above the clicked point.
- **Root cause:** a heading renders near base size on a cold load and only grows to full size on the
  first reflow. Entering edit mode forces that reflow, so the heading jumps taller (measured 28.3px →
  47.9px) and pushes the clicked point down by that delta (~one line) BETWEEN the click and the caret
  resolution. `enterEdit` swaps the content's innerHTML, then `caretFromPoint(e.clientX, e.clientY)`
  resolved the now-stale screen coordinates against the shifted layout, landing a line too high.
- **Fix:** the click handler captures the click position RELATIVE to the content element before
  `enterEdit`, then re-anchors it to the element's post-swap rect (`caretFromPoint(rAfter.left+dx,
  rAfter.top+dy)`). The element's own internal layout (width, font, wrapping) is unchanged by the
  swap, so the same relative point maps to the intended caret regardless of how the element moved.
  Warm clicks have no shift, so the re-anchored coordinates equal the raw ones (no-op, no regression).
- **Verified headless (throwaway):** cold first click on a wrapping prose point under an h1 now lands
  exactly at the display-truth offset across three click lines (40/112/189); a bold-bearing point
  places plausibly; the warm click is unchanged. DOM-timing fix, no pure core to pin; all 1341 tests
  stay green.

### UXP-220 ✓ Concept Guide must-fix batch: five misleading/dead-end entries (#834) 🟡 — **RESOLVED**
Five in-app GUIDE fixes (the Concept Guide review's must-fix batch), all copy in the `const GUIDE = [`
array; no behavior changes:
- **Paragraph inversion documented (P2/P1):** `point-types` now teaches the app's one sanctioned
  keyboard inversion (Paragraph: Enter = line break, Shift+Enter = new point) with a `/paragraph`
  example row. Searching "paragraph" in the guide now finds the entry (was "No results" — the guide
  search indexes bodies, so the new sentence covers it; `para` was already in `covers`).
- **Untypeable `w = {weapon}` corrected (P1):** `gen-conditions` + `recipe-npc` taught a form the
  parser rejects (`parseVarDecl` requires `:=`; plain `=` is inert text). Both now show
  `{w := {weapon}}`. Verified headless end-to-end: the typed form promotes to a pick var and
  `{w}`/`{w.dmg}` stay consistent across re-rolls (dagger→1d4, longsword→1d8, warhammer→1d10).
  The same wrong form mirrored in `guide/generating-text.md` + `guide/cookbook.md` — fixed in the
  same change (the guide-drift rule).
- **`progress` stale claim (P1):** "Grandchildren are not counted" contradicted the shipped depth
  scopes (UXP-159). Body now teaches `[/subtree]` / `[/N]` (+ `[%subtree]`/`[%2]`), with two new
  example rows, matching the `@progress` insert-menu desc.
- **`overview` nav naming (P2):** "Cookbook recipes" → "Put it together recipes" (the actual CATS
  label a reader scans the left nav for).
- **`backlinks` front door (P2):** the entry now says HOW the panel opens (rises from the bottom
  when you click into a linked-to point, updates as you move).

### UXP-221 ✓ Base column ops unreachable by touch; base menus self-dismissing (#811) 🔴 — **RESOLVED**
- **Finding:** at 390×844 with a coarse pointer, every per-column operation on a base (Calculate,
  Column formula, Show as, Sort, Alignment, Width, Insert/Move/Delete) was unreachable: the mouse
  door is "click the header around the name pill," but the pill fills the header, so a finger tap
  (even dead-center) lands in name edit; the ▾ cue was visible on touch but `pointer-events:none`;
  and the base bullet menu offered no per-column door. Violates the touch invariant (P2/P3). The
  sibling finding (no swipe-left outdent) was already fixed on main inside `attachSwipeIndent` and
  was re-verified, not re-implemented.
- **Fix — three doors + one shared repair:** (1) press-and-hold a column header opens the Column
  menu (`attachBaseHeaderTouchMenu`, the `attachBulletTouchGestures` pattern: 450ms hold, 10px slop
  cancel to the native pan, fired hold swallows its own tap tail so the pill never enters edit
  underneath; IS_TOUCH-gated, read-only grids never match); (2) the ▾ becomes a real tap target on
  touch (hover:none CSS: pointer-events restored, a 32px full-height zone, header right-padding) —
  taps ride the existing header click handler; (3) a "Column options" base bullet-menu row (authored
  bases) lists the columns by name (`mtColumnLabel`, pure + pinned) and opens the picked column's
  menu — also the universal keyboard/AT door. (4) Root repair the new door exposed: menus opened from
  a MOUSEDOWN-activated control (bullet-menu rows via `mkCmdItem`, the chrome Rows button) had the
  same gesture's trailing click delivered at document level after the panel opened, closing it in
  the same breath — "View & rows shown" and the Rows cap menu were broken this way on mouse AND
  touch. A one-shot `_mtPanelOpenGuard` (armed by the mousedown-based openers, consumed by exactly
  one click, 350ms expiry) swallows the tail; the #417 opener/closer pin asserts the ordering.
- **Copy:** the GUIDE `tables` entry + `guide/writing-and-formatting.md` gained one touch sentence
  each. Verified headless at 390×844 hasTouch (22/22 checks: long-press to Calculate, ▾ tap,
  bullet-menu chain, swipe both directions) and at 1280×800 mouse (header click still name-edits;
  outside click still dismisses).

### UXP-222 ✓ Concept Guide should-fix batch: deck mechanism, sequencing, coverage, search misses (#835) 🟡 — **RESOLVED**
The guide had drifted from the shipped app in five ways, fixed against the code (every claim
verified before writing): the `deck` entry never stated its base mechanism — it now opens with
`{shuffle: a|b|c}` and names all four mode words (verified against `seqParts`) plus the `{3x: …}`
repeat syntax; `custom-calendars` led the Dates category while presuming everything sequenced after
it — moved after `chronicle` (pure array move); base inline collapse + the rows cap had zero guide
presence — documented in `base-views` against the real control names (the ▶ chevron, `Rows: all`,
the "View & rows shown" door); "word count" and "sync" returned No results in guide search — the
searchable phrases were added to `rollups` and `saving`, and the empty-point placeholder now teaches
concrete block types ("/ for a to-do, heading or list" instead of "/ for blocks"); and four
chrome-level features (example starters, the verbosity tiers, the document-tabs strip, PWA install)
had no concept-layer home — each gained a sentence and example row in `overview`,
`appearance-controls`, `workspace-documents` and `saving`.

### UXP-223 ✓ Concept Guide polish batch + governing-doc drift (#836) 🟢 — **RESOLVED**
Copy-level non-conformances across the guide, plus drift in the governing doc itself:
"items"-for-points vocabulary (`refile`, `sort-children`, `agenda`, `check`); OPML and "GM"
unglossed (`export`, `secret`); Mac-only key glyphs in `capture-inbox` example rows (normalized to
the `Ctrl/Cmd+…` house form); wall paragraphs in `clock`, `meter`, `tables` (whose mid-body chord
list duplicated its own example rows and was slimmed), `check`, `workspace-documents`, `search-ops`
and `rollups`; `estimates` omitting that division is supported (`parseUncertain` handles `/`);
`footnotes` covering `image` with no image example row. `guidance/concept-guide.md` still said "the
eight categories" (CATS has ten), carried a stale bullet-menu-only feature list (refile/prop/note
are BLOCK_CMDS ids today), and did not document the `related:[…]` field. All fixed; one stale
finding (the `estimates` wall-paragraph claim — it already had breaks) recorded as no-change.

### UXP-224 ✓ #827 grab-bag remainder: File door, digit tags, deck count, phone toolbar, restore mode, heading pills, "origin" caption 🟢 — **RESOLVED**
- **(1) File menu invisible (P2):** a "File ▾" cue inside `#logo-btn` (the `.mt-view-btn` text
  recipe; visible on phones where the wordmark hides); button + dialog aria both read "File menu",
  matching the ~10 copy sites that say "open the File menu". Click/keyboard handlers untouched.
- **(3) Digit-only hashtag false positive (P1):** a tag's FIRST segment must now contain at least
  one letter (`(?=[\d_-]*[a-zA-Z])`), applied in lockstep at `mdInline`, `collectTags`,
  `parseSearchQuery` (a `#1` query falls through to literal text — the escape hatch), the `has:tag`
  sniff, the roll nudge, and `isValidTagName`; `#1`/`#2024` stay plain text, `#v2`/`#2024-plans`
  still tag. Pinned by a three-site agreement test.
- **(6) Deck feel (P2):** `renderSeqGenPill` titles "N of M cards left." mid-round (display layer;
  the Last-card cta and the UXP-120 reshuffle flash unchanged; pinned).
- **(10) Heading-scale pills (design language):** pills inside `.md-h` step back to the body pill
  size (`calc(.86 * 1.0625rem)`, rem-anchored across heading levels and zoom).
- **(11) Reopen landed in raw-markdown edit on point 1 (P1/P2):** the boot focus is gated on
  `!_restoredFromAutosave` — a restored doc opens read-first like a snapshot; a restored-but-blank
  doc still gets the caret.
- **(12) Dimmed Board button:** already shipped by UXP-169; re-verified headless, no change.
- **(14) 390px toolbar clip (P2/P3):** at ≤560px `#toolbar-row` wraps and `#tbtn-cluster` drops
  whole to its own right-aligned line instead of compressing into scrollbar-less hidden overflow;
  the ResizeObserver re-pads the body. Verified at 390×844: all toggles in-viewport.
- **(15) "origin" caption noise (P4):** `renderGrammarPill` hides the caption when the rule name is
  the placeholder default `origin`; real names keep teaching `{name}`.
- **Items 2/4/5 stay open on #827 as owner product decisions** (hide-done default; `words()`
  counting notes — if wanted, add a new scope value rather than changing `subtree`'s meaning (P1);
  frozen-conditional staleness — recommend a display-layer "inputs changed" whisper over any reversal
  of the freeze model). Tests 1341 → 1345 green across the batch; headless-verified per finding.
  *(Superseded: all three were decided by the owner and shipped — see UXP-227 and UXP-228.)*

### UXP-225 ✓ Conformance-nit batch #705/#706/#707/#708: vocabulary, fate-zero ink, sniff guard, meter pool label 🟢 — **RESOLVED**
Three of the four were found ALREADY FIXED on main (in e447279 and b636fc9 — the issues were stale);
each was verified against the decided direction rather than re-implemented, and only the real delta
shipped:
- **(#705) File menu vocabulary (P1/§1 V-1):** "Open an outline file" → "Open a document" (landed in
  e447279, verified). A sweep found no other document-sense "outline" string; view-sense uses ("Show
  outline levels") are §1-correct and untouched. Noted, not changed: `'outline'` survives as the
  default *filename* base for an untitled document (a behavior default, not descriptive copy).
- **(#706) Fate-zero opacity fade (DL §3):** the `opacity:.7` dropped, `color:var(--muted)` kept
  (landed in b636fc9; browser-checked computed opacity 1).
- **(#707) Inventory drift-guard blind spot (P5):** `countParts`/`oracleParts`/`parseMeter` present in
  the SNIFFS map (landed in e447279); spellings confirmed against the sniffs and the §2 inventory.
- **(#708) Meter pool aria omits the style word (P3) — the shipped delta:** the icon-pool meter
  announced "Meter, 3 of 5" while the visual is a row of hearts/skulls/dots. The pool branch's label
  now names the parsed style word in the clock's established pattern: "Meter, hearts, 3 of 5 filled";
  the bar branch's exact-value label untouched; source pin updated.

### UXP-226 ✓ Clock step-back close-out: stuck tap-tail flag, touch copy, §3 grammar row (#702, #703) 🟡 — **RESOLVED**
- **Finding:** the #702/#703 core shipped earlier (97a3870: touch long-press step-back, announce +
  clamp flash), but three gaps remained. The real one: a fired long-press's click-suppression flag
  (`_clockLongPressed`) was cleared only by the trailing click handler — and a browser can suppress
  that click after its own long-press handling (the documented `attachBulletTouchGestures` endDrag
  hazard), leaving the flag stuck so the NEXT tap on a clock was silently swallowed (P1/P4). Also:
  the `@clock` insert desc taught only Shift+click (P2), and the ux-discipline §3 grammar never
  recorded the clock's advance/step-back pair.
- **Fix:** `releaseLp` on pointerup/pointercancel self-clears the flag 350ms after release (anchored
  at release, so it never fires mid-hold and the real trailing click is still swallowed); the
  `@clock` desc gains "(press and hold on a touch screen)"; §3 gains the manual-clock row. New source
  pin covers the IS_TOUCH gate, flag-set-before-step order, the suppression check, and the self-clear.
  Verified headless 19/19 (desktop + touch): tap advances exactly once, a long-press steps back
  exactly once with the trailing click confirmed fired-and-swallowed, a tap AFTER a long-press still
  advances, clamps flash, advances announce "Clock, N of M".

### UXP-227 ✓ Frozen grammar pill silently shows a branch its inputs no longer support (#827 item 5) 🟡 — **RESOLVED**
A conditional pill (`{r == 20: CRIT | miss}`) freezes by design, but after re-rolling the variable it
read, the pill kept presenting the old branch as current — a P4 silent-wrong state. Fixed display-layer
only (the freeze model untouched, per the owner's call): roll paths snapshot the vars the taken
expansion path actually consulted (`recordVarReads`, a recording Proxy around the vars map in
`runGrammar`'s new `depsOut` — only the taken path records, so dice in the output can't
false-positive; a miss records as `null` so a later declaration counts as a change), the snapshot
rides the grammar record as `deps` (round-trips through `_grammar` for free; exports byte-identical),
and `renderGrammarPill` compares against the live `collectVars()` map (`depsChanged`, pure + pinned;
O(|deps|), no new cache). Stale = `.gr-stale` (a small `--info` dot, the whisper-dot precedent, both
themes via the existing token) plus the title/aria suffix "Inputs changed. Click to re-generate."
Click re-rolls as before, refreshing the snapshot and clearing the whisper. Deck/sequence pills and
rule edits deliberately out of v1. 11 pins + headless E2E (whisper appears on the var re-roll's own
render pass, clears on click, survives OPML round-trip).

### UXP-228 ✓ #854 boot-restore TDZ + owner decisions: show-done default flipped, words() skips notes (#827 items 2, 4) 🔴 — **RESOLVED**
- **(1) #854 (P4 silent failure, latent):** a docId-less (legacy) autosave payload failed to restore
  at boot and the app silently fell to the Examples doc: `applyAutosaveData`'s docId backfill calls
  `scheduleAutosave()`, which read `_showingExamples` before its `let` initializer ran (the
  declaration sat below the restoreAutosave IIFE) — a TDZ ReferenceError swallowed by
  `restoreAutosave`'s catch. Fixed by hoisting the `_showingExamples`/`_adoptingExamples`
  declarations above the boot restore; the backfill's `scheduleAutosave` stays (a read-only session
  never `markDirty()`s, so nothing else would persist the assigned docId, and the `_opfsReconciled`
  gate already defers the write). Source-order pin; verified headless old-vs-new (the old build
  reproduces the Examples fallback).
- **(2) OWNER DECISION (#827 item 2) — a deliberate, recorded P1-exception default change:** the
  show-done default is FLIPPED to shown. Completed points stay visible, struck through, until the
  user hides them (list-makers were surprised by rows vanishing on check). A persisted `showDone`
  boolean still wins on restore; only the fresh default changed. The Done toggle now
  `scheduleAutosave()`s (its explicit choice previously persisted only with the next content edit);
  the button ships pressed to match; both "Done, now hidden" cues already fire only when the point is
  actually hidden. GUIDE appearance entry + guide/files-and-export.md refreshed; src pins added.
- **(3) OWNER DECISION (#827 item 4) — a deliberate behavior change (recomputes values in existing
  documents, explicitly accepted):** `words()` now EXCLUDES per-point notes in every scope; the
  opt-in is the optional second closed-keyword argument `words(scope, notes)` (the `sum(prop, scope)`
  two-arg shape: an argument value, no new delimiter, composes with numeric depths; an unknown second
  token stays literal → #ERR). §7's recorded words() decision amended in ux-discipline.md;
  MATH_FN_DESC, the GUIDE `rollups` entry + example, guide/computing-numbers.md and guide/features.md
  freshened; prior pins updated deliberately, opt-in pins added.
- **This closes #827 in full** (items 7/8 in UXP-218; 1/3/6/10/11/12/14/15 in UXP-224; 9/13 via
  UXP-220/222; 2/4/5 here and in UXP-227).

### UXP-229 ✓ Sync-safety size fingerprint + the restore-point doctrine on every losing-copy path (#840, #842, #845 items 1+2) 🔴 — **RESOLVED**
- **Was:** external change was discriminated by `lastModified` alone, so a cross-device edit landing
  in the same mtime bucket (FAT/exFAT 2s granularity, second-truncating or mtime-preserving sync
  clients) read as our own write and the next flush silently clobbered it (#840). The mid-session
  'reload' and 'theirs' adopts dropped the in-memory copy with no stash, unlike every boot-time
  losing path (#842, P4 silent loss). The boot-reconcile hints were gated on stash success, so a
  full localStorage (the likeliest failure) made the discarded copy silently unrecoverable, and the
  provably-different-document branch flashed nothing at all (#845 item 1). `scanWorkspace` silently
  skipped files lacking a `<_docid>`, so their links read broken and folder search missed them with
  no explanation anywhere (#845 item 2).
- **Now:** `_wsKnownSize` rides every `_wsKnownModified` anchor (same `getFile()`);
  `reconcileAction({…, diskSize, knownSize})` treats same-bucket-different-size as external,
  sizes-unknown keeps the mtime-only verdict (no false prompt after an own autosave); the flush
  pre-write gate and `checkExternalChange` pass both fingerprints. Both mid-session losing branches
  stash the pre-adopt autosave payload and point at File menu, Restore earlier version ('mine'
  deliberately does not stash the foreign disk tree; asymmetry recorded in a comment). All three
  boot losing-copy paths always flash, with an honest could-not-be-kept variant on stash failure.
  The folder scan counts no-docId skips and the broken-links report names them with the remedy
  (pure `unmarkedFilesNote`).
- **Residual (recorded):** an external write with identical mtime AND identical byte size remains
  undetectable; documented in the `reconcileAction` comment. Pinned: the extended `reconcileAction`
  truth table, `unmarkedFilesNote`, and source pins; OPFS-driven headless E2E proved the old
  silent-clobber verdict and the new detection side by side.

### UXP-230 ✓ Workspace file operations could destroy or misrepresent folder contents (#839, #841, #843, #848) 🔴 — **RESOLVED**
- **Defects:** `connectWorkspace` wrote the current doc over an existing same-named folder file with
  no collision guard — the blank-doc derived name is `outline.opml`, the likeliest name in a real
  notebook, and `getFileHandle({create:true})` opens-then-truncates content this browser never saw,
  unrecoverable in-app (#839, critical). `deleteWorkspaceDoc` left the write machinery pointing at
  the deleted file, so the switch/new fallthrough's pre-swap flush recreated it with full content,
  propagating over sync (#841). A deleted or externally-removed document's tab persisted, flashing
  "Could not open" forever (#843). `reconcileDuplicateDocIds`' read→mutate→write on a non-open loser
  file could clobber a sync update landing in between (#848).
- **Fix:** connect decides before touching the folder (pure `docIsBlank` + `connectWriteDecision`:
  free name → create; taken + blank doc → adopt the existing document, read-only; taken + content →
  `uniqueWorkspaceName`, announced). Delete stashes the doc's last autosave as a restore point
  (named in the flash), then neutralizes the write target (clear debounce, markClean, drop
  workspaceFile, stop watch) strictly between a successful removeEntry and the switch; tabs prune
  on delete and self-heal on a failed switch; the dup-docId re-stamp re-checks the file mtime just
  before writing and skips on change. Pinned (pure cores + src-order pins); headless-verified
  old-vs-new via OPFS handles (the old build reproduces all three reproducible kills).
- **Known gap (recorded, candidate follow-up):** the delete-time restore point is keyed under the
  deleted doc's id, and "Restore earlier version" lists only the current doc's points — the
  insurance exists but has no menu door after the switch; the flash words it accordingly. A small
  restore-points browser would close this.

### UXP-231 ✓ Workspace dialogs: background prompts wedged flows; dismissal picked the destructive option (#844, #845 item 3, #846, #847) 🟡 — **RESOLVED**
- **Defects:** every dialog shares one `#io-card`; a BACKGROUND opener (sync reconcile, dup-id)
  wiping an open dialog wedged its Promise forever — worst case `_wsReconciling` stuck true, folder
  auto-write silently dead while the UI claimed auto-save; stacked `ioBack` keydown listeners let a
  dead dialog close a live one (#844). Escape/backdrop on the reconcile prompt resolved 'mine' and
  force-overwrote the disk version (another device's work) on the least-informed gesture (#845
  item 3). Two tabs interleaving the AUTOSAVE_PREV_KEY read-modify-write could drop a fresh restore
  point (#846). Zero same-origin multi-tab coordination: two tabs on one doc traded prompts and the
  silent reload wiped the clean tab's undo stack wordlessly (#847).
- **Fixes:** `withBgDialog` defers background dialogs while the card is busy (never wipes a user
  dialog); `_wsReconciling` cleared in try/finally; every promise dialog's `finish()` is idempotent,
  removes its listener on any teardown, and a superseded dialog settles with its non-destructive
  default; a doc swap during deferral voids the prompt. Dismissal resolves **'later'**: both
  versions untouched, folder writes stay paused, a 2-minute snooze then re-ask, and the flash states
  it (P4); the dialog copy says what Escape does; only the explicit button force-writes.
  `withPrevStoreLock` (navigator.locks `'pl-prev-store'`, read inside the lock; synchronous fallback
  where locks are absent) wraps both RMW sites; `stashPayloadAsPrev` is async + awaited at every
  call site. Lightweight presence on `BroadcastChannel('pointliner')` (feature-detected, inert
  elsewhere): open/here/close + heartbeat/TTL, a once-per-doc soft notice, and
  prompt-instead-of-silent-reload while a peer holds the doc (pure `updatePeers`/`peerHoldsDoc`,
  pinned). Verified headless with two real tabs over localhost (40/40), including the
  confirm-survives-background-reconcile deferral and interleaved cross-tab stashes both surviving.

## Closing order (recommended)

1. **Correctness defects** — engine-audit batch closed (UXP-30…34); the durable residue is the
   **folded-coordinates invariant** (undo entries, `dataset.prevText`, and any offset that
   outlives a blur are always folded — see UXP-30/31) which future edit-path work must preserve.
   UXP-35 (caret-restore typing race) closed via the `_highlightGen` generation counter.
2. **Tier 1** (UXP-3…5) — the breaks-the-language defects. **All closed** (UXP-3 ✓ both parts, UXP-4 ✓, UXP-5 ✓).
3. **Tier 2** (UXP-6…12) — discoverability + feedback gaps. **All closed.**
4. **Tier 3** (UXP-13…19) — followed `accessibility.md`'s phase order. (All closed: UXP-13…18 plus UXP-19, the dedicated tree/grid ARIA pass — Tier 3 is complete.)

When an item closes, flip its matrix cell in `ux-discipline.md` §9 to ✅ and delete its row here. **That point has been reached:** the app speaks one language; what remains is keeping it that way (UXP-20). New defects found from here enter as new numbered rows; UXP-20 is checked against every proposal *before* it becomes a defect.

### UXP-236 ✓ The `innerHeight - 8` popup clamp was hand-copied at every popup site 🟢  [S3-PR6 follow-on] (RESOLVED)
- **Problem:** S3-PR6 fixed the two positioners that place `#bpop` to clamp against the bottom stack instead of the raw viewport bottom. The same `window.innerHeight - 8` literal survived at the other popup sites, so each independently believed the touch bar's strip was free space.
- **Rule:** P3 (reachable — a control that renders but cannot be touched is not reachable).
- **Two corrections to this entry, made when it was worked rather than left standing:**
  - **Eight sites, not six.** `mtOpenMenu`, `showCellEditorPop`, `showTodoPicker`, `positionSlashMenu`, `placeAtCaret`, `openSizePicker`, `positionLinkMenu`, `positionCaretMenu` — ten counting the two S3-PR6 already touched. The original count was simply wrong.
  - **The to-do picker was NOT exempt.** This entry claimed a flip-above-the-anchor site cannot park under the bar. Flipping is *triggered* by the same threshold, so an anchor low enough to put the menu in the bar's strip never trips it and the menu never flips.
- **And a correction to the severity.** Hit-testing each menu parked in the bar's strip showed the stolen-tap defect existed at exactly **two** sites, `#mt-colpanel` and `#mt-cellpop`, both `z-index:600` against the bars' 640/650 (measured: `#mt-colpanel` lost to `qb-insert`). The other six were already at 700 and were never stealable; their fault was only that they covered the bar's controls instead of flipping above the anchor.
- **Resolved:** `usableBottom()` (`window.innerHeight - 8 - bottomStackHeight()`) is the one question every positioner now asks; `mtOpenMenu` asks it twice, since its `spaceBelow` would otherwise still choose "below" on room that belongs to the bar. `#mt-colpanel` and `#mt-cellpop` raised to 660, the tier already used for a transient surface over a persistent bar. A drift guard fails on any reintroduction of the raw literal in a positioning context, and a characterization pin records that the six 700-tier menus outrank the bars, since that measured fact is the reason they needed no z-index change.
- **Not done, deliberately:** the "one shared positioner" this entry proposed. The sites use three genuinely different strategies (flip above the anchor, park at the bottom, `mtOpenMenu`'s flip-to-the-roomier-side with a `maxHeight` clamp from `#415`), and forcing one over all three is a larger change with a larger regression surface than the bug justifies. What they truly share is where the usable area ends, and that is what was shared.

### UXP-232 ✓ An unreadable filter was silent inside `{roll:}` and inside `count("…")` 🟡  [S3-PR4 follow-on] (RESOLVED)
- **Problem:** `parseSearchQuery` emits `{kind:'invalid'}` and every consumer matched nothing honestly, but only the search box and `renderQueryPill` rendered the reason. `{roll:}` showed its empty marker and `count("…")` showed a bare `0`.
- **Rule:** P4-1 (no silent failure).
- **Resolved:** both cue slots already existed, and in both cases the copy that was there was itself a confidently wrong answer. `{roll:}` rides an anonymous grammar, so `renderGrammarPill` reads the query back out of `g.def` and the reason **replaces** "Nothing matched yet" — a different fact from the filter being unreadable. The inline `{roll: …?}` marker is untouched: it is text inside the point, where a sentence does not belong. `renderMathPill` gains a `queryTip` beside the existing `folderTip`, asking about every quoted argument.
- **Found by driving, not by reading:** a bare `count("…")` does not reach the success path at all. It lands on the **empty-scope** branch ("No points below this one to search"), which returns first, so a `queryTip` on the success render alone was unreachable. That branch now leads with the reason, because the scope is not what went wrong. A pin holds the precedence.

### UXP-233 ✓ An unreadable `due:` / `start:` date was still a literal text term 🟡  [S3-PR4 follow-on] (RESOLVED)
- **Problem:** `due:nonsense` fell through `parseDueDate` to `{kind:'text'}` and silently searched for its own string, exactly as `is:` did before S3-PR4.
- **Rule:** P4-1.
- **The stated blocker did not hold.** This entry said the date grammar is "genuinely open," so deciding when a half-typed `due:2026-0` has stopped being in flight "needs its own design." Reading `parseDueDate`, the vocabulary is effectively CLOSED: five words, `today±N`, and a `Y-M-D` date, each optionally behind `<` or `>`. And the in-flight question was already answered in S3-PR4 — a partial value is a PREFIX of a valid one. No new design was needed; the existing rule extended.
- **Resolved:** the date arm emits `{kind:'invalid', field:'due'|'start'}`, so `queryMatchesNode`'s hard-false guard makes it match nothing (negation included, verified) at no extra cost. `dateStillTyping` is the prefix predicate, and it accounts for a bound narrowing what is reachable: `week` and `month` are windows the parser takes only at op `=`, so `<week` is final and wrong where a bare `week` is still in flight. The invalid term keeps its `<` / `>` in `value`, or that distinction is lost and the message echoes something the user did not type.

### UXP-234 ✓ A sequence declared only inside an excluded subtree was lost quietly 🟢  [S3-PR5a follow-on] (RESOLVED)
- **Problem:** `exportExclusionImpact` named the variables and rules a shared HTML copy loses, but not sequences. A kept point whose leading `#BLOCKED` keyword no longer belongs to any sequence renders as ordinary text, with no badge and no cue.
- **Rule:** P4-1 (no silent failure).
- **The stated blocker was simply wrong.** This entry deferred the work because "a third clause was pushing the export toast past what one toast should carry." The toast does not build clauses; it builds one merged LIST carrying a kind word per item (`variable gold, rule tavern`). A sequence is a third item TYPE in that list, so it costs one spread and the sentence reads identically for one item or six. The reason recorded for deferring never applied to the code that was actually shipped.
- **Resolved:** `collectSequences` joins the diff. It returns an ARRAY of records rather than a name-keyed map, so unlike the other two it diffs on `name`. Driven: an export losing all three now reads *"Declared only in those: variable gold, rule tavern, sequence flow."*
- **Worth keeping in mind:** the quiet degradation is the argument FOR naming it, not against. A lost variable or rule announces itself in the copy with a `.brace-attempt` cue; a lost sequence is the one nobody would ever notice.

### UXP-235 ✓ Children of a bare block flattened up one level in the Markdown export 🟢  [S3-PR5b follow-on] (RESOLVED, in part by decision)
- **Problem:** `toMarkdown` emitted headings, paragraphs and quotes without a list marker, so their children had no list item to nest inside. Verified against a real CommonMark implementation: a paragraph with a bullet child rendered `<p>` followed by a **top-level** `<ul>`, a sibling rather than a descendant.
- **Rule:** fidelity of the outline to Markdown mapping.
- **The entry was two questions wearing one number**, and they have opposite right answers.
  - **Paragraphs and quotes: FIXED.** A list item is Markdown's only native container, so a `para` or `quote` **with children** takes a marker and becomes one. Childless prose stays bare, which is the common case and the reason the bare branch exists. This brings `- > text` back for a quote **with** children, deliberately: it is the only way Markdown holds a subtree under a quotation, and S3-PR5b removed it only for the childless case.
  - **Headings: LEFT ALONE, by decision (owner-confirmed).** `## Section` followed by a list *is* the idiomatic Markdown for a section containing a list, the heading level already encodes the hierarchy, and `- ## Section` would look broken in every renderer. A pin holds this so it is not re-opened as an oversight.
- **Verified** against markdown-it, eleven checks: the child list nests inside the item, childless prose keeps no bullet and stays two separate paragraphs, a heading with children is byte-identical to before, a quote round-trips both ways, and the tight-list regression the blank-line policy could have reintroduced does not appear.

### UXP-170 ✓ The estimate pill shared the width-resize glyph fa-left-right 🟢  [Batch 5] (RESOLVED 2026-07-25)
- **Problem:** design-language §1 records that `fa-left-right` was narrowed to "the horizontal-span concept only" when refile moved to `fa-arrow-right-arrow-left`, but estimate never got the same treatment, so one glyph carried two unrelated meanings across five est sites. A live contradiction of a locked Decision-corollary.
- **Rule:** design-language §1 (one glyph per concept).
- **The blocker was environmental, and it no longer holds.** This entry deferred on "github-egress-blocked in this sandbox," so the FA subset could not be rebuilt. Tested rather than trusted: `curl` of the pinned FA 6.5.2 metadata returned 4,356,474 bytes, and `fonttools` + `brotli` install cleanly. The deferral note had outlived the condition that produced it.
- **Resolved:** estimate wears **`fa-wave-square`** (U+f83e) at all five sites; `fa-left-right` stays on `#btn-width`, which is the concept it was narrowed to, and stays in `FA_GLYPHS`. The subset was rebuilt through `tools/build-fa-subset.py`, whose own `ICONS` list gained the glyph too, or the next rebuild would silently drop it. A pin covers the tool's list for exactly that reason.
- **Two things the entry did not know:**
  - **A chart glyph would have been the wrong fix.** The est pill already renders a live sparkline beside its icon, so `fa-chart-area` would have read as the same thing twice, which is the look-alike half of the same §1 rule.
  - **The ASCII fallback carried the same defect one layer down**, unnoticed: `≈` at three sites and `∿` at the bullet-menu re-sample row. §1 says a concept wears one mark *everywhere it is referenced*, so the fallbacks are unified on `≈`.
- **Verified by driving**, because a source pin proves the class name and not the glyph: the rendered `.est-ico` resolves to `U+f83e`, `document.fonts.check` confirms the subset covers it, and its box measures 15.7x12.6 against a known-good icon at 12.5x12.5 (a missing codepoint renders tofu or zero-width, which a presence check would have passed).

### UXP-239 ✓ Toggling a timeline source drops focus to `<body>` and takes Escape with it 🟡 [timeline] (RESOLVED 2026-07-25)
- **Problem:** `renderTimeline` opens with `panel.innerHTML = ''`, and the source chips (Tasks / Journal / Lore) call `renderTimeline(panel)` with **no refocus**. The focused chip is destroyed, so focus falls to `<body>`. Both the Tab trap and Escape are bound on `#timeline-back` via `keydown`, which only fires for descendants, and the global `document` keydown has an Escape branch for `fileMenu` only. Driven, with a real `Enter` on a focused chip:
  ```
  focus before toggle : BUTTON.tl-toggle.tl-src-task.on "Tasks"  [in panel]
  focus after toggle  : BODY  (focus lost)
  real Escape         : timelineOpen === true   <-- Escape is dead
  one Tab             : BUTTON.graph-close      [in panel]
  real Escape         : closes                  <-- recovers, but only after Tab
  ```
- **The control, 200 lines away:** the graph's own toggle does the same destroy-and-rebuild and **restores focus explicitly**, and Escape keeps working. Same interaction, two behaviors:
  ```
  graph unlinked toggle:  focus before "Unlinked" -> focus after "Unlinked" -> Escape closes
  ```
- **Bounded honestly:** focus does **not** wander behind the overlay (a 6-press Tab walk from the lost-focus state stayed inside the panel), and one Tab recovers. So it is a recoverable dead-end, not a trap: Escape silently does nothing until you press a key that gives no hint it is needed. 🟡, not 🔴.
- **Rule:** P3 (focus management on re-render) headline, P1-3 (Esc resolves outward) secondary, P4-1 (a key that silently does nothing).
- **Target:** copy the graph's own line — refocus the equivalent chip after `renderTimeline(panel)`. One statement, with the sibling to copy verbatim.
- **Resolved:** the chip handler refocuses `.tl-toggle.tl-src-KEY` after `renderTimeline(panel)` — the graph's own line, copied. The **qualified** selector matters: timeline rows reuse the bare `tl-src-KEY` class (`'tl-item tl-src-' + it.source`), so the unqualified form only finds the chip by accident of the chip bar being appended before the body. A pin holds the qualified form specifically.
- **Verified by driving both builds, because a source pin cannot see focus move.** The same driver was run against the pre-fix `index.html` as a control, and every assertion flipped:
  ```
                                          pre-fix          fixed
  focus after a real Enter on "Tasks"     BODY             BUTTON.tl-toggle.tl-src-task
  real Escape, no intervening Tab         timelineOpen=1   timelineOpen=0
  ```
  A driver that passes on both builds is proving nothing; the control is what makes the pass mean something.

### UXP-241 ✓ Neither overlay announces its own count change 🟢 [graph] [timeline] (RESOLVED 2026-07-25)
- **Problem:** both panels headline a live count in `.graph-count`, and both rewrite it on a toggle with no announcement. Driven: toggling the timeline's Tasks chip took the count from **"128 dated points" to "8 dated points"**, and the graph's Unlinked toggle took **"15 points, 1 links, 20 unlinked references" to "2 points, 1 links, …"**. Neither panel contains any `[aria-live]`:
  ```
  timeline-panel: 0 live regions      graph-panel: 0 live regions
  ```
- **The fix has an existing home:** the app already owns a global live region, `#a11y-live`, with an `announce()` helper. This is a missing call, not a missing mechanism.
- **Rule:** P4-1 (no silent success) for a filter whose whole purpose is changing that number.
- **Resolved:** `announceOverlayCount(panel)` on all three count-changing toggles — the timeline source chips and **both** graph toggles. The graph's scope toggle was not in the measurement above but rewrites the same count line; leaving it out would have put two toggles in one header where one speaks and one does not (P1).
- **It reads the RENDERED string back** (`.graph-count`, falling back to `.graph-empty-title` through the pure `overlayCountMessage`) rather than recomputing the count, so the announcement cannot drift from what is on screen. The fallback is not decoration: a filter that empties the panel blanks the count line entirely, and "No dated points here yet" is the honest answer where silence would repeat the original defect at the one moment the user most needs telling.
- **Verified by driving,** against the pre-fix build as a control — `#a11y-live` was empty after all three toggles before, and carries the new count after:
  ```
  timeline Tasks off  -> "5 dated points"
  graph Unlinked off  -> "2 points, 1 links, 1 unlinked references"
  graph scope Folder  -> "No links between documents yet"   (the empty-title fallback)
  timeline all off    -> "No dated points here yet"
  ```

### UXP-240 ✓ Both overlays put every item in the tab order with no arrow alternative 🟡 [graph] [timeline] (RESOLVED 2026-07-25)
- **Problem:** the same shape as UXP-238, in the two surfaces that were never audited. Measured:
  ```
  timeline, 128 dated points : 132 focusables (128 rows + 3 source chips + close)
                               ArrowDown NO-OP, End NO-OP
  graph, 40 linked points    :  42 focusables (41 nodes + close)
                               ArrowRight NO-OP, Home NO-OP
  ```
  Neither count is capped: `graphModel` caps nothing (only *unlinked* edges cap, at `GRAPH_UNLINKED_CAP = 150`), and `collectTimelineItems` caps nothing. A year of journal entries is a year of tab stops. The timeline's `.tl-month` headers are not focusable, so there is no month-to-month jump either.
- **Milder than UXP-238, and the entry should say so:** both overlays are modal Tab traps, so cycling is the intended model and Escape does work (until UXP-239 fires). Shift+Tab from the first row reaches Close in one press. The harm is reaching Close from deep in a long list, and having no in-group navigation at all.
- **WITHDRAWN sub-claim:** the recon predicted the graph's Tab order would be "effectively random" because nodes are force-directed. **Measured and false** — mean 86px between consecutive tab stops with only 3 jumps over 200px across 41 nodes. Document order and the layout largely agree. The finding stands on the stop count alone.
- **Rule:** P3-2 (keyboard operability).
- **Target:** the repo's own roving-tabindex pattern, applied a fifth and sixth time. The timeline is a plain list (Up/Down + Home/End, and PgUp/PgDn to the adjacent `.tl-month` is the natural month jump). The graph needs a decision first: document order or spatial nearest-neighbour. Do not assume spatial — the measurement above says document order is already close to spatial, so the cheap answer may be the right one.
- **Resolved:** roving tabindex, the repo's own pattern applied a fifth and sixth time. Driven and measured:
  ```
  timeline, 128 dated points : 132 tab stops -> 5    (close + 3 source chips + 1 row stop)
  graph,     42 nodes        :  42 tab stops -> 2
  ```
  **Timeline** (a vertical list): `↑/↓` adjacent row, `Home`/`End` the ends, `PageUp`/`PageDown` the adjacent **month**. **Graph**: all four arrows step one node in **document order** (owner decision, on this entry's own measurement that document order already tracks the layout), `Home`/`End` the ends, and `PageUp`/`PageDown` deliberately unclaimed so they keep scrolling the panel. Ends clamp, never wrap.
- **The five prior roving groups each inlined their own index math; this one extracted it.** `roveIndex(key, i, count, groupStarts)` is now the shared pure core, which is what guarantees the two overlays cannot drift apart. Paging is **strictly adjacent-group**: the "first press goes to the top of this group, second press goes to the previous group" variant was rejected because it makes one key mean two things depending on where you already are, and §3's `PageUp`/`PageDown` already means exactly one month.
- **`PageUp`/`PageDown` is not a new binding.** §3 already reserves it for month paging in the agenda calendar grid and the Schedule date picker; the timeline is grouped by month, so this is that meaning reused on a third surface.
- **The arrow mapping differs from the search legend's on purpose,** and §3 now records the reconciliation: in both, the arrows follow the **visual layout** (the legend's chips run horizontally, the timeline is vertical) and the secondary key jumps a group. Not a P1 context inversion.
- **A latent trap regression this fix would otherwise have introduced, caught before it shipped.** Both overlay traps collected focusables as `[tabindex="0"],button:not(:disabled)`. Timeline rows are real `<button>`s, so they kept matching at `tabindex="-1"` while native Tab skipped them — `last` became an element Tab could never reach, the wrap never fired, and **Tab walked out of the modal**. Proven load-bearing rather than asserted: a build with the roving seeds but the old selector was driven, and Tab escaped the timeline (`inPanel: false`) while the graph, whose nodes are `<g>` and never matched the button clause, was unaffected. Both selectors now carry `:not([tabindex="-1"])`.
- **Broken graph nodes stay in the roving order** — whether they should be focusable at all is UXP-242, still open, and this change deliberately does not prejudge it.
- **Also corrected:** §3's UXP-65 "sanctioned transient Tab-group" note still claimed the search legend's chips were full `tabindex="0"` stops, which UXP-238 had made false the same day. The rule was narrowed to what actually survives: a transient panel may host a Tab-group only while the group stays small, and size must be **measured**, not assumed.

### UXP-242 ✓ A broken graph node is a focusable `role="button"` that does nothing 🟢 [graph] (RESOLVED 2026-07-25)
- **Problem:** every node gets `tabindex="0"` and `role="button"` unconditionally; the `if (!n.broken)` branch then skips **both** the click and the Enter/Space handlers, leaving only `cursor:default`. Driven against a link to a deleted point:
  ```
  broken node: tabindex="0"  role="button"  cursor:"default"
               aria-label "Broken link target, 2 links."
  Enter -> nothing happened (graph state unchanged, focus unchanged)
  ```
- **Partly mitigated already, which caps the severity:** the `aria-label` omits the "Activate to open." suffix every healthy node carries, so a screen-reader user is told the target is broken. But the element still announces as a **button** and still consumes a tab stop, and pressing Enter on it is a silent no-op.
- **Rule:** P4-1 (silent no-op) with a P3 edge (a control that is reachable but inert).
- **Target:** decide between dropping it out of the tab order (`tabindex="-1"`, drop `role="button"`) and giving it something to do (a flash naming the missing target, which is more useful — a broken node is exactly the thing you want to investigate). Not decided here; the second is more work and is a product call.
- **Resolved, taking the second option (owner's call):** a broken node now flashes the missing target's name and where it is linked from, rather than being dropped out of the tab order. `role="button"` and the tab stop are now honest, because there is something behind them.
- **The name is the author's own link CAPTION.** `[[#gone|Chapter 3]]` flashes *“Chapter 3” is missing.* Once the target is deleted that caption is the only human-readable name the missing point ever had: the id is opaque, and `graphModel` deliberately refuses to use it as a title. A bare `[[#gone]]` falls back to *That target is missing.* rather than showing an id no one will recognise.
- **It names the SOURCES, because that is where the fix has to happen** — the same choice the Broken links report already makes by jumping to the source rather than the missing target. It reuses that report's `collectBrokenLinks` collector rather than re-deriving broken links, so the two can't disagree.
- **A real copy defect the driving caught, which reading could not have.** A source "title" is the point's whole first line with the link tokens stripped, so with realistic prose the first driven output was:
  ```
  Linked from “Outline links Chapter 3 and”
  ```
  The dangling "and" is the hole the removed token left. Names are now capped at **28 characters including the ellipsis, byte-identical to the graph's own node-label truncation**, so the toast carries a name and not a paragraph. Pinned at the exact boundary, since an off-by-one here is invisible until it is ugly.
- **Folder scope is covered too.** A missing *document* has no caption, so it names the documents that link to it (`That document is missing. Linked from “notes”.`). Leaving it silent would have been the same defect one scope over.
- **Verified by driving, against the pre-fix build as a control:** 13/13 after, 5/13 before. Enter, Space and click all speak, the message reaches `#a11y-live` through `flashHint`'s existing channel, a healthy node still navigates, and no opaque id leaks into the copy.
- **Still true, and deliberately unchanged:** the node stays in the roving order UXP-240 gave it. This entry's alternative — dropping it to `tabindex="-1"` — would have hidden the one dot you opened the graph to investigate.
