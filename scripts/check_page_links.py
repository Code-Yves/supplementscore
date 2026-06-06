#!/usr/bin/env python3
"""Static internal-link existence check.

Every <a>/<link>/<img> href/src on a DEPLOYED page must resolve to a file that
exists on disk (or a directory with an index.html). This catches broken
navigation links — e.g. a wrong ../ prefix that sends an in-folder article link
to the site root (a/foo links to ../bar.html → /bar.html → 404).

Complements check_internal_links.mjs, which validates the ?slug= SUPPLEMENT
targets against data.js; this validates the FILE part of every page link.

Inline <script>/JSON-LD blocks are stripped before matching so embedded HTML
fragments (e.g. an <a href in a meta description) don't register as links.
_archive/ and reviews/ (internal scratch, not deployed) are excluded.

Run from repo root:  python3 scripts/check_page_links.py    (exit 1 if any broken)
"""
import os, re, glob, sys

SKIP_PREFIXES = ('_archive/', 'reviews/', 'node_modules/')

def main():
    exist = set()
    for dp, _, fns in os.walk('.'):
        if '/.git' in dp or '/node_modules' in dp or dp.startswith('./_archive'):
            continue
        for fn in fns:
            exist.add(os.path.relpath(os.path.join(dp, fn), '.').replace('\\', '/'))

    def resolves(t):
        if t in ('', '.', '/'):
            return 'index.html' in exist
        return t in exist or (t.rstrip('/') + '/index.html') in exist

    htmls = [f for f in glob.glob('**/*.html', recursive=True)
             if not any(f.startswith(p) for p in SKIP_PREFIXES)]
    broken = {}
    for hf in htmls:
        base = os.path.dirname(hf)
        s = open(hf, encoding='utf-8', errors='ignore').read()
        s = re.sub(r'<script[^>]*>.*?</script>', '', s, flags=re.S)  # drop JS/JSON-LD
        for m in re.finditer(r'<(?:a|link|img)\b[^>]*?(?:href|src)\s*=\s*"([^"]+)"', s):
            url = m.group(1).strip()
            if re.match(r'^(https?:|mailto:|tel:|javascript:|data:|#|//)', url):
                continue
            # JS template fragments / malformed values
            if any(c in url for c in ("'", '+', '${', '<', '>', ' ', '`', ',')):
                continue
            path = url.split('#')[0].split('?')[0]   # ?slug= file part only; slug validated elsewhere
            if not path or path == '/':
                continue
            if path.startswith('/'):
                target = path.lstrip('/')
            else:
                target = os.path.normpath(os.path.join(base, path)).replace('\\', '/')
            if not resolves(target):
                broken.setdefault(url, []).append(hf)

    print("== page link existence check ==")
    print(f"broken internal links: {len(broken)}")
    for url, srcs in sorted(broken.items()):
        print(f"   - {url}   ({len(srcs)} page(s), e.g. {srcs[0]})")
    if broken:
        print("\nFAIL: target file does not exist for the links above "
              "(check for a wrong ../ prefix or a renamed/deleted page).")
        return 1
    print("PASS — every internal <a>/<link>/<img> target resolves to an existing file.")
    return 0

if __name__ == '__main__':
    sys.exit(main())
