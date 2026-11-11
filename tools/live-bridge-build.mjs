// Produce only a private temporary copy of this checkout's app, for one helper port.
// No caller-supplied filesystem paths are accepted.
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildLiveBridgeApp(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid helper port');
  const source = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
  let html = readFileSync(source, 'utf8');
  const csp = "connect-src 'none'; object-src";
  const marker = 'const LIVE_BRIDGE_PORT = 0;';
  if (html.split(csp).length !== 2 || html.split(marker).length !== 2) throw Error('Live bridge app integration is not available in this checkout (missing or invalid build markers).');
  html = html.replace(csp, `connect-src http://127.0.0.1:${port}; object-src`)
    .replace(marker, `const LIVE_BRIDGE_PORT = ${port};`);
  const dir = mkdtempSync(join(tmpdir(), 'pointliner-live-'));
  try {
    const path = join(dir, 'index.html');
    writeFileSync(path, html, { mode: 0o600, flag: 'wx' });
    return { path, writePairingSecret(secret) {
      if (!/^[a-f0-9]{64}$/.test(secret)) throw Error('Invalid browser secret');
      const pairingPath = join(dir, 'pairing.txt');
      writeFileSync(pairingPath, secret + '\n', { mode: 0o600, flag: 'wx' });
      return pairingPath;
    }, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
  } catch (error) { rmSync(dir, { recursive: true, force: true }); throw error; }
}

// Startup owns every resource until it hands the ready session to the caller.
export async function startLiveBridge(bridge, port, pairingFileMode, build = buildLiveBridgeApp) {
  let app;
  try {
    await new Promise((resolve, reject) => {
      bridge.server.once('error', reject);
      bridge.server.listen(port, '127.0.0.1', () => {
        bridge.server.removeListener('error', reject);
        resolve();
      });
    });
    app = build(bridge.server.address().port);
    const browserSecret = bridge.issueBrowser();
    const nativeSecret = bridge.issueNative();
    const pairingPath = pairingFileMode ? app.writePairingSecret(browserSecret) : null;
    return { app, browserSecret, nativeSecret, pairingPath };
  } catch (error) {
    bridge.revoke();
    bridge.server.closeAllConnections();
    if (bridge.server.listening) await new Promise(resolve => bridge.server.close(resolve));
    if (app) app.cleanup();
    throw error;
  }
}
