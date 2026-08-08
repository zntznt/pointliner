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
    const examples = GUIDE.flatMap(e => (e.examples || []).map(x => ({ id: e.id, syn: x.syn })))
      .filter(x => /[{[]/.test(x.syn));
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
