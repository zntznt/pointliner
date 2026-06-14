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
| What a point renders as | `node.type` | **block** (bullet, numbered, to-do, paragraph, heading, code, quote, divider, **base**) | format, kind |
| A live inline object | `artifact` / `[[type:key]]` | **pill** | widget, chip, token, badge |
| Inserting one at the caret (`@`) | `insertInlineArtifact` | **insert** | embed, object |
| Changing a point's block (`/`) | — | **turn into** | convert |
| Focusing a subtree | `focusedId` | **zoom in / zoom out** | drill, hoist, focus |
| Hiding/showing children in place | `collapsed` | **collapse / expand** | fold, toggle |
| Typed syntax that becomes a pill | `promoteInlineShorthand` | **shorthand** | macro, inline formula |
| A keyboard-navigable overlay list | — | **menu** (`/`, `@`, link, state) | dropdown, popup, palette |
| The `#TODO`/`#NEXT`/`#WAITING`/`#DONE` marker (any sequence state) | `#KEYWORD` at start of `node.text` (the `#` prefix reuses the hashtag sigil) | **state badge** | tag, label |
| An ordered, user-definable set of state keywords with a done split (the built-in to-do set is the default one) | `[[seq:key]]` + `node.seq` sidecar · `collectSequences` | **sequence** | workflow, status set, pipeline |
| A static pipe table written in any point's text — a display/export form, not a view of a base | — | **table** | markdown table, grid |
| A structured data object with its own dedicated point; its table view is the current (and default) view | `node.type === 'base'` (code) · `/base` verb | **base** | dynamic table, widget, database |
| The whole-base top bar | — | **base header** | toolbar |
| The base's bullet menu (whole-base ops + node ops) | base bullet (grid icon) → `showBulletPopup` | **base menu** | table menu, ⋯ menu |
| The per-column operations menu | — | **Column menu** | column panel |
| The editable column-name chip in a base header cell | — | **name pill** | header chip |
| One-click column aggregates | `mtApplyAggregate` | **Calculate** | summary |

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

- **P2-1 (MUST):** Every capability satisfies all three doors. A capability that is built but reachable only by syntax (or gated entirely off with no visible path at any verbosity) is **non-conformant**. *(The `[[` link picker was the canonical example — built but gated off; it is now un-gated (UXP-4). The rule stands for the next case: "no front door at any level" is never a conformant end state.)*
- **P2-2 (MUST):** Menu items show **label + one-line description + the typed syntax** (the `/`/`@` menus already do this — it is now the standard for every menu).
- **P2-3 (MUST):** A power feature entered only through raw markdown MUST also have an affordance. *(Org `#+TBLFM:` formulas are entered today by typing a raw line with no UI — non-conformant; a formula affordance is required, syntax retained as the power path.)*
- **P2-4 (SHOULD):** Stateful generative state is inspectable — variables and tags get an overview surface. *(Both shipped: the variables panel + `{` picker — UXP-9; the `#` tag picker sourced from the document-wide tag index — UXP-10.)*
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
- **P3-6 (landed — UXP-19):** Full `role="tree"` on the outline (flat treeitems + `aria-level`/`posinset`/`setsize`, the virtualized-tree pattern), `role="grid"` on interactive bases, and `tabindex="-1"` + Enter/Space activation on pills shipped in the dedicated UXP-19 pass — additively, beside the existing `mousedown` paths (the caret invariant held). The interim labels (pill `aria-label` updated on reroll, per-row labels) remain in force as the ongoing P3-5 obligation.

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
| **Grammar engine** | `{…}` → `{= expr}`, `{NdM}`, `{a\|b 2\|c}`, `{cond: then \| else}`, `{rule}`/`{table}`/`{chain}`, `{var}` | **ALL** generative / computed inline content |
| Dice notation | `NdM[!][kh\|kl\|dl\|dh N][>=…]` | dice (inside `@dice` and `{…}`) |
| Grammar rules | `name: a \| b 2 \| c` | named grammar rules — **a roll table IS one of these** (one rule = a weighted table; the `entry weight`-per-line roll-table syntax was **retired** by the June 2026 collapse, legacy records migrate on load) |
| Markov | `State -> Target weight, …` | markov chains |
| Table formula | `#+TBLFM:` with `@row$col` + ranges | table calc (the one true form) |
| Status headline | `#TODO [#A] body` (any sequence keyword; `#` reuses the hashtag sigil) | task state + priority — the keyword may be any state of any **sequence** (default or user-declared); bare `TODO` without `#` is plain text |
| Search query | `term term` (AND), `"a b"`, `-term`, `#tag`, `is:done`/`is:todo`/`is:note`, `due:`/`start:` `today`/`overdue`/`<date`/`>date` | search-box filtering only — never node text. Recorded UXP-20 decision (2026-06-13): operators over the **existing** vocabulary (`#tag` IS the hashtag row; `-`/quotes are the universal search convention; `is:` is the one new field-prefix pattern). AND-only; OR deferred; no `state:` operator — `#KEYWORD` states are hashtag-shaped, so `#waiting` already filters by state. Malformed tokens stay literal text (the `{…}` escape-hatch rule). `due:` and `start:` are date-aware specialisations of the existing `key:value` property operator (one per date key) — not a new operator family. Front doors: the focus-shown legend under the box + the `?` panel |
| Progress cookie | `[/]` (fraction), `[%]` (percent) | a live tally of a point's checkboxes + child tasks. Recorded UXP-20 decision (2026-06-13): the **Org-canonical** cookie, reusing the `[…]` bracket authoring family (`[ ]`/`[x]`, `[#A]`, `[^key]`, `[[…]]`) — no new sigil. A computed *display* value (edit shows the `[/]` recipe, render shows `[2/5]`), the same edit-raw/render-pretty model as `#+TBLFM:`; the token is plain text in `node.text`, no sidecar. Counts each checkbox marker individually + each keyword/sequenced child once (done-ness sequence-aware); scope = own text + direct children. Front door: `@progress`. A non-cookie literal `[/]`/`[%]` only renders when the point owns tasks; otherwise it stays text |
| Dates (start + due) | `start: YYYY-MM-DD` and/or `due: YYYY-MM-DD` (also `today`, `today+N`, `tomorrow`) as **property** values | per-point scheduling as a start→due **range** (project-management style). Recorded UXP-20 decision (2026-06-13, extended 2026-06-13): dates live as `start`/`due` properties in `node.props` — zero new authoring syntax (the properties system already exists); the `due:`/`start:` search operators are date-aware extensions of the existing `key:value` search row. Displayed as date-smart chips (Today / Tomorrow / Mon / 3d overdue; the start chip leads with `▸`). Front doors: `/due` slash verb (labelled **"Schedule"**), bullet menu "Set / Edit dates", Agenda strip (toolbar button). The Schedule dialog's date fields carry a full-width **inline `role=grid` calendar** — type in the field or `ArrowDown` into the grid, arrows + Enter/click to pick (day cells fire on `mousedown`+`preventDefault`, the caret invariant; the caret returns to the field on pick). Clicking a `due`/`start` chip opens the Schedule dialog; date keys don't appear in the generic Properties editor. The Agenda is a **two-row horizontal strip** in the toolbar (Due row + Running row) with a left toggle group (Running / Done) — a horizontal strip, not a vertical sidebar, so it never constrains the outline width or obstructs a mobile screen; calendar / timeline view buttons are planned for the same control group. |

**Note — conditional text reuses the Grammar-engine row.** Recorded decision (2026-06-14): `{cond: then | else}` (Ink-style conditional text — emit `then` when the comparison holds, else `else`; `else` optional) is a new **content-sniffed sub-form of the existing `{…}` brace grammar**, not a new top-level delimiter — the same kind of addition as `{= expr}` / `{NdM}` / `{a|b}` already on that row. It mints no new sigil at the floor: the condition is an **`evalMath` comparison** (the existing expression engine, reused) and the branches are **grammar templates** (the existing engine, reused); the only new lexical element is the `:` separator *inside* a conditional brace, content-sniffed exactly like the brace's existing `=`/`|`/dice forms. Detection is syntactic (a comparison before a top-level `:`, no top-level `|` in the condition) so a plain alternation `{a|b}`, a rule definition `name: …`, or a prose `{note: hi}` never read as a conditional. An unresolvable condition fails **visibly** (`{cond?}` marker, P4), never silently. Front doors (P2/P5-4): the `{cond}` chip + hint in the grammar dialog, and the **Pills & shorthand** row in the `?` panel. The inventory row gains a form; no new family.

**Note — sequences add NO new syntax.** User-definable state sets (sequences) ship entirely on existing rows: declared via `@` (an artifact-token `[[seq:key]]` pill, like `@var`), applied via `/` (writes `#KEYWORD` into the status-headline position), and the `#keyword`-in-text IS the existing hashtag sigil reused. The `#` prevents bare capitalized words from accidentally becoming badges; `#word` that is not a known state is a normal clickable hashtag. The inventory does not grow.

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
| `Shift + F10` / `ContextMenu` (Menu key) | Context menu of the **focused element** — a focused **point/bullet** → that point's bullet popup (`#bpop`); a focused **base cell** → the **Column menu** for that cell's column | The OS-standard "context menu of the focused element". Opens the menu and moves focus into it: `↑↓`/`Home`/`End` navigate, `Enter`/`Space` activate, `Esc` closes. The bullet popup carries every per-point action (type switch, zoom, copy link, move, delete, convert-to-base — and, on a base, the whole-base ops); the Column menu carries every per-column op. So it is the single keyboard door to both, with no dedicated chord (the colliding `⌘+M`/`⌘+Shift+M` were dropped — see below) |
| `Esc` | Back out one layer | menu → cell sel → point sel → zoom → blur (P1-3). **Backing out of chrome restores the interrupted edit**: leaving the search field, the file menu, or the help panel via `Esc` puts the caret back exactly where it stood — same point, same offset — unless another point was focused meanwhile (`armChromeReturn`/`restoreChromeReturn`) |
| Search `↓` | Step from the search field into the outline | First **matching** point while a filter is active, else the first displayed point. The filter stays applied; `Esc` from the landed point follows the normal back-out order |
| `Ctrl/⌘ + S / O / F` | Save / open / find | — |
| `Ctrl/⌘ + Z` / `Y` / `Shift+Z` | Undo / redo | — |
| `Ctrl/⌘ + Shift + L` | Copy link to point | — |
| `Ctrl/⌘ + C / X / V` | Copy / cut / paste points | Multi-select context |
| Table `Tab` / `Shift+Tab` / `Enter` | Next / previous cell (wraps across rows; `Tab` at the last cell adds a row) · `Enter` = cell below (stops at last row), `Shift+Enter` = cell above (stops at top row) · computed (formula-driven) cells are read-only (`Σ`-tagged, Tab-navigable) | **P2-3** — lands selecting the cell's contents (type-to-overwrite). Cells are single-line, so `Shift+Enter` navigates (Excel/Sheets convention), never inserts a break. Column ▾ menu: `↑↓` navigate items, `Enter`/`Space` select, `Esc` closes |
| Table `↑/↓/←/→` | `↑/↓` cell above / below — at the top/bottom edge, **exit** the base to the adjacent outline point. `←/→` cell left / right — stop at the left/right edge (no wrap, no exit; horizontal has no outline analog) | Plain-arrows rule: the caret moves within the cell's text first; navigation fires at the text edge — the first/last line for `↑/↓`, the first/last character for `←/→` — same convention as `↑/↓` between points (which likewise **enter** a base's first/last cell when arrowing past it). A navigation-placed (type-to-overwrite) selection acts as a spreadsheet cursor: arrows move cells directly. That nav-placed selection never opens the selection toolbar; an intentional one (mouse drag, `Shift+arrows`, `Ctrl/⌘+A`) does. `@` in a cell opens the insert menu (sans Table — no table-in-base — and Footnote, which is point-level) |
| `Ctrl/⌘ + 1…6` | Collapse to level (best-effort) | Toolbar is primary (P1-5) |

*(Retired: `Ctrl/⌘ + M` (Column menu) and `Ctrl/⌘ + Shift + M` (Base menu). `⌘+M` collides with the macOS "minimize window" system shortcut, so both chords were dropped. Column **and row** ops → `Shift+F10` on a focused base cell (the cell's context menu covers both axes; row sections appear on data rows); base menu → the base's bullet popup (`Shift+F10` on the focused point), where whole-base ops live. No dedicated chord remains for any of them.)*

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

**Sequenced in `accessibility.md` — all landed:** full `role="tree"`, `role="grid"` on tables, and pill `tabindex` (UXP-19); dialog focus-trap (UXP-16); contrast retune (UXP-18). The standard's contribution is that these stopped being a *separate track*: the conformance matrix (§9) and the DoD (`ux-definition-of-done.md`) tie each a11y requirement to the feature that introduces it, so discoverability and accessibility are satisfied **in the same pass on the same widget** — closing the "two disconnected passes" gap.

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

### 7.1 Menu pattern (`/`, `@`, `{`, `#`, link, state pickers)
One behavior contract: open on trigger → filter as you type → `↑/↓` move, `Enter`/`Tab` apply, `Esc` close (P1-3) → each row = icon + label + description + **typed syntax** (P2-2) → `role="menu"`/`menuitem` per `accessibility.md` Phase 1 → reduced-motion respected. The **file menu is not a menu** — it is a settings `dialog` (per `accessibility.md`); don't force `role="menu"` on it. The **`{` callable-name picker** (UXP-9) is this pattern applied to the grammar engine's namespace: it opens on a bare identifier prefix inside an unclosed `{`, groups by kind (Variables / Rules / Tables / Chains, variables showing their resolved value), and applying writes the existing `{name}` reference — discoverability for callable names with **no new syntax** (P5-conformant by construction). The **`#` tag picker** (UXP-10) is the same pattern over the document-wide tag index (`collectTags`, usage counts shown): it opens on `#prefix` at the caret (mdInline's sigil rule; never inside a `[[#id|…]]` link token) and applying writes the existing `#tag` — so tags stop drifting (`#todo` vs `#todos`).

### 7.2 Pill pattern (all live inline objects)
Dice/math/variable/grammar/markov/rolltable are one object with different generators (the "everything is under the grammar engine" reality from `CLAUDE.md`). They share: render = icon + (name) + result + edit affordance · interaction = body click re-rolls in place and **stays in display mode**, pencil opens the dialog (the documented model — do not deviate) · authoring = dialog **and** shorthand where inline-able, with preview before promotion (P2-5/P4-2) · a11y = accurate `aria-label` updated on reroll (P3-6 interim). A new generator plugs in here and MUST NOT define its own interaction or a11y behavior.

### 7.3 Feedback pattern
Per §6 — the four channels, no bespoke feedback UI.

### 7.4 Affordance pattern
Per §4 — the three doors, built in order.

### 7.5 Column menu (consolidated table-column ops)
A base column's operations live in **one** menu — the Column menu — off the **name-pill header cell** (Bases PR 2c). The column name is an editable **name pill**; **clicking the header cell around the pill** opens the Column menu, **dragging it** reorders, and a **right-border grip** resizes (double-click = auto-fit). There is no separate `▾` opener and no hidden gestures (the old double-click-cycles-alignment is gone). The menu follows the §7.1 pattern (`role="menu"`/`menuitem`, `↑↓`/`Home`/`End`/`Enter`/`Esc`, reduced-motion respected) and grows by **section**, not by sprouting header controls: today **Calculate · Alignment · Width · Insert column · Move column · Delete column**; later formatting etc. slot in as further sections. The rule: a new per-column capability is a new menu section, **never** a new hidden header gesture. **Keyboard door:** `Shift+F10` / the Menu key on a focused base cell opens the **cell's context menu** — the Column sections plus, on a data row, the Row sections (Insert above/below · Move up/down · Delete row) — covering both of the cell's axes with no extra chord (replacing the dropped `⌘+M`, which collided with macOS minimize — see §3). The row handle's click menu (`showRowPanel`) stays the pointer path. Direct-manipulation paths (drag-reorder, drag-resize) each ship a **visible cue** and a keyboard-reachable twin in the menu (Move left/right, Width presets), so nothing is drag- or double-click-only (P1/P2/P3).

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
| Outline nav / move / indent | ✅ (collapse on `Ctrl/⌘+./,`; UXP-5) | ✅ | ✅ (flat ARIA tree: treeitem + level/posinset/setsize/expanded/selected — UXP-19; collapse-btn + breadcrumb named/keyboard-operable — UXP-14) | ✅ |
| Paragraph block | ✅ (documented prose-mode exception) | ✅ | ⚠️ | ✅ |
| `/` and `@` menus | ✅ | ✅ | ⚠️ (menu ARIA — a11y Ph1) | ✅ |
| Markdown / TODO states | ✅ | ✅ | ⚠️ (P3-4 color) | ✅ |
| Pills (dice/math/grammar/…) | ✅ | ✅ (all reachable via `@` menu — UXP-11 audit; SHORTCUTS names each type) | ✅ (labels + reroll announcements — UXP-15; pencils named + Enter/Space-operable — UXP-13/14; dialogs focus-trap + restore — UXP-16; pill `tabindex="-1"` + Enter/Space body activation — UXP-19) | ✅ (gr-bad typo marker — UXP-6; live `#ERR` — UXP-34) |
| Variables | ✅ | ✅ (`{` picker + variables panel; UXP-9) | ⚠️ | ⚠️ |
| Inline `{…}` shorthand | ✅ | ✅ (live preview tooltip on `}` close: → dice/math/grammar/var — UXP-7) | ⚠️ | ✅ (gr-bad typo marker + AT announce — UXP-6) |
| Tables (cells) | ✅ (Tab/Shift+Tab/Enter nav; computed cells read-only + Σ-tagged) | ⚠️ | ✅ (`role="grid"` + native row/columnheader/gridcell mapping; computed cells `aria-readonly` — UXP-19) | ✅ |
| Table columns (ops) | ✅ (one Column panel: Calculate/Alignment/Insert/Move/Delete; no hidden double-click; UXP-21) | ✅ (one sized ▾ door; grip cue for drag; full-height "+") | ✅ (panel role=menu/menuitem keyboard-operable; sized targets + aria-labels; `Shift+F10` cell context menu covers row ops too — UXP-14) | ✅ (refresh reflects every op) |
| Table formulas (`#+TBLFM:`) | ✅ (Calculate aggregates + the Formula dialog for arbitrary `$N=`/`@R$C=` assignments; UXP-3 A+B) | ✅ (Formula menu section; column-name chips ARE the reference picker; hint teaches the grammar; raw `#+TBLFM:` stays the power path) | ✅ (panel role=menu/menuitem; dialog focus-trapped — UXP-16; computed cells `aria-readonly` — UXP-19) | ✅ (live computed preview in the dialog; footer auto-added/removed; reason-coded `#ERR (cycle/bad ref/non-numeric)` — UXP-8) |
| Links (`[[ ]]`) | ✅ | ✅ (`[[` picker live — UXP-4; Copy-link stays the power path) | ✅ (listbox/option + activedescendant) | ✅ (rename repaints on-screen links immediately) |
| Footnotes / hashtags / emoji | ✅ | ✅ (`#` tag picker — UXP-10) | ⚠️ (fn-panel keys named + Enter/Space-operable — UXP-14) | ✅ |
| Search | ✅ | ✅ | ⚠️ | ✅ |
| Autosave / storage | n/a | ✅ | ✅ (`role="alert"` on the warning — UXP-18) | ✅ (reference pattern) |

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
