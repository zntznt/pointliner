# h:mm durations: read as hours, shown as h:mm (#1666)

**Status:** Shipped with #1666. **Source:** panel #8 (`user-research-2026-11-panel8.md`): Hana (stage
manager) and Dale (truck driver). Split from #1656.

The problem in one line: every log of human time is written `1:15`, and Pointliner read `1:15` as
words. `{prop t: 1:15}` was "not a number" to every rollup, so `{= sum(t)}` over a running order read
`0 2 not counted`, and a total could only be shown back as `0.7500 hr` or `21.216667`.

## 1. Standards consulted

| Source | What it says about a duration | What we take |
|---|---|---|
| Spreadsheets: [Excel time formats](https://support.microsoft.com/en-us/office/display-numbers-as-dates-or-times-418bd3fe-0577-47c8-8caa-b4d30c528309), [Google Sheets number formats](https://support.google.com/docs/answer/56470), [LibreOffice format codes](https://help.libreoffice.org/latest/en-US/text/shared/01/05020300.html) | A duration is an **ordinary number** with a **display format**. Typing `1:15` is read as 1 hour 15 minutes (`h:mm`); `1:15:30` is `h:mm:ss`; a minutes-and-seconds reading needs `0:01:15`. The elapsed format `[h]:mm` lets the hours run past 24. The stored number is a fraction of a day, which is the spreadsheet's own base unit. | Number plus format, never a parallel type. `a:b` is `h:mm`, `a:b:c` is `h:mm:ss`. Hours may run past 24. |
| [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Times) times and durations | `hh:mm` and `hh:mm:ss`, minutes and seconds `00` to `59`, two digits. Durations are `PnYnMnDTnHnMnS` (`PT1H15M`), or the alternative format `PThh:mm:ss`. | Minutes and seconds are exactly two digits, `00` to `59`. `1:75` is not a duration. |
| [HTML valid time string](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-time-string) (`<input type="time">`) | `HH:MM` or `HH:MM:SS`, two-digit fields, `00` to `59`. It is a time of day, capped at 23. | The same field rule. Not the 23-hour cap: a duration is elapsed time. |
| [TC39 Temporal.Duration](https://tc39.es/proposal-temporal/docs/duration.html) | Separate fields (hours, minutes, seconds...), parsed from ISO strings. `Temporal.Duration.from('PT1H15M').total({ unit: 'hour' })` is `1.25`. Balancing (`round({ largestUnit })`) carries 60 minutes into an hour. | A duration totals to a single number in one unit; the hour is the natural unit of `h:mm`. Display balances: 125 minutes shows as `2:05`, not `1:65`. |
| [Intl.DurationFormat](https://tc39.es/proposal-intl-duration-format/) `style: 'digital'` | Formats a duration as `1:15:00`: hours unpadded, minutes and seconds padded to two digits. | Hours unpadded, `mm` and `ss` padded. |
| Plain-text logbooks: [FMCSA hours of service](https://www.fmcsa.dot.gov/regulations/hours-of-service) (11-hour driving limit, 70 hours in 8 days), timesheets, stage-manager running times | Limits are stated in hours; the log is written `8:45` and summed by hand into hours and minutes. A running time is `1:15` for an act and `2:05` for the show. | The number behind `8:45` must compare to `11` and `70` directly, so it is hours. |
| [Sexagesimal notation](https://en.wikipedia.org/wiki/Sexagesimal) (degrees-minutes-seconds, hours-minutes-seconds) | `a:b:c` means `a + b/60 + c/3600`, in the unit of the leading field. | The rule we implement, stated in one line. |

## 2. Existing machinery reused (nothing new is minted)

- **The scalar reader `propScalar`**, already the one place a property value becomes a number for
  `childPropNumber` (every rollup: `sum`, `avg`, `count`, `min`, `max`, the Explain breakdown) and
  `rowPropVars` (row formulas, #1656). It already reads plain numbers, thousands-grouped numbers and
  dates (as epoch days, #1657). A duration is one more fallback in the same chain.
- **`nodePropVars`**, the own-point scope behind a `{= }` pill and a `check`, so `drive <= 11`
  reads `drive: 11:15` as `11.25` and fails, as the 11-hour rule should.
- **`inferPropType`**, so a duration column is a number column and earns the + Total door.
- **`nudgeSumKey`**, the "put `{= sum(t)}` on the point above" tip, so it fires for a duration
  column exactly as for a number column.
- **The unit table and `convert()`**: hours are already a unit (`hr`), so `convert(t, hr, min)`
  turns `1:15` into `75` with no change.
- **The number-format record `{ decimals, sigfigs, prefix, suffix }`** (`parseNumFmt`,
  `formatNumDisplay`), the one record the math pill, the estimate pill and base columns already
  share. It gains one field, `time`, set by one checkbox in the same three dialogs. The record is
  stored inside the `_math`, `_est` and `_colfmt` JSON attributes, so it round-trips through OPML
  with no new attribute.
- **The rollup display**: a new pure `rollupFmt` gives a bare `sum`/`avg`/`min`/`max` over an
  all-h:mm column the h:mm format, as a spreadsheet's SUM over time cells inherits theirs. Every
  display of a rollup's value goes through it: the pill (`renderMathPill`), the export, Explain this
  number and a query base `= expr` column. A pill's own format always wins, and unticking the box
  stores `{ time: false }` so the opt-out sticks.
- **`mathErrorReason`**, so an `h:mm` typed inside a formula gets a sentence naming the remedy
  instead of the generic "could not be evaluated".

## 3. The three product calls

### Call 1: `1:15` is 1.25 (hours), not 75 (minutes)

`1:15` is 1 hour 15 minutes because every spreadsheet, ISO 8601 and every hours-of-service log reads
`h:mm` that way. The number behind it is **decimal hours** because:

1. The leading field names the unit (sexagesimal notation). `8:45` and `8.75` are the same quantity
   written two ways, so a log that mixes them (Dale types `8.75` today) sums correctly.
2. The limits people check against are in hours: `drive <= 11`, `70 - sum(drive)`.
3. Hours is already the unit `convert()` speaks (`hr`), so `convert(t, hr, min)` gives minutes.
4. The display format below turns the panel's own numbers into what they meant: `0.75` reads
   `0:45` and Hana's curtain-down `21.216667` reads `21:13`. With a minutes base neither would.

"Minutes is lossless" was the argument for 75. It does not hold up: `0:50` is `0.8333...` hours, but
the display rounds to the nearest second before formatting, so `1:15 + 0:50` shows `2:05`, never
`2:04:59`. A duration cannot be typed inside a formula (see call 3), so `t == 1:15` is never asked;
a comparison against plain hours (`drive <= 11`) is not affected by the rounding.

### Call 2: an `h:mm` format beside decimals, prefix and suffix

One checkbox, **Show as hours and minutes (h:mm)**, in the three dialogs that already share the
number format (math pill, estimate, base column). It stores `fmt.time = true`. When on, the number
is shown as `h:mm`, with `:ss` appended only when the rounded value has seconds (so a duration typed
as `0:01:30` shows back as `0:01:30`), as `Intl.DurationFormat`'s digital style and Excel's
`[h]:mm:ss` do. Hours are unpadded and may exceed 24, as in `[h]:mm`. A negative value keeps its
sign (`-1:30`). Prefix and suffix still apply (`2:05 run`); decimals and significant figures do not
apply to an `h:mm` display and are ignored while it is on.

A checkbox rather than a "time" option inside Decimal places, because the format is a different
*shape*, not a different precision, and the dialogs already use a checkbox for the other shape
switch ("Show value only").

### Call 3: `1:15` is accepted as a property VALUE, not inside a formula

`evalMath` collapses all whitespace before it tokenises, so `c ? 1 : 30` and `c?1:30` are the same
string. A `1:30` literal inside a formula would silently change the meaning of every existing
ternary whose branches are numbers. That is a P5 collision, and it is the same reason an ISO date is
not a formula literal (`2026-11-20` inside `{= }` is subtraction; `propExprValue` refuses to treat a
date as arithmetic). So durations enter the way dates do: as property values (`{prop t: 1:15}`),
read by the scalar reader every rollup and scope already uses.

Inside a formula a typed `1:15` stays plain text, as before, but now says why: "a time written like
1:15, which a formula cannot read. Put it on a point as a property, like {prop t: 1:15}, and total
it with {= sum(t)}, or write it in hours, like 1.25". The `key: value` property line is untouched: the
property parser already splits on the first colon, so `t: 1:15` was always stored as `1:15`.

## 4. Deliberately out of scope

- **Time-of-day arithmetic, wrap-around and time zones.** With `up: 19:30` and `run: 1:45` as
  properties, `{= up + run}` shown as h:mm reads `21:15`, because a time of day is a duration since
  midnight (the spreadsheet model). But `23:00` plus `2:00` reads `25:00`, not `1:00`, and there is
  no zone. A clock that wraps needs a modular display and a date to wrap into; no panel task asked
  for it.
- **`m:ss` running times.** `1:15` is never 1 minute 15 seconds, following every spreadsheet. A
  stopwatch time is written `0:01:15`.
- **ISO `PT1H15M` as a property value.** No panel user writes it and no CSV in the repo carries it.
  It is a small addition to `parseDuration` if an import ever brings it.
- **12-hour clock (`7:30pm`).** A time of day, not a duration.
- **Search compares (`t:>1:00`).** `key:>N` is its own search grammar with its own UXP-20 decision;
  extending it is a separate change.
- **Markdown/base table cells.** A table cell is cell text read by `cellNum` (Calculate and Sort),
  a different family from property values. Its `parseFloat` reads `1:15` as `1`, silently. Filed as
  #1672 rather than widened into this one.
- **The stat adjuster (`resolveStatTarget`)** writes the number back into the property. Writing
  `2.25` over a typed `2:15` would destroy the author's text, so a duration is deliberately not a
  stat. This is the measured negative case of the census.

## 5. Substrate test (#866)

General instrument, not one domain's shape: the change is one more way to write a number (a
sexagesimal numeral) and one more way to show one. Running times, driving hours, timesheets and
cooking times all use it, and nothing in the change names any of them.
