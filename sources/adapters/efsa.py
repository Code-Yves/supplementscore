"""EFSA (European Food Safety Authority) adapter — live.

Pulls scientific opinion / dossier listings from EFSA's public search and parses the
results. PDF dossier text extraction is a separate step (see the comment at the bottom);
this adapter focuses on producing a curated list of relevant EFSA publications per
supplement so the daily review pipeline can attach high-tier regulator citations.

Search URL: https://www.efsa.europa.eu/en/search?s={query}
The result page is HTML with a list of <article class="search-result-item"> blocks (or
similar — EFSA changes layout occasionally; this parser is defensive).
"""
from __future__ import annotations

import re
from urllib.parse import quote, urljoin

from ._common import (base_record, claim, http_get, strip_html, study, warn)

SUPPORTED_QUERY = "search"
SOURCE_KEY = "efsa"
SOURCE_LABEL = "European Food Safety Authority"
SEARCH_URL = "https://www.efsa.europa.eu/en/search?s={q}"
BASE = "https://www.efsa.europa.eu"


def _extract_results(html: str, max_results: int = 6) -> list[dict]:
    """Parse the EFSA search HTML and return a list of {title, url, snippet, date}."""
    out: list[dict] = []
    # Try a few result-block patterns; EFSA's layout has shifted over the years.
    block_patterns = [
        r'<article[^>]*class="[^"]*search-result-item[^"]*"[^>]*>(.*?)</article>',
        r'<div[^>]*class="[^"]*views-row[^"]*"[^>]*>(.*?)</div>\s*</div>',  # Drupal views layout
        r'<li[^>]*class="[^"]*search-result[^"]*"[^>]*>(.*?)</li>',
    ]
    for pat in block_patterns:
        blocks = re.findall(pat, html, re.DOTALL)
        if blocks:
            break
    else:
        blocks = []
    title_re = re.compile(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
    date_re = re.compile(r"\b(\d{1,2}\s+\w+\s+20\d{2})\b|\b(20\d{2}-\d{2}-\d{2})\b")
    for block in blocks[:max_results]:
        tm = title_re.search(block)
        if not tm:
            continue
        url = tm.group(1)
        if url.startswith("/"):
            url = urljoin(BASE, url)
        if not url.startswith("http"):
            continue
        title = strip_html(tm.group(2))
        if len(title) < 8:
            continue
        snippet = strip_html(block)
        # Trim snippet to the chunk after the title
        title_pos = snippet.find(title)
        snippet = snippet[title_pos + len(title):title_pos + len(title) + 300] if title_pos >= 0 else snippet[:300]
        date_m = date_re.search(block)
        date_str = (date_m.group(0) if date_m else "")
        out.append({"title": title, "url": url, "snippet": snippet.strip(), "date": date_str})
    return out


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    if not supplement_name.strip():
        return []
    base = re.sub(r"\s*\([^)]*\)", "", supplement_name).strip()
    base = re.sub(r"\s+(extended[\s-]release|gummies|tablets|capsules|powder|drops|liquid|spray|low[\s-]dose|high[\s-]dose).*$", "", base, flags=re.I).strip()
    if len(base) < 3:
        return []
    url = SEARCH_URL.format(q=quote(base))
    try:
        body = http_get(url, accept="text/html")
    except RuntimeError as e:
        warn(f"efsa fetch {url} failed: {e}")
        return []
    html = body.decode("utf-8", errors="replace")
    items = _extract_results(html)
    if not items:
        # Layout-change fallback: look for any anchor pointing to /en/efsajournal/pub/ or /en/news/
        # which is where most relevant items live.
        for m in re.finditer(r'<a[^>]+href="(/en/(efsajournal/pub|news/news|topics/topic)/[^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL):
            url2 = urljoin(BASE, m.group(1))
            title = strip_html(m.group(3))
            if title and len(title) > 8:
                items.append({"title": title, "url": url2, "snippet": "", "date": ""})
            if len(items) >= 4:
                break
    if not items:
        return []
    # Build the normalized record
    summary = (f"EFSA scientific opinions and publications matching '{base}': "
               f"{len(items)} item(s). Top result: {items[0]['title'][:200]}")
    claims = []
    for it in items[:4]:
        claims.append(claim(
            it["title"],
            evidence_grade="regulator",
            context="EFSA Scientific Opinion or news; manual review of the linked PDF for tolerable upper-intake level (UL) and key conclusions.",
        ))
    studies = [study(title=it["title"]) for it in items]
    return [base_record(
        supplement=supplement_name,
        source_key=SOURCE_KEY,
        source_label=SOURCE_LABEL,
        source_url=url,
        evidence_summary=summary,
        key_claims=claims,
        cited_studies=studies,
    )]


# ── Future: PDF dossier extraction ──
# When ready to deepen this adapter, add a step that downloads each linked PDF
# (https://www.efsa.europa.eu/en/efsajournal/pub/{id}, follow to PDF), uses pdfplumber to
# extract the "Conclusions" or "Tolerable Upper Intake Level" sections, and adds those
# extracted paragraphs as additional `key_claims`. For now the search-result layer is
# already a meaningful step up from the stub — adapters higher in the registry (ODS,
# Cochrane) carry the heavy parsing.
