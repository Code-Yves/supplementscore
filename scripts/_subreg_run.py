"""
Subfolder registration — daily run.
Adds orphan files into each section's index.html (both hub-grid card AND SEO-STATIC-INDEX list).
"""
import os, re, shutil, sys, html
from pathlib import Path
from datetime import datetime, timezone

BASE = Path("/sessions/clever-eloquent-wright/mnt/Supplement Score/supplementscore-repo/")
TODAY = "2026-05-20"
STAMP_UTC = datetime.now(timezone.utc).strftime("%Y%m%dT%H%MZ")

# Section -> card metadata
SECTION_META = {
    "compare":   {"tag": "Side-by-side", "h": "h2"},
    "condition": {"tag": "Condition guide", "h": "h3"},
    "for":       {"tag": "Population guide", "h": "h3"},
    "stack":     {"tag": "Goal stack", "h": "h3"},
    "m":         {"tag": "Drug interaction", "h": "h3"},
}

# Per-section cap
PER_SECTION_CAP = 30
TOTAL_CAP = 100

def parse_orphan(path: Path):
    txt = path.read_text(encoding="utf-8", errors="ignore")
    # Title: prefer h1, fall back to title
    h1 = re.search(r'<h1[^>]*>([\s\S]*?)</h1>', txt)
    title = ""
    if h1:
        title = re.sub(r'<[^>]+>', '', h1.group(1)).strip()
    if not title:
        t = re.search(r'<title>([\s\S]*?)</title>', txt)
        if t:
            tt = re.sub(r'<[^>]+>', '', t.group(1)).strip()
            # strip brand suffix
            for sep in [" · SupplementScore", " — SupplementScore", " | SupplementScore"]:
                if tt.endswith(sep):
                    tt = tt[: -len(sep)]
                    break
            title = tt
    title = re.sub(r'\s+', ' ', title).strip()

    desc = ""
    md = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']', txt)
    if md:
        desc = md.group(1).strip()
    desc = re.sub(r'\s+', ' ', desc)[:200]

    lr = re.search(r'last-reviewed:\s*(\d{4}-\d{2}-\d{2})', txt)
    last_rev = lr.group(1) if lr else TODAY

    return {"title": title, "desc": desc, "last_reviewed": last_rev}

def card_html(href: str, title: str, desc: str, last_rev: str, tag: str, h_tag: str) -> str:
    title_e = html.escape(title)
    desc_e = html.escape(desc)
    return (
        f'\n    <a href="{href}" class="hub-card">\n'
        f'      <div class="hub-card-tag">{tag}</div>\n'
        f'      <{h_tag}>{title_e}</{h_tag}>\n'
        f'      <p>{desc_e}</p>\n'
        f'      <div class="meta">Updated {last_rev}</div>\n'
        f'    </a>\n'
    )

def li_html(href: str, title: str) -> str:
    return f'\n    <li><a href="{href}">{html.escape(title)}</a></li>\n'

def find_linked(index_text: str) -> set:
    linked = set()
    for m in re.finditer(r'href=["\']([^"\']+\.html)["\']', index_text):
        href = m.group(1).lstrip("./")
        if "/" not in href and href != "index.html":
            linked.add(href)
    return linked

def insert_card_into_grid(content: str, card: str) -> tuple[str, bool]:
    """Insert after the LAST <a class="hub-card"> ... </a> that appears before the SEO-STATIC-INDEX block.
    Works regardless of grid indentation depth (compare/condition/for use 4-space; m/ uses 2-space)."""
    idx_static = content.find("<!-- SEO-STATIC-INDEX:start")
    if idx_static == -1:
        idx_static = len(content)
    sub = content[:idx_static]
    # Find the last </a> after a hub-card opener
    last_card_close = None
    for m in re.finditer(r'</a>\n', sub):
        # Check if a hub-card opener precedes this </a>
        back = sub[max(0, m.start()-2000):m.start()]
        if 'class="hub-card"' in back.rsplit('<a ', 1)[-1]:
            last_card_close = m
    if last_card_close is None:
        return content, False
    insert_pos = last_card_close.end()
    new_content = content[:insert_pos] + card + content[insert_pos:]
    return new_content, True

def insert_li_into_static_index(content: str, li: str, href: str) -> tuple[str, bool]:
    """Insert li alphabetically by href into the SEO-STATIC-INDEX ul block."""
    start_m = re.search(r'<!-- SEO-STATIC-INDEX:start[^>]*>', content)
    end_m = re.search(r'<!-- SEO-STATIC-INDEX:end', content)
    if not (start_m and end_m):
        return content, False
    block_start = start_m.end()
    block_end = end_m.start()
    block = content[block_start:block_end]

    # Find ul
    ul_open = re.search(r'<ul[^>]*>', block)
    ul_close = block.rfind("</ul>")
    if not ul_open or ul_close == -1:
        return content, False
    ul_inner_start = ul_open.end()
    ul_inner = block[ul_inner_start:ul_close]

    # Find existing li entries sorted by href; pick insertion point alphabetically
    entries = list(re.finditer(r'\n\s*<li><a href="([^"]+)">[\s\S]*?</a></li>\n', ul_inner))
    insert_at = None
    for ent in entries:
        ent_href = ent.group(1)
        if href < ent_href:
            insert_at = ent.start()
            break
    if insert_at is None:
        # append before closing — at end of ul_inner
        insert_at = len(ul_inner)
    new_ul_inner = ul_inner[:insert_at] + li + ul_inner[insert_at:]
    new_block = block[:ul_inner_start] + new_ul_inner + block[ul_close:]
    new_content = content[:block_start] + new_block + content[block_end:]
    return new_content, True

def validate_html(text: str) -> tuple[bool, str]:
    try:
        from html.parser import HTMLParser
        class P(HTMLParser):
            def __init__(self):
                super().__init__()
                self.errs = []
            def error(self, message):
                self.errs.append(message)
        p = P()
        p.feed(text)
        # basic structural checks
        if text.count("<html") < 1 or text.count("</html>") < 1:
            return False, "missing <html>/</html>"
        if text.count("<body") < 1 or text.count("</body>") < 1:
            return False, "missing <body>/</body>"
        return True, ""
    except Exception as e:
        return False, str(e)

def process_section(sec: str, dry_run=False) -> dict:
    sec_dir = BASE / sec
    out = {"section": sec, "disk": 0, "linked_before": 0, "linked_after": 0,
           "orphans_detected": [], "orphans_registered": [], "backup": None,
           "rollback": False, "rollback_reason": None}

    if not sec_dir.is_dir():
        out["error"] = "section folder missing"
        return out

    files = sorted([p.name for p in sec_dir.glob("*.html")
                    if p.name != "index.html" and ".bak-" not in p.name])
    out["disk"] = len(files)

    idx_path = sec_dir / "index.html"
    if not idx_path.exists():
        out["error"] = "index.html missing"
        return out

    content = idx_path.read_text(encoding="utf-8", errors="ignore")
    linked_before = find_linked(content)
    out["linked_before"] = len(linked_before)

    orphans = [f for f in files if f not in linked_before]
    out["orphans_detected"] = orphans

    if not orphans:
        out["linked_after"] = len(linked_before)
        return out

    cap = min(PER_SECTION_CAP, len(orphans))
    to_register = orphans[:cap]

    meta = SECTION_META[sec]

    # Backup
    backup_path = idx_path.with_suffix(f".html.bak-{STAMP_UTC}")
    shutil.copy2(idx_path, backup_path)
    out["backup"] = backup_path.name

    new_content = content
    registered = []
    for fn in to_register:
        info = parse_orphan(sec_dir / fn)
        if not info["title"]:
            info["title"] = fn.replace(".html", "").replace("-", " ").title()
        if not info["desc"]:
            info["desc"] = info["title"]
        card = card_html(fn, info["title"], info["desc"], info["last_reviewed"],
                         meta["tag"], meta["h"])
        li = li_html(fn, info["title"])
        # Insert into grid
        new_content2, ok1 = insert_card_into_grid(new_content, card)
        if not ok1:
            continue
        # Insert into static index
        new_content3, ok2 = insert_li_into_static_index(new_content2, li, fn)
        if not ok2:
            # Roll back this card insertion
            continue
        new_content = new_content3
        registered.append({"file": fn, "title": info["title"]})

    # Write new content
    if dry_run:
        out["orphans_registered"] = registered
        out["linked_after"] = len(find_linked(new_content))
        return out

    idx_path.write_text(new_content, encoding="utf-8")

    # Validate
    ok, err = validate_html(new_content)
    if not ok:
        # Auto-rollback
        shutil.copy2(backup_path, idx_path)
        out["rollback"] = True
        out["rollback_reason"] = err
        out["linked_after"] = len(linked_before)
        return out

    out["orphans_registered"] = registered
    out["linked_after"] = len(find_linked(new_content))
    return out

def main():
    results = []
    total = 0
    for sec in ["compare", "condition", "for", "stack", "m"]:
        if total >= TOTAL_CAP:
            results.append({"section": sec, "skipped": "total cap reached"})
            continue
        r = process_section(sec, dry_run=False)
        results.append(r)
        total += len(r.get("orphans_registered", []))

    # Summary
    print("=" * 60)
    for r in results:
        sec = r["section"]
        if "error" in r:
            print(f"{sec}: ERROR {r['error']}")
            continue
        if r.get("skipped"):
            print(f"{sec}: SKIPPED {r['skipped']}")
            continue
        regd = len(r.get("orphans_registered", []))
        rb = " [ROLLBACK]" if r.get("rollback") else ""
        print(f"{sec}: disk={r['disk']} before={r['linked_before']} after={r['linked_after']} "
              f"orphans_detected={len(r['orphans_detected'])} registered={regd}{rb}")
        if r.get("rollback"):
            print(f"   rollback_reason: {r['rollback_reason']}")
            print(f"   backup: {r['backup']}")
    # Persist results to JSON for the report step
    import json
    out_path = BASE / "reviews" / f"_subreg-state-{TODAY}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nState saved to: {out_path.name}")

if __name__ == "__main__":
    main()
