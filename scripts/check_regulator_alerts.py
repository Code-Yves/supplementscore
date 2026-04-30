#!/usr/bin/env python3
"""
Check FDA MedWatch and EFSA RSS feeds for items mentioning supplements in data.js.
Emits a JSON list of priority entries that should jump the review queue regardless
of last-reviewed cadence.

Phase 1 / Item #5 of IMPLEMENTATION_ROADMAP.md.

Usage:
    python3 scripts/check_regulator_alerts.py
    python3 scripts/check_regulator_alerts.py --since 2026-04-21  # only alerts after this date
    python3 scripts/check_regulator_alerts.py --json out.json     # write to file

Inputs (free, no auth):
- FDA MedWatch Safety Alerts: https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program/safety-information-and-adverse-event-reporting-program-rss-feeds
- EFSA news + scientific opinions feed: https://www.efsa.europa.eu/en/rss

Output schema (JSON):
[
  {
    "supplement": "Kratom (Mitragyna speciosa)",
    "matched_term": "kratom",
    "alert_source": "FDA MedWatch",
    "alert_title": "FDA Issues Warning Letter to ...",
    "alert_url": "https://...",
    "alert_date": "2026-04-22",
    "priority": "high"  # high|medium based on the matching rules
  },
  ...
]

Empty list = nothing on either feed mentions a tracked supplement. Run daily as part of
the review pipeline; if the list is non-empty, those supplements get reviewed today
regardless of cadence.
"""
import argparse
import json
import re
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "data.js"

FEEDS = [
    {
        "label": "FDA MedWatch",
        "url": "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/medwatch/rss.xml",
        "priority": "high",
    },
    {
        "label": "EFSA News",
        # EFSA exposes several feeds; this is the news/opinions feed.
        "url": "https://www.efsa.europa.eu/en/news/rss",
        "priority": "medium",
    },
]


def extract_supplement_names(data_js_path: Path) -> list[str]:
    """Pull every `n:'...'` value from the S array in data.js. Tolerant to the file's
    one-line minified style. Returns deduped, sorted names."""
    src = data_js_path.read_text(encoding="utf-8")
    # Match  n:'Foo'  or  n:"Foo"  inside supplement entries.
    pat = re.compile(r"\bn:\s*(?:'([^'\\]*(?:\\.[^'\\]*)*)'|\"([^\"\\]*(?:\\.[^\"\\]*)*)\")")
    names = set()
    for m in pat.finditer(src):
        name = m.group(1) or m.group(2)
        if name:
            names.add(name.replace("\\'", "'").replace('\\"', '"'))
    return sorted(names)


_GENERIC_PARENS = {
    # Words that show up inside parentheses but aren't names — would generate false-positive
    # matches against any news headline using the same generic English term.
    "supplement", "supplements", "extract", "extracts", "oil", "oils", "powder", "powders",
    "form", "forms", "type", "types", "version", "versions", "capsule", "capsules",
    "tablet", "tablets", "tincture", "tinctures", "drops", "spray", "syrup", "lozenge",
    "lozenges", "softgel", "softgels", "chewable", "gummies", "gummy", "liquid",
    "topical", "sublingual", "oral", "nightly", "daily", "weekly", "monthly",
    "high", "low", "mega", "physiological", "standardised", "standardized",
    "branded", "generic", "synthetic", "natural", "raw", "purified",
    "high-dose", "low-dose", "mega-dose", "physiological-dose", "extended-release",
    "sustained-release", "controlled-release", "delayed-release", "slow-release",
    "immediate-release", "active", "inactive", "trial", "trials", "study", "studies",
    "research", "clinical",
}
_DOSE_PATTERN = re.compile(
    r"^\s*(?:high|low|mega|physiological|standardised|standardized)[\s-]?(?:dose|concentration)?\b[\s,]*",
    flags=re.I,
)
_DOSE_LIKE = re.compile(r"^[\d.\s\-mgkµ/%]+$")


def matchable_terms(name: str) -> list[str]:
    """Return search terms for a supplement name. The full name plus any
    parenthetical alias (e.g. "Kratom (Mitragyna speciosa)" -> ["Kratom", "Mitragyna speciosa"]).
    Skip dose qualifiers and common generic English words to avoid false positives."""
    out: list[str] = []
    base = re.sub(r"\s*\([^)]*\)\s*", " ", name).strip()
    base = re.sub(r"\s*,.*$", "", base)
    if base and len(base) >= 4:
        out.append(base)
    for paren in re.findall(r"\(([^)]+)\)", name):
        cleaned = _DOSE_PATTERN.sub("", paren).strip()
        # Take only the first comma-separated chunk if "Mitragyna speciosa, Thailand strain"
        cleaned = cleaned.split(",")[0].strip()
        if not cleaned or len(cleaned) < 4:
            continue
        if _DOSE_LIKE.match(cleaned):
            continue
        if cleaned.lower() in _GENERIC_PARENS:
            continue
        # Skip pure dose strings ("0.1-0.5 mg", "5-10 mg") even if longer
        if re.match(r"^[\d.\s\-]+(mg|µg|mcg|g|iu|%)?\b", cleaned, flags=re.I):
            continue
        out.append(cleaned)
    return out


def fetch_feed(url: str, timeout: int = 15) -> bytes | None:
    """Fetch a URL with a sensible User-Agent. Return bytes, or None on failure."""
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "supplement-score-regulator-alerts/1.0 (https://supplementscore.example)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.URLError as e:
        print(f"  [warn] could not fetch {url}: {e}", file=sys.stderr)
        return None


def parse_rss_items(xml_bytes: bytes) -> list[dict]:
    """Lightweight RSS/Atom parser. Returns list of {title, link, date, summary}."""
    items = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        print(f"  [warn] feed parse failed: {e}", file=sys.stderr)
        return items
    # Strip namespaces for tag-name matching simplicity.
    for el in root.iter():
        el.tag = re.sub(r"^\{[^}]+\}", "", el.tag)
    for item in list(root.iter("item")) + list(root.iter("entry")):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not link:
            link_el = item.find("link")
            if link_el is not None:
                link = link_el.get("href", "") or ""
        date = (item.findtext("pubDate") or item.findtext("updated") or item.findtext("published") or "").strip()
        summary = (item.findtext("description") or item.findtext("summary") or "").strip()
        items.append({"title": title, "link": link, "date": date, "summary": summary})
    return items


def parse_iso_date(s: str) -> str:
    """Best-effort: parse a feed date string into YYYY-MM-DD. Fall back to today on failure."""
    if not s:
        return datetime.now(timezone.utc).date().isoformat()
    # Try a few common formats.
    for fmt in ("%a, %d %b %Y %H:%M:%S %Z", "%a, %d %b %Y %H:%M:%S %z",
                "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    # Last-resort: regex out a YYYY-MM-DD if present.
    m = re.search(r"\d{4}-\d{2}-\d{2}", s)
    if m:
        return m.group(0)
    return datetime.now(timezone.utc).date().isoformat()


def find_supplement_matches(item_text: str, name_to_terms: dict[str, list[str]]) -> list[tuple[str, str]]:
    """For an alert's title+summary text, return list of (supplement_name, matched_term)."""
    matches = []
    haystack = item_text.lower()
    for name, terms in name_to_terms.items():
        for term in terms:
            # Word-boundary match, case-insensitive.
            pat = r"\b" + re.escape(term.lower()) + r"\b"
            if re.search(pat, haystack):
                matches.append((name, term))
                break
    return matches


def main() -> int:
    p = argparse.ArgumentParser(description="Check FDA + EFSA feeds for supplement alerts.")
    p.add_argument("--since", help="Only consider alerts on or after this YYYY-MM-DD.")
    p.add_argument("--json", help="Write JSON output to this file (default: stdout).")
    p.add_argument("--quiet", action="store_true", help="Suppress progress output.")
    args = p.parse_args()

    log = (lambda *a, **k: None) if args.quiet else (lambda *a, **k: print(*a, **k, file=sys.stderr))

    log(f"Loading supplement names from {DATA_JS} ...")
    if not DATA_JS.exists():
        print(f"ERROR: {DATA_JS} not found", file=sys.stderr)
        return 2
    names = extract_supplement_names(DATA_JS)
    name_to_terms = {n: matchable_terms(n) for n in names}
    log(f"  {len(names)} supplement names loaded")

    cutoff = args.since
    findings: list[dict] = []
    for feed in FEEDS:
        log(f"Fetching {feed['label']}: {feed['url']}")
        body = fetch_feed(feed["url"])
        if body is None:
            continue
        items = parse_rss_items(body)
        log(f"  {len(items)} items from {feed['label']}")
        for it in items:
            date_iso = parse_iso_date(it["date"])
            if cutoff and date_iso < cutoff:
                continue
            text = it["title"] + " " + it["summary"]
            matches = find_supplement_matches(text, name_to_terms)
            for supp_name, matched_term in matches:
                findings.append({
                    "supplement": supp_name,
                    "matched_term": matched_term,
                    "alert_source": feed["label"],
                    "alert_title": it["title"],
                    "alert_url": it["link"],
                    "alert_date": date_iso,
                    "priority": feed["priority"],
                })

    # De-dupe: same (supplement, alert_url) collapsed.
    seen = set()
    deduped = []
    for f in findings:
        key = (f["supplement"], f["alert_url"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(f)
    deduped.sort(key=lambda x: (x["alert_date"], x["supplement"]), reverse=True)

    out_text = json.dumps(deduped, indent=2)
    if args.json:
        Path(args.json).write_text(out_text, encoding="utf-8")
        log(f"Wrote {len(deduped)} findings to {args.json}")
    else:
        print(out_text)

    if deduped:
        log(f"\n{len(deduped)} regulator alerts touch tracked supplements — these jump the review queue today.")
    else:
        log("\nNo regulator alerts touch tracked supplements today.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
