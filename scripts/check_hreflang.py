#!/usr/bin/env python3
"""Fail if any hreflang alternate is invalid for the English-only site.

Rules (Yves mandate 2026-09-15 — English only):
  1. hreflang values may only be `en` or `x-default`.
  2. Every remaining alternate must resolve to a file on disk.

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
ALLOWED = {"en", "x-default"}


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
    forbidden = []
    scanned = 0
    for p in ROOT.rglob("*.html"):
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if skip(rel):
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for tag in HREFLANG_TAG.findall(text):
            href_m = HREF.search(tag)
            lang_m = LANG.search(tag)
            if not href_m or not lang_m:
                continue
            scanned += 1
            href = href_m.group(1)
            lang = lang_m.group(1).lower()
            if lang not in ALLOWED:
                forbidden.append((rel, lang, href))
                continue
            if resolve(href) is None:
                dangling.append((rel, lang, href))

    print("== hreflang check (English-only) ==")
    print(f"scanned {scanned} alternate links")
    fail = 0
    if forbidden:
        print(f"FORBIDDEN non-English hreflang: {len(forbidden)}")
        for rel, lang, href in forbidden:
            print(f"  {rel}  hreflang={lang}  ->  {href}")
        fail = 1
    if dangling:
        print(f"DANGLING hreflang: {len(dangling)}")
        for rel, lang, href in dangling:
            print(f"  {rel}  hreflang={lang}  ->  {href}")
        fail = 1
    if fail:
        return 1
    print("PASS — every hreflang is en/x-default and resolves on disk.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
