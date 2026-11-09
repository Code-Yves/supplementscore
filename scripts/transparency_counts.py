#!/usr/bin/env python3
"""Count studies and an equivalent-hours estimate from site files.

Study count
-----------
One study is one PubMed ID. Scan every .html, .js, and .json file under the
repo except these directories: node_modules, test-results, playwright-report,
blob-report, .git, _archive, reviews, _mockups, og, dist, scripts, outputs,
tests, _docs, fr, es. Also skip filenames that contain "mockup".

An ID counts when the file text matches either:
  - PMID, then optional spaces, a colon, or a hash, then a 6- to 9-digit number
  - pubmed.ncbi.nlm.nih.gov/ and the same kind of number
The same ID in many files counts once.

Equivalent human research hours
-------------------------------
This estimates the time one person would need to find, read, and appraise the
cited studies and to research and write the published pages. It is not
participant-time inside the trials.

  studies x 1.5 hours
  + published pages x 4 hours

1.5 hours per study is a round assumption near the times reported by
Nussbaumer-Streit and colleagues, Journal of Clinical Epidemiology, 2021
(doi:10.1016/j.jclinepi.2021.05.019): extracting the main facts took one
person about 41 to 65 minutes per study, and a short critical-appraisal
checklist took about 10 to 21 minutes more. The paper did not measure
1.5 hours.

4 hours per page is a stated assumption for drafting a page after the studies
are already counted. The same rate is used for every page type below. No
published timing study was found for writing a supplement page.

A published page is an HTML file in one of the folders below. index.html
catalogs are left out. A file whose first 8 KB contains an http-equiv refresh
is a redirect stub and is left out. Short aliases under s/, French and Spanish
copies, legal pages, and app shells are not in these folders.

The headline rounds the sum to the nearest thousand hours.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {
    "node_modules",
    "test-results",
    "playwright-report",
    "blob-report",
    ".git",
    "_archive",
    "reviews",
    "_mockups",
    "og",
    "dist",
    "scripts",
    "outputs",
    "tests",
    "_docs",
    "fr",
    "es",
}

# (printed label, directory). Order is the order shown on the transparency page.
PAGE_GROUPS = (
    ("supplement_pages", "supplement"),
    ("articles", "a"),
    ("comparisons", "compare"),
    ("condition_guides", "condition"),
    ("symptom_pages", "sx"),
    ("topic_hubs", "hub"),
    ("medication_pages", "m"),
    ("stacks", "stack"),
    ("audience_guides", "for"),
    ("brand_pages", "brand"),
)

HOURS_PER_STUDY = 1.5
HOURS_PER_PAGE = 4.0

PMID_RE = re.compile(
    r"(?:PMID[:\s#]*|pubmed\.ncbi\.nlm\.nih\.gov/)([0-9]{6,9})",
    re.I,
)
REFRESH_RE = re.compile(r"http-equiv\s*=\s*['\"]refresh['\"]", re.I)


def iter_files():
    for dirpath, dirs, names in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for name in names:
            if "mockup" in name.lower():
                continue
            path = Path(dirpath) / name
            if path.suffix.lower() in {".html", ".js", ".json"}:
                yield path


def study_ids() -> set[str]:
    found: set[str] = set()
    for path in iter_files():
        if path.name == "bibliography.json":
            # Citation prose mentions other papers. Count only this export's PMIDs.
            try:
                rows = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            for row in rows:
                pmid = str(row.get("pmid", ""))
                if re.fullmatch(r"[0-9]{6,9}", pmid):
                    found.add(pmid)
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        found.update(PMID_RE.findall(text))
    return found


def is_redirect(path: Path) -> bool:
    head = path.read_bytes()[:8192]
    return REFRESH_RE.search(head.decode("utf-8", errors="ignore")) is not None


def published_pages() -> dict[str, list[Path]]:
    grouped: dict[str, list[Path]] = {}
    for label, folder in PAGE_GROUPS:
        directory = ROOT / folder
        if not directory.is_dir():
            raise SystemExit(f"missing page folder: {folder}")
        pages = []
        for path in sorted(directory.glob("*.html")):
            if path.name == "index.html":
                continue
            if "mockup" in path.name.lower():
                continue
            if is_redirect(path):
                continue
            pages.append(path)
        if not pages:
            raise SystemExit(f"no published pages in {folder}")
        grouped[label] = pages
    return grouped


def round_thousands(hours: float) -> int:
    return int(round(hours / 1000.0) * 1000)


def fmt_hours(hours: float) -> str:
    if abs(hours - round(hours)) < 1e-9:
        return str(int(round(hours)))
    return f"{hours:.1f}"


def main() -> int:
    studies = study_ids()
    pages = published_pages()
    page_count = sum(len(paths) for paths in pages.values())
    study_hours = len(studies) * HOURS_PER_STUDY
    page_hours = page_count * HOURS_PER_PAGE
    total = study_hours + page_hours
    rounded = round_thousands(total)
    print(f"studies {len(studies)}")
    for label, _folder in PAGE_GROUPS:
        print(f"pages_{label} {len(pages[label])}")
    print(f"pages {page_count}")
    print(f"hours_per_study {fmt_hours(HOURS_PER_STUDY)}")
    print(f"hours_per_page {fmt_hours(HOURS_PER_PAGE)}")
    print(f"study_hours {fmt_hours(study_hours)}")
    print(f"page_hours {fmt_hours(page_hours)}")
    print(f"total_hours {fmt_hours(total)}")
    print(f"rounded_hours {rounded}")
    if "--list" in sys.argv:
        for label, paths in pages.items():
            for path in paths:
                print(f"{label} {path.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
