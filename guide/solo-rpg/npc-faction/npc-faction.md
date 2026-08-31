# An NPC and faction tracker in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [npc-faction-demo.opml](npc-faction-demo.opml) (open it in Pointliner via File, Open)

Solo campaigns live and die by their cast. After a dozen sessions you have a Fence who owes
you, a Prior who wants you dead and three factions whose loyalties keep sliding. A flat list
of names stops being enough. This example turns the cast into an **interactive base** (a live
table) you can flip to a **kanban board** grouped by faction, and shows the habit of **linking**
scene notes to the people in them so every mention finds its way back.

It leans on the parts of Pointliner the journaling examples do not: the base, its board and
column roles, properties and links with backlinks.

## The roster is a base

Open the demo and you will see a `/base`: an editable grid of NPCs, one row each, with columns
for **NPC, Faction, Disposition and Tie**. Click any cell to edit it. Add a row by typing at
the bottom, or press `Alt+Shift+Down` on a cell to insert one. This is your living roster:
everyone the character has met, in one place you can sort and search.

Two settings make the same rows a board, and both are needed. First the **Faction** column is
marked as a **Status** column: put the cursor in a Faction cell and press `Alt+R` until the column
shows as Status, or use the column menu's **Show as**. Second, the factions have to be **declared
states**, which is one pill sitting above the base:

```
{seq Cast: UNDERCITY FREEPORT ASHCHURCH | GONE}
```

Capitals are only a reading convention; a value becomes a lane because it is a declared state, and
an undeclared faction lands in a "No state" lane no matter how you spell it. A sequence needs at
least one state on each side of the bar, and everything right of the bar reads as finished, which
is what `GONE` is for: an NPC who is dead, fled or written out.

## The same rows as a faction board

The demo opens on the Board already; the switcher at the base's top left takes you back to
**Table**, or on to **Cards**. Every declared faction is a lane, and every NPC is a card sitting in
their faction's lane. Now the roster reads like a map of who stands where.

When a loyalty shifts, move the card: drag it to another lane, or focus a card and press
`Alt+Left` / `Alt+Right` to slide it. The move writes the new faction back into the table, so
if you flip to **Table** view the cell has changed too. The table is the single source of truth;
the board is just another way to look at it. Nothing is duplicated and the two never disagree.

## Scenes link to the cast

In your own game, give each important NPC their own point in the document, outside the base, and
when a scene mentions them, **link to that point**. Type `[[`, pick the NPC, and Pointliner drops
a link. From then on the NPC's point shows a **backlink** to every scene that mentions them, so
you can stand on Vex's page and see every beat she has ever appeared in, both directions at once.

The demo shows the pattern with two example NPC points and beats beneath them. A beat can still
carry live dice (Vex names a price of `{2d6}` silver) and an oracle (did the Prior move first?),
so the mechanical and the fictional stay in the same log, the same as the journaling examples.

## Run it yourself

- **Add someone new:** type a row into the base and set their Faction to one of the declared
  lanes. For a faction that does not exist yet, add it to the `{seq Cast: ...}` pill first, or the
  card lands in "No state".
- **Track a turn:** change a Disposition cell from `wary` to `ally`, or move a card to a new
  faction lane when someone switches sides.
- **Find your people:** read the lane. The roster lives in base rows rather than points, so a
  search cannot pick a row out of it, and the lane already *is* the list of who stands where.
  Search is for what lives outside the base: tag scene beats with a thread like `#relic` and click
  the tag to pull up every beat that touches it.
- **Grow it:** add a column (`Alt+Shift+Right` on a cell) for a Location or a Debt, and mark a
  Date column as **Date** to unlock the Calendar view for scheduled reprisals. Status is what gates
  the Board; Date is what gates the Calendar.

The whole roster is one branch of one document. Delete the parts you do not want, rename the
factions to yours, and it is your campaign's tracker.

Once your cast lives here, you can **roll on it**: tag the people `#npc` and a `{roll: #npc}` pill
draws a random one when you need to know who shows up. [The living oracle](../living-oracle/living-oracle.md)
turns this roster into a solo-play oracle that draws from your own campaign.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
