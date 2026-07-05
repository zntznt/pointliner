# An NPC and faction tracker in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [npc-faction-demo.opml](npc-faction-demo.opml) (open it in Pointliner via File, Open)

Solo campaigns live and die by their cast. After a dozen sessions you have a Fence who owes
you, a Prior who wants you dead, and three factions whose loyalties keep sliding. A flat list
of names stops being enough. This example turns the cast into an **interactive base** (a live
table) you can flip to a **kanban board** grouped by faction, and shows the habit of **linking**
scene notes to the people in them so every mention finds its way back.

It leans on the parts of Pointliner the journaling examples do not: the base, its board and
column roles, properties, and links with backlinks.

## The roster is a base

Open the demo and you will see a `/base`: an editable grid of NPCs, one row each, with columns
for **NPC, Faction, Disposition, and Tie**. Click any cell to edit it. Add a row by typing at
the bottom, or press `Alt+Shift+Down` on a cell to insert one. This is your living roster:
everyone the character has met, in one place you can sort and search.

The **Faction** column is marked as a **Status** column (its values are written in CAPITALS so
they read as states). That one setting is what lets the same rows become a board. If you build
your own from scratch, put the cursor in a Faction cell and press `Alt+R` until the column shows
as Status, or use the column menu's **Show as**.

## The same rows as a faction board

Click **Board** in the switcher at the base's top left. Every faction becomes a lane, and every
NPC becomes a card sitting in their faction's lane. Now the roster reads like a map of who
stands where.

When a loyalty shifts, move the card: drag it to another lane, or focus a card and press
`Alt+Left` / `Alt+Right` to slide it. The move writes the new faction back into the table, so
if you flip to **Table** view the cell has changed too. The table is the single source of truth;
the board is just another way to look at it. Nothing is duplicated and the two never disagree.

## Scenes link to the cast

In your own game, give each important NPC their own point in the outline, outside the base, and
when a scene mentions them, **link to that point**. Type `[[`, pick the NPC, and Pointliner drops
a link. From then on the NPC's point shows a **backlink** to every scene that mentions them, so
you can stand on Vex's page and see every beat she has ever appeared in, both directions at once.

The demo shows the pattern with two example NPC points and beats beneath them. A beat can still
carry live dice (Vex names a price of `{2d6}` silver) and an oracle (did the Prior move first?),
so the mechanical and the fictional stay in the same log, the same as the journaling examples.

## Run it yourself

- **Add someone new:** type a row into the base, set their Faction, and they appear on the board.
- **Track a turn:** change a Disposition cell from `wary` to `ally`, or move a card to a new
  faction lane when someone switches sides.
- **Find your people:** search `faction:Undercity` to list everyone in a faction, or just click
  that lane on the board. Tag scene beats with a thread like `#relic` and click the tag to pull
  up every beat that touches it.
- **Grow it:** add a column (`Alt+Shift+Right` on a cell) for a Location or a Debt, and mark a
  Date column as Status or Date to unlock the Calendar view for scheduled reprisals.

The whole roster is one branch of one document. Delete the parts you do not want, rename the
factions to yours, and it is your campaign's tracker.
