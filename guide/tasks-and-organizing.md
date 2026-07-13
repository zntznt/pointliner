# Tasks and organizing

*Part of the [Pointliner guide](README.md). Turn an outline into a working system: to-dos and
custom workflows, structured properties, progress bars, reusable templates, quick capture, and
aliases. Like [getting around](getting-around.md), this is the plain outliner, no pills required.*

---

## To-dos and tasks

Track a shopping list, a reading list, a project backlog, or a daily to-do, all in the same outline.

Turn any point into a task two ways:

- A **checkbox**: type `- [ ]` at the start of a point (or use `/todo`).
- A **status word**: start the point with an UPPERCASE keyword prefixed by `#`, like `#TODO`,
  `#NEXT`, or `#DONE`. The `#` and the capitals are required: plain `TODO` stays text, and lowercase
  `#todo` is a [tag](getting-around.md#hashtags) that filters by status rather than a badge.

The easiest path is **`/todo`**, which writes the status for you. Click the colored badge to change
the status or set a **priority** (`A`, `B`, or `C`), or from the keyboard press `Ctrl/Cmd+Shift+S` to
cycle the state and `Ctrl/Cmd+Shift+P` to cycle the priority (the same chords work across a whole
[selection](getting-around.md#selecting-many-points)). Press `Enter` on a task and the next point is a
task too, so running off a list is fast.

## Custom workflows

Define a workflow that matches the way you actually work: move articles through
`DRAFT → REVIEW → PUBLISHED`, support requests through `OPEN → IN PROGRESS → RESOLVED`, or any
process with distinct stages.

Give the workflow a name and its states. Type `{seq Flow: BACKLOG DOING | SHIPPED}` to declare one
inline, or use the `@` → **Sequence** dialog. States to the right of the `|` count as **done**, so they
feed the progress bar and the `is:done` filter automatically. Once declared, apply any state with `/`
(for example `/BACKLOG`), the same way you set `#TODO`.

Need a **blocked** stage? Add a second `|` for a held band, like `{seq Flow: DOING | BLOCKED | SHIPPED}`.
Points in that middle band read as waiting, not a live next-action, so they sort out of the agenda's
Actions row with a muted "Waiting" badge, the same way the built-in `WAITING` state does.

## Progress bars

Put a live progress bar on a project, a checklist, or any parent point and see how much is done at a
glance. As you check off the tasks underneath, the count updates automatically, with no manual
tracking.

```
[/]      a count, like 2/5
[%]      a percentage
```

(See also [Computing numbers](computing-numbers.md#progress-bars) for how progress bars compose
with the rest of the math.)

---

## Properties

Tag a point with structured facts (an owner, a status, a cost, a category) so you can filter and
total by them later. Each property is a **key and a value**, shown as a small pill below the point.

Open a point's menu and choose **Add property** to open the editor; type a key and a value, then
**Save**. Click any property pill to edit it again. Keyboard-first: type `/prop:owner=zeo` to set a
property inline with no dialog, or bare `/prop` to drop a fill-in-the-blank `{prop key: value}` stub
with the cursor waiting on the blank. Search by them with
[`has:key`](getting-around.md#searching-and-filtering) to find every point that has a property, or
`key:value` to match an exact one. Child properties feed the [roll-up
totals](computing-numbers.md#roll-a-number-up-your-outline-aggregation).

A **numeric** property is also a named variable you can compute with, not just a fact to filter on.
Give a point a `str: 14` property and a `{= str + 2}` pill on it reads 16, no declaration needed. And
properties inherit **down** the outline: a pill or a [check](computing-numbers.md#make-the-outline-check-itself-constraints)
on a child point can read a property set on any ancestor (a scene under a `budget: 12` project sees
`budget`). The nearest value wins, so the point's own property beats an ancestor's.

**Give a property an icon.** Open **File then Tag & property styling**, type a property key, and pick
an icon (a dollar sign for `cost`, a calendar for `due`). Every chip for that key then shows the icon
before its name, so a property is recognizable at a glance. To change or remove it, revisit the same
dialog. Like tag colors, it is purely visual and stored with the document; the property's text and
searchability are untouched.

## Templates

Stop rebuilding the same structure from scratch every time. Save a meeting-notes format, a weekly
review layout, a bug-report checklist, or any subtree you use repeatedly, then stamp a fresh copy in
one step.

Save a template from any point's menu, or keyboard-first with `/savetemplate:weekly review` to save
the current subtree under that name without leaving the keyboard. Then stamp one with
**`/template:name`** (inline, straight to that template) or **`/template`** on its own to pick from a
list.

## Capture and quick inbox

Jot down a task, an idea, or a quick note the moment it strikes, without leaving what you are doing or
hunting for the right spot.

It works with nothing set up: with no inbox chosen, captures land at the **top level** of the
document, ready to file later. Set up to **10 inboxes** (numbered 1 to 10) and capture into any of
them from anywhere; each entry lands as a new point at the bottom of that inbox. What you type is
markdown-aware, so a typed `- [ ]` becomes a to-do.

Capture is a **toolbar strip**, not a pop-up dialog. Press `Ctrl/Cmd+Shift+I` (or the toolbar
**inbox button**) to toggle it open below the toolbar with the cursor already in its input, while the
outline stays fully visible and usable underneath, so you insert without interrupting your work.
`Ctrl/Cmd+Shift+1` through `0` open it targeting **inbox 1 through 10**. If a numbered slot has no
inbox yet and a point is selected, that point **becomes** that inbox. While the strip is open the same
keys switch the destination (they move the selector, they do not reopen it). Click the **pencil** on the
destination to open the inbox manager, and click the destination **name** itself to zoom into that inbox
point. In the manager, each inbox chip works the same way: click its **number badge** to make it the
capture target, or click its **name** to zoom into that inbox's point (each inbox is a different place).
**Reorder** the inbox chips
to change which number each one answers to: drag a chip, or focus one and press `Alt+Left` / `Alt+Right`.
`Ctrl/Cmd+Alt+1` through `0` sets the current point as inbox 1 through 10; a point's menu adds or removes
an inbox slot too. The strip stays open after each capture with a running count, so you can empty your
head in one sitting. `Enter` captures; `Shift+Enter` adds a line break; `Esc` closes.

## Nicknames (aliases)

Make a point findable under different names, useful when a concept has a short form and a long form:
add `JS` as an alias for a `JavaScript` note, or `NYC` for `New York City`.

The `[[` link picker and the unlinked-references panel both recognize any alias, so links and
mentions find the right point regardless of which name you used. Type **`/alias:wyrm, drake`** to add
them inline (comma-separated), or **`/alias`** on its own for the dialog.

---

**Next:** the live pills, [Generating text](generating-text.md) and
[Computing numbers](computing-numbers.md), or jump to the [Cookbook](cookbook.md).

**Back to:** [the guide](README.md).
