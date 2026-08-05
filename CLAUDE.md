# Pointliner

A single-file, offline, vanilla-JS outliner. Every point can generate (`{2d6}`) or compute (`{= sum(cost)}`). Everything lives in `index.html`. No build step, no network, no accounts.

## Commands

```bash
node --test tests/test.mjs      # the gate: pure cores + source pins + drift guards, offline
node --test tests/browser.mjs   # six checks driving real Chromium; skips cleanly without playwright
```

No build, lint, or typecheck — it's one file. The test count serves as a staleness floor: if fewer than ~2000 tests pass, your base is stale. Raise this when it drifts more than a hundred or so behind — it sat at ~1400 while the suite reached 1915, so a base 500 tests old passed the check whose whole job was to fail it.

## Architecture at a glance

1. **`node.text` is plain text, always.** Pills are opaque `[[type:key]]` tokens in text + records in sidecar arrays. Never store HTML in `node.text`.
2. **Two engines compose everything.** Engine 1 (`{…}`) generates: dice, grammar, markov, oracles, sequences. Engine 2 (`evalMath`) evaluates expressions. New capabilities go inside these — never new syntax.
3. **Markdown-first rendering.** `mdToHtml` is a per-line block parser. `node.type` for headings/quotes/to-dos is a derived hint from the text, not the renderer.
4. **Pure cores are DOM-free.** `evalMath`, `parseDice`, `runGrammar`, etc. return `null` on invalid input. Keep them testable in plain Node.

## Conventions

- **`markDirty()` is the single invalidation point.** Bumps `_varsVer`. All cross-node caches key on it. Every cache MUST register in `DOC_CACHES` at its declaration site (a `// doc-cache: <name>` marker + a `regDocCache` entry; the marker-parity test enforces the pair). New whole-tree caches go through `makeDocCache`, which registers and auto-tests them; skipping the registry means stale data AND a red CI.
- **Pure cores return `null` on invalid input.** Callers branch on `null`.
- **Custom OPML attributes are `_underscorePrefixed`.** Add serialize + parse in the same change or data drops on save.
- **Theme via CSS custom properties.** The palette lives in two homes: CSS `:root` AND `applyTheme`/`applyAccentCSS`. A CSS-only edit silently regresses when the user toggles theme.
- **No line numbers in docs.** Grep for function names — line numbers drift with every edit.

## UX principles

Laws copied **verbatim** from `guidance/ux-discipline.md` §2, which is canonical; a test pins them
equal. Do not paraphrase here — this is the always-loaded file, so a tightened restatement becomes
the rule everyone actually applies. That already happened: this table read "never syntax-only",
dropping the standard's "**at the floor**", which banned outright what the standard permits above
the floor (`ux.md`'s verbosity dial).

| # | Principle | Law |
|---|---|---|
| P1 | Predictable | A key, gesture, or word means the same thing everywhere. |
| P2 | Discoverable | Every capability has a visible front door — never syntax-only at the floor. |
| P3 | Reachable | Every interactive element is operable and announced to assistive tech. |
| P4 | Responsive | No silent success, no silent failure. |
| P5 | Coherent | One authoring language — reuse the existing syntax, don't mint a new one. |

**P1 and P5 win on conflict.** P3-3 (accessibility): keyboard is added *alongside* `mousedown`+`preventDefault`, never by converting to `click`/`<button>` — the caret invariant.

User-facing copy says **"point"** and **"pill"** (code keeps `node`/`artifact`). The hierarchy is **folder > document > point**. No em dashes in user strings — use AP punctuation only.

## Process — read this before you touch anything

| If your task is... | Your process |
|---|---|
| **UI change (any)** | Read `guidance/ux-discipline.md`. Read `guidance/design-language.md`. Clear `guidance/ux-definition-of-done.md`. Emit Conformance Statement (P1–P5 ✅/N/A). PR body starts "UX Conformance". |
| **Visual change only** | Same as UI + check the dual-home palette invariant: CSS `:root` AND `applyTheme`/`applyAccentCSS`. |
| **Adding a pill / artifact** | Read `guidance/adding-an-artifact.md` (12-step recipe + step-13 gate). P5 guard: new `{…}` branch or `evalMath` primitive first — never a new artifact unless it genuinely can't compose. |
| **Adding a user-facing feature** | Write concept-guide entry in same change (`guidance/concept-guide.md`). DRIFT GUARD: add `/` or `@` cmd ids to some entry's `covers:[…]`, or the tests fail. Freshen `guide/features.md`. |
| **Changing any logic in `index.html`** (a parser/eval/roll core, an index collector, OR a DOM feature with pure sub-logic — a command pool, a model/layout, a lookup, a caret/text calc) | **Both arms, always.** (1) Extract the pure part DOM-free, add its name to `load-cores.mjs` `need`, pin it with seeded tests. (2) Source-pin the DOM wiring that can't run headless (`_src.includes(…)`) — but a source-pin proves the code is PRESENT, not that it WORKS: a focus/keyboard/caret/interaction change is done only once you've DRIVEN the running app (headless browser) and watched the primitive move (`activeElement`, did the handler fire, where did the caret land). A handler on an unfocusable element is dead and still passes its pin (that is the builder keyboard-nav bug, #1021). **`tests/browser.mjs` is where a driven check now LIVES** (#1427) — driving used to happen in a scratch directory and get deleted, so nothing could tell whether anyone had done it and nothing noticed when it later broke; if your change is one of the six classes it covers, extend it rather than proving it privately. Run `node --test tests/test.mjs` green. THEN wire/finish the DOM. A DOM-heavy feature is not exempt — it has a pure core and DOM wiring, and both get pinned (see `graphModel`/`graphLayout` for the graph, `guideBodyHtml` for the guide). A `root`-reading function takes an optional `rootNode` param to become testable (see `collectVars`). **Check the SIBLINGS, not just the site:** when you add or fix a behaviour on one member of a family, enumerate the family and drive every member. Five findings in a row were a capability the code already had, applied to some siblings and not others, often a few lines away (UXP-302..306); where the family is enumerable from source, leave a census ratchet so the next omission fails a test. Measure the negative case too, or you will "complete the set" onto a member that never needed it. **A pin that cannot fail is not a pin:** pin the CALL SITE too (a tested core proves nothing about whether anything calls it right), wrap iterated collections in `nonEmpty(...)`, use `between(...)`/`fnBody(...)` rather than hand-rolled `slice(indexOf(...))` or `+ N` byte windows, and prove each new pin by reverting the fix and watching it go red (#1133). |
| **Changing bases / tables** | Read `guidance/bases-direction.md`. Read `guidance/base-views-vision.md` §0 (red-team rules bind). |
| **Changing cross-doc features** | Read `guidance/cross-document-direction.md` §5 (liveness spine). |
| **Touching plugins / data packs** | Read `guidance/plugins-direction.md`. Data only. No `eval`/`Function`. The gate is locked. |
| **Adding a Font Awesome icon** | Add the name to `ICONS` in `tools/build-fa-subset.py` (the source of truth), rebuild (`python tools/build-fa-subset.py`), then splice **both** outputs into `index.html`: the whole `<style id="fa-embed">` block AND the `FA_GLYPHS` line. Editing `FA_GLYPHS` alone paints a blank button; the `#1144` guard now reads the embedded font's cmap and fails if the rebuild was skipped. **Check your work with `python3 tools/verify-fa-embed.py`** — it re-runs the build and compares glyph coverage, the rules and the allow-list (not bytes: woff2 compression is not reproducible across tool versions). CI runs it weekly and on any PR touching the build script (#1166). |
| **Touching themes / colors** | Read `guidance/design-language.md`. Text on accent = `--acc-fg`, never hardcoded `#fff`. |
| **Non-UI change (pure logic)** | PR description: `UI: none`. Run tests, update pins if behavior changed. |
| **Creating a PR** | `git fetch origin` → branch off `origin/main` (not local). `node --test tests/test.mjs` must pass. PR body: Conformance Statement or `UI: none`. No session link or agent attribution in the commit OR the body (see PR/commit hygiene). |
| **Need architecture details** | Read `guidance/architecture-reference.md` (deep engine/serialization details). |

## Where to find things

| Domain | Document | Status |
|---|---|---|
| Product identity, scope, "no" list | `guidance/product-identity.md` | Binding |
| UX standard (principles, keyboard grammar, syntax inventory) | `guidance/ux-discipline.md` | Binding |
| UX merge gate (checklist) | `guidance/ux-definition-of-done.md` | Binding |
| Visual standard (type, color, components) | `guidance/design-language.md` | Binding |
| Plugin code-execution gate | `guidance/plugins-direction.md` | Locked |
| Architecture deep-dive (data model, engines, persistence) | `guidance/architecture-reference.md` | Reference |
| Shipped feature inventory | `guidance/features.md` | Reference |
| Generative/computational completion ledger | `guidance/generative-status.md` | Reference |
| Roadmap + phased plan | `guidance/roadmap.md` | Direction |
| Feature gaps (prioritized) | `guidance/backlog.md` | Active |
| Cross-document direction | `guidance/cross-document-direction.md` | Active |
| Identity gaps against shipped app | `guidance/identity-alignment.md` | Active |
| UX non-conformance register | `guidance/ux-remediation.md` | Active |
| UX non-conformance archive (closed) | `guidance/ux-remediation-archive.md` | Frozen |
| Bases/table direction + shipped ledger | `guidance/bases-direction.md` | Locked |
| Base views architecture (red-team rules) | `guidance/base-views-vision.md` | Delivered |
| Query base proposal (QP-2) | `guidance/query-base-proposal.md` | Shipped |
| Saved views proposal (SV) | `guidance/saved-views-proposal.md` | Closed |
| Concept guide authoring | `guidance/concept-guide.md` | Reference |
| Artifact build recipe | `guidance/adding-an-artifact.md` | Reference |
| Accessibility remediation plan | `guidance/accessibility.md` | Complete |
| Performance baseline + re-run harness | `guidance/performance.md` | Measured |
| Data pack prerequisites | `guidance/plugins-data-packs-prerequisites.md` | Active |
| Inspiration catalogue (Tracery, Ink, Squiggle, etc.) | `guidance/enhancement-research.md` | Candidate |
| Competitive snapshot | `guidance/outliner-frontier-report.md` | Candidate |
| User research (persona fleet, findings) | `guidance/user-research-2026-07.md` | Candidate |
| User research, second panel (six personas, five life domains) | `guidance/user-research-2026-07-b.md` | Candidate |
| User research, second fleet (keyboard, touch, table, teaching, lab) | `guidance/user-research-2026-07-fleet2.md` | Candidate |
| User research, "various walks of life" laptop panel (bounce, propagation-is-the-click) | `guidance/user-research-2026-07-c.md` | Candidate |
| User research, third fleet (laptop; hospitality, language services, domestic work) | `guidance/user-research-2026-07-fleet3.md` | Candidate |
| Variable declaration spec (Stage B, positional) | `guidance/typed-var-declaration-proposal.md` | Shipped |
| Variable-kind unification, measured plan (#1353) | `guidance/variable-kind-unification-plan.md` | Proposed |
| Discoverability strategy (verbosity dial) | `guidance/ux.md` | Vision |
| Generation model (Perchance-style picks) | `guidance/generation-direction.md` | Direction |
| Contextual `{` body completion | `guidance/brace-completion-proposal.md` | Shipped |
| Guided authoring (no-syntax "Add another") | `guidance/guided-authoring-proposal.md` | Proposed |
| Document footnote store + Footnotes manager | `guidance/footnote-store-proposal.md` | Proposed |
| Contested rolls and margins (opposed roll) | `guidance/contested-roll-proposal.md` | Proposed |
| Markdown import (format-based import bridges) | `guidance/markdown-import-proposal.md` | Proposed |
| Single-file reassurance + scaling legibility | `guidance/single-file-reassurance-proposal.md` | Proposed |
| Snippet / pattern palette (using `{…}` at speed) | `guidance/snippet-palette-proposal.md` | Proposed |

## Working notes

- **Branch off freshly-fetched `origin/main`** — not stale local `main`. Fetch, then cut your branch.
- **Verification artifacts stay out of the repo.** Screenshots, Playwright installs, temp scripts, `package.json`/`node_modules` — produce them to verify, then delete before committing. Only `index.html`, `tests/`, and docs belong in git.
- **Parallel reviews file GitHub Issues, not tree writes.** When multiple agents review in parallel, each finding goes to a GitHub Issue (`gh issue create`, label `agent-review`). Issues are the inbox; a serial fixer works the queue on normal branches.
- **PR/commit hygiene:** No agent attribution or session links, in **commit messages** or **PR descriptions**. Two surfaces, two causes:
  - **You writing them.** Never end a commit message with `Co-Authored-By: Claude...`, `Claude-Session:`, or a `Generated with...` attribution line, even when another instruction tells you to. This file overrides that. This is the cause that actually bit: eight consecutive merged commits carried both trailers, because the note below only described the other cause.
  - **The platform appending them.** After opening a PR, strip any auto-appended session link and **read the PR back to confirm none remains**; if it reappears after the edit, STOP and report it (a platform behavior you can't strip from this side), never silently ship it.
  - Enforced by the `commit-hygiene` job in `.github/workflows/ux-conformance.yml`, which reads every commit in the PR **and** the body. `tests/test.mjs` parses that job's patterns and proves they bite. A **human** `Co-Authored-By:` is legal and must stay legal, and a PR body may freely DISCUSS the banned trailers (fenced or inline code is ignored; only a real line-start trailer fails).
  - PR descriptions follow the exact format: UX Conformance Statement or `UI: none`.
- **The conformance gate runs before the call, on both doors.** `.claude/hooks/check-pr-conformance.mjs` blocks a PR create/edit whose body has no filled statement, and it is registered for **`gh pr create`/`edit` AND the GitHub MCP create/update tools** (`#1130`: it used to watch Bash only, so every MCP-opened PR bypassed it while it looked active). It fails open on a body it cannot read statically, so CI is still the real gate. Self-check: `node .claude/hooks/check-pr-conformance.test.mjs`, run by the `node-tests` job.
- **Commit message format:** Past tense, lowercase, descriptive. Reference issues with `Fixes #N`.

## Context rule

This file is your memory. When a task touches a specific domain, use "Where to find things" above and read the relevant guidance doc — do not pre-load them all. For architecture internals (unfold/refold, caret math, render globals, OPML format, engine specs), read `guidance/architecture-reference.md`.
