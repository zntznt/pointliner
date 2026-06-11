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
// ── bound picks (consistent picks / {name := rhs} binding) ────────────────
test('bound picks: {name := rhs} emits the value and stores it', () => {
  // Bind once, reuse twice — all three occurrences must be the same letter.
  c.seedSequence([0, 0]); // [top-level alt, A|B|C pick]
  try {
    const r = c.runGrammar('origin: {a := A|B|C} {a} {a}', 'origin', {}, {});
    const parts = r.split(' ');
    assert.equal(parts.length, 3, 'three tokens');
    assert.equal(parts[0], parts[1], 'reuse == bind');
    assert.equal(parts[1], parts[2], 'second reuse == bind');
  } finally { c.resetRandom(); }
});

test('bound picks: two names bind independently', () => {
  // {a := X|Y} and {b := P|Q} each get their own slot; reuse both.
  c.seedSequence([0, 0, 0.6]); // top-level, X|Y→X, P|Q→Q
  try {
    const r = c.runGrammar('origin: {a := X|Y} {b := P|Q} {a} {b}', 'origin', {}, {});
    const parts = r.split(' ');
    assert.equal(parts[0], parts[2], 'a reused');
    assert.equal(parts[1], parts[3], 'b reused');
    assert.notEqual(parts[0], parts[1], 'a and b are independent');
  } finally { c.resetRandom(); }
});

test('bound picks: use-before-bind resolves via normal lookup ({name?} if unknown)', () => {
  // {a} before {a := x|y} — forward ref falls through to {a?}
  c.seedSequence([0, 0]);
  try {
    const r = c.runGrammar('origin: {a} {a := x|y}', 'origin', {}, {});
    const parts = r.split(' ');
    assert.equal(parts[0], '{a?}');   // unbound at that point
    assert.match(parts[1], /^[xy]$/); // bind happened, value emitted
  } finally { c.resetRandom(); }
});

test('bound picks: scope is per-expansion (binds do not leak across runGrammar calls)', () => {
  // First expansion binds 'a'; second expansion starts fresh.
  c.runGrammar('origin: {a := X}', 'origin', {}, {});
  const r = c.runGrammar('origin: {a}', 'origin', {}, {});
  assert.equal(r, '{a?}'); // 'a' is NOT carried over
});

test('bound picks: dice body — {n := 2d6} stores and reuses the roll', () => {
  c.seedSequence([0]); // all zeros → 2d6 = 2
  try {
    const r = c.runGrammar('origin: {n := 2d6} total {n}', 'origin', {}, {});
    assert.ok(r.startsWith('2 total 2'), `expected '2 total 2', got '${r}'`);
  } finally { c.resetRandom(); }
});

test('bound picks: math body — {n := = expr} stores and reuses the computed value', () => {
  const r = c.runGrammar('origin: {n := = 3*7} answer {n}', 'origin', {}, {});
  assert.equal(r, '21 answer 21');
});

test('bound picks: ternary body — first := splits correctly, ternary : inside body untouched', () => {
  // The ternary : is never confused with the := operator.
  const r = c.runGrammar('origin: {x := = 1>0 ? 42 : 0} {x}', 'origin', {}, {});
  assert.equal(r, '42 42');
});

test('bound picks: malformed bind (non-identifier name) falls through to normal handling', () => {
  // {a b := c} — name has a space, not a valid identifier → falls through to literal
  const r = c.runGrammar('origin: {a b := c}', 'origin', {}, {});
  assert.equal(r, 'a b := c'); // returned as literal (no handler matched)
});

test('grammar regression: existing {= expr} and {rule} still work after bind changes', () => {
  assert.equal(c.runGrammar('origin: {= 6*7}', 'origin', {}, {}), '42');
  assert.equal(c.runGrammar('color: red|red', 'color', {}, {}), 'red');
  assert.equal(c.runGrammar('origin: {missing}', 'origin', {}, {}), '{missing?}');
});

test('indexTopLevel: finds :=' + ' at depth 0', () => {
  assert.equal(c.indexTopLevel('a := b', ':='), 2);
  assert.equal(c.indexTopLevel('{a|b} := c', ':='), 6); // skips nested brace
  assert.equal(c.indexTopLevel('no op here', ':='), -1);
  assert.equal(c.indexTopLevel('a := {x := y}', ':='), 2); // first one wins
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

test('clampColW — rounds, clamps to bounds, rejects non-numbers', () => {
  assert.equal(c.clampColW(160), 160);
  assert.equal(c.clampColW(160.6), 161);          // rounds
  assert.equal(c.clampColW(10), 56);              // below min → MIN_COL_W
  assert.equal(c.clampColW(5000), 900);           // above max → MAX_COL_W
  assert.equal(c.clampColW(NaN), null);           // non-finite → null
  assert.equal(c.clampColW('abc'), null);
});

test('toOpml — base column widths serialize to _colw; absent when all auto', () => {
  const root = c.mkRoot();
  const base = c.mkNode('| a | b |\n| --- | --- |\n| 1 | 2 |');
  base.type = 'base';
  base.colW = [160, null];
  root.children.push(base);
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_colw='), 'a sized column should serialize _colw');
  assert.ok(/_colw="\[160,null\]"/.test(xml), 'widths array should round-trip as JSON');

  const plain = c.mkRoot();
  const n2 = c.mkNode('no widths'); n2.type = 'base'; n2.colW = [null, null];
  plain.children.push(n2);
  assert.ok(!c.toOpml(plain).includes('_colw='), 'all-auto widths should NOT serialize');
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

// Regression for the "✏ markdown" editor data-loss fix: a #+TBLFM: line appended on its
// own line under the grid (the text the block-aware commit now produces) must be extracted,
// computed, and survive a serialize round-trip — the downstream contract the DOM fix relies on.
const { extractTblfm, stripTblfm } = c;
test('table: appended #+TBLFM line extracts, computes, and round-trips', () => {
  const text =
    '| Qty | Price | Total |\n| --- | --- | --- |\n| 2 | 5 | |\n| 3 | 4 | |\n#+TBLFM: $3=$1*$2';
  const tblfm = extractTblfm(text);
  assert.equal(tblfm, '$3=$1*$2');                 // appended line is found, not dropped
  const model = c.parseTable(stripTblfm(text));      // grid parses without the formula line
  assert.equal(model.rows[0].join('|'), 'Qty|Price|Total');
  const computed = computeTable(model, tblfm);       // rows: [header, 2|5, 3|4] (separator dropped)
  assert.equal(computed[1][2], '10');                // 2*5
  assert.equal(computed[2][2], '12');                // 3*4
  const out = c.serializeTable({ aligns: model.aligns, rows: computed }) + '\n#+TBLFM: ' + tblfm;
  assert.equal(extractTblfm(out), '$3=$1*$2');       // formula still present after re-serialize
  assert.ok(out.includes('| 2 | 5 | 10 |'));
});

// ── static markdown tables: render anywhere (Bases PR 1) ───────────────────
// mdToHtml learns GFM pipe tables → a static read-only <table>. The pins lock the
// false-positive guard (the delimiter row), alignment, formula compute + #+TBLFM
// HIDING, and the edit-raw / render-pretty contract (recipe consumed from RENDER
// yet still present in the SOURCE text — mdToHtml never mutates node.text).
const { tableDelimCells, renderStaticTable, mdToHtml } = c;

test('tableDelimCells: valid delimiter rows return the cell count', () => {
  assert.equal(tableDelimCells('| --- | --- |'), 2);   // outer pipes
  assert.equal(tableDelimCells('--- | ---'), 2);        // outer pipes optional
  assert.equal(tableDelimCells('| :-- | :-: | --: |'), 3); // alignment colons
  assert.equal(tableDelimCells('|---|'), 1);
});

test('tableDelimCells: false-positive guard — non-delimiters return -1', () => {
  assert.equal(tableDelimCells('---'), -1);             // no pipe → stays a thematic break
  assert.equal(tableDelimCells('| a | b |'), -1);       // cells aren't dashes/colons
  assert.equal(tableDelimCells('just prose'), -1);
  assert.equal(tableDelimCells('| -- x -- |'), -1);     // junk inside a cell
  assert.equal(tableDelimCells(''), -1);
  assert.equal(tableDelimCells(null), -1);
});

test('mdToHtml: a pipe table with a matching delimiter renders a static <table>', () => {
  const html = mdToHtml('| a | b |\n| --- | --- |\n| 1 | 2 |');
  assert.ok(html.includes('class="md-table-static"'));         // reuses base CSS, distinct hook
  assert.ok(html.includes('<table class="md-table">'));
  assert.ok(html.includes('<th class="mt-cell mt-headcell">a</th>')); // header is <th>
  assert.ok(html.includes('<td class="mt-cell">1</td>'));             // body is <td>
});

test('mdToHtml: delimiter colons drive per-column text-align', () => {
  const html = mdToHtml('| L | C | R |\n| :-- | :-: | --: |\n| 1 | 2 | 3 |');
  assert.ok(html.includes('mt-a-center'));   // :-: → center
  assert.ok(html.includes('mt-a-right'));    // --: → right
  assert.ok(!html.includes('mt-a-left'));    // left is the default, no class emitted
});

test('mdToHtml: cell content renders inline markdown (not raw)', () => {
  const html = mdToHtml('| h |\n| --- |\n| **bold** |');
  assert.ok(html.includes('<strong>bold</strong>'));
});

test('mdToHtml: #+TBLFM computes the grid and is HIDDEN from the render, but stays in source', () => {
  const src =
    '| Qty | Price | Total |\n| --- | --- | --- |\n| 2 | 5 | |\n| 3 | 4 | |\n#+TBLFM: $3=$1*$2';
  const html = mdToHtml(src);
  assert.ok(html.includes('>10</td>'));    // 2*5 computed
  assert.ok(html.includes('>12</td>'));    // 3*4 computed
  assert.ok(html.includes('mt-computed')); // computed cells Σ-tagged read-only
  assert.ok(!html.includes('TBLFM'));      // recipe line consumed from the RENDER
  assert.ok(src.includes('#+TBLFM: $3=$1*$2')); // …yet untouched in the SOURCE (edit-raw model)
});

test('mdToHtml: false-positive guards — prose with pipes / a thematic break do NOT become tables', () => {
  assert.ok(!mdToHtml('a | b\nc | d').includes('<table'));      // no delimiter row
  const hr = mdToHtml('Summary\n---');
  assert.ok(hr.includes('<hr'));                                 // `---` stays a thematic break
  assert.ok(!hr.includes('<table'));
});

test('mdToHtml: list markers win over table detection (GFM precedence)', () => {
  const html = mdToHtml('- a | b\n- c | d');
  assert.ok(html.includes('<ul'));
  assert.ok(!html.includes('<table'));
});

test('mdToHtml: a table renders mid-point (not just on line 1)', () => {
  const html = mdToHtml('Intro paragraph\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\nOutro');
  assert.ok(html.includes('Intro paragraph'));
  assert.ok(html.includes('<table class="md-table">'));
  assert.ok(html.includes('Outro'));
});

test('renderStaticTable: marks formula cells read-only (Σ) and computes their value', () => {
  const html = renderStaticTable('| A | B |\n| --- | --- |\n| 2 | |\n#+TBLFM: $2=$1*10');
  assert.ok(html.includes('<td class="mt-cell mt-computed">20</td>'));
});

// ── Bases PR 2a: starter grid · non-destructive convert · OPML base type ───
const { starterTableText, planBaseConvert } = c;

test('starterTableText: N×M emits valid pipe-table markdown (header + delimiter + body)', () => {
  const md = starterTableText(3, 4);          // 3 total rows (1 header + 2 body) × 4 cols
  const lines = md.split('\n');
  assert.equal(lines.length, 4);              // header + delimiter + 2 body rows
  assert.equal(tableDelimCells(lines[1]), 4); // delimiter row has 4 cells
  const model = c.parseTable(md);
  assert.equal(model.aligns.length, 4);       // 4 columns
  assert.equal(model.rows.length, 3);         // header + 2 body (delimiter dropped by parseTable)
  assert.equal(model.rows[0].join('|'), 'Column 1|Column 2|Column 3|Column 4');
});

test('starterTableText: the @table starter renders via PR 1 static path', () => {
  const html = mdToHtml(starterTableText(2, 2));
  assert.ok(html.includes('<table class="md-table">'));
  assert.ok(html.includes('class="md-table-static"'));
});

test('starterTableText: clamps to sane bounds (min header, max 8×8)', () => {
  assert.equal(starterTableText(1, 1).split('\n').length, 2); // header + delimiter, no body
  const big = c.parseTable(starterTableText(99, 99));
  assert.equal(big.aligns.length, 8);          // cols clamped to 8
  assert.equal(big.rows.length, 8);            // 8 total rows (header + 7 body)
});

test('planBaseConvert: empty point converts IN PLACE (no data loss path needed)', () => {
  const plan = planBaseConvert('   ', 'STARTER');
  assert.equal(plan.mode, 'in-place');
  assert.equal(plan.text, 'STARTER');
});

test('planBaseConvert: content-bearing point keeps text, base inserted AFTER (the data-loss fix)', () => {
  const plan = planBaseConvert('My notes', 'STARTER');
  assert.equal(plan.mode, 'after');
  assert.equal(plan.insert, 'STARTER');
  assert.equal(plan.text, undefined);          // original text is NOT overwritten
});

// ── PR 3 promote: planTablePromote splits a point around its static table ──────
const PROMOTE_TEXT = 'Intro prose\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n#+TBLFM: $2=$1*2\n\nTrailing prose';

test('findFirstTableRange: locates the table block (matches planTablePromote input)', () => {
  const r = c.findFirstTableRange(PROMOTE_TEXT);
  assert.deepEqual(host(r), { l0: 2, l1: 6 });             // same range the menu door feeds promote
  const plan = c.planTablePromote(PROMOTE_TEXT, r.l0, r.l1);
  assert.equal(plan.table, '| A | B |\n| --- | --- |\n| 1 | 2 |\n#+TBLFM: $2=$1*2');
});

test('findFirstTableRange: null when the point holds no table (menu item is hidden)', () => {
  assert.equal(c.findFirstTableRange('just prose\nmore prose'), null);
  assert.equal(c.findFirstTableRange('- a list item\n- another'), null);  // list markers win
  assert.equal(c.findFirstTableRange(''), null);
});

test('planTablePromote: table-in-the-middle → before / table (incl. TBLFM) / after, blank lines trimmed', () => {
  const plan = c.planTablePromote(PROMOTE_TEXT, 2, 6);   // lines 2..5 = grid + recipe
  assert.equal(plan.before, 'Intro prose');              // trailing blank line trimmed
  assert.equal(plan.table, '| A | B |\n| --- | --- |\n| 1 | 2 |\n#+TBLFM: $2=$1*2');
  assert.equal(plan.after, 'Trailing prose');            // leading blank line trimmed
});

test('planTablePromote: table-at-the-end → before / table, empty after', () => {
  const text = 'Notes\n| A |\n| --- |\n| 1 |';
  const plan = c.planTablePromote(text, 1, 4);
  assert.equal(plan.before, 'Notes');
  assert.equal(plan.after, '');
});

test('planTablePromote: point that IS the table → empty before and after', () => {
  const text = '| A |\n| --- |\n| 1 |';
  const plan = c.planTablePromote(text, 0, 3);
  assert.equal(plan.before, '');
  assert.equal(plan.table, text);
  assert.equal(plan.after, '');
});

test('planTablePromote: invalid range or non-table block → null (caller bails, no corruption)', () => {
  assert.equal(c.planTablePromote(PROMOTE_TEXT, 0, 2), null);   // prose lines, not a table
  assert.equal(c.planTablePromote(PROMOTE_TEXT, 2, 99), null);  // range past the end
  assert.equal(c.planTablePromote(PROMOTE_TEXT, 6, 2), null);   // inverted range
  assert.equal(c.planTablePromote('', 0, 1), null);             // empty text
});

// ── table-aware paste: a pasted markdown table lands as ONE point ─────────────
const { splitPastedPoints, tableBlockEnd } = c;

test('splitPastedPoints: a pure table paste → ONE point (grid + trailing #+TBLFM intact)', () => {
  const text = '| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n#+TBLFM: $2=$1*2';
  assert.deepEqual(host(splitPastedPoints(text)), [text]); // single grouped entry, recipe line included
});

test('splitPastedPoints: a base "Copy as markdown" block → one static-table point', () => {
  const text = '| Name | Qty |\n| --- | --- |\n| Apple | 3 |';
  assert.deepEqual(host(splitPastedPoints(text)), [text]);
});

test('splitPastedPoints: prose + table + prose → prose split into points, table grouped as one', () => {
  const text = 'Intro line\nSecond line\n| A | B |\n| --- | --- |\n| 1 | 2 |\nAfter line';
  assert.deepEqual(host(splitPastedPoints(text)), [
    'Intro line',
    'Second line',
    '| A | B |\n| --- | --- |\n| 1 | 2 |',
    'After line',
  ]);
});

test('splitPastedPoints: two blank-separated tables → two grouped entries (blank is not a point)', () => {
  const t1 = '| A |\n| --- |\n| 1 |';
  const t2 = '| X | Y |\n| --- | --- |\n| 9 | 8 |';
  assert.deepEqual(host(splitPastedPoints(t1 + '\n\n' + t2)), [t1, t2]); // blank line ends the first block
});

test('splitPastedPoints: plain multi-line non-table text → one entry per line (unchanged)', () => {
  assert.deepEqual(host(splitPastedPoints('alpha\nbeta\ngamma')), ['alpha', 'beta', 'gamma']);
});

test('splitPastedPoints: prose-with-pipes is NOT a table (GFM-strict, no delimiter row)', () => {
  const text = 'a | b | c\nd | e | f'; // looks tabular but the 2nd line is not a :?-+:? delimiter
  assert.deepEqual(host(splitPastedPoints(text)), ['a | b | c', 'd | e | f']);
});

test('tableBlockEnd: returns the block end (with #+TBLFM); -1 when no table starts at i', () => {
  const lines = 'pre\n| A |\n| --- |\n| 1 |\n#+TBLFM: $1=1\npost'.split('\n');
  assert.equal(tableBlockEnd(lines, 0), -1); // "pre" is not a table start
  assert.equal(tableBlockEnd(lines, 1), 5);  // header(1)+delim(2)+row(3)+TBLFM(4) → end 5
  assert.equal(tableBlockEnd(lines, 5), -1); // "post" is not a table start
});

test('OPML: a base node serializes with _type="base"', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode(starterTableText(2, 2), 'base'));
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_type="base"'));     // rename reaches the storage format
  assert.ok(!/_type="table"/.test(xml));       // no stray legacy type
});

// ── column aggregate formula builder (UXP-3) ──────────────────────────────
const { mtBuildAggFormula, mtHasFooter, mtColAggKind, aggKindLabel } = c;

test('mtBuildAggFormula: add sum for column 2', () => {
  assert.equal(mtBuildAggFormula('', 2, 'sum'), '@>$2=vsum(@2$2..@-1$2)');
});

test('mtBuildAggFormula: avg maps to vmean', () => {
  assert.equal(mtBuildAggFormula('', 3, 'avg'), '@>$3=vmean(@2$3..@-1$3)');
});

test('mtBuildAggFormula: count / min / max map correctly', () => {
  assert.equal(mtBuildAggFormula('', 1, 'count'), '@>$1=vcount(@2$1..@-1$1)');
  assert.equal(mtBuildAggFormula('', 1, 'min'),   '@>$1=vmin(@2$1..@-1$1)');
  assert.equal(mtBuildAggFormula('', 1, 'max'),   '@>$1=vmax(@2$1..@-1$1)');
});

test('mtBuildAggFormula: replaces existing formula for the same column', () => {
  assert.equal(
    mtBuildAggFormula('@>$2=vsum(@2$2..@-1$2)', 2, 'avg'),
    '@>$2=vmean(@2$2..@-1$2)',
  );
});

test('mtBuildAggFormula: fn=none removes the formula', () => {
  assert.equal(mtBuildAggFormula('@>$2=vsum(@2$2..@-1$2)', 2, 'none'), '');
});

test('mtBuildAggFormula: preserves unrelated column formulas', () => {
  const existing = '@>$1=vsum(@2$1..@-1$1) :: @>$3=vmax(@2$3..@-1$3)';
  const result = mtBuildAggFormula(existing, 2, 'count');
  assert.ok(result.includes('@>$1=vsum(@2$1..@-1$1)'));
  assert.ok(result.includes('@>$3=vmax(@2$3..@-1$3)'));
  assert.ok(result.includes('@>$2=vcount(@2$2..@-1$2)'));
});

test('mtHasFooter: false when empty or null', () => {
  assert.equal(mtHasFooter(''), false);
  assert.equal(mtHasFooter(null), false);
});

test('mtHasFooter: true when @>$N= formula present', () => {
  assert.equal(mtHasFooter('@>$2=vsum(@2$2..@-1$2)'), true);
});

test('mtHasFooter: false for non-footer formulas', () => {
  assert.equal(mtHasFooter('$3=$1*$2'), false);
  assert.equal(mtHasFooter('@2$3=@2$1*@2$2'), false);
});

test('mtColAggKind: returns correct fn for each kind', () => {
  assert.equal(mtColAggKind('@>$2=vsum(@2$2..@-1$2)',   2), 'sum');
  assert.equal(mtColAggKind('@>$2=vmean(@2$2..@-1$2)',  2), 'avg');
  assert.equal(mtColAggKind('@>$2=vcount(@2$2..@-1$2)', 2), 'count');
  assert.equal(mtColAggKind('@>$2=vmin(@2$2..@-1$2)',   2), 'min');
  assert.equal(mtColAggKind('@>$2=vmax(@2$2..@-1$2)',   2), 'max');
});

test('mtColAggKind: returns none for unrelated column', () => {
  assert.equal(mtColAggKind('@>$1=vsum(@2$1..@-1$1)', 2), 'none');
  assert.equal(mtColAggKind('', 1), 'none');
});

test('aggKindLabel: maps each aggregate kind to its footer label', () => {
  assert.equal(aggKindLabel('sum'),   'Sum');
  assert.equal(aggKindLabel('avg'),   'Average');
  assert.equal(aggKindLabel('count'), 'Count');
  assert.equal(aggKindLabel('min'),   'Min');
  assert.equal(aggKindLabel('max'),   'Max');
  assert.equal(aggKindLabel('none'),  '');     // no aggregate → no label
  assert.equal(aggKindLabel(undefined), '');   // defensive
  // composes with mtColAggKind to label a column's footer cell straight from the TBLFM
  assert.equal(aggKindLabel(mtColAggKind('@>$2=vmean(@2$2..@-1$2)', 2)), 'Average');
});

// mtApplyAggregate is DOM-adjacent but its DOM calls no-op through vm stubs,
// so the node.text mutation is fully testable. We verify the stale-value fix:
// setting a column to None must blank its total cell, not leave a stale literal.
const { mtApplyAggregate } = c;
// Helper: minimal node object matching what mtApplyAggregate expects.
function makeTblNode(text) {
  return { id: 'n1', text, dice:[], markov:[], rolltable:[], math:[], vars:[], grammar:[] };
}
// Table with two summed columns; footer row has computed values 8 and 10.
const TWO_SUM_TEXT =
  '| A | B |\n| --- | --- |\n| 3 | 4 |\n| 5 | 6 |\n| 8 | 10 |\n' +
  '#+TBLFM: @>$1=vsum(@2$1..@-1$1) :: @>$2=vsum(@2$2..@-1$2)';

test('mtApplyAggregate: None blanks total cell, footer row stays while other aggregate remains', () => {
  const node = makeTblNode(TWO_SUM_TEXT);
  mtApplyAggregate(node, 0, 'none');          // clear col A (0-based index 0 = col1 1)
  const tblfm = c.extractTblfm(node.text);
  const model = c.parseTable(c.stripTblfm(node.text));
  const last  = model.rows[model.rows.length - 1];
  assert.equal(last[0], '');                  // col A blanked — no stale '8'
  assert.equal(last[1], '10');                // col B still computed
  assert.equal(mtHasFooter(tblfm), true);     // footer row still present
  assert.equal(mtColAggKind(tblfm, 1), 'none');
  assert.equal(mtColAggKind(tblfm, 2), 'sum');
});

test('mtApplyAggregate: None on both columns removes the footer row entirely', () => {
  const node = makeTblNode(TWO_SUM_TEXT);
  mtApplyAggregate(node, 0, 'none');
  mtApplyAggregate(node, 1, 'none');
  const tblfm = c.extractTblfm(node.text);
  assert.equal(mtHasFooter(tblfm), false);    // no formulas left → row gone
  const model = c.parseTable(c.stripTblfm(node.text));
  assert.equal(model.rows.length, 3);         // header + 2 data rows only
});

// ── Bases PR 2b: portable copy serializers (frozen markdown vs live recipe) ────
const { baseFrozenMarkdown, baseRecipeMarkdown } = c;
// A base with a column formula computing Total = A*B; the target cells are stored
// blank so the two flavors are clearly distinguishable.
const BASE_COPY_TEXT =
  '| A | B | Total |\n| --- | --- | --- |\n| 2 | 5 |  |\n| 3 | 4 |  |\n#+TBLFM: $3=$1*$2';

test('base copy "as markdown": bakes computed values in, drops the #+TBLFM line', () => {
  const out = baseFrozenMarkdown(BASE_COPY_TEXT);
  assert.match(out, /\| 2 \| 5 \| 10 \|/);    // 2*5 computed into the cell
  assert.match(out, /\| 3 \| 4 \| 12 \|/);    // 3*4 computed into the cell
  assert.ok(!/#\+TBLFM/i.test(out));          // frozen snapshot — recipe removed
});

test('base copy "with TBLFM": keeps raw literals plus the #+TBLFM recipe', () => {
  const out = baseRecipeMarkdown(BASE_COPY_TEXT);
  assert.match(out, /#\+TBLFM: \$3=\$1\*\$2/); // the live recipe is preserved
  assert.ok(!/\b10\b/.test(out));              // target cells stay raw (uncomputed)
  assert.ok(!/\b12\b/.test(out));
});

// ── TODO states + priorities (Org-style headline keyword + [#A] priority) ──────
const { parseTodo, formatTodo, todoIsDone, cycleTodoKeyword, cyclePriority,
        cycleTodoState, cycleTodoPriority, todoSortKey, compareTodo,
        setTodoState, setTodoPriority } = c;

test('todo: parseTodo keyword + priority + body', () => {
  assert.deepEqual(host(parseTodo('#TODO [#A] Buy milk')), { keyword: 'TODO', priority: 'A', body: 'Buy milk' });
  assert.deepEqual(host(parseTodo('#NEXT Ship it')),       { keyword: 'NEXT', priority: null, body: 'Ship it' });
  assert.deepEqual(host(parseTodo('#DONE')),               { keyword: 'DONE', priority: null, body: '' });
  // bare DONE/TODO (no #) is plain text, never a keyword
  assert.deepEqual(host(parseTodo('TODO plain')), { keyword: '', priority: null, body: 'TODO plain' });
  assert.deepEqual(host(parseTodo('DONE shipped')), { keyword: '', priority: null, body: 'DONE shipped' });
});

test('todo: no keyword → empty keyword, whole text as body', () => {
  assert.deepEqual(host(parseTodo('Buy milk')), { keyword: '', priority: null, body: 'Buy milk' });
  assert.deepEqual(host(parseTodo('TODOlist cleanup')), { keyword: '', priority: null, body: 'TODOlist cleanup' });
});

test('todo: tolerant of extra whitespace + lowercase priority', () => {
  assert.deepEqual(host(parseTodo('#TODO   [#b]   tidy')), { keyword: 'TODO', priority: 'B', body: 'tidy' });
});

test('todo: formatTodo inverts parseTodo (normalized)', () => {
  const round = (s) => formatTodo(parseTodo(s));
  assert.equal(round('#TODO [#A] Buy milk'), '#TODO [#A] Buy milk');
  assert.equal(round('#TODO   [#b]   tidy'), '#TODO [#B] tidy');
  assert.equal(round('#DONE'), '#DONE');
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
  assert.equal(cycleTodoState('#TODO [#A] Buy milk'), '#NEXT [#A] Buy milk');
  assert.equal(cycleTodoState('plain task'), '#TODO plain task');
  assert.equal(cycleTodoState('#DONE [#B] wrap up'), 'wrap up');   // clearing drops keyword + priority
});

test('todo: cycleTodoPriority no-op without a keyword', () => {
  assert.equal(cycleTodoPriority('just a note'), 'just a note');
  assert.equal(cycleTodoPriority('#TODO write tests'), '#TODO [#A] write tests');
  assert.equal(cycleTodoPriority('#TODO [#C] write tests'), '#TODO write tests');
});

test('todo: setTodoState direct jump to any state (picker), clamps garbage', () => {
  assert.equal(setTodoState('#TODO [#A] task', 'WAITING'), '#WAITING [#A] task');
  assert.equal(setTodoState('plain task', 'DONE'), '#DONE plain task');
  assert.equal(setTodoState('#TODO [#B] task', ''), 'task');
  assert.equal(setTodoState('#TODO x', 'BOGUS'), 'x');
});

test('todo: setTodoPriority direct jump, no-op without keyword, clamps garbage', () => {
  assert.equal(setTodoPriority('#TODO task', 'C'), '#TODO [#C] task');
  assert.equal(setTodoPriority('#TODO [#A] task', null), '#TODO task');
  assert.equal(setTodoPriority('plain task', 'A'), 'plain task');
  assert.equal(setTodoPriority('#TODO task', 'Z'), '#TODO task');
});

test('todo: todoSortKey + compareTodo (not-done before done, A<B<C<none)', () => {
  assert.deepEqual(host(todoSortKey('#TODO [#A] x')), [0, 0, 0]);
  assert.deepEqual(host(todoSortKey('#DONE x')),      [1, 3, 3]);
  assert.deepEqual(host(todoSortKey('plain')),        [0, 3, 4]);
  const items = ['#DONE done it', '#TODO [#C] low', '#NEXT [#A] hot', 'plain note'];
  assert.deepEqual(items.slice().sort(compareTodo),
    ['#NEXT [#A] hot', '#TODO [#C] low', 'plain note', '#DONE done it']);
});

// ── markdown-first to-dos: type/checked DERIVE from the text ───────────────────
// (only `paragraph` and `base` are special node types; a to-do is its markdown)

test('todo derive: deriveTypeFromText knows both to-do forms (and stays strict)', () => {
  assert.equal(c.deriveTypeFromText('- [ ] buy milk'), 'todo');    // task form
  assert.equal(c.deriveTypeFromText('- [x] done it'),  'todo');
  assert.equal(c.deriveTypeFromText('- [ ] '),         'todo');    // Enter-continuation stub
  assert.equal(c.deriveTypeFromText('#TODO write'),    'todo');    // #keyword form
  assert.equal(c.deriveTypeFromText('#WAITING [#A] x'), 'todo');
  assert.equal(c.deriveTypeFromText('TODO write'),     null);      // bare TODO is NOT a keyword
  assert.equal(c.deriveTypeFromText('WAITING [#A] x'), null);     // bare WAITING is NOT a keyword
  assert.equal(c.deriveTypeFromText('- plain item'),   null);      // plain list ≠ todo
  assert.equal(c.deriveTypeFromText('TODOx not a kw'), null);      // keyword needs a boundary
  assert.equal(c.deriveTypeFromText('# heading'),      'h1');      // existing derivations intact
  assert.equal(c.deriveTypeFromText('> quote'),        'quote');
});

test('todo derive: todoDoneFromText — keyword wins; task form completes as a whole', () => {
  assert.equal(c.todoDoneFromText('#DONE shipped'), true);
  assert.equal(c.todoDoneFromText('#TODO open'),    false);
  assert.equal(c.todoDoneFromText('- [x] single'), true);
  assert.equal(c.todoDoneFromText('- [ ] single'), false);
  assert.equal(c.todoDoneFromText('- [x] a\n- [ ] b'), false); // checklist not complete
  assert.equal(c.todoDoneFromText('- [x] a\n- [x] b'), true);  // all checked → done
  assert.equal(c.todoDoneFromText('plain text'),   false);
  assert.equal(c.todoDoneFromText('DONE shipped'),  false);     // bare DONE is plain text
  assert.equal(c.todoDoneFromText('#DONE - [ ] composed'), true); // #keyword wins over markers
});

test('todo: continuationPrefix — Enter continues the format by writing markdown', () => {
  assert.equal(c.continuationPrefix('- [ ] buy milk'), '- [ ] ');
  assert.equal(c.continuationPrefix('- [x] done it'),  '- [ ] '); // new task starts unchecked
  assert.equal(c.continuationPrefix('#TODO write'),    '#TODO '); // same #keyword continues
  assert.equal(c.continuationPrefix('#WAITING [#A] x'), '#WAITING ');
  assert.equal(c.continuationPrefix('#DONE shipped'),  '#TODO '); // #DONE restarts as #TODO
  assert.equal(c.continuationPrefix('TODO write'),     '');       // bare TODO is plain text
  assert.equal(c.continuationPrefix('> a quote'),      '> ');     // quotes continue too
  assert.equal(c.continuationPrefix('plain text'),     '');       // no aid outside a format
  assert.equal(c.continuationPrefix('# heading'),      '');       // headings don't continue
});

test('todo render: `- [ ]` text renders exactly ONE checkbox via mdToHtml (no rail twin)', () => {
  const open = c.mdToHtml('- [ ] buy milk');
  assert.equal((open.match(/md-task-check/g) || []).length, 1);
  assert.ok(!open.includes('checked'));
  const done = c.mdToHtml('- [x] done it');
  assert.equal((done.match(/md-task-check/g) || []).length, 1);
  assert.ok(done.includes('checked'));
});

test('todo: migrateTodoText — legacy type-only todos get the marker written in', () => {
  assert.equal(c.migrateTodoText('buy milk', false), '- [ ] buy milk');
  assert.equal(c.migrateTodoText('done it', true),   '- [x] done it');
  assert.equal(c.migrateTodoText('- [ ] already', false), '- [ ] already');   // self-consistent → untouched
  assert.equal(c.migrateTodoText('#TODO already', true),  '#TODO already');   // #keyword form → untouched
});

test('todo: textForDisplay strips the task marker and keyword for breadcrumb/search', () => {
  assert.equal(c.textForDisplay({ type: 'todo', text: '- [ ] buy milk' }), 'buy milk');
  assert.equal(c.textForDisplay({ type: 'todo', text: '#WAITING [#A] call' }), 'call');
  assert.equal(c.textForDisplay({ type: 'todo', text: '- [x] TODO composed' }), 'TODO composed'); // bare TODO is body text
  assert.equal(c.textForDisplay({ type: 'h1', text: '# Title' }), 'Title'); // block prefixes intact
  assert.equal(c.textForDisplay({ type: 'ul', text: 'plain' }), 'plain');
});

test('todo OPML: derived type+checked round-trip through _type/_checked attributes', () => {
  const root = c.mkRoot();
  const n = c.mkNode('- [x] shipped', 'todo');
  n.checked = c.todoDoneFromText(n.text);
  root.children.push(n);
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_type="todo"'));
  assert.ok(xml.includes('_checked="true"'));
  assert.ok(xml.includes('- [x] shipped')); // the markdown is the stored source of truth
});

// ── collectCallables / filterBraceCandidates ({ autocomplete data, UXP-9) ───

// One var, one grammar rule, one named table, one named chain.
const mkCallablesRoot = () => {
  const root = c.mkRoot();
  const varNode = c.mkNode('[[var:v1]]');
  varNode.vars = [{ key: 'v1', name: 'strength', expr: '18' }];
  root.children.push(varNode);
  const gramNode = c.mkNode('[[grammar:g1]]');
  gramNode.grammar = [{ key: 'g1', def: 'color: red | blue', origin: 'color', result: 'red' }];
  root.children.push(gramNode);
  const rtNode = c.mkNode('[[rolltable:rt1]]');
  rtNode.rolltable = [{ key: 'rt1', name: 'loot', def: '1 gold\n2 silver' }];
  root.children.push(rtNode);
  const chainNode = c.mkNode('[[markov:mk1]]');
  chainNode.markov = [{ key: 'mk1', name: 'weather', def: 'sunny -> cloudy\ncloudy -> rainy', start: 'sunny', steps: 3 }];
  root.children.push(chainNode);
  return root;
};

test('callables: four groups present, each with expected name', () => {
  const all = host(c.collectCallables(mkCallablesRoot()));
  assert.ok(all.some(x => x.group === 'var'   && x.name === 'strength'), 'var: strength');
  assert.ok(all.some(x => x.group === 'rule'  && x.name === 'color'),    'rule: color');
  assert.ok(all.some(x => x.group === 'table' && x.name === 'loot'),     'table: loot');
  assert.ok(all.some(x => x.group === 'chain' && x.name === 'weather'),  'chain: weather');
});

test('callables: var entry carries the resolved numeric value', () => {
  const v = host(c.collectCallables(mkCallablesRoot())).find(x => x.group === 'var');
  assert.equal(v.name, 'strength');
  assert.equal(v.val, 18);
});

test('callables: group order is vars, rules, tables, chains', () => {
  const groups = [...new Set(host(c.collectCallables(mkCallablesRoot())).map(x => x.group))];
  assert.deepEqual(groups, ['var', 'rule', 'table', 'chain']);
});

test('callables: a record without its token in node.text is excluded (pruned-data rule)', () => {
  const root = c.mkRoot();
  const n = c.mkNode('no token here');
  n.rolltable = [{ key: 'rt9', name: 'ghost', def: '1 boo' }];
  root.children.push(n);
  assert.ok(!host(c.collectCallables(root)).some(x => x.name === 'ghost'));
});

test('callables: empty root yields an empty list', () => {
  assert.equal(host(c.collectCallables(c.mkRoot())).length, 0);
});

test('filterBraceCandidates: empty prefix returns the full list', () => {
  const all = host(c.collectCallables(mkCallablesRoot()));
  assert.equal(host(c.filterBraceCandidates(all, '')).length, all.length);
});

test('filterBraceCandidates: prefix narrows, anchored + case-insensitive', () => {
  const all = host(c.collectCallables(mkCallablesRoot()));
  const r = host(c.filterBraceCandidates(all, 'STR'));
  assert.equal(r.length, 1);
  assert.equal(r[0].name, 'strength');
  // anchored: 'oot' is a substring of 'loot' but not a prefix
  assert.equal(host(c.filterBraceCandidates(all, 'oot')).length, 0);
});

test('filterBraceCandidates: narrowing is monotone as the prefix grows', () => {
  const all = host(c.collectCallables(mkCallablesRoot()));
  const c1 = host(c.filterBraceCandidates(all, 'w')).length;
  const c2 = host(c.filterBraceCandidates(all, 'we')).length;
  const c3 = host(c.filterBraceCandidates(all, 'weather')).length;
  assert.ok(c1 >= c2 && c2 >= c3 && c3 === 1);
  assert.equal(host(c.filterBraceCandidates(all, 'zzz')).length, 0);
});

// ── edit-mode caret anchors + grammar-span bounding (atomic-pill caret) ──
// anchorEditInlines turns the post-inline sentinel (U+0000, emitted after each ATOMIC
// pill span — and ONLY pills, never editable .gr-src spans: an anchor there made
// picker-applied {name} references undeletable, see UXP-28) into a ZWSP caret anchor
// ONLY when no text node follows (next char is another element or end-of-string);
// otherwise it drops the sentinel. The anchor gives the caret a text node to render
// in after a trailing atomic pill. ZWSP = U+200B (stripped by all caret math).
const ZWSP = '​';
const SENT = ' ';

test('anchorEditInlines: trailing sentinel (end of string) -> ZWSP anchor', () => {
  assert.equal(c.anchorEditInlines('<span>x</span>' + SENT), '<span>x</span>' + ZWSP);
});

test('anchorEditInlines: sentinel before another element -> ZWSP anchor (caret between two pills)', () => {
  assert.equal(c.anchorEditInlines('<span>a</span>' + SENT + '<span>b</span>' + SENT),
                                   '<span>a</span>' + ZWSP + '<span>b</span>' + ZWSP);
});

test('anchorEditInlines: sentinel before a text node -> dropped (no dead arrow-stop mid-text)', () => {
  assert.equal(c.anchorEditInlines('<span>x</span>' + SENT + ' beta'), '<span>x</span> beta');
  // escaped text (entity) also counts as following text -> sentinel dropped
  assert.equal(c.anchorEditInlines('<span>x</span>' + SENT + '&lt;tag'), '<span>x</span>&lt;tag');
});

test('anchorEditInlines: no sentinels -> unchanged', () => {
  assert.equal(c.anchorEditInlines('plain <b>text</b>'), 'plain <b>text</b>');
});

test('highlightGrammarText: a promotable {…} is bounded at }, with NO sentinel/anchor', () => {
  // {a|b} promotes (alternation) without needing document vars; the span ends at }
  // and is followed by NOTHING extra — no U+0000 sentinel, no ZWSP anchor. The #45
  // gr-src anchor is reverted (it made picker-applied refs undeletable, UXP-28);
  // anchors are for atomic pills only (emitted by editModeHTML, not here).
  const out = c.highlightGrammarText('{a|b} hello');
  assert.equal(out, '<span class="gr-src">{a|b}</span> hello');
  assert.ok(!out.includes(SENT), 'no U+0000 sentinel after a gr-src span');
  assert.ok(!out.includes(ZWSP), 'no ZWSP anchor after a gr-src span');
  // trailing-span form: still no sentinel/anchor even at end-of-string
  const tail = c.highlightGrammarText('say {a|b}');
  assert.equal(tail, 'say <span class="gr-src">{a|b}</span>');
});

test('highlightGrammarText: a non-promotable {…} stays literal (no span, no bleed)', () => {
  // {nope} matches no rule/var and isn't dice/expr/alternation -> literal text
  const out = c.highlightGrammarText('{nope} tail').split(SENT).join('').split(ZWSP).join('');
  assert.ok(!out.includes('gr-src'), 'no gr-src span for an unrecognized body');
});

// ── grSrcSpanClean (UXP-28 normalization predicate) ──
// A live .gr-src span is clean iff its text is exactly one balanced {…} — the only
// shape highlightGrammarText ever emits. Dirty = the browser merged typed/pasted
// chars into the span past }, or the closing } was deleted; normalizeGrSrcSpans
// then re-renders from node.text so the tail re-binds as plain prose.

test('grSrcSpanClean: exactly one balanced brace is clean (incl. nesting)', () => {
  assert.equal(c.grSrcSpanClean('{asas}'), true);
  assert.equal(c.grSrcSpanClean('{a|b 2|c}'), true);
  assert.equal(c.grSrcSpanClean('{= 2*r}'), true);
  assert.equal(c.grSrcSpanClean('{a {b} c}'), true);   // nested braces balance at the end
});

test('grSrcSpanClean: merged tail after } is dirty (the UXP-28 bleed shape)', () => {
  assert.equal(c.grSrcSpanClean('{asas} x'), false);   // typed text joined the span
  assert.equal(c.grSrcSpanClean('{asas}{x}'), false);  // a second brace joined the span
});

test('grSrcSpanClean: broken or misplaced brace is dirty', () => {
  assert.equal(c.grSrcSpanClean('{asas'), false);      // closing } deleted
  assert.equal(c.grSrcSpanClean('x{asas}'), false);    // text before the brace
  assert.equal(c.grSrcSpanClean(''), false);
  assert.equal(c.grSrcSpanClean('plain'), false);
});

// ── Sequences: user-definable state sets (declare via @, apply via /) ────────
// A sequence is { name, states[], doneFrom }: states left of the | are active,
// right of it are done. The built-in TODO/NEXT/WAITING/DONE is the DEFAULT
// sequence; done-ness generalizes from keyword===DONE to "right of the |".

const FLOW = { key: 'q1', name: 'Flow', states: ['BACKLOG', 'DOING', 'SHIPPED'], doneFrom: 2 };
const DEFAULT_SEQ = { key: 'default', name: 'To-do', states: ['TODO', 'NEXT', 'WAITING', 'DONE'], doneFrom: 3 };

test('parseSequence: pipe splits active from done; states uppercased', () => {
  assert.deepEqual(host(c.parseSequence('TODO NEXT WAITING | DONE CANCELLED')),
    { states: ['TODO', 'NEXT', 'WAITING', 'DONE', 'CANCELLED'], doneFrom: 3 });
  assert.deepEqual(host(c.parseSequence('backlog doing | shipped')),
    { states: ['BACKLOG', 'DOING', 'SHIPPED'], doneFrom: 2 });
});

test('parseSequence: invalid forms return null (callers branch on null)', () => {
  assert.equal(c.parseSequence('TODO DONE'), null);          // no pipe
  assert.equal(c.parseSequence('A | B | C'), null);          // two pipes
  assert.equal(c.parseSequence(' | DONE'), null);            // empty active side
  assert.equal(c.parseSequence('TODO | '), null);            // empty done side
  assert.equal(c.parseSequence('TO DO! | DONE'), null);      // bad token
  assert.equal(c.parseSequence('A B | A'), null);            // duplicate state
  assert.equal(c.parseSequence(''), null);
});

test('sequenceForKeyword: first-match across default + declared; default wins collisions', () => {
  const seqs = [DEFAULT_SEQ, FLOW, { key: 'q2', name: 'Clash', states: ['DONE', 'DOING2'], doneFrom: 1 }];
  assert.equal(c.sequenceForKeyword('DOING', seqs).name, 'Flow');
  assert.equal(c.sequenceForKeyword('DONE', seqs).name, 'To-do');  // default first
  assert.equal(c.sequenceForKeyword('NOPE', seqs), null);
  assert.equal(c.sequenceForKeyword('', seqs), null);
});

test('keywordIsDone: done = at-or-right-of the | split, in ANY sequence', () => {
  const seqs = [DEFAULT_SEQ, FLOW];
  assert.equal(c.keywordIsDone('SHIPPED', seqs), true);
  assert.equal(c.keywordIsDone('DOING', seqs), false);
  assert.equal(c.keywordIsDone('BACKLOG', seqs), false);
  assert.equal(c.keywordIsDone('DONE', seqs), true);          // default still works
  assert.equal(c.keywordIsDone('TODO', seqs), false);
  assert.equal(c.keywordIsDone('NOPE', seqs), false);         // non-state is never done
});

test('collectSequences: token-gated walk over node.seq, document order', () => {
  const root = c.mkRoot();
  const a = c.mkNode('[[seq:q1]]');
  a.seq = [FLOW];
  const b = c.mkNode('no token here');                        // record without token → dropped
  b.seq = [{ key: 'q9', name: 'Ghost', states: ['X', 'Y'], doneFrom: 1 }];
  root.children.push(a, b);
  const got = host(c.collectSequences(root));
  assert.equal(got.length, 1);
  assert.equal(got[0].name, 'Flow');
});

test('parseTodo: custom states recognized via an explicit states set', () => {
  const states = new Set(['TODO', 'NEXT', 'WAITING', 'DONE', 'BACKLOG', 'DOING', 'SHIPPED']);
  assert.deepEqual(host(c.parseTodo('#DOING [#A] ship it', states)),
    { keyword: 'DOING', priority: 'A', body: 'ship it' });
  // bare DOING (no #) is not a keyword even when it's in the states set
  assert.deepEqual(host(c.parseTodo('DOING ship it', states)),
    { keyword: '', priority: null, body: 'DOING ship it' });
  // a capitalized word that is NO state in any sequence is not a keyword
  assert.deepEqual(host(c.parseTodo('#URGENT call mom', states)),
    { keyword: '', priority: null, body: '#URGENT call mom' });
});

test('todoDoneFromText: generalized — custom done-state via explicit sequences', () => {
  const seqs = [DEFAULT_SEQ, FLOW];
  assert.equal(c.todoDoneFromText('#SHIPPED v1 release', seqs), true);
  assert.equal(c.todoDoneFromText('#DOING v1 release', seqs), false);
  assert.equal(c.todoDoneFromText('#DONE old way', seqs), true);    // default unchanged
  assert.equal(c.todoDoneFromText('- [x] task', seqs), true);       // task form unchanged
  assert.equal(c.todoDoneFromText('SHIPPED v1 release', seqs), false); // bare SHIPPED is plain text
});

test('continuationPrefix: a done custom state restarts at its sequence FIRST state', () => {
  const seqs = [DEFAULT_SEQ, FLOW];
  assert.equal(c.continuationPrefix('#SHIPPED v1', seqs), '#BACKLOG ');
  assert.equal(c.continuationPrefix('#DOING v1', seqs), '#DOING ');
  assert.equal(c.continuationPrefix('#DONE x', seqs), '#TODO ');   // default pin intact
  assert.equal(c.continuationPrefix('SHIPPED v1', seqs), '');      // bare SHIPPED is plain text
});

test('seqDefString: inverse of parseSequence (modulo spacing)', () => {
  assert.equal(c.seqDefString(FLOW), 'BACKLOG DOING | SHIPPED');
  assert.deepEqual(host(c.parseSequence(c.seqDefString(FLOW))),
    { states: FLOW.states, doneFrom: FLOW.doneFrom });
});

test('OPML: a [[seq:KEY]] record serializes into the _seq attribute', () => {
  const root = c.mkRoot();
  const n = c.mkNode('My flow [[seq:q1]]');
  n.seq = [FLOW];
  root.children.push(n);
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_seq='), 'seq sidecar should serialize');
  assert.ok(xml.includes('BACKLOG'), 'states should appear in the attribute');
});
