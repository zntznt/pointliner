# A living character sheet in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [character-sheet-demo.opml](character-sheet-demo.opml) (open it in Pointliner via File, Open)

Most character sheets are dead paper. You write `Level 3`, then somewhere else you write
`HP 24`, and the two numbers only agree because *you* did the multiplication and copied the
answer over. Change the level and every derived number is suddenly a lie until you go back
and fix each one by hand.

This guide builds a sheet that fixes itself. The stats are **variables**, the derived rows
are **math that reads those variables**, the pack total **adds up its own contents**, and an
**encumbrance check** turns red the instant you carry too much. It is system-agnostic (no
copyrighted game, just a hedge-scout named Kestrel and some plausible gear), so you can lift
the shape and drop in whatever numbers your table uses.

---

## The one idea: a number that depends on another number should compute, not copy

Everything below is one move, applied over and over: **name a value once, then let anything
that depends on it read the name instead of a copied-out number.** When the source changes,
the dependents change with it. There is no re-copying and nothing to keep in sync, because
nothing was ever duplicated in the first place.

Pointliner gives you three tools for this, and the demo uses all three:

- a **variable** to name a value (`{level := 3}`)
- **math** to derive a new value from named ones (`{= level * 8}`)
- a **rollup + check** to total a list of points and lint the total (`{= sum(weight)}` for the sum,
  and a `check` of `sum(weight) <= 10` on the pack point)

---

## The stat block: variables you can edit

Near the top of the sheet, each core stat is its own point that **declares a variable**:

```
Level: {level := 3}
Might (raw): {might := 2}
Grace (raw): {grace := 3}
Wits (raw): {wits := 1}
```

`{name := value}` is a declaration. It reads "the variable `level` is 3" and renders as a
small pill showing the value. The important part is invisible: that name is now available to
**the whole document**. Any point, anywhere, can say `{level}` and get `3`, or do arithmetic
with it. You are not writing the number into a formula; you are writing it *once*, here, where
you will look for it when you want to change it.

---

## The derived rows: math that reads the stats

Directly below, the derived numbers never store a value of their own. They **compute** from
the stats above:

```
Hit points, eight per level: {= level * 8}
Defense, ten plus grace: {= 10 + grace}
Proficiency, half your level rounded up: {= ceil(level / 2)}
```

`{= expression}` evaluates live. With `level` at 3, the hit-points pill shows `24`. It is not a
stored `24`, it is a recipe: `level * 8`, computed every time the sheet renders. That is the whole
payoff. Edit the `{level := 3}` pill to `{level := 5}` and the hit-points row becomes `40` on its
own, with no second edit. Defense reads `grace`, proficiency reads `level`, and each one follows
its source the same way.

Rolls read the sheet too. The attack line is `{2d6+might}`: two dice, plus the current value of
`might`. Raise the raw stat and every roll that mentions it gets stronger, because the modifier is
the variable, not a frozen number you typed next to the dice.

---

## The pack: a total that adds itself

Gear is the classic place where paper sheets go stale, because the carried weight is a running
sum you have to redo by hand every time you pick something up. In Pointliner the pack is a point
with the gear as its **direct children**, and each item carries a `weight` property:

```
Carried load, carrying {= sum(weight)} of 10   (with a check: sum(weight) <= 10)
  Short bow {prop weight: 2}
  Quiver, twenty arrows {prop weight: 1}
  Hunting knife {prop weight: 1}
  Leather jerkin {prop weight: 3}
  Bedroll and cloak {prop weight: 2}
  Rations, three days {prop weight: 1}
```

Two things are happening on that pack point.

First, `{= sum(weight)}` is a **child-property rollup**, and it lives **on the pack point itself**,
not on a line beside the gear. That placement is the whole of it: a rollup walks the points BELOW
the one holding it, so written as a sibling of the items it matches nothing and reads zero. It walks
the point's direct children,
reads each one's `weight` property and adds them. It is live: add an item, remove one or edit a
weight, and the total recomputes. There is no cell you maintain and no formula to drag down. The
list *is* the data, and the sum reads the list.

Second, `{prop weight: N}` on each item is how the weight gets there. It is an ordinary property
written inline. You never hand-edit any JSON; you type `{prop weight: 2}` in the item's text and it
becomes a small property chip that the rollup can see.

---

## The check: a rule that goes red when you overload

The interesting part is on the pack point itself: it carries a **check** of `sum(weight) <= 10`.
You add one from the point's bullet menu (**Add check**) or by typing **`/check`**, then writing the
test; it is not a property you type inline, it gets its own small pass/fail chip below the point.

A **check** is a linter for your document. It carries a comparison (a check *must* have one:
`<=`, `<`, `>`, `>=`, `==`, `!=`), and it evaluates that comparison over the point and its
children. Here it asks: **is the total carried weight 10 or under?** While it is, the chip sits
quiet as a small muted tick. The moment the total crosses 10, the chip turns **red** and the point
is flagged.

Try it. The starting pack sums to 10, so the check passes. The demo has a spare line telling you
to add an `Iron cook pot {prop weight: 2}` into the pack. Do that (or bump any weight up by one) and
the total climbs to 12, `sum(weight) <= 10` becomes false, and the Carried load chip goes red.
Drop something and it clears. The rule is written once and enforces itself forever after, exactly
like the derived math, except the answer it computes is *pass or fail* instead of a number.

Because a check is a real document-wide thing, you can also search **`is:failing`** to pull up
every check that is currently red across the whole sheet at once. On a bigger character, that is the
difference between "I think I am fine" and "here are the three things that are actually broken."

---

## Run it yourself

Open the [demo file](character-sheet-demo.opml) and poke at it:

- **Change level and watch HP update.** Click the `{level := 3}` pill and set it to `5`. The
  hit-points row (`{= level * 8}`) becomes `40` with no other edit. Proficiency and the level-scaled
  save move too, because they read the same name.
- **Raise a stat and re-roll.** Bump `{might := 2}` to `4`, then click the attack roll
  (`{2d6+might}`) a few times. The modifier followed the stat.
- **Overload the pack.** Add the cook-pot line, or edit any `{prop weight: N}` upward, until
  `{= sum(weight)}` passes 10. The Carried load check flips to red. Remove the weight and it clears.
- **Find every problem at once.** Search `is:failing`. While the pack is overloaded, the check
  shows up in the results; fix it and it drops out.

Nothing here is a new notation. Stats are variables, derived rows are math, the pack total is a
child rollup, and the encumbrance rule is a check. It is the same `{…}` grammar the rest of Pointliner
uses, pointed at a character sheet.

---

## Why bother doing this in Pointliner

A paper sheet is fast to make and asks nothing of you. What you give up is that the paper never
notices when it is wrong. The trade Pointliner offers is a sheet that **does the arithmetic and
catches the mistakes**:

- derived numbers can never drift from their inputs, because they are recipes, not copies
- the pack total is always correct, because it reads the actual list of gear
- an out-of-range value announces itself in red instead of hiding until it matters mid-scene
- rolls carry the current modifier automatically, so a stat change is one edit, not a dozen
- the whole thing is one offline file you own, and it opens and recomputes on anyone's machine
  with no install and no account

If your character has a handful of numbers that all depend on each other, this is a comfortable
home for it. If your game is light enough that a stat block fits on an index card, the index card
is genuinely fine.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
