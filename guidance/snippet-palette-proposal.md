# Snippet / pattern palette (#1267)

Status: **Shipped** (2026-08). The Builder's "Patterns" section landed: `PATTERN_RECIPES`, `recipeToNodes` and `insertRecipe`, with the v1 recipe set and its discoverability rails.

## The wall (2026-08 panel)

Guided authoring fixed *growing a list* without typing syntax. Two personas hit a different wall: the
`{…}` is fine to author slowly, but scary to USE at speed or under pressure.

- **Devon (GM):** "I'd fumble the contested-roll syntax live with five people staring at me. Give me a
  searchable, copy-paste snippet library of the common patterns (oracle, tracked HP, contested roll)
  right in the app, so I lift a working line instead of authoring syntax cold."
- **Marisol (designer):** "One wrong bracket and I'm debugging instead of designing."

Devon: nailing this is what tips him from "close" to "won" — "the syntax fear mostly evaporates."

## What already exists (and why this is a content gap, not a new-surface gap)

Pointliner already has two "insert a thing" surfaces:

1. **The Builder** (`Ctrl/Cmd+K`, `/builder`, the toolbar ▤): a searchable, sectioned palette of every
   point command, generator, and pill. But it inserts **a pill at the caret** in the current point (or
   opens a form). You still author the innards. It never drops a whole, already-valid example line.
2. **The roll-template palette** (`#roll-palette`): tapping a chip DOES drop a full ready-to-edit `{…}`
   line as a new point (`quickNewPoint`). But it is a fixed six-item list, has no search, and is
   touch-only (tied to the mobile quick bar). Devon and Marisol are laptop users; they never see it.

So the missing thing is not a third palette. It is **a searchable set of complete, already-working
recipe lines**, on the desktop, that you lift and then edit the values in. The cleanest home is the
Builder we already have.

## Proposal: a "Patterns" section in the Builder

Add a curated `PATTERN_RECIPES` set that appears as its own **Patterns** section in the Builder (front
door and search). Choosing a pattern does NOT splice a pill at the caret like the other Builder items.
Instead it drops **a complete working line, or a tiny worked block, as new point(s) below the current
one** (the roll-palette's proven `quickNewPoint` behavior), with the caret landed on the first value you
would edit. If the current point is empty, the recipe fills it in place rather than leaving an orphan
blank line above.

This marries the Builder's search + sections to the roll-palette's "drop a working line" insert. One
palette, one keybinding, no new syntax.

### The recipe set (v1)

Every recipe is a **finished, self-computing** example, so nothing a person lifts ever reads "no match
yet" or 0 on arrival (the starter-honesty rule). Recipes that need supporting structure to compute
(a rollup, a roll-on-a-tag) come in as a small worked **block** with two example rows already in place,
so they show a real number immediately and teach the shape; the rest are single **lines**.

| pattern | kind | what drops in | the power it lifts |
|---|---|---|---|
| **Dice roll** | line | `Damage {2d6}` | a live roll |
| **Contested roll** | line | `Attack {swing := 2d6+2 vs 2d6+1}` | opposed roll + margin (#1243) |
| **Yes/no oracle** | line | `Does it happen? {oracle: 50/50}` | oracle |
| **Either / or** | line | `Weather {clear \| rain \| fog}` | weighted pick |
| **Tracked value** | line | `HP {hp := 10}` | an editable/rerollable tracked number |
| **Estimate a range** | line | `Travel days {2 to 5}` | a range estimate |
| **Running total** | block | `Party gold {= sum(gold)}` over two rows `Ari  gold: 10` / `Bex  gold: 6` | a child rollup (shows 16) |
| **Roll on your own list** | block | a `#npc` list of two, then `Random NPC {roll: #npc}` | roll-on-your-doc |
| **Scoped total** | block | `This month {= sum("#thismonth", cost)}` over two tagged rows | a scoped query rollup |
| **Pass/fail check** | block | `Under budget {= sum(cost)}` + `check: under 100` over two cost rows | a check with a red/green verdict |

(Final labels/values tuned at build time; the table is the intent. The set is exactly the family Devon
named plus the two rollup/check powers the panel most praised.)

### Discoverability

- The Patterns section shows in the Builder **front door** (no search needed), near the top, so a person
  who opens `Ctrl+K` cold sees "oh, ready-made patterns" without knowing to look.
- Each recipe carries `keys` synonyms (e.g. tracked HP also matches "health", "counter", "hp") so search
  finds them by the word a person actually types.
- A one-line guide entry, and the touch roll-palette optionally gains a "more patterns" affordance in a
  later pass (out of v1 scope; v1 is the desktop Builder, where the two personas live).

## Non-goals / boundaries

- **No new syntax (P5).** Every recipe is built from shipped forms only; the palette is a teaching and
  speed surface, not a language addition.
- **No new keybinding (P1).** Rides the existing Builder (`Ctrl/Cmd+K`); no grammar change.
- **Not a template engine.** Recipes are static, hand-authored example lines, not parameterized macros.
  You edit the values by hand after they land — that IS the point (lift, then tweak).
- **Honesty (P4/starter rule).** No recipe ships reading "no match yet"/0; the ones that need data come
  in as small worked blocks that already compute.

## Acceptance / verification

- Each recipe, dropped into a blank document, **computes or rolls a real result immediately** (no
  "no match yet", no 0, no `#ERR`) — pinned per recipe.
- The Patterns section appears in the Builder front door and is reachable by search synonyms.
- The insert lands as new point(s) below (or fills an empty current point), caret on the first editable
  value; one Undo removes the whole drop.
- Drift guards stay green (no new syntax, em-dash-free, `{roll:#tag}` recipes carry their own tag).

## Build shape

Likely one PR (additive, self-contained): the `PATTERN_RECIPES` data + a `pattern` branch in
`builderCmdPool`/`applyBuilder` that routes to a new `insertRecipe(recipe)` (line via `quickNewPoint`,
block via the trees-append path from the import work), the guide entry, and the pins. UX Conformance:
P2 (discoverable in the Builder + by synonym), P5 (no new syntax), P1 (no new keybinding).
