# The Pointliner guide

Pointliner is an **outliner**: a document of nested bullet points (each one is called a
**point**), with Markdown, to-dos, dates and search. That part is self-explanatory, you just
type. What makes Pointliner different is the **pill**.

## The one big idea: `{curly braces}` become pills

Type something inside `{…}` in a point and, **when you click away**, it turns into a **pill**: a
little live element you can click.

| You type | It becomes |
|---|---|
| `{2d6}` | a dice pill that rolled, say, **9** (click it to re-roll) |
| `{sword \| shield \| potion}` | a pill showing one of the three (click to re-pick) |
| `{= 2 * 19}` | a math pill showing **38** |
| `{5 to 10}` | an estimate pill: **7.2 (5 to 10) ▁▂▄▆█▆▄▂▁** |

That's the whole model. **Type in braces, get a live pill.** No coding required: if you can type
`{` you can use everything in this guide. There are two families of pills, **Generate** (random
text: dice, tables, name generators, decks, oracles) and **Compute** (math: arithmetic, dates,
sums that roll up your document, uncertain estimates), and we will get to how the hell all of it
works.

## Your first pill (30 seconds)

The very first time you open Pointliner, a welcome card offers ready-made examples. Pick **Start
with a blank document** (or press `Escape`) to get an empty page.

1. Click into the empty point. Type `Treasure: {2d6} gold`.
2. Press `Enter` (or click a different point) to **click away**. The `{2d6}` becomes a dice pill
   showing a rolled number, e.g. **Treasure: 7 gold**.
3. **Click the pill.** It re-rolls. Click again, a new number each time.
4. To change it, click the **words** next to the pill (not the pill itself). It unfolds back to
   `{2d6}` so you can retype it; click away to turn it back into a pill.

That is the entire interaction model. Everything else is just more kinds of `{…}`.

---

## The guides

- **[What Pointliner can do](features.md)** is the scannable feature map: every capability in one
  line, with links to where you learn it. Skim this if you just want to know "can it do X?"
- **[Writing and formatting](writing-and-formatting.md)** is headings and point types, inline
  styling, tables, footnotes, images, emoji and per-point notes. (The full
  [emoji shortcode reference](emoji-shortcodes.md) lists every `:name:`.)
- **[Getting around](getting-around.md)** is the everyday outliner: navigating, searching, nesting,
  zoom, hashtags, plus the live search pills (`{query:}`, `{count:}`) and the query bases that
  build on search.
- **[Tasks and organizing](tasks-and-organizing.md)** is to-dos, custom workflows, properties,
  progress bars, templates, quick capture and aliases.
- **[Dates and planning](dates-and-planning.md)** is scheduling points, the agenda and calendar,
  and the daily journal.
- **[Links and references](links-and-references.md)** is `[[` links with live titles, backlinks,
  unlinked mentions and links across a folder of documents.
- **[Files and export](files-and-export.md)** is saving, a folder of documents, appearance, and sharing
  or exporting (Markdown, plain text, Shareable page, self-contained HTML). Your work is always plain
  text you own, and its **Taking your work elsewhere** section is the no-lock-in exit story: OPML for a
  full-fidelity archive you can reopen, Markdown, text or a Shareable page for readable snapshots,
  HTML to hand someone a live copy.
- **[Generating text](generating-text.md)** and **[Computing numbers](computing-numbers.md)** are
  the two deep guides for the pill families above.
- **[Composing pills](composing-pills.md)** shows how to put pills together (side by side,
  through variables, and through the tree) so one pill feeds another.
- **[Cookbook](cookbook.md)** is copy-paste recipes that combine the two.
- **[Pill syntax reference](pill-syntax-reference.md)** is the look-it-up spec: every `{…}` form in
  one table, the order they are matched, the escape hatches, and the OPML lossless file format that
  keeps them all. Use it when you want the whole grammar at a glance rather than a tutorial.
- **[Solo RPG guides](solo-rpg/README.md)** are worked examples for the use Pointliner was born
  from: playing and journaling a tabletop game in one file, each with an importable demo.

The rest of this page is the friendly introduction to how pills behave.

---

## How pills behave (learn this once)

- **Click the pill** and it does its thing again: re-rolls the dice, re-picks the table, advances
  the deck, re-samples the estimate. Math and formula variables **recompute on their own** when
  something they depend on changes.
- **A roll stays put.** A dice/table/deck pill *freezes* its result so your document is stable; it
  only changes when **you** click it. (Math, rollups and formula variables are the live ones; a
  random-pick or estimate variable freezes the same way and only changes when you click its
  declaration.)
- **Edit the text, not the pill.** Click the words next to a pill to enter the point; the pill
  unfolds to its `{…}` source so you can retype it. Click away to re-pill.
- **Keyboard:** a focused pill responds to **Enter / Space** (same as a click).

---

## Four ways to add one

1. **Just type it.** `{2d6}`, `{a | b}`, `{= 5 * 8}` is the fastest path once you know the syntax.
2. **The `{` menu.** Type an opening `{` in a point and a menu lists the pill forms (dice, picks,
   calculations, live lists, meters and the rest); choose one and a ready-to-edit scaffold drops in
   with the first blank selected. The **Browse all pills** row opens the full picker.
3. **The `@` menu** (type `@` in a point). A menu of inserters with **dialogs that teach the
   syntax** and show a live preview: Dice, Grammar, Roll table, Deck, Oracle, Markov, Math,
   Variable, Estimate and more. Great when you're learning or building something fiddly.
4. **The `/` menu** for point-level things, e.g. **`/check`** (add a pass/fail constraint) and
   **`/due`** (schedule dates).

> **The `?` button (bottom-right) opens the Concept guide**, landing on its keyboard shortcuts;
> every feature is explained with examples in the topics beside them. The same window opens with
> `Ctrl/Cmd+Shift+/` and from the File menu as **Help & guide**. This guide is the *learn-it*; the
> Concept guide is the *look-it-up*.
> When the hints start to feel like noise, `Ctrl/Cmd+Shift+.` dials the app down through
> [Guided, Standard and Lean](getting-around.md#quiet-the-guidance-the-verbosity-dial).

---

## Go deeper into the two families

The two deep guides (linked above) each cover one pill family in full:

- **[Generating text](generating-text.md):** alternation, weights, named rules, dice, modifiers
  (`{beast.a}` becomes "an ogre"), conditionals, decks, repeats, variables, item fields, roll
  tables, oracles, Markov chains. Build a name generator, a loot table, an NPC.
- **[Computing numbers](computing-numbers.md):** expressions, functions, units, dates, variables,
  **rolling sums up the tree** (`{= sum(cost)}`), **uncertain estimates** (`{5 to 10}`), **checks**
  (`sum(cost) <= budget`), progress cookies, table formulas.

> **One file, fully offline.** Everything here runs locally with no network. And because a document
> *is* the generator, you can **export a self-contained `.html`** (File menu) and hand someone a
> dungeon stocker or a name machine they just double-click; it re-rolls on *their* computer, no
> install, no account.
