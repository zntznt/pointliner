// Experimental localhost transport; callers explicitly start, issue and revoke a session.
import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const token = () => randomBytes(32).toString('hex');
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && /^[a-f0-9]{64}$/.test(a) &&
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
const keys = (x, s) => plain(x) && Object.keys(x).sort().join(',') === s;

export function createLiveBridge({ origin, lifetimeMs = 300000, leaseMs = 10000 } = {}) {
  if (typeof origin !== 'string' || (origin !== 'null' && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) throw Error('A local browser origin is required');
  if (!Number.isInteger(lifetimeMs) || lifetimeMs < 1000 || lifetimeMs > 3600000) throw Error('Invalid lifetime');
  if (!Number.isInteger(leaseMs) || leaseMs < 1000 || leaseMs > 60000) throw Error('Invalid browser lease');
  let expires = performance.now() + lifetimeMs, revoked = false, leaseUntil = 0, leaseTimer;
  let browser = token(), native = token(), pending = null, answer = null, sequence = 0, paired = false, closing = false;
  let notifyClosed, closingTimer;
  const closed = new Promise(resolve => { notifyClosed = resolve; });
  const revoke = (reason = 'Session ended') => { if (revoked) return; revoked = true; browser = native = null; pending = answer = null; clearTimeout(closingTimer); clearTimeout(leaseTimer); notifyClosed(reason); };
  const expired = () => performance.now() >= expires || (paired && performance.now() >= leaseUntil);
  function heartbeat() {
    leaseUntil = performance.now() + leaseMs;
    clearTimeout(leaseTimer);
    const check = () => {
      const left = leaseUntil - performance.now();
      if (left <= 0) return revoke('Browser heartbeat lost; session revoked');
      leaseTimer = setTimeout(check, left); leaseTimer.unref();
    };
    check();
  }
  const expire = () => revoke(paired && performance.now() >= leaseUntil ? 'Browser heartbeat lost; session revoked' : 'Session expired');
  const server = http.createServer((req, res) => {
    const finish = (status, value) => {
      res.writeHead(status, { 'Cache-Control': 'no-store', 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(value));
    };
    if (revoked || expired()) { expire(); return finish(410, { error: 'expired' }); }
    if (req.socket.remoteAddress !== '127.0.0.1' || req.headers.host !== `127.0.0.1:${server.address().port}` || req.url !== '/bridge') return finish(403, { error: 'denied' });
    const fromBrowser = req.headers.origin === origin;
    if (req.headers.origin !== undefined && !fromBrowser) return finish(403, { error: 'denied' });
    if (fromBrowser) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS') {
      if (!fromBrowser || req.headers['access-control-request-method'] !== 'POST' ||
          req.headers['access-control-request-headers']?.toLowerCase() !== 'authorization,content-type') return finish(403, { error: 'denied' });
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Cache-Control': 'no-store' }); return res.end();
    }
    if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json') return finish(403, { error: 'denied' });
    const presented = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
    const role = fromBrowser ? 'browser' : 'native';
    if (!same(presented, role === 'browser' ? browser : native)) return finish(403, { error: 'denied' });
    // Consume before receiving the body, so overlapping or replayed requests cannot succeed.
    const next = token();
    if (role === 'browser') browser = next; else native = next;
    let size = 0, chunks = [];
    req.on('data', chunk => { size += chunk.length; if (size <= 16384) chunks.push(chunk); });
    req.on('end', () => {
      if (revoked || expired()) { expire(); return finish(410, { error: 'expired' }); }
      if (size > 16384) { revoke(); return finish(413, { error: 'too large' }); }
      let command;
      try { command = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { revoke(); return finish(400, { error: 'invalid' }); }
      if (closing) {
        // Closing is a bounded, read-only notification state, not an active session.
        // The sole allowed request consumes the browser's current capability.
        if (role === 'browser' && keys(command, 'op') && command.op === 'poll') {
          res.once('finish', revoke);
          return finish(200, { disconnected: true });
        }
        revoke(); return finish(410, { error: 'closed' });
      }
      let result;
      if (role === 'native' && paired && keys(command, 'op') && command.op === 'read' && !pending && !answer) {
        pending = { id: ++sequence, op: 'read' }; result = { queued: pending.id };
      } else if (role === 'browser' && keys(command, 'op') && command.op === 'poll') {
        paired = true; heartbeat(); result = { command: pending };
      } else if (role === 'browser' && keys(command, 'id,op,result') && command.op === 'respond' && pending && command.id === pending.id && plain(command.result)) {
        answer = { id: pending.id, result: command.result }; pending = null; result = { accepted: true };
      } else if (role === 'native' && keys(command, 'op') && command.op === 'poll') {
        result = { answer, paired }; answer = null;
      } else if (keys(command, 'op') && command.op === 'disconnect') {
        if (role === 'native' && paired) {
          closing = true; native = null; pending = answer = null;
          closingTimer = setTimeout(revoke, 1500); closingTimer.unref();
          return finish(200, { disconnected: true, closing: true });
        }
        revoke(); return finish(200, { disconnected: true });
      } else { result = { error: 'invalid or busy' }; }
      finish(200, { ...result, next });
    });
    req.on('error', revoke);
  });
  server.headersTimeout = 5000; server.requestTimeout = 5000;
  const timer = setTimeout(revoke, lifetimeMs); timer.unref();
  server.on('close', () => { clearTimeout(timer); revoke(); });
  const issued = new Set();
  function issue(role) {
    if (issued.has(role) || revoked || expired()) throw Error('Session unavailable');
    issued.add(role); return role === 'browser' ? browser : native;
  }
  return { server, revoke, closed, issueBrowser: () => issue('browser'), issueNative: () => issue('native'),
    waitForBrowserDisconnect() {
      if (!closing || revoked) return Promise.resolve();
      return new Promise(resolve => {
        const timer = setTimeout(resolve, 1500);
        closed.then(() => { clearTimeout(timer); resolve(); });
      });
    } };
}
