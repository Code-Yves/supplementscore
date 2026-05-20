"""Update section sitemaps with missing URLs."""
import re, shutil
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime, timezone

BASE = Path("/sessions/clever-eloquent-wright/mnt/Supplement Score/supplementscore-repo/")
TODAY = "2026-05-20"
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

def collect_sitemap_urls(sm_path: Path) -> set:
    text = sm_path.read_text(encoding="utf-8")
    return set(re.findall(r'<loc>([^<]+)</loc>', text))

def section_files(sec: str) -> list:
    sec_dir = BASE / sec
    files = sorted([p.name for p in sec_dir.glob("*.html")
                    if p.name != "index.html" and ".bak-" not in p.name])
    return files

def make_url_entry(sec: str, filename: str) -> str:
    loc = f"{DOMAIN}/{sec}/{filename}"
    return f'  <url><loc>{loc}</loc><lastmod>{TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n'

def validate_xml(text: str) -> tuple[bool, str]:
    try:
        ET.fromstring(text)
        return True, ""
    except ET.ParseError as e:
        return False, str(e)

def process():
    results = []
    for sec, sm_name in SECTION_TO_SITEMAP.items():
        sm_path = BASE / sm_name
        if not sm_path.exists():
            results.append({"sec": sec, "sitemap": sm_name, "status": "MISSING_SITEMAP", "added": 0})
            continue
        existing = collect_sitemap_urls(sm_path)
        on_disk = section_files(sec)

        missing = []
        for fn in on_disk:
            url = f"{DOMAIN}/{sec}/{fn}"
            if url not in existing:
                missing.append(fn)

        if not missing:
            results.append({"sec": sec, "sitemap": sm_name, "status": "ok", "added": 0})
            continue

        # Backup
        backup = sm_path.with_suffix(f".xml.bak-{STAMP_UTC}")
        shutil.copy2(sm_path, backup)

        text = sm_path.read_text(encoding="utf-8")
        # Insert before closing </urlset>
        close_idx = text.rfind("</urlset>")
        if close_idx == -1:
            results.append({"sec": sec, "sitemap": sm_name, "status": "BAD_FORMAT", "added": 0})
            continue
        new_entries = "".join(make_url_entry(sec, fn) for fn in missing)
        new_text = text[:close_idx] + new_entries + text[close_idx:]

        # Validate
        ok, err = validate_xml(new_text)
        if not ok:
            shutil.copy2(backup, sm_path)
            results.append({"sec": sec, "sitemap": sm_name, "status": "ROLLBACK",
                           "rollback_reason": err, "added": 0, "backup": backup.name})
            continue

        sm_path.write_text(new_text, encoding="utf-8")
        results.append({"sec": sec, "sitemap": sm_name, "status": "ok",
                       "added": len(missing), "files": missing, "backup": backup.name})

    # Print
    for r in results:
        print(f"{r['sec']:10s} {r['sitemap']:28s} {r['status']:12s} added={r['added']}")

    # Persist
    import json
    out_path = BASE / "reviews" / f"_subreg-sitemaps-{TODAY}.json"
    out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"State saved to: {out_path.name}")

if __name__ == "__main__":
    process()
