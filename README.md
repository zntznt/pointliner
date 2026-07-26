# Pointliner

**Any bullet can generate or compute.** Type `{2d6}` in a point, click away, and it becomes a
live pill. Click the pill and it re-rolls. That single loop (type braces, get a live thing,
click it, it answers again) is the whole idea.

**[→ Try it now](https://zntznt.com/pointliner/)** · no account, no install, runs in your browser.

![Pointliner at rest, showing the toolbar and outline with live pills](https://github.com/user-attachments/assets/740a21cc-36d0-41e0-a721-dd0cceb5fd3f)

---

## What it is

Pointliner is a tool for thought wrapped in an outliner. It replaces the stack of single-purpose
tools a thinking session otherwise juggles: the calculator, the dice roller, the generator tab,
the spreadsheet, all living inside the same document as your notes. Generation and computation
are writing primitives here, not a separate app.

Pointliner is **not a second brain.** It does not want to be your archive, your PKM, or your
"capture everything" system. It is a generative scratchpad, a place where thinking happens, not
where it goes to retire. A pill is live on this look: `{2d6}` answers again on click, `{= sum(cost)}`
is never stale, and `{roll: #idea}` pulls a past thought back into present attention as material
for what you are doing right now.

The whole app is one `index.html`. It runs with the wifi off, needs nothing installed, and keeps
your work in files you own. Save it anywhere, sync it however you like, and export everything to
Markdown, plain text, OPML, or a self-contained runnable HTML you can hand to anyone.

---

## The idea in 30 seconds

| You type | You get |
|---|---|
| `{2d6}` | a dice roll (click to re-roll) |
| `{sword \| shield \| potion}` | a random pick from the list |
| `{= 2 * 19}` | a math result: **38** |
| `{= sum(cost)}` | the total of a `cost` property across child points |
| `{5 to 10}` | an estimate: **7.2 (5 to 10)** with a distribution sparkline |
| `{shuffle: a \| b \| c}` | a deck you draw from without replacement |
| `{roll: #npc}` | a random point from your own document (tag some points, roll on them) |

That last one is the pill no other tool has: the table it rolls on is your own living document,
so your campaign, your backlog, or your idea list surprises you with its own contents.

To edit a pill, click the text next to it. The pill unfolds back to the `{…}` you typed; fix it
and click away.

![Pills side by side: dice, math, grammar, estimate, all rendered live](https://github.com/user-attachments/assets/d3afd2b5-16db-41e8-ae14-6f5b9fb804f7)

---

## What Pointliner replaces

**The calculator you keep re-punching.** Give a few points a `cost` property, drop `{= sum(cost)}`
on the parent, and the total follows every edit. Declare `{budget := 500}` once and change it
anywhere; every dependent number recomputes. Add a check (`sum(cost) <= budget`) and the document
flags the overflow the moment it happens.

**The list you stare at when stuck.** Tag a few points `#idea` and type `{roll: #idea}`. The
document resurfaces a past thought into your present attention, a surprise from your own material,
not a browse of a maintained graph.

**The solo-RPG table you have to leave your notes for.** Dice, oracles, name generators, decks,
journals, and your own cast of characters as the random tables, all in one document that rolls
and tracks state for you. Pointliner was born here, and the [worked examples](guide/solo-rpg/README.md)
(thirteen cases with importable demos) are the fastest way to see the whole engine at work.

And underneath it all, a full outliner: nested points, markdown, to-dos with states and priorities,
per-point notes, properties, `[[links]]` with backlinks and live mirrors, a multi-document folder
with whole-folder search, a daily journal, an agenda with timeline and calendar views, interactive
tables and bases, and more. The [complete feature list](guide/features.md) covers everything.
What makes it different is not the list: it is that every bullet can generate or compute.

![Interactive base with rows, columns, and a sum(cost) formula](https://github.com/user-attachments/assets/f9c631a1-b78a-4251-96fb-7bc0c773ae8d)

---

## What it will never be

Strong tools exclude on purpose. These are commitments, not gaps on a roadmap:

- **No accounts, no cloud backend, no team collaboration.**
- **No build step, no runtime dependencies.** The app stays one file.
- **No plugin code execution.** Extensibility is data (grammar rules, variables), never programs.
- **No second syntax.** Everything generative or computed speaks the one `{…}` language.

If you need real-time team editing, a cloud workspace, or WYSIWYG rich text, Pointliner is
deliberately not your tool, and it will not grow into one.

---

## Get started

1. **Open it:** [zntznt.com/pointliner](https://zntznt.com/pointliner/), no install, no account.
   Or download [`index.html`](index.html) and open it from disk. Same app either way.
2. **Type:** Press `Enter` for a new point, `Tab`/`Shift+Tab` to indent or outdent. Type `{2d6}`
   and click away to see your first pill.
3. **Learn:** The **`?` button** (bottom right) is the always-there cheat sheet. The
   Concept guide (in the File menu / `?` panel) explains every feature with examples.

The [pill guide](guide/README.md) covers the two engine families behind everything:
[generating text](guide/generating-text.md) and [computing numbers](guide/computing-numbers.md),
with a [cookbook](guide/cookbook.md) of copy-paste recipes.

---

## How it works (for the curious)

The document is an in-memory tree of plain-text nodes. A pill is a markdown-style token in that
text plus a record in a sidecar array; plain text is always the source of truth. The view is
virtualized (only a screenful of rows is ever in the DOM), so it stays comfortable past 10,000
points. No framework, no build step; rendering is hand-written per-line markdown plus pure
cores (parsers and evaluators) that are unit-tested in plain Node.

Measured performance and a re-run harness live in [`guidance/performance.md`](guidance/performance.md).

---

## Contributing

[`CLAUDE.md`](CLAUDE.md) is the entry point for contributors. Run `node --test tests/test.mjs`
before and after touching any parser or evaluator. The [`guidance/`](guidance/) directory carries
the design language, UX standard, and architecture notes that every change follows.

---

[AGPLv3](LICENSE)
