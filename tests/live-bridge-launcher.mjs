import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, statSync, rmSync, existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startLiveBridge } from '../tools/live-bridge-build.mjs';
import { createLiveBridge } from '../tools/live-bridge-helper.mjs';

const run = (...args) => spawnSync(process.execPath, ['tools/live-agent.mjs', ...args], { encoding: 'utf8' });
const html = "<meta content=\"connect-src 'none'; object-src\"><script>const LIVE_BRIDGE_PORT = 0;</script>";
async function fixture(t, source = html) {
  const dir = mkdtempSync(join(tmpdir(), 'bridge-launcher-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'tools'));
  for (const name of ['live-bridge-build.mjs', 'live-bridge-helper.mjs', 'live-agent.mjs']) copyFileSync(join('tools', name), join(dir, 'tools', name));
  writeFileSync(join(dir, 'index.html'), source);
  return { dir, build: (await import(pathToFileURL(join(dir, 'tools/live-bridge-build.mjs')))).buildLiveBridgeApp };
}

test('launcher validates input before opening a server', () => {
  for (const args of [['--port', '0'], ['--port', '1023'], ['--port', '65536'], ['--lifetime', '0'], ['--lifetime', '3601'], ['--port'], ['--unknown']]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid|Usage/);
  }
  assert.match(run().stderr, /interactive tool in a terminal/);
});

test('build validates isolated fixtures and writes private files', async t => {
  const { build } = await fixture(t);
  for (const port of [0, 1023, 65536, 1.5]) assert.throws(() => build(port), /Invalid helper port/);
  const app = build(12345);
  t.after(app.cleanup);
  assert.match(readFileSync(app.path, 'utf8'), /connect-src http:\/\/127\.0\.0\.1:12345; object-src/);
  assert.match(readFileSync(app.path, 'utf8'), /const LIVE_BRIDGE_PORT = 12345;/);
  assert.equal(statSync(app.path).mode & 0o777, 0o600);
  assert.equal(statSync(join(app.path, '..')).mode & 0o777, 0o700);
  assert.throws(() => app.writePairingSecret('bad'), /Invalid browser secret/);
  const pairing = app.writePairingSecret('a'.repeat(64));
  assert.equal(statSync(pairing).mode & 0o777, 0o600);
  assert.equal(readFileSync(pairing, 'utf8'), 'a'.repeat(64) + '\n');
  app.cleanup();
  assert.equal(existsSync(app.path), false);
});

test('missing or duplicate markers fail closed independently of checkout', async t => {
  for (const source of ['no markers', html + html]) {
    const { build } = await fixture(t, source);
    assert.throws(() => build(12345), /integration is not available/);
  }
});

test('startup revokes and removes temporary app on secret issuance or pairing write failure', async t => {
  const { build } = await fixture(t);
  for (const fail of ['issue', 'write']) {
    const bridge = createLiveBridge({ origin: 'null' });
    let path, revoked = false;
    const revoke = bridge.revoke;
    bridge.revoke = () => { revoked = true; revoke(); };
    const brokenBuild = port => {
      const app = build(port); path = app.path;
      if (fail === 'write') app.writePairingSecret = () => { throw Error('pairing write failed'); };
      return app;
    };
    if (fail === 'issue') bridge.issueNative = () => { throw Error('issue failed'); };
    await assert.rejects(startLiveBridge(bridge, 0, true, brokenBuild), /failed/);
    assert.equal(bridge.server.listening, false);
    assert.equal(revoked, true);
    assert.equal(existsSync(path), false);
  }
});

test('occupied port fails cleanly without starting another listener', async () => {
  const occupied = createServer();
  await new Promise(resolve => occupied.listen(0, '127.0.0.1', resolve));
  try {
    const bridge = createLiveBridge({ origin: 'null' });
    await assert.rejects(startLiveBridge(bridge, occupied.address().port, false), { code: 'EADDRINUSE' });
    assert.equal(bridge.server.listening, false);
  } finally { await new Promise(resolve => occupied.close(resolve)); }
});

test('interactive launcher reports missing integration and exits', async t => {
  const { dir } = await fixture(t, 'no markers');
  const result = spawnSync('script', ['-q', '-e', '-c', `${process.execPath} tools/live-agent.mjs`, '/dev/null'], { cwd: dir, encoding: 'utf8', timeout: 5000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /integration is not available/);
  assert.doesNotMatch(result.stdout, /Experimental app:|Browser secret/);
});


test('expiry closes the launcher and removes its app and pairing file without exposing secrets', async t => {
  const { dir } = await fixture(t);
  const child = spawn('script', ['-q', '-e', '-c', `${process.execPath} tools/live-agent.mjs --pairing-file --lifetime 1`, '/dev/null'], { cwd: dir });
  t.after(() => child.kill('SIGKILL'));
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const result = await Promise.race([
    new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', (code, signal) => resolve({ code, signal })); }),
    new Promise((_, reject) => setTimeout(() => reject(Error('launcher did not exit on expiry')), 5000))
  ]);
  assert.equal(result.code, 0, output);
  const app = /Experimental app: ([^\r\n]+)/.exec(output)?.[1];
  const pairing = /Private pairing file: ([^\r\n]+)/.exec(output)?.[1];
  const port = Number(/Port: (\d+)/.exec(output)?.[1]);
  assert.ok(app && pairing && port, output);
  assert.equal(existsSync(app), false);
  assert.equal(existsSync(pairing), false);
  assert.doesNotMatch(output, /[a-f0-9]{64}/);
  assert.match(output, /Bridge session ended/);
  const probe = createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(port, '127.0.0.1', resolve); });
  await new Promise(resolve => probe.close(resolve));
});
