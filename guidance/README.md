# guidance/ — how we build Pointliner

This folder is the project's **build-steering set**: the documents the AI and human
contributors read before changing the app. It is *not* end-user documentation (that
will live in `docs/`). `CLAUDE.md` in the repo root is the always-loaded entry point;
everything here is what it points at.

---

## Why this exists

Pointliner had strong **engineering** discipline (plain-text `node.text` as source of
truth, pure test-pinned cores, a tidy two-engine architecture) but **no UX discipline**.
Interaction, discoverability, accessibility, and copy were decided ad hoc per feature, so
similar things behaved differently — and the app kept sprouting new authoring syntaxes.
That sprawl was the tell. This folder fixes it by giving UX the same gate-shaped rigor the
engineering side already had.

---

## The five principles (the whole standard in one breath)


| #      | Principle    | Law                                                                                            |
| ------ | ------------ | ---------------------------------------------------------------------------------------------- |
| **P1** | Predictable  | A key, gesture, or word means the same thing everywhere. No context inversions.                |
| **P2** | Discoverable | Every capability has a visible front door — never syntax-only at the floor.                    |
| **P3** | Reachable    | Every interactive element is keyboard-operable, named, and focus-visible — added *additively*. |
| **P4** | Responsive   | No silent success, no silent failure.                                                          |
| **P5** | Coherent     | **One authoring language.** Reuse the existing syntax; don't mint a new one.                   |


P1 and P5 are the consistency pillars and win on conflict. Full detail: `**ux-discipline.md**`.

---

## The three invariants that bite (most-violated rules)

1. **Keyboard is added *alongside* `mousedown`+`preventDefault`, never by converting to `click`/`<button>**` (the caret invariant).
2. **A key never changes meaning by block type** — new shortcuts fit the keyboard grammar (`ux-discipline.md` §3).
3. **One authoring language** — new generative/computed content plugs into the `{…}` engine or `evalMath`, not a new delimiter. The syntax inventory is a *closed set*.

---

## How a change ships (the due process — every time)

```
build to the standard  →  run the Definition of Done  →  emit a Conformance Statement
        ↓                          ↓                              ↓
  ux-discipline.md         ux-definition-of-done.md      goes in the PR description
```

**Author (the AI):** pre-check for reuse (P5/P2) → build to the patterns → walk the
checklist (✅ + one-line *how*, or N/A) → file any gap it can't close as a new `UXP` in
`ux-remediation.md` → run acceptance tests + regression → **emit the Conformance Statement.**

**Reviewer:** check the statement against the diff (don't re-derive) and hunt the four
invisible violations — new syntax (P5), off-grammar keybinding (P1), `click`-converted
control (caret invariant), silent failure (P4).

**The Conformance Statement** (required in every UI-touching PR; absence = unfinished):

```
UX Conformance — <change>
P1 ✅ <how>   P2 ✅ <how>   P3 ✅ <how>   P4 ✅ <how>   P5 ✅ <how>
New non-conformances filed: UXP-NN | none
Acceptance tests: pass    Regression: tests green · touch · OPML
```

Use `UI: none` for a pure logic/core change with no UI surface.

---

## How it's enforced (the chain)


| Layer                | Mechanism                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Always seen**      | `CLAUDE.md` (root) carries the UX spine + the "no statement, no merge" rule                         |
| **At build time**    | The artifact recipe (`adding-an-artifact.md`) ends with the gate as **step 13**                     |
| **Handed the form**  | `.github/PULL_REQUEST_TEMPLATE.md` pre-fills the statement; `.gitmessage` does the same for commits |
| **Mechanical block** | `.github/workflows/ux-conformance.yml` fails any PR with no filled statement (or `UI: none`)        |
| **Can't bypass**     | A branch **ruleset** makes `ux-conformance` a required check on the integration branch              |


Net: the standard says what good is, the gate defines the process, CI blocks the skip, and
the reviewer catches the lie. Both failure modes (lazy skip + false claim) are covered.

---

## File map


| File                                        | What it is                                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ux-discipline.md`                          | **The binding standard** — vocabulary, the five principles, keyboard grammar, the syntax inventory, pattern catalog, per-feature conformance matrix |
| `ux-definition-of-done.md`                  | **The gate** — the merge checklist + "How this gate is run" (the due process + Conformance Statement)                                               |
| `ux-remediation.md`                         | **The fix list** — every non-conformance as a tracked defect (`UXP-1…70`, append-only record), incl. the standing syntax-sprawl guard               |
| `adding-an-artifact.md`                     | The 12-step recipe for a new artifact + the step-13 UX gate                                                                                         |
| `concept-guide.md`                          | How to add/fix an in-app concept-guide entry (the `GUIDE` array) + the drift-guard contract                                                         |
| `design-language.md`                        | **The locked visual standard** — type roles, palettes, contrast floors, component rules, anti-decisions                                             |
| `ux.md`                                     | Discoverability *strategy* / verbosity dial (vision — the standard governs behavior where they differ)                                              |
| `accessibility.md`                          | A11y *sequencing* (phased tickets, now **complete** — the standard points down to it for order)                                                     |
| `roadmap.md` · `backlog.md` · `features.md` | Direction, gaps, and current feature status                                                                                                          |
| `generative-status.md`                      | Completion ledger for the generative + computational lane (shipped / deferred / out-of-scope)                                                       |
| `bases-direction.md` · `generation-direction.md` · `plugins-direction.md` · `plugins-data-packs-prerequisites.md` | Locked direction for tables/bases, the generation model, and declarative-data-pack plugins |
| `enhancement-research.md` · `outliner-frontier-report.md` | Inspiration catalogue + competitive-landscape snapshot (candidate material, not commitments)                          |
| `performance.md`                            | Measured performance baseline + an embedded re-run harness                                                                                          |


Engineering invariants and architecture live in the root `CLAUDE.md`. (User-facing how-to-use-the-pills
docs live in the sibling `guide/` directory, not here.)

---

## Adding a feature — the short version

1. **Can it reuse existing syntax / an existing affordance?** (P5/P2) Reach for the `{…}`
  engine or an `evalMath` primitive before inventing anything.
2. Build it to the patterns (keyboard grammar, menu/pill/feedback patterns, canonical vocabulary).
3. New artifact? Follow `adding-an-artifact.md` (its step 13 is the gate).
4. Run `ux-definition-of-done.md`; file any gap you leave as a `UXP`.
5. Open the PR — the template hands you the Conformance Statement. Fill it. Green check, merge.

> The empty register in `ux-remediation.md` is the goal: it's empty when the app speaks one language.
