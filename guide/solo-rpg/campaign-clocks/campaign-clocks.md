# Campaign clocks and threads in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [campaign-clocks-demo.opml](campaign-clocks-demo.opml) (open it in Pointliner via File, Open)

A session log tells you what already happened. A **campaign** needs the other half: what is
building up, what is coming due, what will pay off if you do nothing. That is the pressure
and planning layer, and it is where two very old solo-play tools earn their keep, the
**clock** and the **thread**.

A clock is a generic mechanic: a little gauge you fill segment by segment, and when it fills,
something happens. A faction's plan advances. A danger closes in. A slow project finishes.
Clocks are system-agnostic and belong to no one game, so this guide uses them as the plain
tool they are, no setting text borrowed. A thread is just an open question you have promised
yourself to return to.

This guide shows how to run both inside Pointliner using pieces the outliner already has:
a **segmented clock** for the pressure, a **due date** for the thread and a **saved search**
for the board that holds them all. Nothing here is a new notation. It is the same `{…}` and
`[…]` you already type, pointed at pressure instead of prose.

---

## The clock: a segmented ring you fill

Pointliner has a built-in **clock** made for exactly this. You write it as `[o N/M]` inside a
point's text (the letter `o`, a space, then how many of how many segments are filled), and it
renders as a little quarter-fill ring gauge, `[o 3/6]` showing a three-quarters-ish `◑`. It is
the Blades-in-the-Dark / Ironsworn tension clock as a native piece, no extra machinery.

There are two ways to drive it, and it is worth knowing which you want:

- **Click to fill (`[o 0/6]`).** A manual clock. Write it at the fill you want, then **click the
  ring to advance one segment** and **Shift-click to step it back**. This is the quickest clock:
  one point, one gauge you tick as the fiction moves.

```
The Ashguild moves against you [o 0/6]
```

- **Count named segments (`[o /6]`).** Leave the count **empty** and the clock **fills from its
  sub-points** instead, so each segment can be a named line you check off. Same face, but now you
  see what each tick *means*:

```
The Ashguild moves against you [o /6]
  - [ ] a paid informant marks your safehouse
  - [ ] the guild posts watchers on your street
  - [ ] a bravo shadows you across the market
  - [ ] your fence stops answering the door
  - [ ] they name the price on your head
  - [ ] the raid comes at dawn
```

The ring beside the title reads `[o 0/6]`, then climbs as you tick boxes, and when the last box
goes `- [x]` it fills to `●` and the fiction it promised happens. Six segments, six boxes, no
arithmetic.

Seed a clock partway just by writing the number: `[o 3/6]` starts three segments in (the flood in
the demo begins there). The count must be `N/M` with the `o` prefix, `[o 3/6]`, not a bare
`[3/6]` (a bare bracket-fraction is plain text). If you prefer a percent face for a "how much of
this still holds" gauge, the `[/]` and `[%]` **progress cookies** count the same checkbox children
and render a fraction or a percent instead of a ring, `[%]` reading nicely for the cover-story
clock in the demo. Same boxes, a different face.

---

## The thread: a due date that ticks

A clock fills when *you* act on it. A **thread** ticks with *time*. It is an open question you
want the campaign to bring back to your attention on a certain day, and Pointliner handles
that with a **date on the point**.

Type `{date due: today+3}` anywhere in a thread's text. It promotes to a due-date chip and,
more usefully, the point now shows up in the **agenda** (the toolbar calendar button), colored
by how close the day is. The campaign starts nudging you.

```
Who set the fire at the granary? #thread {date due: today+3}
The debt to the moneylender comes due #thread {date due: today+7}
The comet the star-priests fear #thread {date due: 2026-12-21}
```

The value is flexible: `today`, `tomorrow`, `today+3`, `today+7` or a fixed calendar date
like `2026-12-21`. A relative date is perfect for "check back in a few sessions," a fixed date
for a thread that lands on a specific in-world occasion.

(These are real-world dates standing in for fiction time, and that proxy is fine for most
campaigns. If you want the world to run on its **own** calendar, with threads due in its months
and a clock you advance when the story moves, see [the campaign calendar](../campaign-calendar/campaign-calendar.md).)

A thread is often a clock *and* a date together: the open question carries the deadline, and a
clock inside it tracks how close you are to an answer. The granary thread in the demo
does exactly that, a due date on the question and an `[o /4]` clock nested under it. The date tells
you *when it matters*; the clock tells you *how far along you are*.

Notice the `#thread` tag on each one. That is not decoration, it is the hook for the board.

---

## The board: one search for every open thread

The point of tagging every thread `#thread` is that you can pull them all up at once. Type
`#thread` into the search box and Pointliner lists every thread point in the document, wherever
it lives. That is your pressure board, assembled on demand.

Then **star that search to save it.** The saved search becomes a one-click chip you can re-run
at the top of every session, so "show me everything on the clock" is a click, not a retype.
Narrow it when you want to: `#thread due:week` shows only the threads coming due in the next
seven days, which is often the only list that matters at the table.

If you would rather keep the board *in* the document, drop a live query pill into a point:

```
{query: #thread}
```

That renders an always-current list of matching threads right where you put it, and it updates
as you play, so a "campaign status" point at the top of your file can hold the whole board and
never go stale. The saved search and the query pill are the same search wearing two faces, one
in the search bar, one embedded in the document. Use whichever fits how you play.

---

## Run it yourself

Open the [demo file](campaign-clocks-demo.opml) and it drops you into a small campaign already
under pressure: three clocks partway filled, three threads with dates set and a board that
lists them.

- **Tick a clock.** Its segments are already visible, so just check
  one of the empty segment boxes. Watch the `[o /6]` ring beside the title climb on its own. Fill
  the last box and read what a full clock is supposed to trigger. This is the core loop: a clock
  is just a checklist you have agreed to treat as a countdown.
- **Watch a thread come due.** Open the agenda (the toolbar calendar button) and you will see the
  dated threads sorted by urgency. The `today+3` one sits near the top; the fixed-date comet waits
  under Later. Editing a thread's `{date due: …}` moves it in the agenda live.
- **Pull the board.** Search `#thread` to list every thread at once, then star the search to keep
  the chip. Click any result to jump straight to that thread and advance its clock. The embedded
  `{query: #thread}` pill in the demo shows the same list without leaving the page.

To build your own from scratch: make a point for a danger, put `[o /6]` at the end of its text and
add a few `- [ ]` segment lines under it. Make a point for an open question, tag it `#thread` and
give it a `{date due: today+3}`. Search `#thread`, star it, and you have a campaign board. That is
the whole system.

---

## Why do it this way

You could track all of this on paper, and plenty of people do. The trade Pointliner offers is that
the clocks and threads **do their own bookkeeping**:

- the clock counts its own segments, so a clock is never one box out of sync with its number
- a due date puts a thread into the agenda and colors it by urgency, so time pressure is visible
  instead of remembered
- one saved search assembles the whole pressure board on demand, and the query pill keeps a copy
  of it live inside the document
- none of it is new syntax to learn, a clock is the built-in `[o N/M]` ring, a thread is a dated point, and
  the board is a search you already know how to write

If your campaign never grows past a couple of threads, a sticky note is genuinely fine. When the
pressure stacks up, the fewer things you have to hold in your head, the better, and this is a
comfortable place to put them.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
