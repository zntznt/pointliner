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
the status or set a **priority** (`A`, `B`, or `C`). Press `Enter` on a task and the next point is a
task too, so running off a list is fast.

## Custom workflows

Define a workflow that matches the way you actually work: move articles through
`DRAFT → REVIEW → PUBLISHED`, support requests through `OPEN → IN PROGRESS → RESOLVED`, or any
process with distinct stages.

Give the workflow a name and its states. Type `{seq Flow: BACKLOG DOING | SHIPPED}` to declare one
inline, or use the `@` → **Sequence** dialog. States to the right of the `|` count as **done**, so they
feed the progress bar and the `is:done` filter automatically. Once declared, apply any state with `/`
(for example `/BACKLOG`), the same way you set `#TODO`.

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
**Save**. Click any property pill to edit it again. Search by them with
[`has:key`](getting-around.md#searching-and-filtering) to find every point that has a property, or
`key:value` to match an exact one. Child properties feed the [roll-up
totals](computing-numbers.md#roll-a-number-up-your-outline-aggregation).

## Templates

Stop rebuilding the same structure from scratch every time. Save a meeting-notes format, a weekly
review layout, a bug-report checklist, or any subtree you use repeatedly, then stamp a fresh copy in
one step.

Save a template from any point's menu, then stamp one with **`/template:name`** (inline, straight to
that template) or **`/template`** on its own to pick from a list.

## Capture and quick inbox

Jot down a task, an idea, or a quick note the moment it strikes, without leaving what you are doing or
hunting for the right spot.

Pick any point as your **inbox**, then capture into it from anywhere; each entry lands as a new point
at the bottom of that inbox. What you type is markdown-aware, so a typed `- [ ]` becomes a to-do.

Click the **inbox button** in the toolbar (or press `Ctrl/Cmd+Shift+I`) to open the Capture dialog,
or set the destination from a point's menu with **Set as inbox**. The dialog stays open after each capture with a running count, so
you can empty your head in one sitting. `Enter` captures; `Shift+Enter` adds a line break.

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
