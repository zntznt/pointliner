# Agent Brief — Random variables (Perchance-style generation, done resiliently)

**Direction:** `guidance/generation-direction.md` (locked, rewritten). Read it first. This brief
implements its v1 (§5). **If anything here conflicts with the direction doc, the direction doc wins.**

**Context:** the earlier per-expansion bound-picks attempt (PR #51) was **reverted** — it was wired
at the engine layer only and the model didn't fit the app. This builds the correct model: a
**variable whose value is a frozen random pick**, declared like a variable, referenced `{name}`
anywhere, re-rolled from its declaration. **Build it whole, end-to-end — a half-wired layer is the
defect we are explicitly avoiding.**

---

## 1. What & why

A **random variable** is an ordinary variable whose value comes from the grammar engine (a
rule/table, `a|b|c` alternation, or dice) instead of a math expression, and is **frozen** until
re-rolled. Declare once → reference `{name}` anywhere → every reference shows the same value → click
the declaration to re-roll → all references update. This is declare-once / call-anywhere, which the
variable system already provides; we are adding a **value type**, not a new concept or syntax.

## 2. Locked decisions (do not redesign)

1. **It is a variable.** Reuse `[[var:key]]` records, `collectVars`, `{name}` reference,
   `globalVarMap`, `renderVarPill`, the picker/panel, OPML round-trip.
2. **Value is frozen on the record.** `collectVars` returns the stored value unchanged every pass.
   The grammar engine runs **only** at declaration and on explicit re-roll — **never** on a
   render/`markDirty` pass.
3. **No new authoring syntax in v1.** Declaration via the variable dialog (new value-type choice);
   reference via the existing `{name}`. No `:=`, no new delimiter. (Inline declaration shorthand is
   deferred — direction §5.)
4. **Pick value is text.** Not usable in math; misuse fails visibly (§5 P4).
5. **Re-roll = whole-variable, global.** One value, all references update together. No per-reference
   re-roll.

## 3. Data model

Extend the var record (`{key, name, expr}`) for the pick case:

- `kind: 'pick'` (math vars are the implicit/`'expr'` default — keep them untouched).
- `expr` (reused field) holds the **grammar source** of the pick (e.g. `dragon|wyrm|drake`,
  `{color} {beast}`, `2d6`). Keeping the source in `expr` means `pruneVars` and the gather pass need
  no key-name changes.
- `rolled` holds the **frozen expansion result** (a string).

Confirm with grep that no other code assumes `vars[].expr` is always a math expression in a way that
breaks for `kind:'pick'` (the only legitimate evaluator of a pick `expr` is the grammar engine, not
`evalMath`).

## 4. Wiring checklist — every layer, or it's not done

Each item cites the function (verify the symbol by grep — line numbers drift). **Tick every box.**

1. **Declaration dialog** — `openVarDialog` (~`5327`): add a value-type selector *Formula | Random
   pick*. On submit for a pick: roll the source once via the grammar engine (`expandText` /
   `runGrammar`) to get `rolled`, store `{key, name, kind:'pick', expr:source, rolled}`, insert the
   `[[var:key]]` declaration token. `editVar` (~`5443`) edits both the source and offers re-roll.
2. **Declaration pill render + re-roll** — `renderVarPill` (~`5197`): for `kind:'pick'`, show
   `$name = <rolled>` from the **frozen `rolled`**, NOT `evalMath(expr)`. Interaction follows the
   §7.2 generative-pill pattern: **body-click re-rolls in place** (re-expand source → new `rolled`
   → `markDirty`), **pencil opens the dialog**. (Math var pills keep their current click=edit
   behavior — diverge only for `kind:'pick'`.) Keyboard operability added **alongside** `mousedown`
   (caret invariant), `aria-label` reflects name + value, re-roll announced via `aria-live`.
3. **Reference `{name}`** — `promoteBraceBody` (~`4762`) bare-identifier branch and the display-only
   path in `renderVarPill` (~`5200`): a `{name}` that resolves to a defined variable already promotes
   to a display-only var pill reading `globalVarMap[name]`. Confirm a pick variable is "defined" by
   that check and that the display branch renders a **string** value (today it `formatMathResult`s a
   number — handle a string value). `checkInlineHighlight`/`braceWouldPromote` (~`4948`): `{name}`
   for a known pick var should highlight as it does for any known var.
4. **Resolution** — `collectVars` (~`982`): in the gather/resolve passes, a `kind:'pick'` declaration
   contributes `resolved[name] = rec.rolled` (the frozen string) **without** calling `evalMath` and
   **without** re-rolling. Math vars keep the lazy `evalMath` proxy path. The returned map (→
   `globalVarMap`) now mixes numbers (math) and strings (pick) — ensure consumers tolerate a string
   (a math var referencing a pick var gets a non-number → resolves to fail, which is the intended
   visible failure, not a crash).
5. **Export** — `flattenArtifacts` (~`6444`/`6471`): a pick var token flattens to its frozen `rolled`
   value (markdown/plain export shows the frozen text).
6. **OPML round-trip** — `toOpml`/`fromOpml`: the `_vars` sidecar is JSON-stringified wholesale, so
   `kind` + `rolled` ride along **only if** serialization doesn't cherry-pick fields. **Verify** the
   record serializes and parses back intact (the `_vars` attribute rule: serialize + parse in the
   same change, or data silently drops).
7. **Prune** — `pruneVars` (~`5231`): unchanged (filters by token presence) — confirm it doesn't drop
   a pick declaration.

## 5. UX conformance (gate — `guidance/ux-definition-of-done.md`)

- **P1:** `{name}` reference behaves exactly like any variable reference; the declaration pill's
  body-click=re-roll / pencil=edit matches the established generative-pill (dice/grammar) interaction
  — predictable, not a new gesture.
- **P2:** declared through the variable dialog (visible front door) with a labeled value-type choice;
  appears in the variable picker + panel; documented in `features.md` + the `?` panel.
- **P3:** declaration pill keyboard-operable via `keydown` **alongside** `mousedown` (caret
  invariant); accurate `aria-label` (`"$name = value"`) updated on re-roll; re-roll announced via the
  `aria-live` region; focus-visible.
- **P4:** re-roll is a visible change; a broken/undefined reference uses the existing `var-undef`
  treatment; a pick value used in a math expression fails **visibly** (non-number marker), never
  silently.
- **P5:** **zero new authoring syntax** — declaration reuses the variable path, reference reuses
  `{name}`. No inventory row added.

**PR-body Conformance Statement** (CI checks for it — no statement, no merge):

```
UX Conformance — Random variables (variable whose value is a frozen random pick)
P1 ✅ {name} = existing var reference; declaration pill re-roll matches dice/grammar pill pattern
P2 ✅ variable dialog value-type choice; shows in var picker/panel; ?-panel + features.md updated
P3 ✅ keydown alongside mousedown; aria-label updated on re-roll; aria-live announce; focus-visible
P4 ✅ re-roll visible; undefined ref → var-undef; pick value in math fails visibly, never silent
P5 ✅ zero new syntax — reuses variable declaration + {name} reference
New non-conformances filed: <UXP-NN | none>
Acceptance tests: pass    Regression: tests green · touch (declaration pill re-roll has touch path) · OPML round-trip
```

## 6. Tests (pin in `tests/test.mjs` BEFORE any DOM wiring)

Add touched cores to the `need` array in `tests/load-cores.mjs`; use seeded RNG
(`seedSequence`/`setRandom`/`resetRandom`):

- **Roll + freeze:** declaring a pick var with a seeded source produces a deterministic `rolled`.
- **Document-wide consistency:** `collectVars` over a tree with one pick declaration and references
  in two nodes returns the **same** frozen value for all references.
- **No re-roll on resolve:** calling `collectVars` repeatedly (no re-roll action) returns the **same**
  value every time (it does not re-expand).
- **Re-roll:** updating `rolled` (simulating a re-roll) and re-resolving yields the new value at every
  reference.
- **Type safety:** a math var referencing a pick var resolves to a visible failure (not a thrown
  error, not a silent 0).
- **Mixed map:** `collectVars` returns numbers for math vars and strings for pick vars in the same
  document without corrupting either.
- **Regression:** existing variable + `evalMath` pins stay green.

Run `node --test tests/test.mjs` before and after; confirm the count only grows.

## 7. Real-path verification gate (the #45/#51 lesson — do this, don't just trust the pins)

In the actual app: declare a random variable via the dialog → reference it in **two different
nodes** → confirm both show the **same** value → **re-roll** from the declaration pill → confirm
**both references update** → **save to OPML and reload** → confirm the value is preserved →
**export to markdown** → confirm the frozen value appears. Tests pin the engine; this proves the
feature.

## 8. Out of scope (do NOT build — direction §5)

- Inline declaration shorthand (`{a := …}`) — deferred; carries a syntax-collision matrix.
- Modifiers (`a/an`, plural, capitalize).
- Using a pick value inside a math expression (it's text).
- Per-reference (non-global) re-roll.
- Deep pick-references-pick dependency chains.

## 9. Process hygiene (carry every time)

- **Branch off real `origin/main`** (post-revert). `git fetch` first; confirm the **test count
  matches current main** before starting. Guidance docs live under `guidance/`.
- **Pure cores → green pins → then DOM.**
- **No committed verification artifacts.** Strip the session footer from the PR body after
  `gh pr create`; keep `includeCoAuthoredBy: false`.
- Emit the §5 Conformance Statement in the PR body. Fix-don't-bypass on hook failure.

---

*Implements `guidance/generation-direction.md` v1. A random variable = an ordinary variable with a
frozen, re-rollable pick value. Wired through every layer in §4, proven on the real path in §7. No
new syntax. The inline declaration shorthand and modifiers are separate, later briefs.*
