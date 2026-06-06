> On-demand reference — read this only when adding a new artifact type or icon. Not loaded by default.

## Planned / ideas (with fit notes for proposers)

Tiered roughly by how much they pull against "keep it simple" (see the brainstorm
that informed these):

- **Tier 1 — pure & stateless (good fit, additive):**
  - Dice already extended; could add reroll (`r`), success-counting pools.
  - Math: conditionals (`if a>b : x | y`), date math, unit conversion — all new
    `evalMath` primitives, no architecture change.
  - Oracle pill (`yes/no` with tunable odds) — straight off the recipe above.
  - Inline quick syntax `{= expr}` / `{NdM}` that evaluates at render without a
    stored record — additive second syntax alongside `[[type:key]]`.
- **Tier 2 — references & state (heavier, real design cost):**
  - Aggregations over children (`sum`/`count`/`avg` of a subtree) — foundation
    exists (`collectVars` already tree-walks); needs a new token type + a
    render-time subtree walk. Reuse `markDirty`/`_varsVer`-style invalidation.
  - Decks / bags (draw without replacement) — **needs persisted per-instance
    state**; decide whether that state lives in the OPML record (portable, ugly)
    or a sidecar. This is the first feature that breaks the stateless purity.
  - Retire the legacy per-feature pill paths (`parseDice`/`parseMarkov`/
    `parseRolltable`) now that everything also resolves through the unified
    grammar engine (`expandText`/`collectRules`). Composition (tables calling
    rules/other tables, dice inside entries, named chains callable as
    `{chainName}`) is already wired — this is a cleanup refactor that removes
    duplicated code, not a capability addition. Defer until the duplication
    actually causes friction.
- **Tier 3 — queries / database (different product, cross deliberately):**
  - `{query: tag=todo}`, backlinks, saved views. Turns the outliner into a
    personal DB. Out of current scope.

Other open items:

- [ ] UX pass on the artifact dialogs.
- [ ] Keyboard shortcut to enter edit mode on a selected node without clicking.
- [x] Footnotes — `[^key]` markers + per-node `footnotes` sidecar, edited in the
      bottom `#fn-panel`. Insert via `@footnote` or convert a selection from the
      selection toolbar; hover/click jumps between marker and note. Orphaned
      notes are dropped by `pruneFootnotes()` on `exitEdit`; both md/txt exports
      emit the note text indented under the node. The panel docks above the
      mobile keyboard via `syncFnPanelBottom()` (offset applied only while open,
      so it can't peek when hidden).
