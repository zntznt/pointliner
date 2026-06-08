// test.mjs — first batch of behavior pins for Pointliner's pure cores.
//
// Run from this directory:
//     POINTLINER_HTML=/path/to/index.html node --test
// In the real repo (tests/ next to index.html) the env var isn't needed:
//     node --test
//
// These are PINS, not a spec: they capture how the cores behave *today* so a
// future refactor (e.g. collapsing the per-feature pill paths into the grammar
// engine, or adding evalMath primitives) can't silently change results. If you
// intentionally change a behavior, update the pin in the same commit.
//
// Deterministic randomness: makeDiceRoll/rollParsed/runGrammar call Math.random.
// `seedSequence([...])` makes it return a fixed, looping sequence so rolls are
// reproducible. rnd(sides) = 1 + floor(r*sides), so r=0 → the die's minimum.
//
// Not yet covered (need a small, behavior-preserving change in index.html):
//   • collectVars() / collectRules() read the module-level `root` with no
//     parameter, so they can't be driven from a test. Add a default param —
//     `function collectVars(rootNode = root)` — and they become unit-testable.
//   • fromOpml() needs DOMParser (absent in Node). Pair it with toOpml for a
//     round-trip once a parser is available (jsdom, or Node's experimental one).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCores } from './load-cores.mjs';

const c = loadCores();

// Arrays/objects returned by the cores live in the vm context's realm, so their
// prototypes differ from the host's and strict deepEqual rejects them despite
// identical structure. Normalize to plain host-realm values before comparing.
const host = (x) => JSON.parse(JSON.stringify(x));

// ── dice: parsing ──────────────────────────────────────────────────────────
test('parseDice — basic NdM + modifier', () => {
  const t = c.parseDice('2d6+3');
  assert.equal(t.length, 2);
  assert.equal(t[0].kind, 'dice');
  assert.equal(t[0].count, 2);
  assert.equal(t[0].sides, 6);
  assert.equal(t[0].sign, 1);
  assert.deepEqual({ kind: t[1].kind, value: t[1].value, sign: t[1].sign }, { kind: 'mod', value: 3, sign: 1 });
});

test('parseDice — implicit count (d20) defaults to 1', () => {
  assert.equal(c.parseDice('d20')[0].count, 1);
});

test('parseDice — keep/drop low normalizes to keep-high', () => {
  // 4d6dl1 = drop lowest 1 = keep highest 3
  const t = c.parseDice('4d6dl1')[0];
  assert.equal(t.keepMode, 'kh');
  assert.equal(t.keepCount, 3);
});

test('parseDice — exploding and Fate flags', () => {
  assert.equal(c.parseDice('2d6!')[0].exploding, true);
  assert.equal(c.parseDice('4dF')[0].sides, 'F');
});

test('parseDice — rejects malformed / out-of-range input', () => {
  assert.equal(c.parseDice('nope'), null);
  assert.equal(c.parseDice('2d6x'), null);   // trailing junk
  assert.equal(c.parseDice('1000d6'), null); // count > 999
  assert.equal(c.parseDice('1d200000'), null); // sides > 100000
  assert.equal(c.parseDice('5'), null);      // no dice term → null
});

test('parseDice — variable identifier as a modifier', () => {
  const t = c.parseDice('2d6+str', { str: 3 });
  assert.equal(t[1].kind, 'mod');
  assert.equal(t[1].value, 3);
  assert.equal(c.parseDice('2d6+str'), null); // undefined var → null
});

// ── dice: rolling (deterministic) ──────────────────────────────────────────
test('rollParsed — minimum roll (all randoms = 0)', () => {
  c.seedSequence([0]);
  try {
    assert.equal(c.rollParsed(c.parseDice('3d6')).total, 3);   // 1+1+1
    assert.equal(c.rollParsed(c.parseDice('2d6+3')).total, 5); // 1+1+3
  } finally { c.resetRandom(); }
});

test('rollParsed — keep-high keeps the top N dice', () => {
  c.seedSequence([0.9, 0, 0, 0]); // → dice [6,1,1,1]
  try {
    assert.equal(c.rollParsed(c.parseDice('4d6kh3')).total, 8); // 6+1+1
  } finally { c.resetRandom(); }
});

test('rollParsed — exploding chains on a max die', () => {
  c.seedSequence([0.99, 0]); // first die = 6 (explodes) then 1
  try {
    assert.equal(c.rollParsed(c.parseDice('1d6!')).total, 7); // 6 → +1
  } finally { c.resetRandom(); }
});

test('rollParsed — total stays within bounds over many rolls', () => {
  c.resetRandom();
  for (let i = 0; i < 200; i++) {
    const total = c.rollParsed(c.parseDice('3d6+2')).total;
    assert.ok(total >= 5 && total <= 20, `3d6+2 out of range: ${total}`);
  }
});

// ── math evaluator ─────────────────────────────────────────────────────────
test('evalMath — precedence, associativity, operators', () => {
  assert.equal(c.evalMath('2+3*4'), 14);
  assert.equal(c.evalMath('(2+3)*4'), 20);
  assert.equal(c.evalMath('2^3^2'), 512); // right-associative
  assert.equal(c.evalMath('10%3'), 1);
});

test('evalMath — functions, constants, variables', () => {
  assert.equal(c.evalMath('sqrt(16)'), 4);
  assert.equal(c.evalMath('min(3,5,1)'), 1);
  assert.equal(c.evalMath('max(2,9)'), 9);
  assert.equal(c.evalMath('log(100)'), 2);
  assert.equal(c.evalMath('ln(e)'), 1);
  assert.equal(c.evalMath('x*2', { x: 5 }), 10);
});

test('evalMath — comparisons and ternary return 0/1', () => {
  assert.equal(c.evalMath('3>2 ? 10 : 20'), 10);
  assert.equal(c.evalMath('3>=3'), 1);
  assert.equal(c.evalMath('1==2'), 0);
  assert.equal(c.evalMath('1!=2'), 1);
});

test('evalMath — division by zero: Infinity is valid, NaN is null', () => {
  assert.equal(c.evalMath('1/0'), Infinity);
  assert.equal(c.evalMath('0/0'), null);
});

test('evalMath — malformed input returns null (callers branch on null)', () => {
  assert.equal(c.evalMath(''), null);
  assert.equal(c.evalMath('1+'), null);
  assert.equal(c.evalMath('2+2x'), null); // unconsumed trailing token
});

// ── markov ─────────────────────────────────────────────────────────────────
test('parseMarkov — declaration order and weighted targets', () => {
  const p = c.parseMarkov('A -> B 2, C 1');
  assert.deepEqual(host(p.order), ['A', 'B', 'C']);
  assert.deepEqual(host(p.trans.A), [{ to: 'B', w: 2 }, { to: 'C', w: 1 }]);
});

test('walkMarkov — stops early at a terminal state', () => {
  const p = c.parseMarkov('A -> B\nB -> C'); // C has no outgoing rule
  assert.deepEqual(host(c.walkMarkov(p, 'A', 5)), ['A', 'B', 'C']);
});

// ── grammar engine ─────────────────────────────────────────────────────────
test('runGrammar — deterministic single-alternative expansion', () => {
  assert.equal(c.runGrammar('origin: hello', 'origin', {}, {}), 'hello');
});

test('runGrammar — unknown rule renders {name?} marker', () => {
  assert.equal(c.runGrammar('origin: {missing}', 'origin', {}, {}), '{missing?}');
});

test('runGrammar — reference cycle is caught (↻), not infinite', () => {
  assert.equal(c.runGrammar('a: {b}\nb: {a}', 'a', {}, {}), '↻');
});

test('runGrammar — embedded math and dice primitives', () => {
  assert.equal(c.runGrammar('origin: {= 2*3}', 'origin', {}, {}), '6');
  c.seedSequence([0]); // 2d6 → 2
  try {
    assert.equal(c.runGrammar('origin: roll {2d6}', 'origin', {}, {}), 'roll 2');
  } finally { c.resetRandom(); }
});

test('runGrammar — invalid definition returns null', () => {
  assert.equal(c.runGrammar('not a rule line', 'origin', {}, {}), null);
});

// ── tables (model ↔ markdown) ──────────────────────────────────────────────
test('parseTable / serializeTable — alignment + round-trip', () => {
  const t = c.parseTable('| a | b |\n| --- | :-: |\n| 1 | 2 |');
  assert.deepEqual(host(t.aligns), [null, 'center']);
  assert.deepEqual(host(t.rows), [['a', 'b'], ['1', '2']]);
  // serialize normalizes the center marker to :---:
  assert.equal(c.serializeTable(t), '| a | b |\n| --- | :---: |\n| 1 | 2 |');
});

// ── markdown helpers ───────────────────────────────────────────────────────
test('stripMd — strips inline markers and link/code syntax', () => {
  assert.equal(c.stripMd('**bold** and `code` and [x](y)'), 'bold and code and x');
});

test('mdToHtml — ATX heading becomes a real <h1>', () => {
  assert.equal(c.mdToHtml('# Title'), '<h1 class="md-h">Title</h1>');
});

// ── OPML serialization ─────────────────────────────────────────────────────
test('toOpml — escapes text and encodes newlines as &#10;', () => {
  const root = c.mkRoot();
  root.text = 'Doc';
  root.children.push(c.mkNode('line1\nline2'));
  const xml = c.toOpml(root);
  assert.ok(xml.includes('text="line1&#10;line2"'), 'newline should encode as &#10;');
  assert.ok(xml.includes('<opml version="2.0">'));
});

test('toOpml — sidecar arrays serialize into underscore attributes', () => {
  const root = c.mkRoot();
  const n = c.mkNode('roll');
  n.dice = [{ key: 'r1', expr: '2d6', total: 7, parts: [] }];
  n.text = 'roll [[dice:r1]]';
  root.children.push(n);
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_dice='), 'dice sidecar should serialize');
  assert.ok(xml.includes('r1'), 'dice key should appear in the attribute');
});

// ── collectVars / collectRules (explicit root, parameterized) ───────────────
const mkVarRoot = (decls) => {
  const root = c.mkRoot();
  for (const [key, name, expr] of decls) {
    const n = c.mkNode(`[[var:${key}]]`);
    n.vars = [{ key, name, expr }];
    root.children.push(n);
  }
  return root;
};

test('collectVars — resolves a chain (one var references another)', () => {
  const root = mkVarRoot([['r', 'r', '5'], ['area', 'area', 'pi*r^2']]);
  const vars = c.collectVars(root);
  assert.equal(vars.r, 5);
  assert.ok(Math.abs(vars.area - Math.PI * 25) < 1e-9, `area was ${vars.area}`);
});

test('collectVars — a reference cycle is broken, not resolved (no hang/overflow)', () => {
  const root = mkVarRoot([['a', 'a', 'b'], ['b', 'b', 'a']]);
  const vars = c.collectVars(root);
  assert.equal('a' in vars, false);
  assert.equal('b' in vars, false);
});

test('collectVars — later declaration of a name shadows the earlier (last wins)', () => {
  const root = mkVarRoot([['x1', 'x', '1'], ['x2', 'x', '2']]);
  assert.equal(c.collectVars(root).x, 2);
});

test('collectVars — explicit root bypasses the cache (distinct roots, distinct results)', () => {
  assert.equal(c.collectVars(mkVarRoot([['n', 'n', '10']])).n, 10);
  assert.equal(c.collectVars(mkVarRoot([['n', 'n', '20']])).n, 20);
});

test('collectRules — a grammar pill registers its named rules document-wide', () => {
  const root = c.mkRoot();
  const n = c.mkNode('[[grammar:g1]]');
  n.grammar = [{ key: 'g1', def: 'color: red | blue', origin: 'color', result: 'red' }];
  root.children.push(n);
  assert.ok('color' in c.collectRules(root), 'named grammar rule should be registered');
});

// ── success-counting dice pools (with exploding) ────────────────────────────
// A comparison suffix (>=,<=,>,<,=) turns the term into "count dice that match".
// In a pool each rolled face is its own die — exploding adds independently-
// counted dice rather than summing into one value.

test('parseDice — success comparison is parsed onto the term', () => {
  assert.deepEqual(host(c.parseDice('6d10>=7')[0].success), { op: '>=', target: 7 });
  assert.deepEqual(host(c.parseDice('4d6<=2')[0].success), { op: '<=', target: 2 });
  assert.deepEqual(host(c.parseDice('5d6=6')[0].success), { op: '=', target: 6 });
});

test('parseDice — plain dice still parse unchanged (no regression)', () => {
  const t = c.parseDice('2d6+3');
  assert.equal(t[0].count, 2);
  assert.equal(t[0].sides, 6);
  assert.equal(t[0].success, undefined);
  assert.equal(t[1].value, 3);
  assert.equal(c.parseDice('4d6kh3')[0].keepMode, 'kh'); // keep/drop path intact
});

test('parseDice — success pools reject mixing and bad combos', () => {
  assert.equal(c.parseDice('6d10>=7+2'), null);     // no modifier mixing
  assert.equal(c.parseDice('2d6>=4+1d8>=4'), null); // no second term
  assert.equal(c.parseDice('6d6kh3>=4'), null);     // keep/drop + success disallowed
  assert.equal(c.parseDice('4dF>=1'), null);        // Fate + success disallowed
});

// Seed each d6 to a known face: rnd(6)=1+floor(r*6), so r=(face-1)/6.
const seedFaces = (...faces) => c.seedSequence(faces.map(f => (f - 1) / 6));

test('rollParsed — counts NUMBER of successes, not the pip sum', () => {
  seedFaces(1, 2, 3, 4, 5, 6);
  try {
    // the canonical example: target 4-or-under over 1..6 → {1,2,3,4} = 4 successes
    assert.equal(c.rollParsed(c.parseDice('6d6<=4')).total, 4);
  } finally { c.resetRandom(); }
});

test('rollParsed — comparison direction changes which dice count', () => {
  const faces = [1, 2, 3, 4, 5, 6];
  for (const [expr, expected] of [['6d6>=4', 3], ['6d6>=5', 2], ['6d6=6', 1], ['6d6<=2', 2], ['6d6>4', 2]]) {
    seedFaces(...faces);
    try { assert.equal(c.rollParsed(c.parseDice(expr)).total, expected, expr); } finally { c.resetRandom(); }
  }
});

test('rollParsed — exposes nested per-face hits and the success count', () => {
  seedFaces(1, 2, 3, 4, 5, 6);
  try {
    const part = c.rollParsed(c.parseDice('6d6>=5')).parts[0];
    assert.equal(part.successes, 2);
    // hits is parallel to rolls (one entry per chain; each chain a single face here)
    assert.deepEqual(host(part.hits), [[false], [false], [false], [false], [true], [true]]);
    assert.equal(part.sum, undefined); // success parts carry a count, not a sum
  } finally { c.resetRandom(); }
});

test('rollParsed — exploding adds independently-counted dice to the pool', () => {
  // 6d6!>=5: die 1 rolls 6 (explodes) → 5; both are ≥5, so that ONE die yields 2
  // successes. The other five roll 1 (miss). Total = 2 (not 1 from summing 6+5=11).
  seedFaces(6, 5, 1, 1, 1, 1, 1);
  try {
    const r = c.rollParsed(c.parseDice('6d6!>=5'));
    assert.equal(r.total, 2);
    assert.equal(r.parts[0].successes, 2);
    assert.deepEqual(host(r.parts[0].hits[0]), [true, true]); // the exploded chain
  } finally { c.resetRandom(); }
});

test('rollParsed — one die can explode multiple times, each face counted', () => {
  // 3d6!>=6: die 1 rolls 6 → 6 → 1; two 6s hit, the 1 misses → 2 successes.
  seedFaces(6, 6, 1, 1, 1);
  try {
    const r = c.rollParsed(c.parseDice('3d6!>=6'));
    assert.equal(r.total, 2);
    assert.deepEqual(host(r.parts[0].hits[0]), [true, true, false]);
  } finally { c.resetRandom(); }
});

// ── unit conversions (evalMath) ─────────────────────────────────────────────
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('math — conditionals already work (ternary + if())', () => {
  assert.equal(c.evalMath('3 > 2 ? 10 : 20'), 10);
  assert.equal(c.evalMath('if(3 > 2, 10, 20)'), 10);
  assert.equal(c.evalMath('if(1 > 2, 10, 20)'), 20);
});
test('math — unit conversion: temperature', () => {
  assert.equal(c.evalMath('c2f(20)'), 68);
  assert.equal(c.evalMath('f2c(32)'), 0);
  near(c.evalMath('f2c(98.6)'), 37);
});
test('math — unit conversion: distance, mass, speed, volume', () => {
  near(c.evalMath('mi2km(1)'), 1.609344);
  near(c.evalMath('ft2m(1)'), 0.3048);
  near(c.evalMath('lb2kg(1)'), 0.45359237);
  near(c.evalMath('mph2kmh(60)'), 96.56064);
  near(c.evalMath('gal2l(1)'), 3.785411784);
});
test('math — conversions compose with the evaluator', () => {
  assert.equal(c.evalMath('round(mi2km(26.2))'), 42);
  near(c.evalMath('km2mi(mi2km(5))'), 5);
});
test('math — conversion names need one argument', () => {
  assert.equal(c.evalMath('c2f'), null);
  assert.equal(c.evalMath('c2f()'), null);
});

// ── date math (evalMath) ────────────────────────────────────────────────────
test('date — date(y,m,d) differences give day counts', () => {
  assert.equal(c.evalMath('date(2026,12,25) - date(2026,12,18)'), 7);
  assert.equal(c.evalMath('date(2027,1,1) - date(2026,12,31)'), 1);
});
test('date — component pullers', () => {
  assert.equal(c.evalMath('year(date(2026,12,25))'), 2026);
  assert.equal(c.evalMath('month(date(2026,12,25))'), 12);
  assert.equal(c.evalMath('day(date(2026,12,25))'), 25);
  assert.equal(c.evalMath('weekday(date(2026,12,25))'), 5); // Fri (0=Sun)
  assert.equal(c.evalMath('weekday(date(2026,12,27))'), 0); // Sun
});
test('date — today is a finite integer; self-difference is 0', () => {
  const t = c.evalMath('today');
  assert.ok(Number.isInteger(t) && isFinite(t));
  assert.equal(c.evalMath('today - today'), 0);
  const wd = c.evalMath('weekday(today)'); assert.ok(wd >= 0 && wd <= 6);
});
test('date — asdate() is numeric identity, so it still composes', () => {
  assert.equal(c.evalMath('asdate(date(2026,12,25))'), c.evalMath('date(2026,12,25)'));
  assert.equal(c.evalMath('asdate(date(2026,12,25)) - asdate(date(2026,12,18))'), 7);
});
test('date — formatEpochDays renders ISO, including a leap day', () => {
  assert.equal(c.formatEpochDays(c.evalMath('date(2026,12,25)')), '2026-12-25');
  assert.equal(c.formatEpochDays(c.evalMath('date(2024,2,29)')), '2024-02-29');
});
test('date — makeMathResult tags + formats an asdate() expression', () => {
  const r = c.makeMathResult('asdate(date(2026,12,25))');
  assert.equal(r.result, '2026-12-25'); assert.equal(r.fmt, 'date');
  const plain = c.makeMathResult('2+2');
  assert.equal(plain.result, '4'); assert.equal(plain.fmt, undefined);
});
test('date — arity guard: date() needs exactly 3 args', () => {
  assert.equal(c.evalMath('date(2026,12)'), null);
  assert.equal(c.evalMath('date(2026,12,25,1)'), null);
});

// ─── collectLinks ─────────────────────────────────────────────────────────────
import { test as ltest } from 'node:test';
import assert2 from 'node:assert/strict';
{
  const c2 = (await import('./load-cores.mjs')).loadCores();
  const host2 = (x) => JSON.parse(JSON.stringify(x));
  const mk2 = (text) => { const n = c2.mkNode(''); n.text = text; return n; };

  ltest('collectLinks — a link records outgoing + backlink, no broken', () => {
    const a = mk2(''), b = mk2('target B');
    a.text = `see [[#${b.id}|B]]`;
    const root = c2.mkRoot(); root.children.push(a, b);
    const idx = c2.collectLinks(root);
    assert2.deepEqual(host2(idx.outgoing[a.id]), [{ target: b.id, label: 'B' }]);
    assert2.deepEqual(host2(idx.backlinks[b.id]), [a.id]);
    assert2.deepEqual(host2(idx.broken), []);
  });

  ltest('collectLinks — label is optional', () => {
    const a = mk2(''), b = mk2('B');
    a.text = `[[#${b.id}]]`;
    const root = c2.mkRoot(); root.children.push(a, b);
    assert2.equal(c2.collectLinks(root).outgoing[a.id][0].label, '');
  });

  ltest('collectLinks — a missing target is flagged broken', () => {
    const a = mk2('A'); a.text = `[[#deadbeef|gone]]`;
    const root = c2.mkRoot(); root.children.push(a);
    const idx = c2.collectLinks(root);
    assert2.deepEqual(host2(idx.backlinks['deadbeef']), [a.id]);
    assert2.deepEqual(host2(idx.broken), ['deadbeef']);
  });

  ltest('collectLinks — duplicate links: outgoing keeps both, backlink dedupes the source', () => {
    const a = mk2(''), b = mk2('B');
    a.text = `[[#${b.id}|one]] and again [[#${b.id}|two]]`;
    const root = c2.mkRoot(); root.children.push(a, b);
    const idx = c2.collectLinks(root);
    assert2.equal(idx.outgoing[a.id].length, 2);
    assert2.deepEqual(host2(idx.backlinks[b.id]), [a.id]);
  });

  ltest('collectLinks — multiple sources to one target', () => {
    const a = mk2(''), d = mk2(''), b = mk2('B');
    a.text = `[[#${b.id}]]`; d.text = `[[#${b.id}]]`;
    const root = c2.mkRoot(); root.children.push(a, d, b);
    assert2.deepEqual(host2(c2.collectLinks(root).backlinks[b.id]).sort(), [a.id, d.id].sort());
  });

  ltest('collectLinks — nested children; ignores artifact tokens and #hashtags', () => {
    const a = mk2(''), b = mk2('B');
    const parent = c2.mkNode(''); parent.children.push(a);
    a.text = `nested [[#${b.id}]]`;
    parent.text = 'no link here, just #hashtag and [[dice:abc]]';
    const root = c2.mkRoot(); root.children.push(parent, b);
    const idx = c2.collectLinks(root);
    assert2.deepEqual(host2(idx.backlinks[b.id]), [a.id]);
    assert2.equal(idx.outgoing[parent.id], undefined);
  });

  ltest('collectLinks — empty doc yields an empty index', () => {
    const idx = c2.collectLinks(c2.mkRoot());
    assert2.deepEqual(host2(idx.outgoing), {});
    assert2.deepEqual(host2(idx.backlinks), {});
    assert2.deepEqual(host2(idx.broken), []);
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Table formulas (Org-mode spreadsheet conventions)
// Cores are pure (no DOM); they translate Org @ROW$COLUMN references + ranges
// onto the existing evalMath engine, so the full math grammar works in formulas.
// `host` (JSON-normalize across the vm realm) is defined above for the link tests.
// ───────────────────────────────────────────────────────────────────────────
const { orgResolveComp, parseOrgRef, parseTblfm, computeTable } = c;

const tblModel = () => ({
  aligns: [null, null, null],
  rows: [
    ['Item', 'Qty', 'Price'],   // @1 (header)
    ['a', '2', '3'],            // @2
    ['b', '5', '4'],            // @3
    ['c', '10', '1'],           // @4
  ],
});
const tblDims = { nrows: 4, ncols: 3 };

test('table: orgResolveComp absolute/relative/special/current', () => {
  assert.equal(orgResolveComp('2', 0, 4), 1);
  assert.equal(orgResolveComp('<', 9, 4), 0);
  assert.equal(orgResolveComp('>', 0, 4), 3);
  assert.equal(orgResolveComp('-1', 2, 4), 1);
  assert.equal(orgResolveComp('+1', 1, 4), 2);
  assert.equal(orgResolveComp('0', 2, 4), 2);
});

test('table: parseOrgRef — omitted part implies current row/col', () => {
  assert.deepEqual(host(parseOrgRef('@2$3', { row: 0, col: 0 }, tblDims)), { row: 1, col: 2 });
  assert.deepEqual(host(parseOrgRef('$3',   { row: 2, col: 0 }, tblDims)), { row: 2, col: 2 });
  assert.deepEqual(host(parseOrgRef('@2',   { row: 0, col: 1 }, tblDims)), { row: 1, col: 1 });
  assert.deepEqual(host(parseOrgRef('@-1$-1', { row: 3, col: 2 }, tblDims)), { row: 2, col: 1 });
  assert.equal(parseOrgRef('foo', { row: 0, col: 0 }, tblDims), null);
});

test('table: parseTblfm — column / field / row targets, :: separation', () => {
  const fs = parseTblfm('$3=$1*$2 :: @4$1=99 :: @2=0', tblDims);
  assert.deepEqual(host(fs[0].target), { kind: 'col', col: 2 });
  assert.deepEqual(host(fs[1].target), { kind: 'field', row: 3, col: 0 });
  assert.deepEqual(host(fs[2].target), { kind: 'row', row: 1 });
  assert.equal(fs[0].expr, '$1*$2');
});

test('table: column formula $4=$2*$3 fills data rows, skips header', () => {
  const m = { aligns: [null, null, null, null], rows: [
    ['Item', 'Qty', 'Price', 'Total'],
    ['a', '2', '3', ''], ['b', '5', '4', ''], ['c', '10', '1', ''],
  ] };
  const out = computeTable(m, '$4=$2*$3');
  assert.equal(out[0][3], 'Total');
  assert.equal(out[1][3], '6');
  assert.equal(out[2][3], '20');
  assert.equal(out[3][3], '10');
});

test('table: field formula with vsum range over a column', () => {
  assert.equal(computeTable(tblModel(), '@4$3=vsum(@2$2..@4$2)')[3][2], '17');
});

test('table: range aggregates vmean/vmax/vmin/vcount/vmedian', () => {
  const f = (e) => computeTable(tblModel(), '@4$1=' + e)[3][0];
  assert.equal(f('vmean(@2$2..@4$2)'), parseFloat((17 / 3).toPrecision(8)).toString());
  assert.equal(f('vmax(@2$2..@4$2)'), '10');
  assert.equal(f('vmin(@2$2..@4$2)'), '2');
  assert.equal(f('vcount(@2$2..@4$2)'), '3');
  assert.equal(f('vmedian(@2$2..@4$2)'), '5');
});

test('table: relative @-1 chain produces a running total', () => {
  const m = { aligns: [null, null], rows: [['n', 'run'], ['1', ''], ['2', ''], ['3', '']] };
  const out = computeTable(m, '@2$2=@2$1 :: @3$2=@-1$2+$1 :: @4$2=@-1$2+$1');
  assert.equal(out[1][1], '1');
  assert.equal(out[2][1], '3');
  assert.equal(out[3][1], '6');
});

test('table: blank = 0 scalar, suppressed in ranges', () => {
  const m = { aligns: [null, null], rows: [['x', 'y'], ['', '4'], ['2', '6']] };
  assert.equal(computeTable(m, '@2$2=@2$1+10')[1][1], '10');
  assert.equal(computeTable(m, '@3$2=vmean(@2$1..@3$1)')[2][1], '2');
});

test('table: @# / $# substitute current row/column number', () => {
  const out = computeTable(tblModel(), '$1=@#');
  assert.equal(out[1][0], '2');
  assert.equal(out[2][0], '3');
  assert.equal(out[3][0], '4');
});

test('table: full math grammar inside formulas (conditional + fn)', () => {
  const out = computeTable(tblModel(), '$1=if($2>4, sqrt($3), 0)');
  assert.equal(out[1][0], '0');
  assert.equal(out[2][0], '2');
  assert.equal(out[3][0], '1');
});

test('table: $< / $> immutable first/last column references', () => {
  const m = { aligns: [null, null, null], rows: [['first', 'mid', 'last'], ['10', '', '1']] };
  assert.equal(computeTable(m, '@2$2=$<+$>')[1][1], '11');
});

test('table: cycle detection yields #ERR, not a hang', () => {
  const out = computeTable(tblModel(), '@2$1=@2$2 :: @2$2=@2$1');
  assert.equal(out[1][0], '#ERR');
  assert.equal(out[1][1], '#ERR');
});

test('table: field formula overrides column formula regardless of source order', () => {
  // footer-total idiom: column formula fills all data rows (incl. the total row,
  // where it would be 0*0); a field formula overrides just the total cell. Field
  // written FIRST, column SECOND — the field still wins (Org precedence rule).
  const m = { aligns: [null, null, null, null], rows: [
    ['Item', 'Qty', 'Price', 'Total'],
    ['a', '2', '3', ''], ['b', '5', '4', ''], ['Sum', '', '', ''],
  ] };
  const out = computeTable(m, '@4$4=vsum(@2$4..@3$4) :: $4=$2*$3');
  assert.equal(out[1][3], '6');
  assert.equal(out[2][3], '20');
  assert.equal(out[3][3], '26');   // 6+20, not 0*0
});

test('table: non-formula cells preserved verbatim', () => {
  const out = computeTable(tblModel(), '$3=$1*$2');
  assert.equal(out[1][0], 'a');
  assert.equal(out[2][0], 'b');
});

// ── TODO states + priorities (Org-style headline keyword + [#A] priority) ──────
const { parseTodo, formatTodo, todoIsDone, cycleTodoKeyword, cyclePriority,
        cycleTodoState, cycleTodoPriority, todoSortKey, compareTodo } = c;

test('todo: parseTodo keyword + priority + body', () => {
  assert.deepEqual(host(parseTodo('TODO [#A] Buy milk')), { keyword: 'TODO', priority: 'A', body: 'Buy milk' });
  assert.deepEqual(host(parseTodo('NEXT Ship it')),       { keyword: 'NEXT', priority: null, body: 'Ship it' });
  assert.deepEqual(host(parseTodo('DONE')),               { keyword: 'DONE', priority: null, body: '' });
});

test('todo: no keyword → empty keyword, whole text as body', () => {
  assert.deepEqual(host(parseTodo('Buy milk')), { keyword: '', priority: null, body: 'Buy milk' });
  assert.deepEqual(host(parseTodo('TODOlist cleanup')), { keyword: '', priority: null, body: 'TODOlist cleanup' });
});

test('todo: tolerant of extra whitespace + lowercase priority', () => {
  assert.deepEqual(host(parseTodo('TODO   [#b]   tidy')), { keyword: 'TODO', priority: 'B', body: 'tidy' });
});

test('todo: formatTodo inverts parseTodo (normalized)', () => {
  const round = (s) => formatTodo(parseTodo(s));
  assert.equal(round('TODO [#A] Buy milk'), 'TODO [#A] Buy milk');
  assert.equal(round('TODO   [#b]   tidy'), 'TODO [#B] tidy');
  assert.equal(round('DONE'), 'DONE');
  assert.equal(round('plain text'), 'plain text');
});

test('todo: todoIsDone', () => {
  assert.equal(todoIsDone('DONE'), true);
  assert.equal(todoIsDone('TODO'), false);
  assert.equal(todoIsDone(''), false);
});

test('todo: cycleTodoKeyword full forward cycle incl. cleared state', () => {
  assert.equal(cycleTodoKeyword(''), 'TODO');
  assert.equal(cycleTodoKeyword('TODO'), 'NEXT');
  assert.equal(cycleTodoKeyword('NEXT'), 'WAITING');
  assert.equal(cycleTodoKeyword('WAITING'), 'DONE');
  assert.equal(cycleTodoKeyword('DONE'), '');
});

test('todo: cycleTodoKeyword reverse direction', () => {
  assert.equal(cycleTodoKeyword('', -1), 'DONE');
  assert.equal(cycleTodoKeyword('TODO', -1), '');
});

test('todo: cyclePriority none → A → B → C → none, and reverse', () => {
  assert.equal(cyclePriority(null), 'A');
  assert.equal(cyclePriority('A'), 'B');
  assert.equal(cyclePriority('C'), null);
  assert.equal(cyclePriority(null, -1), 'C');
});

test('todo: cycleTodoState rewrites text keyword, preserving body + priority', () => {
  assert.equal(cycleTodoState('TODO [#A] Buy milk'), 'NEXT [#A] Buy milk');
  assert.equal(cycleTodoState('plain task'), 'TODO plain task');
  assert.equal(cycleTodoState('DONE [#B] wrap up'), 'wrap up');   // clearing drops keyword + priority
});

test('todo: cycleTodoPriority no-op without a keyword', () => {
  assert.equal(cycleTodoPriority('just a note'), 'just a note');
  assert.equal(cycleTodoPriority('TODO write tests'), 'TODO [#A] write tests');
  assert.equal(cycleTodoPriority('TODO [#C] write tests'), 'TODO write tests');
});

test('todo: todoSortKey + compareTodo (not-done before done, A<B<C<none)', () => {
  assert.deepEqual(host(todoSortKey('TODO [#A] x')), [0, 0, 0]);
  assert.deepEqual(host(todoSortKey('DONE x')),      [1, 3, 3]);
  assert.deepEqual(host(todoSortKey('plain')),       [0, 3, 4]);
  const items = ['DONE done it', 'TODO [#C] low', 'NEXT [#A] hot', 'plain note'];
  assert.deepEqual(items.slice().sort(compareTodo),
    ['NEXT [#A] hot', 'TODO [#C] low', 'plain note', 'DONE done it']);
});
