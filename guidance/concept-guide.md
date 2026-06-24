# The in-app concept guide (`GUIDE`)

**What this is for:** the steps to add or fix an end-user help entry in Pointliner's
in-app **Concept guide** — the searchable panel a user opens from the shortcuts
popover's "Concept guide ›" footer button. If you ship a user-facing feature, its
concept-guide entry ships in the same change. This doc exists so you don't have to
re-derive the structure, the drift-guard contract, or the house writing style every
time.

---

## Where it lives

Everything is in `index.html`:

- **`const GUIDE = [ … ]`** — one flat array, two kinds of object:
  - **Essential shortcuts** carry `essential:true` + `essSection` + `keys` + `essLabel`.
    These build the **Shortcuts & syntax** popover (`buildShortcutsPanel`), not the
    concept guide. Leave them unless you're touching keyboard shortcuts.
  - **Concept entries** carry **`cat`** (and `title`/`body`/`examples`). These ARE the
    concept guide. `openGuide()` does `GUIDE.filter(e => e.cat)` — *the presence of `cat`
    is what makes an object a guide entry.*
- **`openGuide(initialId)`** — renders the panel. The left nav is two-level: a category
  header per `CATS` group, then one clickable item per entry. **Array order = display
  order** within a category, so insert an entry where it reads sensibly.
- The footer button (`#sc-guide-open`, label "Concept guide ›") calls `openGuide()`.

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
| `body` | one plain string of AP-style prose (see below). `escHtml`'d at render, so **no HTML and no entities** — write the literal `&`, `<`, `'`, em-dash. |
| `examples` | array of `{ syn, desc }`. `syn` = the literal key/menu-path/syntax the user types or clicks; `desc` = a lowercase-leading short gloss. Both are `escHtml`'d. Use `[]` if none. |
| `covers` | **optional.** Array of `BLOCK_CMDS`/`INSERT_CMDS` ids this entry documents. Only add command ids here — it's the drift-guard contract, not a free-text tag. A bullet-menu-only feature (e.g. properties, notes) has no command id, so omit `covers`. |

The eight categories (the `CATS` list in `openGuide`, in display order):
`getting-around` · `writing` · `todos` · `dates` · `generators` · `compute` · `links` · `files`.
Adding a ninth means adding to `CATS` too, or its entries render orphaned.

---

## The drift-guard contract (the thing that bites)

Two tests in `tests/test.mjs` enforce that **every slash and @-menu command is documented**:

- `GUIDE drift guard: all BLOCK_CMDS ids are covered in GUIDE`
- `GUIDE drift guard: all INSERT_CMDS ids are covered in GUIDE`

They extract every `covers:[…]` token from the `GUIDE` source block and assert that a
hardcoded list of command ids is a subset. **When you add a `/` verb (`BLOCK_CMDS`) or
an `@` insert (`INSERT_CMDS`):**

1. Add the command's id to some entry's `covers:[…]` (existing or a new entry).
2. **Add the id to the matching hardcoded list inside the test** (`BLOCK_IDS` /
   `INSERT_IDS`). The test lists are NOT derived from the live registries — that's a
   known gap. A new command id that you forget to add to the test list will pass the
   guard while genuinely missing from the guide. If you want to find *all* gaps, diff
   the live `BLOCK_CMDS`/`INSERT_CMDS` ids against the union of `covers:[…]` yourself —
   the test alone won't surface a command the test author never listed.

Two more guide tests to keep green: the `GUIDE registry declaration is present` pin and
the `guide nav is a two-level list` pin (every `cat` entry needs a `title`).

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
- Keep `body` to ~2–4 sentences. The `examples` carry the precise syntax; the body is the
  why and the how.

**Verify every fact against `index.html` before writing** — exact menu labels, exact
keybinds, exact syntax tokens. Do not invent capabilities; if you're unsure a detail
ships, leave it out. A wrong keybind in the guide is worse than an absent entry.

---

## Adding an entry — checklist

1. Confirm the feature is genuinely shipped and user-facing (not parked/deferred/internal).
2. Pick the right `cat`; find a sensible insertion point in the array (entries display in
   array order within their category).
3. Write the entry — AP style, verified facts, `point`/`pill` vocabulary.
4. If it documents a `/` or `@` command, add the id to `covers:[…]` **and** to the test's
   `BLOCK_IDS`/`INSERT_IDS` list.
5. Run `node --test tests/test.mjs` — the GUIDE drift/nav pins must stay green.
6. Boot the file in a browser (or headless) and open the Concept guide to eyeball the new
   entry renders, searches, and reads right. Verification artifacts stay out of the repo.

This is the concept-guide arm of the same rule the `guidance/ux-definition-of-done.md`
gate already enforces: **built ≠ shipped-discoverable.** A capability with no concept-guide
entry (and no other front door) is non-conformant.
