"""Reconcile section sitemaps with on-disk, indexable HTML files.

Self-healing: each run PRUNES sitemap entries whose file is missing or carries a
`noindex` robots meta (these caused GSC "Not found (404)" and "Excluded by noindex"
buckets), and ADDS any indexable file not yet listed. Never lists noindex redirect
stubs or deleted pages.
"""
import re, shutil
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime, timezone

# Resolve repo root relative to this script so it works in any session/checkout.
BASE = Path(__file__).resolve().parents[1]
TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")
STAMP_UTC = datetime.now(timezone.utc).strftime("%Y%m%dT%H%MZ")
DOMAIN = "https://supplementscore.org"

SECTION_TO_SITEMAP = {
    "compare":   "sitemap-compare.xml",
    "condition": "sitemap-conditions.xml",
    "for":       "sitemap-for.xml",
    "stack":     "sitemap-stacks.xml",
    "m":         "sitemap-medications.xml",
}

NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

_NOINDEX_RE = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]*noindex', re.I)


def is_indexable(path: Path) -> bool:
    """A file is sitemap-eligible only if it exists and is not noindex."""
    if not path.is_file():
        return False
    try:
        head = path.read_text(encoding="utf-8", errors="replace")[:20000]
    except OSError:
        return False
    return _NOINDEX_RE.search(head) is None


def section_files(sec: str) -> list:
    """Indexable .html files in a section dir (excludes index.html, .bak, noindex)."""
    sec_dir = BASE / sec
    if not sec_dir.is_dir():
        return []
    # Includes the section index.html hub when it is indexable — those hub pages
    # belong in the sitemap (they are not duplicated in sitemap-hubs.xml).
    return sorted(
        p.name for p in sec_dir.glob("*.html")
        if ".bak-" not in p.name and is_indexable(p)
    )


def make_url_entry(sec: str, filename: str) -> str:
    loc = f"{DOMAIN}/{sec}/{filename}"
    return (f'  <url><loc>{loc}</loc><lastmod>{TODAY}</lastmod>'
            f'<changefreq>monthly</changefreq><priority>0.6</priority></url>\n')


def validate_xml(text: str) -> tuple[bool, str]:
    try:
        ET.fromstring(text)
        return True, ""
    except ET.ParseError as e:
        return False, str(e)


def loc_to_filename(sec: str, loc: str) -> str | None:
    prefix = f"{DOMAIN}/{sec}/"
    if not loc.startswith(prefix):
        return None
    return loc[len(prefix):].split("?")[0].split("#")[0]


def process():
    results = []
    for sec, sm_name in SECTION_TO_SITEMAP.items():
        sm_path = BASE / sm_name
        if not sm_path.exists():
            results.append({"sec": sec, "sitemap": sm_name, "status": "MISSING_SITEMAP",
                            "added": 0, "pruned": 0})
            continue

        text = sm_path.read_text(encoding="utf-8")
        blocks = re.findall(r"<url>.*?</url>", text, re.S)
        on_disk = section_files(sec)          # indexable files only
        on_disk_set = set(on_disk)

        # --- PRUNE: drop blocks whose file is missing, noindex, or malformed ---
        kept_blocks, pruned = [], []
        listed = set()
        for b in blocks:
            m = re.search(r"<loc>(.*?)</loc>", b, re.S)
            if not m:
                pruned.append("(empty <url>)")
                continue
            loc = m.group(1).strip()
            fn = loc_to_filename(sec, loc)
            # Keep only if it maps to a currently-indexable file in this section.
            if fn is not None and fn in on_disk_set:
                kept_blocks.append(b)
                listed.add(fn)
            else:
                pruned.append(loc)

        # --- ADD: indexable files not yet listed ---
        missing = [fn for fn in on_disk if fn not in listed]
        new_entries = "".join(make_url_entry(sec, fn) for fn in missing)

        if not pruned and not missing:
            results.append({"sec": sec, "sitemap": sm_name, "status": "ok",
                            "added": 0, "pruned": 0})
            continue

        header = text[:text.find("<url>")] if "<url>" in text else text.split("</urlset>")[0]
        footer = "</urlset>\n"
        new_text = header + "\n".join(kept_blocks) + ("\n" if kept_blocks else "") + new_entries + footer

        ok, err = validate_xml(new_text)
        if not ok:
            results.append({"sec": sec, "sitemap": sm_name, "status": "ROLLBACK",
                            "rollback_reason": err, "added": 0, "pruned": 0})
            continue

        backup = sm_path.with_suffix(f".xml.bak-{STAMP_UTC}")
        shutil.copy2(sm_path, backup)
        sm_path.write_text(new_text, encoding="utf-8")
        results.append({"sec": sec, "sitemap": sm_name, "status": "ok",
                        "added": len(missing), "pruned": len(pruned),
                        "added_files": missing, "pruned_locs": pruned,
                        "backup": backup.name})

    for r in results:
        print(f"{r['sec']:10s} {r['sitemap']:28s} {r['status']:12s} "
              f"added={r.get('added', 0)} pruned={r.get('pruned', 0)}")

    import json
    out_path = BASE / "reviews" / f"_subreg-sitemaps-{TODAY}.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"State saved to: {out_path.name}")


if __name__ == "__main__":
    process()
