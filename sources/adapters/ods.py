"""NIH Office of Dietary Supplements adapter.

ODS publishes Health Professional fact sheets at stable URLs:
    https://ods.od.nih.gov/factsheets/{Slug}-HealthProfessional/

Each fact sheet has:
- An "Introduction" or "Recommended Intakes" section with RDAs / ULs
- A "Sources of Vitamin X" / "Intakes of Vitamin X" section
- A "Health Effects" section with summarized evidence by condition
- A "Health Risks" / "Interactions with Medications" section
- A long reference list at the bottom

This adapter pulls the page, extracts the title, the "intake recommendations" or
similar section, the references list, and the "Page last reviewed" date in the footer.

Coverage: ~80 supplements. ODS doesn't have a fact sheet for every supplement in
data.js — for unknown names, returns []. The orchestrator records the misses.
"""
from __future__ import annotations

import re
from urllib.parse import quote

from ._common import (base_record, claim, http_get, slugify_for_url, strip_html,
                      study, warn)

SUPPORTED_QUERY = "search"
SOURCE_KEY = "ods"
SOURCE_LABEL = "NIH Office of Dietary Supplements"
BASE_URL = "https://ods.od.nih.gov/factsheets/{slug}-HealthProfessional/"

# A small map of known aliases — data.js name -> ODS slug. Extends as we discover them.
# Keys match data.js `n:` values; values are the ODS URL slug.
ALIAS_TO_SLUG: dict[str, str] = {
    "Vitamin D3": "VitaminD",
    "Vitamin B12": "VitaminB12",
    "Vitamin B1 (Thiamine)": "Thiamin",
    "Riboflavin (Vitamin B2)": "Riboflavin",
    "Niacin (Vitamin B3)": "Niacin",
    "Vitamin B6 (P5P)": "VitaminB6",
    "Folate (5-MTHF)": "Folate",
    "Folic acid (synthetic)": "Folate",
    "Vitamin A": "VitaminA",
    "Vitamin C": "VitaminC",
    "Vitamin E": "VitaminE",
    "Vitamin K2 (MK-7)": "VitaminK",
    "Calcium": "Calcium",
    "Iron": "Iron",
    "Zinc": "Zinc",
    "Magnesium": "Magnesium",
    "Iodine": "Iodine",
    "Selenium": "Selenium",
    "Choline": "Choline",
    "Omega-3 (EPA/DHA)": "Omega3FattyAcids",
    "Probiotics": "Probiotics",
    "Melatonin": "Melatonin",
    "Ashwagandha (KSM-66)": "Ashwagandha",
    "Echinacea purpurea": "Echinacea",
    "Garlic": "Garlic",
    "Ginkgo biloba": "Ginkgo",
    "Saw palmetto (Serenoa repens)": "SawPalmetto",
    "St. John's Wort": "StJohnsWort",
    "Turmeric / Curcumin": "Turmeric",
    "Curcumin (bioavailable form)": "Turmeric",
    "Valerian root": "Valerian",
    "Coenzyme Q10": "CoenzymeQ10",
    "CoQ10 (Ubiquinol)": "CoenzymeQ10",
}


def _resolve_slug(name: str) -> str | None:
    if name in ALIAS_TO_SLUG:
        return ALIAS_TO_SLUG[name]
    # Try a generated slug as a fallback. ODS uses PascalCase without spaces.
    slug = slugify_for_url(name)
    return slug or None


def _extract_section(html: str, header_re: str, max_chars: int = 1200) -> str:
    """Find an <h2> or <h3> matching `header_re` and return the cleaned text of the
    first paragraph or two below it. Returns '' if not found."""
    pat = re.compile(
        r"<h[23][^>]*>\s*" + header_re + r"\s*</h[23]>(.*?)(?=<h[23]|<footer|$)",
        re.IGNORECASE | re.DOTALL,
    )
    m = pat.search(html)
    if not m:
        return ""
    cleaned = strip_html(m.group(1))
    return cleaned[:max_chars].strip()


def _extract_last_reviewed(html: str) -> str | None:
    m = re.search(r"Page last (?:updated|reviewed):?\s*</[^>]+>\s*(?:<[^>]+>)?\s*([A-Z][a-z]+\s+\d{1,2},\s+\d{4})", html)
    if m:
        return m.group(1)
    m = re.search(r"(?:last\s+(?:updated|reviewed))[^A-Z0-9]*([A-Z][a-z]+\s+\d{1,2},\s+\d{4})", html, re.I)
    return m.group(1) if m else None


def _extract_top_references(html: str, limit: int = 5) -> list[dict]:
    """Find the references list. Returns a few cited studies (title only — ODS doesn't
    expose DOIs or PMIDs in a structured way). The daily review pipeline is expected
    to look up funder/COI separately via PubMed once we have the title."""
    out: list[dict] = []
    # ODS references are typically in <ol> with id="references" or a class containing 'reference'
    for marker in (r'id=["\']references["\']', r'class="references"', r'<h2[^>]*>References'):
        m = re.search(marker + r"(.*?)(?=<h2|$)", html, re.IGNORECASE | re.DOTALL)
        if m:
            body = m.group(1) if marker.startswith(r"<h2") else html[m.end():]
            li_re = re.compile(r"<li[^>]*>(.*?)</li>", re.DOTALL)
            for li in li_re.findall(body)[:limit]:
                txt = strip_html(li)
                if not txt:
                    continue
                # Try to capture year
                yr = None
                ym = re.search(r"\b(19|20)\d{2}\b", txt)
                if ym:
                    try:
                        yr = int(ym.group(0))
                    except ValueError:
                        pass
                out.append(study(title=txt[:300], year=yr))
            if out:
                return out
    return out


def fetch(supplement_name: str, *, since: str | None = None) -> list[dict]:
    slug = _resolve_slug(supplement_name)
    if not slug:
        return []
    url = BASE_URL.format(slug=quote(slug))
    try:
        body = http_get(url, accept="text/html")
    except RuntimeError as e:
        warn(f"ods fetch {url} failed: {e}")
        return []
    html = body.decode("utf-8", errors="replace")
    # 404s often return a real page with "Page Not Found" — sanity check by title.
    if "<title>Page Not Found" in html or "Sorry, the page" in html.lower():
        return []
    intro = _extract_section(html, r"Introduction|What is [^?<]+?\??", max_chars=1500)
    intakes = _extract_section(html, r"Recommended Intakes?|Intakes? of [^<]+", max_chars=1200)
    risks = _extract_section(html, r"Health Risks from .*|Interactions with Medications", max_chars=1200)
    summary_parts = [p for p in (intro, intakes) if p]
    summary = " ".join(summary_parts)[:2000]
    claims: list[dict] = []
    if intakes:
        claims.append(claim(intakes[:400], evidence_grade="regulator",
                            context="NIH ODS recommended intake / RDA section"))
    if risks:
        claims.append(claim(risks[:400], evidence_grade="regulator",
                            context="NIH ODS health risks / drug interactions section"))
    return [base_record(
        supplement=supplement_name,
        source_key=SOURCE_KEY,
        source_label=SOURCE_LABEL,
        source_url=url,
        last_updated=_extract_last_reviewed(html),
        evidence_summary=summary,
        key_claims=claims,
        cited_studies=_extract_top_references(html),
    )]
