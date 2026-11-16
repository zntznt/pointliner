import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, symlinkSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const server = fileURLToPath(new URL('./server.mjs', import.meta.url));
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-lifetime-test-'));
  const pkg = join(dir, 'tools', 'live-bridge-mcp'), marker = join(dir, 'spawned');
  mkdirSync(pkg, {recursive:true});
  for (const name of ['server.mjs','framing.mjs']) copyFileSync(new URL('./'+name,import.meta.url),join(pkg,name));
  symlinkSync(resolve('tools/live-bridge-mcp/node_modules'),join(pkg,'node_modules'));
  writeFileSync(join(dir,'tools','live-agent.mjs'), `import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(marker)},JSON.stringify(process.argv.slice(2))); process.stdout.write(JSON.stringify({type:'ready',app:'/tmp/app',pairing:'/tmp/pairing',port:12345})+'\\n'); process.stdin.resume();`);
  return {dir, marker, server:join(pkg,'server.mjs')};
}

test('invalid lifetime arguments fail before helper spawn or session directory', () => {
  const f = fixture();
  try {
    for (const args of [['--lifetime'],['--lifetime','0'],['--lifetime','3601'],['--lifetime','-1'],['--lifetime','1.5'],['--lifetime','1e2'],['--lifetime','001'],['--lifetime','NaN'],['--lifetime','1','extra'],['--unknown']]) {
      const run = spawnSync(process.execPath,[f.server,...args],{encoding:'utf8',env:{...process.env,TMPDIR:f.dir},timeout:5000});
      assert.equal(run.status,1,JSON.stringify(args)); assert.equal(run.stdout,'');
      assert.match(run.stderr,/Usage:/); assert.equal(existsSync(f.marker),false);
      assert.ok(!readdirSync(f.dir).some(name=>name.startsWith('pointliner-mcp-')));
    }
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});

test('default and boundary values are passed to the helper without alteration', async () => {
  const f = fixture();
  try {
    for (const args of [[],['--lifetime','1'],['--lifetime','3600']]) {
      const client = new Client({name:'lifetime-test',version:'1'});
      try {
        await client.connect(new StdioClientTransport({command:process.execPath,args:[f.server,...args],stderr:'pipe'}));
        const info = await client.callTool({name:'session_info',arguments:{}});
        assert.notEqual(info.isError,true);
        assert.deepEqual(JSON.parse(readFileSync(f.marker,'utf8')),['--agent',...args]);
      } finally { await client.close(); }
    }
  } finally { rmSync(f.dir,{recursive:true,force:true}); }
});

test('one-second lifetime really expires and removes the generated session', {timeout:8000}, async () => {
  const client = new Client({name:'expiry-test',version:'1'});
  try {
    await client.connect(new StdioClientTransport({command:process.execPath,args:[server,'--lifetime','1'],stderr:'pipe'}));
    const ready = await client.callTool({name:'session_info',arguments:{}});
    assert.notEqual(ready.isError,true); const info = JSON.parse(ready.content[0].text);
    assert.ok(existsSync(info.app));
    for (let i=0;i<50 && existsSync(info.app);i++) await delay(100);
    assert.equal(existsSync(info.app),false); assert.equal(existsSync(info.pairing),false);
    const expired = await client.callTool({name:'session_info',arguments:{}});
    assert.equal(expired.isError,true);
  } finally { await client.close(); }
});
