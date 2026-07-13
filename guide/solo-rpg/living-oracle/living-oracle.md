# The living oracle: roll on your own campaign

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [living-oracle-demo.opml](living-oracle-demo.opml) (open it in Pointliner via File, Open)

Most oracles ask you to build the table first: type a list of NPCs into a deck, a list of threads
into another, and keep both in sync by hand as the campaign moves. The [oracle-play](../oracle-play/oracle-play.md)
example does exactly that, and it works.

This one does the thing no other tool does. Instead of rolling on a list you typed *into* a pill,
you roll on the **campaign you are already keeping**. Your cast is a list of points you tag `#npc`.
Your open threads are points you tag `#thread`. A single pill then draws one at random from that
live list, so the world surprises you with its own contents. Add a fifth NPC anywhere in the
document and the next roll can land on them. Close a thread and it drops out of the pool. Nothing to
re-type, nothing to keep in sync.

The pill that does this is `{roll: SEARCH}`, and `SEARCH` is a normal Pointliner search. If you can
type it into the search box, you can roll on it.

---

## Your cast is the table

Keep your NPCs as ordinary points, each tagged `#npc`:

```
Mara the smuggler, owes everyone #npc
Rusty the innkeep, hears everything #npc
Sergeant Voss, a guard on the take #npc
Sister Present, asks too many questions #npc
```

Now, anywhere in the document, ask the world who shows up:

```
Who walks into the scene? {roll: #npc}
```

Click the pill and it draws one of the four at random. Click again for another. It is a search that
returns one random match instead of a filtered list, so it reaches every `#npc` point wherever it
lives in your outline. The cast list above and the roll do not have to sit next to each other.

Because the pool *is* your notes, it is always current. Introduce a new contact mid-session, tag it
`#npc`, and the next roll can pick them with no setup. That is the whole trick: the table maintains
itself because it was never a separate table.

## Freeze the one you drew

A bare `{roll: #npc}` rolls fresh every time the page redraws, which is what you want for "who
wanders in." But often you draw an NPC and then want to *keep* them for the rest of the scene: this
person is here now, and three lines later you are still talking about the same person.

Name the roll and it holds:

```
Tonight's contact: {who := {roll: #npc}}
{who} leans in and lowers their voice.
```

The `{who := …}` freezes one draw into a variable. Every `{who}` after it is that same NPC, so the
scene stays consistent. Click the frozen pill to draw a new contact when you want one; until then it
stays put. This is the same variable system the rest of Pointliner uses, so there is no new syntax
to learn: `{name := value}` names a value, and here the value happens to be a roll on your cast.

## Threads work the same way

Tag your open questions `#thread` and you have a thread oracle that is always the real list of what
is unresolved:

```
The torn letter no one will explain #thread
The caravan that never arrived #thread
A debt the merchant is hiding #thread

Which thread pushes forward this session? {roll: #thread}
```

This is the upgrade the [oracle-play](../oracle-play/oracle-play.md) example flagged as its one
manual step. There, the threads live as literal text inside a `{shuffle: …}` deck you edit by hand.
Here they are your actual `#thread` points, so the deck never drifts from the campaign. Resolve a
thread by deleting its tag (or the point), and it is gone from the next roll.

You lose the draw-without-repeats behavior of a shuffle deck (a roll can pick the same thread twice
in a row), so if you specifically want to work through every thread before repeating, the hand-kept
shuffle deck is still the tool. For "surprise me with something still open," the live roll wins.

## Narrow the pool with any search

Because the argument is a full search, you are not limited to a single tag. Any operator the search
box understands works inside the roll:

```
{roll: #npc #faction/ashguild}      a random Ashguild member (both tags must match)
{roll: is:todo}                     a random open task from the points below this one
{roll: #thread -#thread/resolved}   an open thread, excluding ones you tagged resolved
{roll: #clue is:todo}               a random clue you have not followed up yet
```

The last one is the payoff: a clue that is still open, drawn from your own investigation. The oracle
is not making up content, it is reaching into what you already wrote and handing one piece back at
random. That is the difference between a generator and a GM: a GM knows your world.

## Put it in a scene

A single beat of play, all from your own campaign:

1. Start a scene. Who is here? Click `{who := {roll: #npc}}` → **Sergeant Voss**.
2. Ask a yes/no oracle whether he is hostile (weighted however the fiction feels):
   `{Yes 6 | Yes, but 3 | No, but 3 | No 6}` → **Yes, but**.
3. He is trouble, but there is a catch. What is the catch tied to? `{roll: #thread}` → **the
   caravan that never arrived**. Voss is leaning on you *because of* the missing caravan.
4. You did not plan that connection. The roll made it, out of points you had already written weeks
   apart. That is the living oracle: it draws the campaign's own threads together in ways you did
   not arrange.

The yes/no oracle is a plain weighted list (see [oracle-play](../oracle-play/oracle-play.md) for the
full swing-oracle treatment); the roll is the new part. Together they are a complete solo engine
where every answer comes from your world, not a stranger's table.

---

## Run it yourself

Open the [demo file](living-oracle-demo.opml) (File menu, Open) and it drops in a small campaign
already tagged: four NPCs, three open threads, a handful of clues, and a scene panel of roll pills
that draw from all of them.

- **Roll on your cast.** Click `{roll: #npc}` in the scene panel and watch it pick one of the four.
  Click again for another draw.
- **Add to the pool live.** Add a fifth `#npc` point to the cast list, then roll again: the new NPC
  can now come up, with no other change.
- **Freeze one.** The demo has a `{contact := {roll: #npc}}` line; click it to lock in a contact for
  the scene, and see the later `{contact}` references follow.
- **Roll a narrowed pool.** Try the `{roll: #clue is:todo}` pill to draw only a clue you have not
  resolved, then check off that clue and roll again to see it leave the pool.

To build your own from nothing: tag a few points `#npc`, write `{roll: #npc}` under them, and you
have a personal oracle. Everything else is the same idea pointed at a different tag.

---

## Why do it this way

A hand-typed deck and a live roll look similar in the braces, but they are opposites in practice:

- The deck is a **copy** of your campaign that you keep in sync by hand. It drifts the moment you
  forget to update it.
- The roll **is** your campaign. It cannot drift, because there is nothing to keep in sync: the pool
  is the notes themselves.

For a small, fixed list you want to cycle through evenly, the shuffle deck is still the cleaner tool.
But the reason to keep your campaign in Pointliner at all is that it is a living document, and this
is the pill that lets the living document talk back. No curated oracle app can do it, because none of
them hold your campaign as the thing they roll on.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
