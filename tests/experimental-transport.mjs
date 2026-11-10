// Explicit opt-in: node --test tests/experimental-transport.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { createExperiment } from '../tools/experimental-transport.mjs';

const fixture = fileURLToPath(new URL('./transport-fixture/page.html', import.meta.url));
const native = fileURLToPath(new URL('./transport-fixture/native.mjs', import.meta.url));
const listen = async server => { server.listen(0, '127.0.0.1'); await once(server, 'listening'); return `http://127.0.0.1:${server.address().port}`; };
const close = server => new Promise(resolve => server.close(resolve));

for (const mode of ['file', 'http']) test(`experimental ${mode} browser and independent native client`, async t => {
  const experiment = createExperiment();
  const base = await listen(experiment.server);
  t.after(() => close(experiment.server));
  let pageUrl = pathToFileURL(fixture).href;
  if (mode === 'http') {
    const site = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><title>Synthetic fixture</title>'); });
    const origin = await listen(site); t.after(() => close(site));
    experiment.setHttpOrigin(origin); pageUrl = origin + '/';
  }
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.goto(pageUrl);
  const browserCall = (token, command) => page.evaluate(async ({ base, token, command }) => {
    const response = await fetch(base + '/synthetic', { method: 'POST', headers: { 'content-type': 'application/json', 'x-capability': token }, body: JSON.stringify(command), redirect: 'error' });
    return { status: response.status, body: response.ok ? await response.json() : null };
  }, { base, token, command });
  const token = experiment.issue('browser');
  assert.deepEqual((await browserCall(token, { op: 'read' })).body.points, ['synthetic initial point']);
  assert.equal((await browserCall(token, { op: 'read' })).status, 403, 'replay rejected');
  assert.equal((await browserCall('0'.repeat(64), { op: 'read' })).status, 403);
  assert.equal((await browserCall(experiment.issue('native'), { op: 'read' })).status, 403, 'native grant is not browser grant');
  assert.equal((await browserCall(experiment.issue('browser'), { op: 'append', text: 'browser synthetic point' })).status, 200);
  const child = fork(native, [], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  t.after(() => { if (child.connected) child.kill(); });
  child.send({ url: base + '/synthetic', tokens: [experiment.issue('native'), experiment.issue('native')] });
  const [result] = await once(child, 'message');
  assert.equal(result.error, undefined);
  assert.deepEqual(result.before.body.points, ['synthetic initial point', 'browser synthetic point']);
  assert.deepEqual(result.after.body.points, ['synthetic initial point', 'browser synthetic point', 'native synthetic point']);
  assert.deepEqual((await browserCall(experiment.issue('browser'), { op: 'read' })).body.points, result.after.body.points);
  const request = (headers, path = '/synthetic', body = '{"op":"read"}') => new Promise((resolve, reject) => {
    const req = http.request(base + path, { method: 'POST', headers: { host: new URL(base).host, 'content-type': 'application/json', ...headers } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject); req.end(body);
  });
  assert.equal(await request({ host: 'evil.example', 'x-capability': experiment.issue('native') }), 403, 'DNS rebinding host');
  assert.equal(await request({ origin: 'https://evil.example', 'x-capability': experiment.issue('browser') }), 403);
  assert.equal(await request({ 'x-capability': experiment.issue('browser') }), 403, 'browser grant is not native grant');
  assert.equal(await request({ 'x-capability': experiment.issue('native') }, '/synthetic?secret=bad'), 403);
  assert.equal(await request({ 'x-capability': experiment.issue('native') }, '/synthetic', '{"op":"append","text":"x","path":"/tmp/file"}'), 400);
  const malformedToken = experiment.issue('native');
  assert.equal(await request({ 'x-capability': malformedToken }, '/synthetic', '{'), 400);
  assert.equal(await request({ 'x-capability': malformedToken }), 403, 'invalid requests also consume grants');
  const hostile = http.createServer((req, res) => res.end('<!doctype html>'));
  const hostileOrigin = await listen(hostile); t.after(() => close(hostile));
  const hostilePage = await browser.newPage();
  await hostilePage.goto(hostileOrigin);
  const blocked = await hostilePage.evaluate(async ({ base, token }) => {
    try { await fetch(base + '/synthetic', { method: 'POST', headers: { 'content-type': 'application/json', 'x-capability': token }, body: JSON.stringify({ op: 'read' }) }); return false; }
    catch { return true; }
  }, { base, token: experiment.issue('browser') });
  assert.equal(blocked, true, 'unapproved web origin blocked by browser preflight');
});
