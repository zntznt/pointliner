import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
const launch = () => spawn(process.execPath, ['tools/live-agent.mjs','--agent','--lifetime','10'], {stdio:['pipe','pipe','pipe']});
const exit = child => new Promise((resolve, reject) => { const timer = setTimeout(() => { child.kill('SIGKILL'); reject(Error('child did not exit')); }, 5000); child.once('exit', code => { clearTimeout(timer); resolve(code); }); });

for (const eofOp of ['read','append','edit','disconnect','delayed']) test(`real paired ${eofOp} drains before stdin EOF`, {timeout:60000}, async t => {
  const { chromium } = await import('playwright');
  const { readFileSync } = await import('node:fs');
  const { pathToFileURL } = await import('node:url');
  const { resolve } = await import('node:path');
  const c = launch(), lines = readline.createInterface({input:c.stdout}), it = lines[Symbol.asyncIterator]();
  const msg = JSON.parse((await it.next()).value);
  t.after(() => { c.kill('SIGTERM'); });
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH} : {});
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.addInitScript(() => { delete window.showOpenFilePicker; });
  await page.goto(pathToFileURL(msg.app).href); await page.waitForSelector('#outline');
  await page.keyboard.press('Escape'); await page.locator('#logo-btn').click();
  const chooser = page.waitForEvent('filechooser'); await page.locator('#btn-open').click();
  await (await chooser).setFiles(resolve('tests/fixtures/live-bridge-disposable.opml'));
  await page.locator('.node-content').filter({hasText:'Sandbox'}).first().click();
  await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
  await page.locator('#live-scope-choice').selectOption('selected'); await page.locator('#live-port').fill(String(msg.port));
  await page.locator('#live-secret').fill(readFileSync(msg.pairing, 'utf8').trim());
  await page.locator('#live-disposable').check(); await page.locator('#live-connect').click();
  for (let n = 0; n < 100 && await page.locator('#live-status').textContent() !== 'Connected'; n++) await new Promise(r => setTimeout(r, 100));
  assert.equal(await page.locator('#live-status').textContent(), 'Connected');
  const request = async value => { c.stdin.write(JSON.stringify(value)+'\n'); const line = await it.next(); return JSON.parse(line.value); };
  const sendEOF = async value => { const done = exit(c); c.stdin.end(JSON.stringify(value)+'\n'); const result = JSON.parse((await it.next()).value); assert.equal(await done, 0); return result; };
  const read = await (eofOp === 'read' ? sendEOF({id:1,op:'read'}) : request({id:1,op:'read'}));
  assert.equal(read.id, 1); const initial = read.result.points.find(p => p.text === 'Initial'); assert.ok(initial);
  if (eofOp === 'read') { assert.equal(await page.locator('#live-status').textContent(), 'Disconnected by agent'); return; }
  if (eofOp === 'disconnect') {
    const done = exit(c); c.stdin.write('{"id":9,"op":"disconnect"}\n');
    assert.equal(JSON.parse((await it.next()).value).id, 9); assert.equal(await done, 0);
    assert.equal(await page.locator('#live-status').textContent(), 'Disconnected by agent'); return;
  }
  if (eofOp === 'delayed') {
    let release, delivered;
    const held = new Promise(resolve => { delivered = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/bridge', async route => {
      const body = route.request().postData() || '';
      if (body.includes('"op":"respond"')) { delivered(); await gate; }
      await route.continue();
    });
    c.stdin.write('{"id":2,"op":"append","text":"Delayed test"}\n');
    await held; const done = exit(c); c.stdin.write('{"id":9,"op":"disconnect"}\n');
    await new Promise(resolve => setTimeout(resolve, 100)); release();
    const warning = JSON.parse((await it.next()).value);
    assert.equal(warning.id, 2); assert.match(warning.error, /write may have applied/i);
    assert.equal(await done, 1);
    for (let n=0; n<50 && await page.locator('#live-status').textContent() !== 'Disconnected by agent'; n++) await new Promise(r => setTimeout(r, 50));
    assert.equal(await page.locator('#live-status').textContent(), 'Disconnected by agent');
    assert.equal(await page.locator('.node-content').filter({hasText:'Delayed test'}).count(), 1); return;
  }
  const append = {id:2,op:'append',text:'Pipe test'};
  assert.equal((await (eofOp === 'append' ? sendEOF(append) : request(append))).result.appended, true);
  if (eofOp === 'append') return;
  assert.equal((await sendEOF({id:3,op:'edit',pointId:initial.id,expected:initial.text,propsVersion:initial.propsVersion,text:'Edited via pipe'})).result.edited, true);
  assert.equal(await page.locator('.node-content').filter({hasText:'Edited via pipe'}).count(), 1);
});
