# Generating text

*Part of the [generative & computational guide](README.md). This is the **Generate**
family: pills that make random text (dice, tables, name generators, decks, oracles).*

Everything here is one syntax: **`{curly braces}`**. Type something inside `{…}`, click away
from the point, and it becomes a **pill**. Click the pill to roll it again. Click the words
next to it to edit the `{…}` back.

If you'd rather not memorize syntax, type **`@`** in a point: the menu has a **dialog for every
generator** (Dice, Grammar, Roll table, Deck, Oracle, Markov, Variable) with a live preview that
teaches you the form as you fill it in. This page is the *why* behind those dialogs.

---

## Pick one of several (alternation)

The simplest generator. Separate choices with `|`:

```
{sword | shield | potion}
```

→ a pill showing one of the three. Click it to re-pick. Choices can be whole phrases:

```
You found {a rusty key | nothing but cobwebs | a sleeping cat}.
```

### Make some choices more likely (weights)

Put a number after a choice to weight it (default weight is 1):

```
{common | uncommon 2 | rare 5}
```

Here `rare` is five times as likely as `common`. Weights can even be **live expressions** over
your variables: see [dynamic odds](#when-the-odds-depend-on-something-dynamic-odds).

---

## Name things you'll reuse (rules)

A **rule** is a named generator you can call from anywhere by its name in braces. You build rules
in the **`@` → Grammar** dialog, one per line, `name: choices`:

```
origin: a {color} {animal}
color:  red | blue | green | gold
animal: fox | owl | dragon | toad
```

- The **`origin`** line is what the pill shows: here, e.g. *"a gold dragon"*.
- `{color}` and `{animal}` are **rule calls**: the engine substitutes a random pick from each.
- Rules can call rules, which call rules. The engine expands recursively until it bottoms out in
  plain text.

**Rule names are document-wide.** Once a grammar pill defines `color`, you can write `{color}` in
*any* point in the document and get a colour. (If two pills define the same name, the document
wins over a plugin pack; otherwise last definition wins, so keep names unique.)

A rule's choices can include **anything on this page**: dice, other rules, even math:

```
treasure: {2d6} gold | a {color} gem | nothing
```

---

## Roll dice: `{NdM}`

Dice are a built-in generator. The pattern is **N**d**M** (roll N dice of M sides):

```
{2d6}        two six-sided dice, summed
{1d20+5}     a d20 plus a flat 5
{3d8-1}      three d8, minus 1
```

You can use a **variable** as a modifier: `{2d6+str_mod}` adds the value of a `str_mod` variable.

The dice engine speaks the common tabletop notations:

| Pattern | Meaning |
|---|---|
| `{4d6kh3}` | roll 4, **keep highest 3** (classic stat roll) |
| `{4d6kl3}` | roll 4, **keep lowest 3** |
| `{4d6r1}`  | roll 4, **reroll any die ≤ 1 once** |
| `{2d6!}`   | **exploding** (a max-value die rolls again and adds) |
| `{4dF}`    | **Fate/Fudge dice** (each −1, 0, or +1) |
| `{6d10>=7}`| **success pool** (count dice that meet the target) |

Click the pill to re-roll. (All of this is also in the **`@` → Dice** dialog.)

---

## Shape the words (modifiers)

A `.modifier` after a rule or variable transforms its text. This is how you get *"an ogre"*
instead of *"a ogre"*, or a plural, or a capital letter, without writing a separate rule for
each case.

```
{beast.a}      → "an ogre"  (vowel-aware article)
{noun.s}       → "foxes"    (pluralize)
{name.cap}     → "Gandalf"  (Capitalize first letter)
{title.title}  → "Old Dog"  (Capitalize Each Word)
{shout.upper}  → "DOG"
{calm.lower}   → "dog"
{verb.ed}      → "walked"   (past tense)
{n.ord}        → "3rd"      (ordinal)
```

The full set: **`a` · `s` · `cap` · `title` · `upper` · `lower` · `ed` · `ord`**.

Modifiers **chain**, left to right:

```
{beast.a.cap}  → "A dragon"
```

> Modifiers attach to a **rule or variable name**, not to a bare `{a|b}` or a dice roll. If you
> want a modified random pick, name a rule first (`creature: ogre | dragon`) then `{creature.a}`.

*Known limits (they're heuristics, not a dictionary): `a`/`an` looks at the first letter
("an hour" / "a university" come out wrong); plurals are the regular English rules
(`child` → `childs`); title-case splits on spaces only.*

---

## Say different things in different cases (conditionals)

Emit one text when a comparison holds, another when it doesn't:

```
{hp>0: still standing | defeated}
```

- Left of the `:` is a comparison (`>`, `>=`, `<`, `<=`, `==`, `!=`), usually against a
  **variable** (here `hp`).
- Right of the `:` is `then | else`. The `else` is optional: `{hp>0: still standing}` emits
  nothing when false.

The branches are full templates, so they can roll dice or call rules:

```
{gold>=100: you buy {a {weapon} | armor} | you can't afford anything}
```

---

## Draw without repeating (decks)

Alternation can repeat the same choice twice in a row. A **deck** won't: it draws *without
replacement*. Build one in the **`@` → Deck** dialog, or type a mode keyword before the `:`

```
{shuffle: ace | king | queen | jack}
```

Four modes:

| Mode | Behavior |
|---|---|
| `shuffle` | a **deck**: draws each item once in random order, reshuffles when empty |
| `cycle`   | loops through **in order**, forever |
| `once`    | each item once, then nothing |
| `stopping`| advances through, then **stays on the last** |

A deck pill is **stateful**: click it to **draw the next card** (it doesn't re-roll, it advances).
Its position is saved with the document.

---

## Do it N times (repeat)

Emit a template several times, **re-rolled independently each time**:

```
{3x: {beast}}        → "ogre dragon ogre"   (three independent picks)
{2x: {2d6} gold}     → "7 gold 11 gold"
```

The count is 1 to 99; results are joined by spaces. (For draw-*without*-repeat, use a deck instead.)

---

## Store a value and reuse it (variables)

A **variable** is a named value you declare once and reference with `{name}`. Declare one in the
**`@` → Variable** dialog. Two kinds:

- **Formula:** `r = 5` or `area = pi*r^2`. It's a number; reference it in math or dice.
  (See [Computing numbers](computing-numbers.md).)
- **Random pick:** `beast = dragon | wyrm | hydra`. The dialog rolls it **once** and **freezes**
  the result, so `{beast}` reads the *same* value everywhere until you re-roll the declaration.

That freeze is the point: a random-pick variable gives you **consistency**. If three sentences all
say `{beast}`, they all say *"hydra"*, not three different monsters.

```
The {beast} guards the hoard. Only a fool wakes a {beast}.
```

---

## When the odds depend on something (dynamic odds)

A weight can be a **live expression** over your variables, written `{= expr}`:

```
{escape | get caught {= guards}}
```

The more `guards` there are, the likelier "get caught." The expression is evaluated at pick time
against the document's variables.

---

## Items with fields: `{item.field}`

Sometimes a picked thing has *properties*. Define an item as a set of dotted sub-rules, then read a
field:

```
weapon: sword | axe
sword.damage: 1d8
sword.weight: 3
axe.damage:   1d12
axe.weight:   6
```

Now `{weapon.damage}` picks a weapon and reads *its* damage. But each `{weapon.…}` picks
**independently**. To talk about the *same* weapon across several fields, freeze the pick in a
variable first:

```
w = {weapon}
The {w} deals {w.damage} damage and weighs {w.weight} lb.
```

(`w = {weapon}` is a random-pick variable, see [variables](#store-a-value-and-reuse-it-variables),
so `{w}` stays one weapon.)

---

## Roll tables

A **roll table** is just a named one-rule grammar; the **`@` → Roll table** door gives you a
table-flavored dialog for it:

```
loot: sword | shield 2 | gold {2d6} | nothing 3
```

Reference it as `{loot}`, or let the pill itself be the table. Weights (`2`, `3`) tune rarity;
entries can roll dice or call other tables. It's the same engine as everything above; "roll
table" is just a familiar name for it.

---

## Markov chains

A **Markov chain** generates a random *walk* through transitions, good for organic-sounding
sequences. Build one in the **`@` → Markov** dialog with `→` transitions:

```
sunny → cloudy → rainy → sunny
```

The pill walks the chain and shows the path. Click to re-walk. A *named* chain is callable like a
rule (`{weather}`) from anywhere.

---

## Yes/no oracle

For solo play and quick decisions: the **`@` → Oracle (yes/no)** door builds a weighted Yes/No
pill at a likelihood you choose (Likely, 50/50, Unlikely, …). Click to ask again. Under the hood
it's a weighted alternation (`Yes 3 | No 1`); you can tune the odds, including with a `{= expr}`
dynamic weight.

---

## Putting it together: a quick NPC generator

Open **`@` → Grammar** and paste:

```
origin: {name.cap} is a {trait} {role} who {quirk}.
name:   bram | sera | tovin | elga | rurik
trait:  nervous | greedy | kindly | grizzled
role:   innkeeper | guard | merchant | hedge-wizard
quirk:  never makes eye contact | talks too much | owes someone money | hums constantly
```

Every click of the pill is a new NPC: *"Elga is a grizzled merchant who owes someone money."*
Because the names are document-wide, you can also drop `{role}` or `{trait}` into any other point.

---

**Next:** [Computing numbers](computing-numbers.md), the math side: expressions, dates, sums that
roll up your outline, and uncertain estimates. Or jump to the [Cookbook](cookbook.md) for
ready-made recipes.
