# A Lonelog-style session log in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [lonelog-demo.opml](lonelog-demo.opml) (open it in Pointliner via File, Open)

Lonelog is a notation for solo-RPG session logging created by **Roberto Bisceglie**. Its aim
is to capture the rhythm of solo play, the back-and-forth of *I do a thing, I ask the oracle,
the dice answer, the fiction follows*, in a compact, system-agnostic, plain-text form that
works as well in a paper notebook as on a screen.

This guide is **not** the Lonelog specification, and it does not reproduce it. It shows how to
take the *idea* behind Lonelog, keeping mechanics and fiction cleanly separated in one running
log, and run it inside Pointliner, where the dice are live and the log is a document you can
link, tag and search later. For the real notation, its full rules and the people behind it,
go to the source:

- Lonelog by Roberto Bisceglie / Loreseed Workshop: <https://lonelog.itch.io/lonelog>
- Lonelog tooling (and an Obsidian plugin): <https://github.com/ChristopherHardiman/lonelog>

> **Licensing.** The Lonelog notation system is by Roberto Bisceglie and is published under
> Creative Commons Attribution-ShareAlike 4.0. This guide credits that work and links to it,
> and deliberately uses only the bare functional markers plus original examples written for
> this guide, so it describes a Pointliner workflow rather than adapting the specification
> text itself. If you want to publish your own adaptation of the Lonelog *notation*, read and
> follow the CC BY-SA 4.0 terms on the pages above.

---

## The core idea: type the play, line by line

The thing worth borrowing is simple: give each beat of play its own line, and start the line
with a small marker that says *what kind of beat it is*. A handful of markers covers almost
everything that happens at a solo table:

- something **you do**
- a **question** you put to the oracle
- a **roll** and its raw result
- the **answer** the oracle or system gives
- the **consequence** in the fiction

Keeping those on separate, marked lines is the whole trick. The mechanics (the roll, the
answer) never get tangled up in the prose (what actually happened in the story), and weeks
later you can still read the log and see exactly how each moment resolved.

In Pointliner, **each beat is a point** (one line in the document), and a scene is just a
parent point with its beats nested under it. That nesting is the one thing Pointliner adds for
free: a paper log is flat, but a nested document lets you fold a whole scene closed, or zoom into one.

---

## Making the dice live

Here is where Pointliner changes the experience. In a paper log you write down a roll *after*
you make it somewhere else. In Pointliner you can make the roll **in the line itself**:

| You type in a beat | What happens |
|---|---|
| `{2d6}` | rolls two d6 in place; click it to re-roll |
| `{1d20+5}` | rolls with a modifier |
| `{Yes \| No \| Maybe}` | a quick three-way oracle pick |
| `{= hp - 4}` | does the math, live, if `hp` is a variable you set |

So a "roll" beat stops being a transcription and becomes the actual roll. And because a dice
pill **freezes** its result once rolled, the log stays an honest record: it shows what you
got, and it only changes if you deliberately click to re-roll. (See the
[generating-text guide](../../generating-text.md) for the full dice and oracle syntax.)

You do not have to use live dice. If you rolled physical dice and just want to record the
number, type the number. Mix and match freely.

---

## A worked scene

Here is a short original example, the kind of thing you would actually write mid-session. The
markers below are the bare functional ones; read them as *do / ask / roll / answer / so*.

```
Scene: The nervous merchant
  > I sit down across from the merchant and ask about the back room.
  ? Is he hiding something?  (likely)
  d: {2d6}
  -> Yes, and...
  => He freezes, then forces a smile. Something is back there, and it scares him.
  > I lean in and lower my voice: "I can help, if you tell me what it is."
  ? Does he trust me enough to talk?
  d: {2d6}
  -> No, but...
  => He won't say it aloud, but he slides a torn scrap of paper across the table.
```

Open the [demo file](lonelog-demo.opml) and you will find exactly this scene as a real document,
with the `{2d6}` rolls live. Click a roll to see it change; notice the prose lines stay put.

A few things to try once it is open:

- **Fold the scene.** Click the bullet of "Scene: The nervous merchant" to collapse the whole
  beat list into one line. A long campaign becomes a tidy stack of scene headers you can open
  one at a time.
- **Tag a thread.** Add `#thread/torn-letter` to the consequence line, then click the tag to
  pull up every beat in the whole journal that touches that thread. This is the payoff Pointliner
  adds over a flat log: the record becomes queryable.
- **Link an NPC.** Make a point for the merchant somewhere, then reference him from any beat with
  a link. Backlinks will show you every scene he appears in.

---

## Why bother doing this in Pointliner

The honest trade is this. A pen-and-paper Lonelog is unbeatable for *minimum ceremony in the
moment*: five pen strokes, no device, nothing to learn. Pointliner asks a little more of you up
front, and it is a screen, not a notebook.

What you get back is a log that **does things**:

- the dice are real and roll in place, so there is no copying numbers around
- a roll you commit stays frozen as a record, so the journal is trustworthy
- scenes nest and fold, so a long campaign stays navigable
- tags and links turn the journal into something you can *interrogate* later: every beat with
  this NPC, every open thread, every failed roll
- a running total or a tracked resource can be live math (`{= gold + 50}`) instead of mental
  arithmetic
- the whole thing is one offline file you own, and the journal you export opens and re-rolls on
  anyone's machine with no install and no account

If that sounds worth the trade, this is a comfortable home for the style. If it does not, the
notebook is right there, and that is genuinely fine.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).

---

## Credits

- **Lonelog notation:** Roberto Bisceglie / Loreseed Workshop, <https://lonelog.itch.io/lonelog>,
  CC BY-SA 4.0. This guide is an independent description of a Pointliner workflow inspired by
  Lonelog, not a copy of the notation specification.
- **Lonelog tooling / Obsidian plugin:** Christopher Hardiman,
  <https://github.com/ChristopherHardiman/lonelog>.
- **Pointliner:** MIT, see [LICENSE](../../../LICENSE).
