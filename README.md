# Pointliner

**The single-file RPG toolkit where the dice, the oracle, and the journal live in
one place.** Roll `{2d6}` in the middle of a scene, ask a `{roll: #npc}` oracle that draws
from your own cast, keep the log right beside it, and let the same document quietly total
your inventory and flag your overloaded sheet while you play. It is all one `index.html`,
runs with the wifi off, needs nothing installed, and (the pleasant surprise) it is also a
sharp computational outliner for anything else you want to think in.

**[→ Try it now](https://zntznt.com/pointliner/)** · no account, no install, runs in your browser.

---

## The 30-second version

Underneath, Pointliner is an outliner: nested bullet points, markdown, collapse, zoom,
to-dos, dates, links, search. What makes it a play surface is **pills**. Type something
inside `{curly braces}` and, when you click away, it turns into a small live widget, so
your dice, tables, oracles, and sheet math all live in the same document as your notes:

| You type | You get |
|---|---|
| `{2d6}` | a dice roll (click to re-roll) |
| `{sword \| shield \| potion}` | a random pick from the list |
| `{= 2 * 19}` | a math result: **38** |
| `{= sum(cost)}` | the total of a `cost` property across child points |
| `{5 to 10}` | an estimate: **7.2 (5 to 10)** with a distribution sparkline |
| `{shuffle: a \| b \| c}` | a deck you draw from without replacement |
| `{roll: #npc}` | a random point from your own outline (tag some points, roll on them) |

That last one is the pill no other tool has: the table it rolls on is your own living
document, so your campaign, backlog, or idea list surprises you with its own contents.

That's the whole idea: **type in braces, get a live pill.** To edit one, click the text
next to it. The pill unfolds back to the `{…}` you typed; fix it and click away.

## Why it's different

- **It's one file.** The entire app (HTML, CSS, JS, fonts) is `index.html`. No build
  step, no dependencies, no bundler, no `node_modules`. Open the file, it runs.
- **It's genuinely offline.** No network, no backend, no account. Your filesystem is the
  storage; your choice of sync (Dropbox, iCloud, git, or none) is the sync.
- **A document *is* a generator.** Because the logic lives in the document, you can export
  a **self-contained `.html`** and hand someone a dungeon stocker, a name generator, or a
  budget tracker they just double-click. It re-rolls and recomputes on *their* machine,
  with no install and no account.
- **Installable.** Served over https it's a PWA, so "Install" gives you a standalone app
  that works offline; the downloaded `index.html` still works identically from disk.

## What's in the box

An outliner with the usual depth, plus:

- **Editing:** markdown per line, to-dos (`- [ ]` and `#TODO` states + priorities),
  per-point notes, properties, collapse-to-level, zoom, drag to reorder/nest (mouse *and*
  touch), keyboard-first throughout.
- **Generators:** dice (exploding, keep-highest, success pools), weighted random tables,
  a recursive grammar engine (name generators, loot tables), decks, a yes/no oracle,
  Markov chains.
- **Compute:** a math engine with units, dates, and functions; **subtree roll-ups**
  (`sum`/`avg`/`count`/`min`/`max` over child properties); variables; **uncertain
  estimates** sampled Monte-Carlo; **checks** (live pass/fail constraints like
  `sum(cost) <= budget`); progress cookies; org-style table formulas.
- **Structure & knowledge:** interactive tables and "bases", `[[#point]]` links with
  backlinks and live-title mirrors, a multi-document workspace (a folder of `.opml` notes
  on disk), whole-folder search with operators, daily journal, quick-capture inbox,
  agenda with timeline + calendar views.
- **Files:** OPML is the native format; export to Markdown, plain text, or a
  self-contained interactive HTML.

The complete, current feature list lives in [**What Pointliner can do**](guide/features.md) (the
canonical user-facing inventory; the list above is a teaser). For contributors, the exhaustive
engine-level reference is the separate [`guidance/features.md`](guidance/features.md).

## Quick start

You don't have to clone anything:

1. **Use it hosted:** [zntznt.com/pointliner](https://zntznt.com/pointliner/). Install it
   from your browser ("Install app" / "Add to Home Screen") for an offline standalone app.
2. **Or run it from a file:** download [`index.html`](index.html), open it in any modern
   browser. That's the whole app. Save it to Dropbox/iCloud/a git repo and it syncs like
   any file.

To start writing: just type. Press `Enter` for a new point, `Tab`/`Shift+Tab` to indent or
outdent, type `{2d6}` and click away to see your first pill. The **`?` button** (bottom
right) is the always-there cheat sheet for every syntax.

## Learn it

The outliner is self-explanatory; the pills have a friendly guide.

- **[Solo RPG guides](guide/solo-rpg/README.md)** are the place to start for the use
  Pointliner is built around: playing and journaling a solo tabletop game in one file.
  Thirteen worked cases, each with a walkthrough and an importable demo `.opml` you can open
  and take apart, from a Lonelog-style session log to a living oracle that rolls on your own
  cast, a campaign calendar, and full open-licence systems (Ironsworn, Cairn, Maze Rats).
- **[The pill guide](guide/README.md)** covers the one big idea, then the two engine
  families that back all of the above:
  - **[Generating text](guide/generating-text.md):** alternation, weights, named rules,
    modifiers (`{beast.a}` becomes "an ogre"), conditionals, decks, oracles, Markov chains.
  - **[Computing numbers](guide/computing-numbers.md):** expressions, units, dates,
    variables, subtree roll-ups, uncertain estimates, checks, table formulas.
  - **[Cookbook](guide/cookbook.md):** copy-paste recipes such as a name generator, a
    dungeon stocker, a yes/no oracle, a self-linting budget, a Fermi estimate, a card deck.
- **In-app:** the **`?` panel** is the look-it-up reference; the **Concept guide** button
  (in the file menu / `?` panel) explains every feature with examples.

## How it works (for the curious)

The document is an in-memory tree of plain-object nodes; `node.text` is plain text and the
source of truth. A pill is a markdown-style `[[type:key]]` token in that text plus a record
in a sidecar array. The view is **virtualized** (only a screenful of rows is ever in the
DOM), so it stays responsive on large documents. There's no framework and no build step:
rendering is hand-written per-line markdown plus a small set of pure cores
(parsers/evaluators) that are unit-tested in plain Node.

Measured performance: comfortable to ~10k points, with the practical ceiling being browser
`localStorage` (~17k points) rather than lag. Connect a workspace folder to write to disk
with no cap. Details and a re-run harness are in
[`guidance/performance.md`](guidance/performance.md).

## Contributing

The repo carries its own build-steering docs under [`guidance/`](guidance/): the design
language, UX standard, and architecture notes that any change (human or AI) is expected to
follow. [`CLAUDE.md`](CLAUDE.md) is the entry point. The headline constraints:

- **It stays one file.** No build step, no runtime dependencies. (The only sanctioned
  extras are the PWA install assets, which the downloaded `index.html` never depends on.)
- **`node.text` is plain text, always**, never HTML. Pills are tokens plus sidecar records.
- **Pure cores stay DOM-free and tested.** Run `node --test tests/test.mjs` before and
  after touching any parser/evaluator.
- **UX and visual design are governed**, not ad hoc. See
  [`guidance/ux-discipline.md`](guidance/ux-discipline.md) and
  [`guidance/design-language.md`](guidance/design-language.md).

## License

[MIT](LICENSE). Font Awesome icons are bundled under their own licenses (CC BY 4.0 for
icons, SIL OFL 1.1 for fonts, MIT for code); see the note in `index.html`.
