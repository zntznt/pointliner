# Saved views, filters & sorts — proposal (owner decision requested)

**Status: DRAFT — awaiting owner sign-off. No code exists for this proposal.**

The last below-the-line item of the bases program (owner call, 2026-07-16: "work the
remaining below-the-line items"). Everything else in `bases-direction.md` §4's deferred
list has shipped or been explicitly re-fenced; this is the one item every prior document
parked as **its own decision**, so this draft exists to make that decision concrete.

Read alongside: `bases-direction.md` (the locked doctrine), `base-views-vision.md` §0.6
(the recorded line this proposal negotiates with), `query-base-proposal.md` §5 (the same
line from the query side), `roadmap.md` QP-1 (the scope reversal: renderings, never a
views DB).

---

## 1. The recorded lines (what this proposal must answer to)

Three prior decisions fence this space, and they fence it for reasons, not reflexes:

- **§0.6 — "the saved-views line is drawn by KIND, not count":** a view config persists
  only a lens + role mapping (`kind` + the `*By` fields). It **never persists a
  filter/sort predicate over rows**, and there is **never a named, library-managed
  collection of views**.
- **QP-1 scope reversal:** query pills/bases are *renderings of the live outline*, never
  a second database of the data. "A views DB is the thing that stays parked."
- **The §0b mission test:** a view feature earns its place only where it composes with
  the generative/computational layer. Plain filter/sort parity with database apps is
  exactly the scope creep the fence exists to stop.

The reasons behind the lines: (a) **text is truth** — a persisted display predicate makes
the widget show something other than what the text says, a second truth; (b) **no eager
reactive layer** — predicates that re-evaluate on every render are the Logseq-class cost
`performance.md` credits us for not having; (c) **parity is not the mission**.

This proposal keeps (a) and (b) as hard constraints and treats the §0.6 predicate/library
line as what the owner is being asked to move — deliberately, in writing, or not at all.

---

## 2. The shape: four slices, two recommended, one owner call, one rejected

### SV-1 — One-shot row sort on authored bases (recommended; doctrine-clean)

"Sort as a **data operation**" in the honest, org-mode sense: the sort happens **to the
data**, once, and the text stays the truth.

- **What:** the Column menu (and the cell context menu) gains **"Sort rows by this
  column"** (ascending / descending). It reorders the data rows in the model and commits
  through `mtCommit` — exactly like the existing bullet-menu "Sort children by state /
  priority" reorders points. Undo restores the old order (one `pushUndo`).
- **Role-aware comparison, generative-first (§0b):** a `number` column sorts numerically,
  a `date` column by `parseDueDate` epoch, a `status` column by its owning sequence's
  declared state order (the `boardLanes` vocabulary — a sort no database app can do,
  because the sequence is the user's own), anything else locale-string. Blank cells sink.
- **Fence:** header and Calculate-footer rows are pinned; a query base never gets this
  (its rows are not owned data); nothing is persisted — running it twice with the same
  column is idempotent, there is no "sorted" flag to go stale.
- **Cost:** small. One pure core (`mtSortRows(model, col, dir, role, seqs)`), two menu
  rows, pins.

### SV-2 — Persisted sort on query bases (recommended; ordering a rendering)

A query base's row order is document order today, which is arbitrary relative to the
query's intent. Ordering a **rendering** is not a second truth — nothing is hidden and
no data moves — so this does not cross the §0.6 predicate line's *reason*, only its
letter, and only for the sort half.

- **What:** `qbase.sort = { col, dir }` (riding the `_qbase` JSON like `showAll`).
  `qbaseModel` sorts the projected rows after `queryTableRows`, role-aware as in SV-1 —
  including **`= formula` columns** (sort by `= daysuntil(due)`, by a rollup, by any
  computed value: the §0b composition that makes this ours).
- **Doors:** the query editor gains a sort picker (column + direction + "document
  order"); the strip mentions an active sort beside the count (P4: never silent). The
  memoization is untouched — the sort happens once per generation inside the cached
  model, so the no-eager-layer constraint holds.
- **The filter half is already shipped:** a query base's filter IS its query. No second
  filter field; refining the filter = editing the query (one predicate, one place).
- **Cost:** small-medium. A pure comparator shared with SV-1, the config field, the
  editor control, strip copy, pins.

### SV-3 — Persisted display filter/sort on authored bases (the owner call; crosses §0.6)

The version the fence was written against: `node.viewFilter` (a search string applied to
rows at paint) and/or `node.viewSort`, persisted, with the text untouched — the widget
shows fewer/reordered rows than the text holds.

- **For:** it is the only path to "a filtered lens on an authored base", because an
  authored base's rows are cells in one node's text — a query base cannot source them.
- **Against (the recorded reasons, still true):** it is the second-truth footgun in its
  pure form; every mitigation (an always-visible "showing N of M · filtered" strip, the
  cap/collapse precedent) treats a symptom of a model we chose to avoid. And the honest
  §0b answer is that filtering rows is database parity, not generative composition.
- **Recommendation: DO NOT BUILD now.** Ship SV-1 + SV-2; revisit only on a demonstrated
  need that a one-shot sort plus the rows cap cannot serve. If the owner overrules,
  the build is: `node.viewFilter` reusing `parseSearchQuery` over serialized row text,
  the strip as the always-on tell, `_viewfilter` OPML — but the recommendation stands.

### SV-4 — The named view library (recommend against, unchanged)

A per-base collection of named view configs ("Board by status", "This week") switchable
from the strip. §0.6's rejection stands on its own merits: the base already persists ONE
view config that one click changes, the library is pure parity (§0b fails), and it is the
first step of the saved-views database the QP-1 reversal excluded. **No change requested;
the line holds.**

---

## 3. Storage & round-trip

- SV-1 stores nothing (the text is the result).
- SV-2 rides the existing `_qbase` JSON attribute — no new OPML surface, `showAll`
  precedent exactly; the query editor preserves it like `showAll`; dropped clean when
  reset to document order.
- Nothing new enters the doc-cache registry: the sort lives inside `qbaseModel`'s
  existing generation-keyed memo.

## 4. UX conformance sketch

- **P1:** one comparator, one direction vocabulary (A→Z / 9→1 / sequence order), same in
  both places; the SV-1 door lives in the same Column menu as every column operation.
- **P2:** menu rows and the query editor teach both; the strip names an active sort.
- **P3:** all doors are menu/dialog rows, keyboard-operable like their siblings.
- **P4:** SV-1 flashes "Sorted by <col>" (undoable); SV-2's strip shows the active sort;
  no silent reorder ever.
- **P5:** zero new syntax; the sort vocabulary is columns + roles the user already has.

## 5. Build sequence, if approved

1. **PR 1 (SV-1):** the pure comparator + `mtSortRows`, the Column/cell-menu doors,
   pins, guide line. Small.
2. **PR 2 (SV-2):** `qbase.sort` + the editor control + strip copy + pins, reusing the
   comparator. Small-medium.
3. **SV-3/SV-4:** not built; this document records the decision either way.

## 6. The question for the owner

Approve **SV-1 + SV-2** (and the recorded **no** on SV-3/SV-4)? Or overrule on SV-3
(persisted authored-base filtering) — in which case §0.6 is amended in
`base-views-vision.md` in the same PR that builds it, with the always-visible strip as a
binding requirement, never an option.
