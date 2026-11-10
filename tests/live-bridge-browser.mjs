// End-to-end test uses only the synthetic OPML below and a local PTY.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
let chromium;
try { ({ chromium } = await import('playwright')); } catch {}

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const defaultApp = 'file://' + join(repo, 'index.html');
const opml = readFileSync(join(repo, 'tests/fixtures/live-bridge-disposable.opml'), 'utf8');

async function until(fn, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = fn(); if (value) return value; await new Promise(r => setTimeout(r, 100)); }
  throw Error('Timed out waiting for local bridge');
}

test('disposable OPML: CLI pairs, reads one branch, appends, respects editing, undoes and disconnects', { timeout: 60000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  const child = spawn('script', ['-qfec', 'node tools/live-agent.mjs --pairing-file', '/dev/null'], { cwd: repo, stdio: 'pipe' });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  try {
    const port = await until(() => /Port: (\d+)/.exec(output)?.[1]);
    const app = 'file://' + await until(() => /Experimental app: ([^\r\n]+)/.exec(output)?.[1]);
    const pairingPath = await until(() => /Private pairing file: ([^\r\n]+)/.exec(output)?.[1]);
    assert.equal(statSync(pairingPath).mode & 0o777, 0o600);
    const secret = readFileSync(pairingPath, 'utf8').trim();
    assert.match(secret, /^[a-f0-9]{64}$/);
    assert.equal(output.includes(secret), false);
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('requestfailed', r => errors.push(r.failure()?.errorText || 'failed'));
    await page.addInitScript(() => { delete window.showOpenFilePicker; });
    await page.goto(app); await page.waitForSelector('#outline'); await page.waitForTimeout(1000);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    assert.ok(csp.includes(`connect-src http://127.0.0.1:${port};`));
    await page.keyboard.press('Escape');
    await page.locator('#logo-btn').click();
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#btn-open').click();
    await (await chooser).setFiles(join(repo, 'tests/fixtures/live-bridge-disposable.opml'));
    await page.waitForFunction(() => fileName === 'live-bridge-disposable.opml');
    const point = page.locator('.node-content').filter({ hasText: 'Sandbox' }).first();
    await point.click();
    await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
    assert.equal(await page.locator('#live-scope-selected').isVisible(), false);
    assert.equal(await page.locator('#live-scope-document').isVisible(), false);
    await page.locator('#live-scope-choice').selectOption('document');
    assert.equal(await page.locator('#live-scope-document').isVisible(), true);
    assert.equal(await page.locator('#live-scope-selected').isVisible(), false);
    await page.locator('#live-scope-choice').selectOption('selected');
    assert.equal(await page.locator('#live-scope').innerText(), 'Sandbox');
    assert.equal(await page.locator('#live-scope-document').isVisible(), false);
    await page.locator('#live-port').fill(port); await page.locator('#live-secret').fill(secret);
    await page.locator('#live-disposable').check(); await page.locator('#live-scope-choice').selectOption('selected'); await page.locator('#live-connect').click();
    try { await page.waitForFunction(() => document.querySelector('#live-status').textContent === 'Connected', null, {timeout: 5000}); } catch { throw Error('Connection failed: ' + await page.locator('#live-status').textContent() + ' / ' + errors.join('; ')); }
    assert.equal(await page.locator('#live-secret').inputValue(), '');
    async function command(line, expected) {
      const start = output.length; child.stdin.write(line + '\n');
      return until(() => { const tail = output.slice(start); return tail.includes(expected) && tail.includes('agent>') ? tail : null; });
    }
    await page.evaluate(() => { root.children[0].children[0].props = [{ key: 'created', val: '2020-01-01' }, { key: 'edited', val: '2020-01-02' }]; });
    // Exercise the real post-connect state without reopening UI or moving focus.
    const focusedBefore = await page.evaluate(() => ({ id: document.activeElement.id, tag: document.activeElement.tagName }));
    console.log('Post-connect focus:', JSON.stringify(focusedBefore));
    const read = await command('read', 'Initial');
    assert.deepEqual(await page.evaluate(() => ({ id: document.activeElement.id, tag: document.activeElement.tagName })), focusedBefore);
    // Connection state is operational feedback, not optional guidance.
    await page.locator('#logo-btn').click();
    for (const tier of ['standard', 'lean', 'guided']) {
      await page.evaluate(tier => { setVerbosity(tier); if (!document.querySelector('#file-menu').classList.contains('on')) document.querySelector('#logo-btn').click(); }, tier);
      assert.equal(await page.locator('#live-status').isVisible(), true, tier);
      assert.equal(await page.locator('#live-status').textContent(), 'Connected');
      await page.keyboard.press('Escape');
    }

    await page.evaluate(() => document.activeElement.blur());
    // Opening the File menu puts keyboard focus in its search field. It is
    // incidental UI, not an uncommitted document editor.
    await page.locator('#logo-btn').click();
    await page.waitForFunction(() => document.activeElement.id === 'fm-search');
    await page.keyboard.type('bridge');
    await command('read', 'Initial');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'fm-search');
    assert.equal(await page.locator('#fm-search').inputValue(), 'bridge');
    assert.equal(await page.locator('#live-open').isVisible(), true);
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'live-open');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'live-disconnect');
    await page.locator('#fm-search').focus();
    await command('append Focus safe', '"appended":true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'fm-search');
    assert.equal(await page.locator('#fm-search').inputValue(), 'bridge');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+z');
    assert.match(read, /Sandbox/); assert.doesNotMatch(read, /Outside/);
    const ids = await page.evaluate(() => ({ inside: root.children[0].children[0].id, outside: root.children[1].id }));
    const originalProps = JSON.stringify([{ key: 'created', val: '2020-01-01' }, { key: 'edited', val: '2020-01-02' }]);
    assert.ok(read.includes(JSON.stringify(originalProps)));
    const response = JSON.parse(read.match(/\{\"points\":\[.*\]\}/)[0]);
    assert.equal(response.points.find(p => p.id === ids.inside).propsVersion, originalProps);
    const edit = (pointId, expected, text, propsVersion = response.points.find(p => p.id === ids.inside).propsVersion) => 'edit ' + JSON.stringify({ pointId, expected, propsVersion, text });
    // Both spellings may not be supplied together; legacy spelling still works.
    await command('edit ' + JSON.stringify({pointId: ids.inside, expected: 'Initial', text: 'Bad', propsVersion: originalProps, expectedProps: originalProps}), 'Use edit JSON');
    assert.equal(await page.evaluate(id => nodeById(id).text, ids.inside), 'Initial');
    await command('edit ' + JSON.stringify({pointId: ids.inside, expected: 'Initial', text: 'Legacy', expectedProps: originalProps}), '"edited":true');
    await page.keyboard.press('Control+z');
    await page.locator('#logo-btn').click();
    await page.waitForFunction(() => document.activeElement.id === 'fm-search');
    await page.keyboard.type('live');
    await command(edit(ids.inside, 'Initial', 'Menu edit'), '"edited":true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'fm-search');
    assert.equal(await page.locator('#fm-search').inputValue(), 'live');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Control+z');
    await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
    await page.locator('#live-port').fill('12345');
    await page.evaluate(() => document.getElementById('live-port').dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    await command('append Composition blocked', 'Finish editing');
    await command(edit(ids.inside, 'Initial', 'Composition edit'), 'Finish editing');
    assert.equal(await page.evaluate(id => nodeById(id).text, ids.inside), 'Initial');
    assert.equal(await page.evaluate(() => root.children[0].children.some(n => n.text === 'Composition blocked')), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'live-port');
    assert.equal(await page.locator('#live-port').inputValue(), '12345');
    await page.evaluate(() => document.getElementById('live-port').dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    await command('append Dialog append', '"appended":true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'live-port');
    assert.equal(await page.locator('#live-port').inputValue(), '12345');
    await command(edit(ids.inside, 'Initial', 'Dialog edit'), '"edited":true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'live-port');
    assert.equal(await page.locator('#live-port').inputValue(), '12345');
    await page.locator('#live-cancel').click();
    await page.keyboard.press('Control+z'); await page.keyboard.press('Control+z');
    await page.evaluate(id => { nodeById(id).props[1].val = '2021-01-01'; }, ids.inside);
    await command(edit(ids.inside, 'Initial', 'Changed'), 'Stale properties');
    await page.evaluate(id => { nodeById(id).props[1].val = '2020-01-02'; }, ids.inside);
    await command(edit(ids.inside, 'wrong', 'Changed'), 'Stale text');
    await command(edit(ids.outside, 'Outside', 'Changed'), 'outside scope');
    await command(edit(ids.inside, 'Initial', 'Changed'), '"edited":true');
    assert.equal(await page.evaluate(id => nodeById(id).text, ids.inside), 'Changed');
    assert.deepEqual(await page.evaluate(id => nodeById(id).props.find(p => p.key === 'created').val, ids.inside), '2020-01-01');
    assert.notEqual(await page.evaluate(id => nodeById(id).props.find(p => p.key === 'edited').val, ids.inside), '2020-01-02');
    await page.keyboard.press('Control+z');
    assert.equal(await page.evaluate(id => nodeById(id).text, ids.inside), 'Initial');
    assert.equal(await page.evaluate(id => JSON.stringify(nodeById(id).props), ids.inside), originalProps);
    await command(edit(ids.inside, 'Initial', '1. item'), 'Unsupported point');
    await command('append 1. item', 'Unsupported text');
    await command('append {1d6}', 'Unsupported text');
    await page.evaluate(id => { nodeById(id).props[1].key = ' edited '; }, ids.inside);
    await command(edit(ids.inside, 'Initial', 'Changed'), 'Unsupported point');
    assert.equal(await page.evaluate(id => nodeById(id).props[1].key, ids.inside), ' edited ');
    await page.evaluate(id => { nodeById(id).props[1].key = 'edited'; }, ids.inside);
    await page.evaluate(id => { nodeById(id).props.push({key: 'private', val: 'preserve'}); }, ids.inside);
    await command(edit(ids.inside, 'Initial', 'Changed'), 'Unsupported point');
    await page.evaluate(id => { nodeById(id).props.pop(); }, ids.inside);
    await page.evaluate(id => { nodeById(id).note = 'Keep this note'; }, ids.inside);
    await command(edit(ids.inside, 'Initial', 'Changed'), 'Unsupported point');
    await page.evaluate(id => { nodeById(id).note = ''; nodeById(id).dice.push({}); }, ids.inside);
    await command(edit(ids.inside, 'Initial', 'Changed'), 'Unsupported point');
    await page.evaluate(id => { nodeById(id).dice = []; }, ids.inside);
    await command(edit(ids.inside, 'Initial', 'Hello {1d6}'), 'Unsupported point');
    await command('append Added from agent', '"appended":true');
    await page.waitForFunction(() => root.children[0].children.some(n => n.text === 'Added from agent'));
    await point.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' unsaved draft');
    const draft = await page.evaluate(() => ({ text: document.activeElement.textContent, id: document.activeElement.dataset.id }));
    assert.match(draft.text, /unsaved draft/);
    await command('append Must be blocked', 'Finish editing');
    await command(edit(ids.inside, 'Initial', 'Changed'), 'Finish editing');
    assert.deepEqual(await page.evaluate(() => ({ text: document.activeElement.textContent, id: document.activeElement.dataset.id })), draft);
    await page.evaluate(() => document.activeElement.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    await command('append Draft IME blocked', 'Finish editing');
    await command(edit(ids.inside, 'Initial', 'Changed'), 'Finish editing');
    assert.deepEqual(await page.evaluate(() => ({ text: document.activeElement.textContent, id: document.activeElement.dataset.id })), draft);
    await page.evaluate(() => document.activeElement.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    assert.equal(await page.evaluate(() => root.children[0].children.some(n => n.text === 'Must be blocked' || n.text === 'Draft IME blocked')), false);
    await page.locator('#logo-btn').click(); await page.locator('#live-open').click(); await page.locator('#live-cancel').click();
    await page.evaluate(() => document.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    await command('append IME blocked', 'Finish editing');
    await page.evaluate(() => document.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    await page.keyboard.press('Control+z'); // undo the committed draft
    await page.keyboard.press('Control+z'); // undo the agent append
    assert.equal(await page.evaluate(() => root.children[0].children.some(n => n.text === 'Added from agent')), false);
    // Projection alone fits 12 KB, but timestamp versions push the actual
    // JSON envelope past the helper's 16 KB body limit. The session must survive.
    await page.evaluate(() => {
      const parent = root.children[0];
      for (let i = 0; i < 98; i++) {
        const n = mkNode('x');
        n.props = [{ key: 'created', val: 'é'.repeat(40) }, { key: 'edited', val: 'é'.repeat(40) }];
        parent.children.push(n);
      }
      buildIndex(root); render(); document.activeElement.blur();
    });
    assert.ok(await page.evaluate(() => new TextEncoder().encode(JSON.stringify(liveBridgeScope(root, root.children[0].id))).length < 12000));
    assert.ok(await page.evaluate(() => {
      const points = liveBridgeScope(root, root.children[0].id).map(p => ({ ...p, propsVersion: JSON.stringify(nodeById(p.id).props) }));
      return new TextEncoder().encode(JSON.stringify({ op: 'respond', id: 1, result: { points } })).length > 16384;
    }));
    await command('read', 'Response too large; choose a smaller scope');
    assert.equal(await page.locator('#live-status').textContent(), 'Connected');
    await page.evaluate(() => { root.children[0].children.splice(1); buildIndex(root); render(); document.activeElement.blur(); });
    await command('read', 'Initial');
    await page.evaluate(() => { document.activeElement.blur(); for (let i = 0; i < 996; i++) root.children.push(mkNode('synthetic ' + i)); buildIndex(root); markDirty(); render(); });
    assert.equal(await page.evaluate(() => 1 + root.children.length + root.children[0].children.length), 1000);
    const beforeUndo = await page.evaluate(() => undoStack.length);
    await command('append Over document limit', 'Document is full');
    assert.equal(await page.evaluate(() => root.children[0].children.some(n => n.text === 'Over document limit')), false);
    assert.equal(await page.evaluate(() => undoStack.length), beforeUndo);
    await command('read', 'Initial');
    await page.locator('#logo-btn').click();
    await page.locator('#fm-search').fill('disconnect bridge');
    assert.equal(await page.locator('#live-open').isVisible(), false);
    assert.equal(await page.locator('#live-disconnect').isVisible(), true);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#live-status').textContent === 'Disconnected');
    const failedRead = await command('read', 'The read did not return a result');
    assert.doesNotMatch(failedRead, /append may have applied/i);
    assert.deepEqual(errors, []);
    await page.close();
  } finally { child.stdin.write('disconnect\n'); await until(() => child.exitCode !== null || child.signalCode !== null, 5000).catch(() => child.kill()); await browser.close(); }
});


test('switching documents immediately stops a paired disposable session', { timeout: 30000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  const child = spawn('script', ['-qfec', 'node tools/live-agent.mjs', '/dev/null'], { cwd: repo, stdio: 'pipe' });
  let output = ''; child.stdout.on('data', chunk => { output += chunk.toString(); });
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  try {
    const port = await until(() => /Port: (\d+)/.exec(output)?.[1]);
    const app = 'file://' + await until(() => /Experimental app: ([^\r\n]+)/.exec(output)?.[1]);
    const secret = await until(() => /Browser secret \(paste once into Pointliner\): ([a-f0-9]{64})/.exec(output)?.[1]);
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.goto(app); await page.waitForSelector('#outline'); await page.waitForTimeout(1000); await page.keyboard.press('Escape');
    await page.evaluate(xml => adoptDoc(fromOpml(xml), { fileName: 'disposable.opml' }), opml);
    await page.locator('.node-content').filter({ hasText: 'Sandbox' }).first().click();
    await page.locator('#logo-btn').click(); await page.locator('#live-open').click(); await page.locator('#live-port').fill(port);
    await page.locator('#live-secret').fill(secret); await page.locator('#live-disposable').check();
    await page.locator('#live-scope-choice').selectOption('selected'); await page.locator('#live-connect').click();
    await page.waitForFunction(() => document.querySelector('#live-status').textContent === 'Connected');
    await page.evaluate(xml => adoptDoc(fromOpml(xml), { fileName: 'other-disposable.opml' }), opml);
    assert.equal(await page.locator('#live-status').textContent(), 'Disconnected: document changed');
    await page.locator('#logo-btn').click();
    for (const tier of ['guided', 'standard', 'lean']) {
      await page.evaluate(tier => { setVerbosity(tier); if (!document.querySelector('#file-menu').classList.contains('on')) document.querySelector('#logo-btn').click(); }, tier);
      const status = page.locator('#live-status');
      await status.scrollIntoViewIfNeeded();
      assert.equal(await status.isVisible(), true, tier);
      const metrics = await status.evaluate(el => {
        const range = document.createRange(); range.selectNodeContents(el);
        const box = el.getBoundingClientRect(), pane = document.querySelector('#fm-pane').getBoundingClientRect();
        return { width: el.clientWidth, scrollWidth: el.scrollWidth, height: el.clientHeight, scrollHeight: el.scrollHeight,
          overflow: getComputedStyle(el).overflow, whiteSpace: getComputedStyle(el).whiteSpace,
          lines: [...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })),
          box: { left: box.left, right: box.right, top: box.top, bottom: box.bottom }, pane: { left: pane.left, right: pane.right, top: pane.top, bottom: pane.bottom } };
      });
      assert.ok(metrics.lines.length >= 2, JSON.stringify({ tier, metrics }));
      assert.ok(metrics.scrollWidth <= metrics.width && metrics.scrollHeight <= metrics.height, JSON.stringify({ tier, metrics }));
      for (const line of metrics.lines) assert.ok(line.left >= metrics.box.left - 1 && line.right <= metrics.box.right + 1 && line.top >= metrics.pane.top - 1 && line.bottom <= metrics.pane.bottom + 1, JSON.stringify({ tier, metrics }));
    }
    assert.equal(await page.locator('#live-disconnect').isDisabled(), true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const start = output.length; child.stdin.write('append Wrong document\n');
    await until(() => output.slice(start).includes('Session revoked'));
    assert.equal(await page.evaluate(() => root.children[0].children.some(n => n.text === 'Wrong document')), false);
    await page.close();
  } finally { child.stdin.write('disconnect\n'); await until(() => child.exitCode !== null || child.signalCode !== null, 5000).catch(() => child.kill()); await browser.close(); }
});


test('ordinary app keeps its no-connect CSP', { timeout: 30000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  let hits = 0;
  const server = createServer((req, res) => { hits++; res.end('unexpected'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage(); await page.goto(defaultApp);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    assert.match(csp, /connect-src 'none'/);
    const failed = await page.evaluate(async port => { try { await fetch(`http://127.0.0.1:${port}/`); return false; } catch { return true; } }, server.address().port);
    assert.equal(failed, true); assert.equal(hits, 0);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});

test('timed-out CLI append revokes queued work before a later browser poll', { timeout: 30000 }, async () => {
  const child = spawn('script', ['-qfec', 'node tools/live-agent.mjs', '/dev/null'], { cwd: repo, stdio: 'pipe' });
  let output = ''; child.stdout.on('data', chunk => { output += chunk.toString(); });
  try {
    const port = await until(() => /Port: (\d+)/.exec(output)?.[1]);
    const secret = await until(() => /Browser secret \(paste once into Pointliner\): ([a-f0-9]{64})/.exec(output)?.[1]);
    const url = `http://127.0.0.1:${port}/bridge`;
    const poll = token => fetch(url, { method: 'POST', headers: { origin: 'null', authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ op: 'poll' }) });
    const paired = await (await poll(secret)).json();
    child.stdin.write('append Must not arrive late\n');
    await until(() => output.includes('Session revoked. An append may have applied; inspect'), 15000);
    assert.equal((await poll(paired.next)).status, 410);
  } finally { child.stdin.write('disconnect\n'); await until(() => child.exitCode !== null || child.signalCode !== null, 5000).catch(() => child.kill()); }
});

test('lost append response warns even when the browser already applied it', { timeout: 30000 }, async () => {
  const child = spawn('script', ['-qfec', 'node tools/live-agent.mjs', '/dev/null'], { cwd: repo, stdio: 'pipe' });
  let output = ''; child.stdout.on('data', chunk => { output += chunk.toString(); });
  try {
    const port = await until(() => /Port: (\d+)/.exec(output)?.[1]);
    let secret = await until(() => /Browser secret \(paste once into Pointliner\): ([a-f0-9]{64})/.exec(output)?.[1]);
    const url = `http://127.0.0.1:${port}/bridge`;
    async function browserRequest(body) {
      const response = await fetch(url, { method: 'POST', headers: { origin: 'null', authorization: 'Bearer ' + secret, 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json(); secret = result.next; return result;
    }
    await browserRequest({ op: 'poll' });
    child.stdin.write('append Applied before response loss\n');
    let command;
    for (let i = 0; i < 100 && !command; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      command = (await browserRequest({ op: 'poll' })).command;
    }
    assert.equal(command?.text, 'Applied before response loss');
    // Emulate a browser that mutated its model but lost the response to the agent.
    const syntheticPoints = [command.text];
    await browserRequest({ op: 'disconnect' });
    await until(() => output.includes('An append may have applied; inspect'));
    assert.deepEqual(syntheticPoints, ['Applied before response loss']);
  } finally { child.stdin.write('disconnect\n'); await until(() => child.exitCode !== null || child.signalCode !== null, 5000).catch(() => child.kill()); }
});

test('experimental app CSP permits only its assigned helper port', { timeout: 30000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  const { buildLiveBridgeApp } = await import('../tools/live-bridge-build.mjs');
  let allowedHits = 0, otherHits = 0;
  const allowed = createServer((req, res) => { allowedHits++; res.setHeader('Access-Control-Allow-Origin', 'null'); res.end('ok'); });
  const other = createServer((req, res) => { otherHits++; res.setHeader('Access-Control-Allow-Origin', 'null'); res.end('unexpected'); });
  await Promise.all([new Promise(resolve => allowed.listen(0, '127.0.0.1', resolve)), new Promise(resolve => other.listen(0, '127.0.0.1', resolve))]);
  const app = buildLiveBridgeApp(allowed.address().port);
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage(); await page.goto('file://' + app.path);
    const outcomes = await page.evaluate(async ports => {
      async function get(port) { try { return await (await fetch(`http://127.0.0.1:${port}/`)).text(); } catch { return null; } }
      return [await get(ports[0]), await get(ports[1])];
    }, [allowed.address().port, other.address().port]);
    assert.deepEqual(outcomes, ['ok', null]); assert.equal(allowedHits, 1); assert.equal(otherHits, 0);
  } finally {
    await browser.close(); app.cleanup();
    await Promise.all([new Promise(resolve => allowed.close(resolve)), new Promise(resolve => other.close(resolve))]);
  }
});


test('CLI disconnect and quit exit cleanly without resuming a closed readline', { timeout: 20000 }, async () => {
  for (const verb of ['disconnect', 'quit']) {
    const child = spawn('script', ['-qfec', 'node tools/live-agent.mjs --pairing-file', '/dev/null'], { cwd: repo, stdio: 'pipe' });
    let output = ''; child.stdout.on('data', chunk => { output += chunk.toString(); });
    const pairingPath = await until(() => /Private pairing file: ([^\r\n]+)/.exec(output)?.[1]);
    await until(() => output.includes('agent>'));
    child.stdin.write(verb + '\n');
    await until(() => child.exitCode !== null || child.signalCode !== null, 5000);
    assert.equal(child.exitCode, 0);
    assert.equal(child.signalCode, null);
    assert.doesNotMatch(output, /ERR_USE_AFTER_CLOSE/);
    assert.equal(existsSync(pairingPath), false);
  }
});

test('browser distinguishes CLI disconnect from an unexpected connection failure', { timeout: 30000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  for (const mode of ['disconnect', 'failure']) {
    const child = spawn('script', ['-qfec', 'node tools/live-agent.mjs --pairing-file', '/dev/null'], { cwd: repo, stdio: 'pipe' });
    let output = ''; child.stdout.on('data', chunk => { output += chunk.toString(); });
    const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
    try {
      const port = await until(() => /Port: (\d+)/.exec(output)?.[1]);
      const app = 'file://' + await until(() => /Experimental app: ([^\r\n]+)/.exec(output)?.[1]);
      const path = await until(() => /Private pairing file: ([^\r\n]+)/.exec(output)?.[1]);
      const page = await browser.newPage();
      await page.goto(app); await page.waitForSelector('#outline'); await page.waitForTimeout(1000); await page.keyboard.press('Escape');
      await page.evaluate(xml => adoptDoc(fromOpml(xml), { fileName: 'disposable.opml' }), opml);
      await page.locator('.node-content').filter({ hasText: 'Sandbox' }).first().click();
      await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
      await page.locator('#live-port').fill(port); await page.locator('#live-secret').fill(readFileSync(path, 'utf8').trim());
      await page.locator('#live-disposable').check(); await page.locator('#live-scope-choice').selectOption('selected'); await page.locator('#live-connect').click();
      await page.waitForFunction(() => document.querySelector('#live-status').textContent === 'Connected');
      if (mode === 'disconnect') child.stdin.write('disconnect\n');
      else await page.route('**/bridge', route => route.abort());
      const expected = mode === 'disconnect' ? 'Disconnected by agent' : 'Connection lost or expired';
      await page.waitForFunction(value => document.querySelector('#live-status').textContent === value, expected, { timeout: 5000 });
      assert.equal(await page.locator('#live-disconnect').isDisabled(), true);
      if (mode === 'disconnect') {
        await until(() => child.exitCode !== null || child.signalCode !== null, 5000);
        assert.equal(child.exitCode, 0);
      }
      await page.close();
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.stdin.write('disconnect\n');
      await until(() => child.exitCode !== null || child.signalCode !== null, 5000).catch(() => child.kill());
      await browser.close();
    }
  }
});

test('explicit whole-document scope works without selection and validation explains errors', { timeout: 30000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  const child = spawn('script', ['-qfec', 'node tools/live-agent.mjs --pairing-file --lifetime 600', '/dev/null'], { cwd: repo, stdio: 'pipe' });
  let output = ''; child.stdout.on('data', c => { output += c.toString(); });
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  try {
    const port = await until(() => /Port: (\d+)/.exec(output)?.[1]);
    const app = await until(() => /Experimental app: ([^\r\n]+)/.exec(output)?.[1]);
    const path = await until(() => /Private pairing file: ([^\r\n]+)/.exec(output)?.[1]);
    const page = await browser.newPage(); await page.goto('file://' + app); await page.waitForSelector('#outline'); await page.waitForTimeout(1000); await page.keyboard.press('Escape');
    await page.evaluate(xml => { adoptDoc(fromOpml(xml), { fileName: 'disposable.opml' }); selFocusId = null; }, opml);
    await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
    await page.locator('#live-connect').click(); assert.match(await page.locator('#live-error').textContent(), /Choose an access scope/);
    await page.locator('#live-scope-choice').selectOption('selected'); assert.equal(await page.locator('#live-error').textContent(), '');
    await page.locator('#live-connect').click(); assert.match(await page.locator('#live-error').textContent(), /Select a point/);
    await page.locator('#live-scope-choice').selectOption('document');
    await page.locator('#live-port').fill(port); await page.locator('#live-secret').fill(readFileSync(path, 'utf8').trim());
    await page.locator('#live-disposable').check(); await page.locator('#live-connect').click();
    await page.waitForFunction(() => document.querySelector('#live-status').textContent === 'Connected');
    let start = output.length; child.stdin.write('read\n'); await until(() => output.slice(start).includes('Outside'));
    start = output.length; child.stdin.write('append Top level\n'); await until(() => output.slice(start).includes('"appended":true'));
    assert.equal(await page.evaluate(() => root.children.some(n => n.text === 'Top level')), true);
    await page.close();
  } finally { child.stdin.write('disconnect\n'); await until(() => child.exitCode !== null || child.signalCode !== null, 5000).catch(() => child.kill()); await browser.close(); }
});

test('CLI accepts fixed port and rejects invalid lifetime and port', { timeout: 15000 }, async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port; await new Promise(resolve => server.close(resolve));
  const child = spawn('script', ['-qfec', `node tools/live-agent.mjs --pairing-file --port ${port} --lifetime 3600`, '/dev/null'], { cwd: repo, stdio: 'pipe' });
  let output = ''; child.stdout.on('data', c => { output += c.toString(); });
  try { await until(() => output.includes(`Port: ${port}`)); child.stdin.write('disconnect\n'); await until(() => child.exitCode !== null, 5000); assert.equal(child.exitCode, 0); }
  finally { if (child.exitCode === null) child.kill(); }
  for (const args of [['--port', '0'], ['--lifetime', '3601']]) {
    const bad = spawn(process.execPath, ['tools/live-agent.mjs', ...args], { cwd: repo });
    const code = await new Promise(resolve => bad.on('exit', resolve)); assert.equal(code, 1);
  }
});


test('bridge status and dialog remain usable in a short viewport across guidance levels', { timeout: 30000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 400 } });
    await page.goto(defaultApp); await page.waitForSelector('#outline'); await page.keyboard.press('Escape');
    for (const tier of ['guided', 'standard', 'lean']) {
      await page.locator('#logo-btn').click();
      await page.locator('#fm-verbosity-card [data-tier="' + tier + '"]').click();
      assert.equal(await page.locator('#live-status').isVisible(), true, tier);
      assert.equal(await page.locator('#live-status').textContent(), 'Disconnected');
      await page.locator('#live-open').click();
      await page.locator('#live-scope-choice').selectOption('document');
      await page.locator('#live-connect').scrollIntoViewIfNeeded();
      const box = await page.locator('#live-connect').boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 375 && box.y + box.height <= 400, JSON.stringify({ tier, box }));
      await page.locator('#live-connect').click();
      assert.notEqual(await page.locator('#live-error').textContent(), '');
      await page.locator('#live-cancel').click();
    }
  } finally { await browser.close(); }
});
