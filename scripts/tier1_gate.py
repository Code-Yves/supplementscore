#!/usr/bin/env python3
"""
Tier 1 confirmation gate — Phase 3 follow-up of IMPLEMENTATION_ROADMAP.md.

Enforces the methodology page rule: "Tier 1 calls require at least one `public` or
`nonprofit`-funded confirmatory study. Industry-only evidence cannot drive a Tier 1 call."

For every supplement with t='t1' in data.js, this script:
1. Walks the articles linked to it via ARTICLE_MAP
2. Pulls all PMIDs referenced in those articles' source <ol> blocks
3. Looks up each PMID's funder_type (set by scripts/backfill_funding.py)
4. Fails the gate if every classified citation is industry / none_disclosed

Output: reviews/tier1-gate-{date}.md — actionable list of Tier 1 entries that don't
yet meet the methodology requirement.

Coverage: depends on the funding backfill having run. PMIDs without funder_type
classification are treated as "unknown" and counted separately.

Usage:
    python3 scripts/tier1_gate.py
    python3 scripts/tier1_gate.py --strict  # treat none_disclosed the same as industry
"""
from __future__ import annotations

import argparse
import datetime
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_tier1_supps(data_js: str) -> list[dict]:
    """Pull all entries with t='t1' from the S array."""
    m = re.search(r"^const S=\[", data_js, re.MULTILINE)
    if not m:
        return []
    body = data_js[m.end():]
    end = body.find("\n];\n")
    if end < 0:
        end = body.find("];")
    body = body[:end]
    out = []
    for line in body.split("\n"):
        line = line.strip().rstrip(",")
        if not line.startswith("{") or "t:'t1'" not in line:
            continue
        nm = re.search(r"\bn:'((?:[^'\\]|\\.)*)'", line)
        if not nm:
            continue
        out.append({
            "n": nm.group(1).replace("\\'", "'"),
            "tag": (re.search(r"\btag:'((?:[^'\\]|\\.)*)'", line) or [None, ""])[1] if re.search(r"\btag:'", line) else "",
        })
    return out


def load_article_map(data_js: str) -> dict[str, list[int]]:
    """Map supplement_name -> list of article ids."""
    m = re.search(r"^const ARTICLE_MAP=\{", data_js, re.MULTILINE)
    if not m:
        return {}
    body = data_js[m.end():]
    end = body.find("\n};\n")
    body = body[:end]
    out = defaultdict(list)
    for line in body.split("\n"):
        nm = re.match(r"^\s*'((?:[^'\\]|\\.)*)':\[", line)
        if not nm:
            continue
        name = nm.group(1).replace("\\'", "'")
        for am in re.finditer(r"\{id:(\d+),", line):
            out[name].append(int(am.group(1)))
    return out


def load_article_funding_lookup(html: str) -> dict[int, dict[str, str]]:
    """For each article id, return {pmid: funder_type} for citations within that article."""
    out: dict[int, dict[str, str]] = {}
    # Walk article-N divs and inside each, scrape <li data-funder-type="..."> with their PMIDs
    for m in re.finditer(r'id="article-(\d+)"([\s\S]*?)(?=<!--\s*end article-\1\s*-->|<!--\s*ARTICLE\s+\d+\s*-->|$)', html):
        aid = int(m.group(1))
        block = m.group(2)
        cites = {}
        for li_m in re.finditer(
            r'<li[^>]*data-funder-type="([^"]+)"[^>]*>([\s\S]*?)</li>',
            block,
        ):
            ftype = li_m.group(1)
            body = li_m.group(2)
            for pmid in re.findall(r"\bPMID[: ]*(\d+)\b", body):
                cites[pmid] = ftype
        out[aid] = cites
    return out


def gate(supp: dict, articles: list[int], article_funding: dict[int, dict[str, str]],
         strict: bool = False) -> dict:
    """Return verdict for this supplement: {pass, total_classified, by_type[], notes}."""
    by_type = defaultdict(int)
    total_pmids = 0
    classified_pmids = 0
    for aid in articles:
        cites = article_funding.get(aid, {})
        for pmid, ftype in cites.items():
            total_pmids += 1
            classified_pmids += 1
            by_type[ftype] += 1
    confirmatory_types = {"public", "nonprofit"}
    if strict:
        # In strict mode, none_disclosed also counts against the gate
        bad_types = {"industry", "mixed", "none_disclosed"}
    else:
        bad_types = {"industry"}
    has_confirmatory = any(by_type.get(ft, 0) > 0 for ft in confirmatory_types)
    only_bad = (classified_pmids > 0 and
                not has_confirmatory and
                all(by_type.get(ft, 0) == 0 for ft in confirmatory_types) and
                sum(by_type.get(ft, 0) for ft in bad_types) == classified_pmids)
    return {
        "pass": has_confirmatory or classified_pmids == 0,  # unclassified gives benefit of doubt
        "has_confirmatory": has_confirmatory,
        "only_bad": only_bad,
        "classified_pmids": classified_pmids,
        "by_type": dict(by_type),
        "articles": articles,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--strict", action="store_true", help="Treat none_disclosed as failing.")
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args()

    log = (lambda *a, **k: None) if args.quiet else (lambda *a, **k: print(*a, **k, file=sys.stderr))

    data_js = (ROOT / "data.js").read_text(encoding="utf-8")
    html = (ROOT / "index.html").read_text(encoding="utf-8")

    tier1 = load_tier1_supps(data_js)
    article_map = load_article_map(data_js)
    article_funding = load_article_funding_lookup(html)

    log(f"Loaded {len(tier1)} Tier 1 supplements")
    log(f"Loaded ARTICLE_MAP for {len(article_map)} supplement names")
    log(f"Loaded funding metadata for {len(article_funding)} articles "
        f"(covering {sum(len(v) for v in article_funding.values())} PMIDs)")

    failed: list[tuple[dict, dict]] = []
    needs_more_data: list[tuple[dict, dict]] = []
    passed: list[tuple[dict, dict]] = []
    no_articles: list[dict] = []

    for s in tier1:
        articles = article_map.get(s["n"], [])
        if not articles:
            no_articles.append(s)
            continue
        verdict = gate(s, articles, article_funding, strict=args.strict)
        if verdict["only_bad"]:
            failed.append((s, verdict))
        elif verdict["classified_pmids"] == 0:
            needs_more_data.append((s, verdict))
        elif verdict["has_confirmatory"]:
            passed.append((s, verdict))
        else:
            # Has classified citations but none confirmatory and not all bad — borderline
            failed.append((s, verdict))

    today = datetime.date.today().isoformat()
    out = []
    out.append(f"# Tier 1 Confirmation Gate — {today}\n")
    out.append(f"**Phase:** 3 follow-up of IMPLEMENTATION_ROADMAP.md")
    out.append(f"**Rule (from methodology.html):** Tier 1 calls require at least one cited PMID with funder_type ∈ {{public, nonprofit}}. Industry-only evidence cannot drive a Tier 1 call.")
    out.append(f"**Mode:** {'strict (none_disclosed counts against)' if args.strict else 'lenient (none_disclosed gives benefit of doubt)'}")
    out.append("")
    out.append(f"- Tier 1 supplements scanned: **{len(tier1)}**")
    out.append(f"- Pass (have ≥1 public/nonprofit citation): **{len(passed)}**")
    out.append(f"- Fail (industry-only or no confirmatory): **{len(failed)}**")
    out.append(f"- Insufficient data (no PMIDs in linked articles have funder_type yet — run `scripts/backfill_funding.py --resume`): **{len(needs_more_data)}**")
    out.append(f"- No mapped articles (cannot evaluate): **{len(no_articles)}**")
    out.append("")

    if failed:
        out.append("## ⚠️ Tier 1 entries failing the gate\n")
        out.append("Each entry below has classified PMIDs but none of them are public or nonprofit-funded. Per the methodology, **demote to Tier 2** unless additional evidence is added.\n")
        out.append("| Supplement | Classified PMIDs | By type | Linked articles |")
        out.append("|---|---:|---|---|")
        for s, v in sorted(failed, key=lambda x: x[0]["n"]):
            by_type_str = ", ".join(f"{ft}={n}" for ft, n in sorted(v["by_type"].items()))
            arts = ", ".join("#" + str(a) for a in v["articles"][:6])
            if len(v["articles"]) > 6:
                arts += ", ..."
            out.append(f"| **{s['n']}** | {v['classified_pmids']} | {by_type_str} | {arts} |")
        out.append("")

    if needs_more_data:
        out.append("## Insufficient data — need more funding-source backfill\n")
        out.append("These Tier 1 entries' linked articles have no PMIDs with funder_type populated yet. Resume the funding backfill to evaluate them.\n")
        out.append("| Supplement | Linked articles |")
        out.append("|---|---|")
        for s, v in sorted(needs_more_data, key=lambda x: x[0]["n"])[:30]:
            arts = ", ".join("#" + str(a) for a in v["articles"][:6])
            if len(v["articles"]) > 6:
                arts += ", ..."
            out.append(f"| {s['n']} | {arts} |")
        if len(needs_more_data) > 30:
            out.append(f"\n_(showing first 30 of {len(needs_more_data)})_")
        out.append("")

    if passed:
        out.append(f"## ✓ Tier 1 entries passing the gate ({len(passed)})\n")
        out.append("These have at least one cited PMID with funder_type ∈ {public, nonprofit}.\n")
        # Compact list
        out.append(", ".join(s["n"] for s, _ in sorted(passed, key=lambda x: x[0]["n"])))
        out.append("")

    if no_articles:
        out.append(f"## Tier 1 entries with no mapped articles ({len(no_articles)})\n")
        out.append("These supplement entries don't appear in ARTICLE_MAP. The gate can't evaluate them; consider linking at least one article each.\n")
        out.append(", ".join(s["n"] for s in sorted(no_articles, key=lambda x: x["n"])))
        out.append("")

    out.append("## Next steps\n")
    out.append("1. For each `failed` entry, either find a public/nonprofit-funded confirmatory study OR demote to Tier 2.")
    out.append("2. For each `needs_more_data` entry, run `python3 scripts/backfill_funding.py --resume` to populate funder metadata.")
    out.append("3. Re-run this gate weekly as part of the daily review pipeline (add to `supplement-trending-review` SKILL).")

    out_path = ROOT / f"reviews/tier1-gate-{today}.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(out), encoding="utf-8")
    if not args.quiet:
        print(f"Wrote {out_path}", file=sys.stderr)
        print(f"Pass: {len(passed)}, Fail: {len(failed)}, Needs more data: {len(needs_more_data)}, No articles: {len(no_articles)}", file=sys.stderr)
    print(out_path)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
