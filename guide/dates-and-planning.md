# Dates and planning

*Part of the [Pointliner guide](README.md). Turn the document into a lightweight planner: schedule
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

See all your upcoming work without scrolling the document. Click the **calendar button** in the
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
up, the **timeline** is the history: every dated point laid out in one chronological list from the
earliest to the far future, grouped by month. It is the view for a long project or a big set of
notes, where you want to browse the arc ("the launch, the decision, the milestone, in the order they
landed") instead of searching for a date you only half-remember.

It draws from **three kinds of dated point**, so a whole day sits on one line:

- **Tasks**, anything with a start or due date, the same scheduled points the agenda plans.
- **Journal**, each daily entry from your [journal](#daily-journal), so what actually happened lands
  next to what was planned.
- **Lore**, any point carrying a `when` or `date` property, for world events that are not tasks: a
  founding, a battle, a comet. Add `when: 1247-03-02` (or `date:`) to a point and it takes its place
  in the chronicle.

Open it from the **hourglass button** in the toolbar. A row of **source toggles** (Tasks, Journal,
Lore) sits at the top; click one to show or hide that kind, so you can read the planned schedule alone,
the journal alone, or the whole braided history. Each entry shows its date and title, colored by
urgency (a past-due task reads red), with done points struck through and start-only points marked with
a small `▸`; journal and lore entries carry a small source tag. Click any entry to jump to that point;
press `Esc` to close. It opens scrolled near today, so a long history starts at "now" rather than at
year one.

From the keyboard the whole list is a single stop, however long it is. `Tab` lands you on the first
entry, then the arrow keys move between entries, `Home` and `End` jump to the very first and very
last, and `PageUp` / `PageDown` jump a whole **month** at a time, the same way they page a month in
the agenda calendar. `Enter` opens the entry you are on, and `Esc` closes.

When a [custom calendar](#custom-calendars) is active, the month headers and dates are that calendar's
own (Firstfrost, Longnight, the era year), so the history reads in its own time. This is distinct from
the agenda's own **Timeline** view, which is a Gantt of the near-term schedule; this one spans the
whole archive and reads as a chronicle.

## Daily journal

Keep a running log of what you worked on, decisions you made or anything worth noting each day.

Entries file themselves by date under a **Journal** point, nested year then month then day
(`2026 › 06 › 16`), so over time you build a tidy, searchable diary inside your document. The
toolbar book button toggles the **Journal bar**: type a point and press Enter to file it under
today's entry without leaving your place. The bar shows the date it is saving to; click the
year, month or day to jump to that part of the journal. Type **`/journal`** to open today's
entry directly.

(When a folder of documents is connected (a [folder](features.md#linking-and-connecting-documents)), the
journal can instead write one file per day on disk.)

## Roll log

Every generating pill normally keeps only its latest result: click a dice pill or an oracle again
and the previous answer is replaced. When you are playing a solo game or want a record of what
actually happened, that record is the whole point, so Pointliner can log every roll as it happens.

Turn it on with the **scroll button in the toolbar** (or the **File menu, Log rolls**). While it is on, **every** random or generated
result is also written to a **Rolls** log the instant you roll it, this covers all of the generating
pills at once: dice, generators and named tables, decks, chains, the yes/no oracle, roll on your
document, and estimates. Entries file themselves by date exactly like the journal (`2026 › 07 › 19`),
each line reading the time, what was rolled and the result:

```
14:32 · 2d6 → 9
14:33 · Ambush? (likely) → Yes, but
14:35 · loot → a silver ring
```

To keep the log in a particular place, open any point's bullet menu and choose **Log rolls here**;
that point becomes the home and logging turns on. The entries are ordinary points, so you can search,
export or annotate them. Logging is off by default and adds nothing until you switch it on.

## The chronicle: a dated log

The journal logs the **real** day, the day you actually wrote it. Sometimes you want a log dated on a
day you **choose** instead, where "now" is a day in a [custom calendar](#custom-calendars), not the day
it is. That is the **chronicle**: a journal twin whose date is a movable cursor, so you can log an entry
under any date, past or future.

Set it up in two steps: define a [custom calendar](#custom-calendars), then make the point that will
hold the log and choose **Set as chronicle** from its bullet menu (this is the same binding that keeps
that subtree on the custom calendar, see
[two calendars in one document](#two-calendars-in-one-document)). A **chronicle button** then appears
in the toolbar.

Open it and a bar appears like the journal's, with one difference: the date is a **cursor** you steer.
The **◂** and **▸** buttons step one day back or forward (honoring the calendar's own months and week),
and clicking the date jumps to a day you name. Type an entry and press Enter to file it under the
cursor's date, nested year then month then day in that calendar, the same tidy structure as the
journal. Chronicle entries show on the [timeline](#timeline) as their own **Chronicle** source, dated
in the custom calendar and toggleable on their own, so the real-day notes and the chosen-day entries
sit side by side without ever being confused for each other.

---

## Custom calendars

Give a document its own calendar instead of the real one, a fictional world's or any alternate
scheme: your months, your week, your era. Open **File then Custom calendar** and type the calendar as
text:

- **Months**, one per line, name and day count: `Firstfrost: 30`. Multi-word names work
  (`The Fading: 28`).
- **Week**: day names (`Moonday Tilday Windday...`), a bare length like `10`, or `10: Sul Mol` to
  name just the first days. Blank keeps a 7-day week.
- **Era**, optional: `AE: 1200` makes year 4 display as `1204 AE`.
- **Today in this world**: the calendar's current date, like `1204-04-12`. An alternate calendar has
  no wall clock, so this is the day your dates, urgency colors, and agenda count from.

Two example chips fill the fields with a complete working calendar to edit; the live preview under
each field checks your lines as you type and shows what "today" resolves to before you commit.

Once active, the document speaks that calendar: due and start dates read and write the calendar's own
year-month-day (`due: 1204-04-12`), the agenda's month and week views take its shape (a 10-day week
really shows ten columns), the date picker in the Schedule dialog renders its months, and date math
like `{= daysuntil(due)}` counts its days. Relative dates (`today+3`, `tomorrow`) mean days in that calendar.
(Your [journal](#daily-journal) is the one part that stays on the real calendar, so it keeps tracking
actual days; see [two calendars in one document](#two-calendars-in-one-document) below.)

**Let time pass** from the agenda: with a calendar active, a **Today** chip shows the calendar's current
date; click it to advance the clock (+1 day, +3 days, +1 week) or set an exact date. Advancing never
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

For a worked example on a fictional calendar with an importable demo, see
[the campaign calendar](solo-rpg/campaign-calendar/campaign-calendar.md) in the solo-RPG guides.

### Two calendars in one document

You may want **both** clocks at once: real dates for the journal and your actual scheduling,
custom-calendar dates for a chronicle. A calendar is decided by **where a point lives**, not by
the date you type, so the two coexist without ever tagging a value:

- Your **journal** always reads the **real (Gregorian) calendar**, even in a document that runs on a
  custom one. What you did on a given day is a real-world fact.
- A **chronicle** reads a custom calendar you set on it. Make a point the home of the log, open its
  bullet menu and choose **Set as chronicle** (it needs a custom calendar defined first). Every date
  inside that point's subtree then reads the custom calendar's own year, month and day, while the rest
  of the document stays on the regular calendar. Unset it from the same menu.

Because the calendar follows the subtree, nothing you already typed changes: a `due` inside the
chronicle is read in the custom calendar, the same string elsewhere is read normally, and the
[timeline](#timeline) lays each row out under its own calendar (custom months and real months on
separate axes, never merged).

---

## Doing math with dates

Dates are not just labels, they are numbers you can compute with. `{= daysuntil(due)}` counts down to
a deadline, `{= asdate(today + 90)}` shows a date 90 days out, and a `due` property rolls up like any
other. That side lives in [Computing numbers](computing-numbers.md#dates).

---

**Next:** [Getting around](getting-around.md), [Tasks and organizing](tasks-and-organizing.md), or
the live pills in [Computing numbers](computing-numbers.md).

**Back to:** [the guide](README.md).
