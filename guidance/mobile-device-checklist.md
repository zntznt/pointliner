# Mobile device verification checklist

> Things a browser at a resized 500px window **cannot** settle — only a real thumb on a
> real phone (360–430px wide) can. The automated review fleet flagged these as
> "needs-device": the source facts are known (and the fixable ones are filed as issues,
> see below), but whether they actually *cost a tap in practice* is a physical question.
>
> Run this when you have a phone handy. Load the app on the device (or via your dev
> server's LAN address), and walk each item. Mark ✅ fine / ❌ hit it / 🤔 borderline.

## Why the browser can't test these

The desktop test browser reports `IS_TOUCH = false` (it lacks `(hover:none) and
(pointer:coarse)`), so the `@media(hover:none)` rules and touch-only JS branches don't
activate live, and a mouse cursor doesn't fat-finger the way a thumb does. Chrome's
device-emulation *can* flip `IS_TOUCH`, but it still can't reproduce thumb size, reach,
or the OS-level edge gestures. So these are lived-feel checks, not measurements.

---

## The checklist

### 1. First-run banner buttons — do they feel tappable?
- **What:** on a genuine cold boot (clear site data first), the Examples banner shows
  "Start a blank outline" / "Save to file" and a ✕. PR #435 grew these to 36px + a hit
  overlay under `@media(hover:none)`.
- **Test:** cold-boot on the phone, try to tap "Start a blank outline" and the ✕ with
  your thumb, first try, without zooming. Do they hit cleanly?
- **Pass:** first-try taps land. **Fail:** you miss or mis-hit the neighbor.

### 2. Pill body re-roll — right-edge mis-tap rate  *(issue #438)*
- **What:** tapping a `{dice}`/`{a|b}` pill body re-rolls it; the edit pencil is a
  biased-right overlay. On the Examples doc, tap several pills to re-roll.
- **Test:** re-roll 10 pills by tapping their bodies. How often does a body tap open the
  **Edit dialog** instead (because your thumb landed in the right-edge pencil zone)?
- **Pass:** re-roll every time. **Fail / 🤔:** the Edit dialog opens on body taps often
  enough to annoy. (Note the count — it tells us how far right the overlay bias should go.)

### 3. Task checkbox — can you tick reliably?  *(issue #439)*
- **What:** `.md-task-check` is 24px on touch, no hit overlay (at the WCAG floor).
- **Test:** make a 5-item checklist and tick each with your thumb, first try. Also try
  ticking the item directly above/below the one you mean.
- **Pass:** clean ticks, no wrong-row hits. **Fail:** you tick the neighbor or miss.

### 4. Edit-bar glyphs — are they readable?
- **What:** the touch edit bar shows `@` · `⇤` · `⇥` · `↑` · `↓` · Done. The indent/
  outdent are bare tab-arrow glyphs.
- **Test:** open a point for editing on the phone. Without already knowing, can you tell
  which of `⇤` `⇥` is indent vs outdent? Do `↑` `↓` read as "move this point"?
- **Pass:** obvious. **🤔:** you have to guess or tap to find out. (If unclear, the fix
  is labels or clearer glyphs — worth a follow-up issue if it fails.)

### 5. Swipe-to-indent vs the OS back gesture
- **What:** swiping a point right indents it (commit threshold ~56px). On iOS/Android,
  an edge-swipe is the system back/navigation gesture.
- **Test:** near the LEFT screen edge, swipe a point right to indent. Does it indent, or
  does the OS grab the swipe (back/history, or the browser's page-back)?
- **Pass:** indent wins. **Fail:** the OS eats the gesture near the edge (then the fix is
  a dead-zone or a larger start-offset before the swipe arms).

### 6. Missing to-do button in the edit bar  *(issue #437)*
- **What:** the edit bar has no checkbox/to-do button; making a line tickable needs `/`
  or a long-press.
- **Test:** as a first-timer, type a grocery item, then try to make it a tickable to-do
  using ONLY the on-screen edit bar (no keyboard syntax). Can you?
- **Pass:** you find a door. **Fail:** you can't without typing `- [ ]` or discovering
  the long-press. (This one is a design-decision issue, not a pure feel-check.)

### 7. Docked strips — the no-touch-close feel *(deferred, see MOBILE-1)*
- **What:** the agenda/capture strips have no ✕ and no outside-tap dismiss on touch
  (a recorded design decision — the outline must stay live underneath capture). The only
  close is re-tapping the exact toolbar icon.
- **Test:** open the agenda strip, then try to close it without knowing you must re-tap
  the calendar icon. How long until you find the exit?
- **Note:** this is blocked by a recorded decision (design-language §4). The check is
  just to gauge how badly the no-close hurts a real first-timer, to inform whether the
  decision should be revisited.

---

## Tracked issues from this pass

The **fixable** items above are filed so they don't get lost:

- **#437** — no to-do button in the touch edit-bar (major, design decision)
- **#438** — pill body has no touch hit-enlargement (minor)
- **#439** — `.md-task-check` at 24px with no hit overlay (minor)

Items 4, 5, 7 above have **no issue yet on purpose** — they're "verify on a device first,
then file if it actually fails." Don't file speculative issues for feel-checks that pass.

## What already shipped (don't re-test as broken)

- First-run tap targets (banner buttons → 36px): **PR #435**
- The "N done hidden" count badge on the Done button: **PR #436**
- Duplicate-inbox guard: **PR #435**
