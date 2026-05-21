#!/usr/bin/env python3
"""
sync_footers.py — keep every page's site-footer in lockstep with the
canonical version at _partials/footer.html.

USAGE
-----
    python3 scripts/sync_footers.py           # sync the whole repo
    python3 scripts/sync_footers.py --check   # exit 1 if any page is out of sync
    python3 scripts/sync_footers.py path/to/page.html [more...]   # specific files

WHY IT EXISTS
-------------
We had 23 pages each with their own copy of the footer. Edits to one
diverged silently from the rest. This script enforces a single source of
truth: edit `_partials/footer.html` and run this script.

HOW IT WORKS
------------
For every *.html file under the repo (excluding `dist/`, `_archive/`,
`_mockups/`, and the `_partials/` folder itself):

  1. Find the existing footer. We accept either:
       (a) a block bounded by  <!-- SS_FOOTER_BEGIN --> ... <!-- SS_FOOTER_END -->
       (b) a legacy <footer ... class="site-footer">...</footer> block
     For files that have NO footer at all, we DO NOT inject one — pages
     like /og/*.html, /icons/*.html are intentionally chromeless.

  2. Pages that explicitly opt out of footer-sync wrap their footer in
     <!-- SS_FOOTER_LOCK --> ... <!-- /SS_FOOTER_LOCK --> markers.
     These are skipped.

  3. The canonical footer block (between SS_FOOTER_BEGIN/END inside the
     partial) replaces whatever's there.

NEW PAGES
---------
When you add a new page that should carry the standard footer, just
include  <!-- SS_FOOTER_BEGIN --><!-- SS_FOOTER_END -->  somewhere near
the bottom and run the script. The first sync fills it in.
"""

from __future__ import annotations
import argparse
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PARTIAL_PATH = REPO_ROOT / "_partials" / "footer.html"

# Directories we never touch.
EXCLUDE_DIRS = {"dist", "_archive", "_mockups", "_partials", "node_modules", ".git"}

# Regex anchors.
BEGIN = "<!-- SS_FOOTER_BEGIN -->"
END = "<!-- SS_FOOTER_END -->"
LOCK_BEGIN = "<!-- SS_FOOTER_LOCK -->"
LOCK_END = "<!-- /SS_FOOTER_LOCK -->"

# Captures the canonical footer block, INCLUSIVE of the BEGIN/END markers.
PARTIAL_RE = re.compile(
    re.escape(BEGIN) + r".*?" + re.escape(END), re.S
)

# Page-side patterns we replace.
MARKER_BLOCK_RE = re.compile(
    re.escape(BEGIN) + r".*?" + re.escape(END), re.S
)
LEGACY_FOOTER_RE = re.compile(
    r"<footer\b[^>]*class=\"site-footer\"[^>]*>.*?</footer>", re.S
)


def load_canonical() -> str:
    if not PARTIAL_PATH.exists():
        raise SystemExit(f"Canonical partial not found at {PARTIAL_PATH}")
    raw = PARTIAL_PATH.read_text(encoding="utf-8")
    m = PARTIAL_RE.search(raw)
    if not m:
        raise SystemExit(
            f"{PARTIAL_PATH} is missing the SS_FOOTER_BEGIN / SS_FOOTER_END markers."
        )
    return m.group(0)


def find_html_files() -> list[Path]:
    files: list[Path] = []
    for root, dirs, names in os.walk(REPO_ROOT):
        # In-place prune
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for n in names:
            if n.endswith(".html") and not n.endswith(".bak"):
                files.append(Path(root) / n)
    return sorted(files)


def has_lock(text: str) -> bool:
    return LOCK_BEGIN in text and LOCK_END in text


def sync_one(path: Path, canonical: str) -> str:
    """Return one of: 'ok', 'updated', 'locked', 'no-footer', 'error'."""
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return "error"

    if has_lock(original):
        # Page opted out — leave it alone.
        return "locked"

    new = original

    if MARKER_BLOCK_RE.search(original):
        new = MARKER_BLOCK_RE.sub(lambda _m: canonical, original, count=1)
    elif LEGACY_FOOTER_RE.search(original):
        # First-time conversion of a legacy inline footer.
        new = LEGACY_FOOTER_RE.sub(lambda _m: canonical, original, count=1)
    else:
        # No footer at all — chromeless page (og images, icons etc.).
        return "no-footer"

    if new == original:
        return "ok"

    path.write_text(new, encoding="utf-8")
    return "updated"


def main() -> int:
    ap = argparse.ArgumentParser(description="Sync site footers to the canonical partial.")
    ap.add_argument("paths", nargs="*", help="Optional list of files to sync (default: whole repo).")
    ap.add_argument("--check", action="store_true",
                    help="Don't write any files. Exit 1 if any page is out of sync.")
    args = ap.parse_args()

    canonical = load_canonical()

    if args.paths:
        targets = [Path(p) for p in args.paths]
    else:
        targets = find_html_files()

    counts: dict[str, int] = {"updated": 0, "ok": 0, "locked": 0, "no-footer": 0, "error": 0}
    out_of_sync: list[Path] = []

    for path in targets:
        if args.check:
            # Dry-run: read, see if a write WOULD happen.
            try:
                original = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                counts["error"] += 1
                continue
            if has_lock(original):
                counts["locked"] += 1
                continue
            m = MARKER_BLOCK_RE.search(original) or LEGACY_FOOTER_RE.search(original)
            if not m:
                counts["no-footer"] += 1
                continue
            if m.group(0) == canonical:
                counts["ok"] += 1
            else:
                counts["updated"] += 1  # would update
                out_of_sync.append(path)
        else:
            status = sync_one(path, canonical)
            counts[status] += 1
            if status == "updated":
                rel = path.relative_to(REPO_ROOT)
                print(f"  updated {rel}")

    print()
    print(f"  updated:    {counts['updated']}")
    print(f"  in sync:    {counts['ok']}")
    print(f"  locked:     {counts['locked']}")
    print(f"  no footer:  {counts['no-footer']}")
    if counts["error"]:
        print(f"  errors:     {counts['error']}")

    if args.check and out_of_sync:
        print()
        print("Out of sync (--check mode, no files written):")
        for p in out_of_sync:
            print(f"  {p.relative_to(REPO_ROOT)}")
        print()
        print("Run: python3 scripts/sync_footers.py")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
