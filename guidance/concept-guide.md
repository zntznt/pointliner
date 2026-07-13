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
| `cat` | one of the eight category ids below — must match a `CATS` entry in `openGuide`, or the entry renders in no group. |
| `title` | short noun phrase; it's the left-list label. **Raw text** — `openGuide` runs it through `escHtml`, so write `&`, not `&amp;`. |
| `body` | AP-style prose (see below). `escHtml`'d at render, so **no HTML and no entities** — write the literal `&`, `<`, `'`. **AP punctuation only; the em dash is banned in GUIDE copy** (CLAUDE.md, cleared wholesale in PR #158) — rewrite, never a `—`. Two authoring conveniences run after `escHtml` (so they can't inject): a **blank line** (`\n\n`) starts a new paragraph — keep each paragraph 2 to 4 sentences and give any entry past ~400 chars real paragraph breaks; and a **backtick pair** wraps an inline syntax token as `code` (`` `is:todo` ``, `` `Ctrl/Cmd+Shift+I` ``) — a lone backtick stays literal. A single-paragraph, backtick-free body renders exactly as before. |
| `examples` | array of `{ syn, desc }`. `syn` = the literal key/menu-path/syntax the user types or clicks; `desc` = a lowercase-leading short gloss. Both are `escHtml`'d. Use `[]` if none. |
| `covers` | **optional.** Array of `BLOCK_CMDS`/`INSERT_CMDS` ids this entry documents. Only add command ids here — it's the drift-guard contract, not a free-text tag. A bullet-menu-only feature (e.g. properties, notes) has no command id, so omit `covers`. |

The eight categories (the `CATS` list in `openGuide`, in display order):
`getting-around` · `writing` · `todos` · `dates` · `generators` · `compute` · `links` · `files`.
Adding a ninth means adding to `CATS` too, or its entries render orphaned.

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

The tests slice the GUIDE array between `const GUIDE = [` and the stable `// GUIDE-END`
boundary marker (kept in `index.html` right after the array's closing `];`), and each asserts
it found a non-empty registry block and a non-empty covers set, so a renamed/moved const fails
loudly instead of letting the guard pass vacuously.

(Historical note: the guard once hardcoded the two id lists, which rotted — `rollpick` (#579)
shipped uncovered because nobody updated the list, and the guard was later lost entirely in a
refactor. #596 rebuilt it deriving from the registries so neither can recur.)

Beyond commands, several shipped features are **bullet-menu / toolbar only** (no command
id): capture/inbox, refile, properties, per-point notes, saved searches, hashtags,
multi-select, zoom, the folder-of-notes workspace, appearance controls. These are NOT
caught by the drift guard at all — keeping them documented is a manual discipline, the
same P2-discoverable obligation as any feature.

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
  *essential shortcut* rows use the `MOD`/`⇧` glyphs; concept-entry bodies do not.)
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
