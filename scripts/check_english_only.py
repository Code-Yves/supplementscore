#!/usr/bin/env python3
"""English-only site gate (Yves mandate 2026-09-15).

The live site must not advertise or serve French/Spanish locale pages.
Former /fr/ and /es/ URLs may exist only as English redirect stubs.

Fails if:
  1. Any sitemap <loc> points at /fr/ or /es/.
  2. Any sitemap xhtml:link / hreflang is a non-English alternate.
  3. A user-facing EN HTML page links to /fr/ or /es/ (href or hreflang).
  4. An HTML file under fr/ or es/ is not a redirect stub (must be lang=en,
     noindex, canonical to an English URL, meta-refresh to that URL).
  5. Any remaining HTML has <html lang="fr|es">.

Skips _archive/, reviews/, scripts/, _mockups/.
Usage: python3 scripts/check_english_only.py
"""
from __future__ import annotations

import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = (".git/", "_archive/", "_mockups/", "reviews/", "scripts/", "node_modules/")
ORIGIN = "https://supplementscore.org"

LOC_RE = re.compile(r"<loc>(.*?)</loc>", re.I)
XHTML_HREFLANG = re.compile(
    r"""<xhtml:link\b[^>]*\bhreflang=['"]([^'"]+)['"][^>]*>""", re.I
)
HREF_FR_ES = re.compile(
    r"""(?:href|content)=['"]([^'"]*(?:/fr/|/es/)[^'"]*)['"]""", re.I
)
HTML_LANG = re.compile(r"""<html\b[^>]*\blang=['"]([^'"]+)['"]""", re.I)
CANONICAL = re.compile(
    r"""<link\b[^>]*\brel=['"]canonical['"][^>]*\bhref=['"]([^'"]+)['"]""", re.I
)
REFRESH = re.compile(
    r"""<meta\b[^>]*\bhttp-equiv=['"]refresh['"][^>]*\bcontent=['"]([^'"]+)['"]""",
    re.I,
)
NOINDEX = re.compile(r"""<meta\b[^>]*\bname=['"]robots['"][^>]*>""", re.I)
SCRIPT_REPLACE = re.compile(
    r"""location\.replace\(\s*['"]([^'"]+)['"]\s*\)""", re.I
)


def skip(rel: str) -> bool:
    return any(rel.startswith(p) for p in SKIP) or "mockup" in rel.lower()


def en_path_ok(url: str) -> bool:
    """True if url is an English site path (no /fr/ or /es/)."""
    if url.startswith(ORIGIN):
        path = url[len(ORIGIN) :] or "/"
    elif url.startswith("/"):
        path = url
    else:
        return False
    path = path.split("#")[0].split("?")[0]
    if path.startswith("/fr/") or path.startswith("/es/"):
        return False
    if path in ("/fr", "/es"):
        return False
    return True


def resolve_en(url: str) -> bool:
    if url.startswith(ORIGIN):
        path = url[len(ORIGIN) :] or "/"
    elif url.startswith("/"):
        path = url
    else:
        return False
    path = urllib.parse.urlparse(path).path
    if path in ("", "/"):
        return (ROOT / "index.html").is_file()
    rel = path.lstrip("/")
    f = ROOT / rel
    if f.is_file():
        return True
    return (ROOT / rel / "index.html").is_file() if path.endswith("/") else (
        ROOT / (rel + "/index.html")
    ).is_file()


def is_redirect_stub(path: pathlib.Path) -> list[str]:
    """Return a list of problems, empty if the file is a valid EN redirect stub."""
    problems = []
    text = path.read_text(encoding="utf-8", errors="ignore")
    lang_m = HTML_LANG.search(text)
    if not lang_m or lang_m.group(1).lower() != "en":
        problems.append("html lang is not en")
    if not any("noindex" in t.lower() for t in NOINDEX.findall(text)):
        problems.append("missing noindex")
    can_m = CANONICAL.search(text)
    if not can_m or not en_path_ok(can_m.group(1)):
        problems.append("canonical is not an English URL")
    elif not resolve_en(can_m.group(1)):
        problems.append(f"canonical does not resolve: {can_m.group(1)}")
    ref_m = REFRESH.search(text)
    if not ref_m:
        problems.append("missing meta refresh")
    else:
        dest = ref_m.group(1).split("url=", 1)[-1].strip()
        if not en_path_ok(dest):
            problems.append(f"refresh target is not English: {dest}")
    js_m = SCRIPT_REPLACE.search(text)
    if not js_m or not en_path_ok(js_m.group(1)):
        problems.append("missing location.replace to an English URL")
    if "<html lang=\"fr\"" in text or "<html lang=\"es\"" in text:
        problems.append("still declares a non-English html lang")
    return problems


def main() -> int:
    problems: list[str] = []

    # 1–2. Sitemaps
    for sm in sorted(ROOT.glob("sitemap*.xml")):
        text = sm.read_text(encoding="utf-8", errors="ignore")
        name = sm.name
        for loc in LOC_RE.findall(text):
            parsed = urllib.parse.urlparse(loc.strip())
            if re.search(r"/(?:fr|es)(?:/|$)", parsed.path):
                problems.append(f"{name}: sitemap lists locale URL {loc.strip()}")
        for lang in XHTML_HREFLANG.findall(text):
            if lang.lower() not in ("en", "x-default"):
                problems.append(f"{name}: xhtml hreflang={lang}")

    # 3–5. HTML
    for p in ROOT.rglob("*.html"):
        rel = str(p.relative_to(ROOT)).replace("\\", "/")
        if skip(rel):
            continue
        if rel.startswith("fr/") or rel.startswith("es/"):
            stub_problems = is_redirect_stub(p)
            for sp in stub_problems:
                problems.append(f"{rel}: redirect stub invalid — {sp}")
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        lang_m = HTML_LANG.search(text)
        if lang_m and lang_m.group(1).lower() in ("fr", "es"):
            problems.append(f"{rel}: html lang={lang_m.group(1)}")
        # Drop script/JSON-LD so embedded example URLs don't count as links.
        visible = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.S | re.I)
        for href in HREF_FR_ES.findall(visible):
            if "hreflang" in href.lower():
                continue
            problems.append(f"{rel}: link to locale URL {href}")

    print("== English-only site check ==")
    if problems:
        print(f"FAIL — {len(problems)} issue(s):")
        for line in problems:
            print(f"  {line}")
        return 1
    print("PASS — no FR/ES content, links, or sitemap URLs remain.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
