#!/usr/bin/env python3
"""Regenerate a/manifest.js — window.__ART_MANIFEST = { "<id>": "<file>.html" }.

Source of truth: hidden .ar-readmore anchors on #article-N stubs. Those stubs
live in data/article-stubs.html (kept off the homepage so the first screen
does not download them). A few page-less fallbacks remain inline in
index.html. Only ids whose target file actually exists in a/ are emitted.

Consumers:
  - search.html result cards            → href = a/<file>
  - supplement-detail.js further-reading → href = /a/<file> (direct, no
    index.html?supplement=…#article-N roundtrip → no modal flash)

The manifest previously had no generator and rotted (253 entries vs 580
navigable articles, last touched 2026-05-04). This script is idempotent and
is wired into validate_build.sh as a fixer so it can't rot again.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main() -> int:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    stubs = ROOT / "data" / "article-stubs.html"
    if stubs.is_file():
        html += "\n" + stubs.read_text(encoding="utf-8")
    pairs: dict[str, str] = {}
    skipped_missing = 0

    for m in re.finditer(
        r'<div class="article-full" id="article-(\d+)"[^>]*>(.*?)</div>',
        html,
        re.S,
    ):
        aid, body = m.group(1), m.group(2)
        hm = re.search(r'<a[^>]*class="ar-readmore"[^>]*href="/?(a/[^"]+\.html)"', body)
        if not hm:
            hm = re.search(r'<a[^>]*href="/?(a/[^"]+\.html)"[^>]*class="ar-readmore"', body)
        if not hm:
            continue  # page-less inline article — intentionally unmapped
        fname = hm.group(1).split("/", 1)[1]
        if not (ROOT / "a" / fname).is_file():
            print(f"WARN: article-{aid} readmore target missing: a/{fname}", file=sys.stderr)
            skipped_missing += 1
            continue
        pairs[aid] = fname

    out = (
        "window.__ART_MANIFEST="
        + json.dumps(pairs, separators=(",", ":"), ensure_ascii=False)
        + ";\n"
    )
    target = ROOT / "a" / "manifest.js"
    prev = target.read_text(encoding="utf-8") if target.is_file() else ""
    if prev != out:
        target.write_text(out, encoding="utf-8")
        print(f"a/manifest.js: wrote {len(pairs)} entries (was {prev.count('.html')})")
    else:
        print(f"a/manifest.js: up to date ({len(pairs)} entries)")
    if skipped_missing:
        print(f"  ({skipped_missing} stubs pointed at missing files — skipped)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
