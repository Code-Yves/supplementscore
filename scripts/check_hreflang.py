#!/usr/bin/env python3
"""Fail if any hreflang alternate points at a URL that does not exist on disk.

Dangling hreflang (EN condition pages pointing at unpublished FR/ES translations)
is a GSC "Alternate page with proper canonical tag" / 404 source. This gate
blocks that regression without requiring unpublished translations to be written.

Usage: python3 scripts/check_hreflang.py
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = (".git/", "_archive/", "_mockups/", "reviews/", "scripts/", "node_modules/")
HREFLANG_TAG = re.compile(r"<link\b[^>]*\brel=['\"]alternate['\"][^>]*>", re.I)
HREF = re.compile(r"""href=['"]([^'"]+)['"]""", re.I)
LANG = re.compile(r"""hreflang=['"]([^'"]+)['"]""", re.I)


def skip(rel: str) -> bool:
    return any(rel.startswith(p) for p in SKIP) or "mockup" in rel.lower()


def resolve(url: str) -> pathlib.Path | None:
    if url.startswith("https://supplementscore.org"):
        path = url[len("https://supplementscore.org") :]
    elif url.startswith("/"):
        path = url
    else:
        return None
    path = path.split("#")[0].split("?")[0]
    if path in ("", "/"):
        f = ROOT / "index.html"
        return f if f.is_file() else None
    rel = path.lstrip("/")
    f = ROOT / rel
    if f.is_file():
        return f
    if path.endswith("/"):
        f = ROOT / rel / "index.html"
        return f if f.is_file() else None
    f = ROOT / rel / "index.html"
    return f if f.is_file() else None


def main() -> int:
    dangling = []
    scanned = 0
    for p in ROOT.rglob("*.html"):
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if skip(rel):
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for tag in HREFLANG_TAG.findall(text):
            href_m = HREF.search(tag)
            lang_m = LANG.search(tag)
            if not href_m:
                continue
            scanned += 1
            href = href_m.group(1)
            if resolve(href) is None:
                dangling.append((rel, lang_m.group(1) if lang_m else "?", href))

    print("== hreflang target check ==")
    print(f"scanned {scanned} alternate links")
    if dangling:
        print(f"DANGLING hreflang: {len(dangling)}")
        for rel, lang, href in dangling:
            print(f"  {rel}  hreflang={lang}  ->  {href}")
        return 1
    print("PASS — every hreflang alternate resolves to a file on disk.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
