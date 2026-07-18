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
- **Add an empty pipe** (`[[#id|]]`, typed) and the linked point's content appears *inline*
  wherever the link is placed (a live transclusion, not just a reference). Embedding is an
  explicit choice; picking from the `[[` menu never transcludes.

A point is also findable under other names if you give it [aliases](tasks-and-organizing.md#nicknames-aliases),
so the `[[` picker finds the right point whichever name you reach for.

## Backlinks

See the full web of what connects to an idea: not just what you linked *from* this point, but
everything across your documents that links *to* it. Useful in a personal wiki or research notes when you
want to know what else depends on or references a concept.

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

A point that links to a **deleted** target shows as a red dot, so a dangling reference is visible
rather than silently missing. Points with no links do not appear, keeping the graph a web rather than a
scatter of unconnected dots. The graph is a live rendering of your links, so it is always current: link
two points and they join the next time you open it.

## Links across documents

Weave together a network of documents: link a project document to a person document, connect a meeting document to an
action item in another file or build a topic index that points to pages across your whole library.

In a [connected folder](features.md#linking-and-connecting-documents) the `[[` picker searches **all**
your documents, not just the one you are in, so a link can reach a point in any file.

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
