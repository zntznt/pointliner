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
// collectVars(root)/collectRules(root) take an explicit root now, so they're testable
// too (pass a tree; no-arg reads the live module `root`). Both `function` declarations
// AND top-level `const`/`let` arrows (escHtml, escAttr, escQ, …) are reachable — see
// the two-pass lookup in loadCores().
//
// WHAT YOU CAN'T
// fromOpml needs a real DOMParser, absent in Node — its re-parse is covered by the
// browser verification, not here. DOM-touching functions (render, mkCmdItem, the
// pill DOM builders) can't run either; source-pin their wiring instead.
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

  // Select the app block by CONTENT, not byte length: a future analytics snippet or
  // embedded data island could out-size the app and be silently picked. The app block
  // is the one that opens with 'use strict' and defines the model factory `mkNode`.
  // Match <script> with or without attributes so a later `type=...` can't hide it.
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length) throw new Error('No <script> block found in ' + HTML_PATH);
  const isAppBlock = s => /['"]use strict['"]/.test(s) && /function\s+mkNode\b/.test(s);
  const appBlocks = scripts.filter(isAppBlock);
  if (appBlocks.length === 0) {
    throw new Error(
      'Could not identify the app <script> block (looked for `use strict` + `function mkNode`). ' +
      'Did the block markers change? Update isAppBlock in load-cores.mjs.'
    );
  }
  if (appBlocks.length > 1) {
    throw new Error(`Ambiguous: ${appBlocks.length} <script> blocks match the app signature; expected exactly one.`);
  }
  const code = appBlocks[0];

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
    // Faithful-enough CSS.escape: escape every char that is not an unreserved CSS identifier
    // char. The lenient identity `(s) => String(s)` was a latent trap — a pure core that ever
    // used CSS.escape for real escaping (not just DOM querying) would test-pass against
    // un-escaped output that breaks in a browser. Today all CSS.escape uses are DOM-query paths
    // that never run here, but this keeps the stub honest if that changes.
    CSS: { escape: (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, (ch) => '\\' + ch) },
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
  sandbox.structuredClone = (v) => structuredClone(v);   // the app uses it (browsers >=2022); expose Node's into the vm realm
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
  // bottom-of-file init (render(), etc.) throws against the DOM stubs — which it
  // normally does — every pure function is already installed. The `need[]` check
  // below is the real gate: a throw only matters if it prevented a needed core from
  // registering, and that check catches exactly that. So DON'T cry wolf on every run
  // (the expected throw would train people to ignore it). Capture it silently and
  // surface it ONLY when a core is missing (see the initError hint below), or on
  // demand via POINTLINER_DEBUG for anyone chasing a load problem.
  let initError = null;
  try {
    vm.runInContext(prologue + code, context, { filename: 'pointliner-index.html', timeout: 5000 });
  } catch (e) {
    initError = e;
    if (process.env.POINTLINER_DEBUG) console.error('[load-cores] init threw:', e.stack || e.message);
  }

  const need = [
    'parseDice', 'rollParsed', 'diceExprStr',
    'tapFloorCandidates',   // UXP-249: the static tap-floor guard
    'scrollCueClasses',     // UXP-259: which edge fades a .scroll-strip shows
    'tagHit', 'stripStateTags', 'ancestorTagText', 'tagScanText', 'extendAncTagText',   // tag inheritance
    'searchBlob',           // doc-cache: the text-term haystack
    'docCaches', 'makeDocCache', 'regDocCache',   // the DOC_CACHES registry
    'evalMath', 'formatMathResult', 'formatEpochDays', 'makeMathResult',
    'moonGlyph', 'isMoonExpr', 'formatMathDisplay', 'isDateExpr', 'groupThousands', 'formatNumDisplay', 'parseNumFmt',   // #649 moon phase + math display seam; #946 number formatting
    'parseMarkov', 'walkMarkov', 'weightedPick', 'markovParts', 'makeTypedMarkovRoll',
    'parseRules', 'isYesNoOracle', 'runGrammar', 'expandTemplate', 'resolveBrace', 'condParts', 'strCondVerdict',
    'recordVarReads', 'depsChanged',   // #827 item 5: input-dependency snapshot + stale-inputs compare
    'parseAlt', 'pickWeightedAlt', 'modParts', 'applyMods', 'pluralize', 'pastTense', 'presentParticiple', 'fieldParts', 'fieldModParts',
    'dottedVarParts', 'resolveDottedVar', 'varBaseName', 'varBaseDefs', 'varBaseDefsMemo', 'varMapAt', 'varBasePreview',   // variable bases (dotted projections)
    'promoteCellShorthand', 'promoteLoadedShorthand',   // per-cell base promotion (PR C)
    'aggregateVarBaseColumn',   // variable-base column totals (PR D)
    'seqParts', 'shuffledIndices', 'nextSeqIndex', 'advanceSeq', 'makeSeqGen', 'repeatParts',
    'templateParts', 'templateAttempt',   // #916 glue templates ({Ael|Bor}{ric|wyn} as one pill)
    'rollLogEntry', 'grammarLogSource',   // #918 roll-log line + grammar source label (pure)
    'rollLogHome', 'rollLogToggleMessage', 'rollLogFirstEntryMessage',   // UXP-245: the log's door + what it says
    'collectVars', 'shadowedDeclKeys', 'toastGate', 'hintDwell', 'collectRules', 'collectLinks', 'collectBrokenLinks', 'tokenUnderCaret', 'linkCandidates', 'linkCreateOption',
    'renderPosVarMaps',   // #767 positional per-pill var maps
    'graphModel', 'graphLayout', 'clampPositions', 'graphNodeLabel',   // #516 relationship graph pure cores
    'docGraphModel',                                                   // 4b: the doc-level folder graph
    'graphUnlinkedEdges', 'mergeUnlinkedEdges', 'matchableNodeNames',  // graph's unlinked (textual-match) edges
    'guideBodyHtml', 'shortcutsAllBody',   // #598/#599 guide body transform + the one-page shortcuts builder
    'timelineModel',   // #516 timeline pure core
    'overlayCountMessage',   // UXP-241: what a graph/timeline toggle announces after a re-render
    'roveIndex',   // UXP-240: shared roving-tabindex index math (clamping + group paging)
    'brokenNodeMessage',   // UXP-242: what a broken graph node says when activated
    'nearestDistances', 'relaxSeparation', 'tapRadius',   // UXP-243: tap-target floor for graph nodes
    'fnIsWritten', 'stripUnwrittenFnRefs', 'countUnwrittenFnRefs',   // UXP-237: unwritten footnotes leave the exports
    'imgSizeParts',   // #992: markdown image title -> width mode class + inline width
    'blSectionModel',   // #953: the shared backlinks section model (strip + in-flow zoom footer)
    'nearbyAdjacency', 'nearbyGraphModel', 'qid', 'unqid',   // #898: neighborhood graph (current point +/- N hops, cross-doc)
    'cardDropAfter', 'reorderIndex',   // #955: shared card-reorder geometry + index math
    'corkboardCards', 'cardMoveIndex',   // #955: the corkboard's card model + keyboard move
    'isConvertExpr', 'formatConvertResult',   // #983: a bare conversion rounds for display
    'varDeclKind', 'varDistDraw', 'varDistHeadline',   // #952: a variable may hold a distribution; readers correlate
    'distQuantile', 'distChanceOver', 'distChanceUnder',   // #1101: ask a distribution for a percentile or a probability
    'dueItemOrder',   // #1099: the one agenda ordering rule, shared by the document and folder scopes
    'agendaScopeMessage',   // #1099: the folder agenda's staleness line (pure, like overlayCountMessage)
    'caretScrollDelta',   // outline scroll: how far to move so the caret is visible, 0 when it already is
    'varDistsOf', 'varDistRec', 'attachVarDists', 'usesDistVar',   // #952: the sibling lane that carries it alongside `resolved`
    'nudgeSumKey', 'nudgeRollTag',   // #519 depth-nudge pure predicates
    'parseRulesLoose',   // #582 pack-tolerant rule parser
    'collectUnlinkedRefs', 'collectCrossUnlinkedRefs', 'linkifyMention', 'aliasesOf', 'nodeNames',
    'parseLinkToken', 'buildWorkspaceIndex', 'dupDocIdGroups',   // CF-1: cross-doc link index pure cores
    'scanReparseList',                          // §5.2: incremental-rescan fingerprint decision (pure)
    'linkText','stripCaptionTags',              // render link tokens to legible plain text (breadcrumb/backlinks); #943 tag-free captions
    'displayText',                              // rendered display text (markdown/pills resolved) for backlinks + unlinked-ref matching
    'renderCrossLinkPill',                      // CF-2: cross-doc link pill (reads root.docId + workspaceIndex via vm)
    'workspaceCandidates',                      // CF-3: cross-doc [[ picker candidates (pure)
    'workspaceBacklinks',                       // CF-4: cross-doc backlinks (pure)
    'findNodeInRoot','backlinkSnippet','renderCrossLinkPill','renderNodeInline',   // 4a/4d: cross-doc mirror + backlink previews
    'mirrorSubtreeRows',   // #917: subtree transclusion rows (pure)
    'searchWorkspace',                          // WS-1: workspace-wide search matcher (pure)
    'searchSnippet',                            // UXP-64: context-aware snippet for workspace results
    'validPluginPack', 'mergePackRules', 'packVarDefs', 'packTemplateDefs', 'mergedTemplates',   // packTemplateDefs/mergedTemplates: #583
    'pluginPackActive', 'packLabel', 'newPluginPack', 'updatePluginPack', 'removePluginPack', 'togglePluginPack', 'parsePackImport', 'parsePackVarLines', 'rollPackPickVars',
    'upsertPackTemplate', 'removePackTemplate',   // #518: capture-a-subtree-into-a-pack cores
    'packVarsText', 'packDraftFrom', 'packFieldsFor',   // UXP-244: pack-editor draft survival
    'insertDraftFrom', 'insertDraftMatches',   // UXP-246: the same rule across all 10 insert dialogs
    'tagColorOf', 'propIconOf', 'setTagColor', 'setPropIcon', 'normalizeAppearance', 'isValidTagName',
    'mkRoot', 'mkNode', 'ensureDocId', 'toOpml', 'toMarkdown', 'toPlainText',
    'workspaceAffordance', 'workspaceFileName', 'firstLineTitle', 'lastAutosaveSavedAt',
    'uniqueWorkspaceName', 'workspaceDocList', 'tabAdd', 'tabClose', 'tabCycle',
    'docIsBlank', 'connectWriteDecision',       // #839: connect-collision guard cores
    'reconcileAction', 'bootPrefersFile', 'tmpWriteName', 'treeDepthExceeds',   // sync-safety + WAVE-3 ingestion depth clamp
    'unmarkedFilesNote',                        // #845: no-docId files skipped by the folder scan, surfaced in the broken-links report
    'displayName', 'toFileName',                // file-name display/normalize

    'embedOpmlIntoHtml', 'extractEmbeddedOpml',
    'parseTable', 'serializeTable', 'stripMd', 'mdToHtml', 'clampColW',
    'orgResolveComp', 'parseOrgRef', 'parseTblfm', 'computeTable', 'extractTblfm', 'stripTblfm',
    'tableDelimCells', 'renderStaticTable', 'starterTableText', 'planBaseConvert', 'planTablePromote', 'findFirstTableRange',
    'tableBlockEnd', 'splitPastedPoints',
    'mtBuildAggFormula', 'mtHasFooter', 'mtColAggKind', 'mtApplyAggregate', 'aggKindLabel',
    'tblfmGetAssign', 'tblfmSetAssign',
    'mtModelText', 'mtModel', 'mtModelRead', 'isVarBase', 'baseFrozenMarkdown', 'baseRecipeMarkdown', 'baseToStaticText',
    'mtColumnLabel',   // #811: the columns-menu door's per-column label
    'parseTodo','formatTodo','collapseDoubledKeyword','collapseTaskKeywordCollision','cyclePriority',
    'cycleTodoState','cycleTodoPriority','todoSortKey','compareTodo','sortChildrenByProp','applyTodoCycleToNodes',   // LEAN FLOOR: bulk state/priority
    'setTodoState','setTodoPriority',
    'deriveTypeFromText','isTaskFirst','todoDoneFromText','rederiveFromText','continuationPrefix','toggleTaskLine',
    'cloneArtifactSidecars','mergeArtifactSidecars',
    'firstTaskChecked','setFirstTaskChecked',   // bulk checkbox toggle cores
    'migrateTodoText','migrateNodePrefixes','migrateEmphasisText','textForDisplay',
    'collectCallables','filterBraceCandidates','filterBraceForms',
    'stripTriggerRun','builderCmdPool','builderGuideEntry','builderPreviewSample',   // builder window: shared trigger-strip math + command pool/guide-lookup + pane live-sample (retro pins)
    'builderFilterCmds','builderBestIdx',            // #1106: the builder search speaks /verb:value, and Enter fires the exact-id command
    'blankInviteDecision',   // blank-canvas door: the pure show-decision (beginner PR B)
    'mathCompletions','mathFragmentAt','mathFnGroup',
    'searchTokenAt','searchCompletions','oracleCompletions','meterTokenAt','meterCompletions',
    'applyBraceFormText','consumeTokenEnd','bodyCompletion','parsePrevStore','stashPayloadAsPrev','rekeyPayloadDocId','defaultBraceChoice','tokenLeftOfCaret',
    'collectPropKeys',
    'classifyBraceBody','braceAttemptReason','isQuotedLiteral','braceTypeLabel','oracleParts','collectTags','filterTagCandidates','filterEmojiCandidates','parseVarDecl','varDeclIsPick','promoteBraceBody','promoteInlineShorthand','codeSpanRanges','inCodeSpan','reorderInboxList',
    'diceTotalStr','renderDicePill','renderMarkovPill','renderGrammarPill','renderSeqPill','renderSeqGenPill',
    'diceBreakdownHTML','mdInline',            // function decls that were simply not listed
    'escHtml','escAttr','escQ','safeUrl','ex','toOpml',       // const-arrow escapers + URL scheme sanitizer (reached via the const pass)
    'rolltableDefToRules','migrateRolltables',
    'rollPickSource','formatVarValue','flattenArtifacts','flattenSpoilers','frozenTokenText','mathErrorReason','mathReasonPhrase',
    'parseClock','clockGlyph','formatClock','advanceClock','advanceClockInText','clockAtOrdinal','manualClocksOf','collectPillActions',
    'clockFillFor','completingChildIndex','clockCompletionCue','progressCount','tallyMarkers',
    'parseMeter','resolveMeter','meterBar','formatMeter','meterPool','childPropNumber',
    'artifactToShorthand','unfoldedPrefixLen','foldedOffsetFor',
    'unfoldArtifacts','refoldArtifacts','applyRefold','foldedTextForSave',
    'anchorEditInlines','highlightGrammarText','grSrcSpanClean',
    'parseSequence','seqDeclParts','ruleDeclParts','makeGrammarRoll','sequenceLint','collectSequences','sequenceForKeyword','keywordIsDone','keywordIsHeld','seqDefString',
    'knownStates','stateCmds','allSequences', // doc-cache 7/8 collectors (+ allSequences, stateCmds's source)
    'pruneNoexport','exportExclusionImpact','parseSearchQuery','termMatchesNode','queryMatchesNode','searchHighlightNeedles','searchTermProblems','dateStillTyping','queryRows','queryParts','countParts','pickFromQuery','queryHits','queryHitsFolder','pickFromQueryFolder','stripQueryTags','queryCountIn','rollParts','queryTableRows','parseQBaseCols','mtCellHtml','mtSetColRole','mtSetColFmt','cycleColRole','qbaseColRoles','mtColRoles','inferColRolesFromModel','qbaseColList','qbaseFieldWritable','boardLanes','nextLaneKw','stepColW','calBaseItems','baseInlineView',
    'remapColIndex','reindexTblfmCols','remapNodeColumns','extractTblfm','stripTblfm', // column-op integrity
    'mtSortRows','mtSortOrder','parseQBaseSort', // SV-1/SV-2 sorting

    'toggleSavedSearch','isSavedSearch',
    'tallyMarkers','progressCount','formatProgressCookie','countHiddenDone',
    'childPropNumber','aggregateChildren','reduceAgg','queryReduce','queryReduceFolder','queryRowsFolder','wsAllDocRoots','expandAggExpr','mathPrepassErrs','firstEmptyRollup','queryReducerLeaf','wordsScopeLeaf','countWords','subtreeWords',
    'parseUnitDecls','unitTable','normalizeUnits','convertUnits','splitArgsTopLevel','replaceConvert','unitsToText', // #875 units
    'resolveScopeDepth','collectScoped',
    'evalCheck','nodePropVars','resolveNodeScope','checkExprOf','hasVisibleProps','buildIndex','ancestorsOf',
    'nowStamp','parseStamp','timestampOf','stampEdit','formatStampDisplay',
    'rngFromSeed','parseUncertain','sampleUncertain','distSummary','sparkline','formatDist',
    'estParts','makeEstRoll','estChildPropExpr','renderEstPill',
    'upsertTemplate','removeTemplate','findTemplate','deepCloneNodeNewIds',
    'pickerTitle','treeRows','tagTreeRows','selectionRoots','resolveRefileTarget',   // LEAN FLOOR: /refile:title resolution; tag browser
    'dueDateToday','parseDueDate','formatDueDate','formatDateConcrete','parseRepeat','nextOccurrence','describeRepeat','ordinalSuffix','buildSharePointText','collectDueDates','collectActions','priorityRank','oracleSwingBody',
    'collectJournalDates','collectLoreDates','collectTimelineItems',   // #647 timeline sources
    'collectChronicleDates',   // #652 chronicle (in-world game log) timeline source
    'normalizeCalendar','calYearLength','epochToCal','calToEpoch','calEraYear','calYearFromEra','calWeekdayName','calMonthName','calComponents','dueWindowDays',
    'resolveCalendarId','normalizeCalendarBindings',   // #653 calendar coexistence (two-log slice)
    'evictPrevVersions',   // per-doc previous-version store eviction (bounded restore history)
    'withPrevStoreLock',   // #846: cross-tab prev-store RMW lock (sync fallback pinned here)
    'updatePeers', 'peerHoldsDoc',   // #847: multi-tab presence bookkeeping (pure)
    'calWeekLen','calWeekHeads','calMonthTitle','calDayLabel','calDayShort',   // #527 PR-A: the render-label layer
    'parseCalMonths','parseCalWeek','parseCalEras','calendarToText','auditCalendarSwitch','buildCalendarFromFields','dateFormsHint',   // #527 PR-C: the dialog grammars + the switch audit
    'calendarMonthGrid','addMonths','agendaGantt','agendaMonthCells','agendaWeekCells','addWeeks','agendaDayStats','urgencyMark','agendaState','agendaLabel',
    'todayISO','journalFileName','isoParts','findOrCreateChild','findOrCreateDatedEntry',
    'parseDateSlash','parseSlashQuery','looksLikeCellFormula','setCheckProp','setAliasProp','setDateProp',
    'propDeclParts','setProp','parsePropSlash','parsePropLines','fieldNudgeKey','parseBaseSlash','dateDeclParts',   // LEAN FLOOR: inline-stub prop/date + /base:RxC
    'splitForSibling', 'inFence', 'mergeUpText', 'mergeBodyText', 'aggHasSkippedValues', 'setDateProp',
    'flatRowStep',
    'splitTopLevel', 'olNum',   // #452 boundary coverage
    'duplicateTitleIds',        // #468 is:duplicate-title
    'resolveTypedLinks',        // PR-δ: hand-typed [[Name]] → [[#id]] on unambiguous match
  ];
  // Two-pass lookup. `function foo(){}` declarations land on the context global, so
  // pass 1 reads them directly. Top-level `const`/`let` arrows (escHtml, escAttr, …) are
  // lexical bindings that DON'T attach to the global — but they ARE in scope for code
  // evaluated in the same context, so pass 2 evaluates the bare name inside the vm.
  const cores = {};
  const missing = [];
  for (const name of need) {
    let v = context[name];
    if (typeof v !== 'function') {
      // Pass 2: reach a lexical const/let binding. Guard the eval with typeof so an
      // undeclared name is a clean null, not a ReferenceError.
      try {
        v = vm.runInContext(`typeof ${name} === 'function' ? ${name} : null`, context);
      } catch { v = null; }
    }
    if (typeof v === 'function') cores[name] = v;
    else missing.push(name);
  }
  if (missing.length) {
    const hint = initError
      ? `\nNOTE: top-level init threw ("${initError.message}") — that can drop declarations below the throw.`
      : '';
    throw new Error(
      'These cores were not found as function declarations OR const/let arrows: ' +
      missing.join(', ') +
      '\n(Check the name is spelled right and actually defined in index.html.)' + hint
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
