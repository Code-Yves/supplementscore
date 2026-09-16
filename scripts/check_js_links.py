#!/usr/bin/env python3
"""Validate site-relative page links EMBEDDED IN JS files.

check_page_links.py covers links in deployed HTML, but a lot of navigation is
generated at runtime by JS (supplement-detail.js renders condition deep-dive
rows, related-supplement links, comparison links; _research-chrome.js builds
supplement/article rows; etc.). Those literal '<dir>/<slug>.html' targets are
invisible to the HTML checker, so they rotted silently — e.g. five condition
links pointed at condition/<slug>.html files that don't exist (404 when clicked
from CoQ10 / Vitamin C / omega-3 / carnitine pages), found 2026-06-06.

This scans each JS file — and inline `<script>` blocks in deployed HTML —
for quoted literals matching
  (../)?(a|condition|stack|compare|hub|m|sx)/<slug>.html
and asserts the target file exists at repo root. Quoted literals only, so
template fragments built with + / ${} (which contain quotes, braces, spaces)
are not matched. Lines that are pure comments are skipped to avoid flagging
documentation examples (e.g. "a/foo.html" in a comment). JSON-LD blocks are
skipped. HTML under _archive/, reviews/, _mockups/, fr/, and es/ is skipped.

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

SKIP_HTML_PREFIXES = (
    "_archive/", "_mockups/", "reviews/", "scripts/", "node_modules/",
    "fr/", "es/",
)

# quoted literal: '...condition/foo.html' or "../a/bar.html"
LINK_RE = re.compile(r"""['"]((?:\.\./)?(?:a|condition|stack|compare|hub|m|sx)/[a-z0-9-]+\.html)['"]""")
SCRIPT_RE = re.compile(r"<script\b([^>]*)>(.*?)</script>", re.I | re.S)


def is_comment(line: str) -> bool:
    s = line.strip()
    return s.startswith("//") or s.startswith("*") or s.startswith("/*")


def check_text(label: str, text: str, broken: list, checked: list) -> None:
    for i, line in enumerate(text.splitlines(), 1):
        if is_comment(line):
            continue
        for m in LINK_RE.finditer(line):
            rel = m.group(1).lstrip("/")
            while rel.startswith("../"):
                rel = rel[3:]
            checked[0] += 1
            if not (ROOT / rel).is_file():
                broken.append(f"{label}:{i}  →  {m.group(1)}")


def main() -> int:
    broken = []
    checked = [0]
    for name in JS_FILES:
        f = ROOT / name
        if not f.is_file():
            continue
        check_text(name, f.read_text(encoding="utf-8", errors="ignore"), broken, checked)

    html_files = 0
    for p in ROOT.rglob("*.html"):
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if any(rel.startswith(pref) for pref in SKIP_HTML_PREFIXES):
            continue
        if "mockup" in rel.lower():
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        html_files += 1
        for sm in SCRIPT_RE.finditer(text):
            attrs = sm.group(1) or ""
            if re.search(r"""type\s*=\s*['"]application/ld\+json['"]""", attrs, re.I):
                continue
            check_text(rel, sm.group(2), broken, checked)

    sleep = ROOT / "sx" / "sleep.html"
    if sleep.is_file():
        sleep_html = sleep.read_text(encoding="utf-8", errors="ignore")
        if re.search(r'slug=caffeine["\']', sleep_html):
            broken.append("sx/sleep.html  →  caffeine listed for sleep (tag/desc false positive)")

    print("== embedded JS page-link check ==")
    print(
        f"checked {checked[0]} embedded links across {len(JS_FILES)} JS files "
        f"and inline scripts in {html_files} HTML files"
    )
    if broken:
        print(f"BROKEN embedded JS links: {len(broken)}")
        for b in broken:
            print("  " + b)
        return 1
    print("PASS — every embedded JS page link resolves to an existing file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
