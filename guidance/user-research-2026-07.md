# User research: six personas who drove the app (2026-07)

**Status: RECORD (not a commitment).** A read-only persona fleet, one agent per persona, each
booted the running app headless, built a real artifact in it (a campaign scene, a budget model, a
story bible, a Fermi model, a scratch-with-numbers doc), clicked everything, and reported under a
candor mandate ("no politeness inflation; a real verdict, grounded in what you clicked"). No agent
wrote to the repo. This note is the durable record of what they found so it can steer the roadmap;
the concrete bugs it surfaced were filed and fixed separately (see "What was acted on"). The wish
list here is **candidate material for the roadmap's interleaving clause, not a backlog of promises** —
treat it the way `enhancement-research.md` is treated.

The personas were chosen to span the product's identity: the origin user, the two compute-heavy
audiences the `{…}` layer is aimed at, a prose writer, the hardest PKM skeptic, and a
non-technical bounce-risk.

## Verdicts

| Persona | Who | Verdict | Score |
|---|---|---|---|
| **Maya** | solo-RPG player (origin user); today Discord bot + Google Doc | Yes, aiming to replace both within a couple sessions | **8** |
| **Jordan** | analyst / estimator; today Guesstimate / Squiggle / Sheets | Yes, today, for notes+numbers and light Fermi models (verified the math three ways) | **7.5** |
| **Devin** | freelance project planner; today Notion + Sheets | Alongside, for project *scoping* (the front half of an engagement) | **7** |
| **Priya** | fantasy novelist; today Scrivener + Obsidian | The story *bible*, maybe; not drafting yet | **7** |
| **Sam** | Obsidian skeptic, ~4,000-note vault | Keep Obsidian; adopt as a scratch/thinking-document tool | **6.5** (≈3 as an Obsidian replacement, which it never claims to be) |
| **Alex** | casual note-taker; today Apple Notes / Keep | Keep, cautiously — nearly bounced at the front door | **6.5** |

**The unanimous pattern: yes, but for a *document*, not as an everyday home.** Nobody moves their
whole life here; everyone found a real job for it. This matches the product's own fenced identity
exactly (a tool for thought, per-document; parity with PKM/database apps is out of scope, not
deferred). Sam, the skeptic, put it best: the live-compute layer is "a category difference, not a
nicer-plugin difference." Even Alex, the bounce-risk, kept it once he found the magic.

## The moat (what they loved that other tools don't do)

Three capabilities came up again and again, across audiences, and they *are* the differentiators:

1. **Uncertainty inside the writing.** `{5 to 10}` → a sampled range with a sparkline that
   *composes* (`(5 to 10)*(2 to 4)` propagates the spread instead of adding midpoints). Devin: "the
   single moment I couldn't get anywhere else." Jordan verified the sampler is statistically sound
   (lognormal skew preserved, product widens spread correctly) and called the estimate *rollups*
   over children's distributions genuinely first-in-class. Maya reached for `{5 to 12}` to pace
   sessions; Sam flagged it as something no Obsidian plugin does natively.
2. **Rolling on your own notes.** `{roll: #npc}` / `{roll: #char}` turning *your own tagged points*
   into a dice bag. Maya's and Priya's peak-delight moment, verbatim: "random tables that are just
   the stuff I already keep" / "no other tool turns my own notes into a dice bag."
3. **Compute living in prose.** `{= sum(cost)}` plus a `check` that flags a blown budget, inline in
   editable text, recomputing as children change, vs Dataview's read-only boxed tables (Sam);
   Alex's `{= 40 * 0.2}` = 8 ("I do this on my phone calculator constantly and then lose it").

Universally praised beneath those: the **calm paper/serif typography** (every persona; Priya and
Alex singled it out) and the **one-file, offline, zero-lock-in** truth — Sam cracked open the
autosave payload and the OPML round-trip and confirmed it is "more honestly portable than a lot of
'we support Markdown export' apps."

## What they'd miss going back

The estimate rollups (all four compute users; Jordan and Devin most); rolling on your own notes
(Maya, Priya); the live check+rollup loop (Devin, Sam); and — Priya — the **zoom-to-one-point
calm focus** and **live-title link captions** (renaming a character does not rot references), plus
Jordan's **query reducers** (`sum("has:cost", cost)`, a live SUMIF over a search, not a fixed range).

## What they didn't like — one theme dominates

**Silent, correct-but-useless failure.** Independently, four personas hit the same wall: the tool
did something technically correct but quietly wrong, gave no cue, and made them *debug* it. This is
the single biggest trust-killer in the whole fleet, and it maps onto the P4 (Responsive: no silent
success, no silent failure) principle the project already holds.

- **Devin:** a `check` (`sum(cost) <= budget`) showed a confident green ✓ on a blown budget, because
  the cost line items were *grandchildren* and `sum(cost)` counts only *direct* children, so it
  summed to 0 and `0 <= 2000` read as pass. A green check and "-400 left" on screen at once. His
  words: "a guardrail that passes because it found nothing to check is worse than no guardrail."
  (Jordan independently confirmed the check IS rigorous when the rollup finds values, so this is
  specifically the *empty-rollup* case.)
- **Maya:** `{= mom + 1d6}` (the most natural RPG math there is) and her outline-point-defined
  `{rumor}` table both stayed dead plain text: no pill, no error, no cue. She also hit the
  inconsistency that `{roll: #tag}` reads outline points but a named rule `{rumor}` must live inside
  one grammar pill — "two different 'roll on a list' mechanisms with opposite rules about where the
  list goes."
- **Jordan:** cross-dimension `{= convert(10, km, kg)}` rendered as raw `{…}` source on load instead
  of the `#ERR` the guide promises. "A silent unresolved expression is exactly the failure mode I
  distrust."
- **Priya:** `{= words(subtree)}` placed on a *sibling* of her prose read 5, not 71, with no warning.

Secondary friction, in rough frequency order:

- **Scope defaults are a footgun for people who nest naturally.** Direct-children vs subtree bit
  Devin's money, Priya's words, and Devin's `[0/0]` progress cookie. The default is a defensible
  engine decision; the problem is it fails *silently* and non-coders nest by instinct.
- **Compute leaks its gears into prose.** Priya: a math pill in a display heading shows the recipe
  `words(subtree) 71`, not just "71" — a monospace code capsule clashing with the serif calm. Tags
  ride into link captions (`[[#mira]]` → "Mira Vane #char"). Sam: `{query:}` result rows render the
  raw `[[#id]]` token instead of the resolved title.
- **The front door reads as a spreadsheet for non-planners.** Alex nearly bounced ("this is a
  programmer thing, this is homework") and was saved only by "Start a blank outline"; the unlabeled
  toolbar icon row read as "Serious Power Tool." Maya wanted an RPG-first starter. Notably, the
  "Poke this document" tour lands *best* for Devin the planner (it demoes a held-to-budget weekend
  plan with a check and an estimate) — i.e. the current onboarding is tuned to exactly one of six.

Nobody reported visual ugliness or a jarring interaction; the complaints are all at the seam where
computation meets prose, or at first-boot framing.

## Most-wanted (candidate direction, not commitments)

Grouped by how far each sits from the current fences:

**Close to the grain (UX polish, mostly within existing engines):**
- A **value-only number pill** — render `71`, or "71 words", not `words(subtree) 71`, especially in
  headings (Priya). Recipe stays visible on edit/hover.
- **Scope-default hints** — surface "this matched nothing below here" for empty rollups and progress
  cookies where they sit (Devin, Priya). *(The empty-math-pill case already does this via
  `firstEmptyRollup`; extend the felt-coverage to checks and cookies.)*
- **Strip trailing `#tags` from live link captions** or honor a display-name on the target (Priya).
- **Onboarding that leads with the toy** — a playful dice/picker/tip-math first screen with the
  budget/formula demos behind a "want more?" door (Alex), and/or a **one-click solo-RPG starter**
  (oracle + action roll + threat clock + roll-on-your-cast) on the welcome bar (Maya).
- **A no-code "+" pill builder** — "add a random picker" / "add a quick sum" that fills the braces,
  so `{= }` vs `{ | }` need not be memorized (Alex).
- **Named tables as outline points**, or a clear "define this rule in a grammar pill" hint when a
  bare `{name}` resolves to nothing (Maya) — reconciling the two "roll on a list" models.

**Roadmap frontier (larger, some brush the fences — weigh against product-identity before building):**
- **Mobile / sync story** — the platform ceiling, and Alex's #1 ("my stuff following me
  everywhere"). Folder mode is Chromium-desktop-only today; Sam and Alex both name this as the gate.
  Note the storage/sync model is deliberately backend-free (identity doc), so any answer stays
  filesystem + user-chosen-sync, not a service.
- **Correlation between estimates + distribution introspection** — Jordan's frontier: independent
  sampling of `(5 to 10)*(2 to 4)` understates tail risk; he wants a shared-driver/`correlate(a,b,r)`
  primitive, plus `P(x>k)`, a p10/p50/p90 readout, and sensitivity/tornado. "Fix independence and
  Guesstimate should worry." (Companion to `enhancement-research.md` B2 / frontier F3.)
- **Cross-*document* aggregation** — Sam's unlock: `{= sum("#project cost")}` across a whole folder,
  with a resident multi-document index so folder-wide search/backlinks/compute work without the
  one-doc-in-memory limit. This is the single thing that would move him from "scratchpad" to "real
  work here." *(Superseded 2026-07-18: the owner directed that cross-document interactions — linking,
  mirroring, transclusion, graph, aggregation — are wanted; the constraint is performance/stability,
  not identity. The direction study with measured costs is `guidance/cross-document-direction.md`.
  Sam's vault migration stays a non-goal; the target is the notebook.)*

## What was acted on

Per the owner's direction, the persona fleet's findings split into concrete bugs (filed + fixed) and
wishes (recorded here, **no issues filed**). The three verifiable, silent-failure-class bugs were
filed under label `agent-review` and fixed:

- **#887 — vacuous check pass on an empty rollup** (Devin's green-check-on-a-blown-budget). Fixed: a
  `check` whose `sum`/`avg` matched zero qualifying values now returns `error`, reusing the
  `firstEmptyRollup` guard the math pill already uses. (`min`/`max` keep their deliberate ±∞
  vacuously-true empty case; `count` keeps 0; query reducers stay silent by design.)
- **#888 — a `{…}` that did not become a pill fails silently on the display/load path** (Maya's dead
  `{rumor}`, part of Jordan's convert case). Fixed: a display-mode cue (`.brace-attempt`, the
  render-side twin of the edit-mode `gr-bad` marker) flags any `{…}` that classifies as
  attempted-but-invalid, with a tooltip explaining why (`braceAttemptReason`). False-positive-safe:
  only `classifyBraceBody === 'invalid'` is flagged, so prose braces (`{note to self}`) are left
  alone. Named-rules-as-points stays dialog-authored by design (owner call); the cue is the fix.
- **#889 — cross-dimension `convert` renders raw `{…}` instead of `#ERR`** (Jordan). Fixed: a
  `{= …}` whose `expandAggExpr` pre-pass introduces a deterministic `#ERR` (a cross-dimension
  `convert`) now promotes to a real math pill that renders a loud `#ERR (convert)` on every path,
  with a precise reason (`mathReasonPhrase('convert')`) instead of blaming a missing variable.
  Genuine prose (`{= not math}`) still stays literal (the escape hatch is intact).

The three fixes share one theme, and it is the fleet's loudest signal: **make silent failures
loud.** Everything under "Most-wanted" remains unfiled candidate direction.
