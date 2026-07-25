# Links and references

*Part of the [Pointliner guide](README.md). Connect points to each other to build a personal wiki:
internal links with live titles, backlinks, unlinked mentions and links that reach across a whole
folder of documents.*

---

## Linking points

Build a personal wiki where ideas refer to each other, create a table of contents that links to
sections or connect a task to its full context note.

Type **`[[`** and pick the point to link to. Two things make these links low-maintenance:

- **The link always shows the current title**, so renaming a point keeps every link to it correct.
  The picker writes this form: `[[#id]]`, a title reference.
- **Add an empty pipe** (`[[#id|]]`) and the linked point's content appears *inline* wherever the
  link is placed (a live transclusion, not just a reference). You do not have to type the pipe: in
  the `[[` picker, **Shift+Enter** (or **Shift+click** a result) inserts the embed form instead of a
  reference. Plain Enter still references, so embedding stays an explicit choice.

**A mirror on its own line embeds the whole subtree.** Put `[[#id|]]` alone on a line and the
linked point's content appears *with everything under it*, indented like the source, so an
overview or structure note can compose whole sections of other points without copying them. Two
levers keep it bounded: **collapse** a point in the source and the mirror hides its children too
(fold in the source to control what the mirror shows), and long subtrees cap at **40 rows** with
a "+N more, open the source" note. A mirror *inside a sentence* stays a single line, so prose
never breaks; a mirror inside a mirrored subtree shows as a title, so two notes mirroring each
other never loop. Click anywhere on the block to jump to the source.

A point is also findable under other names if you give it [aliases](tasks-and-organizing.md#nicknames-aliases),
so the `[[` picker finds the right point whichever name you reach for.

## Backlinks

See the full web of what connects to an idea: not just what you linked *from* this point, but
everything across your documents that links *to* it. Useful in a personal wiki or research notes when you
want to know what else depends on or references a concept.

Each row shows a **line of context** from the source under its title, the words around the link, so
you can see what that point says about this one without visiting it.

The backlinks panel also surfaces **mentions of the title that are not linked yet**, so you can
connect them with one click.

In a [connected folder](files-and-export.md#working-with-a-folder-of-documents) the panel adds an
**Unlinked references in other notes** section: places in your *other* documents that mention this
point by name without linking it, so you can spot where a topic is discussed but not yet connected.
These are view-only (click a row to open that document); the one-click Link button is for same-document
mentions only, since linking a mention in another file would mean writing into a document you do not
have open.

## Link graph

See the whole document as a **web** instead of a list, so you can find something by looking rather than
by naming it. This is the recognition half of a large project or a big set of notes: the source
everything cites, the person who keeps recurring, the note everything else points back to, all findable
at a glance instead of only by an exact search.

Open it from the **graph button** in the toolbar (the linked-dots icon). Every point that links to
another appears as a dot, joined by a line to what it connects to. The most-linked points are drawn
larger, so the hubs stand out. Click any dot to jump straight to that point in the document; press
`Esc` (or the ✕) to close and return to where you were.

The web is one stop on the keyboard rather than one per dot: `Tab` puts you on a point, the arrow
keys move from point to point, `Home` and `End` reach the first and last, `Enter` opens the one you
are on, and `Esc` closes. The order the arrows follow is the document's own, so moving through the
graph walks your points in the order you wrote them.

A point that links to a **deleted** target shows as a red dot, so a dangling reference is visible
rather than silently missing. Open one and it tells you what is gone and which points still link to
it, using the caption you gave the link, so you know where to go and fix it. The **Broken links**
report in the command menu lists every one of them at once. Points with no links (and no unlinked mentions, below) do not appear,
keeping the graph a web rather than a scatter of unconnected dots. The graph is a live rendering of
your links, so it is always current: link two points and they join the next time you open it.

The graph also draws a **dashed line** between two points that mention each other by name in plain
prose, even when neither one links to the other. This is the same "unlinked reference" a point's
backlinks panel already shows you one at a time, now surfaced across the whole document at once, so
relationships you never got around to linking still show up. A toggle in the panel header ("Unlinked")
hides them if you just want the web of deliberate links. On a very large document only some of these
are shown at once, named honestly in the count line (for example "150 of 340 unlinked references").

With a [connected folder](files-and-export.md#working-with-a-folder-of-documents) of two or more
documents, the panel gains a **Folder** view (a This document / Folder toggle in its header): each
document becomes one dot, joined by a line to every document it links to, with a **thicker line**
where more links run between the two (hover it for the exact count). Your current document wears a
ring so you can see where you are, and clicking a document opens it. A link that points at a document
no longer in the folder shows as a red dot, same as a deleted point. Documents with no cross-document
links stay off the map, and the toggle only appears when the folder actually has several documents.
It is the map of your notebook, one level up from the map of a document.

## Links across documents

Weave together a network of documents: link a project document to a person document, connect a meeting document to an
action item in another file or build a topic index that points to pages across your whole library.

In a [connected folder](features.md#linking-and-connecting-documents) the `[[` picker searches **all**
your documents, not just the one you are in, so a link can reach a point in any file.

**Mirrors work across documents too.** The empty-pipe form (`[[docId#id|]]`) embeds the other
document's point right where you write it, the same live-mirror move as inside one document: a
character sheet in one file can show inside a session log in another, a definition can appear inside
every document that needs it. On its own line it brings the point's **whole subtree** along (same
rules as the same-document form: source folds bound it, 40-row cap), so an index note can compose
sections from several files. The embedded copy shows the point **as it was last saved** in its file
(another document is its file on disk, so the mirror follows the file). Hover the mirror to see which
document it comes from; click it to open the source. Links, tallies and searches inside the mirrored
point resolve in **their own document**, so a query pill mirrored from a project file still counts
that project's points, not the ones where you are reading it.

## Find broken links

When you delete or rename the point a link pointed at, the link goes stale: it renders with a dashed
underline instead of a solid one. A single stale link is easy to spot, but across a growing document
or a whole folder they are easy to lose track of.

Open the **File menu** and choose **Broken links** to round them all up. It lists every link whose
target point or document is gone, both in the document you are in and, when a folder is connected,
across the whole folder. Each row names the point that holds the broken link; click it to jump
straight there so you can fix the target or remove the link. A clean document says so, rather than
showing an empty list.

---

**Next:** [Getting around](getting-around.md), [Tasks and organizing](tasks-and-organizing.md), or
the live pills in [Generating text](generating-text.md) and [Computing numbers](computing-numbers.md).

**Back to:** [the guide](README.md).
