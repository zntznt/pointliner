# Generators: names, places and loot in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [generators-demo.opml](generators-demo.opml) (open it in Pointliner via File, Open)

Every solo player hits the same wall: the fiction asks for a name, a place or a fistful
of treasure, and your mind goes blank. A generator is the fix. You draw one instead of
inventing one, the scene keeps moving, and half the time the random result is better than
what you would have reached for anyway.

This example is the one where Pointliner's **grammar engine** does the heavy lifting. The
other cases lean on dice and oracles; this one is built almost entirely out of `{…}` pills
that compose small lists into names, taverns and loot tables. Three generators, three
tricks: a **Markov chain** that grows a name syllable by syllable, a **rule-based place
generator** that references named rules and reshapes them with modifiers and a **weighted
loot table** whose items carry their own fields. Nothing here is a new notation to learn.
It is the same `{…}` grammar as the rest of the guide, pointed at the blank-page problem.

---

## The name chain: a Markov walk over syllables

A Markov chain is the fancy-sounding trick behind most good name generators, and it fits in
one pill. You give it a list of **syllable transitions**, each written `source→next`, and it
walks them: start on the first syllable, hop to a random syllable that can follow it, hop
again and stop when it runs out of exits. The path it took, joined up, is the name.

```
{markov: ka→la, la→sh, sh→ka, ka→ra, ra→n, n→dor, dor→a, a→ka}
```

Read that as a little graph. From `ka` you can go to `la`, `ra`. From `sh` you can go to
`ka` or, in the demo's fuller list, to `ael`. Click the pill and it grows a fresh path each
time: Kalash, Karndor, Kalashael, whatever the walk stumbles into. The `→` is just the
literal arrow character in the text, nothing to escape. Add more transitions and the names
get more varied; give a syllable two possible nexts and the chain has a real choice to make.

If a full chain feels like too much bookkeeping, there is a lighter rule-based builder in the
demo that snaps a prefix onto a suffix:

```
{prefix}{suffix}
```

Those are **two separate pills**, each reading its own named rule (`prefix:` and `suffix:`),
and they roll independently. So `Ka` + `dros` gives Kadros, the next click gives Vorwyn or
Malthas. It is cruder than the Markov walk, but it is instantly legible and easy to tune: the
whole namespace lives in two lists you can read at a glance.

---

## The place generator: named rules and modifiers

Taverns, temples and towns are where **named rules** earn their keep. A named rule is just a
point whose text reads `rulename: option | option | option` at the line start. Once it exists,
`{rulename}` picks one of its options anywhere in the document. Rules can reference each other,
so you build a place out of layers:

```
tavern: The {adjective} {animal} | The {animal} and {animal} | The {adjective} {noun}
adjective: Rusty | Salted | Gilded | Crooked | Weeping | Drowned
animal: Kraken | Wyrm | Magpie | Boar | Otter | Raven
noun: Anchor | Lantern | Crown | Coin | Barrel | Compass
```

Now `{tavern}` reaches down through the layers and returns The Salted Kraken, The Raven and
Boar, The Gilded Lantern. Each click rerolls the whole tree. The rules are shared across the
whole document, so the same `{animal}` list that names taverns can name anything else you like.

The second half of the place trick is **modifiers**: a dotted suffix that reshapes a reference
after it resolves. They keep the grammar readable instead of forcing you to write a separate
capitalized-and-articled version of every list.

```
{animal.cap}     capitalize the first letter
{animal.a}       add "a" or "an" to taste (an Otter, a Kraken)
{noun.upper}     SHOUT IT
{adjective.title} Title Case
{animal.lower.s} lowercase, then pluralize (otters)
```

The closed set is `cap`, `title`, `upper`, `lower`, `a`, `s`, `ed` and `ord`, and you can
**chain them left to right**, as `{animal.lower.s}` does: lowercase first, then pluralize the
result. So "you push open the door to `{animal.a}`" reads naturally whether the walk lands on a
consonant or a vowel, and you never keep two copies of a list in sync by hand.

---

## The loot table: weights and hierarchical items

A loot table has two jobs the place generator does not: it should hand out common junk far more
often than rare prizes, and sometimes an item needs to carry a **fact** with it (a weapon's
damage, a potion's effect). Both are one pill each.

**Weighted alternation** solves the first. Put a number after an option and that is its weight;
leave it blank and the weight is 1:

```
loot: a handful of copper 6 | a silver ring 3 | a jeweled dagger 2 | a humming wand | an old map
```

Copper comes up six times as often as the wand. Click `{loot}` and it rolls against those
weights, so a chest full of copper with the occasional glint of something better feels right
without you thinking about probabilities. Tune the whole economy by editing the numbers.

**Hierarchical items** solve the second. An item can carry a field by defining a dotted
sub-rule, and you read the field back with `{item.field}`:

```
weapon: sword | axe | mace | spear
sword.damage: 1d8
axe.damage: 1d10
mace.damage: 1d6
spear.damage: 1d8
```

Now "you loot a `{weapon}`, it hits for `{weapon.damage}`" pulls a weapon and its damage. The
important rule to internalize: **`{item.field}` only resolves when the item that got picked has
a matching `item.field:` sub-rule defined at a line start.** Drop the `axe.damage` line and an
axe roll leaves the damage pill undefined. So every item you want to carry a field needs its own
sub-rule, which is exactly the structure that makes it reliable.

One catch worth naming: two pills roll independently, so a bare `{weapon}` next to a bare
`{weapon.damage}` might pick a sword for one and an axe for the other. To keep them in agreement,
**bind the pick to a variable first**, then read the variable's fields:

```
{w := weapon}   then   {w} for 1d8 or whatever {w.damage} matches
```

`{w := weapon}` picks once and remembers, so `{w}` and `{w.damage}` both read the same draw. The
demo shows both forms so you can feel the difference.

---

## Run it yourself

Open the [demo file](generators-demo.opml) in Pointliner (File menu, Open) and it comes up as a
real outline with every pill live. A few things to try:

- **Grow a dozen names.** Click the Markov pill over and over and watch it wander a different
  path each time. Then click the `{prefix}{suffix}` pair a few times to feel the difference
  between a chain and a snap-together builder.
- **Roll a street of taverns.** Click `{tavern}` repeatedly. Every roll reaches down through
  `adjective`, `animal` and `noun`, so you get a fresh sign each time, and the modifier line
  shows the same lists capitalized, articled and pluralized.
- **Reweight the loot.** Click `{loot}` to feel the odds, then click into the `loot:` list and
  change a number. Bump the wand's weight up and watch it start showing. The whole economy is
  the numbers in that one line.
- **Break the item field on purpose.** Delete the `spear.damage:` line, then roll the weapon
  pill until it lands on a spear: `{weapon.damage}` goes undefined, which is exactly how you
  learn that a field lives or dies with its sub-rule. Put the line back and it heals.
- **Edit the lists to make them yours.** Click the text next to any pill (say
  `animal: Kraken | Wyrm | ...`) and add, remove or reweight options. Every `{animal}` pill in
  the file reads the same rule, so one edit ripples through names and places alike.
- **Add a whole new generator.** Write a point `spell: {adjective} {noun} of {animal}` at a line
  start and reference it with `{spell}`. That is the entire recipe: a named rule is a point, a
  reference is a pill, and modifiers and fields extend it without any new syntax.

---

## Why do this in Pointliner

A binder of random tables on paper is a wonderful thing, and this does not replace it. What the
grammar engine adds is that the tables **compose and live in one file**:

- one `{animal}` list feeds every generator that references it, so a single edit updates names,
  taverns and loot at once, no copies to keep in sync
- the Markov chain and the weighted table roll fresh on click, so the file is a generator, not a
  static list you read down
- modifiers (`.cap`, `.a`, `.s`) and hierarchical fields (`{item.field}`) let a small set of
  lists produce natural, detailed results without a combinatorial pile of pre-written entries
- rules are document-wide, so your name lists, place lists and loot tables all live in the same
  outline as the campaign they feed, one search away

It is one offline file you own, and the generators you build open and re-roll on anyone's machine
with no install and no account.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
