# Getting around

*Part of the [Pointliner guide](README.md). The everyday outliner moves: navigating, searching,
nesting, and reshaping a document once it grows past one screen. None of this is about pills; it is
the plain outliner you use without thinking about it.*

A Pointliner document is a tree of nested **points** (bullet points). The pages on
[generating text](generating-text.md) and [computing numbers](computing-numbers.md) cover the live
pills you drop *inside* points. This page covers moving around the tree itself.

---

## Moving and nesting points

Reshape the outline as your thinking changes: reorder points and change how deeply they nest.

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
  While you are editing a point, a **bar above the keyboard** gives one-tap **outdent, indent, move
  up, and move down**, the easiest way to reshape on a phone. To reorder by dragging, press and hold
  the bullet and drag up or down, or use **Move up** / **Move down** in the bullet's menu. Swiping
  straight up or down just scrolls the page as usual.

## Zoom into a point

Work on one branch full-screen with the rest of the outline out of sight: drill into a single
project, a chapter, or a busy task list so only it and its children fill the page.

To zoom in: press `Ctrl/Cmd+Enter` while editing a point, click a point's **bullet**, or open the
point's menu and choose **Zoom into**. The zoomed point becomes a large editable title with its note
and children below.

A **breadcrumb** row appears at the top: `Home › ancestor › … › current point`. Climb back out
through it, click or press `Enter` on any ancestor crumb to jump to that level, or the **Home** crumb
to return to the full outline. Press `Esc` to step up just one level toward the parent rather than
exiting all the way.

## Selecting many points

Work on many points at once instead of one at a time: copy or move a batch, indent or outdent a whole
group, set a state, date, check, or property across all of them, turn them all into another type, or
delete the lot.

Start a selection by `Shift`-clicking a point (a contiguous range), `Ctrl`/`Cmd`-clicking points to
pick them out of order, or pressing `Shift+Up` / `Shift+Down` from the keyboard. A selection bar
appears at the bottom showing how many points are selected, with a button
for each bulk action: Copy, Indent, Outdent, State, Dates, Check, Properties, Turn into, and Delete.
From the keyboard, `Ctrl/Cmd+C` copies, `Ctrl/Cmd+X` cuts, and `Ctrl/Cmd+V` pastes the points;
`Tab` / `Shift+Tab` indent or outdent the selection; `Delete` removes it and `Esc` clears it.

## Refile a point

Move a point and everything under it to a new home far across the outline: drop a stray idea into the
right project, tuck a finished item under an archive, or pull a buried note up to the top.

Open the point's menu and choose **Refile** to browse the whole outline as a searchable tree: type to
filter to a destination, walk it with the arrow keys, then press `Enter` to move the point there as
the chosen parent's last child. Pick **Top level** to lift it out of all nesting. It is the
searchable alternative to dragging or indenting one step at a time.

---

## Searching and filtering

Find anything in a large outline without scrolling. Narrow to a topic, surface all open tasks, or
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
  `due:week` / `due:month` catch anything due within the next 7 or 30 days (also `start:week` / `start:month`).
- `var:strength` finds the point that declares a variable.
- `has:key` / `key:value` filter by a property; `key:>N` (also `<`, `>=`, `<=`) compares a numeric
  property, like `cost:>100` or `score:<=3.5`.

Anything malformed stays a literal text term, so a stray `:` or `#` never breaks the search.

## Saved searches

Keep a search you run often within one click instead of retyping it. Pin filters like open tasks
tagged a project, everything overdue, or notes mentioning a person, then bring any of them back later.

Type your search, then click the **star** at the right of the search box to save it. The star fills
in once it is kept. Saved searches show as chips under the **Saved** heading whenever the search box
has focus; click one to run it again, or the ✕ on a chip to forget it. Click the filled star to
forget the one you are currently looking at.

## Searching all your documents

When several documents are in the same folder (a [connected folder](features.md#linking-and-connecting-notes)),
search covers all of them at once, not just the one you are reading. Useful when you know something is
in your documents but cannot remember which file. Matches from other documents appear in a **Found in other
notes** list; click one to jump straight there.

## Hashtags

Label points by topic, status, or project so related ones are easy to round up later. Type `#`
followed by a word anywhere in a point (like `#idea` or `#urgent`) and it becomes a clickable tag.

**Nest tags** with a slash to build a little hierarchy, like `#thread/torn-letter` under `#thread`: a
search for the parent `#thread` rounds up every point under it, while `#thread/torn-letter` narrows
to just that branch.

As you type `#`, a menu lists tags you have already used with a **count** of how many points carry
each, so you reuse `#todo` instead of drifting to `#todos`. Arrow to one and press `Enter`, or keep
typing a fresh word to coin a new tag. Click any tag in the outline to instantly filter to every
point that shares it.

---

**Next:** the live pills, [Generating text](generating-text.md) and
[Computing numbers](computing-numbers.md), or jump to the [Cookbook](cookbook.md).

**Back to:** [the guide](README.md).
