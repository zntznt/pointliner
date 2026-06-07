> On-demand reference — read this only when adding a new artifact type or icon. Not loaded by default.

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
   `insertInlineArtifact` (which splices the token and pushes the record).
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
12. **Font Awesome** — if you need a new icon, see the workflow below.

---

## Font Awesome (subsetted, inlined)

Only the glyphs the app uses are embedded as base64 woff2 in the `#fa-embed`
`<style>`. To add an icon:

1. Put FA Free files in `/tmp/faemb/` (`all.min.css`, `fa-solid-900.woff2`, …).
2. Add the icon name to the `USED` dict in `/tmp/faemb/build.py`.
3. `cd /tmp/faemb && python3 build.py`.
4. Replace the `@font-face` block and the icon-rule block in `index.html` with
   the regenerated `faface.css` / `faicons.css` contents.
