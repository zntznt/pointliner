// Fail on any identifier the shipped code reads without declaring it: ESLint's `no-undef`, and
// nothing else, over every inline <script> in index.html plus service-worker.js.
//
// WHY THIS EXISTS
// The same defect shipped again and again, and every time it was pinned by NAME: `findById` (a
// test now greps for that one string), `flashError` (a test asserts that one function exists), the
// `_showingExamples` TDZ (a source-order pin). Each pin guards the one name that already broke.
// The fourth round found three more at once, all live, all with green suites around them:
//   restoreFocusId        failed every connect-by-opening of a folder (#839)
//   searchEl              stranded focus behind the builder's modal on a clicked row (#1464)
//   domSelectionForChars  two doors that promise to select a placeholder never did (#1267)
// Two of those sat inside `try { } catch (_) {}`, which turns a ReferenceError into nothing at all.
// A source pin proves a name is PRESENT; it cannot see that the name resolves to nothing. Only
// scope analysis can, and that is the whole of this check. Other lint rules were measured and left
// out: at recommended settings they were ~200 findings of style against 3 of this kind.
//
// WHAT IT READS
// The inline scripts are found the way an HTML parser finds them: `<!-- -->` comments are skipped
// (index.html's own comments mention `<script>`), a script ends at the first `</script`, and only
// classic or module JavaScript counts (the `application/xml` data island does not). Each script is
// linted at its real position, so a finding's line:column is index.html's line:column.
//
// GLOBALS
// The browser set from the `globals` package, MINUS the window properties that are ordinary
// local-variable names. `name`, `status`, `event`, `top`, `parent`, `length` and friends are all
// real globals, so a missing `const name = ...` silently reads the window's instead of failing.
// This file is the one place that makes such a read an error. `typeof X` never counts, so a
// feature-detected API (`typeof FileSystemObserver !== 'undefined'`) is fine.
//
// RUNNING
// ESLint is not a committed dependency (no package.json in this repo, by design). CI installs the
// two pinned versions below for the job. Locally:
//     npm i --no-save --no-package-lock eslint@10.11.0 globals@17.12.0
//     node tools/check-undefined-names.mjs              # the check
//     node tools/check-undefined-names.mjs --self-test  # prove it can fail, then the check
//     node tools/check-undefined-names.mjs --html <file> # the control: point it at a build that has
//                                                        # the defect (git show <sha>:index.html)
// Without them installed this EXITS 2 rather than passing: a gate that skips is a gate that passed
// while proving nothing (#1133), which is the failure mode this file exists to close.

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Window properties that are also everyday local names. Resolving one of these as a global is how
// a missing declaration hides; every other browser global stays allowed.
export const CONFUSABLE_GLOBALS = [
  'blur', 'close', 'closed', 'event', 'external', 'find', 'focus', 'frames', 'length', 'name',
  'open', 'opener', 'origin', 'parent', 'print', 'scroll', 'status', 'stop', 'top',
];

const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);

// Pure: every inline JavaScript <script> in an HTML string, as { code, line, col, module }.
// `line`/`col` are 1-based and locate the first character of `code` in the HTML.
export function inlineScripts(html) {
  const out = [];
  const lower = html.toLowerCase();
  let p = 0;
  for (;;) {
    const c = lower.indexOf('<!--', p), s = lower.indexOf('<script', p);
    if (s < 0) break;
    if (c >= 0 && c < s) {                        // a comment comes first: skip it whole
      const e = lower.indexOf('-->', c + 4);
      if (e < 0) break;
      p = e + 3; continue;
    }
    const tagEnd = lower.indexOf('>', s);
    if (tagEnd < 0) break;
    const attrs = html.slice(s + 7, tagEnd);
    if (!/^[\s>/]/.test(html[s + 7] || '>')) { p = s + 7; continue; }   // `<scripts`, not a script tag
    const end = lower.indexOf('</script', tagEnd + 1);
    if (end < 0) break;
    const type = ((/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs) || [])[1] || '').toLowerCase();
    if (!/\bsrc\s*=/i.test(attrs) && JS_TYPES.has(type)) {
      const start = tagEnd + 1;
      const before = html.slice(0, start);
      const line = before.split('\n').length;
      const col = start - (before.lastIndexOf('\n') + 1) + 1;
      out.push({ code: html.slice(start, end), line, col, module: type === 'module' });
    }
    p = end + 9;
  }
  return out;
}

// Pure: pad `code` so a parser reports positions in the enclosing file's coordinates.
export function atPosition(code, line, col) {
  return '\n'.repeat(line - 1) + ' '.repeat(col - 1) + code;
}

// Pure: the allowed-globals map, from the `globals` package's browser (or other) set.
export function allowedGlobals(set) {
  const g = { ...set };
  for (const k of CONFUSABLE_GLOBALS) delete g[k];
  return g;
}

async function loadTools() {
  try {
    const { Linter } = await import('eslint');
    const globals = (await import('globals')).default;
    return { Linter, globals };
  } catch (e) {
    console.error('check-undefined-names: eslint and globals are not installed, so nothing was checked.');
    console.error('  npm i --no-save --no-package-lock eslint@10.11.0 globals@17.12.0');
    process.exit(2);
  }
}

// The virtual filename only feeds ESLint's config matching, and flat config does not match an
// `.html` name even with `**/*`: it returns a lone "No matching configuration" notice instead of
// linting, which the self-test caught on the first run. Findings are reported against the real file.
function lint(Linter, code, { globals, module }) {
  const linter = new Linter({ configType: 'flat' });
  return linter.verify(code, [{
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: module ? 'module' : 'script', globals },
    rules: { 'no-undef': 'error' },
  }], { filename: 'source.js' });
}

// The sources this check covers, as [{ file, code, globals, module }].
export function targets(globals, read = (f) => readFileSync(join(ROOT, f), 'utf8')) {
  const html = read('index.html');
  const scripts = inlineScripts(html);
  return [
    ...scripts.map(s => ({ file: 'index.html', code: atPosition(s.code, s.line, s.col), module: s.module,
      globals: allowedGlobals(globals.browser) })),
    { file: 'service-worker.js', code: read('service-worker.js'), module: false,
      globals: allowedGlobals(globals.serviceworker) },
  ];
}

// Prove the gate can fail before trusting a pass: each case must be reported (or not) as stated.
function selfTest(Linter, globals) {
  const g = allowedGlobals(globals.browser);
  const cases = [
    { src: 'function f() { return restoreFocusId; }', want: ['restoreFocusId'], why: 'an undeclared name' },
    { src: 'try { domSelectionForChars(1, 2); } catch (_) {}', want: ['domSelectionForChars'], why: 'one inside a swallowing try' },
    { src: 'const f = () => name.trim();', want: ['name'], why: 'a confusable window global' },
    { src: "if (typeof FileSystemObserver !== 'undefined') {}", want: [], why: 'a typeof feature test' },
    { src: 'document.title = String(window.innerWidth);', want: [], why: 'real browser globals' },
  ];
  const html = '<!-- a <script>bogus()</script> in a comment -->\n'
    + '<script type="application/xml" id="d"><x/></script>\n<script src="a.js"></script>\n'
    + '<script>\n  realOne();\n</script>';
  const scripts = inlineScripts(html);
  const bad = [];
  if (scripts.length !== 1 || !scripts[0].code.includes('realOne')) bad.push(`extraction: expected only the real script, got ${JSON.stringify(scripts.map(s => s.code))}`);
  const found = scripts.length ? lint(Linter, atPosition(scripts[0].code, scripts[0].line, scripts[0].col), { globals: g }) : [];
  if (!(found.length === 1 && found[0].line === 5 && found[0].column === 3)) bad.push(`position: expected realOne at 5:3, got ${JSON.stringify(found.map(m => [m.line, m.column]))}`);
  for (const c of cases) {
    const names = lint(Linter, c.src, { globals: g }).map(m => (/'(.+?)'/.exec(m.message) || [])[1]);
    if (JSON.stringify(names) !== JSON.stringify(c.want)) bad.push(`${c.why}: expected ${JSON.stringify(c.want)}, got ${JSON.stringify(names)}`);
  }
  if (bad.length) { console.error('check-undefined-names: SELF-TEST FAILED, so a pass below would mean nothing:\n  ' + bad.join('\n  ')); process.exit(1); }
  console.log(`self-test: ${cases.length + 2} cases behave as stated`);
}

async function main() {
  const { Linter, globals } = await loadTools();
  if (process.argv.includes('--self-test')) selfTest(Linter, globals);
  const findings = [];
  const i = process.argv.indexOf('--html');
  const html = i > 0 ? process.argv[i + 1] : null;
  if (i > 0 && !html) { console.error('check-undefined-names: --html needs a path'); process.exit(2); }
  const list = targets(globals, html ? (f) => readFileSync(f === 'index.html' ? html : join(ROOT, f), 'utf8') : undefined);
  for (const t of list)
    for (const m of lint(Linter, t.code, { globals: t.globals, module: t.module }))
      findings.push(`${t.file === 'index.html' && html ? html : t.file}:${m.line}:${m.column}  ${m.message}`);
  if (findings.length) {
    console.error(`check-undefined-names: ${findings.length} undefined name(s). Each throws a ReferenceError when that line runs:\n  ` + findings.join('\n  '));
    process.exit(1);
  }
  console.log(`check-undefined-names: no undefined names in ${list.length} source(s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
