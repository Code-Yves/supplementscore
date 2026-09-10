#!/usr/bin/env python3
"""Move non-TOP_MIX homepage article cards out of index.html into a deferred file.

Background: index.html still ships ~855 .article-card nodes (~930 KB) inside
.article-list even though initArticleLoadMore() only shows the first 20. That
HTML weight dominates homepage CWV. Cards beyond the curated ARTICLE_TOP_MIX
(the same ~20 keys index.js promotes to the top of "All") are moved to
data/article-cards-deferred.html and injected after first paint by
loadDeferredArticleCards() in index.js.

Idempotent: re-running on an already-deferred homepage is a no-op (exits 0).
--check reports sizes and exits 1 if deferrable cards remain inline.

Usage:
  python3 scripts/defer_article_cards.py
  python3 scripts/defer_article_cards.py --check
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
DEFERRED = ROOT / "data" / "article-cards-deferred.html"

# Keep in sync with ARTICLE_TOP_MIX in index.js
TOP_MIX = [
    "a/the-10-most-dangerous-supplements-still-legally-sold.html",
    3,
    "a/the-10-most-overhyped-supplements-of-2026.html",
    4,
    "a/12-supplement-mistakes-you-should-literally-never-make.html",
    10,
    "a/the-cheapest-effective-supplements-vs-the-priciest-hyped-ones.html",
    11,
    "a/the-10-safest-supplements-on-earth.html",
    5,
    "a/10-supplements-that-interact-with-the-most-prescription-drugs.html",
    15,
    "a/10-wild-fun-facts-about-the-supplement-industry.html",
    2,
    "a/the-10-most-studied-supplements-on-earth.html",
    9,
    "a/10-hidden-gem-supplements-no-one-markets.html",
    8,
    "a/the-10-supplements-people-are-actually-deficient-in.html",
    6,
]
TOP_SET = set(TOP_MIX)

LIST_OPEN = '<div class="article-list">'
RLV_CLOSE = "</div><!-- end research-list-view -->"
CARD_OPEN = re.compile(
    r'<(a|div)\b([^>]*\bclass="[^"]*\barticle-card\b[^"]*"[^>]*)>',
)
ONCLICK_ID = re.compile(r'onclick="showArticle\((\d+)\)"')
HREF = re.compile(r'href="([^"]+)"')

MARKER = (
    "      <!-- Deferred article cards: data/article-cards-deferred.html "
    "(loaded by loadDeferredArticleCards in index.js) -->\n"
)


def card_key(attrs: str):
    m = ONCLICK_ID.search(attrs)
    if m:
        return int(m.group(1))
    m = HREF.search(attrs)
    if m:
        return m.group(1).lstrip("/")
    return None


def extract_cards(region: str):
    cards = []
    i = 0
    while True:
        m = CARD_OPEN.search(region, i)
        if not m:
            break
        tag = m.group(1)
        attrs = m.group(2)
        start = m.start()
        open_end = m.end()
        if tag == "a":
            close = region.find("</a>", open_end)
            if close < 0:
                raise RuntimeError("unclosed <a class=article-card>")
            end = close + 4
        else:
            depth = 1
            j = open_end
            while j < len(region) and depth:
                if region.startswith("<div", j):
                    depth += 1
                    j = region.find(">", j) + 1
                elif region.startswith("</div>", j):
                    depth -= 1
                    j += 6
                else:
                    j += 1
            if depth != 0:
                raise RuntimeError("unbalanced <div class=article-card>")
            end = j
        # include trailing whitespace up to next non-space or next card
        trail = end
        while trail < len(region) and region[trail] in " \t\r\n":
            trail += 1
        block = region[start:trail]
        cards.append((card_key(attrs), start, trail, block))
        i = trail
    return cards


def main() -> int:
    check = "--check" in sys.argv
    html = INDEX.read_text(encoding="utf-8")
    list_i = html.find(LIST_OPEN)
    rlv_i = html.find(RLV_CLOSE)
    if list_i < 0 or rlv_i < 0 or rlv_i < list_i:
        print("ABORT: could not locate .article-list / research-list-view anchors")
        return 2
    # region is contents AFTER the opening tag through just before RLV close
    open_end = list_i + len(LIST_OPEN)
    region = html[open_end:rlv_i]
    cards = extract_cards(region)
    if not cards:
        print("ABORT: no article-card nodes found in .article-list")
        return 2

    keep, defer = [], []
    for key, _s, _e, block in cards:
        (keep if key in TOP_SET else defer).append((key, block))

    missing = [k for k in TOP_MIX if k not in {c[0] for c in keep}]
    if missing:
        print(f"ABORT: TOP_MIX keys missing from cards: {missing}")
        return 2

    keep_bytes = sum(len(b) for _, b in keep)
    defer_bytes = sum(len(b) for _, b in defer)
    print(
        f"cards={len(cards)} keep={len(keep)} ({keep_bytes // 1024} KB) "
        f"defer={len(defer)} ({defer_bytes // 1024} KB)"
    )

    if check:
        return 1 if defer else 0

    if not defer:
        print("already deferred — nothing to write")
        return 0

    # Rebuild list body: keep blocks in TOP_MIX order, then marker.
    keep_map = {k: b for k, b in keep}
    keep_html = "".join(keep_map[k] for k in TOP_MIX if k in keep_map)
    new_region = "\n" + keep_html + MARKER
    deferred_html = (
        "<!-- auto-generated by scripts/defer_article_cards.py — do not edit by hand -->\n"
        + "".join(b for _, b in defer)
    )

    new_html = html[:open_end] + new_region + html[rlv_i:]
    DEFERRED.parent.mkdir(parents=True, exist_ok=True)
    DEFERRED.write_text(deferred_html, encoding="utf-8")
    INDEX.write_text(new_html, encoding="utf-8")
    print(
        f"wrote {DEFERRED.relative_to(ROOT)} ({len(deferred_html) // 1024} KB); "
        f"index.html {len(html) // 1024} KB -> {len(new_html) // 1024} KB"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
