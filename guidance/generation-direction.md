# Pointliner — Perchance-Style Generation via Random Variables (Direction)

## A locked direction and scope fence

This document is the **north star** for Perchance-style generation in Pointliner. It is **binding
direction** — future work (and any AI) MUST build toward this model and MUST NOT re-introduce the
patterns it retires. It is also a **scope fence**: it names the MVP *and* the hard line of what we
build now vs. later.

Read alongside: `CLAUDE.md` ("the two-engine reality" — the grammar engine + the variable system
this extends), `ux-discipline.md` (P5, the closed syntax inventory), `ux-remediation.md` (UXP-20,
the syntax-sprawl guard), `roadmap.md` (the "Generative / internal-engine ideas" list this slots
into).

**Pre-release note:** there is no released data, so **migration is explicitly a non-concern.**

---

## 1. The model (north star)

> Perchance-style generation in Pointliner is **a variable whose value is a random pick.** You
> **declare it once** (like any variable), and **reference it `{name}` anywhere in the document** —
> every reference shows the **same** value, because it's the same variable. Clicking the declaration
> **re-rolls** it, and every reference updates together.

It is not a new concept layered beside variables — it **is** a variable, with one difference: its
value comes from the **grammar engine** (a rule/table/alternation/dice pick) instead of a math
expression, and that value is **frozen** until re-rolled.

- **MUST:** ride the existing variable system — `[[var:key]]` declaration records, `collectVars`
  document-wide resolution (cached on `_varsVer`), the `{name}` reference, `globalVarMap`, the
  variable picker/panel, and OPML round-trip. **Zero new authoring syntax** (see §3).
- **MUST:** the rolled value is **frozen on the record** and returned by `collectVars` unchanged on
  every pass. It is re-rolled **only** by explicit user action (clicking the declaration pill), never
  on a render/`markDirty` pass — otherwise it would change on every keystroke and never be consistent.
- **MUST NOT:** resolve the value through `evalMath` (it returns numbers; a pick value is text).

---

## 2. Why this, and not "bound picks" (the pivot, recorded)

An earlier approach (PR #51, **reverted**) built *per-expansion bound picks* — `{a := body}` storing
into a per-expansion `ctx.binds` scope. It failed for a structural reason worth recording so it isn't
retried:

- Each inline `{…}` promotes to its **own independent, independently-re-rollable pill** with its own
  expansion scope. Two scattered `{a := …}` / `{a}` braces are **two scopes** — the reuse could never
  span them. Consistency only held *within one expansion*, which is not how the user authors.
- The user's requirement is **declare-once / call-anywhere / persistent across the document.** That
  is the definition of a variable. So the resilient home is the variable system, not an ephemeral
  per-expansion scope.
- The `:=` operator also collided with `parseRules` (which splits a grammar line on the first `:`),
  mangling `a := dragon` into the rule `a` = `= dragon`. Dropping the per-expansion model retires
  that collision entirely.

**Consequence:** the value is frozen *per document* (one dragon until you re-roll), not *per
generation*. That is exactly the variable model the user asked for, and it makes consistency
automatic — one stored value, many references.

**A6 (hierarchical / property items, 2026-06-14) rides this, not the reverted bind.** When an item
carries fields (`sword.damage: 1d8`, read as `{weapon.damage}`), the question "are `{item.name}` and
`{item.damage}` the *same* item?" is the **same** consistency problem — and it has the **same locked
answer**: declare a **pick variable** (`w = {weapon}`, frozen to one item), then `{w.name}` /
`{w.damage}` reference that one stored value. A standalone `{weapon.damage}` re-picks independently
(by design). The per-expansion `{a := …}` / `ctx.binds` model **must not be reintroduced** to make
two bare `{weapon.*}` braces agree — that is the reverted pivot above.

---

## 3. Syntax — there is none to add (P5)

This is the cleanest possible P5 outcome: **the MVP introduces no new authoring syntax.**

- **Declare** via the existing variable declaration path (the `@` / variable dialog → an atomic
  `[[var:key]]` declaration pill). The only addition is a **value-type choice** in the dialog:
  *formula* (today's math var) or **random pick** (a grammar source — a rule/table, `a|b|c`
  alternation, or dice).
- **Reference** `{name}` anywhere — the **existing** variable reference. No operator, no new
  delimiter, no parser collision surface.
- The pick's source is itself ordinary grammar (`{…}`-resolvable) content — also nothing new.

The inline declaration shorthand the user originally typed (`{a := dragon}`) is **deferred** (§5),
not part of v1 — it is the *only* place new syntax could enter, and it carries the `:=` / `:` / `=`
collision matrix, so it waits.

---

## 4. Resilience requirements (the heart of this doc)

The reverted attempt was wired at the engine layer only and broke everywhere else. A random variable
ships **only** when it is wired end-to-end and proven on the real path. The implementation brief
enumerates each; the requirements are:

1. **Wired through every layer a variable touches** — declaration dialog, the declaration pill
   (render + **re-roll** interaction), the `{name}` reference (promote + edit-mode highlight),
   `collectVars` resolution, `globalVarMap`, `renderVarPill` (display the frozen value, not an
   `evalMath` of it), markdown/plain export (`flattenArtifacts`), **OPML serialize + parse**, and
   `pruneVars`. A layer left unwired is a defect, not a follow-up.
2. **Frozen value, never a surprise re-roll.** `collectVars` returns the stored value; the grammar
   engine runs only at declaration and on explicit re-roll. Re-roll bumps `markDirty` so all
   references recompute from the new frozen value.
3. **Type-safe and fail-visible.** A pick value is **text**. Referencing it inside a *math*
   expression does not compute — it must fail **visibly** (a marker / non-number display), never
   silently. A broken/undefined reference shows the existing `var-undef` / `{name?}` treatment.
4. **Round-trips.** The record's new fields persist through OPML save **and** reload (add serialize
   *and* parse in the same change — the `_vars` sidecar rule). Verified by an actual save→reload.
5. **Real-path verification gate** (not just engine unit tests — the #45/#51 lesson): declare a
   random variable via the dialog → reference it in **two different nodes** → both show the **same**
   value → re-roll from the declaration → **both update** → **OPML save + reload** preserves it →
   **markdown export** emits the frozen value.
6. **Pure cores first.** The roll/resolve logic is a pure function (seeded RNG), pinned in
   `tests/test.mjs` before any DOM wiring.

---

## 5. Scope fence — v1 vs deferred

**v1 (the declare-once / call-anywhere random variable):**
- Declared via the variable dialog with a **random-pick** value type (grammar source: rule/table,
  `a|b|c`, or dice).
- Value rolled once and **frozen** on the record; returned by `collectVars` document-wide.
- Referenced `{name}` anywhere (existing variable reference).
- **Re-roll** from the declaration pill (body-click re-rolls in place; pencil edits — the §7.2
  generative-pill interaction).
- Full round-trip + the §4 verification gate.

**Status update (2026-06-29):**
- **Inline declaration shorthand `{name := expr}` — SHIPPED (Stage A).** The typed twin of the
  variable dialog: `{name := expr}` promotes to the same `[[var:key]]` declaration record, formula
  or random-pick inferred from the RHS, unfolds back to editable `{name := expr}` on edit
  (keyboard-only), with a ripple warning on value change / orphaning rename. `:=` is sniffed before
  the `:`-splitting paths, so the `parseRules` collision §2 warned about does not occur. It does NOT
  reintroduce the per-expansion `ctx.binds` model — it writes to the persistent variable system. See
  `guidance/typed-var-declaration-proposal.md`.
- **Positional/lexical resolution `{name}` = nearest declaration above — Stage B, NOT yet built.**
  Approved in the proposal but deferred to its own PR (it changes the variable model and reshapes the
  shared `collectVars` bus). Stage A keeps today's global last-wins resolution.

**Still DEFERRED (do not build on spec):**
- **Modifiers** (`a/an`, plural, capitalize) on a reference — a separable follow-up.
- **Using a pick value in math** — out; pick values are text.
- **Per-reference (non-global) re-roll** — out; the model is one value, all references update together.
- **Random variables referencing other random variables** in deep chains — keep v1 to a pick whose
  source resolves through the grammar engine once; defer complex inter-pick dependency.

> **Rule:** moving anything out of the deferred list reopens this doc. The MVP adds a *value type* to
> variables, not a new engine or syntax.

---

## 6. Where it slots (roadmap + backlog)

- **Not a phase.** Interleaving material under `roadmap.md`'s *"Interleaving (the balance)"* clause —
  a contained extension that rides parallel to the PKM phases.
- **`roadmap.md` → "Generative / internal-engine ideas":** a **random variables** bullet.
- **`backlog.md` → Tier 2:** a "Random variables (Perchance-style generation)" entry.
- **`ux-discipline.md`:** **no new inventory row** — declaration reuses the variable path, reference
  reuses `{name}`. Only `features.md` + the `?` panel gain the new value-type documentation.

---

## 7. Relationship to existing work

- **Extends** the variable system (`collectVars`, `[[var:key]]`, `{name}`, `globalVarMap`,
  `renderVarPill`, the picker/panel) — the document-wide, cached, persisted, discoverable machinery
  is exactly what "declare once, call anywhere" needs.
- **Uses** the grammar engine (`runGrammar`/`expandText`) to produce the pick — the freeze pattern
  mirrors how dice/grammar pills already freeze rolled state and re-generate on click.
- **Supersedes** the reverted per-expansion bound-picks model (`:=` / `ctx.binds`, PR #51) — see §2.
  That approach is retired; do not reintroduce it.
- **Honors** the engineering invariants (`node.text` plain text; `collectVars` document-wide + cached
  on `_varsVer`; `markDirty` the single invalidation point; keyboard added alongside `mousedown`;
  pure cores test-pinned first).

---

*This is locked direction. The model is: a variable whose value is a frozen random pick — declared
like a variable, referenced `{name}` anywhere, re-rolled from its declaration. Changes — especially
un-deferring the inline `{…}` declaration shorthand, or weakening the §4 resilience requirements —
are deliberate decisions recorded here, not incidental drift.*
