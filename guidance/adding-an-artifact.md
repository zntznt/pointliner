> On-demand reference — read this only when adding a new artifact type or icon. Not loaded by default.

## Before you add anything — the P5 check

**Stop and ask: does this need to be a new artifact at all?** Most "new inline thing"
needs are already expressible in the existing authoring language and should be, per the
UX standard's one-language principle (`guidance/ux-discipline.md` §2/P5):

- A new **computed** value → a new `evalMath` primitive (`FN1`/`FN2`/`FN3`), used as `{= …}`.
- A new **generative** behavior → a new `resolveBrace` branch in the `{…}` grammar engine.
- A new **named** generator → register it in `collectRules` so `{name}` calls it.

A genuinely new artifact (its own token, sidecar, pill, dialog) is justified only when the
config is **richer than text and stateful** in a way the grammar engine can't carry. If you
proceed, you are adding to the **closed syntax inventory** — that is a recorded, signed-off
decision, not a side effect. Then follow the recipe.

## Recipe: add a new inline artifact

Every artifact follows the same path. To add one (say `@weather`):

1. **Token + sidecar.** Pick a token name `[[weather:KEY]]` and a node array
   `node.weather`. Add it to `mkNode()`, `toOpml` (`_weather` attr), and `fromOpml`.
2. **Pure core.** Write the parse/eval/roll as pure functions returning a record
   `{key, ...}` or `null` on invalid input. Mirror `makeDiceRoll`. **Pin it before any
   DOM:** add the function names to the `need` array in `tests/load-cores.mjs` and write
   seeded assertions in `tests/test.mjs` (`node --test tests/test.mjs`). The dice
   success-pool core was built this way and is a good worked example.
3. **Pill renderer.** `renderWeatherPill(key, record)` → returns the pill HTML;
   handle the missing-record case with a `…-bad` class.
4. **Wire into `mdInline`** — one `.replace(/\[\[weather:([a-z0-9]+)\]\]/gi, …)`
   line that calls `renderWeatherPill` against the render-list global.
5. **Render-list global** — add `weatherRenderList`, set/clear it in
   `renderContentHTML`, set the node array source.
6. **Edit mode** — add the `type === 'weather'` branch in `editModeHTML`. Pick the right
   treatment (see CLAUDE.md → Conventions): an **atomic pill** (`contenteditable=false`
   `data-token`) if the config is richer than the text; an **unfold to `{…}`** for an
   inline-able artifact; or **plain editable text** if the token *is* the config — that's
   how **node links** `[[#id|label]]` work (no atomic pill, edited as raw text like a
   footnote ref, rendered as a widget only in display mode).
7. **Dialog** — `openWeatherDialog(...)` built on `openInsertDialog` (shared field
   /chip/preview/validate harness).
8. **Slash menu** — add an entry to `INSERT_CMDS` and a branch in
   `insertInlineArtifact` (which splices the token and pushes the record). The entry
   MUST carry `label` + `desc` + the typed syntax, so the menu teaches it (P2-2).
   If the verb should take an **inline argument** (`/verb:value`, to skip a dialog —
   like `/due:tomorrow`), follow the narrow-gate contract in `ux-discipline.md` §7.1a:
   gate the `:value` arm to your verb only, trigger-pin the strip, dialog on a bare
   verb, flash on a bad value (P4). Do **not** widen the shared slash matcher for all
   verbs.
9. **Click handler** — add a `closest('.weather-pill')` branch to the
   `mousedown` handler in `attachContentEvents`. Follow the existing convention
   (`e.preventDefault()` keeps focus off the node so it never enters edit mode):
   in **display mode** the pill is a live widget — a body click performs the action
   and re-renders in place (the `rerollXxx` helper already does
   `el.innerHTML = renderContentHTML(node)` when `!el.dataset.editing`), the pencil
   opens the dialog; both stay in display mode. In **edit mode** a body click
   rerolls in place (save caret → mutate → `editModeHTML` → restore caret) and the
   pencil exits edit mode then opens the dialog. (Note: inline-able artifacts are
   unfolded to `{…}` text in edit mode, so only complex pills — tables/markov — get
   edit-mode clicks; dice/math/grammar pills only exist in display mode.)
10. **Prune + edit** — `pruneWeather(node)` (drop records with no token) called in
    `exitEdit`; `editWeather(node, key)` opens the dialog prefilled.
11. **CSS** — a `.weather-pill` block near the other pill styles; reuse the
    `--acc` / `--ring` / `--bdr` tokens so light/dark themes work automatically.
    Follow the pill grammar in `guidance/design-language.md` §4: pick a distinct
    `--pill` family hue (added to the family-hue list there in the same PR), keep the
    shared metrics/padding, **one box per pill** (no bordered boxes nested inside),
    hover = accent border + tint, the `--ring` glow is focus-only, and any text on an
    accent background uses `--acc-fg`, never `#fff`.
12. **Font Awesome** — if you need a new icon, see the workflow below.
13. **UX conformance gate — the artifact is not done until it passes.** Run
    `guidance/ux-definition-of-done.md`. The recipe builds the pill; the gate ships it.
    For an artifact, pay special attention to:
    - **Pill pattern (P5/§7.2):** body-click rerolls **in place and stays in display
      mode**; the pencil opens the dialog. Do not invent a different interaction.
    - **No new syntax (P5):** if this pill introduced a new typeable notation rather than
      riding `{…}` / a token, justify it and update the syntax inventory + `?` panel.
    - **Discoverable (P2):** the `@`-menu entry prints its typed shorthand; if the pill is
      inline-able, a `{…}` shorthand path exists alongside the dialog.
    - **Reachable (P3, interim):** the pill carries an `aria-label` of the form
      `"Weather: <result>"`, updated after every reroll; the reroll writes to the
      `aria-live` region. (Pill `tabindex`/`role=tree` stay deferred per `accessibility.md`.)
    - **Responsive (P4):** invalid authoring in the dialog/shorthand explains *why*, never
      fails silently.
    - **Vocabulary (§1):** any user-facing copy calls it by its user-facing noun and the
      surrounding line a "point," never "node/item."

    Finish by **emitting the Conformance Statement** (the gate's "How this gate is run"
    section) in the PR/commit. No statement, no merge — the artifact is not done.

---

## Font Awesome (subsetted, inlined)

Only the glyphs the app uses are embedded as base64 woff2 in the `#fa-embed`
`<style>`. To add an icon:

1. Put FA Free files in `/tmp/faemb/` (`all.min.css`, `fa-solid-900.woff2`, …).
2. Add the icon name to the `USED` dict in `/tmp/faemb/build.py`.
3. `cd /tmp/faemb && python3 build.py`.
4. Replace the `@font-face` block and the icon-rule block in `index.html` with
   the regenerated `faface.css` / `faicons.css` contents.
