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

## Decision (current)
**Ship two poles first; defer the middle.**
- **Guided (default):** maximally beginner-friendly — all overlays on.
- **Lean:** the ultra-lean, keyboard/shortcut-first canvas — all overlays off, clickable widgets
  intact.
- **Standard (middle tier): deferred.** Introduce it only once real usage reveals which helpers
  are *noise* vs. useful *guardrails* — that's the data the middle tier should be built from,
  rather than guessed at now.
- Because of the lean-first principle, building Guided + Lean now costs nothing extra later: the
  middle tier is just a different subset of the same overlays.

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

| Helper | Guided (default) | Standard | Lean |
|---|---|---|---|
| Empty-state hints (`type / …`) | shown | off | off |
| `/` `@` menu items | label + description + example | label + example | label only |
| Modal chips (e.g. dice dialog) | full set, labeled | essential only | hidden |
| Inline bullet affordances (edit pencils, ¶ / markdown reveal, hover hints) | visible | on hover | hidden (still clickable) |
| Pill tooltips | on | on | minimal |
| Toolbar | full | full | collapsible / minimal |
| Examples doc on first run | offered | no | no |

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
6. **`{`-autocomplete for callable names (SHIPPED, UXP-9)** — typing `{` in edit mode opens a
   grouped picker (Variables / Rules / Tables / Chains) from the document's name index
   (`collectCallables`). Narrows by identifier prefix; variables show resolved values inline.
   Selecting completes `{name}` and normal promotion-on-exit turns it into a pill. Keyboard nav
   follows §7.2 (↑/↓/Enter/Tab/Esc), same pattern as `/` slash menu and `[[` link picker.
   **Variables overview panel** (Ctrl+Shift+V) lists all declared vars + resolved values; updates
   live; mirrors the footnote panel slide-up. Together these make the generative engine
   self-documenting: the entry point (`{`) reveals what's callable, and the panel shows all
   variable state at a glance.

## Open questions
- **Where the dial lives** — appearance menu? A persistent corner control? And how discoverable
  the "go Lean" path is without nagging.
- **Demos** — examples-doc vs. a dismissable "take a tour" card, or both.
- **Noise vs. guardrail** — the key data that should *define* the future Standard tier. Worth
  watching once Guided + Lean ship (which helpers do people keep dismissing? which do they miss
  in Lean?) rather than guessing the middle now.
- **Per-feature vs. global** — is one global dial enough, or do power-uneven users (pro outliner,
  novice at dice) need finer control? (Likely over-engineering for v1 — note and defer.)

## Caveat
The disclosure *model* and structure are designable on paper, but real visual/UX tuning — does
the toolbar feel cluttered, are chips well-placed — needs eyes on the running app. That part is
a look-and-react loop, not something to fully spec blind.
