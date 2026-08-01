# Guided authoring: no-syntax "Add another like this" — proposal

**Status: PROPOSED (2026-08). Tracks issue #1240. Owner-directed: no-syntax authoring is the territory
of Guided mode and will be solved there.**

## The problem (from the 2026-08 laptop panel)

Seven personas of various walks of life were briefed on the product identity and grounded in the real
starters. Every one of them — the five who kept the app and the two who walked — hit the SAME wall:

> Reading a pre-built starter is delightful. Making it YOURS means typing the brace language.

The overhaul solved *recognition* (the first screen now says "this is you"). The next wall is
*authorship*: the moment a user goes from reading a starter to **adding their own data**, the syntax
tax appears. They must hand-type tags and props: an expense is `Aldi #august #groceries {prop cost: 92.4}`,
a book is `Klara and the Sun {prop pages: 320} {prop rating: 4} #2026`, a flashcard is another `Q (A)`
segment inside one long `{shuffle: … | … }` line. The nurse ("the exact thing that made me quit Notion"),
the teacher ("my index cards never had a syntax error"), the shop owner ("I will not learn where the `#`
goes"), the designer ("the busywork I resent"), and the novelist ("remembering to type `#character`") all
named it. This is the single highest-leverage finding of the panel.

**This is not a new-syntax request.** It is P2 (every capability has a visible front door, *never
syntax-only*) not yet met for authoring props, tags, and list rows. The fix writes the EXISTING braces for
the user; it never adds a language (P5 holds).

## The rails that already exist (we extend, we do not invent)

- **Guided is the default verbosity tier** (`verbosity = 'guided'`), and in it `/` and `@` open the
  **Builder** instead of the raw slash menu (`isGuided()` → `openBuilder`). Standard/lean strip the
  teaching surface for power users.
- **`BUILDER_FORMS`** is a declarative registry: `{ fields, insert: vals => syntax }`. The Builder renders
  the form, the user fills VALUES, and it emits the braces (see `convert`, `meter`, `image`, `@table`).
- **`showBuilderForm(cmd, pane, cfgOverride)`** already accepts a `cfgOverride`, so a form config can be
  **computed on the fly** — the hook for a dynamic, shape-inferred form.
- `/prop` already has a fill-in form and a point-menu "Add property" editor; `#tag` insertion exists.

Today these cover single-pill inserts. The panel's pain is one level up: **growing a list**.

## The design: "Add another like this" (shape inference)

The recurring authoring moment is a user looking at a list of sibling points that share a shape:

| Example sibling | Inferred shape |
|---|---|
| `Aldi weekly shop #august #groceries {prop cost: 92.4}` | text + shared tags `#august #groceries` + number prop `cost` |
| `Klara and the Sun {prop pages: 320} {prop rating: 4} #2026` | text + number props `pages`, `rating` + tag `#2026` |
| `Sereth Vale, cartographer #character` | text + tag `#character` |
| `#TODO Call the dentist {date due: today}` | to-do marker + text + date `due` |

**Infer the template from the siblings, then present a values-only form.** The nurse types
"Aldi, 92.40"; we write `Aldi #august #groceries {prop cost: 92.40}`. No braces, no `#`, no `{prop}` typed.

### The front door (owner decision, 2026-08): a VISIBLE "+ Add another" affordance

The primary door is a persistent **"+ Add [noun]"** control at the end of a shaped list, always visible in
Guided mode — because the people who bounced will never type `/`. It opens the inferred form inline. The
Builder route (typing `/` on a new bullet offers the same inferred "Add …" as its top suggestion) is a
secondary door for keyboard users and comes for free from the same computed form; it is not the v1 focus.
The inferred noun comes from the parent heading or the shared tag ("expense", "card", "character",
"book"), falling back to "item".

## Phased plan

- **Phase 0 — the pure core.** `inferRowShape(siblings)` → `{ sharedTags, props:[{key,type}], todo,
  dateKey }`, DOM-free, added to `load-cores`, pinned both arms. This is the risky, testable heart: does it
  reliably detect the shared shape without over- or under-including (e.g. a tag on only one sibling is not
  "shared"; a prop's type is inferred number vs text from its values)? Also a pure `buildRow(shape, values)`
  → the bullet text string, pinned. Prove both by reverting.
- **Phase 1 (v1) — "Add a row like this."** The visible "+ Add [noun]" affordance at the end of a shaped
  sibling list; clicking it opens a computed form (fed to `showBuilderForm` via `cfgOverride`) with one
  field per prop plus a text field; tags and to-do/date markers applied automatically; `insert` calls
  `buildRow`. Guided-tier only (standard/lean untouched). Covers expenses, books, cast, inventory, tasks,
  syllabus lines — the majority of the panel's pain. **Decision: rows first; decks are Phase 2.**
- **Phase 2 — "Add a card"** for `{shuffle:}` decks (structurally different — cards live inside one pill):
  a form (card text / optional answer) that appends to the deck body without the user touching the raw
  pipe-delimited line. The teacher's exact ask.
- **Phase 3 — discoverability & mobile rails.** Refine where the affordance appears so a non-syntax user
  never needs `/`; onboarding nudge on first landing in a starter. These same forms become the tap targets
  that unlock #1245 (mobile / phone-first quick entry) — the same "fill values, we write the braces" forms
  are what make one-handed phone entry possible.

## Binding constraints (all satisfied)

- **P5 — no new syntax.** Every form writes existing braces; the syntax inventory is unchanged.
- **P2 — additive front door.** The form sits ALONGSIDE typing; power users keep `/prop:owner=zeo` etc.
  Nothing is removed.
- **Verbosity-gated.** Guided tier only by default (the teaching tier); standard/lean are unaffected,
  matching the dial's philosophy.
- **Caret invariant (P3-3).** Any affordance is wired mousedown + preventDefault with keyboard added
  alongside; never converted to `click`/`<button>` in a way that breaks the caret.
- **Both-arms discipline.** Pure cores (`inferRowShape`, `buildRow`) extracted, in `load-cores`, seeded and
  pinned; the DOM wiring source-pinned AND live-driven (a form that inserts must be watched inserting in the
  running app — a handler on an unfocusable node passes a pin but is dead, #1021).

## Open design questions (resolve during build, not blockers)

1. **Where exactly the "+ Add" affordance attaches** in the render pipeline (end of a children list under a
   heading; only when a shared shape is detected; how it looks so it invites without adding noise).
2. **Shape-detection threshold** — how many siblings must share a tag/prop before it is "the shape" (2? a
   majority?), and how to handle a heterogeneous list (offer the most common shape, or no affordance).
3. **Noun inference** — heading vs tag vs a sensible default; keep it honest, never a wrong label.
4. **The number-vs-text prop type** — inferred from existing values; a prop that is a number gets a numeric
   field so totals/checks keep working (the whole point).
5. **Empty-list case** — a starter section a user starts from scratch has no siblings to infer from; v1 can
   require one example row (the starters all ship with examples), with the from-scratch path deferred.

## Verification plan

- `node --test tests/test.mjs` green; `inferRowShape`/`buildRow` pins bite.
- Live-drive in Chrome: on the Household budget starter, use "+ Add expense", fill "Aldi / 92.40", and
  confirm the new bullet reads `Aldi #august #groceries {prop cost: 92.40}` AND the month total, the
  category total, and the cap check all move — the payoff the nurse and shop owner never reached.
- UX Conformance Statement (P2 door added, P5 no new syntax, P3 caret invariant), per the UI-change process.
