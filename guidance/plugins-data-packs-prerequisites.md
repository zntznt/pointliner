# Declarative data packs — the prerequisite fixes

> Working direction note. Captures the analysis of what must be cleaned up before
> Pointliner can cleanly support **declarative data packs** (Tier 1 "plugins"): theme /
> emoji / function / grammar-oracle / template bundles merged into the app's registries
> at load. Companion to the broader plugins exploration (code vs declarative tiers,
> security invariant, the `<_plugins>` head-config seam).

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
   Behavior-preserving, unblocks **function packs**, and is a standalone win regardless of
   plugins — a small perf gain (no per-call rebuild) and it makes the tables testable.

3. **Single-source the theme** (kill the dual-home). Not just for packs — the dual-home
   palette is a **CLAUDE.md-documented footgun** that theme packs would multiply. Extract
   the forced light/dark color tables into data; `applyTheme` generates the CSS string from
   it. Unblocks **full theme packs**; **accent packs ship without it.**

4. **Decide the grammar/var-pack delivery + invalidation.** Either deliver packs as subtrees
   (works today, but the rules appear as visible points) or extend `collectRules`/`collectVars`
   to merge a doc-level pack source — and in either case honor the contract: anything that
   changes rules/vars must invalidate through `markDirty` (`_varsVer`).

## Notes

- All four are **safe, additive, pure-core, testable** refactors — the project's preferred
  kind — and **#2 and #3 are worth doing on their own merits** (perf/testability; removing a
  known hazard). None touch the security invariant or add syntax.
- **Suggested sequencing:** **#2 + #3 first** (independent, low-risk, each a standalone win
  and each unblocks one pack type) → then **#1** (the seam, which makes everything pluggable)
  → then **#4** as a design choice when wiring grammar/oracle packs.
