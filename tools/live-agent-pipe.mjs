// Experimental NDJSON interface. A delivered write may apply after shutdown.
import { fstatSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import { createLiveBridge } from './live-bridge-helper.mjs';
import { startLiveBridge } from './live-bridge-build.mjs';

export async function runAgent({ port, lifetimeMs }) {
  // Check every descriptor before opening a listener or creating credentials.
  if (process.platform === 'win32' || ![0, 1, 2].every(fd => {
    try { const s = fstatSync(fd); return s.isFIFO() || s.isSocket(); } catch { return false; }
  })) return 1;
  const bridge = createLiveBridge({ origin: 'null', lifetimeMs });
  let session, stopped = false, resolveStop, activeAbort, active, canceled, rejection, warningFlush, disconnecting = false, disconnectTimer;
  const pendingWrites = new Set();
  const stoppedPromise = new Promise(resolve => { resolveStop = resolve; });
  const queue = [];
  let frame = Buffer.alloc(0), busy = false, outputBytes = 0, drainTimer, eof = false;
  const finishEOF = () => { if (!disconnecting && eof && !busy && !queue.length && outputBytes === 0) closeSession(); };
  const shutdown = (code = 0) => {
    if (stopped) return;
    stopped = true; queue.length = 0; process.stdin.pause();
    if (code !== 0 && session && process.stdout.writable && !process.stdout.destroyed) {
      const outstanding = active && ['append','edit'].includes(active.op) ? active : (pendingWrites.values().next().value || active || canceled);
      const warning = {type:'shutdown', error:outstanding && ['append','edit'].includes(outstanding.op)
        ? 'An already-delivered write may have applied; inspect the document before retrying.'
        : rejection || 'Session ended before all requests completed.'};
      if (outstanding) warning.id = outstanding.id;
      warningFlush = new Promise(resolve => { try { process.stdout.write(JSON.stringify(warning) + '\n', resolve); } catch { resolve(); } });
    }
    clearTimeout(drainTimer); clearTimeout(disconnectTimer); activeAbort?.abort(); bridge.revoke(); resolveStop(code);
  };
  const onSignal = () => shutdown(1);
  for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.once(sig, onSignal);
  process.stdout.on('error', onSignal); process.stderr.on('error', onSignal);
  bridge.closed.then(() => { if (session && !disconnecting) shutdown(1); });
  const send = (obj, flushed = () => {}) => {
    if (stopped) return;
    const data = JSON.stringify(obj) + '\n', size = Buffer.byteLength(data);
    if (size > 65536 || outputBytes + size > 131072) return shutdown(1);
    outputBytes += size;
    let writable;
    try { writable = process.stdout.write(data, error => { outputBytes -= size; if (error) return shutdown(1); flushed(); finishEOF(); }); }
    catch { return shutdown(1); }
    if (!writable && !drainTimer) {
      process.stdin.pause();
      drainTimer = setTimeout(() => { process.stderr.write('Output backpressure timeout; session revoked.\n'); shutdown(1); }, 2000);
      process.stdout.once('drain', () => { clearTimeout(drainTimer); drainTimer = null; if (!stopped) process.stdin.resume(); });
    }
  };
  const closeSession = (id, failed = false) => {
    canceled = active; disconnecting = true; process.stdin.pause();
    bridge.beginDisconnect(); activeAbort?.abort();
    void (async () => {
      await bridge.waitForBrowserDisconnect();
      if (failed) return shutdown(1);
      if (id === undefined) return shutdown();
      disconnectTimer = setTimeout(() => shutdown(1), 250);
      send({ id, result:'Session revoked' }, () => shutdown());
    })();
  };
  try {
    session = await startLiveBridge(bridge, port, true);
    if (!stopped) {
      let secret = session.nativeSecret;
      const url = `http://127.0.0.1:${bridge.server.address().port}/bridge`;
      const request = async body => {
        activeAbort = new AbortController();
        const response = await fetch(url, { method:'POST', headers:{ authorization:'Bearer ' + secret, 'content-type':'application/json' }, body:JSON.stringify(body), signal:AbortSignal.any([activeAbort.signal, AbortSignal.timeout(5000)]) });
        if (!response.ok) throw Error('Session unavailable');
        const result = await response.json(); secret = result.next; return result;
      };
      const run = async item => {
        const { id, op } = item;
        let body;
        if (op === 'read' && Object.keys(item).sort().join(',') === 'id,op') body = { op };
        else if (op === 'append' && Object.keys(item).sort().join(',') === 'id,op,text' && typeof item.text === 'string') body = { op, text:item.text };
        else if (op === 'edit' && Object.keys(item).sort().join(',') === 'expected,id,op,pointId,propsVersion,text') {
          const { pointId, expected, propsVersion: expectedProps, text } = item; body = { op, pointId, expected, expectedProps, text };
        } else return send({ id, error:'Invalid request' });
        active = {id, op};
        const write = active;
        if (op === 'append' || op === 'edit') pendingWrites.add(write);
        try {
          const first = await request(body);
          if (!first.queued) { pendingWrites.delete(write); return send({ id, error:first.error || 'Browser not paired or busy' }); }
          for (let n = 0; n < 40 && !stopped; n++) {
            await new Promise(resolve => setTimeout(resolve, 250));
            if (stopped) return;
            const result = await request({ op:'poll' });
            if (result.answer) return send({ id, result:result.answer.result }, () => { pendingWrites.delete(write); });
          }
          throw Error('Timed out');
        } catch { if (!disconnecting) shutdown(1); } finally { active = null; }
      };
      const drain = async () => {
        if (busy) return;
        busy = true;
        while (queue.length && !stopped) await run(queue.shift());
        busy = false; finishEOF();
      };
      const accept = (bytes, trailing) => {
        let item;
        try { item = JSON.parse(new TextDecoder('utf-8', { fatal:true }).decode(bytes)); } catch { return shutdown(1); }
        if (!item || typeof item !== 'object' || Array.isArray(item) || !['string','number'].includes(typeof item.id) || (typeof item.id === 'string' && item.id.length > 128) || (typeof item.id === 'number' && !Number.isSafeInteger(item.id))) return shutdown(1);
        if (item.op === 'disconnect' && Object.keys(item).sort().join(',') === 'id,op') {
          const failed = busy || queue.length || outputBytes || trailing;
          if (trailing) rejection = 'Bytes following disconnect were rejected.';
          closeSession(item.id, failed);
          return;
        }
        if (queue.length >= 16) return shutdown(1);
        queue.push(item); void drain();
      };
      process.stdin.on('data', chunk => {
        let start = 0;
        for (let i = 0; i < chunk.length && !stopped; i++) if (chunk[i] === 10) {
          const part = chunk.subarray(start, i);
          if (frame.length + part.length > 8192) return shutdown(1);
          accept(Buffer.concat([frame, part]), i + 1 < chunk.length); frame = Buffer.alloc(0); start = i + 1;
          if (disconnecting) return;
        }
        if (stopped) return;
        const part = chunk.subarray(start);
        if (frame.length + part.length > 8192) return shutdown(1);
        frame = Buffer.concat([frame, part]);
      });
      process.stdin.on('end', () => { if (frame.length) return shutdown(1); eof = true; finishEOF(); });
      process.stdin.on('error', onSignal);
      send({ type:'ready', app:session.app.path, pairing:session.pairingPath, port:bridge.server.address().port });
    }
  } catch { shutdown(1); }
  const code = await stoppedPromise;
  // Startup may have completed after a signal; cleanup owns any resulting resources.
  bridge.revoke();
  if (bridge.server.listening) {
    const closed = new Promise(resolve => bridge.server.close(resolve));
    bridge.server.closeAllConnections(); await closed;
  }
  try { session?.app.cleanup(); } catch { return 1; }
  if (warningFlush) await Promise.race([warningFlush, new Promise(resolve => setTimeout(resolve, 250))]);
  return code;
}
