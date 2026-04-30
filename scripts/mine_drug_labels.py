#!/usr/bin/env python3
"""
Mine FDA drug labels for supplement interactions across a curated high-value list.
Phase 2 / Item #2 of IMPLEMENTATION_ROADMAP.md.

Different from running `sources/fetch_all.py --source openfda_drugs` (which iterates
alphabetically across all 733 supplements). This script targets supplements most
likely to appear in drug-interactions sections — cardiovascular, anticoagulant,
serotonergic, and Tier 4 safety entries — and writes the aggregated candidate
pairs to a single human-review file.

Usage:
    python3 scripts/mine_drug_labels.py
    python3 scripts/mine_drug_labels.py --output reviews/spl-mining-candidates-{date}.md
    python3 scripts/mine_drug_labels.py --extra "Berberine,Niacin"

Output: a markdown file at reviews/spl-mining-candidates-YYYY-MM-DD.md listing every
candidate drug-supplement pair with the FDA label snippet, the heuristic severity,
and a checkbox for human review. Pairs that already exist in DRUG_INTERACTIONS.pairs
in app.js are flagged so reviewers don't re-add them.
"""
from __future__ import annotations

import argparse
import datetime
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sources.adapters import openfda_drugs

# Curated list — supplements that historically appear in drug-interactions sections.
# Anchored on bleeding, serotonergic, hepatic, mineral-absorption, and Tier 4 safety.
# Kept to ~18 entries so a single run fits in <40s; expand via --extra or repeat runs.
CURATED = [
    # Bleeding / anticoagulant
    "Vitamin K1 (Phylloquinone)",
    "Omega-3 (EPA/DHA)",
    "Curcumin (bioavailable form)",
    "Vitamin E (mixed tocopherols)",
    # Serotonergic
    "Tryptophan",
    "SAMe (S-Adenosyl-L-Methionine)",
    # Hepatic / metabolic
    "Niacin (Vitamin B3)",
    "Milk thistle (Silymarin)",
    # Mineral / absorption interference
    "Calcium",
    "Iron",
    "Magnesium",
    "Zinc",
    # Thyroid
    "Iodine",
    # Other commonly-cited in labels
    "CoQ10 (Ubiquinol)",
    "Vitamin B12",
    "Folate (5-MTHF)",
    "Vitamin D3",
    "Quercetin",
]


def _existing_pairs(app_js_path: Path) -> set[tuple[str, str]]:
    """Pull the {drug, supp} tuples already in DRUG_INTERACTIONS.pairs so the report
    can flag duplicates."""
    src = app_js_path.read_text(encoding="utf-8")
    out = set()
    for m in re.finditer(
        r"\{drug:'([^']+)',supp:'((?:[^'\\]|\\.)*)',severity:'([^']+)'",
        src,
    ):
        drug, supp, _sev = m.groups()
        supp = supp.replace("\\'", "'")
        out.add((drug.lower(), supp))
    return out


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--output", help="Output file path. Default: reviews/spl-mining-candidates-{date}.md")
    p.add_argument("--extra", help="Comma-separated extra supplement names to include.")
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args()

    log = (lambda *a, **k: None) if args.quiet else (lambda *a, **k: print(*a, **k, file=sys.stderr))

    today = datetime.date.today().isoformat()
    out_path = Path(args.output) if args.output else ROOT / f"reviews/spl-mining-candidates-{today}.md"

    targets = list(CURATED)
    if args.extra:
        for n in args.extra.split(","):
            n = n.strip()
            if n and n not in targets:
                targets.append(n)

    existing = _existing_pairs(ROOT / "app.js")
    log(f"Mining {len(targets)} supplements against openFDA drug labels...")
    log(f"({len(existing)} drug-supplement pairs already in DRUG_INTERACTIONS — will be flagged)")

    all_candidates: list[dict] = []
    counts_per_supp: dict[str, int] = {}
    for i, name in enumerate(targets, 1):
        try:
            recs = openfda_drugs.fetch(name)
        except Exception as e:
            log(f"  [{i:3d}/{len(targets)}] {name[:50]:50s} ERR: {e}")
            continue
        candidates = [r for r in recs if r.get("_kind") == "drug_supp_candidate"]
        counts_per_supp[name] = len(candidates)
        if candidates:
            log(f"  [{i:3d}/{len(targets)}] {name[:50]:50s} -> {len(candidates)} candidate(s)")
            for c in candidates:
                c["_already_in_pairs"] = (c["drug_generic"].lower(), name) in existing
            all_candidates.extend(candidates)
        else:
            log(f"  [{i:3d}/{len(targets)}] {name[:50]:50s} -> none")
        time.sleep(0.1)  # be polite to openFDA (light sleep — openFDA quota is 1k/day per IP)

    # Group candidates by severity for the review report
    by_severity = {"avoid": [], "caution": [], "extra": []}
    for c in all_candidates:
        by_severity.setdefault(c["severity_hint"], []).append(c)

    # Write the markdown review file
    lines = []
    lines.append(f"# SPL Drug-Label Mining — {today}\n")
    lines.append(f"**Phase:** 2 / Item #2 of IMPLEMENTATION_ROADMAP.md")
    lines.append(f"**Source:** openFDA Drug Labels (`sources/adapters/openfda_drugs.py`)")
    lines.append(f"**Targets:** {len(targets)} curated high-value supplements")
    lines.append(f"**Candidate pairs surfaced:** {len(all_candidates)}")
    lines.append(f"**Already in DRUG_INTERACTIONS.pairs:** {sum(1 for c in all_candidates if c.get('_already_in_pairs'))}")
    lines.append(f"**Need review:** {sum(1 for c in all_candidates if not c.get('_already_in_pairs'))}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## How to use this file")
    lines.append("")
    lines.append("Each candidate below is a drug-supplement pair surfaced from FDA's drug-label "
                 "`drug_interactions` section. The severity is heuristic — based on the snippet "
                 "text. **Read the snippet carefully** before promoting to `DRUG_INTERACTIONS.pairs` "
                 "in `app.js`.")
    lines.append("")
    lines.append("Workflow:")
    lines.append("1. Read each candidate's snippet.")
    lines.append("2. If the interaction is real and the severity is right, copy the suggested "
                 "snippet into `DRUG_INTERACTIONS.pairs`.")
    lines.append("3. If the snippet doesn't actually describe an interaction (false positive — "
                 "e.g. the supplement was just mentioned in a list), mark `[skip]`.")
    lines.append("4. If the severity should be different, edit before promoting.")
    lines.append("")
    lines.append("Severity heuristic legend:")
    lines.append("- `avoid`: snippet contains 'contraindicated', 'avoid', 'do not'")
    lines.append("- `caution`: snippet contains 'monitor', 'may increase/decrease', 'interact'")
    lines.append("- `extra`: snippet contains 'depletes', 'reduces absorption', 'increases requirements'")
    lines.append("")
    lines.append("---")
    lines.append("")
    for sev in ("avoid", "caution", "extra"):
        items = by_severity.get(sev, [])
        if not items:
            continue
        sev_label = {"avoid": "AVOID", "caution": "CAUTION", "extra": "EXTRA (drug depletes nutrient)"}[sev]
        lines.append(f"## {sev_label} — {len(items)} candidate(s)")
        lines.append("")
        for c in sorted(items, key=lambda x: (x["supplement"], x["drug_generic"])):
            already = " ✓ already in DRUG_INTERACTIONS" if c.get("_already_in_pairs") else ""
            lines.append(f"- [ ] **{c['drug_generic']}** × **{c['supplement']}**{already}")
            if c.get("drug_brands"):
                lines.append(f"  - brands: {', '.join(c['drug_brands'])}")
            lines.append(f"  - snippet: > {c['snippet'][:600]}")
            lines.append(f"  - SPL set_id: `{c['label_set_id']}`")
            lines.append("")
        lines.append("---")
        lines.append("")

    lines.append("## Per-supplement summary")
    lines.append("")
    lines.append("| Supplement | Candidates |")
    lines.append("|---|---:|")
    for name in targets:
        lines.append(f"| {name} | {counts_per_supp.get(name, 0)} |")
    lines.append("")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")
    log(f"\nWrote {out_path}")
    log(f"Total candidate pairs: {len(all_candidates)}")
    print(out_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
