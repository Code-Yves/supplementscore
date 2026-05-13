#!/usr/bin/env python3
"""
GSC indexing prep — picks the next 10 highest-priority URLs to submit to
Google Search Console's URL Inspection > Request Indexing flow each morning.

Workflow:
  1. Load state from ../reviews/action-queues/gsc-indexing-state.json
  2. Build candidate pool, sorted by SEO priority:
       a. URLs deferred from yesterday (quota exceeded)
       b. Tier 1 supplements (by composite score, descending)
       c. Hub index pages not yet submitted
       d. Tier 2 supplements (by composite score, descending)
       e. Article pages (by file mtime, newer first — proxy for recency)
       f. Tier 3 supplements
       g. Condition / compare / for / sx children
  3. Exclude URLs already submitted (tracked in state file)
  4. Take the top 10
  5. Write a markdown report at ../reviews/gsc-indexing-prep-YYYY-MM-DD.md
     containing the 10 URLs and a workflow checklist
  6. Update state with the 10 newly-submitted URLs and last_run date

The markdown report contains, for each URL:
  - The URL in a copy-friendly code block
  - The page title (where available)
  - Priority reason
  - A link to the GSC URL Inspection landing page

Run manually:  python3 supplementscore-repo/scripts/gsc_indexing_picker.py
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import date, datetime
from pathlib import Path

# ── Resolve repo + workspace paths ─────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
WORKSPACE_ROOT = REPO_ROOT.parent

STATE_PATH = WORKSPACE_ROOT / "reviews" / "action-queues" / "gsc-indexing-state.json"
REVIEWS_DIR = WORKSPACE_ROOT / "reviews"
SUPPLEMENTS_JSON = REPO_ROOT / "data" / "supplements.json"
S_DIR = REPO_ROOT / "s"
COMPARE_DIR = REPO_ROOT / "compare"
CONDITION_DIR = REPO_ROOT / "condition"
FOR_DIR = REPO_ROOT / "for"
SX_DIR = REPO_ROOT / "sx"
A_DIR = REPO_ROOT / "a"

SITE_ROOT = "https://supplementscore.org"
GSC_PROPERTY_ENC = "https%3A%2F%2Fsupplementscore.org%2F"

DAILY_QUOTA = 10  # Google Search Console limit per property per day


# ── Helpers ────────────────────────────────────────────────────────────────
def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def get_title(path: Path, max_bytes: int = 8000) -> str | None:
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            html = f.read(max_bytes)
    except OSError:
        return None
    m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if not m:
        return None
    t = re.sub(r"\s+", " ", m.group(1)).strip()
    # Strip site suffix variants
    t = re.sub(r"\s*[—–\|·]+\s*SupplementScore.*$", "", t)
    return t.strip(" ·—–|") or None


def gsc_inspect_landing_url() -> str:
    """The GSC URL-Inspection landing page. Direct deep-links to a specific
    URL aren't reliable (Google requires its own server-generated id), so we
    link to the property's inspection root and the user pastes each URL."""
    return f"https://search.google.com/search-console/inspect?resource_id={GSC_PROPERTY_ENC}"


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"submitted": [], "deferred_to_tomorrow": [], "last_run": None, "runs_history": []}
    with open(STATE_PATH) as f:
        return json.load(f)


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


# ── Candidate builder ──────────────────────────────────────────────────────
def build_candidates(state: dict) -> list[dict]:
    """Returns a list of candidate dicts:
       {url, label, priority_bucket, priority_score, title, source_path}
    sorted by (priority_bucket asc, priority_score desc).
    """
    submitted_urls = {entry["url"] for entry in state.get("submitted", [])}

    candidates: list[dict] = []

    # Bucket 1: deferred from yesterday (quota exceeded etc.)
    for entry in state.get("deferred_to_tomorrow", []):
        url = entry["url"]
        if url not in submitted_urls:
            candidates.append({
                "url": url,
                "label": "deferred",
                "priority_bucket": 1,
                "priority_score": 999,
                "title": entry.get("title") or url.rsplit("/", 1)[-1],
                "reason": "Deferred from prior run — " + entry.get("reason", "unknown"),
            })

    # Bucket 2 + 4 + 6: supplements by tier, by composite score
    if SUPPLEMENTS_JSON.exists():
        with open(SUPPLEMENTS_JSON) as f:
            supps = json.load(f)
        slug_files = {f.stem for f in S_DIR.glob("*.html") if f.name != "index.html"}
        # Per-tier bucket assignment: t1→2, t2→4, t3→6, t4→8
        tier_bucket = {"t1": 2, "t2": 4, "t3": 6, "t4": 8}
        for s in supps:
            slug = slugify(s["name"])
            if slug not in slug_files:
                continue
            tier = s.get("tier", "t?")
            bucket = tier_bucket.get(tier)
            if bucket is None:
                continue
            url = f"{SITE_ROOT}/s/{slug}.html"
            if url in submitted_urls:
                continue
            score = s.get("scores", {}).get("composite", 0)
            candidates.append({
                "url": url,
                "label": f"supplement-{tier}",
                "priority_bucket": bucket,
                "priority_score": score,
                "title": s["name"],
                "reason": f"Tier {tier.upper()} supplement · composite score {score}",
            })

    # Bucket 3: hub index pages not yet submitted
    for hub_path, hub_label in [
        ("discover.html", "discover hub"),
        ("compare/index.html", "compare hub"),
        ("condition/index.html", "condition hub"),
        ("for/index.html", "for/population hub"),
        ("sx/index.html", "symptom hub"),
    ]:
        url = f"{SITE_ROOT}/{hub_path}"
        if url in submitted_urls:
            continue
        local_path = REPO_ROOT / hub_path
        candidates.append({
            "url": url,
            "label": "hub-index",
            "priority_bucket": 3,
            "priority_score": 100,
            "title": get_title(local_path) or hub_label,
            "reason": f"Hub index page: {hub_label}",
        })

    # Bucket 5: articles, sorted by mtime descending (newest first)
    if A_DIR.exists():
        articles = sorted(
            [f for f in A_DIR.glob("*.html")],
            key=lambda f: -f.stat().st_mtime,
        )
        for f in articles:
            url = f"{SITE_ROOT}/a/{f.name}"
            if url in submitted_urls:
                continue
            candidates.append({
                "url": url,
                "label": "article",
                "priority_bucket": 5,
                "priority_score": int(f.stat().st_mtime),  # later mtime = higher score
                "title": get_title(f) or f.stem.replace("-", " ").title(),
                "reason": "Article (recent first)",
            })

    # Bucket 7: condition / compare / for / sx children
    for src_dir, label, bucket in [
        (CONDITION_DIR, "condition page", 7),
        (COMPARE_DIR, "comparison page", 7),
        (FOR_DIR, "for-population page", 7),
        (SX_DIR, "symptom page", 7),
    ]:
        if not src_dir.exists():
            continue
        children = sorted(
            [f for f in src_dir.glob("*.html") if f.name != "index.html"],
            key=lambda f: -f.stat().st_mtime,
        )
        for f in children:
            url = f"{SITE_ROOT}/{src_dir.name}/{f.name}"
            if url in submitted_urls:
                continue
            candidates.append({
                "url": url,
                "label": label,
                "priority_bucket": bucket,
                "priority_score": int(f.stat().st_mtime),
                "title": get_title(f) or f.stem.replace("-", " ").title(),
                "reason": label.capitalize(),
            })

    # Sort: lower bucket first, then higher score
    candidates.sort(key=lambda c: (c["priority_bucket"], -c["priority_score"]))

    # Dedupe by URL, keeping the first (highest-priority) occurrence
    seen: set[str] = set()
    deduped: list[dict] = []
    for c in candidates:
        if c["url"] in seen:
            continue
        seen.add(c["url"])
        deduped.append(c)
    return deduped


# ── Markdown writer ────────────────────────────────────────────────────────
def render_report(picks: list[dict], state: dict, today: str) -> str:
    submitted_total_before = len(state.get("submitted", []))
    submitted_total_after = submitted_total_before + len(picks)

    landing = gsc_inspect_landing_url()
    lines = []
    lines.append(f"# GSC indexing prep — {today}")
    lines.append("")
    lines.append(
        f"**{len(picks)} URLs queued for today.** Paste each into the GSC URL "
        "Inspection bar, hit Enter, then click **REQUEST INDEXING**. Wait for "
        "the live URL test to finish (~30s per URL), then dismiss the dialog "
        "and move to the next."
    )
    lines.append("")
    lines.append(f"**Open GSC URL Inspection:** [{landing}]({landing})")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Today's URL list")
    lines.append("")

    for i, p in enumerate(picks, 1):
        title = p["title"]
        url = p["url"]
        reason = p["reason"]
        lines.append(f"### {i}. {title}")
        lines.append("")
        lines.append(f"- **Why:** {reason}")
        lines.append(f"- **URL to paste into GSC:**")
        lines.append("  ```")
        lines.append(f"  {url}")
        lines.append("  ```")
        lines.append("- [ ] Requested")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## State summary")
    lines.append("")
    lines.append(f"- Submitted total before this batch: **{submitted_total_before}**")
    lines.append(f"- Submitted total after this batch: **{submitted_total_after}**")
    lines.append(f"- Daily quota used today: {len(picks)} / {DAILY_QUOTA}")
    lines.append("")
    lines.append("## Workflow notes")
    lines.append("")
    lines.append(
        "Google says: *\"Submitting a page multiple times will not change its "
        "queue position or priority.\"* The picker tracks history in "
        "`reviews/action-queues/gsc-indexing-state.json` so URLs are not "
        "re-submitted."
    )
    lines.append("")
    lines.append(
        "If you hit a **Quota Exceeded** popup before finishing all 10, "
        "stop. The remaining URLs auto-defer to tomorrow's run."
    )
    lines.append("")
    return "\n".join(lines)


# ── Main ───────────────────────────────────────────────────────────────────
def main(argv: list[str]) -> int:
    dry_run = "--dry-run" in argv

    state = load_state()
    today = date.today().isoformat()

    # Same-day re-run protection: if we already ran today, abort unless --force
    if state.get("last_run") == today and "--force" not in argv:
        print(f"Already ran today ({today}). Pass --force to override.")
        return 0

    candidates = build_candidates(state)
    if not candidates:
        print("No candidates — all known URLs have been submitted!")
        # Write a "no-action" report
        report = (
            f"# GSC indexing prep — {today}\n\n"
            "**No URLs to submit.** All known URLs have already been submitted "
            "via the daily indexing prep workflow.\n\n"
            f"State file: `{STATE_PATH.relative_to(WORKSPACE_ROOT)}`\n"
        )
    else:
        picks = candidates[:DAILY_QUOTA]
        report = render_report(picks, state, today)

    out_path = REVIEWS_DIR / f"gsc-indexing-prep-{today}.md"
    if dry_run:
        print(f"[dry-run] Would write {out_path}")
        print(f"[dry-run] Would mark {min(DAILY_QUOTA, len(candidates))} URLs submitted")
    else:
        REVIEWS_DIR.mkdir(parents=True, exist_ok=True)
        out_path.write_text(report)

        # Update state
        new_entries = [
            {"url": p["url"], "requested_at": today, "source": "daily-gsc-indexing-prep"}
            for p in candidates[:DAILY_QUOTA]
        ]
        state.setdefault("submitted", []).extend(new_entries)
        # Clear deferred entries that were just submitted
        deferred_urls_submitted = {e["url"] for e in new_entries}
        state["deferred_to_tomorrow"] = [
            d for d in state.get("deferred_to_tomorrow", [])
            if d["url"] not in deferred_urls_submitted
        ]
        state["last_run"] = today
        state.setdefault("runs_history", []).append({
            "date": today,
            "submitted_count": len(new_entries),
            "quota_exceeded": False,
            "deferred_count": 0,
        })
        save_state(state)
        print(f"Wrote {out_path} — {len(new_entries)} URLs queued.")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
