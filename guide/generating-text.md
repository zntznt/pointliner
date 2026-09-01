# Generating text

*Part of the [Pointliner guide](README.md). This is the **Generate** family: pills that make random
text (dice, tables, name generators, decks, oracles).*

Everything here is one syntax: **`{curly braces}`**. Type something inside `{…}`, click away
from the point, and it becomes a **pill**. Click the pill to roll it again. Click the words
next to it to edit the `{…}` back.

If you'd rather not memorize syntax, you have two doors. Type an opening **`{`** in a point and a
menu lists every pill form you can build (a dice roll, a random pick, a calculation, a live list,
a meter and the rest); type a word to filter, press Enter, and it drops in a ready-to-edit scaffold
with the first blank selected.

The same menu keeps completing as you write inside a pill (function names in a calculation, filters
like `is:todo` in a live search, your own rule names once you define them), and a small help mark on
a suggestion opens its guide entry.

Or type **`@`** for a **dialog for every generator** (Dice, Grammar, Roll table, Deck, Oracle,
Markov, Variable) with a live preview. This page is the *why* behind both.

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

### Glue pieces into one name (templates)

Two side-by-side generators are two separate pills; each one re-rolls on its own. To build one
name from parts, wrap the whole thing in **one more brace** and it becomes a single pill that
re-rolls as a unit:

```
{{Ael|Bor|Cael}{ric|wyn|dor}}             →  Borwyn, Caelric, Aeldor …
{{Grey|Salt|Storm}haven}                  →  Salthaven, Greyhaven …
{{adj} {beast}}                           →  one two-word phrase from your rules
```

Plain letters glue directly onto a brace group (`haven` above). Spaces are fine **between**
groups, as in `{{adj} {beast}}` above, but not **inside** one: write `{Ael|Bor|Cael}`, never
`{Ael | Bor | Cael}`.

Every piece has to be a real generator or a known rule, and every word must touch a brace; a space
around a bar leaves `|` sitting on its own, touching nothing, and the whole thing stays ordinary text
instead of becoming one pill. That is the same guard that keeps a sentence with loose words around a
brace from being captured as a generator by accident.

---

## Name things you'll reuse (rules)

A **rule** is a named generator you can call from anywhere by its name in braces.

**Type one directly** with the `rule` keyword:

```
{rule color: red | blue | green | gold}
```

That point becomes a rule pill, and from then on `{color}` picks a color in *any* point in the
document. The keyword is what names it: a bare `color: red | blue` stays ordinary text, because
Pointliner cannot tell a rule you meant from a sentence that happens to contain a colon.

A typed rule can be edited straight back into text (click into the point and the pill becomes
`{rule color: ...}` again), and its choices can include anything on this page:

```
{rule treasure: {2d6} gold | a {color} gem | nothing}
```

**For several rules at once**, use the **`@` → Grammar** dialog, one per line, `name: choices`,
without the keyword. It gives you a live preview as you type:

```
origin: a {color} {animal}
color:  red | blue | green | gold
animal: fox | owl | dragon | toad
```

- The **first** line is what the pill shows: here `origin`, e.g. *"a gold dragon"*. The name
  `origin` is only a convention; put the line you want shown first, or name a different one in the
  dialog's **Start rule** field.
- `{color}` and `{animal}` are **rule calls**: the engine substitutes a random pick from each.
- Rules can call rules, which call rules. The engine expands recursively until it bottoms out in
  plain text.

**Rule names are document-wide.** Once a grammar pill defines `color`, you can write `{color}` in
*any* point in the document and get a color. (If two pills define the same name, the document
wins over a [reusable pack](features.md#files-sharing-and-offline); otherwise last definition wins,
so keep names unique.)

**Order matters once, on the file you open.** A pill runs when it is made, and a file loads top
down, so a rule written *above* the rules it calls is built before they exist: it opens showing
`The {adjective?} {noun?}`, carries a small dot, and its tooltip says the name has a value now and a
click will re-generate it. One click and it is right for good.

If you would rather not think about it, declare the small rules first and the one that calls them
last, the way the [generators demo](solo-rpg/generators/generators-demo.opml) does.

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
| `{4d6dl1}` | roll 4, **drop lowest 1** (same idea, stated as what to discard) |
| `{4d6dh1}` | roll 4, **drop highest 1** |
| `{4d6r1}`  | roll 4, **reroll any die ≤ 1 once** |
| `{2d6!}`   | **exploding** (a max-value die rolls again and adds) |
| `{4dF}`    | **Fate/Fudge dice** (each −1, 0 or +1) |
| `{6d10>=7}`| **success pool** (count dice that meet the target) |

Click the pill to re-roll. (All of this is also in the **`@` → Dice** dialog.)

---

## Contested rolls: `{A vs B}`

The commonest tabletop resolution is a roll against a roll: an attack against a defense, a contest
against a contest. Put **`vs`** between the two sides and one pill rolls both at once, freezes them
together and reads the **margin**, the winner's lead.

```
{hit := 2d6+str vs 2d6+def}
```

The pill shows each side's total and the verdict, reading `9 vs 7 · won by 2`. Clicking re-rolls
both sides as one event, so the two are never a pair of pills you compare by eye.

Naming it (the `{name := …}` form above) is what lets the rest of the document read the margin. It
is an ordinary number in math:

```
{= hit}          the margin itself
{= hit > 0}      ✓ when the first side won
{= hit * 5}      damage scaled by how decisively it won
{= max(hit, 0)}  a loss clamped to zero
```

Degrees of success fall straight out of that number, so you rarely need a table for them.

**Either side can be a fixed target** instead of a roll: a number for a set difficulty, or one of
your own variables.

```
{check := 2d6+str vs 15}      against a flat difficulty
{check := 2d6+str vs ac}      against a variable
```

With one side fixed the pill reads from the roll's point of view, `beat by 3` or `short by 6` or
`met it`, because a static target does not "win". The margin follows the roll for the same reason, so
`{= check > 0}` is ✓ exactly when the roll beat its target, whichever side you wrote the target on.

**It works at every level**, because each side collapses to one total before the subtraction. A
success pool against a success pool gives the **net successes**:

```
{clash := 6d10>=7 vs 5d10>=7}
```

**You do not need a name.** A bare `{2d6+2 vs 2d6+1}` drops a one-off pill that just shows who won.
It feeds no math, which is the trade: nothing else can reference it.

> **Compare like with like.** A sum on one side and a success pool on the other subtracts pips from
> successes, which means nothing. The pill still computes, but wears a dashed edge and reads `mixed`
> instead of handing you a confident wrong number.

Type `{` and choose **contest** for a scaffold to fill in, or lift a whole worked line from
**Patterns** in the all-commands window (`Ctrl/Cmd+K`).

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
{verb.ing}     → "walking"  (present participle)
{owner.poss}   → "ogre's"   (possessive; "foxes" becomes "foxes'")
{n.ord}        → "3rd"      (ordinal)
```

The full set: **`a` · `s` · `cap` · `title` · `upper` · `lower` · `ed` · `ing` · `poss` · `ord`**.

Modifiers **chain**, left to right:

```
{beast.a.cap}  → "A dragon"
```

> Modifiers attach to a **rule or variable name**, not to a bare `{a|b}` or a dice roll. If you
> want a modified random pick, name a rule first (`{rule creature: ogre | dragon}`, or the same
> line without the keyword inside the **`@` → Grammar** dialog) then `{creature.a}`, which comes out
> "an ogre" or "a dragon".
>
> A whole braced group DOES take one: wrap the pick in one more brace and put the modifier outside
> it. `{{ogre|dragon}.a}` comes out "an ogre" or "a dragon", and it works on a roll too, so
> `{{2d6}.a}` reads "a 7" or "an 8". The bare forms above are what has no name to attach to.

*Known limits (mostly heuristics, not a dictionary): `a`/`an` looks at the first letter but
checks a list of common exceptions first ("an hour" and "a university" come out right; a rarer
one may not); `.s` and `.ed` know the **common irregulars**
(`child` → "children", `go` → "went", `die` → "dice") and fall back to the regular English rules for
everything else, so an uncommon irregular still comes out regular.*

*Title-case splits on spaces only; `.ing` doubles a final consonant-vowel-consonant regardless of
stress ("run" → "running" is right, "visit" → "visitting" is wrong); a grammar field named `poss` or
`ing` is shadowed by the modifier, like every modifier name.*

---

## Say different things in different cases (conditionals)

Emit one text when a comparison holds, another when it doesn't:

```
{hp>0: still standing | defeated}
```

- Left of the `:` is a comparison (`>`, `>=`, `<`, `<=`, `==`, `!=`), usually against a
  **variable** (here `hp`; see [variables](#store-a-value-and-reuse-it-variables) for how to make
  one).
- Right of the `:` is `then | else`. The `else` is optional: `{hp>0: still standing}` emits
  nothing when false.

The branches are full templates, so they can roll dice or call rules:

```
{gold>=100: you buy {a {weapon} | armor} | you can't afford anything}
```

### Branch on text, not just numbers

Quote one side of an `==` / `!=` and the comparison works on **text**, so a text pick can drive
the story:

```
{mood := angry | calm | afraid}
The guard {mood == "angry": attacks on sight | {mood == "afraid": flees | waves you through}}.
```

The unquoted side is a variable, declared here with `:=` (see
[variables](#store-a-value-and-reuse-it-variables)); matching ignores capitalization (`"Angry"` and
`angry` are the same).

Only `==` and `!=` compare text; `<` and `>` stay numeric. Keep compared values to simple words (a
quoted value containing `:` or `|` won't survive the template split). Re-roll the pick and the branch
re-judges, same as the crit check below.

### Test a captured roll (crits and checks)

A bare `{1d20}` re-rolls at every mention, so to test one roll several ways, **capture it in a
variable first**: `{r := 1d20}` rolls once and freezes (click the pill to re-roll). Conditionals
nest, so a full d20 check with critical results on the natural die and a DC on the total is:

```
{mod := 3}
Attack: {r := 1d20} {r == 1: Critical failure!|{r == 20: Critical!|{r + mod >= 12: Success ({= r + mod})|Fail ({= r + mod})}}}
```

Read it inside out: natural 1 and 20 win first, otherwise the total `r + mod` is checked against
DC 12 and shown either way. Use `r >= 12` instead of `r + mod >= 12` to check the natural die.

To make a new attack, click the `r` pill (new die), then the verdict pill (it re-judges whatever
`r` currently shows). Both freeze between clicks, like dice, so a resolved check stays on the page
exactly as it landed; clicking only the verdict pill re-judges the same roll.

If you re-roll `r` and leave the verdict alone, the verdict pill grows a small dot at its corner and
its tooltip reads "Inputs changed. Click to re-generate.", so a stale verdict never passes for a
current one.

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

**Deal several at once.** A number after `shuffle` sets the deal size:

```
{shuffle 3: ruby | opal | pearl | bone die | iron key}   → "pearl ruby iron key"
```

Each click deals 3, no duplicates while the deck lasts; when the deck runs out mid-deal it
reshuffles and keeps dealing, like a real deck. The count is 1 to 99 and works on `shuffle` only.

The stateful, no-repeat behavior only holds when the deck is **its own pill**. If you nest a
`{shuffle: ...}` (or any mode) inside a named rule, it becomes an ordinary random pick with no
memory, so items can repeat. Keep a deck as a standalone pill when the draw order matters.

---

## Do it N times (repeat)

Emit a template several times, **re-rolled independently each time**:

```
{3x: {beast}}        → "ogre dragon ogre"   (three independent picks)
{2x: {2d6} gold}     → "7 gold 11 gold"
```

The count is 1 to 99; results are joined by spaces. (For draw-*without*-repeat, use a deck:
`{shuffle 3: …}` deals three distinct items in one go.)

**The count can be a dice roll.** `{2d4x: template}` first rolls 2d4, then repeats that many
times, a new count on every re-roll:

```
{1d4x: a goblin (HP {1d6})}   → one to four goblins, each with its own HP
```

Any pure dice expression works (`{2d4+1x: …}`); a roll that lands on 0 (like `1d4-2`) emits
nothing, honestly. A *variable* count isn't a thing; the head must be plain dice.

---

## Store a value and reuse it (variables)

A **variable** is a named value you reference with `{name}`. Declare one in the **`@` → Variable**
dialog, or just type it inline as `{name := value}`. Two kinds:

- **Formula:** `{r := 5}` or `{area := pi*r^2}`. It's a number; reference it in math or dice.
  (See [Computing numbers](computing-numbers.md) for the full model, including text values and how a
  `{name}` resolves to the nearest declaration above it.)
- **Random pick:** `{beast := dragon | wyrm | hydra}`. It rolls **once** and **freezes** the result,
  so `{beast}` reads the *same* value everywhere until you re-roll the declaration.

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
field. The block below is what you paste into the **`@` → Grammar** dialog, one rule per line; typed
straight into a point, each line needs the keyword, `{rule sword.damage: 1d8}`, or it stays ordinary
text and registers nothing:

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
{w := {weapon}}
The {w} deals {w.damage} damage and weighs {w.weight} lb.
```

(`{w := {weapon}}` declares a random-pick variable, see
[variables](#store-a-value-and-reuse-it-variables), so `{w}` stays one weapon.)

A field read takes [modifiers](#shape-the-words-modifiers) too, chained after the field:

```
{w.weight.ord}     → "3rd"        (ordinal of the field)
{weapon.damage.upper}
```

One field, then any number of modifiers. (Two fields deep, like `{a.b.c}` where `b` and `c` are
both fields, isn't a thing; the braces just stay ordinary text instead of becoming a pill.)

The same dotted read also reaches **variable bases**: mark a base so each row declares variables,
and `{Orc.HP}` reads the HP cell of the Orc row, live (with a named base, `{Monsters.Orc.HP}`).
See [variable bases](computing-numbers.md#variable-bases-a-table-of-variables).

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
sequences. Type one inline as `{markov: from→to, …}` (use `→` or `->`):

```
{markov: sunny→cloudy, cloudy→rainy, cloudy→sunny, rainy→sunny}
```

A transition can carry a weight as a trailing number, so `sunny→sunny 2` makes sun twice as likely
to persist as to cloud over. The pill walks the chain and shows the path; click to re-walk.

For a chain you want to **name** and reuse, build it in the **`@` → Markov** dialog (it also lets you
set the start state and how many steps to walk). A named chain is callable like a rule (`{weather}`)
from anywhere.

---

## Roll on your own document

Every generator so far draws from a list you typed. `{roll: SEARCH}` draws from your **live
document** instead: it picks one random point matching a search, so you can roll on the notes you
already keep.

Keep a list of open threads, NPCs or ideas as ordinary points, then roll:

```
Open threads
  The letter is unsigned #thread
  Someone is following me #thread
  The well ran dry #thread
Advance one: {roll: #thread}
```

The search is a normal search string (words, `#tag`, `is:todo`, `key:value`). `{roll:}` searches
**the whole document**, exactly like `{query:}` and `{count:}`, so the list it draws from can sit
anywhere and the pill can go wherever it reads best. When the search genuinely matches nothing the
pill says so ("no match yet") rather than going quiet.

The result is rolled once and kept, like a dice pill: click it to roll again. If you want the same
value in several places, name it with `:=` (below).

To keep one result steady (and re-roll it on click, like a dice pill), name it with `:=`:

```
Tonight's contact: {who := {roll: #npc}}
{who} knows something about the letter.
```

Now `{who}` is the same NPC everywhere it appears; click it to draw a new one. This reuses the
variable system, so there is no new syntax to learn.

### Rolling across the whole folder

If your NPCs live in five different notes, one document is the wrong table. With a folder connected,
put `folder` before the colon and the roll draws from every note in it:

```
Who shows up? {roll folder: #npc}
```

The `@` → **Roll on your document** menu has the same thing as a checkbox ("Roll on the whole
folder"), and its live count tells you how big the pool is before you commit: *0 matching points* in
this document, *2 matching points across the folder*.

Two things worth knowing. The other notes count **as they were last saved** on disk, the same rule
every folder-wide feature follows. And with no folder connected the pill still works, but it draws
from this document alone and says so: it goes dashed and its tooltip reads "no folder is connected,
so this rolled on the current document only."

The switch is the word `folder` **before** the colon, never inside the search, so `{roll: folder}`
still means "roll on a point containing the word folder."

## Yes/no oracle

For solo play and quick decisions: the **`@` → Oracle (yes/no)** door builds a weighted Yes/No
pill at a likelihood you choose (Likely, 50/50, Unlikely, …). Click to ask again. Under the hood
it's a weighted alternation (`Yes 3 | No 1`); you can tune the odds, including with a `{= expr}`
dynamic weight.

You can also **type an oracle by its band name**, no dialog needed:

```
{oracle: likely}           → the same Yes 3 | No 1 pill the dialog builds
{oracle: even + swing}     → the six-way answer (Yes and / Yes / Yes but / No but / No / No and)
{oracle: 70}               → your own odds: the same pill as Yes 70 | No 30
```

The bands are `certain`, `likely`, `even`, `unlikely`, `impossible` (any capitalization), or a whole
number from 0 to 100 for a percentage of your own. The pill is a normal oracle: it edits back to the
words you typed, `{oracle: likely}`; change its odds and it becomes a plain `{Yes N | No M}` pick.

---

## Reproducible rolls (random seed)

Rolls are normally fresh randomness, so two people opening the same file and clicking the same pill
get different results. When you want them to match, give the document a **seed**: the **File** menu,
then **Random seed**, then a whole number.

From then on **dice, decks and `{roll:}` draws** follow that seed, so a copy shared at the same seed
replays the same session. Leave the field blank to turn it back off.

A seed changes future rolls, not the ones already frozen on the page, so re-roll a pill to draw the
next value in the seeded sequence. The seed is saved with the document.

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
roll up your document and uncertain estimates. Or jump to the [Cookbook](cookbook.md) for
ready-made recipes.

**Back to:** [the guide](README.md).
