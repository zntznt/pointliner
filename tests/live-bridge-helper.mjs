import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createLiveBridge } from '../tools/live-bridge-helper.mjs';

test('one-use, role-bound capabilities relay bounded commands and revoke', async () => {
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 10000 });
  await new Promise(resolve => bridge.server.listen(0, '127.0.0.1', resolve));
  try {
    let browser = bridge.issueBrowser(), native = bridge.issueNative();
    assert.throws(() => bridge.issueBrowser());
    const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
    async function send(secret, body, origin) {
      const headers = { authorization: `Bearer ${secret}`, 'content-type': 'application/json' };
      if (origin !== undefined) headers.origin = origin;
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      return [r.status, await r.json()];
    }
    assert.equal((await send(browser, { op: 'poll' }))[0], 403);
    assert.equal((await send(native, { op: 'poll' }, 'null'))[0], 403);
    assert.equal((await send(native, { op: 'read' }, 'https://evil.example'))[0], 403);
    let r;
    [ , r] = await send(native, { op: 'append', text: 'before pairing' }); native = r.next;
    assert.equal(r.error, 'invalid or busy');
    [ , r] = await send(browser, { op: 'poll' }, 'null'); browser = r.next;
    const old = native;
    [ , r] = await send(native, { op: 'read' }); native = r.next;
    assert.equal((await send(old, { op: 'read' }))[0], 403);
    [ , r] = await send(browser, { op: 'poll' }, 'null'); browser = r.next;
    assert.deepEqual(r.command, { id: 1, op: 'read' });
    [ , r] = await send(browser, { op: 'respond', id: 1, result: { points: ['disposable'] } }, 'null'); browser = r.next;
    [ , r] = await send(native, { op: 'poll' }); native = r.next;
    assert.deepEqual(r.answer.result.points, ['disposable']);
    [ , r] = await send(native, { op: 'append', text: 'x'.repeat(501) }); native = r.next;
    assert.equal(r.error, 'invalid or busy');
    [ , r] = await send(native, { op: 'append', text: 'new point' }); native = r.next;
    assert.ok(r.queued);
    [ , r] = await send(browser, { op: 'poll' }, 'null'); browser = r.next;
    assert.equal(r.command.text, 'new point');
    [ , r] = await send(browser, { op: 'respond', id: r.command.id, result: { appended: true } }, 'null'); browser = r.next;
    [ , r] = await send(native, { op: 'poll' }); native = r.next;
    assert.equal(r.answer.result.appended, true);
    [ , r] = await send(native, { op: 'edit', pointId: 'x', expected: 'a', expectedProps: '[]', text: 'b' }); native = r.next;
    assert.equal(r.error, 'invalid or busy');
    [ , r] = await send(browser, { op: 'disconnect' }, 'null');
    assert.equal(r.disconnected, true);
    assert.equal((await send(native, { op: 'poll' }))[0], 410);
  } finally { bridge.server.closeAllConnections(); await new Promise(resolve => bridge.server.close(resolve)); }
});

test('expiration and invalid host fail closed', async () => {
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 1000 });
  await new Promise(resolve => bridge.server.listen(0, '127.0.0.1', resolve));
  try {
    const native = bridge.issueNative();
    const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
    const options = { method: 'POST', headers: { authorization: `Bearer ${native}`, 'content-type': 'application/json', host: 'evil.example' }, body: JSON.stringify({ op: 'poll' }) };
    const status = await new Promise((resolve, reject) => { const req = http.request(url, options, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(options.body); });
    assert.equal(status, 403);
    await new Promise(resolve => setTimeout(resolve, 1050));
    delete options.headers.host;
    assert.equal((await fetch(url, options)).status, 410);
  } finally { bridge.server.closeAllConnections(); await new Promise(resolve => bridge.server.close(resolve)); }
});

test('agent disconnect permits only one authenticated browser close notice, never queued work', async () => {
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 10000 });
  await new Promise(resolve => bridge.server.listen(0, '127.0.0.1', resolve));
  try {
    let browser = bridge.issueBrowser(), native = bridge.issueNative();
    const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
    async function send(secret, body, origin) {
      const headers = { authorization: `Bearer ${secret}`, 'content-type': 'application/json' };
      if (origin !== undefined) headers.origin = origin;
      const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      return [response.status, await response.json()];
    }
    let result;
    [, result] = await send(browser, { op: 'poll' }, 'null'); browser = result.next;
    [, result] = await send(native, { op: 'read' }); native = result.next;
    [, result] = await send(native, { op: 'disconnect' });
    assert.equal(result.closing, true);
    assert.equal((await send(native, { op: 'append', text: 'must be denied' }))[0], 403);
    assert.equal((await send('0'.repeat(64), { op: 'poll' }, 'null'))[0], 403);
    const [status, notice] = await send(browser, { op: 'poll' }, 'null');
    assert.equal(status, 200); assert.deepEqual(notice, { disconnected: true });
    await bridge.waitForBrowserDisconnect();
    assert.equal((await send(browser, { op: 'poll' }, 'null'))[0], 410);
    assert.equal((await send(native, { op: 'read' }))[0], 410);
  } finally { bridge.server.closeAllConnections(); await new Promise(resolve => bridge.server.close(resolve)); }
});

test('closing browser cannot execute commands or reuse its capability', async () => {
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 10000 });
  await new Promise(resolve => bridge.server.listen(0, '127.0.0.1', resolve));
  try {
    let browser = bridge.issueBrowser(), native = bridge.issueNative();
    const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
    const send = (secret, body, origin) => fetch(url, { method: 'POST', headers: { authorization: 'Bearer ' + secret, 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });
    browser = (await (await send(browser, { op: 'poll' }, 'null')).json()).next;
    const oldNative = native;
    const result = await (await send(native, { op: 'disconnect' })).json();
    assert.equal(result.closing, true);
    assert.equal((await send(oldNative, { op: 'read' })).status, 403);
    assert.equal((await send(browser, { op: 'respond', id: 1, result: {} }, 'null')).status, 410);
    assert.equal((await send(browser, { op: 'poll' }, 'null')).status, 410);
  } finally { bridge.server.closeAllConnections(); await new Promise(resolve => bridge.server.close(resolve)); }
});

test('close-only state expires even if the browser never polls', async () => {
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 10000 });
  await new Promise(resolve => bridge.server.listen(0, '127.0.0.1', resolve));
  try {
    let browser = bridge.issueBrowser(); const native = bridge.issueNative();
    const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
    const send = (secret, origin, body) => fetch(url, { method: 'POST', headers: { authorization: 'Bearer ' + secret, 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });
    browser = (await (await send(browser, 'null', { op: 'poll' })).json()).next;
    assert.equal((await (await send(native, null, { op: 'disconnect' })).json()).closing, true);
    await bridge.waitForBrowserDisconnect();
    assert.equal((await send(browser, 'null', { op: 'poll' })).status, 410);
  } finally { bridge.server.closeAllConnections(); await new Promise(resolve => bridge.server.close(resolve)); }
});

test('revoked session rejects polling; previously delivered command remains in the client', async () => {
  for (const delivered of [false, true]) {
    const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 10000 });
    await new Promise(resolve => bridge.server.listen(0, '127.0.0.1', resolve));
    try {
      let browser = bridge.issueBrowser(), native = bridge.issueNative();
      const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
      async function send(token, body, origin) {
        const response = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });
        return [response.status, await response.json()];
      }
      let result;
      [, result] = await send(browser, { op: 'poll' }, 'null'); browser = result.next;
      [, result] = await send(native, { op: 'append', text: 'Pending point' }); native = result.next;
      let command;
      if (delivered) { [, result] = await send(browser, { op: 'poll' }, 'null'); browser = result.next; command = result.command; }
      bridge.revoke();
      assert.equal((await send(browser, { op: 'poll' }, 'null'))[0], 410);
      // Delivery transfers a command to the browser; revocation cannot erase its local copy.
      assert.deepEqual(command, delivered ? { id: 1, op: 'append', text: 'Pending point' } : undefined);
    } finally { bridge.server.closeAllConnections(); await new Promise(resolve => bridge.server.close(resolve)); }
  }
});

test('browser lease expires despite native traffic, discards queued work and cannot be revived', async () => {
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs: 10000, leaseMs: 1000 });
  await new Promise(resolve => bridge.server.listen(0, '127.0.0.1', resolve));
  try {
    let browser = bridge.issueBrowser(), native = bridge.issueNative();
    const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
    const send = (secret, body, origin) => fetch(url, { method:'POST', headers:{authorization:'Bearer '+secret, 'content-type':'application/json', ...(origin ? {origin} : {})}, body:JSON.stringify(body) });
    browser = (await (await send(browser, {op:'poll'}, 'null')).json()).next;
    await new Promise(r => setTimeout(r, 550));
    browser = (await (await send(browser, {op:'poll'}, 'null')).json()).next;
    let reply = await (await send(native, {op:'read'})).json(); native = reply.next;
    assert.ok(reply.queued);
    await new Promise(r => setTimeout(r, 550));
    reply = await (await send(native, {op:'poll'})).json(); native = reply.next;
    assert.equal(reply.paired, true);
    assert.match(await bridge.closed, /heartbeat lost/);
    assert.equal((await send(native, {op:'poll'})).status, 410);
    assert.equal((await send(browser, {op:'poll'}, 'null')).status, 410);
  } finally { bridge.server.closeAllConnections(); await new Promise(r => bridge.server.close(r)); }
});
