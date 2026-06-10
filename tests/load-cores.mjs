// load-cores.mjs
// ---------------------------------------------------------------------------
// Loads Pointliner's pure functions out of the single-file index.html so they
// can be unit-tested in plain Node — no build step, no edits to index.html.
//
// HOW IT WORKS
// The app's logic lives in one <script> inside index.html. We extract that
// script text and run it inside a Node `vm` context whose globals are stubbed
// (a universal "null object" proxy stands in for document/window/etc.), so the
// DOM-touching top-level init code no-ops instead of throwing. Top-level
// `function` declarations become properties of the context's global object, so
// after running we can read them straight off the context.
//
// WHAT YOU CAN TEST THIS WAY
// Every *argument-driven* pure core: parseDice, rollParsed, evalMath, parseMarkov,
// walkMarkov, parseRules, runGrammar (pass docRules/vars explicitly), expandTemplate,
// resolveBrace, toOpml(root), mdToHtml, mdInline, stripMd, parseTable/serializeTable.
//
// WHAT YOU CAN'T (yet)
// Functions that read the *module-level* `root` with no parameter — collectVars()
// and collectRules() — can't be driven from outside, because `let root` is a
// lexical binding, not a global property. The clean fix is a one-line, behavior-
// preserving signature tweak in index.html:
//     function collectVars(rootNode = root) { ... walk rootNode.children ... }
//     function collectRules(rootNode = root) { ... }
// After that they're unit-testable like the rest. (fromOpml needs DOMParser, also
// absent in Node — defer or polyfill later.)
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));

// In the real repo, index.html sits one level up from tests/. Override with the
// POINTLINER_HTML env var (used here to point at the uploaded copy).
const HTML_PATH = process.env.POINTLINER_HTML || resolve(here, '..', 'index.html');

// A universal stub: callable, constructable, and every property access returns
// itself. This swallows essentially all DOM/runtime calls without throwing.
function makeStub() {
  const fn = function () {};
  const stub = new Proxy(fn, {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0; // numeric coercion → 0 (avoids NaN)
      if (prop === Symbol.iterator) return undefined;
      if (prop === 'length') return 0;
      return stub;
    },
    apply() { return stub; },
    construct() { return stub; },
    has() { return false; },          // `'x' in window` → false (feature detection off)
    set() { return true; },           // assignments no-op
  });
  return stub;
}

export function loadCores() {
  const html = readFileSync(HTML_PATH, 'utf8');

  // Grab the largest <script>…</script> block (the app code; FA is in <style>).
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length) throw new Error('No <script> block found in ' + HTML_PATH);
  const code = scripts.sort((a, b) => b.length - a.length)[0];

  const stub = makeStub();
  const localStorageStub = {
    getItem: () => null,            // → restoreAutosave() returns early, cleanly
    setItem: () => {},
    removeItem: () => {},
  };

  const sandbox = {
    document: stub,
    navigator: stub,
    location: stub,
    history: stub,
    localStorage: localStorageStub,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    ResizeObserver: stub,
    MutationObserver: stub,
    DOMParser: stub,                 // fromOpml would need a real one; not used at load
    getComputedStyle: () => stub,
    CSS: { escape: (s) => String(s) },
    alert: () => {},
    console,
  };
  // `window` is the global itself in a browser; point it at the sandbox so
  // window.addEventListener / window.scrollY / window.matchMedia resolve here.
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  // Window-level methods/props the top-level init touches. These must live
  // directly on the sandbox (the global), not on the document stub.
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};
  sandbox.dispatchEvent = () => true;
  sandbox.getSelection = () => stub;
  sandbox.matchMedia = () => stub;
  sandbox.scrollTo = () => {};
  sandbox.scroll = () => {};
  sandbox.queueMicrotask = (f) => { try { f(); } catch {} };
  sandbox.scrollX = 0;
  sandbox.scrollY = 0;
  sandbox.innerWidth = 1024;
  sandbox.innerHeight = 768;
  sandbox.devicePixelRatio = 1;
  sandbox.visualViewport = undefined; // guarded by `if (window.visualViewport)`

  const context = vm.createContext(sandbox);

  // Prologue: route Math.random through a host-settable hook so tests can make
  // rolls deterministic. `var` at script top level becomes a readable/writable
  // property of the context global (unlike intrinsics such as Math), so the host
  // can flip __pl_rng on `context`.
  const prologue =
    'var __pl_origRandom = Math.random;' +
    'Math.random = function(){ return __pl_rng ? __pl_rng() : __pl_origRandom(); };' +
    'var __pl_rng = null;\n';

  // Function declarations are hoisted before any statement runs, so even if the
  // bottom-of-file init (render(), etc.) throws against the stubs, every pure
  // function is already installed on the context global. Swallow that throw.
  try {
    vm.runInContext(prologue + code, context, { filename: 'pointliner-index.html', timeout: 5000 });
  } catch (e) {
    if (process.env.POINTLINER_DEBUG) console.error('[load] init threw (expected):', e.message);
  }

  const need = [
    'parseDice', 'rollParsed', 'diceExprStr',
    'evalMath', 'formatMathResult', 'formatEpochDays', 'makeMathResult',
    'parseMarkov', 'walkMarkov', 'weightedPick',
    'parseRules', 'runGrammar', 'expandTemplate', 'resolveBrace',
    'collectVars', 'collectRules', 'collectLinks',
    'mkRoot', 'mkNode', 'toOpml',
    'parseTable', 'serializeTable', 'stripMd', 'mdToHtml', 'clampColW',
    'orgResolveComp', 'parseOrgRef', 'parseTblfm', 'computeTable', 'extractTblfm', 'stripTblfm',
    'tableDelimCells', 'renderStaticTable', 'starterTableText', 'planBaseConvert', 'planTablePromote', 'findFirstTableRange',
    'tableBlockEnd', 'splitPastedPoints',
    'mtBuildAggFormula', 'mtHasFooter', 'mtColAggKind', 'mtApplyAggregate', 'aggKindLabel',
    'mtModelText', 'baseFrozenMarkdown', 'baseRecipeMarkdown',
    'parseTodo','formatTodo','todoIsDone','cycleTodoKeyword','cyclePriority',
    'cycleTodoState','cycleTodoPriority','todoSortKey','compareTodo',
    'setTodoState','setTodoPriority',
  ];
  const cores = {};
  const missing = [];
  for (const name of need) {
    const v = context[name];
    if (typeof v === 'function') cores[name] = v;
    else missing.push(name);
  }
  if (missing.length) {
    throw new Error(
      'These cores were not exposed as global function declarations: ' +
      missing.join(', ') +
      '\n(They may be `const`/`let` arrow functions — only `function foo(){}` ' +
      'declarations land on the context global. Adjust the list or the source.)'
    );
  }

  // Let tests make Math.random deterministic. The injected prologue routes
  // Math.random through context.__pl_rng when set; null restores the real RNG.
  cores.setRandom = (fn) => { context.__pl_rng = fn; };
  cores.resetRandom = () => { context.__pl_rng = null; };
  // Feed a fixed array of values (looping) — handy for deterministic rolls.
  cores.seedSequence = (values) => {
    let i = 0;
    context.__pl_rng = () => values[i++ % values.length];
  };

  cores._context = context; // escape hatch for ad-hoc probing
  return cores;
}
