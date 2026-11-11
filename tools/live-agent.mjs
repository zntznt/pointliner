#!/usr/bin/env node
// Interactive, disposable-document-only local agent. Secrets stay in memory;
// the browser secret is displayed on the controlling terminal, never stdout.
import { createInterface } from 'node:readline';
import { createWriteStream } from 'node:fs';
import { createLiveBridge } from './live-bridge-helper.mjs';
import { startLiveBridge } from './live-bridge-build.mjs';

const args = process.argv.slice(2);
let pairingFileMode = false, port = 0, lifetimeMs = 300000;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--pairing-file' && !pairingFileMode) pairingFileMode = true;
  else if (args[i] === '--port' || args[i] === '--lifetime') {
    const flag = args[i], value = args[++i];
    if (!/^[0-9]+$/.test(value || '')) { process.stderr.write(`Invalid ${flag}\n`); process.exit(1); }
    const n = Number(value);
    if (flag === '--port' && n >= 1024 && n <= 65535) port = n;
    else if (flag === '--lifetime' && n >= 1 && n <= 3600) lifetimeMs = n * 1000;
    else { process.stderr.write(`Invalid ${flag}\n`); process.exit(1); }
  } else { process.stderr.write('Usage: node tools/live-agent.mjs [--pairing-file] [--port 1024..65535] [--lifetime 1..3600 seconds]\n'); process.exit(1); }
}
if (!process.stdin.isTTY) {
  process.stderr.write('Run this interactive tool in a terminal.\n');
  process.exit(1);
}
const tty = createWriteStream('/dev/tty');
const bridge = createLiveBridge({ origin: 'null', lifetimeMs });
let session;
try {
  session = await startLiveBridge(bridge, port, pairingFileMode);
} catch (error) {
  tty.end();
  process.stderr.write(`Bridge startup failed: ${error.message}\n`);
  process.exit(1);
}
const { app, browserSecret, pairingPath } = session;
let nativeSecret = session.nativeSecret;
const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
// TTY output is intentionally not emitted to stdout or a log file. Terminal
// scrollback/recording may retain it; this tool is not a security boundary.
if (pairingFileMode) {
  process.stdout.write(`Disposable documents only. Port: ${bridge.server.address().port}\nPrivate pairing file: ${pairingPath}\n`);
} else {
  tty.write(`\nDisposable documents only. Port: ${bridge.server.address().port}\nBrowser secret (paste once into Pointliner): ${browserSecret}\n`);
}
process.stdout.write(`Experimental app: ${app.path}\nCommands: read, append TEXT, edit JSON, disconnect\n`);
async function request(body) {
  const response = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer ' + nativeSecret, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw Error('Session unavailable');
  const result = await response.json();
  nativeSecret = result.next;
  return result;
}
async function operation(body) {
  try {
    const queued = await request(body);
    if (!queued.queued) return queued.error || 'Pair the browser first or wait for the previous command.';
    for (let i = 0; i < 40; i++) {
      await new Promise(resolve => setTimeout(resolve, 250));
      const result = await request({ op: 'poll' });
      if (result.answer) return JSON.stringify(result.answer.result);
    }
    throw Error('Timed out');
  } catch (_) {
    // The browser may already have received the command: revocation prevents a
    // queued command from being delivered later, but cannot roll back an in-flight one.
    bridge.revoke();
    const outcome = body.op === 'append' || body.op === 'edit'
      ? `An ${body.op} may have applied; inspect the disposable document before retrying.`
      : 'The read did not return a result.';
    throw Error('Connection lost or timed out. Session revoked. ' + outcome);
  }
}
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true, prompt: 'agent> ' });
let busy = false;
rl.prompt();
rl.on('line', async line => {
  if (busy) return;
  busy = true; rl.pause();
  try {
    if (line === 'disconnect' || line === 'quit') {
      try { const result = await request({ op: 'disconnect' }); if (result.closing) await bridge.waitForBrowserDisconnect(); } catch {}
      rl.close(); return;
    }
    if (line === 'read') process.stdout.write((await operation({ op: 'read' })) + '\n');
    else if (line.startsWith('append ')) process.stdout.write((await operation({ op: 'append', text: line.slice(7) })) + '\n');
    else if (line.startsWith('edit ')) {
      let edit; try { edit = JSON.parse(line.slice(5)); } catch { throw Error('Invalid edit JSON'); }
      if (!edit || typeof edit !== 'object' || Array.isArray(edit)) throw Error('Use edit JSON with pointId, expected, propsVersion, and text');
      // Accept the old spelling for existing clients, but never ambiguous aliases.
      const keys = Object.keys(edit).sort().join(',');
      if (keys === 'expected,pointId,propsVersion,text') { edit.expectedProps = edit.propsVersion; delete edit.propsVersion; }
      else if (keys !== 'expected,expectedProps,pointId,text') throw Error('Use edit JSON with pointId, expected, propsVersion, and text');
      process.stdout.write((await operation({ op: 'edit', ...edit })) + '\n');
    }
    else process.stdout.write('Use read, append TEXT, edit JSON, or disconnect.\n');
  } catch (e) { process.stdout.write(e.message + '\n'); }
  finally { busy = false; if (!rl.closed) { rl.resume(); rl.prompt(); } }
});
bridge.closed.then(() => { if (!rl.closed) { process.stdout.write('Bridge session ended.\n'); rl.close(); } });
rl.on('close', () => { bridge.revoke(); bridge.server.closeAllConnections(); bridge.server.close(); app.cleanup(); tty.end(); });
process.once('SIGHUP', () => rl.close());
process.once('SIGTERM', () => rl.close());
