# Pointliner

A single-file, offline, vanilla-JS outliner with a markdown-style editor and a
family of inline "artifact" widgets (dice, Markov chains, roll tables, math,
variables). Everything — HTML, CSS, JS, and a subsetted Font Awesome — lives in
`index.html`. No build step, no runtime dependencies, no network. Open the file
in a browser and it runs.

**The single-file / no-binaries rules have one sanctioned class of exception: PWA
install assets — and the test for any future one is the safeguard, not the file list.**
An extra companion file (or a binary) is allowed **iff all three hold:** (1) it only
upgrades the **hosted** copy (install / offline / standalone), never the app's logic;
(2) it is **pure enhancement** — `index.html` never depends on it, and its wiring is
**guarded** to be inert + silent where it can't apply (the SW registration skips
`file:`/non-secure contexts and swallows errors); and (3) the **download-and-run identity
is preserved** — a `index.html` opened from disk runs byte-for-byte the same with the file
absent. Meet those and the exception is fine; that is the rule, so don't treat the list
below as frozen (a future `screenshot`/`shortcut` icon, etc. qualifies the same way) — but
don't smuggle app behavior in under the PWA banner either.

The current PWA assets: `manifest.webmanifest`, `service-worker.js`, `icon.svg`, and the
icon PNGs `icon-192.png` / `icon-512.png` (GitHub Pages, `https://zntznt.com/pointliner/`).
They are permanent source (not build artifacts); do not delete them as stray, and keep
paths **relative** (`./`) since the app is served from a subpath. Bump `CACHE_VERSION` in
`service-worker.js` when shipping a build the cache must refresh. **The two PNGs are the
necessary "no binary files in git" exception:** the installed-app icon (manifest +
`apple-touch-icon`) genuinely requires raster PNG (iOS ignores an SVG `apple-touch-icon`
and falls back to the **root domain's** `/favicon.ico`), so `icon.svg` alone is not enough.
Regenerate them from `icon.svg` (render to a canvas at 192/512, export PNG) if the mark
changes; the in-tab favicon is separate and stays the dynamic accent-tinted
`updateFavicon` data-URL.

**Storage & sync model:** Pointliner runs on the user's computer. The user's
filesystem is storage; the user's choice of sync (Dropbox/iCloud/git/none) is
sync. No backend, no auth, no accounts. Features that require running a backend
are out of scope — not deferred, out.

**Product identity (binding — the scope filter for any product/positioning call):**
the canonical answers live in `guidance/product-identity.md`; the two that steer builds:
(1) **the identity is the substrate — a tool for thought** (owner, 2026-07-17): an
instrument for freeform, adaptable thinking in writing. Solo-RPG is the origin and stays
served structurally (bases are the richer form of RPG tables), but it is provenance, not
positioning — do not lead docs, copy, or pitches with the origin story (the one full
telling is `product-identity.md` §2, which amends roadmap #515); (2) **the §0b mission test** — a feature earns its place where it composes with
the generative/computational `{…}` layer; parity with database/PKM apps is the scope creep
the fences exist to stop; (3) **the substrate test** — before shipping a domain-shaped
feature ask "have I reached the substrate of this tool, or am I rushing to solve a problem
with a rigid schema?" (freeform text is primary; every structure is ONE way of organizing
thought, never THE way; the user must always be free to slot the app in and out of their
process). The core, if someone deletes 90% of the features: any bullet can generate or
compute. When a proposal leans database-parity or domain-schema, cite that file before
building.
Do NOT rewrite the README's opening to a narrower pitch; its current shape is the
reference execution of §2.

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
  still range-selects. Navigating into a node places the caret at the end. **A bullet-click
  zooms into the point, EXCEPT on a `para`, where it toggles `node.folded`** — a first-line
  collapse (`setFolded`/`toggleFold`, para-gated), since zooming a lone paragraph is a
  degenerate view swap. `folded` is a distinct field from `collapsed` (which hides children),
  round-trips via `_folded`, and the CSS clamp (`.nt-para.folded>.node-row>.node-content:not([data-editing])`,
  `-webkit-line-clamp:1`) is disabled in edit mode so editing always shows the full text.
  Body-click still enters edit mode on a folded paragraph (the invariant holds); the zoom
  keyboard shortcut (Ctrl/⌘+Enter) and the bullet menu's first row fold it too.
- **Pure cores return `null` on invalid input**; callers branch on `null`. Keep
  parsing/rolling free of DOM access so they stay testable in plain Node.
- **`mdToHtml` must stay synchronous** (render-context globals depend on it).
- **`markDirty()` is the single invalidation point** — it bumps `_varsVer` (as does
  `resetDocCaches()`, the DOM-free twin called on document load/swap). Any new cross-node
  cache must be keyed on `_varsVer` too. **The canonical registry is the nine whole-tree
  caches** keyed on that one generation — `collectVars`, `collectRules`, `collectLinks`,
  `collectTags`, `collectCallables`, `collectSequences`, `knownStates`, `stateCmds`,
  `collectPropKeys` (grep `// doc-cache` for the declarations; the full list also lives in
  the `resetDocCaches` doc-comment). A **tenth** cache MUST join that list AND check/set
  `_varsVer`, or it silently serves stale data; the `doc-cache invalidation` test in
  `tests/test.mjs` pins the wiring (collector-object identity across a generation bump).
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
  **long-press** (`attachBulletTouchGestures`, gated on the module-level `IS_TOUCH`,
  which also sets `bullet.draggable=false` since HTML5 drag never fires on touch —
  reordering is done via the popup's Move up/down). `IND` (indent step) is a `let`
  recomputed from viewport width in the `resize` handler. Any new mouse-only
  interaction must ship a touch path the same way.
  **Two touch-path rules that bite:** (1) a pointer-event gesture MUST have its
  `touch-action` set in CSS *before* the gesture starts (`.node-content` is
  `pan-y pinch-zoom` for swipe-to-indent, `.bullet` is `none` for long-press/drag)
  — without it the browser claims the pan as a scroll and `pointercancel`s the
  gesture mid-flight, and setting `style.touchAction` mid-gesture is a spec no-op;
  (2) a touch button acts on **pointerup gated on movement slop** (see `ebBtn`),
  never on pointerdown — an action that fires on finger-down also fires when the
  user meant to scroll.
- **Stateful randomness lives on the grammar record (resolved).** Decks/bags (draw
  without replacement) and ordered sequences are `{shuffle|cycle|once|stopping: a|b|c}`
  pills — a **grammar record** carrying `mode`/`items` + draw state (`pos` for
  cycle/once/stopping, a remaining `bag` for shuffle), which round-trips through the
  `_grammar` OPML attribute like any frozen roll. Pure cores: `seqParts` (detect),
  `nextSeqIndex` (the state machine — mutates the record), `advanceSeq` (emit, expanded),
  `makeSeqGen` (build). The pill **advances** on body-click (`rerollGrammar` branches on
  `mode`), has no pencil, and **unfolds** to its `{mode: …}` source for inline editing.
  Inside a rule a `{mode:…}` degrades to a stateless pick (no per-instance record there).
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
- **Inline-argument verbs (`/verb:value`) reuse the `/` door, gated narrowly.** Making a dialog-only verb keyboard-first by letting it take a typed argument (`/due:tomorrow` sets the date and skips the dialog; bare `/due` still opens it) is a real P2/P3 win and is **not** new syntax (it reuses the `/` menu, doesn't grow the §2 inventory). But the slash-query parser is **shared by every command**, so the `:value` arm MUST be gated to the specific opted-in verbs (`due`/`start` today) — on any other verb a colon stays plain text (`/quote:x` → quote, `:x` untouched) — and the text-strip MUST be **pinned to the trigger position**, not a possibly-trimmed query length, or it mangles surrounding text. Bare verb → dialog; invalid value → flash why (P4), never silent. Keep the value-parse a pure, `null`-on-miss core (`parseDateSlash`) and pin the gate cases. Full contract: `ux-discipline.md` §7.1a + §3 (UXP-69).
- **Built ≠ shipped-discoverable.** A capability reachable only by typed syntax, or gated entirely off with no front door at any verbosity, is non-conformant. A user-facing feature also ships its entry in the **in-app concept guide** (the `const GUIDE = [` array, surfaced by the "Concept guide ›" button) in the same change — see `guidance/concept-guide.md` for the entry shape, the drift-guard contract, and the AP-style house rules. Every `/` and `@` command id MUST appear in some entry's `covers:[…]` (drift-guard test); bullet-menu/toolbar-only features have no command id and are kept documented by hand.

**Opening PRs (so the gate passes first try):** The CI gate reads the **PR description only** — not commit messages, not comments. Every UI-touching PR's description MUST contain the Conformance Statement: start with the literal words `UX Conformance`, a ✅ or N/A on each of P1–P5, and no `< >` placeholders. When creating a PR with `gh pr create`, put the full statement in `--body` (it overrides the PR template). For a non-UI change, the description is just: `UI: none`. **A local `PreToolUse` hook (`.claude/hooks/check-pr-conformance.mjs`, see `.claude/README.md`) blocks `gh pr create`/`gh pr edit` whose `--body` fails this same check, so a malformed PR is caught before push, not just in CI.**

**Canonical vocabulary split:** code keeps `node`/`artifact`; **user-facing copy says "point" and "pill."** The containing hierarchy is **folder > document > point** (folder = the on-disk collection, was "workspace"; document = the single file you edit, was "outline"/"note"; point = a bullet). "file" stays valid for the on-disk storage ("save to a file"); only stop calling the *document* an "outline"/"note". Use the standard's §1 terms in every string and `aria-label`. Do not rename the internal identifiers.

**No em dashes in user-facing copy (`—` is banned as punctuation).** Every string a user reads — `cmd-label`/`cmd-desc`, slash/insert command `desc`, tooltips/`title`, `aria-label`, shortcut hints, `GUIDE` bodies, flash/status/error messages — uses AP-style punctuation only: a period, comma, colon, semicolon, or parentheses, or a restructured sentence. **Never** substitute a hyphen (`-`) for the dash; if a clause can't stand without a dash, rewrite it. The ONLY surviving `—` are content glyphs, never punctuation: the Divider block icon (`icon:'—'`), the empty-value placeholder in the state/priority dropdowns, the spent-deck marker, and the undefined-variable display. Comments and `guidance/` docs are exempt — this rule is for what renders to the user. (Cleared wholesale in PR #158; do not reintroduce.)

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
  dice: [], markov: [], math: [], vars: [], grammar: [], est: []  // artifact sidecars (legacy `rolltable` migrates into `grammar` on load; `est` = uncertainty fields, B2)
}
```

The **root** node (`mkRoot()`) additionally carries the document-level config that
rides the OPML `<head>`: `savedSearches`, `templates`, `inboxId`, `plugins`,
`docId` (the workspace identity for cross-doc links), and `journal`
(`{mode, targetId}` — see Journal below). These live only on root, not on every node.

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
**A document arriving via `adoptDoc` (OPML/HTML import, new file, swap) never
passes through `exitEdit`, so it would render typed `{…}` as raw source.**
`promoteLoadedShorthand(root)` (a tree-walk over `promoteInlineShorthand`) runs in
`adoptDoc` to promote it on load. Keep it there, or imported docs lose their pills.

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
**The cross-doc mirror rides the same wrapper** (4a, `guidance/cross-document-direction.md`):
`renderNodeInline(node, docId)` with a foreign docId scopes vars to THAT doc (`wsDocVars`,
memoized on `workspaceIndex.gen`) and sets `_inlineDocId` — the foreign render context — so
mdInline's bare `[[#id]]` tokens resolve in that doc (via `renderCrossLinkPill`) and query
pills query that doc's retained tree (`queryRows` with the explicit root), never the live
doc. Positional var maps don't apply cross-doc (documented approximation: foreign pills
read the doc-wide map). The depth guard covers cross-doc chains for free.

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
*elements* (`<_savedSearches>`, `<_templates>`, `<_inbox>`, `<_plugins>`, `<_docid>`,
`<_journal>` — JSON content, same serialize+parse-in-one-change rule; `headEl`/`headJSONArray`
are the shared serialize/parse pair, the validator dropping malformed entries on load).
`ex()` encodes `\n` as `&#10;` because XML attribute normalization
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
  are templates); a **stateful sequence** (`{shuffle|cycle|once|stopping: a|b|c}` — a
  reserved mode keyword before a top-level `:`, via `seqParts`) → a deck/cycle pill
  (stateful as a standalone pill; degrades to a uniform pick inside a rule); a **repeat**
  (`{Nx: template}` — a digit run + `x/X` before a top-level `:`, via `repeatParts`) →
  emit the template N times (1–99), re-expanded independently each time, joined by spaces;
  top-level `|` →
  weighted alternation (`{a|b 2|c}` — a weight is a number **or** a trailing `{= expr}`
  resolved against the doc vars at pick time, A5 dynamic odds: `pickWeightedAlt(alts, vars)`,
  taken only when a non-empty template precedes it so a bare `{= 2d6}` alt stays content);
  leading `=` → expression (`{= 2*r}`, calls
  `evalMath`); a dice pattern → a roll (`{2d6}`, calls `parseDice`/`rollParsed`);
  a bare identifier → a named rule (`{color}`) if one exists, else a
  document **variable's** value (`{strength}`), else a `{name?}` marker; a
  **modified reference** (`{ref.mod}` — a base identifier + `.`-separated suffixes from
  the closed set `cap/title/upper/lower/a/s/ed/ord`, via `modParts`, A1 text modifiers) →
  resolve the base (rule or var) then `applyMods` left-to-right; an **item field**
  (`{item.field}` — a 2-segment ref whose suffix is NOT a modifier, via `fieldParts`,
  **after** `modParts`, A6 hierarchical items) → resolve a dotted sub-rule
  (`sword.damage: 1d8` read as `{weapon.damage}` after picking `weapon`→`sword`; consistency
  across fields rides a **pick variable**, never a per-expansion bind). Names are
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
  pill. Promotion happens on `exitEdit` (catch-all, also covers paste / multiple)
  **and on document load** (`promoteLoadedShorthand` in `adoptDoc`, so an
  OPML/HTML-imported doc's typed `{…}` renders as pills, not raw source),
  **not live** — while editing, a completed `{…}` just picks up `.gr-src` grammar
  styling (`checkInlineHighlight`), staying editable text so you can keep tweaking
  it. This is the same mechanism as the unfold model above: in edit mode artifacts
  are grammar text, out of edit mode they are pills. An invalid or unknown body is
  left as literal text — that's the escape hatch. **A body that *reads* as an attempted
  pill but can't promote no longer fails silently in display mode** (#888): `mdInline` flags
  any leftover `{…}` that `classifyBraceBody` rules `'invalid'` (never `'literal'` prose)
  with a quiet `.brace-attempt` cue + a `braceAttemptReason` tooltip — the render-side twin
  of the edit-mode `gr-bad` marker, so a `{rumor}` / `{2d6x}` that stayed text on load says
  why. **A deterministically-erroring `{= …}` DOES promote** (#889): a `{= convert(10, km, kg)}`
  whose `expandAggExpr` pre-pass introduces a `#ERR` (cross-dimension convert — no answer) is a
  real calculation that errors, so `classifyBraceBody`/`makeMathResult` (lockstep via
  `mathPrepassErrs`) build the math pill and it renders a loud `#ERR (convert)` on every path,
  not raw braces on load. **Glue templates** (#916): a body of nested balanced groups optionally
  glued to bare chunks (`{{Ael|Bor}{ric|wyn}}`, `{{Grey|Salt}haven}`) promotes as ONE anonymous
  grammar pill via `templateParts` — the engine's existing rule-level template expansion surfaced
  at the top level; the sniff is strict (every space-chunk braced, every nested body classifying
  `'artifact'`) so prose braces stay prose, and UNWRAPPED adjacent braces keep their two-pill
  meaning. **Anti-shred** (#916): a failed outer form is never promoted piecemeal — the walks
  (`promoteInlineShorthand`/`promoteCellShorthand`) keep a closed-but-`'invalid'` span intact and
  leave the line-tail of an unclosed `{` alone when it reads as a form, so a mid-authoring
  `{hero := {a|b}{c|d` survives a blur instead of its inner braces becoming fragment pills.

  Dice, roll tables, and markov chains all resolve through this one engine: a
  roll table is literally a one-rule grammar (weighted alternation — the collapse
  made the engine identity the storage identity too); dice is a `{NdM}` primitive;
  a **named** markov chain registers in `collectRules` as a typed descriptor
  `{kind:'markov', parsed, start, steps}` and `expandRule` branches on it — an
  array rule is alternation, a `kind:'markov'` rule runs `walkMarkov` and joins
  the path. Markov keeps its own walk core (the stateful step loop) but is now
  callable as `{chainName}` like everything else. A markov chain is also **typeable
  inline** as `{markov: a→b, b→c}` (`markovParts`/`makeTypedMarkovRoll`, sniffed by
  the reserved `markov:` keyword like `seqParts`): this builds an **anonymous, typed**
  record that **unfolds** back to its `{markov: …}` source in edit mode; a **named**
  chain stays a **dialog** feature and an **atomic** pill (the name is doc-wide config
  the unfolded text can't carry — the same rule as named grammars). Every custom
  artifact is under grammar.

**Engine 2 — expression evaluator** (`evalMath`). A hand-written
recursive-descent parser: `ternary → cmp → addSub → mulDiv → power → unary → atom`,
with `number()`, `ident()`, comparisons (`>`,`>=`,`<`,`<=`,`==`,`!=` → 0/1),
conditionals (`a>b ? x : y` and `if(cond,then,else)`), constants (`pi`,`e`,`tau`,
**`today`**), unary `√`, `^` (right-assoc), `%`. Functions live in arity tables:
`FN1` (unary), `FN2` (binary), `FN3` (ternary — `date(y,m,d)`), plus variadic
`min`/`max`. `FN1` holds the math fns (`sqrt`,`sin`,`log`,…), the **unit
conversions** (`c2f`, `km2mi`, … named `from2to`), and the **date component fns**
(`year`/`month`/`day`/`weekday`). Beside the fixed `from2to` pairs there is a **declarable
unit table** (SR-6 / #875): `convert(x, from, to)` reads unit names as words against a built-in
ratio table (length/mass/volume/time) plus the doc's own `root.units` (declared via File →
Custom units, `parseUnitDecls`/`unitTable`/`convertUnits`, round-tripping the `<_units>` head
element). It is **not** an evalMath primitive — it is substituted to a number in the
`expandAggExpr` pre-pass (`replaceConvert`, innermost-first) so evalMath stays number-only, the
same model as the `sum(prop)` rollups. Multiplicative units only (same-dimension → value, cross-
dimension → `#ERR`); temperature stays on the affine `c2f`/`f2c` FNs. **Dates are epoch-day numbers** — `evalMath`
*always returns a number*, so dates compose with arithmetic and variables; date
*formatting* is a display-layer concern only (`asdate(...)` is a numeric identity,
and the math pill renders the result as an ISO date via `formatEpochDays` /
`isDateExpr` / `formatMathDisplay`). `ident()` resolves document variables via the
`vars` map passed in. Returns `null` on any malformed input — callers branch on `null`.
*(Adding a function to `FN1`/`FN2`/`FN3` is the P5-preferred way to extend math —
no new syntax, just a new name inside the existing grammar.)*
**Subtree aggregation** makes evalMath see the tree: a math pill may roll up a child
**property** — `{= sum(cost)}`, `{= avg(score)}`, `{= count(cost)}`, `{= min(cost)}`,
`{= max(cost)}` — over the point's **direct children**. The argument is a property *key*,
not a value, so it is substituted to a number **before** evalMath (`expandAggExpr` →
`aggregateChildren` → `childPropNumber`, the `#+TBLFM:` translation model — keeps evalMath
number-only, no parser change). It is **render-time + no sidecar**: the `{= …}` recipe stays
in `node.text` and recomputes live as children change, because the current render node is the
existing `cookieNode` render global (the same one the `[/]` cookie uses) and any property edit
triggers a full `render()`. `renderMathPill` / `flattenArtifacts` pass the node; node-less
callers (validation) aggregate over an empty set → `0` for sum/avg/count, and the **identity
element** for the extremals — `min` of ∅ = `+∞`, `max` of ∅ = `-∞` (so an F2 range constraint
is *vacuously true* on a point with no qualifying child, not spuriously false on a 0 sentinel).
**`min`/`max` over children IS now included** (the spreadsheet `MIN(col)` overload): it is
**purely additive** because evalMath's numeric `min`/`max` already require **≥2 args** (single-arg
`min(ident)` was already an error there), and the aggregation regex matches only a *single bare
identifier* — so a comma'd `min(a, b)` keeps the numeric-variadic meaning, untouched. Only
**numeric** child props aggregate (`childPropNumber` skips non-numbers, incl. date strings) — so
a date-property extremal like `max(due)`/`min(start)` **now aggregates** — `childPropNumber` tries
`Number` first (so `"5"` stays `5`), then `parseDueDate`, so date-shaped values roll up as
**epoch-days** (wrap in `asdate(...)` to display the result as a date). Only date-shaped strings
parse (strict `parseDueDate`); a plain word still → `null` (skipped). **Word count joins the
family over *prose* (2026-06-19):** `{= words(subtree|self|children)}` — `subtreeWords`/`countWords`,
the *same* `expandAggExpr` substitution, so it resolves in pills, the math/check dialogs, and export
alike — counts words in a **scope** rather than a property: `subtree` = self + every descendant (so it
**recurses**, unlike the direct-children property rollups), `self`, or `children`. A per-point note
is **excluded by default** (#827 owner decision); the optional second arg `words(scope, notes)` opts
notes back in. Reading time is composition (`{= words(subtree)/200}`); there is no separate `readtime`.
**Query reducers generalize `count("query")` (SR-8 / #877):** `{= sum|avg|min|max("query", prop)}`
reduces a property over a **live query set** — every point in the render node's subtree matching the
quoted search — via `queryReduce` (`collectScoped(scope, Infinity)` + `queryMatchesNode` +
`childPropNumber` + the shared `reduceAgg` identity semantics; `queryCountIn` is now a thin
`queryReduce('count', …)` delegate). A **quoted** first arg is the disambiguator (the bare arm needs
an identifier first arg), so the two coexist with no ordering dependency. An empty match reduces to
the identity **silently** (like `count("query")`) — an empty query is a valid dynamic answer, not a
typo signal, so it deliberately does NOT feed `firstEmptyRollup`/`aggHasSkippedValues` (those guard
the tight child-set rollups). Works in checks for free (`evalCheck` → `expandAggExpr`).
**A trailing `, folder` widens a quoted reducer to the whole reading set** (4c,
`guidance/cross-document-direction.md`): `{= sum("has:cost", cost, folder)}` / `{= count("q", folder)}`
route to `queryReduceFolder` — a per-doc-context walk over `wsAllDocRoots()` (own doc LIVE, others
as saved), memoized on (`workspaceIndex.gen`, `_varsVer`) so the measured 1.5–31 ms folder walk never
runs per render pass (`_qrfMemo`/`_qpfMemo`, cleared in `resetDocCaches`). Only the word `folder`
matches; any other third word stays literal → #ERR. No workspace → a folder of one (the live doc).
`renderMathPill` names the staleness ("Folder totals count other documents as saved") in title/aria.
**A trailing `, document` (or `, doc`) widens a quoted reducer to the WHOLE current document** (#914):
`{= count("is:todo", document)}` searches `root`, not the pill's subtree — the explicit door for a
dashboard pill that lives on a leaf, without changing the default subtree meaning of every existing
reducer. Routes to `queryCountIn(q, root)` / `queryReduce(fn, q, prop, root)` (same regex arm as
`folder`, `folder|document|doc`). Its companion is the **leaf cue** (P4): a subtree-scoped quoted
reducer sitting on a point with **no descendants** can only ever return the identity — structural
emptiness, distinct from "candidates exist, none matched" (the legitimate silent dynamic 0). The pure
`queryReducerLeaf(expr, node)` (a quoted reducer, not already widened, `collectScoped(node, ∞)` empty)
gates a quiet `renderMathPill` "0 in scope" state (reusing the `math-empty` chrome) naming the two
fixes: move the pill onto a parent, or add `, document` / `, folder`.

**Engine 3 — uncertainty sampler (B2).** Because `evalMath` *always returns a number*, a
**distribution can't ride it** — so the `est` artifact has its own tiny Monte-Carlo engine,
deliberately separate. An estimate is an uncertain expression — `lo to hi` (a 90% CI →
lognormal, p5=lo/p95=hi; normal fallback when a bound ≤ 0), `normal(m,s)`, `uniform(lo,hi)`,
scalars, `+ − × ÷`, and `sum(prop)`/`avg(prop)` over **children's uncertain properties** — parsed
by `parseUncertain(expr, vars?)` (tokenizer + recursive descent; precedence loosest-first `to` < `+−` < `×÷`
< unary < atom) into an AST that `sampleUncertain(expr, n, seed, node?, vars?)` samples into a length-`n`
**array** (distributions **zip** element-wise under arithmetic; scalars broadcast; `sum/avg(prop)`
parse each child's prop string and zip-aggregate, child-as-node so nested rollups resolve). **An
expression may reference declared variables (SR-7 / #876):** a bare word resolves against the
threaded `vars` map (a `{k:'var'}` AST node broadcasting the numeric value like a scalar; a
text/non-finite var fills `NaN` → `#ERR`, the type-safety contract). `vars` is the **doc-wide**
map (`collectVars()` / render-set `globalVarMap`), the same map `promoteBraceBody` uses for every
other var sniff, so classify/promote/render agree on which names exist; `parseUncertain(b, vars)`
is the promotion gate, so an unknown word (`{note to self}`) still fails → stays literal. The
record is **`{key, expr, seed}` — not the samples**: re-sampling from the seed (`rngFromSeed`,
mulberry32) reproduces the exact distribution, so it round-trips through `_est`, a C1 snapshot
reproduces it, and a click just re-seeds (`rerollEst`). Display is `mean ± [p5,p95]` + a
**pure-string unicode sparkline** (`distSummary`/`sparkline`/`formatDist` — export-safe, the same
string in the pill and `flattenArtifacts`). Live like B1 — Phase-2 rollups recompute through the
`cookieNode` render global. The pill freezes + re-samples on click (dice model), unfolds to its
`{expr}` source in edit mode, and promotes from the `{lo to hi}` constructor shorthand
(`estParts` — constructors only, so a bare `{sum(cost)}` never diverges from `{= sum(cost)}`
deterministic math; rollups are `@estimate`-dialog-authored). The engines stay **separate in v1**:
an estimate inside a `{= …}` math expr fails visibly, like any non-number — and **legibly**:
`mathErrorReason` sniffs estimate-constructor syntax (`to`/`normal(`/`uniform(`) and returns the
`estimate` code, so the math dialog, the `/check` dialog and `#ERR` pills name the boundary
(`mathReasonPhrase` is the one shared code→phrase map, P1) instead of reporting a misleading `bad ref`.
All cores are pure +
Node-testable. Direction: `guidance/enhancement-research.md` B2 (frontier F3).

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
`rolled` string that `collectVars` returns **without re-rolling on any pass** — the
grammar engine runs only at declaration and on explicit re-roll (`rollPickSource`),
never on a render pass, or the value would change on every keystroke. A pick whose
frozen roll **is a number** resolves **as a number** (`resolveVarDefs` coerces), so
a captured die (`{r := 1d20}`) composes with conditionals and math
(`{r == 20: …}`, `{= r + mod}` — the crit-check pattern). Display any
varMap value through `formatVarValue` (string-aware), never `formatMathResult`
directly; in math/dice a *text* value fails to `null` visibly (the type-safety
contract is for text, not for numbers it would mislabel). Direction: `guidance/generation-direction.md`. **The reverted thing is the
per-expansion bound-picks *scope* (`ctx.binds`, PR #51) — that must not return.** The `:=`
*operator itself* HAS shipped, as **typed inline variable declaration** `{name := expr}`
(`parseVarDecl`): it is sugar that promotes to a normal persistent `[[var:key]]` record in
`node.vars` (`typed:true`), never a per-expansion scope, so it is the same variable system, not
the reverted model. **Stage B, positional resolution** (`varMapAt(node)`/`resolveVarDefs`) further
supersedes the old global declare-once / call-anywhere model: a `{name}` resolves to the nearest
preceding `{name := …}` in document order, falling back to the global map when there is no anchor.
See `guidance/typed-var-declaration-proposal.md` (Status: SHIPPED).
**Variable bases project dotted variables.** A base marked `node.varbase = {name?}` (OPML
`_varbase`; query bases never qualify) projects each data row as dotted defs — row "Orc" +
column "HP" → `orc.hp`, readable in `{Orc.HP}` and `{= Orc.HP + 5}`, chaining like any formula
var; column 0 projects under its own header (`orc.name` = "Orc"); an optional base name prefixes
everything (`monsters.orc.hp`). The pure `varBaseDefs(node)` (memoized: `varBaseDefsMemo`, a
self-invalidating per-node Map like `_varMapAtCache`) is consumed at exactly TWO gather hooks —
`collectVars`'s walk and `collectNodeDecls` (covering both positional walks) — so a variable
base is a declaration site at its document position. Cell rule (NOT `varDeclIsPick`): leading
`=` → formula, bare number → number, else frozen TEXT verbatim (so a plain-text `2d6` cell is
text). **A cell that IS a single dice/grammar pill projects its FROZEN roll** (`total`/`result`
via the pick channel) — the pill is the store, no rolls sidecar; a re-roll/edit on a projecting
base goes through `repaintAfterRoll` (full `render()`, the `rerollPickVar` idiom) so every
referencing point repaints; the base bullet menu's Pills section is the keyboard re-roll door.
**Text edits repaint the same way (bases round 1):** a cell focusout patches in-base sibling
pills (`mtPatchCells`, recipe or not) and schedules the deferred, focus-aware
`scheduleVarBaseRender` for the outline (never a synchronous render in focusout; handed to a
live editor's `exitEdit` via `_pendingVarBaseRender`); the markdown-edit path of a projecting
base full-`render()`s. Both base commit chokepoints (cell focusout + the exitEdit base branch)
share ONE tail — `mtCommitEpilogue(node)`: prune orphaned pill records, re-bump the generation
past the per-cell promotion (the classification pass caches `varBaseDefsMemo` from
pre-promotion text), re-run the recipe — returning WHICH repaint is due (`'full'` after a
recompute; `'tokens'` on a projecting varbase, where `mtPatchCells` patches only pill-token
cells — the measured round-4 fix, ~870ms → O(pills) at 5k rows). `isVarBase(node)` is the one "projecting variable
base" predicate. **Base model reads split by intent (round 2):** paint paths (widget build,
`mtPatchCells`, cell focusin) read `mtModelRead(node)` — a ver-guarded + text-checked per-node
parse memo whose model is SHARED and treated as immutable — while every path that mutates rows
then `mtCommit()`s stays on `mtModel(node)` (fresh parse); the per-keystroke cell handler
reuses its own last-commit parse, self-invalidating via the committed text.
**Column totals**: `{= sum(base.col)}` (also `avg/count/min/max`) aggregates a NAMED base's
column via `aggregateVarBaseColumn` over the vars map (`expandAggExpr(expr, node, vars?)` — the
prop group admits dots; bare props keep the child-prop meaning; unmatched dotted calls stay
literal → #ERR). Bare row names deliberately do NOT project (rules would silently shadow them).
Full direction: `guidance/bases-direction.md` §7b; the recorded P5 note:
`guidance/ux-discipline.md` §2.
**Base cells promote typed `{…}` PER CELL, never through the whole serialized table.**
`promoteCellShorthand(node, cellText)` is the cell-scoped promoteInlineShorthand (records to the
node sidecars, token spliced into the cell string); the cell `focusout` handler runs it after
`mtCommit`, and `promoteLoadedShorthand` uses a per-cell base branch for the same reason the
whole-text walk was a bug: it ran `matchBrace` over the ESCAPED serialized text, so a `{a | b}`
cell's brace spanned a row delimiter and the promotion ate a cell boundary (column shift). Per
cell, a brace can only close inside its own cell, and load/focusout produce identical results.
Cells show raw `[[type:key]]` tokens while being edited (no unfold there, by design).

**Declarative data packs (plugins) merge into both collectors.** `root.plugins`
(the `<_plugins>` OPML head element) is a list of **pure-data** packs — extensibility
is **data only, never code** (the locked gate: `guidance/plugins-direction.md` §0–1;
no `eval`/`Function` in the pack path). A pack carries grammar `rules` (one-per-line
`parseRules` text) and formula `vars` (`{name, expr}` → `evalMath`); both flow through
the **existing restricted engines** only. They merge at **collect time**: `collectRules`
calls `mergePackRules(merged, root.plugins)` **before** the tree walk and `collectVars`
seeds `packVarDefs(root.plugins)` into `defs` **before** the `[[var:]]` gather — so a
**document-authored name overrides the pack** on collision (packs go in first; the
existing last-wins merge does the rest), and pack vars resolve through the same lazy
`Proxy` + cycle detection. Because packs live on `root`, the `_varsVer` cache already
reflects them; any *future* mutation of `root.plugins` must `markDirty()`. Robustness:
`validPluginPack` (shape guard — a plain object with a string `id`) is both the
`headJSONArray` load validator and the collector guard, and malformed `rules`/`vars`
inside a kept pack are neutralized defensively at use (`parseRules`→`null`,
`evalMath`→`null`, non-array `vars` skipped) — a hostile `<_plugins>` never throws or
executes. A pack var may be a **formula** (`{name, expr}`, evalMath) or a **random pick**
(`{name, kind:'pick', expr:source, rolled}` — rolled once at author/import time via
`rollPickSource`, frozen in the pack, resolved by `collectVars` through the same `pickVals`
path as a document pick var; #585). The pack manager (`openDataPackManager`, #487) is the
authoring UI. A pack may also carry **templates** (`templates:[{name, node}]`, #583) — reusable
subtree snapshots merged into the `/template` picker via `mergedTemplates` (document wins on a name
tie), stamped by deep-clone with fresh ids like any template; authored by importing a pack (no
textarea UI for a subtree), badged in the picker, not deletable there. Emoji packs, and packs
carrying stateful decks/sequences, stay out.

**Node links** are a third document-wide index, same shape as the above — and
**hashtags** a fourth: `collectTags(rootNode = root)` walks the tree with mdInline's
sigil rule (`[[…]]` tokens stripped first so link targets never read as tags), cached
on `_varsVer`; it sources the `#` tag-picker menu (same §7.1 pattern as the `{` picker).
The tag grammar is `#` + `[\w-]+` segments joined by `/` for **nested tags**
(`#thread/torn-letter`); search is hierarchical (`#thread` matches `#thread` and any
`#thread/…`, an exact subtag matches only itself). This pattern is **mirrored in three
places that must stay in lockstep**: `mdInline` (render), `collectTags` (index), and
the search-query parser/`termMatchesNode`. Change one, change all three.
`collectLinks(rootNode = root)` walks the tree for `[[#TARGETID|label]]` tokens and
returns `{ outgoing, backlinks, broken }`, cached on `_varsVer`. A link is **token-in-
text, not a sidecar artifact** — the target id lives directly in `node.text` (like a
footnote ref `[^key]`), so it round-trips through OPML as plain text with no `_link`
attribute and needs no prune. Display: `renderLinkPill` shows a fixed caption for
`[[#id|text]]`, the target's **live** title for `[[#id|]]`, or — when the label is empty
— *mirrors* the target by transcluding its rendered content (display-only, inline; see
the re-entrancy note above). Missing target → `.node-link-broken`. **Cross-document links**
(`[[docId#nodeId|label]]`) now also ship on the multi-doc workspace (delivered June 2026: the
workspace-wide index CF-1, navigation CF-2, the folder-spanning `[[` picker CF-3, cross-doc
backlinks CF-4, "+ New note" CF-5; see `guidance/features.md`). **The cross-doc MIRROR shipped
2026-07-18** (4a, `guidance/cross-document-direction.md`): `[[docId#nodeId|]]` transcludes the
target from the index's retained tree ("as saved" in its title/aria — the staleness is visible,
P4), on the §5 spine — `workspaceIndex.gen` (the folder's `_varsVer` twin; every cross-doc memo
keys on it), `wsDocRoot` (own-doc-liveness chokepoint: the current doc always reads live),
`wsDocVars`, `findNodeInRoot`, and refresh-on-save (`refreshOwnDocInIndex`, throttled, called
from `flushWorkspaceFile`). Backlink rows show a context line (`backlinkSnippet`, 4d). Creation paths: typing `[[`
opens the **link picker** (always on since
UXP-4, rollout kill switch retired 2026-07-02; candidates via the pure `linkCandidates`, applied as the live-TITLE form
`[[#id]]` — no pipe; since #805/UXP-204 the pipe carries meaning: `[[#id]]` = title reference (every creation door's
default), `[[#id|]]` = the explicit typed mirror/transclusion, `[[#id|text]]` = fixed caption — the trigger regex
excludes `#` so a raw token is never intercepted), or
"Copy link" → `[[#id]]` + paste (the keyboard-first power path). Because live
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

Implemented: Dice (incl. success-counting pools + reroll-once `rK`) · Markov · Roll tables (one-rule
grammars since the collapse — the `@` door opens the table-flavored grammar dialog;
legacy `[[rolltable:]]` records migrate on load) · Grammar (named pills show their
callable name; named = atomic in edit mode, anonymous unfolds; incl. Ink-style
**conditional text** `{cond: then|else}` — `condParts`/`resolveBrace`; and **text
modifiers** `{ref.mod}` — a `.mod` suffix on a rule/var reference, closed set
`cap/title/upper/lower/a/s/ed/ord`, chainable, `modParts`/`applyMods` — A1, a recorded
syntax-inventory addition (one of two, with B2's uncertain-value family), routed through the
grammar pill for both rule + var bases) ·
**Hierarchical / property items** (A6: a grammar item carries **fields** via dotted sub-rules
`sword.damage: 1d8`, read with `{item.field}` — `fieldParts` (a 2-segment ref whose suffix is NOT
a modifier, checked after `modParts`) + a `resolveBrace` branch; cross-field consistency rides a
**pick variable** (`w = {weapon}` → `{w.name}`/`{w.damage}`), never the reverted per-expansion
bind; promotes to an anon grammar pill, OPML round-trips in the `def`; v1 = single field) ·
**Stateful sequences / decks** (`{shuffle|cycle|once|stopping: a|b|c}` — a deck draws
without replacement, others rotate/advance; state on the grammar record, `_grammar`
round-trips; `@` "Deck" door; `seqParts`/`nextSeqIndex`/`advanceSeq`) ·
**Repeat** (`{Nx: template}` — emit a grammar template N times (1–99), re-expanded
each time for independent dice rolls / rule picks, joined by spaces; `repeatParts`/
`resolveBrace`; promotes to an anonymous grammar pill; `{Nx}` chip in the grammar dialog +
`?`-panel row; recorded P5 sub-form addition) ·
**Dynamic odds** (A5: a weighted-alternation weight may be a trailing `{= expr}` over
variables — `{a|b {= str}}` — resolved at pick time; `parseAlt`/`pickWeightedAlt(alts, vars)`. Works
in an inline brace **and** at the rule-alternation level — `name: a | b {= w}`; `parseRules` keeps the
`weightExpr` alt instead of dropping it for lacking a numeric `weight`) ·
**Yes/no oracle** (the `@` "Oracle (yes/no)" door — a likelihood picker over original/neutral
odds bands building an anonymous `Yes N | No M` weighted-alt pill; the odds field accepts A5
`{= expr}` weights; `openOracleDialog`/`ORACLE_BANDS`) ·
Math (incl. unit conversion + date math; **declarable units** `{= convert(x, from, to)}` over a
built-in ratio table plus doc-declared `root.units` — File → Custom units, SR-6/#875; **subtree
aggregation** `{= sum|avg|count(prop)}` rolls up a child points' property —
`expandAggExpr`/`aggregateChildren`, render-time, live; **query reducers** `{= sum|avg|min|max("query", prop)}`
reduce a property over a live query set — `queryReduce`, the `count("query")` generalization, SR-8/#877;
**value-only display** — a per-pill "Show value only" dialog toggle (`m.bare`) renders just the result
chrome-free so a number reads as prose/heading text, not a monospace `expr = value` capsule; the recipe
stays in `node.text` and shows on edit; `.math-bare`, applied only to the successful branch so an #ERR or
empty-rollup never hides; round-trips via `_math`; the reusable `openInsertDialog` `type:'checkbox'`
field kind carries it) ·
**Uncertainty fields / estimates** (B2, frontier F3 — first-in-class: `@estimate` or `{5 to 10}`,
an uncertain value sampled Monte-Carlo and shown as `mean ± [p5,p95]` + a unicode sparkline; click
to re-sample. A **separate sampler** (`sampleUncertain`/`rngFromSeed`) since a distribution can't
ride `evalMath`; `lo to hi`/`normal`/`uniform` + `+−×÷`, and Phase-2 `sum|avg(prop)` rolls up
children's uncertain properties. **Reads declared variables** (SR-7/#876): a bound may be a
declared var — `{cost_low to cost_high}`, `{units * (5 to 10)}` — resolved through the threaded
doc `vars` map; a text var fails visibly. Storage is `{key, expr, seed}` — reproducible, round-trips
via `_est`. Cores: `parseUncertain`/`distSummary`/`sparkline`/`formatDist`/`estParts`) ·
Variables (two value types: formula, and **random pick** — a frozen, re-rollable grammar
pick; the Perchance-style generation model, see `guidance/generation-direction.md`) ·
Typed shorthand (with a live typo marker for attempted-but-invalid `{…}` bodies —
`classifyBraceBody` keeps edit-mode styling and exit promotion in agreement; and a display-mode
`.brace-attempt` cue for an invalid `{…}` that stayed text on load, #888) ·
Footnotes · Hashtags (incl. the `#` tag picker sourced from `collectTags`) ·
Tables (incl. Org `#+TBLFM:` formulas) · Collapse-to-level ·
Node links (same-doc **and cross-document** `[[docId#nodeId|label]]`, incl. live-title "mirror" —
**and the cross-doc mirror**: `[[docId#nodeId|]]` transcludes from the index's retained tree, "as
saved", with foreign-doc resolution for inner links/queries/vars (4a + the §5 spine, see
`guidance/cross-document-direction.md`) — the `[[` picker, backlinks (each row with a
`backlinkSnippet` context line, 4d), link-and-create / "+ New note", aliases, unlinked refs) ·
Multi-document workspace (a folder of `.opml` notes on real disk — FSA + IndexedDB, Chromium-gated;
durable continuous auto-write, document switcher, **document tabs** — a `#doc-tabs` `role=tablist`
strip over the switcher: `openTabs` filenames persisted in IndexedDB, `tabAdd`/`tabClose`/`tabCycle`
pure cores, `Ctrl/⌘+Shift+]`/`[`; a pure UI layer over `switchWorkspaceDoc`, still **one `root` in
memory** (no N-resident, no same-file-twice — see roadmap decision) — reopen-across-reloads,
non-Chromium invite. **Two wiring rules that bite:** (1) the strip is seeded from ONE chokepoint —
`renderWorkspaceAffordance` registers the current doc + the async `restoreOpenTabs(dir)` rehydrates
the saved list on every (re)connect/startup path, so no path forgets to surface it; (2) `renderDocTabs`
sets `display:flex` **explicitly** — the `#doc-tabs` CSS default is `display:none`, so `style.display=''`
silently re-hides a fully-built strip) ·
Whole-folder search (one search box over every note in the folder) ·
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
`@sequence` OR a typed **`{seq Name: active | done}`** (`seqDeclParts`, the Tier-3 typeable form)
declares a `[[seq:key]]` pill + `node.seq` sidecar — named/atomic, does NOT unfold; `/` applies any
state as `#KEYWORD`; done-ness = the keyword sits right of its sequence's `|`) ·
Search query operators (the UXP-20-routed decision: implicit AND, `-` NOT, `"a b"` phrases,
`#tag` word-anchored (and hierarchical: `#thread` matches `#thread/torn-letter`),
`is:done/todo/note/failing`; malformed tokens stay literal text — the `{…}`
escape-hatch rule; OR is a standalone spaced `|` between clauses (QX-5: AND binds tighter, empty clauses dropped, glued/quoted pipes stay literal). `#KEYWORD` states are hashtag-shaped so `#waiting` filters by
state for free, AND there is a seq-aware **`state:value`** operator (`state:waiting`/`state:done`,
matched only against recognized states; `status:` stays the generic property lookup, not a
synonym); pure cores `parseSearchQuery`/`queryMatchesNode`;
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
Outline constraints / lint (F2: a reserved **`check` property** carries an `evalMath` boolean
assertion over a point + its direct children — `sum(cost) <= budget`, `count(score) >= 3`, own-prop
`hours <= 8`; **zero new syntax** on the dates precedent — reuses `evalMath` + the B1 child
aggregations. A check **must contain a comparison** (`> >= < <= == !=`); a bare numeric expression
(`5 + 5`, `sqrt(16)`, a lone rollup `sum(cost)`) is not a true/false test and returns `error`, never
a truthy `pass` (the P4 silent-wrong-success guard). `evalCheck(node, vars)` → `pass`/`fail`/`error`/`null` (own numeric props via
`nodePropVars` overlaid on `globalVarMap`, own props win, evalMath constants still win over both;
child rollups via `expandAggExpr`). A live pass/fail/error chip (`buildCheckChip`, P4 — fail and
error visible, pass a muted `✓`; a verdict flip announces via the `#a11y-live` region) routed through
`openPropChip` like a date chip; **`is:failing`** is a new value in the existing `is:` family
(`termMatchesNode`/`queryMatchesNode` gained a `vars` param defaulting to `globalVarMap`) — the
doc-wide lint filter, matching a `fail` **or** `error` check. Front doors: `/check` slash verb, the
bullet-menu "Add/edit check" door, the chip, the `?` panel + search legend; `openCheckDialog` has a
live preview that explains why an expression can't evaluate (`mathErrorReason`). `check` is reserved
like `DATE_KEYS` — hidden from the generic Properties editor, merged back on save; round-trips through
`_props` for free. Numeric extremal checks (`max(cost) <= cap`, `min(score) >= 1`) work via the
B1 `min`/`max` aggregation; **date-range** checks (`max(due) <= deadline`, `min(start) >= kickoff`)
**now compute** — `childPropNumber` aggregates date-shaped props as epoch-days. Deferred: multiple
checks/point, cross-parent refs, structural/existence checks (F5)) ·
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
Journal / daily notes (a toolbar button `#btn-journal` + the `journal` block command — `BLOCK_CMDS`,
section "Organize" — open today's entry; `openJournalEntry`/`findOrCreateJournalHome` with **two
modes**: in-doc **append** (find-or-create a top-level "Journal" home point, then today's day node
under it — `findOrCreateChild`, fuzzy-matching a day node that carries a title suffix) and, when a
workspace folder is connected, **file-per-day** on disk; pure core
`journalFileName(iso)`. Config is `root.journal = {mode, targetId}`, round-tripping
as the `<_journal>` OPML head element; concept-guide entry `{id:'journal', cat:'dates'}`) ·
Dates (start + due) + Agenda (dates live as `start` and/or `due` properties in `node.props`, value `YYYY-MM-DD` or `today`/`today+N`/`today-N`/`tomorrow` — a point carries a start→due **range**, project-management style; zero new authoring syntax — both keys reuse the existing properties system and parse through `parseDueDate`, which round-trips the parsed epoch back to y/m/d to reject impossible calendar dates — Feb 30, day 32, month 13 — that `Date.UTC` would silently overflow-normalize, and bounds the year to a sane 1900–2200 scheduling window; date-smart chips color-coded by urgency: Today (green) / Tomorrow & this week (accent) / Later (muted) / Overdue (red); the start chip renders with a leading `▸` and never-overdue ink. **Agenda is a vertical stack inside the toolbar** (below the breadcrumb — no sidebar, so it never constrains the outline's width or obstructs a mobile screen; the toolbar's `ResizeObserver` re-pads `body` so extra bars push the outline down rather than overlapping it), toggled by the toolbar calendar button. The **top bar** (`.ag-top`) pairs a **2×2 control grid** (`.ag-controls` — `Timeline · Calendar` / `Done · Running`) on the left with the **always-present List** (`.ag-list`) on the right; **Timeline and Calendar are independent toggles** (persisted as `agendaBars = {timeline,calendar}`) that each open their **own full-width bar** (`.ag-pane`, hairline-topped) **below** the top bar — open either, both, or neither. Flags: **Done** (include completed dated points, off by default; done-ness via `todoDoneFromText`) and **Running** (show/hide the List's bottom row). The bars render the same dated points (`collectDueDates`): **List** — the **top "Due" row** (deadlines not yet started) + **bottom "Running" row** (started points, `start ≤ today`, with elapsed `▶ Nd` plus their deadline; a started point moves from Due to Running, never duplicated; a future-start point with a `due` shows on the Due row, with no `due` it waits until it starts — "show from start onward"); **Timeline** — a **Gantt chart** (`agendaGantt`): each point a horizontal bar on a shared, horizontally-scrolling day axis — a **range bar** start→due, a **1-day bar** for a deadline-only point, an **open-ended dashed "ongoing" bar** (start→today) for a started point with no deadline (rendered neutral, never "overdue", since it has no deadline; deadline bars carry their urgency tint) — with an accent **"today" line**; **Calendar** — a month grid (`agendaMonthCells` over `calendarMonthGrid`) with each point on its day, `‹ Month YYYY › Today` nav that re-`paint()`s in place (focus stays on the nav button, like `buildDatePicker`), up to 3 item-chips per cell then `+N`. Calendar opens on the current month (`agendaMonth`, session-only). The two layout models are **pure cores** (`agendaGantt`, `agendaMonthCells`), test-pinned. Click/Enter any bar/chip to zoom in (the strip stays open — only the calendar button toggles it). `/due` slash verb (labelled **"Schedule"**) + bullet menu "Set / Edit dates" open the two-field Start+Due dialog; **clicking a `due`/`start` property chip routes to the Schedule dialog** (`openPropChip` dispatches on `chip.dataset.propKey`), and date keys are **hidden from the generic Properties dialog** (`DATE_KEYS`-filtered, merged back untouched on save) — dates are a Schedule-dialog concern, not free-form key:value editing. Each Schedule date field carries a **full-width inline calendar** (`buildDatePicker`/`attachDateCalendar`) shown while the field is focused — the caret stays in the text field, `ArrowDown` moves focus into the `role=grid` calendar, arrows navigate, Enter/click picks (writing the ISO date back and returning the caret); day cells act on `mousedown`+`preventDefault` (caret invariant) so a pick never blurs the field, and the close-on-blur check is **deferred** so navigating the grid (an innerHTML rebuild that transiently blurs the focused cell) doesn't collapse it; pure grid cores `calendarMonthGrid`/`addMonths`. The calendar lives in-flow, so `#io-card` scrolls (`max-height:82vh`) to never clip a tall dialog. Search operators `due:`/`start:` `today`/`overdue`/`<date`/`>date` (one date-aware `key:value` extension per key); pure cores `parseDueDate`, `formatDueDate`, `collectDueDates` (now returns `{start, due, started, done, runningDays, …}` per item; the legacy `epochDay`/`iso`/`label`/`state` describe the primary date — due if present, else start — so due-only callers are unchanged); UXP-20 decision recorded: dates live in properties, `due:`/`start:` are date-aware extensions of `key:value`. The agenda + `/due` icons (`fa-calendar-day(s)`) and the capture `fa-inbox` were added to the embedded Font Awesome subset — `FA_GLYPHS` + the `::before` content rules + the solid woff2 re-subset from FA 6.7.2; a glyph missing from the subset paints blank in a raw `<i>` (toolbar buttons bypass the `setIcon` emoji self-heal), so any new icon MUST go through the subset rebuild) ·
Query pills (a live embedded search: `[[query:KEY]]` + `node.query` sidecar, body a normal
search string; renders matching points as links, capped +N more, recomputed each render, never
stored; pure core `queryRows` shared with the planned query-base "bases as queries"; `@ Query`
door + typed `{query: expr}` promotion + `editQuery`; atomic in edit mode; `_query` OPML
round-trip; scope reversal recorded QP-1 — a rendering of the live data, not a saved-views DB;
**folder scope** (4c): the dialog's "Search the whole folder" checkbox sets `q.scope='folder'` —
rows across `wsAllDocRoots()` via the gen-memoized `queryRowsFolder`, foreign rows carrying
`data-doc` + a doc-name hint, own doc live / others as-saved (named in the tip); a SCOPED pill
stays ATOMIC in edit mode (`artifactToShorthand` returns null — the `{query:…}` text can't carry
the scope, the named-grammar rule); no folder connected → visibly degraded `query-folder-off`) ·
Base inline collapse + row cap (BC: in the OUTLINE view a base can be collapsed
(node.collapsed, reusing the outline field) or capped to N rows (node.baseRows +
_baserows OPML). Pure core baseInlineView(collapsed, baseRows, total, isZoomed) ->
{collapsed, shown, clipped, hidden}; when zoomed (focusedId === node.id) everything
shows and the controls vanish. Collapsed = chrome + a .mt-base-more zoom-in footer;
capped = table body clamped (Calculate footer kept) + a "zoom in for N more" footer.
Controls in mtBaseChromeHtml's left cluster: a .col-chevron collapse toggle + a
.mt-base-rows All/5/10/20 menu (showBaseRowsMenu); switcher hidden when collapsed;
mtCollapsedHost gives all views the same collapsed strip; the base bullet menu's
"View & rows shown" opens the unified settings menu — view + rows cap in one surface,
mtAddRowsCapSection shared with the chrome rows button — and the cell context menu
(Shift+F10) leads with the focused cell's pill actions via collectPillActions'
cell-scope override, bases round 3) ·
Calendar view (BV-3: {kind:'calendar', dateBy} on the first date-role column, guarded
with the P4 fix hint; pure calBaseItems (strict parseDueDate, invalid/blank rows
surfaced as an undated strip, never dropped) feeds the agenda's agendaMonthCells;
_calMonthByNode is the session-only month anchor; nav + Today; chips paint via
mtCellHtml so query-base links navigate; pill/link gates include .cv-chip) ·
Cards view (BV-2: {kind:'cards'}, buildCardsWidget, rows as cards in a responsive grid
via mtCellHtml; the cell-pill gate widened to .bv-card/.gv-card so per-cell pills
re-roll inside cards; read-only on authored + query bases; images paint as covers) ·
Base views + the board (BV-1: node.view={kind:'board',groupBy} + _view OPML, absent =
table; the switcher fills the reserved .mt-base-views strip (text-only buttons, no new
FA glyphs); buildTableWidget forks to buildBoardWidget; pure core boardLanes (owning-
sequence lanes in declared order, done-side flagged, no-state lane, footer excluded);
cards paint through mtCellHtml so roles/pills compose; bvMoveCard writes the keyword
into the groupBy cell via mtCommit (text is truth); showCardMenu on the shared
mt-colpanel is the universal move door (click/tap, Enter/Space, Shift+F10), drag is
the desktop enhancement (off on touch); a query base's board is read-only per the
parked write-through; board without a status column flashes the P4 hint) ·
Column display roles (FR-1, the minimal typed-fields slice under the base-views-vision
§0b thesis: node.colRole + _colrole OPML, index-aligned like colW through the column ops;
mtCellHtml is the role-aware paint wrapper at every data-cell paint site — status ->
knownStates/keywordIsDone chips (custom sequences included, the future kanban lanes),
date -> parseDueDate + formatDueDate urgency chips, number -> formatMathResult +
auto-right-align; display hints only, cell text untouched, raw on edit, non-conforming
values fall through; Column menu "Show as" door via mtSetColRole; per-role EDITORS: a
focused Date/Status cell gets a popover (showCellEditorPop — the Schedule calendar /
the owning sequence's state chips; mousedown+preventDefault picks, commit through the
cell's own path) with menu twins ("Set to" / "Pick a date" via mtSetCellValue, the one
menu-path cell writer routing authored→epilogue, query→Phase C); a QUERY base's roles
are inferred from its projection instead — qbaseColRoles (due/start field -> date,
= expr -> number) behind the one accessor mtColRoles that every colRole READ site
consults, so Calendar/Cards open read-only on query bases while write sites stay
authored-only; editors and further roles stay below the line) ·
Query bases (QP-2 Phase A, the bases-direction §4 above-the-line move under the
base-views-vision §0b mission thesis: a base whose ROWS are a live search. node.qbase =
{expr, cols:[{name,field}]} (_qbase OPML); pure core queryTableRows projects each match
into cells (title -> a sidecar-free [[#id]] link token per §0.1; a prop key -> its raw
value; '= expr' -> per-row evalMath with own-props + date-props-as-epoch-days overlay +
expandAggExpr rollups, resolved to inert strings, errors visible as #ERR); mtModel forks
to the memoized qbaseModel (_qbaseCache, generation+config keyed per §0.3, QBASE_ROW_CAP)
so buildTableWidget renders it through its readOnly path (zero edit surface). The strip
above the grid is the one affordance (query + live count, click/Enter opens the editor);
/querybase door; base bullet menu swaps in Edit query + frozen Copy as Markdown;
mtRecompute + raw-markdown edit guarded off; title links join the Tab order in-grid.
Phase B shipped (the strip's Show all/Cap toggle — qbase.showAll,
persisted; per-row source identity via model.qids + tr data-nid; refreshTable restores
focus by source id); Phase C shipped: plain-PROPERTY cells write through to the source
point (qbaseFieldWritable gates the paint + commit; blur resolves data-nid → setProp,
never node.text; pushUndo per commit + a flash naming the change, incl. a row leaving
the query; title/= columns and query boards/cards stay read-only); SV-2 shipped: a
persisted config sort — qbase.sort {col,dir} in the _qbase JSON, role-aware via the
shared mtSortOrder (formula columns included), applied inside the generation memo,
named in the strip, edited as the dialog's Sort rows field (parseQBaseSort)) ·
Self-contained HTML export (C1: File menu → **Self-contained HTML** — `exportSelfContainedHtml` clones the page, empties the rendered DOM, and inlines the outline as OPML in the `#pl-embedded-doc` `<script type="application/xml">` data-island via the pure core `embedOpmlIntoHtml` / `extractEmbeddedOpml`; opening the file re-runs the app and `restoreEmbeddedDoc` hydrates from the island — winning over local autosave — into **display mode** with a one-time snapshot notice; the data-island is empty in the app shell, so the live editor is untouched; see the "Export — self-contained HTML" section above).
Details: `guidance/features.md`

## Direction, roadmap & backlog

The product direction is now set. Read these before proposing or building:
- `guidance/product-identity.md` — **the binding identity** (the 90%-core, the tools-for-
  thought lineage + accepted test, the two freedoms, **§3c inviting-not-persuasive** — the
  product is not sold, only made inviting; optimize for welcome, never capture — the
  never-build list, who it is NOT for, the substrate test, the held hypotheses). The first
  stop for any scope/positioning decision. Its gap list against the shipped app is
  `guidance/identity-alignment.md` (ACTIVE; IA-1 the missing base→text exit verb leads).
- `guidance/ux-discipline.md` — **the binding UX standard** (vocabulary, the five principles,
  keyboard grammar, the closed syntax inventory, patterns, conformance matrix). Read before
  any UI work; clear `guidance/ux-definition-of-done.md` before merge.
- `guidance/ux-remediation.md` — the **active** UX non-conformance register (now just the two open
  items: UXP-20 the standing syntax-sprawl guard, UXP-170 a deferred glyph rebuild). File new defects
  here. The ~226 closed entries are the frozen record in `guidance/ux-remediation-archive.md`.
- `guidance/roadmap.md` — locked decisions + the phased plan (multi-document Zettelkasten,
  node links + backlinks, storage/durability, the lean↔guided UX modes), plus the
  remaining generative-engine ideas.
- `guidance/bases-direction.md` — locked direction for markdown-first rendering and
  Bases (table-vs-base model, freeform-bases philosophy, base layout + header interaction,
  the shipped-record ledger in §4/§7, and §7c's recorded structural noes). Read before any
  table/base work. Companions: `base-views-vision.md` (the views architecture argument +
  the §0 red-team corrections; largely delivered), `query-base-proposal.md` (QP-2, shipped
  through Phase C), `saved-views-proposal.md` (SV-1/SV-2 shipped; SV-3/SV-4 recorded NO —
  the closed below-the-line list).
- `guidance/cross-document-direction.md` — **ACTIVE direction for cross-document interactions**
  (owner-directed 2026-07-18: mirroring/transclusion, folder graph, folder-scoped aggregation/queries,
  backlink previews — wanted; the constraint is performance/stability, not identity). Key facts it
  records: the one-root rule governs *editing* while `workspaceIndex.roots` already retains every
  parsed tree for reads; measured costs (scan ~50–400 ms at notebook scale; folder-wide agg walk
  1.5–31 ms, safe only memoized on an index generation; the force-layout graph wall — doc-level
  folder graph only, all-points rejected on measurement); the §5 liveness spine (index generation
  counter, own-doc liveness, refresh-on-save, incremental rescan) that phases 4b/4c require.
  **§6 phases 1–4 + §5.2 are shipped** (spine, mirror/transclusion + backlink previews, doc-level
  folder graph, folder-scoped reducers/query pills, and the incremental rescan: `scanWorkspace`
  re-parses only fingerprint-changed files via `scanReparseList` + `_wsScanCache`, a warm rescan
  doing zero content reads). Write-through editing and implicit cross-doc name resolution stay out
  (revisit-gated). Read it before any workspace/index/cross-doc work.
- `guidance/plugins-direction.md` — **locked direction for extensibility/plugins** + the
  **code-execution gate**: extensibility is **declarative DATA packs only** (grammar/variables/
  emoji merged into the registries via a `<_plugins>` head element); **the app executes no
  document- or plugin-supplied code as a program while it ships as a single build-free `.html`
  file** (code plugins / executable code nodes are out, gated on the *same* "more than a single
  file" revisit trigger as the parked version-control pivot). The restricted DSL engines
  (`evalMath`/grammar/dice) are interpreters, not code execution, and are unaffected. Read
  before any plugin/extensibility work; companion how-to: `plugins-data-packs-prerequisites.md`.
- `guidance/design-language.md` — **the locked visual standard** (typeface roles + the
  native-or-embedded constraint, the opsz-tracks-size type scale, warm paper/ink palettes,
  contrast floors as merge criteria, the dual-home CSS+JS palette invariant, pill/table/
  shadow/radius component rules, and the binding anti-decisions: no glassmorphism, no
  noise, no red default accent, display ceiling ~2em). Read before any visual change;
  contradicting a Decision there is a regression, not a restyle.
- `guidance/generative-status.md` — **completion ledger for the generative + computational lane**
  (what's shipped · deferred · deliberately out-of-scope, + the next frontier). The generative +
  computational catalogue is now **complete**; this is the index — detail lives in `features.md` and
  `enhancement-research.md`.
- `guidance/backlog.md` — consolidated, prioritized feature gaps (product-neutral).
- `guidance/enhancement-research.md` — consolidated *inspiration → upgrade* catalogue for the
  generative + computational engine and single-file offline-ness (mechanics mined from Tracery /
  Perchance / Ink / Twine / oracles / Soulver / Calca / Frink / Squiggle / Guesstimate / org-mode /
  TiddlyWiki / Decker, each mapped to a code seam + a P5 verdict). Candidate material for the
  roadmap's interleaving clause — **not a commitment**; companion to `outliner-frontier-report.md`.
- `guidance/performance.md` — **measured performance baseline** (per-keystroke / render / scroll /
  search / autosave / undo across 1k–50k nodes, plus the **bases sweep** — a base's widget is NOT
  row-virtualized, so its envelope is a few hundred rows comfortable / ~1k usable, with the rows
  cap as the lever — the three ceilings, why virtualization + lazy caches hold). Comfortable to
  ~10k; the hard limit is **storage (~17k via localStorage), not lag**.
  Dated + commit-tagged with a re-run harness embedded — re-measure and update before claiming a perf
  win/regression, and fire the **real `input`-event keystroke path on a fully-expanded tree** (a bare
  `render()` call lies).
- `guidance/ux.md` — the discoverability / verbosity-dial UX *strategy* (vision). **Build discipline:**
  ship a feature's bare interaction first, then add its helpers (chips, hints, menu
  descriptions) as a separate, verbosity-gated overlay, so the app stays lean-compatible.
  Where `ux.md` (vision) and `ux-discipline.md` (standard) ever differ, the standard governs
  behavior; `ux.md` governs the staging of guidance overlays.
- `guidance/concept-guide.md` — **how to add/fix an in-app concept-guide entry** (the
  `const GUIDE = [` array surfaced by the "Concept guide ›" button): entry shape, the
  category set, the drift-guard contract (every `/`+`@` command id covered, and keep the
  test's hardcoded id lists in sync), and the AP-style house rules. Read before adding a
  user-facing feature — its concept entry ships in the same change.

Note: internal links + backlinks and a multi-document workspace — previously "out of
scope" in the old roadmap — are now the **planned direction** (Zettelkasten).

**Three more directories, not to be confused with `guidance/`:**
- `guide/` — the **end-user** guide, now a complete set: a `README.md` hub + `features.md`, the two
  pill deep-guides (`generating-text.md`, `computing-numbers.md`), six plain-outliner category pages
  (`writing-and-formatting.md`, `getting-around.md`, `tasks-and-organizing.md`, `dates-and-planning.md`,
  `links-and-references.md`, `files-and-export.md`), `cookbook.md`, and the `solo-rpg/` subtree. There
  is a markdown page for every category in the in-app concept guide (the GUIDE array). Linked from the
  root `README.md`. This is the user-facing *how to use the pills* doc, distinct from `guidance/` (the
  dev-facing build-steering docs; note the near-identical name `guidance/features.md`, which is the
  separate **engine reference**, not this user inventory). **`guide/features.md` is the canonical
  user-facing feature inventory** (the root README's "What's in the box" is a teaser that defers to
  it). **When you ship a user-facing feature the user types or clicks, freshen `guide/` in the same
  change:** add the one-line entry to `guide/features.md` (with its anchor link into the relevant
  deep guide), and the how-to to the matching deep guide. The headings in the deep guides are
  **unnumbered on purpose** (their slugs are the cross-link contract `guide/features.md` depends on,
  so renaming a heading means updating every inbound anchor in the same change). It drifts the same
  way the in-app concept guide does. (Same no-em-dash rule as all user-facing copy.)
- `guide/solo-rpg/` — **user-facing worked examples** for using Pointliner at a solo-RPG table
  (the use it was born from). Lives **under `guide/`** alongside the other user docs. A landing
  `README.md` plus one folder per case; each case ships a walkthrough `.md` **and an importable
  demo `.opml`**. Linked from the root `README.md` and the `guide/` home. Convention for a new
  case: add `guide/solo-rpg/<case>/<case>.md` + `<case>-demo.opml`, then list it in
  `guide/solo-rpg/README.md`. Demos use plain `{…}` source (they promote to live pills on import),
  and any borrowed notation/oracle is credited and linked, not reproduced (mind third-party
  licenses, e.g. the Lonelog example is CC BY-SA).
- `parked/` — **deliberately shelved** direction docs (currently just the parked version-control
  pivot). Not stray, not active. Don't resurrect what's parked here without sign-off, and don't
  delete it as cruft.

---

## Working notes

- Work flows through **per-task branches** (`docs/…`, `fix/…`, `feat/…`) cut off
  `origin/main`, one focused PR each — there is no long-lived dev branch.
- **Always branch off freshly-fetched `origin/main`.** Before starting any task, run
  `git fetch origin` and cut your branch from `origin/main` — **not** local `main`. A stale local
  clone can leave `main` pointing at an old snapshot, and you won't notice: your branch will pass
  its own outdated tests. Sanity-check you're current — the test count and recently-merged
  files/dirs (e.g. `guidance/`, the latest UXP entries) should match the latest work. As of the
  last refresh of this doc (2026-07-16) `node --test tests/test.mjs` reported **1383 tests, all
  passing**; treat a *lower* count than that as a likely stale base and **STOP** to investigate. (The number only grows,
  so it drifts upward over time — it's a floor, not an exact match. Trust the runner's reported total,
  not a `grep -c 'test('`, which over-counts.) (The number only grows,
  so it drifts upward over time — it's a floor, not an exact match. Trust the runner's reported total,
  not a `grep -c 'test('`, which over-counts.)
- **Parallel review fleets file GitHub Issues, never tree writes.** When several agents review/evaluate
  in parallel (design panels, conformance audits, bug hunts), they MUST be read-only on the repo and
  report each finding as a GitHub Issue (`gh issue create`, label `agent-review`, one issue per finding
  with the evidence + a suggested fix). Rationale: parallel writers competing for the branch/worktree —
  or even just appending to the same ledger file — burn time and tokens on merge conflicts; issues are
  append-only by construction, so N reviewers need zero coordination. **Issues are the INBOX, the ledger
  is the RECORD:** atomicity matters at *fix* time, not *find* time. The (serial) fixer works the issue
  queue on normal per-task branches; each fix PR closes its issue (`Fixes #N`) and writes the
  `guidance/ux-remediation.md` entry citing that issue number in the same commit — the durable,
  test-enforceable record still lands in-repo. A finding judged *not* worth fixing is closed with a
  one-line reason (and recorded in the ledger only if it's a recurring temptation worth documenting).
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
