#!/usr/bin/env python3
"""Count studies and a lower-bound human-research-hours estimate from site files.

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

Human research hours
--------------------
This is a lower bound on participant-hours in cited human studies, not staff
time. From the same HTML files (plus data.js, the canonical supplement text):

  A sentence may contribute only when it contains exactly one PubMed ID,
  exactly one enrollment phrase, and exactly one follow-up phrase.
  Enrollment is a number followed by participants, subjects, patients,
  volunteers, individuals, people, adults, women, men, children, or infants.
  Follow-up is "for/over/across/during/lasting/lasted/followed for/
  follow-up of/median of/mean of/a median of" plus a number of days, weeks,
  months, or years. A form such as "12-week trial" also counts.
  A range such as 3-5 years uses the midpoint.
  Follow-up shorter than 7 days is skipped.
  Each PubMed ID is kept once. If two sentences disagree on the product of
  people and hours, the script exits with an error.

  Conversions: 1 day = 24 hours, 1 week = 168 hours,
  1 month = 730.5 hours (365.25 / 12 days), 1 year = 8,766 hours (365.25 days).

Studies that do not state both numbers in that shape are left out. They are
not guessed.
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

PMID_RE = re.compile(
    r"(?:PMID[:\s#]*|pubmed\.ncbi\.nlm\.nih\.gov/)([0-9]{6,9})",
    re.I,
)
TAG_RE = re.compile(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<[^>]+>", re.I)
PART_RE = re.compile(
    r"(?P<n>\d{1,3}(?:,\d{3})+|\d{1,6})\s+"
    r"(?:healthy\s+|older\s+|adult\s+|postmenopausal\s+|pregnant\s+|trained\s+|symptomatic\s+|newly diagnosed\s+)?"
    r"(?:participants|subjects|patients|volunteers|individuals|people|adults|women|men|children|infants)\b",
    re.I,
)
DUR_RES = [
    re.compile(
        r"(?:for|over|across|during|lasting|lasted|followed for|follow-up of|median of|mean of|a median of)\s+"
        r"(?P<n>\d+(?:\.\d+)?)(?:\s*[-–]\s*(?P<n2>\d+(?:\.\d+)?))?\s*"
        r"(?P<u>day|week|month|year|hour)s?\b",
        re.I,
    ),
    re.compile(
        r"(?P<n>\d+(?:\.\d+)?)\s*[-–]\s*(?P<u>day|week|month|year)s?\b"
        r"(?:\s+(?:trial|study|rct|supplementation|treatment|intervention|follow-up|course))",
        re.I,
    ),
]
UNIT_HOURS = {"hour": 1.0, "day": 24.0, "week": 168.0, "month": 730.5, "year": 8766.0}


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
        text = path.read_text(encoding="utf-8", errors="ignore")
        found.update(PMID_RE.findall(text))
    return found


def sentences(text: str) -> list[str]:
    protected = re.sub(r"(\d)\.(\d)", r"\1<DOT>\2", text)
    protected = re.sub(
        r"\b(et al|vs|Dr|Mr|Mrs|Fig|e\.g|i\.e)\.",
        lambda match: match.group(0).replace(".", "<DOT>"),
        protected,
        flags=re.I,
    )
    parts = re.split(r"(?<=[.!?])\s+", protected)
    return [part.replace("<DOT>", ".") for part in parts]


def plain_html(raw: str) -> str:
    text = TAG_RE.sub(" ", raw)
    text = re.sub(r"\s+", " ", text)
    return text


def duration_hours(match: re.Match) -> float | None:
    unit = match.group("u").lower()
    if unit == "hour":
        return None
    first = float(match.group("n"))
    second_raw = match.groupdict().get("n2")
    second = float(second_raw) if second_raw else first
    length = (first + second) / 2.0
    hours = length * UNIT_HOURS[unit]
    if hours < 24 * 7:
        return None
    if hours > 8766 * 25:
        return None
    return hours


def hours_by_pmid() -> dict[str, tuple[int, float, str]]:
    """Map PMID -> (people, hours_each, source). Disagreeing duplicates error."""
    chosen: dict[str, tuple[int, float, str]] = {}
    blobs: list[tuple[str, str]] = []
    for path in iter_files():
        if path.suffix.lower() != ".html":
            continue
        blobs.append((path.relative_to(ROOT).as_posix(), plain_html(path.read_text(encoding="utf-8", errors="ignore"))))
    data_js = ROOT / "data.js"
    if data_js.exists():
        blobs.append(("data.js", data_js.read_text(encoding="utf-8", errors="ignore")))

    for source, text in blobs:
        for sentence in sentences(text):
            ids = PMID_RE.findall(sentence)
            if len(ids) != 1:
                continue
            enrollments = list(PART_RE.finditer(sentence))
            durations = []
            for pattern in DUR_RES:
                durations.extend(pattern.finditer(sentence))
            if len(enrollments) != 1 or len(durations) != 1:
                continue
            people = int(enrollments[0].group("n").replace(",", ""))
            if people < 8 or people > 100000:
                continue
            each = duration_hours(durations[0])
            if each is None:
                continue
            pmid = ids[0]
            product = people * each
            previous = chosen.get(pmid)
            if previous is None:
                chosen[pmid] = (people, each, source)
                continue
            if abs(previous[0] * previous[1] - product) > 0.1:
                raise SystemExit(
                    f"PMID {pmid} disagrees: {previous} vs {(people, each, source)}"
                )
    return chosen


def main() -> int:
    studies = study_ids()
    hours = hours_by_pmid()
    total = sum(people * each for people, each, _source in hours.values())
    # 730.5 and 8766 are exact in binary for the durations this corpus hits,
    # so the sum should land on a whole number of hours.
    if abs(total - round(total)) > 1e-6:
        raise SystemExit(f"participant-hours are not a whole number: {total}")
    total_hours = int(round(total))
    print(f"studies {len(studies)}")
    print(f"timed_studies {len(hours)}")
    print(f"participant_hours {total_hours}")
    ranked = sorted(hours.items(), key=lambda item: -(item[1][0] * item[1][1]))
    if "--list" in sys.argv:
        for pmid, (people, each, source) in ranked:
            print(f"{pmid} people={people} hours_each={each:.1f} person_hours={people * each:.0f} {source}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
