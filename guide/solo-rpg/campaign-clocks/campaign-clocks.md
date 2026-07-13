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
a **progress cookie** for the clock, a **due date** for the thread and a **saved search**
for the board that holds them all. Nothing here is a new notation. It is the same `{…}` and
`[…]` you already type, pointed at pressure instead of prose.

---

## The clock: a progress cookie over segments

Pointliner has a built-in tally called a **progress cookie**. You write it as `[/]` (a
fraction) or `[%]` (a percent) inside a point's text, and it counts the checkbox tasks under
that point, filling as you check them. It was built for checklists. A Blades-in-the-Dark-style
clock is exactly that, a checklist you read as a gauge, so the cookie *is* a clock with no
extra machinery.

Make the clock a single point whose text ends in the cookie, then list the segments as
checkbox children:

```
The Ashguild moves against you [/]
  - [ ] a paid informant marks your safehouse
  - [ ] the guild posts watchers on your street
  - [ ] a bravo shadows you across the market
  - [ ] your fence stops answering the door
  - [ ] they name the price on your head
  - [ ] the raid comes at dawn
```

The `[/]` beside the title reads `[0/6]`, then `[1/6]`, then `[2/6]` as you tick boxes. It
counts the children for you, so a six-segment clock has six boxes and you never do the
arithmetic. When the last box goes `- [x]`, the cookie shows `[6/6]` and the fiction it
promised happens.

Two ways to write the cookie, and it is worth knowing which you have:

- `[/]` **auto-counts.** It always reports the real state of the boxes below it. Use this for
  a live clock you actually tick.
- `[3/6]` is a **manual fraction.** Handy when you want to seed a clock that is already
  partway filled (the flood in the demo starts at `[3/6]`) or when the segments live somewhere
  the cookie cannot reach. Once boxes are present, the auto form is less bookkeeping.

`[%]` works the same way and renders a percent instead, which reads nicely for a "how much of
this holds" gauge, like the cover-story clock in the demo. Same boxes, different face.

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
progress cookie inside it tracks how close you are to an answer. The granary thread in the demo
does exactly that, a due date on the question and a `[1/4]` clock nested under it. The date tells
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
in the search bar, one embedded in the outline. Use whichever fits how you play.

---

## Run it yourself

Open the [demo file](campaign-clocks-demo.opml) and it drops you into a small campaign already
under pressure: three clocks partway filled, three threads with dates set and a board that
lists them.

- **Tick a clock.** Click the bullet of "The Ashguild moves against you" to open it, then check
  one of the empty segment boxes. Watch the `[/]` cookie beside the title climb on its own. Fill
  the last box and read what a full clock is supposed to trigger. This is the core loop: a clock
  is just a checklist you have agreed to treat as a countdown.
- **Watch a thread come due.** Open the agenda (the toolbar calendar button) and you will see the
  dated threads sorted by urgency. The `today+3` one sits near the top; the fixed-date comet waits
  under Later. Editing a thread's `{date due: …}` moves it in the agenda live.
- **Pull the board.** Search `#thread` to list every thread at once, then star the search to keep
  the chip. Click any result to jump straight to that thread and advance its clock. The embedded
  `{query: #thread}` pill in the demo shows the same list without leaving the page.

To build your own from scratch: make a point for a danger, put `[/]` at the end of its text and
add a few `- [ ]` segment lines under it. Make a point for an open question, tag it `#thread` and
give it a `{date due: today+3}`. Search `#thread`, star it, and you have a campaign board. That is
the whole system.

---

## Why do it this way

You could track all of this on paper, and plenty of people do. The trade Pointliner offers is that
the clocks and threads **do their own bookkeeping**:

- the cookie counts its own segments, so a clock is never one box out of sync with its number
- a due date puts a thread into the agenda and colors it by urgency, so time pressure is visible
  instead of remembered
- one saved search assembles the whole pressure board on demand, and the query pill keeps a copy
  of it live inside the document
- none of it is new syntax to learn, a clock is a progress cookie, a thread is a dated point, and
  the board is a search you already know how to write

If your campaign never grows past a couple of threads, a sticky note is genuinely fine. When the
pressure stacks up, the fewer things you have to hold in your head, the better, and this is a
comfortable place to put them.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
