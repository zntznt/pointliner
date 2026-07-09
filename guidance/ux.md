# Pointliner — UX & Discoverability

How users discover and navigate the depth hidden inside an apparently-simple outliner. Pairs
with the feature work: every generative feature added (dice, grammar, math, dates…)
raises the "hidden-complexity tax," and this is the counterweight. Status: thinking doc,
evolving.

## Principles
- **Lean = less guidance, never fewer features.** The verbosity dial changes how much the UI
  *explains and affords*, never what you can do. Every clickable widget stays clickable at all
  levels. Advanced ≠ harder — it's the leanest expression of the same app.
- **One UI, conditional helpers.** Not three UIs — a single interface where helper elements
  (hints, menu descriptions, chips, inline affordances) render based on one `verbosity` setting.
  Cheap to maintain; no divergent variants.
- **Build lean-first; guidance is a removable overlay.** The base UI *is* the ultra-lean state
  (bare bullets, keyboard/slash-driven, clickable widgets, minimal chrome). Every helper — hints,
  menu descriptions, chip labels, affordance reveals, the examples doc — is an *additive layer*
  rendered only when verbosity is up. This guarantees Guided and Lean never diverge (Lean = all
  overlays off) and makes any future middle tier just "suppress a subset." **Discipline for new
  features:** build the bare interaction first, then add its helper as a separate, verbosity-gated
  layer — so the whole app stays lean-compatible as it grows.

## Decision (current — updated 2026-07-09, closing #394)
**The 3-position dial SHIPPED (LF-2/LF-2c/LF-2d): Guided → Standard → Lean.** This supersedes the
earlier "ship two poles first; defer the middle until usage data" decision recorded here: the owner
directed the middle tier built now, with Standard's contents chosen by a design question ("I know
the commands; stop explaining; keep the conveniences"), not usage data. The reversal is deliberate
and this doc no longer argues the deferred position — the ledger (LF-2d) carries the reasoning.
- **Guided (default):** all teaching aids on — point hints, pill tooltips, the search cheatsheet.
- **Standard:** those three teaching aids off; menus (full descriptions) and edit pencils stay.
- **Lean:** the `/` and `@` menus collapse to a one-line caret tip of the current match
  (`renderLeanSlashTip` — blind typing plus confirmation, not label-only rows); edit pencils hide
  until keyboard focus (still clickable, P3); everything Standard strips stays stripped.
- The chord is `Ctrl/⌘+Shift+.` forward / `Ctrl/⌘+Shift+,` reverse (the reverse escapes the
  one-way ratchet); each step flashes what changed (P4).

## Documentation — the floor under the dial
Turning guidance *off* is only safe if nothing is ever truly hidden. So a **complete reference is
reachable from every mode, including Lean** — via a keyboard shortcut (so ultra-lean keyboard
users get it) and a small persistent affordance. The existing `?` syntax panel is the seed: grow
it into the comprehensive cheat-sheet (all syntax, shortcuts, every feature), backed by fuller
user documentation for those who want the whole picture. The dial quiets guidance; the docs are
the floor it can never fall below.

## The core approach: make the entry points self-teaching
The real discoverability problem is that power hides behind `/`, `@`, and `{…}` — syntax a
newcomer doesn't know exists. The durable fix (mode-independent):
1. **The entry point invites itself.** An empty bullet shows a faint "type `/` for blocks,
   `@` to insert." One keystroke in.
2. **The menus *are* the tutorial.** `/` and `@` menus are richly described with a live example
   per item, so opening one and scrolling teaches the whole vocabulary. Highest-leverage single
   investment — the menu replaces a separate tutorial.
3. **Widgets self-document.** An inserted pill says "click to re-roll"; a table whispers "drag a
   column to reorder." The interactive output teaches by being used.

The verbosity dial then turns the volume on all of this down to silence for advanced users.

## The verbosity dial
One setting controls helper rendering. Tiers are defined by **what they strip**, not by a skill
label — so "intermediate" has concrete meaning: *"I know the commands; stop explaining; keep the
conveniences."*

This table records the SHIPPED strips (updated 2026-07-09 to match the code, #394):

| Helper | Guided (default) | Standard | Lean |
|---|---|---|---|
| Empty-state / entry hints (`type / …`, the paragraph hint) | shown | off | off |
| Search cheatsheet (the focus-shown legend rows) | shown | off | off |
| Pill tooltips (`title=`; each keeps its `aria-label` twin) | on | **stripped** (LF-2d supersedes the LF-2c skip — see note below) | stripped |
| `/` `@` menu items | label + description + example | same (menus are conveniences, not teaching text) | **no menu** — a one-line caret tip of the current match (`renderLeanSlashTip`) |
| Inline pill edit pencils | visible on hover | visible on hover | hidden until keyboard focus (still clickable) |
| Modal chips (e.g. dice dialog) | full set | full set | full set — **not tier-gated** (the old "essential only / hidden" cells were never built) |
| Toolbar | invariant | invariant | invariant — **explicit owner spec** (LF-2c/LF-2d); the old "collapsible / minimal" cell is retired |
| Examples doc on first run | offered | offered | offered — first-run predates the dial and is not gated on it; the File-menu re-entry is tier-independent |

**Pill-tooltip adjudication (#394 point 5):** LF-2c recorded stripping tooltips as a conscious
skip ("hover-hold-only, ~zero at-rest clutter"); LF-2d then shipped the strip for Standard+Lean.
**LF-2d governs** — the shipped `isStandardOrLean()` sweep stands, and the LF-2c note is marked
superseded in the ledger. Rationale: Standard's charter is "stop explaining"; a tooltip that says
"Click to re-roll" IS explanation, and the `aria-label` twin keeps the accessible name.

Notes:
- **Automatic leaning (optional enhancement):** helpers can also be *dismissable in place*
  ("got it / don't show again"), so the app gets leaner as the user learns even without moving
  the global dial. The dial and per-helper dismissal can coexist.
- Advanced/Lean is effectively a clean keyboard-first canvas: bare bullets, no chrome noise,
  everything driven by shortcuts + the slash/@ menus, clickable widgets intact.

## On demos — recommendation
**Do not inject demo content into the user's blank document.** People have to delete it, it
reads as junk, and it blurs "my notes" with "tutorial."
- **Instead:** on first run, open a **clearly-labeled "Examples" document** (obviously a sample,
  with a prominent "Start a blank outline" button). Show-don't-tell without the
  delete-the-clutter problem, because it's plainly not their notes. Offered in Guided only.
- Returning users open their own content; the Examples doc is always reachable from a menu for
  anyone who wants to browse what's possible.

## Highest-leverage wins (independent of the mode decision)
1. **Rich, exampled `/` and `@` menus** — the menu as tutorial. (Foundation exists: command
   items already carry `desc` + `ex` fields.)
2. **Empty-state + just-in-time hints** — blank-doc invitation; first-table "drag to reorder."
3. **A searchable command surface** — the planned quick-switcher can double as "type what you
   want → insert a dice roll / table / link." One place to discover capabilities by intent.
4. **Self-documenting widgets** — ensure every pill/affordance has a clear label + tooltip.
5. **The `?` syntax panel** — already exists; keep it as the full cheat-sheet for power users.

## Open questions
- **Where the dial lives** — appearance menu? A persistent corner control? And how discoverable
  the "go Lean" path is without nagging.
- **Demos** — examples-doc vs. a dismissable "take a tour" card, or both.
- **Noise vs. guardrail** — ~~the key data that should define the future Standard tier~~
  RESOLVED by decision, not data: Standard shipped (LF-2d) with the "stop explaining, keep the
  conveniences" charter. Usage watching remains useful for tuning WHICH helpers count as
  explanation, but the tier no longer waits on it.
- **Per-feature vs. global** — is one global dial enough, or do power-uneven users (pro outliner,
  novice at dice) need finer control? (Likely over-engineering for v1 — note and defer.)

## Caveat
The disclosure *model* and structure are designable on paper, but real visual/UX tuning — does
the toolbar feel cluttered, are chips well-placed — needs eyes on the running app. That part is
a look-and-react loop, not something to fully spec blind.
