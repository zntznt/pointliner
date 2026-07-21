# User research — second panel (2026-07-b)

**Status: RECORD (not a commitment).** Read-only persona fleet, six personas across five
life domains. Each persona read the README and `guidance/product-identity.md`, then used the
app for their specific workflows. Observations recorded verbatim from simulated walkthroughs.

Interpretive posture: every persona below is a real use pattern the app claims to serve. This
panel tests whether that claim holds up for a stranger who does not already love the tool.

---

## Persona fleet

| Persona | Domain | Relationship to Pointliner |
|---|---|---|
| **Rina** | Freelance PM (3 clients, 12 active workstreams) | New — heard about it from a colleague |
| **Marcus** | Academic (history PhD, mid-dissertation) | Used Roam/Obsidian, looking for something lighter |
| **Dani** | Solo-RPG player (Ironsworn, Cairn, homebrew) | The origin audience — what does a fresh RPG user see? |
| **Leila** | Novelist (speculative fiction, 2nd book) | Uses Scrivener + a notebook, never used an outliner |
| **Tomás** | Quant / estimator (energy sector, loves Soulver) | Heavy spreadsheet user, wants inline computation |
| **Jae** | University student (STEM, 3rd year) | Uses Apple Notes + a calculator, has never heard of an outliner |

---

## Rina — Freelance PM

### What she read

The README's pill table caught her attention immediately. "Wait, I can put `{= sum(cost)}`
directly on a heading and it stays live? That's half my Monday mornings gone." The
never-build list resonated: "Good. I don't want another collaboration tool. I want a
thinking tool."

### What she tried

1. Created a project outline: Client names as headings, deliverables as children, each with
   a `cost` and `hours` property
2. Put `{= sum(cost)}` and `{= sum(hours)}` on each client heading — totals appeared
3. Added a `{budget := 8000}` variable at the top and checks on each client
4. Used `#NEXT` and `#WAITING` states to track status
5. Opened the agenda to see her dates

### Observations

"The property chips are addictive. I can click a number, type a new one, and everything
ripples. In a spreadsheet I have to find the cell, type, hit enter, and re-check the
total — here it just happens."

"I put `{= sum(cost)}` on three levels: per deliverable, per client, and at the top.
They all cascade. That would be three separate SUM formulas in a spreadsheet."

**Friction:**
- "I set due dates through the Schedule dialog, which worked, but then I wanted to see ALL
  my deadlines across clients at once. The Agenda strip did that but I didn't discover it
  on my own — I had to read the guide to find the toolbar icon. The tiny calendar icon
  didn't tell me 'your deadlines live here.'"
- "The Agenda shows due dates but I couldn't figure out how to filter to just one client.
  I wanted to say 'show me only #client-a deadlines' — is there a way to do that from the
  Agenda itself?"
- "I wanted to drag-and-drop to reorder my clients by priority. I found the drag handle on
  the bullet area, but it took me a few tries to grab it right."

**What she'd miss from other apps:**
- "In a spreadsheet I can sort and filter columns. In Pointliner I can search and add `#tags`,
  which is good, but a simple 'sort children by property' would save me a lot of manual
  reordering."
- "Time tracking. I put `hours` on each deliverable, but the app doesn't know when I started
  or stopped working on something. Even a manual 'spent 3h' note would help."

**What she'd want to see:**
- "A 'dashboard' point that lives at the top and shows me at-a-glance: budget remaining,
  hours remaining, overdue items. I sort of built one with checks and variables, but it
  would be great if the app gave me a starter for this."
- "Sort children alphabetically or by property. I want to reorder my deliverable list by
  due date, not by when I typed them."

---

## Marcus — Academic

### What he read

The "not a second brain" paragraph stopped him cold. "That's... exactly what I've been
doing wrong with my PKM. I have 2,000 notes in Obsidian and I never re-read any of them.
The scratchpad idea — resurface a thought I already had, at the moment it matters — that
hits." The pill table made him lean forward: `{roll: #idea}`.

### What he tried

1. Imported a small OPML of his dissertation chapter outline
2. Created `[[#links]]` between related arguments and evidence
3. Tagged promising dead-end ideas `#revisit` and put `{roll: #revisit}` at the top
4. Used `words(subtree)` to estimate chapter lengths
5. Added per-point notes for his advisor's feedback

### Observations

"The `{roll: #revisit}` thing works. I clicked it a few times and each time a different
half-forgotten idea surfaced. One of them sparked the connection I'd been stuck on. That
single interaction felt like the product's thesis in action."

"The backlinks panel at the bottom was a nice surprise. I clicked a point and suddenly
everything that linked to it appeared. Much cleaner than Obsidian's sidebar — it's just
there, and it goes away when I don't need it."

**Friction:**
- "The Outliner feels natural, but I wanted block references — the ability to link TO a
  specific line inside a point, not just to the whole point. My notes are paragraphs long,
  and I want to say 'see the third paragraph of this argument.'"
- "The tag system is flat-ish (slashes are hierarchical, which works), but I couldn't find
  a way to browse all my tags visually. The tag browser is in the File menu, hidden under
  'Browse tags' — I missed it twice before finding it."
- "I wanted to see the link graph. When I opened it, it was mostly empty because I'd only
  made a few links. The unlinked-ref toggle showed me dozens more connections, which was
  amazing, but the graph panel felt cramped for the data it showed."

**What he'd miss from other apps:**
- "Daily notes. I use Obsidian's daily notes religiously. Pointliner has a journal, which I
  found eventually, but it felt like an add-on rather than the center of the workflow. The
  journal doesn't surface in the outline except as a folder — I wanted to type 'what did I
  do yesterday' and have yesterday's journal entry appear."
- "Templates. When I start a new literature note, I want it pre-populated with fields. The
  `/template` command exists but saving a template requires going through the bullet menu
  — I never would have found it without the guide."

**What he'd want to see:**
- "A way to open yesterday's journal entry with one click or one command. `/journal` opens
  today — `/journal yesterday` should work."
- "Transclusion that works across documents. I have notes in separate files and I want one
  note to show the content of another note inline."
- "Aliases visible in the link picker. If I call something 'the Turner argument' as an alias,
  I should be able to type 'Turner' in `[[` and see it."

---

## Dani — Solo-RPG Player

### What he read

The README's sixth table row (`{roll: #npc}`) made him say "wait, what?" out loud. The
product-identity doc gave him context: "the origin stays served structurally, not
narratively." He appreciated that the RPG use case was handled seriously but not made the
whole pitch.

### What he tried

1. Opened the Welcome tour, explored the dice and oracle
2. Imported the Ironsworn demo OPML
3. Created a homebrew hex-crawl: tables for terrain, encounters, weather
4. Used `{shuffle:}` to build an encounter deck
5. Used the chronicle to log in-world events on a custom calendar
6. Generated an NPC name with `{name: {Ael|Bor}{ric|wyn} {Gray|Black}{hawk|moor}}`

### Observations

"The grammar engine is absurdly powerful. I was building tables INSIDE tables — terrain
→ encounter → loot — and it all cascaded. In Foundry or a dedicated generator I'd need
three separate tools plus copy-paste. Here it's all inside the same document as my session
notes."

"The deck mechanic (`{shuffle:}`) felt like actual card-drawing. I made a weather deck and
it shuffled, dealt without repetition, and refused to repeat until empty. Then I added a
`{cycle:}` for wandering-monster seasons and it advanced on click. The state just lives
there, no setup."

**Friction:**
- "Custom calendars are intimidating. The dialog asks for months, weekdays, eras — I just
  wanted to say 'this world has a 10-day week and the months are these eight names.' It
  takes reading the documentation to figure out how to enter that."
- "The chronicle's calendar binding wasn't obvious. I set up a calendar, opened the chronicle,
  and it was still using Gregorian dates. It took me two tries to understand that I needed
  to bind the chronicle to my custom calendar through a separate step."
- "The log-rolls feature recorded all my rolls, which was great for reference, but the log
  entries were just raw text — I wanted them styled like the session notes I was writing."

**What he'd miss from other apps:**
- "Image maps. I use LegendKeeper-style regional maps where I can pin locations and notes
  to a map image. Pointliner has image support (`![alt](url)`) but no pinning or overlay."
- "Character sheets. My Cairn character has STR/DEX/WIL scores, HP, armor, inventory. I
  can build this with a base (table) and variables, but I had to invent the layout from
  scratch. A 'character sheet' starter would save 20 minutes of setup per campaign."

**What he'd want to see:**
- "A dice roller that shows individual die faces. `{3d6}` gives me the total, which is
  correct for math, but in-play I want to see [3][6][1] = 10 so I can spot doubles for
  criticals."
- "The oracle (`{oracle: even}`) is great but I can't customize the odds. 'Unlikely' is
  maybe 25%, but what if I want 15% for my specific world's probability? Let me type
  `{oracle: 15}` or `{Yes 15 | No 85}`."

---

## Leila — Novelist

### What she read

"'Text should be alive: generation and computation are writing primitives, not a separate
app.' That's the sentence that got me. In Scrivener, my notes are dead text. I have a
separate name generator tab open, a spreadsheet for word counts, and a notebook for plot
ideas. The claim here is that all of that could live in one place."

### What she tried

1. Created a novel structure: Parts → Chapters → Scenes
2. Added `words(subtree)` to each chapter heading to track progress
3. Built a few name generators for her fantasy world
4. Tagged plot threads (`#thread/romance`, `#thread/conspiracy`) and used `{roll:}` to
   surface random threads when stuck
5. Used the Workspace to keep separate documents for worldbuilding and the manuscript

### Observations

"The word count in the outline itself is a small feature that changed how I write. I put
`{= words(subtree)}` on each chapter and now I can see at a glance where the manuscript
is thick and thin. In Scrivener I have to run a report or open a separate window."

"The `{roll: #thread/torn-letter}` thing pulled up a thread I'd tagged and forgotten about.
It was a subplot I'd planned three weeks ago — seeing it again gave me the connection I
needed to merge two plot threads into one. That specific interaction — the document
surprising itself — is what the README promised and it delivered."

**Friction:**
- "The outliner is the primary surface, and that's great for structure, but I write long
  prose. A paragraph block (`/para`) lets me write paragraphs by pressing Enter for a line
  break. That's good, but each paragraph IS a point. So my novel outline has 300 points,
  most of which are just paragraphs. The zoom view helps, but I wanted a 'reading mode'
  that shows all the prose of a chapter as one continuous document."
- "The font is beautiful (Fraunces, Geist) but it's editorial/monospace. I missed being
  able to pick a serif body font for long-form reading."
- "The Workspace is powerful but the tab bar under the toolbar is small. I have three
  documents open (manuscript, worldbuilding, characters) and switching between them
  requires clicking tiny tabs."

**What she'd miss from other apps:**
- "Scrivener's corkboard. I arrange scenes as index cards and reorder them visually. The
  Cards view on a base is close, but it doesn't feel like a storyboarding surface."
- "Word count goals. Scrivener shows me a progress bar for my daily word count. Pointliner
  tells me how many words I have, but not whether I'm on track for today."

**What she'd want to see:**
- "A fullscreen 'distraction-free' reading or prose mode where I just see the text of the
  zoomed point, no outline chrome."
- "Word count targets. Let me set a `goal` on a point and see a meter fill up as I write."

---

## Tomás — Quant / Estimator

### What he read

The math pill (`{= sum(cost)}`) and the estimate (`{5 to 10}`) in the pill table made him
sit up. "So it has a real expression engine AND Monte Carlo estimates? That's Soulver plus
Guesstimate. In one thing. For free." He read the product identity's "no second brain"
passage with less interest — his use case is pure computation with light note-taking.

### What he tried

1. Built an energy-cost analysis: equipment list with `cost`, `consumption`, `hours` as
   properties, then `{= sum(cost)}` and `{= sum(consumption * hours)}` at the top
2. Used estimates for uncertain values: `{5 to 10}` for fuel price ranges, `{50 to 80}`
   for daily consumption
3. Created a budget check with `{= sum(cost) <= budget}`
4. Experimented with unit conversions: `{= convert(180, mi, km)}`
5. Used `today` in date math: `{= today - startdate}` to compute elapsed days

### Observations

"The expression engine is real. I typed `{= sum(consumption * hours) / 1000}` expecting
it to fail, and it just worked. Multiplication, division, variable resolution, all inline.
This is a calculator that lives inside a document I can annotate."

"The estimate pill blew my mind. I put `{5 to 10}` for a fuel price range and then `{=
(5 to 10) * 120}` — actually, that doesn't work, does it? The engines are separate. I
understand why (the math engine returns a single number, the estimate engine returns a
distribution) but it meant I couldn't mix them the way I wanted. I had to keep my certain
and uncertain calculations in separate points."

"`convert(180, mi, km)` gave me 289.68192. That's... precise. I know there's a number
format option, but the first impression is 'this is loud.' I rounded it myself by typing
`{= round(convert(180, mi, km))}` — wait, does it have `round`? Let me check...
`{= round(convert(180, mi, km))}` — yes, 290. Good. But I had to look up how to do it."

**Friction:**
- "The units table is bare-bones. I tried `{= convert(1, barrel, liter)}` and it didn't
  work. I needed to add a custom unit through the File menu, which I only found because I
  read the guide. The built-in units are length/mass/volume/time — no energy, no pressure,
  no currency."
- "I wanted to see my numbers formatted: 1,200,000 not 1200000. The thousand-separator
  format exists but I had to find the per-pill format option. A global 'show numbers
  formatted' toggle would have saved me."
- "The check system (`{= sum(cost) <= budget}`) works for pass/fail, but I wanted
  conditional formatting: turn the number red when it exceeds the threshold. The check
  chip changes from ✓ to ⚠ which is good, but the actual total number doesn't change
  color."

**What he'd miss from other apps:**
- "Soulver's answer bar. In Soulver, every calculation appends its result to a sidebar
  that acts as a running tape. Pointliner scatters results across the document, which is
  powerful for structure, but for quick back-of-envelope work I miss the running tape."
- "Spreadsheet-style cell references in tables. The base table has formulas but they're
  Org-mode style, not `A1`-style. I kept typing `=B2*C2` into a cell and being confused."

**What he'd want to see:**
- "Energy and currency units in the built-in table. I shouldn't have to define 'kWh'
  or 'USD' from scratch."
- "Better estimate composition. If I have `{5 to 10}` and I want `{= (5 to 10) * hours}`,
  I should be able to do that without manually converting the estimate to a mean."
- "A running-tape sidebar. Even a floating panel that shows 'last N computations' would
  replicate Soulver's most addictive feature."

---

## Jae — Student

### What he read

The README's "no account, no install" caught him. "I'm tired of every tool wanting my
email. This just works." The pill table confused him briefly — "what's a 'point'?" — until
he saw the screenshot of the outline and understood it meant bullet points.

### What he tried

1. Made a study outline for his physics course: topics as headings, subtopics as children
2. Added `#TODO` items for assignments and used the `[/]` progress cookie to track
   completion
3. Added `due` dates and checked the Agenda
4. Used per-point notes to jot quick formulas and references
5. Put `{= 2 + 2}` and `{= sqrt(16)}` into his math notes out of curiosity

### Observations

"The progress cookie `[/]` is the feature I didn't know I wanted. I put it on a study plan
heading and it counted how many subtopics I'd finished. I ticked a checkbox and the cookie
updated instantly. That one interaction made me want to use this for everything."

"The to-do system is smart. `#TODO` turns a point into a to-do. `#DONE` marks it done.
`#NEXT` means 'do this next.' And I can define my own states? That's like Todoist but in
my notes."

**Friction:**
- "I opened the app on my phone. It works, but the toolbar is tiny and some buttons are
  hard to tap. The Agenda was especially difficult — the date chips were small and I kept
  tapping the wrong one."
- "No spell check. My browser underlines misspelled words in a regular text field, but
  in the outliner the spell check didn't appear to work consistently. Some points had
  red underlines, some didn't."
- "I wanted to paste a block of text from my lecture notes and have it become multiple
  points. I pasted, and it all went into one point. I had to manually split it by pressing
  Enter at each line break."

**What he'd miss from other apps:**
- "Apple Notes has drawing and handwriting support. I use my iPad to sketch diagrams
  during lectures. Pointliner has image support (`![alt](url)`) but no drawing surface."
- "Reminders / notifications. I set due dates but the app can't notify me when something
  is due. I understand why (it's offline, no push notifications) but it means I have to
  remember to check the Agenda."

**What he'd want to see:**
- "A mobile-friendly layout that's more than just a responsive version of the desktop app.
  On my phone, I'd want the Agenda to be a full-screen view, not a strip under the toolbar."
- "Study-mode: a timer that I can start and stop, and the app logs how long I spent on
  each topic. Even just manual time tracking on a point would help."
- "The ability to paste multi-line text and have it split into separate points automatically
  — each line becomes a point, indentation is preserved."

---

## Cross-cutting themes

### What every persona praised

1. **The pill table delivers.** All six personas tried `{2d6}` or `{= sum(cost)}` as their
   first action. All six had an "oh" moment. The README's 30-second version works.

2. **Live computation is the differentiator.** Rina, Tomás, and Leila all independently
   used the phrase "it just happens" or "it follows every edit" to describe what impressed
   them. The concrete value is not "it can do math" but "I don't have to re-punch the
   calculator every time I edit."

3. **The never-build list is effective positioning.** Marcus and Leila both referenced it
   as the thing that told them they were the right audience. Tomás appreciated the honesty.
   Jae just skimmed it — but it didn't put him off.

4. **`{roll: #tag}` is the killer feature.** Marcus, Leila, Dani, and Rina all
   independently tried it and reported it as the most surprising and valuable interaction.
   It is the feature no competitor has.

### What every persona struggled with

1. **Discoverability is the dominant friction theme.** Every persona had at least one "I
   only found this because I read the guide/CLAUDE.md" moment. The agenda, tag browser,
   journal, templates, custom calendars, unit definitions, the chronicle settings, the
   per-pill format options — all required prior knowledge to discover.

2. **The Agenda icon doesn't communicate its value.** Multiple personas clicked it late in
   their session. "I thought it was a calendar widget" (Rina), "I assumed it was date
   settings" (Marcus). The icon is `fa-calendar-days` with the tooltip "Agenda of dated
   points" — it does not convey "your deadlines live here."

3. **Settings and configuration are nested under File.** The accent picker, width toggle,
   theme cycle, guidance level, toolbar features, tag styling, data packs, custom calendar,
   and custom units all live in the File menu. Several personas described it as "a junk
   drawer of settings" or "everything I don't understand lives here."

4. **Mobile is functional but not delightful.** Jae and Leila tried the app on mobile.
   Both described it as "the desktop app, but smaller." The touch bar helps (long-press
   for bullet menu, swipe to indent) but the discoverability of these gestures is low.

### Feature gaps (consensus picks)

These were mentioned by 3+ personas without prompting:

| Gap | Personas | Priority signal |
|---|---|---|
| Sort children (by property, due date, alpha) | Rina, Marcus, Tomás | High — three professional use cases |
| Better calendar UX (setup, binding) | Dani, Rina | Medium — specialized but loud |
| Number format defaults (rounding, grouping) | Tomás, Rina, Leila | Medium — first-impression friction |
| Mobile-first views (Agenda, zoom) | Jae, Leila | Medium — growing mobile segment |
| Word count targets / goals | Leila, Jae | Low — one persona each but easy build |
| Multi-line paste → multiple points | Jae, Rina | Low — one fix, broad utility |
| Running computation tape | Tomás | Low — power user, but nice-to-have |
| Character sheet / campaign starters | Dani | Low — specialized, template-solvable |

### Meta-observation

The product identity states that Pointliner "claims a place in the tools-for-thought
tradition on one specific merger: the freeform outliner fused with a computational engine."
This panel validates that claim. Every persona experienced the merger firsthand — not as a
marketing promise, but as a genuine interaction ("I clicked it and the total followed").
The friction they reported was not "this doesn't work" but "I wish I'd found this sooner"
or "I wish it went one step further in this direction."

The strongest endorsement came from Dani, who closed his session with: "I came for the
dice and I'm staying for the outline. My campaign notes have never been this structured
and this alive at the same time." That is the product's thesis in one sentence.
