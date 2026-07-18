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
Health: {1d6}
```

Put your final modifiers in variables so saves read them:

```
{str := 1}
{dex := 0}
{wil := 2}
```

## Saves

Maze Rats resolves risk with a **2d6 roll**: roll `2d6`, add the relevant ability modifier and beat a
target (a standard difficulty, higher for harder tasks). One line:

```
Strength save: {2d6} + {str} (beat the target for the task)
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
Monster: {SRD MONSTER TABLE ENTRIES GO HERE, separated by | bars}
Spell:   {SRD SPELL TABLE ENTRIES GO HERE, separated by | bars}
Room:    {SRD ROOM TABLE ENTRIES GO HERE, separated by | bars}
```

Define each as a **named rule** on its own point (`monster: goblin | skeleton | ...`) and call it by
name anywhere, so one table serves the whole document. Maze Rats' signature move is **combining two
tables** for an emergent result, its spells are literally built by rolling on two word-lists. That is
two pills side by side, or a rule that calls two others:

```
spell: a {spell-form} of {spell-effect}
```

Roll `{spell}` and you get a fresh improvised spell every click, the exact Maze Rats trick, now live.

> **This is where the book's content lands.** The demo ships table entries taken from Maze Rats under
> CC BY 4.0 (attributed above). If you are building from a fresh copy, paste each table's entries into
> its rule, and the pills around them are already wired.

## Combat, fast

Combat in Maze Rats is quick: roll to hit against a save, roll damage, done. Damage is a die by weapon,
and you track health by editing a variable down. The whole exchange is a couple of pills:

```
Attack: {2d6} + {str}    Damage: {1d6}
```

Take damage off health by editing the number; when health is gone, you are in trouble. No spreadsheet,
just the dice and one variable.

## Run it yourself

- **Make a character:** roll `{6d6}` for stats and `{1d6}` for health, set the modifier variables.
- **Take a risk:** roll `{2d6}` plus a modifier and beat the target.
- **Generate anything:** click a table pill for a monster, spell or room (once the entries are
  pasted); click a two-table spell for an improvised one.
- **Fight:** roll to hit, roll damage, edit health down.

Everything is one offline file you own. Maze Rats is almost all tables, so once you paste them in, this
becomes a pocket generator for a whole dungeon, one click per surprise.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
