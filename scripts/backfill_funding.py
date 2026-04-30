#!/usr/bin/env python3
"""
Backfill funding-source / COI metadata onto existing citations in index.html.
Phase 3 / Item #3 of IMPLEMENTATION_ROADMAP.md.

For every citation `<li>` that carries a PMID (or set of PMIDs) in its text, we:
1. Query PubMed eUtils for the article's <GrantList> and <CoiStatement>
2. Auto-classify funder_type as public / industry / mixed / nonprofit / none_disclosed
3. Patch the <li> with data-funder, data-funder-type, data-coi attributes (matching
   the convention in `docs/citation-schema.md`)

Usage:
    python3 scripts/backfill_funding.py                  # full corpus
    python3 scripts/backfill_funding.py --limit 50       # sample
    python3 scripts/backfill_funding.py --dry-run        # don't patch index.html
    python3 scripts/backfill_funding.py --resume         # resume from last checkpoint

Checkpoints to /tmp/funding_backfill_state.json so a long run can pick up where it
left off.

Coverage target (per IMPLEMENTATION_ROADMAP.md): ≥90% of cited PMIDs populated, every
Tier 1 entry having at least one public/nonprofit-funded confirmatory citation.
"""
from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
CHECKPOINT = Path("/tmp/funding_backfill_state.json")

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
BATCH = 50  # PubMed allows up to 200 PMIDs per efetch request, but smaller batches are safer
SLEEP = 0.4

# ── Funder classification ────────────────────────────────────────────────────
# These pattern lists are intentionally conservative. False classifications are flagged
# as 'mixed' or 'none_disclosed' rather than being forced into a confident category.

PUBLIC_PATTERNS = [
    # US federal
    r"\bNIH\b", r"\bNational Institutes? of Health\b", r"\bNCI\b", r"\bNHLBI\b",
    r"\bNIDDK\b", r"\bNIA\b", r"\bNIMH\b", r"\bNINDS\b", r"\bNIAID\b", r"\bNIAMS\b",
    r"\bNICHD\b", r"\bNIDA\b", r"\bNIEHS\b", r"\bNIDCD\b",
    r"\bNSF\b", r"\bNational Science Foundation\b",
    r"\bUSDA\b", r"\bUS Department of Agriculture\b",
    r"\bDepartment of Defense\b", r"\bDoD\b",
    r"\bDepartment of Energy\b", r"\bDoE\b",
    r"\bVA Medical\b", r"\bVeterans Affairs\b",
    r"\bCDC\b", r"\bCenters for Disease Control\b",
    # UK & EU public
    r"\bMRC\b", r"\bMedical Research Council\b",
    r"\bNIHR\b", r"\bNational Institute for Health Research\b",
    r"\bNHS\b", r"\bNational Health Service\b",
    r"\bDFG\b", r"\bDeutsche Forschungsgemeinschaft\b",
    r"\bCNRS\b", r"\bINSERM\b", r"\bMax Planck\b",
    r"\bEuropean Commission\b", r"\bHorizon (2020|Europe)\b", r"\bERC\b",
    # Other countries
    r"\bCIHR\b", r"\bCanadian Institutes of Health Research\b",
    r"\bNHMRC\b", r"\bNational Health and Medical Research Council\b",  # Australia
    r"\bChinese Academy of Sciences\b", r"\bNational Natural Science Foundation of China\b", r"\bNSFC\b",
    r"\bJSPS\b", r"\bJapan Society for the Promotion of Science\b",
    # Generic government-affiliated patterns
    r"\bgovernment\b", r"\bministry of health\b", r"\bministry of science\b",
    # University internal grants — heuristic; adjusted by the 'industry' patterns
    r"\bUniversity\b", r"\buniversity\b", r"\bSchool of Medicine\b",
]

NONPROFIT_PATTERNS = [
    r"\bWellcome (Trust|Foundation)\b",
    r"\bAmerican Heart Association\b", r"\bAHA grant\b",
    r"\bAmerican Cancer Society\b", r"\bACS Research\b",
    r"\bWorld Cancer Research Fund\b", r"\bWCRF\b",
    r"\bMichael J\.? Fox Foundation\b",
    r"\bAlzheimer'?s Association\b",
    r"\bJuvenile Diabetes Research Foundation\b", r"\bJDRF\b",
    r"\bGates Foundation\b", r"\bBill and Melinda Gates\b",
    r"\bHoward Hughes Medical Institute\b", r"\bHHMI\b",
    r"\bChan Zuckerberg\b", r"\bCZI\b",
]

INDUSTRY_PATTERNS = [
    # Pharmaceutical companies
    r"\bPfizer\b", r"\bBayer\b", r"\bNovartis\b", r"\bMerck\b", r"\bAstraZeneca\b",
    r"\bGlaxoSmithKline\b", r"\bGSK\b", r"\bSanofi\b", r"\bAbbVie\b", r"\bRoche\b",
    r"\bGenentech\b", r"\bEli Lilly\b", r"\bBoehringer\b", r"\bTakeda\b",
    r"\bAstellas\b", r"\bAmgen\b", r"\bGilead\b", r"\bRegeneron\b", r"\bModerna\b",
    r"\bBiogen\b", r"\bCelgene\b", r"\bShire\b", r"\bBristol-?Myers Squibb\b", r"\bBMS\b",
    # Supplement / nutraceutical brands
    r"\bPharmavite\b", r"\bThorne\b", r"\bNOW Foods\b", r"\bDouglas Laboratories\b",
    r"\bOrthomolecular\b", r"\bPure Encapsulations\b", r"\bMetagenics\b", r"\bDesignsForHealth\b",
    r"\bNutraMax\b", r"\bGNC\b", r"\bHerbalife\b", r"\bAmway\b", r"\bShaklee\b",
    r"\bUSANA\b", r"\bIsagenix\b", r"\bUSAna\b",
    # Food/nutrition industry with research arms
    r"\bNestl[eé] Health Sciences\b", r"\bDanone Nutricia\b", r"\bAbbott Nutrition\b",
    r"\bMead Johnson\b", r"\bDSM\b", r"\bBASF\b",
    # Specific supplement-component companies
    r"\bChromaDex\b",  # NR
    r"\bElysium Health\b",  # NR
    r"\bMetroBiotech\b", r"\bAlive By Science\b",  # NMN
    r"\bIxchel\b", r"\bSpecnova\b", r"\bSabinsa\b", r"\bIndena\b",
    r"\bRettenmaier\b", r"\bGlanbia\b",
    r"\bInternational Flora Technologies\b",
]

PUBLIC_RE = re.compile("|".join(PUBLIC_PATTERNS), re.IGNORECASE)
NONPROFIT_RE = re.compile("|".join(NONPROFIT_PATTERNS), re.IGNORECASE)
INDUSTRY_RE = re.compile("|".join(INDUSTRY_PATTERNS), re.IGNORECASE)


def classify_funders(text: str) -> tuple[str, str]:
    """(funder_type, condensed_funder_string) given a concatenated funder string."""
    if not text or not text.strip():
        return ("none_disclosed", "")
    # Order matters: industry takes precedence on mixed disclosures (conservative).
    has_industry = bool(INDUSTRY_RE.search(text))
    has_public = bool(PUBLIC_RE.search(text)) and not (
        # University patterns are weak — don't claim 'public' on university name alone if industry is also present
        re.fullmatch(r"\s*[Uu]niversity[^,;]*\s*", text or "")
    )
    has_nonprofit = bool(NONPROFIT_RE.search(text))
    if has_industry and (has_public or has_nonprofit):
        ftype = "mixed"
    elif has_industry:
        ftype = "industry"
    elif has_nonprofit and not has_public:
        ftype = "nonprofit"
    elif has_public:
        ftype = "public"
    else:
        ftype = "none_disclosed"
    # Condense funder string for the data-funder attribute
    condensed = re.sub(r"\s+", " ", text)[:250].strip()
    return (ftype, condensed)


# ── PMID extraction ──────────────────────────────────────────────────────────

PMID_LI_RE = re.compile(
    r"(<li[^>]*>)([\s\S]*?</li>)",
    re.IGNORECASE,
)
PMID_RE = re.compile(r"\bPMID[: ]*(\d{6,9})\b")


def extract_pmids_from_html(html: str) -> dict[str, set[str]]:
    """Return PMID → set(li_outer_html) so we can patch the right li elements."""
    out = defaultdict(set)
    for li_open, li_inner in PMID_LI_RE.findall(html):
        m = PMID_RE.findall(li_inner)
        if not m:
            continue
        # Use the first PMID as the representative; multi-PMID lis are rare
        pmid = m[0]
        full_li = li_open + li_inner
        out[pmid].add(full_li)
    return out


# ── PubMed efetch ────────────────────────────────────────────────────────────

def fetch_pubmed_xml(pmids: list[str]) -> bytes:
    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "tool": "supplement-score-funding-backfill",
        "email": "yves@blueprintbuilds.com",
    }
    url = EUTILS + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "supplement-score-backfill/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def parse_pubmed_xml(xml_bytes: bytes) -> dict[str, dict]:
    """Return PMID → {grant_text, coi_text}."""
    out = {}
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        print(f"  [warn] xml parse error: {e}", file=sys.stderr)
        return out
    for art in root.findall(".//PubmedArticle"):
        pmid_el = art.find(".//PMID")
        if pmid_el is None or not pmid_el.text:
            continue
        pmid = pmid_el.text.strip()
        # Concatenate every Agency element under <GrantList>/<Grant>
        grants = []
        for g in art.findall(".//GrantList/Grant"):
            ag = g.find("Agency")
            country = g.find("Country")
            grant_id = g.find("GrantID")
            parts = [el.text for el in (ag, grant_id, country) if el is not None and el.text]
            grants.append(" / ".join(parts))
        # Some records use <FundingSource>/<FundingAgency>
        for fa in art.findall(".//FundingAgency"):
            if fa.text:
                grants.append(fa.text.strip())
        coi_el = art.find(".//CoiStatement")
        coi_text = (coi_el.text or "").strip() if coi_el is not None else ""
        out[pmid] = {
            "grant_text": "; ".join(grants),
            "coi_text": coi_text,
        }
    return out


# ── COI heuristic ────────────────────────────────────────────────────────────

COI_AFFIRMATIVE = re.compile(
    r"\b(declares?|disclos(?:e[sd]?|ure)|reports?|received|consultancy|consultant|grant|honoraria|stock|equity|patent|royalt|advisor|advisory|speakers? bureau|employee|paid by)\b",
    re.IGNORECASE,
)
COI_NEGATIVE = re.compile(
    r"\bno (?:competing|conflict)\b|\bnone declared\b|\bnone to declare\b|\bauthors? declare no\b|\bno relevant\b",
    re.IGNORECASE,
)


def classify_coi(text: str) -> bool:
    if not text:
        return False
    if COI_NEGATIVE.search(text):
        return False
    if COI_AFFIRMATIVE.search(text):
        return True
    return False


# ── Main ─────────────────────────────────────────────────────────────────────

def annotate_review_docs(classified: dict[str, dict], log) -> int:
    """For each markdown file in reviews/, find PMID references in prose and add a
    funder-tag annotation (HTML comment) right after the PMID text. Returns count of
    annotations made."""
    reviews_dir = ROOT / "reviews"
    if not reviews_dir.exists():
        return 0
    count = 0
    for md_path in sorted(reviews_dir.glob("*.md")):
        text = md_path.read_text(encoding="utf-8")
        new_text = text
        # Find PMID mentions like "PMID 12345678" or "PMID: 12345678"
        for m in re.finditer(r"\bPMID[: ]+(\d{6,9})\b", text):
            pmid = m.group(1)
            cls = classified.get(pmid)
            if not cls:
                continue
            # Already annotated? Look for `[funder:...]` within 50 chars after this PMID
            after = new_text[m.end():m.end() + 80]
            if "[funder:" in after:
                continue
            tag = f" [funder: {cls.get('funder_type','none_disclosed')}"
            if cls.get("coi"):
                tag += " · COI"
            tag += "]"
            # Insert tag after the PMID
            anchor = m.group(0)
            insertion = anchor + tag
            new_text = new_text.replace(anchor, insertion, 1)
            count += 1
        if new_text != text:
            md_path.write_text(new_text, encoding="utf-8")
    return count


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, help="Process only first N unique PMIDs.")
    p.add_argument("--dry-run", action="store_true", help="Don't patch index.html, only report.")
    p.add_argument("--resume", action="store_true", help="Resume from /tmp checkpoint.")
    p.add_argument("--annotate-reviews", action="store_true",
                   help="Also annotate reviews/*.md files with funder tags inline.")
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args()

    log = (lambda *a, **k: None) if args.quiet else (lambda *a, **k: print(*a, **k, file=sys.stderr))

    today = datetime.date.today().isoformat()
    html = INDEX.read_text(encoding="utf-8")
    pmid_to_lis = extract_pmids_from_html(html)
    pmids = sorted(pmid_to_lis.keys())
    log(f"Found {len(pmids)} unique PMIDs across {sum(len(v) for v in pmid_to_lis.values())} <li> elements")

    classified: dict[str, dict] = {}
    if args.resume and CHECKPOINT.exists():
        classified = json.loads(CHECKPOINT.read_text())
        log(f"Resumed: {len(classified)} PMIDs already classified")
        pmids = [p for p in pmids if p not in classified]
    if args.limit:
        pmids = pmids[: args.limit]
        log(f"Limited to first {len(pmids)} unclassified PMIDs")

    # Batch through eutils
    for i in range(0, len(pmids), BATCH):
        chunk = pmids[i : i + BATCH]
        log(f"  [{i+1:4d}-{i+len(chunk):4d} / {len(pmids)}] fetching from PubMed...")
        try:
            xml = fetch_pubmed_xml(chunk)
            parsed = parse_pubmed_xml(xml)
        except (urllib.error.URLError, TimeoutError) as e:
            log(f"  [warn] batch failed: {e}; skipping")
            continue
        for pmid in chunk:
            data = parsed.get(pmid)
            if not data:
                classified[pmid] = {"funder_type": "none_disclosed", "funder": "", "coi": False}
                continue
            ftype, condensed = classify_funders(data["grant_text"])
            classified[pmid] = {
                "funder_type": ftype,
                "funder": condensed,
                "coi": classify_coi(data["coi_text"]),
            }
        # Checkpoint after each batch
        CHECKPOINT.write_text(json.dumps(classified, indent=2))
        time.sleep(SLEEP)

    # Patch index.html if not --dry-run
    patched_count = 0
    if not args.dry_run:
        new_html = html
        for pmid, lis in pmid_to_lis.items():
            cls = classified.get(pmid)
            if not cls:
                continue
            for li in lis:
                # Skip if already patched
                if "data-funder-type=" in li:
                    continue
                # Insert attributes into the opening <li ...> tag
                m = re.match(r"<li([^>]*)>", li, re.IGNORECASE)
                if not m:
                    continue
                attrs = m.group(1)
                attrs += (
                    ' data-funder-type="' + cls["funder_type"] + '"' +
                    ' data-funder="' + cls["funder"].replace('"', '&quot;') + '"' +
                    ' data-coi="' + ("true" if cls["coi"] else "false") + '"'
                )
                new_li_open = f"<li{attrs}>"
                new_li = re.sub(r"<li[^>]*>", new_li_open, li, count=1)
                if new_li != li and li in new_html:
                    new_html = new_html.replace(li, new_li, 1)
                    patched_count += 1
        if patched_count > 0:
            backup = INDEX.with_suffix(".html.bak-funding-" + today.replace("-", ""))
            backup.write_text(html, encoding="utf-8")
            INDEX.write_text(new_html, encoding="utf-8")
            log(f"\nWrote {patched_count} patched <li> elements to {INDEX}")
            log(f"Backup: {backup.name}")

    # Aggregate stats for the report
    type_counts = defaultdict(int)
    for cls in classified.values():
        type_counts[cls["funder_type"]] += 1
    coi_count = sum(1 for cls in classified.values() if cls.get("coi"))

    report_path = ROOT / f"reviews/funding-backfill-{today}.md"
    lines = []
    lines.append(f"# Funding/COI Backfill — {today}\n")
    lines.append(f"**Phase:** 3 / Item #3 of IMPLEMENTATION_ROADMAP.md")
    lines.append(f"**PMIDs classified:** {len(classified)}")
    lines.append(f"**`<li>` elements patched in index.html:** {patched_count}{' (dry-run)' if args.dry_run else ''}")
    lines.append(f"**Backup:** index.html.bak-funding-{today.replace('-','')}")
    lines.append("")
    lines.append("## Funder-type distribution")
    lines.append("")
    lines.append("| funder_type | count | % |")
    lines.append("|---|---:|---:|")
    total = max(1, len(classified))
    for ft in ("public", "nonprofit", "mixed", "industry", "none_disclosed"):
        n = type_counts[ft]
        lines.append(f"| {ft} | {n} | {n*100/total:.1f}% |")
    lines.append("")
    lines.append(f"**COI disclosed:** {coi_count} ({coi_count*100/total:.1f}%)")
    lines.append("")
    lines.append("## Industry-funded citations needing manual review")
    lines.append("")
    industry = [(p, cls) for p, cls in classified.items() if cls["funder_type"] in ("industry", "mixed")]
    industry.sort(key=lambda x: x[0])
    if industry:
        lines.append("| PMID | funder_type | Funder string |")
        lines.append("|---|---|---|")
        for p, cls in industry[:50]:
            f = cls["funder"][:120].replace("|", "\\|")
            lines.append(f"| {p} | {cls['funder_type']} | {f} |")
        if len(industry) > 50:
            lines.append(f"\n_(showing first 50 of {len(industry)})_")
    else:
        lines.append("None.")
    lines.append("")
    lines.append("## Methodology notes")
    lines.append("")
    lines.append("- Funder classification uses the regex tables in `scripts/backfill_funding.py`.")
    lines.append("- Industry takes precedence on ambiguous cases (conservative): a paper with NIH + Pfizer support is classified `mixed`, not `public`.")
    lines.append("- COI is `true` only when an affirmative disclosure pattern matches and no negative pattern (\"none declared\") is present.")
    lines.append("- Where PubMed returns no GrantList element, funder_type is `none_disclosed` — not the same as confirming public funding.")
    lines.append("")
    lines.append("## Next steps")
    lines.append("")
    lines.append("1. Review the industry-funded citations above. Where a Tier 1 supplement has only industry-funded confirmatory studies, demote to Tier 2 per the methodology.")
    lines.append("2. Re-run with `--limit` removed to process the remaining PMIDs (use `--resume` to skip already-classified ones).")
    lines.append("3. Re-run the daily article-review SKILL after this backfill completes — it should respect the new `data-funder-type` attributes when computing tier calls.")

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines), encoding="utf-8")
    log(f"\nWrote {report_path}")

    # Optional: annotate review docs with funder tags
    if args.annotate_reviews and not args.dry_run:
        ann_count = annotate_review_docs(classified, log)
        log(f"Annotated {ann_count} PMID mentions in reviews/*.md with funder tags")

    print(report_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
