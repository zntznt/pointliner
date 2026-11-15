import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { PassThrough } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createInputFramer } from './framing.mjs';

async function collect(chunks) {
  const framer = createInputFramer();
  const output = [];
  framer.on('data', chunk => output.push(chunk));
  const finished = once(framer, 'end');
  for (const chunk of chunks) framer.write(chunk);
  framer.end();
  await finished;
  return Buffer.concat(output);
}

test('preserves coalesced frames, CRLF and split UTF-8 bytes', async () => {
  const source = Buffer.from('first\r\nélan\nlast\n');
  const split = source.indexOf(0xc3) + 1;
  assert.deepEqual(await collect([source.subarray(0,split),source.subarray(split)]), source);
});

test('accepts a 16 KiB frame split across writes', async () => {
  const frame = Buffer.concat([Buffer.alloc(16384, 120), Buffer.from('\n')]);
  assert.deepEqual(await collect([frame.subarray(0,8000),frame.subarray(8000)]), frame);
});

test('rejects oversized frames, oversized chunks, and incomplete EOF', async () => {
  for (const [chunks, expected] of [
    [[Buffer.alloc(16384,120), Buffer.from('x')], /Input frame too large/],
    [[Buffer.alloc(65537,10)], /Input chunk too large/],
    [[Buffer.from('unfinished')], /Incomplete input frame/]
  ]) {
    const framer = createInputFramer(); framer.resume();
    const error = once(framer,'error');
    for (const chunk of chunks) framer.write(chunk);
    framer.end();
    assert.match((await error)[0].message, expected);
  }
});

test('SDK receives coalesced frames after downstream pause and resume', {timeout:5000}, async () => {
  const input = createInputFramer(), output = new PassThrough(); output.resume();
  const transport = new StdioServerTransport(input, output, {maxBufferSize:131072});
  const seen = []; transport.onmessage = message => seen.push(message.id);
  await transport.start();
  try {
    input.pause();
    const frame = id => JSON.stringify({jsonrpc:'2.0',id,method:'ping',params:{padding:'x'.repeat(900)}})+'\n';
    const batch = Array.from({length:40},(_,id) => frame(id)).join('');
    assert.ok(Buffer.byteLength(batch) > 22000);
    input.write(batch); await delay(20);
    assert.ok(input.readableLength + input.writableLength >= input.readableHighWaterMark);
    assert.equal(seen.length,0); input.resume();
    for (let i=0;i<100 && seen.length<40;i++) await delay(10);
    assert.deepEqual(seen,Array.from({length:40},(_,id)=>id));
  } finally { await transport.close(); input.destroy(); output.destroy(); }
});
