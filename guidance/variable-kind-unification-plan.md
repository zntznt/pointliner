# Variable-kind unification (#1353) — measured plan

**Status: Proposed.** Nothing built. Every table below is driven against `3230eea`, one fresh page per
Status: **Shipped** (2026-08). #1353 phases 1, 2 and 3 all landed; §§11-13 of this document record each one, and §13 concludes "#1353 is now complete on the evidence". Kept as the measured record of how it was arrived at.

row, through the real editor.

---

## 0. Why this doc leads with measurement

#1353 describes a kind-wall and proposes a rearchitecture: unify capture, `resolveVarDefs`, the
`evalMath` `ident()` boundary, the #952 distribution lane, and the OPML `kind`/`rolled`/`seed`
serialization. Before designing against that, the wall was measured. **It is not the shape the issue
describes**, and the difference changes what is worth building.

---

## 1. The wall, driven

Declare `cost` five ways, then use it five ways. What renders:

| kind (`{cost := …}`) | `{cost}` | `{= cost}` | `{= cost * 2}` | `{cost > 5: y \| n}` | `{= percentile(cost, 90)}` |
|---|---|---|---|---|---|
| `40` (formula) | `40` | `40` | `80` | `y` | **raw text** |
| `1d20` (pick, numeric) | `5` | `5` | `10` | `n` | **raw text** |
| `warm \| cool` (pick, text) | `warm` | **raw text** | **raw text** | `can't tell yet` | **raw text** |
| `100 to 200` (distribution) | `≈145.2 (99.6 – 197.8)` + sparkline | **raw text** | **raw text** | `can't tell yet` | `185.28` |
| `2d6 vs 2d6` (contest) | `-5` | `-5` | `-10` | `n` | **raw text** |

### What this corrects in the issue

- **"a text pick … throws a bare `#ERR` in arithmetic"** — it does not. It **stays raw text**. That is
  a silent refusal, not a loud one, and it is a materially different defect.
- **Three kinds are already fully unified.** Formula, numeric pick and contest compose identically
  everywhere a number is legal. There is no wall between them. The issue's three-bridge framing
  describes the *implementation*, not the *behaviour*.
- **The contest already resolves to a numeric margin** and needs nothing.

So the real wall is two-sided and narrow: **text where a number is required**, and **a distribution
where a scalar is required** (plus its mirror, a scalar where a distribution is required).

---

## 2. The reason already exists. The surface does not show it.

Every failing cell above has a precise reason code, and `mathReasonPhrase` already has a written
sentence for each. Driven, here is what the user is actually shown:

| case | reason code | what the surface says |
|---|---|---|
| unknown name in math | `bad ref` | ✅ the full `.brace-attempt` teaching sentence (#1159) |
| text pick in a **conditional** | — | ✅ *"a value that is not a number (a word or random pick can't be used in math)"* |
| **text pick in math** | `non-numeric` | ❌ generic *"Not recognized, so it stays plain text"* |
| **distribution in math** | `estimate` | ❌ generic *"Not recognized, so it stays plain text"* |
| **`percentile()` on a number** | `not-uncertain` | ❌ generic *"Not recognized, so it stays plain text"* |
| **distribution in a conditional** | `bad ref` (wrong code) | ❌ **nothing at all** — no explained element |

`mathReasonPhrase` already carries, verbatim:

- `non-numeric` → *"a value that is not a number (a word or random pick can't be used in math)"*
- `estimate` → *"…works on its own but not inside a math formula or check. Write it without the `=` to keep it an estimate, like `{cost * 2}`"* (#1127)
- `not-uncertain` → *"…percentile() and chanceover() only work on a variable declared as a range, like cost := 100 to 200"* (#1101)

**This is the session's recurring shape at architectural scale: the capability, the diagnosis and the
copy all exist, and the surface shows a generic sentence instead.** #1353's own stated goal — *"rejected
loudly and with a reason … never a bare `#ERR` and never by silent kind-routing"* — is reachable
without touching capture, `resolveVarDefs`, the #952 lane, or OPML.

---

## 3. Staged plan

### Phase 1 — make the wall speak (small, near-zero risk) **← recommended first**

Route a `{= …}` body that fails for a **known** reason to the specific sentence instead of the generic
one, and give the distribution-in-conditional case a reason at all.

- The `{= }` promotion path returns `null` for `non-numeric` / `estimate` / `not-uncertain`, so the
  body falls to the generic invalid marker. It should carry `braceAttemptReason`, exactly as the
  `bad ref` case already does.
- `mathErrorReason` returns `bad ref` for a distribution inside a conditional. That is simply the
  wrong code — the name resolves, it just holds a range. It should return `estimate`.
- No new syntax, no new copy to invent (all three sentences exist), no change to what promotes.

**Delivers the issue's stated goal.** Does not change a single evaluation result.

### Phase 2 — the one genuine capability gap: a distribution in a conditional

`{cost > 5: tense | calm}` on a range is currently unanswerable, and that is a real question a user
would ask. It needs a **semantic decision before any code**, and the options are not equivalent:

| option | `{cost > 150: …}` on `100 to 200` means | cost |
|---|---|---|
| compare the mean | one deterministic answer | cheap, but hides the uncertainty the feature exists to model |
| probability threshold | *"more likely than not"* | needs a stated rule; `chanceover` already computes it |
| refuse, and teach `chanceover` | Phase 1's message, plus a worked form | free; arguably correct |

**My recommendation is the third** — but see §7/A2: the form it would teach **does not work today**,
so Phase 2 is *prerequisite work*, not a message. The conditional must first expand the distribution
reducers the way `{= }` does, and only then may any cue name that form. I recommended teaching a
broken remedy; the adversarial pass caught it.

### Phase 3 — capture UX, and what is NOT unifiable

The issue's deepest goal is *"capture is uniform: `{x := }` stores a resolved value without the author
thinking about kind."* Two honest limits, both of which should be recorded rather than engineered
around:

- **Text is not a number and never will be.** `{tone := warm | cool}` cannot participate in
  arithmetic under any unification. The correct outcome is the good refusal, which is Phase 1.
- **A distribution is not a scalar.** #952's correlated-draw semantics are the *value* of the feature;
  collapsing a range to a number at the `evalMath` boundary would silently discard it.

What genuinely remains is the **authoring** half: the author currently picks a kind implicitly by what
they type, and `varDeclKind`'s sniff is invisible. A real Phase 3 is a capture door that shows which
kind was inferred and lets it be changed — which is a Guided-mode/dialog change, **not** a change to
`resolveVarDefs`, the OPML format, or the evaluation lanes.

**On that reading, the rearchitecture described in #1353 is not required to reach any of its own stated
goals.** That claim is falsifiable and should be argued with, not assumed.

---

## 4. Files, if Phase 1 proceeds

- `index.html` — `mathErrorReason` (the distribution-in-conditional code), and the `{= }` refusal path
  so a known reason reaches `braceAttemptReason` instead of the generic marker. Both are existing
  functions; no new core is expected.
- `tests/test.mjs` — a pure pin per reason code, and a **call-site** pin that the surface receives the
  specific sentence. (Three times this session I have pinned a value's computation without pinning its
  use; this plan names that in advance.)
- No `load-cores.mjs` change expected — `mathErrorReason`, `mathReasonPhrase` and `braceAttemptReason`
  are already in `need`. Confirm rather than assume.

## 5. Verification

- The six-row table in §2 is the acceptance test: every ❌ becomes the specific sentence, driven in a
  browser, because a source-pin cannot show what a tooltip says.
- The §1 matrix must be **byte-identical** afterwards. Phase 1 changes no evaluation result; if any
  cell moves, the change is wrong.
- Existing copy locks on `mathReasonPhrase` (#1127's `/100 to 200/`, #1159's scope sentence, the
  em-dash loop) must stay green untouched.
- Guard-proof by mutation, each asserting its target present first.

## 6. Open question for the owner

Phase 2's semantic call — **refuse and teach `chanceover`**, versus answering a conditional on a
distribution by probability. Everything else in this plan follows from evidence; that one is a product
decision about what a range *means* in a yes/no test, and it should be made deliberately rather than
discovered in a diff.

---

## 7. Adversarial pass (2026-08-04) — one claim survived, one was refuted

Each attack below tried to **refute** something this plan asserts. Two changed it.

### A1 — Phase 1's honesty. SURVIVED.

Phase 1 shows a message telling the reader to "write it without the `=`". If that remedy did not work,
the message would be the very defect this session has spent its time removing. Driven:

```
{cost := 100 to 200}  +  {cost * 1.2}   ->  ≈172.6 (119.1 – 240.2) ▃▄▇█▇▅▄▃▂▂▁   WORKS
{cost := 100 to 200}  +  {2 * cost}     ->  ≈290.1 (195.8 – 394.3) ▃▄▆▇█▆▅▄▃▂▁   WORKS
```

Phase 1 stands.

### A2 — my Phase 2 recommendation. **REFUTED.**

§3 recommended refusing a distribution in a conditional and teaching
`{chanceover(cost, 150) > 50: likely | unlikely}` instead. Driven in the real editor:

```
D  {cost := 100 to 200}                                -> ≈143.6 (96.9 – 201.6) ▃▅▇██▇▄▃▂▂▁
u  {chanceover(cost, 150) > 50: likely | unlikely}     -> "can't tell yet"
```

**The form I recommended teaching does not work.** `{= chanceover(cost, 150)}` on its own resolves
fine (`41.3`), so the reducer works; the CONDITIONAL cannot resolve it. Recommending it would have
shipped exactly the defect #1159 and #1357 were about: a cue naming a remedy that does nothing.

**Phase 2 is therefore reordered.** Before any message teaches that form, the conditional must expand
the distribution reducers the way `{= }` already does through `expandAggExpr`. That is a small, precise
change with a clear precedent (#1356 widened the same arm's *scope*; this widens its *expander*), and
it is a prerequisite, not an alternative.

### A3 — "text is not a number and never will be". SURVIVED, but narrower than written.

Text cannot enter arithmetic, which is correct. But text **comparison** in a conditional already works
and needed no unification:

```
{tone := warm | cool}  +  {tone == "warm": y | n}  ->  n     (tone rolled "cool")
```

So §3's Phase 3 must not claim text comparison as missing. It is shipped.

### A4 — a harness lesson, recorded so it is not repeated

Driving the same input six times gave **3 refused / 3 worked** for `{cost := 1d20}` + `{= cost * 2}`,
which read exactly like a real race in promotion order. It was not. Re-run with the keystroke timing
removed — build the tree, promote the declaration, then promote the use — it is **deterministic and
correct**. The non-determinism was my own harness typing the second row before the first had
committed. A driven result that varies run to run is a fact about the harness until proven otherwise.

Second lesson from the same pass: my controlled probe asked whether the use **promoted**, and A2
promoted while displaying "can't tell yet". **Promoted is not the same as works**, and a probe that
checks the former while reporting the latter is a vacuous test in a new costume.

### A5 — an unrelated bug the pass turned up

`{cost := 1 | 2 | 3}` renders as **`cost=`** — an empty value — and the record is
`{kind:'pick', expr:'1 | 2 | 3', rolled:''}`. Confirmed twice: controlled, and typed in the real
editor. `warm | cool` works, `x1 | x2` works, `10 | 20` fails. The tell is that a trailing bare number
is being read as an alternation **weight**: `parseAlt('1 | 2 | 3')` returns
`{template: "1 | 2 |", weight: 3}`.

**A pick between numbers is a completely natural thing to write in this app**, and it silently produces
nothing. Filed as **#1378**; it is not part of #1353 and should not wait for it.

---

## 8. Adversarial pass, round 2 — Phase 1 was too small, and one claim strengthened

### B2 — **Phase 1 as written would have been hover-only. REFUTED.**

Phase 1 routes the specific reason into `braceAttemptReason`, which lands in a `title`. **#1199
established that a `title` on a non-focusable span is hover-only and effectively unreachable.** What is
actually *said* when a distribution meets math, captured through a `flashHint`/`announce` spy:

```
announce: "Not recognized, so it stays plain text"
```

The transient announcement — the thing a reader actually receives — carries the **generic** sentence.
Fixing only the tooltip would deliver teaching nobody sees, which is #1199's defect wearing this
issue's clothes.

**Phase 1 must fix the announce, not just the title.** That is the "low-risk half" identified earlier
in this session and never built.

### B3 — a third surface the plan omitted, and the headline claim survives

A **check** is numeric-only and has no "drop the `=`" escape, so it looked like a case no message could
fix. Driven:

| check | verdict |
|---|---|
| `cost <= 150` where `cost := 100 to 200` | **error** (no reason surfaced) |
| `cost <= 150` where `cost := 140` | pass |
| `tone <= 150` where `tone := warm \| cool` | **error** |
| `percentile(cost, 90) <= 150` on the same range | **fail** — works |

So a remedy **does** exist for checks (`percentile` / `chanceover` already resolve there); it is simply
never taught. The headline claim survives — but **Phase 1 covers three surfaces, not two**: `{= }`, the
conditional, and the check.

### B4 — capture really is the remainder, and it is worse than described

`varDeclKind`'s sniff, driven:

| RHS | kind |
|---|---|
| `5` | formula |
| `1d20` | pick |
| `100 to 200` | dist |
| `warm \| cool` | pick |
| **`2 to 3 people`** | **pick** |
| **`1 to 10 servings`** | **pick** |
| `go to market` | pick |

`{servings := 1 to 10 servings}` silently freezes as a **text pick**, not a range. The tie-break is
defensible (a trailing word breaks the constructor) but it is **invisible**, and the author gets a
frozen string where they asked for a range. Phase 3's "capture legibility" is confirmed as the real
remainder.

### B5 — persistence needs nothing. The issue's OPML concern is not supported.

Every kind round-trips today. Records carry `kind`/`rolled`/`seed`, and `_vars` is present on save:

```
a:formula     b:pick+rolled     c:pick+rolled     d:dist+seed     e2:pick+rolled
```

**#1353 lists OPML serialization of `kind`/`rolled`/`seed` as part of the rearchitecture. It is already
done.** One more piece of the "rearchitecture" that measurement removes.

One genuine observation from the same run: a **distribution variable is absent from `collectVars()`
entirely** (`{"a":40,"b":18,"c":"cool","e2":-1}` — no `d`). That is the kind-wall in one line, and it is
the mechanism behind every distribution refusal.

---

## 9. The phases, now clear

| phase | what | size | blocked on |
|---|---|---|---|
| **1** | ~~Every kind-wall refusal says which wall…~~ **SHIPPED, and much smaller than planned** — see §12. The tooltip was already correct on every surface; only the ANNOUNCE was generic. | small | — |
| **2** | ~~Make the taught remedy work: the conditional must expand the distribution reducers.~~ **SHIPPED** — see §11. | small | — |
| **3** | ~~Capture legibility…~~ **SHIPPED, and narrower than planned** — see §13. The pill already distinguished every kind; only the Variables panel conflated two. | small | — |
| — | ~~unify `resolveVarDefs` / the `evalMath` ident boundary / OPML~~ | — | **not required**: B5 shows persistence is done, B3 shows checks already resolve the remedy, A1 shows the math remedy composes |

---

## 10. Owner decisions (2026-08-04)

**A range in a yes/no test: refuse, and teach `chanceover`.** Both the conditional and the check keep
refusing a distribution, and both say why and name the working form. This follows #1127's precedent —
when a distribution meets a scalar-only surface the app names the form that works rather than
inventing a coercion — and it preserves the spread the estimate feature exists to carry.

**Consequence, and it is binding:** Phase 2 is a **prerequisite of Phase 1's honesty**, not an optional
follow-on. `{chanceover(cost, 150) > 50: …}` renders `can't tell yet` today (§7/A2). No cue may name
that form until the conditional resolves it. The two rejected options are recorded so the decision is
not silently revisited: answering by probability hides a 51% behind the same word as a 99%, and
answering on the mean discards the spread — the silent-wrong-answer class.

**Sequencing: #1378 first.** The numeric-pick-rolls-empty bug is unrelated to #1353, small, and a live
silent-wrong value in the generative engine. It ships before Phase 1 starts, on its own branch, with
its own cause established rather than assumed (see the issue's note: the `parseAlt` observation is the
tell, not the diagnosis).

### Resulting order

1. **#1378** — a pick between numbers stops rolling empty.
2. **Phase 2 first, then Phase 1** — the remedy must work before it is taught. Phase 2 widens the
   conditional's expander to the distribution reducers; Phase 1 then routes the specific reason to all
   three surfaces, in the announce as well as the tooltip.
3. **Phase 3** — capture legibility, separately.

---

## 11. Phase 2, shipped — and the cause was mine

**The bug was introduced by #1356**, and the adversarial pass (§7/A2) is what surfaced it.

`{chanceover(cost, 150) > 50: likely | unlikely}` rendered `can't tell yet`. Traced:

```
expandAggExpr('chanceover(cost, 150) > 50', node, vars )  ->  "(40.8) > 50"    expands
expandAggExpr('chanceover(cost, 150) > 50', node, scope)  ->  unchanged        does not
```

The `> 50` was a red herring; the difference is the third argument. `scope` comes from
`resolveNodeScope`, which rebuilds the map with `Object.assign` — and #952 attaches the distribution
lane with **`enumerable: false`** (`attachVarDists`). `Object.assign` copies only enumerable own
properties, so **every scope built by `resolveNodeScope` silently lost the lane.**

That is why a **check** could resolve `percentile(cost, 90) <= 150` while a **conditional** could not:
`evalCheck` expands *before* it narrows; the conditional arm I added in #1356 expands *after*.

### The fix, and why it is in `resolveNodeScope` rather than the conditional

Losing the lane was an accident of `Object.assign` semantics, never a decision — so it is restored
where it was lost, in one place, for every caller. Fixing the conditional's call order instead would
have left the same trap set for the next caller of `resolveNodeScope`.

```js
const dists = varDistsOf(docVars);
if (dists) attachVarDists(out, dists);
```

Attached only when there is one (an empty lane is not attached), and still non-enumerable — a mutation
making it enumerable turns the #952 "the sibling lane never leaks into the resolved map" pin red,
which is the guard that keeps a lane from reading as a variable name.

### Driven

| | |
|---|---|
| `{chanceover(cost, 150) > 50: likely \| unlikely}` | **likely / unlikely** — the taught form works |
| `{percentile(cost, 90) > 150: risky \| safe}` | risky |
| `{chanceunder(cost, 120) > 10: cheap \| not}` | cheap |
| `{cost > 150: over \| under}` on a bare range | **still `can't tell yet`** — the owner's decision holds |
| `{hp > 5: alive \| dead}` | alive (regression) |
| `{tension > 5: tense \| calm}` on a node property | tense (#1356 regression) |

**Phase 1 is now unblocked**: the remedy its message will name is real.

`node --test tests/test.mjs` green at **2016**. Four mutations red, including attaching an empty lane
and making it enumerable. My own new pin was caught by the #1133 census guard for iterating
`Object.keys` without asserting the collection — fixed with `nonEmpty`, which is the guard working.

---

## 12. Phase 1, shipped — and §2 of this document was wrong

**Correcting the measurement this plan was built on.** §2's table claims three cases show the generic
*"Not recognized, so it stays plain text"*. **They do not.** Driven properly, with the row's edit state
checked rather than assumed:

| when | `editing` | what the row shows for `{= tone}` on a text pick |
|---|---|---|
| while typing | `true` | `gr-src gr-bad` — *"Not recognized, so it stays plain text"* |
| **after commit** | `false` | `.brace-attempt` — *"…a value that is not a number (a word or random pick can't be used in math)"* |
| after focusing elsewhere | `false` | the same specific sentence |
| after a full render | `false` | the same specific sentence |

The §2 measurements were taken from the live DOM **while the row was still in edit mode**, compounded
by the keystroke race §7/A4 already recorded. `classifyBraceBody` and `braceAttemptReason` were correct
the whole time, on all three surfaces. **The plan's §2 and §3 Phase 1 both overstated the defect**, and
that is recorded here rather than quietly rewritten above.

### What was actually wrong, and it is real

The **announcement**. A tooltip is hover-only (#1199), so the announce is the only thing many readers
receive — and it said nothing useful while the tooltip beside it explained precisely what was wrong:

```
announced:  "Not recognized, so it stays plain text"
tooltip:    "This calculation uses a value that is not a number (a word or random pick
             can't be used in math)."
```

Same moment, two answers, and **the useless one is the one that speaks**. `braceAttemptAnnounce` now
routes the reason to the live region, reusing the same rules and scope `classifyBraceBody` just used,
so the explanation can never disagree with the verdict.

### Driven

| case | announced now |
|---|---|
| text pick in math | *"…a value that is not a number (a word or random pick can't be used in math). It stays plain text."* |
| distribution in math | *"…an estimate like 5 to 10 … Write it without the `=` … It stays plain text."* |
| `percentile()` on a number | *"…a plain number where an uncertain value was expected; percentile() and chanceover() only work on a variable declared as a range…"* |
| unknown name | the #1159 scope sentence |
| genuine prose `{not math at all}` | **silent** — classifies as literal, not a refusal |

### A dead branch removed rather than pinned

The first version had `why ? why + ' It stays plain text.' : 'Not recognized…'`. Mutation testing found
that **deleting the fallback left the suite green**: `braceAttemptReason` always returns a sentence, so
the else could never run. An unreachable branch cannot be pinned, which is the #1133 class — so it was
deleted, not defended, and a pin now asserts the body is the single return.

`node --test tests/test.mjs` green at **2017**. Five mutations red, including announcing the generic
sentence again, dropping the outcome clause, explaining against a different scope than the one that
classified, and re-introducing the unreachable fallback.

---

## 13. Phase 3, shipped — and §3's premise was overstated too

Phase 3 was written as *"the author picks a kind implicitly and `varDeclKind`'s sniff is invisible,"*
needing *"a capture door that shows which kind was inferred and lets it be changed."* Measured, the
sniff is **not invisible**. Every kind already presents differently on the pill:

| kind | pill shows | pill title |
|---|---|---|
| formula | `cost=40` | *Click to edit* |
| pick | `cost=16` | *Click to re-roll · pencil to edit* |
| distribution | `cost≈144.4 (98.7 – 197.3)` + sparkline | ***Uncertain value.** Click to re-sample…* |

So a reader can already tell them apart — the fourth time in this issue that measurement found the
capability present and the plan overstating its absence.

### What was genuinely wrong: one surface, one conflation

The **Variables panel**, the only surface that lists every variable at once:

```
a  = 40                            a formula      — stable
b  = 20                            a frozen 1d20  — re-rolls on click
c  = cool
d  ≈ 145.9 (101.9 – 200.3)         distinguished by ≈ (#952)
e2 = 1 to 10 servings
```

`a` and `b` are **identical in presentation and different in behaviour** — one is stable, the other
re-rolls. That is a P1 break, and the panel is exactly where a reader goes to compare variables.

It also explains the "surprise" capture case from §8/B4 without any new machinery:
`{e2 := 1 to 10 servings}` now reads **`1 to 10 servings  random`**, which tells the author it froze as
a pick rather than becoming a range.

### The fix

A muted kind word on the row, from `varKindLabel`. Only the **pick** is named: a distribution already
carries its `≈` and headline (a recorded #952 decision, not re-litigated here), and a formula is the
unmarked default. **"Random" is the app's existing user-facing word** — the roll log is "Random
results" — so no new vocabulary was minted (P5); a new word would owe a row in `ux-discipline` §1.

Derived from the **active expression**, not the value: `vars[nm]` is a plain number for a formula and a
frozen roll alike, so the value genuinely cannot tell them apart. A mutation that derives it from the
value instead is red.

**The panel's rebuild signature had to widen with it.** It skips a rebuild when the signature is
unchanged, and the signature carried only names and values — so changing `{a := 40}` to `{a := 40 | 40}`
kept the value at 40, kept the signature, and would have left the row saying nothing while the variable
had become a pick. Driven, that exact case now flips to `random`. The raw expression is used rather
than `varDeclKind`, because it changes whenever the kind could and costs one string compare instead of
a sniff that samples, per name per keystroke.

`node --test tests/test.mjs` green at **2018**. Six mutations red, including labelling a formula,
double-marking a distribution, deriving the kind from the value, and dropping the expression from the
signature.

### #1353 is now complete on the evidence

Every phase shipped, and the rearchitecture the issue proposed was **not required for any of them**:
persistence already round-trips (§8/B5), checks already resolve the remedy (§8/B3), the math remedy
composes (§7/A1), and the pill already showed the kind (§13). What the issue correctly identified was a
set of gaps; what measurement changed was where they were and how large.
