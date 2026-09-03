# Pointliner for solo RPGs

Pointliner started life as a solo-RPG tool: the idea was to roll the dice, ask the
oracle and write the journal all in one file, so the playing and the record live in
the same place. It grew into a general outliner, but the solo-play roots never left.

This folder collects **worked examples** of using Pointliner at the table: real
journaling styles, generators and trackers, each with a written walkthrough and a
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

- **The loop (start here):** Lonelog, Oracle play, The living oracle.
- **Tools (beat the blank page):** Generators, Session prep.
- **Trackers (organize a campaign):** NPC and faction tracker, Hex-crawl travel log, The campaign calendar.
- **Computing (let the numbers run themselves):** Living character sheet, Campaign clocks and threads.
- **A full system:** Ironsworn, Cairn and Maze Rats (their rules wired into pills, adapted from their open licences).
- **Emulating the party:** Triple-O, for running a published module solo from the GM's seat.

| Case | What it shows | Guide | Demo |
|---|---|---|---|
| **Lonelog notation** | A compact, system-agnostic session-log style, adapted to Pointliner's outline + live dice | [lonelog/lonelog.md](lonelog/lonelog.md) | [lonelog/lonelog-demo.opml](lonelog/lonelog-demo.opml) |
| **Oracle-driven scene play** | The engine under the journal: a swing oracle, a chaos-weighted interrupt check, a meaning table and a thread deck | [oracle-play/oracle-play.md](oracle-play/oracle-play.md) | [oracle-play/oracle-play-demo.opml](oracle-play/oracle-play-demo.opml) |
| **The living oracle** | Roll on your own campaign: `{roll: #npc}` and `{roll: #thread}` draw a random point from your live cast and open threads, so the world surprises you with its own contents (the one thing no curated oracle app can do) | [living-oracle/living-oracle.md](living-oracle/living-oracle.md) | [living-oracle/living-oracle-demo.opml](living-oracle/living-oracle-demo.opml) |
| **Generators (names, places, loot)** | Pointliner's grammar engine as a content generator: a Markov name chain, a rule-based place generator with text modifiers and a weighted loot table with a hierarchical item | [generators/generators.md](generators/generators.md) | [generators/generators-demo.opml](generators/generators-demo.opml) |
| **Session prep and quick capture** | Beat the blank page: stamp a session from a template, capture a mid-play idea to the inbox without leaving the scene and keep today's entry with journal mode | [session-prep/session-prep.md](session-prep/session-prep.md) | [session-prep/session-prep-demo.opml](session-prep/session-prep-demo.opml) |
| **NPC and faction tracker** | The cast as an interactive base you flip to a faction board, plus linking scene beats to the people in them | [npc-faction/npc-faction.md](npc-faction/npc-faction.md) | [npc-faction/npc-faction-demo.opml](npc-faction/npc-faction-demo.opml) |
| **Hex-crawl travel log** | A map that IS the outline: nested regions and hexes, a self-reshuffling terrain deck, dice encounters and supplies totaled up each region | [hex-crawl/hex-crawl.md](hex-crawl/hex-crawl.md) | [hex-crawl/hex-crawl-demo.opml](hex-crawl/hex-crawl-demo.opml) |
| **Living character sheet** | Stats as variables that feed derived numbers, an inventory that totals its own weight and an encumbrance check that flips red when overloaded | [character-sheet/character-sheet.md](character-sheet/character-sheet.md) | [character-sheet/character-sheet-demo.opml](character-sheet/character-sheet-demo.opml) |
| **Campaign clocks and threads** | Progress-cookie clocks that fill as you check segments, threads that tick on a date and surface in the agenda and a live query pulling every open thread | [campaign-clocks/campaign-clocks.md](campaign-clocks/campaign-clocks.md) | [campaign-clocks/campaign-clocks-demo.opml](campaign-clocks/campaign-clocks-demo.opml) |
| **The campaign calendar** | The world on its own calendar: months, week, and era you define, threads due in world time, a clock you advance from the agenda, and a journal that chronicles in campaign dates | [campaign-calendar/campaign-calendar.md](campaign-calendar/campaign-calendar.md) | [campaign-calendar/campaign-calendar-demo.opml](campaign-calendar/campaign-calendar-demo.opml) |
| **Ironsworn in Pointliner** | A full open-licence system wired into pills: the action roll, momentum, progress tracks and oracles, with the pill structure ready for the SRD's own moves and oracle entries (CC BY 4.0, Shawn Tomkin) | [ironsworn/ironsworn.md](ironsworn/ironsworn.md) | [ironsworn/ironsworn-demo.opml](ironsworn/ironsworn-demo.opml) |
| **Cairn in Pointliner** | A rules-light OSR system in pills: 3d6 attributes as variables, d20 roll-under saves, a slot inventory with an overload check, HP-then-Strength damage and its tables ready for the SRD's entries (CC BY-SA 4.0, Yochai Gal) | [cairn/cairn.md](cairn/cairn.md) | [cairn/cairn-demo.opml](cairn/cairn-demo.opml) |
| **Maze Rats in Pointliner** | A table-driven OSR generator in pills: 2d6 saves off modifier variables, and its random tables as one-click picks ready for the book's entries, including the two-list improvised-spell trick (CC BY 4.0, Ben Milton) | [maze-rats/maze-rats.md](maze-rats/maze-rats.md) | [maze-rats/maze-rats-demo.opml](maze-rats/maze-rats-demo.opml) |
| **Triple-O in Pointliner** | The solo setup inverted: you GM and the dice play the party. The Check as a weighted pick, Traits as points you can roll on, the Trait Sheet as a status board, and all thirteen of the zine's d66 tables shipped complete (CC BY-SA 4.0, Cezar Capacle) | [triple-o/triple-o.md](triple-o/triple-o.md) | [triple-o/triple-o-demo.opml](triple-o/triple-o-demo.opml) |

Each is one nested branch you can open, poke at and rebuild into your own.

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

Some examples adapt existing community notations and oracle styles. Where they do, the source and
its author are credited in that example's guide. Where a system is **not** openly licensed, only
the functional idea is adapted and the original text is linked rather than reproduced.

Every system referenced here happens to be openly licensed, so the example may reproduce more,
within that licence's terms and with its attribution. Each of those licences covers **that game's
material only**; Pointliner itself is under the **GNU AGPLv3** ([LICENSE](../../LICENSE)), and
adapting a game into a guide here does not put the app under the game's licence or the game under
the app's:

- The **Ironsworn** example adapts the Ironsworn System Reference Document by **Shawn Tomkin**,
  used under **CC BY 4.0** (<https://creativecommons.org/licenses/by/4.0/>).
- The **Cairn** example adapts **Cairn** by **Yochai Gal**, used under **CC BY-SA 4.0**
  (<https://creativecommons.org/licenses/by-sa/4.0/>). Because Cairn is **ShareAlike**, the
  adapted Cairn material in that example is itself licensed CC BY-SA 4.0.
- The **Maze Rats** example adapts **Maze Rats** by **Ben Milton**, used under **CC BY 4.0**
  (<https://creativecommons.org/licenses/by/4.0/>).
- The **Triple-O** example adapts **Triple-O: The Player Character Emulator** by **Cezar Capacle**,
  used under **CC BY-SA 4.0** (<https://creativecommons.org/licenses/by-sa/4.0/>). Because Triple-O
  is **ShareAlike**, the adapted Triple-O material in that example is itself licensed CC BY-SA 4.0.
  It is the one example here that reproduces a game's tables in full rather than leaving filler,
  which that licence permits and which the example's own notice attributes.
- The **Lonelog** example adapts the notation by **Roberto Bisceglie**, published under
  **CC BY-SA 4.0**. It deliberately reproduces none of the specification, using only the bare
  functional markers plus examples written for this guide, and links to the source instead.
- The **campaign calendar** example points at the Forgotten Realms **Calendar of Harptos** as one
  worked example of a custom calendar. It names months and festivals to say what you would type
  and reproduces no text; Forgotten Realms is a trademark of Wizards of the Coast, used here
  descriptively and with no affiliation.
- The **oracle play** example's apparatus (a chaos factor, an interrupt check, meaning tables) is
  the common vocabulary of solo play popularised by **Mythic GM Emulator** by **Tana Pigeon**. The
  tables and wording here are original; the idea is not, and the credit belongs there.

Each carries the required attribution, notes that changes were made and uses the game's name
descriptively (no logo or artwork). Please support the creators whose work these examples point to.

**Licensing of these files.** Pointliner itself is licensed under the GNU AGPLv3 (see
[LICENSE](../../LICENSE)), which covers the code. The adapted game content in this folder carries
the licence of the system it adapts, as listed above, which is why the Ironsworn and Maze Rats
guides offer themselves under CC BY 4.0 and the Cairn and Triple-O guides under CC BY-SA 4.0. Those are grants
over the adapted material in those files, made alongside the repository licence rather than in
place of it.
