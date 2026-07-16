# Writing and formatting

*Part of the [Pointliner guide](README.md). Give your outline real document structure: headings and
other point types, inline styling, tables, footnotes, links, images and per-point notes. Like
[getting around](getting-around.md), this is the plain outliner, no pills required.*

---

## Point types

Give your outline real document structure: add headings to divide a long document into sections,
numbered steps for instructions, a code block for a snippet you want to copy, a quote block for a
passage or a table for data you would otherwise put in a spreadsheet.

Type **`/`** at the start of a point to open the menu and pick a type. (Markdown prefixes work too:
start a line with `#` for a heading, `>` for a quote, `` ``` `` for a code fence.)

## Secret and spoiler blocks

Hide a line behind a blur until you choose to reveal it. Start a line with **`>!`** and it becomes a
spoiler: in reading view it shows as a soft blur, and a click (or **Enter** / **Space** when it has
focus) reveals it. Click again to hide it. Type **`/secret`** to start one from the menu.

```
>! The duke is the traitor.
>! He poisoned the well in act two.
```

It is good for two things:

- **Sharing.** Hand someone a self-contained copy of a document and your GM notes or answers stay
  covered until they look.
- **Blinding yourself.** Write down an oracle result, a clue or a twist you do not want to see yet,
  and reveal it only when the story reaches it.

A spoiler can span several lines (one `>!` per line), and pills or links inside it still work once
revealed. Revealing is not saved, so a spoiler is blurred again the next time the point is drawn. In
an exported Markdown or text file each spoiler line is written with a `(spoiler)` label in front, so
a reader is warned before they read it.

## Styling text

Make key words stand out, mark something as code, highlight a phrase for review or drop in a
clickable link, all without leaving the outline. Wrap words in these marks to apply the style; they
work on **any line of any point**, including headings and quotes.

```
**bold**        *italic*        `code`
~~strikethrough~~               ++underline++
```

You can also skip the marks: select some text and press **Cmd/Ctrl+B**, **I** or **U** to wrap it in
bold, italic or underline. It is the same result as typing the marks yourself.

**Code marks also keep pills literal.** Anything inside backticks stays plain text, so if you want to
*write about* a pill, for example a note that says "type `` `{2d6}` `` to roll dice", wrap it in
backticks and it shows the literal `{2d6}` instead of turning into a rolled pill. Without the
backticks, a `{2d6}` you type becomes a live pill when you click away; with them, it stays as text.

## Emoji

Type a colon to drop in an emoji. As you type `:` and part of a name (`:fire`, `:tada`, `:check`),
a small menu opens at your cursor listing the matches with their glyphs; use the arrow keys and
`Enter` (or click) to pick one, the same as the tag and link menus. The menu matches anywhere in the
name, not just the start, so `:face` finds every face and `:sword` finds `:crossed_swords:`. You can
also just type the full shortcode (`:sparkles:`) and it turns into the emoji when you finish it.
There are around 500 shortcodes covering the everyday set (faces, hands, `:fire:`, `:star:`,
`:rocket:`, `:warning:`, `:check:`, weather, food, travel) plus a solo-RPG lean for a game journal:
`:dice:` 🎲, `:sword:` ⚔️, `:shield:` 🛡️, `:dragon:` 🐉, `:skull:` 💀, `:wizard:` 🧙, `:castle:` 🏰,
`:scroll:` 📜, `:potion:` ⚗️, `:crown:` 👑 and more. The
[emoji shortcode reference](emoji-shortcodes.md) lists every name, grouped by theme. For anything
outside the set, your operating system's own emoji picker (`Ctrl/Cmd+.` on most systems) browses
everything.

## Tables

Put information in columns to compare options, lay out a small dataset or present a schedule. Type
rows separated by `|` bars with a row of dashes under the header, and it formats as a table
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

Base cells take **pills** the same way a point does: type `{2d6}`, `{= price * 1.1}` or `{Orc.HP}`
in a cell and it becomes the live pill when you leave the cell (the cell's `@` menu inserts the
same things by dialog). While a cell is being edited it shows the raw token; leave the cell and it
renders. Anything that does not promote stays literal text, the usual escape hatch.

A base column can also be given a **display role** from its Column menu (**Show as**): a **Status**
column renders known state keywords as colored chips (including states from your own
[sequences](tasks-and-organizing.md#custom-workflows), so `PLANNED ACTIVE | CLEARED` becomes chips with the
done side muted), a **Date** column shows each date as a color-coded urgency chip, and a **Number**
column right-aligns and formats. The cell text stays plain (edit it and you see the raw value); the
role only changes how it is shown, and a value that does not fit its role just renders as text.
Roles also help you enter values: while a **Date** cell is focused a small calendar opens under it
(click a day to fill the date), and a **Status** cell offers its states as clickable chips. Typing
still works exactly as before; the cell menu (`Shift+F10`) has the same choices under **Set to**
and **Pick a date**.

Once a column is marked **Status**, the base can show itself as a **board**: click **Board** in the
strip above the grid and each state becomes a lane, each row a card (the other columns show on the
card, dates as chips). Click a card (or press `Enter` on it) to move it to another lane, or drag it
with the mouse; the move writes the state back into the table, so switching back to **Table** shows
the same data. A board sourced from a [query base](getting-around.md#query-bases) is read-only.

In the outline (when you are not zoomed into it), a base can be **collapsed** to a single line
with the chevron in its header strip, and its **row count capped** (the **Rows** control: All, 5,
10 or 20) so a long base does not stretch the page. The base's bullet menu carries the same
settings under **View & rows shown**, so everything about a base is also reachable from its one
menu. When rows are hidden, a **Zoom in to see N
more** line appears at the bottom; click it (or zoom into the base) to see everything. Collapse and
the cap only apply in the outline; a zoomed-in base always shows in full. **Cards** is the third
view: every row becomes a card in a grid, with the first column as the title and images as covers.
A column of `{pick | one | of these}` pills becomes a deck of generative cards, each re-rollable
with a click. With a **Date** column, the **Calendar** view places each row on a month
grid; rows without a date are counted below it, and the month arrows plus **Today** move you
around.

**In a base you can do all of this from the keyboard.** Click into any cell, then:

- Arrow keys **move between cells**.
- `Alt` with an arrow **moves the whole column or row**: `Alt+Left` / `Alt+Right` slides the column,
  `Alt+Up` / `Alt+Down` slides the row (the header stays put).
- `Alt+Shift` with an arrow **inserts** a column or row on the side the arrow points (`Alt+Shift+Right`
  adds a column to the right, `Alt+Shift+Down` a row below).
- `Alt+R` **cycles the column role** (Plain, Status, Date, Number), the keyboard path to the **Show as**
  roles above.
- `Alt+,` and `Alt+.` (the `<` and `>` keys) **narrow and widen** the focused column.
- On a **board**, focus a card and press `Alt+Left` / `Alt+Right` to move it between lanes.

Deleting a column or row stays in the column menu (open it with `Shift+F10` on a cell), so a stray
keystroke never destroys data. That same cell menu also lists the focused cell's **pill actions**:
a cell holding a `{2d6}` pill shows Re-roll, Edit and Freeze rows there, since a focused cell shows
the raw token with nothing to click.

## Footnotes, links and images

Annotate a claim without cluttering the main text, link out to a source or embed an image.
Footnotes are useful for research notes and annotated reading: the mark stays small while the note
stays out of the way.

Type **`@`** and choose **Footnote**, **Link** or **Image**. (For links *between points* in your
own document, see [Links and references](links-and-references.md#linking-points) instead.)

## Per-point notes

Tuck a bit of context under any point without cluttering the line: a source, a reminder, a caption
or a few sentences of background. The note sits below the point as a quiet plain-text block you click
to edit in place. Press `Enter` for a line break, `Esc` or click away to save, and clearing all the
text removes it.

Open a point's menu and choose **Add note** (or **Edit note** if it already has one), or type `/note`
to start or open the note without leaving the keyboard. Notes are searched along with the rest of your
outline, and you can hide them all with the **notes button** in the header; a small mark stays on each
noted point so you can click to peek.

---

**Next:** [Getting around](getting-around.md), [Tasks and organizing](tasks-and-organizing.md), or
the live pills in [Generating text](generating-text.md) and [Computing numbers](computing-numbers.md).

**Back to:** [the guide](README.md).
