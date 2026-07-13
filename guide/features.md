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
- **Tag colors and property icons.** File then Tag & property styling: give a `#tag` its own
  on-brand color (nested tags inherit it) and a property key a small icon. Purely visual, stored
  with the document.
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
- **Shape words.** `{beast.a}` becomes "an ogre"; pluralize, capitalize, past tense, possessive,
  present participle. ([modifiers](generating-text.md#shape-the-words-modifiers))
- **Conditionals.** Say different things in different cases: `{hp>0: still standing | defeated}`.
  ([conditionals](generating-text.md#say-different-things-in-different-cases-conditionals))
- **Crit checks on a captured roll.** `{r := 1d20}` freezes one die; nested conditionals then judge
  it: nat 1/20 crits, DC on the total, all in one line.
  ([test a captured roll](generating-text.md#test-a-captured-roll-crits-and-checks))
- **Decks.** Draw without repeating, like a real deck of cards; `{shuffle 3: …}` deals three
  at once. ([decks](generating-text.md#draw-without-repeating-decks))
- **Markov chains and a yes/no oracle** for organic sequences and solo-play decisions; type an
  oracle as `{oracle: likely}`.
  ([Markov](generating-text.md#markov-chains) · [oracle](generating-text.md#yesno-oracle))
- **Roll on your own outline.** `{roll: is:todo}` picks a random point from your live outline (the points below it, or a `#tag` anywhere), so a random open thread or NPC gets chosen from what you already wrote.
  ([roll on your outline](generating-text.md#roll-on-your-own-outline))

## Computing with numbers

A live calculator that can see your outline. Math pills recompute on their own. Full guide:
**[Computing numbers](computing-numbers.md)**.

- **Expressions.** `{= 2 * 19}` shows **38**; the usual arithmetic, powers, roots, functions.
  ([expressions](computing-numbers.md#expressions))
- **Logic.** Combine comparisons with `and(…)` / `or(…)` / `not(x)`; one check can assert several
  rules at once. ([functions](computing-numbers.md#functions))
- **Units and dates.** Convert units (`{= c2f(20)}`), do date math (`{= daysuntil(due)}`).
  ([units](computing-numbers.md#units) · [dates](computing-numbers.md#dates))
- **Roll numbers up the tree.** `{= sum(cost)}` totals a property across child points, live, like a
  spreadsheet column. ([aggregation](computing-numbers.md#roll-a-number-up-your-outline-aggregation))
- **Word counts.** `{= words(subtree)}` counts everything under a heading.
- **Uncertain estimates.** `{5 to 10}` models a range with a little distribution sparkline, and the
  uncertainty propagates through math. ([estimates](computing-numbers.md#uncertain-values-estimates))
- **Self-checking outlines.** Attach a rule like `sum(cost) <= budget`; the point flags itself when
  it breaks. Structure is testable too: `count("-has:hp") == 0` means every point below carries hp.
  ([constraints](computing-numbers.md#make-the-outline-check-itself-constraints))
- **Progress cookies.** Drop `[/]` or `[%]` for a live tally of checkboxes and child to-dos.
  ([progress](computing-numbers.md#progress-bars))
- **Variables.** Declare a value once, reference it everywhere; change it and dependents update.
  ([variables](computing-numbers.md#variables-in-math))

## Dates, planning, and journaling

Turn the outline into a lightweight planner.

- **Start and due dates.** Schedule any point with a start, a deadline, or both; color-coded chips
  show what is due, soon, or overdue. ([scheduling](dates-and-planning.md#scheduling-dates))
- **Recurring tasks.** Give a task a Repeat schedule (`every week`, `every Monday`, `monthly on the
  1st`); completing it rolls the date forward and re-opens it.
  ([recurring](dates-and-planning.md#recurring-tasks))
- **Agenda.** A built-in calendar, timeline (Gantt), and due-list view of your dated points.
  ([agenda](dates-and-planning.md#agenda-and-calendar))
- **Daily journal.** Open or create today's entry from one button, in the doc or as a file per day.
  ([journal](dates-and-planning.md#daily-journal))
- **Custom calendars.** Give a document a fictional calendar (your months, week, and era) and every
  date, agenda view, and journal entry speaks it; advance the in-world clock from the agenda.
  ([custom calendars](dates-and-planning.md#custom-calendars))
- **Search and filter.** Filter with `#tag`, the `is:todo` / `is:done` / `is:note` / `is:failing` /
  `is:passing` / `is:scheduled` / `is:unscheduled` / `is:overdue` / `is:held` flags, structure and artifact flags
  (`is:leaf` / `is:parent` / `is:collapsed` / `is:expanded` / `is:pill` / `is:random`, plus
  `has:children` / `has:footnote` and `has:dice` / `has:math` / `has:est` / `has:grammar` / `has:markov`
  / `has:var` / `has:seq`, link and tag presence via `has:link` / `has:backlink` / `has:tag` /
  `is:broken`, hygiene flags `is:empty` / `is:orphan` / `is:duplicate-title`, the recency flag
  `is:recently-edited`), date and property operators (`due:overdue`, `due:week` / `due:month`,
  `priority:a`, `var:name`, `has:key`, `key:value`, numeric compares `key:>N` / `key:<=N`), exact
  `"phrases"`, `-` to exclude, and `a | b` for either-side (OR) matching. Star a search to save it.
  ([full guide](getting-around.md#searching-and-filtering) · [hashtags](getting-around.md#hashtags))
- **Embedded queries.** Drop `{query: is:todo | due:week}` into a point for a live, self-updating
  list of matching points; reuses every search operator, click a result to jump. `{count: is:todo}`
  shows just the live number instead.
  ([embedded queries](getting-around.md#embedded-queries))
- **Query bases.** Turn a live search into a table: rows are the matching points, columns show the
  title, a property, or a formula computed per point (`= daysuntil(due)`, `= sum(cost)`), always in
  sync with the outline. ([query bases](getting-around.md#query-bases))
- **Column display roles.** Mark a base column as Status, Date, or Number (Column menu, Show as):
  state keywords become colored chips (your own sequences included), dates become urgency chips,
  numbers align and format. ([tables](writing-and-formatting.md#tables))
- **Board view.** Show any base with a Status column as a kanban board: your sequence's states
  become the lanes, rows become cards, and moving a card writes the state back into the table.
  ([tables](writing-and-formatting.md#tables))
- **Cards view.** Show any base as a responsive card grid: rows become cards, images become
  covers, and per-cell generator pills make a re-rollable deck.
  ([tables](writing-and-formatting.md#tables))
- **Calendar view.** A base with a Date column shows its rows on a month grid, undated rows
  counted below, never lost. ([tables](writing-and-formatting.md#tables))
- **Collapse and cap a base.** In the outline, collapse a base to one line or cap how many rows it
  shows (5/10/20/all); a "zoom in for more" line reveals the rest. ([tables](writing-and-formatting.md#tables))
- **A base from the keyboard.** Move a column or row with `Alt`+arrow, insert with `Alt+Shift`+arrow,
  cycle a column role with `Alt+R`, resize with `Alt+,` / `Alt+.`, and move a board card between lanes
  with `Alt+Left` / `Alt+Right`. ([tables](writing-and-formatting.md#tables))

## Linking and connecting notes

Build a connected notebook (Zettelkasten style), not just a single document.

- **Internal links.** `[[#point]]` links to any other point, with live titles and backlinks.
  ([linking points](links-and-references.md#linking-points) · [backlinks](links-and-references.md#backlinks))
- **Multi-document folders.** Connect a folder of documents on disk; switch between them, link
  across them, and search the whole folder at once.
  ([links across notes](links-and-references.md#links-across-notes) · [folder of documents](files-and-export.md#working-with-a-folder-of-documents))
- **Broken-links report.** File menu, Broken links: rounds up every link whose target is gone, in
  this document and across the folder, and jumps you to the point that holds each one.
  ([find broken links](links-and-references.md#find-broken-links))
- **Capture inbox.** A quick-capture strip that drops a note into any of up to 10 inboxes from
  anywhere, without navigating away; with no inbox set, captures land at the top level, so it
  works with zero setup. ([capture](tasks-and-organizing.md#capture-and-quick-inbox))
- **Capture from a link.** Opening Pointliner (installed or on the web) with `?append=your text`
  in the address adds that text to your inbox as a point; sharing a page or selection to it from
  your system share menu does the same, as plain text.
  ([capture](tasks-and-organizing.md#capture-and-quick-inbox))
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
- **Data packs.** Bundle grammar rules and formula variables into a named, reusable pack (File then
  Data packs): every rule and variable becomes callable across the document, and you can enable,
  disable, edit, import, or export packs. Pure data, no code, so opening any file stays safe.
- **Start from an example.** File then **Start from an example** drops a ready-made, fully live
  example into your document: a campaign oracle that rolls on your own cast and threads, an
  oracle-driven scene loop, or a self-computing character sheet. Click any pill inside to play, then
  delete it when you are done. More worked examples live in the [solo RPG guides](solo-rpg/README.md).
- **Installable.** Served over https it is a PWA, so "Install" gives you a standalone offline app.
- **Verbosity dial.** `Ctrl/Cmd+Shift+.` cycles Guided (all hints shown), Standard (beginner hints and
  tooltips off, menus and pencils kept), and Lean (the keyboard canvas: menus and pencils hidden, still
  fully keyboard-operable). Turn the explaining down as you get comfortable.
  ([the dial](getting-around.md#quiet-the-guidance-the-verbosity-dial))

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
