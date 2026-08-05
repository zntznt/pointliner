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
