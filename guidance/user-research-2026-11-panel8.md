# User research: driven persona panel #8 (2026-11-26)

**Status: RECORD (not a commitment).** Six new personas, chosen from working lives no earlier panel
covered: a sideline beekeeper, a bicycle repair shop, a community-theatre stage manager, a land
surveyor, a pub-quiz host and an owner-operator truck driver. Every session drove the real app in
headless Chromium with real keystrokes. Every wall below was then re-driven on its own fresh page on
`main` (d622e0f) before it was called real, and checked against open and closed issues. The wish list
is candidate material, not promises.

Earlier panels (2026-07, 07-b, 07-c, fleet2, fleet3 and the 2026-08 driven panels #4 to #7) are not
repeated here. Walls they settled were not re-filed: min/max over nothing (#1171), default decimals
(#1333), doors on plain bullets (#1330), sibling-scope query reducers (#1331), self-contained formula
properties (#1317). Deliberate exclusions stay excluded: teams and sharing, phone-first use, EMR-style
records, vault replacement.

## Method

- **Served locally**, one port per persona (`python3 -m http.server 9101` to `9106`), 1440x900 viewport,
  a fresh browser context each, so the first thing every persona saw was the Welcome chooser. All six
  picked **Start with a blank document**: none of the starters named their work.
- **Real typing only.** Text went in through `page.keyboard.type`, so the brace recognizers, the `/`
  builder and the commit path all ran. `page.evaluate` was used to READ state (the tree, the props, the
  live region), never to write it, except to reset a blank document between re-drives.
- **Coaching was recorded as it fired.** `flashHint`, `announce` and `hintDwell` were wrapped so every
  hint and live-region message was logged at the moment it was emitted, not polled afterwards (the
  fleet3 method error).
- **About twenty actions per persona**, grouped into 10 to 18 steps, each step printing the rendered rows
  and whatever the app said.
- **Re-drive rule.** A finding in a session was a candidate. It became a wall only after a fresh-page
  reproduction with the smallest possible input, and a look at the source to name the root cause.

## Verdicts

| Persona | Who | Verdict |
|---|---|---|
| **Amara** | sideline beekeeper, 14 hives, sells honey at two markets; today a spiral notebook in the truck | **Adopt**, for the yard book |
| **Pete** | land surveyor at a three-person firm; today field book + a closure spreadsheet | **Adopt**, for traverse closure checks |
| **Hana** | stage manager, community theatre; today a prompt book + a stopwatch app | **Alongside**, for running order and props |
| **Luis** | owns a bicycle repair shop; today paper tickets + a till | **Alongside**, until a ticket prints |
| **Grace** | weekly pub-quiz host; today a Word file of questions + a scoring sheet | **Alongside**, for the question bank only |
| **Dale** | owner-operator truck driver, laptop in the sleeper cab; today a logbook app + receipts in a folder | **Not for me** |

**The pattern:** the two whose numbers are plain decimals (honey kilograms, survey feet) adopted. The
four whose numbers are *products of other numbers* (gallons times price), *clock times* (1:15 of stage
time, 8:45 of driving) or *dates* (paid net 30 from delivery) hit the engine's edges inside the first ten
minutes. Nobody bounced on the outliner; three bounced on what a number is allowed to look like.

## The personas

### Amara, beekeeper: adopt

Built `# Apiary 2026` with a row per hive (`{prop mites: 2} {prop honey: 18}`), totaled honey, converted
it to pounds for a US buyer, flagged the worst mite count, set a `/check:mites <= 3` on a struggling hive,
a `/due:` for re-inspection, a `{count: #queenless}`, and jars-to-sell arithmetic.

- **Worked:** `convert(sum(honey), kg, lb)` (113.5 lb), `max(mites)`, the `/check:` flag and
  `is:failing` finding it, `/due:2026-12-05` ("Set due to Dec 5."), the + Add form, reload persistence.
- **Wall (her first five minutes):** she typed the heading and then the hives *under* it, as in any notes
  app, so they were siblings. `{= sum(honey)}` on the heading said "0 nothing matched", whose tooltip
  advises "Move the pill onto the parent". She worked out Tab herself. The doors at the bottom of the
  page offered `+ Total`; clicking it wrote the total into the invisible document root (#1658).
- **Wall:** the + Add dialog was titled `Add to “Apiary 2026 [[math:x9npe6tm]] kg”` (#1658).
- > "Once the hives sat under the heading, the honey total and the mite flag just worked. I would keep the
  > yard book here, and I nearly did not get past the zero."

### Pete, land surveyor: adopt

Entered four traverse legs with feet, latitude and departure, then perimeter, a metric conversion,
misclosure, the linear error with `hypot`, a precision ratio, a `/check:` that the ratio beats 1:5000,
an angle-sum check against `(n-2)*180`, DMS arithmetic and a bearing with `cos(rad(...))`.

- **Worked, and impressed him:** a field typo (`1O1.72`, letter O) made the departure total show
  "1 not counted" and turned the precision check "unresolvable" at once. Deleting the leg restored it.
  The ratio read `1:12,163` with `round()`.
- **Wall (minor):** no area units (`convert(43560, ft2, acre)` is `#ERR (unknown unit)`); File, Custom
  units with `sqft` / `acre = 43560 sqft` fixed it (`1.201` acres), but the error does not point there
  (#1656).
- > "It caught my letter-O typo before I did. That is the whole job of a closure sheet."

### Hana, stage manager: alongside

Running order as `## Act 1` / `## Act 2` with scene minutes, totals by + Total, runtime with the interval,
cues tagged `#cue` and counted, a `{query: #missing}` props list, an opening-night countdown, and
rehearsals via the point menu's Repeating dates.

- **Worked:** + Total on Act 1, `{query: #missing}`, `{count: #cue}`,
  `daysuntil(date(2027, 1, 22))`, the Repeating dates dialog.
- **Wall:** time is not minutes-as-decimals in her world. `convert(45, min, hr)` reads `0.7500 hr`, a
  curtain-down time reads `21.216667`, and `{prop t: 1:15}` is not a number to anything (#1656). The
  `floor(m/60)` / `m % 60` workaround renders `0 : 45`, with spaces.
- > "Running time is minutes and clock times. It tells me 0.75 hours and 21.216667. I would keep the props
  > list here and the timings on the stopwatch."

### Luis, bike shop: alongside

A repair ticket under `## Ticket 1042`, parts lines and labour lines, a shop rate and tax as variables,
labour, tax and a total due on the heading, money formatting, Explain this number, and a second ticket.

- **Worked:** + Total parts / + Total hours (once every row carried both), variables for rate and tax,
  the number-format dialog offering decimal places and a `$` prefix, Explain this number listing each part.
- **Wall:** his real ticket is sparse: parts lines have no hours, labour lines no parts. That shape earns
  no doors at all, not even + Add (#1658). He had to add `parts: 0` to labour lines to get a total.
- **Wall:** a rate declared *below* the ticket made the total `#ERR (declared later)`, while the pill's
  own edit dialog previewed `= 130` and the Markdown export wrote `130` (#1657).
- **Wall:** Ctrl+P prints the toolbar, the search box and "Saving..." (#1661).
- > "It does the ticket math better than my till. But a customer gets paper, and the total ran off when I
  > mixed parts and labour."

### Grace, pub-quiz host: alongside

A question bank tagged `#geo`, `#history`, `#art`, answers as `>!` spoilers, a random pick per topic, a
round of several questions, team scores over two rounds, a leader, and a tiebreak.

- **Worked, and delighted her:** `{roll: #geo}` drawing live from her own bank, re-rolled with a click; in 12
  re-rolls it never picked the spoiler child. `abs()` for the tiebreak. + Total r1 on the scores.
- **Wall:** she needs ten questions without repeats. `{roll 3: #history}` stays literal with no cue at
  all; `{shuffle 3: #history}` deals the literal word `#history`; three `{roll:}` pills repeat (#1659).
- **Wall:** team totals. `{prop total: r1 + r2}` stays literal and `max(total)` reads `-∞ nothing matched`
  (#1656); `{tot := r1 + r2}` shows `?` beside a working `{= r1 + r2}` (#1657).
- > "One random question is a party trick. I need ten, no repeats, and a leaderboard that knows who won."

### Dale, truck driver: not for me

Fuel stops with gallons and price per gallon, cost per stop, trip fuel total, miles, MPG, hours of service
against the 11-hour and 70-hour rules, and a broker's net-30 payment date.

- **Worked:** `miles / sum(gal)` for MPG, `/check:drive <= 11` set on the 11.25-hour day, the 70-hour
  remainder, Explain this number naming the `8:45` row as "not a number".
- **Wall:** `{prop cost: gal * ppg}` is the first line he writes. It stays the words `gal * ppg`, and the
  fuel total says "No cost below this point" though every stop has one (#1656).
- **Wall:** his logbook says `8:45`, not `8.75` (#1656).
- **Wall:** `{= asdate(delivered + 30)}` and even `{= daysuntil(due)}` on a point with a due date stay
  plain text: "a name with no value here" (#1657).
- > "Gallons times price is the first thing I would write, and it just sits there as words. Then it tells
  > me I have no cost. I have three."

## Confirmed walls (filed)

Grouped by root cause, each with a fresh-page repro in the issue.

| Issue | Root cause | Personas |
|---|---|---|
| #1656 | Values the rollups cannot read: row-referencing property formulas, h:mm durations, area units; an all-unreadable column reports "No KEY below this point" | Dale, Grace, Hana, Pete |
| #1657 | The name scope is built differently per surface: date props never reach a math pill or check (the query base column already joins them), `:=` cannot see the point's props, a declared-later pill disagrees with its dialog and the exports | Dale, Grace, Luis |
| #1658 | Row and view doors: top-level + Total writes into the invisible root, + Add leaks `[[math:key]]`, sparse columns get no doors | Amara, Luis |
| #1659 | No way to deal several distinct points from a search; `{roll 3: #tag}` is silent, `{shuffle: #tag}` deals the literal tag | Grace |
| #1660 | The command builder re-announces the unchanged command's description on every keystroke of a `/check:` argument (15 times for 11 characters) | found while driving |
| #1661 | No print stylesheet: Ctrl+P prints the app chrome | Luis, Dale |

### Repro summaries

1. **#1656.** `## Fuel` / `Stop 1 {prop gal: 100} {prop ppg: 4} {prop cost: gal * ppg}` /
   `Stop 2 ...` / `{= sum(cost)}` on the heading: `0 nothing matched`, tooltip "No cost below this point".
   Control `{prop c2: 100 * 4}` shows `400`. `{prop t: 1:15}` is not a number; `{= 1:15 + 0:50}` stays
   plain text. `convert(43560, ft2, acre)` is `#ERR (unknown unit)`.
2. **#1657.** `Load B /due:2026-11-20` then `{= daysuntil(due)}` on it: stays plain text, "a name with
   no value here". `nodePropVars` skips date keys; `queryTableRows` has its own fix for the same case.
   `Labour {= 2 * rate}` above `{rate := 65}`: pill `#ERR (declared later)`, dialog preview `= 130`,
   Markdown and plain-text export `130`.
3. **#1658.** `# Apiary` with sibling hive rows: the view bar's `+ Total` toasts "Totalling honey" and
   writes ` [[math:...]]` into `root.text`; nothing appears. `## Hives {= sum(honey)} kg` + `+ Add`:
   title, toast and aria-label all carry `[[math:xi05zdeb]]`. Parts rows plus hours rows: no doors.
4. **#1659.** `{roll 3: #history}` literal and silent; `{shuffle 3: #history}` deals `#history`.
5. **#1660.** Type ` /check:hours <= 8`: 15 live-region writes of the Check description.
6. **#1661.** `emulateMedia({ media: 'print' })`: the toolbar, search box, "Saving..." and "New point"
   all print.

## Refuted and artifact findings

Recorded so the next panel does not re-find them, including five errors of my own.

1. **"No + Total doors on any heading" (my error).** The first sessions probed `button` elements; the
   doors are `span.addrow-affordance`. Every "doors: []" from those runs was the selector.
2. **`#ERR (bad ref)` totals on the bike ticket (my error).** `End` in a contenteditable goes to the end of
   the *visual* line; on a wrapped heading full of pills it dropped the new text inside an existing
   pill's source. Re-driven with `Control+End`, the totals were correct.
3. **"Rows never nest" (my error).** My depth printer read `node.parent`, which does not exist. The tree
   was nested correctly all along.
4. **`/due` left as literal text (my error).** I pressed Escape on the open builder; Enter applies it.
5. **The duplicated ticket pasted as an empty point, and Shift+F10 printed no menu (unverified).**
   Not re-driven to a clean repro, so not claimed. Copy and paste had six fixes in the last month
   (#1614 to #1621); a future panel should drive it on purpose.
6. **`5.320425` tax and `-∞` max.** Real, but already settled: #1333 (the round tip now fires on that
   pill) and #1171 (the "nothing matched" cue is present).
7. **A heading followed by sibling rows totals to zero.** Working as designed (a rollup reads children),
   and the pill does explain itself. The advice "Move the pill onto the parent" fits the case poorly,
   since there is no parent; the fix is to indent the rows. Noted, not filed. The *door* on that same
   layout is a real bug and is in #1658.
8. **A query list shows pills as glyphs** (`Bears = 🖩`, `var $`) rather than their values. Looks
   deliberate (a compact list), but Grace read the leaderboard as broken. An open question for the
   query-list owner, not filed.

## What would win each over (candidate direction, not commitments)

- **Dale and Grace:** #1656's row formula. One change (`{prop cost: gal * ppg}` evaluating against the
  row) turns both into adopters; it is the follow-up #1317 already named, and it adds no syntax.
- **Hana and Dale:** h:mm in and out (#1656). Every log of human time is written that way.
- **Luis:** a printable ticket (#1661) and sparse columns earning + Total (#1658).
- **Grace:** dealing N distinct points from a search (#1659), through the deck modes that already exist.
- **Amara and Pete:** nothing blocking. Amara asked for one small thing: say "indent these under the
  heading" when a heading's total reads zero over rows that sit right below it.
