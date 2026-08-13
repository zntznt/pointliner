# Document footnote store + Footnotes manager (proposal)

Status: **Shipped** (2026-08) — all three phases have landed; the status above read "Proposed" long
after the fact, which is the exact drift the `#1265/#1243` status guard exists to catch. Supersedes the
"citation bridge" framing of panel finding **#1244** (2026-08 "various walks of life" laptop panel, PhD
persona Aisha). Read `guidance/ux.md` (verbosity dial, binding) and the CLAUDE.md "both arms" rule
before changing it.

**Shipped so far:** Phase A (the doc store `root.footnotes`, `migrateNodeFootnotes` + marker remap,
`footnoteOrder` document-sequence numbering, no auto-prune), Phase B (the Footnotes manager behind
`#btn-footnotes`: list, copy-to-cite-again, delete an unused one), and Phase C (the "Cite footnote"
picker from the `@` menu, `openCitePicker`). **#1244** closed the last gap: a footnote record can mark
itself `stable` so the lift KEEPS its key as the store id, which is what makes an imported BibTeX
bibliography citable by the key your reference manager already knows (`[^ives2019]`) instead of by a
minted id nobody can guess. Driven: the imported citation is offered by both the picker and the
manager. The one idea NOT built is **side labels** (open question 3), which was never part of #1244.

## The problem (what the panel hit, verified in code)

Aisha's ask was "don't make me hand-retype a reference that already exists." Looking at the footnote
system, that friction is structural, and there is a latent bug underneath it:

- **Footnotes are per-node.** `node.footnotes = [{key, text}]` lives on the point that holds the
  `[^key]` marker (`toOpml` serializes it as an `_footnotes` attribute on the `<outline>`). Cite the
  same source in five points and you retype the reference five times.
- **Numbering is point-local, which is already wrong for a document.** `nextFnKey(node)` scans only
  its own point, so two points each mint `[^1]`. Verified live: two separate points both returned key
  `"1"` (`collide: true`). Real footnotes and endnotes number sequentially through the whole document, so
  two "footnote 1"s in one document is a defect independent of reuse.
- **A footnote cannot reference another point's content for free.** Footnote text renders only through
  `innerText` (the fn-panel) or `linkText` (export, which flattens a mirror to a bare title). Verified
  live: `linkText('[[#somepoint|]]')` returns `"somepoint"`, a title rather than a live embed. So "a
  footnote that mirrors a source" is not a pattern; it needs the store below.
- **Footnotes are disposable.** `pruneFootnotes(node)` auto-deletes any footnote whose `[^key]` is no
  longer in the point's text (called on `exitEdit`), and deleting the point drops `node.footnotes`
  entirely. A reference has no life of its own.

## The thesis

A footnote becomes a **document-level entity with its own lifecycle**: it persists independently of any
one point, it is cited by reference rather than by retyping, and a **Footnotes manager** tool governs the
set. List every footnote, copy a footnote's link to paste elsewhere, and delete orphaned (unreferenced)
ones.

This is a footnote **manager**, deliberately not a reference manager: it manages the text blobs the app
already has, with copy-link and orphan-delete. No bibliographies, no citation styles, no external import,
no network. In charter (`guidance/product-identity.md`).

## Decisions made (owner)

1. **Stable id, computed number.** The marker carries a **stable opaque id**, like every other pill
   (`[[dice:k]]`). The **displayed number is computed from document order** (1, 2, 3 and so on). Footnotes
   then auto-renumber on insert or delete (real-footnote behavior), a pasted link never breaks, and an
   orphan is trivially "a store entry with zero markers." The raw text holds an opaque id rather than a
   readable `[^7]`, which is exactly the app's existing pill model.
2. **No auto-prune.** `pruneFootnotes`'s auto-GC is **removed**. An unreferenced footnote persists as an
   orphan; deletion is **manual**, via the manager tool. This is the reversal that makes "persist even if
   the hosting point is deleted" possible.

## The model

### Data
- **Store on the root:** `r.footnotes = [{ id, text }]`, a document-level array, exactly like the
  existing `r.savedSearches` / `r.templates` / `r.inboxes` doc-level arrays. `id` is a stable minted
  token; `text` is the reference prose. **The display number is NOT stored**; it is computed from the
  order of first appearance across the document (see Numbering).
- **Points hold markers only.** `node.footnotes` goes away. A point references a footnote solely through
  `[^<id>]` markers in `node.text`. `getFnRefs(node.text)` still enumerates the ids.

### Marker + numbering
- Marker regex is unchanged (`/\[\^([^\]]+)\]/g`); the captured token is now the stable id.
- **Number = document-sequence position.** A pure `footnoteOrder(rootNode)` walks the tree in render
  order, collecting first-appearance of each id, and returns `Map<id, number>` (1-based). The render
  (`mdInline`) and both exports display `[number]`, not the raw id. Renumbering is free: it
  is a recompute, never a text rewrite.

### Lifecycle
- **Create:** convert-to-footnote (`convertToFootnote`), the `@` menu, or typing `[^...]` mints a store
  entry with a fresh id and inserts the marker.
- **Cite (reuse):** copy a footnote's link from the manager (or select its marker), which puts the
  `[^<id>]` token on the clipboard, then paste it into any point to cite the same footnote. One source of
  truth; fix the text once and every citation shows it.
- **Orphan:** a store entry no marker references. It persists. The manager flags it and offers delete.
- **Delete:** manual only (manager tool, or an explicit action), never automatic.

## Architecture (touch-points, all mapped)

Serialization (`toOpml`):
- New doc-level head element `<_footnotes>` via the existing `headEl` serializer (JSON array, empty-skip),
  parsed back with `headJSONArray` plus an `{id, text}` validator. Sits beside `_savedSearches` and the
  other doc-level elements.
- The per-node `_footnotes` **attribute is retired** from emit. **Migration on parse:** when a loaded
  `<outline>` carries the old `_footnotes` attribute, for each `{key, text}` mint a store id, push
  `{id, text}` to `r.footnotes`, and rewrite that node's `[^key]` to `[^id]` in its text. Point-local keys
  become distinct store ids (two old `[^1]`s become two entries). It is a one-way lift; old files open
  correctly, new files never emit the attribute. (The golden byte-identical `toOpml` pin must be
  re-baselined. This is an intentional format change; note it loudly.)

Resolution, render, and export (all currently read `node.footnotes`, repoint to the store):
- `mdInline` marker render: written-cue plus display number from the store via `footnoteOrder`.
- `fnIsWritten`, `stripUnwrittenFnRefs`, `countUnwrittenFnRefs`, `countExportLinks` (reads `f.text`),
  `syncFnEntries`: take the store instead of a node's array.
- `toMarkdown` / `toPlainText` definition lines: emit from the store, numbered.
- Search `is:footnote`: "does this point hold any marker" (text-based), not `node.footnotes`.
- `deepCloneNodeNewIds` / stamp: a stamped point keeps its `[^<id>]` markers, which now reference
  the shared store entry (the desired behavior: a stamped citation cites the same source). No per-node
  footnote array to clone.

Removed:
- `pruneFootnotes` (auto-GC) and its `exitEdit` call site.

### The Footnotes manager (the tool)
Modeled on **Broken links** (`btn-brokenlinks`, an `ioCard` report panel with click-to-jump), the same
family: a File-menu report. The manager lists every store entry with its computed number, an edit
affordance, a **Copy link** action (puts `[^<id>]` on the clipboard), a **referenced-by** count and jump,
and a **Delete** action that is highlighted for **orphans** (zero references). Built on the shared dialog
shell, not hand-rolled (UXP-247 ratchet). The floating fn-panel stays the inline editor; the manager is
the document-wide view.

## Verbosity conformance (`guidance/ux.md`, binding)

Footnotes are a **capability** and stay reachable at **all three tiers**: the marker, the `@`-menu entry,
convert-to-footnote, and the manager tool exist in guided, standard, and lean alike (ux.md first law:
"Lean = less guidance, never fewer features"). The manager is a File-menu report, exactly like Broken
links, which is already tier-agnostic. No new at-rest chrome is added to lean. Teaching, if any, is a
guided-only once-ever `fireNudge`, the #519 precedent. Copy-link and delete-orphan are dialog-class
actions, never tier-gated on explicit invoke.

## Conformance (P1 to P5)
- **P1 Predictable:** `[^...]` means the same everywhere; the number is always document-sequence.
- **P2 Discoverable:** the manager is a visible File-menu front door (Broken-links family); copy-link is
  a visible action, not a syntax users must know.
- **P3 Reachable:** manager rows keyboard-operable, named, focus-visible; caret invariant preserved in
  the inline editor (mousedown+preventDefault kept, keyboard added alongside).
- **P4 Responsive:** orphan state is shown, not silent; delete is explicit; export still reports dropped
  unwritten markers.
- **P5 Coherent:** no new syntax; the same `[^...]` marker plus the `{...}` and existing pill-token model;
  the store follows the existing doc-level-array convention.

## Phasing (multi-PR)

- **Phase A, the store + migration + numbering.** Move footnotes to `r.footnotes`; add head serialization;
  parse-time migration of old per-node `_footnotes` (mint ids, remap markers); `footnoteOrder` plus
  document-sequence display; repoint every resolve, render, export, and search touch-point; remove
  auto-prune. Pure cores: `footnoteOrder(rootNode)`, `nextFnId`, `migrateNodeFootnotes(node, store)`,
  all DOM-free, in `load-cores`, pinned both arms; re-baseline the `toOpml` golden pin; live-drive that
  two points now number `[1]`/`[2]` and survive a save/reload round-trip. The big, careful one; it ships
  correctness even alone.
- **Phase B, the manager tool.** A Broken-links-style report: list, edit, copy-link, referenced-by jump,
  delete (orphan-highlighted). Source-pin the wiring and live-drive copy, paste, cite, and delete-orphan.
- **Phase C, front door + docs.** A "cite an existing footnote" picker (P2); a concept-guide entry; a
  starter that uses reuse (research-notes is the natural home); freshen `guide/features.md`.

## Migration & compatibility
- Old files (per-node `_footnotes` attribute) open correctly via the parse-time lift; they save back in
  the new store shape. A file saved by the new build will NOT reopen in an old build with footnotes intact
  (one-way), which is acceptable for a single-file local app but must be called out in the PR.
- The `toOpml` golden byte pin changes by design; re-baseline it in Phase A and say so in the PR (format
  drift is normally forbidden; this is the sanctioned exception).
- The **#1196 starter drift guard** ("every `[^key]` has a written `_footnotes`") assumes per-node
  footnotes; it must be reworked to check the doc store. Update it in Phase A alongside the model.

## Risks / open questions
1. **Cross-doc paste of a marker.** Pasting `[^<id>]` into a *different* document references an id that
   store does not have; it should render as unwritten (the existing empty-cue), not crash. Confirm the
   graceful path. A future nicety could carry the text along on cross-doc paste (out of scope here).
2. **Readability of the raw id in text.** Opaque ids in `node.text` match the pill model but read less
   clearly in raw-edit mode; the computed number is what users see in rendered view. Acceptable per the
   stable-id decision; note it.
3. **Orphan accumulation.** With auto-prune gone, orphans can pile up; the manager's orphan view and
   delete is the intended pressure valve. No automatic cleanup, by design.
4. **Undo semantics of delete.** Deleting a store entry that is later un-deleted (undo) must restore the
   id so existing markers re-resolve. Ensure delete goes through the normal history and `markDirty` path.

## Test strategy (both arms, per CLAUDE.md)
- Pure: `footnoteOrder` (seeded trees to correct 1..n, shared ids across points), `nextFnId` (uniqueness),
  `migrateNodeFootnotes` (old {key,text} to store {id,text} plus marker remap, two `[^1]`s diverge). Prove
  each pin bites by reverting the fix.
- Source-pin the manager wiring and the removed auto-prune call site.
- Live-drive: two points number `[1]`/`[2]`; copy-link, paste, and both cite one entry; delete the hosting
  point and the footnote persists as an orphan in the manager; delete the orphan and it is gone;
  save/reload round-trips the store; export numbers sequentially and still drops unwritten markers.
