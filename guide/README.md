# Pointliner: the generative & computational guide

Pointliner isn't just an outliner. Inside any point you can drop a **pill**: a little live widget
that rolls dice, generates names, picks from a table, does math, tracks a budget, or models an
uncertain estimate, all offline, in the one file, with nothing to install.

This guide explains **how the hell all that works** and how to use it. No coding required: if you
can type `{` you can use everything here.

---

## The one big idea: `{curly braces}` become pills

Type something inside `{…}` and, **when you click away from the point**, it turns into a **pill**:

| You type | It becomes |
|---|---|
| `{2d6}` | a dice pill that rolled, say, **9** (click it to re-roll) |
| `{sword \| shield \| potion}` | a pill showing one of the three (click to re-pick) |
| `{= 2 * 19}` | a math pill showing **38** |
| `{5 to 10}` | an estimate pill: **7.2 (5 to 10) ▁▂▄▆█▆▄▂▁** |

That's the whole model. **Type in braces, get a live pill.** To edit a pill, click the **text
around** it and it unfolds back into the `{…}` you typed; fix it and click away again.

There are two families of pills:

- **Generate** makes *random text*: dice, tables, name generators, decks, oracles. See [Generating text](generating-text.md).
- **Compute** does *math*: arithmetic, dates, sums that roll up your outline, uncertain estimates. See [Computing numbers](computing-numbers.md).

---

## How pills behave (learn this once)

- **Click the pill** and it does its thing again: re-rolls the dice, re-picks the table, advances
  the deck, re-samples the estimate. Math and variables **recompute on their own** when something
  they depend on changes.
- **A roll stays put.** A dice/table/deck pill *freezes* its result so your document is stable; it
  only changes when **you** click it. (Math, variables, and rollups are the live ones.)
- **Edit the text, not the pill.** Click the words next to a pill to enter the point; the pill
  unfolds to its `{…}` source so you can retype it. Click away to re-pill.
- **Keyboard:** a focused pill responds to **Enter / Space** (same as a click).

---

## Three ways to add one

1. **Just type it.** `{2d6}`, `{a | b}`, `{= 5 * 8}` is the fastest path once you know the syntax.
2. **The `@` menu** (type `@` in a point). A menu of inserters with **dialogs that teach the
   syntax** and show a live preview: Dice, Grammar, Roll table, Deck, Oracle, Markov, Math,
   Variable, Estimate, and more. Great when you're learning or building something fiddly.
3. **The `/` menu** for point-level things, e.g. **`/check`** (add a pass/fail constraint) and
   **`/due`** (schedule dates).

> **The `?` button (bottom-right) opens the shortcuts & syntax cheat sheet**: keys and the
> common pill forms on one screen. For the full feature reference with examples, open the
> **Concept guide** (the "Concept guide ›" button at the bottom of that panel, also in the
> File menu). This guide is the *learn-it*; the `?` panel and Concept guide are the *look-it-up*.

---

## Where to go next

- **[What Pointliner can do](features.md):** a scannable map of every feature in one line each, with
  links into the deep guides. Start here if you just want to know "can it do X?"
- **[Generating text](generating-text.md):** alternation, weights, named rules, dice, modifiers
  (`{beast.a}` becomes "an ogre"), conditionals, decks, repeats, variables, item fields, roll
  tables, oracles, Markov chains. Build a name generator, a loot table, an NPC.
- **[Computing numbers](computing-numbers.md):** expressions, functions, units, dates, variables,
  **rolling sums up the tree** (`{= sum(cost)}`), **uncertain estimates** (`{5 to 10}`), **checks**
  (`sum(cost) <= budget`), progress cookies, table formulas.
- **[Cookbook](cookbook.md):** copy-paste recipes such as a name generator, a dungeon stocker, a
  yes/no oracle, a budget that rolls up and lints itself, a deadline countdown, a Fermi estimate,
  a card deck.
- **[Solo RPG guides](../solorpg-guides/README.md):** worked examples for playing and journaling a
  solo tabletop game in one file (dice, oracles, tables, the log all together), each with a
  walkthrough and an importable demo `.opml`. A Lonelog-style session log is the first.

> **One file, fully offline.** Everything here runs locally with no network. And because a document
> *is* the generator, you can **export a self-contained `.html`** (File menu) and hand someone a
> dungeon stocker or a name machine they just double-click; it re-rolls on *their* computer, no
> install, no account.
