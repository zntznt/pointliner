// Experimental test fixture only. Importing this module never opens a listener.
import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';

export function createExperiment() {
  const model = ['synthetic initial point'];
  const issued = new Map();
  let allowedOrigin = null;
  const server = http.createServer((req, res) => {
    const deny = (status = 403) => { res.writeHead(status, { 'Cache-Control': 'no-store' }); res.end(); };
    const host = `127.0.0.1:${server.address().port}`;
    if (req.headers.host !== host || req.url !== '/synthetic') return deny();
    const origin = req.headers.origin;
    const browserOrigin = origin === 'null' || (allowedOrigin !== null && origin === allowedOrigin);
    if (origin && !browserOrigin) return deny();
    if (browserOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      if (!browserOrigin || req.headers['access-control-request-method'] !== 'POST' ||
          req.headers['access-control-request-headers']?.toLowerCase() !== 'content-type,x-capability') return deny();
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'content-type,x-capability', 'Cache-Control': 'no-store' });
      return res.end();
    }
    if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json') return deny();
    const token = req.headers['x-capability'];
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return deny();
    // Consume before parsing or executing: an invalid request cannot replay a capability.
    let grant;
    for (const [key, value] of issued) {
      if (timingSafeEqual(Buffer.from(token), Buffer.from(key))) { grant = value; issued.delete(key); break; }
    }
    if (!grant || (grant === 'browser' ? !browserOrigin : origin !== undefined)) return deny();
    let body = '', size = 0;
    req.on('data', chunk => { size += chunk.length; if (size <= 4096) body += chunk; });
    req.on('end', () => {
      if (size > 4096) return deny(413);
      let command;
      try { command = JSON.parse(body); } catch { return deny(400); }
      if (!command || typeof command !== 'object' || Array.isArray(command)) return deny(400);
      if (command.op === 'read' && Object.keys(command).length === 1) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({ points: model }));
      }
      if (command.op !== 'append' || Object.keys(command).sort().join(',') !== 'op,text' ||
          typeof command.text !== 'string' || command.text.length < 1 || command.text.length > 200 || model.length >= 100) return deny(400);
      model.push(command.text);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ points: model }));
    });
  });
  server.headersTimeout = 5000;
  server.requestTimeout = 5000;
  return {
    server,
    setHttpOrigin(origin) { allowedOrigin = origin; },
    issue(role) {
      if (!['browser', 'native'].includes(role)) throw new Error('invalid role');
      const token = randomBytes(32).toString('hex');
      issued.set(token, role);
      return token;
    },
  };
}
