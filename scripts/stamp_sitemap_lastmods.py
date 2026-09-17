#!/usr/bin/env python3
"""Stamp sitemap <lastmod> from git (fixer, not a gate).

Google uses lastmod as a recrawl hint. After content or SEO-relevant HTML
changes (hreflang, copy, ranking lists), a stale lastmod leaves crawlers
thinking nothing moved. This walks every <url> in sitemap*.xml (except the
index and the news shard) and raises <lastmod> to the last git commit date of
the backing file — never decreases it.

Query supplement URLs (/supplement.html?slug=) use the newer of data.js
(the scored records) and supplement.html (the SPA shell: robots/canonical
changes affect every ?slug= URL's indexability).

Dirty (uncommitted) files stamp as today UTC so validate-before-commit stays
honest. Idempotent.

Usage:
    python3 scripts/stamp_sitemap_lastmods.py
"""
from __future__ import annotations

import glob
import pathlib
import re
import subprocess
import sys
import urllib.parse
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
ORIGIN = "https://supplementscore.org"
TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")
SKIP_SITEMAPS = {"sitemap-index.xml", "sitemap-news.xml"}
URL_BLOCK = re.compile(r"<url>.*?</url>", re.S)


def git_file_dates() -> dict[str, str]:
    """path -> newest commit date (YYYY-MM-DD). Dirty files become TODAY."""
    out = subprocess.check_output(
        ["git", "log", "--pretty=format:COMMIT:%ad", "--date=short", "--name-only"],
        cwd=ROOT,
        text=True,
        errors="replace",
    )
    dates: dict[str, str] = {}
    current = None
    for line in out.splitlines():
        if line.startswith("COMMIT:"):
            current = line[7:]
            continue
        path = line.strip()
        if not path or current is None:
            continue
        dates.setdefault(path, current)

    porcelain = subprocess.check_output(
        ["git", "status", "--porcelain"],
        cwd=ROOT,
        text=True,
        errors="replace",
    )
    for line in porcelain.splitlines():
        if len(line) < 4:
            continue
        # status XY, then path (handle "R  old -> new")
        rest = line[3:]
        path = rest.split(" -> ")[-1].strip().strip('"')
        xy = line[:2]
        if "D" in xy or "?" in xy:
            continue
        if xy.strip():
            dates[path] = TODAY
    return dates


def resolve_file(path: str) -> pathlib.Path | None:
    rel = path.strip("/")
    if rel == "":
        f = ROOT / "index.html"
        return f if f.is_file() else None
    f = ROOT / rel
    if f.is_file():
        return f
    f = ROOT / rel / "index.html"
    return f if f.is_file() else None


def loc_to_date(loc: str, dates: dict[str, str]) -> str | None:
    parsed = urllib.parse.urlparse(loc.strip())
    if parsed.path.endswith("/supplement.html") and parsed.query.startswith("slug="):
        found = [dates[r] for r in ("data.js", "supplement.html") if r in dates]
        return max(found) if found else None
    f = resolve_file(parsed.path)
    if f is None:
        return None
    rel = str(f.relative_to(ROOT)).replace("\\", "/")
    return dates.get(rel)


def stamp_urlset(text: str, dates: dict[str, str]) -> tuple[str, int, str | None]:
    changed = 0
    newest = None

    def repl(block_m: re.Match) -> str:
        nonlocal changed, newest
        block = block_m.group(0)
        loc_m = re.search(r"<loc>(.*?)</loc>", block)
        lm_m = re.search(r"<lastmod>(.*?)</lastmod>", block)
        if not loc_m or not lm_m:
            return block
        loc = loc_m.group(1).strip()
        old = lm_m.group(1).strip()
        new = loc_to_date(loc, dates)
        use = old
        if new and new > old:
            use = new
            changed += 1
            block = block[: lm_m.start()] + f"<lastmod>{use}</lastmod>" + block[lm_m.end() :]
        if newest is None or use > newest:
            newest = use
        return block

    return URL_BLOCK.sub(repl, text), changed, newest


def stamp_index(text: str, shard_newest: dict[str, str]) -> tuple[str, int]:
    changed = 0

    def repl(block_m: re.Match) -> str:
        nonlocal changed
        block = block_m.group(0)
        loc_m = re.search(r"<loc>(.*?)</loc>", block)
        lm_m = re.search(r"<lastmod>(.*?)</lastmod>", block)
        if not loc_m or not lm_m:
            return block
        name = pathlib.Path(urllib.parse.urlparse(loc_m.group(1).strip()).path).name
        new = shard_newest.get(name)
        old = lm_m.group(1).strip()
        if not new or new <= old:
            return block
        changed += 1
        return block[: lm_m.start()] + f"<lastmod>{new}</lastmod>" + block[lm_m.end() :]

    # sitemap-index uses <sitemap> wrappers, not <url>
    out = re.sub(r"<sitemap>.*?</sitemap>", repl, text, flags=re.S)
    return out, changed


def main() -> int:
    dates = git_file_dates()
    shard_newest: dict[str, str] = {}
    total = 0
    for sm in sorted(glob.glob(str(ROOT / "sitemap*.xml"))):
        name = pathlib.Path(sm).name
        if name in SKIP_SITEMAPS:
            continue
        path = pathlib.Path(sm)
        text = path.read_text(encoding="utf-8")
        new_text, n, newest = stamp_urlset(text, dates)
        total += n
        if newest:
            shard_newest[name] = newest
        if n:
            path.write_text(new_text, encoding="utf-8")
            print(f"  {name}: raised {n} lastmod(s) (newest {newest})")
        else:
            print(f"  {name}: already fresh (newest {newest})")

    index_path = ROOT / "sitemap-index.xml"
    if index_path.is_file():
        idx_text = index_path.read_text(encoding="utf-8")
        new_idx, n = stamp_index(idx_text, shard_newest)
        total += n
        if n:
            index_path.write_text(new_idx, encoding="utf-8")
            print(f"  sitemap-index.xml: raised {n} shard lastmod(s)")
        else:
            print("  sitemap-index.xml: already fresh")

    print(f"stamp_sitemap_lastmods: {total} lastmod value(s) updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
