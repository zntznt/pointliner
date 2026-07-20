#!/usr/bin/env python3
"""
Build the embedded Font Awesome subset for index.html.

Pointliner inlines a SUBSET of Font Awesome Free as base64 woff2 in the
`<style id="fa-embed">` block, plus one `.fa-NAME::before{content:"\\fXXX"}` rule
per icon, plus a JS `const FA_GLYPHS = new Set([...])` allow-list. An icon that
isn't in the subset paints its unicode/emoji fallback instead of the real glyph
(see paintIcon), so adding a new icon means regenerating all three.

This script is the reproducible, self-contained way to do that. It needs no
pre-staged files: it downloads pinned FA Free source, subsets it, and prints the
exact `fa-embed` style block + the `FA_GLYPHS` line to splice into index.html.

USAGE
  # 1. Edit the ICONS list below (add the icon names you want, no `fa-` prefix).
  # 2. Run:
  python3 tools/build-fa-subset.py            # prints <style id="fa-embed">…</style> + the FA_GLYPHS line
  python3 tools/build-fa-subset.py --check     # just lists which ICONS resolve / are missing from FA Free
  # 3. Replace the <style id="fa-embed">…</style> block in index.html with the
  #    printed style block, and replace the `const FA_GLYPHS = new Set([...]);`
  #    line with the printed one. Verify in-app (a new icon should paint, not fall
  #    back). See guidance/adding-an-artifact.md "Font Awesome".

REQUIREMENTS
  pip3 install fonttools brotli   (brotli is needed for woff2)
  network access to github.com (pinned FA_VERSION below)
"""
import base64, io, json, os, subprocess, sys

FA_VERSION = "6.5.2"  # pinned for reproducible builds
CACHE_DIR = "/tmp/fabuild"  # downloaded source is cached here between runs

# ── The icon allow-list (source of truth). Names WITHOUT the `fa-` prefix. ──────
# Every icon the app references through `fa:'fa-solid fa-NAME'` / `data-fa` / a
# `<i class="fa-… fa-NAME">` must appear here, or it falls back at runtime.
# Grep the app for `fa-` to audit. Brands (e.g. github) are detected automatically
# from FA metadata and routed to the Brands font.
ICONS = [
    # text formatting / blocks
    "list-ul", "list-ol", "quote-right", "code", "minus", "table-cells", "link",
    "superscript", "bold", "italic", "underline", "strikethrough", "highlighter",
    "paragraph", "table-list", "image", "file-lines",
    # chrome / file menu
    "magnifying-glass-plus", "magnifying-glass", "arrow-up", "arrow-down",
    "arrow-down-wide-short", "trash-can", "plus", "folder-open", "floppy-disk",
    "file-export", "circle-half-stroke", "left-right", "moon", "sun", "keyboard",
    "angles-right", "hourglass-half", "inbox", "tag", "github",
    "calendar-day", "calendar-days", "pen",
    # generators / pills
    "dice-d20", "circle-nodes", "calculator", "dollar-sign", "shuffle",
    "list-check", "clone",
    # states / checks
    "circle-check", "check", "square-check", "circle", "circle-question", "square",
    # added 2026-06-30: were referenced but missing from the subset (rendered emoji)
    "book", "triangle-exclamation", "xmark", "arrow-right-arrow-left",
    # file-ops UX (2026-06-30): distinct icons for connect / disconnect / save-as
    "folder-plus", "folder-minus", "copy",
    # glyph identities (2026-07-09, #412/#413): template, progress, and the Check verb
    # each get their OWN glyph (fa-clone stays deck-only; fa-circle-half-stroke stays
    # theme-only; the check family stays the task pair's)
    "stamp", "bars-progress", "clipboard-check",
    # capture chips (2026-07-09, #421): the jump-away segment wears the outward arrow
    # (the same metaphor as the cross-doc link's trailing cue)
    "arrow-up-right-from-square",
    # meter icon-rows (were shipped in FA_GLYPHS but not synced here — re-added so a rebuild
    # doesn't drop them): {meter: hp/5 hearts | skulls | stars | shields | droplets}
    "heart", "skull", "star", "shield", "droplet",
    # rolls-log toolbar toggle (2026-07-20, #951): a scroll = the running log of rolls/oracles
    "scroll",
]

# Some icons are used in BOTH solid and regular in the app. The font subset must
# carry the glyph in each weight that's used. This maps name -> extra styles to
# force-include beyond the icon's default (solid). Keep in sync with the app's
# `fa-regular fa-NAME` usages.
FORCE_REGULAR = {"circle", "file-lines", "image", "square-check", "sun", "square"}


def fetch(path):
    """Fetch an FA source file, caching under CACHE_DIR. Uses curl (system cert
    store) rather than urllib, which can't verify certs in some envs."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    local = os.path.join(CACHE_DIR, os.path.basename(path))
    if os.path.exists(local) and os.path.getsize(local) > 0:
        return open(local, "rb").read()
    # raw.githubusercontent.com is the canonical raw host; github.com/.../raw/ is a 302 redirect
    # to it that some proxies block (403 on the hop), so hit raw directly.
    url = f"https://raw.githubusercontent.com/FortAwesome/Font-Awesome/{FA_VERSION}/{path}"
    subprocess.run(["curl", "-sL", "--fail", "--max-time", "60", "-o", local, url], check=True)
    return open(local, "rb").read()


def subset_to_woff2_b64(ttf_bytes, codepoints):
    from fontTools import subset
    from fontTools.ttLib import TTFont
    font = TTFont(io.BytesIO(ttf_bytes))
    ss = subset.Subsetter(subset.Options(
        flavor="woff2", desubroutinize=True, recalc_bounds=True,
        layout_features=[], notdef_outline=True, glyph_names=False,
        hinting=False, legacy_kern=False, name_IDs=[], name_legacy=False,
    ))
    ss.populate(unicodes=codepoints)
    ss.subset(font)
    buf = io.BytesIO(); font.save(buf, reorderTables=False)
    return base64.b64encode(buf.getvalue()).decode()


def main():
    check_only = "--check" in sys.argv
    meta = json.loads(fetch("metadata/icons.json"))

    # resolve each icon -> (codepoint hex, set of styles available free)
    solid, regular, brands, content_rules, glyph_names, missing = {}, {}, {}, [], [], []
    for name in ICONS:
        info = meta.get(name)
        if not info:
            missing.append(name); continue
        cp = int(info["unicode"], 16)
        free = set(info.get("free", []))
        glyph_names.append(f"fa-{name}")
        content_rules.append((f"fa-{name}", info["unicode"]))
        # route to weights actually used
        if "brands" in free:
            brands[name] = cp
        else:
            if "solid" in free:
                solid[name] = cp
            if "regular" in free and (name in FORCE_REGULAR or "solid" not in free):
                regular[name] = cp

    if missing:
        print(f"!! NOT in FA Free {FA_VERSION}: {missing}", file=sys.stderr)
    if check_only:
        print(f"resolved {len(glyph_names)} icons; solid={len(solid)} regular={len(regular)} brands={len(brands)}")
        return 0 if not missing else 1

    solid_ttf = fetch("webfonts/fa-solid-900.ttf")
    regular_ttf = fetch("webfonts/fa-regular-400.ttf")
    brands_ttf = fetch("webfonts/fa-brands-400.ttf")

    b64_solid = subset_to_woff2_b64(solid_ttf, sorted(solid.values()))
    b64_regular = subset_to_woff2_b64(regular_ttf, sorted(regular.values())) if regular else ""
    b64_brands = subset_to_woff2_b64(brands_ttf, sorted(brands.values())) if brands else ""

    # ── emit the style block (matches the existing fa-embed format) ────────────
    out = ['<style id="fa-embed">']
    out.append(f'@font-face{{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:900;font-display:block;src:url("data:font/woff2;base64,{b64_solid}") format("woff2")}}')
    if b64_regular:
        out.append(f'@font-face{{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:400;font-display:block;src:url("data:font/woff2;base64,{b64_regular}") format("woff2")}}')
    if b64_brands:
        out.append(f'@font-face{{font-family:"Font Awesome 6 Brands";font-style:normal;font-weight:400;font-display:block;src:url("data:font/woff2;base64,{b64_brands}") format("woff2")}}')
    out.append('.fa-solid,.fa-regular,.fa-brands{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;display:inline-block;font-style:normal;font-variant:normal;line-height:1;text-rendering:auto}.fa-solid{font-family:"Font Awesome 6 Free";font-weight:900}.fa-regular{font-family:"Font Awesome 6 Free";font-weight:400}.fa-brands{font-family:"Font Awesome 6 Brands";font-weight:400}')
    for nm, cp in content_rules:
        out.append(f'.{nm}::before{{content:"\\{cp}"}}')
    out.append('</style>')
    print("\n".join(out))

    # ── emit the FA_GLYPHS allow-list line ─────────────────────────────────────
    names = ",".join(f"'{g}'" for g in glyph_names)
    print(f"\n// ---- replace the FA_GLYPHS line in index.html with: ----")
    print(f"const FA_GLYPHS = new Set([{names}]);")
    return 0


if __name__ == "__main__":
    sys.exit(main())
