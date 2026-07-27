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
> **P3-3 (focus-visible on every focus stop) was audited 2026-07-25 and is CLEAN**: 21 surfaces
> walked with real Tab keypresses, **302 focus stops, 0 without a focus indicator**. Driven rather
> than grepped because the ring is applied through a hand-maintained list of 112 `:focus-visible`
> selectors, and the interesting question was which stops are missing from it. **The first run of
> that driver was wrong and is worth remembering:** it reported six inputs as having no indicator,
> because their focus styles are TRANSITIONED (`border-color`/`box-shadow`, .12s) and the computed
> style was read immediately after Tab, mid-transition, still at the unfocused value. With a settle
> delay the count went to zero. Nothing was filed, because there was nothing wrong.
>
> **P2-2 (the menu teaches label + description + typed form) is now audited — see UXP-250, closed.**
> The earlier "driver could not open the menus" note was half right: the driver did have two real
> bugs, but the headline symptom was the APP behaving correctly. `/` and `@` do not open one menu;
> `checkSlash` branches on the verbosity tier, and in the DEFAULT (guided) tier it deliberately
> routes to the Builder instead of `#slash-menu`. Auditing `#slash-menu` in the default tier
> reports "menu did not open" forever.
>
> **P1-3 (`Esc` resolves outward) was audited 2026-07-26 and is CLEAN — 15/15 driven.** Chosen
> because it governs interaction SEQUENCES, which an entry-point-list audit structurally cannot see.
> Both halves of the rule hold: the **ladder** (`Shift+F10` opens the point menu and Escape closes
> the menu only, returning focus to the point it was opened from; a real `Shift+ArrowDown` selection
> of 3 clears on the next Escape; `zoomInto` then Escape zooms back out) and the §3 **chrome
> contract** (search field, file menu and help panel each put the caret back on the SAME point at
> the SAME offset, 9/9).
>
> **Every failure this audit reported was the driver, five times over**, and the list is the useful
> artifact: (1) a scripted `enterEdit()` arms NEITHER `armChromeReturn` path — it loses
> `data-editing` to its own `scheduleReconcile` and never blurs, so there is no `lastEdit` — making
> the file menu and help panel look like they discarded the caret; (2) a door-finder matched a
> hidden element INSIDE the file menu; (3) the File door is `#logo-btn`, whose visible "File ▾" text
> is `aria-hidden`, so a `textContent` match cannot find it; (4) the `Shift+F10` handler is bound to
> the CONTENT element's keydown, so pressing Escape first (to build a selection) blurs the element
> the key needed to reach; (5) zoom state is `focusedId`, not `zoomId` — the check read `undefined`
> and reported "not zoomed" unconditionally. The standing lesson: on an interaction rule, a failing
> assertion is more likely to be the harness than the app, and must be proven against the real user
> path before it is written down.
>
> **P3-1 and P3-3 were RE-RUN per tier on 2026-07-26 and are clean in all three.** Both had
> originally been walked in the default tier only, which UXP-250 showed is not the whole app.
> 18 surfaces x 3 tiers: **647 focus stops (guided 226, standard 221, lean 200), 0 unnamed
> interactive elements, 0 focus stops without an indicator.** The differing stop counts are the
> control that the tier switch actually took effect — lean carries fewer stops, matching its
> reduced chrome (13 visible controls against 18).
>
> The re-run also exposed that **`#slash-menu` had never been audited by either rule in any tier**,
> because no `open*()` entry point reaches it — it exists only when `checkSlash` fires from a real
> caret, and it never opens at all in the default tier. Audited directly: **29 (`/`) and 21 (`@`)
> options, 0 unnamed**, `role="listbox"` carrying a name ("Point commands" / "Insert commands"),
> `aria-activedescendant` that RESOLVES to a real element, exactly one `aria-selected`, and the
> active row visually highlighted. Its options are correctly NOT tab stops — the listbox pattern
> keeps focus in the editor — so P3-3 finding no stops there is conformance, not a gap. The lean tip
> is `role="status"`, visible, named, with no interactive children.
>
> **P2-1 (all three doors / "built != hidden") was audited 2026-07-26 and is CLEAN.** Audited per
> verbosity tier, because UXP-250 established that `checkSlash` branches on the tier and every audit
> before it had run in the default tier only. Reachable-through-a-menu, per tier: **guided 72 via the
> Builder, standard 29 (`/`) + 21 (`@`) via `#slash-menu`, lean a visible `role="status"` tip naming
> the match and count** — and **0 commands of 50 are built without a menu door in any tier**. The
> Builder itself has a visible door in all three. Two false alarms were killed by controls rather
> than filed: "21 insert commands unreachable in standard" was a builder left open by the previous
> loop iteration (**21 on a fresh page**), and "lean shows no tip at all" was `offsetParent` being
> null for a `position:fixed` element, which says nothing about visibility.
>
> **That pass also closed a gap in UXP-248's own audit.** That audit walked its surfaces in the
> default tier, where `#slash-menu` never opens — so the entire `/` and `@` menu of the standard
> tier had never been measured against the 24px floor. Re-measured with the same hit-test method:
> rows are **192x44 visual, 44px effective, 0 under the floor**. No defect was hiding in the gap,
> but the gap was real and is now closed.
>
> A fourth pass continued by defect CLASS. Two rules were triaged by measurement before picking one:
> **P3-1 accessible name** came back **0 unnamed across 25 surfaces** (the accessibility work held,
> so there was nothing to fix), while the **24px tap floor** came back with **nine shared control
> classes under it**. That became **UXP-248**, closed and archived. The floor's lack of an automated
> guard is **UXP-249**, open.
>
> **V-1 (canonical vocabulary) was audited 2026-07-26 — see UXP-251, closed, and UXP-252, open.**
> Audited statically over 1740 strings a user actually sees. The headline was a decision that had
> quietly EXPIRED: the first-run banner button kept the banned "Start a blank outline" with a comment
> citing `ux-discipline §L81` as its authority, and that line no longer exists in the standard.
>
> ## The audit-by-class program is COMPLETE (2026-07-26)
>
> Every rule in `ux-definition-of-done.md` has now been audited as a STATE of the app, not as a
> process step. Final tally: **6 rules were dirty and are fixed** (UXP-246 drafts, UXP-248 tap floor,
> UXP-250 menu teaching, UXP-251 vocabulary, UXP-253 silent failure, UXP-255 Markdown), **13 were
> clean**, and **5 gaps are filed** for an owner decision (UXP-247, 249, 252, 254 + the standing
> UXP-20).
>
> | rule | verdict |
> |---|---|
> | P1-1 no context inversion | clean — Enter is +1 point in ul/ol/todo/h1/quote; paragraph is the ONE documented exception |
> | P1-3 Esc resolves outward | clean — 15/15 |
> | P1-4 destructive keys guarded | clean — incl. the empty-with-children guard |
> | P1-5 claimable chords not the only path | clean — File menu is the twin |
> | P2-1 three doors / built != hidden | clean — 0 of 50 commands doorless, per tier |
> | P2-2 menu teaches syntax | **FIXED** (UXP-250) |
> | P3-1 accessible name | clean — 0 unnamed, 3 tiers |
> | P3-2 caret invariant | clean — 90 mousedown / 92 keydown, both alive |
> | P3-3 focus-visible + reduced motion | clean — 647 stops, 0 animating under reduce |
> | P3-4 not colour-alone | clean — a failing check is "✗check" + a full label |
> | P3-5 off-focus announced | clean — reroll, filter count, both channels |
> | P3 tap floor 24px | **FIXED** (UXP-248) |
> | P4-1/P4-2 no silent failure | **FIXED** (UXP-253) |
> | P4-3 destructive actions confirm | clean — and the count includes hidden children |
> | P4-4 one feedback pattern | clean — 0 native alert/confirm/prompt |
> | P4 drafts survive dismissal | **FIXED** (UXP-246) |
> | P5-4 inventory matches the engine | clean — every keyword form is on the §2 row |
> | V-1 canonical vocabulary | **FIXED** (UXP-251) |
> | V-2 internal identifiers intact | clean |
> | §6 sentence case · Markdown · dismiss glyph | Markdown **FIXED** (UXP-255); other two clean |
> | virtual-list per-row ARIA | clean — no global post-pass |
>
> **The method's own lesson, recorded because it cost the most time:** on interaction rules, a
> failing assertion was more often the harness than the app. Across the program the drivers produced
> at least a dozen false results — stale shared pages, an element read mid-CSS-transition,
> `offsetParent` on a `position:fixed` node, a cue read from a leftover nudge, a vacuous pass over
> zero elements, a selector blind to the very element just added, and a 4000-char slice that
> truncated the inventory row being checked. **Every reported defect in this program was re-proved
> against the real user path before it was written down**, and several candidate findings died
> there. A clean rule reported as clean is the other half of the work.
>
> **§3 remaining batch audited 2026-07-26 — all CLEAN.** P3-5 (off-focus announced): the live region
> `#a11y-live` exists; a reroll announces "2d6 re-rolled: 7" AND updates the pill's `aria-label` to
> the new value; a search filter announces "1 matching point" (the case the rule names). P3-4 (not
> colour-alone): a FAILING check renders "✗check" with `aria-label` "Check sum(cost) <= budget is
> failing" — glyph plus text, not colour. Reduced motion: under `prefers-reduced-motion: reduce`,
> **0 elements** keep a perceptible transition or animation. Virtual-list invariant: `role="tree"`,
> every row carries its own accessible text, and no global post-pass stamps ARIA over `.node-row`.
>
> **Three of that batch's first-run results were wrong and were chased down rather than filed:** the
> "reroll announces" pass was reading a leftover Welcome-tour nudge (the dice pill had not rendered
> at all, because `mkNode` alone does not promote shorthand — `promoteLoadedShorthand` does); the
> colour-alone check passed VACUOUSLY on 0 elements until a genuinely failing check was constructed,
> and its two "colour-only" hits were decorative `<i>` icons inside labelled buttons; and the one
> row "with no accessible text" was the `{2d6}` seed row, not a real row.
>
> **§6 mechanical batch audited 2026-07-26 (sentence case · "Markdown" · dismiss glyph · V-2).**
> Three clean, one dirty. **Sentence case: clean** (every Title Case hit was a sentence start or a
> proper noun — Markov, Ironsworn, Chrome/Edge). **Dismiss buttons: conformant** (the two bespoke
> `✕` are chip-REMOVES, a different concept, one carrying an explicit "one glyph per concept"
> comment). **V-2: clean** (`node.text` 314 uses, `nodeById` 143, `artifact` 107 — the internal
> identifiers are intact). **"Markdown" capitalisation: DIRTY — see UXP-255, closed.**
>
> **P1-4 (destructive keys guarded) and P4-3 (destructive actions confirm) were audited 2026-07-26
> and are CLEAN — 7/7 driven.** The dangerous shape is a COLLAPSED parent, whose children are
> off-screen, so a keystroke that takes them destroys work the user cannot see. Driven: Backspace at
> the very start of a parent with two children preserves them, collapsed and expanded; the guard the
> rule NAMES holds (an **empty** point that HAS children keeps them) without being over-broad (an
> empty, childless point is still removable); and a multi-point Delete spanning a collapsed parent is
> undoable, with undo restoring the hidden children.
>
> **The confirmation counts the hidden cost, which is the part worth recording:** deleting a
> selection of 2 visible points that spans a collapsed parent announces **"Deleted 4 points. Ctrl+Z
> to undo"** — 4, not 2. The number the user is given includes the children they could not see.
>
> **P4-1 (no silent failure) was audited 2026-07-26 — see UXP-253, closed, and UXP-254, open.**
> The app applies a KEYWORD-COMMIT doctrine (typed the keyword, body will not parse -> marked as an
> attempt with a reason). `shuffle:` and `markov:` were the only two keyword forms never given it.
> 7 of 10 rejected inputs were cued before, 9 of 10 after.
>
> **UXP-247 closed 2026-07-26 — with its target changed.** It was filed as "grow the field
> vocabulary"; research showed the leak was the dialog SHELL (22 dialogs each owned one; the
> forfeited UXP-246 fix lived in `cancel()`). Shipped `openDialogShell` + a ratchet that fails CI if
> a 23rd dialog hand-rolls its own. See the archive entry for the full reasoning.
>
> **UXP-249 closed 2026-07-26.** The tap floor now has a CI guard: a static ratchet over classes
> declaring `cursor:pointer` with no touch treatment, which may only ever decrease. It is a proxy
> (8 of 9 catch rate against UXP-248's ground truth) and its three blind spots are documented in
> `accessibility.md`, so the hit-test driver remains the measurement of record.
>
> **UXP-257 closed 2026-07-26**: the wrapped toolbar row was indented by an auto margin that only
> makes sense while the icons share a line. Pre-existing (baseline and deployed identical from 560
> down to 340), found by the owner right after UXP-256 shipped.
>
> **UXP-258 closed 2026-07-26** — and it supersedes UXP-257 rather than extending it. The owner's
> call: the toolbar is **one strip**, and the icons scroll past the search rather than starting a
> second row. Wrapping made the bar's *height* a function of the button count (44 -> 88 -> 133px as
> the viewport narrowed), which moves every surface below it; the 145px indent UXP-257 patched was a
> symptom of the wrap, so removing the wrap removed the patch. The reason wrapping was introduced in
> the first place (#827 item 14: the overflow clipped icons with no affordance) is answered directly
> instead — the strip carries an edge fade that tracks the live scroll position, and a `focusin`
> reveal, because driving it showed Chromium's focus scroll ignoring `scroll-padding-inline` and
> leaving the 8th icon 8px under the clip. **A layout driver now exists** (`ux-definition-of-done.md`
> §7) and was run against the pre-fix build first: 9 of 12 widths failed there, 0 on `HEAD`.
>
> **UXP-252 and UXP-254 closed 2026-07-26**, and a NEW defect was found and fixed in the same pass:
> **UXP-256**, the toolbar row letting the level control land on the search box. It was reported as a
> regression from recent work and is not: it accumulated one toolbar button at a time (9 -> 21px
> overlap, 10 -> 64px, 11 -> 105px) and the layout is byte-identical before and after this session's
> commits. See the archive entries.
>
> **UXP-259 closed 2026-07-26** — the first defect the layout driver found on its own, and the
> first that no human had reported. `#edit-bar` is `position:fixed` with no wrap and `.eb-btn` bottoms
> out at `min-width:38px`, a floor #437 tuned for SEVEN buttons; the bar now has nine, so below ~350px
> the tail ran off: `#eb-done` 20px past the viewport at 340 and 40px at 320, with `elementFromPoint`
> at its centre returning nothing. Done is the only labelled exit from edit mode and touch has no
> Escape key. **Pre-existing** — identical on `af0ecbf`, `c91028b` and `HEAD`. Fixed with UXP-258's
> mechanism rather than a second one: the tools moved into a shared `.scroll-strip` and the exit
> button stayed outside it, so the control you use to get out never needs a swipe. `#quick-bar` got
> the same structure preventively (6 buttons still clear 320px) because the two are declared twins.
>
> **The sweep also corrected the driver five times before any finding could be trusted** — v1 failed
> its own control at all 11 widths. Negative margins read as spill, a scroll container's overflow read
> as spill, `position:absolute` children read as overlap, focus state leaked between controls, and
> scrolled-out read as offscreen. All five, plus the control-first rule, are recorded in
> `ux-definition-of-done.md` §7. One near-miss was deliberately NOT filed: the focused search box
> covers `#level-ctl` by 117px at every width including the two bands UXP-256 never touched, so it is
> the intended overlay, not a regression.
>
> **UXP-260, UXP-261 and UXP-262 closed 2026-07-26**, from extending the layout driver to the
> surfaces nobody had listed (bases chrome, the graph/timeline overlays, the two-pane bodies).
>
> **UXP-260** — `.mt-baseheader,.mt-base-views{flex-wrap:wrap}` lived in `@media(hover:none)` with
> the comment *"collapse + Rows + four view buttons exceed a phone's width"*. A 360px **desktop**
> window has the same problem and got none of the remedy: 18px of spill at 390, 48px at 360, 88px at
> 320, with the Calendar button off the viewport and no scroll container to bring it back. The rule
> moved to the base declarations. This is deliberately **not** the UXP-258/259 "a bar must not wrap"
> case: `.mt-baseheader` is in-document content and already wrapped on touch by design.
>
> **UXP-261** — a CSS specificity collision. The `#604` narrow-sheet block sets
> `#io-card{margin-top:8px}` and sizes both wraps to `100dvh - 16px` (an 8px gutter top and bottom),
> but `#io-card.guide-open` / `.builder-open` carry `margin-top:5vh` globally and **id+class outranks
> id**. Both overlays kept a 5vh margin while sized for an 8px one, hanging `5vh - 16px` below the
> window: 16px past at 640 tall, 31px at 930, 26px at 844, 12px at 568. **20 of the guide's 83 nav
> buttons could not be brought on screen** (`#io-back` is `overflow:visible`). The builder was
> measured before being included in the fix, not assumed. Caveat: this reproduced in mouse runs;
> under Playwright's `isMobile` emulation `dvh` resolves smaller and both sheets fit, so no claim is
> made about physical phones.
>
> **UXP-262 was found incidentally and is the worst of the three.** Setting up the builder
> measurement showed that the document-derived callables ("Your names") take `desc` from the
> variable's **live value**, so `{rate := 85}` handed a Number to a text field. `escHtml` was
> `(s || '').replace(...)`, which throws on any truthy non-string — so `renderNav` threw mid-loop and
> the **All commands panel rendered completely empty**, with no error surface. That is the primary
> command door dead for any document defining a numeric variable, including every first run, since
> the welcome document defines one. Reproduced independently with `{price := 42}`: 0 of 74 commands
> before, 74 after. Fixed at the source *and* in `escHtml`, which is the shared chokepoint for every
> rendered surface.
>
> **The recurring lesson: three of these were a narrow-window fix gated on `hover:none`** (the edit
> bar's 38px floor, the base header, the sheets). The §7 driver now runs both input modes on any
> surface with a `hover:none` rule, and carries a card-fits-the-window column, because no existing
> column caught UXP-261.
>
> **As of 2026-07-26 the register holds one open item: UXP-20, the standing P5 syntax-sprawl guard,
> which is a gate rather than a defect and is meant to stay open.**
> (The `✓` entries still sitting in this file below are closed work that predates the
> move-to-archive convention being applied consistently; they are not open items. **UXP-20**, the
> standing P5 syntax-sprawl guard, is a gate rather than a bug and is meant to stay open.)

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

## Six-persona demo pass (2026-07-27) — UXP-246

### UXP-246 ✓ Every documented `/verb:value` form was dead in the DEFAULT tier 🔴 [Builder Window] (RESOLVED 2026-07-27)

**P1 (context inversion) + P4 (silent failure).** The same keystrokes did one thing in Standard and
Lean and nothing in Guided, which is the tier aimed at beginners and the default. Five of six
personas hit it; three were typing a string the app had just told them to type.

The `/verb:value` grammar (`parseSlashQuery`, `SLASH_ARG_VERBS`, and every `rawArg` arm in
`slashApply`) was already built and correct. It reached only the inline menu. In Guided, `/` matches
every command, so the builder window opened on the trigger char alone and its search box took focus:
everything typed after the slash landed there, not in the point. Two consequences.

1. `visibleCmds` substring-matched the raw text over `label + desc + _section + keys` (no `id`), so
   `prop:owner=Priya` matched nothing. **The doc examples masked this**: `/prop:owner=zeo` and
   `/due:tomorrow` appear verbatim inside their own `desc` strings, so the exact documented literal
   matched by accident while any real value failed. Anyone testing with the example would see it work.
2. `applyBuilder`'s hand-off to `slashApply` was gated on `slashState`, which the guided fork always
   nulls (`hideSlashMenu`) before opening the builder. So it never fired, and every `/` command fell
   through to `applyBlockCmd`, which has no argument concept and ends `node.type = id`.

Two further defects surfaced while fixing it, both P1, neither separately reported:

- **Enter fired the wrong command.** The list keeps pool order so section headers stay contiguous,
  and the pick was hardcoded to row 0. Typing `prop` matched `querybase`, `math` and `meter` first
  (their descriptions mention properties), so Enter applied a table builder. Now `builderBestIdx`
  ranks exact id, then id prefix, then a `keys` synonym, then a label prefix, and the ghost-text
  suggestion follows the selection rather than row 0, so it always names what Enter will do.
- **`/todo` diverged by tier.** Guided applied `state:TODO` (`#TODO`) because the checkbox command's
  label reads "To-do" and never matched the string "todo"; Standard applied the checkbox (`- [ ]`).
  Adding `id` to the haystack settles both on the checkbox.

**Fix.** `builderFilterCmds` and `builderBestIdx` extracted as pure cores (pinned DOM-free, in
`load-cores.mjs` `need`); the builder search routes through the same `parseSlashQuery` as the inline
menu; the `/` delegation is ungated and moved above the shared strip (it had been running after it,
double-stripping, despite its comment claiming otherwise); `stripLen` decouples how much text to
remove from what the query says, since in Guided only the trigger char reached the point; and
`tailInsert` carries back a non-opted-in colon tail so the §3 rule (`/quote:x` → quote, `:x` stays)
holds in both tiers.

**Verified by driving both tiers to equality**, which is the actual claim: nine forms
(`/prop:owner=Priya`, `/due:tomorrow`, `/check:sum(cost) <= budget`, `/alias:wyrm, drake`, bare
`/prop`, bare `/due`, `/todo`, `/quote:hello`, `/base:2x3`) now produce byte-identical node state in
Guided and Standard. Each new pin was watched failing against `origin/main` first.

**Not fixed here.** Escape still discards what was typed into the search box and leaves a bare `/` in
the point (#1108, separately filed).

### UXP-247 ✓ `/prop:key=value` stored the value lowercased 🟡 [Builder Window] (RESOLVED 2026-07-27)

**P1 (two doors, one capability, different data).** Filed out of UXP-246 as #1119. `/prop:owner=Priya`
stored `owner = priya`; the Properties dialog, given the same input, stored `owner = Priya`.

`parseSlashQuery` returns two fields. `query` is lowercased **because it doubles as the strip-length
token** — the invariant `query.length === raw.length` is pinned, and exists so a mixed-case value
cannot mangle the surrounding text on strip. `rawArg` is the sibling that preserves what was typed.
The `prop` arm was the only arm parsing a value out of `query`; `check`, `alias`, `template`,
`savetemplate` and `refile` already read `rawArg`, and `due`/`base` read `query` but are immune
(`tomorrow`, `3x4` carry no case). So: one call site reading the wrong one of two existing fields.

The value half was real corruption — values are stored and displayed verbatim, so the chip, an
exact-match filter and the export all carried the mangled string. The key half was cosmetic (keys are
compared case-insensitively everywhere, but `setProp` **stores** the key as typed, so the dialog
already puts mixed-case keys in documents); preserving it is parity, and it falls out of the same
change. It also repairs a round-trip the app broke against itself: `maybeNudgeField` toasts *"type
/prop:HP=12"* for a point reading `HP: 12` (`fieldNudgeKey` captures the key with `/i`), and typing
that suggestion used to yield `hp`.

**Fix.** `parsePropArg(rest)` split out as a pure core (in `load-cores.mjs` `need`); `parsePropSlash`
kept as the prefix-stripping wrapper over it so its contract and every existing pin are unchanged —
that wrapper is the refactor's control. The arm reads `parsePropArg(rawArg)`.

Deliberately **not** fixed by making `parseSlashQuery` preserve case: `query` is the strip-length
token, and that invariant is load-bearing. The call site was the right place.

**Verified by driving the two doors to equality**, which is the actual claim: `/prop:owner=Priya`,
`/prop:Owner=Priya Sharma`, `/prop:status:In Progress`, `/prop:HP=12` and
`/prop:url=https://x.com/a?b=c` produce identical `node.props` via the slash path (in **both** Guided
and Standard, confirming UXP-246 kept the tiers unified) and via `setProp` as the dialog writes it.
The URL case matters: the value carries both `:` and `=`, and `rawArg` slices at the query's first
colon while `parsePropArg` splits on the first separator, so it survives. Bare `/prop` still writes
the `{prop : }` stub. Each new pin was watched failing against `main` first.

**Noted, not fixed:** `propDeclParts` (the `{prop key: val}` brace twin) rejects reserved keys
(`due`, `check`, `aliases`, the timestamps); `parsePropArg` has no such guard, so `/prop:due=friday`
still writes an unvalidated generic prop. Pre-existing, unchanged by this work.
