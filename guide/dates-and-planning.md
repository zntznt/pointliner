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
toolbar to open the agenda below the breadcrumb (click it again to close).

A compact **List** is always shown, ordered by urgency (most overdue and soonest-due first, with
done items sunk to the end) so nothing gets lost. Beside it, a single **view switcher** opens one
deeper view at a time below the List (click the active one again to return to just the List):

- **Week** , a 7-day planner spread; overdue items are gathered in a leading **Earlier** column.
- **Month** , a full month calendar. Hover a day (or, on touch, look for the corner **+**) to add a new point due that day: it lands in your inbox and zooms in so you can title it right away.
- **Timeline** , a Gantt-style view of overlapping tasks. A Titles chip cycles the name-column width (narrow, default, wide); on desktop you can also drag the dotted separator.

In **Week** and **Month**, every day box is the same size. Each shows how many items it holds (**x to
do, y done**) and lists the active ones first; when a day has more than fit, click its **more** to
expand that day in place and see them all. On a wide screen the **Month** view also shows the
previous and next months peeking in at the sides (the same size as the centred one); click either to
jump to it. The **‹‹** and **››** buttons jump a whole month (Week) or year (Month).

Turn on **Done** to include completed points; toggle **Running** to show or hide started work; turn
on **Overdue** to focus every view on just the late items. Below the dated rows, an **Actions** row
gathers your undated next-actions (any `#NEXT` or `#TODO` point with no date), so the work you have
not scheduled yet still has a home; the same list is a search away with `state:next` or `is:todo`.
Click any item to jump straight to it.

Pointliner has no background reminders or notifications: it runs entirely offline with no server, so
the agenda is where you come to check what is due, rather than something that pings you. A completed
dated point stays where it is, and tasks do not repeat on their own yet, so a recurring task is one
you re-date by hand.

## Daily journal

Keep a running log of what you worked on, decisions you made, or anything worth noting each day.

Entries file themselves by date under a **Journal** point, nested year then month then day
(`2026 › 06 › 16`), so over time you build a tidy, searchable diary inside your outline. The
toolbar book button toggles the **Journal bar**: type a point and press Enter to file it under
today's entry without leaving your place. The bar shows the date it is saving to; click the
year, month, or day to jump to that part of the journal. Type **`/journal`** to open today's
entry directly.

(When a folder of documents is connected (a [folder](features.md#linking-and-connecting-notes)), the
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
