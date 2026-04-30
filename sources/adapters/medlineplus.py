"""NIH MedlinePlus / NCCIH adapter — live (search-tier).

MedlinePlus has consumer-facing pages on supplements at:
    https://medlineplus.gov/druginfo/natural/
NCCIH has health-topic pages at:
    https://www.nccih.nih.gov/health/

The MedlinePlus search API at https://wsearch.nlm.nih.gov/ws/query is free and JSON-ish.
This adapter uses the public site search to surface relevant per-supplement pages and
returns them as Tier-3 sanity-check records.
"""
from __future__ import annotations

import re
from urllib.parse import quote

from ._common import (base_record, claim, http_get, strip_html, study, warn)

SUPPORTED_QUERY = "search"
SOURCE_KEY = "medlineplus"
SOURCE_LABEL = "NIH MedlinePlus / NCCIH"
SEARCH_URL = "https://medlineplus.gov/searchresults.html?query={q}"
NCCIH_SEARCH = "https://www.nccih.nih.gov/health/{q}"


def _extract_results(html: str, max_results: int = 5) -> list[dict]:
    out: list[dict] = []
    for m in re.finditer(
        r'<a[^>]+href="(https?://medlineplus\.gov/[^"]+)"[^>]*>(.*?)</a>',
        html, re.DOTALL,
    ):
        url = m.group(1)
        title = strip_html(m.group(2))
        if not title or len(title) < 5:
            continue
        if "/druginfo/" not in url and "/ency/" not in url:
            continue
        out.append({"title": title, "url": url, "snippet": ""})
        if len(out) >= max_results:
            break
    return out


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    if not supplement_name.strip():
        return []
    base = re.sub(r"\s*\([^)]*\)", "", supplement_name).strip()
    base = re.sub(r"\s+(extract|standardised|standardized|gummies|tablets|capsules).*$", "", base, flags=re.I).strip()
    if len(base) < 3:
        return []
    url = SEARCH_URL.format(q=quote(base))
    try:
        body = http_get(url, accept="text/html")
    except RuntimeError as e:
        warn(f"medlineplus fetch {url} failed: {e}")
        return []
    html = body.decode("utf-8", errors="replace")
    items = _extract_results(html)
    if not items:
        # Fallback: still expose the search URL
        return [base_record(
            supplement=supplement_name,
            source_key=SOURCE_KEY,
            source_label=SOURCE_LABEL,
            source_url=url,
            evidence_summary=("MedlinePlus search returned no parseable druginfo results. "
                              "Manual lookup at the source URL."),
            key_claims=[],
            cited_studies=[],
        )]
    summary = (f"MedlinePlus consumer-facing pages for '{base}': {len(items)} match(es). "
               f"Use as a sanity check on tier calls and consumer-friendly dosing — "
               f"Tier-3 priority below ODS, Cochrane, and EFSA in the source hierarchy.")
    claims = [claim(it["title"], evidence_grade="consumer_summary",
                    context="MedlinePlus consumer summary — useful as a sanity check, not a primary source for tier assignment")
              for it in items[:3]]
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
