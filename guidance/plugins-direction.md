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
- **Variables** — `name → expr` (text, evaluated by the restricted `evalMath`), → `collectVars`.
- **Emoji / shortcodes** — `shortcode → unicode` (data), → the `EMOJI` map.

**A pack MUST NOT carry:**
- **Functions** — a math/JS function is **code**, so a "function pack" is a code-exec hole and
  is **out** (the gate). Extending `evalMath`'s `FN1/FN2/FN3` stays a **first-party, in-file**
  concern. *(The hoist in PR #82 makes those tables a single mutable home for curated/built-in
  modules — NOT a home for user-supplied functions.)*
- **Themes** — product decision: color palettes are the least valuable pack type for this app;
  the single-source-theme prerequisite is **dropped**. (Accent presets remain data-driven, but
  no theme-pack feature is built.)

Templates and saved searches are already doc-level config — no pack machinery needed.

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
| **Prime now** | the `<_plugins>` store + `applyPlugins` seam + `collectRules`/`collectVars` mergeability (+ `_varsVer` invalidation) + emoji merge |
| **Done** | FN-table hoist — `evalMath` tables to module scope (PR #82); a mutable home for first-party function modules |
| **Dropped** | single-source theme / theme packs (color palettes — product call) |
| **Out (gated)** | code plugins · functions-as-data · executable code nodes · remote/marketplace fetch (network) · arbitrary-JS sandboxes — all under §0 |

This **generalizes and hardens** the pre-existing "code execution in code blocks is out of
scope" note (`backlog.md` / `enhancement-research.md` guardrails) into the single-file gate.

---

## 6. Prerequisite ladder

The full analysis is `guidance/plugins-data-packs-prerequisites.md`. Status against it:
- **#2 (hoist `evalMath` FN tables)** — ✅ done (PR #82).
- **#3 (single-source theme)** — ⊘ dropped (no theme packs).
- **#1 (the `<_plugins>` merge seam)** — the priming foundation; build next.
- **#4 (grammar/var-pack delivery + `_varsVer` invalidation)** — the hidden-bundle path, paired
  with #1. The visible-subtree path already works, so #4 is only for hidden/bundled packs.

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
