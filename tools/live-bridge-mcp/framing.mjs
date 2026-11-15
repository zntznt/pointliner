import { Transform } from 'node:stream';

// Retain at most one bounded partial frame; a single input turn is also bounded.
export function createInputFramer() {
  let partial = Buffer.alloc(0);
  return new Transform({ readableHighWaterMark:16384, writableHighWaterMark:16384, transform(chunk, _encoding, callback) {
    if (chunk.length > 65536) return callback(Error('Input chunk too large'));
    let start = 0;
    for (let i = 0; i < chunk.length; i++) if (chunk[i] === 10) {
      const piece = chunk.subarray(start, i);
      if (partial.length + piece.length > 16384) return callback(Error('Input frame too large'));
      this.push(Buffer.concat([partial, piece, Buffer.from('\n')])); partial = Buffer.alloc(0); start = i + 1;
    }
    const rest = chunk.subarray(start);
    if (partial.length + rest.length > 16384) return callback(Error('Input frame too large'));
    partial = Buffer.concat([partial, rest]); callback();
  }, flush(callback) { callback(partial.length ? Error('Incomplete input frame') : undefined); } });
}
