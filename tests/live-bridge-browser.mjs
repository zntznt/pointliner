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
    assert.ok((await send({op:'read'})).queued);
    const answer = await until(async () => (await send({op:'poll'})).answer);
    assert.deepEqual(answer.result.points.map(p => p.text), ['Sandbox', 'Initial']);
    assert.ok(!JSON.stringify(answer).includes('Outside'));
    // A command is applied only after the active editor and composition finish.
    await page.evaluate(() => document.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true})));
    assert.ok((await send({op:'append', text:'During composition'})).queued);
    assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Finish editing/);
    await page.evaluate(() => document.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true})));
    const editor = page.locator('.node-content').filter({hasText:'Initial'}).first();
    await editor.dblclick();
    await until(() => page.evaluate(() => activeContentId != null));
    await page.keyboard.press('End'); await page.keyboard.type(' draft');
    assert.ok((await send({op:'append', text:'During editing'})).queued);
    assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Finish editing/);
    assert.match(await editor.textContent(), /Initial draft/);
    for (let i=0; i<6; i++) await page.keyboard.press('Backspace');
    await page.keyboard.press('Escape');

    const checks = await page.evaluate(() => {
      const before = root.children[0].children.length;
      const test = text => liveBridgeResult(liveBridge, {op:'append', text});
      const bad = ['', ' ', '1. ordered', '[[link]]', '#tag', 'a'.repeat(501)].map(test);
      const ok = test('a'.repeat(500));
      const after = root.children[0].children.length;
      undo();
      return {bad, ok, before, after};
    });
    const valueCases = await page.evaluate(() => {
      const valid = ['follow-up', 'Status: ready', 'Cafe\u0301', 'well-being'];
      const unsafe = ['- item', '  - item', '1. item', '- [ ] task', '---', '[[link]]', '{roll: d6}', '# Heading', '*bold*', 'line\nbreak'];
      const good = valid.map(text => { const result = liveBridgeResult(liveBridge, {op:'append', text}); if (result.appended) undo(); return result; });
      return {good, bad:unsafe.map(text => ({text, result:liveBridgeResult(liveBridge, {op:'append', text})}))};
    });
    assert.ok(valueCases.good.every(result => result.appended));
    assert.deepEqual(valueCases.bad.filter(x => !x.result.error), []);
    assert.ok(checks.bad.every(x => x.error));
    assert.equal(checks.ok.appended, true);
    assert.equal(checks.after, checks.before + 1);
    // The projection cap reserves room for the prospective child.
    const limits = await page.evaluate(() => {
      const original = root.children[0].children;
      root.children[0].children = Array.from({length: 99}, (_, i) => mkNode('Item '+i));
      const result = liveBridgeResult(liveBridge, {op:'append', text:'Over limit'});
      root.children[0].children = original;
      return result;
    });
    assert.match(limits.error, /Scope is full/);
    const shapeLimits = await page.evaluate(() => {
      const n = id => ({id, text:'x', children:[]});
      const doc = n('doc'), scope = n('scope'); doc.children.push(scope);
      for (let i=0; i<997; i++) doc.children.push(n('other'+i));
      const fits = !!liveBridgeScope(doc, 'scope', 1); // 999 existing, one reserved
      doc.children.push(n('one-more'));
      const full = liveBridgeScope(doc, 'scope', 1);
      let deep = n('d0'), head = deep;
      for (let i=1; i<=64; i++) { const next = n('d'+i); deep.children.push(next); deep = next; }
      return {fits, full, depth:liveBridgeScope(head, 'd64', 1)};
    });
    assert.equal(shapeLimits.fits, true); assert.equal(shapeLimits.full, null); assert.equal(shapeLimits.depth, null);

    // A forged target field is never accepted as an alternate destination.
    const outside = await page.evaluate(() => root.children[1].id);
    const forged = await send({op:'append', text:'Outside scope', parentId:outside});
    assert.match(forged.error, /invalid/);


    const collision = await page.evaluate(() => {
      const original = uid, existing = root.children[0].id;
      const before = root.children[0].children.length;
      let count = 0;
      try {
        uid = () => ++count === 1 ? existing : 'bridge-unique';
        const success = liveBridgeResult(liveBridge, {op:'append', text:'Collision retry'});
        const allocated = root.children[0].children.at(-1).id;
        undo();
        uid = () => existing;
        const exhausted = liveBridgeResult(liveBridge, {op:'append', text:'Collision exhaustion'});
        return {success, allocated, exhausted, unchanged:root.children[0].children.length === before};
      } finally { uid = original; }
    });
    assert.equal(collision.success.appended, true); assert.equal(collision.allocated, 'bridge-unique');
    assert.match(collision.exhausted.error, /allocate/); assert.equal(collision.unchanged, true);
    const timestamps = await page.evaluate(() => {
      const parent = root.children[0], prior = parent.children[0];
      parent.props = [{key:'created',val:'2001-01-01'}, {key:'edited',val:'2002-01-01'}];
      prior.props = [{key:'created',val:'2003-01-01'}, {key:'edited',val:'2004-01-01'}];
      const values = () => JSON.stringify([root.children[0].props, root.children[0].children[0].props]);
      const before = values(), result = liveBridgeResult(liveBridge, {op:'append', text:'Timestamp test'});
      const after = values(), appended = JSON.parse(JSON.stringify(root.children[0].children.at(-1)));
      undo(); const undone = values(), absentAfterUndo = !root.children[0].children.some(n => n.id === appended.id);
      redo(); const redone = values(), restored = root.children[0].children.find(n => n.id === appended.id);
      const restoredPoint = restored && {id:restored.id, text:restored.text, props:restored.props};
      undo();
      return {result, before, after, undone, redone, appended:{id:appended.id, text:appended.text, props:appended.props}, absentAfterUndo, restoredPoint};
    });
    assert.equal(timestamps.result.appended, true);
    assert.equal(timestamps.after, timestamps.before); assert.equal(timestamps.undone, timestamps.before); assert.equal(timestamps.redone, timestamps.before);
    assert.equal(timestamps.absentAfterUndo, true);
    assert.deepEqual(timestamps.restoredPoint, timestamps.appended);
    assert.deepEqual(timestamps.appended.props.map(p => p.key.toLowerCase()).sort(), ['created', 'edited']);
    const selectedBefore = await page.evaluate(() => selFocusId);
    assert.ok((await send({op:'append', text:'Added safely'})).queued);
    assert.equal((await until(async () => (await send({op:'poll'})).answer)).result.appended, true);
    assert.equal(await page.locator('.node-content').filter({hasText:'Added safely'}).count(), 1);
    const added = await page.evaluate(() => { const n = root.children[0].children.at(-1); return {keys:n.props.map(p => p.key.toLowerCase()), parent:parentOf(n.id)?.id, scope:root.children[0].id, selection:selFocusId}; });
    assert.ok(added.keys.includes('created') && added.keys.includes('edited'));
    assert.equal(added.parent, added.scope); assert.equal(added.selection, selectedBefore);
    await page.keyboard.press('Control+z');
    assert.equal(await page.locator('.node-content').filter({hasText:'Added safely'}).count(), 0);
    assert.ok((await send({op:'append', text:'1. unsafe'})).queued);
    assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Unsupported/);
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
    assert.ok((await send({op:'append', text:'Not allowed'})).queued);
    assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Scope is unavailable/);
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
      if (mode === 'autosave replacement') {
        const top = await page.evaluate(() => {
          const before = root.children.length;
          const result = liveBridgeResult(liveBridge, {op:'append', text:'Top level'});
          const last = root.children.at(-1);
          const valid = last?.text === 'Top level' && parentOf(last.id) === root;
          undo();
          return {result, before, valid, undone:root.children.length === before};
        });
        assert.equal(top.result.appended, true); assert.equal(top.valid, true); assert.equal(top.undone, true);
      }
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

test('delivered append can apply after helper revocation; response is not confirmed', {timeout:30000, skip:!chromium && !process.env.POINTLINER_REQUIRE_BROWSER}, async () => {
  const bridge = createLiveBridge({origin:'null', lifetimeMs:20000});
  const session = await startLiveBridge(bridge, 0, false);
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH} : {});
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(session.app.path).href); await page.waitForSelector('#outline');
    await page.keyboard.press('Escape'); await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
    await page.locator('#live-scope-choice').selectOption('document');
    await page.locator('#live-port').fill(String(bridge.server.address().port));
    await page.locator('#live-secret').fill(session.browserSecret); await page.locator('#live-disposable').check();
    await page.locator('#live-connect').click();
    await until(async () => await page.locator('#live-status').textContent() === 'Connected');
    let release, arrived;
    const gate = new Promise(r => { release = r; });
    const delivered = new Promise(r => { arrived = r; });
    await page.route('http://127.0.0.1:*/bridge', async route => {
      const request = route.request();
      if (request.method() !== 'POST' || request.postDataJSON()?.op !== 'poll') return route.continue();
      const response = await route.fetch();
      const data = await response.json();
      if (data.command?.op === 'append') { arrived(); await gate; }
      await route.fulfill({response});
    });
    const response = await fetch(`http://127.0.0.1:${bridge.server.address().port}/bridge`, {
      method:'POST', headers:{authorization:'Bearer '+session.nativeSecret, 'content-type':'application/json'},
      body:JSON.stringify({op:'append', text:'Delivered before revocation'})
    });
    assert.ok((await response.json()).queued);
    await delivered;
    bridge.revoke(); release();
    await until(async () => await page.locator('.node-content').filter({hasText:'Delivered before revocation'}).count() === 1);
    await until(async () => await page.locator('#live-status').textContent() === 'Connection lost or expired');
    assert.equal((await fetch(`http://127.0.0.1:${bridge.server.address().port}/bridge`, {method:'POST', headers:{authorization:'Bearer '+session.nativeSecret, 'content-type':'application/json'}, body:'{"op":"poll"}'})).status, 410);
  } finally { await browser.close(); bridge.revoke(); bridge.server.closeAllConnections(); await new Promise(r => bridge.server.close(r)); session.app.cleanup(); }
});
