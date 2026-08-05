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

**A "Found on the way, filed not fixed" block owes a forward pointer when the thing it filed ships.**
Three of them went stale within days of being written (UXP-275, UXP-276, UXP-280), each still
asserting a live defect that had already been closed -- the #1107 failure mode, where a stale claim
becomes the next reader's false premise. The convention: **append a dated `**Shipped (date): … as
UXP-NN**` line, never edit the original paragraph.** The original is evidence of what was known at the
time; the pointer is what the next reader acts on. Same reasoning as UXP-275's own correction: "filed
separately" in a register is a claim someone will act on.

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

> **Superseded (2026-07-30) by UXP-285.** This section's conclusion no longer holds. The copy-only
> fix below shipped, and a six-person panel then bounced **6 of 6** on the same screen. The tour is
> no longer the first screen at all: a fresh boot opens a Welcome chooser, and the tour is one pick
> inside it. This section asked that any divergence be argued rather than made silently, so the
> argument is written out in UXP-285. Everything below stays as evidence of what was known in July,
> and its measurement of the old first screen is still the sharpest record of why it failed.

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

**Shipped (2026-07-30): #1177 is closed, as UXP-279.** The correction above is itself now stale --
it says "now filed", which was true for about a day. Measured during the fix, the collapse is worse
than either sentence above: `estNumFmt` printed `"0"` for **every** non-zero value in `[0.001, 0.005)`,
and the digit loss ran all the way to 1, not to 0.005. The pin here that locks the collapse was
rewritten there, carrying its reason.

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

**Shipped (2026-07-30): filed as #1178, closed as UXP-277.** The paragraph above is preserved as
written, but read it as history rather than as a live defect -- the preview renders now, and the
`.est-preview-spark` rule this entry added has something to hide. Widened on the way: a static audit
found a second half the report did not know about (the runner's cross-field refresh was gated behind
`_previewFns.length > 1`, so **none** of the three number-format dialogs had ever had one).

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
  **Shipped (2026-07-30): filed as #1184, closed as UXP-281** -- the naming half only. The argument
  above held on measurement: previews are named (`role="group"` + `aria-label`) and deliberately do
  **not** announce. A bare `<div>` maps to role `generic`, which prohibits naming, so the role is
  load-bearing rather than decorative.

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

---

## UXP-283 -- the sequence IS the status vocabulary (#1148)

**Status: FIXED, and the fence stays shut.** Owner's call on #1148: **option A** -- the declared
sequence is the vocabulary, so the missing piece is discovery, not a value-set.

### The measurement that located the gap

The issue framed this as "nothing tells you which values are intended." Driven on the planner's own
setup, it is sharper and smaller than that:

| status column holds | inferred role |
|---|---|
| `IN_PROGRESS`, `DONE` | `status` |
| `IN_PROGRESS`, `in progress` | `status` (#1114's `normStateKey` folds it) |
| `IN_PROGRESS`, **`blocked`** | **`null`** |
| `blocked`, `stuck` | `null` |
| `IN_PROGRESS`, `` (empty) | `status` |

**One unknown value collapses the whole column to no role.** And `showCellEditorPop` -- the chip picker
that lists the sequence's states -- only renders for a column whose role IS `status`. So the affordance
that would have shown the author the vocabulary appears only once the column is already entirely valid:
**discovery was gated on having already discovered.**

### What was actually missing

#1114's refusal already named the offending values and taught the fix. What it did not know is **what
vocabulary already exists**. With `{seq Flow: TODO IN_PROGRESS | DONE}` declared and one stray
`blocked`, it still said *"Declare them once, like {seq Flow: TODO IN_PROGRESS | DONE}"* -- telling the
author to do the thing they had already done. The same not-followable shape #1114 was written to fix,
one layer in.

So `boardBlockReason` takes a 5th **positional, optional** parameter (`seqs`), and when a real sequence
is declared it names that one instead of the generic example:

> before "Status" holds values that are not states yet: "in progress", "blocked". Declare them once,
> like {seq Flow: TODO IN_PROGRESS | DONE}, then mark the column.
>
> after  "Status" holds values that are not states yet: "blocked". **Flow offers TODO, IN_PROGRESS,
> DONE. Use one of those, or add it to that sequence.**

Two details that are measurements rather than taste:
- **Which sequence gets named:** the declared one covering the most of the column's values. A measure,
  not a guess; ties fall to the first declared.
- **The DEFAULT `To-do` sequence is never named** as "the vocabulary". Nobody declared it, so pointing
  at it would be unfollowable advice in a new costume -- the exact failure being fixed. With nothing
  declared, the generic example is correct and stays.

### Why this stays inside the §0.5 fence

`base-views-vision.md` §0.5 defers a status role that *"offers its known values **and** constrains the
editor"*, noting its value-set *"needs a `knownStates`-style collected cache."*

This change hits none of that. It **offers and never constrains**: no editor is gated, nothing is
rejected, every value keeps landing exactly as before. It **invents no cache**: `knownStates()` and
`collectSequences()` already exist and already feed the inference. And it adds **no data model** -- the
vocabulary is a sequence the author wrote in their own document.

Freeform still wins (`product-identity.md` §3b): typing a new value works, lands and shows. It just now
gets told what else is on offer. A pin asserts the message never says *not allowed / invalid / must be
one of / rejected*, so a future edit cannot quietly turn the offer into a gate.

### Driven, end to end

Acceptance is **following the advice**, not reading it: with `Flow` declared and a stray `blocked`, the
message names Flow's states; adding `BLOCKED` to the sequence makes the column infer as `status` and
**Board opens**. The unchanged fallback still fires when nothing is declared.

### Guard-proofed

Seven mutations, each asserting its target present first (#1133): the `seqs` argument dropped at the
call site; the default sequence allowed to be named; the first declared picked instead of the
best-covering; the generic example forced always; the state list dropped from the message; the plural
agreement dropped; and the offer reworded as a constraint. All seven red -- the last one is the fence
guard, and it is the one worth keeping.

One existing pin was **updated rather than loosened**: #1114's call-site assertion named the exact
4-argument call. It now names the 5-argument one, because the point of that line is that the gate hands
the core everything it needs to be specific.

---

## UXP-284 -- a mirrored section says it exported as a title line (#1142)

**Status: FIXED.** Owner's call on #1142: **option A** -- keep the title, report the count.

### The loss

A caption-less `[[#id|]]` **alone on a line** transcludes the target's whole subtree on screen, up to
`MIRROR_ROW_CAP = 40` rows. Every text export ships **one line**: the target's title. So a document
assembled from mirrors -- a reasonable way to build a manuscript or a review from parts -- exports as a
table of contents rather than the thing the author was looking at, and says nothing.

Driven on a two-mirror document with three rows behind each:

```
on screen   [[#chapter3|]]  ->  Chapter 3 / Scene 1 / Scene 2 / Scene 3
exported                     ->  - [Chapter 3](#jn8miy7i)          (and no Scene rows at all)
```

#1111 made that reference honest -- it records where it pointed. The **rows** were still gone silently.

### Why report rather than inline

Inlining trades one silent loss for another: the same subtree mirrored twice duplicates in the file,
and the 40-row cap becomes an **invisible truncation inside a document**. UXP-237 named this shape when
it refused to settle the footnote question in passing -- *"a content decision about someone else's
file"* -- and set the precedent used here: do the lossy thing and report it.

> Exported a copy: "notes.md". **2 mirrored sections exported as a title line, not the rows. Export Web
> page to keep them.**

**Not `flat`-gated, unlike the link sentence.** A mirror flattens in markdown exactly as in plain text,
because #1111 fixed the link *layer* and not the transcluded rows. Gating it on the plain-text door
would have left the markdown export silently lossy, which is the whole defect. The Web page export is
genuinely unaffected -- it round-trips the token and re-transcludes live -- so it is the format named.

### One regex, two users

`MIRROR_LINE_RE` now lives beside `MIRROR_ROW_CAP` and is used by **both** the renderer's
`_mirrorBlockLine` gate and `countMirrorRefs`. Two copies could drift, and a drifted count would be a
confident lie about a file the author is about to send someone. A pin asserts exactly four occurrences:
one declaration, two users, one comment.

The counter mirrors both its siblings' rules: it skips `noexport` subtrees (a mirror that was never
going to be exported did not change), and it counts only what actually transcludes -- a captioned link
is a reference, a solo link to a **leaf** is just a link, an unresolvable target costs no rows, and the
gate is per LINE so a solo token inside a multi-line point counts.

### The hole mutation found, and the fix it forced

**"Drop the report entirely" passed green.** The test asserted the source contained
`const mr = countMirrorRefs(...)`, and the mutation left that line intact while killing the `if` that
used it. A textbook pin-that-cannot-fail: it pinned that the count is COMPUTED, never that it REACHES
the output.

Fixing it properly required a change to the code, not just the test: `exportedNote` now takes an
optional `findNode`, threaded to `countMirrorRefs`, **solely so the count is testable DOM-free** --
`nodeById` reads the live index, which does not exist in plain Node. Both app call sites omit it and
get the real index. With that, the pin asserts the actual output string on a real tree, and the
mutation goes red.

That is the second time this session that making something properly testable required a small
production change (the first was `collectVars`' optional `rootNode`). Worth noting as a pattern: when
the only available pin is a source pin, the function usually has an untestable dependency worth
injecting.

### Guard-proofed

Eleven mutations, each asserting its target present first (#1133): the count gated on `flat`; the
report dropped; `noexport` no longer skipped; captioned links counted; leaf targets counted; plural
agreement dropped; the keep-them format unnamed; the renderer and counter given separate regex copies;
the report always singular; and the count off by one. All red.

One existing pin **rewritten rather than loosened**: `#917`'s wiring assertion named the inline regex
literal, which moved into the shared constant. The claim is unchanged -- `mdInline` still stamps the
gate per line -- and it now names the constant.

## UXP-285 -- the front door explained the app instead of opening onto the user's own work (#1192, #1193)

**Status: FIXED.** **P2-2, P4-2.** Supersedes UXP-269's "the fix is framing, not ordering".

### Why this reverses UXP-269 rather than extending it

UXP-269 read two of six personas correctly and prescribed one framing line above the die. That line
shipped. The 2026-07-30 panel of six briefed laptop users then hit the **same screen** and bounced
**6 of 6** -- every panelist reported nearly leaving inside the first thirty seconds. That is a
larger sample, on the fixed build, failing worse. UXP-269 explicitly asked that any divergence from
its conclusion be argued rather than made silently, so:

**The copy-only fix could not have worked, because the objection was not to the wording.** A framing
sentence is still the app talking about itself. What every panelist wanted was to see their own kind
of document. One line of better prose above a die does not supply that; a document in their domain
does. UXP-269's own measurement is what makes this legible in hindsight: it recorded that the first
screen held "4 dice/coin, then 9 budget, and nothing else", and correctly noted the researcher was
describing it *accurately*. The remedy it chose changed the caption on that screen, not the screen.

### What the panel actually converged on

- **Propagation was the moment that landed with everyone,** including the two who never want a
  number: change one cost, and the total, the remainder and a check all move. It was buried below
  the meta-explanation and the dice.
- **"A file you own, offline, no account" was the widest-reaching fact,** and reached the two
  non-compute panelists hardest. It was barely stated anywhere on the first screen.
- **Four of six hit "someone has to build the machine first, and that's me."** The `STARTERS` gallery
  answers exactly that, and it was invisible on first run: reachable only through a button on an
  onboarding banner. That half is **#1193**.

### The fix: a chooser, not a caption

A fresh boot now opens a **blank document with a Welcome chooser over it**. The chooser is the
existing starter-gallery modal in a welcome mode -- same `io-card`, same `.tpl-pick` rows, same
Escape and focus handling -- carrying an identity line, six everyday domain starters, and explicit
**Start with a blank document** and **Poke a live example** picks. The tour is now one choice among
several rather than the forced default. No new syntax, no new surface, no new loader (P5): every
pick routes to `insertStarterSubtree`, `startBlankOutline` or the tour path that already existed.

**§3c holds: it is an invitation, not a gate.** Escape, the backdrop and the Close button share one
handler, and all three land the user on the blank canvas with the caret in the first point. There is
no "you must choose", no re-nag, and no value gated behind the pick.

### The bug a source pin would have shipped

The chooser needed a gate meaning "pristine: do not autosave, do not put the caret behind the modal".
The obvious candidate was `_showingExamples`, the flag UXP-126 already uses for the tour. **Driving
the running app is the only reason that is not what shipped.** `markDirty` clears that flag on any
mutation by design, including the internal ones that building a *blank* document performs: `render`
mints the first empty point through `createChildModel`, and the next render blurs it through
`commitActiveEdit`. Both fire during boot. The flag was therefore false by the time boot finished,
so the boot focus pass put the caret in the document *behind* the modal -- which took focus off the
overlay that owns the Escape listener, and **Escape stopped closing the chooser**.

That is the #1021 dead-handler shape, and every source pin over it was green: the handler was
present, wired and correct, and simply never received the event. It took two rounds in a headless
browser to find, one per clearing site. The fix is a dedicated `_welcomeOpen` flag that nothing else
touches, raised by `openStarterGallery` and lifted by `closeIo`, so every exit path lifts it exactly
once. It is a hoisted `var` for the #854 reason: `closeIo` and `adoptDoc` are declared thousands of
lines above it and both run during the boot restore.

A second ordering fact fell out of the same work and is pinned: the chooser must open **before** the
blank adopt, because `mkRoot` carries `docId: null`, so `adoptDoc` mints one and calls
`scheduleAutosave` -- and the gate has to already be up to catch it. Otherwise a first run nobody
touched saves itself, and the chooser never appears again.

### Guard-proofed

Twelve mutations, each asserting its target present first (#1133): the forced-tour first run
restored; the autosave gate removed; `closeIo` stopped lifting the gate (**twice** -- commented out
*and* deleted); the boot focus pass stealing focus behind the modal; a starter pick no longer
clearing the pristine gate; the quick picks turned origin-majority; the picks stripped of their
accessible name; the boot tail painting the examples banner again; the blank-canvas invite painting
behind the chooser; an async restore leaving the chooser floating over the restored document; the
ownership fact dropped from the identity line; and the chooser opening after the adopt. All red.

**One of them initially reported a false pass, and the pin was rewritten rather than the mutation.**
`closeIo` was pinned with `includes('_welcomeOpen = false;')`, so commenting the statement out still
satisfied it -- the substring survives inside the comment. Anchored to the line start instead, both
the commented and the deleted form go red. Same lesson as UXP-269's false pass, one level in: the
guard on the guard is the part that quietly cannot fail.

### Driven, not just pinned

Headless Chrome, storage cleared per case: the chooser appears on a fresh boot with focus on its
first pick; a Project tracker pick loads a live document whose total moves `315` to `1,035` and whose
budget check flips `✓check` to `✗check` when one cost changes (the panel's moment, reproduced);
Escape and the Close button both land on the blank canvas with the caret in the first point, and
typing there autosaves; a reload takes the returning-user path with no chooser; the tour pick loads
the tour with its Start-blank banner unchanged. Layout swept 320 to 1280 with no overflow, both
themes, and `Tab` reaches the blank door in 12 presses with `Enter` activating it.

## UXP-286 -- the welcome chooser hid its own options and the menu kept two doors to one room (#1192 follow-up)

**Problem (P2 discoverability).** UXP-285 shipped the welcome chooser but its layout did not scale to
the number of choices, and the File menu was left with two example doors that now overlap.

- **The list did not scale.** All 14 picks (12 starters + blank + tour) rendered into one 400px-wide,
  single-column `.tpl-list` capped at `max-height:260px`. Driven at 1400px, only ~3-4 rows showed;
  the other ~10 sat in a hidden inner scroll, and because the "More worked examples online" link sat
  directly under the truncated list, the list **read as finished at "Reading log"** with no cue more
  existed. It was also a **double scroll** -- the card at `82vh` and the list at `260px` -- and it
  wasted most of a wide viewport in a 400px column.
- **The two structural doors were buried.** "Start with a blank document" and "Poke a live example"
  were the last two rows of the same undifferentiated scroll, visually identical to the twelve
  templates. A user who wanted to just start writing or take the tour had to scroll past everything.
- **The menu had two doors to one room.** `btn-examples` ("Add the Welcome tour") inserted the same
  FIRST_RUN_EXAMPLES content the chooser now offers as "Poke a live example"; `btn-starters` ("Start
  from an example") opened the *identical* `openStarterGallery` component the first-run welcome uses.

**Rule.** P2: an option a skimmer cannot see is not discoverable; a truncated list that reads as
complete is worse than one that shows its scroll. DL §4: use the horizontal space a wide surface
gives. §3c: the chooser stays an invitation, unchanged in flow.

**Target, shipped in the same PR.** The welcome variant of `openStarterGallery` is now a wider card
(`#io-card.welcome{width:640px}`, `max-width:calc(100vw - 32px)`) with three labelled groups, each a
responsive grid (`grid-template-columns:repeat(2,minmax(0,1fr))`, collapsing to one column at the
app's own 560px narrow-sheet breakpoint): **Popular** (the six `WELCOME_QUICK_PICKS`, IA-8 mix
preserved), **More templates** (the rest), and a set-apart group for the two structural doors. The
welcome `.tpl-list` drops the `max-height` cap so the card's own `82vh` is the single scroll -- no
more false bottom, no double scroll. The menu-mode gallery and the pack editor's own `.tpl-list` are
untouched (the rules are scoped to `#io-card.welcome`). No new color token: the only palette token
added is `var(--muted)` for the eyebrow headers, already dual-homed, so the dual-home invariant is
N/A. The redundant `btn-examples` menu row is retired (its content lives on as the chooser's "Poke a
live example"; `openExamples()` itself stays -- the blank-canvas invite banner still calls it), and
`btn-starters` is reworded "Start from an example" to **"Templates & examples"**, reconciled across
the storage-warn door button, the guide body, the guide synonym, and the tour's own reference.

### Guard-proofed

`#603`'s menu inventory drops `btn-examples` (intentional retirement, noted in the pin). The `#1192`
chooser pin, which asserted the old flat `quick.concat(STARTERS.filter(` list, now asserts the three
groups by name and order (`addGroup('Popular')` before `addGroup('More templates')`, the doors group
after both) and that the two doors land in the doors container (`}, doors)`), not a template grid.
Proven by revert: renaming `addGroup('Popular')` turns the pin red.

### Driven, not just pinned

Headless Chrome, storage cleared: fresh boot at 1400px shows a two-column grid under **Popular** and
**More templates** with the blank/tour doors set apart under **Or**, all reachable without an inner
scroll; a Project tracker pick loads its live document; at 390px the grid collapses to one column,
full width, no horizontal overflow; the File menu shows only "Help & guide" and "Templates &
examples". `node --test tests/test.mjs` green at 1831.

---

## UXP-287 -- a computed value inside a branch truncated the pill, unless you left out the space (#1354)

**Status: FIXED.** Found in a deep evaluation of the grammar engine's composition surface. Three
independent investigations reached the same root cause, and the parse was read directly before any
code moved.

### The defect

```
{cost := 2400}{budget := 2000}
Total {cost > budget: OVER by {= cost - budget} | under}
```

rendered **`Total {cost > budget: OVER by`** -- a well-formed grammar pill showing a truncated,
brace-unbalanced fragment of its own condition, tooltip *"Click to re-generate"*, no cue. Same in a
repeat: `{2x: {= 1+1}}` -> `{2x:`. **Deleting the space fixed it**: `{1 > 0:{= 1+1}|x}` -> `2`.

### The cause: two recorded decisions colliding

`parseAlt`'s dynamic-weight capture was `([\s\S]+?)`, which may span `}`. A conditional or repeat is
promoted as `origin: {BODY}`, so the body's OWN closing brace is the last character of the string and
the lazy capture ran to it:

```
parseRules('origin: {cost > budget: OVER by {= cost - budget} | under}')
  -> { template: "{cost > budget: OVER by",  weightExpr: "cost - budget} | under" }
```

A5 (dynamic odds, 2026-06-14) made a trailing `{= expr}` a weight; A3 (conditional text, same day)
made `{cond: then | else}` a brace body. A5's note argued its ambiguity was *"the same
accepted-ambiguity class as the trailing-number weight it extends"* -- true of the weighted
alternation it was written for, and never tested against a conditional body.

**The hazard was already known and defended in exactly one place.** `templateAttempt` carries a
guard whose comment names it: *"the body must not end in a whitespace-separated `{= …}` group
(parseAlt reads that as a dynamic WEIGHT, **which would silently truncate the template**)."* Glue
templates were protected; the conditional and repeat paths were not.

### The fix

A weight is a math expression and `evalMath` is number-only by contract, so a legitimate weight never
contains a brace. Fencing the capture to `[^{}]+?` is the whole change. The mirroring guard in
`templateAttempt` is narrowed identically and the two are pinned as a pair -- one rule, two sites.

Driven in the running app: `Total OVER by 400` / `Total under`, `{2x: {= 1+1}}` -> `2 2`, a computed
value in the else arm (`only 4 left`), the A5 dynamic weight still weighting (hp=9 favoured its alt
12/12), a plain alternation still varying, a glue template still one pill, zero page errors.
`node --test tests/test.mjs` green at **1990**.

### A pin of mine that could not fail, caught by mutation

The first draft of the lockstep pin asserted `[^{}]` appeared in each function. Reverting
`templateAttempt` left the suite **green**: the string `[^{}]` also appears in the explanatory comment
I had just written beside the code. The same comment trap this register has recorded before. Both arms
now assert the whole regex fragment (`{=\s*[^{}]*\}`), which prose cannot satisfy, and both mutations
were re-run and go red -- with the control asserted green first.

### Why it mattered

"Compute a number, then say it in the branch" is the second most-wanted conditional capability in the
persona research (~9 of 17 personas want a sentence shaped like *"OVER by `{= sum(cost) - budget}`"*).
It also explains why the documented crit-check example survived -- `Success ({= r + mod})` is
parenthesised, so no whitespace precedes `{=` -- while every natural money sentence died.

---

## UXP-288 -- a conditional could not read what a math pill on the same point read fine (#1356)

**Status: FIXED.** The most-wanted conditional capability in the persona research, and a P1 inversion:
the same name meant one thing in `{= }` and nothing in `{cond: }`, on one point.

### The defect

```
Math reads it: {= hp}                ->  hp = 3
Cond reads it: {hp > 1: ok | hurt}   ->  no match yet        (same point, prop hp: 3)
```

Same for a rollup and a query. Nkechi's *"if the plate cost goes over a third of the menu price, say
REPRICE"*, Devin's over-budget flag, Adeyemi's grade bands on a `score` property, Kofi's
`chanceover` threshold -- **8 of 17 personas** wanted a threshold on a rolled-up or property-backed
number, and in every case the number was already computable one pill to the left.

### The cause: a scope asymmetry, not a missing engine

`{= }` resolves against `resolveNodeScope(node, ancestorsOf(node), collectVars())` and pre-passes the
expression through `expandAggExpr(expr, node, vars)`. The conditional arm called
`evalMath(cond, ctx.vars)` -- document variables only. `resolveNodeScope` had nine call sites and
none was the grammar path. There was no workaround: `{spent := sum(cost)}` also renders unresolved.

### The fix

Both halves of the math pill's scope, applied at the one site, in its order. `cookieNode` was
already in scope three lines above.

**And the BRANCH gets the same scope, not just the test.** Widening only the test shipped a new
inconsistency in place of the old one -- driven, `{hp > 1: {= hp * 2} left | none}` took the correct
branch and then rendered `? left`, because the branch's own `{= }` still resolved through `ctx.vars`.
Same scope on both sides of the colon, or the form is half-alive. That was caught by driving, not by
reading.

### Driven

Own numeric property, own prop beating a same-named doc variable, `sum()`, `avg()`, `count("query")`,
Nkechi's REPRICE sentence, Adeyemi's nested grade bands, a computed value inside a branch. Unchanged:
document variables, a text condition on a text variable, an undefined name still showing its marker, a
roll still driving the test, and #1354's computed-value-in-a-branch. Click-to-re-judge re-runs and
returns the same verdict (a conditional is not random). Zero page errors. Suite green at **1991**.

### Stated, not claimed

- **A TEXT property still cannot drive a string condition.** `nodePropVars` keeps numeric props only,
  so `{mood == "angry": …}` on a point with `mood: angry` still refuses. Verified, and deliberately
  not papered over.
- **An ANCESTOR property does not reach a child's conditional -- and does not reach a child's `{= }`
  either.** Measured both: `resolveNodeScope`/`ancestorsOf` return the right scope when called
  directly, but a child's `{= tension}` reading a parent's property does not promote in the first
  place. So this change reaches PARITY with the math pill rather than falling short of it; the
  remaining gap is older, shared, and filed separately.

### Why it could not be pinned purely

`cookieNode` is a render-time module `let`, not a ctx field, so the vm sandbox cannot set it and
`resolveBrace` cannot be driven into the widened path from Node. The pins are therefore a CALL-SITE
source pin (resolveNodeScope + expandAggExpr + the string arm + the branch + the node-less fallback)
plus the driven run above -- and the entry says so, because a source pin proves presence, not
behaviour. Five mutations, each asserting its target present first against a control asserted green:
all five go red, and dropping the node-less fallback additionally reddens an existing `depsOut` test,
which is what makes that arm demonstrably load-bearing rather than defensive.

---

## UXP-289 -- an attempted test stops being a coin flip (#1359)

**Status: FIXED (the unambiguous half).** The worst class in the register: output that looks right
half the time.

### The defect

`condParts` requires a real comparison so detection stays syntactic. A body that missed that gate did
not stay put -- it fell through to the ALTERNATION branch, and `{COND: THEN | ELSE}` froze as a 50/50
pick between the literal strings `"COND: THEN"` and `"ELSE"`, rendered as an ordinary pill with a
*"Click to re-generate"* tooltip. Measured, 10 renders of `{and(a, b): both | not both}` with
`a = b = 1`: `and(a, b): both` x6, `not both` x4.

**This is a bug class the repo had already diagnosed and closed once.** The typed-rule note records
it verbatim: a bare `{loot: sword | shield 2}` promoted to *"a pill that displayed 'loot: sword' half
the time, with no error."* That was closed for rules by making the `rule ` keyword mandatory. The
conditional half of the identical hazard was left open.

### The remedy is the recorded one

KEYWORD-COMMIT, the shape `seq`/`rule`/`shuffle`/`markov`/`prop` already carry: once the text commits
to being a test, a tail that will not parse is an ATTEMPT, never prose. The tells are a **closed set**
and every one is a character or word a rule NAME can never contain, so `{name: a | b}` is untouched
**by construction** and no resolution lookup is involved (P1):

| tell | the mistake |
|---|---|
| `≥ ≤ ≠` | evalMath maps them; `condParts`' sniff never listed them |
| `\|\| &&` | the programmer's reflex for the connectives |
| a single `=` | `==` was meant |
| `and`/`or`/`not`, or any `fn(` | the logic functions, which DO evaluate; only the sniff blocked them |

### Three sites, not one

1. `classifyBraceBody` -> `'invalid'` (the CUE).
2. `promoteBraceBodyIn` -> `null` (the PILL). **Wiring only the first left the live app still
   coin-flipping** -- classify and promotion are separate walks with separate orders, which is
   exactly the separation that let a body classify one way and promote another. Found by driving.
3. `parseActionPill` -- and this one is the sharpest. `{danger = 5: yes | no}` parsed as an ACTION
   (target `danger`, rhs `5: yes | no`) and rendered a **clickable** pill promising *"Click to apply:
   set danger to 5: yes | no"*. A typo that MUTATES a variable, which is the worst outcome available
   to a misread body. The fix sits beside the guard already there for its sibling case (*"a bare `=`
   that is really the head of `==` is a comparison, never an assignment"*) -- the same reasoning, one
   step further -- and is brace-depth-aware, so `{hp -= {roll: #trap}}` still parses.

### Deliberately NOT closed

- **A bare identifier on the left** (`{done: finished | still going}`) is genuinely ambiguous with the
  inline rule definition. The record is explicit that ambiguity of this kind is settled by a reserved
  keyword, not by inference, so closing it needs the truthiness FORM decided and signed off. It stays
  a coin flip here, named rather than fudged.
- **A multi-word left side with no tell** (`{mood is angry: yell | calm}`). Widening to "any left side
  that is not a valid name" would reclassify prose-ish bodies and is its own decision.

### Driven

All five shapes now render one stable outcome with a specific, followable cue (typed symbols, `||`,
single `=`, logic-fn-without-comparison, and a colon inside a quoted search). Unchanged: real
conditionals, real string conditionals, plain alternations, the inline rule definition, prose, and
every legitimate action pill including one embedding a braced colon. Zero page errors.
`node --test tests/test.mjs` green at **1995**.

### A pin the mutation harness corrected

Six mutations; five bit immediately and one did not -- dropping the rule-name exclusion changed
nothing, because none of my "must not claim" strings actually needed it. It exists for a rule
literally *named* `and`, `or` or `not`, whose bare name matches the tells. Those three cases were
added and the mutation now goes red. A guard nobody can break is a guard nobody is testing.

---

## UXP-290 -- a conditional stops borrowing the roll family's "no match yet" (#1361)

**Status: FIXED.** The reason already existed one function away; only the wiring was missing.

### The defect

Any conditional whose test would not resolve rendered **`no match yet`**, tooltip *"Nothing matched
yet. Click to try again, or add points that fit."* Every clause is wrong for a conditional: nothing
was being MATCHED (a name failed to resolve); adding points cannot help; a conditional is not random,
so "try again" re-judges to the same answer; and the failing term was never named although
`resolveBrace` had already computed it into the `{hp > 0?}` marker.

Cause: `renderGrammarPill` funnels every `{…?}` marker through one branch shared with `{roll:}` --
the CSS comment says so outright, *"a roll/cond that matched nothing"*. There was a `badFilter` arm
that sniffs `g.def` for a `{roll:}` and swaps in a specific reason; there was no conditional arm.

### The fix borrows rather than mints

`condEmptyMessage(cond, vars)` answers in the conditional's own terms and takes its explanation from
**`mathReasonPhrase`** -- the same phrase the `#ERR` pill and the `/check` dialog already speak -- so
an unresolvable name reads one way everywhere (P1). Four branches, each measured:

| case | what it says |
|---|---|
| numeric, name missing | *Could not read the test "hp > 0": a name with no value here. A property is read from this point and the points above it…* |
| numeric, reads now | *"hp > 0" has a value now, but this was judged before it did. Click to re-judge* |
| text, name missing | *…A text test compares a name with a quoted word, so the name needs a value.* |
| text, reads now | the re-judge message |

**The "reads now" case is the one the shared branch could never explain.** A conditional written
ABOVE the variable it reads freezes unresolved on load (promotion walks top-down) and ONE CLICK fixes
it. It is derived from whether the test reads *now*, deliberately NOT from the `stale` flag: a pill
that never resolved recorded no deps and is therefore never stale, which is exactly why the old
branch suppressed the "inputs changed" tail and left that user with advice to add a value that
already existed.

### Two bugs of mine, both caught by checking rather than reading

1. **An HTML-attribute break, and a latent hole it exposed.** The `cta` reached `title=` and
   `aria-label=` **unescaped**. That was safe only while no cta could contain a quote; mine
   interpolates the test text, so `{mood == "angry": …}` broke the title attribute outright. The
   roll's `badFilter` already interpolated user query text, so the hole was latent, not new. Both
   sites now `escQ` the cta -- identity for every quote-free cta, so nothing else moves. `escQ`'s own
   comment invites exactly this: *"a correct attribute escape is never wrong here."*
2. **`mathErrorReason` returns `''`, not `null`,** for an expression it finds nothing wrong with.
   Testing `=== null` inverted every branch and produced a confident, plausible, wrong sentence -- a
   numeric condition explained as a text test. Found by walking all four cases, not by reading the
   code. The comment now says which test is correct and why.

### Driven

A failed numeric condition, a failed text condition, a condition declared after its variable, a
working conditional (untouched), a `{roll:}` that matched nothing (keeps its own copy), and a
`{roll:}` with an unreadable filter (keeps its specific UXP-232 reason -- the ordering that protects
it is pinned, and reversing it reddens that test too). Zero page errors.
`node --test tests/test.mjs` green at **1997**.

---

## UXP-291 -- a quoted query keeps its colon, so predicates reach the test (#1363)

**Status: FIXED.** The lexical collision that capped the whole predicate area.

### The defect

`splitTopLevel` tracks brace depth alone, and the conditional used it to find the boundary between
its test and its answers. A `:` inside a quoted search therefore split first:

```
splitTopLevel('count("is:todo") > 0: yes | no', ':')
  -> ['count("is', 'todo") > 0', ' yes | no']
```

The test lost its comparison and the body was refused (a coin flip before #1359, a visible refusal
after). `#tag` queries have no colon and were fine, so the gap was invisible until you reached for a
FIELD filter -- and `is:` / `has:` / `tag:` are exactly the predicates worth testing. The same applied
to `|`: `condParts` rejects a condition carrying a top-level pipe, which is how it tells a conditional
from an alternation, so `count("#a | #b") > 0` was out too.

### Why it mattered more than its size

The app is already a predicate language: points are the domain, `#tag`/`is:todo`/`has:owner` are unary
predicates, juxtaposition is AND, `|` is OR, `-` is NOT, and `count("q")` is a counting quantifier.
What it could not do was combine that layer with the conditional, because the two use the same
character for different jobs and one did not respect quoting. Anything built on top -- quantifier
names, a host-point predicate, any function taking a quoted query -- would have hit the same wall.

### The fix is scoped, deliberately

`splitCondTop` is quote-aware and is used by **only the two splits that decide what the CONDITION
is**: the `:` boundary and the `|` check. `splitTopLevel` itself is untouched -- it is shared by
templates, alternations, decks and rule bodies, where a quote is ordinary prose and protecting it
would change unrelated behaviour.

**The ARM split stays plain, and that is recorded rather than accidental.** Arms are grammar
templates; `{c: he said "a | b" | none}` is genuinely ambiguous, and a quote there is prose. Pinned as
such, so a later reader does not "finish the job" by mistake.

### Driven

`{count("is:todo") > 0: …}` discriminates (`yes, still some` with an open item, `all clear` without).
The forall spelling `{count("is:todo -has:owner") == 0: …}` discriminates (`every one` / `some are
not`). A pipe inside a quoted query discriminates. A colon inside a compared value (`code == "a:b"`)
matches. Unchanged: plain `#tag` counts, numeric and text conditionals, the inline rule form, prose
with a colon, a `{roll:}`, and an unclosed quote still refusing. Zero page errors.
`node --test tests/test.mjs` green at **1998**.

### Two measurement errors of mine, both caught by a control

The first acceptance run showed the new capability parsing but answering wrongly. Both were fixtures,
not the app:

1. `mkNode('[ ] write copy')` leaves `type: 'ul'` -- the type is derived at adopt/edit, not by
   `mkNode`. Exonerated by a control: a plain `{= count("is:todo")}` on the same document also
   returned 0, and `queryHits` returned 0 directly.
2. Even typed, `[ ] x` is not what `is:todo` matches. **`is:todo` means the `#TODO` STATE keyword**,
   not a markdown checkbox (`deriveTypeFromText('[ ] x')` returns falsy here; `#TODO x` returns
   `todo`). Measured across the filter set: `is:todo` 1, `is:done` 0, `#x` 1 on a mixed document.

### A pin the mutation harness corrected, again

Five mutations; four bit immediately. Dropping the unbalanced-quote fallback left the suite green,
because the test string I chose (`count("is:todo) > 0: …`) also trips the `fn(` tell and stays an
attempt without it. The fallback is load-bearing for a body with an unclosed quote and **no other
tell** -- `mood == "angry: yes | no`, where `==` is excluded from the single-equals pattern. That case
was added and the mutation now goes red.

---

## UXP-292 -- a point can be asked what it IS, not only what it counts (#1365)

**Status: FIXED.** The largest measured gap left in the persona research, and the last structural
seam between the query language and the conditional.

### The defect

The app knows a great deal about every point -- its tags, its state, whether it is done, overdue,
owned -- and exposes all of it as search predicates. But only ever about OTHER points, through
`{query:}` / `{roll:}` / `count("...")`. A conditional could test a NUMBER and nothing else:

```
[x] Bins out {is:done: ✓ | ☐}                            -> "☐"        (it IS done)
Ellen #unverified {#unverified: NEEDS SOURCE | verified}  -> "verified"  (it IS unverified)
```

Both were coin flips. Six of seventeen personas asked for this in their own words -- Ruth's *"if this
record is unverified, say NEEDS SOURCE"*, Rosa's *"if this item is done, show ✓"*, Bea's chore line,
Marcus's clock, Sam's open question.

### The shape, and why it is a name rather than a form

`here("query")` -> 1 when the host point matches, 0 when it does not.

- **It reuses the search predicate language wholesale.** No second vocabulary to invent or keep in
  sync; `#tag`, `is:`, `has:` all work because it is the same parser. The per-node matcher already
  existed (`queryMatchesNode`, which `nodeMatchesSearch` already calls for a one-off live check) --
  `here` is the door onto it from the expression layer.
- **It returns 1/0**, so a predicate becomes a first-class proposition: it composes with
  `and`/`or`/`not` and with arithmetic.
- **A NAME, not a delimiter** -- the charter's sanctioned growth. It rides `expandAggExpr`, so what
  reaches `evalMath` is a scalar and the number-only contract is untouched.
- **`count` asks about the points below; `here` asks about this one.** Scope is the host point alone,
  pinned so a later edit cannot quietly widen it into a second `count`.

### The half that had to come with it

`{here("is:done"): ✓ | ☐}` still would not promote, because `condParts` required a comparison. That
requirement exists to keep detection syntactic and to stay clear of the inline rule definition
`{name: a | b}` -- but **that ambiguity is only real for a BARE IDENTIFIER**. A rule name cannot
contain a paren, so a call carries its own tell and needs no marker. `condParts` now accepts a bare
function call as a test, which also turns three shapes that were coin flips (and then, after #1359,
refusals) into real conditionals: `{and(a, b): …}`, `{or(a, b): …}`, `{not(x): …}`. `evalMath` always
evaluated them correctly; only the sniff was in the way. It also gives the ∃ form without the
comparison: `{count("is:todo"): still going | all done}`.

**The bare identifier stays out**, which is exactly the ambiguity a marker would have to settle.

### Driven

Ruth's and Rosa's sentences both answer correctly and discriminate. `here()` composes
(`{and(here("#risk"), cost > 1000): escalate | note it}` flips on the cost). Scope proved: a tagged
CHILD gives `here` 0 and `count` 1 on the same parent. Unknown and empty queries answer 0. `here` as
a plain VARIABLE still works. Zero page errors. `node --test tests/test.mjs` green at **2000**.

### A pin that could not fail, and a guard that could not either

- The first draft asserted the regex STRING was present in `expandAggExpr`. Disabling the arm
  (`if (false)`) left the suite **green**, because the replace line still carried the string.
  `expandAggExpr` turns out to be fully drivable in the sandbox, so the pin is BEHAVIOURAL now --
  it feeds real nodes and reads `(1)` / `(0)`.
- Mutation also showed the empty-query guard was **dead**: `queryMatchesNode` already answers false
  for an empty term list. Rather than keep a line nobody can break, the guard is removed and the
  CONTRACT (`here("")` is 0, never vacuously true) lives in the test, so a future change to the
  matcher fails loudly instead of being absorbed.

---

## UXP-293 -- a bracket in a search stops returning a confident zero (#1367)

**Status: FIXED.** Found while checking whether quantifier names were worth adding. They were not,
and this is what the measurement turned up instead.

### The defect

```
has:owner | #x            ->  3   correct
(has:owner | #x)          ->  0
is:todo -(has:owner #x)   ->  0   (the correct answer is 3)
```

Brackets carry no meaning in the search language, so the whitespace split turns `(has:owner | #x)`
into the TEXT terms `"(has:owner"` and `"#x)"`, which are searched for literally and match nothing.
`searchTermProblems` said nothing, because it only inspected terms of `kind:'invalid'`.

### What the measurement killed, and what it found

The plan was `every`/`some`/`none`, justified by "a negated compound is inexpressible". **That
justification did not survive contact.** Measured:

```
NOT(B AND C):  is:todo -has:owner | is:todo -#x    ->  3   correct
NOT(B OR  C):  is:todo -is:done -has:owner         ->  1   correct (De Morgan)
```

Propositional logic over predicates is **already complete** -- juxtaposition is AND, `|` is OR, `-`
is NOT, and distributing by hand covers the rest. Quantifier names would have been pure sugar over a
spelling that works, so they are not built. Brackets are convenience too; the only harm they did was
failing silently, which is what this closes.

### The fix, and why it is a refusal rather than a parser

A grouping parser would touch the query parser shared by the search box, query pills, rolls, counts
and the folder scope -- real risk for an ergonomic gain, in a language that can already express
everything. So: a visible reason that names the working form. If grouping is ever wanted, this
refusal is the thing to replace and nothing about it forecloses that.

Detection is an **unbalanced** paren inside one term, which is exactly what the whitespace split
leaves behind. A BALANCED `(a)` stays one term and is a legitimate literal search for that text --
spared, and pinned as spared.

### Three surfaces, and the gate that hid one

The roll and the query/count pill picked the reason up immediately. The **search box did not**, and
driving is what found it: `renderSearchProblems` has a fast-path gate that only calls
`searchTermProblems` when a term is `kind:'invalid'` -- a performance guard, with its own pin. So the
box explained `is:bogusstate` and stayed silent about a bracket, which would have made it the one
surface that never says (P1). The gate now admits a bracket as well, and stays cheap: the added test
is a paren scan over already-parsed term values, so a bracket-free query still walks nothing.

**Its pin was rewritten, not loosened.** It asserted the literal `some(t => t.kind === 'invalid')`;
it now asserts the INTENT -- the gate still leads with the invalid test, admits a bracket, and is
never unconditional.

### The typing courtesy

While typing, an unclosed `(` is probably a group still being written, so nothing is said until the
brackets balance ACROSS the query while a single term stays unbalanced -- which is precisely the
finished grouping attempt. Driven: `(`, `(has:owner`, `(has:owner |` are all silent; `(has:owner | #x)`
speaks. A committed pill passes no `typing` flag and is told at once.

`node --test tests/test.mjs` green at **2001**. Five mutations, all red against an asserted-green
control, including flagging balanced parens (over-reach) and narrowing the search-box gate back.

---

## UXP-294 -- a formula written before its value stops being refused forever (#1357)

**Status: FIXED.** The last open finding from the third laptop fleet, and my own issue got the cause
wrong. #1357 said an ancestor's property "does not reach a child's `{= }` pill" and suspected the
promotion path. Driven, ancestor scope works perfectly. What is broken is **when**, not **where**.

### The defect: promotion is one-shot

`promoteInlineShorthand` runs once, at commit. A `{…}` whose names were not resolvable at that moment
stays raw text and nothing ever retries it. Measured on `bcf6890`, each case typed through the real
editor on a fresh page:

| the reader types | then supplies the value | before | after |
|---|---|---|---|
| `{= tension}` under a parent | `tension: 7` on the parent | `{= tension}` forever | `tension=7` |
| `{= hp}` then `{prop hp: 3}` on the same point | (same commit, left to right) | `{= hp}` forever | `hp=3` |
| `{= cost}` under a point | `{cost := 40}` declared above | `{= cost}` forever | `cost=40` |

The same three, typed in the other order, all worked already. So the engine was never the problem.

**This is the sharpest shape a cue can fail in: the app's own coaching, followed exactly, does
nothing.** The `.brace-attempt` sentence #1159 wrote says *"move it here or to a parent, or declare it
as a variable"*. A reader does that and the text does not change. Nkechi, the bistro owner, in the
fleet record: *"It said it was not recognised. I assumed I had the wrong app for this and moved on."*
The only recovery was to re-enter the point and blur it again, which nobody has a reason to do.

### The fix

`retryPendingBraces(from)` re-runs **`promoteInlineShorthand` verbatim**, rather than re-deriving what
is promotable. That is the whole safety argument: the code-span escape hatch, the #916 anti-shred
guards and the quoted-literal rule hold by construction, and a retry can never promote something the
original commit would not have. Driven and confirmed unchanged: prose braces stay prose, `` `{2d6}` ``
in inline code stays literal, `{"a | b"}` stays literal, and a frozen dice pill keeps its number.

Called from `exitEdit`, gated on the **names** changing (`nameSetSignature`), never the values --
`{= tension}` promotes just as happily against `tension=0`, so a value edit must not cost a sweep.

**Scoped to how far each kind of name reaches**, which is the same rule `resolveNodeScope` already
applies when reading: a doc variable is visible document-wide, a property only down its own subtree.
That is not tidiness, it is the whole cost story. On a 3,200-point document holding 200 unpromotable
braces:

| commit | whole-document sweep | scoped sweep |
|---|---|---|
| changes no names (ordinary typing) | 2.4 ms | **2.4 ms** (never sweeps) |
| adds a property | 43 ms | **1.7 ms** |
| declares a variable | 48 ms | 48 ms (a doc-wide name genuinely needs the document) |

Scanning all 3,202 points costs 0.26 ms; the sweep costs ~0.2 ms per *unpromotable brace*. So the
price is per dead brace, not per point, and a brace pre-test would buy nothing. 200 dead braces is a
deliberately harsh fixture; a realistic document has a handful.

**Undo order is load-bearing.** The retry's rewrites are recorded AFTER the user's own edit, so the
first undo takes the pills back off and the second takes the value away. The other order would leave
one undo showing live pills whose value had just been removed, which reads as breakage.

**P4:** the promotion happens away from the caret, so it reports -- *"One point was waiting for that
value. It works now."* Driven: fires exactly once per commit, and not at all when nothing promotes.

### Two things deliberately NOT fixed here, both measured

- **A conditional does not un-freeze on its own.** `{tension > 5: tense | calm}` promotes at once
  (`condParts` needs no resolvable name), renders `can't tell yet`, and still reads `can't tell yet`
  after the property arrives. **Clicking it gives `tense`** -- so it is following the recorded P1
  sign-off that a generative pill changes on click, not failing. Not touched.
- **Undoing a `{prop k: v}` promotion leaves the property behind.** Measured on `origin/main` before
  this change: undo restores `node.text` to `"Scene"` and `props` still holds `tension=7`. A text
  undo entry restores text; the props sidecar is not in it. Pre-existing, orthogonal, filed.

### A harness trap this found

`fnBody` slices a function by counting braces, so a `'{'` **string literal** in the body defeats it
and the pin silently reads a much larger region. My first version had one, and a pin asserting the
function does *not* call `promoteBraceBody` passed against a window that included the next function's
comment. Removed the literal here; the general case is filed.

`node --test tests/test.mjs` green at **2005**. Twelve mutations, each with a uniqueness-checked
anchor, all red -- including swapping the reach rule, dropping the recursion, dropping the live-editor
guard, dropping the caret-map restore, and discarding the sweep's result while keeping its gate. Two
of my own pins were vacuous until mutation caught them: one anchor appeared twice in the file so the
mutation edited a different site, and one pinned the gate expression without pinning that its result
was assigned.

---

## UXP-295 -- the point-and-click doors appear while you are building the list (#1281)

**Status: FIXED.** #1281 is the panel's most-repeated wall (5 of 7, re-flagged at 6 of 7) and four PRs
have shipped against it: `+ Total` (a04fdd0), `+ Check` (07ad30c), reducer and property-key chips in the
compute dialogs (16059a8), spreadsheet paste. The owner's own status comment called the door "verified
working live". Driven on `e631e52`, it is not reachable in the state a person is actually in.

### Three causes, one symptom, all in the same place

**1. The doors are built once, while a ROW is built, and a commit never rebuilds a row.**
`buildRow`'s `if (!opts.searchCtx) { maybeAddRowAffordance… }` line is the only caller. `exitEdit`
repaints `.node-content` innerHTML, and `repaintComputedDependents` does the same for its worklist; the
affordances live on the ROW, outside both. Measured: after three `{prop cost: …}` rows were typed and
committed, the DOM held **zero** `.addrow-affordance`, while calling `maybeAddRowAffordance` by hand on
that same parent produced `+ Add`, `+ Total`, `+ Check`. Only a full `render()` ever surfaced them, which
means a reload or a fold toggle. "Verified working live" was almost certainly verified on a reloaded doc.

**2. A trailing blank row took the shape to null.** `inferRowShape` counts a key as a column only when
every row carries it. Pressing Enter after the last item leaves an empty point, which is exactly where a
person stops typing:

| the list | shape | doors |
|---|---|---|
| three priced rows | `cost:number` | + Add, + Total, + Check |
| the same three, plus the blank the last Enter made | **null** | **none** |

**3. `created` and `edited` were columns.** Every real point carries them, so they passed the
"on every row" test. Driven, the `+ Add` form asked a non-technical user to fill in **"Created"** and
**"Edited"** beside "Description" and "Cost". The pure pins never caught it because their fixtures are
hand-built objects with no timestamps -- the exact gap a fixture that is tidier than reality leaves.

### The fix

`refreshRowAffordances(nodeId)` re-runs the same three door builders the row builder calls, clearing
first so a second commit cannot append a second `+ Total`. Called from `exitEdit` for the ids
`affordanceDirtyIds(node, parent)` returns: the point itself (its own `+ property` / `+ Card` read its
own text) and its parent (whose `+ Add` / `+ Total` / `+ Check` / `+ Variance` all read the shape across
its children, which the commit just moved). A row that is not mounted is left alone -- virtualization
will build its doors the normal way.

`inferRowShape` drops placeholder rows (no text and no non-timestamp property) and never treats a
timestamp key as a column.

### Driven

All three realistic endings now open the doors (no trailing blank, one trailing blank, heading parent),
the `+ Add` form is **Description + Cost**, and clicking `+ Total` still writes `sum(cost)=5.05` on a
4.10 + 0.55 + 0.40 list. Regressions: four commits in a row do not double the doors; an ordinary prose
outline stays door-free (the #1330 pre-filter holds); focus stays inside the edited point while typing,
so the caret invariant is untouched.

**Deliberately not changed:** a list where one row is unpriced still shows no `+ Total`. There is no
column to total yet, and inventing one would be the silent-wrong-total #1284 asks to prevent. The
adjacent ask -- flag the rows that are MISSING the property -- is that issue's, not this one's.

`node --test tests/test.mjs` green at **2008**. Seven mutations, uniqueness-checked anchors, all red,
including letting timestamps be columns, refreshing the point but not its parent, and dropping the clear
so the doors double.

---

## UXP-296 -- what an edit repaints, and what it silently leaves behind (#1373)

**Status: FIXED.** Found by a driving pass rather than a report. The two previous fixes (UXP-294,
UXP-295) were both "built once, never refreshed", so instead of guessing at more instances the whole
class was hunted mechanically: perform a real action, commit it, snapshot the outline DOM, force the
`render()` a reload would do, and diff. **Anything that differs is something the user is looking at
that a reload would change.** Twenty actions driven across two waves.

### Finding 1, the severe one: a property you attach is invisible

Typing `Olive oil {prop cost: 6.20}` and committing left the screen reading **"Olive oil"**:

```
mid-typing  : "Olive oil {prop cost: 6.20}"
AFTER COMMIT: "Olive oil"                       props: ["cost=6.20"]     <-- the screen
after reload: "Olive oil  | cost | : | 6.20"    props: ["cost=6.20"]
```

The brace is consumed into `node.props`, so the text the user typed vanishes and **nothing takes its
place** until a reload. It does not read as a silent success; it reads as if the typing had been
eaten. A point that already had a chip was no better: the row survived and simply never gained the
second one. A `{date due: …}` rides the same row, so a due date was invisible too.

Attaching a property is the mechanism the entire compute story rests on (#1281, the panel's most
repeated wall, 6 of 7). This is a strong candidate for why it kept being reported as "fiddly" no
matter how many doors shipped: Fiona's *"MORE fiddly than a spreadsheet cell"*, Ruth's *"pick a row,
type a number, and it just labels it as cost"*. You could not see the label appear.

**Cause:** `buildRow` puts the chips on a SIBLING row (`.node-props-row`), and the only incremental
repaints in the app are `content.innerHTML = renderContentHTML(node)`. Everything outside
`.node-content` was unreachable. UXP-295 had already found the doors; the chips are the same gap,
one row over. `refreshRowAffordances` is generalised to `refreshRowChrome` and rebuilds both.

### Finding 2: the pill-tooltip policy escaped every incremental repaint, in both directions

The tier policy (Standard/Lean strip the teaching tooltips; Guided adds the #1116 pointer to the
pill's other door) was **one post-render sweep over `vlist`**, and its own comment conceded the
reason: *"the title lives in each renderer's HTML string; no single chokepoint."* Driven:

| tier | after render | after an edit | after reload |
|---|---|---|---|
| guided | `Click to re-roll. Right-click for more…` | **`Click to re-roll`** | `Click to re-roll. Right-click for more…` |
| lean | *(no title)* | **`Click to re-roll`** | *(no title)* |

Guided loses the teaching; **Lean, which is reading mode and strips these deliberately, gets them
BACK** until the next reload. So the same pill behaves differently depending on whether you happened
to edit nearby, which is the P1 break. Fixed by making the sweep a scoped
`applyPillTitlePolicy(scope)` and calling it at all **nine** repaint sites.

**The durable half is the class guard**, because nine sites and one sweep is exactly the shape that
drifts: a test collects every `.innerHTML = renderContentHTML(` line in the source and fails unless
each one re-applies the policy on the same line.

### Finding 3: the double period, now explained

`PILL_MENU_TIP` opens with its own `'. '` and was concatenated blind, so a title already ending in a
period printed `format.. Right-click` and `)).. Right-click`. Spotted twice earlier in the session on
two different pill types and never chased; it is one shared join, now `pillTitleWithMenu`, which
absorbs the trailing period and is idempotent (required, since the policy is now re-applied per
repaint).

### What the pass cleared

18 of 20 driven actions match a reload exactly: indent, outdent, move, delete, tick a to-do, add a
tag, add a footnote ref, add an image, flip a check, change a value another point totals, gain a
child, lose a child, remove the last property. **The two non-matches were my own harness**, and both
are recorded rather than filed: the "note" action set `node.note` in JS instead of using the editor
(the real `commitNote` calls `render()`), and the "heading" one differed only in class-attribute
ORDER (`has-children nt-h2` vs `nt-h2 has-children`), verified identical once sorted.

**A method note worth keeping:** the first run of the probe used `TAB` without a preceding `ENTER` in
several fixtures, which indents the point itself instead of making a child. The documents were not
what the case names claimed, so some "clean" results were not evidence of anything. Corrected and
re-run before any of the above was believed. A detector is only as good as its fixtures, which is the
same lesson finding (c) of UXP-295 taught from the other direction.

`node --test tests/test.mjs` green at **2010**. Eight mutations, uniqueness-checked anchors, all red,
including unpairing a single repaint site (the class guard catches it), dropping idempotence, and
restoring the double period.

---

## UXP-297 -- fnBody stops brace-counting through strings, comments and regexes (#1370)

**Status: FIXED.** `UI: none` -- `tests/` only.

`fnBody(src, name)` slices a function by counting `{` and `}`. A brace inside a string, a template
literal, a comment or a regex is not a brace, so a body containing one never balanced. Measured
across the 268 functions the suite pins:

| | |
|---|---|
| pinned functions | 268 |
| slices that ran past the next top-level declaration | **10** |
| of those, slices that swallowed the rest of the file | **8** |
| worst | `mdInline`, **2,337,234** chars against a real 20,080 |

The causes were brace literals in strings (`'{'`), in regexes (`/[`[!{*_~:^#]/`) and in **comments**
(`// String literal: {"text"} is literal text`).

### The measured result contradicts what I expected, and that is the finding

The hazard is a POSITIVE assertion: on a runaway slice it can pass by matching text in a completely
different function. So the expectation was a crop of newly-red vacuous pins. **With the fix in place
the suite stayed green at 2010.** No existing pin was depending on the overshoot -- authors write
pins against the code they are looking at, and that code was inside the function. The bug was real
and benign, and saying so is more useful than implying a save that did not happen.

The value is therefore entirely forward-looking, which is the #1133 rule applied to the helper rather
than to any one test: a pin can no longer be written against a runaway slice.

### An error of mine that nearly became the record

My first mask handled `${…}` with a flat depth counter instead of a stack, so it ended `mdInline` and
`renderGraph` **mid-interpolation**. That produced **21 red tests**, and every one of them looked
exactly like a vacuous pin being caught. It would have been easy, and completely wrong, to "fix" 21
pins to match a broken helper. What caught it was checking the slice TAILS rather than the red count:
a correct slice ends `…return s;\n}` at column 0, and those ended `style=\"${escQ(sz.style)}`.

Acceptance is now that check, run over all 268: **260 end on a column-0 closing brace**, and the
other 8 are legitimately different shapes (2 deliberately-absent names that pin the throw, 3
one-liners ending `; }`, 3 IIFE tails).

### Guard

A test walks every `fnBody(_src, 'NAME')` in the suite and fails if a slice runs more than 400 chars
past the next top-level declaration. Four of five mutations are red, including reinstating the naive
counter. The fifth -- dropping the template-literal arm -- stays green, because a `${…}`
interpolation's braces balance either way and today's source has no template whose TEXT holds an
unmatched brace. That arm is correct in principle and unexercised in practice; the residual is stated
in the test rather than implied away (the #1132 precedent).

`node --test tests/test.mjs` green at **2011**.

---

## UXP-298 -- undo takes back a property the text cannot carry (#1369)

**Status: FIXED.** Found while driving #1357's undo behaviour, confirmed pre-existing on `origin/main`
at the time, and filed rather than bundled.

### The defect

A `{prop k: v}` / `{date k: v}` brace is **consumed** into `node.props` and leaves no inline token.
The `text` undo entry restores `node.text` and nothing else, so one undo un-typed the brace while the
value stayed:

```
after : { text: "Scene ", props: ["tension=7"] }
undo  : { text: "Scene",  props: ["tension=7"] }   <-- the property survived
```

**#1374 raised the stakes rather than causing them.** Before it, the orphan was an invisible record;
now it is a visible chip on a point whose text says nothing about it. The same change that made
attaching a property legible made failing to un-attach it legible too.

### The fix, and why it is scoped to props alone

A text entry may now carry `{ prev, next }` JSON of the point's property list, restored through the
same `[dir]` the text uses so undo and redo stay symmetric, and **before** `rederiveFromText`, which
reads the point's state.

Props are the ONE sidecar with no inline trace. Every other one (`math`, `vars`, `dice`, `grammar`,
`est`, `query`) is keyed by a `[[type:key]]` token that lives in the text, so restoring the text
restores the token and `pruneArtifacts` drops whatever is orphaned. That asymmetry is exactly why
props were the one thing undo could not reach, and why widening the fix would be cargo cult.

**Not `pushUndo()`.** Routing a property commit through a whole-tree snapshot would work and is what
structural ops do, but it turns every `{prop}` into a full-document copy. The O(1) text entry grows by
the length of one point's property list instead, and `size` counts it so the stack budget stays honest.

### Driven

| | |
|---|---|
| add a property, undo | property **and chip** gone |
| then redo | both back |
| a plain text edit | exactly **1** undo entry, not 2 |
| focus + blur with no change | **0** entries |

The three-argument callers (`flushActiveTextEdit`, the base-table path) are unchanged by construction:
an omitted `propsPrev` is `undefined`, which never counts as a change. Pinned, and the mutation that
drops that check goes red.

`node --test tests/test.mjs` green at **2012**. Seven mutations, all red, including restoring props
after the re-derive instead of before, and taking the before-snapshot after the promotion that
consumes the brace.

---

## UXP-299 -- a point edited out of the active search says so, instead of quietly lingering (#1375)

**Status: FIXED.** Found by the wave-3 driving pass, filed rather than fixed at the time **with an
argument against the obvious fix**, and fixed here along that argument rather than against it.

### The defect

With `#urgent` searched, removing the tag from a listed point leaves it in the filtered list:

```
results for #urgent    : ["Alpha point #urgent", "Beta point #urgent"]
after removing the tag : ["Alpha point", "Beta point #urgent"]   <-- no longer matches, still listed
after re-running       : ["Beta point #urgent"]
```

The other direction is fine: a point that starts matching is picked up as soon as the query re-runs.

### What was NOT done, and why that is the decision

**The row still stays.** Dropping it the moment it stops matching would remove the point out from
under the caret that is editing it -- a worse failure than the one being fixed, and a collision with
the caret invariant this codebase guards hardest. Nothing in this change filters, hides or removes a
row; a pin asserts that.

So the fix is P4, not filtering: **say it.** `offSearchMessage` reports "That point no longer matches
#urgent. It stays until the search runs again." -- naming the query, and naming what happens next so
the lingering row reads as expected rather than broken. Same shape as #1357's "One point was waiting
for that value", through the same `flashHint`. No new visual language, no new CSS, no tab stop.

It fires only on a true -> false move. A row that never matched is on screen as an ancestor for
context, not as a lost hit, and stays silent.

### The bug inside the fix, which the driving caught

`exitEdit` assigns `node.text = editableText(content)` near its top, so the first version -- which
asked `nodeMatchesSearch(node)` for the "before" state -- was reading the POST-edit text. Before and
after could never differ and **the message never fired at all**. The before-state is now probed
against `prevText` on a shallow copy. (Props are still safe to read live at that line: promotion has
not run yet.) The mutation that restores the live-node probe is red.

### Driven

| | |
|---|---|
| edit a listed point out of the filter | row stays, message fires once |
| edit it, still matching | silent |
| no search active | silent |

`node --test tests/test.mjs` green at **2013**. Six mutations, all red, including saying it when the
point still matches, saying it for a never-matching ancestor, and computing the message without
reporting it.

---

## UXP-300 -- the audit names the value the scope is hiding, not just that a row has none (#1284)

**Status: FIXED (the residual half).** Both halves of #1284 had already shipped -- Explain this number
(`ea6fefe`, `85826f0`) and the missing-input list. Driving the shipped feature against the persona's
actual sentence found the gap inside it.

### The defect

Fiona's fear was specific: *"the scope gotcha will silently give me a wrong budget total and I won't
notice until it matters."* A kitchen budget with two priced rows and a third priced ONE LEVEL DEEPER:

```
Kitchen budget  sum(cost) = 1,500        <-- the true subtree total is 2,400
  Worktop     cost 1,200
  Splashback  cost 300
  Appliances                              <-- no cost of its own
    Oven      cost 900                    <-- silently excluded
```

The audit correctly listed the contributors and flagged `1 point here is not counted / Appliances /
no cost`. **True, and misleading.** A reader concludes that Appliances is unpriced, not that the
total is short by 900. The silent-wrong-total survived inside the feature built to prevent it.

### The fix

`hiddenBelowScope(node, prop, inScope)` walks an uncounted point's whole subtree and returns
`{ count, sum }` for the descendants the rollup did **not** already see, so a row that is itself a
contributor is never double-reported. `auditHiddenNote` turns that into the amount:

```
before : Appliances    no cost
after  : Appliances    no cost, 900 in 1 point below
         Add ", subtree" to include every level below (like sum(cost, subtree)).
```

The amount is the entire difference between the two readings. The widener line reuses the
empty-rollup tip's exact words (P1: one widener, one phrasing) and is gated on something actually
being hidden -- **a genuinely unpriced row needs a value, not a wider scope**, and offering the
widener there would teach the wrong fix.

### Driven negatives

| | |
|---|---|
| an unpriced leaf with no descendants | `no cost`, no widener offered |
| a rollup already written `sum(cost, subtree)` | total 2,100, nothing hidden, no widener offered |

### A recurrence in my own testing worth recording

Mutation testing found that replacing the whole `hiddenBelowScope(...)` call with `null` left the
suite **green**: the core was pinned, the call site was not. That is the **third** time in this
session (after #1357's gate and #1375's report) that I pinned a value's computation without pinning
its use. It is not an accident, it is my default failure mode, and mutation testing is the only thing
that has caught it each time.

`node --test tests/test.mjs` green at **2014**. Seven mutations, all red, including counting in-scope
descendants (double-reporting), looking only one level down, and offering the widener when nothing is
hidden.

---

## UXP-301 -- a pick between numbers stops rolling empty (#1378)

**Status: FIXED.** Found while adversarially red-teaming the #1353 plan, unrelated to it, and shipped
first at the owner's call because it is a live silent-wrong value.

### The defect

```
{damage := 1 | 2 | 3}   rendered:  damage=        <-- empty
record:  { kind: 'pick', expr: '1 | 2 | 3', rolled: '' }
```

100 draws of `1 | 2 | 3` before the fix: **84 empty**, and the only non-empty result was ever `1`. The
tell was that `1|2|3` with **no spaces** always worked.

### The cause: a one-character asymmetry

`parseAlt` has two weight patterns. The `{= }` dynamic weight requires a **non-empty** template; the
plain number weight did not:

```js
em: /^([\s\S]*?\S)\s+\{=\s*([^{}]+?)\s*\}\s*$/     // \S -> template cannot be empty
wm: /^([\s\S]*?)\s+(\d+)\s*$/                       // no \S  <-- the bug
```

The splitter hands each alternative with its surrounding space, so ` 2 ` matched `wm` with the lazy
group empty: **template `''`, weight `2`**. The item became the weight of nothing. Only the first
alternative escaped, because it has no leading space.

That also explains every case in the measured table: `warm | 1` lost its `1`, `1 | warm` did not,
`1.5 | 2.5` survived (the dot blocks `\s+(\d+)$`), `-1 | -2` survived (the minus does).

Fixed by giving `wm` the same `\S` the pattern above it already had. **A weight needs something to
weigh; an alternative that is only a number is an item.**

### Correcting my own issue

#1378 reported `parseAlt('1 | 2 | 3')` returning `{template: "1 | 2 |", weight: 3}` and flagged it as
*"the tell rather than the diagnosis"* because that call passes a whole body, not one alternative.
That caution was right and worth keeping: the real path is
`rollPickRecord -> rollPickSource -> resolveBrace`, which splits first and calls `parseAlt` per
alternative. The whole-body result was a coincidence of the same missing `\S`.

### Verification

`1 | 2 | 3` now draws 36/35/29 across 100. `10 | 20` draws evenly. The weight feature is untouched:
`sword 3`, `a b 10`, `hit 1d6 2` and `sword {= 2+1}` all parse as before, and `rare 1 | common 9`
still biases 256:44 across 300 draws. Driven end to end, `{damage := 1 | 2 | 3}` renders `damage=2`
and a downstream `{= damage * 10}` promotes.

`node --test tests/test.mjs` green at **2015**. Three mutations red, including reverting the `\S` and
removing it from the `{= }` arm; dropping the number-weight arm entirely turns **11** tests red, which
is the evidence that the weight feature is genuinely exercised and was not broken by this change.

## UXP-302 -- focus survives a base rebuild, on every control instead of one (#1383)

**P3 / P4. Found by driving the base view switcher, not by a report.** The finding is the session's
recurring shape one more time: not an absent capability, an existing one applied unevenly.

`refreshTable` replaces the whole widget with a fresh one, so every focused element inside it is
destroyed. Exactly **one** case was ever re-found -- a query base's row link, by source id -- and the
collapse chevron survives only because its own handler re-queries itself by class after the refresh.
Every other control dropped focus to `<body>`, which for a keyboard user means tabbing back from the
top of the document to get where they were.

| control | before | after |
|---|---|---|
| `.mt-view-btn` Board / Cards / Calendar / Table | **`<body>`** | the pressed button |
| `.mt-base-rows`, cap applied from its menu | **`<body>`** | the rows button |
| a focused `.mt-cell` on any rebuild | **`<body>`** | the same cell |
| `.mt-base-collapse` | itself | itself (unchanged) |
| a query base's `tr[data-nid] .node-link` | its row | its row (unchanged) |

**The second half, same driving run: all four view switches were silent.** Patching `announce` and
`flashHint` recorded **zero** calls on every switch, while the *promote* path one function away
announces `"Base added. A grid of cells; ..."`. So the app announced the smaller event and not the
larger one -- replacing a table with a kanban board.

**The P4 fix is the P3 fix, with no new string.** The fresh view button carries `aria-pressed="true"`,
so landing focus on it is what tells a screen reader the switch happened. That is exactly how the
collapse chevron already works (`aria-expanded` on a self-refocusing button), so this reuses the
house pattern rather than minting a `announce('Board view')` copy string (P5).

### The third defect, which had to be fixed for the second one to land

The rows-cap fix did not work at first, and driving said why rather than guesswork. A menu item runs
`onApply(); hideColPanel()`, and the apply rebuilds the base **in between**, so `mtPanelReturn` held a
detached node and focusing it fell back to `<body>`. Fixed by remembering the opener's *key* as well
as its node.

It still did not work. Instrumenting `focusNode` showed the **#1210 empty-canvas router** firing on
every rows-cap pick: its bail list enumerates `#bpop` and **not** `#mt-colpanel`, so choosing any item
from a base's Column / Row / rows menu counted as a click on empty canvas and yanked focus into the
nearest point. That is a pre-existing defect in its own right, affecting every item in that menu
(Calculate, Alignment, Width, Insert column, Delete row, Show as), not only the rows cap.

Fixed by matching on the **role** -- `[role="menu"]`, `menuitem`, `listbox`, `option`, `dialog` --
alongside the kept id list. A click inside an open popover already means something by definition, and
the enumeration is what let `#mt-colpanel` be missed silently in the first place.

### Deliberately not done

- **No `announce()` on a view switch.** `aria-pressed` on the restored button is the confirmation, and
  a redundant live-region string would double-speak for a screen-reader user (P4-4: reuse the pattern,
  do not invent a second one). If a future measurement shows the pressed state is not enough, the
  string is a one-line addition; the focus restore is the load-bearing half either way.
- **No focus restore for a control with no stable key.** `baseRefocusSelector` returns `null`, which
  is today's behavior, rather than guessing at a nearby element and landing somewhere surprising.

### Verification

Driven headless before and after, both input paths. Regressions driven too, because two of them would
make this change worse than the bug: the **#1210 router still routes** an empty-canvas click into the
nearest point; the **caret invariant holds** -- mouse-switching a base's view while editing a *different*
point leaves the caret in that point untouched (the restore is gated on focus having been inside the
base); and the **query-base row link** still lands on the same source row across a rebuild.

`node --test tests/test.mjs` green at **2021**. Twelve mutations, each asserting its target present
first, all red -- including one that caught a vacuous pin of mine: asserting
`fresh.querySelector(sel)?.focus()` without its `if (sel)` guard stayed green through `if (false)`.
The condition is part of the pin now (#1133).

## UXP-303 -- an agenda toggle stops throwing focus away (#1385)

**P3 / P4. The same class as UXP-302, on a second surface, found by sweeping for it rather than
waiting for the next report.** Every chip in the agenda strip is `role="button"`, `tabindex="0"`,
`aria-pressed` and Tab-reachable -- the accessibility work landed. What was missing is what happens
*after* you press it: each `onToggle` calls `renderAgenda()`, which replaces the strip, so the focused
span is destroyed.

| chip | focus after Enter, before | announced, before |
|---|---|---|
| Week / Month / Timeline | **`document.body`** | nothing |
| Done / Running / Overdue | **`document.body`** | nothing |
| Sort: date | **`document.body`** | nothing |
| Scope: document | itself | "Open a folder first ..." |

**Scope is the precedent, not the exception.** It is the one chip that announces its own success
(`announce('Agenda scope: whole folder')`) and the one that keeps focus -- and it keeps focus only
because, with no folder open, it *refuses* and never rebuilds. So the agenda got this right exactly
where it says no, and wrong in all seven places where it says yes.

**`mkAgToggle` already knew.** Its own comment reads *"mousedown + preventDefault (caret invariant) so
toggling doesn't blur an active edit and rebuild the strip out from under the click."* The author saw
the rebuild and protected the pointer path by never taking focus at all. The keyboard path, which by
definition *does* have focus on the chip, was left.

**The fix is UXP-302's, applied here**: re-find the same chip in the fresh strip, on the keyboard path
only. `aria-pressed` on the restored chip is the confirmation, so the P4 half needs no new string
(P5, and it matches what Scope already does).

**One wrinkle that a label-based identity would have got wrong.** Three chips *relabel themselves as
they toggle* -- Sort flips `date`/`priority`, Scope flips `document`/`folder`, the calendar clock shows
a date. For those the label is precisely the thing that changed, so they pass an explicit key.
`agToggleKey(label, key)` is the pure core, and reverting any one of the three keys turns a pin red.

### The lesson about the sweep itself

The first pass of this sweep **reported the agenda clean**, because its selector was `#agenda-pane ...`
and the strip is `#agenda-strip`. It found 2 controls and printed no failures. That is the vacuous-guard
failure mode in a probe rather than a test, and what caught it was checking the sample against the
standard's own description of the surface (`ux-discipline.md` §3 lists Week/Month/Timeline plus four
filter chips, so 2 was obviously wrong). **A sweep that finds nothing is a claim about the selector
until the count is checked.**

Two suspicions were also wrong on the way and are recorded so the next reader does not repeat them:
the agenda chips looked like unfocusable `div`s in an enumeration that was simply truncated at 30, and
an activation probe reported "nothing changed" because it read only the strip's header text.

### Verification

`node --test tests/test.mjs` green at **2023**. Nine mutations, each asserting its target present
first, all red -- including one that mutates *toward* the bug in the other direction: adding the
refocus to the **pointer** path must go red, because that would pull the caret out of a point being
edited.

Driven: all eight chips keep focus and land on the correct fresh chip; Sort survives its own relabel
in both directions; five keyboard toggles in a row keep working (`Done:true/false/true/false/true`);
and a pointer toggle made while editing a point leaves that caret exactly where it was.

The other surfaces swept in the same pass -- toolbar (15 controls), graph (3), timeline (6), the
focus-shown search panel (24) -- were **clean**, so this class is now closed on every chrome surface
that rebuilds itself.

## UXP-304 -- the base widget records undo (#1387)

**P4, the severest case: silent, unrecoverable data loss.** A new seam this time, found by auditing
which functions mutate persisted state without recording undo, then DRIVING the candidates -- the
static list alone was 52 entries and most were false positives.

**The exact user sequence, measured on main:**

1. Type into a point. Undo depth 2.
2. Delete a base column -- three rows of real data. Undo depth **still 2**.
3. `Ctrl+Z`. It **undoes the typing**. The column is still gone.
4. A second `Ctrl+Z` brings the column back, but only by reaching past to an earlier snapshot, taking
   whatever else that step covered with it.

So it was worse than a no-op: it destroyed a second thing while failing to restore the first. Every
base op behaved this way -- insert/delete/move a column or row, alignment, aggregate, formula, and a
board card dragged to another lane. **A cell edit too**: type in a cell, blur, `Ctrl+Z`, and the new
value stays.

**The pattern is uneven application, a third time this session, and `mtSortBase` is the proof.** It
already called `pushUndo()`, and its own flash *promises* the user `"Undo restores the old order."`
Its neighbours in the same file did not.

### Two entry kinds, matching the two the app already has

| what changed | how it records |
|---|---|
| structural (insert/delete/move/align/aggregate/formula/card drag) | `pushUndo()` snapshot |
| a cell edit | ONE `recordTextEdit` across the focus session |

**The cell "before" has to be captured at focusin, not focusout.** The per-keystroke input handler
`mtCommit()`s into `node.text` on *every character*, so by focusout the pre-edit text is long gone.
And the record must not live in `mtCommit` itself for the same reason: that would be one undo step
per keystroke. A twelve-character edit is one step, driven.

### The ordering detail that is not cosmetic

Several of these ops **refuse and return early** -- the last column, the last data row, a move with
nowhere to go. `pushUndo()` ahead of the guard would push a phantom step, so `Ctrl+Z` would appear to
do nothing at all. Every call sits AFTER its guard, that ordering is pinned per op, and five refused
ops were driven: the stack stays at 0.

### Deliberately not covered, with the reason

**Column width, role and number format.** They are display settings rather than content, re-set from
the same menu in one gesture, and a width is committed from a drag. Losing one costs a second click,
not data. Stated here rather than left silent (the "no silent caps" rule).

**Four in-session writers are exempt and named in the census** -- `mtSpliceCell`, `cellSlashApply`,
`mtWireCells`, `mtInitGlobal`. They write while a cell holds focus, so the focus-session record
already covers them. **Driven, not assumed:** a splice-style write mid-session, then blur, then
`Ctrl+Z`, restores the pre-session value. My first version of that probe was unfaithful (it set the
model but not the cell's DOM text, so focusout wrote the old value back and the claim looked false);
the real path sets both, and the corrected probe holds.

### The guard that makes this a class fix

A **census ratchet**: every top-level function calling `mtCommit` must either record undo itself or be
one of the four named exemptions, and each exemption must still name a real function so a rename
cannot quietly empty the list. A new base op that forgets now fails a test instead of shipping
silently, which is exactly how these eleven shipped.

### Verification

`node --test tests/test.mjs` green at **2026**. **Fifteen mutations**, each asserting its target
present first, all red -- including two that mutate toward the *wrong shape* rather than toward
absence: moving a `pushUndo()` ahead of its guard, and putting the record in `mtCommit` where it would
fire per keystroke.

Driven: the acceptance case (type, delete the column, `Ctrl+Z`) now brings the column back **and**
keeps the typing; a twelve-keystroke cell edit is one step; two cells are two steps undone one at a
time with redo returning them; and the widget survives an undo through the text path (still a base,
12 cells, 4 view buttons).

**A harness lesson worth keeping.** One mutation reported GREEN and was actually inert -- I had
written identical find and replace strings. The harness checked that the target was *present* but not
that the mutation *changed anything*. It now reports an inert mutation as a problem rather than
counting it as proof. That is the #1133 rule applied to the tool that enforces #1133.

## UXP-305 -- an unrecognised repeat phrase crashed the renderer (#1389)

**P4, and the sharpest version of it yet: the guard against a silent failure WAS the failure.** Found
by accident while seeding a harness for the rest of the undo audit -- my seed used `repeat: week`, and
the app threw inside `render()`.

```js
chip.classList.add('prop-repeat' + (ok ? '' : ' prop-repeat-bad'));
```

`classList.add` throws `InvalidCharacterError` on a token containing whitespace, so the *unrecognised*
branch was fatal. The comment directly above it states the intent exactly:

> *"A phrase parseRepeat rejects is shown but flagged, so a typo is visible not silent (P4)."*

It was neither visible nor silent. It was fatal.

**Measured.** With one such point in a three-point document: `render()` throws, **1 of 3 points
appears**, every later render throws too, and the phrase is persisted, so a reload reproduces it. The
document is effectively unusable below the offending point.

**The trigger is ordinary typing, not an edge case.** `parseRepeat` accepts `weekly`, `every week`,
`daily`, `monthly`, `yearly`, `every 2 weeks` -- and rejects `week`, `day`, `month`, `1w`, `annually`,
`fortnightly`, `Tuesdays`. `weekly` works and `week` bricks the view.

### The second half: the flag had no style

`.prop-repeat-bad` had **no CSS rule at all**. So even once the crash is fixed, the flag would be
invisible and the whole P4 promise would rest on a hover `title` -- which #1199 already established is
unreachable. It now carries the house "this reference is broken" language (`--bad` ink plus a dotted
underline, the same pair `.node-link-broken` and `.gr-src.gr-bad` speak), measured at **5.92:1 light
and 7.73:1 dark** against the page background, both over the 4.5 text floor, with a non-colour signal
beside the colour (P3-4). `--bad` is reused rather than introduced, and it is present in **both**
palette homes -- confirmed rather than assumed.

### The other candidate, checked and cleared

The audit found one more `classList.add` building a token by concatenation:
`chip.classList.add('prop-' + propK + '-' + state)`, where `propK` is a property key. Driven with a
spaced key: **it does not crash**, because that line only runs for keys in `DATE_KEYS` (a fixed set
with no spaces) and the property parser will not produce a spaced key at all. Recorded as checked
rather than "fixed" speculatively.

### The guard

A class ratchet: scan every `classList.add/remove/toggle` in the source and assert no **quoted
fragment** inside the call carries whitespace. That catches the literal form and the concatenated form
this shipped as. Paired with a reachability pin -- the seven plausible phrases `parseRepeat` rejects --
because a pin on the fix is worthless if the failing branch cannot be reached by real input.

### Verification

`node --test tests/test.mjs` green at **2029**. Six mutations, each asserting its target present
first, all red: restore the concatenation; drop the flag add; drop the CSS rule; make the flag
colour-only; hardcode the red instead of the token; and sneak a spaced token into a *different*
`classList` call, which the class guard must catch rather than only the one site.

**On how this was found.** It was not on any list. It surfaced because a harness seed used a plausible
value and the app threw. Worth recording: the undo audit that was running at the time found its own
findings, and this one came free from *using the app like a user who does not know the vocabulary*.

## UXP-306 -- a pill keeps the focus its own activation destroys (#1391)

**P3. The fourth instance of the UXP-302 / UXP-303 class, on the pill family — and this time the fix
was already HALF present.** UXP-19 restores focus after a pill re-roll, and its comment states the
reason exactly: *"a re-roll repaints the content (innerHTML), destroying the focused pill — restore
focus to its re-rendered self so keyboard re-rolls can chain."*

Driven by **node identity** rather than by class name (mark the old element, then ask whether the
focused one is the fresh twin), because "focus is on a `.dice-roll`" cannot tell a survivor from a
replacement:

| pill | replaced | focus after Enter, before |
|---|---|---|
| dice / grammar / estimate | yes | the fresh pill ✅ |
| **clock** | yes | **`document.body`** ❌ |
| **var pick** | yes | **`document.body`** ❌ |

### Two distinct causes, both measured

1. **`.clock` is not in the pill-body selector list.** It has its own keydown branch, which advances
   and returns without restoring. All four doors were driven — click, Shift+click, Enter, Space — and
   all four advanced correctly, announced correctly, recorded undo, and dropped focus.
2. **The restore re-found inside the CAPTURED `content`.** A var pick triggers a full `render()`,
   which detaches that element. `querySelector` on a detached subtree does not fail — it cheerfully
   returns the **stale** pill, and `focus()` on a detached node is silently ignored. So the restore
   looked present and did nothing. Driven: `content.isConnected` false, the stale pill found, focus
   on `<body>`.

Cause 2 is the more interesting one: it is a guard that reads as working, which is the same shape as
the vacuous pins #1133 is about, expressed in product code instead of a test.

### The change

`refocusAfterRepaint(nodeId, finder)` re-finds the point's content **in the live document by node
id**, takes a *finder* rather than a key (a clock has no `data-key` — it is identified by its ordinal
among the manual clocks, the same way `advanceClockAt` targets it), refuses to focus a detached node,
and only acts when focus actually fell to body so an activation that opens a dialog keeps its own.

The clock's ordinal is captured **before** the advance, while the old pill is still in the document.
Reversing that order turns a pin red.

### Scope, stated rather than implied

The fix is on the **keyboard** path only, matching the sibling pill branch. A pointer click never
focuses these pills in the first place, and pulling focus there would break the caret invariant.
**Driven:** mouse-clicking a clock while editing a *different* point advances the clock and leaves
that caret exactly where it was.

### The remainder, measured after the first pass

The action-pill and spoiler branches activate-and-return in the same handler, and the first pass could
not measure them: two attempts used the wrong syntax and rendered no pill. Looking the forms up in the
parser rather than guessing (`{hp -= 1}`, and a `>! ` line) settled both, and they land on **opposite**
answers:

| branch | replaced by its own activation? | verdict |
|---|---|---|
| action pill | **yes** — applies, announces "hp is now 9", drops focus to `<body>` | **fixed**, by ordinal like the clock (its `data-act-body` is arbitrary author text, not a key) |
| spoiler | **no** — `toggleSpoiler` only adds a class | **correct as it stands**; focus stayed on `.md-spoiler.revealed` |

**The spoiler's absence is pinned, not just left out.** Adding a restore there would be cargo cult, so
a mutation that adds one turns a pin red. That is the point of measuring the negative case rather than
"completing the set": two branches that look identical in the source needed opposite treatment, and
only driving them told them apart.

### Verification

`node --test tests/test.mjs` green at **2031**. Nine mutations, each asserting its target present
first, all red — including four that mutate toward the *wrong shape* rather than toward absence:
capturing either ordinal after its action, re-finding in the captured element again, focusing a
detached node, and adding the cargo-cult restore to the spoiler.

**A method note.** Five separate probe errors preceded this finding: the meter and clock syntaxes
(`{meter: 8/12}`, `[o 0/6]` — not the brace forms I guessed), a `mousedown` dispatch where the clock
listens on `click`, a selector matching a Font Awesome icon instead of a clock pill, and a corkboard
test run outside the zoom view where it does not render. Each initially looked like a defect. The
habit that caught them all is the same one UXP-303 recorded: **check the sample against what the
surface should contain before believing a null result.**

## UXP-307 -- filtering by an inline tag lands in the search box (#1394)

**P3/P1. The first find made by APPLYING the sibling rule rather than stumbling on it**, and the
evidence is unusually literal: five controls set a search query, four run the same three-line idiom,
and one is missing its third line.

| member | sets `sb.value` | `applySearch` | `sb.focus()` |
|---|---|---|---|
| the tags-panel row | yes | yes | yes |
| `applySavedChip` (a saved-search chip) | yes | yes | yes |
| the search-legend chip (stacks a token) | yes | yes | yes |
| `revealCheckOffenders` | yes | yes | yes |
| **`searchHashtag`** (an inline `#tag` in a point) | yes | yes | **NO** |

Driven before: clicking or Enter-ing an inline tag filtered correctly and announced correctly
("2 matching points"), and dropped focus to `<body>` on **both** paths.

### Why this one covers the pointer path, when #1391 did not

The hashtag's `mousedown` handler swallows its event, and its comment says that is the caret
invariant. It is -- for the *click*. But `applySearch()` **re-renders**, which destroys the edited row
regardless, so the caret was already gone before this change. **Measured, not assumed:** with the
caret in a point, a mouse click on a tag left `document.activeElement` on `<body>`. Landing in the
search box is therefore strictly better than the status quo on both paths, and it is where the query
the user just applied now lives (P1). Contrast UXP-306, where the pointer path genuinely preserved
something and the fix had to stay keyboard-only -- the difference is measurable, and was measured.

### The two clearers are deliberately different, and were read rather than lumped in

`applySearch('')` from the Escape key **blurs** the box explicitly; the clear-then-zoom path sends
focus to the zoomed point. Both are doing something considered, so neither is a member of this family.

### The ratchet

The family is enumerable from source, so per the sibling rule it gets a census: any function that
assigns a non-empty query into the search box and applies it must also focus it, or be a named
exemption (the applier itself, and the debounced typing path where the caret is already in the box).
**A mutation that removes the focus from a SIBLING turns it red**, which is the point -- the guard
generalises rather than pinning the one site that happened to be broken.

### Verification

`node --test tests/test.mjs` green at **2033**. Three mutations, each asserting its target present
first, all red: drop the focus from `searchHashtag`; move it *before* the apply (where the re-render
would discard it); and drop it from `applySavedChip`, which the census must catch.

## UXP-308 -- a mid-line / or @ command keeps its first character (#1396)

**Found by FOUR of five personas independently** in a multi-agent live-drive pass, each on a different
task, none aware of the others. That convergence is the strongest signal in the batch. Every report
was reproduced from scratch by a separate adversarial verifier.

**The cause is a value that was already being passed and thrown away.** `checkSlash` has always handed
the builder its query:

```js
builderState = { nodeId, content, trigger, offset: slashOffset, query, rawArg };
```

and `openBuilder` opened with `let filterQ = '';`.

At the **start** of a point the bare `/` opens the builder with query `''`, so nothing is lost and the
bug is invisible. **Mid-line** the #1108 guard suppresses the bare trigger deliberately (a lone `/`
in prose is punctuation, not a command), so the FIRST word character is what opens the builder -- and
with `filterQ` empty that character lands in `node.text` and never reaches the box.

| typed after text | box before | selected before | box after | selected after |
|---|---|---|---|---|
| `/note` | `ote` | **Quote** | `note` | Note |
| `/todo` | `odo` | To-do | `todo` | To-do |
| `/due:tomorrow` | `ue:tomorrow` | **Query base** | `due:tomorrow` | Schedule |
| `/prop:hp=12` | `rop:hp=12` | (no match) | `prop:hp=12` | Property |

`/note` mid-line converted a scene heading into a **blockquote**. `/prop:hp=12` set nothing.

The app advertises these inline forms verbatim -- the Schedule entry says *"Type `/due:tomorrow` to set
it inline"* -- and #1108's own comment says the mid-text position is supported. P1: a command must
mean the same thing at the start of a point and after text.

### A SECOND root cause, measured and deliberately not fixed here

`/due:tomorrow` mid-line still strands `/d` and loses the `- [ ] ` to-do prefix, and instrumenting
`stripTriggerRun` says why -- it is **not** the same bug:

```
builderState: offset=25, query="d"          (correct for "- [ ] Ship release notes /d")
STRIP called: offset=25, text="Ship release notes /d"   <- prefix already gone, length 21
```

The offset is computed against the **full** text including the `- [ ] ` markdown prefix, and applied
against the **stripped** text without it. Offset 25 lands past the end of a 21-character string, so
`slice(0,25)` is the whole string and nothing is removed.

That is an **offset-space mismatch**, and it is the same cause behind the GM persona's separate report
that a `/` or `@` command on a point carrying a pill destroys the pill (`Damage 2d6` became
`"- [ ] Damage 2d615=/t"`) -- whose own summary put it exactly right: *"the splice offset must be
resolved against the same text form the splice is applied to."*

One root cause per change, so it stays open on #1396 with this measurement recorded. My first guess
was that the strip ran at offset 0 (because `1 + 5` is exactly `"- [ ] "`); instrumenting showed the
offset was right and the TEXT was wrong. Recorded because the plausible-arithmetic explanation was
wrong and would have sent the next reader to the wrong function.

### Verification

`node --test tests/test.mjs` green at **2034**. Three mutations, all red: drop the seed; seed but
never show it in the box; fold `rawArg` into the seed (which would insert the `:value` twice, since
the apply path re-joins it). Driven end to end for all four commands, mid-line versus line-start.

## UXP-309 -- opening a pill's context menu stops changing the pill (#1397)

**Data loss on the pill's own advertised path.** Found by the novelist persona in a multi-agent
live-drive pass and reproduced from scratch by an independent verifier.

The pill's tooltip reads *"Click to re-generate. Right-click for more, including Freeze to text"*.
Following that instruction lost the value the novelist was trying to keep, because a secondary-button
`mousedown` is delivered BEFORE `contextmenu`: the right-click re-rolled the pill, and the menu then
painted a value the user had never seen.

```
#0 shown=Kestrel      at-menu=Corvid       FROZEN=Corvid       <== LOST
#2 shown=Thistle      at-menu=Bellweather  FROZEN=Bellweather  <== LOST
#5 shown=Bellweather  at-menu=Bellweather  FROZEN=Bellweather  ok  (chance)
MISMATCHES: 5/6
```

It was **contrary to the code's own stated intent**: the comment on the `contextmenu` listener records
the right-click as a deliberately NON-destructive door (#1116), added so a user could keep a result.
The keyboard route (`Shift+F10`) never re-rolled and froze correctly, so the broken path was the only
one the pill advertises.

### One guard, not four, and the census is why

Applying the sibling rule found a member a per-branch fix would have missed:

| pill | right-click re-rolled, before | after |
|---|---|---|
| dice | yes | no |
| grammar | yes | no |
| estimate | yes | no |
| **var pick** | **yes** -- its OWN branch, announcing "who re-rolled: b" | no |
| clock | no (its handler is on `click`, not `mousedown`) | no |
| math | no | no |

So the guard goes once, before the whole generative block, rather than four times. Everything above it
already guards itself -- the bare-URL branch carries `e.button === 0`, and that sibling is exactly the
precedent this followed -- and the context menu rides a separate `contextmenu` listener, so a
non-primary `mousedown` has nothing to do in that handler at all.

### The regression that would have made this worse than the bug

**A left-click must still re-roll.** That gesture is a recorded P1 sign-off made three separate times
(dice, clocks, estimates), and "fixing" the freeze by disabling the re-roll would reverse it. Driven
after the change: dice, grammar, estimate and the var pill all still announce a fresh value on
left-click, and the mutation that flips the guard to `e.button === 0` turns a pin red.

### Verification

`node --test tests/test.mjs` green at **2035**. Four mutations, each asserting its target present
first, all red: drop the guard; move it after the loop; flip it to the wrong button; and drop the
sibling guard the fix was modelled on.

Acceptance driven: the novelist's own loop, six iterations of right-click then Freeze to text, now
**6/6 freeze the value on screen** (was 5/6 losing it).

## UXP-310 -- an editable surface outside the outline keeps its own clicks (#1398)

**Data loss, and a hole in my own UXP-302 fix.** Found by the novelist persona in a multi-agent
live-drive pass, reproduced exactly by an independent verifier.

Clicking the footnote body focused the **prose line**. Everything typed then went into the novel:

```
root.footnotes   [{"id":"river","text":""}]                                    <- unchanged
point text       "...nobody spoke. [^river]The river gave the car back in 1974."
```

Nothing announced, nothing flashed. Not occlusion -- `elementFromPoint` at the click coordinates
returned `DIV.fn-content`.

### Why the previous fix missed it, and what that teaches

UXP-302 widened this same bail list from an id list to **ARIA roles**, precisely so `#mt-colpanel`
would be covered by construction rather than by enumeration. That was the right instinct and the
**wrong net**: the footnote body is a plain editable `div` with no role at all, so the role match
sailed straight past it.

The property that actually distinguishes "a click that already means something" here is
`[contenteditable]:not([contenteditable="false"])`. An editable surface is the strongest possible
case -- the user is aiming a caret at it. That one selector also covers the note editor and the table
markdown editor, and covers the next panel that ships a bare editable div. The `:not(false)` arm is
load-bearing: pills and links carry `contenteditable="false"` so the caret skips them, and they must
keep falling through to the branches that handle them.

Generalising twice and still missing a case is worth recording plainly: **a generalisation is only as
good as the property it picks**, and "has a role" was a property of the examples in front of me rather
than of the thing being protected.

### The marker's own promise, closed in the same change

`activateFnRef` revealed, highlighted, scrolled and announced -- and left focus on `<body>`. The
marker's accessible name is *"Footnote 1, not written yet. Click to write it."*, so the one thing it
promised was the one thing it did not do. It now lands the caret in the footnote body. Nothing is
stolen: the mousedown is already `preventDefault`ed and focus was going to `<body>` either way.

### A vacuous pin of my own, caught by mutation

The first version of the bail-list pin asserted against the RAW source and matched **the comment above
the fix**, which quotes the selector verbatim -- so it passed with the code removed. Rewritten against
the comment-stripped `NC` view (which #1132 exists for). **A comment documenting a guard can satisfy a
pin on that guard**, and the mutation harness is the only reason that surfaced.

### Verification

`node --test tests/test.mjs` green at **2037**. Five mutations, each asserting its target present
first, all red -- including two toward the *wrong shape*: bailing on ALL `contenteditable` (which
would break pills and links), and focusing before the panel is populated.

Driven before and after: the footnote text now lands in `root.footnotes` with the prose untouched, the
marker leaves the caret in the footnote body, and the #1210 empty-canvas router still routes an
ordinary background click into the nearest point.

## UXP-311 -- a dismissed panel stops being a live surface (#1399)

**The only crash-severity finding of the multi-agent batch, and it is two defects sharing one cause:
a panel that is dismissed is not gone.**

Dismiss the Linked-from strip, put focus on the "Link this mention to ..." control it left behind,
press Enter. Measured on `origin/main`:

| | before | after |
|---|---|---|
| page errors | `TypeError: Cannot read properties of null (reading 'text')` | none |
| the mention | linked anyway (the mutation ran) | linked |
| announced | **nothing** | `Linked mention` |
| named controls in the a11y tree, dismissed | **2** | **0** |
| programmatic focus lands on them, dismissed | **yes** | no |

### Cause 1: a callback that closed over a global its own dismissal nulls

`hideBlPanel()` sets `blNodeId = null`. `renderBlPanel` hung `afterLink: () => showBlPanel(blNodeId)`
on every row, so the refresh asked a dismissed panel who it was about and got `null`, which threw
inside `blGather`'s document walk. The rows are built for **one** subject; the fix is to capture that
subject once and let both the renderer and its callbacks read the capture.

The announcement sat *after* that call, so the throw ate it: the mention **was** linked and the app
said nothing (P4). It now announces before the repaint that can swallow it. Ordering, not copy.

### Cause 2: hiding by sliding off-screen leaves the controls live -- in all three panels

`#bl-panel` hides with `transform:translateY(100%)`. An off-screen element is a present element: still
focusable, still named in the accessibility tree. **The family is enumerable from source** -- exactly
three rules hide this way (`#fn-panel`, `#bl-panel`, `#var-panel`) -- and driving each one with real
content showed **all three** leaking their controls when dismissed. Each now carries
`visibility:hidden` with a `0s .22s` delay, so the slide-out animation is unchanged and the controls
leave the tree the moment it finishes. The census is pinned: a fourth docked panel has to opt in.

The reduced-motion override named only `#var-panel`, and only its closed state. Since the `.on` rules
now declare a transition of their own (which outranks a plain-id override), it had to be widened, and
widening it to the siblings that never had one was the same one-line edit.

### Two probes that measured nothing, and were not reported as findings

- **A Tab-ring traversal.** 45 presses never left `.node-content` -- **Tab indents** in an outliner,
  so the browser tab ring is not what exposes a dismissed panel here. Replaced with
  `page.accessibility.snapshot()` plus programmatic focus, which is what actually leaks.
- **A family sweep run on unopened panels.** `fn-panel` and `var-panel` reported 0 focusable controls
  while dismissed -- because they had never been filled. Re-run after opening each with real content,
  all three reported 2, 2 and 1. A null result is a claim about the probe until the count is checked
  against what the surface should contain.

### The focus half, found by driving rather than by the report

With the crash fixed, a keyboard user who pressed Enter on Link was dropped on `<body>` (the strip) or
on the outline **container** (the in-flow section). The Link button destroys itself -- its row is
rebuilt as a "Linked from" row -- so focus now follows the row it became, addressed by a new
`data-bl-src`. Two details that only measurement gives:

- The gate is `hadFocus` at activation, **not** "is `activeElement` `<body>`". The in-flow path leaves
  focus on a container, so a vacuum test that only knows about `<body>` never fires. `hadFocus` is also
  what keeps the mouse path untouched: the `mousedown` is `preventDefault`ed, so it is false there by
  construction.
- The retry is bounded at 12 frames because the two surfaces repaint at different times -- the strip
  has its row on frame 1, the in-flow section on frame 2, since `scheduleZoomBlFill` runs on an idle
  callback. One frame fixed one surface and silently missed the other.

### The sibling that already had the guard

`showFnPanel` has always opened with `const node = nodeById(nodeId); if (!node) return hideFnPanel();`.
`showBlPanel` never did, and it is the one whose gather walks the whole document dereferencing that
node. Same family, same shape, one member missing it -- the sixth instance this session of a
capability the code already had, applied to some siblings and not others.

### Verification

`node --test tests/test.mjs` green at **2040**. Fifteen mutations, each asserting its target present
first, all red at the named pin -- including toward the wrong shape (making the refocus unconditional,
so it would steal from the mouse path; removing `visibility:visible` from a `.on` rule, so a panel
could never be used at all). Three negative controls green.

Driven before and after in both themes, at 1280 and at 393 with `hasTouch`: the strip still slides,
still renders, its controls are still focusable while it is open, and the accessibility exposure while
dismissed goes 2 -> 0.

## UXP-312 -- the caret survives the click and then not the render (#1406)

**The protection was already there and bought nothing.** Both `blPanelEl` and the Link button register
`mousedown -> e.preventDefault()`, which is the caret invariant, done deliberately. Then the `render()`
inside the handler rebuilds every `.node-content` and the caret it just protected is gone.

Reproduced on `origin/main`, caret in a point, ordinary visible panel, ordinary mouse click:

| | before | after |
|---|---|---|
| `activeElement` | `.node-content` -> **`document.body`** | `.node-content`, same point |
| caret offset | lost | preserved (7 -> 7) |
| the strip | **dismissed itself** | still up |
| a run of two mentions | second one unreachable | both linked, no re-entry |

### The half the report does not have

The strip closing is not a second bug, it is the consequence: `scheduleBlHide` keeps the panel up only
while a `.node-content` (or `.zoom-title`) holds focus. Focus falling to `<body>` therefore dismissed
the panel the user was working in, mid-run. Linking mentions is inherently repeated -- a subject with
four mentions meant four round trips through the point -- so this was the more expensive half.

The fix is one capture and one existing helper: read `activeElement`'s point and
`caretOffsetIfEditing` before the mutation, and `focusNodeAtOffset` after. No new focus machinery.

### The ordering that a source-pin alone would not have caught

The restore is the **else** of #1399's keyboard landing, and a mutation proved that matters: adding an
*unconditional* restore ahead of the `hadFocus` branch leaves both fixes present in source, passes the
two obvious pins, and silently kills the keyboard landing (the retry stands down on its own
contenteditable check the moment the caret is in a point). The pin now counts the restore -- exactly
one, after the keyboard branch.

### The sibling census, calibrated

The family the issue points at is `mousedown` + `preventDefault()` handlers that re-render:

| | count |
|---|---|
| such listeners | 76 |
| re-render with no restore, or unresolvable statically | **7** before, **6** after |

**The first version of the probe reported 0** because it resolved only `function NAME(` and the Link
button's handler is `const doLink = () => {`. A census that cannot find the member you already know
about is measuring nothing; it was recalibrated against the pre-fix file until it flagged `doLink`.

Driving the six that remain: the brace picker keeps the caret; the bullet popup's ten rows are all
navigation or dialog-openers, none mutating text in place; the agenda toggles and calendar nav are
chrome with no caret in a point (and #1385 already fixed their keyboard path). One genuine member is
left, the **to-do state picker**, whose chips apply correctly and then drop focus to `<body>` -- filed
as its own issue rather than bundled, since it is a different control on a different surface.

### Verification

`node --test tests/test.mjs` green at **2041**. Seven mutations, each asserting its target present
first: six red at the named pin -- including two toward the wrong shape (an unconditional restore that
steals the keyboard landing; converting the `mousedown` to a `click`, which would break the invariant
the whole fix rests on) -- and one negative control green.

Driven: a run of two mentions linked one after the other without re-entering the point, a mid-line
caret returned to its own offset, the #1399 keyboard landing unchanged, and undo still restoring the
mention.

## UXP-313 -- a raw `[[]]` on screen and a bare node id in the export (#1402)

**Two causes, and neither is the one the issue names.** The report reads it as the `linkText`
`depth > 0` rule meeting a caption. That is half of it; the `[[]]` on screen is something else
entirely.

### Cause 1: the caption strip ate the token's id

`stripCaptionTags` applies the hashtag rule to raw text, and a link token is `[[#vt8cabxe]]`. That
`#vt8cabxe` matches the hashtag pattern **exactly** -- preceded by `[`, so the word-boundary
lookbehind passes; letters present, so the letter guard passes -- so the strip removed the id and left
a literal `[[]]`. Measured directly:

```
stripCaptionTags('Ecological rationality argued in [[#vt8cabxe]]')
  -> 'Ecological rationality argued in [[]]'
```

**`collectTags` has had the guard since UXP-109** -- `tagScanText` blanks every `[[…]]` before
scanning, and its comment names this exact hazard, "so neither the `#id` inside a link nor the `#A`
inside a priority marker leaks a phantom tag." This sibling never got it. The seventh instance this
session of a capability the code already had, applied to some members of a family and not others.

### Cause 2: the recursion terminal printed an internal id

`if (depth > 0) return id` made a bare node id **user-visible** -- on screen through the caption, and
in exported `.md` and `.txt`, which #1111 forbids outright. Two changes, both bounded:

* the budget is **2**, so a title that itself holds a link resolves. Measured on the reporter's
  document: at 1 the export leaks 3 ids, at 2 it leaks 0 and reads
  *"Ecological rationality argued in Gigerenzer 1996 On narrow norms"* -- the text the issue asks for.
* past the budget the reference is **dropped**, never printed as an id. This is not #1110's mistake:
  that was stripping every link at the top level, which deleted the names. This is the terminal of a
  recursion that has already carried two levels of names, and it is what makes an A-B title cycle
  finite (`alpha beta alpha beta`, bounded, no id).

### The fix changes the failure mode, so every sink had to be checked

A token used to be gutted to `[[]]`; now it survives intact. Any sink still stripping RAW text would
therefore show a literal `[[#id]]`, which is worse. All 12 call sites were enumerated from source and
checked: `displayText` resolves internally, `backlinkSnippet` ends in `stripMd(linkText(line))`,
`graphNodeLabel`'s input is resolved by its injected resolver (#1110), `matchableNodeNames` feeds from
the token-dropping `forMatch` arm. **Three did not:** `renderLinkPill`'s live title, its mirror-depth
fallback, and `renderCrossLinkPill` -- and `nodeNames`, which answers "what is this point called" for
mention matching. All four now resolve before they strip, and the census is frozen as a ratchet.

The census had to read `NC`: 13 matches in raw source, 12 in code. The thirteenth is **my own comment
quoting the call** -- the #1398 lesson, met twice in one session.

### A premise corrected

The issue notes the `.node-link` spans have **no `aria-label`** "so assistive tech reads the empty
brackets too." The missing label is not the defect and should not be added: for a `role="link"` with
visible text, the visible text IS the accessible name, and duplicating it in an `aria-label` is the
anti-pattern. Once the text is right, AT reads the right thing. Verified after the fix.

**Deliberately unchanged:** an *unresolvable* target still degrades to its bare id at the top level.
That is the recorded #1111 arm -- a target that does not exist has no name to show -- and the pill is
marked `.node-link-broken` and says "(broken link)" in its accessible name. Different case from an id
leaking where a name was available.

### Verification

`node --test tests/test.mjs` green at **2044**. Ten mutations, each asserting its target present
first, nine red at the named pin -- including two toward the wrong shape (dropping the unresolvable
arm so a dead target shows nothing at all; adding a new caption sink that strips raw text, which the
census caught) -- and one negative control green.

Perf, since `renderLinkPill` now calls `linkText` per pill: 800 points with 800 link pills, median of
nine renders, **6.2ms before / 6.6ms after**, inside the run-to-run spread (before's own max was
7.8ms).

## UXP-314 -- the two Board doors stop disagreeing (#1401)

**The app already computed the exactly right sentence and withheld it on the door the user took.**

Clicking the **dimmed Board button** gave a specific, followable cue. Marking the same column through
the **Column menu** was accepted in silence, and Board then opened with four empty lanes, every card
in one "No state" lane, and the real values invisible. Driven, both doors, on the planner's setup:

| | before | after |
|---|---|---|
| dimmed Board button | the full diagnostic | unchanged |
| Column menu -> Status | **nothing at all** | the same diagnostic |
| `Alt+R` -> Status | `Column shown as: Status` | the same diagnostic |
| Column menu -> Date / Number / Plain | **nothing at all** | `Column shown as: …` |
| a card in the "No state" lane | `Ship the API` | `Ship the API · Status Doing` |

### One cause, three symptoms

`boardBlockReason` opens with `if (statusIdx >= 0) return null` -- it answers "why is Board blocked",
so once the column IS marked it has, by construction, nothing to say. The unknown-values arm was
inside it, so the diagnostic was reachable only from the door that refuses.

The unknown-values half is now `statusColWarning`, a pure core that both doors call; `boardBlockReason`
delegates rather than keeping a second copy of the sentence. It is a **predicate as well as a
message** -- null when every value really is a state -- which is what lets the mark path use it to
choose between the warning and the plain confirmation.

**The tail had to change with the door.** The original ends "…then mark the column (Column menu, Show
as)", which is precisely the #1114 defect if you say it to someone who has just marked the column: an
instruction they believe they have already followed. `{ marked: true }` swaps it for "…and Board
groups by them."

### The silence was wider than the report

The Column menu announced **nothing for any role**, not just Status; `Alt+R` announced for all four.
The confirmation therefore moved into `mtSetColRole`, the single write both doors go through, and the
keyboard door's now-duplicate flash was removed. One write, one response, either door (P1/P4).

### The card stops hiding the value

`renderBoard` skipped the groupBy column on every card, which is right when the lane heading carries
the state and wrong in the "No state" lane -- the heading there is *actively false*, since the row does
have a status. That is why a useless board looked like an empty one. The value now renders on cards in
that lane only.

### What was deliberately NOT done

The issue's third option -- give each unmatched value **its own lane** -- is rejected, not deferred.
#1148 recorded the rule that **the sequence is the vocabulary**, and lanes invented from free text
would make the board's column set depend on typos: "Doing", "doing " and "Dong" would be three lanes.
The in-fence answer is the one shipped: accept the mark, say what is missing, and keep the data visible.

### Two probes that measured nothing, and were not reported as findings

- **The acceptance test failed at first.** Declaring `{seq Flow: Doing Blocked | Shipped}` by *setting
  node.text* left `collectSequences` empty -- it reads the `node.seq` sidecar plus a `[[seq:key]]`
  token, so a raw brace string is not a declaration until it is promoted. Retyped through the UI, the
  acceptance passes: Flow declares DOING/BLOCKED/SHIPPED, the mark flashes the plain confirmation, and
  Board opens with three real lanes holding one card each. **Following the advice works** -- which is
  the whole test, since a cue that is not followable is the defect.
- **An `Alt+R` probe reported zero flashes** -- and zero role change, so it had measured nothing.
  Re-driven through `mtFocusCell`: the role goes null -> status and exactly **one** flash fires.

### Verification

`node --test tests/test.mjs` green at **2046**, and the CLAUDE.md staleness floor raised 1800 -> 2000
(it had drifted 251 behind, which is the drift its own note says to fix). One existing pin rewritten,
not loosened. Ten mutations, each asserting its target present first, nine red at the named pin --
including one toward the wrong shape (showing the groupBy value in every lane, duplicating the
heading) -- and one negative control green.

**A pin that could not fail, caught by mutation:** disabling the gate (`role === 'status'` -> `false`)
left the call sitting in source and every assertion still passed. The gate itself is now pinned.

## UXP-315 -- a structural base op stops being silent and stops dumping you on <body> (#1400)

**The census in this same menu was the argument, and it was bigger than the report.** Driven through
the header menu with nothing focused first (the ordinary mouse path):

| command | focus after, before | announced, before | after |
|---|---|---|---|
| Insert left / right | **`<body>`** | **nothing** | the new column's name cell · *"Column inserted to the left of “Owner”. Undo removes it."* |
| Move left / right | **`<body>`** | **nothing** | the column at its new index · *"Column “Owner” moved left. Undo restores the order."* |
| Delete column | **`<body>`** | **nothing** | the surviving neighbour · *"Column “Status” deleted, with 3 values. Undo restores it."* |
| Insert / Move / Delete row (x5) | **`<body>`** | **nothing** | the row's own cell · the matching sentence |
| *Ascending* (the control) | `<body>` | the full sentence | unchanged, plus it now lands too |

The issue names five column commands. The five **row** commands are the same shape in the same menu,
so the family is ten, and all ten were silent.

### Why the focus half nearly did not reproduce

My first probe focused a cell before opening the menu and reported focus landing correctly every
time -- I was one step from filing a premise correction saying the `<body>` landing was already fixed
by #1383. It is not. `hideColPanel`'s restore only has a target when something in the base held focus
**before** the menu opened, which is true of the Shift+F10 keyboard door and never of the pointer
path. Removing the pre-focus from the probe reproduced `<body>` on all ten, exactly as reported.

**A probe that makes the defect disappear is a probe that is not the user path.**

### The shape

`baseStructMessage` is a pure core holding all six sentences as data, so they cannot drift apart --
which is precisely how five of them came to say nothing while their sibling `mtSortBase` said
everything. The two deletes read the name and the **size** before the splice removes them, so the
destructive member reports what went rather than happening quietly.

The landing moved INTO the ops, so both doors get it and neither keeps a copy. Each op takes the
cross-axis coordinate it should land on (`focusCol` for row ops, `focusRow` for the column move), so
the keyboard door still leaves you in your own row or column while the menus default to the header.
`hideColPanel` stands down when an apply has already placed focus inside the base, or it would yank
it straight back to a stale opener.

**One deliberate behaviour change on the keyboard door:** `Alt+Shift+Left/Right` used to leave you in
your data row and now lands on the new column's name cell, both doors alike. That is the issue's
explicit ask, and an unnamed column is the thing you have to deal with next.

### The siblings the report does not mention

The four formatting commands in the same menu (Sort, Alignment, Width, Calculate) had the identical
`<body>` landing. They stay on their column now. Their **announcement** gap is real too -- one of the
four speaks -- but it needs three new sentences rather than a reuse of this change's core, so it is
filed as its own issue with the measurement rather than bundled.

### Verification

`node --test tests/test.mjs` green at **2048**. Two existing pins rewritten, not loosened. Twelve
mutations, each asserting its target present first, eleven red at the named pin -- including two
toward the wrong shape (an em dash in a message; a delete count that stops excluding blanks and
over-reports what went) -- and one negative control green.

Driven after: all ten menu commands from the mouse door, all six keyboard doors (each firing exactly
one flash and keeping its cross-axis coordinate), and the four formatting siblings.

## UXP-316 -- one authoring language, two doors, two records (#1404)

**UXP-160 recurring on the door it never reached.** That entry records the dialog dropping `heldFrom`,
so a dialog-authored `A | B | C` stored `heldFrom: undefined` and its held band vanished. The dialog
was fixed. The typed twin was not, and the parser has carried `heldFrom` correctly the whole time.

Driven, typing `{seq Flow: Calm | Waiting | Broken}` into a point and letting it promote:

| | before | after |
|---|---|---|
| `seqDeclParts` (the parser) | `{name, states, doneFrom: 2, heldFrom: 1}` | unchanged, it was never wrong |
| the record the TYPED pill stored | `{key, name, states, doneFrom}` | `{…, heldFrom: 1}` |
| the record the DIALOG stored | `{key, name, states, doneFrom, heldFrom}` | unchanged |
| `seqDefString` round trip | **`CALM WAITING | BROKEN`** | `CALM | WAITING | BROKEN` |
| the Board's WAITING lane | not held | held |

**The round trip is the visible cost, and it is not in the report.** An author types a three-band
declaration and the app hands back a two-band one. The pill's own unfold shows it; so does an export.

### The fix is structural, not a field

The typed door LISTED the parser's fields; the dialog door spread them (`{ key: seqKey(), ...r }`).
Listing is the defect: it is a copy of a shape that has to be maintained by hand, and it was not.
The typed door now spreads too, so the two records agree **by construction** and any field the parser
gains later reaches both. That is also the census guard the issue asks for -- structural, so it
cannot be satisfied by a builder that merely happens to list `heldFrom` today.

### Verification

`node --test tests/test.mjs` green at **2049**. Seven mutations, each asserting its target present
first, six red at the named pin -- including one that enumerates the fields *correctly* (still
banned: it is the shape that drifts) and one toward the wrong shape (a one-pipe sequence gaining a
phantom held band, which turned six pins red).

Driven after: the consumer (a Board built on the typed sequence marks WAITING held and BROKEN done),
the OPML round trip (`_seq` carries the whole record as JSON, so the reloaded record is byte-equal),
and the one-pipe regression (`heldFrom === doneFrom`, no phantom band, `BACKLOG DOING | SHIPPED` back).

## UXP-317 -- the PILLS section stops being a list of the pills that happen to click (#1403)

**The section IS the keyboard door.** Every pill carries `tabindex="-1"`, so its pencil is unreachable
by keyboard and the bullet menu is the only way to the edit dialog. Driven, one flavour per point:

| pill | rows before | rows after |
|---|---|---|
| dice | Re-roll · Show distribution · **Edit** · Freeze | unchanged |
| grammar / deck | Re-generate · Show distribution · **Edit** · Freeze | unchanged |
| math | **Edit** · Freeze | unchanged |
| anonymous estimate | Re-sample · **Edit** · Freeze | unchanged |
| markov | Re-walk · **Edit** · Freeze | unchanged |
| named **pick** variable | Re-roll pick · Freeze | + **Edit random variable** |
| named **uncertain** variable | Re-sample value · Freeze | + **Edit uncertain variable** |
| named **formula** variable | **nothing at all** | **Edit variable** · Freeze |

### The shape of the omission is the finding

The two variable flavours that had rows had them because they have a **click gesture** -- a pick
re-rolls, a dist re-samples (#952) -- and each was added with its gesture and stopped there. A formula
variable has no gesture, so it never got a loop, and therefore had no section at all. The loops were
gated on `v.kind`; that is exactly how a third kind ends up invisible.

One loop now, gated on the TOKEN (`has('var', v.key)`) with the gesture as a branch inside it. A new
variable kind gets its edit and freeze rows by construction, and the pin asserts no kind-gated loop
remains -- so the omission cannot be re-made in the same way.

### Three strings for one dialog

The pill's pencil said *"Edit uncertain variable"*, the dialog it opened was titled *"Edit variable"*,
and there was no row to disagree with either. `varEditLabel(kind)` is now the single source: the row,
the dialog title and the pencil all read the same words (P1). "Uncertain" is the app's own user-facing
word for a distribution elsewhere, so the dialog moved to the pill's word rather than the reverse.

### A probe that reported a false pass

The acceptance probe matched the first menu row starting with `Edit ` and reported success on all
three flavours -- against **"Edit properties"**, an unrelated row in the same menu, which opens the
Properties dialog. Only the dialog-title readout gave it away. Re-run matching the exact expected
label: all three open their own dialog, focus lands inside it, and the row's words match the title.

### Measured the negative case, and did not complete the set onto it

`Freeze to text` on a *declaration* silently breaks every reference to that name: the referencing
point drops from a live pill to inert raw text with nothing said. That is pre-existing on the two
flavours that already offered it, so extending the row to the third creates no new hazard -- but it
does mean three doors now reach it. **Filed with the measurement rather than bundled**, because the
fix is a decision about what Freeze should mean on a declaration, not a missing row.

### Verification

`node --test tests/test.mjs` green at **2050**. Eight mutations, each asserting its target present
first, seven red at the named pin -- including two toward the wrong shape (a row that names one
dialog and opens another; the dialog title going back to its own copy of the strings) and one that
removes the Edit row from an already-correct sibling (dice), which must also fail.

## UXP-318 -- a toggle that is always on screen, derived only when a menu opens (#1405)

`syncRollLogLabel` was correct and was called from exactly two places: `openFileMenu` and the toggle
itself. So the File-menu row -- which only exists while the menu is open -- read the document
correctly, and the **always-visible** toolbar button kept whatever its markup said. Driven, reload:

| | before | after |
|---|---|---|
| `root.rollLog.on` | `true` | `true` |
| File menu row | *"Log random results: On"*, `aria-pressed="true"` | unchanged |
| toolbar button | **`aria-pressed="false"`, un-lit** | `true`, lit |
| clicking the toolbar button | turned logging **off** | turns it off, and now says so first |

A screen reader was told "not pressed" for a setting that was on, and the click a user makes to turn
logging ON turned it off.

### The census is "every path that assigns root", not "boot"

`root.rollLog` is per-DOCUMENT, so the question is not "does boot sync it" but "does every path that
replaces the document sync it". Four:

| path | what it is | before |
|---|---|---|
| the boot tail | a fresh boot, no restore call at all | no |
| `applyAutosaveData` | the localStorage / OPFS restore -- **the reported one** | no |
| `adoptDoc` | File > Open, New, workspace switch, reopen | no |
| `restoreSnapshot` | undo / redo | no |

The fourth was found by driving, not by the report. All four now derive it.

**The siblings are the argument, again.** `applyAutosaveData` has synced `btn-done` and
`btn-notes` since they shipped -- two of three per-document toggles, in the same function, four lines
apart. And the boot tail already carries `syncVerbosityClass()` with a comment saying it is there
because *"a fresh boot has no autosave-restore call"*: the identical hole, identified and fixed for
one toggle and not the next.

### Two pins of mine that could not fail

- The boot-tail adjacency regex was written for the wrong ORDER after I moved the call, and matched
  somewhere else entirely: deleting the boot call left it green.
- Dropping only the `aria-pressed` write from the toolbar button -- **the half the issue is about** --
  left every assertion green, because the pin checked the `active` tint and the File-menu row's aria
  but never the toolbar button's aria. Both halves are pinned now.

Both caught by mutation. Neither would have been caught by reading.

### A deeper question, filed rather than decided

`restoreSnapshot` restores `root` wholesale, so `root.rollLog` rides in every undo snapshot even
though `toggleRollLog` deliberately does not `pushUndo`. An ordinary undo can therefore revert the
setting. Syncing the button makes that **visible** rather than correct; which document-level settings
should ride in an undo snapshot is a design question over seven fields, and it is filed with the
measurement.

### Verification

`node --test tests/test.mjs` green at **2051**. Nine mutations, each asserting its target present
first, eight red at the named pin -- including one that regresses an already-correct sibling
(`btn-done`) and one toward the wrong shape (the sync reading a constant instead of the document) --
and one negative control green.

Driven after: reload (toolbar, File row and `root` all agree), a doc swap in both directions, undo,
and the negative case (a fresh document with logging off must not light the button).

## UXP-319 -- the freeze counts what it broke, whichever engine held the reference (#1418)

**I filed this issue and the premise was half wrong.** The report said freezing a variable
declaration breaks every reference *silently*. It does not: `#1146` already reads the name before the
prune, counts orphaned references and appends *"1 point using total now shows no value. Undo to put
it back."* to both the announcement and the flash.

My repro used `{= cost * 2}` over a **distribution**, which refuses to promote (`estimate, not math`)
and so was never a pill at all. A bad input shape, not a missing warning -- the same class of error
this session has hit repeatedly, and the reason the first move is always to check the sample against
what the surface should contain.

### The real gap, re-measured

`orphanedVarRefCount` counts `[[var:key]]` **reference pills** and nothing else. Driven, one
declaration and one dependent per document:

| the reference | the pill after freezing | reported |
|---|---|---|
| `{total}` bare reference pill | shows a dash | *"1 point using total…"* ✅ |
| `{cost}` reference to a distribution | shows a dash | *"1 point using cost…"* ✅ |
| `{= total * 2}` math pill | **`#ERR (bad ref)`** | **nothing** |
| `{lo to 90}` estimate pill | breaks | **nothing** |
| `{doubled := total * 2}` dependent declaration | breaks | **nothing** |

So the warning existed and was **undercounting**: a reference is a reference whichever engine holds
it, and only one of the three engines was being asked.

### Reused the identifier rule rather than writing a third one

`exprNamesVar` is the scan `mathErrorReason` already uses, lifted: a dotted name is ONE identifier
(the variable-base projection rule) and a name followed by `(` is a function call, not a variable.
Both properties matter here -- without the call skip a `{= sum(cost)}` rollup would report itself as
a broken dependent, and without the dotted rule `total.count` would. A pin asserts the two sites use
the same regex and the same skip, because a count and an error message that disagree about what a
reference IS would be a worse defect than the one being fixed.

**Chose reporting over confirming.** The house rule is P4 (name the cost), the action already pushes
undo, and the note already says *"Undo to put it back."* A confirm dialog in front of a reversible
action is heavier than the app's own style anywhere else.

### Verification

`node --test tests/test.mjs` green at **2053**. Ten mutations, each asserting its target present
first, nine red at the named pin -- including three toward the wrong shape (counting an expression
below a surviving declaration; counting a record whose token is gone; matching substrings, so
`subtotal` would report as `total`).

Driven after, six documents: math, estimate and dependent-declaration references now counted; two
references add up to `2 points`; and three negatives stay at zero -- a `sum(cost)` rollup, a document
with no dependents, and a name redeclared below the frozen one.

**Issue corrected rather than silently closed:** the report's "silently" claim is wrong for the two
reference shapes it did not test, and the entry says so.
