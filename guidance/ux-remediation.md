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

### UXP-248 ✓ `/prop:due=friday` wrote a date nothing could read 🔴 [properties] (RESOLVED 2026-07-27)

**P4 (a write that reports success and silently destroys the meaning) + P1 (a typed door
disagreeing with the dialog it twins).** Filed as #1121 out of the UXP-247 work.

`/prop:due=friday` stored `due=friday`. Nothing parses it, so the point kept a `due` chip and
disappeared from the agenda, the week grid and every date view. It looked scheduled and was not.
The validated door refuses the same input: `/due:friday` sets nothing.

**The premise in the filed issue was wrong**, and the correction is the useful part. I reported
"two doors guard reserved keys, the slash door does not." The three doors actually hold three
different postures:

| door | posture |
|---|---|
| `{prop due: friday}` | refuses the **key** (`propDeclParts` → `null`) |
| Properties dialog | **allows** the key deliberately ("a reserved key typed into the generic editor overrides the preserved one"), then **validates the value** with `parseDueDate` |
| `/prop:key=value` | allowed the key **and** skipped the validation |

So the dialog's posture is *key allowed, value validated*, and `/prop:` is its typed twin.
Matching it, rather than adding a key guard, is the fix.

**The sharper half, not visible when the issue was filed.** `setDateProp` **resolves a relative
date at commit** (#808/UXP-202: "a deadline typed relatively never actually arrives"), and the
generic `setProp` does not. So `/prop:due=tomorrow` stored the literal string `tomorrow`, which
re-anchors every day, silently reintroducing the exact bug #808 fixed. Routing closes this too.

**Fix.** `propWriteRoute(key, val)` as a pure core (in `load-cores.mjs` `need`) returning
`'baddate'` / `'date'` / `'prop'`; the `/prop` arm routes on it. A bad date refuses in the
sentence the other three date doors already use, `'Not a valid date: ' + val + '. ' +
dateFormsHint()` (#407 P4 parity), so four doors share one voice. An empty value stays the
documented **clear**, not a bad date. `repeat` rides `setDateProp` with a phrase value and is
not date-validated, matching the dialog, whose check is `DATE_KEYS`-only. The success flash
echoes what was **stored**, so `/prop:due=tomorrow` reports the date it landed on.

The guard sits in the **arm**, not in `parsePropArg`: `parsePropSlash` is pinned to agree with
that parser, and the message needs the parsed value to echo it.

**Deliberately additive.** There are **five** near-copies of the reserved-key predicate
(`propDeclParts`, `openPropsDialog`, `nodePropVars`, `nudgeSumKey`, the chip router), and
`nudgeSumKey`'s omits `TIMESTAMP_KEYS` on purpose, so unifying them is a behaviour change rather
than a refactor. Consolidation is its own job.

**Scope: dates only** (owner decision). `check` and `aliases` keep the generic bag because an
invalid `check` already renders a visible error chip (§3, "never silently passing") and so
signals itself; a bad date is the one that disappears.

**Verified by driving**, both tiers and against the dialog: `/prop:due=friday` writes nothing and
flashes why; `/prop:due=2026-08-14` writes and the point **appears** in `collectDueDates`;
`/prop:due=tomorrow` stores `2026-07-28`, not the literal; `/prop:owner=Priya` keeps its case
(UXP-247 holds); `/prop:repeat=weekly` writes with no date error; `/prop:due=` clears; bare
`/prop` still stubs. Each new pin was watched failing against `main` first.

**Adjacent holes found while mapping, filed separately.** Query-base cells wrote dates through
`setProp` — **fixed in UXP-249 below (#1123)**. The Properties
dialog's **bulk** branch skips even the reserved merge. The paste path (`parsePropLines`) feeds
dialog rows with no key filter. And `/prop:created=2020-01-01` forges an app-maintained
timestamp that `propDeclParts` explicitly prevents.


### UXP-249 ✓ Query-base cells wrote a date the validated writer would refuse 🔴 [bases] (RESOLVED 2026-07-27)

**P4 + P1.** Filed as #1123 out of the UXP-248 mapping. `qbaseFieldWritable` excludes only `title`
and `=` formula columns, so `due` and `start` are writable cells that went straight to `setProp`.
Two defects, measured:

| written as | stored (today 2026-07-27) |
|---|---|
| `setProp(n,'due','today+7')` — what a cell did | `due=today+7` |
| `setDateProp(n,'due','today+7')` | `due=2026-08-03` |
| `setProp(n,'due','friday')` | `due=friday` |

A relative date was stored literally and **re-anchored every day** (#808/UXP-202 reproduced on a
surface it never covered: `today+7` meant Aug 3 today and Aug 4 tomorrow, so the deadline never
arrives). An unreadable value was stored raw, so the point kept a `due` chip and dropped out of
every date view, the UXP-248 harm on the one door that fix did not touch.

**Fix.** Both write sites route through `propWriteRoute` (the pure core added by UXP-248, so no new
core and no new copy). `'baddate'` refuses **before `pushUndo`** in the shared date sentence,
`'Not a valid date: ' + val + '. ' + dateFormsHint()` — now five doors, one voice. `'date'` calls
`setDateProp`. The commit handler also repaints from what was **stored**, not what was typed: after
normalization the cell would otherwise show `today+7` while the model held `2026-08-03`.

**A trap worth recording.** `setDateProp`'s guard is a bare `DATE_KEYS.has(key)` with **no**
lowercasing, and a base column's `field` preserves the user's case. So `setDateProp(src, 'Due', …)`
would skip resolution entirely and silently reintroduce the very bug being fixed. Both call sites
pass `field.trim().toLowerCase()`, matching what the `/prop:` arm already does.

**Two sites, not one.** The `focusout` commit and `mtSetCellValue` (the cell context menu) are
independent handlers; fixing one does not fix the other, and each carries its own pins. Note the
`mtSetCellValue` qbase arm is currently **unreachable from the UI** (a query base is always
`readOnly`, so `mtWireCells` never wires `showColPanel` on it) — it is fixed for consistency and
because it is pinned, not because a user can reach it today.

**Verified by driving a real query base**: `today+7` stores `2026-08-03` and the cell repaints to
the `Aug 3` chip; `friday` writes nothing, flashes the shared sentence, and leaves the cell on its
prior paint; `2026-08-14` writes and the point appears in `collectDueDates`; a non-date column is
untouched and keeps its case. Undo depth is unchanged across a refusal, and one undo still reverts
the user's real previous edit. Both pinned tests were watched failing against `main` first.

**Confirmed not a third site:** board, cards and calendar all force `readOnly || !!node.qbase`, and
that fence is itself pinned. Authored (non-query) base cells store dates as cell TEXT via
`mtCommit`, not as properties — the starters legitimately ship `today+14` in a table — so routing
that path would be a behaviour change, not a fix. Left alone deliberately.

### UXP-250 ✓ `{roll:}` drew from the host's subtree, so every shipped example was dead 🔴 [generators] (RESOLVED 2026-07-27)

**P1 + P4.** Filed as #1107 from the persona pass. `resolveBrace` scoped the draw to the host
point's descendants (`cookieNode || root`), and `queryHits` walks descendants only. A roll written
as a LEAF, which is where everyone writes it, searched an empty subtree and rendered `no match yet`.

**Eight shipped roll pills, all dead.** Driven on `main` before the change: `campaign-oracle` (3),
`reading-log`, `life-dashboard`, `worldbuilding`, `flashcards`, and the **first-run welcome tour**
all returned the empty marker. The reading-log is the proof: `{count: #toread}` sits one line above
`{roll: #toread}`, same tag, same document; count is document-wide and saw four books, roll saw none.
The insert dialog previewed the pool document-wide too ("4 matching points right now") and then
inserted a pill that found nothing.

**Why it survived.** DECISION-191b's owner sign-off was TWO-part: "subtree-by-default … **whole-doc
for free when the query names a `#tag`**". The second half was never implementable as built, because
`queryHits` matches a tag INSIDE its walk. Only the narrow half shipped; every authored example was
written against the wide one. A later fix then hardened the narrow half by citing an in-code comment
that cited itself ("only `{roll:}` is documented as subtree-scoped") — no user-facing doc ever said
it, and `ux-discipline.md` §2 calls the verb "the generative twin of `{query:}`", which is
document-wide.

**Fix.** One line: the roll branch reads `root`, like `{query:}` and `{count:}`. `cookieNode` stays
the self-exclusion, so a roll still cannot draw itself. The literal two-part decision is NOT
restored: a scope that varies with the query's CONTENT is the context inversion P1 forbids, and the
query/count comment rejects that reasoning in its own words. One verb, one scope; `folder` remains
the single opt-in widening.

**Content the widening exposed.** Four instructional lines carried a LIVE tag ("tag a book `#toread`
and the picker learns it"), so the heading joined its own pool and the roll could draw the
instruction. Reworded in the three starters and the flashcards note. Left alone deliberately: a tag
inside a pill's SOURCE (`{count: #openq}`) also matches, but ordinary search already matches those
points too — six hits for `#openq` in the first-run doc, of which four are questions. The roll pool
now equals the search result set, which is the point; the tag-in-pill-source question is pre-existing,
shared with search, and belongs in its own issue.

**Verified by driving the shipped content**, before and after: 8 empty markers becomes 8 real titles.
A new drift guard scrapes every shipped OPML block and fails if a `{roll: #tag}` has no matching tag
in its own document — the test that did not exist, which is why five starters could ship broken with
nothing red.

### UXP-251 ✓ Computed totals went stale because the repaint worklist was wiped mid-edit 🔴 [estimates] (RESOLVED 2026-07-27)

**P4.** Filed as #1109 from the persona pass, a consultant building a real costing memo. Changing an
upstream input left every downstream pill showing its previous number with nothing signalling it:
*"So it's live-on-demand, not live. In a client meeting I would not notice that, and I would quote
the old number."* They named it first among what a spreadsheet still wins on: *"recalculation I can
trust without clicking."*

**Cause.** `repaintComputedDependents` iterated `_computedNodeIds`, a Set registered in `DOC_CACHES`
— so `resetDocCaches()` cleared it. `promoteBraceBodyIn` calls `resetDocCaches()` for every
declaration it promotes, and that runs inside `exitEdit` **before** the sweep. Editing
`{rate := 45 to 75}` therefore emptied the worklist and then swept nothing. Reproduced headless: the
set went **3 → 0** across one commit, both dependents held their old values, and a full `render()`
showed the correct ones. The set was also populated only as a render side effect, so any point not
yet materialised was invisible to it regardless.

**Not a freeze problem.** The estimate family's recorded P5 sign-off — the pill freezes and
re-samples on click, like dice — is untouched and needed no narrowing. Sampling is deterministic on
`(expr, seed)` and no samples are stored, so a repaint IS a recompute from the stored seed: the
number moves because the input moved, never jitters, and still reproduces from a snapshot. The
architecture reference already called the family "Live like B1"; that claim is now true.

**Fix.** The sweep derives its worklist from the **mounted rows** (`.node-content[data-id]`), gated
on a new pure predicate `isComputedNode`. No cache reset can empty the DOM, and a row that exists is
a row that can be stale. Generative pills (dice/grammar/markov/roll) are deliberately excluded —
they freeze until clicked, and repainting them would silently change a value the user is reading.
Also wired `editEst`/`editMath`/`rerollEst` to sweep: a pill edit rewrites the sidecar record and
leaves `node.text` byte-identical (driven: true), so `exitEdit`'s `node.text !== prevText` gate can
never fire for it. That second part is defensive — no user-visible repro was demonstrated for it,
unlike the worklist wipe.

**Measured:** 1200 points, 41 mounted rows, sweep median **1.10ms**, max 2.40ms. The old set existed
to avoid "scanning every visible DOM row"; virtualization already bounds that to the viewport, and
the scan costs far less than the `innerHTML` rebuilds it gates.

### UXP-252 ✓ The "estimate, not math" refusal never named the form that works 🟡 [estimates] (RESOLVED 2026-07-27)

**P4-2 + P2-3.** Filed as #1127 out of #1109. `{= total * 1.2}`, where `total` holds a distribution,
refuses with *"an estimate like 5 to 10 (or a variable holding one), which works on its own but not
inside a math formula or check."* The refusal is correct and the reporter praised it as one that says
why. It stopped one step short: it never said the same uplift works if you **drop the `=`**. The
persona had the right model and the right tool available and still stalled.

**The capability was already shipped, and the docs denied it.** #952 widened `estParts` with
`usesDistVar`, so an expression referencing a declared distribution promotes. Verified against the
cores: `estParts('total * 1.2', vars)` is truthy, `varDeclKind('total * 1.2', vars)` is `'dist'`,
while `varDeclKind('2 * 3', vars)` correctly stays `'formula'`. But `architecture-reference.md` and
`ux-discipline.md` both still said the typed shorthand promotes "constructors only". A capability the
binding docs describe as nonexistent is one the error message cannot point at, so both are corrected
here along with the copy. The deliberate carve-out is now recorded too: a bare `{cost}` stays a
variable reference, because the operator is what promotes it.

**Fix.** One string. The `estimate` arm of `mathReasonPhrase` gains ". Write it without the = to keep
it an estimate, like {cost * 2}." That map is the single shared code→phrase source, so the sentence
reaches all four text-tolerant surfaces at once: the `#ERR` pill's title/aria, the `brace-attempt`
title/aria via `braceAttemptReason`, and the math and `/check` dialog previews. The two tight chips
(`#ERR (estimate)` and the red `estimate, not math` tag) render the CODE, not the phrase, so the loud
boundary tag is untouched and nothing clips (`.io-preview` has no nowrap/overflow and uses
min-height). `{cost * 2}` is the shape `guide/computing-numbers.md` already teaches verbatim, chosen
over interpolating the user's own expression precisely because a generic example that matches
existing teaching cannot suggest a form that fails to promote.

**Driven, and then the advice was followed:** the cue appears, and typing `{total * 1.2}` promotes to
a real estimate pill reading `≈172.4 (118.8 – 243.1)` — correct for 1.2x a 100-200 range. A cue that
is not followable is the defect, so following it is the acceptance test. Negatives unchanged:
`{= 2 * 3}` still computes, and a genuine typo still returns `bad ref` (`sawBadRef` outranks
`sawDist`).

### UXP-253 ✓ A slash in prose opened the palette and ate the paragraph 🔴 [triggers] (RESOLVED 2026-07-27)

**P4 + P1.** Filed as #1108 from the persona pass. A novelist writing *"She would ask the harbour
master / his son, whichever answered."* lost about four sentences. Her verdict: *"I will not compose
prose in a room where a slash can eat a paragraph. Scrivener is uglier and dumber and it has never
once swallowed my typing."* She was otherwise positive; this was the only reason she would not draft
in the app.

**Two independent defects, both real.**

1. **The trigger.** One permissive regex, `(^|[\s}])([/@])(\w*(?::.*)?)$` — start-of-text, ANY
   whitespace, or `}`. The prose carve-out beside it was scoped to `node.type === 'para'` and to `/`
   only, so an ordinary point, which is what a manuscript is typed into, had no protection.
2. **The capture, which was deliberate.** `verbosity = 'guided'` is the DEFAULT tier, and in Guided
   the inline popup is replaced by the modal builder ending in `searchEl.focus()`. Then
   `closeBuilderWindow` runs `ic.innerHTML = ''`, destroying the input and every character in it.
   The text never entered the document model, so **undo was structurally incapable** of recovering
   it. Reproduced: `node.text` ended at `"...harbour master /"` and the search box held
   `" his son, whichever answered."`, which Escape discarded.

**Fix.** `restoreTypedRun`, a pure DOM-free inverse of `stripTriggerRun`, plus `closeBuilder(cancelled)`
so a dismissal (Escape on any of the three panes, or the backdrop) hands the text back while an apply
does not, since an apply already spliced its own result. And a bare trigger mid-text no longer opens:
at offset 0 a lone `/` still opens on the trigger alone, which is the Guided command line and where
it is meant to be used; mid-text it takes at least one word character. That is the discipline `#`
and `:` already had, and it subsumes the `para` carve-out rather than adding a second rule beside it.

**Driven, all six paths:** the novelist's full sentence now survives with no palette; `three / four`,
`12/3` and `email me @ home` never open; `/tod` mid-line still opens; a deliberate `/` at offset 0
then Escape returns `"/zzz nonsense"`; backdrop dismiss returns `"/abc"`. Both new pins guard-proofed
by reverting each half.

**Why it shipped:** the entire close path (`closeBuilder` / `closeBuilderWindow`) had **no test at
all** - not dismissal, not Escape, not text preservation. That coverage is added here.

**Found while pinning, filed separately (#1131):** `fnBody(src, name)` does
`indexOf('function ' + name)`, which PREFIX-matches. `fnBody(_src, 'closeBuilder')` returns
**`closeBuilderWindow`'s** body, because that function is defined earlier in the file. Every pin
using a name that is a prefix of another function name has been asserting against the wrong body.

### UXP-254 ✓ The drift guards were blind over 46% of the source, silently 🔴 [tests] (RESOLVED 2026-07-27)

**Meta.** Filed as #1132 out of the guard audit the owner prompted with "our guards are as good as
the first failure, what's to say the others won't fail?" Four drift guards read a comment-stripped
view `NC`: the em-dash ban, the border-radius token guard, the font-weight guard, and the
informational-text-size floor. All four are collect-then-`assert.deepEqual(bad, [])`, so **a
shrinking input is indistinguishable from a clean codebase** and the failure is silent by
construction. The em-dash guard was written in this repo and described as comprehensive.

**Two stripper bugs, both measured.**

1. Block comments were stripped BEFORE line comments, so a `//` comment containing `` `#thread/*` ``
   opened a block comment running to the next real `*/` **1,527 lines later**, deleting **88,290
   chars**.
2. Not in the issue, and larger in bytes: the Font Awesome subset is
   `src:url("data:font/woff2;base64,…")`. Base64 uses `/`, so `//` inside it matched the line rule
   and stripped to end of line. The three longest "line comments" in the file were **108,933 /
   89,741 / 38,614 chars of font data**; quoted data URIs total **266,863 bytes**.

**Fix.** Redact quoted data URIs first, then strip LINE comments before BLOCK comments so a line
comment consumes its own `/*`. The guards recovered **50,770 chars: +71 function declarations,
+19 `flashHint` calls, +26 `aria-label`s**. Re-running all four against the corrected view found
**zero new offenders**, so nothing was hiding behind the blindness. That is luck, not vindication.

**The actual deliverable is the guard on the guard.** `stripSpans` records every removed span and a
new test asserts none exceeds **4,000 chars**, plus a floor on the retained fraction. The cap is
measured, not guessed: the largest legitimate line comment is **367** and the largest block comment
**1,342**, against runaways of 108,933 and 88,290. Three times above anything real, twenty times
below either bug, so it can neither false-fire nor miss them. **Proven by mutation:** restoring the
original strip order fails it, and removing the data-URI redaction fails it. Had this test existed,
neither bug could have shipped.

**Honest limitation, stated in the code:** this is still regex approximation, not a JS tokenizer. A
`/*` inside a string literal would still mislead it. A tokenizer was considered and rejected because
JS regex-literal disambiguation (`/["']/` looks like a string opener) would fail in the same silent
direction. The span cap is what converts an unknown future class from silent to loud.

**Pattern for #1133:** the strong guards all assert their collection is non-empty before iterating.
This adds a sibling rule for derived inputs: **assert the input has not silently shrunk.**

### UXP-255 ✓ The storage signals said "safe" while the only copy was in memory 🔴 [persistence] (RESOLVED 2026-07-27)

**P4.** Filed as #1113 after three personas reloaded and one lost his entire first pass of literature
notes while two got everything back. The issue was deliberately filed as a question, because the
conditional was unknown. It is now measured.

**The conditional, driven on a real origin.** The two-tier fallback WORKS: localStorage blocked alone
survives (OPFS covers it), OPFS blocked alone survives (localStorage covers it). **Work is lost only
when both sinks fail** - the private-window / restricted-profile case, which is exactly the
environment of the persona who lost work, since he is also the one whose browser refused the file
picker (#1112).

**A correction to the first measurement.** The initial probe ran over `file://` and reported losses
in three conditions. That was a harness artifact: `file://` is an opaque origin where OPFS does not
work at all, so localStorage was the only sink in every row. Re-run over `http://localhost`, the
table came out completely different. Worth recording, because `file://` is how a single-file offline
app is most often opened, and in that mode there is genuinely no OPFS redundancy.

**What actually lied.** `hasOPFS` is a PRESENCE check - `navigator.storage && navigator.storage.getDirectory`
- and the method exists in a private window and on `file://` where calling it throws. So in the
losing state:

1. `unsavedToDisk()` read `autosaveDisabled && !hasOPFS` and returned **false**, so the dirty dot
   stayed clean and the `beforeunload` guard never prompted. Both of the app's trust signals said the
   work was safe.
2. The warning said *"This document is **too large** for browser auto-backup"* when the real cause
   was storage being blocked. A user with twenty notes reads that as irrelevant and dismisses it. The
   catch was `catch(e)` on any error and never inspected `e`.

**Fix.** A pure `storageAdvice(...)` core decides which warning applies and whether a durable copy
exists, and `opfsOk` learns capability from a failed WRITE rather than inferring it from an API name.
A `QuotaExceededError` keeps the size wording; anything else names blocked storage. Every consumer
(`unsavedToDisk`, `scheduleAutosave`, both banners) reads capability now.

**A false alarm I introduced and removed:** clearing `opfsOk` in the READ path too. A first boot has
no `autosave.json`, `getFileHandle` throws `NotFoundError`, and every fresh start then reported
"unsaved". Caught by re-running the probe, not by the suite. The write path is the honest test.

**Driven, after:** every row's signals now match reality. Lost work reports `unsavedToDisk=true` and
says "blocking storage"; both surviving fallback rows stay quiet. Three mutations guard-proofed:
reverting `unsavedToDisk` to presence, reverting the message to the size wording, and re-introducing
the read-path false alarm each fail a pin.

**Not addressed here (real, separate):** the boot restore path swallows a failed read identically to
"no autosave" and falls through to the welcome document, and `reconcileOpfsOnBoot`'s
`userTypedSinceBoot` is a one-way trapdoor. Both are filed rather than bundled.

### UXP-256 ✓ A refused file picker was read as a user cancelling, so Save did nothing and said nothing 🔴 [files] (RESOLVED 2026-07-28)

**P4.** Filed as #1112. *"Save, Save as, and Connect a folder did nothing at all for me. Those need
the file picker, which my browser wouldn't grant, and the app said nothing about it."* The persona
never connected a folder and could not evaluate the multi-document workspace at all. He is the same
user whose session did not survive a reload (UXP-255 / #1113) - one restricted environment, two
storage failures.

Third instance of one root cause: **capability inferred from the presence of an API name.**
`hasOPFS` was fixed in #1135; `hasFSA` and `hasWorkspace` are the same shape.

**The fallback already existed and was never reached.** `saveFile()` is
`if (hasFSA) { … } else dlOpml()`. Firefox and Safari have no `showOpenFilePicker`, take the `else`,
and save fine by download. The bug is exclusively presence-but-refused: `hasFSA === true`, the picker
throws, and the working download three lines away is unreachable because the branch is chosen by
presence.

**Measured, not assumed.** In Chromium a refused `showSaveFilePicker` rejects with **`AbortError` in
1ms**, message "The user aborted a request", when no user aborted anything. Other refusals arrive as
`NotAllowedError`, which the existing catches already reported. **So only the AbortError path was
silent** - the issue's framing that all three commands were silent was not accurate, and the
measurement narrowed it.

**Fix.** A pure `pickerOutcome({ errName, elapsedMs })` tells a refusal from a cancel: anything that
is not `AbortError` is a refusal, and an `AbortError` faster than a human could dismiss a dialog
(250ms, 250x above the measured 1ms) is a refusal too. **Stated in the code as a heuristic, not as
certainty** - the asymmetry justifies it, since a false "refused" costs a visible message plus a
download that works, while a false "cancelled" is the silence being fixed. `fsaOk` learns capability
on a refusal, mirroring `opfsOk`. Save then falls back to `dlOpml()` and says why; Open and Connect
name the cause and the way out.

**Found while mapping, fixed here:** `reconnectWorkspace` had a bare `catch (_) {}` swallowing every
error AND no branch at all for a denied permission, so "Reconnect folder" could be clicked forever
with no response. `reopenPendingFile`, its single-file twin, already did it correctly; this copies it.

**Driven, before and after.** Before: `saveAsFile()` silent, the others echoing a raw DOMException.
After: every entry point names the cause, and Save **actually downloads** rather than only
apologising. Three mutations guard-proofed - and the first mutation initially reported "0 failing"
because a shell-escaping bug meant it never applied. The harness now asserts the target was found
before trusting the result, which is the same vacuity class this register keeps recording.

### UXP-257 ✓ An estimate rendered `7.00e+5`, which cannot go in front of a client 🟡 [estimates] (RESOLVED 2026-07-28)

**P4 + P2.** Filed as #1115. The consulting persona named exactly two things standing between the app
and replacing his spreadsheet: *"Fix the stale downstream totals and give me £ and thousands, and this
replaces the spreadsheet for every memo I write."* UXP-251 fixed the first; this is the second.
Everything upstream had already won him over, on the uncertainty model itself: *"That is the correct
answer and almost nobody ships it."*

**Both a coverage gap and a discoverability gap, in different places.**

*Coverage.* `estNumFmt` was a standalone formatter taking one argument. It switched to
`toPrecision(3)` at `|x| >= 100000` and never grouped thousands, so one headline could read
`86500 (67150 – 1.06e+5)` - two ungrouped numbers and a scientific one, in the same line. The rest of
the app already had this right: `formatNumDisplay(700000, null)` is `700,000` with **no configuration
at all**. The estimate family was the one number sink that never consulted it.

*Discoverability.* He searched the catalogue for "format" and got no matches. That was **correct
behaviour** - there is no standalone format command, because the format is a property of a pill. The
fix is not a new command; it is making the two pills that own one answer to the word people type.

**Fix.** `estNumFmt(x, fmt)` routes through the shared `formatNumDisplay` and accepts the same
`{decimals, prefix, suffix}` record `parseNumFmt` already produces - currency is a prefix, percent is
a suffix, no second format model invented. The estimate dialog gains the same three fields the math
dialog has. `distHeadline(sm, fmt)` collapses eight hand-built `mean (p5 – p95)` strings into one, so
the format threads once rather than eight times. `format`/`currency`/`decimals`/`thousands`/`percent`
join the `est` and `math` command keys.

**Two things caught by re-measuring rather than by the suite:**
1. Routing the *default* through `formatNumDisplay`'s decimals path lost the trailing-zero trim, so
   `5 (4.1 – 5.9)` became `5.00 (4.10 – 5.90)`. The old `String(+x.toFixed(2))` was doing real work.
2. The export still dropped the format, so a memo showed `£702,141` in the pill and `702,141` in the
   exported copy - one value, two displays, which is the bug this change exists to remove.

**Driven:** pill, aria-label, export and OPML round-trip all agree, with and without a format. Four
mutations guard-proofed, each with its target asserted present first, after a shell-escaping bug in
the #1112 harness silently made one mutation a no-op.

**Not addressed:** `chanceunder(...)` still renders a bare `4.7`. It is a *math* pill, so a `%`
suffix is settable today and now findable - but nothing makes it the default. The reducers do return
a percentage by contract, so a default is defensible; it also changes existing documents. Filed
rather than decided here.

---

## UXP-258 - a graph label kept the sentence and deleted the names (#1110)

**Principle:** P1 (predictable - one point, one name), P4 (the most connected point was the least
readable), P3 (the accessible name was a truncation of a truncation).

**Reported by two personas with nothing in common**, both in their top three findings.

| the point's text | the label it produced |
|---|---|
| `[[#maren\|]] and [[#josse\|]]: not speaking since March` | `and : not speaking since Ma…` |
| `[[#halv\|]] buried the father of [[#maren\|]] and got nothing for it` | `buried the father of and go…` |
| `The honest read: [[#hag\|]] does not refute [[#baum\|]], it bounds it` | `The honest read: does not r…` |
| `[[#a\|]] [[#b\|]]` (a pure junction point) | `(untitled)` |

> *"The names had been surgically removed from the labels. As a picture of who knows whom it told me
> nothing."*
>
> *"The node that connects everything is the one you can't read."*

**Cause, and it was argued for in a comment.** `graphNodeLabel` collapsed a link to its caption and
DELETED it when there was none, on the reasoning that expanding a mirror is *"noise on a graph label
- 'The Prior' would read 'The Prior Torn Letter'"*. The worry was real; the cure was worse. The
outline resolves the same tokens, so the graph and the document disagreed about what a point is
called, and the disagreement was worst exactly where a graph earns its place. Nine other surfaces
(breadcrumbs, backlink rows, the refile/capture pickers, the link picker, unlinked-reference rows)
already resolve through `linkText`; `graphNodeLabel` and the corkboard's injected `titleOf` were the
only two that opted out and hand-rolled a strip.

**The repo had already seen it.** `brokenNodeMessage`'s comment recorded *"the dangling 'and' is the
hole the removed token left"* and answered it by truncating harder.

**Fix.** `graphNodeLabel(firstLine, resolveLink)` takes an optional resolver - the same injection
seam `graphModel` already uses for `titleOf`, so the core stays a pure string-to-string function
callable from Node while resolution (which needs `nodeById` / `workspaceIndex`) lives at the call
site. Caption wins, then the target's live title, then nothing. Nothing, not a bare id: an
unresolvable target already gets its own red node, so an id on the label would be noise on top of a
signal that exists.

**Recursion is prevented by construction, not by a counter.** The resolver resolves by calling
`graphNodeLabel` *without* a resolver, so a link inside a resolved title cannot re-enter. That is
`linkText`'s `depth > 0` rule, enforced structurally. Driven: `links [[#b]]` where `b` is
`[[#a]] and the fence` renders `links and the fence` - exactly one level.

**Three call sites**, all with the same shape: the document scope, the Nearby scope (anchored on the
*foreign* document, since a bare `[[#id]]` in a foreign title is same-document to that document),
and Cards, which shared the graph's label builder and therefore shared its bug.

**Also fixed, one variable:** the node's accessible name was built from the already-truncated visible
label. The 28-character ellipsis is a canvas constraint; the tooltip and the accessible name now
carry the whole title.

**The budget was left at 28, deliberately.** `Maren Oskarsdottir and Joss…` carries the names, which
is the whole complaint, and the full sentence is one hover or one screen-reader stop away. Widening
it would also mean moving `BROKEN_NAME_MAX`, which is pinned byte-identical to it.

**Driven, before and after, on both surfaces**, reproducing all three quoted strings verbatim on
`main` first. Six mutations guard-proofed, each with its target asserted present before the result
was trusted. Perf: the label half costs **1.59 ms across 400 nodes** (2.17 vs 0.58 for twenty
rebuilds), against a ~750 ms force-directed layout.

**Two existing pins re-anchored, not deleted.** The `graphNodeLabel` pin was *named* for the old
behaviour (`"link tokens collapsed not expanded"`) and now records the reversal and why. The `#898`
tooltip pin keeps its intent (the doc hint rides the tooltip rather than eating the canvas label);
only what the tooltip carries moved.

**A third pin was found brittle and fixed while passing through:** the `#898` scope-wiring pin sliced
`renderGraph` by a **byte offset** (`+ 4200`), so adding lines above the model selection slid its last
assertion out of the window and turned it red for a reason unrelated to what it guards. Anchored on
the function's own end now.

**Filed, not bundled:**
- **Layout** (#1110's adjacent note - 7 nodes in a corner, 5 on a perfect diagonal). Traced to
  `clampPositions`, which rescales X and Y by *independent* factors despite a comment claiming a
  shape-preserving fit. Different root cause, different region, collides with the layout determinism
  and `relaxSeparation` pins.
- **Other raw leaks in the same labels**: `[[est:key]]` and other artifact pills, live `{= sum(cost)}`
  recipes, `#hashtags` (the #943 leak, unpatched here) and `[^footnote]` refs all still reach the
  canvas as raw source.

**Preserved on purpose:** the dotted unlinked-mention edge, which the same researcher called *"the
single best idea in here"*. Verified still present.

---

## UXP-259 - Markdown export dissolved the link layer, and the lossless format was the unguessable one (#1111)

**Principle:** P4 (an export that silently drops a layer, and raw syntax reaching a reader), P2 (the
format that keeps everything was the one nobody would guess), P1 (a link means the same thing in a
file as on screen).

**Reported by a PKM persona with a six-year Obsidian vault** who has migrated twice and been burned.
He did not trust the toast: he intercepted the downloads and opened the bytes.

> *"I'd have shipped that .md to a colleague thinking my link graph was in it."*

The menu said *"one-way snapshot"*, which he read as *"you cannot edit it and sync back"*, not as
*"your links are gone."* Meanwhile two personas with opposite use cases independently found the HTML
export and called it the door they wanted: *"So the exit works, through the format nobody would guess
is the lossless one."*

**This is an identity clause, not only a copy gap.** `product-identity.md` §3b guarantees freedom to
leave - a user *"leaves the app entirely and continues another way, taking everything with them
(plain text, OPML, **markdown**, a self-contained runnable HTML)."* Markdown is named as one of the
four exits and it did not take everything.

### Measured before designing, and one measurement thrown away

Calling the pure cores directly reported `[[#maren|]]` exporting as the bare id `maren`. **That was a
harness artifact**, the same class as the `file://` OPFS mistake in UXP-255: `linkText` resolves
through `nodeById`, and the Node realm has no built index, so it fell to its `return id` arm. Re-run
in a browser it resolves to the title. No decision here rests on that line.

Two findings from the same probe were real and are **not in the issue**:

- **Four sinks leaked a RAW token** into both text exports - the divider label, the note, the
  property line and the footnote definition all bypassed the link chain, so a link written in any of
  them shipped as a literal `[[#maren|]]`. That is the raw-syntax-reaches-a-reader failure UXP-237
  removed for footnote markers, still live in four other sinks of the same two functions.
- **The cross-doc form discarded its docId**, so which document a reference pointed at was
  unrecoverable from the file.

### Fix

**`linkText(str, depth, emit)`.** `emit(text, docId, id)` decides what a resolved token becomes; the
default returns the text alone and is byte-identical for all nine on-screen callers. Injected rather
than forked, so every resolution rule (caption, depth, same-doc, cross-doc, unresolvable) stays in
one place - the same seam #1110 used for graph labels, deliberately.

**The form was chosen by measurement, not preference.** Through markdown-it (CommonMark), the same
instrument UXP-237 used:

| form | renders as |
|---|---|
| `[Caption](#id)` | `<a href="#hag">Hagger 2016</a>` |
| `[[Caption]]` | `[[Hagger 2016]]` - literal bracket junk |

The wikilink form is what the reporter's own vault speaks, but a prose export exists to read well to
someone who does **not** have Pointliner, and junk-in-every-strict-renderer is the exact failure
UXP-237 removed. Cross-doc keeps its document: `[Voss](notes.md#n7)`.

**The bracket escape is load-bearing, and that is measured too.** Unescaped, an unbalanced `]`
collapses the link to literal text and an unbalanced `[` **mangles the link text**, silently
attributing the wrong words to the anchor.

**Plain text has no link form and never will**, so it keeps the prose resolution and *reports*:

> `Exported a copy: "outline.txt". 2 links flattened to plain words. Export Markdown or Web page to keep them.`

The message names a way out, not only a loss. `countExportLinks` uses **`WLINK_RE`, not `LINK_RE`** -
`collectLinks` uses the latter, which is same-doc only, so a counter built on it would silently
under-report the cross-doc links a workspace user most cares about, in the very function that exists
to stop under-reporting. It copies `countUnwrittenFnRefs`' `noexport` skip.

**The three menu rows now say what each format keeps**, not only how it works, and the guide entry
names the safe default ("If you are not sure which to send, send the Web page").

### Two of my own pins were vacuous, and the mutation harness is what found them

Ten mutations, each asserting its target was present before the result was trusted. **Two initially
reported `0 failing`**, both the same class: the pure core was pinned and the call site that uses it
was not. Discarding the docId again, and making the plain-text door silent again, both left
`mdLinkOut` and `exportedNote` perfectly tested and perfectly ignorant of whether anything called
them correctly. Fixed by pinning the wiring; all ten bite now.

**The existing `#806` pin would have gone green through the reversal.** Its whole contract was
`!md.includes('[[#')`, which is still true of `[My Label](#qqq1)`. Rewritten, not extended.

**`exportedNote` was never in `load-cores.mjs`** - the UXP-237 *message builder*, the sentence CI
shows a user, had no test at all. Added in the same change that gives it a second arm.

**Filed, not bundled:** a caption-less `[[#id|]]` alone on a line transcludes the target's whole
subtree on screen (`mirrorSubtreeRows`, capped at 40 rows) and exports as **one line of title**. That
is content loss rather than link-layer loss, and whether an export should inline a transclusion is a
content decision about someone else's file - the shape UXP-237 refused to settle in passing.

---

## UXP-260 - a pin that cannot fail is not a pin (#1133)

**Principle:** the owner's standing challenge - *"Our guards are as good as the first failure, what's
to say the others won't fail?"* #1129 answered it for commit hygiene, #1132 for the drift guards.
This is the audit of `tests/test.mjs` itself.

**Confirmed by recurrence, not by argument.** The mutation harness caught vacuous pins of mine in
three consecutive PRs:

| PR | the pin that could not fail |
|---|---|
| #1134 | the em-dash guard's `NC` input had silently shrunk by 46% |
| #1141 | a `#898` pin sliced `renderGraph` by a **byte offset** (`+ 4200`); adding lines slid its last assertion out of the window |
| #1143 | **twice** - `mdLinkOut` and `exportedNote` were pinned perfectly and pinned nothing about whether anything *called* them |

**The house rule already existed in writing**, in `concept-guide.md` on the `#596` guard: *"each
asserts it found a non-empty registry block and a non-empty covers set, so a renamed/moved const
fails loudly instead of letting the guard pass vacuously."* It was applied unevenly.

### The insight: four of the five classes were one bug

Not fifteen weak guards. **Helpers that degraded silently instead of throwing.**

| helper | how it degraded | fix |
|---|---|---|
| `fnBody` | `indexOf('function ' + name)` - a PREFIX match | exact `function name(` |
| `fnBody` | returned `''` on a miss, so every negative assertion passed forever | **throws** |
| hand-rolled `slice(indexOf(A), indexOf(B))` | missing marker -> `-1` -> `slice(i, -1)` is the **rest of the file**: the haystack goes UNIVERSAL, not empty | `between(...)`, throws |
| hand-rolled `slice(indexOf(A), indexOf(A) + N)` | a fixed byte window slides out of range | `fnBody`, or `windowAfter(...)`, throws |

### Measured on current main, before deciding

| | |
|---|---|
| `fnBody` call sites / distinct names | **275 / 202** |
| names that are a prefix of another (`collectDueDates`, `renderAgenda`) | **2** |
| names resolving to the wrong body **today** | **0** |
| names with no `function NAME(` at all | **0** |
| **tests turned red by making `fnBody` exact AND throwing** | **0** |
| hand-rolled marker slices migrated to `between` | **53** |
| byte windows: to `fnBody` / to `windowAfter` | **13 / 10** |

So the highest-leverage fix in the whole issue cost **zero red**. The protection is latent: it
guards the next rename, not a present break.

**This corrects the issue's own §1 claim** that pins "have been asserting against the wrong body."
That was an inference from one observed case. Measured: 0. The flaw is a **latent trap**, real and
reproducible, but not an active correctness problem - and the issue comment already said so.

### The class no helper can reach

`nonEmpty(coll, label)` throws on an empty collection and returns it otherwise, so applying the rule
is one word. Applied to the guards #1133 named by hand (the em-dash guard's GUIDE slice, the three
`BRACE_FORMS` loops, both `#952` cycle `.every(Number.isNaN)` pins, and the `sampleUncertain` case
whose variable is literally named `empty`).

For the rest, a **census** reads `tests/test.mjs` itself and counts tests that iterate or `.every()`
over a collection whose size is never asserted. Floor frozen at **49**, down from 56.

**Stated in the code as a limitation rather than implied away** (the #1132 precedent): the census
DETECTS, it does not PROVE. It is a ratchet with an allow-count, the same shape #1133 criticises in
the `FA_GLYPHS` guard, and the only honest difference is that the number may fall and cannot rise
without a visible diff line.

### Guard-proofing found four of my own mutations to be mis-designed

Eight mutations, each asserting its target present first. **Four initially reported `0 failing`:**

- two because the protections are **latent** (nothing calls `fnBody`'s failure paths), which was
  honest and is now covered by direct tests of the helpers - *a helper with no test of its own is
  exactly the habit under audit*;
- two because **the mutation was wrong**: removing a throw *and* emptying the input proves the
  vacuity, not the guard. Corrected to keep the throw and empty the input.

One survived even then: reverting `fnBody` to prefix matching failed nothing, because both real
prefix pairs resolve correctly today **by declaration order**. The contract is now tested on a
crafted source where the longer name is declared first - the arrangement one file reorder away. All
eight bite.

**A process note worth recording:** piping the mutation script through `head` closed the pipe,
killed it on SIGPIPE before its restore step, and left `tests/test.mjs` mutated with 14 tests red.
Caught immediately, restored from the backup the script takes first. Never pipe a mutation harness
into a truncating command.

**Filed, not bundled:** #1133 §4, guards that validate against a set the guarded change also edits -
the `FA_GLYPHS` icon census (nothing verifies the subset was rebuilt), the GUIDE-id harvest (accepts
any `id:'...'` anywhere in the file), and the hardcoded `BLOCK_CMDS` duplicate that `#596` already
does properly. A different class: about *what* is compared, not *whether it ran*.

---

## UXP-261 - a shipped capability with no door at the point of use reads as an absent one (#1116)

**Principle:** P2 (a capability whose only door is on a different element is not discoverable), with
a P1 constraint that shaped the whole answer.

**Reported by the novelist persona.** Drafting prose, she wrote
`{Bight Street | Cross Lane | Anchor Walk}` in a sentence. Clicking it - the same gesture as placing
a cursor - re-rolled it.

> *"Clicking it once, the way you click to place a cursor, silently changed Bight Street to Cross
> Lane to Anchor Walk. I couldn't find any way to say 'yes, that one, now be words.'"*

**The issue's premise was wrong, and checking it first changed the whole change.** #1116 says *"There
is no promote-to-text path."* `freezePillToText` has existed since **UXP-137**: it splices the shown
text into `node.text`, `pruneArtifacts` drops the orphaned sidecar, and `pushUndo` makes it
reversible. It does exactly what she asked for.

**Her experience was still entirely right, and the real defect is sharper.** `collectPillActions` was
surfaced in exactly two places - the ROW's bullet menu and a base-cell menu. **Neither is the pill.**
A pill in running prose has no affordance of its own at all: click re-rolls, the pencil edits, and
that is the whole surface. Her own sentence is literally true - *"the only affordance on the pill
destroys the result she was trying to keep"* - while the remedy sat three steps away, on a different
element.

### Two constraints ruled out both obvious answers

- **The click could not change.** *"A generative pill changes on click"* is a recorded P1 sign-off,
  made separately for dice, clocks and estimates. Re-mapping it fixes one case by breaking the family.
- **No visible control could be added.** #925 item 6 is the SAME persona, saying prose pills already
  read as *"a boxed capsule with a shuffle icon... reads noisy."*

So: a **context menu**, which adds no weight and changes no gesture. One `contextmenu` listener
covers mouse right-click **and** touch long-press (Chromium fires it at its own long-press threshold,
which the base column menu already relies on). Pills stay `tabindex="-1"` - a #701 pin keeps them out
of the Tab order deliberately - so the keyboard door remains the point's own `Shift+F10`, which
already lists these rows.

The menu is **scoped to the pill under the pointer** (`collectPillActions` already took a scope
string for the base cell), and drops point-level chrome - the heading type-switcher and the "More
actions" expander - so a right-click yields the three rows the user came for, not a wall. Its rows
also survive the Lean filter, where the Pills section is otherwise hidden entirely.

### Two divergences inside the action itself, both found by driving it

A prominent door onto a subtly wrong action is worse than no door, so both were fixed here:

| | the pill showed | the freeze wrote |
|---|---|---|
| a name declared twice (`{n := 10}` above, `{n := 99}` below) | `n * 2=20` | **`198`** |
| a dice pill on a `para` point | export writes `3` | **`2d6 = 3`** |

The first is the one-value-two-displays bug UXP-257 removed from the estimate export, alive here:
pills render from the POSITIONAL var map (`#767` `renderPosVarMaps`) and the freeze read the
document-wide `collectVars()`. Now `varMapAt(node)`, plus the prose flag so freeze and export agree.

### The guards, and two of them re-anchored

Nine mutations, each asserting its target present first; all nine bite, including the one that would
make this worse than the bug (a plain click committing instead of re-rolling).

**Three existing pins broke on SPELLING rather than behaviour** - `collectPillActions(node)` and
`if (!isBase && !leanCollapsed)` were matched as literal strings and each grew an argument. Both
re-anchored on the property, both intents unchanged. Worth recording against UXP-260: making the
helpers throw closed the vacuity classes, but *"a pin matched a literal that later grew a term"* is a
different, still-live class, and it cost three fixes in one change.

**The #1133 census caught this PR, correctly and then incorrectly.** It flagged a new unsized
iteration - which turned out to be `between(_src, 'for (const p of REROLL_PILLS) {', …)`, a source
snippet passed as a MARKER STRING. The census was scanning quoted text as code. Fixed by stripping
string literals before the scan, which is strictly more correct and is not the JS tokenizer #1133
declined to write. The floor stayed at 49, so nothing else was being miscounted.

**Filed, not fixed:** freezing a `{name := a|b|c}` DECLARATION pill removes the name from
`collectVars`, so every downstream display-only `[[var:KEY]]` reference resolves to `?`. That cliff
exists today in the bullet menu and is not introduced here, but a more reachable door makes it easier
to fall off.

---

## UXP-262 - the Board's dead end told a user to do what he had already done (#1114)

**Principle:** P4 (a refusal that repeats an instruction the user believes they followed teaches
nothing), P1 (`/TODO` meant something different from its three siblings), P2 (the dimmed tooltip
never named its own door).

**Reported by the delivery-lead persona**, rebuilding a real week of Linear/Jira work. He got almost
everything - `due: 3d overdue` in red, `owner: Priya`, a twelve-row live query base, an agenda week
grid parking slipped items under "Earlier" - and called that table *"the artifact I'd actually stand
up in Monday triage."* Board was the one door that stayed shut, greyed, saying *"Mark a column as
Status to use Board"* while he had a column named Status.

### The premise failed three ways, and checking it first is what made the change small

| the issue says | measured |
|---|---|
| there is no way to get a first-class status | **three doors exist**: Column menu → Show as → Status, `Alt+R`, and auto-inference (#922) |
| the only typed door is `/TODO`, which the palette eats | **true, and exactly one command wide** - `/NEXT`, `/WAITING`, `/DONE` all landed correctly |
| the agenda's "RUNNING, Nothing running" is the same disconnect | **wrong.** RUNNING means *a `start:` date that has arrived*. It has never involved status |

**The actual root cause was two lines in `inferColRolesFromModel`:** the loop starts at `r = 1`, so
the header row is never read and naming a column "Status" is inert; and every non-empty cell must be
a known state, so `in progress` fails. He did a reasonable thing twice and the app told him to do the
thing he thought he had done.

### What the fence allows, and what it recommends

`base-views-vision.md` §0.5 names this request exactly and binds it: a status role that *constrains
the editor* IS the `bases-direction.md` §4 typed-fields deferral, and *"building anything in the
deferred list requires reopening this doc and moving it above the line first."* **Owner's call taken:
stay inside the line.** No constrained value set, no validation.

The doc also names the way through, and it turned out to be one character class wide. A sequence must
declare `IN_PROGRESS` because a state keyword cannot hold a space (`LEAD_WORD_RE` stops at the first
one). A base cell is free text, where the natural thing to type is `in progress`. The role inference
**already folded case** - so space-versus-underscore was the entire distance between his document and
a working Board.

`normStateKey` folds `_`, `-` and space to one space, for **matching only**. A value matching nothing
still falls through to plain text, so the §0.5 fence is untouched. Deliberately conservative and
pinned as such: it folds separators, it does not delete them, so `in progress` answers to
`IN_PROGRESS` while `to do` still does not answer to `TODO`.

**Applied at all three match sites**, which is the part that matters: the role inference,
`sequenceForKeyword`, and `boardLanes`' bucketing. Fixing only the first would light Board up and
then drop every card into the trailing "No state" lane - a view that looks right and is not, which is
worse than the honest refusal it replaced.

**Acceptance, driven:** his ORIGINAL lowercase cells, plus one declared sequence -
`inferColRoles` returns `status`, Board opens, and **3 of 3 cards land in real lanes**.

### Also

- **`boardBlockReason`**, a pure core, replaces one message covering three situations: nothing looks
  like a status column; a column *named* Status is not marked as one; or it is filled with values
  that are not states of any sequence. The third names the values it could not place and the fix.
- **`/TODO` selects the state.** `blockCmdsPool()` splices `BLOCK_CMDS` first and the checkbox
  command's id is literally `todo`, so it won at index 0. The checkbox stays one word away
  (`/task`, `/tick`, and the next row). There was **no test at all** on this ranking.
- **The tooltip names its door.** The flash on click already said "(Column menu, Show as)"; the
  dimmed button - read first, and often the only thing read - did not.

### The guards, and the same lesson a third time

Eleven mutations, each asserting its target present first. **Two initially reported `0 failing`:**

1. A pin of mine **re-implemented the slash ranking** instead of calling it, so reverting the fix
   proved nothing. Fixed by extracting `slashActiveIdx` as a pure core and calling it.
2. Then replacing that call with a literal `0` **still** failed nothing - the core was perfectly
   tested and perfectly ignorant of whether anything called it.

That is UXP-260's rule - *pin the call site, not only the core* - broken for the **third time this
session**, in the change that follows the one that wrote it down. The rule is in the DoD; the habit
is what is still lagging, and it is worth saying so rather than reporting eleven green mutations.

**The #1133 census also caught a real unsized `.some()` in a new test of mine** (its first true
positive since the string-literal narrowing) and it was fixed rather than the floor raised.

**Filed, not fixed:** the constrained-value-set half, with the §0.5 analysis; and the agenda's
RUNNING label, which is correct but reads like a status word.

---

## UXP-263 - the graph fit destroyed the shape it claimed to preserve (#1139)

**Principle:** P4 (a view that misrepresents its own data), and a comment that asserted the opposite
of what the code did.

**Two personas, same pass, one transform:**

> the researcher's 7-point graph *"dumped everything into one corner with two nodes stranded at the
> bottom"*
>
> the novelist's 5 nodes were *"strung along a perfect diagonal from corner to corner"*, with edges
> she could barely see

`clampPositions` divided `spanX` and `spanY` **separately**, so the two axes were stretched by
different factors - directly under a comment reading *"preserving the layout's shape (a uniform-per-
axis fit)."*

**Measured, on the pure core:** three points 200 wide and 40 tall - a 5:1 near-horizontal run - came
out 720 x 520, a **1.38:1 corner-to-corner diagonal**. And because `min` mapped to `margin` and `max`
to `dim - margin` on both axes, a node was **guaranteed on all four edges**, which is the researcher's
report exactly: one outlier pair defined the bounding box and the main component was squeezed into
what was left.

| | before | after |
|---|---|---|
| researcher, 7 nodes: nodes pinned to an edge | **4 of 7** | **2 of 7** |
| researcher, 7 nodes: short axis filled | **100%** | **31.6%** |
| a 5:1 input's aspect after fitting | **1.38:1** | **5:1** |

**Fix:** one `Math.min(iw/spanX, ih/spanY)` scale, then centre. Three mutations guard-proofed. All
four existing `graphLayout` pins are property-based (determinism, in-box, single/empty, spring), so
none needed rewriting - the in-box pin still holds because centring keeps everything inside.

### The half this does NOT fix, stated rather than implied

**The novelist's chain is still a line spanning the canvas**, and the fix barely moved it: `r^2` stays
at 1.000. Uniform scaling of a line is still a line. Her case has a **second, separate mechanism**,
measured while here:

```
k = sqrt(area / n) * 0.75          the Fruchterman-Reingold ideal edge length
  n=5  -> 232px      n=7  -> 196px      n=20 -> 116px      n=40 -> 82px
```

At n=5 on an 800x600 canvas the ideal edge length is **232px**, so a four-edge chain wants 928px of
run and cannot fit - the simulation stretches it across the canvas before any clamping, and long thin
edges are exactly *"edges I could barely see"*. There is no small-N branch between `nodes.length === 1`
and the general case.

**Not fixed here on purpose.** Capping `k` is a tuning decision needing an arbitrary constant, it
changes every layout rather than correcting a transform that was demonstrably wrong, and this session
has spent a lot of effort removing unjustified magic numbers. Filed with the measurement so the next
person starts from a number rather than a hunch.

---

## UXP-264 - the graph and Cards drew source where the outline drew values (#1140)

**Principle:** P1 (a point had two names, one on screen and one on the canvas), P4 (raw syntax
reaching a reader, the rule UXP-237 set for exports).

**Found while mapping #1110**, not persona-reported. #1110 fixed the LINK half of `graphNodeLabel`;
this is every other token class the same chain never handled. Driven on `main`, comparing each label
against what the point actually reads as:

| the point reads as | the canvas drew |
|---|---|
| `Session cost 2d6 = 7` | `Session cost [[dice:r0xp9ugu]]` |
| `Budget 600 to 900 ≈ 738.5 …` | `Budget [[est:u6cui6fn]]` |
| `Total 0` | `Total [[math:x1iuduzk]]` |
| `A highlighted claim and text (http://x)` | `A ==highlighted== claim and [text](http://x)` |
| `Hagger 2016` (marker rendered) | `Hagger 2016[^k]` |
| `Atomic notes` (tag as a chip) | `Atomic notes #zettelkasten/principle` |

The cause is one line: the link rule requires a `#`, so a colon-form artifact token
(`[[est:key]]`) matched nothing and passed through untouched.

### Fix

**The same injection seam #1110 used.** `graphNodeLabel(firstLine, resolveLink, resolveArtifact)` -
`flattenArtifacts` needs a varMap, so it is supplied at the call site and the core stays a pure
string function callable from Node. Both the graph (all three scopes) and Cards pass one.

**It reads `varMapAt(node)`, the POSITIONAL map (#767)** - the same one the render uses - so a label
agrees with the point beside it rather than with a document-wide resolution. That is the bug UXP-257
removed from the estimate export and UXP-261 removed from the pill freeze; this is the third surface
of the same family and it was fixed by choosing the right map from the start rather than after a
persona hit it.

**Three inline forms added to the chain**, plus footnote markers and (per #943) hashtags - the graph
and Cards being the two caption sinks that never got that strip.

### A simplification deliberately NOT made, and pinned

`stripInlineMd` looks like it should replace the hand-rolled chain. **Measured, the two are
complementary and neither contains the other:** `stripInlineMd` leaves `___Ancient One___` as
`_Ancient One_` (it has no single-underscore rule), while the label chain handles it via the #635
fix; and adding a single-underscore rule to `stripInlineMd` would eat `snake_case` in backlink rows
and the plain-text export, which are its other callers. The label chain gained the three missing
rules instead. Pinned with the measurement so the next reader does not "simplify" it into a
regression.

### Perf, since the issue flagged it

#953 measured `varMapAt` at ~540 ms per 5k points **when warmed across a whole tree**. It is called
here per LABELLED node - a few dozen to a few hundred - so:

```
400 labelled points, each with a pill and a tag
  labels without the artifact resolver : 1.76 ms
  labels WITH it                       : 2.70 ms   (+0.94 ms)
  openGraph median                     : 869 ms    (the force layout dominates)
```

**Two more pins re-anchored on spelling rather than behaviour** - the #1110 doc-scope and Cards pins
both matched their calls' exact argument lists, and both calls gained a third argument. That is the
**fourth and fifth** instance this session; the class remains open and UXP-260's helpers do not close
it. One of my own new pins also used `[^)]*` in a regex that cannot cross the `)` in
`(n.text || '')` - the identical mistake made in UXP-261, two changes earlier.

---

## UXP-265 - a failed boot restore arrived dressed as a guided tour (#1136)

**Principle:** P4, in its worst form. Not a missing signal but a **contradicting** one.

`restoreAutosave` wrapped four different failures in one bare `catch(_) {}`. All four end at the
welcome document with `_restoredFromAutosave` false. **The issue was filed unreproduced; it is now
measured.** Driven on a real origin, seeding a recognisable document and booting once per condition:

| condition | their work | told? | what the user actually saw |
|---|---|---|---|
| a healthy autosave | restored | n/a | (nothing, correctly) |
| `localStorage.getItem` throws | **LOST** | **no** | *"These are live examples to explore. Click any pill"* |
| the payload is truncated | **LOST** | **no** | the same banner |
| the payload has no `root` | **LOST** | **no** | the same banner |
| the tree is past `MAX_OPML_DEPTH` | **LOST** | **no** | the same banner |

**The finding is sharper than "silent."** Something IS on screen, and it is the examples banner -
cheerful onboarding copy served in place of *"we could not read your document."* A user whose work
has just vanished is told they are on a tour.

The embed path already does this correctly (#449: `embedRestoreFailed` -> *"This shared snapshot
appears to be corrupt and could not be opened. Ask the sender to export and share it again."*), and
#845 set the rule outright - *"every boot losing-copy path flashes, honestly."* It was applied once
and never carried across.

### Fix

The bare catch becomes four named reasons, and boot flashes the matching message next to the embed
one it is modelled on. **Four remedies, not one**, per the `braceAttemptReason` house rule (name the
fix, not just the miss): a blocked profile is pointed at File then Open; a corrupt or too-deep copy
is told it **has not been deleted** and that **editing here replaces it**, which is the actual cliff
- the welcome document plus one keystroke autosaves straight over the blob that might still be
recoverable.

Separating `corrupt` from `deep` required moving both checks out of `applyAutosaveData`'s return
value, which collapses them into one `false`. That is why they were indistinguishable.

**A genuinely fresh boot stays silent** - pinned, because the easy version of this change makes every
first run cry wolf.

Six mutations guard-proofed. The call-site pin (#1133 / UXP-260) was written **before** running them
this time rather than after a mutation reported `0 failing` - the first change this session where
that rule was applied from memory instead of by being caught.

**Still open in #1136:** part 2, `reconcileOpfsOnBoot`'s `userTypedSinceBoot` one-way trapdoor. That
one needs a design call about how to resolve "a durable copy exists but the user has started typing",
and it is not answered by a message.

## UXP-266 - a guard whose answer key is edited by the change it guards (#1144)

Three guards in `tests/test.mjs` validated a change against a set that the same change also edits.
That is not a weak guard, it is an **inverted** one: the more thoroughly you make the mistake, the
more certainly the guard accepts it.

| guard | its answer key | who edits that key |
|---|---|---|
| `#466` dialog `?` deep-links | every `id:'…'` **anywhere** in `index.html` | any command, registry or entry - 169 tokens for 130 real entries |
| `#716` icon census | `FA_GLYPHS` | the icon-adding change itself |
| `BLOCK_CMDS`/`INSERT_CMDS` drift | a hardcoded list in the test | whoever adds a command, if they remember |

### What the `#466` one was hiding

`openGuide` resolves its argument against **entry ids only** and falls back to `entries[0]` on a
miss. Three `?` buttons, each labelled "Open the guide for this", opened the keyboard-shortcuts page
instead. Driven, not inferred:

| dialog | `?` opened | should open |
|---|---|---|
| Stamp a template | Navigate (Shortcuts) | Templates |
| Sequence | Navigate (Shortcuts) | Custom workflows |
| Variable | Navigate (Shortcuts) | Variables |

All three are near misses of a real id (`template`/`templates`, `sequence`/`sequences`,
`var`/`variables`) - and all three near misses are **real ids of something else**, which is exactly
why harvesting every `id:'…'` in the file accepted them. `guideId:'sequence'` was added *by the #466
change*, and the guard that shipped alongside it green-lit it on the spot.

### The FA half: the issue said this needed CI. It does not.

`#1144` assumed a rebuild could only be verified by shelling out to `python tools/build-fa-subset.py`
in CI. The script derives **three** artifacts from one `ICONS` list, and all three are readable
without running anything - including the font, whose cmap says which codepoints really exist. So the
chain closes end to end in plain Node:

    ICONS  ==  FA_GLYPHS  ==  .fa-NAME::before rules  ->  a real glyph in the embedded face

The last link is the one no list-vs-list check can make. It is what turns the guard from **detecting
a list that disagrees with itself** into **proving the rebuild happened** - the distinction UXP-260
drew when it admitted its own census was a ratchet rather than a proof. Here the proof was available.

Mutation-proved, each asserting its target present first:

| mutation | result |
|---|---|
| restore any of the three dead deep-links | `#466` red |
| add a glyph to `FA_GLYPHS`, skip the rebuild | red |
| drop a `::before` rule | red |
| point a rule at a codepoint the font lacks | red |
| edit `ICONS` without splicing the output back | red |
| **swap in a stale/wrong font blob** | red |
| make the cmap reader return an empty set | red |

The last two matter most: the guard cannot pass by failing to look, and it reads the artifact the
issue believed was opaque.

### One found by mutating my own new pin

The woff2 pin first anchored on `@font-face{font-family:'Fraunces'`. Renaming that family did not
turn it red - the anchor simply slid to the next face and still met a `>= 2` floor. Selecting
payloads by **magic number** rather than by family name fixed it. A soft floor plus a movable anchor
is the same vacuity class in miniature, caught only because the mutation was run.

### Deleting a guard, having read it first

`#1144` warned not to assume the hardcoded pair covered nothing. Measured: both lists were strict
subsets of the live registries (17 of 25, 17 of 21) with no id the registries lacked, so they
guarded nothing `#596` does not, while being blind to 12 commands - `rollpick` among them, the very
command whose uncovered shipping caused `#596` to be written. Deleted; their one advantage, reading
the GUIDE block through the throwing `between` helper, was absorbed into `#596`'s extractors.

**Filed separately:** the embedded FA faces are declared `format("woff2")` but are raw sfnt, because
the build script sets `subset.Options(flavor="woff2")` and never `font.flavor`. Browsers sniff the
magic number so the icons paint correctly; it is wasted bytes and a wrong declaration, not a break.
The new parser handles both formats, so that fix can land without touching this guard.

## UXP-267 - a guard that was inert on the path actually in use (#1130)

*(Follows UXP-266, above. Same campaign, third distinct failure shape: UXP-260 was guards
that could not fail, UXP-266 was guards whose answer key the change edits, this is a guard
that never ran.)*

`.claude/hooks/check-pr-conformance.mjs` blocks a PR whose body lacks a Conformance
Statement. Its own header claimed *"passes this hook == passes CI"*. That equivalence
did not hold, in both directions at once.

### It could not see the path in use

The hook was registered for `Bash` only. **Every PR opened in this repo through the
GitHub MCP tools never reached it** - which is every PR this campaign has opened. CI
was still the backstop, so nothing shipped unguarded, but the hook was providing none
of the pre-push guarantee it advertised.

That is the worst shape a guard can take: not absent, and not merely weak, but
**visible enough that you stop watching for what it was supposed to catch**. Measured
today: the CI conformance job rejected a PR body of mine for missing `✅` verdicts on
P1 and P2, an hour after the hook had let the same body through without a word.

### It blocked commands that create no PR

The trigger was `/\bgh\s+pr\s+(create|edit)\b/` against the **raw command string**, so
it matched the *phrase*, not an invocation. It fired on a `grep` for it, on writing the
procedure into a doc, on a commit message that named it.

**Reproduced by accident, which is the sharpest version of the finding:** the probe
written to measure the false positive was itself blocked, because the probe's text
contained the phrase. The bug obstructed its own measurement.

| the command | old | now |
|---|---|---|
| `grep -rn "<phrase> create" CLAUDE.md` | BLOCKED | allowed |
| `echo "run <phrase> create ..." >> notes.md` | BLOCKED | allowed |
| `git commit -m "documented <phrase> create hygiene"` | BLOCKED | allowed |
| `node -e "console.log('to publish, run <phrase> create')"` | BLOCKED | allowed |
| a real non-conforming create | BLOCKED | BLOCKED |

### The fix

**Match structurally.** The command is split into simple commands (so `git push && gh
pr create ...` is seen as two) and tokenized with quotes consumed, then `gh` must be
the invoked binary with `pr create`/`pr edit` as its first two positional arguments.
Quoted text becomes one token and can never promote itself into a match.

**Cover both doors.** A second matcher registers the same hook for
`mcp__github__create_pull_request` / `mcp__github__update_pull_request`, where the body
is read directly with no shell parsing at all.

**Two things found while fixing, both worth keeping:**

- A heredoc body is *statically present* in the command text, so it is now read rather
  than waved through. But heredocs had to be lifted out **before** splitting on
  newlines - the first attempt shredded the heredoc into separate "commands" and
  silently fell back to fail-open, i.e. straight back into the hole being closed. Caught
  by mutation, not by reading.
- `gh --repo o/r pr create` read `o/r` as the subcommand and missed. Fixed by skipping
  `-R`/`--repo` and its value.

### Driven, not assumed

A registered hook that never fires is the builder-keyboard bug (#1021) in a different
costume, so the matcher was **driven, not inferred**: the hook was instrumented, a live
MCP call was made, and it logged `FIRED mcp__github__update_pull_request` - in-session,
with no restart. Then a real MCP update carrying a deliberately non-conforming body was
attempted against a live PR and was **blocked**, with the PR body verifiably unchanged
afterwards.

### The call site is pinned, because it is the whole bug

Every behavioural case can pass while the hook is registered for nothing. So the
self-check now reads `settings.json` and asserts each of the three tool names is
covered by a registered matcher. Mutation: unregistering the MCP matcher leaves the
hook's logic perfect and turns the suite red.

Six mutations guard-proofed, each asserting its target present first. And the
self-check itself was never run by anything - a guard whose test is not executed rots
exactly like the guard it tests - so CI now runs it.

**Residual limitation, stated rather than implied:** the shell parser is not a shell.
A body computed at runtime (`--body "$(...)"`), an unreadable `--body-file`, or a piped
stdin still fail open by design, and CI remains the real gate for those. The MCP door
has no such gap, because there is no shell involved.

## UXP-268 - the refusal recommended the remedy the user had already tried (#1159)

**P4-2.** A grad student in the persona pass wrote a cost as a note and a formula on the next line,
followed the app's own advice, and it still did not compute. She reported it as a coaching loop that
"did not visibly close." Reproduced, the defect is sharper: **the cue named two remedies, and the one
she had already done is the one that does not apply.**

`mathReasonPhrase`, `bad ref` arm:

> *"a name with no value here; declare it as a variable **or add it as a property**"*

She had added it as a property. Nothing said a property is read only from its own point and the
points above it.

### The app was right; only the message was wrong

`guide/computing-numbers.md` already documents the rule exactly: *"Only numbers inherit, and only
**down** the tree; a value on a sibling or a child is not in scope."* Confirmed in code:
`nodePropVars` reads the node's own props, `resolveNodeScope` merges `docVars ← ancestors ← own`,
and nothing in `varMapAt` touches `node.props`. So the guide and the engine agreed with each other,
and the error message agreed with neither. **The entire scope rule was being carried by the word
"here".**

Measured through the real render path (calling `evalMath` directly is the wrong entry point, since
`sum()` is expanded by `expandAggExpr`, a caller that holds the node - that cost two wrong readings
before the rendered pill was checked):

| shape | renders |
|---|---|
| bare prop name on the **same** point | ✅ 560 |
| bare prop name on a **parent** (inheritance) | ✅ 560 |
| declared variable, referenced from a sibling | ✅ 560 |
| `{= sum(cost)}` over child props | ✅ 360 |
| bare prop name from a **sibling** | ❌ plain text + cue |

### The two cues were pulling against each other

`maybeNudgeField` fires on a bare `cost: 40` and says *"add it as a number: type /prop:cost=40"*.
Follow it, reference the name from the next line, and `bad ref` says "add it as a property". The
first cue produced the layout the second one punished. **The prose cue is left alone** (it is not
wrong on its own terms, and properties do work on their own point and inherit downward); once the
math cue explains scope, the pair stops contradicting.

### The fix, and what it deliberately is not

One string, the UXP-252 shape: the single shared code→phrase map reaches all four surfaces at once
(the `#ERR` pill title/aria, the `brace-attempt` cue via `braceAttemptReason`, and the math and
`/check` dialog previews). The `'bad ref'` **code** is untouched, so the tight chips and
`computeTable`'s `#ERR (bad ref)` cells are unaffected.

**Not a new reason code.** #1159 proposed detecting "this name is a property elsewhere" via a new
`mathErrorReason` arm fed by `collectPropKeys()`. That costs a code, a doc-context parameter,
threading at six call sites and call-site pins, for a message change. Accepted cost of the simpler
form: a plain typo also sees the scope sentence - no worse than today, which tells that same user to
add a property.

**`sum()` is deliberately not mentioned.** It answers a different question, and the teaching already
exists and fires in exactly this situation: `maybeNudgeSum`, gated by `nudgeSumKey`, which requires a
**sibling** to share the numeric key.

### The pins could not see the fix

The change shipped and **the whole suite stayed green**. The copy lock asserted
`/declare it|add it as a property/` - an OR that "declare it as a variable" satisfies - and the
`braceAttemptReason` pin only needed "no value here", which survives. Both rewritten to lock the
scope sentence and the working remedies, then proved by reverting the string and watching exactly
those two go red. This is the UXP-260 rule catching a change that had already been made correctly:
the code was right and the guard was blind.

**Acceptance was following the advice**, the UXP-252 standard: her layout shows the cue, and then
each remedy the sentence names - move it here, move it to a parent, declare `{cost := 40}` - computes
560. Negatives unchanged: a real typo still returns `bad ref`, `2 * 3` still computes.

## UXP-269 - the first screen showed what the app can do before saying what it is (#1117)

**P2-1.** Two of six personas in the 2026-07-27 pass read the app as tabletop software and nearly
closed it before finding anything else.

> **Ops manager:** *"My honest first read was 'this is for someone who plays Dungeons & Dragons.' I
> nearly closed it."*
>
> **PKM researcher:** *"I opened it and got a document about rolling 2d6 and whether a weekend trip
> fits a GBP 400 budget. My first thought was that I'd been sent to the wrong app."*

A third persona arrived for exactly the current opening and reached a working oracle in two minutes,
so the origin audience is served and nothing here removes anything.

### Measured on a fresh boot, which corrected the issue's own model

Cleared storage, blocked OPFS, 1280x800, reading rendered text above the fold in DOM order:

| | before | after |
|---|---|---|
| points above the fold | 13 | 13 |
| what they are | **4 dice/coin, then 9 budget, and nothing else** | 1 framing line, then the same |
| first clickable pill | `{2d6}`, row 1, y=194 | `{2d6}`, row 2, y=253 |
| first beat that is neither a die nor a budget | y=906, a full screen down | unchanged |

Two things this measurement settled, both against what #1117 assumed:

1. **The researcher was describing the screen accurately.** "Rolling 2d6 and whether a weekend trip
   fits a GBP 400 budget" is not a caricature; it is the complete contents of the first screen.
2. **The budget block was never below the fold.** It sat at y=425. The issue's suggested fix - lead
   with the budget block - would therefore have changed nothing about what he saw, and he named that
   block as *part of* what put him off: *"a document about rolling 2d6 **and whether a weekend trip
   fits a GBP 400 budget**."* The issue's proposed remedy is contradicted by its own evidence.

### The fix is framing, not ordering, and IA-2 is left standing

The tour opens `# Poke this document` then immediately `Click this: {2d6}`. That is **IA-2**, shipped
as #859 with a test enforcing it, and its recorded measure is seconds/keystrokes from a fresh open to
a live pill. Neither reader complained about that; both said they could not tell what the app was
for. Reordering would trade a measured win for an unmeasured one.

So: one line above the die.

> Every point here is ordinary text. Some of them also total a list, hold a range instead of a fake
> number, or pick something at random.

Three concrete capabilities, two of them not tabletop, in the words of what the tour goes on to show
(the budget total, the album range, the stuck-project draw). IA-3 binds the wording - *external copy
speaks in problems a stranger recognizes* - so no "your text is alive", and AP punctuation. The atom
still arrives one line in and still above the fold; what changes is that it reads as a demonstration
of liveness rather than as the subject matter.

### The second persona's actual gap, closed with one more line

The tour never mentioned links, notes or search at all. The researcher recovered only by **hovering
the search bar** and finding `has:backlink` / `is:orphan` by accident. "Make it yours" now names the
link layer and both operators. `[[`, `has:backlink` and `is:orphan` all render as literal `<code>`
spans (driven and confirmed: no pill, no `.node-link`, no link-index entry).

### Both pins were written to fail, because presence alone could not

The change shipped and all 1798 tests stayed green - the same UXP-260 shape as UXP-268 one PR
earlier. A pin asserting the framing sentence is *present* would also have passed with the sentence
placed **after** the die, which is the arrangement being fixed. So the pin asserts the **order**
(`indexOf(framing) < indexOf('Click this: {2d6}')`), and the IA-2 pin's own message, which called the
atom "first point", was rewritten rather than left as a stale claim.

Six mutations, each asserting its target present first: drop the framing line, move it below the die,
drop one named capability, drop the link line, drop the search operators, remove the atom. All six go
red. **One of them initially reported a false pass** - the harness's "did the mutation apply" check
compared against `git diff` on an already-dirty file, so it could never fire. The mutation was a
no-op and the green meant nothing. Recorded because it is the same defect class the harness exists to
catch, one level up: a guard on a guard that cannot fail.

## UXP-270 - the destructive action was the silent one, not its damage (#1146)

**P4-1.** `{who := Maren Osk | Halvard | Sister Ivy}` declares a named pick; `{who}` elsewhere
reuses it. Choosing **Freeze to text** on the *declaration* drops its record (`pruneArtifacts`), so
the name leaves `collectVars` and every reference is stranded.

### Reproduced first, and the issue's premise was wrong

#1146 says the stranded references "render `?`". Driven on `main`, they do not. An orphaned
reference renders:

| | measured |
|---|---|
| value slot | `—` (not `?`) |
| class | `var-pill var-ref var-undef` |
| border | dashed, `--del` |
| title | *"Variable not found. Click to edit"* |
| aria-label | *"Variable who not found. Click to edit"* |

**So the references were never silent.** They degrade visibly, name the state, and undo restores all
three points. What was silent is **the destructive action itself**: it announced *"Frozen to text:
who = Sister Ivy"* and *"Pill frozen to text"* and never mentioned the two points it had just
changed, which can be anywhere in the document and are usually off screen. That is a much narrower
defect than filed, and it changes which fix is right.

### Report the consequence, do not refuse the action

The issue offered three answers and my own first pick was **refuse** (*"2 points reference `who`.
Freeze those first."*). Reproduction argued against it: gating an action whose damage is already
visible and already undoable costs a user something they may legitimately want, and the app's own
recorded stance on the adjacent surface is that an editor affordance is *"an affordance, never a
gate."* So the freeze still works and now says what it cost, reusing the UXP-237 / #1111 shape for
lossy operations:

> `Frozen to text: who = Sister Ivy. 2 points using who now show no value. Undo to put it back.`

Both channels carry it - the toast a sighted user sees and the live region a screen reader hears.
Reporting to only one is the half-fix this register keeps recording. When nothing broke, the note is
empty and the message reads exactly as it did before.

**Cascade was not taken** (freeze the declaration and every reference in one undo step). It is
probably what a novelist committing a scene wants, but it edits points the user is not looking at,
and that deserves its own row and its own justification rather than arriving as a side effect of a
row labelled "Freeze to text". **This is the reversible half of the decision**: if the owner would
rather have the cascade, it is an addition on top of this reporting, not a replacement for it.

### Positional counting, and why the first version was wrong

The first counter asked "is this name declared anywhere in the document" and returned 0 if any
declaration survived. **Driving it caught that as wrong**, in a layout that is easy to hit: with the
surviving declaration BELOW the reference, the screen showed the broken dash and the count said
nothing was broken. A reference resolves against the nearest declaration **above** it in document
order (#767 / Stage B), so the counter now walks pre-order and counts references that have seen no
declaration yet. Count and screen now agree in every driven case.

This is the second time in three PRs that a reasoned-about rule survived unit pins and failed the
moment it met the running app.

### Seven driven scenarios, eight mutations

Driven: declaration with 2 references, with 1 (singular agreement), with none (message byte-identical
to before), with a second declaration below the reference (now correctly reports 1), freezing a
*reference* rather than a declaration, freezing a *dice* pill, and undo restoring all three points.

Eight mutations, all red: drop the counter call, capture the name after the prune, count
non-positionally, silence the note, drop the note from the live region, drop it from the toast,
single-row repaint while references elsewhere went stale, drop plural agreement. The harness
compares against a **backup rather than `git diff`**, because the #1117 harness compared against git
on an already-dirty tree and reported a false pass on a mutation that never applied.

---

## UXP-271 - the layer carrying the graph's meaning was the layer nobody measured (#1150)

A novelist reported two things about the link graph in one sentence: a 5-point chain ran corner to
corner, and the edges were ones she *"could barely see"*. #1139 fixed the first half (`clampPositions`
rescaled X and Y independently and destroyed the aspect it claimed to preserve). The issue's
remaining ask was a small-N cap on the Fruchterman-Reingold ideal edge length `k`.

**The issue itself said to check something else first, and it was right:**

> Before tuning `k`, measure the edge stroke against the design language's contrast floor. If the
> edges are simply too faint, that is a much smaller fix with no layout blast radius.

Measured, it resolves the visible half outright. Every graph edge class failed the 3:1 non-text
floor, against the panel's real `--hbg` backdrop:

| element | light | dark | 3:1? |
|---|---|---|---|
| `.graph-edge` - `stroke:var(--bdr)` | **1.27** | **1.24** | no, badly, both |
| `.graph-edge-broken` - `--bad` @45% | **2.20** | **2.50** | no, both |
| `.graph-edge-unlinked` - `--info` @.6 | **2.79** | 3.54 | no, light |
| *(for scale)* `.graph-node circle` - `--acc` | 7.58 | 7.93 | yes |

**The nodes were six times the contrast of the lines joining them.** That is her sentence as a
number: she saw five dots clearly and the edges between them not at all.

### It was a rule violation, not a taste call

`design-language.md` already bound this, and had for as long as the tokens have existed:

> *"`--bdr` is decorative (hairlines may whisper); **`--bdr-ui` (≈3:1) exists for functional
> boundaries** - use it when a border is the only thing delineating a control."*

A graph edge is the strongest possible case: it is not delineating the content, it **is** the
content. The correct token already existed, was already defined in both palette homes, and measures
3.37 / 3.34. So the fix was a token swap the design language prescribes, with zero layout blast
radius - no arbitrary constant, no re-reading the UXP-243 separation pins, no change to the four
property-based `graphLayout` pins. The shipped diff touches three CSS declarations and nothing else.

### 65% is derived, not chosen

For the two translucent kinds, 65% is the lowest 5% step at which **both** themes clear 3:1,
computed independently for `--bad` and `--info` and landing on the same value. The `#1132` precedent
binds: a constant in this codebase is measured or it does not ship.

After: plain 3.37 / 3.34, broken 3.28 / 3.74, unlinked 3.08 / 3.89. All twelve combinations
(4 palette homes x 3 edge kinds) clear the floor.

### The dashes, not the faintness, carry the distinction

Broken and unlinked edges are told apart by `stroke-dasharray`, so raising contrast does not collapse
the three kinds into one. The researcher in the same persona pass called the dotted unlinked-mention
edge *"the single best idea in here"*, so "still reads as NOT-a-real-link" is an acceptance
condition, not a nice-to-have. It has its own guard.

### `stroke-width` deliberately untouched

Contrast is the rule-backed defect; width is a taste call. Fixing the measurable one first and
*then* looking is the honest order, and driving both graphs in both themes afterwards showed the
edges read clearly at 1.2. Worth knowing before anyone widens it: `renderGraph` hardcodes the same
`1.2` inside `Math.min(4, 1.2 + Math.log2(e.weight))` for weighted folder edges, so the base width
lives in **two** places - the same dual-home trap as the palette.

### The gap that let 1.21:1 ship, and the gate that closes it

§3 asked authors to put computed ratios *in the PR*. That is discipline, not a gate, and discipline
does not survive contact with a hundred merges. There was no test. There is now: it reads the three
edge rules and the token values **out of the CSS** (so retuning a stroke re-runs the measurement
rather than dating the guard), and checks every ratio in all **four** palette homes - CSS `:root`,
the CSS dark media block, and both `applyTheme` strings.

That last part matters more than it looks. The existing dual-home guard checks token **names** are
present in both homes; it cannot see a token whose *value* diverges between them. Mutating
`--bdr-ui` in the `applyTheme` dark string alone - leaving the CSS `:root` correct - passes the
name-parity guard and fails this one. For these tokens the dual-home invariant is now enforced
rather than merely stated.

Scoped to graph edges deliberately. A whole-palette audit would likely turn other pairs red and is
its own change, not a drive-by here.

### Guard-proofed, five mutations

All five red, each asserting its target string was present first (#1133): plain edge back to
`--bdr`; broken back to 45%; unlinked back to `.6`; the two dash patterns collapsed to one; and
`--bdr-ui` degraded in a single palette home. The guard also asserts it made exactly 12 measurements,
so a selector rename that finds nothing fails loudly instead of reporting a vacuous pass.

### Driven, both graphs, both themes

Reproduced first on the pre-fix build: her 5-point chain and the researcher's 7-point hub, rendered
headless, edges measured off the **live** computed styles and screenshotted. A harness bug is worth
recording, because it briefly produced a confident wrong number: Chromium serialises a `color-mix()`
result as `color(srgb 0.70 0.15 0.12 / 0.45)` with **0-1** channels while plain colours come back as
`rgb(r, g, b)` with **0-255**. Parsing both the same way turned the broken edge into a near-black
stroke and reported 3.32:1 where the truth was 2.20:1. Reading the raw computed value rather than
trusting the derived ratio is what caught it.

### The `k` half is left OPEN, with evidence

Both halves of her complaint are now addressed without touching layout: #1139 killed the
corner-to-corner diagonal, this kills the invisible edges. What remains of #1150 is "a 5-point chain
spans the canvas", and the issue itself concedes *"a sparse graph using the space is not
self-evidently wrong."* A cap would change every layout and needs a fraction that is a taste call -
exactly what #1132 established this codebase does not ship. So the issue stays open with the
measurements and the driven screenshots posted to it, rather than being closed on my own argument.
If the chain still reads badly now that its edges are visible, the evidence is already there.

---

## UXP-272 - the app declared a font format it did not ship (#1155)

☐→✓ · 🟢 cosmetic-but-tracked · closed 2026-07-29

### The defect, in one line

`tools/build-fa-subset.py` passed `flavor="woff2"` to `subset.Options(...)` but drove `Subsetter`
directly. Only `subset.main()` applies that option, via `save_font()`:

```
subset.py:3900   font.flavor = options.flavor      # inside save_font(), called only from main()
```

So the option was stored and silently dropped, `TTFont.save()` saw `self.flavor is None`, and wrote
an uncompressed sfnt. All three embedded faces decoded to magic `00010000` while their `@font-face`
declared `format("woff2")`. Nothing was broken - browsers sniff the magic number, so the icons
painted - but the app stated a format it did not ship.

### The size claim in the issue was right; its significance was not

The issue called it "~17 KB of wasted bytes in a single-file app". The byte count is accurate: the
rebuild recovered **17,140 base64 bytes**, 28,512 -> 11,372, a 60% cut of the FA payload.

| face | before (raw / b64) | after (raw / b64) |
|---|---|---|
| Free 900 solid | 18,208 / 24,280 | 6,828 / 9,104 |
| Free 400 regular | 2,020 / 2,696 | 1,028 / 1,372 |
| Brands 400 | 1,152 / 1,536 | 672 / 896 |

What that is *worth* is smaller than it sounds: `index.html` is 2.86 MB, so this is **0.6% of the
file**. Size was the secondary benefit. The reason to do it was correctness, plus a guard so the
declaration cannot drift from the bytes again.

### A claim made while planning this was wrong, and the record should not repeat it

It was asserted mid-session that the woff2 decode arm of `fontCodepoints` "has never executed" and
that this change would therefore be its first real exercise. **That was false.** The test *"#1144:
fontCodepoints reads a real woff2"* already drove that arm against the genuine woff2 text faces
(Fraunces/Geist). The arm was proven; the change was lower-risk than represented. What it genuinely
added was coverage of a different *shape* - tiny subset fonts with private-use codepoints and
glyf/loca transforms - and that decoded correctly first time, reading 77 codepoints out of the solid
subset.

### The guard, which is the point

The fix is one line. The gate is the other half, and it is the UXP-271 lesson again: a rule with no
test is discipline, not a gate. `#1144`'s woff2 test now has two halves:

- **(a)** every `fa-embed` payload must be real `wOF2`. A rebuild on a tree that lost
  `font.flavor = "woff2"` reverts to sfnt and the icons keep painting, so nothing else would notice.
- **(b)** the text faces still pin the decode arm against a big cmap - but scoped **structurally**
  (the woff2 payloads *not* in the `fa-embed` block) rather than by family name. The previous
  selector took every woff2 payload in the file, which was correct only while the FA faces were sfnt
  and thus filtered out; after the fix they matched it and failed the `>100 codepoints` floor, since
  a subset carries ~77 private-use codepoints and no ASCII.

Three mutations, each asserting its target was present first (#1133): removing the flavor line and
rebuilding reverts all three payloads to `00010000`; swapping one payload back to its sfnt bytes
turns (a) red; dropping the `!faSet.has(b)` exclusion turns (b) red with `parsed only 77 codepoints`.

### Two stale comments removed

Both named the bug as live and unfixed - `fontCodepoints`'s header ("*declared woff2 but are actually
raw sfnt ... filed separately*") and the test body ("*The FA payloads are sfnt today, so the woff2
arm above would otherwise be dead code*"). Left in place they become the next reader's false premise,
the #1107 failure mode. The sniff itself stays, along with the sfnt arm and its
`unrecognised embedded font payload` throw: sniffing rather than trusting is still the right design.

### Driven, because no unit test sees a font that decodes in Node and fails in a browser

Acceptance was a diff of exactly three base64 strings: the 78 `::before` rules and the `FA_GLYPHS`
line came back **byte-identical**, and `index.html` changed by exactly 3 lines. Decoded codepoint
sets were compared per face before and after - 77 / 6 / 1, **identical**, so coverage is unchanged
rather than merely present.

In Chromium: all three faces reach `status: 'loaded'` with no page errors, and the toolbar renders
**pixel-identical** to the pre-fix build in **both** the light and dark schemes. That comparison is
falsifiable - a build with one payload corrupted gives `status: 'error'` and a different toolbar hash
- which is what makes the identical result mean something.

Two earlier per-glyph browser checks were written and **thrown away rather than shipped**, because
each turned out to be unable to fail: advance-width comparison left 74/77 glyphs "passing" with the
entire solid face corrupted, and rasterize-vs-fallback passed 78/78 on that same broken build,
because a missing glyph still renders a notdef box that differs between families. Per-glyph coverage
is already pinned authoritatively by reading each face's cmap in `#1144`; a decorative second check
that cannot fail is worse than none (UXP-260).

---

## UXP-273 - a real function at the wrong arity reported as an invented one (#1169)

☐→✓ · 🟡 partial / inconsistent · closed 2026-07-29

### The defect

Found in the persona pass over surfaces the register had never reached (`moonphase` was at **zero**
mentions). Every wrong-arity call of a known function fell to the generic catch-all, byte-identical
to the message for a name that does not exist:

| typed | before |
|---|---|
| `{= moonphase(today)}` | `This calculation could not be evaluated. Check the formula.` |
| `{= moonphase(today, 28)}` | same |
| **`{= notafunction(1)}`** (control) | same |

So the app knew `moonphase` was real - it is in `MATH_DATE_FNS` with a registered description - and
still reported it as a typo. The one thing the user got wrong, the argument count, was the one thing
the cue did not mention. `{= moonphase(today)}` is the natural first attempt, because every
neighbouring date function (`weekday(today)`, `eom(due)`, `year(today)`) takes one value.

This is the same class as UXP-268 / #1159, which fixed the *bad-ref* arm of this same function. The
`could not be evaluated` catch-all was the arm left generic.

### The information already existed and was being thrown away

`evalMath`'s parser detects this exact case. The #827 arity dispatch ends:

```js
if ((name in FN1 || name in FN2 || name in FN3) && !(name === 'min' || …)) throw 0;
```

`throw 0` is an opaque sentinel, so the reason chain never learned why. The fix re-derives it rather
than plumbing the parser: `fnArities(name)` returns the accepted counts as a **set** (one name may
live in several tables - `log` is 1-arg base-10 in FN1 *and* 2-arg `log(x, base)` in FN2), and
`fnArityProblem(expr)` finds the first mismatch, counting **top-level commas only** so a nested
call's commas do not inflate the outer count.

### After

| typed | after |
|---|---|
| `{= moonphase(today)}` | *moonphase given 1 value where it takes 3. It is moon phase 0 to 1 for a date, so write it as `moonphase(a, b, c)`* |
| `{= log(1, 2, 3)}` | *log given 3 values where it takes 1 or 2 … write it as `log(a)` or `log(a, b)`* |
| `{= notafunction(1)}` | **unchanged**, still the generic message |

An unknown *name* deliberately stays generic: that is a different mistake and 'bad ref'/syntax
already covers it. The two being indistinguishable was the defect, so the control staying put is
what proves the fix.

The arm is checked **last**, so every more specific reason still wins - `moonphase(qqq)` stays
'bad ref', because the typo is the more actionable fix (the precedence the #1101 comment sets out).
The phrase is a **noun phrase**, because all four callers prefix it (`This uses …`,
`This calculation uses …`, `Invalid expression: …`, `can't evaluate · …`), and `(a, b, c)` matches
what the `{` picker already shows for these names, so there is one shape convention rather than two.
`MATH_FN_DESC` supplies the meaning, so the description is not copied a second time.

### A stale comment corrected

`moonphase` carried `if (!period) return NaN;  // period 0/NaN → visible error`. There is no visible
error: `evalMath('moonphase(19000, 0, 0)')` returns **null**, so the expression never promotes and
the brace-attempt cue explains it. The comment described an intent the code does not deliver, which
makes it the next reader's false premise - the same class #1155 cleaned up in the font guard.

### Guard-proofed, including one pin that could not fail

Seven mutations, each asserting its target was present first (#1133). Five went red immediately:
removing the arity arm; unrouting `'arity'` in the phrase map; counting all commas instead of
top-level; and a call site dropping the expression argument (a tested core proves nothing about
whether callers pass it).

**One did not, and that was a finding about my own change.** Dropping the `MATH_VARIADIC_NAMES`
exclusion changed nothing, because min/max/avg/and/or are in none of FN1/FN2/FN3, so the
`want.length` check returns null for them regardless. The exclusion is belt-and-braces - kept,
because the parser makes the same defensive guard and because adding a fixed-arity `min` later must
not turn a legal variadic call into a reported error. The pin was rewritten to assert the
*redundancy claim itself* (the variadics are absent from the tables) plus a source-pin on the line,
so deleting it is red **and** the day it becomes load-bearing you are told. Both now bite.

Driven in Chromium: all seven cases above read from the live `title`/`aria-label`, no page errors,
and following the advice works - `{= moonphase(today, 28, 0)}` promotes and renders its glyph.

---

## UXP-274 - "Top mark -∞" told a teacher something was wrong but not what to do (#1171)

☐→✓ · 🟡 partial / inconsistent · closed 2026-07-29

### The finding

From the second persona fleet (`user-research-2026-07-fleet2.md`). A secondary teacher put
`{= max(score)}` on a point and read **`Top mark -∞`**. Her marks were children of a *sibling*
point, so the rollup matched nothing and returned the identity element of the comparison.

Measured across the whole family, with a working control:

| reducer | real children | nothing matches (before) |
|---|---|---|
| `sum` / `avg` | 130 / 65 | `0` + *"No score below this point. Move the pill onto the parent, or check the property name."* |
| `count` | 2 | `0`, no cue - **correct**, a count of nothing is 0 |
| `min` / `max` | 58 / 72 | **`∞`** / **`-∞`**, no cue |

### The exclusion was deliberate, and half right

`firstEmptyRollup`'s own header gave the reason: *"count() is excluded (0 is its honest answer) and
min/max already return ±∞ (visibly not a plain 0)"*. The cue exists because `0` is
pixel-identical to a genuine computed 0; ±∞ is not, so the argument went, it needs no cue.

That is true about *visibility* and false about *actionability*. She could see the number was odd.
Nothing told her the pill was on the wrong point, which is the one thing she needed.

### Why this is display-only, and not a wider change

`firstEmptyRollup` gates **two** callers, and they want different answers:

- the math pill's cue (display), and
- the `check` verdict, via `if (firstEmptyRollup(raw, node)) return 'error';`

Widening it outright would silently turn `max(score) <= 100` over an empty scope from a **vacuous
pass** into an error state. That is a semantic change to a documented convention, not a cue. So the
core takes an opt-in `opts.extrema`, the display site passes `{ extrema: true }`, and the check site
keeps the default. `count` stays excluded in **both** modes.

After: `max(score)=-∞ nothing matched` plus the existing cue. The computed value is untouched, which
is the same treatment `sum` already gets (it still shows `0` beside its cue).

### Guard-proofed, and one existing pin was too loose to notice

Five mutations, each asserting its target present first (#1133): the display site losing the opt-in;
the check site *gaining* it (2 red - the semantic guard bites); the flag ignored in the core; the flag
forced always-on; and `count` wrongly included.

The pre-existing source-pin was `_src.includes('firstEmptyRollup(m.expr, cookieNode)')`, which is a
**substring of the new call**, so it stayed green through the entire change and could not have
detected a revert. Tightened to require `{ extrema: true }`, and a companion pin now asserts the
check site does **not** pass it.

### Method note worth keeping

The props sidecar field is `{key, val}`, not `{key, value}` - `childPropNumber` reads `p.val`. Four
attempts at a control silently produced empty rollups because of it, which made every reducer look
broken and nearly turned this into a much bigger false finding. The fix is only reported because the
control was eventually established (`sum(score)` → `130`).

---

## UXP-275 - precision could be stated in decimal places but not in significant figures (#1175)

☐→✓ · 🟡 partial / inconsistent · closed 2026-07-29

### The finding

From the second persona fleet (`user-research-2026-07-fleet2.md`). A postdoc keeping a lab notebook
was the one persona who would **think** in Pointliner but not **record** in it, and the reason was
precision: `{= 1/3}` prints `0.33333333`, `{= convert(12.4, mg, g)}` prints `0.01240`. She could ask
for two decimal places. She could not ask for three significant figures.

Measured, the existing field genuinely cannot express it:

| value | `decimals: 3` | 3 significant figures |
|---|---|---|
| `0.0124` | `0.012` - **loses a real digit** | `0.0124` |
| `1240` | `1,240.000` - **invents three** | `1,240` |

That is the scale-independence argument `formatConvertResult`'s own comment already made ("*Two
decimals reads fine at 289.68 and destroys `1 in -> m`… Significant figures are scale-independent*").
The codebase already reasoned in significant figures internally - the default formatter is
`toPrecision(8)`/`toPrecision(10)`, convert is `toPrecision(4)`, and `estNumFmt`'s tiny-magnitude
escape was a hardcoded `toPrecision(3)`. The only thing missing was a way for the **author** to say it.

### What deliberately did NOT change

The convert default still pads to exactly 4 significant digits (`0.0124` -> `0.01240`). I first
proposed stripping that as "arguably a bug", then found it pinned as *"the deciding case"* of #983 -
the example the 4-s.f. choice was made to protect - and that `1 in = 0.0254 m` is exact by
definition, so `0.02540` claims nothing false. The owner's call was to leave it and let the new
control answer the postdoc instead. **No existing default moves**; every default output is pinned
byte-identical.

### Display-only, and why that forced an opt-in rather than a widen

`firstEmptyRollup`'s sibling problem, again: the natural place to put this gates two callers that
want different answers. `formatMathDisplay`'s convert escape is display; `formatMathResult` is what
**table recompute persists into `node.text`**, and `replaceConvert` substitutes into the expression as
text. Rounding in either would corrupt saved data rather than presentation. Both already carry pins
asserting exactly that, and both stayed green untouched; the `replaceConvert` pin was re-proved by
mutation (my first attempt at that mutation put the token in the parameter list, outside `fnBody`'s
window, and reported a false pass - corrected).

So `sigfigs` is a 4th **positional** param on `parseNumFmt`, leaving the three existing 3-arg call
shapes byte-identical, and it is honoured only in the display sinks: `formatNumDisplay`,
`formatMathDisplay`'s convert escape, and `estNumFmt`.

### Exclusive rather than precedent-ranked (P4)

Decimal places and significant figures are alternatives. Hidden precedence would make "set sig figs
on a pill that already had decimals" a silent no-op, so the dialogs blank one when the other is
typed, via a declarative `exclusiveWith` handled once in `openInsertDialog` and reused by all three
fmt dialogs. The core still prefers `decimals` if both somehow arrive, which is unreachable through
the UI and exists for an imported or hand-edited OPML.

All **three** doors gained the field - math pill, base column, estimate - because a record with a
field one dialog can set and another cannot is a P1 break.

### Guard-proofed

Nine mutations, each asserting its target present first (#1133): the branch removed from each of the
three display sinks; the tiny-magnitude escape ignoring the author's value; the runner ignoring
`exclusiveWith`; `parseNumFmt` letting sigfigs ride alongside decimals; a dialog dropping the 4th
argument (2 red); a dialog losing the field; and rounding introduced into `replaceConvert`. All red.

Two existing pins were **rewritten rather than loosened**, both predicted in the plan: the `#983`
convert-escape source-pin (it names the literal regex, which now has two escapes) and the `#1115`
estimate-dialog pin (it names the literal `parseNumFmt` call, which now has four arguments). Each
carries the reason, so a future reader sees a decision.

### Found on the way, filed not fixed

Driving a lab-scale estimate showed `{0.00212 to 0.00294}` rendering as **`≈0 (0 – 0)`**. Confirmed
pre-existing on `main`: `estNumFmt(0.00253, null)` is `"0"` there too, because the adaptive default
does `String(+x.toFixed(2))`. That is a default change and therefore not this PR's business, but it
is the same "silent, correct-but-useless" theme, so it belongs in its own issue. Pinned here in both
directions: the default still collapses, and `{sigfigs: 3}` recovers `0.00253`.

**Correction (2026-07-30):** this section originally said "so it is filed", and it was not. No issue
existed; I wrote the sentence and never opened one. Now filed as **#1177**, with the threshold
detail the sentence above gets slightly wrong -- `toFixed(2)` starts losing everything at 0.005, not
at the 0.001 where `estNumFmt`'s existing tiny-magnitude escape fires, and `0.00253` falls in that
gap. Recorded rather than quietly edited, because "filed separately" in a register is a claim the
next reader will act on.

---

## UXP-276 -- the estimate pill is what makes a phone scroll sideways (#1173)

**Status: FIXED.** From the second persona fleet: the phone-first persona's very first screen, the
shipped welcome tour, was **606 CSS px wide at a 393px viewport**, so the app opened scrolling
sideways.

### The measurement that exonerated the toolbar, and corrected my own issue

`#1173` blamed the toolbar and recommended letting it wrap. All three of its claims were wrong, and
finding that out was half this change:

- `#tbtn-cluster` is a `.scroll-strip`: `overflow-x:auto`, `min-width:0`, `flex-shrink:1`,
  `scrollWidth 417 > clientWidth 242`, and its box ends at **right: 390 inside a 393 viewport**. It
  contains itself and scrolls internally, exactly as designed.
- Every element the issue's probe flagged was **inside that scroll container**. The probe compared
  `getBoundingClientRect().right > innerWidth` without excluding scrolling ancestors, so it counted a
  scroll container's own hidden contents as page overflow. Corrected method: an element counts only
  if no ancestor has `overflow-x: auto|scroll|hidden`.
- **Wrapping was tried and deliberately reverted** (UXP-258): a second row makes the toolbar's HEIGHT
  a function of the button count, which moves every surface below it and reads as breakage. Following
  the issue's recommendation would have reversed a recorded decision.

Re-measured with scrolling ancestors excluded, the culprit is one component:

| document | page width | true culprits |
|---|---|---|
| plain outline | **393**, no scroll | none |
| one math pill | **393**, no scroll | none |
| one **estimate** pill | **495** | `.est-pill` **w 421** |
| the shipped tour | **606** | the same, three times; widest **w 500** |

`.est-pill` is `white-space:nowrap` with nothing shrinkable in it, so it is as wide as
`ico + expr + ≈ + mean (p5 – p95) + spark + pencil` at every viewport. A math pill has no sparkline
and fits. **The estimate pill is the whole finding.**

### The fix, and why the plan's single rule was not enough

Two rules in the existing `@media(max-width:560px)` block, the same "drop a decoration on a phone"
move as its neighbouring `#search-key{display:none}`:

```css
.est-spark,.est-preview-spark{display:none}
.est-expr,.est-eq{display:none}
```

The plan proposed **only** the sparkline, on arithmetic that assumed the tour's widest pill was 398px.
Measured, it is 500, so dropping the 92px spark left it at **403 -- still past 393**. The plan said to
verify by measurement rather than trust that arithmetic, and this is what the measurement changed.

An intermediate attempt (`max-width:100%` on the pill plus `text-overflow:ellipsis` on the expr) was
built, measured and **thrown away**: flexbox squeezed the expr to its floor and rendered `8 to 14` as
`8 t…`, which reads as breakage rather than as brevity.

What ships instead reuses a decision the app had already made. Prose mode drops the same two elements
together (`.nt-para .est-expr, .nt-para .est-eq{display:none}`), and the pairing is not stylistic: the
`≈` is the relation *between* the expr and the result, so leaving it behind prints a dangling operator
with nothing on its left.

### What stays, and why each is load-bearing

- **The summary.** `31.2 (19 – 46.6)` is recoverable from nowhere else. Hiding it would keep the
  decoration and drop the information.
- **The pencil.** On `hover:none` it is a visible 26px chip with a 44px `::before` tap overlay, and it
  is a phone user's only door into the estimate. **Driven:** tapping it at 393 opens the dialog with
  `(8 to 14) * (2 to 4)` in the field, so the hidden recipe is one tap away.
- **The accessible name.** `aria-label="Estimate ${e.expr}: mean …"` already carries the full
  expression, so a screen reader loses nothing (P3).

### Measured after

| | phone 393 (hasTouch) | desktop 1280 |
|---|---|---|
| the shipped tour | **393**, no sideways scroll; pills 208-226 | 1280; pills 355-492, sparks 92px visible |
| one estimate pill | **393**; pill 217 | 1280; pill 413 |
| a much longer recipe | **393**; pill 252 | unchanged |

Boundary driven: at **560** both are `display:none`, at **561** both are back. Dark theme identical
(the rules carry no colour, so the dual-home palette invariant does not apply). No page errors.

The sibling `.var-pill.var-dist` renders the same `.est-spark` and is covered for free. Driven at 393
it keeps everything that matters: `$ cost ≈ 145.7 (102.2 – 201.5) ✎`, with only the spark hidden --
its `≈` is its own `.var-eq`, not `.est-eq`, so it is untouched.

### Guard-proofed

Ten mutations, each asserting its target present first (#1133): each rule removed; the breakpoint
widened so desktop loses its sparkline; the prose-mode precedent deleted; the pencil hidden; the
summary hidden; the toolbar made to wrap; the full expression stripped from the aria-label; the 44px
tap overlay dropped; the pencil made invisible on touch. **All ten red, UXP-276 red in every one.**

### Deliberately not in this change

- **The toolbar.** It works, and UXP-258 settled it. The pin asserts the narrow block does *not*
  make it wrap, so a future change cannot quietly reverse that and call it a phone fix.
- **Letting the pill wrap.** `white-space:nowrap` is the capsule silhouette the design language
  specifies; wrapping mid-capsule needs a design-language decision, not a bug fix.
- **The 44px touch targets.** ~~39 of 40 visible controls under the app's own floor (the row bullet is
  22x30) is real and stands. That measurement was about *size*, so the scroll-container error does not
  touch it.~~ **Wrong, corrected by UXP-278.** It was about size, but it measured the wrong size: a
  `getBoundingClientRect()` audit cannot see the invisible `::after` overlays this app meets the floor
  with. Hit-tested, the figure is 12 of 34 rather than 33 of 34, every one already overlaid, and the
  bullet is **32x46** rather than 22x30. 44 was never the app's stated floor either -- that is WCAG
  2.2's 24px, which every control clears. #1173 item 3 is invalid.

### Found on the way, filed not fixed

The estimate dialog's live preview has **never rendered anything**. Its callback is
`preview: v => (v.expr || '').trim()`, but the shared runner calls `f.preview(inp.value, all)` -- so
`v` is the input *string* and `'4 to 9'.expr` is `undefined`. Driven at both 393 and 1280: the
`.io-preview` div exists and is empty for a valid expression, identically, so it is pre-existing and
not caused by this change. Filed. `.est-preview-spark` is hidden here anyway, so that a phone will not
show a sparkline in the dialog for a pill that has none once the preview works (P1).

---

## UXP-277 -- the dialog preview contract, unhonoured on both sides (#1178)

**Status: FIXED.** A dialog preview is the app's answer to *"what will this do before I commit it."*
On the three number-format dialogs it did not answer, for two reasons that are one contract.

### Half 1: a callback that read its value as if it were the form

`openInsertDialog` calls `f.preview(inp.value, all)` -- the value first, the whole form second.
`openEstimateDialog`'s preview did this:

```js
preview: v => { const ex = (v.expr || '').trim(); if (!ex) return ''; … }
```

`v` is the input **string**, so `'4 to 9'.expr` is `undefined`, `ex` is `''`, and it returned `''` on
every keystroke. **The estimate dialog has never shown a preview**, and neither of its two refusals
(*"Not a valid uncertain expression"*, *"No finite samples"*) had ever rendered once. It fails with no
page error, which is why it shipped. The dialog's own hint promises *"Shown as mean ± [p5, p95] with a
sparkline."* The corroborating detail is that `.est-preview` **has no CSS rule at all** -- nobody had
ever seen the thing it styles.

**Audited all 19 `preview:` callbacks: this was the only one.** Every other takes the first parameter
as the value. So half 1 is a single site.

### Half 2: found by counting, not by report

The runner's cross-field refresh was gated on the preview COUNT being greater than one. Counted
against the real dialogs, that gate was never true where it mattered:

| dialog | previews | reads siblings from the 2nd arg | refreshed when you typed in a sibling? |
|---|---|---|---|
| `openEstimateDialog` | 1 | (could not read anything) | no |
| `openMathDialog` | 1 | `fmtOf` for the preview pill's format | **no** |
| `openColFmtDialog` | 1 | all four format fields | **no** |

**All three number-format dialogs declare exactly one preview.** So a preview only ever refreshed when
its *own* field changed. `openMathDialog` looked fine because its `bare` **checkbox** takes a separate
path; `openColFmtDialog` looked fine only if you happened to touch Decimal places last.

These are coupled, not two bugs bundled: fixing half 1 alone gives the estimate dialog a preview that
ignores the format fields sitting directly beneath it, which is the same defect again.

### Driven, before and after

| dialog | before | after |
|---|---|---|
| estimate, valid expr | `(EMPTY)` | `6.2 (3.93 – 8.86) ▃▄▇▇█▆▅▃▂▁▁` |
| estimate, then sigfigs 3 | `(EMPTY)` | `6.20 (3.93 – 8.86) …` |
| estimate, then prefix £ | `(EMPTY)` | `£6.20 (£3.93 – £8.86) …` |
| estimate, invalid `4 to` | `(EMPTY)` | `Not a valid uncertain expression` |
| estimate, `(1 to 2) / 0` | never reachable | `No finite samples` |
| math `1/3`, then prefix £ | `1/3=0.33333333` **frozen** | `1/3=£0.33333333` |
| math, then sigfigs 3 | `1/3=0.33333333` **frozen** | `1/3=£0.333` |
| column format, prefix £ alone | `1200 reads 1,200` **frozen** | `1200 reads £1,200` |

### Three deliberate calls inside the estimate fix

- **`distHeadline(sm, f)`, not the hand-rolled `estNumFmt(sm.mean) (p5 – p95)` string.** `distHeadline`
  is `renderEstPill`'s own display function, so preview and pill cannot diverge (#1115, one number one
  display) -- and being a *second* display path is precisely why the old string ignored the format. The
  `<b>` around the mean goes with it; the pill has no bold either.
- **NOT `renderEstPill`.** `openMathDialog` previews a real `renderMathPill`, which drags in an
  *"Edit formula and number format"* pencil that does nothing inside a dialog. A preview should show the
  value, not a copy of the chrome. Filed separately rather than copied.
- **Sparkline 16 -> 11**, matching the pill and `formatDist`. The one cosmetic call, a one-token revert.

### One refresh path, not two

The per-field listener was **removed**, not kept beside the new root-level one. Two registrations would
run each preview twice per keystroke, and the query dialog's previews execute real searches. Driven:
6 keystrokes produce exactly **6** preview renders. Multi-preview dialogs are unaffected because they
already had the root listener -- the query base (3 previews) and calendar (4) both stay live, and 7
keystrokes cost 27-31ms over a 300-point document.

**Ordering detail, driven rather than assumed:** the root listener fires during BUBBLING, after the
target's own handlers, which is what makes the `exclusiveWith` case correct -- #1175 blanks the partner
field with no input event of its own, and the preview still reflects the blanked value in the same
keystroke (`decimals: 4` -> type sigfigs 2 -> `6.2 (3.9 – 8.9)` with decimals empty).

### Guard-proofed

**The durable half is a class guard**, since the specific bug is one line: a test walks every
`preview:` callback in the source, resolves the `preview: monthsPrev` indirection, and asserts none
dereferences its first parameter as anything but a string member. Verified to catch the real bug by
running it against pre-fix `main`. It **throws rather than skips** on a callback it cannot resolve, and
`nonEmpty` guards the harvest -- both proven by mutation (renaming a resolved declaration goes red with
`previewCallbacks: cannot resolve`; removing every `preview:` goes red with the `nonEmpty` message).

Eight mutations red, each asserting its target present first (#1133): the `v.expr` deref restored; the
count gate restored; the per-field listener re-added; `all` dropped from the signature; the fmt dropped
from `distHeadline`; the sparkline reverted to 16; a refusal string deleted; the pill made to stop using
`distHeadline`. Plus **two negative controls green**, because a guard that fires on legitimate code is
worse than none: a preview using `v.length`/`v.slice`, and one reading the form through `all`.

### Two of my own comments tripped existing guards, which is the guards working

Writing this change's rationale turned two tests red. The #1175 call-site pin scans raw source for
`parseNumFmt(` sites and matched a **comment** quoting one; and the new runner pin asserts the absence
of the count gate, which my comment quoted verbatim. Both fixed properly rather than by loosening the
guards: the comments no longer embed literal matchable code, and the runner pin now reads the
comment-stripped `NC` view so future prose about the old form cannot disarm it.

---

## UXP-278 -- the tap floor, computed instead of asserted present (#1173 item 3, INVALID)

**Status: the reported defect does not exist. What ships is a guard and three corrections.**

### The claim, and why it was wrong

I filed #1173 item 3 as *"39 of 40 visible controls sit under the app's own 44px touch floor"*, with the
row bullet at **22x30** and the variables-panel close button at **19x14** as the examples. Every part
of that is a measurement artefact.

The probe read `getBoundingClientRect()` on each control. **This app meets the floor with invisible
`::after` overlays, which that method cannot see.** Re-measured by hit-testing outward from each
control's centre with `elementFromPoint` (which does resolve an overlay to its owner), at 393x851 with
`hasTouch`:

| | count |
|---|---|
| under 44 by **painted box** | **33 / 34** -- the filed figure, reproduced |
| under 44 by **hit area** | **12 / 34**, every one already overlaid, every one short on one axis only |

| control | filed as | actual hit area |
|---|---|---|
| row bullet | 22 x 30 | **32 x 46** (`.bullet::after{inset:-7px -5px}`) |
| Close variables panel | 19 x 14 | **65 x 58** (`.close-btn::after{inset:-10px}`) |

The close button was worse than a bad method: I measured it **while the panel was closed**, parked
off-screen by `transform:translateY(100%)`. Opened properly its hit area is 65x58 and tapping it closes
the panel, on phone and on desktop.

### The repo had already written down the mistake

`UXP-248` fixed these hit areas and says, in its own words:

> *"Measured by **HIT-TESTING, not by rect**: the guardrail explicitly allows an invisible `::after` to
> extend a target past its visual box, so a raw-rect audit would have called the conformant `.bullet`
> and `.cap-go` failures too."*

It names `.bullet` as the control a rect audit would falsely flag. That is precisely the control I used
as my headline example. **The warning was already in the register and I walked past it.**

### The second wrong premise: 44 was never the app's floor

The issue asserts *"the app uses 44px in 30 places including a min-height:44px, so this is its own
floor, not an imported guideline."* Read out, most of those 30 are toolbar heights and layout offsets,
not target-size rules. The floor this app actually **states and pins** is WCAG 2.2 / 2.5.8's **24px**
(`const GRAPH_TAP_MIN = 24`, pinned as *"the floor must name WCAG 2.2 24px"*), and UXP-248's own title
is *"the 24px tap floor holds..."*. 44 appears only as *"~44px"* in comments: an aspiration.

Against the real floor, every control clears it. Against the aspiration, most land 26-40.

### What actually was missing, and now ships

Every overlay rule was pinned by a **source-pin** -- it proves the rule is *present*, not that the
arithmetic *reaches* a floor. That is the "a source-pin proves presence, not behavior" gap `CLAUDE.md`
names, on accessibility CSS.

So: two test helpers (`parseInsetPx`, `hitExtent`) that expand a CSS `inset` shorthand like margin and
compute the resulting hit area, plus a **registry** that parses each control's box and overlay out of
the CSS and asserts the computed result. It carries, per control, the number it reaches and the REASON
it stops there -- sourced from the code's own comments, not invented:

| control | box | overlay | computed | why it stops there |
|---|---|---|---|---|
| `.est-edit` family | 26x26 | fixed 44x44 | **44 x 44** | the only control at 44 on both axes |
| `.bullet` | h 30 | `inset:-7px -5px` | **h 44** | horizontal growth is modest ON PURPOSE, so it never steals chevron or text taps |
| `.collapse-btn` | 24x30 | `inset:0 0 0 -6px` | **30 x 30** | grows LEFT and yields to the bullet, which reached back over it |
| `.md-task-check` | 24x24 | pad 40x40 | **40 x 40** | #439: a native checkbox renders no pseudo-elements, so a sibling pad is the overlay |
| `.ag-toggle` | h 22 | `inset:-4px 0` | **h 30** | its 22px height is pinned by the canon-chip test; vertical-only growth also stops it stealing a row neighbour |
| `.bm-help` | 16x16 | `inset:-5px` | **26 x 26** | **no recorded reason** -- flagged, not fixed |

Plus a ratchet on the sub-44 set (may shrink, never grow silently), and `.mt-rowh` at 22px recorded as
the one control under even 24 -- with the note that it is a `cursor:grab` **drag handle**, so 2.5.8
target size is arguably not the governing criterion, and it is on the record for a decision rather than
left out of the audit.

**Guard-proofed by seven mutations**, each asserting its target present first: the bullet overlay
deleted (the helper throws rather than skipping); the bullet overlay shrunk; the chevron pushed under
24; the pencil overlay taken off 44; `.ag-toggle` *improved* past 44 (the ratchet must force the count
to be re-stated, not only catch regressions); the drag handle's width changed; the checkbox pad's size
dropped. All seven red, and red on this guard specifically.

### Stated limitation

It computes the CSS **intent**, not contention. A neighbour's overlay winning the z-order shortens the
real reach: driven, `.collapse-btn` measures 26 vertically against the 30 computed. Green here means
"the rules add up", not "every finger lands". The comment says so.

### Corrections this entry makes

1. **UXP-276 said item 3 "survives the correction"** because it measured *size* not position. Wrong for
   a different reason -- it measured the wrong size. Corrected there.
2. **The #1173 comment made the same claim** and is corrected on the issue.
3. **`user-research-2026-07-fleet2.md`** carried the 39/40 figure as a surviving finding. Corrected,
   and the scrolling-ancestor error already recorded there now has a sibling: **a rect is not a hit
   area.** All three items of #1173 were measurement errors of mine, in three different ways.

---

## UXP-279 -- the estimate default printed `0` for real numbers, and handed `NaN` to its own teaching line (#1177)

**Status: FIXED.** Two defects in one function's blast radius, recorded as two causes.

### Cause 1: a cliff at exactly 0.001, not the edge case the issue described

From the second persona fleet, the postdoc keeping a lab notebook: `{0.00212 to 0.00294}` rendered
**`≈0 (0 – 0)`** -- a spread of zero reported for a measurement that has one. Measured, the whole
ladder of `estNumFmt(x, null)`:

| x | rendered | sig figs |
|---|---|---|
| `0.000999` | `0.000999` | 3 |
| **`0.001`** | **`0`** | **0** |
| `0.00253` | `0` | 0 |
| `0.00499` | `0` | 0 |
| `0.0124` | `0.01` | 1 |
| `0.253` | `0.25` | 2 |
| `0.999` | `1` | 1 |
| `2.48` and up | `2.48` | 3 ✓ |

Two things #1177's own framing did not have:

- **The discontinuity is exact.** The significant-figures escape fired only below 0.001, so
  `0.000999` kept three significant figures and `0.001` became a bare `0`. It protected the SMALLER
  side and abandoned the band immediately above it, which is backwards. The function printed `"0"` for
  every non-zero value in `[0.001, 0.005)`.
- **The damage ran to 1, not to 0.005.** `toFixed(2)` only carries three significant figures once
  |x| >= 1, so the entire band `[0.001, 1)` lost digits.

**And the two formatters disagreed, which makes it a P1 break rather than only a P4 one.**
`formatNumDisplay` -- what a math pill and a base column use -- never collapsed: it renders `0.00253`
as `0.00253`. So `{= 0.00253}` was correct while `{0.002 to 0.003}` read `0 (0 – 0)`. The deterministic
and uncertain sides of the same number disagreed, and the uncertain one was wrong.

### The fix: one rule below 1, and a reorder that is load-bearing

```js
if (a !== 0 && a < 1) return (fmt?.prefix || '') + String(+x.toPrecision(3)) + (fmt?.suffix || '');
```

*"Below 1, three significant figures, trailing zeros trimmed."* `String(+…)` is the trim, and it is the
split this function already recorded: the DEFAULT path trims (`5`, never `5.00`) while an explicit
decimals/sigfigs keeps its zeros because the author asked for exactly that many (#1115 / #1175).
Unifying costs one visible change below 0.001 -- `0.00004` now reads `0.00004` rather than `0.0000400`
-- and buys a rule statable in one sentence instead of two bands disagreeing at their boundary.

**The explicit-format branch moved to the top of the function, and that is not tidying.** The magnitude
escape used to run ahead of it reading only `sigfigs`, so an author's `decimals` was dropped for
anything it caught. Survivable at |x| < 0.001 (two decimals on 0.0004 is useless anyway); at the new
threshold it would have started silently ignoring `decimals: 2` on 0.253. Pinned in both directions.

### Cause 2: a display string parsed back into a number

```js
const t = Number.isFinite(mid) ? Number(estNumFmt(mid)) : 0;   // before
```

`estNumFmt` groups thousands, so `Number("700,000")` is **NaN**. That value is interpolated into the
variables dialog's teaching line -- the #1101 P2 door whose recorded purpose is to be *"copy-pasteable
rather than an abstract example the reader has to translate."* Driven on `main`, it was broken in **two**
ways, the second of which I had not predicted:

| declaration | the line taught | pasted into a point |
|---|---|---|
| `{cost := 100000 to 200000}` | `chanceover(cost, NaN)` | **stayed raw text**, never promoted to a pill |
| `{cost := 1200 to 1800}` | `chanceover(cost, NaN)` | stayed raw text |
| `{cost := 0.002 to 0.003}` | `chanceover(cost, 0)` | `=100` -- valid, and worthless |

So at money scale the reader got literal braces in their document, and at lab scale a threshold of zero
("100% chance of being above 0"). Now derived from the number:

```js
const t = Number.isFinite(mid) ? +(+mid.toPrecision(3)) : 0;
```

Never NaN, never a display string, and rounded to something a reader would type: a median of `149823.4`
teaches `150000`, not `149823`. **There was no test on that line at all**, which is why it shipped.

### Driven, before and after

| | before | after |
|---|---|---|
| `{0.00212 to 0.00294}` | `0 (0 – 0)` | `0.0025 (0.00212 – 0.00292)` |
| `{0.0124 to 0.0253}` | `0.02 (0.01 – 0.03)` | `0.0181 (0.0125 – 0.0254)` |
| `{0.253 to 0.999}` | `0.54 (0.25 – 1)` | `0.548 (0.25 – 0.981)` |
| teaching line, money | `chanceover(cost, NaN)` | `chanceover(cost, 144000)` -> pasted, `=46.1` |
| teaching line, lab | `chanceover(cost, 0)` -> `=100` | `chanceover(cost, 0.00248)` -> `=45.9` |

**The pasted line is the acceptance test**, not the rendered one: a line whose whole purpose is to be
pasteable is only fixed once pasting evaluates.

### Two recorded decisions checked rather than assumed

- **The scientific tail is deliberate.** #1115 pins `estNumFmt(0.00000012)` as scientific ("a genuinely
  tiny number stays scientific"). It survives: `String(+(1.2e-7).toPrecision(3))` is `1.2e-7`. **An
  earlier draft of this change proposed removing exponentials outright**, before that pin was found.
- **`estNumFmt` reaches persisted text**, through `formatDist` -> `frozenTokenText`, which freeze-to-text
  and prose export write into `node.text`. So a freeze produces different bytes now -- more digits, not
  fewer. #1175's display-only fence names `formatMathResult` and `replaceConvert`, not this, so no
  constraint moves; but a document frozen before and after will differ, and that is worth knowing.

### Guard-proofed

Eight mutations, each asserting its target present first (#1133): the 0.001 threshold restored; the trim
dropped; 2 significant figures instead of 3; the escape put back ahead of the explicit-format branch;
`Number(estNumFmt(mid))` restored; the non-finite fallback allowed to propagate NaN; the scientific tail
broken; and rounding added to `formatMathResult` -- which the existing **#983** pin caught, confirming the
lossless fence still bites. All eight red.

**Two existing pins rewritten, not loosened**, both predicted: `estNumFmt(0.00253, null) === '0'` (which
I wrote in #1175 *to lock the collapse* while noting a default change was not that PR's business) and
`estNumFmt(0.00004, null)`'s untrimmed form. Each carries the reason.

### The comment trap, third occurrence

Writing this change's rationale turned its own negative assertion red again -- the comment quotes
`Number(estNumFmt(mid))`, which the guard forbids. Same failure as #1178's runner pin and the #1175
`parseNumFmt` call-site pin. Fixed the same way: the negatives read the comment-stripped `NC` view, plus
an assertion that `NC` still contains the source so they cannot pass by reading an empty string.
**Three PRs, three recurrences: a negative assertion on raw source is a landmine for the next author's
comment.** Worth generalising if it happens a fourth time.

---

## UXP-280 -- a dialog preview stops inviting a click it cannot answer (#1181)

**Status: FIXED.** `openMathDialog` previews its expression by rendering a **real pill** through
`renderMathPill`, which dragged the pill's interactive chrome into a dialog where nothing is wired to it.

### The filed issue named one affordance; driving found two

| element in `.io-preview` | what it announced |
|---|---|
| `.math-edit` | `role="button"`, `aria-label="Edit formula and number format"`, matching `title` |
| `.math-roll` (the preview pill itself) | `title="Click to edit the formula or number format."` and the same clause inside its `aria-label` |

So the preview invited a click **twice**, while the reader was already inside the dialog that click would
have opened. On touch it was worse: `@media(hover:none)` makes the pencil a visible 26px chip with a 44px
tap overlay, so the dead target was prominent.

**Both were genuinely inert** -- clicked in a browser: dialog unchanged, document unchanged, no page
error. Nothing delegates to preview content, because a preview is `innerHTML` from a string and no
handler is ever attached. So this is "announces an action it has not got", not a broken action.

**Surveyed all 19 `preview:` callbacks** with the walker built for #1178: exactly **one** calls a pill
renderer, and **none** emits `role="button"` or `<button>` directly. `varBasePreviewHtml` is clean too.
One call site, and the guard now freezes that count.

### The fix, and the duplication it retires

`renderMathPill(key, m, opts = {})`. Two hoisted constants -- `pencil` and `editTip` -- gated on
`opts.preview`, interpolated at the 5 and 4 sites that used to carry them verbatim.

**Hoisting rather than adding conditionals is the point.** The pencil span was written out **five times**
and the click invitation **four** (title + aria on two branches). An existing pin's own comment said
*"the two branches are separate string literals and have drifted before: assert they still agree"* -- one
constant makes that drift impossible, so the guard changed from counting occurrences to asserting the
constant. **A drift-guard replaced by the absence of drift.**

**And the copies had already drifted**, which is why that pin existed: three wrote the pen glyph as
`<i class="fa-solid fa-pen">` and two as `<i class="fa-solid fa-pen" aria-hidden="true">`. The span
carries the accessible name, so the glyph is decorative and `aria-hidden` is correct -- now canonical in
one place.

### Driven, before and after

| | before | after |
|---|---|---|
| preview: `[role=button]` count | 1 | **0** |
| preview: `.math-edit` count | 1 | **0** |
| preview: any "Click to" | yes | **no** |
| preview pill's aria-label | `Math 2 + 2 = 4. Click to edit the formula or number format` | `Math 2 + 2 = 4.` |
| preview still a pill, with the format applied | yes | **yes** -- `£4` after typing £ in Prefix |
| the REAL pill's title / aria / pencil | -- | **byte-identical**, and the pencil still opens the dialog |

Driven at 1280 and at 393 with `hasTouch`. Also drove the **empty-rollup branch**, which is reachable
from a preview (`sum(cost)` with no matching props) and also emitted a pencil: 0 buttons, 0 pencils, and
it still shows *"No cost below this point. Move the pill onto the parent…"*. The preview drops the
action and keeps the explanation, which is the right split.

### Guard-proofed

Seven mutations, each asserting its target present first (#1133): the flag dropped at the call site;
`pencil` unconditional; `editTip` unconditional; a **sixth** verbatim copy of the span re-inlined; the
pencil removed from the **non**-preview path too (fixing the preview by breaking the pill must go red);
the format-door wording dropped from the clause; and `aria-hidden` dropped from the glyph.

**The last one passed green on the first run**, which is the finding worth recording: I had consolidated
on `aria-hidden` and asserted it *in a comment* with nothing enforcing it. A claim in a comment is not a
guard. Added, then re-mutated: red.

### The comment trap, generalised on its fourth occurrence

UXP-279 said this was *"worth generalising if it happens a fourth time."* It happened twice more in this
change alone -- the call-site comment quotes `role="button"`, which the new class guard forbids in a
preview body, and quotes `{ preview: true }`, which the #1178 dialog count read as a third declaration.

So it is generalised rather than patched again: **`previewCallbacks` now returns a comment-free `body`**
(the raw text stays available as `raw`). Every assertion over a preview body is immune at once, instead of
each one being fixed separately. Residual limit, stated in the code: a `//` inside a regex literal would
still be stripped, the same trade `NC` makes.

`previewCallbacks` also gained a literal skip: #1181 introduced `{ preview: true }` as an **option flag**,
which the walker had been reading as a callback declaration and throwing on. A literal is not a callback;
an unresolvable *identifier* still throws, which is the case the loud failure exists for.

### Found on the way, not fixed

- **The real pill's tooltip has a double period** -- `"…number format.. Right-click for more…"`. Verified
  pre-existing on `main` (the clause ends in `.` and the right-click hint prepends `. `). Cosmetic, in a
  tooltip, and outside this change's cause. Left alone deliberately rather than silently tidied.
- **`.io-preview` is announced to nobody.** It has no label and no live region, so a screen-reader user
  gets no signal that it updated. A naive `aria-live="polite"` is the wrong fix: these previews update on
  **every keystroke**, and a polite region firing per keystroke is a known anti-pattern. Filed with that
  reasoning, so the next reader finds an argument rather than an oversight.

---

## UXP-281 -- dialog previews are named, and deliberately do not announce (#1184)

**Status: FIXED (the naming half). The announcement half is a recorded decision, not an oversight.**

A preview exists to answer *"what will this do"* before you commit. That answer was delivered visually
only: `openInsertDialog` built each one as a bare `<div class="io-preview">` with no role and no name,
so a screen-reader user met it as loose text after the field, across ~12 dialogs.

### The owner's call: label it, do not announce it

The obvious one-line fix -- `aria-live="polite"` -- is **wrong here**, and that is the substance of the
decision rather than a footnote. These previews re-render on **every keystroke**; #1178 made that the
point, so a preview tracks the whole form as you type. A polite live region on a per-keystroke target
produces a stream of interruptions that trained users switch off, trading silence for noise.

So: **naming ships, announcing does not.** Announce-on-settle (debounced, ~700ms) is the better answer
and remains open, but it is new machinery whose interval is a taste call that wants measuring against
real screen-reader behaviour rather than picked. Recorded here so the next reader meets an argument.

### `role="group"` is load-bearing, and this is why it was measured

A bare `<div>` maps to role **`generic`**, and ARIA-in-HTML **prohibits naming on generic** -- an
`aria-label` there is spec-invalid and inconsistently exposed. `group` supports a name and carries no
live semantics, which is exactly the requirement.

**Measured before assuming, and the measurement argued against the shortcut:** in Chromium a bare
`<div aria-label="...">` *does* surface as `{role: "generic", name: "..."}`. One engine exposing it is
not support, and shipping on that would have been a source-pin's worth of confidence in a behaviour
that varies across AT. `group` resolves correctly and is spec-valid.

### Driven, in the real accessibility tree

Not the DOM attribute -- `page.accessibility.snapshot()`, which is what AT actually consumes:

| dialog | accessible node |
|---|---|
| math | `{role: group, name: "Preview: Expression"}` |
| estimate | `{role: group, name: "Preview: Uncertain value"}` |
| variables (**hand-built**, not through the runner) | `{role: group, name: "Preview: Value (optional)"}` |
| calendar (**four previews**) | `"Preview: Months, one per line"`, `"Preview: Week"`, `"Preview: Era, optional"`, `"Preview: Today in this world"` |

The calendar row is why the name includes the **field** rather than a bare "Preview": four identically
named groups in one dialog would be worse than none. The name says where the preview *sits* -- it may
reflect sibling fields too (#1178), so it is not a claim about which single input it reads.

**Two creation sites, not one.** `openVarDialog` builds its fields by hand rather than through the
descriptor runner, so it needed the same treatment or it would have stayed the one silent preview in
the app. The guard freezes the count at two.

### Also tidied, because the naming made it matter

`openColFmtDialog`'s callback returned `<span class="io-preview">` **inside** the div that already
carries the class -- so `.io-preview` appeared twice in one subtree. Visually harmless (the div's
`margin-top`/`min-height` do not apply to an inline span), but it would make the named group ambiguous
to read and leave a selector-based guard unable to tell the two apart. #1184 flagged it; removed here.

### Guard-proofed

Seven mutations, each asserting its target present first (#1133): the role dropped (leaving a
spec-invalid name on a generic); the name dropped from the runner; the hand-built dialog left unnamed
(the partial fix); `aria-live` bolted on; `role="status"` used instead, which *implies* a live region;
the class re-nested; and a **third** unnamed preview site added. All seven red.

The negative assertions read the comment-stripped `NC` view, per the generalisation UXP-280 made -- this
change's own comment quotes every attribute it forbids.

---

## UXP-282 -- CI runs the icon build script, and compares meaning rather than bytes (#1166)

**Status: FIXED.** Owner's call on #1166: **option A**, a scheduled job that runs the real script and
diffs, keeping PR CI offline.

### The gap

`#1144` cross-checks three lists against each other and against the shipped font -- `ICONS` in
`tools/build-fa-subset.py`, `FA_GLYPHS` in `index.html`, and the `.fa-NAME::before` rules. That is
strong, and it caught real drift. What it cannot check is whether **the script still produces those
bytes**, because nothing in CI ever executed it. The guard's answer key is a file the guarded change
edits, so a script that has stopped working passes every test until a human happens to rebuild.

Two bugs shipped through that gap: **#1144** (the allow-list edited without a rebuild, painting a blank
button) and **#1155** (`subset.Options(flavor="woff2")` silently ignored for the script's entire life,
so every payload shipped as uncompressed sfnt under a `format("woff2")` declaration -- found by reading
fontTools' source, not by any test).

### The measurement that changed the design

The issue proposed "run the script and diff its output". **Measured first, and a byte diff cannot
work.** Re-running the script here against the shipped tree:

| | generated | shipped | result |
|---|---|---|---|
| `FA_GLYPHS` line | 1236 B | 1236 B | **identical** |
| everything in the block except the payloads | -- | -- | **identical** (78 rules, all CSS) |
| face 1 payload | 9084 B | 9104 B | differs |
| face 2 payload | 1400 B | 1372 B | differs |
| face 3 payload | 904 B | 896 B | differs |
| face 1 / 2 / 3 **codepoints** | 77 / 6 / 1 | 77 / 6 / 1 | **identical sets** |

That is woff2/brotli compression nondeterminism across tool versions, not drift: same glyphs, same
rules, different compressed bytes. **A byte-diff job would have been red on day one and every day
after** -- a permanently failing check that says nothing, which is worse than no check.

So the comparison is SEMANTIC, in `tools/verify-fa-embed.py`:

1. the non-payload text of the `fa-embed` block, **byte-identical** (catches a stale `ICONS`, a changed
   or lost rule, a hand edit never rebuilt)
2. the `FA_GLYPHS` line, **byte-identical** (this IS the #1144 bug)
3. per face: the decoded cmap, **set-equal** (catches a subset that silently dropped or gained a glyph)
4. per face: still genuinely `wOF2` (this IS the #1155 bug, checked directly)

What it does **not** prove is byte-reproducibility, and the file says so rather than implying it -- the
#1132 precedent for admitting a residual limit in the code.

### Why scheduled rather than on every PR

The script fetches upstream `.ttf` sources, and the rest of this repo's CI is offline and fast. Adding
a network dependency to every PR is easy to do and hard to undo. Weekly plus `workflow_dispatch`
catches drift long before it matters, because the icon set changes about once a release.

**With one exception, which is the half that makes it bite:** a PR that touches
`tools/build-fa-subset.py` or the verifier **does** run the job on `pull_request`, because that is
precisely the change whose effect nothing else can see.

### Proven to bite, at both levels

**The verifier, against a throwaway tree** (6 mutations, control green first):

| mutation | result |
|---|---|
| `FA_GLYPHS` edited without a rebuild (**#1144**) | caught |
| a payload reverted to raw sfnt (**#1155**) | caught |
| a `::before` rule hand-edited | caught |
| an `ICONS` entry removed | caught |
| an `ICONS` entry added | caught |
| the build script itself raises | caught (exit 2, distinct from a mismatch) |

**The job, against the suite** (11 mutations): schedule deleted; verifier not invoked; `workflow_dispatch`
dropped; fonttools not installed; both `paths:` entries dropped; the cmap decode removed; the wOF2
assertion removed; the non-payload comparison neutered; the stated limit removed; the bug citations
removed. All red.

### Two harness errors of mine, recorded because they nearly produced false confidence

- **The first mutation run reported `fail=10` for every mutation with no #1166 test named.** That was
  the harness failing for unrelated reasons (a partial tree missing files the suite reads), not the
  guard biting. I had skipped the control run. **Re-done with a full tree and a control asserted green
  first** -- which is the discipline #1133 exists for, applied to my own scaffolding.
- **A genuine hole, found only because of that redo:** dropping the `paths:` filter passed green,
  because my assertion matched `tools/build-fa-subset.py` **anywhere in the file** and it also appears
  in the workflow's own header comment. The same comment trap as UXP-280, in a new costume -- a
  file-wide match where a scoped one was meant. Now reads the `paths:` list via `between(...)`.
