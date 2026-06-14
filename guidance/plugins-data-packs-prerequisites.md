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

1. **The merge seam + `<_plugins>` config (foundation).** ◐ **Grammar + variable packs done**
   (the collect-time half). Built: `root.plugins` + a `<_plugins>` head element (`headEl`/
   `headJSONArray`, `validPluginPack` validator) + **merge-at-collect-time** for rules/vars —
   `collectRules` calls `mergePackRules(merged, root.plugins)` before the tree walk and
   `collectVars` seeds `packVarDefs(root.plugins)` into `defs` before the `[[var:]]` gather, so a
   document name overrides the pack on collision; both ride the existing `_varsVer` cache. The
   designed-up-front **two-timings** split holds: the *merge-at-collect-time* kinds (rules/vars)
   needed no `applyPlugins` indirection (they merge inside the cached collectors). The
   *apply-once-at-load* kind — **emoji/shortcodes** (`Object.assign(EMOJI, …)`, the mutable
   registry) — is the **deliberate follow-on** that `applyPlugins(root)` will own; it carries the
   post-escape-injection + cross-document-leak concerns the rules/var path doesn't.

2. **Hoist the `evalMath` function tables** (`FN1/FN2/FN3/CONSTS`) to module scope.
   ✅ **DONE — PR #82.** Behavior-preserving; a small per-call perf gain and a single mutable
   module-level home for the tables. NB this enables **first-party/curated** function modules,
   **not** user "function packs" — a function is code (see the direction-doc gate).

3. **Single-source the theme** (kill the dual-home). ⊘ **DROPPED — no theme packs** (product
   call: color palettes are the least valuable pack type here). Left recorded because the
   dual-home palette remains a CLAUDE.md-documented footgun worth fixing on its own someday —
   but not as plugin work.

4. **Decide the grammar/var-pack delivery + invalidation.** ✅ **Done** — chose the doc-level
   pack-source extension: `collectRules`/`collectVars` merge `root.plugins` directly, honoring the
   `_varsVer` contract (packs live on `root`, so the cache reflects them; a future `root.plugins`
   mutation must `markDirty`). The **visible-subtree** path (pack = a stamped template subtree)
   still works as the alternative for packs the author wants as points.

## Notes

- These are **safe, additive, pure-core, testable** refactors — the project's preferred kind.
  None touch the no-code-execution security invariant or add authoring syntax.
- **Current sequencing:** **#1 + #4 (grammar + variable packs) are done** — the `<_plugins>` store
  and the `collectRules`/`collectVars` collect-time merge (with `_varsVer` honored) shipped together.
  **Next:** the **emoji-pack follow-on** — `applyPlugins(root)` for the *apply-once-at-load* mutable
  `EMOJI` registry (with `escHtml` on pack values since emoji substitution runs *after* the escape
  pass, and a per-load rebuild so pack emoji don't leak across documents). Then the **pack-authoring /
  management UI** (the first *user-facing*, UX-gated layer).
