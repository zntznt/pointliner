// Browser smoke — the layer the source pins explicitly cannot prove (#1427).
//
// `tests/test.mjs` proves DOM wiring by source PRESENCE (fnBody/between/windowAfter). That is a
// strong guard and it is not behavior: #1021 shipped a dead keyboard handler that passed its pin,
// because a handler on an unfocusable element is present and inert. Everything below drives the real
// `index.html` in a real browser and asserts on what MOVED — where focus went, what the point holds
// afterwards, whether a pill is still a pill.
//
// Deliberately small and deliberately not a feature sweep. Each check is one defect CLASS this repo
// has actually shipped, so a regression in any of them is the kind that reaches a user:
//   1. boot            a page error at load takes everything with it
//   2. the atom        type {2d6} -> a live pill (IA-2, the 30-second promise)
//   3. click re-rolls  the P1 sign-off, and the point survives the gesture
//   4. keyboard door   Shift+F10 lands focus INSIDE the menu -- the #1021 class exactly
//   5. dismissal       Escape puts the caret back in the point, not on <body>
//   6. pills survive   a `/` command applied to a point carrying a pill keeps the pill (#1396)
//
// RUNNING. `node --test tests/browser.mjs`. Playwright is NOT a committed dependency (see
// .gitignore: this is a no-build single-file repo), so CI installs it for the job and a developer
// without it gets a clean skip rather than a failure. Set PLAYWRIGHT_CHROMIUM_PATH to point at an
// already-installed browser binary; otherwise Playwright resolves its own.
//
// THE SKIP IS THE DANGEROUS PART, so it is fenced. A gate that skips is a gate that passed while
// proving nothing (#1133) -- and this whole file exists because presence is not proof. CI runs the
// install step, so an absent module THERE means the gate quietly stopped running rather than that
// it is unavailable. `POINTLINER_REQUIRE_BROWSER=1`, set by the browser-smoke job, turns every
// skip into a failure; a launch error is never a skip in either environment, because a developer
// who has playwright and a broken browser wants to hear about it.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = 'file://' + join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

let chromium = null, launchErr = null;
try { ({ chromium } = await import('playwright')); }
catch (e) { launchErr = 'playwright is not installed (npm i -D playwright). Skipping browser smoke.'; }

let browser = null, page = null, pageErrors = [];

before(async () => {
  if (!chromium) return;
  const opts = process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {};
  try { browser = await chromium.launch(opts); }
  catch (e) { launchErr = 'could not launch chromium: ' + String(e).split('\n')[0]; }
});
after(async () => { if (browser) await browser.close(); });

// One fresh page per check: a shared page would let an earlier failure cascade, and these are
// cheap. Every page records its own page errors, which check 1 asserts and the rest inherit.
async function fresh() {
  // Never a skip: `skip:` is evaluated when the test is DEFINED, so a launch failure inside
  // before() cannot reach it. Failing here is also the behaviour we want -- playwright resolved
  // and the browser did not start, which is a broken gate rather than an absent one.
  if (!browser) assert.fail(launchErr || 'no browser was launched');
  page = await browser.newPage();
  pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e).split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });
  await page.goto(APP);
  await page.waitForSelector('#outline', { timeout: 10000 });
  await page.waitForTimeout(700);
  await page.keyboard.press('Escape');          // dismiss the first-run welcome
  await page.waitForTimeout(250);
  return page;
}

// A blank document with the caret in its one point — the state every check below starts from.
async function blankWithCaret(pg) {
  await pg.evaluate(() => { root.children = [mkNode('')]; buildIndex(root); markDirty(); render(); });
  await pg.waitForTimeout(250);
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id);
    enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.waitForTimeout(150);
}

const REQUIRE_BROWSER = !!process.env.POINTLINER_REQUIRE_BROWSER;
const skip = () => (REQUIRE_BROWSER ? false : (launchErr || false));

test('boot: the app loads and renders an outline with no page errors', { skip: skip() }, async () => {
  const pg = await fresh();
  const state = await pg.evaluate(() => ({
    rows: document.querySelectorAll('.node-content').length,
    hasRoot: typeof root === 'object' && Array.isArray(root.children),
  }));
  assert.ok(state.hasRoot, 'the document model exists after boot');
  assert.ok(state.rows > 0, 'at least one point is rendered');
  assert.deepEqual(pageErrors, [], 'boot must be free of page errors');
  await pg.close();
});

test('the atom: typing {2d6} produces a live pill showing a number', { skip: skip() }, async () => {
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('Damage {2d6}', { delay: 5 });
  await pg.waitForTimeout(350);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => {
    const n = root.children[0];
    const pill = document.querySelector('.dice-roll');
    return { text: n.text, records: (n.dice || []).length,
      pillPresent: !!pill, shown: pill ? pill.innerText.replace(/\s+/g, ' ').trim() : null };
  });
  assert.match(r.text, /\[\[dice:[a-z0-9]+\]\]/, 'the brace promoted to a folded token');
  assert.equal(r.records, 1, 'with exactly one sidecar record');
  assert.ok(r.pillPresent, 'and a rendered pill');
  assert.match(r.shown, /\d/, 'that shows a number: ' + r.shown);
  assert.deepEqual(pageErrors, []);
  await pg.close();
});

test('click re-rolls the pill, and the point survives the gesture', { skip: skip() }, async () => {
  // A RANDOM VALUE IS NOT AN ASSERTION. The first draft rolled {20d6} and asserted the total moved,
  // on the reasoning that a repeat was "vanishingly rare" -- a constant I never computed. 20d6 has
  // sigma ~7.6, so consecutive totals collide about 5% of the time, and it failed once in ten runs.
  // Exactly the unmeasured constant #1132 bans, in the guard meant to catch unmeasured things.
  //
  // So the PROOF that the click re-rolled is the announcement, which fires on every re-roll whatever
  // the value lands on. The value only has to show that randomness reaches the pill at all, and it
  // does that over ten clicks: for 2d6, sum(p^2) = 0.1127, so all ten identical is 0.1127^9 ~ 3e-9.
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('{2d6}', { delay: 5 });
  await pg.waitForTimeout(350);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(400);
  const before = await pg.evaluate(() => {
    window.__said = [];
    const oa = window.announce;
    window.announce = m => { window.__said.push(m); return oa(m); };
    return { text: root.children[0].text };
  });

  await pg.click('.dice-roll');
  await pg.waitForTimeout(400);
  const one = await pg.evaluate(() => ({ said: window.__said.slice(), text: root.children[0].text,
    records: (root.children[0].dice || []).length, pill: !!document.querySelector('.dice-roll'),
    // `parts` is per-TERM (one term for `2d6`); the per-die array is parts[0].rolls. Checked
    // against rollParsed rather than assumed -- the first draft asserted parts.length === 2.
    dice: (root.children[0].dice[0].parts?.[0]?.rolls || []).length }));
  assert.ok(one.said.some(m => /re-rolled/.test(m)),
    'the click ran a re-roll and said so: ' + JSON.stringify(one.said));
  assert.equal(one.text, before.text, 'and left the point text byte-identical (the token is opaque)');
  assert.equal(one.records, 1, 'without duplicating the record');
  assert.ok(one.pill, 'and the pill is still rendered');
  assert.equal(one.dice, 2, 'with a fresh per-die array of the right length');

  const totals = new Set();
  for (let i = 0; i < 10; i++) {
    await pg.click('.dice-roll');
    await pg.waitForTimeout(120);
    totals.add(await pg.evaluate(() => root.children[0].dice[0].total));
  }
  assert.ok(totals.size >= 2, 'ten clicks produced more than one total: ' + [...totals].join(','));
  await pg.close();
});

test('keyboard door: Shift+F10 opens the bullet menu and focus lands INSIDE it', { skip: skip() }, async () => {
  // The #1021 class. A handler on an unfocusable element passes a presence pin and does nothing;
  // only asking where focus went can tell the difference.
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('a point', { delay: 5 });
  await pg.waitForTimeout(250);
  await pg.keyboard.press('Shift+F10');
  await pg.waitForTimeout(450);
  const r = await pg.evaluate(() => {
    const a = document.activeElement;
    return { menuOpen: !!document.querySelector('#bpop.on'),
      focusInMenu: !!a?.closest?.('#bpop'), onBody: a === document.body,
      landed: String(a?.className || a?.tagName).slice(0, 30) };
  });
  assert.ok(r.menuOpen, 'the menu opened');
  assert.ok(!r.onBody, 'focus did not fall to <body>');
  assert.ok(r.focusInMenu, 'focus is inside the menu, not merely near it: ' + r.landed);
  await pg.close();
});

test('dismissal: Escape from the menu puts the caret back in the point', { skip: skip() }, async () => {
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('a point', { delay: 5 });
  await pg.waitForTimeout(250);
  const id = await pg.evaluate(() => root.children[0].id);
  await pg.keyboard.press('Shift+F10');
  await pg.waitForTimeout(400);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(450);
  const r = await pg.evaluate((id) => {
    const a = document.activeElement;
    return { onBody: a === document.body, backInPoint: a?.dataset?.id === id,
      landed: String(a?.className || a?.tagName).slice(0, 30), text: root.children[0].text };
  }, id);
  assert.ok(!r.onBody, 'Escape did not strand focus on <body>');
  assert.ok(r.backInPoint, 'focus returned to the point it came from: ' + r.landed);
  assert.equal(r.text, 'a point', 'and the typing is intact');
  await pg.close();
});

test('a / command applied to a point carrying a pill keeps the pill', { skip: skip() }, async () => {
  // #1396: the apply used to splice the row's RENDERED text at an offset measured in a different
  // text space, overwriting the pill's token with its own glyphs. No source pin can see that.
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('Damage {2d6}', { delay: 5 });
  await pg.waitForTimeout(350);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(350);
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id);
    enterEdit(c, n); c.focus(); activeContentId = n.id;
    const r = document.createRange(); r.selectNodeContents(c); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  });
  await pg.waitForTimeout(150);
  await pg.keyboard.type(' /todo', { delay: 6 });
  await pg.waitForTimeout(450);
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(600);
  await pg.evaluate(() => document.activeElement?.blur?.());
  await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => ({ text: root.children[0].text, records: (root.children[0].dice || []).length }));
  assert.match(r.text, /\[\[dice:[a-z0-9]+\]\]/, 'the pill token survived the command: ' + r.text);
  assert.equal(r.records, 1, 'and its record was not pruned');
  assert.match(r.text, /^- \[ \] /, 'while the command itself applied');
  await pg.close();
});

test('a shipped list section renders its + Add door, and the door adds a row', { skip: skip() }, async () => {
  // #1428. The pure core (inferRowShape) says a section HAS a shape; it says nothing about whether
  // a door reaches the screen, and the reported symptom was measured in the DOM: zero
  // `.addrow-affordance` in the whole document. So this asserts the DOM, then uses the door.
  const pg = await fresh();
  await pg.evaluate(() => { adoptDoc(fromOpml(STARTERS.find(s => s.id === 'freelance-costing').opml));
    markDirty(); render(); });
  await pg.waitForTimeout(600);
  const seen = await pg.evaluate(() => {
    const sec = [...document.querySelectorAll('.node-row')].find(r =>
      /Hours logged so far/.test(r.querySelector('.node-content')?.innerText || ''));
    const doors = [...(sec?.querySelectorAll(':scope > .addrow-affordance') || [])];
    return { total: document.querySelectorAll('.addrow-affordance').length,
      here: doors.length, labels: doors.map(d => d.innerText.trim()) };
  });
  assert.ok(seen.total > 0, 'the document has add-row doors at all (it shipped with zero)');
  assert.ok(seen.here > 0, 'and the section the report named has its own: ' + JSON.stringify(seen.labels));

  // Use it. A door that renders and does nothing is the #1021 shape wearing a different hat.
  const before = await pg.evaluate(() => {
    const s = root.children.flatMap(function f(n) { return [n, ...(n.children||[]).flatMap(f)]; })
      .find(n => /Hours logged so far/.test(n.text));
    return { id: s.id, kids: s.children.length };
  });
  await pg.evaluate(() => {
    const sec = [...document.querySelectorAll('.node-row')].find(r =>
      /Hours logged so far/.test(r.querySelector('.node-content')?.innerText || ''));
    sec.querySelector(':scope > .addrow-affordance').click();
  });
  await pg.waitForTimeout(600);
  const after = await pg.evaluate((id) => ({
    opened: !!document.querySelector('#io-card'),
    kids: nodeById(id).children.length,
  }), before.id);
  assert.ok(after.opened || after.kids > before.kids,
    'clicking the door opened its form or added a row, rather than doing nothing');
  await pg.close();
});

// #1240 phase 4 — the doors of the point you are LOOKING AT.
//
// Every "+ Add"/"+ Total"/"+ Check" door hangs off its PARENT's rendered row. The point you are
// looking at has no row in its own view (it is the masthead, or it is the document), so its doors
// had nowhere to hang and silently vanished. Measured on the pre-fix build by driving it:
//   zoom into "## Groceries"      -> its three doors disappeared
//   a shaped list at the top level -> never had them at all
// The zoom case is the P1 break: you zoom in to work on that exact list and its controls go away on
// arrival. This drives BOTH, plus the two negative cases, because "complete the set" onto a list
// that should stay door-free is its own bug.
test('#1240 the view parent keeps its doors when its row is not on screen', { skip: skip() }, async () => {
  const pg = await fresh();
  const doc = body => `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0">` +
    `<head><title>Notes</title></head><body>${body}</body></opml>`;
  const rows = `<outline text="Aldi #august {prop cost: 92.4}"/><outline text="Lidl #august {prop cost: 40.1}"/>`;

  const view = (xml, zoom) => pg.evaluate(([x, z]) => {
    adoptDoc(fromOpml(x)); focusedId = null; render();
    if (z) { focusedId = root.children[0].id; render(); }
    const bar = document.querySelector('#outline > .view-doors');
    return {
      row: [...document.querySelectorAll('.node-row .addrow-affordance')].map(e => e.textContent.trim()),
      view: bar ? [...bar.querySelectorAll('.addrow-affordance')].map(e => e.textContent.trim()) : [],
      label: bar ? bar.getAttribute('aria-label') : null,
    };
  }, [xml, zoom]);

  const zoomed = await view(doc(`<outline text="## Groceries">${rows}</outline>`), true);
  assert.ok(zoomed.view.includes('+ Add'),
    'zoomed into the list, its + Add must still be reachable: ' + JSON.stringify(zoomed));
  assert.ok(zoomed.view.includes('+ Total'), 'and the + Total it earned: ' + JSON.stringify(zoomed.view));
  assert.equal(zoomed.label, 'Add to Groceries',
    'the group names the point it acts on, with the heading markers stripped (not "## Groceries")');

  const top = await view(doc(rows), false);
  assert.ok(top.view.includes('+ Add') && top.view.includes('+ Total'),
    'a shaped list at the top level of a document earns its doors: ' + JSON.stringify(top));

  // Unchanged: a row that CAN host its doors still does, and the view adds no second copy.
  const nested = await view(doc(`<outline text="## Groceries">${rows}</outline>`), false);
  assert.ok(nested.row.includes('+ Add'), 'the row path is untouched');
  assert.deepEqual(nested.view, [], 'and the view does not duplicate what a row already carries');

  // The negative case. An ordinary prose outline must grow no chrome at all.
  const prose = await view(doc(`<outline text="Woke up late"/><outline text="Rewrote chapter one"/>`), false);
  assert.deepEqual(prose.view, [], 'ordinary prose at the top level stays door-free');

  // A door that renders and does nothing is the #1021 shape wearing a different hat.
  const acted = await pg.evaluate(() => {
    const bar = document.querySelector('#outline > .view-doors');
    return !!bar;
  });
  assert.ok(acted === false, 'prose left no bar behind to click');
});

// #1438 / UXP-329 — the KEYBOARD route to "add a row like these".
//
// The "+ Add" door was mouse-only: every affordance is tabindex="-1" with no keydown path, and
// driving Tab through the outline reaches `.node-content` and never a door. The guided-authoring
// proposal always specified the other half ("via `/` ... exactly like every other command") and it
// was never built: openAddRowForm had exactly ONE caller, the door itself. This check exists
// BECAUSE a source-pin cannot tell the difference -- a registered command that nothing routes looks
// identical in the source to one that works. So it types the verb like a user and watches.
test('#1438 /addrow opens the same form from the keyboard, and refuses out loud', { skip: skip() }, async () => {
  const pg = await fresh();
  const shaped = '<outline text="## Groceries">' +
    '<outline text="Aldi #august {prop cost: 92.4}"/><outline text="Lidl #august {prop cost: 40.1}"/></outline>';
  const load = body => pg.evaluate(x => {
    adoptDoc(fromOpml('<?xml version="1.0"?><opml version="2.0"><head><title>N</title></head><body>' + x + '</body></opml>'));
    focusedId = null; render();
  }, body);
  const caretInto = re => pg.evaluate(r => {
    const e = [...document.querySelectorAll('.node-content')].find(x => new RegExp(r).test(x.innerText));
    if (!e) throw new Error('no point matching ' + r);
    e.focus();
    const s = getSelection(), g = document.createRange();
    g.selectNodeContents(e); g.collapse(false); s.removeAllRanges(); s.addRange(g);
  }, re);
  // The form is a persistent container, so presence is NOT openness -- it is always in the DOM.
  // Measured the hard way: an earlier probe read `!!querySelector('#io-card')` and called a closed
  // dialog open. Openness is laid out AND carrying text.
  const state = () => pg.evaluate(() => {
    const c = document.querySelector('#io-card');
    const open = !!(c && c.offsetParent !== null && c.innerText.trim());
    return { open, title: open ? c.innerText.split('\n')[0] : null,
             said: (document.getElementById('flash-hint')?.innerText || '').trim() || null };
  });
  const type = async () => {
    await pg.keyboard.type(' /addrow'); await pg.waitForTimeout(400);
    await pg.keyboard.press('Enter');  await pg.waitForTimeout(600);
  };

  // From a ROW inside the list.
  await load(shaped); await caretInto('Aldi'); await type();
  let s = await state();
  assert.ok(s.open, 'typing /addrow from a row must open the add form');
  assert.match(s.title, /Groceries/, 'and it targets the list, not the row: ' + JSON.stringify(s.title));

  // From the CONTAINER itself — the other caret position a user can be in.
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
  await load(shaped); await caretInto('Groceries'); await type();
  assert.ok((await state()).open, 'and from the heading above the list');

  // P4, both refusals. They are DIFFERENT reasons and must not collapse into one:
  // "there is no list here" is not "these points share no shape".
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
  await load('<outline text="just one thought"/>'); await caretInto('one thought'); await type();
  s = await state();
  assert.equal(s.open, false, 'a lone point is not a list, so no form');
  assert.match(s.said || '', /caret in a list/, 'and it says so rather than no-opping: ' + JSON.stringify(s.said));

  await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
  await load('<outline text="Alpha"/><outline text="Beta"/>'); await caretInto('Alpha'); await type();
  s = await state();
  assert.equal(s.open, false, 'two points sharing no shape earn no form');
  assert.match(s.said || '', /share a shape/, 'with the OTHER reason, not the same one: ' + JSON.stringify(s.said));
});

// #1440 — the folder write follows the DOCUMENT, not the view.
//
// A source-pin can prove the `&& dirty` is present; only driving proves the write stops happening,
// and that a REAL edit still lands (which is the half that matters — a gate that also suppresses
// genuine saves would be far worse than the churn it fixes).
//
// Driven on the pre-fix build: with a connected folder and a CLEAN document, toggling the agenda
// "Done" filter produced one full serialize + atomic write whose body was identical apart from a
// fresh <dateModified>.
test('#1440 a view toggle writes nothing; a real edit still writes', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    // adoptDoc resets the workspace state, so stand in for the folder AFTER loading (measured: the
    // reverse order silently produced zero writes and looked like a passing fix).
    adoptDoc(fromOpml('<?xml version="1.0"?><opml version="2.0"><head><title>N</title></head><body>' +
      '<outline text="## Groceries"><outline text="Aldi {prop cost: 92.4}"/>' +
      '<outline text="Lidl {prop cost: 40.1}"/></outline></body></opml>'));
    focusedId = null; render();
    window.__writes = [];
    window.safeWriteOpml = async (dir, name, opml) => { window.__writes.push(opml); };
    window.anchorWorkspaceFile = async () => {};
    window.refreshOwnDocInIndex = () => {};
    workspaceDir = { name: 'nb' };
    workspaceFile = { getFile: async () => ({ lastModified: _wsKnownModified, size: _wsKnownSize }) };
    fileName = 'notes.opml';
    dirty = false;                       // the document is SAVED; nothing is pending
  });

  // A pure view toggle: agenda filter state lives in the JSON payload, not in any point's text.
  await pg.evaluate(() => { agendaShowDone = !agendaShowDone; scheduleAutosave(); });
  await pg.waitForTimeout(1400);         // past the 800ms debounce
  const afterView = await pg.evaluate(() => window.__writes.length);
  assert.equal(afterView, 0,
    'a view-only toggle must not rewrite the document file — it churns mtime, wakes folder sync, ' +
    'and re-anchors the staleness guard, all for a byte-identical body');

  // The half that must NOT regress: a genuine edit still reaches disk.
  await pg.evaluate(() => { root.children[0].children[0].text += ' extra'; markDirty(); });
  await pg.waitForTimeout(1400);
  const afterEdit = await pg.evaluate(() => window.__writes.length);
  assert.equal(afterEdit, 1, 'a real text edit must still write the document');
  const wrote = await pg.evaluate(() => /extra/.test(window.__writes[0] || ''));
  assert.ok(wrote, 'and the write must contain the edit, not a stale serialization');
});

// #1443 — the fix must not demote an INHERITED-tag match to a context row.
//
// The cheap version of this fix (pass '' everywhere) is 43% faster and WRONG: `self` decides whether
// a row renders as a real match or as surrounding context, so a node matching only through an
// ancestor's tag would silently become context. A 25k synthetic fixture cannot see it — every row
// there matches directly. This is the fixture that can.
test('#1443 a point that matches only by an inherited tag is still a match', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    adoptDoc(fromOpml('<?xml version="1.0"?><opml version="2.0"><head><title>N</title></head><body>' +
      '<outline text="Session one #campaign">' +
      '<outline text="Alder the smith"/><outline text="Bram the cooper"/></outline>' +
      '<outline text="Shopping list"><outline text="bread"/></outline></body></opml>'));
    focusedId = null; render();
    applySearch('#campaign');
    const out = flatRows.map(x => ({ text: x.node.text, hl: !!x.highlight }));
    applySearch('');
    return out;
  });
  const byText = t => r.find(x => x.text.startsWith(t));
  assert.ok(byText('Alder'), 'the inheriting child is in the results at all');
  assert.equal(byText('Alder').hl, true,
    'Alder carries no tag of its own and must still count as a MATCH, not context');
  assert.equal(byText('Bram').hl, true, 'and so must its sibling');
  assert.equal(byText('Session one').hl, true, 'as must the point that owns the tag');
  assert.equal(r.length, 3, 'and the untagged branch stays out entirely');
});

// 12. import formats -- the sniff picks the right PARSER, and the import reaches the doc store.
// A source pin cannot see this class: `indexOf('sniffBibtex') < indexOf('sniffDelimited')` stayed
// green with the branch disabled (`false && sniffBibtex(text)`), because the substring never moved.
// And the hazard is live -- sniffDelimited claims a plain .bib -- so a wrong order silently lands
// every citation as a spreadsheet row. This drives the real door and asserts on what ARRIVED.
test('#1265 a pasted .bib imports as references, and its citations reach the footnote store', { skip: skip() }, async () => {
  const pg = await fresh();
  const BIB = [
    '@article{smith2020,',
    '  author  = {Smith, Jane and Doe, John},',
    '  title   = {A Study of {DNA} Things},',
    '  journal = {Journal of Things},',
    '  year    = {2020}',
    '}',
    '@book{muller-2019,',
    '  author    = {M{\\"u}ller, Anna},',
    '  title     = {Origins of Everything},',
    '  publisher = "Big Press",',
    '  year      = {2019}',
    '}',
  ].join('\n');

  const before = await pg.evaluate(() => (root.footnotes || []).length);
  await pg.click('#logo-btn');                       // the real File menu, then the real door
  await pg.waitForTimeout(200);
  await pg.click('#btn-import');
  await pg.waitForTimeout(300);
  await pg.fill('#io-import-paste', BIB);
  // the footer's commit button, by its visible label -- not by calling doImport ourselves
  await pg.evaluate(() => [...document.querySelectorAll('#io-card button')]
    .find(b => /Add pasted points/.test(b.textContent)).click());
  await pg.waitForTimeout(600);

  const got = await pg.evaluate(() => {
    const sec = root.children.find(n => /Imported references/.test(n.text || ''));
    const kid = sec && sec.children[0];
    return {
      section: sec ? sec.text : null,
      anyTable: root.children.some(n => /Imported table/.test(n.text || '')),
      kids: sec ? sec.children.length : 0,
      kidText: kid ? kid.text : '',
      kidProps: kid ? (kid.props || []).map(p => p.key + '=' + p.val) : [],
      store: (root.footnotes || []).map(f => f.text),
      // the marker must now hold a STORE id, not the raw cite key: that is the lift having run
      markerIsStoreId: kid ? (root.footnotes || []).some(f => kid.text.includes('[^' + f.id + ']')) : false,
      rendered: [...document.querySelectorAll('.node-content')]
        .some(el => /A Study of DNA Things/.test(el.innerText || '')),
      sups: document.querySelectorAll('.fn-ref').length,
    };
  });

  assert.equal(got.section, '## Imported references', 'the .bib landed as a references section');
  assert.equal(got.anyTable, false, 'and NOT as a spreadsheet table (the sniff order held)');
  assert.equal(got.kids, 2, 'one point per entry');
  assert.ok(got.rendered, 'the reference is on screen, with its LaTeX resolved to real characters');
  assert.ok(got.markerIsStoreId,
    'the [^key] marker was remapped to a doc-store id: the footnote lift ran on insert');
  assert.equal(got.store.length - before, 2, 'both citations reached the document footnote store');
  assert.ok(got.store.some(t => /Smith, Jane; Doe, John\. A Study of DNA Things\./.test(t)),
    'and the store holds the citation, not the raw BibTeX');
  assert.ok(got.store.some(t => /Müller, Anna/.test(t)), 'including the one whose author was spelled in LaTeX');
  assert.ok(got.sups >= 2, 'each reference renders a real footnote marker');
  // the cite key is the identity that has to survive the trip out of her reference manager
  assert.ok(got.kidProps.includes('cite=smith2020'), 'the cite key promoted to a real property');
  assert.ok(got.kidProps.includes('year=2020'), 'and the year, so a reading list can sort by it');
  assert.deepEqual(pageErrors, [], 'no page errors during the import');
});

// 13. the math pill's DIAGNOSIS, not just its number. #1449 was invisible to every unit test: the
// pure cores were all correct and fully pinned, and the defect lived in which core the renderer
// ASKED. {= max("due:overdue", cost)} read "#ERR (divide by zero)" when nothing had divided --
// ±Infinity is the identity of an empty extremal, and firstEmptyRollup's regex could not see the
// quoted-search form. A wrong diagnosis sends a user hunting a division that does not exist.
test('#1449 an empty min/max over a search reads "nothing matched", not "divide by zero"', { skip: skip() }, async () => {
  const pg = await fresh();
  const got = await pg.evaluate(() => {
    const lines = [
      '{= max("due:overdue", cost)}',   // the guide's own `rollups` example
      '{= min("due:overdue", cost)}',
      '{= max(cost)}',                  // the BARE sibling: the treatment being matched
      '{= sum("due:overdue", cost)}',   // sum keeps its own "0 in scope" cue
      '{= 1/0}',                        // a REAL divide by zero must keep saying so
    ];
    root.children = lines.map(t => mkNode(t));
    promoteLoadedShorthand(root); buildIndex(root, null); markDirty(); render();
    const els = [...document.querySelectorAll('.node-content[data-id]')];
    return root.children.map((n, i) => ({
      src: lines[i],
      text: (els.find(e => e.dataset.id === n.id) || {}).innerText || '',
    }));
  });
  const by = s => got.find(g => g.src === s).text;

  for (const s of ['{= max("due:overdue", cost)}', '{= min("due:overdue", cost)}']) {
    assert.ok(/nothing matched/.test(by(s)), `${s} should say nothing matched, got: ${JSON.stringify(by(s))}`);
    assert.ok(!/divide by zero/.test(by(s)), `${s} must not claim a division that never happened`);
  }
  // the whole point is that the two forms of the SAME question now answer alike
  assert.ok(/nothing matched/.test(by('{= max(cost)}')), 'the bare form still carries the cue');
  assert.ok(/∞/.test(by('{= max("due:overdue", cost)}')),
    'and still shows the identity value, exactly as the bare form does');
  assert.ok(/0 in scope/.test(by('{= sum("due:overdue", cost)}')), 'sum keeps its own distinct cue');
  assert.ok(/divide by zero/.test(by('{= 1/0}')), 'a genuine n/0 is still called a divide by zero');
});

// 14. a meter driven by a VARIABLE. Reported from real use: `{hp := 4}` + `{meter: hp/100}` drew a
// bare red {meter?}. resolveMeter's var branch read `.value ?? .rolled` off collectVars, which is a
// flat name → value map, so it was NaN for every variable and the branch was dead. Driven, not pinned:
// the pure core was reachable all along, and what was broken was the value it was handed.
test('#1451 a meter reads a declared variable, and a property still wins over one', { skip: skip() }, async () => {
  const pg = await fresh();
  const got = await pg.evaluate(() => {
    const shot = (kids) => {
      root.children = kids.map(t => mkNode(t));
      promoteLoadedShorthand(root); buildIndex(root, null); markDirty(); render();
      const els = [...document.querySelectorAll('.node-content[data-id]')];
      const last = root.children[root.children.length - 1];
      const el = els.find(e => e.dataset.id === last.id);
      const meter = el && el.querySelector('.meter');
      return { text: el ? el.innerText : '', aria: meter ? meter.getAttribute('aria-label') : null,
               bad: !!(el && el.querySelector('.meter-bad')) };
    };
    return {
      user:  shot(['{hp := 4}', '{meter: hp/100}']),                       // the reported case
      both:  shot(['{hp := 4}{hpmax := 100}', '{meter: hp/hpmax}']),
      pool:  shot(['{hp := 3}', '{meter: hp/5 hearts}']),                  // icons carry no innerText
      prop:  shot(['P {prop hp: 4}{prop hpmax: 100} {meter: hp/hpmax}']),  // must be unchanged
      text:  shot(['{tone := warm}', '{meter: tone/100}']),                // must still refuse
      none:  shot(['{meter: nope/100}']),
      // #1451b: the BRACED var form, and the guide's own {meter: {done}/{goal}}. These break on the
      // LOAD path only: promotion used to descend into the meter body and rewrite {hp} to a
      // [[var:…]] token, so a saved document rendered {meter?} on reopen while it looked fine when
      // first typed. shot() promotes exactly as a load does, which is what exposes it.
      braced: shot(['{hp := 4}', '{meter: {hp}/100}']),
      guide:  shot(['{done := 3}{goal := 10}', '{meter: {done}/{goal}}']),
      prose:  shot(['{just prose holding {2d6} inside}']),   // prose braces must STILL come alive
    };
  });
  assert.equal(got.user.bad, false, 'the reported case must not render the {meter?} marker');
  assert.ok(/4\/100/.test(got.user.text), `a variable drives the bar, got: ${JSON.stringify(got.user.text)}`);
  assert.ok(/4\/100/.test(got.both.text), 'both sides may be variables');
  // the pool style draws Font Awesome glyphs, which have no text at all -- assert the accessible name
  assert.ok(/3 of 5 filled/.test(got.pool.aria || ''), `a variable drives a pool too, aria: ${got.pool.aria}`);
  assert.ok(/4\/100/.test(got.prop.text), 'the property form is unchanged');
  assert.equal(got.text.bad, true, 'a TEXT variable still refuses rather than drawing a wrong bar');
  assert.equal(got.none.bad, true, 'a name resolving nowhere still refuses');
  assert.ok(/declare it as a variable/.test(got.none.aria || ''), 'and the refusal offers both doors');
  assert.equal(got.braced.bad, false, 'the braced var form survives a load-path promote');
  assert.ok(/4\/100/.test(got.braced.text), 'and resolves');
  assert.ok(/3\/10/.test(got.guide.text), "the guide's own {meter: {done}/{goal}} renders");
  assert.ok(/\{meter: \{done\}\/\{goal\}\}/.test(got.guide.text) === false, 'it is a bar, not literal text');
  // the anti-shred widening must not stop PROSE braces from bringing an inner pill alive
  assert.ok(/2d6/.test(got.prose.text) && !/\{2d6\}/.test(got.prose.text),
    'a {2d6} inside prose braces still promotes, so the widened rule did not over-reach');
});

// 15. THE CONCEPT-GUIDE SWEEP — every example the guide teaches, rendered in the real app.
//
// The guide is a promise: "type this, get that". Nothing checked it, and two shipped bugs lived
// exactly there (#1449's rollup, #1451's meter), each in an example a reader would copy verbatim.
//
// The trick is CONTEXT. A first pass rendered every example into an EMPTY document, so an example
// that merely needed a variable was indistinguishable from one that was broken -- 162 of 197 "failed"
// and a real meter bug was dismissed as noise inside that pile. This provisions first: every
// identifier an example mentions is declared as a document variable AND as a property on the host
// and on two child rows, so scoped reads and rollups both find real values. Only then is a failure
// a failure, and the count drops from 162 to a handful.
//
// What it asserts is the app's OWN failure chrome (.meter-bad / .math-err / .math-bad /
// .brace-attempt) -- never a raw-text heuristic, which is what made the first pass so noisy.
// The allow-list is EMPTY, and getting it there was the work. Six of its seven entries were the
// harness's fault, not the app's: five needed a KIND the flat provisioner could not invent (a
// distribution for percentile, a dice literal, custom units for convert, a named base for a dotted
// ref), and one — {= Orc.HP + 5} — failed only because the harness promoted BEFORE buildIndex, so a
// base's row variables did not exist yet at promotion time. The seventh was a real guide error, fixed
// in index.html: {= simulate(2000, atk, >= ac)} used a VARIABLE as the die, which simulate does not
// take, while its own description says "thresholds can be declared variables" (the threshold works).
// Keep this empty. An entry here is a promise the guide makes and the app does not keep.
const GUIDE_NEEDS_RICHER_SETUP = new Map([]);

test('#1452 every concept-guide example renders, once its context exists', { skip: skip() }, async () => {
  const pg = await fresh();
  const got = await pg.evaluate(() => {
    const listed = GUIDE.flatMap(e => (e.examples || []).map(x => ({ id: e.id, syn: x.syn })))
      .filter(x => /[{[]/.test(x.syn));
    // ALSO the prose. An entry's BODY shows syntax too ("widen it with sum(cost, document)"), and
    // that half was never checked -- an example list can be perfect while the paragraph above it
    // promises something the app does not do. Braces are the honest extraction: a {…} in guide prose
    // is unambiguously syntax being shown. Backticked spans and bare name(…) runs were measured and
    // rejected as too noisy -- the guide backticks single characters ({, /, @) and prose swallows
    // parentheses ("date (when any child carries a due date)"), so both manufacture fake failures.
    const seen = new Set(listed.map(x => x.syn));
    // Not every brace in prose is something to TYPE. Three generic rules cover most of it, because
    // each follows a convention the app or the writing already keeps:
    //   • `…?}` is the app's OWN unresolved-marker convention ({meter?}, {cond?}) — prose quotes those
    //     when explaining what a failure looks like, so "typing" one is meaningless.
    //   • an ellipsis is a placeholder for the part being discussed ({= …}), never a literal.
    //   • a whitespace-only brace is punctuation in a sentence ("use { } not [ ]").
    const notSyntax = (s) => /\?\}$/.test(s) || /\.\.\.|…/.test(s) || !s.slice(1, -1).trim();
    // and three that need naming, because no rule catches them without also eating real syntax
    const PROSE_NOT_SYNTAX = new Map([
      ['{vs ac}', 'a sentence fragment ("or one of your own variables, like {vs ac}"), not a whole pill'],
      ['{= simulate(N, roll, over a bar)}', 'a prose SIGNATURE — N and "over a bar" are placeholders'],
      ['{= (5 to 10) * 2}', 'a deliberate COUNTER-example: the prose says it fails, and it does'],
    ]);
    const prose = [];
    for (const e of GUIDE) {
      for (const m of String(e.body || '').matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)) {
        if (seen.has(m[0]) || notSyntax(m[0]) || PROSE_NOT_SYNTAX.has(m[0])) continue;
        seen.add(m[0]); prose.push({ id: e.id + ':body', syn: m[0] });
      }
    }
    const examples = listed.concat(prose);
    // RESERVED = only what would BREAK if declared (functions, scope words, style words, artifact
    // keywords). Everything else is a user DATA name and gets provisioned. Reserving an ordinary
    // name like `a`, `x`, `due` or `done` starves the example under test and manufactures a failure
    // that reads like an app bug -- that mistake cost a full pass, so the list stays deliberately tight.
    const reserved = new Set([
      ...Object.keys(typeof FN1 !== 'undefined' ? FN1 : {}),
      ...Object.keys(typeof FN2 !== 'undefined' ? FN2 : {}),
      ...Object.keys(typeof FN3 !== 'undefined' ? FN3 : {}),
      'sum','avg','count','min','max','and','or','if','words','simulate','percentile','chanceover','chanceunder',
      'self','children','subtree','document','doc','folder','notes','true','false','pi','e',
      'meter','roll','rule','shuffle','cycle','once','stopping','markov','oracle','query','prop','date',
      'is','has','tag','hearts','stars','blocks','dots','likely','unlikely','even',
      'cap','title','upper','lower','s','ed','poss','ord','png','url','alt','http','https','md','opml','csv','to',
    ]);
    const namesIn = (syn) => [...new Set((syn.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []))]
      .filter(n => !reserved.has(n.toLowerCase()) && !/^\d/.test(n));

    const MARKERS = '.meter-bad, .math-err, .math-bad, .brace-attempt';
    const failed = [];
    for (const ex of examples) {
      const syn = ex.syn;
      // ── provision by KIND. A flat "every name is the number 12" is not enough: percentile needs an
      // UNCERTAIN value, convert needs declared UNITS, a dotted ref needs a BASE whose rows declare
      // Row.Column variables. Giving the wrong kind produces the app's correct complaint about the
      // kind, which reads exactly like a bug.
      const dists = [
        ...[...syn.matchAll(/\b(?:percentile|chanceover|chanceunder)\s*\(\s*([A-Za-z_]\w*)/g)].map(m => m[1]),
        // a BARE brace doing arithmetic ({cost * 2}) is only meaningful for an UNCERTAIN value —
        // a plain number needs {= cost * 2}. So the shape itself names the kind.
        ...[...syn.matchAll(/\{\s*([A-Za-z_]\w*)\s*[*/+-]/g)].map(m => m[1]),
      ];
      // #tags an example rolls or searches over need points that actually carry them
      const tags = [...new Set([...syn.matchAll(/#([A-Za-z][\w-]*)/g)].map(m => m[1]))];
      const units = [...syn.matchAll(/\bconvert\s*\(\s*[^,]+,\s*([A-Za-z_]\w*)\s*,\s*([A-Za-z_]\w*)/g)].flatMap(m => [m[1], m[2]]);
      const dotted = [...syn.matchAll(/\b([A-Z][A-Za-z0-9_]*)\.([A-Za-z_]\w*)(?:\.([A-Za-z_]\w*))?/g)]
        .map(m => ({ a: m[1], b: m[2], c: m[3] }));
      const aggBase = /\b(?:sum|avg|count|min|max)\s*\(\s*([A-Z][A-Za-z0-9_]*)\.([A-Za-z_]\w*)\s*\)/.exec(syn);
      const typed = new Set([...dists, ...units, ...dotted.flatMap(d => [d.a, d.b, d.c].filter(Boolean))]);
      const names = namesIn(syn).filter(n => !typed.has(n));

      const props = names.map(n => `{prop ${n}: 12}`).join(' ');
      const host = mkNode('Host ' + props);
      host.children = [mkNode('Row A ' + props), mkNode('Row B ' + props)];
      const target = mkNode(syn);
      host.children.push(target);
      const decls = [...names.map(n => `{${n} := 12}`), ...dists.map(n => `{${n} := 100 to 200}`)].join('');
      root.children = [mkNode(decls || 'ctx')];
      // two tagged points per tag: enough for a roll to pick and a query to match
      for (const t of tags) { root.children.push(mkNode(`Ana #${t}`), mkNode(`Bo #${t}`)); }
      // a query or roll over is:todo / is:done needs points in those STATES, not just tagged ones
      if (/\bis:(?:todo|done)\b/.test(syn)) root.children.push(mkNode('- [ ] Open task'), mkNode('- [x] Closed task'));
      // custom units: the app's own stored shape, one private dimension so no built-in is shadowed
      if (units.length) {
        const u = {}; units.forEach((n, k) => { u[n.toLowerCase()] = { dim: 'guidesweep', ratio: Math.pow(10, k) }; });
        root.units = normalizeUnits(u) || undefined;
      } else root.units = undefined;
      // a base whose rows declare Row.Column variables (named, when the ref is 3-segment or an aggregate)
      if (dotted.length) {
        const named = aggBase ? aggBase[1] : (dotted.find(d => d.c) || {}).a;
        const rowName = aggBase ? 'Orc' : (dotted[0].c ? dotted[0].b : dotted[0].a);
        const col = aggBase ? aggBase[2] : (dotted[0].c || dotted[0].b);
        const b = mkNode(`| Name | ${col} |\n| --- | --- |\n| ${rowName} | 12 |\n| Goblin | 7 |`, 'base');
        b.varbase = named ? { name: named } : {};
        root.children.push(b);
      }
      root.children.push(host);
      try {
        // markDirty FIRST: collectVars is cached on _varsVer, and this loop reuses one page, so
        // without invalidation every example after the first asks a STALE cache whether a name is
        // known — and a perfectly good base looks broken. Then buildIndex, because a base's row
        // variables must exist before promotion asks. Both orderings cost a pass to find.
        markDirty(); buildIndex(root, null); promoteLoadedShorthand(root); buildIndex(root, null); render();
      } catch (e) {
        failed.push({ syn: ex.syn, id: ex.id, why: 'THREW ' + String(e).slice(0, 60) });
        continue;
      }
      const el = [...document.querySelectorAll('.node-content[data-id]')].find(e => e.dataset.id === target.id);
      if (!el) { failed.push({ syn: ex.syn, id: ex.id, why: 'never rendered' }); continue; }
      const mark = el.querySelector(MARKERS);
      if (mark) failed.push({ syn: ex.syn, id: ex.id, why: mark.className, text: el.innerText.replace(/\n/g, ' | ').slice(0, 60) });
      // THE SECOND SIGNAL, and the one a marker cannot give. An example can fail SILENTLY: the brace
      // simply never promotes and the reader is left looking at the recipe instead of the result, with
      // no error anywhere. That is how {meter: {done}/{goal}} hid, and a marker sweep alone is blind
      // to it. Once context is provisioned, a brace still visible in the RENDERED text is a broken
      // promise -- the example said "type this, get that" and delivered the this.
      else if (/\{[^}]*\}/.test(el.innerText)) {
        failed.push({ syn: ex.syn, id: ex.id, why: 'rendered as literal text (never promoted)',
                      text: el.innerText.replace(/\n/g, ' | ').slice(0, 60) });
      }
    }
    return { total: examples.length, failed };
  });

  assert.ok(got.total > 150, `the sweep must actually find the guide's examples, got ${got.total}`);
  const unexpected = got.failed.filter(f => !GUIDE_NEEDS_RICHER_SETUP.has(f.syn));
  assert.deepEqual(unexpected.map(f => `[${f.id}] ${f.syn} -> ${f.why} ${f.text || ''}`), [],
    'a guide example renders a failure marker even with its context provisioned. Either the example ' +
    'is wrong, the feature is broken, or it needs setup beyond names (then add it to ' +
    'GUIDE_NEEDS_RICHER_SETUP with the reason)');
  // the allow-list is a live list, not a dumping ground: an entry that starts working must leave it
  const fixed = [...GUIDE_NEEDS_RICHER_SETUP.keys()].filter(s => !got.failed.some(f => f.syn === s));
  assert.deepEqual(fixed, [],
    'these examples now render with plain provisioning — remove them from GUIDE_NEEDS_RICHER_SETUP');
});

// 16. every / and @ COMMAND the guide shows must open a door whose SELECTED row is the one the pure
// ranking picks. tests/test.mjs pins the ranking itself; this pins the wiring around it, which is a
// separate thing and has broken on its own: #1396 threw away the query the trigger had already
// consumed, so /note filtered on "ote", Quote outranked Note, and Enter turned a scene heading into a
// blockquote. The core was right the whole time — only the seeding was wrong, so nothing that tested
// the core could have seen it.
// Note the door: at the DEFAULT guidance tier checkSlash hides the inline menu and opens the BUILDER,
// so `slashState` is null here and reading it is how a probe silently measures nothing.
test('#1459 every / and @ command the guide teaches selects that command in the builder', { skip: skip() }, async () => {
  const pg = await fresh();
  const cmds = await pg.evaluate(() => {
    const out = new Map();
    for (const e of GUIDE) for (const x of (e.examples || [])) {
      for (const m of String(x.syn || '').matchAll(/(?:^|\s)([/@])([a-z][\w-]*)/gi)) {
        const k = m[1] + m[2].toLowerCase();
        if (!out.has(k)) out.set(k, { entry: e.id, sigil: m[1], cmd: m[2] });
      }
    }
    return [...out.values()];
  });
  assert.ok(cmds.length > 10, `only ${cmds.length} commands found in the guide — the scan broke`);

  // BOTH POSITIONS, and the second is the one that carries the weight. At the start of a point the
  // bare trigger opens the builder on its own and every later keystroke is typed straight into the
  // search box — so the seeding path is never used and re-introducing #1396 leaves a start-only check
  // green (measured: it did). Mid-line the #1108 guard suppresses the bare trigger, the first word
  // character is what opens the door, and that character only reaches the filter by being seeded.
  const bad = [];
  for (const { entry, sigil, cmd } of cmds) {
    for (const prefix of ['', 'Scene ']) {
      await pg.evaluate((prefix) => {
        root.children = [mkNode(prefix)]; buildIndex(root); markDirty(); render();
        const c = document.querySelector('.node-content[data-id]');
        const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
        const r = document.createRange(); r.selectNodeContents(c); r.collapse(false);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      }, prefix);
      await pg.waitForTimeout(120);
      await pg.keyboard.type(sigil + cmd);
      await pg.waitForTimeout(300);
      const seen = await pg.evaluate(([sigil, cmd]) => {
        const rows = [...document.querySelectorAll('.builder-item')];
        const sel = document.querySelector('.builder-item[aria-selected="true"] .cmd-label');
        // what the pure ranking says SHOULD be selected, computed from the same live pool
        const vis = builderFilterCmds(builderCmdPool(sigil), cmd, sigil);
        const pick = vis[builderBestIdx(vis, cmd, sigil)];
        return { rows: rows.length, sel: sel ? sel.textContent.trim() : null, want: pick ? pick.label : null };
      }, [sigil, cmd]);
      // Asserting only "a row is selected" would pass on the #1396 bug — a row is always selected.
      // The claim is that the door and the ranking agree about WHICH one.
      const where = prefix ? 'mid-line' : 'at the start';
      if (!seen.rows) bad.push(`[${entry}] ${sigil}${cmd} ${where} — no door opened`);
      else if (seen.sel !== seen.want)
        bad.push(`[${entry}] ${sigil}${cmd} ${where} — builder selected ${JSON.stringify(seen.sel)}, ranking says ${JSON.stringify(seen.want)}`);
      await pg.keyboard.press('Escape');
      await pg.waitForTimeout(80);
    }
  }
  assert.deepEqual(bad, [],
    'a command the guide teaches opens a door that highlights a different command than the ranking ' +
    'picks, so Enter fires something other than what was typed');
});

// 17. every CONTROL the guide points at must exist, be visible, and still answer to the name the
// guide uses for it.
//
// This closes the last mechanizable slice of the guide. The examples here describe a control rather
// than naming it -- "Toolbar hourglass button", "chip ✕", "Home crumb", "▶ (top left of a base)" --
// so no string in the app matches and every text-based guard was structurally blind to them. The fix
// is data, not cleverness: each such example now carries `ctl`, the control's REAL accessible name,
// and this drives the app to prove that name is still on screen.
//
// Every `ctl` value was measured by driving and reading the live accessible name, never guessed. That
// matters: "Show Week view" and "Include completed points" are nothing a reader of the guide copy
// ("Week", "Done / Running") could have predicted, and a guessed value would have made this guard a
// second source of false accusations rather than a check.
const CTL_UNREACHABLE = new Map([
  ['New document in the folder',
   'the document switcher only exists once a folder is connected, and File System Access is not ' +
   'available to a headless file:// page. The anchor still pins the name; only the driving is absent'],
]);

test('#1460 every control the guide points at is on screen under the name the guide uses', { skip: skip() }, async () => {
  const pg = await fresh();
  const wanted = await pg.evaluate(() =>
    GUIDE.flatMap(e => (e.examples || []).filter(x => x.ctl).map(x => ({ id: e.id, syn: x.syn, ctl: x.ctl }))));
  assert.ok(wanted.length >= 20, `only ${wanted.length} anchored controls found — the scan broke`);

  // Each opener reveals the surface its entry documents. Tried only AFTER a bare look, so a control
  // that is already on screen never depends on one working.
  const OPEN = {
    agenda:   () => openAgenda(),
    timeline: () => openTimeline(),
    // renderGraph offers Nearby only when `graphAnchorId && nodeById(graphAnchorId)` -- "Nearby
    // needs a point to centre on". graphAnchorNow() reads activeContentId, which after an earlier
    // example still names a point from a DOCUMENT THAT NO LONGER EXISTS: non-null, unresolvable,
    // so the scope silently falls back to This document and the button never renders. Putting the
    // caret in a live point is the provisioning, not a workaround.
    'link-graph': () => {
      const c = document.querySelector('.node-content[data-id]');
      const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
      graphAnchorId = null; openGraph();
    },
    hashtags:   () => document.querySelector('#logo-btn').click(),
    tags:       () => document.querySelector('#logo-btn').click(),
    'workspace-search': () => document.querySelector('#logo-btn').click(),
    // #search-save is display:none unless the wrap has focus AND a search is live, so focusing
    // the box is part of revealing it, not incidental setup.
    // #search-save is display:none unless the wrap has focus AND a search is live, so focusing the
    // box is part of revealing it. The two saved-search examples describe OPPOSITE states of the
    // same control, so they cannot share one opener -- keyed by ctl below.
    'Save this search': () => {
      const s = document.getElementById('search-box');
      s.focus(); s.value = 'dragon'; s.dispatchEvent(new Event('input', { bubbles: true }));
    },
    'Forget this search': () => {
      const s = document.getElementById('search-box');
      s.focus(); s.value = 'dragon'; s.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('search-save').click();   // ★ filled is the SAVED state
      s.focus();
    },
    'base-views': () => {
      const n = mkNode('Table'); n.type = 'base';
      n.base = { cols: [{ name: 'A' }, { name: 'B' }], rows: [['1', '2'], ['3', '4']] };
      root.children = [n]; buildIndex(root); markDirty(); render();
    },
    corkboard: () => {
      const n = mkNode('Table'); n.type = 'base';
      n.base = { cols: [{ name: 'A' }, { name: 'B' }], rows: [['1', '2'], ['3', '4']] };
      root.children = [n]; buildIndex(root); markDirty(); render();
    },
    zoom: () => {
      root.children = [mkNode('Parent')]; root.children[0].children = [mkNode('Child')];
      buildIndex(root); markDirty(); render(); zoomTo(root.children[0].id); render();
    },
    backlinks: () => {
      root.children = [mkNode('Parent')]; root.children[0].children = [mkNode('Child')];
      buildIndex(root); markDirty(); render(); zoomTo(root.children[0].id); render();
    },
    'multi-select': () => {
      root.children = [mkNode('One'), mkNode('Two')]; buildIndex(root); markDirty(); render();
      selectedIds = new Set(root.children.map(n => n.id));
      updateNodeSelBar();   // the bar is display:none until this adds .on
      render();
    },
  };

  // STARTS WITH, not contains. `includes` was tried and is vacuous: renaming the Notes button to
  // "Annotations" left this green because the File menu offers "Footnotes", which contains "notes".
  // That is the same substring trap that made the command guard useless, found the same way -- by
  // mutation, not by reading. A prefix still allows the names that are genuinely longer than the
  // anchor ("Show what links to the point you are on, within 2 steps", "Connect a folder…Auto-save
  // every document"), which is why the anchors are prefixes rather than exact strings.
  const look = (ctl) => {
    const nameOf = el => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim();
    return [...document.querySelectorAll('*')].some(el =>
      el.offsetParent !== null && nameOf(el).toLowerCase().startsWith(ctl.toLowerCase()));
  };

  const bad = [], reached = [];
  for (const { id, syn, ctl } of wanted) {
    if (CTL_UNREACHABLE.has(ctl)) continue;
    // Panels and the File menu are toggles, and an earlier example's opener leaves one on. Without
    // this the graph refused to open behind a still-open menu and the guard blamed the GUIDE for it
    // -- a false accusation of exactly the kind it exists to prevent.
    // Panels are toggles and an earlier example's opener leaves one up, so each example starts by
    // closing all three through the app's own close functions. Toggling the toolbar buttons instead
    // does NOT work: those three panels each track their own `…Open` flag, and clicking a button
    // whose aria-pressed has drifted out of step with that flag closes what was never open. Chasing
    // that with retries cost several rounds before the flags were read directly.
    await pg.evaluate(() => {
      closeAgenda(); closeTimeline(); closeGraph();
      // The document state earlier examples leave behind changes what a panel HAS TO SHOW, which is
      // not the same problem as a panel being open. A saved search of "dragon" filters every point
      // away and a live zoom narrows the tree, and the link graph then renders a reduced scope strip
      // with no Nearby button at all -- reported, wrongly, as the guide naming a control that does
      // not exist. Restore the plain document view before looking.
      const sb = document.getElementById('search-box');
      if (sb && sb.value) { sb.value = ''; sb.dispatchEvent(new Event('input', { bubbles: true })); }
      focusedId = null;
      if (typeof selectedIds !== 'undefined') { selectedIds.clear(); updateNodeSelBar(); }
      if (typeof hideSlashMenu === 'function') hideSlashMenu();
      const back = document.getElementById('io-back'); if (back) back.classList.remove('on');
      const card = document.getElementById('io-card'); if (card) card.classList.remove('builder-open');
    });
    await pg.waitForTimeout(150);
    let seen = await pg.evaluate(look, ctl).catch(() => false);
    const open = OPEN[ctl] || OPEN[id];
    if (!seen && open) {
      await pg.evaluate(open);
      await pg.waitForTimeout(600);
      seen = await pg.evaluate(look, ctl).catch(() => false);
    }
    if (seen) reached.push(ctl);
    else bad.push(`[${id}] ${JSON.stringify(syn)} points at a control named ${JSON.stringify(ctl)}, which is nowhere on screen`);
    await pg.keyboard.press('Escape');
    await pg.evaluate(() => { root.children = [mkNode('Parent')]; buildIndex(root); markDirty(); render(); }).catch(() => {});
    await pg.waitForTimeout(120);
  }
  assert.deepEqual(bad, [],
    'the guide points a reader at a control that is not there under that name. Either the control was ' +
    'renamed (update the `ctl` anchor AND the guide copy) or it is gone (drop the example)');
  // the unreachable list is live, not a dumping ground
  const fixed = [...CTL_UNREACHABLE.keys()].filter(c => wanted.some(w => w.ctl === c) === false);
  assert.deepEqual(fixed, [], 'these entries name no anchored control any more — drop them from CTL_UNREACHABLE');
});

// 18. the min/max DEPTH TRAP tip reaches the pill.
// `sum(cost, 2)` is a depth; `min(cost, 2)` is the two-value numeric min and cannot be one, because
// min(a, b) owns that spelling. The capability gap stays open; what closed is the DEAD END, and only
// driving shows whether the tip survives the render. A source pin proves the string exists in the
// file, which is exactly what it proved before #1021 shipped a handler nothing could reach.
test('the min/max depth trap explains itself on the rendered pill', { skip: skip() }, async () => {
  const pg = await fresh();
  const seen = await pg.evaluate(() => {
    const kid = (t, cost) => { const n = mkNode(t); n.props = [{ key: 'cost', val: String(cost) }]; return n; };
    const parent = mkNode('Budget {= min(cost, 2)}');
    parent.children = [kid('a', 10), kid('b', 5)];
    root.children = [parent];
    markDirty(); buildIndex(root, null); promoteLoadedShorthand(root); buildIndex(root, null); render();
    const pill = document.querySelector('.math-err');
    return { found: !!pill, title: pill ? pill.getAttribute('title') : null,
             aria: pill ? pill.getAttribute('aria-label') : null };
  });
  assert.ok(seen.found, 'min(cost, 2) must render the error pill, not a confident number');
  assert.match(seen.title, /word scope, not a depth number/, 'the tip names the trap: ' + seen.title);
  assert.match(seen.title, /min\(cost, subtree\)/, 'and names the door out of it');
  assert.match(seen.aria, /word scope/, 'assistive tech gets the same explanation, not just the glyph');
});

// 19. #1463 — the / builder's block commands must produce the object they promise.
// This is the defect the multi-agent UX drive surfaced, and it is a DRIVEN check by necessity: the
// applier's text was already correct in source, and both failures were about state the source cannot
// show. The prefix strip read `node.type`, which the `/` trigger invalidates (the text is briefly
// "/# Chapter one", which derives to `ul`), and the caret was never placed past the marker it wrote.
// Both announced plain success, so nothing but driving could see them.
test('#1463 a / block command replaces the marker and leaves the caret past it', { skip: skip() }, async () => {
  const pg = await fresh();
  const startEditing = () => pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  const pick = async (name) => {
    await pg.keyboard.type('/', { delay: 25 }); await pg.waitForTimeout(420);
    await pg.keyboard.type(name, { delay: 30 }); await pg.waitForTimeout(380);
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
  };
  const caret = () => pg.evaluate(() => {
    const el = document.activeElement.closest && document.activeElement.closest('.node-content');
    if (!el) return { caret: null };
    const s = getSelection(); if (!s.rangeCount) return { text: el.textContent, caret: null };
    const m = document.createRange(); m.selectNodeContents(el);
    m.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset);
    return { text: el.textContent, caret: m.toString().length };
  });

  // 1. the caret lands past the marker, so the next keystroke is CONTENT and not syntax
  await startEditing();
  await pg.keyboard.type('Shopping', { delay: 15 });
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(250);
  await pick('To-do');
  const c1 = await caret();
  assert.equal(c1.text, '- [ ] ', 'the marker is written');
  assert.equal(c1.caret, 6, `the caret must sit past the marker, not inside it (got ${c1.caret})`);
  await pg.keyboard.type('milk', { delay: 30 }); await pg.waitForTimeout(250);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(400);
  assert.deepEqual(await pg.evaluate(() => root.children.map(n => n.text)), ['Shopping', '- [ ] milk'],
    'typing after the command must extend the to-do, not shred it into "-milk [ ] "');
  assert.ok(await pg.evaluate(() =>
    document.querySelectorAll('#outline input[type=checkbox], #outline .md-task').length > 0),
    'and it renders as a real to-do with a checkbox');

  // 2. markers REPLACE rather than stack, and /Bullet strips whatever is there
  for (const [first, second, want] of [
    ['Heading 1', 'Heading 2', '## Hello'],
    ['Quote', 'Heading 1', '# Hello'],
    ['Heading 1', 'Bullet', 'Hello'],
    ['Quote', 'Bullet', 'Hello'],
    ['Numbered', 'Bullet', 'Hello'],
  ]) {
    await pg.evaluate(() => { root.children = [mkNode('Hello')]; buildIndex(root, null); markDirty(); render(); });
    await pg.waitForTimeout(200);
    await startEditing();
    await pg.keyboard.press('Home'); await pg.waitForTimeout(120);
    await pick(first);
    await pg.keyboard.press('Home'); await pg.waitForTimeout(120);
    await pick(second);
    assert.equal(await pg.evaluate(() => root.children[0].text), want,
      `/${first} then /${second} must land on ${JSON.stringify(want)}, not stack markers`);
  }
});

// 20. #1464 — dismissing a surface must not strand the keyboard.
// Three symptoms of one shape, all driven because all three are about where focus WENT, which a
// source pin cannot see. The worst had no keyboard exit at all: Escape inside a /-command form left
// the full-screen modal up and dropped focus onto the point BEHIND it, so everything typed after
// landed invisibly in the document.
test('#1464 Escape from a command form returns to the builder, not behind it', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.keyboard.type('Anchor', { delay: 15 });
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(220);
  await pg.keyboard.type('/', { delay: 25 }); await pg.waitForTimeout(420);
  await pg.keyboard.type('Dice roll', { delay: 25 }); await pg.waitForTimeout(380);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
  assert.match(await pg.evaluate(() => document.activeElement.id), /io-fld/, 'the form opened with focus in a field');

  await pg.keyboard.press('Escape'); await pg.waitForTimeout(420);
  const back = await pg.evaluate(() => ({
    overlay: getComputedStyle(document.getElementById('io-back')).display,
    active: document.activeElement.className || document.activeElement.tagName,
    rows: root.children.map(n => n.text),
  }));
  // The overlay staying up is CORRECT -- the builder is still open. What must not happen is focus
  // leaving it, which is what made the state unrecoverable.
  assert.match(back.active, /builder-search|guide-search/,
    `Escape must land focus back in the builder, got ${JSON.stringify(back.active)}`);
  await pg.keyboard.type('hello', { delay: 25 }); await pg.waitForTimeout(250);
  assert.deepEqual(await pg.evaluate(() => root.children.map(n => n.text)), back.rows,
    'typing after the dismissal must not fall through into the document beneath the modal');

  // and there IS a way out: a second Escape closes the builder and returns the caret to the point
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(450);
  const out = await pg.evaluate(() => ({
    overlay: getComputedStyle(document.getElementById('io-back')).display,
    active: document.activeElement.className || document.activeElement.tagName,
  }));
  assert.equal(out.overlay, 'none', 'the second Escape closes the builder');
  assert.match(out.active, /node-content/, 'and the caret is back in the point');
});

test('#1464 Enter on Cancel cancels, and Enter on the commit button still commits', { skip: skip() }, async () => {
  const pg = await fresh();
  const openForm = async () => {
    // the first half leaves the builder open; start each half from closed chrome or the `/` is
    // typed into the builder's search box instead of into a point
    await pg.evaluate(() => { if (typeof closeBuilderWindow === 'function') closeBuilderWindow(); });
    await pg.waitForTimeout(200);
    await pg.evaluate(() => {
      root.children = [mkNode('Anchor'), mkNode('')];
      buildIndex(root, null); markDirty(); render();
      const c = document.querySelectorAll('.node-content[data-id]')[1];
      const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
    });
    await pg.waitForTimeout(250);
    await pg.keyboard.type('/', { delay: 25 }); await pg.waitForTimeout(420);
    await pg.keyboard.type('Dice roll', { delay: 25 }); await pg.waitForTimeout(380);
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
    await pg.keyboard.type('3d8', { delay: 30 }); await pg.waitForTimeout(220);
  };
  const tabTo = async (label) => {
    for (let i = 0; i < 6; i++) {
      await pg.keyboard.press('Tab'); await pg.waitForTimeout(160);
      if (await pg.evaluate(l => (document.activeElement.textContent || '').trim() === l, label)) return true;
    }
    return false;
  };

  // Assert on the text the insert actually produces ("{3d8}"), not on a folded [[dice:…]] token:
  // the token form is not what sits in node.text at this moment, so a regex for it would pass the
  // cancel half no matter what happened. Measured, not assumed.
  const hasRoll = () => pg.evaluate(() => root.children.some(n => n.text.includes('3d8')));

  await openForm();
  assert.ok(await tabTo('Cancel'), 'the Cancel button is reachable by Tab');
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
  assert.equal(await hasRoll(), false,
    'Enter on Cancel must CANCEL: it used to run the confirm action and insert the pill');

  await openForm();
  assert.ok(await tabTo('Roll'), 'the commit button is reachable by Tab');
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  assert.equal(await hasRoll(), true,
    'and Enter on the commit button must still commit');
});

test('#1464 Escape closes the agenda the way it closes the graph and the timeline', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => { root.children = [mkNode('Task')]; buildIndex(root, null); markDirty(); render(); });
  await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('#btn-agenda').click());
  await pg.waitForTimeout(600);
  // openAgenda must put focus INSIDE the strip -- the strip's own keydown is what closes it, so
  // leaving focus on the toolbar button made Escape a no-op here while it worked on the other two.
  assert.ok(await pg.evaluate(() => document.getElementById('agenda-strip').contains(document.activeElement)),
    'opening the agenda must move focus into the strip');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(450);
  assert.ok(!(await pg.evaluate(() => document.getElementById('agenda-strip').classList.contains('on'))),
    'Escape must close the agenda strip');
  assert.equal(await pg.evaluate(() => document.activeElement.id), 'btn-agenda',
    'and hand focus back to the button that opened it');
});

// 21. #1465 — the multi-select bar's thirteen actions must have a keyboard door.
// Tab is NOT that door and must not become it: this app's grammar is "plain = text, Tab = depth"
// (ux-discipline §3), and Tab correctly indents the selection instead. The door is the one the graph,
// the timeline and the agenda already use -- the surface moves focus into itself when it appears.
// Every claim below was measured before it was built: focus is on <body> when the bar appears (so
// nothing is taken), Shift+arrows still extend from inside the bar, and Tab still indents.
test('#1465 the selection bar is reachable, announced, and does not steal Tab', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [mkNode('One'), mkNode('Two'), mkNode('Three'), mkNode('Four')];
    buildIndex(root, null); markDirty(); render();
    const c = document.querySelectorAll('.node-content[data-id]')[1];
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.waitForTimeout(250);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
  const st = () => pg.evaluate(() => ({
    n: selectedIds.size,
    active: document.activeElement.id || document.activeElement.tagName,
    inBar: document.getElementById('node-sel-bar').contains(document.activeElement),
    live: (document.getElementById('a11y-live') || {}).textContent || '',
  }));

  await pg.keyboard.press('Shift+ArrowDown'); await pg.waitForTimeout(450);
  const made = await st();
  assert.equal(made.n, 2, 'two points are selected');
  assert.ok(made.inBar, `focus must land in the selection bar, got ${JSON.stringify(made.active)}`);
  assert.match(made.live, /2 points selected/, 'and the selection must be announced, not silent');

  // arrows rove the group (UXP-240's convention), ends clamp via the shared roveIndex
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(220);
  const roved = await st();
  assert.ok(roved.inBar && roved.active !== made.active, 'ArrowRight moves along the bar');
  await pg.keyboard.press('End'); await pg.waitForTimeout(220);
  assert.equal((await st()).active, 'nsb-clear', 'End reaches the last action');

  // Shift+arrows STILL extend from inside the bar, and the count re-announces
  await pg.keyboard.press('Shift+ArrowDown'); await pg.waitForTimeout(380);
  const ext = await st();
  assert.equal(ext.n, 3, 'Shift+arrows still extend the selection from inside the bar');
  assert.match(ext.live, /3 points selected/, 'and the new count is announced');

  // Tab still means DEPTH. This is the regression the fix could have caused and did not.
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(420);
  assert.deepEqual(await pg.evaluate(() => root.children.map(n => n.text)), ['One'],
    'Tab from the bar must still indent the selection, not move focus');
  assert.match((await st()).live, /Indented 3 points/, 'and say so');

  // Escape clears and hands focus back to the outline, not to <body>
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(400);
  const done = await st();
  assert.equal(done.n, 0, 'Escape clears the selection');
  assert.notEqual(done.active, 'BODY', 'and focus returns to the outline rather than going homeless');
});

// 22. #1467 — a base cell must edit its SOURCE, not the internal token.
// Driven because all three claims are about what the cell shows and what survives a focus cycle,
// and the dangerous one is invisible in source: the authored focusout ALWAYS writes the cell back,
// so unfolding without care would re-promote the shorthand and silently re-roll a frozen pill just
// because someone clicked through.
test('#1467 a base cell shows {2d6} on entry and keeps its frozen roll when untouched', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.keyboard.type('/', { delay: 22 }); await pg.waitForTimeout(420);
  await pg.keyboard.type('base', { delay: 25 }); await pg.waitForTimeout(380);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(650);

  const SEL = '.mt-cell[data-r="1"][data-c="0"]';
  const focusCell = () => pg.evaluate((s) => document.querySelector(s).focus(), SEL);
  const blur = () => pg.evaluate(() => document.activeElement.blur());
  const state = () => pg.evaluate((s) => {
    const cell = document.querySelector(s), n = root.children[0];
    return { editText: cell.textContent, shown: cell.innerText.replace(/\n/g, ' '),
             tokens: (n.text.match(/\[\[dice:[a-z0-9]+\]\]/g) || []),
             isPill: !!cell.querySelector('.dice-roll') };
  }, SEL);

  await focusCell(); await pg.waitForTimeout(300);
  await pg.keyboard.type('roll {2d6}', { delay: 30 }); await pg.waitForTimeout(320);
  await blur(); await pg.waitForTimeout(600);
  const made = await state();
  assert.equal(made.tokens.length, 1, 'the typed shorthand promoted to a folded token');
  assert.ok(made.isPill, 'and renders as a pill');

  // 1. entering the cell shows the SOURCE
  await focusCell(); await pg.waitForTimeout(400);
  assert.equal((await state()).editText, 'roll {2d6}',
    'clicking into the cell must show the {2d6} that was typed, never the [[dice:key]] token');

  // 2. leaving it untouched changes nothing -- same token, same roll, still a pill
  await blur(); await pg.waitForTimeout(600);
  const through = await state();
  assert.deepEqual(through.tokens, made.tokens,
    'a click-through must not re-promote: the token (and its frozen roll) has to survive');
  assert.equal(through.shown, made.shown, 'and the shown value must not change');
  assert.ok(through.isPill, 'and it is still a pill, not literal {2d6} text');

  // 3. a REAL edit still re-promotes
  await focusCell(); await pg.waitForTimeout(400);
  await pg.keyboard.press('Control+a'); await pg.waitForTimeout(140);
  await pg.keyboard.type('roll {3d6}', { delay: 30 }); await pg.waitForTimeout(320);
  await blur(); await pg.waitForTimeout(650);
  const edited = await state();
  assert.equal(edited.tokens.length, 1, 'the edit promoted to one token');
  assert.notEqual(edited.tokens[0], made.tokens[0], 'a NEW record, since the expression changed');
  assert.match(edited.shown, /3d6/, 'and the pill now shows 3d6');
});

// 23. #1468 — the first arrow-nav inside a base must not throw focus away.
// Moving focus between cells fires the old cell's focusout, which commits and can REBUILD the whole
// widget. The rebuild replaces the element mtFocusCell just focused, so focus fell to <body> with no
// ring, nothing announced, and everything typed next silently swallowed. Measured before fixing:
// the target cell existed but was a DIFFERENT element and the old host was disconnected.
// Only the FIRST navigation of a session hit it, which is what made it read as a glitch.
test('#1468 arrowing inside a base lands in the cell above and keeps what you type', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.keyboard.type('Shopping list', { delay: 15 });
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(220);
  await pg.keyboard.type('/', { delay: 22 }); await pg.waitForTimeout(420);
  await pg.keyboard.type('base', { delay: 25 }); await pg.waitForTimeout(380);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(650);

  // fill the grid the way a person would, so the first arrow carries a pending commit
  await pg.evaluate(() => document.querySelector('.mt-cell[data-r="0"][data-c="0"]').focus());
  await pg.waitForTimeout(220);
  for (const t of ['Item', 'Cost', 'Qty', 'Rope', '10', '2', 'Torch', '3', '5']) {
    await pg.keyboard.type(t, { delay: 18 });
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(100);
  }
  await pg.evaluate(() => document.activeElement.blur()); await pg.waitForTimeout(600);

  const baseIdx = await pg.evaluate(() => root.children.findIndex(n => n.type === 'base'));
  assert.ok(baseIdx >= 0, 'the base exists');
  const before = await pg.evaluate(i => root.children[i].text, baseIdx);

  await pg.evaluate(() => document.querySelector('.mt-cell[data-r="2"][data-c="1"]').focus());
  await pg.waitForTimeout(300);
  await pg.keyboard.press('ArrowUp'); await pg.waitForTimeout(450);

  const landed = await pg.evaluate(() => {
    const a = document.activeElement;
    return { tag: a.tagName, r: a.dataset ? a.dataset.r : null, c: a.dataset ? a.dataset.c : null,
             ring: !!document.querySelector(':focus-visible') };
  });
  assert.equal(landed.tag, 'TD', `the FIRST ArrowUp must stay in the grid, got ${landed.tag}`);
  assert.equal(landed.r, '1', 'and land one row up');
  assert.equal(landed.c, '1', 'in the same column');
  assert.ok(landed.ring, 'with a visible focus ring, not an invisible <body> focus');

  await pg.keyboard.type('99', { delay: 35 }); await pg.waitForTimeout(400);
  const after = await pg.evaluate(i => root.children[i].text, baseIdx);
  assert.notEqual(after, before, 'what you type after arrowing must reach the model, not vanish');
  assert.match(after, /\b99\b/, 'and be the value you typed');
});

// 24. #1469 — the same column, two commands in one menu, two answers. Calculate → Sum read the
//     Cost column as 10+3+99+100 = 212; Sort → Ascending read it as words and ordered 10, 100,
//     3, 99. A pure test can prove the comparator; only a driven one proves that the MENU the
//     user opens routes both commands to the same reading, with role inference in the path.
test('#1469 Sort and Calculate give the same column the same answer', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.keyboard.type('Kit', { delay: 15 });
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(220);
  await pg.keyboard.type('/', { delay: 22 }); await pg.waitForTimeout(420);
  await pg.keyboard.type('base:5x3', { delay: 25 }); await pg.waitForTimeout(420);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(700);

  // the issue's own grid, typed the way a person types it
  const cells = ['Item', 'Cost', 'Qty', 'Rope', '10', '2', 'Torch', '3', '5',
                 'Anvil', '99', '1', 'Lamp', '100', '7'];
  await pg.evaluate(() => document.querySelector('.mt-cell[data-r="0"][data-c="0"]').focus());
  await pg.waitForTimeout(220);
  for (let i = 0; i < cells.length; i++) {
    await pg.keyboard.type(cells[i], { delay: 12 });
    if (i < cells.length - 1) { await pg.keyboard.press('Tab'); await pg.waitForTimeout(80); }
  }
  await pg.evaluate(() => document.activeElement.blur()); await pg.waitForTimeout(600);

  const baseIdx = await pg.evaluate(() => root.children.findIndex(n => n.type === 'base'));
  assert.ok(baseIdx >= 0, 'the base exists');
  // no role was ever set: this is the un-roled column the issue is about, not a Number column
  assert.equal(await pg.evaluate(i => root.children[i].colRole ? 'set' : 'none', baseIdx), 'none',
    'the repro is a column with NO role, which is where the two commands disagreed');

  // the keyboard door to the column menu, on a Cost cell
  const openColMenu = async () => {
    await pg.evaluate(() => document.querySelector('.mt-cell[data-r="1"][data-c="1"]').focus());
    await pg.waitForTimeout(220);
    await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(350);
  };
  // identity, not existence: exactly one item carries this name, and that is the one we click
  const clickItem = async (label) => {
    const hits = await pg.evaluate(l => [...document.querySelectorAll('#mt-colpanel .mt-col-item')]
      .map((el, k) => [el.querySelector('.mt-col-item-label')?.textContent.trim(), k])
      .filter(([t]) => t === l).map(([, k]) => k), label);
    assert.equal(hits.length, 1, `exactly one menu item named "${label}"`);
    await pg.locator('#mt-colpanel .mt-col-item').nth(hits[0]).click();
    await pg.waitForTimeout(550);
  };

  await openColMenu();
  await clickItem('Sum');
  const total = await pg.evaluate(() => {
    const tot = [...document.querySelectorAll('.mt-total-cell[data-c="1"]')];
    return tot.length === 1 ? tot[0].textContent.trim() : `${tot.length} total cells`;
  });
  assert.equal(total, '212', 'Calculate reads the column as numbers');

  // the menu SAYS which reading it is about to apply -- the issue's aggravator: "Ascending" of what?
  await openColMenu();
  const said = await pg.evaluate(() => {
    const secs = [...document.querySelectorAll('#mt-colpanel .mt-col-section')].map(s => s.textContent.trim());
    const item = l => [...document.querySelectorAll('#mt-colpanel .mt-col-item')]
      .find(i => i.querySelector('.mt-col-item-label')?.textContent.trim() === l);
    return { sortSecs: secs.filter(t => t.startsWith('Sort rows')),
             asc: item('Ascending')?.title, desc: item('Descending')?.title };
  });
  assert.deepEqual(said.sortSecs, ['Sort rows (as numbers)'], 'the section names the reading, once');
  assert.equal(said.asc, 'Smallest number first');
  assert.equal(said.desc, 'Largest number first');

  await clickItem('Ascending');
  const order = await pg.evaluate(() => [...document.querySelectorAll('.mt-cell[data-c="1"]')]
    .filter(el => el.tagName === 'TD' && !el.classList.contains('mt-total-cell'))
    .map(el => el.textContent.trim()).filter(Boolean));
  assert.deepEqual(order, ['3', '10', '99', '100'],
    'and Sort must read the SAME column the same way, not 10 / 100 / 3 / 99');
  // and the confirmation says which reading was applied, not just "ascending"
  const flash = await pg.evaluate(() => document.getElementById('flash-hint')?.textContent.trim() || '');
  assert.match(flash, /Sorted rows by Cost, smallest number first\./, `flash said: ${flash}`);

  // the Item column beside it is words, and it must still sort alphabetically
  await pg.evaluate(() => document.querySelector('.mt-cell[data-r="1"][data-c="0"]').focus());
  await pg.waitForTimeout(220);
  await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(350);
  const saidText = await pg.evaluate(() => {
    const secs = [...document.querySelectorAll('#mt-colpanel .mt-col-section')].map(s => s.textContent.trim());
    const item = l => [...document.querySelectorAll('#mt-colpanel .mt-col-item')]
      .find(i => i.querySelector('.mt-col-item-label')?.textContent.trim() === l);
    return { sortSecs: secs.filter(t => t.startsWith('Sort rows')), asc: item('Ascending')?.title };
  });
  assert.deepEqual(saidText.sortSecs, ['Sort rows (as text)'], 'the words column says so, in the same place');
  assert.equal(saidText.asc, 'A to Z');
  await clickItem('Ascending');
  const names = await pg.evaluate(() => [...document.querySelectorAll('.mt-cell[data-c="0"]')]
    .filter(el => el.tagName === 'TD' && !el.classList.contains('mt-total-cell'))
    .map(el => el.textContent.trim()).filter(Boolean));
  assert.deepEqual(names, ['Anvil', 'Lamp', 'Rope', 'Torch'], 'a text column is untouched by the change');
});

// 25. #1470 — the reported defect, exactly as filed. A footnote marker on a point that has never
//     been focused this session (i.e. every point on a freshly loaded document): Enter on the
//     marker landed the caret in the POINT and the footnote text was typed into the document.
//     Source-pinnable only as far as "activateFnRef calls focus()", which was true the whole time
//     — the branch that calls it never ran, because focus had already left the marker.
test('#1470 Enter on a cold footnote marker writes the footnote, not the point', { skip: skip() }, async () => {
  const pg = await fresh();
  // Build the document from the model and never touch a point: "cold" is the whole bug.
  await pg.evaluate(() => {
    root.children = [mkNode('Interview with Rosa[^src]')];
    root.children[0].type = 'ul';
    buildIndex(root); markDirty(); render();
  });
  await pg.waitForTimeout(400);
  const marker = await pg.evaluate(() => {
    const el = document.querySelector('.node-content .fn-ref');
    return el ? { name: el.getAttribute('aria-label'), editable: el.isContentEditable } : null;
  });
  assert.ok(marker, 'the marker rendered');
  assert.match(marker.name, /^Footnote 1, not written yet/, 'and says what activating it will do');
  assert.equal(marker.editable, false, 'an atomic island: the editing host must not swallow it');

  // focus it the way assistive tech does, then activate it
  await pg.evaluate(() => document.querySelector('.node-content .fn-ref').focus());
  await pg.waitForTimeout(200);
  assert.equal(await pg.evaluate(() => document.activeElement.className.split(' ')[0]), 'fn-ref',
    'the marker holds focus before the key');
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  const landed = await pg.evaluate(() => ({
    ae: document.activeElement.tagName + '.' + String(document.activeElement.className || '').split(' ')[0],
    panelOn: document.getElementById('fn-panel')?.classList.contains('on'),
    points: root.children.length,
  }));
  assert.equal(landed.ae, 'DIV.fn-content', 'the caret lands in the footnote body, as the name promises');
  assert.ok(landed.panelOn, 'with the Footnotes panel open around it');
  assert.equal(landed.points, 1, 'and Enter did NOT split the point');

  await pg.keyboard.type('Rosa M., interview.', { delay: 12 });
  await pg.waitForTimeout(450);
  const wrote = await pg.evaluate(() => ({
    point: root.children[0].text,
    notes: (root.footnotes || []).map(f => f.text),
  }));
  assert.equal(wrote.point, 'Interview with Rosa[^src]', 'the point is untouched by what you typed');
  assert.deepEqual(wrote.notes, ['Rosa M., interview.'], 'and the footnote holds it');
  await pg.close();
});

// 26. #1470 — the family, because .fn-ref was one of NINE. Every focusable control rendered inside
//     a point's contenteditable must be an atomic island, or the editing host swallows focus on the
//     first keystroke and Enter reaches the outline handler that splits the point. This census is
//     discovered from the DOM, not from a list, so a control added later is covered by seeding it.
test('#1470 every focusable control inside a point is an atomic island', { skip: skip() }, async () => {
  // One seed carrying the whole family, reused per member below.
  const seedFamily = () => {
    const lines = [
      'Interview with Rosa[^src]', 'A {2d6} roll here', 'Sum is {= 2 + 2}',
      '{rule Loot: gold | silver}', 'Pick {Loot}', '{markov: a→b, b→c}', 'Est {5 to 10} days',
      '{hp := 9}', 'Hit {hp -= 1}', '{seq Flow: TODO DOING | DONE}', '#TODO [#A] Urgent thing',
      'Progress [o 0/3] here', 'Tagged #alpha here', '- [ ] a task item', '>! a hidden secret',
      '{meter: nosuch/10}',
    ];
    root.children = [];
    for (const t of lines) { const n = mkNode(t); n.type = 'ul'; root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root); }
    if (typeof promoteLoadedShorthand === 'function') promoteLoadedShorthand(root);
    buildIndex(root, null); markDirty(); render();
  };
  const pg = await fresh();
  await pg.evaluate(seedFamily);
  await pg.waitForTimeout(600);

  const found = await pg.evaluate(() => {
    const out = [];
    for (const c of document.querySelectorAll('.node-content')) {
      for (const el of c.querySelectorAll('[tabindex="-1"], input, a[href], [role="button"], [role="link"]')) {
        out.push({ cls: String(el.className || el.tagName).split(' ')[0], editable: el.isContentEditable });
      }
    }
    return out;
  });
  assert.ok(found.length >= 12, `the seed must actually render the family, got ${found.length}`);
  const swallowed = found.filter(f => f.editable).map(f => f.cls);
  assert.deepEqual([...new Set(swallowed)], [],
    'a focusable control the editing host can swallow loses its keyboard twin on a cold point');
  // and the ones the issue is about are genuinely among them, not an empty sweep
  const seen = new Set(found.map(f => f.cls));
  for (const need of ['fn-ref', 'clock', 'act-pill', 'hashtag', 'md-task-check', 'md-spoiler', 'todo-state', 'meter'])
    assert.ok(seen.has(need), `${need} must be in the census, not silently absent from the seed`);

  await pg.close();

  // Enter on each named member: none of them may reach the outline's split handler. A FRESH PAGE
  // per member, and this is not caution -- "cold" is the bug's precondition. Reusing one page made
  // .act-pill and .hashtag pass while they were broken, because activating the first member gives
  // the editing host a selection and the retarget stops happening. Re-rendering is not enough;
  // that state is the document's, not the element's.
  const MEMBERS = ['.fn-ref', '.clock:not(.clock-computed)', '.act-pill', '.hashtag',
                   '.md-task-check', '.md-spoiler', '.todo-state', '.todo-prio', '.meter.meter-bad'];
  for (const sel of MEMBERS) {
    const p2 = await fresh();
    await p2.evaluate(seedFamily);
    await p2.waitForTimeout(500);
    const before = await p2.evaluate(() => root.children.length);
    const ok = await p2.evaluate(s => {
      const el = document.querySelector('.node-content ' + s);
      if (!el) return false;
      el.focus(); return document.activeElement === el;
    }, sel);
    assert.ok(ok, `${sel} must be focusable for this to measure anything`);
    await p2.keyboard.press('Enter'); await p2.waitForTimeout(380);
    const after = await p2.evaluate(() => ({ n: root.children.length,
      ae: document.activeElement.tagName + '.' + String(document.activeElement.className || '').split(' ')[0] }));
    assert.equal(after.n, before, `Enter on ${sel} split the point instead of activating it (${after.ae})`);
    await p2.close();
  }
});

// 27. #1470 — the two members whose fix was a missing keyboard twin rather than the island
//     attribute, and the one that needed nothing. Driven because "the branch exists" is exactly
//     the claim that was already true and already useless for .fn-ref.
test('#1470 the task checkbox answers Enter, the meter says why, the link still follows', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [];
    for (const t of ['- [ ] a task item', '{meter: nosuch/10}', 'Target point', 'PLACEHOLDER']) {
      const n = mkNode(t); n.type = 'ul'; root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root);
    }
    root.children[3].text = 'See [[#' + root.children[2].id + ']]';
    if (typeof promoteLoadedShorthand === 'function') promoteLoadedShorthand(root);
    buildIndex(root, null); markDirty(); render();
  });
  await pg.waitForTimeout(500);

  // Enter toggles the box the way Space always did, and focus stays on the box you ticked
  await pg.evaluate(() => document.querySelector('.md-task-check').focus());
  await pg.waitForTimeout(180);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
  let r = await pg.evaluate(() => ({ text: root.children[0].text,
    checked: document.querySelector('.md-task-check')?.checked,
    ae: document.activeElement.className.split(' ')[0] }));
  assert.equal(r.text, '- [x] a task item', 'Enter writes the tick through to the point');
  assert.equal(r.checked, true, 'and the box shows it');
  assert.equal(r.ae, 'md-task-check', 'and you are still standing on the box');
  // Space keeps its native path and lands the same way (one write, not two)
  await pg.keyboard.press('Space'); await pg.waitForTimeout(450);
  r = await pg.evaluate(() => ({ text: root.children[0].text, ae: document.activeElement.className.split(' ')[0] }));
  assert.equal(r.text, '- [ ] a task item', 'Space still toggles, exactly once');
  assert.equal(r.ae, 'md-task-check', 'and also keeps focus');

  // the meter is a diagnostic: the key does nothing to the document and is not silent
  await pg.evaluate(() => { document.querySelector('.meter-bad').focus(); const a = document.getElementById('a11y-live'); if (a) a.textContent = ''; });
  await pg.waitForTimeout(180);
  const nBefore = await pg.evaluate(() => root.children.length);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(400);
  const m = await pg.evaluate(() => ({ n: root.children.length,
    ae: document.activeElement.className.split(' ')[0],
    said: (document.getElementById('a11y-live')?.textContent || '').trim() }));
  assert.equal(m.n, nBefore, 'Enter on a meter must not split the point');
  assert.equal(m.ae, 'meter', 'and must not throw focus away');
  assert.match(m.said, /[Mm]eter/, 'and says why it has no value rather than nothing (P4)');

  // the link needed no change: it was already an island, and Enter follows it
  await pg.evaluate(() => document.querySelector('.node-content .node-link').focus());
  await pg.waitForTimeout(180);
  const target = await pg.evaluate(() => root.children[2].id);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(600);
  assert.equal(await pg.evaluate(() => focusedId), target,
    'the negative case: the link was never broken and still zooms to its target');
  await pg.close();
});

// 28. #1471 — the shortcut the app's own SHORTCUTS panel advertises did nothing at all, silently,
//     on a plain point, which is the point most people try it on first. Driven because the whole
//     defect is "the key reaches the page and is ignored": a source pin on the handler was green
//     throughout, and what is being asserted here is the caret, the text and the announcement.
test('#1471 Ctrl+Shift+X makes a to-do, ticks it, and says so every time', { skip: skip() }, async () => {
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('Buy milk', { delay: 12 });
  await pg.waitForTimeout(250);
  // caret parked mid-word, so the marker must not drag it out of position
  await pg.evaluate(() => { setCaretByOffset(document.querySelector('.node-content[data-editing]'), 3);
    const a = document.getElementById('a11y-live'); if (a) a.textContent = ''; });
  await pg.waitForTimeout(150);

  const press = async () => {
    await pg.keyboard.press('Control+Shift+X'); await pg.waitForTimeout(420);
    return pg.evaluate(() => ({ text: root.children[0].text,
      said: (document.getElementById('a11y-live')?.textContent || '').trim() }));
  };
  let r = await press();
  assert.equal(r.text, '- [ ] Buy milk', 'a plain point becomes a to-do, which is what the label promises');
  assert.equal(r.said, 'Turned into a to-do', 'and it is not silent about it');
  // the caret rode along with the words: typing lands where it was, not at the marker
  await pg.keyboard.type('X', { delay: 12 }); await pg.waitForTimeout(300);
  assert.equal(await pg.evaluate(() => root.children[0].text), '- [ ] BuyX milk',
    'the caret stays where the words are, not stranded inside the marker');
  await pg.evaluate(() => { root.children[0].text = '- [ ] Buy milk';
    const c = document.querySelector('.node-content[data-editing]');
    c.innerHTML = editModeHTML(root.children[0]); setCaretByOffset(c, 8); });
  await pg.waitForTimeout(200);

  r = await press();
  assert.equal(r.text, '- [x] Buy milk', 'an unchecked box ticks');
  assert.equal(r.said, 'To-do checked');
  r = await press();
  assert.equal(r.text, '- [ ] Buy milk', 'a ticked box un-ticks');
  assert.equal(r.said, 'To-do unchecked');
  assert.notEqual(r.text, 'Buy milk', 'and the marker is never removed: that is the edit bar button');
  await pg.close();
});

// 29. #1471 — the same key from the cursor state (not editing), and the two refusals in the family.
//     Both entry paths must answer the key the same way (P1), and no branch may be silent (P4).
test('#1471 the cursor-state path agrees, and the refusals name their remedy', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [mkNode('Buy milk'), mkNode('#TODO Call Rosa'), mkNode('Plain again')];
    for (const n of root.children) { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); }
    if (typeof promoteLoadedShorthand === 'function') promoteLoadedShorthand(root);
    buildIndex(root, null); markDirty(); render();
  });
  await pg.waitForTimeout(400);

  // standing on a point without editing it
  const stand = async (i) => {
    await pg.evaluate(n => {
      const c = [...document.querySelectorAll('.node-content')][n];
      selFocusId = selAnchorId = c.dataset.id; activeContentId = null;
      const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
    }, i);
    await pg.waitForTimeout(180);
  };
  const say = () => pg.evaluate(() => (document.getElementById('a11y-live')?.textContent || '').trim());

  await stand(0);
  await pg.keyboard.press('Control+Shift+X'); await pg.waitForTimeout(450);
  assert.equal(await pg.evaluate(() => root.children[0].text), '- [ ] Buy milk',
    'standing on a point answers the key the same way editing it does');
  assert.equal(await say(), 'Turned into a to-do');
  const shape = await pg.evaluate(() => ({ type: root.children[0].type, checked: root.children[0].checked }));
  assert.equal(shape.type, 'todo', 'and the derived hints follow the text');
  assert.equal(shape.checked, false);

  // a keyword to-do is already a to-do: refuse, and name the key that owns that form
  await stand(1);
  await pg.keyboard.press('Control+Shift+X'); await pg.waitForTimeout(450);
  assert.equal(await pg.evaluate(() => root.children[1].text), '#TODO Call Rosa', 'left alone');
  assert.match(await say(), /already uses a keyword.*Shift\+S/, 'and told why, with the remedy');

  // the sibling that was silent for the same reason: a priority needs a state to hang off
  await pg.evaluate(() => {
    const c = [...document.querySelectorAll('.node-content')][2];
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
    const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
  });
  await pg.waitForTimeout(200);
  await pg.keyboard.press('Control+Shift+P'); await pg.waitForTimeout(450);
  assert.equal(await pg.evaluate(() => root.children[2].text), 'Plain again', 'nothing to prioritise');
  assert.match(await say(), /priority needs a state.*Shift\+S/, 'and it says so rather than nothing');
  await pg.close();
});

// 30. #1472 — typing a command's whole name pre-selected a DIFFERENT command, and Enter then did
//     something unrelated: `Variable` selected `Variables panel` (a side-panel toggle whose id
//     starts with the word) and opened a panel instead of declaring a variable. Driven because the
//     claim is about what `.builder-item.active` is and what Enter does to the point, neither of
//     which a source pin can see.
test('#1472 typing a command name selects that command, and Enter runs it', { skip: skip() }, async () => {
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('HP ', { delay: 14 });
  await pg.waitForTimeout(200);
  await pg.keyboard.type('/', { delay: 20 }); await pg.waitForTimeout(450);
  await pg.keyboard.type('Variable', { delay: 22 }); await pg.waitForTimeout(500);

  const menu = await pg.evaluate(() => {
    const items = [...document.querySelectorAll('.builder-item')];
    const name = el => (el.querySelector('.cmd-label')?.innerText || '').trim();
    const act = items.filter(i => i.classList.contains('active'));
    return { labels: items.map(name), active: act.length === 1 ? name(act[0]) : `${act.length} active`,
             ariaSelected: items.filter(i => i.getAttribute('aria-selected') === 'true').map(name) };
  });
  assert.ok(menu.labels.length > 1, `the menu must be offering a choice, got ${JSON.stringify(menu.labels)}`);
  assert.ok(menu.labels.includes('Variables panel'),
    'precondition: the command that used to win is still on offer, so this cannot pass by it vanishing');
  assert.equal(menu.active, 'Variable',
    `the exactly-named command must be pre-selected, offered ${JSON.stringify(menu.labels)}`);
  assert.deepEqual(menu.ariaSelected, ['Variable'],
    'and the selection a screen reader hears is the same one, not just the painted highlight');

  // and Enter must run THAT command: a variable dialog, not the side panel
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(700);
  const after = await pg.evaluate(() => ({
    varPanelOpen: !!document.getElementById('var-panel')?.classList.contains('on'),
    dialogOpen: !!document.querySelector('#io-card.on, #io-card:not([hidden])'),
    text: root.children[0].text,
  }));
  assert.equal(after.varPanelOpen, false, 'Enter must not open the Variables side panel');
  assert.ok(!/\/Variable/i.test(after.text), 'and must not leave the typed command sitting in the point');
  await pg.close();
});

// 31. #1473 — two panels appear as a side effect of moving the caret, and a screen-reader user was
//     never told. Both exposed role=null and no name, reading as bare `generic` nodes, while their
//     six sibling docked panels all carried a role and a label. Driven because the claim is about
//     the accessibility tree and the live region, neither of which a source pin can see.
test('#1473 the docked strips are named, and say so when they appear', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const mk = t => { const n = mkNode(t); n.type = 'ul'; return n; };
    root.children = [mk('Claim[^a] and[^b] and[^c]'), mk('Plain point'), mk('Target'), mk('PH')];
    root.children[3].text = 'See [[#' + root.children[2].id + ']]';
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    if (typeof promoteLoadedShorthand === 'function') promoteLoadedShorthand(root);
    buildIndex(root, null); markDirty(); render();
  });
  await pg.waitForTimeout(450);

  const sentinel = () => pg.evaluate(() => { document.getElementById('a11y-live').textContent = 'SENTINEL'; });
  const said = () => pg.evaluate(() => (document.getElementById('a11y-live').textContent || '').trim());
  const caretTo = (i) => pg.evaluate(n => {
    const c = [...document.querySelectorAll('.node-content')][n];
    const node = nodeById(c.dataset.id); enterEdit(c, node); c.focus(); activeContentId = node.id;
    updateFnPanel(node); updateBlPanel(node.id);
  }, i);
  const named = (sel) => pg.evaluate(s => {
    const el = document.querySelector(s), lb = el.getAttribute('aria-labelledby');
    return { role: el.getAttribute('role'),
             name: el.getAttribute('aria-label') || (lb ? (document.getElementById(lb)?.textContent || '').trim() : null),
             open: el.classList.contains('on'),
             focusInside: !!(document.activeElement && el.contains(document.activeElement)) };
  }, sel);

  // the footnote strip: appears because the caret moved, so the caret must stay put AND it must speak
  await sentinel(); await caretTo(0); await pg.waitForTimeout(600);
  let p = await named('#fn-panel');
  assert.ok(p.open, 'the footnote strip is showing');
  assert.equal(p.role, 'region', 'it has a role, not a bare generic node');
  assert.equal(p.name, 'Footnotes · 3', 'and a name, taken from its own header');
  assert.equal(p.focusInside, false, 'the caret stays in the point: that is why it has to speak');
  assert.equal(await said(), 'Footnotes, 3', 'and it says its own header, with the dot spoken as a pause');

  // it must not repeat itself on every caret move within the same point
  await sentinel(); await caretTo(0); await pg.waitForTimeout(500);
  assert.equal(await said(), 'SENTINEL', 're-announcing on every caret move would make the strip unusable');

  // the backlinks strip, same treatment
  await sentinel(); await caretTo(2); await pg.waitForTimeout(700);
  p = await named('#bl-panel');
  assert.ok(p.open, 'the backlinks strip is showing');
  assert.equal(p.role, 'region');
  assert.equal(p.name, 'Linked from · 1');
  assert.equal(p.focusInside, false);
  assert.equal(await said(), 'Linked from, 1');

  // leaving and returning is news again, or the second appearance would be silent
  await sentinel(); await caretTo(1); await pg.waitForTimeout(600);
  await sentinel(); await caretTo(0); await pg.waitForTimeout(600);
  assert.equal(await said(), 'Footnotes, 3', 'a strip that hid and came back must speak again');

  // the negative case, measured: a panel the user ASKS for and that takes focus is announced by
  // that focus move, and must NOT also speak here or every open double-speaks.
  for (const [opener, sel] of [['openGraph()', '#graph-panel'], ['openTimeline()', '#timeline-panel'],
                               ['openAgenda()', '#agenda-strip']]) {
    const p2 = await fresh();
    await p2.evaluate(() => { root.children = [mkNode('a'), mkNode('b')];
      root.children.forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
      buildIndex(root, null); markDirty(); render(); });
    await p2.waitForTimeout(300);
    await p2.evaluate(() => { document.getElementById('a11y-live').textContent = 'SENTINEL'; });
    // The opener is interpolated into the evaluated SOURCE, never eval()'d inside the page: the
    // app ships a CSP without unsafe-eval, and a swallowed CSP error here would leave the panel
    // shut and the assertions measuring nothing.
    await p2.evaluate('(async () => { ' + opener + ' })()');
    await p2.waitForTimeout(600);
    const st = await p2.evaluate(s => {
      const el = document.querySelector(s);
      return { focusInside: !!(document.activeElement && el && el.contains(document.activeElement)),
               said: (document.getElementById('a11y-live').textContent || '').trim() };
    }, sel);
    assert.equal(st.focusInside, true, `${sel} takes focus, which is what announces it`);
    assert.equal(st.said, 'SENTINEL', `${sel} must not ALSO speak, or every open double-speaks`);
    await p2.close();
  }
  await pg.close();
});

// 32. #1474 — typing until the builder's list emptied announced nothing, so the live region kept
//     naming a command that was no longer in the list, over an empty list where Enter does nothing.
//     Driven because the claim is about WHEN the live region changes, which a source pin cannot see:
//     the transition must speak, the next keystroke at zero must not, and recovery must speak again.
test('#1474 the builder says when the list empties, once, and speaks again on recovery', { skip: skip() }, async () => {
  for (const trig of ['/', '@']) {
    const pg = await fresh();
    await blankWithCaret(pg);
    // record every value the live region is ever set to, so a re-announce of the SAME sentence is
    // visible: announce() clears and re-sets, so reading the final value would hide a stutter.
    await pg.evaluate(() => {
      window.__spoken = [];
      const el = document.getElementById('a11y-live');
      new MutationObserver(() => { const t = (el.textContent || '').trim(); if (t) window.__spoken.push(t); })
        .observe(el, { childList: true, characterData: true, subtree: true });
    });
    const drain = async () => { await pg.waitForTimeout(420);
      return pg.evaluate(() => { const s = window.__spoken.slice(); window.__spoken.length = 0; return s; }); };
    const items = () => pg.evaluate(() => document.querySelectorAll('.builder-item').length);

    await pg.keyboard.type(trig, { delay: 20 }); await pg.waitForTimeout(500);
    assert.deepEqual(await drain(), [], `${trig}: opening the builder must not announce a command nobody chose`);

    await pg.keyboard.press('q'); const matched = await drain();
    assert.ok(await items() > 0, `${trig}: precondition, q matches something`);
    assert.equal(matched.length, 1, `${trig}: a match names the selected command`);

    await pg.keyboard.press('q'); await pg.keyboard.press('q');
    const emptied = await drain();
    assert.equal(await items(), 0, `${trig}: precondition, the list is now empty`);
    assert.equal(await pg.evaluate(() => (document.querySelector('.builder-no-results')?.textContent || '').trim()),
      'No commands match your search.', 'the empty state is on screen');
    assert.deepEqual(emptied, ['No commands match your search.'],
      `${trig}: the list emptying is announced, in the words already on screen`);

    await pg.keyboard.press('q');
    assert.deepEqual(await drain(), [],
      `${trig}: still empty is not news; repeating it would stutter on every keystroke`);

    // three back: qqqq -> qqq -> qq are all still empty, and only qq -> q matches again
    await pg.keyboard.press('Backspace'); await pg.keyboard.press('Backspace'); await pg.keyboard.press('Backspace');
    const back = await drain();
    assert.ok(await items() > 0, `${trig}: precondition, backspacing matches again`);
    assert.equal(back.length, 1, `${trig}: recovery names the command that is selected again`);
    assert.ok(!/No commands/.test(back[0]), `${trig}: and is not the empty sentence`);
    await pg.close();
  }
});

// 33. #1475 — the Alignment section reported a state the grid was not in: after Show as > Number
//     the cells render right-aligned and the menu still ticked "Left". Driven because the claim is
//     that a computed style and a menu tick disagree, which no source pin can compare.
test('#1475 the Alignment tick says what the cells are doing, and the way back exists', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const rows = ['| Item | Cost | Qty |', '| --- | --- | --- |',
                  '| Rope | 10 | 2 |', '| Torch | 3 | 5 |', '| Anvil | 99 | 1 |'];
    const n = mkNode(rows.join('\n')); n.type = 'base';
    root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
    buildIndex(root, null); markDirty(); render();
  });
  await pg.waitForTimeout(500);

  const openMenu = async () => {
    await pg.evaluate(() => document.querySelector('.mt-cell[data-r="1"][data-c="1"]').focus());
    await pg.waitForTimeout(200);
    await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(400);
  };
  // the Alignment rows only, read between its header and the next one
  const alignRows = () => pg.evaluate(() => {
    const all = [...document.querySelectorAll('#mt-colpanel > *')];
    const start = all.findIndex(e => e.classList.contains('mt-col-section') && e.textContent.trim() === 'Alignment');
    const out = [];
    for (let i = start + 1; i < all.length && !all[i].classList.contains('mt-col-section'); i++)
      out.push({ label: (all[i].querySelector('.mt-col-item-label')?.textContent || '').trim(),
                 ticked: all[i].classList.contains('on') });
    return out;
  });
  const ticked = async () => (await alignRows()).filter(r => r.ticked).map(r => r.label);
  const cells = () => pg.evaluate(() => [...document.querySelectorAll('.mt-cell[data-c="1"]')]
    .filter(e => e.tagName === 'TD').map(e => getComputedStyle(e).textAlign));
  const clickItem = async (label) => {
    const idx = await pg.evaluate(l => [...document.querySelectorAll('#mt-colpanel .mt-col-item')]
      .findIndex(i => i.querySelector('.mt-col-item-label')?.textContent.trim() === l), label);
    assert.ok(idx >= 0, `the menu must offer "${label}"`);
    await pg.locator('#mt-colpanel .mt-col-item').nth(idx).click();
    await pg.waitForTimeout(550);
  };
  // "start" is how Chromium reports an unstyled cell; treat it as left
  const isRight = (a) => a.every(x => x === 'right');
  const isLeft = (a) => a.every(x => x === 'left' || x === 'start');

  await openMenu();
  assert.deepEqual(await ticked(), ['Automatic (left)'], 'a fresh column is on its automatic setting');
  assert.ok(isLeft(await cells()), 'and renders left');

  await clickItem('Number');
  await openMenu();
  assert.ok(isRight(await cells()), 'Show as Number right-aligns the cells');
  assert.deepEqual(await ticked(), ['Automatic (right)'],
    'and the tick follows: this is the row that used to read "Left" over right-aligned cells');

  await clickItem('Left');
  await openMenu();
  assert.ok(isLeft(await cells()), 'an explicit Left still works');
  assert.deepEqual(await ticked(), ['Left']);
  const back = (await alignRows()).find(r => r.label.startsWith('Automatic'));
  assert.ok(back, 'and the automatic row is still offered: that is the route back');

  await clickItem(back.label);
  await openMenu();
  assert.ok(isRight(await cells()), 'which returns the column to what it was a moment earlier');
  assert.deepEqual(await ticked(), ['Automatic (right)']);
  // and it is genuinely the UNSET state in the text, not a third explicit value
  assert.match(await pg.evaluate(() => root.children[0].text.split('\n')[1]), /^\| --- \| --- \| --- \|$/,
    'automatic writes no alignment marker at all');
  await pg.close();
});

// 34. #1466 — a trigger that opens LATE seeds the search box with the character that opened it, so
//     those characters lived in two places at once, and Escape wrote both: `Roll @` + `d` + `ice`
//     came back as `Roll @ddice`, saved, with no warning. Driven because the defect is in what
//     reaches node.text after a real dismissal.
test('#1466 dismissing a late-opening trigger writes what was typed, once', { skip: skip() }, async () => {
  // Both doors. The report called `/` immune; it is immune only AT THE START of a point, where a
  // bare trigger opens on its own and nothing is seeded.
  for (const [trig, word] of [['@', 'dice'], ['/', 'head']]) {
    const pg = await fresh();
    await blankWithCaret(pg);
    await pg.keyboard.type('Roll ', { delay: 14 }); await pg.waitForTimeout(200);
    await pg.keyboard.type(trig, { delay: 20 }); await pg.waitForTimeout(400);
    assert.equal(await pg.evaluate(() => !!document.querySelector('.builder-search')), false,
      `${trig}: precondition, a bare trigger mid-text is punctuation until a word character follows`);

    await pg.keyboard.type(word[0], { delay: 30 }); await pg.waitForTimeout(500);
    const opened = await pg.evaluate(() => ({ box: document.querySelector('.builder-search')?.value ?? null,
                                              text: root.children[0].text }));
    assert.equal(opened.box, word[0], `${trig}: precondition, the box is seeded with the character that opened it`);
    assert.equal(opened.text, 'Roll ' + trig + word[0],
      `${trig}: precondition, the point holds that character too — which is the whole bug`);

    await pg.keyboard.type(word.slice(1), { delay: 30 }); await pg.waitForTimeout(400);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(650);
    assert.equal(await pg.evaluate(() => root.children[0].text), 'Roll ' + trig + word,
      `${trig}: the character that opened the palette must be counted once`);
    await pg.close();
  }

  // and the box is authoritative: editing it away from the seed leaves no stale character behind
  const pg = await fresh();
  await blankWithCaret(pg);
  await pg.keyboard.type('Roll @d', { delay: 30 }); await pg.waitForTimeout(550);
  assert.ok(await pg.evaluate(() => !!document.querySelector('.builder-search')), 'the palette is open');
  await pg.keyboard.press('Backspace');
  await pg.keyboard.type('note', { delay: 30 }); await pg.waitForTimeout(400);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(650);
  assert.equal(await pg.evaluate(() => root.children[0].text), 'Roll @note',
    'backspacing the seed in the box removes it from the point too');
  await pg.close();
});

// 35. #1464 B3/B5/B6 — where focus goes when a surface closes or acts. Driven, and driven as
//     CENSUSES rather than the issue's samples: it named two menu rows that lost focus and there
//     were eleven, and named Schedule against Check and Aliases while all nine forms lost the
//     caret through the point menu. No source pin can see any of it.
test('#1464 every point-actions row leaves focus somewhere usable', { skip: skip() }, async () => {
  const seed = async (pg) => {
    await pg.evaluate(() => {
      const mk = t => { const n = mkNode(t); n.type = 'ul'; return n; };
      root.children = [mk('Damage {2d6} to the orc'), mk('Second point'), mk('Third point')];
      root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
      if (typeof promoteLoadedShorthand === 'function') promoteLoadedShorthand(root);
      buildIndex(root, null); markDirty(); render();
      const c = document.querySelectorAll('.node-content')[0]; c.focus(); activeContentId = c.dataset.id;
    });
    await pg.waitForTimeout(320);
    await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(450);
  };
  const first = await fresh();
  await seed(first);
  const labels = await first.evaluate(() => [...document.querySelectorAll('#bpop .bpop-type, #bpop .cmd-item')]
    .map(e => (e.innerText || '').split('\n')[0].trim()));
  assert.ok(labels.length >= 20, `the census must cover the real menu, found ${labels.length} rows`);
  await first.close();

  const lost = [];
  for (let i = 0; i < labels.length; i++) {
    const pg = await fresh();
    await seed(pg);
    const ok = await pg.evaluate(n => {
      const el = [...document.querySelectorAll('#bpop .bpop-type, #bpop .cmd-item')][n];
      if (!el) return false; el.focus(); return document.activeElement === el;
    }, i);
    if (!ok) { await pg.close(); continue; }
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(600);
    const ae = await pg.evaluate(() => document.activeElement.tagName);
    if (ae === 'BODY') lost.push(labels[i] || `row ${i}`);
    await pg.close();
  }
  assert.deepEqual(lost, [],
    'a row that acts and drops focus on <body> leaves the keyboard with nowhere to go');
});

test('#1464 B3/B5: forms hand the caret back, and Tab stays in the menu', { skip: skip() }, async () => {
  // B3 — every form the point menu opens, dismissed with Escape
  for (const label of ['Set dates', 'Add check', 'Add alias', 'Add property', 'Refile…']) {
    const pg = await fresh();
    await pg.evaluate(() => {
      const mk = t => { const n = mkNode(t); n.type = 'ul'; return n; };
      root.children = [mk('Damage {2d6} to the orc'), mk('Second')];
      root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
      if (typeof promoteLoadedShorthand === 'function') promoteLoadedShorthand(root);
      buildIndex(root, null); markDirty(); render();
      const c = document.querySelectorAll('.node-content')[0]; c.focus(); activeContentId = c.dataset.id;
    });
    await pg.waitForTimeout(320);
    await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(450);
    const i = await pg.evaluate(l => [...document.querySelectorAll('#bpop .bpop-type, #bpop .cmd-item')]
      .findIndex(e => (e.innerText || '').split('\n')[0].trim() === l), label);
    assert.ok(i >= 0, `the menu must offer "${label}"`);
    await pg.evaluate(n => [...document.querySelectorAll('#bpop .bpop-type, #bpop .cmd-item')][n].focus(), i);
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(700);
    assert.notEqual(await pg.evaluate(() => document.activeElement.tagName), 'BODY',
      `${label}: precondition, the form takes focus when it opens`);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(700);
    assert.equal(await pg.evaluate(() => document.activeElement.className.includes('node-content')), true,
      `${label}: Escape must hand the caret back to the point, not to <body>`);
    await pg.close();
  }

  // B3 through the OTHER door: `/` verbs whose dialog opens after the builder is gone. Only the
  // commands that actually open a form belong here -- /Property and /Repeat write an inline stub
  // and leave the caret in the point, so Escape there means "stop editing", which lands on <body>
  // for every ordinary edit in the app and is not this defect. Measured against that baseline
  // before being excluded, rather than assumed.
  for (const cmd of ['Schedule', 'Check', 'Aliases', 'Refile']) {
    const p3 = await fresh();
    await blankWithCaret(p3);
    await p3.keyboard.type('Buy milk', { delay: 12 }); await p3.waitForTimeout(200);
    await p3.keyboard.press('Home'); await p3.waitForTimeout(150);
    await p3.keyboard.type('/', { delay: 20 }); await p3.waitForTimeout(450);
    await p3.keyboard.type(cmd, { delay: 25 }); await p3.waitForTimeout(450);
    await p3.keyboard.press('Enter'); await p3.waitForTimeout(800);
    const inForm = await p3.evaluate(() => {
      const a = document.activeElement;
      return { tag: a.tagName, isPoint: a.classList.contains('node-content') };
    });
    assert.equal(inForm.tag, 'INPUT',
      `/${cmd}: precondition, this verb opens a form and puts focus in it`);
    await p3.keyboard.press('Escape'); await p3.waitForTimeout(800);
    assert.equal(await p3.evaluate(() => document.activeElement.classList.contains('node-content')), true,
      `/${cmd}: Escape must hand the caret back to the point it was typed from`);
    await p3.close();
  }

  // B5 — Tab used to walk out to the help button BEHIND the still-open menu
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [mkNode('Buy milk'), mkNode('Second')];
    root.children.forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    const c = document.querySelectorAll('.node-content')[0]; c.focus(); activeContentId = c.dataset.id;
  });
  await pg.waitForTimeout(320);
  await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(450);
  const seen = [];
  for (let i = 0; i < 6; i++) {
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(140);
    const r = await pg.evaluate(() => {
      const a = document.activeElement;
      const items = [...document.querySelectorAll('#bpop .bpop-type, #bpop .cmd-item, #bpop .tp-chip')];
      return { inMenu: document.getElementById('bpop').contains(a), idx: items.indexOf(a) };
    });
    assert.equal(r.inMenu, true, `Tab ${i + 1} left the menu, which stays open behind it`);
    seen.push(r.idx);
  }
  assert.ok(new Set(seen).size > 1, 'and Tab actually moves through the rows rather than sticking');
  const back = await (async () => { await pg.keyboard.press('Shift+Tab'); await pg.waitForTimeout(150);
    return pg.evaluate(() => { const items = [...document.querySelectorAll('#bpop .bpop-type, #bpop .cmd-item, #bpop .tp-chip')];
      return items.indexOf(document.activeElement); }); })();
  assert.equal(back, seen[seen.length - 1] - 1, 'Shift+Tab walks back');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(500);
  assert.equal(await pg.evaluate(() => document.activeElement.className.includes('node-content')), true,
    'and Escape is still the way out, back to the point');
  await pg.close();
});

// 39. #1465 C2 — the docked panels were unreachable, and REACHING for them edited the document.
// Driven because every claim here is about what focus did: the rows already carried role="link"
// and tabindex="0" and already had a hide-suppressor for focus-in, so a source pin would have
// reported this surface healthy for as long as it was dead (#1021's class exactly). The negative
// case is measured too: with no panel open the key must stay the browser's.
test('#1465 C2 F6 reaches the Linked from rows, and comes back to the caret', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const plan = mkNode('Plan'), target = mkNode('Draft the proposal');
    root.children = [plan, target];
    [plan, target].forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    ['Monday: see [[#' + target.id + ']]', 'Tuesday: also [[#' + target.id + ']]'].forEach(t => {
      const n = mkNode(t); n.type = 'ul'; plan.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, plan);
    });
    buildIndex(root, null); markDirty(); render();
    const c = [...document.querySelectorAll('.node-content')].find(e => e.dataset.id === target.id);
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
    setCaretByOffset(c, 6);                        // mid-word, so a restore has something to prove
  });
  await pg.waitForTimeout(500);
  const st = () => pg.evaluate(() => {
    const a = document.activeElement;
    return {
      inPanel: document.getElementById('bl-panel').contains(a),
      isRow: !!a.classList?.contains('bl-item'),
      role: a.getAttribute ? a.getAttribute('role') : null,
      shape: root.children.map(n => n.text + '(' + n.children.length + ')').join(' | '),
      live: (document.getElementById('a11y-live') || {}).textContent || '',
      caret: a.classList?.contains('node-content') && a.dataset.editing ? getCaretOffset(a) : null,
    };
  });
  const start = await st();
  assert.equal(start.caret, 6, 'precondition: the caret is mid-word in the linked-to point');
  assert.equal(await pg.evaluate(() => document.querySelectorAll('#bl-panel .bl-item').length), 2,
    'precondition: the strip is open with two rows');

  // F6 is the door.
  await pg.keyboard.press('F6'); await pg.waitForTimeout(450);
  const inPanel = await st();
  assert.equal(inPanel.inPanel, true, 'F6 must land focus inside the strip');
  assert.equal(inPanel.isRow, true, 'and on a ROW, not on the panel or a header control');
  assert.equal(inPanel.role, 'link', 'the row it lands on is the one that advertises itself');
  assert.match(inPanel.live, /Linked from/, 'and arriving says where you are (P4)');
  assert.equal(inPanel.shape, start.shape, 'reaching the panel must not touch the document');

  // Enter on the row does what the row says.
  const opened = await (async () => {
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(700);
    return pg.evaluate(() => !!focusedId);
  })();
  assert.equal(opened, true, 'Enter on a row opens the source point');

  // ...and the ring is its own way home, with the caret where it stood.
  const pg2 = await fresh();
  await pg2.evaluate(() => {
    const plan = mkNode('Plan'), target = mkNode('Draft the proposal');
    root.children = [plan, target];
    [plan, target].forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    const s = mkNode('Monday: see [[#' + target.id + ']]');
    s.type = 'ul'; plan.children.push(s); nodeMap.set(s.id, s); parentMap.set(s.id, plan);
    buildIndex(root, null); markDirty(); render();
    const c = [...document.querySelectorAll('.node-content')].find(e => e.dataset.id === target.id);
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
    setCaretByOffset(c, 6);
  });
  await pg2.waitForTimeout(500);
  const home = () => pg2.evaluate(() => {
    const a = document.activeElement;
    return { isPoint: !!a.classList?.contains('node-content'),
             caret: a.classList?.contains('node-content') && a.dataset.editing ? getCaretOffset(a) : null };
  });
  for (const [n, key] of [[1, 'F6'], [2, 'F6']]) {
    await pg2.keyboard.press(key); await pg2.waitForTimeout(450);
    if (n === 2) {
      const back = await home();
      assert.equal(back.isPoint, true, 'a step past the last panel goes back to the outline, not to <body>');
      assert.equal(back.caret, 6, 'and the caret lands exactly where it stood');
    }
  }
  // Escape is the other way home, from a fresh trip in.
  await pg2.keyboard.press('F6'); await pg2.waitForTimeout(450);
  assert.equal(await pg2.evaluate(() => document.getElementById('bl-panel').contains(document.activeElement)), true);
  await pg2.keyboard.press('Escape'); await pg2.waitForTimeout(500);
  const esc = await home();
  assert.equal(esc.isPoint, true, 'Escape from the panel returns to the point');
  assert.equal(esc.caret, 6, 'with the caret where it stood');

  // The regression the fix could have caused and must not: Tab still means DEPTH. A fresh page,
  // because this one deliberately restructures the document.
  const pg3 = await fresh();
  await pg3.evaluate(() => {
    const plan = mkNode('Plan'), target = mkNode('Draft the proposal');
    root.children = [plan, target];
    [plan, target].forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    const s = mkNode('Monday: see [[#' + target.id + ']]');
    s.type = 'ul'; plan.children.push(s); nodeMap.set(s.id, s); parentMap.set(s.id, plan);
    buildIndex(root, null); markDirty(); render();
    const c = [...document.querySelectorAll('.node-content')].find(e => e.dataset.id === target.id);
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
  });
  await pg3.waitForTimeout(500);
  await pg3.keyboard.press('Tab'); await pg3.waitForTimeout(450);
  assert.deepEqual(await pg3.evaluate(() => root.children.map(n => n.text + '(' + n.children.length + ')')),
    ['Plan(2)'], 'Tab from a point still indents it — the ring must not redefine the depth key');
  assert.equal(await pg3.evaluate(() => document.getElementById('bl-panel').contains(document.activeElement)),
    false, 'and Tab is not a second door into the panel');
  await pg.close(); await pg2.close(); await pg3.close();
});

// The census half: every member of the family, plus the NEGATIVE case. Five findings in a row
// were a capability applied to some siblings and not others, so the ring is driven per member
// rather than proved once on the one the issue happened to name.
test('#1465 C2 every docked panel is reachable, and F6 is unclaimed when none is', { skip: skip() }, async () => {
  // mode -> [what to seed, which panel id must take focus]
  const cases = [
    ['bl',   'bl-panel'],
    ['fn',   'fn-panel'],
    ['var',  'var-panel'],
    ['zoom', 'zoom-bl'],
    ['none', null],          // the negative case: nothing open, so the key stays the browser's
  ];
  for (const [mode, want] of cases) {
    const pg = await fresh();
    await pg.evaluate((mode) => {
      window.__f6 = [];
      document.addEventListener('keydown', e => { if (e.key === 'F6') window.__f6.push(e.defaultPrevented); });
      const plan = mkNode('Plan');
      const wantFn = mode === 'fn';
      const target = mkNode('Draft the proposal' + (wantFn ? ' [^a]' : ''));
      if (wantFn) root.footnotes = [{ id: 'a', text: 'due Friday' }];
      root.children = [plan, target];
      [plan, target].forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
      if (mode === 'bl' || mode === 'zoom') {
        const s = mkNode('Monday: see [[#' + target.id + ']]');
        s.type = 'ul'; plan.children.push(s); nodeMap.set(s.id, s); parentMap.set(s.id, plan);
      }
      buildIndex(root, null); markDirty(); render();
      window.__targetId = target.id;
    }, mode);
    await pg.waitForTimeout(300);
    if (mode === 'zoom') {
      await pg.evaluate(() => zoomTo(window.__targetId));
      await pg.waitForTimeout(900);
    } else {
      await pg.evaluate(() => {
        const c = [...document.querySelectorAll('.node-content')].find(e => e.dataset.id === window.__targetId);
        enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
      });
      if (mode === 'var') await pg.keyboard.press('Control+Shift+V');
      await pg.waitForTimeout(500);
    }
    if (want) {
      assert.equal(await pg.evaluate(w => {
        const e = document.getElementById(w);
        return !!e && (e.classList.contains('on') || e.classList.contains('zoom-bl'));
      }, want), true, `${mode}: precondition, ${want} is open`);
    }
    await pg.keyboard.press('F6'); await pg.waitForTimeout(500);
    const r = await pg.evaluate((w) => ({
      inWanted: w ? !!document.getElementById(w)?.contains(document.activeElement) : false,
      onBody: document.activeElement === document.body,
      f6: window.__f6.slice(),
    }), want);
    if (want) {
      assert.equal(r.inWanted, true, `${mode}: F6 must land focus inside #${want}`);
      assert.deepEqual(r.f6, [true], `${mode}: and claim the key`);
      // Every member must also have a way BACK, or the ring is a new trap of the #1464 B1 kind.
      // The variables panel is the member that proves the armed-caret restore is load-bearing:
      // it is about the document, not a point, so it has no subject to fall back to.
      await pg.keyboard.press('F6'); await pg.waitForTimeout(550);
      const home = await pg.evaluate(() => {
        const a = document.activeElement;
        return { isPoint: !!(a.classList?.contains('node-content') || a.classList?.contains('zoom-title')),
                 onBody: a === document.body, where: a.tagName + '.' + (a.className || '') };
      });
      assert.equal(home.isPoint, true,
        `${mode}: a step past the last panel must come home to a point, got ${home.where}`);
      assert.equal(home.onBody, false, `${mode}: and never to <body>`);
    } else {
      assert.deepEqual(r.f6, [false],
        'with no docked panel open F6 must stay unclaimed, so the browser keeps its own');
      assert.equal(r.onBody, false, 'and focus must not be thrown anywhere');
    }
    await pg.close();
  }
});
