#!/usr/bin/env python3
"""Weekly title/meta SEO audit and auto-fixer for SupplementScore.

Scans all HTML pages in a/, s/, condition/, compare/, for/, stack/, m/, plus
root pages. Flags titles by pixel-width (chars*8.5), meta descriptions by
length, and primary-keyword position in title.

Auto-fixes (capped at 80 file modifications):
  - Append " — SupplementScore" suffix when title has room and lacks it.
  - Strip duplicate suffix.
  - Sentence-aware truncate over-long meta descriptions (>170 chars).

Queues all unresolved rewrite candidates to
reviews/action-queues/title-meta-rewrite.json (preserving older entries by
filepath+issue key).

Outputs reviews/title-meta-audit-YYYY-MM-DD.md.
"""

from __future__ import annotations

import json
import os
import re
import shutil
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

# TODO: stale session path — fix me
REPO = Path("/sessions/kind-laughing-gauss/mnt/Supplement Score/supplementscore-repo")
TODAY = date(2026, 5, 28).isoformat()

# Directories to scan (relative to REPO)
SUB_DIRS = ["a", "s", "condition", "compare", "for", "stack", "m"]

# Root pages to scan (no recursion into other dirs)
ROOT_PAGES = [
    "404.html", "about.html", "accessibility.html", "article.html",
    "bibliography.html", "biomarker.html", "browse.html", "build.html",
    "changed-our-mind.html", "compare.html", "condition.html", "discover.html",
    "editorial-board.html", "editorial-pipeline.html", "funder-policy.html",
    "glossary.html", "index.html", "landing.html", "medication.html",
    "methodology.html", "privacy.html", "search.html", "sources.html",
    "supplement.html", "symptom.html",
]

# Pixel-width estimate
PX_PER_CHAR = 8.5
PX_TRUNCATION = 580  # ~68 chars
PX_UNDER = 200       # ~24 chars
DESC_MIN = 50
DESC_MAX = 155
DESC_HARD_MAX = 170  # threshold for sentence-aware truncation

SUFFIX_EM = " — SupplementScore"        # em-dash space SupplementScore
SUFFIX_EM_ENT = " &mdash; SupplementScore"
SUFFIX_PIPE = " | SupplementScore"
SUFFIX_VARIANT_SPACE = " — Supplement Score"  # with space, used on some pages
SUFFIX_DOT = " · SupplementScore"
SUFFIXES = [SUFFIX_EM, SUFFIX_EM_ENT, SUFFIX_PIPE, SUFFIX_VARIANT_SPACE, SUFFIX_DOT]

# Stopwords NOT counted as keyword positions
STOPWORDS = set("""
a an the of and or but in on at to for from with by is are was were be been being
""".split())

AUTO_FIX_CAP = 80

# Regex patterns
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESC_RE = re.compile(
    r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>',
    re.IGNORECASE | re.DOTALL,
)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.IGNORECASE | re.DOTALL)


def html_text(s: str) -> str:
    """Cheap HTML→text: strip tags, decode minimal entities, collapse ws."""
    s = re.sub(r"<[^>]+>", " ", s)
    s = (
        s.replace("&mdash;", "—")
        .replace("&ndash;", "–")
        .replace("&amp;", "&")
        .replace("&nbsp;", " ")
        .replace("&#8212;", "—")
        .replace("&#8211;", "–")
        .replace("&#039;", "'")
        .replace("&apos;", "'")
        .replace("&quot;", '"')
    )
    s = re.sub(r"\s+", " ", s).strip()
    return s


def pixel_width(text: str) -> float:
    return len(text) * PX_PER_CHAR


def has_any_suffix(title: str) -> bool:
    return any(suf in title for suf in SUFFIXES)


def first_keyword_from_h1(h1: str) -> str:
    """Pick the lead noun-ish word from the H1 (first non-stopword token)."""
    tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", h1.lower())
    for t in tokens:
        if t not in STOPWORDS and len(t) > 1:
            return t
    return tokens[0] if tokens else ""


def keyword_in_first_n_words(title_text: str, keyword: str, n: int = 5) -> bool:
    if not keyword:
        return True  # nothing to check; don't flag
    tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", title_text.lower())
    return keyword in tokens[:n]


def sentence_aware_trim(desc: str, soft_max: int = DESC_MAX) -> str | None:
    """If desc has a complete sentence ending before soft_max, trim there.
    Returns the trimmed string, or None if no safe trim point.
    """
    # Find last '. ' before soft_max
    cut_zone = desc[: soft_max + 1]
    idx = cut_zone.rfind(". ")
    if idx == -1:
        # also accept "! " or "? "
        for sep in ("! ", "? "):
            j = cut_zone.rfind(sep)
            if j > idx:
                idx = j
    if idx > 30:  # need at least some content
        return desc[: idx + 1].strip()
    return None


def gather_html_files() -> list[Path]:
    out: list[Path] = []
    for d in SUB_DIRS:
        p = REPO / d
        if not p.is_dir():
            continue
        for f in sorted(p.iterdir()):
            if f.suffix == ".html" and f.is_file():
                out.append(f)
    for r in ROOT_PAGES:
        p = REPO / r
        if p.is_file():
            out.append(p)
    return out


def safe_replace_title(html: str, old_title: str, new_title: str) -> str:
    """Replace <title>...</title> content only. Do not touch og/twitter etc."""
    pattern = re.compile(
        r"(<title>)" + re.escape(old_title) + r"(</title>)",
        re.IGNORECASE,
    )
    return pattern.sub(lambda m: m.group(1) + new_title + m.group(2), html, count=1)


def safe_replace_desc(html: str, old_desc: str, new_desc: str) -> str:
    """Replace meta description content only (single tag)."""
    # We escape old_desc but it may contain entities; we matched on raw, so reuse raw.
    pattern = re.compile(
        r'(<meta\s+name=["\']description["\']\s+content=["\'])'
        + re.escape(old_desc)
        + r'(["\']\s*/?>)',
        re.IGNORECASE,
    )
    return pattern.sub(lambda m: m.group(1) + new_desc + m.group(2), html, count=1)


def main() -> int:
    files = gather_html_files()
    section_counts: Counter[str] = Counter()
    issues: dict[str, list[dict]] = defaultdict(list)
    titles_seen: dict[str, list[str]] = defaultdict(list)

    auto_fixes: list[dict] = []
    spot_diffs: list[dict] = []

    # Load existing rewrite queue for dedup
    queue_path = REPO / "reviews/action-queues/title-meta-rewrite.json"
    if queue_path.exists():
        with open(queue_path) as f:
            existing_queue = json.load(f)
    else:
        existing_queue = []
    existing_keys = {(e["filepath"], e["issue"]) for e in existing_queue}
    new_queue_entries: list[dict] = []

    fixes_done = 0

    for fp in files:
        rel = fp.relative_to(REPO).as_posix()
        section = fp.parent.name if fp.parent != REPO else "root"
        if section not in SUB_DIRS:
            section = "root"
        section_counts[section] += 1

        try:
            html = fp.read_text(encoding="utf-8")
        except Exception as e:
            issues["read-error"].append({"filepath": rel, "error": str(e)})
            continue

        # Extract title
        m_title = TITLE_RE.search(html)
        if not m_title:
            issues["title-missing"].append({"filepath": rel})
            continue
        raw_title = m_title.group(1).strip()
        title_text = html_text(raw_title)

        # Extract description (first match wins)
        m_desc = META_DESC_RE.search(html)
        raw_desc = m_desc.group(1) if m_desc else None
        desc_text = html_text(raw_desc) if raw_desc else None

        # Extract H1
        m_h1 = H1_RE.search(html)
        h1_text = html_text(m_h1.group(1)) if m_h1 else ""

        # Track titles for duplicate detection (strip suffixes)
        title_key = title_text
        for suf in SUFFIXES:
            if title_key.endswith(suf):
                title_key = title_key[: -len(suf)].strip()
                break
        titles_seen[title_key.lower()].append(rel)

        # --- Title checks ---
        title_px = pixel_width(title_text)
        title_too_long = title_px > PX_TRUNCATION
        title_too_short = title_px < PX_UNDER
        has_suffix = has_any_suffix(raw_title) or has_any_suffix(title_text)

        # Duplicate-suffix detection (auto-fix)
        # Count occurrences of any canonical brand string
        brand_occ = title_text.count("SupplementScore") + title_text.count("Supplement Score")
        if brand_occ >= 2 and fixes_done < AUTO_FIX_CAP:
            # Strip trailing duplicate(s) – keep the last canonical " — SupplementScore"
            new_title_text = title_text
            # Repeatedly strip trailing brand suffix if there are still 2+
            while (
                new_title_text.count("SupplementScore")
                + new_title_text.count("Supplement Score")
            ) >= 2:
                stripped = False
                for suf in SUFFIXES:
                    if new_title_text.endswith(suf):
                        new_title_text = new_title_text[: -len(suf)].strip()
                        stripped = True
                        break
                if not stripped:
                    break
            if (
                new_title_text != title_text
                and new_title_text.endswith("SupplementScore") is False
            ):
                # Ensure exactly one canonical suffix remains
                final = new_title_text.rstrip(" -—|·") + SUFFIX_EM
                # Replace raw title in HTML
                new_raw = safe_replace_title(html, raw_title, final)
                if new_raw != html:
                    # Backup once
                    bkp = fp.with_suffix(fp.suffix + ".bak-titlemeta")
                    if not bkp.exists():
                        shutil.copy2(fp, bkp)
                    fp.write_text(new_raw, encoding="utf-8")
                    html = new_raw  # update working copy
                    fixes_done += 1
                    auto_fixes.append(
                        {"filepath": rel, "type": "dup-suffix-strip",
                         "before": title_text, "after": final}
                    )
                    if len(spot_diffs) < 3:
                        spot_diffs.append(
                            {"filepath": rel, "field": "title",
                             "before": title_text, "after": final}
                        )
                    title_text = final
                    raw_title = final
                    title_px = pixel_width(final)
                    has_suffix = True
                    title_too_long = title_px > PX_TRUNCATION

        # Auto-add suffix
        if (
            not has_suffix
            and title_px < 450  # room
            and fixes_done < AUTO_FIX_CAP
        ):
            candidate = title_text.rstrip() + SUFFIX_EM
            if pixel_width(candidate) <= PX_TRUNCATION:
                new_raw = safe_replace_title(html, raw_title, candidate)
                if new_raw != html:
                    bkp = fp.with_suffix(fp.suffix + ".bak-titlemeta")
                    if not bkp.exists():
                        shutil.copy2(fp, bkp)
                    fp.write_text(new_raw, encoding="utf-8")
                    html = new_raw
                    fixes_done += 1
                    auto_fixes.append(
                        {"filepath": rel, "type": "suffix-add",
                         "before": title_text, "after": candidate}
                    )
                    if len(spot_diffs) < 3:
                        spot_diffs.append(
                            {"filepath": rel, "field": "title",
                             "before": title_text, "after": candidate}
                        )
                    title_text = candidate
                    raw_title = candidate
                    title_px = pixel_width(candidate)
                    has_suffix = True

        # Flag (after potential fixes)
        if title_too_long:
            issues["title-too-long"].append(
                {"filepath": rel, "current": title_text, "px": int(title_px),
                 "chars": len(title_text)}
            )
        if title_too_short:
            issues["title-too-short"].append(
                {"filepath": rel, "current": title_text, "px": int(title_px),
                 "chars": len(title_text)}
            )
        if not has_suffix:
            issues["title-no-suffix"].append(
                {"filepath": rel, "current": title_text}
            )

        # Keyword-position
        kw = first_keyword_from_h1(h1_text)
        if kw and not keyword_in_first_n_words(title_text, kw, 5):
            issues["keyword-position"].append(
                {"filepath": rel, "h1_keyword": kw, "current": title_text}
            )

        # --- Description checks ---
        if not raw_desc:
            issues["desc-empty"].append({"filepath": rel})
        else:
            dlen = len(desc_text)
            if dlen < DESC_MIN:
                issues["desc-too-short"].append(
                    {"filepath": rel, "current": desc_text, "len": dlen}
                )
            elif dlen > DESC_MAX and dlen <= DESC_HARD_MAX:
                # In yellow zone — queue but no auto-fix
                issues["desc-too-long"].append(
                    {"filepath": rel, "current": desc_text, "len": dlen,
                     "severity": "soft"}
                )
            elif dlen > DESC_HARD_MAX:
                # Try sentence-aware trim
                trimmed = sentence_aware_trim(desc_text, DESC_MAX)
                fixed = False
                if (
                    trimmed
                    and DESC_MIN <= len(trimmed) <= DESC_MAX
                    and fixes_done < AUTO_FIX_CAP
                ):
                    # Replace raw description content in HTML
                    new_raw = safe_replace_desc(html, raw_desc, trimmed)
                    if new_raw != html:
                        bkp = fp.with_suffix(fp.suffix + ".bak-titlemeta")
                        if not bkp.exists():
                            shutil.copy2(fp, bkp)
                        fp.write_text(new_raw, encoding="utf-8")
                        html = new_raw
                        fixes_done += 1
                        fixed = True
                        auto_fixes.append(
                            {"filepath": rel, "type": "desc-trim",
                             "before": desc_text[:200], "after": trimmed}
                        )
                        if len(spot_diffs) < 3:
                            spot_diffs.append(
                                {"filepath": rel, "field": "meta-description",
                                 "before": desc_text, "after": trimmed}
                            )
                if not fixed:
                    issues["desc-too-long"].append(
                        {"filepath": rel, "current": desc_text[:240], "len": dlen,
                         "severity": "hard"}
                    )

    # Duplicate titles (after suffix-stripping)
    dup_titles = {k: v for k, v in titles_seen.items() if len(v) > 1 and k}
    for tk, paths in dup_titles.items():
        for p in paths:
            issues["duplicate-title"].append(
                {"filepath": p, "title_stem": tk, "siblings": [x for x in paths if x != p]}
            )

    # ----- Update rewrite queue -----
    def to_queue_issue(category: str) -> str | None:
        return {
            "title-too-long": "title-too-long",
            "title-no-suffix": "title-no-suffix",
            "title-too-short": "title-too-short",
            "desc-too-short": "desc-too-short",
            "desc-too-long": "desc-too-long",
            "desc-empty": "desc-empty",
            "keyword-position": "keyword-position",
            "duplicate-title": "duplicate-title",
            "title-missing": "title-missing",
        }.get(category)

    priority_map = {
        "desc-empty": 1,
        "title-missing": 1,
        "duplicate-title": 2,
        "title-too-long": 2,
        "desc-too-long": 3,
        "keyword-position": 3,
        "title-no-suffix": 4,
        "desc-too-short": 4,
        "title-too-short": 5,
    }

    for cat, items in issues.items():
        qi = to_queue_issue(cat)
        if not qi:
            continue
        for it in items:
            key = (it["filepath"], qi)
            if key in existing_keys:
                continue
            existing_keys.add(key)
            new_queue_entries.append(
                {
                    "filepath": it["filepath"],
                    "issue": qi,
                    "current": it.get("current", ""),
                    "first_seen": TODAY,
                    "priority": priority_map.get(qi, 3),
                }
            )

    if new_queue_entries:
        combined = existing_queue + new_queue_entries
        with open(queue_path, "w") as f:
            json.dump(combined, f, indent=2)

    # ----- Write audit report -----
    report_path = REPO / f"reviews/title-meta-audit-{TODAY}.md"
    lines: list[str] = []
    lines.append(f"# Title / Meta SEO Audit — {TODAY}\n")

    # Escalations
    desc_empty_n = len(issues.get("desc-empty", []))
    dup_n = len({tuple(sorted([d["filepath"]] + d["siblings"])) for d in issues.get("duplicate-title", [])})
    if desc_empty_n > 50:
        lines.append(f"\n> **P0 — meta description coverage gap**: {desc_empty_n} pages have empty meta descriptions.\n")
    if dup_n > 30:
        lines.append(f"\n> **Duplicate-title cluster — needs editorial decision**: {dup_n} duplicate title groups detected.\n")

    lines.append("\n## Pages scanned\n")
    total = sum(section_counts.values())
    lines.append(f"Total: **{total}**\n")
    for sec in SUB_DIRS + ["root"]:
        if section_counts.get(sec):
            lines.append(f"- `{sec}/`: {section_counts[sec]}")
    lines.append("")

    lines.append("\n## Issues by category\n")
    for cat in [
        "title-too-long", "title-too-short", "title-no-suffix",
        "desc-too-short", "desc-too-long", "desc-empty",
        "keyword-position", "duplicate-title", "title-missing",
    ]:
        n = len(issues.get(cat, []))
        lines.append(f"- **{cat}**: {n}")
    lines.append("")

    lines.append(f"\n## Auto-fixes applied this run: {fixes_done} / {AUTO_FIX_CAP}\n")
    fix_type_counts = Counter(f["type"] for f in auto_fixes)
    for t, c in fix_type_counts.most_common():
        lines.append(f"- {t}: {c}")
    lines.append("")
    if auto_fixes:
        lines.append("### Samples (first 10)\n")
        for f in auto_fixes[:10]:
            lines.append(f"- `{f['filepath']}` — {f['type']}")
            lines.append(f"  - before: `{f['before'][:140]}`")
            lines.append(f"  - after:  `{f['after'][:140]}`")
        lines.append("")

    lines.append(f"\n## Queue updates\n")
    lines.append(f"- new entries appended: **{len(new_queue_entries)}**")
    lines.append(f"- total queue length now: **{len(existing_queue) + len(new_queue_entries)}**")
    lines.append("")

    # Top 10 worst offenders by title pixel width
    too_long = sorted(
        issues.get("title-too-long", []),
        key=lambda x: x.get("px", 0),
        reverse=True,
    )[:10]
    lines.append("\n## Top-10 worst title-length offenders\n")
    if too_long:
        for x in too_long:
            lines.append(f"- {x['px']}px ({x['chars']}c) — `{x['filepath']}`")
            lines.append(f"  > {x['current']}")
    else:
        lines.append("_None._")
    lines.append("")

    # Spot diffs
    lines.append("\n## Spot-checked diffs (3)\n")
    if spot_diffs:
        for d in spot_diffs[:3]:
            lines.append(f"### `{d['filepath']}` — {d['field']}")
            lines.append("")
            lines.append("**Before**\n")
            lines.append(f"> {d['before']}\n")
            lines.append("**After**\n")
            lines.append(f"> {d['after']}\n")
    else:
        lines.append("_No auto-fixes this run; no diffs to display._")
    lines.append("")

    report_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"DONE. fixes={fixes_done}, new_queue={len(new_queue_entries)}, report={report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
