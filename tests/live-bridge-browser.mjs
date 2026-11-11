import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createLiveBridge } from '../tools/live-bridge-helper.mjs';
import { startLiveBridge } from '../tools/live-bridge-build.mjs';
let chromium;
try { ({ chromium } = await import('playwright')); } catch {}
const until = async fn => { for (let i = 0; i < 100; i++) { const v = await fn(); if (v) return v; await new Promise(r => setTimeout(r, 100)); } throw Error('Timed out'); };
test('experimental app pairs and reads only the selected subtree; standalone stays offline', { timeout: 60000, skip: !chromium && !process.env.POINTLINER_REQUIRE_BROWSER }, async () => {
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 30000 });
  const session = await startLiveBridge(bridge, 0, false);
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => { delete window.showOpenFilePicker; });
    await page.goto(pathToFileURL(resolve('index.html')).href);
    await page.waitForSelector('#outline');
    assert.match(await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'), /connect-src 'none'/);
    await page.keyboard.press('Escape');
    await page.locator('#logo-btn').click();
    assert.equal(await page.locator('#live-open').isVisible(), false);
    await page.goto(pathToFileURL(session.app.path).href);
    await page.waitForSelector('#outline');
    await page.keyboard.press('Escape');
    await page.locator('#logo-btn').click();
    const chooser = page.waitForEvent('filechooser');
    await page.locator('#btn-open').click();
    await (await chooser).setFiles(resolve('tests/fixtures/live-bridge-disposable.opml'));
    await until(() => page.evaluate(() => fileName === 'live-bridge-disposable.opml'));
    await page.locator('.node-content').filter({hasText:'Sandbox'}).first().click();
    await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
    await page.locator('#live-scope-choice').selectOption('selected');
    await page.locator('#live-port').fill(String(bridge.server.address().port));
    await page.locator('#live-secret').fill(session.browserSecret);
    await page.locator('#live-disposable').check(); await page.locator('#live-connect').click();
    await until(async () => await page.locator('#live-status').textContent() === 'Connected');
    assert.equal(await page.locator('#live-secret').inputValue(), '');
    let native = session.nativeSecret;
    async function send(body) {
      const response = await fetch(`http://127.0.0.1:${bridge.server.address().port}/bridge`, { method:'POST', headers:{authorization:'Bearer '+native,'content-type':'application/json'}, body:JSON.stringify(body) });
      const value = await response.json(); if (value.next) native = value.next; return { status: response.status, ...value };
    }
    assert.equal((await send({op:'append', text:'blocked'})).error, 'invalid or busy');
    assert.equal((await send({op:'read'})).queued, 1);
    const answer = await until(async () => (await send({op:'poll'})).answer);
    assert.deepEqual(answer.result.points.map(p => p.text), ['Sandbox', 'Initial']);
    assert.ok(!JSON.stringify(answer).includes('Outside'));
    // Snapshot undo/redo replaces root but must keep the same live document session.
    await page.evaluate(() => { pushUndo(); root.children[0].children[0].text = 'Changed'; markDirty(); render(); undo(); });
    assert.ok((await send({op:'read'})).queued);
    const afterUndo = await until(async () => (await send({op:'poll'})).answer);
    assert.deepEqual(afterUndo.result.points.map(p => p.text), ['Sandbox', 'Initial']);
    await page.evaluate(() => redo());
    assert.ok((await send({op:'read'})).queued);
    const afterRedo = await until(async () => (await send({op:'poll'})).answer);
    assert.deepEqual(afterRedo.result.points.map(p => p.text), ['Sandbox', 'Changed']);
    // Removing the selected subtree cannot widen access to the remaining document.
    await page.evaluate(() => { window.removedScope = root.children.shift(); });
    assert.ok((await send({op:'read'})).queued);
    const removed = await until(async () => (await send({op:'poll'})).answer);
    assert.match(removed.result.error, /Scope is unavailable/);
    assert.ok(!JSON.stringify(removed).includes('Outside'));
    // Exercise the actual Restore earlier version UI with the same docId and scope ID.
    await page.evaluate(() => {
      root.children.unshift(window.removedScope); const prior = JSON.parse(JSON.stringify(root));
      prior.children[0].text = 'Private earlier version';
      localStorage.setItem(AUTOSAVE_PREV_KEY, JSON.stringify({[root.docId]: {prev: JSON.stringify({root: prior}), at: Date.now()}}));
      markClean();
    });
    await page.locator('#logo-btn').click(); await page.locator('#btn-restore').click();
    await until(() => page.evaluate(() => root.children[0].text === 'Private earlier version'));
    await until(async () => (await send({op:'read'})).status === 410);
    assert.equal(await page.locator('#live-status').textContent(), 'Disconnected');
    assert.equal(await page.locator('.node-content').filter({hasText:'blocked'}).count(), 0);
  } finally { await browser.close(); bridge.revoke(); bridge.server.closeAllConnections(); await new Promise(r => bridge.server.close(r)); session.app.cleanup(); }
});
for (const mode of ['page close', 'failed transport', 'delayed poll', 'autosave replacement']) {
  test(`browser lease revokes after ${mode}`, {timeout:30000, skip:!chromium && !process.env.POINTLINER_REQUIRE_BROWSER}, async () => {
    const bridge = createLiveBridge({origin:'null', lifetimeMs:15000, leaseMs:mode === 'delayed poll' ? 3000 : 1000});
    const session = await startLiveBridge(bridge, 0, false);
    const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH} : {});
    try {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(session.app.path).href);
      await page.waitForSelector('#outline'); await page.keyboard.press('Escape');
      await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
      await page.locator('#live-scope-choice').selectOption('document');
      await page.locator('#live-port').fill(String(bridge.server.address().port));
      await page.locator('#live-secret').fill(session.browserSecret);
      await page.locator('#live-disposable').check(); await page.locator('#live-connect').click();
      await until(async () => await page.locator('#live-status').textContent() === 'Connected');
      let native = session.nativeSecret;
      if (mode === 'delayed poll') {
        let release, arrived;
        const waiting = new Promise(r => { arrived = r; }), gate = new Promise(r => { release = r; });
        await page.route('http://127.0.0.1:*/bridge', async route => {
          if (route.request().postDataJSON()?.op === 'poll') { arrived(); await gate; await route.continue(); }
          else await route.abort();
        });
        await waiting;
        await new Promise(r => setTimeout(r, 1200));
        await page.evaluate(() => { const replacement = mkNode('Secret replacement'); replacement.docId = root.docId; adoptDoc(replacement); });
        const queued = await fetch(`http://127.0.0.1:${bridge.server.address().port}/bridge`, {method:'POST', headers:{authorization:'Bearer '+native, 'content-type':'application/json'}, body:JSON.stringify({op:'read'})});
        const body = await queued.json(); assert.ok(body.queued); native = body.next;
        const delivered = page.waitForResponse(r => r.url().endsWith('/bridge') && r.request().postDataJSON()?.op === 'poll');
        release(); assert.equal((await delivered).status(), 200);
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`http://127.0.0.1:${bridge.server.address().port}/bridge`, {method:'POST', headers:{authorization:'Bearer '+native, 'content-type':'application/json'}, body:JSON.stringify({op:'poll'})});
        assert.equal(poll.status, 200);
        const pending = await poll.json(); assert.equal(pending.answer, null); native = pending.next;
        assert.equal(await page.locator('#live-status').textContent(), 'Disconnected');
      } else if (mode === 'autosave replacement') {
        await page.evaluate(() => { const replacement = JSON.parse(JSON.stringify(root)); replacement.text = 'Reconciled'; applyAutosaveData({root: replacement}); });
        await until(async () => !await page.evaluate(() => liveBridge));
      } else {
        await page.route('http://127.0.0.1:*/bridge', route => route.abort());
        if (mode === 'page close') await page.close();
        else await until(async () => await page.locator('#live-status').textContent() === 'Connection lost or expired');
      }
      assert.match(await bridge.closed, mode === 'autosave replacement' ? /Session ended/ : /heartbeat lost/);
      const response = await fetch(`http://127.0.0.1:${bridge.server.address().port}/bridge`, {method:'POST', headers:{authorization:'Bearer '+native, 'content-type':'application/json'}, body:JSON.stringify({op:'read'})});
      assert.equal(response.status, 410);
    } finally { await browser.close(); bridge.revoke(); bridge.server.closeAllConnections(); await new Promise(r => bridge.server.close(r)); session.app.cleanup(); }
  });
}
