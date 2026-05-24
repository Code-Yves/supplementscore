#!/usr/bin/env python3
"""inject_research_chrome.py — opt every long-form page into the new
research-chrome injector (_research-chrome.js).

Adds a <script src="<RELATIVE>/_research-chrome.js?v=20260524-research" defer>
tag right before </head> on every .html under /a/, /for/, /condition/, /stack/
that doesn't already have it.

USAGE:
    python3 scripts/inject_research_chrome.py        # run for real
    python3 scripts/inject_research_chrome.py --check  # dry-run, exit 1 if drift

The script path is computed relative to each file's depth (one or two levels
under /site/), so the injector resolves correctly without root-relative paths
that break under different deploy mounts.
"""

from __future__ import annotations
import argparse
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SITE_ROOTS = [REPO_ROOT / "site", REPO_ROOT]

# Directories whose .html files we DO want to opt into the chrome
TARGET_DIRS = {"a", "for", "condition", "stack"}

# Cache-bust version — bump this when you ship a new _research-chrome.js / CSS
VERSION = "20260524-research-r4"

# Match the existing <script src=".../_research-chrome.js?..."> so we don't double-inject
TAG_RE = re.compile(r'<script\s+[^>]*src="[^"]*_research-chrome\.js[^"]*"[^>]*>\s*</script>', re.I)

# Match </head> close — used as injection point
HEAD_CLOSE_RE = re.compile(r"</head>", re.I)


def find_target_files(root: Path) -> list[Path]:
    """Walk every HTML file under one of the TARGET_DIRS."""
    files: list[Path] = []
    for d in TARGET_DIRS:
        sub = root / d
        if not sub.is_dir():
            continue
        for p in sub.rglob("*.html"):
            if p.name.endswith(".bak"):
                continue
            files.append(p)
    return sorted(files)


def script_tag_for(file_path: Path, site_root: Path) -> str:
    """Build a relative <script> tag for the given file."""
    rel = os.path.relpath(site_root / "_research-chrome.js", file_path.parent)
    # On Windows the os.path.relpath returns backslashes; force forward slashes for URLs
    rel = rel.replace(os.sep, "/")
    return f'<script src="{rel}?v={VERSION}" defer></script>'


def inject_one(path: Path, site_root: Path, check_only: bool = False) -> str:
    """Return 'updated', 'ok', 'no-head', 'error'."""
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return "error"

    tag = script_tag_for(path, site_root)

    if TAG_RE.search(original):
        # Already present — but maybe the path or version drifted. Replace to keep them in sync.
        replaced = TAG_RE.sub(tag, original, count=1)
        if replaced == original:
            return "ok"
        if check_only:
            return "updated"
        path.write_text(replaced, encoding="utf-8")
        return "updated"

    if not HEAD_CLOSE_RE.search(original):
        return "no-head"

    new = HEAD_CLOSE_RE.sub("  " + tag + "\n</head>", original, count=1)
    if check_only:
        return "updated"
    path.write_text(new, encoding="utf-8")
    return "updated"


def main() -> int:
    ap = argparse.ArgumentParser(description="Inject the research-chrome script tag into long-form pages.")
    ap.add_argument("--check", action="store_true",
                    help="Don't write any files. Exit 1 if any page is missing/stale.")
    args = ap.parse_args()

    total = {"updated": 0, "ok": 0, "no-head": 0, "error": 0}

    for site_root in SITE_ROOTS:
        if not site_root.is_dir():
            continue
        files = find_target_files(site_root)
        for f in files:
            status = inject_one(f, site_root, check_only=args.check)
            total[status] += 1

    print(f"  updated:    {total['updated']}")
    print(f"  in sync:    {total['ok']}")
    if total["no-head"]:
        print(f"  no <head>:  {total['no-head']}")
    if total["error"]:
        print(f"  errors:     {total['error']}")

    if args.check and total["updated"] > 0:
        print("\nRun: python3 scripts/inject_research_chrome.py")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
