# Pointliner

Single-file HTML outliner app (`index.html`). No build step, no dependencies beyond embedded Font Awesome woff2 subsets (inlined as base64). Open the file in a browser.

## Architecture

- All code lives in `index.html` — JS, CSS, and HTML in one file.
- Tree of nodes serialised as OPML (saved/loaded via `<opml>` XML).
- Each node has: `id`, `type` (ul/ol/h1-h4/code/quote/divider/task/table), `text`, and per-feature arrays (`dice`, `markov`, `rolltable`, `math`, `vars`).
- `render()` walks the tree and builds the DOM. Each `.node-content` is a `contenteditable` div.
- Display mode: `content.innerHTML = renderContentHTML(node)` (markdown → HTML with pills).
- Edit mode: `content.innerHTML = editModeHTML(node)` (pills rendered as `contenteditable=false` spans so raw tokens stay hidden).
- Token syntax in `node.text`: `[[dice:KEY]]`, `[[markov:KEY]]`, `[[rolltable:KEY]]`, `[[math:KEY]]`, `[[var:KEY]]`.
- `editableText(el)` — DOM walk that serialises text nodes + token spans back to raw text (used by input handler and `exitEdit`).
- `getCaretOffset` / `setCaretByOffset` — logical character offset that treats token spans atomically.
- `collectVars()` — walks the whole tree in document order, builds `{name: value}` map from `[[var:KEY]]` tokens; cached per `markDirty()` call via `_varsVer`.
- `globalVarMap` — set by `renderContentHTML` (and manually before `editModeHTML` in edit-mode reroll), consumed by `renderMathPill` and `renderVarPill`.

## Font Awesome

Icons are subsetted and inlined. To regenerate after adding icons:

1. Put FA Free files in `/tmp/faemb/` (`all.min.css`, `fa-solid-900.woff2`, etc.)
2. Edit `USED` dict in `/tmp/faemb/build.py`
3. `cd /tmp/faemb && python3 build.py`
4. Paste `faface.css` and `faicons.css` contents into `index.html` (replace the existing `@font-face` block and icon rule block)

## Slash commands (@ triggers)

Typed in edit mode: `@dice`, `@markov`, `@rolltable`, `@math`, `@var`.
Each opens an insert dialog, creates a token in `node.text` and a record in the corresponding array.

## Features implemented

- **Dice** — `@dice` → NdM±mod expression; click pill to reroll, pencil to edit formula
- **Markov chains** — `@markov` → state-machine walk; click to re-walk, pencil to edit
- **Roll tables** — `@rolltable` → weighted entry list; click to re-roll, pencil to edit
- **Math** — `@math` → expression evaluated with mathjs-style parser (trig, log, constants); pencil to edit; recomputes live when vars change
- **Variables** — `@var` → named value usable in `@math` (e.g. `2*pi*r`) and `@dice` (e.g. `2d6+str_mod`); pencil to edit
- **Inline token editing** — pills render in edit mode as `contenteditable=false` spans; raw token syntax is never shown to the user
- **Pill interactions in edit mode** — reroll (dice/markov/rolltable) stays in edit mode and updates the pill in place; pencil exits edit mode then opens dialog
- **Display-mode pill clicks enter edit mode** — clicking any pill in display mode now also enters text-edit mode (fixes nodes that are entirely tokens)

## Development branch

`claude/cool-cray-5OQcQ` on `zntznt/pointliner`

## Planned / ideas

- [ ] UX pass on the three custom feature dialogs (noted but not yet actioned)
- [ ] Consider a keyboard shortcut to enter edit mode on a selected node without clicking
- [ ] Footnote / citation feature already partially scaffolded (fn-panel in DOM)
