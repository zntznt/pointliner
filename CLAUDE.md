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
> **UX caveat (P5):** "fits very well" is an *engine* judgment, not a *user* one.
> A new pure function or `{…}` branch is cheap for the engine and free to learn
> (it reuses an existing syntax). A new **user-facing syntax / delimiter** is the
> opposite — cheap to add, expensive to learn — and is governed by the UX
> discipline below: reuse the authoring language, don't grow it.
>
> **Locating code:** symbols are referenced by name, not line number — grep for
> the function name. Line numbers are intentionally omitted because they drift
> every edit (a single insert shifts everything below it) and silently rot into
> misdirection; the names don't.

---

## Conventions & invariants (the stuff that bites if ignored)

- **`node.text` is plain text, always.** Never store HTML in it.
- **Three edit-mode treatments for `[[…]]` tokens — pick the right one:**
  (1) **Complex artifacts** (markov, multi-rule or **named** grammar — a name is doc-wide
  callable config the text can't carry, so unfolding would lose it on edit — and *declaring*
  vars) stay **atomic** in edit mode (`contenteditable=false`, `data-token`); caret math counts
  them as their token length. Don't make a pill's internals editable.
  (2) **Inline-able artifacts** (dice, math, display-only vars, *anonymous* single-line grammar)
  *unfold* to plain editable `{…}` text (a `.gr-src` span, counted as ordinary characters).
  (3) **Text-reference tokens** (node **links** `[[#id|label]]`, footnote refs `[^key]`)
  are **plain editable text** in edit mode — the token carries everything, no sidecar, no
  atomic pill; you type/edit it directly and it renders as a widget only in display mode.
  When adding a token type, choose by whether its config is richer than the text (→ atomic
  or unfold) or *is* the text (→ plain editable, like links).
- **Click any empty / non-interactive part of a node to enter edit mode** (caret at the
  click point, end-of-text as the fallback). Interactive elements — bullet, links, pills,
  checkboxes, hashtags, footnote refs, table widgets — keep their own behavior; shift-click
  still range-selects. Navigating into a node places the caret at the end.
- **Pure cores return `null` on invalid input**; callers branch on `null`. Keep
  parsing/rolling free of DOM access so they stay testable in plain Node.
- **`mdToHtml` must stay synchronous** (render-context globals depend on it).
- **`markDirty()` is the single invalidation point** — it bumps `_varsVer`. Any
  new cross-node cache must be invalidated there too.
- **Theme via CSS custom properties** (`--acc`, `--bg`, `--fg`, `--bdr`, `--ring`,
  `--muted`, the semantic `--ok/--warn/--bad/--info`, `--acc-fg`, `--mono`, the `--r-*`
  radius and `--sh-*` shadow tokens). Don't hardcode colors; dark mode is a media query
  that swaps the variables. **The palette lives in two homes:** every theme-varying token
  also exists in the `applyTheme` forced-theme strings (accent-derived ones in
  `applyAccentCSS`) — a CSS-only palette edit silently regresses when the user touches the
  in-app theme toggle. Text on the accent uses `--acc-fg`, never hardcoded `#fff` (dark
  accents are pastels). The full locked visual standard — type roles, scale, color floors,
  component rules, rejected trends — is `guidance/design-language.md`; read it before any
  visual change.
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
- **Run `node --test tests/test.mjs` before and after changing any parsing/eval core.** (`node --test tests/` fails on Node 22.x — it resolves the directory as a module rather than discovering test files; use the explicit path.) All tests must stay green; if you intentionally change a behavior, update the pin in the same commit.

---

## UX discipline (read before any UI work)

The project has strong architecture discipline and, historically, **no UX discipline** — interaction, discoverability, accessibility, and copy were decided ad hoc per feature, which is why similar things behave differently and why the app keeps sprouting new syntaxes. That is now governed. **UX is a first-class acceptance criterion: a change that passes its tests but violates the standard is not done.**

- **Full standard:** `guidance/ux-discipline.md` — vocabulary, principles, keyboard grammar, the syntax inventory, patterns, conformance matrix.
- **Merge gate:** `guidance/ux-definition-of-done.md` — run it on **every** UI-touching change (it is also step 13 of `guidance/adding-an-artifact.md`). Every such change MUST emit a **Conformance Statement** (the gate's "How this gate is run" section); **no statement, no merge.**
- **Fix list:** `guidance/ux-remediation.md` — every current non-conformance, tracked as a defect to close.

**The five principles** (P1 and P5 are the consistency pillars and win on conflict):
1. **Predictable** — a key, gesture, or word means the same thing everywhere. No context-dependent inversions.
2. **Discoverable** — every capability has a visible front door; never syntax-only at the floor. The menu teaches the syntax.
3. **Reachable** — every interactive element is keyboard-operable, named, and focus-visible to assistive tech — added **additively**.
4. **Responsive** — no silent success, no silent failure.
5. **Coherent** — **one authoring language.** Reuse the existing syntax; do not mint a new delimiter, sigil, or grammar without sign-off and the retirement of what it overlaps.

**UX invariants that bite (the most-violated rules — internalize these):**
- **Keyboard is added *alongside* `mousedown`+`preventDefault`, never by converting to `click`/`<button>`** (the caret invariant — the single most load-bearing UX rule).
- **A key never silently changes meaning by block type.** `Enter` = new point, `Shift+Enter` = line break in every block — **Paragraph is the one documented exception** (prose mode: Enter = line break, Shift+Enter = new point; advertised in the `/` menu and empty-state hint). New shortcuts MUST fit the keyboard grammar in `ux-discipline.md` §3.
- **One authoring language.** New generative/computed content plugs into the `{…}` grammar engine or `evalMath` — **not** a new syntax. The §2/P5 syntax inventory is a **closed set**; growing it is an explicit, recorded decision, never a side effect of a feature. (This is the direct counterweight to "fits very well" above.)
- **Built ≠ shipped-discoverable.** A capability reachable only by typed syntax, or gated entirely off with no front door at any verbosity, is non-conformant.

**Opening PRs (so the gate passes first try):** The CI gate reads the **PR description only** — not commit messages, not comments. Every UI-touching PR's description MUST contain the Conformance Statement: start with the literal words `UX Conformance`, a ✅ or N/A on each of P1–P5, and no `< >` placeholders. When creating a PR with `gh pr create`, put the full statement in `--body` (it overrides the PR template). For a non-UI change, the description is just: `UI: none`.

**Canonical vocabulary split:** code keeps `node`/`artifact`; **user-facing copy says "point" and "pill."** Use the standard's §1 terms in every string and `aria-label`. Do not rename the internal identifiers.

---

## Core architecture

### Data model

The document is a tree of plain-object nodes. `mkNode()` is the
canonical shape:

```js
{
  id, text, note, type,                 // type ∈ ul|ol|todo|h1..h6|quote|code|divider|para|base — only para+base special; rest derived hints
  checked, collapsed,                   // checked is a derived cache (todoDoneFromText)
  children: [],                         // nested nodes
  footnotes: [],                        // [{key, text}]
  dice: [], markov: [], math: [], vars: [], grammar: []  // artifact sidecars (legacy `rolltable` migrates into `grammar` on load)
}
```

- **`node.text` is plain text and is the source of truth.** It holds markdown
  (`**bold**`, `- item`, `# heading`) and opaque artifact tokens
  (`[[dice:r3k9x2a]]`). It never holds HTML.
- **Markdown rendering is per-line and element-driven.** `mdToHtml` is a full
  per-line block parser: every line is classified independently (fenced code,
  ATX heading `#`–`######`, thematic break `---`/`***`/`___`, blockquote `>`,
  ul/ol/task list, **GFM pipe table**, definition list, else paragraph), so
  **markdown works on any line of a node**, not just the first — a multi-line
  `para` node is effectively a mini markdown document. Headings/quotes/hr/
  fenced-code render as real `<h1>`…`<hr>`/`<blockquote>`/`<pre>` elements (styled
  via `.md-h`/`.md-bq`/`.md-hr`/`.md-code`), **not** via whole-node CSS.
  `renderContentHTML` passes the **raw** `node.text` (prefixes intact) to
  `mdToHtml` for this reason; `node.type === 'code'` is the one whole-node
  exception, rendered by `codeNodeHTML`.
- **A markdown pipe table renders statically (read-only) in any point.** `mdToHtml`
  detects a GFM table (a header row immediately followed by a *matching* delimiter
  row — `tableDelimCells` is the false-positive guard, so prose with pipes and a
  `---` thematic break are left alone) and emits a static `<table>` via
  `renderStaticTable`, **reusing the table CSS** so it looks identical to a base:
  alignment from the delimiter colons, cell content through `mdInline` (artifact
  tokens render as frozen pills), and an optional trailing `#+TBLFM:` line computed
  via `computeTable` and **hidden** in the render. This is a **render-layer
  behavior only** — `node.text` is never modified, so edit mode shows the full raw
  markdown (recipe line included), the same edit-raw / render-pretty model as
  headings. The **interactive base** (`node.type === 'base'`) is a *separate
  object* — `buildTableWidget`, dispatched in `render()`, **not** through
  `mdToHtml` — and is untouched by the static path. The `/base` verb creates one
  (non-destructively — see `createBaseAt`); `@table` inserts the static form. (See
  `guidance/bases-direction.md`.)
- **The markdown-first node model: only `para` and `base` are special types.**
  `node.type` for headings/quote/**to-dos** is a derived hint, not the renderer.
  Headings/quote/code still store their prefix in `node.text` (`"# Title"`) and
  `deriveTypeFromText()`/`checkMdBlockPrefix()` still set `node.type` (`'h1'`) for
  bullet-dimming, OPML round-trip and the type-switcher — but the **visual comes
  from the markdown element `mdToHtml` emits**, so a `#`/`>` on line 2+ formats
  too. **To-dos derive the same way**: a node is a to-do because its text says so —
  task form (first line `- [ ]`/`- [x]`, checkbox via the md-task path) or status
  keyword form (`#TODO|#NEXT|#WAITING|#DONE [#A]` at the start — note the `#` prefix,
  which reuses the hashtag sigil; bare `TODO` without `#` is plain text, never a badge)
  — and `node.checked` is a derived cache (`todoDoneFromText`: keyword DONE, or
  every task marker checked). `/todo` and `/state:KW` are **markdown-writing
  helpers**, and Enter inside a formatted node continues the format by writing the
  prefix into the new sibling (`continuationPrefix`: `- [ ] `, `#KEYWORD` with
  `#DONE→#TODO`, `> ` for quotes) — never by setting a type flag. Legacy
  `_type="todo"` nodes are migrated on load (`migrateTodoText`, in
  `migrateNodePrefixes`); bare-keyword saves (`TODO body`) are deliberately NOT
  migrated — a load-time rewrite would also capture plain prose typed after the
  change, re-introducing the bare-word false-positive the `#` form removes. `textForDisplay()` (prefix-, marker- and keyword-
  stripped) is used for breadcrumb/search, not for the main render; to-do exports
  emit the raw text since it carries its own marker. `ol` ordinals were the last
  type-driven straggler — resolved by UXP-25 (text carries `1. ` prefix; type derives
  from text; display renumbers from sibling position via `olNum()`; `migrateNodePrefixes`
  adds the prefix to legacy nodes). Italic/underline flags were retired by UXP-27 — legacy `_italic`/
  `_underline` OPML attrs fold into the text as `*…*`/`++…++` on load via
  `migrateEmphasisText` and are never written back); dividers derive from the text since
  UXP-26 (first line a thematic break `---`/`***`/`___`; lines below it are the
  hover-reveal section label — `migrateNodePrefixes` writes the break into legacy
  type-only dividers on load). Inline emphasis supports both
  `**`/`__` (bold), `*`/`_` (italic), `***`/`___` (both); underscore forms are
  word-boundary-guarded so `snake_case` stays literal.
- **Artifact sidecars** (`dice`, `markov`, etc.) are arrays of records keyed by a
  random `key`. The token `[[dice:KEY]]` in the text is the only inline trace;
  the record `{key, ...config, ...rolledState}` holds everything else. A record
  with no matching token in the text is dead weight and is dropped by the
  `pruneXxx(node)` functions on `exitEdit`.

### Token ⇄ pill: the central mechanism

A "pill" is the rendered widget. The same token renders two ways depending on
mode:

- **Display mode:** `renderContentHTML(node)` → `mdToHtml` → `mdInline`.
  `mdInline` finds each `[[type:key]]` and calls the matching
  `renderXxxPill(key, record)` to produce HTML, stashed as an opaque
  `\x00N\x00` placeholder so later passes (emphasis, emoji, hashtags, autolink)
  can't reach inside the pill markup. Placeholders are un-stashed at the end.
- **Edit mode:** `editModeHTML(node)` renders two ways depending on the
  artifact. **Complex artifacts** with no clean inline form (markov chains,
  multi-rule or *named* grammars, *declaring* variables) emit the *same* pill HTML
  wrapped in `<span contenteditable="false" data-token="[[type:key]]">…</span>` —
  atomic, uneditable, edited via the pencil/dialog. **Inline-able artifacts**
  (dice, math, display-only variables, *anonymous* single-line grammars) are *unfolded* to
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
offset into unfolded coordinates for the insert path; `foldedOffsetFor` is its
inverse — any offset captured against the edit buffer that outlives a blur (the
`@` menu / selection-toolbar dialogs) must go through it before splicing into the
refolded text, which `applyInlineReplace` does centrally (UXP-30). **The folded-
coordinates invariant:** undo entries and `dataset.prevText` always hold folded
text — `flushActiveTextEdit` records `foldedTextForSave(node)`, never the raw
buffer (UXP-31). Typed `{…}` shorthand is no
longer promoted live; it stays grammar-styled text while editing and promotes on
exit (`checkInlineHighlight` only re-applies styling, it does not build a pill).

### Render context globals (read this before touching rendering)

`mdInline`'s pill handlers need each node's sidecar data but take no arguments.
`renderContentHTML` sets module-level globals (`diceRenderList`,
`markovRenderList`, `mathRenderList`, `varRenderList`,
`grammarRenderList`, `globalVarMap`) immediately before calling
`mdToHtml`, then clears them after.
This is safe **only because `mdToHtml` is fully synchronous** — there is no
re-entrance. Any change that makes rendering async would break this and must
thread the data through arguments instead.

The **one deliberate re-entrance** is the link *mirror* (`[[#id|]]` transcluding the
target node's rendered content inside a link). Because that render happens *during*
`renderContentHTML` of the source node, `renderNodeInline` must **save the
current globals, set them for the target, render, and then RESTORE them** (not clear
to null — that would break the rest of the source render). A depth guard caps nesting
at 1 (a link inside a mirror renders title-only) so `A↔B` links can't recurse. Any new
"render a node inside another" path must follow the same save/restore + depth discipline.

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

`render()` rebuilds the node DOM from the tree. `attachContentEvents`
wires each `.node-content`'s mousedown/focus/blur/input/keydown. Heights are
measured and reconciled separately (`scheduleReconcile` → `reconcileHeights`) so
the bullet rail and connectors line up; raw edit text can differ in height from
rendered HTML, so editing schedules a reconcile.

`markDirty()` sets the dirty flag, **bumps `_varsVer` to invalidate the
`collectVars()` cache**, and triggers autosave. Undo is hybrid: `recordTextEdit`
is an O(1) per-node text-diff entry; `pushUndo` snapshots the tree for structural
changes.

### Persistence — OPML

`toOpml(root)` / `fromOpml(xml)`. Standard OPML `<outline>` elements;
all app-specific data rides on **underscore-prefixed custom attributes**
(`_type`, `_dice`, `_vars`, `_id`, …). Sidecar arrays are `JSON.stringify`'d into
an attribute. **Doc-level config rides the `<head>`** as underscore-prefixed custom
*elements* (`<_savedSearches>` — JSON content, same serialize+parse-in-one-change
rule). `ex()` encodes `\n` as `&#10;` because XML attribute normalization
would otherwise collapse literal newlines to spaces on re-parse. **OPML here is a
storage format, not an interchange format** — the app owns the files, so inventing
attributes is fine, but the data won't survive a round-trip through other OPML
tools.

### Export — Markdown / plain text (one-way snapshots)

`toMarkdown(root)` / `toPlainText(root)`. Unlike OPML these are **lossy,
one-way interchange** formats for reading/sharing, not re-import. The key step is
`flattenArtifacts(text, node, varMap)`: every `[[type:key]]` token is replaced
with the *frozen* result it currently shows (dice → `expr = total`, markov →
`a → b → c`, grammar → its expansion, math/var/varref → the resolved value) because
a flat file can't re-roll or recompute. Markdown emits a nested bullet list (2
spaces/level, todos as `- [ ]`, ol numbered, headings bolded, tables as raw md
blocks); plain text is tab-indented with `stripInlineMd()` removing emphasis
markers. Neither calls `markClean()` — OPML save remains the canonical "saved".

### Export — self-contained HTML (the app + the document as one file)

`exportSelfContainedHtml()` (File menu → **Self-contained HTML**, C1). Unlike the
lossy Markdown/text snapshots, this is a **fully interactive** export: it clones the
running page (`document.documentElement`), empties the rendered/dynamic DOM (`#outline`,
`#var-panel-list`) so the file is lean and boots fresh, and inlines the current outline
as **OPML** into the `#pl-embedded-doc` `<script type="application/xml">` **data-island**
via the pure core `embedOpmlIntoHtml(html, opml)` (regex injection on the serialized
string — `extractEmbeddedOpml` is its inverse; both Node-testable). The result is one
`.html` file that **is the app and the document**: opening it re-runs the app, and
`restoreEmbeddedDoc()` (which runs *before* `restoreAutosave` and **wins over local
autosave** — a shared snapshot must show exactly what was sent) hydrates `root` from the
island. A loaded snapshot opens **in display mode** (not edit-mode-on-point-1, so pills
render and re-roll) and flashes a one-time P4 notice that it is a read-into-memory
snapshot (edits live in the browser; re-export to save). The data-island is **empty in
the app shell**, so the live editor is untouched. Safe because `toOpml` never emits the
literal `</script>` (user `<`/`>` become entities inside attributes), so raw OPML
round-trips inside a `<script>` data-island. (`guidance/enhancement-research.md` C1.)

---

## The two-engine reality

Conceptually the artifacts reduce to two engines plus pure helpers. Useful framing
when proposing features:

**Engine 1 — generative / random.** Two layers:

- *Legacy per-feature cores* (`dice`, `markov`): each is a parse step
  (`parseDice`, `parseMarkov`) producing a structured form, plus a roll/walk step
  producing displayed state. These still back their own pills. **Roll tables are
  no longer one of them** — collapsed into grammar (June 2026): a named table IS a
  one-rule grammar (`loot: sword | shield 2`); the `[[rolltable:KEY]]` artifact,
  sidecar, and dialog are retired, legacy records migrate on load
  (`migrateRolltables`, frozen result preserved — a migration never re-rolls), and
  `parseRolltable` survives solely to read the legacy entries-per-line format. The
  `@` menu keeps the "Roll table" door: it opens the **table-flavored grammar
  dialog** (same record, teaching copy oriented to tables).
- *Unified grammar engine* (`runGrammar`, `expandTemplate`, `resolveBrace`,
  `expandRule`, `parseRules`, `expandText`) — a recursive-substitution engine
  (Tracery-style) that **is** the composition layer. One brace syntax `{...}`
  covers everything, content-sniffed inside `resolveBrace`: a conditional
  (`{cond: then|else}` — a comparison before a top-level `:`, via `condParts`) →
  Ink-style conditional text (the `cond` is an `evalMath` comparison, the branches
  are templates); top-level `|` →
  weighted alternation (`{a|b 2|c}`); leading `=` → expression (`{= 2*r}`, calls
  `evalMath`); a dice pattern → a roll (`{2d6}`, calls `parseDice`/`rollParsed`);
  a bare identifier → a named rule (`{color}`) if one exists, else a
  document **variable's** value (`{strength}`), else a `{name?}` marker. Names are
  **document-wide**: `collectRules()` walks the tree (mirroring `collectVars`,
  cached on `_varsVer`) and merges every grammar pill's rules into one namespace
  (a named roll table IS one of these — see the collapse above), so `{rule}`
  resolves across nodes. Cycles (`a→b→a`)
  and runaway depth are caught lazily during expansion (`↻`/`…` markers) — no
  eager resolution. `expandText(str)` runs `{...}` in any plain string against the
  doc namespace, so any rule alternative can roll dice
  (`{2d6} gold`), call a rule, or reference another table. The `[[grammar:KEY]]`
  pill freezes its expansion like dice; click re-generates. Pure and
  Node-testable.

  > **UX note (P5):** this engine is also the *reason the UX standard can hold the
  > line on syntax.* Because `{…}` already composes dice, math, rules, tables, and
  > variables, virtually every "I need a new inline thing" can be a new
  > `resolveBrace` branch or `evalMath` primitive — **inside the existing syntax** —
  > rather than a new delimiter. Reach for that before proposing new notation.

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
  roll table is literally a one-rule grammar (weighted alternation — the collapse
  made the engine identity the storage identity too); dice is a `{NdM}` primitive;
  a **named** markov chain registers in `collectRules` as a typed descriptor
  `{kind:'markov', parsed, start, steps}` and `expandRule` branches on it — an
  array rule is alternation, a `kind:'markov'` rule runs `walkMarkov` and joins
  the path. Markov keeps its own walk core (the stateful step loop) but is now
  callable as `{chainName}` like everything else. Every custom artifact is under
  grammar.

**Engine 2 — expression evaluator** (`evalMath`). A hand-written
recursive-descent parser: `ternary → cmp → addSub → mulDiv → power → unary → atom`,
with `number()`, `ident()`, comparisons (`>`,`>=`,`<`,`<=`,`==`,`!=` → 0/1),
conditionals (`a>b ? x : y` and `if(cond,then,else)`), constants (`pi`,`e`,`tau`,
**`today`**), unary `√`, `^` (right-assoc), `%`. Functions live in arity tables:
`FN1` (unary), `FN2` (binary), `FN3` (ternary — `date(y,m,d)`), plus variadic
`min`/`max`. `FN1` holds the math fns (`sqrt`,`sin`,`log`,…), the **unit
conversions** (`c2f`, `km2mi`, … named `from2to`), and the **date component fns**
(`year`/`month`/`day`/`weekday`). **Dates are epoch-day numbers** — `evalMath`
*always returns a number*, so dates compose with arithmetic and variables; date
*formatting* is a display-layer concern only (`asdate(...)` is a numeric identity,
and the math pill renders the result as an ISO date via `formatEpochDays` /
`isDateExpr` / `formatMathDisplay`). `ident()` resolves document variables via the
`vars` map passed in. Returns `null` on any malformed input — callers branch on `null`.
*(Adding a function to `FN1`/`FN2`/`FN3` is the P5-preferred way to extend math —
no new syntax, just a new name inside the existing grammar.)*

**Variables tie the engines together.** `collectVars()` walks the whole
tree, gathers `[[var:KEY]]` declarations, and resolves them — variables may
reference other variables (`area = pi*r^2`). Resolution is lazy through a `Proxy`
handed to `evalMath`, and an active-resolution stack detects reference cycles
(`a→b→a`), flagging every member of the loop (`_varCycles`) instead of
overflowing. The resolved `{name: value}` map is cached per `markDirty()`
generation and exposed as `globalVarMap` so math/var pills recompute live when a
referenced variable changes. `parseDice` accepts variable identifiers as flat
modifiers (`2d6+str_mod`). Both `collectVars(rootNode = root)` and
`collectRules(rootNode = root)` take an optional root: no-arg = the live document
with the per-generation cache (production); an explicit root walks that tree and
bypasses the cache, making them pure functions of their argument (used by tests).
A variable's value is **a number or a string**: a *formula* var evaluates its
`expr` through `evalMath`; a **random pick** var (`kind:'pick'`) carries a frozen
`rolled` string that `collectVars` returns **unchanged on every pass** — the
grammar engine runs only at declaration and on explicit re-roll (`rollPickSource`),
never on a render pass, or the value would change on every keystroke. Display any
varMap value through `formatVarValue` (string-aware), never `formatMathResult`
directly; in math/dice a string value fails to `null` visibly (the type-safety
contract). Direction: `guidance/generation-direction.md` — the reverted
per-expansion bound-picks model (`:=`/`ctx.binds`, PR #51) must not return.

**Node links** are a third document-wide index, same shape as the above — and
**hashtags** a fourth: `collectTags(rootNode = root)` walks the tree with mdInline's
sigil rule (`[[…]]` tokens stripped first so link targets never read as tags), cached
on `_varsVer`; it sources the `#` tag-picker menu (same §7.1 pattern as the `{` picker).
`collectLinks(rootNode = root)` walks the tree for `[[#TARGETID|label]]` tokens and
returns `{ outgoing, backlinks, broken }`, cached on `_varsVer`. A link is **token-in-
text, not a sidecar artifact** — the target id lives directly in `node.text` (like a
footnote ref `[^key]`), so it round-trips through OPML as plain text with no `_link`
attribute and needs no prune. Display: `renderLinkPill` shows a fixed caption for
`[[#id|text]]`, the target's **live** title for `[[#id|]]`, or — when the label is empty
— *mirrors* the target by transcluding its rendered content (display-only, inline; see
the re-entrancy note above). Missing target → `.node-link-broken`. Same-document only
(cross-document waits on the multi-doc workspace). Creation paths: typing `[[`
opens the **link picker** (`LINK_PICKER_ENABLED`, now a kill switch defaulting on —
UXP-4; candidates via the pure `linkCandidates`, applied as the live-title form
`[[#id|]]`; the trigger regex excludes `#` so a raw token is never intercepted), or
"Copy link" → `[[#id|]]` + paste (the keyboard-first power path). Because live
titles are render-time values, `exitEdit` repaints on-screen backlink sources when
a node's text changes, so a rename never leaves stale captions/mirrors visible.

---

## Adding a new artifact or icon

When adding a new artifact type or a Font Awesome icon, see
`guidance/adding-an-artifact.md` — the 12-step recipe and the icon-rebuild workflow
live there. **Step 13 is the UX conformance gate** (`guidance/ux-definition-of-done.md`):
the recipe builds the pill; the gate ships it. Before reaching for a new artifact,
check the P5 syntax inventory — most "new inline thing" needs are a `{…}` branch or
an `evalMath` primitive, not a new artifact or syntax.

---

## Accessibility

The remediation plan in `guidance/accessibility.md` is **complete** (phases 0–5 +
the UXP-19 tree/grid/pill-focus pass; the file is retained for its durable
guardrails). The outline is a flat ARIA tree (`role="tree"`, rows `role="treeitem"`
with `aria-level`/`posinset`/`setsize` stamped in `renderRow` — the virtualized-tree
pattern), interactive bases are `role="grid"`, and pills carry `tabindex="-1"` +
Enter/Space activation. Accessibility is a **per-feature requirement** under the UX
standard (`guidance/ux-discipline.md` §5 / P3): every feature satisfies its
accessible-name, keyboard-operability, and announcement obligations **in the same
pass that builds it**, never as a separate later track. The one durable invariant: **keyboard operability is added
*alongside* `mousedown`+`preventDefault` handlers, never by replacing them** —
bullets, pill pencils, the collapse button and the breadcrumb rely on `mousedown`
to keep focus off the active contenteditable, so converting them to `click`
silently breaks the caret invariant. ARIA attributes are set per-row in the same
`render()` pass; all a11y changes are additive (attributes + CSS), never a visual
redesign.

---

## Feature status

Implemented: Dice (incl. success-counting pools) · Markov · Roll tables (one-rule
grammars since the collapse — the `@` door opens the table-flavored grammar dialog;
legacy `[[rolltable:]]` records migrate on load) · Grammar (named pills show their
callable name; named = atomic in edit mode, anonymous unfolds; incl. Ink-style
**conditional text** `{cond: then|else}` — `condParts`/`resolveBrace`) ·
Math (incl. unit conversion + date math) ·
Variables (two value types: formula, and **random pick** — a frozen, re-rollable grammar
pick; the Perchance-style generation model, see `guidance/generation-direction.md`) ·
Typed shorthand (with a live typo marker for attempted-but-invalid `{…}` bodies —
`classifyBraceBody` keeps edit-mode styling and exit promotion in agreement) ·
Footnotes · Hashtags (incl. the `#` tag picker sourced from `collectTags`) ·
Tables (incl. Org `#+TBLFM:` formulas) · Collapse-to-level ·
Node links (same-doc, incl. live-title "mirror" and the `[[` picker) ·
Click-anywhere-to-edit ·
Per-point notes (`node.note` + `_note` OPML attr: a muted plain-text block under the
point — bullet-menu door, click-to-edit in place, Esc/blur commits, clearing deletes;
plain text only by design, searched, exported as continuation lines; renders in the
zoom view under the title; a **global header toggle** (`#btn-notes`, shown by default,
persisted) hides all notes, leaving a whisper-level `.note-ind` mark on noted points —
click/Enter/Space reveals that one note; typography per the design-language consult:
`.88em`/`1.5` existing steps, `--muted`, no italic, no opacity-faded placeholder) ·
Status states + priorities (`#TODO [#A] body` — the `#` prefix reuses the hashtag sigil;
bare `TODO` without `#` is plain text; to-do-ness fully derives from the text — task marker
or `#keyword` — see the node model above) ·
Sequences (user-definable state sets: the built-in `TODO NEXT WAITING | DONE` is the default;
`@sequence` declares a `[[seq:key]]` pill + `node.seq` sidecar; `/` applies any state as
`#KEYWORD`; done-ness = the keyword sits right of its sequence's `|`) ·
Search query operators (the UXP-20-routed decision: implicit AND, `-` NOT, `"a b"` phrases,
`#tag` word-anchored, `is:done/todo/note`; malformed tokens stay literal text — the `{…}`
escape-hatch rule; OR deferred; no `state:` operator — `#KEYWORD` states are hashtag-shaped
so `#waiting` filters by state for free; pure cores `parseSearchQuery`/`queryMatchesNode`;
doors: the focus-shown legend under the search box + the `?` panel's "Search & filter"
section; the search path ignores the show-done toggle as it always has, so `is:done`/
`-is:done` are the explicit override) ·
Saved searches (star the query to save it doc-level — the raw string is the label;
`root.savedSearches` + the `<_savedSearches>` OPML **head element** (doc-level config; the
one underscore-prefixed custom element — outlines carry custom attributes); chips in the
focus-shown panel apply/forget by mouse or keyboard; pure cores `toggleSavedSearch`/
`isSavedSearch`) ·
Progress cookies (`[/]` fraction / `[%]` percent — a live task tally rendered against the
point's own checkboxes + direct child tasks, each checkbox counted individually and each
keyword/sequenced child once with sequence-aware done-ness; plain text in `node.text` computed
at render like `#+TBLFM:` — no sidecar, OPML round-trips for free; `@progress` front door;
recorded P5 syntax-inventory decision reusing the `[…]` bracket family — UXP-20; pure cores
`tallyMarkers`/`progressCount`/`formatProgressCookie`) ·
Properties (`node.props = [{key, val}]` sidecar array — `_props` OPML attribute (JSON), same
serialize+parse-in-one-change rule; dialog editor from bullet menu "Add property"/"Edit properties"
and chip click; chips render below the note row (gutter mark reuses `.note-mark`), also in the zoom
view; `has:key` / `key:value` search operators added to `parseSearchQuery`/`termMatchesNode` —
`is:` stays a reserved prefix and `is:unrecognised` falls through to text; exported as
`[key: val · …]` continuation lines in markdown/plain text) ·
Templates (named subtree snapshots stored doc-level on `root.templates = [{name, node}]` — the
`<_templates>` OPML **head element**, the second underscore-prefixed custom element beside
`<_savedSearches>`; save door is the bullet menu "Save as template" (name dialog, save-over-name
updates); stamp door is the `/template` slash verb → a picker dialog that deep-clones the chosen
subtree (`deepCloneNodeNewIds`, now also deep-copying the `seq`/`props` sidecars) with fresh ids and
inserts it — replacing the invoking point when empty/childless, else as the next sibling; pure cores
`upsertTemplate`/`removeTemplate`/`findTemplate`) ·
Refile (move a point's subtree to become another point's last child via a "Refile…" bullet-menu
door → the **point-tree navigator**: a search box over the outline shown as an indented,
expand/collapsible tree — browse with ↑/↓ + →/← (expand-collapse / dive-parent, when the box is
empty), type to filter to matches + their ancestors (auto-expanded), Enter picks; "Top level" is the
leading option and the moved subtree is excluded; reuses `performDrop`'s reparent + `isDescOf` for the
self/own-descendant guard; pure model `treeRows` + `pickerTitle`, DOM `renderTreeRows`/`buildTreePicker`,
mover `refileNodeTo`. The tree picker is a reusable component — `treeRows` (pure) and `renderTreeRows`
(DOM) are deliberately decoupled from the modal so a future structural sidebar can reuse them) ·
Capture / quick inbox (a toolbar inbox button `#btn-capture` opens a Capture dialog that overlays
wherever you are — capturing never navigates you; a designated inbox `root.inboxId` (persisted as the
`<_inbox>` OPML **head element**) is set two ways: the bullet-menu **"Set as inbox"** door (the
direct front door — toggles to "Unset as inbox" on the current inbox, flashes a confirmation) or the
Capture dialog's inline **"Choose…"** point picker (the same `buildTreePicker` tree navigator); each capture appends
one **markdown-aware** point — a typed `- [ ]` becomes a to-do — as the inbox's last child; the dialog
stays open after each capture with a running "✓ Captured N" confirmation, Enter captures / Shift+Enter
is a line break; `openCaptureDialog`/`doCapture`/`resolveInbox`. NB the capture-dest picker rebuilds
the dialog *in place* on pick, so it defers the rebuild a frame — the trailing mouseup/click lands on
the inert picker, not the freshly-built main view) ·
Dates (start + due) + Agenda (dates live as `start` and/or `due` properties in `node.props`, value `YYYY-MM-DD` or `today`/`today+N`/`today-N`/`tomorrow` — a point carries a start→due **range**, project-management style; zero new authoring syntax — both keys reuse the existing properties system and parse through `parseDueDate`, which round-trips the parsed epoch back to y/m/d to reject impossible calendar dates — Feb 30, day 32, month 13 — that `Date.UTC` would silently overflow-normalize, and bounds the year to a sane 1900–2200 scheduling window; date-smart chips color-coded by urgency: Today (green) / Tomorrow & this week (accent) / Later (muted) / Overdue (red); the start chip renders with a leading `▸` and never-overdue ink. **Agenda is a vertical stack inside the toolbar** (below the breadcrumb — no sidebar, so it never constrains the outline's width or obstructs a mobile screen; the toolbar's `ResizeObserver` re-pads `body` so extra bars push the outline down rather than overlapping it), toggled by the toolbar calendar button. The **top bar** (`.ag-top`) pairs a **2×2 control grid** (`.ag-controls` — `Timeline · Calendar` / `Done · Running`) on the left with the **always-present List** (`.ag-list`) on the right; **Timeline and Calendar are independent toggles** (persisted as `agendaBars = {timeline,calendar}`) that each open their **own full-width bar** (`.ag-pane`, hairline-topped) **below** the top bar — open either, both, or neither. Flags: **Done** (include completed dated points, off by default; done-ness via `todoDoneFromText`) and **Running** (show/hide the List's bottom row). The bars render the same dated points (`collectDueDates`): **List** — the **top "Due" row** (deadlines not yet started) + **bottom "Running" row** (started points, `start ≤ today`, with elapsed `▶ Nd` plus their deadline; a started point moves from Due to Running, never duplicated; a future-start point with a `due` shows on the Due row, with no `due` it waits until it starts — "show from start onward"); **Timeline** — a **Gantt chart** (`agendaGantt`): each point a horizontal bar on a shared, horizontally-scrolling day axis — a **range bar** start→due, a **1-day bar** for a deadline-only point, an **open-ended dashed "ongoing" bar** (start→today) for a started point with no deadline (rendered neutral, never "overdue", since it has no deadline; deadline bars carry their urgency tint) — with an accent **"today" line**; **Calendar** — a month grid (`agendaMonthCells` over `calendarMonthGrid`) with each point on its day, `‹ Month YYYY › Today` nav that re-`paint()`s in place (focus stays on the nav button, like `buildDatePicker`), up to 3 item-chips per cell then `+N`. Calendar opens on the current month (`agendaMonth`, session-only). The two layout models are **pure cores** (`agendaGantt`, `agendaMonthCells`), test-pinned. Click/Enter any bar/chip to zoom in (the strip stays open — only the calendar button toggles it). `/due` slash verb (labelled **"Schedule"**) + bullet menu "Set / Edit dates" open the two-field Start+Due dialog; **clicking a `due`/`start` property chip routes to the Schedule dialog** (`openPropChip` dispatches on `chip.dataset.propKey`), and date keys are **hidden from the generic Properties dialog** (`DATE_KEYS`-filtered, merged back untouched on save) — dates are a Schedule-dialog concern, not free-form key:value editing. Each Schedule date field carries a **full-width inline calendar** (`buildDatePicker`/`attachDateCalendar`) shown while the field is focused — the caret stays in the text field, `ArrowDown` moves focus into the `role=grid` calendar, arrows navigate, Enter/click picks (writing the ISO date back and returning the caret); day cells act on `mousedown`+`preventDefault` (caret invariant) so a pick never blurs the field, and the close-on-blur check is **deferred** so navigating the grid (an innerHTML rebuild that transiently blurs the focused cell) doesn't collapse it; pure grid cores `calendarMonthGrid`/`addMonths`. The calendar lives in-flow, so `#io-card` scrolls (`max-height:82vh`) to never clip a tall dialog. Search operators `due:`/`start:` `today`/`overdue`/`<date`/`>date` (one date-aware `key:value` extension per key); pure cores `parseDueDate`, `formatDueDate`, `collectDueDates` (now returns `{start, due, started, done, runningDays, …}` per item; the legacy `epochDay`/`iso`/`label`/`state` describe the primary date — due if present, else start — so due-only callers are unchanged); UXP-20 decision recorded: dates live in properties, `due:`/`start:` are date-aware extensions of `key:value`. The agenda + `/due` icons (`fa-calendar-day(s)`) and the capture `fa-inbox` were added to the embedded Font Awesome subset — `FA_GLYPHS` + the `::before` content rules + the solid woff2 re-subset from FA 6.7.2; a glyph missing from the subset paints blank in a raw `<i>` (toolbar buttons bypass the `setIcon` emoji self-heal), so any new icon MUST go through the subset rebuild) ·
Self-contained HTML export (C1: File menu → **Self-contained HTML** — `exportSelfContainedHtml` clones the page, empties the rendered DOM, and inlines the outline as OPML in the `#pl-embedded-doc` `<script type="application/xml">` data-island via the pure core `embedOpmlIntoHtml` / `extractEmbeddedOpml`; opening the file re-runs the app and `restoreEmbeddedDoc` hydrates from the island — winning over local autosave — into **display mode** with a one-time snapshot notice; the data-island is empty in the app shell, so the live editor is untouched; see the "Export — self-contained HTML" section above).
Details: `guidance/features.md`

## Direction, roadmap & backlog

The product direction is now set. Read these before proposing or building:
- `guidance/ux-discipline.md` — **the binding UX standard** (vocabulary, the five principles,
  keyboard grammar, the closed syntax inventory, patterns, conformance matrix). Read before
  any UI work; clear `guidance/ux-definition-of-done.md` before merge.
- `guidance/ux-remediation.md` — every current UX non-conformance, tracked as a defect to close
  (including the standing syntax-sprawl guard).
- `guidance/roadmap.md` — locked decisions + the phased plan (multi-document Zettelkasten,
  node links + backlinks, storage/durability, the lean↔guided UX modes), plus the
  remaining generative-engine ideas.
- `guidance/bases-direction.md` — locked direction for markdown-first rendering and
  Bases (table-vs-base model, freeform-bases philosophy, base layout + header interaction,
  and the scope fence: views/typed-fields/filters are deferred). Read before any
  table/base work.
- `guidance/design-language.md` — **the locked visual standard** (typeface roles + the
  native-or-embedded constraint, the opsz-tracks-size type scale, warm paper/ink palettes,
  contrast floors as merge criteria, the dual-home CSS+JS palette invariant, pill/table/
  shadow/radius component rules, and the binding anti-decisions: no glassmorphism, no
  noise, no red default accent, display ceiling ~2em). Read before any visual change;
  contradicting a Decision there is a regression, not a restyle.
- `guidance/backlog.md` — consolidated, prioritized feature gaps (product-neutral).
- `guidance/enhancement-research.md` — consolidated *inspiration → upgrade* catalogue for the
  generative + computational engine and single-file offline-ness (mechanics mined from Tracery /
  Perchance / Ink / Twine / oracles / Soulver / Calca / Frink / Squiggle / Guesstimate / org-mode /
  TiddlyWiki / Decker, each mapped to a code seam + a P5 verdict). Candidate material for the
  roadmap's interleaving clause — **not a commitment**; companion to `outliner-frontier-report.md`.
- `guidance/ux.md` — the discoverability / verbosity-dial UX *strategy* (vision). **Build discipline:**
  ship a feature's bare interaction first, then add its helpers (chips, hints, menu
  descriptions) as a separate, verbosity-gated overlay, so the app stays lean-compatible.
  Where `ux.md` (vision) and `ux-discipline.md` (standard) ever differ, the standard governs
  behavior; `ux.md` governs the staging of guidance overlays.

Note: internal links + backlinks and a multi-document workspace — previously "out of
scope" in the old roadmap — are now the **planned direction** (Zettelkasten).

---

## Working notes

- Dev branch: `claude/cool-cray-5OQcQ` on `zntznt/pointliner`.
- **Always branch off freshly-fetched `origin/main`.** Before starting any task, run
  `git fetch origin` and cut your branch from `origin/main` — **not** local `main`. A stale local
  clone can leave `main` pointing at an old snapshot, and you won't notice: your branch will pass
  its own outdated tests. Sanity-check you're current — the test count and recently-merged
  files/dirs (e.g. `guidance/`, the latest UXP entries) should match the latest work. If the count
  is lower than the last merge, **STOP**: you're on a stale base.
- Tests live in `tests/`. `tests/load-cores.mjs` harvests the pure functions out of
  `index.html` via a Node `vm` sandbox (no build step, no edits to `index.html`); it
  exposes deterministic-RNG helpers (`seedSequence`/`setRandom`/`resetRandom`).
  `tests/test.mjs` pins them. Run with `node --test tests/test.mjs`. **Workflow for any
  parse/eval/index change:** write the pure core → add its function name to the `need`
  array in `load-cores.mjs` → pin it with seeded assertions in `tests/test.mjs` → confirm
  green → *then* wire the DOM. (Functions that read module-level `root` need an optional
  `rootNode` param to be testable — see `collectVars`.)
- **Verification artifacts stay out of the repo.** Keep verifying changes with headless-browser
  screenshots — that's good practice — but the output is THROWAWAY. Screenshots, Playwright/npm
  installs, temp verification scripts, package.json / package-lock / node_modules: produce them to
  verify, then delete them before committing. NEVER commit them. This is a single-file, no-build
  repo; only source (index.html), tests (tests/), and docs (CLAUDE.md, guidance/) belong in git. If
  a PR needs visual evidence, attach the image to the PR on GitHub (CDN-hosted) — do not commit it.
  Before committing, confirm `git status` shows only intended source/test/doc changes.
- **PR/commit hygiene (public repo).**
  - **No agent attribution or session links.** Never add "Generated by/with Claude Code",
    "Co-Authored-By" agent lines, or `claude.ai/code` session URLs to PR descriptions or commit
    messages. This repo is open — only code and its rationale belong in history, never links to
    private sessions or chats.
  - **PR descriptions follow the exact format.** A short Summary + the UX Conformance Statement
    in the literal required format: start with `UX Conformance`, a ✅ or N/A on each of P1–P5,
    no `< >` placeholders. Do NOT substitute a custom conformance checklist — the CI gate reads
    the PR description and requires the standard form. For a non-UI change the description is
    just: `UI: none`.
  - **Strip the auto-appended session link on EVERY PR — it's a required step, not cleanup.**
    After `gh pr create` (or the GitHub MCP create-PR tool), the integration auto-appends a
    "Generated by Claude Code" `claude.ai/code` session link to the PR body that you don't
    control. Immediately overwrite the body to strip it:
    `gh pr edit <PR_NUMBER> --body "<the exact Summary + UX Conformance Statement, nothing else>"`.
    Then **verify with `gh pr view <PR_NUMBER>`** that no `claude.ai` session link remains —
    reading the created PR back is part of declaring it done. If the link **re-appears after the
    edit**, stop: it's a platform behavior you can't strip from this side; report it so it can be
    handled at the integration/settings level instead of silently shipping the link.
