# Computing numbers

*Part of the [generative & computational guide](README.md). This is the **Compute** family:
pills that do math, including arithmetic, dates, sums that roll up your outline, uncertain
estimates, and pass/fail checks.*

The core is one syntax: **`{= expression}`**. The leading `=` says "compute this." Type it, click
away, and you get a math pill showing the result. Unlike a dice roll, **a math pill is live**: it
recomputes on its own whenever something it depends on changes.

The **`@` → Math** dialog gives you the same thing with a live preview and a function reminder.

---

## Expressions

Ordinary arithmetic, the operators you'd expect:

```
{= 2 + 3 * 4}        → 14   (× before +)
{= (2 + 3) * 4}      → 20
{= 2 ^ 10}           → 1024 (power)
{= 17 % 5}           → 2    (remainder)
{= sqrt(144)}        → 12
```

Precedence runs the usual way: `^` before `× ÷ %` before `+ −`, with parentheses to override.
You can use `×` `÷` `−` and `√` if you like typing them; `pi`, `e`, `tau` are built in.

---

## Functions

Call a function with parentheses. The big ones:

**Math:** `sqrt abs floor ceil round trunc sign cbrt exp` · `sin cos tan asin acos atan atan2` ·
`ln log log2 log10` · `deg rad` · `pow(x,y) hypot(a,b)` · `min(…) max(…) avg(…)` (two or more args) ·
`clamp(x, lo, hi)` · `gcd(a,b) lcm(a,b)` · `roundto(x, step)` rounds to the nearest step
(`roundto(7.3, 0.5)` → 7.5, `roundto(112, 25)` → 100).

**Percentages:** `pctof(part, whole)` → part as a % of whole; `pctchange(from, to)` → % change.

**Conditionals**, two equivalent forms:

```
{= hp > 0 ? "alive" : "dead"}     ternary
{= if(hp > 0, hp, 0)}             function form
```

Comparisons (`> >= < <= == !=`) return `1`/`0`, so they compose with arithmetic.

**Logic:** combine comparisons with `and(…)` / `or(…)` (two or more args, like `min`/`max`) and
flip one with `not(x)`. Nonzero counts as true; the result is `1`/`0`, so logic nests anywhere a
number goes:

```
{= and(hp > 0, gold > 0)}         → 1 only when both hold
{= if(or(hp < 5, cursed), 0, 1)}  works inside if(…) too
{= not(done)}                     → 1 when done is 0
```

---

## Units

Conversions are just functions, named `from2to`:

```
{= c2f(20)}      → 68      Celsius to Fahrenheit (and f2c the other way)
{= km2mi(10)}    → 6.21    and mi2km, m2ft, ft2m, cm2in, in2cm
{= kg2lb(70)}    → 154.3   lb2kg
{= mph2kmh(60)}  kmh2mph, l2gal, gal2l
```

---

## Dates

Dates work as plain numbers (epoch-days), so they **compose with arithmetic and variables**. The
constant **`today`** is the anchor:

```
{= today + 7}              a week from now
{= date(2026, 12, 25)}     a specific calendar date
{= daysuntil(due)}         days from today to a `due` value (negative if past)
{= daysbetween(a, b)}      whole days between two dates
{= workdaysbetween(a, b)}  Mon–Fri days only (no holiday awareness, by design)
{= addmonths(due, 3)}      3 calendar months later; Jan 31 + 1 month clamps to Feb 28/29
{= weekday(today)}         0 = Sunday … 6 = Saturday
{= weeknum(today)}         ISO week number · {= eom(due)} last day of that month
{= age(date(2000, 5, 14))} whole years since a date (birthdays, anniversaries)
{= year(due)}  month(due)  day(due)  quarter(due)
```

A math result that's a date renders as an **ISO date** automatically when you wrap it in
`asdate(...)`:

```
{= asdate(today + 90)}     → 2026-09-13
```

> Dates also live as point **properties** (`start` / `due`) with their own scheduling UI; see the
> `/due` "Schedule" command. The functions above let you *compute* with those dates.

---

## Variables in math

Declare a variable once (**`@` → Variable**, e.g. `r = 5`) and reference it bare inside an
expression:

```
r = 5
{= 2 * pi * r}     → 31.4   (circumference)
{= pi * r^2}       → 78.5   (area)
```

Variables can reference other variables (`area = pi*r^2`). Change `r` and every dependent pill
updates live. A variable that holds *text* (a quoted string or a random pick, both below) can't be
used as a number; it fails visibly rather than guessing.

**Declare one by typing.** Besides the `@` → Variable dialog, you can write a declaration inline
with `:=`, the same way you type any other pill:

```
{rate := 0.2}      declares `rate` = 0.2, right where you type it
{= cost * rate}    then use it anywhere below
```

A `{name}` reference resolves to the nearest `{name := …}` declared above it, so the same name can
mean different things in different parts of a long document.

The right side can name another variable, not just a literal: `{total := base}` makes `total` track
`base`, and `{markup := cost * 1.2}` is a live formula. It keeps working even if you declare it before
the variable it points at, the value fills in (and updates) as soon as that variable exists.

**A variable can hold text, not just a number.** Put it in quotes and the value is that exact string,
useful for a name you reuse, a label, a status word:

```
{client := "Acme Corp"}    a fixed text value
{client}                   drops in "Acme Corp" everywhere
```

Without quotes a bare word is read as a generator rule, not text, so quote anything you mean
literally. Options split on the bar make a **random pick** instead (`{tone := warm | cool}`, re-rolls
on click). A text variable is for writing and generators; it can't be used inside `{= …}` math (math
is numbers only, and a text value there fails visibly rather than guessing). A pick whose result is a
**number** works in math, though: `{r := 1d20}` captures one die roll, and `{= r + 5}` or a
conditional like `{r == 20: Critical!}` can then read it (see
[Test a captured roll](generating-text.md#test-a-captured-roll-crits-and-checks) for the full
crit-check pattern). You can also build any of
these from the **`@` → Variable** dialog if you prefer a form to typing.

### Properties are variables too, and they inherit

A point's own numeric **properties** are visible to its math pills by their key. Give a point a
`STR: 14` property and a `{= STR + 2}` pill on that same point reads **16**, no separate `{STR := …}`
declaration needed.

Properties also **inherit down the outline**. A pill reads any numeric property set on an **ancestor**
point, so you can put shared values on a parent and use them in the children:

```
Character
  STR: 14
  Scene: strength is {= STR + 2}     → 16   (STR inherited from the character)
```

The **nearest** value wins: a point's own property overrides the same key on an ancestor, and a
nearer ancestor overrides a farther one. So a scene with its own `STR: 20` reads **22**, not 16. This
is the natural way to keep a character sheet, a per-section config, or any set of values that a
subtree should share. (Only numbers inherit, and only *down* the tree; a value on a sibling or a
child is not in scope.)

---

## Roll a number up your outline (aggregation)

This is the one that makes the math pill see the *tree*. A `{= …}` expression can **roll up a
property of the point's direct children**:

```
{= sum(cost)}      add up every child's `cost`
{= avg(score)}     average them
{= count(cost)}    how many children have a `cost`
{= min(cost)}      smallest · {= max(cost)} largest
```

The argument (`cost`, `score`) is a **property key**, not a value. To use it:

1. Give each child point a property (bullet menu → **Add property**), e.g. `cost: 12`.
2. On the parent, write `{= sum(cost)}`.

By default a roll-up counts the **direct children**. Add a scope to reach deeper:

```
{= sum(cost, subtree)}   total every descendant, all the way down
{= sum(cost, 2)}         reach two levels down (children + grandchildren)
{= sum(cost, children)}  the direct children (same as no scope)
```

It recomputes **live** as you add, remove, or edit children, like a spreadsheet column total.
You can combine aggregations with the rest of math: `{= sum(cost) / count(cost)}` is the average
the long way; `{= sum(hours) * rate}` mixes a rollup with a variable.

Numeric properties roll up; date-shaped ones roll up as epoch-days (so `max(due)` finds the latest
deadline, wrap it in `asdate(...)` to display it as a date).

**Count words, not properties.** The same `{= …}` form also counts prose over a **scope** instead
of a property:

```
{= words(subtree)}    self + every descendant (recurses the whole branch)
{= words(self)}       just this point's text + note
{= words(children)}   this point and its direct children
```

So a heading can carry a live word total of everything under it, and reading time is just
composition: `{= words(subtree) / 200}` (about 200 words a minute). The `subtree` / `children` scope
here is the same vocabulary the property rollups take, so `sum(cost, subtree)` and `words(subtree)`
reach exactly as deep as each other.

---

## Uncertain values (estimates)

Some numbers aren't a single value; they're a *range*. An **estimate** pill models that with a
quick Monte-Carlo simulation and shows you the **mean with a low-to-high range** in parentheses
(e.g. `7.2 (5 to 10)`) plus a little sparkline of the distribution. Build one in
**`@` → Estimate**, or type the shorthand:

```
{5 to 10}          a 90% confidence range (5th to 95th percentile)
{normal(8, 2)}     a normal distribution, mean 8, std-dev 2
{uniform(1, 6)}    flat between 1 and 6
```

They do arithmetic, and the uncertainty propagates:

```
{(5 to 10) * (2 to 3)}      multiply two uncertain values
```

Click the pill to **re-sample**. The result is reproducible (it stores a seed, not the samples),
so it survives save/reload and exports.

**Rolling up estimates:** like `sum(cost)`, an estimate can aggregate **children's uncertain
properties** with `sum(effort)` / `avg(effort)` over child points whose `effort` property is itself an
estimate. That's how you Fermi-estimate a whole project from uncertain parts (see the
[Cookbook](cookbook.md)).

> Estimates are a **separate engine** from `{= …}` math (a distribution isn't a single number), so
> you can't put an estimate inside a `{= …}` expression; it fails visibly if you try.

---

## Make the outline check itself (constraints)

A **check** is a pass/fail rule you attach to a point. Type **`/check:sum(cost) <= budget`** to set it
inline, or **`/check`** on its own (or bullet menu → Add check) for the dialog. It's an `evalMath`
boolean over the point and its children:

```
sum(cost) <= budget        the kids' costs must fit a `budget` property
count(score) >= 3          at least three scored children
hours <= 8                 the point's own `hours` property
max(due) <= deadline       no child due after the deadline
and(hours <= 8, cost <= cap)   two rules in one check (or(…) / not(…) work too)
```

The point grows a small chip: a muted **✓** when it passes, a visible flag when it **fails** or
can't evaluate. To sweep the whole document for problems, search **`is:failing`**, which lists every
point whose check fails or errors. (Same machinery as [aggregation](#roll-a-number-up-your-outline-aggregation):
zero new syntax, just a boolean.)

---

## Progress bars

Drop **`[/]`** or **`[%]`** in a point (or use **`@` → Progress**) for a live tally of its
checkboxes and child to-dos (org-mode calls these *cookies*):

```
Packing [/]      → Packing [2/5]
Packing [%]      → Packing [40%]
```

It counts each checkbox in the point plus each child task, and updates as you tick things off.
It's plain text in the point, so there's no setup, and it round-trips through save for free.

---

## Table formulas (briefly)

A markdown table can carry a spreadsheet-style formula line, Org-mode style:

```
| item   | qty | each | total |
|--------|----:|-----:|------:|
| rope   |   2 |    5 |    10 |
| arrows |  20 |  0.1 |     2 |
#+TBLFM: $4 = $2 * $3
```

The `#+TBLFM:` line computes the column and is hidden in the rendered table. For richer
spreadsheet-like grids, the **`/base`** command makes an interactive base. (Tables are a deeper
topic; this is just the pointer.)

---

**Next:** the [Cookbook](cookbook.md), ready-to-paste recipes that combine generate + compute: a
budget that rolls up and lints itself, a deadline countdown, a Fermi estimate, and more. Or revisit
[Generating text](generating-text.md).

**Back to:** [the guide](README.md).
