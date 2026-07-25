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

> **Current state (2026-07-25):** the remediation program is complete — every UXP/LF/QP/QX defect
> from Tiers 1–3, the correctness batch, the audit waves, and the 2026-07 five-persona spree
> (UXP-232…236) is closed and archived in `ux-remediation-archive.md`. **UXP-20 is the only item
> left open, and it is meant to stay that way:** it is the standing P5 guard, not a defect, and
> closing it would remove the gate rather than satisfy it. UXP-170's blocker turned out to be
> environmental and was resolved 2026-07-25 once the egress was tested rather than assumed.
> UXP-171–183 closed in Phases 2–7 (UXP-178, the builder's front door, shipped last).
> Later persona passes on the uncovered surfaces added **UXP-237** (closed 2026-07-25: an unwritten
> footnote's marker used to export as raw `[^ghost]` brackets; the owner's call was to drop it and
> report the count, following `linkText`'s existing "unresolvable never leaks raw syntax" rule) and
> **UXP-238** (closed: the search legend's 48 tab stops). The
> 2026-07-25 graph/timeline pass — the first aimed at surfaces the register had **never reached** —
> opened **UXP-239…243**, all five driven in a browser. **All five are now closed and archived:**
> UXP-239 (focus lost on a timeline source toggle, taking Escape with it), UXP-241 (neither overlay
> announced its count change), UXP-240 (every item in the tab order; roving tabindex, the graph
> navigating in **document order** per the owner's decision), UXP-242 (a broken graph node was an
> inert `role="button"`; it now names the missing target and where it is linked from) and UXP-243
> (graph tap targets under the 24px floor; layout separation plus a clamped hit circle).
> **Two of the five entries had measured something wrong**, and both corrections are recorded on the
> archived entries: UXP-240's "the graph's Tab order is effectively random" was withdrawn on
> measurement, and UXP-243 had taken a bounding box where a **tap** was the question, which
> overstated the defect in one direction (13 of 15 nodes already cleared the floor) and hid it in the
> other (the label it counted as target width is `pointer-events:none` and never was tappable).
>
> The 2026-07-25 **rolls log + reusable packs** pass — the second aimed at surfaces the register had
> never reached (both were at **zero** mentions across all 304 register + archive entries) — opened
> **UXP-244** (the pack editor silently discarded typed input on dismissal) and **UXP-245** (a roll
> landed where you could not find it). **Both are closed and archived**, each driven in a browser
> before and after. See the pass section at the foot of this file for what was checked and
> deliberately not filed, including one candidate that died on its control.
>
> A third pass changed the selection principle: with every never-reached surface covered, it audited
> by **defect CLASS** instead — walking `ux-definition-of-done.md` rule by rule and enumerating every
> surface each rule governs. The first rule tried, P4 drafts-survive-dismissal, found **UXP-246**
> (0 of 10 insert dialogs honoured it, 335 characters destroyed in one driven pass) and, underneath
> it, **UXP-247** (four dialogs opt out of the shared builder and forfeit every fix made to it).
> UXP-246 is closed and archived; **UXP-247 is open** as a sequenced refactor. The lesson worth
> keeping: UXP-244 looked like one careless surface, and was actually the visible edge of a rule
> applied 5 times out of 20.
>
> **As of 2026-07-25 the register holds one open defect (UXP-247, structural).**
> (The `✓` entries still sitting in this file below are closed work that predates the
> move-to-archive convention being applied consistently; they are not open items. **UXP-20**, the
> standing P5 syntax-sprawl guard, is a gate rather than a bug and is meant to stay open.)

---

## Open items

### UXP-247 ☐ Dialogs opt out of the shared builder, and forfeit every later fix 🟡 [dialogs] [structural]
- **Problem:** `openInsertDialog` is the shared dialog builder, and its field vocabulary is
  **text / textarea / checkbox** plus chips, preview and hint. Four dialogs need more than that and
  so build their own DOM instead:

  | dialog | what it needs that the builder cannot express |
  |---|---|
  | `openVarDialog` | a **"Known variables" picker grid** (`var-pick-grid`, cards that fill both fields and flip the mode) and an **`io-seg` segmented "Value type"** control that rewrites label, placeholder, hint and button text via `setMode()` |
  | `openPropsDialog` | a **repeating key/value row list** with add/delete and multi-line paste |
  | `openDueDateDialog` | a **date row** with an inline day picker per field |
  | `openAppearanceDialog` | **swatch / icon grids** that commit on click and re-render in place |

- **Why this is a defect and not just an implementation detail:** every opt-out silently forfeits
  every future improvement to the shared builder. **UXP-246 is the proof** — one fix at the choke
  point reached nine dialogs and skipped exactly these four, and nothing in the codebase or the
  tests would have said so. It was found only by auditing the RULE across surfaces.
- **Violates:** §6 "Reuses the menu / pill / feedback / affordance patterns rather than reinventing",
  and the DoD's own premise that a gate applied at one place holds everywhere.
- **Target:** grow `openInsertDialog`'s field vocabulary to cover the four cases (a `seg` field type
  and a `grid` field type would cover var and appearance; a `rows` type would cover props; the date
  row is closest to existing chips), then migrate the four. **Sequencing note:** this is a refactor
  of four working dialogs plus the builder every other dialog depends on, so it wants its own PR
  train with the driven per-dialog checks UXP-246 already wrote, not a drive-by.
- **Interim state (shipped with UXP-246):** all four now conform to the drafts rule via
  `wireDialogDraft`, which delegates to the same two pure cores rather than growing a fifth
  mechanism. The rule is satisfied; the structural cause is not.

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
  - **REVERSED in part, 2026-07-24/25 (S3-PR4, #1068).** Three clauses above no longer describe the
    code, and the record is corrected here rather than left to be trusted:
    - **`state:` shipped** (`kind:'state'`, a legend row), against "No `state:` operator." A
      hashtag filters by the *keyword*; `state:` filters by a **declared sequence's** state, which
      `#waiting` cannot express once a document declares its own sequences.
    - **OR shipped** (QX-5, `a | b`), against "OR is deferred." Real queries did demand it; `|`
      reuses the app's own alternation glyph rather than minting a sigil, so the deferral's actual
      concern (a new precedence syntax) never materialised.
    - **Malformed `is:` and `due:`/`start:` tokens no longer stay literal text.** They parse
      `{kind:'invalid'}` and match nothing while explaining why. The escape-hatch rule was doing
      the opposite of its stated purpose for a RESERVED field: `is:blocked` became a literal search
      for the string "is:blocked", which `searchHighlightNeedles` then highlighted, so a typo
      produced a confidently wrong answer rather than a safe empty one. The hatch still holds for
      lone `-`, `#non-word`, and a glued `a|b`, which genuinely have a prose reading.
    - **Worth naming plainly:** the third reversal was made by this project's own AI PRs, twice,
      without updating this record — which is the exact failure this guard exists to catch, turned
      on itself. A decision log that has quietly stopped describing the code is worse than none,
      because it is trusted. Any future reversal of a recorded decision edits this row in the same
      PR that makes it.
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

### UXP-238 ✓ The search legend is 48 tab stops 🟡 [search] (SHIPPED 2026-07-25)
- **Problem:** every one of the 48 cheatsheet chips in `#search-hint` carried `tabindex="0"`, so a keyboard user who Tabbed off the search box walked **48 stops** to reach the next real control. Driven with real keypresses:
  - `Tab` from `#search-box` → `KBD "#tag"`, and 48 of the page's 64 focusable stops were chips
  - `Escape` from a chip → focus **stayed on the chip**, panel stayed open (no way out but Tab)
  - `ArrowRight` from a chip → focus did not move (no alternative to Tab)
- Tier-gated in the direction that makes it worse: Standard and Lean measure **0** focusable chips (`.sh-row` is `display:none`, which takes them out of the tab order), so it bit only in **Guided**, the tier newcomers start in.
- **Not** that the chips are focusable: they insert a token on click, so P3 requires keyboard operation. The defect is putting a 48-member group in the *sequential* order instead of giving it one stop.
- **Rule:** P3-2 (keyboard operability) headline, P1-3 (Esc resolves outward) secondary.
- **Fixed:** roving tabindex in `wireSearchExamples`, the pattern this file already uses four times (agenda calendar grid, table grid #443, the `role="grid"` helper, the tablist). Chip 0 seeds `tabindex="0"` and the other 47 `-1`; Left/Right walk the flat document order (the rows are ragged, one to three chips each, so there is no column count to assume), Up/Down jump to the first chip of the adjacent `.sh-row`, Home/End reach the ends of the group, and each move swaps `-1`/`0` and focuses. Ends **clamp** rather than wrap, matching the calendar grid. Escape returns focus to `#search-box` **without clearing**, so a second Escape hits the box's own handler and does the clear plus `restoreChromeReturn()` — two levels, in the documented order. No tier gate needed; `display:none` already handles Standard and Lean.

---

## Graph + Timeline persona pass (2026-07-25) — UXP-239…243

The first pass aimed at surfaces the register had **never reached**. A keyword sweep of the register
plus archive (304 entries) found the rolls log and data packs at **zero** mentions, the timeline at
5 and the graph at 14 (mostly incidental), against dozens each for agenda, bases, search and the
builder. Of the seven toolbar panels, builder / capture / agenda are covered and **graph and
timeline never were.**

**Closed since:** UXP-239 and UXP-241, both moved to `ux-remediation-archive.md`.

The pair is self-checking: the timeline is commented in-source as "the graph's chronological twin",
they share the `.graph-head` / `.graph-title` / `.graph-count` / `.graph-empty` CSS, and their
open / close / Tab-trap code is near-identical. So every divergence has a **built-in control** — one
of the two already does it right, 200 lines away. That is exactly how UXP-239 was confirmed.

All five were driven in a real browser with real keypresses against seeded documents (128 dated
points for the timeline, 40 linked points plus a deliberately broken link for the graph).

### Checked and deliberately NOT filed
- **The unlinked count is honest.** The graph reports `"N of M unlinked references"` when `GRAPH_UNLINKED_CAP` truncates, and the plain total when it does not. That is UXP-146's lesson already applied correctly. Confirmed at 20 uncapped references; no finding.
- **Both overlays trap Tab and restore focus on close** (`graphReturnFocus` / `timelineReturnFocus`), and open with focus on the close button rather than stranding it on the hidden toolbar. Working as documented.
- **Empty states were read in source only** and cite the fix path well; they were **not driven** in this pass, so nothing is claimed about them.

---

## Rolls log + reusable packs persona pass (2026-07-25) — UXP-244…245

The second pass aimed at surfaces the register had **never reached.** The graph/timeline pass's own
sweep named the two that were left at **zero** mentions across all 304 register + archive entries:
the **rolls log** (`logRoll` / `resolveRollLogHome`, the `btn-rolllog-tb` toolbar toggle) and
**reusable packs** (`openDataPackManager` and its list/edit views). Everything below was driven in
headless Chromium with real keypresses, against seeded documents.

**Both entries below are CLOSED and their full text, with the resolution, is in
`ux-remediation-archive.md`.** They are kept here in short form because this pass section is the
record of how the two surfaces were reached.

### UXP-244 ✓ The pack editor silently discarded everything you typed 🟡 [packs] (RESOLVED 2026-07-25)
- **Problem:** the pack editor is a full authoring surface (name + a multi-line **Grammar rules**
  textarea + a multi-line **Variables** textarea), and every way out of it destroys unsaved input
  with **no message at all**. Driven with 63 characters typed across the three fields:

  | gesture | typed input | packs saved | toast |
  |---|---|---|---|
  | `Escape` | 63 chars | 0 | **none emitted** (`#flash-hint` never created) |
  | `Back` button | 63 chars | 0 | **none emitted** |
  | `Escape` over an unsaved **edit of a saved pack** | rules grown from 2 choices to 6 | reverts to the 2-choice version | **none emitted** |

  Re-opening does not offer the draft back: `New pack` gives a blank form (`name:"New pack"`,
  `rules:""`, `vars:""`). The third row is the worst of the three — it silently reverts data that
  was already **in the document**, and because the discard says nothing, the last toast still on
  screen at that moment read *“Saved pack “Bestiary””*.
- **This is not a missing mechanism, it is an unapplied one.** The same file implements
  draft-survival **four** times: `captureDraft` ("survives close/reopen; cleared only on successful
  capture", §6/UXP-84), `journalDraft`, `chronicleDraft`, and `_builderFormDrafts` — which
  **UXP-180 added for exactly this defect in the builder's embedded forms.** The pack editor has no
  equivalent; a source sweep finds `_builderFormDrafts` present and no pack-draft store.
- **The intent behind the current code is right and must be preserved.** `_packDraft`'s comment
  ("BUG-1: … never persisted on root.plugins until the user commits, so 'New pack → Back' leaves no
  junk") is a deliberate fix: an abandoned pack must not litter the list. Keeping the *typed text*
  is a different question from persisting an *empty pack*, and the fix must not undo BUG-1.
- **Violates:** P4 — `ux-definition-of-done.md` §4, "**Drafts survive dismissal**: a transient input
  surface never silently discards non-empty typed input." Secondarily P1: the rule is applied in
  four other surfaces of the same app and not this one.
- **Fixed (owner's call: keep the draft, like capture).** A `_packDrafts` store keyed per pack, read
  back through the pure `packFieldsFor` when the editor opens and written by `stashPackDraft` on
  **both** exits (the Back button and `ioCancel`, which Escape and the backdrop route through);
  cleared only by a successful Save. `packDraftFrom` decides what is worth keeping with one rule —
  the fields differ from the pack as stored — which both preserves BUG-1 (an untouched New pack is
  identical to its own fresh record, so nothing is kept and no junk pack is persisted) and keeps a
  deliberate **clearing**, which a "non-empty only" test would have discarded as an untouched form.
- **The bug that only driving caught.** The first implementation keyed the draft by `pack.id`. For a
  new pack that id is minted fresh on every `+ New pack` click, so the store kept every draft
  faithfully and restored **none** — and every source pin passed, because the code was all present
  and correct-looking. `packDraftKey` routes the uncommitted pack to a constant slot, and Save
  snapshots that slot before `_packDraft` is cleared. Pinned by name, since no source pin would have
  found it.

### UXP-245 ✓ A logged roll landed where you could not find it 🟢 [rolls log] (RESOLVED 2026-07-25)
- **Problem:** turning the log on flashes *“Logging rolls to your Rolls log”* — naming a place the
  user then has no way to reach. Driven in a **122-point** document with the dice pill near the top:

  | measured | value |
  |---|---|
  | index of the created `Rolls` home | **121 of 122** (appended last) |
  | is it in the DOM after the roll | **no** (virtualized; below the fold) |
  | is it in the viewport | **no** |
  | toast on the roll itself | **none** (empty `#flash-hint`) |
  | any code path that jumps to the log | **none** (`anyJumpToLog: false`) |

  So the one message the feature ever gives names a destination that is off-screen, un-rendered, and
  unreachable except by manually scrolling to the end of the document and hoping.
- **Scope note, stated honestly:** the log itself is **correct**. Entries nest properly under
  `Rolls → 2026 → 07 → 25` and read `21:13 · 2d6 → 8`; repeat rolls append under the same date; a
  second roll source appends beside the first; and with logging off `logRoll` is a clean no-op. The
  defect is discoverability of the destination, not the recording.
- **Violates:** P2 (a capability whose output has no visible front door) and P4-1 in its "no silent
  success" reading — the roll that was recorded says nothing.
- **Fixed (owner's call: the first roll names it, and there is a jump).** Three parts, all through
  pure cores: `rollLogToggleMessage` stops promising "your Rolls log" and instead names the real
  home, or says plainly that the first roll will start one; `rollLogFirstEntryMessage` fires **once
  per switch-on** from `logRoll` (every roll would be noise, none was the defect) and names both the
  destination and the door; and a **Go to your Rolls log** row in the File menu navigates with
  `zoomInto`, which is the capture strip's own answer to "where does this land" (`cap-dest-jump`).
  The row is keyboard-operable for free through the menu's existing roving tabindex and Enter
  handler, so no new gesture or keybinding was minted.
- **One trap worth naming:** the row's visibility must be gated on `rollLogHome`, a **non-creating**
  lookup. `resolveRollLogHome` creates the home as a side effect, so gating on it would have
  conjured a "Rolls" point into every document each time the File menu was painted. Pinned.

### Checked and deliberately NOT filed
- **Undo is coherent with logging on — a candidate that died on its control.** The first reading of
  this pass was "one `Ctrl+Z` after a roll destroys the whole roll log". Re-driven **with logging
  off as a control**, that is false: with logging on, one undo restores the previous roll value
  *and* removes that roll's log line (2 lines → 1), exactly as with logging off. The original
  reading was an artifact of the first roll of a session, where creating the `Rolls` home is its own
  (correct, and correctly undoable) document change. Recorded because the withdrawal is the useful
  part: **a driver with no control cannot tell "the feature broke undo" from "this was never
  undoable".**
- **The File-menu `Log rolls` and `Reusable packs` rows are keyboard-operable.** Both are
  `div[role=button]` with no native semantics, which is the shape of the builder keyboard-nav bug
  (#1021) — but driven, they focus (`tabindex="-1"` seeded by the menu's own roving pass) and
  `Enter` activates them through the menu's `keydown` handler. Working as documented; no finding.
- **The pack list view's own P4 work is already done:** `Export…` is `disabled` with no packs,
  removal goes through `openConfirmDialog`, enable/disable and save/remove each flash a named toast,
  and `_packFocusId` keeps focus on the acted-on row across the in-place re-render.
- **The toast on toggling logging on was measured, not assumed.** An earlier reading of "no toast"
  was the driver querying `#hint`; the element is `#flash-hint`, and the message is present at full
  opacity. No finding.
