# User research: five personas, second fleet (2026-07-29)

**Status: RECORD (not a commitment).** A second fleet, chosen to cover audiences the
[first six](user-research-2026-07.md) did not represent at all. Each session was driven in headless
Chromium against the running app with real keypresses, taps and clicks; nothing here is read off the
source. The wish list is **candidate material, not promises** — same standing as
`enhancement-research.md`.

The first fleet spanned the origin user, the two compute-heavy audiences, a prose writer, the
hardest PKM skeptic and a non-technical bounce-risk. It never covered **how the app is operated**
(keyboard-only, touch) or three whole use-classes (live at a table, teaching, lab work). This fleet
is those five.

## Verdicts

| Persona | Who | Verdict |
|---|---|---|
| **Marcus** | GM running a table game **live**, four players waiting; today index cards + a dice app | **Yes, at the table.** The strongest session in either fleet |
| **Rosa** | keyboard-only (RSI, no mouse at all); today Emacs org-mode | **Yes**, and she can reach everything, but the toolbar costs her 12+ tabs before the document |
| **Lin** | postdoc keeping a lab notebook; today a paper notebook + Excel | **Alongside**, for reasoning and rough numbers; not for recorded results |
| **Adeyemi** | secondary teacher building revision material; today Word + a worksheet generator | **Maybe.** Hit a wrong number on her first real formula |
| **Tobi** | phone-first note-taker on the bus; today Google Keep | **No, not on a phone.** Typing works; the app around it is desktop-shaped |

## What they liked

**Marcus is the headline.** The two things he needed mid-scene were both one gesture, and both felt
physical:

- A threat clock typed as `[o 2/6]` renders `◔ 2/6` and **advances on click, glyph and all**:
  `◔ 2/6` → `◑ 3/6` → `◕ 4/6`. He did not need to open anything. The filled arc changing is the
  whole feedback loop.
- `{roll: #npc}` drew from the cast he had already written. Five clicks gave *Sela, Oddvar, Sela,
  Bram, Mira* — all four of his NPCs reachable, with a repeat, which is correct for a dice bag
  rather than a shuffle. This confirms from the live-play side what the first fleet found from the
  prep side (Maya's *"random tables that are just the stuff I already keep"*).

No page errors in any session, in any of the five. Nobody reported anything ugly or jarring.

**Rosa got further than expected.** Every toolbar control she tabbed through had a real accessible
name, and some are genuinely well written — the agenda button reads *"Agenda: every dated point and
deadline, in one list"*, which tells her what it does rather than what it is. `?` opened the guide;
`Ctrl+K` opened All commands. She built a three-item list, made a to-do, typed `{2d6}` and got
`2d6 6 4 = 10`. Then, with no mouse at all: `Shift+F10` → arrow keys → Enter re-rolled it to
`2d6 6 2 = 8`. **The keyboard path is complete**, including for a pill that is deliberately not in
the tab order.

**Lin's first check passed, which is the one that mattered to her.** `{= convert(10, km, kg)}` — a
nonsense conversion between a length and a mass — renders `#ERR (convert)` rather than a number or
raw source. She was explicitly looking for the tool to refuse. (The first fleet's Jordan hit this
same expression rendering as raw `{…}`; that is fixed.) `{= convert(12.4, mg, g)}` = `0.01240`, and
`{2.1 to 2.9}` gave `≈2.48 (2.11 – 2.9)` with a sparkline she liked for repeat measurements.

**Adeyemi's glossary just worked.** Typing a term, then meanings on `: ` lines, produced a real
`<dl>`:

```html
<dl class="md-dl"><dt>Photosynthesis</dt><dd>converts light to chemical energy</dd>
<dd>happens in the chloroplast</dd></dl>
```

Including a second meaning that itself contains a colon. She got a printable glossary with no
formatting work.

## What they did not like

### 1. `min()` and `max()` over nothing print `∞` and `-∞`, silently

**The new finding, and it lands in the theme the first fleet called the biggest trust-killer.**
Adeyemi put `{= max(score)}` on a point and got **`Top mark -∞`**. Measured across the whole
reducer family, with a working control (properties created via `/prop:score=72`):

| reducer | real children | nothing matches |
|---|---|---|
| `sum` | `130` | `0` + *"No score below this point. Move the pill onto the parent, or check the property name."* |
| `avg` | `65` | `0` + the same cue |
| `count` | `2` | `0`, no cue — **correct**, a count of nothing is 0 |
| `min` | `58` | **`∞`**, no cue |
| `max` | `72` | **`-∞`**, no cue |

`sum` and `avg` are well covered — that cue is excellent, and names both likely causes. `min`/`max`
return the identity element of the comparison, which is defensible arithmetic and useless output. A
teacher reading "Top mark -∞" has no way to know she put the pill on a sibling instead of the parent.
The `firstEmptyRollup` work clearly established the right behaviour; these two arms were missed.

### 2. The app has no phone layout

Tobi could type — tapping a point focuses it, the on-screen keyboard works, and a plain outline fits
393px exactly with no horizontal scroll. Everything around the typing is desktop-shaped:

- **The shipped welcome tour is 606 CSS px wide on a 393px phone**, so his very first screen scrolls
  sideways. The overflow is the tour's own pill content (estimate sparklines at 92px, inline icons),
  not the chrome.
- **Add one pill to his own document and the toolbar overflows** (445px): the toolbar is a single
  non-wrapping row that grows as the document gains features, so whether a phone user overflows
  depends on what they have written.
- **39 of 40 visible controls sit under the app's own 44px touch floor.** The row's "Point actions"
  bullet is **22x30**; a variables-panel close button is **19x14**. Confirmed identical across three
  device configurations, all of which do take the app's touch path
  (`matchMedia('(hover:none) and (pointer:coarse)')` is true in each).

The first fleet already named mobile as the platform ceiling and Alex's #1 ask. This is the measured
version of it: the gap is not sync, it is that the layout and hit targets never had a phone pass.

### 3. Rosa reaches the document last

Twelve Tab presses from a cold load still had her in the toolbar (File, search, the four depth
buttons, All commands, capture, journal, random results, agenda…). She never reached the outline by
tabbing within a reasonable number of stops; the session had to focus it programmatically to
continue. For a keyboard-only user the toolbar is a preamble she pays for on every fresh load, and
the document — the thing she came for — is behind all of it. Nothing is broken; it is a cost.

### 4. Precision is not adjustable, which stops Lin recording results

`{= 1/3}` prints `0.33333333` (8 decimals) and `convert(12.4, mg, g)` prints `0.01240` — a trailing
zero implying four significant figures from three-figure input. For reasoning this is fine and she
said so. For anything she would paste into a paper it is not, and there is no significant-figures
control. This is why her verdict is "alongside" rather than "yes": the app is where she would think
about the numbers, not where she would keep them.

## What they would miss

- **Marcus:** the clock and rolling on his own cast, unreservedly. "The clock is the thing I would
  rebuild badly in anything else."
- **Rosa:** `Shift+F10` reaching pill actions. It is the mechanism that makes a mouse-shaped feature
  keyboard-complete, and she has not seen it elsewhere.
- **Adeyemi:** definition lists from plain typing, and the `sum`/`avg` empty-rollup cue once she
  understood what it was telling her.
- **Lin:** the honest `#ERR` on a cross-dimension conversion, and ranges that carry their spread.
- **Tobi:** nothing yet — he never got far enough on a phone to form an attachment.

## Most-wanted (candidate direction, not commitments)

**Close to the grain:**
- ~~**Make `min`/`max` behave like `sum`/`avg` when the rollup is empty.**~~ **SHIPPED** (#1171 /
  UXP-274). Widened for the DISPLAY cue only: `firstEmptyRollup` also gates the check's pass/fail,
  and min/max over an empty scope staying *vacuously true* there is the recorded intent, so the core
  takes an opt-in `{ extrema: true }` that only the math pill passes. `{= max(score)}` on the wrong
  point now reads `max(score)=-∞ nothing matched` with *"No score below this point. Move the pill
  onto the parent, or check the property name."*
- ~~**A significant-figures control on math pills**~~ **SHIPPED** (#1175 / UXP-275). It was indeed
  reachable inside the existing model: a 4th positional param on `parseNumFmt`, honoured in the three
  display sinks only, offered by all three fmt dialogs, and mutually exclusive with Decimal places.
  `{= 1/3}` at 3 s.f. reads `0.333`; `{= convert(12.4, mg, g)}` reads `0.0124`. The convert default
  was deliberately left alone (see UXP-275).
- **Let the toolbar wrap, or collapse into an overflow menu, below some width** (Tobi). The single
  non-wrapping row is what makes narrow layouts overflow as soon as a document gains features.
- **A skip-to-document affordance for keyboard users** (Rosa) — a first tab stop that jumps past the
  toolbar into the outline.

**Frontier (weigh against `product-identity.md` first):**
- **A phone pass**: a narrow-width layout for the tour and the chrome, and touch targets that meet
  the app's own 44px floor. Note this is layout work, not the sync/storage question the first fleet
  raised; they are separable, and this half is entirely within the app.
- **Self-testing / hide-the-answer as a first-class thing** (Adeyemi). The spoiler already does the
  mechanism (`>! Lima` blurs and reveals) but it is framed for spoilers, not revision. She would
  want to hide every answer in a subtree at once and reveal them one at a time.

## Method notes, including two of my own errors

Recorded so the next reader can trust or discount the numbers:

- **Properties are created by `/prop:key=value`, not by typing `key: value`** — and the sidecar
  field is `{key, val}`, **not** `{key, value}`, which was the actual root cause of my broken
  controls (`childPropNumber` reads `p.val`, so a `value` key reads as blank). Several early
  probes built documents whose rollups matched nothing, which made *every* reducer look broken. The
  `min`/`max` finding above is only reported because the control was eventually established
  (`sum` → `130`, chips `score:72`, `score:58`). Before that it was indistinguishable from my own
  setup error, and I nearly filed it as one.
- **`document.body.innerText` does not include pill contents.** An early run reported "Who shows
  up? " with nothing after it and no rolls at all; the pill was there the whole time. Pills must be
  read as elements.
- Clock syntax is `[o 2/6]`, not `[2/6]` — an early "no clock found" was my error, not a defect.
- I initially suspected Playwright's `hasTouch` did not set `(hover:none) and (pointer:coarse)`,
  which would have invalidated the touch numbers. Checked: it does, in all three configurations
  tested. The numbers stand.
- The `innerWidth` differences between device configurations (393 / 589 / 606) are emulation
  artifacts of `isMobile` and `deviceScaleFactor`, **not** app behaviour — every wide element has
  `min-width: 0` and simply fills whatever it is given. The finding that survives is the 606px
  content floor, which reproduces as sideways scroll whenever the layout viewport is genuinely 393.
