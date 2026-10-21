#!/usr/bin/env python3
"""Add FAQPage and a Related block from text already on each supplement page.

FAQs are copied from the safety line, the dose schedule, the onset stat, and
the drug-interaction list. Nothing is invented to fill a quota. Articles get
a Supplements mentioned list matched on the supplement's own heading.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://supplementscore.org"
SKIP_ONSET = {
    "",
    "—",
    "-",
    "n/a",
    "na",
    "none",
    "varies",
    "see description",
    "unknown",
}


def unescape(value: str) -> str:
    return html.unescape(value).replace("\\/", "/").strip()


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def title_of(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(r"<title>(.*?)</title>", text, re.S)
    if not match:
        return path.stem.replace("-", " ")
    title = re.sub(r"\s+", " ", match.group(1)).strip()
    title = re.sub(r"\s+[|·—-]\s+SupplementScore$", "", title)
    title = re.sub(r"\s+—\s+SupplementScore$", "", title)
    return title


def visible_text(text: str) -> str:
    text = re.sub(r"<script\b.*?</script>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<style\b.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(text)


def faqs_for(text: str) -> list[tuple[str, str]]:
    name_m = re.search(r'<h1 class="det-h1">(.*?)</h1>', text)
    if not name_m:
        return []
    name = unescape(re.sub(r"<[^>]+>", "", name_m.group(1)))
    out: list[tuple[str, str]] = []
    safety = re.search(r'"safetyConsideration": "((?:\\.|[^"\\])*)"', text)
    if safety:
        answer = unescape(safety.group(1))
        if answer:
            out.append((f"Is {name} safe?", answer))
    dose = re.search(r'"doseSchedule": "((?:\\.|[^"\\])*)"', text)
    dose_answer = unescape(dose.group(1)) if dose else ""
    if dose_answer.lower().startswith("varies"):
        dose_answer = ""
    if not dose_answer:
        daily = re.search(
            r'det-stat-lbl">Daily dose</div><div class="det-stat-val">([^<]+)</div>',
            text,
        )
        if daily:
            value = unescape(daily.group(1))
            if value and value.lower() not in SKIP_ONSET and "see" not in value.lower():
                dose_answer = value
    if dose_answer:
        out.append((f"What dose does this page list for {name}?", dose_answer))
    onset = re.search(
        r'det-stat-lbl">Onset</div><div class="det-stat-val">([^<]*)</div>',
        text,
    )
    if onset:
        value = unescape(onset.group(1))
        if value.lower() not in SKIP_ONSET:
            out.append(
                (
                    f"How long until {name} has an effect?",
                    f"The page lists onset as {value}.",
                )
            )
    block = re.search(
        r"Drug interactions</span><span class=\"cnt\">(\d+)</span></div>(?:<ul class=\"det-rel-list\">(.*?)</ul>|<div class=\"det-rel-empty\">(.*?)</div>)",
        text,
    )
    if block:
        count = int(block.group(1))
        if count == 0 or not block.group(2):
            out.append(
                (
                    f"What interactions does this page list for {name}?",
                    "This page does not list a drug interaction.",
                )
            )
        else:
            names = [
                unescape(re.sub(r"<[^>]+>", "", item))
                for item in re.findall(r"<span>(.*?)</span><span class=\"det-ltag", block.group(2))
            ]
            names = [item for item in names if item]
            if names:
                out.append(
                    (
                        f"What interactions does this page list for {name}?",
                        "Listed on this page: " + "; ".join(names) + ".",
                    )
                )
    return out[:4]


def existing_faq(text: str) -> list[tuple[str, str]]:
    match = re.search(
        r'<script type="application/ld\+json">\s*(\{[^<]*"@type":\s*"FAQPage".*?\})\s*</script>',
        text,
        re.S,
    )
    if not match:
        return []
    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return []
    found = []
    for item in data.get("mainEntity") or []:
        q = ((item.get("name") or "")).strip()
        a = (((item.get("acceptedAnswer") or {}).get("text")) or "").strip()
        if q and a:
            found.append((q, a))
    return found


def faq_script(pairs: list[tuple[str, str]]) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in pairs
        ],
    }
    return (
        '<script type="application/ld+json" id="ss-jsonld-faq">\n'
        + json.dumps(data, ensure_ascii=False, indent=2)
        + "\n</script>\n"
    )


def faq_html(pairs: list[tuple[str, str]]) -> str:
    parts = ['<section class="ss-page-faq" id="ss-page-faq"><h2>Common questions</h2>']
    for question, answer in pairs:
        parts.append(f"<h3>{esc(question)}</h3><p>{esc(answer)}</p>")
    parts.append("</section>")
    return "".join(parts)


def apply_faq(text: str, pairs: list[tuple[str, str]]) -> str:
    if not pairs or 'id="ss-page-faq"' in text:
        return text
    have = {q for q, _ in existing_faq(text)}
    fresh = [(q, a) for q, a in pairs if q not in have]
    if not fresh and have:
        return text
    combined = existing_faq(text) + fresh
    block = faq_html(fresh)
    needle = '<div class="det-rel" id="det-related">'
    if needle in text:
        text = text.replace(needle, block + needle, 1)
    elif "</main>" in text:
        text = text.replace("</main>", block + "</main>", 1)
    else:
        return text
    old = re.search(
        r'<script type="application/ld\+json">\s*\{[^<]*"@type":\s*"FAQPage".*?\}\s*</script>\s*',
        text,
        re.S,
    )
    script = faq_script(combined)
    if old:
        text = text[: old.start()] + script + text[old.end() :]
    else:
        text = text.replace("</head>", script + "</head>", 1)
    return text


def related_html(links: list[tuple[str, str]]) -> str:
    items = "".join(f'<li><a href="{esc(href)}">{esc(label)}</a></li>' for href, label in links)
    return (
        '<section class="ca-related ss-related-pages" id="ss-related-pages">'
        '<h2 style="font-size:1.05rem">Related</h2><ul>'
        + items
        + "</ul></section>"
    )


def apply_related(text: str, links: list[tuple[str, str]]) -> str:
    if not links or 'id="ss-related-pages"' in text:
        return text
    block = related_html(links)
    if "</main>" in text:
        return text.replace("</main>", block + "</main>", 1)
    return text


def supplement_names() -> list[tuple[str, str]]:
    names = []
    for path in (ROOT / "supplement").glob("*.html"):
        text = path.read_text(encoding="utf-8", errors="replace")
        if 'http-equiv="refresh"' in text[:500]:
            continue
        match = re.search(r'<h1 class="det-h1">(.*?)</h1>', text)
        if not match:
            continue
        name = unescape(re.sub(r"<[^>]+>", "", match.group(1)))
        if len(name) < 4:
            continue
        names.append((name, path.stem))
    names.sort(key=lambda item: len(item[0]), reverse=True)
    return names


def mention_block(pairs: list[tuple[str, str]]) -> str:
    items = "".join(
        f'<li><a href="/supplement/{esc(slug)}.html">{esc(name)}</a></li>' for name, slug in pairs
    )
    return (
        '<section class="ss-mentioned" id="ss-mentioned"><h2>Supplements mentioned</h2><ul>'
        + items
        + "</ul></section>\n"
    )


def main() -> int:
    titles: dict[str, str] = {}
    inbound: dict[str, list[tuple[str, str]]] = {}
    for folder, kind in (("compare", "compare"), ("condition", "condition"), ("a", "a")):
        for path in (ROOT / folder).glob("*.html"):
            if path.name == "index.html":
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            if 'http-equiv="refresh"' in text[:500]:
                continue
            rel = f"/{folder}/{path.name}"
            titles[rel] = title_of(path)
            for slug in set(re.findall(r'href="(?:\.\./)?/?supplement/([a-z0-9-]+)\.html"', text)):
                inbound.setdefault(slug, []).append((kind, rel))

    faq_n = rel_n = 0
    faq_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
    for path in sorted((ROOT / "supplement").glob("*.html")):
        text = path.read_text(encoding="utf-8")
        if 'http-equiv="refresh"' in text[:500] or 'data-prerendered="1"' not in text:
            continue
        pairs = faqs_for(text)
        faq_counts[len(pairs)] = faq_counts.get(len(pairs), 0) + 1
        updated = apply_faq(text, pairs)
        links = []
        grouped = {"compare": [], "condition": [], "a": []}
        for kind, rel in inbound.get(path.stem, []):
            grouped[kind].append((rel, titles.get(rel, rel)))
        for kind, limit in (("compare", 2), ("condition", 2), ("a", 3)):
            for href, label in sorted(set(grouped[kind]))[:limit]:
                links.append((href, label))
        updated = apply_related(updated, links)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            if 'id="ss-page-faq"' in updated and 'id="ss-page-faq"' not in text:
                faq_n += 1
            if 'id="ss-related-pages"' in updated and 'id="ss-related-pages"' not in text:
                rel_n += 1

    compiled = [
        (re.compile(r"(?<![\w/])" + re.escape(name) + r"(?![\w/])", re.I), name, slug)
        for name, slug in supplement_names()
    ]
    art_n = 0
    for path in sorted((ROOT / "a").glob("*.html")):
        text = path.read_text(encoding="utf-8")
        if 'id="ss-mentioned"' in text or 'http-equiv="refresh"' in text[:400]:
            continue
        plain = visible_text(text)
        found = []
        masked = plain
        for pattern, name, slug in compiled:
            match = pattern.search(masked)
            if not match:
                continue
            found.append((name, slug))
            masked = masked[: match.start()] + (" " * (match.end() - match.start())) + masked[match.end() :]
            if len(found) >= 24:
                break
        if not found:
            continue
        block = mention_block(found)
        if "<!-- SS_FOOTER_BEGIN -->" in text:
            text = text.replace("<!-- SS_FOOTER_BEGIN -->", block + "<!-- SS_FOOTER_BEGIN -->", 1)
        elif "<footer" in text:
            text = text.replace("<footer", block + "<footer", 1)
        else:
            continue
        path.write_text(text, encoding="utf-8")
        art_n += 1
    print("faq pages", faq_n, "related pages", rel_n, "articles", art_n, "faq sizes", faq_counts)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
