# A hex-crawl travel log in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [hex-crawl-demo.opml](hex-crawl-demo.opml) (open it in Pointliner via File, Open)

A hex-crawl is the oldest kind of solo adventure: you stand at the edge of a blank map, and
you fill it in one hex at a time. You pick a direction, you find out what the land is, you
find out whether anything is out there, and you write down what you found. Do that enough
times and a world exists that did not exist an hour ago.

This example shows how to run that loop inside Pointliner, where **the document is the map**.
A region is a point, a hex is a point nested under its region, and everything you discover in
a hex hangs under the hex. Terrain comes off a deck, encounters are live dice, and your
supplies count themselves down as you go. Nothing here is a new notation to learn: it is the
same `{…}` pills as the rest of the guide, arranged into a travel log.

---

## The map is the document

The one idea this example is built around: **you do not need a separate map view, because the
document already nests.** Put the Vale at the top. Put each region under it. Put each hex under
its region. Put what you found under the hex.

```
The Greytine Vale
  Region: The Fenlands
    Hex 0101  (terrain, what's here, supplies used)
    Hex 0102
    Hex 0103
  Region: The Ashen Ridge
    Hex 0201
    Hex 0202
```

That nesting is the whole trick, and Pointliner gives it to you for free. **Fold a region
closed** (click its bullet) and the map shrinks to a tidy list of region names, the way a map
looks from far away. **Open one** and you zoom into its hexes. A long crawl stays navigable
because it is a tree you can collapse, not a flat wall of notes.

To grow the map, you outline: press Tab to add a hex as a child of a region, or add a new
region as a sibling. There is no separate "add to map" step. The map grows by writing.

---

## The terrain deck: draw each once, then reshuffle

When you enter a new hex you want to know what the land is, and you want variety. A plain
random pick can hand you marsh five hexes running. A **deck** fixes that:

```
{shuffle: forest | hills | marsh | ruins | river | open plain}
```

This is a shuffle deck. Click the pill and it **draws one terrain and sets it aside.** The
next click draws a different one. It keeps dealing each terrain exactly once, and only when
the deck is empty does it **reshuffle and tell you** it did. So a stretch of country feels
varied, six different terrains before any repeat, instead of the same card coming up by bad
luck.

Every terrain pill in the demo shares the one deck (decks are keyed by their content), so the
whole crawl draws from a single, self-balancing bag of terrain. There is a lighter cousin in
the file too, the weather:

```
{cycle: clear | overcast | rain | fog}
```

A **cycle** just rotates through its list in order, click by click, and loops. Good for a day
counter or a slow-turning weather wheel where you want the sequence, not a surprise.

---

## The encounter roll: live dice against a threshold

Each hex or each day you check whether anything is out there. That is a die roll read against
a number:

```
Encounter check {2d6}. On 10 or more, something crosses your path.
```

The `{2d6}` is a real roll. Click it to roll, click again to re-roll, and it **freezes** its
result so the log is an honest record of what you actually got. You read the number against
the threshold written on the same line, quiet on a low roll, trouble on a high one, and you
decide what it means.

When the check says something is there, a second pill tells you what:

```
{a lone traveler | tracks, fresh | a wary beast | a hidden cache | distant smoke | signs of a camp}
```

That is a plain one-off pick (a `{a | b | c}` list), the fast way to get an idea when you do
not need a deck's no-repeats discipline. There is a `{1d6}` in the file too, used for how far
you can travel before dusk. Mix `{2d6}`, `{1d6}` and any modifier you like; the dice are the
same ones the rest of the guide covers.

---

## The running supply total: math over the hexes

This is the piece that makes the crawl feel like a journey with a cost. Each hex carries a
**property** that says how many rations it burned:

```
Hex 0102: terrain ... {prop supplies: 2}
```

`{prop supplies: 2}` is a property pill. It attaches a fact, `supplies = 2`, to that hex,
shown as a small chip and searchable later. Then, on the region point, a single pill totals
them:

```
Region: The Fenlands (west of the ford), {= sum(supplies)} rations spent
  Hex 0101: ... {prop supplies: 1}
  Hex 0102: ... {prop supplies: 2}
```

`{= sum(supplies)}` **adds up the `supplies` property of the region's direct children**, the
hexes right underneath it, and shows the total. It is **live**: change a hex's number and the
region's total re-computes on its own, no arithmetic in your head. It only sees direct
children, so it totals one region's hexes, not the whole tree. For a true grand total across
every region at once, widen the scope instead of duplicating subtotals: `{= sum(supplies, subtree)}`
on the Vale point reaches every hex at any depth. The demo carries both, so you can see the
difference. The demo also declares a starting pool as a variable:

```
{rations := 10}
```

so you can show spent-against-total, `{= sum(supplies, subtree)} of {rations}`, at a glance. Other
aggregations work the same way if you want them: `{= avg(supplies)}`, `{= count(supplies)}`,
`{= max(supplies)}`.

---

## Run it yourself

Open the [demo file](hex-crawl-demo.opml) in Pointliner (File menu, Open) and it comes up as a
real document with every pill live. A few things to try:

- **Draw a region's worth of terrain.** Click the terrain pill on each hex of the Fenlands and
  watch the deck hand out different terrains, then announce its reshuffle when it runs dry.
- **Roll the daily loop.** Go to "The daily loop" section and click through it top to bottom:
  weather, push distance, terrain, encounter check. That is one day of play in about six clicks.
- **Break the supply math on purpose.** Edit a hex's `{prop supplies: N}` to a bigger number
  and watch the region's `{= sum(supplies)}` total jump. That live re-total is the whole point
  of putting the number in a property instead of adding it up by hand.
- **Extend the map.** Add a new hex under a region (Tab to indent), give it a terrain draw, an
  encounter check and a `{prop supplies: N}`. Add a whole new region as a sibling. The document
  is the map, so it grows by outlining.
- **Tag a thread.** The demo tags a beat `#thread/the-pass`. Click the tag to pull every beat
  that touches it, the same queryable-journal payoff the other solo-RPG examples lean on.

---

## Why do this in Pointliner

A hex-crawl on paper is a grid and a pencil, and that is a fine thing. What Pointliner adds is
that the map **computes and folds**:

- the terrain deck deals without repeats and reshuffles itself, so you get variety for free
- the dice are real and freeze once rolled, so the log is a trustworthy record
- the supply total is live math over the hexes, not mental arithmetic you redo every leg
- the whole map folds and unfolds, so a 50-hex crawl stays a navigable tree
- tags and links turn the log into something you can interrogate later, every hex on this
  ridge, every open thread, every hard encounter

It is one offline file you own, and the crawl you export opens and re-rolls on anyone's machine
with no install and no account.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
