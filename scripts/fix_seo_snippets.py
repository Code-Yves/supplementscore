#!/usr/bin/env python3
"""Finish on-page snippets and supplement-to-brand links.

Meta descriptions that end in an ellipsis are cut mid-sentence. This rewrites
them from the page's own summary, ending on a sentence or clause, and adds a
short list of verified-brand pages that already link to that supplement.
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TODAY = "2026-10-18"
changed = set()


def plain(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    s = s.replace("…", " ").replace("...", " ")
    return re.sub(r"\s+", " ", s).strip()


def fit(text: str, limit: int = 155) -> str:
    text = plain(text)
    if not text:
        return ""
    if len(text) <= limit and text[-1] in ".!?":
        return text
    # Split on sentence endings only. A digit or lowercase letter after the
    # space is a decimal ("0.7 kg") or an abbreviation, not a new sentence.
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)
    out = ""
    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue
        candidate = (out + " " + sent).strip()
        if len(candidate) <= limit:
            out = candidate
            continue
        if out:
            break
        chunk = sent[: limit + 1]
        cuts = [chunk.rfind(sep) for sep in (". ", "; ", ", ", " — ", " – ")]
        cut = max(cuts)
        if cut >= 50:
            piece = sent[:cut].rstrip(",;: ")
            return piece if piece.endswith((".", "!", "?")) else piece + "."
        words = chunk.rsplit(" ", 1)[0].split()
        dangling = {
            "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "with",
            "without", "including", "that", "which", "by", "from", "as", "at",
            "into", "over", "than", "via", "its", "their",
        }
        while words and words[-1].lower().strip(",;:—") in dangling:
            words.pop()
        piece = " ".join(words).rstrip(",;:—- ")
        if not piece.endswith((".", "!", "?")):
            piece += "."
        return piece
    return out


def attr_esc(s: str) -> str:
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def set_meta_content(doc: str, name: str, value: str) -> str:
    """Replace content= on a meta whose name or property equals `name`."""

    def repl(m):
        tag = m.group(0)
        if not re.search(r'(?:name|property)=["\']' + re.escape(name) + r'["\']', tag, re.I):
            return tag

        def crepl(cm):
            q = cm.group(1)
            return "content=" + q + attr_esc(value) + q

        tag2, n = re.subn(r"content=([\"'])(.*?)\1", crepl, tag, count=1, flags=re.S)
        return tag2 if n else tag

    return re.sub(r"<meta\b[^>]*>", repl, doc, flags=re.I)


def _meta_tag(doc: str, name: str):
    for m in re.finditer(r"<meta\b[^>]*>", doc, re.I):
        tag = m.group(0)
        if re.search(r'(?:name|property)=["\']' + re.escape(name) + r'["\']', tag, re.I):
            return tag
    return None


def meta_content(doc: str, name: str):
    tag = _meta_tag(doc, name)
    if not tag:
        return None
    m = re.search(r'content=(["\'])(.*?)\1', tag, re.S)
    return html.unescape(m.group(2)) if m else None


def rewrite_jsonld(doc: str, full: str) -> str:
    def sub(m):
        raw = m.group(1)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return m.group(0)

        touched = False

        def walk(o):
            nonlocal touched
            if isinstance(o, dict):
                desc = o.get("description")
                if isinstance(desc, str) and (desc.endswith("…") or desc.endswith("...")):
                    limit = 480 if len(desc) > 180 else 155
                    o["description"] = fit(full, limit)
                    touched = True
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)

        walk(data)
        if not touched:
            return m.group(0)
        dumped = json.dumps(data, ensure_ascii=False, indent=2)
        return '<script type="application/ld+json">\n' + dumped + "\n</script>"

    return re.sub(
        r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
        sub,
        doc,
        flags=re.S,
    )


def tldr_of(doc: str) -> str:
    m = re.search(r'<p class="det-tldr">(.*?)</p>', doc, re.S)
    if m:
        return plain(m.group(1))
    m = re.search(r'<p class="ca-lede">(.*?)</p>', doc, re.S)
    if m:
        return plain(m.group(1))
    m = re.search(r"<p>(.*?)</p>", doc, re.S)
    return plain(m.group(1)) if m else ""


def fix_ellipsis_page(path: pathlib.Path) -> bool:
    doc = path.read_text(encoding="utf-8", errors="ignore")
    if "noindex" in doc[:2500] and "http-equiv=\"refresh\"" in doc[:1500]:
        return False
    desc = meta_content(doc, "description")
    if not desc or not (desc.endswith("…") or desc.endswith("...")):
        return False
    full = tldr_of(doc) or desc
    # Prefer an already-complete social description when the meta was clipped.
    og = meta_content(doc, "og:description")
    if og and not og.endswith("…") and not og.endswith("...") and len(og) >= 40 and abs(len(og) - len(desc)) > 15:
        short = fit(og, 160)
    else:
        short = fit(full, 155)
    if not short or short == desc:
        return False
    new = set_meta_content(doc, "description", short)
    # Keep social tags in sync when they were the same clipped sentence.
    for key in ("og:description", "twitter:description"):
        cur = meta_content(new, key)
        if cur and (cur.endswith("…") or cur.endswith("...") or cur == desc):
            new = set_meta_content(new, key, short)
    new = rewrite_jsonld(new, full)
    if new != doc:
        path.write_text(new, encoding="utf-8")
        changed.add(path.relative_to(ROOT).as_posix())
        return True
    return False


def brand_map():
    mapping = {}
    for path in (ROOT / "brand").glob("*.html"):
        doc = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r'name=["\']robots["\'][^>]*noindex', doc, re.I):
            continue
        h1 = re.search(r"<h1>([^<]+)</h1>", doc)
        name = html.unescape(h1.group(1)).strip() if h1 else path.stem
        for slug in re.findall(r'href="/supplement/([a-z0-9-]+)\.html"', doc):
            mapping.setdefault(slug, []).append((name, f"/brand/{path.name}"))
    for slug, rows in mapping.items():
        # unique, stable, cap later
        seen = set()
        uniq = []
        for row in sorted(rows, key=lambda r: r[0].lower()):
            if row[1] in seen:
                continue
            seen.add(row[1])
            uniq.append(row)
        mapping[slug] = uniq
    return mapping


def add_brand_links(brands: dict) -> int:
    n = 0
    for slug, rows in brands.items():
        path = ROOT / "supplement" / f"{slug}.html"
        if not path.is_file():
            continue
        doc = path.read_text(encoding="utf-8", errors="ignore")
        if 'aria-label="Verified brands"' in doc:
            continue
        if 'id="det-root"' not in doc:
            continue
        items = []
        for name, href in rows[:6]:
            items.append(f'<li><a href="{href}">{html.escape(name)}</a></li>')
        items.append('<li><a href="/brands.html">All verified brands</a></li>')
        nav = (
            '<nav class="det-related-supps" aria-label="Verified brands">'
            "<h2>Checked brands</h2><ul>" + "".join(items) + "</ul></nav>"
        )
        new, count = re.subn(r"</main>", nav + "</main>", doc, count=1)
        if count and new != doc:
            path.write_text(new, encoding="utf-8")
            changed.add(path.relative_to(ROOT).as_posix())
            n += 1
    return n


def drop_duplicate_descriptions() -> int:
    n = 0
    for path in (ROOT / "a").glob("*.html"):
        doc = path.read_text(encoding="utf-8", errors="ignore")
        tags = list(re.finditer(r"<meta\b[^>]*name=[\"']description[\"'][^>]*>", doc, re.I))
        if len(tags) < 2:
            tags = list(re.finditer(r"<meta\b[^>]*>", doc[:8000], re.I))
            tags = [t for t in tags if re.search(r"name=[\"']description[\"']", t.group(0), re.I)]
            if len(tags) < 2:
                continue
        first = tags[0]
        doc2 = doc[: first.start()] + doc[first.end() :]
        if doc2 != doc:
            path.write_text(doc2, encoding="utf-8")
            changed.add(path.relative_to(ROOT).as_posix())
            n += 1
    return n


def credit_team() -> int:
    n = 0
    skip = {"_archive", ".git", "og", "node_modules"}
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".js", ".mjs", ".md", ".json"}:
            continue
        if any(part in skip for part in path.parts):
            continue
        doc = path.read_text(encoding="utf-8", errors="ignore")
        if "SupplementScore Editorial Team" not in doc and ">Editorial team</a>" not in doc:
            continue
        new = doc.replace("SupplementScore Editorial Team", "SupplementScore team")
        new = new.replace(">Editorial team</a>", ">SupplementScore team</a>")
        if new != doc:
            path.write_text(new, encoding="utf-8")
            changed.add(path.relative_to(ROOT).as_posix())
            n += 1
    return n


def bump_sitemaps():
    loc_re = re.compile(r"<loc>\s*(https://supplementscore\.org[^<]*?)\s*</loc>", re.I)
    date_re = re.compile(r"<lastmod>[^<]*</lastmod>")

    def url_for(rel: str):
        if rel == "index.html":
            return "https://supplementscore.org/"
        return "https://supplementscore.org/" + rel

    wanted = {url_for(rel) for rel in changed if rel.endswith(".html")}
    touched_shards = []
    for sm in ROOT.glob("sitemap*.xml"):
        if sm.name == "sitemap-index.xml":
            continue
        text = sm.read_text(encoding="utf-8")
        parts = re.split(r"(<url>\s*)", text)
        # simpler: walk url blocks
        def repl_block(m):
            block = m.group(0)
            loc = loc_re.search(block)
            if not loc or loc.group(1) not in wanted:
                return block
            if "<lastmod>" in block:
                return date_re.sub(f"<lastmod>{TODAY}</lastmod>", block, count=1)
            return block.replace("</loc>", f"</loc>\n    <lastmod>{TODAY}</lastmod>", 1)

        new = re.sub(r"<url>.*?</url>", repl_block, text, flags=re.S)
        if new != text:
            sm.write_text(new, encoding="utf-8")
            touched_shards.append(sm.name)
    index = ROOT / "sitemap-index.xml"
    if touched_shards and index.is_file():
        text = index.read_text(encoding="utf-8")

        def repl_sm(m):
            block = m.group(0)
            for name in touched_shards:
                if name in block:
                    return date_re.sub(f"<lastmod>{TODAY}</lastmod>", block, count=1)
            return block

        new = re.sub(r"<sitemap>.*?</sitemap>", repl_sm, text, flags=re.S)
        if new != text:
            index.write_text(new, encoding="utf-8")


def apply_canonical_descriptions(descs: dict) -> int:
    """Rewrite supplement metas from the data.js description, not a clipped tldr."""
    n = 0
    for slug, canonical in descs.items():
        path = ROOT / "supplement" / f"{slug}.html"
        if not path.is_file() or not canonical:
            continue
        doc = path.read_text(encoding="utf-8", errors="ignore")
        if 'id="det-root"' not in doc:
            continue
        full = plain(canonical)
        short = fit(full, 155)
        long = full if len(full) <= 480 else fit(full, 480)
        if not short:
            continue
        new = doc
        for key in ("description", "og:description", "twitter:description"):
            cur = meta_content(new, key)
            if cur is None:
                continue
            if cur != short and (cur.endswith("…") or cur.endswith("...") or key == "description" or plain(cur)[:40] == full[:40]):
                new = set_meta_content(new, key, short)

        def sub_tagged(m, full=full, short=short, long=long):
            attrs, raw = m.group(1), m.group(2)
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                return m.group(0)
            touched = False

            def walk(o):
                nonlocal touched
                if isinstance(o, dict):
                    d = o.get("description")
                    if isinstance(d, str) and ("…" in d or d.endswith("...")):
                        o["description"] = long if len(plain(d)) > 180 else short
                        touched = True
                    for v in o.values():
                        walk(v)
                elif isinstance(o, list):
                    for v in o:
                        walk(v)

            walk(data)
            if not touched:
                return m.group(0)
            dumped = json.dumps(data, ensure_ascii=False, indent=2)
            return f"<script{attrs}>\n{dumped}\n</script>"

        new = re.sub(
            r'<script\b([^>]*type="application/ld\+json"[^>]*)>(.*?)</script>',
            sub_tagged,
            new,
            flags=re.S,
        )
        if new != doc:
            path.write_text(new, encoding="utf-8")
            changed.add(path.relative_to(ROOT).as_posix())
            n += 1
    return n


def main():
    ellipsis_n = 0
    for folder in ("supplement", "compare", "a", "hub", "condition", "brand", "interactions", "stack", "sx"):
        base = ROOT / folder
        if not base.is_dir():
            continue
        for path in base.glob("*.html"):
            if fix_ellipsis_page(path):
                ellipsis_n += 1
    brands = add_brand_links(brand_map())
    dupes = drop_duplicate_descriptions()
    credited = credit_team()
    bump_sitemaps()
    print(f"ellipsis rewritten: {ellipsis_n}")
    print(f"brand navs added: {brands}")
    print(f"duplicate descriptions removed: {dupes}")
    print(f"team credit files: {credited}")
    print(f"files touched: {len(changed)}")


if __name__ == "__main__":
    main()
