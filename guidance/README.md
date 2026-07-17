# guidance/ — how we build Pointliner

This folder is the project's **build-steering set**: the documents the AI and human
contributors read before changing the app. It is *not* end-user documentation (that
lives in the sibling `guide/` directory). `CLAUDE.md` in the repo root is the
always-loaded entry point; everything here is what it points at.

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

Grouped by kind. A **binding** doc governs every change in its area; a **direction** doc is a
locked north star + scope fence; a **proposal** carries its own status header (read it — several
have shipped in full and are retained as design rationale); a **ledger/reference** records state.

**Identity & standards (binding):**

| File | What it is |
| --- | --- |
| `product-identity.md` | **The binding identity** — the customer (#515), the 90%-core, the belief, never-build, who it is NOT for, the competitive frame, the open "why now" question. First stop for scope/positioning calls |
| `ux-discipline.md` | **The binding UX standard** — vocabulary, the five principles, keyboard grammar, the closed syntax inventory, pattern catalog, conformance matrix |
| `ux-definition-of-done.md` | **The merge gate** — the checklist + the Conformance Statement process |
| `design-language.md` | **The locked visual standard** — type roles, palettes, contrast floors, component rules, anti-decisions |

**Direction (locked north stars + scope fences):**

| File | What it is |
| --- | --- |
| `roadmap.md` | Locked decisions + the phased plan; includes the completed bases-program record |
| `bases-direction.md` | Tables/bases doctrine + the shipped-record ledger (§4, §7b) + the recorded structural noes (§7c) |
| `generation-direction.md` | The Perchance-style generation / random-variable model |
| `plugins-direction.md` | Extensibility = declarative data packs only; the code-execution gate. Companion: `plugins-data-packs-prerequisites.md` |
| `concept-guide.md` | How to add/fix an in-app concept-guide entry + the drift-guard contract |
| `adding-an-artifact.md` | The 12-step new-artifact recipe + the step-13 UX gate |

**Proposals (each carries its own status header):**

| File | Status |
| --- | --- |
| `query-base-proposal.md` | SHIPPED in full (Phases A/B/C); retained as design rationale |
| `saved-views-proposal.md` | COMPLETE — SV-1/SV-2 shipped, SV-3/SV-4 recorded NO |
| `typed-var-declaration-proposal.md` | SHIPPED (Stages A + B) |
| `brace-completion-proposal.md` | Phases 1 + 2 shipped |
| `base-views-vision.md` | Largely delivered; retained for the binding §0 red-team corrections (the §0b thesis' canonical home is now `product-identity.md`) |

**Ledgers & references:**

| File | What it is |
| --- | --- |
| `ux-remediation.md` | Every UX non-conformance as a tracked defect (append-only record) + the syntax-sprawl guard |
| `identity-alignment.md` | **ACTIVE program** — the gap list between `product-identity.md` and the shipped app (IA-1…9, tiered, each ending in a PR or a recorded decision) |
| `generative-status.md` | Completion ledger for the generative + computational lane |
| `backlog.md` | Consolidated feature gaps with status marks |
| `features.md` | The exhaustive engine-level feature reference (contributor-facing; the user inventory is `guide/features.md`) |
| `performance.md` | Measured performance baseline (incl. the bases sweep) + embedded re-run harnesses |
| `accessibility.md` | A11y sequencing, complete; retained for the durable guardrails |
| `ux.md` | Discoverability strategy / verbosity dial (vision; the standard governs where they differ) |
| `enhancement-research.md` · `outliner-frontier-report.md` | Inspiration catalogue + competitive snapshot (candidate material, not commitments) |

(Deliberately shelved direction lives in the sibling `parked/`, currently the version-control
pivot. Not stray; don't resurrect without sign-off.)

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
