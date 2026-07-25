# What Pointliner can do

*Part of the [Pointliner guide](README.md). A scannable map of every feature: what it is, in one
line, with a link to where you learn it. If you want to know "can it do X?", this is the page to
skim. For the deep how-to, follow the links.*

Pointliner is a document that **generates** text (dice, random tables, name makers) and **computes**
over what you write (math, dates, sums that roll up the tree), all inside the writing itself. The
surface is an **outline** (nested bullet points, like a foldable to-do list or a notebook), because
that is what lets you reorganize thought freely; the generating and computing are the point. All of
it runs in one file, offline, with nothing to install.

Nothing below needs code. If you can type `{`, you can use it.

---

## Writing and structuring

The everyday outliner. This is the part you use without thinking about it.

- **Nested points.** Type, press `Enter` for a new point, `Tab` / `Shift+Tab` to indent or outdent.
  ([point types](writing-and-formatting.md#point-types))
- **Markdown formatting.** `**bold**`, `*italic*`, `# headings`, `> quotes`, code, all per line.
  ([styling text](writing-and-formatting.md#styling-text))
- **Secret and spoiler blocks.** Start a line with `>!` to hide it behind a blur until you click
  or press it to reveal. ([secret blocks](writing-and-formatting.md#secret-and-spoiler-blocks))
- **Emoji.** Type `:` and a name (`:fire`, `:tada`) to pick from a menu, or type the full
  `:shortcode:`. Around 500 names, including a solo-RPG set for a game journal (`:dragon:`,
  `:sword:`, `:dice:`). ([emoji](writing-and-formatting.md#emoji), full
  [reference](emoji-shortcodes.md))
- **To-dos.** Type `- [ ]` for a checkbox, or `#TODO` / `#NEXT` / `#WAITING` / `#DONE` for status,
  with `[#A]` priorities. ([to-dos](tasks-and-organizing.md#to-dos-and-tasks))
- **Collapse and zoom.** Fold any branch; click a bullet to zoom in and work on just that subtree.
  A **paragraph's** bullet instead collapses it to just its first line, so long notes stay scannable.
  ([zoom](getting-around.md#zoom-into-a-point) · [collapse a paragraph](getting-around.md#collapse-a-paragraph-to-its-first-line))
- **Reorder by dragging** (mouse or touch), or move points with the keyboard.
  ([moving and nesting](getting-around.md#moving-and-nesting-points))
- **Per-point notes.** Attach a longer note under any point; hide them all with one toggle.
  ([per-point notes](writing-and-formatting.md#per-point-notes))
- **Properties.** Give a point `key: value` data (like `cost: 12` or `owner: me`) you can total
  and search; paste a list of `key: value` lines into the editor to add a whole stat block at once.
  ([properties](tasks-and-organizing.md#properties))
- **Tag colors and property icons.** File then Tag & property styling: give a `#tag` its own
  on-brand color (nested tags inherit it) and a property key a small icon. Purely visual, stored
  with the document.
- **Click anywhere to edit.** Click any empty part of a point and you are typing there.
- **Touch quick bar.** On a phone or tablet, a bottom bar keeps the essentials under your
  thumb: capture, a new point, a new point with the `@` insert menu, and help. While you
  edit, it swaps for a bar of structural controls (indent, move, insert).
- **Small controls are bigger than they look on touch.** Chips, toggles, close buttons and the
  fold arrow all take a comfortable tap on a phone even where the visible control is small. The
  target grows, not the design, so nothing shifts and no control starts stealing its neighbor's
  taps. On a mouse, everything stays exactly as it was.

## Generating text

Random generators for names, loot, prompts, oracles, anything. Type it in `{curly braces}` and it
becomes a clickable pill. Full guide: **[Generating text](generating-text.md)**.

- **The `{` menu teaches all of this.** Type an opening `{` in a point and a menu lists every
  pill form (dice, picks, calculations, live lists, meters and the rest); pick one and it drops
  in a ready-to-edit scaffold with the first blank selected. It keeps completing as you write
  inside a pill: function names in a calculation, `is:todo` filters in a live search, your own
  rule and variable names, a point's own properties. ([the two doors](generating-text.md))
- **Pick from a list.** `{sword | shield | potion}` shows one at random, click to re-pick.
  ([weights too](generating-text.md#pick-one-of-several-alternation): make some choices rarer.)
- **Glue pieces into one name.** `{{Ael|Bor}{ric|wyn}}` builds a whole syllable name as ONE pill
  that re-rolls as a unit; `{{Grey|Salt|Storm}haven}` glues a suffix on.
  ([templates](generating-text.md#glue-pieces-into-one-name-templates))
- **Roll dice.** `{2d6}`, `{1d20+5}`, plus exploding, keep-highest, Fate and success pools.
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
- **Roll on your own document.** `{roll: is:todo}` picks a random point from your live document (the points below it, or a `#tag` anywhere), so a random open thread or NPC gets chosen from what you already wrote.
  ([roll on your document](generating-text.md#roll-on-your-own-document))
- **Roll log.** Turn on File menu, Log rolls and every random result (dice, generators, tables, decks, chains, the oracle, roll-on-document, estimates) is also written to a dated Rolls log, so re-rolling never loses the record. Off by default; set a home point from the bullet menu. ([roll log](dates-and-planning.md#roll-log))

## Computing with numbers

A live calculator that can see your document. Math pills recompute on their own. Full guide:
**[Computing numbers](computing-numbers.md)**.

- **Expressions.** `{= 2 * 19}` shows **38**; the usual arithmetic, powers, roots, functions.
  ([expressions](computing-numbers.md#expressions))
- **Show just the value.** Any math pill can render only its result (no formula), so a number reads
  like part of a heading or sentence. Open the pill and check **Show value only**.
  ([show just the value](computing-numbers.md#show-just-the-value))
- **Logic.** Combine comparisons with `and(…)` / `or(…)` / `not(x)`; one check can assert several
  rules at once. ([functions](computing-numbers.md#functions))
- **Units and dates.** Convert units with `@convert` or `{= convert(10, km, mi)}` (temperature via
  `{= c2f(20)}`), and declare your own units (a currency, a fictional measure) with `/units` or File
  then Custom units. Do date math (`{= daysuntil(due)}`).
  ([units](computing-numbers.md#units) · [your own units](computing-numbers.md#your-own-units) · [dates](computing-numbers.md#dates))
- **Number formatting.** Results group thousands automatically (`840,000`); set decimal places, a
  prefix (`$`) or a suffix (`kg`) per pill for money or units. ([format](computing-numbers.md#format-the-number))
- **Roll numbers up the tree.** `{= sum(cost)}` totals a property across child points, live, like a
  spreadsheet column, and `{= sum("#task", cost)}` totals it over everything matching a live search.
  Add `, document` (or `, folder`) to search the whole document or folder from any point.
  ([aggregation](computing-numbers.md#roll-a-number-up-your-document-aggregation))
- **Word counts.** `{= words(subtree)}` counts the prose under a heading; per-point notes stay out
  of the count unless you write `{= words(subtree, notes)}`.
  ([word counts](computing-numbers.md#roll-a-number-up-your-document-aggregation))
- **Uncertain estimates.** `{5 to 10}` models a range with a little distribution sparkline, and the
  uncertainty propagates through math. Bounds can be declared variables (`{cost_low to cost_high}`).
  ([estimates](computing-numbers.md#uncertain-values-estimates))
- **Self-checking outlines.** Attach a rule like `sum(cost) <= budget`; the point flags itself when
  it breaks. Structure is testable too: `count("-has:hp") == 0` means every point below carries hp.
  ([constraints](computing-numbers.md#make-the-document-check-itself-constraints))
- **Progress cookies.** Drop `[/]` or `[%]` for a live tally of checkboxes and child to-dos.
- **Progress clocks.** Drop `[o 0/6]` for a segmented tension clock you fill by hand, click to
  advance. ([progress clocks](tasks-and-organizing.md#progress-clocks))
  ([progress](computing-numbers.md#progress-bars))
- **Meters.** Drop `{meter: hp/hpmax}` for a bar of a number against its maximum (HP, spell
  slots, any gauge), read live from the point's properties. Either side can be a live calculation,
  so `{meter: words(subtree)/1000}` is a writing goal that fills as you write.
  ([meters](tasks-and-organizing.md#meters))
- **Variables.** Declare a value once, reference it everywhere; change it and dependents update.
  The Variables panel (`/variables` or `Ctrl/Cmd+Shift+V`) lists them all with live values.
  ([variables](computing-numbers.md#variables-in-math))
- **Variable bases.** Mark a base so every row declares variables: row Orc, column HP reads as
  `{Orc.HP}` in text and `{= Orc.HP + 5}` in math, live as you edit the cells.
  ([variable bases](computing-numbers.md#variable-bases-a-table-of-variables))

## Dates, planning and journaling

Turn the document into a lightweight planner.

- **Start and due dates.** Schedule any point with a start, a deadline or both; color-coded chips
  show what is due, soon or overdue. ([scheduling](dates-and-planning.md#scheduling-dates))
- **Recurring tasks.** Give a task a Repeat schedule (`every week`, `every Monday`, `monthly on the
  1st`); completing it rolls the date forward and re-opens it.
  ([recurring](dates-and-planning.md#recurring-tasks))
- **Agenda.** A built-in calendar, timeline (Gantt) and due-list view of your dated points.
  ([agenda](dates-and-planning.md#agenda-and-calendar))
- **Timeline.** Browse every dated point in chronological order, grouped by month, as the history of
  your document: scheduled tasks, daily journal entries, lore events (a `when` or `date` property) and
  chronicle entries, each toggleable; calendar-aware. However long the list, it is one keyboard stop:
  arrows move between entries and `PageUp`/`PageDown` jump a month.
  ([timeline](dates-and-planning.md#timeline))
- **Daily journal.** Open or create today's entry from one button, in the doc or as a file per day.
  ([journal](dates-and-planning.md#daily-journal))
- **Chronicle.** A log dated on a day you choose: a journal twin whose date is a movable cursor
  (step it with ◂ / ▸ or jump to a date), so you log entries in a custom calendar, not the real one.
  ([chronicle](dates-and-planning.md#the-chronicle-a-dated-log))
- **Custom calendars.** Give a document its own calendar (your months, week, and era) and every
  date and agenda view speaks it; advance the clock from the agenda. The journal stays on the
  real calendar, and you can set one subtree as a chronicle with its own calendar, so real and
  custom-calendar dates coexist in one document. ([custom calendars](dates-and-planning.md#custom-calendars))
- **Search and filter.** Filter with `#tag`, the `is:todo` / `is:done` / `is:note` / `is:failing` /
  `is:passing` / `is:scheduled` / `is:unscheduled` / `is:overdue` / `is:held` flags, structure and pill flags
  (`is:leaf` / `is:parent` / `is:collapsed` / `is:expanded` / `is:pill` / `is:random`, plus
  `has:children` / `has:footnote` and `has:dice` / `has:math` / `has:est` / `has:grammar` / `has:markov`
  / `has:var` / `has:seq` / `has:query`, link and tag presence via `has:link` / `has:backlink` / `has:tag` /
  `is:broken`, hygiene flags `is:empty` / `is:orphan` / `is:duplicate-title`, the recency flag
  `is:recently-edited`), date and property operators (`due:overdue`, `due:week` / `due:month`,
  `priority:a`, `var:name`, `has:key`, `key:value`, numeric compares `key:>N` / `key:<=N`), exact
  `"phrases"`, `-` to exclude, and `a | b` for either-side (OR) matching. Star a search to save it.
  An `is:` filter the app does not know says so and names the one you probably wanted, in every
  tier and on `{query:}` / `{count:}` pills too, rather than answering with a confident zero.
  ([full guide](getting-around.md#searching-and-filtering) · [hashtags](getting-around.md#hashtags))
- **Browse tags.** File then Browse tags shows every hashtag as a tree with a count on each (nested
  tags under their parent); pick one to filter the document to it. ([hashtags](getting-around.md#hashtags))
- **Embedded queries.** Drop `{query: is:todo | due:week}` into a point for a live, self-updating
  list of matching points; reuses every search operator, click a result to jump. `{count: is:todo}`
  shows just the live number instead. With a folder connected, a **Search the whole folder**
  checkbox widens either pill to every document, and `{= sum("has:cost", cost, folder)}` totals a
  property across the folder the same way.
  ([embedded queries](getting-around.md#embedded-queries) · [folder search](getting-around.md#search-the-whole-folder) · [folder totals](computing-numbers.md#roll-a-number-up-your-document-aggregation))
- **Query bases.** Turn a live search into a table: rows are the matching points, columns show the
  title, a property or a formula computed per point (`= daysuntil(due)`, `= sum(cost)`), always in
  sync with the document. Property cells edit in place, writing back to the matching point.
  ([query bases](getting-around.md#query-bases))
- **Pills in base cells.** Type `{2d6}`, `{= price * 1.1}` or `{Orc.HP}` straight into a base
  cell and it becomes the live pill when you leave the cell, exactly as in a point.
  ([tables](writing-and-formatting.md#tables))
- **Column display roles.** Mark a base column as Status, Date or Number (Column menu, Show as):
  state keywords become colored chips (your own sequences included), dates become urgency chips,
  numbers align and format. Status and Date are also **auto-detected** from the data, so Board and
  Calendar light up with nothing to set. ([tables](writing-and-formatting.md#tables))
- **Column number format.** A Number column can read as money, a measurement or a percentage: choose
  Number format in its menu and set decimal places, a prefix like `$` and a suffix like ` kg` or `%`.
  Every cell and the Calculate total format alike; the stored value stays plain.
  ([formatting numbers](writing-and-formatting.md#tables))
- **Board view.** Show any base with a Status column as a kanban board: your sequence's states
  become the lanes, rows become cards, and moving a card writes the state back into the table.
  ([tables](writing-and-formatting.md#tables))
- **Cards view.** Show any base as a responsive card grid: rows become cards, images become
  covers, and per-cell generator pills make a re-rollable deck.
  ([tables](writing-and-formatting.md#tables))
- **Calendar view.** A base with a Date column shows its rows on a month grid, undated rows
  counted below, never lost. ([tables](writing-and-formatting.md#tables))
- **Collapse and cap a base.** In the document, collapse a base to one line or cap how many rows it
  shows (5/10/20/all); a "zoom in for more" line reveals the rest. ([tables](writing-and-formatting.md#tables))
- **A base from the keyboard.** Move a column or row with `Alt`+arrow, insert with `Alt+Shift`+arrow,
  cycle a column role with `Alt+R`, resize with `Alt+,` / `Alt+.`, and move a board card between lanes
  with `Alt+Left` / `Alt+Right`. ([tables](writing-and-formatting.md#tables))

## Linking and connecting documents

Build a connected notebook (Zettelkasten style), not just a single document.

- **Internal links.** `[[#point]]` links to any other point, with live titles and backlinks.
  ([linking points](links-and-references.md#linking-points) · [backlinks](links-and-references.md#backlinks))
- **Mirrors and subtree embeds.** `[[#id|]]` embeds a point's content inline; alone on its line it
  embeds the point **and everything under it**, so an overview note composes whole sections without
  copying (source folds bound it; long subtrees cap at 40 rows). In the `[[` picker, Shift+Enter (or
  Shift+click) embeds instead of referencing.
  ([linking points](links-and-references.md#linking-points))
- **Link graph.** See your document as a browsable web of its links instead of a list, and jump to
  any point by recognizing it. It also draws a dashed line between points that mention each other by
  name without linking, so relationships you never got around to linking still show up. With a folder
  connected, a **Folder** view maps the documents themselves: one dot per document, thicker lines
  where more links run between them, click to open. The web is one keyboard stop, with the arrows
  moving from point to point in document order.
  ([link graph](links-and-references.md#link-graph))
- **Multi-document folders.** Connect a folder of documents on disk; switch between them, link
  across them and search the whole folder at once.
  ([links across documents](links-and-references.md#links-across-documents) · [folder of documents](files-and-export.md#working-with-a-folder-of-documents))
- **Mirrors across documents.** `[[docId#id|]]` embeds a point from another document where you
  write it, shown as last saved in its file (alone on its line, its whole subtree comes along);
  click it to open the source.
  ([links across documents](links-and-references.md#links-across-documents))
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

## Files, sharing and offline

- **One file, fully offline.** The whole app is a single `index.html`. No account, no network, no
  install. Your filesystem is the storage; your choice of sync (Dropbox, iCloud, git or none) is
  the sync. ([saving](files-and-export.md#saving-your-work))
- **Open formats.** The native save format is a plain, open document file (OPML); export to Markdown or plain text for sharing.
  ([exporting](files-and-export.md#exporting-and-sharing))
- **Exclude from export.** Flag a point (and its subtree) to skip every export format, Markdown,
  plain text and Web page alike, so scaffolding and planning notes stay out of a shared copy. Only
  the OPML save keeps it. Excluding a variable declaration is called out after a Web page export,
  since that format stays live and recomputes.
  ([exporting](files-and-export.md#exporting-and-sharing))
- **Web page (HTML).** Export a single `.html` that *is* the app plus your document. Hand it to
  someone and it re-rolls and recomputes on their machine, no install, no account.
  ([exporting](files-and-export.md#exporting-and-sharing))
- **Reusable packs.** Bundle the pieces of a whole game system into one shareable file: grammar rules,
  variables (formulas, or random picks like `strength: 3d6` rolled once and frozen), and captured
  subtrees. Capture a subtree, do not type it: build a sheet, an oracle or a shuffle deck as points,
  then **Add to a pack** from the point's bullet menu, and the whole subtree with its pills rides
  the pack (a captured deck keeps drawing without repeats when someone stamps it). Manage packs in
  File then Reusable packs: every rule and variable becomes callable across the document, captured
  templates appear in the `/template` picker, and you can enable, disable, edit, import or export
  packs. Nothing reaches the pack itself until you press Save. Pure data, no code, so opening any
  file stays safe.
- **Half-written work survives a dismissal.** Every dialog you type into holds what you wrote if you
  close it: the pack editor, the generator, chain, deck, sequence, dice, formula, variable, estimate
  and query dialogs, the Schedule and Properties editors, and the capture and journal boxes. Reopen
  the same dialog and your text is waiting. It comes back only where it belongs, so a draft you
  abandoned while inserting something new never overwrites an existing pill you later open to edit,
  and a half-typed schedule stays with the point it was meant for.
- **Start from an example.** File then **Start from an example** drops a ready-made, fully live
  example into your document. There are twelve: solo-RPG starters (a campaign oracle that rolls on
  your own cast and threads, an oracle-driven scene loop, a self-computing character sheet) and
  general-purpose ones (a project tracker, a reading log, a life dashboard, a weekly meal planner, a
  trip planner with a calendar view, a decision helper, a study and flashcards page, a home
  inventory, and a worldbuilding and writing kit). Click any pill inside to play, then delete it when
  you are done. More worked examples live in the [solo RPG guides](solo-rpg/README.md).
- **All commands.** One searchable window over every point command, generator, calculation and
  pill. Open it from the toolbar (the checklist button), with `Ctrl/Cmd+K`, or by typing `/builder`
  (in Guided mode, `/`, `@` or `{` open it too). Type to filter, arrow to browse, Enter to insert; the
  side pane explains each command as you go.
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
- **[Cookbook](cookbook.md)** has copy-paste recipes that each start from an everyday itch: a plan
  sized in honest ranges, a budget that flags itself wherever the costs hide, a reading pile that
  only offers what is left, journal prompts that refuse autopilot, and more.
- **[Solo RPG guides](solo-rpg/README.md)** show the generators, oracle and journal
  working together at the table, with importable demo files.

> Inside the app, the **`?` button** (bottom-right) is the always-there cheat sheet, and the
> **Concept guide** button explains every feature with examples. This page is the *overview*; those
> are the *look-it-up*.
