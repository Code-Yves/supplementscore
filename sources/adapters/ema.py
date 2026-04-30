"""EMA Herbal Medicinal Products Committee adapter — live.

EMA publishes HMPC monographs at their public website. The herbal index lives at
    https://www.ema.europa.eu/en/medicines/herbal
Each monograph is a structured page with sections covering therapeutic indications,
posology, contraindications, and special precautions.

This adapter searches the herbal-medicines index for the supplement (or its scientific
name) and returns the matching monograph URL plus a short result summary. Per-monograph
PDF text extraction is a future deepening (see comment at end).
"""
from __future__ import annotations

import re
from urllib.parse import quote, urljoin

from ._common import (base_record, claim, http_get, strip_html, study, warn)

SUPPORTED_QUERY = "search"
SOURCE_KEY = "ema"
SOURCE_LABEL = "EMA HMPC herbal monographs"
# EMA's herbal medicines list — accepts a free-text search via the views_fulltext param.
SEARCH_URL = ("https://www.ema.europa.eu/en/medicines"
              "?f%5B0%5D=ema_medicine_types%3Aherbal&search_api_views_fulltext={q}")
BASE = "https://www.ema.europa.eu"


def _scientific_name(supp_name: str) -> str | None:
    """Pull the Latin binomial out of a supplement name like 'Saw palmetto (Serenoa repens)'.
    EMA indexes herbals primarily by binomial."""
    m = re.search(r"\(([A-Z][a-z]+(?:\s+[a-z]+)+)\)", supp_name)
    return m.group(1) if m else None


def _extract_results(html: str, max_results: int = 5) -> list[dict]:
    out: list[dict] = []
    # EMA's results layout uses <article> or <div class="medicine"> blocks
    block_patterns = [
        r'<article[^>]*class="[^"]*node--type-medicine[^"]*"[^>]*>(.*?)</article>',
        r'<article[^>]*>(.*?)</article>',
        r'<div[^>]*class="[^"]*views-row[^"]*"[^>]*>(.*?)</div>\s*</div>',
    ]
    for pat in block_patterns:
        blocks = re.findall(pat, html, re.DOTALL)
        if blocks:
            break
    else:
        blocks = []
    title_re = re.compile(r'<a[^>]+href="(/en/medicines/herbal/[^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
    for block in blocks[:max_results]:
        tm = title_re.search(block)
        if not tm:
            continue
        url = urljoin(BASE, tm.group(1))
        title = strip_html(tm.group(2))
        if len(title) < 4:
            continue
        snippet = strip_html(block)[:300]
        out.append({"title": title, "url": url, "snippet": snippet.strip()})
    return out


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    if not supplement_name.strip():
        return []
    # Prefer the Latin binomial when available — EMA indexes by it.
    binomial = _scientific_name(supplement_name)
    base = re.sub(r"\s*\([^)]*\)", "", supplement_name).strip()
    base = re.sub(r"\s+(extract|standardised|standardized).*$", "", base, flags=re.I).strip()
    query = binomial or base
    if len(query) < 4:
        return []
    url = SEARCH_URL.format(q=quote(query))
    try:
        body = http_get(url, accept="text/html")
    except RuntimeError as e:
        warn(f"ema fetch {url} failed: {e}")
        return []
    html = body.decode("utf-8", errors="replace")
    items = _extract_results(html)
    if not items:
        # Fallback: any anchor under /en/medicines/herbal/ matches our search term
        for m in re.finditer(r'<a[^>]+href="(/en/medicines/herbal/[^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL):
            url2 = urljoin(BASE, m.group(1))
            title = strip_html(m.group(2))
            if not title or len(title) < 4:
                continue
            if query.lower() in title.lower() or (binomial and binomial.lower() in title.lower()):
                items.append({"title": title, "url": url2, "snippet": ""})
            if len(items) >= 4:
                break
    if not items:
        return []
    summary = (f"EMA HMPC herbal monograph search for '{query}': {len(items)} match(es). "
               f"Top result: {items[0]['title'][:200]}")
    claims = []
    for it in items[:3]:
        claims.append(claim(
            it["title"],
            evidence_grade="regulator",
            context="EMA HMPC monograph: covers EU therapeutic indications, posology, contraindications, and adverse-reaction lists for the herbal substance.",
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


# ── Future: per-monograph PDF section extraction ──
# Each EMA herbal monograph page links to the structured "EU herbal monograph" PDF and
# the "Assessment report" PDF. Add pdfplumber-based extraction of the Therapeutic
# Indications, Contraindications, and Special Warnings sections to upgrade the
# evidence_summary into structured per-claim records. Below in priority to PDF dossier
# extraction for EFSA (EFSA's UL values are higher signal).
