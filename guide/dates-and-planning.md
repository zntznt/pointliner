# Dates and planning

*Part of the [Pointliner guide](README.md). Turn the outline into a lightweight planner: schedule
points with start and due dates, see them on an agenda and calendar, and keep a daily journal. This
is the scheduling side; for date arithmetic (`{= daysuntil(due)}` and friends) see
[Computing numbers](computing-numbers.md#dates).*

---

## Scheduling dates

Track when things need to happen: set a deadline on a deliverable, a start date on a project phase,
or both on a running task.

Once a point has a date it shows up in the [agenda](#agenda-and-calendar), turns red when overdue,
and you can [filter to it in search](getting-around.md#searching-and-filtering) (`due:today`,
`due:overdue`).

Set a date two ways:

- **Inline, without leaving the keyboard:** `/due:tomorrow` or `/start:2026-07-01`.
- **With the date picker:** `/due` on its own opens it.

Dates can be exact (`2026-07-01`) or relative (`today`, `tomorrow`, `today+7`).

## Agenda and calendar

See all your upcoming work without scrolling the outline. Click the **calendar button** in the
toolbar to open the agenda below the breadcrumb (click it again to close). It shows three things:

- A **list** of what is due soon.
- A **Gantt-style timeline** of overlapping tasks.
- A **month calendar**.

Timeline and Calendar are independent toggles, so open either, both, or neither. Turn on **Done** to
include completed points; toggle **Running** to show or hide started work. Useful for weekly
planning, spotting overdue items at a glance, or checking whether a date is already full. Click any
item to jump straight to it.

## Daily journal

Keep a running log of what you worked on, decisions you made, or anything worth noting each day.

Entries file themselves by date under a **Journal** point, nested year then month then day
(`2026 › 06 › 16`), so over time you build a tidy, searchable diary inside your outline. Type
**`/journal`**, or click the calendar button, to open or create today's entry.

(When a folder of notes is connected as a [workspace](features.md#linking-and-connecting-notes), the
journal can instead write one file per day on disk.)

---

## Doing math with dates

Dates are not just labels, they are numbers you can compute with. `{= daysuntil(due)}` counts down to
a deadline, `{= asdate(today + 90)}` shows a date 90 days out, and a `due` property rolls up like any
other. That side lives in [Computing numbers](computing-numbers.md#dates).

---

**Next:** [Getting around](getting-around.md), [Tasks and organizing](tasks-and-organizing.md), or
the live pills in [Computing numbers](computing-numbers.md).

**Back to:** [the guide](README.md).
