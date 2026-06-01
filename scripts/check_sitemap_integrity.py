#!/usr/bin/env python3
"""
Sitemap integrity gate — fails (exit 1) if any sitemap advertises a URL that
Google would refuse to index. Run before deploy and/or in CI.

A sitemap should contain ONLY canonical, indexable, 200-OK URLs. Advertising
dead (404), robots-blocked, or noindex URLs is exactly what produces the
"Why pages aren't indexed → Failed" buckets in Google Search Console. This
gate blocks that regression — e.g. if a generator re-adds deleted /for/ pages,
or sitemaps drift to noindex stubs.

Checks each <loc> across every sitemap*.xml (except the index):
  1. 404      — the URL doesn't resolve to a file on disk (dir-index aware).
  2. ROBOTS   — the URL path matches a Disallow rule in robots.txt
                (Google semantics: '*' = wildcard, '$' = end-anchor; the path
                used for matching includes the query string, so a `$`-anchored
                rule like `Disallow: /supplement.html$` does NOT block
                `/supplement.html?slug=x`).
  3. NOINDEX  — a *static* URL (no query string) whose page carries
                <meta name="robots" content="...noindex...">. Query/SPA URLs
                (?slug=, ?id=) are skipped — they're dynamic and the canonical
                ?slug= supplement URLs are index,follow. The meta tag is parsed
                properly, so the word "noindex" appearing only inside a <script>
                (e.g. article.html's conditional logic) does NOT trip it.

Usage:
    python3 scripts/check_sitemap_integrity.py        # exit 0 clean, 1 on problems
Stdlib only. Idempotent / read-only (never modifies files).
"""
import glob
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
ROBOTS_META = re.compile(r'<meta\b[^>]*\bname=["\']robots["\'][^>]*>', re.I)


def resolve_file(path: str):
    """Map a URL path (no query) to a file on disk, directory-index aware."""
    rel = path.strip('/')
    if rel == '':
        f = ROOT / 'index.html'
        return f if f.is_file() else None
    f = ROOT / rel
    if f.is_file():
        return f
    f = ROOT / rel / 'index.html'          # /data/ -> data/index.html
    return f if f.is_file() else None


def load_disallows():
    """Disallow patterns that apply to '*' (and generic) user-agents."""
    rules, applies = [], False
    p = ROOT / 'robots.txt'
    if not p.exists():
        return rules
    for line in p.read_text(encoding='utf-8', errors='ignore').splitlines():
        line = line.split('#', 1)[0].strip()
        if ':' not in line:
            continue
        key, val = (s.strip() for s in line.split(':', 1))
        k = key.lower()
        if k == 'user-agent':
            applies = (val == '*')
        elif k == 'disallow' and applies and val:
            rules.append(val)
    return rules


def robots_blocks(path_q: str, rules) -> str | None:
    """Return the first Disallow rule that blocks path_q (Google * / $ semantics)."""
    for pat in rules:
        end_anchor = pat.endswith('$')
        body = pat[:-1] if end_anchor else pat
        rx = '^' + ''.join('.*' if c == '*' else re.escape(c) for c in body) + ('$' if end_anchor else '')
        if re.search(rx, path_q):
            return pat
    return None


def is_noindex(html: str) -> bool:
    return any('noindex' in tag.lower() for tag in ROBOTS_META.findall(html))


def main() -> int:
    disallows = load_disallows()
    problems = []   # (kind, sitemap, url, detail)
    total = 0
    for sm in sorted(glob.glob(str(ROOT / 'sitemap*.xml'))):
        if 'sitemap-index' in pathlib.Path(sm).name:
            continue
        locs = re.findall(r'<loc>(.*?)</loc>', pathlib.Path(sm).read_text(encoding='utf-8', errors='ignore'))
        name = pathlib.Path(sm).name
        for loc in locs:
            total += 1
            parsed = urllib.parse.urlparse(loc.strip())
            path = parsed.path
            path_q = path + (('?' + parsed.query) if parsed.query else '')
            blocked = robots_blocks(path_q, disallows)
            if blocked:
                problems.append(('ROBOTS-BLOCKED', name, loc, f'matches "{blocked}"'))
                continue
            f = resolve_file(path)
            if f is None:
                problems.append(('404-DEAD', name, loc, 'no file on disk'))
                continue
            if not parsed.query and is_noindex(f.read_text(encoding='utf-8', errors='ignore')[:8000]):
                problems.append(('NOINDEX', name, loc, 'page has meta robots noindex'))

    print(f'Sitemap integrity: scanned {total} URLs across {len(glob.glob(str(ROOT / "sitemap*.xml"))) - 1} sitemaps.')
    if not problems:
        print('PASS — every sitemap URL resolves, is crawlable, and is indexable.')
        return 0
    print(f'FAIL — {len(problems)} bad URL(s) that should not be in a sitemap:\n')
    for kind, sm, url, detail in problems:
        print(f'  [{kind}] {sm}: {url}\n          {detail}')
    print('\nFix: remove these from the sitemap (or make them 200/indexable). '
          'noindex stubs, redirects, robots-blocked and deleted pages must not be advertised.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
