# Single-file reassurance + scaling legibility (#1268)

**Shipped so far:** #1268 already carries passing tests for `saveStatusLabel`, `relTimeShort`, the save-status chip wiring and the restore safety net. Confirm what remains before treating this proposal as unbuilt.

## The wall (2026-08 panel)

Single-file is an identity pillar AND the panel's most recurring anxiety, in two flavors:

- **Fear of loss (non-technical):** Grace ("one file I save myself is a job"), Rosa ("one file I have to
  remember to save and not lose, that alone kills it; my QuickBooks I hate, but it doesn't vanish if I
  forget to save").
- **Scaling / history (technical):** Marisol ("single file makes me nervous for years of client
  history"), Ken ("single file means no grep across a tree, a scaling wall").

## The finding: the safety is real, but hidden

Everything a nervous user needs ALREADY EXISTS; it is just scattered and mostly invisible:

- **Autosave is continuous and three-tiered** (OPFS + localStorage +, in folder mode, the file on disk),
  debounced ~800 ms, and flushed synchronously on tab close. It genuinely cannot be lost by "forgetting
  to save."
- **Restore earlier version is real** (a rolling per-document snapshot every ~5 min) — but its File-menu
  row is HIDDEN until a snapshot exists, so the safety net is invisible exactly when a first-time user is
  deciding whether to trust the app.
- **The honest status copy exists** (`updateFmStatus`: "All changes saved" / "Autosaved in this browser")
  and a **"Saving your work" guide entry** already states all three facts — but both are behind a menu the
  nervous user has no reason to open.
- The **Welcome intro** says "Your file, offline, no account" but NOT "it saves itself" or "you can roll
  back."
- `savedAt` is stored on every write but **never shown**. There is no always-visible "it's saved" signal.

So the fear-of-loss half is a **perception gap**, exactly as the issue says. The fix is to make the
existing safety legible, not to change the model. No cloud, no accounts (out of charter).

## Proposal

### 1. An always-visible "Saved" status in the toolbar (the centerpiece)

Today the toolbar shows only a *dirty dot* (an absence-of-safety signal, and only in the narrow
unsaved-to-disk case). Add a small, honest, positive **save-status affordance** next to the File cue that
a nervous user sees continuously as they work:

- **Default (autosaving):** "Saved" with a relative time that updates ("Saved just now" → "Saved 2 min
  ago"), read from the real `savedAt`. Briefly "Saving…" during a write.
- **Honest per tier:** in folder mode, "Saved to folder"; when there is genuinely no durable store
  (autosave disabled and OPFS failed), it does NOT say "Saved" — it says "In memory only, save a copy",
  matching the existing backup-nudge truth.
- **A bound file with unwritten edits** keeps the existing dirty meaning ("Unsaved changes").
- **Click** opens the File menu (where the full story, export, and Restore live), so the affordance is
  also the door to the safety net. Tooltip carries the one-line reassurance.

This is the single highest-value change: it turns "one file I might lose" into "I can watch it save
itself." It reuses `savedAt`, the autosave lifecycle, and `updateFmStatus`'s tier logic; no new storage.

### 2. Surface the restore safety net earlier

The Restore row is hidden until a snapshot exists. Reassurance matters BEFORE that. Make the safety net
legible without lying about availability (see the decision below): either show the row always (disabled
with "available once you've been working a while" until a snapshot exists), or state in the save-status
tooltip / guide that "earlier versions are kept automatically."

### 3. Add the missing reassurance halves to the Welcome intro

Extend the existing ownership line so a first-time user reads all three facts up front: your file, offline,
no account; **it saves itself as you type**; **earlier versions are kept so you can roll back**.

### 4. Scaling honesty (the technical half)

Add one honest paragraph to the "Saving your work" / "Working with a folder" guide entries: name the real
ceiling (a single very large document lives in one file and one browser store; there is no grep across a
tree and very large histories get heavy), and point at the **connected-folder model** (a folder of
documents, each its own file, with cross-document links) as the answer for years of history. This overlaps
the diff-serialization proposal (#1266) and stays copy-only here; it sets honest expectations rather than
overpromising a single file scales forever.

## Non-goals / boundaries

- **No cloud, no accounts, no sync.** The model does not change; only its legibility does.
- **No new storage mechanism.** The affordance reads existing state (`savedAt`, tiers, dirty).
- **Honesty over comfort (P4).** The status never claims "Saved" when the durable store genuinely failed;
  the scaling note names the real ceiling rather than hiding it.

## Acceptance / verification

- The save-status affordance is visible by default, updates its relative time, shows "Saving…" then
  "Saved", and reads correctly in each tier (browser / folder / memory-only) — pinned via the state→label
  mapping (a pure function, testable) and live-driven.
- Clicking it opens the File menu; the Welcome intro carries the three facts; the guide states the scaling
  ceiling and points at the folder model.
- No regression to the dirty-dot / `updateFmStatus` truth; the toolbar stays one non-wrapping strip
  (UXP-258).

## Build shape

Likely one PR: a `saveStatusLabel(state)` pure function (tier + savedAt → the honest label) + a toolbar
element updated on the autosave lifecycle, the Welcome-intro copy, the guide paragraph, and the
restore-legibility choice. UX Conformance: P2 (a nervous user SEES the safety), P4 (never a false "Saved"),
P1/P5 (no new mechanism, reuses the File menu and status logic).
