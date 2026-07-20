# Design language — the locked visual standard

**Status: locked direction.** This document records the visual-design decisions shipped in
the two design passes (embedded type + the five-reviewer panel pass) so they survive future
development. Treat every "Decision" below the way `ux-discipline.md` treats its principles:
**a change that contradicts one is a regression, not a restyle**, unless the decision itself
is explicitly revisited and this file is updated in the same PR. Where this file and
`ux-discipline.md` conflict, the UX standard wins (it governs behavior; this governs paint).

The brief these decisions serve: *a contemporary magazine on the readable edge* — editorial
type contrast, warm paper/ink surfaces, characterful-but-quiet components — inside a working
editor (no reading mode; bullets, indent rail, click-to-edit all survive).

---

## 1. Typefaces

**Decision: three voices, fixed roles.**
- **Fraunces** (embedded variable serif, `--display-font`) — display only: `h1–h4`,
  `.zoom-title`, and blockquotes (`.md-bq`, italic). Never body text.
- **Geist** (embedded variable grotesque, `--font`) — everything else.
- **`--mono`** (native stack: `ui-monospace,'SF Mono',…`) — code, formulas, pill internals,
  kbd, the static-table header. **Never write a bare `monospace` or an ad-hoc mono stack**
  — the single token kills the Courier/SF Mono split and the browser's
  default-monospace-size quirk.

**Constraint (owner-set, absolute): any typeface is native or embedded.** Embedded =
latin-subsetted WOFF2, base64 in `@font-face`, single file, no network. Prefer embedded.

**Invariant — payload labeling:** the `font-style` descriptor on each `@font-face` MUST
match the binary it wraps. The original Fraunces roman/italic payloads were swapped and
every heading silently rendered italic; this class of bug is invisible in code review.
**When adding or replacing an embedded font, verify by screenshot that roman renders
upright** (decoding the fvar/fsSelection bits is the thorough check).

**Decision — no Geist italic is embedded; inline `em` stays a synthesized oblique.**
Acceptable for incidental emphasis. The *quotation* voice gets the real italic by routing
blockquotes to Fraunces italic instead. If emphasis-heavy prose ever becomes the norm,
embed a true text italic rather than widening Fraunces' role.

**Decision — the brand is a masthead.** The wordmark is Fraunces (17px / 640 /
`'opsz' 28`) — a sanctioned display use under the role rule above. The isotype is the
accent disc with a **point and a line** knocked out (the product's name and anatomy drawn
literally); `updateFavicon` repaints the *same path*, and **the in-app isotype and the tab
favicon must never diverge** — change both in the same commit or neither. No stock icon-font
glyph may serve as the brand mark. **Scope:** this binds the *in-app* isotype ↔ tab favicon
(both accent-tinted, tracking the theme accent, which the user can change at runtime). The
**installed-app tile icon** (`icon.svg`/`icon-192`/`icon-512`) is deliberately OUTSIDE this rule.
It is a **static file baked ahead of time** — it physically CANNOT track the runtime accent — so
"matching it to the accent favicon" is category-moot, not a real consistency win. The tile is
therefore the standalone **black ink-on-paper** editorial mark (a ring + point + line in `#1f1d1a`
on the warm-paper field): a fixed, accent-neutral identity that reads on any home screen. Do NOT
re-sync it to the accent disc `#4338ca` to "match" the favicon — that regression shipped as UXP-122
and was reverted; the tile stays black regardless of the accent.

**Decision — icon policy: one language per altitude.** Control affordances use the
embedded Font Awesome subset through `setIcon`/`paintIcon`; typographic marks (¶, the
`?` help glyph, ordinals, `H1`/`B` text-as-icon tiles) stay type. `paintIcon` checks the
generated `FA_GLYPHS` set and falls back to the unicode glyph when a class isn't in the
subset — **a referenced icon class with no embedded glyph must degrade, never paint a
blank box** (P4). Adding an icon = the subset-rebuild workflow in
`adding-an-artifact.md`, which regenerates `FA_GLYPHS` alongside the font.

**Corollary — one icon per concept, and no look-alikes in one list.** A concept wears the
*same* glyph everywhere it is referenced (the `@`/`/` door, the rendered pill, the
`collectPillActions` keyboard row, any dialog header): dice is always `fa-dice-d20`, a deck
always `fa-clone`, journal always `fa-book`, and so on — the door, the pill, and the
keyboard action must not disagree (e.g. a deck's pill-action once showed `fa-shuffle` while
its pill showed `fa-clone`). Conversely, one glyph must not carry two unrelated meanings
(`fa-left-right` was width **and** estimate **and** refile; refile moved to
`fa-arrow-right-arrow-left`, leaving `fa-left-right` for the horizontal-span concept only;
likewise 2026-07-09, #412/#413: **template is `fa-stamp`** — stamp-a-copy — leaving
`fa-clone` deck-only; **progress is `fa-bars-progress`**, leaving `fa-circle-half-stroke`
theme-only; and the **Check verb is `fa-clipboard-check`** — a pass/fail assertion —
leaving the square-check family to the To-do/DONE task pair),
and visually near-identical glyphs (the `fa-circle-*` family, `fa-clone`/`fa-copy`, the
check family) must not cluster in the *same* menu where a user picks between them. When
these conflict, favor the concept's identity glyph and give the newcomer its own — a
subset rebuild if the right glyph isn't in `FA_GLYPHS` yet.

## 2. Type system

**Decision: opsz tracks rendered size — never inverted.** Fraunces' optical axis runs
soft-text-grade (low) to high-contrast display (high). Larger element ⇒ higher `opsz`:

| Element | size | weight | opsz | tracking |
|---|---|---|---|---|
| `.zoom-title` | 30px | 640 | 60 | −.025em |
| `h1.md-h` | 2em | 640 | 84 | −.025em |
| `h2.md-h` | 1.5em | 660 | 40 | −.012em |
| `h3.md-h` | 1.2em | 680 | 22 | 0 |
| `h4.md-h` | 1.05em | 700 | 14 | 0 |
| `.md-bq` | 1.04em | — | 12 | 0 (italic) |

- **Display sizes go *lighter*, not heavier** (640 at 2em, not 700) — contrast does the
  work, mass doesn't. Negative tracking tapers to zero by h3; small caps labels get
  *positive* tracking (`.06–.07em`).
- **h5/h6 are caps eyebrows** (Geist, `.8em`, 600, uppercase, `.07em`), not ever-smaller
  serif headings — the scale stops shrinking below body size, and the eyebrow voice matches
  the app's existing section labels.
- **The zoomed title outranks an inline h1.** A bare `.zoom-title` is 30px (opsz 60) but a
  descendant markdown `# heading` is `2em` ≈ 34px (opsz 84), so a `# child` would out-size and
  out-grade the masthead of the page it lives on (and `fitZoomTitle` can shrink a long title
  further). The rule is enforced by **stepping descendant headings down inside a zoomed page**
  (`body.zoomed .node-content h1.md-h`→1.5em/opsz 60, h2→1.25em/opsz 34; UXP-108), not by raising
  the title. The title must never render *smaller* or *lower-grade* than its children's headings.
- **Display ceiling: ~2em for h1.** This is a click-anywhere-to-edit editor; dramatic
  display/edit reflow makes the caret feel broken. Do not push past it.

**Decision: body 17px / `--lh:1.55` / 720px measure.** ≈72–79 CPL. Lower the measure *or*
raise the body — never both (the panel pinned this trade-off). Code blocks override to
`line-height:1.5`.

**Decision: tabular figures wherever digits align** — table cells, ordinals, dice/math
totals, collapse counts (`font-variant-numeric:tabular-nums`). Geist's default figures are
proportional; alignment must be opted into.

## 3. Color system

**Decision: warm paper, warm ink — dark mode is a palette, not an inversion.**
- Light: `--bg:#f7f4ed` (paper), `--hbg:#fcfaf5` (a brighter sheet of the same stock —
  chrome recedes, page glows), warm borders/fills.
- Dark: `--bg:#1b1815` (ink), `--hbg:#252220`. **Elevation in dark mode = lighter than the
  canvas.** Floating surfaces rise; the original `#111`-below-`#1c1c1e` inversion is the
  regression to watch for. Shadows are warm-tinted in light (`rgba(45,35,25,…)`), stronger
  and black in dark (`--sh-1`/`--sh-2` swap per theme).
- Neutral-gray palettes (`#fafaf8/#1c1c1e/#333`-era) are retired. New surface colors stay
  in the warm family.

**Decision: one scrim.** Modal backdrops use the one `--scrim` token (warm-dark in light, a
deeper black in dark, dual-homed like every theme token); no other full-screen darkening
value may be introduced.

**Decision: semantic tokens, one color per meaning.** `--ok` / `--warn` / `--bad` /
`--info`, theme-paired (deep inks in light, lifted tints in dark). **One red**: every
danger/error surface (priority A, danger buttons, fate-minus, selection-bar danger, cycle
warnings route to `--warn`) uses `--bad` — never a fresh hex. Status badges and priority
chips are `color-mix(in srgb, var(--TOKEN) 16%, transparent)` background + the token as
text ink; this recipe passed AA at badge size in both themes — keep the percentages.

**Decision: contrast floors are merge criteria, not aspirations.**
- `--muted` ≥ 4.5:1 on `--bg` in both themes (it styles *content* — placeholders,
  formulas, eyebrows). Light `#6b665c`, dark `#a39a8d`. Never push it back toward `#999`
  for tone; de-emphasize with *role* (size, caps, spacing), not failing ink. **Placeholders
  are content and clear the floor** — de-emphasize an empty field by role (weight, and the
  fact that filled text is full `--fg`), never by an opacity fade on `--muted` (UXP-74, UXP-107).
- **Incidental connective glyphs inside a pill are decoration, not content, and are exempt
  from the floor.** A pill's *information* (the dice total, the markov state, the resolved
  value) is full-contrast; the one-character connectors between them — `+`, `=`, `→`, a
  terminal `…` — may sit below 4.5:1 (a light opacity on `--muted` is fine) because they carry
  no information a reader must resolve, only rhythm. This is the same "content glyphs" spirit as
  the sanctioned `—` marks: the floor governs text you read, not the punctuation between it
  (UXP-118). Do not extend this to anything a user must actually read.
- Text on the accent uses **`--acc-fg`, never a hardcoded `#fff`** — `applyAccentCSS`
  computes the higher-contrast ink (white vs `#16130f`) per accent, because dark-mode
  accents are pastels (white-on-`#a5b4fc` was 1.99:1). Any new `background:var(--acc)`
  rule pairs with `color:var(--acc-fg)`.
- `--bdr` is decorative (hairlines may whisper); **`--bdr-ui` (≈3:1) exists for functional
  boundaries** — use it when a border is the only thing delineating a control.
- New color pairs ship with their computed WCAG ratio in the PR.

**Decision: the default accent is indigo (`#4338ca` / `#a5b4fc`).** The editorial Oxblood
preset exists in the picker, but **a red-family accent must not become the default**: it
collides semantically with the danger/priority-A/fate-minus red lane. Any future default
must keep all four semantic lanes (`ok/warn/bad/info`) visually distinct from the accent.

**Invariant — the palette lives in two homes; change both or neither.** Every
theme-varying token exists in (a) the CSS `:root` + dark media query and (b) the
**`applyTheme` forced-theme strings**; accent-derived tokens (`--acc`, `--acc-fg`,
`--ring`, `--bullet-h`, `--qbdr`) live in **`applyAccentCSS`**. A CSS-only edit silently
regresses the moment the user touches the in-app theme toggle or accent picker. The PWA title bar is a third home: the two
media-scoped `theme-color` metas carry the `--hbg` pair (System mode picks by media and
self-updates on an OS flip; `applyTheme` collapses both to the forced theme's value, read
from the matching meta), and the manifest's static `theme_color` holds the neutral midpoint
of the pair for pre-boot surfaces. Likewise
`color-scheme` is set in CSS *and* mirrored to `documentElement.style.colorScheme` by
`applyTheme` — native controls (checkboxes, scrollbars) must always follow the active
theme, and `accent-color:var(--acc)` keeps them on brand.

## 4. Components

**Decision: token systems over eyeballed values.**
- **Radii:** `--r-xs:3px` (inline marks) · `--r-sm:6px` (controls/chips) · `--r-md:8px`
  (menu rows, inputs, code blocks) · `--r-lg:12px` (floating surfaces) · `999px` (pills,
  reserved for the artifact-pill silhouette). New radii come from this set.
- **Shadows:** `--sh-1` (popovers) / `--sh-2` (dialogs, file menu) — tight, bordered
  elevation. The 30–50px-blur floating card is retired; don't reintroduce it.
- **Spacing/UI sizes:** prefer the existing steps; no informational text below 11px
  effective (caps+tracking earns 10px for labels only).
- **Weights:** UI text weights come from the set 400/500/600/700; nothing renders text
  heavier than 700 (icon-font weight classes exempt). Display weights follow the §2 scale.

**Decision: pill grammar.** The stadium pill is the *artifact* signature (dice, markov,
table, grammar, math, var, seq); status badges/chips stay small rectangles (`--r-xs`+1) —
two shapes, two meanings, shared vertical metrics (`.72em/600/.06em`, `padding:1px 6px`).
- Each pill family carries a fixed hue via `--pill`, mixed at **7% into the background and
  22% into the border** — identity at whisper level, never candy. Family hues: dice
  `#9a3b2e`, markov/seq `#3d6280`, grammar `#4a7a4d` (roll tables render as grammar pills
  since the rolltable collapse; the old table hue `#5b3a6e` is retired), math `#8a5300`,
  var `#2a7f74`, est `#5a4a8a`, query `#4a6b8a` (the query pill QP-1 and the query-base strip;
  a muted info-blue, distinct from the markov/seq slate `#3d6280`). A new artifact family picks a
  distinct hue here in the same PR.
- **One box per pill** — no bordered/filled boxes nested inside (the dice breakdown is
  flat muted text). Typography differentiates internals.
- **The `--ring` glow means focus, not hover.** Pill hover = accent border + 6% tint;
  `:focus-visible` = solid accent outline (the glow may remain as decoration around it).
  Don't re-blur the focus indicator into a 20%-alpha ghost.
- **Sanctioned exception — the prose-mode pill (`.nt-para`, #925f).** Inside a **paragraph**
  point the stadium is *dropped*: inline generators (dice/grammar/markov/est/var/seq) shed the
  capsule, the leading icon, and the dice recipe, and read as tinted inline text so a generated
  sentence reads as prose, not a row of widgets. This is the same restraint the math **"Show value
  only"** (`.math-bare`) mode already established, generalized to every inline generator *in a
  paragraph only*. The family hue survives at whisper level (identity is kept), the pill stays
  clickable with a faint hover tint, and the stadium is untouched everywhere else (bullets, headings,
  bases). Block pills (query) are exempt. This is the ONLY context in which the artifact signature is
  suppressed, and it is intentional: the paragraph type is prose-first, so its export flattens pills
  to their result too (the two stay in step). Do not extend the chrome-drop beyond paragraphs.
  **#944 (agent-review) extends this one step:** in a paragraph a variable *reference* pill
  (`.var-ref`) also drops its **name**, reading as just its value — a reused frozen name renders
  "Sor", not "captainSor" (the name still shows on the declaration pill; the aria-label keeps it).
  Reference-only, paragraph-only; the declaration pill's name=value form is untouched.

**Decision: tables.** The **static** rendered table (`.md-table-static`) is editorial —
horizontal rules only, 2px head rule, mono caps header, no vertical lines, no header fill.
The **interactive base keeps its full editing grid** — cell borders aid editing; the skins
are scoped and must stay separate. The base *echoes* the editorial signature without
merging the skins: 2px header bottom rule, header weight 600 (never 700), the table hugs
its content (`width:auto;min-width:min(380px,100%)`) instead of stretching across the
measure, and rows get a 3%-fg hover. Don't uppercase the base header — the name pill is
editable content and `text-transform` would lie about it. **The header's menu zone carries
a visible door** (#416, owner-adjudicated 2026-07-09): a hover-revealed `▾` (`.mt-col-open`,
always visible on touch, `pointer-events:none` so the header's existing click zone stays
the one handler) marks click-for-menu vs click-the-name-to-rename; the whitespace door
UXP-21 established keeps working alongside it.

**Decision: chrome control grammar.**
- **Active toggles wear the tint recipe** (16% accent mix + accent ink + 35% border),
  same as badges — **solid accent fill is reserved** for the focus outline, primary
  commit actions (a dialog's primary button, the capture strip's Capture), and the
  brand mark. A filter toggle must never be the loudest object
  on screen.
- **Keycap chips are one rule** (`kbd`, `.cmd-key`, `#search-key`): `--mono` 11px, `--hbg`
  fill, 1px `--bdr` border with a 2px bottom ledge, radius 4px, `--fg` ink. Keys never
  change color on hover (a key's meaning doesn't change when pointed at). One notation
  per platform via `fmtKey()` — `⌘S` on Mac, `Ctrl+S` elsewhere — everywhere a shortcut
  is printed.
- **One menu hover language:** every pointable menu/picker row — `.cmd-item`, the
  `[[`/`{`/`#`/emoji pickers (`.lp-item`/`.bm-item`), the column panel + card menu
  (`.mt-col-item`), and keyboard focus in `#bpop` — hovers/highlights with the SAME 10%
  accent tint, ink unchanged (converged 2026-07-09, #396; the pickers' 13%+accent-ink
  variant and the column panel's gray are retired). Keyboard-focus background = hover
  background + the focus ring, so pointer and keyboard read one language. Menu icons are
  bare glyphs (transparent box, `--muted` ink, `--fg` on row hover) — the filled icon
  tile is retired except the file-menu header's identity chip; a row's SOLID-accent icon
  tile (`.cmd-icon.accent`) keeps `--acc-fg` ink on hover/highlight (#395, the §3 rule). The slash-menu footer (description + mono syntax example + cross-teaching tip)
  is the canonical teaching pattern; new menus adopt it rather than inventing another.
  `.cmd-item` rows also share **one padding** in every menu; a menu adopts the shared row
  metrics rather than restyling them.
- **Dismiss/close buttons share one recipe and one glyph** (`fa-xmark` through `setIcon`,
  `✕` fallback per the icon policy) everywhere: muted ink, `--fg` on hover, an `--r-sm` box.
  A panel may not mint its own close styling. A **destructive** remove
  (deleting config or content, e.g. an inbox chip's ✕) may hover with the `--bad` tint;
  a non-destructive dismiss hovers neutral.
- **Eyebrow labels are one recipe:** 10px / 600 / `.07em` caps in `--muted`, **never
  opacity-faded** (§3's role-not-failing-ink rule applies to labels too).
- **Toolbar controls share one 28px height.**
- **Agenda controls: one chip look, three labelled kinds.** The control cluster mixes
  view switchers (open a pane), filters (change the List), and a sort cycler in one chip
  grammar; each group leads with a caps-eyebrow kind label (`.ag-grp-lbl`: Views / Filters
  / Sort, Sort on its own row) so a newcomer can predict a chip's blast radius before
  clicking (#419).
- **Agenda dated-point chips: one tint recipe, two recorded densities.** Every surface
  that renders a dated point (List `.ag-chip`, Week `.agw-item`, Month `.agc-item`) uses
  the ONE urgency recipe — 10% token bg, 35% border (overdue/today) / 30% (soon) — and
  one done treatment (opacity .5 + strike). Two densities are deliberate: the roomy List
  row (12px title, `--r-sm`) and the packed grid cell (11-12px, `--r-xs`); a new pane
  picks one of these two, never a third (#398).
- **Docked strip controls share the agenda's chip grammar.** Every toolbar-docked strip
  (agenda, capture) builds its controls as `.ag-toggle`-style chips: 11px / 600, `--muted`
  ink, `--bdr-ui` hairline, `--r-sm`, 2px 8px padding, the §4 tint recipe when active. A
  strip's single primary commit action wears the solid accent at the same chip scale; every control in a strip row shares one 22px height, the text field included
  (it grows only with content). A new docked strip adopts this grammar
  rather than minting its own (decided 2026-07-01, capture aligned to agenda).
  **The stack has a viewport ceiling (#389):** the docked stack may never exceed the
  viewport — `#toolbar` clamps to `100dvh` and the agenda strip (the one tall pane) is the
  designated shrink-and-scroll region; every other strip keeps its natural height. The
  strips are honest one at a time, but they compose: agenda-Month + capture + journal
  measured 123% of a landscape phone before the clamp, burying both the outline AND the
  strips' own lower controls. A new docked surface is designed against this ceiling
  (if it can be tall, it must be able to scroll internally).
  **Capture layout (re-evaluated and defended 2026-07-01):** the strip docks and never
  navigates (a modal would hide the outline a brain-dump references); the text field
  leads the row on every width, content before chrome, with destination and commit
  following; the strip carries no dismiss button, it closes the way it opened (the
  toolbar toggle, the chord, or Esc), same as the agenda; the transient manager row
  stays in the strip because it is the slot-chord teaching surface; capture feedback
  (running count, empty-draft hint) rides the standard toast per the one-feedback-pattern
  rule, so the strip carries no private feedback line and its height never moves mid-dump.

**Decision: the indent thread.** Nesting depth gets a physical trace: a hairline at every
indent step, painted per row via a repeating gradient clipped to `--depth-w` (set in
`renderRow` next to `paddingLeft`, because the virtual list flattens the DOM — there is no
`.children` ancestor to hang it on). Anything else that wants per-depth paint must use the
same `--depth-w` mechanism.

**Micro-layer (all required, all cheap to lose in a refactor):** `::selection` accent
tint · thin themed scrollbars · warm highlighter (`.md-hl`, not screen-yellow) · hashtags
as small accent-tinted **label chips** (the §4 badge recipe: `color-mix(--acc 12%)` tint +
accent ink + `--r-xs` radius, at inline text size) — a bounded chip, NOT the stadium
artifact pill, and NOT plain text.

## 5. Deliberately rejected (binding anti-decisions)

Re-proposing one of these is a P5-style decision, not a tweak — it needs this file updated:

- **Glassmorphism / `backdrop-filter` chrome** — dated; legibility + paint cost over a
  contenteditable surface.
- **Grain/noise overlays** — banding in dark mode, fights text antialiasing. Paper comes
  from color temperature and hairlines, not texture layers.
- **Neobrutalism** (3px borders, hard offset shadows) — poster style, fatiguing in a tool.
  The tactile-border idea survives only at 1px and warm tones.
- **Gradient blobs / mesh / iridescent accents** — at war with "magazine".
- **Display type past ~2em, variable-font hover animations** — edit-mode reflow breaks the
  caret feel (see §2 ceiling).
- **Oxblood (any red) as the default accent** — semantic collision (§3).
- **Whole-blockquote muted ink** — quotes are content; de-emphasis ≠ sub-AA gray (§3).

## 6. Verification discipline

Any change touching palette, type, or component skin re-verifies before merge:
1. **Headless screenshots in both modes** (media-query light *and* dark) at desktop +
   narrow widths — and **a forced-theme shot** (e.g. OS-light + in-app dark) to prove the
   JS strings kept pace (§3 dual-home invariant).
2. **Contrast math** for any new color pair (text ≥4.5:1, large text / non-text UI ≥3:1),
   stated in the PR.
3. **An edit-mode shot** (unfolded `{…}` grammar text) — display-mode-only verification
   misses half the surface.
4. Screenshots and tooling are throwaway per the repo rule — verify, attach to the PR if
   needed, never commit.
