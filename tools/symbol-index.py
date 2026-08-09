#!/usr/bin/env python3
"""Generate guidance/code-index.md -- a name-based map of the single-file app (#1430).

WHY THIS EXISTS
index.html is one <script> of ~43k lines holding ~2000 top-level declarations. The repo's
navigation doctrine (architecture-reference.md, "For reviewers / other AIs") is that symbols are
referenced BY NAME, never by line number, because line numbers drift every edit and names do not.
That doctrine is right and it leaves a gap: you can only grep for a name you already know. The only
existing enumeration is tests/load-cores.mjs's `need[]` (~150 pure cores); the ~1800 DOM/UI
functions have none. This emits the missing one.

WHAT IT GROUPS BY, AND THE CORRECTION THAT SHAPED IT
#1431 proposed inserting a banner spine on the premise that the file has "zero section markers".
Measured, that is false: the block already carries 151 markers of the form

    // ─── search ──────────────────────────────────────────────────────────────

spanning 96% of it, and they are FINE-GRAINED and authored (`progress clocks ([o N/M])`,
`chrome excursions: caret restore`). So this groups by the marker each declaration actually sits
under, rather than by an invented taxonomy or by name prefix -- measured, ~80% of declarations have
no clean domain prefix, so prefixes would have shrugged most of the file into "uncategorized".

Declarations that sit under NO marker are grouped as "(unmarked)". That group is the honest output
of the parity gap, not a bucket to hide things in: #1431's parity check is what closes it.

NO LINE NUMBERS IN THE COMMITTED FILE. `--with-lines` prints them to stdout for jump-to-symbol while
editing, and is never what CI compares.

USAGE
    python3 tools/symbol-index.py            # rewrite guidance/code-index.md
    python3 tools/symbol-index.py --check    # exit 1 if the committed file is stale (CI)
    python3 tools/symbol-index.py --with-lines   # stdout only, with current line numbers
"""

import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / 'index.html'
OUT = ROOT / 'guidance' / 'code-index.md'

# Same block signature as tests/load-cores.mjs (`use strict` + `function mkNode`), deliberately:
# two tools disagreeing about which <script> is the app is a bug neither would report.
SCRIPT_RE = re.compile(r'<script\b[^>]*>([\s\S]*?)</script>')
MARKER_RE = re.compile(r'^// ─+ ?(.*?) ?─*\s*$')
# #1431's coarse tier, above the 157 fine markers. A DIFFERENT rule character (═ not ─) so the two
# tiers can never be confused by eye or by regex. `grep 'DOMAIN:' index.html` is the whole outline.
DOMAIN_RE = re.compile(r'^// ═+ DOMAIN: (.+?) ═+\s*$')
# `async ` and `function*` are part of the form, not decoration. Omitting the async prefix hid
# `stashPayloadAsPrev` -- a core the test suite already tracks in load-cores need[] -- from the map,
# which is precisely the "silently partial index" the cross-registry parity test exists to catch.
# It caught it on the first run.
DECL_RE = re.compile(r'^(?:async\s+)?(function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)')
# A doc line is a `//` comment at column 0 that is not itself a marker.
DOC_RE = re.compile(r'^//\s?(.*)$')


def app_block(html: str) -> str:
    blocks = [m.group(1) for m in SCRIPT_RE.finditer(html)]
    hits = [b for b in blocks if re.search(r'["\']use strict["\']', b) and re.search(r'function\s+mkNode\b', b)]
    if len(hits) != 1:
        raise SystemExit(
            f'Expected exactly one app <script> block (use strict + function mkNode), found {len(hits)}. '
            'If the block signature changed, update BOTH this file and tests/load-cores.mjs.'
        )
    return hits[0]


def doc_for(lines, i):
    """The declaration's own one-line purpose: the last contiguous // comment line above it.

    Walk UP from the declaration through a comment block and take its FIRST line, which is where
    this file's convention puts the summary (the rest is rationale and issue references). Returns
    '' when a declaration has no comment above it, which is left visible rather than invented.
    """
    j = i - 1
    block = []
    while j >= 0:
        line = lines[j]
        if MARKER_RE.match(line):
            break
        m = DOC_RE.match(line)
        if not m:
            break
        block.append(m.group(1).strip())
        j -= 1
    if not block:
        return ''
    summary = block[-1].strip()          # the TOP line of the block
    summary = re.sub(r'\s+', ' ', summary)
    return summary[:160]


def collect():
    lines = app_block(HTML.read_text(encoding='utf8')).split('\n')
    groups = []            # [(domain, marker_name, [(name, kind, doc, lineno)])]
    current = '(unmarked)'
    domain = '(no domain)'      # anything above the first DOMAIN banner, reported not hidden
    bucket = {}
    order = []
    sec_domain = {}

    def put(section, item):
        if section not in bucket:
            bucket[section] = []
            order.append(section)
            sec_domain[section] = domain
        bucket[section].append(item)

    for i, line in enumerate(lines):
        dm = DOMAIN_RE.match(line)
        if dm:
            domain = dm.group(1).strip()
            continue
        m = MARKER_RE.match(line)
        if m:
            name = m.group(1).strip()
            # A marker with no text is a rule, not a section title; keep the previous section.
            if name:
                current = name
                # A section re-entered under a later domain keeps its FIRST domain; that would be a
                # split section, which the name census would surface as its own problem.
                sec_domain.setdefault(current, domain)
            continue
        d = DECL_RE.match(line)
        if d:
            put(current, (d.group(2), d.group(1), doc_for(lines, i), i + 1))

    for section in order:
        groups.append((sec_domain.get(section, '(no domain)'), section, bucket[section]))
    return groups


def render(groups, with_lines=False):
    total = sum(len(v) for _, _, v in groups)
    domains = []
    for d, _, _ in groups:
        if not domains or domains[-1] != d:
            domains.append(d)
    out = [
        '# Code index',
        '',
        '**Generated by `tools/symbol-index.py`. Do not edit by hand.**',
        'CI regenerates this and fails on drift, so it cannot rot (#1430).',
        '',
        'Every top-level declaration in the app `<script>` of `index.html`, grouped by the section',
        'marker it sits under and by the `DOMAIN:` banner above that (#1431), with the first line',
        'of its own comment as its purpose. `grep \'DOMAIN:\' index.html` prints the coarse outline.',
        '',
        'No line numbers, deliberately: they drift every edit and names do not',
        '(`guidance/architecture-reference.md`). Grep a name to find it. For jump-to-symbol while',
        'editing, `python3 tools/symbol-index.py --with-lines` prints them to stdout.',
        '',
        f'**{total} declarations in {len(groups)} sections across {len(domains)} domains.**',
        '',
    ]
    seen = None
    for dom, section, items in groups:
        if dom != seen:
            out.append(f'# {dom}')
            out.append('')
            seen = dom
        out.append(f'## {section}')
        out.append('')
        for name, kind, doc, ln in items:
            where = f' *(line {ln})*' if with_lines else ''
            out.append(f'- `{name}`{where} — {doc}' if doc else f'- `{name}`{where}')
        out.append('')
    return '\n'.join(out).rstrip() + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='exit 1 if the committed index is stale')
    ap.add_argument('--with-lines', action='store_true', help='print to stdout with line numbers')
    args = ap.parse_args()

    groups = collect()
    if args.with_lines:
        sys.stdout.write(render(groups, with_lines=True))
        return 0

    fresh = render(groups)
    if args.check:
        if not OUT.exists():
            print(f'{OUT.relative_to(ROOT)} is missing. Run: python3 tools/symbol-index.py', file=sys.stderr)
            return 1
        have = OUT.read_text(encoding='utf8')
        if have != fresh:
            print(
                f'{OUT.relative_to(ROOT)} is STALE -- index.html changed and the index was not regenerated.\n'
                'Run: python3 tools/symbol-index.py   and commit the result.',
                file=sys.stderr)
            # Show the first divergence, so the failure names what moved rather than just "differs".
            a, b = have.split('\n'), fresh.split('\n')
            for i in range(max(len(a), len(b))):
                x = a[i] if i < len(a) else '<end of committed file>'
                y = b[i] if i < len(b) else '<end of generated file>'
                if x != y:
                    print(f'\nfirst difference at line {i + 1}:\n  committed: {x}\n  generated: {y}', file=sys.stderr)
                    break
            return 1
        print(f'{OUT.relative_to(ROOT)} is up to date ({sum(len(v) for _, _, v in groups)} declarations).')
        return 0

    OUT.write_text(fresh, encoding='utf8')
    print(f'wrote {OUT.relative_to(ROOT)}: {sum(len(v) for _, _, v in groups)} declarations in {len(groups)} sections')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
