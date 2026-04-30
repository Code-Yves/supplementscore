"""openFDA Drug Labeling adapter — Phase 2 / Item #2.

Distinct from `openfda.py` (FAERS adverse-event reports). This adapter pulls FDA-approved
drug Structured Product Labels (SPLs) and mines their `drug_interactions` sections for
mentions of supplements we track. The output is a list of candidate drug↔supplement pairs
that can be reviewed and inserted into `DRUG_INTERACTIONS.pairs` in `app.js`.

Endpoint: https://api.fda.gov/drug/label.json (free, no auth, ~1k/day quota)

Search syntax: we query for the supplement name in the `drug_interactions` field. The
field is free-text with FDA's standard format. We extract a snippet around each match
and the drug's generic name from `openfda.generic_name`.

Severity heuristic — applied to the snippet:
- "contraindicated" / "avoid" / "do not" / "should not" → avoid
- "monitor" / "may increase" / "may decrease" / "consider" / "caution" → caution
- "increases requirements" / "depletes" / "deficiency" → extra (drug depletes the nutrient)
- otherwise → caution (conservative default)

This is a build-time mining adapter — its records aren't per-supplement evidence the way
ODS or Cochrane records are. Treat them as candidates for the DRUG_INTERACTIONS.pairs
array, to be human-reviewed before going live in the data file.
"""
from __future__ import annotations

import re
import urllib.parse
from typing import Iterable

from ._common import base_record, claim, http_get_json, study, warn

SUPPORTED_QUERY = "search"
SOURCE_KEY = "openfda_drugs"
SOURCE_LABEL = "openFDA Drug Labels"
ENDPOINT = "https://api.fda.gov/drug/label.json"

_SNIPPET_RADIUS = 220  # chars of context around the matched supplement term

_AVOID_RE = re.compile(r"\b(contraindicated|avoid|do not|should not|must not|incompatible)\b", re.I)
_CAUTION_RE = re.compile(r"\b(monitor|caution|may (?:increase|decrease|alter|affect)|consider (?:reducing|adjusting)|interfere|interact)\b", re.I)
_EXTRA_RE = re.compile(r"\b(deplete[sd]?|depletion|deficiency|increases? requirements?|reduces? (?:absorption|levels?))\b", re.I)


def _query_labels(supp_name: str, limit: int = 5) -> list[dict]:
    """Query openFDA for labels whose drug_interactions section mentions the supplement."""
    # Strip parentheticals and chemical-form qualifiers — search for the base name only.
    base = re.sub(r"\s*\([^)]*\)", "", supp_name).strip()
    base = re.sub(r"\s+(extended[\s-]release|gummies|tablets|capsules|powder|drops|liquid|spray|low[\s-]dose|high[\s-]dose).*$", "", base, flags=re.I).strip()
    if len(base) < 4:
        return []
    quoted = '"' + base.replace('"', '') + '"'
    params = {
        "search": f"drug_interactions:{quoted}",
        "limit": str(limit),
    }
    url = ENDPOINT + "?" + urllib.parse.urlencode(params, safe=':+"')
    try:
        data = http_get_json(url)
    except RuntimeError as e:
        if "404" in str(e):
            return []
        warn(f"openfda_drugs fetch {url} failed: {e}")
        return []
    return (data or {}).get("results", []) if isinstance(data, dict) else []


def _extract_snippet(text: str, term: str) -> str:
    """Return ~SNIPPET_RADIUS chars of context around the first match, single-line."""
    m = re.search(re.escape(term), text, re.I)
    if not m:
        return ""
    s = max(0, m.start() - _SNIPPET_RADIUS)
    e = min(len(text), m.end() + _SNIPPET_RADIUS)
    snippet = text[s:e]
    if s > 0:
        snippet = "…" + snippet
    if e < len(text):
        snippet = snippet + "…"
    return re.sub(r"\s+", " ", snippet).strip()


def _classify_severity(snippet: str) -> str:
    """Heuristic severity classification of the matched snippet."""
    if _EXTRA_RE.search(snippet) and not _AVOID_RE.search(snippet):
        return "extra"
    if _AVOID_RE.search(snippet):
        return "avoid"
    if _CAUTION_RE.search(snippet):
        return "caution"
    return "caution"  # conservative default


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    if not supplement_name or not supplement_name.strip():
        return []
    base = re.sub(r"\s*\([^)]*\)", "", supplement_name).strip()
    base = re.sub(r"\s+(extended[\s-]release|gummies|tablets|capsules|powder|drops|liquid|spray|low[\s-]dose|high[\s-]dose).*$", "", base, flags=re.I).strip()
    if len(base) < 4:
        return []
    labels = _query_labels(supplement_name)
    if not labels:
        return []
    candidate_pairs: list[dict] = []
    seen_drugs: set[str] = set()
    for lbl in labels:
        # The drug name is in openfda.generic_name (most reliable).
        of = lbl.get("openfda", {}) or {}
        generics = of.get("generic_name") or []
        brands = of.get("brand_name") or []
        rxcuis = of.get("rxcui") or []
        if not generics:
            continue
        # Pull the drug_interactions text and find the snippet
        di = lbl.get("drug_interactions") or []
        if isinstance(di, list):
            di = " ".join(di)
        if not isinstance(di, str) or not di:
            continue
        snippet = _extract_snippet(di, base)
        if not snippet:
            continue
        severity = _classify_severity(snippet)
        for generic in generics[:1]:  # pick the primary generic name only
            generic_lower = generic.lower()
            if generic_lower in seen_drugs:
                continue
            seen_drugs.add(generic_lower)
            candidate_pairs.append({
                "drug_generic": generic_lower,
                "drug_brands": brands[:3] if brands else [],
                "rxcui": rxcuis[0] if rxcuis else "",
                "supplement": supplement_name,
                "severity_hint": severity,
                "snippet": snippet,
                "label_set_id": lbl.get("set_id", ""),
            })
    if not candidate_pairs:
        return []
    summary = (f"openFDA drug labels containing a drug-interaction mention of "
               f"{supplement_name}: {len(candidate_pairs)} drug(s). Review snippets "
               f"and severity hints; promote curated entries into DRUG_INTERACTIONS.pairs.")
    claims = []
    for p in candidate_pairs[:5]:
        claims.append(claim(
            f"{p['drug_generic'].title()}: '{p['snippet'][:200]}…' (heuristic severity: {p['severity_hint']})",
            evidence_grade="regulator",
            context=f"openFDA SPL set_id {p['label_set_id']}",
        ))
    return [base_record(
        supplement=supplement_name,
        source_key=SOURCE_KEY,
        source_label=SOURCE_LABEL,
        source_url=ENDPOINT + "?search=" + urllib.parse.quote(f"drug_interactions:\"{base}\"", safe=':+"'),
        evidence_summary=summary,
        key_claims=claims,
        cited_studies=[],
    )] + [{
        # Extra non-standard records: one per candidate pair, easier for the daily
        # pipeline to ingest into DRUG_INTERACTIONS.pairs after manual review.
        "_kind": "drug_supp_candidate",
        "supplement": supplement_name,
        "source_key": SOURCE_KEY,
        **p,
    } for p in candidate_pairs]
