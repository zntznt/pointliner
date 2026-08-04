# Variable-kind unification (#1353) — measured plan

**Status: Proposed.** Nothing built. Every table below is driven against `3230eea`, one fresh page per
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

**My recommendation is the third**, because #1127 already set the precedent for exactly this shape:
when a distribution meets a scalar-only surface, the app names the form that *does* work rather than
inventing a coercion. `{chanceover(cost, 150) > 50: tense | calm}` is already legal today and reads
honestly. If that is right, Phase 2 collapses into Phase 1 and this section closes.

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
