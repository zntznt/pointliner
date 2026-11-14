import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import readline from 'node:readline';

const launch = (...args) => spawn(process.execPath, ['tools/live-agent.mjs', '--agent', '--lifetime', '10', ...args], { stdio:['pipe','pipe','pipe'] });
const exit = child => new Promise((resolve, reject) => { const timer = setTimeout(() => { child.kill('SIGKILL'); reject(Error('child did not exit')); }, 5000); child.once('exit', code => { clearTimeout(timer); resolve(code); }); });
const ready = child => new Promise((resolve, reject) => { const rl = readline.createInterface({ input:child.stdout }); rl.once('line', line => { rl.close(); try { resolve(JSON.parse(line)); } catch (e) { reject(e); } }); child.once('error', reject); });
async function released(port) { const server = net.createServer(); await new Promise((resolve, reject) => server.once('error', reject).listen(port, '127.0.0.1', resolve)); await new Promise(resolve => server.close(resolve)); }

test('pipe mode starts without secret disclosure and cleans up on SIGTERM under unread output', async () => {
  const c = launch(), msg = await ready(c); assert.equal(msg.type, 'ready'); assert.ok(existsSync(msg.pairing)); assert.ok(!JSON.stringify(msg).includes('secret'));
  c.stdout.pause(); c.stdin.on('error', () => {});
  for (let i = 0; i < 5000; i++) if (!c.stdin.write(JSON.stringify({ id:i, op:'read' }) + '\n')) break;
  const done = exit(c); c.kill('SIGTERM'); await done;
  assert.equal(existsSync(msg.app), false); assert.equal(existsSync(msg.pairing), false); await released(msg.port);
});

test('pipe mode rejects invalid UTF-8 and oversized unfinished frames and cleans up', async () => {
  for (const input of [Buffer.from([0xff, 10]), Buffer.alloc(8193, 65)]) {
    const c = launch(), msg = await ready(c), done = exit(c); c.stdin.write(input); assert.equal(await done, 1); assert.equal(existsSync(msg.app), false); await released(msg.port);
  }
});

test('split UTF-8 request is decoded and disconnect revokes', async () => {
  const c = launch(); const lines = readline.createInterface({ input:c.stdout }); const it = lines[Symbol.asyncIterator]();
  const msg = JSON.parse((await it.next()).value); const data = Buffer.from(JSON.stringify({ id:'é', op:'unknown' }) + '\n'); const cut = data.indexOf(0xc3) + 1;
  c.stdin.write(data.subarray(0, cut)); c.stdin.write(data.subarray(cut));
  assert.deepEqual(JSON.parse((await it.next()).value), { id:'é', error:'Invalid request' });
  const done = exit(c); c.stdin.write('{"id":2,"op":"disconnect"}\n');
  assert.equal(JSON.parse((await it.next()).value).id, 2); assert.equal(await done, 0); assert.equal(existsSync(msg.app), false);
});

test('queue overflow, closed output and expiry revoke and release resources', async () => {
  for (const action of ['overflow', 'epipe', 'expiry']) {
    const c = action === 'expiry' ? spawn(process.execPath, ['tools/live-agent.mjs','--agent','--lifetime','1'], {stdio:['pipe','pipe','pipe']}) : launch();
    const msg = await ready(c), done = exit(c); c.stdin.on('error', () => {});
    if (action === 'overflow') c.stdin.write(Array.from({length:30}, (_, id) => JSON.stringify({id, op:'read'}) + '\n').join(''));
    if (action === 'epipe') { c.stdout.destroy(); c.stdin.write('{"id":1,"op":"unknown"}\n'); }
    await done; assert.equal(existsSync(msg.pairing), false); assert.equal(existsSync(msg.app), false); await released(msg.port);
  }
});

test('occupied port and non-pipe descriptors fail closed', async () => {
  const server = net.createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const c = launch('--port', String(server.address().port)); const done = exit(c); assert.equal(await done, 1); await new Promise(resolve => server.close(resolve));
  const bad = spawn(process.execPath, ['tools/live-agent.mjs','--agent'], {stdio:['ignore','pipe','pipe']}); assert.equal(await exit(bad), 1);
});

test('signal during startup leaves no temporary app', async () => {
  const {mkdtempSync, readdirSync, rmSync} = await import('node:fs');
  const {tmpdir} = await import('node:os'); const {join} = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'pipe-start-test-'));
  try {
    for (const delay of [10, 40, 70]) {
      const c = spawn(process.execPath, ['tools/live-agent.mjs','--agent'], {stdio:['pipe','pipe','pipe'], env:{...process.env,TMPDIR:dir}});
      const done = exit(c); await new Promise(r => setTimeout(r,delay)); c.kill('SIGTERM'); await done;
      assert.deepEqual(readdirSync(dir), []);
    }
  } finally { rmSync(dir, {recursive:true,force:true}); }
});

test('unread output reaches backpressure deadline and revokes', {timeout:20000}, async () => {
  const c = launch('--lifetime','30'); const msg = await ready(c); c.stdout.pause();
  let diagnostic = ''; c.stderr.setEncoding('utf8'); c.stderr.on('data', x => { diagnostic += x; }); c.stdin.on('error', () => {});
  const done = exit(c); const payload = JSON.stringify({id:'x'.repeat(128),op:'invalid'}) + '\n';
  const sender = setInterval(() => c.stdin.write(payload), 1);
  try { assert.equal(await done, 1); } finally { clearInterval(sender); }
  assert.match(diagnostic, /Output backpressure timeout/);
  assert.equal(existsSync(msg.app), false); assert.equal(existsSync(msg.pairing), false); await released(msg.port);
});

test('idle expiry exits unsuccessfully and reports session end', async () => {
  const c = spawn(process.execPath, ['tools/live-agent.mjs','--agent','--lifetime','1'], {stdio:['pipe','pipe','pipe']});
  const lines = readline.createInterface({input:c.stdout}), it = lines[Symbol.asyncIterator]();
  const msg = JSON.parse((await it.next()).value); const done = exit(c);
  const warning = JSON.parse((await it.next()).value);
  assert.equal(warning.type, 'shutdown'); assert.match(warning.error, /Session ended/);
  assert.equal(await done, 1); assert.equal(existsSync(msg.app), false);
});

test('delivered append followed by EOF and expiry reports ambiguous write', {timeout:10000}, async () => {
  const {readFileSync} = await import('node:fs');
  const c = spawn(process.execPath, ['tools/live-agent.mjs','--agent','--lifetime','2'], {stdio:['pipe','pipe','pipe']});
  const lines = readline.createInterface({input:c.stdout}), it = lines[Symbol.asyncIterator]();
  const msg = JSON.parse((await it.next()).value); let secret = readFileSync(msg.pairing,'utf8').trim();
  const poll = async () => {
    const res = await fetch(`http://127.0.0.1:${msg.port}/bridge`, {method:'POST', headers:{origin:'null', authorization:'Bearer '+secret, 'content-type':'application/json'}, body:'{"op":"poll"}'});
    const body = await res.json(); secret = body.next; return body;
  };
  await poll(); const done = exit(c); c.stdin.end('{"id":42,"op":"append","text":"Possibly applied"}\n');
  let command;
  for (let n=0; n<60 && !command; n++) { await new Promise(r => setTimeout(r, 20)); command = (await poll()).command; }
  assert.equal(command.op, 'append'); // Browser receives the command but does not acknowledge it.
  const warning = JSON.parse((await it.next()).value);
  assert.equal(warning.id, 42); assert.match(warning.error, /write may have applied/i);
  assert.equal(await done, 1); assert.equal(existsSync(msg.app), false); await released(msg.port);
});

test('disconnect after delivered append reports uncertainty and fails', {timeout:10000}, async () => {
  const {readFileSync} = await import('node:fs');
  const c = launch(), lines = readline.createInterface({input:c.stdout}), it = lines[Symbol.asyncIterator]();
  const msg = JSON.parse((await it.next()).value); let secret = readFileSync(msg.pairing,'utf8').trim();
  const poll = async () => { const res = await fetch(`http://127.0.0.1:${msg.port}/bridge`, {method:'POST', headers:{origin:'null',authorization:'Bearer '+secret,'content-type':'application/json'}, body:'{"op":"poll"}'}); const body = await res.json(); secret = body.next; return body; };
  await poll(); const done = exit(c); c.stdin.write('{"id":42,"op":"append","text":"Maybe"}\n');
  let command; for (let n=0; n<60 && !command; n++) { await new Promise(r => setTimeout(r,20)); command = (await poll()).command; }
  assert.equal(command.op, 'append'); c.stdin.write('{"id":43,"op":"disconnect"}\n');
  const warning = JSON.parse((await it.next()).value); assert.equal(warning.id,42); assert.match(warning.error,/write may have applied/i);
  assert.equal(await done,1); assert.equal(existsSync(msg.app),false); await released(msg.port);
});

test('disconnect with closed output exits nonzero and cleans up', async () => {
  const c = launch(), msg = await ready(c), done = exit(c); c.stdout.destroy();
  c.stdin.on('error', () => {}); c.stdin.write('{"id":1,"op":"disconnect"}\n');
  assert.equal(await done,1); assert.equal(existsSync(msg.app),false); await released(msg.port);
});

test('disconnect rejects trailing frame in the same chunk', async () => {
  const c = launch(), lines = readline.createInterface({input:c.stdout}), it = lines[Symbol.asyncIterator]();
  const msg = JSON.parse((await it.next()).value), done = exit(c);
  c.stdin.write('{"id":1,"op":"disconnect"}\n{"id":2,"op":"read"}\n');
  const warning = JSON.parse((await it.next()).value); assert.match(warning.error, /following disconnect.*rejected/i);
  assert.equal(await done, 1); assert.equal(existsSync(msg.app), false); await released(msg.port);
});
