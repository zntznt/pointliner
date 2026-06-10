# Pointliner — UX Remediation Register

Tracks UX non-conformances against the §7 keyboard-navigation and discoverability
standards. Each entry has a status, the conformance point it violates, and the
resolution (or deferral reason).

**Status legend:** OPEN · IN PROGRESS · RESOLVED · DEFERRED

---

## UXP-9 — Variable / callable-name discoverability (RESOLVED)

**Filed:** 2026-06-10  
**Resolved:** 2026-06-10

**Problem:** The `{name}` brace syntax could reference any declared variable, grammar
rule, named roll table, or named Markov chain — but there was no way to discover what
names existed without manually reading every node in the document. Users had to
remember names they'd declared elsewhere; typos silently produced `{name?}` markers
with no feedback.

**Resolution:**
- **`{`-autocomplete** (BUILD 1): Typing `{` in edit mode now opens a grouped picker
  (Variables / Rules / Tables / Chains) sourced from `collectCallables()` (which wraps
  `collectVars` + a targeted tree-walk). The picker narrows as you type an identifier
  prefix. Variables show their resolved value inline. Selecting completes `{name}` and
  promotion-on-exit turns it into a pill (existing `{name}` → pill promotion path,
  unchanged). Picker fits §7.2 keyboard-nav: ↑/↓/Enter/Tab/Esc; positioned at caret
  (same pattern as the `/` slash menu and `[[` link picker); ARIA-labeled menu +
  menuitem roles.

- **Variables overview panel** (BUILD 2): Ctrl+Shift+V (or ✕ to close) opens a
  slide-up panel listing all declared variables with their resolved values (or `↻ cycle`
  for cyclic references). Updates live on `markDirty()`. Mirrors the footnote/backlinks
  panel pattern; keyboard-reachable; `role="region"` + `aria-label="Variables"`.

**Pure-core additions:** `collectCallables(rootNode)`, `filterBraceCandidates(callables, prefix)` — both `function` declarations, testable from Node.

**Conformance:** P1 ✅ §7.2 keyboard nav · P2 ✅ callable names discoverable · P3 ✅ ARIA-labeled · P5 ✅ no new syntax.
