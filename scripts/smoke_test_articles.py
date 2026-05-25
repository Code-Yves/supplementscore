#!/usr/bin/env python3
"""SupplementScore article-rendering smoke test.

Loads a representative sample of /a/, /s/, /condition/, /compare/, /for/, /m/,
/stack/, /hub/, /sx/ archetypes and checks for known regression patterns:

FORBIDDEN PATTERNS (must NOT appear):
- "Print clinician handout"           — feature removed 2026-05-24
- "Quick Reads" (display label)       — renamed to "Top 10 Lists" 2026-05-24
- href to /discover.html              — page retired 2026-05-24 (redirect stub only)
- href to supplement.html?n=          — broken legacy form (the parser was fixed, but links are still ugly UX)
- "full scoring"                       — UX-opaque label removed 2026-05-24
- data-category="population"           — Population articles removed 2026-05-24
- '<h3' as a top-level body section header in /a/ pages — should be <h2>
- Per-section "<div class=\"sec-meta\">" line — removed 2026-05-24

REQUIRED PATTERNS (must appear on /a/ pages):
- <script src="..._research-chrome.js?v=...">
- <script src="..._site-ux.js?v=...">
- <link rel="stylesheet" href="../styles.css?v=...">
- <!-- last-reviewed: ... --> comment in meta line
- A canonical link to itself

SCRIPT BEHAVIOUR:
- Reads files directly from disk (no live HTTP fetch needed)
- Samples N files per archetype (default 5) — checks scale linearly with corpus
- Returns exit code 0 if all clean, 1 if any regression detected
- Outputs a markdown report at reviews/smoke-test-YYYY-MM-DD.md

Usage:
    python3 scripts/smoke_test_articles.py                    # full sample
    python3 scripts/smoke_test_articles.py --sample 10        # 10 files per archetype
    python3 scripts/smoke_test_articles.py --strict           # also fail on warnings
    python3 scripts/smoke_test_articles.py --all              # check every file

Designed to be runnable from a scheduled task, with output in reviews/.
"""
from __future__ import annotations

import argparse
import datetime
import glob
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # supplementscore-repo/
REVIEWS_DIR = ROOT / "reviews"

# Patterns that must NOT appear anywhere in the HTML body (case-insensitive)
# Each is (regex, severity, reason)
FORBIDDEN: list[tuple[re.Pattern, str, str]] = [
    (re.compile(r'Print clinician handout', re.I), 'fail', 'Print handout feature was removed 2026-05-24'),
    (re.compile(r'>Quick Reads<'), 'fail', '"Quick Reads" label was renamed to "Top 10 Lists" 2026-05-24'),
    (re.compile(r'href="[^"]*discover\.html(?!#bak)[^"]*"', re.I), 'fail', '/discover.html was retired 2026-05-24 — redirect stub only'),
    (re.compile(r'href="[^"]*supplement\.html\?n=[^"]*"', re.I), 'warn', 'supplement.html?n= link is legacy (parser now works, but /s/ direct links are cleaner)'),
    (re.compile(r'\bfull scoring\b', re.I), 'fail', '"full scoring" label was removed 2026-05-24'),
    (re.compile(r'\bdata-category="population"', re.I), 'fail', 'Population articles removed 2026-05-24'),
    (re.compile(r'<div class="sec-meta"'), 'fail', 'Per-section MIN sub-label was removed 2026-05-24'),
    (re.compile(r'<div class="rc-sec-min"'), 'fail', 'Per-section MIN sub-label was removed 2026-05-24'),
    # Stale ?v= cache busters — anything older than today's bump
    (re.compile(r'_site-ux\.js\?v=20260519'), 'warn', 'Stale _site-ux.js cache buster'),
    (re.compile(r'_research-chrome\.js\?v=20260524-research-r1[0-9](?!9)'), 'warn', 'Stale _research-chrome.js cache buster (older than r19)'),
]

# Patterns REQUIRED on every /a/<slug>.html page.
# Each regex is tolerant of attribute order (rel-first vs href-first) and
# self-closing vs open-tag syntax (XHTML <link/> vs HTML <link>).
REQUIRED_ON_ARTICLES: list[tuple[re.Pattern, str]] = [
    (re.compile(r'<script[^>]*src="[^"]*_research-chrome\.js'), '_research-chrome.js must be loaded on every /a/ article'),
    (re.compile(r'<script[^>]*src="[^"]*_site-ux\.js'), '_site-ux.js must be loaded on every /a/ article'),
    # styles.css can be linked as <link rel="stylesheet" href="..."> OR <link href="..." rel="stylesheet">
    (re.compile(r'<link[^>]*styles\.css[^>]*rel="stylesheet"|<link[^>]*rel="stylesheet"[^>]*styles\.css', re.I), 'styles.css link must be present'),
    (re.compile(r'<!--\s*last-reviewed:\s*\d{4}-\d{2}-\d{2}\s*-->'), 'last-reviewed comment must be present (drives the cadence machinery)'),
    (re.compile(r'<link[^>]*rel="canonical"', re.I), 'canonical link must be present'),
]

# Structural check: in the .ar-wrap body, top-level section headings should be
# <h2>. If a page has zero h2s but has h3s, that's the upstream-bug pattern.
def check_h2_h3_hierarchy(html: str, fpath: Path) -> list[tuple[str, str, str]]:
    findings = []
    m = re.search(r'<div class="ar-content">(.*?)(<div class="ar-foot|<div class="ca-related|</main>)', html, flags=re.DOTALL)
    if not m: return findings
    body = m.group(1)
    # Strip the Sources block (h3 inside there is correct)
    body_main = re.split(r'<div style="margin-top:2\.5rem', body, maxsplit=1)[0]
    h2_count = len(re.findall(r'<h2\b', body_main))
    h3_count = len(re.findall(r'<h3\b', body_main))
    if h3_count > 0 and h2_count == 0:
        findings.append((str(fpath), 'fail', f'{h3_count} body h3s but 0 h2s — h1→h3 hierarchy jump (should be h1→h2)'))
    return findings


def scan_file(fpath: Path) -> list[tuple[str, str, str]]:
    """Return list of (file, severity, message) for issues found in this file."""
    findings = []
    try:
        html = fpath.read_text(encoding='utf-8', errors='ignore')
    except OSError as e:
        return [(str(fpath), 'fail', f'cannot read: {e}')]

    # Forbidden patterns
    for pat, sev, reason in FORBIDDEN:
        if pat.search(html):
            findings.append((str(fpath), sev, reason))

    # Required patterns (only on /a/ articles)
    if fpath.parts[-2] == 'a':
        for pat, reason in REQUIRED_ON_ARTICLES:
            if not pat.search(html):
                findings.append((str(fpath), 'fail', f'MISSING: {reason}'))
        # Hierarchy check
        findings.extend(check_h2_h3_hierarchy(html, fpath))

    return findings


def sample_files(dirname: str, n: int, seed: int = 42) -> list[Path]:
    files = [Path(f) for f in glob.glob(str(ROOT / dirname / '*.html'))
             if '.bak' not in str(f) and 'index' not in Path(f).name]
    rng = random.Random(seed)
    rng.shuffle(files)
    return files[:n] if n > 0 else files


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--sample', type=int, default=5, help='Files per archetype (0 = all)')
    p.add_argument('--all', action='store_true', help='Check every file (overrides --sample)')
    p.add_argument('--strict', action='store_true', help='Exit nonzero on warnings too (default: only fails)')
    p.add_argument('--quiet', action='store_true')
    args = p.parse_args()

    sample = 0 if args.all else args.sample
    log = (lambda *a, **k: None) if args.quiet else (lambda *a, **k: print(*a, **k, file=sys.stderr))

    archetypes = ['a', 's', 'condition', 'compare', 'for', 'm', 'stack', 'hub', 'sx']
    all_findings: list[tuple[str, str, str]] = []
    files_scanned = 0

    for archetype in archetypes:
        files = sample_files(archetype, sample)
        log(f"Scanning /{archetype}/ — {len(files)} files")
        for f in files:
            findings = scan_file(f)
            all_findings.extend(findings)
            files_scanned += 1

    # Tally
    by_sev = defaultdict(int)
    by_reason = defaultdict(list)
    for fp, sev, reason in all_findings:
        by_sev[sev] += 1
        by_reason[reason].append(fp)

    fail_count = by_sev.get('fail', 0)
    warn_count = by_sev.get('warn', 0)

    # Report
    today = datetime.date.today().isoformat()
    REVIEWS_DIR.mkdir(parents=True, exist_ok=True)
    report = REVIEWS_DIR / f'smoke-test-{today}.md'
    with report.open('w', encoding='utf-8') as f:
        f.write(f'# Article smoke-test — {today}\n\n')
        f.write(f'- Files scanned: **{files_scanned}**\n')
        f.write(f'- Failures: **{fail_count}**\n')
        f.write(f'- Warnings: **{warn_count}**\n\n')
        f.write(f'## Result\n\n')
        if fail_count == 0:
            f.write('**PASS** — no regressions detected.\n\n')
        else:
            f.write(f'**FAIL** — {fail_count} regression(s) detected.\n\n')
        if warn_count > 0:
            f.write(f'**{warn_count} warning(s)** — non-blocking but worth review.\n\n')
        if all_findings:
            f.write('## Findings (grouped by reason)\n\n')
            for reason, files in sorted(by_reason.items(), key=lambda kv: -len(kv[1])):
                sev = [s for _, s, r in all_findings if r == reason][0]
                f.write(f'### [{sev.upper()}] {reason}\n\n')
                f.write(f'{len(files)} file(s):\n\n')
                for fp in files[:15]:
                    rel = Path(fp).relative_to(ROOT) if Path(fp).is_absolute() else Path(fp)
                    f.write(f'- `{rel}`\n')
                if len(files) > 15:
                    f.write(f'- ... and {len(files) - 15} more\n')
                f.write('\n')

    log(f'\nFiles scanned: {files_scanned}')
    log(f'Failures: {fail_count}')
    log(f'Warnings: {warn_count}')
    log(f'Report: {report.relative_to(ROOT)}')
    print(report)

    if fail_count > 0:
        return 1
    if args.strict and warn_count > 0:
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
