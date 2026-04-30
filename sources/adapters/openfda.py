"""openFDA adverse-event adapter.

openFDA exposes FAERS (FDA Adverse Event Reporting System) at:
    https://api.fda.gov/drug/event.json

Free, no auth, no key required for low-volume queries (no daily limit < 1000 reqs).

This adapter is most useful for Tier 4 / safety entries — it surfaces real-world
adverse-event reports that mention the supplement in a free-text field. It does NOT
provide curated evidence the way ODS / EFSA / Cochrane do.

We query by `patient.drug.openfda.generic_name` OR free-text `patient.drug.medicinalproduct`,
and return a record summarizing the count and most-recent reports for the supplement.
"""
from __future__ import annotations

import re
import urllib.parse

from ._common import base_record, claim, http_get_json, warn

SUPPORTED_QUERY = "search"
SOURCE_KEY = "openfda"
SOURCE_LABEL = "openFDA Drug Adverse Events (FAERS)"
ENDPOINT = "https://api.fda.gov/drug/event.json"


def _build_query(name: str) -> str:
    """Build a FAERS query string for a supplement name. Quotes the term and searches
    medicinalproduct + activesubstancename + generic_name."""
    # Strip parentheticals / qualifiers
    base = re.sub(r"\s*\([^)]*\)", "", name).strip()
    base = re.sub(r"\s+(extended[\s-]release|gummies|tablets|capsules|powder|drops|liquid|spray|low[\s-]dose|high[\s-]dose).*$", "", base, flags=re.I).strip()
    if not base:
        return ""
    quoted = '"' + base.replace('"', '') + '"'
    return (f'patient.drug.medicinalproduct:{quoted}+'
            f'patient.drug.activesubstance.activesubstancename:{quoted}+'
            f'patient.drug.openfda.generic_name:{quoted}')


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    q = _build_query(supplement_name)
    if not q:
        return []
    params = {
        "search": q,
        "count": "patient.reaction.reactionmeddrapt.exact",
        "limit": "10",
    }
    url = ENDPOINT + "?" + urllib.parse.urlencode(params, safe=':+"')
    try:
        data = http_get_json(url)
    except RuntimeError as e:
        # FAERS returns 404 when nothing matches — that's "no signal", not an error.
        if "404" in str(e):
            return []
        warn(f"openfda fetch {url} failed: {e}")
        return []
    results = data.get("results", []) if isinstance(data, dict) else []
    if not results:
        return []
    # `count` queries don't return a true document total — sum the histogram counts
    # to approximate it (double-counts reports that list multiple reactions, but it's
    # a reasonable signal of report volume).
    summed = sum(int(r.get("count", 0) or 0) for r in results)
    top = ", ".join(f"{r.get('term','?')} ({r.get('count',0)})" for r in results[:5])
    summary = (f"FAERS adverse-event reports for {supplement_name} (top-10 reactions sum: {summed}). "
               f"Most-reported reactions: {top}.")
    claims = [claim(
        f"openFDA FAERS aggregates ~{summed} adverse-event observations across the top-10 reactions involving {supplement_name}.",
        evidence_grade="regulator",
        context="openFDA FAERS — patient-reported adverse events. Not a measure of causation; large numerators reflect both real safety signals and reporting bias for popular products. Counts double-count reports that list multiple reactions."
    )]
    if results[:3]:
        top3 = ", ".join(r.get("term", "?") for r in results[:3])
        claims.append(claim(
            f"Top 3 reported adverse reactions: {top3}.",
            evidence_grade="regulator",
            context="From openFDA FAERS reaction frequencies."
        ))
    return [base_record(
        supplement=supplement_name,
        source_key=SOURCE_KEY,
        source_label=SOURCE_LABEL,
        source_url=ENDPOINT + "?search=" + urllib.parse.quote(q, safe=":+\""),
        evidence_summary=summary,
        key_claims=claims,
        cited_studies=[],
    )]
