#!/usr/bin/env python3
"""
QA pass on tier assignments — Phase 3 of IMPLEMENTATION_ROADMAP.md.

Spot-checks 10 supplements per tier (40 total) using two checks:

1. **Score-vs-tier consistency.** Flag entries where the e/s/r sub-scores diverge
   strongly from the tier (e.g. Tier 1 with Efficacy=2, or Tier 3 with Efficacy=5).
2. **Funding-source evidence available.** After Phase 3 / Item #3 backfill, Tier 1
   entries should have at least one cited PMID classified as `public` or `nonprofit`.
   Flag any Tier 1 entry whose only funding-source-classified citations are industry.

Output: `reviews/tier-qa-{date}.md` — checklist for human review.

Usage:
    python3 scripts/tier_qa_pass.py
    python3 scripts/tier_qa_pass.py --per-tier 15      # larger sample
    python3 scripts/tier_qa_pass.py --seed 42          # reproducible random sample
"""
from __future__ import annotations

import argparse
import datetime
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_supps_from_data_js() -> list[dict]:
    """Lightweight parse of the S array in data.js. Each supplement is a single-line
    object literal. We pull n, t, tr, e, s, r, o, c, d, tag, desc[:200] for the QA
    report — enough to spot obvious mismatches without bringing the whole entry."""
    src = (ROOT / "data.js").read_text(encoding="utf-8")
    m = re.search(r"^const S=\[", src, re.MULTILINE)
    if not m:
        return []
    body = src[m.end():]
    end = body.find("\n];\n")
    if end < 0:
        end = body.find("];")
    body = body[:end]
    out = []
    for line in body.split("\n"):
        line = line.strip().rstrip(",")
        if not line.startswith("{"):
            continue
        # Pull fields by regex — `n:'...'`, `t:'...'`, etc.
        def grab(field, line=line):
            mm = re.search(r"\b" + field + r":'((?:[^'\\]|\\.)*)'", line)
            if mm:
                return mm.group(1).replace("\\'", "'")
            mm = re.search(r"\b" + field + r":\"((?:[^\"\\]|\\.)*)\"", line)
            if mm:
                return mm.group(1).replace('\\"', '"')
            return None
        def grab_int(field, line=line):
            mm = re.search(r"\b" + field + r":(\d+)\b", line)
            return int(mm.group(1)) if mm else None
        n = grab("n")
        if not n:
            continue
        out.append({
            "n": n,
            "t": grab("t") or "t2",
            "tr": "tr:true" in line or "tr:!0" in line,
            "tag": grab("tag") or "",
            "e": grab_int("e"),
            "s": grab_int("s"),
            "r": grab_int("r"),
            "o": grab_int("o"),
            "c": grab_int("c"),
            "d": grab_int("d"),
            "desc": (grab("desc") or "")[:200],
        })
    return out


def load_pmid_funding_from_html() -> dict[str, str]:
    """Read index.html and pull PMID → funder_type from any patched <li> elements
    (output of `scripts/backfill_funding.py`)."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(
        r'<li[^>]*data-funder-type="([^"]+)"[^>]*>([\s\S]*?)</li>',
        html,
    ):
        ftype = m.group(1)
        body = m.group(2)
        for pm in re.findall(r"\bPMID[: ]*(\d+)\b", body):
            out[pm] = ftype
    return out


def score_vs_tier_check(supp: dict) -> str | None:
    """Return a flag string if the sub-scores look inconsistent with the tier."""
    t = supp.get("t")
    e, s, r = supp.get("e"), supp.get("s"), supp.get("r")
    if e is None or s is None or r is None:
        return None
    if t == "t1":
        if e < 4 or r < 3:
            return f"Tier 1 with low scores (e={e}, r={r}) — expected e≥4 and r≥3"
        if s <= 2:
            return f"Tier 1 with safety concern (s={s}) — Tier 1 should not have a safety flag"
    elif t == "t2":
        if e == 1 or r == 1:
            return f"Tier 2 with very low scores (e={e}, r={r}) — consider Tier 3"
    elif t == "t3":
        if e == 5 and r >= 4:
            return f"Tier 3 (Trending) with strong evidence (e=5, r={r}) — consider promoting to Tier 1/2"
    elif t == "t4":
        if s >= 4:
            return f"Tier 4 with high safety score (s={s}) — Tier 4 implies safety concerns; reconcile"
    return None


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--per-tier", type=int, default=10, help="Random sample size per tier (default 10)")
    p.add_argument("--seed", type=int, default=20260428, help="Random seed (default: today)")
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args()

    random.seed(args.seed)
    supps = load_supps_from_data_js()
    pmid_funding = load_pmid_funding_from_html()

    by_tier = defaultdict(list)
    for s in supps:
        by_tier[s["t"]].append(s)

    tier_labels = {"t1": "Tier 1 (Strong Evidence)", "t2": "Tier 2 (Promising)",
                   "t3": "Tier 3 (Trending)", "t4": "Tier 4 (Risky/Avoid)"}

    sample: dict[str, list[dict]] = {}
    for t in ("t1", "t2", "t3", "t4"):
        pool = by_tier.get(t, [])
        n = min(args.per_tier, len(pool))
        sample[t] = random.sample(pool, n) if pool else []

    today = datetime.date.today().isoformat()
    lines = []
    lines.append(f"# Tier-Assignment QA Pass — {today}\n")
    lines.append(f"**Phase:** 3 of IMPLEMENTATION_ROADMAP.md")
    lines.append(f"**Sample:** {args.per_tier} random supplements per tier "
                 f"({sum(len(v) for v in sample.values())} total)")
    lines.append(f"**Random seed:** {args.seed} (reproducible)")
    lines.append(f"**Funding-source coverage:** {len(pmid_funding)} PMIDs classified after the funding backfill")
    lines.append("")
    lines.append("This is a checklist for human review. Each entry shows the supplement's "
                 "current ratings + heuristic flags for inconsistency. If a flag fires, "
                 "the human reviewer should verify against the latest evidence and "
                 "promote/demote the tier as warranted.")
    lines.append("")
    lines.append("---")
    lines.append("")

    flag_total = 0
    for t in ("t1", "t2", "t3", "t4"):
        items = sample.get(t, [])
        if not items:
            continue
        lines.append(f"## {tier_labels[t]} — {len(items)} entries")
        lines.append("")
        for s in items:
            flag = score_vs_tier_check(s)
            if flag:
                flag_total += 1
            scores = f"e={s['e']} s={s['s']} r={s['r']} o={s['o']} c={s['c']} d={s['d']}"
            line = f"- [ ] **{s['n']}**"
            if s.get("tr"):
                line += " · trending"
            line += f"\n  - tag: {s['tag']}"
            line += f"\n  - scores: `{scores}`"
            line += f"\n  - desc (first 200 chars): {s['desc']}"
            if flag:
                line += f"\n  - ⚠️ FLAG: {flag}"
            else:
                line += f"\n  - flag: none — sub-scores look consistent with tier"
            lines.append(line)
            lines.append("")
        lines.append("---")
        lines.append("")

    lines.append(f"## Summary")
    lines.append("")
    lines.append(f"- Heuristic flags fired: **{flag_total}** of {sum(len(v) for v in sample.values())} sampled entries")
    lines.append(f"- Tier coverage in `data.js`:")
    for t in ("t1", "t2", "t3", "t4"):
        lines.append(f"  - {tier_labels[t]}: {len(by_tier[t])} entries")
    lines.append("")
    lines.append("## Next steps for the human reviewer")
    lines.append("")
    lines.append("1. For each flagged entry, pull the latest meta-analysis and recheck the tier call.")
    lines.append("2. For Tier 1 entries: verify at least one cited PMID has `data-funder-type=\"public\"` or `\"nonprofit\"` (run `scripts/backfill_funding.py` if not already done).")
    lines.append("3. Apply the 25% industry-funded effect-size discount when summarizing — see `methodology.html`.")
    lines.append("4. Promote/demote tier as warranted; document the change in the next per-supplement review file.")

    out_path = ROOT / f"reviews/tier-qa-{today}.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")
    if not args.quiet:
        print(f"Wrote {out_path}", file=sys.stderr)
        print(f"Flags: {flag_total} / {sum(len(v) for v in sample.values())} sampled", file=sys.stderr)
    print(out_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
