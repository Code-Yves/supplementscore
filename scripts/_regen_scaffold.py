#!/usr/bin/env python3
"""_regen_scaffold.py — produce a template-perfect /a/ article by cloning the
canonical, well-formed sibling (sarcopenia protocol) and swapping in new
title/slug/description/dates + a provided body block. Guarantees the head
(CSP, JSON-LD, _research-chrome.js, _site-ux.js, RC_PREVNEXT, SS_FOOTER,
reviewedBy, BreadcrumbList, viewport-fit) is current and passes the
register-articles.mjs drift check.

Usage:
  python3 scripts/_regen_scaffold.py \
     --slug <kebab-slug> --title "Exact Title (no — SupplementScore suffix)" \
     --desc "150-char meta description" --minutes 7 --body /tmp/body.html

The --body file must contain the FULL body block, starting with
`<div class="ar-content">` and ending with the closing `</footer>` (see the
type-2-diabetes exemplar). Do NOT include <main>, <h1>, or </main> — those are
kept from the template (the <h1> is swapped to your title automatically).
"""
import re, argparse, pathlib

ap = argparse.ArgumentParser()
ap.add_argument("--slug", required=True)
ap.add_argument("--title", required=True)
ap.add_argument("--desc", required=True)
ap.add_argument("--minutes", type=int, default=7)
ap.add_argument("--body", required=True)
ap.add_argument("--section", default=None,
                help='articleSection display name (e.g. "Stack", "Guide", "Top 10 Lists", "Reality Check", "Safety Alert", "Breakthrough"). Default keeps "Condition".')
ap.add_argument("--today", default="2026-05-30")
a = ap.parse_args()

REPO = pathlib.Path(__file__).resolve().parent.parent
TPL = REPO / "a" / "sarcopenia-the-evidence-based-supplement-protocol.html"
s = TPL.read_text(encoding="utf-8")

OLD_SLUG = "sarcopenia-the-evidence-based-supplement-protocol"
OLD_TITLE = "Sarcopenia: The Evidence-Based Supplement Protocol"
OLD_DESC = ("Whey protein with leucine, vitamin D, creatine, and HMB — the supplements "
            "with geriatric trial evidence for muscle mass and function in older adults.")

s = s.replace(OLD_SLUG, a.slug).replace(OLD_TITLE, a.title)
s = s.replace(OLD_DESC, a.desc).replace(OLD_DESC.replace("—", "\\u2014"), a.desc.replace("—", "\\u2014"))
s = s.replace('"datePublished": "2026-05-26"', f'"datePublished": "{a.today}"')
s = s.replace('"dateModified": "2026-05-26"', f'"dateModified": "{a.today}"')
s = s.replace('last-reviewed: 2026-05-26', f'last-reviewed: {a.today}')
s = s.replace('6 min read', f'{a.minutes} min read')
if a.section:
    s = s.replace('"articleSection": "Condition"', f'"articleSection": "{a.section}"')

body = pathlib.Path(a.body).read_text(encoding="utf-8").rstrip() + "\n"
# Replace everything from the ar-content div through the footer (up to </main>)
s, n = re.subn(r'<div class="ar-content">.*?(?=</main>)', body, s, flags=re.S)
if n != 1:
    raise SystemExit(f"ERROR: body region not matched (n={n}) — template drift?")

out = REPO / "a" / f"{a.slug}.html"
out.write_text(s, encoding="utf-8")
print(f"wrote {out} ({len(s)} bytes)")
