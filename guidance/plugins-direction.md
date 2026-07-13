# Plugins — Direction & the code-execution gate (LOCKED)

> **STATUS: LOCKED DIRECTION.** Read before any plugin / extensibility work. This is binding:
> future work (and any AI) MUST build toward this model and MUST NOT cross the gate below.
> Companion *how-to* / prerequisite analysis: `guidance/plugins-data-packs-prerequisites.md`.

---

## 0. The headline decision (one breath)

Pointliner's extensibility model is **declarative DATA packs only.** **The app executes no
document- or plugin-supplied code as a program, for as long as it ships as a single, build-free
`.html` file.** Code plugins — arbitrary JavaScript, TiddlyWiki-style embedded scripts,
org-babel executable code nodes — are **out of scope under the same gate that parks the
version-control pivot.**

> **Revisit trigger (identical to `parked/parked-version-control-pivot.md`):** *if and when
> Pointliner becomes "more than a single file"* — once a build step / packaged-app shell is
> accepted for other reasons. Until then, code execution stays out. This is a hard gate, not a
> "later" — it does not get chipped at feature by feature.

---

## 1. What "code execution" means here (and what it does NOT)

**The gate forbids:** running document- or third-party-supplied content as a **program** —
`eval` / `new Function` / dynamic `import()` of doc content, JS "plugins," executable code
blocks, or a sandbox (Worker/iframe) hosting arbitrary plugin code.

**The gate does NOT touch the existing engines.** `evalMath`, the `{…}` grammar engine
(`resolveBrace`/`runGrammar`), and `parseDice` are **interpreters over a closed, restricted
DSL** — hand-written recursive-descent parsers over **null-proto whitelist tables**, with **no
`eval`/`Function` sink**. They run *data*, not programs. They are not code execution and are
unaffected. (Verified: the security audit found the app executes **zero** document-supplied
code today — `fromOpml` is pure deserialization, user text is escaped before `innerHTML`, pills
are stashed as opaque placeholders, `safeUrl()` blocks `javascript:`/`data:`.)

The distinction is the whole point: **we will keep making the restricted DSLs more expressive
(`enhancement-research.md`'s entire generative/computational menu) instead of ever adding a
general escape hatch to JS.**

---

## 2. Why the gate (the invariant it protects)

1. **The "open any file, nothing runs" promise is load-bearing.** Opening someone's `.opml`
   today cannot execute anything. Code plugins delete that: a malicious doc/plugin could
   corrupt data or — via an injected remote `<img src>` — **exfiltrate over the network despite
   the app being "offline"** (the browser still makes the request).
2. **A browser sandbox can't host a first-class pill.** Untrusted JS is only safely run in a
   Worker (no DOM) or a sandboxed iframe — but pills render **synchronously** (the render-context
   globals depend on `mdToHtml` being sync) and manipulate the DOM/caret directly. A sandboxed
   plugin could at best be an isolated, async, message-passed widget — a far weaker, foreign
   integration, not the thing people picture when they say "plugins."
3. **It breaks the single-file, no-build identity** — the same identity the version-control
   pivot is parked behind. One gate, one trigger.

---

## 3. The plugin model — declarative data packs

A **pack is pure data merged into an existing registry.** It is shareable as ordinary document
content (it round-trips through OPML), carries zero security surface, and leverages what makes
Pointliner unique: the generative/computational engine + single-file portability (`C1`
self-contained HTML → a pack-loaded doc *is* a runnable, offline, re-rollable file).

**A pack MAY carry (pure data):**
- **Grammar / oracle / content** — named rules (text), the headline pack type, → `collectRules`.
- **Variables** — two forms (#585): a **formula** `name = expr` (text, evaluated live by the
  restricted `evalMath`) and a **random pick** `name: source` (grammar rolled ONCE at author/import
  time via `rollPickSource`, frozen as `{kind:'pick', expr, rolled}` in the pack, resolved by
  `collectVars` through the same `pickVals` frozen-value path as a document pick var). Both → `collectVars`.
- **Emoji / shortcodes** — `shortcode → unicode` (data), → the `EMOJI` map.
- **Templates** — reusable subtree snapshots `{name, node}` (#583), the pre-made-content vehicle
  (a character sheet, an oracle laid out as points), merged into the `/template` picker via
  `mergedTemplates` (document wins on a name tie), stamped by deep-clone. Inert data.

**A pack MUST NOT carry:**
- **Functions** — a math/JS function is **code**, so a "function pack" is a code-exec hole and
  is **out** (the gate). Extending `evalMath`'s `FN1/FN2/FN3` stays a **first-party, in-file**
  concern. *(The hoist in PR #82 makes those tables a single mutable home for curated/built-in
  modules — NOT a home for user-supplied functions.)*
- **Themes** — product decision: color palettes are the least valuable pack type for this app;
  the single-source-theme prerequisite is **dropped**. (Accent presets remain data-driven, but
  no theme-pack feature is built.)

Saved searches are doc-level config — no pack machinery needed. **Templates DO now ride packs (#583):**
a pack may carry `templates: [{name, node}]` (the same shape as `root.templates`), merged into the
`/template` picker by `mergedTemplates()` with the DOCUMENT winning on a name collision (the same
pack-first / document-wins ordering as rules and vars). A pack template is stamped by deep-clone with
fresh ids like any template (inert data, inside the gate); it is authored by importing a pack JSON
that carries it (there is no textarea authoring for a subtree), shows a "pack" badge in the picker, and
has no Forget button there — it lives in the pack, removed via the pack manager. (This supersedes the
former "templates need no pack machinery" line, written before packs became the pre-made-content vehicle.)

**Decision — stateful decks/sequences inside a pack rule stay a documented boundary (#585 part 2).**
A `{shuffle|cycle|once: …}` inside ANY rule (pack or document) degrades to a stateless pick — this is
deliberate, documented engine behavior (CLAUDE.md: "inside a rule a `{mode:…}` degrades to a stateless
pick — no per-instance record there"), not a pack-specific bug. Giving packs a first-class deck/
sequence kind would require per-instance draw-state in the rule-expansion path, which the engine
purposefully lacks, so it is a real engine change against a locked design decision, not a pack tweak.
Verdict: **not built.** A pack ships flat grammar rules + formula/pick vars; a stateful deck stays a
standalone `{mode:}` pill (or a `[[seq:]]` record) authored in the document, and #518's "ship an
oracle as a pack" is served by the pick-var + grammar-rule surface, not by stateful decks-in-packs.
Revisit only if per-instance rule state is added for other reasons.

---

## 4. Architecture — the seam (what "priming" builds)

- **Storage:** a `<_plugins>` OPML **head element** (reuse the existing `headEl` / `headJSONArray`
  pattern, like `<_savedSearches>` / `<_templates>` / `<_inbox>`) + `root.plugins`.
- **Merge point:** a single `applyPlugins(root)`.
- **The two merge timings (the bug-bait — design it in up front):**
  - **Apply-once-at-load** into a mutable registry: emoji/shortcodes (`Object.assign(EMOJI, …)`).
  - **Merge-at-collect-time** for rules/vars — inside `collectRules` / `collectVars`, because
    those are recomputed and **cached on `_varsVer`**. A pack changing them MUST invalidate via
    `markDirty`. A naïve "dump everything at load" corrupts the cached namespace.
- **Delivery model:** this primes the **hidden / bundled** experience (pack rules live in head
  config, not as visible points). The **visible-subtree** model already works today — a pack is
  a subtree of grammar rules, stamped via the **templates** feature, picked up doc-wide by
  `collectRules` — so there is nothing to build there.

---

## 5. Scope — what's primed, done, dropped, out

| | Item |
|---|---|
| **Prime now** | the **emoji merge** (`applyPlugins` apply-at-load into the mutable `EMOJI` map) — the remaining pack kind |
| **Done** | FN-table hoist — `evalMath` tables to module scope (PR #82) · the `<_plugins>` store + `collectRules`/`collectVars` collect-time mergeability for **grammar + variable packs** (+ `_varsVer` honored) · the **pack management UI** — `openDataPackManager` behind the File menu's `#btn-datapacks` (#487) |
| **Dropped** | single-source theme / theme packs (color palettes — product call) |
| **Out (gated)** | code plugins · functions-as-data · executable code nodes · remote/marketplace fetch (network) · arbitrary-JS sandboxes — all under §0 |

This **generalizes and hardens** the pre-existing "code execution in code blocks is out of
scope" note (`backlog.md` / `enhancement-research.md` guardrails) into the single-file gate.

---

## 6. Prerequisite ladder

The full analysis is `guidance/plugins-data-packs-prerequisites.md`. Status against it:
- **#2 (hoist `evalMath` FN tables)** — ✅ done (PR #82).
- **#3 (single-source theme)** — ⊘ dropped (no theme packs).
- **#1 (the `<_plugins>` merge seam)** — ✅ **engine done** (grammar + variable packs): `root.plugins`
  + the `<_plugins>` head element (`headEl`/`headJSONArray`, `validPluginPack` validator) +
  collect-time merge in `collectRules`/`collectVars` (`mergePackRules`/`packVarDefs`), document
  overriding pack on collision. No `applyPlugins` indirection was needed for these two pack kinds —
  they merge directly in the collectors (the `_varsVer`-cached path). **Emoji packs** (the
  apply-at-load `applyPlugins` timing) are the deliberate follow-on (see §5 "Prime now").
- **#4 (grammar/var-pack delivery + `_varsVer` invalidation)** — ✅ folded into #1's collect-time
  merge (packs live on `root`, so the `_varsVer` cache reflects them; a future `root.plugins`
  mutation must `markDirty`). The visible-subtree path already works.

---

## 7. Cross-references

- `guidance/plugins-data-packs-prerequisites.md` — the how/prereqs companion (registry-by-registry).
- `parked/parked-version-control-pivot.md` — the **same single-file gate / revisit trigger**.
- `guidance/enhancement-research.md` — C3 "doc-defined vocabulary"; the TiddlyWiki/Decker
  single-file-extensibility research that grounds the data-pack model.
- `guidance/adding-an-artifact.md` — the project's "extend the engine, not the surface"
  philosophy (the declarative-first mindset this formalizes).
- `guidance/generation-direction.md` — the locked generative model (rules/variables) that
  grammar/content packs ride on.

---

*This is locked direction. The model is: extensibility = declarative data packs (grammar,
variables, emoji); the app never executes supplied code as a program while it is a single
build-free `.html` file; that gate shares the version-control pivot's "more than a single file"
revisit trigger. Lifting any part of the gate is a deliberate, recorded decision here — never an
incidental feature side-effect.*
