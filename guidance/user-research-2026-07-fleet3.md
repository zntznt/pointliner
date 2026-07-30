# User research: six personas, third fleet, laptop (2026-07-30)

**Status: RECORD (not a commitment).** A third fleet, all on laptops, chosen from walks of life the
first eleven personas did not cover: hospitality, freelance language services, an unpaid domestic
role, coaching, retired volunteering, and independent music. Every session was driven in headless
Chromium against the running app at a real laptop viewport, with real clicks and keypresses. Nothing
here is read off the source. The wish list is **candidate material, not promises**.

The first fleet covered the origin user, two compute-heavy audiences, a prose writer, a PKM skeptic
and a bounce-risk. The second covered how the app is *operated* (keyboard-only, touch) plus table,
teaching and lab use. Neither fleet contained a single person whose work is a **trade or a
household** — the audiences most likely to be doing arithmetic on a laptop at a kitchen table.

## The briefing

Each persona was briefed on `product-identity.md` before touching the app, so that the wish list
would be about this product rather than about a different one. What they were told, in short:

- **The core is the `{…}` engine**: any point can generate or compute. Strip the engine and it is
  Workflowy. (§1)
- **It is an instrument for thinking in writing, not a filing system.** Not a second brain; a pill is
  live on *this* look, not archived for a later sorting session. (§2, §2c)
- **Two guaranteed freedoms**: no rigid schema, and no lock-in. Structure is always one rendering of
  plain text you can walk away from. (§3b)
- **The never-build list is closed**: no accounts, no backend, no team collaboration, no cloud
  default, no second authoring language, no code execution from documents. (§5)
- **It is not being sold.** Nobody needs converting; the only property worth having is
  invitingness. (§3c)

**The briefing did its job, and it is worth recording what it suppressed.** Unbriefed, three of these
six would have opened with "can my partner/client/committee see this too" — the single most common
ask from a laptop user in 2026. Briefed, all three re-aimed at the exit instead: Dmitri wanted a
better invoice *file*, Bea wanted a shopping list she could send, Ruth wanted something to hand the
society. Those are `§3b` freedom-to-leave asks, and they are actionable. Nobody asked for AI, sync,
or a mobile app. **One ask survived the briefing and still violates it**, and it is recorded below
rather than quietly dropped (Ruth, "let me lock a record so I cannot fat-finger it" — a schema, and
§3b says freeform wins).

## Verdicts

| Persona | Who | Verdict |
|---|---|---|
| **Sione** | strength coach, 14 clients; today a Google Doc he re-types every mesocycle | **Yes.** The strongest session in this fleet |
| **Kofi** | independent musician self-releasing an album; today a spreadsheet and a lot of hope | **Yes**, for the money he cannot pin down |
| **Nkechi** | owns a 12-table bistro; today a notebook, a calculator and one haunted spreadsheet | **Yes, for costing**, once someone shows her where the total goes |
| **Bea** | runs a household of five; today the notes app and a whiteboard | **Yes, cautiously.** The tour taught her; the command list nearly untaught her |
| **Dmitri** | freelance RU→EN translator; today Excel plus a calendar | **Alongside.** He can compute each job and cannot total them |
| **Ruth** | retired, transcribes parish records for the local-history society | **No, not yet.** The app tells her she has no dates. She has 4,000 |

## What they liked

**The propagation demo lands in every domain, and it is the reason four of them said yes.** It is
§7's three-minute story with the nouns swapped, and it was driven end to end in each session:

Sione keys a block off one number, then a client tests a new max and he retypes one point:

```
{onerm := 140}                    →   {onerm := 152.5}
Week 1, 70%  onerm * 0.70 =  98        =  106.75
Week 2, 75%  onerm * 0.75 = 105        =  114.375
Week 3, 82%  onerm * 0.82 = 114.8      =  125.05
Week 4, 60%  onerm * 0.60 =  84        =   91.5
```

> **Sione:** *"That is my Sunday night. Four clients test in a week and I redo four documents by
> hand, and I get it wrong often enough that I check twice. This is the same document telling me the
> answer."*

**And the gym has 2.5kg plates, which the app already knows how to think about.** `roundto(x, step)`
is shipped, documented in `guide/computing-numbers.md`, and gives exactly what he needs:
`round(onerm * 0.70 / 2.5) * 2.5` and `roundto(106.75, 2.5)` both give **107.5**. He did not have to
ask for a feature; he had to find a function, and the guide has it.

**Kofi got the thing nothing else on his laptop gives him: a number he does not know, treated
honestly.** A vinyl run quoted between £900 and £1,400, composed into a total, then interrogated:

```
{pressing := 900 to 1400}        →  ≈ 1,133 (904.2 – 1,394) ▂▃▅▆▆█▆▄▃▂▂
Fixed costs {fixed := 590}       →  590
Total {total := pressing + fixed} → ≈ 1,723 (1,494 – 1,984) ▂▃▅▆▆█▆▄▃▂▂
Chance it goes over 1800          →  chanceover(total, 1800) = 28.2 %
Worst case to plan for            →  percentile(total, 90)  = 1,924.5876
```

> **Kofi:** *"A spreadsheet makes me pick a number I do not have. This one let me say what I actually
> know, and then told me there is a 28% chance I blow the budget. I have never been able to ask that
> question before, so I never asked it."*

**Ruth's records surprised her with themselves.** `{roll: #unverified}` over her own transcription
notes returned *"Next to check: Ellen Marsden parentage"*. This is §2c's resurfacing mechanic doing
its job about as far from a game table as it gets.

> **Ruth:** *"I have a list of eleven things I cannot prove and I always chase the same three. It
> picked one I had forgotten I wrote down."*

**Bea's first screen taught her without a manual.** She has never typed a curly brace on purpose. The
shipped tour gave her, above the fold: the atom (`Click this: 2d6` → she clicked, it rolled), the
sentence explaining what a pill is and how to make one, and then a worked budget with
`Spent sum(cost) = 390, budget - sum(cost) = 10 left` and a check that flips to a flag. It also tells
her to *push on it*: "Click the 180 chip, make it 260, save."

> **Bea:** *"I understood it from the page. I did not click help once. That basically never happens
> to me."*

**Other things that simply worked**, each driven rather than assumed: per-row computation from a
point's own properties (`Pharma SOP set  words * rate = 1,562`, thousands grouped with no setup);
links resolving to their captions in running prose (`Married Hannah at St Chad`); the backlinks panel
(`Linked from · 1 · Josiah Sowerby, married Hannah`); the agenda listing three deadlines in date
order; `{roll: #song #uptempo}` narrowing a draw by two tags; unit conversion
(`convert(180, g, kg) = 0.1800`); and markdown export freezing pills to their values, which is what
Dmitri wants in an invoice. Zero page errors in any session.

## What they did not like

### 1. Pre-1900 dates are silently not dates, and the timeline says she has none

**Ruth's whole use case, and the only hard "no" in the fleet.** Three points carrying
`date: 1812-03-04`, `1831-06-12`, `1889-11-02`. The property chip renders in the outline. The
timeline shows **"No dated points here yet"** on every tab.

Measured to the exact cutoff, one fresh page per year:

| year | reaches the timeline |
|---|---|
| 1850, 1880, 1890, 1895, **1899** | **dropped** |
| **1900**, 1901, 1905, 1910, 2026 | shown |

Root-caused to the pure parser, not the timeline. `parseDueDate('1889-11-02')` is **`null`**;
`parseDueDate('1900-01-01')` is `-25567`. The constraint is deliberate and, for its original
purpose, correct:

```js
// sane scheduling window — a due date in the year 3331 is a typo, not a plan
if (y < 1900 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
```

**One validity window is serving two different jobs.** A *deadline* in 1889 is a typo. A *birth* in
1812 is data — and the timeline's own help text invites it: *"lore events (a point with a `when` or
`date` property)"*. Both `date:` and `when:` are affected, so the key the help text names is the key
that fails. The failure is silent in the worst direction: the chip still displays, so the document
looks dated, and the view reports an empty state that is not true.

> **Ruth:** *"It showed me my three events in the list and then told me I had no dates. I would
> assume I had done it wrong and stop."*

### 2. The explanation for a failed formula is behind a hover

Every persona who mistyped a formula got the same generic transient message, **"Not recognized, so it
stays plain text"**, and the text stayed plain. The real teaching exists and is excellent — it is
just in a `title` attribute:

| what she typed | what she sees | where the explanation is |
|---|---|---|
| `twice {= cost * 2}` | plain text + a flash: *"Not recognized, so it stays plain text"* | `.brace-attempt[title]`: *"…a name with no value here. A property is read from this point and the points above it, so a value on a sibling is out of scope: move it here or to a parent, or declare it as a variable like `{cost := 40}` to use it anywhere."* |
| `{= total * 1.2}` on an estimate | plain text + a red `estimate, not math` tag | `.brace-attempt[title]`: *"…Write it without the `=` to keep it an estimate, like `{cost * 2}`."* |

Measured: the `.brace-attempt` span has **no `tabindex` and no `role`**, so it is not focusable — the
sentence is reachable by mouse-hover only. Both of those sentences are the product of deliberate
work (#1159, #1127) and both would have unblocked the person who needed them.

> **Nkechi:** *"It said it was not recognised. I assumed I had the wrong app for this and moved on."*

### 3. `sum()` on the wrong point is a dead end, and the app has this exact coaching elsewhere

**Three of six hit this independently** — Nkechi, Dmitri and Kofi all wrote the total as a *sibling*
of the costed points rather than on their parent, which is where a person naturally writes a total:

```
Sea bream
  Bream fillet   cost: 4.10
  Fennel         cost: 0.55
  Butter, lemon  cost: 0.40
  Plate cost  sum(cost) = 0 nothing matched     ← her instinct
```

Moving the same expression onto the parent gives `Sea bream, plate cost sum(cost) = 5.05`.

`nothing matched` is honest, which is P4 satisfied and worth keeping. But it is a terminus. And the
app demonstrably knows how to do better one keystroke away — typing a bare `key: number` produces a
precise, actionable tip naming the exact command:

> *"Tip: to total or check portions later, add it as a number: type `/prop:portions=24`, or use the
> point menu, Add property."*

Verified on a fresh page per case, so nudge ordering cannot explain the difference.

### 4. A rollup sees stored properties but not computed pills

Dmitri's is the sharpest version. Each job computes its own fee from its own properties, beautifully:

```
Pharma SOP set     words * rate = 1,562
Museum catalogue   words * rate =   952
Contract addendum  words * rate =   304
```

Then the obvious next step, `{= sum(fee)}` on the parent, gives **`0 nothing matched`**. Storing the
same three numbers as plain `fee` properties gives **`2,818`**. So the ceiling is exactly at the
point where the engine has just proved itself.

> **Dmitri:** *"It did the hard part per line and then could not add up its own column. I would have
> to type the answers back in, which is the thing I came here to stop doing."*

### 5. The engine is below the fold of its own front door

Bea's route in. "All commands" is the one toolbar button whose label reads like a menu to a
non-technical user. It opens 74 commands; **12 are visible without scrolling**, and the first
generative one is at **index 13**:

> Bullet · Numbered · To-do · Heading 1 · Heading 2 · Heading 3 · Paragraph · Code block · Divider ·
> Quote · Secret · Base · Query base · **Template** …

Every command she can see is formatting. §1 says the engine is the 10% that would still make the app
worth using, and §8b names *"the app living as a nice outliner with some clever commands"* as the
falsification test. The front door currently presents the outliner.

> **Bea:** *"The document taught me the clever thing and then the menu of everything did not have it
> in it. I assumed the clever thing was a demo, not something I could do."*

### 6. Smaller, but every numbers persona mentioned it

Default precision reads like machine output on money. `percentile(total, 90) = 1,924.5876`,
`margin = 69.034483 %`. The per-pill number-format door is real and good (Decimal places,
Significant figures, Prefix, Suffix, with a live preview), but a person meets the six-decimal version
first. Searching for it is also indirect: typing `/format`, `/currency` or `/decimal` surfaces **Math**
and **Estimate**, and `/money` surfaces nothing.

## What they would miss going back

- **Sione:** *"Re-typing four documents by hand and hoping."*
- **Kofi:** *"Being allowed to not know a number."*
- **Nkechi:** *"One number changing and the whole menu following it."*
- **Ruth:** *"The thing that picked a record for me. I would want that even if nothing else worked."*
- **Bea:** *"Clicking the dinner until it says something we can all live with."* (Four clicks:
  Chicken curry, Leftovers, Pasta bake, Stir fry.)
- **Dmitri:** *"Each line working itself out."*

## Most-wanted (candidate direction, not commitments)

Ordered by how many personas it unblocks, and filtered against §5 first.

1. **Let a rollup see computed values, or say plainly that it cannot.** (Dmitri, Nkechi, Kofi) The
   larger version is a real design question — a computed pill is not a property, and making it one
   may be the wrong answer. The small version is P4 and cheap: `sum(fee) = 0 nothing matched` when
   `fee` is a *pill on every child* is a distinguishable case, and could say so.
2. **Give the failed-formula explanation a visible home.** (all six) The sentences already exist and
   are good. They are in a `title` on an unfocusable span.
3. **Coach the sum-on-a-sibling case** the way the app already coaches `key: number`. (Nkechi,
   Dmitri, Kofi)
4. **Let a historical date be a date.** (Ruth) The scheduling typo window is right for `due:`/`start:`
   and wrong for `when:`/`date:`. Ruth's own framing was modest: *"I do not need it to plan anything.
   I need it to believe me."*
5. **Put the engine where the front door opens.** (Bea, Nkechi) Not a new feature — an ordering
   question about the first twelve rows of one list.
6. **A money-shaped default, or a faster route to one.** (Nkechi, Kofi, Dmitri)

**Recorded and NOT recommended, because it fails the briefing:** Ruth asked for a way to *lock* a
record so a verified transcription cannot be edited by accident. That is a rigid schema and §3b says
freeform wins by default; it is also the "opt-in per-column constraint" already fenced in
`base-views-vision.md` §0.5. Recorded here so the next reader finds the argument rather than the ask.

## Method notes, including four errors of my own

Sessions were driven with real clicks and keypresses at 1280x800, 1440x900, 1536x864 and 1920x1080.
Four things I measured wrongly first, all caught before they reached this document:

1. **I edited `node.text` directly and called `render()`**, which does not re-promote a brace, and
   read the resulting raw text as a defect three separate times. Every claim about a *changed* value
   in this document is driven by real typing through the edit-commit path instead.
2. **I invented a function name** (`allCommandsPool`) for the command catalogue, got `[]` for every
   query, and nearly recorded "the palette finds nothing for money" as a finding. The real numbers
   in §6 come from typing into the real palette.
3. **I read hint text by polling after the fact.** Hints are transient and the element keeps its last
   text after hiding, so this reported messages the user never saw *and* missed messages they did.
   Replaced with a MutationObserver that records coaching as it fires, plus one fresh page per case
   so nudge ordering cannot confound the result.
4. **The timeline finding was wrong twice before it was right.** First a negative regex over whole-body
   text matched an empty-state string belonging to a different panel; then a positive containment test
   matched the *outline's own copy* of the point and reported "visible" for 1812. The reliable
   discriminator turned out to be mention-count with the panel open versus closed, one fresh page per
   year — which is how the cutoff was pinned to exactly 1900-01-01 and then root-caused to
   `parseDueDate`.

**One question this fleet could not settle.** Sione's board: `mtSetView(base, 'board')` sets
`node.mtView` to `{kind:'board', groupBy:1}`, but the rendered output stayed a table through a
subsequent `render()`, with no lanes and no refusal message. I could not find the user-facing door in
the harness, so this is **untested, not broken** — it needs a session driven through the real view
control before anything is claimed about it.
