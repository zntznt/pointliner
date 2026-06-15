> **Status ledger for the generative + computational lane.** A point-in-time map of
> *what's built · what's deferred · what's deliberately out*, so the state isn't only in
> chat history. **Canonical detail lives elsewhere** — feature mechanics in
> `guidance/features.md`, the inspiration→upgrade catalogue + per-item status in
> `guidance/enhancement-research.md` (the `A1`/`B2`/… codes), the locked product direction in
> `guidance/roadmap.md`, and the syntax inventory in `guidance/ux-discipline.md` §2. This file
> is the index, not a second source of truth; when it disagrees with those, they win.

# Generative + computational engine — completion ledger

As of 2026-06-15 the **generative + computational catalogue is complete** — every item in
`enhancement-research.md`'s A/B inspiration tables is either shipped or a recorded, deliberate
deferral. The two engines (the `{…}` grammar + `evalMath`) plus the B2 sampler cover the whole
surface. The next frontier is a *different chapter* — the PKM / multi-document workspace.

## Shipped (the engine, end to end)

**Engine 1 — generative / random (`{…}` grammar + dice/markov):**
- Dice (incl. success-counting pools + reroll-once `rK`) · Markov chains · Roll tables (collapsed
  into one-rule grammars).
- Grammar engine `{…}`, content-sniffed: alternation `{a|b 2|c}`, **dynamic odds** (A5 — a `{= expr}`
  weight), **conditional text** `{cond: then|else}` (A3), **stateful sequences / decks**
  `{shuffle|cycle|once|stopping: …}` (A4 — resolved the "stateful randomness" open question),
  **repeat** `{Nx: template}`, **text modifiers** `{ref.mod}` (A1 — `cap/title/upper/lower/a/s/ed/ord`),
  **hierarchical items** `{item.field}` via dotted sub-rules (A6), named rules/tables/chains/vars.
- **Yes/no oracle** (a front door over weighted-alt — original neutral odds, IP-fenced).
- Variables: **formula** + **random pick** (frozen, re-rollable) — the locked consistency model.
- Typed `{…}`→pill promotion; the unfold/refold edit model.

**Engine 2 — expression evaluator (`evalMath`):**
- Arithmetic/precedence, comparisons, ternary/`if`, constants (`pi`/`e`/`tau`/`today`).
- Functions in `FN1`/`FN2`/`FN3`: math, **unit conversions** (`from2to`), **date math**
  (`date`/`year`/`month`/`day`/`weekday`/`quarter`), and the utility helpers
  (`daysuntil`/`daysbetween`/`clamp`/`pctof`/`pctchange`).
- **Subtree aggregation** (B1): `{= sum|avg|count|min|max(prop)}` over direct children — render-time,
  live; numeric **and date-shaped** props (epoch-days), so F2 date-range checks compute.

**Engine 3 — uncertainty sampler (B2, frontier F3, first-in-class):**
- The `est` artifact: `lo to hi` / `normal` / `uniform` / `+−×÷`, Phase-2 `sum|avg(prop)` tree rollup;
  mean ± [p5,p95] + a unicode sparkline; storage `{key, expr, seed}` (reproducible). A **separate**
  Monte-Carlo sampler because a distribution can't ride `evalMath`'s number-only contract.

**Cross-cutting:** outline constraints / lint (F2, a reserved `check` property + `is:failing`) ·
declarative data-pack plugins (grammar/var packs, data-only) · self-contained HTML export (C1).

## Hardening pass (2026-06-15 — simulated-user audit)

Four simulated users (varying interest/attention) drove the real cores through only the in-app
help. The **engines proved correct** for every documented form — the failures were doc-accuracy and
two correctness footguns, now closed:
- **`evalCheck` requires a comparison.** A `check` with no `> >= < <= == !=` (a bare `5 + 5`,
  `sqrt(16)`, or lone `sum(cost)`) returned a truthy `pass` — a P4 silent-wrong-success. It now
  returns `error`.
- **Rule-level dynamic weights are kept.** `parseRules` silently dropped a `{= expr}`-weighted
  alternative (`name: a | b {= w}`) because the filter required a numeric `weight`; it now keeps the
  `weightExpr` alt, matching the inline `{a|b {= w}}` path (P5 coherence).
- **In-app help corrected** for the traps a real person hit: `log` is base-10 (`ln` for natural);
  date math returns a number (wrap in `asdate(…)`; a fixed date is `date(y,m,d)`); `{lo to hi}` is a
  distribution, not a random integer (use `{1d100}`), is lognormal-or-normal, and composes
  **independent** draws; `sum(prop)` aggregates a child property and is not Excel `SUM(1,2,3)`; a
  pick variable is declared via `@ → Variable`, not as a grammar rule line.

**Follow-up batch (same audit):** the residual clarity gaps + the one real P4 item:
- **Estimate↔math boundary now legible.** Using estimate syntax (`to`/`normal(`/`uniform(`) in a
  math/check expression reported a misleading `bad ref`; `mathErrorReason` now returns an `estimate`
  code and `mathReasonPhrase` (one shared code→phrase map, P1) makes the math dialog, the `/check`
  dialog and `#ERR` pills name the boundary. The math dialog also now shows the reason (was a bare
  "Invalid expression").
- **In-app help** clarified for the remaining silent/startling behaviors: `{Nx}` takes a **literal**
  N (a roll like `{{2d4}x:…}` isn't supported); a non-numeric weight (`rare 1d6`) is read as entry
  text, not a weight; `min/max` over no matching child shows `∞`/`−∞`; estimate `lo to hi` bounds are
  order-insensitive.

Still open (a separate UX lane, not an engine gap): **non-brace artifact-looking input is silent.**
Typing a bare `2d6` or a comma-separated `{a, b, c}` stays plain text with no nudge — correct by the
`{…}`-is-the-syntax / literal-escape-hatch design (UXP-20), so the remedy is discoverability
(onboarding / an empty-state cue), governed by `ux.md`, not a generative-engine change.

## Deferred (recorded follow-ons — not lost, just not v1)

- **A6:** field × modifier chaining (`{w.damage.cap}`); multi-level nesting (`{planet.country.town}`);
  fields with their own frozen state.
- **B2:** `min/max/count` in the uncertain context; mixtures (`mx`); correlation / shared variables;
  more families (beta, …); the analytic `est+` (no-sampling) rollup; cross-engine use (an estimate's
  mean as a number inside `{= …}`); sensitivity / tornado.
- **A1 modifiers:** aliases (`.an`/`.capitalize`/`.plural`); irregular plurals / past tense (regular-only
  by design). Modifiers on non-references (alternation/dice/math directly) — name a rule first.
- **F2 checks:** multiple checks per point (`evalMath` has no `&&`); upward / cross-parent references;
  structural / existence checks (that is **F5**, enforced tree grammars). Date-valued *own*-props as
  check variables (only *child* date props aggregate today).
- **A8 knobs:** `random(lo,hi)` in `FN2`; a cycling-link pill; a user-facing RNG **seed** (pairs with C1).
- **B3/B4/B5:** living-document line refs / running totals; deeper unit dimension-tracking; richer
  date/interval formatting.

## Won't-do (deliberate, locked out)

- **Inline same-expansion binding** — `{a := …}` / `ctx.binds` (reverted, PR #51). Cross-reference
  consistency is the **random-pick variable**, full stop (`generation-direction.md` §2). Do not rebuild.
- **`{d66}` dice mode** — collides with a literal 66-sided die.
- **Anti-repeat reroll** — churns the seeded determinism for a marginal feel-good gain.
- **Bane/botch pools** — niche; the success-pool primitive already covers the general case.
- **New top-level syntax in general** — the §2 inventory is closed; growth needs explicit sign-off and
  retirement of what it overlaps (P5).

## The next frontier (a separate, heavier chapter)

**PKM / multi-document workspace** (Zettelkasten): cross-document links + backlinks, the
multi-document workspace itself, storage/durability, and the lean↔guided UX modes. Same-document node
links + the `[[` picker already ship; the multi-doc workspace is the unbuilt part. Locked direction:
`guidance/roadmap.md`. This is genuinely a good place to pause and *use* the engine before opening it.
