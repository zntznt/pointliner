# User research: driven persona panel #9 (2026-11-27)

**Status: RECORD (not a commitment).** An independent product read: one cold first run, then six new
personas from working lives no earlier panel covered: a mobile dog groomer, a wedding DJ, a
high-school debate coach, a DIY bathroom remodeler, a volunteer fire-service training officer and a
piano teacher. The panel leaned on the newest surfaces where a persona would naturally reach for them:
**+ Table view** (header sort, the column picker, adding, reordering and renaming rows) and **h:mm
durations**. Every session drove the real app in headless Chromium with real keystrokes. Every wall
was re-driven on a fresh page on `main` (6f04f8c) before it was called real, then checked against the
earlier research docs and open and closed issues. Filed as #1704 to #1709, plus a comment on #1672.

Earlier panels were read only after the sessions, for deduplication, so they did not set the
questions. Deliberate exclusions stay excluded: teams and sharing, phone-first use, EMR-style records,
vault replacement, and (from `duration-proposal.md` section 4) `m:ss` running times.

## Method

- **Served locally**, one port per persona (`python3 -m http.server 9100` to `9106`), 1366x820
  viewport, a fresh browser profile each, so every persona met the Welcome chooser first.
- **Real typing only.** Text went in through `page.keyboard.type`, so the brace recognizers, `/prop:`,
  the `@` and `/` pickers and the commit path all ran. `page.evaluate` only READ state (the tree, the
  props, the live region, `document.activeElement`).
- **About twenty actions per persona**, each step printing the rendered rows and where focus sat.
- **Re-drive rule.** A session finding was a candidate. It became a wall only after a fresh-page
  reproduction with the smallest input, a look at the source for the root cause, and a dedupe pass.
  Two candidates did not survive (see Refuted).

## The cold first run (written before any persona)

**What it is.** An outliner where any bullet can also be a calculator, a dice roller, a random picker
or a live total. The Welcome chooser says it in four words, "Notes that compute," and the guided
example delivers on it within a minute: change one cost chip and the total, the remaining budget and a
pass/fail check all move together. That loop is genuinely good and genuinely unusual.

**Who it is for.** People whose notes are half numbers: anyone costing a job, timing a plan, tallying
a list or rolling on their own material. The sixteen starters (freelance costing, household budget,
meal planner, campaign oracle, reading log) show the real audience is wider than the solo-RPG origin.

**Against the obvious alternatives.**

- *Workflowy / Dynalist:* same keyboard outline, and Pointliner adds what they never had: totals,
  checks, estimates, picks. It loses on calm: thirteen toolbar icons and a search box whose popover is
  a full syntax reference.
- *Logseq / Obsidian:* those are archives with graphs; Pointliner says plainly it is not one. It wins
  on "the page answers back" and on being one offline file; it loses on plugins and on the habit of
  living in a vault.
- *Notion:* the new table view is the closest thing to a Notion database here, and it is honest (each
  row IS the point, no copy). It loses on polish in the grid itself (see the walls).
- *A spreadsheet:* this is the real rival for every persona below. Pointliner wins wherever the
  numbers sit beside prose and structure; a spreadsheet still wins on grid keyboard movement and on
  sorting anything that looks like a time.

**First-run frictions** (noted, not all walls): clicking a property value chip opens the Properties
dialog with the caret in the KEY field; Enter in that dialog adds a row instead of saving; `1450 / 3`
shows `483.33333`; an inline `{= 1:30 + 0:45}` is refused with the reason only in a hover title. The
first real wall came within ten minutes: + Table view on the tour's own plan point printed
`Points in The plan. Spent 470, #ERR left.` (#1708).

## Personas

### 1. Marisol, mobile dog groomer: "the week's appointments, hours and takings"

Built a week from a blank page: `Biscuit (doodle, full groom) /prop:dur=1:30`, then `/prop:price=85`,
four appointments. The heading offered **+ Total dur**, **+ Total price**, **+ Check**, **+ Variance**
unprompted; Total dur read `4:30`. `per hour {= sum(price) / sum(dur)}` gave a correct 65.555556.
Table view: price sort correct; **dur sort `0:45, 1:30, 1:15, 1:00`** (#1706). Tab past the last cell
added Luna and her values. Alt+Up reordered. A rename in the Name cell reached the point but not the
outline row (#1704). ArrowUp in a cell dropped focus to the page (#1704). Check `sum(dur) <= 6:00` was
refused with a clear reason; `6` worked. Scheduled via `@`, then found Calendar dimmed with a tooltip
naming a Column menu that does not exist; reached the strip's Show as columns by trial (#1707). Typed
dates into a due cell: `tomorrow` and `today+3` worked, `wednesday` was refused with a visible toast.

**Verdict: alongside.** "It does the sums my booking app won't, and the table is the first time a notes
app felt like my clipboard. I'd still book in Square."

### 2. Ravi, wedding DJ: "a timed set list"

Song lengths went in as he thinks of them, `3:02`, `4:23`. Set totals happened to read right because
both readings are base 60; the average song then read `3:52:52`, and `{= starts + sum(len)}` read
`32.033333`. That is the deliberate `m:ss` exclusion plus the by-design decimal display of arithmetic
(the pill has a "Show as hours and minutes" box), so neither is filed. BPM sort was correct; length
sort was wrong (#1706). Reorder while sorted gave a clear toast. The wedding total `{= sum(len)}` read
"nothing matched", and the hint told him to store values on points that already held subtotals; the
fix, `sum(len, subtree)`, was in the guide, not the hint (#1709). Markdown export left a blank line
where the table view sat (#1708). `{shuffle: ...}` for the encore worked first time.

**Verdict: not-for-me (for set timing), alongside for requests.** "My songs are minutes and seconds.
It adds them right by accident, then tells me the average song is three hours fifty-two."

### 3. Teo, high-school debate coach: "squad, pairings, judges"

Started from the Project planner template (it landed below the blank document's empty first point).
Deleting the template heading with Ctrl+Shift+Backspace removed all 30 points, announced it, and
Ctrl+Z restored it: good. Squad with `spk` and `wins`, table view, column picker unticked `grade`,
Shift+F10 on a cell opened the row menu and **At the end of the list** added Eli with focus in the new
Name cell. Enter on a focused header cycled the sort and kept focus, but no key path reached the
header from a cell (#1704). Pairings `{Ben | Chloe | Dev | Eli}`, sides `{Aff | Neg}`, a judge deck:
all worked.

**Verdict: alongside.** "Pairings and the roster table on one page beat my three spreadsheet tabs, but
Tabroom still runs the tournament."

### 4. Priya, DIY bathroom remodel: "quote against actual, and my own hours"

`{budget := 4000}`, materials with `quote` and `actual`, **+ Variance** wrote every row's over/under
and the total (53) without her writing a formula. Labor in h:mm (`3:15`, `2:40`, `6:20`) totalled
`12:15`, and `{= sum(hrs) * rate}` priced it at 306.25. `spent {= sum(actual, subtree)}` and
`left {= budget - ...}` were right. A formula column `Over: = actual - quote` sorted correctly. A
Name-cell rename committed with Tab left the outline stale again (#1704).

**Verdict: adopt.** "Quote against actual with the over-and-under written for me, and my hours priced
at my own rate. This is the remodel binder I kept failing to make in a spreadsheet."

### 5. Joel, volunteer fire-service training officer: "who is short of 36 hours"

`{required := 36}`, five members with `hours` in h:mm. Sort happened to be right (distinct whole
hours). `Short: = required - hours` read `26.25 ... -5.3333333`, with no way to round it or show h:mm
on a column (#1707). Child drills rolled up per row through `Logged: = sum(drill)` as `4:15`, nicely.
Search `hours:<36` found nobody; `has:hours` found all five; `quote:>300` in Priya's document worked
(#1706).

**Verdict: alongside.** "The roster table and per-member totals are what I need for the chief, but I
can't search who's under 36 hours and the shortfall comes out as 5.3333333."

### 6. Aiko, piano teacher: "lesson lengths, fees, warm-ups"

`{per_hour := 64}`, lessons `0:45`, `0:30`, `1:00`, `0:45`; a `Fee: = lesson * per_hour * 4` column
was right. Lesson sort left the order unchanged, because every value read as 0 (#1706, the smallest
repro). Alt+Down kept focus on the moved cell. Weekly `3:00`, monthly 768. A warm-up picker and a
`{shuffle:}` sight-reading deck worked. Enter at the end of an expanded parent made a sibling after the
whole subtree rather than a first child (an observation, not filed: it needs an owner call, and other
outliners differ).

**Verdict: adopt.** "Fees fall out of the lesson lengths and the warm-up picker is the bit my students
will notice. I just have to remember the sort is wrong on lesson length."

## Confirmed walls (re-driven on main)

| Issue | Root cause | Personas | Smallest repro |
|---|---|---|---|
| #1704 | Table view cell commit: arrows/Shift+Tab drop focus to `<body>` (a typed `/base` moves between cells); a Name or due edit leaves the outline row stale | Marisol, Teo, Priya | Table view, click a cell, ArrowUp: `<body>`. Rename `a` to `alpha` in the Name cell: outline still `a` |
| #1705 | Confirm paths drop focus (Escape was fixed by #1464; confirm was not) | Marisol, cold run | `/due`, date, Enter: `<body>`. Same for Check, Properties Save, query editor, File New, Export |
| #1706 | h:mm property values: table view sort uses `cellNum` (`parseFloat`), search `key:>N` uses `Number()` | Marisol, Ravi, Joel, Aiko | Sort `1:30, 0:45, 1:15, 1:00`: gives `0:45, 1:30, 1:15, 1:00`. `dur:>1` finds nothing |
| #1707 | Query-base columns have no Column menu: the Board/Calendar tooltip points to it; formula columns cannot be formatted | Marisol, Joel | Hover dimmed Calendar. `Short: = required - hours` shows `-5.3333333` |
| #1708 | Table view as text: caption evaluates the title out of scope (`#ERR`); Markdown export writes a blank line | cold run, Ravi | `Trip {= budget - sum(cost)} left` with `budget` prop: caption `Points in Trip #ERR left` |
| #1709 | Rollup hint misdirects when middle points carry subtotals, dropping the `subtree` advice | Ravi | `Top {= sum(k)}` > `Mid {= sum(k)}` > `leaf k=5`: hint says "store the value" |

Comment on #1672: the table view now reaches the same `cellNum` reading with property values, a more
visible door than typed base cells.

## Refuted or not filed

- **Invalid date in a due cell is silent.** Refuted: `friday` and `Dec 5` raise a visible toast
  ("Not a valid date ... Use YYYY-MM-DD, today, tomorrow or today+N") and open a date picker. The first
  check read the wrong live region.
- **h:mm lost through arithmetic** (`{= starts}` reads 20.25). By design (#1666): only a bare rollup
  inherits h:mm; the pill's format has "Show as hours and minutes". The column case is real and is in
  #1707, because a column has no such box.
- **`m:ss` song lengths** (Ravi). Deliberate exclusion, `duration-proposal.md` section 4.
- **End key landed inside a pill** in an unfolded point. Standard browser End (end of visual line on a
  wrapped line); Ctrl+End worked. Not a product bug.
- **Clicking the middle of an unfolded point hit a pill** and opened its editor. Driver error.
- **Enter at the end of an expanded parent** makes a sibling after the subtree. Observation only.
- **Template lands below an empty first point** in a fresh blank document. Cosmetic, not filed.

## What worked (keep it)

The guided example; `/prop:key=value` with its confirming toast; the + Total, + Check and + Variance
doors (Priya never wrote a formula for her variance); `sum(x, subtree)`; `:=` variables flowing into
everything; Tab past the last cell to add a row; Alt+Up/Down reorder with the "sorted, clear it first"
toast; the strip's Show as columns ticks; Calendar lighting up the moment a due column exists; the
delete-30-points toast with working undo; `{a | b}` and `{shuffle:}` working first time for everyone.

## Overall verdict

Pointliner is in a strong, specific place: for anyone whose notes are half numbers, the loop of
"type a point, it totals, checks and picks for you" works first time and beats both a plain outliner
and a spreadsheet tab, and the two newest surfaces mostly land (two adopts, three alongside, one
deliberate not-for-me). The table view is the feature most personas reached for unprompted, and it is
also where every new wall lives: it does not yet move like a grid by keyboard, it does not refresh the
outline it mirrors, its columns have no menu, and it cannot sort the h:mm values that #1666 taught the
rest of the app to read. None of these is a design gap; each is a sibling the existing machinery
already covers somewhere else (a typed `/base`, the pill format dialog, `parseDuration`, the Escape
path of #1464). Closing #1704 to #1709 would turn the table view from "promising" into the reason to
switch.
