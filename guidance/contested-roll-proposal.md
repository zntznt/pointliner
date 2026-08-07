# Contested rolls and margins (research + proposal)

Status: **Shipped** (2026-08) — PR 1 (engine + bare pill), PR 2 (named + math + taught) and the deferred
RNG seed have all landed; see the `#1243` tests in `tests/test.mjs`. Side labels remain the one v2 idea
(open question 3), and are not part of the #1243 ask. Source: panel finding **#1243** (2026-08 laptop
panel, engineer + weekend GM persona). Read `guidance/adding-an-artifact.md` (the P5 gate), `guidance/ux.md` (verbosity), and the
CLAUDE.md "both arms" rule before building.

**Decisions (owner-approved, 2026-08):** (1) syntax is the **`vs` operator** (`{name := A vs B}`), not a
`{vs:}` form; (2) **extend the pick-var record** with a versus source, not a new `[[versus:key]]`
artifact; (3) **side labels deferred to v2**, v1 reads `9 vs 7 -> +2`; (4) a mismatched-kind contest
(sum vs success-pool) **warns (P4) but still computes**; (5) the bare `{A vs B}` is **not referenceable**,
name it to feed math. The Open Questions section below is retained as the rationale for each.

## The gap

The single most common resolution in tabletop play is a **roll versus roll with a margin**: attack vs
defense, a contest vs a contest. Pointliner has no first-class opposed roll. You roll two separate dice
pills and compare them by eye, because a dice pill freezes to its own value and there is no form that
pits two rolls against each other and reads the difference. The panel called this "in-charter and stings
for it: it is dice plus math, not a new language." A first-class opposed roll moves the app from "great
solo oracle" toward "runs my whole table."

A second, smaller ask from the same persona (a **recorded deferral**): the RNG seed already stored on
estimates should extend to dice and decks, so a shared session reproduces an identical draw. Covered last.

## What the engine already gives us (verified in code)

The pieces are almost all present; the opposed roll composes them rather than inventing anything.

1. **`parseDice(input, vars)` is already rich.** It parses multi-term expressions with `+/-`, reads
   document variables (`2d6+str`), and handles keep/drop (`4d6kh3`), reroll (`4d6r1`), exploding
   (`2d6!`), Fate (`4dF`), and **success pools** (`6d10>=7`).
2. **`rollParsed(terms)` returns a single `total` for every one of those.** A sum expression totals its
   pips (`2d6+str` -> 9); a success pool totals its **successes** (`6d10>=7` -> 3). This is the crux of
   "works at any level": a contested roll is *roll A, roll B, margin = totalA - totalB*, and it reads the
   same whether the sides are simple sums or success pools, because `rollParsed` has already collapsed
   each side to one number.
3. **A captured die already bridges dice into math.** `{r := 1d20}` declares a pick variable whose value
   is a die **rolled once and frozen**, re-rollable by click, and readable in math: `{= r * 2}` works
   today (index.html: "a captured die `{r := 1d20}` composes with conditionals and math"). The bridge is
   the var channel: a pick var contributes its frozen `rolled` value to the varMap that `evalMath` reads
   (`m[name] = v.kind === 'pick' ? v.rolled : v.expr`). **evalMath never rolls dice** and does not need
   to; the roll happens in the pill, and only the resulting number enters math.
4. **The freeze/reroll machinery exists.** Pick vars freeze on roll and re-roll on click through
   `rollPickSource` / `rerollPickVar`, which is exactly the "freeze both sides together on click" the
   issue asks for.

## The design: an opposed roll is a pick var whose frozen value is the margin

Add a `vs` operator to a roll expression. The canonical form is a **named** declaration, so the margin
feeds math:

```
{contest := 2d6+str vs 2d6+def}
```

- On click it rolls **both** sides (`parseDice`+`rollParsed` each), freezes them **together** as one roll
  event, and stores `rolled = totalA - totalB` (the margin), plus both sides' results for display.
- The pill shows both sides, the margin, and the verdict: `str 9 vs def 7 -> +2, win`.
- It feeds `evalMath` through the **same channel a captured die already uses**: `{= contest}` is the
  margin, `{= contest > 0}` is the win test, `{= contest * 5}` is margin-scaled damage, `{= max(contest,
  0)}` clamps a loss to zero. Degrees of success fall straight out of the number.

A **bare** form is the display shorthand for when you do not need to reference the margin elsewhere:

```
2d6+str vs 2d6+def
```

renders a frozen opposed-roll pill showing both sides, the margin, and the verdict, with no name. (It is
an anonymous frozen roll, the same record with a generated key and no `name`.)

This is "dice plus math, not a new language": it composes the dice engine (each side) with the var freeze
channel (margin into math). The only new notation is the `vs` operator inside a roll expression.

## Semantics across every level

Because each side collapses to one `total`, one rule covers the whole spectrum:

| System | Example | Margin |
|---|---|---|
| Simple sum | `2d6 vs 2d6` | difference of sums |
| Modified sum | `2d6+str vs 2d6+def` | difference of sums, with variable modifiers |
| Keep/drop | `4d6kh3+prof vs 2d8+2` | difference of the kept-sum totals |
| Success pool vs pool | `6d10>=7 vs 5d10>=7` | difference in **success count** (net successes) |

- **Verdict:** `margin > 0` A wins, `< 0` B wins, `== 0` tie. The magnitude is the degree of success,
  which is the whole point for scaling damage or effect.
- **Compare like with like.** A margin between a *sum* side and a *success-pool* side is meaningless
  (pips minus successes). The engine can still subtract, so the guard is a **P4** authoring warning when
  the two sides are different kinds, not a silent wrong number. (Same-kind is the overwhelming case; the
  warning only fires on a genuine mismatch.)

## Freeze and reroll (the pick-var trick)

Clicking the pill rolls both sides at once and freezes both plus the margin together, re-rollable, exactly
as `rerollPickVar` freezes a captured die. Roll-log coverage is **mandatory** (#918): the reroll calls
`logRoll(node, source, result)` where `source` is the expression and `result` the frozen margin, so an
opposed roll lands in the user's Rolls log like every other generative pill. The `#918 roll-log coverage`
test lists the reroll function and fails if it forgets.

## Artifact or composition (the P5 gate)

Per `adding-an-artifact.md`, the first question is whether this needs a new artifact at all. It does not
need a *wholly* new one: an opposed roll is a **pick variable with a versus source**. The recommendation
is to **extend the variable record** rather than mint a parallel token:

- A pick var already carries `{ key, name, kind: 'pick', source, rolled }`. Add a versus shape to the
  source: `source = { versus: true, left: <dice string>, right: <dice string> }`, and on freeze store
  `rolled` (margin) plus `leftResult` / `rightResult` for the two-sided display.
- Rendering: the var pill's renderer gets a versus branch that draws both sides plus the margin plus the
  verdict, instead of a single value. No new `[[type:key]]` token, no new sidecar array: it rides
  `node.vars` and the `[[var:key]]` pill.

This keeps the closed syntax inventory closed (only the `vs` operator is added, inside the existing roll
grammar), reuses the freeze/var/evalMath channel wholesale, and is the smallest change that delivers the
feature. The alternative (a dedicated `[[versus:key]]` artifact with its own sidecar) is fully specified
by the recipe if review prefers a clean separation; the tradeoff is duplicating the freeze/reroll/logRoll
wiring the var pill already has.

## evalMath integration (why this is clean)

The margin reaches `evalMath` with **no change to evalMath's dice-blindness**. The opposed roll freezes a
number into the var's `rolled`, and `collectVars` already exposes a pick var's `rolled` to the varMap that
`evalMath` reads. So `{= (2d6+str) - (2d6+def)}` semantics is delivered not by teaching math to roll dice
(which would re-roll every render and never freeze), but by a frozen pill whose result *is* a math value.
This is the resolution of the issue's core tension.

## Syntax decision (open, with a recommendation)

- **A (recommended): a `vs` operator** inside a roll or a var source. `{name := A vs B}` (named, feeds
  math) and `{A vs B}` (bare, display). Reads naturally, nests cleanly into the var declaration, and is
  what the issue sketched (`{2d6+str vs 2d6+def}`).
- **B: a `{vs: A, B}` colon form** in the `{roll:}` / `{shuffle:}` family. Consistent with that family,
  but to feed math you still wrap it in a name (`{c := {vs: ...}}`), which is a level of nesting A avoids.

**Labels** (optional, a v2 nicety): `{name := attack: 2d6+str vs defend: 2d6+def}` would let the pill read
`attack 9 vs defend 7`. It complicates the parse; v1 can ship label-free and read `9 vs 7 -> +2`.

## Verbosity and conformance (`guidance/ux.md`, P1 to P5)

- Capability at **all three tiers**: the `vs` operator is typeable everywhere; the `{` picker and the
  `@`/Variable dialog teach it (a `BRACE_FORMS` row is mandatory, enforced by the parity test). No at-rest
  chrome is added to lean.
- **P1** one meaning for `vs` everywhere; **P2** the `{` picker and Variable dialog surface it, the pill
  prints its verdict; **P3** the pill body-click rerolls in place and stays in display mode, the pencil
  opens the dialog, aria-label reads `Contest: 9 vs 7, +2` and updates on reroll; **P4** a mismatched-kind
  or malformed side explains why, never fails silently; **P5** no new language, the margin is the existing
  var-into-math channel and the only new notation is `vs`.

## Phasing

- **PR 1 (engine + bare pill):** `parseVersus` (split on `vs`, parse each side with `parseDice`);
  `rollVersus` (roll both, margin, verdict); the versus source on a pick var; freeze/reroll; the pill
  renderer; the bare `{A vs B}` form; `logRoll`. Pure cores pinned both arms (parse, roll, margin across
  sums and success pools, the mismatched-kind guard). This ships a working opposed roll.
- **PR 2 (named + math + teach):** `{name := A vs B}` feeding `evalMath` via the var channel; the `{`
  picker row + Variable dialog copy; a concept-guide entry; a game-workbench or campaign-oracle starter
  beat showing an attack-vs-defense contest that scales damage by the margin.
- **Deferred (separate):** the RNG seed, below.

## The RNG seed (secondary, deferred)

Estimates already draw from a seeded generator (`varDistDraw` is deterministic given the record's inputs),
so an estimate is reproducible. The ask is to carry a comparable **seed on dice and deck records** so a
shared document reproduces an identical draw on reopen. This is a separate, self-contained change: give a
generative record an optional seed, thread it through `rnd()` (replacing the bare `Math.random()` for
seeded records), and expose it (show and set) for reproducible sessions. It does not block the opposed
roll and is filed here as the recorded deferral, to pick up after the contest form ships.

## Open questions
1. Syntax A (`vs` operator) vs B (`{vs:}` form). Recommendation A.
2. Extend the var record (recommended) vs a dedicated `[[versus:key]]` artifact.
3. Optional side labels in v1 or v2.
4. Mismatched-kind (sum vs pool): warn (P4) vs refuse. Recommendation: warn, still compute.
5. Does the bare `{A vs B}` need to be referenceable? Recommendation: no; name it to reference it.

## Test strategy (both arms)
- Pure: `parseVersus` (splits, rejects a missing side, parses each with `parseDice`); `rollVersus`
  (margin = totalA - totalB across sums, modifiers, keep/drop, and success pools; verdict sign; seeded so
  the pin is deterministic via an injected roller); the mismatched-kind classifier. Prove each pin bites.
- Source-pin the var-pill versus render branch, the freeze/reroll, the `logRoll` call, the `BRACE_FORMS`
  row, and the evalMath var-channel read.
- Live-drive: a named contest freezes both sides and a margin; `{= name}` reads the margin; reroll
  refreshes both together and the log records it; a success-pool contest reads net successes; the export
  flattens the pill to its verdict.
