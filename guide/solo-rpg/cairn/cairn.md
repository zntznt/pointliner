# Playing Cairn in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [cairn-demo.opml](cairn-demo.opml) (open it in Pointliner via File, Open)

Cairn is a rules-light OSR adventure game by Yochai Gal, built for the classic loop of careful
dungeon exploration, risky saves and hard-won treasure. Its rules are released free under an open
Creative Commons licence, which is what lets this guide adapt the system into Pointliner's points and pills
and live pills: your saves, damage, inventory and the game's many little tables all roll and compute
in the same file you keep your journal in.

Cairn has no built-in oracle (it expects a referee), so on your own you pair it with an oracle: the
[Oracle play](../oracle-play/oracle-play.md) case gives you a yes/no oracle and a meaning table in
original wording, and this guide focuses on Cairn's own character, exploration and combat mechanics.

If you are new to Cairn, read the free rules first; this assumes you know the game and want it
running in Pointliner.

> **Attribution and licence (CC BY-SA 4.0).**
> This guide and its demo adapt material from **Cairn** by **Yochai Gal**, used under the
> **Creative Commons Attribution-ShareAlike 4.0 International licence** (CC BY-SA 4.0):
> <https://creativecommons.org/licenses/by-sa/4.0/>. **Changes have been made** (the tables and
> procedures are restructured into Pointliner points and `{…}` pills). Because Cairn is
> ShareAlike, **the adapted Cairn material in this guide and demo is likewise licensed CC BY-SA
> 4.0** (this is separate from Pointliner's own AGPLv3 licence, which covers the app, not this game
> content). "Cairn" is used descriptively to name the game; no logo or artwork is reproduced.

---

## A character in three rolls

A Cairn character is fast to make: roll three attributes, hit points and starting gear, then pick a
background. The attributes are **Strength, Dexterity and Willpower**, each rolled on `3d6`:

```
STR: {3d6}    DEX: {3d6}    WIL: {3d6}
Hit Protection: {1d6}
```

Put each attribute in a **variable** so the rest of the sheet reads it:

```
{str := 10}
{dex := 12}
{wil := 9}
```

Now any roll can reference them. Cairn resolves risk with a **save**: roll `1d20` and succeed if you
roll **equal to or under** the relevant attribute. So a Strength save is "roll `{1d20}`, success if it
is at or under `str`." You read the die against the variable; there is no target number to look up.

## Saves (the core of play)

Everything risky is a save: dodging a trap, resisting fear, forcing a door. One line does it:

```
Strength save: {1d20} (success if at or under str, which is {str})
```

Click the die, compare it to the value shown and narrate the result. Change a stat in one place and
every save that reads it updates. For a quick reference you can keep all three saves as sibling
points, one per attribute, and roll whichever the situation calls for.

## Inventory and encumbrance

Cairn's inventory is a **slot system**: you carry a fixed number of slots, and being over your limit
slows you and imposes penalties. Pointliner's child-property rollup plus a check models it exactly:
each item carries a `slots` property, the pack totals them, and a check flags an overload.

```
Pack, {= sum(slots)} of 10 slots used   (with a check: sum(slots) <= 10)
  Sword {prop slots: 1}
  Torches, three {prop slots: 1}
  Rope, fifty feet {prop slots: 1}
  Rations {prop slots: 1}
```

The `{= sum(slots)}` rollup totals the items. Note where it sits: **on the Pack point, not beside
the items**. A bare rollup reads the point's **direct children**, so the same pill written as a
sibling of the items finds nothing and reads zero. (Add `, subtree` when you want it to reach every level below instead, the way the
[hex-crawl](../hex-crawl/hex-crawl.md) case totals the whole Vale across its regions.) Add a **check** of `sum(slots) <= 10` on the same
Pack point (from its bullet menu, "Add check", or `/check`) and its chip goes red the moment you are
overloaded.
This is the same machinery as the [character sheet](../character-sheet/character-sheet.md) case, tuned
to Cairn's slots.

## Damage, armour and the death spiral

Damage in Cairn hits **Hit Protection** first (luck and stamina); when that runs out, the rest
carries over into **Strength**. Any damage that reaches Strength forces a **Strength save** on the
spot, whatever your Strength happens to be: it is the crossing that triggers it, not a low number.
Track HP and STR as variables and subtract by editing them, with the damage roll as a pill:

```
Goblin hits you for {1d6} damage. Subtract armour, take the rest off HP, then off STR.
Blade: {1d8}    Club: {1d6}    Bow: {1d6}
```

The moment damage takes anything off Strength, make that save (`{1d20}` at or under `str`) to see
whether you hold on. Failing it is where a Cairn character dies, which is why the spiral is short
and why armour and a full Hit Protection matter so much. The whole thing is just dice pills read
against the two variables.

## The game's tables

Cairn leans on **tables**: reactions, oracles of the dungeon's mood, character backgrounds, bonds,
omens, weather and the referee tools in the SRD. Each table is a weighted pick in Pointliner, one
pill you click. The SRD's entries drop straight into the alternation:

```
{rule reaction: hostile | wary | neutral | curious | helpful}
{rule omen: a cold draft | distant scratching | a fresh corpse | scratched warnings}
```

The `rule` keyword is what names it. A bare `reaction: hostile | wary` stays ordinary text and
registers nothing, so the wrapper is not optional. Once a rule exists, call it by name anywhere
as `{reaction}` or `{omen}`, so one table serves the whole document. For a table rolled on `2d6`
with weighted results, use weights in the alternation to match the SRD's distribution.

> **This is where the SRD content lands.** The demo ships the pill structure with short filler
> options written for this guide, not Cairn's own table entries. Working from your copy of the SRD,
> replace the filler inside each `{rule ...}` with that table's entries; the pills around them are
> already wired, so a table goes live as soon as you edit its rule. Cairn tables you reproduce this
> way carry the ShareAlike terms (attributed above).

## Run it yourself

- **Make a character:** roll the three `{3d6}` attributes and `{1d6}` HP, set the variables, pick a
  background.
- **Take a risk:** roll `{1d20}` for a save and read it against the attribute variable.
- **Carry your gear:** add items with a `slots` property; watch the Pack check go red when overloaded.
- **Fight:** roll the weapon die, take damage off HP then STR and save when Strength runs low.
- **Ask the room:** click a table pill for a reaction or omen, then swap the filler for the SRD's own entries.

Everything is one offline file you own. Change the stats, restock the pack, add the tables you use
most, and it becomes your Cairn character.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
