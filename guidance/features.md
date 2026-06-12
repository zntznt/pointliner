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
- **Roll tables** — `@rolltable`: **a one-rule grammar** (the June 2026 collapse:
  the separate artifact/sidecar/dialog retired; the `@` door opens the
  **table-flavored grammar dialog**). `loot: sword | shield 2 | {2d6} gold` —
  entries compose through the grammar engine, the name is callable anywhere as
  `{name}`, click re-rolls. Legacy `[[rolltable:]]` records migrate on load
  (`migrateRolltables`; frozen result preserved — a migration never re-rolls).
- **Grammar** — `@grammar`: recursive-substitution generator (`runGrammar`).
  Named rules `name: a | b 2 | c`, one per line; one brace syntax `{...}` for rule
  refs `{color}`, named tables `{loot}`, named markov chains `{weather}`, variables
  `{strength}`, dice `{2d6}`, expressions `{= 2*r}`, and inline alternation `{a|b}`,
  all nestable. Names are **document-wide** (`collectRules()` — grammar rules,
  which include collapsed roll tables, + named chains), so any pill can call
  anything declared anywhere. Cycles/depth caught at expansion (`↻`/`…`). Freezes
  its expansion like dice; click to re-generate. **Named pills show their callable
  name** and stay atomic in edit mode (the name is doc-wide config — unfolding
  would lose it); anonymous shorthand pills unfold to editable `{…}`.
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
  and flagged (`↻`, `.var-cycle`). Two **value types**, chosen in the dialog:
  - **Formula** (the default) — a math expression, evaluated live (`area = pi*r^2`).
  - **Random pick** — a *grammar source* (`dragon|wyrm 2|drake`, `2d6`, a rule/table
    name, or a template like `{color} {beast}`) expanded **once** via the grammar
    engine and **frozen** on the record (`kind:'pick'`, `rolled`). Every `{name}`
    reference document-wide shows the same frozen value; the declaration pill is a
    generative pill (**body-click re-rolls** — all references update together —
    pencil edits; re-roll announced via the `#a11y-live` region). The value is
    **text**: used in math or dice it fails visibly (`?` / disabled dialog submit /
    `#ERR`), never silently. `collectVars` returns the stored value unchanged on
    every pass — the engine runs only at declaration and explicit re-roll
    (`rollPickSource` is the pure core). Direction: `guidance/generation-direction.md`
    (v1; inline `{a := …}` shorthand, modifiers, and per-reference re-roll are
    explicitly deferred).
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
- **Per-point notes** — a secondary, muted plain-text block under a point
  (`node.note`, `_note` OPML attr). **Plain text only by design** — a note is
  annotation, not content: no markdown, no pills, so none of the unfold/prune/
  promotion machinery applies. Doors: the bullet menu's "Add note"/"Edit note"
  (hover, long-press on touch, `Shift+F10` keyboard) and click-the-note to edit
  in place (the display IS the editor — no raw/pretty split for plain text).
  Enter = line break (a prose *field*, like a dialog textarea or table cell);
  Esc or blur commits; clearing all text deletes the note. Notes are searched
  (`nodeMatchesSearch`), highlighted, exported as indented continuation lines
  (markdown + plain text), and ride snapshots/clones for free. Layout: a second
  mirrored flex row with invisible gutter clones (collapse-btn / bullet / ol-num)
  keeps the note aligned with the content at every viewport and touch size; the
  live editor survives window re-renders via the `forceIncludeId` base-cell
  pattern.
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
    guidance overlay (per `guidance/ux.md`). **UX status:** this is a tracked
    discoverability non-conformance — `guidance/ux-remediation.md` UXP-4. The overlay
    *staging* stays a roadmap call, but "no front door at any verbosity" is not a
    conformant end state: it must eventually surface at least at the Guided floor.
  - **Edit mode:** a link is **plain editable text** `[[#id|label]]`, not an atomic pill —
    you edit the token as text (like a footnote ref `[^key]`). It renders as a link only in
    display mode. Clicking a link → zoom to the target.
- **Click-to-edit anywhere** — clicking any empty / non-interactive part of a node enters
  edit mode (caret at the click point, or **end-of-text as fallback**); interactive elements
  (bullet, links, pills, checkboxes, hashtags, footnote refs, table widgets) keep their own
  behavior, and shift-click still range-selects. Navigating into a node places the caret at
  the end.
- **Status states + priorities** — `#STATUS` keyword + `[#A]` priority at the **start of
  `node.text`** (headline style: `#TODO [#A] body`). The `#` reuses the existing hashtag
  sigil — no new delimiter. Bare `TODO` without `#` is plain text, never a badge. `#word`
  that is not a known state is a normal clickable hashtag. No new node field, no OPML
  attribute — keyword + priority are plain text and round-trip for free. States:
  `#TODO / #NEXT / #WAITING / #DONE` (done = `#DONE`); priorities: `A / B / C`.
  Old saves (bare `TODO body` form) are NOT migrated — they load as plain text
  (a load-time rewrite would also capture prose typed after the change); retype
  as `#KEYWORD` if meant as statuses.
  - **Done-ness derived from keyword:** `node.checked = todoIsDone(keyword)`, so the existing
    strikethrough (`.nt-todo.checked`) and the **hide-done filter (with the show-done toggle)
    keep working unchanged** — completed items hiding is a deliberate, load-bearing feature.
  - **Checkbox ⇄ keyword:** when a keyword is present, ticking the checkbox sets `#DONE` (the
    item then hides until show-done); unticking steps back to `#WAITING`. No keyword → legacy
    boolean behavior.
  - **Changing state — two easy paths (no modifier chords):**
    - **Click-choose:** clicking the colored state badge (or priority chip) opens a compact
      popover picker (`— / TODO / NEXT / WAITING / DONE` and `— / A / B / C`); one click sets
      it directly via `setTodoState` / `setTodoPriority` — *direct jump, not cycle*. For a
      no-keyword todo the same picker is reachable from the bullet popup / long-press
      ("Set state / priority…"), so it works on touch too. The picker reuses the `#bpop`
      element.
    - **Typing:** in edit mode the keyword is plain editable text at the line start, so just
      type `#TODO `/`#NEXT `/`#WAITING `/`#DONE ` (or edit/delete it) — it renders as a badge
      on exit and `checked` re-derives. Slash entries `/todo` `/next` `/waiting` `/done` make
      it discoverable; they also convert a non-todo node to a todo with that keyword.
  - **Display:** state badge (one accent for `#TODO`/`#NEXT`/`#WAITING`, muted for `#DONE`) +
    `[#A]` priority chip, injected at the start of the rendered body; the body renders as
    normal markdown. Edit mode shows keyword + priority as plain text (never atomic pills).
  - **Sort children:** bullet menu → "Sort children by state/priority" sorts children using
    `compareTodo` (not-done before done, then `A < B < C < none`, then active-state order).
  - **Sequences (user-definable state sets) — SHIPPED (MVP):** the built-in
    `TODO NEXT WAITING | DONE` is now the *default sequence*; declare your own with
    `@sequence` (name + states, e.g. `Flow: BACKLOG DOING | SHIPPED`) — a `[[seq:key]]`
    pill + `node.seq` sidecar, document-wide via `collectSequences` (cached on `_varsVer`),
    OPML `_seq`. Apply states via `/` (one menu section per sequence) or by typing `#KEYWORD`;
    the badge renders for any state of any sequence, the badge→picker offers the node's
    sequence's states, and done-ness derives from the keyword's side of the `|` (right = done
    — strikethrough / hide-done / sort all honor it). Keyword collisions: first sequence wins
    (default first). The `#` prefix is the only syntax addition: `@` declares, `/` applies,
    `#KEYWORD` sits in `node.text`.
  - **Not included (future work):** state *cycling* (advance-to-next) for custom sequences,
    per-item sequence switching beyond `/`+typing, priority `[#A]` semantics per sequence,
    inline `{}` reference of a sequence, `CANCELLED` in the default set, logbook /
    `CLOSED:` timestamps, per-file `#+TODO:` declarations, agenda/scheduling.
