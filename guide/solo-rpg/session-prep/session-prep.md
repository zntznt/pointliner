# Session prep and the blank page in Pointliner

*Part of the [solo-RPG guides](../README.md).*

**Demo file:** [session-prep-demo.opml](session-prep-demo.opml) (open it in Pointliner via File, Open)

Every solo session begins the same hard way: you open the file and stare at nothing. What is
the scene? What is still unresolved from last time? What might walk in and complicate it? And
then, 10 minutes into play, an idea for something else arrives at the worst possible moment,
and you either lose it or you follow it and lose the scene you were in.

This example is about those two friction points, starting and interrupting, and the three
built-in doors Pointliner gives you for them. Unlike the rest of the solo cases, most of what
matters here is not a `{…}` pill you type but a button you click or a slash verb you run:
**templates** to stamp a fresh session structure, **capture** to log a stray idea without
leaving your place and **journal mode** to drop into today's dated entry. A few live pills
ride along inside the template (an oracle, an event deck, a random-event roll), but the point of
this case is the plumbing that gets you from a blank page to a running session.

---

## The blank page problem

The fix for the blank page is a small amount of standing structure. You do not want to
reinvent "how do I start a session" every time, and you do not want a good idea mid-scene to
force a choice between the idea and the flow. Two habits cover both:

- Keep a **fixed session shape** you stamp fresh at the start of each session, so the page is
  never blank, it is prompts waiting to be filled.
- Keep **one place to dump ideas** so a stray thought is a two-second capture, not a
  navigation trip that pulls you out of the scene.

Pointliner has a door for each. The rest of this guide walks the three doors (stamp, capture,
journal) plus the one that closes the loop (refile a capture into the fiction later).

---

## Stamp a fresh session with a template

A **template** is a named snapshot of a subtree that lives on the document. You build the shape
once, save it and stamp copies of it whenever you want.

Build a "Session" point with the prep slots you always want under it: scene seeds, threads to
chase from last time, an oracle on hand, a session-start event, a random-event roll. Then save
it two ways:

- **From the bullet menu:** open the Session point's bullet menu and pick **Save as template**.
  It asks for a name (call it `session`) and stores the whole subtree.
- **By typing:** run `/savetemplate:session` to save it under that name in one command.

At the start of your next session, stamp a fresh copy:

- `/template:session` drops a fresh, independent copy of the Session subtree in, so it is a
  clean slate you can fill without touching the original.
- Bare `/template` opens a picker if you keep more than one template (a session template, a
  scene template, an NPC template) and you want to choose.

The stamped copy replaces the empty point you invoked it on, or lands as the next sibling if
that point already has content. Either way the blank page is gone: you are looking at your own
prompts, ready to answer them. In the demo, the `Session 2026-07-04` subtree is that template
already filled in, so you can see what a stamped session looks like, oracle, event deck and
random-event roll included.

---

## Capture a mid-play idea to the inbox

The **capture** door is the one that protects your flow. A toolbar **inbox button** opens a
**Capture dialog** that overlays wherever you are. That is the whole point: it does not navigate
you anywhere. You are mid-scene, an idea for a later beat arrives, you open capture, type it,
press Enter, and you are back in the scene, the idea safely written down somewhere else.

Where does it go? To a **designated inbox point**. You set the inbox once, from a point's bullet
menu, **Set as inbox** (the same menu toggles it back off on the current inbox). After that,
every capture appends **one point as that inbox's last child**. The dialog is markdown-aware, so
typing a `- [ ]` line captures a to-do, and it **stays open after each capture** with a running
"Captured N" confirmation, so you can log two or three ideas in a row without breaking stride,
Enter captures, Shift+Enter adds a line break.

In the demo, the "Capture: a mid-play inbox" point is marked as the inbox, and it already holds
three captured ideas as children so you can see the shape. The habit is: capture cheap, capture
often and sort it out later, which is exactly what refile (below) is for.

---

## Drop into today's entry with journal mode

The **journal** door gives every play session one dated home without you typing a date header.
A toolbar **journal button** (or the `/journal` slash verb, or the `journal` block command from
the `/` menu's Organize group) opens **today's entry**. Under the hood it finds or creates a
top-level **Journal** home point, then finds or creates a **dated day point** under it in
`YYYY-MM-DD` form and lands you there ready to write.

This is the piece the [Lonelog case](../lonelog/lonelog.md) never mentions. That case teaches a
hand-rolled session log, you type a `Scene:` header, you type the date, you nest your beats by
hand, and it works. But Pointliner has this built in: the journal button is the real feature
that automates the dated-entry part of that workflow. One click lands you in today's point under
a tidy `Journal` tree, so the "start a new dated entry" step is done for you and your day-to-day
logs stack up in date order on their own.

In the demo, the `Journal` point holds a `2026-07-04` day point with a few beats already written,
oracle and random-event pills live inside them, so you can see what today's entry looks like once
you are in it.

---

## Refile a capture into its scene

Capture is deliberately lossy about *where* an idea belongs, it just gets it out of your head and
into the inbox. **Refile** is how you close that loop later. On a captured point, open the bullet
menu and pick **Refile** (or type `/refile`, or `/refile:TITLE` to jump straight at a target),
and a point-tree navigator opens: search or browse the outline, pick the scene the idea belongs
under, and the captured subtree moves out of the inbox and becomes that scene's last child.

So the full rhythm is: **capture** cheap and often mid-play, keep the scene moving and **refile**
when you reach a natural pause, moving each idea into the fiction where it now has a home. The
inbox stays a scratchpad, not a graveyard.

---

## Run it yourself

Open the [demo file](session-prep-demo.opml) in Pointliner (File menu, Open) and it comes up as a
real outline. A few things to try:

- **Stamp a session.** Open the bullet menu on the `Session 2026-07-04` point and pick **Save as
  template** (name it `session`). Then add an empty point and run `/template:session`, a fresh
  session structure drops in, no blank page.
- **Set the inbox and capture.** Open the bullet menu on the "Capture: a mid-play inbox" point and
  pick **Set as inbox**. Then click the toolbar inbox button, type an idea, press Enter and watch
  it land as a child of that point while the dialog stays open for the next one. You never left
  your scene.
- **Open today's entry.** Click the toolbar journal button (or type `/journal`). It jumps you to
  today's dated point under the `Journal` home, creating both if they are not there yet. Compare
  that to the hand-typed date headers in the Lonelog case, this is the same idea, automated.
- **Refile a capture.** On one of the captured children, open the bullet menu and pick **Refile**,
  then send it under the `Journal` day point or the Session subtree. The idea leaves the inbox and
  joins the fiction.
- **Run the pills.** Click `{Yes 6 | No 6}` to ask the oracle, `{shuffle: complication | ally
  appears | clock ticks | quiet}` to draw a session-start event (a deck, so it draws each once
  before it reshuffles) and `{2d6}` for a random-event roll. Each freezes its result, click again
  to re-run.

---

## Why do this in Pointliner

A paper session starts with a fresh page and a habit you carry in your head. What Pointliner adds
is that the habit is **built into the tool**:

- a template stamps your session structure fresh in one command, so you never face a blank page
- capture overlays wherever you are and appends to your inbox, so a mid-scene idea costs two
  seconds and never pulls you out of the flow
- journal mode lands you in today's dated entry on one click, the built-in version of the
  hand-rolled dated log in the Lonelog case
- refile moves a captured idea into its scene later, so the inbox stays a scratchpad and the
  fiction stays organized

It is one offline file you own, and the session you prep opens and re-rolls on anyone's machine
with no install and no account.

**Back to:** [Solo RPG guides](../README.md) · [the guide](../../README.md).
