> On-demand reference — read this only when adding a new artifact type or icon. Not loaded by default.

## Feature status

Implemented:

- **Dice** — `@dice`: `NdM`, `+/-` modifiers, `@var` modifiers, **exploding**
  (`2d6!`), **keep/drop high/low** (`4d6kh3`/`kl`/`dl`/`dh`), **Fate** (`4dF`),
  and **success-counting pools** — a comparison suffix (`>=`,`<=`,`>`,`<`,`=`)
  turns the term into "count the dice that match" instead of summing pips
  (`6d10>=7`, `4d6<=2`). Each rolled face is its own die, so **exploding composes**
  with pools (`6d6!>=5` — an exploded `6→5` yields TWO successes). Success pools
  stand alone (no modifier mixing, no keep/drop, no Fate — `parseDice` returns
  `null`). Rolls stored per-die as chains in `parts[].rolls`; success parts carry
  `parts[].success` (`{op,target}`), nested `parts[].hits` (parallel to `rolls`),
  and `parts[].successes`. Old flat-number saves still render via a compat branch
  in `diceBreakdownHTML`.
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
  change. **Conditionals** already exist (`a>b ? x : y` and `if(a>b, x, y)`).
  **Unit conversions** are unary fns in `FN1` named `from2to` (`c2f`/`f2c`,
  `km2mi`/`mi2km`, `m2ft`, `cm2in`, `kg2lb`, `kmh2mph`, `l2gal`, …). **Date math**:
  `today` (a constant = epoch-days of the local date), `date(y,m,d)` (a 3-arg fn,
  `FN3`), and `year`/`month`/`day`/`weekday` (`FN1`). Dates are **epoch-day
  numbers**, so differences are days and everything composes; `asdate(...)` is a
  numeric identity that the math pill *displays* as an ISO date — display-layer only,
  via `formatEpochDays` / `isDateExpr` / `formatMathDisplay`, so `evalMath` still
  always returns a number.
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
- **Table formulas** — Org-mode `#+TBLFM:` spreadsheet conventions. The formula line
  lives as a trailing `#+TBLFM:` line *inside* `node.text` (Org-style), so it round-trips
  through OPML / Markdown / plain-text for free — no sidecar, no new attribute. **Cells hold
  literal/computed values; the TBLFM line is the recipe** (the core invariant). References use
  Org `@ROW$COLUMN` grammar (`@1` = header, `@2` = first data row): `@2$3` field · `$3`
  column(current row) · `@2` row(current col) · relative `@-1`/`$+1` · `@<`/`@>` first/last
  row · `$<`/`$>` first/last column · `@#`/`$#` current row/col *number*; rectangular ranges
  `@2$1..@>$3` feed `vsum`/`vmean`/`vmax`/`vmin`/`vcount`/`vmedian`. Assignments separated by
  `::`; column formulas (`$N=…`) fill data rows only (header skipped). **Field formulas take
  precedence over column/row formulas regardless of source order** (Org rule; applied in a
  second pass): `$4=$2*$3 :: @>$4=vsum(@2$4..@-1$4)` fills the body and overrides just the
  total cell — the footer-total idiom works without a second hline. Blank cells = 0 in scalar
  context, suppressed inside ranges; cycles/invalid → `#ERR` (never hangs). The
  reference layer (`orgResolveComp`/`parseOrgRef`/`parseTblfm`/`computeTable`) is **translated
  onto the existing `evalMath` engine** — so the full math grammar (units, dates, conditionals,
  functions, variables) works inside formulas. Edit affordance = plain editable text: the
  "✏ markdown" button shows the whole node (grid + `#+TBLFM:` line) as raw text, like links.
  Recompute fires on cell focusout and structural edits (`mtRecompute` → in-place
  `mtPatchCells`, or full `refreshTable`). **Not supported** (future work): named columns
  (`$name`), constants lines (`#+CONSTANTS:`), remote references (`remote(...)`), hline-relative
  rows (`@I`/`@II`), Calc-mode flags, and `B3`-style notation (`@row$col` is the one true form).
- **Collapse to level N** — `collapseToLevel(n)` / `expandAll()` set
  every node's `collapsed` flag by depth relative to the current viewport
  (`focusedId` or root). Toolbar segmented control `1·2·3·All`; keyboard
  `Ctrl/Cmd+1..6` is a best-effort accelerator (browsers may claim those chords
  for tab switching, so the toolbar is the reliable path).
- **Node links & mirror** — link any node to any other with `[[#TARGETID|label]]`
  (the target id lives in the text; no sidecar). `collectLinks(rootNode)` walks the
  tree and returns `{ outgoing, backlinks, broken }`, cached on `_varsVer` like
  `collectVars`. **Same-document only** (cross-document is gated behind the future
  multi-doc workspace).
  - **Caption vs. mirror:** `[[#id|My text]]` shows a fixed caption; **`[[#id|]]`
    (empty label) "mirrors"** the target — it renders the target's *live* content,
    pills included, in their current state, **display-only and inline**. Rename or
    re-roll the target and the mirror updates on next render. A missing target renders
    `.node-link-broken`.
  - **Re-entrancy-safe transclusion:** the mirror renders a node *inside* a link, which
    happens during `renderContentHTML`, so `renderNodeInline` must **save and restore**
    the render-context globals (NOT clear them), and a depth guard caps nesting at 1
    (nested links inside a mirror render title-only) — this prevents corrupting the outer
    render and A↔B cycles.
  - **Keyboard-first creation:** "Copy link to this node" (bullet menu + `Cmd/Ctrl+Shift+L`)
    puts `[[#id|]]` on the clipboard; paste it and the caret lands right after the `|`,
    ready for a label. Typing `[[#id]]` by hand works too. A `[[`-triggered node picker
    exists but is **gated off** (`LINK_PICKER_ENABLED = false`) as a future opt-in
    guidance overlay (per `docs/ux.md`).
  - **Edit mode:** a link is **plain editable text** `[[#id|label]]`, not an atomic pill —
    you edit the token as text (like a footnote ref `[^key]`). It renders as a link only in
    display mode. Clicking a link → zoom to the target.
- **Click-to-edit anywhere** — clicking any empty / non-interactive part of a node enters
  edit mode (caret at the click point, or **end-of-text as fallback**); interactive elements
  (bullet, links, pills, checkboxes, hashtags, footnote refs, table widgets) keep their own
  behavior, and shift-click still range-selects. Navigating into a node places the caret at
  the end.
- **TODO states + priorities** — Org-style keyword + `[#A]` priority at the **start of
  `node.text`** (headline style: `TODO [#A] body`). No new node field, no OPML attribute —
  keyword + priority are plain text and round-trip for free. State cycle: `'' → TODO → NEXT →
  WAITING → DONE → ''`; priority cycle: `none → A → B → C → none`.
  - **Done-ness derived from keyword:** `node.checked = todoIsDone(keyword)`, so the existing
    strikethrough (`.nt-todo.checked`) and hide-done filter keep working unchanged.
  - **Checkbox ⇄ keyword:** when a keyword is present, ticking the checkbox sets `DONE`;
    unticking steps back to `WAITING`. No keyword → legacy boolean behavior.
  - **State badge click** — clicking the colored `TODO`/`NEXT`/`WAITING`/`DONE` badge in
    display mode cycles the state forward. The badge is display-mode only; edit mode shows
    the keyword as plain editable text.
  - **Keyboard shortcuts:** `Alt+S` cycles state; `Alt+Shift+↑/↓` cycles priority up/down
    (no-op when no keyword).
  - **Sort children:** bullet menu → "Sort children by state/priority" sorts children using
    `compareTodo` (not-done before done, then `A < B < C < none`, then active-state order).
  - **Not included (future work):** user-configurable state sets, `CANCELLED`, logbook /
    `CLOSED:` timestamps, per-file `#+TODO:` keyword declarations, agenda/scheduling.
