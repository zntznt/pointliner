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

## Footnotes, links, and images

Annotate a claim without cluttering the main text, link out to a source, or embed an image.
Footnotes are useful for research notes and annotated reading: the mark stays small while the note
stays out of the way.

Type **`@`** and choose **Footnote**, **Link**, or **Image**. (For links *between points* in your
own outline, see [Links and references](links-and-references.md#linking-points) instead.)

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
