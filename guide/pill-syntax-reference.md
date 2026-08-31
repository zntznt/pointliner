# Pill syntax reference

*Part of the [Pointliner guide](README.md). The other guides teach the pill families by example;
this one is the **look-it-up** reference: every `{…}` form in one place, the order they are matched,
the escape hatches, and the lossless file format that keeps them all.*

Everything you can type lives inside one delimiter: `{…}`. There is no second authoring language and
no new sigil hides anywhere. This page is the complete, closed list. (The internal source of truth is
the syntax inventory in `guidance/ux-discipline.md`; this reference is its user-facing view.)

Two things to know before the table:

- **A pill is plain text.** What you type in the braces is the truth. Click the words next to a pill
  to unfold it back to its `{…}` source and retype it. Nothing is a black box.
- **Self-contained vs. document-reading.** Some pills compute from only what is inside their own
  braces (a `{2d6}` needs nothing else). Others read the rest of your document (a `{= sum(cost)}`
  adds up the point's children; a `{roll: #tag}` draws from your whole outline). The **Reads** column
  below marks which is which. It matters when you move a pill: a self-contained pill works anywhere; a
  document-reading pill needs its context to come along.

---

## The `{…}` forms

**Generate** (random text; a click re-rolls, and a roll stays put until you click it):

| You type | It does | Reads |
|---|---|---|
| `{2d6}`, `{4d6kh3}`, `{2d6!}`, `{4dF}` | rolls dice (`NdM`, plus `!` explode, `rK` reroll ≤K, `kh`/`kl`/`dh`/`dl N` keep/drop, `>=N` targets) | self |
| `{2d{sides}}`, `{{n}d6}` | a die whose count or faces come from a `{…}` (a variable, a rule, a pick) | self\* |
| `{2d6 vs 2d6}`, `{2d6+str vs 12}` | a contest: rolls both sides and reads the margin (a side may be dice, a number or a variable) | self\* |
| `{a \| b \| c}` | picks one at random | self |
| `{a \| b 2 \| c}` | weighted pick (a weight is a number, or a `{= expr}` for dynamic odds) | self\* |
| `{{Bram\|Isolde} {Ashford\|Vane}}` | glues the picks into one pill that re-rolls as a unit (name generators); the outer brace is what joins them | self |
| `{cond: then \| else}` | emits `then` when the comparison holds, else `else` (else optional) | self\* |
| `{shuffle: a \| b \| c}` | deals from a deck without repeats; `{cycle: …}` runs the list in order and loops, `{once: …}` runs it once and stops, `{stopping: …}` runs it once and holds the last | self |
| `{Nx: template}` | repeats the template N times (N a number 1 to 99, or a dice roll like `{2d4x: …}`) | self |
| `{markov: a→b, b→c}` | a typed Markov chain (comma-separated `from→to weight` transitions) | self |
| `{rule Name: a \| b}` | declares a named, document-wide grammar rule you can call as `{Name}` | doc |
| `{seq Name: active \| done}` | declares a named sequence (a workflow of states) | doc |
| `{ref.mod}` | a text modifier on a rule/variable: `cap`, `title`, `upper`, `lower`, `a` (picks a or an), `s`, `ed`, `ing`, `poss`, `ord` | doc |
| `{{a \| b}.mod}` | the same text modifiers on a whole generator wrapped in one more brace (`{{ogre \| dragon}.a}` is "an ogre", `{{2d6}.ord}` is "6th") | self\* |
| `{oracle: likely}` | a yes/no oracle over a likelihood band (`certain`/`likely`/`even`/`unlikely`/`impossible`) or a percentage (`{oracle: 70}`), optional `+ swing` | self |
| `{roll: search-query}` | draws one random point matching the search (add `folder` before the colon to draw across the whole folder) | **doc** |

**Compute** (live; recomputes on its own when something it reads changes):

| You type | It does | Reads |
|---|---|---|
| `{= 2 * 19}` | evaluates the expression (`+ − × ÷ ^ %`, `sqrt`, `pi`/`e`/`tau`, and more) | self\* |
| `{= sum(cost)}` | rolls a property up the point's children (`sum`/`avg`/`count`/`min`/`max`), or a wider scope with a second argument (`sum(cost, subtree)`) | **doc** |
| `{= sum("query", cost)}` | rolls a property up every point matching a search | **doc** |
| `{= words(subtree)}` | counts words in this point and below (`subtree`/`self`/`children`; add `, notes` to count notes too) | **doc** |
| `{= convert(2, km, mi)}` | converts between units (length, mass, volume and time are built in; you can declare your own) | self\* |
| `{name := expr}` | declares a variable (a formula, or a random pick frozen once) | doc |
| `{name}` | reads a declared variable | **doc** |
| `{row.field}`, `{base.row.field}` | reads a cell from a variable base (a table used as data) | **doc** |
| `{5 to 10}` | an uncertain estimate (a 90% range, sampled as a distribution with a sparkline); also `normal(m,s)`, `uniform(lo,hi)` | self\* |
| `{query: is:todo}` | lists the points matching a live search | **doc** |
| `{count: #tag}` | counts the points matching a live search | **doc** |
| `{meter: hp/hpmax}` | a segmented bar of a numeric property (also icon pools: `{meter: hp/5 hearts}`) | doc |
| `{hp -= 1d6}` | an action button: click to apply a change to the nearest property or variable of that name (`+=`, `-=`, `*=`, `/=`, `=`; the amount is a live expression) | doc |

**Declared config** (writes to the point and leaves no inline pill; the value shows as a chip):

| You type | It does | Reads |
|---|---|---|
| `{prop key: value}` | writes an arbitrary property (an empty value clears it) | self |
| `{date due: value}`, `{date start: value}` | sets a schedule date (`today`, `today+N`, `tomorrow`, `YYYY-MM-DD`; empty clears) | self |

**Text-value escape:**

| You type | It does | Reads |
|---|---|---|
| `{"literal text"}` | a fixed string, not a rule lookup (nested `{…}` still interpolate inside) | self |

\* *Marked "self" but reads the document only if you reference something outside the braces* (a
weight that is a `{= expr}`, a condition or expression that names a variable, an estimate over
`sum(prop)`). A form with no outside reference is fully self-contained.

Beyond the braces, the same closed language covers dice notation (inside `@dice` and `{…}`), grammar
rules (`name: a | b`), Markov transitions (`State -> Target weight`), the estimate sub-language
(`lo to hi`, `normal`, `uniform`), the table formula row (`#+TBLFM:`), the status headline
(`#TODO [#A] body`), the search-query mini-language (the same words used by `{query:}` / `{count:}` /
`{roll:}`), the progress cookie and clock (`[/]`, `[%]`, `[o N/M]`), and dates as `start`/`due`
properties. Each is documented in its own guide (see [the guide index](README.md)); this page is the
inventory, not the tutorial.

---

## How a `{…}` is recognized (the matching order)

When you click away, Pointliner reads the body of each `{…}` and matches it against the forms above
**in a fixed order**, stopping at the first that fits. Knowing the order explains why a body reads as
one form rather than another:

1. a quoted string `{"…"}` (the text-value escape wins first)
2. `{= …}` (an expression)
3. `{… := …}` (a variable declaration), then a bare `{A vs B}` (a contest)
4. `{cond: … | …}` (a conditional, matched before the `|` splitters)
5. `{shuffle|cycle|once|stopping: …}` (a deck)
6. `{markov: …}`
7. `{seq Name: …}`, then `{rule Name: …}` (named declarations)
8. `{prop key: …}`, then `{date due|start: …}` (property writes)
9. `{query: …}`, `{count: …}`, `{roll: …}`, `{oracle: …}`, `{meter: …}`, then `{stat += …}` (an action button)
10. `{Nx: …}` (repeat), `{ref.mod}` (modifier), `{base.field}` (field reads)
11. dice, then the estimate sub-language
12. a bare `{a | b}` alternation, then a bare `{Name}` rule call
13. `{{a|b}.cap}` (a modifier on a whole generator), `{2d{sides}}` (a parametrized die), then the
    glue template `{{a|b}{c|d}}`

A body that matches none of these stays as **plain literal text** (see the escape hatches below).

---

## The escape hatches (keeping braces as text)

Three ways to write a literal `{` in your prose without it becoming a pill:

- **Inline code:** `` `{2d6}` `` in backticks stays the exact text `{2d6}`.
- **A quoted body:** `{"anything"}` renders its inside as fixed text.
- **Prose that matches no form:** a body like `{note to self}` or `{a, b}` is recognized as prose and
  left as literal text, braces and all. (There is no backslash escape; these three are the only
  hatches.)

An **empty-bodied** keyword pill (`{roll: }`, `{= }`, `{count: }`, and the like) is treated as an
unfinished pill and vanishes rather than leaking its braces into the reading text.

---

## The lossless file format: OPML (own your data)

Every pill above is stored in your document as plain text plus a small record. When you **save**
(File menu, or a connected folder's auto-save), Pointliner writes an **OPML** file, and OPML is the
**full-fidelity, keep-everything format**: it is the one export you can open **back into the app**
(File, Open) with every pill still live, every property, date, note, link and base exactly as you
left them. Nothing is lost and nothing is frozen.

How it keeps them: OPML is a plain, open XML outline. Each point is an `<outline>`; each pill's record
rides along as an underscore-prefixed attribute holding small JSON:

- `_dice`, `_grammar`, `_math`, `_vars`, `_query`, `_est`, `_seq`, `_markov` for the pill records
- `_props` for properties (including dates), plus base config (`_view`, `_colrole`, `_colfmt`, …)
- document-level configuration (saved searches, appearance, calendars, and so on) rides on the head

Because it is ordinary text you can read and keep, your document outlives the app: the format is
documented here, the pill grammar is the closed set above, and any tool can read the outline even if
it does not understand the pills. That is the whole promise, made concrete: **your file is yours, the
grammar is published, and the lossless round-trip is a plain-text format you own.**

The other exports serve a different purpose and say so:

- **Markdown** and **plain text** are one-way *snapshots* for sharing. Each pill is frozen to the
  value it is showing (`{= sum(cost)}` becomes the total; a pill that carries a recipe exports the
  recipe with it, so `{2d6}` comes out as `2d6 = 9`, or just `9` on a paragraph point). They
  read anywhere, but the live behavior does not come along.
- **Shareable page** is a one-way snapshot as a web page: a clean, static page anyone opens in any
  browser with no app, where every pill shows the value it had when you exported.
- **Web page (HTML)** packs the whole app plus your document into one self-contained file that
  re-rolls and recomputes on someone else's machine, with no install and no account. It is how you
  hand a working generator or tracker to a person who does not use Pointliner.

For a full archive you can reopen, use the OPML save. For a readable copy, export Markdown. To hand
someone a page they only need to read, export the Shareable page; to hand them a live copy, export
the Web page. See [Files and export](files-and-export.md) for the details.

---

**Back to:** [the guide](README.md).
