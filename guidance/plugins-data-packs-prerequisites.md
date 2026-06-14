# Declarative data packs — the prerequisite fixes

> **The "how" companion to `guidance/plugins-direction.md` (the LOCKED direction + the
> code-execution gate).** Captures the registry-by-registry analysis of what must be cleaned up
> before Pointliner can cleanly support **declarative data packs**: grammar-oracle / variable /
> emoji bundles merged into the app's registries at load.
>
> **Read the direction doc first for the locked decisions** — chief among them: extensibility is
> **data packs only**; the app never executes supplied code while it is a single `.html` file;
> **functions are code, not data** (no "function pack"); and **themes are dropped**. Two table
> rows below (Function, Full theme) are retained for the record but are **out of scope** under
> those decisions.

A data pack is just *"merge values into a registry at load."* The catch is that **several
of the registries a pack would target aren't currently shaped to be merged into** — they're
function-local, dual-homed, or tree-only. So the prerequisite work isn't a rewrite; it's
making those registries *mergeable from a central place*, plus building the place.

**This is NOT the big artifact-registry refactor.** Data packs add *data to existing
capabilities*; they don't add new pill *types*, so the ~15-site artifact recipe is
irrelevant here.

## Pack-type readiness

| Pack type | Target registry | State today | The fix needed |
|---|---|---|---|
| **Accent theme** | `ACCENT_PRESETS` | ✅ ships clean | none — already data-driven (computes `--acc-fg` via WCAG math) |
| **Template / snippet** | `root.templates` | ✅ ships clean | none — already a `<_templates>` head element |
| **Saved-search** | `root.savedSearches` | ✅ ships clean | none — already a head element |
| **Emoji / shortcode** | `EMOJI` map | ◐ near-clean | the merge seam (apply at load); the map is mutable |
| **Grammar / oracle / var** | `collectRules` / `collectVars` | ◐ depends | clean *as a subtree* (collectors walk the tree); *as head data* needs the collectors to also merge a doc-level source — **and bump `_varsVer`** |
| **Function** (units, date helpers) | `FN1`/`FN2`/`FN3`/`CONSTS` | ❌ blocked | the tables are **declared inside `evalMath`** (rebuilt every call) — hoist to module scope so a pack can extend them |
| **Full light/dark theme** | CSS `:root` + `applyTheme` strings | ❌ blocked | the **dual-home** hazard — make themes single-source (a `THEME_PRESETS` data table that `applyTheme` generates from, like accents) |

## The four prerequisite fixes, prioritized

1. **The merge seam + `<_plugins>` config (foundation).** There's no init/registry hook
   today ("no extension hooks exist"). Need: `root.plugins` + a `<_plugins>` head element
   (reuse the existing `headEl`/`headJSONArray` pattern) + a single `applyPlugins(root)` that
   merges each pack into its registry. Subtlety to design up front: packs split into **two
   timings** — *apply-once-at-load* into a mutable registry (emoji, functions, theme) vs
   *merge-at-collect-time* (rules/vars, because `collectRules`/`collectVars` are recomputed
   and **cached on `_varsVer`**). A naive "dump it all at load" gets the cached ones wrong.

2. **Hoist the `evalMath` function tables** (`FN1/FN2/FN3/CONSTS`) to module scope.
   ✅ **DONE — PR #82.** Behavior-preserving; a small per-call perf gain and a single mutable
   module-level home for the tables. NB this enables **first-party/curated** function modules,
   **not** user "function packs" — a function is code (see the direction-doc gate).

3. **Single-source the theme** (kill the dual-home). ⊘ **DROPPED — no theme packs** (product
   call: color palettes are the least valuable pack type here). Left recorded because the
   dual-home palette remains a CLAUDE.md-documented footgun worth fixing on its own someday —
   but not as plugin work.

4. **Decide the grammar/var-pack delivery + invalidation.** Either deliver packs as subtrees
   (works today, but the rules appear as visible points) or extend `collectRules`/`collectVars`
   to merge a doc-level pack source — and in either case honor the contract: anything that
   changes rules/vars must invalidate through `markDirty` (`_varsVer`).

## Notes

- These are **safe, additive, pure-core, testable** refactors — the project's preferred kind.
  None touch the no-code-execution security invariant or add authoring syntax.
- **Current sequencing (after the #2 / #3 decisions):** **#1** next — the `<_plugins>` store +
  `applyPlugins` merge seam (the foundation that makes everything pluggable) — then **#4** (the
  `collectRules`/`collectVars` doc-level merge + `_varsVer` invalidation) as the hidden-bundle
  grammar/variable pack path. The **visible-subtree** path (pack = a stamped template subtree)
  already works today, so #4 is only for hidden/bundled packs.
