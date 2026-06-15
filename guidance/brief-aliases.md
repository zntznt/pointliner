# Agent Brief — Aliases (same-document Zettelkasten, Phase 3)

**Direction:** `guidance/roadmap.md` Phase 3 ("aliases"). Same-document, **ungated** (every
browser). Third Track-A feature after link-and-create (#96) and unlinked references. An **alias** is
an alternate name for a point so that linking and mention-detection find it under more than its
canonical title. Working method unchanged: **verified pure core first → seeded `node --test` pins →
DOM wiring → UX gate.** If anything here conflicts with `roadmap.md`, the roadmap wins.

> **#96 codebase fact (rely on it):** `exitEdit` does a **partial** single-node re-render, not a
> full `render()`; a structural change made *while a node is being edited* sets `_pendingFullRender`.
> Nothing in this brief edits from inside the active editor (all edits come from a dialog/chip), so
> they `render()` directly — but keep the rule in mind.

---

## 0. The storage decision (locked — this is the load-bearing choice)

**Aliases are a *reserved property* (`aliases`), NOT a new sidecar.** Value = a **comma-separated**
list of alt-names stored as one `node.props` entry (`{ key:'aliases', val:'wyrm, drake' }`),
round-tripping through the **existing `_props` OPML attribute**.

This continues the **`check` / `due` / `start` precedent** verbatim — those are reserved property
keys with dedicated editors, hidden from the generic Properties editor and merged back on save
(`reserved` predicate in `openPropsDialog` ~`5302`; `openPropChip` dispatch ~`12890`). Chosen over a
`node.aliases` sidecar + `_aliases` attribute because it adds **zero new storage concepts**: no new
sidecar field, no new OPML attribute to serialize+parse in lockstep, no new prune path — it inherits
props' round-trip, chip rendering, reserved-key hiding/merge-back, and `has:aliases` search for free.
Multi-value is handled by **comma-split at read time** (`aliasesOf`). **P5: zero new syntax.**

*Migration-free reinterpretation:* a user who already had a generic property literally keyed
`aliases` simply gains the alias behavior; the value stays in `_props`, nothing is lost.

---

## 1. What & why

Linking and unlinked-reference detection only know a point by its **canonical title**
(`textForDisplay`). Real notes have synonyms: *"Wyrm"* is also *"dragon"*; *"NYC"* is also *"New
York"*. **Aliases** let a point carry alt-names so the **`[[` link picker matches them** (type
`[[dragon` → the *Wyrm* point surfaces) and so mention-detection (unlinked references) can find them
too. It is metadata reusing the properties system — **no new pill, concept, or syntax.**

## 2. Locked decisions (do not redesign)

1. **Storage = reserved `aliases` property** (§0). Comma-separated value; `aliasesOf` splits it.
2. **Zero new authoring syntax.** Aliases are edited in a dialog and matched at lookup time. No new
   delimiter or token. **No P5 inventory addition.**
3. **Aliases extend *matching*, not *display*.** A link still renders the **canonical live title**
   (or an explicit `[[#id|label]]` caption — the existing way to show a custom word). v1 does **not**
   add an alias-as-caption mode.
4. **Front door = a dedicated Aliases dialog**, reached three ways (mirroring dates/check): the
   **bullet-menu "Aliases…"** item, a **chip** click, and the **`/alias` slash verb**.
5. **Candidacy still requires a non-empty canonical title.** Aliases broaden which *queries* match a
   point; they do not make a title-less point linkable.
6. **Provide `aliasesOf` + `nodeNames` as shared pure helpers** (§4.2) — the unlinked-references
   feature will consume them (§8 integration note).

## 3. Data model

No new field, no new OPML attribute. One reserved `node.props` entry:
`{ key: 'aliases', val: 'wyrm, drake' }`. `ALIAS_KEY = 'aliases'` const added beside `CHECK_KEY`
(~`1651`). Round-trips via `_props` (already serialized); the reserved merge-back in `openPropsDialog`
preserves it when the generic editor saves.

## 4. Wiring checklist — every layer, or it's not done

Verify each symbol by grep (line numbers drift).

1. **`ALIAS_KEY`** — add `const ALIAS_KEY = 'aliases';` next to `CHECK_KEY` (~`1651`).
2. **Pure cores** — add beside `textForDisplay` / the link helpers:
   ```js
   function aliasesOf(node) {
     const p = (node?.props || []).find(x => (x.key || '').trim().toLowerCase() === ALIAS_KEY);
     if (!p) return [];
     return String(p.val || '').split(',').map(s => s.trim()).filter(Boolean);
   }
   // Every name a point answers to: canonical title first, then aliases (deduped, non-empty).
   function nodeNames(node) {
     const out = [];
     const t = (textForDisplay(node) || '').trim();
     if (t) out.push(t);
     for (const a of aliasesOf(node)) if (a && !out.some(x => x.toLowerCase() === a.toLowerCase())) out.push(a);
     return out;
   }
   ```
   Add `aliasesOf`, `nodeNames` to the `need` array in `tests/load-cores.mjs`.
3. **Link picker matching** — `linkCandidates` (~`11220`): keep requiring a non-empty canonical
   `title`, but match the query against **any** `nodeNames(n)`, and record which alias matched:
   ```js
   const title = textForDisplay(n);
   if (title) {
     const names = nodeNames(n);
     if (query === '' || names.some(nm => nm.toLowerCase().includes(query))) {
       const hitTitle = query === '' || title.toLowerCase().includes(query);
       const alias = hitTitle ? null : (names.slice(1).find(nm => nm.toLowerCase().includes(query)) || null);
       out.push({ id: n.id, title, alias });
     }
   }
   ```
4. **Picker render hint** — `renderLinkMenu` (~`11252`): when `nd.alias`, append a muted hint span
   (`· alias: ‹nd.alias›`) after the title so the user understands why a non-title match appeared
   (P4). Keep `item.textContent = nd.title` as the primary label; the hint is additive markup.
   (The link-and-create "+ New point" row from #96 is unaffected — still last, still on non-empty
   query.)
5. **Reserved from the generic editor** — `openPropsDialog` (~`5302`): extend the predicate to
   `const reserved = k => DATE_KEYS.has(k) || k === CHECK_KEY || k === ALIAS_KEY;` (hides the alias
   prop from the generic rows and merges it back untouched on save — the dates/check path already
   does the rest).
6. **Chip** — the generic chip loop (~`5198`) already renders any prop as a chip with
   `dataset.propKey`; the alias prop renders automatically. Give it the dates-style nicer affordance:
   when `propK === ALIAS_KEY`, set `chip.title = 'Click to edit aliases'` and
   `aria-label = 'aliases: ‹val› — click to edit aliases'`. (Do **not** skip it like `check`.)
7. **Chip + door dispatch** — `openPropChip` (~`12890`): add
   `else if (chip.dataset.propKey === ALIAS_KEY) openAliasDialog(chip.dataset.propsId);` **before**
   the generic `else`.
8. **Bullet-menu door** — in the `actions` array (~`7626`, beside the dates/check doors):
   ```js
   { icon: { fa:'fa-solid fa-tag', fb:'🏷' },
     label: aliasesOf(node).length ? 'Edit aliases' : 'Add alias',
     fn: () => { hideBpop(); openAliasDialog(nodeId); } },
   ```
   (Reuse an existing tag/label glyph already in the FA subset — **do not** introduce an un-subsetted
   icon; if none fits, use the text fallback only. Confirm against `FA_GLYPHS` before picking.)
9. **`openAliasDialog(nodeId)`** — a small io-card dialog (follow `openCheckDialog` /
   `openDueDateDialog` conventions: `ioCard.innerHTML`, head, body, `io-foot` Cancel/Save,
   `ioCancel = closeIo`, `ioReturnFocus`, `ioBack.classList.add('on')`). One text input
   *"Aliases (comma-separated)"* prefilled with `aliasesOf(node).join(', ')`, `aria-label` set,
   Enter = save, Esc = cancel. **Save:**
   ```js
   pushUndo();
   const list = input.value.split(',').map(s => s.trim()).filter(Boolean);
   const others = (node.props || []).filter(p => p.key.trim().toLowerCase() !== ALIAS_KEY);
   node.props = list.length ? [...others, { key: 'aliases', val: list.join(', ') }] : others;
   markDirty(); render(); closeIo();
   ```
   (Empty input removes the alias prop entirely — clearing deletes, like the note editor.)
10. **`/alias` slash verb** — register beside `/check` / `/due` in the slash-verb list so it opens
    `openAliasDialog(node.id)` (the keyboard front door). Mirror exactly how `/check` is registered;
    don't invent a new menu mechanism.

## 5. UX conformance (gate — `guidance/ux-definition-of-done.md`)

- **P1 Predictable:** aliases are edited through the same dialog/chip pattern as dates and checks;
  the `[[` picker behaves identically, just matches more names. No new gesture.
- **P2 Discoverable:** three visible front doors (bullet-menu "Aliases…", chip, `/alias`); the
  picker shows an "alias: X" hint when an alias is why a point matched; `?` panel + `features.md`
  updated.
- **P3 Reachable:** the dialog is a standard io-card (focus-trapped, labeled inputs, Esc/Enter);
  the chip is `role="button"` + keyboard-activatable like every prop chip; `/alias` is keyboard-only
  by nature. All additive.
- **P4 Responsive:** saving updates the chip + picker immediately; clearing removes the chip; the
  picker hint explains alias matches (no silent "why did that appear?").
- **P5 Coherent:** **zero new syntax** — aliases reuse the properties system (a reserved key) and
  the existing `[[#id|]]` link. **No inventory row.**

**PR-body Conformance Statement** (CI reads the PR description — no statement, no merge):

```
UX Conformance — Aliases (same-document)
P1 ✅ edited via the dates/check dialog+chip pattern; [[ picker matches more names, same behavior
P2 ✅ bullet-menu "Aliases…", chip, and /alias front doors; picker shows "alias: X" hint; ?-panel + features.md updated
P3 ✅ standard io-card dialog (labeled, Esc/Enter); prop chip role=button keyboard-activatable; additive
P4 ✅ chip/picker update on save, removed on clear; picker hint explains alias matches (no silent surprise)
P5 ✅ zero new syntax — reserved `aliases` property + existing [[#id|]] link; no inventory addition
New non-conformances filed: none
Acceptance tests: pass    Regression: tests green · OPML _props round-trip · generic Properties editor preserves the alias
```

## 6. Tests (pin in `tests/test.mjs` BEFORE any DOM wiring)

- **`aliasesOf`:** `props:[{key:'aliases',val:'wyrm, drake'}]` → `['wyrm','drake']`; `'wyrm, , drake,'`
  → `['wyrm','drake']` (trims, drops empties); no aliases prop → `[]`; key case-insensitive
  (`'Aliases'`); value case preserved.
- **`nodeNames`:** title `Wyrm` + aliases `dragon, drake` → `['Wyrm','dragon','drake']`; dedupes a
  case-variant alias equal to the title; empty title → aliases only.
- **`linkCandidates` with aliases:** query `dragon` matches a point titled `Wyrm` aliased `dragon`,
  candidate `{ id, title:'Wyrm', alias:'dragon' }`; a title hit sets `alias:null`; self excluded; a
  point with aliases but **empty title** is **not** a candidate (§2.5); existing non-alias behavior
  unchanged (regression).
- Run `node --test tests/test.mjs` before and after; the **count only grows**.

## 7. Real-path verification gate (drive the app — browsers under `/opt/pw-browsers`)

1. On a point titled **Wyrm**, open **bullet menu → Add alias**, enter `dragon, drake`, save →
   confirm an **aliases chip** appears.
2. In another point type `[[dragon` → confirm **Wyrm** appears as a candidate with a **"alias:
   dragon"** hint → pick it → the inserted link resolves to Wyrm (live title).
3. Open **Edit properties** (generic dialog) on Wyrm → confirm the `aliases` row is **absent** there
   and that saving the generic dialog **does not drop** the alias (chip still present afterwards).
4. Click the **aliases chip** → the Aliases dialog opens prefilled; clear it + save → chip gone, and
   `[[dragon` no longer surfaces Wyrm.
5. **Save to OPML + reload** → aliases survive (`_props`).

## 8. Out of scope (do NOT build) + integration note

- **Cross-file** alias matching — waits on Phase 1.
- **Alias-as-caption** link display — already covered by the explicit `[[#id|label]]` caption.
- A dedicated **`alias:` search operator** / making general text search match aliases — a clean
  follow-on, not v1 (aliases are already weakly findable via `has:aliases`).
- Alias **uniqueness/collision** enforcement across the document, and **auto-suggesting** aliases.

**Integration with unlinked references — REQUIRED in this PR (unlinked refs already merged, #97).**
This brief ships `nodeNames` / `aliasesOf` as the shared name helpers, and unlinked references
(`collectUnlinkedRefs` / `linkifyMention`, PR #97) shipped matching the **canonical title only**.
Because that landed first, **this aliases PR is the second-merging one and MUST wire the join** —
otherwise aliases silently fail to improve unlinked references. Concretely, in the same PR:
- **`collectUnlinkedRefs`**: match a mention when **any** `nodeNames(target)` appears (not just the
  title) — build the word-boundary regex from each name, or alternate them. Keep the existing
  exclusions (self, already-linked, in-token, min-length applied per name).
- **The Link action**: the matched name may be an alias, not the title, so try
  `linkifyMention(text, name, targetId)` for each `name of nodeNames(target)` until one returns
  non-null (link whichever name actually appears in that point's text).
- **Pin it:** add a test where a point is found as an unlinked reference **via an alias** (the title
  itself does not appear), and the Link action converts the alias occurrence.
This is a real correctness item, not speculative cross-wiring — do it here.

## 9. Process hygiene (carry every time)

- **Branch off freshly-fetched `origin/main`** (post-#97 — unlinked references; `git fetch` first;
  confirm the test count matches current main, ~461 at #97). Guidance docs under `guidance/`.
- **Pure core → green pins → then DOM.** No committed verification artifacts (no Playwright / npm /
  node_modules / screenshots); `git status` shows only `index.html`, `tests/`, and the
  `?`-panel / `features.md` doc edits.
- PR body = short Summary + the §5 Conformance Statement. After creating the PR, **strip the
  auto-appended `claude.ai/code` session link** from the body and verify it's gone. No agent
  attribution / Co-Authored-By.

---

*Implements `guidance/roadmap.md` Phase 3, aliases. Storage = a reserved `aliases` property (the
`check`/dates precedent), edited via a dedicated dialog (bullet menu + chip + `/alias`), matched in
the `[[` picker via the shared `nodeNames` helper. Wired through every layer in §4, proven on the
real path in §7. No new syntax, no new sidecar. The unlinked-references join and a single-doc graph
view are separate briefs.*
