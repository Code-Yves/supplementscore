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
  4. DUPLICATE — the same <loc> appears in more than one shard. Google asks
                for each URL in exactly one sitemap; overlapping core +
                section shards produced conflicting lastmods and wasted crawl.
  5. STALE-NEWS — a Google News <news:publication_date> older than 2 days.
                News sitemaps are for fresh articles only; evergreen /a/
                pages belong in sitemap-articles.xml.

Usage:
    python3 scripts/check_sitemap_integrity.py        # exit 0 clean, 1 on problems
Stdlib only. Idempotent / read-only (never modifies files).
"""
import glob
import pathlib
import re
import sys
import urllib.parse
from datetime import datetime, timedelta, timezone

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


NEWS_DATE = re.compile(r'<news:publication_date>(.*?)</news:publication_date>', re.I)
NEWS_MAX_AGE = timedelta(days=2)


def news_cutoff() -> datetime:
    return datetime.now(timezone.utc) - NEWS_MAX_AGE


def parse_news_date(raw: str) -> datetime | None:
    raw = raw.strip()
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError:
        try:
            dt = datetime.strptime(raw, '%Y-%m-%d')
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def main() -> int:
    disallows = load_disallows()
    problems = []   # (kind, sitemap, url, detail)
    seen = {}       # loc -> [sitemap, ...]
    total = 0
    sitemap_files = sorted(glob.glob(str(ROOT / 'sitemap*.xml')))
    for sm in sitemap_files:
        name = pathlib.Path(sm).name
        if 'sitemap-index' in name:
            continue
        text = pathlib.Path(sm).read_text(encoding='utf-8', errors='ignore')
        locs = re.findall(r'<loc>(.*?)</loc>', text)
        for loc in locs:
            loc = loc.strip()
            total += 1
            seen.setdefault(loc, []).append(name)
            parsed = urllib.parse.urlparse(loc)
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

        if name == 'sitemap-news.xml':
            cutoff = news_cutoff()
            for block in re.findall(r'<url>(.*?)</url>', text, re.S):
                loc_m = re.search(r'<loc>(.*?)</loc>', block)
                loc = loc_m.group(1).strip() if loc_m else '(missing loc)'
                for raw in NEWS_DATE.findall(block):
                    dt = parse_news_date(raw)
                    if dt is None:
                        problems.append(('STALE-NEWS', name, loc, f'unparseable publication_date "{raw}"'))
                    elif dt < cutoff:
                        problems.append(('STALE-NEWS', name, loc,
                                         f'publication_date {raw} is older than 2 days'))

    for loc, names in sorted(seen.items()):
        if len(names) > 1:
            problems.append(('DUPLICATE', '+'.join(names), loc,
                             'same URL listed in more than one sitemap'))

    n_shards = sum(1 for sm in sitemap_files if 'sitemap-index' not in pathlib.Path(sm).name)
    print(f'Sitemap integrity: scanned {total} URLs across {n_shards} sitemaps.')
    if not problems:
        print('PASS — every sitemap URL resolves, is crawlable, is indexable, '
              'appears once, and news dates (if any) are fresh.')
        return 0
    print(f'FAIL — {len(problems)} problem(s) that should not be in a sitemap:\n')
    for kind, sm, url, detail in problems:
        print(f'  [{kind}] {sm}: {url}\n          {detail}')
    print('\nFix: remove dead/noindex/robots-blocked URLs; list each URL in exactly '
          'one shard; drop Google News entries older than 2 days (evergreen articles '
          'belong in sitemap-articles.xml).')
    return 1


if __name__ == '__main__':
    sys.exit(main())
