# Proposal: typed inline variable declaration

**Status:** approved. **Stage A (typed `:=` declaration + unfold-edit + ripple warning) is
SHIPPED** , see §8. **Stage B (positional resolution, §9) is NOT yet built** , it remains a
future PR. The `generation-direction.md` §5 deferral is updated accordingly.

**Problem (user-reported).** Every generator family has a typed path: you type `{2d6}`,
`{= 3*7}`, `{a|b}`, and it promotes to a pill on blur. **Variables are the exception** ,
the only way to *declare* one is the `@` , Variable dialog. So there is no way to declare
a variable by typing, the way you declare everything else. (The dialog is keyboard-
reachable via `@`, so this is a coherence gap, not a total keyboard lockout, but it is the
one family that breaks the "just type it" model.)

This closes that gap with the smallest syntax addition that survives the collision matrix.

---

## 1. What this is NOT (the PR #51 landmine)

`generation-direction.md` §2 records a reverted attempt (PR #51) and forbids repeating it.
That attempt built **per-expansion bound picks**: `{a := body}` wrote into an ephemeral
`ctx.binds` scope local to one expansion, so two scattered `{a := …}` braces were two
scopes and never agreed. **This proposal does not touch that model.**

A typed declaration here is **pure sugar for the existing persistent variable system**: it
produces the *same* `[[var:key]]` declaration record the dialog produces, frozen per
document, resolved by `collectVars` / `globalVarMap`, re-rollable from the pill. It writes
to `node.vars`, never to a per-expansion scope. If it cannot be expressed as "what the
dialog already does, typed," it is out of scope.

This is the distinction the doc itself draws (§2): "the resilient home is the variable
system, not an ephemeral per-expansion scope." This proposal is declare-once / call-
anywhere / persistent , a variable , by construction.

---

## 2. The operator decision: `:=`

Three candidates, judged against the real parser (`classifyBraceBody`, `promoteBraceBody`,
`parseRules` in `index.html`).

| Form | Collision | Verdict |
|---|---|---|
| `{name = expr}` | `=` is *already* the math sigil (`{= expr}`). A bare `=` mid-body is ambiguous against a future "expression starting with a comparison" and reads as a typo of `{= …}`. High confusion surface. | **Reject** |
| `{name : expr}` | A single `:` is exactly what `parseRules` splits on (`line.indexOf(':')`), and what `cond:`/`shuffle:`/`3x:` use. `{name: expr}` is indistinguishable from a grammar rule line. | **Reject** |
| **`{name := expr}`** | `:=` is a **two-char operator that appears nowhere** in the current brace grammar. It is the mathematical/Pascal assignment operator (reads as "is defined as"). It does not collide *if sniffed before the `:`-splitting paths*. | **Accept** |

`:=` is also the exact form the user originally typed (per `generation-direction.md` §5) and
the form the prior revert used , so it carries no relearning cost. The revert's problem was
the **scope model**, not the operator; `generation-direction.md` §2 says the `:` collision
"mangling `a := dragon` into the rule `a` = `= dragon`" is retired by *dropping the per-
expansion model*, which we have. The operator is reusable; the broken semantics are not.

---

## 3. Where it slots in the classifier (precedence is load-bearing)

`classifyBraceBody` / `promoteBraceBody` test brace bodies in a fixed order. The `:=`
declaration must be detected **first, immediately after the `{= }` math check**, so it can
never be misread by a downstream branch:

```
1. body[0] === '='              -> {= expr}  math            (unchanged, first)
2. NEW: /^[a-z_]\w* := /.test    -> {name := expr} VAR DECL   (new, second)
3. condParts / seqParts / ...    -> grammar artifacts        (unchanged, after)
```

Detection rule (precise, to avoid false positives on prose):

- Match `^([a-z_][\w]*)\s*:=\s*(.+)$` on the trimmed body. The name is the existing
  variable-name charset (same as the `{name}` reference and the dialog's name field). The
  RHS is non-empty.
- The RHS is **ordinary grammar/expr content** , exactly what the dialog's value field
  accepts today: a `{= expr}`-style formula (without the braces), or a random-pick source
  (`a|b|c`, a `{rule}`, dice). It routes through the **same `makeVar` / value-type logic the
  dialog uses** , no new evaluation path.
- A body that has no `:=`, or whose name fails the charset, falls straight through to the
  existing branches , prose like `{run := the show}`-shaped text only promotes if the name
  is a valid identifier, otherwise stays literal (the escape-hatch rule is preserved).

Because `:=` is checked before any `:`-splitting path, the `parseRules` collision the doc
warns about **cannot occur**: a body containing `:=` is claimed as a declaration and never
reaches `parseRules`.

---

## 4. Behavior (identical to a dialog-declared variable)

`{r := 5}` and `{beast := dragon|wyrm}` produce the **same record** the dialog produces:

- A `[[var:key]]` declaration pill in `node.text` + a `node.vars` sidecar entry
  (`{ key, name, expr }`), the atomic-pill treatment for declarations.
- A formula var (`r := 5`) resolves live via `evalMath`/`collectVars`. A random-pick var
  (`beast := dragon|wyrm`) rolls **once, frozen** on the record, re-rolled only from the
  pill (the §7.2 generative-pill interaction). This is the v1 random-variable behavior
  `generation-direction.md` §5 already shipped , the typed form is just a second front door
  to it.
- `{name}` references it anywhere , the existing reference path, unchanged.
- Edit: a *typed* `:=` declaration **unfolds back to `{name := expr}` editable text** (so
  the whole declare/edit loop is keyboard-only, no dialog), and a value change **warns at
  commit** when references exist. This is the resolved O1 (§7) , safe because the name lives
  in the text, so re-promotion never loses it. (Dialog-declared vars, which have no `:=`
  text, stay atomic as today.)

No new resolution, render, or export code , it reuses every layer the dialog path already
wired.

---

## 5. Verification gate (mandatory, the #45/#51 lesson)

`generation-direction.md` §4 requires end-to-end proof before a variable feature ships.
**This gate is for Stage A** (typed declaration under today's global last-wins model , the
"both references show the same value" cases below assume that model). Stage B (positional
resolution, §9) adds its own gate: two declarations of one name with references between and
after them, each reference reading its nearest-preceding declaration, surviving save+reload.

Stage A must pass the **same** gate as the dialog var, plus its own parse cases:

1. **Pure core first.** A `parseVarDecl(body)` pure function (`{name, expr}` or `null`),
   pinned in `tests/test.mjs` before any DOM wiring, including the negative cases: no `:=`,
   bad name, empty RHS, `:=` inside a larger expression, a `:` rule line that must STILL
   parse as a rule.
2. **Real-path, in the running app:** type `{gold := 50}` , it promotes to a var pill ,
   reference `{gold}` in **two different nodes** , both show 50 , type `{gold := 75}` on
   the original (or edit) , both update , **OPML save + reload** preserves it , **markdown
   export** emits the frozen value.
3. **Random pick:** `{beast := dragon|wyrm}` , frozen to one , referenced in two nodes
   agree , re-roll from the pill updates both , round-trips.
4. **No regression:** a grammar **rule line** `weapon: sword | axe` still parses as a rule
   (the `:=` sniff must not eat single-`:` lines); the `{= expr}` math path is untouched.
5. **Unfold + edit, keyboard-only:** focus the var pill , it unfolds to `{gold := 50}`
   editable text , change to `{gold := 75}` with the keyboard , blur , it re-promotes with
   the name intact (no dialog touched at any point).
6. **Ripple warning fires correctly:** with `{gold}` referenced in 4 nodes, a value edit
   surfaces the "4 references updated" notice on commit (not per keystroke), and only when
   the value actually changed; a value edit with **zero** references is silent; a **rename**
   `{gold := …}` , `{wealth := …}` surfaces the louder orphan warning (O1a).

## 6. P5 accounting (the syntax-budget honesty)

This **does** add to the closed brace inventory , `generation-direction.md` §3 is explicit
that inline declaration is "the *only* place new syntax could enter." This proposal accepts
that cost with eyes open:

- It adds **one operator** (`:=`), reusing the existing variable name charset and the
  existing RHS grammar. No new delimiter, no new pill type, no new evaluation path.
- It **retires nothing** (there is no overlapping syntax to replace) , so under the P5
  rule it must be justified as a *net add*. The justification: it removes the single
  coherence exception in the generator family (every other generator is typeable; this
  makes variables typeable too), and it is the form users already reach for.
- If accepted, the `ux-discipline.md` syntax inventory **Grammar engine** row gains
  `{name := expr}`, and `generation-direction.md` §5 moves it from *deferred* to *shipped*.

---

## 7. Resolved decisions and open questions

### O1 , unfold-on-edit, with a commit-time ripple warning (RESOLVED, owner 2026-06-29)

**Decision: a typed `:=` declaration unfolds back to `{name := expr}` editable text on
edit (no dialog), AND a value change warns at commit when it has references.** Keyboard-
only authoring end-to-end was the whole point of the request, so the edit path must also be
keyboard-only , routing edit through the mouse-driven dialog would reintroduce the exact gap
this feature closes.

**Why unfolding is safe here (the three-treatment exception).** The rule keeps *named*
declarations atomic because re-promotion is anonymous and would lose the doc-wide name. But
`{name := expr}` **carries the name in its own text** , re-promoting the unfolded text
re-parses `name` verbatim, so nothing is lost. This is the same reason node links `[[#id|x]]`
are plain editable text (treatment 3 in `CLAUDE.md`): the token *is* the config. A `:=`
declaration is the first var-declaration that qualifies for treatment 3, precisely because
it is self-describing. (Dialog-declared vars stay atomic , they have no `:=` text to unfold
to; only typed ones unfold.)

**The ripple warning (your "you're about to change N things").** Changing a declaration's
value bumps `markDirty` , `_varsVer`, so **every `{name}` reference recomputes** (§4.2). That
is the surprise to guard. Design:

- **Fires at commit, not per keystroke.** While unfolded you type freely; the check runs on
  refold/blur (`refoldArtifacts`/`exitEdit`), and only when the **value actually changed**
  *and* the name has ≥1 reference elsewhere. No modal while typing.
- **Counts references cheaply** via a `collectVars`-style token-gated walk (cached on
  `_varsVer`) , the same machinery `renderVarPill`/backlinks already use; no new index.
- **Reuses the existing confirm/feedback pattern**, not a bespoke dialog. For a low count, an
  inline/`aria-live` notice ("Updated gold , 4 points that reference it now show 75") is
  enough and is *non-blocking* (the change already happened, this is an announcement, which
  also satisfies P4's "off-focus changes announced"). For a destructive-feeling jump, the
  §7.2 toast-confirm pattern (`openConfirmDialog`) can gate it , **O1a below** is the one sub-
  decision left: announce-after vs confirm-before.
- **Renaming** (editing the `name`, not the value) is the sharper case: `{gold := …}` ,
  `{wealth := …}` orphans every `{gold}` reference (they become undefined, the existing
  `{name?}`/`var-undef` treatment). The warning must distinguish *value change* (references
  update) from *name change* (references break) , the latter is the louder warning.

**O1a , RESOLVED (owner 2026-06-29): value change announces after; rename confirms before.**
- **Value change** (`gold := 50` , `gold := 75`): **announce-after**, non-blocking. The edit
  stands; a live `aria-live` notice states the impact ("Updated gold , 4 references now show
  75"). It is a propagated value, not data loss, and a modal on every value edit would fight
  the keyboard-fluid intent.
- **Rename** (`gold := …` , `wealth := …`): **confirm-before**, because it silently orphans
  every `{gold}` reference (they go undefined). The confirm **must be keyboard-solvable**:
  `openConfirmDialog` already traps focus, defaults a button, and resolves on Enter/Escape
  (the same dialog the rest of the app uses) , so confirming/cancelling a rename never needs
  the mouse. Message names the cost: "Rename gold , wealth? 4 references to gold will become
  undefined."

### O2 , formula vs pick inferred from the RHS (RESOLVED, owner 2026-06-29)

No explicit type toggle in the typed form. Infer, matching how `{= }` vs `{a|b}` already
self-classify: an `evalMath`-able / numeric RHS , **formula** var; an `a|b|c` / `{rule}` /
dice RHS , **random pick** (rolled once, frozen). The dialog keeps its explicit toggle; the
typed form trusts the same classifier the rest of the brace grammar uses. An RHS that is
neither resolvable as math nor as a pick source fails visibly (the `var-undef` / invalid
treatment), never silently.

### O3 , positional (lexical) resolution: a {name} call reads the nearest declaration above it (RESOLVED, owner 2026-06-29)

**Decision , this CHANGES the variable model, accepted with eyes open.** A `{name}`
reference resolves to the value of the **last declaration of `name` that precedes it in
document (depth-first) order**, not a single document-wide value. Redeclaring later does not
retroactively change earlier calls; calls after the new declaration get the newer value.

```
{x := 5}   {x}->5   {x := 9}   {x}->9
           ^ reads the decl above it (5)      ^ reads the decl above it (9)
```

This supersedes the current model (`collectVars` builds ONE global map, **last declaration
wins document-wide**, earlier ones shown `.var-shadowed` / struck-through). Under O3 there is
no single winner , each *reference* binds to its nearest-preceding declaration, and a name
can legitimately hold different values at different points in the document.

**This is the largest change in the proposal. Its cost and requirements are §9.**

## 8. Recommendation , ship in two stages

The accepted decisions split cleanly into two efforts of very different size and risk. **Do
them as two PRs, in order**, not one.

**Stage A , typed `:=` declaration + unfold-edit + ripple warning (small, low risk).**
The `:=` operator, the classifier slot, promote + unfold-on-edit, the announce/confirm
warning. This is "the dialog's behavior, typed, plus a keyboard edit loop." It does **not**
touch resolution semantics , it still uses today's global last-wins map. Build order: pure
`parseVarDecl` + tests , classifier slot , promote/unfold path , warning , real-path
verification , inventory + doc update. **This alone closes the reported keyboard gap** and is
shippable on its own.

**Stage B , positional resolution (large, redefines the model).** O3 changes what a variable
*is* in Pointliner, and reshapes the shared `collectVars`/`globalVarMap` "bus" that math,
dice modifiers, grammar weights, and table formulas all read. It is worth doing because you
asked for it, but it must not be smuggled in under Stage A. Its cost, the affected layers,
and the new invariants are §9. Gate it behind its own design sign-off after Stage A ships and
you have lived with typed declaration.

Stage A is recommended for immediate implementation. Stage B is recommended as the *next*
design pass, with §9 as its starting brief.

---

## 9. Stage B , what positional resolution costs (the honest blast radius)

Today, `{name}` resolves through **one** document-wide value: `collectVars` returns a flat
map, `globalVarMap[name]`, read at render by `renderVarPill`, and by `evalMath`/`parseDice`/
grammar-weights/`#+TBLFM` via the same `vars` map. The brief calls this shared map the
"universal bus , the real moat." **Positional resolution reshapes that bus.** Concretely:

1. **Resolution becomes position-aware.** A reference can no longer be resolved by name
   alone; it needs "which declarations precede *this* reference in document order." `gather`
   already walks depth-first, so the *order* exists , but the output can no longer be a single
   `{name: value}` map. It becomes either: (a) an ordered list of `(position, name, value)`
   declarations + a resolver that, given a reference's position, finds the nearest-preceding;
   or (b) a per-reference resolved value computed during the tree walk. (a) is likely cleaner
   and keeps caching on `_varsVer`.
2. **Every consumer of `vars` must pass position.** `renderVarPill`, `renderMathPill`,
   `parseDice` modifiers, grammar `{= }` weights, and `#+TBLFM` all currently take the flat
   `vars`. Each call site that resolves a `{name}` now needs the reference's document
   position. This is the wide part of the change , the bus signature changes.
3. **"Declare-once / call-anywhere" (generation-direction.md §2) is explicitly revised.**
   That invariant , the stated point of the variable system , is replaced by lexical scope.
   The doc must be updated to record the new model and *why* (you chose position-dependence
   deliberately). This is a P5-adjacent semantic decision, not just code.
4. **The shadowing UI changes meaning.** `.var-shadowed` (dimmed/struck) currently marks
   "a later declaration overrides this everywhere." Under O3 an earlier declaration is **not**
   dead , it governs the references between it and the next declaration. So `.var-shadowed`
   either retires or is redefined to "no references fall in this declaration's range."
5. **Moving a point can change its `{x}`.** Reordering/indenting a point changes document
   order, so a reference can bind to a different declaration after a move. This is inherent to
   positional scope and must be *intended and documented*, not a surprise. (It is the trade
   you accepted for lexical power.)
6. **Re-roll ripple narrows.** Re-rolling a random pick declaration updates only the
   references **in its range** (between it and the next declaration of the name), not every
   reference document-wide. The warning (O1a) counts in-range references, not all.
7. **OPML round-trip is unaffected by O3 itself** (declarations already serialize in document
   order via the tree), but the verification gate must add: two declarations of the same name
   with references between/after them , save , reload , each reference still reads its
   nearest-preceding declaration.

None of this is a blocker; it is a *scope honesty* note. Stage B is a real feature with a
real cost, and it changes a load-bearing invariant , which is exactly why it is its own PR
with its own sign-off, not a rider on the typing-shortcut.
