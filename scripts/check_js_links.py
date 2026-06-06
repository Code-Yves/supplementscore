#!/usr/bin/env python3
"""Validate site-relative page links EMBEDDED IN JS files.

check_page_links.py covers links in deployed HTML, but a lot of navigation is
generated at runtime by JS (supplement-detail.js renders condition deep-dive
rows, related-supplement links, comparison links; _research-chrome.js builds
supplement/article rows; etc.). Those literal '<dir>/<slug>.html' targets are
invisible to the HTML checker, so they rotted silently — e.g. five condition
links pointed at condition/<slug>.html files that don't exist (404 when clicked
from CoQ10 / Vitamin C / omega-3 / carnitine pages), found 2026-06-06.

This scans each JS file for quoted literals matching
  (../)?(a|condition|stack|compare|hub|m|sx)/<slug>.html
and asserts the target file exists at repo root. Quoted literals only, so
template fragments built with + / ${} (which contain quotes, braces, spaces)
are not matched. Lines that are pure comments are skipped to avoid flagging
documentation examples (e.g. "a/foo.html" in a comment).

Exit 1 if any embedded link is broken.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

JS_FILES = [
    "index.js", "app.js", "_site-ux.js", "supplement-modal.js",
    "_research-modal.js", "_research-chrome.js", "supplement-detail.js",
    "nav-search.js", "search-index.js", "pairings-data.js",
]

# quoted literal: '...condition/foo.html' or "../a/bar.html"
LINK_RE = re.compile(r"""['"]((?:\.\./)?(?:a|condition|stack|compare|hub|m|sx)/[a-z0-9-]+\.html)['"]""")


def is_comment(line: str) -> bool:
    s = line.strip()
    return s.startswith("//") or s.startswith("*") or s.startswith("/*")


def main() -> int:
    broken = []
    checked = 0
    for name in JS_FILES:
        f = ROOT / name
        if not f.is_file():
            continue
        for i, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            if is_comment(line):
                continue
            for m in LINK_RE.finditer(line):
                rel = m.group(1).lstrip("/")
                while rel.startswith("../"):
                    rel = rel[3:]
                checked += 1
                if not (ROOT / rel).is_file():
                    broken.append(f"{name}:{i}  →  {m.group(1)}")

    print("== embedded JS page-link check ==")
    print(f"checked {checked} embedded links across {len(JS_FILES)} JS files")
    if broken:
        print(f"BROKEN embedded JS links: {len(broken)}")
        for b in broken:
            print("  " + b)
        return 1
    print("PASS — every embedded JS page link resolves to an existing file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
