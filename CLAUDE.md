# Pointliner

A single-file, offline, vanilla-JS outliner with a markdown-style editor and a
family of inline "artifact" widgets (dice, Markov chains, roll tables, math,
variables). Everything — HTML, CSS, JS, and a subsetted Font Awesome — lives in
`index.html`. No build step, no runtime dependencies, no network. Open the file
in a browser and it runs.

> **For reviewers / other AIs giving suggestions:** read "Core architecture" and
> "The two-engine reality" first. The single most important constraint is that
> **`node.text` is the source of truth and is plain text** — every widget is an
> opaque `[[type:key]]` token in that text plus a record in a sidecar array.
> Suggestions that require rich inline state, a virtual DOM, a framework, or a
> build step do not fit this app. Suggestions that add a new token type, a new
> pure function, or a new expression primitive fit very well.

---

## Core architecture

### Data model

The document is a tree of plain-object nodes. `mkNode()` (≈ index.html:574) is the
canonical shape:

```js
{
  id, text, note, type,                 // type ∈ ul|ol|h1|h2|h3|quote|code|divider|table
  italic, underline, checked, collapsed,
  children: [],                         // nested nodes
  footnotes: [],                        // [{key, text}]
  dice: [], markov: [], rolltable: [], math: [], vars: [], grammar: []  // artifact sidecars
}
```

- **`node.text` is plain text and is the source of truth.** It holds markdown
  (`**bold**`, `- item`, `# heading`) and opaque artifact tokens
  (`[[dice:r3k9x2a]]`). It never holds HTML.
- **Markdown rendering is per-line and element-driven.** `mdToHtml` is a full
  per-line block parser: every line is classified independently (fenced code,
  ATX heading `#`–`######`, thematic break `---`/`***`/`___`, blockquote `>`,
  ul/ol/task list, definition list, else paragraph), so **markdown works on any
  line of a node**, not just the first — a multi-line `para` node is effectively a
  mini markdown document. Headings/quotes/hr/fenced-code render as real
  `<h1>`…`<hr>`/`<blockquote>`/`<pre>` elements (styled via `.md-h`/`.md-bq`/
  `.md-hr`/`.md-code`), **not** via whole-node CSS. `renderContentHTML` passes the
  **raw** `node.text` (prefixes intact) to `mdToHtml` for this reason; `node.type
  === 'code'` is the one whole-node exception, rendered by `codeNodeHTML`.
- **`node.type` for headings/quote is now a derived hint, not the renderer.**
  Headings/quote/code still store their prefix in `node.text` (`"# Title"`) and
  `deriveTypeFromText()`/`checkMdBlockPrefix()` still set `node.type` (`'h1'`) for
  bullet-dimming, OPML round-trip and the type-switcher — but the **visual comes
  from the markdown element `mdToHtml` emits**, so a `#`/`>` on line 2+ formats
  too. `textForDisplay()` (prefix-stripped) is used for breadcrumb/search/export,
  not for the main render. Inline emphasis supports both `**`/`__` (bold),
  `*`/`_` (italic), `***`/`___` (both); underscore forms are word-boundary-guarded
  so `snake_case` stays literal.
- **Artifact sidecars** (`dice`, `markov`, etc.) are arrays of records keyed by a
  random `key`. The token `[[dice:KEY]]` in the text is the only inline trace;
  the record `{key, ...config, ...rolledState}` holds everything else. A record
  with no matching token in the text is dead weight and is dropped by the
  `pruneXxx(node)` functions on `exitEdit`.

### Token ⇄ pill: the central mechanism

A "pill" is the rendered widget. The same token renders two ways depending on
mode:

- **Display mode:** `renderContentHTML(node)` → `mdToHtml` → `mdInline` (≈784).
  `mdInline` finds each `[[type:key]]` and calls the matching
  `renderXxxPill(key, record)` to produce HTML, stashed as an opaque
  `\x00N\x00` placeholder so later passes (emphasis, emoji, hashtags, autolink)
  can't reach inside the pill markup. Placeholders are un-stashed at the end.
- **Edit mode:** `editModeHTML(node)` (≈2023) renders two ways depending on the
  artifact. **Complex artifacts** with no clean inline form (roll tables, markov
  chains, multi-rule grammars, *declaring* variables) emit the *same* pill HTML
  wrapped in `<span contenteditable="false" data-token="[[type:key]]">…</span>` —
  atomic, uneditable, edited via the pencil/dialog. **Inline-able artifacts**
  (dice, math, display-only variables, single-line grammars) are *unfolded* to
  their editable `{…}` grammar source instead (see "Unfold" below), styled with a
  `.gr-src` span so they read as grammar, not prose. Either way the user **never
  sees raw `[[…]]` syntax.**

### Unfold: editing an inline artifact as text

`node.text` stays the token form (`[[dice:KEY]]`) as the saved source of truth.
But while a node is in edit mode, `enterEdit` calls `unfoldArtifacts(node)` to
rewrite each *inline-able* token in `node.text` to its `{…}` source
(`artifactToShorthand`), so the user edits real grammar text. `exitEdit` calls
`refoldArtifacts(node)` first (restores every untouched `{sh}` to its original
token via the `_unfoldData` WeakMap, **preserving the frozen roll + key**), then
`promoteInlineShorthand(node)` promotes anything new/edited into fresh pills. The
`{sh}→token` map lives in a **WeakMap, not on the node**, so it never reaches
JSON/OPML. Because the edit buffer transiently holds `{…}` instead of tokens,
**every whole-tree serialization is wrapped in `withFoldedActive(fn)`** (autosave,
`toOpml`, `toMarkdown`/`toPlainText`, undo `snapshot`) — it folds the active
node's text just for the serialize, so a mid-edit save/refresh never persists raw
`{…}` for an untouched artifact. `unfoldedPrefixLen` translates a folded caret
offset into unfolded coordinates for the insert path. Typed `{…}` shorthand is no
longer promoted live; it stays grammar-styled text while editing and promotes on
exit (`checkInlineHighlight` only re-applies styling, it does not build a pill).

### Render context globals (read this before touching rendering)

`mdInline`'s pill handlers need each node's sidecar data but take no arguments.
`renderContentHTML` sets module-level globals (`diceRenderList`,
`markovRenderList`, `rolltableRenderList`, `mathRenderList`, `varRenderList`,
`globalVarMap`) immediately before calling `mdToHtml`, then clears them after.
This is safe **only because `mdToHtml` is fully synchronous** — there is no
re-entrance. Any change that makes rendering async would break this and must
thread the data through arguments instead.

### Edit-mode serialization and caret math (the subtle part)

Because edit mode mixes editable text nodes with `contenteditable=false` pill
spans, the browser's own caret offsets don't match logical text offsets. A small
suite of DOM-walk utilities keeps them aligned — **edit any one and you usually
have to edit all of them:**

- `editableText(el)` — serialize the live DOM back to `node.text`: text nodes →
  `nodeValue` (ZWSP stripped), `data-token` spans → their raw token string,
  `<br>` → `\n`.
- `getCaretOffset(el)` / `setCaretByOffset(el, n)` — logical character offset
  that counts a pill span as `data-token.length` characters (atomic).
- `rangeOffset(el, container, off)` — same counting for an arbitrary range.
- `positionSlashMenu` / `checkSlash` / `slashApply` — all use the logical offset,
  not raw DOM offsets.

Invariant: a pill span is one indivisible unit. Caret never lands *inside* it; it
lands before or after.

### Render / reconcile

`render()` (≈1374) rebuilds the node DOM from the tree. `attachContentEvents`
wires each `.node-content`'s mousedown/focus/blur/input/keydown. Heights are
measured and reconciled separately (`scheduleReconcile` → `reconcileHeights`) so
the bullet rail and connectors line up; raw edit text can differ in height from
rendered HTML, so editing schedules a reconcile.

`markDirty()` (≈4161) sets the dirty flag, **bumps `_varsVer` to invalidate the
`collectVars()` cache**, and triggers autosave. Undo is hybrid: `recordTextEdit`
is an O(1) per-node text-diff entry; `pushUndo` snapshots the tree for structural
changes.

### Persistence — OPML

`toOpml(root)` / `fromOpml(xml)` (≈1212). Standard OPML `<outline>` elements;
all app-specific data rides on **underscore-prefixed custom attributes**
(`_type`, `_dice`, `_vars`, `_id`, …). Sidecar arrays are `JSON.stringify`'d into
an attribute. `ex()` encodes `\n` as `&#10;` because XML attribute normalization
would otherwise collapse literal newlines to spaces on re-parse. **OPML here is a
storage format, not an interchange format** — the app owns the files, so inventing
attributes is fine, but the data won't survive a round-trip through other OPML
tools.

### Export — Markdown / plain text (one-way snapshots)

`toMarkdown(root)` / `toPlainText(root)` (≈4597). Unlike OPML these are **lossy,
one-way interchange** formats for reading/sharing, not re-import. The key step is
`flattenArtifacts(text, node, varMap)`: every `[[type:key]]` token is replaced
with the *frozen* result it currently shows (dice → `expr = total`, markov →
`a → b → c`, rolltable → its entry, math/var/varref → the resolved value) because
a flat file can't re-roll or recompute. Markdown emits a nested bullet list (2
spaces/level, todos as `- [ ]`, ol numbered, headings bolded, tables as raw md
blocks); plain text is tab-indented with `stripInlineMd()` removing emphasis
markers. Neither calls `markClean()` — OPML save remains the canonical "saved".

---

## The two-engine reality

Conceptually the artifacts reduce to two engines plus pure helpers. Useful framing
when proposing features:

**Engine 1 — generative / random.** Two layers:

- *Legacy per-feature cores* (`dice`, `markov`, `rolltable`): each is a parse step
  (`parseDice`, `parseMarkov`, `parseRolltable`) producing a structured form, plus
  a roll/walk step producing displayed state. These still back their own pills.
- *Unified grammar engine* (`runGrammar`, `expandTemplate`, `resolveBrace`,
  `expandRule`, `parseRules`, `expandText`) — a recursive-substitution engine
  (Tracery-style) that **is** the composition layer. One brace syntax `{...}`
  covers everything, content-sniffed inside `resolveBrace`: top-level `|` →
  weighted alternation (`{a|b 2|c}`); leading `=` → expression (`{= 2*r}`, calls
  `evalMath`); a dice pattern → a roll (`{2d6}`, calls `parseDice`/`rollParsed`);
  a bare identifier → a named rule/table (`{color}`) if one exists, else a
  document **variable's** value (`{strength}`), else a `{name?}` marker. Names are
  **document-wide**: `collectRules()` walks the tree (mirroring `collectVars`,
  cached on `_varsVer`) and merges into one namespace both every grammar pill's
  rules *and* every **named roll table** (its entries become a weighted
  alternation rule), so `{rule}`/`{table}` resolve across nodes. Cycles (`a→b→a`)
  and runaway depth are caught lazily during expansion (`↻`/`…` markers) — no
  eager resolution. `expandText(str)` runs `{...}` in any plain string against the
  doc namespace; **roll-table entries flow through it**, so an entry can roll dice
  (`{2d6} gold`), call a rule, or reference another table. The `[[grammar:KEY]]`
  pill freezes its expansion like dice/rolltable; click re-generates. Pure and
  Node-testable.

  *Typed shorthand → pill promotion* (`promoteBraceBody`, `promoteInlineShorthand`):
  you can **write** an artifact instead of using a dialog. Typing a `{…}` whose body
  is a valid artifact promotes it to the matching pill — `{2d6}`→dice, `{= 2*r}`→
  math, `{a|b}` / `{knownRule/table}`→grammar, `{knownVar}`→display-only variable
  pill. Promotion happens on `exitEdit` (catch-all, also covers paste / multiple),
  **not live** — while editing, a completed `{…}` just picks up `.gr-src` grammar
  styling (`checkInlineHighlight`), staying editable text so you can keep tweaking
  it. This is the same mechanism as the unfold model above: in edit mode artifacts
  are grammar text, out of edit mode they are pills. An invalid or unknown body is
  left as literal text — that's the escape hatch.

  Dice, roll tables, and markov chains all resolve through this one engine: a
  table picks a weighted entry then `expandText`s it; dice is a `{NdM}` primitive;
  a **named** markov chain registers in `collectRules` as a typed descriptor
  `{kind:'markov', parsed, start, steps}` and `expandRule` branches on it — an
  array rule is alternation, a `kind:'markov'` rule runs `walkMarkov` and joins
  the path. Markov keeps its own walk core (the stateful step loop) but is now
  callable as `{chainName}` like everything else. Every custom artifact is under
  grammar.

**Engine 2 — expression evaluator** (`evalMath`, ≈3232). A hand-written
recursive-descent parser: `addSub → mulDiv → power → unary → atom`, with
`number()`, `ident()`, constants (`pi`,`e`,`tau`), unary `√`, `^` (right-assoc),
`%`, and functions (`sqrt`,`sin`,`log`,`min`,`max`,…). `ident()` resolves document
variables via the `vars` map passed in. Returns `null` on any malformed input —
callers treat `null` as "invalid".

**Variables tie the engines together.** `collectVars()` (≈624) walks the whole
tree, gathers `[[var:KEY]]` declarations, and resolves them — variables may
reference other variables (`area = pi*r^2`). Resolution is lazy through a `Proxy`
handed to `evalMath`, and an active-resolution stack detects reference cycles
(`a→b→a`), flagging every member of the loop (`_varCycles`) instead of
overflowing. The resolved `{name: value}` map is cached per `markDirty()`
generation and exposed as `globalVarMap` so math/var pills recompute live when a
referenced variable changes. `parseDice` accepts variable identifiers as flat
modifiers (`2d6+str_mod`).

---

## Recipe: add a new inline artifact

Every artifact follows the same path. To add one (say `@oracle`):

1. **Token + sidecar.** Pick a token name `[[oracle:KEY]]` and a node array
   `node.oracle`. Add it to `mkNode()`, `toOpml` (`_oracle` attr), and `fromOpml`.
2. **Pure core.** Write the parse/eval/roll as pure functions returning a record
   `{key, ...}` or `null` on invalid input. Mirror `makeDiceRoll`.
3. **Pill renderer.** `renderOraclePill(key, record)` → returns the pill HTML;
   handle the missing-record case with a `…-bad` class.
4. **Wire into `mdInline`** — one `.replace(/\[\[oracle:([a-z0-9]+)\]\]/gi, …)`
   line that calls `renderOraclePill` against the render-list global.
5. **Render-list global** — add `oracleRenderList`, set/clear it in
   `renderContentHTML`, set the node array source.
6. **Edit mode** — add the `type === 'oracle'` branch in `editModeHTML`.
7. **Dialog** — `openOracleDialog(...)` built on `openInsertDialog` (shared field
   /chip/preview/validate harness).
8. **Slash menu** — add an entry to `INSERT_CMDS` and a branch in
   `insertInlineArtifact` (which splices the token and pushes the record).
9. **Click handler** — add a `closest('.oracle-pill')` branch to the
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
10. **Prune + edit** — `pruneOracle(node)` (drop records with no token) called in
    `exitEdit`; `editOracle(node, key)` opens the dialog prefilled.
11. **CSS** — a `.oracle-pill` block near the other pill styles; reuse the
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

---

## Conventions & invariants (the stuff that bites if ignored)

- **`node.text` is plain text, always.** Never store HTML in it.
- **Complex pills stay atomic in edit mode** (`contenteditable=false`,
  `data-token`); caret math counts them as their token length and depends on it.
  Don't make a *pill's internals* editable. Inline-able artifacts instead *unfold*
  to plain editable `{…}` text (a `.gr-src` span with no `data-token`, counted as
  ordinary characters) — the whole pill becomes text, the atom is never split.
- **Pure cores return `null` on invalid input**; callers branch on `null`. Keep
  parsing/rolling free of DOM access so they stay testable in plain Node.
- **`mdToHtml` must stay synchronous** (render-context globals depend on it).
- **`markDirty()` is the single invalidation point** — it bumps `_varsVer`. Any
  new cross-node cache must be invalidated there too.
- **Theme via CSS custom properties** (`--acc`, `--bg`, `--fg`, `--bdr`,
  `--ring`, `--muted`, …). Don't hardcode colors; dark mode is a media query that
  swaps the variables.
- **Custom OPML attributes are underscore-prefixed.** Add serialize + parse in
  the same change or data silently drops on save.
- **Hover-only affordances need a touch fallback.** Edit pencils, table grips, the
  bullet popup and the `✏ markdown` button are revealed on `:hover` for the mouse,
  but touch has no hover. The `@media(hover:none)` CSS block makes those always
  visible and enlarges tap targets; the bullet's hover popup is replaced by a
  **long-press** (`attachBulletLongPress`, gated on the module-level `IS_TOUCH`,
  which also sets `bullet.draggable=false` since HTML5 drag never fires on touch —
  reordering is done via the popup's Move up/down). `IND` (indent step) is a `let`
  recomputed from viewport width in the `resize` handler. Any new mouse-only
  interaction must ship a touch path the same way.
- **Stateful randomness has nowhere clean to live yet.** Decks/bags (draw without
  replacement) need persisted state; today everything re-rolls statelessly. This
  is an open design question, not an oversight (see below).

---

## Feature status

Implemented:

- **Dice** — `@dice`: `NdM`, `+/-` modifiers, `@var` modifiers, **exploding**
  (`2d6!`), **keep/drop high/low** (`4d6kh3`/`kl`/`dl`/`dh`), **Fate** (`4dF`).
  Rolls stored per-die as chains in `parts[].rolls` (array of arrays); old
  flat-number saves still render via a compat branch in `diceBreakdownHTML`.
- **Markov chains** — `@markov`: weighted transition rules, walk N steps from a
  start state; click to re-walk. An optional **name** registers the chain so
  `{name}` runs a fresh walk from any grammar or shorthand (joined with ` → `).
- **Roll tables** — `@rolltable`: weighted entries; click to re-roll. Entries
  **compose through the grammar engine** (`{2d6} gold`, `{rule}`, `{= expr}`). An
  optional **name** registers the table as a document-wide rule so `{name}` calls
  it from any grammar or shorthand.
- **Grammar** — `@grammar`: recursive-substitution generator (`runGrammar`).
  Named rules `name: a | b 2 | c`, one per line; one brace syntax `{...}` for rule
  refs `{color}`, named tables `{loot}`, named markov chains `{weather}`, variables
  `{strength}`, dice `{2d6}`, expressions `{= 2*r}`, and inline alternation `{a|b}`,
  all nestable. Names are **document-wide** (`collectRules()` — grammar rules +
  named tables + named chains), so any pill can call anything declared anywhere.
  Cycles/depth caught at expansion (`↻`/`…`). Freezes its expansion like dice;
  click to re-generate.
- **Math** — `@math`: recursive-descent evaluator; recomputes live as variables
  change.
- **Variables** — `@var`: named values usable in math (`2*pi*r`) and dice
  (`2d6+str_mod`); **may reference other variables**; reference cycles detected
  and flagged (`↻`, `.var-cycle`).
- **Typed shorthand** — write `{2d6}`, `{= 2*r}`, `{a|b|c}`, `{knownRule}` and it
  promotes to the matching pill when you leave the node (and on paste); while
  editing it stays grammar-styled text. Invalid/unknown bodies stay literal text.
- **Inline token editing** — out of edit mode, artifacts are pills; in edit mode,
  inline-able ones *unfold* to editable `{…}` grammar text (styled `.gr-src`) and
  complex ones stay atomic pills. Raw `[[…]]` tokens are never shown.
- **Pill interaction model** — in display mode a pill is a live widget: a body
  click re-rolls/re-generates in place and **stays rendered** (never enters edit
  mode), the pencil opens the dialog. To edit the surrounding text, click the text,
  not the pill. In edit mode, complex pills (tables/markov) reroll on body click.
- **Collapse to level N** — `collapseToLevel(n)` / `expandAll()` (≈4151) set
  every node's `collapsed` flag by depth relative to the current viewport
  (`focusedId` or root). Toolbar segmented control `1·2·3·All`; keyboard
  `Ctrl/Cmd+1..6` is a best-effort accelerator (browsers may claim those chords
  for tab switching, so the toolbar is the reliable path).

## Planned / ideas (with fit notes for proposers)

Tiered roughly by how much they pull against "keep it simple" (see the brainstorm
that informed these):

- **Tier 1 — pure & stateless (good fit, additive):**
  - Dice already extended; could add reroll (`r`), success-counting pools.
  - Math: conditionals (`if a>b : x | y`), date math, unit conversion — all new
    `evalMath` primitives, no architecture change.
  - Oracle pill (`yes/no` with tunable odds) — straight off the recipe above.
  - Inline quick syntax `{= expr}` / `{NdM}` that evaluates at render without a
    stored record — additive second syntax alongside `[[type:key]]`.
- **Tier 2 — references & state (heavier, real design cost):**
  - Aggregations over children (`sum`/`count`/`avg` of a subtree) — foundation
    exists (`collectVars` already tree-walks); needs a new token type + a
    render-time subtree walk. Reuse `markDirty`/`_varsVer`-style invalidation.
  - Decks / bags (draw without replacement) — **needs persisted per-instance
    state**; decide whether that state lives in the OPML record (portable, ugly)
    or a sidecar. This is the first feature that breaks the stateless purity.
  - Unified grammar engine collapsing dice+markov+rolltable into one
    recursive-substitution engine — the only item that would *refactor* existing
    features. Earns its complexity only once composition (tables calling tables,
    dice inside entries) is actually wanted.
- **Tier 3 — queries / database (different product, cross deliberately):**
  - `{query: tag=todo}`, backlinks, saved views. Turns the outliner into a
    personal DB. Out of current scope.

Other open items:

- [ ] UX pass on the artifact dialogs.
- [ ] Keyboard shortcut to enter edit mode on a selected node without clicking.
- [x] Footnotes — `[^key]` markers + per-node `footnotes` sidecar, edited in the
      bottom `#fn-panel`. Insert via `@footnote` or convert a selection from the
      selection toolbar; hover/click jumps between marker and note. Orphaned
      notes are dropped by `pruneFootnotes()` on `exitEdit`; both md/txt exports
      emit the note text indented under the node. The panel docks above the
      mobile keyboard via `syncFnPanelBottom()` (offset applied only while open,
      so it can't peek when hidden).

---

## Working notes

- Dev branch: `claude/cool-cray-5OQcQ` on `zntznt/pointliner`.
- Pure cores (e.g. `parseDice`, the var-resolution algorithm) are testable by
  copying them into a plain Node script — no DOM needed. Do this for any
  non-trivial parsing/eval change.
