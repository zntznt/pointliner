# Playing Maze Rats in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [maze-rats-demo.opml](maze-rats-demo.opml) (open it in Pointliner via File, Open)

Maze Rats is a rules-light OSR dungeon game by Ben Milton, famous for being tiny, fast and
packed with **random-generation tables**: roll on a table for a spell, a monster, a room, a
name, and let the results spark the fiction. Its rules are released free under an open Creative
Commons licence, which lets this guide adapt the system into Pointliner: your stats, saves and
above all its many tables become live pills you click in the same file you play in.

Maze Rats is built to be generated on the fly, which makes it one of the best fits for Pointliner
of any game here: nearly the whole book is tables, and a table is exactly one clickable pill.

If you are new to Maze Rats, read the free rules first; this assumes you know the game and want it
rolling in Pointliner.

> **Attribution (Creative Commons BY 4.0).**
> This guide and its demo adapt material from **Maze Rats** by **Ben Milton**, used under the
> **Creative Commons Attribution 4.0 International licence** (CC BY 4.0):
> <https://creativecommons.org/licenses/by/4.0/>. **Changes have been made** (the tables and
> procedures are restructured into Pointliner points and `{…}` pills). "Maze Rats" is
> used descriptively to name the game; no logo or artwork is reproduced. This guide itself is
> offered under the same CC BY 4.0 terms.

---

## A character in one roll

A Maze Rats character is about as fast as it gets: your abilities come from a single spread of dice
and everything else is a quick roll or a table. The three ability categories are rolled and the best
stat is the highest; roll them and note the modifiers (Maze Rats derives a small plus-or-minus for
each). Roll the pool with one pill:

```
Roll your stats: {6d6}
Health: {1d6}   then set it: {hp := 4}
```

Put your final modifiers in variables so saves read them:

```
{str := 1}
{dex := 0}
{wil := 2}
```

## Saves

Maze Rats resolves risk with a **2d6 roll**: roll `2d6`, add the relevant ability modifier, and
**10 or higher succeeds**. The target does not move with the difficulty; that flat 10 is one of the
things the game is built around, so the interesting decisions stay in the fiction rather than in
picking a number. One line:

```
Strength save: {2d6} + {str} (10 or higher succeeds)
```

Click the dice, add the modifier shown and compare to the difficulty. Change a modifier in one place
and every save that reads it updates.

## The tables (the heart of Maze Rats)

Maze Rats runs on **d66 tables**: you roll two dice read as a two-digit number (a tens die and a ones
die) to pick from a list of 36, and it has these for everything, spells, monsters, traps,
weather, room contents, names, motives. In Pointliner each table is one **weighted pick**: a pill you
click for a result. The book's entries drop straight into the alternation, and because Pointliner
picks uniformly you do not even need the two-digit read; one click gives you a result.

```
{rule monster: goblin | skeleton | giant rat | cave lurker | bandit}
{rule room: empty | a trap | old bones | a locked chest | running water}
```

The `rule` keyword is what names it. A bare `monster: goblin | skeleton` stays ordinary text and
registers nothing, so the wrapper is not optional, and a rule name may hold letters, digits and
underscores but **not hyphens** (`spell_form` works, `spell-form` does not). Once a rule exists, call
it by name anywhere as `{monster}` or `{room}`, so one table serves the whole document.

Maze Rats' signature move is **combining two tables** for an emergent result, its spells are literally
built by rolling on two word-lists. That is two pills side by side, or a rule that calls two others:

```
{rule spell_form: bolt | cloud | ward | veil | swarm}
{rule spell_effect: of fire | of silence | of thorns | of the void | of mending}
{rule spell: a {spell_form} {spell_effect}}
```

Roll `{spell}` and you get "a cloud of silence", a fresh improvised spell every click, the exact Maze
Rats trick, now live. The "of" lives in the effect list rather than in `spell`, so an effect that
does not want one ("that screams") still reads correctly.

> **This is where the book's content lands.** The demo ships the pill structure with short filler
> options written for this guide, not Maze Rats' own table entries. Working from your copy, replace
> the filler inside each `{rule ...}` with that table's entries; the pills around them are already
> wired, so a table goes live as soon as you edit its rule.

## Combat, fast

Combat in Maze Rats is quick: roll to hit against a save, roll damage, done. Damage is a die by weapon,
and you track health by editing a variable down. Roll `{1d6}` once for your starting health, then
put the number in a variable of its own: the dice pill re-rolls every time you click it, so it
cannot be the thing you are tracking. The whole exchange is a couple of pills:

```
Attack: {2d6} + {str}    Damage: {1d6}
```

Take damage off health by editing the number; when health is gone, you are in trouble. No spreadsheet,
just the dice and one variable.

## Run it yourself

- **Make a character:** roll `{6d6}` for stats and `{1d6}` for health, set the modifier variables.
- **Take a risk:** roll `{2d6}` plus a modifier and look for 10 or higher.
- **Generate anything:** click a table pill for a monster or room, and click `{spell}` for an
  improvised one, then swap the filler for the book's own entries.
- **Fight:** roll to hit, roll damage, edit health down.

Everything is one offline file you own. Maze Rats is almost all tables, so once you paste them in, this
becomes a pocket generator for a whole dungeon, one click per surprise.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
