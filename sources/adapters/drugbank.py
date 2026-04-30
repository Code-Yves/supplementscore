"""DrugBank adapter — STUB pending academic license.

DrugBank is the most curated drug-interaction dataset available — meaningfully more
accurate and complete than openFDA SPL mining for drug↔supplement pairs. It's free
for non-commercial use under their academic license, but the application is a manual
process and isn't redistributable.

This adapter is a stub until the license arrives. The integration plan and what to
do once you have access live in `docs/drugbank-integration.md`.

When live, this adapter will:
1. Read the DrugBank XML dump (or query the academic API).
2. For each supplement in `data.js`, look up the drug-interaction list keyed by
   the supplement's DrugBank ID (DB*).
3. Emit normalized records with severity, mechanism, and DrugBank citation.

Until then, returns a placeholder pointing to the academic-license signup.
"""
from __future__ import annotations

from urllib.parse import quote

from ._common import base_record

SUPPORTED_QUERY = "lookup"
SOURCE_KEY = "drugbank"
SOURCE_LABEL = "DrugBank"
HOMEPAGE = "https://go.drugbank.com"
ACADEMIC_LICENSE_URL = "https://go.drugbank.com/releases/latest"
SEARCH_URL = "https://go.drugbank.com/search?query={q}"


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    if not supplement_name.strip():
        return []
    return [base_record(
        supplement=supplement_name,
        source_key=SOURCE_KEY,
        source_label=SOURCE_LABEL,
        source_url=SEARCH_URL.format(q=quote(supplement_name)),
        evidence_summary=("DrugBank adapter is a stub pending academic license — see "
                          "docs/drugbank-integration.md for application instructions and the "
                          "integration plan. Manual lookup at the source URL is the current fallback."),
        key_claims=[],
        cited_studies=[],
    )]
