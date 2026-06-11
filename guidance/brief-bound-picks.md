# Agent Brief — Consistent (bound) picks in the grammar engine

**Direction:** `guidance/generation-direction.md` (locked). Read it first. This brief implements its
MVP (§7) only. **Build against the direction doc; if anything here conflicts with it, the direction
doc wins.**

---

## 1. What & why

Add **consistent picks** to the `{…}` grammar engine: bind a pick to a name, reuse the *same* result
later in the same expansion. This is the one structural thing Pointliner lacks to generate like
Perchance — today every `{…}` re-rolls fresh, so you can't say "the **dragon** roared; the
**dragon** flew" and get one dragon.

- **Bind:** `{a := animal}` → expands `animal` once, **prints the result**, remembers it as `a`.
- **Reuse:** `the {a} returns` → the same value.

Operator is **`:=`**, locked and source-verified (see direction §3): `:=` appears nowhere today, a
lone `=` is not a math operator (`index.html:5123`), `:` is ternary-only (`index.html:5140`), so
`{a := …}` neither parses as math nor trips the `{= expr}` sniff (`body[0]==='='` at `3052/4531/4766`).

## 2. Locked decisions (do not redesign)

1. **Operator `:=`.** Detect the **first** `:=` in a brace body; left = name, right = body to expand.
2. **Scope = one expansion.** Bindings live on the engine's per-expansion `ctx`, created fresh at
   each top-level expansion. They do **not** leak across pills, nodes, or into document variables.
3. **Resolution order for a bare `{name}`:** `ctx.binds` → named rule/table → document variable →
   `{name?}`. (Binding scope is prepended to the existing order.)
4. **Use-before-bind is normal lookup, never an error.** A `{name}` before its bind resolves by the
   normal path (rule/var) or `{name?}` if unknown. Left-to-right, no look-ahead.
5. **Bind emits the value** at the bind site (no silent-bind form in MVP).
6. **A binding body is just a `{…}` body** — any rule/table/alternation/dice/expression the engine
   already resolves. No new body grammar.

## 3. Engine changes (pure core first — verified line refs)

The `ctx` object (`{ rules, vars, depth, stack }`) is already threaded through
`expandTemplate → resolveBrace → expandRule`, so this is small.

1. **Add `binds: {}` to both `ctx` construction sites:** `runGrammar` (`index.html:4580`) and
   `expandText` (`index.html:4587`). That is the entire scope-creation change.
2. **In `resolveBrace` (`index.html:4526`):**
   - **Before** the `|`-alternation split: scan for the first top-level `:=` (reuse/extend the
     `splitTopLevel` helper used for `|` so a `:=` inside nested braces isn't matched). If found and
     the left side trims to a valid identifier: `const val = resolveBrace(rhs, ctx)`,
     `ctx.binds[name.toLowerCase()] = val`, `return val`. A malformed bind (empty name or empty body)
     falls through to normal handling — **never** a silent no-op (see P4).
   - **In the bare-identifier branch:** check `ctx.binds[name.toLowerCase()]` **first**, before the
     rule/table and variable lookups. If present, return it.
3. **No new cache / no `markDirty` change** — `binds` is ephemeral, created per expansion, never
   persisted. (`CLAUDE.md`: "markDirty() is the single invalidation point" — untouched.)
4. **Re-roll coherence is automatic:** the grammar pill freezes its expansion and re-runs it on
   click; because `binds` is rebuilt each run, each roll is internally consistent and re-randomizes
   coherently. No pill-layer change needed beyond confirming this holds.

## 4. Tests (pin in `tests/test.mjs` BEFORE any DOM wiring)

Per the working method: add the touched cores to the `need` array in `tests/load-cores.mjs` if not
already exposed, then pin with seeded RNG (`seedSequence`/`setRandom`/`resetRandom`):

- **Consistency:** `{a := A|B|C} {a} {a}` → all three occurrences equal the same picked letter.
- **Independence:** two separate names bind independently; re-running the expansion can change both.
- **Use-before-bind:** `{a} {a := x}` → first `{a}` resolves by normal lookup / `{a?}`, second binds.
- **Scope isolation:** a name bound in one `expandText` call is **not** visible in a separate call.
- **Body types:** bind bodies that are a rule, a named table, a `{NdM}` dice term, and a `{= expr}`
  each store and reuse correctly.
- **Ternary body safety:** `{x := a>b ? c : d}` splits on the first `:=` only; the ternary `:`
  inside the body is untouched.
- **No math regression:** existing `{= …}` expressions (incl. ternaries and `==`) still evaluate;
  `evalMath` pins stay green.

Run `node --test tests/test.mjs` before and after. All existing pins stay green.

## 5. UX conformance (clear the gate — `guidance/ux-definition-of-done.md`)

- **P1 Predictable:** `:=` has one meaning everywhere (bind); no context inversion; reuse rides the
  existing identifier-resolution path. Fits the keyboard grammar (no new shortcut).
- **P2 Discoverable:** add `:=` to the **`?` syntax panel** and `guidance/features.md` so the
  reference teaches it (the menu-teaches-syntax floor). It also surfaces in the `{` shorthand
  context like the rest of the grammar family. If a richer affordance (e.g. a menu insert) is not
  built, that is acceptable for the typed power-syntax **only if** the `?`-panel door exists; if any
  P2 gap remains, **file it as a new `UXP-NN`** in `guidance/ux-remediation.md`.
- **P3 Reachable:** no new interactive element; output renders inside the existing grammar pill,
  whose `aria-label` reflects the (now consistent) resolved text. No `mousedown→click` conversions.
- **P4 Responsive:** unknown/forward `{name}` → existing `{name?}` marker (visible, not silent); a
  malformed bind never becomes a silent no-op. No bespoke feedback UI.
- **P5 Coherent:** **zero new top-level delimiter** — rides `{…}`. `:=` is one operator inside the
  family; document it on the existing `{…}` row of the §2/P5 inventory and in the `?` panel. No
  duplicate syntax retired because none overlaps (bound picks are a new capability, not a second way
  to do an existing one).

**Required in the PR body** (CI `ux-conformance.yml` checks for it — no statement, no merge):

```
UX Conformance — Consistent (bound) picks {name := body} in the grammar engine
P1 ✅ one operator, one meaning; no context inversion; reuse uses existing resolution path
P2 ✅ `:=` added to ? syntax panel + features.md; surfaces in { grammar context
P3 ✅ no new interactive element; grammar pill aria-label reflects resolved text
P4 ✅ unknown/forward ref → {name?} marker; malformed bind never silent
P5 ✅ zero new delimiter; rides {…}; documented on the existing inventory row
New non-conformances filed: <UXP-NN | none>
Acceptance tests: pass    Regression: tests green · touch (n/a — no new pointer UI) · OPML (n/a — no new persisted data)
```

## 6. Out of scope (do NOT build — direction §7)

- **Modifiers** (`a/an`, plural, capitalize) — separable follow-up sub-track.
- **Silent bind** (bind without printing) — MVP binds and prints.
- **Cross-pill / document-scope bindings** — that is the variable system; keep bindings ephemeral.
- **Any new binding-body grammar** — a body is exactly what `{…}` already resolves.
- **Array/list addressing** (`[n]`, `len`) — that's the *separate* `arrays-direction.md` track.

## 7. Process hygiene (carry every time)

- **Branch off real `origin/main`.** `git fetch` first; verify the **test count matches current
  main** before starting (the stale-branch trap from PR #42 — a sudden test-count drop means a stale
  base). Guidance docs live under `guidance/`, not `docs/`.
- **No committed verification artifacts** — no scratch files, screenshots, or notes in the PR.
- **Strip the session footer** from the PR description after `gh pr create` (`gh pr edit --body …`);
  keep `includeCoAuthoredBy: false`. No links back to this session.
- **Pure cores → test pins green → then DOM**, per `CLAUDE.md` working method.
- Emit the Conformance Statement above in the PR body; fix-don't-bypass if a hook fails.

---

*Implements `guidance/generation-direction.md` §7 MVP. One field on `ctx` at two sites, one branch +
one lookup-order change in `resolveBrace`, plus the test pins. Modifiers and arrays are separate
briefs.*
