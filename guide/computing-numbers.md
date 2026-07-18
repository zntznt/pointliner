# Computing numbers

*Part of the [generative & computational guide](README.md). This is the **Compute** family:
pills that do math, including arithmetic, dates, sums that roll up your outline, uncertain
estimates and pass/fail checks.*

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
`clamp(x, lo, hi)` · `roundto(x, step)` → round to the nearest step (5, 25, 0.5) ·
`gcd(a, b) lcm(a, b)`.

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

There are two ways to convert. The pair-functions named `from2to` are handy for the common
ones, including temperature (a shift, not a ratio, so it stays a function):

```
{= c2f(20)}      → 68      Celsius to Fahrenheit (and f2c the other way)
{= km2mi(10)}    → 6.21    and mi2km, m2ft, ft2m, cm2in, in2cm
{= kg2lb(70)}    → 154.3   lb2kg
{= mph2kmh(60)}  kmh2mph, l2gal, gal2l
```

Or use the general `convert(x, from, to)`, which reads the unit names as words and works across a
whole table of built-in units. Many are ready with nothing to set up:

```
{= convert(10, km, mi)}    → 6.21    length: m, km, cm, mm, mi, yd, ft, in
{= convert(70, kg, lb)}    → 154.3   mass: kg, g, mg, lb, oz, stone
{= convert(2, l, cup)}     volume: l, ml, gal, qt, pt, cup
{= convert(90, min, hr)}   time: s, min, hr, day, week
```

Conversions only work **within one dimension**: converting a length to a mass is left unresolved
(shown as `#ERR`) rather than guessed. The result is an ordinary number, so it composes with the
rest of math: `{= convert(weight, kg, lb) * price_per_lb}`.

### Your own units

When the built-ins aren't enough, teach the document your own, like a currency or a fictional
measure. Open **File then Custom units** and declare them one per line:

```
cp                a bare name is a new base unit (copper pieces)
sp = 10 cp        "name = number unit" relates it to an earlier line
gp = 10 sp        so gp chains up: 1 gp = 100 cp
league = 3 mi     or extend a built-in dimension (leagues are length)
```

Then convert across your table like any other unit:

```
{= convert(2, gp, cp)}     → 200
{= convert(5, league, km)} → 24.14
```

A bare name starts a new dimension of its own; `name = number unit` relates it to a built-in
(`m`, `kg`, `l`, `s`, and their friends) or to a unit you defined on an earlier line. Reopen the
dialog any time to edit, or **Clear units** to remove them (the built-ins always stay).

---

## Dates

Dates work as plain numbers (epoch-days), so they **compose with arithmetic and variables**. The
constant **`today`** is the anchor:

```
{= today + 7}              a week from now
{= date(2026, 12, 25)}     a specific calendar date
{= daysuntil(due)}         days from today to a `due` value (negative if past)
{= daysbetween(a, b)}      whole days between two dates
{= workdaysbetween(a, b)}  Mon-Fri days between (exclusive end)
{= age(born)}              whole years from a date to today
{= addmonths(due, 3)}      shift a date by whole months (day clamped, like EDATE)
{= eom(due)}               the last day of that month
{= weeknum(due)}           ISO 8601 week number
{= weekday(today)}         0 = Sunday … 6 = Saturday
{= moonphase(due, 28, 0)}  a moon phase glyph (period, offset in days)
{= year(due)}  month(due)  day(due)  quarter(due)
```

**Moons.** `moonphase(date, period, offset)` gives the fraction 0..1 through a lunar cycle
(0 = new, 0.5 = full): `period` is the cycle length in days, `offset` is the epoch-day of a
known new moon. A **bare** `{= moonphase(…)}` pill shows the matching glyph 🌑🌒🌓🌔🌕🌖🌗🌘;
compose it (`{= floor(moonphase(due, 28, 0) * 8)}`) to get the phase number instead. For a
second moon, add another call with its own `period` and `offset`.

`year`, `month`, `day`, `quarter`, `age`, `eom` and `addmonths` follow a **custom calendar**
when the document has one; `weeknum` (ISO) and `workdaysbetween` (Mon-Fri) use the ordinary
Mon-Sun week.

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
updates live. To see every variable in the document with its current value, open the **Variables
panel**: type `/variables`, press `Ctrl/Cmd+Shift+V`, or use the toolbar. A variable that holds *text* (a quoted string or a random pick, both below) can't be
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
is the natural way to keep a character sheet, a per-section config or any set of values that a
subtree should share. (Only numbers inherit, and only *down* the tree; a value on a sibling or a
child is not in scope.)

---

## Variable bases (a table of variables)

Keep a stat block, a price list, or any table of named things in a **base**, and read every cell as
a variable. Open the base's bullet menu and choose **Use rows as variables**: each row then declares
one variable per column, named `Row.Column`.

```
| Name   | HP  | AC          |
| ------ | --- | ----------- |
| Orc    | 12  | = 10+2      |
| Goblin | 2d6 | = Orc.AC - 1|
```

With that base marked, `{Orc.HP}` drops 12 into any text and `{= Orc.HP + 5}` computes 17. Edit a
cell and every reference updates live.

Cells follow one simple rule:

- a cell starting with **`=`** computes, and may reference other variables, including other cells
  (`= Orc.AC - 1` in Goblin's row tracks Orc's; circular references are caught, never hang);
- a plain **number** is a number;
- **anything else is text**, kept exactly as written (so the `2d6` above is the three-character
  text `2d6`, not a roll).

**Want a rolled, re-rollable value? Make the cell a pill.** Type `{2d6}` in the cell and it
becomes a dice pill when you leave it; the pill's frozen roll is the variable's value, and
clicking the pill re-rolls it, updating every reference. A grammar pill works the same way for
text (a `{undead | humanoid}` cell gives a re-rollable Type). From the keyboard, the base's
bullet menu lists a Re-roll entry for each pill in the base.

The first column works too: `{Orc.Name}` is the display name exactly as typed ("Hill Giant" keeps
its space and caps), so `{Orc.Name.s}` says "Orcs" using the usual
[text modifiers](generating-text.md#shape-the-words-modifiers).

Give the base a **name** in the dialog to file every row under it, like `{Monsters.Orc.HP}`. That
keeps two bases that both have an `Orc` row from colliding. A named base can also **total a
column**: `{= sum(Monsters.HP)}` adds the HP cell of every row (`avg`, `count`, `min` and `max`
work the same way), live as cells change, rolled cells included. The dialog previews every name
the base will declare and warns about anything it has to skip (a row it can't name, a column that
matches a text modifier). A `$` badge on the base shows the feature is on; click it to change the
name, or use the bullet menu's **Stop using rows as variables** to turn it off. In the Variables
panel, a base's names fold under one collapsible header so your own variables stay in front.

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

It recomputes **live** as you add, remove or edit children, like a spreadsheet column total.
You can combine aggregations with the rest of math: `{= sum(cost) / count(cost)}` is the average
the long way; `{= sum(hours) * rate}` mixes a rollup with a variable.

Numeric properties roll up; date-shaped ones roll up as epoch-days (so `max(due)` finds the latest
deadline, wrap it in `asdate(...)` to display it as a date).

**Roll up over a search, not just child position.** Quote the first argument and give a property as
the second, and the same reducers total that property over every point matching a **live search**,
any depth below, instead of the direct children:

```
{= sum("#task", cost)}        total the cost of everything tagged #task
{= avg("#risk", severity)}    average a tag's severity
{= max("due:overdue", cost)}  the priciest overdue item
{= count("is:todo")}          how many open tasks below (count needs no property)
```

The quoted search takes all the usual [operators](links-and-references.md) (`is:todo`, `#tag`,
`-has:owner`, `due:overdue`, and so on), so the query is the filter and the property is what you
add up. A bare name stays the child-position rollup (`sum(cost)`), so the two never collide. An
empty match reduces to zero (or nothing for `min`/`max`), the same as `count("...")`, since a
search matching nothing right now is a valid, changing answer.

**Count words, not properties.** The same `{= …}` form also counts prose over a **scope** instead
of a property:

```
{= words(subtree)}    self + every descendant (recurses the whole branch)
{= words(self)}       just this point's text
{= words(children)}   the direct children only
```

So a heading can carry a live word total of everything under it, and reading time is just
composition: `{= words(subtree) / 200}` (about 200 words a minute). The `subtree` / `children` scope
here is the same vocabulary the property rollups take, so `sum(cost, subtree)` and `words(subtree)`
reach exactly as deep as each other.

Per-point [notes](writing-and-formatting.md#per-point-notes) do **not** count by default: a
note is commentary about the prose, not the prose itself. Add `notes` as a second argument to
count them too, with any scope: `{= words(subtree, notes)}`, `{= words(self, notes)}`.

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

**They read your variables too.** Any bound can be a declared variable, so an estimate composes with
the rest of the number system:

```
cost_low = 20
cost_high = 40
{cost_low to cost_high}     a range driven by declared bounds
{units * (5 to 10)}         scale an uncertain unit cost by a variable count
```

A variable that holds text (not a number) fails visibly, the same way it does in `{= …}` math.

Click the pill to **re-sample**. The result is reproducible (it stores a seed, not the samples),
so it survives save/reload and exports.

**Rolling up estimates:** like `sum(cost)`, an estimate can aggregate **children's uncertain
properties** with `sum(effort)` / `avg(effort)` over child points whose `effort` property is itself an
estimate. That's how you Fermi-estimate a whole project from uncertain parts (see the
[Cookbook](cookbook.md)). Author this roll-up through **`@` then Estimate** (type `sum(effort)` in the
dialog): unlike the `{lo to hi}` constructors, a bare `{sum(effort)}` you type inline does **not**
promote to an estimate pill, so the roll-up is dialog-made.

> Estimates are a **separate engine** from `{= …}` math (a distribution isn't a single number), so
> you can't put an estimate inside a `{= …}` expression; it fails visibly if you try.

---

## Make the outline check itself (constraints)

A **check** is a pass/fail rule you attach to a point. Type **`/check:sum(cost) <= budget`** to set it
inline, or **`/check`** on its own (or bullet menu → Add check) for the dialog. It's a math-expression
boolean over the point and its children:

```
sum(cost) <= budget        the kids' costs must fit a `budget` property
count(score) >= 3          at least three scored children
hours <= 8                 the point's own `hours` property
max(due) <= deadline       no child due after the deadline
and(hours <= 8, cost <= cap)   two rules in one check (or(…) / not(…) work too)
count("-has:hp") == 0      structure: every point below must carry an hp property
count("is:todo") <= 5      no more than five open tasks in this section
```

**Quote the argument and `count` changes meaning**: a bare name (`count(score)`) counts children
carrying that property, while a quoted search (`count("is:todo #urgent")`) counts every point
below this one matching it, any depth, with all the usual operators. Existence rules fall out of
the negation: `count("-has:owner") == 0` reads "nothing below is missing an owner". The other
reducers take the same quoted-search form with a property to add up, so a check can assert a
budget over a live query: `sum("#task", cost) <= budget`, or `max("is:todo", cost) <= cap`. (One
limit: the quoted search can't itself contain a `"quoted phrase"`.) The same forms work in `{= …}`
math pills for a live subtree tally.

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
plan sized in honest ranges, a budget that flags itself wherever the costs hide, a rota that runs
itself and more. Or revisit [Generating text](generating-text.md).

**Back to:** [the guide](README.md).
