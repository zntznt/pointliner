#!/usr/bin/env python3
"""Run tools/build-fa-subset.py for real and check index.html still matches what it produces.

WHY THIS EXISTS (#1166)
-----------------------
`#1144` cross-checks three LISTS against each other and against the shipped font: `ICONS` in the
build script, `FA_GLYPHS` in index.html, and the `.fa-NAME::before` rules. That is strong, and it
caught real drift. What it cannot check is whether **the script still produces those bytes** --
nothing in CI ever executes it. The guard's answer key is a file the guarded change edits, so a
script that has stopped working, or started emitting something different, passes every test until a
human happens to rebuild.

Two bugs support that this is not hypothetical:
  * #1144 -- FA_GLYPHS edited without a rebuild, painting a blank button.
  * #1155 -- `subset.Options(flavor="woff2")` was silently ignored for as long as the script had
    existed, so every payload shipped as uncompressed sfnt under a `format("woff2")` declaration.
    Found by reading fontTools' source, not by any test.

WHY IT IS NOT A BYTE DIFF
-------------------------
Measured before this was written, and the measurement changed the design: re-running the script here
produces payloads that differ from the shipped ones by 8-28 bytes per face, while EVERYTHING else --
FA_GLYPHS, all 78 ::before rules, every other character of the block -- is byte-identical, and every
face still maps exactly the same codepoints (77 / 6 / 1).

That is woff2/brotli compression nondeterminism across tool versions, not drift. A byte-diff job
would therefore have been red on day one and every day after: a permanently failing check that says
nothing, which is worse than no check. So the comparison is SEMANTIC:

  1. the non-payload text of the <style id="fa-embed"> block, byte-identical
  2. the FA_GLYPHS line, byte-identical
  3. per face: the decoded cmap (which codepoints it maps), set-equal
  4. per face: still genuinely wOF2, not sfnt  <- the #1155 regression, directly

(1)+(2) catch a stale ICONS list or a lost rule. (3) catches a subset that silently dropped or gained
a glyph. (4) catches the flavor bug returning. What this does NOT prove is byte-reproducibility, and
it says so rather than implying it.

Exit 0 clean, 1 on any mismatch, 2 if the build itself fails.
"""
import base64
import io
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "tools" / "build-fa-subset.py"
INDEX = ROOT / "index.html"

STYLE_RE = re.compile(r'<style id="fa-embed">.*?</style>', re.S)
GLYPHS_RE = re.compile(r"const FA_GLYPHS = new Set\(\[.*?\]\);", re.S)
PAYLOAD_RE = re.compile(r"base64,([A-Za-z0-9+/=]+)")


def codepoints(b64):
    """The set of codepoints a base64 font payload maps. Raises if it will not parse."""
    from fontTools.ttLib import TTFont
    return set(TTFont(io.BytesIO(base64.b64decode(b64))).getBestCmap().keys())


def main():
    problems = []

    run = subprocess.run([sys.executable, str(BUILD)], capture_output=True, text=True)
    if run.returncode != 0:
        sys.stderr.write(
            "tools/build-fa-subset.py FAILED to run, which is the whole point of this job:\n"
            f"{run.stderr[-3000:]}\n"
        )
        return 2
    built, shipped = run.stdout, INDEX.read_text()

    m_built, m_ship = STYLE_RE.search(built), STYLE_RE.search(shipped)
    g_built, g_ship = GLYPHS_RE.search(built), GLYPHS_RE.search(shipped)
    if not (m_built and m_ship and g_built and g_ship):
        sys.stderr.write("could not locate the fa-embed block or the FA_GLYPHS line in one of the two\n")
        return 2

    # (1) everything except the compressed payloads must match exactly.
    strip = lambda s: PAYLOAD_RE.sub("base64,PAYLOAD", s)
    if strip(m_built.group(0)) != strip(m_ship.group(0)):
        problems.append(
            "the fa-embed block's NON-PAYLOAD text differs from what the script produces.\n"
            "    That is a stale ICONS list, a changed/lost ::before rule, or a hand edit that was\n"
            "    never rebuilt. Run `python3 tools/build-fa-subset.py` and splice BOTH outputs."
        )

    # (2) the allow-list, verbatim. #1144 was exactly this line edited without a rebuild.
    if g_built.group(0) != g_ship.group(0):
        problems.append(
            "the FA_GLYPHS line differs from what the script produces (this is the #1144 bug:\n"
            "    editing FA_GLYPHS alone paints a blank button)."
        )

    # (3)+(4) per face: same glyph coverage, and still woff2.
    pb = PAYLOAD_RE.findall(m_built.group(0))
    ps = PAYLOAD_RE.findall(m_ship.group(0))
    if len(pb) != len(ps):
        problems.append(f"face count changed: script emits {len(pb)}, index.html ships {len(ps)}")
    else:
        for n, (a, b) in enumerate(zip(pb, ps), 1):
            if base64.b64decode(b)[:4] != b"wOF2":
                problems.append(
                    f"face {n} in index.html is NOT woff2 while declaring format(\"woff2\").\n"
                    "    This is #1155 returning: subset.Options(flavor=...) is only applied by\n"
                    "    subset.main(), so the script must set font.flavor itself."
                )
            try:
                ca, cb = codepoints(a), codepoints(b)
            except Exception as exc:                                  # noqa: BLE001
                problems.append(f"face {n} would not decode: {exc}")
                continue
            if ca != cb:
                problems.append(
                    f"face {n} maps different codepoints than the script produces.\n"
                    f"    only in the rebuild: {sorted(ca - cb)}\n"
                    f"    only in index.html : {sorted(cb - ca)}"
                )
            else:
                print(f"  face {n}: {len(ca)} codepoints, wOF2, matches the rebuild "
                      f"({len(b)} shipped vs {len(a)} rebuilt bytes -- compression differs, content does not)")

    if problems:
        sys.stderr.write("\nfa-embed is out of date with tools/build-fa-subset.py:\n\n")
        for p in problems:
            sys.stderr.write(f"  * {p}\n\n")
        sys.stderr.write(
            "Recipe (CLAUDE.md, 'Adding a Font Awesome icon'): edit ICONS, run the script, and splice\n"
            "BOTH outputs into index.html -- the whole <style id=\"fa-embed\"> block AND the FA_GLYPHS\n"
            "line. Editing one alone is the documented way to paint a blank button.\n"
        )
        return 1

    print("\nfa-embed matches the build script: same rules, same allow-list, same glyph coverage, still woff2.")
    print("(Byte-identical payloads are NOT asserted -- woff2 compression is not reproducible across "
          "tool versions, measured at 8-28 bytes of drift per face with identical cmaps.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
