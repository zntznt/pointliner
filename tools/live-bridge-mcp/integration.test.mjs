import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { existsSync, readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const path = new URL('./server.mjs', import.meta.url).pathname;
test('paired Chromium session reads, appends, and edits over MCP', {timeout:60000}, async t => {
  let chromium;
  try { ({chromium} = await import('playwright')); } catch { if (process.env.POINTLINER_REQUIRE_BROWSER) throw Error('Playwright required'); t.skip('Playwright unavailable'); return; }
  const {readFileSync} = await import('node:fs');
  const {pathToFileURL, fileURLToPath} = await import('node:url');
  const {resolve} = await import('node:path');
  const client = new Client({name:'browser-test',version:'1'});
  await client.connect(new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'}));
  let browser;
  try {
    const call = async (name, args = {}) => { const r = await client.callTool({name,arguments:args}); assert.notEqual(r.isError,true,JSON.stringify(r)); return JSON.parse(r.content[0].text); };
    const info = await call('session_info');
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH} : {});
    const page = await browser.newPage();
    await page.addInitScript(() => { delete window.showOpenFilePicker; });
    await page.goto(pathToFileURL(info.app).href); await page.waitForSelector('#outline'); await page.keyboard.press('Escape');
    await page.locator('#logo-btn').click(); const chooser = page.waitForEvent('filechooser'); await page.locator('#btn-open').click();
    await (await chooser).setFiles(fileURLToPath(new URL('../../tests/fixtures/live-bridge-disposable.opml', import.meta.url)));
    await page.locator('.node-content').filter({hasText:'Sandbox'}).first().click();
    await page.locator('#logo-btn').click(); await page.locator('#live-open').click();
    await page.locator('#live-scope-choice').selectOption('selected'); await page.locator('#live-port').fill(String(info.port));
    await page.locator('#live-secret').fill(readFileSync(info.pairing,'utf8').trim());
    await page.locator('#live-disposable').check(); await page.locator('#live-connect').click();
    for (let i=0;i<100 && await page.locator('#live-status').textContent() !== 'Connected';i++) await delay(100);
    assert.equal(await page.locator('#live-status').textContent(),'Connected');
    const first = await call('read'); assert.deepEqual(first.points.map(p=>p.text),['Sandbox','Initial']);
    await page.evaluate(id => { nodeById(id).props = [{key:'custom', val:'value'}]; }, first.points[1].id);
    const noneditable = await call('read'); assert.equal(noneditable.points[1].propsVersion, null);
    await page.evaluate(id => { nodeById(id).props = []; }, first.points[1].id);
    assert.equal((await call('append',{text:'MCP child'})).appended,true);
    const second = await call('read'); const point = second.points.find(p=>p.text==='Initial');
    assert.equal((await call('edit',{pointId:point.id,expected:point.text,propsVersion:point.propsVersion,text:'MCP edited'})).edited,true);
    await page.getByText('MCP edited',{exact:true}).first().waitFor();
    const stale = await client.callTool({name:'edit',arguments:{pointId:point.id,expected:point.text,propsVersion:point.propsVersion,text:'Stale'}});
    assert.equal(stale.isError,true);
    // Hold the browser's acknowledgement after the mutation: cancellation cannot undo it.
    let delivered; const arrived = new Promise(resolve => { delivered = resolve; });
    let release; const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/bridge', async route => {
      let body; try { body = route.request().postDataJSON(); } catch {}
      if (body?.op === 'respond' && body.result?.appended === true) { delivered(); await gate; await route.abort().catch(()=>{}); }
      else await route.continue().catch(()=>{});
    });
    const abort = new AbortController();
    const write = client.callTool({name:'append',arguments:{text:'Delivered once'}},{signal:abort.signal});
    await Promise.race([arrived, delay(10000).then(()=>{throw Error('browser did not receive write');})]);
    assert.equal(await page.getByText('Delivered once',{exact:true}).count(),1);
    abort.abort(); await assert.rejects(write); release();
    const after = await client.callTool({name:'read',arguments:{}});
    assert.equal(after.isError,true); assert.match(after.content[0].text,/may have applied/);
    await delay(500); assert.equal(await page.getByText('Delivered once',{exact:true}).count(),1);
    for (let i=0;i<50 && existsSync(info.app);i++) await delay(100);
    assert.equal(existsSync(info.app),false); assert.equal(existsSync(info.pairing),false);
  } finally { await browser?.close(); await client.close(); }
});

test('repeated real SDK cancellations release slots after queued handlers settle', {timeout:20000, skip:process.platform !== 'linux'}, async () => {
  const client = new Client({name:'repeat-cancel',version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'});
  await client.connect(transport);
  let pid;
  try {
    await client.callTool({name:'session_info',arguments:{}});
    pid = Number(readFileSync(`/proc/${transport.pid}/task/${transport.pid}/children`,'utf8').trim()); assert.ok(pid > 1, 'helper process missing');
    for (let round=0;round<5;round++) {
      process.kill(pid,'SIGSTOP');
      const active=client.callTool({name:'read',arguments:{}}); await delay(150);
      const aborts=Array.from({length:8},()=>new AbortController());
      const canceled=aborts.map(a=>client.callTool({name:'append',arguments:{text:'queued'}},{signal:a.signal}).then(()=>false,()=>true));
      await delay(150); aborts.forEach(a=>a.abort()); assert.ok((await Promise.all(canceled)).every(Boolean));
      process.kill(pid,'SIGCONT'); assert.equal((await active).isError,true); await delay(150);
    }
    const result=await client.callTool({name:'session_info',arguments:{}});
    assert.notEqual(result.isError,true);
  } finally { if (pid) try {process.kill(pid,'SIGCONT');} catch {} await client.close(); }
});

test('MCP accepts batched small frames and split boundary frame', {timeout:10000}, async () => {
  const {spawn}=await import('node:child_process'), readline=await import('node:readline');
  const proc=spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe']}); proc.stderr.resume();
  const lines=readline.createInterface({input:proc.stdout}), it=lines[Symbol.asyncIterator]();
  const send=x=>proc.stdin.write(JSON.stringify(x)+'\n'), read=async()=>JSON.parse((await it.next()).value);
  try {
    send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'frames',version:'1'}}}); await read();
    send({jsonrpc:'2.0',method:'notifications/initialized'});
    const notification=JSON.stringify({jsonrpc:'2.0',method:'notifications/progress',params:{progressToken:'none',progress:1,padding:'x'.repeat(700)}})+'\r\n';
    const batch=notification.repeat(32); assert.ok(Buffer.byteLength(batch)>22000); proc.stdin.write(batch);
    const ping = JSON.stringify({jsonrpc:'2.0',id:3,method:'ping',params:{padding:'x'.repeat(16200)}});
    const exact=ping.replace(/x+/, 'x'.repeat(16384-(Buffer.byteLength(ping)-16200))); assert.equal(Buffer.byteLength(exact),16384);
    proc.stdin.write(exact.slice(0,8000)); proc.stdin.write(exact.slice(8000)+'\n');
    const response=await Promise.race([read(),delay(5000).then(()=>{throw Error('valid frames rejected');})]); assert.equal(response.id,3);
  } finally { proc.stdin.end(); proc.kill('SIGTERM'); }
});
