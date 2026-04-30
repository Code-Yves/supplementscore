"""WHO Monographs on Selected Medicinal Plants adapter — live (lookup-tier).

WHO published 4 volumes of medicinal-plant monographs (~120 plants total). The PDFs
are on apps.who.int/iris and are searchable. This adapter uses the IRIS search API
to find monographs that match a supplement name (typically the Latin binomial), and
returns the matching IRIS handle URL.

PDF section extraction is a future deepening — for now the adapter resolves a search
into linkable monograph references.
"""
from __future__ import annotations

import re
from urllib.parse import quote

from ._common import (base_record, claim, http_get, strip_html, study, warn)

SUPPORTED_QUERY = "lookup"
SOURCE_KEY = "who"
SOURCE_LABEL = "WHO Medicinal Plant Monographs"
# IRIS Solr-backed search; this URL form returns HTML
SEARCH_URL = ("https://iris.who.int/discover?query={q}+monograph"
              "&filtertype_0=author&filter_relational_operator_0=equals"
              "&filter_0=World+Health+Organization")


def _scientific_name(supp_name: str) -> str | None:
    m = re.search(r"\(([A-Z][a-z]+(?:\s+[a-z]+)+)\)", supp_name)
    return m.group(1) if m else None


def _extract_results(html: str, max_results: int = 5) -> list[dict]:
    out: list[dict] = []
    # IRIS uses ds-artifact-list layout
    for m in re.finditer(
        r'<a[^>]+href="(/handle/\d+/\d+)"[^>]*>(.*?)</a>',
        html, re.DOTALL,
    ):
        url = "https://iris.who.int" + m.group(1)
        title = strip_html(m.group(2))
        if not title or len(title) < 6:
            continue
        # Filter to monograph-looking titles
        if "monograph" not in title.lower() and "medicinal" not in title.lower():
            continue
        out.append({"title": title, "url": url, "snippet": ""})
        if len(out) >= max_results:
            break
    return out


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    if not supplement_name.strip():
        return []
    binomial = _scientific_name(supplement_name)
    base = re.sub(r"\s*\([^)]*\)", "", supplement_name).strip()
    query = binomial or base
    if len(query) < 4:
        return []
    url = SEARCH_URL.format(q=quote(query))
    try:
        body = http_get(url, accept="text/html")
    except RuntimeError as e:
        warn(f"who fetch {url} failed: {e}")
        return []
    html = body.decode("utf-8", errors="replace")
    items = _extract_results(html)
    if not items:
        return [base_record(
            supplement=supplement_name,
            source_key=SOURCE_KEY,
            source_label=SOURCE_LABEL,
            source_url=url,
            evidence_summary=("WHO IRIS search returned no monograph matches — most plants "
                              "outside the 120-plant WHO list won't have a monograph. "
                              "Manual lookup at the source URL."),
            key_claims=[],
            cited_studies=[],
        )]
    summary = (f"WHO Medicinal Plant Monographs for '{query}': {len(items)} match(es). "
               f"Each is a published PDF monograph with traditional-use evidence, dosing, "
               f"and contraindications recognized by WHO.")
    claims = [claim(it["title"], evidence_grade="regulator",
                    context="WHO Medicinal Plant Monograph — global authority on traditional-use evidence and contraindications")
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
