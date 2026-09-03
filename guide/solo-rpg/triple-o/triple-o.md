# Playing Triple-O in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [triple-o-demo.opml](triple-o-demo.opml) (open it in Pointliner via File, Open)

Triple-O is a player character emulator by Cezar Capacle. It inverts the usual solo setup: instead
of playing a character and asking an oracle what the world does, you sit in the GM's seat and the
dice tell you what your party does. You bring an adventure module, a party with a handful of Traits
each, and two d6. Everything else is the Triple-O Check.

That inversion is what makes it a good fit here. Triple-O runs on **Traits**, and Traits are exactly
the kind of thing an outline is already holding: short snippets, one per point, attached to a
character. Once they are points, Pointliner can roll on your own party rather than on a printed
table.

> **Attribution and licence (CC BY-SA 4.0).**
> This guide and its demo adapt material from **Triple-O: The Player Character Emulator** (version
> 1.0.2) by **Cezar Capacle**, used under the **Creative Commons Attribution-ShareAlike 4.0
> International licence** (CC BY-SA 4.0):
> <https://creativecommons.org/licenses/by-sa/4.0/>. **Changes have been made**: the procedures are
> restructured into Pointliner points and `{…}` pills, and the d66 tables are rewritten as flat
> thirty-six-option picks. Because Triple-O is ShareAlike, **the adapted Triple-O material in this
> guide and demo is likewise licensed CC BY-SA 4.0** (this is separate from Pointliner's own AGPLv3
> licence, which covers the app, not this game content). "Triple-O" is used descriptively to name
> the game; no logo or artwork is reproduced.
>
> Buy the zine: <https://capacle.itch.io/triple-o-zine>.

**This is the first case here that ships a complete system, not a skeleton.** The Cairn, Ironsworn
and Maze Rats guides wire up the pill structure and leave short filler where the game's own table
entries belong, because those tables are not ours to reproduce in full. Triple-O's text is
ShareAlike, so the demo carries all thirteen of its random tables, entry for entry. You can open it
and play.

---

## The Check is a weighted pick

The whole engine is one roll. You write down three things a character might do -- the **Obvious**,
the **Option** and the **Odd** -- then roll 1d6 and read it against a key: 4-6 is the Obvious, 2-3
the Option, 1 the Odd.

Pointliner has a shape that says this directly. Put a number after an option in an alternation and
that is how many chances it gets, so the three bands are just their face counts:

```
{rule tripleo: the Obvious 3 | the Option 2 | the Odd 1}
```

Now `{tripleo}` answers in the words of the game instead of handing you a number to look up. It is
the same 50 / 33 / 17 split, with the reading step removed.

Two things about that declaration are worth pausing on:

- **The `rule` keyword is not optional.** A bare `tripleo: the Obvious 3 | the Option 2` typed into
  a point stays ordinary text and registers nothing, so every `{tripleo}` after it would sit on the
  page as literal characters.
- **The name has no hyphen.** A rule name is a plain identifier, so a rule called `triple-o` cannot
  be declared at all. Naming the game and naming the rule are separate jobs; the demo calls it
  `tripleo` and says so in the file.

Declare it once, near the top. A rule pill runs when it is created, and a document loads top down,
so a call site written *above* its declaration opens showing the unresolved marker until you click
it. One click fixes it, which is exactly why it is easy to ship broken.

## Double-Down keeps its dice

When a character is leaning a particular way, Triple-O lets you **Double-Down**: roll 2d6, keep
whichever result feels right (not the higher or the lower, the one you want), and if the two dice
come up **doubles**, that behaviour sticks and becomes more prominent for that character.

The obvious move would be two `{tripleo}` pills side by side. Do not make it. A band pill has
already thrown the die away, so "both pills agree" is not the same event as doubles:

| Event | Chance |
|---|---|
| Two dice show the same face (doubles) | 6 in 36 |
| Two band pills happen to name the same band | 14 in 36 |

More than twice as often, for a rule that is supposed to be a rare punctuation mark. So Double-Down
stays raw dice, `{1d6}` and `{1d6}`, with the key written next to them. This is the honest trade the
Check makes: a pill that reads the table for you is faster, and a pill that shows you the die is the
only one that can answer a question about the die.

## Traits are points, so you can roll on your own party

This is the part a printed table cannot do.

In Triple-O a character is three to five **Traits**, written as short snippets: "Charismatic
leader," "Grew up on a farm," "Deeply indebted to someone dangerous." Give each one its own point
and label it, and the party becomes a table:

```
Bran, the warrior #bran
  Charismatic leader #trait
  Grew up on a farm #trait
  Driven by legacy #trait
```

A roll pill takes an ordinary search and returns one random point that matches it:

```
Whose Trait decides this moment? {roll: #trait}
What surfaces in Bran? {roll: #trait #bran}
```

**One label per point, and the reason is what the answer reads like.** A label reaches everything
below it, so a Trait under `Bran, the warrior #bran` already belongs to Bran without `#bran` being
typed on it, and the second roll above filters on that inherited label while drawing only from the
four Traits themselves. Write both labels on the Trait instead and the roll still works, but a roll
strips only the label it matched and leaves the rest showing: the oracle answers "Grew up on a farm
#bran" and you have a stray hashtag in the middle of your scene.

Add a Trait during play and the next roll can land on it, with no setup at all. That matters more in
Triple-O than in most systems, because Triple-O's Double-Down explicitly grows the Trait list as you
play: doubles mean you write a new Trait or promote an old one. The pool is supposed to change.
Here it changes by itself.

To hold one Trait steady for a whole scene, freeze the draw in a variable:

```
Tonight the scene turns on {pivot := {roll: #trait}}. Later, {pivot} is still the same Trait.
```

Note the inner braces. `{pivot := roll}` without them reads the right-hand side as a formula and
resolves to nothing.

This is the same machinery as [the living oracle](../living-oracle/living-oracle.md) case, pointed
at your party instead of your world.

## The Trait Sheet is a base

The zine's sheet has a status box beside each Trait: a Trait is **Default**, or **Prevalent** once
it has proven itself, or **Temporary** when it is a condition the character picked up. That is a
status column, which means it is a board.

Declare the statuses as a state set, then the base groups into lanes:

```
{seq Trait: DEFAULT PREVALENT TEMPORARY | RETIRED}
```

| Character | Status | Trait | Category |
|---|---|---|---|
| Bran | DEFAULT | Charismatic leader | PR |
| Bran | PREVALENT | Grew up on a farm | BG |
| Bran | TEMPORARY | Injured forearm | CN |

Turn that into an interactive table with `/base`, set its view to Board and group by Status, and
Double-Down's payoff becomes a gesture: roll doubles, drag the card from DEFAULT to PREVALENT, and
the sheet has recorded that the character changed. Category is the zine's own shorthand for where a
Trait came from (CL class, PR personality, SK skill, BG background, MT motivation, CN condition).

A value only becomes a lane because it is a **declared state**. Capitals are a reading convention,
nothing more; an undeclared status lands its card in a "No state" lane. RETIRED is this guide's
addition rather than the zine's: a sequence needs at least one finished state right of the bar, and
it is a useful place to put a condition once it has healed or hardened into a Default.

Trait-driven consequences fall out of the same sheet. Triple-O's lightweight mode has no HP and no
stats: a wound is a TEMPORARY Trait called "Injured forearm," and it changes what the character
would plausibly do, which is the only currency the system has.

## The thirteen tables, and the d66 trap

Triple-O ships six **spark** tables (Action, Focus, Method, Disposition, Motivation, Dynamics) and
seven **specific** ones (Combat, Social, Exploration, Delving, Interpretation, Downtime, Planning).
All thirteen are d66: roll two dice, read the digits as a pair, thirty-six even outcomes.

**`{d66}` is not that table.** Pointliner reads it as a single sixty-six-sided die and rolls 1 to 66
evenly: sixty-six outcomes where the table has thirty-six, and most of them numbers no entry sits
on. The d66 notation exists on paper because two d6 are what you have in your hand; the distribution
it actually produces is simply "one of thirty-six, evenly." So write that:

```
{rule disposition: Aggressive | Aloof | Ambivalent | ... | Warm | Wary}
```

Thirty-six options, flat, one per entry, in the zine's own order. That *is* a d66 roll, and it never
needs the digit-pair step. The demo carries all thirteen tables in this form.

Two paper affordances drop out and are not worth rebuilding. Rolling "the opposite combination" (43
becomes 34) when a result does not fit is a way of getting a second answer without picking the dice
back up; here you click the pill again. And nothing needs to display the 11-66 index, because
nothing looks anything up.

## Naming your own combos

The zine's most-used move is rolling two spark tables together: Action + Focus for what a character
does and what they are watching, Action + Method for what and how, Action + Motivation for what and
why. Each of those is a rule that calls other rules, so it is one click instead of two:

```
{rule actionfocus: {action} + {focus}}
{rule actionmethod: {action} + {method}}
```

Order matters. A composite declared **above** the tables it calls expands against a rule set that
does not have them yet, and the pill freezes with the markers still in it. Put the thirteen tables
first, the combos after.

The same trick builds a whole NPC in one pill, which the demo ships:

```
{rule npcsketch: {disposition}, driven by {motivation}, works by {method}, and right now they {action}}
```

Click it when the party walks into a tavern the module never bothered to describe.

## Where Triple-O sits next to the other cases here

Triple-O emulates the **party**. It says nothing about the world, on purpose -- the adventure module
is supposed to do that. So it pairs rather than competes:

- Pair it with [Oracle play](../oracle-play/oracle-play.md) when you are running your own prep
  instead of a module and need yes/no answers about the world.
- Pair it with a full system ([Cairn](../cairn/cairn.md), [Ironsworn](../ironsworn/ironsworn.md),
  [Maze Rats](../maze-rats/maze-rats.md)) when you want real resolution mechanics. Triple-O decides
  what the character attempts; the system decides how it goes.
- Or skip both: Triple-O's Checks chapter reuses the same `{tripleo}` pill to resolve the action as
  well. Write three outcomes instead of three actions and roll it. One pill, two jobs, no new
  syntax to learn.
- Keep the record with [Lonelog](../lonelog/lonelog.md) or the
  [session prep](../session-prep/session-prep.md) case. The party, the tables and the log all live
  in the same file, so the sheet you rolled off and the scene you wrote never drift apart.

## Run it yourself

- **Set up:** put each character's Traits in as points, one snippet each, labelled `#trait`, under a
  character point labelled with their name.
- **Declare the Check:** `{rule tripleo: the Obvious 3 | the Option 2 | the Odd 1}`, once, near the top.
- **Play:** read the adventure until someone has to act. If you know what they would do, just play
  it. If you do not, write the Obvious, write as much of the Option and the Odd as comes easily, and
  click `{tripleo}`.
- **Stuck:** click a combo pill and read the pair through that character's Traits. The zine's own
  advice is to leave the Option and the Odd blank until after you roll, which works better here than
  on paper: roll first, write only the branch you got.
- **Lean:** Double-Down with two `{1d6}` pills, keep your favourite, and on doubles promote the
  Trait a lane on the sheet.
- **Ask the party:** `{roll: #trait}` when you want the file to tell you which part of a character
  is driving this moment.

Everything is one offline file you own. Swap in your own party, add the Traits you discover in play,
and it becomes your Triple-O table.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
