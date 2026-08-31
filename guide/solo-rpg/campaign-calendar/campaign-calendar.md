# The campaign calendar in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [campaign-calendar-demo.opml](campaign-calendar-demo.opml) (open it in Pointliner via File, Open)

The [campaign clocks](../campaign-clocks/campaign-clocks.md) guide showed threads that tick on a
date, with one honest workaround baked in: the dates were real-world dates standing in for
fiction time, `today+3` meaning "three days in the world" while your laptop's clock did the
counting. That proxy works, but it means your campaign's deadlines live on Earth.

A **custom calendar** removes the proxy. You give the document your world's months, week, and
era, and every date in it changes citizenship: due dates are written and read in the world's own
year-month-day, the agenda's month grid takes the world's shape (a ten-day week really shows ten
columns), and the journal files its entries under the world's date. Time stops passing because
Tuesday happened; it passes because you say it does.

---

## Set the calendar

Open **File, then Custom calendar** and type the calendar as text:

```
Calendar name:             Calendar of the Vale
Months, one per line:      Firstfrost: 30
                           Deepwinter: 30
                           …
Week:                      Moonday Tilday Windday Seaday Hearthday Forgeday Restday
Era, optional:             AE: 1200
Today in this world:       1204-04-12
```

**Calendar name**, **Months** and **Today in this world** are required; the dialog keeps its Save
button disabled until all three are filled, so a blank name is the usual reason it will not let you
through. The week and the era are optional.

- **Months** are a name and a day count per line. Multi-word names work (`The Fading: 28`).
- The **week** can be day names, a bare length like `10`, or `10: Sul Mol` to name only the
  first days.
- The **era** is a display offset: with `AE: 1200`, the world's year 4 is written `1204 AE`.
- **Today in this world** is the current in-world date, the day every urgency color counts
  from. A fictional world has no wall clock, so you own this field; the whole point of the
  feature is moving it.

The two example chips fill the form with a complete working calendar to edit, and the preview
under each field checks your lines as you type. When the "Today in this calendar" line at the
bottom reads back the date you meant, you have it right.

## Entering a published setting's calendar

The dialog ships no famous calendars, and that is deliberate: setting calendars belong to their
publishers, so Pointliner gives you the two-minute path instead of the copy. Keep the setting's
wiki open (for the Forgotten Realms, the [Calendar of Harptos](https://forgottenrealms.fandom.com/wiki/Calendar_of_Harptos)
page has everything) and type what you see: twelve month lines, the week (Faerûn's tenday is
just `10`), and the era (`DR: 0` reads Dale Reckoning year numbers as written). Set today to
wherever your campaign stands, `1492-01-15` for mid-Hammer of the Year of Three Ships Sailing.

One honest caveat: calendars with **festival days that sit outside any month** (Harptos'
Midwinter, Greengrass, and friends) cannot be represented exactly yet, and neither can leap
days like Shieldmeet. The standard workaround is folding each festival into the month before it
as an extra day, so Hammer becomes `Hammer: 31` with Midwinter as its 31st. Your dates stay one
day of drift from the printed calendar at most, and the campaign never notices.

## The loop at the table

The demo drops you into a caravan campaign mid-journey. The loop:

1. **Play.** Threads carry due dates in world time (`due: 1204-04-15`), so the agenda's colors
   mean "the world's deadline is close," not "it is nearly Friday."
2. **Time passes.** Open the agenda (the toolbar calendar button). With a calendar active, a
   **Today chip** shows the in-world date; click it and let time pass: +1 day, +3 days, +1 week,
   or set an exact date. Watch the threads shift color as their deadlines approach.
3. **Journal the day.** Type `/journal` and the entry is filed under the world's date
   (`Journal > 1204 > 04 > 12`), so the campaign log accumulates in campaign time. At the end of a
   campaign this tree *is* the chronicle. (The toolbar journal button opens the journal strip
   instead; `/journal` is the door that files the entry.)

One wrinkle worth knowing, because it looks like a contradiction until you see the split. The
journal's **entry tree** is named in world dates, as above. The **date properties** you write
inside that subtree are read on the real calendar, because `calendarForNode` pins the journal
subtree to Gregorian so a real-world reminder still means a real-world day. So a campaign journal
files itself in world time while a `due:` inside it stays a date you will actually live through.
If you want a log where everything, dates included, reads in world time, make its home point and
choose **Set as chronicle** from its bullet menu.

One small touch worth stealing from the demo:

- A point reading `It is {= asdate(today)}.` renders the current in-world date and follows the
  clock as you advance it: a campaign header that is never stale, made of one math pill.
And one worth adding yourself, which the demo does not carry: keep real-world bookkeeping out of
world time by using things the calendar never touches. Tag session entries `#session-12`, or give
them a free property like `played: 2026-07-12`. A free property is just text, so it never collides
with the world's dates. One document, one reality; the fiction owns `due`, you own the margins.

## Moving an existing campaign onto a calendar

If you followed the clocks guide, your campaign document already has real-date threads. Before
switching, search **`due:>today-1`** and note the handful of threads that are actually live. The
`-1` matters: `due:>today` is strict and would drop anything due *today*, which is exactly the
thread most likely to still be live. The
dead dates are history and can stay as text. Then set the calendar: the dialog checks every
stored date first and tells you plainly how many would read differently and how many would
become unreadable. Nothing is rewritten, ever; your text stays exactly as typed, undo reverses
the whole switch, and any date the new calendar cannot read stays visible on its point with a
warning tint until you re-date it. Re-enter the live threads in world time (a campaign rarely
has more than a dozen), and you are across.

---

## Run it yourself

Open the [demo file](campaign-calendar-demo.opml):

- **Read the header.** The `It is …` line is the living today pill; the date it shows comes
  from the calendar's clock, not your computer.
- **Advance the clock.** Open the agenda, click the Today chip, choose +3 days. The header
  pill updates, the drovers' payday goes overdue and turns red, and the ford toll thread moves
  up the list. That is the whole heartbeat.
- **Draw a road event.** The travel deck is a `{shuffle: …}` pill; click it to draw the day's
  event without repeats.
- **Journal the day.** Type `/journal` and the entry lands under the world's date. Then advance
  the clock again and journal again; the chronicle grows in world time.
- **Open File, Custom calendar** to see how the world is defined, and edit it live; the dialog
  warns you if a change would re-read your dates.

---

## Why do it this way

The proxy method (real dates as fiction days) already worked, so the calendar has to earn its
keep, and it does, three ways:

- **the dates say what you mean**: `due: 1204-04-15` in the world's own reckoning, not a
  laptop date you must mentally translate at the table
- **time is yours**: the campaign advances when the story does, three days in one evening or
  nothing for a month of Tuesdays, and every urgency color follows the story's clock
- **the chronicle assembles itself**: a journal keyed by world dates is the campaign document
  every play-report writer wishes they had kept from session one

If your game lives comfortably on real dates, keep them; the proxy is honest and simpler. The
calendar is for when the world's time *is* part of the fiction, and then it is the difference
between tracking a campaign and inhabiting one.

---

## Credit

The **Calendar of Harptos** is used above as one worked example of a real published calendar,
because it is the one most readers will already know. It belongs to the **Forgotten Realms**
setting, a trademark of **Wizards of the Coast**; this guide names its months and festivals only to
show what you would type into the dialog, reproduces none of its text, and is neither affiliated
with nor endorsed by them. Any calendar you invent works exactly the same way.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
