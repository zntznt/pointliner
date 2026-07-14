# Contextual body completion for the `{` picker — design proposal

**Status:** **Phase 1 (math) shipped.** Decisions 1–4 approved as recommended (A / `name()`
caret-inside / variables grouped-last first-char-gated / math-only first). Phases 2+
(search operators, oracle bands, meter props) remain as speced follow-ups below.
**Motivates:** the `{` picker (UXP-192 / #715) completes the *form*, then gets out of
the way. This adds a second stage — completing the *body* of a form — so typing
`{=` suggests what you can do with math, `{query:` suggests search operators, etc.
The "member/function completion" an IDE gives you.

**Phase 1 as built:** cores `mathFragmentAt` / `mathCompletions` / `mathFnGroup` (pure,
pinned); `checkBraceTrigger` gains a math-mode branch (body starts with `=`);
`braceApply` gains a mid-body insert path (`braceState.mode === 'math'`); the menu
reuses the brace-menu with `fn-core`/`agg`/`fn-conv`/`fn-date`/`const`/`var` groups.
`{= ` opens on the first identifier letter; a function inserts `name()` with the caret
inside; constants/variables insert bare. Verified in-browser.

---

## 1. The gap

Today `checkBraceTrigger` is single-stage: it fires only while the body after `{`
is a **bare identifier** (a form label or a callable name). The instant the body
commits to a form — you type `=`, `:`, `|`, or a digit — the picker **closes**
(the `if (inner !== '' && !/^[a-z_]\w*$/i.test(inner)) { hideBraceMenu(); return; }`
guard). So:

- `{= ` → nothing. The ~70 math functions are discoverable only in the `?` panel.
- `{query: ` → nothing. The search operators live only in the focus legend.
- `{oracle: ` → nothing. The likelihood bands are dialog-only.

The whole computational surface is invisible at the exact moment you're authoring it.

## 2. Goal & non-goals

**Goal:** once a body has committed to a known form, keep the menu open and suggest
the vocabulary valid *inside that form*, inserting the chosen token mid-body.

**Non-goals (this proposal):**
- Fuzzy/subsequence matching — that's a separate, cross-picker P1 decision (all
  pickers are prefix-match today; changing one is an inversion). Prefix-match here.
- Full grammar-aware completion (no "sqrt takes 1 arg so stop suggesting after the
  first"). Token-level suggestions only.
- Snippet/argument tab-stops beyond the single caret-in-parens landing.

## 3. Scope & phasing

**Phase 1 (the build target of this proposal): `{= …}` math completion.** Self-contained,
highest value (the biggest hidden vocab), proves the mid-body machinery on one context.

**Phase 2+ (same machinery, follow-up PRs, out of scope here):**
`{query:`/`{roll:`/`{count:}` → search operators · `{oracle:}` → `ORACLE_BANDS` ·
`{meter:}` → the point's numeric property names · names inside `{a | b | …}` alternations.

The Phase-1 build is written so Phase 2 is "add a body-lead detector + a vocab source,"
not a rewrite (see §7).

## 4. Detector rules — when the menu opens, in which mode

Extend `checkBraceTrigger`. After it finds the innermost unclosed `{` and its body
`inner`, branch on the body:

1. **(existing) forms/names mode** — `inner` is empty or a bare identifier → unchanged.
2. **(new) math mode** — `inner` starts with `=`:
   - Find the **identifier fragment at the caret**: scan left from the caret to the
     nearest boundary char in `= + - * / ^ % ( , < > ! and a space`. The run from that
     boundary to the caret is the fragment.
   - If the fragment matches `/^[a-z_]\w*$/i` **and is non-empty**, open math mode with
     that prefix. (Empty-prefix handling: see §6, the flood decision.)
3. **else** → hide (unchanged). Phase 2 adds `query:`/`roll:`/`oracle:`/`meter:` leads here.

`braceState` gains a `mode` field (`'forms' | 'math'`) so render + apply dispatch on it.
The math-mode fragment's start offset (`fragStart`, absolute in the node text) is stored
so apply knows the span to replace.

## 5. Pure core API (testable, no DOM)

```
mathCompletions(prefix, vars) -> [ { name, group, insert, caretBack, hint } ]
```
- **Sources**, in this display order:
  - `group:'fn'` — every key of `FN1` ∪ `FN2` ∪ `FN3` + the variadics (`min`,`max`,`and`,`or`)
    and the child aggregations (`sum`,`avg`,`count`,`words`). `insert:'name('`,
    `caretBack:0` with the caret landing inside the parens (see §8), `hint:'name(x)'`
    / `'name(a, b)'` by arity.
  - `group:'const'` — `pi`, `e`, `tau`, `today`. `insert:'name'`, `hint:'constant'`.
  - `group:'var'` — `Object.keys(vars)`. `insert:'name'`, `hint:'= <value>'`.
- **Filter:** `name.startsWith(prefix)` (prefix-match, consistent with the other pickers).
- **Pure:** reads the real `FN1`/`FN2`/`FN3` (via closure, like `filterBraceForms` reads
  `BRACE_FORMS`) + the passed `vars` map. Node-testable: `mathCompletions('sq', {})`
  returns `sqrt`; `mathCompletions('', {hp:3})` includes `hp`.
- **Sub-grouping the flood:** FN1 mixes core math with ~14 unit conversions and ~10 date
  fns. Give each a stable sub-group so the menu can label them (`'Functions'` /
  `'Conversions'` / `'Dates'`) rather than one 70-row wall. A small static
  `MATH_FN_GROUP` map (name → 'core'|'conv'|'date') drives this; adding a fn to FN1
  without grouping it defaults to 'core' (a drift test pins that every FN1/2/3 key has
  a group, mirroring the BRACE_FORMS parity guard).

## 6. The flood decision (needs your call)

`{= ` with an empty fragment could dump ~70 functions. Options:

- **(A, recommended) Open math mode only after the first identifier character.** `{= `
  shows nothing; `{= s` shows `sqrt, sin, sign, sum, …`. Matches how you actually type a
  function name, and the prefix filter keeps the list short. Minor divergence from the
  form picker (which shows all 18 on empty `{`), justified by 70 ≫ 18.
- **(B) Show on empty, but only constants + variables + a curated "common" fn set**
  (`sqrt, sum, avg, count, min, max, round, abs`), with the long tail revealed as you
  type. More discoverable, more code (the "common" list is a curation to maintain).
- **(C) Show all on empty, grouped + scrollable.** Simplest, most overwhelming.

Recommendation: **A**. It's the least code and the least clutter; the sub-groups (§5)
still teach breadth once you start typing.

## 7. Mid-body insertion contract

New apply path, distinct from `braceApply`'s replace-from-`braceStart`:

- Replace `[fragStart, caret)` with `chosen.insert`, leaving the rest of the body and
  the surrounding `{ }` intact.
- **Functions:** insert `name()` (balanced — auto-close the paren) and land the caret
  **between** the parens, IDE-standard, so you type the argument next. Reuses
  `setCaretByOffset` (already present). Balanced parens keep `evalMath` parseable if you
  commit early.
- **Constants / variables:** insert `name`, caret after it.
- After insertion the body still contains `=`/`(` (non-identifier), so the next input
  event re-enters math mode on the new fragment — completion chains naturally, and the
  UXP-7 preview tooltip shows the promotion once the body is complete.

`braceApply` dispatches on `braceState.mode`: `'forms'` → whole-scaffold (today);
`'math'` → mid-body insert. Names path unchanged.

## 8. Menu, keyboard, a11y (all reused)

- Same `#brace-menu` DOM, `renderBraceMenu`, `braceMove`/`braceApply`, group headers
  (`BM_GROUP_LABELS` gains `fn`/`const`/`var` + the math sub-group labels).
- Same keyboard (`↑/↓/Enter/Tab/Esc`), `role=option`, `aria-activedescendant`, mouse via
  `mousedown`+`preventDefault` (the caret invariant). **No new interaction to learn (P1).**
- **Preview coexistence:** while the completion menu is open, suppress the UXP-7
  `#brace-preview` tooltip (they'd overlap at the caret); the preview returns when the
  menu closes on a complete body. One-line guard in `showBracePreview`.

## 9. UX conformance (pre-check)

- **P1** ✅ additive mode on the existing picker; same keys, same close order.
- **P2** ✅ the point of the feature — the math surface (today `?`-panel-only) becomes
  discoverable inline.
- **P3** ✅ reuses the brace-menu a11y wholesale; additive.
- **P4** ✅ picking always inserts; no silent path.
- **P5** ✅ suggests **existing** vocabulary (FN tables, variables) — zero new syntax.

## 10. Tests

- `mathCompletions('sq', {})` → `sqrt` present, `insert:'sqrt('`, `group:'fn'`.
- `mathCompletions('', {hp:3})` (if flood-option B/C) or `mathCompletions('h', {hp:3})`
  (option A) → `hp` present, `group:'var'`, hint `= 3`.
- prefix filter; empty vars; a constant (`pi`) present.
- **Drift guard:** every `FN1`/`FN2`/`FN3` key appears in `mathCompletions('', …)`'s
  fn set (so a new math fn can't be added without becoming completable) **and** has a
  `MATH_FN_GROUP` entry — mirrors the `BRACE_FORMS parity` guard, extends the same family.
- A fragment-scan unit if extracted as a pure helper `mathFragmentAt(body, caret)` →
  `{prefix, start}` (recommended — makes §4 testable without the DOM).
- Browser: `{= sq` → menu → Enter → `{= sqrt()}` with the caret inside the parens.

## 11. Decisions — RESOLVED (approved as recommended)

1. **Flood handling (§6):** A (open after first char — recommended) / B (curated common
   set on empty) / C (show all grouped).
2. **Function insertion (§7):** `name()` caret-inside (recommended) vs `name(` (no close).
3. **Variables in the list:** include always / only past 1 char / behind a sigil. (I'd
   include them, grouped last, gated by option A's first-char rule so no flood.)
4. **Phase-2 appetite:** ship math-only first (recommended), or want the search-operator
   / oracle / meter contexts speced into this same doc before any build?

Once you land these four, I'll build Phase 1 to this spec — pure core + drift test first,
then the DOM wiring, then browser verification.
