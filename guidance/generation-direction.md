# Pointliner — Perchance-Style Generation: Bound Picks & Modifiers (Direction)

## A locked direction and scope fence

This document is the **north star** for closing the gap between Pointliner's grammar engine and
**Perchance-style generation**. It is **binding direction** — future work (and any AI) MUST build
toward this model and MUST NOT re-introduce the patterns it retires. It is also a **scope fence**: it
names the generative ambition *and* the hard line of what we build now vs. later, so "generation"
can't quietly become a second engine.

Read alongside: `CLAUDE.md` ("the two-engine reality" — the grammar engine this extends),
`ux-discipline.md` (P5 and the closed syntax inventory), `ux-remediation.md` (UXP-20, the
syntax-sprawl guard), `arrays-direction.md` (the **sibling** generative track — addressable lists,
deliberately separate from this), `roadmap.md` (the "Generative / internal-engine ideas" list this
slots into).

**Pre-release note:** there is no released data, so **migration is explicitly a non-concern.**

---

## 1. The actual gap (north star)

> What makes a generator *feel* like Perchance is **not** indexing or counting a list. It is two
> things: **(1) consistent picks** — pick a value once, give it a name, and reuse the *same* result
> later in the same generation; and **(2) lightweight modifiers** — `a/an`, plural, capitalize on a
> pick. Pointliner already has named lists, weighted alternation, nesting, and document variables.
> The one structural thing it lacks is **(1)**: every `{…}` re-rolls fresh, so you cannot say "the
> hero met a **dragon**; the **dragon** roared" and get the same creature twice.

- **MUST:** consistent picks ride the **existing `{…}` grammar engine** — zero new top-level
  delimiter. The reuse of a bound name resolves through the *same* lookup path a `{rule}`/`{var}`
  already uses, with a per-expansion binding scope checked first.
- **MUST NOT:** build this as a parallel engine, and **MUST NOT** overload the document **variable**
  system for it (see §9 — bound picks are ephemeral and local; variables are persistent and global).

This is the **sibling** of `arrays-direction.md`. Arrays add *addressability* to lists (data);
this adds *consistency* to picks (generation). They are different itches, neither blocks the other,
and **this one is the one that delivers the Perchance feel.** Build order between them is a product
call; this doc does not assume one.

---

## 2. The core — consistent (bound) picks

- **Bind:** `{name <op> body}` expands `body` once (any `{…}`-resolvable thing — a rule, table,
  alternation, dice, expression), **emits the result at that spot**, and stores it under `name` in a
  **per-expansion binding scope.** (`<op>` is the open question — see §3.)
- **Reuse:** `{name}` later in the *same expansion* returns the stored result verbatim.
- **Scope is one expansion of one pill.** Bindings do not leak to other pills, to other nodes, or to
  document variables. Clicking the pill to re-roll re-evaluates every binding fresh — so the result
  stays internally consistent on each roll and re-randomizes coherently. (This rides the existing
  "the grammar pill freezes its expansion; click re-generates" behavior — the freeze now just
  includes coherent bindings.)
- **Resolution order for a bare `{name}` becomes:** **binding scope** → named rule/table → document
  variable → `{name?}` unknown marker. (Today it is rule/table → variable → `{name?}`; binding scope
  is prepended.)
- **Use-before-bind is defined, not undefined:** a `{name}` encountered before its binding resolves
  by the *normal* path (rule/var), or `{name?}` if unknown — left-to-right, no look-ahead. Binding is
  a forward operation; referencing an unbound name is never an error, just a normal lookup.

---

## 3. The binding operator — LOCKED: `:=`

The bind operator is **`:=`** (assignment / walrus). Locked after verifying against the source that
it collides with nothing.

**Bind / reuse:**
- **Bind:** `{a := animal}` — picks an animal, prints it, remembers it as `a`.
- **Reuse:** `the {a} returns` — same animal.

**Why `:=` and not the obvious `=`:** a leading `=` inside braces already means *"evaluate as a math
expression"* (`{= 2*r}`). Perchance's own idiom is infix `[a = animal]`; copying it as `{a = animal}`
would make `=` mean **two things by position** inside `{…}` — the context-dependent meaning P1
(Predictable) forbids. `:=` is a *distinct operator for a distinct meaning*: it satisfies **P5** (no
new top-level delimiter — it rides the `{…}` family) **and P1** (new meaning, new non-overloaded
operator) at once.

**Source verification (done — `index.html`):**
- `:=` appears **nowhere** in the file today; it is genuinely free.
- A lone `=` is **not** a math operator — the comparison parser only consumes `=` when the next char
  is also `=` (`==`): `index.html:5123`. Operators are `> < >= <= == !=` only (lines 5122–5124).
- `:` is **only** the ternary separator, consumed solely by `expect(':')` after a `?`
  (`index.html:5140`). A `:` not preceded by `?` is a parse error.
- Therefore `a := b` fails as math (`evalMath` returns `null`), and `{a := …}` is never mistaken for
  `{= expr}` because that sniff keys on `body[0] === '='` (`index.html:3052`, `4531`, `4766`) — here
  `body[0]` is the bound name, not `=`.

**Rejected alternatives (recorded):** `{a = animal}` (P1 overload of `=`); `{a: animal}` (collides
with the `name:` rule-definition syntax in grammar bodies); `->` (taken by Markov `State -> Target`).

**Parser note (carry into the brief):** a binding body may itself be a ternary —
`{x := a>b ? c : d}` — so the binding detector MUST split on the **first `:=`** and hand the
remainder to the existing resolver. This is safe because `:=` (colon-immediately-equals) never occurs
in a well-formed ternary, where `:` is always followed by an operand.

---

## 4. Modifiers — the cheap adjacent sub-track (optional, separable)

Perchance's `a/an`, plural, and capitalize are the other half of the *feel*, and they are the
**cheap** part — a postfix on a reference, resolved as a `resolveBrace` post-step (close to the
"just add a branch" path CLAUDE.md calls free):

- `{animal.cap}` → capitalize · `{animal.a}` → article (`a`/`an` by leading sound) · `{animal.s}` →
  pluralize.
- Composes with binding: `{a := animal}` then `A {a.cap} appears; two {a.s}.`

**Honesty note (P5):** the `.modifier` postfix *is* a small new notation on the reference form. It is
contained (a suffix within `{…}`, not a new delimiter) and low-risk, but it is **not zero** — it
touches the §2/P5 inventory's `{…}` row and MUST land in the `?` panel and `features.md`. Treat
modifiers as a **separable sub-track**: ship bound picks first (the structural win), add modifiers
after as a contained follow-up. They do not block each other.

---

## 5. The engine change (cost — verified against source, lighter than first thought)

The engine **already threads a `ctx` object** (`{ rules, vars, depth, stack }`) through
`expandTemplate` → `resolveBrace` → `expandRule`. The binding scope rides that existing object, so
"threading state" is essentially free — there is no new argument plumbing. Verified:

- **Only two `ctx` construction sites** build the context: `runGrammar` (`index.html:4580`) and
  `expandText` (`index.html:4587`). Add **one field, `binds: {}`**, at both. That is the entire
  scope-creation change.
- **`resolveBrace` (`index.html:4526`) gains two things:** (a) before the `|`-alternation split,
  detect a first-`:=` → expand the right side via `resolveBrace(rhs, ctx)`, store under
  `ctx.binds[name.toLowerCase()]`, emit the value; (b) in the bare-identifier branch, **check
  `ctx.binds` first**, before rules/vars (current order: rule/table → var → `{name?}`).
- **Pure and testable, per the working method.** `binds` lives on `ctx`, so the cores stay pure
  functions of their input. Pin in `tests/test.mjs` **before** any DOM wiring: consistency
  (`{a := …}` then `{a}` returns the same value), use-before-bind (forward ref falls through to
  rule/var), scope isolation between separate expansions, and re-roll coherence.
- **No new cache, no new invalidation point.** `binds` is per-expansion and ephemeral — created
  fresh at each `ctx` site, never persisted — so `markDirty`/`_varsVer` are untouched.

Net: this is close to the "new `resolveBrace` branch" cheap path after all — one ctx field at two
sites, one branch + one lookup-order change in `resolveBrace`, plus tests. The earlier "moderate,
structural" framing was conservative; the source shows the plumbing already exists.

---

## 6. Resolution-path subtlety (read before coding)

A bound pick is **text** (the result of expanding a rule/table/alternation), so binding lives
entirely in the **grammar / `expandText` layer** — the same layer roll-table entries already flow
through. It is **not** an `evalMath` concern (`evalMath` returns numbers). This keeps the existing
split intact: *text through the grammar layer, numbers through `evalMath`, the two tied by
variables.* Bound picks add a third, ephemeral namespace on the **text** side only.

---

## 7. Scope fence — MVP vs deferred

**MVP (the consistency win, nothing more):**
- `{name := body}` bind-and-emit + `{name}` reuse, per-expansion scope, resolution order + 
  use-before-bind as defined in §2.
- Pure cores test-pinned first.

**Named but DEFERRED (do not build on spec):**
- **Modifiers** (§4) — cheap, but a separable follow-up sub-track, not part of the MVP.
- **Silent bind** (bind without emitting at the bind site) — Perchance has a non-printing setup
  form; defer until asked. MVP binds *and* prints.
- **Cross-pill / document-scope bindings** — explicitly **out.** That is the variable system's job;
  conflating them is the §9 rejected path.
- **Conditional / computed binding bodies beyond what `{…}` already resolves** — no new body grammar;
  a binding body is exactly what any `{…}` can already contain.

> **Rule:** moving anything out of the deferred list — or changing the §3 operator after sign-off —
> requires reopening this doc. The MVP adds *consistency*, not a new engine.

---

## 8. Where it slots (roadmap + backlog)

- **Not a phase.** Like `arrays-direction.md`, it is **interleaving material** under `roadmap.md`'s
  *"Interleaving (the balance)"* clause — a contained grammar-engine extension that rides parallel to
  Phase 1's storage design and neither gates nor is gated by the PKM track.
- **`roadmap.md` → "Generative / internal-engine ideas":** add a **consistent (bound) picks** bullet;
  this and the arrays bullet are the two live generative tracks.
- **`backlog.md` → Tier 2:** a short "Consistent picks / Perchance-style generation" entry.
- **`ux-discipline.md`:** **no new inventory row** for bound picks (rides the `{…}` row via the `:=`
  operator). Modifiers, if/when built, add a documented postfix to that same row — `?` panel +
  `features.md` updated in the same change.

---

## 9. Relationship to existing work + rejected alternatives

- **Extends** the unified grammar engine (`runGrammar`/`resolveBrace`/`expandText`) — the engine
  CLAUDE.md already calls "the composition layer." Bound picks are the consistency that layer lacks.
- **Sibling, not substitute, to `arrays-direction.md`.** Arrays = addressable data; bound picks =
  consistent generation. Different itches; build order is open.
- **Closes the actual Perchance gap** — and does it on the existing syntax family, so it answers
  UXP-20 (no third notation) before shipping rather than after.
- **Rejected — overloading document variables.** "A bound pick is just a variable" is tempting and
  wrong: variables are **persistent + document-global** (`collectVars`, cached on `_varsVer`); a
  bound pick is **ephemeral + local to one expansion**. Forcing ephemeral local binding onto the
  global static variable model muddies both. A dedicated per-expansion scope (§5) is the clean line.
- **Rejected — copying `=` infix from Perchance.** Familiar, but it overloads the leading-`=`
  expression meaning by position (P1). `:=` is the predictable choice (§3).
- **Honors** the engineering invariants (`node.text` plain text; grammar layer for text / `evalMath`
  for numbers; pure cores test-pinned first; no new invalidation point).

---

*This is locked direction — the §3 binding operator `:=` is settled and source-verified. Changes —
especially the operator, or moving anything out of §7's deferred list — are deliberate decisions
recorded here, not incidental drift.*
