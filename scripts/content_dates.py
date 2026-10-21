#!/usr/bin/env python3
"""Set dateModified, visible Last reviewed, and sitemap lastmod from page dates.

The date on the page wins. A blanket schema stamp (2026-05-23 or 2026-05-24)
does not. Sitemap lastmod is set to that date even when the old lastmod is
later, so a single generated date cannot stay on every URL.

Priority, first match:
  1. <!-- last-reviewed: YYYY-MM-DD -->
  2. Last reviewed <time datetime="...">
  3. "Updated YYYY-MM-DD" in the page meta
  4. datePublished, when dateModified is missing or is the blanket stamp
  5. dateModified, when it is not the blanket stamp

Visible "Last reviewed" is added only on compare/, condition/, and stack/
pages. Redirect stubs are left alone. sitemap-news.xml is not touched.
"""
from __future__ import annotations

import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
ORIGIN = "https://supplementscore.org"
BLANKET = {"2026-05-23", "2026-05-24"}
MONTHS = (
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)
SKIP_SITEMAPS = {"sitemap-index.xml", "sitemap-news.xml"}
VISIBLE_DIRS = {"compare", "condition", "stack"}
INDEX_PAGES = {
    "compare/index.html": "compare",
    "condition/index.html": "condition",
    "stack/index.html": "stack",
}
URL_BLOCK = re.compile(r"<url>.*?</url>", re.S)
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")


def pretty(iso: str) -> str:
    year, month, day = iso.split("-")
    return f"{int(day)} {MONTHS[int(month)]} {year}"


def is_redirect(text: str) -> bool:
    head = text[:800]
    return 'http-equiv="refresh"' in head or "http-equiv='refresh'" in head


def true_date(text: str) -> str | None:
    if is_redirect(text):
        return None
    comment = re.search(r"<!--\s*last-reviewed:\s*(\d{4}-\d{2}-\d{2})\s*-->", text)
    if comment:
        return comment.group(1)
    shown = re.search(
        r"Last reviewed:?\s*(?:<time datetime=\"(\d{4}-\d{2}-\d{2})\"|<time datetime=\"(\d{4}-\d{2}-\d{2})\")",
        text,
    )
    if shown:
        return shown.group(1) or shown.group(2)
    updated = re.search(r"Updated\s+(\d{4}-\d{2}-\d{2})", text)
    if updated:
        return updated.group(1)
    published = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"', text)
    modified = re.search(r'"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"', text)
    if published and (modified is None or modified.group(1) in BLANKET):
        return published.group(1)
    if modified and modified.group(1) not in BLANKET:
        return modified.group(1)
    return None


def ensure_comment(text: str, date: str) -> str:
    if re.search(r"<!--\s*last-reviewed:\s*\d{4}-\d{2}-\d{2}\s*-->", text):
        return re.sub(
            r"<!--\s*last-reviewed:\s*\d{4}-\d{2}-\d{2}\s*-->",
            f"<!-- last-reviewed: {date} -->",
            text,
            count=1,
        )
    if text.startswith("<!DOCTYPE html>\n"):
        return text.replace(
            "<!DOCTYPE html>\n",
            f"<!DOCTYPE html>\n<!-- last-reviewed: {date} -->\n",
            1,
        )
    if text.startswith("<!DOCTYPE html>"):
        return text.replace(
            "<!DOCTYPE html>",
            f"<!DOCTYPE html>\n<!-- last-reviewed: {date} -->",
            1,
        )
    return f"<!-- last-reviewed: {date} -->\n{text}"


def set_date_modified(text: str, date: str) -> str:
    def repl(match: re.Match) -> str:
        raw = match.group(0)
        if ": \"" in raw or ": '" in raw:
            return f'"dateModified": "{date}"'
        return f'"dateModified":"{date}"'

    if re.search(r'"dateModified"\s*:', text):
        return re.sub(r'"dateModified"\s*:\s*"[^"]+"', repl, text)
    inserted = re.sub(
        r'"inLanguage": "en"(?![-A-Za-z])',
        f'"dateModified": "{date}",\n  "inLanguage": "en"',
        text,
        count=1,
    )
    return inserted


def add_visible(text: str, date: str) -> str:
    if re.search(r"Last reviewed", text):
        # Keep one line. If it still shows an ISO day or the blanket stamp, rewrite that datetime.
        text = re.sub(
            r"(Last reviewed:?\s*<time datetime=\")\d{4}-\d{2}-\d{2}(\">)[^<]*(</time>)",
            lambda m: f"{m.group(1)}{date}{m.group(2)}{pretty(date)}{m.group(3)}",
            text,
            count=1,
        )
        text = re.sub(
            r"(<p class=\"ca-meta\">)Updated \d{4}-\d{2}-\d{2}",
            lambda m: f"{m.group(1)}Last reviewed {pretty(date)}",
            text,
            count=1,
        )
        return text
    meta = re.search(r"(<p class=\"ca-meta\">)Updated \d{4}-\d{2}-\d{2}", text)
    if meta:
        return (
            text[: meta.start()]
            + meta.group(1)
            + f"Last reviewed {pretty(date)}"
            + text[meta.end() :]
        )
    h1 = re.search(r"</h1>", text)
    if not h1:
        return text
    line = (
        f'<p class="ss-last-reviewed" style="font-size:12.5px;color:var(--color-text-tertiary);margin:0 0 12px">'
        f'Last reviewed <time datetime="{date}">{pretty(date)}</time></p>'
    )
    return text[: h1.end()] + line + text[h1.end() :]


def apply_page(path: pathlib.Path, date: str, visible: bool) -> bool:
    original = path.read_text(encoding="utf-8")
    text = ensure_comment(original, date)
    text = set_date_modified(text, date)
    if visible:
        text = add_visible(text, date)
    if text == original:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def iter_html() -> list[pathlib.Path]:
    found = []
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith("_archive/") or "/_archive/" in rel:
            continue
        if rel.startswith("s/"):
            continue
        found.append(path)
    return found


def file_for_loc(loc: str) -> pathlib.Path | None:
    parsed = urllib.parse.urlparse(loc.strip())
    if parsed.netloc and parsed.netloc not in {"supplementscore.org", "www.supplementscore.org"}:
        return None
    if parsed.path.endswith("/supplement.html") and parsed.query.startswith("slug="):
        slug = urllib.parse.parse_qs(parsed.query).get("slug", [""])[0]
        candidate = ROOT / "supplement" / f"{slug}.html"
        return candidate if candidate.is_file() else None
    rel = parsed.path.strip("/")
    if rel == "":
        candidate = ROOT / "index.html"
        return candidate if candidate.is_file() else None
    candidate = ROOT / rel
    if candidate.is_file():
        return candidate
    candidate = ROOT / rel / "index.html"
    return candidate if candidate.is_file() else None


def stamp_sitemaps(dates: dict[str, str]) -> tuple[int, dict[str, str]]:
    changed = 0
    newest: dict[str, str] = {}
    for path in sorted(ROOT.glob("sitemap*.xml")):
        if path.name in SKIP_SITEMAPS:
            continue
        text = path.read_text(encoding="utf-8")
        shard_max = None

        def repl(match: re.Match) -> str:
            nonlocal changed, shard_max
            block = match.group(0)
            loc_m = re.search(r"<loc>(.*?)</loc>", block)
            lm_m = re.search(r"<lastmod>(.*?)</lastmod>", block)
            if not loc_m or not lm_m:
                return block
            loc = loc_m.group(1).strip()
            old = lm_m.group(1).strip()
            new = dates.get(loc)
            use = new or old
            if new and new != old:
                changed += 1
                block = block[: lm_m.start()] + f"<lastmod>{new}</lastmod>" + block[lm_m.end() :]
            if shard_max is None or use > shard_max:
                shard_max = use
            return block

        updated = URL_BLOCK.sub(repl, text)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
        if shard_max:
            newest[path.name] = shard_max
    index = ROOT / "sitemap-index.xml"
    if index.is_file() and newest:
        idx = index.read_text(encoding="utf-8")

        def repl_idx(match: re.Match) -> str:
            nonlocal changed
            block = match.group(0)
            loc_m = re.search(r"<loc>(.*?)</loc>", block)
            lm_m = re.search(r"<lastmod>(.*?)</lastmod>", block)
            if not loc_m or not lm_m:
                return block
            name = pathlib.Path(urllib.parse.urlparse(loc_m.group(1).strip()).path).name
            new = newest.get(name)
            old = lm_m.group(1).strip()
            if not new or new == old:
                return block
            changed += 1
            return block[: lm_m.start()] + f"<lastmod>{new}</lastmod>" + block[lm_m.end() :]

        updated = re.sub(r"<sitemap>.*?</sitemap>", repl_idx, idx, flags=re.S)
        if updated != idx:
            index.write_text(updated, encoding="utf-8")
    return changed, newest


def main() -> int:
    child_dates: dict[str, list[str]] = {name: [] for name in INDEX_PAGES.values()}
    page_dates: dict[pathlib.Path, str] = {}
    written = 0
    for path in iter_html():
        rel = path.relative_to(ROOT).as_posix()
        if rel in INDEX_PAGES:
            continue
        text = path.read_text(encoding="utf-8")
        date = true_date(text)
        if not date:
            continue
        page_dates[path] = date
        top = rel.split("/", 1)[0]
        if top in child_dates and path.name != "index.html":
            child_dates[top].append(date)
        visible = top in VISIBLE_DIRS
        if apply_page(path, date, visible):
            written += 1

    for rel, folder in INDEX_PAGES.items():
        path = ROOT / rel
        if not path.is_file() or not child_dates[folder]:
            continue
        date = max(child_dates[folder])
        page_dates[path] = date
        if apply_page(path, date, True):
            written += 1

    loc_dates: dict[str, str] = {}
    for path, date in page_dates.items():
        rel = path.relative_to(ROOT).as_posix()
        if rel == "index.html":
            loc_dates[ORIGIN + "/"] = date
        else:
            loc_dates[f"{ORIGIN}/{rel}"] = date
    changed, newest = stamp_sitemaps(loc_dates)
    print(f"content_dates: rewrote {written} html file(s); sitemap lastmod edits {changed}")
    for name, date in sorted(newest.items()):
        print(f"  {name} newest {date}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
