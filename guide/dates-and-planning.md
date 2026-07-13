# Dates and planning

*Part of the [Pointliner guide](README.md). Turn the outline into a lightweight planner: schedule
points with start and due dates, see them on an agenda and calendar, and keep a daily journal. This
is the scheduling side; for date arithmetic (`{= daysuntil(due)}` and friends) see
[Computing numbers](computing-numbers.md#dates).*

---

## Scheduling dates

Track when things need to happen: set a deadline on a deliverable, a start date on a project phase
or both on a running task.

Once a point has a date it shows up in the [agenda](#agenda-and-calendar), turns red when overdue,
and you can [filter to it in search](getting-around.md#searching-and-filtering) (`due:today`,
`due:overdue`).

Set a date two ways:

- **Inline, without leaving the keyboard:** `/due:tomorrow` or `/start:2026-07-01`.
- **With the date picker:** `/due` on its own opens it.

Dates can be exact (`2026-07-01`) or relative (`today`, `tomorrow`, `today+7`).

### Recurring tasks

A task that comes back on a schedule (a weekly review, monthly rent) does not need a fresh copy
each time. Open the **Schedule dialog** (`/due`) and fill the **Repeat** field with a short phrase:

- **Intervals:** `every day`, `every 3 days`, `every week`, `every 2 weeks`, `every month`,
  `every year` (or the shorthands `daily` / `weekly` / `monthly` / `yearly`).
- **A weekday:** `every Monday`, or a few at once, `every Tue,Fri`.
- **A day of the month:** `monthly on the 1st`, `every month on the 15th`.

When you complete the task, its date rolls forward to the next occurrence and the task re-opens, so
the same point keeps recurring. The cadence is anchored to the due date, not to when you check it
off, so finishing a day late does not drift the schedule. A completion always announces where it
landed ("Rescheduled to ...").

## Agenda and calendar

See all your upcoming work without scrolling the outline. Click the **calendar button** in the
toolbar to open the agenda below the breadcrumb (click it again to close).

A compact **List** is always shown, ordered by urgency (most overdue and soonest-due first, with
done items sunk to the end) so nothing gets lost. Beside it, a single **view switcher** opens one
deeper view at a time below the List (click the active one again to return to just the List):

- **Week** , a seven-day planner spread; overdue items are gathered in a leading **Earlier** column.
- **Month** , a full month calendar. Hover a day (or, on touch, look for the corner **+**) to schedule a new point for that day: it opens the capture bar with the due date preloaded (a **due …** chip you can dismiss), so you type the point, pick or confirm the inbox it lands in, and press Capture without leaving the calendar.
- **Timeline** , a Gantt-style view of overlapping tasks. A Titles chip cycles the name-column width (narrow, default, wide); on desktop you can also drag the dotted separator.

In **Week** and **Month**, every day box is the same size. Each shows how many items it holds (**x to
do, y done**) and lists the active ones first; when a day has more than fit, click its **more** to
expand that day in place and see them all. On a wide screen the **Month** view also shows the
previous and next months peeking in at the sides (the same size as the centered one); click either to
jump to it. The **‹‹** and **››** buttons jump a whole month (Week) or year (Month).

Turn on **Done** to include completed points; toggle **Running** to show or hide started work; turn
on **Overdue** to focus every view on just the late items. Below the dated rows, an **Actions** row
gathers your undated next-actions (any `#NEXT` or `#TODO` point with no date), so the work you have
not scheduled yet still has a home; the same list is a search away with `state:next` or `is:todo`.
Click any item to jump straight to it.

Pointliner has no background reminders or notifications: it runs entirely offline with no server, so
the agenda is where you come to check what is due, rather than something that pings you. A one-off
dated point stays where it is once done; a [recurring task](#recurring-tasks) rolls its date forward
and re-opens when you complete it.

## Timeline

See the whole story of your document in time order. Where the agenda is a planner for what is coming
up, the **timeline** is the history: every point with a start or due date, laid out in one
chronological list from the earliest to the far future, grouped by month. It is the view for a long
campaign or a big set of notes, where you want to browse the arc ("the war, the treaty, the comet, in
the order they landed") instead of searching for a date you only half-remember.

Open it from the **hourglass button** in the toolbar. Each entry shows its date and title, colored by
urgency (a past-due date reads red), with done points struck through and start-only points marked with
a small `▸`. Click any entry to jump to that point; press `Esc` to close. It opens scrolled near
today, so a long history starts at "now" rather than at year one.

When a [custom calendar](#custom-calendars) is active, the month headers and dates are your world's
own (Firstfrost, Longnight, the era year), so a campaign reads in campaign time. This is distinct from
the agenda's own **Timeline** view, which is a Gantt of the near-term schedule; this one spans the
whole archive and reads as a chronicle.

## Daily journal

Keep a running log of what you worked on, decisions you made or anything worth noting each day.

Entries file themselves by date under a **Journal** point, nested year then month then day
(`2026 › 06 › 16`), so over time you build a tidy, searchable diary inside your outline. The
toolbar book button toggles the **Journal bar**: type a point and press Enter to file it under
today's entry without leaving your place. The bar shows the date it is saving to; click the
year, month or day to jump to that part of the journal. Type **`/journal`** to open today's
entry directly.

(When a folder of documents is connected (a [folder](features.md#linking-and-connecting-documents)), the
journal can instead write one file per day on disk.)

---

## Custom calendars

Run a campaign or write a world on its own calendar instead of the real one: your months, your week,
your era. Open **File then Custom calendar** and type the calendar as text:

- **Months**, one per line, name and day count: `Firstfrost: 30`. Multi-word names work
  (`The Fading: 28`).
- **Week**: day names (`Moonday Tilday Windday...`), a bare length like `10`, or `10: Sul Mol` to
  name just the first days. Blank keeps a 7-day week.
- **Era**, optional: `AE: 1200` makes year 4 display as `1204 AE`.
- **Today in this world**: the current in-world date, like `1204-04-12`. A fictional world has no
  wall clock, so this is the day your dates, urgency colors, and agenda count from.

Two example chips fill the fields with a complete working calendar to edit; the live preview under
each field checks your lines as you type and shows what "today" resolves to before you commit.

Once active, the whole document speaks that calendar: due and start dates read and write the
calendar's own year-month-day (`due: 1204-04-12`), the agenda's month and week views take its shape
(a 10-day week really shows ten columns), the date picker in the Schedule dialog renders its months,
date math like `{= daysuntil(due)}` counts its days, and the [journal](#daily-journal) files entries
under the in-world date, so a campaign log accumulates in campaign time. Relative dates (`today+3`,
`tomorrow`) mean in-world days.

**Let time pass** from the agenda: with a calendar active, a **Today** chip shows the in-world date;
click it to advance the clock (+1 day, +3 days, +1 week) or set an exact date. Advancing never
touches your points, it just moves "now", and every date label follows.

**Changing or removing a calendar re-reads every stored date.** Dates are saved as the text you
typed, so a date written under one calendar can mean a different day (or nothing) under another. The
dialog checks first and tells you how many dates would read differently or become unreadable; your
text is never modified, undo reverses the switch, and an unreadable date stays visible on its point
with a warning tint until you re-date it.

To use a published setting's calendar (Harptos, Golarion, and friends), keep its wiki open and type
the month list in; it takes about two minutes. One honest caveat: calendars with leap days or
festival days that sit outside any month (Harptos' Midwinter, for example) can't be represented
exactly yet; the usual workaround is folding each festival into the preceding month as an extra day.

For a worked campaign example with an importable demo, see
[the campaign calendar](solo-rpg/campaign-calendar/campaign-calendar.md) in the solo-RPG guides.

---

## Doing math with dates

Dates are not just labels, they are numbers you can compute with. `{= daysuntil(due)}` counts down to
a deadline, `{= asdate(today + 90)}` shows a date 90 days out, and a `due` property rolls up like any
other. That side lives in [Computing numbers](computing-numbers.md#dates).

---

**Next:** [Getting around](getting-around.md), [Tasks and organizing](tasks-and-organizing.md), or
the live pills in [Computing numbers](computing-numbers.md).

**Back to:** [the guide](README.md).
