import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { existsSync, readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const path = new URL('./server.mjs', import.meta.url).pathname;
test('real MCP stdio negotiation, tool schemas, errors, and cleanup', async () => {
  const client = new Client({name:'pointliner-test', version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'});
  await client.connect(transport);
  let app;
  try {
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(x => x.name).sort(), ['append','edit','read','session_info']);
    const info = await client.callTool({name:'session_info',arguments:{}});
    const session = JSON.parse(info.content[0].text);
    assert.equal(typeof session.port,'number'); assert.ok(existsSync(session.app)); assert.ok(existsSync(session.pairing));
    assert.deepEqual(Object.keys(session).sort(), ['app','pairing','port']);
    const secret = readFileSync(session.pairing,'utf8').trim();
    assert.ok(!JSON.stringify(info).includes(secret));
    app = session.app;
    const malformed = await client.callTool({name:'append',arguments:{text:42}});
    assert.equal(malformed.isError,true);
    const unpaired = await client.callTool({name:'read',arguments:{}});
    assert.equal(unpaired.isError,true);
    await assert.rejects(client.callTool({name:'unknown',arguments:{}}));
  } finally { await client.close(); }
  for (let i=0;i<50 && existsSync(app);i++) await delay(100);
  assert.equal(existsSync(app),false);
});

test('stalled helper deadline kills process, releases listener and removes private files', {timeout:20000, skip:process.platform !== 'linux'}, async () => {
  const {readFileSync} = await import('node:fs');
  const {createServer} = await import('node:net');
  const client = new Client({name:'stall-test',version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'});
  await client.connect(transport);
  const info = JSON.parse((await client.callTool({name:'session_info',arguments:{}})).content[0].text);
  const children = readFileSync(`/proc/${transport.pid}/task/${transport.pid}/children`, 'utf8').trim().split(/\s+/).map(Number);
  assert.equal(children.length,1); assert.ok(children[0] > 1, 'helper process missing'); process.kill(children[0], 'SIGSTOP');
  const response = await client.callTool({name:'append',arguments:{text:'maybe'}});
  assert.equal(response.isError,true); assert.match(response.content[0].text,/may have applied/);
  for (let i=0;i<50 && existsSync(info.app);i++) await delay(100);
  assert.equal(existsSync(info.app),false); assert.equal(existsSync(info.pairing),false);
  const listener = createServer(); await new Promise((ok,fail) => listener.once('error',fail).listen(info.port,'127.0.0.1',ok)); await new Promise(ok=>listener.close(ok));
  await client.close();
});

test('SIGTERM exits with MCP stdin still open and cleans up', {timeout:10000}, async () => {
  const client = new Client({name:'signal-test',version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'});
  await client.connect(transport);
  const info = JSON.parse((await client.callTool({name:'session_info',arguments:{}})).content[0].text);
  const pid = transport.pid; process.kill(pid,'SIGTERM');
  for (let i=0;i<50 && (existsSync(info.app) || (()=>{try {process.kill(pid,0);return true;} catch{return false;}})());i++) await delay(100);
  assert.equal(existsSync(info.app),false); assert.throws(()=>process.kill(pid,0));
  await client.close();
});

test('canceled request kills a stopped helper and cleans up', {timeout:10000, skip:process.platform !== 'linux'}, async () => {
  const {readFileSync} = await import('node:fs');
  const client = new Client({name:'cancel-test',version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'});
  await client.connect(transport);
  const info = JSON.parse((await client.callTool({name:'session_info',arguments:{}})).content[0].text);
  const pid = Number(readFileSync(`/proc/${transport.pid}/task/${transport.pid}/children`,'utf8').trim()); assert.ok(pid > 1, 'helper process missing');
  process.kill(pid,'SIGSTOP');
  const abort = new AbortController();
  const request = client.callTool({name:'append',arguments:{text:'possibly delivered'}}, {signal:abort.signal});
  await delay(1500); abort.abort(); await assert.rejects(request);
  for (let i=0;i<50 && existsSync(info.app);i++) await delay(100);
  assert.equal(existsSync(info.app),false); assert.equal(existsSync(info.pairing),false);
  await client.close();
});

test('bounded queue rejects overflow and queued cancellation does not kill active session', {timeout:20000, skip:process.platform !== 'linux'}, async () => {
  const {readFileSync} = await import('node:fs');
  const client = new Client({name:'queue-test',version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'});
  await client.connect(transport);
  try {
    const info = JSON.parse((await client.callTool({name:'session_info',arguments:{}})).content[0].text);
    const pid = Number(readFileSync(`/proc/${transport.pid}/task/${transport.pid}/children`,'utf8').trim()); assert.ok(pid > 1, 'helper process missing');
    process.kill(pid,'SIGSTOP');
    const active = client.callTool({name:'read',arguments:{}}); await delay(300);
    const abort = new AbortController();
    const queued = client.callTool({name:'append',arguments:{text:'never sent'}},{signal:abort.signal});
    const others = Array.from({length:15},()=>client.callTool({name:'read',arguments:{}}));
    await delay(300); abort.abort(); await assert.rejects(queued);
    const results = await Promise.all(others);
    assert.ok(results.some(r => r.isError && r.content[0].text.includes('queue is full')));
    assert.equal((await active).isError,true);
    for (let i=0;i<50 && existsSync(info.app);i++) await delay(100);
    assert.equal(existsSync(info.app),false);
  } finally { await client.close(); }
});

test('stdio EOF ends session and removes private files', {timeout:10000}, async () => {
  const client = new Client({name:'eof-test',version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path],stderr:'pipe'});
  await client.connect(transport);
  const info = JSON.parse((await client.callTool({name:'session_info',arguments:{}})).content[0].text);
  await client.close();
  for (let i=0;i<50 && existsSync(info.app);i++) await delay(100);
  assert.equal(existsSync(info.app),false); assert.equal(existsSync(info.pairing),false);
});

test('malformed and oversized helper output fail closed without deleting reported paths or leaking secret', {timeout:15000}, async () => {
  const fs = await import('node:fs'); const os = await import('node:os'); const p = await import('node:path');
  for (const payload of ['not-json\n', 'null\n', 'false\n', '42\n', '"text"\n', '[]\n', 'x'.repeat(131073)]) {
    const dir = fs.mkdtempSync(p.join(os.tmpdir(),'pointliner-fault-test-'));
    const pkg = p.join(dir,'tools','live-bridge-mcp'); fs.mkdirSync(pkg,{recursive:true});
    fs.copyFileSync(path,p.join(pkg,'server.mjs')); fs.copyFileSync(new URL('./framing.mjs',import.meta.url),p.join(pkg,'framing.mjs'));
    fs.symlinkSync(p.resolve('tools/live-bridge-mcp/node_modules'),p.join(pkg,'node_modules'));
    const sentinel = p.join(dir,'do-not-delete'); fs.writeFileSync(sentinel,'private-marker');
    const fake = `process.stdout.write(JSON.stringify({type:'ready',app:${JSON.stringify(sentinel)},pairing:${JSON.stringify(sentinel)},port:12345})+'\\n'); process.stdin.once('data',()=>process.stdout.write(${JSON.stringify(payload)})); setInterval(()=>{},1000);`;
    fs.writeFileSync(p.join(dir,'tools','live-agent.mjs'),fake);
    const client = new Client({name:'fault-test',version:'1'});
    const transport = new StdioClientTransport({command:process.execPath,args:[p.join(pkg,'server.mjs')],stderr:'pipe'});
    let stderr=''; transport.stderr.on('data',data=>{stderr+=data;});
    try {
      await client.connect(transport); const info = await client.callTool({name:'session_info',arguments:{}});
      assert.ok(!JSON.stringify(info).includes('private-marker'));
      const failure = await client.callTool({name:'read',arguments:{}}); assert.equal(failure.isError,true);
      assert.ok(!JSON.stringify(failure).includes('private-marker')); assert.ok(!stderr.includes('private-marker'));
    } finally { await client.close(); assert.equal(fs.readFileSync(sentinel,'utf8'),'private-marker'); fs.rmSync(dir,{recursive:true,force:true}); }
  }
});

test('30k unread MCP responses fail closed with bounded RSS and cleanup', {timeout:15000, skip:process.platform !== 'linux'}, async () => {
  const {spawn} = await import('node:child_process'); const readline = await import('node:readline');
  const fs = await import('node:fs');
  const proc = spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe']}); proc.stderr.resume();
  const lines = readline.createInterface({input:proc.stdout}); const iter = lines[Symbol.asyncIterator]();
  const send = value => proc.stdin.write(JSON.stringify(value)+'\n');
  const read = async () => JSON.parse((await iter.next()).value);
  try {
    send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'flood',version:'1'}}}); await read();
    send({jsonrpc:'2.0',method:'notifications/initialized'});
    send({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'session_info',arguments:{}}});
    const info = JSON.parse((await read()).result.content[0].text); lines.close(); proc.stdout.pause();
    proc.stdin.on('error',()=>{});
    const exited = new Promise(resolve=>proc.once('exit',resolve));
    const frames = Array.from({length:30000},(_,i)=>JSON.stringify({jsonrpc:'2.0',id:i+10,method:'tools/call',params:{name:'session_info',arguments:{}}})+'\n').join('');
    proc.stdin.write(frames);
    let peak = 0;
    for (let i=0;i<500 && proc.exitCode === null && proc.signalCode === null;i++) {
      try { const status=fs.readFileSync(`/proc/${proc.pid}/status`,'utf8'); peak=Math.max(peak,Number(/VmRSS:\s+(\d+)/.exec(status)?.[1]||0)); } catch {}
      await delay(10);
    }
    assert.ok(peak > 0 && peak < 160000, `peak RSS ${peak} KiB`);
    await Promise.race([exited,delay(5000).then(()=>{throw Error('adapter did not fail closed');})]);
    for (let i=0;i<50 && existsSync(info.app);i++) await delay(100);
    assert.equal(existsSync(info.app),false); assert.equal(existsSync(info.pairing),false);
  } finally { proc.kill('SIGKILL'); }
});

test('matched helper errors never disclose arbitrary secret text', {timeout:10000}, async () => {
  const fs=await import('node:fs'), os=await import('node:os'), p=await import('node:path');
  const dir=fs.mkdtempSync(p.join(os.tmpdir(),'pointliner-error-test-')), pkg=p.join(dir,'tools','live-bridge-mcp');
  fs.mkdirSync(pkg,{recursive:true}); fs.copyFileSync(path,p.join(pkg,'server.mjs')); fs.copyFileSync(new URL('./framing.mjs',import.meta.url),p.join(pkg,'framing.mjs')); fs.symlinkSync(p.resolve('tools/live-bridge-mcp/node_modules'),p.join(pkg,'node_modules'));
  fs.writeFileSync(p.join(dir,'tools','live-agent.mjs'), `process.stdout.write(JSON.stringify({type:'ready',app:'/tmp/app',pairing:'/tmp/file',port:12345})+'\\n'); process.stdin.on('data',b=>{const m=JSON.parse(b);process.stdout.write(JSON.stringify({id:m.id,error:'SECRET_MARKER'})+'\\n')});`);
  const client=new Client({name:'error-test',version:'1'}), transport=new StdioClientTransport({command:process.execPath,args:[p.join(pkg,'server.mjs')],stderr:'pipe'});
  try { await client.connect(transport); const r=await client.callTool({name:'read',arguments:{}}); assert.equal(r.isError,true); assert.ok(!JSON.stringify(r).includes('SECRET_MARKER')); }
  finally { await client.close(); fs.rmSync(dir,{recursive:true,force:true}); }
});

test('oversized MCP input flood fails closed with bounded memory', {timeout:15000, skip:process.platform !== 'linux'}, async () => {
  const {spawn}=await import('node:child_process'), readline=await import('node:readline'), fs=await import('node:fs');
  const proc=spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe']}); proc.stderr.resume(); proc.stdin.on('error',()=>{});
  const lines=readline.createInterface({input:proc.stdout}), it=lines[Symbol.asyncIterator]();
  const send=x=>proc.stdin.write(JSON.stringify(x)+'\n'), read=async()=>JSON.parse((await it.next()).value);
  try {
    send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'flood',version:'1'}}}); await read();
    send({jsonrpc:'2.0',method:'notifications/initialized'}); send({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'session_info',arguments:{}}});
    const info=JSON.parse((await read()).result.content[0].text); const exited=new Promise(resolve=>proc.once('exit',resolve));
    const frame=JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'append',arguments:{text:'x'.repeat(4*1024*1024)}}})+'\n';
    for(let i=0;i<8;i++) proc.stdin.write(frame); let peak=0;
    for(let i=0;i<500 && proc.exitCode===null && proc.signalCode===null;i++) { try { peak=Math.max(peak,Number(/VmRSS:\s+(\d+)/.exec(fs.readFileSync(`/proc/${proc.pid}/status`,'utf8'))?.[1]||0)); } catch {} await delay(10); }
    assert.ok(peak>0 && peak<160000,`peak RSS ${peak} KiB`); await Promise.race([exited,delay(5000).then(()=>{throw Error('did not fail closed');})]);
    for(let i=0;i<50 && existsSync(info.app);i++) await delay(100); assert.equal(existsSync(info.app),false); assert.equal(existsSync(info.pairing),false);
  } finally {proc.kill('SIGKILL');}
});

test('paced unread responses trigger output backpressure cleanup', {timeout:15000, skip:process.platform !== 'linux'}, async () => {
  const {spawn}=await import('node:child_process'), readline=await import('node:readline');
  const proc=spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe']}); proc.stderr.resume(); proc.stdin.on('error',()=>{});
  const lines=readline.createInterface({input:proc.stdout}), it=lines[Symbol.asyncIterator]();
  const send=x=>proc.stdin.write(JSON.stringify(x)+'\n'), read=async()=>JSON.parse((await it.next()).value);
  try {
    send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'paced',version:'1'}}}); await read();
    send({jsonrpc:'2.0',method:'notifications/initialized'}); send({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'session_info',arguments:{}}});
    const info=JSON.parse((await read()).result.content[0].text); lines.close(); proc.stdout.pause();
    const exited=new Promise(resolve=>proc.once('exit',resolve)); let sent=0;
    while(proc.exitCode===null && proc.signalCode===null && sent<2000) {
      for(let i=0;i<8;i++) send({jsonrpc:'2.0',id:++sent+10,method:'tools/call',params:{name:'session_info',arguments:{}}});
      await delay(10);
    }
    assert.ok(sent>32,'must exceed in-flight limit in paced batches');
    await Promise.race([exited,delay(5000).then(()=>{throw Error('output did not fail closed');})]);
    for(let i=0;i<50 && existsSync(info.app);i++) await delay(100); assert.equal(existsSync(info.app),false);
  } finally {proc.kill('SIGKILL');}
});

test('canceled invalid and unknown tool requests settle without leaking slots', {timeout:10000}, async () => {
  const {spawn}=await import('node:child_process'), readline=await import('node:readline');
  const proc=spawn(process.execPath,[path],{stdio:['pipe','pipe','pipe']}); proc.stderr.resume();
  const lines=readline.createInterface({input:proc.stdout}), it=lines[Symbol.asyncIterator]();
  const send=x=>proc.stdin.write(JSON.stringify(x)+'\n'), read=async()=>JSON.parse((await it.next()).value);
  try {
    send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'invalid',version:'1'}}}); await read();
    send({jsonrpc:'2.0',method:'notifications/initialized'});
    for(let i=0;i<40;i++) {
      const id=100+i;
      const request={jsonrpc:'2.0',id,method:'tools/call',params:{name:i%2?'unknown':'append',arguments:{text:42}}};
      const cancel={jsonrpc:'2.0',method:'notifications/cancelled',params:{requestId:id}};
      proc.stdin.write(JSON.stringify(request)+'\n'+JSON.stringify(cancel)+'\n');
      send({jsonrpc:'2.0',id:1000+i,method:'ping'});
      let reply; do {reply=await Promise.race([read(),delay(3000).then(()=>{throw Error('server closed');})]);} while(reply.id!==1000+i);
      send({jsonrpc:'2.0',id,method:'tools/call',params:{name:'session_info',arguments:{}}});
      do {reply=await Promise.race([read(),delay(3000).then(()=>{throw Error('reused ID did not settle');})]);} while(reply.id!==id);
      assert.ok(reply.result?.content);
    }
  } finally {proc.stdin.end(); proc.kill('SIGTERM');}
});
