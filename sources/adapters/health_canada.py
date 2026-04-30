"""Health Canada NNHPD adapter — live (search-tier).

Health Canada's Licensed Natural Health Products Database (LNHPD) covers ~600 monographs
with approved claims, doses, and contraindications. The full database is bulk-downloadable
but parsing it is a separate effort; this adapter uses the public search at:
    https://hc-sc.api.canada.ca/en/lnhpd/search/...
to produce per-supplement candidate-monograph lists.

For now the adapter resolves a supplement name to a search URL with results listing.
Per-monograph deep extraction is a future deepening.
"""
from __future__ import annotations

import re
from urllib.parse import quote

from ._common import (base_record, claim, http_get, strip_html, study, warn)

SUPPORTED_QUERY = "lookup"
SOURCE_KEY = "health_canada"
SOURCE_LABEL = "Health Canada NNHPD"
# LNHPD public search portal
SEARCH_URL = "https://health-products.canada.ca/lnhpd-bdpsnh/search-rechercher.do?lang=eng&keyword={q}"


def _extract_results(html: str, max_results: int = 6) -> list[dict]:
    out: list[dict] = []
    # Health Canada uses table-of-results layouts; try a few patterns.
    for row_match in re.finditer(
        r'<tr[^>]*>(.*?)</tr>',
        html, re.DOTALL,
    ):
        block = row_match.group(1)
        link_m = re.search(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', block, re.DOTALL)
        if not link_m:
            continue
        url = link_m.group(1)
        title = strip_html(link_m.group(2))
        if not title or len(title) < 4:
            continue
        if url.startswith("/"):
            url = "https://health-products.canada.ca" + url
        if "lnhpd" not in url and "natural" not in url.lower():
            continue
        out.append({"title": title, "url": url, "snippet": strip_html(block)[:240]})
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
        warn(f"health_canada fetch {url} failed: {e}")
        return []
    html = body.decode("utf-8", errors="replace")
    items = _extract_results(html)
    if not items:
        # Fallback: still return the search URL so the human reviewer can click through
        return [base_record(
            supplement=supplement_name,
            source_key=SOURCE_KEY,
            source_label=SOURCE_LABEL,
            source_url=url,
            evidence_summary=("Health Canada NNHPD search returned no parseable results — "
                              "may indicate no monograph for this supplement, or the search "
                              "layout changed. Manual lookup at the source URL."),
            key_claims=[],
            cited_studies=[],
        )]
    summary = (f"Health Canada Licensed Natural Health Products matching '{base}': "
               f"{len(items)} entry/entries. Each links to a structured monograph with "
               f"approved doses, claims, and contraindications.")
    claims = [claim(it["title"], evidence_grade="regulator",
                    context="Health Canada NNHPD licensed product monograph")
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
