# Cookbook

*Part of the [generative & computational guide](README.md). Copy a recipe, paste it into a point,
tweak. Each one notes which door (`@` menu, `/` command, or just typing) it uses.*

The conventions:
- Lines like `name: a | b` go in the **`@` → Grammar** dialog (one rule per line).
- `{…}` snippets you can **type directly** into any point.
- "child property" means a value you add via **bullet menu → Add property** (`key: value`).

---

## 1. Fantasy name generator

**`@` → Grammar:**

```
origin: {pre.cap}{mid}{suf}
pre: ka | mor | thar | el | bren | vor
mid: a | e | o | ae | i
suf: thus | dar | ion | wyn | gar | eth
```

→ *"Karion"*, *"Morwyn"*, *"Thargar"*. Click the pill for the next name. Add more syllables for
more variety.

---

## 2. Loot table with rarity

**`@` → Roll table** (or just type it as a one-line rule):

```
loot: 10 gold | a healing potion 2 | a {gem} ring 3 | nothing 4
gem: ruby | sapphire | opal
```

The numbers are weights: `nothing` (4) is commonest, the gem ring (3) next. Entries call other
rules (`{gem}`) and can roll dice (`{2d6} gold`).

---

## 3. Random NPC

**`@` → Grammar:**

```
origin: {name.cap} the {trait} {role}, who {quirk}.
name:  bram | sera | tovin | elga | rurik | mira
trait: nervous | greedy | kindly | grizzled | sly
role:  innkeeper | guard | merchant | smith | scholar
quirk: never makes eye contact | talks too much | owes a debt | hums constantly | is hiding something
```

→ *"Elga the grizzled smith, who is hiding something."*

---

## 4. Yes/no oracle (solo play)

**`@` → Oracle (yes/no)**, pick a likelihood, or type the weighted form directly:

```
{Yes 2 | No}        "likely yes"
{Yes | No}          even odds
{Yes | No 3}        "probably not"
```

Click to ask again. Want the odds to shift with the fiction? Use a [dynamic
weight](generating-text.md#when-the-odds-depend-on-something-dynamic-odds):
`{Yes | No {= danger}}`.

---

## 5. Dungeon room stocker

Combine **repeat** + **rules**. Type directly (or build the rules in `@` → Grammar):

```
This room holds {3x: {feature}}.
```

with rules:

```
feature: a {monster} | a {trap} | {treasure} | nothing of note
monster: goblin | skeleton | giant rat | cultist
trap:    pit | dart | rune | snare
treasure: {2d6} silver | a {gem}
gem: ruby | sapphire | opal
```

`{3x: {feature}}` rolls **three independent** features. For features that shouldn't repeat, use a
deck instead: `{shuffle: a {monster} | a {trap} | {treasure}}` and click to deal them out.

---

## 6. A card deck you draw from

**`@` → Deck** (draws without replacement, reshuffles when empty):

```
{shuffle: A♠ | K♠ | Q♠ | J♠ | 10♠}
```

Each click **draws the next card**; when the deck empties it reshuffles. Use `cycle` instead of
`shuffle` to loop in fixed order, or `once` to stop after the last card.

---

## 7. A budget that rolls up and lints itself

Make a parent point the budget, each line item a child with a `cost` property.

**Parent point:**

```
Trip budget: spent {= sum(cost)} of {budget}
```

- Give the parent a `budget` property (bullet menu → Add property): `budget: 500`.
- Give each child a `cost` property: `cost: 120`, `cost: 90`, …
- `{= sum(cost)}` totals the children **live** as you add line items.

**Now make it check itself.** On the parent, **`/check`**:

```
sum(cost) <= budget
```

The parent shows a muted ✓ while you're under budget, and a visible flag the moment you go over.
Search **`is:failing`** to find every over-budget parent in the document.

---

## 8. Deadline countdown

Give a point a `due` property (or use **`/due`** to schedule it), then anywhere:

```
{= daysuntil(due)} days left
```

It counts down on its own each day (negative once it's overdue). Show the date itself with
`{= asdate(due)}`, or the day of week with a conditional:

```
Due {= asdate(due)} · {= daysuntil(due) <= 3 ? "⚠ soon" : "plenty of time"}
```

---

## 9. Fermi estimate (size a project)

Use **estimates** for the uncertain pieces and let them roll up. Make each task a child with an
`effort` property that's an estimate range:

```
effort: 3 to 8       (on each child task)
```

On the parent:

```
Total effort: {sum(effort)} days
```

The parent shows the **mean with its low-to-high range** and a sparkline: the whole project's
uncertainty, composed from the parts. Click to re-sample. (Build the children's estimates with
`@` → Estimate if you prefer the dialog.)

A standalone Fermi line works too:

```
Revenue ≈ {(1000 to 5000) * (2 to 4)} per month
```

---

## 10. A stat block (dice + keep-highest)

Roll six ability scores, classic 4d6-keep-highest-3, in one point:

```
STR {4d6kh3} · DEX {4d6kh3} · CON {4d6kh3} · INT {4d6kh3} · WIS {4d6kh3} · CHA {4d6kh3}
```

Each is its own pill, so click any one to re-roll just that stat. Dice can add a **variable** as a
modifier, and a variable can be a formula over another variable. Declare (in `@` → Variable):

```
str = 14
str_mod = floor((str - 10) / 2)
```

then roll an attack with the bonus baked in: `Attack {1d20 + str_mod}` → rolls d20 + 2.

---

## 11. Consistent character across a sentence

The trick from [item fields](generating-text.md#items-with-fields-itemfield): freeze the pick
in a variable so it stays the same everywhere.

**`@` → Grammar** (define the item + fields):

```
weapon: longsword | warhammer | dagger
longsword.dmg: 1d8
warhammer.dmg: 1d10
dagger.dmg:    1d4
```

**`@` → Variable**, random pick: `w = {weapon}`. Then in a point:

```
She draws her {w} and strikes for {w.dmg} damage. The {w} gleams.
```

Both `{w}` mentions are the **same** weapon, and `{w.dmg}` is *its* damage die.

---

## 12. Weather that drifts (Markov)

**`@` → Markov**, name it `weather`:

```
sunny → sunny → cloudy → rainy → cloudy → sunny
```

The chain favours transitions you list more often. Reference `{weather}` to generate a plausible
run of days; click to re-walk.

---

**Back to:** [overview](README.md) · [Generating text](generating-text.md) · [Computing
numbers](computing-numbers.md).

> Remember you can **export any of these as a self-contained `.html`** (File menu → Self-contained
> HTML) and hand it to someone; it re-rolls on their machine, no install, no account.
