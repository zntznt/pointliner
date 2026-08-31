# Composing pills

*Part of the [generative & computational guide](README.md). How pills feed each other: side by
side, through a variable, and through the tree.*

Pills are not meant to be used one at a time. The whole engine is designed so one pill can
feed another: a variable holds a die roll, a condition reads that variable, a math pill reads
the same one. This page tours the three patterns, from simplest to most powerful.

## Side by side

Place two pills in the same line with ordinary text between them. Each pill computes
independently, and the result reads as a single sentence. The results shown below assume **Show
value only** is checked on each math pill; by default a math pill also prints its formula, as
`sum(cost) = 320` (see [show just the value](computing-numbers.md#show-just-the-value)).

```
Spent {= sum(cost)} of {= budget}
```
Renders as: **"Spent 320 of 500"**, a live budget statement with two math pills and the
word "of" between them.

```
{= min(cost)}–{= max(cost)}
```
Renders as: **"12–89"**, the range of a property across children, with just a dash.

```
{= words(subtree)} / 5,000
```
Renders as: **"3,420 / 5,000"**, progress toward a word-count goal, with the pill and
the target side by side.

```
Condensed: {= sum(hours)}hrs · {= avg(score)}/100
```
Renders as: **"42hrs · 87/100"**, a compact status line using middots as separators.

A directional indicator is a conditional pill and a variable:

```
{mod := 3}
{r := 1d20} {r == 20: Critical! | {= r + mod}}
```
Rolls a d20 once, then shows either "Critical!" or the modified result, using the same
captured value.

## Through a variable

Declare a variable to capture a result, then read that variable from any other pill. The
variable freezes the random outcome so every reader agrees.

```
{mod := 3}
{r := 1d20}
{r == 20: Critical! | {= r + mod}}
```
The `r` pill captures the roll. The conditional below it reads the captured number and
adds `mod`. Click the capture pill to re-roll and the conditional follows.

```
{party := 4}
Spend: {= party * 55} gp · Split: {= 220 / party} gp each
```
Declare the party size once. The total cost and per-person split both read the same
variable.

```
{w := {weapon}}
{w.a.cap} hits for {w.damage}
```
Picks a weapon from a grammar rule (see the generators guide), freezes the pick, then
reads the weapon's name with an article and its damage die from the same choice.

## Through the tree

Properties on parent points are visible to children below them. A child reads the parent's
number without declaring anything.

```
Plan (parent)   {= sum(cost)} spent of {= budget} {prop budget: 500}
  Train (child)   {prop cost: 120}
  Hotel (child)   {prop cost: 180}
  Food (child)    {prop cost: 90}
```

The parent declares `{prop budget: 500}`. Children carry `cost` properties. The parent's math
pill reads `{= sum(cost)}`, the total of all children's costs, and displays it side by
side with the budget. With the Plan point selected, type `/check:sum(cost) <= budget` and the
check watches the same sum. The child points need no declarations.

The nearest value wins: a point's own property beats an ancestor's, and a nearer ancestor
beats a farther one. So a child can override the parent's number by setting its own.

## What you cannot mix

Estimates and math are separate engines. An estimate inside a `{= …}` math pill never becomes a
pill at all: the braces stay on the page as red text with an **estimate, not math** tag beside
them, and hovering explains why.

```
{= (5 to 10) * 2}    ✗ stays text, tagged "estimate, not math"
```

Drop the `=` and the whole thing stays an estimate, which is what that hover advises: the
estimate engine does the arithmetic itself and carries the uncertainty through.

```
{(5 to 10) * 2}      one pill: the mean, the range and the sparkline
```

Or compose them side by side when you want both views at once:

```
{avg_cost := 7.5}
{5 to 10} × 2 ≈ {= avg_cost * 2}
```

The estimate pill shows the uncertain range. The math pill shows the deterministic
equivalent. They sit next to each other and the reader gets both views.

## What's next

The [cookbook](cookbook.md) has ten copy-paste recipes that demonstrate every pattern at
work in a finished document. The [generating text](generating-text.md) and
[computing numbers](computing-numbers.md) guides cover the individual pill forms that
compose into these patterns.

---

**Back to:** [the guide](README.md).
