# Agent Brief — Unlinked references (same-document Zettelkasten, Phase 3)

**Direction:** `guidance/roadmap.md` Phase 3 ("unlinked references"). Same-document, **ungated**
(every browser). Builds on the shipped link index (`collectLinks`) and backlinks panel
(`showBlPanel`). The companion to link-and-create (PR #96) — that one creates a link where none
exists; **this one surfaces mentions that *should* be links and converts them in one click.** Same
working method: **verified pure core first → seeded `node --test` pins → DOM wiring → UX gate.** If
anything here conflicts with `roadmap.md`, the roadmap wins.

> **Codebase fact learned in PR #96 (rely on it, don't re-trip):** `exitEdit`'s common path does a
> **partial single-node re-render, not a full `render()`** — a structural change made *while a node
> is being edited* must set **`_pendingFullRender`** (honored by `exitEdit` on exit; mid-edit
> `render()` is forbidden — caret). The Link action in §4 fires from the **backlinks panel, not the
> active editor**, so it renders directly — but if the focused node is mid-edit, see §4.5.

---

## 1. What & why

The backlinks panel answers "what links here?" It is silent about the more common case: **another
point names this one in plain prose but never linked it.** Those *unlinked references* are where a
networked outline quietly loses its connective tissue.

**Unlinked references** adds a second section to the existing panel: for the focused point, list
other points whose text **mentions this point's title** (whole-word, case-insensitive) **without
already linking to it**, each with a one-click **Link** action that wraps the mention in a real
`[[#id|]]` link. It is the natural counterpart to link-and-create and reuses the same token, panel,
and index machinery — **no new concept, pill, or syntax.**

## 2. Locked decisions (do not redesign)

1. **Zero new authoring syntax.** The Link action emits the existing live-title token `[[#id|]]`
   (the same form the picker / "Copy link" produce). **No P5 inventory addition.**
2. **Match = whole-word, case-insensitive, on the point's title.** The target title is
   `textForDisplay(targetNode)`. Boundaries mirror the hashtag rule (`(?<![a-zA-Z0-9])` …
   `(?![a-zA-Z0-9])`) so `cat` never matches `category`. Match against `n.text` **with `[[…]]`
   tokens stripped** (`.replace(/\[\[[^\]]*\]\]/g, ' ')`) so a link's own label/token never reads
   as an unlinked mention (the `collectTags` precedent).
3. **Exclusions:** the target point itself; any point already in `collectLinks().backlinks[target]`
   (already links → it's a *backlink*, not unlinked); matches that fall inside an existing `[[…]]`
   token.
4. **Noise floor:** skip entirely when the trimmed title length `< UNLINKED_MIN_LEN` (= **3**) — a
   1–2 char title would match half the document. Stop-word filtering is **out of scope** (§8).
5. **Link action converts the *first* outside-token occurrence** in that point to `[[#id|]]` and
   leaves the rest of the text untouched; the point then moves from "Unlinked references" to
   "Linked from" on panel refresh.
6. **The panel opens if *either* section is non-empty** (today it opens only when backlinks exist).
   Structural edit from the panel → `pushUndo()` before, `markDirty()` + `render()` after.

## 3. Data model

**None new.** Unlinked references are *derived* (a tree walk), not stored. The converted link is the
existing `[[#id|]]` text token (no sidecar, round-trips as plain text). No OPML change, no prune.

## 4. Wiring checklist — every layer, or it's not done

Verify each symbol by grep (line numbers drift).

1. **Pure core `collectUnlinkedRefs(targetId, rootNode = root)`** — add beside `collectLinks`
   (~`9444`), same pure-over-rootNode shape:
   ```js
   const UNLINKED_MIN_LEN = 3;
   function collectUnlinkedRefs(targetId, rootNode = root) {
     let title = null;
     (function find(n){ if (title!==null) return;
       if (n.id===targetId){ title = textForDisplay(n) || ''; return; }
       for (const c of n.children||[]) find(c); })(rootNode);
     if (title === null) return [];
     const t = title.trim();
     if (t.length < UNLINKED_MIN_LEN) return [];
     const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     const re  = new RegExp(`(?<![a-zA-Z0-9])${esc}(?![a-zA-Z0-9])`, 'i'); // non-global → stateless .test
     const linkers = new Set(collectLinks(rootNode).backlinks[targetId] || []);
     const out = [];
     (function walk(n){
       if (n.id !== targetId && !linkers.has(n.id)) {
         const stripped = (n.text||'').replace(/\[\[[^\]]*\]\]/g, ' ');
         if (re.test(stripped)) out.push({ id: n.id, title: textForDisplay(n) || '(untitled)' });
       }
       for (const c of n.children||[]) walk(c);
     })(rootNode);
     return out;
   }
   ```
   *Not cached* — it's target-specific and only runs on panel open/refresh (the same cadence that
   already calls `collectLinks`); the backlink exclusion reuses the cached `collectLinks`.
2. **Pure core `linkifyMention(text, title, targetId)`** — converts the first outside-token mention,
   or `null` if none:
   ```js
   function linkifyMention(text, title, targetId) {
     const esc = (title||'').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     if (!esc) return null;
     const re = new RegExp(`(?<![a-zA-Z0-9])${esc}(?![a-zA-Z0-9])`, 'i');
     const spans = []; let t; const tok = /\[\[[^\]]*\]\]/g;
     while ((t = tok.exec(text))) spans.push([t.index, t.index + t[0].length]);
     let from = 0;
     while (from <= text.length) {
       const m = re.exec(text.slice(from));
       if (!m) return null;
       const i = from + m.index, e = i + m[0].length;
       if (!spans.some(([a,b]) => i < b && e > a)) return text.slice(0,i) + `[[#${targetId}|]]` + text.slice(e);
       from = i + 1;
     }
     return null;
   }
   ```
3. **`tests/load-cores.mjs`** — add `collectUnlinkedRefs`, `linkifyMention` to the `need` array.
4. **Panel data** — `showBlPanel(nodeId)` (~`13009`): also compute
   `const unlinked = collectUnlinkedRefs(nodeId);`. Change the open guard from
   `if (!sources.length) { hideBlPanel(); return; }` to
   **`if (!sources.length && !unlinked.length) { hideBlPanel(); return; }`**; pass both to
   `renderBlPanel(sources, unlinked)`. `updateBlPanel` (~`13041`) mirrors the same open condition.
5. **Panel render** — `renderBlPanel(sources, unlinked)` (~`13026`): keep the existing "Linked from"
   list; below it, when `unlinked.length`, render an **"Unlinked references · N"** subheading + one
   `.bl-item.bl-unlinked` row per entry (click → `zoomInto(id)`, exactly like a backlink row) **plus
   a "Link" control** per row:
   - The Link control is a real focusable element (`role="button"`, `tabindex="0"`,
     `aria-label="Link this mention to ‹focused title›"`), activated by **`mousedown`+`preventDefault`**
     (caret-safe) **and** Enter/Space. On activate:
     ```js
     const mentionNode = nodeById(id); if (!mentionNode) return;
     const focusTitle = textForDisplay(nodeById(blNodeId));
     const next = linkifyMention(mentionNode.text, focusTitle, blNodeId);
     if (next == null) return;                 // nothing to do (P4: no silent corruption)
     pushUndo();
     mentionNode.text = next; markDirty(); render();
     showBlPanel(blNodeId);                     // refresh: the row moves to "Linked from"
     liveAnnounce('Linked mention');
     ```
   - If the focused node (`blNodeId`) is itself being edited when Link is pressed, route the same
     way panel navigations already coexist with editing (a `render()` from a panel button is the
     base-table precedent); only an edit of the *active* node's own text needs the `_pendingFullRender`
     dance — this edits a **different** node, so a direct `render()` is safe. **Confirm in the
     real-path gate (§7).**
6. **CSS** — `.bl-unlinked` row + Link button styling reuse the existing `.bl-item` tokens; the
   button is text-button styled (no new color tokens — `--acc` / `--muted` per the design language).

## 5. UX conformance (gate — `guidance/ux-definition-of-done.md`)

- **P1 Predictable:** the unlinked list lives in the **same** backlinks panel, rows click-to-zoom
  exactly like backlink rows; Link emits the same `[[#id|]]` as every other link path. No new gesture.
- **P2 Discoverable:** a **visible** second section in an existing surface (never syntax-only); the
  `?` panel backlinks/links entry + `guidance/features.md` updated to describe unlinked references +
  the Link action.
- **P3 Reachable:** Link control is `role="button"`, keyboard-operable (Enter/Space) **alongside**
  `mousedown`+`preventDefault` (caret invariant — **do not** convert to `click`/`<button>` in a way
  that steals caret focus); accurate `aria-label`; the conversion announced via the `#a11y-live`
  region; focus-visible.
- **P4 Responsive:** Link flips the row from "Unlinked references" to "Linked from" (visible
  change) + announces; `linkifyMention` returning `null` is a quiet no-op on already-handled text,
  never a silent corruption.
- **P5 Coherent:** **zero new syntax** — reuses `[[#id|]]`. **No inventory row.**

**PR-body Conformance Statement** (CI reads the PR description — no statement, no merge):

```
UX Conformance — Unlinked references (same-document)
P1 ✅ same backlinks panel; rows click-to-zoom like backlinks; Link emits the existing [[#id|]] token
P2 ✅ visible second section in the existing panel; ?-panel + features.md updated
P3 ✅ Link control role=button, Enter/Space + mousedown+preventDefault (caret invariant); aria-label; a11y-live announce
P4 ✅ Link flips row to "Linked from" + announces; null linkify = quiet no-op, never silent corruption
P5 ✅ zero new syntax — reuses [[#id|]]; no inventory addition
New non-conformances filed: none
Acceptance tests: pass    Regression: tests green · OPML round-trip (link is plain text) · undo reverts the Link
```

## 6. Tests (pin in `tests/test.mjs` BEFORE any DOM wiring)

Build small explicit trees (pass `rootNode` so the cores are pure):
- **`collectUnlinkedRefs`:** target titled `Dragon`; a sibling "the dragon sleeps" (no link) → **included**;
  a sibling `[[#dragonId|]] guards it` (links) → **excluded**; a sibling "category of beasts" → **excluded**
  (word boundary, not a `cat`-in-`category` style hit); the target itself → excluded; a mention only
  inside a `[[…]]` token → excluded; a 2-char title → `[]` (min-len). Case-insensitive ("DRAGON" matches).
- **`linkifyMention`:** wraps the first outside-token occurrence → `…[[#id|]]…`; returns `null` when
  the only occurrence is inside an existing token; returns `null` when absent; leaves a *second*
  occurrence untouched (only the first converts); case-insensitive match, original surrounding text
  preserved.
- **Regression:** `collectLinks` pins unchanged and green.
- Run `node --test tests/test.mjs` before and after; the **count only grows**.

## 7. Real-path verification gate (the #45/#51/#96 lesson — drive the app, don't just trust pins)

A browser is available under `/opt/pw-browsers` (the #96 lesson). In the app:
1. Focus a point titled **Dragon**; add another point "the dragon sleeps" with **no** link →
   confirm the panel shows an **Unlinked references** section listing it.
2. Press **Link** on that row → confirm its text becomes a `[[#id|]]` link (renders *Dragon* live
   title), the row **moves to "Linked from"**, the backlink count updates, and **focus is not lost
   from any active editor** (test both: panel used while the focused node is idle, and while it's
   being edited).
3. **Undo** → the Link reverts (text back to plain prose, row back to Unlinked references).
4. A point already linking to Dragon never appears in Unlinked references; "category" never matches.
5. **Save to OPML + reload** → converted link survives (plain-text token).

## 8. Out of scope (do NOT build — separate / deferred)

- **Cross-file** unlinked references — waits on Phase 1.
- **Aliases** — the next Track-A brief (an alias would *also* be matched here once it exists; this
  brief matches the canonical title only).
- **"Link all" / bulk convert**, and converting *every* occurrence in a point (v1 = first occurrence).
- **Stop-word / common-word suppression** beyond the min-length floor, and fuzzy/stemmed matching.
- A standalone unlinked-references search view — this rides the existing per-focus panel only.

## 9. Process hygiene (carry every time)

- **Branch off freshly-fetched `origin/main`** (post-#96; `git fetch` first; confirm the test count
  matches current main — it should include the link-and-create pins). Guidance docs under `guidance/`.
- **Pure core → green pins → then DOM.** No committed verification artifacts (no Playwright / npm /
  node_modules / screenshots); `git status` shows only `index.html`, `tests/`, and the
  `?`-panel / `features.md` doc edits.
- PR body = short Summary + the §5 Conformance Statement. After creating the PR, **strip the
  auto-appended `claude.ai/code` session link** from the body and verify it's gone. No agent
  attribution / Co-Authored-By.

---

*Implements `guidance/roadmap.md` Phase 3, unlinked references. Two pure cores
(`collectUnlinkedRefs`, `linkifyMention`) + a second section in the existing backlinks panel with a
one-click Link action emitting the existing `[[#id|]]` token. Wired through every layer in §4,
proven on the real path in §7. No new syntax. Aliases and a single-doc graph view are separate,
later briefs.*
