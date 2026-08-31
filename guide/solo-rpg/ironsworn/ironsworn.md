# Playing Ironsworn in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [ironsworn-demo.opml](ironsworn-demo.opml) (open it in Pointliner via File, Open)

Ironsworn is a solo-and-co-op tabletop RPG by Shawn Tomkin. Its rules are released free under
a Creative Commons licence, which is what makes this guide possible: it adapts the game's system
into Pointliner's points and live pills, so your action rolls, momentum, progress tracks and
oracles all live and compute in the same file you write your journal in.

This guide is a **Pointliner workflow**, not a replacement for the rulebook. It shows you how to
wire Ironsworn's moving parts into pills; the actual move text and oracle tables come from the
Ironsworn SRD (see the attribution below and the demo, where they are dropped into the pill
structure). If you are new to Ironsworn, read the free rulebook first; this assumes you know the
game and want it running in Pointliner.

> **Attribution (Creative Commons BY 4.0).**
> This guide and its demo adapt material from the **Ironsworn System Reference Document**, by
> **Shawn Tomkin**, used under the **Creative Commons Attribution 4.0 International licence**
> (CC BY 4.0): <https://creativecommons.org/licenses/by/4.0/>. The Ironsworn SRD is available from
> its publisher; this is an **adaptation** (the moves and oracle tables are restructured into
> Pointliner points and `{…}` pills), and **changes have been made** from the original
> layout and presentation. "Ironsworn" is used here descriptively to name the game; no logo or
> artwork is reproduced. This guide itself is offered under the same CC BY 4.0 terms.

---

## The action roll

Ironsworn's core move is the **action roll**: you roll one six-sided **action die**, add a **stat**
(and any adds) and compare that total against **two 10-sided challenge dice**, read separately.
The outcome is a **strong hit** (beat both challenge dice), a **weak hit** (beat one) or a **miss**
(beat neither). In Pointliner that is three pills side by side:

```
Action die + stat: {1d6+2}        (edit the +2 to your stat + adds)
Challenge dice: {1d10} and {1d10}
```

Click the action pill to roll, click each challenge pill to roll and read the three numbers by the
strong/weak/miss rule above. To keep it to one click, you can roll both challenge dice at once with a
repeat: `{2x: {1d10}}` shows two challenge results together.

A cleaner single-line version puts your stat in a **variable** so every roll reads the same number:

```
{edge := 2}
Face danger with Edge: {1d6} + {edge} vs {1d10} / {1d10}
```

Change `edge` in one place and every action roll that reads it updates.

## Momentum

Momentum is Ironsworn's swing resource: it rises and falls with your fortunes and can be **burned**
to turn a roll around. Track it as a variable you edit as it changes:

```
{momentum := 2}
```

Raise or lower it by editing the number (or keep a small log of changes as child points). When you
burn momentum, the rule is that you replace a challenge die result with your current momentum; in
Pointliner you just read the `momentum` value against the challenge dice you rolled and take the win
if it beats them.

## Progress tracks (vows, journeys, fights)

A **progress track** is Ironsworn's box-ticking meter for a vow, a journey or a fight: you mark
progress as you go, then make a **progress move** by rolling the challenge dice against the number of
filled boxes. Pointliner's **progress cookie** is the natural fit: a parent point with a `[/]` (or a
manual `[3/10]`) over 10 checkbox children, one per box.

```
Swear an iron vow: reach the drowned tower  [/]
  - [ ] progress
  - [ ] progress
  ... (ten boxes; check them off as you advance)
```

When it is time to fulfil the vow, count the filled boxes and roll `{1d10}` and `{1d10}` against that
number. (Ironsworn fills boxes in ticks of different sizes by rank; use one checkbox per box and mark
them at the rate your vow's rank calls for.)

## Oracles

Ironsworn leans on **oracle tables**: roll on a table, read the result, interpret it into the
fiction. A table is a weighted pick in Pointliner, so each oracle becomes one pill you click. The
SRD's oracle entries drop straight into the alternation:

```
{rule action_oracle: strike | avenge | uncover | defend}
{rule theme_oracle: risk | fortune | secret | shelter}
```

The `rule` keyword is what names it. A bare `action_oracle: strike | avenge` stays ordinary text and
registers nothing, so the wrapper is not optional, and a rule name may hold letters, digits and
underscores but **not hyphens** (`action_oracle` works, `action-oracle` does not). Once a rule
exists, call it by name anywhere, so one table serves the whole document. For a two-word prompt
(Ironsworn's classic Action + Theme spark), put two calls together: `{action_oracle} {theme_oracle}`.

A yes/no oracle with Ironsworn's likelihood odds is a weighted alternation too:
`{Yes N | No M}`, with the weights set to the odds for the likelihood you pick (the SRD lists the
percentages; convert them to weights, for example an even chance is `{Yes 1 | No 1}`).

## Putting the moves in

Each Ironsworn **move** (Face Danger, Secure an Advantage, Compel, Strike and so on) has its own
trigger and its strong/weak/miss outcomes. In the demo, each move is its own point: a marked slot
for the move's text, with an action-roll pill ready beneath it. Paste the move's trigger and
outcomes from your copy of the SRD into the slot, then play it by reading the trigger, rolling the
action pill and reading the outcome the SRD lists for your result.

> **This is where the SRD content lands.** The demo ships the pill structure, not the SRD's own
> text: each move is a marked slot, and the oracles carry short filler options written for this
> guide. Working from your copy of the SRD, paste each move's text into its slot and replace the
> filler inside each `{rule ...}` with that oracle's entries; the pills around them are already
> wired, so an oracle goes live as soon as you edit its rule. Text you reproduce this way is used
> under CC BY 4.0 (attributed above).

## Run it yourself

- **Make an action roll:** click `{1d6+2}` and the two `{1d10}` pills; read strong/weak/miss.
- **Track a vow:** check a box on a progress cookie as you advance; when it fills, roll against it.
- **Ask an oracle:** click an oracle pill for a result, or two for an Action + Theme spark.
- **Swing with momentum:** edit the `momentum` variable up and down; burn it by reading it against a
  challenge roll.

Everything is one offline file you own. Change the stats, rewrite the vows, add the moves and oracles
you use most, and it becomes your Ironsworn table.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
