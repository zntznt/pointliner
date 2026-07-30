# User research: six laptop users, "various walks of life" (2026-07-30)

**Status: RECORD (not a commitment).** A read-only demo panel, one agent per persona, each
**briefed on `product-identity.md` first** (so nobody made vacuous requests) and each reacting to
the **real running app** — the core loop was driven and verified before anyone was briefed (a
`{2d6}` pill re-rolled 6→9; a `cost` edit of 180→260 propagated to `sum(cost)` 470,
`budget - sum(cost)` -70, and flipped the check green ✓ → red ✗). Every persona reported under a
candor mandate ("no politeness inflation; a real verdict"). No agent wrote to the repo. The wish
list here is **candidate material for the roadmap's interleaving clause, not a backlog of
promises** — same standing as `enhancement-research.md` and the two prior fleets.

This fleet is deliberately **not** the note-app enthusiasts the first fleets covered. The prior
fleets spanned the origin user, the two compute audiences, a prose writer, the PKM skeptic, a
non-technical bounce-risk ([fleet 1](user-research-2026-07.md)), and keyboard-only / touch /
live-table / teaching / lab ([fleet 2](user-research-2026-07-fleet2.md)). This one is ordinary
people who happen to have a laptop open — the mixed demo room — chosen to stress the identity's
*edges*: users whose day job is not notes, who are not quant, and who are the front-door bounce.

## Verdicts

| Persona | Who | Verdict | Whole-life | Narrow-job if fixed |
|---|---|---|---|---|
| **Nadia** | Freelance event/wedding planner; today Notion + Sheets | Alongside — a live self-checking budget scratchpad she'd draft in before Notion | **4** | 8 (read-only client snapshot) |
| **Mr. Okafor** | HS chemistry teacher; today Word + calculator | Yes, for answer keys (recompute when a problem is tweaked) | **5** | 8 (batch "make 35 copies") |
| **Reggie** | Food-truck owner; today paper + a distrusted spreadsheet | Yes, for catering quotes (headcount in, margin + guardrail out) | **4** | 8 (phone-friendly quote template) |
| **Priya** | Board-game host, NOT solo-RPG; today spreadsheet + dice app | Yes, for homebrew scenario design + game-night twist tables | **6** | 8 (board-game starter + draw-without-replacement) |
| **Eleanor** | Retiree writing a family memoir; today Google Docs only | **No** as shown — the pitch is the part she doesn't want | **3** | — (identity mismatch; ownership is the one hook that reached her) |
| **Théo** | Humanities PhD, pure prose; today Zotero + Docs + a scratch file | Alongside, leaning yes-for-a-job (structured argument-outlines) | **4.5** | 8 (prose-shaped checks + `{roll:#tag}` shown) |

**Mean whole-life fit ≈ 4.4; mean narrow-job-if-fixed ≈ 8.** The gap between those two numbers is
the entire finding.

## The unanimous pattern: the "click" is propagation, never the dice

Every persona — including the two who never want a number — named the **same** moment as the one
that landed: edit one `cost`, watch the total, the remaining, and the check all re-derive at once,
the check flipping to red on its own. **Zero of six** named the `{2d6}` atom (which the product
opens with) as a reason to stay. Théo put it exactly: *"what landed was not math — it was a
document that re-derives its own conclusions when a premise changes."* The moat works; it is not
the hook on the marquee. This matches the first fleet's finding that live-compute is "a category
difference, not a nicer-plugin difference," and sharpens it: the category difference is
**propagation**, and the demo leads with generation instead.

## The recurring friction (three themes, across unrelated lives)

1. **The front-door bounce is reproducible.** *6 of 6* nearly left in the first 30 seconds;
   "Poke this document" + a dice pill reads as "just another outliner," and the value only lands on
   a click no one has a reason to make. Prior fleets flagged this as a risk; this panel makes it
   near-universal. (Filed: the front-door issue below.)
2. **"Someone has to build the machine first, and that someone is me."** The four builder-personas
   (Nadia, Okafor, Reggie, Priya) all hit the wall that the magic depends on a pre-wired computed
   doc, and none of them know the brace language or will learn it cold. This is #518's
   mechanism-without-content, confirmed **generalized past solo-RPG** to every domain in the room.
3. **The demo defaults are money- and dice-shaped.** Every non-finance persona had to *translate*
   the budget example into their own domain in their head. The engine is general (the maker is
   right); the **on-ramp is not**.

## The two findings that touch the identity itself

- **The enabler is the widest hook, and the demo buries it.** `product-identity.md` §1 correctly
  calls "single file you own, offline, no account" the *enabler, not the value* — for the TARGET
  user. This panel does not refute that. But for the two personas furthest from the compute
  audience (Eleanor, Théo), ownership/permanence was the *only* thing that reached them, and it
  reached them hard ("the most important sentence anyone said all day"; "not a feature, a
  precondition"). Eleanor's line is the sharpest the panel produced: *"You're selling me the one
  part I don't want and barely mentioning the one part I'd pay for."* This is a sequencing point,
  not a repositioning: the §3c *invitation* is leading with its narrowest hook (dice) rather than
  its widest (permanence, propagation).

- **§8b, run live, returns a split verdict.** Théo is the pure-prose seat, deliberately set against
  the tools-for-thought falsification test. His result was precise: the compute engine "stopped
  being obviously irrelevant" but "did not earn its place," because every check shown watches
  *arithmetic*, and the two features actually built for him (`{roll:#tag}` resurfacing a past note;
  checks over prose/structure) were **never shown or don't yet point at words**. So Hypothesis #1
  (users perceive the engine as THE product) is **confirmed for the compute audience and
  unproven-but-reachable for the prose audience** — the fix is in the first minutes and the
  examples, not the architecture.

## What would win each over (and what should NOT be chased)

Ascending cost, per persona:

- **Cheapest, helps everyone: fix the front door + ship domain starters.** Lead the first screen
  with the *propagation* moment (a budget already over, with a "change this number →" cue), not
  `{2d6}`; surface the existing `STARTERS` gallery (#865) before the bounce; add starters in the
  panel's languages (catering quote, answer key, board-game twist-table + collection, memoir
  outline). Pure content; fully inside the fences.
- **Small engine adds with real reach:** draw-without-replacement for `{a | b | c}` (Priya's one
  genuine gap between "dice" and "tables"); checks/queries over prose and structure
  (`count(children where tag = #contested)`) — the move that turns the moat toward the non-quant
  half of "tools for thought."
- **Surface what already ships:** `{roll:#tag}` (Théo's would-be lead feature, never demoed) and
  footnotes/citations. Discoverability, not building.
- **Honest identity-collisions to let go of gently, not fix:** Nadia's client-*editing*, Reggie's
  phone-first field use, Eleanor's photos-and-hand-it-to-family. These collide with deliberate
  scope lines (no team, no cloud). The panel is useful precisely for showing *where the fences cost
  users*: Nadia is one read-only export away from won (nearly free given "it's one HTML file");
  Eleanor's needs are a real mismatch the product should decline rather than chase.

## Bottom line

The core thesis is validated by the people least inclined to agree with it — live-compute-with-
propagation is a category difference that reaches even a memoir writer and a pure-prose scholar
once they *see* it. But the shipped demo leads with its narrowest hook (dice) and buries its two
widest (propagation, ownership), producing a reproducible 30-second bounce and a 4-vs-8 gap between
"fits my life" and "does the one job I'd hire it for." None of the highest-leverage fixes
(front-door re-order, domain starters, surfacing `{roll:#tag}`) require touching the identity — they
are content and sequencing, and they would move the whole panel up several points at once.

## What was filed

Concrete items went to GitHub Issues (`agent-review`), not this tree, per the parallel-review
convention:

- **#1192** — [product] First-run leads with dice; the 6/6 bounce buries propagation and ownership.
- **#1193** — [product] Starter gallery misses the panel's domains, and the bounce beats the user
  to it (quote / answer-key / board-game / memoir starters). Extends #865, #518.
- **#1194** — [enhancement] Draw-without-replacement for `{a | b | c}`: model a deck, not just a die.
- **#1195** — [product] Checks/queries over prose and structure, not just numbers (the §8b bar).
- **#1196** — [product] `{roll:#tag}` and footnotes/citations are invisible in the demo — the prose
  audience's lead features, unsurfaced.
