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
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { loadCores } from './load-cores.mjs';

const c = loadCores();

// Arrays/objects returned by the cores live in the vm context's realm, so their
// prototypes differ from the host's and strict deepEqual rejects them despite
// identical structure. Normalize to plain host-realm values before comparing.
const host = (x) => JSON.parse(JSON.stringify(x));

// #452: STRUCTURAL source-pin — return the body of `function name(...) { … }` by brace
// matching from its declaration, so a pin asserts a substring is present ANYWHERE in the
// function, with no byte-offset window. Replaces the brittle /function X[\s\S]{0,N}sub/
// pins (a behavior-preserving insert pushed the substring past N → false red). Returns ''
// if the function isn't found (the caller's includes() then fails with a clear message).
function fnBody(src, name) {
  const start = src.indexOf('function ' + name);
  if (start < 0) return '';
  const open = src.indexOf('{', start);
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  return src.slice(open);   // unbalanced (shouldn't happen) → from the open brace onward
}

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

test('parseDice — reroll rK parses and validates its combinations', () => {
  assert.equal(c.parseDice('4d6r1')[0].reroll, 1);
  const t = c.parseDice('4d6r1kh3')[0];           // canonical: reroll then keep
  assert.equal(t.reroll, 1); assert.equal(t.keepMode, 'kh'); assert.equal(t.keepCount, 3);
  assert.equal(c.parseDice('4d6r1>=4'), null);     // reroll + success pool → null
  assert.equal(c.parseDice('4dFr1'), null);        // reroll + Fate → null
  assert.equal(c.parseDice('4d6!r1'), null);       // reroll + exploding → null (v1)
  assert.equal(c.parseDice('4d6r0'), null);        // threshold < 1 → null
  assert.equal(c.parseDice('4d6r6'), null);        // threshold ≥ sides → null
});

test('rollParsed — reroll replaces a die ≤K once, keeping the new value', () => {
  c.seedSequence([0, 0.9, 0.5, 0.5, 0.5]); // die0: 1→reroll→6; dice 1–3: 4,4,4
  try {
    const res = c.rollParsed(c.parseDice('4d6r1'));
    assert.equal(res.total, 18);                   // 6+4+4+4 (the 1 was rerolled away)
    assert.deepEqual(host(res.parts[0].rolls), [[6], [4], [4], [4]]);
    assert.deepEqual(host(res.parts[0].rerolledFrom), [1, null, null, null]);
    assert.equal(res.parts[0].reroll, 1);
  } finally { c.resetRandom(); }
});

test('rollParsed — reroll composes with keep-high (4d6r1kh3)', () => {
  c.seedSequence([0, 0.9, 0.5, 0.5, 0.5]); // reroll die0 (1→6) → [6,4,4,4]; keep top 3
  try {
    assert.equal(c.rollParsed(c.parseDice('4d6r1kh3')).total, 14); // 6+4+4
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

test('evalMath — and/or/not: 0/1 logic over nonzero-is-true operands (#539)', () => {
  assert.equal(c.evalMath('and(1,1)'), 1);
  assert.equal(c.evalMath('and(1,0)'), 0);
  assert.equal(c.evalMath('or(0,0)'), 0);
  assert.equal(c.evalMath('or(0,2)'), 1);
  assert.equal(c.evalMath('not(0)'), 1);
  assert.equal(c.evalMath('not(3)'), 0);
  assert.equal(c.evalMath('not(-2)'), 0);            // any nonzero is true, sign irrelevant
  // variadic like min/max
  assert.equal(c.evalMath('and(1,2,3)'), 1);
  assert.equal(c.evalMath('and(1,0,3)'), 0);
  assert.equal(c.evalMath('or(0,0,5)'), 1);
  // composition with comparisons, ternary, if(), and variables
  assert.equal(c.evalMath('and(2>1, 3<5)'), 1);
  assert.equal(c.evalMath('and(a>1, b>1)', { a: 2, b: 3 }), 1);
  assert.equal(c.evalMath('or(a>9, b>9)', { a: 2, b: 3 }), 0);
  assert.equal(c.evalMath('if(and(x>0, y>0), 7, 9)', { x: 1, y: 2 }), 7);
  assert.equal(c.evalMath('not(x==5)', { x: 5 }), 0);
});

test('evalMath — and/or/not: arity errors and NaN operands fail to null (#539)', () => {
  assert.equal(c.evalMath('and(1)'), null);          // < 2 args, like min/max
  assert.equal(c.evalMath('or(1)'), null);
  assert.equal(c.evalMath('and()'), null);
  assert.equal(c.evalMath('not()'), null);           // not is strictly unary
  assert.equal(c.evalMath('not(1,2)'), null);
  // a NaN operand must fail the whole test, never read as a false/true verdict
  assert.equal(c.evalMath('and(sqrt(-1), 1)'), null);
  assert.equal(c.evalMath('or(sqrt(-1), 1)'), null);
  assert.equal(c.evalMath('not(sqrt(-1))'), null);
  // an unknown name inside still fails the expression (existing contract)
  assert.equal(c.evalMath('and(nope>1, 1)'), null);
});

test('evalCheck — a compound and(…) check passes the comparison gate and verdicts correctly (#539)', () => {
  const node = { text: 'x', props: [{ key: 'check', val: 'and(sum(cost) <= 10, count(cost) >= 2)' }],
    children: [
      { text: 'a', props: [{ key: 'cost', val: '4' }], children: [] },
      { text: 'b', props: [{ key: 'cost', val: '5' }], children: [] },
    ] };
  assert.equal(c.evalCheck(node, {}), 'pass');
  node.children[1].props[0].val = '9';               // sum 13 > 10 → the and() fails
  assert.equal(c.evalCheck(node, {}), 'fail');
  // a compound with no comparison anywhere is still not a test (P4 gate unchanged)
  const bare = { text: 'x', props: [{ key: 'check', val: 'and(1, 2)' }], children: [] };
  assert.equal(c.evalCheck(bare, {}), 'error');
});

test('evalMath — names colliding with Object.prototype fail to null, not the inherited member', () => {
  // On plain-object tables `'constructor' in MATH_CONSTS` was true via the prototype, so
  // `constructor*2` resolved to the Object function (NaN) and `constructor(5)`
  // dispatched it as a unary FN1. Both must be unknown names → null.
  assert.equal(c.evalMath('constructor*2', {}), null);
  assert.equal(c.evalMath('constructor(5)', {}), null);
  // …but a DECLARED variable with that name works (resolved by collectVars)
  assert.equal(c.evalMath('constructor*2', { constructor: 5 }), 10);
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

test('parseMarkov — an empty RHS declares a terminal, not a dead chain (B4)', () => {
  const p = c.parseMarkov('a -> b\nb ->'); // `b ->` registers b as a known terminal
  assert.notEqual(p, null);                // the whole chain stays valid (was: null)
  assert.deepEqual(host(p.order), ['a', 'b']);
  assert.ok(!p.trans.b || !p.trans.b.length, 'b has no outgoing transitions');
  assert.deepEqual(host(c.walkMarkov(p, 'a', 5)), ['a', 'b']); // walk ends at the terminal
  assert.deepEqual(host(c.walkMarkov(p, 'b', 5)), ['b']);      // starting at the terminal stays put
  // a missing FROM side is still rejected (the guard above the RHS check is unchanged)
  assert.equal(c.parseMarkov('-> b'), null);
});

// ── typed inline markov: {markov: a→b, b→c} ─────────────────────────────────
test('markovParts — sniffs a typed markov body, comma transitions → newline def', () => {
  assert.deepEqual(host(c.markovParts('markov: a→b, b→c')), { def: 'a→b\nb→c' });
  assert.deepEqual(host(c.markovParts('markov: a->b, b->a')), { def: 'a->b\nb->a' }); // ascii arrow too
  // weighted targets survive
  assert.deepEqual(host(c.markovParts('markov: sun→rain, sun→sun 2')), { def: 'sun→rain\nsun→sun 2' });
});
test('markovParts — a comma fragment with no arrow joins the previous transition', () => {
  // `a→b, c` = from a, two targets b and c (the second fragment has no arrow)
  assert.deepEqual(host(c.markovParts('markov: a→b, c, b→a')), { def: 'a→b, c\nb→a' });
});
test('markovParts — NOT a markov body (no false positives)', () => {
  assert.equal(c.markovParts('a | b'), null);            // alternation
  assert.equal(c.markovParts('x > 1: a | b'), null);     // conditional
  assert.equal(c.markovParts('shuffle: a | b'), null);   // sequence
  assert.equal(c.markovParts('weapon: sword | axe'), null); // a rule line
  assert.equal(c.markovParts('markov:'), null);          // empty body
  assert.equal(c.markovParts('markov: not an arrow'), null); // no valid transition
});
test('classifyBraceBody / braceTypeLabel — a typed markov is a valid markov artifact', () => {
  assert.equal(c.classifyBraceBody('markov: a→b, b→c', {}, {}), 'artifact');
  assert.deepEqual(host(c.braceTypeLabel('markov: a→b, b→c', {}, {})), ['markov', null]);
});
test('promoteBraceBody — {markov: …} builds an anonymous, typed markov record', () => {
  const node = { text: '', markov: [] };
  const tok = c.promoteBraceBody(node, 'markov: a→b, b→c');
  assert.match(tok, /^\[\[markov:[a-z0-9]+\]\]$/);
  const rec = node.markov[0];
  assert.equal(rec.typed, true);
  assert.equal(rec.name, undefined);            // anonymous — named markov stays a dialog feature
  assert.equal(rec.def, 'a→b\nb→c');
  assert.deepEqual(host(rec.path), ['a', 'b', 'c']); // deterministic walk from the first state
});
test('artifactToShorthand — a typed markov unfolds; a NAMED one stays atomic', () => {
  const typed = { key: 'k', typed: true, def: 'a→b\nb→c', start: 'a', steps: 5, path: ['a', 'b', 'c'] };
  assert.equal(c.artifactToShorthand('markov', typed), '{markov: a→b, b→c}');
  // a named (dialog) chain must NOT unfold — the name is doc-wide config the text can't carry
  assert.equal(c.artifactToShorthand('markov', { ...typed, name: 'weather' }), null);
  // a non-typed (legacy dialog) chain doesn't unfold either
  assert.equal(c.artifactToShorthand('markov', { ...typed, typed: false }), null);
});
test('typed markov — full edit-mode unfold/refold cycle preserves the token', () => {
  const node = { text: '', markov: [] };
  const tok = c.promoteBraceBody(node, 'markov: a→b, b→c');
  node.text = 'pre ' + tok;
  c.unfoldArtifacts(node);                          // enter edit: token → {markov: …} source
  assert.equal(node.text, 'pre {markov: a→b, b→c}');
  c.refoldArtifacts(node);                          // exit unchanged: source → the SAME token
  assert.equal(node.text, 'pre ' + tok);            // frozen walk + key preserved
  assert.equal(node.markov.length, 1);
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

// ── conditional text: {cond: then | else} (Ink-style) ───────────────────────
test('condParts — splits a comparison into cond / then / else', () => {
  assert.deepEqual(host(c.condParts('hp > 0: alive | dead')), { cond: 'hp > 0', then: 'alive', else: 'dead' });
  assert.deepEqual(host(c.condParts('n == 1: one')), { cond: 'n == 1', then: 'one', else: '' }); // else optional
});

test('condParts — only a real comparison is a conditional (no false positives)', () => {
  assert.equal(c.condParts('a | b'), null);          // plain alternation
  assert.equal(c.condParts('name: value'), null);    // a colon without a comparison stays literal
  assert.equal(c.condParts('= 2*3'), null);          // {= expr} is an expression
  assert.equal(c.condParts('2d6'), null);            // a dice body
  assert.equal(c.condParts('x>0 | y: a|b'), null);   // a top-level `|` before the `:` → alternation wins
});

test('resolveBrace — conditional emits THEN when the comparison holds, else ELSE', () => {
  const ctx = (vars) => ({ rules: {}, vars, depth: 0, stack: [] });
  assert.equal(c.resolveBrace('hp > 0: alive | dead', ctx({ hp: 3 })), 'alive');
  assert.equal(c.resolveBrace('hp > 0: alive | dead', ctx({ hp: 0 })), 'dead');
  assert.equal(c.resolveBrace('hp > 0: alive', ctx({ hp: 0 })), ''); // no else → empty
});

test('resolveBrace — an unresolvable condition fails visibly (P4), never silently', () => {
  // hp is undefined → evalMath returns null → a `{cond?}` marker, not a blank or a throw.
  assert.equal(c.resolveBrace('hp > 0: a | b', { rules: {}, vars: {}, depth: 0, stack: [] }), '{hp > 0?}');
});

// ── string equality in conditionals (#540) ──────────────────────────────────
test('strCondVerdict — quoted-side == / != compares as text, case-insensitive', () => {
  assert.equal(c.strCondVerdict('mood == "angry"', { mood: 'angry' }), 1);
  assert.equal(c.strCondVerdict('mood == "angry"', { mood: 'calm' }), 0);
  assert.equal(c.strCondVerdict('mood != "angry"', { mood: 'calm' }), 1);
  assert.equal(c.strCondVerdict('mood == "Angry"', { mood: 'angry' }), 1);   // case-insensitive by design
  assert.equal(c.strCondVerdict("mood == 'angry'", { mood: 'angry' }), 1);   // single quotes too
  assert.equal(c.strCondVerdict('"a" == "a"', {}), 1);                       // both sides quoted
  assert.equal(c.strCondVerdict('"left" == mood', { mood: 'left' }), 1);     // quote on either side
  assert.equal(c.strCondVerdict('r == "20"', { r: 20 }), 1);                 // numeric var stringifies
});

test('strCondVerdict — not-applicable and unresolvable are distinct outcomes', () => {
  assert.equal(c.strCondVerdict('a == b', { a: 1, b: 1 }), null);      // no quoted side → numeric path
  assert.equal(c.strCondVerdict('hp > 0', { hp: 1 }), null);           // no == / != at all
  assert.ok(Number.isNaN(c.strCondVerdict('mood == "x"', {})));        // unknown ref → NaN → {cond?}
  assert.ok(Number.isNaN(c.strCondVerdict('2 + x == "y"', {})));       // non-identifier side → NaN
});

test('resolveBrace — a text pick var drives a conditional branch (#540, the #429 text half)', () => {
  const ctx = (vars) => ({ rules: {}, vars, depth: 0, stack: [] });
  assert.equal(c.resolveBrace('mood == "angry": attacks | waits', ctx({ mood: 'angry' })), 'attacks');
  assert.equal(c.resolveBrace('mood == "angry": attacks | waits', ctx({ mood: 'calm' })), 'waits');
  assert.equal(c.resolveBrace('mood != "angry": talks | fights', ctx({ mood: 'calm' })), 'talks');
  // unresolvable string ref → the same visible {cond?} marker as the numeric path (P4)
  assert.equal(c.resolveBrace('mood == "angry": a | b', ctx({})), '{mood == "angry"?}');
  // numeric conditions are untouched by the new arm
  assert.equal(c.resolveBrace('hp > 0: alive | dead', ctx({ hp: 3 })), 'alive');
  assert.equal(c.resolveBrace('r == 20: crit | miss', ctx({ r: 20 })), 'crit');
});

// ── {roll: query} — pick a random point from the live outline (the tree-reference generator) ──
test('rollParts — sniffs the reserved roll: keyword, keeps the query tail verbatim', () => {
  // assert on .expr (not the whole object) — cores run in a vm realm, so deepEqual trips on the
  // cross-realm Object.prototype even for structurally identical objects.
  assert.equal(c.rollParts('roll: is:todo').expr, 'is:todo');
  assert.equal(c.rollParts('roll:#thread/torn').expr, '#thread/torn');  // query has its own : and /
  assert.equal(c.rollParts('roll:'), null);        // no query → not a roll
  assert.equal(c.rollParts('shuffle: a|b'), null);  // a different keyword is not roll:
  assert.equal(c.rollParts('color'), null);         // a bare rule name is not roll:
});

test('pickFromQuery — picks one matching point title from the tree, uncapped + fair', () => {
  const kid = (id, text) => ({ id, text, children: [], props: [], seq: [] });
  const rootNode = { id: 'r', text: '', children: [
    kid('a', '#TODO chase the letter'),
    kid('b', 'just a note'),
    kid('c', '#TODO find the key'),
    kid('d', '#DONE closed thread'),
  ] };
  // is:todo matches a + c (2 open todos), not the note, not the done one
  c.setRandom(() => 0);   // floor(0 * 2) = index 0
  try { assert.equal(c.pickFromQuery('is:todo', rootNode, null), 'chase the letter'); }
  finally { c.resetRandom(); }
  c.setRandom(() => 0.99);  // floor(0.99 * 2) = index 1
  try { assert.equal(c.pickFromQuery('is:todo', rootNode, null), 'find the key'); }
  finally { c.resetRandom(); }
  // no match → '' (a visible empty, never a throw)
  assert.equal(c.pickFromQuery('is:todo #nonexistent', rootNode, null), '');
  // the host point is excluded from its own roll (so {roll:} on a point can't pick itself)
  c.setRandom(() => 0);
  try { assert.equal(c.pickFromQuery('is:todo', rootNode, 'a'), 'find the key'); }  // 'a' excluded → only c
  finally { c.resetRandom(); }
});

test('resolveBrace {roll:} — the branch is wired and fails safe (P4 marker on no match)', () => {
  // resolveBrace's roll branch reads the module cookieNode/root globals to scope the pick — those
  // are lexical `let`s not reachable from the vm sandbox (same as the {= sum(subtree)} aggregation
  // branch, which is likewise core-tested via aggregateChildren, not through resolveBrace). So the
  // PICK logic is proven by the pickFromQuery pins above; here we pin only what IS reachable: the
  // branch is dispatched (not swallowed by condParts) and fails to a visible P4 marker on no match,
  // never a throw or silent blank. In production cookieNode is the live render node (set by
  // renderContentHTML), so this resolves to a picked title; the empty-doc sandbox has no match.
  const marker = c.resolveBrace('roll: is:todo', { rules: {}, vars: {}, depth: 0, stack: [] });
  assert.equal(marker, '{roll: is:todo?}');   // dispatched to the roll branch, P4 marker on empty
  // a query's `:` must not mis-dispatch to the conditional branch (which would give a {cond?} marker)
  assert.ok(!marker.includes('cond'), 'roll: must be sniffed before condParts');
});

test('{roll:} promotes to an anonymous grammar pill (rides the grammar machinery)', () => {
  // typing {roll: is:todo} builds an anonymous [[grammar:key]] pill wrapping `origin: {roll: …}`,
  // so freeze / click-reroll / unfold / OPML round-trip all reuse the grammar path — no new sidecar.
  const node = { text: '', grammar: [] };
  const tok = c.promoteBraceBody(node, 'roll: is:todo');
  assert.match(tok, /^\[\[grammar:/, 'a {roll:} promotes to a grammar pill');
  assert.equal(node.grammar.length, 1);
  assert.equal(node.grammar[0].def, 'origin: {roll: is:todo}');
  assert.equal(node.grammar[0].anon, true, 'the synthetic origin rule is anon (not a doc-wide callable)');
  // classifyBraceBody agrees it is a valid artifact (edit-mode grammar styling, not a typo marker)
  assert.equal(c.classifyBraceBody('roll: is:todo', {}, {}), 'artifact');
});

// ── {oracle: band} — the oracle dialog's typed twin (#543) ──────────────────
test('oracleParts — band names map to the exact dialog bodies, case-insensitive', () => {
  assert.equal(c.oracleParts('oracle: likely').body, 'Yes 3 | No 1');
  assert.equal(c.oracleParts('oracle: certain').body, 'Yes 19 | No 1');
  assert.equal(c.oracleParts('oracle: even').body, 'Yes 1 | No 1');
  assert.equal(c.oracleParts('oracle: unlikely').body, 'Yes 1 | No 3');
  assert.equal(c.oracleParts('oracle: impossible').body, 'Yes 1 | No 19');
  assert.equal(c.oracleParts('ORACLE:  Likely ').body, 'Yes 3 | No 1');   // case + whitespace
  assert.equal(c.oracleParts('oracle: likely').swing, false);
});

test('oracleParts — + swing swaps in the six-way body at the same likelihood', () => {
  const p = c.oracleParts('oracle: even + swing');
  assert.equal(p.swing, true);
  assert.match(p.body, /^Yes, and \d+ \| Yes \d+ \| Yes, but \d+ \| No, but \d+ \| No \d+ \| No, and \d+$/);
});

test('oracleParts — unknown band or malformed body is null (stays literal on exit)', () => {
  assert.equal(c.oracleParts('oracle: maybe'), null);       // not a band
  assert.equal(c.oracleParts('oracle:'), null);             // no band
  assert.equal(c.oracleParts('oracle likely'), null);       // no colon → not the keyword form
  assert.equal(c.oracleParts('oracles: likely'), null);     // not the reserved word
  assert.equal(c.oracleParts('oracle: yes 3 | no 1'), null); // free-form odds are the plain alternation's job
});

test('promoteBraceBody — {oracle: band} builds the dialog-identical anonymous grammar (#543)', () => {
  const node = { text: '', grammar: [] };
  const tok = c.promoteBraceBody(node, 'oracle: likely');
  assert.match(tok, /^\[\[grammar:/, 'promotes to a grammar pill');
  assert.equal(node.grammar[0].def, 'origin: Yes 3 | No 1', 'the record IS what the dialog builds');
  assert.equal(node.grammar[0].anon, true);
  assert.match(node.grammar[0].result, /^(Yes|No)$/);
  // classify agrees; an unknown band styles as an ATTEMPT (typo marker), not prose
  assert.equal(c.classifyBraceBody('oracle: likely', {}, {}), 'artifact');
  assert.equal(c.classifyBraceBody('oracle: maybe', {}, {}), 'invalid');
  assert.deepEqual(host(c.braceTypeLabel('oracle: likely', {}, {})), ['grammar', 'oracle']);
});

test('resolveBrace — a nested {oracle: band} resolves to a Yes/No pick (#543)', () => {
  const ctx = { rules: {}, vars: {}, depth: 0, stack: [] };
  for (let i = 0; i < 10; i++) assert.match(c.resolveBrace('oracle: even', ctx), /^(Yes|No)$/);
  c.seedSequence([0]);   // r=0 lands on the first alternative → Yes
  try { assert.equal(c.resolveBrace('oracle: even', ctx), 'Yes'); } finally { c.resetRandom(); }
});

test('runGrammar — a braced conditional inside a rule resolves against document vars', () => {
  assert.equal(c.runGrammar('origin: The {danger > 3: dragon stirs | meadow is calm}.', 'origin', {}, { danger: 5 }), 'The dragon stirs.');
  assert.equal(c.runGrammar('origin: The {danger > 3: dragon stirs | meadow is calm}.', 'origin', {}, { danger: 1 }), 'The meadow is calm.');
});

test('runGrammar — a conditional branch can call another rule (composition)', () => {
  assert.equal(c.runGrammar('origin: {fear > 0: {cry}|steady}\ncry: RUN', 'origin', {}, { fear: 1 }), 'RUN');
});

test('classifyBraceBody / braceTypeLabel — a conditional reads as a (grammar) artifact', () => {
  assert.equal(c.classifyBraceBody('hp > 0: a | b', {}, {}), 'artifact'); // styled valid, not the gr-bad typo signal
  assert.deepEqual(host(c.braceTypeLabel('hp > 0: a | b', {}, {})), ['grammar', null]);
  // a colon without a comparison is still plain prose, untouched
  assert.equal(c.classifyBraceBody('note: hello', {}, {}), 'literal');
});

test('conditional standalone shorthand — wrapped def expands and unfolds back to its {cond} source', () => {
  // promoteBraceBody wraps a standalone {cond: …} as `origin: {cond: …}` so the
  // synthetic rule routes through resolveBrace (not the rule-level `|` split).
  assert.equal(c.runGrammar('origin: {hp > 0: a | b}', 'origin', {}, { hp: 5 }), 'a');
  assert.equal(c.runGrammar('origin: {hp > 0: a | b}', 'origin', {}, { hp: 0 }), 'b');
  // …and editing it unfolds the pill straight back to the {cond: …} the user typed.
  const rec = { def: 'origin: {hp > 0: a | b}', origin: 'origin', anon: true };
  assert.equal(c.artifactToShorthand('grammar', rec), '{hp > 0: a | b}');
});

// ── text modifiers (A1): {ref.mod} — cap/title/upper/lower/a/s ───────────────
test('modParts — base + known modifier suffix(es); rejects non-modifiers', () => {
  assert.deepEqual(host(c.modParts('beast.cap')), { base: 'beast', mods: ['cap'] });
  assert.deepEqual(host(c.modParts('x.a.cap')), { base: 'x', mods: ['a', 'cap'] });
  assert.equal(c.modParts('file.txt'), null);    // txt ∉ modifiers
  assert.equal(c.modParts('cap'), null);         // no dot → a bare word, not a modref
  assert.equal(c.modParts('beast.badmod'), null);
  assert.equal(c.modParts('2d6.cap'), null);     // base must be an identifier or pure integer; 2d6 is neither
});

test('pluralize — regular English heuristic', () => {
  assert.equal(c.pluralize('cat'), 'cats');
  assert.equal(c.pluralize('fox'), 'foxes');
  assert.equal(c.pluralize('bus'), 'buses');
  assert.equal(c.pluralize('fly'), 'flies');
  assert.equal(c.pluralize('day'), 'days');
  assert.equal(c.pluralize('leaf'), 'leaves');
  assert.equal(c.pluralize('knife'), 'knives');
});

test('applyMods — folds modifiers left-to-right', () => {
  assert.equal(c.applyMods('dragon', ['a', 'cap']), 'A dragon');
  assert.equal(c.applyMods('dragon', ['cap', 'a']), 'a Dragon');
  assert.equal(c.applyMods('owl', ['a']), 'an owl');
  assert.equal(c.applyMods('old dog', ['title']), 'Old Dog');
  assert.equal(c.applyMods('DOG', ['lower']), 'dog');
});

test('applyMods — .ed (regular past tense) and .ord (ordinal) follow-ons', () => {
  assert.equal(c.applyMods('walk', ['ed']), 'walked');
  assert.equal(c.applyMods('love', ['ed']), 'loved');
  assert.equal(c.applyMods('try', ['ed']), 'tried');
  assert.equal(c.applyMods('play', ['ed']), 'played');   // vowel+y → just +ed
  assert.equal(c.applyMods('1', ['ord']), '1st');
  assert.equal(c.applyMods('2', ['ord']), '2nd');
  assert.equal(c.applyMods('3', ['ord']), '3rd');
  assert.equal(c.applyMods('11', ['ord']), '11th');
  assert.equal(c.applyMods('12', ['ord']), '12th');
  assert.equal(c.applyMods('21', ['ord']), '21st');
  assert.equal(c.applyMods('113', ['ord']), '113th');
  assert.equal(c.applyMods('abc', ['ord']), 'abc');      // non-integer → unchanged
  assert.equal(c.applyMods('3.5', ['ord']), '3.5');
  assert.equal(c.applyMods('3', ['ord', 'cap']), '3rd'); // chainable; cap is a no-op on a digit-led string
  // both are recognised modifier suffixes (modParts), so {verb.ed} reads as an artifact
  assert.deepEqual(host(c.modParts('verb.ed')), { base: 'verb', mods: ['ed'] });
  assert.deepEqual(host(c.modParts('n.ord.cap')), { base: 'n', mods: ['ord', 'cap'] });
});

test('applyMods — .poss (possessive) and .ing (present participle), the #545 additions', () => {
  // possessive: AP style, trailing s takes a bare apostrophe
  assert.equal(c.applyMods('ogre', ['poss']), "ogre's");
  assert.equal(c.applyMods('foxes', ['poss']), "foxes'");
  assert.equal(c.applyMods('boss', ['poss']), "boss'");        // documented heuristic (AP singular-s stays bare here)
  // present participle: drop-e, keep-ee, ie → ying, CVC doubling, plain +ing
  assert.equal(c.applyMods('walk', ['ing']), 'walking');
  assert.equal(c.applyMods('love', ['ing']), 'loving');
  assert.equal(c.applyMods('see', ['ing']), 'seeing');
  assert.equal(c.applyMods('die', ['ing']), 'dying');
  assert.equal(c.applyMods('run', ['ing']), 'running');
  assert.equal(c.applyMods('sit', ['ing']), 'sitting');
  assert.equal(c.applyMods('play', ['ing']), 'playing');       // y is never doubled
  assert.equal(c.applyMods('row', ['ing']), 'rowing');         // w is never doubled
  // documented ceiling: naive CVC doubling ignores stress (the pluralize child→childs honesty)
  assert.equal(c.applyMods('visit', ['ing']), 'visitting');
  // chaining and sniffing work like every other token
  assert.equal(c.applyMods('ogre', ['poss', 'cap']), "Ogre's");
  assert.deepEqual(host(c.modParts('verb.ing')), { base: 'verb', mods: ['ing'] });
  assert.deepEqual(host(c.modParts('owner.poss.cap')), { base: 'owner', mods: ['poss', 'cap'] });
  // shadowing: a 2-segment ref whose suffix is now a modifier no longer reads as a field
  assert.equal(c.fieldParts('owner.poss'), null);
  assert.equal(c.fieldParts('verb.ing'), null);
});

test('resolveBrace — a modified reference resolves the base then shapes it', () => {
  const ctx = (rules, vars) => ({ rules, vars, depth: 0, stack: [] });
  assert.equal(c.resolveBrace('beast.cap', ctx({ beast: [{ template: 'dragon', weight: 1 }] }, {})), 'Dragon');
  assert.equal(c.resolveBrace('name.upper', ctx({}, { name: 'alice' })), 'ALICE');
  assert.equal(c.resolveBrace('ghost.cap', ctx({}, {})), '{ghost?}'); // undefined base → marker, mods not applied
});

test('modParts / resolveBrace — a literal-integer base resolves to itself ({3.ord} → 3rd) (B2)', () => {
  const ctx = (rules, vars) => ({ rules, vars, depth: 0, stack: [] });
  // modParts now accepts a pure-integer base alongside an identifier base
  assert.deepEqual(host(c.modParts('3.ord')), { base: '3', mods: ['ord'] });
  assert.deepEqual(host(c.modParts('21.ord')), { base: '21', mods: ['ord'] });
  // the literal base resolves to the digits, mods fold over it — no rule/var lookup needed
  assert.equal(c.resolveBrace('3.ord', ctx({}, {})), '3rd');
  assert.equal(c.resolveBrace('21.ord', ctx({}, {})), '21st');
  assert.equal(c.resolveBrace('2.ord', ctx({}, {})), '2nd');
  // a dice-shaped base is neither integer nor identifier → still null (unchanged)
  assert.equal(c.modParts('2d6.ord'), null);
  assert.equal(c.modParts('2d6.cap'), null);
  // a numeric base with a NON-modifier suffix is not a modref (stays null → literal/field path)
  assert.equal(c.modParts('3.foo'), null);
});

test('classifyBraceBody / braceTypeLabel — a modref is a (grammar) artifact when its base is defined', () => {
  const rules = { beast: [{ template: 'dragon', weight: 1 }] }, vars = { name: 'alice' };
  assert.equal(c.classifyBraceBody('beast.cap', rules, vars), 'artifact');
  assert.equal(c.classifyBraceBody('name.s', rules, vars), 'artifact');
  assert.equal(c.classifyBraceBody('ghost.cap', rules, vars), 'invalid');  // undefined base, mod-shaped
  assert.equal(c.classifyBraceBody('file.txt', rules, vars), 'literal');    // not a modifier
  assert.deepEqual(host(c.braceTypeLabel('beast.cap', rules, vars)), ['grammar', null]);
  // a literal-integer base always resolves, so {3.ord} promotes with no rule/var defined (B2)
  assert.equal(c.classifyBraceBody('3.ord', {}, {}), 'artifact');
  assert.deepEqual(host(c.braceTypeLabel('3.ord', {}, {})), ['grammar', null]);
});

test('runGrammar — modifiers compose with rule expansion (the promoted shape)', () => {
  assert.equal(c.runGrammar('origin: {beast.cap}\nbeast: dragon', 'origin', {}, {}), 'Dragon');
  assert.equal(c.runGrammar('origin: {beast.a}\nbeast: ogre', 'origin', {}, {}), 'an ogre');
  assert.equal(c.runGrammar('origin: {beast.a.cap}\nbeast: dragon', 'origin', {}, {}), 'A dragon');
  assert.equal(c.runGrammar('origin: {noun.s}\nnoun: fox', 'origin', {}, {}), 'foxes');
});

test('text modifier unfold round-trip — a promoted {beast.cap} unfolds verbatim', () => {
  const rec = { def: 'origin: {beast.cap}', origin: 'origin', anon: true };
  assert.equal(c.artifactToShorthand('grammar', rec), '{beast.cap}');
});

// ── hierarchical / property items (A6): dotted sub-rules + {base.field} ────────
test('parseRules — accepts dotted sub-rule names; rejects stray dots', () => {
  const p = c.parseRules('weapon: sword | axe\nsword.damage: 1d8\nsword.name: a longsword');
  assert.ok(p.rules['sword.damage'], 'sword.damage registered as a rule key');
  assert.ok(p.rules['sword.name']);
  assert.equal(p.rules['weapon'].length, 2, 'parent rule keeps its alternatives');
  assert.ok(c.parseRules('a.b.c: x'), 'multi-segment dotted name is a valid key');
  assert.equal(c.parseRules('.x: y'), null);   // leading dot
  assert.equal(c.parseRules('a..b: y'), null); // empty segment
  assert.equal(c.parseRules('a.: y'), null);   // trailing dot
});

test('isYesNoOracle — content-sniff: every origin alt leads yes/no, regardless of provenance (UXP-145)', () => {
  const O = (def, origin) => c.isYesNoOracle({ def, origin, result: 'x' });
  // a pure Yes/No family (typed shorthand form) → oracle
  assert.equal(O('origin: Yes | No'), true);
  assert.equal(O('origin: Yes, and | Yes | No | No, but'), true);   // swing oracle
  assert.equal(O('origin: Yes 3 | No 1'), true);                    // weighted
  // NOT an oracle: an alt that isn't yes/no
  assert.equal(O('origin: Yes | No | Maybe'), false);
  assert.equal(O('origin: goblin | orc'), false);
  // "yesterday"/"nope" must NOT match — \b anchors the word
  assert.equal(O('origin: yesterday | nope'), false);
  // a stateful deck is never an oracle
  assert.equal(c.isYesNoOracle({ mode: 'shuffle', items: ['Yes', 'No'] }), false);
  // honors an explicit origin over order[0]
  assert.equal(O('junk: a | b\nask: Yes | No', 'ask'), true);
  assert.equal(c.isYesNoOracle(null), false);
});

test('fieldParts — a 2-segment ref whose suffix is NOT a modifier', () => {
  assert.deepEqual(host(c.fieldParts('weapon.damage')), { base: 'weapon', field: 'damage' });
  assert.deepEqual(host(c.fieldParts('w.value')), { base: 'w', field: 'value' });
  assert.equal(c.fieldParts('w.cap'), null);   // cap is a modifier → A1's modParts owns it
  assert.equal(c.fieldParts('n.ord'), null);   // ord too (the new A1 modifier)
  assert.equal(c.fieldParts('beast'), null);   // no dot
  assert.equal(c.fieldParts('a.b.c'), null);   // 3 segments → not a single field (v1)
});

test('resolveBrace / runGrammar — {base.field} resolves three ways', () => {
  // 1. a directly-named sub-rule
  assert.equal(c.runGrammar('origin: {sword.damage}\nsword.damage: hit', 'origin', {}, {}), 'hit');
  // 2. pick the parent → read the picked item's field ({weapon} = "sword" → sword.damage)
  assert.equal(c.runGrammar('origin: {weapon.damage}\nweapon: sword\nsword.damage: hit', 'origin', {}, {}), 'hit');
  // 3. an undefined field → a visible marker (P4), never silent
  assert.equal(c.runGrammar('origin: {weapon.color}\nweapon: sword\nsword.damage: hit', 'origin', {}, {}), '{weapon.color?}');
});

test('A6 consistency rides the pick variable, not a per-expansion bind', () => {
  // A pick variable frozen to "sword" makes {w} and {w.damage} the SAME item — the
  // locked consistency path (NOT the reverted ctx.binds / {a := …} model).
  const def = 'origin: {w} hits for {w.damage}\nsword.damage: heavy\naxe.damage: light';
  assert.equal(c.runGrammar(def, 'origin', {}, { w: 'sword' }), 'sword hits for heavy');
  assert.equal(c.runGrammar(def, 'origin', {}, { w: 'axe' }),   'axe hits for light');
});

test('classifyBraceBody / braceTypeLabel — a resolvable field ref is a grammar artifact', () => {
  const rules = { weapon: [{ template: 'sword', weight: 1 }], 'sword.damage': [{ template: 'hit', weight: 1 }] };
  assert.equal(c.classifyBraceBody('weapon.damage', rules, {}), 'artifact'); // base is a known rule
  assert.equal(c.classifyBraceBody('sword.damage', rules, {}), 'artifact');  // direct sub-rule
  assert.equal(c.classifyBraceBody('w.damage', {}, { w: 'sword' }), 'artifact'); // base is a known var
  assert.equal(c.classifyBraceBody('file.name', {}, {}), 'literal');         // undefined base → prose, not a broken pill
  assert.deepEqual(host(c.braceTypeLabel('weapon.damage', rules, {})), ['grammar', 'weapon.damage']);
});

// ── field-then-modifier chaining {w.damage.cap} (#545, A6 phase 2) ───────────
test('fieldModParts — ≥3 segments, a non-modifier field, an all-modifier tail', () => {
  assert.deepEqual(host(c.fieldModParts('w.damage.cap')), { base: 'w', field: 'damage', mods: ['cap'] });
  assert.deepEqual(host(c.fieldModParts('weapon.name.a.cap')), { base: 'weapon', field: 'name', mods: ['a', 'cap'] });
  assert.equal(c.fieldModParts('w.damage'), null);        // 2 segments → fieldParts' job
  assert.equal(c.fieldModParts('beast.a.cap'), null);     // all-modifier tail on a bare ref → modParts' job
  assert.equal(c.fieldModParts('w.cap.upper'), null);     // a field named after a modifier stays shadowed
  assert.equal(c.fieldModParts('a.b.c'), null);           // non-modifier third segment → nesting, still out
  assert.equal(c.fieldModParts('w.damage.txt'), null);    // unknown trailing suffix → not a chain
});

test('resolveBrace / runGrammar — a field read shaped by modifiers (#545)', () => {
  // all three field resolutions, then applyMods folds the tail
  assert.equal(c.runGrammar('origin: {sword.damage.cap}\nsword.damage: hit', 'origin', {}, {}), 'Hit');
  assert.equal(c.runGrammar('origin: {weapon.damage.upper}\nweapon: sword\nsword.damage: hit', 'origin', {}, {}), 'HIT');
  assert.equal(c.runGrammar('origin: {w.name.a.cap}\nsword.name: ogre blade', 'origin', {}, { w: 'sword' }), 'An ogre blade');
  // the new tokens chain here too (stacked on the .poss/.ing branch)
  assert.equal(c.runGrammar('origin: {w.name.poss}\nsword.name: ogre', 'origin', {}, { w: 'sword' }), "ogre's");
  // undefined base/field → the visible marker, modifiers NOT applied (P4)
  assert.equal(c.runGrammar('origin: {ghost.name.cap}', 'origin', {}, {}), '{ghost.name.cap?}');
});

test('classify/typeLabel/promote agree on a modifier-chained field ref (#545)', () => {
  const rules = { weapon: [{ template: 'sword', weight: 1 }], 'sword.damage': [{ template: 'hit', weight: 1 }] };
  assert.equal(c.classifyBraceBody('weapon.damage.cap', rules, {}), 'artifact');
  assert.equal(c.classifyBraceBody('nope.name.cap', {}, {}), 'literal');   // undefined base → prose
  assert.deepEqual(host(c.braceTypeLabel('weapon.damage.cap', rules, {})), ['grammar', 'weapon.damage.cap']);
});

// ── stateful sequences: {shuffle|cycle|once|stopping: a | b | c} ─────────────
test('seqParts — parses a mode + items; rejects non-modes', () => {
  assert.deepEqual(host(c.seqParts('shuffle: a | b | c')), { mode: 'shuffle', items: ['a', 'b', 'c'], count: 1 });
  assert.deepEqual(host(c.seqParts('CYCLE: x|y')), { mode: 'cycle', items: ['x', 'y'], count: 1 }); // case-insensitive mode
  assert.equal(c.seqParts('a | b'), null);          // plain alternation (no mode)
  assert.equal(c.seqParts('note: hello'), null);    // a colon without a reserved mode
  assert.equal(c.seqParts('hp > 0: a | b'), null);  // a conditional, not a sequence
  assert.equal(c.seqParts('shuffle:'), null);       // a mode with no items
});

test('seqParts — optional draw count on shuffle only (#542)', () => {
  // BEHAVIOR CHANGE, intentional: {shuffle 3: a|b} previously fell through to alternation
  // (first alt the literal "shuffle 3: a"); it now parses as a counted deck.
  assert.deepEqual(host(c.seqParts('shuffle 3: a | b | c | d')), { mode: 'shuffle', items: ['a', 'b', 'c', 'd'], count: 3 });
  assert.deepEqual(host(c.seqParts('SHUFFLE 12: a | b')), { mode: 'shuffle', items: ['a', 'b'], count: 12 });
  assert.deepEqual(host(c.seqParts('shuffle 1: a | b')), { mode: 'shuffle', items: ['a', 'b'], count: 1 }); // 1 == no count
  assert.equal(c.seqParts('shuffle 0: a | b'), null);   // zero is not a deal
  assert.equal(c.seqParts('cycle 3: a | b'), null);     // count is shuffle-only in v1
  assert.equal(c.seqParts('once 2: a | b'), null);
  assert.equal(c.seqParts('stopping 2: a | b'), null);
  assert.equal(c.seqParts('shuffle 100: a | b'), null); // out of the 1–99 range (like {Nx:})
});

test('nextSeqIndex — cycle loops, once exhausts, stopping sticks on the last', () => {
  const take = (rec, n) => Array.from({ length: n }, () => c.nextSeqIndex(rec));
  assert.deepEqual(take({ mode: 'cycle', items: ['a', 'b', 'c'], pos: 0 }, 5), [0, 1, 2, 0, 1]);
  assert.deepEqual(take({ mode: 'once', items: ['a', 'b'], pos: 0 }, 4), [0, 1, -1, -1]);
  assert.deepEqual(take({ mode: 'stopping', items: ['a', 'b', 'c'], pos: 0 }, 5), [0, 1, 2, 2, 2]);
});

test('nextSeqIndex — shuffle draws without replacement, then reshuffles', () => {
  c.seedSequence([0.1, 0.6, 0.3, 0.8, 0.2, 0.9]);
  try {
    const rec = { mode: 'shuffle', items: ['a', 'b', 'c'], bag: [] };
    const round1 = [c.nextSeqIndex(rec), c.nextSeqIndex(rec), c.nextSeqIndex(rec)];
    assert.deepEqual([...round1].sort(), [0, 1, 2], 'one full round draws each index exactly once');
    assert.equal(rec.bag.length, 0, 'bag is empty after a full round');
    const next = c.nextSeqIndex(rec); // refills (reshuffles) and draws
    assert.ok(next >= 0 && next < 3, 'the next draw comes from a fresh bag');
  } finally { c.resetRandom(); }
});

test('nextSeqIndex — shuffle never repeats across the reshuffle boundary', () => {
  // a 2-item deck: every draw must differ from the one before it (within a round
  // they alternate by construction; the fix guarantees the boundary does too).
  const rec = { mode: 'shuffle', items: ['a', 'b'], bag: [] };
  let prev = c.nextSeqIndex(rec);
  for (let i = 0; i < 40; i++) {
    const cur = c.nextSeqIndex(rec);
    assert.notEqual(cur, prev, `draw ${i + 1} repeated the previous (boundary repeat)`);
    prev = cur;
  }
});

test('advanceSeq — a counted shuffle deals N distinct cards per advance (#542)', () => {
  const rec = { mode: 'shuffle', items: ['a', 'b', 'c', 'd', 'e'], count: 3, bag: [] };
  const dealt = c.advanceSeq(rec, {}, {}).split(' ');
  assert.equal(dealt.length, 3, 'deals exactly count cards');
  assert.equal(new Set(dealt).size, 3, 'no duplicates within a deal (bag had enough)');
  assert.equal(rec.bag.length, 2, 'the deck is 2 cards lighter');
  // the next deal spans the reshuffle boundary: 2 remaining + 1 from a fresh bag
  const dealt2 = c.advanceSeq(rec, {}, {}).split(' ');
  assert.equal(dealt2.length, 3, 'a deal spanning an empty bag reshuffles and completes');
});

test('advanceSeq — an exhausted once ends the deal early, never pads (#542 guard)', () => {
  // count only ships on shuffle, but advanceSeq must stay safe if a record carries one
  const rec = { mode: 'once', items: ['a', 'b'], count: 3, pos: 0 };
  assert.equal(c.advanceSeq(rec, {}, {}), 'a b');   // 2 items, deal of 3 → stops at the end
  assert.equal(c.advanceSeq(rec, {}, {}), '');      // spent
});

test('resolveBrace — a nested counted shuffle deals distinct items, capped at the list (#542)', () => {
  const ctx = { rules: {}, vars: {}, depth: 0, stack: [] };
  for (let i = 0; i < 20; i++) {
    const out = c.resolveBrace('shuffle 3: a | b | c | d | e', ctx).split(' ');
    assert.equal(out.length, 3);
    assert.equal(new Set(out).size, 3, `deal ${i} repeated an item: ${out.join(' ')}`);
  }
  // count larger than the list → every item once, no padding
  const all = c.resolveBrace('shuffle 99: a | b | c', ctx).split(' ');
  assert.deepEqual([...all].sort(), ['a', 'b', 'c']);
});

test('makeSeqGen — stores the deal count on the record (round-trips _grammar) (#542)', () => {
  const rec = c.makeSeqGen('shuffle', ['a', 'b', 'c', 'd'], undefined, 3);
  assert.equal(rec.count, 3);
  assert.equal(rec.result.split(' ').length, 3, 'first emission is already a full deal');
  const plain = c.makeSeqGen('shuffle', ['a', 'b']);
  assert.equal(plain.count, undefined, 'no count key when the deal is 1');
});

test('advanceSeq — emits the chosen item, expanded against the grammar', () => {
  const rec = { mode: 'cycle', items: ['{2d6} gold', 'plain'], pos: 0 };
  c.seedSequence([0]); // 2d6 → minimum 2
  try {
    assert.equal(c.advanceSeq(rec, {}, {}), '2 gold'); // item 0, dice expanded
    assert.equal(c.advanceSeq(rec, {}, {}), 'plain');  // item 1, no expansion
  } finally { c.resetRandom(); }
});

test('makeSeqGen — builds a record advanced to its first emission; rejects bad input', () => {
  const rec = c.makeSeqGen('cycle', ['a', 'b', 'c']);
  assert.equal(rec.mode, 'cycle');
  assert.deepEqual(host(rec.items), ['a', 'b', 'c']);
  assert.equal(rec.result, 'a'); // first emission
  assert.equal(rec.pos, 1);
  assert.ok(rec.anon, 'standalone pill, not a doc-wide callable');
  assert.equal(c.makeSeqGen('bogus', ['a']), null);
  assert.equal(c.makeSeqGen('cycle', []), null);
});

// ── repeatParts ───────────────────────────────────────────────────────────────

test('repeatParts — parses Nx: template; rejects invalid forms', () => {
  assert.deepEqual(host(c.repeatParts('3x: {beast}')), { n: 3, template: '{beast}' });
  assert.deepEqual(host(c.repeatParts('1x: hello')), { n: 1, template: 'hello' });   // n=1 boundary
  assert.deepEqual(host(c.repeatParts('99X: y')), { n: 99, template: 'y' });          // n=99 boundary; X case-insensitive
  assert.equal(c.repeatParts('0x: hello'), null);   // n=0 rejected
  assert.equal(c.repeatParts('100x: hello'), null); // n=100 rejected
  assert.equal(c.repeatParts('shuffle: a|b'), null); // a sequence mode, not Nx
  assert.equal(c.repeatParts('hello'), null);        // no colon
  assert.equal(c.repeatParts('x: no'), null);        // not a digit run
});

test('resolveBrace — {3x: ★} expands the template N times, joined by space', () => {
  // Template is a literal, so each expansion is identical — trivially verifiable.
  const ctx = { rules: Object.create(null), vars: Object.create(null), depth: 0, stack: [] };
  assert.equal(c.resolveBrace('3x: ★', ctx), '★ ★ ★');
  assert.equal(c.resolveBrace('1x: hi', ctx), 'hi');
});

test('resolveBrace — {3x: {2d6}} re-rolls each repetition independently', () => {
  c.seedSequence([0, 0, 0.5, 0, 0, 0.99]);  // two d6 per roll → rolls: 1+1=2, 1+4=5, 1+6=7
  try {
    const ctx = { rules: Object.create(null), vars: Object.create(null), depth: 0, stack: [] };
    assert.equal(c.resolveBrace('3x: {2d6}', ctx), '2 5 7');
  } finally { c.resetRandom(); }
});

test('runGrammar — {3x: {beast}} composes repeat inside a grammar rule', () => {
  c.seedSequence([0]);  // always picks first alternative → 'a'
  try {
    const def = 'origin: {3x: {beast}}\nbeast: a | b | c';
    const result = c.runGrammar(def, 'origin', null, {});
    assert.equal(result, 'a a a');
  } finally { c.resetRandom(); }
});

test('classifyBraceBody / braceTypeLabel — a repeat reads as a (grammar) artifact', () => {
  assert.equal(c.classifyBraceBody('3x: hello', {}, {}), 'artifact');
  assert.deepEqual(host(c.braceTypeLabel('3x: hello', {}, {})), ['grammar', null]);
});

test('resolveBrace — a {mode: …} inside a rule degrades to a uniform pick (no state there)', () => {
  c.seedSequence([0]); // floor(0*3) → first item
  try {
    assert.equal(c.resolveBrace('shuffle: x | y | z', { rules: {}, vars: {}, depth: 0, stack: [] }), 'x');
  } finally { c.resetRandom(); }
});

test('classifyBraceBody / braceTypeLabel — a sequence reads as a (grammar) artifact', () => {
  assert.equal(c.classifyBraceBody('shuffle: a | b | c', {}, {}), 'artifact');
  assert.deepEqual(host(c.braceTypeLabel('cycle: a | b', {}, {})), ['grammar', null]);
  assert.equal(c.classifyBraceBody('note: hello', {}, {}), 'literal'); // a non-mode colon stays prose
});

test('advanceSeq — an exhausted once emits empty (the pill shows a muted end marker)', () => {
  const rec = c.makeSeqGen('once', ['only']);   // first emission shown at creation
  assert.equal(rec.result, 'only');
  assert.equal(c.advanceSeq(rec, {}, {}), '');  // past the end → empty (renders as "—")
  assert.equal(c.advanceSeq(rec, {}, {}), '');  // stays ended
  // render path turns the empty result into a muted "—" marker, not a blank pill (P4)
  assert.ok(_src.includes('gr-seq-end'), 'once-exhaustion end marker class missing');
  assert.ok(_src.includes("ended ? '—'"), 'end-marker render branch missing');
});

// ── prototype-key safety: names colliding with Object.prototype must not crash
// or resolve to inherited members. Pure cores must return null/marker, never throw.
test('parseMarkov — a state named "constructor" does not throw', () => {
  const p = c.parseMarkov('constructor -> a');
  assert.deepEqual(host(p.trans.constructor), [{ to: 'a', w: 1 }]);
  // walking a chain that targets such a state must not throw either
  const p2 = c.parseMarkov('a -> constructor\nconstructor -> a');
  assert.ok(Array.isArray(c.walkMarkov(p2, 'a', 3)));
});

test('parseDice — a modifier named after an Object.prototype key is rejected, not NaN', () => {
  assert.equal(c.parseDice('2d6+constructor', {}), null);
  assert.equal(c.parseDice('2d6+__proto__', {}), null);
  assert.equal(c.parseDice('2d6+hasOwnProperty', {}), null);
});

test('parseRules — rule named "constructor" is a real rule, not rejected', () => {
  const p = c.parseRules('constructor: x | y');
  assert.deepEqual(host(p.order), ['constructor']);
  assert.ok(p.rules.constructor, 'constructor should be a real own rule');
});

test('runGrammar — {constructor} on an empty namespace yields the unknown marker', () => {
  assert.equal(c.runGrammar('origin: {constructor}', 'origin', {}, {}), '{constructor?}');
  assert.equal(c.runGrammar('origin: {__proto__}', 'origin', {}, {}), '{__proto__?}');
});

// ── tables (model ↔ markdown) ──────────────────────────────────────────────
test('parseTable / serializeTable — alignment + round-trip', () => {
  const t = c.parseTable('| a | b |\n| --- | :-: |\n| 1 | 2 |');
  assert.deepEqual(host(t.aligns), [null, 'center']);
  assert.deepEqual(host(t.rows), [['a', 'b'], ['1', '2']]);
  // serialize normalizes the center marker to :---:
  assert.equal(c.serializeTable(t), '| a | b |\n| --- | :---: |\n| 1 | 2 |');
});

test('parseTable — a backslash that is not \\\\ or \\| is literal content (not eaten)', () => {
  // A Windows path / LaTeX snippet typed raw must survive; only \\ and \| are escapes.
  const t = c.parseTable('| path | x |\n| --- | --- |\n| C:\\new\\dir | 1 |');
  assert.deepEqual(host(t.rows[1]), ['C:\\new\\dir', '1']);
  // round-trip through serialize→parse is still exact (serialize escapes \ → \\)
  const round = c.parseTable(c.serializeTable(t));
  assert.deepEqual(host(round.rows[1]), ['C:\\new\\dir', '1']);
  // an escaped pipe inside a cell does not split the cell
  assert.deepEqual(host(c.parseTable('| a \\| b | c |\n|---|---|').rows[0]), ['a | b', 'c']);
});

test('formatMathResult — a large exact integer prints in full (no 10-sig-fig truncation)', () => {
  // Regression: the value is persisted into node.text by table recompute, so a
  // truncated integer would be SAVED, not just shown.
  assert.equal(c.formatMathResult(123456789012), '123456789012');
  assert.equal(c.formatMathResult(10000000001), '10000000001');
  assert.equal(c.formatMathResult(-99999999999), '-99999999999');
  assert.equal(c.formatMathResult(7), '7');          // small integers unchanged
  assert.equal(c.formatMathResult(0), '0');
});

// ── markdown helpers ───────────────────────────────────────────────────────
test('stripMd — strips inline markers and link/code syntax', () => {
  assert.equal(c.stripMd('**bold** and `code` and [x](y)'), 'bold and code and x');
});

test('mdToHtml — ATX heading becomes a real <h1>', () => {
  assert.equal(c.mdToHtml('# Title'), '<h1 class="md-h">Title</h1>');
});

// Regression: an EMPTY to-do (`- [ ]` with no trailing space/content — e.g. you
// backspaced its label and the space) must still render a checkbox, not a literal
// `[ ]`. The bug was TASK_RE requiring `\s+` after the bracket; the fix makes the
// trailing content optional. Render and the click-toggle regex must agree on which
// lines are tasks, or data-task indices desync.
test('mdToHtml — empty `- [ ]` / `- [x]` render as checkboxes, not literal brackets', () => {
  const empty = c.mdToHtml('- [ ]');
  assert.ok(empty.includes('md-task-check'), 'empty - [ ] must render a checkbox');
  assert.ok(!/<li>\[/.test(empty), 'must not fall through to a literal [ ] list item');
  const emptyX = c.mdToHtml('- [x]');
  assert.ok(emptyX.includes('md-task-check') && emptyX.includes('checked'), 'empty - [x] is a checked checkbox');
  // GFM still needs the space: `- [ ]bar` (no space) stays a plain list item
  assert.ok(!c.mdToHtml('- [ ]bar').includes('md-task-check'), '- [ ]bar (no space) is not a task');
  // data-task numbering is contiguous across an empty middle task (render↔toggle align)
  const mixed = c.mdToHtml('- [ ] first\n- [ ]\n- [x] third');
  const tasks = [...mixed.matchAll(/data-task="(\d+)"/g)].map(m => m[1]);
  assert.deepEqual(host(tasks), ['0', '1', '2']);
  // the toggle path shares the checkbox token with render via TASK_LINE_RE (F4), so
  // its data-task index can't desync from the rendered checkboxes
  assert.ok(_src.includes('const TASK_LINE_RE'), 'TASK_LINE_RE must be defined in the grammar block');
  assert.ok(_src.includes('TASK_BOX_CAP.source'), 'TASK_LINE_RE / TASK_RE must compose the shared box token');
  assert.ok(_src.includes('lines[i].match(TASK_LINE_RE)'), 'toggleTaskInNode must use the shared TASK_LINE_RE');
  // search/breadcrumb stripping doesn't leak a literal [ ] for an empty to-do
  assert.equal(c.stripMd('- [ ]'), '');
  assert.equal(c.stripMd('- [ ] foo'), 'foo');
});

// Cross-site guardrail (code-review F4): the empty-`- [ ]` bug recurred because each
// task-aware function re-spelled the checkbox grammar and one drifted. This pins that
// EVERY task-aware pure function agrees an empty `- [ ]` / `- [x]` is a task — if a
// future edit (or a missed site) drifts the boundary rule again, this fails.
test('task grammar: all task-aware functions agree an empty `- [ ]` is a task (F4)', () => {
  for (const box of ['- [ ]', '- [x]']) {
    assert.ok(c.isTaskFirst(box), `isTaskFirst should accept ${box}`);
    assert.ok(c.mdToHtml(box).includes('md-task-check'), `mdToHtml should render a checkbox for ${box}`);
    assert.equal(c.tallyMarkers(box).total, 1, `tallyMarkers should count ${box} as one marker`);
    assert.equal(c.stripMd(box), '', `stripMd should strip ${box} clean`);
    assert.equal(c.migrateEmphasisText(box, true, false), box, `migrateEmphasisText must not wrap ${box}`);
    assert.equal(c.textForDisplay({ text: box, type: 'todo' }), '', `textForDisplay should strip ${box}'s marker`);
  }
  // done-ness still derives correctly: empty box = open, checked box = done
  assert.equal(c.todoDoneFromText('- [ ]'), false);
  assert.equal(c.todoDoneFromText('- [x]'), true);
  // ordered tasks count too, and a checked one tallies as done
  assert.deepEqual(host(c.tallyMarkers('1. [ ]\n2. [x]')), { done: 1, total: 2 });
});

// Regression (code-review F1): the 4th task-marker regex — legacy italic/underline
// migration — also required a trailing space, so an empty `- [ ]` had its bracket
// wrapped in emphasis (`- *[ ]*`) instead of staying a task. The marker is a prefix
// only when followed by a space OR end-of-line.
test('migrateEmphasisText — empty `- [ ]` keeps its task marker, never wraps the bracket', () => {
  // empty task: nothing to emphasise → line unchanged (bracket NOT wrapped)
  assert.equal(c.migrateEmphasisText('- [ ]', true, false), '- [ ]');
  assert.equal(c.migrateEmphasisText('- [x]', false, true), '- [x]');
  // a task WITH a body still wraps only the body, keeping the marker as prefix
  assert.equal(c.migrateEmphasisText('- [ ] buy milk', true, false), '- [ ] *buy milk*');
  // a non-task `[ ]bar` (no space) is ordinary body and wraps whole (no regression)
  assert.equal(c.migrateEmphasisText('- [ ]bar', true, false), '- *[ ]bar*');
  // plain bullet unaffected
  assert.equal(c.migrateEmphasisText('- hello', true, false), '- *hello*');
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

// ── per-point notes ──────────────────────────────────────────────────────────
test('note — toOpml writes _note (newline-encoded) only when non-empty', () => {
  const root = c.mkRoot();
  const n = c.mkNode('point');
  n.note = 'a note\nsecond line';
  root.children.push(n);
  root.children.push(c.mkNode('no note here'));
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_note="a note&#10;second line"'), 'note serialized with encoded newline');
  assert.equal(xml.match(/_note=/g).length, 1, 'empty notes write no attribute');
});

test('note — markdown export emits note as indented continuation lines', () => {
  const root = c.mkRoot();
  const n = c.mkNode('item');
  n.note = 'context line';
  root.children.push(n);
  const md = c.toMarkdown(root);
  assert.ok(md.includes('- item\n  context line'), md);
});

test('note — plain-text export emits note indented under the item', () => {
  const root = c.mkRoot();
  const n = c.mkNode('item');
  n.note = 'why this matters';
  root.children.push(n);
  const txt = c.toPlainText(root);
  assert.ok(txt.includes('item\n\twhy this matters'), txt);
});

test('note — the global toggle and its hidden-note indicator are wired (src pins)', () => {
  // the header front door (P2): a real button with pressed state
  assert.ok(_src.includes('id="btn-notes"'), 'btn-notes button missing');
  assert.ok(_src.includes("getElementById('btn-notes').addEventListener"), 'toggle handler missing');
  // hiding is not silent (P4): the indicator render path + its keyboard twin (P3)
  assert.ok(_src.includes('appendNoteIndicator'), 'indicator builder missing');
  assert.ok(_src.includes("closest?.('.note-ind')"), 'indicator Enter/Space branch missing');
  // the toggle state rides the autosave payload
  assert.ok(_src.includes('showDone, showNotes'), 'showNotes not persisted in autosave payload');
});

test('toOpml — encodes tabs/CRs as char refs (would otherwise collapse to spaces)', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode('a\tb\rc'));
  const xml = c.toOpml(root);
  assert.ok(xml.includes('text="a&#9;b&#13;c"'), 'tab → &#9;, CR → &#13; survive attribute normalization');
});

test('toOpml — strips C0 control chars XML forbids (keeps the file loadable)', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode('a\x0Bb\x00c'));   // vertical tab + NUL are illegal in XML 1.0
  const xml = c.toOpml(root);
  assert.ok(xml.includes('text="abc"'), 'illegal control chars are dropped, not emitted raw');
  assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(xml), 'no raw control char remains in the document');
});

test('toOpml — strips lone surrogates and U+FFFE/U+FFFF; valid emoji pairs survive', () => {
  // U+FFFE/U+FFFF and unpaired surrogate halves are also illegal in XML 1.0, but a
  // surrogate inside a valid pair (😀 is \uD83D\uDE00) is legal and must NOT be eaten.
  const root = c.mkRoot();
  root.children.push(c.mkNode('a😀b\uD800c\uFFFEd\uDC00e'));
  const xml = c.toOpml(root);
  assert.ok(xml.includes('text="a😀bcde"'), `emoji kept, lone halves + noncharacters dropped: ${xml.match(/text="[^"]*"/)?.[0]}`);
});

test('toOpml — _id is attribute-escaped (a hostile imported id cannot break the XML)', () => {
  const root = c.mkRoot();
  const n = c.mkNode('x');
  n.id = 'a"b<c';
  root.children.push(n);
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_id="a&quot;b&lt;c"'), '_id must go through ex() like every other attribute');
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

// ── C1: self-contained HTML export (embed/extract data-island round-trip) ────
const SHELL = '<!DOCTYPE html>\n<html><head><style>.x{}</style></head><body>\n'
  + '<script type="application/xml" id="pl-embedded-doc"></script>\n'
  + '<div id="outline"></div>\n<script>var z = 1;</script>\n</body></html>';

test('embedOpmlIntoHtml injects OPML into the empty data-island, leaving the rest intact', () => {
  const opml = '<opml version="2.0"><body><outline text="hi"/></body></opml>';
  const out = c.embedOpmlIntoHtml(SHELL, opml);
  assert.ok(out.includes('id="pl-embedded-doc">' + opml + '</script>'), 'OPML not injected into island');
  assert.ok(out.includes('var z = 1;'), 'app script must be preserved');
  assert.ok(out.includes('<div id="outline"></div>'), 'shell structure must be preserved');
  assert.ok(out.startsWith('<!DOCTYPE html>'), 'doctype preserved');
});

test('extractEmbeddedOpml is the inverse of embed (round-trip); empty island → empty string', () => {
  const opml = c.toOpml((() => { const r = c.mkRoot(); r.children.push(c.mkNode('point #tag')); return r; })());
  const out = c.embedOpmlIntoHtml(SHELL, opml);
  assert.equal(c.extractEmbeddedOpml(out), opml.trim(), 'embed→extract must round-trip the OPML');
  assert.equal(c.extractEmbeddedOpml(SHELL), '', 'an empty island extracts to empty string');
  // the round-tripped OPML still carries the point text verbatim (fromOpml itself needs a
  // DOMParser the Node harness lacks — its re-parse is covered by the browser verification)
  assert.ok(c.extractEmbeddedOpml(out).includes('point #tag'), 'extracted OPML must carry the point');
});

test('embed re-injects over an already-filled island (idempotent re-export)', () => {
  const first = c.embedOpmlIntoHtml(SHELL, '<opml><body><outline text="a"/></body></opml>');
  const second = c.embedOpmlIntoHtml(first, '<opml><body><outline text="b"/></body></opml>');
  assert.equal(c.extractEmbeddedOpml(second), '<opml><body><outline text="b"/></body></opml>');
  assert.ok(!second.includes('text="a"'), 'stale payload must be replaced, not appended');
});

test('C1 front-door + hydrate wiring (src pins)', () => {
  assert.ok(_src.includes('id="pl-embedded-doc"'), 'data-island element missing');
  assert.ok(_src.includes('id="btn-export-html"'), 'export menu item missing');
  assert.ok(_src.includes("getElementById('btn-export-html').addEventListener"), 'export wiring missing');
  assert.ok(_src.includes('function exportSelfContainedHtml('), 'export function missing');
  assert.ok(_src.includes('function restoreEmbeddedDoc('), 'hydrate-on-load missing');
  assert.ok(_src.includes('if (loadedFromEmbed) return;'), 'embed-wins-over-autosave guard missing');
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

test('collectVars — a variable named "constructor" resolves, not crashes', () => {
  // VAR_NAME_RE accepts it, so it's reachable from the dialog. On plain-object maps
  // pass 1 threw (allKeysForName.constructor is the inherited Object function —
  // `||= []` skips it, `.push` explodes) — and collectVars runs on every render.
  const vars = c.collectVars(mkVarRoot([['k1', 'constructor', '5']]));
  assert.equal(vars.constructor, 5);
  // another var can reference it (resolution goes through the same name maps)
  const vars2 = c.collectVars(mkVarRoot([['k1', 'constructor', '5'], ['k2', 'd', 'constructor*2']]));
  assert.equal(vars2.d, 10);
});

test('collectVars — a variable named "__proto__" is a real var (not a silent prototype write)', () => {
  const vars = c.collectVars(mkVarRoot([['k1', '__proto__', '7']]));
  assert.equal(vars['__proto__'], 7);
});

test('collectRules — a grammar pill registers its named rules document-wide', () => {
  const root = c.mkRoot();
  const n = c.mkNode('[[grammar:g1]]');
  n.grammar = [{ key: 'g1', def: 'color: red | blue', origin: 'color', result: 'red' }];
  root.children.push(n);
  assert.ok('color' in c.collectRules(root), 'named grammar rule should be registered');
});

test('collectRules — an anonymous shorthand pill does NOT leak its synthetic `origin` (UXP-33)', () => {
  const root = c.mkRoot();
  const n = c.mkNode('shorthand [[grammar:a1]] plus named [[grammar:n1]]');
  n.grammar = [
    { key: 'a1', def: 'origin: red | blue', origin: 'origin', result: 'red', anon: true },
    { key: 'n1', def: 'color: green | yellow', origin: 'color', result: 'green' },
  ];
  root.children.push(n);
  const rules = c.collectRules(root);
  assert.ok(!('origin' in rules), 'synthetic origin from an anonymous pill must not be document-wide');
  assert.ok('color' in rules, 'a co-located named rule still registers');
});

test('collectRules — a NAMED grammar with an explicit origin: rule still registers it', () => {
  // the dialog example literally uses `origin:` — a user-named `origin` rule (no anon
  // flag) must stay callable, so UXP-33 keys on the flag, never the name.
  const root = c.mkRoot();
  const n = c.mkNode('[[grammar:g1]]');
  n.grammar = [{ key: 'g1', def: 'origin: a {x}\nx: b | c', origin: 'origin', result: 'a b' }];
  root.children.push(n);
  assert.ok('origin' in c.collectRules(root), 'a deliberately-named origin rule still registers');
});

// ── roll-table → grammar collapse (June 2026) ────────────────────────────────
// A named roll table IS a one-rule grammar. The separate artifact retired;
// legacy records migrate on load. Pins: the def conversion (incl. the
// round-trip refusal guard), the per-node migration (token rewrite, frozen
// result preserved, anon for unnamed), and end-to-end {name} resolution.

test('rolltableDefToRules — entries+weights convert to one weighted-alternation rule', () => {
  assert.equal(c.rolltableDefToRules('sword\nshield 2\n{2d6} gold 3', 'loot'),
    'loot: sword | shield 2 | {2d6} gold 3');
  assert.equal(c.rolltableDefToRules('boo', ''), 'origin: boo');       // unnamed → synthetic origin
  assert.equal(c.rolltableDefToRules('', 'loot'), null);               // empty def
  assert.equal(c.rolltableDefToRules('a', '9bad'), null);              // invalid rule name
  // round-trip refusal: an entry with a top-level | would silently change meaning
  assert.equal(c.rolltableDefToRules('this | that\nother', 'risky'), null);
});

test('migrateRolltables — record → grammar (frozen result kept), token rewritten, sidecar dropped', () => {
  const n = c.mkNode('pick: [[rolltable:rt1]]');
  n.rolltable = [{ key: 'rt1', name: 'loot', def: 'sword\nshield 2', result: 'a sword' }];
  c.migrateRolltables(n);
  assert.equal(n.text, 'pick: [[grammar:rt1]]');
  assert.equal(n.rolltable, undefined);
  const g = n.grammar.find(x => x.key === 'rt1');
  assert.equal(g.def, 'loot: sword | shield 2');
  assert.equal(g.origin, 'loot');
  assert.equal(g.result, 'a sword');          // a migration NEVER re-rolls
  assert.ok(!g.anon, 'named table registers doc-wide');
});

test('migrateRolltables — unnamed table becomes an anon grammar (UXP-33 rule)', () => {
  const n = c.mkNode('[[rolltable:rt2]]');
  n.rolltable = [{ key: 'rt2', def: 'a\nb', result: 'a' }];
  c.migrateRolltables(n);
  const g = n.grammar.find(x => x.key === 'rt2');
  assert.equal(g.anon, true);
  assert.equal(g.def, 'origin: a | b');
});

test('migrateRolltables — unconvertible record drops (dead ? pill), token still rewritten', () => {
  const n = c.mkNode('[[rolltable:rt3]]');
  n.rolltable = [{ key: 'rt3', name: 'risky', def: 'this | that\nother', result: 'x' }];
  c.migrateRolltables(n);
  assert.equal(n.text, '[[grammar:rt3]]');
  assert.ok(!(n.grammar || []).some(x => x.key === 'rt3'));
});

test('collapse end-to-end — a migrated named table resolves as {name} document-wide', () => {
  const root = c.mkRoot();
  const n = c.mkNode('[[rolltable:rt1]]');
  n.rolltable = [{ key: 'rt1', name: 'loot', def: 'gold\nsilver', result: 'gold' }];
  root.children.push(n);
  c.migrateRolltables(n);
  const rules = c.collectRules(root);
  assert.ok('loot' in rules, 'migrated table registers as a grammar rule');
  c.seedSequence([0.1]);
  try {
    assert.equal(c.runGrammar('out: {loot}!', 'out', rules, {}), 'gold!');
  } finally { c.resetRandom(); }
});

// ── declarative data packs (plugins) ────────────────────────────────────────
// A <_plugins> pack is pure DATA merged into the generative namespace through the
// existing restricted engines (parseRules for rules, evalMath for vars) — never
// code. Pack rules/vars become callable doc-wide; a document-authored name of the
// same kind OVERRIDES the pack on collision (packs merge first, last-wins). Malformed
// packs are dropped/neutralized, never thrown on. (guidance/plugins-direction.md.)

test('plugin packs — validPluginPack keeps a {id:string} object, drops everything else', () => {
  assert.equal(c.validPluginPack({ id: 'p' }), true);
  assert.equal(c.validPluginPack({ id: 'p', rules: 'a: b' }), true);
  assert.equal(c.validPluginPack({}), false);            // no id
  assert.equal(c.validPluginPack({ id: 5 }), false);     // id not a string
  assert.equal(c.validPluginPack(null), false);
  assert.equal(c.validPluginPack('x'), false);
  assert.equal(c.validPluginPack([{ id: 'p' }]), false); // an array is not a pack
});

test('plugin packs — mergePackRules is defensive and later-pack-wins', () => {
  const target = Object.create(null);
  c.mergePackRules(target, [
    { id: 'a', rules: 'color: red' },
    { id: 'b', rules: 'color: blue' },   // later pack wins on a name collision
    { id: 'c', rules: 'bogus line' },    // parseRules → null → skipped
    { rules: 'beast: ogre' },            // no id → skipped
  ]);
  assert.ok('color' in target);
  assert.equal(target.color[0].template, 'blue', 'later pack wins on a rule-name collision');
  assert.ok(!('beast' in target), 'an id-less pack is skipped');
});

test('plugin packs — packVarDefs flattens only well-formed {name,expr} entries', () => {
  const defs = host(c.packVarDefs([
    { id: 'a', vars: [{ name: 'x', expr: '1' }, { name: 'y' }, { expr: '2' }, 'junk'] },
    { id: 'b', vars: 'not-an-array' },   // dropped
    { vars: [{ name: 'z', expr: '3' }] },// no id → whole pack dropped
  ]));
  assert.deepEqual(defs, [{ name: 'x', expr: '1' }]);
});

test('plugin packs — a pack rule is callable document-wide', () => {
  const root = c.mkRoot();
  root.plugins = [{ id: 'p', rules: 'color: red | blue' }];
  const rules = c.collectRules(root);
  assert.ok('color' in rules, 'pack rule should register doc-wide');
  c.seedSequence([0.1]);
  try {
    const out = c.runGrammar('o: {color}', 'o', rules, {});
    assert.ok(out === 'red' || out === 'blue', `pack rule expanded to ${out}`);
  } finally { c.resetRandom(); }
});

test('plugin packs — a document rule OVERRIDES a pack rule on a name collision', () => {
  const root = c.mkRoot();
  root.plugins = [{ id: 'p', rules: 'color: red | blue' }];
  const n = c.mkNode('[[grammar:g1]]');
  n.grammar = [{ key: 'g1', def: 'color: green', origin: 'color', result: 'green' }];
  root.children.push(n);
  const rules = c.collectRules(root);
  assert.equal(c.runGrammar('o: {color}', 'o', rules, {}), 'green');
});

test('plugin packs — a formula pack variable resolves and composes', () => {
  const root = c.mkRoot();
  root.plugins = [{ id: 'p', vars: [{ name: 'tax', expr: '0.1' }] }];
  assert.equal(c.collectVars(root).tax, 0.1);
  assert.equal(c.evalMath('100*tax', c.collectVars(root)), 10);
});

test('plugin packs — a document variable OVERRIDES a pack variable on a name collision', () => {
  const root = c.mkRoot();
  root.plugins = [{ id: 'p', vars: [{ name: 'tax', expr: '0.1' }] }];
  const n = c.mkNode('[[var:k1]]');
  n.vars = [{ key: 'k1', name: 'tax', expr: '0.25' }];
  root.children.push(n);
  assert.equal(c.collectVars(root).tax, 0.25);
});

test('plugin packs — a malformed/hostile pack is neutralized, never throws', () => {
  // rule text that isn't a rule line → parseRules null → no rule registered
  const r1 = c.mkRoot(); r1.plugins = [{ id: 'p', rules: 'not a rule line' }];
  assert.doesNotThrow(() => c.collectRules(r1));
  assert.equal(Object.keys(c.collectRules(r1)).length, 0);
  // vars not an array → dropped
  const r2 = c.mkRoot(); r2.plugins = [{ id: 'p', vars: 'oops' }];
  assert.doesNotThrow(() => c.collectVars(r2));
  assert.equal(Object.keys(c.collectVars(r2)).length, 0);
  // a cyclic pack var fails visibly (broken like any var), doesn't hang
  const r3 = c.mkRoot(); r3.plugins = [{ id: 'p', vars: [{ name: 'a', expr: 'a+1' }] }];
  assert.equal('a' in c.collectVars(r3), false);
  // a pack missing id → dropped entirely (neither its rules nor vars apply)
  const r4 = c.mkRoot(); r4.plugins = [{ rules: 'color: red', vars: [{ name: 'x', expr: '1' }] }];
  assert.ok(!('color' in c.collectRules(r4)));
  assert.ok(!('x' in c.collectVars(r4)));
});

test('plugin packs — toOpml round-trips <_plugins> (present when set, absent when empty)', () => {
  const root = c.mkRoot();
  root.plugins = [{ id: 'fantasy', rules: 'npc: knight | rogue', vars: [{ name: 'gold', expr: '50' }] }];
  const xml = c.toOpml(root);
  assert.ok(xml.includes('<_plugins>'), 'non-empty plugins emit a <_plugins> head element');
  assert.ok(xml.includes('fantasy'), 'the pack id is serialized into the head');
  assert.ok(!c.toOpml(c.mkRoot()).includes('<_plugins>'), 'empty plugins → no <_plugins> element (mirrors _templates)');
});

// ── data-pack MANAGER model (#487) ──────────────────────────────────────────
test('pluginPackActive — active unless enabled:false (absent = active, back-compat)', () => {
  assert.equal(c.pluginPackActive({ id: 'p' }), true, 'no enabled field → active');
  assert.equal(c.pluginPackActive({ id: 'p', enabled: true }), true);
  assert.equal(c.pluginPackActive({ id: 'p', enabled: false }), false, 'enabled:false → inactive');
  assert.equal(c.pluginPackActive({ enabled: true }), false, 'still needs a valid id');
});

test('a DISABLED pack drops out of collectRules / collectVars', () => {
  const root = c.mkRoot();
  root.plugins = [{ id: 'p', enabled: false, rules: 'color: red', vars: [{ name: 'tax', expr: '0.1' }] }];
  assert.ok(!('color' in c.collectRules(root)), 'disabled pack rules do not register');
  assert.ok(!('tax' in c.collectVars(root)), 'disabled pack vars do not register');
  // re-enabling brings them back
  root.plugins = c.togglePluginPack(root.plugins, 'p');
  assert.ok('color' in c.collectRules(root), 'toggled back on → rules register');
  assert.equal(c.collectVars(root).tax, 0.1);
});

test('manager list ops — new / update / remove / toggle are pure, id-keyed', () => {
  let seq = 0; const gen = () => 'id' + (++seq);
  const p = c.newPluginPack('My Pack', gen);
  assert.deepEqual(host(p), { id: 'id1', name: 'My Pack', rules: '', vars: [], enabled: true });
  // a blank name falls back to "pack" (uses its own gen so the shared counter below stays clean)
  assert.equal(c.newPluginPack('', () => 'tmp').name, 'pack', 'blank name falls back to "pack"');
  const list = [p, c.newPluginPack('Other', gen)]; // p=id1, Other=id2
  // update shallow-merges by id, leaves others untouched (new array)
  const upd = c.updatePluginPack(list, 'id1', { rules: 'a: b' });
  assert.equal(upd.find(x => x.id === 'id1').rules, 'a: b');
  assert.equal(upd.find(x => x.id === 'id2').name, 'Other', 'other packs untouched');
  assert.notEqual(upd, list, 'returns a new array (pure)');
  // toggle flips enabled (absent/ true → false → true)
  assert.equal(c.togglePluginPack(list, 'id1')[0].enabled, false);
  assert.equal(c.togglePluginPack(c.togglePluginPack(list, 'id1'), 'id1')[0].enabled, true);
  // remove drops just that id
  assert.deepEqual(c.removePluginPack(list, 'id1').map(x => x.id), ['id2']);
});

test('packLabel — name, else id, else "(unnamed)"', () => {
  assert.equal(c.packLabel({ id: 'x', name: 'Pretty' }), 'Pretty');
  assert.equal(c.packLabel({ id: 'x' }), 'x');
  assert.equal(c.packLabel({ id: 'x', name: '  ' }), 'x', 'a blank name falls back to id');
  assert.equal(c.packLabel(null), '(unnamed)');
});

// ── per-name appearance config (#464) ──────────────────────────────────────
test('tagColorOf — returns a configured swatch, null otherwise, hierarchical', () => {
  const ap = { tags: { urgent: 'red', thread: 'teal' }, props: {} };
  assert.equal(c.tagColorOf('urgent', ap), 'red');
  assert.equal(c.tagColorOf('#urgent', ap), 'red', 'leading # is stripped');
  assert.equal(c.tagColorOf('URGENT', ap), 'red', 'case-insensitive');
  assert.equal(c.tagColorOf('unset', ap), null, 'an unconfigured tag has no color');
  // hierarchical: a color on `thread` also colors `thread/torn-letter` (nearest ancestor)
  assert.equal(c.tagColorOf('thread/torn-letter', ap), 'teal');
  assert.equal(c.tagColorOf('thread/sub/deep', ap), 'teal');
  // an unknown color value is ignored (only the curated swatch names apply)
  assert.equal(c.tagColorOf('x', { tags: { x: 'chartreuse' }, props: {} }), null);
});
test('propIconOf — returns a configured in-subset icon, null otherwise', () => {
  const ap = { tags: {}, props: { cost: 'fa-dollar-sign' } };
  assert.equal(c.propIconOf('cost', ap), 'fa-dollar-sign');
  assert.equal(c.propIconOf(' Cost ', ap), 'fa-dollar-sign', 'trimmed + case-insensitive');
  assert.equal(c.propIconOf('owner', ap), null);
  // an icon not in the shortlist is ignored (guards against a hand-edited OPML)
  assert.equal(c.propIconOf('x', { tags: {}, props: { x: 'fa-rocket' } }), null);
});
test('setTagColor / setPropIcon — set, clear, and reject unknown values', () => {
  const ap = { tags: {}, props: {} };
  c.setTagColor(ap, '#Urgent', 'red');
  assert.equal(ap.tags.urgent, 'red', 'key normalized (no #, lowercased)');
  c.setTagColor(ap, 'urgent', '');            // falsy clears
  assert.equal('urgent' in ap.tags, false, 'empty color removes the mapping');
  c.setTagColor(ap, 'urgent', 'chartreuse');  // unknown swatch is a no-op
  assert.equal('urgent' in ap.tags, false, 'an unknown swatch is not stored');
  c.setPropIcon(ap, 'Cost', 'fa-dollar-sign');
  assert.equal(ap.props.cost, 'fa-dollar-sign');
  c.setPropIcon(ap, 'cost', 'fa-rocket');     // not in shortlist
  assert.equal(ap.props.cost, 'fa-dollar-sign', 'a non-shortlist icon leaves the mapping unchanged');
  c.setPropIcon(ap, 'cost', null);            // clear
  assert.equal('cost' in ap.props, false);
});
test('normalizeAppearance — keeps only well-shaped name→known-value, never throws', () => {
  const cleaned = host(c.normalizeAppearance({
    tags: { good: 'red', bad: 'neon', UP: 'blue' },
    props: { cost: 'fa-dollar-sign', x: 'fa-rocket' },
    junk: 42,
  }));
  assert.deepEqual(cleaned, { tags: { good: 'red', up: 'blue' }, props: { cost: 'fa-dollar-sign' } });
  assert.deepEqual(host(c.normalizeAppearance(null)), { tags: {}, props: {} });
  assert.deepEqual(host(c.normalizeAppearance('nope')), { tags: {}, props: {} });
});
test('appearance serializes to OPML <_appearance> (present when set, absent when empty); normalizeAppearance is the parse-back guard', () => {
  const root = c.mkRoot();
  root.appearance = { tags: { urgent: 'red' }, props: { cost: 'fa-dollar-sign' } };
  const xml = c.toOpml(root);
  assert.ok(xml.includes('<_appearance>'), 'non-empty appearance emits the head element');
  assert.ok(xml.includes('urgent') && xml.includes('fa-dollar-sign'), 'the mappings are serialized');
  // empty appearance emits nothing (mirrors _plugins / _templates)
  assert.ok(!c.toOpml(c.mkRoot()).includes('<_appearance>'), 'empty appearance → no head element');
  // the parse-back path (fromOpml needs a DOM; normalizeAppearance is the pure validator it runs)
  assert.deepEqual(host(c.normalizeAppearance(root.appearance)), { tags: { urgent: 'red' }, props: { cost: 'fa-dollar-sign' } },
    'the stored shape survives the load-time validator unchanged');
});
test('appearance is display-only wired at the render sites (#464)', () => {
  assert.ok(/tagColorOf\(t\)/.test(_src) && /data-color="\$\{col\}"/.test(_src), 'the hashtag render reads tagColorOf');
  assert.ok(/propIconOf\(propK\)/.test(_src), 'the property chip render reads propIconOf');
  // live-caught regression guard: the per-color rule MUST restate `color` (not only --tc), or
  // `.node-content a{color:var(--acc)}` (0,1,1) wins over `.hashtag{color}` (0,1,0) and the tag
  // renders accent instead of the chosen swatch. The [data-color] selector is 0,2,0, so it wins.
  assert.ok(/\.hashtag\[data-color\]\{color:var\(--tc\)/.test(_src), 'the [data-color] rule re-applies color to beat .node-content a');
  // the icon shortlist is only in-subset glyphs (no CDN / no blank icon)
  const m = _src.match(/FA_GLYPHS\s*=\s*new Set\(\[([^\]]*)\]/);
  const subset = new Set(m[1].replace(/'/g, '').split(',').map(s => s.trim()));
  const iconLit = _src.match(/APPEARANCE_ICONS\s*=\s*\[([^\]]*)\]/)[1];
  const icons = iconLit.replace(/'/g, '').split(',').map(s => s.trim()).filter(Boolean);
  assert.ok(icons.length >= 8, 'a usable icon shortlist');
  for (const g of icons) assert.ok(subset.has(g), `${g} must be in the embedded FA subset`);
});

test('isValidTagName — accepts the hashtag grammar, rejects unrenderable names (#464 review)', () => {
  assert.equal(c.isValidTagName('urgent'), true);
  assert.equal(c.isValidTagName('#urgent'), true, 'a leading # is fine');
  assert.equal(c.isValidTagName('thread/torn-letter'), true, 'nested + hyphen');
  assert.equal(c.isValidTagName('my tag'), false, 'a space is not a tag');
  assert.equal(c.isValidTagName('café'), false, 'non-word chars rejected (would never render)');
  assert.equal(c.isValidTagName(''), false);
  assert.equal(c.isValidTagName('a/'), false, 'a trailing slash is not a valid segment');
});

test('appearance dialog — review fixes wired (focus by section, name validation, renamed menu)', () => {
  // #464 review #1: focus returns to the section acted in, not always the tag input
  assert.ok(/_apprFocus === 'prop' \? propIn : tagIn\)\.focus\(\)/.test(_src), 'focus restore honors the acted-on section');
  assert.ok(/_apprFocus = 'prop'/.test(_src) && /_apprFocus = 'tag'/.test(_src), 'handlers set the focus section');
  // #464 review #3: a swatch click validates the tag name (no silent-wrong-success)
  assert.ok(/if \(!isValidTagName\(name\)\)/.test(_src), 'the dialog validates the tag name before storing a color');
  // #464 review #2: the menu label no longer collides with the theme "Appearance" controls
  assert.ok(/<span class="cmd-label">Tag &amp; property styling<\/span>/.test(_src), 'menu item renamed to avoid the Appearance collision');
  // finding A: applyAutosaveData backfills the {tags,props} shape for a pre-feature autosave
  assert.ok(/root\.appearance = normalizeAppearance\(root\.appearance\)/.test(_src), 'old autosave gets a normalized appearance shape');
});

test('parsePackImport — the trust boundary: valid packs only, [] on junk, never throws', () => {
  // a JSON array of packs
  assert.deepEqual(host(c.parsePackImport('[{"id":"a","rules":"x: y"}]').map(p => p.id)), ['a']);
  // the export wrapper shape { plugins: [...] }
  assert.deepEqual(host(c.parsePackImport('{"plugins":[{"id":"b"}]}').map(p => p.id)), ['b']);
  // malformed entries are dropped, valid ones kept
  assert.deepEqual(host(c.parsePackImport('[{"id":"a"},{"no":"id"},"junk",5]').map(p => p.id)), ['a']);
  // broken JSON / wrong shape → [] (never throws — this is the import trust boundary)
  assert.deepEqual(host(c.parsePackImport('not json')), []);
  assert.deepEqual(host(c.parsePackImport('{"nope":1}')), []);
  assert.deepEqual(host(c.parsePackImport(42)), []);
  // accepts an already-parsed value too
  assert.deepEqual(host(c.parsePackImport([{ id: 'z' }]).map(p => p.id)), ['z']);
});

test('parsePackVarLines — name = expr per line; blank skipped, malformed surfaced (#487)', () => {
  const r = c.parsePackVarLines('tax = 0.2\n\narea = pi * 4^2');
  assert.deepEqual(host(r.vars), [{ name: 'tax', expr: '0.2' }, { name: 'area', expr: 'pi * 4^2' }]);
  assert.deepEqual(host(r.bad), [], 'clean lines produce no bad entries; a blank line is skipped');
  // malformed lines are surfaced (P4), not silently dropped
  const b = c.parsePackVarLines('good = 1\nno equals here\n= 5\nx =');
  assert.deepEqual(host(b.vars), [{ name: 'good', expr: '1' }]);
  assert.equal(b.bad.length, 3, 'a line without a name=expr, an empty name, and an empty expr are all bad');
  // a non-identifier name is bad (would never resolve as a variable)
  assert.equal(c.parsePackVarLines('2x = 3').bad.length, 1, 'name must be an identifier');
  // the manager front door + engine toggle are wired at the source
  assert.ok(/openDataPackManager\(\)/.test(_src) && /id="btn-datapacks"/.test(_src), 'File menu opens the manager');
  assert.ok(/pluginPackActive\(p\)/.test(_src), 'the merges gate on pluginPackActive (disable toggle)');
  // adversarial-review fixes (#487):
  // BUG-1 — a New pack is a DRAFT (_packDraft), persisted to root.plugins only in save(), so Back drops it
  const nb = fnBody(_src, 'buildPackListView');
  assert.ok(/_packDraft = newPluginPack/.test(nb) && !/root\.plugins = \[\.\.\.\(root\.plugins \|\| \[\]\), p\]/.test(nb),
    'New pack creates a draft, does not persist to root.plugins before Save');
  const ev = fnBody(_src, 'buildPackEditView');
  assert.ok(/if \(isDraft\) root\.plugins = \[\.\.\.\(root\.plugins \|\| \[\]\), \{ \.\.\._packDraft/.test(ev), 'save() appends the draft only on commit');
  assert.ok(/_packDraft = null/.test(ev), 'Back / save clear the draft');
  // BUG-2 — import dedupes ids against a RUNNING set (in-file dups get fresh ids too)
  const imp = fnBody(_src, 'importDataPacks');
  assert.ok(/seen\.add\(id\)/.test(imp) && /if \(seen\.has\(id\)\) id = uid\(\)/.test(imp), 'import dedupes ids within the file, not just against existing');
  // UX-2 — remove routes through openConfirmDialog (consistent with other destructive ops)
  assert.ok(/await openConfirmDialog\(\{[\s\S]*?Remove data pack/.test(nb), 'remove confirms like every other destructive op');
});

test('collectCallables — an anonymous pill does not advertise `origin` as a callable (UXP-33)', () => {
  const root = c.mkRoot();
  const n = c.mkNode('shorthand [[grammar:a1]]');
  n.grammar = [{ key: 'a1', def: 'origin: red | blue', origin: 'origin', result: 'red', anon: true }];
  root.children.push(n);
  assert.ok(!c.collectCallables(root).some(x => x.name === 'origin'),
    'the { autocomplete must not list a phantom origin rule');
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
test('date — today resolves per-call, not from a frozen module-level table', () => {
  // After hoisting MATH_CONSTS/FN1-3 to module scope, `today` must stay dynamic:
  // it's recomputed each call from new Date(), so a session open across midnight
  // computes the current epoch-day. Pin it to dueDateToday()'s identical formula.
  assert.equal(c.evalMath('today', {}), c.dueDateToday());
  assert.equal(c.evalMath('today + 1', {}), c.dueDateToday() + 1);
});
test('evalMath — hoisted FN tables still dispatch (sanity after module-scope hoist)', () => {
  assert.equal(c.evalMath('sqrt(16)'), 4);   // FN1 math
  assert.equal(c.evalMath('c2f(0)'), 32);    // FN1 unit conversion
  assert.ok(Math.abs(c.evalMath('km2mi(1.609344)') - 1) < 1e-9);
  assert.equal(c.evalMath('atan2(0,1)'), 0); // FN2
  assert.equal(c.evalMath('date(2026,1,1)') + 0, c.evalMath('date(2026,1,1)')); // FN3 resolves
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
test('evalMath — daysuntil(d) counts days from today (negative if past)', () => {
  assert.equal(c.evalMath('daysuntil(today)'), 0);
  assert.equal(c.evalMath('daysuntil(today + 5)'), 5);
  assert.equal(c.evalMath('daysuntil(today - 3)'), -3);
  // pins against the same per-call today as the date helpers (not a frozen table)
  assert.equal(c.evalMath('daysuntil(date(2026,12,25))'), c.evalMath('date(2026,12,25)') - c.dueDateToday());
});
test('evalMath — daysbetween(a,b) is the absolute whole-day gap (symmetric)', () => {
  assert.equal(c.evalMath('daysbetween(date(2026,1,1), date(2026,1,8))'), 7);
  assert.equal(c.evalMath('daysbetween(date(2026,1,8), date(2026,1,1))'), 7); // symmetric
  assert.equal(c.evalMath('daysbetween(date(2026,3,1), date(2026,3,1))'), 0);
});
test('evalMath — quarter(d) returns 1–4 (completes year/month/day/weekday)', () => {
  assert.equal(c.evalMath('quarter(date(2026,1,15))'), 1);
  assert.equal(c.evalMath('quarter(date(2026,4,1))'), 2);
  assert.equal(c.evalMath('quarter(date(2026,9,30))'), 3);
  assert.equal(c.evalMath('quarter(date(2026,12,31))'), 4);
});
test('evalMath — clamp(x,lo,hi) bounds x to [lo,hi]', () => {
  assert.equal(c.evalMath('clamp(5,0,10)'), 5);
  assert.equal(c.evalMath('clamp(-1,0,10)'), 0);
  assert.equal(c.evalMath('clamp(99,0,10)'), 10);
});
test('evalMath — pctof / pctchange (÷0 → ∞ stays valid, not null)', () => {
  assert.equal(c.evalMath('pctof(25,200)'), 12.5);
  assert.equal(c.evalMath('pctchange(50,75)'), 50);
  assert.equal(c.evalMath('pctchange(80,60)'), -25);
  assert.equal(c.evalMath('pctof(5,0)'), Infinity);   // div-by-zero is a valid ∞ result
});
test('evalMath — new helpers enforce their arity (FN1/FN2/FN3 guards)', () => {
  assert.equal(c.evalMath('daysuntil()'), null);          // FN1 needs 1
  assert.equal(c.evalMath('daysuntil(1,2)'), null);
  assert.equal(c.evalMath('daysbetween(1)'), null);       // FN2 needs 2
  assert.equal(c.evalMath('clamp(1,2)'), null);           // FN3 needs 3
  assert.equal(c.evalMath('clamp(1,2,3,4)'), null);
});

// ─── uncertainty fields (B2) ──────────────────────────────────────────────────
test('rngFromSeed — deterministic per seed, in [0,1), differs across seeds', () => {
  const a = c.rngFromSeed(42), b = c.rngFromSeed(42), d = c.rngFromSeed(43);
  const seqA = [a(), a(), a()], seqB = [b(), b(), b()], seqD = [d(), d(), d()];
  assert.deepEqual(seqA, seqB, 'same seed → same stream');
  assert.notDeepEqual(seqA, seqD, 'different seed → different stream');
  for (const x of seqA) assert.ok(x >= 0 && x < 1);
});

test('parseUncertain — accepts the mini-language, rejects malformed', () => {
  assert.ok(c.parseUncertain('5 to 10'));
  assert.ok(c.parseUncertain('normal(8, 2)'));
  assert.ok(c.parseUncertain('uniform(0, 10)'));
  assert.ok(c.parseUncertain('(5 to 10) + (5 to 10)'));
  assert.ok(c.parseUncertain('2 * normal(3,1) - 1'));
  assert.ok(c.parseUncertain('sum(cost)'));
  assert.ok(c.parseUncertain('avg(score)'));
  assert.equal(c.parseUncertain(''), null);
  assert.equal(c.parseUncertain('5 to'), null);          // dangling operator
  assert.equal(c.parseUncertain('5 to 10 to 20'), null); // `to` is non-associative
  assert.equal(c.parseUncertain('bogus'), null);         // bare identifier
  assert.equal(c.parseUncertain('normal(1)'), null);     // wrong arity
  assert.equal(c.parseUncertain('sum()'), null);
  assert.equal(c.parseUncertain('5 +'), null);
});

test('sampleUncertain — 5 to 10 lands its 90% CI at the bounds', () => {
  const xs = c.sampleUncertain('5 to 10', 4000, 12345);
  const s = c.distSummary(xs);
  assert.equal(xs.length, 4000);
  assert.ok(Math.abs(s.p5 - 5) < 0.6, `p5 ≈ 5, got ${s.p5}`);
  assert.ok(Math.abs(s.p95 - 10) < 0.9, `p95 ≈ 10, got ${s.p95}`);
  assert.ok(s.p50 > 5 && s.p50 < 10, 'median inside the CI');
});

test('sampleUncertain — deterministic given (expr, seed); reseed shifts it', () => {
  const a = c.sampleUncertain('5 to 10', 1000, 777);
  const b = c.sampleUncertain('5 to 10', 1000, 777);
  const d = c.sampleUncertain('5 to 10', 1000, 778);
  assert.deepEqual(a, b, 'same seed reproduces the exact sample array (the storage model)');
  assert.notDeepEqual(a, d, 'a new seed re-samples');
});

test('sampleUncertain — normal(m,0) is constant; uniform is bounded; malformed → null', () => {
  const con = c.sampleUncertain('normal(10, 0)', 500, 5);
  assert.ok(con.every(x => Math.abs(x - 10) < 1e-9), 'zero-sd normal is the mean');
  const uni = c.sampleUncertain('uniform(0, 10)', 2000, 9);
  assert.ok(uni.every(x => x >= 0 && x <= 10), 'uniform stays in [lo,hi]');
  assert.equal(c.sampleUncertain('not valid', 100, 1), null);
});

test('sampleUncertain — (5 to 10)+(5 to 10) zips to ≈2× the mean (independence)', () => {
  const one = c.distSummary(c.sampleUncertain('5 to 10', 4000, 31));
  const two = c.distSummary(c.sampleUncertain('(5 to 10) + (5 to 10)', 4000, 31));
  assert.ok(Math.abs(two.mean - 2 * one.mean) < 0.6, `sum mean ≈ 2× single (${two.mean} vs ${2 * one.mean})`);
});

test('sampleUncertain — Phase 2: sum(prop)/avg(prop) over children’s uncertain props', () => {
  const parent = c.mkNode('');
  const mkChild = (expr) => { const n = c.mkNode(''); n.props = [{ key: 'cost', val: expr }]; return n; };
  parent.children = [mkChild('5 to 10'), mkChild('5 to 10')];
  const sm = c.distSummary(c.sampleUncertain('sum(cost)', 4000, 2024, parent));
  assert.ok(Math.abs(sm.mean - 15) < 1.2, `sum of two 5–10 children ≈ 15, got ${sm.mean}`);
  const av = c.distSummary(c.sampleUncertain('avg(cost)', 4000, 2024, parent));
  assert.ok(Math.abs(av.mean - 7.5) < 0.7, `avg ≈ 7.5, got ${av.mean}`);
  // no qualifying children → an empty rollup is all-zero (vacuous), never throws
  const empty = c.sampleUncertain('sum(cost)', 100, 1, c.mkNode(''));
  assert.ok(empty.every(x => x === 0));
});

test('estChildPropExpr — reads a child’s uncertain property string', () => {
  const n = c.mkNode(''); n.props = [{ key: 'cost', val: '5 to 10' }];
  assert.equal(c.estChildPropExpr(n, 'cost'), '5 to 10');
  assert.equal(c.estChildPropExpr(n, 'COST'), '5 to 10');   // case-insensitive
  assert.equal(c.estChildPropExpr(n, 'missing'), null);
});

test('distSummary — quantiles + mean on a fixed array (no RNG)', () => {
  const xs = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
  const s = c.distSummary(xs);
  assert.ok(Math.abs(s.mean - 50.5) < 1e-9);
  assert.ok(Math.abs(s.p50 - 50.5) < 0.6);
  assert.ok(s.p5 < s.p50 && s.p50 < s.p95);
  assert.equal(c.distSummary([]), null);
  assert.equal(c.distSummary([NaN, Infinity]), null);       // non-finite dropped → empty
});

test('sparkline — pure, deterministic, ramp-only; exact on a hand-computed case', () => {
  assert.equal(c.sparkline([0,1,2,3,4,5,6,7,8,9], 3), '▆▆█'); // counts [3,3,4] → ▆▆█
  const sp = c.sparkline(Array.from({ length: 1000 }, (_, i) => i), 10);
  assert.equal(sp.length, 10);
  for (const ch of sp) assert.ok('▁▂▃▄▅▆▇█'.includes(ch));
  assert.equal(c.sparkline([], 10), '');
  assert.equal(c.sparkline([5,5,5,5], 8), '█');              // a constant spike → one full bar
});

test('formatDist — "mean (p5 – p95) sparkline" on a fixed array', () => {
  const xs = Array.from({ length: 100 }, (_, i) => i + 1);
  const out = c.formatDist(xs);
  assert.match(out, /^50\.5 \([\d.]+ – [\d.]+\) [▁▂▃▄▅▆▇█]+$/);
  assert.equal(c.formatDist([]), '#ERR');
});

test('estParts — sniffs distribution constructors only (not sum/avg/dice)', () => {
  assert.equal(c.estParts('5 to 10'), '5 to 10');
  assert.equal(c.estParts('normal(8, 2)'), 'normal(8, 2)');
  assert.equal(c.estParts('uniform(0,10)'), 'uniform(0,10)');
  assert.equal(c.estParts('sum(cost)'), null);   // rollups are dialog-authored, not typed shorthand
  assert.equal(c.estParts('2d6'), null);         // dice, not an estimate
  assert.equal(c.estParts('a | b'), null);
  assert.equal(c.estParts('tomato'), null);      // contains no standalone "to" token
});

test('makeEstRoll — builds {key, expr, seed}; rejects malformed', () => {
  const r = c.makeEstRoll('5 to 10');
  assert.equal(r.expr, '5 to 10');
  assert.ok(typeof r.key === 'string' && r.key[0] === 'u');
  assert.ok(Number.isFinite(r.seed));
  assert.equal(c.makeEstRoll('nonsense'), null);
});

test('renderEstPill — frozen summary + aria-label = mean±CI, sparkline aria-hidden', () => {
  const r = c.makeEstRoll('5 to 10');
  const html = c.renderEstPill(r.key, r);
  assert.match(html, /class="est-pill"/);
  assert.match(html, /aria-label="Estimate 5 to 10: mean/);
  assert.match(html, /est-spark" aria-hidden="true"/);
  assert.match(c.renderEstPill('k', null), /est-bad/);     // missing record → bad pill
  assert.match(c.renderEstPill('k', { key:'k', expr:'bogus', seed:1 }), /est-err/); // unparseable → #ERR
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
    assert2.deepEqual(host2(idx.outgoing[a.id]), [{ target: b.id, label: 'B', mirror: false }]);
    assert2.deepEqual(host2(idx.backlinks[b.id]), [a.id]);
    assert2.deepEqual(host2(idx.broken), []);
  });

  ltest('collectLinks — label is optional', () => {
    const a = mk2(''), b = mk2('B');
    a.text = `[[#${b.id}]]`;
    const root = c2.mkRoot(); root.children.push(a, b);
    assert2.equal(c2.collectLinks(root).outgoing[a.id][0].label, '');
  });

  ltest('collectLinks — mirror flag distinguishes [[#id|]] (mirror) from [[#id]] (plain) (C4)', () => {
    const a = mk2(''), b = mk2(''), t = mk2('T');
    a.text = `[[#${t.id}|]]`;   // empty-pipe → mirror (transclusion form)
    b.text = `[[#${t.id}]]`;    // no pipe    → plain link
    const root = c2.mkRoot(); root.children.push(a, b, t);
    const idx = c2.collectLinks(root);
    const ra = idx.outgoing[a.id][0], rb = idx.outgoing[b.id][0];
    assert2.equal(ra.mirror, true);
    assert2.equal(rb.mirror, false);
    // both collapse label to '' — mirror is the ONLY field that tells them apart
    assert2.equal(ra.label, ''); assert2.equal(rb.label, '');
    assert2.notDeepEqual(host2(ra), host2(rb));
    // a captioned link [[#id|text]] is a fixed caption, never a mirror
    const cnode = mk2(''); cnode.text = `[[#${t.id}|see]]`;
    root.children.push(cnode);
    assert2.equal(c2.collectLinks(root).outgoing[cnode.id][0].mirror, false);
  });

  ltest('collectLinks — a missing target is flagged broken', () => {
    const a = mk2('A'); a.text = `[[#deadbeef|gone]]`;
    const root = c2.mkRoot(); root.children.push(a);
    const idx = c2.collectLinks(root);
    assert2.deepEqual(host2(idx.backlinks['deadbeef']), [a.id]);
    assert2.deepEqual(host2(idx.broken), ['deadbeef']);
  });

  // ── broken-links report (backlog #4): same-doc + cross-doc enumeration ──
  ltest('collectBrokenLinks — same-doc: one entry per broken occurrence, with the source title', () => {
    const a = mk2('Source A'); a.text = `Source A see [[#ghost|gone]] and [[#alive|ok]]`;
    const b = mk2('alive');
    const alive = b.id;
    a.text = `Source A see [[#ghost|gone]] and [[#${alive}|ok]]`;
    const root = c2.mkRoot(); root.children.push(a, b);
    const links = c2.collectLinks(root);
    const titleOf = (id) => (id === a.id ? 'Source A' : id === alive ? 'alive' : '');
    const rep = c2.collectBrokenLinks(links, titleOf, null, root.docId);
    assert2.equal(rep.length, 1, 'only the ghost link is broken');
    assert2.equal(rep[0].scope, 'same');
    assert2.equal(rep[0].target, 'ghost');
    assert2.equal(rep[0].srcTitle, 'Source A');
    assert2.equal(rep[0].label, 'gone');
  });

  ltest('collectBrokenLinks — cross-doc: a link to a missing dst node/doc is flagged, present is not', () => {
    // no same-doc links; drive purely off a synthetic workspaceIndex
    const links = { outgoing: {}, broken: [] };
    const wsIndex = {
      titles: new Map([['docB', new Map([['present', 'Present Node']])]]),   // docB has 'present', not 'missing'; docC absent
      nameByDocId: new Map([['docB', 'notes-b.opml']]),
      outgoing: [
        { srcDocId: 'docA', srcNodeId: 's1', dstDocId: 'docB', dstNodeId: 'missing', label: 'dangling' },  // node gone → broken
        { srcDocId: 'docA', srcNodeId: 's2', dstDocId: 'docB', dstNodeId: 'present', label: 'fine' },       // present → NOT broken
        { srcDocId: 'docA', srcNodeId: 's3', dstDocId: 'docC', dstNodeId: 'x',       label: 'nodoc' },      // whole doc gone → broken
        { srcDocId: 'other', srcNodeId: 'z', dstDocId: 'docB', dstNodeId: 'missing', label: 'notme' },      // not our doc → skipped
      ],
    };
    const titleOf = (id) => ({ s1: 'One', s2: 'Two', s3: 'Three' }[id] || '');
    const rep = c2.collectBrokenLinks(links, titleOf, wsIndex, 'docA');
    const targets = host2(rep.map(r => r.target)).sort();   // host2: cores run in a vm realm, so deepEqual on the raw array trips on the cross-realm prototype
    assert2.deepEqual(targets, ['missing', 'x'], 'the two broken cross-doc targets, not the present one nor the other doc');
    const missing = rep.find(r => r.target === 'missing');
    assert2.equal(missing.scope, 'cross');
    assert2.equal(missing.dstDocName, 'notes-b.opml');
    assert2.equal(rep.find(r => r.target === 'x').dstDocName, null, 'a missing doc has no name');
  });

  ltest('collectBrokenLinks — no links, no workspace: empty report, no throw', () => {
    assert2.equal(c2.collectBrokenLinks({ outgoing: {}, broken: [] }, () => '', null, 'd').length, 0);
    assert2.equal(c2.collectBrokenLinks(null, () => '', null, 'd').length, 0);
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

// ─── tokenUnderCaret ──────────────────────────────────────────────────────
// Pure core: returns the link token spanning the given offset, or null.
// Covers same-doc [[#id|label]] and cross-doc [[docId#id|label]].
// ─────────────────────────────────────────────────────────────────────────
{
  const { tokenUnderCaret } = c;
  test('tokenUnderCaret: caret inside a same-doc link returns token data', () => {
    const text = 'before [[#abc123|My Link]] after';
    // token spans indices 7-26; offset 15 is inside
    const tk = tokenUnderCaret(text, 15);
    assert.ok(tk !== null, 'should return a token');
    assert.equal(tk.nodeId, 'abc123');
    assert.equal(tk.docId, null);
    assert.equal(tk.label, 'My Link');
    assert.equal(tk.start, 7);
    assert.equal(tk.end, 26);
  });
  test('tokenUnderCaret: caret inside a cross-doc link returns token with docId', () => {
    const text = 'see [[docxyz#abc123|Title]]';
    const tk = tokenUnderCaret(text, 10);
    assert.ok(tk !== null);
    assert.equal(tk.docId, 'docxyz');
    assert.equal(tk.nodeId, 'abc123');
    assert.equal(tk.label, 'Title');
  });
  test('tokenUnderCaret: caret at token start boundary is inside', () => {
    const text = '[[#abc123|link]]';
    const tk = tokenUnderCaret(text, 0);
    assert.ok(tk !== null, 'boundary start should be inside');
    assert.equal(tk.nodeId, 'abc123');
  });
  test('tokenUnderCaret: caret at token end boundary is inside', () => {
    const text = '[[#abc123|link]]';
    const tk = tokenUnderCaret(text, 16); // length = 16
    assert.ok(tk !== null, 'boundary end should be inside');
  });
  test('tokenUnderCaret: caret before token returns null', () => {
    const text = 'hello [[#abc123|link]]';
    assert.equal(tokenUnderCaret(text, 3), null);
  });
  test('tokenUnderCaret: caret after token returns null', () => {
    const text = 'hello [[#abc123|link]] world';
    assert.equal(tokenUnderCaret(text, 23), null, 'one char after closing ]] is outside');
  });
  test('tokenUnderCaret: no link token in text returns null', () => {
    assert.equal(tokenUnderCaret('plain text', 3), null);
  });
  test('tokenUnderCaret: artifact token (not a link) returns null', () => {
    assert.equal(tokenUnderCaret('[[dice:key123]]', 5), null);
  });
  test('tokenUnderCaret: link with no label returns token', () => {
    const text = '[[#xyz789]]';
    const tk = tokenUnderCaret(text, 5);
    assert.ok(tk !== null);
    assert.equal(tk.nodeId, 'xyz789');
    assert.equal(tk.label, '');
    assert.equal(tk.docId, null);
  });
  test('tokenUnderCaret: picks the correct token when multiple are present', () => {
    const text = '[[#aaa|first]] middle [[#bbb|second]]';
    // offset 5 = inside first token (spans 0-14)
    const tk1 = tokenUnderCaret(text, 5);
    assert.ok(tk1 !== null);
    assert.equal(tk1.nodeId, 'aaa');
    // offset 28 = inside second token (spans 22-37)
    const tk2 = tokenUnderCaret(text, 28);
    assert.ok(tk2 !== null);
    assert.equal(tk2.nodeId, 'bbb');
    // offset 16 = between tokens
    assert.equal(tokenUnderCaret(text, 16), null);
  });
}

// Wiring pins: cycleTodoState and cycleTodoPriority are bound to keydown chords —
// verify the cycle logic is intact (keyboard-a11y, P3).
{
  const { cycleTodoState, cycleTodoPriority, parseTodo } = c;
  test('cycleTodoState wiring: forward advances through the full state cycle', () => {
    const t0 = 'body text';
    const t1 = cycleTodoState(t0, 1);
    assert.ok(t1.startsWith('#TODO'), `expected #TODO, got: ${t1}`);
    const t2 = cycleTodoState(t1, 1);
    assert.ok(t2.startsWith('#NEXT'), `expected #NEXT, got: ${t2}`);
    const t3 = cycleTodoState(t2, 1);
    assert.ok(t3.startsWith('#WAITING'), `expected #WAITING, got: ${t3}`);
    const t4 = cycleTodoState(t3, 1);
    assert.ok(t4.startsWith('#DONE'), `expected #DONE, got: ${t4}`);
    const t5 = cycleTodoState(t4, 1);
    // wraps back to cleared (no keyword at start)
    assert.ok(!parseTodo(t5).keyword, `expected cleared, got: ${parseTodo(t5).keyword}`);
  });
  test('cycleTodoPriority wiring: forward cycles A→B→C→cleared when state is present', () => {
    const base = '#TODO task';
    const p1 = cycleTodoPriority(base, 1);
    assert.ok(p1.includes('[#A]'), `expected [#A], got: ${p1}`);
    const p2 = cycleTodoPriority(p1, 1);
    assert.ok(p2.includes('[#B]'), `expected [#B], got: ${p2}`);
    const p3 = cycleTodoPriority(p2, 1);
    assert.ok(p3.includes('[#C]'), `expected [#C], got: ${p3}`);
    const p4 = cycleTodoPriority(p3, 1);
    assert.ok(!p4.includes('[#'), `expected no priority, got: ${p4}`);
  });
  test('cycleTodoPriority wiring: no-op on a point without a state keyword', () => {
    const text = 'plain text no state';
    assert.equal(cycleTodoPriority(text, 1), text);
  });

  // LEAN FLOOR: the bulk verb applies a cycle mutator over a node list (Ctrl/⌘+Shift+S/P on a selection)
  test('applyTodoCycleToNodes: cycles state on every node, counts only real changes, refreshes checked', () => {
    const nodes = [
      { text: 'first',        checked: false },   // → #TODO
      { text: '#DONE done',   checked: true  },   // → cleared (wraps), checked false
      { text: 'plain para',   checked: false },   // → #TODO
    ];
    const changed = c.applyTodoCycleToNodes(nodes, t => c.cycleTodoState(t, 1));
    assert.equal(changed, 3, 'all three changed');
    assert.ok(nodes[0].text.startsWith('#TODO'));
    assert.ok(!parseTodo(nodes[1].text).keyword, 'a #DONE wraps to cleared');
    assert.equal(nodes[1].checked, false, 'the derived checked cache is refreshed');
    // a no-op mutator changes nothing and counts 0
    const zero = c.applyTodoCycleToNodes([{ text: 'x', checked: false }], t => t);
    assert.equal(zero, 0, 'an identity mutator counts no change');
  });

  test('LEAN FLOOR: the bulk state/priority shortcut wiring is present (keydown is DOM-bound)', () => {
    assert.ok(_src.includes("bulkCycleTodo('state', 1)") && _src.includes("bulkCycleTodo('priority', 1)"), 'the bulk cycle handlers are missing');
    // gated on a selection AND not editing (so it never collides with the single-node in-edit chord)
    assert.ok(_src.includes("(e.key==='s' || e.key==='S') && selectedIds.size > 0 && activeContentId == null"), 'the bulk-state shortcut must gate on a selection + not-editing');
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

test('table: a cell formula can reference a document variable', () => {
  const m = { aligns: [null, null], rows: [['base', 'taxed'], ['100', ''], ['250', '']] };
  // tax declared elsewhere in the document; passed in as the vars map
  const out = computeTable(m, '$2=$1*tax', { tax: 1.2 });
  assert.equal(out[1][1], '120');
  assert.equal(out[2][1], '300');
  // without the variable in scope the reference is unresolved → reason-coded #ERR (not silently 0)
  assert.equal(computeTable(m, '$2=$1*tax', {})[1][1], '#ERR (bad ref)');
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

test('table: cycle detection yields #ERR (loops on itself), not a hang', () => {
  const out = computeTable(tblModel(), '@2$1=@2$2 :: @2$2=@2$1');
  assert.equal(out[1][0], '#ERR (loops on itself)');
  assert.equal(out[1][1], '#ERR (loops on itself)');
});

// ── Error-propagation tests (brief-table-error-propagation) ──────────────────
// Regression for the silent-wrong-total bug: an errored formula cell (null/non-finite
// result) was indistinguishable from a blank cell in valueAt, so dependent formulas
// substituted 0 and silently produced a plausible-but-wrong total.

test('table: errored formula cell propagates #ERR (another cell) to dependents — not silently 0', () => {
  // @3$2 references an undefined variable → #ERR (bad ref).
  // @4$2 = @2$1 + @3$2: must NOT read @3$2 as 0 and print 100; must show #ERR (another cell).
  const m = { aligns: [null, null], rows: [
    ['price', 'result'],
    ['100', ''],
    ['', ''],
    ['', ''],
  ] };
  const out = computeTable(m, '@3$2=@2$1*bad_var :: @4$2=@2$1+@3$2', {});
  assert.ok(/^#ERR/.test(out[2][1]), 'source cell must error, got: ' + out[2][1]);
  assert.equal(out[3][1], '#ERR (another cell)',
    'dependent cell must show the upstream-error marker, not a plausible-but-wrong total');
});

test('table: blank literal cell still reads as 0 after error-sentinel change (regression guard)', () => {
  // Blank cells are literal (no formula), so they must remain null → 0 — the
  // sentinel change must not affect them.
  const m = { aligns: [null, null], rows: [['x', 'y'], ['', '4'], ['2', '6']] };
  assert.equal(computeTable(m, '@2$2=@2$1+10')[1][1], '10');  // blank @2$1 reads as 0
});

test('table: range aggregate over an errored cell propagates #ERR (another cell) — not a partial sum', () => {
  // vsum must not silently skip an errored cell the way it skips blank cells.
  const m = { aligns: [null, null, null], rows: [
    ['a', 'b', 'sum'],
    ['1', '', ''],
    ['', '', ''],
  ] };
  // @2$2 errors (undefined variable); vsum(@2$2..@2$3) covers that cell.
  const out = computeTable(m, '@2$2=bad_var :: @3$3=vsum(@2$2..@2$3)', {});
  assert.ok(/^#ERR/.test(out[1][1]), 'errored source cell: ' + out[1][1]);
  assert.equal(out[2][2], '#ERR (another cell)',
    'range aggregate over errored cell must propagate the error, not silently sum around it');
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

// ── tblfmGetAssign / tblfmSetAssign (UXP-3 Part B: the formula dialog's core) ─

test('tblfmSetAssign: set on empty TBLFM', () => {
  assert.equal(c.tblfmSetAssign('', '$3', '$1*$2'), '$3=$1*$2');
  assert.equal(c.tblfmSetAssign(null, '@2$3', '@2$1+10'), '@2$3=@2$1+10');
});

test('tblfmSetAssign: replaces the assignment with the same lhs, keeps others', () => {
  const existing = '$3=$1*$2 :: @>$3=vsum(@2$3..@-1$3)';
  assert.equal(c.tblfmSetAssign(existing, '$3', '$1+$2'),
    '@>$3=vsum(@2$3..@-1$3) :: $3=$1+$2');
});

test('tblfmSetAssign: empty expr removes the assignment ("" when none left)', () => {
  assert.equal(c.tblfmSetAssign('$3=$1*$2', '$3', ''), '');
  assert.equal(c.tblfmSetAssign('$3=$1*$2 :: @2$1=5', '$3', '  '), '@2$1=5');
});

test('tblfmSetAssign: exact-lhs match — "$3" never touches "@>$3"', () => {
  const footer = '@>$3=vsum(@2$3..@-1$3)';
  assert.equal(c.tblfmSetAssign(footer, '$3', '$1*$2'), footer + ' :: $3=$1*$2');
});

test('tblfmGetAssign: returns the expr for the exact lhs, null otherwise', () => {
  const t = '$3=$1*$2 :: @2$1=10 :: @>$2=vsum(@2$2..@-1$2)';
  assert.equal(c.tblfmGetAssign(t, '$3'), '$1*$2');
  assert.equal(c.tblfmGetAssign(t, '@2$1'), '10');
  assert.equal(c.tblfmGetAssign(t, '@>$2'), 'vsum(@2$2..@-1$2)');
  assert.equal(c.tblfmGetAssign(t, '$1'), null);
  assert.equal(c.tblfmGetAssign('', '$1'), null);
});

test('tblfmSetAssign round-trips through parseTblfm and computeTable', () => {
  const model = { aligns: ['left','left','left'], rows: [['A','B','C'], ['2','3',''], ['4','5','']] };
  const tblfm = c.tblfmSetAssign('', '$3', '$1*$2');
  const rows = JSON.parse(JSON.stringify(c.computeTable(model, tblfm, {})));
  assert.equal(rows[1][2], '6');
  assert.equal(rows[2][2], '20');
  // a cell formula overrides the column formula for just that cell (Org rule)
  const tblfm2 = c.tblfmSetAssign(tblfm, '@3$3', '99');
  const rows2 = JSON.parse(JSON.stringify(c.computeTable(model, tblfm2, {})));
  assert.equal(rows2[1][2], '6');
  assert.equal(rows2[2][2], '99');
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
  return { id: 'n1', text, dice:[], markov:[], math:[], vars:[], grammar:[] };
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
const { parseTodo, formatTodo, cyclePriority,
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

test('todo: priority bracket may directly abut the keyword (no space)', () => {
  // LEAD_WORD_RE lookahead must accept `[` so `#TODO[#A]` is recognized, not left as plain text.
  assert.deepEqual(host(parseTodo('#TODO[#A] buy milk')), { keyword: 'TODO', priority: 'A', body: 'buy milk' });
  assert.deepEqual(host(parseTodo('#DONE[#C]')), { keyword: 'DONE', priority: 'C', body: '' });
});

test('todo: formatTodo inverts parseTodo (normalized)', () => {
  const round = (s) => formatTodo(parseTodo(s));
  assert.equal(round('#TODO [#A] Buy milk'), '#TODO [#A] Buy milk');
  assert.equal(round('#TODO   [#b]   tidy'), '#TODO [#B] tidy');
  assert.equal(round('#DONE'), '#DONE');
  assert.equal(round('plain text'), 'plain text');
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
  // #510: a no-keyword/unrecognized point sorts after every known state — Infinity,
  // not the default set's length (the last hardcoded TODO_STATES coupling, now gone).
  // (Element-wise, not host()/deepEqual: JSON round-trips Infinity to null, and the
  // array is from the vm realm so deepEqual rejects it as not reference-equal.)
  assert.deepEqual([...todoSortKey('plain')], [0, 3, Infinity]);
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
  // a "roll table" is a one-rule grammar since the collapse — registers as a rule
  const rtNode = c.mkNode('[[grammar:rt1]]');
  rtNode.grammar = [{ key: 'rt1', def: 'loot: 1 gold | 2 silver', origin: 'loot', result: '1 gold' }];
  root.children.push(rtNode);
  const chainNode = c.mkNode('[[markov:mk1]]');
  chainNode.markov = [{ key: 'mk1', name: 'weather', def: 'sunny -> cloudy\ncloudy -> rainy', start: 'sunny', steps: 3 }];
  root.children.push(chainNode);
  return root;
};

test('callables: three groups present, each with expected name (tables are rules since the rolltable collapse)', () => {
  const all = host(c.collectCallables(mkCallablesRoot()));
  assert.ok(all.some(x => x.group === 'var'   && x.name === 'strength'), 'var: strength');
  assert.ok(all.some(x => x.group === 'rule'  && x.name === 'color'),    'rule: color');
  assert.ok(all.some(x => x.group === 'rule'  && x.name === 'loot'),     'rule: loot (a named table IS a rule)');
  assert.ok(all.some(x => x.group === 'chain' && x.name === 'weather'),  'chain: weather');
});

test('callables: var entry carries the resolved numeric value', () => {
  const v = host(c.collectCallables(mkCallablesRoot())).find(x => x.group === 'var');
  assert.equal(v.name, 'strength');
  assert.equal(v.val, 18);
});

test('callables: group order is vars, rules, chains', () => {
  const groups = [...new Set(host(c.collectCallables(mkCallablesRoot())).map(x => x.group))];
  assert.deepEqual(groups, ['var', 'rule', 'chain']);
});

test('callables: a record without its token in node.text is excluded (pruned-data rule)', () => {
  const root = c.mkRoot();
  const n = c.mkNode('no token here');
  n.grammar = [{ key: 'rt9', def: 'ghost: 1 boo', origin: 'ghost', result: '1 boo' }];
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

test('highlightGrammarText: an attempted-but-unknown {name} is marked gr-bad (UXP-6)', () => {
  // {nope} reads as a reference attempt but matches no rule/var — it will NOT
  // promote, and that must be visible (a typo signal), not silent.
  const out = c.highlightGrammarText('{nope} tail');
  assert.ok(out.includes('class="gr-src gr-bad"'), 'unknown-name brace gets the gr-bad marker');
  assert.ok(out.includes('>{nope}</span> tail'), 'marker is bounded at }; tail stays plain');
  assert.ok(!out.includes(SENT) && !out.includes(ZWSP), 'no sentinel/anchor after the span');
});

test('highlightGrammarText: prose braces stay literal (no span, no marker)', () => {
  // a body that reads as plain prose (spaces, no formula shape) is the deliberate
  // escape hatch — it gets neither gr-src styling nor the gr-bad marker
  const out = c.highlightGrammarText('{hello world} tail').split(SENT).join('').split(ZWSP).join('');
  assert.ok(!out.includes('gr-src'), 'no span for an intentional literal brace');
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

const FLOW = { key: 'q1', name: 'Flow', states: ['BACKLOG', 'DOING', 'SHIPPED'], doneFrom: 2, heldFrom: 2 };
const DEFAULT_SEQ = { key: 'default', name: 'To-do', states: ['TODO', 'NEXT', 'WAITING', 'DONE'], doneFrom: 3 };

test('parseSequence: pipe splits active from done; states uppercased', () => {
  // a one-pipe sequence has no held band → heldFrom === doneFrom (UXP-158)
  assert.deepEqual(host(c.parseSequence('TODO NEXT WAITING | DONE CANCELLED')),
    { states: ['TODO', 'NEXT', 'WAITING', 'DONE', 'CANCELLED'], doneFrom: 3, heldFrom: 3 });
  assert.deepEqual(host(c.parseSequence('backlog doing | shipped')),
    { states: ['BACKLOG', 'DOING', 'SHIPPED'], doneFrom: 2, heldFrom: 2 });
});

test('parseSequence: an optional middle band declares HELD (active | held | done) (UXP-158)', () => {
  assert.deepEqual(host(c.parseSequence('BACKLOG DOING | BLOCKED | SHIPPED')),
    { states: ['BACKLOG', 'DOING', 'BLOCKED', 'SHIPPED'], heldFrom: 2, doneFrom: 3 });
  // multiple held states, multiple done states
  assert.deepEqual(host(c.parseSequence('TODO | WAITING PAUSED | DONE CANCELLED')),
    { states: ['TODO', 'WAITING', 'PAUSED', 'DONE', 'CANCELLED'], heldFrom: 1, doneFrom: 3 });
});

test('keywordIsHeld — structural held-band membership, not a WAITING string match (UXP-158)', () => {
  const def = [{ states: ['TODO', 'NEXT', 'WAITING', 'DONE'], heldFrom: 2, doneFrom: 3 }];  // built-in shape
  assert.equal(c.keywordIsHeld('WAITING', def), true);    // in [heldFrom, doneFrom)
  assert.equal(c.keywordIsHeld('TODO', def), false);      // active
  assert.equal(c.keywordIsHeld('DONE', def), false);      // done, not held
  // a custom sequence's OWN held state works the same way — the whole point of UXP-158
  const flow = [{ states: ['BACKLOG', 'DOING', 'BLOCKED', 'SHIPPED'], heldFrom: 2, doneFrom: 3 }];
  assert.equal(c.keywordIsHeld('BLOCKED', flow), true);
  assert.equal(c.keywordIsHeld('DOING', flow), false);
  // a one-pipe sequence (heldFrom === doneFrom) has NO held states
  const plain = [{ states: ['A', 'B', 'C'], heldFrom: 2, doneFrom: 2 }];
  assert.equal(c.keywordIsHeld('B', plain), false);
});

test('openSeqDialog onSubmit forwards heldFrom, so a dialog-authored held band survives (UXP-160)', () => {
  // the dialog builds its record from parseSequence(def); the onSubmit must carry heldFrom through.
  // src-pin: the onSubmit object includes heldFrom (the regression was it being dropped).
  assert.ok(_src.includes('heldFrom: p.heldFrom }'),
    'openSeqDialog onSubmit must forward heldFrom (UXP-160 regression guard)');
  // contract: the record the dialog produces from a 3-band def carries a live held band,
  // and editing down to one pipe re-derives heldFrom === doneFrom (no stale held band).
  const created = host(c.parseSequence('DOING | BLOCKED | SHIPPED'));
  assert.equal(created.heldFrom, 1);
  assert.equal(created.doneFrom, 2);
  assert.equal(c.keywordIsHeld('BLOCKED', [created]), true);   // BLOCKED reads as held, the whole point
  const edited = host(c.parseSequence('DOING | SHIPPED'));      // edited down to one pipe
  assert.equal(edited.heldFrom, edited.doneFrom);              // no held band survives
});

test('parseSequence: invalid forms return null (callers branch on null)', () => {
  assert.equal(c.parseSequence('TODO DONE'), null);          // no pipe
  assert.equal(c.parseSequence('A | B | C | D'), null);      // three pipes (four bands) — too many
  assert.equal(c.parseSequence(' | DONE'), null);            // empty active side
  assert.equal(c.parseSequence('TODO | '), null);            // empty done side
  assert.equal(c.parseSequence('A | | C'), null);            // empty held band
  assert.equal(c.parseSequence('TO DO! | DONE'), null);      // bad token
  assert.equal(c.parseSequence('A B | A'), null);            // duplicate state
  assert.equal(c.parseSequence('A | A | B'), null);          // duplicate across bands
  assert.equal(c.parseSequence(''), null);
});

test('sequenceLint: flags a whitespace-split state, quiet for single-word states (C5)', () => {
  // tokenizer is unchanged — "IN PROGRESS" silently became 2 states; the lint surfaces it
  const w = c.sequenceLint('OPEN IN PROGRESS | RESOLVED');
  assert.ok(w, 'a multi-word side is flagged');
  assert.match(w, /4 states/);
  assert.match(w, /OPEN, IN, PROGRESS, RESOLVED/);
  // single-word states on each side: nothing to warn about
  assert.equal(c.sequenceLint('BACKLOG | DONE'), null);
  // a parse failure is the dialog's hard error, not the lint's job → null
  assert.equal(c.sequenceLint('no pipe here'), null);
  assert.equal(c.sequenceLint('TODO | '), null);
  // a legit multi-STATE side (the canonical default) also reports the split — accurate, not an error
  assert.ok(c.sequenceLint('TODO NEXT WAITING | DONE'));
});

// ── typed sequence declaration: {seq Flow: BACKLOG DOING | SHIPPED} ──────────
test('seqDeclParts: a named sequence declaration → { name, states, doneFrom, heldFrom }', () => {
  assert.deepEqual(host(c.seqDeclParts('seq Flow: BACKLOG DOING | SHIPPED')),
    { name: 'Flow', states: ['BACKLOG', 'DOING', 'SHIPPED'], doneFrom: 2, heldFrom: 2 });
  assert.deepEqual(host(c.seqDeclParts('seq Review: DRAFT | DONE')),
    { name: 'Review', states: ['DRAFT', 'DONE'], doneFrom: 1, heldFrom: 1 });
  // UXP-158: a held band carries through the declaration
  assert.deepEqual(host(c.seqDeclParts('seq Flow: BACKLOG DOING | BLOCKED | SHIPPED')),
    { name: 'Flow', states: ['BACKLOG', 'DOING', 'BLOCKED', 'SHIPPED'], doneFrom: 3, heldFrom: 2 });
  assert.match(c.seqDeclParts('seq Flow: a | b').name, /Flow/); // name preserves case
});
test('seqDeclParts: NOT a sequence declaration (no false positives)', () => {
  assert.equal(c.seqDeclParts('shuffle: a | b'), null);       // a deck/sequence-mode
  assert.equal(c.seqDeclParts('markov: a→b'), null);          // a typed markov
  assert.equal(c.seqDeclParts('x > 1: a | b'), null);         // a conditional
  assert.equal(c.seqDeclParts('weapon: sword | axe'), null);  // a grammar rule line (no `seq `)
  assert.equal(c.seqDeclParts('seq : A | B'), null);          // no name
  assert.equal(c.seqDeclParts('seq A B: X | Y'), null);       // multi-word name rejected
  assert.equal(c.seqDeclParts('seq Flow: TODO DONE'), null);  // no pipe → not a valid states def
  assert.equal(c.seqDeclParts('seq Flow:'), null);            // empty states
});
test('classifyBraceBody / braceTypeLabel — a typed seq decl is a valid seq artifact', () => {
  assert.equal(c.classifyBraceBody('seq Flow: BACKLOG DOING | SHIPPED', {}, {}), 'artifact');
  assert.deepEqual(host(c.braceTypeLabel('seq Flow: BACKLOG DOING | SHIPPED', {}, {})), ['seq', null]);
});
test('promoteBraceBody — {seq Name: …} builds a named [[seq:KEY]] record, registered doc-wide', () => {
  const node = { id: 'n1', text: '', seq: [], children: [] };
  const tok = c.promoteBraceBody(node, 'seq Flow: BACKLOG DOING | SHIPPED');
  assert.match(tok, /^\[\[seq:[a-z0-9]+\]\]$/);
  const rec = node.seq[0];
  assert.equal(rec.name, 'Flow');
  assert.deepEqual(host(rec.states), ['BACKLOG', 'DOING', 'SHIPPED']);
  assert.equal(rec.doneFrom, 2);
  // collectSequences picks it up (token in text + named), so its states drive the / menu
  node.text = 'process ' + tok;
  const root = { id: 'r', text: '', seq: [], children: [node] };
  const seqs = c.collectSequences(root);
  assert.equal(seqs.length, 1);
  assert.equal(seqs[0].name, 'Flow');
  // done-ness: right of the | is done, left is not
  const all = [{ key: 'default', name: 'To-do', states: ['TODO', 'DONE'], doneFrom: 1 }, ...seqs];
  assert.equal(c.keywordIsDone('SHIPPED', all), true);
  assert.equal(c.keywordIsDone('BACKLOG', all), false);
});
test('artifactToShorthand — a seq pill unfolds to its {seq Name: …} source (LEAN FLOOR: edit inline)', () => {
  // a sequence now unfolds so it can be edited keyboard-only. It round-trips LOSSLESSLY: seqDefString
  // re-emits the states/bands, the name comes back via seqDeclParts. No draw state to lose.
  assert.equal(c.artifactToShorthand('seq', { key: 'k', name: 'Flow', states: ['A', 'B'], doneFrom: 1 }), '{seq Flow: A | B}');
  // held band survives too (UXP-158): active | held | done
  assert.equal(c.artifactToShorthand('seq', { key: 'k', name: 'Kanban', states: ['A', 'B', 'C', 'D'], heldFrom: 2, doneFrom: 3 }), '{seq Kanban: A B | C | D}');
  assert.equal(c.artifactToShorthand('seq', { key: 'k' }), null);   // a malformed record (no name/states) doesn't unfold
});
test('LEAN FLOOR: a seq token unfolds in edit mode and refolds losslessly (no dialog to edit)', () => {
  const node = { id: 'n', text: '', seq: [], dice: [], math: [], vars: [], grammar: [], est: [], markov: [], children: [] };
  const tok = c.promoteBraceBody(node, 'seq Flow: BACKLOG DOING | SHIPPED');
  node.text = 'process ' + tok;
  c.unfoldArtifacts(node);                                    // enter edit → the token becomes {seq …} text
  assert.match(node.text, /^process \{seq Flow: BACKLOG DOING \| SHIPPED\}$/, 'seq unfolds to editable {seq …} source');
  c.refoldArtifacts(node);                                    // leave edit untouched → back to the exact token
  assert.equal(node.text, 'process ' + tok, 'an untouched seq refolds to its original token (lossless)');
});

test('artifactToShorthand — a query pill unfolds to its {query: expr} source (LEAN FLOOR: edit inline)', () => {
  assert.equal(c.artifactToShorthand('query', { key: 'k', expr: 'is:todo | due:week' }), '{query: is:todo | due:week}');
  assert.equal(c.artifactToShorthand('query', { key: 'k' }), null);   // no expr → nothing to unfold
});
test('LEAN FLOOR: a query token unfolds in edit mode and refolds losslessly (no dialog to edit)', () => {
  const node = { id: 'n', text: '', query: [], seq: [], dice: [], math: [], vars: [], grammar: [], est: [], markov: [], children: [] };
  const tok = c.promoteBraceBody(node, 'query: is:todo | due:week');
  node.text = 'tasks ' + tok;
  c.unfoldArtifacts(node);                                    // enter edit → the token becomes {query: …} text
  assert.match(node.text, /^tasks \{query: is:todo \| due:week\}$/, 'query unfolds to editable {query: …} source');
  c.refoldArtifacts(node);                                    // leave edit untouched → back to the exact token
  assert.equal(node.text, 'tasks ' + tok, 'an untouched query refolds to its original token (lossless)');
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
    { states: FLOW.states, doneFrom: FLOW.doneFrom, heldFrom: FLOW.heldFrom });
  // UXP-158: a held-band sequence round-trips its middle pipe
  const held = { states: ['BACKLOG', 'DOING', 'BLOCKED', 'SHIPPED'], heldFrom: 2, doneFrom: 3 };
  assert.equal(c.seqDefString(held), 'BACKLOG DOING | BLOCKED | SHIPPED');
  assert.deepEqual(host(c.parseSequence(c.seqDefString(held))), held);
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

// ── Random variables: a variable whose value is a frozen random pick ─────────
// (guidance/generation-direction.md v1 / brief-pick-variables.md §6)
// The pick rolls via the grammar engine ONLY at declaration / explicit re-roll;
// collectVars returns the stored `rolled` string unchanged on every pass.

test('rollPickSource: alternation source picks deterministically (seeded)', () => {
  c.seedSequence([0]);
  assert.equal(c.rollPickSource('dragon|wyrm|drake', {}, {}), 'dragon');
  c.seedSequence([0.99]);
  assert.equal(c.rollPickSource('dragon|wyrm|drake', {}, {}), 'drake');
  c.resetRandom();
});

test('rollPickSource: weighted alternation respects weights', () => {
  c.seedSequence([0.5]); // weight mass: dragon 3, wyrm 1 → 0.5*4=2 lands in dragon
  assert.equal(c.rollPickSource('dragon 3|wyrm', {}, {}), 'dragon');
  c.resetRandom();
});

// ── A5: item-weight expressions ({a | b {= expr}}) — dynamic odds over vars ──
test('parseAlt: trailing {= expr} is a weight; a bare {= expr} alt stays content', () => {
  assert.deepEqual(host(c.parseAlt('shield {= str}')), { template: 'shield', weightExpr: 'str' });
  assert.deepEqual(host(c.parseAlt('b 2')), { template: 'b', weight: 2 });           // literal weight unchanged
  assert.deepEqual(host(c.parseAlt('plain')), { template: 'plain', weight: 1 });     // default weight
  // a bare computed-value alt has no preceding template → it is NOT a weight
  assert.deepEqual(host(c.parseAlt('{= 2d6}')), { template: '{= 2d6}', weight: 1 });
});

test('pickWeightedAlt: a {= expr} weight resolves against vars at pick time', () => {
  const alts = [c.parseAlt('rare {= luck}'), c.parseAlt('common 1')];
  // luck = 9 → weights 9 vs 1; 0.5*10 = 5 lands in the first (rare)
  c.seedSequence([0.5]);
  try { assert.equal(c.pickWeightedAlt(alts, { luck: 9 }).template, 'rare'); }
  finally { c.resetRandom(); }
  // luck = 0 (via expression) → weight 0 disables it; only 'common' remains
  const alts2 = [c.parseAlt('rare {= luck}'), c.parseAlt('common 1')];
  c.seedSequence([0.0]);
  try { assert.equal(c.pickWeightedAlt(alts2, { luck: 0 }).template, 'common'); }
  finally { c.resetRandom(); }
});

test('pickWeightedAlt: an unresolved weight expr falls back to neutral 1 (alt not dropped)', () => {
  const alts = [c.parseAlt('a {= missing}'), c.parseAlt('b {= missing}')];
  c.seedSequence([0.25]); // both neutral weight 1 → 0.25*2=0.5 lands in the first
  try { assert.equal(c.pickWeightedAlt(alts, {}).template, 'a'); }
  finally { c.resetRandom(); }
});

test('parseRules: a rule-level {= expr} dynamic weight is KEPT, not silently dropped', () => {
  // Regression: the filter `a.weight >= 1` dropped dynamic-weight alts (which carry
  // weightExpr, not weight), so `p: peace | war {= w}` lost the war alt entirely.
  const p = c.parseRules('p: peace | war {= w}');
  assert.equal(p.rules.p.length, 2, 'both alternatives survive parse');
  assert.deepEqual(host(p.rules.p[1]), { template: 'war', weightExpr: 'w' });
  // and it actually weights at runtime, matching the inline {a|b {= w}} form
  c.seedSequence([0.5]); // war weight 50 vs peace 1 → mass lands in war
  try { assert.equal(c.runGrammar('p: peace | war {= w}', 'p', null, { w: 50 }), 'war'); }
  finally { c.resetRandom(); }
  // a static 0-weight alt is still dropped (unchanged behavior)
  assert.equal(c.parseRules('p: a | b 0').rules.p.length, 1);
});

test('resolveBrace: a {= expr} weight drives a live alternation through the engine', () => {
  // strong=10 vs weak default 1 → with 0.5 the mass lands in the heavy alt
  c.seedSequence([0.5]);
  try {
    const ctx = { rules: {}, vars: { strong: 10 }, depth: 0, stack: [] };
    assert.equal(c.resolveBrace('hit {= strong} | miss', ctx), 'hit');
  } finally { c.resetRandom(); }
});

// ── yes/no oracle (a weighted-alt recipe; reuses A5 for dynamic odds) ────────
test('oracle: every band is a valid weighted Yes/No alternation with the right bias', () => {
  const bands = ['Yes 19 | No 1', 'Yes 3 | No 1', 'Yes 1 | No 1', 'Yes 1 | No 3', 'Yes 1 | No 19'];
  for (const body of bands) {
    c.seedSequence([0.0]); assert.match(c.rollPickSource(body, {}, {}), /^(Yes|No)$/, body);
    c.resetRandom();
  }
  // "Certain" (Yes 19 | No 1): the low end of the mass is Yes; only the top sliver is No
  c.seedSequence([0.0]);  try { assert.equal(c.rollPickSource('Yes 19 | No 1', {}, {}), 'Yes'); } finally { c.resetRandom(); }
  c.seedSequence([0.99]); try { assert.equal(c.rollPickSource('Yes 19 | No 1', {}, {}), 'No'); }  finally { c.resetRandom(); }
  // "Impossible" inverts the bias
  c.seedSequence([0.99]); try { assert.equal(c.rollPickSource('Yes 1 | No 19', {}, {}), 'No'); }  finally { c.resetRandom(); }
});

test('oracle: dynamic odds — a {= expr} weight reads a variable (A5 inside the oracle body)', () => {
  // luck=20 vs No 1 → almost always Yes; with 0.0 the mass lands in Yes
  c.seedSequence([0.0]);
  try { assert.equal(c.rollPickSource('Yes {= luck} | No 1', {}, { luck: 20 }), 'Yes'); }
  finally { c.resetRandom(); }
});

test('oracle: front-door wiring (src pins)', () => {
  assert.ok(_src.includes("id:'oracle'"), 'oracle @ menu entry missing');
  assert.ok(_src.includes("id === 'oracle'"), 'oracle insert dispatch missing');
  assert.ok(_src.includes('function openOracleDialog('), 'oracle dialog missing');
  assert.ok(_src.includes('ORACLE_BANDS'), 'oracle likelihood bands missing');
});

test('deck door uses its own dialog (regression: openSeqDialog name collision)', () => {
  // A4 named the deck dialog `openSeqDialog`, colliding with the pre-existing
  // state-set sequence dialog of the same name. Function declarations hoist, so the
  // later (state-set) one won and the deck @-door silently opened the WRONG dialog —
  // its Insert button stayed disabled (the deck `body` param was ignored). The deck
  // dialog is now `openDeckDialog`; these pins keep the names from colliding again.
  assert.equal((_src.match(/function openSeqDialog\(/g) || []).length, 1, 'exactly one openSeqDialog (no shadowing)');
  assert.equal((_src.match(/function openDeckDialog\(/g) || []).length, 1, 'exactly one openDeckDialog');
  assert.match(_src, /id === 'deck'[\s\S]{0,120}openDeckDialog\(/, 'deck dispatch must call openDeckDialog, not openSeqDialog');
});

test('@-dialog insert keeps its sidecar record (regression: mid-insert prune dropped it)', () => {
  // Every @-menu dialog door (dice/grammar/deck/oracle/…) pushes a sidecar record then
  // calls applyInlineInsertion. That flushes the active edit via ed.blur() → exitEdit,
  // which serialized the BUFFER (without the not-yet-spliced token) to node.text and
  // pruned the just-pushed record → a broken "missing data" pill that only entered edit
  // mode on click. The flush now suppresses pruning; the next real exit prunes normally.
  assert.ok(_src.includes('_suppressPruneOnFlush'), 'prune-suppression flag missing');
  assert.match(_src, /_suppressPruneOnFlush = true;\s*ed\.blur\(\);\s*_suppressPruneOnFlush = false;/, 'flush must wrap ed.blur() in the suppression flag');
  assert.match(_src, /if \(!_suppressPruneOnFlush\)\s*pruneArtifacts\(node\)/, 'exitEdit prune must honor the flag');
  assert.match(_src, /function pruneArtifacts\(node\)\s*\{[\s\S]{0,200}pruneGrammar\(node\)/, 'pruneArtifacts bundles the per-type prunes incl. pruneGrammar');
});

test('rollPickSource: dice source rolls through the dice core', () => {
  c.seedSequence([0]); // every die rolls its minimum
  assert.equal(c.rollPickSource('2d6', {}, {}), '2');
  c.resetRandom();
});

test('rollPickSource: template source expands embedded braces', () => {
  const rules = {
    color: [{ template: 'red', weight: 1 }],
    beast: [{ template: 'cat', weight: 1 }],
  };
  c.seedSequence([0]);
  assert.equal(c.rollPickSource('{color} {beast}', rules, {}), 'red cat');
  c.resetRandom();
});

test('rollPickSource: bare name resolves a rule, then a variable, else marker', () => {
  const rules = { color: [{ template: 'blue', weight: 1 }] };
  c.seedSequence([0]);
  assert.equal(c.rollPickSource('color', rules, {}), 'blue');
  assert.equal(c.rollPickSource('width', {}, { width: 42 }), '42');
  assert.equal(c.rollPickSource('nosuch', {}, {}), '{nosuch?}'); // visible-failure marker
  c.resetRandom();
});

test('rollPickSource: a quoted bare word is a literal string, not a rule lookup', () => {
  const rules = { hello: [{ template: 'ROLLED', weight: 1 }] };
  c.seedSequence([0]);
  // unquoted bare word still does a rule lookup (predictable, unchanged)
  assert.equal(c.rollPickSource('hello', rules, {}), 'ROLLED');
  // quotes force the literal — the escape hatch for {label := "hello"}
  assert.equal(c.rollPickSource('"hello"', rules, {}), 'hello');
  assert.equal(c.rollPickSource("'hello'", rules, {}), 'hello');
  // a word with no matching rule: bare → marker, quoted → the literal text
  assert.equal(c.rollPickSource('nosuch', {}, {}), '{nosuch?}');
  assert.equal(c.rollPickSource('"nosuch"', {}, {}), 'nosuch');
  // nested {…} still expands inside a quoted literal (a text frame, not a dead end)
  assert.equal(c.rollPickSource('"say {hello}"', rules, {}), 'say ROLLED');
  c.resetRandom();
});

test('rollPickSource: empty source → null (callers branch on null)', () => {
  assert.equal(c.rollPickSource('', {}, {}), null);
  assert.equal(c.rollPickSource('   ', {}, {}), null);
});

// Build a tree with one pick declaration + (optionally) other var declarations.
const mkPickRoot = (recs) => {
  const root = c.mkRoot();
  for (const rec of recs) {
    const n = c.mkNode(`[[var:${rec.key}]]`);
    n.vars = [rec];
    root.children.push(n);
  }
  return root;
};

test('collectVars: a pick contributes its FROZEN rolled string (no evaluation)', () => {
  const root = mkPickRoot([{ key: 'p1', name: 'beast', kind: 'pick', expr: 'dragon|wyrm', rolled: 'wyrm' }]);
  const vars = c.collectVars(root);
  assert.equal(vars.beast, 'wyrm');
});

test('collectVars: repeated resolution never re-rolls (frozen across passes)', () => {
  const rec = { key: 'p1', name: 'beast', kind: 'pick', expr: 'dragon|wyrm|drake', rolled: 'drake' };
  const root = mkPickRoot([rec]);
  // a moving RNG would change the value IF the engine ran — it must not
  c.seedSequence([0.1, 0.5, 0.9, 0.3]);
  const a = c.collectVars(root).beast;
  const b = c.collectVars(root).beast;
  const d = c.collectVars(root).beast;
  c.resetRandom();
  assert.equal(a, 'drake');
  assert.equal(b, 'drake');
  assert.equal(d, 'drake');
  assert.equal(rec.rolled, 'drake'); // the stored record is untouched
});

test('collectVars: re-roll = update rolled, every reference resolves the new value', () => {
  const rec = { key: 'p1', name: 'beast', kind: 'pick', expr: 'dragon|wyrm', rolled: 'dragon' };
  const root = mkPickRoot([rec]);
  assert.equal(c.collectVars(root).beast, 'dragon');
  rec.rolled = 'wyrm'; // what rerollPickVar does
  assert.equal(c.collectVars(root).beast, 'wyrm');
});

test('collectVars: mixed map — numbers for formula vars, strings for picks', () => {
  const root = mkPickRoot([
    { key: 'm1', name: 'hp', expr: '10' },
    { key: 'p1', name: 'beast', kind: 'pick', expr: 'dragon|wyrm', rolled: 'dragon' },
  ]);
  const vars = c.collectVars(root);
  assert.equal(vars.hp, 10);
  assert.equal(vars.beast, 'dragon');
});

test('collectVars: a formula var referencing a pick fails VISIBLY (absent), not silently', () => {
  const root = mkPickRoot([
    { key: 'p1', name: 'beast', kind: 'pick', expr: 'dragon|wyrm', rolled: 'dragon' },
    { key: 'm1', name: 'dmg', expr: 'beast*2' }, // text in math — must not compute
  ]);
  const vars = c.collectVars(root);
  assert.equal(vars.beast, 'dragon'); // pick is fine
  assert.equal('dmg' in vars, false); // the math var fails to resolve (renders ?)
});

test('collectVars: last declaration wins across kinds (pick over formula, formula over pick)', () => {
  const pickLast = mkPickRoot([
    { key: 'a1', name: 'x', expr: '5' },
    { key: 'a2', name: 'x', kind: 'pick', expr: 'a|b', rolled: 'b' },
  ]);
  assert.equal(c.collectVars(pickLast).x, 'b');
  const mathLast = mkPickRoot([
    { key: 'b1', name: 'x', kind: 'pick', expr: 'a|b', rolled: 'a' },
    { key: 'b2', name: 'x', expr: '7' },
  ]);
  assert.equal(c.collectVars(mathLast).x, 7);
});

test('evalMath: a string-valued variable fails to null (type-safe, fail-visible)', () => {
  assert.equal(c.evalMath('beast*2', { beast: 'dragon' }), null);
  assert.equal(c.evalMath('beast', { beast: 'dragon' }), null);
});

test('parseDice: a string-valued variable modifier fails to null', () => {
  assert.equal(c.parseDice('1d6+beast', { beast: 'wolf' }), null);
});

test('formatVarValue: strings pass through, numbers format as math results', () => {
  assert.equal(c.formatVarValue('dragon'), 'dragon');
  assert.equal(c.formatVarValue(42), '42');
  assert.equal(c.formatVarValue(2 / 3), c.formatMathResult(2 / 3));
});

test('flattenArtifacts: a pick declaration exports its frozen value', () => {
  const node = c.mkNode('A [[var:p1]] appears');
  node.vars = [{ key: 'p1', name: 'beast', kind: 'pick', expr: 'dragon|wyrm', rolled: 'dragon' }];
  const out = c.flattenArtifacts(node.text, node, { beast: 'dragon' });
  assert.equal(out, 'A beast = dragon appears');
});

test('flattenArtifacts: a display-only reference to a pick exports the frozen text', () => {
  const node = c.mkNode('It was [[var:r1]]!');
  node.vars = [{ key: 'r1', name: 'beast', expr: '' }]; // display-only ref record
  const out = c.flattenArtifacts(node.text, node, { beast: 'wyrm' });
  assert.equal(out, 'It was wyrm!');
});

// UXP-137: the freeze-to-text core produces exactly what flattenArtifacts inlines (lockstep).
test('frozenTokenText — per type, and matches flattenArtifacts', () => {
  const node = c.mkNode('x');
  node.dice = [{ key: 'd1', expr: '2d6', total: 7, parts: [{ kind: 'dice', sides: 6 }] }];
  node.grammar = [{ key: 'g1', result: 'a goblin', anon: true }];
  node.markov = [{ key: 'm1', path: ['a', 'b', 'c'] }];
  assert.equal(c.frozenTokenText('dice', 'd1', node, {}), '2d6 = 7');
  assert.equal(c.frozenTokenText('grammar', 'g1', node, {}), 'a goblin');
  assert.equal(c.frozenTokenText('markov', 'm1', node, {}), 'a → b → c');
  assert.equal(c.frozenTokenText('dice', 'missing', node, {}), '');   // no record → ''
  // lockstep: flattening the token yields the same string frozenTokenText returns
  node.text = 'You find [[grammar:g1]]';
  assert.equal(c.flattenArtifacts(node.text, node, {}), 'You find a goblin');
});

test('OPML: a pick record serializes kind + rolled into the _vars attribute', () => {
  const root = mkPickRoot([{ key: 'p1', name: 'beast', kind: 'pick', expr: 'dragon|wyrm', rolled: 'dragon' }]);
  const xml = c.toOpml(root);
  assert.ok(xml.includes('_vars='), 'vars sidecar should serialize');
  assert.ok(xml.includes('pick'), 'kind:pick should ride the JSON blob');
  assert.ok(xml.includes('rolled'), 'rolled should ride the JSON blob');
});

test('regression: formula-only variables are untouched by the pick branch', () => {
  const root = mkPickRoot([
    { key: 'r', name: 'r', expr: '5' },
    { key: 'a', name: 'area', expr: 'pi*r^2' },
  ]);
  const vars = c.collectVars(root);
  assert.equal(vars.r, 5);
  assert.ok(Math.abs(vars.area - Math.PI * 25) < 1e-9);
});

// ── mathErrorReason — reason-coded #ERR (UXP-8 table cells, UXP-34 math pills) ──
// Classifies why evalMath(expr, vars) returned null, so the failure carries a cause
// instead of a bare #ERR or (worse) a stale last-good value.
{
  const { mathErrorReason } = c;

  test('mathErrorReason — an undeclared identifier is a bad ref', () => {
    assert.equal(mathErrorReason('x * 2', {}), 'bad ref');
    assert.equal(mathErrorReason('$1 * tax', {}), 'bad ref'); // table-style: tax undeclared
  });

  test('mathErrorReason — a string-valued (pick) variable is non-numeric', () => {
    assert.equal(mathErrorReason('beast * 2', { beast: 'dragon' }), 'non-numeric');
  });

  test('mathErrorReason — a cyclic identifier reports cycle (most specific)', () => {
    assert.equal(mathErrorReason('a + 1', {}, new Set(['a'])), 'cycle');
  });

  test('mathErrorReason — constants and function calls are not flagged', () => {
    assert.equal(mathErrorReason('2*pi', {}), '');            // pi is a constant, not a var
    assert.equal(mathErrorReason('sqrt(16) + e', {}), '');    // sqrt( → fn, e → constant
    assert.equal(mathErrorReason('c2f(20)', {}), '');         // unit-conversion fn, no enumeration needed
    assert.equal(mathErrorReason('asdate(today + 90)', {}), '');
  });

  test('mathErrorReason — a resolvable numeric variable is not flagged', () => {
    assert.equal(mathErrorReason('r * 2', { r: 5 }), '');
  });

  test('mathErrorReason — a malformed expression with no bad identifier is generic', () => {
    assert.equal(mathErrorReason('2 + * 3', {}), '');  // syntactic garbage → bare #ERR, no parenthetical
  });

  test('mathErrorReason — bad ref wins over non-numeric when both are present', () => {
    assert.equal(mathErrorReason('missing + beast', { beast: 'dragon' }), 'bad ref');
  });

  test('mathErrorReason — estimate-constructor syntax reads as estimate, not bad ref', () => {
    // crossing the estimate↔math boundary: the `to` operator / normal( / uniform(
    assert.equal(mathErrorReason('5 to 10', {}), 'estimate');
    assert.equal(mathErrorReason('(5 to 10) + 1', {}), 'estimate');   // was 'bad ref' (the `to` looked like an unknown name)
    assert.equal(mathErrorReason('normal(8, 2)', {}), 'estimate');
    assert.equal(mathErrorReason('2 * uniform(0, 10)', {}), 'estimate');
    // it is the MOST specific reason — wins even when a bad ref is also present
    assert.equal(mathErrorReason('missing + 5 to 10', {}), 'estimate');
    // and it does NOT false-positive on innocent math: `today` (contains "to"),
    // a var named `total`, or a function with no estimate keyword
    assert.equal(mathErrorReason('asdate(today + 90)', {}), '');
    assert.equal(mathErrorReason('total * 2', { total: 5 }), '');
    assert.equal(mathErrorReason('c2f(20)', {}), '');
  });

  test('mathReasonPhrase — one human phrase per code, shared by the dialogs (P1)', () => {
    // Each code maps to a non-empty, plain-language phrase. The phrases name the
    // problem in user terms (no engine jargon) and, where there is one, the fix.
    assert.match(c.mathReasonPhrase('estimate'), /estimate/);
    assert.match(c.mathReasonPhrase('estimate'), /5 to 10/);          // shows the user form, not "separate engine"
    assert.match(c.mathReasonPhrase('bad ref'), /declare it|add it as a property/); // names the fix
    assert.match(c.mathReasonPhrase('non-numeric'), /not a number/);
    assert.match(c.mathReasonPhrase('cycle'), /depends on itself/);
    // jargon must NOT reappear (the de-jargon pass, this commit)
    assert.doesNotMatch(c.mathReasonPhrase('estimate'), /separate engine/);
    assert.doesNotMatch(c.mathReasonPhrase('non-numeric'), /text pick/);
    assert.equal(c.mathReasonPhrase(''), '');         // generic → caller's own fallback
    assert.equal(c.mathReasonPhrase('whatever'), ''); // unknown code → no phrase
  });
}

// ── unfold/refold + offset translation (UXP-30 / UXP-31) ───────────────────────
// In edit mode, inline-able [[type:key]] tokens unfold to their {…} source; the
// token form is LONGER, so any offset captured against the edit buffer must be
// translated before it touches the folded text. foldedOffsetFor is that inverse
// (of unfoldedPrefixLen); foldedTextForSave is what undo entries must record.
{
  const diceNode = (text) => {
    const n = c.mkNode(text);
    n.dice = [{ key: 'k1', expr: '2d6', result: 7 }];
    return n;
  };

  test('artifactToShorthand — inline-able forms and atomic nulls', () => {
    assert.equal(c.artifactToShorthand('dice', { expr: '2d6' }), '{2d6}');
    assert.equal(c.artifactToShorthand('math', { expr: '2*r' }), '{= 2*r}');
    assert.equal(c.artifactToShorthand('var', { name: 'str', expr: '' }), '{str}');   // display-only unfolds
    assert.equal(c.artifactToShorthand('var', { name: 'str', expr: '5' }), null);     // declaring stays atomic
    // only ANONYMOUS grammar shorthand unfolds — a named grammar (incl. a
    // collapsed roll table) is a declaration: unfolding would lose the doc-wide
    // name on edit (re-promotion is anonymous), so it stays atomic
    assert.equal(c.artifactToShorthand('grammar', { def: 'origin: red | blue', origin: 'origin', anon: true }), '{red | blue}');
    assert.equal(c.artifactToShorthand('grammar', { def: 'color: red | blue', origin: 'color' }), null);       // named stays atomic
    assert.equal(c.artifactToShorthand('grammar', { def: 'a: x\nb: y', origin: 'a', anon: true }), null);      // multi-rule stays atomic
  });

  test('unfoldArtifacts ⇄ foldedTextForSave — untouched shorthand folds back verbatim', () => {
    const n = diceNode('a [[dice:k1]] b');
    c.unfoldArtifacts(n);
    assert.equal(n.text, 'a {2d6} b');
    assert.equal(c.foldedTextForSave(n), 'a [[dice:k1]] b'); // the token, frozen roll intact
    assert.equal(n.text, 'a {2d6} b');                       // non-mutating
    n.text = 'a {2d6} b plus prose';                         // typing elsewhere
    assert.equal(c.foldedTextForSave(n), 'a [[dice:k1]] b plus prose');
    c.refoldArtifacts(n);
    assert.equal(n.text, 'a [[dice:k1]] b plus prose');
  });

  test('foldedTextForSave — an EDITED shorthand is left literal (promote owns it)', () => {
    const n = diceNode('a [[dice:k1]] b');
    c.unfoldArtifacts(n);
    n.text = 'a {3d8} b'; // user rewrote the dice source
    assert.equal(c.foldedTextForSave(n), 'a {3d8} b');
    c.refoldArtifacts(n);
  });

  test('foldedOffsetFor — identity on token-free text', () => {
    const n = c.mkNode('plain prose only');
    assert.equal(c.foldedOffsetFor(n, 0), 0);
    assert.equal(c.foldedOffsetFor(n, 7), 7);
  });

  test('foldedOffsetFor — before / after / inside an unfolded span', () => {
    // folded 'a [[dice:k1]] b' (token at 2..13) ⇄ unfolded 'a {2d6} b' (span at 2..7)
    const n = diceNode('a [[dice:k1]] b');
    assert.equal(c.foldedOffsetFor(n, 0), 0);
    assert.equal(c.foldedOffsetFor(n, 2), 2);   // just before the span
    assert.equal(c.foldedOffsetFor(n, 7), 13);  // just after the span → just after the token
    assert.equal(c.foldedOffsetFor(n, 4), 13);  // INSIDE the span → snaps after the token
    assert.equal(c.foldedOffsetFor(n, 9), 15);  // end of buffer → end of folded text
  });

  test('foldedOffsetFor — the UXP-30 repro: stale offset would land inside the token', () => {
    // unfolded buffer 'a {2d6} b ' caret at end (10); folded 'a [[dice:k1]] b ' —
    // raw 10 falls inside [[dice:k1]] (2..13): the corruption. Translated → 16 (end).
    const n = diceNode('a [[dice:k1]] b ');
    assert.equal(c.foldedOffsetFor(n, 10), 16);
  });

  test('foldedOffsetFor — accumulates across multiple inline-able tokens', () => {
    const n = c.mkNode('[[dice:a1]]+[[math:m1]] end');
    n.dice = [{ key: 'a1', expr: '2d6' }];
    n.math = [{ key: 'm1', expr: '2*r' }];
    // unfolded: '{2d6}+{= 2*r} end' (17) ⇄ folded (27)
    assert.equal(c.foldedOffsetFor(n, 6), 12);   // between the two tokens
    assert.equal(c.foldedOffsetFor(n, 17), 27);  // end ↔ end
  });

  test('foldedOffsetFor — atomic tokens (declaring var / named grammar) are identity', () => {
    const n = c.mkNode('x [[var:v1]] y');
    n.vars = [{ key: 'v1', name: 'str', expr: '5' }]; // declaring → no unfold
    assert.equal(c.foldedOffsetFor(n, 14), 14);
    const n2 = c.mkNode('x [[grammar:r1]] y');        // named grammar → atomic, no unfold
    n2.grammar = [{ key: 'r1', def: 'loot: a | b', origin: 'loot', result: 'a' }];
    assert.equal(c.foldedOffsetFor(n2, 18), 18);
  });

  test('foldedOffsetFor ∘ unfoldedPrefixLen — round-trips folded boundary offsets', () => {
    const n = diceNode('a [[dice:k1]] b');
    for (const p of [0, 1, 2, 13, 14, 15]) { // every plain-text/boundary offset
      assert.equal(c.foldedOffsetFor(n, c.unfoldedPrefixLen(n, n.text.slice(0, p))), p);
    }
  });
}

// ── classifyBraceBody (UXP-6: the typo signal) ───────────────────────────────
// Classifies a {body} the way promoteBraceBody will treat it on exit, with
// explicit rules/vars (pure). 'invalid' is the set that used to fail SILENTLY:
// styled as valid grammar (or as nothing) but left as literal text on exit.

test('classifyBraceBody: valid artifact bodies classify artifact', () => {
  assert.equal(c.classifyBraceBody('2d6', {}, {}), 'artifact');           // dice
  assert.equal(c.classifyBraceBody('= 2*3', {}, {}), 'artifact');         // expression
  assert.equal(c.classifyBraceBody('= x', {}, { x: 5 }), 'artifact');     // expr over a var
  assert.equal(c.classifyBraceBody('a|b 2|c', {}, {}), 'artifact');       // alternation
  assert.equal(c.classifyBraceBody('color', { color: ['red'] }, {}), 'artifact'); // known rule
  assert.equal(c.classifyBraceBody('str', {}, { str: 3 }), 'artifact');   // known var
  // a typed decl whose formula references a not-yet-defined var is a valid artifact
  // (a live formula, not a frozen pick) — the {y := x} regression, edit-mode side
  assert.equal(c.classifyBraceBody('y := x', {}, {}), 'artifact');
  assert.equal(c.classifyBraceBody('total := x + z', {}, {}), 'artifact');
});

test('classifyBraceBody: attempted-but-broken bodies classify invalid (no more silent failure)', () => {
  assert.equal(c.classifyBraceBody('2d6kh', {}, {}), 'invalid');  // dice sniff passes, parse fails
  assert.equal(c.classifyBraceBody('= 2*', {}, {}), 'invalid');   // malformed expression
  assert.equal(c.classifyBraceBody('=', {}, {}), 'invalid');      // empty expression attempt
  assert.equal(c.classifyBraceBody('= x', {}, {}), 'invalid');    // expr over an unknown var
  assert.equal(c.classifyBraceBody('colr', { color: ['red'] }, {}), 'invalid'); // unknown name (typo)
});

test('classifyBraceBody: prose braces stay literal (the escape hatch)', () => {
  assert.equal(c.classifyBraceBody('hello world', {}, {}), 'literal');
  assert.equal(c.classifyBraceBody('', {}, {}), 'literal');
  assert.equal(c.classifyBraceBody('  ', {}, {}), 'literal');
});

test('classifyBraceBody: a dice-looking body that fails parseDice still falls through like promoteBraceBody', () => {
  // promoteBraceBody does NOT stop at the failed dice branch — '2d6|1d4' then
  // promotes as alternation. The classifier must mirror that fall-through.
  assert.equal(c.classifyBraceBody('2d6|1d4', {}, {}), 'artifact');
});

// ── braceTypeLabel (UXP-7: shorthand live preview) ────────────────────────────
test('braceTypeLabel: identifies the pill type for every valid artifact body', () => {
  const [dt] = c.braceTypeLabel('2d6', {}, {});          assert.equal(dt, 'dice');
  const [mt] = c.braceTypeLabel('= 2*3', {}, {});        assert.equal(mt, 'math');
  const [at] = c.braceTypeLabel('a|b', {}, {});          assert.equal(at, 'grammar');
  const [rt, rd] = c.braceTypeLabel('color', { color: ['red'] }, {});
  assert.equal(rt, 'grammar'); assert.equal(rd, 'color');
  const [vt, vd] = c.braceTypeLabel('str', {}, { str: 5 });
  assert.equal(vt, 'var'); assert.equal(vd, 'str = 5');
});

test('braceTypeLabel: detail is null for dice/math/bare-alternation', () => {
  assert.equal(c.braceTypeLabel('4d6kh3', {}, {})[1], null);  // dice, no detail
  assert.equal(c.braceTypeLabel('= pi*2', {}, {})[1], null);  // math, no detail
  assert.equal(c.braceTypeLabel('a|b|c', {}, {})[1], null);   // alternation, no detail
});

test('braceTypeLabel: var detail shows value (string vars stay string)', () => {
  const [, d1] = c.braceTypeLabel('hero', {}, { hero: 'Arden' });
  assert.equal(d1, 'hero = Arden');
  const [, d2] = c.braceTypeLabel('x', {}, { x: 3.14159 });
  assert.ok(d2.startsWith('x = 3.14'), 'numeric detail shows toPrecision(4) value');
});

// ── collectTags / filterTagCandidates (UXP-10: hashtag autocomplete) ─────────
// (vm-realm arrays/objects fail deepEqual on prototype identity — JSON-normalize)
const plainTags = x => JSON.parse(JSON.stringify(x));

test('collectTags: counts #tags across the tree, most-used first then alpha', () => {
  const root = c.mkRoot();
  const a = c.mkNode('see #alpha and #beta');
  const b = c.mkNode('#alpha again');
  a.children.push(b);
  root.children.push(a);
  assert.deepEqual(plainTags(c.collectTags(root)), [
    { name: 'alpha', count: 2 },
    { name: 'beta',  count: 1 },
  ]);
});

test('collectTags: link tokens, headings, and mid-word # are not tags', () => {
  const root = c.mkRoot();
  // [[#abc12|x]] is a node link (token stripped before the scan); '# heading' has
  // no word right after #; 'not#tag' has the sigil mid-word (mdInline rule).
  root.children.push(c.mkNode('[[#abc12|x]] # heading not#tag #real'));
  assert.deepEqual(plainTags(c.collectTags(root)), [{ name: 'real', count: 1 }]);
});

test('collectTags: status keywords (#TODO) count deliberately; explicit root bypasses the cache', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode('#TODO ship it'));
  assert.deepEqual(plainTags(c.collectTags(root)), [{ name: 'TODO', count: 1 }]);
  const other = c.mkRoot();
  other.children.push(c.mkNode('#different'));
  assert.deepEqual(plainTags(c.collectTags(other)), [{ name: 'different', count: 1 }]);
});

test('filterTagCandidates: case-insensitive prefix; a lone exact match offers nothing', () => {
  const tags = [{ name: 'alpha', count: 2 }, { name: 'Alps', count: 1 }, { name: 'beta', count: 1 }];
  assert.deepEqual(c.filterTagCandidates(tags, 'al').map(t => t.name), ['alpha', 'Alps']);
  assert.deepEqual(plainTags(c.filterTagCandidates(tags, '')), tags); // bare # → full list
  assert.deepEqual(plainTags(c.filterTagCandidates(tags, 'beta')), []);        // fully typed → dismiss
  assert.deepEqual(plainTags(c.filterTagCandidates(tags, 'x')), []);           // no match
});

test('UXP-39: rendered #hashtag is keyboard-operable (role/tabindex + Enter/Space twin)', () => {
  // the rendered chip carries button semantics + AT focus reach (mirrors note-ind/prop-chip).
  // (#464 inserts an optional data-color between data-tag and role, so match the parts, not one string.)
  assert.ok(/class="hashtag" data-tag="#\$\{t\}"/.test(_src), 'hashtag class + data-tag');
  assert.ok(/role="button" tabindex="-1" aria-label="Filter by #\$\{t\}"/.test(_src), 'hashtag role/tabindex/aria-label');
  assert.ok(_src.includes('.hashtag:focus-visible'), 'hashtag focus-visible style missing');
  // the keyboard twin: Enter/Space on a focused chip runs the same filter as the click
  assert.ok(_src.includes("closest?.('.hashtag')"), 'hashtag Enter/Space branch missing');
  assert.ok(_src.includes('function searchHashtag('), 'shared searchHashtag helper missing');
});

test('UXP-38: variables panel announces changes (aria-live + change-guard, no per-keystroke spam)', () => {
  assert.ok(_src.includes('id="var-panel-list" aria-live="polite"'), 'var panel aria-live missing');
  // the rebuild is signature-guarded so an unchanged list is not re-emitted on every markDirty
  assert.ok(_src.includes('list.dataset.sig === sig'), 'var panel change-guard missing');
});

// ── divider derives from the text (UXP-26: markdown-first, no destruction) ───
// The break (---/***/___, HR_RE) lives in node.text; lines below it are the
// hover-reveal section label; node.type is a derived hint like headings.

test('deriveTypeFromText: a first-line thematic break derives divider', () => {
  assert.equal(c.deriveTypeFromText('---'), 'divider');
  assert.equal(c.deriveTypeFromText('***'), 'divider');
  assert.equal(c.deriveTypeFromText('___'), 'divider');
  assert.equal(c.deriveTypeFromText('---\nsection label'), 'divider'); // label below the break
  assert.equal(c.deriveTypeFromText('--- x'), null);   // trailing text → not a break
  assert.equal(c.deriveTypeFromText('a\n---'), null);  // break must be the FIRST line
  assert.equal(c.deriveTypeFromText('--'), null);      // two dashes are prose
});

test('migrateNodePrefixes: legacy type-only divider gets its break written in, label preserved', () => {
  const root = c.mkRoot();
  const bare = c.mkNode('');                bare.type = 'divider';
  const labeled = c.mkNode('north wing');   labeled.type = 'divider';
  const modern = c.mkNode('---\nkeep');     modern.type = 'divider';
  root.children.push(bare, labeled, modern);
  c.migrateNodePrefixes(root);
  assert.equal(bare.text, '---');
  assert.equal(labeled.text, '---\nnorth wing');  // the old hidden label survives below the break
  assert.equal(modern.text, '---\nkeep');         // already self-consistent — untouched
});

// ── migrateEmphasisText (UXP-27: legacy whole-node italic/underline → markdown) ─

test('migrateEmphasisText: wraps plain text per flag combination', () => {
  assert.equal(c.migrateEmphasisText('hello', true, false), '*hello*');
  assert.equal(c.migrateEmphasisText('hello', false, true), '++hello++');
  assert.equal(c.migrateEmphasisText('hello', true, true), '*++hello++*');
  assert.equal(c.migrateEmphasisText('hello', false, false), 'hello');
});

test('migrateEmphasisText: per line, after block prefixes; structural lines untouched', () => {
  const src = '# Title\n> a quote\n- item\n- [ ] task\n3. third\n\n---\n| a | b |\nplain';
  assert.equal(c.migrateEmphasisText(src, true, false),
    '# *Title*\n> *a quote*\n- *item*\n- [ ] *task*\n3. *third*\n\n---\n| a | b |\n*plain*');
});

test('migrateEmphasisText: fenced code (content and fences) left untouched', () => {
  const src = 'before\n```\ncode line\n```\nafter';
  assert.equal(c.migrateEmphasisText(src, true, false),
    '*before*\n```\ncode line\n```\n*after*');
});

test('migrateNodePrefixes: folds legacy flags into the text and deletes them', () => {
  const root = c.mkRoot();
  const it = c.mkNode('slanted');  it.italic = true;
  const ul = c.mkNode('scored');   ul.underline = true;
  const both = c.mkNode('fancy');  both.italic = true; both.underline = true;
  const plain = c.mkNode('plain');
  root.children.push(it, ul, both, plain);
  c.migrateNodePrefixes(root);
  assert.equal(it.text, '*slanted*');
  assert.equal(ul.text, '++scored++');
  assert.equal(both.text, '*++fancy++*');
  assert.equal(plain.text, 'plain');
  for (const n of [it, ul, both, plain]) {
    assert.equal('italic' in n, false);
    assert.equal('underline' in n, false);
  }
});

test('toOpml: never writes _italic/_underline attributes', () => {
  const root = c.mkRoot();
  const n = c.mkNode('hello'); n.italic = true; n.underline = true; // even if set
  root.children.push(n);
  const xml = c.toOpml(root);
  assert.ok(!xml.includes('_italic'));
  assert.ok(!xml.includes('_underline'));
});

test('textForDisplay: divider shows the label only (break line stripped)', () => {
  const labeled = c.mkNode('---\nnorth wing'); labeled.type = 'divider';
  assert.equal(c.textForDisplay(labeled), 'north wing');
  const bare = c.mkNode('---'); bare.type = 'divider';
  assert.equal(c.textForDisplay(bare), '');
});

test('mdToHtml: a thematic break line renders a real <hr> (the divider visual source)', () => {
  assert.ok(c.mdToHtml('---').includes('<hr class="md-hr">'));
  assert.ok(c.mdToHtml('---\nlabel').includes('<hr class="md-hr">'));
});

// ── pill aria-labels (UXP-15: P3-6 interim labels, menu vocabulary) ──────────
// Labels live in the renderers, so every repaint — including a reroll — updates
// them for free. The label words match the @-menu entry labels (one vocabulary).

test('pill aria-labels: each renderer emits an accurate label', () => {
  const dice = c.renderDicePill('k', { key: 'k', expr: '2d6', total: 7, parts: [] });
  assert.ok(dice.includes('aria-label="Dice roll 2d6 = 7. Click to re-roll"'), dice);
  const mk = c.renderMarkovPill('m', { key: 'm', def: 'a -> b', start: 'a', steps: 1, path: ['a', 'b'] });
  assert.ok(mk.includes('aria-label="Markov chain: a → b. Click to re-roll"'), mk);
  const named = c.renderMarkovPill('m', { key: 'm', def: 'a -> b', start: 'a', steps: 1, path: ['a', 'b'], name: 'walk' });
  assert.ok(named.includes('aria-label="Markov chain walk: a → b'), named);
  // a named (non-anon) grammar — incl. a collapsed roll table — speaks its callable name
  const namedGr = c.renderGrammarPill('r', { key: 'r', def: 'loot: a sword', origin: 'loot', result: 'a sword' });
  assert.ok(namedGr.includes('aria-label="Grammar loot: a sword. Click to re-generate"'), namedGr);
  assert.ok(namedGr.includes('Callable as {loot}'), namedGr);
  const gr = c.renderGrammarPill('g', { key: 'g', def: 'origin: x', origin: 'origin', result: 'x!', anon: true });
  assert.ok(gr.includes('aria-label="Grammar: x!. Click to re-generate"'), gr);
  const sq = c.renderSeqPill('q', { key: 'q', name: 'Flow', states: ['A', 'B', 'C'], doneFrom: 2 });
  assert.ok(sq.includes('aria-label="Sequence Flow. Active: A B; done: C. Click to edit"'), sq);
});

test('pill aria-labels: dead-record fallbacks are labeled too', () => {
  assert.ok(c.renderDicePill('k', null).includes('aria-label="Dice roll (missing data)"'));
  assert.ok(c.renderGrammarPill('g', null).includes('aria-label="Grammar (missing data)"'));
});

test('diceTotalStr: success pools and Fate totals format like the pill', () => {
  assert.equal(c.diceTotalStr({ total: 7, parts: [] }), '7');
  assert.equal(c.diceTotalStr({ total: 3, parts: [{ kind: 'dice', sides: 6, success: '>=' }] }), '3 succ');
  assert.equal(c.diceTotalStr({ total: 2, parts: [{ kind: 'dice', sides: 'F' }] }), '+2');
  assert.equal(c.diceTotalStr({ total: -1, parts: [{ kind: 'dice', sides: 'F' }] }), '-1');
});

// ── linkCandidates (UXP-4: the [[ picker's source) ───────────────────────────

test('linkCandidates: substring match on titles, excludes self and title-less points', () => {
  const root = c.mkRoot();
  const a = c.mkNode('Alpha section');
  const b = c.mkNode('beta notes');
  const child = c.mkNode('alphabet child');
  const empty = c.mkNode('');
  a.children.push(child);
  root.children.push(a, b, empty);
  const plain = x => JSON.parse(JSON.stringify(x));
  // case-insensitive substring, walked depth-first
  assert.deepEqual(plain(c.linkCandidates('alpha', 'none', root)).map(t => t.title),
    ['Alpha section', 'alphabet child']);
  // the linking point itself is excluded
  assert.deepEqual(plain(c.linkCandidates('alpha', a.id, root)).map(t => t.title),
    ['alphabet child']);
  // empty query lists every titled point (empty-title point skipped)
  assert.equal(c.linkCandidates('', 'none', root).length, 3);
});

test('linkCandidates: titles come through textForDisplay (prefixes stripped)', () => {
  const root = c.mkRoot();
  const h = c.mkNode('# Heading title'); h.type = 'h1';
  root.children.push(h);
  const out = JSON.parse(JSON.stringify(c.linkCandidates('heading', 'none', root)));
  assert.deepEqual(out.map(t => t.title), ['Heading title']);
});

// ── linkCreateOption (link-and-create: the "+ New point" picker row) ──────────
test('linkCreateOption: trimmed raw-case title, or null on empty/whitespace', () => {
  assert.deepEqual(host(c.linkCreateOption('Dragon')), { title: 'Dragon' });
  assert.deepEqual(host(c.linkCreateOption('  spaced  ')), { title: 'spaced' });   // trimmed
  assert.deepEqual(host(c.linkCreateOption('New Idea')), { title: 'New Idea' });   // case PRESERVED (vs the lowercased match query)
  assert.equal(c.linkCreateOption(''), null);
  assert.equal(c.linkCreateOption('   '), null);                              // whitespace-only → no create row
  assert.equal(c.linkCreateOption(null), null);
});

test('linkCreateOption: the created stub is an ordinary markdown-aware node', () => {
  const title = c.linkCreateOption('Buy milk').title;
  const stub = c.mkNode(title);
  assert.equal(stub.text, 'Buy milk');
  // full sidecars, like any node (so it round-trips and can carry artifacts later)
  assert.ok(Array.isArray(stub.children) && Array.isArray(stub.dice) && Array.isArray(stub.props));
  // a plain title has no derived type (→ the wiring falls back to 'ul'); a task
  // title still classifies, reusing capture's markdown-awareness
  assert.equal(c.deriveTypeFromText('Buy milk'), null);
  assert.equal(c.deriveTypeFromText('- [ ] buy milk'), 'todo');
  assert.equal(c.todoDoneFromText('- [ ] buy milk'), false);
  assert.equal(c.todoDoneFromText('- [x] buy milk'), true);
});

test('link-and-create: a mid-edit create defers a full render to exit (wiring guard)', () => {
  // Verified live in a browser: creating a stub mid-edit must repaint the whole tree
  // on exit, or the new sibling never appears (exitEdit's partial single-node
  // re-render would hide it). Guard the flag wiring against silent regression.
  const src = readFileSync(_htmlPath, 'utf8');
  assert.ok(src.includes('_pendingFullRender = true'), 'lpApply create branch must set _pendingFullRender');
  assert.ok(src.includes('if (_pendingFullRender)'), 'exitEdit must honor _pendingFullRender with a full render()');
});

// ── collectUnlinkedRefs & linkifyMention (unlinked references) ────────────────
// Build small trees explicitly via mkRoot/mkNode to keep these pure over rootNode.

function makeRefTree() {
  // root → dragon (the target), sibling1 (mentions dragon in prose),
  //         sibling2 (already links to dragon), sibling3 (no mention),
  //         sibling4 (mentions "category" — word-boundary guard)
  const root2 = c.mkRoot();
  const dragon = c.mkNode('Dragon'); dragon.id = 'drg';
  const sib1 = c.mkNode('the dragon sleeps'); sib1.id = 's1';
  const sib2 = c.mkNode('[[#drg|]] guards the hoard'); sib2.id = 's2';
  const sib3 = c.mkNode('no mention here'); sib3.id = 's3';
  const sib4 = c.mkNode('category of beasts'); sib4.id = 's4';
  root2.children.push(dragon, sib1, sib2, sib3, sib4);
  return { root2, dragon, sib1, sib2, sib3, sib4 };
}

test('collectUnlinkedRefs: finds prose mentions, excludes self + linkers + boundary non-matches', () => {
  const { root2, sib1 } = makeRefTree();
  const out = c.collectUnlinkedRefs('drg', root2);
  assert.equal(out.length, 1, 'only the plain-prose mention (not self, not linker, not boundary)');
  assert.equal(out[0].id, sib1.id);
});

test('collectUnlinkedRefs: case-insensitive match', () => {
  const root2 = c.mkRoot();
  const target = c.mkNode('Dragon'); target.id = 'drg2';
  const sib = c.mkNode('DRAGON roams the land'); sib.id = 'sx';
  root2.children.push(target, sib);
  const out = c.collectUnlinkedRefs('drg2', root2);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, sib.id);
});

test('collectUnlinkedRefs: already-linking point is excluded (it is a backlink not unlinked)', () => {
  const { root2, sib2 } = makeRefTree();
  const out = c.collectUnlinkedRefs('drg', root2);
  assert.ok(!out.find(r => r.id === sib2.id), 'linker must not appear in unlinked refs');
});

test('collectUnlinkedRefs: word-boundary guard (category must not match cat)', () => {
  const root2 = c.mkRoot();
  const target = c.mkNode('cat'); target.id = 'cat1';
  const sib = c.mkNode('category of things'); sib.id = 'cx';
  root2.children.push(target, sib);
  const out = c.collectUnlinkedRefs('cat1', root2);
  assert.equal(out.length, 0, 'partial word must not match');
});

test('collectUnlinkedRefs: mention inside existing [[…]] token is excluded', () => {
  const root2 = c.mkRoot();
  const target = c.mkNode('Dragon'); target.id = 'drg3';
  // the word "dragon" appears only inside a different link token label
  const sib = c.mkNode('see [[#other|Dragon]] for details'); sib.id = 's_tok';
  root2.children.push(target, sib);
  const out = c.collectUnlinkedRefs('drg3', root2);
  assert.equal(out.length, 0, 'mention inside a token must not count');
});

test('collectUnlinkedRefs: matches the displayed word inside markdown, row title is clean', () => {
  const root2 = c.mkRoot();
  const target = c.mkNode('Dragon'); target.id = 'drgm';
  // "Dragon" appears wrapped in bold markers — it must still match (display = "Dragon"),
  // and the row's shown title must be the rendered text, not the raw markdown.
  const sib = c.mkNode('the **Dragon** is bold'); sib.id = 'smd';
  root2.children.push(target, sib);
  const out = c.collectUnlinkedRefs('drgm', root2);
  assert.equal(out.length, 1, 'word inside markdown still counts');
  assert.equal(out[0].id, 'smd');
  assert.equal(out[0].title, 'the Dragon is bold', 'row title strips markdown syntax');
});

test('collectUnlinkedRefs: a title that only collides with markdown syntax does not false-match', () => {
  const root2 = c.mkRoot();
  // a literal asterisk-pair title can never appear in DISPLAYED text (md is stripped),
  // so a source whose only "match" is the raw `**` must not register.
  const target = c.mkNode('**'); target.id = 'star';   // below min-len anyway, but the point is no syntax match
  const sib = c.mkNode('this has **emphasis** here'); sib.id = 'se';
  root2.children.push(target, sib);
  const out = c.collectUnlinkedRefs('star', root2);
  assert.equal(out.length, 0, 'markdown syntax characters are never matchable text');
});

// ── collectCrossUnlinkedRefs (backlog #3): unlinked mentions across OTHER folder docs ──
test('collectCrossUnlinkedRefs: finds mentions in other docs, skips own doc + already-linkers + non-matches', () => {
  // target lives in docA. docB mentions it in prose (unlinked); docC already cross-links it; docA is
  // skipped (that's collectUnlinkedRefs' job).
  const target = c.mkNode('Roadmap'); target.id = 'rm';
  const docA = c.mkRoot(); docA.docId = 'docA'; docA.children.push(target, c.mkNode('the Roadmap again')); // own-doc: must NOT appear
  const bMention = c.mkNode('see the Roadmap for details'); bMention.id = 'bm';
  const bNo = c.mkNode('nothing relevant'); bNo.id = 'bn';
  const docB = c.mkRoot(); docB.docId = 'docB'; docB.children.push(bMention, bNo);
  const cLinker = c.mkNode('[[docA#rm|the plan]] and Roadmap mentioned too'); cLinker.id = 'cl'; // already links → excluded
  const docC = c.mkRoot(); docC.docId = 'docC'; docC.children.push(cLinker);
  const wsIndex = {
    roots: new Map([['docA', docA], ['docB', docB], ['docC', docC]]),
    nameByDocId: new Map([['docA', 'a.opml'], ['docB', 'b.opml'], ['docC', 'c.opml']]),
    backlinks: new Map([['docA#rm', [{ srcDocId: 'docC', srcNodeId: 'cl' }]]]),   // docC/cl already links docA/rm
  };
  const out = c.collectCrossUnlinkedRefs(target, 'docA', wsIndex);
  assert.equal(out.length, 1, 'only docB unlinked mention (not own doc, not the linker, not the non-match)');
  assert.equal(out[0].nodeId, 'bm');
  assert.equal(out[0].docId, 'docB');
  assert.equal(out[0].docName, 'b.opml');
});

test('collectCrossUnlinkedRefs: no workspace / no roots / short title → empty, no throw', () => {
  const t = c.mkNode('Roadmap'); t.id = 'rm';
  assert.equal(c.collectCrossUnlinkedRefs(t, 'docA', null).length, 0);
  assert.equal(c.collectCrossUnlinkedRefs(t, 'docA', { roots: new Map() }).length, 0);
  const shortT = c.mkNode('Hi'); shortT.id = 'h';   // below UNLINKED_MIN_LEN (3) → no matchable name
  const docB = c.mkRoot(); docB.docId = 'docB'; docB.children.push(c.mkNode('Hi there Hi'));
  assert.equal(c.collectCrossUnlinkedRefs(shortT, 'docA', { roots: new Map([['docB', docB]]), nameByDocId: new Map(), backlinks: new Map() }).length, 0);
});

test('displayText: resolves markdown to shown text (default) and strips link tokens (forMatch)', () => {
  const root2 = c.mkRoot();
  const other = c.mkNode('Other'); other.id = 'oth';
  const n = c.mkNode('a **bold** word and [[#oth|Linked]]'); n.id = 'n1';
  root2.children.push(other, n);
  // default: markdown stripped, link resolved to its caption
  assert.equal(c.displayText(n), 'a bold word and Linked');
  // forMatch: link token removed entirely (an existing link is not an unlinked ref)
  assert.equal(c.displayText(n, { forMatch: true }), 'a bold word and');
});

test('collectUnlinkedRefs: 2-char title → [] (below UNLINKED_MIN_LEN)', () => {
  const root2 = c.mkRoot();
  const target = c.mkNode('ab'); target.id = 'ab1';
  const sib = c.mkNode('the ab test'); sib.id = 'abs';
  root2.children.push(target, sib);
  const out = c.collectUnlinkedRefs('ab1', root2);
  assert.equal(out.length, 0);
});

test('collectUnlinkedRefs: unknown targetId → []', () => {
  const root2 = c.mkRoot();
  root2.children.push(c.mkNode('something'));
  const out = c.collectUnlinkedRefs('nonexistent', root2);
  assert.equal(out.length, 0);
});

test('linkifyMention: wraps the first outside-token occurrence', () => {
  const result = c.linkifyMention('the dragon sleeps', 'Dragon', 'drg');
  assert.equal(result, 'the [[#drg|]] sleeps');
});

test('linkifyMention: case-insensitive, preserves surrounding text exactly', () => {
  const result = c.linkifyMention('I saw DRAGON yesterday', 'Dragon', 'drg');
  assert.equal(result, 'I saw [[#drg|]] yesterday');
});

test('linkifyMention: only first occurrence is converted', () => {
  const result = c.linkifyMention('dragon and then Dragon', 'Dragon', 'drg');
  // first occurrence gets the link; second stays plain text
  assert.equal(result, '[[#drg|]] and then Dragon');
});

test('linkifyMention: null when the only occurrence is inside an existing [[…]] token', () => {
  const result = c.linkifyMention('see [[#other|Dragon]] for details', 'Dragon', 'drg');
  assert.equal(result, null);
});

test('linkifyMention: null when title is absent', () => {
  assert.equal(c.linkifyMention('no match here', 'Dragon', 'drg'), null);
});

test('linkifyMention: null on empty title', () => {
  assert.equal(c.linkifyMention('some text', '', 'drg'), null);
  assert.equal(c.linkifyMention('some text', '   ', 'drg'), null);
});

test('linkifyMention: outside-token occurrence wins when token also exists', () => {
  // text has one token occurrence AND one plain-prose occurrence — the plain one converts first
  const text = '[[#other|Dragon]] the dragon sleeps';
  const result = c.linkifyMention(text, 'Dragon', 'drg');
  // "Dragon" in token label is inside [[…]], "dragon" in prose is outside → prose one links
  assert.equal(result, '[[#other|Dragon]] the [[#drg|]] sleeps');
});

// ── aliases (reserved `aliases` property; aliasesOf / nodeNames pure cores) ────

test('aliasesOf: comma-split, trimmed, empties dropped', () => {
  const n = c.mkNode('Wyrm');
  n.props = [{ key: 'aliases', val: 'wyrm, drake' }];
  assert.deepEqual(host(c.aliasesOf(n)), ['wyrm', 'drake']);
});

test('aliasesOf: trims and drops empty segments', () => {
  const n = c.mkNode('Wyrm');
  n.props = [{ key: 'aliases', val: 'wyrm, , drake,' }];
  assert.deepEqual(host(c.aliasesOf(n)), ['wyrm', 'drake']);
});

test('aliasesOf: no aliases property → []', () => {
  const n = c.mkNode('Wyrm');
  assert.deepEqual(host(c.aliasesOf(n)), []);
  n.props = [{ key: 'status', val: 'open' }];
  assert.deepEqual(host(c.aliasesOf(n)), []);
});

test('aliasesOf: key is case-insensitive, value case preserved', () => {
  const n = c.mkNode('Wyrm');
  n.props = [{ key: 'Aliases', val: 'Dragon, Drake' }];
  assert.deepEqual(host(c.aliasesOf(n)), ['Dragon', 'Drake']);   // key matched case-insensitively, value case kept
});

test('nodeNames: canonical title first, then aliases', () => {
  const n = c.mkNode('Wyrm');
  n.props = [{ key: 'aliases', val: 'dragon, drake' }];
  assert.deepEqual(host(c.nodeNames(n)), ['Wyrm', 'dragon', 'drake']);
});

test('nodeNames: dedupes a case-variant alias equal to the title', () => {
  const n = c.mkNode('Dragon');
  n.props = [{ key: 'aliases', val: 'dragon, wyrm' }];   // 'dragon' duplicates the title (case-insensitive)
  assert.deepEqual(host(c.nodeNames(n)), ['Dragon', 'wyrm']);
});

test('nodeNames: empty title → aliases only', () => {
  const n = c.mkNode('');
  n.props = [{ key: 'aliases', val: 'wyrm, drake' }];
  assert.deepEqual(host(c.nodeNames(n)), ['wyrm', 'drake']);
});

test('linkCandidates: an alias makes a point match, recording which alias hit', () => {
  const root = c.mkRoot();
  const wyrm = c.mkNode('Wyrm'); wyrm.props = [{ key: 'aliases', val: 'dragon, drake' }];
  root.children.push(wyrm);
  const out = JSON.parse(JSON.stringify(c.linkCandidates('dragon', 'none', root)));
  assert.equal(out.length, 1);
  assert.equal(out[0].id, wyrm.id);
  assert.equal(out[0].title, 'Wyrm');     // display stays the canonical title
  assert.equal(out[0].alias, 'dragon');   // the alias that caused the match (picker hint)
});

test('linkCandidates: a title hit sets alias:null even when aliases exist', () => {
  const root = c.mkRoot();
  const wyrm = c.mkNode('Wyrm'); wyrm.props = [{ key: 'aliases', val: 'dragon' }];
  root.children.push(wyrm);
  const out = JSON.parse(JSON.stringify(c.linkCandidates('wyrm', 'none', root)));
  assert.equal(out.length, 1);
  assert.equal(out[0].alias, null);
});

test('linkCandidates: a point with aliases but EMPTY title is not a candidate (§2.5)', () => {
  const root = c.mkRoot();
  const ghost = c.mkNode(''); ghost.props = [{ key: 'aliases', val: 'dragon' }];
  root.children.push(ghost);
  assert.equal(c.linkCandidates('dragon', 'none', root).length, 0);
});

test('linkCandidates: self excluded even on an alias match', () => {
  const root = c.mkRoot();
  const wyrm = c.mkNode('Wyrm'); wyrm.props = [{ key: 'aliases', val: 'dragon' }];
  root.children.push(wyrm);
  assert.equal(c.linkCandidates('dragon', wyrm.id, root).length, 0);
});

test('linkCandidates: non-alias behavior unchanged — alias defaults to null on titled match', () => {
  const root = c.mkRoot();
  const a = c.mkNode('Alpha section');
  root.children.push(a);
  const out = JSON.parse(JSON.stringify(c.linkCandidates('alpha', 'none', root)));
  assert.deepEqual(out.map(t => t.title), ['Alpha section']);
  assert.equal(out[0].alias, null);
});

test('collectUnlinkedRefs: finds a point via an alias (title itself absent)', () => {
  // §8 integration: Wyrm is aliased "dragon"; a sibling says "the dragon sleeps"
  // (never the word "Wyrm"). It must still surface as an unlinked reference.
  const root = c.mkRoot();
  const wyrm = c.mkNode('Wyrm'); wyrm.id = 'wyrm'; wyrm.props = [{ key: 'aliases', val: 'dragon' }];
  const sib = c.mkNode('the dragon sleeps'); sib.id = 'sib';
  root.children.push(wyrm, sib);
  const out = c.collectUnlinkedRefs('wyrm', root);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'sib');
});

test('collectUnlinkedRefs: short title rescued by a long alias (per-name min-length)', () => {
  const root = c.mkRoot();
  const ab = c.mkNode('ab'); ab.id = 'ab'; ab.props = [{ key: 'aliases', val: 'dragon' }];  // 'ab' < 3, 'dragon' ≥ 3
  const sib = c.mkNode('here be a dragon'); sib.id = 'sib2';
  const sib2 = c.mkNode('the ab test only'); sib2.id = 'sib3';   // only the short name → excluded
  root.children.push(ab, sib, sib2);
  const out = c.collectUnlinkedRefs('ab', root);
  assert.deepEqual(host(out).map(o => o.id), ['sib2']);   // only the long-alias mention; the short-name-only mention is excluded
});

test('collectUnlinkedRefs: alias match still respects token-strip + already-linked exclusions', () => {
  const root = c.mkRoot();
  const wyrm = c.mkNode('Wyrm'); wyrm.id = 'wyrm2'; wyrm.props = [{ key: 'aliases', val: 'dragon' }];
  const linker = c.mkNode('[[#wyrm2|]] is here'); linker.id = 'lk';      // already links → excluded
  const tokenOnly = c.mkNode('see [[#x|dragon]] here'); tokenOnly.id = 'tk'; // alias only inside a token → excluded
  root.children.push(wyrm, linker, tokenOnly);
  const out = c.collectUnlinkedRefs('wyrm2', root);
  assert.equal(out.length, 0);
});

test('collectUnlinkedRefs: title-only (no alias prop) behavior unchanged', () => {
  const root = c.mkRoot();
  const dragon = c.mkNode('Dragon'); dragon.id = 'd0';
  const sib = c.mkNode('the dragon sleeps'); sib.id = 's0';
  root.children.push(dragon, sib);
  const out = c.collectUnlinkedRefs('d0', root);
  assert.deepEqual(host(out).map(o => o.id), ['s0']);
});

// ── ensureDocId / _docid ──────────────────────────────────────────────────────

test('ensureDocId: assigns a non-empty string when root.docId is null', () => {
  const root = c.mkRoot();
  assert.equal(root.docId, null, 'mkRoot sets docId to null');
  const id = c.ensureDocId(root);
  assert.equal(typeof id, 'string');
  assert.ok(id.length > 0);
  assert.equal(root.docId, id);
});

test('ensureDocId: idempotent — second call returns same id, does not reassign', () => {
  const root = c.mkRoot();
  const id1 = c.ensureDocId(root);
  const id2 = c.ensureDocId(root);
  assert.equal(id1, id2);
});

test('ensureDocId: leaves an existing docId untouched', () => {
  const root = c.mkRoot();
  root.docId = 'preset-id';
  assert.equal(c.ensureDocId(root), 'preset-id');
  assert.equal(root.docId, 'preset-id');
});

test('ensureDocId: injected gen function is used when docId is absent', () => {
  const root = c.mkRoot();
  let called = 0;
  const gen = () => { called++; return 'deterministic'; };
  const id = c.ensureDocId(root, gen);
  assert.equal(id, 'deterministic');
  assert.equal(called, 1);
  // second call — gen must NOT be called again
  c.ensureDocId(root, gen);
  assert.equal(called, 1, 'gen must not be called again if docId already set');
});

test('_docid: toOpml emits <_docid> when docId is set', () => {
  const root = c.mkRoot();
  root.docId = 'test-doc-abc';
  const xml = c.toOpml(root);
  assert.ok(xml.includes('<_docid>test-doc-abc</_docid>'), `<_docid> not found in: ${xml.slice(0, 200)}`);
});

test('_docid: toOpml omits <_docid> when docId is null', () => {
  const root = c.mkRoot(); // docId is null
  const xml = c.toOpml(root);
  assert.ok(!xml.includes('_docid'), 'null docId must not emit a <_docid> element');
});

test('_docid: ensureDocId + toOpml pipeline produces a stable id', () => {
  const root = c.mkRoot();
  c.ensureDocId(root, () => 'stable-id');
  const xml = c.toOpml(root);
  assert.ok(xml.includes('<_docid>stable-id</_docid>'));
  // second serialization must emit the same id
  assert.equal(c.toOpml(root).indexOf('<_docid>stable-id</_docid>'),
               xml.indexOf('<_docid>stable-id</_docid>'));
});

// ── workspace folder (Phase 1, step 3) ───────────────────────────────────────
// Pure cores only — the directory picker, IndexedDB persistence, and re-permission
// flow are browser-side and verified manually (see the PR's manual checklist).

test('workspaceAffordance: capability gate wins, then connected > pending > connect', () => {
  // gate first — !hasWorkspace → 'invite' (show informational row), even if connected/pending claim true
  assert.equal(c.workspaceAffordance({ hasWorkspace: false, connected: false, pending: false }), 'invite');
  assert.equal(c.workspaceAffordance({ hasWorkspace: false, connected: true, pending: true, backed: true }), 'invite');
  // connected + folder-backed beats a stale pending handle
  assert.equal(c.workspaceAffordance({ hasWorkspace: true, connected: true, pending: false, backed: true }), 'connected');
  assert.equal(c.workspaceAffordance({ hasWorkspace: true, connected: true, pending: true, backed: true }), 'connected');
  // a rehydrated-but-unpermissioned handle offers reconnect
  assert.equal(c.workspaceAffordance({ hasWorkspace: true, connected: false, pending: true }), 'reconnect');
  // nothing stored → offer to connect
  assert.equal(c.workspaceAffordance({ hasWorkspace: true, connected: false, pending: false }), 'connect');
});

test('workspaceAffordance: connected but not folder-backed → detached (Finding 8)', () => {
  // folder connected, current doc NOT in it (e.g. an external file was opened)
  assert.equal(c.workspaceAffordance({ hasWorkspace: true, connected: true, pending: false, backed: false }), 'connected-detached');
  assert.equal(c.workspaceAffordance({ hasWorkspace: true, connected: true, pending: true,  backed: false }), 'connected-detached');
  // backed flips it back to the plain connected state
  assert.equal(c.workspaceAffordance({ hasWorkspace: true, connected: true, pending: false, backed: true }), 'connected');
});

test('uniqueWorkspaceName: returns the base when free', () => {
  assert.equal(c.uniqueWorkspaceName([], 'outline.opml'), 'outline.opml');
  assert.equal(c.uniqueWorkspaceName(['other.opml'], 'outline.opml'), 'outline.opml');
});

test('uniqueWorkspaceName: inserts -2, -3, … before .opml on collision', () => {
  assert.equal(c.uniqueWorkspaceName(['outline.opml'], 'outline.opml'), 'outline-2.opml');
  assert.equal(c.uniqueWorkspaceName(['outline.opml', 'outline-2.opml'], 'outline.opml'), 'outline-3.opml');
  // a Set works as the existing-collection too
  assert.equal(c.uniqueWorkspaceName(new Set(['outline.opml']), 'outline.opml'), 'outline-2.opml');
});

test('uniqueWorkspaceName: case-insensitive collision detection', () => {
  assert.equal(c.uniqueWorkspaceName(['OUTLINE.OPML'], 'outline.opml'), 'outline-2.opml');
  assert.equal(c.uniqueWorkspaceName(['Notes.opml'], 'notes.opml'), 'notes-2.opml');
});

test('workspaceDocList: keeps only .opml, de-dupes, sorts case-insensitive', () => {
  assert.deepEqual(
    host(c.workspaceDocList(['b.opml', 'a.opml', 'readme.txt', 'C.OPML'])),
    ['a.opml', 'b.opml', 'C.OPML']
  );
  // de-dupe is case-insensitive, first spelling wins
  assert.deepEqual(host(c.workspaceDocList(['Doc.opml', 'doc.opml'])), ['Doc.opml']);
  // non-opml and empties filtered; empty input → []
  assert.deepEqual(host(c.workspaceDocList(['notes.md', 'x.opml'])), ['x.opml']);
  assert.deepEqual(host(c.workspaceDocList([])), []);
  assert.deepEqual(host(c.workspaceDocList(undefined)), []);
});

// ── document tabs: the pure list state machine (add / close / cycle) ──────────
test('tabAdd: appends a new file, dedupes an already-open one', () => {
  assert.deepEqual(host(c.tabAdd([], 'a.opml')), ['a.opml']);
  assert.deepEqual(host(c.tabAdd(['a.opml'], 'b.opml')), ['a.opml', 'b.opml']);
  assert.deepEqual(host(c.tabAdd(['a.opml', 'b.opml'], 'a.opml')), ['a.opml', 'b.opml']); // already open → no dup
  assert.deepEqual(host(c.tabAdd(['a.opml'], '')), ['a.opml']);     // empty name is a no-op
});
test('tabClose: closing a BACKGROUND tab removes it, no switch', () => {
  const r = c.tabClose(['a.opml', 'b.opml', 'c.opml'], 'b.opml', 'a.opml');
  assert.deepEqual(host(r.tabs), ['a.opml', 'c.opml']);
  assert.equal(r.nextActive, null);   // active tab untouched → no switch
});
test('tabClose: closing the ACTIVE tab switches to the neighbor at that slot', () => {
  // close the active middle tab → the tab that slides into its index becomes active
  const r = c.tabClose(['a.opml', 'b.opml', 'c.opml'], 'b.opml', 'b.opml');
  assert.deepEqual(host(r.tabs), ['a.opml', 'c.opml']);
  assert.equal(r.nextActive, 'c.opml');
  // close the active LAST tab → falls back to the new last tab
  const r2 = c.tabClose(['a.opml', 'b.opml'], 'b.opml', 'b.opml');
  assert.deepEqual(host(r2.tabs), ['a.opml']);
  assert.equal(r2.nextActive, 'a.opml');
});
test('tabClose: closing the only tab leaves an empty strip, no switch target', () => {
  const r = c.tabClose(['a.opml'], 'a.opml', 'a.opml');
  assert.deepEqual(host(r.tabs), []);
  assert.equal(r.nextActive, null);
});
test('tabClose: closing a file that is not open is a no-op', () => {
  const r = c.tabClose(['a.opml'], 'z.opml', 'a.opml');
  assert.deepEqual(host(r.tabs), ['a.opml']);
  assert.equal(r.nextActive, null);
});
test('tabCycle: next/prev wrap; <2 tabs → null', () => {
  const t = ['a.opml', 'b.opml', 'c.opml'];
  assert.equal(c.tabCycle(t, 'a.opml', 1), 'b.opml');
  assert.equal(c.tabCycle(t, 'c.opml', 1), 'a.opml');   // wrap forward
  assert.equal(c.tabCycle(t, 'a.opml', -1), 'c.opml');  // wrap back
  assert.equal(c.tabCycle(['only.opml'], 'only.opml', 1), null);  // nothing to cycle to
  assert.equal(c.tabCycle([], 'x', 1), null);
  assert.equal(c.tabCycle(t, 'gone.opml', 1), 'a.opml'); // active not in list → first
});

test('firstLineTitle: first point\'s display text, first line, markdown-stripped', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode('**Project** Plan\nsecond line ignored'));
  assert.equal(c.firstLineTitle(root), 'Project Plan');
  // empty / missing first point → empty string (the workspaceFileName fallback then kicks in)
  assert.equal(c.firstLineTitle(c.mkRoot()), '');
  assert.equal(c.firstLineTitle({ children: [] }), '');
  assert.equal(c.firstLineTitle({}), '');
});

test('workspaceFileName: keeps a real current name, normalizes to a single .opml suffix', () => {
  const r = c.mkRoot();
  assert.equal(c.workspaceFileName(r, 'notes.opml'), 'notes.opml');   // no double suffix
  assert.equal(c.workspaceFileName(r, 'notes'), 'notes.opml');        // adds the suffix
  assert.equal(c.workspaceFileName(r, 'NOTES.OPML'), 'NOTES.opml');   // case-insensitive strip + normalize
});

test('workspaceFileName: derives from the title when unsaved, falls back to outline', () => {
  const titled = c.mkRoot(); titled.children.push(c.mkNode('My Campaign'));
  assert.equal(c.workspaceFileName(titled, 'unsaved'), 'My Campaign.opml');
  assert.equal(c.workspaceFileName(c.mkRoot(), 'unsaved'), 'outline.opml'); // empty document
  assert.equal(c.workspaceFileName(c.mkRoot(), ''), 'outline.opml');        // falsy current name
});

test('workspaceFileName: sanitizes path separators and reserved characters', () => {
  const r = c.mkRoot();
  assert.equal(c.workspaceFileName(r, 'a/b\\c'), 'a b c.opml');  // separators → space (never a nested path)
  assert.equal(c.workspaceFileName(r, 'a:b*c?'), 'abc.opml');    // reserved chars dropped
  const odd = c.mkRoot(); odd.children.push(c.mkNode('///'));    // a title that sanitizes to nothing
  assert.equal(c.workspaceFileName(odd, 'unsaved'), 'outline.opml');
});

test('lastAutosaveSavedAt: returns 0 when localStorage has no autosave', () => {
  // The vm sandbox's localStorage stub returns null from getItem — same as a fresh session.
  assert.equal(c.lastAutosaveSavedAt(), 0);
});

test('lastAutosaveSavedAt: returns the savedAt timestamp when present', () => {
  const ls = c._context.localStorage;
  const orig = ls.getItem;
  ls.getItem = () => JSON.stringify({ savedAt: 1_700_000_000_000 });
  assert.equal(c.lastAutosaveSavedAt(), 1_700_000_000_000);
  ls.getItem = orig;
});

test('lastAutosaveSavedAt: returns 0 for a payload without savedAt (legacy autosave)', () => {
  const ls = c._context.localStorage;
  const orig = ls.getItem;
  ls.getItem = () => JSON.stringify({ root: {}, fileName: 'test.opml' });
  assert.equal(c.lastAutosaveSavedAt(), 0);
  ls.getItem = orig;
});

test('lastAutosaveSavedAt: returns 0 for malformed JSON', () => {
  const ls = c._context.localStorage;
  const orig = ls.getItem;
  ls.getItem = () => 'not json {{{';
  assert.equal(c.lastAutosaveSavedAt(), 0);
  ls.getItem = orig;
});

// ── cross-document link index (CF-1) ──────────────────────────────────────────
// Pure cores only — parseLinkToken (the cross-doc-aware token parser) and
// buildWorkspaceIndex (the index builder over already-parsed docs). The folder scan
// (scanWorkspace/refreshWorkspaceIndex) reads fromOpml, which needs a real DOMParser,
// so it is browser-side and verified via a throwaway mock-dir Playwright harness.

test('parseLinkToken: same-doc form (no docId)', () => {
  assert.deepEqual(host(c.parseLinkToken('[[#n1]]')), { docId: null, nodeId: 'n1', label: '' });
  assert.deepEqual(host(c.parseLinkToken('[[#n1|]]')), { docId: null, nodeId: 'n1', label: '' });
  assert.deepEqual(host(c.parseLinkToken('[[#n1|See it]]')), { docId: null, nodeId: 'n1', label: 'See it' });
});

test('parseLinkToken: cross-doc form (with docId)', () => {
  assert.deepEqual(host(c.parseLinkToken('[[docb#m2]]')), { docId: 'docb', nodeId: 'm2', label: '' });
  assert.deepEqual(host(c.parseLinkToken('[[docb#m2|Other doc]]')), { docId: 'docb', nodeId: 'm2', label: 'Other doc' });
  // label may contain spaces and punctuation (anything but ] and newline)
  assert.deepEqual(host(c.parseLinkToken('[[abc123#x9|a, b & c]]')), { docId: 'abc123', nodeId: 'x9', label: 'a, b & c' });
});

test('parseLinkToken: malformed / non-link tokens → null', () => {
  assert.equal(c.parseLinkToken('not a token'), null);
  assert.equal(c.parseLinkToken('[[dice:abc]]'), null);   // artifact token (colon, no #)
  assert.equal(c.parseLinkToken('[[#]]'), null);          // empty nodeId
  assert.equal(c.parseLinkToken('[[docb#]]'), null);      // empty nodeId with docId
  assert.equal(c.parseLinkToken('[[#n1]] trailing'), null); // anchored — not a bare token
  assert.equal(c.parseLinkToken(' [[#n1]] '), null);      // anchored — surrounding whitespace
  assert.equal(c.parseLinkToken(''), null);
  assert.equal(c.parseLinkToken(null), null);
  assert.equal(c.parseLinkToken(undefined), null);
});

// Helpers for the index builder: a doc wrapper + a point with a fixed id.
function cfDoc(docId, name) { const root = c.mkRoot(); root.docId = docId; return { docId, name, root }; }
function cfPt(id, text) { const n = c.mkNode(text); n.id = id; return n; }

test('buildWorkspaceIndex: titles, same-doc + cross-doc edges, reverse backlinks, candidates', () => {
  const da = cfDoc('da', 'a.opml');
  da.root.children.push(cfPt('n1', 'Source [[#n2]] [[db#m1|to Gamma]]'));  // bare same-doc + explicit cross-doc
  da.root.children.push(cfPt('n2', 'Beta'));                               // plain titled point
  da.root.children.push(cfPt('nx', ''));                                   // untitled — in titles, NOT a candidate
  const db = cfDoc('db', 'b.opml');
  db.root.children.push(cfPt('m1', 'Gamma [[da#n2]]'));                    // cross-doc back to da#n2

  const idx = c.buildWorkspaceIndex([da, db]);

  // titles: every point (Map of Maps), empty title preserved as '' so existence is knowable
  assert.equal(idx.titles.get('da').get('n2'), 'Beta');
  assert.equal(idx.titles.get('da').get('nx'), '');
  assert.equal(idx.titles.get('db').get('m1'), 'Gamma [[da#n2]]');

  // nameByDocId: so a resolver can switch to the backing file
  assert.equal(idx.nameByDocId.get('da'), 'a.opml');
  assert.equal(idx.nameByDocId.get('db'), 'b.opml');

  const out = host(idx.outgoing);
  // a bare [[#n2]] written in da resolves to da (dstDocId === ownDocId)
  assert.deepEqual(out.find(e => e.srcNodeId === 'n1' && e.dstNodeId === 'n2'),
    { srcDocId: 'da', srcNodeId: 'n1', dstDocId: 'da', dstNodeId: 'n2', label: '' });
  // an explicit cross-doc [[db#m1|to Gamma]] keeps its docId + label
  assert.deepEqual(out.find(e => e.dstDocId === 'db' && e.dstNodeId === 'm1'),
    { srcDocId: 'da', srcNodeId: 'n1', dstDocId: 'db', dstNodeId: 'm1', label: 'to Gamma' });
  // an explicit [[da#n2]] written in db also resolves to da#n2
  assert.deepEqual(out.find(e => e.srcDocId === 'db'),
    { srcDocId: 'db', srcNodeId: 'm1', dstDocId: 'da', dstNodeId: 'n2', label: '' });

  // reverse backlinks: keyed "dstDocId#dstNodeId". da#n2 is targeted by BOTH n1 (same-doc)
  // and m1 (cross-doc) → two sources, in walk order (da before db).
  assert.deepEqual(host(idx.backlinks.get('da#n2')),
    [{ srcDocId: 'da', srcNodeId: 'n1' }, { srcDocId: 'db', srcNodeId: 'm1' }]);
  assert.deepEqual(host(idx.backlinks.get('db#m1')),
    [{ srcDocId: 'da', srcNodeId: 'n1' }]);

  // candidates: titled points only (nx excluded), carrying the docName for the picker
  assert.equal(idx.candidates.length, 3);
  assert.deepEqual(host(idx.candidates).find(x => x.nodeId === 'n2'),
    { docId: 'da', nodeId: 'n2', title: 'Beta', docName: 'a.opml' });
  assert.ok(!host(idx.candidates).some(x => x.nodeId === 'nx'));
});

test('buildWorkspaceIndex: outgoing keeps every occurrence; backlinks dedupe per source node', () => {
  const d = cfDoc('d', 'd.opml');
  d.root.children.push(cfPt('a', 'x [[#t]] y [[#t]] z'));  // same node links target t twice
  const idx = c.buildWorkspaceIndex([d]);
  // every occurrence in outgoing
  assert.equal(host(idx.outgoing).filter(e => e.dstNodeId === 't').length, 2);
  // but the source appears once in the reverse map
  assert.deepEqual(host(idx.backlinks.get('d#t')), [{ srcDocId: 'd', srcNodeId: 'a' }]);
});

test('buildWorkspaceIndex: walks points only (not the doc-title root) and recurses children', () => {
  const d = cfDoc('d', 'd.opml');
  d.root.text = 'Document Title [[#ghost]]';   // root text is the doc title — never indexed
  const parent = cfPt('p', 'Parent');
  parent.children.push(cfPt('kid', 'Kid [[#p]]'));   // a nested child link
  d.root.children.push(parent);
  const idx = c.buildWorkspaceIndex([d]);
  // the root's own [[#ghost]] is NOT indexed (root is the container, not a point)
  assert.equal(host(idx.outgoing).some(e => e.dstNodeId === 'ghost'), false);
  assert.equal(idx.titles.get('d').has(d.root.id), false);
  // the nested child IS walked
  assert.deepEqual(host(idx.backlinks.get('d#p')), [{ srcDocId: 'd', srcNodeId: 'kid' }]);
  assert.equal(idx.titles.get('d').get('kid'), 'Kid [[#p]]');
});

test('buildWorkspaceIndex: skips docs missing docId or root; empty input → empty index', () => {
  const empty = c.buildWorkspaceIndex([]);
  assert.equal(empty.titles.size, 0);
  assert.equal(empty.outgoing.length, 0);
  assert.equal(empty.candidates.length, 0);
  assert.equal(empty.nameByDocId.size, 0);
  assert.deepEqual(host(c.buildWorkspaceIndex(undefined).outgoing), []);

  const good = cfDoc('g', 'g.opml'); good.root.children.push(cfPt('n', 'Node'));
  const bad1 = { docId: '', name: 'no-id.opml', root: c.mkRoot() };  // no stable docId
  const bad2 = { docId: 'x', name: 'no-root.opml', root: null };      // no tree
  const idx = c.buildWorkspaceIndex([bad1, good, bad2, null]);
  assert.deepEqual(host([...idx.nameByDocId.keys()]), ['g']);
  assert.equal(idx.candidates.length, 1);
  assert.equal(idx.titles.get('g').get('n'), 'Node');
});

// ── cross-document link token (CF-2) ──────────────────────────────────────────
// renderCrossLinkPill reads the module-level root.docId and workspaceIndex (CF-1) rather
// than taking them as params, so we set those let-bound globals in the vm realm before each
// call (the harness escape hatch — see load-cores' note on let-bound globals). The folder
// switch + zoom-to-node click path is browser-side (mock-index Playwright harness).

function cfDocFor(docId, name, points) {
  const r = c.mkRoot(); r.docId = docId;
  for (const [id, text] of points) { const n = c.mkNode(text); n.id = id; r.children.push(n); }
  return { docId, name, root: r };
}
// Set the vm realm's root.docId + workspaceIndex (built from docs, or null).
function cfSetGlobals(ownDocId, docs) {
  c._context.__ownDocId = ownDocId;
  c._context.__wi = docs ? c.buildWorkspaceIndex(docs) : null;
  vm.runInContext('root.docId = __ownDocId; workspaceIndex = __wi;', c._context);
}

test('renderCrossLinkPill: cross-doc target → .node-link-cross with data-doc/target + indexed title', () => {
  cfSetGlobals('da', [cfDocFor('db', 'b.opml', [['m1', 'Gamma']])]);
  const html = c.renderCrossLinkPill('db', 'm1', '');
  assert.match(html, /class="node-link node-link-cross"/);
  assert.match(html, /data-doc="db"/);
  assert.match(html, /data-target="m1"/);
  assert.match(html, />Gamma</);                        // empty label → live title from the index
  assert.match(html, /title="b\.opml"/);                // doc-name tooltip
  assert.match(html, /aria-label="[^"]*b\.opml[^"]*"/); // P3: doc name in the accessible name
  assert.match(c.renderCrossLinkPill('db', 'm1', 'see B'), />see B</); // explicit label wins
});

test('renderCrossLinkPill: unknown doc or node → broken pill, never silent (P4)', () => {
  cfSetGlobals('da', [cfDocFor('db', 'b.opml', [['m1', 'Gamma']])]);
  const unknownNode = c.renderCrossLinkPill('db', 'zzz', '');    // doc known, node missing
  assert.match(unknownNode, /node-link-broken/);
  assert.match(unknownNode, /data-doc="db"/);
  assert.doesNotMatch(unknownNode, /node-link-cross/);
  const unknownDoc = c.renderCrossLinkPill('dz', 'm1', 'label'); // doc absent from index
  assert.match(unknownDoc, /node-link-broken/);
  assert.match(unknownDoc, />label</);
  cfSetGlobals('da', null);                                      // no workspaceIndex at all
  assert.match(c.renderCrossLinkPill('db', 'm1', ''), /node-link-broken/);  // broken, not a throw
});

test('renderCrossLinkPill: a token in its own doc delegates to the same-doc pill (no data-doc)', () => {
  cfSetGlobals('da', [cfDocFor('db', 'b.opml', [['m1', 'Gamma']])]);
  const html = c.renderCrossLinkPill('da', 'whatever', 'Home');  // docId === root.docId
  assert.doesNotMatch(html, /data-doc=/);   // same-doc pills never carry data-doc
  assert.match(html, /class="node-link/);
  vm.runInContext('workspaceIndex = null; root.docId = null;', c._context);  // restore for later tests
});

test('CF-2 non-collision: a [[B#n]] cross-doc token is absent from same-doc collectLinks', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode('see [[B#n]] and [[#real]]'));  // one cross-doc, one same-doc
  const links = c.collectLinks(root);
  assert.ok(links.backlinks.real, 'same-doc [[#real]] is collected');
  assert.equal(links.backlinks.n, undefined, 'cross-doc [[B#n]] never enters the same-doc index');
  assert.equal(links.backlinks.B, undefined);
});

// ── cross-document [[ picker candidates (CF-3) ────────────────────────────────
// workspaceCandidates(query, index, currentDocId) is pure — the merge into the live
// picker (checkLinkTrigger/renderLinkMenu/lpApply) is browser-side (mock-index harness).
// Reuses cfDocFor from the CF-2 block above.
function cfIndex() {
  return c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'Alpha current']]),
    cfDocFor('db', 'b.opml', [['b1', 'Beta other'], ['b2', 'Gamma other']]),
    cfDocFor('dc', 'c.opml', [['c1', 'Beta cee']]),
  ]);
}

test('workspaceCandidates: filters by query (case-insensitive), excludes current doc, maps shape', () => {
  const idx = cfIndex();
  const res = host(c.workspaceCandidates('beta', idx, 'da'));   // da excluded; matches b1 + c1
  assert.deepEqual(res.map(r => r.id), ['b1', 'c1']);
  assert.deepEqual(res.find(r => r.id === 'b1'),
    { id: 'b1', docId: 'db', title: 'Beta other', docName: 'b.opml' });   // shape
  // case-insensitive
  assert.deepEqual(host(c.workspaceCandidates('GAMMA', idx, 'da')).map(r => r.id), ['b2']);
});

test('workspaceCandidates: empty query → all other-doc points; current doc always excluded', () => {
  const idx = cfIndex();
  const all = host(c.workspaceCandidates('', idx, 'da'));
  assert.deepEqual(all.map(r => r.id), ['b1', 'b2', 'c1']);   // a1 (da) excluded
  assert.ok(all.every(r => r.docId !== 'da'));
});

test('workspaceCandidates: a current-doc match is excluded (linkCandidates covers it live)', () => {
  const idx = cfIndex();
  // "alpha" only matches a1 in da (the current doc) → excluded → []
  assert.deepEqual(host(c.workspaceCandidates('alpha', idx, 'da')), []);
  // …but from a DIFFERENT current doc, da's a1 IS offered
  assert.deepEqual(host(c.workspaceCandidates('alpha', idx, 'db')).map(r => r.id), ['a1']);
});

test('workspaceCandidates: absent or empty index → []', () => {
  assert.deepEqual(host(c.workspaceCandidates('x', null, 'da')), []);
  assert.deepEqual(host(c.workspaceCandidates('x', undefined, 'da')), []);
  assert.deepEqual(host(c.workspaceCandidates('x', {}, 'da')), []);         // no .candidates
  assert.deepEqual(host(c.workspaceCandidates('x', c.buildWorkspaceIndex([]), 'da')), []);
});

// ── cross-document backlinks (CF-4) ───────────────────────────────────────────
// workspaceBacklinks(targetDocId, targetNodeId, index) is pure — the panel merge
// (showBlPanel/renderBlPanel) is browser-side (mock-index harness). Reuses cfDocFor.
function cf4Index() {
  return c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'Target'], ['a2', 'self-link [[#a1]]']]),  // a2 → a1 same-doc
    cfDocFor('db', 'b.opml', [['b1', 'From B [[da#a1]]']]),                       // cross-doc → da#a1
    cfDocFor('dc', 'c.opml', [['c1', 'From C [[da#a1]]']]),                       // cross-doc → da#a1
  ]);
}

test('workspaceBacklinks: other-doc sources for docId#nodeId, excludes same-doc, maps title/docName', () => {
  const res = host(c.workspaceBacklinks('da', 'a1', cf4Index()));
  // da#a2 (same-doc) is excluded — collectLinks owns it; db#b1 and dc#c1 remain, in walk order
  assert.deepEqual(res, [
    { docId: 'db', nodeId: 'b1', title: 'From B [[da#a1]]', docName: 'b.opml' },
    { docId: 'dc', nodeId: 'c1', title: 'From C [[da#a1]]', docName: 'c.opml' },
  ]);
});

test('workspaceBacklinks: a target linked ONLY from its own doc → [] (same-doc is collectLinks domain)', () => {
  const idx = c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'Target'], ['a2', 'links [[#a1]]']]),
  ]);
  assert.deepEqual(host(c.workspaceBacklinks('da', 'a1', idx)), []);
});

test('workspaceBacklinks: no inbound entry / absent / empty index → []', () => {
  const idx = cf4Index();
  assert.deepEqual(host(c.workspaceBacklinks('da', 'nope', idx)), []);   // no entry for da#nope
  assert.deepEqual(host(c.workspaceBacklinks('dz', 'x', idx)), []);
  assert.deepEqual(host(c.workspaceBacklinks('da', 'a1', null)), []);
  assert.deepEqual(host(c.workspaceBacklinks('da', 'a1', undefined)), []);
  assert.deepEqual(host(c.workspaceBacklinks('da', 'a1', {})), []);       // no .backlinks
  assert.deepEqual(host(c.workspaceBacklinks('da', 'a1', c.buildWorkspaceIndex([]))), []);
});

test('workspaceBacklinks: an unknown/untitled source falls back to (untitled)', () => {
  // a hand-built index whose backlinks reference a node absent from titles (defensive path)
  const mockIdx = {
    backlinks: new Map([['da#a1', [{ srcDocId: 'db', srcNodeId: 'ghost' }]]]),
    titles: new Map([['db', new Map()]]),
    nameByDocId: new Map([['db', 'b.opml']]),
  };
  assert.deepEqual(host(c.workspaceBacklinks('da', 'a1', mockIdx)),
    [{ docId: 'db', nodeId: 'ghost', title: '(untitled)', docName: 'b.opml' }]);
});

// ── workspace-wide search (WS-1) ──────────────────────────────────────────────
// searchWorkspace runs the SAME pure engine (parseSearchQuery/queryMatchesNode) over other
// docs' parsed trees, retained on the index as `roots`. No new query language. Reuses cfDocFor.

test('buildWorkspaceIndex: exposes roots (WS-1) — a Map of docId → the parsed tree', () => {
  const da = cfDocFor('da', 'a.opml', [['a1', 'x']]);
  const idx = c.buildWorkspaceIndex([da]);
  assert.equal(typeof idx.roots?.get, 'function');
  assert.equal(idx.roots.get('da'), da.root);   // the same tree reference is retained
  assert.equal(idx.roots.size, 1);
  // invalid docs are skipped (not in roots), same guard as nameByDocId
  const idx2 = c.buildWorkspaceIndex([da, { docId: '', root: c.mkRoot() }, { docId: 'x', root: null }, null]);
  assert.deepEqual(host([...idx2.roots.keys()]), ['da']);
});

test('searchWorkspace: a text term finds points in OTHER docs, excludes current, shapes result', () => {
  const idx = c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'Alpha apple'], ['a2', 'Beta banana']]),
    cfDocFor('db', 'b.opml', [['b1', 'Gamma apple'], ['b2', 'Delta cherry']]),
  ]);
  // current doc = da → excluded; 'apple' matches b1 (in db) only
  assert.deepEqual(host(c.searchWorkspace('apple', idx, 'da')),
    [{ docId: 'db', nodeId: 'b1', docName: 'b.opml', title: 'Gamma apple', snippet: 'Gamma apple' }]);
  // from a DIFFERENT current doc (dc), da's a1 is searched too
  assert.deepEqual(host(c.searchWorkspace('apple', idx, 'dc')).map(r => r.nodeId).sort(), ['a1', 'b1']);
});

test('searchWorkspace: reuses the in-doc operators (#tag, has:, key:value, phrase, -neg)', () => {
  const db = c.mkRoot(); db.docId = 'db';
  const p1 = c.mkNode('Gamma apple #fruit'); p1.id = 'b1';
  const p2 = c.mkNode('Delta pie'); p2.id = 'b2'; p2.props = [{ key: 'status', val: 'ripe' }];
  db.children.push(p1, p2);
  const idx = c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'current doc apple #fruit']]),   // current doc, excluded
    { docId: 'db', name: 'b.opml', root: db },
  ]);
  assert.deepEqual(host(c.searchWorkspace('#fruit', idx, 'da')).map(r => r.nodeId), ['b1']);
  assert.deepEqual(host(c.searchWorkspace('has:status', idx, 'da')).map(r => r.nodeId), ['b2']);
  assert.deepEqual(host(c.searchWorkspace('status:ripe', idx, 'da')).map(r => r.nodeId), ['b2']);
  assert.deepEqual(host(c.searchWorkspace('"Gamma apple"', idx, 'da')).map(r => r.nodeId), ['b1']);
  // negation: an apple that is NOT #fruit → none (b1 is the only apple and it IS #fruit)
  assert.deepEqual(host(c.searchWorkspace('apple -#fruit', idx, 'da')), []);
});

test('searchWorkspace: empty query, absent / no-roots index → []; cap bounds results', () => {
  const idx = c.buildWorkspaceIndex([cfDocFor('db', 'b.opml', [['b1', 'x'], ['b2', 'x']])]);
  assert.deepEqual(host(c.searchWorkspace('', idx, 'da')), []);
  assert.deepEqual(host(c.searchWorkspace('   ', idx, 'da')), []);
  assert.deepEqual(host(c.searchWorkspace('x', null, 'da')), []);
  assert.deepEqual(host(c.searchWorkspace('x', {}, 'da')), []);     // no .roots
  const big = c.buildWorkspaceIndex([cfDocFor('db', 'b.opml', [['b1', 'x'], ['b2', 'x'], ['b3', 'x']])]);
  assert.equal(host(c.searchWorkspace('x', big, 'da', 1)).length, 1);
  assert.equal(host(c.searchWorkspace('x', big, 'da', 2)).length, 2);
  assert.equal(host(c.searchWorkspace('x', big, 'da')).length, 3);   // default cap 50 → all 3
});

test('searchWorkspace: walks nested points (not just top level)', () => {
  const db = c.mkRoot(); db.docId = 'db';
  const parent = c.mkNode('parent'); parent.id = 'p';
  const kid = c.mkNode('nested needle'); kid.id = 'k'; parent.children.push(kid);
  db.children.push(parent);
  const idx = c.buildWorkspaceIndex([{ docId: 'db', name: 'b.opml', root: db }]);
  assert.deepEqual(host(c.searchWorkspace('needle', idx, 'da')).map(r => r.nodeId), ['k']);
});

// WS-1 amendment: is: operators are EXACT across docs (per-doc seqs/vars, not the current
// doc's). These are the cases the prior fallback got wrong.
test('searchWorkspace: is:done / is:todo are exact for another doc\'s custom @sequence', () => {
  const db = c.mkRoot(); db.docId = 'db';
  // db declares a custom sequence OPEN | SHIPPED (SHIPPED is the done-state)
  const decl = c.mkNode('[[seq:s1]] shipping'); decl.id = 'd1';
  decl.seq = [{ key: 's1', name: 'Ship', states: ['OPEN', 'SHIPPED'], doneFrom: 1 }];
  const shipped = c.mkNode('#SHIPPED the feature'); shipped.id = 'p1';
  const open = c.mkNode('#OPEN the bug'); open.id = 'p2';
  db.children.push(decl, shipped, open);
  const idx = c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'current doc']]),   // current doc: only the DEFAULT sequence
    { docId: 'db', name: 'b.opml', root: db },
  ]);
  // SHIPPED is a done-state ONLY in db's sequence — the current doc's seqs would miss it
  assert.deepEqual(host(c.searchWorkspace('is:done', idx, 'da')).map(r => r.nodeId), ['p1']);
  assert.deepEqual(host(c.searchWorkspace('is:todo', idx, 'da')).map(r => r.nodeId), ['p2']);
});

test('searchWorkspace: is:failing is exact for another doc\'s variable-referencing check', () => {
  const db = c.mkRoot(); db.docId = 'db';
  const vdecl = c.mkNode('[[var:v1]] budget'); vdecl.id = 'v';
  vdecl.vars = [{ key: 'v1', name: 'budget', expr: '100' }];          // db's doc-level var
  const fail = c.mkNode('over'); fail.id = 'f'; fail.props = [{ key: 'check', val: 'budget >= 500' }];  // 100≥500 → fail
  const pass = c.mkNode('under'); pass.id = 'p'; pass.props = [{ key: 'check', val: 'budget >= 50' }];   // 100≥50 → pass
  db.children.push(vdecl, fail, pass);
  const idx = c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'current doc']]),   // current doc has NO 'budget' var
    { docId: 'db', name: 'b.opml', root: db },
  ]);
  // with db's resolved vars (budget=100) only the ≥500 check fails; the ≥50 check passes.
  // (the prior fallback used the current doc's vars → budget unresolved → BOTH would error→fail.)
  assert.deepEqual(host(c.searchWorkspace('is:failing', idx, 'da')).map(r => r.nodeId), ['f']);
});

test('searchWorkspace: per-doc context (collectVars) is computed only when an is: term is present', () => {
  const idx = c.buildWorkspaceIndex([
    cfDocFor('da', 'a.opml', [['a1', 'current']]),
    cfDocFor('db', 'b.opml', [['b1', 'apple pie'], ['b2', 'banana']]),
  ]);
  // spy on collectVars in the vm realm (a function-decl global; searchWorkspace resolves it lazily)
  vm.runInContext('if (!globalThis.__origCV) { globalThis.__origCV = collectVars; collectVars = function (r) { globalThis.__cv = (globalThis.__cv || 0) + 1; return __origCV(r); }; }', c._context);
  c._context.__cv = 0; c.searchWorkspace('apple', idx, 'da');           // non-is: → needsCtx false
  const afterText = c._context.__cv;
  c._context.__cv = 0; c.searchWorkspace('is:failing', idx, 'da');      // is: → needsCtx true
  const afterIs = c._context.__cv;
  vm.runInContext('collectVars = __origCV; delete globalThis.__origCV;', c._context);   // restore BEFORE asserts
  assert.equal(afterText, 0, 'a non-is: search never computes per-doc vars');
  assert.ok(afterIs >= 1, 'an is: search computes per-doc vars (once per other doc)');
});

// ── searchSnippet (UXP-64) ───────────────────────────────────────────────────
// Context-aware snippet: windows around a text needle, names a field for structural
// terms, falls back to the title slice.
{
  const node = (text, note, props) => ({ id:'x', text: text||'', note: note||null, props: props||[], children:[] });
  const terms = (q) => c.parseSearchQuery(q);

  test('searchSnippet: text hit windows around the needle', () => {
    const n = node('The quick brown fox jumps over the lazy dog near a very long suffix here indeed');
    const s = c.searchSnippet(n, terms('fox'));
    assert.ok(s.toLowerCase().includes('fox'), 'snippet must contain the needle');
    assert.ok(s.length < 150, 'snippet should be compact');
  });

  test('searchSnippet: note hit also included in body', () => {
    const n = node('boring title', 'hidden needle in note text');
    const s = c.searchSnippet(n, terms('needle'));
    assert.ok(s.includes('needle'), 'note body is searched for text hits');
  });

  test('searchSnippet: #tag hit reads from raw node.text', () => {
    const n = node('point with #mytag inside');
    const s = c.searchSnippet(n, terms('#mytag'));
    assert.ok(s.includes('#mytag'), 'tag hit returns snippet from raw text');
  });

  test('searchSnippet: prop hit returns "key: val"', () => {
    const n = node('title', null, [{key:'cost', val:'42'}]);
    const s = c.searchSnippet(n, terms('cost:42'));
    assert.equal(s, 'cost: 42');
  });

  test('searchSnippet: has: hit returns "key: val"', () => {
    const n = node('title', null, [{key:'status', val:'active'}]);
    const s = c.searchSnippet(n, terms('has:status'));
    assert.equal(s, 'status: active');
  });

  test('searchSnippet: is: hit returns "is:<value>"', () => {
    const n = node('#TODO buy milk');
    const s = c.searchSnippet(n, terms('is:todo'));
    assert.equal(s, 'is:todo');
  });

  test('searchSnippet: due: hit returns "due: <val>"', () => {
    const n = node('meeting', null, [{key:'due', val:'2026-07-01'}]);
    const s = c.searchSnippet(n, terms('due:2026-07-01'));
    assert.equal(s, 'due: 2026-07-01');
  });

  test('searchSnippet: start: hit returns "start: <val>"', () => {
    const n = node('sprint', null, [{key:'start', val:'2026-06-01'}]);
    const s = c.searchSnippet(n, terms('start:2026-06-01'));
    assert.equal(s, 'start: 2026-06-01');
  });

  test('searchSnippet: no needle match falls back to title slice', () => {
    const n = node('a regular title with no special terms');
    const s = c.searchSnippet(n, terms('is:done'));  // is: → structural, no text needle, not matched
    // falls back to title slice (may be empty string for is: with no prop hit either)
    assert.ok(typeof s === 'string', 'always returns a string');
  });

  test('searchSnippet: long text adds ellipsis', () => {
    const long = 'a'.repeat(50) + 'needle' + 'b'.repeat(100);
    const n = node(long);
    const s = c.searchSnippet(n, terms('needle'));
    assert.ok(s.includes('needle'), 'needle present');
    assert.ok(s.endsWith('…'), 'trailing ellipsis when text continues after window');
  });

  test('searchSnippet: negated terms are not used for snippet field matching', () => {
    const n = node('title', null, [{key:'cost', val:'9'}]);
    // -cost:9 is negated, so even though the node has cost:9, the snippet skips it
    const s = c.searchSnippet(n, terms('-cost:9'));
    // should fall back to title slice, not "cost: 9"
    assert.notEqual(s, 'cost: 9');
  });
}

// ── doc-cache invalidation invariant (preventive) ─────────────────────────────
// Eight whole-tree caches are keyed on the single _varsVer generation; both
// writers (markDirty / resetDocCaches) bump it. This pins the invalidation
// WIRING — not content (content is pinned per-collector via the explicit-root
// path). It catches a future ninth cache wired to the wrong counter, or a
// writer that forgets to bump — both of which serve stale data silently.
//
// The cache path is only reachable via the NO-ARG form (uses the module `root`);
// an explicit rootNode bypasses the cache. _varsVer is a lexical `let` (unreadable
// from outside), so we observe invalidation via collector-object IDENTITY: same
// generation → the identical cached object; after a bump → a freshly built one.
// The bump is driven by resetDocCaches() (the DOM-free _varsVer++ — the exact bump
// markDirty does, minus the stubbed-DOM noise), reached via cores._context.
test('doc-cache: every _varsVer-keyed collector caches within a generation and rebuilds after a bump', () => {
  const bump = c._context.resetDocCaches;
  assert.equal(typeof bump, 'function', 'resetDocCaches must be reachable via _context to drive the _varsVer bump');
  // The canonical eight (mirrors the resetDocCaches registry / the `// doc-cache` markers).
  const collectors = [
    ['collectVars', c.collectVars],
    ['collectRules', c.collectRules],
    ['collectLinks', c.collectLinks],
    ['collectTags', c.collectTags],
    ['collectCallables', c.collectCallables],
    ['collectSequences', c.collectSequences],
    ['knownStates', c.knownStates],
    ['stateCmds', c.stateCmds],
  ];
  for (const [name, fn] of collectors) {
    assert.equal(typeof fn, 'function', `${name} must be harvested into the cores`);
    const a = fn();                                  // builds + caches at the current generation
    assert.strictEqual(fn(), a, `${name}: same generation must return the identical cached object`);
    bump();                                          // _varsVer++ — the shared invalidation point
    assert.notStrictEqual(fn(), a, `${name}: a generation bump must invalidate the cache (fresh object)`);
  }
});

// ── SHORTCUTS registry drift guard (UXP-36) ───────────────────────────────────
// These tests read the raw HTML source and assert that critical keyboard handler
// patterns are still present. They catch a whole class of silent regression:
// renaming a handler, restructuring onKeyDown, or removing a chord without
// updating docs. Not a spec for behavior — a wire-trip for drift.

const _htmlPath = process.env.POINTLINER_HTML
  || resolve(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const _src = readFileSync(_htmlPath, 'utf8');

test('UXP-36: GUIDE registry declaration is present', () => {
  assert.ok(_src.includes('const GUIDE = ['),
    'const GUIDE = [ not found in index.html — the unified registry was renamed or removed');
});

// ── GUIDE drift guard: every / and @ command id must have a GUIDE entry ────────
// The GUIDE array is a `const` (not a function declaration) so it lives in the
// source string only. We extract `id:` values from GUIDE entries via source
// inspection and verify that all BLOCK_CMDS + INSERT_CMDS ids are covered by
// some entry's `covers` array or its own `id` field.
test('GUIDE drift guard: all BLOCK_CMDS ids are covered in GUIDE', () => {
  const BLOCK_IDS = ['ul','ol','todo','h1','h2','h3','para','code','divider','quote',
    'base','template','due','check','alias','journal'];
  // Extract all id:' and covers:[' values from the GUIDE source block
  const guideBlock = _src.slice(_src.indexOf('const GUIDE = ['), _src.indexOf('(function buildShortcutsPanel()'));
  const coveredIds = new Set();
  // Match covers:['id1','id2',...] patterns
  for (const m of guideBlock.matchAll(/covers:\[([^\]]+)\]/g)) {
    for (const id of m[1].matchAll(/'([^']+)'/g)) coveredIds.add(id[1]);
  }
  const missing = BLOCK_IDS.filter(id => !coveredIds.has(id));
  assert.deepEqual(missing, [],
    `GUIDE missing covers for BLOCK_CMDS ids: ${missing.join(', ')}\n` +
    `(Add covers:[...] to the relevant GUIDE entry, or add a new entry)`);
});

test('GUIDE drift guard: all INSERT_CMDS ids are covered in GUIDE', () => {
  const INSERT_IDS = ['footnote','image','link','table','progress','dice','markov',
    'rolltable','grammar','deck','oracle','math','var','est','sequence','query','count'];
  const guideBlock = _src.slice(_src.indexOf('const GUIDE = ['), _src.indexOf('(function buildShortcutsPanel()'));
  const coveredIds = new Set();
  for (const m of guideBlock.matchAll(/covers:\[([^\]]+)\]/g)) {
    for (const id of m[1].matchAll(/'([^']+)'/g)) coveredIds.add(id[1]);
  }
  const missing = INSERT_IDS.filter(id => !coveredIds.has(id));
  assert.deepEqual(missing, [],
    `GUIDE missing covers for INSERT_CMDS ids: ${missing.join(', ')}\n` +
    `(Add covers:[...] to the relevant GUIDE entry, or add a new entry)`);
});

// ── User-guide drift guards ───────────────────────────────────────────────────
// The user guide (guide/**) restates a few CLOSED enumerated lists that also live
// in the live code (MODIFIERS, the is: search operators). Those lists are the kind
// the project's own P5 philosophy expects to GROW, so the prose copies drift the
// moment someone extends the code and forgets the docs. These guards read the
// canonical list out of index.html and assert the user guide enumerates exactly it
// — the same wire-trip pattern as the GUIDE/SHORTCUTS guards above, extended to the
// user docs (which previously had no drift guard at all). Read behavior, not prose.
const _guidePath = (name) => resolve(dirname(fileURLToPath(import.meta.url)), '..', 'guide', name);

test('user-guide drift: generating-text.md lists exactly the code MODIFIERS set', () => {
  // Canonical source: the MODIFIERS object keys in index.html.
  const objStart = _src.indexOf('const MODIFIERS = ');
  assert.ok(objStart !== -1, 'MODIFIERS object not found in index.html (renamed?)');
  const objBody = _src.slice(objStart, _src.indexOf('}', objStart));
  const codeMods = [...objBody.matchAll(/(?:^|[{,\s])([a-z]+)\s*:/g)].map(m => m[1]);
  assert.ok(codeMods.length >= 6, `expected the modifier set, parsed only: ${codeMods.join(',')}`);

  // The user-facing enumeration: the "The full set:" line in generating-text.md.
  const doc = readFileSync(_guidePath('generating-text.md'), 'utf8');
  const setLine = doc.split('\n').find(l => /full set:/i.test(l));
  assert.ok(setLine, '"The full set:" modifier line not found in generating-text.md');
  const docMods = [...setLine.matchAll(/`([a-z]+)`/g)].map(m => m[1]);

  assert.deepEqual([...docMods].sort(), [...codeMods].sort(),
    `generating-text.md modifier list has drifted from code MODIFIERS.\n` +
    `  code: ${codeMods.sort().join(', ')}\n  docs: ${docMods.sort().join(', ')}\n` +
    `Update the "The full set:" line in guide/generating-text.md to match.`);
});

test('user-guide drift: features.md lists every is: search operator from the code', () => {
  // Canonical source: the is:(...) alternation in parseSearchQuery. Allow `-` so hyphenated
  // operators (is:duplicate-title, #468) are captured, not truncated at the dash.
  const m = _src.match(/is:\(([a-z|-]+)\)/i);
  assert.ok(m, 'is:(...) operator regex not found in index.html (parseSearchQuery changed?)');
  const codeOps = m[1].split('|');
  assert.ok(codeOps.length >= 3, `parsed too few is: operators: ${codeOps.join(',')}`);

  // Every is:<op> must appear somewhere in the user-facing features.md.
  const doc = readFileSync(_guidePath('features.md'), 'utf8');
  const missing = codeOps.filter(op => !doc.includes(`is:${op}`));
  assert.deepEqual(missing, [],
    `features.md is missing these shipped is: search operators: ${missing.map(o => 'is:' + o).join(', ')}\n` +
    `Add them to the "Search and filter" line in guide/features.md.`);
});

test('user-guide drift: computing-numbers.md only names math functions that exist', () => {
  // The guide lists "the big ones" (a curated SUBSET of FN1/FN2/FN3), so we assert
  // the subset relation: every backticked name on the **Math:** line must exist in a
  // code FN table. Catches a typo or a renamed function; does not require the doc to
  // list every function (curation is intentional).
  const fnNames = new Set();
  for (const tbl of ['FN1', 'FN2', 'FN3']) {
    const start = _src.indexOf(`const ${tbl} = `);
    if (start === -1) continue;
    const body = _src.slice(start, _src.indexOf('});', start));
    for (const m of body.matchAll(/(?:^|[{,\s])([a-z][a-z0-9]*)\s*:/gi)) fnNames.add(m[1]);
  }
  assert.ok(fnNames.size > 20, `parsed too few FN names (${fnNames.size}); FN tables changed?`);

  const doc = readFileSync(_guidePath('computing-numbers.md'), 'utf8');
  const mathLine = doc.split('\n').find(l => /^\*\*Math:\*\*/.test(l));
  assert.ok(mathLine, '**Math:** function line not found in computing-numbers.md');
  // backticked bare identifiers on that line (skip ones with parens/args shown)
  const named = [...mathLine.matchAll(/`([a-z][a-z0-9]*)`/gi)].map(m => m[1]);
  const ghost = named.filter(n => !fnNames.has(n));
  assert.deepEqual(ghost, [],
    `computing-numbers.md names math functions not present in any FN table: ${ghost.join(', ')}\n` +
    `(a typo or a renamed/removed function — fix the **Math:** line in guide/computing-numbers.md)`);
});

// ── User-guide ANCHOR integrity guard ─────────────────────────────────────────
// The repo has no markdown link-checker, so a broken in-page anchor ships silently
// to GitHub Pages. This resolves EVERY `](...#fragment)` link across the user guide
// against the real heading slugs of its target file, using GitHub's slug algorithm.
// Generic (not tied to one list): it guards all current anchors AND every future
// one, and it specifically protects the de-numbered deep-guide headings (UXP work)
// from a rename silently orphaning the 16 inbound links.
test('user-guide anchor integrity: every #anchor link resolves to a real heading', () => {
  const guideDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'guide');
  const files = ['README.md', 'features.md', 'generating-text.md', 'computing-numbers.md',
    'cookbook.md', 'solo-rpg/README.md', 'solo-rpg/lonelog/lonelog.md']
    .map(f => resolve(guideDir, f));
  files.push(resolve(guideDir, '..', 'README.md')); // root README too

  // GitHub heading -> slug: lowercase, strip non-alphanumeric (except space/hyphen),
  // spaces -> hyphens. (No de-duplication suffixes needed; the guide has unique slugs.)
  const slugify = (h) => h.replace(/^#+\s+/, '').toLowerCase()
    .replace(/[^a-z0-9 -]/g, '').replace(/ +/g, '-');
  const slugsOf = (path) => new Set(
    readFileSync(path, 'utf8').split('\n')
      .filter(l => /^#{1,6}\s/.test(l)).map(slugify));

  const slugCache = new Map();
  const getSlugs = (path) => {
    if (!slugCache.has(path)) slugCache.set(path, slugsOf(path));
    return slugCache.get(path);
  };

  const broken = [];
  for (const srcPath of files) {
    const text = readFileSync(srcPath, 'utf8');
    const srcDir = dirname(srcPath);
    for (const m of text.matchAll(/\]\(([^)\s]*?)#([a-z0-9-]+)\)/gi)) {
      const [, rel, frag] = m;
      const targetPath = rel ? resolve(srcDir, rel) : srcPath; // empty rel = same file
      let slugs;
      try { slugs = getSlugs(targetPath); }
      catch { broken.push(`${srcPath}: target file missing for #${frag} (${rel})`); continue; }
      if (!slugs.has(frag)) broken.push(`${srcPath}: #${frag} -> ${rel || '(self)'} (no such heading)`);
    }
  }
  assert.deepEqual(broken, [],
    `Broken anchor links in the user guide (heading renamed or anchor typo):\n  ${broken.join('\n  ')}`);
});

// ── Cross-surface guard: in-app GUIDE vs the web guide markdown ────────────────
// The two machine->human surfaces only truly overlap on the generators + compute
// pill families. They had ONE demonstrated contradiction — the dice reroll `rK`,
// described as "reroll any 1" (exact-match) in the GUIDE but "reroll any die ≤ 1"
// (threshold) in markdown. The code is threshold (≤ K). This guard pins the
// reconciliation: neither surface may describe rK as exact-match, and the core
// dice tokens markdown teaches must also appear in the GUIDE (no silent divergence
// on the shared surface). Robust by design — it pins the specific drift, not the
// independently-curated structure of either doc.
test('cross-surface: GUIDE and markdown agree on dice reroll semantics (threshold, not exact)', () => {
  const guideDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'guide');
  const genMd = readFileSync(resolve(guideDir, 'generating-text.md'), 'utf8');
  // The GUIDE dice reroll desc (in the GUIDE source string) must not claim exact-match.
  const reroll = _src.match(/\{[0-9]*d[0-9]+r1\}',\s*desc:'([^']*)'/);
  assert.ok(reroll, 'GUIDE dice reroll entry not found (syntax changed?)');
  assert.doesNotMatch(reroll[1], /any 1 once$/,
    `GUIDE reroll desc "${reroll[1]}" describes rK as exact-match; the code is threshold (≤ K). ` +
    `Say "1 or lower" / "≤ 1", matching generating-text.md.`);
  // Markdown must describe it as a threshold too (it already says "≤ 1").
  assert.match(genMd, /reroll any die ≤ 1 once|reroll any die 1 or lower/,
    'generating-text.md no longer describes rK as a threshold; keep it in sync with the GUIDE + code.');

  // Core dice tokens taught in markdown must also be present in the GUIDE source
  // (the one place both surfaces deeply cover — they may not silently diverge).
  for (const tok of ['2d6', '4d6kh3', '4dF']) {
    assert.ok(_src.includes(tok),
      `dice token ${tok} is taught in generating-text.md but absent from the in-app GUIDE`);
  }
});

// ── Shipped-syntax-token guard ────────────────────────────────────────────────
// classifyBraceBody is the single, enumerable place every PROMOTABLE `{…}` syntax
// form is detected (a user types it, it becomes a pill). Each branch carries a
// comment with the user-facing example token. This guard derives the set of
// distinguishing syntax SIGNATURES from those comments and asserts each appears in
// at least one CANONICAL documentation surface (the in-app GUIDE array OR the dev
// engine reference guidance/features.md) — so a new authoring syntax can never
// ship completely undocumented the way `{name := expr}` once did. It checks
// "documented somewhere canonical," NOT "documented everywhere" (advanced syntax
// in the user guide is a content call), and it derives from code, no hardcoded list.
test('shipped-syntax guard: every promotable {…} form is documented in a canonical surface', () => {
  // Canonical surface = the in-app GUIDE array. It is the right anchor because it has
  // NO reason to mention reverted/deferred syntax (unlike prose docs, where a token can
  // appear only inside a "do not use" warning — a false-positive a substring check on
  // the dev docs would wrongly accept). Presence in the GUIDE means genuinely documented
  // for users.
  const guideArr = (() => {
    const i = _src.indexOf('const GUIDE = [');
    return _src.slice(i, _src.indexOf('(function buildShortcutsPanel', i));
  })();
  const documented = (sig) => guideArr.includes(sig);

  // Extract the example tokens from classifyBraceBody's branch comments.
  const cbStart = _src.indexOf('function classifyBraceBody');
  assert.ok(cbStart !== -1, 'classifyBraceBody not found — the promotion path was renamed');
  const cbBlock = _src.slice(cbStart, _src.indexOf('\n}', cbStart + 2000));
  const exampleToks = [...new Set([...cbBlock.matchAll(/\/\/\s*(\{[^}]+\})/g)].map(m => m[1]))];
  assert.ok(exampleToks.length >= 8,
    `parsed only ${exampleToks.length} promotable forms from classifyBraceBody; comments changed?`);

  // Map each form to its distinguishing SIGNATURE (the operator/keyword a doc would
  // show). Generic forms (a bare dice/alt/rule) are covered by other guards and are
  // intentionally skipped here; this guard targets the syntax-y operators that are
  // the real "did anyone document this?" risk.
  const SIGNATURES = [
    [':=',      ':='],       // typed declaration {name := expr}
    ['x:',      'x:'],       // repeat {3x: template}  — the "Nx:" operator
    [' to ',    ' to '],     // estimate {5 to 10}
  ];
  const missing = [];
  for (const [needleInForm, sig] of SIGNATURES) {
    // only assert a signature if some promotable form actually uses it (so the guard
    // self-disables if a form is ever removed from the engine)
    if (exampleToks.some(t => t.includes(needleInForm)) && !documented(sig)) {
      missing.push(sig);
    }
  }
  assert.deepEqual(missing, [],
    `These shipped, user-typable syntax operators are NOT documented in the in-app GUIDE array: ` +
    `${missing.join(', ')}\n` +
    `A promotable {…} form must have a GUIDE entry (the user-facing concept guide). Add one. ` +
    `(This is the guard that would have caught the {name := expr} gap.)`);
});

test('GUIDE drift guard: openGuide function is wired to the Concept guide button', () => {
  assert.ok(_src.includes('openGuide()'), 'openGuide() call missing — Concept guide button is not wired');
  assert.ok(_src.includes('function openGuide('), 'openGuide function declaration missing');
  assert.ok(_src.includes('sc-guide-open'), 'sc-guide-open button id missing in panel HTML');
  assert.ok(_src.includes("'Concept guide'") || _src.includes('"Concept guide"') || _src.includes('Concept guide ›'), 'Concept guide footer link text missing');
});

test('GUIDE: the guide nav is a two-level list (category header per group, each topic its own item)', () => {
  // The left list groups entries under category headers and renders every entry
  // as its own clickable item — not a flat category-only nav. A regression to the
  // category-only model (one button per category, all entries in the pane) would
  // drop these markers.
  assert.ok(_src.includes('guide-nav-group'), 'category header class missing — nav is not grouped');
  assert.ok(_src.includes('data-id="'), 'per-topic data-id missing — entries are not individual items');
  // every cat entry must carry a title (it is the left-list label)
  const guideBlock = _src.slice(_src.indexOf('const GUIDE = ['), _src.indexOf('(function buildShortcutsPanel()'));
  const catEntries = [...guideBlock.matchAll(/cat:'[^']+'/g)].length;
  const titles = [...guideBlock.matchAll(/title:'[^']*'|title:"[^"]*"/g)].length;
  assert.ok(titles >= catEntries,
    `every guide (cat) entry needs a title for its left-list label: ${catEntries} cat entries, ${titles} titles`);
});

test('UXP-36: Ctrl+S save shortcut handler is present', () => {
  // The global document keydown handler is the sole owner of Ctrl+S (the editor-level
  // duplicate was removed to cure a double-fire — see the spurious-save-error fix).
  assert.ok(_src.includes("ctrl && e.key==='s'") || _src.includes("ctrl && e.key === 's'"),
    "Ctrl+S handler pattern not found in index.html");
});

test('UXP-36: collapseToLevel shortcut handler is present', () => {
  assert.ok(_src.includes('collapseToLevel'),
    'collapseToLevel not found in index.html');
});

test('UXP-36: toggleVarPanel shortcut handler is present', () => {
  assert.ok(_src.includes('toggleVarPanel'),
    'toggleVarPanel not found in index.html');
});

test('journal mode: Ctrl/Cmd+Shift+J handler is wired and documented (the only front door)', () => {
  // The handler: a Ctrl/Cmd+Shift+J chord calls cycleJournalMode.
  assert.ok(/ctrl && e\.shiftKey && \(e\.key==='J' \|\| e\.key==='j'\)/.test(_src),
    'Ctrl/Cmd+Shift+J handler not found in index.html');
  assert.ok(_src.includes('function cycleJournalMode'),
    'cycleJournalMode function not found');
  assert.ok(_src.includes('cycleJournalMode()'),
    'cycleJournalMode is not called from a handler');
  // Discoverable: an essential ? -panel row advertises the shortcut (no hidden hotkeys).
  assert.ok(_src.includes("id:'file-jmode'"),
    'the journal-mode shortcut is not listed in the essential shortcuts registry');
});

test('document tabs: strip is gated on workspaceDir, keyboard-cycle wired + documented', () => {
  // The strip hides without a connected workspace (the cheap-version gate).
  assert.ok(/if \(!workspaceDir \|\| !openTabs\.length\)/.test(_src),
    'renderDocTabs is not gated on workspaceDir + a non-empty tab list');
  // Next/prev-tab chords call cycleDocTab, alongside the existing global chords.
  assert.ok(/ctrl && e\.shiftKey && e\.key===']'/.test(_src) && /ctrl && e\.shiftKey && e\.key==='\['/.test(_src),
    'Ctrl/Cmd+Shift+] / [ tab-cycle handlers not found');
  assert.ok(_src.includes('function cycleDocTab'), 'cycleDocTab not found');
  // ARIA tablist semantics (P3) and keyboard activation alongside pointer (caret invariant).
  assert.ok(_src.includes('role="tablist"') && _src.includes("setAttribute('role', 'tab')"),
    'doc-tabs is not an ARIA tablist with role=tab tabs');
  assert.ok(/tab\.addEventListener\('keydown'/.test(_src),
    'tabs lack a keyboard handler (added alongside the mousedown path)');
  // Discoverable: an essential ?-panel row advertises the shortcut.
  assert.ok(_src.includes("id:'file-tabs'"),
    'the tab-cycle shortcut is not listed in the essential shortcuts registry');
  // The current folder-backed doc is registered as a tab from the single chokepoint
  // (renderWorkspaceAffordance), so every connect/switch/reconnect path surfaces the strip.
  assert.ok(_src.includes('openTabs = tabAdd(openTabs, fileName)') && _src.includes('persistOpenTabs'),
    'the current doc is not registered as a tab from renderWorkspaceAffordance');
  // Shows the strip with an EXPLICIT display (the CSS default is display:none, so '' re-hides
  // it — the build-but-stay-hidden bug). Must set 'flex', not ''.
  assert.ok(/strip\.style\.display = 'flex'/.test(_src),
    'renderDocTabs must set display:flex explicitly (not "", which the CSS default re-hides)');
});

test('UXP-36: pill-pencil keyboard activation (Enter/Space) is present', () => {
  assert.ok(_src.includes('.dice-edit,.mk-edit,.math-edit,.gr-edit,.var-edit'),
    'pill-pencil keyboard activation selector not found in index.html');
});

// ── UXP-19: outline tree + base grid ARIA (the dedicated pass) ────────────────

test('UXP-19: the outline is a flat ARIA tree (role + level/position attributes)', () => {
  assert.ok(_src.includes(`vlist.setAttribute('role', 'tree')`), 'role=tree on #vlist');
  assert.ok(_src.includes(`'aria-multiselectable'`), 'tree is multiselectable');
  assert.ok(_src.includes(`div.setAttribute('role', 'treeitem')`), 'rows are treeitems');
  assert.ok(_src.includes(`'aria-level'`), 'aria-level set');
  assert.ok(_src.includes(`'aria-posinset'`), 'aria-posinset set');
  assert.ok(_src.includes(`'aria-setsize'`), 'aria-setsize set');
});

test('UXP-19: the interactive base table is role="grid"; computed cells aria-readonly', () => {
  assert.ok(_src.includes(`role="grid" aria-label="Base"`), 'role=grid on the base table');
  assert.ok(_src.includes(`tabindex="0" aria-readonly="true"`), 'computed cells aria-readonly');
});

// #488: a full render() must not throw scroll to the top. It captures scrollY at entry and
// restores it after the vlist rebuild, clamped to the new document height, and SKIPS the restore
// when the render intends to move scroll (a zoom changed focusedId, or an empty-doc focusNode runs).
test('#488: render() captures and restores scroll (clamped), skipping intentional scroll moves', () => {
  // whole-source checks (render() is a large function with nested closures; the tokens below
  // are unique to the #488 scroll-restore block, so a src-level match is precise enough)
  assert.ok(/const _preScrollY = window\.scrollY/.test(_src), 'captures scrollY at entry');
  assert.ok(/_focusChanged = focusedId !== _lastRenderFocusedId/.test(_src), 'detects a zoom (focusedId change) to skip restore');
  assert.ok(/if \(!_focusChanged && !firstChildId\)/.test(_src), 'skips restore on a zoom or an empty-doc focusNode');
  assert.ok(/Math\.min\(_preScrollY, maxScroll\)/.test(_src), 'clamps the restored offset to the new (possibly shorter) document height');
  assert.ok(/window\.scrollTo\(0, target\)/.test(_src) && /renderWindow\(false\); \/\/ re-window/.test(_src), 'restores scroll and re-windows for the restored offset (no flash)');
});

test('UXP-19: pills carry tabindex=-1 (programmatic/AT focus reach)', () => {
  const dice = c.renderDicePill('k', { key: 'k', expr: '2d6', total: 7, parts: [] });
  assert.ok(dice.includes('tabindex="-1"'), dice);
  const mk = c.renderMarkovPill('m', { key: 'm', def: 'a -> b', start: 'a', steps: 1, path: ['a', 'b'] });
  assert.ok(mk.includes('tabindex="-1"'), mk);
  const gr = c.renderGrammarPill('g', { key: 'g', def: 'origin: x', origin: 'origin', result: 'x!' });
  assert.ok(gr.includes('tabindex="-1"'), gr);
  const sq = c.renderSeqPill('q', { key: 'q', name: 'Flow', states: ['A', 'B', 'C'], doneFrom: 2 });
  assert.ok(sq.includes('tabindex="-1"'), sq);
});

test('UXP-19: pill-body keyboard activation (Enter/Space dispatch) is present', () => {
  assert.ok(_src.includes('.dice-roll,.mk-roll,.gr-roll,.math-roll,.var-pill,.seq-pill'),
    'pill-body keyboard activation selector not found in index.html');
  // UXP-176: the query pill joins the pill-body activation selector so a focused query pill opens
  // editQuery on Enter/Space, like every peer pill (it was the one omitted).
  assert.ok(_src.includes(',.est-pill,.query-pill'),
    'query-pill missing from the pill-body keyboard activation selector (UXP-176)');
});

test('UXP-177: the TODO state/priority badge is keyboard-operable (a11y attrs + Enter/Space twin)', () => {
  // the interactive inline badge carries the pill a11y kit
  assert.ok(_src.includes('class="todo-state todo-state-${kw}${doneCls}${heldCls}" data-todo-state="${keyword}" role="button" tabindex="-1"'),
    'inline todo-state badge missing role/tabindex (UXP-177)');
  assert.ok(_src.includes('class="todo-prio todo-prio-${priority.toLowerCase()}" role="button" tabindex="-1"'),
    'todo-prio chip missing role/tabindex (UXP-177)');
  // the Enter/Space keydown twin dispatches the badge's mousedown (→ showTodoPicker)
  assert.ok(_src.includes("closest?.('.todo-state,.todo-prio')"),
    'todo-badge keyboard activation branch missing (UXP-177)');
});

// ── UXP-25: ol ordinals from text not type (markdown-lazy numbering) ──────────

test('UXP-25: deriveTypeFromText detects ol from N. prefix', () => {
  assert.equal(c.deriveTypeFromText('1. foo'),   'ol');
  assert.equal(c.deriveTypeFromText('2. bar'),   'ol');
  assert.equal(c.deriveTypeFromText('10. baz'),  'ol');
  assert.equal(c.deriveTypeFromText('1. '),       'ol');   // empty body (Enter-continuation stub)
  assert.equal(c.deriveTypeFromText('- item'),    null);   // ul is NOT ol
  assert.equal(c.deriveTypeFromText('1 nospace'), null);   // missing dot — not ol
  assert.equal(c.deriveTypeFromText('1.nospace'), null);   // missing space after dot — not ol
  assert.equal(c.deriveTypeFromText('# heading'), 'h1');   // existing derivations intact
});

test('UXP-25: continuationPrefix returns 1. for any ol item', () => {
  assert.equal(c.continuationPrefix('1. first'),  '1. ');
  assert.equal(c.continuationPrefix('5. fifth'),  '1. ');  // literal value ignored
  assert.equal(c.continuationPrefix('10. tenth'), '1. ');
  assert.equal(c.continuationPrefix('- bullet'),  '');     // ul stays empty (no continuation)
  assert.equal(c.continuationPrefix('> quote'),   '> ');   // quote path unaffected
});

test('UXP-25: textForDisplay strips ol N. prefix', () => {
  const n1 = c.mkNode('1. buy milk');   n1.type = 'ol';
  const n5 = c.mkNode('5. fifth item'); n5.type = 'ol';
  assert.equal(c.textForDisplay(n1), 'buy milk');
  assert.equal(c.textForDisplay(n5), 'fifth item');
  // h1 prefix stripping intact
  const h = c.mkNode('# Title'); h.type = 'h1';
  assert.equal(c.textForDisplay(h), 'Title');
});

test('UXP-25: the computed ol gutter ordinal is hidden while editing (no double number)', () => {
  // Edit reveals the raw "N. " marker in the text (markdown-first); the position-
  // computed .ol-num gutter must hide then, or the point shows two numbers at once.
  assert.match(_src, /\.node-row:has\(>?\.node-content\[data-editing\]\)>\.ol-num\{visibility:hidden\}/,
    'ol-num hide-while-editing rule missing');
});

test('UXP-25: migrateNodePrefixes adds 1. to legacy type-only ol nodes', () => {
  const root = c.mkRoot();
  const legacy = c.mkNode('buy milk'); legacy.type = 'ol';
  const already = c.mkNode('1. already has prefix'); already.type = 'ol';
  const two = c.mkNode('2. different number'); two.type = 'ol';
  root.children.push(legacy, already, two);
  c.migrateNodePrefixes(root);
  assert.equal(legacy.text, '1. buy milk');   // prefix added
  assert.equal(already.text, '1. already has prefix'); // unchanged
  assert.equal(two.text, '2. different number');       // unchanged (already has N.)
});

// ─── search query language (operators over the existing vocabulary) ──────────

test('search query: parseSearchQuery — words, phrases, tags, is:, negation', () => {
  assert.deepEqual(host(c.parseSearchQuery('alpha Beta')), [
    { neg: false, kind: 'text', value: 'alpha' },
    { neg: false, kind: 'text', value: 'beta' }]);
  assert.deepEqual(host(c.parseSearchQuery('"two words"')),
    [{ neg: false, kind: 'text', value: 'two words' }]);
  assert.deepEqual(host(c.parseSearchQuery('#Work')),
    [{ neg: false, kind: 'tag', value: 'work' }]);
  assert.deepEqual(host(c.parseSearchQuery('is:DONE')),
    [{ neg: false, kind: 'is', value: 'done' }]);
  assert.deepEqual(host(c.parseSearchQuery('-#work -is:done -"a b" -word')), [
    { neg: true, kind: 'tag',  value: 'work' },
    { neg: true, kind: 'is',   value: 'done' },
    { neg: true, kind: 'text', value: 'a b' },
    { neg: true, kind: 'text', value: 'word' }]);
  assert.deepEqual(host(c.parseSearchQuery('')), []);
  assert.deepEqual(host(c.parseSearchQuery('""')), []);   // empty phrase contributes nothing
});

test('search query: malformed tokens stay literal text (the escape hatch)', () => {
  assert.deepEqual(host(c.parseSearchQuery('is:tomorrow')),
    [{ neg: false, kind: 'text', value: 'is:tomorrow' }]);  // unknown is: value
  assert.deepEqual(host(c.parseSearchQuery('-')),
    [{ neg: false, kind: 'text', value: '-' }]);            // lone dash is literal
  assert.deepEqual(host(c.parseSearchQuery('#')),
    [{ neg: false, kind: 'text', value: '#' }]);
  assert.deepEqual(host(c.parseSearchQuery('#foo-bar')),
    [{ neg: false, kind: 'tag', value: 'foo-bar' }]);       // hyphens are valid tag chars (nested-tag support)
});

test('search query: tag terms are word-anchored and token-blind', () => {
  const q = s => c.parseSearchQuery(s);
  const n = c.mkNode('ship the #work item');
  assert.equal(c.queryMatchesNode(q('#work'), n), true);
  assert.equal(c.queryMatchesNode(q('#wor'), n), false);     // no prefix match
  assert.equal(c.queryMatchesNode(q('#WORK'), n), true);     // case-insensitive
  const n2 = c.mkNode('about #workshops');
  assert.equal(c.queryMatchesNode(q('#work'), n2), false);   // #work ≠ #workshops
  const n3 = c.mkNode('see [[#abc123|label]]');
  assert.equal(c.queryMatchesNode(q('#abc123'), n3), false); // link targets aren't tags
  const n4 = c.mkNode('#TODO ship it');
  assert.equal(c.queryMatchesNode(q('#todo'), n4), true);    // state keywords are hashtag-shaped
});

test('search query: is:todo / is:done / is:note', () => {
  const q = s => c.parseSearchQuery(s);
  const open     = c.mkNode('#TODO write tests');
  const done     = c.mkNode('#DONE shipped');
  const task     = c.mkNode('- [ ] buy milk');
  const taskDone = c.mkNode('- [x] bought');
  const plain    = c.mkNode('plain prose');
  const noted    = c.mkNode('point'); noted.note = 'context';
  assert.equal(c.queryMatchesNode(q('is:todo'), open), true);
  assert.equal(c.queryMatchesNode(q('is:todo'), task), true);
  assert.equal(c.queryMatchesNode(q('is:todo'), done), false);
  assert.equal(c.queryMatchesNode(q('is:todo'), plain), false);
  assert.equal(c.queryMatchesNode(q('is:done'), done), true);
  assert.equal(c.queryMatchesNode(q('is:done'), taskDone), true);
  assert.equal(c.queryMatchesNode(q('is:done'), open), false);
  assert.equal(c.queryMatchesNode(q('is:done'), plain), false);
  assert.equal(c.queryMatchesNode(q('is:note'), noted), true);
  assert.equal(c.queryMatchesNode(q('is:note'), plain), false);
});

test('search query: AND of all terms; negation; notes searched by text terms', () => {
  const q = s => c.parseSearchQuery(s);
  const n = c.mkNode('#TODO ship the #work report');
  assert.equal(c.queryMatchesNode(q('report #work'), n), true);
  assert.equal(c.queryMatchesNode(q('report #home'), n), false);
  assert.equal(c.queryMatchesNode(q('report -#work'), n), false);
  assert.equal(c.queryMatchesNode(q('report -#home'), n), true);
  assert.equal(c.queryMatchesNode(q('report -is:done'), n), true);
  assert.equal(c.queryMatchesNode(q('report is:todo'), n), true);
  const noted = c.mkNode('title'); noted.note = 'hidden detail';
  assert.equal(c.queryMatchesNode(q('hidden'), noted), true);
  assert.equal(c.queryMatchesNode(q('"hidden detail"'), noted), true);
  assert.equal(c.queryMatchesNode(q('"detail hidden"'), noted), false);
  assert.equal(c.queryMatchesNode([], n), false);  // empty query matches nothing
});

test('search query: searchHighlightNeedles — positive text + tags only', () => {
  const terms = c.parseSearchQuery('alpha #work -beta is:done "a b"');
  assert.deepEqual(host(c.searchHighlightNeedles(terms)), ['alpha', '#work', 'a b']);
  assert.deepEqual(host(c.searchHighlightNeedles([])), []);
});

test('search query: front doors + wiring are present (src pins)', () => {
  // P2: the focus-shown legend under the search box, described to AT
  assert.ok(_src.includes('id="search-hint"'), 'search hint legend missing');
  assert.ok(_src.includes('aria-describedby="search-hint"'), 'input not described by the hint');
  assert.ok(_src.includes('#search-wrap:focus-within #search-hint'), 'hint not shown on focus');
  // the GUIDE (? concept guide) documents the operators — id:'search-ops' in cat:'getting-around'
  assert.ok(_src.includes("id:'search-ops'"), 'GUIDE search-ops entry missing');
  // wiring: applySearch parses once per query
  assert.ok(_src.includes('searchTerms = parseSearchQuery(q)'), 'applySearch does not parse the query');
});

// ─── per-node properties ─────────────────────────────────────────────────────

test('properties: mkNode initialises props as an empty array', () => {
  const n = c.mkNode('hello');
  assert.deepEqual(host(n.props), []);
});

test('properties: parseSearchQuery parses has: and key:value operators', () => {
  assert.deepEqual(host(c.parseSearchQuery('has:status')),
    [{ neg: false, kind: 'has', value: 'status' }]);
  assert.deepEqual(host(c.parseSearchQuery('status:done')),
    [{ neg: false, kind: 'prop', key: 'status', value: 'done' }]);
  assert.deepEqual(host(c.parseSearchQuery('-has:priority')),
    [{ neg: true, kind: 'has', value: 'priority' }]);
  assert.deepEqual(host(c.parseSearchQuery('author:alice')),
    [{ neg: false, kind: 'prop', key: 'author', value: 'alice' }]);
  // is: with unrecognised value still stays literal text
  assert.deepEqual(host(c.parseSearchQuery('is:tomorrow')),
    [{ neg: false, kind: 'text', value: 'is:tomorrow' }]);
});

test('properties: queryMatchesNode — has: and key:value matching', () => {
  const q = s => c.parseSearchQuery(s);
  const n = c.mkNode('a task');
  n.props = [{ key: 'status', val: 'done' }, { key: 'author', val: 'alice' }];

  assert.equal(c.queryMatchesNode(q('has:status'), n), true);
  assert.equal(c.queryMatchesNode(q('has:priority'), n), false);
  assert.equal(c.queryMatchesNode(q('status:done'), n), true);
  assert.equal(c.queryMatchesNode(q('status:open'), n), false);
  assert.equal(c.queryMatchesNode(q('author:alice'), n), true);
  assert.equal(c.queryMatchesNode(q('author:bob'), n), false);
  // negation
  assert.equal(c.queryMatchesNode(q('-has:status'), n), false);
  assert.equal(c.queryMatchesNode(q('-has:priority'), n), true);
  assert.equal(c.queryMatchesNode(q('-status:open'), n), true);
  // AND with other terms
  assert.equal(c.queryMatchesNode(q('task status:done'), n), true);
  assert.equal(c.queryMatchesNode(q('task status:open'), n), false);
  // no props at all
  const bare = c.mkNode('no props');
  assert.equal(c.queryMatchesNode(q('has:status'), bare), false);
});

test('properties: key:value search is case-insensitive on both sides', () => {
  const q = s => c.parseSearchQuery(s);
  const n = c.mkNode('x');
  n.props = [{ key: 'Status', val: 'Done' }];
  assert.equal(c.queryMatchesNode(q('status:done'), n), true);
  assert.equal(c.queryMatchesNode(q('STATUS:DONE'), n), true);
  assert.equal(c.queryMatchesNode(q('has:status'), n), true);
  assert.equal(c.queryMatchesNode(q('has:STATUS'), n), true);
});

test('properties: OPML round-trip via toMarkdown preserves props as continuation line', () => {
  const root = c.mkRoot();
  const n = c.mkNode('My task');
  n.props = [{ key: 'status', val: 'done' }, { key: 'author', val: 'alice' }];
  root.children.push(n);
  const md = c.toMarkdown(root);
  assert.ok(md.includes('[status: done · author: alice]'), `markdown export missing props: ${md}`);
  const pt = c.toPlainText(root);
  assert.ok(pt.includes('[status: done · author: alice]'), `plain text export missing props: ${pt}`);
});

test('properties: wiring and front doors are present (src pins)', () => {
  assert.ok(_src.includes("kind: 'has'"),   "has: query kind missing");
  assert.ok(_src.includes("kind: 'prop'"),  "prop: query kind missing");
  assert.ok(_src.includes('openPropsDialog'), 'openPropsDialog missing');
  assert.ok(_src.includes("'Add property'"), "bullet menu 'Add property' label missing");
  assert.ok(_src.includes('buildPropsRow'),  'buildPropsRow missing');
  assert.ok(_src.includes('buildPropsArea'), 'buildPropsArea missing');
  assert.ok(_src.includes("has:key"),        '? panel has:key missing');
  assert.ok(_src.includes('_props'),         'OPML _props attribute missing');
  assert.ok(_src.includes('node.props'),     'props sidecar not referenced');
});

// Regression guard for the dialog crash: the canonical node lookup is nodeById().
// A `findById(` reference is a typo that throws only when the dialog is opened —
// invisible to src-pin greps and pure-core tests, caught here instead. (The real
// fix is running the UI; this is the cheap backstop for this specific typo class.)
test('no undefined node-lookup helper (findById is not a function)', () => {
  assert.ok(!_src.includes('findById('), 'use nodeById() — findById is not defined');
});

// ─── saved searches ───────────────────────────────────────────────────────────

test('saved searches: toggleSavedSearch adds, removes, trims, returns new arrays', () => {
  const a = c.toggleSavedSearch([], '#work -is:done');
  assert.deepEqual(host(a), ['#work -is:done']);
  const b = c.toggleSavedSearch(a, 'is:todo');
  assert.deepEqual(host(b), ['#work -is:done', 'is:todo']);
  const d = c.toggleSavedSearch(b, ' #work -is:done ');       // trim-exact match removes
  assert.deepEqual(host(d), ['is:todo']);
  assert.deepEqual(host(c.toggleSavedSearch(d, '')), ['is:todo']);   // empty is a no-op
  assert.deepEqual(host(c.toggleSavedSearch(d, '  ')), ['is:todo']);
  assert.deepEqual(host(c.toggleSavedSearch(undefined, 'x')), ['x']); // tolerates missing list
  assert.notEqual(c.toggleSavedSearch(d, 'y'), d);                    // never mutates in place
  assert.deepEqual(host(d), ['is:todo']);
});

test('saved searches: isSavedSearch — trim-exact membership, empty never saved', () => {
  const list = ['#work -is:done', 'is:todo'];
  assert.equal(c.isSavedSearch(list, '#work -is:done'), true);
  assert.equal(c.isSavedSearch(list, '  is:todo '), true);
  assert.equal(c.isSavedSearch(list, '#work'), false);
  assert.equal(c.isSavedSearch(list, ''), false);
  assert.equal(c.isSavedSearch(undefined, 'x'), false);
});

test('saved searches: toOpml emits the head element only when non-empty', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode('item'));
  assert.ok(!c.toOpml(root).includes('_savedSearches'), 'empty list must not emit');
  root.savedSearches = ['#work -is:done', '"exact phrase"'];
  const xml = c.toOpml(root);
  assert.ok(xml.includes('<_savedSearches>'), 'head element missing');
  // JSON's \" then ex()'s &quot; compose: ["…","\"exact phrase\""]
  assert.ok(xml.includes('\\&quot;exact phrase\\&quot;'), 'JSON content not ex()-escaped');
});

test('saved searches: UI wiring + parse-side present (src pins)', () => {
  // serialize + parse land in the same change (the OPML invariant); the head-config
  // helpers (F6) carry both sides — serialize via headEl, parse via headJSONArray
  assert.ok(_src.includes("headJSONArray(doc, '_savedSearches'"), 'fromOpml parse missing');
  assert.ok(_src.includes("headEl('_savedSearches'"), 'toOpml serialize missing');
  assert.ok(_src.includes('savedSearches: []'), 'mkRoot default missing');
  // P2 front doors: the star button + the saved chips section in the panel
  assert.ok(_src.includes('id="search-save"'), 'star button missing');
  assert.ok(_src.includes('id="sh-saved"'), 'saved section missing');
  // P3: chips carry a keyboard path (Enter/Space apply, Delete forgets)
  assert.ok(_src.includes("e.key === 'Delete' || e.key === 'Backspace'"), 'chip Delete branch missing');
  // P1/caret: star + chips swallow mousedown so the box keeps its caret
  assert.ok(_src.includes("getElementById('search-save').addEventListener('mousedown', e => e.preventDefault())"), 'star mousedown guard missing');
});

// ─── templates ─────────────────────────────────────────────────────────────────

test('templates: mkRoot initialises templates as an empty array', () => {
  assert.deepEqual(host(c.mkRoot().templates), []);
});

test('templates: upsertTemplate appends, updates by trim-exact name, returns new array', () => {
  const n1 = c.mkNode('one');
  const n2 = c.mkNode('two');
  const a = c.upsertTemplate([], 'Review', n1);
  assert.equal(a.length, 1);
  assert.equal(a[0].name, 'Review');
  assert.equal(a[0].node, n1);
  // saving over the same name (with surrounding space) updates in place, not appends
  const b = c.upsertTemplate(a, '  Review  ', n2);
  assert.equal(b.length, 1);
  assert.equal(b[0].node, n2);
  // a distinct name appends
  const d = c.upsertTemplate(b, 'Other', n1);
  assert.equal(d.length, 2);
  // empty name or missing node is a no-op copy (never mutates input)
  assert.deepEqual(host(c.upsertTemplate(d, '', n1)).length, 2);
  assert.deepEqual(host(c.upsertTemplate(d, 'x', null)).length, 2);
  assert.notEqual(c.upsertTemplate(d, 'z', n1), d); // new array
});

test('templates: removeTemplate / findTemplate are trim-exact and pure', () => {
  const list = [{ name: 'A', node: c.mkNode('a') }, { name: 'B', node: c.mkNode('b') }];
  assert.equal(c.findTemplate(list, 'A').name, 'A');
  assert.equal(c.findTemplate(list, '  A  ').name, 'A'); // trim-exact
  assert.equal(c.findTemplate(list, 'C'), null);
  const after = c.removeTemplate(list, 'A');
  assert.equal(after.length, 1);
  assert.equal(after[0].name, 'B');
  assert.equal(list.length, 2);                          // input untouched
  assert.equal(c.removeTemplate(list, 'missing').length, 2);
});

test('templates: deepCloneNodeNewIds gives fresh ids and unshared sidecars (incl. seq + props)', () => {
  const src = c.mkNode('parent');
  src.props = [{ key: 'status', val: 'active' }];
  src.seq = [{ key: 'k1', name: 'Flow', states: ['TODO', 'DONE'], doneFrom: 1 }];
  const child = c.mkNode('child');
  src.children.push(child);

  const clone = c.deepCloneNodeNewIds(src);
  // fresh ids top and down
  assert.notEqual(clone.id, src.id);
  assert.notEqual(clone.children[0].id, src.children[0].id);
  assert.equal(clone.text, 'parent');
  // sidecars are copied, not shared — mutating the clone must not touch the source
  assert.notEqual(clone.props, src.props);
  assert.notEqual(clone.seq, src.seq);
  clone.props[0].val = 'done';
  assert.equal(src.props[0].val, 'active');
  clone.seq[0].states.push('X');
  assert.equal(src.seq[0].states.length, 2);
});

test('templates: OPML head round-trips templates (serialize + structure)', () => {
  const root = c.mkRoot();
  root.children.push(c.mkNode('doc'));
  assert.ok(!c.toOpml(root).includes('_templates'), 'empty list must not emit');
  const tnode = c.mkNode('Weekly review');
  tnode.children.push(c.mkNode('- [ ] inbox zero'));
  root.templates = [{ name: 'Review', node: tnode }];
  const xml = c.toOpml(root);
  assert.ok(xml.includes('<_templates>'), 'head element missing');
  assert.ok(xml.includes('Weekly review'), 'template node text not serialized');
});

test('templates: UI wiring + front doors present (src pins)', () => {
  assert.ok(_src.includes("headJSONArray(doc, '_templates'"), 'fromOpml parse missing');
  assert.ok(_src.includes("headEl('_templates'"), 'toOpml serialize missing');
  assert.ok(_src.includes('templates: []'), 'mkRoot default missing');
  assert.ok(_src.includes('openSaveTemplateDialog'), 'save door missing');
  assert.ok(_src.includes('openTemplatePicker'),     'stamp picker missing');
  assert.ok(_src.includes('stampTemplate'),          'stamp impl missing');
  assert.ok(_src.includes("id:'template'"),          '/ menu entry missing');
  assert.ok(_src.includes("label:'Save as template'"), 'bullet menu door missing');
  // stamp re-indexes the whole cloned subtree
  assert.ok(_src.includes('buildIndex(root, null); // re-index the whole stamped subtree'), 'reindex after stamp missing');
});

// ─── refile / point-tree navigator ──────────────────────────────────────────────

test('treeRows: browse mode flattens with depth, honoring the expanded set', () => {
  const root = c.mkRoot();
  const a = c.mkNode('Alpha');
  const b = c.mkNode('Beta');
  const bChild = c.mkNode('Beta child');
  b.children.push(bChild);
  root.children.push(a, b);
  // nothing expanded → only top-level points; Beta flagged hasChildren + collapsed
  let rows = c.treeRows(root, { expanded: new Set() });
  assert.deepEqual(host(rows.map(r => r.title)), ['Alpha', 'Beta']);
  const beta = rows.find(r => r.title === 'Beta');
  assert.equal(beta.hasChildren, true);
  assert.equal(beta.expanded, false);
  assert.equal(beta.depth, 0);
  // expand Beta → its child appears at depth 1, in order
  rows = c.treeRows(root, { expanded: new Set([b.id]) });
  assert.deepEqual(host(rows.map(r => r.title)), ['Alpha', 'Beta', 'Beta child']);
  assert.equal(rows.find(r => r.title === 'Beta child').depth, 1);
});

test('treeRows: excludeId drops the moved point and its whole subtree', () => {
  const root = c.mkRoot();
  const a = c.mkNode('Alpha');
  const moved = c.mkNode('Movable');
  const movedKid = c.mkNode('Movable kid');
  moved.children.push(movedKid);
  root.children.push(a, moved);
  const titles = c.treeRows(root, { expanded: new Set([moved.id]), excludeId: moved.id }).map(r => r.title);
  assert.ok(titles.includes('Alpha'));
  assert.ok(!titles.includes('Movable'), 'moved point must be excluded');
  assert.ok(!titles.includes('Movable kid'), 'moved descendants must be excluded');
});

test('treeRows: filter keeps matches plus their ancestors (auto-expanded), case-insensitive', () => {
  const root = c.mkRoot();
  const groc = c.mkNode('Groceries');
  const milk = c.mkNode('Milk');
  groc.children.push(milk);
  root.children.push(groc, c.mkNode('Garage'));
  // a nested leaf matches → its ancestor (Groceries) is kept as context, flagged non-match
  const rows = c.treeRows(root, { query: 'milk' });
  assert.deepEqual(host(rows.map(r => r.title)), ['Groceries', 'Milk']);
  assert.equal(rows.find(r => r.title === 'Groceries').match, false, 'ancestor is context, not a match');
  assert.equal(rows.find(r => r.title === 'Milk').match, true, 'leaf is the match');
  assert.equal(rows.find(r => r.title === 'Groceries').expanded, true, 'ancestors auto-expand in filter mode');
  // case-insensitive top-level match; no match → empty
  assert.deepEqual(host(c.treeRows(root, { query: 'GARAGE' }).map(r => r.title)), ['Garage']);
  assert.equal(c.treeRows(root, { query: 'zzz' }).length, 0);
});

test('treeRows: untitled / base targets still surface with a label (pickerTitle)', () => {
  const root = c.mkRoot();
  const blank = c.mkNode('');
  const base = c.mkNode('| a |', 'base');
  root.children.push(blank, base);
  const titles = c.treeRows(root, { expanded: new Set() }).map(r => r.title);
  assert.ok(titles.includes('(untitled)'), 'blank point gets a placeholder label');
  assert.ok(titles.includes('Base'), 'base gets a Base label');
  assert.equal(c.pickerTitle(base), 'Base');
});

test('refile: UI wiring + ancestor guard present (src pins)', () => {
  assert.ok(_src.includes('openRefileDialog'),  'refile dialog missing');
  assert.ok(_src.includes('function refileNodeTo'), 'mover missing');
  assert.ok(_src.includes("label:'Refile…'"),   'bullet menu door missing');
  // self / own-descendant guard (would orphan the subtree)
  assert.ok(_src.includes('moveId === targetId || isDescOf(moveId, targetId)'), 'ancestor guard missing');
  // keyboard-navigable quick-switcher (↑/↓/Enter on the search input)
  assert.ok(_src.includes("e.key === 'ArrowDown'") && _src.includes("e.key === 'ArrowUp'"), 'list keyboard nav missing');
  // top-level (root) refile option
  assert.ok(_src.includes("title: 'Top level'"), 'top-level option missing');
});

// ─── capture / quick inbox ─────────────────────────────────────────────────────

test('capture: mkRoot initialises inboxes as an empty list', () => {
  const ib = c.mkRoot().inboxes;
  assert.ok(Array.isArray(ib) && ib.length === 0, 'inboxes should be an empty array');
});

test('capture: inboxes round-trip through the OPML head (up to 10 slots)', () => {
  const root = c.mkRoot();
  const a = c.mkNode('Inbox A'), b = c.mkNode('Inbox B');
  root.children.push(a, b);
  // empty → no element emitted
  assert.ok(!c.toOpml(root).includes('_inboxes'), 'must not emit when empty');
  root.inboxes = [a.id, b.id];
  const xml = c.toOpml(root);
  // serialized as a JSON array in the <_inboxes> head element (headEl array form)
  assert.ok(xml.includes('<_inboxes>') && xml.includes(a.id) && xml.includes(b.id), 'inbox list not serialized');
  // each inbox point's own id round-trips (so the pointers stay valid after reload)
  assert.ok(xml.includes('_id="' + a.id + '"') && xml.includes('_id="' + b.id + '"'), 'inbox point _id must round-trip');
});

test('capture: UI wiring + front doors present (src pins)', () => {
  // new array head element + legacy single-inbox migration on load
  assert.ok(_src.includes("headJSONArray(doc, '_inboxes'"), 'fromOpml parse of _inboxes missing');
  assert.ok(_src.includes("doc.querySelector('head > _inbox')"), 'legacy _inbox migration missing');
  assert.ok(_src.includes('inboxes: []'), 'mkRoot default missing');
  assert.ok(_src.includes('const MAX_INBOXES = 10'), 'inbox cap missing');
  assert.ok(_src.includes('function inboxAt') && _src.includes('function setInboxSlot') && _src.includes('function removeInboxSlot'), 'slot helpers missing');
  assert.ok(_src.includes('function doCapture'), 'capture action missing');
  assert.ok(_src.includes('id="btn-capture"'), 'toolbar button missing');
  assert.ok(_src.includes("getElementById('btn-capture').addEventListener"), 'button not wired');
  // capture is a TOOLBAR STRIP (not a modal): a #capture-strip region toggled open/closed,
  // rendered by renderCaptureStrip, focusing its input; ⌘⇧I toggles it.
  assert.ok(_src.includes('id="capture-strip"'), 'capture strip region missing');
  assert.ok(_src.includes('function renderCaptureStrip'), 'strip renderer missing');
  assert.ok(_src.includes('function closeCapture') && _src.includes('function toggleCapture'), 'strip open/close missing');
  assert.ok(_src.includes("getElementById('cap-input')"), 'strip input focus missing');
  assert.ok(_src.includes('toggleCapture()'), '⌘⇧I toggle wiring missing');
  // slot shortcuts: ⌘⇧<N> capture-to-slot (adopt current point if empty), ⌘⌥<N> set-as-inbox
  assert.ok(_src.includes('openCaptureDialog(d === 0 ? 10 : d)'), 'slot capture shortcut missing');
  assert.ok(_src.includes('function captureCurrentPointId'), 'current-point adopt path missing');
  // in-strip ⌘⇧<N> switches the target slot without reopening (captureTargetSlot)
  assert.ok(_src.includes('function capInputKeydown') && _src.includes('captureTargetSlot(d === 0 ? 10 : d)'), 'in-strip slot switch missing');
  // no destination yet → the capture action opens the manager, never silently no-ops (P4)
  assert.ok(_src.includes('if (!inbox) { captureManage = true; renderCaptureStrip(); return; }'), 'unset-inbox path missing');
  // Add-inbox must OPEN the modal overlay itself (the strip is no longer a modal, so the
  // tree picker needs its own ioBack.on — the "dead Add button" regression).
  {
    const add = _src.slice(_src.indexOf('function captureAddInbox'), _src.indexOf('function captureAddInbox') + 1500);
    assert.ok(add.includes("ioBack.classList.add('on')"), 'Add-inbox must open the modal overlay');
    assert.ok(add.includes('buildTreePicker'), 'Add-inbox must use the tree picker');
  }
  // captured text is markdown-aware (a typed - [ ] becomes a to-do)
  assert.ok(_src.includes('deriveTypeFromText(text)') && _src.includes('todoDoneFromText(text)'), 'capture not markdown-aware');
});

test('progress cookies: tallyMarkers counts each [ ]/[x] marker, done = [x]', () => {
  assert.deepEqual(host(c.tallyMarkers('- [ ] a\n- [x] b\n- [ ] c')), { done: 1, total: 3 });
  assert.deepEqual(host(c.tallyMarkers('* [x] a\n+ [x] b')),          { done: 2, total: 2 });
  assert.deepEqual(host(c.tallyMarkers('1. [ ] a\n2. [x] b')),        { done: 1, total: 2 }); // ordered tasks
  assert.deepEqual(host(c.tallyMarkers('no tasks here')),             { done: 0, total: 0 });
  assert.deepEqual(host(c.tallyMarkers('')),                          { done: 0, total: 0 });
});

test('progress cookies: progressCount — own-text checkboxes + direct child tasks', () => {
  // own-text checklist (cookie + boxes in the SAME point)
  const a = c.mkNode('Shopping [/]\n- [ ] milk\n- [x] eggs\n- [ ] bread');
  assert.deepEqual(host(c.progressCount(a)), { done: 1, total: 3 });
  // direct child task points — each marker counts individually
  const p = c.mkNode('Project [/]');
  p.children.push(c.mkNode('- [x] design'));
  p.children.push(c.mkNode('- [ ] build\n- [ ] ship'));   // one child point, two markers
  assert.deepEqual(host(c.progressCount(p)), { done: 1, total: 3 });
});

test('progress cookies: keyword/sequenced child points count once, done-aware', () => {
  const seqs = [DEFAULT_SEQ, FLOW];
  const p = c.mkNode('Roadmap [/]');
  p.children.push(c.mkNode('#TODO a'));      // open (default)
  p.children.push(c.mkNode('#DONE b'));      // done (default)
  p.children.push(c.mkNode('#DOING c'));     // open (Flow)
  p.children.push(c.mkNode('#SHIPPED d'));   // done (Flow)
  p.children.push(c.mkNode('plain note'));   // not a task → ignored
  assert.deepEqual(host(c.progressCount(p, seqs)), { done: 2, total: 4 });
});

test('progress cookies: a child with markers counts its markers (the granular unit)', () => {
  const p = c.mkNode('[/]');
  p.children.push(c.mkNode('#TODO sub\n- [x] one\n- [ ] two'));  // has markers → count them
  assert.deepEqual(host(c.progressCount(p)), { done: 1, total: 2 });
});

test('progress cookies: scope is one level — grandchildren are not counted', () => {
  const p = c.mkNode('[/]');
  const child = c.mkNode('- [ ] direct');
  child.children.push(c.mkNode('- [x] grandchild'));  // deeper → excluded
  p.children.push(child);
  assert.deepEqual(host(c.progressCount(p)), { done: 0, total: 1 });
});

test('progress cookies: formatProgressCookie — fraction and rounded percent', () => {
  assert.equal(c.formatProgressCookie('frac', 1, 3), '[1/3]');
  assert.equal(c.formatProgressCookie('frac', 0, 0), '[0/0]');
  assert.equal(c.formatProgressCookie('pct',  1, 3), '[33%]');   // rounds
  assert.equal(c.formatProgressCookie('pct',  2, 4), '[50%]');
  assert.equal(c.formatProgressCookie('pct',  0, 0), '[0%]');    // no divide-by-zero
  assert.equal(c.formatProgressCookie('pct',  3, 3), '[100%]');
});

test('progress cookies: flattenArtifacts freezes the tally for one-way export', () => {
  const flat = c._context.flattenArtifacts;
  const p = c.mkNode('Project [/] — [%] done');
  p.children.push(c.mkNode('- [x] a'));
  p.children.push(c.mkNode('- [ ] b'));
  p.children.push(c.mkNode('- [ ] c'));
  assert.equal(flat(p.text, p, {}), 'Project [1/3] — [33%] done');
});

test('progress cookies: render + front-door wiring (src pins)', () => {
  assert.ok(_src.includes('progressCount(cookieNode, allSequences(), depth)'), 'mdInline cookie pass missing');
  assert.ok(_src.includes('let cookieNode = null'), 'cookieNode global missing');
  assert.ok(_src.includes("id:'progress'"), 'progress @ entry missing');
  assert.ok(_src.includes("applyInlineInsertion(nodeId, offset, '[/]')"), 'progress insert missing');
  // P5-4: the syntax also lives in the GUIDE (? concept guide), not only the @ menu
  assert.ok(_src.includes("id:'progress'") && _src.includes("syn:'[/]'"), 'GUIDE progress entry or [/] example missing');
  // P4: a child partial-toggle refreshes a cookie-bearing ancestor (UXP-159: scope-aware walk)
  assert.ok(_src.includes('COOKIE_ANY') && _src.includes('COOKIE_DEEP'), 'ancestor-cookie refresh missing');
});

// ── subtree aggregation: {= sum|avg|count(prop)} over direct children ────────
test('subtree aggregation: childPropNumber reads numbers AND date-shaped values (epoch-days)', () => {
  const child = c.mkNode('milk');
  child.props.push({ key: 'cost', val: '3' });
  child.props.push({ key: 'due', val: '2026-06-14' });   // a date → its epoch-day
  child.props.push({ key: 'label', val: 'frozen' });     // a plain word → null
  assert.equal(c.childPropNumber(child, 'cost'), 3);      // numeric first — "3" stays 3, not a date
  assert.equal(c.childPropNumber(child, 'due'), c.parseDueDate('2026-06-14'));  // date aggregates as epoch-days
  assert.equal(c.childPropNumber(child, 'label'), null);  // non-date string → still skipped
  assert.equal(c.childPropNumber(child, 'missing'), null);
});

test('subtree aggregation: date properties aggregate (min/max/count, the F2 date-range unlock)', () => {
  const p = c.mkNode('Project');
  const k1 = c.mkNode('A'); k1.props.push({ key: 'due', val: '2026-01-10' }); k1.props.push({ key: 'start', val: '2026-01-01' });
  const k2 = c.mkNode('B'); k2.props.push({ key: 'due', val: '2026-03-20' }); k2.props.push({ key: 'start', val: '2026-02-15' });
  const k3 = c.mkNode('C'); k3.props.push({ key: 'note', val: 'no dates here' });
  p.children.push(k1, k2, k3);
  assert.equal(c.aggregateChildren(p, 'max', 'due'), c.parseDueDate('2026-03-20'), 'latest child due');
  assert.equal(c.aggregateChildren(p, 'min', 'start'), c.parseDueDate('2026-01-01'), 'earliest child start');
  assert.equal(c.aggregateChildren(p, 'count', 'due'), 2, 'only the two dated children count');
  // a date-range check now computes: max(due) <= a deadline → real F2 constraint
  const deadline = c.parseDueDate('2026-04-01');
  assert.ok(c.aggregateChildren(p, 'max', 'due') <= deadline, 'all child dues before the deadline');
  // numeric aggregation unchanged when props are plain numbers
  const q = c.mkNode('Q');
  const n1 = c.mkNode(''); n1.props.push({ key: 'cost', val: '5' });
  const n2 = c.mkNode(''); n2.props.push({ key: 'cost', val: '7' });
  q.children.push(n1, n2);
  assert.equal(c.aggregateChildren(q, 'sum', 'cost'), 12);
  assert.equal(c.aggregateChildren(q, 'avg', 'cost'), 6);
});

test('subtree aggregation: aggregateChildren sum / avg / count over DIRECT children', () => {
  const p = c.mkNode('Cart');
  const a = c.mkNode('milk'); a.props.push({ key: 'cost', val: '3' });
  const b = c.mkNode('eggs'); b.props.push({ key: 'cost', val: '5' });
  p.children.push(a, b, c.mkNode('a note with no cost'));
  assert.equal(c.aggregateChildren(p, 'sum', 'cost'), 8);
  assert.equal(c.aggregateChildren(p, 'avg', 'cost'), 4);    // 8 / 2 (only children that have cost)
  assert.equal(c.aggregateChildren(p, 'count', 'cost'), 2);
  assert.equal(c.aggregateChildren(p, 'sum', 'missing'), 0); // nothing → 0
});

// ── depth-scope core (UXP-159) ───────────────────────────────────────────────
test('resolveScopeDepth — keywords and numbers map to a max depth; junk → null', () => {
  assert.equal(c.resolveScopeDepth('self'), 0);
  assert.equal(c.resolveScopeDepth('children'), 1);
  assert.equal(c.resolveScopeDepth('subtree'), Infinity);
  assert.equal(c.resolveScopeDepth('1'), 1);
  assert.equal(c.resolveScopeDepth('2'), 2);
  assert.equal(c.resolveScopeDepth('3'), 3);
  assert.equal(c.resolveScopeDepth(2), 2);              // a number, not a string
  assert.equal(c.resolveScopeDepth('CHILDREN'), 1);     // case-insensitive
  assert.equal(c.resolveScopeDepth('0'), null);         // 0 would mean self; write `self`
  assert.equal(c.resolveScopeDepth('nonsense'), null);
  assert.equal(c.resolveScopeDepth(''), null);
});

test('collectScoped — gathers descendants to depth N, never self (UXP-159)', () => {
  // tree: root > A > A1 > A1a ; root > B
  const root = c.mkNode('root');
  const A = c.mkNode('A'), A1 = c.mkNode('A1'), A1a = c.mkNode('A1a'), B = c.mkNode('B');
  A1.children.push(A1a); A.children.push(A1); root.children.push(A, B);
  const ids = d => host(c.collectScoped(root, d).map(n => n.text)).sort();
  assert.deepEqual(ids(1), ['A', 'B']);                       // direct children only
  assert.deepEqual(ids(2), ['A', 'A1', 'B']);                 // + grandchildren
  assert.deepEqual(ids(3), ['A', 'A1', 'A1a', 'B']);          // + great-grandchildren
  assert.deepEqual(ids(Infinity), ['A', 'A1', 'A1a', 'B']);   // whole subtree
  assert.deepEqual(ids(0), []);                               // self → no descendants
});

test('aggregateChildren depth: sum reaches deeper with a depth arg (UXP-159)', () => {
  // Cart > (milk 3) ; Cart > Produce > (apples 5) > (organic 2)   [nested costs]
  const cart = c.mkNode('Cart');
  const milk = c.mkNode('milk'); milk.props.push({ key: 'cost', val: '3' });
  const produce = c.mkNode('Produce'); // no cost of its own
  const apples = c.mkNode('apples'); apples.props.push({ key: 'cost', val: '5' });
  const organic = c.mkNode('organic'); organic.props.push({ key: 'cost', val: '2' });
  apples.children.push(organic); produce.children.push(apples); cart.children.push(milk, produce);
  assert.equal(c.aggregateChildren(cart, 'sum', 'cost'), 3);              // depth 1 default: only milk
  assert.equal(c.aggregateChildren(cart, 'sum', 'cost', 1), 3);          // explicit direct
  assert.equal(c.aggregateChildren(cart, 'sum', 'cost', 2), 8);          // + apples (3+5)
  assert.equal(c.aggregateChildren(cart, 'sum', 'cost', Infinity), 10);  // whole subtree (3+5+2)
  assert.equal(c.aggregateChildren(cart, 'count', 'cost', Infinity), 3); // three priced nodes
});

test('expandAggExpr depth arg: sum(prop, scope) parses; bad scope → literal → #ERR (UXP-159)', () => {
  const cart = c.mkNode('Cart');
  const a = c.mkNode('a'); a.props.push({ key: 'cost', val: '4' });
  const b = c.mkNode('b'); const b1 = c.mkNode('b1'); b1.props.push({ key: 'cost', val: '6' });
  b.children.push(b1); cart.children.push(a, b);
  assert.equal(c.expandAggExpr('sum(cost)', cart), '(4)');            // direct only, unchanged
  assert.equal(c.expandAggExpr('sum(cost, subtree)', cart), '(10)');  // + grandchild
  assert.equal(c.expandAggExpr('sum(cost, 2)', cart), '(10)');        // depth 2
  assert.equal(c.expandAggExpr('sum(cost, children)', cart), '(4)');  // explicit direct
  // an unrecognized scope stays literal, so evalMath (downstream) reports #ERR, not a wrong number
  assert.equal(c.expandAggExpr('sum(cost, nonsense)', cart), 'sum(cost, nonsense)');
});

test('words() depth: a number picks an exact depth; keywords unchanged (UXP-159)', () => {
  const root = c.mkNode('root has three words');   // 4 words
  const kid = c.mkNode('kid two');                  // 2
  const grandkid = c.mkNode('deep one');            // 2
  kid.children.push(grandkid); root.children.push(kid);
  assert.equal(c.expandAggExpr('words(self)', root), '(4)');
  assert.equal(c.expandAggExpr('words(children)', root), '(2)');     // direct child only, no self
  assert.equal(c.expandAggExpr('words(subtree)', root), '(8)');      // 4+2+2
  // a NUMBER is self-inclusive ("me plus N levels"); the `children` KEYWORD keeps its legacy no-self meaning
  assert.equal(c.expandAggExpr('words(1)', root), '(6)');            // self + direct child: 4+2
  assert.equal(c.expandAggExpr('words(2)', root), '(8)');            // self + 2 levels: 4+2+2
});

test('progressCount depth: a scoped cookie tallies deeper (UXP-159)', () => {
  // Project > (- [x] a) ; Project > Phase > (- [ ] b) > (- [x] c)
  const proj = c.mkNode('Project');
  const a = c.mkNode('- [x] a');
  const phase = c.mkNode('Phase');
  const b = c.mkNode('- [ ] b');
  const cc = c.mkNode('- [x] c');
  b.children.push(cc); phase.children.push(b); proj.children.push(a, phase);
  const SEQS = host(c.allSequences());
  const at = d => { const r = host(c.progressCount(proj, SEQS, d)); return r.done + '/' + r.total; };
  assert.equal(at(1), '1/1');          // direct: only `a` (done)
  assert.equal(at(2), '1/2');          // + `b` (not done): 1 done of 2
  assert.equal(at(Infinity), '2/3');   // whole subtree: a✓, b✗, c✓
});

test('subtree aggregation: only DIRECT children count (grandchildren excluded)', () => {
  const p = c.mkNode('p');
  const child = c.mkNode('c'); child.props.push({ key: 'cost', val: '10' });
  const grand = c.mkNode('g'); grand.props.push({ key: 'cost', val: '100' });
  child.children.push(grand);
  p.children.push(child);
  assert.equal(c.aggregateChildren(p, 'sum', 'cost'), 10);   // the grandchild's 100 is not counted
});

test('subtree aggregation: expandAggExpr substitutes, then evalMath computes', () => {
  const p = c.mkNode('Cart');
  const a = c.mkNode('a'); a.props.push({ key: 'cost', val: '3' });
  const b = c.mkNode('b'); b.props.push({ key: 'cost', val: '5' });
  p.children.push(a, b);
  assert.equal(c.expandAggExpr('sum(cost)', p), '(8)');
  assert.equal(c.expandAggExpr('sum(cost) * 1.1', p), '(8) * 1.1');
  assert.equal(c.evalMath(c.expandAggExpr('sum(cost) * 2', p), {}), 16); // the real eval path
  // min/max(prop) ARE aggregations now (single bare identifier); the numeric
  // variadic min(a,b)/max(1,2) keeps its meaning (a comma excludes it from the regex)
  assert.equal(c.expandAggExpr('min(cost)', p), '(3)');
  assert.equal(c.expandAggExpr('max(cost)', p), '(5)');
  assert.equal(c.expandAggExpr('max(1, 2)', p), 'max(1, 2)');
  assert.equal(c.expandAggExpr('min(a, b)', p), 'min(a, b)');
  // node-less expansion aggregates over nothing → 0, so {= sum(cost)} still validates
  assert.equal(c.expandAggExpr('sum(cost)', null), '(0)');
  assert.equal(c.evalMath(c.expandAggExpr('sum(cost)', null), {}), 0);
});

test('subtree aggregation: min / max over a child property (empty → ±∞ identity)', () => {
  const p = c.mkNode('Cart');
  const a = c.mkNode('a'); a.props.push({ key: 'cost', val: '3' });
  const b = c.mkNode('b'); b.props.push({ key: 'cost', val: '5' });
  const z = c.mkNode('c'); z.props.push({ key: 'cost', val: '2' });
  p.children.push(a, b, z, c.mkNode('no cost here'));
  assert.equal(c.aggregateChildren(p, 'min', 'cost'), 2);
  assert.equal(c.aggregateChildren(p, 'max', 'cost'), 5);
  // empty set → the function's IDENTITY element, not 0 (so constraints are vacuously true)
  assert.equal(c.aggregateChildren(p, 'min', 'missing'), Infinity);
  assert.equal(c.aggregateChildren(p, 'max', 'missing'), -Infinity);
  assert.equal(c.aggregateChildren(c.mkNode('leaf'), 'min', 'cost'), Infinity);  // no children at all
});

test('subtree aggregation: min/max(prop) is purely additive — numeric min(a,b)/max(1,2) untouched', () => {
  const p = c.mkNode('Cart');
  const a = c.mkNode('a'); a.props.push({ key: 'cost', val: '3' });
  const b = c.mkNode('b'); b.props.push({ key: 'cost', val: '5' });
  p.children.push(a, b);
  // single bare identifier → child aggregation
  assert.equal(c.expandAggExpr('min(cost)', p), '(3)');
  assert.equal(c.expandAggExpr('max(cost)', p), '(5)');
  assert.equal(c.evalMath(c.expandAggExpr('max(cost) - min(cost)', p), {}), 2); // range, end-to-end
  // a comma → NOT a single identifier → left for evalMath's numeric variadic path
  assert.equal(c.expandAggExpr('min(2, 9)', p), 'min(2, 9)');
  assert.equal(c.evalMath('min(2, 9)', {}), 2);    // the numeric path is intact (no regression)
  assert.equal(c.evalMath('max(2, 9)', {}), 9);
  // node-less expansion → ±∞ identity (a valid number), so {= max(prop)} validates at creation
  assert.equal(c.expandAggExpr('min(start)', null), '(Infinity)');
  assert.equal(c.evalMath(c.expandAggExpr('max(cost)', null), {}), -Infinity);
});

test('subtree aggregation: min/max empty set makes a range constraint vacuously TRUE', () => {
  // a point with no children carrying `start` — `min(start) >= 100` must be true (+∞ >= 100),
  // not a spurious false from a 0 sentinel. This is what F2 range checks rely on.
  const p = c.mkNode('Milestone'); p.children.push(c.mkNode('a note'), c.mkNode('another'));
  assert.equal(c.evalMath(c.expandAggExpr('min(start) >= 100', p), {}), 1);
  assert.equal(c.evalMath(c.expandAggExpr('max(due) <= 100', p), {}), 1);   // -∞ <= 100 → true
});

// ── word count: {= words(scope)} prose roll-up ──────────────────────────────
test('word count: countWords strips markdown / tokens / markers, counts prose', () => {
  assert.equal(c.countWords('hello world'), 2);
  assert.equal(c.countWords('# Heading here'), 2);              // ATX marker stripped
  assert.equal(c.countWords('**bold** _ital_ text'), 3);       // emphasis ignored
  assert.equal(c.countWords('- [ ] buy milk'), 2);             // bullet + task marker stripped
  assert.equal(c.countWords('1. first'), 1);                   // ordinal stripped
  assert.equal(c.countWords('see [[#id|the target]] now'), 4); // link label counts
  assert.equal(c.countWords('roll [[dice:r3k9x]] now'), 2);    // artifact token dropped
  assert.equal(c.countWords('a [link](http://x.com/page) b'), 3); // url dropped, text kept
  assert.equal(c.countWords('foo [^1] bar'), 2);               // footnote ref dropped
  assert.equal(c.countWords(''), 0);
  assert.equal(c.countWords(null), 0);
});

test('word count: subtreeWords scopes — subtree / self / children', () => {
  const root = c.mkNode('alpha beta');                         // self = 2
  const a = c.mkNode('one two three');                         // 3
  const b = c.mkNode('four five');                             // 2
  const gc = c.mkNode('deep deeper deepest');                  // 3 (a grandchild under a)
  a.children = [gc];
  root.children = [a, b];
  assert.equal(c.subtreeWords(root, 'self'), 2);
  assert.equal(c.subtreeWords(root, 'children'), 5);           // a(3) + b(2): not self, not the grandchild
  assert.equal(c.subtreeWords(root, 'subtree'), 10);           // 2 + 3 + 2 + 3
  assert.equal(c.subtreeWords(null, 'subtree'), 0);
});

test('word count: a per-point note counts as prose', () => {
  const n = c.mkNode('title words here');                      // 3
  n.note = 'a note with five words';                            // 5
  assert.equal(c.subtreeWords(n, 'self'), 8);
});

test('word count: expandAggExpr substitutes words(scope); reading-time idiom; unknown scope literal', () => {
  const root = c.mkNode('alpha beta');                         // self 2
  root.children = [c.mkNode('one two three')];                 // 3
  assert.equal(c.expandAggExpr('words(subtree)', root), '(5)');
  assert.equal(c.expandAggExpr('words(self)', root), '(2)');
  assert.equal(c.expandAggExpr('words(children)', root), '(3)');
  assert.equal(c.evalMath(c.expandAggExpr('words(subtree) / 5', root), {}), 1); // {= words(subtree)/200} reading-time idiom
  assert.equal(c.expandAggExpr('words(foo)', root), 'words(foo)');              // unknown scope → left literal (→ #ERR)
  assert.equal(c.expandAggExpr('words(subtree)', null), '(0)');                 // node-less validation → 0
});

test('word count: cores + front door wired (src pins)', () => {
  assert.ok(_src.includes('function countWords'), 'countWords core missing');
  assert.ok(_src.includes('function subtreeWords'), 'subtreeWords core missing');
  assert.ok(_src.includes('subtreeWords(node, scope)'), 'expandAggExpr words branch missing');
  assert.ok(_src.includes("syn:'{= words(subtree)}'"), 'GUIDE words front-door example missing (P2/P5-4)');
});

test('subtree aggregation: render + export + front-door wiring (src pins)', () => {
  assert.ok(_src.includes('expandAggExpr(m.expr, cookieNode)'), 'renderMathPill live-aggregation wiring missing');
  assert.ok(_src.includes('expandAggExpr(m.expr, node)'), 'flattenArtifacts export aggregation wiring missing');
  assert.ok(_src.includes("id:'rollups'") && _src.includes("syn:'{= sum(cost)}'"), 'GUIDE rollups entry or sum example missing');
  assert.ok(_src.includes('sum|avg|count|min|max'), 'expandAggExpr min/max regex extension missing');
  assert.ok(_src.includes('sum/avg/count/min/max(prop)'), 'math dialog hint missing min/max aggregation');
});

// ── outline constraints / lint (F2) ─────────────────────────────────────────
// A reserved `check` property carries an evalMath boolean over the point + its
// direct children (B1 aggregation) + the point's own numeric props. evalCheck →
// pass/fail/error/null; is:failing surfaces every violation. Zero new syntax.
const mkCheckNode = (checkExpr, ownProps = {}, childCosts = []) => {
  const p = c.mkNode('Project');
  for (const [k, v] of Object.entries(ownProps)) p.props.push({ key: k, val: String(v) });
  if (checkExpr != null) p.props.push({ key: 'check', val: checkExpr });
  for (const cost of childCosts) {
    const ch = c.mkNode('item');
    if (cost != null) ch.props.push({ key: 'cost', val: String(cost) });
    p.children.push(ch);
  }
  return p;
};

test('evalCheck: child-aggregation budget assertion passes / fails', () => {
  assert.equal(c.evalCheck(mkCheckNode('sum(cost) <= budget', { budget: 100 }, [30, 50]), {}), 'pass'); // 80 ≤ 100
  assert.equal(c.evalCheck(mkCheckNode('sum(cost) <= budget', { budget: 100 }, [30, 80]), {}), 'fail'); // 110 ≤ 100
  assert.equal(c.evalCheck(mkCheckNode('sum(weight) == 100', {}, []), {}), 'fail'); // 0 == 100 → fail (no children)
});

test('evalCheck: count / avg aggregations and own-prop assertions', () => {
  assert.equal(c.evalCheck(mkCheckNode('count(cost) >= 3', {}, [1, 2, 3]), {}), 'pass');
  assert.equal(c.evalCheck(mkCheckNode('count(cost) >= 3', {}, [1, 2]), {}), 'fail');
  assert.equal(c.evalCheck(mkCheckNode('avg(cost) <= 10', {}, [5, 15]), {}), 'pass');   // avg 10
  assert.equal(c.evalCheck(mkCheckNode('hours <= 8', { hours: 6 }), {}), 'pass');       // own prop
  assert.equal(c.evalCheck(mkCheckNode('hours <= 8', { hours: 9 }), {}), 'fail');
});

test('evalCheck: null when no check, error when malformed or unresolvable', () => {
  assert.equal(c.evalCheck(c.mkNode('plain'), {}), null);                                // no check property
  assert.equal(c.evalCheck(mkCheckNode('', {}), {}), null);                              // empty value → no check
  assert.equal(c.evalCheck(mkCheckNode('sum(cost) <= ', { budget: 1 }, [1]), {}), 'error'); // malformed expr
  assert.equal(c.evalCheck(mkCheckNode('sum(cost) <= budget', {}, [1]), {}), 'error');   // budget undefined → error, not crash
  assert.equal(c.evalCheck(mkCheckNode('sum(cost) <= budget', { budget: 'lots' }, [1]), {}), 'error'); // non-numeric → error
  // a check with NO comparison operator is not a true/false test → error, never a
  // truthy 'pass' (the silent wrong-success footgun: `5 + 5` must not report green)
  assert.equal(c.evalCheck(mkCheckNode('5 + 5', {}), {}), 'error');
  assert.equal(c.evalCheck(mkCheckNode('sqrt(16)', {}), {}), 'error');
  assert.equal(c.evalCheck(mkCheckNode('sum(cost)', {}, [1, 2]), {}), 'error'); // a bare rollup, no assertion
  // real comparisons still evaluate normally
  assert.equal(c.evalCheck(mkCheckNode('3 < 5', {}), {}), 'pass');
  assert.equal(c.evalCheck(mkCheckNode('3 > 5', {}), {}), 'fail');
});

test('evalCheck: own props win over doc vars; evalMath constants still win over both', () => {
  // own budget=50 shadows the passed-in doc var budget=100
  assert.equal(c.evalCheck(mkCheckNode('budget == 50', { budget: 50 }), { budget: 100 }), 'pass');
  // a doc var with no own-prop shadow resolves from `vars`
  assert.equal(c.evalCheck(mkCheckNode('rate == 7', {}), { rate: 7 }), 'pass');
});

test('nodePropVars: numeric own props only — skips dates, the check key, and non-numbers', () => {
  const n = c.mkNode('x');
  n.props.push({ key: 'budget', val: '100' }, { key: 'hours', val: '8' },
    { key: 'name', val: 'abc' }, { key: 'due', val: '2026-01-01' },
    { key: 'start', val: '2026-01-01' }, { key: 'check', val: 'hours<=8' });
  assert.deepEqual(host(c.nodePropVars(n)), { budget: 100, hours: 8 });
});

// ─── point timestamps (#467) — nowStamp / parseStamp / stampEdit ────────────────
test('nowStamp: a local ISO datetime to the minute', () => {
  // a fixed local date → deterministic string (constructed with local components)
  const d = new Date(2026, 6, 10, 14, 32, 59); // Jul 10 2026, 14:32:59 local
  assert.equal(c.nowStamp(d), '2026-07-10T14:32', 'YYYY-MM-DDTHH:MM, seconds dropped');
  const d2 = new Date(2026, 0, 5, 9, 5, 0);
  assert.equal(c.nowStamp(d2), '2026-01-05T09:05', 'month/day/hour/minute all zero-padded');
});
test('parseStamp: parses a stamp to epoch-ms, null on absent/garbage (never 0)', () => {
  assert.equal(c.parseStamp(''), null, 'empty → unknown, not 0');
  assert.equal(c.parseStamp(null), null);
  assert.equal(c.parseStamp('not a date'), null);
  assert.equal(typeof c.parseStamp('2026-07-10T14:32'), 'number');
  assert.ok(c.parseStamp('2026-07-10T14:32') > 0);
});
test('stampEdit: sets created once, always (re)sets edited', () => {
  const n = c.mkNode('hello');
  c.stampEdit(n, '2026-07-10T09:00');
  const created = n.props.find(p => p.key === 'created')?.val;
  assert.equal(created, '2026-07-10T09:00', 'created set on first stamp');
  assert.equal(n.props.find(p => p.key === 'edited')?.val, '2026-07-10T09:00', 'edited set');
  // a later edit: created stays, edited advances
  c.stampEdit(n, '2026-07-10T15:30');
  assert.equal(n.props.find(p => p.key === 'created')?.val, '2026-07-10T09:00', 'created is NOT overwritten');
  assert.equal(n.props.find(p => p.key === 'edited')?.val, '2026-07-10T15:30', 'edited advances to the new time');
  // exactly one of each key (setDateProp replaces, never duplicates)
  assert.equal(n.props.filter(p => p.key === 'edited').length, 1, 'a single edited prop, replaced not appended');
});
test('timestampOf: reads a point stamp to epoch-ms or null', () => {
  const n = c.mkNode('x');
  c.stampEdit(n, '2026-07-10T09:00');
  assert.equal(c.timestampOf(n, 'edited'), c.parseStamp('2026-07-10T09:00'));
  assert.equal(c.timestampOf(c.mkNode('bare'), 'edited'), null, 'no stamp → null (unknown)');
});
test('timestamps are reserved: not variables, not typeable via {prop}', () => {
  const n = c.mkNode('x');
  n.props.push({ key: 'created', val: '2026-07-10T09:00' }, { key: 'edited', val: '2026-07-10T15:30' }, { key: 'cost', val: '5' });
  // created/edited never become math variables (only cost does)
  assert.deepEqual(host(c.nodePropVars(n)), { cost: 5 });
  // a typed {prop created: …} is refused (stays literal) so a user can't forge a timestamp
  assert.equal(c.propDeclParts('created: 2026-01-01'), null, '{prop created:…} is reserved, returns null');
  assert.equal(c.propDeclParts('edited: whenever'), null, '{prop edited:…} is reserved, returns null');
});

// ─── ancestor-property inheritance (#461) — resolveNodeScope ────────────────────
const propNode = (title, props = {}) => {
  const n = c.mkNode(title);
  for (const [k, v] of Object.entries(props)) n.props.push({ key: k, val: String(v) });
  return n;
};
test('resolveNodeScope: own props win, then nearest ancestor, then farther, then doc vars', () => {
  // nodePropVars lowercases keys (evalMath ident lookup is case-insensitive), so scope keys are lc
  const doc = { str: 1, dex: 1, luck: 1 };
  const grandparent = propNode('Party',     { STR: 5, LUCK: 9 });
  const parent      = propNode('Character',  { STR: 14 });          // nearer than grandparent
  const node        = propNode('Scene',      { DEX: 20 });          // own
  // ancestors are nearest-first: [parent, grandparent]
  const scope = host(c.resolveNodeScope(node, [parent, grandparent], doc));
  assert.equal(scope.dex,  20, 'own prop wins');
  assert.equal(scope.str,  14, 'nearest ancestor (Character) beats the farther one (Party)');
  assert.equal(scope.luck, 9,  'a prop only a farther ancestor has still inherits');
  // the real user path: a {= STR + 2} pill resolves case-insensitively against the inherited str:14
  assert.equal(c.evalMath('STR + 2', scope), 16, '{= STR + 2} on a scene under STR:14 reads 16');
});
test('resolveNodeScope: empty ancestors == own-node-only scope (#460 unchanged)', () => {
  const doc = { budget: 100 };
  const node = propNode('P', { budget: 50, hours: 6 });
  const own = host(c.resolveNodeScope(node, [], doc));
  assert.deepEqual(own, { budget: 50, hours: 6 }, 'no ancestors → doc vars then own props, exactly #460');
  // a missing/undefined ancestors list is treated as empty, never throws
  assert.deepEqual(host(c.resolveNodeScope(node, undefined, doc)), { budget: 50, hours: 6 });
});
test('resolveNodeScope: only numeric props inherit (nodePropVars filter applies up the chain)', () => {
  const parent = propNode('Character', { STR: 14, name: 'Bram', due: '2026-01-01' });
  const node = propNode('Scene');
  const scope = host(c.resolveNodeScope(node, [parent], {}));
  assert.deepEqual(scope, { str: 14 }, 'text + date ancestor props do not become variables (keys lowercased)');
});
test('evalCheck: a check inherits ancestor props (parity with the math pill, #461)', () => {
  // a scene under a STR:14 character; the check references STR with no own STR
  const parent = propNode('Character', { STR: 14 });
  const scene = mkCheckNode('STR >= 10', {});
  assert.equal(c.evalCheck(scene, {}, [parent]), 'pass', 'STR resolves from the ancestor');
  assert.equal(c.evalCheck(scene, {}, []), 'error', 'without ancestors STR is unresolved (own-node #460)');
});

// The two DOM-render scope sites (math pill + check chip) must feed resolveNodeScope the
// ancestor chain; the pure query-base / search sites deliberately stay own-node (boundary).
test('ancestor inheritance is wired at the math pill + check chip, own-node at the query base (#461)', () => {
  // renderMathPill builds its scope through resolveNodeScope with ancestorsOf(cookieNode)
  assert.ok(/resolveNodeScope\(cookieNode, ancestorsOf\(cookieNode\), renderVarMap\)/.test(_src),
    'math pill scope inherits via resolveNodeScope + ancestorsOf');
  // buildCheckChip passes ancestorsOf(node) to evalCheck
  assert.ok(/evalCheck\(node, globalVarMap, ancestorsOf\(node\)\)/.test(_src),
    'check chip verdict inherits ancestor props');
  // the query-base row engine stays own-node (documented boundary): still the bare merge
  assert.ok(/const scope = Object\.assign\(Object\.create\(null\), vars, nodePropVars\(n\)\)/.test(_src),
    'query base = expr cell stays own-node in v1 (rows come from a search, not a subtree)');
  // ancestorsOf stops at root (config-only) and is nearest-first
  const anc = fnBody(_src, 'ancestorsOf');
  assert.ok(/while \(p && p !== root\)/.test(anc), 'ancestorsOf walks up, excluding the root config node');
  // PROMOTION parity (#461): a {= } shorthand must validate against the inherited scope, or a
  // pill resolving only via an own/ancestor prop stays raw text instead of promoting.
  const pb = fnBody(_src, 'promoteBraceBody');
  assert.ok(/makeMathResult\(body\.slice\(1\)\.trim\(\), resolveNodeScope\(node, ancestorsOf\(node\), collectVars\(\)\)\)/.test(pb),
    'promoteBraceBody validates {= } against the node inherited scope, so an ancestor-prop pill promotes');
  // makeMathResult accepts a scope to validate against (default = doc vars for pure/test callers)
  const mm = fnBody(_src, 'makeMathResult');
  assert.ok(/scope \|\| collectVars\(\)/.test(mm), 'makeMathResult validates against the passed scope, falling back to doc vars');
});

test('makeMathResult: an ancestor-prop expr promotes when given the inherited scope (#461)', () => {
  // without STR in scope → no pill (stays raw); WITH an inherited str:14 → a valid math record
  assert.equal(c.makeMathResult('STR + 2', {}), null, 'STR unknown → not promotable');
  const rec = c.makeMathResult('STR + 2', { str: 14 });
  assert.ok(rec && rec.expr === 'STR + 2', 'inherited str:14 makes {= STR + 2} a valid pill at creation');
});

test('checkExprOf: returns the trimmed assertion or null', () => {
  assert.equal(c.checkExprOf(mkCheckNode('sum(cost) <= budget', { budget: 1 })), 'sum(cost) <= budget');
  assert.equal(c.checkExprOf(c.mkNode('plain')), null);
});

test('parseSearchQuery: is:failing joins the is: family (and negates)', () => {
  assert.deepEqual(host(c.parseSearchQuery('is:failing')), [{ neg: false, kind: 'is', value: 'failing' }]);
  assert.deepEqual(host(c.parseSearchQuery('-is:failing')), [{ neg: true, kind: 'is', value: 'failing' }]);
});

test('termMatchesNode: is:failing matches a failing OR errored check, not a passing/absent one', () => {
  const term = { neg: false, kind: 'is', value: 'failing' };
  const failing = mkCheckNode('sum(cost) <= budget', { budget: 10 }, [50]); // 50 > 10
  const passing = mkCheckNode('sum(cost) <= budget', { budget: 100 }, [5]);
  const errored = mkCheckNode('sum(cost) <= ', { budget: 1 }, [1]);
  assert.equal(c.termMatchesNode(term, failing, [], {}), true);
  assert.equal(c.termMatchesNode(term, errored, [], {}), true);   // can't-evaluate IS a violation to surface (P4)
  assert.equal(c.termMatchesNode(term, passing, [], {}), false);
  assert.equal(c.termMatchesNode(term, c.mkNode('plain'), [], {}), false);
});

test('outline constraints: front-door + render + search wiring (src pins)', () => {
  assert.ok(_src.includes("id:'check'"), '/check slash verb missing from BLOCK_CMDS');
  assert.ok(_src.includes('function openCheckDialog'), 'openCheckDialog missing');
  assert.ok(_src.includes('function buildCheckChip'), 'check chip builder missing');
  assert.ok(_src.includes('prop-check-fail'), 'check chip fail CSS class missing');
  assert.ok(/is:\(done\|todo\|note\|failing\|passing\|/.test(_src), 'is:failing/is:passing missing from parseSearchQuery');
  assert.ok(_src.includes("openCheckDialog(chip.dataset.propsId)"), 'check chip not routed in openPropChip');
});

// ── due dates ─────────────────────────────────────────────────────────────────

test('parseDueDate — ISO date parses to epoch day', () => {
  // 2026-06-13 = days since 1970-01-01
  const ep = c.parseDueDate('2026-06-13');
  assert.equal(typeof ep, 'number');
  assert.ok(Number.isInteger(ep));
  // Verify round-trip via formatEpochDays
  assert.equal(c.formatEpochDays(ep), '2026-06-13');
});

test('parseDueDate — relative forms', () => {
  const today = c.dueDateToday();
  assert.equal(c.parseDueDate('today'),     today);
  assert.equal(c.parseDueDate('tomorrow'),  today + 1);
  assert.equal(c.parseDueDate('today+7'),   today + 7);
  assert.equal(c.parseDueDate('today-1'),   today - 1);
  assert.equal(c.parseDueDate('today+0'),   today);
});

test('parseDueDate — invalid values return null', () => {
  assert.equal(c.parseDueDate(null),         null);
  assert.equal(c.parseDueDate(''),           null);
  assert.equal(c.parseDueDate('foo'),        null);
  assert.equal(c.parseDueDate('26-06-13'),   null); // not 4-digit year
  assert.equal(c.parseDueDate('tomorrow+1'), null); // unsupported form
});

test('parseDueDate — impossible calendar dates are rejected (no overflow-normalize)', () => {
  // Date.UTC silently rolls these over; round-trip validation must catch them.
  assert.equal(c.parseDueDate('2026-02-30'), null); // Feb has 28/29 days
  assert.equal(c.parseDueDate('2026-02-29'), null); // 2026 is not a leap year
  assert.equal(c.parseDueDate('2026-04-31'), null); // April has 30 days
  assert.equal(c.parseDueDate('2026-13-01'), null); // month 13
  assert.equal(c.parseDueDate('2026-00-15'), null); // month 0
  assert.equal(c.parseDueDate('2026-07-32'), null); // day 32
  assert.equal(c.parseDueDate('2026-07-00'), null); // day 0
  // sanity: real dates still parse, incl. a genuine leap day
  assert.ok(c.parseDueDate('2026-02-28') !== null);
  assert.ok(c.parseDueDate('2024-02-29') !== null); // 2024 IS a leap year
  assert.ok(c.parseDueDate('2026-04-30') !== null);
  assert.ok(c.parseDueDate('2026-12-31') !== null);
});

test('parseDueDate — absurd years outside the scheduling window are rejected', () => {
  assert.equal(c.parseDueDate('3331-07-15'), null); // year 3331 is a typo, not a plan
  assert.equal(c.parseDueDate('3334-07-15'), null);
  assert.equal(c.parseDueDate('0349-07-01'), null); // year 349
  assert.equal(c.parseDueDate('1899-12-31'), null); // just below the floor
  assert.equal(c.parseDueDate('2201-01-01'), null); // just above the ceiling
  // boundaries are inclusive
  assert.ok(c.parseDueDate('1900-01-01') !== null);
  assert.ok(c.parseDueDate('2200-12-31') !== null);
});

// ─── recurring tasks (#462) — parseRepeat + nextOccurrence ──────────────────────
test('parseRepeat — interval forms', () => {
  assert.deepEqual(host(c.parseRepeat('every day')),      { kind: 'interval', unit: 'day',   n: 1 });
  assert.deepEqual(host(c.parseRepeat('every 3 days')),   { kind: 'interval', unit: 'day',   n: 3 });
  assert.deepEqual(host(c.parseRepeat('every week')),     { kind: 'interval', unit: 'week',  n: 1 });
  assert.deepEqual(host(c.parseRepeat('every 2 weeks')),  { kind: 'interval', unit: 'week',  n: 2 });
  assert.deepEqual(host(c.parseRepeat('every month')),    { kind: 'interval', unit: 'month', n: 1 });
  assert.deepEqual(host(c.parseRepeat('every year')),     { kind: 'interval', unit: 'year',  n: 1 });
  // bare aliases
  assert.deepEqual(host(c.parseRepeat('daily')),   { kind: 'interval', unit: 'day',   n: 1 });
  assert.deepEqual(host(c.parseRepeat('weekly')),  { kind: 'interval', unit: 'week',  n: 1 });
  assert.deepEqual(host(c.parseRepeat('monthly')), { kind: 'interval', unit: 'month', n: 1 });
  assert.deepEqual(host(c.parseRepeat('yearly')),  { kind: 'interval', unit: 'year',  n: 1 });
  // case / whitespace tolerant
  assert.deepEqual(host(c.parseRepeat('  EVERY   2   Weeks ')), { kind: 'interval', unit: 'week', n: 2 });
});

test('parseRepeat — weekday and monthday forms', () => {
  assert.deepEqual(host(c.parseRepeat('every Monday')),    { kind: 'weekday', days: [1] });
  assert.deepEqual(host(c.parseRepeat('every Tue,Fri')),   { kind: 'weekday', days: [2, 5] });
  assert.deepEqual(host(c.parseRepeat('every mon, wed, fri')), { kind: 'weekday', days: [1, 3, 5] });
  // dedupe + sort
  assert.deepEqual(host(c.parseRepeat('every fri,mon,fri')), { kind: 'weekday', days: [1, 5] });
  // month-day, both spellings, ordinal suffix optional
  assert.deepEqual(host(c.parseRepeat('monthly on the 1st')),      { kind: 'monthday', day: 1 });
  assert.deepEqual(host(c.parseRepeat('every month on the 15th')), { kind: 'monthday', day: 15 });
  assert.deepEqual(host(c.parseRepeat('monthly on the 31')),       { kind: 'monthday', day: 31 });
});

test('parseRepeat — invalid values return null (null-on-miss, like parseDueDate)', () => {
  assert.equal(c.parseRepeat(null),            null);
  assert.equal(c.parseRepeat(''),              null);
  assert.equal(c.parseRepeat('sometimes'),     null);
  assert.equal(c.parseRepeat('every blorp'),   null);
  assert.equal(c.parseRepeat('every 0 days'),  null); // n must be ≥ 1
  assert.equal(c.parseRepeat('every 400 days'),null); // n capped at 366
  assert.equal(c.parseRepeat('monthly on the 32nd'), null); // day out of range
  assert.equal(c.parseRepeat('monthly on the 0'),    null);
  assert.equal(c.parseRepeat('every Mon,Blip'),      null); // one bad token voids the list
});

test('nextOccurrence — interval anchors off the OLD date, fixed cadence', () => {
  const past = 1;              // an epoch-day far in the past so "today" never interferes
  const today = 20000;
  // weekly: Mon Jul 6 (20640) → Mon Jul 13 (20647), regardless of completion date
  assert.equal(c.nextOccurrence({ kind: 'interval', unit: 'week', n: 1 }, 20640, 20000), 20647);
  // every 3 days
  assert.equal(c.nextOccurrence({ kind: 'interval', unit: 'day', n: 3 }, 20640, 20000), 20643);
  // monthly clamps: Jan 31 (20484) + 1 month → Feb 28 (not Mar 3)
  assert.equal(c.nextOccurrence({ kind: 'interval', unit: 'month', n: 1 }, 20484, 20000),
    Math.floor(Date.UTC(2026, 1, 28) / 86400000));
  // yearly = 12 months: 2026-01-31 → 2027-01-31
  assert.equal(c.nextOccurrence({ kind: 'interval', unit: 'year', n: 1 }, 20484, 20000),
    Math.floor(Date.UTC(2027, 0, 31) / 86400000));
});

test('nextOccurrence — weekday snaps to the next matching day', () => {
  // from Mon Jul 6 (20640): "every Monday" → next Monday = Jul 13 (20647), never same day
  assert.equal(c.nextOccurrence({ kind: 'weekday', days: [1] }, 20640, 20000), 20647);
  // from Mon Jul 6: "every Tue,Fri" → Tue Jul 7 (20641)
  assert.equal(c.nextOccurrence({ kind: 'weekday', days: [2, 5] }, 20640, 20000), 20641);
});

test('nextOccurrence — monthday moves to next month, clamped', () => {
  // from Jan 15 (20468), "monthly on the 15th" → Feb 15 (20499)
  assert.equal(c.nextOccurrence({ kind: 'monthday', day: 15 }, 20468, 20000), 20499);
  // clamp: from Jan 15, "on the 31st" → Feb 28 (Feb has no 31)
  assert.equal(c.nextOccurrence({ kind: 'monthday', day: 31 }, 20468, 20000),
    Math.floor(Date.UTC(2026, 1, 28) / 86400000));
});

test('nextOccurrence — a very overdue task snaps forward past today, never to the past', () => {
  // weekly task last due Mon Jul 6 (20640), but today is Aug 10 (20675, five weeks later).
  // Advancing once lands Jul 13 — still in the past; must snap to the first Monday after today.
  const today = 20675; // Mon Aug 10 2026
  const next = c.nextOccurrence({ kind: 'interval', unit: 'week', n: 1 }, 20640, today);
  assert.ok(next > today, 'the rescheduled date is strictly in the future');
  assert.equal(next, 20682, 'first weekly slot after today'); // 20640 + 6*7 = 20682
});

test('nextOccurrence — null on missing descriptor or date', () => {
  assert.equal(c.nextOccurrence(null, 20640), null);
  assert.equal(c.nextOccurrence({ kind: 'interval', unit: 'week', n: 1 }, null), null);
});

test('describeRepeat — readable phrase for each descriptor', () => {
  assert.equal(c.describeRepeat({ kind: 'interval', unit: 'week', n: 1 }), 'every week');
  assert.equal(c.describeRepeat({ kind: 'interval', unit: 'day', n: 3 }),  'every 3 days');
  assert.equal(c.describeRepeat({ kind: 'weekday', days: [1] }),           'every Monday');
  assert.equal(c.describeRepeat({ kind: 'weekday', days: [2, 5] }),        'every Tuesday, Friday');
  assert.equal(c.describeRepeat({ kind: 'monthday', day: 1 }),             'monthly on the 1st');
  assert.equal(c.describeRepeat({ kind: 'monthday', day: 22 }),            'monthly on the 22nd');
  assert.equal(c.describeRepeat({ kind: 'monthday', day: 13 }),            'monthly on the 13th'); // teen → th
  // round-trips: a phrase parseRepeat accepts describes back to a phrase parseRepeat accepts
  for (const p of ['every week', 'every 3 days', 'every Monday', 'monthly on the 1st']) {
    assert.ok(c.parseRepeat(c.describeRepeat(c.parseRepeat(p))) !== null, `round-trip: ${p}`);
  }
});

test('ordinalSuffix — st/nd/rd/th incl. the 11-13 teens', () => {
  assert.equal(c.ordinalSuffix(1),  'st');
  assert.equal(c.ordinalSuffix(2),  'nd');
  assert.equal(c.ordinalSuffix(3),  'rd');
  assert.equal(c.ordinalSuffix(4),  'th');
  assert.equal(c.ordinalSuffix(11), 'th');
  assert.equal(c.ordinalSuffix(12), 'th');
  assert.equal(c.ordinalSuffix(13), 'th');
  assert.equal(c.ordinalSuffix(21), 'st');
  assert.equal(c.ordinalSuffix(31), 'st');
});

// The roll-forward wiring is DOM/module-global coupled (reads node.props, mutates text,
// flashes), so pin it at the source: rollForwardRepeat must anchor off the old date, preserve
// the span, re-open the task, and announce — never a silent flip.
test('rollForwardRepeat — wiring (#462)', () => {
  const fn = fnBody(_src, 'rollForwardRepeat');
  assert.ok(fn, 'rollForwardRepeat must exist');
  assert.ok(/if \(wasDone \|\| !node \|\| !node\.checked\) return false/.test(fn), 'only fires on a fresh not-done→done flip');
  assert.ok(/nextOccurrence\(desc, base\)/.test(fn), 'advances via nextOccurrence off the old date (fixed cadence)');
  assert.ok(/const delta = nextDue - base/.test(fn) && /startEp \+ delta/.test(fn), 'preserves the start→due span (both shift by the same delta)');
  assert.ok(/reopenTaskText\(node\)/.test(fn), 're-opens the task text so it recurs, not a done copy');
  assert.ok(/flashHint\(/.test(fn), 'visible + announced (flashHint reaches #a11y-live), never a silent flip');
  // it is actually called at the two done-transition chokepoints
  assert.ok(/rollForwardRepeat\(node, wasDone\)/.test(fnBody(_src, 'toggleTaskInNode')), 'wired into the checkbox path');
  // repeat is a reserved key everywhere the other reserved keys are guarded
  assert.ok(/k === REPEAT_KEY/.test(_src), 'repeat is hidden from the generic Properties editor + prop-vars');
});

test('formatDueDate — state classification', () => {
  const today = c.dueDateToday();
  assert.equal(c.formatDueDate(today).state,     'today');
  assert.equal(c.formatDueDate(today).label,     'Today');
  assert.equal(c.formatDueDate(today + 1).state, 'soon');
  assert.equal(c.formatDueDate(today + 1).label, 'Tomorrow');
  assert.equal(c.formatDueDate(today - 1).state, 'overdue');
  assert.equal(c.formatDueDate(today - 1).label, 'Yesterday');
  assert.equal(c.formatDueDate(today - 5).state, 'overdue');
  assert.ok(c.formatDueDate(today - 5).label.includes('overdue'));
  assert.equal(c.formatDueDate(today + 3).state, 'soon');
  assert.equal(c.formatDueDate(today + 10).state,'future');
});

test('formatDueDate — iso is always YYYY-MM-DD', () => {
  const ep = c.parseDueDate('2026-06-15');
  const { iso } = c.formatDueDate(ep);
  assert.match(iso, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(iso, '2026-06-15');
});

test('collectDueDates — returns sorted dated nodes', () => {
  const r = c.mkRoot();
  const a = c.mkNode('alpha'); a.props = [{ key: 'due', val: '2026-08-01' }];
  const b = c.mkNode('beta');  b.props = [{ key: 'due', val: '2026-06-15' }];
  const x = c.mkNode('no date'); // no due prop
  r.children.push(a, b, x);
  const items = host(c.collectDueDates(r));
  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'beta');   // earlier date first
  assert.equal(items[0].iso,   '2026-06-15');
  assert.equal(items[1].title, 'alpha');
  assert.equal(items[1].iso,   '2026-08-01');
});

test('collectDueDates — unparseable due prop ignored', () => {
  const r = c.mkRoot();
  const n = c.mkNode('bad date'); n.props = [{ key: 'due', val: 'not-a-date' }];
  r.children.push(n);
  assert.equal(c.collectDueDates(r).length, 0);
});

test('collectDueDates — start date: started vs not-yet-started + range', () => {
  const r = c.mkRoot();
  // started yesterday, due in a week → started=true, runningDays=1
  const running = c.mkNode('running task');
  running.props = [{ key: 'start', val: 'today-1' }, { key: 'due', val: 'today+7' }];
  // starts next week (future start), due later → not started, has a due
  const upcoming = c.mkNode('upcoming task');
  upcoming.props = [{ key: 'start', val: 'today+7' }, { key: 'due', val: 'today+14' }];
  // start-only, started today → started=true, no due
  const startedOnly = c.mkNode('started only');
  startedOnly.props = [{ key: 'start', val: 'today' }];
  r.children.push(running, upcoming, startedOnly);

  const items = host(c.collectDueDates(r));
  const by = title => items.find(i => i.title === title);

  assert.equal(by('running task').started, true);
  assert.equal(by('running task').runningDays, 1);
  assert.ok(by('running task').due !== null && by('running task').start !== null);

  assert.equal(by('upcoming task').started, false);   // future start
  assert.ok(by('upcoming task').due !== null);

  assert.equal(by('started only').started, true);
  assert.equal(by('started only').runningDays, 0);    // started today
  assert.equal(by('started only').due, null);
});

test('collectDueDates — done flag is derived from the node text', () => {
  const r = c.mkRoot();
  const open = c.mkNode('- [ ] open');   open.props = [{ key: 'due', val: 'today' }];
  const done = c.mkNode('- [x] finished'); done.props = [{ key: 'due', val: 'today' }];
  r.children.push(open, done);
  const items = host(c.collectDueDates(r));
  assert.equal(items.find(i => i.title === 'open').done,     false);
  assert.equal(items.find(i => i.title === 'finished').done, true);
});

test('collectDueDates — carries structural held-ness for a dated point (UXP-162)', () => {
  const SEQ = [
    { key: 'default', name: 'To-do', states: ['TODO', 'NEXT', 'WAITING', 'DONE'], heldFrom: 2, doneFrom: 3 },
    { key: 'flow', name: 'Flow', states: ['DOING', 'BLOCKED', 'SHIPPED'], heldFrom: 1, doneFrom: 2 },
  ];
  const r = c.mkRoot();
  const blocked = c.mkNode('#BLOCKED waiting on API'); blocked.props = [{ key: 'due', val: 'today' }];
  const doing   = c.mkNode('#DOING build it');         doing.props   = [{ key: 'due', val: 'today' }];
  const waiting = c.mkNode('#WAITING built-in held');  waiting.props = [{ key: 'due', val: 'today' }];
  r.children.push(blocked, doing, waiting);
  const items = host(c.collectDueDates(r, SEQ));
  assert.equal(items.find(i => i.title.includes('waiting on API')).waiting, true);   // custom held
  assert.equal(items.find(i => i.title.includes('build it')).waiting, false);        // active
  assert.equal(items.find(i => i.title.includes('built-in')).waiting, true);         // built-in WAITING
});

test('parseSearchQuery / termMatchesNode — start: operator mirrors due:', () => {
  const q = host(c.parseSearchQuery('start:today'));
  assert.equal(q[0].kind, 'start');
  assert.equal(q[0].op, '=');
  assert.equal(q[0].epochDay, c.dueDateToday());

  const n = c.mkNode('task');
  n.props = [{ key: 'start', val: '2026-06-15' }];
  const ep = c.parseDueDate('2026-06-15');
  assert.ok( c.termMatchesNode({ kind: 'start', op: '=', epochDay: ep }, n, []));
  assert.ok(!c.termMatchesNode({ kind: 'start', op: '=', epochDay: ep + 1 }, n, []));
  // a due: term must NOT match a node that only carries a start prop
  assert.ok(!c.termMatchesNode({ kind: 'due', op: '=', epochDay: ep }, n, []));
});

test('calendarMonthGrid — 42 contiguous days, Sunday-aligned, month present', () => {
  const mid = c.parseDueDate('2026-06-15');         // June 2026
  const grid = c.calendarMonthGrid(mid);
  assert.equal(grid.length, 42);
  // contiguous: each cell is the previous + 1
  for (let i = 1; i < grid.length; i++) assert.equal(grid[i], grid[i - 1] + 1);
  // starts on a Sunday (getUTCDay 0)
  assert.equal(new Date(grid[0] * 86400000).getUTCDay(), 0);
  // the 1st of June sits at index === its day-of-week
  const first = c.parseDueDate('2026-06-01');
  assert.equal(grid.indexOf(first), new Date(first * 86400000).getUTCDay());
  // every day of June is in the grid
  for (let d = 1; d <= 30; d++) {
    assert.ok(grid.includes(c.parseDueDate('2026-06-' + String(d).padStart(2, '0'))));
  }
});

test('addMonths — clamps the day to the target month length', () => {
  const jan31 = c.parseDueDate('2026-01-31');
  // +1 month → Feb (2026 not leap) clamps to the 28th, never overflows to March
  assert.equal(c.addMonths(jan31, 1), c.parseDueDate('2026-02-28'));
  // -2 months → Nov 30 (Nov has 30 days, 31 clamps to 30)
  assert.equal(c.addMonths(jan31, -2), c.parseDueDate('2025-11-30'));
  // a safe day round-trips exactly
  assert.equal(c.addMonths(c.parseDueDate('2026-06-15'), 1), c.parseDueDate('2026-07-15'));
});

test('agendaGantt — bar/ongoing layout, axis range includes today, day offsets', () => {
  const today = c.parseDueDate('2026-06-14');
  const items = [
    // a full range start→due
    { id: 'a', start: c.parseDueDate('2026-06-12'), due: c.parseDueDate('2026-06-18'), title: 'A' },
    // due only → a 1-day bar at the deadline
    { id: 'b', start: null, due: c.parseDueDate('2026-06-20'), title: 'B' },
    // start only → ongoing bar from start to today
    { id: 'd', start: c.parseDueDate('2026-06-10'), due: null, title: 'D' },
    // undated → skipped
    { id: 'x', start: null, due: null, title: 'X' },
  ];
  const g = host(c.agendaGantt(items, today));
  // range spans earliest (Jun 10) to latest (Jun 20), padded one day each side
  assert.equal(g.rangeStart, c.parseDueDate('2026-06-09'));
  assert.equal(g.rangeEnd,   c.parseDueDate('2026-06-21'));
  assert.equal(g.rangeDays,  g.rangeEnd - g.rangeStart + 1);
  // undated dropped; rows sorted by start day (D@10, A@12, B@20)
  assert.deepEqual(g.rows.map(r => r.id), ['d', 'a', 'b']);
  const byId = Object.fromEntries(g.rows.map(r => [r.id, r]));
  // A: range bar, start Jun 12 → due Jun 18 = 7 days, offset from Jun 9 = 3
  assert.equal(byId.a.kind, 'bar');
  assert.equal(byId.a.offsetDays, 3);
  assert.equal(byId.a.spanDays, 7);
  // B: due-only → 1-day bar at Jun 20 (offset 11)
  assert.equal(byId.b.kind, 'bar');
  assert.equal(byId.b.spanDays, 1);
  assert.equal(byId.b.offsetDays, 11);
  // D: ongoing → Jun 10 to today (Jun 14) = 5 days, offset 1
  assert.equal(byId.d.kind, 'ongoing');
  assert.equal(byId.d.offsetDays, 1);
  assert.equal(byId.d.spanDays, 5);
  // empty / null input is safe (still a valid 1-day frame)
  assert.equal(host(c.agendaGantt([], today)).rows.length, 0);
  assert.equal(host(c.agendaGantt(null, today)).rows.length, 0);
});

test('agendaGantt — today is always inside the range even with only future items', () => {
  const today = c.parseDueDate('2026-06-14');
  const g = host(c.agendaGantt([{ id: 'f', start: null, due: c.parseDueDate('2026-08-01'), title: 'F' }], today));
  assert.ok(g.rangeStart <= today && today <= g.rangeEnd, 'today must be within the axis range');
  // a far-future deadline still anchors back to today (range starts a day before today)
  assert.equal(g.rangeStart, today - 1);
});

test('agendaGantt — a row carries the item done flag through to the renderer (B3)', () => {
  const today = c.parseDueDate('2026-06-14');
  const g = host(c.agendaGantt([
    { id: 'o', start: null, due: c.parseDueDate('2026-06-18'), title: 'Open', done: false },
    { id: 'd', start: null, due: c.parseDueDate('2026-06-20'), title: 'Done', done: true },
  ], today));
  const byId = Object.fromEntries(g.rows.map(r => [r.id, r]));
  // done must survive the layout so renderAgendaGantt can dim/strike it (.done class)
  assert.equal(byId.o.done, false);
  assert.equal(byId.d.done, true);
});

test('agendaMonthCells — 42 cells, items placed on their day, inMonth/today flags', () => {
  const today  = c.parseDueDate('2026-06-14');
  const anchor = c.parseDueDate('2026-06-01');     // June 2026
  const d10    = c.parseDueDate('2026-06-10');
  const july5  = c.parseDueDate('2026-07-05');
  const items = [
    { id: 'a', epochDay: d10 },
    { id: 'b', epochDay: d10 },                     // same day as a
    { id: 'c', epochDay: today },
    { id: 'z', epochDay: july5 },                   // next month → out-of-month trailing cell
  ];
  const cells = host(c.agendaMonthCells(items, anchor, today));
  assert.equal(cells.length, 42);
  // backbone is exactly calendarMonthGrid (Sunday-aligned 6 weeks)
  assert.deepEqual(cells.map(x => x.epochDay), host(c.calendarMonthGrid(anchor)));
  // two items share June 10's cell; it's in-month with the right day number
  const cell10 = cells.find(x => x.epochDay === d10);
  assert.deepEqual(cell10.items.map(i => i.id).sort(), ['a', 'b']);
  assert.equal(cell10.inMonth, true);
  assert.equal(cell10.dom, 10);
  // today flag
  const cellToday = cells.find(x => x.epochDay === today);
  assert.equal(cellToday.isToday, true);
  assert.deepEqual(cellToday.items.map(i => i.id), ['c']);
  // a July item lands in a trailing out-of-month cell (June 2026's grid reaches July 11)
  assert.ok(c.calendarMonthGrid(anchor).includes(july5), 'July 5 should be in June 2026 grid');
  const julyCell = cells.find(x => x.epochDay === july5);
  assert.equal(julyCell.inMonth, false);
  assert.equal(julyCell.items.length, 1);
  // empty days carry an empty array, never undefined
  assert.ok(cells.every(x => Array.isArray(x.items)));
});

test('agendaWeekCells — 7 Sunday-aligned days + an Earlier bucket for overdue/running', () => {
  const today  = c.parseDueDate('2026-06-17');     // a Wednesday
  const inWeek = c.parseDueDate('2026-06-18');     // Thu, same week
  const before = c.parseDueDate('2026-06-05');     // overdue, before the week
  const beforeDone = c.parseDueDate('2026-06-06'); // before the week but DONE → not carried
  const nextWeek = c.parseDueDate('2026-06-25');   // beyond the week → excluded
  const items = [
    { id: 'now', epochDay: today },
    { id: 'thu', epochDay: inWeek },
    { id: 'old', epochDay: before, done: false },
    { id: 'olddone', epochDay: beforeDone, done: true },
    { id: 'nxt', epochDay: nextWeek },
  ];
  const wk = host(c.agendaWeekCells(items, today, today));
  assert.equal(wk.days.length, 7, 'seven day cells');
  assert.equal(new Date(wk.start * 86400000).getUTCDay(), 0, 'week starts on Sunday');
  // today's cell carries the item and the isToday flag
  const td = wk.days.find(d => d.epochDay === today);
  assert.deepEqual(td.items.map(i => i.id), ['now']);
  assert.equal(td.isToday, true);
  // Thursday holds its item
  assert.deepEqual(wk.days.find(d => d.epochDay === inWeek).items.map(i => i.id), ['thu']);
  // the overdue-before-the-week item spills to Earlier; the DONE one does NOT; next week excluded
  assert.deepEqual(wk.earlier.map(i => i.id), ['old']);
  assert.ok(!wk.days.some(d => d.items.some(i => i.id === 'nxt')), 'next-week item excluded');
  // empty days carry an empty array
  assert.ok(wk.days.every(d => Array.isArray(d.items)));
});

test('addWeeks — steps by 7-day weeks', () => {
  const w = c.parseDueDate('2026-06-17');
  assert.equal(c.addWeeks(w, 1), w + 7);
  assert.equal(c.addWeeks(w, -2), w - 14);
});

test('agendaDayStats — counts to-do vs done and orders active-first (done sinks)', () => {
  const items = [
    { id: 'a', done: false },
    { id: 'b', done: true },
    { id: 'c', done: false },
    { id: 'd', done: true },
  ];
  const { ordered, todo, done } = c.agendaDayStats(items);
  assert.equal(todo, 2);
  assert.equal(done, 2);
  // active items keep their incoming order and come first; done items sink, order preserved
  assert.deepEqual(ordered.map(x => x.id), ['a', 'c', 'b', 'd']);
  // empty day
  const e = c.agendaDayStats([]);
  assert.deepEqual([e.todo, e.done, e.ordered.length], [0, 0, 0]);
});

// ── urgencyMark (UXP-66) — non-colour cue for overdue agenda items ───────────
test('urgencyMark — only overdue earns a marker; others return empty', () => {
  assert.equal(c.urgencyMark('overdue'), '! ');
  assert.equal(c.urgencyMark('today'), '');
  assert.equal(c.urgencyMark('soon'), '');
  assert.equal(c.urgencyMark('future'), '');
  assert.equal(c.urgencyMark('none'), '');
  assert.equal(c.urgencyMark(undefined), '');
  assert.equal(c.urgencyMark(''), '');
});

// ── agendaState / agendaLabel — a DONE dated item is not overdue in the agenda ──
test('agendaState — a done item collapses any urgency to "done"; live items keep their state', () => {
  assert.equal(c.agendaState({ done: true,  state: 'overdue' }), 'done');   // the bug: was overdue-red
  assert.equal(c.agendaState({ done: true,  state: 'today' }),   'done');
  assert.equal(c.agendaState({ done: false, state: 'overdue' }), 'overdue'); // not done → still urgent
  assert.equal(c.agendaState({ done: false, state: 'today' }),   'today');
  assert.equal(c.agendaState({ done: false, state: 'soon' }),    'soon');
  assert.equal(c.agendaState(null), 'none');
});
test('agenda Overdue-only filter is wired and reuses agendaState (excludes done) (src pins)', () => {
  // the focus filter narrows `visible` to overdue items via agendaState (so a done+past
  // item is NOT counted overdue — same rule as the chip colour and urgencyMark)
  assert.ok(_src.includes("!agendaOverdueOnly || agendaState(it) === 'overdue'"), 'visible must filter by agendaState overdue when the focus filter is on');
  assert.ok(_src.includes("mkAgToggle('Overdue', agendaOverdueOnly"), 'Overdue chip must be a filter toggle bound to agendaOverdueOnly');
  assert.ok(_src.includes('data.agendaOverdueOnly'), 'agendaOverdueOnly must round-trip through autosave');
});
test('agendaLabel — a done+overdue item reads "done", not "Nd overdue"', () => {
  assert.equal(c.agendaLabel({ done: true,  state: 'overdue', label: '3d overdue' }), 'done');
  // a done item that is NOT overdue keeps its date label (e.g. finished early)
  assert.equal(c.agendaLabel({ done: true,  state: 'soon',    label: 'Tomorrow' }),   'Tomorrow');
  // a live overdue item keeps the urgent label
  assert.equal(c.agendaLabel({ done: false, state: 'overdue', label: '3d overdue' }), '3d overdue');
});
test('agendaState — the urgencyMark and overdue class both vanish for a done item (the reported bug)', () => {
  const doneOverdue = { done: true, state: 'overdue', label: '5d overdue', due: 100 };
  assert.equal(c.agendaState(doneOverdue), 'done');           // class is not 'overdue' → no red
  assert.equal(c.urgencyMark(c.agendaState(doneOverdue)), ''); // no '!' marker either
});

test('parseSearchQuery — due:today, due:overdue, due:<date', () => {
  const today = c.dueDateToday();
  const q1 = host(c.parseSearchQuery('due:today'));
  assert.equal(q1.length, 1);
  assert.equal(q1[0].kind, 'due');
  assert.equal(q1[0].op,   '=');
  assert.equal(q1[0].epochDay, today);

  const q2 = host(c.parseSearchQuery('due:overdue'));
  assert.equal(q2[0].kind, 'due');
  assert.equal(q2[0].op,   'overdue');
  assert.ok(!('epochDay' in q2[0]));

  const q3 = host(c.parseSearchQuery('due:<2026-06-15'));
  const ep = c.parseDueDate('2026-06-15');
  assert.equal(q3[0].kind, 'due');
  assert.equal(q3[0].op,   '<');
  assert.equal(q3[0].epochDay, ep);

  const q4 = host(c.parseSearchQuery('due:>today+7'));
  assert.equal(q4[0].kind, 'due');
  assert.equal(q4[0].op,   '>');
  assert.equal(q4[0].epochDay, today + 7);
});

test('termMatchesNode — due: search operators', () => {
  const ep2026 = c.parseDueDate('2026-06-15');
  const n = c.mkNode('task');
  n.props = [{ key: 'due', val: '2026-06-15' }];

  const eqTerm   = { kind: 'due', op: '=',  epochDay: ep2026 };
  const ltTerm   = { kind: 'due', op: '<',  epochDay: ep2026 + 1 };
  const gtTerm   = { kind: 'due', op: '>',  epochDay: ep2026 - 1 };
  const missTerm = { kind: 'due', op: '=',  epochDay: ep2026 + 1 };

  assert.ok( c.termMatchesNode(eqTerm,   n, []));
  assert.ok( c.termMatchesNode(ltTerm,   n, []));
  assert.ok( c.termMatchesNode(gtTerm,   n, []));
  assert.ok(!c.termMatchesNode(missTerm, n, []));

  // node with no due prop
  const bare = c.mkNode('no props');
  assert.ok(!c.termMatchesNode(eqTerm, bare, []));

  // overdue term — compare against today
  const today = c.dueDateToday();
  const pastEp = today - 5;
  const pastN = c.mkNode('old'); pastN.props = [{ key: 'due', val: c.formatEpochDays(pastEp) }];
  const overdTerm = { kind: 'due', op: 'overdue' };
  assert.ok(c.termMatchesNode(overdTerm, pastN, []));
  const futN = c.mkNode('future'); futN.props = [{ key: 'due', val: '2099-01-01' }];
  assert.ok(!c.termMatchesNode(overdTerm, futN, []));
});

test('due dates: front-door wiring (src pins)', () => {
  const _src = readFileSync(
    new URL('../index.html', import.meta.url),
    'utf8'
  );
  assert.ok(_src.includes("id:'due'"), '/due slash entry missing');
  assert.ok(_src.includes('openDueDateDialog'), 'openDueDateDialog missing');
  assert.ok(_src.includes('parseDueDate'), 'parseDueDate missing');
  assert.ok(_src.includes('collectDueDates'), 'collectDueDates missing');
  assert.ok(_src.includes('btn-agenda'), 'agenda button missing');
  assert.ok(_src.includes('renderAgenda'), 'renderAgenda missing');
  assert.ok(_src.includes("/^(due|start):"), 'due/start search operator missing');
  assert.ok(_src.includes("term.kind === 'due' || term.kind === 'start'"), 'date search match missing');
  // P5-4 (UXP-37): the date/agenda syntax also lives in the GUIDE (? concept guide), not only the search legend
  assert.ok(_src.includes("id:'dates'") && _src.includes("cat:'dates'"), 'GUIDE dates entry missing');
  assert.ok(_src.includes("id:'search-ops'") && _src.includes("syn:'due:today / due:overdue'"), 'GUIDE search-ops due/start examples missing');
  assert.ok(_src.includes('agendaShowRunning'), 'agenda running toggle missing');
  assert.ok(_src.includes('ag-controls'), 'agenda control group missing');
  // agenda: permanent List on the top bar + Timeline/Calendar as toggled full-width bars below
  assert.ok(_src.includes('agendaBars'), 'agenda view-bars state missing');
  assert.ok(_src.includes('ag-top') && _src.includes('ag-pane'), 'agenda top bar / stacked bars missing');
  assert.ok(_src.includes('renderAgendaGantt'), 'agenda Gantt view missing');
  assert.ok(_src.includes('renderAgendaCalendar'), 'agenda calendar view missing');
  assert.ok(_src.includes('agendaGantt'), 'agenda Gantt core missing');
  assert.ok(_src.includes('agendaMonthCells'), 'agenda calendar core missing');
});


// ─── journal pure cores ───────────────────────────────────────────────────────
test('todayISO returns YYYY-MM-DD shape', () => {
  const iso = c.todayISO();
  assert.match(iso, /^\d{4}-\d{2}-\d{2}$/);
});

test('journalFileName: one file per day', () => {
  // the per-entry arm was cut 2026-07-02 (never wired: no mode produced it, no reader listed it)
  assert.equal(c.journalFileName('2026-06-16'), '2026-06-16.opml');
});

test('findOrCreateDatedEntry creates when absent (leaf is the day, nested)', () => {
  const home = { children: [] };
  const mk = t => ({ id: 'x1', text: t, children: [] });
  const { entry, created } = c.findOrCreateDatedEntry(home, '2026-06-16', mk);
  assert.equal(created, true);
  assert.equal(entry.text, '16');          // returned leaf is the day, not the full iso
  assert.equal(home.children.length, 1);   // home > 2026 > 06 > 16
});

test('findOrCreateDatedEntry is idempotent (returns same entry)', () => {
  const home = { children: [] };
  let n = 0;
  const mk = t => ({ id: 'x' + (++n), text: t, children: [] });
  const r1 = c.findOrCreateDatedEntry(home, '2026-06-16', mk);
  assert.equal(r1.created, true);
  const r2 = c.findOrCreateDatedEntry(home, '2026-06-16', mk);
  assert.equal(r2.created, false);
  assert.equal(r2.entry.id, r1.entry.id);
  assert.equal(home.children.length, 1);   // still one year node
});

test('findOrCreateDatedEntry distinct days share the month (one year, one month)', () => {
  const home = { children: [] };
  let n = 0;
  const mk = t => ({ id: 'x' + (++n), text: t, children: [] });
  c.findOrCreateDatedEntry(home, '2026-06-15', mk);
  c.findOrCreateDatedEntry(home, '2026-06-16', mk);
  assert.equal(home.children.length, 1);                          // one year
  assert.equal(home.children[0].children.length, 1);              // one month
  assert.equal(home.children[0].children[0].children.length, 2);  // two days
});

test('findOrCreateDatedEntry matches a day with an iso: style title suffix', () => {
  // pre-seed the nested path with a titled day node
  const day = { id: 'h1', text: '16: My day', children: [] };
  const home = { children: [{ text: '2026', children: [{ text: '06', children: [day] }] }] };
  const mk = t => ({ id: 'x1', text: t, children: [] });
  const { entry, created } = c.findOrCreateDatedEntry(home, '2026-06-16', mk);
  assert.equal(created, false);
  assert.equal(entry.id, 'h1');
});

test('findOrCreateDatedEntry matches a space-suffixed day node', () => {
  const day = { id: 'h2', text: '16 notes', children: [] };
  const home = { children: [{ text: '2026', children: [{ text: '06', children: [day] }] }] };
  const mk = t => ({ id: 'x1', text: t, children: [] });
  const { entry, created } = c.findOrCreateDatedEntry(home, '2026-06-16', mk);
  assert.equal(created, false);
  assert.equal(entry.id, 'h2');
});

// ─── splitForSibling (UXP-60: Enter splits at the caret) ──────────────────────
test('splitForSibling caret-at-start: whole text moves to the trailing half', () => {
  assert.deepEqual(host(c.splitForSibling('hello world', 0, '')), { before: '', after: 'hello world' });
});

test('splitForSibling caret-mid: clean split at the offset', () => {
  assert.deepEqual(host(c.splitForSibling('hello world', 6, '')), { before: 'hello ', after: 'world' });
});

test('splitForSibling caret-at-end: empty trailing half (classic-append case)', () => {
  assert.deepEqual(host(c.splitForSibling('hello world', 11, '')), { before: 'hello world', after: '' });
});

test('splitForSibling continues a to-do marker on the trailing half', () => {
  // '- [ ] buy milk', caret after the marker (offset 6) → empty to-do + a to-do with the text
  assert.deepEqual(
    host(c.splitForSibling('- [ ] buy milk', 6, '- [ ] ')),
    { before: '- [ ] ', after: '- [ ] buy milk' });
});

test('splitForSibling continues a quote marker on the trailing half', () => {
  assert.deepEqual(
    host(c.splitForSibling('> hello there', 8, '> ')),
    { before: '> hello ', after: '> there' });
});

test('splitForSibling inside-prefix: literal slice (documents v1 behavior)', () => {
  // Caret inside the raw marker — the literal formula prefixes the trailing half; the
  // leading half keeps the partial marker. A rare edit-mode edge, pinned for stability.
  assert.deepEqual(
    host(c.splitForSibling('- [ ] buy milk', 2, '- [ ] ')),
    { before: '- ', after: '- [ ] [ ] buy milk' });
});

test('splitForSibling clamps the offset to [0, len]', () => {
  assert.deepEqual(host(c.splitForSibling('hi', 99, '')), { before: 'hi', after: '' });
  assert.deepEqual(host(c.splitForSibling('hi', -5, '')), { before: '', after: 'hi' });
});

test('splitForSibling tolerates null/undefined text', () => {
  assert.deepEqual(host(c.splitForSibling(null, 0, '')), { before: '', after: '' });
  assert.deepEqual(host(c.splitForSibling(undefined, 3, 'x')), { before: '', after: 'x' });
});

// ─── mergeUpText (UXP-68: Backspace merges the point up into the one above) ────
test('mergeUpText joins flush and reports the folded join offset', () => {
  assert.deepEqual(host(c.mergeUpText('bar', 'foo')), { text: 'barfoo', offset: 3 });
});
test('mergeUpText into an empty previous point keeps the body, offset 0', () => {
  assert.deepEqual(host(c.mergeUpText('', 'foo')), { text: 'foo', offset: 0 });
});
test('mergeUpText with an empty body lands the caret at the seam (no-op join)', () => {
  assert.deepEqual(host(c.mergeUpText('bar', '')), { text: 'bar', offset: 3 });
});
test('mergeUpText tolerates null/undefined', () => {
  assert.deepEqual(host(c.mergeUpText(null, null)), { text: '', offset: 0 });
  assert.deepEqual(host(c.mergeUpText('hi', undefined)), { text: 'hi', offset: 2 });
});
test('mergeUpText trims a trailing blank line on the target (the second-line bug)', () => {
  // a parent point often carries a stray trailing \n (a contenteditable filler <br>);
  // the body must continue its last content line, not drop onto a spurious second line
  assert.deepEqual(host(c.mergeUpText('Parent\n', 'child')), { text: 'Parentchild', offset: 6 });
  assert.deepEqual(host(c.mergeUpText('Parent\n\n', 'child')), { text: 'Parentchild', offset: 6 });
});
test('mergeUpText keeps a genuinely multi-line target, appending to its last line', () => {
  assert.deepEqual(host(c.mergeUpText('x\ny', 'z')), { text: 'x\nyz', offset: 3 });
});
test('mergeUpText trims a leading blank line on the body', () => {
  assert.deepEqual(host(c.mergeUpText('foo', '\nbar')), { text: 'foobar', offset: 3 });
});

test('UXP-68 wiring: Backspace-at-start merges up via mergeUpInto', () => {
  assert.ok(_src.includes('function mergeUpInto'), 'mergeUpInto must be defined');
  assert.ok(_src.includes('function mergeArtifactSidecars'), 'mergeArtifactSidecars must be defined');
  // target = the row above (deleteNode's focus model: prev sibling's last visible, else parent).
  // Structural pin (#452): assert the call is present anywhere in mergeUpInto's body, no window.
  const _mergeUp = fnBody(_src, 'mergeUpInto');
  assert.ok(_mergeUp.includes('lastVis(parent.children[idx - 1])'),
    'mergeUpInto targets the previous visible point via lastVis');
  // mirrors the fold dance: caret lands at the folded join via unfoldedPrefixLen
  assert.ok(_mergeUp.includes('unfoldedPrefixLen(target, joinPrefix)'),
    'mergeUpInto lands the caret at the folded join');
  // keydown gate: only when the selection is collapsed at offset 0
  assert.match(_src, /getCaretOffset\(content\) === 0 && mergeUpInto\(id\)/,
    'Backspace handler gates merge-up on caret offset 0');
});

// ─── flatRowStep ──────────────────────────────────────────────────────────────

test('flatRowStep steps forward through a flat row list', () => {
  const rows = [{ node: { id: 'a' } }, { node: { id: 'b' } }, { node: { id: 'c' } }];
  const idx  = new Map([['a', 0], ['b', 1], ['c', 2]]);
  assert.equal(c.flatRowStep('a', 1, rows, idx), 'b');
  assert.equal(c.flatRowStep('b', 1, rows, idx), 'c');
});

test('flatRowStep steps backward through a flat row list', () => {
  const rows = [{ node: { id: 'a' } }, { node: { id: 'b' } }, { node: { id: 'c' } }];
  const idx  = new Map([['a', 0], ['b', 1], ['c', 2]]);
  assert.equal(c.flatRowStep('c', -1, rows, idx), 'b');
  assert.equal(c.flatRowStep('b', -1, rows, idx), 'a');
});

test('flatRowStep returns null at boundaries', () => {
  const rows = [{ node: { id: 'a' } }, { node: { id: 'b' } }];
  const idx  = new Map([['a', 0], ['b', 1]]);
  assert.equal(c.flatRowStep('a', -1, rows, idx), null, 'past start');
  assert.equal(c.flatRowStep('b',  1, rows, idx), null, 'past end');
});

test('flatRowStep returns null for an unknown id', () => {
  const rows = [{ node: { id: 'a' } }];
  const idx  = new Map([['a', 0]]);
  assert.equal(c.flatRowStep('z', 1, rows, idx), null);
});

test('flatRowStep works on a single-row list', () => {
  const rows = [{ node: { id: 'x' } }];
  const idx  = new Map([['x', 0]]);
  assert.equal(c.flatRowStep('x',  1, rows, idx), null);
  assert.equal(c.flatRowStep('x', -1, rows, idx), null);
});

test('UXP-57 wiring: Arrow keydown handler calls flatRowStep and rangeSelectTo', () => {
  assert.ok(_src.includes('flatRowStep'), 'flatRowStep must be defined');
  assert.match(_src, /ArrowDown.*ArrowUp|ArrowUp.*ArrowDown/, 'Arrow handler exists');
  assert.match(_src, /flatRowStep\(fromId, dir\)/, 'Arrow handler calls flatRowStep(fromId, dir)');
  assert.match(_src, /rangeSelectTo\(nextId\)/, 'Shift+Arrow calls rangeSelectTo(nextId)');
  assert.ok(_src.includes('selFocusId'), 'selFocusId must be declared');
});

test('caret-split wiring: insertSiblingAfter has the caret-aware path', () => {
  // Source-introspection pins: the split path clones sidecars and prunes both halves,
  // lands the caret at the new half's body start, and falls through when the trailing
  // half is empty (classic empty-continuation append).
  assert.ok(_src.includes('cloneArtifactSidecars'), 'cloneArtifactSidecars missing');
  assert.ok(_src.includes('focusNodeAtOffset'), 'focusNodeAtOffset missing');
  // Structural pins (#452): assert the calls are present anywhere in insertSiblingAfter's body.
  const _insSib = fnBody(_src, 'insertSiblingAfter');
  assert.ok(_insSib.includes('foldedOffsetFor(srcNode, off)'),
    'insertSiblingAfter must translate the caret via foldedOffsetFor');
  assert.ok(_insSib.includes('splitForSibling(srcNode.text, foff, cont)'),
    'insertSiblingAfter must split on the folded text at the translated offset');
});

// ── linkText: link tokens render legibly in no-pill contexts ─────────────────
// Breadcrumbs and "Linked from" show titles as PLAIN TEXT — a raw [[#id|]]/[[#id]]
// there is noise. linkText prettifies a title: a labelled link → its label; a token
// with no resolvable target → the bare id (never the raw [[…]] token); text without
// tokens passes through untouched. (The target-title-resolution path reads the
// module-level nodeMap/workspaceIndex, which the vm harness can't rebind — that
// branch is verified in-browser, like renderCrossLinkPill's live lookups.)
test('linkText — labelled link → label; no token → passthrough; unresolved → bare id', () => {
  assert.equal(c.linkText('just text'), 'just text', 'no token → untouched');
  assert.equal(c.linkText('ref [[#a1|the alpha]]'), 'ref the alpha', 'labelled link → label, not token');
  assert.equal(c.linkText('cross [[da#n2|Gamma]]'), 'cross Gamma', 'cross-doc labelled link → label');
  assert.equal(c.linkText('two [[#a|X]] and [[#b|Y]]'), 'two X and Y', 'multiple tokens each resolve');
  // bare, unresolvable (no nodeMap entry in this harness) → bare id, NOT the raw token
  assert.equal(c.linkText('gone [[#zzz]]'), 'gone zzz', 'unresolved bare link → id, never [[…]]');
  assert.equal(c.linkText('gone [[#zzz|]]'), 'gone zzz', 'empty-label link → id, never [[…]]');
});

// The no-pill sinks must route titles through the legible wrapper, not raw
// textForDisplay (which stays raw so it can build the workspace titles index).
test('breadcrumb + backlinks render link-legible titles (displayTitle/linkText wiring)', () => {
  // displayTitle resolves both layers for the no-pill sinks: artifact tokens flattened to
  // their shown value (F1 — [[dice:KEY]] must never leak raw into a crumb), then link
  // tokens to legible text. So: linkText wraps a flattenArtifacts(textForDisplay(...)) call.
  assert.match(_src, /function displayTitle\(node\)\s*\{\s*return linkText\(flattenArtifacts\(textForDisplay\(node\)/,
    'displayTitle must flatten artifacts (F1) then wrap in linkText');
  assert.match(_src, /function crumbLabel[\s\S]{0,160}displayTitle\(n\)/,
    'crumbLabel must use displayTitle');
  assert.match(_src, /bl-item['"];\s*\n\s*const t = displayText\(src\)/,
    'same-doc backlink rows must use displayText (resolves markdown/pills to shown text)');
  assert.ok(!/function textForDisplay\([^)]*\)\s*\{[\s\S]{0,400}linkText/.test(_src),
    'textForDisplay must NOT call linkText (keeps the workspace titles index raw)');
});

// ── search: sequence status as key:value (state:/status:) ───────────────────
const _defSeqs = c.allSequences({ children: [] }); // [DEFAULT_SEQUENCE] — TODO/NEXT/WAITING/DONE

test('parseSearchQuery — state: parses to a state term', () => {
  assert.deepEqual(host(c.parseSearchQuery('state:waiting')),
    [{ neg: false, kind: 'state', value: 'waiting' }]);
  assert.deepEqual(host(c.parseSearchQuery('-state:todo')),
    [{ neg: true, kind: 'state', value: 'todo' }]);           // negation preserved
});

test('parseSearchQuery — state: does not steal the generic key:value prop term', () => {
  // a non-state key stays a prop term; only state: routes to the state term.
  assert.deepEqual(host(c.parseSearchQuery('owner:zeo')),
    [{ neg: false, kind: 'prop', key: 'owner', value: 'zeo' }]);
  // status: is intentionally NOT a state synonym — it stays the generic property lookup,
  // so a point with a `status` property keeps matching status:done (no collision).
  assert.deepEqual(host(c.parseSearchQuery('status:done')),
    [{ neg: false, kind: 'prop', key: 'status', value: 'done' }]);
  assert.equal(c.parseSearchQuery('state:doing urgent').map(t => t.kind).join(','), 'state,text');
});

test('termMatchesNode — state: matches the point’s sequence keyword', () => {
  const waiting = { text: '#WAITING follow up', props: [] };
  assert.equal(c.termMatchesNode({ kind: 'state', value: 'waiting' }, waiting, _defSeqs), true);
  assert.equal(c.termMatchesNode({ kind: 'state', value: 'done' },    waiting, _defSeqs), false);
  // case-insensitive value; keyword is stored uppercase
  assert.equal(c.termMatchesNode({ kind: 'state', value: 'waiting' },
    { text: '#WAITING x', props: [] }, _defSeqs), true);
});

test('termMatchesNode — state: ignores a leading #WORD that is not a declared state', () => {
  // #SHOUT is hashtag-shaped but not in any sequence → never a state match (P1: a
  // state filter means a real status, not any capitalized #word).
  assert.equal(c.termMatchesNode({ kind: 'state', value: 'shout' },
    { text: '#SHOUT hey', props: [] }, _defSeqs), false);
  // a point with no keyword at all
  assert.equal(c.termMatchesNode({ kind: 'state', value: 'todo' },
    { text: 'plain point', props: [] }, _defSeqs), false);
});

test('queryMatchesNode — state: composes with AND/NOT like other terms', () => {
  const next = { text: '#NEXT ship it', props: [], children: [] };
  assert.equal(c.queryMatchesNode(c.parseSearchQuery('state:next ship'), next, _defSeqs), true);
  assert.equal(c.queryMatchesNode(c.parseSearchQuery('state:next -state:done'), next, _defSeqs), true);
  assert.equal(c.queryMatchesNode(c.parseSearchQuery('-state:next'), next, _defSeqs), false);
});

test('searchHighlightNeedles — state: (and other field filters) produce no needles', () => {
  // only literal text + tags highlight; state:/prop/has/due are field matches.
  assert.deepEqual(host(c.searchHighlightNeedles(c.parseSearchQuery('state:waiting'))), []);
  assert.deepEqual(host(c.searchHighlightNeedles(c.parseSearchQuery('owner:zeo'))), []);
  assert.deepEqual(host(c.searchHighlightNeedles(c.parseSearchQuery('has:owner'))), []);
  // text + tag still surface
  assert.deepEqual(host(c.searchHighlightNeedles(c.parseSearchQuery('ship #urgent state:next'))),
    ['ship', '#urgent']);
});

// ── journal: year > month > day nesting ─────────────────────────────────────
// mk factory mirrors openJournalEntry's: a node with a children array. The pure
// core wires the tree; the caller wires DOM maps via the parent arg.
const mkJ = (t) => ({ text: t, children: [] });

test('findOrCreateDatedEntry — nests iso as year > month > day', () => {
  const home = { text: 'Journal', children: [] };
  const { entry, created } = c.findOrCreateDatedEntry(home, '2026-06-16', mkJ);
  assert.equal(created, true);
  // home > 2026 > 06 > 16
  assert.equal(home.children.length, 1);
  const year = home.children[0];
  assert.equal(year.text, '2026');
  assert.equal(year.children.length, 1);
  const month = year.children[0];
  assert.equal(month.text, '06');
  assert.equal(month.children.length, 1);
  const day = month.children[0];
  assert.equal(day.text, '16');
  assert.equal(entry, day); // returned entry is the leaf day node
});

test('findOrCreateDatedEntry — same day is idempotent (no duplicates)', () => {
  const home = { text: 'Journal', children: [] };
  c.findOrCreateDatedEntry(home, '2026-06-16', mkJ);
  const second = c.findOrCreateDatedEntry(home, '2026-06-16', mkJ);
  assert.equal(second.created, false);
  assert.equal(home.children.length, 1);              // one year
  assert.equal(home.children[0].children.length, 1);  // one month
  assert.equal(home.children[0].children[0].children.length, 1); // one day
});

test('findOrCreateDatedEntry — reuses year/month, adds a new day under them', () => {
  const home = { text: 'Journal', children: [] };
  c.findOrCreateDatedEntry(home, '2026-06-16', mkJ);
  const r = c.findOrCreateDatedEntry(home, '2026-06-17', mkJ);
  assert.equal(r.created, true);
  assert.equal(home.children.length, 1);                 // still one year
  const month = home.children[0].children[0];
  assert.equal(month.text, '06');
  assert.equal(month.children.length, 2);                // two days now
  assert.deepEqual(month.children.map(d => d.text), ['16', '17']);
});

test('findOrCreateDatedEntry — a different month forks under the same year', () => {
  const home = { text: 'Journal', children: [] };
  c.findOrCreateDatedEntry(home, '2026-06-16', mkJ);
  c.findOrCreateDatedEntry(home, '2026-07-01', mkJ);
  assert.equal(home.children.length, 1);                 // one year
  assert.deepEqual(home.children[0].children.map(m => m.text), ['06', '07']);
});

test('findOrCreateDatedEntry — leaf day matches fuzzily (titled day reused)', () => {
  const home = { text: 'Journal', children: [] };
  // pre-seed a titled day node by hand under the nested path
  const year = mkJ('2026'); home.children.push(year);
  const month = mkJ('06'); year.children.push(month);
  const titled = mkJ('16 Tuesday'); month.children.push(titled);
  const r = c.findOrCreateDatedEntry(home, '2026-06-16', mkJ);
  assert.equal(r.created, false);
  assert.equal(r.entry, titled);          // reused, not duplicated
  assert.equal(month.children.length, 1);
});

// ── parseDateSlash: the /due:value keyboard bridge ──────────────────────────
test('parseDateSlash — due:tomorrow → { due, tomorrow }', () => {
  assert.deepEqual(host(c.parseDateSlash('due:tomorrow')), { key: 'due', raw: 'tomorrow' });
});
test('parseDateSlash — start:YYYY-MM-DD', () => {
  assert.deepEqual(host(c.parseDateSlash('start:2026-07-01')), { key: 'start', raw: '2026-07-01' });
});
test('parseDateSlash — relative today+N', () => {
  assert.deepEqual(host(c.parseDateSlash('due:today+3')), { key: 'due', raw: 'today+3' });
});
test('parseDateSlash — case-insensitive key, value case preserved', () => {
  assert.deepEqual(host(c.parseDateSlash('DUE:Tomorrow')), { key: 'due', raw: 'Tomorrow' });
});
test('parseDateSlash — trims surrounding whitespace in the value', () => {
  assert.deepEqual(host(c.parseDateSlash('due:  today ')), { key: 'due', raw: 'today' });
});
test('parseDateSlash — bare verb (no value) → null (falls through to dialog)', () => {
  assert.equal(c.parseDateSlash('due'), null);
  assert.equal(c.parseDateSlash('due:'), null);
  assert.equal(c.parseDateSlash('due:   '), null);
});
test('parseDateSlash — a non-date verb is not a date slash', () => {
  assert.equal(c.parseDateSlash('todo:tomorrow'), null);
  assert.equal(c.parseDateSlash('check:x>1'), null);
  assert.equal(c.parseDateSlash(''), null);
});
test('parseDateSlash — only the FIRST colon splits key from value', () => {
  // a value could itself contain a colon (none today, but be robust)
  assert.deepEqual(host(c.parseDateSlash('due:a:b')), { key: 'due', raw: 'a:b' });
});

// ── LEAN FLOOR phase 1: the promoting inline-stub property path ──────────────────
test('propDeclParts — {prop KEY: VALUE} sniffs a property declaration; reserved keys excluded', () => {
  assert.equal(c.propDeclParts('prop owner: zeo').key, 'owner');
  assert.equal(c.propDeclParts('prop owner: zeo').val, 'zeo');
  assert.equal(c.propDeclParts('prop status: in progress').val, 'in progress');   // value may have spaces
  assert.equal(c.propDeclParts('prop empty:').val, '');                            // empty value clears the key
  assert.equal(c.propDeclParts('prop nokey'), null);                               // no colon → not a decl
  assert.equal(c.propDeclParts('proper: x'), null);                                // must be the exact `prop ` keyword
  // reserved keys route through their own writers, never the generic bag
  assert.equal(c.propDeclParts('prop due: friday'), null);
  assert.equal(c.propDeclParts('prop check: x>0'), null);
  assert.equal(c.propDeclParts('prop aliases: a, b'), null);
});

test('setProp — adds/replaces/clears an arbitrary key, case-insensitive on the key', () => {
  const n = { props: [] };
  c.setProp(n, 'owner', 'zeo');
  assert.deepEqual(host(n.props), [{ key: 'owner', val: 'zeo' }]);
  c.setProp(n, 'Owner', 'ada');                       // case-insensitive replace, keeps the new label
  assert.equal(n.props.length, 1);
  assert.equal(n.props[0].val, 'ada');
  c.setProp(n, 'owner', '');                          // empty value clears
  assert.equal(n.props.length, 0);
  c.setProp(n, '', 'x');                              // empty key is a no-op
  assert.equal(n.props.length, 0);
});

test('parsePropSlash — /prop:key=value (or key:value) one-shot; incomplete → null (falls to stub)', () => {
  assert.deepEqual(host(c.parsePropSlash('prop:owner=zeo')), { key: 'owner', val: 'zeo' });
  assert.deepEqual(host(c.parsePropSlash('prop:owner:zeo')), { key: 'owner', val: 'zeo' });   // colon form too
  assert.equal(c.parsePropSlash('prop:owner'), null);         // key only, no separator → not a one-shot (falls to the stub)
  assert.equal(c.parsePropSlash('prop:'), null);              // no key → null
  assert.equal(c.parsePropSlash('due:friday'), null);         // a different verb is not a prop slash
});

test('LEAN-FLOOR: {prop …} promotes to node.props via promoteBraceBody, leaving no inline token', () => {
  // the whole point of the sidecar stub: it writes the chip and CONSUMES the brace (no [[…]] token).
  const node = { text: '', props: [] };
  const tok = c.promoteBraceBody(node, 'prop owner: zeo');
  assert.equal(tok, '', 'a {prop …} promotes to nothing inline (a chip, not a pill)');
  assert.deepEqual(host(node.props), [{ key: 'owner', val: 'zeo' }]);
  // classifyBraceBody reads it as a valid artifact (grammar-styled while editing, not a typo)
  assert.equal(c.classifyBraceBody('prop owner: zeo', {}, {}), 'artifact');
});

test('dateDeclParts — {date due|start: VALUE} sniffs a date stub; non-date keys rejected', () => {
  assert.deepEqual(host(c.dateDeclParts('date due: tomorrow')), { key: 'due', val: 'tomorrow' });
  assert.deepEqual(host(c.dateDeclParts('date start: 2026-07-04')), { key: 'start', val: '2026-07-04' });
  assert.equal(c.dateDeclParts('date foo: x'), null);      // only due/start
  assert.equal(c.dateDeclParts('prop due: x'), null);      // not the date keyword
});

test('LEAN-FLOOR: {date due: VALUE} promotes to the date prop (valid), clears (empty), or stays literal (invalid)', () => {
  // valid → setDateProp writes it, brace consumed
  const n = { text: '', props: [] };
  assert.equal(c.promoteBraceBody(n, 'date due: 2026-07-04'), '');
  assert.deepEqual(host(n.props), [{ key: 'due', val: '2026-07-04' }]);
  // empty → clears
  assert.equal(c.promoteBraceBody(n, 'date due:'), '');
  assert.equal(n.props.length, 0);
  // invalid date → stays literal (null), never silently promoted to nothing
  assert.equal(c.promoteBraceBody({ text: '', props: [] }, 'date due: notaday'), null);
  assert.equal(c.classifyBraceBody('date due: tomorrow', {}, {}), 'artifact');
});

test('LEAN-FLOOR: the /due bare-stub and /note DOM wiring is present (slashApply is DOM-bound)', () => {
  assert.ok(_src.includes("applyInlineInsertion(nodeId, slashOffset, '{date due: }')"), 'bare /due must write the {date due: } stub, not open the dialog');
  assert.ok(_src.includes("cmd.id === 'note'") && _src.includes('openNoteEditor(nodeId)'), 'the /note verb must open the inline note editor');
});

test('LEAN-FLOOR: the /prop verb + bare-stub DOM wiring is present (slashApply is DOM-bound)', () => {
  // assert the lean-floor verbs are in the arg-verb gate (membership, not the exact string, so adding
  // a verb later doesn't churn this pin)
  const gate = _src.match(/SLASH_ARG_VERBS = \/\^\(([^)]+)\)\$\//);
  assert.ok(gate, 'SLASH_ARG_VERBS gate not found');
  for (const v of ['prop', 'base', 'savetemplate', 'refile']) assert.ok(gate[1].split('|').includes(v), `${v} missing from the arg-verb gate`);
  assert.ok(_src.includes("const stub = '{prop : }'"), 'the bare-/prop fill-in stub is missing');
  assert.ok(_src.includes('parsePropSlash(query)'), 'the /prop:key=value one-shot branch is missing');
  // the promotion loop counts a consumed-no-token ('') as promoted, not "keep the brace"
  assert.ok(_src.includes('if (token != null)'), 'the promotion loop must treat an empty-string return as consumed');
});

test('resolveRefileTarget — exact > partial, top → root, excludes the moved subtree, null on no match', () => {
  const mk = (id, text, kids = []) => ({ id, text, props: [], children: kids });
  const root = c.mkRoot();
  root.children = [
    mk('inbox', 'Inbox'),
    mk('proj', 'Project', [mk('task', 'Task')]),
    mk('moving', 'Moving', [mk('decoy', 'Inbox')]),   // a decoy "Inbox" UNDER the moved point
  ];
  assert.equal(c.resolveRefileTarget('Inbox', 'moving', root), 'inbox', 'exact match wins, and the in-subtree decoy is excluded');
  assert.equal(c.resolveRefileTarget('proj', 'moving', root), 'proj', 'a partial (contains) match resolves');
  assert.equal(c.resolveRefileTarget('top', 'moving', root), root.id, 'top → the root (lift out)');
  assert.equal(c.resolveRefileTarget('top level', 'moving', root), root.id);
  assert.equal(c.resolveRefileTarget('nope', 'moving', root), null, 'no match → null (caller flashes why)');
  assert.equal(c.resolveRefileTarget('', 'moving', root), null, 'empty query → null');
});

test('LEAN-FLOOR: the /refile slashApply wiring is present (DOM-bound)', () => {
  assert.ok(_src.includes('resolveRefileTarget(title, nodeId)'), 'the /refile:title resolve branch is missing');
  assert.ok(_src.includes("flashHint('No point named "), 'the unmatched-title P4 flash is missing');
  assert.ok(_src.includes('openRefileDialog(nodeId)'), 'bare /refile must open the tree picker');
});

test('parseBaseSlash — /base:RxC → clamped {rows, cols}; bare/garbage → null', () => {
  assert.deepEqual(host(c.parseBaseSlash('base:3x4')), { rows: 3, cols: 4 });
  assert.deepEqual(host(c.parseBaseSlash('base:2×5')), { rows: 2, cols: 5 });     // unicode × too
  assert.deepEqual(host(c.parseBaseSlash('base:99x99')), { rows: 50, cols: 20 }); // clamped to a sane grid
  assert.equal(c.parseBaseSlash('base'), null);                                    // bare → default 3x3 (slashApply)
  assert.equal(c.parseBaseSlash('base:abc'), null);                                // not RxC → null
});

test('LEAN-FLOOR: /base and /savetemplate slashApply wiring is present (DOM-bound)', () => {
  assert.ok(_src.includes('const bs = parseBaseSlash(query)'), 'the /base:RxC branch is missing');
  assert.ok(_src.includes('createBaseAt(nodeId, bs ? bs.rows : 3, bs ? bs.cols : 3)'), 'bare /base must default to 3x3, no picker');
  assert.ok(_src.includes('upsertTemplate(root.templates, name, deepCloneNodeNewIds(cur))'), 'the /savetemplate:name inline save is missing');
});

// ── parseSlashQuery: the per-verb ":value" gate for the /-command bridge ─────────
// The arm is /-only and limited to SLASH_ARG_VERBS (due/start/check/alias/template);
// a colon after any other verb — or after any @-insert — stays plain node text (P1).
test('parseSlashQuery — opted-in / verb captures a space-bearing value, original case', () => {
  const r = host(c.parseSlashQuery('check:sum(Cost) <= Budget', '/'));
  assert.equal(r.word, 'check');
  assert.equal(r.hasArg, true);
  assert.equal(r.rawArg, 'sum(Cost) <= Budget');          // value keeps its case + spaces
  assert.equal(r.query, 'check:sum(cost) <= budget');     // query is lowercased (strip length only)
});
test('parseSlashQuery — /alias keeps the comma list verbatim', () => {
  const r = host(c.parseSlashQuery('alias:Wyrm, Drake', '/'));
  assert.equal(r.hasArg, true);
  assert.equal(r.rawArg, 'Wyrm, Drake');
});
test('parseSlashQuery — /template name (may contain spaces)', () => {
  const r = host(c.parseSlashQuery('template:Weekly Review', '/'));
  assert.equal(r.hasArg, true);
  assert.equal(r.rawArg, 'Weekly Review');
});
test('parseSlashQuery — start maps to the due command for matching', () => {
  const r = host(c.parseSlashQuery('start:2026-07-01', '/'));
  assert.equal(r.word, 'start');
  assert.equal(r.matchWord, 'due');
  assert.equal(r.rawArg, '2026-07-01');
});
test('parseSlashQuery — a NON-opted-in verb drops the colon-tail (stays node text)', () => {
  const r = host(c.parseSlashQuery('quote:hello', '/'));
  assert.equal(r.hasArg, false);
  assert.equal(r.query, 'quote');                         // only the word is stripped; ":hello" stays
  assert.equal(r.rawArg, '');
});
test('parseSlashQuery — @ trigger NEVER takes a colon arg (the / vs @ split)', () => {
  // @-insertions are typeable as {…} at the caret; an @verb:value would duplicate that.
  const r = host(c.parseSlashQuery('check:x > 1', '@'));
  assert.equal(r.hasArg, false);
  assert.equal(r.query, 'check');
  assert.equal(r.rawArg, '');
});
test('parseSlashQuery — bare opted-in verb has no arg (falls through to dialog)', () => {
  const r = host(c.parseSlashQuery('check', '/'));
  assert.equal(r.hasArg, false);
  assert.equal(r.rawArg, '');
  assert.equal(r.query, 'check');
});
test('parseSlashQuery — query length matches the captured text (the text-strip invariant)', () => {
  // slashApply strips `1 + query.length` chars from node text; lowercasing must not
  // change the length, or it would mangle surrounding text on a mixed-case value.
  for (const raw of ['check:SUM(Cost) <= Budget', 'alias:Wyrm, Drake', 'template:Weekly Review', 'due:Tomorrow']) {
    assert.equal(c.parseSlashQuery(raw, '/').query.length, raw.length, raw);
  }
  // and for a non-arg verb the strip is just the word (colon-tail stays in text)
  assert.equal(c.parseSlashQuery('quote:X', '/').query, 'quote');
});

// ── setCheckProp / setAliasProp: the shared writers behind both the dialog and the
// /check:expr · /alias:a,b slash bridges (one write path, no divergence). ──────────
test('setCheckProp — sets the reserved check property, replacing any prior', () => {
  const n = { props: [{ key: 'cost', val: '5' }] };
  c.setCheckProp(n, 'sum(cost) <= budget');
  assert.deepEqual(host(n.props), [{ key: 'cost', val: '5' }, { key: 'check', val: 'sum(cost) <= budget' }]);
  c.setCheckProp(n, 'count(score) >= 3');             // replace, not append a second check
  assert.equal(n.props.filter(p => p.key === 'check').length, 1);
  assert.equal(n.props.find(p => p.key === 'check').val, 'count(score) >= 3');
});
test('setCheckProp — empty expr clears the check', () => {
  const n = { props: [{ key: 'check', val: 'x > 1' }, { key: 'cost', val: '5' }] };
  c.setCheckProp(n, '');
  assert.deepEqual(host(n.props), [{ key: 'cost', val: '5' }]);
});
test('setAliasProp — comma-splits, trims, dedupes empties; clears when empty', () => {
  const n = { props: [] };
  c.setAliasProp(n, 'wyrm, drake ,  , hydra');
  assert.deepEqual(host(n.props), [{ key: 'aliases', val: 'wyrm, drake, hydra' }]);
  assert.deepEqual(host(c.aliasesOf(n)), ['wyrm', 'drake', 'hydra']);
  c.setAliasProp(n, '   ');                            // all-blank → clears
  assert.deepEqual(host(n.props), []);
});
test('setAliasProp — replaces a prior aliases prop, preserves others', () => {
  const n = { props: [{ key: 'aliases', val: 'old' }, { key: 'owner', val: 'me' }] };
  c.setAliasProp(n, 'new1, new2');
  assert.deepEqual(host(n.props), [{ key: 'owner', val: 'me' }, { key: 'aliases', val: 'new1, new2' }]);
});

// ── looksLikeCellFormula: signpost spreadsheet-style cell formulas (P4) ──────
test('looksLikeCellFormula — Excel A1-style refs', () => {
  assert.equal(c.looksLikeCellFormula('=A1+B1'), true);
  assert.equal(c.looksLikeCellFormula('=A1'), true);
  assert.equal(c.looksLikeCellFormula('= a1 * b2'), true);
});
test('looksLikeCellFormula — Org $col/@row refs typed with a leading =', () => {
  assert.equal(c.looksLikeCellFormula('=$1*$2'), true);
  assert.equal(c.looksLikeCellFormula('=@2$3'), true);
  assert.equal(c.looksLikeCellFormula('=$>'), true);
});
test('looksLikeCellFormula — arithmetic and function calls', () => {
  assert.equal(c.looksLikeCellFormula('=2*3'), true);
  assert.equal(c.looksLikeCellFormula('=cost + tax'), true);
  assert.equal(c.looksLikeCellFormula('=SUM(A1:A3)'), true);
  assert.equal(c.looksLikeCellFormula('=avg(score)'), true);
});
test('looksLikeCellFormula — plain literals that merely start with = do NOT trip', () => {
  assert.equal(c.looksLikeCellFormula('=)'), false);        // emoticon
  assert.equal(c.looksLikeCellFormula('='), false);         // lone equals
  assert.equal(c.looksLikeCellFormula('=='), false);        // just signs, no operand
  assert.equal(c.looksLikeCellFormula('= yes'), false);     // a word, no ref/arith
});
test('looksLikeCellFormula — non-formula cell content is false', () => {
  assert.equal(c.looksLikeCellFormula('42'), false);
  assert.equal(c.looksLikeCellFormula('Hello'), false);
  assert.equal(c.looksLikeCellFormula('2026-06-26'), false);// a date is a literal value
  assert.equal(c.looksLikeCellFormula(''), false);
  assert.equal(c.looksLikeCellFormula('  '), false);
  assert.equal(c.looksLikeCellFormula(null), false);
});

// ── nested (hierarchical) hashtags: #tag/subtag ──────────────────────────────
// collectTags must capture the full nested slug (segments joined by /), and a
// search for a parent tag must match its subtags (hierarchical), while an exact
// subtag query matches only itself. Mirrors the three regexes in index.html.
const tagNode = (text, children = []) => ({ text, children });

test('collectTags — captures a nested tag as one slug', () => {
  const root = tagNode('', [tagNode('a beat #thread/torn-letter here')]);
  const tags = host(c.collectTags(root)).map(t => t.name);
  assert.ok(tags.includes('thread/torn-letter'), `got ${JSON.stringify(tags)}`);
});

test('collectTags — nested and flat tags coexist; hyphens allowed', () => {
  const root = tagNode('', [
    tagNode('#thread and #thread/torn-letter and #plain-tag'),
  ]);
  const tags = host(c.collectTags(root)).map(t => t.name).sort();
  assert.deepEqual(tags, ['plain-tag', 'thread', 'thread/torn-letter']);
});

test('parseSearchQuery — accepts a nested tag token', () => {
  const terms = host(c.parseSearchQuery('#thread/torn-letter'));
  assert.equal(terms.length, 1);
  assert.equal(terms[0].kind, 'tag');
  assert.equal(terms[0].value, 'thread/torn-letter');
});

test('termMatchesNode — parent tag matches its subtag (hierarchical)', () => {
  const node = tagNode('the clue #thread/torn-letter');
  const parent = host(c.parseSearchQuery('#thread'))[0];
  assert.equal(c.termMatchesNode(parent, node, []), true, '#thread should match #thread/torn-letter');
});

test('termMatchesNode — exact subtag query matches only itself', () => {
  const sub = tagNode('the clue #thread/torn-letter');
  const other = tagNode('a different #thread/letter');
  const q = host(c.parseSearchQuery('#thread/torn-letter'))[0];
  assert.equal(c.termMatchesNode(q, sub, []), true);
  assert.equal(c.termMatchesNode(q, other, []), false);
});

test('termMatchesNode — parent tag does NOT bleed into a longer word', () => {
  const node = tagNode('#threads of fate');     // #threads, not #thread
  const q = host(c.parseSearchQuery('#thread'))[0];
  assert.equal(c.termMatchesNode(q, node, []), false, '#thread must not match #threads');
});

// ── parseVarDecl: typed {name := expr} variable declaration ───────────────────
// Sniffs `:=` before any `:`-splitting path, so it must claim real declarations and
// NOT eat grammar rule lines (single `:`) or the {= } math form. See
// guidance/typed-var-declaration-proposal.md.
test('parseVarDecl — formula declaration', () => {
  assert.deepEqual(host(c.parseVarDecl('gold := 50')), { name: 'gold', expr: '50' });
});
test('parseVarDecl — expression RHS', () => {
  assert.deepEqual(host(c.parseVarDecl('area := pi * r^2')), { name: 'area', expr: 'pi * r^2' });
});
test('parseVarDecl — random-pick RHS kept verbatim', () => {
  assert.deepEqual(host(c.parseVarDecl('beast := dragon|wyrm')), { name: 'beast', expr: 'dragon|wyrm' });
});
test('parseVarDecl — whitespace around := is optional', () => {
  assert.deepEqual(host(c.parseVarDecl('x:=5')), { name: 'x', expr: '5' });
  assert.deepEqual(host(c.parseVarDecl('  x  :=  5  ')), { name: 'x', expr: '5' });
});
test('parseVarDecl — underscore/leading-underscore names', () => {
  assert.deepEqual(host(c.parseVarDecl('_hp := 10')), { name: '_hp', expr: '10' });
  assert.deepEqual(host(c.parseVarDecl('max_hp := 10')), { name: 'max_hp', expr: '10' });
});
test('parseVarDecl — NOT a declaration: no := returns null', () => {
  assert.equal(c.parseVarDecl('gold = 50'), null);   // single = is the math sigil, not :=
  assert.equal(c.parseVarDecl('2d6'), null);
  assert.equal(c.parseVarDecl('a | b'), null);
});
test('parseVarDecl — does NOT eat a grammar rule line (single colon)', () => {
  assert.equal(c.parseVarDecl('weapon: sword | axe'), null); // `:` not `:=`
  assert.equal(c.parseVarDecl('sword.damage: 1d8'), null);
});
test('parseVarDecl — does NOT eat the {= } math form', () => {
  assert.equal(c.parseVarDecl('= 3 * 7'), null);
});
test('parseVarDecl — bad name rejected', () => {
  assert.equal(c.parseVarDecl('2x := 5'), null);     // name can't start with a digit
  assert.equal(c.parseVarDecl('a.b := 5'), null);    // dotted name is not a var name
  assert.equal(c.parseVarDecl('a-b := 5'), null);
});
test('parseVarDecl — empty RHS rejected', () => {
  assert.equal(c.parseVarDecl('gold :='), null);
  assert.equal(c.parseVarDecl('gold :=   '), null);
});
test('parseVarDecl — := only claims a LEADING name:= , not := mid-expression', () => {
  // a body that is just an expression containing := elsewhere shouldn't parse as a decl
  assert.equal(c.parseVarDecl(':= 5'), null);
});

// ── varDeclIsPick: formula-vs-pick classification of a typed decl's RHS ─────────
// The regression this fixes: {y := x} must be a live FORMULA (resolves to x's value,
// self-heals when x is (re)defined), NOT a frozen pick of the literal "{x?}". The
// classification must not depend on whether referenced vars are resolvable yet.
test('varDeclIsPick — a variable reference is a FORMULA even when the var is undefined', () => {
  assert.equal(c.varDeclIsPick('x'), false);          // the bug: was frozen as a pick → {x?}
  assert.equal(c.varDeclIsPick('x + y'), false);      // compound ref, still a formula
  assert.equal(c.varDeclIsPick('str_mod'), false);    // a single undefined identifier
  assert.equal(c.varDeclIsPick('pi * r^2'), false);
  assert.equal(c.varDeclIsPick('today + 3'), false);
  assert.equal(c.varDeclIsPick('sqrt(area)'), false);
  assert.equal(c.varDeclIsPick('50'), false);         // a plain number
});
test('varDeclIsPick — the generative/text forms are PICKS', () => {
  assert.equal(c.varDeclIsPick('Yes | No'), true);    // alternation
  assert.equal(c.varDeclIsPick('warm | cool'), true);
  assert.equal(c.varDeclIsPick('2d6'), true);         // dice
  assert.equal(c.varDeclIsPick('"hello"'), true);     // quoted literal
  assert.equal(c.varDeclIsPick("'hi'"), true);
  assert.equal(c.varDeclIsPick('Acme Corp'), true);   // multi-word bare string
});
test('{y := x} promotes to a live formula that resolves to x (end-to-end regression)', () => {
  let i = 0;
  const mk = (text, vars = []) => ({ id: 'n' + (i++), text, note: '', type: 'ul',
    children: [], vars, dice: [], markov: [], math: [], grammar: [], est: [], footnotes: [], props: [] });
  const A = mk('[[var:kx]]', [{ key: 'kx', name: 'x', expr: '2', typed: true }]);
  const B = mk('', []);
  B.text = c.promoteBraceBody(B, 'y := x');   // exitEdit splices the returned token into the text
  // promoted as a FORMULA (not a frozen pick of "{x?}")
  assert.equal(B.vars[0].kind, undefined, 'y must be a formula, not a frozen pick');
  assert.equal(B.vars[0].rolled, undefined);
  // and {y} resolves to x's value, not "{x?}"
  const root = mk('', []); root.type = 'base'; root.children = [A, B];
  const vm = c.collectVars(root);
  assert.equal(vm.y, 2, '{y} must resolve to x = 2');
});

// ── applyRefold: position-anchored, not first-indexOf ────────────────────────
// Bug: a bare text.indexOf(sh) re-attached a frozen token to a user-typed duplicate
// shorthand sitting EARLIER in the text, re-rolling the original. Refold must map the
// first-unfolded sh to the first occurrence, in order, left-to-right.
test('applyRefold — duplicate shorthand keeps the frozen token at its own position', () => {
  // One unfolded pair ({2d6} → its frozen token) but the user typed another {2d6} first.
  const pairs = [{ sh: '{2d6}', token: '[[dice:frozenkey]]' }];
  const out = c.applyRefold('{2d6} also {2d6}', pairs);
  // The FIRST {2d6} is the user's fresh copy — it must stay {2d6} (promoted later);
  // only the original (second) occurrence... but with one pair, first-match wins by order.
  // The contract: exactly ONE {2d6} becomes the token, and the leftmost stays for promotion
  // is NOT what we want — we want the SAME occurrence that was unfolded. With a single pair
  // recorded left-to-right, the first textual {2d6} is the one that was unfolded originally,
  // so it refolds; the user's typed one is the trailing text. Assert exactly one token, one raw.
  assert.equal((out.match(/\[\[dice:frozenkey\]\]/g) || []).length, 1, 'exactly one frozen token restored');
  assert.equal((out.match(/\{2d6\}/g) || []).length, 1, 'the other copy stays raw for promotion');
});
test('applyRefold — two pairs map first→first, second→second in order', () => {
  const pairs = [{ sh: '{2d6}', token: '[[dice:k1]]' }, { sh: '{2d6}', token: '[[dice:k2]]' }];
  const out = c.applyRefold('{2d6} and {2d6}', pairs);
  assert.equal(out, '[[dice:k1]] and [[dice:k2]]', 'ordered occurrences map to ordered tokens');
});
test('applyRefold — an edited/removed sh is skipped, later untouched ones still refold', () => {
  const pairs = [{ sh: '{2d6}', token: '[[dice:k1]]' }, { sh: '{1d20}', token: '[[dice:k2]]' }];
  // user deleted the first artifact's text entirely; only {1d20} remains
  const out = c.applyRefold('gone {1d20}', pairs);
  assert.equal(out, 'gone [[dice:k2]]', 'missing sh skipped without consuming the cursor wrongly');
});

// ── childPropNumber: case-insensitive key match (parity with the est twin) ────
test('childPropNumber — property key match is case-insensitive', () => {
  const child = { props: [{ key: 'Cost', val: '5' }] };
  assert.equal(c.childPropNumber(child, 'cost'), 5, 'lowercase ref finds Cost');
  assert.equal(c.childPropNumber(child, 'COST'), 5, 'uppercase ref finds Cost');
});
test('aggregateChildren — sum(Cost) rolls up regardless of ref casing', () => {
  const node = { children: [
    { props: [{ key: 'cost', val: '3' }] },
    { props: [{ key: 'cost', val: '4' }] },
  ] };
  // fn is a string; prop "Cost" must match the "cost" keys case-insensitively
  assert.equal(c.aggregateChildren(node, 'sum', 'Cost'), 7);
});

// ── mkCmdItem escapes label/desc at the sink (stored-XSS via a malicious _seq) ──
// stateCmds builds label:sq.state / desc:`Set the ${sq.name} state.` from attacker-
// controlled sidecar data, and mkCmdItem writes them to info.innerHTML. The escape
// must live at the sink (mkCmdItem touches the DOM, so it can't run in this harness —
// a source pin ties the escape to the specific innerHTML line). If someone re-adds a
// raw ${label}/${desc} into that sink, this fails.
test('mkCmdItem — cmd-label and cmd-desc are escaped at the innerHTML sink', () => {
  const _src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const sink = _src.split('\n').find(l => l.includes('info.innerHTML') && l.includes('cmd-label'));
  assert.ok(sink, 'the cmd-label/cmd-desc innerHTML sink still exists');
  assert.ok(/\$\{escHtml\(label\)\}/.test(sink), 'label must be escHtml-wrapped at the sink');
  assert.ok(/\$\{escHtml\(desc\)\}/.test(sink), 'desc must be escHtml-wrapped at the sink');
  assert.ok(!/\$\{label\}/.test(sink) && !/\$\{desc\}/.test(sink), 'no raw label/desc interpolation survives');
});

// ── renderDicePill: hostile sidecar fields are escaped in body AND aria-label ──
// A malicious OPML can put markup in _dice fields; every sink must escape it. The
// aria-label previously used escQ (quotes-only) — a raw <img>/breakout survived.
test('renderDicePill — a hostile total string is escaped everywhere it appears', () => {
  const d = { key: 'r1', expr: '2d6', total: '<img src=x onerror=alert(1)>', parts: [] };
  const html = c.renderDicePill('r1', d);
  assert.ok(!html.includes('<img src=x'), 'raw markup must not survive in any sink (body or aria-label)');
  assert.ok(html.includes('&lt;img'), 'the total is escaped');
});
test('renderDicePill — a quote-breakout in expr cannot escape the aria-label attribute', () => {
  const d = { key: 'r1', expr: '" onmouseover="alert(1)', total: 0, parts: [] };
  const html = c.renderDicePill('r1', d);
  assert.ok(!html.includes('onmouseover="alert(1)"'), 'the raw handler must not become a live attribute');
  assert.ok(html.includes('&quot;'), 'the injected quote is entity-escaped');
});

// ── typed var declaration: unfold behavior (artifactToShorthand) ──────────────
// A typed {name := expr} declaration unfolds back to editable text (O1); a
// dialog-declared var (no `typed` flag) stays atomic (returns null).
test('artifactToShorthand — typed formula var unfolds to {name := expr}', () => {
  assert.equal(c.artifactToShorthand('var', { key:'k', name:'gold', expr:'50', typed:true }), '{gold := 50}');
});
test('artifactToShorthand — typed pick var unfolds to its source', () => {
  assert.equal(c.artifactToShorthand('var', { key:'k', name:'beast', kind:'pick', expr:'dragon|wyrm', rolled:'wyrm', typed:true }), '{beast := dragon|wyrm}');
});
test('artifactToShorthand — dialog-declared var (no typed flag) stays atomic', () => {
  assert.equal(c.artifactToShorthand('var', { key:'k', name:'foo', expr:'5' }), null);
});
test('artifactToShorthand — display-only var ref unfolds to {name}', () => {
  assert.equal(c.artifactToShorthand('var', { key:'k', name:'foo', expr:'' }), '{foo}');
});

// ── collectVars: global resolution still works after the Stage B refactor ─────
// Positional resolution (varMapAt) reads the module root and is verified live; here we
// pin the GLOBAL path (collectVars over a synthetic tree) so the refactor that extracted
// resolveVarDefs + added the event stream stays behavior-preserving: last declaration wins
// document-wide, vars resolve through evalMath, refs don't affect the value.
const vnode = (key, name, expr, extra = {}) => ({ text: `[[var:${key}]]`, vars: [{ key, name, expr, ...extra }], children: [] });
const vroot = (...kids) => ({ text: '', children: kids });

test('collectVars — single formula var resolves', () => {
  const r = vroot(vnode('k1', 'gold', '50'));
  assert.equal(host(c.collectVars(r))['gold'], 50);
});
test('collectVars — last declaration wins document-wide (global model intact)', () => {
  const r = vroot(vnode('k1', 'x', '5'), vnode('k2', 'x', '9'));
  assert.equal(host(c.collectVars(r))['x'], 9);   // global: last wins, not positional
});
test('collectVars — a var referencing another resolves', () => {
  const r = vroot(vnode('k1', 'r', '4'), vnode('k2', 'area', 'r * 2'));
  assert.equal(host(c.collectVars(r))['area'], 8);
});
test('collectVars — frozen random pick returns its rolled value, never re-rolled', () => {
  const r = vroot(vnode('k1', 'beast', 'dragon|wyrm', { kind: 'pick', rolled: 'dragon' }));
  assert.equal(host(c.collectVars(r))['beast'], 'dragon');
});

// ── sync-safety: reconcileAction (folder-backed write reconciliation) ─────────
// The full safety contract as a truth table. disk<=known → safe to write; disk
// newer → reload if clean, prompt if dirty (genuine divergence).
test('reconcileAction — disk unchanged since last seen → write (safe)', () => {
  assert.equal(c.reconcileAction({ diskModified: 100, knownModified: 100, dirty: true }), 'write');
  assert.equal(c.reconcileAction({ diskModified: 90,  knownModified: 100, dirty: true }), 'write'); // older disk (clock skew) still safe
});
test('reconcileAction — disk newer + no unsaved edits → reload (lossless)', () => {
  assert.equal(c.reconcileAction({ diskModified: 200, knownModified: 100, dirty: false }), 'reload');
});
test('reconcileAction — disk newer + unsaved edits → prompt (divergence)', () => {
  assert.equal(c.reconcileAction({ diskModified: 200, knownModified: 100, dirty: true }), 'prompt');
});
test('reconcileAction — never anchored (known 0/null) → write, nothing to clobber', () => {
  assert.equal(c.reconcileAction({ diskModified: 100, knownModified: 0,    dirty: true }), 'prompt'); // 100>0 with edits → divergence, conservatively prompt
  assert.equal(c.reconcileAction({ diskModified: 0,   knownModified: 0,    dirty: true }), 'write');  // brand-new file, both 0
  assert.equal(c.reconcileAction({ diskModified: 0,   knownModified: null, dirty: false }), 'write');
});

// ── data-safety: switching/creating a folder doc must PERSIST the outgoing one first ──
// (the tab-switch data-loss regression: the debounced folder write was orphaned by the
// swap, so recent edits to the doc you left never reached disk). Src pins — the FS path
// isn't reachable from the vm sandbox.
test('tab switch persists the outgoing folder-backed doc before adopting the new one (src pins)', () => {
  // switchWorkspaceDoc: for a folder-backed dirty doc, cancel the debounce and write it,
  // awaited, before adopting — NOT a discard prompt.
  assert.ok(_src.includes('if (workspaceFile && dirty)'), 'switch must branch on folder-backed + dirty');
  const sw = _src.slice(_src.indexOf('async function switchWorkspaceDoc'), _src.indexOf('async function switchWorkspaceDoc') + 2200);
  assert.ok(sw.includes('clearTimeout(autosaveTimer)'), 'switch must cancel the pending debounce');
  assert.ok(sw.includes('safeWriteOpml(workspaceDir, outName, outOpml)'), 'switch must write the outgoing file directly, awaited');
  assert.ok(sw.includes('adoptDoc('), 'switch still adopts after the flush');
  // adoptDoc cancels any pending timer so an orphaned one can't misfire against the new root.
  const ad = _src.slice(_src.indexOf('function adoptDoc'), _src.indexOf('function adoptDoc') + 800);
  assert.ok(ad.includes('clearTimeout(autosaveTimer)'), 'adoptDoc must cancel the pending autosave');
  // newWorkspaceDoc gets the same flush-not-discard treatment for a folder-backed doc.
  const nw = _src.slice(_src.indexOf('async function newWorkspaceDoc'), _src.indexOf('async function newWorkspaceDoc') + 700);
  assert.ok(nw.includes('safeWriteOpml(workspaceDir, fileName'), 'newWorkspaceDoc must flush the outgoing folder doc');
  // UXP-165: adoptDoc resets the snapshot throttle on a doc swap so the new doc gets a fresh window.
  const ad2 = _src.slice(_src.indexOf('function adoptDoc'), _src.indexOf('function adoptDoc') + 1400);
  assert.ok(ad2.includes('_lastSnapshotAt = 0'), 'adoptDoc must reset the snapshot throttle on doc swap (UXP-165)');
});

test('Restore earlier version is doc-scoped: only the current document\'s snapshot (UXP-165, src pins)', () => {
  // the shared gate parses the prev snapshot and compares its root.docId to the live root.docId,
  // so a snapshot rolled while editing another doc is neither offered nor applied.
  const gate = _src.slice(_src.indexOf('function earlierVersionForCurrentDoc'), _src.indexOf('function earlierVersionForCurrentDoc') + 700);
  assert.ok(gate.includes('d.root.docId') && gate.includes('root.docId'), 'the gate must compare snapshot docId to the live doc');
  assert.ok(gate.includes('!== root.docId') || gate.includes('=== root.docId'), 'the gate must guard on a docId MATCH');
  // both hasEarlierVersion and restoreEarlierVersion route through the one gate (no second raw read).
  assert.ok(_src.includes('function hasEarlierVersion() { return earlierVersionForCurrentDoc() !== null; }'),
    'hasEarlierVersion must delegate to the doc-scoped gate');
  const rest = _src.slice(_src.indexOf('async function restoreEarlierVersion'), _src.indexOf('async function restoreEarlierVersion') + 500);
  assert.ok(rest.includes('earlierVersionForCurrentDoc()'), 'restore must apply only the current doc\'s snapshot');
});

// flashError was referenced by ~10 catch blocks but never defined — an error path threw a
// ReferenceError instead of surfacing the message. Pin that it's now a real function.
test('flashError is defined (error toasts no longer throw)', () => {
  assert.ok(_src.includes('function flashError('), 'flashError must be defined');
  // flashHint re-applies neutral styling each call so a prior error toast does not leak red.
  const fh = _src.slice(_src.indexOf('function flashHint('), _src.indexOf('function flashHint(') + 700);
  assert.ok(fh.includes('el.style.cssText') && fh.indexOf('el.style.cssText') > fh.indexOf('document.body.appendChild'), 'flashHint must reset styling on every call');
});

// ── sync-safety: tmpWriteName (atomic-write temp filename) ────────────────────
test('tmpWriteName — produces a hidden per-write .pltmp sibling, not a .opml (HARD-10)', () => {
  // WAVE-2 HARD-10: the temp name is now per-write-unique (a monotonic suffix) so two racing writers
  // on one file can't collide on a fixed temp. Shape: starts '.', ends '.pltmp', carries the base.
  const t1 = c.tmpWriteName('notes.opml');
  assert.match(t1, /^\.notes\.\d+\.pltmp$/, `hidden .pltmp sibling of the base, got "${t1}"`);
  assert.ok(!/\.opml$/i.test(t1), 'never ends in .opml (would be doc-listed)');
  assert.notEqual(c.tmpWriteName('notes.opml'), t1, 'each call is unique (no fixed-temp collision)');
  assert.match(c.tmpWriteName('Daily Log.opml'), /^\.Daily Log\.\d+\.pltmp$/);
});
// ── file-name display / normalize ────────────────────────────────────────────
test('displayName — strips .opml and maps the unsaved sentinel', () => {
  assert.equal(c.displayName('notes.opml'), 'notes');
  assert.equal(c.displayName('Notes.OPML'), 'Notes');
  assert.equal(c.displayName('unsaved'), 'Untitled');
  assert.equal(c.displayName(''), 'Untitled');
  assert.equal(c.displayName('no-extension'), 'no-extension');
});
test('toFileName — sanitizes and ensures a single .opml', () => {
  assert.equal(c.toFileName('Project notes'), 'Project notes.opml');
  assert.equal(c.toFileName('already.opml'), 'already.opml');
  assert.equal(c.toFileName('  spaced  '), 'spaced.opml');
  assert.equal(c.toFileName(''), 'outline.opml');
  assert.equal(c.toFileName('a/b:c*?'), 'a-b-c--.opml');   // illegal path chars -> dashes
});
test('tmpWriteName — the temp name is NOT listed as a document', () => {
  // critical: a stray/interrupted temp must never appear in the workspace doc list
  const listed = host(c.workspaceDocList(['notes.opml', c.tmpWriteName('notes.opml')]));
  assert.deepEqual(listed, ['notes.opml']);
});

// ── point/selection export (toMarkdown on a synthetic {children:[…]} root) ────
// Export-a-point wraps the selected node(s) in a throwaway root so toMarkdown emits
// the node ITSELF (at depth 0) plus its subtree — the point is included, not just its
// children — and multiple selected points export in order.
test('toMarkdown({children:[point]}) — exports the point itself + its subtree', () => {
  const point = { id:'p1', text:'Session Prep', type:'h2', footnotes:[], props:[], children:[
    { id:'p2', text:'- [ ] Stock the dungeon', type:'todo', footnotes:[], props:[], children:[] },
  ] };
  const md = c.toMarkdown({ children: [point] });
  assert.ok(md.includes('## Session Prep'), 'point itself missing');
  assert.ok(md.includes('- [ ] Stock the dungeon'), 'child subtree missing');
});
test('toMarkdown({children:[a,b]}) — exports a selection of points in order', () => {
  const a = { id:'a', text:'First', type:'ul', footnotes:[], props:[], children:[] };
  const b = { id:'b', text:'Second', type:'ul', footnotes:[], props:[], children:[] };
  const md = c.toMarkdown({ children: [a, b] });
  assert.ok(md.indexOf('First') < md.indexOf('Second'), 'points not emitted in order');
});

// ── bulk checkbox toggle: first-task read/set cores ──────────────────────────
test('firstTaskChecked — reads the opening task box state; null for non-task', () => {
  assert.equal(c.firstTaskChecked({ text: '- [ ] Buy milk' }), false);
  assert.equal(c.firstTaskChecked({ text: '- [x] Done' }), true);
  assert.equal(c.firstTaskChecked({ text: '- [X] Done caps' }), true);
  assert.equal(c.firstTaskChecked({ text: 'Just a point' }), null);
  assert.equal(c.firstTaskChecked({ text: '# A heading' }), null);
});
test('setFirstTaskChecked — sets to a specific state, idempotent', () => {
  const a = { text: '- [ ] Buy milk' };
  assert.equal(c.setFirstTaskChecked(a, true), true);      // changed
  assert.equal(a.text, '- [x] Buy milk');
  assert.equal(c.firstTaskChecked(a), true);
  assert.equal(c.setFirstTaskChecked(a, true), false);     // already checked → no-op
  assert.equal(c.setFirstTaskChecked(a, false), true);     // uncheck
  assert.equal(a.text, '- [ ] Buy milk');
});
test('setFirstTaskChecked — only touches the first line, not later task lines', () => {
  const n = { text: '- [ ] first\n- [ ] second' };
  c.setFirstTaskChecked(n, true);
  assert.equal(n.text, '- [x] first\n- [ ] second');       // second untouched
});

// ═══════════════════════════════════════════════════════════════════════════
// Coverage the load-cores hardening unlocked (const-arrow escapers now callable)
// and high-value invariants the prior suite left unpinned (grammar depth guard,
// the embed round-trip's </script> safety, evalMath's √). These protect the
// security + correctness work from PRs #277/#278.
// ═══════════════════════════════════════════════════════════════════════════

// ── escapers: the foundation of every XSS fix ────────────────────────────────
test('escHtml — escapes & < > (text content)', () => {
  assert.equal(c.escHtml('<img src=x>&'), '&lt;img src=x&gt;&amp;');
  assert.equal(c.escHtml('"'), '"', 'quotes are NOT escaped by escHtml (text-content escaper)');
  assert.equal(c.escHtml(''), '', 'falsy input → empty string, never throws');
});
test('escAttr / escQ — full attribute escape incl. quotes', () => {
  // escQ was upgraded from quotes-only to === escAttr; both must escape "&<>
  assert.equal(c.escAttr('" onmouseover="x'), '&quot; onmouseover=&quot;x');
  assert.equal(c.escQ('<b>"&'), '&lt;b&gt;&quot;&amp;', 'escQ must be the full attribute escaper');
  assert.equal(c.escQ, c.escAttr, 'escQ is aliased to escAttr');
});

// ── diceBreakdownHTML / renderDicePill: hostile sidecar fields are escaped ────
test('diceBreakdownHTML — flat modifier value is HTML-escaped', () => {
  const html = c.diceBreakdownHTML({ total: 0, parts: [{ kind: 'mod', sign: 1, value: '<img onerror=alert(1)>' }] });
  assert.ok(!html.includes('<img'), 'raw <img must not survive');
  assert.ok(html.includes('&lt;img'), 'the value is escaped');
});
test('renderDicePill — a quote-breakout in expr cannot escape the aria-label', () => {
  const html = c.renderDicePill('r1', { key: 'r1', expr: '" onmouseover="alert(1)', total: 0, parts: [] });
  assert.ok(!html.includes('onmouseover="alert(1)"'), 'the raw handler must not become a live attribute');
  assert.ok(html.includes('&quot;'), 'the injected quote is entity-escaped');
});

// ── mdInline: NUL can't forge a stash placeholder; line-level escape holds ────
test('mdInline — literal NUL does not inject a stashed fragment', () => {
  const html = c.mdInline('`x` then \x000\x00 end');
  assert.ok(html.includes('<code>x</code>'), 'the real code span still renders');
  assert.ok(!/\x00/.test(html), 'no NUL survives to the output');
  assert.ok(html.includes('0 end'), 'user text preserved, not replaced by the stashed code span');
});
test('mdInline — angle brackets in plain text are escaped at entry', () => {
  const html = c.mdInline('a <script>b</script> c');
  assert.ok(!html.includes('<script>'), 'raw <script> must not survive');
  assert.ok(html.includes('&lt;script&gt;'), 'escaped at the line-level pass');
});

// ── grammar: BOTH guards (cycle ↻ AND runaway depth …) ───────────────────────
// runGrammar(rulesText, startRule, docRules) — pass {} for docRules to isolate
// from the live document. The cycle guard fires on a self/mutual reference; the
// depth guard needs a NON-cyclic chain longer than the 200 limit (distinct names).
test('runGrammar — a self-referencing rule hits the cycle guard (↻)', () => {
  assert.equal(c.runGrammar('a: {a}', 'a', {}), '↻');
});
test('runGrammar — mutual recursion hits the cycle guard (↻)', () => {
  assert.equal(c.runGrammar('a: {b}\nb: {a}', 'a', {}), '↻');
});
test('runGrammar — a non-cyclic chain past depth 200 hits the depth guard (…)', () => {
  const lines = [];
  for (let i = 0; i < 260; i++) lines.push(`r${i}: {r${i + 1}}`);
  lines.push('r260: end');
  assert.equal(c.runGrammar(lines.join('\n'), 'r0', {}), '…', 'deep-but-finite → depth marker, not a stack overflow');
});
test('runGrammar — the guards do not fire on ordinary shallow rules', () => {
  assert.equal(c.runGrammar('color: red|red', 'color', {}), 'red');
});

// ── self-contained HTML export: OPML round-trips inside a <script> island even
//    when node text contains a literal </script> (the C1 safety invariant) ────
test('embedOpmlIntoHtml/extractEmbeddedOpml — </script> in node text round-trips', () => {
  const root = c.mkRoot();
  const n = c.mkNode();
  n.text = 'danger </script><img src=x onerror=alert(1)>';
  root.children.push(n);
  const opml = c.toOpml(root);
  assert.ok(!opml.includes('</script>'), 'toOpml must not emit a literal </script> (< > become entities)');
  const shell = '<html><body><script type="application/xml" id="pl-embedded-doc"></script></body></html>';
  const back = c.extractEmbeddedOpml(c.embedOpmlIntoHtml(shell, opml));
  assert.equal(back, opml, 'the embedded OPML round-trips byte-for-byte');
});

// ── evalMath: the √ unary operator (documented, previously unpinned) ─────────
test('evalMath — √ unary operator', () => {
  assert.equal(c.evalMath('√9'), 3);
  assert.equal(c.evalMath('√(4+5)'), 3, '√ binds tighter than nothing inside parens');
  assert.equal(c.evalMath('2*√9'), 6, '√ composes with arithmetic');
});

// ── collectRules explicit-root bypasses the per-generation cache (parity with
//    the existing collectVars pin) ────────────────────────────────────────────
test('collectRules — an explicit root walks that tree, bypassing the live cache', () => {
  const root = c.mkRoot();
  const n = c.mkNode();
  n.text = '[[grammar:g1]]';
  n.grammar = [{ key: 'g1', def: 'color: blue', origin: '', result: 'blue' }];
  root.children.push(n);
  const rules = c.collectRules(root);
  assert.ok(rules && rules.color, 'the explicit root\'s rule is collected from the passed tree');
});

// ─────────────────────────────────────────────────────────────────────────────
// Design-language drift guards (July 2026 audit hardening).
// These pin the mechanically checkable rules from guidance/design-language.md,
// ux-discipline.md and accessibility.md so the defect classes closed as
// UXP-71…100 cannot silently return. They read index.html as TEXT (no vm
// sandbox). A failure almost always points at the change just made, not at the
// guard; relax a pin only when the guideline itself is amended in the same
// commit.
// (readFileSync is already imported at the top of this file.)

const RAW_HTML = readFileSync(
  process.env.POINTLINER_HTML || new URL('../index.html', import.meta.url), 'utf8');
// comment-stripped view: HTML comments, /*…*/ blocks, and //-to-EOL (the (?<!:)
// guard spares https:// URLs). Comments are exempt from the copy rules.
const NC = RAW_HTML
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(?<!:)\/\/[^\n]*/g, '');
const CSS_TEXT = [...RAW_HTML.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');

const propNames = s => new Set([...s.matchAll(/--[\w-]+(?=\s*:)/g)].map(m => m[0]));
const setDiff = (a, b) => [...a].filter(x => !b.has(x)).sort();

test('drift guard: dual-home token parity (design-language §3)', () => {
  // The palette lives in two homes: every token themed in the CSS dark block
  // must also live in BOTH applyTheme forced-theme strings, and vice versa.
  // (The applyTheme strings open ":root{color-scheme:…" with no whitespace, so
  // the regex cannot match the multi-line CSS blocks.)
  const cssDark = CSS_TEXT.match(/@media\(prefers-color-scheme:dark\)\{:root\{([\s\S]*?)\}\}/)[1];
  const cssLight = CSS_TEXT.match(/:root\{([\s\S]*?)\}/)[1];
  const jsDark = RAW_HTML.match(/:root\{color-scheme:dark;([^}]*)\}/)[1];
  const jsLight = RAW_HTML.match(/:root\{color-scheme:light;([^}]*)\}/)[1];
  // applyAccentCSS owns the accent-derived tokens; they are exempt from the
  // applyTheme strings by design.
  const ACCENT = new Set(['--acc', '--acc-fg', '--ring', '--bullet-h', '--qbdr']);
  const cssDarkProps = new Set([...propNames(cssDark)].filter(p => !ACCENT.has(p)));
  const jsDarkProps = propNames(jsDark), jsLightProps = propNames(jsLight);
  assert.deepEqual(setDiff(cssDarkProps, jsDarkProps), [],
    'themed in the CSS dark block but missing from the applyTheme dark string');
  assert.deepEqual(setDiff(jsDarkProps, cssDarkProps), [],
    'in the applyTheme dark string but missing from the CSS dark block');
  assert.deepEqual(setDiff(jsDarkProps, jsLightProps), [], 'applyTheme dark/light strings disagree');
  assert.deepEqual(setDiff(jsLightProps, jsDarkProps), [], 'applyTheme light/dark strings disagree');
  assert.deepEqual(setDiff(jsLightProps, propNames(cssLight)), [],
    'in the applyTheme strings but missing from the :root light home');
});

test('UXP-191: the base font is rem, not px, so the browser font-size preference is honored (P3-3)', () => {
  // a bare px root silently overrides the user's browser default-font-size setting (the primary
  // low-vision control). rem inherits it. pin the intent so a future edit can't regress to px.
  // the base rule is the bare `body{...}` (not .guide-entry-body, not body.zoomed)
  const bodyRule = CSS_TEXT.match(/[^-\w]body\{[^}]*\bfont-size:([^;]+);/);
  assert.ok(bodyRule, 'base body font-size rule not found');
  // 1.0625rem == 17px at the default 16px root (byte-identical default) but honors the browser pref
  assert.equal(bodyRule[1].trim(), '1.0625rem', `base font must be rem, got "${bodyRule[1]}"`);
});

test('UXP-101: a live prefers-color-scheme change re-applies the theme on System', () => {
  // the accent-derived tokens (applyAccentCSS) must follow an OS theme flip live, not go stale
  // until reload. One subscription beside the boot applyTheme(), gated on forcedTheme === null.
  assert.ok(RAW_HTML.includes("matchMedia('(prefers-color-scheme:dark)').addEventListener('change'"),
    'no live prefers-color-scheme listener (UXP-101)');
  assert.ok(/addEventListener\('change', \(\) => \{ if \(forcedTheme === null\) applyTheme\(\); \}\)/.test(RAW_HTML),
    'the listener must re-run applyTheme only on System (forcedTheme === null)');
});

test('drift guard: border radii come from the token set (design-language §4)', () => {
  // Sanctioned literals: 2px inline marks (.md-hl/mark), 4px keycaps + badges
  // (the documented --r-xs+1) and scrollbar thumbs, 50% the accent-swatch disc,
  // 999px the pill silhouette, and 0.
  // 1px: sub-perceptual icon geometry (the .bullet-base-ic bars).
  const SANCTIONED = new Set(['1px', '2px', '4px', '50%', '999px', '0']);
  const bad = [];
  for (const m of NC.matchAll(/border-radius:([^;}'"]+)/g)) {
    const v = m[1].trim();
    if (v.includes('var(--r-') || SANCTIONED.has(v)) continue;
    bad.push(v);
  }
  assert.deepEqual(bad, [], 'off-token border-radius literals');
});

// rule-aware CSS view: [{sel, body}] with @font-face bodies dropped, so the
// weight/size guards can exempt by selector. JS-set styles (cssText strings)
// are scanned separately below.
const CSS_RULES = [...CSS_TEXT.replace(/@font-face\s*\{[^}]*\}/g, '')
  .matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
const JS_TEXT = NC.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');

test('drift guard: no text weight above 700 (design-language §4 weight set)', () => {
  // Icon-font weight SELECTION is exempt: @font-face descriptors (stripped)
  // and rules that pick a Font Awesome face (.fa-solid, glyph ::before).
  const bad = [];
  for (const r of CSS_RULES) {
    if (r.body.includes('Font Awesome')) continue;
    for (const m of r.body.matchAll(/font-weight:\s*(\d+)/g))
      if (+m[1] > 700) bad.push(`${r.sel} ${m[0]}`);
  }
  for (const m of JS_TEXT.matchAll(/font-weight:\s*(\d+)/g))
    if (+m[1] > 700) bad.push(`js ${m[0]}`);
  assert.deepEqual(bad, [], 'text font-weight above the 700 ceiling');
});

test('drift guard: no informational text below the 10px floor (design-language §4)', () => {
  // The standard floor is 11px, with caps+tracking earning 10px for labels;
  // nothing may render TEXT below 10px. Glyph-only affordances (pictographic
  // arrows, no words) are exempt by selector; extending this list is a
  // deliberate decision, not a default.
  const GLYPH_ONLY = ['.collapse-btn', '.tp-twist'];
  const bad = [];
  for (const r of CSS_RULES) {
    if (GLYPH_ONLY.some(g => r.sel.includes(g))) continue;
    for (const m of r.body.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g))
      if (+m[1] < 10) bad.push(`${r.sel} ${m[0]}`);
  }
  for (const m of JS_TEXT.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g))
    if (+m[1] < 10) bad.push(`js ${m[0]}`);
  assert.deepEqual(bad, [], 'font-size below the 10px floor');
});

test('drift guard: no em dashes in user-facing copy (CLAUDE.md ban)', () => {
  // The only sanctioned occurrences are content glyphs written as the
  // standalone quoted string '—' (divider icon, empty-value placeholders, the
  // spent-deck marker, the undefined-variable display). Prose em dashes inside
  // longer strings fail this shape.
  // Occurrence-based: erase the sanctioned standalone-glyph form first, then
  // ANY surviving em dash is an offense (a prose dash sharing a line with a
  // sanctioned glyph still trips).
  const offenders = NC.replaceAll("'—'", "''").split('\n')
    .map((l, i) => [i + 1, l.trim().slice(0, 80)])
    .filter(([, l]) => l.includes('—'));
  assert.deepEqual(offenders, [], 'em dash outside a sanctioned quoted content glyph');
});

// ── emoji picker filter (UXP-106) ────────────────────────────────────────────
const EMOJI_FIXTURE = { fire:'🔥', heart:'❤️', heart_eyes:'😍', thumbsup:'👍', '+1':'👍' };

test('filterEmojiCandidates — prefix match, name-and-glyph shape', () => {
  const out = host(c.filterEmojiCandidates('hea', EMOJI_FIXTURE));
  assert.deepEqual(out, [{ name: 'heart', glyph: '❤️' }, { name: 'heart_eyes', glyph: '😍' }]);
});

test('filterEmojiCandidates — empty prefix returns the whole (deduped) set', () => {
  const names = host(c.filterEmojiCandidates('', EMOJI_FIXTURE)).map(e => e.name);
  // +1 shares 👍 with thumbsup, so the later alias is dropped: first-alias-wins.
  assert.deepEqual(names, ['fire', 'heart', 'heart_eyes', 'thumbsup']);
});

test('filterEmojiCandidates — glyph aliases dedupe to the first name', () => {
  const out = host(c.filterEmojiCandidates('thumb', EMOJI_FIXTURE));
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'thumbsup');   // +1 (same 👍) suppressed
});

test('filterEmojiCandidates — an exact complete self-match suppresses the menu', () => {
  // typing the finished `:fire` must not hang a one-item menu over itself
  assert.deepEqual(host(c.filterEmojiCandidates('fire', EMOJI_FIXTURE)), []);
});

test('filterEmojiCandidates — case-insensitive prefix', () => {
  assert.deepEqual(host(c.filterEmojiCandidates('HEART', EMOJI_FIXTURE)).map(e => e.name),
    ['heart', 'heart_eyes']);
});

test('filterEmojiCandidates — no match is an empty list', () => {
  assert.deepEqual(host(c.filterEmojiCandidates('zzz', EMOJI_FIXTURE)), []);
});

// ── priority: search + agenda rollup (UXP-109) ───────────────────────────────
const SEQS = [{ states: ['TODO', 'NEXT', 'WAITING', 'DONE'], heldFrom: 2, doneFrom: 3 }];  // the default sequence shape: active(TODO,NEXT) | held(WAITING) | done(DONE)  (UXP-158)

test('priorityRank — A < B < C < none', () => {
  assert.equal(c.priorityRank('A'), 0);
  assert.equal(c.priorityRank('B'), 1);
  assert.equal(c.priorityRank('c'), 2);   // case-insensitive
  assert.equal(c.priorityRank(null), 99); // no priority sorts last
});

test('parseSearchQuery — priority:A is its own term, not a prop lookup', () => {
  const terms = host(c.parseSearchQuery('priority:a'));
  assert.equal(terms.length, 1);
  assert.equal(terms[0].kind, 'priority');
  assert.equal(terms[0].value, 'A');       // stored uppercase
});

test('parseSearchQuery — a non-single-letter priority: falls back to a prop lookup', () => {
  // priority:high is not a valid [#X] marker, so it is NOT a priority term; it stays a
  // generic key:value prop filter (which simply won't match a real priority, by design).
  const terms = host(c.parseSearchQuery('priority:high'));
  assert.equal(terms[0].kind, 'prop');
});

test('termMatchesNode — priority:A matches a #TODO [#A] point, not [#B] or a plain point', () => {
  const pri = (text, val) => c.termMatchesNode({ kind: 'priority', value: val }, { text }, SEQS);
  assert.equal(pri('#TODO [#A] ship it', 'A'), true);
  assert.equal(pri('#TODO [#B] later', 'A'), false);
  assert.equal(pri('#NEXT [#A] soon', 'A'), true);   // any recognized state, not just TODO
  assert.equal(pri('just a plain point', 'A'), false);
  assert.equal(pri('#TODO no priority here', 'A'), false);
});

test('priority:none / priority:any — the presence axis, todo-gated (UXP-183)', () => {
  assert.deepEqual(host(c.parseSearchQuery('priority:none'))[0], { neg: false, kind: 'priority', value: 'none' });
  assert.deepEqual(host(c.parseSearchQuery('priority:any'))[0],  { neg: false, kind: 'priority', value: 'any' });
  const m = (text, val) => c.termMatchesNode({ kind: 'priority', value: val }, { text }, SEQS);
  // none = a to-do WITHOUT a priority
  assert.equal(m('#TODO unprioritized', 'none'), true);
  assert.equal(m('#TODO [#A] has one', 'none'), false);
  // any = a to-do WITH a priority
  assert.equal(m('#TODO [#B] has one', 'any'), true);
  assert.equal(m('#NEXT no priority', 'any'), false);
  // both are TODO-gated: a plain non-todo line matches neither (priority is a todo dimension)
  assert.equal(m('just a plain note', 'none'), false);
  assert.equal(m('just a plain note', 'any'), false);
  // a bare task line with no priority counts as none (actionable, unprioritized)
  assert.equal(m('- [ ] a task', 'none'), true);
});

test('collectDueDates — carries priority and sorts higher priority first within a day', () => {
  const day = '2099-01-15';
  const root = { children: [
    { id: 'lo', text: '#TODO [#C] low',  props: [{ key: 'due', val: day }], children: [] },
    { id: 'hi', text: '#TODO [#A] high', props: [{ key: 'due', val: day }], children: [] },
    { id: 'mid', text: '#TODO no-pri',   props: [{ key: 'due', val: day }], children: [] },
  ] };
  const items = host(c.collectDueDates(root));
  assert.deepEqual(items.map(i => i.id), ['hi', 'lo', 'mid']);   // A, C, then none
  assert.equal(items[0].priority, 'A');
  assert.equal(items[2].priority, null);
});

// ── collectActions (UXP-112) ─────────────────────────────────────────────────
test('collectActions — undated to-dos only; dated ones and non-todos are excluded', () => {
  const root = { children: [
    { id: 'dated', text: '#TODO with a date', props: [{ key: 'due', val: '2099-01-01' }], children: [] },
    { id: 'action1', text: '#NEXT [#B] call the vet', props: [], children: [] },
    { id: 'action2', text: '- [ ] buy milk', props: [], children: [] },
    { id: 'prose', text: 'just a note, not a task', props: [], children: [] },
    { id: 'done', text: '#DONE shipped it', props: [], children: [] },
  ] };
  const items = host(c.collectActions(root, SEQS));
  // dated excluded, prose excluded; action1/action2 live, done included but sinks last
  assert.deepEqual(items.map(i => i.id), ['action1', 'action2', 'done']);
  assert.equal(items[0].priority, 'B');
  assert.equal(items.find(i => i.id === 'done').done, true);
});

test('collectActions — live actions sort before done, higher priority first', () => {
  const root = { children: [
    { id: 'noPri', text: '#TODO no priority', props: [], children: [] },
    { id: 'hiPri', text: '#TODO [#A] urgent', props: [], children: [] },
    { id: 'doneItem', text: '#DONE finished', props: [], children: [] },
  ] };
  const items = host(c.collectActions(root, SEQS));
  assert.deepEqual(items.map(i => i.id), ['hiPri', 'noPri', 'doneItem']);
});

// ── bulk-refile selection roots (UXP-133) ────────────────────────────────────
test('selectionRoots — drops a selected node that has a selected ancestor', () => {
  // tree: A > B > C ; D (sibling). parentMap: A→null, B→A, C→B, D→null
  const nodeA = {id:'A'}, nodeB = {id:'B'}, nodeD = {id:'D'};
  const pmap = new Map([['A', null], ['B', nodeA], ['C', nodeB], ['D', null]]);
  // select A, C, D: C is under A (selected), so it drops; A and D are roots.
  const roots = host(c.selectionRoots(new Set(['A','C','D']), pmap)).sort();
  assert.deepEqual(roots, ['A','D']);
});

test('selectionRoots — non-overlapping selections are all roots', () => {
  const pmap = new Map([['A', null], ['B', null], ['C', {id:'A'}]]);
  // select B and C: B is a root, C's parent A is NOT selected, so C is a root too.
  assert.deepEqual(host(c.selectionRoots(new Set(['B','C']), pmap)).sort(), ['B','C']);
});

test('collectActions — WAITING is blocked: captured, flagged, and sorted after live NEXT/TODO (UXP-129)', () => {
  const root = { children: [
    { id: 'wait', text: '#WAITING [#A] blocked on a reply', props: [], children: [] },
    { id: 'next', text: '#NEXT do this now', props: [], children: [] },
    { id: 'done', text: '#DONE shipped', props: [], children: [] },
  ] };
  const items = host(c.collectActions(root, SEQS));
  // live (next) → waiting → done, even though waiting has priority A (blocked outranks nothing)
  assert.deepEqual(items.map(i => i.id), ['next', 'wait', 'done']);
  const w = items.find(i => i.id === 'wait');
  assert.equal(w.keyword, 'WAITING');
  assert.equal(w.waiting, true);
  assert.equal(items.find(i => i.id === 'next').waiting, false);
});
// Helper: sum the Yes-family vs No-family weights from a swing body, to assert the split
// tracks the plain oracle's band ratio rather than the old flat-weight-1 dilution.
function swingFamilies(body) {
  const alts = body.split('|').map(s => s.trim());
  let yes = 0, no = 0;
  for (const a of alts) {
    const m = a.match(/^(Yes|No)[^0-9]*(\d+)$/);
    if (!m) continue;
    if (m[1] === 'Yes') yes += +m[2]; else no += +m[2];
  }
  return { yes, no, yesPct: Math.round(100 * yes / (yes + no)) };
}

test('oracleSwingBody — six ordered options in the fixed order', () => {
  const alts = c.oracleSwingBody(3, 1).split('|').map(s => s.trim().replace(/\s+\d+$/, ''));
  assert.deepEqual(alts, ['Yes, and', 'Yes', 'Yes, but', 'No, but', 'No', 'No, and']);
});

test('oracleSwingBody — an Even band is symmetric', () => {
  const f = swingFamilies(c.oracleSwingBody(1, 1));
  assert.equal(f.yes, f.no);
  assert.equal(f.yesPct, 50);
});

test('oracleSwingBody — the family split tracks the plain oracle band (UXP-124)', () => {
  // plain oracle: Likely = Yes 3 | No 1 = 75% Yes; the swing must land at the same lean,
  // not the old flat-weight dilution (which made Likely-swing ~57% Yes).
  assert.equal(swingFamilies(c.oracleSwingBody(3, 1)).yesPct, 75);   // Likely
  assert.equal(swingFamilies(c.oracleSwingBody(19, 1)).yesPct, 95);  // Certain
  assert.equal(swingFamilies(c.oracleSwingBody(1, 3)).yesPct, 25);   // Unlikely
});

test('oracleSwingBody — every arm is a nonzero weight (a swing still swings)', () => {
  // even at the extreme Certain band, the weak No side keeps nonzero twist arms
  for (const a of c.oracleSwingBody(19, 1).split('|')) {
    const w = +a.trim().match(/\d+$/)[0];
    assert.ok(w >= 1, `arm "${a.trim()}" should be >= 1`);
  }
});

// ── is:scheduled / is:unscheduled (UXP-113) ──────────────────────────────────
test('parseSearchQuery — is:scheduled and is:unscheduled are recognized is: values', () => {
  assert.equal(host(c.parseSearchQuery('is:scheduled'))[0].value, 'scheduled');
  assert.equal(host(c.parseSearchQuery('is:unscheduled'))[0].value, 'unscheduled');
  // a bogus is: value falls through to plain text (the reserved-prefix rule)
  assert.equal(host(c.parseSearchQuery('is:nonsense'))[0].kind, 'text');
});

test('termMatchesNode — is:scheduled matches a dated point; is:unscheduled its complement', () => {
  const sched   = { props: [{ key: 'due', val: '2099-03-01' }] };
  const started = { props: [{ key: 'start', val: 'today' }] };
  const bad     = { props: [{ key: 'due', val: 'not-a-date' }] };   // unparseable → not scheduled
  const bare    = { text: 'no dates here' };
  const isSched = n => c.termMatchesNode({ kind: 'is', value: 'scheduled' }, n, SEQS);
  const isUnsch = n => c.termMatchesNode({ kind: 'is', value: 'unscheduled' }, n, SEQS);
  assert.equal(isSched(sched), true);
  assert.equal(isSched(started), true);   // start counts, not just due
  assert.equal(isSched(bad), false);      // an invalid date does not schedule
  assert.equal(isSched(bare), false);
  assert.equal(isUnsch(bare), true);      // complement
  assert.equal(isUnsch(sched), false);
});

test('termMatchesNode — is:overdue spans due and start, and excludes done (UXP-130)', () => {
  const isOverdue = n => c.termMatchesNode({ kind: 'is', value: 'overdue' }, n, SEQS);
  const PAST = '1990-01-01', FUTURE = '2099-01-01';
  // a not-done point past its DUE deadline → overdue
  assert.equal(isOverdue({ text: '#TODO late', props: [{ key: 'due', val: PAST }] }), true);
  // a not-done STARTED-but-undeadlined slip (start past, no due) → overdue (the axis due:overdue misses)
  assert.equal(isOverdue({ text: '#TODO started long ago', props: [{ key: 'start', val: PAST }] }), true);
  // a future due → not overdue
  assert.equal(isOverdue({ text: '#TODO soon', props: [{ key: 'due', val: FUTURE }] }), false);
  // a DONE point past its deadline → never overdue
  assert.equal(isOverdue({ text: '#DONE finished', props: [{ key: 'due', val: PAST }] }), false);
  // due present + past wins even if start is future (deadline drives)
  assert.equal(isOverdue({ text: '#TODO x', props: [{ key: 'due', val: PAST }, { key: 'start', val: FUTURE }] }), true);
  // a past start but a future due → NOT overdue (the deadline, the due, isn't passed yet)
  assert.equal(isOverdue({ text: '#TODO x', props: [{ key: 'start', val: PAST }, { key: 'due', val: FUTURE }] }), false);
  // no dates → not overdue
  assert.equal(isOverdue({ text: '#TODO no dates' }), false);
});

test('termMatchesNode — is:held matches a point in its sequence\'s held band, seq-agnostic (UXP-171)', () => {
  // SEQS: default To-do has heldFrom:2 (WAITING), plus a custom Flow with BLOCKED held
  const SEQ2 = [
    { key: 'default', name: 'To-do', states: ['TODO', 'NEXT', 'WAITING', 'DONE'], heldFrom: 2, doneFrom: 3 },
    { key: 'flow', name: 'Flow', states: ['DOING', 'BLOCKED', 'SHIPPED'], heldFrom: 1, doneFrom: 2 },
  ];
  const isHeld = n => c.termMatchesNode({ kind: 'is', value: 'held' }, n, SEQ2);
  assert.equal(isHeld({ text: '#WAITING built-in held' }), true);   // built-in held band
  assert.equal(isHeld({ text: '#BLOCKED custom held' }), true);     // custom sequence's held band
  assert.equal(isHeld({ text: '#TODO active' }), false);            // active
  assert.equal(isHeld({ text: '#DONE finished' }), false);         // done, not held
  assert.equal(isHeld({ text: 'no keyword here' }), false);        // no recognized state
});

// ── spaced key:value search (UXP-131) ────────────────────────────────────────
test('parseSearchQuery — key:"spaced value" is ONE token, a contains prop filter', () => {
  const terms = host(c.parseSearchQuery('owner:"Jane Doe"'));
  assert.equal(terms.length, 1);
  assert.deepEqual({ kind: terms[0].kind, key: terms[0].key, value: terms[0].value, contains: terms[0].contains },
    { kind: 'prop', key: 'owner', value: 'jane doe', contains: true });
});

test('parseSearchQuery — single quotes work too; is:"x" stays reserved (not a prop)', () => {
  assert.equal(host(c.parseSearchQuery(`area:'Home Renovation'`))[0].value, 'home renovation');
  // is: is reserved; is:"foo" must NOT become a prop filter
  assert.notEqual(host(c.parseSearchQuery('is:"foo"'))[0].kind, 'prop');
});

test('parseSearchQuery — the bare key:value form is unchanged (exact, no contains)', () => {
  const t = host(c.parseSearchQuery('owner:zeo'))[0];
  assert.equal(t.kind, 'prop'); assert.equal(t.value, 'zeo');
  assert.ok(!t.contains);   // bare form is exact-equals
});

test('parseSearchQuery — a bare phrase and a bare word still tokenize normally', () => {
  const terms = host(c.parseSearchQuery('"a b" plain'));
  assert.deepEqual(terms.map(t => [t.kind, t.value]), [['text', 'a b'], ['text', 'plain']]);
});

test('searchWorkspace — flags .capped when the result set hits the cap (UXP-146)', () => {
  // a doc of N matching points under one other doc; current doc is excluded
  const mkDoc = (n) => ({ id: 'r', children: Array.from({ length: n }, (_, i) => ({ id: 'n' + i, text: 'apple ' + i, children: [] })) });
  const index = { roots: new Map([['other', mkDoc(60)]]), nameByDocId: new Map([['other', 'Other']]) };
  // read the raw return (not host()/JSON-normalized — that would drop the array's .capped property)
  const capped = c.searchWorkspace('apple', index, 'current', 50);
  assert.equal(capped.length, 50, 'stops at the cap');
  assert.equal(capped.capped, true, 'signals truncation');
  // under the cap → no flag
  const small = { roots: new Map([['other', mkDoc(5)]]), nameByDocId: new Map([['other', 'Other']]) };
  const few = c.searchWorkspace('apple', small, 'current', 50);
  assert.equal(few.length, 5);
  assert.ok(!few.capped, 'no truncation flag under the cap');
});

test('termMatchesNode — a quoted prop matches by contains; bare matches exact', () => {
  const node = { props: [{ key: 'area', val: 'Home Renovation' }] };
  // quoted: contains a substring
  assert.equal(c.termMatchesNode({ kind: 'prop', key: 'area', value: 'renovation', contains: true }, node, SEQS), true);
  // bare exact: a substring does NOT match
  assert.equal(c.termMatchesNode({ kind: 'prop', key: 'area', value: 'renovation' }, node, SEQS), false);
  // bare exact: the full (lowercased) value DOES match
  assert.equal(c.termMatchesNode({ kind: 'prop', key: 'area', value: 'home renovation' }, node, SEQS), true);
});

// ── QX-1: is:/has: structural + artifact + symmetry filters ───────────────
const isM = (val, node) => c.termMatchesNode({ kind: 'is', value: val }, node, SEQS);
const hasM = (val, node) => c.termMatchesNode({ kind: 'has', value: val }, node, SEQS);

test('QX-1 parseSearchQuery — the new is: verbs tokenize as is: terms, not text', () => {
  for (const v of ['passing', 'pill', 'random', 'leaf', 'parent', 'collapsed', 'expanded']) {
    const t = host(c.parseSearchQuery('is:' + v))[0];
    assert.equal(t.kind, 'is', v);
    assert.equal(t.value, v, v);
  }
  // an unknown is: verb stays a literal text term (the escape-hatch rule)
  assert.equal(host(c.parseSearchQuery('is:banana'))[0].kind, 'text');
});

test('QX-1 is:passing / is:leaf / is:parent / is:collapsed / is:expanded', () => {
  // is:passing requires an actual passing check; distinct from -is:failing
  const passing = { text: '', props: [{ key: 'check', val: '1 < 2' }] };
  const failing = { text: '', props: [{ key: 'check', val: '2 < 1' }] };
  const noCheck = { text: 'plain' };
  assert.equal(isM('passing', passing), true);
  assert.equal(isM('passing', failing), false);
  assert.equal(isM('passing', noCheck), false);            // check-less is NOT passing
  assert.equal(isM('failing', noCheck), false);            // ...nor failing: so -is:failing != is:passing
  // structure
  const leaf = { text: 'x', children: [] };
  const parent = { text: 'x', children: [{ id: '1' }] };
  assert.equal(isM('leaf', leaf), true);
  assert.equal(isM('parent', leaf), false);
  assert.equal(isM('leaf', parent), false);
  assert.equal(isM('parent', parent), true);
  // fold state
  assert.equal(isM('collapsed', { text: 'x', collapsed: true }), true);
  assert.equal(isM('expanded', { text: 'x', collapsed: true }), false);
  assert.equal(isM('expanded', { text: 'x', collapsed: false }), true);
  assert.equal(isM('expanded', { text: 'x' }), true);      // undefined collapsed reads as expanded
});

test('QX-1 is:pill and is:random over the sidecar arrays', () => {
  const bare = { text: 'x' };
  assert.equal(isM('pill', bare), false);
  assert.equal(isM('random', bare), false);
  for (const k of ['dice', 'markov', 'math', 'grammar', 'est', 'vars', 'seq']) {
    const n = { text: 'x', [k]: [{ key: 'a' }] };
    assert.equal(isM('pill', n), true, 'pill sees ' + k);
  }
  // random is the generative subset: dice/markov/grammar/est, plus a pick var
  assert.equal(isM('random', { text: 'x', dice: [{ key: 'a' }] }), true);
  assert.equal(isM('random', { text: 'x', grammar: [{ key: 'a' }] }), true);
  assert.equal(isM('random', { text: 'x', math: [{ key: 'a' }] }), false);   // static math excluded
  assert.equal(isM('random', { text: 'x', vars: [{ key: 'a', kind: 'formula' }] }), false); // display-only var excluded
  assert.equal(isM('random', { text: 'x', vars: [{ key: 'a', kind: 'pick' }] }), true);     // a pick var IS random
});

test('QX-1 has:<sidecar> and has:children / has:footnote, with props fall-through', () => {
  assert.equal(hasM('dice', { dice: [{ key: 'a' }] }), true);
  assert.equal(hasM('var', { vars: [{ key: 'a' }] }), true);   // token 'var' -> field 'vars'
  assert.equal(hasM('seq', { seq: [{ key: 'a' }] }), true);
  assert.equal(hasM('dice', { dice: [] }), false);             // empty sidecar
  assert.equal(hasM('children', { children: [{ id: '1' }] }), true);
  assert.equal(hasM('children', { children: [] }), false);
  assert.equal(hasM('footnote', { footnotes: [{ key: 'a' }] }), true);
  assert.equal(hasM('footnote', { footnotes: [] }), false);
  // the has:<propkey> contract survives: a user property keyed 'dice' still matches
  // (empty sidecar, so the fall-through property scan runs)
  assert.equal(hasM('dice', { dice: [], props: [{ key: 'dice', val: 'yes' }] }), true);
  // and a plain property still matches as before
  assert.equal(hasM('owner', { props: [{ key: 'owner', val: 'zeo' }] }), true);
  assert.equal(hasM('owner', { props: [] }), false);
});

// ── QX-2/147: relative date windows + var: declaration lookup ─────────────
test('QX-2 parseSearchQuery — due:week/month become op:window; < / > and bad values unaffected', () => {
  const today = c.dueDateToday();
  const wk = host(c.parseSearchQuery('due:week'))[0];
  assert.equal(wk.kind, 'due'); assert.equal(wk.op, 'window'); assert.equal(wk.epochDay, today + 7);
  const mo = host(c.parseSearchQuery('start:month'))[0];
  assert.equal(mo.kind, 'start'); assert.equal(mo.op, 'window'); assert.equal(mo.epochDay, today + 30);
  // an explicit bound is NOT a window (< / > keep their compare meaning)
  assert.equal(host(c.parseSearchQuery('due:<week'))[0].kind, 'text');  // 'week' is not a date, so <week falls to text
  // overdue still wins
  assert.equal(host(c.parseSearchQuery('due:overdue'))[0].op, 'overdue');
});

test('QX-2 termMatchesNode — due:week matches today..today+7 inclusive, not before/after', () => {
  const today = c.dueDateToday();
  const iso = ep => c.formatEpochDays(ep);
  const dueTerm = host(c.parseSearchQuery('due:week'))[0];
  const node = d => ({ props: [{ key: 'due', val: iso(d) }] });
  assert.equal(c.termMatchesNode(dueTerm, node(today), SEQS), true);       // today: in
  assert.equal(c.termMatchesNode(dueTerm, node(today + 7), SEQS), true);    // +7: inclusive end
  assert.equal(c.termMatchesNode(dueTerm, node(today + 8), SEQS), false);   // +8: past the window
  assert.equal(c.termMatchesNode(dueTerm, node(today - 1), SEQS), false);   // yesterday: before today
  assert.equal(c.termMatchesNode(dueTerm, { props: [] }, SEQS), false);     // undated
  // start:month over the start key
  const startTerm = host(c.parseSearchQuery('start:month'))[0];
  assert.equal(c.termMatchesNode(startTerm, { props: [{ key: 'start', val: iso(today + 30) }] }, SEQS), true);
  assert.equal(c.termMatchesNode(startTerm, { props: [{ key: 'start', val: iso(today + 31) }] }, SEQS), false);
});

test('QX-3 var:NAME parses and matches the DECLARING point, not a reference pill', () => {
  const t = host(c.parseSearchQuery('var:strength'))[0];
  assert.equal(t.kind, 'var'); assert.equal(t.value, 'strength');
  const varM = (name, node) => c.termMatchesNode({ kind: 'var', value: name }, node, SEQS);
  // a declaration has a truthy expr
  assert.equal(varM('strength', { vars: [{ name: 'strength', expr: '10' }] }), true);
  assert.equal(varM('strength', { vars: [{ name: 'Strength', expr: 'pi*r' }] }), true);   // case-insensitive
  // a display-only reference pill has an empty expr, so it does NOT match
  assert.equal(varM('strength', { vars: [{ name: 'strength', expr: '' }] }), false);
  assert.equal(varM('strength', { vars: [] }), false);
  assert.equal(varM('other', { vars: [{ name: 'strength', expr: '10' }] }), false);
});

// ── QX-4: numeric comparison on properties (the real parser extension) ────
test('QX-4 parseSearchQuery — key:>N parses to propnum; longest-match >= over >; signs and decimals', () => {
  const p = q => host(c.parseSearchQuery(q))[0];
  let t = p('cost:>100');
  assert.equal(t.kind, 'propnum'); assert.equal(t.key, 'cost'); assert.equal(t.op, '>'); assert.equal(t.num, 100);
  t = p('cost:>=100'); assert.equal(t.op, '>=');    // >= wins longest-match, NOT '>' + text '=100'
  t = p('score:<=3.5'); assert.equal(t.op, '<='); assert.equal(t.num, 3.5);
  t = p('temp:<-4');    assert.equal(t.op, '<'); assert.equal(t.num, -4);   // signed
  // is: is never a numeric prop key
  assert.equal(p('is:>1').kind, 'text');
  // a non-numeric value is NOT propnum: it stays the exact key:value (bare) or text
  assert.equal(p('cost:high').kind, 'prop');
  assert.equal(p('cost:>high').kind, 'text');   // op but no number → falls through to literal text
});

test('QX-4 termMatchesNode — numeric compare, with non-numeric and date values rejected', () => {
  const m = (q, props) => c.termMatchesNode(host(c.parseSearchQuery(q))[0], { props }, SEQS);
  assert.equal(m('cost:>100', [{ key: 'cost', val: '150' }]), true);
  assert.equal(m('cost:>100', [{ key: 'cost', val: '100' }]), false);   // strict >
  assert.equal(m('cost:>=100', [{ key: 'cost', val: '100' }]), true);   // inclusive
  assert.equal(m('cost:<=100', [{ key: 'cost', val: '100' }]), true);
  assert.equal(m('cost:<100', [{ key: 'cost', val: '99.5' }]), true);   // decimal value
  // a non-numeric property value never matches (no throw, no NaN compare)
  assert.equal(m('cost:>100', [{ key: 'cost', val: 'soon' }]), false);
  assert.equal(m('cost:>100', [{ key: 'cost', val: '' }]), false);
  // a date-shaped value on an arbitrary key is NOT numeric here (dates belong to due:/start:);
  // use a non-date key so the propnum arm handles it (due:/start: have their own date arm).
  assert.equal(m('deadline:>100', [{ key: 'deadline', val: '2026-06-13' }]), false);
  // a missing property never matches
  assert.equal(m('cost:>100', [{ key: 'weight', val: '200' }]), false);
  assert.equal(m('cost:>100', []), false);
  // negation composes (a point whose cost is NOT > 100)
  const neg = c.parseSearchQuery('-cost:>100');
  assert.equal(c.queryMatchesNode(host(neg), { props: [{ key: 'cost', val: '50' }] }, SEQS), true);
  assert.equal(c.queryMatchesNode(host(neg), { props: [{ key: 'cost', val: '150' }] }, SEQS), false);
});

// ── QX-5: OR disjunction (standalone `|` splits AND-clauses) ─────────────────
test('QX-5 parseSearchQuery — a standalone | is an or marker; glued/negated/quoted stay literal', () => {
  const kinds = q => host(c.parseSearchQuery(q)).map(t => t.kind);
  assert.deepEqual(kinds('a | b'), ['text', 'or', 'text']);
  assert.deepEqual(kinds('a |b'), ['text', 'text']);       // glued: '|b' is literal text
  assert.deepEqual(kinds('a| b'), ['text', 'text']);       // glued the other way
  assert.deepEqual(kinds('-| a'), ['text', 'text']);       // negated pipe is literal
  assert.deepEqual(kinds('"|"'), ['text']);                 // quoted pipe is the literal escape
});

test('QX-5 queryMatchesNode — OR of clauses, AND binds tighter, negation inside a clause', () => {
  const seqs = SEQS;
  const q = s => host(c.parseSearchQuery(s));
  const todo = { text: '#TODO write intro' };
  const done = { text: '#DONE ship draft' };
  const plain = { text: 'grocery list' };
  // simple OR
  assert.equal(c.queryMatchesNode(q('is:todo | is:done'), todo, seqs), true);
  assert.equal(c.queryMatchesNode(q('is:todo | is:done'), done, seqs), true);
  assert.equal(c.queryMatchesNode(q('is:todo | is:done'), plain, seqs), false);
  // AND binds tighter: (write AND is:todo) OR ship
  assert.equal(c.queryMatchesNode(q('write is:todo | ship'), todo, seqs), true);   // left clause
  assert.equal(c.queryMatchesNode(q('write is:todo | ship'), done, seqs), true);   // right clause
  assert.equal(c.queryMatchesNode(q('write is:todo | ship'), plain, seqs), false);
  // the left clause requires BOTH its terms
  assert.equal(c.queryMatchesNode(q('write is:done | ship'), todo, seqs), false);
  // negation stays clause-local: (-is:done AND intro) OR grocery
  assert.equal(c.queryMatchesNode(q('-is:done intro | grocery'), todo, seqs), true);
  assert.equal(c.queryMatchesNode(q('-is:done intro | grocery'), plain, seqs), true);
  assert.equal(c.queryMatchesNode(q('-is:done intro | grocery'), done, seqs), false);
});

test('QX-5 empty clauses are dropped, never auto-true (a stray pipe cannot match everything)', () => {
  const seqs = SEQS;
  const q = s => host(c.parseSearchQuery(s));
  const node = { text: 'anything at all' };
  assert.equal(c.queryMatchesNode(q('|'), node, seqs), false);          // only a pipe: no live clause
  assert.equal(c.queryMatchesNode(q('| |'), node, seqs), false);
  assert.equal(c.queryMatchesNode(q('zzz |'), node, seqs), false);      // trailing pipe: empty clause dropped
  assert.equal(c.queryMatchesNode(q('| zzz'), node, seqs), false);      // leading pipe likewise
  assert.equal(c.queryMatchesNode(q('anything |'), node, seqs), true);  // the live clause still matches
  assert.equal(c.queryMatchesNode(q('zzz | | anything'), node, seqs), true); // doubled pipe: middle empty dropped
});

test('QX-5 searchHighlightNeedles ignores or markers and collects across clauses', () => {
  const needles = host(c.searchHighlightNeedles(host(c.parseSearchQuery('alpha | #beta -gamma'))));
  assert.deepEqual(needles, ['alpha', '#beta']);
});

// ── query pill: the pure queryRows core (shared with the future base view) ──
test('queryRows — matches across the tree, excludes the host, caps with a total', () => {
  const root = { children: [
    { id: 'h1', text: '#TODO alpha', children: [
      { id: 'c1', text: '#TODO nested one', children: [] },
      { id: 'c2', text: '#DONE nested two', children: [] },
    ] },
    { id: 'h2', text: '#TODO beta', children: [] },
  ] };
  const r = host(c.queryRows('is:todo', root, 'host-not-present'));
  assert.deepEqual(r.rows.map(x => x.id).sort(), ['c1', 'h1', 'h2']);   // three open to-dos, done excluded
  assert.equal(r.total, 3);
  assert.equal(r.truncated, false);
  // titles are stripped display text
  assert.equal(r.rows.find(x => x.id === 'h1').title, 'alpha');
  // the host point is excluded even when it matches
  const r2 = host(c.queryRows('is:todo', root, 'h1'));
  assert.equal(r2.rows.find(x => x.id === 'h1'), undefined);
  assert.equal(r2.total, 2);
});

test('queryRows — an empty or whitespace query returns nothing (never matches everything)', () => {
  const root = { children: [{ id: 'a', text: 'x', children: [] }] };
  assert.deepEqual(host(c.queryRows('', root, null)), { rows: [], total: 0, truncated: false });
  assert.deepEqual(host(c.queryRows('   ', root, null)), { rows: [], total: 0, truncated: false });
});

test('queryRows — caps the row slice but reports the true total (truncated flag)', () => {
  const kids = [];
  for (let i = 0; i < 15; i++) kids.push({ id: 'k' + i, text: '#TODO item ' + i, children: [] });
  const root = { children: kids };
  const r = host(c.queryRows('is:todo', root, null, 10));
  assert.equal(r.rows.length, 10);
  assert.equal(r.total, 15);
  assert.equal(r.truncated, true);
});

test('queryRows — the full operator grammar composes (OR, negation, dates)', () => {
  const root = { children: [
    { id: 'a', text: '#TODO write', props: [{ key: 'due', val: '2000-01-01' }], children: [] },   // overdue
    { id: 'b', text: '#TODO plan', children: [] },
    { id: 'd', text: '#DONE ship', children: [] },
  ] };
  // is:overdue | is:todo -is:done → a (overdue) and b (open todo), not d
  const r = host(c.queryRows('is:overdue | is:todo -is:done', root, null));
  assert.deepEqual(r.rows.map(x => x.id).sort(), ['a', 'b']);
});

test('queryParts — sniffs {query: expr}, rejects the empty and keywordless forms', () => {
  assert.deepEqual(host(c.queryParts('query: is:todo | due:week')), { expr: 'is:todo | due:week' });
  assert.deepEqual(host(c.queryParts('query:#idea -is:done')), { expr: '#idea -is:done' });
  assert.equal(c.queryParts('query:'), null);        // no search string
  assert.equal(c.queryParts('query:   '), null);     // whitespace only
  assert.equal(c.queryParts('is:todo'), null);       // no keyword
  assert.equal(c.queryParts('querylike: x'), null);  // the keyword must be exactly 'query'
  // classifyBraceBody routes it to an artifact so exit-promotion fires
  assert.equal(c.classifyBraceBody('query: is:todo', [], {}), 'artifact');
});

// ── {count: query} — the query family's third verb (#541) ───────────────────
test('countParts — sniffs {count: expr}, rejects the empty and keywordless forms', () => {
  assert.deepEqual(host(c.countParts('count: is:todo | due:week')), { expr: 'is:todo | due:week' });
  assert.deepEqual(host(c.countParts('count:#thread is:todo')), { expr: '#thread is:todo' });
  assert.equal(c.countParts('count:'), null);         // no search string
  assert.equal(c.countParts('count:   '), null);      // whitespace only
  assert.equal(c.countParts('is:todo'), null);        // no keyword
  assert.equal(c.countParts('counter: x'), null);     // the keyword must be exactly 'count'
  // classify + typeLabel agree: valid artifact, labeled as the query family's count form
  assert.equal(c.classifyBraceBody('count: is:todo', [], {}), 'artifact');
  assert.deepEqual(host(c.braceTypeLabel('count: is:todo', [], {})), ['query', 'count']);
});

test('promoteBraceBody — {count:} builds a query record with show:count; unfolds to its own verb (#541)', () => {
  const node = { text: '', query: [] };
  const tok = c.promoteBraceBody(node, 'count: is:todo');
  assert.match(tok, /^\[\[query:/, 'a {count:} promotes to a QUERY pill (same sidecar)');
  assert.equal(node.query[0].expr, 'is:todo');
  assert.equal(node.query[0].show, 'count');
  // the unfold source round-trips the verb, so an edit re-promotes to the same form
  assert.equal(c.artifactToShorthand('query', node.query[0]), '{count: is:todo}');
  // a plain query record still unfolds to {query: …}, untouched
  assert.equal(c.artifactToShorthand('query', { key: 'q1', expr: 'is:todo' }), '{query: is:todo}');
});

test('queryRows — total counts every match even when the row cap clips the list (#541 reads .total)', () => {
  const tree = { id: 'r', text: '', children: [
    { id: 'a', text: '- [ ] one', children: [] },
    { id: 'b', text: '- [ ] two', children: [] },
    { id: 'c', text: '- [ ] three', children: [] },
    { id: 'd', text: 'done already', children: [] },
  ] };
  const { total, rows } = c.queryRows('is:todo', tree, null, 1);
  assert.equal(total, 3, 'total is the real count');
  assert.equal(rows.length, 1, 'the cap only clips the rows');
  assert.equal(c.queryRows('is:todo', tree, 'a', 99).total, 2, 'the host point is excluded');
  assert.equal(c.queryRows('nomatchword', tree, null, 1).total, 0, 'zero is a valid count');
});

// ── QX-6: link/tag presence filters (has:link/tag pure; has:backlink/is:broken threaded) ──
test('QX-6 has:link and has:tag are pure node reads with the props fall-through intact', () => {
  const hasM = (val, node) => c.termMatchesNode({ kind: 'has', value: val }, node, SEQS);
  // links: same-doc plain, labeled, mirror, and cross-doc forms all count
  assert.equal(hasM('link', { text: 'see [[#abc12]]' }), true);
  assert.equal(hasM('link', { text: 'see [[#abc12|the intro]]' }), true);
  assert.equal(hasM('link', { text: 'mirror [[#abc12|]]' }), true);
  assert.equal(hasM('link', { text: 'cross [[docaa#abc12|x]]' }), true);
  assert.equal(hasM('link', { text: 'a footnote [^k] is not a link' }), false);
  assert.equal(hasM('link', { text: 'plain text' }), false);
  // tags: any sigil counts, including hashtag-shaped state keywords; link targets never read as tags
  assert.equal(hasM('tag', { text: 'an #idea here' }), true);
  assert.equal(hasM('tag', { text: '#TODO write it' }), true);
  assert.equal(hasM('tag', { text: 'only a link [[#abc12]]' }), false);
  assert.equal(hasM('tag', { text: 'code#notatag' }), false);   // word-anchored, mirrors the #tag matcher
  assert.equal(hasM('tag', { text: 'plain' }), false);
  // the has:<propkey> contract: a real property keyed link/tag still matches
  assert.equal(hasM('link', { text: 'plain', props: [{ key: 'link', val: 'y' }] }), true);
  assert.equal(hasM('tag', { text: 'plain', props: [{ key: 'tag', val: 'y' }] }), true);
});

test('QX-6 has:backlink and is:broken read the threaded collectLinks index', () => {
  // A links to B (live) and to a dead id; B is linked-to; C stands alone.
  const root = { children: [
    { id: 'aaa11', text: 'see [[#bbb22]] and [[#dead9]]', children: [] },
    { id: 'bbb22', text: 'the target', children: [] },
    { id: 'ccc33', text: 'unrelated', children: [] },
  ] };
  const links = host(c.collectLinks(root));
  const A = root.children[0], B = root.children[1], C = root.children[2];
  const m = (term, node) => c.termMatchesNode(term, node, SEQS, undefined, links);
  assert.equal(m({ kind: 'has', value: 'backlink' }, B), true);    // B is linked to
  assert.equal(m({ kind: 'has', value: 'backlink' }, A), false);
  assert.equal(m({ kind: 'has', value: 'backlink' }, C), false);
  assert.equal(m({ kind: 'is', value: 'broken' }, A), true);       // A contains the dead link
  assert.equal(m({ kind: 'is', value: 'broken' }, B), false);
  assert.equal(m({ kind: 'is', value: 'broken' }, C), false);
  // parses as an is: term, and composes with OR across the QX family
  assert.equal(host(c.parseSearchQuery('is:broken'))[0].kind, 'is');
  const q = host(c.parseSearchQuery('is:broken | has:backlink'));
  assert.equal(c.queryMatchesNode(q, A, SEQS, undefined, links), true);
  assert.equal(c.queryMatchesNode(q, B, SEQS, undefined, links), true);
  assert.equal(c.queryMatchesNode(q, C, SEQS, undefined, links), false);
});

// ── QP-2 Phase A: queryTableRows, the query-base row engine ──────────────────
test('queryTableRows — projects title/property/formula per matched point', () => {
  const root = { children: [
    { id: 'aa111', text: '#TODO buy lumber', props: [{ key: 'cost', val: '40' }], children: [] },
    { id: 'bb222', text: '#TODO hire crew', props: [{ key: 'cost', val: '100' }], children: [] },
    { id: 'cc333', text: '#DONE paid deposit', props: [{ key: 'cost', val: '10' }], children: [] },
  ] };
  const cols = [{ name: 'Task', field: 'title' }, { name: 'Cost', field: 'cost' }, { name: 'Doubled', field: '= cost * 2' }];
  const r = host(c.queryTableRows('is:todo', cols, root, null));
  assert.deepEqual(r.header, ['Task', 'Cost', 'Doubled']);
  assert.equal(r.total, 2);
  assert.equal(r.truncated, false);
  // title -> a plain [[#id]] link token (live title, no sidecar; the §0.1 rule)
  assert.deepEqual(r.rows[0], { id: 'aa111', cells: ['[[#aa111]]', '40', '80'] });
  assert.deepEqual(r.rows[1].cells, ['[[#bb222]]', '100', '200']);
});

test('queryTableRows — formula columns see the row point (rollups + own props), errors are #ERR', () => {
  const root = { children: [
    { id: 'pp111', text: '#TODO project', props: [{ key: 'rate', val: '2' }], children: [
      { id: 'k1', text: 'part', props: [{ key: 'cost', val: '30' }], children: [] },
      { id: 'k2', text: 'part', props: [{ key: 'cost', val: '12' }], children: [] },
    ] },
  ] };
  const cols = [{ name: 'Total', field: '= sum(cost) * rate' }, { name: 'Bad', field: '= nosuchvar + 1' }];
  const r = host(c.queryTableRows('is:todo', cols, root, null));
  assert.deepEqual(r.rows[0].cells, ['84', '#ERR']);   // (30+12)*2; unknown ident fails visibly (P4)
});

test('queryTableRows — cap with true total, host exclusion, empty/invalid inputs', () => {
  const kids = [];
  for (let i = 0; i < 7; i++) kids.push({ id: 'n' + i, text: '#TODO item ' + i, children: [] });
  const root = { children: kids };
  const cols = [{ name: 'T', field: 'title' }];
  const capped = host(c.queryTableRows('is:todo', cols, root, null, 5));
  assert.equal(capped.rows.length, 5);
  assert.equal(capped.total, 7);
  assert.equal(capped.truncated, true);
  const excl = host(c.queryTableRows('is:todo', cols, root, 'n0'));
  assert.equal(excl.total, 6);
  assert.equal(excl.rows.find(r => r.id === 'n0'), undefined);
  // empty query or no columns -> empty result, never a crash
  assert.deepEqual(host(c.queryTableRows('', cols, root, null)).rows, []);
  assert.deepEqual(host(c.queryTableRows('is:todo', [], root, null)).rows, []);
  // a missing property projects as an empty cell
  const miss = host(c.queryTableRows('is:todo', [{ name: 'X', field: 'nope' }], root, null, 1));
  assert.deepEqual(miss.rows[0].cells, ['']);
});

test('queryTableRows — the projected model serializes as a valid pipe table', () => {
  const root = { children: [{ id: 'z9', text: '#TODO alpha | beta', props: [{ key: 'note', val: 'a|b' }], children: [] }] };
  const cols = [{ name: 'Task', field: 'title' }, { name: 'Note', field: 'note' }];
  const q = host(c.queryTableRows('is:todo', cols, root, null));
  const model = { aligns: q.header.map(() => null), rows: [q.header, ...q.rows.map(r => r.cells)] };
  const md = c.serializeTable(model);
  const back = host(c.parseTable(md));       // round-trips: pipes in values are escaped
  assert.deepEqual(back.rows[1], ['[[#z9]]', 'a|b']);
});

test('parseQBaseCols — Name: field lines, bare fields, formula colons survive', () => {
  assert.deepEqual(host(c.parseQBaseCols('Title: title\ndue\nCost: = sum(cost)')), [
    { name: 'Title', field: 'title' },
    { name: 'due', field: 'due' },
    { name: 'Cost', field: '= sum(cost)' },
  ]);
  // a bare formula line containing a ternary colon stays ONE field
  assert.deepEqual(host(c.parseQBaseCols('= cost > 2 ? 1 : 0')), [
    { name: '= cost > 2 ? 1 : 0', field: '= cost > 2 ? 1 : 0' },
  ]);
  assert.equal(c.parseQBaseCols(''), null);
  assert.equal(c.parseQBaseCols('  \n  '), null);
});

test('queryTableRows — date props compute as epoch-days in formula columns', () => {
  const root = { children: [
    { id: 'd1', text: '#TODO ship it', props: [{ key: 'due', val: '2026-07-10' }], children: [] },
  ] };
  const r = host(c.queryTableRows('is:todo', [{ name: 'D', field: '= daysuntil(due)' }], root, null));
  // daysuntil is relative to the real today, so pin the identity via date() instead
  const r2 = host(c.queryTableRows('is:todo', [{ name: 'D', field: '= due - date(2026,7,1)' }], root, null));
  assert.equal(r2.rows[0].cells[0], '9');           // 2026-07-10 minus 2026-07-01
  assert.notEqual(r.rows[0].cells[0], '#ERR');      // daysuntil(due) resolves, whatever today is
});

// ── FR-1: field roles, the role-aware cell paint ─────────────────────────────
test('mtCellHtml — status/date/number roles shape the paint; non-conforming values fall through', () => {
  const node = { colRole: ['status', 'date', 'number', null], dice: [], math: [], vars: [], grammar: [], est: [], seq: [], props: [] };
  // status: a built-in state keyword renders as its chip; DONE gets the muted done styling
  assert.match(c.mtCellHtml(node, 'TODO', 0), /todo-state todo-state-todo/);
  assert.match(c.mtCellHtml(node, 'DONE', 0), /todo-state-isdone/);
  // a non-state word in a status column falls through to the plain render (P4: never an error)
  assert.doesNotMatch(c.mtCellHtml(node, 'banana', 0), /todo-state/);
  // date: an ISO value renders as an urgency chip with the ISO in the title
  assert.match(c.mtCellHtml(node, '2199-01-01', 1), /ag-chip/);
  assert.match(c.mtCellHtml(node, '2199-01-01', 1), /2199-01-01/);
  assert.doesNotMatch(c.mtCellHtml(node, 'not a date', 1), /ag-chip/);
  // number: formatted; a word falls through
  assert.equal(c.mtCellHtml(node, '42.0', 2), '42');
  assert.doesNotMatch(c.mtCellHtml(node, 'n/a', 2), /42/);
  // no role, and a node with no colRole at all: plain render
  assert.doesNotMatch(c.mtCellHtml(node, 'TODO', 3), /todo-state/);
  const bare = { dice: [], math: [], vars: [], grammar: [], est: [], seq: [], props: [] };
  assert.doesNotMatch(c.mtCellHtml(bare, 'TODO', 0), /todo-state/);
});

// ── BV-1: boardLanes, the board view's pure lane model ───────────────────────
test('boardLanes — lanes follow the owning sequence order, done flags, no-state lane', () => {
  const SEQS2 = [
    { key: 'default', name: 'To-do', states: ['TODO', 'NEXT', 'WAITING', 'DONE'], doneFrom: 3 },
    { key: 'q1', name: 'Quests', states: ['PLANNED', 'ACTIVE', 'CLEARED'], doneFrom: 2 },
  ];
  const model = { aligns: [null, null], rows: [
    ['Quest', 'State'],
    ['slay the wyrm', 'ACTIVE'],
    ['clear the mine', 'planned'],          // case-insensitive matching
    ['escort the bard', 'CLEARED'],
    ['mystery job', 'banana'],              // unrecognized -> no-state lane
  ] };
  const { seq, lanes } = host(c.boardLanes(host(model), 1, SEQS2));
  assert.equal(seq.name, 'Quests');          // owning sequence found from the first recognized value
  assert.deepEqual(lanes.map(l => l.kw), ['PLANNED', 'ACTIVE', 'CLEARED', null]);
  assert.deepEqual(lanes.map(l => l.done), [false, false, true, false]);
  assert.deepEqual(lanes.map(l => l.rows), [[2], [1], [3], [4]]);
  // a no-held sequence flags no held lanes
  assert.deepEqual(lanes.map(l => l.held), [false, false, false, false]);
});

test('boardLanes — a held-band sequence flags its held lane (UXP-161)', () => {
  const SEQ = [{ key: 'flow', name: 'Flow', states: ['BACKLOG', 'DOING', 'BLOCKED', 'SHIPPED'], heldFrom: 2, doneFrom: 3 }];
  const model = { aligns: [null, null], rows: [
    ['Task', 'State'],
    ['a', 'DOING'], ['b', 'BLOCKED'], ['c', 'SHIPPED'],
  ] };
  const { lanes } = host(c.boardLanes(host(model), 1, SEQ));
  assert.deepEqual(lanes.map(l => l.kw), ['BACKLOG', 'DOING', 'BLOCKED', 'SHIPPED']);
  assert.deepEqual(lanes.map(l => l.held), [false, false, true, false]);   // only BLOCKED is held
  assert.deepEqual(lanes.map(l => l.done), [false, false, false, true]);   // only SHIPPED is done
});

test('boardLanes — lastRow excludes a Calculate footer; no recognized values falls back to the default sequence', () => {
  const SEQS2 = [{ key: 'default', name: 'To-do', states: ['TODO', 'DONE'], doneFrom: 1 }];
  const model = { aligns: [null, null], rows: [
    ['T', 'S'], ['a', 'TODO'], ['b', 'DONE'], ['total', ''],   // last row = footer
  ] };
  const { lanes } = host(c.boardLanes(host(model), 1, SEQS2, 2));
  assert.deepEqual(lanes.map(l => l.rows), [[1], [2]]);         // footer row 3 never becomes a card
  // a column with no recognized state anywhere: default sequence lanes, everything in no-state
  const blank = { aligns: [null, null], rows: [['T', 'S'], ['a', 'x'], ['b', '']] };
  const r2 = host(c.boardLanes(host(blank), 1, SEQS2));
  assert.deepEqual(r2.lanes.map(l => l.kw), ['TODO', 'DONE', null]);
  assert.deepEqual(r2.lanes[2].rows, [1, 2]);
});

// ── LEAN FLOOR phase 3: nextLaneKw (keyboard board-card move) ──
test('nextLaneKw — clamps at both edges, no-state advances to the first lane, case-insensitive', () => {
  const S = ['TODO', 'NEXT', 'WAITING', 'DONE'];
  assert.equal(c.nextLaneKw(S, 'TODO', 1), 'NEXT');
  assert.equal(c.nextLaneKw(S, 'WAITING', 1), 'DONE');
  assert.equal(c.nextLaneKw(S, 'DONE', 1), null, 'clamps at the last lane (no wrap)');
  assert.equal(c.nextLaneKw(S, 'TODO', -1), null, 'clamps at the first lane (no wrap)');
  assert.equal(c.nextLaneKw(S, '', 1), 'TODO', 'a no-state card advances into the first lane');
  assert.equal(c.nextLaneKw(S, '', -1), null, 'a no-state card has nowhere before the first lane');
  assert.equal(c.nextLaneKw(S, 'todo', 1), 'NEXT', 'the current state is matched case-insensitively');
  assert.equal(c.nextLaneKw([], 'x', 1), null, 'no states → null');
});

test('LEAN-FLOOR p3: the Alt+Left/Right board-card-move wiring is present (card keydown is DOM-bound)', () => {
  assert.ok(_src.includes("(e.key === 'ArrowLeft' || e.key === 'ArrowRight')") && _src.includes('nextLaneKw(seq.states'), 'the Alt+Arrow card-move branch is missing');
  assert.ok(_src.includes('bvMoveCard(node, r, gb, next)'), 'the move must go through bvMoveCard');
  assert.ok(_src.includes("flashHint('Already in the last lane.')") || _src.includes('Already in the last lane'), 'an edge move must flash (P4), not silently no-op');
});

// ── BV-3: calBaseItems, the calendar view's pure item model ──────────────────
test('calBaseItems — valid dates become items, blank/invalid rows surface as undated', () => {
  const model = { aligns: [null, null], rows: [
    ['Task', 'Due'],
    ['a', '2026-07-04'],
    ['b', 'not a date'],
    ['c', ''],
    ['d', '2026-02-30'],       // impossible date: parseDueDate rejects it
    ['e', 'today'],
    ['total', ''],             // footer, excluded by lastRow
  ] };
  const r = host(c.calBaseItems(host(model), 1, 5));
  assert.deepEqual(r.items.map(i => i.r), [1, 5]);
  assert.equal(typeof r.items[0].epochDay, 'number');
  assert.deepEqual(r.undated, [2, 3, 4]);   // invalid, blank, impossible all surface (P4)
});

// ── base inline collapse + row cap (outline view) ─────────────────────────────
test('baseInlineView — zoomed shows everything, ignoring collapse and cap', () => {
  assert.deepEqual(host(c.baseInlineView(true, 3, 20, true)), { collapsed: false, shown: 20, clipped: false, hidden: 0 });
  assert.deepEqual(host(c.baseInlineView(false, 5, 20, true)), { collapsed: false, shown: 20, clipped: false, hidden: 0 });
});
test('baseInlineView — collapsed shows no rows but flags clipped when there are rows', () => {
  assert.deepEqual(host(c.baseInlineView(true, null, 12, false)), { collapsed: true, shown: 0, clipped: true, hidden: 12 });
  assert.deepEqual(host(c.baseInlineView(true, null, 0, false)),  { collapsed: true, shown: 0, clipped: false, hidden: 0 });
});
test('baseInlineView — uncapped shows all; capped shows the first N and flags the remainder', () => {
  assert.deepEqual(host(c.baseInlineView(false, null, 12, false)), { collapsed: false, shown: 12, clipped: false, hidden: 0 });
  assert.deepEqual(host(c.baseInlineView(false, 0, 12, false)),    { collapsed: false, shown: 12, clipped: false, hidden: 0 });  // 0 = uncapped
  assert.deepEqual(host(c.baseInlineView(false, 5, 12, false)),    { collapsed: false, shown: 5, clipped: true, hidden: 7 });
  assert.deepEqual(host(c.baseInlineView(false, 5, 5, false)),     { collapsed: false, shown: 5, clipped: false, hidden: 0 });   // exactly at cap
  assert.deepEqual(host(c.baseInlineView(false, 20, 12, false)),   { collapsed: false, shown: 12, clipped: false, hidden: 0 });  // cap > total
});

// ── adversarial-hardening pass: fuzz/injection guards (see guidance/ux-remediation.md) ──────────
test('HARD-1: {Nx:} nesting is budget-capped, not an OOM bomb (data-loss guard)', () => {
  // {99x:{99x:{99x:{99x:a}}}} multiplied to 192MB/OOM and re-detonated on every reopen. The
  // ctx.emitted output budget in expandTemplate + the repeat-loop break truncate to ~100k with a … marker.
  const t0 = Date.now();
  const out = c.runGrammar('origin: {99x:{99x:{99x:{99x:a}}}}', 'origin', {}, {});
  assert.ok(Date.now() - t0 < 2000, 'the bomb must resolve fast (budget-capped), not hang');
  assert.ok(out.length < 200000, `output must be capped, got ${out.length}`);
  assert.ok(out.includes('…'), 'a truncated expansion shows the … marker');
  // a normal repeat is unaffected
  assert.equal(c.runGrammar('origin: {3x: x}', 'origin', {}, {}), 'x x x');
});

test('HARD-2: walkMarkov clamps steps at its single consumer (crash-on-load guard)', () => {
  // a loaded _markov record carries an unclamped steps; walkMarkov now clamps (was OOM at steps:1e9).
  const parsed = c.parseMarkov('a -> a');
  assert.ok(c.walkMarkov(parsed, 'a', 1000000000).length <= 501, 'steps clamped to <=500');
  assert.ok(c.walkMarkov(parsed, 'a', 3).length <= 4, 'a small steps is unaffected');
});

test('HARD-3: an over-long #tag parses as text, never reaching new RegExp (crash guard)', () => {
  // a ~32k #tag compiled to a regex exceeding V8s program limit → SyntaxError mid-render(). Capped at 512.
  assert.equal(c.parseSearchQuery('#' + 'a'.repeat(40000))[0].kind, 'text', 'over-long #tag → text term');
  assert.equal(c.parseSearchQuery('#thread/torn')[0].kind, 'tag', 'a normal #tag still parses as a tag');
});

test('HARD-4: the dice pill label escapes hostile _dice fields (XSS guard)', () => {
  // a loaded _dice part can carry any count/sides/target; parseDice never runs on it. The label must
  // be escHtml-escaped like the roll faces beside it, or an <img onerror> count injects live HTML.
  const d = { parts: [{ kind: 'dice', sign: 1, count: '<img src=x onerror=alert(1)>', sides: 6, rolls: [1] }], total: 1 };
  const html = c.diceBreakdownHTML(d);
  assert.ok(!html.includes('<img src=x onerror'), 'raw HTML must not reach the pill');
  assert.ok(html.includes('&lt;img'), 'the hostile value is escaped');
});

test('HARD-6: parseDueDate bounds the today±N relative arm like the ISO arm (degradation guard)', () => {
  // today+1e11 made a garbage epoch → NaN-NaN-NaN chip. Now null, matching the ISO 1900-2200 clamp.
  assert.equal(c.parseDueDate('today+100000000000'), null, 'an overflow relative date → null');
  assert.equal(c.parseDueDate('today-100000000000'), null, 'and the negative direction');
  assert.ok(Number.isFinite(c.parseDueDate('today+5')), 'a normal relative date still resolves');
});

// ── adversarial-hardening WAVE 2: DOM-bound guards (src-pinned; fromOpml/mtInline are DOM-only) ──
test('HARD-7: applyInlineFormat guards against a selection crossing an atomic pill (data-loss)', () => {
  // formatting across a [data-token] pill would delete it + orphan its doc-wide sidecar. The guard
  // no-ops with a hint. src-pinned because applyInlineFormat is DOM-bound (not harvestable).
  assert.ok(_src.includes('intersectsNode(tok)'), 'the pill-intersection guard is missing');
  assert.ok(_src.includes('Select text on one side of a pill to format it'), 'the guard hint is missing');
});

test('HARD-8: fromOpml dedups a duplicate _id at ingestion (desync)', () => {
  // a duplicate _id collapses buildIndex's Map → a ghost row whose edits/drops misdirect. The seenIds
  // dedup reassigns a fresh uid(). src-pinned because fromOpml is DOM-bound (DOMParser).
  assert.ok(_src.includes('const seenIds = new Set()'), 'the _id dedup set is missing');
  assert.ok(_src.includes('id: freshId(el.getAttribute'), 'the id assignment does not route through freshId');
});

test('HARD-9: the #ERR computed-cell marker is escaped, not rendered as a hashtag (degradation)', () => {
  // #ERR through mdInline becomes a live #ERR hashtag filter. Both cell paths short-circuit it.
  const guard = /^#ERR\b/;   // the exact predicate the guard uses
  assert.ok(guard.test('#ERR (loops on itself)'), 'the marker matches the guard');
  assert.ok(!guard.test('#todo item'), 'a real hashtag does not match');
  assert.ok(_src.includes("/^#ERR\\b/.test(String(raw || '').trim()) ? escHtml(raw)"), 'the mtInline #ERR guard is missing');
  assert.ok(_src.includes('const cellMd = (raw)'), 'the static-table #ERR guard is missing');
});

test('HARD-10: the atomic-write temp name is per-write-unique (degradation)', () => {
  assert.ok(_src.includes('let _wsTmpSeq = 0'), 'the per-write temp counter is missing');
  assert.notEqual(c.tmpWriteName('x.opml'), c.tmpWriteName('x.opml'), 'two calls must differ');
});

// ── adversarial-hardening WAVE 3: ingestion depth clamp (HARD-11) ──────────────────────────────
test('HARD-11: treeDepthExceeds catches a pathologically deep tree without itself overflowing', () => {
  // a >1500-deep tree overflows toOpml/collectVars/render. The clamp rejects at import (po throws)
  // and the autosave-restore twin (treeDepthExceeds) rejects a tampered raw JSON tree. The checker is
  // ITERATIVE (a stack), so it survives the very depth it is testing.
  const deep = (n) => { const root = { id:'r', text:'', children:[] }; let cur = root; for (let i=0;i<n;i++){ const k = { id:'n'+i, text:'x', children:[] }; cur.children.push(k); cur = k; } return root; };
  assert.equal(c.treeDepthExceeds(deep(12000)), true, 'a 12000-deep tree is rejected');
  assert.equal(c.treeDepthExceeds(deep(50)), false, 'a normal-depth tree passes');
  assert.equal(c.treeDepthExceeds({ id:'r', text:'', children:[] }), false, 'a single node passes');
  // the po() import clamp + the constant are src-pinned (fromOpml is DOM-bound, not harvestable)
  assert.ok(_src.includes('const MAX_OPML_DEPTH = 1000'), 'the depth cap constant is missing');
  assert.ok(_src.includes('function po(el, depth = 0)'), 'po() is not depth-parameterized');
  assert.ok(_src.includes('if (treeDepthExceeds(data.root)) return false'), 'the autosave-restore depth guard is missing');
});

// ── THE 3-POSITION VERBOSITY DIAL: guided → standard → lean (DOM/state-bound; src-pinned) ──
test('DIAL: the 3-tier state machine + cycle + persistence is present', () => {
  // the 3-value state + the tier order + both predicates
  assert.ok(_src.includes("const VERBOSITY_TIERS = ['guided', 'standard', 'lean']"), 'the 3-tier order is missing');
  assert.ok(_src.includes("let verbosity = 'guided'"), 'the verbosity setting is missing (default guided)');
  assert.ok(_src.includes("function isLean() { return verbosity === 'lean'; }"), 'isLean() is missing');
  assert.ok(_src.includes("function isGuided() { return verbosity === 'guided'; }"), 'isGuided() is missing');
  assert.ok(_src.includes("function isStandardOrLean() { return verbosity !== 'guided'; }"), 'isStandardOrLean() (the teaching-text-off tiers) is missing');
  // the toggle CYCLES through the tiers with a direction (forward + reverse), not a binary flip
  assert.ok(_src.includes('VERBOSITY_TIERS[(VERBOSITY_TIERS.indexOf(verbosity) + dir + n) % n]'), 'toggleVerbosity must CYCLE the 3 tiers by a direction, not flip 2');
  assert.ok(_src.includes("(e.key==='.' || e.key==='>')") && _src.includes('toggleVerbosity(1)'), 'the Ctrl+Shift+. forward cycle is missing');
  assert.ok(_src.includes("(e.key===',' || e.key==='<')") && _src.includes('toggleVerbosity(-1)'), 'the Ctrl+Shift+, reverse cycle (toward more guidance) is missing');
  // persistence: any of the 3 tiers restores + re-syncs the body class
  assert.ok(_src.includes('VERBOSITY_TIERS.includes(data.verbosity)'), 'the autosave restore must accept any of the 3 tiers');
  assert.ok(/JSON\.stringify\(\{ root,[^}]*\bverbosity\b/.test(_src), 'verbosity is not persisted in the autosave payload');
});

test('DIAL: LEAN is the keyboard canvas — blind menu shows a one-line match tip, pencils hidden (lean only)', () => {
  // the / @ menu renders nothing in LEAN, but a one-line status tip names the current match (not a menu)
  assert.ok(_src.includes('function isSlashMenuOpen() { return slashState != null; }'), 'isSlashMenuOpen must key off slashState, not the .on class');
  assert.ok(_src.includes('if (!isLean()) { renderSlashMenu(); positionSlashMenu(content, slashOffset); }'), 'the blind-render guard (lean only) is missing');
  assert.ok(_src.includes('else renderLeanSlashTip();'), 'lean must render the one-line match tip instead of nothing (panel-review blocker fix)');
  assert.ok(_src.includes('function renderLeanSlashTip()') && _src.includes('announce(`${cmd.label}'), 'the lean tip must name the current match AND announce it to AT');
  // the body carries one v-<tier> class; the pencil CSS keys on body.v-lean directly (no legacy lean-mode)
  assert.ok(_src.includes("VERBOSITY_TIERS.forEach(t => b.toggle('v-' + t, verbosity === t))"), 'syncVerbosityClass must set a v-<tier> class per tier');
  assert.ok(!_src.includes("b.toggle('lean-mode'"), 'the legacy lean-mode class must be retired (dual source of truth)');
  assert.ok(_src.includes('body.v-lean .dice-roll:hover .dice-edit'), 'lean must suppress the pencil hover-reveal via body.v-lean');
  assert.ok(_src.includes('body.v-lean .dice-edit:focus-visible') && _src.includes('opacity:1}   /* keyboard focus still reveals (P3) */'), 'lean must still reveal a pencil on keyboard focus (P3)');
});

test('DIAL: STANDARD + LEAN strip the teaching text (hints, search legend, pill tooltips); guided keeps it', () => {
  // 1. empty-state hints strip in standard AND lean (isStandardOrLean), not just lean
  assert.ok(_src.includes("const entryHint = isStandardOrLean() ? '' :"), 'the entry-point hint must strip in standard + lean');
  assert.ok(_src.includes("const paraHint = isStandardOrLean() ? '…' :"), 'the para keyboard-hint must strip in standard + lean');
  // 2. the search legend rows strip whenever NOT guided; saved searches / cross-doc matches (data) stay
  assert.ok(_src.includes('body:not(.v-guided) #search-hint .sh-row{display:none}'), 'the legend rows must strip in standard + lean (body:not(.v-guided))');
  assert.ok(!/body:not\(\.v-guided\)\s+#sh-saved/.test(_src), 'must NOT hide saved searches — only the .sh-row legend');
  // 3. pill tooltips (title=) strip in standard + lean via the post-render sweep; scoped to PILL classes
  assert.ok(_src.includes('if (isStandardOrLean()) {') && _src.includes("[class$=\"-edit\"][title]"), 'the pill-tooltip strip sweep is missing');
  assert.ok(_src.includes('.node-content .dice-roll[title]'), 'the tooltip sweep must target the pill classes');
  // 4. the 'Section label…' placeholder is a LABEL not a helper — it survives every tier (over-strip guard)
  assert.ok(_src.includes("isDivider ? 'Section label…' : node.type === 'para' ? paraHint"), 'the Section label placeholder must survive (it names the field, not a helper)');
});

// ── LEAN FLOOR phase 3: Alt+Arrow moves a base column/row (keyboard, no menu; DOM-bound → src-pinned) ──
test('LEAN-FLOOR p3: the Alt+Arrow column/row move wiring is present in the cell keydown', () => {
  // Alt+Arrow must move the focused column (left/right) or row (up/down) via the existing mtMoveCol/
  // mtMoveRow, then re-focus the moved cell. Bounds are guarded (header row 0 / footer / edges).
  assert.ok(_src.includes('mtMoveCol(node, c, -1); mtFocusCell(node, r, c - 1)'), 'Alt+Left column-move-left wiring missing');
  assert.ok(_src.includes('mtMoveCol(node, c, 1);  mtFocusCell(node, r, c + 1)'), 'Alt+Right column-move-right wiring missing');
  assert.ok(_src.includes('mtMoveRow(node, r, -1); mtFocusCell(node, r - 1, c)'), 'Alt+Up row-move-up wiring missing');
  assert.ok(_src.includes('mtMoveRow(node, r, 1); mtFocusCell(node, r + 1, c)'), 'Alt+Down row-move-down wiring missing');
  // the guard: Alt+Up only when r > 1 (row 0 is the header, never movable), Alt+Down only below the last data row
  assert.ok(_src.includes("e.key === 'ArrowUp' && r > 1"), 'Alt+Up must protect the header row (r > 1)');
  assert.ok(_src.includes('r < mtLastDataRow(node, m)'), 'Alt+Down must stop above the footer');
});

test('cycleColRole — the same set + order as the Show-as menu, wrapping both ways', () => {
  // Plain (null) → Status → Date → Number → Plain
  assert.equal(c.cycleColRole(null, 1), 'status');
  assert.equal(c.cycleColRole('status', 1), 'date');
  assert.equal(c.cycleColRole('date', 1), 'number');
  assert.equal(c.cycleColRole('number', 1), null);       // wraps to Plain
  assert.equal(c.cycleColRole(null, -1), 'number');       // backward wraps
  assert.equal(c.cycleColRole('bogus', 1), 'status');     // an unknown role starts the cycle
});

test('LEAN-FLOOR p3: the Alt+R column-role-cycle wiring is present (DOM-bound keydown)', () => {
  assert.ok(_src.includes("(e.key === 'r' || e.key === 'R')"), 'the Alt+R role-cycle branch is missing');
  assert.ok(_src.includes('cycleColRole(node.colRole?.[c] || null, e.shiftKey ? -1 : 1)'), 'Alt+R must cycle via cycleColRole (Shift = backward)');
  assert.ok(_src.includes("flashHint('Column shown as: "), 'the role-cycle must flash the new role (P4, no menu)');
});

test('LEAN-FLOOR p3: the Alt+Shift+Arrow column/row INSERT wiring is present (DOM-bound keydown)', () => {
  assert.ok(_src.includes('e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.startsWith'), 'the Alt+Shift+Arrow insert branch is missing');
  assert.ok(_src.includes("mtInsertCol(node, c, 'left')") && _src.includes("mtInsertCol(node, c, 'right')"), 'Alt+Shift+Left/Right must insert a column');
  assert.ok(_src.includes("mtInsertRow(node, r, 'above')") && _src.includes("mtInsertRow(node, r, 'below')"), 'Alt+Shift+Up/Down must insert a row');
  assert.ok(_src.includes("flashHint('Column inserted.')") && _src.includes("flashHint('Row inserted.')"), 'an insert must flash (P4, no menu)');
  // the header-row guard: a row insert only fires on a data row (r > 0)
  assert.ok(_src.includes("r > 0 && e.key === 'ArrowUp'") && _src.includes("r > 0 && e.key === 'ArrowDown'"), 'a row insert must skip the header row');
  // the collision fix: the Shift+Arrow cell-selection guard now excludes Alt so Alt+Shift+Arrow reaches insert
  assert.ok(_src.includes("e.shiftKey && !e.altKey && (e.key.startsWith('Arrow')"), 'Shift+Arrow selection must exclude Alt (so Alt+Shift+Arrow is insert, not selection)');
});

test('stepColW — steps by COL_W_STEP, clamps [MIN,MAX], null at an edge', () => {
  assert.equal(c.stepColW(160, 1), 184);
  assert.equal(c.stepColW(160, -1), 136);
  assert.equal(c.stepColW(900, 1), null, 'at the max → no change');
  assert.equal(c.stepColW(56, -1), null, 'at the min → no change');
  assert.equal(c.stepColW(890, 1), 900, 'a near-max step clamps to the max');
  assert.equal(c.stepColW(60, -1), 56, 'a near-min step clamps to the min');
  assert.equal(c.stepColW(NaN, 1), null, 'a non-numeric base → null');
});

test('LEAN-FLOOR p3: the Alt+,/. column-resize step wiring is present (DOM-bound keydown)', () => {
  assert.ok(_src.includes("(e.key === ',' || e.key === '.' || e.key === '<' || e.key === '>')"), 'the Alt+,/. resize branch is missing');
  assert.ok(_src.includes('stepColW(base, wider ? 1 : -1)'), 'the resize must step via stepColW');
  // base = the pinned width, else the measured rendered header width (so the first press feels natural)
  assert.ok(_src.includes('getBoundingClientRect().width'), 'the resize must measure the rendered width when the column is unpinned');
  assert.ok(_src.includes("flashHint('Column width: "), 'the resize must flash the new width (P4, no menu)');
});

// ── EX-1: the first-run Examples document — well-formed nesting + every {…} is a LIVE pill ──
test('FIRST_RUN_EXAMPLES: one well-formed nested tree, every brace body promotes to a live pill', () => {
  const m = _src.match(/const FIRST_RUN_EXAMPLES = `([\s\S]*?)`;/);
  assert.ok(m, 'FIRST_RUN_EXAMPLES template literal not found');
  const opml = m[1].replaceAll('\\`', '`');
  // 1. well-formed <outline> nesting: depth never goes negative and returns to 0
  let depth = 0, ok = true;
  for (const tok of opml.matchAll(/<outline\b[^>]*?(\/?)>|<\/outline>/g)) {
    if (tok[0] === '</outline>') { depth--; if (depth < 0) { ok = false; break; } }
    else if (tok[1] !== '/') depth++;
  }
  assert.ok(ok && depth === 0, `the Examples OPML nesting is not balanced (final depth ${depth})`);
  // 2. it IS nested (not the old flat list): some point sits at least 3 deep
  assert.ok(opml.includes('    <outline'), 'the Examples doc must be nested, not a flat top-level list');
  // 3. every {…} body classifies as a real artifact (0 dead text) — seed the doc's own rules + vars
  const texts = [...opml.matchAll(/text="([^"]*)"/g)].map(s => s[1]
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', String.fromCharCode(34)).replaceAll('&amp;', '&'));
  // named rules the doc declares (a `name: a | b` point) register via parseRules → callable as {name}
  const rules = {};
  for (const t of texts) { const r = c.parseRules(t); if (r && r.rules) for (const k of Object.keys(r.rules)) rules[k] = 1; }
  const vars = { level: 3, cost: 0 };
  let total = 0; const dead = [];
  for (const t of texts) for (const mm of t.matchAll(/\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/g)) {
    total++;
    // an illustrative placeholder in prose ("Every {…} pill is live", "Type inside {curly-braces}") is
    // MEANT to render as literal text, not a pill — whitelist those; everything else that classifies as
    // literal/text/typo/invalid is a DEAD would-be pill (e.g. {prop check:…} does NOT promote — it must
    // ride the _props check attr instead). 'literal' MUST be in this set or a dead pill slips through.
    if (/^(…|curly-brace|curly braces?)$/i.test(mm[1].trim())) continue;
    let cl; try { cl = c.classifyBraceBody(mm[1], rules, vars); } catch (_) { cl = 'THREW'; }
    if (!cl || ['text', 'typo', 'invalid', 'literal', 'THREW'].includes(cl)) dead.push(mm[1]);
  }
  assert.ok(total >= 20, `the Examples doc should showcase many pills (found ${total})`);
  assert.equal(dead.length, 0, `every {…} in the Examples doc must be a live pill; dead: ${JSON.stringify(dead)}`);
});

// ── openExamples MUST insert non-destructively (never adoptDoc/replace the user's document) ──
test('openExamples: inserts the Welcome tour into the current doc, does NOT overwrite it', () => {
  const fn = _src.match(/function openExamples\(\)\s*\{[\s\S]*?\n\}/);
  assert.ok(fn, 'openExamples not found');
  const body = fn[0];
  // it APPENDS a fresh-id clone to the live document
  assert.ok(body.includes('deepCloneNodeNewIds(welcome)'), 'openExamples must clone the welcome subtree with fresh ids');
  assert.ok(body.includes('root.children.push(clone)'), 'openExamples must APPEND the tour, not replace the document');
  assert.ok(body.includes('pushUndo()'), 'the insert must be undo-able');
  // it must NOT replace the document (the old data-loss path) and needs no discard-confirm anymore
  assert.ok(!body.includes('adoptDoc('), 'openExamples must NOT adoptDoc (that overwrote the user document)');
  assert.ok(!/Discard unsaved/i.test(body), 'the destructive discard confirm should be gone (the insert is non-destructive)');
});

// ── Backtick code spans are the promotion escape hatch: `{2d6}` stays literal, not a pill ──
test('codeSpanRanges / inCodeSpan: find inline `code` spans (matches mdInline\'s regex)', () => {
  const t = 'type `{2d6}` and `{a|b}` but not {real}';
  const r = c.codeSpanRanges(t);
  assert.equal(r.length, 2, 'two backtick spans');
  // the first { (inside `{2d6}`) is in a code span; the { of {real} is not
  const firstBrace = t.indexOf('{');            // inside `{2d6}`
  const lastBrace = t.lastIndexOf('{real}');    // the real one
  assert.ok(c.inCodeSpan(r, firstBrace), 'a brace inside `code` is detected');
  assert.ok(!c.inCodeSpan(r, lastBrace), 'a brace outside code is not');
  assert.equal(c.codeSpanRanges('no code here').length, 0, 'no spans when there are no backticks');
  assert.equal(c.codeSpanRanges('`unclosed').length, 0, 'an unclosed backtick is not a span');
});

test('promoteInlineShorthand: a {…} inside inline `code` stays LITERAL (the escape hatch)', () => {
  const mk = () => ({ text: '', dice: [], math: [], vars: [], grammar: [], est: [], markov: [], seq: [], query: [], children: [] });
  // bare braces still promote
  let n = mk(); n.text = 'roll {2d6}';
  c.promoteInlineShorthand(n);
  assert.match(n.text, /\[\[dice:[a-z0-9]+\]\]/, 'a bare {2d6} still promotes');
  // backtick-wrapped braces DO NOT promote — the backticks and the literal {2d6} survive verbatim
  n = mk(); n.text = 'docs: type `{2d6}` to roll';
  const changed = c.promoteInlineShorthand(n);
  assert.equal(n.text, 'docs: type `{2d6}` to roll', 'a `{2d6}` inside code stays literal');
  assert.equal(changed, false, 'nothing changed, so promote reports no change');
  // mixed: the coded one stays, the real one promotes — per-brace precision
  n = mk(); n.text = '`{a|b}` and real {2d6}';
  c.promoteInlineShorthand(n);
  assert.ok(n.text.startsWith('`{a|b}` and real [[dice:'), 'the coded brace stays, the real one promotes');
});

// ── Inbox reorder (change which capture # an inbox answers to) + the long-label delete fix ──
test('reorderInboxList: moves a slot, no-ops on same/out-of-range, trims trailing nulls', () => {
  const L = ['a', 'b', 'c', 'd'];
  assert.deepEqual(host(c.reorderInboxList(L, 1, 3)), ['b', 'c', 'a', 'd'], 'slot 1 -> 3');
  assert.deepEqual(host(c.reorderInboxList(L, 4, 1)), ['d', 'a', 'b', 'c'], 'slot 4 -> 1');
  assert.deepEqual(host(c.reorderInboxList(L, 2, 2)), ['a', 'b', 'c', 'd'], 'same slot is a no-op');
  assert.deepEqual(host(c.reorderInboxList(L, 5, 1)), ['a', 'b', 'c', 'd'], 'out-of-range from is a no-op');
  assert.deepEqual(host(c.reorderInboxList(L, 0, 2)), ['a', 'b', 'c', 'd'], 'slot 0 is invalid (1-based)');
  // trailing nulls trimmed to keep the persisted list tight (the setInboxSlot invariant)
  assert.deepEqual(host(c.reorderInboxList(['a', 'b', null], 3, 1)), [null, 'a', 'b'], 'a trailing null moves + tail is trimmed');
  assert.notEqual(c.reorderInboxList(L, 1, 3), L, 'operates on a copy, does not mutate the input');
});

test('inbox chips: reorder wiring (drag + Alt+Arrow) is present; the ✕ keeps its tap target', () => {
  // the pure mover + the DOM wrapper both exist
  assert.ok(_src.includes('function reorderInboxList('), 'the pure reorder core is missing');
  assert.ok(_src.includes('function moveInboxSlot('), 'the moveInboxSlot wrapper is missing');
  // desktop drag on the chip (gated off touch, since HTML5 drag never fires there)
  assert.ok(_src.includes('if (!IS_TOUCH) {') && _src.includes('chip.draggable = true'), 'the desktop drag is missing / not touch-gated');
  assert.ok(_src.includes("moveInboxSlot(from, slot)"), 'the drop must reorder via moveInboxSlot');
  // keyboard + touch/a11y fallback: Alt+Left/Right moves the slot (the app-wide Alt+Arrow=move grammar)
  assert.ok(_src.includes("(e.key === 'ArrowLeft' || e.key === 'ArrowRight')") && _src.includes('moveInboxSlot(slot, to)'), 'the Alt+Arrow reorder fallback is missing');
  // the long-label delete fix: the remove ✕ keeps its width, the label truncates
  assert.ok(/\.cap-chip-rm\{[^}]*flex-shrink:0/.test(_src), 'the ✕ must be flex-shrink:0 so a long label cannot squish it');
});

// ── Capture strip destination (#421 remap): the NAME opens the manager; the ↗ jumps ──
test('capture dest: the name-button opens the manager; the trailing jump segment zooms (#421)', () => {
  assert.ok(_src.includes("className = 'cap-dest-name-btn'"), 'the name button is missing');
  assert.ok(_src.includes("className = 'cap-dest-jump'"), 'the ↗ jump segment is missing');
  // the BIG zone does the safe thing: it toggles the manager and carries aria-expanded
  assert.ok(/name\.addEventListener\('click', \(\) => \{ captureManage = !captureManage/.test(_src), 'the name must toggle the inbox manager');
  assert.ok(_src.includes("name.setAttribute('aria-expanded'"), 'the name carries aria-expanded for the manager');
  // navigation lives ONLY on the small jump segment ("capturing never navigates you")
  assert.ok(/jump\.addEventListener\('click', \(\) => \{ zoomInto\(inbox\.id\)/.test(_src), 'the jump segment must zoom into the inbox point');
  assert.ok(_src.includes('fa-arrow-up-right-from-square'), 'the jump wears the outward-arrow glyph');
  assert.ok(/\.cap-dest-jump\{[^}]*flex-shrink:0/.test(_src), 'the jump segment stays shrink-proof');
  // the retired pencil must not come back
  assert.ok(!_src.includes("className = 'cap-dest-edit'"), 'the pencil is retired: the name does its job now');
});

// ── Inbox manager chips: badge selects the target, name zooms into the point; long name never hides ✕ ──
test('inbox manager chip: whole chip selects, the jump segment zooms (#421), and the chip can shrink', () => {
  // #421 remap: the badge AND the name both SELECT (the whole chip is the safe action);
  // navigation moved to the small ↗ jump segment between the name and the ✕
  assert.ok(_src.includes("className = 'cap-chip-badge'"), 'the slot badge is missing');
  assert.ok(_src.includes('badge.addEventListener(\'click\', selectSlot)'), 'the badge selects the capture target');
  assert.ok(_src.includes('pick.addEventListener(\'click\', selectSlot)'), 'the NAME selects too — the 125px zone must never navigate away');
  assert.ok(/jump\.addEventListener\('click', \(\) => \{ zoomInto\(n\.id\)/.test(_src), 'the chip jump segment zooms into that inbox point');
  assert.ok(_src.includes('chip.append(badge, pick, jump, rm)'), 'the chip order must be badge | name | jump | remove');
  // every segment teaches its verb to sighted mouse users (titles; aria-labels already existed)
  for (const t of ["badge.title = 'Set as capture target'", "pick.title = 'Set as capture target'", "jump.title = 'Go to this inbox point'", "rm.title = 'Remove inbox'"]) {
    assert.ok(_src.includes(t), 'missing segment title: ' + t);
  }
  // The overflow fix, browser-verified root cause: a global `button{flex-shrink:0}` makes the name button
  // (.cap-chip-pick) refuse to shrink, so its min-width:0 + text-overflow:ellipsis never fire and it pushes
  // the ✕ out of the overflow:hidden chip. The label MUST override with flex-shrink:1; the ✕ stays :0.
  assert.ok(/\.cap-chip-pick\{[^}]*flex-shrink:1/.test(_src), 'the name button must flex-shrink:1 to override the global button{flex-shrink:0}, or the ✕ hides on long labels');
  assert.ok(/\.cap-dest-name-btn\{[^}]*flex-shrink:1/.test(_src), 'the main-strip destination name must also flex-shrink:1 (same root cause)');
  assert.ok(/\.cap-chip\{[^}]*min-width:0/.test(_src), 'the chip must be min-width:0');
  assert.ok(/\.cap-chip-rm\{[^}]*flex-shrink:0/.test(_src), 'the ✕ must stay flex-shrink:0');
  // guard the root cause exists so the override stays meaningful
  assert.ok(/button\{[^}]*flex-shrink:0/.test(_src), 'the global button{flex-shrink:0} is what the pick must override');
});

// ── Strip chip type scale: chip + badge must be 11px (docked-strip scale), not the 17px body size ──
test('strip pill type scale: .cap-chip and .cap-chip-badge are on the 11px strip scale', () => {
  // design-language §4: docked-strip chips are 11px; without an explicit size they inherit the 17px body
  assert.ok(/\.cap-chip\{[^}]*font-size:11px/.test(_src), 'the chip must declare font-size:11px (the strip scale), not inherit 17px');
  assert.ok(/\.cap-chip-badge\{[^}]*font-size:11px/.test(_src), 'the badge must be font-size:11px, not font:inherit (which resets to 17px)');
  assert.ok(!/\.cap-chip-badge\{[^}]*font:inherit/.test(_src), 'the badge must NOT use font:inherit (it reset the size to the 17px body)');
});

// ── Workspace tabs + agenda switchers match the 22px strip height + the 11px info-text floor ──
test('switcher chips: doc-tabs + agenda nav are 22px (strip height); date text clears the 11px floor', () => {
  // design-language §4: every control in a docked strip row shares one 22px height
  assert.ok(/\.doc-tab\{[^}]*height:22px/.test(_src), 'doc-tab must be 22px (the strip control height), not 28px');
  assert.ok(/\.doc-tab-add\{[^}]*width:22px;height:22px/.test(_src), 'doc-tab-add must be a 22px square');
  assert.ok(/\.agc-nav\{[^}]*width:22px;height:22px/.test(_src), 'the agenda nav arrows must be 22px, not 28px');
  // §176: no informational text below 11px — the day numbers + weekday labels were 10px
  assert.ok(/\.agc-dom\{[^}]*font-size:11px/.test(_src), 'day numbers must be >= 11px (was 10px, under the info-text floor)');
  assert.ok(/\.agc-dow span\{[^}]*font-size:11px/.test(_src), 'weekday labels must be >= 11px (was 10px)');
  // the nav glyph + title drop to a compact 13px that fits the 22px row (were 16px/15px, oversized)
  assert.ok(/\.agc-nav\{[^}]*font-size:13px/.test(_src), 'the nav glyph must be 13px to fit the 22px row (was 16px)');
  assert.ok(/\.agc-title\{[^}]*font-size:13px/.test(_src), 'the month title must be 13px to fit the strip band (was 15px)');
});

// ── shadowedDeclKeys (#403): shadowed requires a LATER same-name declaration, not just zero refs ──
test('shadowedDeclKeys: a sole declaration with no references is LIVE, not shadowed (#403)', () => {
  const D = (name, key) => ({ name, key, isDecl: true });
  const R = (name) => ({ name, isDecl: false });
  // the Welcome-tour case: {level := 3} consumed only by math pills (which emit no reference events)
  assert.equal(c.shadowedDeclKeys([D('level', 'k1')]).size, 0, 'a sole declaration is live: nothing shadows it');
  // a later same-name declaration with no reference in between: the earlier one IS shadowed
  assert.ok(c.shadowedDeclKeys([D('x', 'a'), D('x', 'b')]).has('a'), 'redeclared with no in-range ref: shadowed');
  assert.ok(!c.shadowedDeclKeys([D('x', 'a'), D('x', 'b')]).has('b'), 'the last declaration is never shadowed');
  // a reference in range keeps the earlier declaration live even with a later redeclaration
  assert.equal(c.shadowedDeclKeys([D('x', 'a'), R('x'), D('x', 'b')]).size, 0, 'an in-range ref keeps it live');
  // a reference AFTER the later declaration belongs to that one: the earlier stays shadowed
  assert.ok(c.shadowedDeclKeys([D('x', 'a'), D('x', 'b'), R('x')]).has('a'), 'a ref after the redeclaration does not rescue the earlier one');
  // different names never interact
  assert.equal(c.shadowedDeclKeys([D('x', 'a'), D('y', 'b')]).size, 0, 'different names are independent ranges');
});

// ── Base/board menu operability (#415/#417): flip clamp + opener/closer event contract ──
test('mtOpenMenu: a flipped panel is clamped on-screen with its own scrollbar (#415)', () => {
  // the old flip (top = anchor.top - height) had no top clamp: a tall Column menu from a
  // mid-screen anchor rendered its head at negative y, so Calculate/Formula were unreachable
  assert.ok(_src.includes("panel.style.maxHeight = '';"), 'each open must reset the previous clamp before measuring');
  assert.ok(_src.includes('const spaceAbove = rect.top - 10;'), 'the flip must measure the room above the anchor');
  assert.ok(_src.includes("panel.style.maxHeight = h + 'px';"), 'the flipped panel must be height-clamped, not just repositioned');
});

test('board card opener and the document closer agree on the click event (#417)', () => {
  // the closer assumes "a click that reaches document is outside the panel"; opening on
  // mousedown let the same gesture's click bubble to document and close the just-opened
  // menu (mouse flicker), and left touch with no move door at all (drag is off on touch)
  const wire = _src.slice(_src.indexOf("host.querySelectorAll('.bv-card').forEach"));
  const down = wire.slice(wire.indexOf("card.addEventListener('mousedown'"), wire.indexOf("card.addEventListener('click'"));
  assert.ok(down.length > 0, 'the card must keep its mousedown listener (the caret-invariant preventDefault)');
  assert.ok(!down.includes('showCardMenu'), 'mousedown must NOT open the menu (the flicker/touch bug)');
  const clickBody = wire.slice(wire.indexOf("card.addEventListener('click'"));
  const body = clickBody.slice(0, clickBody.indexOf('});'));
  assert.ok(body.includes('showCardMenu('), 'the click listener is the one that opens the menu');
  assert.ok(body.includes('e.stopPropagation()'), 'the opener must stop propagation so the document closer never sees the opening click');
  assert.ok(/document\.addEventListener\('click', e => \{[^]{0,300}hideColPanel\(\)/.test(_src), 'the document-level closer must listen on click, matching the opener');
});

// ── toastGate (#391): the shared toast element has error priority ──
test('toastGate: an error owns the toast for its dwell; hints defer; errors always preempt (#391)', () => {
  const err = c.toastGate('error', 1000, 0);
  assert.equal(err.paint, true, 'an error always paints');
  assert.equal(err.holdUntil, 5000, 'the error dwell is 4000ms from now');
  assert.equal(c.toastGate('hint', 2000, 5000).paint, false, 'a hint mid-dwell must not repaint the element');
  assert.equal(c.toastGate('hint', 5000, 5000).paint, true, 'the dwell end releases the element to hints');
  assert.equal(c.toastGate('hint', 6000, 0).paint, true, 'no live error: hints paint freely');
  assert.equal(c.toastGate('error', 3000, 5000).paint, true, 'a NEW error may preempt a live error');
});

test('flash channel wiring: hints consult the gate, deferred hints still announce, errors set the hold (#391)', () => {
  assert.ok(_src.includes("toastGate('hint', Date.now(), _errorHoldUntil)"), 'flashHint must ask the gate before painting');
  assert.ok(_src.includes("toastGate('error', Date.now(), 0)"), 'flashError must take the hold from the gate (the dwell length lives there only)');
  const defer = _src.slice(_src.indexOf("toastGate('hint', Date.now(), _errorHoldUntil)"));
  const block = defer.slice(0, defer.indexOf('return;'));
  assert.ok(block.includes('_pendingHint = msg'), 'a deferred hint is queued for replay after the dwell');
  assert.ok(block.includes('announce(msg)'), 'a deferred hint must still reach assistive tech immediately');
});

// ── Docked-stack viewport ceiling (#389): the toolbar can never exceed the screen ──
test('docked stack failsafe: #toolbar clamps to the viewport and the agenda pane scrolls (#389)', () => {
  assert.ok(/#toolbar\{[^}]*max-height:100dvh/.test(_src), '#toolbar must clamp to 100dvh (was unbounded: 123% of a landscape phone)');
  assert.ok(/#toolbar\{[^}]*flex-direction:column/.test(_src), 'the toolbar is a flex column so exactly one strip can give up height');
  assert.ok(/#toolbar > \*\{flex-shrink:0\}/.test(_src), 'every strip keeps its height by default');
  assert.ok(/#agenda-strip\.on\{[^}]*overflow-y:auto/.test(_src), 'the agenda strip is the designated scrolling region');
  assert.ok(/#agenda-strip\.on\{[^}]*min-height:0/.test(_src), 'min-height:0 lets the flex item actually shrink below its content');
});

// ── inFence (#405): Enter never splits a fenced code block into two broken halves ──
test('inFence: strictly-inside offsets are fenced; the region edges split into valid halves (#405)', () => {
  const T = '```\nline one\nline two\n```';
  assert.equal(c.inFence(T, 12), true, 'end of an interior code line is inside the fence');
  assert.equal(c.inFence(T, 17), true, 'mid interior line is inside');
  assert.equal(c.inFence(T, 2), true, 'splitting the opening ``` line itself breaks the fence');
  assert.equal(c.inFence(T, 24), true, 'splitting the closing ``` line itself breaks the fence');
  assert.equal(c.inFence(T, 0), false, 'exactly before the opener: both halves stay valid');
  assert.equal(c.inFence(T, T.length), false, 'exactly after the closer: both halves stay valid');
  const P = 'intro\n```\ncode\n```\ntail';
  assert.equal(c.inFence(P, 3), false, 'prose before the fence splits freely');
  assert.equal(c.inFence(P, P.length - 2), false, 'prose after the fence splits freely');
  assert.equal(c.inFence(P, 12), true, 'the fenced middle is protected');
  assert.equal(c.inFence('```\ncode', 6), true, 'an unclosed opener protects to end-of-text');
  assert.equal(c.inFence('```\ncode', 0), false, 'before an unclosed opener still splits freely');
  assert.equal(c.inFence('no fences at all', 8), false, 'no fence, no veto');
});

test('Enter split wiring: the caret-split arm consults inFence and falls through to the eject (#405)', () => {
  assert.ok(_src.includes('&& !inFence(buf, off)'), 'insertSiblingAfter must veto the split mid-fence (falls through to the advertised eject)');
});

// ── Esc ladder (#406): one press resolves exactly one rung ──
test('Esc while editing in a zoom carries the edit across zoomOut (#406)', () => {
  assert.ok(/const off = getCaretOffset\(content\);\s*zoomOut\(\);\s*focusNodeAtOffset\(id, off\);/.test(_src),
    'the zoom rung must preserve the interrupted edit (id + caret) across the re-render; the NEXT Esc blurs');
});

// ── {date due: } lockstep (#407): classify says what promote will do, and the decline flashes ──
test('classifyBraceBody: an unparseable date value is invalid LIVE, matching the literal-on-exit promote (#407)', () => {
  assert.equal(c.classifyBraceBody('date due: garbage', {}, {}), 'invalid', 'unparseable value: say so while editing (gr-bad), not after');
  assert.equal(c.classifyBraceBody('date due: today', {}, {}), 'artifact', 'a parseable keyword date promotes');
  assert.equal(c.classifyBraceBody('date start: today+3', {}, {}), 'artifact', 'relative dates promote');
  assert.equal(c.classifyBraceBody('date due: 2026-07-10', {}, {}), 'artifact', 'ISO dates promote');
  assert.equal(c.classifyBraceBody('date due: 2026-02-30', {}, {}), 'invalid', 'an impossible calendar date is invalid');
  assert.equal(c.classifyBraceBody('date due:', {}, {}), 'artifact', 'an empty value is the valid clear-the-date form');
});

test('promoteBraceBody: the invalid-date decline flashes the shared message (#407)', () => {
  assert.ok(_src.includes("flashHint('Not a valid date: ' + dd.val + '. ' + DATE_FORMS_HINT)"),
    'the exit decline must give the same P4 feedback as the /due:value twin');
});

// ── Inventory drift guards (#393/#408): the closed set must certify truthfully ──
// The section 2 syntax inventory is the load-bearing artifact of P5: reviewers diff the source
// against it. It drifted four times in three weeks because nothing enforced it. These pins make
// shipping a brace sniff, an is: keyword, or an arg-verb without recording it a CI failure.
const _uxd = readFileSync(new URL('../guidance/ux-discipline.md', import.meta.url), 'utf8');
const _inv = _uxd.slice(_uxd.indexOf('Syntax inventory — the closed set'), _uxd.indexOf('## 3. Keyboard grammar'));

test('inventory drift guard: every brace sniff in code has its token in the section 2 inventory (#393)', () => {
  // sniff function in index.html → the syntax token the inventory must carry for it
  const SNIFFS = {
    condParts: '{cond:', seqParts: '{shuffle', markovParts: '{markov:', seqDeclParts: '{seq ',
    repeatParts: '{Nx:', propDeclParts: '{prop ', dateDeclParts: '{date due:',
    queryParts: '{query:', rollParts: '{roll:', parseVarDecl: ':=', estParts: 'lo to hi',
  };
  for (const [fn, token] of Object.entries(SNIFFS)) {
    assert.ok(_src.includes(`function ${fn}`), `sniff ${fn} vanished from index.html — update this guard with the rename`);
    assert.ok(_inv.includes(token), `the inventory must record the ${fn} form (missing token: ${token}) — a typeable syntax not in the closed set is a P5-4 defect`);
  }
});

test('inventory drift guard: the is: whitelist in parseSearchQuery matches the section 2 row (#408)', () => {
  const m = _src.match(/\^is:\(([a-z|-]+)\)\$/);   // `-` so hyphenated ops (is:duplicate-title) match
  assert.ok(m, 'could not find the is: whitelist regex in parseSearchQuery — update this guard with the new shape');
  for (const kw of m[1].split('|')) {
    assert.ok(_inv.includes('`' + kw + '`'), `is:${kw} shipped in code but is missing from the section 2 Search-query row`);
  }
});

test('inventory drift guard: every SLASH_ARG_VERBS member is listed in the section 3 row (#409)', () => {
  const m = _src.match(/const SLASH_ARG_VERBS = \/\^\(([a-z|]+)\)\$\//);
  assert.ok(m, 'could not find SLASH_ARG_VERBS in index.html — update this guard with the new shape');
  const row = _uxd.slice(_uxd.indexOf('`/verb:value`'), _uxd.indexOf('*(Retired:'));
  for (const verb of m[1].split('|')) {
    assert.ok(row.includes('`' + verb + '`'), `arg-verb /${verb}: shipped in SLASH_ARG_VERBS but missing from the section 3 row`);
  }
});

// ── CSS consistency batch drift guards (#395 #396 #397 #398 #400 #411 #414) ──
test('menu/table/strip CSS conformance pins (fleet CSS batch)', () => {
  // #395: the selected row's solid-accent icon tile keeps --acc-fg (was --fg at 1.62:1 dark)
  assert.ok(_src.includes('.cmd-item:hover .cmd-icon.accent,.cmd-item.hi .cmd-icon.accent{color:var(--acc-fg)}'),
    'ink on the solid accent tile must be --acc-fg even on the highlighted row');
  // #411: header echo — 600 (never 700) + a 2px rule with winning specificity
  assert.ok(/\.mt-name-pill\{[^}]*font-weight:600/.test(_src), 'column names render 600, never 700 (DL §4)');
  assert.ok(_src.includes('.md-table th.mt-colhead{border-bottom-width:2px}'), 'the 2px header rule needs th.mt-colhead specificity to actually paint');
  // #396: one highlight recipe — no 13% or accent-ink variants, no gray highlight
  assert.ok(!/\.lp-item:hover,\.lp-item\.hi\{[^}]*13%/.test(_src), 'the link picker must use the 10% recipe');
  assert.ok(!/\.bm-item:hover,\.bm-item\.hi\{[^}]*color:var\(--acc\)/.test(_src), 'picker highlight must not flip ink to accent');
  assert.ok(!/\.mt-col-item:hover,\.mt-col-item:focus\{background:var\(--bdr\)\}/.test(_src), 'the column panel highlight must be the accent tint, not the disabled-look gray');
  // #400: danger is --bad everywhere
  assert.ok(/\.mt-col-item\.mt-col-danger\{color:var\(--bad\)/.test(_src), 'a destructive menu row is --bad, never the de-emphasis gray');
  // #397: doc-tab strip carries the full chip grammar; the canon chip pins its own 22px
  assert.ok(/\.doc-tab\{[^}]*border:1px solid var\(--bdr-ui\)/.test(_src), 'doc-tab border is the functional --bdr-ui token');
  assert.ok(/\.doc-tab\{[^}]*font-weight:600/.test(_src), 'doc-tab text weighs 600 like every strip chip');
  assert.ok(/\.doc-tab-add\{[^}]*font-size:11px/.test(_src), 'the + glyph is 11px like .cap-add');
  assert.ok(/\.ag-toggle\{[^}]*height:22px/.test(_src), 'the canon chip pins the explicit 22px');
  // #398: the Week pane uses the shared urgency recipe + the one done opacity
  assert.ok(!/\.agw-item\.(overdue|today|soon)\{[^}]*(32%|28%|9%,)/.test(_src), 'the Week pane must not re-mint the urgency tints');
  assert.ok(/\.agw-item\.done\{opacity:\.5;/.test(_src), 'one done opacity (.5) across the agenda panes');
  // #414: the sub-floor cluster is at/above the 11px floor or carries the caps exemption
  for (const sel of ['.sf-tip', '.sh-ws-snip', '.agd-count', '.agd-more']) {
    assert.ok(new RegExp(sel.replace('.', '\\.') + '\\{[^}]*font-size:11px').test(_src), sel + ' must clear the 11px info-text floor');
  }
  assert.ok(/\.sh-row code\{[^}]*font-size:11px/.test(_src), '.sh-row code must clear the floor');
  assert.ok(/\.agg-tick\{[^}]*text-transform:uppercase;letter-spacing:\.07em/.test(_src), '.agg-tick earns 10px only via the caps-eyebrow exemption');
  assert.ok(!/\.sc-or\{[^}]*opacity/.test(_src), 'no opacity fade on muted ink (de-emphasis is by role)');
});

// ── Glyph identities (#412/#413): one glyph, one concept ──
test('glyph identities: template/progress/check wear their own glyphs; deck and theme keep theirs (#412/#413)', () => {
  assert.ok(/id:'template',[^}]*fa-stamp/.test(_src), 'template is fa-stamp (stamp-a-copy)');
  assert.ok(/id:'savetemplate',[^}]*fa-stamp/.test(_src), 'savetemplate matches template');
  assert.ok(_src.includes("const TEMPLATE_ICON = { fa: 'fa-solid fa-stamp'"), 'TEMPLATE_ICON (picker + save dialog + bullet row) agrees with the door');
  assert.ok(/id:'deck',[^}]*fa-clone/.test(_src), 'deck keeps its recorded fa-clone identity');
  assert.ok(/id:'progress',[^}]*fa-bars-progress/.test(_src), 'progress is fa-bars-progress');
  assert.ok(_src.includes('#theme-icon') || /fa-circle-half-stroke/.test(_src), 'theme keeps fa-circle-half-stroke');
  assert.ok(/id:'check',[^}]*fa-clipboard-check/.test(_src), 'the Check verb leaves the check family (three near-identical picks in one menu)');
  assert.ok(_src.includes("const CHECK_ICON = { fa: 'fa-solid fa-clipboard-check'"), 'CHECK_ICON (dialog + bullet-menu row) agrees with the door');
  // the subset must actually carry the three new glyphs, or they paint the emoji fallback
  for (const g of ['fa-stamp', 'fa-bars-progress', 'fa-clipboard-check']) {
    assert.ok(new RegExp("FA_GLYPHS = new Set\\(\\[[^\\]]*'" + g + "'").test(_src), g + ' must be in the FA_GLYPHS allow-list');
    assert.ok(new RegExp('\\.' + g + '::before\\{content:').test(_src), g + ' must have its ::before rule in the fa-embed style');
  }
});

// ── Numeric pick vars compose with math (the {r := 1d20} crit-check pattern) ──
// A pick var freezes its roll as a string; when that string IS a number, collectVars
// resolves it as one so conditionals and {= …} can test a captured die. Any other
// pick stays a string and keeps failing math visibly (the type-safety contract).
test('collectVars — a numeric pick roll resolves as a number, a text pick stays a string', () => {
  const root = { id: 'root', text: '', children: [
    { id: 'a', text: 'm [[var:k1]]', vars: [{ key: 'k1', name: 'mod', expr: '3', typed: true }], children: [] },
    { id: 'b', text: 'r [[var:k2]]', vars: [{ key: 'k2', name: 'r', expr: '1d20', kind: 'pick', rolled: '15', typed: true }], children: [] },
    { id: 'c', text: 'n [[var:k3]]', vars: [{ key: 'k3', name: 'npc', expr: 'Acme | Zenith', kind: 'pick', rolled: 'Acme', typed: true }], children: [] },
  ] };
  const vars = c.collectVars(root);
  assert.equal(vars.r, 15);
  assert.equal(typeof vars.r, 'number');
  assert.equal(vars.npc, 'Acme');           // text picks are untouched
  assert.equal(c.evalMath('r + mod', vars), 18);
  assert.equal(c.evalMath('npc + 1', vars), null);   // strings still fail math visibly
});

test('conditional grammar — captured d20 crit/DC check expands through collectVars', () => {
  const mk = (rolled) => c.collectVars({ id: 'root', text: '', children: [
    { id: 'a', text: 'm [[var:k1]]', vars: [{ key: 'k1', name: 'mod', expr: '3', typed: true }], children: [] },
    { id: 'b', text: 'r [[var:k2]]', vars: [{ key: 'k2', name: 'r', expr: '1d20', kind: 'pick', rolled, typed: true }], children: [] },
  ] });
  const tpl = '{r == 1: Critical failure!|{r == 20: Critical!|{r + mod >= 12: Success ({= r + mod})|Fail ({= r + mod})}}}';
  const run = (rolled) => c.expandTemplate(tpl, { rules: {}, vars: mk(rolled), depth: 0, seen: new Set() });
  assert.equal(run('1'), 'Critical failure!');
  assert.equal(run('20'), 'Critical!');
  assert.equal(run('8'), 'Fail (11)');
  assert.equal(run('9'), 'Success (12)');
  assert.equal(run('15'), 'Success (18)');
});

// Wiring pins for the same-pass promotion ordering ({r := 1d20} {r == 20: …}): the decl
// branch must invalidate the collector cache AND the walk must publish the partially
// promoted text before the next brace expands, or the conditional freezes its first
// verdict as the unresolved marker. Behavior is browser-verified; these pin the wiring
// (the promotion chain reads the module-level `root`, so it can't run against a test tree).
test('typed var decl promotion — fresh name visible to later braces in the same pass', () => {
  const src = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
  const declBlock = src.slice(src.indexOf('function promoteBraceBody'), src.indexOf('// dice: {2d6}'));
  assert.equal((declBlock.match(/resetDocCaches\(\)/g) || []).length, 2,
    'both decl pushes (formula + pick) must reset the doc caches');
  const walk = src.slice(src.indexOf('function promoteInlineShorthand'), src.indexOf('function promoteLoadedShorthand'));
  assert.ok(walk.includes('node.text = out + text.slice(i); continue;'),
    'the walk must publish the partial rewrite so collectVars sees the fresh [[var:]] token');
});

// ── textForDisplay (#420): labels derive from the text, matching the render ──
test('textForDisplay: a heading/quote point with the DEFAULT type still labels prefix-stripped (#420)', () => {
  const N = (text, type) => ({ text, type, children: [] });
  // the Examples-doc case: OPML with no _type → node.type stays 'ul' but the text IS a heading
  assert.equal(c.textForDisplay(N('## Advanced', 'ul')), 'Advanced', 'breadcrumb/picker labels must not show raw ## when the flag is absent');
  assert.equal(c.textForDisplay(N('> a quote line', 'ul')), 'a quote line', 'quote prefix strips by derivation too');
  // parity: the flag path still works and wins first
  assert.equal(c.textForDisplay(N('## Advanced', 'h2')), 'Advanced', 'the typed path is unchanged');
  // a hashtag is NOT a heading (no space after #): stays intact
  assert.equal(c.textForDisplay(N('#tag first', 'ul')), '#tag first', 'a leading hashtag must not be mistaken for a heading prefix');
  // plain text untouched
  assert.equal(c.textForDisplay(N('plain point', 'ul')), 'plain point');
});

// ── Schedule dialog trim (#418): a day-pick commits when the other field is empty ──
test('Schedule dialog: calendar day-pick commits-and-closes for single-date points (#418)', () => {
  assert.ok(_src.includes("dateField('Start', startInit, 'Start date', () => { if (!dueF.inp.value.trim()) save(); })"),
    'a Start day-pick saves when Due is empty');
  assert.ok(_src.includes("dateField('Due',   dueInit,   'Due date',   () => { if (!startF.inp.value.trim()) save(); })"),
    'a Due day-pick saves when Start is empty (the one-day-bump path)');
  assert.ok(_src.includes('if (onPicked) onPicked(ep);'), 'attachDateCalendar exposes the pick hook the dialog wires');
});

// ── Chrome legibility (#416/#419): visible column-menu door + agenda kind labels ──
test('column header carries the visible menu door; agenda groups carry kind labels (#416/#419)', () => {
  // #416: the ▾ opener is emitted in every plain header, hover-revealed, always-on for touch,
  // and pointer-transparent (the header's existing menu zone stays the one handler)
  assert.ok(_src.includes('class="mt-col-open"'), 'the header must emit the visible menu door');
  assert.ok(/\.mt-col-open\{[^}]*pointer-events:none/.test(_src), 'the door is decorative: clicks fall through to the existing menu zone');
  assert.ok(_src.includes('.mt-colhead:hover .mt-col-open,.mt-colhead:focus-within .mt-col-open{opacity:1}'), 'hover/focus reveals it');
  assert.ok(/@media\(hover:none\)\{\.mt-col-open\{opacity:1\}\}/.test(_src), 'touch (no hover) shows it always');
  // #419: the three control kinds are labelled; Sort stands apart from the filters
  assert.ok(_src.includes("mkGrpLbl('Views')"), 'the view switcher carries its kind label');
  assert.ok(_src.includes("mkGrpLbl('Filters')"), 'the filters carry theirs');
  assert.ok(_src.includes("mkGrpLbl('Sort')"), 'Sort stands apart with its own label');
  assert.ok(/\.ag-grp-lbl\{[^}]*text-transform:uppercase;letter-spacing:\.07em/.test(_src), 'labels use the caps-eyebrow exemption, not sub-floor plain text');
});

// ── Mobile neophyte batch: first-run tap targets + duplicate-inbox guard ──
test('first-run banner controls reach the touch tap floor (mobile-neophyte review)', () => {
  // the Save/"Start a blank outline" button and the ✕ were the only first-screen controls
  // the @media(hover:none) enlargement pass never reached (guardrail 5). Both now do.
  const hoverNone = _src.slice(_src.indexOf('@media(hover:none){\n  #storage-warn button'));
  assert.ok(/#storage-warn button\{min-height:36px/.test(hoverNone), 'the banner buttons must grow to the 36px+ box on touch');
  assert.ok(/#storage-warn-close\{[^}]*min-height:36px/.test(hoverNone), 'the ✕ must reach the tap floor on touch');
  assert.ok(/#storage-warn-close::after\{content:'';position:absolute;inset:-6px\}/.test(hoverNone), 'the ✕ uses the invisible ::after hit overlay (glyph stays small)');
});

test('inbox picker: re-picking an existing inbox retargets its slot, never appends a duplicate (mobile-neophyte review)', () => {
  // the "Add an inbox" tree picker computed length+1 unconditionally, so re-picking a point that
  // was already an inbox produced inboxes == [id, id]. Guard with inboxSlotOf, like the bullet menu.
  const pick = _src.slice(_src.indexOf("title: 'Add an inbox'"));
  const body = pick.slice(0, pick.indexOf('footLabel'));
  assert.ok(/const existing = inboxSlotOf\(it\.id\);/.test(body), 'the picker must check whether the point is already an inbox');
  assert.ok(/if \(existing\) \{ captureSlot = existing; back\(\); return; \}/.test(body), 'a re-pick retargets the existing slot and returns before appending');
});

// ── countHiddenDone (MOBILE-2): the Done-button badge count ──
test('countHiddenDone: counts checked to-dos hidden while show-done is off; 0 when shown (MOBILE-2)', () => {
  const todo = (checked) => ({ type: 'todo', checked, children: [] });
  const tree = { children: [
    todo(true),               // hidden done
    todo(false),              // open to-do — not counted
    { type: 'ul', children: [ todo(true), todo(true) ] },   // two nested hidden done
    { type: 'ul', checked: true, children: [] },            // checked but NOT type todo — not counted
  ] };
  assert.equal(c.countHiddenDone(tree, false), 3, 'three checked to-dos are hidden while show-done is off');
  assert.equal(c.countHiddenDone(tree, true), 0, 'show-done on: nothing is hidden');
  assert.equal(c.countHiddenDone({ children: [todo(false), todo(false)] }, false), 0, 'no done points: 0');
  assert.equal(c.countHiddenDone({ children: [] }, false), 0, 'empty tree: 0');
  // a non-todo checked node (e.g. a base) never counts
  assert.equal(c.countHiddenDone({ children: [{ type: 'base', checked: true, children: [] }] }, false), 0, 'only type:todo counts');
});

test('Done-button badge wiring: syncDoneBadge sets the count + recovery aria-label, render() calls it (MOBILE-2)', () => {
  assert.ok(_src.includes('function syncDoneBadge()'), 'the badge sync function must exist');
  assert.ok(/countHiddenDone\(root, showDone\)/.test(_src), 'it counts hidden-done from the live root + showDone');
  assert.ok(/btn\.classList\.toggle\('has-hidden', n > 0\)/.test(_src), 'the .has-hidden class reveals the badge only when something is hidden');
  assert.ok(_src.includes('Done points: ${n} hidden. Activate to show them.') || _src.includes('hidden. Activate to show them.'), 'the accessible name must carry the count + recovery verb');
  assert.ok(/syncDoneBadge\(\);\s*\/\/ MOBILE-2/.test(_src) || /syncDoneBadge\(\);\s*reconcileHeights/.test(_src), 'render() must call syncDoneBadge so the count tracks every check/toggle');
  // the badge markup + the reveal CSS
  assert.ok(_src.includes('id="btn-done-badge"'), 'the badge span is in the button');
  assert.ok(/#btn-done\.has-hidden \.tbtn-badge\{[^}]*display:inline-flex/.test(_src), 'the badge shows only under .has-hidden');
});

// ── Code-quality audit fixes: derived-hint re-derivation + sidecar carry ──
test('rederiveFromText: restores BOTH type and checked from text (audit #2/#3 — checked was dropped)', () => {
  // the bug: applyEntry (undo) and exitZoomEdit re-derived type but forgot checked, so an
  // undone/edited to-do kept a stale checked and isVisible filtered the intact row out.
  const n1 = { type: 'todo', checked: true, text: '- [ ] open again' };
  c.rederiveFromText(n1);
  assert.equal(n1.checked, false, 'unchecking via text must clear checked, not leave it stale');
  assert.equal(n1.type, 'todo', 'still a to-do');
  const n2 = { type: 'todo', checked: false, text: '- [x] now done' };
  c.rederiveFromText(n2);
  assert.equal(n2.checked, true, 'checking via text sets checked');
  // a heading loses its to-do-ness in both fields
  const n3 = { type: 'todo', checked: true, text: '## A heading now' };
  c.rederiveFromText(n3);
  assert.equal(n3.type, 'h2'); assert.equal(n3.checked, false, 'a non-task text is not checked');
  // the ul fallback: was a block type, text no longer carries a prefix
  const n4 = { type: 'quote', checked: false, text: 'plain text' };
  c.rederiveFromText(n4);
  assert.equal(n4.type, 'ul', 'a former block type with plain text falls back to ul');
  assert.doesNotThrow(() => c.rederiveFromText(null), 'null node is a safe no-op');
});

test('ARTIFACT_SIDECARS carry: a query record survives a split/merge (audit #4 — query was omitted)', () => {
  // the bug: [[query:KEY]] moved with the text on Enter-split/Backspace-merge but node.query
  // was left behind, so the moved token rendered as query-bad. clone/merge must carry it.
  const src = { query: [{ key: 'q1', expr: 'is:todo' }], dice: [{ key: 'd1' }], props: [{ key: 'owner', val: 'zeo' }] };
  const clone = {};
  c.cloneArtifactSidecars(src, clone);
  assert.equal(clone.query?.length, 1, 'the query sidecar must be carried on a split (was dropped)');
  assert.equal(clone.query[0].expr, 'is:todo', 'the record content survives');
  assert.equal(clone.dice?.length, 1, 'other token sidecars still carry');
  assert.equal(clone.props, undefined, 'props is point METADATA — deliberately NOT carried (a split continues text, not metadata)');
  // merge concatenates onto the destination, keeping both sides
  const dst = { query: [{ key: 'q0', expr: 'is:done' }] };
  c.mergeArtifactSidecars(src, dst);
  assert.equal(dst.query.length, 2, 'merge keeps the destination record AND appends the source query record');
  assert.deepEqual(dst.query.map(q => q.key).sort(), ['q0', 'q1']);
});

// ── Formatting keyboard shortcuts (backlog G): ⌘B/I/U wrap the selection ──
test('format shortcuts: ⌘/Ctrl+B/I/U route to applyInlineFormat via FORMAT_SHORTCUTS', () => {
  assert.ok(_src.includes("const FORMAT_SHORTCUTS = { b: 'bold', i: 'italic', u: 'uline' }"), 'the chord→format-id map must exist');
  // the onKeyDown binding: plain ctrl (no shift/alt), preventDefault, calls applyInlineFormat with the mapped id
  assert.ok(/ctrl && !e\.shiftKey && !e\.altKey && FORMAT_SHORTCUTS\[e\.key\?\.toLowerCase\(\)\]/.test(_src), 'the binding must be plain-ctrl, no shift/alt, guarded by the map');
  assert.ok(/applyInlineFormat\(FORMAT_SHORTCUTS\[e\.key\.toLowerCase\(\)\]\)/.test(_src), 'it must call the shipped applyInlineFormat, not a new wrap path');
  // documented in the ? panel
  assert.ok(_src.includes("id:'edit-format'") && /Bold \/ italic \/ underline/.test(_src), 'the shortcut must be in the ? panel Edit section');
  // every mapped id is a real FORMAT_CMDS id (no dangling map entry)
  assert.ok(/id:'bold'/.test(_src) && /id:'italic'/.test(_src) && /id:'uline'/.test(_src), 'bold/italic/uline are real FORMAT_CMDS ids');
});

// ── Math pills read own-node props (backlog A, own-node half) ──
test('math pill scope: a node own numeric prop resolves in {= }, own props win over doc vars', () => {
  // the behavior the pill now uses: Object.assign({}, docVars, nodePropVars(node)) then evalMath.
  const node = { props: [{ key: 'hp', val: '14' }, { key: 'max', val: '20' }, { key: 'name', val: 'Aric' }] };
  const docVars = { hp: 3, bonus: 2 };   // a doc var also named hp — the node prop must WIN
  const scope = Object.assign(Object.create(null), docVars, c.nodePropVars(node));
  assert.equal(c.evalMath('hp', scope), 14, 'own prop hp:14 resolves and shadows the doc var hp:3');
  assert.equal(c.evalMath('max - hp', scope), 6, 'arithmetic over own props');
  assert.equal(c.evalMath('bonus', scope), 2, 'a doc var with no prop shadow still resolves');
  assert.equal(c.evalMath('name', scope), null, 'a non-numeric prop is not a number (nodePropVars drops it)');
  // a no-prop node leaves the doc scope untouched
  const empty = Object.assign(Object.create(null), docVars, c.nodePropVars({ props: [] }));
  assert.equal(c.evalMath('hp', empty), 3, 'no own props → doc var stands, nothing moves');
});

test('renderMathPill wiring: builds the merged own+ancestor scope and uses it for both compute and error reason (backlog A / #461)', () => {
  const fn = _src.slice(_src.indexOf('function renderMathPill'), _src.indexOf('function renderMathPill') + 1700);
  // #461: the merge now flows through resolveNodeScope with the ancestor chain (own props still win)
  assert.ok(/const scope = resolveNodeScope\(cookieNode, ancestorsOf\(cookieNode\), renderVarMap\)/.test(fn), 'the pill scope inherits ancestor props via resolveNodeScope (own props win last)');
  assert.ok(/evalMath\(expr, scope\)/.test(fn), 'the fresh compute uses the merged scope');
  assert.ok(/mathErrorReason\(expr, scope, _varCycles\)/.test(fn), 'the error-reason path uses the SAME scope (or a prop-resolved expr shows a false #ERR reason)');
});

// ── #448 correctness hazards batch ───────────────────────────────────────────

// Hazard 1: expandAggExpr must NOT capture the numeric-floor idiom max(hp, 10) / min(x, 5)
// as a child-property rollup — only a KEYWORD scope marks a min/max rollup; a numeric 2nd
// arg stays a variadic arg for evalMath. sum/avg/count keep the full scope incl. numeric depth.
test('expandAggExpr — min/max numeric 2nd arg is a variadic arg, not a rollup scope (#448)', () => {
  const mk = (cost) => ({ props: [{ key: 'cost', val: String(cost) }], children: [] });
  const node = { props: [], children: [mk(3), mk(7), mk(5)] };
  const ax = (e) => c.expandAggExpr(e, node);
  // the bug: max(hp,10) was read as aggregate(prop=hp, scope=10). Must stay literal now.
  assert.equal(ax('max(hp, 10)'), 'max(hp, 10)', 'numeric-floor max stays literal for evalMath');
  assert.equal(ax('min(x, 5)'), 'min(x, 5)', 'numeric-floor min stays literal for evalMath');
  assert.equal(c.evalMath(ax('max(hp, 10)'), { hp: 4 }), 10, 'evalMath computes the floor (hp<10)');
  assert.equal(c.evalMath(ax('max(hp, 10)'), { hp: 99 }), 99, 'evalMath computes the floor (hp>10)');
  // min/max rollups still work with 1 arg or a KEYWORD scope
  assert.equal(ax('max(cost)'), '(7)', 'max(cost) still rolls up direct children');
  assert.equal(ax('max(cost, subtree)'), '(7)', 'max(cost, subtree) still rolls up');
  // sum/avg/count keep numeric depth (they are not evalMath fns → no collision)
  assert.equal(ax('sum(cost)'), '(15)', 'sum(cost) rolls up');
  assert.equal(ax('sum(cost, 2)'), '(15)', 'sum(cost, N) numeric depth still works');
  assert.equal(ax('count(cost)'), '(3)', 'count(cost) rolls up');
});

// Hazard 2 (source pin): every array sidecar in fromOpml goes through arrAttr, which
// Array-guards so a corrupt/hostile .opml carrying non-array JSON (_dice="{}") can't make
// renderContentHTML throw on .find/.map. (DOM-coupled, so pinned at the source.)
test('fromOpml — every array sidecar is Array-guarded via arrAttr (#448)', () => {
  assert.ok(_src.includes('function arrAttr('), 'the arrAttr helper must exist');
  assert.ok(/return Array\.isArray\(v\) \? v : \[\]/.test(_src), 'arrAttr must Array-guard the parsed value');
  for (const key of ['footnotes', 'dice', 'markov', 'rolltable', 'math', 'vars', 'grammar', 'est', 'seq', 'query', 'props']) {
    assert.ok(new RegExp(`${key}:\\s*arrAttr\\(el, '_${key === 'footnotes' ? 'footnotes' : key}'\\)`).test(_src)
      || new RegExp(`${key}:\\s*arrAttr\\(el, '_\\w+'\\)`).test(_src),
      `${key} sidecar must parse via arrAttr`);
  }
});

// Hazard 3: applyRefold must not reattach the WRONG frozen roll to a surviving duplicate.
// When identical sh appears N times in pairs but < N in the text (one was deleted while
// editing), positional order is ambiguous → leave those {sh} to re-promote fresh.
test('applyRefold — deleting one of two identical shorthands does not misattach a frozen roll (#448)', () => {
  const pairs = [{ sh: '{2d6}', token: '[[dice:K1]]' }, { sh: '{2d6}', token: '[[dice:K2]]' }];
  // both survive, unchanged: refold in order (no regression)
  assert.equal(c.applyRefold('a {2d6} b {2d6} c', pairs), 'a [[dice:K1]] b [[dice:K2]] c');
  // deleted the FIRST: the survivor must NOT silently become K1 — left as {2d6} to re-roll
  assert.equal(c.applyRefold('a  b {2d6} c', pairs), 'a  b {2d6} c', 'ambiguous survivor re-rolls, never a wrong frozen roll');
  // deleted the SECOND: likewise ambiguous → left to re-roll
  assert.equal(c.applyRefold('a {2d6} b  c', pairs), 'a {2d6} b  c');
  // DISTINCT shorthands are unaffected even when one is deleted
  const p2 = [{ sh: '{2d6}', token: '[[dice:K1]]' }, { sh: '{1d20}', token: '[[dice:K2]]' }];
  assert.equal(c.applyRefold('a  b {1d20} c', p2), 'a  b [[dice:K2]] c', 'distinct sh keeps its own frozen roll');
  // single untouched shorthand still refolds (the common case)
  assert.equal(c.applyRefold('x {2d6} y', [{ sh: '{2d6}', token: '[[dice:K1]]' }]), 'x [[dice:K1]] y');
});

// #443: base grid roving tabindex — exactly one cell is the grid's tab stop, so Tab enters
// at a predictable cell and Tab-out-then-back returns to it. DOM-coupled (operates on a live
// host), so the wiring is pinned at the source: the helper exists, the render seeds it, and
// mtFocusCell keeps it in sync as focus moves.
test('base grid roving tabindex is wired (#443)', () => {
  assert.ok(_src.includes('function mtSetRovingCell('), 'mtSetRovingCell helper must exist');
  assert.ok(/host\.querySelectorAll\('\.mt-cell'\)\.forEach\(c => c\.setAttribute\('tabindex', '-1'\)\)/.test(_src),
    'mtSetRovingCell must reset every cell to tabindex -1');
  assert.ok(/if \(cell\) cell\.setAttribute\('tabindex', '0'\)/.test(_src),
    'mtSetRovingCell must promote the one active cell to tabindex 0');
  // seeded on render (first data cell, falling back to any cell for a read-only query base)
  assert.ok(/mtSetRovingCell\(host, host\.querySelector\('\.mt-cell\[data-r="1"\]'\) \|\| host\.querySelector\('\.mt-cell'\)\)/.test(_src),
    'buildTableWidget must seed the roving stop after render');
  // mtFocusCell moves the stop as focus moves (Tab-back returns to the remembered cell)
  const mfc = _src.slice(_src.indexOf('function mtFocusCell'), _src.indexOf('function mtFocusCell') + 400);
  assert.ok(/mtSetRovingCell\(host, target\)/.test(mfc), 'mtFocusCell must update the roving stop to the focused cell');
});

// #442: bare /due opens the Schedule dialog in guided/standard (like /check + /alias),
// keeps the typed stub in lean. The apply branch is DOM/dialog-coupled, so pin the gate
// at the source: the isLean split, the dialog call, and the stub fallback.
test('bare /due: dialog in guided/standard, stub in lean (#442)', () => {
  const branch = _src.slice(_src.indexOf("cmd.id === 'due'"), _src.indexOf("cmd.id === 'check'"));
  assert.ok(/if \(!isLean\(\)\) \{/.test(branch), 'the bare-/due branch must split on !isLean()');
  assert.ok(/openDueDateDialog\(nodeId\)/.test(branch), 'guided/standard opens the Schedule dialog');
  assert.ok(/applyInlineInsertion\(nodeId, slashOffset, '\{date due: \}'\)/.test(branch),
    'lean still writes the fill-in stub');
  // the false "still opens the Schedule dialog" comment on the /due:value path is gone
  assert.ok(!/A bare "\/due" \(no value\) still opens the Schedule dialog\./.test(_src),
    'the stale contradictory comment must be corrected');
});

// #451 item 4: query-pill row memo. renderQueryPill re-ran a full-document queryRows every
// render; queryRowsMemo caches on (expr\0hostId) guarded by _varsVer and cleared in
// resetDocCaches — mirroring _qbaseCache. DOM/module-global coupled, so the invalidation
// wiring is pinned at the source (a stale guard here would silently serve old query counts).
test('query-pill memo is _varsVer-guarded and cleared on doc reset (#451 item 4)', () => {
  assert.ok(_src.includes('const _queryPillCache = new Map()'), 'the query-pill cache must exist');
  assert.ok(/function queryRowsMemo\(expr, hostId\)/.test(_src), 'queryRowsMemo wrapper must exist');
  assert.ok(/if \(hit && hit\.ver === _varsVer\) return hit\.result/.test(_src),
    'the memo must guard on _varsVer (else it serves stale results after an edit)');
  assert.ok(/_queryPillCache\.set\(k, \{ ver: _varsVer, result \}\)/.test(_src),
    'the memo must stamp the current _varsVer');
  assert.ok(fnBody(_src, 'resetDocCaches').includes('_queryPillCache.clear()'),
    'resetDocCaches must clear the query-pill cache on doc swap');
  // renderQueryPill must READ through the memo, not call queryRows directly anymore
  // (window widened for the #541 count branch, which also routes through the memo)
  const rqp = fnBody(_src, 'renderQueryPill');
  assert.ok(/queryRowsMemo\(expr, cookieNode\?\.id\)/.test(rqp), 'renderQueryPill must route through queryRowsMemo');
  assert.ok(!/queryRows\(/.test(rqp.replace(/queryRowsMemo\(/g, '')), 'renderQueryPill must never call the uncached queryRows');
});

// #452: dead CSS removal — these selectors matched no DOM element (present only in their
// own CSS rule, never in a JS-generated HTML string). Guard so they don't creep back.
test('dead CSS selectors stay removed (#452)', () => {
  for (const sel of ['.cmd-note', '.mt-align-bar', '.ag-empty']) {
    assert.ok(!_src.includes(sel), `${sel} was dead CSS — must stay removed`);
  }
  // .mt-pad was removed from the shared border/background rule (mt-colhead/mt-rowh kept)
  assert.ok(!/\.mt-pad\b/.test(_src), '.mt-pad was dead — must stay removed from the shared rule');
  assert.ok(/\.mt-colhead,\.mt-rowh\{border:1px solid transparent/.test(_src),
    'the mt-colhead/mt-rowh border rule must survive the .mt-pad removal');
});

// #452 coverage: FN1 unit conversions were half-covered — a transcription error in a
// factor would ship green. Test each through evalMath (the shipped entry point), checking
// a known value AND the inverse round-trip (so a swapped ×/÷ or wrong factor is caught).
test('evalMath — FN1 unit conversions (#452)', () => {
  const near = (expr, want, eps = 1e-9) => {
    const got = c.evalMath(expr, {});
    assert.ok(got !== null && Math.abs(got - want) < eps, `${expr} = ${got}, want ≈ ${want}`);
  };
  // temperature
  near('c2f(100)', 212); near('c2f(0)', 32); near('f2c(212)', 100); near('f2c(32)', 0);
  // distance (long): 1 mile = 1.609344 km
  near('km2mi(1.609344)', 1); near('mi2km(1)', 1.609344);
  // distance (short): 1 inch = 2.54 cm; 1 m = 1/0.3048 ft
  near('cm2in(2.54)', 1); near('in2cm(1)', 2.54);
  near('ft2m(1)', 0.3048); near('m2ft(0.3048)', 1);
  // mass: 1 lb = 0.45359237 kg
  near('lb2kg(1)', 0.45359237); near('kg2lb(0.45359237)', 1);
  // speed: same factor as distance-long
  near('mph2kmh(1)', 1.609344); near('kmh2mph(1.609344)', 1);
  // volume: 1 US gal = 3.785411784 L
  near('gal2l(1)', 3.785411784); near('l2gal(3.785411784)', 1);
  // round-trip a non-trivial value through each pair (catches a swapped ×/÷)
  for (const [to, from] of [['c2f','f2c'],['km2mi','mi2km'],['m2ft','ft2m'],['cm2in','in2cm'],['kg2lb','lb2kg'],['kmh2mph','mph2kmh'],['l2gal','gal2l']]) {
    near(`${from}(${to}(7))`, 7, 1e-6);
  }
});

// #452 coverage: these transcendental FN1/FN2 entries were untested.
test('evalMath — hypot / cbrt / log2 / acos (#452)', () => {
  const near = (expr, want, eps = 1e-9) => {
    const got = c.evalMath(expr, {});
    assert.ok(got !== null && Math.abs(got - want) < eps, `${expr} = ${got}, want ≈ ${want}`);
  };
  near('hypot(3, 4)', 5);          // 3-4-5 triangle
  near('cbrt(27)', 3);             // cube root
  near('log2(8)', 3);              // 2^3 = 8
  near('acos(1)', 0);              // acos(1) = 0
  near('acos(0)', Math.PI / 2);    // acos(0) = π/2
});

// #452 coverage: splitTopLevel's unbalanced-brace clamp (depth = max(0, depth-1)) was only
// exercised indirectly. Pin the boundary directly so a regression to a plain depth-- (which
// would drive depth negative on a stray `}` and mis-split the rest) is caught.
test('splitTopLevel — boundaries incl. unbalanced braces (#452)', () => {
  const s = (str, sep = '|') => host(c.splitTopLevel(str, sep));
  assert.deepEqual(s('a|b|c'), ['a', 'b', 'c'], 'plain top-level split');
  assert.deepEqual(s('a|{b|c}|d'), ['a', '{b|c}', 'd'], 'a nested sep is not a split point');
  assert.deepEqual(s('{a|b}'), ['{a|b}'], 'fully nested → one part');
  assert.deepEqual(s(''), [''], 'empty → one empty part');
  assert.deepEqual(s('abc'), ['abc'], 'no sep → the whole string');
  // the clamp: a stray leading `}` must NOT make depth negative and swallow later top-level seps
  assert.deepEqual(s('}a|b'), ['}a', 'b'], 'unbalanced close does not disable later splits');
  assert.deepEqual(s('a}|b|c'), ['a}', 'b', 'c'], 'mid-string stray close still splits after it');
  assert.deepEqual(s('{a}}|b'), ['{a}}', 'b'], 'extra close after a balanced pair clamps, stays top-level');
});

// #452 coverage: olNum counts only the PRECEDING ol siblings (the display ordinal). Boundary-pin
// the no-parent case and the mixed-sibling count.
test('olNum — ordinal from preceding ol siblings (#452)', () => {
  assert.equal(c.olNum({}, null), 1, 'no parent → 1');
  const a = { type: 'ol' }, b = { type: 'ul' }, d = { type: 'ol' }, e = { type: 'ol' };
  const parent = { children: [a, b, d, e] };
  assert.equal(c.olNum(a, parent), 1, 'first ol → 1');
  assert.equal(c.olNum(d, parent), 2, 'second ol (a ul between does not count) → 2');
  assert.equal(c.olNum(e, parent), 3, 'third ol → 3');
  // olNum counts PRECEDING ol siblings by position, independent of the queried node's own type:
  // b (the ul at index 1) has one preceding ol (a), so it reports 2. It stops at the node, never counting it.
  assert.equal(c.olNum(b, parent), 2, 'preceding ol count is by position, independent of node type');
});

// #468: three hygiene is: operators — is:empty, is:orphan, is:duplicate-title.
test('parseSearchQuery: is:empty / is:orphan / is:duplicate-title join the is: family (#468)', () => {
  assert.deepEqual(host(c.parseSearchQuery('is:empty')),  [{ neg: false, kind: 'is', value: 'empty' }]);
  assert.deepEqual(host(c.parseSearchQuery('is:orphan')), [{ neg: false, kind: 'is', value: 'orphan' }]);
  assert.deepEqual(host(c.parseSearchQuery('is:duplicate-title')), [{ neg: false, kind: 'is', value: 'duplicate-title' }]);
  assert.deepEqual(host(c.parseSearchQuery('-is:empty')), [{ neg: true, kind: 'is', value: 'empty' }]);
});

test('termMatchesNode: is:empty is true when the point reads blank (prefixes/markers stripped) (#468)', () => {
  const term = { neg: false, kind: 'is', value: 'empty' };
  assert.equal(c.termMatchesNode(term, c.mkNode(''),           [], {}), true,  'truly empty');
  assert.equal(c.termMatchesNode(term, c.mkNode('   '),        [], {}), true,  'whitespace only');
  assert.equal(c.termMatchesNode(term, c.mkNode('# '),         [], {}), true,  'bare heading prefix reads empty');
  assert.equal(c.termMatchesNode(term, c.mkNode('- [ ] '),     [], {}), true,  'empty checkbox reads empty');
  assert.equal(c.termMatchesNode(term, c.mkNode('# Title'),    [], {}), false, 'a titled heading is not empty');
  assert.equal(c.termMatchesNode(term, c.mkNode('- [ ] task'), [], {}), false, 'a labelled task is not empty');
});

test('termMatchesNode: is:orphan is true when no backlinks point to the node (#468)', () => {
  const term = { neg: false, kind: 'is', value: 'orphan' };
  const linked   = { outgoing: {}, backlinks: { n1: ['n9'] }, broken: [] };
  const orphaned = { outgoing: {}, backlinks: {},             broken: [] };
  const n = c.mkNode('a point'); n.id = 'n1';
  assert.equal(c.termMatchesNode(term, n, [], {}, linked),   false, 'has a backlink → not orphan');
  assert.equal(c.termMatchesNode(term, n, [], {}, orphaned), true,  'no backlinks → orphan');
});

test('duplicateTitleIds: flags every colliding-title id, case-insensitive, empty titles never collide (#468)', () => {
  const mk = (id, text) => { const n = c.mkNode(text); n.id = id; return n; };
  const root = { id: 'r', children: [
    mk('a', 'Draft'), mk('b', 'draft'),      // collide (case-insensitive)
    mk('c', '# Draft'),                       // collides too (prefix stripped → "Draft")
    mk('d', 'Unique'),                         // alone
    mk('e', ''), mk('f', '   '),               // empty titles never collide
  ] };
  const dup = c.duplicateTitleIds(root);
  const ids = [...dup].sort();
  assert.deepEqual(ids, ['a', 'b', 'c'], 'the three "Draft" variants collide; unique + empties do not');
});

// #466: every dialog ? help icon must deep-link to a REAL Concept-guide entry, else it dead-
// links (openGuide falls back to the first entry — a silent miss). Extract every guide id the
// dialogs reference (guideId:'X' passed to openInsertDialog + dialogHelp(head,'X') direct) and
// assert each exists as a GUIDE id:'X'. A renamed/typo'd guide id fails CI instead of silently.
test('dialog ? help icons deep-link to real GUIDE entries (#466)', () => {
  const guideIds = new Set([...(_src.match(/\bid:'[a-z-]+'/g) || [])].map(s => s.slice(4, -1)));
  const refs = new Set();
  for (const m of _src.matchAll(/guideId:\s*'([a-z-]+)'/g))          refs.add(m[1]);
  for (const m of _src.matchAll(/dialogHelp\(head,\s*'([a-z-]+)'\)/g)) refs.add(m[1]);
  assert.ok(refs.size >= 10, `expected many dialog help refs, found ${refs.size}`);
  const dead = [...refs].filter(id => !guideIds.has(id));
  assert.deepEqual(dead, [], `dialog ? icons point at nonexistent GUIDE ids: ${dead.join(', ')}`);
  // the helper + wiring exist
  assert.ok(_src.includes('function dialogHelp('), 'dialogHelp helper must exist');
  assert.ok(/dialogHelp\(head, opts\.guideId\)/.test(_src), 'openInsertDialog must thread opts.guideId to dialogHelp');
});

// #463 (adversarial-review revision): the agenda "+" ROUTES THROUGH CAPTURE rather than
// committing a point itself. This kills three defects at once — no empty-point litter (capture
// requires non-empty text before it creates), no zoom-away (the strip stays put), a visible
// destination + picker-on-no-inbox. So the wiring is: createDatedPointOnInbox pre-loads a
// pending due date (captureDue) and opens the strip; doCapture stamps that date onto the point
// it builds (and only when there IS text). DOM/module-global coupled, so pin at the source.
test('agenda day + button routes through capture with a pending due date (#463 wiring)', () => {
  const fn = fnBody(_src, 'createDatedPointOnInbox');
  assert.ok(fn, 'createDatedPointOnInbox must exist');
  assert.ok(/captureDue = epochDay/.test(fn), 'pre-loads the clicked day as the pending capture due date');
  assert.ok(fn.includes('openCaptureDialog()'), 'opens the capture strip (visible destination, picker if no inbox)');
  // it must NOT create a point itself — that is doCapture's job, gated on non-empty text (no litter)
  assert.ok(!/mkNode\(/.test(fn), 'the "+" never creates a point directly (no empty-point litter)');
  assert.ok(!/inbox\.children\.push/.test(fn) && !/zoomInto\(/.test(fn),
    'no direct append and no zoom-away — the strip stays open over the calendar');
  // doCapture consumes the pending date onto the point it builds, then clears it (one-shot)
  const cap = fnBody(_src, 'doCapture');
  assert.ok(/captureDue !== null/.test(cap) && /setDateProp\(n, 'due', formatEpochDays\(captureDue\)\)/.test(cap),
    'doCapture stamps the pending due date onto the captured point');
  assert.ok(/captureDue = null/.test(cap), 'doCapture clears the pending date after one capture (one-shot)');
  // closing the strip also drops a pending date so it cannot bleed into a later unrelated capture
  assert.ok(/captureDue = null/.test(fnBody(_src, 'closeCapture')), 'closeCapture drops any pending due date');
  // the cell renders a real, keyboard-operable + button that calls the helper (in-month only)
  assert.ok(/if \(cell\.inMonth && !side\)/.test(_src), 'the + is only on in-month cells (side months switch month)');
  assert.ok(/className = 'agc-add'/.test(_src) && /createDatedPointOnInbox\(ep\)/.test(_src), 'the + button calls the helper');
  assert.ok(/add\.addEventListener\('keydown'/.test(_src), 'the + is keyboard-operable (Enter/Space)');
  // the stored date is a valid, round-trippable due value
  const iso = c.formatEpochDays(20600);
  assert.equal(c.parseDueDate(iso), 20600, 'formatEpochDays produces a due value parseDueDate round-trips');
  // the capture chip/toast use formatDateConcrete: a click-target confirmation must carry the
  // DAY NUMBER (formatDueDate's bare "Wed" is ambiguous with several Wednesdays on screen)
  assert.ok(/captureDue !== null/.test(_src) && /formatDateConcrete\(captureDue\)/.test(_src),
    'the pending-due chip labels with the concrete date, not the ambiguous urgency word');
});

// #463 feel-pass: formatDateConcrete always includes the day number so a click-target
// confirmation is unambiguous. 20600 is a Wednesday (2026-05-27); assert weekday+month+day.
test('formatDateConcrete carries the day number for an unambiguous confirmation (#463)', () => {
  const s = c.formatDateConcrete(20600);
  assert.match(s, /\d/, 'always contains a day number (never a bare weekday)');
  assert.equal(s, 'Wed May 27', 'weekday + month + day for a normal future/near date');
});

// ── URL-based capture (#465): buildSharePointText + handleUrlAppend wiring ──
test('buildSharePointText — combines a shared body / title / url into one plain-text point', () => {
  // body only (the ?append= case)
  assert.equal(c.buildSharePointText('Buy milk', '', ''), 'Buy milk');
  // title-only share (a bookmark with no selected text)
  assert.equal(c.buildSharePointText('', 'Cool Article', ''), 'Cool Article');
  // title + body → "title: body" (no em dash — this is text the user reads)
  assert.equal(c.buildSharePointText('a quote', 'Cool Article', ''), 'Cool Article: a quote');
  // a url is appended on its own line
  assert.equal(c.buildSharePointText('note', '', 'https://x.com'), 'note\nhttps://x.com');
  // title + url (a shared web page: title + link)
  assert.equal(c.buildSharePointText('', 'Cool Article', 'https://x.com'), 'Cool Article\nhttps://x.com');
  // a body that already starts with the title isn't doubled
  assert.equal(c.buildSharePointText('Cool Article and more', 'Cool Article', ''), 'Cool Article and more');
  // a url already present in the text isn't duplicated
  assert.equal(c.buildSharePointText('see https://x.com', '', 'https://x.com'), 'see https://x.com');
  // no em dash slips into the composed text (no-em-dash rule — this is user-facing content)
  assert.ok(!/—/.test(c.buildSharePointText('body', 'Title', 'https://x.com')));
  // all-empty → empty (nothing to capture)
  assert.equal(c.buildSharePointText('', '', ''), '');
});

test('#465 URL-append wiring: hosted-only, param-stripped, plain-text, no-inbox flash', () => {
  const fn = fnBody(_src, 'handleUrlAppend');
  assert.ok(fn, 'handleUrlAppend must exist');
  assert.ok(/location\.protocol === 'file:' \|\| !window\.isSecureContext/.test(fn), 'inert on file:// and non-secure (PWA-exception rule)');
  assert.ok(/history\.replaceState/.test(fn) && /searchParams\.delete/.test(fn), 'strips the param so a reload never re-appends');
  assert.ok(/appendTextToInbox\(text\)/.test(fn), 'routes through the shared inbox-append helper');
  assert.ok(/Set a point as your inbox to capture from a link/.test(fn), 'no inbox → a P4 flash, text dropped');
  // it is called in the boot sequence after render(), and the manifest advertises share_target
  assert.ok(/handleUrlAppend\(\);/.test(_src), 'called on boot');
  // the append helper never evaluates the param — plain text into node.text (no promoteInlineShorthand)
  const app = fnBody(_src, 'appendTextToInbox');
  assert.ok(/mkNode\(t\)/.test(app) && !/promoteInlineShorthand/.test(app), 'plain text only, never promotes a pill from the URL param');
});

// ── Per-doc view persistence (idea 5): remember zoom + scroll across doc switches ──
test('doc view persistence: adoptDoc restores a remembered focus only if the node still exists', () => {
  // the wiring: a docViewState Map, capture before switch, restoreFocusId passed to adoptDoc
  // and guarded by nodeById (a stale id from a changed-on-disk file must NOT zoom into nothing).
  assert.ok(_src.includes('const docViewState = new Map()'), 'the per-doc view store must exist');
  assert.ok(/function captureDocView\(name\)/.test(_src), 'captureDocView records {focusedId, scrollY} for a doc');
  assert.ok(/restoreFocusId && nodeById\(restoreFocusId\)\) focusedId = restoreFocusId/.test(_src), 'adoptDoc restores the zoom ONLY if the node still exists (validity-guarded)');
  assert.ok(/captureDocView\(fileName\)/.test(_src), 'switchWorkspaceDoc captures the outgoing view before the swap');
  assert.ok(/restoreFocusId: saved\?\.focusedId/.test(_src), 'the incoming doc restore id comes from its remembered view');
  // scroll restore is clamped to the doc height (best-effort, after reconcile)
  assert.ok(/Math\.min\(saved\.scrollY, Math\.max\(0, document\.body\.scrollHeight - window\.innerHeight\)\)/.test(_src), 'scroll restore is clamped to the doc height');
  // in-memory only: no OPML attribute for view state (session ergonomics, not file storage)
  assert.ok(!/_focusedId="|_viewFocus=|_scrollY=/.test(_src), 'view state must NOT be written into OPML (portable-file hazard)');
});

test('concept guide: the workspace-search entry now carries usage examples (idea 4 fill)', () => {
  const entry = _src.slice(_src.indexOf("id:'workspace-search'"), _src.indexOf("id:'hashtags'"));
  assert.ok(!/examples:\[\]/.test(entry), 'the workspace-search entry must not have empty examples');
  assert.ok(/Found in other documents/.test(entry), 'it teaches the cross-doc results list');
});

// ── Folder-backed file naming (idea 6): rename + create-name ──
test('folder rename (6a): commitFileName renames the folder file instead of bailing', () => {
  const fn = _src.slice(_src.indexOf('async function commitFileName'), _src.indexOf('async function commitFileName') + 1900);
  assert.ok(!/^async function commitFileName\(rawDisplay\) \{\s*if \(workspaceDir\) return;/.test(fn.replace(/\n\s*/g, ' ')) , 'the workspaceDir bail-out guard must be gone');
  assert.ok(/if \(workspaceDir\) \{/.test(fn), 'a folder-aware rename branch must exist');
  assert.ok(/workspaceFile\.move\(workspaceDir, target\)/.test(fn), 'it must move() the file within the folder');
  assert.ok(/uniqueWorkspaceName\(others, next\)/.test(fn), 'the rename target is collision-safe against sibling docs');
  assert.ok(/_wsSelfWriting = true;[\s\S]*_wsSelfWriting = false/.test(fn), 'the move is bracketed in _wsSelfWriting so the sync observer ignores it');
  assert.ok(/idbSet\(WORKSPACE_KEY, \{ dir: workspaceDir, name: target \}\)/.test(fn), 'the reopen-on-load pointer updates to the new name');
  assert.ok(/openTabs = openTabs\.map\(n => n === prevName \? target : n\)/.test(fn), 'the open-tab strip follows the rename');
  // the inline-rename begin() no longer blocks folder mode
  assert.ok(_src.includes('if (editing) return;') && !/if \(editing \|\| workspaceDir\) return;/.test(_src), 'begin() must not bail on folder mode anymore');
});

test('folder create-name (6b): newWorkspaceDoc prompts for a name, blank keeps the default', () => {
  const fn = _src.slice(_src.indexOf('async function newWorkspaceDoc'), _src.indexOf('async function newWorkspaceDoc') + 1700);
  assert.ok(/openInsertDialog\(\{[\s\S]*title: 'New document'/.test(fn), 'it must open a name prompt, not auto-create');
  assert.ok(/onSubmit: v => createWorkspaceDocNamed\(v\.name\)/.test(fn), 'submit routes the chosen name to the create helper');
  const helper = _src.slice(_src.indexOf('async function createWorkspaceDocNamed'), _src.indexOf('async function createWorkspaceDocNamed') + 900);
  assert.ok(/toFileName\(\(rawName \|\| ''\)\.trim\(\) \|\| 'outline'\)/.test(helper), 'a blank name falls back to the outline default (Enter = old one-tap behavior)');
  assert.ok(/uniqueWorkspaceName\(await listWorkspaceNames\(workspaceDir\), base\)/.test(helper), 'the create is still collision-safe');
});

// ── render() preserves scroll across a full rebuild (#488) ──
test('render(): captures scrollY and restores it clamped, skipping intentional scroll moves (#488)', () => {
  const fn = _src.slice(_src.indexOf('function render()'), _src.indexOf('function render()') + 10500);
  // capture at entry, before the container wipe
  assert.ok(/const _preScrollY = window\.scrollY/.test(fn), 'render must capture scrollY at entry');
  assert.ok(/const _focusChanged = focusedId !== _lastRenderFocusedId/.test(fn), 'it must detect a zoom (focusedId change) to skip restore');
  // restore is GUARDED: not on a zoom (_focusChanged) and not when an empty-doc focusNode will run (firstChildId)
  assert.ok(/if \(!_focusChanged && !firstChildId\) \{/.test(fn), 'the restore must skip intentional scroll moves (zoom + empty-doc focusNode)');
  // clamped to the new document height (a collapse shortens the doc)
  assert.ok(/Math\.min\(_preScrollY, maxScroll\)/.test(fn) && /scrollHeight - window\.innerHeight/.test(fn), 'restore must clamp to the new doc height');
  assert.ok(/window\.scrollTo\(0, target\)/.test(fn), 'it must actually put the scroll back');
  // the guard state is threaded across renders
  assert.ok(_src.includes('let _lastRenderFocusedId = null'), 'the last-focus tracker must exist for the zoom guard');
});

// ── Alias dialog absorbed onto the openInsertDialog harness (absorption audit) ──
test('alias dialog rides the shared openInsertDialog harness, not a hand-rolled io-card', () => {
  const fn = _src.slice(_src.indexOf('function openAliasDialog'), _src.indexOf('function openAliasDialog') + 1300);
  assert.ok(/openInsertDialog\(\{/.test(fn), 'openAliasDialog must call the shared harness');
  assert.ok(/setAliasProp\(node, v\.aliases\)/.test(fn), 'onSubmit routes the field value through the shared setAliasProp core (blank clears)');
  assert.ok(!/ioCard\.innerHTML = ''/.test(fn), 'the hand-rolled io-card must be gone');
  assert.ok(!/ioBack\.classList\.add\('on'\)/.test(fn), 'the io-plumbing is now the harness job');
  // the name is preserved for its three callers (chip, bullet menu, /alias)
  assert.ok(_src.includes('function openAliasDialog(nodeId)'), 'the exported name/signature is kept');
});

test('openInsertDialog associates each field label with its input (accessible name for all riders)', () => {
  const fn = _src.slice(_src.indexOf('function openInsertDialog'), _src.indexOf('function openInsertDialog') + 1500);
  assert.ok(/const _fid = 'io-fld-' \+ f\.key;/.test(fn), 'each field gets a stable id from its key');
  assert.ok(/inp\.id = _fid; lab\.setAttribute\('for', _fid\)/.test(fn), 'the label is tied to the input via for/id');
});

// ── {…} quote-literal lockstep (#521/#522): classify/promote/resolve agree on quoted bodies ──
test('isQuotedLiteral: matched leading/trailing quote of the same kind', () => {
  assert.equal(c.isQuotedLiteral('"a | b"'), true);
  assert.equal(c.isQuotedLiteral("'x'"), true);
  assert.equal(c.isQuotedLiteral('"hello"'), true);
  assert.equal(c.isQuotedLiteral('"mismatch\''), false, 'different quote kinds are not a literal');
  assert.equal(c.isQuotedLiteral('a | b'), false);
  assert.equal(c.isQuotedLiteral('"'), false, 'a lone quote is not a pair');
  assert.equal(c.isQuotedLiteral(''), false);
});

test('#521: a quoted literal with a top-level | classifies literal and promotes to null (not a shredded alternation)', () => {
  // the bug: classify/promote had no quote branch, so {"a | b"} split inside the quotes and
  // promoted to an alternation rendering "a / b" — defeating the documented quote escape hatch.
  for (const body of ['"a | b"', '"cats | dogs | fish"', "'a | b'", '"shuffle: a | b"']) {
    assert.equal(c.classifyBraceBody(body, {}, {}), 'literal', `${body} must classify literal`);
    assert.equal(c.promoteBraceBody({ math:[], vars:[], grammar:[] }, body), null, `${body} must stay literal (promote null)`);
  }
  // resolveBrace already stripped quotes; confirm all three agree on the value
  assert.equal(c.resolveBrace('"a | b"', { rules:{}, vars:{} }), 'a | b');
});

test('#522: {name := "string"} classifies artifact, matching promote (the advertised pick-var example)', () => {
  // the bug: classify recursed on the quoted RHS with no quote branch → 'invalid' ("stays plain text")
  // while promoteBraceBody built a real pick var. The advertised {client := "Acme Corp"} was broken.
  for (const body of ['client := "Acme Corp"', 'greeting := "hello there"', 'name := Sir Reginald', 'v := "a | b"']) {
    assert.equal(c.classifyBraceBody(body, {}, {}), 'artifact', `${body} must classify artifact (it promotes)`);
    const decl = c.parseVarDecl(body);
    assert.ok(decl && c.varDeclIsPick(decl.expr), `${body} is a pick source`);
  }
  // regression: a formula RHS and a plain literal are unchanged
  assert.equal(c.classifyBraceBody('x := 1 to 5', {}, {}), 'artifact');
  assert.equal(c.classifyBraceBody('"hello"', {}, {}), 'literal');
});

// ── #523: nested generators resolve in resolveBrace (no raw-source leak) ──
test('#523: a nested markov/est body resolves instead of leaking raw source', () => {
  c.setRandom(c.seedSequence([0.1, 0.4, 0.2, 0.7, 0.3]));
  const ctx = { rules: {}, vars: {} };
  const mk = c.resolveBrace('markov: a->b, b->c', ctx);
  assert.ok(!mk.includes('markov:'), 'a nested markov must not leak its raw source');
  assert.ok(/→/.test(mk), 'it resolves to a walked path');
  const es = c.resolveBrace('5 to 10', ctx);
  assert.notEqual(es, '5 to 10', 'a nested est must not leak its raw source');
  assert.ok(/\(.*–.*\)/.test(es), 'it resolves to a distribution summary');
  c.resetRandom();
});

test('#523: declaration forms are deliberately NOT resolved nested (top-level-only), and the fix does not regress the working forms', () => {
  const ctx = { rules: {}, vars: {} };
  // a declaration nested in a rule stays passthrough — a config-write has no nested meaning
  assert.equal(c.resolveBrace('x := 3', ctx), 'x := 3');
  // the generator branches sit BEFORE the | split, so a quoted literal and alternation are untouched
  assert.equal(c.resolveBrace('"quoted | lit"', ctx), 'quoted | lit');
  assert.equal(c.resolveBrace('= 2+2', ctx), '4');
  // src-pin: the generator branches exist before the alternation split (window sized for
  // the whole nested-generator block: markov/query/count/oracle/est, #541/#543 included)
  assert.ok(/const mkp = markovParts\(body\);[\s\S]{0,1500}const alts = splitTopLevel/.test(_src), 'the generator branches must precede the | split (or a |-bearing generator body shreds)');
});

// ── #528: rollup est pills stay atomic (only constructor est unfolds) ──
test('#528: an est ROLLUP unfolds to null (stays atomic); a constructor est still unfolds', () => {
  // the bug: artifactToShorthand unfolded {sum(cost)} to editable text, but estParts (the promote
  // gate) rejects rollup exprs — so an edit of the unfolded text couldn't re-promote and the
  // distribution silently became inert prose. Rollup est now stays atomic (null), like a dialog var.
  assert.equal(c.artifactToShorthand('est', { key: 'u', expr: 'sum(cost)' }), null, 'a rollup est must stay atomic');
  assert.equal(c.artifactToShorthand('est', { key: 'u', expr: 'avg(score)' }), null);
  // constructor est (typeable, re-promotable via estParts) still unfolds
  assert.equal(c.artifactToShorthand('est', { key: 'u', expr: '5 to 10' }), '{5 to 10}');
  assert.equal(c.artifactToShorthand('est', { key: 'u', expr: 'normal(3, 1)' }), '{normal(3, 1)}');
  // the gate IS estParts (so unfold and promote agree on what round-trips)
  assert.ok(c.estParts('5 to 10') && !c.estParts('sum(cost)'), 'the unfold gate matches the promote gate');
});

// ── #529: parseUncertain guards its recursive descent (no uncaught RangeError) ──
test('#529: parseUncertain returns null on a pathologically nested body instead of throwing', () => {
  // the bug: a deep-nested est body overflowed the stack with an UNCAUGHT RangeError that
  // propagated through estParts→makeEstRoll→sampleUncertain and blanked the render. evalMath
  // has the try/catch→null this lacked; now they match.
  const deepParens = '('.repeat(2000) + '1 to 2' + ')'.repeat(2000);
  const deepNormal = 'normal('.repeat(1500) + '1,1' + ')'.repeat(1500);
  assert.equal(c.parseUncertain(deepParens), null, 'deep parens → null, not a throw');
  assert.equal(c.parseUncertain(deepNormal), null, 'deep normal() → null, not a throw');
  // the callers that reach it are safe too
  assert.equal(c.estParts(deepParens), null);
  assert.equal(c.makeEstRoll(deepParens), null);
  // regression: valid bodies still parse, garbage still nulls
  assert.ok(c.parseUncertain('5 to 10'), 'a valid constructor still parses');
  assert.ok(c.parseUncertain('normal(3, 1)'), 'normal() still parses');
  assert.equal(c.parseUncertain('garbage'), null);
});

// ── #508: state-cycle chord is sequence-aware (custom keywords cycle within their own sequence) ──
test('#508: cycleTodoState cycles a custom-sequence keyword within its sequence, not into the default', () => {
  const flow = { key: 'f1', name: 'Flow', states: ['BACKLOG', 'DOING', 'SHIPPED'], doneFrom: 2, heldFrom: -1 };
  const def = { key: 'default', name: 'To-do', states: ['TODO', 'NEXT', 'WAITING', 'DONE'], doneFrom: 3, heldFrom: 2 };
  const seqs = [def, flow];
  // the bug: a custom keyword jumped to #TODO (and left the old keyword: "#TODO #DOING …")
  assert.equal(c.cycleTodoState('#BACKLOG [#A] ship it', 1, seqs), '#DOING [#A] ship it', 'advances within Flow, priority kept');
  assert.equal(c.cycleTodoState('#DOING work', 1, seqs), '#SHIPPED work');
  assert.equal(c.cycleTodoState('#SHIPPED done', 1, seqs), 'done', 'past the last state clears the keyword');
  assert.equal(c.cycleTodoState('#DOING work', -1, seqs), '#BACKLOG work', 'backward stays in Flow');
  // the default sequence still cycles exactly as before
  assert.equal(c.cycleTodoState('#TODO ship', 1, seqs), '#NEXT ship');
  assert.equal(c.cycleTodoState('#DONE ship', 1, seqs), 'ship');
  assert.equal(c.cycleTodoState('plain point', 1, seqs), '#TODO plain point', 'no keyword → first default state');
});

// ── #494: hasVisibleProps — the props row is gated on VISIBLE chips, not props?.length ──
// A point auto-stamped with created/edited (every promoted {…} pill) has props but renders
// no chip → the old props?.length gate emitted an empty bulleted "dead space" box below it.
test('#494: hasVisibleProps is false for a timestamp-only point, true when a real chip renders', () => {
  const mk = (props, extra = {}) => ({ id: 'n', props, ...extra });
  // the bug: props exist but none are visible (created/edited are skipped in buildPropsArea)
  assert.equal(c.hasVisibleProps(mk([{ key: 'created', val: '2026-07-11T23:50' }, { key: 'edited', val: '2026-07-11T23:50' }])), false, 'timestamp-only → no row');
  assert.equal(c.hasVisibleProps(mk([])), false, 'no props → no row');
  assert.equal(c.hasVisibleProps(mk(undefined)), false, 'missing props array → no row');
  // a genuine property still shows
  assert.equal(c.hasVisibleProps(mk([{ key: 'cost', val: '30' }])), true, 'real prop → row');
  assert.equal(c.hasVisibleProps(mk([{ key: 'created', val: 'x' }, { key: 'cost', val: '30' }])), true, 'timestamp + real prop → row');
  // a check renders as its own verdict chip even though `check` is skipped in the prop loop
  assert.equal(c.hasVisibleProps(mk([{ key: 'check', val: 'sum(cost) <= 12' }])), true, 'check expr → verdict chip → row');
  assert.equal(c.hasVisibleProps(mk([{ key: 'created', val: 'x' }, { key: 'check', val: 'sum(cost)<=12' }])), true, 'timestamp + check → row');
  assert.equal(c.hasVisibleProps(mk([{ key: 'Check', val: 'sum(cost)<=12' }])), true, 'CHECK_KEY match is case-insensitive');
});

// ── #530: query pills freeze to a snapshot on export, not the raw [[query:KEY]] token ──
// The flatten regex omitted `query` (the lone newer sub-form) and frozenTokenText had no
// query branch, so a query token leaked verbatim into Markdown/plaintext exports.
test('#530: frozenTokenText freezes a query pill to its expr + matching titles', () => {
  const mk = (o) => ({ dice:[],markov:[],math:[],vars:[],grammar:[],est:[],seq:[],query:[],props:[],children:[], ...o });
  const root = mk({ id:'root', children: [
    mk({ id:'host', text:'See [[query:q1]] here', query:[{ key:'q1', expr:'is:todo' }] }),
    mk({ id:'a', text:'#TODO buy rope' }),
    mk({ id:'b', text:'#TODO light torch' }),
  ]});
  const host = root.children[0];
  // the snapshot mirrors the pill body: expr → matched titles (markers stripped)
  assert.equal(c.frozenTokenText('query', 'q1', host, {}, root), 'is:todo → buy rope, light torch');
  // a query that matches nothing is honest about it, not empty
  const r2 = mk({ id:'root', children:[ mk({ id:'h', query:[{ key:'q2', expr:'is:done' }] }) ]});
  assert.equal(c.frozenTokenText('query', 'q2', r2.children[0], {}, r2), 'is:done → (no matches)');
  // an empty query freezes to a labeled placeholder, never a raw token
  const r3 = mk({ id:'root', children:[ mk({ id:'h', query:[{ key:'q3', expr:'  ' }] }) ]});
  assert.equal(c.frozenTokenText('query', 'q3', r3.children[0], {}, r3), '(empty query)');
  // a missing sidecar returns '' like every other sub-form (the token drops out)
  assert.equal(c.frozenTokenText('query', 'gone', host, {}, root), '');
  // "+N more" tail past the row cap (QUERY_ROW_CAP = 10)
  const many = mk({ id:'root', children:[ mk({ id:'h', query:[{ key:'qm', expr:'is:todo' }] }) ]});
  for (let i = 0; i < 13; i++) many.children.push(mk({ id:'t'+i, text:'#TODO item '+i }));
  const frozen = c.frozenTokenText('query', 'qm', many.children[0], {}, many);
  assert.match(frozen, /^is:todo → .+ \(\+3 more\)$/, 'caps at 10 titles, tallies the rest');
});


// ── Security regressions (XSS / injection) ────────────────────────────────────
// These pin the two defenses a hostile imported document (OPML/shared HTML) must not defeat.
// A malicious _seq reaches showCardMenu's move-to labels unescaped; a leading control char
// defeated safeUrl's scheme test (WHATWG strips it, so \x01javascript: resolved as script).

test('safeUrl blocks javascript: even behind a leading control char (WHATWG strip bypass)', () => {
  const ctrl = String.fromCharCode(1);
  assert.equal(c.safeUrl('javascript:alert(1)'), '', 'plain javascript: blocked');
  assert.equal(c.safeUrl(ctrl + 'javascript:alert(1)'), '', 'leading \\x01 must not smuggle javascript:');
  assert.equal(c.safeUrl(String.fromCharCode(9) + 'javascript:x'), '', 'leading tab must not smuggle javascript:');
  assert.equal(c.safeUrl('vbscript:x'), '', 'vbscript: blocked');
  assert.equal(c.safeUrl('data:text/html,x', true), '', 'data:text/html blocked even with image flag');
  // benign URLs still pass through unchanged
  assert.equal(c.safeUrl('https://example.com'), 'https://example.com');
  assert.equal(c.safeUrl('#anchor'), '#anchor');
  assert.equal(c.safeUrl('data:image/png;base64,AAA', true), 'data:image/png;base64,AAA', 'data:image allowed for images');
});

test('escHtml neutralizes an img-onerror payload from a hostile sidecar', () => {
  // The showCardMenu move-to sink (index.html addItem) and the renderCmd twin both route
  // attacker _seq state keywords through escHtml; pin that escHtml actually defangs the vector.
  const out = c.escHtml('<img src=x onerror=alert(document.domain)>');
  assert.ok(!/[<>]/.test(out), 'angle brackets escaped, so no live element is injected');
  assert.equal(out, '&lt;img src=x onerror=alert(document.domain)&gt;');
});
