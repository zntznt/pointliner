import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

if (process.argv.includes('--sdk-fixture')) {
  const server = new McpServer({ name:'sdk-smoke-fixture', version:'1.0.0' });
  server.registerTool('echo', {
    description:'Return the supplied text.',
    inputSchema:z.object({ text:z.string() }).strict()
  }, async ({text}) => ({ content:[{type:'text', text}] }));
  await server.connect(new StdioServerTransport());
} else {
  test('installed MCP SDK negotiates and calls a tool over stdio', {timeout:10000}, async () => {
    const client = new Client({ name:'sdk-smoke-client', version:'1.0.0' });
    const transport = new StdioClientTransport({
      command:process.execPath,
      args:[fileURLToPath(import.meta.url), '--sdk-fixture'],
      stderr:'pipe'
    });
    try {
      await client.connect(transport);
      assert.equal(client.getServerVersion()?.name, 'sdk-smoke-fixture');
      const {tools} = await client.listTools();
      assert.deepEqual(tools.map(tool => tool.name), ['echo']);
      const response = await client.callTool({name:'echo', arguments:{text:'stdio works'}});
      assert.equal(response.isError, undefined);
      assert.deepEqual(response.content, [{type:'text', text:'stdio works'}]);
      const invalid = await client.callTool({name:'echo', arguments:{text:42}});
      assert.equal(invalid.isError, true);
    } finally {
      await client.close();
    }
  });
}
