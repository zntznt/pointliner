# Product identity — the canonical answers

**Status: BINDING. This is the one home for what Pointliner is, who it is for, and what it
will never be.** Other documents carry slices of this (the §0b mission test was born in
`base-views-vision.md`; roadmap #515, as amended in §2, carries the positioning history);
this file is where they are stated as one identity, and where any product/scope/positioning question gets answered
first. When a build decision needs a "which way does this lean?" answer, it comes here
before it goes anywhere else.

Provenance: distilled 2026-07-16 from an external product-identity questionnaire pass
(the "would I invest / join / commit years" question set), answered against the shipped
app and the recorded decisions, then corrected by the owner on the central point (§2:
the identity is the substrate — a tool for thought; the origin is provenance, not
positioning). Everything stated as fact below is **built truth or a
recorded owner decision** — nothing aspirational is stated as fact; the genuinely open
questions and unvalidated hypotheses are flagged as such (§8, §10) rather than papered over.

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
  roll dice, generate names, or do math."

## 2. The passion is the substrate: tools for thought (owner, 2026-07-17)

**Pointliner is a tool for thought — an instrument for freeform, adaptable thinking in
writing.** That is the identity, and the passion behind the product: not any one problem
it solves, but the substrate its solutions are made of. Text that generates, computes,
tracks state, and restructures freely is what thinking in writing wants — values that
change and propagate, outcomes that vary on purpose, structure that bends as the
thinking bends.

The origin, told once: Pointliner was born at the solo-RPG table, and it solves that
problem well. Solo play demanded prose, uncontrolled randomness, self-tracking state,
inline computation, constant restructuring, privacy, and portability — and building for
those demands produced general instruments, because those are the demands of thought
itself. The origin stays served **structurally, not narratively**: the development
discipline builds tools, and the table's needs are met as instances of them (bases are
the richer form of the tables RPGs use everywhere; decks, oracles, and variables serve a
campaign exactly as they serve a plan or a budget). A feature that is a good tool for
thought is a good tool at the table — so no document, pitch, or feature needs to retell
the origin story to stay true to it. The worked examples (`guide/solo-rpg/`) carry the
story for whoever wants it; everywhere else, the product speaks as what it is.

The customer is anyone who wants their written thinking to be alive. *(This supersedes
roadmap #515's "the solo-RPG player is THE customer" phrasing; the dated amendment is
recorded in `roadmap.md`.)*

**Who should never use Pointliner** (a strong product excludes; these are recorded, not
accidental):

- **Teams.** No collaboration, no accounts, no backend — out of scope, not deferred.
- **People who want their notes in the cloud by default.** The filesystem is storage;
  the user's own sync choice is sync.
- **WYSIWYG-first writers.** The text is markdown-shaped plain text and proud of it.
- **Vault-keepers.** The everything-store — capture it all, keep it forever, mine it later — is
  the second-brain model §2c rejects on its own terms. Out of scope as a *use case*, at any size.
  **This is not a performance statement and must never be quoted as one.** The exclusion held when
  the app could hold 17k points and holds identically now that it is measured working far past
  that; if the app got ten times faster tomorrow, this line would not move. Performance is pursued
  on its own merits, not as a boundary marker (see below).

**Performance is not one of these exclusions** (owner, 2026-07-28). None of the four lines above
is a capacity limit, and no measured ceiling is a reason to stop pushing. The standing position:
**we want the app to perform well, and that means pushing the boundary, which is what has earned
the improvements.** The record backs it — measuring is how the tag-inheritance pass made search
faster than it had ever been, how `toOpml` went 72 ms to 32 ms, how structural edits came down ~3x,
and how one "obvious" optimisation was killed on the spot (`structuredClone` measured **5x slower**
than `JSON.stringify`). Measure first, then push; see `performance.md`.

A ceiling found there is a **work item**, never a justification for a scope line. The failure mode
this note exists to prevent is the one that already happened once: `performance.md` said ~17k
points and this document quoted it as a boundary, so a storage number was doing the work of a
product decision, and it stayed there long after the storage number stopped being true.

## 2c. Not a second brain: the scratchpad test (owner, 2026-07-20)

Sourced from the owner's own use — the generative moment, the architect's doodle, a dozen
movie ideas run in parallel — and from Ryder Carroll's *"I Deleted My Second Brain"*
(bulletjournal.com, 2026). The PKM "second brain" promise — capture everything, forget
nothing, let the structure remember for you — has a real failure mode: storage
substitutes for cognition (*"a tag is not an insight... an idea not re-encountered might
as well have never been had"*), and the bigger the archive grows, the more thinking gets
deferred to a future self who will sort, connect, and understand it later. That self
never arrives. This is the Appleton critique (§3) from the inside, and mistaking
collect/store/search/link for the product is exactly the failure the mission test (§9)
exists to catch.

**Pointliner's answer is structural, not just stated.** Its primitives invite
re-encounter rather than filing: a pill is live, re-read or re-rolled on THIS look, not
archived for a later session (`{= sum(cost)}` is never stale; `{2d6}` answers again on
click). §8b's falsification test — pills going unused, the app reducing to "a nice
outliner" — is already the guard against the archive taking over the engine. And the
resurfacing the article asks for is a shipped mechanic, not an aspiration: `{roll: #idea}`
pulls a past thought back into present attention as material for what the user is doing
right now (§7's own demo), never a browse of a maintained graph.

**The workspace exists for parallel trains of thought, not a connected graph.** Multiple
documents let unrelated brainstorms run unobstructed, side by side; when one reaches for
another — a link, a mirror, a cross-doc query — that relationship is fodder the CURRENT
thought can use, never an archive-building obligation. A feature that nudges a user
toward "link it now, make sense of it later" is optimizing for the deferral trap,
whatever the mission test says about composing with the engine.

Pointliner is not a second brain. If it lands anywhere in this argument, it's where
Carroll himself lands — a workspace for the mind the user already has, never a
replacement for it.

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

**Translating the belief outward.** "Text should be alive" is a philosophy, not a user
problem — it steers builds, and it stays internal. External copy translates it into
problems a stranger already recognizes: *stop copying numbers between your notes and your
spreadsheet* · *keep the plan, the math, and the random table in one document* · *notes
that don't go stale the moment you write them.* The README's `{2d6}`-first opening is
this rule executed: show the alive text, don't preach it.

**The lineage, and the test we accept.** "Tools for thought" is a real tradition —
Iverson (notation as a tool of thought), Engelbart (augmenting the capability to approach
complex problems), Kay, Victor, Matuschak & Nielsen — and Pointliner claims a place in it
on the strength of one specific merger: **the freeform, endlessly reorganizable text of an
outliner fused with a computational engine**. Not a spreadsheet's rigid grid with formulas
in it; living prose that can roll, generate, total, check, and estimate mid-sentence. The
bar the tradition sets is Matuschak & Nielsen's: *a context in which the user can have new
kinds of thought, formerly impossible for them.* That is the test this product accepts —
surprise from your own material, possibilities you didn't enumerate, uncertainty faced
with numbers instead of dread, even metacognition (the document watching your thinking
think: checks that flag drift, rollups that reveal shape, queries that show you what you
actually wrote). Appleton's critique of the 2019–2020 note-app wave (see
maggieappleton.com/tools-for-thought) is the same fence this doc draws from the other
side: those apps narrowed "tools for thought" to collect/store/search/link — white-collar
filing. That feature set is table stakes here, never the claim. The claim rests on the
engine.

## 3b. Two freedoms the tool guarantees (owner, 2026-07-17)

- **Freedom of form (no rigid schema).** A spreadsheet makes you think in its grid;
  Pointliner must never make you think in anything. Freeform text is the primary surface;
  every structure — bases, boards, properties, sequences — is **one way of organizing
  thought, never THE way**: opt-in, reversible, and always just a rendering of plain text
  you can walk away from. When structure and freeform pull against each other, freeform
  wins by default.
- **Freedom to leave (no process lock-in).** Pointliner slots into and out of a thought
  process; it does not want to own one. A user moves their thinking from here to the
  table and back freely, or leaves the app entirely and continues another way, taking
  everything with them (plain text, OPML, markdown, a self-contained runnable HTML). The
  tool serves a practice; the practice belongs to the user. **It never forces a way of
  doing things — at least it never wants to** — and any feature that quietly starts to is
  violating this section.

This also settles a claim-size question: Pointliner claims to be an **instrument**, not
an **environment**. An environment shapes how its inhabitants think and owns their
process; that is exactly what freedom-to-leave refuses. If users one day report that it
changed how they think, that is theirs to say — the product never claims it first.

## 3c. Inviting, not persuasive (owner, 2026-07-17)

**Pointliner is not being sold, and there is no one to convince.** No campaign, no launch
timed against inertia, no funnel, no conversion. The owner's stance is explicit: the goal
is not to win anyone over. The **one** property worth keeping from marketing is
**invitingness** — and invitingness is not persuasion, it is openness.

The distinction is the whole point:

- **Persuasion pushes.** Urgency, argument, "you should switch," friction that traps, a
  wall before the value, a guilt-trip on the way out. Pointliner does none of it.
- **Invitation opens.** Try it in seconds with nothing to lose; understand it fast; stay
  as long as it helps; leave with everything. It welcomes; it never argues.

Invitingness is **freedom-to-leave's welcoming twin**: §3b says *you can always go*; this
says *come in whenever, and it costs you nothing to look.* Where it already lives, as
built facts: no account or signup wall (open the file, it runs); the atom in the first
thirty seconds — value before any commitment (§7); the empty canvas that says "or just
start editing"; the whole exit story (§3b) that lets a wavering user see the door is
unlocked *before* they walk in. The README executes this by **showing** the live text,
never preaching it (the §3 translation rule).

**The guard:** a feature that nags, upsells, manufactures urgency, gates value behind a
commitment, or guilt-trips a user for leaving is violating this section, even if it would
"convert" better. Optimize for welcome, never for capture. This is a design principle with
the force of the never-build list — not a marketing tactic.

## 4. What we are competing with

**Not note apps.** The real competition is **the stack of single-purpose tools a
thinking session otherwise juggles around its notebook**: the calculator, the
spreadsheet, the dice roller or random picker, the generator tab — plus the notes they
all orbit. Whatever the session is about, the stack is the same shape, and Pointliner
collapses it into the document itself. (This §4 is internal competitive *analysis* — how
to think about where the tool sits — not a pitch to deliver; per §3c the product invites,
it does not sell.)

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

## 7. The demo (thirty seconds first, then three minutes)

**The first thirty seconds — the atom of the whole product:** type `{2d6}` in a point,
click away, and the text becomes a live pill; click the pill and it re-rolls. That single
loop (type braces → get a live thing → click it → it answers again) is the "oh" moment
every longer demo is built from, and the first ten minutes of real use is just that loop
discovering its other bodies: `{a | b}`, `{= …}`, `{roll: #tag}`.

**The three minutes, if one workflow can be shown:** one outline, no setup. Write a short plan in prose. Give a few points a
`cost` property and drop `{= sum(cost)}` on the parent: the total is alive. Add a check
(`sum(cost) <= budget`) and watch it flag the overflow the moment it happens. Declare
`{budget := 500}`, change it, and everything propagates. Then break the rut: tag a few
points `#idea` and pull `{roll: #idea}` — the document surprises you with its own
contents. Generation, computation, live state, and bending structure, all in one
document that thinks along. (The same demo in its native habitat is the first case in
`guide/solo-rpg/`.)

## 8. Questions held honestly (open, resolved, or dissolved — never papered over)

**8a. The chronicle/lore/custom-calendar set — substrate review DONE + RATIFIED (IA-4,
2026-07-17; owner ratified keep-as-is).** The owner's recorded unease was *"did I rush to solve a problem with a rigid
schema?"* The review against the shipped code (full verdict: `identity-alignment.md` IA-4) is
reassuring: **none of the three is a rigid schema.** Custom calendars are clean substrate (a general
`{months, week, eras}` bijection over epoch-day integers — the *sequences* pattern applied to "what
is a date"); lore dates are the thinnest possible instance (a recognized property key feeding the
timeline). The chronicle is substrate-REUSE (its dating is identical to the journal's; it is the
journal generalized to any home and any calendar) with one real finding: **the journal and chronicle
are two instances of an un-extracted "dated log" substrate**, and the moving-now cursor is a novel
construct welded to the singular `gamelog` binding. **Owner decision (2026-07-17, ratified): keep all
three shipped; do not refactor now** — the substrate-completing move (unify journal + chronicle,
generalize the cursor) is a clean-up toward the substrate, not a removal, and per the "build the
general instrument on demand, not on spec" rule it waits for a real trigger (recorded: the next
substantive change to either log). This entry stays the standing example of the substrate test (§9)
turned on our own work — the answer was "not a schema," and the discipline caught the duplication.
A separate finding — the chronicle's user-facing *framing* read RPG-specific ("in-world log," "game
log," "beat") rather than "a dated log in any calendar" — was addressed by a **copy-only de-theme**
(SR-9, 2026-07-17): the user-visible strings and general guide pages now read neutral (keeping the
word "chronicle"), the solo-RPG worked examples stay themed, and every internal identifier +
persisted format is unchanged. The substrate *mechanism* verdict above is untouched; only the copy was.

**8b. The falsification test for the tools-for-thought claim.** "Tools for thought" is
a category with a history of vague claims, so this doc states what would DISPROVE ours:
if real documents show the engine going unused — pills rare, the app living as "a nice
outliner with some clever commands" — then the Matuschak & Nielsen bar (§3) is failed and
Pointliner is a note app, whatever this document says. The claim is falsifiable by
observed use, and the product surfaces (the `{2d6}`-first onboarding, the `?` cheat
sheet, the concept guide) exist precisely to keep the engine from being missable.

**8c. "Why now?" — dissolved (owner, 2026-07-17). It was the wrong question for this product.**
The investment questionnaire posed "why now" as a *selling* question: why should someone switch
today rather than next year. Pointliner is **not being sold** (§3c), so the question dissolves rather
than gets answered — there is no launch to time against inertia because there is no campaign, and no
one who needs convincing. The doc previously carried a market thesis here (positioning window,
fundraising framing, a wedge to "win"); the owner has retired it as off-key. What survives is one
small, true, *non-selling* observation, and it serves invitingness, not persuasion: **the AI moment
made the tool easier to explain.** Before 2023, "your notes can generate and compute in place" had no
reference point; now "like an LLM in a document, but deterministic, local, and yours" lands in a
sentence. That legibility lowers the barrier to *understanding* Pointliner — which is invitingness
(§3c), the welcome mat, not a reason to sell. "Why now" is therefore closed, not open: the product's
answer is that it does not ask the question.

## 9. How this file is used

- **As a scope filter, three times:**
  1. **The mission test** (§0b, born in `base-views-vision.md`, canonical here) — *a
     feature earns its place where it composes with the generative/computational layer;
     parity with database/PKM apps is the scope creep the fences exist to stop.*
  2. **The substrate test** (owner, 2026-07-17) — before shipping a domain-shaped
     feature, ask: *have I reached the substrate of this tool, or am I rushing to solve
     a problem with a rigid schema?* A feature passes when its general instrument is
     identifiable (bases pass: they are the substrate of every RPG table); it gets
     flagged when it encodes one domain's shape directly (§8a is the standing example).
  3. **The scratchpad test** (§2c, owner, 2026-07-20) — does this feature keep a user
     inside present-tense, generative thinking, or does it ask them to defer
     understanding to a later organizing session? A feature can pass the mission test
     (composes with the engine) and the substrate test (reaches the general instrument)
     and still fail this one if its real effect is "capture now, connect later."
  When a proposal leans database-parity or domain-schema, this file is the counterweight
  to cite.
- **As the voice source (invitingness, §3c — show, don't sell):** README and first-run
  copy conform to §2 — the tool (the living, thinking document) leads, by *showing* the
  live text, never by arguing for it. The origin gets its one born-at sentence and the
  pointer to the worked examples, nothing more; it is never erased and never made the
  category. The README's current shape is the reference execution.
- **As the invitingness guard (§3c):** any feature or copy that nags, upsells, manufactures
  urgency, gates value behind a commitment, or discourages leaving is checked against §3c
  and cut — optimize for welcome, never for capture.
- **As the questionnaire answer key:** the confident answers live here; empirical
  questions (what real users feel, who actually discovers it, retention) are marked
  unknowable-from-code and stay out until there is user evidence. Note: the questionnaire's
  *selling* questions (why-now, conversion, the pitch) are answered by §3c's stance — the
  product is not sold, only made inviting — not by market theses.

## 10. Hypotheses only users can settle (held, not asserted)

Design documents cannot validate these; only observed use over time can. They are
recorded so we test them instead of assuming them:

1. **The perception hypothesis.** Users experience the `{…}` engine as THE product, not
   as an advanced feature bolted to a nice outliner. (If this fails, the fix is in the
   product's first minutes, not in this document — see §8b.)
2. **The habit hypothesis.** The reflex that forms is *reach for braces*: whenever a
   thought needs a number, a pick, a roll, or a check, the hand types `{` before the
   mind finishes asking. The tell, after a couple of weeks, is thinking "I wish I had
   Pointliner for this" inside other tools. The candidate loop: a trigger that recurs
   wherever text is written → one keystroke of syntax → an instant, visible payoff (the
   pill) → the document is now smarter, which creates the next trigger.
3. **The absence hypothesis.** Leaving is easy (§3b — that freedom is non-negotiable),
   but the departed user misses the aliveness: opening dead text elsewhere and reaching
   for a re-roll that isn't there. Retention through value, never through walls.

When user evidence starts arriving, the answers get recorded here — and if any hypothesis
fails, §8b says what that means honestly.
