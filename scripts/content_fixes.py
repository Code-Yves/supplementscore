#!/usr/bin/env python3
"""Bake comparison scores, symptom guides, drug-label text, and kids-product warnings.

  python3 scripts/content_fixes.py --write
  python3 scripts/content_fixes.py --check
"""
from __future__ import annotations

import argparse
import html
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIDS_GUIDE = (
    "/a/kids-multivitamin-gummies-when-daily-use-is-actually-justified-"
    "and-when-just-vitamin-d-is-enough.html"
)
HUBS = {
    "sleep.html": ("Sleep", "/hub/sleep.html"),
    "performance.html": ("Athletic performance", "/hub/athletic-performance.html"),
    "joint-pain.html": ("Joint health", "/hub/joint-health.html"),
    "gut-health.html": ("Probiotics", "/hub/probiotics.html"),
    "anxiety.html": ("Adaptogens", "/hub/adaptogens.html"),
    "mood.html": ("Adaptogens", "/hub/adaptogens.html"),
}
TIERS = {
    "t1": "Tier 1",
    "t2": "Tier 2",
    "t3": "Tier 3",
    "t4": "Tier 4",
}
POP_RE = re.compile(r"\b(kids|children|child|prenatal|infant|toddler)\b", re.I)
# Pages whose headings use short form names that are not the full card title.
MANUAL_COMPARE = {
    "tongkat-ali-vs-fadogia-vs-forskolin-vs-ashwagandha-testosterone.html": [
        "tongkat-ali", "fadogia-agrestis", "coleus-forskohlii", "ashwagandha",
    ],
    "ubiquinone-vs-ubiquinol.html": ["coq10-ubiquinone-classic-form", "coq10"],
    "creatine-forms.html": ["creatine-monohydrate", "creatine-hcl"],
    "k2-mk4-vs-mk7.html": ["vitamin-k2"],
    "adaptogens.html": ["ashwagandha", "rhodiola-rosea", "cordyceps-militaris"],
    "curcumin-formulations.html": ["curcumin", "meriva-curcumin"],
    "probiotic-strains.html": ["probiotics", "lactobacillus-rhamnosus-gg", "saccharomyces-boulardii"],
    "omega-3-forms.html": ["omega-3", "dha", "algal-dha"],
}
ADULT_MULTI = re.compile(
    r'<a href="/supplement/multivitamins\.html">[^<]*</a>',
    re.I,
)


def slugify(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower()
    text = re.sub(r"[^a-z0-9_\s-]", " ", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def load_supplements():
    import subprocess

    script = r"""
const fs = require('fs');
const vm = require('vm');
const ctx = {};
vm.createContext(ctx);
const src = fs.readFileSync('data.js', 'utf8') + '\n;this.__S = S;';
vm.runInContext(src, ctx, {filename: 'data.js'});
function calc(s){
  const rd = s.r || 1, so = s.o || 1, sco = s.c || 1, sd = s.d || 1;
  return Math.round(s.e * 7 + s.s * 4 + rd * 3 + so * 2 + sco * 2 + sd * 2);
}
const out = ctx.__S.map(s => ({
  n: s.n, t: s.t, e: s.e, s: s.s, r: s.r || 1, o: s.o || 1, c: s.c || 1, d: s.d || 1,
  score: calc(s)
}));
process.stdout.write(JSON.stringify(out));
"""
    raw = subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True)
    import json

    rows = json.loads(raw)
    by_slug = {}
    for row in rows:
        full = slugify(row["n"])
        short = slugify(re.sub(r"\s*\([^)]*\)", " ", row["n"]))
        for key in (full, short):
            if key and key not in by_slug:
                by_slug[key] = row
    return by_slug


def is_redirect(path: Path) -> bool:
    if not path.is_file():
        return False
    head = path.read_text(encoding="utf-8", errors="replace")[:800]
    return 'http-equiv="refresh"' in head or "http-equiv='refresh'" in head


def supp_links(text: str):
    found = []
    for match in re.finditer(r'href="(?:\.\./)?/?supplement/([a-z0-9-]+)\.html"', text):
        slug = match.group(1)
        if slug not in found:
            found.append(slug)
    return found


def score_table(pairs):
    heads = "".join(
        f"<th>{html.escape(name)}</th>" for _slug, name, _row in pairs
    )
    def row(label, cells):
        tds = "".join(f"<td>{cell}</td>" for cell in cells)
        return f"<tr><th class=\"lbl-col\">{label}</th>{tds}</tr>"

    body = [
        row("Score", [f"{row['score']}/100" for _s, _n, row in pairs]),
        row("Tier", [TIERS.get(row["t"], row["t"]) for _s, _n, row in pairs]),
        row("Efficacy", [f"{row['e']}/5" for _s, _n, row in pairs]),
        row("Safety", [f"{row['s']}/5" for _s, _n, row in pairs]),
        row("Research", [f"{row['r']}/5" for _s, _n, row in pairs]),
        row("Onset", [f"{row['o']}/5" for _s, _n, row in pairs]),
        row("Cost", [f"{row['c']}/5" for _s, _n, row in pairs]),
        row("Drug interactions", [f"{row['d']}/5" for _s, _n, row in pairs]),
    ]
    names = "".join(
        f"<th><a href=\"/supplement/{slug}.html\">{html.escape(name)}</a></th>"
        for slug, name, _row in pairs
    )
    return (
        "<!-- SS_SCORE_TABLE:start -->\n"
        "<h2>Scores on the same scale</h2>\n"
        "<div style=\"overflow-x:auto\">\n"
        "<table class=\"cmp-table\">\n"
        f"<thead><tr><th></th>{names}</tr></thead>\n"
        f"<tbody>{''.join(body)}</tbody>\n"
        "</table>\n"
        "</div>\n"
        "<p class=\"ca-cite\">These are the same composite scores as the supplement pages. "
        "They are not the result of one head-to-head trial.</p>\n"
        "<!-- SS_SCORE_TABLE:end -->"
    )


def write_compare(by_slug, write: bool):
    problems = []
    changed = 0
    for path in sorted((ROOT / "compare").glob("*.html")):
        if path.name == "index.html" or is_redirect(path):
            continue
        text = path.read_text(encoding="utf-8")
        slugs = []
        seen = set()

        def add(slug, row):
            if slug in seen or row is None:
                return
            seen.add(slug)
            slugs.append((slug, row["n"], row))

        for slug in supp_links(text):
            add(slug, by_slug.get(slug))
            if len(slugs) == 8:
                break
        if len(slugs) < 2:
            for slug in MANUAL_COMPARE.get(path.name, []):
                add(slug, by_slug.get(slug))
            h1 = re.search(r"<h1>(.*?)</h1>", text, re.S)
            hay = re.sub(r"<[^>]+>", "", h1.group(1) if h1 else "").lower()
            ranked = sorted(
                {row["n"]: (slug, row) for slug, row in by_slug.items()}.items(),
                key=lambda item: len(item[0]),
                reverse=True,
            )
            for name, (slug, row) in ranked:
                if len(name) < 5 or name.lower() not in hay:
                    continue
                add(slug, row)
                if len(slugs) == 6:
                    break
        if len(slugs) < 1:
            problems.append(f"{path.name}: no scored supplement to tabulate")
            continue
        block = score_table(slugs)
        if "SS_SCORE_TABLE:start" in text:
            new, n = re.subn(
                r"<!-- SS_SCORE_TABLE:start -->.*?<!-- SS_SCORE_TABLE:end -->",
                block,
                text,
                count=1,
                flags=re.S,
            )
            if n != 1:
                problems.append(f"{path.name}: score marker was not replaced")
                continue
        else:
            anchor = re.search(r'<p class="ca-lede">.*?</p>', text, re.S)
            if not anchor:
                anchor = re.search(r'<p class="ca-meta">.*?</p>', text, re.S)
            if not anchor:
                problems.append(f"{path.name}: nowhere to insert the score table")
                continue
            new = text[: anchor.end()] + "\n\n" + block + text[anchor.end() :]
        if new != text:
            changed += 1
            if write:
                path.write_text(new, encoding="utf-8")
        if not write:
            got = re.search(
                r"<!-- SS_SCORE_TABLE:start -->.*?<!-- SS_SCORE_TABLE:end -->",
                text,
                re.S,
            )
            if not got or got.group(0) != block:
                problems.append(f"{path.name}: score table does not match the data")
    return changed, problems


SX_CSS = """
    .sx-block{margin:0 0 22px}
    .sx-block h2{font-size:1.15rem;font-weight:750;letter-spacing:-.2px;margin:0 0 8px}
    .sx-block p,.sx-block li{font-size:14.5px;line-height:1.6;color:var(--color-text-primary)}
    .sx-block ul{margin:0;padding-left:1.2rem}
    .sx-block a{color:var(--color-brand,#155A50)}
"""


def guide_html(path: Path, names, compare_hrefs, by_slug):
    top = ", ".join(html.escape(name) for name in names[:3]) or "the entries below"
    hub = HUBS.get(path.name)
    links = []
    if hub:
        links.append(f'<li><a href="{hub[1]}">{html.escape(hub[0])} topic guide</a></li>')
    else:
        links.append('<li><a href="/hub/">Topic guides</a></li>')
    for href, title in compare_hrefs[:4]:
        links.append(f'<li><a href="{html.escape(href)}">{html.escape(title)}</a></li>')
    links.append('<li><a href="/compare/index.html">All comparisons</a></li>')
    return (
        "<!-- SS_SX_GUIDE:start -->\n"
        '<section class="sx-block sx-evidence"><h2>Evidence summary</h2>'
        f"<p>The numbers on the cards are the same composite as the supplement pages: "
        f"efficacy, safety, research, onset, cost, and drug-interaction ratings, from 20 to 100. "
        f"The strongest records on this page are {top}. A higher score is a stronger record in the database, "
        f"not a personal recommendation.</p></section>\n"
        '<section class="sx-block sx-avoid"><h2>Who should be careful</h2><ul>'
        "<li>Pregnancy, breastfeeding, children, and anyone taking a prescription drug should talk with a clinician before using this list.</li>"
        "<li>Do not stack products from this list that sedate, thin the blood, or lower blood sugar with medicines that do the same thing.</li>"
        "<li>Tier 4 entries, when this page lists them, are warnings.</li>"
        "</ul></section>\n"
        '<section class="sx-block sx-links"><h2>Comparisons and topic guides</h2><ul>'
        + "".join(links)
        + "</ul></section>\n"
        "<!-- SS_SX_GUIDE:end -->"
    )


def compare_index(by_slug):
    index = {}
    titles = {}
    for path in (ROOT / "compare").glob("*.html"):
        if path.name == "index.html" or is_redirect(path):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        slugs = [slug for slug in supp_links(text) if slug in by_slug]
        title_m = re.search(r"<h1>(.*?)</h1>", text, re.S)
        title = re.sub(r"<[^>]+>", "", title_m.group(1) if title_m else path.stem)
        title = re.sub(r"\s+", " ", title).strip()
        href = "/compare/" + path.name
        titles[href] = title
        for slug in slugs:
            index.setdefault(slug, []).append(href)
    return index, titles


def write_symptoms(by_slug, write: bool):
    problems = []
    changed = 0
    comp_index, titles = compare_index(by_slug)
    for path in sorted((ROOT / "sx").glob("*.html")):
        if path.name == "index.html":
            continue
        text = path.read_text(encoding="utf-8")
        def drop_alias(match):
            href = match.group(1)
            slug_m = re.search(r"supplement/([a-z0-9-]+)\.html", href)
            if not slug_m:
                return match.group(0)
            target = ROOT / "supplement" / f"{slug_m.group(1)}.html"
            if is_redirect(target):
                return ""
            return match.group(0)

        new = re.sub(
            r'\n?\s*<a href="([^"]+)" class="sx-row">.*?</a>',
            drop_alias,
            text,
            flags=re.S,
        )
        names = []
        slugs = []
        for slug in supp_links(new):
            if is_redirect(ROOT / "supplement" / f"{slug}.html"):
                problems.append(f"{path.name}: still links alias {slug}")
                continue
            if slug in by_slug and slug not in slugs:
                slugs.append(slug)
                names.append(by_slug[slug]["n"])
        shared = []
        seen = set()
        for slug in slugs:
            for href in comp_index.get(slug, []):
                if href in seen:
                    continue
                page_slugs = [
                    s
                    for s, hrefs in ((s, comp_index.get(s, [])) for s in slugs)
                    if href in hrefs
                ]
                if len(page_slugs) >= 2 or (slugs and slug == slugs[0]):
                    seen.add(href)
                    shared.append((href, titles.get(href, href)))
                if len(shared) >= 4:
                    break
            if len(shared) >= 4:
                break
        block = guide_html(path, names, shared, by_slug)
        if "SS_SX_GUIDE:start" in new:
            new2, n = re.subn(
                r"<!-- SS_SX_GUIDE:start -->.*?<!-- SS_SX_GUIDE:end -->",
                block,
                new,
                count=1,
                flags=re.S,
            )
            if n != 1:
                problems.append(f"{path.name}: guide marker was not replaced")
                continue
            new = new2
        else:
            intro = re.search(r'<div class="sx-intro">.*?</div>', new, re.S)
            if not intro:
                problems.append(f"{path.name}: no intro")
                continue
            new = new[: intro.end()] + "\n\n" + block + new[intro.end() :]
        if ".sx-block{" not in new:
            new = new.replace("</style>", SX_CSS + "</style>", 1)
        if new != text:
            changed += 1
            if write:
                path.write_text(new, encoding="utf-8")
        if not write and "sx-evidence" not in text:
            problems.append(f"{path.name}: missing evidence summary")
        if not write and "sx-avoid" not in text:
            problems.append(f"{path.name}: missing caution section")
    return changed, problems


def li_rank(item: str):
    if ">Avoid<" in item:
        rank = 0
    elif ">Caution<" in item:
        rank = 1
    elif "Possible benefit" in item or ">Synergy<" in item:
        rank = 2
    elif "No known conflict" in item:
        rank = 3
    else:
        rank = 4
    name_m = re.search(r"<span>([^<]*)</span>", item)
    name = name_m.group(1) if name_m else item
    return (rank, name.lower())


def relabel_drugs(text: str):
    def cell(match):
        head, body = match.group(1), match.group(2)
        body = body.replace(
            'det-ltag support">Synergy<',
            'det-ltag support">Possible benefit (low evidence)<',
        )
        items = re.findall(r"<li>.*?</li>", body, re.S)
        if not items:
            return match.group(0)
        items.sort(key=li_rank)
        note = (
            '<p class="det-med-note" style="font-size:12px;line-height:1.45;'
            'color:var(--color-text-secondary);margin:0 0 8px">Riskiest first. '
            "Possible benefit (low evidence) is not a reason to combine them. "
            "No known conflict is not listed; an omitted drug is not a clearance.</p>"
        )
        if "det-med-note" in body:
            note = ""
        more_id = re.search(r'id="(rel-more-\d+)"', body)
        button = re.search(r"<button type=\"button\" class=\"det-rel-more\".*?</button>", body, re.S)
        visible = "".join(items[:10])
        hidden = "".join(items[10:])
        rebuilt = f"<ul class=\"det-rel-list\">{visible}</ul>"
        if hidden:
            ident = more_id.group(1) if more_id else "rel-more-drug"
            rebuilt += (
                f'<ul class="det-rel-list det-rel-list--more" id="{ident}" '
                f'style="display:none">{hidden}</ul>'
            )
            if button:
                label = re.search(r">Show \d+ more<", button.group(0))
                btn = button.group(0)
                if label:
                    btn = re.sub(r"Show \d+ more", f"Show {len(items) - 10} more", btn)
                    btn = re.sub(r'data-extra="\d+"', f'data-extra="{len(items) - 10}"', btn)
                rebuilt += btn
        return head + note + rebuilt

    return re.sub(
        r'(<div class="det-rel-h"><span>Drug interactions</span><span class="cnt">\d+</span></div>)(.*?)(?=<div class="det-rel-cell"|$)',
        cell,
        text,
        flags=re.S,
    )


def write_synergy(write: bool):
    changed = 0
    problems = []
    for path in (ROOT / "supplement").glob("*.html"):
        if is_redirect(path):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if "Drug interactions" not in text or ">Synergy<" not in text and "det-med-note" not in text:
            if ">Synergy<" in text and 'det-ltag support">Synergy' in text:
                problems.append(f"{path.name}: Synergy tag outside the drug list")
            continue
        if ">Synergy<" not in text and "det-med-note" in text:
            continue
        new = relabel_drugs(text)
        if ">Synergy<" in new and 'det-ltag support">Synergy' in new:
            problems.append(f"{path.name}: Synergy tag remains")
        if new != text:
            changed += 1
            if write:
                path.write_text(new, encoding="utf-8")
        elif not write and 'det-ltag support">Synergy' in text:
            problems.append(f"{path.name}: Synergy tag remains")
    return changed, problems


def population_note(kind: str) -> str:
    if kind == "prenatal":
        return (
            '<div class="brand-note brand-pop-note">Prenatal product. The healthy-adults '
            "multivitamin page is the wrong population. Discuss the formula with the prenatal clinician.</div>"
        )
    if kind == "infant":
        return (
            '<div class="brand-note brand-pop-note">Infant or toddler product. The healthy-adults '
            "multivitamin page does not apply. Discuss the dose with a pediatric clinician.</div>"
        )
    return (
        f'<a href="{KIDS_GUIDE}">Kids&#39; multivitamin guide</a>'
        '<div class="brand-note brand-pop-note">Children&#39;s product. The healthy-adults '
        "multivitamin page does not apply. Discuss the dose with a pediatric clinician.</div>"
    )


def kind_of(name: str) -> str:
    low = name.lower()
    if "prenatal" in low:
        return "prenatal"
    if "infant" in low or "toddler" in low:
        return "infant"
    return "child"


def write_population(write: bool):
    changed = 0
    problems = []
    for path in (ROOT / "brand").glob("*.html"):
        text = path.read_text(encoding="utf-8", errors="replace")
        if "brand-table" not in text:
            continue

        def row(match):
            block = match.group(0)
            cells = re.findall(r"<td>(.*?)</td>", block, re.S)
            if not cells:
                return block
            name = re.sub(r"<[^>]+>", "", cells[0])
            if not POP_RE.search(name):
                return block
            if "multivitamins.html" not in block and "brand-pop-note" not in block:
                return block
            if "brand-pop-note" in block and "multivitamins.html" not in block:
                return re.sub(
                    r'(class="brand-note brand-pop-note">.*?</div>),\s*',
                    r"\1",
                    block,
                    count=1,
                    flags=re.S,
                )
            if "multivitamins.html" not in block:
                return block
            note = population_note(kind_of(name))
            updated = ADULT_MULTI.sub(note, block, count=1)
            updated = re.sub(r'(class="brand-note brand-pop-note">.*?</div>),\s*', r"\1", updated, count=1, flags=re.S)
            return updated

        new = re.sub(r"<tr\b.*?</tr>", row, text, flags=re.S)
        if new != text:
            changed += 1
            if write:
                path.write_text(new, encoding="utf-8")
        # check
        for match in re.finditer(r"<tr\b.*?</tr>", new if write else text, re.S):
            block = match.group(0)
            cells = re.findall(r"<td>(.*?)</td>", block, re.S)
            if not cells:
                continue
            name = re.sub(r"<[^>]+>", "", cells[0])
            if POP_RE.search(name) and "multivitamins.html" in block:
                problems.append(f"{path.name}: {name.strip()} still links to the adult multivitamin")
    return changed, problems


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write == args.check:
        parser.error("pass --write or --check")
    by_slug = load_supplements()
    write = args.write
    reports = []
    problems = []
    for label, fn in (
        ("comparisons", lambda: write_compare(by_slug, write)),
        ("symptoms", lambda: write_symptoms(by_slug, write)),
        ("synergy", lambda: write_synergy(write)),
        ("population", lambda: write_population(write)),
    ):
        changed, found = fn()
        reports.append(f"{label}: {changed} files")
        problems.extend(found)
    print("\n".join(reports))
    if problems:
        print(f"{len(problems)} problems", file=sys.stderr)
        for item in problems[:40]:
            print(item, file=sys.stderr)
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
