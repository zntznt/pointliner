# Guided authoring: no-syntax "Add another like this" — proposal

**Status: PROPOSED (2026-08). Tracks issue #1240. Owner-directed: no-syntax authoring is the territory
**Shipped so far:** #1240 already carries passing tests for the builder machinery (`inferRowShape`, `buildRow`, `BUILDER_FORMS`) and phase-4 view-door wiring. Confirm what remains before treating this proposal as unbuilt.

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

The primary door is a **"+ Add [noun]"** control at the end of a shaped list — because the people who
bounced will never type `/`. It opens the inferred form inline. The inferred noun comes from the parent
heading or the shared tag ("expense", "card", "character", "book"), falling back to "item".

**But "primary" is not "only," and it must NOT be a guided-only feature** — that would make a *capability*
depend on the tier, which violates the dial's first law (`ux.md`: "Lean = less guidance, never fewer
features"). See the verbosity-conformance section below for the exact model. In short: the capability rides
the SAME three-tier surface `/` and `@` already use (Builder form → slash-menu item → one-line lean tip),
and the "+ Add" control is an edit-pencil-class *convenience* (present at every tier, chrome receding in
Lean), not a guided-only bolt-on.

### The "Add another" family: ONE door, TWO engines (the template tie-in)

A list row is not always flat. In the Series bible each `#character` is a *page* — a bullet with
trait/debt/wants children; a scene is a structured block. A flat `inferRowShape` + `buildRow` cannot
reproduce that. But the app already has the other engine: **template stamping.** `/template` (stamp a
saved subtree), `/savetemplate` (capture this point + its children as a named template), the template
picker, pack-provided templates, and `stampTemplate(nodeId, name)` → `deepCloneNodeNewIds` (the clone path
whose internal-link remap we just fixed, #1237-adjacent). So "+ Add another" is one front door with **two
engines, routed by the sibling's shape**:

- **Flat siblings** (tags + props, no children — expenses, books, tasks) → the inferred **values form**
  (`inferRowShape` + `buildRow`, Phase 0). Fill values, we write the row.
- **Structured siblings** (children — a character page, a scene) → **stamp** a fresh copy and drop the user
  in to fill it. The structure comes from either (a) a sibling treated as an *implicit template* — infer
  the subtree the same way we infer a flat row's shape, blanking the fillable leaves — or (b) a named
  `/savetemplate` / pack template for that kind. Either way it reuses `stampTemplate` /
  `deepCloneNodeNewIds` wholesale, so a stamped character page keeps its structure and any internal
  `[[#id|]]` links remap correctly.

This is DRY (no new stamp mechanism — the machinery exists and is now link-safe), and it closes the exact
gap flat inference left: the structured kinds. It also connects the user's own `/savetemplate` "kinds" to
the affordance — a captured template becomes a "+ Add [that kind]" the moment it exists. The affordance's
routing is designed for both engines from the start (Phase 1 implements the flat engine; Phase 2 the
stamp engine), so "+ Add" is never rebuilt, only extended.

## Verbosity conformance (guided / standard / lean) — the part that must not introduce garbage

`ux.md` is binding here, and its model is "one UI, conditional helpers; build lean-first; the dial strips
what EXPLAINS and how much it AFFORDS, never WHAT you can do." The plan conforms as follows. The base
(Lean) interaction is built first; each richer tier only *adds* a removable layer.

**The capability (add a shaped row) is reachable at every tier — three surfaces of one thing:**

- **Always, all tiers — typing.** Any user can type the row directly (`Aldi #august #groceries {prop cost:
  92.40}`). This is the bare interaction and it is unchanged. A Lean user already knows the syntax; this is
  their fast path and it is never taken away.
- **Via `/` — riding the existing three-tier menu surface**, exactly like every other command (`index.html`
  branches this already): **Guided** → the Builder renders the computed form; **Standard** → the slash menu
  lists "Add [noun]" with its description (menus are conveniences, kept); **Lean** → `renderLeanSlashTip`
  shows the one-line caret tip, blind-typing-plus-confirm — no proactive menu. So the row-add is
  lean-compatible *by construction*, not by a special case.

**The "+ Add [noun]" affordance is an edit-pencil-class convenience, gated like the pencil, not like a hint:**

- The dial table already sets the precedent: inline pill **edit pencils** are "visible on hover" in Guided
  and Standard, and in Lean "hidden until keyboard focus (still clickable)". The "+ Add" control takes the
  **identical** rule — **Guided/Standard: visible at rest / on hover; Lean: hidden until keyboard focus, but
  always still clickable** (P3, "every clickable widget stays clickable at all levels"). At-rest Lean stays
  a clean keyboard-first canvas with zero new chrome; the capability is still one keystroke away.
- Its explanatory chrome — a `title=` tooltip like "add another expense" — follows the **tooltip rule**:
  present in Guided, **stripped in Standard and Lean** (`isStandardOrLean()` sweep), with the `aria-label`
  twin always kept (P3). Standard's charter is "stop explaining, keep the conveniences": the control stays,
  the sales pitch for it goes.

**The form itself is a dialog-class convenience, not tier-gated** (the dial table: modal chips/dialogs are
"full set — not tier-gated"). When explicitly invoked — clicking "+ Add", or the `/` command — the form
opens at any tier; the dial governs what is shown *proactively/at rest*, never what an explicit action
produces. A Lean user who clicks "+ Add" gets the form; the dial just never *pushes* it at them.

**Any teaching is a nudge, and nudges are Guided-only, once-ever** (the #519 precedent): the single
allowed teaching aid is a one-time `fireNudge` toast the first time a shaped list appears ("Tip: use + Add
to grow this list without typing tags"), which `fireNudge` already suppresses in Standard/Lean and persists
as seen. No persistent hint text, no re-nag.

**Net effect per tier:** Lean gains nothing at rest (no chrome, no hint, tooltip stripped) and loses
nothing (type it, or `/` → one-line tip, or focus-reveal the still-clickable control). Standard gains the
clickable "+ Add" convenience and the slash-menu item, minus the tooltip and the nudge. Guided gets the
full teaching surface. That is the dial working as designed, not a fourth variant bolted on.

## Phased plan

- **Phase 0 — the pure core.** `inferRowShape(siblings)` → `{ sharedTags, props:[{key,type}], todo,
  dateKey }`, DOM-free, added to `load-cores`, pinned both arms. This is the risky, testable heart: does it
  reliably detect the shared shape without over- or under-including (e.g. a tag on only one sibling is not
  "shared"; a prop's type is inferred number vs text from its values)? Also a pure `buildRow(shape, values)`
  → the bullet text string, pinned. Prove both by reverting.
- **Phase 1 (v1) — "Add a row like this," built lean-first in two layers.**
  - **1a (the bare interaction, all tiers).** A `/`-invokable "add row" command that reads `inferRowShape`
    and produces the computed form via `showBuilderForm(cmd, pane, cfgOverride)` — so it flows through the
    existing three-tier surface for free (Builder form in Guided, slash-menu item in Standard, one-line tip
    in Lean). This is the lean-compatible base; nothing about it is guided-only.
  - **1b (the affordance-reveal overlay).** The visible **"+ Add [noun]"** control at the end of a shaped
    list, wired to the SAME command/form as 1a. Gated with the **edit-pencil rule** (visible in
    Guided/Standard, hidden-until-keyboard-focus in Lean, always clickable); its `title=` tooltip stripped
    in Standard/Lean; `aria-label` kept. Plus the Guided-only first-time `fireNudge`.
  The form has one field per inferred prop plus a text field; tags and to-do/date markers are applied
  automatically; `insert` calls `buildRow`. Covers expenses, books, cast, inventory, tasks, syllabus lines
  — the majority of the panel's pain. The "+ Add" routing is designed for BOTH engines here (flat now,
  stamp in Phase 2), so the door is extended, never rebuilt. **Decision: flat rows first.**
- **Phase 2 — the STAMP engine for structured kinds (the template tie-in).** When the siblings are
  structured (children — a Series-bible character page, a scene), "+ Add [noun]" stamps a fresh copy
  instead of opening the flat form, reusing `stampTemplate` / `deepCloneNodeNewIds` wholesale (internal
  `[[#id|]]` links remap correctly). The structure source is a sibling as an *implicit template* (infer +
  blank the fillable leaves) or a named `/savetemplate` / pack template. Closes the structured-item gap
  flat inference left, and wires a user's own captured templates into the affordance.
- **Phase 3 — "Add a card"** for `{shuffle:}` decks (a third micro-engine — cards live inside one pill):
  a form (card text / optional answer) that appends to the deck body without the user touching the raw
  pipe-delimited line. The teacher's exact ask.
- **Phase 4 — discoverability & mobile rails.** Refine where the affordance appears so a non-syntax user
  never needs `/`; onboarding nudge on first landing in a starter. These same forms become the tap targets
  that unlock #1245 (mobile / phone-first quick entry) — the same "fill values, we write the braces" forms
  are what make one-handed phone entry possible.

  **Phase 4 status (shipped): the two halves as filed were already done; the real gap was elsewhere.**
  Measured before building, rather than assumed:
  - *"Onboarding nudge on first landing in a starter"* — **already shipped.** `maybeAddRowAffordance`
    fires `fireNudge('addrow-affordance', …)` the first time a door renders, which is Guided-only and
    once-ever, exactly as the verbosity section above specifies.
  - *"Refine where the affordance appears"* — **already shipped for starters.** Parsing all 14 starter
    documents: **26 shaped lists, 26 with a door.** #1330 (heading-only → plain bullets with a number
    column) had closed it. There was no gap left where this phase assumed one.
  - **The actual gap, found by driving the app:** every door hangs off its PARENT's rendered row, and
    the point you are *looking at* has no row in its own view. So zooming into `## Groceries` made its
    `+ Add`/`+ Total`/`+ Check` **disappear**, and a shaped list at the top level of a document never
    had them. The zoom case is the P1 break — you zoom in to work on that list and its controls leave.
    `viewDoorHost` + `renderViewDoors` give the view parent's doors a home at the end of the rows they
    act on, reusing the row builders verbatim so the two placements cannot drift.

  **Still open, and NOT closed by this phase (filed separately):** the doors are **mouse-only**. They
  carry `tabindex="-1"` with no keydown path, and driving Tab through the outline reaches
  `.node-content` and never a door. The `/` route this document promises above ("Standard → the slash
  menu lists 'Add [noun]'") was never built — `openAddRowForm` has exactly one caller, the door itself.
  So the *capability* has no keyboard path at any tier, which is P2/P3 unmet for the whole family, not
  a defect of this phase. It predates Phase 4 and wants its own change.

## Binding constraints (all satisfied)

- **P5 — no new syntax.** Every form writes existing braces; the syntax inventory is unchanged.
- **P2 — additive front door.** The form sits ALONGSIDE typing; power users keep `/prop:owner=zeo` etc.
  Nothing is removed.
- **Verbosity-conformant (not "guided-only").** See the verbosity-conformance section: the CAPABILITY is
  reachable at every tier (type it, or `/` → the three-tier menu surface), the "+ Add" control is an
  edit-pencil-class convenience (Lean = hidden-until-focus, still clickable), its tooltip is stripped in
  Standard/Lean, the form is dialog-class (not tier-gated on explicit invoke), and the only teaching aid is
  a Guided-only once-ever nudge. Lean gains no at-rest chrome and loses no capability — the dial's first
  law ("less guidance, never fewer features") holds. Built lean-first (1a before 1b).
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
6. **At-rest chrome density (the look-and-react loop, `ux.md` caveat).** Even in Guided, a "+ Add" at the
   end of every shaped list could read as clutter. Tune on the running app: on-hover-of-the-list vs
   always-visible, weight/placement, and whether Standard should hover-reveal it (like the pencil) rather
   than show it at rest. This is visual tuning, not a spec decision — decide with eyes on it.
7. **Flat-vs-structured routing + implicit-template blanking (Phase 2).** When is a sibling "structured"
   enough to stamp rather than open the flat form — any children at all, or children-that-are-not-just-
   pills? And for the sibling-as-implicit-template path, which leaves get blanked for the user to fill vs
   kept as scaffolding prompts (e.g. keep the `trait:`/`debt:` labels, blank their values)? Decide with the
   real Series-bible / scene structures in front of us.

## Verification plan

- `node --test tests/test.mjs` green; `inferRowShape`/`buildRow` pins bite.
- Live-drive in Chrome: on the Household budget starter, use "+ Add expense", fill "Aldi / 92.40", and
  confirm the new bullet reads `Aldi #august #groceries {prop cost: 92.40}` AND the month total, the
  category total, and the cap check all move — the payoff the nurse and shop owner never reached.
- **Drive all three tiers** (the point of this whole review): **Guided** shows the "+ Add" control at rest,
  its tooltip, and the once-ever nudge; **Standard** shows the control (clickable) but no tooltip and no
  nudge; **Lean** shows NO at-rest chrome — the control is hidden until keyboard focus yet still fires, and
  `/` gives the one-line tip. Confirm the same "Aldi / 92.40" row can be produced in each tier (via type,
  `/`, or focus-revealed control) — capability constant, guidance variable.
- Cross-tier regression: toggling the dial (`⌘⇧.`) must not leave the control stranded or double-rendered;
  Lean at rest must read exactly as it did before this feature (no new pixels).
- UX Conformance Statement (P2 door added, P5 no new syntax, P3 caret invariant + every-widget-clickable),
  per the UI-change process.
