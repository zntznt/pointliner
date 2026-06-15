# Agent Brief — Link-and-create (same-document Zettelkasten, Phase 3)

**Direction:** `guidance/roadmap.md` Phase 3 ("link-and-create while typing"). Same-document,
**ungated** (every browser). This extends the **already-shipped** `[[` link picker; it is **not**
part of the Chromium multi-doc lift. Mirror the working method that landed the generative features:
**pure core → seeded `node --test` pins → DOM wiring → UX gate.**

> **Status:** implemented. The one flagged product decision below is **resolved** — a created note
> lands in the **inbox if one is set, else at top level** (`resolveInbox() || root`).

## Resolved product decision
**Where does a newly-created note land?** **`resolveInbox()` if `root.inboxId` is set, else the
document root (new last top-level point).** Always works (no inbox required), reuses the existing
"unfiled" concept, user can refile later. (Alternatives considered and rejected: always-top-level,
child-of-current-point.)

---

## 1. What & why
Before this, typing `[[query` opened the picker and — when nothing matched — **the menu just
disappeared** (`checkLinkTrigger` hid on zero candidates). That's the dead end Zettelkasten users hit
constantly: the note you want to link doesn't exist *yet*. **Link-and-create** closes it: the picker
always offers a **"+ New point: ‹query›"** row that, when chosen, **creates a stub point titled with
what you typed and links to it in one gesture** — the core "`[[a new idea]]` and it exists" move. You
keep writing where you are (capture's "never navigates you" principle); the stub appears in the
outline on the next render and you flesh it out later via the link.

This is **declare-by-linking**. It adds a row to an existing menu and a create branch to its apply
path — **not** a new concept, pill, or syntax.

## 2. Locked decisions (do not redesign)
1. **Zero new authoring syntax.** Reuses the `[[` trigger and the existing live-title token
   `[[#id|]]` (the same form `lpApply`/"Copy link" produce). **No P5 inventory addition.**
2. **The create row is always the *last* option** when the (trimmed) query is non-empty — shown
   **regardless** of how many candidates exist, so you can deliberately make a new point even when a
   similar title exists. Empty/whitespace-only query → **no** create row.
3. **Create destination:** `resolveInbox() || root`. New point is `parent.children.push(...)`.
4. **Stays in edit mode; does NOT call `render()`.** The current point is mid-edit (the menu fired
   on `mousedown`+`preventDefault`, focus is held). Creating the node mutates the tree +
   `nodeMap`/`parentMap` + `markDirty()`; the new stub paints on the **next** full render
   (exit/navigate). Calling `render()` mid-edit would destroy the active contenteditable/caret —
   **forbidden here.**
5. **Title is the raw-case typed query** (trimmed), not the lowercased match query. Markdown-aware
   like capture: `deriveTypeFromText` + `todoDoneFromText` so `[[- [ ] buy milk]]` makes a to-do stub.
6. **Structural undo:** `pushUndo()` before the create (one entry restores both the new node and the
   inserted link).

## 3. Data model
**None new.** A created note is an ordinary `mkNode(title)`. The link is the existing `[[#id|]]` text
token (no sidecar, round-trips as plain text). `lpState` gains one field:
- `lpState.create` — the create-option object (`{title}`) or `null`. Drives the extra menu row and
  the apply branch.
- `lpState.matches` stays the real candidate list (possibly **empty** now).

## 4. Wiring (every layer)
1. **Pure core `linkCreateOption(rawQuery)`** (beside `linkCandidates`): `const t =
   String(rawQuery||'').trim(); return t ? { title: t } : null;`. Added to the `need` array in
   `tests/load-cores.mjs`.
2. **`checkLinkTrigger`:** compute `const create = linkCreateOption(m[1]);` (raw case). Bail becomes
   `if (!candidates.length && !create) { hideLinkMenu(); return; }`. `create` goes into `lpState`.
3. **`renderLinkMenu`:** after the matches, if `lpState.create`, append one `.lp-item.lp-create` row
   (`role="option"`, `id="lp-opt-"+matches.length`, `aria-selected`, `mouseenter`/`mousedown` like the
   others) labelled **`+ New point: "‹title›"`**.
4. **`lpMove`:** `const n = lpState.matches.length + (lpState.create ? 1 : 0);` (wrap includes it).
5. **`lpApply`:** branch on `isCreate = create && activeIdx === matches.length`; on create,
   `pushUndo()`, build `mkNode(title)` with `type = deriveTypeFromText(title) || 'ul'` and
   `checked = todoDoneFromText(title)`, push to `resolveInbox() || root`, set `nodeMap`/`parentMap`,
   `announce(...)`; then the **shared** splice inserts `[[#targetId|]]` for both branches and
   `flashHint(...)` confirms on create. **No `render()`.**
6. **Keyboard handler is unchanged** — `Enter`/`Tab` already call `lpApply()`, which self-selects
   create-vs-link from `activeIdx`.

## 5. UX conformance
- **P1 Predictable:** same `[[` menu, same ↑/↓/Enter/Tab/Esc keys; the create row inserts a link
  exactly like picking a candidate, and additionally makes the target. No new gesture.
- **P2 Discoverable:** the create row is a **visible front door** inside the existing picker (no
  syntax-only path); `?` panel `[[` row + `features.md` updated.
- **P3 Reachable:** create row is `role="option"`, keyboard-selectable, `aria-selected` +
  `aria-activedescendant` like its siblings; creation announced via the `#a11y-live` region; built on
  `mousedown`+`preventDefault` (caret invariant preserved — **not** `click`).
- **P4 Responsive:** create flashes a confirmation and inserts a visible link; empty query → row
  absent (no silent no-op).
- **P5 Coherent:** **zero new syntax** — reuses `[[` + `[[#id|]]`. **No inventory row.**

## 6. Tests (`tests/test.mjs`)
- **`linkCreateOption`:** `'Dragon'`→`{title:'Dragon'}`; `'  spaced  '`→`{title:'spaced'}`; `''`/`'   '`/
  `null`→`null`; case preserved.
- **Stub shape:** `mkNode(linkCreateOption('Buy milk').title)` yields `text:'Buy milk'` + full
  sidecars; `deriveTypeFromText('- [ ] x')`→`'todo'` / `todoDoneFromText` classify a task title.
- **`linkCandidates` regression** stays green.

## 7. Real-path verification
Create→link→backlink→rename(live-title)→OPML round-trip (plain-text token, no `_link` attr)→
markdown-aware to-do stub→empty query yields no create row. Undo reverts both node and link.

## 8. Out of scope (separate briefs)
- **Cross-file** create/link (`[[docId#nodeId|label]]`) — Phase 1.
- **Aliases** and **unlinked references** — their own Phase-3 briefs.
- A destination **picker** at create time, or "create as child of current point".
- Auto-stamping a **template** into the new stub; auto-**navigating** to it.
- Create from the bracket-**paste** path or the `@`→Link inserter — the `[[` picker is the only
  create door in v1.
