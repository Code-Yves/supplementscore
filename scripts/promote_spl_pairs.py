#!/usr/bin/env python3
"""
Promote curated SPL-mining candidate pairs into DRUG_INTERACTIONS.pairs in app.js.

Phase 3 follow-up FU-J of IMPLEMENTATION_ROADMAP.md.

Reads `reviews/spl-mining-candidates-{date}.md`, pulls every entry the human reviewer
marked `[x]` (instead of `[ ]`), translates it into a DRUG_INTERACTIONS.pairs row, and
inserts the row into app.js.

Usage:
    python3 scripts/promote_spl_pairs.py reviews/spl-mining-candidates-2026-04-28.md
    python3 scripts/promote_spl_pairs.py --dry-run reviews/spl-mining-candidates-...md

Markdown format expected per candidate:

    - [x] **drug_generic** × **Supplement Name**
      - brands: ...
      - snippet: > ...
      - SPL set_id: `...`

(`[x]` = approve and promote; `[ ]` = skip.)

The script:
1. Parses approved entries
2. Skips any pair already present in DRUG_INTERACTIONS.pairs (by drug+supp)
3. Inserts new rows in app.js right before the closing `];` of the `pairs` array
4. Backs up app.js as app.js.bak-spl-promote-{date}
5. Writes a promotion summary to reviews/spl-promote-{date}.md
"""
from __future__ import annotations

import argparse
import datetime
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app.js"


CANDIDATE_RE = re.compile(
    r"- \[([ xX])\] \*\*([^*]+?)\*\* × \*\*([^*]+?)\*\*"
    r"(?:[\s\S]*?- snippet: > ([^\n]+))?"
    r"(?:[\s\S]*?- SPL set_id: `([^`]+)`)?",
    re.MULTILINE,
)


def parse_candidates(md: str) -> list[dict]:
    """Return list of {drug, supp, severity, snippet, set_id, approved}."""
    out = []
    # We also need to know which severity section the entry is under
    sev_section = "caution"
    for line in md.split("\n"):
        if re.match(r"^##\s+AVOID\b", line, re.I):
            sev_section = "avoid"
        elif re.match(r"^##\s+CAUTION\b", line, re.I):
            sev_section = "caution"
        elif re.match(r"^##\s+EXTRA\b", line, re.I):
            sev_section = "extra"
        elif re.match(r"^##\s+", line):
            # any other H2 — reset to caution as a conservative default
            sev_section = "caution"
        m = re.match(r"- \[([ xX])\] \*\*([^*]+?)\*\* × \*\*([^*]+?)\*\*", line)
        if m:
            out.append({
                "approved": m.group(1).lower() == "x",
                "drug": m.group(2).strip(),
                "supp": m.group(3).strip(),
                "severity": sev_section,
                "snippet": "",
                "set_id": "",
            })
    return out


def existing_pairs(app_js: str) -> set[tuple[str, str]]:
    """Pull existing (drug, supp) tuples already in DRUG_INTERACTIONS.pairs."""
    out = set()
    # Anchor between `pairs:[` and the matching `]`
    m = re.search(r"DRUG_INTERACTIONS=\{[\s\S]*?pairs:\[([\s\S]*?)\]\s*\};", app_js)
    if not m:
        return out
    block = m.group(1)
    for pm in re.finditer(
        r"\{drug:'([^']+)',supp:'((?:[^'\\]|\\.)*)',",
        block,
    ):
        out.add((pm.group(1).lower(), pm.group(2).replace("\\'", "'")))
    return out


def render_pair_row(c: dict) -> str:
    """Build a single `{drug:'...',supp:'...',severity:'...',mechanism:'...',evidence:'C',source:'openFDA SPL'}`."""
    def jsq(s):
        return s.replace("\\", "\\\\").replace("'", "\\'")
    mech = c.get("snippet", "")[:200].strip() or "from FDA drug-label drug-interactions section"
    return ("{drug:'" + jsq(c["drug"]) + "',supp:'" + jsq(c["supp"]) +
            "',severity:'" + c["severity"] + "',mechanism:'" + jsq(mech) +
            "',evidence:'C',source:'openFDA SPL" +
            (" set_id:" + c["set_id"] if c.get("set_id") else "") + "'}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("candidates_file", help="Path to the SPL candidates markdown.")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args()

    log = (lambda *a, **k: None) if args.quiet else (lambda *a, **k: print(*a, **k, file=sys.stderr))

    md_path = Path(args.candidates_file)
    if not md_path.is_absolute():
        md_path = ROOT / md_path
    if not md_path.exists():
        print(f"ERROR: {md_path} not found", file=sys.stderr)
        return 2

    md = md_path.read_text(encoding="utf-8")
    candidates = parse_candidates(md)
    approved = [c for c in candidates if c["approved"]]
    log(f"Parsed {len(candidates)} candidates; {len(approved)} marked approved")

    if not approved:
        log("Nothing to promote. Mark candidates with `[x]` to approve.")
        return 0

    app_js = APP.read_text(encoding="utf-8")
    existing = existing_pairs(app_js)
    log(f"DRUG_INTERACTIONS.pairs currently has {len(existing)} entries")

    new_rows = []
    skipped_existing = []
    for c in approved:
        key = (c["drug"].lower(), c["supp"])
        if key in existing:
            skipped_existing.append(c)
            continue
        new_rows.append(c)

    if not new_rows:
        log("All approved pairs are already present. Nothing to write.")
        return 0

    # Splice new rows in immediately before the closing `]` of the pairs array
    rendered = ",\n    ".join(render_pair_row(c) for c in new_rows)
    insert_re = re.compile(r"(DRUG_INTERACTIONS=\{[\s\S]*?pairs:\[[\s\S]*?)\n  \]\n}", re.MULTILINE)
    m = insert_re.search(app_js)
    if not m:
        # Try alternate closing pattern (single line per row)
        insert_re = re.compile(r"(DRUG_INTERACTIONS=\{[\s\S]*?pairs:\[[\s\S]*?\}\s*)\]\s*\};", re.MULTILINE)
        m = insert_re.search(app_js)
    if not m:
        log("ERROR: could not locate DRUG_INTERACTIONS.pairs closing bracket. Aborting.")
        return 3
    head = m.group(1)
    new_app = app_js[:m.start()] + head + ",\n    " + rendered + "\n  ]\n};" + app_js[m.end():]

    today = datetime.date.today().isoformat()
    if args.dry_run:
        log(f"[dry-run] Would insert {len(new_rows)} rows; "
            f"{len(skipped_existing)} approved entries already present (skipped).")
        for c in new_rows[:5]:
            log("  +" + render_pair_row(c)[:200])
    else:
        backup = APP.with_suffix(".js.bak-spl-promote-" + today.replace("-", ""))
        shutil.copy(APP, backup)
        APP.write_text(new_app, encoding="utf-8")
        log(f"Wrote {len(new_rows)} new pairs to app.js (backup: {backup.name})")

    # Promotion report
    report_path = ROOT / f"reviews/spl-promote-{today}.md"
    out = []
    out.append(f"# SPL Pair Promotion — {today}\n")
    out.append(f"**Source:** {md_path.relative_to(ROOT)}")
    out.append(f"**Approved entries:** {len(approved)}")
    out.append(f"**Newly inserted:** {len(new_rows)}")
    out.append(f"**Skipped (already present):** {len(skipped_existing)}")
    out.append(f"**Mode:** {'dry-run' if args.dry_run else 'committed'}")
    out.append("")
    if new_rows:
        out.append("## Inserted")
        out.append("| drug | supp | severity | mechanism (excerpt) |")
        out.append("|---|---|---|---|")
        for c in new_rows:
            mech = (c.get("snippet") or "from FDA drug-label drug-interactions section")[:80].replace("|", "\\|")
            out.append(f"| {c['drug']} | {c['supp']} | {c['severity']} | {mech} |")
        out.append("")
    if skipped_existing:
        out.append("## Skipped (already present in DRUG_INTERACTIONS.pairs)")
        for c in skipped_existing:
            out.append(f"- {c['drug']} × {c['supp']}")
        out.append("")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(out), encoding="utf-8")
    log(f"Wrote {report_path}")
    print(report_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
