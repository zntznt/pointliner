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
   **If the pill has an inline `{…}` shorthand form (most do), also add a row to
   `BRACE_FORMS`** so the `{` picker offers it as a scaffold — the picker is an
   aggregating door that enumerates the `{…}` grammar surface, and a new form is only
   discoverable there if it has a row. The `BRACE_FORMS parity` drift test **fails** if a
   promotable form family has no row (or if a row's scaffold no longer promotes), so this
   is enforced, not optional. Give the row a `label`, keyword `keys`, an `insert`
   scaffold, and a `sel` span selecting the placeholder to type over.
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
9a. **Roll-log coverage (MANDATORY for any generative/randomizing pill, #918).** If your
    artifact produces a *random or generated* result (it has a reroll — dice, a generator, an
    oracle, a deck, a chain, an estimate, a pick), its reroll function MUST call
    `logRoll(node, source, result)` right where it `announce()`s the new value — `source` is the
    pill's own label (its expr / def / name), `result` the frozen value it just produced. This is
    the single opt-in hook that lets **every** generative pill land in the user's Rolls log; a new
    such pill that skips it is silently missing from the log, which the owner has ruled out. Two
    things enforce it: add your reroll function name to the `REROLLS` list in the
    **`#918 roll-log coverage`** test (`tests/test.mjs`) — it fails if any listed reroll lacks a
    `logRoll(` call — and this step. A *deterministic* pill (math, query/count, meter, a display-only
    variable) has no reroll and does NOT log. `logRoll` is a no-op unless the user turned logging on,
    so it costs nothing when off.
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
      inline-able, a `{…}` shorthand path exists alongside the dialog **and is registered in
      `BRACE_FORMS`** so the `{` picker teaches it (enforced by the `BRACE_FORMS parity` test).
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
`<style>`, gated by the `FA_GLYPHS` JS allow-list. **An icon NOT in the subset
silently paints its unicode/emoji fallback instead of the real glyph** (see
`paintIcon` + the `data-fb` fallback char). So before using `fa:'fa-solid
fa-NAME'` anywhere, confirm `fa-NAME` is in `FA_GLYPHS`; if not, add it.

The build is self-contained , `tools/build-fa-subset.py` downloads pinned FA
Free source, subsets it, and prints the new embed. No pre-staged files.

1. **Install once:** `pip3 install fonttools brotli` (brotli is needed for
   woff2). Network access to github.com is required (FA version is pinned in
   the script).
2. **Add the icon name** (without the `fa-` prefix) to the `ICONS` list in
   `tools/build-fa-subset.py`. If the app uses it in the *regular* weight
   (`fa-regular fa-NAME`), also add it to `FORCE_REGULAR`. Brands (e.g. github)
   are auto-detected.
3. **Dry-run:** `python3 tools/build-fa-subset.py --check` , confirms every
   `ICONS` entry resolves in FA Free (prints any that don't).
4. **Build:** `python3 tools/build-fa-subset.py` , prints the full
   `<style id="fa-embed">…</style>` block followed by the `const FA_GLYPHS =
   new Set([...]);` line.
5. **Splice into `index.html`:** replace the existing `<style id="fa-embed">…
   </style>` block with the printed one, and replace the `FA_GLYPHS` line with
   the printed one.
6. **Verify in-app (do NOT skip):** serve `index.html` and confirm the new icon
   *paints a real glyph*, not the fallback , an `<i class="fa-solid fa-NAME">`
   should have a non-zero rendered width. A subset that doesn't paint is worse
   than the fallback. (`await document.fonts.ready` first; measure
   `getBoundingClientRect().width`.)

The `ICONS` list in the script is the source of truth for what's embedded; keep
it a superset of every `fa-` name the app references (grep `index.html` for
`fa-` to audit). To find a missing-from-subset icon, grep the app's `fa-` usages
and diff against `FA_GLYPHS`.
