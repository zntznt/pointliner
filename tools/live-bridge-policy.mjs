// Inert policy building block for a future live bridge. This module does not
// authenticate callers, establish a session, access the editor, or open a port.
// A transport MUST authenticate and bind a revocable session before calling it.

const MAX_NODES = 10000;
const MAX_DEPTH = 256;
const MAX_TEXT_BYTES = 16384;
const MAX_SNAPSHOT_BYTES = 1048576;
const MAX_ID_LENGTH = 128;
const encoder = new TextEncoder();

function validId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= MAX_ID_LENGTH;
}

function exactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

// Walk the entire document, not just the selected branch: ambiguous IDs anywhere
// must not allow a caller to address a different point via the editor's lookup.
// Reject malformed, cyclic, excessively deep or excessively large model trees.
export function bridgeScope(documentRoot, selectedId) {
  if (!validId(selectedId)) return null;
  const seenNodes = new Set();
  const ids = new Set();
  const stack = [{ node: documentRoot, depth: 0, selected: false }];
  const scoped = [];
  let bytes = 0;
  let found = false;
  while (stack.length) {
    const { node, depth, selected } = stack.pop();
    if (!node || typeof node !== 'object' || seenNodes.has(node) || depth > MAX_DEPTH ||
        !validId(node.id) || ids.has(node.id) || typeof node.text !== 'string' ||
        !Array.isArray(node.children)) return null;
    seenNodes.add(node);
    ids.add(node.id);
    if (seenNodes.size + stack.length + node.children.length > MAX_NODES) return null;
    const inside = selected || node.id === selectedId;
    if (node.id === selectedId) found = true;
    if (inside) {
      if (node.text.length > MAX_TEXT_BYTES) return null;
      const textBytes = encoder.encode(node.text).length;
      bytes += textBytes + encoder.encode(node.id).length;
      if (textBytes > MAX_TEXT_BYTES || bytes > MAX_SNAPSHOT_BYTES) return null;
      scoped.push({ id: node.id, text: node.text });
    }
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push({ node: node.children[i], depth: depth + 1, selected: inside });
    }
  }
  return found ? scoped : null;
}

// Only parses the application operation. Transport authentication, replay
// protection, session/document freshness and editor state are separate gates.
export function bridgeOperation(request, scope) {
  if (!Array.isArray(scope)) return null;
  if (exactKeys(request, ['op']) && request.op === 'read') {
    return { op: 'read', points: scope.map(({ id, text }) => ({ id, text })) };
  }
  if (!exactKeys(request, ['op', 'parentId', 'text']) || request.op !== 'append' ||
      !validId(request.parentId) || typeof request.text !== 'string' ||
      request.text.length > MAX_TEXT_BYTES || encoder.encode(request.text).length > MAX_TEXT_BYTES ||
      !scope.some(point => point.id === request.parentId)) return null;
  return { op: 'append', parentId: request.parentId, text: request.text };
}
