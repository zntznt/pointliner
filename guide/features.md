# What Pointliner can do

*Part of the [Pointliner guide](README.md). A scannable map of every feature: what it is, in one
line, with a link to where you learn it. If you want to know "can it do X?", this is the page to
skim. For the deep how-to, follow the links.*

Pointliner is an **outliner** (nested bullet points, like a foldable to-do list or a notebook) with
two extra powers built in: it can **generate** text (dice, random tables, name makers) and
**compute** with your outline (math, dates, sums that roll up the tree). All of it runs in one file,
offline, with nothing to install.

Nothing below needs code. If you can type `{`, you can use it.

---

## Writing and structuring

The everyday outliner. This is the part you use without thinking about it.

- **Nested points.** Type, press `Enter` for a new point, `Tab` / `Shift+Tab` to indent or outdent.
  ([point types](writing-and-formatting.md#point-types))
- **Markdown formatting.** `**bold**`, `*italic*`, `# headings`, `> quotes`, code, all per line.
  ([styling text](writing-and-formatting.md#styling-text))
- **Emoji.** Type `:` and a name (`:fire`, `:tada`) to pick from a menu, or type the full
  `:shortcode:`. ([emoji](writing-and-formatting.md#emoji))
- **To-dos.** Type `- [ ]` for a checkbox, or `#TODO` / `#NEXT` / `#WAITING` / `#DONE` for status,
  with `[#A]` priorities. ([to-dos](tasks-and-organizing.md#to-dos-and-tasks))
- **Collapse and zoom.** Fold any branch; click a bullet to zoom in and work on just that subtree.
  ([zoom](getting-around.md#zoom-into-a-point))
- **Reorder by dragging** (mouse or touch), or move points with the keyboard.
  ([moving and nesting](getting-around.md#moving-and-nesting-points))
- **Per-point notes.** Attach a longer note under any point; hide them all with one toggle.
  ([per-point notes](writing-and-formatting.md#per-point-notes))
- **Properties.** Give a point `key: value` data (like `cost: 12` or `owner: me`) you can total
  and search. ([properties](tasks-and-organizing.md#properties))
- **Click anywhere to edit.** Click any empty part of a point and you are typing there.

## Generating text

Random generators for names, loot, prompts, oracles, anything. Type it in `{curly braces}` and it
becomes a clickable pill. Full guide: **[Generating text](generating-text.md)**.

- **Pick from a list.** `{sword | shield | potion}` shows one at random, click to re-pick.
  ([weights too](generating-text.md#pick-one-of-several-alternation): make some choices rarer.)
- **Roll dice.** `{2d6}`, `{1d20+5}`, plus exploding, keep-highest, Fate, and success pools.
  ([dice](generating-text.md#roll-dice-ndm))
- **Named rules.** Build a name generator or loot table once, reuse it anywhere.
  ([rules](generating-text.md#name-things-youll-reuse-rules))
- **Shape words.** `{beast.a}` becomes "an ogre"; pluralize, capitalize, past tense.
  ([modifiers](generating-text.md#shape-the-words-modifiers))
- **Conditionals.** Say different things in different cases: `{hp>0: still standing | defeated}`.
  ([conditionals](generating-text.md#say-different-things-in-different-cases-conditionals))
- **Decks.** Draw without repeating, like a real deck of cards.
  ([decks](generating-text.md#draw-without-repeating-decks))
- **Markov chains and a yes/no oracle** for organic sequences and solo-play decisions.
  ([Markov](generating-text.md#markov-chains) · [oracle](generating-text.md#yesno-oracle))

## Computing with numbers

A live calculator that can see your outline. Math pills recompute on their own. Full guide:
**[Computing numbers](computing-numbers.md)**.

- **Expressions.** `{= 2 * 19}` shows **38**; the usual arithmetic, powers, roots, functions.
  ([expressions](computing-numbers.md#expressions))
- **Units and dates.** Convert units (`{= c2f(20)}`), do date math (`{= daysuntil(due)}`).
  ([units](computing-numbers.md#units) · [dates](computing-numbers.md#dates))
- **Roll numbers up the tree.** `{= sum(cost)}` totals a property across child points, live, like a
  spreadsheet column. ([aggregation](computing-numbers.md#roll-a-number-up-your-outline-aggregation))
- **Word counts.** `{= words(subtree)}` counts everything under a heading.
- **Uncertain estimates.** `{5 to 10}` models a range with a little distribution sparkline, and the
  uncertainty propagates through math. ([estimates](computing-numbers.md#uncertain-values-estimates))
- **Self-checking outlines.** Attach a rule like `sum(cost) <= budget`; the point flags itself when
  it breaks. ([constraints](computing-numbers.md#make-the-outline-check-itself-constraints))
- **Progress cookies.** Drop `[/]` or `[%]` for a live tally of checkboxes and child to-dos.
  ([progress](computing-numbers.md#progress-bars))
- **Variables.** Declare a value once, reference it everywhere; change it and dependents update.
  ([variables](computing-numbers.md#variables-in-math))

## Dates, planning, and journaling

Turn the outline into a lightweight planner.

- **Start and due dates.** Schedule any point with a start, a deadline, or both; color-coded chips
  show what is due, soon, or overdue. ([scheduling](dates-and-planning.md#scheduling-dates))
- **Agenda.** A built-in calendar, timeline (Gantt), and due-list view of your dated points.
  ([agenda](dates-and-planning.md#agenda-and-calendar))
- **Daily journal.** Open or create today's entry from one button, in the doc or as a file per day.
  ([journal](dates-and-planning.md#daily-journal))
- **Search and filter.** Filter with `#tag`, the `is:todo` / `is:done` / `is:note` / `is:failing` /
  `is:passing` / `is:scheduled` / `is:unscheduled` / `is:overdue` flags, structure and artifact flags
  (`is:leaf` / `is:parent` / `is:collapsed` / `is:expanded` / `is:pill` / `is:random`, plus
  `has:children` / `has:footnote` and `has:dice` / `has:math` / `has:est` / `has:grammar` / `has:markov`
  / `has:var` / `has:seq`), date and property operators (`due:overdue`, `due:week` / `due:month`,
  `priority:a`, `var:name`, `has:key`, `key:value`, numeric compares `key:>N` / `key:<=N`), exact
  `"phrases"`, `-` to exclude, and `a | b` for either-side (OR) matching. Star a search to save it.
  ([full guide](getting-around.md#searching-and-filtering) · [hashtags](getting-around.md#hashtags))

## Linking and connecting notes

Build a connected notebook (Zettelkasten style), not just a single document.

- **Internal links.** `[[#point]]` links to any other point, with live titles and backlinks.
  ([linking points](links-and-references.md#linking-points) · [backlinks](links-and-references.md#backlinks))
- **Multi-document folders.** Connect a folder of documents on disk; switch between them, link
  across them, and search the whole folder at once.
  ([links across notes](links-and-references.md#links-across-notes) · [folder of documents](files-and-export.md#working-with-a-folder-of-documents))
- **Capture inbox.** A quick-capture box that drops a note into your inbox from anywhere, without
  navigating away. ([capture](tasks-and-organizing.md#capture-and-quick-inbox))
- **Templates and refile.** Save a subtree as a reusable template; move any point's subtree
  elsewhere with a searchable picker.
  ([templates](tasks-and-organizing.md#templates) · [refile](getting-around.md#refile-a-point))

## Files, sharing, and offline

- **One file, fully offline.** The whole app is a single `index.html`. No account, no network, no
  install. Your filesystem is the storage; your choice of sync (Dropbox, iCloud, git, or none) is
  the sync. ([saving](files-and-export.md#saving-your-work))
- **Open formats.** The native save format is a plain outline file; export to Markdown or plain text for sharing.
  ([exporting](files-and-export.md#exporting-and-sharing))
- **Web page (HTML).** Export a single `.html` that *is* the app plus your document. Hand it to
  someone and it re-rolls and recomputes on their machine, no install, no account.
  ([exporting](files-and-export.md#exporting-and-sharing))
- **Installable.** Served over https it is a PWA, so "Install" gives you a standalone offline app.

---

## Where to go next

- **[The guide hub](README.md)** explains the one big idea (`{braces}` become pills) and how pills
  behave.
- **[Generating text](generating-text.md)** and **[Computing numbers](computing-numbers.md)** are
  the two deep guides.
- **[Cookbook](cookbook.md)** has copy-paste recipes: a name generator, a dungeon stocker, a
  self-linting budget, a Fermi estimate, and more.
- **[Solo RPG guides](solo-rpg/README.md)** show the generators, oracle, and journal
  working together at the table, with importable demo files.

> Inside the app, the **`?` button** (bottom-right) is the always-there cheat sheet, and the
> **Concept guide** button explains every feature with examples. This page is the *overview*; those
> are the *look-it-up*.
