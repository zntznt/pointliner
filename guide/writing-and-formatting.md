# Writing and formatting

*Part of the [Pointliner guide](README.md). Give your outline real document structure: headings and
other point types, inline styling, tables, footnotes, links, images, and per-point notes. Like
[getting around](getting-around.md), this is the plain outliner, no pills required.*

---

## Point types

Give your outline real document structure: add headings to divide a long note into sections,
numbered steps for instructions, a code block for a snippet you want to copy, a quote block for a
passage, or a table for data you would otherwise put in a spreadsheet.

Type **`/`** at the start of a point to open the menu and pick a type. (Markdown prefixes work too:
start a line with `#` for a heading, `>` for a quote, `` ``` `` for a code fence.)

## Styling text

Make key words stand out, mark something as code, highlight a phrase for review, or drop in a
clickable link, all without leaving the outline. Wrap words in these marks to apply the style; they
work on **any line of any point**, including headings and quotes.

```
**bold**        *italic*        `code`
~~strikethrough~~               ++underline++
```

## Emoji

Type a colon to drop in an emoji. As you type `:` and the start of a name (`:fire`, `:tada`,
`:check`), a small menu opens at your cursor listing the matches with their glyphs; use the arrow
keys and `Enter` (or click) to pick one, the same as the tag and link menus. You can also just type
the full shortcode (`:sparkles:`) and it turns into the emoji when you finish it. There are around a
hundred common shortcodes: faces, hearts, hands, `:fire:`, `:star:`, `:rocket:`, `:warning:`,
`:check:`, and the rest.

## Tables

Put information in columns to compare options, lay out a small dataset, or present a schedule. Type
rows separated by `|` bars with a row of dashes under the header, and it formats as a grid
automatically:

```
| item   | qty |
|--------|-----|
| rope   | 2   |
| arrows | 20  |
```

For a table you can **click into and edit cell by cell** (or add formulas), type **`/base`** instead.
Static tables can also carry a spreadsheet formula line; see
[table formulas](computing-numbers.md#table-formulas-briefly).

A base column can also be given a **display role** from its Column menu (**Show as**): a **Status**
column renders known state keywords as colored chips (including states from your own
[sequences](tasks-and-organizing.md#sequences), so `PLANNED ACTIVE | CLEARED` becomes chips with the
done side muted), a **Date** column shows each date as a color-coded urgency chip, and a **Number**
column right-aligns and formats. The cell text stays plain (edit it and you see the raw value); the
role only changes how it is shown, and a value that does not fit its role just renders as text.

Once a column is marked **Status**, the base can show itself as a **board**: click **Board** in the
strip above the grid and each state becomes a lane, each row a card (the other columns show on the
card, dates as chips). Click a card (or press `Enter` on it) to move it to another lane, or drag it
with the mouse; the move writes the state back into the table, so switching back to **Table** shows
the same data. A board sourced from a [query base](getting-around.md#query-bases) is read-only. **Cards** is the third
view: every row becomes a card in a grid, with the first column as the title and images as covers.
A column of `{pick | one | of these}` pills becomes a deck of generative cards, each re-rollable
with a click. With a **Date** column, the **Calendar** view places each row on a month
grid; rows without a date are counted below it, and the month arrows plus **Today** move you
around.

## Footnotes, links, and images

Annotate a claim without cluttering the main text, link out to a source, or embed an image.
Footnotes are useful for research notes and annotated reading: the mark stays small while the note
stays out of the way.

Type **`@`** and choose **Footnote**, **Link**, or **Image**. (For links *between points* in your
own document, see [Links and references](links-and-references.md#linking-points) instead.)

## Per-point notes

Tuck a bit of context under any point without cluttering the line: a source, a reminder, a caption,
or a few sentences of background. The note sits below the point as a quiet plain-text block you click
to edit in place. Press `Enter` for a line break, `Esc` or click away to save, and clearing all the
text removes it.

Open a point's menu and choose **Add note** (or **Edit note** if it already has one). Notes are
searched along with the rest of your outline, and you can hide them all with the **notes button** in
the header; a small mark stays on each noted point so you can click to peek.

---

**Next:** [Getting around](getting-around.md), [Tasks and organizing](tasks-and-organizing.md), or
the live pills in [Generating text](generating-text.md) and [Computing numbers](computing-numbers.md).

**Back to:** [the guide](README.md).
