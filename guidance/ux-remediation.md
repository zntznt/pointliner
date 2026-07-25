# Pointliner — UX Remediation Register

This is the **active fix list** that pairs with `ux-discipline.md`: the places the app does not yet
conform to the single interaction language, each a numbered defect to close. Under `ux-discipline.md`
§0 **any non-conformance is a defect, not a preference** — every bespoke syntax or one-off interaction
that didn't come from the standard is on this list (see the standing syntax-sprawl guard, UXP-20).

This is an **append-only register**: file a new non-conformance here as the next `UXP-NN`, with the
**problem**, the **rule** it violates, and the **target** end-state. When an entry ships conformant,
mark it resolved in place and move it to `ux-remediation-archive.md` (the closed-entries record), so
this file stays a short view of what is actually open. Verify any named symbol with grep before
acting (controls drift).

**Status:** ☐ open · ◐ in progress · ✓ closed (move to the archive on close)
**Severity:** 🔴 breaks the unified language · 🟡 partial / inconsistent · 🟢 cosmetic-but-tracked

> **Current state (2026-07-23):** the remediation program is essentially complete — every UXP/LF/QP/QX
> defect from Tiers 1–3, the correctness batch, and the many audit waves (UXP-3…199, the Lean-floor
> LF-* set, and the adversarial-robustness waves) is closed and archived in
> `ux-remediation-archive.md`. **Two items remain open below:** UXP-20 (standing guard, never closes)
> and UXP-170 (deferred — an egress-blocked FA-subset glyph rebuild; the fallbacks keep it legible).
> UXP-171–183 closed in Phases 2–7 (UXP-178, the builder's front door, shipped last).

---

## Open items

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


### UXP-170 ☐ The estimate pill shares the width-resize glyph fa-left-right (design-language §1) 🟢  [Batch 5] (DEFERRED — github-egress-blocked glyph rebuild)
- **Problem:** §1 records that `fa-left-right` was narrowed to "the horizontal-span concept only" when refile moved to `fa-arrow-right-arrow-left`, but estimate never got the same treatment — the width control and the uncertainty pill still share one glyph (5 est sites). A live contradiction of a locked Decision-corollary. Harm minimal (icon aria-hidden, labels correct), P5-drift.
- **Rule:** design-language §1 (one glyph per concept).
- **Target:** give estimate its own identity glyph (a wave/tilde/distribution mark matching the ∿/≈ fallbacks) and retire `fa-left-right` from all five est sites, the move refile got. Needs the FA subset rebuild (`tools/build-fa-subset.py`) — **github-egress-blocked in this sandbox**, so DEFER the glyph swap to a networked machine; the fallbacks keep it legible meanwhile.


### UXP-171 ✓ Builder has no responsive layout 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** Fixed 260px nav + pane layout with zero @media queries. On phones at ≤560px, both panes crush into unusable slivers. The app's `@media(max-width:560px)` block already sets `#io-card` and `#io-card.guide-open` to full-width/viewport height, but `#io-card.builder-open` has no matching rule. The builder's two-pane flex layout has no single-pane fallback at narrow widths.
- **Rule:** P3 (tap-target floor, `ux-definition-of-done.md` §3 — touch targets must clear 24px minimum under `@media(hover:none)`) and Design Language §4 (component consistency — the builder is the only card-based dialog surface with no responsive layout).
- **Target:** (1) CSS: Add a `#io-card.builder-open` rule to the existing `@media(max-width:560px)` block so the builder card fills the viewport width and respects the viewport height cap, matching the guide-open behavior. (2) CSS: Add `.builder-nav` width reduction and stack/scroll rules at narrow widths to prevent the nav from occupying more than ~40% of the card. (3) JS layout toggle (single-pane with back button) is scoped to a separate implementation phase and will need a follow-on entry covering the keyboard listener review and form-back-navigation semantics. The CSS-only fixes here make the builder usable on phones; the JS toggle is a UX enhancement for narrow screens.

### UXP-172 ✓ Tab does not commit ghost-text autocomplete 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** The search box shows a ghost-text suffix of the top-matching command (`.builder-search-ghost`). Pressing Tab unconditionally moves focus to the right pane — the ghost suggestion is never committed to the filter text. In every mainstream autocomplete widget, Tab commits the visible suggestion.
- **Rule:** P1-2 (keyboard grammar fit — a new Tab meaning must be recorded in the keyboard grammar §3 table when shipped) and P1 (Predictable — users transfer the Tab-to-complete convention from VS Code, Spotlight, and browser address bars).
- **Target:** When ghost text is visible and non-empty, Tab commits the ghost suggestion by setting `searchEl.value` to the ghost text content and dispatching an `input` event so the existing filter handler fires (which already resets `activeIdx = 0` and calls `renderNav()`/`syncActive()`). After the filter handler runs, focus the right pane. When ghost is empty, Tab behaves as today (focus to pane). Add a `Shift+Tab` case to the search keydown handler (`e.shiftKey && e.key === 'Tab'`) that prevents default and focuses the left nav, so Shift+Tab from the search box cycles back into the nav rather than escaping the dialog. On ship, the keyboard grammar §3 table gains a "Tab — commit autocomplete suggestion (in builder search)" entry.

### UXP-173 ✓ Builder right pane has no aria-live region 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** When the user navigates commands in the left nav (ArrowUp/Down), the right pane's help text updates via `renderBuilderPaneInto()`. This content change is not announced to screen readers. The pane has `role="document"` and `tabindex="-1"` but no `aria-live`.
- **Rule:** P3-5 (state changes not tied to focus must be announced via the aria-live region).
- **Target:** On each command selection via arrow navigation (not on initial render), write a brief description to the existing `#a11y-live` element (e.g., "Heading — Turn point into a heading. Syntax: # text"). This reuses the app's existing off-focus announcement infrastructure. The initial render must not fire the live region — use a `_builderLiveSuppress` flag or check that this is not the first `syncActive()` call.

### UXP-174 ✓ Builder open has requestAnimationFrame focus race 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** The search input is focused via `requestAnimationFrame` after builder DOM mount. While the browser event model makes the race window extremely narrow in practice (input events are queued behind the current event loop's rAF), the deferral is unnecessary and the synchronous alternative is cleaner.
- **Rule:** P1 (Predictable — focus should land in the expected element immediately on open, not after a frame delay).
- **Target:** Focus the search input synchronously after DOM construction (immediately after `ioCard.querySelector('.builder-search')`). Use `requestAnimationFrame` only for non-focus operations (e.g., selecting existing search text).

### UXP-175 ✓ Tab from right pane escapes dialog focus trap 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** The builder pane is a `<div tabindex="-1">` with `role="document"`. When focus is in the pane on a plain help-text view with no form fields, pressing plain Tab finds no matching elements in the global focus-trap query (which queries only `input, textarea, button:not(:disabled)`). The trap's wrap-around detection evaluates false because the pane is neither first nor last focusable. Tab bubbles past the trap, escaping the modal dialog.
- **Rule:** P3-2 (keyboard operability — focus must stay within the modal dialog).
- **Target:** In the builder's own pane `keydown` handler (adjacent to the existing Shift+Tab case), add a plain-Tab case that prevents default and cycles focus to the search box. This interception must be conditional: only when `e.target === pane` (the pane div itself, not a child form input, button, or link). When focus is on a `.builder-field-input`, `.builder-form-submit`, `.builder-form-cancel`, or `.guide-related-chip`, allow native Tab behavior — the global focus trap handles those elements. Composition with UXP-172: When Tab from search commits ghost text then focuses the pane, a subsequent Tab from the pane cycles back to the search box. The Insert button remains reachable via Shift+Tab from the search box.

### UXP-176 ✓ Builder nav missing Home/End/PgUp/PgDn 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** The command list (`role="listbox"`) handles only ArrowUp, ArrowDown, ArrowRight, Tab, Enter, and Escape. With 50+ items in some trigger modes, arrow-only navigation is slow. Standard listbox navigation includes Home, End, PageUp, and PageDown.
- **Rule:** P1 (Predictable — standard listbox keyboard navigation keys should work in every listbox in the app, matching the slash menu and bullet popup conventions).
- **Target:** Add Home (index 0), End (index `vis.length - 1`), PageUp (index − 8, clamped), PageDown (index + 8, clamped) to the nav `keydown` handler. Each fires `syncActive()` and focuses the new active item.

### UXP-177 ✓ _restoreState leaks across builder sessions 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** `_restoreState` is a module-level variable (set by `showNestedDialog` and the `@table` / nested-dialog paths in `applyBuilder`). `closeBuilderWindow()` clears it, but `closeIo()` can be called directly (e.g., opening the file menu while the builder is open) without going through `closeBuilderWindow()`. Separately, `closeIo()` does not remove the `builder-open` class from `#io-card`, so the re-entrancy guard in `openBuilder` permanently blocks the builder for the rest of the session.
- **Rule:** P1 (Predictable — state must not leak across sessions).
- **Target:** At the top of `closeIo()`, before any cleanup logic, check `if (ioCard.classList.contains('builder-open')) { closeBuilderWindow(); return; }`. `closeBuilderWindow()` removes the `builder-open` class first, then calls `closeIo()` — so the recursive call detects no `builder-open` and proceeds with normal cleanup. The `return` after delegation is essential to prevent double-cleanup. This is a safety net: normal paths already route through `closeBuilder` → `closeBuilderWindow()` via `ioCancel`; this guard covers the uncommon case where `closeIo()` is called directly from a non-builder-aware code path.

### UXP-178 ✓ Builder has no visible entry points beyond typed triggers 🟡 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Shipped as:** `launchBuilder()` opens the builder with no typed trigger, from three doors — a toolbar button (`btn-builder`, the checklist icon), the `/builder` action verb, and `Ctrl/Cmd+K` — plus a `getting-around` concept-guide entry and right-click-to-guide. The deferred design's hard part (the "browse-all trigger mode" / "text-stripping bypass") dissolved: `launchBuilder` re-targets the caret at END of the point, where the existing `stripTriggerRun` path already removes nothing (slice past the end is empty), so no synthetic flag or strip bypass was needed. And rather than auto-switching verbosity (the deferred note's plan, with its restore edge cases), explicit invocation is simply **decoupled** from the Guided-only typed-trigger gate — the doors open the builder in any tier without mutating the user's verbosity. Verified in headless Chromium (all doors, no character eaten, Standard-tier decouple).
- **Problem:** The builder only activates by typing `/`, `@`, or `{` in an editing point while in Guided mode. There is no toolbar button, menu entry, or other visible affordance that opens the builder. A user who does not know to type these trigger characters has no way to discover the command browser. P2-1 requires three doors: visible affordance, typed path, and menu path. The builder currently has only the typed path.
- **Rule:** P2-1 (all three doors required — visible affordance + typed path + menu path). P1-2 (any new shortcut must fit §3).
- **Target:** (1) Add a toolbar button (using a command-palette-style icon) that opens the builder on the currently focused or actively-editing point. When no point is being edited, the button enters edit mode on the focused point (or root if none focused), auto-switches to Guided mode, then opens the builder with no trigger filter (showing all commands). Store the pre-builder verbosity level and restore it when the builder closes. The button satisfies both the visible-affordance door and the menu-path door. (2) Add the toolbar button's function to the `?` help panel under a "Command browser" entry. (3) Add `/builder` as a slash-verb alias (writes nothing; just opens the builder with all commands shown), satisfying a discoverable typed path for the builder itself.
- **Note:** A global keyboard shortcut (`Ctrl/Cmd+K`) is identified as desirable but requires resolution of the caret-context gap (the builder's `applyBuilder` requires `nodeId`, `content`, and `offset` from an actively-editing point, which does not exist from display mode). This is deferred to a separate UXP when the builder's architecture supports a caretless invocation mode, or when a focused-point-enter-edit-mode-then-open pattern is designed.

### UXP-179 ✓ Insert button silently no-op when no matches 🟢 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** The "Insert" button in the builder header is always enabled. Clicking it when search returns no results (`visibleCmds()` empty) calls `applyBuilder()`, which returns at the guard — a silent no-op. The Enter key in the search box has the same path and the same silent failure.
- **Rule:** P4-1 (no silent failure — every rejected input signals why).
- **Target:** Disable the Insert button (`disabled` attribute + `.builder-insert-btn:disabled` CSS) when `visibleCmds()` is empty. When Enter is pressed in the search box with no matching commands, write "No matching commands" to the `aria-live` region rather than silently returning.

### UXP-180 ✓ Unsaved form data silently discarded on Escape and Cancel 🟢 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** When the builder shows an embedded form (`@link`: URL + text, `@image`: src + alt) and the user presses Escape or clicks the `.builder-form-cancel` button, the form is silently dismissed — `renderBuilderPane(cmd)` re-renders the guide entry, and all entered field values are lost with no confirmation. The `ux-definition-of-done.md` §4 draft rule states: "a transient input surface never silently discards non-empty typed input."
- **Rule:** P4 — `ux-definition-of-done.md` §4 draft-survival rule ("Drafts survive dismissal: a transient input surface never silently discards non-empty typed input.").
- **Target:** Store form field values in a module-level map keyed by command ID (e.g., `_builderFormDrafts`). When `showBuilderForm` renders a form, check for saved values and pre-populate the fields. When the form is cancelled (Escape or Cancel button), walk all form fields; if any are non-empty, save them to `_builderFormDrafts[cmd.id]` so re-navigating to the command restores them. Clear the drafts when the builder is fully closed (`closeBuilderWindow`). Empty forms dismiss immediately as today. This follows the "drafts survive" model — the user's partial input is kept for the session.

### UXP-181 ✓ Builder dialog missing aria-labelledby 🟢 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** The `#io-card` dialog has `aria-label="Command builder"` set by `openBuilder()`. The visible title (`.builder-title` like "Point commands" / "Insert commands" / "Brace picker") has no `id` attribute and is not associated with the dialog via `aria-labelledby`. Screen readers hear the static label but cannot associate the context-sensitive visible title.
- **Rule:** P3-1 (accessible names — `aria-labelledby` referencing the visible title is preferred over bare `aria-label` because it programmatically associates the visible text; the existing `aria-label` already meets the minimum bar).
- **Target:** Give `.builder-title` an `id` attribute (e.g., `id="builder-title"`). Set `aria-labelledby="builder-title"` on `#io-card` when the builder opens. Keep `aria-label` as a fallback for when the title element is not yet rendered.

### UXP-182 ✓ Builder reuses .guide-* CSS classes 🟢 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** The builder's right pane reuses `.guide-entry`, `.guide-ex`, `.guide-related`, `.guide-entry-title`, `.guide-entry-body`, `.guide-no-results` classes that were designed for the concept guide. Two builder-scoped overrides already exist (`.builder-pane .guide-entry` and `.builder-pane .guide-entry-title`) but the remaining classes are un-scoped. CSS changes to the concept guide can unintentionally affect the builder, and vice versa.
- **Rule:** Design Language §4 (component consistency — the builder should control its own paint surface rather than coupling to another feature's class namespace).
- **Target:** Add builder-specific class scoping for all remaining shared classes (e.g., `.builder-pane .guide-ex`, `.builder-pane .guide-related`). Or: add explicit CSS comments documenting the intentional coupling so future contributors know the classes are shared deliberately.

### UXP-183 ✓ @table builder path inserts hardcoded 3×3 🟢 [Builder Window] [Batch 6] (SHIPPED 2026-07-23)
- **Problem:** When `@table` is selected in the builder, the `applyBuilder` function's `@table` branch calls `starterTableText(3, 3)` — a hardcoded 3 rows × 3 columns. The standard `/table` slash command shows a size picker dialog that lets the user choose dimensions. The code comment in the `@table` branch acknowledges: "the size picker uses slashMenu which is unavailable from the builder. Inline size picker is tracked as follow-up."
- **Rule:** P1 (Predictable — the same command should produce the same behavior regardless of how it's invoked).
- **Target:** Add row and column number inputs to `BUILDER_FORMS` under a key that distinguishes the insert (`@`) path from the block (`/`) path (e.g., `'@table'`). In the form dispatch in `applyBuilder`, gate on both `BUILDER_FORMS[cmd.id]` AND `cmd.trigger === '@'` to avoid intercepting the `/table` block command, which already has its own size picker via the slash menu path. The existing `@table` hardcoded branch then becomes dead code and must be removed.

### UXP-232 ☐ An unreadable filter is silent inside `{roll:}` and inside `count("…")` 🟡  [S3-PR4 follow-on]
- **Problem:** `parseSearchQuery` now emits `{kind:'invalid'}` for a rejected `is:` value, and every one of the seven consumers matches nothing honestly. But only two of them RENDER the reason: the search box (`#sh-invalid`) and `renderQueryPill` (`{query:}` / `{count:}`). `pickFromQuery` returns `''` into its existing empty-roll marker, which says the roll found nothing rather than that the filter was unreadable; and `queryReduce` / `queryCountIn` return a bare `0` into a `{= …}` math pill or a `check` constraint. A number sitting in a document reads as computed truth, so this is the surface where a wrong answer persists longest.
- **Rule:** P4-1 (no silent failure — every rejected input signals why).
- **Target:** a cue slot on both. `searchTermProblems(terms, opts)` already returns the message and needs no change; the work is entirely in finding somewhere honest to put it. For `{roll:}` that is plausibly the empty-roll marker's existing copy. For a math pill it is harder and worth designing rather than bolting on: `count("is:blocked")` can appear mid-expression, so the reason belongs on the pill, not in the number.

### UXP-233 ☐ An unreadable `due:` / `start:` date is still a literal text term 🟡  [S3-PR4 follow-on]
- **Problem:** `due:nonsense` falls through `parseDueDate` to `{kind:'text'}` and silently searches for its own string, exactly as `is:` used to before S3-PR4. Same defect, same funnel, different field family.
- **Rule:** P4-1.
- **Target:** the same invalid-term treatment. The reason it was scoped OUT of S3-PR4 rather than overlooked: `is:` is a CLOSED set, so "unreadable" is a set-membership test, while the date arm's grammar is genuinely open (ISO dates, `today±N`, `<` / `>` prefixes). Deciding when a half-typed `due:2026-0` has stopped being in-flight is a real judgment call and needs its own design, not a heuristic guessed at inside another change.

### UXP-234 ☐ A sequence declared only inside an excluded subtree is lost quietly 🟢  [S3-PR5a follow-on]
- **Problem:** `exportExclusionImpact` names the **variables** and **rules** a shared HTML copy loses to `Exclude from export`, because both fail loudly in the copy (the `.brace-attempt` cue). A `{seq Flow: TODO | BLOCKED | SHIPPED}` declaration lost the same way is not named: a kept point whose leading `#BLOCKED` keyword no longer belongs to any sequence simply renders as ordinary text, with no badge and no cue. The copy is quietly less informative rather than visibly broken, which is exactly the failure that is hardest to notice.
- **Rule:** P4-1 (no silent failure).
- **Target:** add `collectSequences` to the diff (it takes an explicit `rootNode` and bypasses the `_varsVer` cache like the other two, so the shape is already there) and name lost sequences alongside the variables and rules. Deferred rather than done because the degradation is cosmetic where the other two are errors, and a third clause was pushing the export toast past what one toast should carry. Worth pairing with a look at whether that toast should become a small report surface instead.
