import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bridgeScope, bridgeOperation } from '../tools/live-bridge-policy.mjs';

const point = (id, text = id, children = []) => ({ id, text, children });
const tree = () => point('root', 'private', [point('selected', 'one', [point('child', 'two')]), point('outside', 'secret')]);

test('scope returns only selected descendants, as detached text and IDs', () => {
  const doc = tree();
  const scope = bridgeScope(doc, 'selected');
  assert.deepEqual(scope, [{ id: 'selected', text: 'one' }, { id: 'child', text: 'two' }]);
  const result = bridgeOperation({ op: 'read' }, scope);
  result.points[0].text = 'changed';
  assert.equal(doc.children[0].text, 'one');
  assert.equal(scope[0].text, 'one');
});

test('append is limited to scope and exact, bounded plain text requests', () => {
  const scope = bridgeScope(tree(), 'selected');
  assert.deepEqual(bridgeOperation({ op: 'append', parentId: 'child', text: 'hello' }, scope), { op: 'append', parentId: 'child', text: 'hello' });
  for (const req of [
    { op: 'append', parentId: 'outside', text: 'x' },
    { op: 'append', parentId: 'child', text: 'x', path: '/tmp/x' },
    { op: 'append', parentId: 'child', text: '💡'.repeat(4097) },
    { op: 'append', parentId: 'child', text: 42 },
    { op: 'read', extra: true }, { op: 'eval', text: '1+1' }, null,
  ]) assert.equal(bridgeOperation(req, scope), null);
  assert.equal(bridgeOperation({ op: 'read' }, null), null);
});

test('missing, duplicate, cyclic, malformed and oversized trees fail closed', () => {
  assert.equal(bridgeScope(tree(), 'missing'), null);
  const dup = tree(); dup.children[1].id = 'child';
  assert.equal(bridgeScope(dup, 'selected'), null);
  const cyclic = tree(); cyclic.children[0].children.push(cyclic);
  assert.equal(bridgeScope(cyclic, 'selected'), null);
  const malformed = tree(); malformed.children[1].children = null;
  assert.equal(bridgeScope(malformed, 'selected'), null);
  const huge = tree(); huge.children[0].text = 'x'.repeat(16385);
  assert.equal(bridgeScope(huge, 'selected'), null);
  let deep = point('leaf');
  for (let i = 0; i < 257; i++) deep = point(`n${i}`, '', [deep]);
  assert.equal(bridgeScope(deep, 'n256'), null);
});
