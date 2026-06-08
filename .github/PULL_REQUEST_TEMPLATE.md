<!--
  Repo path: .github/PULL_REQUEST_TEMPLATE.md
  GitHub pre-fills every new PR with this. The UX Conformance block is REQUIRED for
  any change that touches the DOM, a shortcut, copy, or an interaction.
  Full process: guidance/ux-definition-of-done.md → "How this gate is run".
  No Conformance Statement → not merged.
-->

## Summary

<!-- What changed and why. -->

## UX Conformance

<!--
  Fill one line per principle: ✅ + a one-phrase "how", or "N/A — <one-word reason>".
  If this PR has NO UI surface (pure logic / core only), replace this whole block with:
  UI: none
-->

- **P1 Predictable** — ✅ / N/A: <how>
- **P2 Discoverable** — ✅ / N/A: <how>
- **P3 Reachable** — ✅ / N/A: <how>
- **P4 Responsive** — ✅ / N/A: <how>
- **P5 Coherent** — ✅ / N/A: <how> · *new syntax?* if yes → what it **retires** + inventory updated
- **New non-conformances filed:** `UXP-NN` | none
- **Acceptance tests:** pass | N/A
- **Regression:** tests green · touch path · OPML round-trip

## Reviewer checklist

<!-- Check the statement against the diff — don't re-derive. Hunt the four invisible violations. -->

- [ ] Conformance Statement present and each box matches the diff
- [ ] **P5** — no new syntax/delimiter (or it *replaces* what it overlaps + inventory + `?` panel updated)
- [ ] **P1** — no new keybinding absent from the keyboard grammar (`ux-discipline.md` §3)
- [ ] **Caret invariant** — no control converted to `click`/`<button>`; keyboard added *alongside* `mousedown`
- [ ] **P4** — no silent failure / no-op
- [ ] Any gap the change leaves is filed as a `UXP` in `guidance/ux-remediation.md`

<!-- No statement, or any falsely-ticked box → not merged. -->
