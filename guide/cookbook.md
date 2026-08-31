# Cookbook

*Part of the [generative & computational guide](README.md). Finished recipes: paste one into your
document, push on it, keep what earns its stay. Each starts from an itch, not a feature; the
features are named quietly on the way out.*

You know the one big idea (braces become pills). Everything below is that idea meeting an ordinary
week.

---

## How to use these

- Each recipe is a handful of points, shown indented as they nest. Paste the block in and tidy, or
  retype it; none is long. The `{…}` parts become live pills the moment you click away.
- Lines shaped like `name: choice | choice` are **grammar rules**. They go in the **`@` then
  Grammar** dialog, one rule per line, never straight into a point (typed into a point they stay
  plain text). Once defined, `{name}` calls the rule from anywhere in the document.
- `{prop key: value}` typed in a point becomes a **property** chip; the point's bullet menu (Add
  property) does the same by form.
- A **check** is set with `/check` on the point (inline works too: `/check:sum(cost) <= budget`).
- Every name, number and word here is yours to change. A recipe is a starting shape, not a form to
  fill in.

---

## 1. The plan that admits it is a guess

Every task in the project is "two days, maybe five." Add up the maybes and you get one confident
number that nobody believes, least of all you. Keep the maybes.

```
Redo the garden
  Clear the beds {prop effort: 2 to 4}
  Build the raised planters {prop effort: 6 to 12}
  Irrigation {prop effort: 3 to 10}
  Planting {prop effort: 2 to 5}
```

Then, on the top point, open **`@`** and choose **Estimate**, and type `sum(effort)` in the
dialog. (This one roll-up is dialog-made; a `{sum(effort)}` you type inline stays plain text.) The
pill shows the mean with a low-to-high range and a sparkline: days, honestly held.

Click it to re-sample. Then tighten the range on the part that scares you most and watch how much
of the total's spread was really that one line; in the same dialog, `sum(effort) / 4` turns days
into weeks at four good days a week. The parts are estimate properties; the total is an estimate
roll-up.

## 2. A budget that keeps up with the spending

Costs never sit in one tidy list. They hide under rooms, sub-plans, notes to self, three levels
down. The total should not care where they live.

```
Renovation, spent so far: {= sum("has:cost", cost)} {prop budget: 5000}
  Bathroom
    Regrout the shower {prop cost: 350}
    New vanity {prop cost: 900}
  Kitchen
    Paint {prop cost: 150}
    The tap that started all this {prop cost: 210}
```

Then, with the top point selected, add the check:

```
/check:sum("has:cost", cost) <= budget
```

Now any point below that carries a cost joins the total, however deep you file it, and the top
point wears a quiet ✓ that becomes a visible flag the moment the plan outgrows the number. Search
`is:failing` to sweep a whole document for broken budgets at once. The total is a query reducer;
the flag is a check.

## 3. Nine dollars a month is never nine dollars

Subscriptions are priced to feel like nothing. The year is where the truth lives.

Type `/base` and fill in these rows (or paste this table into a point; its hover `▦ base` button converts it):

```
| Service   | monthly |
| --------- | ------- |
| Streaming | 12      |
| Music     | 11      |
| Cloud     | 3       |
| News      | 15      |
```

Open the base's bullet menu, choose **Use rows as variables**, and name it `Subs`. Then, on a
point below:

```
A year of this: {= sum(Subs.monthly) * 12}
```

Add the one you forgot and watch the year lurch. Any single cell is readable too:
`{= Subs.News.monthly * 12}` prices one habit on its own, which is a useful thing to stare at.
The table is a variable base; the total is a live column sum.

## 4. Monday morning, in one place

The week's actual demands are scattered through the document, filed wherever you were standing on
braver days. Let the document round them up.

```
This week
  {query: is:todo due:week}
  Overdue right now: {count: due:overdue}
```

Give tasks dates as you write them (`/due:tomorrow`, `/due:2026-08-14`) and the list rewrites
itself as you work; click any row to jump to the real point. If you keep typing the same search in
the box anyway, star it there and it becomes a one-click saved search. The list is a query pill;
the number is a count pill.

## 5. The reading pile that only offers what is left

Choosing the next book is somehow harder than reading it. Delegate the choosing, keep the veto.

```
To read [/] · next: {roll: is:todo #book}
  - [ ] The Overstory #book
  - [ ] Piranesi #book
  - [ ] A Wizard of Earthsea #book
  - [ ] Thinking in Systems #book
```

Click the pill for a nomination; it stays put until you click again. Tick a finished book and it
leaves the pool for good, so the pill can only ever offer what you have not read, and the `[2/4]`
fills as you go. Add a fifth book with the same tag, anywhere in the document, and it joins the
pool. The pick is a roll over the open tagged points; the tally is a progress cookie.

## 6. Proof the chapter grew today

An hour of fiddling with commas feels exactly like writing. The count knows the difference.

```
Chapter 3, the confession {= words(subtree)}
  (your scenes and paragraphs as points below)
```

For a session floor, add a check to the chapter point:

```
/check:words(subtree) >= 800
```

The count is live, and your margin notes do not pad it (per-point notes stay out unless you ask).
Somewhere mid-session the chip flips from flag to ✓, which is a better stopping bell than a timer;
reading time is one more pill away, `{= round(words(subtree) / 200)}` minutes. The counter is a
word roll-up; the floor is a check.

## 7. One and a half times the banana bread

Scaling a recipe is six small multiplications done in your head, at least one of them wrong.

```
Banana bread {batch := 1.5}
  flour {= 250 * batch} g
  butter {= 115 * batch} g
  sugar {= 180 * batch} g
  bananas {= round(3 * batch)}
  oven {= round(f2c(350))} C, 55 min
```

Edit the `1.5` and every quantity follows, live. The oven does not scale, so it gets a unit
conversion instead; `convert(x, from, to)` handles cups and milliliters the same way when the
cookbook and the kitchen disagree. The knob is a declared variable; the quantities are math pills.

## 8. Whose turn it is, settled

Rotas fail because someone has to remember them, and remembering is a chore too.

```
Dishes tonight: {cycle: Ana | Sam | Jo}
Deep-clean this weekend: {cycle: kitchen | bathroom | windows | fridge | oven}
```

Click to advance: it never re-rolls, it takes the next turn in order, and its place is saved with
the document, so next weekend picks up exactly where this one left off. If strict order breeds
dread, swap `cycle` for `shuffle` and it deals every item once in random order before starting
over. These are deck pills (`cycle` and `shuffle` modes).

## 9. A pros-and-cons list that finally votes

The classic list just sits there, pros on the left, cons on the right, refusing to conclude.
Score the lines and let each option total itself.

```
Move to Lisbon {= sum(score)}
  Rent drops by half {prop score: 3}
  Winter with actual light {prop score: 2}
  A day's travel from family {prop score: -3}
  Starting over on friends {prop score: -2}
Stay put {= sum(score)}
  The flat is finally right {prop score: 2}
  The job is fine, which is the problem {prop score: -1}
  Everyone I love is an hour away {prop score: 3}
```

Cons score negative; the totals update as you weigh. The useful moment is usually not the number,
it is noticing which total you were hoping for. Re-scoring is allowed; that is data too. The
totals are property roll-ups.

## 10. Journal entries that stop starting the same way

"Today I" is where journals go to die. Keep a small stock of questions that refuse to be answered
on autopilot.

Make a point called Journal prompts, open **`@`** then **Grammar** on it, and add:

```
prompt: What did you avoid {when}? | What surprised you {when}? | What would {person} say about how {when} went? | What are you pretending is fine?
when:   today | this week
person: your ten-years-older self | your harshest friend | a stranger reading this page
```

Rule names are document-wide, so in any day's entry (type `/journal` to open today's) just write:

```
{prompt}
```

Re-roll until a question lands somewhere real, then answer that one. Feed the rules as you learn
which questions actually get you writing; the generator is only as sharp as what you give it. The
questions are grammar rules, callable by name from anywhere.

---

## Where these come from

Pointliner was born at the solo-RPG table, and the [solo RPG guides](solo-rpg/README.md) are the
fullest worked examples of these same pieces (rules, decks, oracles, sheets and a journal running
a whole campaign in one document), each with an importable demo.

---

**Next:** the two deep guides, [Generating text](generating-text.md) and
[Computing numbers](computing-numbers.md), explain every piece these recipes lean on.

**Back to:** [the guide](README.md).
