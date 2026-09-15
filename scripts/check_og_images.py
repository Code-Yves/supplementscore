#!/usr/bin/env python3
"""Fail if og:image / twitter:image meta points at a missing local asset.

Social crawlers and Google treat a 404 OG image as a broken preview. Pages
without a dedicated card should point at /og/default.png (which exists).

Usage: python3 scripts/check_og_images.py
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = (".git/", "_archive/", "_mockups/", "reviews/", "scripts/", "node_modules/", "s/")
TAG = re.compile(
    r"""<meta\b[^>]*(?:property|name)=['"](?:og:image|twitter:image)['"][^>]*>""",
    re.I,
)
CONTENT = re.compile(r"""content=['"]([^'"]+)['"]""", re.I)
ORIGIN = "https://supplementscore.org"


def skip(rel: str) -> bool:
    return any(rel.startswith(p) for p in SKIP) or "mockup" in rel.lower()


def main() -> int:
    missing = []
    checked = 0
    for p in ROOT.rglob("*.html"):
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if skip(rel):
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for tag in TAG.findall(text):
            m = CONTENT.search(tag)
            if not m:
                continue
            url = m.group(1).strip()
            if url.startswith("data:"):
                continue
            path = url[len(ORIGIN) :] if url.startswith(ORIGIN) else url
            if not path.startswith("/"):
                continue
            checked += 1
            f = ROOT / path.lstrip("/")
            if not f.is_file():
                missing.append((rel, url))

    print("== og/twitter image check ==")
    print(f"checked {checked} image metas")
    if missing:
        print(f"MISSING image files: {len(missing)}")
        for rel, url in missing[:40]:
            print(f"  {rel}  ->  {url}")
        if len(missing) > 40:
            print(f"  …and {len(missing) - 40} more")
        return 1
    print("PASS — every og:image / twitter:image file exists on disk.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
