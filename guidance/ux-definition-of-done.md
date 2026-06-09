# Pointliner — UX Definition of Done

## The conformance gate for every UI change

> On-merge gate. The project enforces a 12-step recipe for new *artifacts* but has **no gate for any other UI work** — keyboard, tables, menus, toolbar, links, states. This is that gate. It applies to **any change that touches the DOM, a shortcut, copy, or an interaction**, not just artifacts.

**How to use it**
- Run this checklist before declaring *any* UI-touching change done. A change that passes its tests but fails a box here is **not done** (Prime Directive, `ux-discipline.md` §0).
- Each box cites the rule it enforces — a reviewer (human or AI) MUST be able to name the rule.
- Not every box applies to every change; mark **N/A** with a one-word reason. Silence is not N/A.
- For a **new artifact**, this is **step 13** of `adding-an-artifact.md` — the recipe builds it, this gate ships it.
- The three engineering invariants (`node.text` plain text · keyboard *alongside* `mousedown` · per-row ARIA at render) are preconditions — a fix that violates one is rejected regardless of the boxes below.

---

## How this gate is run (the due process — every change, no exceptions)

The gate only works if it is **run and proven**, not assumed. The artifact that proves it is the **Conformance Statement** — its absence means the change is unfinished. The boxes in §§1–7 are *what* to check; this is *how* the check actually happens, every time.

**Trigger.** Any change that touches the DOM, a shortcut, copy, or an interaction. A pure logic / core-only change with no UI surface is exempt — say so in the statement (`UI: none`).

**Stage 1 — Author (the AI), before declaring "done":**
1. **Pre-check (P5/P2):** can this ride the `{…}` engine / `evalMath` / an existing affordance instead of new syntax or a new control? Reuse first.
2. **Build to the patterns:** keyboard grammar §3, the menu/pill/feedback patterns §7, the canonical vocabulary §1.
3. **Walk the checklist (§§1–7):** every box gets ✅ + a one-line *how*, or **N/A + a one-word reason**. No silent boxes.
4. **File new gaps:** any non-conformance the change cannot fully close MUST be filed in `ux-remediation.md` as a new `UXP-NN`. An *un-filed* non-conformance is a reject.
5. **Run the five acceptance tests + regression** (tests green, touch path, OPML round-trip).
6. **Emit the Conformance Statement** (template below) in the PR/commit body.

**Stage 2 — Reviewer (a human or a second agent):**
- **Do not re-derive — check the statement against the diff;** spot-check each ✅.
- Hunt the four invisible violations: **new syntax** (P5), a **new keybinding absent from §3** (P1), a **control converted to `click`/`<button>`** (caret invariant), a **silent failure / no-op** (P4).
- Confirm any deferred gap was filed as a `UXP`.
- **No statement, or any falsely-ticked box → not merged.** That binary is the enforcement.

**Conformance Statement — the required artifact:**
```
UX Conformance — <change>
P1 ✅ <how>   P2 ✅ <how>   P3 ✅ <how>   P4 ✅ <how>   P5 ✅ <how>
New non-conformances filed: UXP-NN | none
Acceptance tests: pass    Regression: tests green · touch · OPML
```
Use `N/A — <reason>` for any principle a change genuinely doesn't touch (a copy-only fix is `P1 N/A`). It is short by design — most boxes are one phrase. Its purpose is not ceremony: it makes a skipped gate or a false claim **visible and catchable against the diff**.

> **Where it goes (so CI passes):** Put the Conformance Statement in the **PR description** —
> not the commit message, not a comment. It must start with the literal words `UX Conformance`,
> carry a ✅ or N/A on each of P1–P5, and contain no `< >` placeholders. For a non-UI change the
> description is just `UI: none`. When creating the PR with `gh pr create`, pass all of this in
> `--body` (it overrides the PR template).

> **The rule in one line:** *no Conformance Statement, no merge.* A change is done when the statement is present, every box is honestly ✅ or N/A, and any gap it leaves is filed as a UXP.

---

## 1. Predictable — P1

- [ ] **No context inversion.** No key changes meaning by block type. `Enter`/`Shift+Enter` behave identically everywhere. *(P1-1)*
- [ ] **Fits the keyboard grammar.** Any new shortcut matches `ux-discipline.md` §3; if it introduces a new modifier meaning, §3 was edited first. *(P1-2)*
- [ ] **`Esc` resolves outward** in the standard order, if used. *(P1-3)*
- [ ] **Destructive keys guarded.** No data loss on a single keystroke without the empty-and-childless (or equivalent) guard. *(P1-4)*
- [ ] **Browser-claimable chords aren't the only path.** *(P1-5)*

## 2. Discoverable — P2

- [ ] **All three doors exist and agree:** visible affordance (≥ Guided floor) + typed path + menu path. *(P2-1)*
- [ ] **The menu teaches the syntax** — every menu item shows label + description + typed form. *(P2-2)*
- [ ] **No raw-markdown-only or syntax-only capability** — power syntax is retained, but an affordance exists. *(P2-3)*
- [ ] **Built ≠ hidden** — nothing is gated entirely off with no front door at any verbosity. *(P2-1)*
- [ ] **Generated/stateful data is inspectable** where relevant (variables, tags). *(P2-4)*
- [ ] **Lean-compatible** — the bare interaction ships first; helpers are a separate verbosity-gated overlay. *(`ux.md` build discipline)*

## 3. Reachable — P3 (additive only; defers to `accessibility.md` for sequencing)

- [ ] **Accessible name** on every interactive element (`aria-label`/visible label; not `title` alone); decorative glyph `aria-hidden`. *(P3-1)*
- [ ] **Keyboard operable** via a `keydown` listener **added beside** the existing `mousedown` — never by converting to `click`/`<button>`. *(P3-2, caret invariant)*
- [ ] **Focus-visible** on every new focus stop; **reduced-motion** respected for any new animation. *(P3-3)*
- [ ] **Not color-alone** — any new state/error also carries text or icon. *(P3-4)*
- [ ] **Off-focus changes announced** via the `aria-live` region (reroll, error, async result). *(P3-5)*
- [ ] **Deferred items still labeled** — if it's a pill or outline row, it carries an accurate `aria-label` even though `tabindex`/`role=tree` are sequenced later. *(P3-6 interim)*
- [ ] **ARIA set per-row at render time**, not via a global post-pass. *(virtual-list invariant)*

## 4. Responsive — P4

- [ ] **No silent failure** — every rejected input signals why. *(P4-1)*
- [ ] **Errors explain the cause** — no bare `#ERR`/no-op. *(P4-2)*
- [ ] **Structural/destructive actions confirm** via the toast. *(P4-3)*
- [ ] **Reuses the feedback pattern** (toast / inline marker / `aria-live` / banner) — no bespoke feedback UI. *(P4-4)*

## 5. Coherent authoring language — P5

- [ ] **No new syntax.** This change introduces **zero** new top-level delimiters, sigils, or notation — it reuses a family from the inventory (`ux-discipline.md` §2/P5). *(P5-1)*
- [ ] **Generative/computed content goes through `{…}`** — a new `resolveBrace` branch or `evalMath` primitive, not a new delimiter. *(P5-2)*
- [ ] **No duplicate syntax.** If a new notation was unavoidable, it **replaces** the one it overlaps (and the old one is removed) — it does not sit beside it. *(P5-3)*
- [ ] **Inventory + `?` panel updated** for any sanctioned syntax change. *(P5-4)*
- [ ] **Subsume-first considered** — extending an existing grammar was evaluated before adding a sibling. *(P5-5)*

> If any box here is unchecked because the change *adds* syntax, that addition needs explicit owner sign-off recorded in the PR. The default answer to "should this be a new syntax?" is **no**.

## 6. Vocabulary & patterns

- [ ] **User-facing copy uses the canonical terms** (`ux-discipline.md` §1 — "point" not "node/item", "pill" not "widget", etc.). *(V-1)*
- [ ] **Internal `node`/`artifact` identifiers untouched.** *(V-2)*
- [ ] **Reuses the menu / pill / feedback / affordance patterns** rather than reinventing. *(§7)*
- [ ] **Copy describes outcomes, not mechanics**, in plain language. *(§8)*

## 7. Regression & verification

- [ ] **Pure-core tests stay green** for any parse/eval/index change (`node --test tests/test.mjs`). *(`CLAUDE.md` working method)*
- [ ] **Touch path shipped** for any new hover/mouse interaction (`@media(hover:none)` + long-press where applicable). *(`CLAUDE.md` touch invariant)*
- [ ] **OPML round-trip** preserved for any new persisted data (serialize + parse in the same change). *(`CLAUDE.md`)*
- [ ] **Acceptance tests met** — the five self-checks below.

---

## Acceptance tests (the five self-checks)

Run these against the change. If any fails, it is not done.

| # | Test |
|---|---|
| **P1** | A user could predict this interaction from the keyboard grammar without being told. |
| **P2** | A user who read no documentation could find and use this through visible UI (Guided). |
| **P3** | This is operable by keyboard alone, and a screen reader announces its name, state, and result. |
| **P4** | No action here leaves the user with "nothing happened and no reason why." |
| **P5** | This added zero new authoring syntaxes — or replaced one and updated the inventory + `?` panel. |

---

## Insertion point — `adding-an-artifact.md`

Append to the 12-step recipe:

> **13. UX conformance gate.** Before the artifact is done, run `ux-definition-of-done.md`. The recipe builds the pill; the gate ships it. Pay special attention to: the pill follows the §7.2 pill pattern (body-click rerolls in place, pencil opens the dialog); it carries an `aria-label` updated on reroll (P3-6); invalid authoring explains why (P4-1); and the `@`-menu entry prints the typed shorthand (P2-2).

*This gate is the enforcement half of `ux-discipline.md`. The standard says what good looks like; this says you may not merge until it is true.*
