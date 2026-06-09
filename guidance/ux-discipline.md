# Pointliner — UX Discipline

## The binding interaction standard

This is to UX what `CLAUDE.md` is to architecture: the durable, always-relevant standard that every feature is measured against. It exists because the project has strong engineering discipline and **no UX discipline** — interaction, discoverability, accessibility, and copy decisions are made ad hoc per feature, which is why the same concept behaves differently in different places.

**This document is binding.** `ux.md` is the *vision* (the verbosity dial, the discoverability strategy); this is the *standard* that the AI must satisfy on every change. Where the two ever conflict, this document wins for behavior; `ux.md` wins for the staging/rollout of guidance overlays.

**Normative language:** **MUST** = required to merge · **MUST NOT** = prohibited · **SHOULD** = expected (a deviation needs a one-line written reason) · **MAY** = permitted.

**Relationship to the other docs**

| Doc | Owns | Altitude |
|---|---|---|
| `CLAUDE.md` | Architecture invariants | Always loaded (carries the UX spine in its "UX discipline" section) |
| **`ux-discipline.md`** (this) | **The UX standard — behavior, vocabulary, principles** | **Read before any UI work** |
| `ux-definition-of-done.md` | The conformance gate (checklist) | Run on every UI change |
| `ux.md` | Discoverability *strategy* / verbosity dial | Vision / staging |
| `accessibility.md` | A11y *sequencing* (phased tickets) | Execution tracker |
| `adding-an-artifact.md` | Build recipe for new artifacts | On-demand recipe |

**Hard precedence.** Three engineering invariants are reality, not UX choices, and this standard never overrides them:
1. `node.text` is plain-text source of truth.
2. Keyboard operability is added **alongside** `mousedown`+`preventDefault`, **never** by converting to `click`/`<button>` (the caret invariant).
3. The render model is a **virtualized list** — per-row attributes are set in the `render()` pass, not patched globally.

When a UX rule below would require breaking one of these, the rule is satisfied *within* the invariant (e.g. add a `keydown` listener beside the existing `mousedown`, never replace it).

---

## 0. Prime directive

> **UX is a first-class acceptance criterion, equal to correctness and test-coverage.** A change that passes its tests but violates this standard is **not done**. Every UI-touching change MUST clear `ux-definition-of-done.md` before merge — the same way every new artifact MUST clear the 12-step recipe.

The five principles below are the whole standard in one breath:

| # | Principle | One-line law |
|---|---|---|
| **P1** | Predictable | A key, gesture, or word means the same thing everywhere. |
| **P2** | Discoverable | Every capability has a visible front door — never syntax-only at the floor. |
| **P3** | Reachable | Every interactive element is operable and announced to assistive tech. |
| **P4** | Responsive | No silent success, no silent failure. |
| **P5** | Coherent | One authoring language — reuse the existing syntax, don't mint a new one. |

**P1 and P5 are the twin consistency pillars** — P1 governs *behavior*, P5 governs *syntax* — and both take precedence over P2–P4. When two principles conflict, the consistency pillars win, then the lower number, then the more specific rule.

---

## 1. Canonical vocabulary

A unified UX requires unified words. These terms are binding for **UI copy, the `?` panel, docs, and `aria-label`s**. The code keeps its own identifiers (`node`, `artifact`) — this table governs *what the user sees and what we say*, and draws the one distinction that matters: the **internal** term vs the **user-facing** term.

| Concept | Internal term (code/data — unchanged) | User-facing term (copy/labels — canonical) | Never say |
|---|---|---|---|
| A line in the outline | `node` (`node.text`, `nodeById`) | **point** | item, row, bullet, entry |
| The glyph left of a point | bullet | **bullet** (the glyph only) | dot, marker |
| Parent/child relations | children/parent | **child / parent / nested** | sub-item |
| What a point renders as | `node.type` | **block** (bullet, numbered, to-do, paragraph, heading, code, quote, divider, table) | format, kind |
| A live inline object | `artifact` / `[[type:key]]` | **pill** | widget, chip, token, badge |
| Inserting one at the caret (`@`) | `insertInlineArtifact` | **insert** | embed, object |
| Changing a point's block (`/`) | — | **turn into** | convert |
| Focusing a subtree | `focusedId` | **zoom in / zoom out** | drill, hoist, focus |
| Hiding/showing children in place | `collapsed` | **collapse / expand** | fold, toggle |
| Typed syntax that becomes a pill | `promoteInlineShorthand` | **shorthand** | macro, inline formula |
| A keyboard-navigable overlay list | — | **menu** (`/`, `@`, link, state) | dropdown, popup, palette |
| The TODO/NEXT/WAITING/DONE marker | keyword in `node.text` | **state badge** | tag, label |

> **Rule V-1 (MUST):** New user-facing strings use the user-facing term. **Rule V-2 (MUST NOT):** Rename the internal `node`/`artifact` identifiers — that is churn against load-bearing code; the split above is the entire point.

The canonical split — **"node" in code, "point" in copy** — also resolves the terminology drift the existing docs already show (they use node / bullet / item / artifact / pill / widget interchangeably).

---

## 2. The five principles

Each carries: the **law**, **normative rules**, and an **acceptance test** the AI can self-check against (the testable criteria the current UX docs lack).

### P1 — Predictable

> **Law:** A user who learns one interaction MUST be able to predict the rest. A key, gesture, or word resolves to the same conceptual action in every context.

- **P1-1 (MUST):** No key *silently* inverts meaning by context. `Enter` = new point and `Shift+Enter` = line break in every block — **one advertised exception: Paragraph (prose mode)** inverts these (`Enter` = line break, `Shift+Enter` = new point). This exception is conformant because it is explicit: the `/` menu description and the empty-state hint both advertise the inversion. Any undocumented per-block inversion is a violation.
- **P1-2 (MUST):** A new shortcut MUST fit the keyboard grammar in §3. Introducing a new modifier meaning requires editing §3 first.
- **P1-3 (MUST):** `Esc` always resolves *outward* in one fixed order: close menu → clear cell selection → clear point selection → zoom out → blur. No feature gives `Esc` a different direction.
- **P1-4 (MUST):** Destructive keys are guarded (`Backspace` deletes a point only when empty **and** childless — codify the current behavior so it can't regress).
- **P1-5 (SHOULD):** A shortcut a browser can intercept (`Ctrl+1…6`) MUST NOT be the *only* path to a capability and MUST be documented as best-effort; the visible control is primary.

**Acceptance test:** hand a user §3 and they correctly predict a shortcut they've never pressed.

### P2 — Discoverable

> **Law:** No capability is reachable *only* by typed syntax or *only* by a memorized key. Every capability offers a **visible affordance**, a **typed path**, and a **menu path** — and the menu teaches the syntax.

This is fully compatible with `ux.md`'s lean-first model: the *capability* must never be syntax-only at the **floor** (`ux.md`'s own rule: "a complete reference is reachable from every mode"), but the *visible affordance* MAY be a verbosity-gated overlay that Lean mode quiets. Discoverable ≠ loud; it means *a way in exists without prior knowledge*.

- **P2-1 (MUST):** Every capability satisfies all three doors. A capability that is built but reachable only by syntax (or gated entirely off with no visible path at any verbosity) is **non-conformant**. *(The `[[` link picker is the canonical example: it exists but is gated off; under this standard its front door must surface at least in Guided mode — its staging belongs to `ux.md`/roadmap, but "no front door at any level" is not a conformant end state.)*
- **P2-2 (MUST):** Menu items show **label + one-line description + the typed syntax** (the `/`/`@` menus already do this — it is now the standard for every menu).
- **P2-3 (MUST):** A power feature entered only through raw markdown MUST also have an affordance. *(Org `#+TBLFM:` formulas are entered today by typing a raw line with no UI — non-conformant; a formula affordance is required, syntax retained as the power path.)*
- **P2-4 (SHOULD):** Stateful generative state is inspectable — variables and tags get an overview surface (a variables list; tag autocomplete — already in backlog "Tag power").
- **P2-5 (SHOULD):** Shorthand previews before it commits (pairs with P4-2).

**Acceptance test:** a user who has read no docs can find and use the feature through visible UI alone (in Guided mode).

### P3 — Reachable (accessibility)

> **Law:** The outline is navigable to assistive technology, and every interactive element is keyboard-operable, programmatically named, and focus-visible — added **additively**, never by a visual redesign and never by replacing `mousedown`.

This principle **defers to `accessibility.md` for sequencing.** §5 states the targets and the interim behavior; `accessibility.md` owns the phase order. The standard's job is to make sure a11y is a *requirement on every feature*, not a separate project that touches the same widgets in a disconnected pass.

- **P3-1 (MUST):** Every interactive element has a programmatic accessible name (`aria-label` or visible label) — `title` alone is insufficient.
- **P3-2 (MUST):** Every interactive element is keyboard-operable, via a `keydown` listener **beside** the existing `mousedown` (the caret invariant).
- **P3-3 (MUST):** Visible `:focus-visible` on every focus stop; honor `prefers-reduced-motion`.
- **P3-4 (MUST):** Color is never the sole carrier of meaning (state badge, `#ERR`, highlight pair with text/icon).
- **P3-5 (MUST):** State changes not tied to focus (reroll, autosave warning, `#ERR`) are announced via the `aria-live` region.
- **P3-6 (deferred, tracked):** Full `role="tree"` on the outline and `tabindex` on pills are **high-risk against the virtual list and the caret invariant** and are sequenced in `accessibility.md`, not ordered here. **Interim requirement (MUST):** until they land, pills carry an accurate `aria-label` ("Dice: 2d6 = 9") updated on reroll, and the outline exposes per-row labels — so the deferral never means "unlabeled and silent."

**Acceptance test:** the feature is operable by keyboard only, and a screen reader announces its name, state, and any result.

### P4 — Responsive (feedback & errors)

> **Law:** Every action confirms; every failure explains. No action produces an unexplained result.

The project already has the **reference pattern**: the storage-quota warning (proactive, plain-language, actionable). Generalize it; don't reinvent it.

- **P4-1 (MUST):** A failure is never silent. *(Inline `{…}` shorthand that fails to promote MUST signal "not recognized," not just stay plain text.)*
- **P4-2 (SHOULD):** Errors explain the cause. *(`#ERR` becomes `#ERR (cycle)` / `(bad ref)` / `(non-numeric)` in the cell and its `aria-label`.)*
- **P4-3 (MUST):** Structural/destructive actions confirm via the existing toast (delete subtree, paste points, cut, bulk indent).
- **P4-4 (MUST):** Feedback reuses the §7.3 pattern — toast for transient success, inline marker for validation, `aria-live` for non-focused change, banner for approaching-limit. No feature invents its own feedback UI.

**Acceptance test:** no action — success or failure — leaves the user with "nothing happened and no reason why."

### P5 — Coherent (one authoring language)

> **Law:** Pointliner has **one** authoring language, not a pile of per-feature mini-languages. A new capability MUST express itself within an existing syntax family. Inventing a new syntax or grammar is a last resort that requires sign-off and, by default, **retires or subsumes** the syntax it overlaps. Net syntax count does not grow casually.

**Why this is its own principle.** The clearest symptom of scattered direction is **syntax sprawl** — each feature shipping its own delimiters and notation, until users (and the AI) face a flood of new ways to write things. The architecture *invites* this: `CLAUDE.md` tells contributors "a new token type / new expression primitive fits very well." That is true for the **engine** and false for the **user** — cheap to add is not free to learn. P5 is the UX counterweight.

- **P5-1 (MUST):** A new feature reuses a syntax from the inventory below. No new top-level delimiter, sigil, or notation without explicit sign-off.
- **P5-2 (MUST):** The `{…}` grammar engine is **the** composition layer for generative/computed inline content. New generative or computed features plug into `{…}` (a new `resolveBrace` branch or an `evalMath` primitive) — **not** a new delimiter. (Already the architecture: "every custom artifact is under grammar." P5 makes it a UX rule too.)
- **P5-3 (MUST NOT):** Ship two syntaxes for the same outcome. A proposed parallel notation — e.g. a render-only `{= expr}` *second* syntax alongside the promoting one, or `B3`-style table refs beside `@row$col` — is rejected unless it **replaces** the old one. (`@row$col` is already declared "the one true form" for tables; extend that discipline everywhere.)
- **P5-4 (MUST):** Every authoring syntax lives in the inventory **and** the `?` panel. A typeable, meaningful syntax that isn't documented in one place is a defect.
- **P5-5 (SHOULD):** Prefer **subsuming over adding** — extend an existing syntax's grammar rather than mint a sibling.

**Syntax inventory — the closed set.** This is the entire authoring language. Additions require sign-off and an inventory update; new work maps onto one of these rows.

| Family | Syntax | Owns |
|---|---|---|
| Markdown | `#`–`######`, `>`, ```` ``` ````/`~~~`, `---`/`***`, `-`/`1.`/`- [ ]`, `**`/`__`, `*`/`_`, `++`, `` ` ``, `~~`, `==` | block + inline text formatting |
| Emoji | `:shortcode:` | emoji |
| Hashtag | `#tag` | tags |
| Footnote | `[^key]` | footnotes |
| Node link | `[[#id\|label]]` | links / mirror |
| Artifact token | `[[type:key]]` | stored pill reference (internal — users never type it) |
| **Grammar engine** | `{…}` → `{= expr}`, `{NdM}`, `{a\|b 2\|c}`, `{rule}`/`{table}`/`{chain}`, `{var}` | **ALL** generative / computed inline content |
| Dice notation | `NdM[!][kh\|kl\|dl\|dh N][>=…]` | dice (inside `@dice` and `{…}`) |
| Grammar rules | `name: a \| b 2 \| c` | named grammar rules |
| Markov | `State -> Target weight, …` | markov chains |
| Roll table | `entry  weight` (one per line) | roll tables |
| Table formula | `#+TBLFM:` with `@row$col` + ranges | table calc (the one true form) |
| TODO headline | `TODO [#A] body` | task state + priority |

**Acceptance test:** the change added **zero** new top-level syntaxes — or, if it added one, it retired/subsumed an overlapping one and updated both the inventory and the `?` panel.

---

## 3. Keyboard grammar (authoritative)

The standard the corpus is missing entirely. Every block type conforms; there are no per-block exceptions. New keyboard work edits this table first.

| Input | Reserved meaning | Notes |
|---|---|---|
| Plain keys / arrows | Act **within** text (type, move caret, select) | MUST NOT be hijacked for structure while editing |
| `Enter` | New point | **All** blocks — *Paragraph is the sanctioned exception — see P1-1* |
| `Shift + Enter` | Line break in the point | **All** blocks — *Paragraph is the sanctioned exception — see P1-1* |
| `Tab` / `Shift+Tab` | Indent / outdent | Points **and** table cells |
| `Alt + ↑/↓` | Move the point (reorder) | The movement modifier — reserved for movement |
| `Ctrl/⌘ + . / ,` | Collapse / expand | Replaces the `Ctrl+↑/↓` binding (which collides with caret-to-edges) |
| `Ctrl/⌘ + Enter` | Zoom into point | — |
| `Esc` | Back out one layer | menu → cell sel → point sel → zoom → blur (P1-3) |
| `Ctrl/⌘ + S / O / F` | Save / open / find | — |
| `Ctrl/⌘ + Z` / `Y` / `Shift+Z` | Undo / redo | — |
| `Ctrl/⌘ + Shift + L` | Copy link to point | — |
| `Ctrl/⌘ + C / X / V` | Copy / cut / paste points | Multi-select context |
| Table `Tab` / `Shift+Tab` / `Enter` | Next / previous cell (wraps across rows; `Tab` at the last cell adds a row) · `Enter` = cell below (stops at last row), `Shift+Enter` = cell above (stops at top row) · computed (formula-driven) cells are read-only (`Σ`-tagged, Tab-navigable) | **P2-3** — lands selecting the cell's contents (type-to-overwrite). Cells are single-line, so `Shift+Enter` navigates (Excel/Sheets convention), never inserts a break. Column ▾ menu: `↑↓` navigate items, `Enter`/`Space` select, `Esc` closes |
| `Ctrl/⌘ + 1…6` | Collapse to level (best-effort) | Toolbar is primary (P1-5) |

**Modifier semantics (memorize these, not the table):** plain = text · `Tab` = depth · `Alt` = move · `Ctrl/⌘` = app command · `Esc` = back out · `Shift` = extend.

---

## 4. Discoverability — the three-door rule

For any capability, build the doors in this order. A feature is not done until all three exist and agree.

| Door | Requirement |
|---|---|
| **Visible affordance** | A control a user can see without knowing the feature exists (toolbar button, `+`, `=`, formula entry, chevron, badge). MAY be verbosity-gated, but MUST exist at the Guided floor. |
| **Typed path** | The keyboard / markdown / shorthand way. |
| **Menu path** | An entry in `/`, `@`, bullet, or a contextual menu that **prints its typed syntax** (P2-2), so the menu *is* the tutorial (`ux.md`'s highest-leverage win). |

**Build discipline (from `ux.md`, now binding):** ship the bare interaction first, then add its helpers (hints, chips, descriptions) as a **separate, verbosity-gated overlay** — so Lean and Guided never diverge.

---

## 5. Accessibility baseline

Restated as a per-feature requirement, deferring to `accessibility.md` for phase order. The non-negotiable framing:

- **Additive only.** Attributes + CSS. No sizing/color/layout change as part of a11y work (matches `accessibility.md`'s guardrail).
- **Alongside, never replacing.** Keyboard handlers are added next to `mousedown`+`preventDefault`. Converting a control to `click`/`<button>` to "make it accessible" is prohibited — it breaks the caret invariant.
- **Per-row at render time.** ARIA goes on in the `render()` pass; there is no global list to patch later.

**Required now (every feature):** accessible names (P3-1), keyboard operability beside mousedown (P3-2), focus-visible + reduced-motion (P3-3), non-color signals (P3-4), `aria-live` for off-focus change (P3-5), and the **interim pill/row labels** of P3-6.

**Sequenced in `accessibility.md` (don't front-run):** full `role="tree"`, `role="grid"` on tables, pill `tabindex`, dialog focus-trap, contrast retune. The standard's contribution is that these stop being a *separate track*: the conformance matrix (§9) and the DoD (`ux-definition-of-done.md`) tie each a11y requirement to the feature that introduces it, so discoverability and accessibility are satisfied **in the same pass on the same widget** — closing the "two disconnected passes" gap.

---

## 6. Feedback & error pattern

One pattern, four channels. Reuse — do not invent.

| Situation | Channel | Reference |
|---|---|---|
| Transient success (link copied, points pasted) | **Toast** | the existing "Link copied" toast |
| Input validation (shorthand preview/failure) | **Inline marker** at the point of input | P4-1/P4-2 |
| State change while focus is elsewhere (reroll, `#ERR`, autosave) | **`aria-live` region** | P3-5 |
| Approaching a limit (storage, depth, size) | **Proactive banner** with an action | the storage-quota warning — the gold standard |

**Tone:** plain language, names the thing, offers the next step. The storage warning ("…save it to a file to be safe") is the template for all of it.

---

## 7. Pattern catalog (canonical implementations)

To stop reinvention, every feature reuses these rather than building its own.

### 7.1 Menu pattern (`/`, `@`, link, state pickers)
One behavior contract: open on trigger → filter as you type → `↑/↓` move, `Enter`/`Tab` apply, `Esc` close (P1-3) → each row = icon + label + description + **typed syntax** (P2-2) → `role="menu"`/`menuitem` per `accessibility.md` Phase 1 → reduced-motion respected. The **file menu is not a menu** — it is a settings `dialog` (per `accessibility.md`); don't force `role="menu"` on it.

### 7.2 Pill pattern (all live inline objects)
Dice/math/variable/grammar/markov/rolltable are one object with different generators (the "everything is under the grammar engine" reality from `CLAUDE.md`). They share: render = icon + (name) + result + edit affordance · interaction = body click re-rolls in place and **stays in display mode**, pencil opens the dialog (the documented model — do not deviate) · authoring = dialog **and** shorthand where inline-able, with preview before promotion (P2-5/P4-2) · a11y = accurate `aria-label` updated on reroll (P3-6 interim). A new generator plugs in here and MUST NOT define its own interaction or a11y behavior.

### 7.3 Feedback pattern
Per §6 — the four channels, no bespoke feedback UI.

### 7.4 Affordance pattern
Per §4 — the three doors, built in order.

---

## 8. Microcopy & terminology

- Use the §1 user-facing vocabulary in every string and `aria-label`.
- Describe **outcomes, not mechanics**: "Collapse point", not "toggle node folding".
- Plain language; the storage-warning copy is the reference register.
- One concept = one word across UI, `?` panel, and docs.
- Every icon-only control: `aria-label` (accessible name) **plus** a `title` (hover) — and `aria-hidden="true"` on the decorative glyph inside so the name isn't doubled (matches `accessibility.md` Phase 0).

---

## 9. Per-feature conformance matrix

The punch list. ✅ conformant · ⚠️ partial · ❌ non-conformant — with the governing rule.

| Feature | P1 predictable | P2 discoverable | P3 reachable | P4 responsive |
|---|---|---|---|---|
| Outline nav / move / indent | ⚠️ (P1-2 collapse binding) | ✅ | ⚠️ (row labels; tree deferred) | ✅ |
| Paragraph block | ✅ (documented prose-mode exception) | ✅ | ⚠️ | ✅ |
| `/` and `@` menus | ✅ | ✅ | ⚠️ (menu ARIA — a11y Ph1) | ✅ |
| Markdown / TODO states | ✅ | ✅ | ⚠️ (P3-4 color) | ✅ |
| Pills (dice/math/grammar/…) | ✅ | ⚠️ (some dialog-only) | ⚠️ (P3-6 labels; focus deferred) | ⚠️ (P4-1 silent shorthand) |
| Variables | ✅ | ❌ (P2-4 no overview) | ⚠️ | ⚠️ |
| Inline `{…}` shorthand | ✅ | ⚠️ | ⚠️ | ❌ (P4-1/P4-2) |
| Tables (cells) | ✅ (Tab/Shift+Tab/Enter nav; computed cells read-only + Σ-tagged) | ⚠️ | ⚠️ (grid ARIA deferred — UXP-19) | ✅ |
| Table formulas (`#+TBLFM:`) | ✅ (column ▾ panel: Sum/Average/Count/Min/Max/None; UXP-3 part A) | ✅ (▾ button hover + touch-visible) | ⚠️ (panel role=menu/menuitem; cell `aria-readonly` deferred — UXP-19) | ✅ (footer auto-added/removed; `#ERR` on invalid formula) |
| Links (`[[ ]]`) | ✅ | ❌ (P2-1 picker gated off, no floor door) | ⚠️ | ✅ |
| Footnotes / hashtags / emoji | ✅ | ⚠️ (tag index P2-4) | ⚠️ | ✅ |
| Search | ✅ | ✅ | ⚠️ | ✅ |
| Autosave / storage | n/a | ✅ | ⚠️ (P3-5 alert — a11y Ph5) | ✅ (reference pattern) |

**Syntax conformance (P5) — read this whenever proposing a feature.** The inventory in §2/P5 **is** the current authoring language; today's set is the baseline, not a problem. The rule is **no growth without sign-off**. The standing risk is *new* sprawl — and the roadmap already contains two examples to police: a proposed render-only `{= expr}`/`{NdM}` "second syntax alongside `[[type:key]]`," and possible `B3`-style table refs. Both are **P5-3 violations unless they replace** what they overlap; route them through the `{…}` engine / `@row$col` instead. Tracked as a standing guard in `ux-remediation.md`.

---

## 10. How this plugs in (altitude map)

- **The spine** (vocabulary split, the five principles, keyboard grammar, the invariants) is summarized in `CLAUDE.md`'s "UX discipline" section so it is **always loaded**.
- **This document** is the full standard — added to `CLAUDE.md`'s "read these before building" list beside `ux.md` and `roadmap.md`.
- **The gate** (`ux-definition-of-done.md`) runs on every UI change and is appended to `adding-an-artifact.md` as its final step, so the per-artifact recipe and the universal UI gate are the same checklist.
- **`ux.md` and `accessibility.md` keep their jobs** (strategy and sequencing); this standard cross-references them so discoverability and accessibility are satisfied together, not in disconnected passes.

---

## Appendix — acceptance tests at a glance

| Principle | The feature is done only if… |
|---|---|
| **P1** | a user can predict an unused shortcut from the grammar |
| **P2** | a docs-free user can find and use it through visible UI (Guided) |
| **P3** | it is keyboard-only operable and a screen reader announces name + state + result |
| **P4** | no action leaves "nothing happened, no reason" |
| **P5** | it added zero new top-level syntaxes (or replaced one and updated the inventory) |

*Compiled against the Pointliner source and its existing guidance docs. The engineering invariants are quoted from `CLAUDE.md`/`accessibility.md`; the principles, vocabulary, keyboard grammar, and gate are the UX standard proposed for adoption.*
