# Files and export

*Part of the [Pointliner guide](README.md). How your work is saved, how to keep a whole folder of
documents, how to tune the display and how to share a document with someone who does not have the app.*

---

## Saving your work

You do not need to think about saving: the app stores everything in your browser automatically as you
type.

To keep a file on disk that you own and can back up, press **`Ctrl/Cmd+S`**. Or connect a folder
(see below) and the file updates on disk every time you make a change, with no manual step.

**Starting a new document replaces the one on screen.** If the current document has anything in it,
Pointliner asks first. The one it replaces is kept as a restore point: **File** then **Restore earlier
version** brings it back.

The same row is your net for an ordinary mistake: it also rolls back to a snapshot Pointliner takes
automatically about every five minutes as you work. Either way it is one snapshot, not a history, so
save anything you want to keep properly (`Ctrl/Cmd+S`, or a connected folder).

## Working with a folder of documents

Keep all your documents in one folder on your computer and move between them the way you would
tabs: a project document, a daily log, a person page, each its own file but searchable and
[linkable](links-and-references.md#links-across-documents) together.

Connect a folder once (**Chrome, Edge or a similar browser only**) and every document saves to disk
as you type and reopens right where you left it after a reload.

Connecting never overwrites what is already in the folder: with a blank document, connecting to a
folder that already holds a document under the same name simply opens that document; a document with
real content saves under a fresh name instead when its name is taken.

A **tab strip** appears under the toolbar with the documents you have open: click a tab to switch,
the `×` to close it or the `+` to open another. `Ctrl/Cmd+Shift+]` and `[` step to the next and
previous tab, and `Alt+1` through `Alt+9` jump straight to that numbered tab.

The strip is a **single Tab stop** however many documents are open: Tab into it, then `←`/`→` move
along it, `Home` and `End` reach the ends, `Enter` opens the tab you are on and `Delete` closes it.
Tabs are the documents you have opened (not the whole folder), and they reappear after a reload.

From the **File** menu:

- **Switch document** to see all the documents in the folder, jump to one, add a fresh **+ New
  document** (it asks you to name it) or delete an old one.
- **Rename** the current document by clicking its name at the top left and typing a new one.
- **Disconnect folder** steps back out to single-file mode.

Switching between documents keeps your place in each: when you come back to one, it restores the zoom
and scroll position you left it at, not just after a reload but every time you switch away and return.

One file opens in one tab: you cannot open two tabs of the same document (they would share an identity and
fight over the same file on disk).

On other browsers the menu shows a copy-link invite to reopen in Chrome, Edge or a similar browser instead. (The wider
map of folder features is in the [feature
overview](features.md#linking-and-connecting-documents).)

## Appearance and display

Tune how the document looks and what it shows: switch to dark mode for night work, pick an accent
color, widen the editing column for a big screen or tuck completed tasks out of the way.

- The **theme, color and width** controls live in the File menu under **Settings**. Theme cycles
  system, then light, then dark on each click.
- **Done points** is the checkmark button in the toolbar. Finished to-dos and `DONE` points stay
  in the document, struck through, until you turn the button off to hide them; a badge on the
  button then counts what is hidden, and turning it back on brings them back.
- **Toolbar features**, in the File menu under **Settings**, lists the optional toolbar buttons.
  Click one to show or hide it, and drag it by its handle (or press `Alt+Up` / `Alt+Down`) to
  reorder. The choice is remembered in this browser.

## Exporting and sharing

Share your document with someone who does not have the app, post it as Markdown on a blog or in a
README, or create a portable archive. From the **File** menu:

- **Markdown** or **plain text** for posting and sharing. A code block comes out as a real fenced
  block, keeping its line breaks, its language and its text exactly as you wrote it (pills as the
  source you typed, not the value they happen to show), because a code block is literal text and a
  reader is meant to copy it. Paste that Markdown back in and it arrives as a code block again.
- **Shareable page** is a read-only web page: a clean, static page anyone opens in any browser
  with no app, where every pill shows the value it had when you saved. Send this one when someone
  just needs to read your work.
- **Web page (HTML)** packs the entire app and your document into one file. It works offline,
  opens in any browser and keeps all the interactive features (dice, generators and calculations)
  live, so the person you hand it to can re-roll and recompute on their own machine.

You do not have to export the whole document. To export just a part: open a point's **bullet menu**
and choose **Export to Markdown** (that point and everything under it), or **select several points**
and use **Export .md** on the selection bar. The file is named after the first point, and pills are
frozen to their current values (the same one-way snapshot as the full Markdown export).

A point holding same-shaped rows with properties (a budget, an inventory) offers one more: **Export
table to CSV**, one row per point and a column per property, values frozen.

**Leave scaffolding out.** If a point is planning material, not prose (a variable declaration, a
note to self, a private section), open its **bullet menu** and choose **Exclude from export**: all
four **Export a copy** formats skip that point and everything under it, Markdown, plain text,
Shareable page and Web page alike.

Your **OPML save** is the one thing that keeps it, which is the division the feature rests on: the
save is your backup, the exports are what you hand to someone else.

An excluded point shows a faint ring on its bullet so you can see at a glance what a shared copy will
leave out; choose **Include in export** to undo it.

**Excluding a variable declaration is the case to watch.** Markdown and plain text freeze pills to
the values they are showing, so a frozen number survives the exclusion. The Web page export stays
live and recomputes on the other person's machine, so a point that reads a variable declared inside
an excluded section has nothing to read there and shows its "no variable named that" note instead.

You are told when this happens: the message after the export names the variables the copy lost, and
counts any links that now point at something the copy does not contain. Move the declaration to a
point you are keeping, or leave it out on purpose.

## Importing points from a shared file

When someone shares a Pointliner document with you, or you want to pull a piece of one document into
another, use **File then Import points**. It adds the points to the end of your current document and
leaves everything you already have untouched. This is the difference from **File then Open**, which
replaces the whole document: Import only ever adds. Everything comes in live, so dice, calculations,
oracles, decks and links keep working exactly as they did.

It reads four formats, and detects which one you gave it, so you can also paste any of them into the
box:

- **A Pointliner `.opml` file** comes in exactly as it left.
- **A Markdown (`.md`) file** is turned into points: headings become the outline's shape, bullets and
  numbered lists nest by their indentation, checkboxes become to-dos, and quotes and footnotes carry
  over.
- **A spreadsheet** comes in as data: paste rows from Excel or Google Sheets, or open a `.csv`, and
  each row becomes a point under one heading, with every column after the first attached as a
  property. Numbers stay numbers even with a dollar sign or thousands commas, so you can click
  **+ Total** on the heading to sum a column with no formula typed. You do not even need the dialog
  for this: paste rows straight into the outline and they land the same way, and a toast tells you
  so a single Undo backs it out if you wanted plain text.
- **A BibTeX (`.bib`) bibliography** comes in as your sources: every entry becomes a point titled by
  the work, with the citation kept as that point's footnote. The entry's key becomes the footnote's
  name, so typing `[^ives2019]` on a claim points at the citation your `.bib` already holds. The key
  and the year are kept as properties too, so a reading list sorts by year. The `@` menu's **Cite
  footnote** row lists every source you have. This is not a reference manager: it writes no
  bibliography, has no citation styles and reads the file once.

You can also choose **several Markdown files at once**, which brings in a whole folder of linked
notes (an Obsidian vault, say) as one document. Each file becomes its own section, a `[[Page]]` link
becomes a live link to that section and a `![[Page]]` embed becomes a live mirror of it. A link to a
page that was not among the files you chose is left as plain text.

Anything Pointliner does not model yet (a page's frontmatter, a bibliography's macros) is kept as
plain text and the toast tells you what was simplified, never a silent loss. Whatever the format, it
lands below your current points and the view jumps to the first one that arrived. One Undo removes
the whole import, and a file with no points in it is refused with a message.

## Reusable packs

Bundle the pieces of a whole game system, setting or adventure into one file you can share: grammar
rules, variables and captured pieces of your document like a character sheet, an oracle or a thread
deck. A pack is pure data, stored with the document, and never runs code; it adds only the same
rules, variables and pills the engine already understands.

- **Capture a working piece.** Build a character sheet, stat block or shuffle deck as ordinary
  points, then choose **Add to a pack** from the point's bullet menu. The whole subtree, pills intact,
  becomes a template in the pack, ready to stamp from the `/template` picker. A deck captured this
  way keeps drawing without repeats; a deck typed as a pack rule just draws at random, because a
  rule has no memory.
- **Manage packs** in **File then Reusable packs**: create, enable, edit, import or export them, or
  toggle one off without deleting it.
- **Rules and variables.** Type grammar rules one per line (`npc: knight | rogue | mage`, callable as
  `{npc}` anywhere) and variables. A variable is either a formula (`tax = 0.2`, which recomputes live)
  or a random pick (`strength: 3d6`, rolled once when you save and then fixed, so a pack can ship a
  rolled stat block).

## Taking your work elsewhere

Your work is never trapped here. Whatever you write stays plain text you own, and there are three
ways out depending on what you want to keep:

- **OPML is the full-fidelity form, and it is the lossless format you own.** It is Pointliner's
  native save format, and it is the only export you can open **back into the app** with everything
  intact: every pill still live, every property, date, note, link and base exactly as you left them.
  If you want to move your whole document to another machine or keep a true archive, use the OPML file
  (it is what a connected folder saves, and what **File, Open** reads). OPML is plain, open XML, and
  each pill's record rides along as a small underscore-prefixed attribute, so your document is
  readable and portable text that outlives the app. The
  [Pill syntax reference](pill-syntax-reference.md) documents both the `{…}` grammar and this format.
- **Markdown and plain text are readable snapshots.** They are meant for posting, sharing, or
  pasting into another app, so they are **one-way**: each pill is frozen to the value it is showing
  at export time. `{= sum(cost)}` becomes the total and a grammar pill becomes the text it
  generated; a pill that carries a recipe (a roll, an estimate, a variable you declared) exports the
  recipe with it, so `{2d6}` comes out as `2d6 = 9`. On a **paragraph** point those flatten to the
  result alone (`9`), so exported prose reads clean. You get a clean, ordinary document that reads
  anywhere, but the live behavior does not come along (that is the point of a snapshot). The
  **Shareable page** is the same snapshot as a web page instead of source text: still one-way,
  still frozen, but it keeps your headings, to-dos and bars looking the way they look here.
- **The self-contained HTML keeps everything live for someone without the app.** It packs the whole
  app and your document into one file that re-rolls and recomputes on their machine, no install and
  no account. It is the way to hand a working generator or tracker to a person who does not use
  Pointliner.

Plain text everywhere, no lock-in: Pointliner is built to slot into your process and let you leave
it whenever you want, taking your work with you.

---

**Next:** [Getting around](getting-around.md), [Tasks and organizing](tasks-and-organizing.md), or
the live pills in [Generating text](generating-text.md) and [Computing numbers](computing-numbers.md).

**Back to:** [the guide](README.md).
