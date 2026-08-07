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
