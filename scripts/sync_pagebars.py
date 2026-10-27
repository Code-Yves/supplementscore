#!/usr/bin/env python3
"""Keep every public page's top bar in lockstep with _partials/pagebar.html.

    python3 scripts/sync_pagebars.py           # write
    python3 scripts/sync_pagebars.py --check   # exit 1 if any page drifted

The bar is added to pages that already have the shared site footer.
Meta-refresh redirects and pages marked SS_PAGEBAR_LOCK are left alone.
Chromeless files (icons, social cards) have no footer, so they are skipped.
The close control keeps the href and label already on the page.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PARTIAL_PATH = REPO_ROOT / "_partials" / "pagebar.html"

EXCLUDE_DIRS = {"dist", "_archive", "_mockups", "_partials", "node_modules", ".git"}

BEGIN = "<!-- SS_PAGEBAR_BEGIN -->"
END = "<!-- SS_PAGEBAR_END -->"
LOCK = "<!-- SS_PAGEBAR_LOCK -->"
LINK = '<link rel="stylesheet" href="/page-chrome.css?v=nav1">'

PARTIAL_RE = re.compile(re.escape(BEGIN) + r".*?" + re.escape(END), re.S)
MARKER_RE = PARTIAL_RE
HEADER_RE = re.compile(r"<header class=\"ss-pagebar\">.*?</header>", re.S)
BODY_RE = re.compile(r"<body([^>]*)>", re.I)
LINK_RE = re.compile(r"<link\b[^>]*page-chrome\.css[^>]*>", re.I)
CLOSE_TAG_RE = re.compile(r"<a\b[^>]*class=\"ss-pagebar-x\"[^>]*>", re.I)
FAB_RE = re.compile(
    r"<a\b[^>]*class=\"(?:pg-close-fab|reader-close-fab)\"[^>]*>", re.I
)

CLOSE_ANCHOR = """<a class="ss-pagebar-x" href="{href}" aria-label="{label}">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </a>"""


def load_template() -> str:
    if not PARTIAL_PATH.exists():
        raise SystemExit(f"Canonical partial not found at {PARTIAL_PATH}")
    raw = PARTIAL_PATH.read_text(encoding="utf-8")
    match = PARTIAL_RE.search(raw)
    if not match:
        raise SystemExit(f"{PARTIAL_PATH} is missing SS_PAGEBAR_BEGIN / END markers.")
    template = match.group(0)
    if "__CLOSE_SLOT__" not in template:
        raise SystemExit("pagebar partial is missing __CLOSE_SLOT__")
    return template


def find_html_files() -> list[Path]:
    files: list[Path] = []
    for root, dirs, names in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for name in names:
            if name.endswith(".html") and not name.endswith(".bak"):
                files.append(Path(root) / name)
    return sorted(files)


def rel_of(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def is_redirect(text: str) -> bool:
    head = text[:5000].lower()
    return 'http-equiv="refresh"' in head or "http-equiv='refresh'" in head


def has_footer(text: str) -> bool:
    return 'class="site-footer"' in text or "class='site-footer'" in text


def fallback_href(rel: str) -> str:
    if rel.startswith("compare/") and rel != "compare/index.html":
        return "/compare/"
    if rel.startswith("condition/") and rel != "condition/index.html":
        return "/condition/"
    if rel.startswith("stack/") and rel != "stack/index.html":
        return "/stack/"
    if rel.startswith("brand/"):
        return "/brands.html"
    if rel.startswith("m/") or rel.startswith("medication"):
        return "/"
    if rel.startswith("sx/") and rel != "sx/index.html":
        return "/symptom.html"
    if rel.startswith("hub/"):
        return "/"
    if rel.startswith("data"):
        return "/data/"
    if rel.startswith("a/") or rel.startswith("for/"):
        return "/#research"
    return "/"


def attr_of(tag: str, name: str) -> str | None:
    match = re.search(rf'{name}="([^"]*)"', tag)
    return match.group(1) if match else None


def close_pair(text: str, rel: str) -> tuple[str, str] | None:
    """href, aria-label for the close control. None on the homepage."""
    if rel == "index.html":
        return None
    source = ""
    marker = MARKER_RE.search(text)
    header = HEADER_RE.search(text)
    if marker:
        source = marker.group(0)
    elif header:
        source = header.group(0)
    if source:
        tag = CLOSE_TAG_RE.search(source)
        if tag:
            href = attr_of(tag.group(0), "href") or fallback_href(rel)
            label = attr_of(tag.group(0), "aria-label") or "Close"
            return href, label
    fab = FAB_RE.search(text)
    if fab:
        href = attr_of(fab.group(0), "href") or ""
        if href and href not in ("#", "#/"):
            label = "Close and return home" if href == "/" else "Close"
            return href, label
    href = fallback_href(rel)
    label = "Close and return home" if href == "/" else "Close"
    return href, label


def render(template: str, close: tuple[str, str] | None) -> str:
    if close is None:
        return template.replace("    __CLOSE_SLOT__\n", "")
    href, label = close
    anchor = CLOSE_ANCHOR.format(href=href, label=label)
    return template.replace("__CLOSE_SLOT__", anchor)


def body_match(text: str) -> re.Match[str] | None:
    head_end = text.lower().find("</head>")
    start = head_end + len("</head>") if head_end != -1 else 0
    return BODY_RE.search(text, start)


def ensure_home(text: str) -> str:
    match = body_match(text)
    if not match:
        return text
    attrs = match.group(1) or ""
    if re.search(r"\bss-home\b", attrs):
        return text
    class_match = re.search(r'class="([^"]*)"', attrs)
    if class_match:
        new_attrs = (
            attrs[: class_match.end(1)] + " ss-home" + attrs[class_match.end(1) :]
        )
    else:
        new_attrs = ' class="ss-home"' + attrs
    new_tag = "<body" + new_attrs + ">"
    return text[: match.start()] + new_tag + text[match.end() :]


def ensure_link(text: str) -> str:
    if LINK_RE.search(text):
        return LINK_RE.sub(LINK, text, count=1)
    head_end = text.lower().find("</head>")
    if head_end == -1:
        return text
    return text[:head_end] + LINK + "\n" + text[head_end:]


def apply(text: str, rel: str, template: str) -> str | None:
    """Return the synced document, or None when this file is not a public page."""
    if LOCK in text or is_redirect(text):
        return None
    if not has_footer(text) and "ss-pagebar" not in text:
        return None
    block = render(template, close_pair(text, rel))
    if MARKER_RE.search(text):
        new = MARKER_RE.sub(lambda _m: block, text, count=1)
    elif HEADER_RE.search(text):
        new = HEADER_RE.sub(lambda _m: block, text, count=1)
    else:
        match = body_match(text)
        if not match:
            return None
        new = text[: match.end()] + "\n" + block + text[match.end() :]
    new = ensure_link(new)
    if rel == "index.html":
        new = ensure_home(new)
    return new


def main() -> int:
    ap = argparse.ArgumentParser(description="Sync the site top bar.")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    template = load_template()
    counts = {"updated": 0, "ok": 0, "skipped": 0, "error": 0}
    drifted: list[str] = []
    shown = 0
    for path in find_html_files():
        rel = rel_of(path)
        try:
            original = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            counts["error"] += 1
            print(f"  error {rel}", file=sys.stderr)
            continue
        new = apply(original, rel, template)
        if new is None:
            counts["skipped"] += 1
            continue
        if new == original:
            counts["ok"] += 1
            continue
        counts["updated"] += 1
        drifted.append(rel)
        if not args.check:
            path.write_text(new, encoding="utf-8")
            if shown < 12:
                print(f"  updated {rel}")
                shown += 1
    if counts["updated"] > 12 and not args.check:
        print(f"  … and {counts['updated'] - 12} more")
    print()
    print(f"  updated:  {counts['updated']}")
    print(f"  in sync:  {counts['ok']}")
    print(f"  skipped:  {counts['skipped']}")
    if counts["error"]:
        print(f"  errors:   {counts['error']}")
    if args.check and drifted:
        print()
        print("Out of sync:")
        for rel in drifted[:30]:
            print(f"  {rel}")
        if len(drifted) > 30:
            print(f"  … and {len(drifted) - 30} more")
        print()
        print("Run: python3 scripts/sync_pagebars.py")
        return 1
    if counts["error"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
