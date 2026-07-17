# Product identity — the canonical answers

**Status: BINDING. This is the one home for what Pointliner is, who it is for, and what it
will never be.** Other documents carry slices of this (the §0b mission test was born in
`base-views-vision.md`; roadmap #515, as amended in §2, carries the positioning history);
this file is where they are stated as one identity, and where any product/scope/positioning question gets answered
first. When a build decision needs a "which way does this lean?" answer, it comes here
before it goes anywhere else.

Provenance: distilled 2026-07-16 from an external product-identity questionnaire pass
(the "would I invest / join / commit years" question set), answered against the shipped
app and the recorded decisions, then corrected the same day by the owner on the central
point (§2: the drive is solo-RPG and never drifts; the product enables thought in writing). Everything stated as fact below is **built truth or a
recorded owner decision** — nothing aspirational is stated as fact, and the one genuinely
open question is flagged as open rather than papered over.

---

## 1. The core (the 90% answer)

> **If 90% of Pointliner's features were deleted, the 10% that would still make it worth
> using is the inline `{…}` engine: any bullet can generate or compute.**

Dice, grammars, oracles, decks, math, rollups, variables, estimates, live queries — one
brace language, re-rollable in place, inside plain text you own. Strip the outliner to a
bare bullet list and keep the engine: still Pointliner. Strip the engine and keep the
outliner: Workflowy. The product is the engine riding inside the text; the outliner is
the (excellent) substrate.

Stated as the one-sentence versions:

- **Pointliner is the fastest way to** keep a living document that rolls dice, generates
  text, and computes, without leaving your notes.
- **People don't choose it because it's offline. They choose it because** their notes can
  DO things, in one language, and stay theirs forever. (Offline/single-file is the
  enabler, not the value.)
- **The sentence users tell a friend:** "It's a plain-text outliner where any bullet can
  roll dice, generate names, or do math." (RPG flavor: "a dice roller, an oracle, and
  Perchance living inside your campaign notes, offline.")

## 2. The drive and the product (owner clarification, 2026-07-16)

Two things are true at once, and the distinction is the identity:

> **The drive that created Pointliner is the solo-RPG table, and that drive will never
> drift.** It is why the app exists, where it is sharpest, and where the worked examples
> live (thirteen cases in `guide/solo-rpg/`).
>
> **But the product is more than a solo-RPG thing: it exists to enable thought in
> writing** — free-flowing, flexible, *variable* thought. The dice, grammars, oracles,
> variables, and rollups are instruments of that: text that can surprise you, compute for
> you, and bend as your thinking bends.

So the pitch leads with the living, thinking document; solo-RPG is named as the origin
and the flagship proof (the README's current shape: engine-first headline, "born at the
solo-RPG table, and that is still where it is sharpest" immediately after). This
**amends roadmap #515**: #515's insight stands — solo-RPG is the one surface where every
feature is wanted by the same person at once, and it stays the front-door worked example,
never demoted — but "solo-RPG player is THE customer the pitch names" over-corrected.
The customer is the person who wants their written thinking to be alive; the solo-RPG
player is the clearest instance of that person, not the boundary of them.

**Who should never use Pointliner** (a strong product excludes; these are recorded, not
accidental):

- **Teams.** No collaboration, no accounts, no backend — out of scope, not deferred.
- **People who want their notes in the cloud by default.** The filesystem is storage;
  the user's own sync choice is sync.
- **WYSIWYG-first writers.** The text is markdown-shaped plain text and proud of it.
- **Vaults past ~17k points on default storage** (the measured `localStorage` wall;
  the workspace folder lifts it, but a 100k-node graph-base is not this product).

## 3. The belief (what competitors don't hold)

> **Text should be alive: generation and computation are writing primitives, not a
> separate app.** And its corollary: **files should outlive companies** — the document is
> a file you own, the app is a file you own, and both run with the wifi off, forever.

This is the philosophy competitors would have to abandon their own architecture to copy.
Obsidian could ship a dice plugin — as one of ten incompatible plugins, not as a native
authoring language. Notion cannot be a single offline file without ceasing to be Notion.
The unfair advantage is not "offline" or "fast" (qualities); it is that the engine is
**native to the text as one language, enforced by conviction** (P5's closed syntax
inventory is identity discipline, not just UX hygiene).

## 4. What we are competing with

**Not note apps.** The real competition is **the stack of single-purpose tools a session
otherwise juggles**: the dice roller, the Perchance tab, the random-table PDF, the yes/no
oracle app, the spreadsheet for the sheet math, plus the notebook they all orbit.
Pointliner's pitch is that the stack collapses into the document itself.

Against the named rivals, the confident answers:

- **Why doesn't Obsidian win?** Link/file/graph-centric; generation is a second-class
  plugin ecosystem, not a language. Its center of gravity is the vault, not the living
  document.
- **Why doesn't Apple Notes win?** Dead text in a closed format. Nothing computes,
  nothing generates, nothing exports as a runnable artifact.
- **Why doesn't Notion win?** A cloud team database solving "shared knowledge base" —
  a different problem, on a foundation (accounts, backend, lag) this product exists to
  reject.

## 5. The never-build list (sacred; recorded across the direction docs)

- **No backend, no auth, no accounts, no team collaboration.** (CLAUDE.md storage model:
  out of scope, not deferred.)
- **No build step, no runtime dependencies; the app stays one `index.html`.** (The only
  sanctioned exception class: PWA install assets, under the three-safeguard test.)
- **No document- or plugin-supplied code execution** while it ships as a single build-free
  file. Extensibility is declarative data packs only (`plugins-direction.md`).
- **No second authoring language.** New generative/computed content plugs into `{…}` or
  `evalMath`; the syntax inventory is a closed set (`ux-discipline.md` §2/P5).
- **No saved-views database layer / no second truth.** Query pills and query bases are
  renderings of the live outline; a persisted display predicate that makes a widget show
  other than what the text says was considered and rejected (`saved-views-proposal.md`
  SV-3/SV-4; `base-views-vision.md` §0.6).
- **No verbatim third-party oracle/table data.** Mechanics yes, published values never
  (the IP guardrail, roadmap).

## 6. AI-independence (a durability fact worth stating plainly)

Pointliner's generative layer is **not LLM-based and rides no AI trend**: dice,
Tracery-style grammars, a hand-written expression evaluator, Monte-Carlo estimate
sampling — deterministic, offline, interpreter DSLs. If AI disappeared tomorrow,
Pointliner would be exactly as useful. In a market crowded with "AI notes apps," this
product is generative *without* AI — lead with that, don't apologize for it.

## 7. The one demo (if only one workflow can be shown)

A solo-RPG scene, three minutes: narrate a beat; drop `{2d6}` for the check; ask the
oracle `{oracle: likely}`; pull an NPC from your own cast with `{roll: #npc}`; name a
stranger from a grammar; track HP as a variable with a live meter — all inline, all
re-rollable, all in one outline that saves to a file. One scene demonstrates the entire
engine; every other workflow is a variation.

## 8. The open question (flagged, not papered over)

**"Why now?" has no recorded answer.** Nothing in the repo argues why someone should
switch today rather than next year. Candidate ingredients exist (local-first sentiment,
subscription fatigue, the solo-RPG boom, AI-slop fatigue making deterministic tools
fresh) but no thesis has been chosen. Until one is, marketing copy should not fake one.
This is the single identity gap; closing it is an owner decision, not a build task.

## 9. How this file is used

- **As a scope filter:** the §0b mission test (born in `base-views-vision.md`, canonical
  here) — *a feature earns its place where it composes with the generative/computational
  layer; parity with database/PKM apps is the scope creep the fences exist to stop.*
  When a proposal leans database-parity, this file is the counterweight to cite.
- **As the pitch source:** README and first-run copy conform to §2 — the living,
  thinking document leads; solo-RPG is named as the origin and flagship proof, never
  erased and never made the boundary. (This amends #515's README instruction; the
  README's current shape is the reference execution.)
- **As the questionnaire answer key:** the confident answers live here; empirical
  questions (what real users feel, who actually discovers it, retention) are marked
  unknowable-from-code and stay out until there is user evidence.
