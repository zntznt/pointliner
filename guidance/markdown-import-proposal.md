# Markdown import (proposal)

Status: **Proposed** (2026-08). Source: panel finding **#1265** (import bridges), reframed by the owner.
Read `guidance/product-identity.md` (formats, not products) and the CLAUDE.md "both arms" rule before
building.

## The principle: import a FORMAT, never a product

Owner steer (2026-08): **no import feature may be built for one vendor.** The unit of import is a
vendor-neutral FORMAT, and each format already serves a whole class of tools:

- **Markdown** serves Obsidian, Logseq, Bear, iA Writer, Ulysses, and plain `.md`.
- (Later, same principle) **BibTeX / `.bib`** serves Zotero, Mendeley, JabRef, EndNote; **CSV** serves
  Toggl, Clockify, and any spreadsheet.

Importing a vendor-neutral format IS the anti-lock-in identity applied to onboarding. There is no
"Obsidian button" anywhere in the app. This proposal covers **Markdown** (the flagship). BibTeX and CSV
are separate, later, and follow the same format-not-product rule.

## The gap

The 2026-08 follow-up panel's #1 finding: four of seven personas would move from "alongside" to "home
base" if Pointliner could ingest their existing corpus instead of demanding rebuild-by-hand. Markdown is
the highest-value ingest because it is where most notes, wikis, and drafts already live, in a format the
user owns.

## Architecture: extend the existing door; import is the inverse of the export

Two facts make this small and safe:

1. **The door already exists.** `File -> Import points` (`openImportDialog` -> `appendOpmlSubtrees`) takes
   a file OR pasted text, APPENDS (never replaces), is undoable in one step, refuses junk with a message,
   and has a concept-guide entry. It only speaks OPML today. **We extend its PARSING to recognize
   Markdown and route the result through the same plumbing.** No new door, no new undo/guard/paste code.
2. **Pointliner already EXPORTS Markdown** (`toMarkdown`). Design the importer as the **inverse of that
   export**. This gives:
   - a hard acceptance test: `import(export(doc))` reproduces `doc` (structurally);
   - a scope boundary: support exactly what we emit, and degrade FOREIGN Markdown gracefully rather than
     chasing all of CommonMark.

The new work is one pure core: **`markdownToOpml(text)`** (or `markdownToPoints`) that parses Markdown
into the point tree (serialized to an OPML string that `appendOpmlSubtrees` already consumes, so promote,
undo, and the empty/invalid guard are all reused).

## The mapping

A Pointliner point's text IS markdown-ish already: it renders `**bold**`, `[t](url)`, `![alt](url)`, and
`[^k]` footnote markers inline, and it derives headings/quotes/todos from text prefixes. So most of the
mapping is mechanical; the hard part is the tree.

| Markdown | Becomes |
|---|---|
| `# ...` / `## ...` | a heading point; **its level sets tree depth** |
| `- item` / `* item` / `1. item` | a bullet / numbered point; **indentation sets nesting** |
| `- [ ] item` / `- [x] item` | a to-do point (checked/unchecked) |
| `> quote` | a quote point |
| ` ``` ` fenced code | a code point |
| a plain paragraph | a plain point (para) |
| `[^k]: text` (definition) | a footnote in the doc store (Phase A footnotes) |
| `---` (thematic break) | a divider |
| `**bold**`, `*italic*`, `[t](url)`, `![alt](url)`, `[^k]` | preserved as-is (already live inline) |

### The one hard part: weaving two hierarchies into one tree

Markdown nests two ways at once, and the export (verified in `toMarkdown`) uses BOTH deliberately:

- **Headings encode hierarchy by LEVEL.** `## Section` is emitted BARE (no list marker); the heading
  level already encodes the hierarchy, and the content that follows a heading is its children. So on
  import, a heading OPENS a section: every following block nests UNDER it until a heading of the same or
  shallower level closes it. (`toMarkdown` has a pinned decision that headings never take a list marker,
  precisely so `## Section` + a list reads as a section containing a list.)
- **Lists and paras-with-children encode hierarchy by list-item INDENTATION.** A childless paragraph or
  quote is bare text; a para/quote WITH children takes a `-` marker and becomes a list item (Markdown's
  only native container), and deeper indentation nests.

So the parser runs a **heading-level stack** (each heading pops to its level, then pushes) with, inside
each section, a **list-indentation stack** for bullets/numbered/todo/nested items. Bare paragraphs attach
as children of the current section. This "document to outline" transform is the core of the design and
where the effort and the tests go.

## Decisions (owner-approved, 2026-08)

1. **v1 takes a SINGLE `.md` file (or pasted Markdown)** and appends it, through the existing Import door.
   A whole-folder / vault import is a clean v2 (below).
2. A prose **paragraph becomes a plain point** (round-trippable), not a note.
3. **Frontmatter (`---` YAML block) is dropped** in v1. (v2 may map simple `key: value` to properties.)
4. **Wikilinks `[[Page]]` stay as text** in v1: a single file has no target to resolve to. Resolving them
   is a vault concern (v2).
5. **Markdown tables become literal text** in v1. Mapping a table to a Pointliner **base** (which round-
   trips with our own export, since `toMarkdown` emits a base AS a markdown table) is a strong v2.

## Round-trip is the acceptance test

The spine and the primary pin: `markdownToOpml(toMarkdown(root))` reproduces `root`'s structure (types,
nesting, footnotes, todos, quotes, code, dividers). Anything a Pointliner doc can EXPORT, it can re-
IMPORT. This bounds the parser and catches drift on either side.

## Graceful degradation for FOREIGN Markdown

Markdown from other tools carries things our export never emits. None may crash or silently corrupt:

- **Frontmatter** -> dropped (v1) with a one-line note in the import toast ("frontmatter skipped").
- **Wikilinks `[[Page]]`, embeds `![[file]]`** -> left as literal text (v1).
- **Tables** -> literal text lines (v1).
- **Raw HTML blocks, complex nested constructs** -> kept as text points; never executed, never lost.
- **Setext headings (`===` / `---` underlines), loose vs tight lists, hard tabs** -> normalized to the
  ATX/`-` forms our model uses.

The toast reports what was simplified (the UXP-237 "do the lossy thing and SAY SO" discipline), so an
import is never silently wrong.

## Phasing

- **PR 1 (v1): the single-file Markdown importer.** Pure `markdownToOpml(text)` (block-parse + the two-
  hierarchy weave + inline preserved), pinned both arms with a round-trip pin (`export -> import`) and
  foreign-Markdown fixtures; extend `openImportDialog` to detect/accept `.md` (by extension and a paste
  content sniff) and route through `appendOpmlSubtrees`; extend the Import concept-guide entry. Live-drive
  a real Markdown file (headings + nested lists + todos + a quote + a footnote) importing to the right
  tree, and a round-trip of a starter.
- **PR 2 (v2): folder / vault import.** A folder of `.md` -> a connected-folder workspace (each file a
  doc), with a title index that resolves `[[wikilinks]]` to cross-doc links / mirrors; frontmatter ->
  properties; Markdown tables -> bases. This is where the "bring my whole Obsidian vault" story lands,
  built on the v1 parser.
- **Later, same principle:** BibTeX import (into footnotes) and CSV import (into a base / rows), each a
  format serving many tools, never a vendor.

## Verbosity + conformance (P1 to P5)

- **P1 Predictable**: import always APPENDS and is undoable, exactly like the existing OPML import; the
  same door, the same rules.
- **P2 Discoverable**: the existing `File -> Import points` door gains Markdown; the guide entry teaches
  it. No new syntax, no new surface.
- **P3 Reachable**: reuses the Import dialog's keyboard/focus (the shared harness).
- **P4 Responsive**: invalid/empty input is refused with a message; a partial/degraded import names what
  it simplified (frontmatter, tables) in the toast, never silently.
- **P5 Coherent**: no new authoring language; import produces ordinary points, and the format target is
  our own Markdown export. Vendor-neutral by rule.

Tier-agnostic (a File-menu action), so no verbosity-dial interaction.

## Risks / open questions

1. **Paragraph granularity.** One `.md` paragraph per point is round-trippable, but a wall of prose
   becomes many one-line points. Acceptable for v1 (it is an outline); revisit whether consecutive
   paragraphs should coalesce into one point's note.
2. **List-vs-heading ambiguity in FOREIGN files.** Notes that use only `#` headings and no lists, or only
   deep bullet nesting and no headings, both map cleanly; a file that mixes them oddly may nest in a way
   the author did not intend. The round-trip pin covers OUR shape; foreign shapes get best-effort.
3. **Paste sniffing.** The Import paste box must tell OPML from Markdown from junk. A cheap sniff (starts
   with `<?xml`/`<opml` -> OPML; else if it has Markdown markers -> Markdown; else refuse) is enough; the
   dialog can also carry an explicit format choice.
4. **Very large files.** A big Markdown file becomes a big single document (the single-file scaling
   question tracked in #1268); the folder import (v2) is the answer for a whole vault.

## Test strategy (both arms, per CLAUDE.md)

- Pure: `markdownToOpml` round-trip (`export(seededTree) -> import -> deepEqual structure`); unit fixtures
  for each construct (heading levels -> nesting, nested lists, todos checked/unchecked, quote, code fence,
  footnote def, divider); foreign-Markdown fixtures (frontmatter dropped, wikilink kept as text, table
  kept as text, setext normalized) that must not crash and must report what they simplified.
- Source-pin the `openImportDialog` Markdown branch (extension + paste sniff -> `appendOpmlSubtrees`).
- Live-drive: import a real multi-construct `.md` to the correct tree; round-trip a starter (export then
  import) and confirm the tree matches; a foreign file degrades with a naming toast, never silently.
