# Getting around

*Part of the [Pointliner guide](README.md). The everyday outliner moves: navigating, searching,
nesting and reshaping a document once it grows past one screen. None of this is about pills; it is
the plain outliner you use without thinking about it.*

A Pointliner document is a tree of nested **points** (bullet points). The pages on
[generating text](generating-text.md) and [computing numbers](computing-numbers.md) cover the live
pills you drop *inside* points. This page covers moving around the tree itself.

---

## Moving and nesting points

Reshape the document as your thinking changes: reorder points and change how deeply they nest.

- **Keyboard:** `Tab` indents a point (it becomes a child of the point above); `Shift+Tab` outdents
  it (it pops out to its parent's level). `Alt+Up` / `Alt+Down` moves a point among its siblings.
  `Ctrl/Cmd+D` duplicates a point and its subtree; `Ctrl/Cmd+Shift+Backspace` deletes it.
  `Ctrl/Cmd+.` and `Ctrl/Cmd+,` collapse and expand a point (while editing it, or while navigating
  rows with the arrow keys).
- **Mouse:** drag a point's bullet. Drop between rows to reorder, or drop to the right of a point to
  nest under it.
- **Touch (phone or tablet):** there is no `Tab` key, so **swipe a point sideways** instead: swipe
  right to indent (nest it under the point above), left to outdent (pop it out to its parent's
  level). A small direction chip appears as you swipe, and the move commits when you release past it.
  While you are editing a point, a **bar above the keyboard** gives one-tap **insert a pill, a to-do
  toggle (make the line tickable, or plain again), outdent, indent, move up and move down**, the
  easiest way to reshape on a phone. To move a point by dragging, drag its bullet: release between
  two rows to reorder it, or release to the right of a row to nest it under that row. You can also
  use **Move up** / **Move down** in the bullet's menu. Swiping
  straight up or down just scrolls the page as usual.

## Zoom into a point

Work on one branch full-screen with the rest of the document out of sight: drill into a single
project, a chapter or a busy task list so only it and its children fill the page.

To zoom in: press `Ctrl/Cmd+Enter` while editing a point, click a point's **bullet**, or open the
point's menu and choose **Zoom into**. The zoomed point becomes a large editable title with its note
and children below.

A **breadcrumb** row appears at the top: `Home › ancestor › … › current point`. Climb back out
through it, click or press `Enter` on any ancestor crumb to jump to that level, or the **Home** crumb
to return to the full document. Press `Esc` to step up just one level toward the parent rather than
exiting all the way.

### Collapse a paragraph to its first line

Zooming into a lone **paragraph** is pointless, so a paragraph's bullet does something more useful:
it **collapses the paragraph to just its first line**. Click a paragraph's bullet (or press
`Ctrl/Cmd+Enter`, or choose **Collapse to first line** from its menu) and a long paragraph folds down
to a one-line peek ending in an ellipsis, so a page of long notes stays scannable. Click the bullet
again to show the whole thing, or just click the text to edit it (editing always shows the full
paragraph). The folded state is saved with the document.

A paragraph is prose-first in one more way: any pills inside it are drawn **lighter**, without the
usual capsule, icon or dice breakdown, so a generated sentence reads as a sentence rather than a row
of widgets (they still work: hover shows a faint tint, click re-rolls). And when you export a
paragraph to Markdown or plain text, each pill flattens to just its **result** (`9`, not `2d6 = 9`),
so the exported prose reads clean. Pills in ordinary bullets keep their full capsule and export their
recipe, as before.

## Selecting many points

Work on many points at once instead of one at a time: copy or move a batch, indent or outdent a whole
group, set a state, date, check or property across all of them, turn them all into another type, or
delete the lot.

Start a selection by `Shift`-clicking a point (a contiguous range), `Ctrl`/`Cmd`-clicking points to
pick them out of order or pressing `Shift+Up` / `Shift+Down` from the keyboard. A selection bar
appears at the bottom showing how many points are selected, with a button
for each bulk action: Copy, Indent, Outdent, State, Dates, Check, Properties, Turn into and Delete.
From the keyboard, `Ctrl/Cmd+C` copies, `Ctrl/Cmd+X` cuts, and `Ctrl/Cmd+V` pastes the points;
`Tab` / `Shift+Tab` indent or outdent the selection; `Delete` removes it and `Esc` clears it.
`Ctrl/Cmd+Shift+S` cycles the to-do state and `Ctrl/Cmd+Shift+P` cycles the priority across every
selected point at once (the same two chords cycle a single point while you are editing it).

## Refile a point

Move a point and everything under it to a new home far across the document: drop a stray idea into the
right project, tuck a finished item under an archive or pull a buried note up to the top.

Open the point's menu and choose **Refile** to browse the whole document as a searchable tree: type to
filter to a destination, walk it with the arrow keys, then press `Enter` to move the point there as
the chosen parent's last child. Pick **Top level** to lift it out of all nesting. It is the
searchable alternative to dragging or indenting one step at a time.

Keyboard-first: type `/refile` for the searchable tree, or name the destination directly with
`/refile:Archive` to move the point under the point called "Archive" without opening anything.
`/refile:top` lifts it out of all nesting.

---

## Searching and filtering

Find anything in a large document without scrolling. Narrow to a topic, surface all open tasks or
spot everything that is overdue.

Type words in the search box and **every word must appear**. The operators:

- `-word` excludes a word.
- `a | b` matches either side (OR). Put spaces around the pipe; words on each side still combine
  with AND, so `draft is:todo | is:done` means (draft AND is:todo) OR is:done.
- `"exact phrase"` matches that phrase exactly.
- `#tag` filters to a label (see [Hashtags](#hashtags) below).
- `is:done` / `is:todo` / `is:note` / `is:failing` / `is:passing` filter structurally (finished, open,
  has a note, a failing or passing check). `is:passing` is not the opposite of `is:failing`: a point
  with no check at all is neither.
- `is:leaf` / `is:parent`, `is:collapsed` / `is:expanded` filter by structure and fold state.
- `is:pill` finds a point carrying any pill; `is:random` narrows to the re-rollable ones (dice,
  generators). `has:dice` (and `has:math`, `has:est`, `has:grammar`, `has:markov`, `has:var`,
  `has:seq`) find a specific kind; `has:children` / `has:footnote` find sub-points or a footnote.
- `state:waiting` filters by a status keyword; `due:today` / `due:overdue` filter by date, and
  `due:week` / `due:month` catch anything due within the next seven or 30 days (also `start:week` / `start:month`).
- `is:scheduled` / `is:unscheduled` split points by whether they have a date at all; `is:overdue`
  finds points past their deadline and not done (the due date, or the start if there is no due).
  `is:held` finds points in their sequence's held band (blocked or waiting, like `#WAITING`).
- `is:empty` finds a point with no text; `is:orphan` finds one nothing links to; `is:duplicate-title`
  finds a point whose title collides with another; `is:recently-edited` finds points changed in the
  last 48 hours.
- `var:strength` finds the point that declares a variable.
- `has:link` / `has:backlink` find points that contain a link or are linked to by another point
  (within this document); `is:broken` finds points holding a link whose target no longer exists.
  `has:tag` matches any tagged point.
- `has:key` / `key:value` filter by a property; `key:>N` (also `<`, `>=`, `<=`) compares a numeric
  property, like `cost:>100` or `score:<=3.5`.

You do not have to remember any of this. In **Guided**, focusing the search box opens a cheatsheet
of the operators above; click any example to add it to what you have already typed, so you can stack
filters by picking them. From the keyboard it is a single stop: one `Tab` from the search box lands
on the examples, the arrow keys move between them (`Home` and `End` jump to the ends), `Enter` adds
the one you are on, and `Esc` puts you back in the search box with your query intact.

Anything malformed stays a literal text term, so a stray `:` or `#` never breaks the search.

An `is:` filter is the one exception, because `is:` is reserved: there is nothing else an unknown
value could have meant. Type `is:blocked` and the search box says the filter is not one this app
knows, and points you at `is:held` (or at `state:blocked`, if your document declares a state by
that name). It matches nothing rather than quietly searching for the text "is:blocked", and the
same note appears on a `{query:}` or `{count:}` pill, so a live count in your document is never a
number that came from a filter which never ran. A half-typed value stays quiet: typing your way
to `is:todo` never accuses you along the way.

## Saved searches

Keep a search you run often within one click instead of retyping it. Pin filters like open tasks
tagged a project, everything overdue or notes mentioning a person, then bring any of them back later.

Type your search, then click the **star** at the right of the search box to save it. The star fills
in once it is kept. Saved searches show as chips under the **Saved** heading whenever the search box
has focus; click one to run it again, or the ✕ on a chip to forget it. Click the filled star to
forget the one you are currently looking at.

## Embedded queries

Pin a live search inside the document itself. Instead of running a search in the box each time,
drop the search into a point and it renders a list of every matching point, kept up to date as
the document changes: a this-week view, an open-questions roundup, everything tagged a project.

Type `@` and choose **Query**, or write it inline: `{query: is:todo | due:week}`. The part after
`query:` is a normal search, so every operator works (`#tag`, `is:todo`, `due:week`, `key:value`,
`-` to exclude, `|` for OR). Click any result to jump to it, or the pencil to change the search. A
long list shows the first 10 with a `+N more`. The query never lists its own point.

### Just the number (count)

Sometimes you want the tally, not the list. `{count: <search>}` (or `@` then **Count**) renders a
compact live number: how many points match right now.

```
Open threads: {count: #thread is:todo} · Overdue: {count: due:overdue}
```

It updates as the document changes, `0` is a valid answer, and the pencil edits the search, same
as a query pill. The same search counts what the matching `{query: …}` would list.

### Search the whole folder

With a [connected folder](files-and-export.md#working-with-a-folder-of-documents), both dialogs
offer a **Search the whole folder** checkbox: the pill then matches across **every document** in
the folder, and each result from another document names it (click one to open that document at
that point). Your current document counts live; the other documents count **as they were last
saved** to disk, and the pill's tooltip says so. A folder-scoped pill opened without a folder
(say, in a shared copy) shows the current document only and marks itself, so nothing narrows
silently. In a folder pill's edit mode the pill stays whole (the scope lives in the pill, not in
the text); use its pencil to change the search.

## Query bases

When a list is not enough, turn the same live search into a **table**. A query base's rows are the
points matching a search; its columns show whatever you pick per point: the clickable title, a
property like `due` or `cost`, or a formula computed for each row (`= daysuntil(due)`,
`= sum(cost)` to roll up a point's children). The grid updates itself as the document changes;
nothing is stored, it is always a view of the live document.

Type `/` and choose **Query base** (or `/querybase`), then give it a search and one column per line
(`title`, a property key or `= formula`; put `Name:` in front to label a column). The strip above the grid
shows the search and the live match count; click it (or press `Enter` on it) to change the query,
columns or sort. The optional **Sort rows** field orders the results by any column, formula columns
included ("Due desc", "cost"); the strip names an active sort, and blank keeps document order. A broad query is capped at 100 rows so it cannot freeze the page; when the cap bites, the
strip shows **100 of N** and a **Show all** button lifts it (the choice is remembered, and the same
button caps it again). Property columns are editable in place: type in a `due` or `cost` cell and the value is
written to the matching point itself (a message names what changed where, and one undo takes it
back). Editing a value so the point stops matching removes its row, and the message says so. The
title column stays a link (click it to jump to the point) and formula columns stay computed.

## Searching all your documents

When several documents are in the same folder (a [connected folder](features.md#linking-and-connecting-documents)),
search covers all of them at once, not just the one you are reading. Useful when you know something is
in your documents but cannot remember which file. Matches from other documents appear in a **Found in other
notes** list; click one to jump straight there.

## Hashtags

Label points by topic, status or project so related ones are easy to round up later. Type `#`
followed by a word anywhere in a point (like `#idea` or `#urgent`) and it becomes a clickable tag.

**A tag covers everything filed beneath it.** Tag a heading `#campaign` and a search for
`#campaign` finds the work under it, not just the heading. Two things deliberately stay put: a
status word like `#WAITING` describes the point it sits on and never passes down to the work
underneath, and `has:tag` asks whether a point carries a tag *itself* (which is what makes
`-has:tag` a useful way to find points you have not labelled yet).

**Nest tags** with a slash to build a little hierarchy, like `#thread/torn-letter` under `#thread`: a
search for the parent `#thread` rounds up every point under it, while `#thread/torn-letter` narrows
to just that branch.

As you type `#`, a menu lists tags you have already used with a **count** of how many points carry
each, so you reuse `#todo` instead of drifting to `#todos`. Arrow to one and press `Enter`, or keep
typing a fresh word to coin a new tag. Click any tag in the document to instantly filter to every
point that shares it.

**Browse all your tags as a tree.** Open **File then Browse tags** to see the whole tag namespace at
once, laid out as a tree with a count on each: nested tags sit under their parent (`#thread/torn-letter`
under `#thread`), and a name used only to group others (say `#project`, when you only ever wrote
`#project/alpha` and `#project/beta`) shows as a dimmed heading you can still pick. Type in the box to
filter, arrow up and down to browse, and press `Enter` or click to filter the document to that tag,
its nested tags included.

**Give a tag a color.** Open **File then Tag & property styling**, type a tag name and click one of
the color swatches. Every `#tag` with that name then shows in that color, and nested tags inherit it
(coloring `#thread` also colors `#thread/idea`). To change a color, type the same name and pick a
different swatch; to remove it, clear it from the list in that dialog. The colors are a curated set
chosen to stay readable in light and dark mode. It is purely visual: the color is stored with the
document and changes nothing about the tag's text or how search works.

Working inside an interactive base entirely from the keyboard (moving, inserting and resizing columns
and rows) is covered on the [writing and formatting](writing-and-formatting.md#tables) page with the
rest of the table controls.

## Quiet the guidance: the verbosity dial

Pointliner starts chatty, with hints, tooltips and menus that teach you the syntax. Once you know the
commands, you can turn the explaining down and keep just the app. Press `Ctrl/Cmd+Shift+.` to move to a
quieter level and `Ctrl/Cmd+Shift+,` to move back toward more guidance (or open the File menu and use the
verbosity row, which shows the current level as a dot track). Three levels cycle:

- **Guided** (the default): everything is shown, empty-point hints, the search cheatsheet, pill tooltips,
  and the full `/` and `@` menus.
- **Standard:** the beginner teaching text is off (no empty-point hints, no search cheatsheet, no pill
  tooltips), but the menus still open and the edit pencils still appear on hover. This is the "I know the
  commands, stop explaining, keep the conveniences" level.
- **Lean:** the keyboard canvas, and a quiet reading surface. The `/` and `@` menus stop popping up;
  instead a small one-line tip shows the command your typing has matched, so you press `Enter` to insert
  it without a full menu. The edit pencils are hidden until you focus a pill, and the top toolbar slides
  up out of the way, sliding back the moment you move your pointer to it or focus search (on a touch
  screen it stays put). Everything is still clickable and fully keyboard-operable.

Nothing is ever removed, only quieted, so you can move down as you get comfortable and back up any time.
Your choice is remembered with the document.

Because Lean pulls the chrome back to almost nothing, it doubles as a distraction-free reading mode:
switch to Lean and, as long as you are not editing, the document reads like a clean page. There is no
separate reading mode to find; this is it.

---

**Next:** the live pills, [Generating text](generating-text.md) and
[Computing numbers](computing-numbers.md), or jump to the [Cookbook](cookbook.md).

**Back to:** [the guide](README.md).
