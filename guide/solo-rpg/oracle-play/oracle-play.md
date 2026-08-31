# Oracle-driven scene play

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [oracle-play-demo.opml](oracle-play-demo.opml) (open it in Pointliner via File, Open)

The Lonelog example shows the *journal*: how a played scene reads on the page. This one shows
the *engine* underneath it, the loop most solo-RPG systems share:

1. Ask the oracle a yes/no question (with a twist when you want one).
2. Between scenes, check whether something interrupts, at odds set by how chaotic things are.
3. When you need a spark, pull two words from a meaning table.
4. Keep a short list of open threads and pull one to feature next.

Everything here is built from pills you already have. Nothing is a new syntax; a couple of the
pieces reuse the same [dynamic-odds trick](../../generating-text.md#when-the-odds-depend-on-something-dynamic-odds) the generative
guide already teaches, so this walkthrough points at that rather than repeating it.

Open [oracle-play-demo.opml](oracle-play-demo.opml) (File menu, Open) to get all of this in front
of you, then click the pills to watch it run.

---

## The oracle, with a swing

The plain oracle answers Yes or No at odds you choose. Type `@` and pick **Oracle**, then a
likelihood (Certain, Likely, Even, Unlikely, Impossible). Click the pill to ask again.

For a yes/no *with a twist*, pick a **"+ swing"** likelihood in the same dialog. It answers six
ways instead of two:

```
Yes, and | Yes | Yes, but | No, but | No | No, and
```

so a bonus or a complication rides along with the answer. "Yes, and" is a yes that overdelivers;
"No, but" is a no with a consolation. The plain Yes and No stay the most common results; the twists
are the rarer, spicier draws. The odds field stays editable, so you can dial the weights to taste.

## The interrupt check (a chaos factor)

Between scenes, roll to see whether events break in. Keep a **chaos** variable for how unstable
things are, then let it weight an interrupt roll. Higher chaos, more interruptions.

```
chaos = 3                        (a variable, 1 = calm … 5 = chaos)
{proceed | interrupted {= chaos}}
```

The `{= chaos}` weight is read at roll time, so raising `chaos` to 5 makes "interrupted" more
likely without editing the roll. That weight-is-an-expression move is the
[dynamic-odds](../../generating-text.md#when-the-odds-depend-on-something-dynamic-odds) pattern; see there for the full rules. Nudge
`chaos` up when a scene ends badly and down when you get a firm grip on the situation.

## Meaning tables (two words for a spark)

When the oracle says "yes, and" but you do not yet know *what*, pull two words. A meaning table is
just the [name-generator two-rule pattern](../../generating-text.md#name-things-youll-reuse-rules) wearing the
name you know it by:

```
{rule action: hide | reveal | pursue | abandon | protect | betray}
{rule subject: a secret | an ally | a debt | a route | a rumor | a relic}
{rule meaning: {action} {subject}}
```

The `rule` keyword is what names it. A bare `meaning: {action} {subject}` stays ordinary text and
registers nothing, so the wrapper is not optional. (The demo takes the simpler road and ships the
two lists as plain inline picks, which needs no rule at all; reach for named rules once you want to
call the same table from several places.)

Click `{meaning}` and read the pair loosely: "reveal a debt", "pursue a route". You are reading for
inspiration, not instruction, so let the pairing suggest rather than dictate.

For a set of words you want to draw through *without repeats* (so you do not get the same prompt
twice in a scene), make it a deck instead:

```
{shuffle: hide | reveal | pursue | abandon | protect | betray}
```

A shuffle deck draws each item once, then reshuffles and tells you when it has (a
"Deck reshuffled" note), so you always know when you have been through the whole list.

One thing to know: a deck draws without repeats only as its own standalone pill. If you fold a
`{shuffle: ...}` inside a named rule (like `{rule meaning: {shuffle: hide | reveal} {subject}}`), it turns
into an ordinary random pick, so repeats can come back. Keep the deck as its own pill when the
no-repeat behavior matters.

## Threads: pull one to feature next

Solo play runs on threads: the open questions you are chasing. Keep them as a short **hand-written
shuffle deck** of the threads currently in play, and pull one when you need to decide what the next
scene is about:

```
{shuffle: the torn letter | the missing sister | the merchant's debt}
```

Click it to draw a thread to feature; because it is a shuffle deck it works through all of them
before repeating. When a thread opens or closes, edit the list by hand (it is plain text inside the
braces). Alongside it, tagging beats with `#thread/torn-letter` and clicking the tag gathers every
beat that touched that thread, so the deck decides *what to feature* and the tag shows you *what has
happened* on it.

> The deck lists the threads as literal text you maintain, which keeps the whole loop inside the
> braces you already know and works through every thread before repeating. If you would rather roll
> on your *actual* open threads (the `#thread` points you already keep) so the deck never drifts from
> the campaign, [the living oracle](../living-oracle/living-oracle.md) shows the `{roll: #thread}`
> version. The two are the hand-kept and the live-kept forms of the same idea.

---

## Putting it together

A single played beat, start to finish:

1. Ask: `@` Oracle, "Likely + swing" → **Yes, but**.
2. It is a yes with a catch, but what catch? Click `{meaning}` → "protect a debt".
3. Read it: the merchant will help, but only to clear a debt he owes someone worse.
4. End the scene, bump `chaos` if it went sideways, then roll `{proceed | interrupted {= chaos}}`.
5. If interrupted, pull `{shuffle: …threads…}` to see which thread barges in.

The demo has all five pieces wired so you can click through the loop.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
