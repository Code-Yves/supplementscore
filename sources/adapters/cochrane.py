"""Cochrane Library adapter.

Full-text reviews require subscription, but abstracts and Plain Language Summaries
are open and usually sufficient for tier calls. We query the Cochrane public search
endpoint and parse the result list.

Search URL pattern:
    https://www.cochranelibrary.com/cdsr/reviews?searchType=basic&searchText={query}

Implementation note: the public search returns HTML, not a structured API. This
adapter parses titles + DOIs + PLS snippets from that HTML. The parser is defensive —
when Cochrane changes layout, the adapter returns [] and emits a warn() rather than
crashing the orchestrator.
"""
from __future__ import annotations

import re
from urllib.parse import quote

from ._common import (base_record, claim, http_get, strip_html, study, warn)

SUPPORTED_QUERY = "search"
SOURCE_KEY = "cochrane"
SOURCE_LABEL = "Cochrane Library"
SEARCH_URL = "https://www.cochranelibrary.com/cdsr/reviews?searchText={q}"


def _extract_results(html: str, max_results: int = 5) -> list[dict]:
    """Pull review records out of the Cochrane search result HTML.
    Each result block typically has class 'search-results-item-body' and contains
    a title link, a DOI, and a short blurb."""
    results: list[dict] = []
    # Cochrane wraps each result in a div containing the review title <a>
    # plus a metadata block with the DOI.
    block_re = re.compile(
        r'<div[^>]*class="[^"]*search-results-item-body[^"]*"[^>]*>(.*?)</div>',
        re.DOTALL,
    )
    title_re = re.compile(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
    doi_re = re.compile(r"\b10\.\d{4,9}/[-._;()/:A-Za-z0-9]+\b")
    for block in block_re.findall(html)[:max_results]:
        tm = title_re.search(block)
        if not tm:
            continue
        url = tm.group(1)
        if url.startswith("/"):
            url = "https://www.cochranelibrary.com" + url
        title = strip_html(tm.group(2))
        doi_m = doi_re.search(block)
        snippet = strip_html(block)[:300]
        results.append({"title": title, "url": url, "doi": doi_m.group(0) if doi_m else "",
                        "snippet": snippet})
    return results


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    if not supplement_name.strip():
        return []
    # Use the base name (no parentheticals) for the search.
    q = re.sub(r"\s*\([^)]*\)", "", supplement_name).strip()
    if len(q) < 3:
        return []
    url = SEARCH_URL.format(q=quote(q))
    try:
        body = http_get(url, accept="text/html")
    except RuntimeError as e:
        warn(f"cochrane fetch {url} failed: {e}")
        return []
    html = body.decode("utf-8", errors="replace")
    items = _extract_results(html)
    if not items:
        return []
    summary = f"Cochrane has {len(items)} systematic review(s) matching '{q}'."
    if items:
        summary += " Top result: " + items[0]["title"][:200]
    claims = []
    for it in items[:3]:
        claims.append(claim(
            it["title"],
            evidence_grade="cochrane",
            context=it["snippet"][:200],
        ))
    studies = [study(title=it["title"], doi=it["doi"]) for it in items]
    return [base_record(
        supplement=supplement_name,
        source_key=SOURCE_KEY,
        source_label=SOURCE_LABEL,
        source_url=url,
        evidence_summary=summary,
        key_claims=claims,
        cited_studies=studies,
    )]
