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

// #1516: a PHONE page — 390x844, hasTouch, isMobile. The touch bars (#edit-bar, #quick-bar) are the
// only place some doors exist, and a desktop page never renders them, which is how a door verified
// "on desktop" shipped dead on the surface it was built for. Its own context, so the desktop checks
// above are untouched.
let touchCtx = null;
async function touchPage() {
  if (!browser) assert.fail(launchErr || 'no browser was launched');
  touchCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const pg = await touchCtx.newPage();
  pageErrors = [];
  pg.on('pageerror', e => pageErrors.push(String(e).split('\n')[0]));
  await pg.goto(APP);
  await pg.waitForSelector('#outline', { timeout: 10000 });
  await pg.waitForTimeout(800);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(300);
  return pg;
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
    await pg.keyboard.press('Enter');
    // Wait for focus to SETTLE rather than sampling once at a fixed deadline. The claim is "this row
    // does not leave the keyboard on <body>", and a row that lands somewhere usable a little late
    // still honours it -- but a fixed 600ms turns CI load into a verdict about the app. This check
    // opens ~28 fresh pages and took 94s in CI against ~35s locally, and it failed there on a row
    // that passes locally and is untouched by the change under test. Polling removes the deadline
    // without softening the assertion: the final read is still "where did focus actually end up",
    // taken after a settle pause, so a row that moves focus and then drops it is still caught.
    const ae = await pg.evaluate(async () => {
      const idle = () => new Promise(r => setTimeout(r, 100));
      for (let n = 0; n < 25 && document.activeElement.tagName === 'BODY'; n++) await idle();
      await idle(); await idle();                      // settle: catch a late drop back to <body>
      return document.activeElement.tagName;
    });
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

// 41. #1463 A4 — a code block leaked the internal pill token. Driven because the claim is about
// what the RENDERED block shows, and because the round-trip (convert away, get the pill back with
// its frozen roll) cannot be seen from source at all.
test('#1463 A4 a code block shows the source, and converting back restores the frozen pill', { skip: skip() }, async () => {
  const pg = await fresh();
  const before = await pg.evaluate(() => {
    document.getElementById('storage-warn')?.remove();
    const n = mkNode('Damage {2d6} to the orc');
    n.type = 'ul'; root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
    buildIndex(root, null); markDirty(); render();
    promoteInlineShorthand(n);
    buildIndex(root, null); markDirty(); render();
    return { text: n.text, key: (n.dice || [])[0]?.key || null, roll: (n.dice || [])[0]?.value ?? null };
  });
  assert.match(before.text, /\[\[dice:[a-z0-9]+\]\]/, 'precondition: the pill folded to a token');
  assert.ok(before.key, 'precondition: with a sidecar record');

  const asCode = await pg.evaluate(() => {
    const n = root.children[0];
    n.type = 'code'; n.text = '```' + n.text;     // what the / applier produces
    buildIndex(root, null); markDirty(); render();
    return {
      rendered: (document.querySelector('#outline pre.md-code')?.textContent || ''),
      text: n.text,
    };
  });
  assert.equal(asCode.rendered, 'Damage {2d6} to the orc',
    'the code block must show the authored source, not the opaque internal key');
  assert.doesNotMatch(asCode.rendered, /\[\[dice:/, 'and never the token');
  assert.match(asCode.text, /\[\[dice:/, 'while node.text keeps the token — the render unfolds, the model does not');

  // Convert away: the pill comes back LIVE, with the same key and the same frozen roll.
  const back = await pg.evaluate(() => {
    const n = root.children[0];
    n.type = 'ul'; n.text = n.text.replace(/^```/, '');
    buildIndex(root, null); markDirty(); render();
    return { text: n.text, key: (n.dice || [])[0]?.key || null, roll: (n.dice || [])[0]?.value ?? null,
             pill: !!document.querySelector('#outline .node-content [data-key]') };
  });
  assert.equal(back.key, before.key, 'the same pill, not a fresh one');
  assert.equal(back.roll, before.roll, 'and the same frozen roll — a code-block detour must not re-roll');
  await pg.close();
});

// 42. #1490 — Escape out of an edit. Driven because every claim is about what the keyboard does
// from a state where activeElement never changes: reading activeElement alone is exactly how the
// issue concluded the arrows were dead when they were in fact moving the row cursor.
test('#1490 Escape leaves a cursor you can hear, and Enter gets back into that point', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [mkNode('One'), mkNode('Two'), mkNode('Three')];
    root.children.forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    const c = document.querySelectorAll('.node-content')[1];
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
  });
  await pg.waitForTimeout(400);
  const st = () => pg.evaluate(() => {
    const a = document.activeElement, cur = document.querySelector('.node-cursor');
    return {
      onBody: a === document.body,
      editing: a.classList?.contains('node-content') && a.dataset.editing ? nodeById(a.dataset.id)?.text : null,
      caret: a.classList?.contains('node-content') && a.dataset.editing ? getCaretOffset(a) : null,
      cursorRow: cur ? nodeById(cur.dataset.id)?.text : null,
      live: (document.getElementById('a11y-live') || {}).textContent || '',
      model: root.children.map(n => n.text),
    };
  });

  await pg.keyboard.press('Escape'); await pg.waitForTimeout(550);
  const esc = await st();
  assert.equal(esc.onBody, true, 'blur is still the rung — focus on the point would re-enter the edit');
  assert.equal(esc.cursorRow, 'Two', 'but the cursor is PAINTED on the point you left, not nowhere');
  assert.equal(esc.live, 'Two, 2 of 3', 'and said, with its position — there is no focused element to fall back on');

  // The arrows were never dead; they move the cursor. Now they say so too.
  await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(400);
  let r = await st();
  assert.equal(r.cursorRow, 'Three'); assert.equal(r.live, 'Three, 3 of 3');
  await pg.keyboard.press('ArrowUp'); await pg.waitForTimeout(400);
  r = await st();
  assert.equal(r.cursorRow, 'Two'); assert.equal(r.live, 'Two, 2 of 3');

  // Enter is the way back IN, on the point under the cursor — not the different point Tab lands on.
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  const back = await st();
  assert.equal(back.editing, 'Two', 'Enter re-enters the point the cursor was on');
  assert.equal(back.caret, 3, 'at the end of its text, as the chrome restore does');
  await pg.keyboard.type('!', { delay: 40 }); await pg.waitForTimeout(400);
  assert.deepEqual((await st()).model, ['One', 'Two!', 'Three'], 'and typing goes where it looks like it will');

  // The negative case: a dialog owns its own Enter, because it holds focus and this branch is
  // gated on <body>. Without that gate the row cursor would fire under every open surface.
  const pg2 = await fresh();
  await pg2.evaluate(() => {
    root.children = [mkNode('One'), mkNode('Two')];
    root.children.forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    const c = document.querySelectorAll('.node-content')[1];
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
  });
  await pg2.waitForTimeout(350);
  await pg2.keyboard.press('Escape'); await pg2.waitForTimeout(450);
  await pg2.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
  await pg2.waitForTimeout(800);
  assert.equal(await pg2.evaluate(() => document.activeElement === document.body), false,
    'precondition: the builder holds focus, so the row-cursor Enter is out of reach');
  await pg2.close(); await pg.close();
});

// 43. #1244 — an imported bibliography you can CITE. Driven because the claim is about what the two
// P2 doors OFFER after a real import, and because the defect it fixes was a silent wrong answer:
// citing by your reference manager's key used to make a second, EMPTY footnote beside the real one.
test('#1244 an imported source is citable by its own key, and both doors offer it', { skip: skip() }, async () => {
  const BIB = '@book{ives2019, title = {The Politics of Memory}, author = {Ives, Sarah}, year = {2019}, publisher = {Harvard University Press}}';
  const pg = await fresh();
  await pg.evaluate((BIB) => {
    root.children = []; root.footnotes = [];
    const res = bibToPoints(BIB);
    res.points.forEach(p => root.children.push(p));
    migrateFootnotesToStore(res.points[0], root.footnotes);   // the real insert-path lift
    const attach = (n, parent) => { nodeMap.set(n.id, n); parentMap.set(n.id, parent); (n.children || []).forEach(k => attach(k, n)); };
    res.points.forEach(p => attach(p, root));
    const claim = mkNode('Memory is contested');
    claim.type = 'ul'; root.children.push(claim); nodeMap.set(claim.id, claim); parentMap.set(claim.id, root);
    buildIndex(root, null); markDirty(); render();
    window.__claimId = claim.id;
  }, BIB);
  await pg.waitForTimeout(400);

  const imported = await pg.evaluate(() => ({
    refText: root.children[0].children[0].text,
    store: (root.footnotes || []).map(f => ({ id: f.id, text: (f.text || '').slice(0, 40) })),
  }));
  assert.match(imported.refText, /\[\^ives2019\]/,
    'the lift must KEEP the cite key as the marker, or nothing downstream can name this source');
  assert.equal(imported.store.length, 1);
  assert.equal(imported.store[0].id, 'ives2019');

  // The defect: citing by the key you already know used to mint a SECOND, empty entry.
  const cited = await pg.evaluate(() => {
    const n = nodeById(window.__claimId);
    n.text = 'Memory is contested [^ives2019]';
    buildIndex(root, null); markDirty(); render();
    syncFnEntries(n);
    return {
      count: (root.footnotes || []).length,
      resolves: (root.footnotes.find(f => f.id === 'ives2019') || {}).text || '',
    };
  });
  assert.equal(cited.count, 1, 'citing the key must reuse the imported footnote, not add an empty twin');
  assert.match(cited.resolves, /Ives, Sarah\. The Politics of Memory/, 'and it resolves to the real citation');

  // P2 door one: the Cite-footnote picker offers it, named by its text rather than by an opaque id.
  await pg.evaluate(() => {
    const c = [...document.querySelectorAll('.node-content')].find(e => e.dataset.id === window.__claimId);
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
    openCitePicker(window.__claimId, editableText(c).length);
  });
  await pg.waitForTimeout(700);
  const picks = await pg.evaluate(() => [...document.querySelectorAll('.tpl-row .tpl-pick')]
    .map(e => e.getAttribute('aria-label')));
  assert.equal(picks.length, 1, 'exactly one citable footnote is offered');
  assert.match(picks[0], /Cite footnote 1: Ives, Sarah\. The Politics of Memory/);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(400);

  // P2 door two: the Footnotes manager lists it, with its use count.
  await pg.evaluate(() => document.getElementById('btn-footnotes')?.click());
  await pg.waitForTimeout(800);
  const rows = await pg.evaluate(() => [...document.querySelectorAll('.tpl-row')].map(e => (e.textContent || '').trim()));
  assert.equal(rows.length, 1, 'the manager lists the one imported source');
  assert.match(rows[0], /Ives, Sarah\. The Politics of Memory/);
  assert.match(rows[0], /2 uses/,
    'two markers now point at ONE citation — the reference point the import made, and the claim. ' +
    'That count IS the fix: before it, the claim had its own empty footnote and this read "1 use".');
  await pg.close();
});

// 44. #1493 — a code block must survive both exports. Driven because the failure was in what
// SHIPPED, and because the round trip (export, re-import, still a code block with the same lines)
// is the export's own stated spec and cannot be seen from source.
test('#1493 a code block exports as a code block, keeps its lines, and round-trips', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    const out = {};
    const mk = (text) => {
      const n = mkNode(text); n.type = 'code';
      root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
      buildIndex(root, null); markDirty(); render();
      return { node: n, md: toMarkdown(root), web: String(nodeToReadonlyHtml(n, varMapAt(n))) };
    };
    out.multi = mk('```js\nconst x = 1;\nconsole.log(x);');
    out.plain = mk('```hello world');
    // the round trip, which is the spec: export -> import -> the same block
    const back = markdownToPoints(out.multi.md);
    out.reimported = (back.points || back).map(p => ({ type: p.type, text: p.text }));
    return out;
  });

  // Markdown: a real fence, the language on it, every line still a line.
  const lines = r.multi.md.split('\n');
  assert.ok(lines.includes('```js'), `the fence carries the language, got:\n${r.multi.md}`);
  assert.ok(lines.includes('const x = 1;') && lines.includes('console.log(x);'),
    'both lines survive as lines — they used to be joined by spaces into one');
  assert.doesNotMatch(r.multi.md, /- `/, 'and it is a block, not an inline span in a list item');
  assert.doesNotMatch(r.multi.md, /`js const x/, 'the language token is not part of the code');

  // Web page: a real code block, not a paragraph div holding a literal fence.
  assert.match(r.multi.web, /<pre class="ro-code"><code class="language-js">/);
  assert.match(r.multi.web, /const x = 1;\nconsole\.log\(x\);/, 'with its line breaks intact');
  assert.doesNotMatch(r.multi.web, /```/, 'and no leaked fence');
  assert.doesNotMatch(r.plain.web, /```/);
  assert.match(r.plain.web, /<pre class="ro-code"><code>hello world<\/code><\/pre>/);

  // The round trip: what came back is the same code block, not prose.
  assert.equal(r.reimported.length, 1);
  assert.equal(r.reimported[0].type, 'code', 'a re-imported code block is still a code block');
  assert.match(r.reimported[0].text, /const x = 1;/);
  assert.match(r.reimported[0].text, /console\.log\(x\);/);
  await pg.close();
});

// 45. #1493 — and the three surfaces agree on a block holding a pill. They showed three different
// strings for one literal block; the owner's call is the SOURCE everywhere.
test('#1493 screen, Markdown and web page show a code block the same way', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    const n = mkNode('Damage {2d6} to the orc'); n.type = 'ul';
    root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
    buildIndex(root, null); markDirty(); render();
    promoteInlineShorthand(n);
    n.type = 'code'; n.text = '```' + n.text;
    buildIndex(root, null); markDirty(); render();
    return {
      screen: (document.querySelector('#outline pre.md-code')?.textContent || ''),
      md: toMarkdown(root),
      web: String(nodeToReadonlyHtml(n, varMapAt(n))),
      text: n.text,
    };
  });
  const WANT = 'Damage {2d6} to the orc';
  assert.equal(r.screen, WANT, 'screen');
  assert.ok(r.md.split('\n').includes(WANT), `Markdown export, got:\n${r.md}`);
  assert.ok(r.web.includes(WANT), `web page export, got:\n${r.web}`);
  // None of them leaks the internal name, and the model still holds the token.
  for (const [where, s] of [['screen', r.screen], ['markdown', r.md], ['web', r.web]])
    assert.doesNotMatch(s, /\[\[dice:/, `${where} must never show the internal token`);
  assert.match(r.text, /\[\[dice:/, 'the model is untouched: the surfaces read it, they do not rewrite it');
  await pg.close();
});

// 46. #1496 — Enter on a focused in-content control fired twice: the control acted, then the
// document-level #1490 row-cursor gate saw <body> and opened the point behind it, and the NEXT
// Enter split that point. Driven, and driven as a CENSUS, because the family is every control that
// repaints on activate and the defect was reported on only one member of it.
test('#1496 Enter on a focused in-content control acts once and chains, on every member', { skip: skip() }, async () => {
  // [label, text to type, selector for the control]
  const FAMILY = [
    ['dice',      'Attack {2d6+3}',            '[data-key]'],
    ['oracle',    'Q {oracle: likely}',        '[data-key]'],
    ['deck',      'D {shuffle 2: a|b|c|d}',    '[data-key]'],
    ['cycle',     'C {cycle: dawn|noon|dusk}', '[data-key]'],
    ['pick',      'P {sword|axe|bow}',         '[data-key]'],
    ['clock',     'Track [o 0/6]',             '.clock'],
    ['taskcheck', '- [ ] do it',               '.md-task-check'],
    // The negative case, and it BOUNDS the fix: a spoiler toggles a class instead of repainting, so
    // focus never fell to <body> and it never had the defect. If it ever starts failing here, the
    // guard has been widened past what it should cover.
    ['spoiler',   '>! secret',                 '.md-spoiler'],
  ];

  for (const [label, typed, sel] of FAMILY) {
    const pg = await fresh();
    // TYPE it, never seed: seeding replaces root.children and orphans selFocusId, which silently
    // disables the very gate under test. That is exactly how the original report's contrast case
    // came out clean and mis-stated the precondition.
    await pg.evaluate(() => {
      const c = document.querySelector('.node-content');
      enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
    });
    await pg.keyboard.type(typed, { delay: 18 }); await pg.waitForTimeout(250);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(600);

    const focused = await pg.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.focus(); return true; }, sel);
    assert.equal(focused, true, `${label}: precondition, the control rendered and can take focus`);
    await pg.waitForTimeout(200);

    const snap = () => pg.evaluate(() => ({
      rows: root.children.length,
      editing: !!document.querySelector('.node-content[data-editing]'),
      onControl: document.activeElement !== document.body && !document.activeElement.classList.contains('node-content'),
      live: (document.getElementById('a11y-live') || {}).textContent || '',
    }));
    const before = await snap();
    assert.equal(before.rows, 1, `${label}: precondition, one point`);

    await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
    const one = await snap();
    assert.equal(one.editing, false, `${label}: Enter must not open the point for editing`);
    assert.equal(one.rows, 1, `${label}: Enter must not change the document shape`);
    assert.equal(one.onControl, true, `${label}: focus must stay on the control so the next Enter repeats it`);

    await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
    const two = await snap();
    assert.equal(two.rows, 1, `${label}: a SECOND Enter must not add a point — the reported symptom`);
    assert.equal(two.editing, false, `${label}: nor open the point`);
    await pg.close();
  }
});

// 47. #1496 — and the gate it gutters must still do its own job (#1490).
test('#1496 the row-cursor Enter still works when nothing else handled the key', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [mkNode('One'), mkNode('Two'), mkNode('Three')];
    root.children.forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    const c = document.querySelectorAll('.node-content')[1];
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
  });
  await pg.waitForTimeout(400);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(550);
  const parked = await pg.evaluate(() => ({
    onBody: document.activeElement === document.body,
    cursor: document.querySelector('.node-cursor') ? nodeById(document.querySelector('.node-cursor').dataset.id).text : null,
  }));
  assert.equal(parked.onBody, true, 'precondition: the blur rung parks focus on the page body');
  assert.equal(parked.cursor, 'Two', 'with the row cursor on the point it left');

  await pg.keyboard.press('Enter'); await pg.waitForTimeout(500);
  const back = await pg.evaluate(() => {
    const a = document.activeElement;
    return { editing: a.dataset && a.dataset.editing ? nodeById(a.dataset.id).text : null,
             caret: a.dataset && a.dataset.editing ? getCaretOffset(a) : null };
  });
  assert.equal(back.editing, 'Two', 'an unhandled Enter still enters the point under the cursor');
  assert.equal(back.caret, 3, 'at the end of its text');
  await pg.close();
});

// 48. #1497 — two aria-modal dialogs opened without taking focus, so they had no keyboard exit at
// all and keys reached the document behind the scrim. Driven, and driven through the REAL door,
// because the whole defect is about where focus is and a source pin cannot see that.
test('#1497 a dialog opened from the point menu takes focus, holds Tab, and Escape returns to the point', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [mkNode('First point'), mkNode('R {2d6+3}')];
    root.children.forEach(n => { n.type = 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    promoteInlineShorthand(root.children[1]);
    buildIndex(root, null); markDirty(); render();
    const c = [...document.querySelectorAll('.node-content')][1];
    enterEdit(c, nodeById(c.dataset.id)); c.focus(); activeContentId = c.dataset.id;
  });
  await pg.waitForTimeout(350);
  const before = await pg.evaluate(() => root.children.map(n => n.text));

  // The real keyboard door: Shift+F10, walk to the row, Enter.
  await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(500);
  let reached = false;
  for (let i = 0; i < 30 && !reached; i++) {
    await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(70);
    reached = await pg.evaluate(() => /Show distribution/i.test((document.activeElement.textContent || '')));
  }
  assert.equal(reached, true, 'precondition: the Show distribution row is reachable in the point menu');
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(800);

  const st = () => pg.evaluate(() => {
    const card = document.getElementById('io-card'), a = document.activeElement;
    return { open: getComputedStyle(card).display, inDialog: card.contains(a),
             isPoint: !!a.classList?.contains('node-content'),
             texts: root.children.map(n => n.text),
             // SHAPE, not text: opening the dialog blurs the point, which refolds its pill and
             // legitimately rewrites the text. Indenting is what changes the shape, and indenting
             // through the scrim is the claim under test.
             shape: root.children.map(n => (n.children || []).length).join(',') + '|' + root.children.length };
  });
  const opened = await st();
  assert.equal(opened.open, 'block', 'the dialog is open');
  assert.equal(opened.inDialog, true, 'and focus is INSIDE it — the whole defect was that it was not');
  // Baseline taken AFTER the open, so the refold is already accounted for.
  const baseShape = opened.shape, baseTexts = opened.texts;

  // Tab must stay in the dialog rather than indenting the outline behind the scrim.
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(350);
  const tabbed = await st();
  assert.equal(tabbed.inDialog, true, 'Tab stays inside the dialog');
  assert.equal(tabbed.shape, baseShape, 'and does not indent the document behind it');

  // Typing must not author into the document under the scrim.
  await pg.keyboard.type('XYZ', { delay: 40 }); await pg.waitForTimeout(400);
  const typed = await st();
  assert.deepEqual(typed.texts, baseTexts, 'keystrokes must not reach the document behind an aria-modal dialog');
  assert.equal(typed.shape, baseShape);

  // Escape closes it and hands the caret back.
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(700);
  const closed = await st();
  assert.equal(closed.open, 'none', 'Escape closes it — it could not before, because Escape never reached it');
  assert.equal(closed.isPoint, true, 'and focus returns to the point');
  assert.equal(closed.shape, baseShape, 'with the document shape untouched throughout');
  assert.equal(before.length, 2, 'and the document still has its two points');
  await pg.close();
});

// 49. #1497 — the census. The fix is in the shell, so it must hold for the whole family, including
// the read-only reports that have no input to focus and the callers that pick their own field.
test('#1497 every dialog lands focus inside itself, whichever door opened it', { skip: skip() }, async () => {
  // [label, how to open it]
  const DIALOGS = [
    ['distribution', () => { const n = root.children[1]; openDistributionPanel(n, 'dice', (n.dice || [])[0].key); }],
    ['pill audit',   () => { const p = root.children[2]; openPillAudit(p, (p.math || [])[0].key); }],
    ['footnotes',    () => document.getElementById('btn-footnotes').click()],
    ['appearance',   () => document.getElementById('btn-appearance').click()],
    ['import',       () => document.getElementById('btn-import').click()],
  ];
  for (const [label] of DIALOGS) {
    const pg = await fresh();
    await pg.evaluate(() => {
      const roll = mkNode('R {2d6+3}');
      const tot  = mkNode('Kitchen {= sum(cost)}');
      const kid  = mkNode('Cabinets {prop cost: 1200}');
      tot.children = [kid];
      root.children = [mkNode('First point [^a]'), roll, tot];
      root.footnotes = [{ id: 'a', text: 'a source' }];
      const attach = (n, par) => { n.type = n.type || 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, par); (n.children || []).forEach(k => attach(k, n)); };
      root.children.forEach(n => attach(n, root));
      buildIndex(root, null); markDirty(); render();
      root.children.forEach(n => { promoteInlineShorthand(n); (n.children || []).forEach(k => promoteInlineShorthand(k)); });
      buildIndex(root, null); markDirty(); render();
    });
    await pg.waitForTimeout(400);
    const idx = DIALOGS.findIndex(d => d[0] === label);
    await pg.evaluate((i) => {
      const opens = [
        () => { const n = root.children[1]; openDistributionPanel(n, 'dice', (n.dice || [])[0].key); },
        () => { const p = root.children[2]; openPillAudit(p, (p.math || [])[0].key); },
        () => document.getElementById('btn-footnotes').click(),
        () => document.getElementById('btn-appearance').click(),
        () => document.getElementById('btn-import').click(),
      ];
      opens[i]();
    }, idx);
    await pg.waitForTimeout(800);
    const r = await pg.evaluate(() => {
      const card = document.getElementById('io-card'), a = document.activeElement;
      const SEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
      return { open: getComputedStyle(card).display, inDialog: card.contains(a),
               onBody: a === document.body, onCard: a === card,
               controls: card.querySelectorAll(SEL).length,
               ae: a.tagName + '.' + String(a.className || '').split(' ')[0] };
    });
    assert.equal(r.open, 'block', `${label}: precondition, the dialog opened`);
    assert.equal(r.inDialog, true, `${label}: focus must land inside the dialog, got ${r.ae}`);
    assert.equal(r.onBody, false, `${label}: and never on the page body`);
    // Landing on the CARD is the fallback for a report with nothing to operate. Where the dialog
    // has a control, focus belongs ON it — otherwise the user has to hunt for the first field, and
    // a guard that accepts either cannot tell the two apart (it let a mutant through that did).
    if (r.controls > 0)
      assert.equal(r.onCard, false,
        `${label}: the dialog has ${r.controls} focusable control(s), so focus must be on one of them, not the card`);

    // and Escape must reach it, which is only true because focus is inside
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(600);
    assert.equal(await pg.evaluate(() => getComputedStyle(document.getElementById('io-card')).display), 'none',
      `${label}: Escape closes it`);
    await pg.close();
  }
});

// 50. #1498 — the check flip announced its point's INTERNAL name to assistive tech, and a
// first-encounter tip landed in the same frame and buried it. Driven because the failure is confined
// to the aria-live channel: every visible surface was correct throughout, so nothing but a live
// MutationObserver on #a11y-live can see it.
test('#1498 a check flip says a label a person can hear, and nothing buries it', { skip: skip() }, async () => {
  const pg = await fresh();   // fresh context = empty localStorage = the nudge is unspent
  assert.equal(await pg.evaluate(() => isGuided() && !nudgeSeen('sum')), true,
    'precondition: Guided verbosity with the once-ever sum tip still unspent — the defect is first-encounter only');

  await pg.evaluate(() => {
    const parent = mkNode('Kitchen job {= sum(cost)}');
    const a = mkNode('Cabinets'), c = mkNode('Worktop');
    parent.children = [a, c]; root.children = [parent];
    const attach = (n, p) => { n.type = n.type || 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, p); (n.children || []).forEach(k => attach(k, n)); };
    root.children.forEach(n => attach(n, root));
    setProp(a, 'cost', '1200'); setProp(c, 'cost', '600');
    setProp(parent, 'check', 'sum(cost) <= 2000');
    buildIndex(root, null); markDirty(); render();
    promoteInlineShorthand(parent);
    buildIndex(root, null); markDirty(); render();
    window.__live = [];
    const el = document.getElementById('a11y-live');
    new MutationObserver(() => window.__live.push({ t: Date.now(), v: el.textContent }))
      .observe(el, { childList: true, characterData: true, subtree: true });
  });
  await pg.waitForTimeout(400);
  const chip = () => pg.evaluate(() => {
    const c = document.querySelector('.prop-check');
    return { cls: c.className, txt: c.textContent, aria: c.getAttribute('aria-label') };
  });
  assert.match((await chip()).cls, /prop-check-pass/, 'precondition: the check is passing at 1,800');

  // Flip it past the limit, through the path openPropsDialog uses after a commit.
  await pg.evaluate(() => {
    const w = root.children[0].children[1];
    setProp(w, 'cost', '1500');
    buildIndex(root, null); markDirty(); render();
    maybeNudgeSum(w, 'cost');
  });
  await pg.waitForTimeout(2400);   // well past the tip's yield delay

  const after = await chip();
  assert.match(after.cls, /prop-check-fail/, 'the check flipped to failing');
  assert.match(after.aria, /is failing/, 'and the chip label says so');

  const live = await pg.evaluate(() => window.__live.slice());
  const spoken = live.filter(e => e.v);
  assert.ok(spoken.length, 'something was announced');
  for (const e of spoken) assert.doesNotMatch(e.v, /\[\[math:/, `an internal token was read aloud: ${JSON.stringify(e.v)}`);
  const at = spoken.findIndex(e => /^Check failing on/.test(e.v));
  assert.ok(at >= 0, `the flip must be announced, got ${JSON.stringify(spoken.map(e => e.v))}`);
  assert.match(spoken[at].v, /^Check failing on Kitchen job\b/, 'named by its readable label');

  // The clobber: the flip must OCCUPY the polite region long enough to be spoken, not exist for one
  // frame before a coaching tip replaces it in the same tick. Measured as a gap, not as "still there
  // at the end": a later unrelated tip (the deferred + Add one) legitimately takes the region after,
  // and asserting the flip is the FINAL value would fail on that legitimate handover rather than on
  // the defect. A same-tick clobber shows up as a gap of ~0ms; the real handover here is ~1.1s.
  const next = spoken[at + 1];
  assert.ok(!next || next.t - spoken[at].t >= 400,
    `the flip was buried after only ${next ? next.t - spoken[at].t : 0}ms by ${JSON.stringify(next && next.v)}`);
  // and the tip is withheld entirely here, because this point already carries {= sum(cost)}
  for (const e of spoken) assert.doesNotMatch(e.v, /Tip: put \{= sum\(cost\)\}/,
    'the tip recommends a pill this very point is already displaying');
  await pg.close();
});

// 51. #1498 — and the teaching moment must survive for someone who actually needs it, WITHOUT
// stealing the frame from what the app is saying about the edit that triggered it. Same tree as 50
// but the parent carries no rollup, so the tip is genuinely new information and fires for real: the
// flip and the tip are produced in one tick, which is the exact collision that lost the flip.
test('#1498 the sum tip still fires when there is no rollup, and waits its turn', { skip: skip() }, async () => {
  const pg = await fresh();
  assert.equal(await pg.evaluate(() => isGuided() && !nudgeSeen('sum')), true,
    'precondition: Guided verbosity with the once-ever sum tip still unspent');

  await pg.evaluate(() => {
    const parent = mkNode('Kitchen job');          // no pill: the tip is genuinely new information
    const a = mkNode('Cabinets'), c = mkNode('Worktop');
    parent.children = [a, c]; root.children = [parent];
    const attach = (n, p) => { n.type = n.type || 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, p); (n.children || []).forEach(k => attach(k, n)); };
    root.children.forEach(n => attach(n, root));
    setProp(a, 'cost', '1200'); setProp(c, 'cost', '600');
    setProp(parent, 'check', 'sum(cost) <= 2000');   // a check needs no {= sum(cost)} pill of its own
    buildIndex(root, null); markDirty(); render();
    window.__live = [];
    const el = document.getElementById('a11y-live');
    new MutationObserver(() => window.__live.push({ t: Date.now(), v: el.textContent }))
      .observe(el, { childList: true, characterData: true, subtree: true });
  });
  await pg.waitForTimeout(400);
  assert.equal(await pg.evaluate(() => hasRollupFor(root.children[0], 'cost')), false,
    'precondition: this parent has no rollup, so withholding the tip here would be wrong');

  // One tick: the property commit flips the check AND is the first-encounter the tip teaches from.
  await pg.evaluate(() => {
    const w = root.children[0].children[1];
    setProp(w, 'cost', '1500');
    buildIndex(root, null); markDirty(); render();
    maybeNudgeSum(w, 'cost');
  });
  await pg.waitForTimeout(2600);   // past the tip's yield delay

  const spoken = (await pg.evaluate(() => window.__live.slice())).filter(e => e.v);
  const at = spoken.findIndex(e => /^Check failing on/.test(e.v));
  assert.ok(at >= 0, `the flip must be announced, got ${JSON.stringify(spoken.map(e => e.v))}`);
  const next = spoken[at + 1];
  assert.ok(!next || next.t - spoken[at].t >= 400,
    `the tip took the frame ${next ? next.t - spoken[at].t : 0}ms after the flip, so the flip was never spoken`);

  const live = await pg.evaluate(() => (document.getElementById('a11y-live').textContent || '').trim());
  assert.match(live, /Tip: put \{= sum\(cost\)\}/, 'the first-encounter tip must still reach someone who has no rollup');
  assert.equal(await pg.evaluate(() => nudgeSeen('sum')), true, 'and be spent, so it never nags again');
  await pg.close();
});

// 52. #1526 — a live `[[#id]]` title reference printed the target's raw `[[math:key]]` on screen, in
// ordinary prose. Driven because the defect IS the rendered output: the source pin can only say
// which helper the sink calls, and the whole point of #1140/#1402/#1526 is that the family kept
// getting the helper half-right. The negatives ride along, because the fix swaps the outermost
// helper at a sink that four separate issues have already tuned (#943 tags, #1402 nesting, mirrors).
test('#1526 a live title reference reads what the target shows, and the tuned cases survive', { skip: skip() }, async () => {
  const pg = await fresh();
  const rows = await pg.evaluate(() => {
    const mk = (t) => { const n = mkNode(t); n.type = 'ul'; return n; };
    const attach = (arr) => { root.children = arr; arr.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); }); buildIndex(root, null); markDirty(); render(); };
    const plain  = mk('Kitchen job');
    const tagged = mk('Atomic notes #zettelkasten/principle');
    const pill   = mk('Payroll {= 3 * 400}');
    attach([plain, tagged, pill]);
    promoteInlineShorthand(pill); buildIndex(root, null); markDirty(); render();
    const nested = mk('Inner [[#' + plain.id + ']] outer');
    const refs = [
      mk('refA: [[#' + pill.id + ']]'),                 // the defect: a target holding a pill
      mk('refB: [[#' + tagged.id + ']]'),               // #943: the target's tags stay off the caption
      mk('refC: [[#' + pill.id + '|My own words]]'),    // a fixed caption is the user's words, untouched
      mk('refD: [[#' + pill.id + '|]]'),                // the mirror form must still transclude
    ];
    attach([plain, tagged, pill, nested, ...refs]);
    const nestedRef = mk('refE: [[#' + nested.id + ']]');   // #1402: a title that itself holds a link
    attach([plain, tagged, pill, nested, ...refs, nestedRef]);
    const shown = [...document.querySelectorAll('.node-content')].map(e => e.innerText.replace(/\s+/g, ' ').trim());
    return { shown, tokens: root.children.map(n => n.text).filter(t => /\[\[math:/.test(t)).length,
             mirrors: document.querySelectorAll('.node-link-mirror').length };
  });
  // an exact, unique prefix: a bare letter matched the 'Atomic notes' TARGET row, not the reference
  const row = (p) => {
    const hit = rows.shown.filter(t => t.startsWith(p + ': '));
    assert.equal(hit.length, 1, `expected exactly one ${p} row, got ${JSON.stringify(hit)}`);
    return hit[0];
  };

  assert.equal(rows.tokens, 1, 'precondition: the target really does hold a folded pill');
  assert.equal(row('refA'), 'refA: Payroll 1,200',
    `a live title reference must read what the target shows, got ${JSON.stringify(row('refA'))}`);
  for (const t of rows.shown) assert.doesNotMatch(t, /\[\[math:/, `an internal token reached the screen: ${JSON.stringify(t)}`);

  assert.equal(row('refB'), 'refB: Atomic notes', '#943: the target\'s #tags stay off the caption');
  assert.equal(row('refC'), 'refC: My own words', 'a fixed caption is the user\'s own words and is never resolved over');
  assert.equal(row('refE'), 'refE: Inner Kitchen job outer', '#1402: a nested link still resolves, and leaves no literal [[]]');
  assert.ok(rows.mirrors >= 1, 'the mirror form still transcludes rather than degrading to a title');
  await pg.close();
});

// 53. #1526 — and the query base's title column, which projects `[[#id]]` and so inherits the same
// sink. Built through its own front door (`/querybase` → the builder → Create), because the whole
// finding is that a surface no test drove was reading a helper nobody had checked.
test('#1526 a query base names its rows the way the points read', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.keyboard.type('Payroll {= 3 * 400} #pay', { delay: 12 });
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(450);
  await pg.keyboard.type('/querybase', { delay: 16 }); await pg.waitForTimeout(700);
  await pg.evaluate(() => document.querySelector('#io-card .builder-insert-btn').click());
  await pg.waitForTimeout(800);
  await pg.evaluate(() => document.querySelector('#io-card input').focus());
  await pg.keyboard.type('#pay', { delay: 18 }); await pg.waitForTimeout(180);
  await pg.evaluate(() => { const t = document.querySelector('#io-card textarea'); t.focus(); t.select(); });
  await pg.keyboard.type('Title: title\ndue', { delay: 14 }); await pg.waitForTimeout(180);
  await pg.evaluate(() => [...document.querySelectorAll('#io-card button')].find(b => /^Create$/.test(b.textContent.trim())).click());
  await pg.waitForTimeout(900);
  await pg.evaluate(() => { setProp(root.children[0], 'due', '2026-09-01'); buildIndex(root, null); markDirty(); render(); });
  await pg.waitForTimeout(600);

  const titleCell = () => pg.evaluate(() => {
    const c = document.querySelector('.mt-cell[data-r="1"][data-c="0"]');
    return c ? c.innerText.replace(/\s+/g, ' ').trim() : null;
  });
  assert.equal(await pg.evaluate(() => /\[\[math:/.test(root.children[0].text)), true,
    'precondition: the source point holds a folded pill');
  assert.equal(await titleCell(), 'Payroll 1,200',
    'the projected title column must read what the point shows, not its [[math:key]]');

  // the same row's cell-commit toast names it the same way (it said "Payroll 🖩" before)
  await pg.evaluate(() => document.querySelector('.mt-cell[data-r="1"][data-c="1"]').focus());
  await pg.waitForTimeout(320);
  await pg.keyboard.press('Control+a'); await pg.keyboard.type('2026-10-05', { delay: 16 });
  await pg.waitForTimeout(220);
  await pg.evaluate(() => document.activeElement.blur());
  await pg.waitForTimeout(700);
  const said = await pg.evaluate(() => (document.getElementById('a11y-live').textContent || '').trim());
  assert.match(said, /Updated due on "Payroll 1,200/,
    `the toast must name the point the way the grid does, got ${JSON.stringify(said)}`);
  assert.doesNotMatch(said, /🖩|\[\[math:/, 'never a glyph placeholder and never a token');
  await pg.close();
});

// 54. #1528 — a caption built from a FOREIGN title resolved that title's own bare `[[#id]]`s
// against the OPEN document, found nothing, and printed the bare node id: "Ecological rationality
// argued in qyhvfq73". #1402's own reported example, surviving in its cross-doc twin.
//
// Driven, and this one has no unit alternative: the resolution branch reads the module-level
// nodeMap/workspaceIndex, which the vm harness cannot rebind — the linkText unit test says so at
// its own head. Everything below therefore runs against a real two-document workspace.
test('#1528 a foreign title resolves its own links in its own document', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    const mk = (t) => { const n = mkNode(t); n.type = 'ul'; return n; };
    const attach = (arr) => { root.children = arr; arr.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); }); buildIndex(root, null); markDirty(); render(); };
    const here = mk('Gigerenzer 1996');
    attach([here]);
    root.docId = 'DOCA';
    // Document B: a title holding a BARE link to another point in B (the broken case), and one
    // holding a QUALIFIED link back to A (the case that was always right — the negative).
    const bOther   = mk('Bounded rationality');
    const bLinker  = mk('Ecological rationality argued in [[#' + bOther.id + ']]');
    const bBackToA = mk('Mentions [[DOCA#' + here.id + ']] over in A');
    const otherRoot = { id: 'r2', text: '', children: [bOther, bLinker, bBackToA] };
    const wi = buildWorkspaceIndex([
      { docId: 'DOCA', name: 'A.opml', root: root },
      { docId: 'DOCB', name: 'B.opml', root: otherRoot },
    ]);
    workspaceIndex = wi; workspaceDir = { name: 'ws' };   // truthy: unlocks the cross-doc picker rows
    const fTitle = wi.titles.get('DOCB').get(bLinker.id);

    const x1 = mk('X: [[DOCB#' + bLinker.id + ']]');
    const x2 = mk('Y: [[DOCB#' + bBackToA.id + ']]');
    const z  = mk('Z: [[#' + here.id + ']]');            // a same-doc reference, the untouched default
    attach([here, x1, x2, z]);
    const rows = [...document.querySelectorAll('.node-content')].map(e => e.innerText.replace(/\s+/g, ' ').trim());

    // the CF-4 cross-doc backlink rows, through the real row renderer
    const host = document.getElementById('bl-list');
    renderBlRows(host, document.getElementById('bl-panel-hd'), here.id,
      { sources: [], unlinked: [],
        cross: [{ docId: 'DOCB', docName: 'B.opml', nodeId: bLinker.id, title: fTitle, snippet: '' }],
        crossUnlinked: [] }, {});
    // the `[[` picker's other-doc rows, through the real menu renderer
    lpState = { nodeId: here.id, content: null, triggerOffset: 0, query: 'eco', activeIdx: 0,
                matches: [{ id: bLinker.id, docId: 'DOCB', docName: 'B.opml', title: fTitle }],
                create: null, createNote: null };
    renderLinkMenu();

    return {
      bOtherId: bOther.id, indexTitle: fTitle,
      crossPill:   rows.find(t => t.startsWith('X: ')),
      qualified:   rows.find(t => t.startsWith('Y: ')),
      sameDoc:     rows.find(t => t.startsWith('Z: ')),
      blCrossRow:  [...host.querySelectorAll('.bl-item.bl-cross')].map(e => e.textContent.trim())[0],
      pickerRow:   [...document.querySelectorAll('.lp-item')].map(e => e.textContent.trim())[0],
    };
  });

  assert.match(r.indexTitle, /\[\[#/, "precondition: the index keeps the foreign title's link token raw (#1526)");
  const id = new RegExp(r.bOtherId);

  assert.equal(r.crossPill, 'X: Ecological rationality argued in Bounded rationality',
    'the cross-doc caption must resolve the foreign title in ITS document');
  assert.equal(r.blCrossRow, 'Ecological rationality argued in Bounded rationality · B',
    'and so must the cross-doc backlink row');
  assert.match(r.pickerRow, /^Ecological rationality argued in Bounded rationality\b/,
    "and the `[[` picker's other-doc row, which had nd.docId in scope on the next line");
  for (const [k, v] of Object.entries(r)) {
    if (k === 'bOtherId' || k === 'indexTitle') continue;
    assert.doesNotMatch(String(v), id, `a bare node id reached the reader in ${k}: ${JSON.stringify(v)}`);
  }

  // the two forms that were always correct and must stay that way
  assert.equal(r.qualified, 'Y: Mentions Gigerenzer 1996 over in A',
    'a QUALIFIED token names its own document, so it still resolves back into the open one');
  assert.equal(r.sameDoc, 'Z: Gigerenzer 1996', 'and a same-doc reference is the untouched default');
  await pg.close();
});

// 55. #1499 — `{oracle: likely}` promoted to an anonymous `Yes 3 | No 1` grammar and the word
// `oracle` was gone: the pill unfolded to odds, its label read "Grammar: Yes" exactly like a
// hand-typed pick, and nothing on any surface said it had ever been an oracle. Driven because the
// harm is the AUTHORING CYCLE — type, promote, click back in, read — which no pure test performs,
// and because the same cycle is where the reverse mistake would show: rebuilding `{oracle: …}` from
// odds alone would rewrite a hand-typed `{Yes 3 | No 1}`, so that negative is driven beside it.
test('#1499 an oracle keeps its own words through the authoring cycle, and a hand-typed one is left alone', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    const mk = (t) => { const n = mkNode(t); n.type = 'ul'; return n; };
    const setup = (arr) => { root.children = arr; arr.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); }); buildIndex(root, null); markDirty(); render(); };
    const out = {};

    // the reported case, and the one the issue calls the real bite (a swing body no one can invert by eye)
    const a = mk('Q1 {oracle: likely}'), b = mk('Q2 {oracle: certain + swing}');
    const typed = mk('Coin {Yes 3 | No 1}');            // NOT an oracle: authored as plain odds
    setup([a, b, typed]);
    [a, b, typed].forEach(n => promoteInlineShorthand(n));
    buildIndex(root, null); markDirty(); render();

    out.folded = [a, b, typed].map(n => /\[\[grammar:/.test(n.text));
    out.bands = [a, b, typed].map(n => (n.grammar || [])[0]?.oracle ?? null);
    out.unfolded = [a, b, typed].map(n => unfoldTokensIn(n.text, n));
    out.labels = [...document.querySelectorAll('.gr-roll')].map(e => e.getAttribute('aria-label'));

    // the CYCLE: what the unfold produced must promote back to the same thing, twice over
    a.text = unfoldTokensIn(a.text, a); a.grammar = [];
    promoteInlineShorthand(a); buildIndex(root, null); markDirty(); render();
    out.cycleBand = (a.grammar || [])[0]?.oracle ?? null;
    out.cycleUnfold = unfoldTokensIn(a.text, a);

    // and the band must not outlive the odds it describes (Edit grammar rewrites the def)
    b.grammar[0].def = 'origin: Yes 5 | No 2';
    out.staleUnfold = unfoldTokensIn(b.text, b);
    return out;
  });

  assert.deepEqual(r.folded, [true, true, true], 'precondition: all three promoted to folded pills');
  assert.deepEqual(r.bands, ['likely', 'certain + swing', null],
    'both oracles record their band; the hand-typed alternation records none');
  assert.equal(r.unfolded[0], 'Q1 {oracle: likely}', 'an oracle unfolds to the words it was authored with');
  assert.equal(r.unfolded[1], 'Q2 {oracle: certain + swing}',
    'including the swing form, whose odds body is the one no author could rewrite by hand');
  assert.equal(r.unfolded[2], 'Coin {Yes 3 | No 1}',
    'and a hand-typed alternation is returned untouched — naming it "likely" would be the same rewrite, reversed');

  // positional, so the negative is asserted as a negative rather than swept up by a blanket rule:
  // the third pill IS a bare grammar and must keep reading as one.
  assert.equal(r.labels.length, 3, `one label per pill, got ${JSON.stringify(r.labels)}`);
  assert.match(r.labels[0], /^Oracle \(likely\): /, 'the label names the band, not just the result');
  assert.match(r.labels[1], /^Oracle \(certain \+ swing\): /, 'the swing form names itself too');
  assert.match(r.labels[2], /^Grammar: /,
    'and the hand-typed alternation stays a grammar — calling it an oracle would be the same overreach');

  assert.equal(r.cycleBand, 'likely', 're-promoting the unfolded source records the band again');
  assert.equal(r.cycleUnfold, 'Q1 {oracle: likely}', 'so the cycle is a fixed point, not a one-way trip');
  assert.equal(r.staleUnfold, 'Q2 {Yes 5 | No 2}',
    'once the odds are edited the band stops being claimed, rather than naming odds it no longer rolls');
  await pg.close();
});

// 56. #1500 — convert() fails in four ways and reported the fourth for all of them: an unknown unit
// read as "a conversion between two different kinds of units (like a length and a mass)". Driven on
// BOTH surfaces because the issue is that they agree on the wrong thing — the pill says it, and so
// does the edit dialog the user opens to repair it, so a fix proved on one proves nothing about the
// other. The dialog's preview is exercised through its own live field, not by calling its helpers.
test('#1500 convert() names the failure it actually had, on the pill and in the repair dialog', { skip: skip() }, async () => {
  const pg = await fresh();
  const CASES = [
    { src: 'convert(12, m2, ft2)',   reason: 'unknown unit',   says: /a unit this document does not know, "m2"/ },
    { src: 'convert(10, blorp, kg)', reason: 'unknown unit',   says: /a unit this document does not know, "blorp"/ },
    { src: 'convert(10, km, kg)',    reason: 'convert',        says: /different kinds of units/ },
    { src: 'convert(budgt, km, m)',  reason: 'convert amount', says: /amount is not a number/ },
    { src: 'convert(10, km)',        reason: 'convert parts',  says: /wrong number of parts/ },
  ];

  // SURFACE 1 — the pill
  const pills = await pg.evaluate((cases) => {
    const mk = (t) => { const n = mkNode(t); n.type = 'ul'; return n; };
    const nodes = cases.map((cse, i) => mk(`P${i} {= ${cse.src}}`)).concat(mk('OK {= convert(10, km, m)}'));
    root.children = nodes; nodes.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    nodes.forEach(n => promoteInlineShorthand(n));
    buildIndex(root, null); markDirty(); render();
    return {
      rows: [...document.querySelectorAll('.math-roll')].map(e => ({
        cls: e.className, shown: e.querySelector('.math-result')?.textContent || '',
        aria: e.getAttribute('aria-label') || '',
      })),
      screen: document.body.innerText,
    };
  }, CASES);

  assert.equal(pills.rows.length, CASES.length + 1, 'one pill per case, plus the working one');
  CASES.forEach((cse, i) => {
    assert.match(pills.rows[i].cls, /math-err/, `${cse.src} must still be a loud error pill`);
    assert.equal(pills.rows[i].shown, `#ERR (${cse.reason})`, `${cse.src} names its own failure`);
    assert.match(pills.rows[i].aria, cse.says, `${cse.src} explains its own failure`);
  });
  const last = pills.rows[CASES.length];
  assert.doesNotMatch(last.cls, /math-err/, 'a good conversion is untouched');
  assert.equal(last.shown, '10,000');

  // exactly ONE pill may claim a dimension mismatch, and it is the one that has one
  const claimingMismatch = pills.rows.filter(r => /different kinds of units/.test(r.aria));
  assert.equal(claimingMismatch.length, 1, `only the real mismatch may say so, got ${claimingMismatch.length}`);
  assert.match(claimingMismatch[0].aria, /convert\(10, km, kg\)/, 'and it is the km-to-kg one');
  // no internal marker may reach the reader
  assert.doesNotMatch(pills.screen, /#ERR_(UNIT|CONV)/, 'the sentinel is internal and must never be on screen');

  // SURFACE 2 — the repair dialog, driven through its own field
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.keyboard.type('@math', { delay: 14 }); await pg.waitForTimeout(650);
  await pg.evaluate(() => document.querySelector('#io-card .builder-insert-btn')?.click());
  await pg.waitForTimeout(700);
  const field = await pg.evaluate(() => {
    const el = [...document.querySelectorAll('#io-card input, #io-card textarea')].find(e => !/builder-search/.test(e.className));
    return !!el;
  });
  assert.ok(field, 'the math dialog offers an expression field');

  for (const cse of CASES) {
    const line = await pg.evaluate((src) => {
      const el = [...document.querySelectorAll('#io-card input, #io-card textarea')].find(e => !/builder-search/.test(e.className));
      el.value = src;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return document.querySelector('#io-card .io-preview-bad')?.textContent || '(no error line)';
    }, cse.src);
    assert.match(line, cse.says, `the repair dialog must agree with the pill for ${cse.src}, got ${JSON.stringify(line)}`);
    assert.doesNotMatch(line, /#ERR_(UNIT|CONV)/, 'and never show the internal marker');
  }
  await pg.close();
});

// 57. #1501 — `{3x {a|b}}` (the colon-less form) had its INNER brace promoted and its outer left
// literal: `{3x [[grammar:key]]}`, rendered `{3x a}`, no cue. Driven because every part of the harm
// is on the real commit path: the shred needs promoteInlineShorthand's descent, the false success
// needs the first-pill nudge (which only fires on a genuine commit, not a direct promote call), and
// the corruption only appears one step LATER, when the user adds the missing colon.
test('#1501 a colon-less generate keyword survives whole, and the repair does not corrupt the point', { skip: skip() }, async () => {
  const pg = await fresh();
  const type = async (text) => {
    await pg.evaluate(() => {
      const c = document.querySelector('.node-content[data-id]');
      const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
      window.__live = []; const el = document.getElementById('a11y-live');
      new MutationObserver(() => window.__live.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
    });
    await pg.keyboard.type(text, { delay: 12 });
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(2200);   // past NUDGE_YIELD_MS, so a first-pill nudge would have landed
  };
  await type('M2 {3x {a|b}}');

  const after = await pg.evaluate(() => ({
    text: root.children[0].text,
    rendered: document.querySelector('.node-content')?.innerText.replace(/\s+/g, ' ').trim(),
    attempt: !!document.querySelector('.brace-attempt'),
    said: window.__live.filter(Boolean),
  }));
  assert.equal(after.text, 'M2 {3x {a|b}}', 'the form must survive whole, not be taken apart around a promoted inner pill');
  assert.doesNotMatch(after.text, /\[\[grammar:/, 'nothing inside it may be promoted');
  assert.equal(after.rendered, 'M2 {3x {a|b}}', 'and it reads back as what was typed');
  assert.equal(after.attempt, true, 'it carries the attempt cue, the way {rule x {a|b}} already does');
  assert.ok(after.said.some(m => /needs a colon after 3x/.test(m)),
    `the cue must say what is wrong, got ${JSON.stringify(after.said)}`);
  for (const m of after.said) assert.doesNotMatch(m, /Nice, that is a live pill/,
    'a form that failed must never be announced as a success (P4-1)');

  // THE REPAIR: add the missing colon, the way a person would. This is where the old behaviour
  // baked the raw token into the visible text and into the Markdown export.
  await pg.evaluate(() => {
    const c = document.querySelector('.node-content[data-id]');
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
    setCaretByOffset(c, editableText(c).indexOf('3x') + 2);
  });
  await pg.waitForTimeout(200);
  await pg.keyboard.type(':', { delay: 20 });
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(900);

  const fixed = await pg.evaluate(() => ({
    text: root.children[0].text,
    rendered: document.querySelector('.node-content')?.innerText.replace(/\s+/g, ' ').trim(),
    md: toMarkdown(root).split('\n').filter(Boolean)[0],
  }));
  assert.match(fixed.text, /^M2 \[\[grammar:[a-z0-9]+\]\]$/, 'the repaired form promotes to ONE pill');
  assert.match(fixed.rendered, /^M2 [ab] [ab] [ab]$/,
    `the repeat must emit its template three times, got ${JSON.stringify(fixed.rendered)}`);
  assert.doesNotMatch(fixed.rendered, /\[\[grammar:/, 'never the raw token on screen');
  assert.match(fixed.md, /^- M2 [ab] [ab] [ab]$/,
    `and the export carries values, not tokens, got ${JSON.stringify(fixed.md)}`);
  await pg.close();
});

// 58. #1502 — a repeating point completed OUTSIDE an edit session lost its recurrence for good.
// rollForwardRepeat was wired into exitEdit and toggleTaskInNode only, so the state-badge picker,
// the bulk cycle chord and the row-cursor state command each flipped the point to done and left its
// schedule where it was, with no cue. The split was display-mode vs edit-mode, which is not a
// distinction a user can see: Ctrl+Shift+S meant "reschedule" while editing and "end this forever"
// from the row cursor. Driven through the real doors, because the model-level roll is unit-tested
// and what this proves is that each DOOR reaches it.
test('#1502 every door that completes a repeating point rolls it forward', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    const out = {};
    const seed = () => {
      const n = mkNode('#WAITING Water plants'); n.type = 'todo';
      const filler = mkNode('Filler'); filler.type = 'ul';
      root.children = [n, filler];
      root.children.forEach(x => { nodeMap.set(x.id, x); parentMap.set(x.id, root); });
      buildIndex(root, null);
      setDateProp(n, 'due', formatEpochDays(dueDateToday()));
      setProp(n, 'repeat', 'every 3 days');
      n.checked = todoDoneFromText(n.text);
      markDirty(); render();
      return n;
    };
    const snap = n => ({
      due: (n.props || []).find(p => p.key.toLowerCase() === 'due')?.val ?? null,
      checked: n.checked, text: n.text,
    });
    out.today = formatEpochDays(dueDateToday());
    out.next = formatEpochDays(dueDateToday() + 3);
    out.before = snap(seed());

    // DOOR A — the state-badge picker's own apply path
    let n = seed();
    showTodoPicker(n.id, document.querySelector('.node-content'));
    const doneRow = [...document.querySelectorAll('#bpop .tp-chip')]
      .find(e => (e.innerText || e.textContent || '').trim() === 'DONE');
    out.pickerOfferedDone = !!doneRow;
    // the chip is wired on mousedown+preventDefault, the caret invariant -- a plain .click() never
    // reaches its handler, which is exactly the kind of miss a source pin cannot catch.
    if (doneRow) doneRow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    out.A_picker = snap(nodeById(n.id));

    // DOOR B — the bulk cycle over a selection
    n = seed();
    applyTodoCycleToNodes([n], t => setTodoState(t, 'DONE'));
    out.B_bulkCycle = snap(n);

    // DOOR C — the row-cursor state command
    n = seed();
    applyBlockCmd('state:DONE', n.id, n, document.querySelector('.node-content'), {});
    out.C_rowCursor = snap(nodeById(n.id));
    return out;
  });

  assert.equal(r.before.due, r.today, 'precondition: it is due today and not yet done');
  assert.equal(r.before.checked, false);
  assert.equal(r.pickerOfferedDone, true, 'precondition: the picker really offers DONE');

  for (const door of ['A_picker', 'B_bulkCycle', 'C_rowCursor']) {
    assert.equal(r[door].due, r.next, `${door}: the schedule must advance by the cadence, not stay put`);
    assert.equal(r[door].checked, false, `${door}: and the point must re-open, not stay done`);
    assert.doesNotMatch(r[door].text, /#DONE/, `${door}: the done marker must be cleared from the text`);
  }
  await pg.close();
});

// 59. #1503 — a rollup computed AROUND a hole rendered in the plain success chrome. Driven because
// the defect IS the rendered comparison: the reported pill was identical to an all-numeric control
// in className, title, border and aria, so the only way to show the fix is to render both and
// compare them. The helper knew all along; the pill never asked.
test('#1503 a partial total says so, and a correct one is left alone', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    const build = (expr, kids, deep) => {
      const parent = mkNode('Kitchen refit {= ' + expr + '}');
      parent.children = kids.map(([t, v]) => { const n = mkNode(t); n.type = 'ul'; if (v !== null) setProp(n, 'cost', v); return n; });
      if (deep) { const g = mkNode('Deep'); g.type = 'ul'; setProp(g, 'cost', 'TBC'); parent.children[0].children = [g]; }
      root.children = [parent];
      const attach = (n, p) => { n.type = n.type || 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, p); (n.children || []).forEach(k => attach(k, n)); };
      root.children.forEach(n => attach(n, root));
      buildIndex(root, null); markDirty(); render(); promoteInlineShorthand(parent);
      buildIndex(root, null); markDirty(); render();
      const pill = document.querySelector('.math-roll');
      const cs = pill ? getComputedStyle(pill) : null;
      return {
        cls: pill?.className, aria: pill?.getAttribute('aria-label'), title: pill?.title,
        value: pill?.querySelector('.math-result')?.textContent,
        mark: pill?.querySelector('.math-empty-mark')?.textContent ?? null,
        border: cs ? `${cs.borderStyle} ${cs.borderColor}` : null,
        hasExplain: !!pill?.querySelector('.math-explain'),
        hasPencil: !!pill?.querySelector('.math-edit'),
      };
    };
    const HOLE = [['Cabinets', '1200'], ['Worktop', '£850'], ['Install', '600']];
    const ALL  = [['Cabinets', '1200'], ['Worktop', '850'], ['Install', '600']];
    return {
      hole: build('sum(cost)', HOLE),
      allNumeric: build('sum(cost)', ALL),
      noProp: build('sum(cost)', [['Cabinets', '1200'], ['Notes', null], ['Install', '600']]),
      // a real hole AND an ordinary no-cost point together: the mark must count only the hole.
      // Without this case the count is unobservable -- auditAgg's `missing` mixes both reasons, and
      // a cue that counted them all would overstate on almost every real rollup.
      mixed: build('sum(cost)', [['Cabinets', '1200'], ['Worktop', '£850'], ['Notes', null]]),
      deep: build('sum(cost, subtree)', [['Cabinets', '1200'], ['Install', '600']], true),
    };
  });

  // the reported case: the total is PARTIAL and the pill says so
  assert.match(r.hole.cls, /math-partial/, 'a rollup with a skipped value must not wear the success chrome');
  assert.equal(r.hole.value, '1,800', 'the partial total is still shown, not withheld');
  assert.equal(r.hole.mark, '1 not counted', 'and a mark says so in words, not colour alone');
  assert.match(r.hole.aria, /partial total/, 'assistive tech is told too');
  assert.match(r.hole.aria, /Worktop/, 'and the offender is named');
  assert.ok(r.hole.hasExplain && r.hole.hasPencil, 'it keeps its Explain and edit doors');

  // the control: identical input minus the hole, and it must be untouched
  assert.doesNotMatch(r.allNumeric.cls, /math-partial/, 'a correct total keeps the plain chrome');
  assert.equal(r.allNumeric.value, '2,650');
  assert.equal(r.allNumeric.mark, null);
  // the two must now be DISTINGUISHABLE, which is the whole finding
  assert.notEqual(r.hole.cls, r.allNumeric.cls, 'the broken and correct pills must not look identical');
  assert.notEqual(r.hole.border, r.allNumeric.border, 'including to the eye, not only to a screen reader');

  // a point with NO cost is the ordinary case and must not be cued
  assert.doesNotMatch(r.noProp.cls, /math-partial/, 'a child with no cost at all is not a hole');
  assert.equal(r.noProp.mark, null);

  // a real hole beside an ordinary no-cost point: only the hole counts
  assert.match(r.mixed.cls, /math-partial/, 'the real hole still cues');
  assert.equal(r.mixed.mark, '1 not counted',
    'a point with no cost is not "not counted" -- counting it would overstate on almost every rollup');
  assert.match(r.mixed.aria, /Worktop/, 'and the named offender is the hole, not the unpriced point');
  assert.doesNotMatch(r.mixed.aria, /Notes/, 'the unpriced point is not blamed');

  // #1503: a subtree rollup sees a hole three levels down, where it is hardest to spot by eye
  assert.match(r.deep.cls, /math-partial/, 'a scoped rollup must see the hole its scope reaches');
  assert.equal(r.deep.mark, '1 not counted');
  await pg.close();
});

// 60. #1536 -- `fallbackCopy` borrowed focus and never gave it back, so every copy taken on the
// clipboard API's FAILURE path ended with the caret on <body>: in a contenteditable outliner that is
// the caret gone, arrows dead, the next keystroke nowhere. Driven, and driven with the rejection
// FORCED: locally `navigator.clipboard.writeText` resolves, the fallback never runs, and the defect
// is invisible -- which is exactly how it reached CI as a one-row failure in check 37 and nothing
// else. Forcing the rejection is the only way a check can see the path it is about.
test('#1536 a copy that falls back to execCommand gives the caret back', { skip: skip() }, async () => {
  const CARET = 6;
  const setup = async (mode) => {
    const pg = await fresh();
    await pg.evaluate((m) => {
      // the three environments the fallback exists for: a denied or insecure write, no API at all,
      // and the ordinary success that must stay ordinary. ALL THREE are stubbed, the success
      // included -- the real API resolves on a developer machine and REJECTS in CI (headless, the
      // document does not hold focus), so an unstubbed "control" is a control in one environment
      // and a second copy of the reject case in the other. That is not a hypothetical: it is how
      // this check first went red in CI while passing locally.
      if (m === 'resolve') navigator.clipboard.writeText = () => Promise.resolve();
      if (m === 'reject') navigator.clipboard.writeText = () => new Promise((_, rej) => setTimeout(() => rej(new Error('Document is not focused')), 5));
      if (m === 'absent') { try { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); } catch (_) {} }
      const mk = t => { const n = mkNode(t); n.type = 'ul'; return n; };
      root.children = [mk('Damage to the orc'), mk('Second point')];
      root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
      buildIndex(root, null); markDirty(); render();
      const c = document.querySelectorAll('.node-content')[0];
      c.focus(); activeContentId = c.dataset.id;
      // put the caret in the MIDDLE, so a restore that only refocuses is distinguishable from one
      // that puts the insertion point back where it was
      const sel = window.getSelection(), r = document.createRange();
      r.setStart(c.firstChild, 6); r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
    }, mode);
    await pg.waitForTimeout(320);
    return pg;
  };
  const land = (pg) => pg.evaluate(async () => {
    const idle = () => new Promise(r => setTimeout(r, 100));
    for (let n = 0; n < 20 && document.activeElement.tagName === 'BODY'; n++) await idle();
    await idle(); await idle();                        // settle: catch a LATE drop back to <body>
    const ae = document.activeElement;
    return {
      tag: ae.tagName,
      cls: String(ae.className || ''),
      // the APP's logical offset, not the DOM one: a raw startOffset is relative to whichever
      // boundary node the selection happens to sit on, so two paths that put the caret in the same
      // place can report 0 and 17. getCaretOffset is the model the app itself edits against.
      offset: ae.classList?.contains('node-content') ? getCaretOffset(ae) : null,
      said: (document.getElementById('flash-hint')?.textContent || '').trim(),
    };
  });

  // ── route A: the keyboard door, where the caret never left the point
  for (const mode of ['reject', 'absent', 'resolve']) {
    const pg = await setup(mode);
    await pg.keyboard.press('Control+Shift+L');
    const r = await land(pg);
    await pg.close();
    assert.notEqual(r.tag, 'BODY', `${mode}: a copy must not end with focus on <body>`);
    assert.match(r.cls, /node-content/, `${mode}: focus goes back to the point, not somewhere else on the page`);
    assert.equal(r.offset, CARET,
      `${mode}: and the caret goes back WHERE it was -- refocusing alone collapses to the start of the point`);
    assert.match(r.said, /Link copied/, `${mode}: and the copy still reports success (P4)`);
  }

  // ── route B: the point-actions row, which is the case CI actually caught
  const viaMenu = async (mode) => {
    const pg = await setup(mode);
    await pg.keyboard.press('Shift+F10'); await pg.waitForTimeout(450);
    const found = await pg.evaluate(() => {
      const el = [...document.querySelectorAll('#bpop .bpop-type, #bpop .cmd-item')]
        .find(e => (e.innerText || '').split('\n')[0].trim() === 'Copy link');
      if (!el) return false; el.focus(); return document.activeElement === el;
    });
    await pg.keyboard.press('Enter');
    const r = await land(pg);
    await pg.close();
    return { found, ...r };
  };
  const control = await viaMenu('resolve');
  assert.equal(control.found, true, 'precondition: the Copy link row exists and takes focus');
  assert.match(control.cls, /node-content/, 'precondition: the working path lands back in the point');
  for (const mode of ['reject', 'absent']) {
    const r = await viaMenu(mode);
    assert.equal(r.found, true, `${mode}: precondition -- the Copy link row exists and takes focus`);
    assert.notEqual(r.tag, 'BODY',
      `${mode}: the row that CI caught -- a menu copy must not leave the keyboard on <body>`);
    assert.match(r.cls, /node-content/, `${mode}: and focus is back in the point, as on the working path`);
    assert.match(r.said, /Link copied/, `${mode}: and the copy still reports success`);
  }
  // NO CARET PIN ON THIS ROUTE, deliberately, and it took two CI runs to earn that sentence. Opening
  // the menu takes focus OUT of the point, so what the fallback finds to borrow from depends on
  // whether the rejection beats the menu's own hand-back: win it and the caret is saved from the
  // point, lose it and there is nothing yet to save. Both orderings are real (with no clipboard API
  // the fallback runs synchronously, inside the row's handler), no delay makes the race safe, and
  // the two CI failures here reported OPPOSITE offsets on the same code. That is a measurement of
  // scheduling, not of the app. The caret claim belongs to route A, where the point never loses
  // focus and there is no race to lose -- and it is pinned there exactly, in all three environments.
  // What this route owns is the defect CI actually caught, asserted above: focus, never <body>.
});

// 61. #1504 — a repeat phrase with NO due and NO start date is inert: rollForwardRepeat has always
// bailed on it, and every surface that could have said so stayed quiet. The chip read "Recurring",
// the Schedule dialog promised "Advances when you complete it", and ticking the box completed the
// point and ended the recurrence in silence. Driven because two of the three surfaces are chrome a
// source pin cannot read (a chip's rendered class/title/aria, a live preview that depends on two
// OTHER fields' current values), and the third is a cross-field listener that only exists at runtime.
test('#1504 an unanchored repeat says so on the chip, in the dialog, and at completion', { skip: skip() }, async () => {
  const pg = await fresh();
  const r = await pg.evaluate(() => {
    const out = {};
    const today = formatEpochDays(dueDateToday());
    out.today = today;
    const seed = (props) => {
      const n = mkNode('#TODO Water plants'); n.type = 'todo';
      const filler = mkNode('Filler'); filler.type = 'ul';
      root.children = [n, filler];
      root.children.forEach(x => { nodeMap.set(x.id, x); parentMap.set(x.id, root); });
      buildIndex(root, null);
      for (const [k, v] of props) (k === 'due' || k === 'start') ? setDateProp(n, k, v) : setProp(n, k, v);
      n.checked = todoDoneFromText(n.text);
      markDirty(); render();
      return n;
    };
    const chipOf = () => {
      const el = document.querySelector('.prop-chip.prop-repeat');
      return el ? { cls: el.className, title: el.title, aria: el.getAttribute('aria-label') } : null;
    };

    // ── surface 1: the property chip, with its three neighbours as controls
    out.chipDateless  = (seed([['repeat', 'every week']]), chipOf());
    out.chipDue       = (seed([['repeat', 'every week'], ['due', today]]), chipOf());
    out.chipStartOnly = (seed([['repeat', 'every week'], ['start', today]]), chipOf());
    out.chipBadPhrase = (seed([['repeat', 'every blue moon']]), chipOf());

    // ── surface 2: the real Schedule dialog, driven through its own fields
    const dn = seed([['repeat', 'every week']]);
    openDueDateDialog(dn.id);
    const q = s => document.querySelector(`[aria-label="${s}"]`);
    const preview = () => { const i = q('Repeat schedule'); return i ? i.parentElement.lastElementChild : null; };
    const say = () => (preview()?.textContent || '').trim();
    const type = (field, v) => { const i = q(field); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
    out.dlgOpened = !!q('Repeat schedule');
    out.dlgPrefilledDue = q('Due date')?.value ?? null;   // the dialog prefills today when nothing is set
    out.dlgWithDue = say();
    type('Due date', '');                                  // clear it, which is how the reported state is reached
    out.dlgCleared = say();
    out.dlgClearedColor = preview()?.style.color ?? null;
    type('Start date', today);                             // a START date is enough on its own
    out.dlgStartOnly = say();
    type('Start date', '');
    out.dlgBack = say();                                   // and taking it away brings the warning back
    closeIo();

    // ── surface 3: completing it, where the recurrence actually ends
    const flip = (n) => {
      const el = document.getElementById('flash-hint'); if (el) el.textContent = '';
      const w = n.checked; n.text = setTodoState(n.text, 'DONE');
      const rolled = commitTodoDone(n, w);
      return { rolled, checked: n.checked, said: (document.getElementById('flash-hint')?.textContent || '').trim() };
    };
    out.completeDateless = flip(seed([['repeat', 'every week']]));
    out.completeDated    = flip(seed([['repeat', 'every week'], ['due', today]]));
    out.completePlain    = flip(seed([['due', today]]));
    return out;
  });

  // surface 1 — the chip
  assert.ok(r.chipDateless, 'precondition: a repeat property renders a chip');
  assert.match(r.chipDateless.cls, /prop-repeat-bad/, 'an inert repeat must not wear the healthy chrome');
  assert.match(r.chipDateless.title, /no date to advance from/i, 'and it says why, in the tooltip');
  assert.match(r.chipDateless.aria, /no date to advance from/i, 'and to assistive tech, not by colour alone (P3)');
  // the controls: each of these advances, so none may be flagged
  for (const k of ['chipDue', 'chipStartOnly']) {
    assert.doesNotMatch(r[k].cls, /prop-repeat-bad/, `${k}: an anchored repeat advances, so flagging it is a false alarm`);
    assert.match(r[k].title, /^Recurring\./, `${k}: it keeps the plain promise`);
    assert.doesNotMatch(r[k].aria, /no date/, `${k}: and says nothing about dates`);
  }
  // the two failures are different failures and must not be told the same way (P1/P4)
  assert.match(r.chipBadPhrase.cls, /prop-repeat-bad/, 'precondition: an unparseable phrase was already flagged');
  assert.notEqual(r.chipBadPhrase.title, r.chipDateless.title,
    '"we could not read this phrase" and "this phrase has nothing to advance from" need different remedies');
  assert.notEqual(r.chipBadPhrase.aria, r.chipDateless.aria, 'including for a screen reader');

  // surface 2 — the dialog, while both dates are still one keystroke away
  assert.equal(r.dlgOpened, true, 'precondition: the Schedule dialog really opened');
  assert.equal(r.dlgPrefilledDue, r.today, 'precondition: it prefills today, so the promise starts true');
  assert.match(r.dlgWithDue, /Advances when you complete it/, 'with a due date it still promises the rollover');
  assert.doesNotMatch(r.dlgCleared, /Advances when you complete it/,
    'clearing the last date must retract the promise, not keep printing it');
  assert.match(r.dlgCleared, /No date to advance from/, 'and say what is missing');
  assert.match(r.dlgCleared, /every week/i, 'while still confirming what it understood, so the field is not just an error');
  assert.notEqual(r.dlgClearedColor, '', 'the warning is styled as one');
  assert.match(r.dlgStartOnly, /Advances when you complete it/,
    'a start date alone is a real anchor, so the warning must clear on it');
  assert.match(r.dlgBack, /No date to advance from/, 'and return when the anchor is taken away again');

  // surface 3 — completion
  assert.equal(r.completeDateless.rolled, false, 'precondition: it genuinely cannot advance');
  assert.equal(r.completeDateless.checked, true, 'the completion itself still happens');
  assert.match(r.completeDateless.said, /does not come back/,
    'but the recurrence ending is announced, instead of returning false in silence');
  assert.match(r.completeDateless.said, /due or start date/, 'and the remedy is named');
  // the controls: neither of these has a dead recurrence, so neither may hear about one
  assert.equal(r.completeDated.rolled, true, 'an anchored repeat still rolls forward');
  assert.match(r.completeDated.said, /Rescheduled/, 'and says so, as it always did');
  assert.doesNotMatch(r.completeDated.said, /does not come back/, 'never both messages');
  assert.doesNotMatch(r.completePlain.said, /does not come back/,
    'a one-off to-do has no recurrence to lose, so completing it must stay quiet about repeats');
  await pg.close();
});

// 62. #1505 — an empty-bodied keyword pill is DELETED by the #1213 stub guard, and the app told the
// reader the opposite while they typed it. Driven, and it can only be driven: the contradiction is
// between something said at one moment (the live region, as the `}` lands) and something done at a
// later one (promotion, on exit). No source pin spans those two moments, and neither half is wrong
// on its own. The census matters more than the reported case here: the report named {= }, and
// driving the family found seven that lied and five that said nothing at all.
test('#1505 a brace that is about to be deleted says so, and one that stays still says it stays', { skip: skip() }, async () => {
  const drive = async (body) => {
    const pg = await fresh();
    await pg.evaluate(() => {
      const n = mkNode(''); n.type = 'ul';
      root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
      buildIndex(root, null); markDirty(); render();
      const c = document.querySelectorAll('.node-content')[0];
      c.focus(); activeContentId = c.dataset.id;
      const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
    });
    await pg.waitForTimeout(200);
    await pg.keyboard.type('Subtotal {' + body + '}');   // the announcement fires on the closing }
    await pg.waitForTimeout(350);
    const said = await pg.evaluate(() => (document.getElementById('a11y-live')?.textContent || '').trim());
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(350);
    const after = await pg.evaluate(() => ({
      text: root.children[0].text,
      attempts: document.querySelectorAll('.brace-attempt').length,
    }));
    await pg.close();
    return { said, ...after };
  };

  // The whole deleted family, read out of the app's own list so a keyword added later is driven too.
  const KEYWORDS = ['=', 'roll', 'count', 'query', 'shuffle', 'cycle', 'once', 'stopping',
                    'markov', 'oracle', 'seq', 'rule'];
  const seen = new Set();
  for (const kw of KEYWORDS) {
    const body = kw === '=' ? '= ' : `${kw}: `;
    const r = await drive(body);
    // it really is deleted -- the precondition, and the #1213 behaviour this must not change
    assert.equal(r.text, 'Subtotal ', `{${body}} must still be consumed (that half is deliberate, #1213)`);
    // and it was never silent about it: five of these said nothing at all before
    assert.ok(r.said, `{${body}} is deleted, so it must not be deleted in silence`);
    assert.match(r.said, /removed when you leave the point/,
      `{${body}} must say the text goes, not that it stays`);
    assert.doesNotMatch(r.said, /stays plain text/,
      `{${body}} announced the opposite of what the next keystroke did`);
    // its own advice, not a neighbour's: three of these were told about decks
    assert.ok(r.said.includes(kw === '=' ? '{= ' : `{${kw}`),
      `{${body}} must show its own form, got: ${r.said}`);
    assert.ok(!seen.has(r.said), `{${body}} shares its sentence with another keyword: ${r.said}`);
    seen.add(r.said);
  }

  // THE CONTROL, and the reason the report could name the contradiction at all: near-identical,
  // classified the same way, and it STAYS. Measure the negative case or "complete the set" work
  // lands on a member that never needed it.
  const stays = await drive('= 1200 + ');
  assert.equal(stays.text, 'Subtotal {= 1200 + }', 'precondition: this one really does stay');
  assert.equal(stays.attempts, 1, 'and wears the .brace-attempt cue');
  assert.match(stays.said, /It stays plain text/, 'so it must still be told it stays');
  assert.doesNotMatch(stays.said, /removed/, 'and never that it will be deleted');
});

// 63. #1506 — a dialog Save that REFUSES was a total no-op: an ENABLED button, pressed, writing
// nothing, saying nothing, changing nothing on screen. Driven, because the finding IS what a press
// does: the validity cores are already tested and prove nothing about whether pressing Save tells
// anyone it refused. The census matters as much as the case: the family is the dialogs whose commit
// stays ENABLED, and the two that DISABLE theirs instead are a different, visible pattern.
test('#1506 an enabled Save that refuses says why, and a valid one still saves', { skip: skip() }, async () => {
  const pg = await fresh();
  const setup = () => pg.evaluate(() => {
    const n = mkNode('Dentist'); n.type = 'ul';
    root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
    buildIndex(root, null); markDirty(); render();
    return n.id;
  });
  const commit = () => pg.evaluate(async () => {
    const btn = [...document.querySelectorAll('#io-card button')]
      .filter(x => !/cancel|close/i.test(x.textContent || '') && !x.className.includes('io-x')).pop();
    const live = document.getElementById('a11y-live'); if (live) live.textContent = '';
    const out = { label: (btn?.textContent || '').trim(), disabled: !!btn?.disabled };
    btn?.click();
    await new Promise(r => setTimeout(r, 150));            // announce() lands on the next frame
    const ae = document.activeElement;
    return { ...out,
      said: (document.getElementById('a11y-live')?.textContent || '').trim(),
      focusName: ae?.getAttribute?.('aria-label') || ae?.tagName,
      focusInvalid: ae?.getAttribute?.('aria-invalid'),
      // #io-card is never removed, only emptied: openness is the backdrop's `on` class
      stillOpen: document.getElementById('io-back')?.classList.contains('on') === true,
      props: JSON.stringify((nodeById(activeContentId) || root.children[0]).props || []),
    };
  });
  const open = (fn, id) => pg.evaluate(([f, i]) => { window[f](i); }, [fn, id]);
  const settle = () => pg.waitForTimeout(150);             // the dialog's open-time focus rAF
  const type = (sel, v) => pg.evaluate(([s, val]) => {
    const d = document.querySelector(s); d.value = val; d.dispatchEvent(new Event('input', { bubbles: true }));
  }, [sel, v]);
  const close = () => pg.evaluate(() => { try { closeIo(); } catch (_) {} });

  const id = await setup();

  // ── the reported case: an impossible date the parser rejects
  await open('openDueDateDialog', id); await settle();
  await type('[aria-label="Due date"]', '2026-02-30');
  const due = await commit();
  assert.equal(due.disabled, false, 'precondition: the button really is enabled, so pressing it is an action');
  assert.ok(due.said, 'an enabled Save that writes nothing must not do it in silence');
  assert.match(due.said, /^Not saved\./, 'and it leads with the outcome, not the diagnosis');
  assert.match(due.said, /Due date/, 'naming which of the three fields refused');
  assert.match(due.said, /YYYY-MM-DD/, 'and the same repair the typed door already offers');
  assert.equal(due.focusName, 'Due date', 'focus lands on the offending field');
  assert.equal(due.focusInvalid, 'true', 'and that field announces as invalid on arrival');
  assert.equal(due.props, '[]', 'nothing was written');
  assert.equal(due.stillOpen, true, 'and the dialog stays open to be fixed');
  await close();

  // ── the sibling field, which must name ITSELF and not borrow the date wording
  await open('openDueDateDialog', id); await settle();
  await type('[aria-label="Repeat schedule"]', 'every weekday');
  const rep = await commit();
  assert.match(rep.said, /^Not saved\./, 'the repeat refusal is announced too');
  assert.match(rep.said, /repeat phrase/, 'in its own words, not the date field\'s');
  assert.equal(rep.focusName, 'Repeat schedule', 'and focus lands on the field that refused');
  assert.equal(rep.focusInvalid, 'true');
  assert.notEqual(rep.said, due.said, 'two different refusals must not read identically');
  // and the mark clears the moment the mistake does, or the next focus landing announces a lie
  await type('[aria-label="Repeat schedule"]', 'every week');
  const cleared = await pg.evaluate(() =>
    document.querySelector('[aria-label="Repeat schedule"]').getAttribute('aria-invalid'));
  assert.equal(cleared, null, 'a fixed field stops claiming to be invalid');
  await close();

  // ── the sibling DIALOG: the issue said treat the family, and this one shared the silence
  await open('openPropsDialog', id); await settle();
  await pg.evaluate(() => {
    const k = document.querySelectorAll('#io-card .key-in'), v = document.querySelectorAll('#io-card .val-in');
    k[0].value = 'due'; k[0].dispatchEvent(new Event('input', { bubbles: true }));
    v[0].value = '2026-02-30'; v[0].dispatchEvent(new Event('input', { bubbles: true }));
  });
  const props = await commit();
  assert.match(props.said, /^Not saved\./, 'the Properties dialog refused in silence too');
  assert.match(props.said, /due/, 'and names WHICH property, since this dialog can hold several dates');
  assert.equal(props.focusInvalid, 'true', 'the offending value field announces as invalid');
  await close();

  // ── THE CONTROL. A valid Save must still save, and must say nothing about refusing.
  await open('openDueDateDialog', id); await settle();
  await type('[aria-label="Due date"]', '2026-09-01');
  await type('[aria-label="Repeat schedule"]', '');
  const ok = await commit();
  assert.doesNotMatch(ok.said || '', /Not saved/, 'a Save that works is never told it refused');
  assert.equal(ok.stillOpen, false, 'and the dialog closes');
  const written = await pg.evaluate(() =>
    (root.children[0].props || []).map(p => p.key + '=' + p.val).join(','));
  assert.match(written, /due=2026-09-01/, 'and the date is actually written');
  await pg.close();
});

// 64. #1507 — deleting a pill's shorthand in edit mode prunes its sidecar record; undo then restored
// the TEXT, bringing the [[type:key]] token back with nothing behind it. The result was a
// "(missing data)" pill that in-row editing could not repair and that SURVIVED SAVE. Driven, because
// the defect spans three real moments no source pin joins: a keystroke edit, a prune on exit, and an
// undo. The cores are pure and were already right; what was wrong is what the sequence produced.
test('#1507 undo brings back a deleted pill whole, and redo takes it away again', { skip: skip() }, async () => {
  // Every sidecar a [[type:key]] token can name. The report named math; driving the family found
  // seven more, which is expected once the cause is "prune only ever deletes" rather than anything
  // math-specific -- and is exactly why the fix is at the prune and not at one pill type.
  const CASES = [
    ['{= 2+2}', 'math'], ['{2d6}', 'dice'], ['{a | b}', 'grammar'], ['{x := 1d6}', 'vars'],
    ['{query: is:todo}', 'query'], ['{seq s: a | b}', 'seq'], ['{3 to 9}', 'est'],
    ['{markov: a→b, b→c}', 'markov'],
  ];
  // node.text holds the UNFOLDED buffer while a row is in edit mode, so every read below waits for
  // the edit session to actually end rather than sampling at a fixed delay. Measured: at 250ms the
  // grammar case was still unfolded and read as "Quote {a | b}" while its record already existed.
  // LEAVE the edit session, rather than "press Escape once". Typing a body can leave an inline menu
  // open -- `{query: is:` opens the search completions -- and the first Escape is then spent closing
  // that, so the row is still editing and node.text is still the unfolded buffer. Bounded, and a row
  // that will not commit fails the assertion that follows rather than hanging.
  const commitEdit = async (pg) => {
    for (let i = 0; i < 4; i++) {
      if (!await pg.evaluate(() => !!document.querySelector('.node-content[data-editing]'))) break;
      await pg.keyboard.press('Escape');
      await pg.waitForTimeout(200);
    }
    await pg.waitForTimeout(100);
  };
  for (const [shorthand, sidecar] of CASES) {
    const pg = await fresh();
    // the shared helper, which enters a REAL edit session (enterEdit) rather than just focusing the
    // element. Without that the row never carries data-editing, so Escape commits nothing and every
    // read below sees the unfolded buffer instead of the folded text.
    await blankWithCaret(pg);
    await pg.keyboard.type('Quote ' + shorthand);
    await commitEdit(pg);
    const made = await pg.evaluate(sc => ({
      text: root.children[0].text, n: (root.children[0][sc] || []).length,
    }), sidecar);
    assert.equal(made.n, 1, `precondition: {${shorthand}} promoted to a live ${sidecar} record`);
    assert.match(made.text, /\[\[/, `precondition: and left a token in the text (got ${JSON.stringify(made.text)})`);

    // delete the shorthand the way a person does: click in, End, backspace it away
    await pg.evaluate(() => { const c = document.querySelectorAll('.node-content')[0]; c.focus(); c.click(); });
    await pg.waitForTimeout(200);
    await pg.keyboard.press('End');
    for (let i = 0; i < shorthand.length; i++) await pg.keyboard.press('Backspace');
    await commitEdit(pg);
    const gone = await pg.evaluate(sc => ({
      text: root.children[0].text, n: (root.children[0][sc] || []).length,
    }), sidecar);
    assert.equal(gone.text, 'Quote ', `${sidecar}: precondition -- the shorthand is really deleted`);
    assert.equal(gone.n, 0, `${sidecar}: and the prune really dropped the record`);

    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(250);
    await commitEdit(pg);                         // undo focuses back into an edit session
    const undone = await pg.evaluate(sc => ({
      text: root.children[0].text, n: (root.children[0][sc] || []).length,
      bad: document.querySelectorAll('.math-bad,.gr-bad,.var-bad,.dice-bad,.est-bad,.seq-bad,.query-bad,.mk-bad').length,
      md: toMarkdown(root),
    }), sidecar);
    assert.match(undone.text, /\[\[/, `${sidecar}: undo brings the token back`);
    assert.equal(undone.n, 1, `${sidecar}: and the record with it, or the token names nothing`);
    assert.equal(undone.bad, 0, `${sidecar}: so no "(missing data)" pill`);
    // it SURVIVED SAVE before: the export dropped the pill while node.text kept the orphan
    assert.match(undone.md, /Quote /, `${sidecar}: precondition -- the export still has the point`);

    // REDO must take it away again, or the fix trades one asymmetry for another
    await pg.keyboard.press('Control+Shift+z');
    await commitEdit(pg);
    const redone = await pg.evaluate(sc => ({
      text: root.children[0].text, n: (root.children[0][sc] || []).length,
    }), sidecar);
    assert.equal(redone.text, 'Quote ', `${sidecar}: redo removes the shorthand again`);
    assert.equal(redone.n, 0, `${sidecar}: and the record goes with the token, not back to orphaned`);
    await pg.close();
  }
});

// 65. #1508 — the Agenda Month grid's keyboard. A <button> fires `click` on Enter/Space and NEVER
// `mousedown`, so "Show N more points for this day" was a focusable, labelled button that no key
// could operate: the #1021 shape exactly, and precisely what a source pin cannot catch, since the
// handler was present and simply unreachable. Driven for that reason, and because the day cell's
// Enter did not merely no-op -- it DROPPED FOCUS TO <body>.
test('#1508 the day’s expand button and the day cell both answer the keyboard', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    // enough points on one day that the cell overflows and renders the "+N more" control
    const today = formatEpochDays(dueDateToday());
    root.children = [];
    for (let i = 0; i < 15; i++) {
      const n = mkNode('#TODO Task ' + i); n.type = 'todo';
      root.children.push(n); nodeMap.set(n.id, n); parentMap.set(n.id, root);
      setDateProp(n, 'due', today);
      n.checked = todoDoneFromText(n.text);
    }
    buildIndex(root, null); markDirty(); render();
    agendaView = 'month'; openAgenda();
  });
  await pg.waitForTimeout(900);

  const more = await pg.evaluate(() => {
    const el = document.querySelector('.agd-more');
    return el ? { tag: el.tagName, label: el.getAttribute('aria-label') } : null;
  });
  assert.ok(more, 'precondition: the overflowing day renders its "+N more" control');
  assert.equal(more.tag, 'BUTTON', 'precondition: it is a real button, so it is focusable and Enter-able');
  assert.match(more.label, /more point/, 'precondition: and it is labelled for assistive tech');

  const press = async (key) => {
    await pg.evaluate(() => document.querySelector('.agd-more')?.focus());
    const ok = await pg.evaluate(() => document.activeElement === document.querySelector('.agd-more'));
    assert.equal(ok, true, 'precondition: the control takes focus');
    await pg.keyboard.press(key);
    await pg.waitForTimeout(300);
    return pg.evaluate(() => ({
      expanded: document.querySelectorAll('.agd-expanded').length,
      label: document.querySelector('.agd-more')?.getAttribute('aria-label') || null,
    }));
  };
  // Enter expands the day; the control becomes its collapse twin, and Space works there too
  const afterEnter = await press('Enter');
  assert.equal(afterEnter.expanded, 1, 'Enter on the expand button must expand the day');
  assert.match(afterEnter.label || '', /Collapse/, 'and the control becomes its collapse twin');
  const afterSpace = await press('Space');
  assert.equal(afterSpace.expanded, 0, 'Space on the collapse twin must collapse it: both keys, both twins');

  // and the MOUSE path is untouched, which is the half that always worked
  await pg.evaluate(() => document.querySelector('.agd-more')
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })));
  await pg.waitForTimeout(300);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.agd-expanded').length), 1,
    'mousedown still expands, so the keyboard was added beside it and not instead of it');

  // ── the day CELL. Enter used to leave focus on <body>, which is the #1464 class.
  await pg.evaluate(() => {
    _agExpandedDay = null; renderAgenda();
  });
  await pg.waitForTimeout(500);
  const cellInfo = await pg.evaluate(() => {
    const want = calDayLabel(dueDateToday()).split(',')[1].trim().split(' ')[0];   // the current month
    const cells = [...document.querySelectorAll('.agc-cell:not(.oom)')]
      .filter(x => (x.getAttribute('aria-label') || '').includes(want));
    const c = cells.find(x => !x.classList.contains('today')) || cells[0];
    if (!c) return null;
    window.__cell = c; c.setAttribute('tabindex', '0'); c.focus();
    const live = document.getElementById('a11y-live'); if (live) live.textContent = '';
    return { label: c.getAttribute('aria-label'), role: c.getAttribute('role'), focused: document.activeElement === c };
  });
  assert.ok(cellInfo, 'precondition: the current month renders day cells');
  assert.equal(cellInfo.role, 'gridcell', 'precondition: it is the same widget shape the Schedule picker uses');
  assert.equal(cellInfo.focused, true, 'precondition: and it takes focus');

  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(400);
  const acted = await pg.evaluate(() => ({
    ae: String(document.activeElement.className || document.activeElement.tagName),
    live: (document.getElementById('a11y-live')?.textContent || '').trim(),
  }));
  assert.doesNotMatch(acted.ae, /^v-guided$|^BODY$/,
    'Enter on a day cell must not leave the keyboard on <body> with nowhere to go');
  assert.match(acted.ae, /cap-input/, 'it lands in the capture strip, where the point gets typed');
  assert.match(acted.live, /schedule/i, 'and says what it opened, for a reader who cannot see it');
  await pg.close();
});

// 66. #1509 — a search while ZOOMED counted only inside the zoom and said nothing about it. The
// announcement and the empty state both did it. Driven, because the defect is the gap between a
// number and what the reader thinks it covers: the counter was correct for its own scope, so no
// pure test of it could fail, and only a real zoom + a real search produces the misleading pair.
test('#1509 a zoomed search says what the zoom is hiding, and offers the way out', { skip: skip() }, async () => {
  const pg = await fresh();
  const ids = await pg.evaluate(() => {
    const mk = (t, kids = []) => { const n = mkNode(t); n.type = 'ul'; n.children = kids; return n; };
    root.children = [
      mk('Study A', [mk('Participant P4 said propagation is the click')]),
      mk('Admin', [mk('Invoice filed')]),
    ];
    const attach = (n, p) => { nodeMap.set(n.id, n); parentMap.set(n.id, p); (n.children || []).forEach(k => attach(k, n)); };
    root.children.forEach(n => attach(n, root));
    buildIndex(root, null); markDirty(); render();
    return { admin: root.children[1].id };
  });
  const search = (q, zoom) => pg.evaluate(async ([qq, z]) => {
    focusedId = z; render();
    const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
    applySearch(qq);
    await new Promise(r => setTimeout(r, 150));
    const e = document.getElementById('search-empty');
    const btn = e?.querySelector('.se-zoomout');
    return {
      live: (document.getElementById('a11y-live')?.textContent || '').trim(),
      rows: document.querySelectorAll('.node-content').length,
      emptyShown: e ? !e.hidden : false,
      emptyText: e && !e.hidden ? (e.firstChild?.textContent || '').trim() : null,
      btnLabel: btn?.getAttribute('aria-label') ?? null,
    };
  }, [q, zoom]);

  // UNZOOMED: the control. This is what the count has always meant, and must keep meaning.
  const open = await search('propagation', null);
  assert.equal(open.live, '1 matching point', 'unzoomed, the plain count is unchanged');
  assert.equal(open.emptyShown, false);

  // ZOOMED, zero here: the reported case. "0 matching points" while the document held one.
  const zeroHere = await search('propagation', ids.admin);
  assert.equal(zeroHere.rows, 0, 'precondition: the zoom really does hide the match');
  assert.match(zeroHere.live, /^0 matching points here · 1 in this document$/,
    'the count must not report 0 as if it meant the document');
  assert.equal(zeroHere.emptyShown, true, 'and the banner still shows');
  assert.match(zeroHere.emptyText, /Nothing in this zoom matches/, 'naming the zoom, not the document');
  assert.match(zeroHere.emptyText, /1 match is elsewhere in this document/, 'and what it is hiding');
  assert.ok(zeroHere.btnLabel, 'with a door out, not just a number');
  assert.match(zeroHere.btnLabel, /Zoom out and show all 1 matching point/);

  // ZOOMED, nonzero here: the half a reader would never suspect, because the number looks fine.
  const someHere = await search('i', ids.admin);
  assert.match(someHere.live, /^1 matching point here · 3 in this document$/,
    'a plausible-looking count is the more dangerous case and must qualify too');

  // ZOOMED with nothing elsewhere: the NEGATIVE. Qualifying here would be noise on every search.
  const onlyHere = await search('filed', ids.admin);
  assert.equal(onlyHere.live, '1 matching point', 'nothing elsewhere, so nothing to say about the zoom');

  // THE DOOR, driven with the KEYBOARD -- a mousedown-only control is the #1021 shape, and a
  // source pin proves the handler is present, never that it can be reached.
  await search('propagation', ids.admin);
  await pg.evaluate(() => {
    document.querySelector('.se-zoomout')?.focus();
    const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
  });
  const focused = await pg.evaluate(() => document.activeElement?.className || '');
  assert.match(focused, /se-zoomout/, 'the door takes focus, or no key can reach it');
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(300);
  const after = await pg.evaluate(() => ({
    zoomed: focusedId != null, q: searchQuery,
    rows: document.querySelectorAll('.node-content').length,
    live: (document.getElementById('a11y-live')?.textContent || '').trim(),
  }));
  assert.equal(after.zoomed, false, 'Enter on the door zooms out');
  assert.equal(after.q, 'propagation', 'and KEEPS the query, or it has undone the search as well');
  assert.ok(after.rows > 0, 'so the match the zoom was hiding is now on screen');
  assert.match(after.live, /Zoomed out/, 'and it says what it did (P4)');
  await pg.close();
});

// 67. #1510 — the concept guide filtered 94 nav entries to 18 to 0 with focus still in its search
// box and said nothing at any step, kept the previous entry on screen in full beside a "No results"
// nav, and answered ArrowDown/Enter on the empty state with nothing at all. Driven, because all
// three are runtime state a source pin cannot read: what the live region holds, what the reading
// pane is showing, and whether a key reaches anything.
test('#1510 a filter says what it did, drops the stale entry, and answers its keys', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => openGuide());
  await pg.waitForTimeout(400);
  // TWO surfaces carry class="guide-search": the File menu's and the guide's. Scoping to #io-card is
  // load-bearing -- an unscoped selector types into the File menu and measures a guide that never
  // filtered, which is exactly how the first run of this check "reproduced" nothing.
  const snap = () => pg.evaluate(() => {
    const nav = document.querySelector('#io-card .guide-nav'), pane = document.querySelector('#io-card .guide-pane');
    return {
      entries: nav?.querySelectorAll('.guide-nav-btn').length ?? -1,
      noResults: !!nav?.querySelector('.guide-no-results'),
      paneTitle: pane?.querySelector('.guide-entry-title')?.textContent ?? null,
      paneChars: (pane?.textContent || '').length,
      live: (document.getElementById('a11y-live')?.textContent || '').trim(),
    };
  });
  const type = async (v) => {
    await pg.evaluate(() => { const a = document.getElementById('a11y-live'); if (a) a.textContent = ''; });
    await pg.evaluate(t => {
      const s = document.querySelector('#io-card .guide-search');
      s.focus(); s.value = t; s.dispatchEvent(new Event('input', { bubbles: true }));
    }, v);
    await pg.waitForTimeout(250);
    return snap();
  };

  const all = await snap();
  assert.ok(all.entries > 50, `precondition: the unfiltered guide is a long list (${all.entries})`);

  // (1) the filter is announced
  const some = await type('dice');
  assert.ok(some.entries > 0 && some.entries < all.entries,
    `precondition: "dice" really narrows the list (${all.entries} -> ${some.entries})`);
  assert.equal(some.live, some.entries + ' results',
    'a list that changed under a caret that never moved must say so');

  // (2) nothing matches: announced, AND the pane stops showing a non-matching entry
  const none = await type('dicezzzz');
  assert.equal(none.entries, 0, 'precondition: nothing matches');
  assert.equal(none.noResults, true, 'the nav says so');
  assert.match(none.live, /No topics match your search\./, 'and so does the live region');
  assert.equal(none.paneTitle, null,
    'the reading pane must not keep a full entry the filter just excluded');
  assert.ok(none.paneChars < 100,
    `the pane holds the empty sentence, not an article (${none.paneChars} chars)`);
  // ONE sentence for one state: the nav, the pane and the announcement must not tell three stories
  const paneText = await pg.evaluate(() =>
    (document.querySelector('#io-card .guide-pane')?.textContent || '').trim());
  assert.equal(paneText, none.live, 'the pane and the announcement say the same thing');

  // (3) the keys answer instead of doing nothing
  for (const key of ['ArrowDown', 'Enter']) {
    await pg.evaluate(() => {
      document.querySelector('#io-card .guide-search').focus();
      const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
    });
    await pg.keyboard.press(key);
    await pg.waitForTimeout(200);
    const said = await pg.evaluate(() => (document.getElementById('a11y-live')?.textContent || '').trim());
    assert.match(said, /No topics match your search\./, `${key} on an empty list must say why, not nothing`);
  }

  // THE CONTROL: back to a query that matches, and the guide reads normally again
  const back = await type('dice');
  assert.equal(back.entries, some.entries, 'the filter recovers');
  assert.ok(back.paneTitle, 'and the pane shows a real entry again');
  assert.equal(back.live, back.entries + ' results');
  await pg.close();
});

// 68. #1511 — the search legend stamped role=button, roving tabindex and "Add <token> to the
// search" onto every kbd it contained, including five trailing rows that document AUTHORING syntax
// rather than filters. Activating one pasted a pill body into the search box. Driven, because
// whether a chip ACTS is runtime behaviour: the handlers were present and correct, and the defect
// was which elements they were attached to.
test('#1511 a syntax sample does nothing to the search, and the filter chips still work', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    const mk = t => { const n = mkNode(t); n.type = 'todo'; n.checked = false; return n; };
    root.children = [mk('#TODO Alpha'), mk('#TODO Beta'), mkNode('Gamma plain')];
    root.children.forEach(n => { n.type = n.type || 'ul'; nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
  });
  await pg.evaluate(() => document.getElementById('search-box').focus());
  await pg.waitForTimeout(300);

  const census = await pg.evaluate(() => {
    const ks = [...document.querySelectorAll('#search-hint .sh-row kbd')];
    return {
      total: ks.length,
      buttons: ks.filter(k => k.getAttribute('role') === 'button').length,
      docs: ks.filter(k => k.hasAttribute('data-doc')).map(k => k.textContent),
      docsFocusable: ks.filter(k => k.hasAttribute('data-doc') && k.getAttribute('tabindex') !== null).length,
    };
  });
  assert.equal(census.docs.length, 5, 'precondition: five rows document syntax rather than filters');
  assert.equal(census.buttons, census.total - 5, 'and only the rest claim to be buttons');
  assert.equal(census.docsFocusable, 0, 'a sample is not a tab stop, so roving cannot reach it');

  // activating a documentation sample must do NOTHING to the search
  const act = (tok) => pg.evaluate(async t => {
    const sb = document.getElementById('search-box');
    sb.value = 'is:todo'; applySearch('is:todo');
    await new Promise(r => setTimeout(r, 150));
    const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
    const k = [...document.querySelectorAll('#search-hint .sh-row kbd')].find(x => x.textContent === t);
    k.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    k.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 250));
    return {
      box: sb.value,
      live: (document.getElementById('a11y-live')?.textContent || '').trim(),
      invalid: document.getElementById('sh-invalid')?.hidden === false,
    };
  }, tok);

  for (const tok of census.docs) {
    const r = await act(tok);
    // THE CONCRETE HARM the issue names: stacking onto a live filter dropped 2 points to 0
    assert.equal(r.box, 'is:todo', `${tok} must not paste a pill body onto a live filter`);
    assert.equal(r.invalid, false, `${tok} must not raise a diagnostic about a token nobody typed`);
    assert.doesNotMatch(r.live, /is not a filter this app knows/,
      `${tok} used to blame "is:todo}", a token the tokenizer manufactured, and prescribe advice ` +
      'already inside the failing string');
  }

  // THE CONTROL: the real operator chips are wired identically and must keep working, by mouse
  const chip = await pg.evaluate(async () => {
    const sb = document.getElementById('search-box');
    sb.value = ''; applySearch('');
    await new Promise(r => setTimeout(r, 150));
    const k = [...document.querySelectorAll('#search-hint .sh-row kbd')].find(x => x.textContent === 'is:todo');
    k.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 250));
    return { box: sb.value, live: (document.getElementById('a11y-live')?.textContent || '').trim() };
  });
  assert.equal(chip.box, 'is:todo', 'a real filter chip still stacks its token');
  assert.match(chip.live, /2 matching points/, 'and still runs the search');

  // ...and by keyboard, where the issue's reader reached the samples by roving one past the end
  await pg.evaluate(() => { document.querySelector('#search-hint .sh-row kbd[tabindex="0"]').focus(); });
  await pg.keyboard.press('End');
  await pg.waitForTimeout(150);
  await pg.keyboard.press('ArrowRight');   // one past the end
  await pg.waitForTimeout(150);
  const landed = await pg.evaluate(() => ({
    isDoc: document.activeElement.hasAttribute?.('data-doc') ?? false,
    text: document.activeElement.textContent,
  }));
  assert.equal(landed.isDoc, false,
    `roving past the last chip must clamp on a real one, not step onto a sample (landed on ${landed.text})`);
  await pg.close();
});

// 69. #1512 — the outline's global arrow and Delete/Backspace branches fired while a modal dialog
// had focus. DATA LOSS, driven: inside the Link graph, Shift+ArrowDown built a 4-point selection
// behind the scrim and Backspace took the document from 5 points to 1, while focus never left
// BUTTON.graph-close and the overlay went on reporting points that no longer existed. Only driving
// shows this: both branches were "correct" in isolation, and the defect was that nothing stopped
// them running when another surface owned the keyboard.
test('#1512 an open dialog owns its keys, and the outline still owns its own', { skip: skip() }, async () => {
  const pg = await fresh();
  const seed = () => pg.evaluate(() => {
    root.children = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Eps'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); selectedIds.clear();
    selFocusId = root.children[0].id; selAnchorId = selFocusId;
    markDirty(); render();
  });
  const state = () => pg.evaluate(() => ({
    n: root.children.length,
    texts: root.children.map(c => c.text).join(','),
    sel: selectedIds.size,
    cursor: (nodeById(selFocusId) || {}).text ?? null,
    ae: document.activeElement.tagName + '.' + (document.activeElement.className || ''),
  }));

  // ── the leaking surfaces. A modal is open; the outline must not hear the keys at all.
  for (const [label, open, close] of [
    ['Link graph', () => openGraph(), () => { try { closeGraph(); } catch (_) {} }],
    ['File menu', () => openFileMenu(), () => { try { closeFileMenu(); } catch (_) {} }],
  ]) {
    await seed();
    await pg.waitForTimeout(200);
    await pg.evaluate(open);
    await pg.waitForTimeout(450);
    const before = await state();
    assert.equal(before.n, 5, `${label}: precondition -- five points`);
    for (let i = 0; i < 3; i++) { await pg.keyboard.press('Shift+ArrowDown'); await pg.waitForTimeout(120); }
    await pg.keyboard.press('Backspace');
    await pg.waitForTimeout(350);
    const after = await state();
    assert.equal(after.sel, 0, `${label}: arrows must not build a selection behind the scrim`);
    assert.equal(after.n, 5, `${label}: Backspace must not delete points through an open dialog`);
    assert.equal(after.texts, 'Alpha,Beta,Gamma,Delta,Eps', `${label}: and the document is untouched`);
    await pg.evaluate(close);
    await pg.waitForTimeout(300);
  }

  // ── A SELECTION MADE FIRST, then a dialog opened over it. Without this case the delete branch's
  // guard is UNOBSERVABLE: with the arrows already gated, nothing builds a selection behind the
  // scrim, so Backspace has nothing to delete and removing its guard changes nothing. Registering
  // that mutant is what exposed the hole. It is also the more dangerous real sequence -- you have
  // points selected, you open the File menu, and Backspace reaches past it into the document.
  await seed();
  await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    const c = document.querySelectorAll('.node-content')[0];
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.waitForTimeout(250);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(250);
  for (let i = 0; i < 3; i++) { await pg.keyboard.press('Shift+ArrowDown'); await pg.waitForTimeout(120); }
  const armed = await state();
  assert.ok(armed.sel >= 2, `precondition: a real selection exists first (${armed.sel})`);
  await pg.evaluate(() => openFileMenu());
  await pg.waitForTimeout(450);
  await pg.keyboard.press('Backspace');
  await pg.waitForTimeout(350);
  const survived = await state();
  assert.equal(survived.n, 5,
    'Backspace with a live selection must not reach past an open dialog into the document');
  assert.equal(survived.texts, 'Alpha,Beta,Gamma,Delta,Eps');
  await pg.evaluate(() => { try { closeFileMenu(); } catch (_) {} });
  await pg.waitForTimeout(300);

  // ── THE CONTROL, and the reason a bare `activeElement === document.body` gate is wrong. This is
  // the flow the branches exist FOR, and Shift+ArrowDown moves focus onto the selection action bar,
  // so at the moment Backspace lands the active element is not <body>.
  await seed();
  await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    const c = document.querySelectorAll('.node-content')[0];
    const n = nodeById(c.dataset.id); enterEdit(c, n); c.focus(); activeContentId = n.id;
  });
  await pg.waitForTimeout(250);
  await pg.keyboard.press('Escape');            // row-cursor state
  await pg.waitForTimeout(300);
  const cursor0 = await state();
  assert.match(cursor0.ae, /BODY/, 'precondition: the row cursor really does leave focus on <body>');
  await pg.keyboard.press('ArrowDown');
  await pg.waitForTimeout(200);
  const moved = await state();
  assert.notEqual(moved.cursor, cursor0.cursor, 'plain ArrowDown still moves the row cursor');
  await pg.keyboard.press('Shift+ArrowDown');
  await pg.waitForTimeout(250);
  const picked = await state();
  assert.ok(picked.sel >= 2, `Shift+ArrowDown still builds a selection (${picked.sel})`);
  assert.doesNotMatch(picked.ae, /BODY/,
    'and it moves focus onto the selection bar, which is why identity-with-<body> is the wrong gate');
  await pg.keyboard.press('Backspace');
  await pg.waitForTimeout(350);
  const deleted = await state();
  assert.ok(deleted.n < 5, `bulk delete must still work from the outline (${deleted.n} left)`);
  await pg.close();
});

// 70. #1513 — twelve legend chips are TEMPLATES: their labels carry a placeholder (`key:value`,
// `#tag`, `-term`, `start:<date`, `a | b`, …). Every one pasted literally with a COLLAPSED caret
// and ran, so the app wrote a teaching string and then delivered a verdict on it — eight said "0
// matching points" and blanked the outline, `-term` and `a | b` said a confident "3 matching
// points", `start:<date` blamed the user for its own string. Source pins cannot see any of that:
// the selection offset, whether the outline emptied, and what the live region said are all runtime
// facts. The whole family is driven here, and so are the 32 complete operators — the risk of this
// fix is misclassifying a working filter, which only shows up as a chip that stopped filtering.
test('#1513 a legend template chip lands ready to type, and an operator chip still filters', { skip: skip() }, async () => {
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = ['Alpha', 'Beta', 'Gamma'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    setProp(root.children[0], 'cost', '120');
    buildIndex(root, null); markDirty(); render();
  });
  await pg.waitForTimeout(200);
  const reset = async () => {
    await pg.evaluate(() => {
      const sb = document.getElementById('search-box');
      sb.value = ''; applySearch(''); sb.focus();
      const a = document.getElementById('a11y-live'); if (a) a.textContent = '';
    });
    await pg.waitForTimeout(150);
  };
  // mousedown, not click: the chips deliberately act on mousedown+preventDefault so the panel does
  // not blur shut mid-gesture, so a click() would measure a gesture the app never receives.
  const pick = async (label) => {
    await pg.evaluate((t) => {
      const k = [...document.querySelectorAll('#search-hint .sh-row kbd:not([data-doc])')].find(x => x.textContent === t);
      if (!k) throw new Error('no legend chip labelled ' + t);
      k.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    }, label);
    await pg.waitForTimeout(220);
  };
  const state = () => pg.evaluate(() => {
    const sb = document.getElementById('search-box');
    return {
      v: sb.value, s: sb.selectionStart, e: sb.selectionEnd,
      rows: [...document.querySelectorAll('.node-content')].map(n => n.textContent.trim()),
      live: (document.getElementById('a11y-live')?.textContent || '').trim(),
    };
  });

  await pg.evaluate(() => document.getElementById('search-box').focus());
  await pg.waitForTimeout(250);
  const labels = await pg.evaluate(() =>
    [...document.querySelectorAll('#search-hint .sh-row kbd:not([data-doc])')].map(k => k.textContent));
  assert.ok(labels.length >= 40, `the legend must actually be rendering its chips (${labels.length})`);

  // ── THE TWELVE. Each pastes, SELECTS its placeholder, and leaves the outline alone.
  const TEMPLATES = {
    '#tag': 'tag', '#tag/sub': 'tag/sub', 'start:<date': 'date', '-term': 'term',
    '"a b"': 'a b', 'a | b': 'a', 'has:key': 'key', 'key:value': 'key', 'key:>N': 'key',
    'key:<=N': 'key', 'state:value': 'value', 'var:name': 'name',
  };
  for (const [label, ph] of Object.entries(TEMPLATES)) {
    assert.ok(labels.includes(label), `the legend must still offer ${label}`);
    await reset();
    await pick(label);
    const r = await state();
    assert.equal(r.v, label, `${label}: the label is what lands in the box`);
    assert.notEqual(r.s, r.e, `${label}: the caret must NOT be collapsed — that is the bug`);
    assert.equal(r.v.slice(r.s, r.e), ph, `${label}: the placeholder must be selected, ready to type over`);
    assert.deepEqual(r.rows, ['Alpha', 'Beta', 'Gamma'],
      `${label}: a template must not filter — the outline stays as it was`);
    assert.doesNotMatch(r.live, /matching point/,
      `${label}: the app must not deliver a verdict on a string it wrote as a template (said "${r.live}")`);
    assert.ok(r.live.includes(label) && r.live.includes(ph),
      `${label}: and it must say what landed and what to type over (said "${r.live}")`);
  }

  // ── THE 32 OPERATORS, the negative case. Misclassifying one of these is the way this fix breaks:
  // a filter that quietly stops filtering. Every remaining chip must still run at once and leave a
  // collapsed caret at the end of the query.
  const operators = labels.filter(l => !(l in TEMPLATES));
  assert.ok(operators.length >= 30, `the operator half must be non-empty (${operators.length})`);

  // the classification and the door's own name, read off the LIVE dom. A source pin can see the
  // setAttribute call; only this can see whether it reached the element.
  const stamped = await pg.evaluate(() => {
    const ks = [...document.querySelectorAll('#search-hint .sh-row kbd:not([data-doc])')];
    return {
      tmpl: ks.filter(k => k.hasAttribute('data-tmpl')).map(k => k.textContent),
      unnamed: ks.filter(k => !(k.getAttribute('aria-label') || '').trim()).map(k => k.textContent),
      tagAria: ks.find(k => k.textContent === '#tag').getAttribute('aria-label'),
      opAria: ks.find(k => k.textContent === 'is:todo').getAttribute('aria-label'),
    };
  });
  assert.deepEqual(stamped.tmpl.slice().sort(), Object.keys(TEMPLATES).slice().sort(),
    'exactly the template chips carry data-tmpl in the live DOM');
  assert.deepEqual(stamped.unnamed, [], 'every chip keeps an accessible name (P3-1)');
  assert.match(stamped.tagAria, /template/, 'a template chip says so in its accessible name');
  assert.equal(stamped.opAria, 'Add is:todo to the search',
    'and an operator chip keeps the name it always had');

  for (const label of operators) {
    await reset();
    await pick(label);
    const r = await state();
    assert.equal(r.s, r.e, `${label}: a complete operator still leaves the caret collapsed`);
    assert.equal(r.s, r.v.length, `${label}: at the end of the query`);
    assert.match(r.live, /matching point/, `${label}: and it still answers with a count (said "${r.live}")`);
  }

  // ── FOLLOW-THROUGH: typing over the placeholder is what runs the search. Without this the fix
  // would be "the chip does nothing", which is a different defect.
  await reset();
  await pick('key:value');
  await pg.keyboard.type('cost');
  await pg.waitForTimeout(300);
  const typed = await state();
  assert.equal(typed.v, 'cost:value', 'typing replaces the selected placeholder, it does not append');
  assert.match(typed.live, /matching point/, 'and once you type, the search runs again');

  // ── STACKING onto a live query: the selection is offset by what is already there, and the
  // running filter survives. A template branch anchored at 0 would select the wrong word here.
  await reset();
  await pg.evaluate(() => { const sb = document.getElementById('search-box'); sb.value = 'Alpha'; applySearch('Alpha'); sb.focus(); });
  await pg.waitForTimeout(250);
  await pick('has:key');
  const stacked = await state();
  assert.equal(stacked.v, 'Alpha has:key', 'a chip still stacks onto the query you have built');
  assert.equal(stacked.v.slice(stacked.s, stacked.e), 'key', 'and the placeholder span is offset by it');
  assert.deepEqual(stacked.rows, ['Alpha'], 'the filter that was already running is not disturbed');

  // ── THE KEYBOARD DOOR takes the same branch (P3): Enter on a chip, not just the pointer.
  await reset();
  await pg.evaluate(() => {
    const k = [...document.querySelectorAll('#search-hint .sh-row kbd:not([data-doc])')].find(x => x.textContent === 'var:name');
    k.setAttribute('tabindex', '0'); k.focus();
  });
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(250);
  const kb = await state();
  assert.equal(kb.v.slice(kb.s, kb.e), 'name', 'Enter on a template chip selects the placeholder too');
  assert.deepEqual(kb.rows, ['Alpha', 'Beta', 'Gamma'], 'and it does not filter either');

  // ── THE P1 CLAIM, both surfaces in one page. `#tag` is byte-identical in the legend and in the
  // @ Query dialog's chips; it used to leave [4,4] on one and [1,4] on the other.
  await reset();
  await pick('#tag');
  const fromLegend = await state();
  const fromDialog = await pg.evaluate(() => {
    const inp = document.createElement('input');
    document.body.appendChild(inp);
    inp.value = ''; inp.selectionStart = inp.selectionEnd = 0;
    QUERY_CHIPS.find(c => c.label === '#tag').insert(inp);
    const r = { v: inp.value, s: inp.selectionStart, e: inp.selectionEnd };
    inp.remove(); return r;
  });
  assert.equal(fromLegend.v, fromDialog.v, '#tag produces the same string on both surfaces');
  assert.deepEqual([fromLegend.s, fromLegend.e], [fromDialog.s, fromDialog.e],
    '#tag must leave the same selection on both surfaces — that is the P1 claim');
  await pg.close();
});

// 71. #1514 — the document tab strip advertised the roving pattern in its own comment and
// implemented none of it. Driven, because every symptom is a runtime fact a source pin cannot see:
// Home and End moved NOTHING (16 primitives, re-measured with a genuinely overflowing 30-tab
// strip); the single tab stop never followed focus, so Tab-away-Tab-back always landed on the
// active tab; and all four close buttons were Tab stops — six stops for four documents, GROWING one
// per open document, the first of them a Close button belonging to a tab that was itself -1. The
// growth is the half only a scale case shows, so this drives 4 tabs and 30.
test('#1514 the tab strip is one roving group whose stop follows focus, at any size', { skip: skip() }, async () => {
  const pg = await fresh();
  // The File System Access API is unavailable on file://, so the strip never renders on its own.
  // Seeding workspaceDir + openTabs is the documented repro, not a shortcut past one.
  const seed = (names, active) => pg.evaluate(([ns, a]) => {
    root.children = ['Alpha', 'Beta'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    workspaceDir = { name: 'MyFolder' };
    openTabs = ns; fileName = a;
    renderDocTabs();
    const live = document.getElementById('a11y-live'); if (live) live.textContent = '';
  }, [names, active]);
  const label = () => pg.evaluate(() => (document.activeElement.getAttribute?.('aria-label') || '').trim());
  const stops = () => pg.evaluate(() => [...document.querySelectorAll('#doc-tabs .doc-tab')]
    .map(t => t.tabIndex).filter(n => n === 0).length);
  const live = () => pg.evaluate(() => (document.getElementById('a11y-live')?.textContent || '').trim());

  const FOUR = ['one.opml', 'two.opml', 'three.opml', 'four.opml'];
  await seed(FOUR, 'two.opml');
  await pg.waitForTimeout(250);

  // ── the close buttons are out of the Tab order. This is the growth defect.
  assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.doc-tab-close')].map(b => b.tabIndex)),
    [-1, -1, -1, -1], 'a close button must not be a native Tab stop');

  // ── arrows CLAMP and the single stop follows focus. Both halves fail on the old code: it wrapped,
  // and the tabindexes stayed [-1,0,-1,-1] however far you roved.
  await pg.evaluate(() => document.querySelector('.doc-tab.active').focus());
  assert.equal(await label(), 'Document two (current)', 'precondition: focus starts on the active tab');
  for (const [key, expect] of [
    ['ArrowRight', 'Document three'], ['ArrowRight', 'Document four'],
    ['ArrowRight', 'Document four'],                                    // clamps, does not wrap
    ['ArrowLeft', 'Document three'], ['ArrowLeft', 'Document two (current)'],
    ['ArrowLeft', 'Document one'], ['ArrowLeft', 'Document one'],       // clamps at the other end
    ['Home', 'Document one'], ['End', 'Document four'], ['End', 'Document four'],
  ]) {
    await pg.keyboard.press(key);
    await pg.waitForTimeout(110);
    assert.equal(await label(), expect, `${key} must land on ${expect}`);
    assert.equal(await stops(), 1, `${key}: the group must keep exactly one tab stop`);
    assert.equal(await pg.evaluate(() => document.activeElement.tabIndex), 0,
      `${key}: the tab stop must have FOLLOWED focus (Tab away and back lands where you roved)`);
  }

  // ── THE SCALE CASE. Six stops for four documents was the measurement; the fix is a constant.
  // Counting stops by walking Tab is the only honest way to count them.
  const walkStrip = async (n) => {
    await pg.evaluate(() => document.querySelector('#doc-tabs .doc-tab[tabindex="0"]').focus());
    const seen = [];
    for (let i = 0; i < n; i++) {
      await pg.keyboard.press('Tab');
      await pg.waitForTimeout(60);
      seen.push(await pg.evaluate(() => document.activeElement.className || document.activeElement.tagName));
      if (!seen[seen.length - 1].includes('doc-tab')) break;
    }
    return seen;
  };
  const after4 = await walkStrip(6);
  assert.equal(after4.filter(x => x.includes('doc-tab-close')).length, 0,
    `no close button may be a Tab stop (walked: ${after4.join(' → ')})`);
  assert.ok(after4[0].includes('doc-tab-add'),
    `from the tab group, the next stop is the + (walked: ${after4.join(' → ')})`);

  const THIRTY = Array.from({ length: 30 }, (_, i) => `doc${i}.opml`);
  await seed(THIRTY, 'doc0.opml');
  await pg.waitForTimeout(300);
  assert.ok(await pg.evaluate(() => {
    const s = document.getElementById('doc-tabs');
    return s.scrollWidth > s.clientWidth;
  }), 'precondition: 30 tabs must genuinely overflow the strip');
  assert.equal(await stops(), 1, '30 documents is still ONE tab stop for the group');
  const after30 = await walkStrip(6);
  assert.ok(after30[0].includes('doc-tab-add'),
    `the stop count must not grow with the document count (walked: ${after30.join(' → ')})`);
  // and Home/End still reach the ends of a strip long enough to scroll
  await pg.evaluate(() => document.querySelector('#doc-tabs .doc-tab[tabindex="0"]').focus());
  await pg.keyboard.press('End');
  await pg.waitForTimeout(150);
  assert.equal(await label(), 'Document doc29', 'End must reach the last tab of an overflowing strip');
  await pg.keyboard.press('Home');
  await pg.waitForTimeout(150);
  assert.equal(await label(), 'Document doc0 (current)', 'and Home the first');

  // ── DELETE is now the keyboard door for closing, so it must land focus and say what happened.
  // Before: focus fell to BODY and the live region stayed empty.
  await seed(FOUR, 'two.opml');
  await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('#doc-tabs .doc-tab').focus());
  await pg.keyboard.press('Delete');
  await pg.waitForTimeout(450);
  assert.deepEqual(await pg.evaluate(() => openTabs), ['two.opml', 'three.opml', 'four.opml'],
    'Delete on a tab closes it');
  assert.equal(await label(), 'Document two (current)',
    'focus must land on the tab that slid into the slot, not on <body>');
  assert.equal(await stops(), 1, 'and the restored focus carries the tab stop with it');
  assert.equal(await live(), 'Closed one. 3 documents open.', 'closing announces what went and what is left');

  // ── the last tab: nothing in the strip to focus, so the caret goes back to the document.
  await pg.evaluate(() => {
    openTabs = ['solo.opml']; fileName = 'solo.opml'; renderDocTabs();
    const l = document.getElementById('a11y-live'); if (l) l.textContent = '';
    document.querySelector('#doc-tabs .doc-tab').focus();
  });
  await pg.waitForTimeout(250);
  await pg.keyboard.press('Delete');
  await pg.waitForTimeout(600);
  assert.equal(await live(), 'Closed solo. No documents open.');
  assert.doesNotMatch(await pg.evaluate(() => document.activeElement.tagName), /BODY/,
    'closing the last tab must hand focus back to the document, not strand it on <body>');

  // ── THE NEGATIVE CASE: the keys that already worked still work. Enter opens a tab, and the +
  // is still its own Tab stop (it is not a tab, so it is not in the roving group).
  await seed(FOUR, 'two.opml');
  await pg.waitForTimeout(250);
  assert.equal(await pg.evaluate(() => document.querySelector('.doc-tab-add').tabIndex), 0,
    'the + stays a Tab stop of its own');
  await pg.evaluate(() => { window.__opened = null; window.__origSwitch = switchWorkspaceDoc;
    switchWorkspaceDoc = async (n) => { window.__opened = n; return true; }; });
  await pg.evaluate(() => document.querySelectorAll('#doc-tabs .doc-tab')[2].focus());
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(300);
  assert.equal(await pg.evaluate(() => window.__opened), 'three.opml',
    'Enter on a tab still opens that document');
  await pg.close();
});

// 72. #1515 — Escape out of the Capture strip stranded focus on the toolbar button, from TWO
// independent causes (fixing either alone leaves the bug): the Escape closed the strip TWICE, and
// the return target was a stored ELEMENT that a committed capture's render() detached. Both are
// runtime facts. `tests/browser.mjs` had no capture coverage at all, and `tests/test.mjs` pinned
// only that `function closeCapture` exists.
//
// THE FAMILY IS THREE. Driving found `#journal-strip` and `#chronicle-strip` carrying the identical
// element slot: after a committed entry, all three stranded focus on their own toolbar button. They
// share one exit now, and all three are driven here — the fix is only as good as its narrowest
// member.
test('#1515 every toolbar strip hands the caret back to the interrupted edit', { skip: skip() }, async () => {
  const pg = await fresh();
  const STRIPS = [
    { name: 'capture',   open: 'openCaptureDialog',   input: 'cap-input', btn: 'btn-capture' },
    { name: 'journal',   open: 'openJournalStrip',    input: 'jr-input',  btn: 'btn-journal' },
    { name: 'chronicle', open: 'openChronicleStrip',  input: 'chr-input', btn: 'btn-chronicle' },
  ];
  // A clean tree AND a clean nodeMap: a stale map lets a dropped node still resolve, which makes
  // the chrome-return report success over a point that is not rendered. That cost a diagnosis.
  const seed = () => pg.evaluate(() => {
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    root.children = ['Alpha', 'Beta', 'Gamma'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    root.gamelog = { targetId: root.children[2].id };        // the chronicle needs a home point
    buildIndex(root, null); markDirty(); render();
    chromeReturn = null; activeContentId = null; lastEdit = null;
    selectedIds.clear(); selAnchorId = null; selFocusId = null;
    const l = document.getElementById('a11y-live'); if (l) l.textContent = '';
  });
  const editBeta = () => pg.evaluate(() => {
    const el = document.querySelectorAll('.node-content')[1];
    const n = nodeById(el.dataset.id); enterEdit(el, n); el.focus(); activeContentId = n.id;
    setCaretByOffset(el, 3);
    return n.id;
  });
  const state = () => pg.evaluate(() => {
    const a = document.activeElement, sel = window.getSelection();
    return {
      tag: a.tagName, id: activeContentId,
      caret: (a.classList?.contains('node-content') && sel?.anchorOffset != null) ? sel.anchorOffset : null,
      cursor: document.querySelector('.node-cursor')?.textContent?.trim() ?? null,
      live: (document.getElementById('a11y-live')?.textContent || '').trim(),
    };
  });

  // ── EVERY STRIP × committed and uncommitted. The two causes separate here: uncommitted fails on
  // the double-close alone (the stored element was still connected), committed fails on the
  // detached element alone. A fix for one leaves the other, so both rows have to be green.
  for (const commit of [false, true]) {
    for (const st of STRIPS) {
      await seed();
      await pg.waitForTimeout(200);
      const betaId = await editBeta();
      await pg.waitForTimeout(200);
      await pg.evaluate((o) => window[o](), st.open);
      await pg.waitForTimeout(350);
      assert.equal(await pg.evaluate(() => document.activeElement.id), st.input,
        `${st.name}: precondition -- the strip opened and took the caret`);
      if (commit) {
        await pg.keyboard.type('note');
        await pg.keyboard.press('Enter');
        await pg.waitForTimeout(400);
      }
      await pg.keyboard.press('Escape');
      await pg.waitForTimeout(400);
      const after = await state();
      const why = `${st.name}, ${commit ? 'after a committed entry' : 'with nothing committed'}`;
      assert.notEqual(after.tag, 'BUTTON', `${why}: focus must not be stranded on the toolbar button`);
      assert.equal(after.id, betaId, `${why}: the interrupted point must be back in edit`);
      assert.equal(after.caret, 3, `${why}: and the caret where it stood, not at 0`);
    }
  }

  // ── the double-close, counted. Uncommitted capture is the case that isolates it.
  await seed();
  await pg.waitForTimeout(200);
  await editBeta();
  await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    window.__closes = 0;
    const orig = closeCapture;
    window.closeCapture = closeCapture = function () { window.__closes++; return orig.apply(this, arguments); };
    openCaptureDialog();
  });
  await pg.waitForTimeout(350);
  await pg.evaluate(() => { window.__closes = 0; });
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(350);
  assert.equal(await pg.evaluate(() => window.__closes), 1,
    'one Escape must close the strip ONCE -- the second pass is what overrode the restored focus');

  // ── NOTHING INTERRUPTED: the Escape blur rung. Not the toolbar button, where the outline arrows
  // never reach (#1512) and Enter re-opens the strip you were leaving.
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => document.getElementById('btn-capture').click());
  await pg.waitForTimeout(350);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(400);
  const rung = await state();
  assert.equal(rung.tag, 'BODY', 'with no edit to return to, Escape lands on the blur rung');
  assert.equal(rung.cursor, '▶Alpha', 'and the row cursor is PAINTED, not merely implied');
  assert.equal(rung.live, 'Alpha, 1 of 3', 'and announced with its position');
  await pg.keyboard.press('ArrowDown');
  await pg.waitForTimeout(250);
  const moved = await state();
  assert.equal(moved.cursor, '▶Beta', 'and the arrows actually reach it — the point of not parking on the button');

  // ── a remembered point that is OFF SCREEN must not become the cursor. Driven: a collapsed-away
  // point painted nothing and announced a positionless "(empty point)".
  await pg.evaluate(() => {
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    const p = mkNode('Parent'); p.type = 'ul';
    const kid = mkNode('Child'); kid.type = 'ul';
    const sib = mkNode('Sibling'); sib.type = 'ul';
    p.children = [kid]; root.children = [p, sib];
    [p, sib].forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    nodeMap.set(kid.id, kid); parentMap.set(kid.id, p);
    buildIndex(root, null); markDirty(); render();
    chromeReturn = null; activeContentId = null; lastEdit = null;
    moveRowCursor(kid.id, { silent: true });
    p.collapsed = true; markDirty(); render();
    const l = document.getElementById('a11y-live'); if (l) l.textContent = '';
  });
  await pg.waitForTimeout(300);
  assert.equal(await pg.evaluate(() => flatIndex.get(selFocusId) != null), false,
    'precondition: the remembered point is genuinely off screen');
  await pg.evaluate(() => openCaptureDialog());
  await pg.waitForTimeout(350);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(400);
  const off = await state();
  assert.equal(off.cursor, '▶1Parent', 'an off-screen point must fall back to the first visible row');
  assert.match(off.live, /Parent, 1 of 2/, 'and be announced with a real position');

  // ── THE NEGATIVE CASE: Escape inside the destination manager still resolves ONE layer out, and
  // leaves the strip open. Making Escape stopPropagation must not collapse the two rungs (P1-3).
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { openCaptureDialog(); });
  await pg.waitForTimeout(350);
  await pg.evaluate(() => { captureManage = true; renderCaptureStrip(); document.getElementById('cap-input')?.focus(); });
  await pg.waitForTimeout(300);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(300);
  assert.equal(await pg.evaluate(() => captureManage), false, 'the first Escape closes the manager layer');
  assert.equal(await pg.evaluate(() => document.getElementById('capture-strip').classList.contains('on')), true,
    'and leaves the strip open -- one layer out, not two');
  await pg.close();
});

// 73. #1516 — the touch edit bar's "Insert a pill" button typed a literal '@' and opened nothing at
// any caret past 0, silently and PERMANENTLY (the glued sigil stays in the text, so every later
// keystroke re-fails the same match). UXP-105 shipped it and recorded "Verified: the
// execCommand('@') path opens the insert menu on desktop" — verified at the one caret position
// where it happens to work. `#eb-insert` appeared in no driven check at all: this file had zero
// edit-bar coverage, and the edit bar only exists on a touch viewport, so a desktop page could
// never have caught it.
test('#1516 the touch Insert-a-pill button opens the menu at any caret', { skip: skip() }, async () => {
  const pg = await touchPage();
  const seed = (text) => pg.evaluate((t) => {
    const io = document.getElementById('io-back'); if (io?.classList.contains('on')) closeIo();
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    const n = mkNode(''); n.type = 'ul';
    root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
    buildIndex(root, null); markDirty(); render();
    const el = document.querySelector('.node-content');
    enterEdit(el, n); el.focus(); activeContentId = n.id;
    if (t) document.execCommand('insertText', false, t);
  }, text);
  // pointerdown+pointerup, because ebBtn acts on pointerup gated on movement slop — a .click()
  // would measure a gesture the bar never receives.
  const tapInsert = () => pg.evaluate(() => {
    const el = document.getElementById('eb-insert');
    const b = el.getBoundingClientRect(), x = b.x + b.width / 2, y = b.y + b.height / 2;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  });
  const open = () => pg.evaluate(() => ({
    builder: !!builderState,
    trigger: builderState?.trigger ?? null,
    scrim: document.getElementById('io-back')?.classList.contains('on') ?? false,
  }));

  await seed('Buy milk');
  await pg.waitForTimeout(400);
  assert.equal(await pg.evaluate(() => document.getElementById('edit-bar').classList.contains('on')), true,
    'precondition: the edit bar is actually on screen — this door does not exist on a desktop page');

  // ── EVERY caret position, including the two the report did not name. The filed cause was "a word
  // character"; the regex condition is "not whitespace and not }", so punctuation is dead too.
  for (const [text, why] of [
    ['Buy milk', 'after a word character (the filed permanent dead end)'],
    ['Buy milk ', 'after a space (silent at tap, the filed variant B)'],
    ['Buy milk,', 'after punctuation — not named in the report, dead the same way'],
    ['Buy (', 'after an opening bracket'],
    ['', 'at caret 0 — the one position that always worked, and must keep working'],
  ]) {
    await seed(text);
    await pg.waitForTimeout(350);
    await tapInsert();
    await pg.waitForTimeout(500);
    const o = await open();
    assert.equal(o.builder, true, `"${text}": the insert menu must open — ${why}`);
    assert.equal(o.trigger, '@', `"${text}": and it must be the @ insert menu`);
    assert.equal(o.scrim, true, `"${text}": with its scrim up`);
    await pg.evaluate(() => closeBuilder(true));
    await pg.waitForTimeout(250);
  }

  // ── END TO END: the pill has to land as its own token, with the text intact around it. A menu
  // that opens over a mangled `Buy milk@` would satisfy every assertion above and still be wrong.
  await seed('Buy milk');
  await pg.waitForTimeout(350);
  await tapInsert();
  await pg.waitForTimeout(500);
  await pg.keyboard.press('Enter');                      // first row of the @ menu: Dice roll
  await pg.waitForTimeout(600);
  await pg.evaluate(() => {
    const f = [...document.querySelectorAll('#io-card input')].find(i => !i.classList.contains('builder-search'));
    f.focus(); f.value = '2d6'; f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await pg.waitForTimeout(350);
  await pg.evaluate(() => [...document.querySelectorAll('#io-card button')].find(b => /^insert$/i.test(b.textContent.trim()))?.click());
  await pg.waitForTimeout(700);
  assert.equal(await pg.evaluate(() => root.children[0].text), 'Buy milk {2d6}',
    'the sigil is stripped, the inserted space survives, and the pill is its own token');
  assert.equal(await pg.evaluate(() => (root.children[0].dice || []).length), 1,
    'and it is a live pill, not literal text');

  // ── THE NEGATIVE CASE. #1108 is why a bare mid-text sigil is suppressed, and the button's escape
  // hatch must not leak to TYPED input: "the harbour master / his son" must still stay prose.
  await seed('Buy milk');
  await pg.waitForTimeout(350);
  await pg.evaluate(() => document.execCommand('insertText', false, ' @'));
  await pg.waitForTimeout(450);
  assert.equal((await open()).builder, false,
    'typing a bare @ mid-text must STILL open nothing — that is #1108, and the fix must not lift it');
  await pg.evaluate(() => document.execCommand('insertText', false, 'd'));
  await pg.waitForTimeout(450);
  assert.equal((await open()).builder, true,
    'and typing on must still recover, exactly as before');
  await pg.evaluate(() => closeBuilder(true));
  await pg.waitForTimeout(250);

  // ── the sibling door, unchanged: the quick bar's @ makes a NEW point, so it always landed at 0.
  await seed('');
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.getElementById('qb-insert').click());
  await pg.waitForTimeout(800);
  assert.equal((await open()).builder, true, 'the quick-bar insert door still works');

  assert.deepEqual(pageErrors, [], 'no page errors on the touch surface');
  await pg.close();
  await touchCtx.close();
});

// 74. #1517 — the capture strip's destination chip said "top level (no inbox set)" while the commit
// dropped the point into ANOTHER slot's inbox and its toast said so: the strip and the toast
// contradicted each other on screen at the same moment, and the chip stayed wrong for every later
// capture that session. Driven, because the finding IS the disagreement between three surfaces —
// the chip's words, the tree, and the toast — and no source pin can compare them.
test('#1517 the chip, the tree and the toast agree on where a capture went', { skip: skip() }, async () => {
  const pg = await fresh();
  const seed = () => pg.evaluate(() => {
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    root.children = ['Alpha', 'Beta', 'Gamma'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    root.inboxes = []; captureSlot = 1;
    try { closeCapture(); } catch (_) {}
    buildIndex(root, null); markDirty(); render();
    const l = document.getElementById('a11y-live'); if (l) l.textContent = '';
  });
  const chip = () => pg.evaluate(() => document.querySelector('.cap-dest-name-btn')?.textContent.trim() ?? null);
  const tree = () => pg.evaluate(() => root.children.map(c => c.text + '[' + c.children.map(k => k.text).join(',') + ']'));
  const toast = () => pg.evaluate(() => (document.getElementById('flash-hint')?.textContent || '').trim());
  const live = () => pg.evaluate(() => (document.getElementById('a11y-live')?.textContent || '').trim());

  // ── THE LIE. Inbox 1 = Beta, then target slot 4, which was never set.
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { setInboxSlot(1, root.children[1].id); captureSlot = 1; openCaptureDialog(); });
  await pg.waitForTimeout(450);
  assert.equal(await chip(), '1 Beta', 'precondition: the chip names the set slot');
  await pg.evaluate(() => captureTargetSlot(4));
  await pg.waitForTimeout(350);
  assert.equal(await chip(), 'top level', 'an unset slot names the top level');
  assert.equal(await live(), 'Inbox 4 is not set. Captures land at the top level.',
    'and says so — the chord used to change the destination in total silence');
  await pg.evaluate(() => { captureDraft = 'groceries'; doCapture(); });
  await pg.waitForTimeout(500);
  assert.deepEqual(await tree(), ['Alpha[]', 'Beta[]', 'Gamma[]', 'groceries[]'],
    'the point must land where the chip SAID — not inside Beta');
  assert.match(await toast(), /· top level$/, 'and the toast must not contradict the chip');
  assert.equal(await chip(), 'top level', 'and the chip is still right afterwards');

  // ── the same, reached WITHOUT an in-strip switch: the first capture of a session.
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { setInboxSlot(1, root.children[1].id); captureTargetSlot(4); openCaptureDialog(4); });
  await pg.waitForTimeout(450);
  assert.equal(await chip(), 'top level');
  await pg.evaluate(() => { captureDraft = 'first capture'; doCapture(); });
  await pg.waitForTimeout(450);
  assert.deepEqual(await tree(), ['Alpha[]', 'Beta[]', 'Gamma[]', 'first capture[]'],
    'the very first capture of a session must not be mislabelled either');

  // ── THE NEGATIVE CASES. Everything self-consistent stayed that way, including the two promises
  // this fix could plausibly have broken: #559 zero-setup, and the empty-slot adoption rule.
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { setInboxSlot(1, root.children[1].id); captureSlot = 1; openCaptureDialog(); });
  await pg.waitForTimeout(450);
  await pg.evaluate(() => { captureDraft = 'x1'; doCapture(); });
  await pg.waitForTimeout(450);
  assert.equal(await chip(), '1 Beta', 'a SET slot targeted in place still works');
  assert.deepEqual(await tree(), ['Alpha[]', 'Beta[x1]', 'Gamma[]'], 'and still lands in its inbox');
  assert.match(await toast(), /· Beta$/);

  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => openCaptureDialog());
  await pg.waitForTimeout(450);
  await pg.evaluate(() => { captureDraft = 'x2'; doCapture(); });
  await pg.waitForTimeout(450);
  assert.equal(await chip(), 'top level', '#559: no inbox at all is a working state');
  assert.deepEqual(await tree(), ['Alpha[]', 'Beta[]', 'Gamma[]', 'x2[]'], 'and the top level is where it lands');

  // the unspecified-slot default is what carries zero-setup, which is why the commit does not need
  // a cross-slot fallback of its own
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { setInboxSlot(3, root.children[2].id); captureSlot = 1; openCaptureDialog(); });
  await pg.waitForTimeout(450);
  assert.equal(await chip(), '3 Gamma', 'opening with no slot still defaults to the first non-empty one');
  await pg.evaluate(() => { captureDraft = 'x3'; doCapture(); });
  await pg.waitForTimeout(450);
  assert.deepEqual(await tree(), ['Alpha[]', 'Beta[]', 'Gamma[x3]']);

  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => {
    const el = document.querySelectorAll('.node-content')[0];
    const n = nodeById(el.dataset.id); enterEdit(el, n); el.focus(); activeContentId = n.id;
  });
  await pg.waitForTimeout(250);
  await pg.evaluate(() => openCaptureDialog(4));
  await pg.waitForTimeout(450);
  assert.equal(await chip(), '4 Alpha',
    'the documented rule survives: an empty slot ADOPTS the current point rather than redirecting');

  // ── the chipless door is untouched: it has no chip to contradict and names its own destination.
  await seed();
  await pg.waitForTimeout(250);
  assert.deepEqual(await pg.evaluate(() => {
    setInboxSlot(2, root.children[2].id); captureSlot = 1;
    appendTextToInbox('from url'); render();
    return root.children.map(c => c.text + '[' + c.children.map(k => k.text).join(',') + ']');
  }), ['Alpha[]', 'Beta[]', 'Gamma[from url]'],
    'the URL/share append still falls back to the first non-empty slot, and its own toast names it');
  await pg.close();
});

// 75. #1518 — `#fn-panel` docked at `bottom:0` under the opaque (z-640) touch quick bar, so the
// whole footnote editor was invisible: 53px overlap, the panel's only interactive row entirely
// inside the bar, and `elementFromPoint` on that row returning `qb-capture`. The editor was FOCUSED
// the whole time and typing reached the model, so nothing errored and no unit pin could see it —
// this is geometry, and geometry only exists on a real touch viewport with the bar rendered.
test('#1518 the footnote panel sits ON the touch quick bar, not under it', { skip: skip() }, async () => {
  for (const vp of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    await pg.goto(APP);
    await pg.waitForSelector('#outline', { timeout: 10000 });
    await pg.waitForTimeout(800);
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
    await pg.evaluate(() => {
      nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
      const n = mkNode('A claim worth citing[^src1]'); n.type = 'ul';
      root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
      buildIndex(root, null); markDirty(); render();
    });
    await pg.waitForTimeout(400);
    await pg.evaluate(() => {
      const m = document.querySelector('.fn-ref');
      m.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      m.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await pg.waitForTimeout(500);

    const g = await pg.evaluate(() => {
      const r = (id) => { const e = document.getElementById(id); const b = e.getBoundingClientRect();
        return { on: e.classList.contains('on'), top: b.top, bottom: b.bottom, inline: e.style.bottom || null }; };
      const key = document.querySelector('#fn-panel .fn-key').getBoundingClientRect();
      const hit = document.elementFromPoint(40, key.top + key.height / 2);
      return { fn: r('fn-panel'), qb: r('quick-bar'), qbarH: getComputedStyle(document.documentElement).getPropertyValue('--qbar-h').trim(),
               hitInPanel: !!hit?.closest('#fn-panel'), hitId: hit ? (hit.id || hit.className) : null,
               ae: document.activeElement.className || document.activeElement.tagName };
    });
    const at = `${vp.width}x${vp.height}`;
    assert.equal(g.fn.on, true, `${at}: precondition — tapping the marker opens the panel`);
    assert.equal(g.qb.on, true, `${at}: precondition — the touch quick bar is up`);
    assert.ok(g.fn.bottom <= g.qb.top + 0.5,
      `${at}: the panel must sit ON the bar, not under it (overlap ${g.fn.bottom - g.qb.top}px)`);
    assert.equal(g.fn.inline, g.qbarH,
      `${at}: and it must lift by exactly the bar's own published height`);
    // the tap target is the half that was inoperable: the user sees the bar and taps what they see.
    assert.equal(g.hitInPanel, true,
      `${at}: the footnote row must hit-test to itself, not to the bar (got ${g.hitId})`);
    assert.match(g.ae, /fn-content/, `${at}: and the editor is still focused, as it always was`);

    // ── THE NEGATIVE CASE, and the reason this is a MAX rather than a sum: with a software
    // keyboard up, `position:fixed` keeps the bar at the LAYOUT viewport bottom, behind the
    // keyboard. Adding its height would float the panel 53px above the keyboard instead of on it.
    const lifted = await pg.evaluate(() => {
      Object.defineProperty(window.visualViewport, 'height', { configurable: true, get() { return 544; } });
      syncFnPanelBottom();
      const p = document.getElementById('fn-panel');
      return { inline: p.style.bottom, bottom: p.getBoundingClientRect().bottom };
    });
    await pg.waitForTimeout(200);
    assert.equal(lifted.inline, (vp.height - 544) + 'px',
      `${at}: with the keyboard up the panel clears the KEYBOARD, and does not also add the hidden bar`);
    assert.ok(Math.abs(lifted.bottom - 544) < 1,
      `${at}: which puts it flush on the visual viewport's floor`);

    assert.deepEqual(errs, [], `${at}: no page errors`);
    await pg.close();
    await ctx.close();
  }

  // ── DESKTOP IS UNTOUCHED: no touch bar, so the floor is 0 and the panel docks flush as before.
  const pg = await fresh();
  await pg.evaluate(() => {
    root.children = [mkNode('A claim worth citing[^src1]')];
    root.children[0].type = 'ul';
    buildIndex(root); markDirty(); render();
  });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => {
    const m = document.querySelector('.fn-ref');
    m.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    m.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await pg.waitForTimeout(400);
  const desk = await pg.evaluate(() => {
    const p = document.getElementById('fn-panel');
    return { on: p.classList.contains('on'), inline: p.style.bottom, qb: document.getElementById('quick-bar').classList.contains('on') };
  });
  assert.equal(desk.qb, false, 'precondition: no quick bar on a desktop page');
  assert.equal(desk.on, true, 'the panel still opens');
  assert.equal(desk.inline, '0px', 'and still docks flush — the fix costs desktop nothing');
  await pg.close();
});

// 76. #1519 — all THREE transient strips carried the same blanket `else if (e.key !== 'Tab')
// e.stopPropagation()`, which swallowed every global chord. Measured on each: after a commit,
// Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y were total no-ops while the commit sat on `undoStack`, and
// Ctrl+Shift+I could not close the strip it had opened. Driven because the finding is what the
// KEY does — a source pin sees the listener and not the swallow.
//
// The negative half is the reason this is an allow-list rather than "forward every chord": the
// global handler claims Ctrl+V whenever `activeContentId == null` (always, inside a strip) and
// Ctrl+C / Ctrl+X whenever points are selected. Those four are driven too.
test('#1519 undo reaches the document from inside a strip, and the text chords stay in the box', { skip: skip() }, async () => {
  const pg = await fresh();
  const STRIPS = [
    { name: 'capture',   open: 'openCaptureDialog',  input: 'cap-input' },
    { name: 'journal',   open: 'openJournalStrip',   input: 'jr-input' },
    { name: 'chronicle', open: 'openChronicleStrip', input: 'chr-input' },
  ];
  const seed = (selectPoints) => pg.evaluate((sel) => {
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    root.children = ['Alpha', 'Beta', 'Gamma'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    root.gamelog = { targetId: root.children[2].id }; root.inboxes = [];
    ['closeCapture', 'closeJournalStrip', 'closeChronicleStrip'].forEach(f => { try { window[f](); } catch (_) {} });
    undoStack.length = 0; redoStack.length = 0; nodeClipboard = null;
    buildIndex(root, null); markDirty(); render();
    if (sel) { selectedIds.clear(); root.children.forEach(x => selectedIds.add(x.id)); updateSelVisuals(); }
  }, !!selectPoints);
  const st = () => pg.evaluate(() => ({
    n: root.children.length, undo: undoStack.length, redo: redoStack.length,
    ae: document.activeElement.id || document.activeElement.tagName,
    val: document.querySelector('#capture-strip .cap-input, #journal-strip .cap-input, #chronicle-strip .cap-input')?.value ?? null,
    open: ['capture', 'journal', 'chronicle'].filter(k => document.getElementById(k + '-strip')?.classList.contains('on')),
    clip: !!nodeClipboard,
  }));

  // ── EVERY strip: a committed entry must be undoable without leaving the strip.
  for (const s of STRIPS) {
    await seed();
    await pg.waitForTimeout(250);
    await pg.evaluate((o) => window[o](), s.open);
    await pg.waitForTimeout(400);
    assert.equal(await pg.evaluate(() => document.activeElement.id), s.input,
      `${s.name}: precondition — the strip took the caret`);
    await pg.keyboard.type('wrong list entirely');
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(450);
    const committed = await st();
    assert.ok(committed.undo >= 1, `${s.name}: precondition — the commit is on the undo stack`);

    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(300);
    const undone = await st();
    assert.equal(undone.undo, committed.undo - 1,
      `${s.name}: Ctrl+Z must reach the DOCUMENT stack, not vanish into the strip`);
    assert.equal(undone.redo, committed.redo + 1, `${s.name}: and land on the redo stack`);
    assert.deepEqual(undone.open, [s.name], `${s.name}: the strip stays open through an undo`);
    assert.equal(undone.ae, s.input, `${s.name}: and keeps the caret`);

    await pg.keyboard.press('Control+Shift+z');
    await pg.waitForTimeout(300);
    assert.equal((await st()).undo, committed.undo, `${s.name}: Ctrl+Shift+Z redoes`);
    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(300);
    await pg.keyboard.press('Control+y');
    await pg.waitForTimeout(300);
    assert.equal((await st()).undo, committed.undo, `${s.name}: and Ctrl+Y is the other redo spelling`);
  }

  // ── MID-DRAFT the box keeps its own undo. This is the behaviour a blanket forward destroys:
  // Ctrl+Z would undo a POINT while the user meant "take back what I just typed".
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => openCaptureDialog());
  await pg.waitForTimeout(400);
  await pg.keyboard.type('half a thought');
  await pg.waitForTimeout(250);
  const drafted = await st();
  assert.equal(drafted.val, 'half a thought');
  await pg.keyboard.press('Control+z');
  await pg.waitForTimeout(300);
  const afterDraftUndo = await st();
  assert.equal(afterDraftUndo.val, '', 'mid-draft Ctrl+Z is native TEXT undo');
  assert.equal(afterDraftUndo.n, drafted.n, 'and it must not touch the document');
  assert.equal(afterDraftUndo.undo, drafted.undo, 'nor the undo stack');

  // ── SYMPTOM B: the strip's own toggle closes it from inside, as §3 says it does.
  await seed();
  await pg.waitForTimeout(250);
  await pg.evaluate(() => openCaptureDialog());
  await pg.waitForTimeout(400);
  assert.deepEqual((await st()).open, ['capture'], 'precondition: the chord opened it');
  await pg.keyboard.press('Control+Shift+i');
  await pg.waitForTimeout(400);
  const toggled = await st();
  assert.deepEqual(toggled.open, [], 'the same chord must close it from inside');
  assert.notEqual(toggled.ae, 'cap-input', 'and focus leaves the strip');

  // ── THE NEGATIVE CASE: the four chords the global handler would misfire on stay in the textarea.
  for (const [chord, check] of [
    ['Control+a', async () => {
      const r = await pg.evaluate(() => { const i = document.getElementById('cap-input'); return [i.selectionStart, i.selectionEnd, i.value.length]; });
      assert.deepEqual([r[0], r[1]], [0, r[2]], 'Ctrl+A selects the BOX TEXT, not the points');
    }],
    ['Control+c', async () => assert.equal((await st()).clip, false, 'Ctrl+C must not copy the selected POINTS')],
    ['Control+x', async () => {
      const r = await st();
      assert.equal(r.n, 3, 'Ctrl+X must not cut the selected points out of the document');
      assert.equal(r.val, '', 'it cuts the text');
    }],
    ['Control+v', async () => assert.equal((await st()).n, 3, 'Ctrl+V must not paste POINTS into the outline')],
  ]) {
    await seed(true);                       // points selected: the state that arms Ctrl+C / Ctrl+X
    await pg.waitForTimeout(250);
    // the point clipboard is loaded ONLY for the paste case — it is Ctrl+V's precondition, and
    // pre-loading it for Ctrl+C would make "did it copy points" unmeasurable.
    await pg.evaluate((v) => { if (v) nodeClipboard = [mkNode('PASTED POINT')]; openCaptureDialog(); }, chord === 'Control+v');
    await pg.waitForTimeout(400);
    await pg.keyboard.type('draft text');
    await pg.waitForTimeout(200);
    if (chord !== 'Control+a') { await pg.keyboard.press('Control+a'); await pg.waitForTimeout(150); }
    await pg.keyboard.press(chord);
    await pg.waitForTimeout(350);
    await check();
  }
  await pg.close();
});

// 77. #1520 — in the Guided command builder, the phone's MAIN `@` and `/` menu, 48 of 89 command
// NAMES rendered at `clientWidth 0` (descriptions too), leaving a column of bare syntax fragments.
// 14 were still at zero on a 1280px desktop, so this was never only a narrow defect.
//
// UXP-250 shipped that row and verified PRESENCE only — "0 without a label, 0 without a
// description" — at one width. Presence cannot see a zero-width render, which is why this check
// measures GEOMETRY, at three widths, for both sigils.
//
// And it measures against the NAV'S OWN RECT, not just the element's width: the first attempt at
// this fix put a min-width floor on the name column, which made every label "visible" by
// clientWidth while pushing it outside the 150px nav, where it was clipped. A width-only check
// passed that. This one did not.
test('#1520 every command name and description renders inside the builder nav', { skip: skip() }, async () => {
  for (const vp of [{ width: 390, height: 844, touch: true }, { width: 768, height: 1024, touch: true }, { width: 1280, height: 900, touch: false }]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.touch, isMobile: vp.touch, deviceScaleFactor: vp.touch ? 2 : 1,
    });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    await pg.goto(APP);
    await pg.waitForSelector('#outline', { timeout: 10000 });
    await pg.waitForTimeout(800);
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);

    for (const sigil of ['@', '/']) {
      await pg.evaluate(() => {
        const io = document.getElementById('io-back'); if (io?.classList.contains('on')) closeIo();
        nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
        const n = mkNode(''); n.type = 'ul';
        root.children = [n]; nodeMap.set(n.id, n); parentMap.set(n.id, root);
        buildIndex(root, null); markDirty(); render();
        const el = document.querySelector('.node-content');
        enterEdit(el, n); el.focus(); activeContentId = n.id;
      });
      await pg.waitForTimeout(300);
      await pg.evaluate((sg) => document.execCommand('insertText', false, sg), sigil);
      await pg.waitForTimeout(700);

      const g = await pg.evaluate(() => {
        const nav = document.querySelector('.builder-nav');
        if (!nav) return null;
        const navR = nav.getBoundingClientRect();
        const audit = (sel) => {
          const els = [...document.querySelectorAll('.builder-item ' + sel)];
          const bad = els.filter(e => {
            const r = e.getBoundingClientRect();
            return e.clientWidth === 0 || r.right > navR.right + 0.5 || r.left < navR.left - 0.5;
          }).map(e => e.textContent.slice(0, 28));
          return { n: els.length, bad: bad.slice(0, 5), badCount: bad.length };
        };
        return { navW: Math.round(navR.width), label: audit('.cmd-label'), desc: audit('.cmd-desc'), typed: audit('.builder-typed') };
      });
      const at = `${vp.width}x${vp.height} "${sigil}"`;
      assert.ok(g, `${at}: the builder must be open`);
      assert.ok(g.label.n > 40, `${at}: precondition — the whole command list is rendered (${g.label.n})`);
      assert.equal(g.label.badCount, 0,
        `${at}: every command NAME must render inside the nav (${g.label.badCount} did not: ${g.label.bad.join(' | ')})`);
      assert.equal(g.desc.badCount, 0,
        `${at}: and every description (${g.desc.badCount} did not: ${g.desc.bad.join(' | ')})`);
      // P2-2 wants all THREE parts: the syntax may be ellipsised, never zero-width or outside.
      assert.equal(g.typed.badCount, 0,
        `${at}: and the typed form is still shown (${g.typed.badCount} did not: ${g.typed.bad.join(' | ')})`);
    }
    assert.deepEqual(errs, [], `${vp.width}x${vp.height}: no page errors`);
    await pg.close();
    await ctx.close();
  }
});

// 78. #1521 — the verbosity dial called a bare `render()`, which tears down the active
// contenteditable: `activeElement` fell to BODY, `activeContentId` to null, and the next characters
// typed vanished. Driven because the finding is where the caret IS afterwards and whether the next
// keystroke lands — neither is visible to a source pin.
//
// The filed repro named the two chords. Driving the family found all FOUR doors broken, so all four
// are here. The two contrast chords are driven too: they always kept the caret, and this fix must
// not be measuring something that was already true.
test('#1521 every verbosity door keeps the caret, and the next keystroke lands', { skip: skip() }, async () => {
  const pg = await fresh();
  const seed = () => pg.evaluate(() => {
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    root.children = ['Buy milk and bread', 'Two', 'Three'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    verbosity = 'guided'; syncVerbosityClass();
    buildIndex(root, null); markDirty(); render();
    const el = document.querySelector('.node-content');
    const n = nodeById(el.dataset.id);
    enterEdit(el, n); el.focus(); activeContentId = n.id; setCaretByOffset(el, 8);
    return n.id;
  });
  const st = () => pg.evaluate(() => {
    const el = document.querySelector('.node-content[data-editing]');
    return {
      ae: document.activeElement.tagName, id: activeContentId,
      caret: el ? getCaretOffset(el) : null,
      tier: [...document.body.classList].find(x => x.startsWith('v-')),
      text: root.children[0].text,
    };
  });

  const DOORS = [
    ['Ctrl+Shift+.', async () => pg.keyboard.press('Control+Shift+Period')],
    ['Ctrl+Shift+,', async () => pg.keyboard.press('Control+Shift+Comma')],
    ['the File-menu tier indicator', async () => pg.evaluate(() => document.getElementById('fm-tier-ind').click())],
    ['the tier card', async () => pg.evaluate(() => setVerbosity('standard'))],
  ];
  for (const [name, act] of DOORS) {
    const id = await seed();
    await pg.waitForTimeout(250);
    const before = await st();
    assert.equal(before.caret, 8, `${name}: precondition — the caret is at offset 8`);
    await act();
    await pg.waitForTimeout(450);
    const after = await st();
    assert.notEqual(after.ae, 'BODY', `${name}: the dial must not drop the caret to <body>`);
    assert.equal(after.id, id, `${name}: the same point is still being edited`);
    assert.equal(after.caret, 8, `${name}: at the same offset`);
    assert.notEqual(after.tier, before.tier, `${name}: and the tier actually changed`);
    // the half a user feels: the next keystroke has to land
    await pg.keyboard.type(' XYZ');
    await pg.waitForTimeout(300);
    assert.equal((await st()).text, 'Buy milk XYZ and bread',
      `${name}: typing after the dial must reach the point, not vanish`);
  }

  // ── THE CONTRAST, driven so the assertions above are not measuring something already true of
  // every chord: these two always kept the caret, and still do.
  for (const [name, key, expect] of [
    ['Ctrl+Shift+V', 'Control+Shift+V', 'Buy milk XYZ and bread'],
    ['Ctrl+Shift+X', 'Control+Shift+X', '- [ ] Buy milk XYZ and bread'],
  ]) {
    await seed();
    await pg.waitForTimeout(250);
    await pg.keyboard.press(key);
    await pg.waitForTimeout(400);
    assert.notEqual((await st()).ae, 'BODY', `${name}: keeps the caret, as it always did`);
    await pg.keyboard.type(' XYZ');
    await pg.waitForTimeout(300);
    assert.equal((await st()).text, expect, `${name}: and typing lands`);
  }

  // ── THE NEGATIVE CASE: with nothing being edited the dial is a plain re-render, and must not
  // invent a caret in a point the user was not in.
  await pg.evaluate(() => {
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    root.children = ['Alpha'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    buildIndex(root, null); markDirty(); render();
    document.activeElement.blur(); activeContentId = null;
  });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => toggleVerbosity(1));
  await pg.waitForTimeout(400);
  assert.equal(await pg.evaluate(() => activeContentId), null,
    'with nothing being edited the dial must not pull the caret into a point');
  await pg.close();
});

// 79. #1522 — `adoptDoc` cleared `focusedId` and left `selFocusId`/`selAnchorId` pointing into the
// DISCARDED document, so the row cursor named a node the new document had never contained. The
// arrows then moved nothing, painted nothing, announced nothing — and SCROLLED THE PAGE
// (0 → 40 → 80 → 120 → 80), because the handler returned before `preventDefault()`. Driven: every
// symptom is runtime state, and the scroll in particular is the false feedback that made the state
// look like it was working.
test('#1522 a document swap leaves the arrows working, not scrolling', { skip: skip() }, async () => {
  const pg = await fresh();
  const st = () => pg.evaluate(() => ({
    selFocusId, selAnchorId, sel: selectedIds.size,
    inFlat: selFocusId != null && flatIndex.has(selFocusId),
    rows: flatRows.length, cursors: document.querySelectorAll('.node-cursor').length,
    live: (document.getElementById('a11y-live') || {}).textContent?.trim() || '',
    scrollY: Math.round(window.scrollY), activeContentId,
  }));
  const seed = () => pg.evaluate(() => {
    nodeMap.clear(); parentMap.clear(); nodeMap.set(root.id, root);
    root.children = ['Alpha', 'Beta', 'Gamma'].map(t => { const n = mkNode(t); n.type = 'ul'; return n; });
    root.children.forEach(n => { nodeMap.set(n.id, n); parentMap.set(n.id, root); });
    selectedIds.clear(); selAnchorId = null; selFocusId = null;
    buildIndex(root, null); markDirty(); render();
    document.activeElement.blur(); activeContentId = null;
    const l = document.getElementById('a11y-live'); if (l) l.textContent = '';
  });

  // ── THE CAUSE: a swap taken while a cursor and a selection are live.
  await seed();
  await pg.waitForTimeout(300);
  await pg.evaluate(() => {
    moveRowCursor(root.children[2].id, { silent: true });
    root.children.forEach(x => selectedIds.add(x.id));   // and a live multi-selection
    updateSelVisuals();
  });
  await pg.waitForTimeout(250);
  const before = await st();
  assert.equal(before.inFlat, true, 'precondition: the cursor is on a real row');
  assert.equal(before.sel, 3, 'precondition: three points are selected');

  await pg.evaluate(() => {
    const r = mkRoot(); const n = mkNode('Fresh'); n.type = 'ul'; r.children = [n];
    adoptDoc(r, { fileName: 'x.opml' });
  });
  await pg.waitForTimeout(450);
  const swapped = await st();
  assert.equal(swapped.selFocusId, null, 'the swap must drop the row cursor of the outgoing document');
  assert.equal(swapped.selAnchorId, null, 'and its anchor');
  assert.equal(swapped.sel, 0,
    'and its selection — it named three points the new document has never contained');

  // the arrows work, and the PAGE DOES NOT SCROLL
  await pg.keyboard.press('ArrowDown');
  await pg.waitForTimeout(300);
  const moved = await st();
  assert.equal(moved.inFlat, true, 'ArrowDown must put the cursor on a real row of the NEW document');
  assert.equal(moved.cursors, 1, 'painted');
  assert.match(moved.live, /Fresh, 1 of 1/, 'and announced');
  assert.equal(moved.scrollY, 0, 'and the page must not scroll instead — that is the false "it worked"');

  // ── THE DEFENCE, on a path that is NOT adoptDoc: undo replaces root too, and does not clear the
  // selection either. A cursor left on a point that undo removed must still yield a working arrow.
  await seed();
  await pg.waitForTimeout(300);
  await pg.evaluate(() => {
    moveRowCursor(root.children[2].id, { silent: true });
    // drop the point the cursor is on, without touching selFocusId
    root.children = root.children.slice(0, 2);
    buildIndex(root, null); markDirty(); render();
  });
  await pg.waitForTimeout(300);
  const stale = await st();
  assert.equal(stale.inFlat, false, 'precondition: the cursor names a point that is no longer on screen');
  await pg.keyboard.press('ArrowDown');
  await pg.waitForTimeout(300);
  const rescued = await st();
  assert.equal(rescued.inFlat, true, 'a stale cursor from ANY path must still yield a working arrow');
  assert.equal(rescued.scrollY, 0, 'without scrolling the page');

  // ── ENTRY LANDS ON THE NEAR END, both directions. The old fallback started at row 0 and STEPPED,
  // so ArrowDown skipped the first row and ArrowUp fell off the front and scrolled.
  await seed();
  await pg.waitForTimeout(300);
  await pg.keyboard.press('ArrowDown');
  await pg.waitForTimeout(300);
  assert.match((await st()).live, /Alpha, 1 of 3/, 'ArrowDown with no cursor enters at the FIRST row');
  await seed();
  await pg.waitForTimeout(300);
  await pg.keyboard.press('ArrowUp');
  await pg.waitForTimeout(300);
  assert.match((await st()).live, /Gamma, 3 of 3/, 'and ArrowUp at the last');

  // ── THE NEGATIVE CASE: a live cursor still steps, Shift+Arrow still ranges, Enter still re-enters.
  await seed();
  await pg.waitForTimeout(300);
  await pg.evaluate(() => moveRowCursor(root.children[0].id, { silent: true }));
  await pg.waitForTimeout(200);
  await pg.keyboard.press('ArrowDown');
  await pg.waitForTimeout(250);
  assert.match((await st()).live, /Beta, 2 of 3/, 'an ordinary step is unchanged');
  await pg.keyboard.press('Shift+ArrowDown');
  await pg.waitForTimeout(250);
  assert.equal((await st()).sel, 2, 'Shift+Arrow still extends a range');
  await pg.evaluate(() => { selectedIds.clear(); updateSelVisuals(); moveRowCursor(root.children[0].id, { silent: true }); });
  await pg.waitForTimeout(200);
  await pg.keyboard.press('Enter');
  await pg.waitForTimeout(350);
  assert.ok(await pg.evaluate(() => activeContentId != null),
    'and Enter is still the way back into the point');
  await pg.close();
});

// #1523: EVERY dialog footer button stays inside the card and stays tappable at phone widths.
//
// `.io-foot` was a nowrap flex row justified to flex-end, so a footer wider than the card
// overflowed to the LEFT -- off the card, off the screen. Leftward overflow is invisible to
// scrollWidth (foot, #io-card and the document all reported scrollWidth === clientWidth), so
// nothing could scroll to it: scrollLeft and scrollIntoView were both no-ops.
//
// Measured before the fix, at 320 wide in a touch context: Reusable packs' "+ New pack" sat at
// -90..22 against a card starting at 14, leaving 7 hit-testable pixels; with the stale `welcome`
// class still on the card (the leak fixed alongside) it was -97..14 -- ZERO. The
// already-configured calendar's "Cancel" was worse: zero hit-testable pixels either way.
//
// The census matters here. The filed report named ONE dialog and called the others negative
// controls, but the controls were measured in their fresh state: openCalendarDialog and
// openUnitsDialog each grow a THIRD (danger) button once a calendar/units already exist, and both
// overflow at 320. So this check drives the three-button states too, and asserts the two-button
// ones stay single-row -- measuring the negative case, not just the positive.
//
// The assertion is a hit test, not a look: a clipped button can still report a healthy
// getBoundingClientRect (#1520's lesson), so elementFromPoint across the button's centre-y is what
// actually proves a finger can land on it. 24px is the repo's tap floor.
test('#1523 every dialog footer button stays inside the card and stays tappable at phone widths', { skip: skip() }, async () => {
  // ORDER MATTERS: the cases share one page, and the three-button states are three-button
  // BECAUSE they mutate the document (a calendar/units now exist, so the dialog grows its danger
  // button). Every fresh-state case therefore runs before anything that configures one, or it
  // inherits the previous case's document and stops measuring the state it names.
  const CASES = [
    ['units, none set',     `openUnitsDialog();`,                                                2],
    ['packs edit view',     `_packDraft = newPluginPack('P'); _packEditId = _packDraft.id; openDataPackManager();`, 2],
    ['Reusable packs',      `_packEditId = null; openDataPackManager();`,                       4],
    ['units, already set',  `applyUnitsChange('cp\\nsp = 10 cp'); openUnitsDialog();`,           3],
    ['calendar, already set', `applyCalendarChange(buildCalendarFromFields({ months: 'Firstfrost: 30\\nDeepwinter: 30', week: '', eras: '', current: '1-01-01' })); openCalendarDialog();`, 3],
  ];
  for (const width of [320, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    await pg.goto(APP);
    await pg.waitForSelector('#outline', { timeout: 10000 });
    await pg.waitForTimeout(800);
    await pg.keyboard.press('Escape');          // dismiss the first-run welcome
    await pg.waitForTimeout(300);

    // The leak that made every measurement below worse: openStarterGallery sets `welcome` on the
    // SHARED #io-card, and closeIo used to remove `guide-open` but not `welcome`. The class then
    // rode along on every later dialog, where `#io-card.welcome{max-width:calc(100vw - 32px)}`
    // outranks the narrow-sheet rule and shaves 16px off the card.
    assert.equal(await pg.evaluate(() => document.getElementById('io-card').classList.contains('welcome')), false,
      `${width}: dismissing the welcome chooser must not leave its class on the shared card`);

    for (const [name, expr, wantBtns] of CASES) {
      const g = await pg.evaluate((e) => {
        (0, eval)(e);
        const card = document.getElementById('io-card');
        const foot = card.querySelector('.io-foot');
        const cr = card.getBoundingClientRect();
        const padL = parseFloat(getComputedStyle(card).paddingLeft);
        const bs = [...foot.querySelectorAll('.io-btn')];
        foot.scrollIntoView({ block: 'end' });   // the card scrolls; a tall dialog's footer starts below the fold
        const rects = bs.map(b => b.getBoundingClientRect());
        // widest escape past the card's left content edge, and the hit width of each button
        const clip = Math.max(0, ...rects.map(q => (cr.left + padL) - q.left));
        const hits = bs.map((b, i) => {
          const q = rects[i], cy = Math.round(q.top + q.height / 2);
          let n = 0;
          for (let x = 0; x < Math.min(window.innerWidth, Math.ceil(q.right) + 4); x++) {
            if (document.elementFromPoint(x, cy) === b) n++;
          }
          return { label: b.textContent, hit: n };
        });
        const rows = new Set(rects.map(q => Math.round(q.top))).size;
        return { n: bs.length, clip: Math.round(clip), rows, hits, cardW: Math.round(cr.width) };
      }, expr);

      assert.equal(g.n, wantBtns, `${width} ${name}: expected ${wantBtns} footer buttons, got ${g.n} (${g.hits.map(h => h.label).join(' | ')})`);
      assert.equal(g.clip, 0, `${width} ${name}: a footer button escapes the card's left edge by ${g.clip}px`);
      for (const h of g.hits) {
        assert.ok(h.hit >= 24, `${width} ${name}: "${h.label}" has only ${h.hit} hit-testable px (tap floor is 24)`);
      }
      // The negative case: a footer that FITS must not wrap. Without this, "clip === 0" would also
      // be satisfied by a rule that stacked every footer at every width, which is a different app.
      if (wantBtns === 2) {
        assert.equal(g.rows, 1, `${width} ${name}: a two-button footer must still be one row, not stacked`);
      }
      await pg.evaluate(() => closeIo());
      await pg.waitForTimeout(120);
    }
    assert.deepEqual(errs, [], `${width}: no page errors while driving the dialog footers`);
    await pg.close();
    await ctx.close();
  }
});

// #1559: the layout sweep still MEASURES. This is the gate whose absence let the driver rot.
//
// The sweep used to be a fenced code block in guidance/ux-definition-of-done.md, copied into a
// scratchpad on demand. Nothing ran it, so nothing could tell when it stopped working -- and it had
// stopped: the first-run welcome chooser shipped after its numbers of record were taken, #io-back
// then covered the viewport, and elementFromPoint returned the backdrop for every control, so every
// non-dialog surface read 100% unreachable. It went stale silently instead of breaking loudly.
//
// WHAT THIS ASSERTS, AND WHAT IT DELIBERATELY DOES NOT. It proves the INSTRUMENT is alive: the seed
// really clears the modal layer, the save chip really is frozen, the reach walk really judges
// controls, and the cores really run in the page and agree with the same functions tests/test.mjs
// pins. It does NOT assert the app is layout-clean at every width -- #toolbar-row currently is not
// (#1560, a 561-660px band where the button cluster is unreachable), and baking that into a gate
// would either freeze the bug in place or paint the instrument red for a defect it exists to find.
// One width, verified clean and away from that band, carries the "a real surface measures sane"
// half; the sweep itself is the tool for breadth.
test('#1559 the layout sweep still measures: seed, freeze, and a live reach walk', { skip: skip() }, async () => {
  const { SEED, MEASURE, SAVE_STATUS_FREEZE, SURFACES, rowFails, sharesLine, spillPx } =
    await import('../tools/layout-sweep.mjs');
  const control = SURFACES[0];
  assert.equal(control.control, true, 'the first surface must be the control');

  const ctx = await browser.newContext({ viewport: { width: 1400, height: 640 }, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
  await pg.goto(APP);
  await pg.waitForSelector('#outline', { timeout: 10000 });
  await pg.waitForTimeout(700);

  // Before the seed, the chooser really is up -- otherwise the assertion after it proves nothing.
  assert.equal(await pg.evaluate(() => document.getElementById('io-back').classList.contains('on')), true,
    'the first-run chooser should be open before the seed; if it is not, the next assertion is vacuous');
  await pg.evaluate(SEED);
  await pg.waitForTimeout(400);
  assert.equal(await pg.evaluate(() => document.getElementById('io-back').classList.contains('on')), false,
    'SEED must clear the modal backdrop, or every control reads unreachable (the rot this gate exists for)');
  assert.equal(await pg.evaluate(() => document.querySelector('#save-status .ss-text').textContent),
    SAVE_STATUS_FREEZE, 'SEED must freeze the save chip, or geometry races autosave');

  await pg.addScriptTag({ content: MEASURE });
  const r = await pg.evaluate(sel => window.__measure(sel), control.sel);

  // The reach walk must have JUDGED something. "unreachable: []" is also what a walk that skipped
  // everything reports, and that is exactly how the old band filter hid #1523's zero-pixel button.
  assert.ok(r.walked >= 5, `the reach walk judged only ${r.walked} controls; a walk that skips everything reports "clean"`);
  assert.ok(r.kids >= 3, `expected the toolbar's children, measured ${r.kids}`);
  assert.equal(r.lines, 1, 'the toolbar is one line at 1400px');
  assert.deepEqual(r.overlaps, [], 'no overlaps at 1400px');
  assert.deepEqual(r.unreachable, [], 'no unreachable control at 1400px');
  assert.deepEqual(r.offscreen, [], 'nothing offscreen at 1400px');
  assert.equal(rowFails(r, control), false, 'the control is clean at 1400px');

  // The cores really ran in the page, and they are the same functions the unit suite pins. A page
  // copy that had drifted would still produce a plausible-looking row, which is the whole problem
  // this file exists to make visible.
  const agree = await pg.evaluate(() => ({
    line: sharesLine({ top: 0, bottom: 44, left: 0, right: 10 }, { top: 13, bottom: 31, left: 0, right: 10 }),
    spill: spillPx({ left: 10, right: 655, top: 0, bottom: 44 }, 0, 620, 0, 0, false),
  }));
  assert.equal(agree.line, sharesLine({ top: 0, bottom: 44, left: 0, right: 10 }, { top: 13, bottom: 31, left: 0, right: 10 }),
    'the in-page sharesLine must agree with the pinned one');
  assert.equal(agree.spill, spillPx({ left: 10, right: 655, top: 0, bottom: 44 }, 0, 620, 0, 0, false),
    'the in-page spillPx must agree with the pinned one');
  assert.equal(agree.spill, 35, 'and both must give the measured answer');

  assert.deepEqual(errs, [], 'no page errors while running the sweep');
  await pg.close();
  await ctx.close();
});

// #1560: every toolbar control is hit-testable at every width, and the level control's alternate
// door really works where the toolbar one is gone.
//
// The row could not stop overflowing: #save-status was flex-shrink:0, #level-ctl is flex-shrink:0
// by design, #search-wrap carries a 190px floor -- so logo + chip + search + level exceeded the
// viewport on their own and #tbtn-cluster, the element built to absorb the squeeze, was laid out
// PAST the right edge. Measured 5px of strip at x 650 in a 620px window, 8-11 controls with no
// hit-testable pixel across 561-675px, and the trigger was ordinary: the save chip gains 38px when
// autosave lands, so the app was clickable for a second after load and then was not.
//
// Source pins cannot see any of that -- the CSS was "present" the whole time. This drives it.
// Widths are chosen either side of both breakpoints, including 560/561 where the phone sheet takes
// over, because an off-by-one there would leave a one-pixel-wide broken band.
test('#1560 every toolbar control is reachable at every width, and the level door moves rather than vanishing', { skip: skip() }, async () => {
  const { SEED } = await import('../tools/layout-sweep.mjs');
  for (const width of [820, 760, 700, 620, 580, 561, 560, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 700 }, hasTouch: true, isMobile: true });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    await pg.goto(APP);
    await pg.waitForSelector('#outline', { timeout: 10000 });
    await pg.waitForTimeout(700);
    await pg.evaluate(SEED);            // also freezes the save chip, so this does not race autosave
    await pg.waitForTimeout(350);

    const g = await pg.evaluate(async () => {
      // These buttons are MEANT to be reached by swiping, so each one is revealed in turn and then
      // judged. Scrolling the strip ONCE to its far end is not the same test: it hides the near-end
      // buttons, and reported 6 dead controls at 820px, a width that is demonstrably fine.
      const strip = document.getElementById('tbtn-cluster');
      strip.style.scrollBehavior = 'auto';
      const dead = [];
      const btns = [...document.querySelectorAll('#toolbar-row button')].filter(b => b.getBoundingClientRect().width > 0);
      for (const el of btns) {
        if (strip.contains(el)) {
          el.scrollIntoView({ block: 'nearest', inline: 'center' });
          await new Promise(r => setTimeout(r, 40));
        }
        const q = el.getBoundingClientRect();
        const L = Math.max(q.left, 0), R = Math.min(q.right, innerWidth);
        const T = Math.max(q.top, 0), B = Math.min(q.bottom, innerHeight);
        if (R - L < 1 || B - T < 1) { dead.push(el.id || String(el.className).split(' ')[0]); continue; }
        const t = document.elementFromPoint(Math.round((L + R) / 2), Math.round((T + B) / 2));
        if (!t || !(t === el || el.contains(t))) dead.push(el.id || String(el.className).split(' ')[0]);
      }
      const lvl = document.getElementById('level-ctl');
      return { dead, count: btns.length, strip: strip.clientWidth,
               stripRight: Math.round(strip.getBoundingClientRect().right), innerWidth,
               levelInToolbar: getComputedStyle(lvl).display !== 'none',
               fmRow: getComputedStyle(document.getElementById('fm-levels-row')).display !== 'none' };
    });

    assert.ok(g.count >= 5, `${width}: expected the toolbar's buttons, found ${g.count} — a walk over nothing reports clean`);
    assert.deepEqual(g.dead, [], `${width}: ${g.dead.length} toolbar control(s) with no hit-testable pixel`);
    // The strip must be ON screen and wide enough to show a control, not merely scrollable in
    // principle. Its 5px remnant at x 650 in a 620px window satisfied "scrollable" and was useless.
    assert.ok(g.strip >= 44, `${width}: the icon strip is ${g.strip}px — below the one-button floor`);
    assert.ok(g.stripRight <= g.innerWidth + 1, `${width}: the icon strip ends at ${g.stripRight}, past the ${g.innerWidth}px viewport`);
    // Exactly one home for the level control at any width: moved, never removed, never duplicated.
    assert.equal(g.levelInToolbar, width > 760, `${width}: the toolbar level control should be ${width > 760 ? 'shown' : 'hidden'}`);
    assert.equal(g.fmRow, !g.levelInToolbar, `${width}: the File-menu level row must be shown exactly when the toolbar one is not`);
    assert.deepEqual(errs, [], `${width}: no page errors`);
    await pg.close();
    await ctx.close();
  }
});

// The alternate door has to WORK, not just render. #1560 hides the toolbar level control across a
// 200px band, so this drives the File-menu one: scroll to it, tap it, and watch the outline change.
test('#1560 the File-menu level control is tappable and actually changes the level', { skip: skip() }, async () => {
  const { SEED } = await import('../tools/layout-sweep.mjs');
  const ctx = await browser.newContext({ viewport: { width: 620, height: 700 }, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  await pg.goto(APP);
  await pg.waitForSelector('#outline', { timeout: 10000 });
  await pg.waitForTimeout(700);
  await pg.evaluate(SEED);
  await pg.evaluate(() => {
    const par = root.children[0], kid = mkNode('Nested child'); kid.type = 'ul';
    par.children = [kid]; nodeMap.set(kid.id, kid); parentMap.set(kid.id, par);
    markDirty(); render();
  });
  await pg.waitForTimeout(300);

  const r = await pg.evaluate(async () => {
    const before = document.querySelectorAll('.node-content').length;
    openFileMenu();
    await new Promise(r => setTimeout(r, 400));
    const btn = document.querySelector('#fm-levels .lvl-btn[data-lvl="1"]');
    // #fm-pane is the scroller and it scrolls SMOOTHLY: a scrollIntoView plus a short wait moves a
    // fraction of the distance and the control reads unreachable when it is merely still moving.
    for (let e = btn.parentElement; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (['auto', 'scroll'].includes(s.overflowY) && e.scrollHeight > e.clientHeight + 1) {
        e.style.scrollBehavior = 'auto'; e.scrollTop = e.scrollHeight;
      }
      if (e === document.body) break;
    }
    await new Promise(r => setTimeout(r, 250));
    const q = btn.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2));
    const tappable = !!hit && (hit === btn || btn.contains(hit));
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    return { before, tappable, h: Math.round(q.height), name: btn.getAttribute('aria-label'),
             after: document.querySelectorAll('.node-content').length };
  });

  assert.equal(r.tappable, true, 'the File-menu level button must be hit-testable once scrolled to');
  assert.ok(r.h >= 24, `the File-menu level button is ${r.h}px tall — below the 24px tap floor`);
  assert.equal(r.name, 'Show 1 level', 'and it must carry its accessible name');
  assert.ok(r.after < r.before, `pressing it must collapse the outline (${r.before} -> ${r.after} points)`);
  await pg.close();
  await ctx.close();
});
