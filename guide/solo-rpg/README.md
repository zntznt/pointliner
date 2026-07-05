# Pointliner for solo RPGs

Pointliner started life as a solo-RPG tool: the idea was to roll the dice, ask the
oracle, and write the journal all in one file, so the playing and the record live in
the same place. It grew into a general outliner, but the solo-play roots never left.

This folder collects **worked examples** of using Pointliner at the table: real
journaling styles, generators, and trackers, each with a written walkthrough and a
ready-to-open demo file you can poke at.

No coding required. If you can type `{` you can use everything here. If you are new to
the generator pills (`{2d6}`, `{a | b}`, `{= 5 * 8}`), skim the
[main generative guide](../README.md) first, then come back.

---

## How each example is laid out

Every case study is its own folder with two things:

- **A guide** (`*.md`) that walks through the idea and how to set it up in Pointliner.
- **A demo** (`*.opml`) you can **open in Pointliner** (File menu, Open) to get the
  finished example in front of you. Click the pills, re-roll, take it apart.

The demo files use plain `{…}` source text, so when you open one the dice roll fresh on
*your* machine. Nothing is pre-baked or locked.

---

## Examples

**New here? Start with [Lonelog](lonelog/lonelog.md)** for the simplest solo loop (roll, ask, write),
then [Oracle play](oracle-play/oracle-play.md) for the engine underneath it. Those two are the
on-ramp. After that the cases stand alone, so read whichever fits what you are running:

- **The loop (start here):** Lonelog, Oracle play.
- **Trackers (organize a campaign):** NPC and faction tracker, Hex-crawl travel log.
- **Computing (let the numbers run themselves):** Living character sheet, Campaign clocks and threads.

| Case | What it shows | Guide | Demo |
|---|---|---|---|
| **Lonelog notation** | A compact, system-agnostic session-log style, adapted to Pointliner's outline + live dice | [lonelog/lonelog.md](lonelog/lonelog.md) | [lonelog/lonelog-demo.opml](lonelog/lonelog-demo.opml) |
| **Oracle-driven scene play** | The engine under the journal: a swing oracle, a chaos-weighted interrupt check, a meaning table, and a thread deck | [oracle-play/oracle-play.md](oracle-play/oracle-play.md) | [oracle-play/oracle-play-demo.opml](oracle-play/oracle-play-demo.opml) |
| **NPC and faction tracker** | The cast as an interactive base you flip to a faction board, plus linking scene beats to the people in them | [npc-faction/npc-faction.md](npc-faction/npc-faction.md) | [npc-faction/npc-faction-demo.opml](npc-faction/npc-faction-demo.opml) |
| **Hex-crawl travel log** | A map that IS the outline: nested regions and hexes, a self-reshuffling terrain deck, dice encounters, and supplies totaled up each region | [hex-crawl/hex-crawl.md](hex-crawl/hex-crawl.md) | [hex-crawl/hex-crawl-demo.opml](hex-crawl/hex-crawl-demo.opml) |
| **Living character sheet** | Stats as variables that feed derived numbers, an inventory that totals its own weight, and an encumbrance check that flips red when overloaded | [character-sheet/character-sheet.md](character-sheet/character-sheet.md) | [character-sheet/character-sheet-demo.opml](character-sheet/character-sheet-demo.opml) |
| **Campaign clocks and threads** | Progress-cookie clocks that fill as you check segments, threads that tick on a date and surface in the agenda, and a live query pulling every open thread | [campaign-clocks/campaign-clocks.md](campaign-clocks/campaign-clocks.md) | [campaign-clocks/campaign-clocks-demo.opml](campaign-clocks/campaign-clocks-demo.opml) |

Each is one nested branch you can open, poke at, and rebuild into your own.

---

## A note on what Pointliner is and isn't for solo play

Pointliner is a **digital, desktop-first** tool. It is strongest when you want a *living,
searchable, computing* journal: link a scene to the NPC in it, tag a thread and pull up
every beat that touches it, let a roll feed a running total. That is the route it takes,
and it is a powerful one.

It is **not** trying to be the pen-and-paper, five-symbols-in-a-notebook experience some
notations are designed for. The moment you open Pointliner you have chosen the digital
route on purpose. If your goal is the absolute minimum ceremony with a physical pen, a
paper notebook is the better tool, and that is a fine choice. These guides are for when
you want the document to do more than sit there.

---

## Credits and licensing of referenced systems

Some examples adapt existing community notations and oracle styles. Where they do, the
source and its author are credited in that example's guide, and only the functional idea
is adapted, the original text and specifications are linked, not reproduced. Please
support the creators whose work these examples point to.

Pointliner itself is MIT licensed (see [LICENSE](../../LICENSE)).
