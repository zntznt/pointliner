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
    const initial = answer.result.points[1];
    const edit = (extra = {}) => ({op:'edit', pointId:initial.id, expected:initial.text, expectedProps:initial.propsVersion, text:'Follow-up: Cafe\u0301', ...extra});
    assert.ok((await send(edit())).queued);
    assert.equal((await until(async () => (await send({op:'poll'})).answer)).result.edited, true);
    assert.ok((await send(edit())).queued);
    assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Stale/);
    const history = await page.evaluate(id => {
      const n = nodeById(id), changed = {text:n.text, props:structuredClone(n.props)};
      undo(); const undone = nodeById(id).text; redo();
      const redone = {text:nodeById(id).text, props:structuredClone(nodeById(id).props)};
      undo(); return {changed, undone, redone};
    }, initial.id);
    assert.equal(history.undone, initial.text);
    assert.deepEqual(history.changed, history.redone);
    assert.deepEqual(history.changed.props.map(p => p.key.toLowerCase()).sort(), ['created','edited']);
    const guarded = await page.evaluate(({id, token}) => {
      const n = nodeById(id), cmd = {op:'edit', pointId:id, expected:n.text, expectedProps:token, text:'Safe'};
      const check = command => {
        const before = JSON.stringify([root, undoStack, redoStack, dirty]);
        const result = liveBridgeResult(liveBridge, command);
        return {error:result.error, unchanged:before === JSON.stringify([root, undoStack, redoStack, dirty])};
      };
      n.note = 'private'; const note = check(cmd); n.note = '';
      const stale = check({...cmd, expectedProps:'bad-token'});
      const unsafe = check({...cmd, text:'1. ordered'});
      const outside = check({...cmd, pointId:root.children[1].id});
      return {note, stale, unsafe, outside};
    }, {id:initial.id, token:initial.propsVersion});
    assert.equal(guarded.note.error, 'Unsupported point');
    assert.match(guarded.stale.error, /Stale properties/);
    assert.match(guarded.unsafe.error, /unsupported/i);
    assert.match(guarded.outside.error, /outside scope/);
    assert.ok(Object.values(guarded).every(x => x.unchanged));

    // Exercise actual persisted metadata with a fresh, valid session token for every edit.
    const metadata = await page.evaluate(id => {
      const cases = {qbase:{expr:'PRIVATE',cols:[]}, varbase:{name:'PRIVATE'}, view:{kind:'cards'},
        colW:[null,120], colRole:[null,'PRIVATE'], colFmt:[null,{prefix:'PRIVATE'}], cards:true, noexport:true, baseRows:3};
      const results = {};
      for (const [field, value] of Object.entries(cases)) {
        const n = nodeById(id), copy = structuredClone(root);
        copy.children[0].children[0][field] = value;
        const loaded = fromOpml(toOpml(copy)).children[0].children[0];
        n[field] = loaded[field];
        const read = liveBridgeResult(liveBridge, {op:'read'});
        const point = read.points.find(p => p.id === id);
        const before = [root, undoStack, redoStack, dirty].map(x => JSON.stringify(x));
        const result = liveBridgeResult(liveBridge, {op:'edit', pointId:id, expected:point.text, expectedProps:point.propsVersion, text:'Safe'});
        results[field] = {loaded:loaded[field], token:point.propsVersion, read:JSON.stringify(read), result,
          unchanged:before.map((x, i) => x === JSON.stringify([root, undoStack, redoStack, dirty][i]))};
        delete n[field];
      }
      const n = nodeById(id); n.colW = [null]; n.colRole = []; n.colFmt = [null];
      const point = liveBridgeResult(liveBridge, {op:'read'}).points.find(p => p.id === id);
      const normal = liveBridgeResult(liveBridge, {op:'edit', pointId:id, expected:point.text, expectedProps:point.propsVersion, text:'Normal point'});
      if (normal.edited) undo();
      for (const field of ['colW','colRole','colFmt']) delete nodeById(id)[field];
      return {results, normal};
    }, initial.id);
    for (const [field, check] of Object.entries(metadata.results)) {
      assert.ok(check.loaded, `${field} survives OPML`);
      assert.match(check.token, /^[0-9a-f]{32}$/, field);
      assert.equal(check.result.error, 'Unsupported point', field);
      assert.deepEqual(check.unchanged, [true,true,true,true], field);
      assert.ok(!check.read.includes('PRIVATE'), field);
    }
    assert.equal(metadata.normal.edited, true);

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

test('real PTY agent reads and edits the live browser with undo and stale guards', {timeout:60000, skip:!chromium && !process.env.POINTLINER_REQUIRE_BROWSER}, async t => {
  const {spawn} = await import('node:child_process');
  const {readFileSync} = await import('node:fs');
  const child = spawn('script', ['-q', '-e', '-c', `${process.execPath} tools/live-agent.mjs --pairing-file --lifetime 60`, '/dev/null']);
  t.after(() => child.kill('SIGKILL'));
  let output = '';
  child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { output += b; });
  const pairing = await until(() => /Private pairing file: ([^\r\n]+)/.exec(output)?.[1]);
  const app = await until(() => /Experimental app: ([^\r\n]+)/.exec(output)?.[1]);
  const port = Number(/Port: (\d+)/.exec(output)[1]);
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH} : {});
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.addInitScript(() => { delete window.showOpenFilePicker; });
  await page.goto(pathToFileURL(app).href); await page.waitForSelector('#outline');
  await page.keyboard.press('Escape'); await page.locator('#logo-btn').click();
  const chooser = page.waitForEvent('filechooser'); await page.locator('#btn-open').click();
  await (await chooser).setFiles(resolve('tests/fixtures/live-bridge-disposable.opml'));
  await until(() => page.evaluate(() => fileName === 'live-bridge-disposable.opml'));
  await page.locator('.node-content').filter({hasText:'Sandbox'}).first().click();
  await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
  await page.locator('#live-scope-choice').selectOption('selected');
  await page.locator('#live-port').fill(String(port)); await page.locator('#live-secret').fill(readFileSync(pairing,'utf8').trim());
  await page.locator('#live-disposable').check(); await page.locator('#live-connect').click();
  await until(async () => await page.locator('#live-status').textContent() === 'Connected');
  async function command(line) {
    const start = output.length; child.stdin.write(line + '\n');
    const raw = await until(() => {
      const s = output.slice(start).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
      return s.includes('agent>') ? s : null;
    });
    const json = raw.split(/\r?\n/).find(s => s.startsWith('{') && s.endsWith('}'));
    if (!json && raw.includes('invalid or busy')) return {error:'invalid or busy'};
    assert.ok(json, raw); return JSON.parse(json);
  }
  const data = await command('read');
  const p = data.points.find(x => x.text === 'Initial'); assert.ok(p);
  const edit = {pointId:p.id, expected:p.text, propsVersion:p.propsVersion, text:'Follow-up: Cafe\u0301'};
  const sendEdit = async overrides => command('edit ' + JSON.stringify({...edit, ...overrides}));
  assert.match((await sendEdit({expected:'old'})).error, /Stale text/);
  assert.match((await sendEdit({propsVersion:'[]wrong'})).error, /Stale properties/);
  await page.evaluate(id => { nodeById(id).props = [{key:'created',val:'2000-01-01'}]; }, p.id);
  assert.match((await sendEdit({})).error, /Stale properties/);
  await page.evaluate(id => { nodeById(id).props = []; }, p.id);
  await page.evaluate(id => { nodeById(id).props = [{key:'edited',val:'a'},{key:'EDITED',val:'b'}]; }, p.id);
  assert.match((await sendEdit({})).error, /Unsupported/);
  await page.evaluate(id => { nodeById(id).props = []; }, p.id);
  assert.equal((await sendEdit({text:p.text})).edited, false);
  const outside = await page.evaluate(() => root.children[1].id);
  assert.match((await sendEdit({pointId:outside})).error, /outside scope/);
  assert.match((await sendEdit({pointId:'missing'})).error, /outside scope/);
  for (const text of ['1. ordered', '[[link]]', '{roll: d6}', '*bold*', '- item', 'line\nbreak', '']) {
    assert.ok((await sendEdit({text})).error, text);
  }
  assert.equal((await sendEdit({text:'x'.repeat(500)})).edited, true);
  await page.evaluate(() => undo());
  assert.ok((await sendEdit({text:'x'.repeat(501)})).error);
  const editor = page.locator('.node-content').filter({hasText:'Initial'}).first();
  await editor.dblclick(); await until(() => page.evaluate(() => activeContentId != null));
  await page.keyboard.press('End'); await page.keyboard.type(' draft');
  assert.match((await sendEdit({})).error, /Finish editing/);
  assert.match(await editor.textContent(), /Initial draft/);
  for (let i=0; i<6; i++) await page.keyboard.press('Backspace');
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true})));
  assert.match((await sendEdit({})).error, /Finish editing/);
  await page.evaluate(() => document.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true})));
  for (const field of ['note','dice','footnotes','markov','math','vars','grammar','est','seq','query','props','baseRows','checked']) {
    await page.evaluate(({id,field}) => {
      const n = nodeById(id); window.__bridgeBackup = structuredClone(n[field]);
      n[field] = field === 'note' ? 'private' : field === 'props' ? [{key:'category',val:'secret'}] : field === 'checked' ? true : [{}];
    }, {id:p.id,field});
    assert.match((await sendEdit({})).error, /Unsupported/);
    await page.evaluate(({id,field}) => { nodeById(id)[field] = window.__bridgeBackup; }, {id:p.id,field});
  }
  await page.evaluate(id => { window.__priorNode = nodeMap.get(id); nodeMap.set(id, {...window.__priorNode}); }, p.id);
  assert.match((await sendEdit({})).error, /Scope changed/);
  await page.evaluate(id => { nodeMap.set(id, window.__priorNode); }, p.id);
  await page.evaluate(id => { window.__priorId = root.children[1].id; root.children[1].id = id; }, p.id);
  assert.match((await sendEdit({})).error, /Scope/);
  await page.evaluate(() => { root.children[1].id = window.__priorId; });
  await page.evaluate(() => { root.children[1].id = ''; });
  assert.match((await sendEdit({})).error, /Scope/);
  await page.evaluate(() => { root.children[1].id = window.__priorId; });
  assert.equal((await sendEdit({})).edited, true);
  assert.equal(await page.locator('.node-content').filter({hasText:edit.text}).count(), 1);
  assert.match((await command('edit ' + JSON.stringify(edit))).error, /Stale/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  assert.equal(await page.locator('.node-content').filter({hasText:'Initial'}).count(), 1);
  await page.keyboard.press('Control+Shift+z');
  assert.equal(await page.locator('.node-content').filter({hasText:edit.text}).count(), 1);
  await page.evaluate(id => { nodeById(id).props = [{key:'created',val:'2001-01-01'}, {key:'edited',val:'2002-01-01'}]; }, p.id);
  const fresh = (await command('read')).points.find(x => x.id === p.id);
  assert.equal((await sendEdit({expected:fresh.text, propsVersion:fresh.propsVersion, text:'Final: reviewed'})).edited, true);
  const stamped = await page.evaluate(id => nodeById(id).props, p.id);
  assert.equal(stamped.find(x => x.key === 'created').val, '2001-01-01');
  assert.notEqual(stamped.find(x => x.key === 'edited').val, '2002-01-01');
  child.stdin.write('disconnect\n');
  await until(() => child.exitCode !== null);
  assert.equal(child.exitCode, 0);
});

test('read versions hide properties and oversized scopes fail without revocation', {timeout:60000, skip:!chromium && !process.env.POINTLINER_REQUIRE_BROWSER}, async t => {
  const bridge = createLiveBridge({origin:'null', lifetimeMs:60000});
  const session = await startLiveBridge(bridge, 0, false);
  t.after(() => { session.app.cleanup(); bridge.server.closeAllConnections(); bridge.server.close(); });
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH} : {});
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.goto(pathToFileURL(session.app.path).href); await page.waitForSelector('#outline');
  await page.keyboard.press('Escape');
  const oversized = await page.evaluate(() => {
    root.children = Array.from({length:99}, (_, i) => {
      const n = mkNode('x'); n.props = [{key:'created',val:'PRIVATE-SECRET-' + 'z'.repeat(1800)}]; return n;
    });
    nodeMap.clear(); parentMap.clear(); buildIndex(root);
    for (let len=1; len<=110; len++) {
      root.children.forEach(n => { n.text = 'x'.repeat(len); });
      const points = liveBridgeScope(root, root.id);
      if (points && !liveBridgeReadFits(points)) { window.__oversizedLength = len; return len; }
    }
    return 0;
  });
  assert.ok(oversized, 'fixture must exceed response envelope while within scope limits');
  await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
  await page.locator('#live-scope-choice').selectOption('document');
  await page.locator('#live-port').fill(String(bridge.server.address().port));
  await page.locator('#live-secret').fill(session.browserSecret);
  await page.locator('#live-disposable').check(); await page.locator('#live-connect').click();
  assert.match(await page.locator('#live-error').textContent(), /too large/i);
  assert.equal(await page.locator('#live-dialog').evaluate(el => el.open), true);
  await page.evaluate(() => root.children.forEach(n => { n.text = 'small'; }));
  await page.locator('#live-connect').click();
  await until(async () => await page.locator('#live-status').textContent() === 'Connected');
  let native = session.nativeSecret;
  async function send(body) {
    const response = await fetch(`http://127.0.0.1:${bridge.server.address().port}/bridge`, {method:'POST', headers:{authorization:'Bearer '+native,'content-type':'application/json'}, body:JSON.stringify(body)});
    const result = await response.json(); if (result.next) native = result.next; return result;
  }
  async function read() { assert.ok((await send({op:'read'})).queued); return (await until(async () => (await send({op:'poll'})).answer)).result; }
  // At the response boundary, writes must not make the next read fail.
  await page.evaluate(() => root.children.forEach(n => { n.text = 'x'.repeat(window.__oversizedLength - 1); }));
  const near = await read(); assert.equal(near.points.length, 100);
  const state = () => page.evaluate(() => JSON.stringify([root, undoStack, redoStack, dirty]));
  const beforeEdit = await state();
  assert.ok((await send({op:'edit', pointId:near.points[1].id, expected:near.points[1].text, expectedProps:near.points[1].propsVersion, text:'a'.repeat(500)})).queued);
  assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Scope is full/);
  assert.equal(await state(), beforeEdit);
  const recovered = await read(); assert.equal(recovered.points.length, 100);
  assert.ok((await send({op:'edit', pointId:recovered.points[1].id, expected:recovered.points[1].text, expectedProps:recovered.points[1].propsVersion, text:'short'})).queued);
  assert.equal((await until(async () => (await send({op:'poll'})).answer)).result.edited, true);
  await page.evaluate(() => undo());
  await page.evaluate(() => { root.children.pop(); nodeMap.clear(); parentMap.clear(); buildIndex(root); });
  const beforeAppend = await state();
  assert.ok((await send({op:'append', text:'a'.repeat(500)})).queued);
  assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Scope is full/);
  assert.equal(await state(), beforeAppend); assert.equal((await read()).points.length, 99);
  assert.ok((await send({op:'append', text:'ok'})).queued);
  assert.equal((await until(async () => (await send({op:'poll'})).answer)).result.appended, true);
  await page.evaluate(() => { undo(); const restored = mkNode('small'); restored.props = [{key:'created', val:'PRIVATE-SECRET-' + 'z'.repeat(1800)}]; root.children.push(restored); nodeMap.clear(); parentMap.clear(); buildIndex(root); root.children.forEach(n => { n.text = 'small'; }); });
  const first = await read();
  assert.equal(first.points.length, 100);
  assert.doesNotMatch(JSON.stringify(first), /PRIVATE-SECRET|zzzz/);
  assert.match(first.points[1].propsVersion, /^[a-f0-9]{32}$/);
  const firstVersion = first.points[1].propsVersion;
  const attempt = async request => {
    assert.ok((await send({op:'edit', expected:'small', text:'Changed', ...request})).queued);
    return (await until(async () => (await send({op:'poll'})).answer)).result;
  };
  assert.match((await attempt({pointId:first.points[2].id, expectedProps:firstVersion})).error, /Stale properties/);
  await page.evaluate(() => { root.children[0].props[0].val += 'changed'; });
  assert.match((await attempt({pointId:first.points[1].id, expectedProps:firstVersion})).error, /Stale properties/);
  await page.evaluate(() => { root.children[0].props[0].val = 'PRIVATE-SECRET-' + 'z'.repeat(1800); });
  const second = await read();
  assert.notEqual(second.points[1].propsVersion, firstVersion);
  const request = {op:'edit', pointId:first.points[1].id, expected:'small', expectedProps:firstVersion, text:'Changed'};
  assert.ok((await send(request)).queued);
  assert.match((await until(async () => (await send({op:'poll'})).answer)).result.error, /Stale properties/);
  await page.evaluate(() => root.children.forEach(n => { n.text = 'x'.repeat(window.__oversizedLength); }));
  assert.match((await read()).error, /Response too large/);
  assert.equal(await page.locator('#live-status').textContent(), 'Connected');
  await page.evaluate(() => root.children.forEach(n => { n.text = 'small'; }));
  assert.equal((await read()).points.length, 100);
  await page.evaluate(() => root.children.forEach(n => { n.props[0].val = 'PRIVATE-SECRET-' + 'z'.repeat(5000); }));
  const huge = await read();
  assert.equal(huge.points.length, 100);
  assert.ok(huge.points.slice(1).every(p => p.propsVersion === null));
  assert.doesNotMatch(JSON.stringify(huge), /PRIVATE-SECRET|zzzz/);
  const cleared = await page.evaluate(() => { const versions = liveBridge.versions; liveBridgeStop(); return versions.size; });
  assert.equal(cleared, 0);
});
