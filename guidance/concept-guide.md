# The in-app concept guide (`GUIDE`)

**What this is for:** the steps to add or fix an end-user help entry in Pointliner's
in-app **Concept guide** — the searchable panel the `?` chrome button and the File
menu's "Help & guide" row open (the guide is the one help surface; the old corner
shortcuts popover is retired). If you ship a user-facing feature, its
concept-guide entry ships in the same change. This doc exists so you don't have to
re-derive the structure, the drift-guard contract, or the house writing style every
time.

---

## Where it lives

Everything is in `index.html`:

- **`const GUIDE = [ … ]`** — one flat array, two kinds of object:
  - **Essential shortcuts** carry `essential:true` + `essSection` + `keys` + `essLabel`.
    These build the guide's **Shortcuts pages** — one page per `essSection`, rendered by
    `shortcutsSectionBody(sec)`. A NEW `essSection` value also needs its page entry in the
    Shortcuts group of `GUIDE` (a drift-guard test pins the two sets against each other),
    and the first page keeps `id:'shortcuts'` (the `?` button's landing entry).
  - **Concept entries** carry **`cat`** (and `title`/`body`/`examples`). These ARE the
    concept guide. `openGuide()` does `GUIDE.filter(e => e.cat)` — *the presence of `cat`
    is what makes an object a guide entry.*
- **`openGuide(initialId)`** — renders the panel. The left nav is two-level: a category
  header per `CATS` group, then one clickable item per entry. **Array order = display
  order** within a category, so insert an entry where it reads sensibly.
- The `?` chrome button (`#sc-toggle`) toggles it via `toggleGuide('shortcuts')`; the
  File menu's "Help & guide" row calls `openGuide('shortcuts')`.

Grep for `const GUIDE = [` and `function openGuide(` to find them.

---

## The entry shape

```js
{ id:'hashtags', cat:'getting-around',
  title:'Hashtags',
  body:"Label points by topic… Type # followed by a word… Click any tag to filter.",
  examples:[
    { syn:'#tag', desc:'label a point by topic, status or project' },
    { syn:'#',    desc:"opens a menu of tags you've used, with counts" },
  ] },
```

| field | rule |
|---|---|
| `id` | kebab-case, unique across all entries. |
| `cat` | one of the ten category ids below — must match a `CATS` entry in `openGuide`, or the entry renders in no group. |
| `title` | short noun phrase; it's the left-list label. **Raw text** — `openGuide` runs it through `escHtml`, so write `&`, not `&amp;`. |
| `body` | AP-style prose (see below). `escHtml`'d at render, so **no HTML and no entities** — write the literal `&`, `<`, `'`. **AP punctuation only; the em dash is banned in GUIDE copy** (CLAUDE.md, cleared wholesale in PR #158) — rewrite, never a `—`. Two authoring conveniences run after `escHtml` (so they can't inject): a **blank line** (`\n\n`) starts a new paragraph — keep each paragraph 2 to 4 sentences and give any entry past ~400 chars real paragraph breaks; and a **backtick pair** wraps an inline syntax token as `code` (`` `is:todo` ``, `` `Ctrl/Cmd+Shift+I` ``) — a lone backtick stays literal. A single-paragraph, backtick-free body renders exactly as before. |
| `examples` | array of `{ syn, desc }`. `syn` = the literal key/menu-path/syntax the user types or clicks; `desc` = a lowercase-leading short gloss. Both are `escHtml`'d. Use `[]` if none. |
| `covers` | **optional.** Array of `BLOCK_CMDS`/`INSERT_CMDS` ids this entry documents. Only add command ids here — it's the drift-guard contract, not a free-text tag. A chrome-only feature (e.g. capture, saved searches) has no command id, so omit `covers`. |
| `related` | **optional.** Array of other GUIDE entry ids, rendered as "See also" chips below the examples (a click navigates to that entry). A drift-guard test (#597) asserts every id names a real entry, so a typo fails loudly. |

There is no `keywords` field: the guide search indexes `title` + the category label +
`body` + the `examples` (plus `searchText` where present), so to make an entry findable
under a synonym, work the synonym into the body. The five Shortcuts nav entries are the
one exception to the shape above — instead of `body`/`examples` they carry `scrollTo`
(their section anchor) plus `bodyHtml()`/`searchText()` functions that build and index
the keyboard-reference page from the essential rows.

The ten categories (the `CATS` list in `openGuide`, in display order):
`shortcuts` · `getting-around` · `writing` · `todos` · `dates` · `generators` · `compute` ·
`links` · `files` · `recipes`.
Adding an eleventh means adding to `CATS` too, or its entries render orphaned.

---

## The drift-guard contract (the thing that bites)

Two tests in `tests/test.mjs` enforce that **every slash and @-menu command is documented**:

- `#596 — GUIDE drift guard: every BLOCK_CMDS (/ verb) id is covered`
- `#596 — GUIDE drift guard: every INSERT_CMDS (@ insert) id is covered`

Each test **derives** its id list from the live registry (it parses `id:'…'` out of the
`const BLOCK_CMDS = [` / `const INSERT_CMDS = [` source block) and asserts every id appears
in some GUIDE entry's `covers:[…]`. Because the list is derived, not hardcoded, a command
you forget to document **cannot** slip past the guard. **When you add a `/` verb
(`BLOCK_CMDS`) or an `@` insert (`INSERT_CMDS`):**

1. Add the command's id to some entry's `covers:[…]` (existing or a new entry). That is the
   whole obligation — there is no second list to update.

Since #1552 the guard runs in **three** registries and **both directions**:

- `PATTERN_RECIPES` joined `BLOCK_CMDS` and `INSERT_CMDS` as a derived id list. The pattern palette
  had shipped 10 commands with no `covers` entry and nothing failed, because the guard only knew the
  other two. That cost more than a missing entry: `builderGuideEntry` resolves a command to its help
  THROUGH the `covers` lookup, so all 10 rows in All commands rendered their one-line `desc` where
  every other row renders a full entry. Documenting them lit the panes back up in the same change.
- The **reverse** direction is asserted too: every id in every `covers:[…]` must name a real command.
  `covers:['deflist']` had named nothing for as long as the entry existed (definition lists are typed
  syntax with no command), and the same hole means a RENAMED command leaves its old id behind while
  the guard stays green and `builderGuideEntry` silently stops resolving the new one.

The tests slice the GUIDE array between `const GUIDE = [` and the stable `// GUIDE-END`
boundary marker (kept in `index.html` right after the array's closing `];`), and each asserts
it found a non-empty registry block and a non-empty covers set, so a renamed/moved const fails
loudly instead of letting the guard pass vacuously.

(Historical note: the guard once hardcoded the two id lists, which rotted — `rollpick` (#579)
shipped uncovered because nobody updated the list, and the guard was later lost entirely in a
refactor. #596 rebuilt it deriving from the registries so neither can recur.)

Beyond commands, several shipped features are **chrome-only** — a toolbar button, a
bullet-menu row or a keyboard chord, with no `/` or `@` command id: capture/inbox, saved
searches, hashtags, multi-select, zoom, sort children, the agenda and timeline, document
tabs, the base view and rows controls, the folder-of-documents workspace, appearance
controls. These used to escape the drift guard entirely; since the chrome drift guard
landed (`tests/test.mjs`, "chrome drift guard: …" pair), two subsets are now enforced:
every `#tbtn-cluster` toolbar button must keep a `TB_GUIDE_MAP` entry resolving to a real
GUIDE id (the right-click-for-guide door), and the curated `CHROME_GUIDE` list in the test
(tag browser, journal, templates, custom calendars, custom units, chronicle, per-pill
format, agenda) must each name an existing entry. The tag browser and per-pill format now
have their own dedicated entries (`id:'tags'` and `id:'number-format'`); they briefly mapped
to `hashtags`/`math` as stand-ins before those entries existed. Chrome features outside those
two nets remain a manual discipline, the same P2-discoverable obligation as any feature — when
one ships, add it to `CHROME_GUIDE` with a real entry. (Refile, properties and per-point notes
used to sit on this list; today they are the `/refile`, `/prop` and `/note` commands, so
the command guard covers them.)

---

## House style (AP, matched to the existing entries)

The user-facing copy is **AP Stylebook** prose. Read three or four existing `body`
strings before writing one; match them exactly.

- **No serial / Oxford comma.** "topic, status or project" — not "…, or project".
  (Some older entries slipped a serial comma in; don't copy the slip — the standard is
  no comma.)
- **Numerals for 10 and up; spell out one through nine.**
- **Lead with what the user can DO** — two to four concrete use cases in one flowing
  sentence — **then how to invoke it** (key, menu path, syntax). Never open with the
  mechanism.
- **Active voice, plain language, no internal jargon.** No function names, no class
  names, no "the `est` artifact".
- **Vocabulary:** say **point** (not node) and **pill** (not artifact/widget) in all
  copy — the canonical user-facing split from `CLAUDE.md`. Code keeps `node`/`artifact`.
- **Keybinds in bodies** are spelled `Ctrl/Cmd+Enter`, `Shift+Tab` — plain words. (The
  *essential shortcut* rows use the `MOD`/`⇧` glyphs; concept-entry bodies do not.) An
  `examples[].syn` is held to the same rule and is a plain string: never a template literal, because
  `` `${MOD}+S` `` renders `⌘+S` on a Mac and `Ctrl+S` everywhere else, in an entry whose own prose
  two lines up says `Ctrl/Cmd+S`. Three examples in `saving` and `import` did exactly that until
  #1552; the AP guard now reads the SOURCE for it, since by the time the array is evaluated the hole
  is already filled and a parsed-value check cannot fail (its kill-mutation caught that).
- **There is no markdown in a body.** `guideBodyHtml` does two things: split on `\n\n`, and turn a
  backtick pair into `<code>`; `escHtml` runs before both. So `**bold**` and `*italic*` reach the
  reader as literal asterisks — which is what the `hashtags` entry shipped until #1552. The house
  emphasis device is ALL CAPS on a single word (`READS`/`WRITES`, `DIRECT`, `WHOLE`, `SAME`), used
  in about 20 entries; it is deliberate, not shouting, and it is what to reach for.
- **American spelling.** AP is American English and the copy overwhelmingly already is ("colored",
  "flavor", "recognize"). Six British outliers had drifted in (labelled, unlabelled, centred,
  neighbours, defence, kilometres); a guard now holds the line.
- **Canonical spellings, where the guide had forked:** `roll-up` (the noun; the entry is titled
  "Roll-up totals", while the verb "roll up" stays open), `re-roll`, `reopen`, `read-only`,
  `three-quarters`. Say **document**, never "note", for the hierarchy level — `note` means a
  per-point note, and `rollups` used both senses in one paragraph.
- **Menu paths are `File → X` or `Menu → X`**, with the arrow, and `Menu →` means the point's bullet
  menu specifically. Name the menu the row actually lives in: `appearance-controls` sent readers to
  a "File menu under Appearance" section that does not exist (it is Settings), and to a "Guidance
  level" row that is really the Guidance card under Settings.
- Keep each **paragraph** to ~2–4 sentences. A short entry is one paragraph; a longer one
  splits into paragraphs on blank lines (`\n\n`), one sub-topic each, so it reads scannably
  instead of as a wall. The `examples` carry the precise syntax; the body is the why and the
  how. Wrap an inline syntax token the prose names in backticks (`` `is:todo` ``) so it reads
  as code, not prose.

**Verify every fact against `index.html` before writing** — exact menu labels, exact
keybinds, exact syntax tokens. Do not invent capabilities; if you're unsure a detail
ships, leave it out. A wrong keybind in the guide is worse than an absent entry.

---

## Adding an entry — checklist

1. Confirm the feature is genuinely shipped and user-facing (not parked/deferred/internal).
2. Pick the right `cat`; find a sensible insertion point in the array (entries display in
   array order within their category).
3. Write the entry — AP style, verified facts, `point`/`pill` vocabulary.
4. If it documents a `/` or `@` command, add the id to some entry's `covers:[…]`. That is the
   only step; the drift guard derives its id list from the registry, so there is no test list to
   update.
5. Run `node --test tests/test.mjs` — the GUIDE drift pins must stay green.
6. Boot the file in a browser (or headless) and open the Concept guide to eyeball the new
   entry renders, searches, and reads right. Verification artifacts stay out of the repo.

This is the concept-guide arm of the same rule the `guidance/ux-definition-of-done.md`
gate already enforces: **built ≠ shipped-discoverable.** A capability with no concept-guide
entry (and no other front door) is non-conformant.
