// Independent native client; receives endpoint and one-use capabilities over private IPC.
process.on('message', async ({ url, tokens }) => {
  try {
    const call = async (token, command) => {
      const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-capability': token }, body: JSON.stringify(command), redirect: 'error' });
      return { status: response.status, body: await response.json() };
    };
    const before = await call(tokens[0], { op: 'read' });
    const after = await call(tokens[1], { op: 'append', text: 'native synthetic point' });
    process.send({ before, after });
  } catch (error) { process.send({ error: error.message }); }
  process.disconnect();
});
