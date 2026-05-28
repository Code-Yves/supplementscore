#!/usr/bin/env python3
"""
insert_article_disclaimer.py — bulk-insert the in-article medical disclaimer
into every /a/*.html file. Idempotent: skips files that already contain the
disclaimer block.

USAGE
-----
    python3 scripts/insert_article_disclaimer.py            # apply to all /a/
    python3 scripts/insert_article_disclaimer.py --check    # report-only, no writes
    python3 scripts/insert_article_disclaimer.py a/foo.html # specific file(s)

INSERTION ANCHOR
----------------
For each article we look for, in order of preference:
  1. The closing </div> of <div class="ar-bottomline">...</div> — insert AFTER it
  2. The closing </div> of <div class="ar-meta">...</div>       — insert AFTER it
  3. The <h1>...</h1>                                            — insert AFTER it

CSS
---
We also inject a small <style> block into <head> if the file doesn't already
contain a `.ar-disclaim` rule. We piggyback on the existing inline <style>
that articles already use for .ar-foot, .ar-wrap, etc.

WHY A PYTHON SCRIPT (not a sed one-liner)
-----------------------------------------
The .ar-bottomline block contains nested divs, so balancing the closing </div>
requires a small parser. The script also tracks per-file changes so the
summary report is meaningful.
"""
import argparse
import glob
import os
import re
import sys

DISCLAIMER_BLOCK = (
    '<aside class="ar-disclaim" role="note">'
    '<strong>Educational reference, not medical advice.</strong> '
    'Always consult a clinician before changing your supplement regimen. '
    'See our <a href="/about.html#methodology">methodology</a> for how scores are derived. '
    'Questions or corrections: <a href="mailto:hello@supplementscore.org">hello@supplementscore.org</a>.'
    '</aside>'
)

DISCLAIMER_CSS = (
    "    /* In-article medical disclaimer — left-bar typographic block, no filled card. */\n"
    "    .ar-disclaim { border-left: 3px solid var(--color-border-tertiary); padding: 8px 14px; margin: 18px 0 22px; font-size: 13px; line-height: 1.55; color: var(--color-text-secondary); }\n"
    "    .ar-disclaim strong { color: var(--color-text-primary); }\n"
    "    .ar-disclaim a { color: var(--color-text-secondary); text-decoration: underline; text-underline-offset: 2px; }\n"
)

MARKER_PRESENT = 'class="ar-disclaim"'
CSS_MARKER = '.ar-disclaim {'


def _find_balanced_div_end(html: str, start_idx: int) -> int:
    """Given an index pointing at the '<' of an opening <div ...>, return
    the index of the matching </div>'s '>' (inclusive). Returns -1 if
    unbalanced.
    """
    depth = 0
    i = start_idx
    open_re = re.compile(r'<div\b[^>]*>', re.IGNORECASE)
    close_re = re.compile(r'</div\s*>', re.IGNORECASE)
    while i < len(html):
        m_open = open_re.search(html, i)
        m_close = close_re.search(html, i)
        if m_close is None:
            return -1
        if m_open is not None and m_open.start() < m_close.start():
            depth += 1
            i = m_open.end()
        else:
            depth -= 1
            i = m_close.end()
            if depth == 0:
                return i
    return -1


def _insert_disclaimer_html(html: str) -> tuple[str, str]:
    """Return (new_html, anchor_used). anchor_used is 'bottomline', 'meta',
    'h1', or 'none'."""

    # 1. Prefer after the <div class="ar-bottomline"> ... </div>
    m = re.search(r'<div\b[^>]*class="ar-bottomline"[^>]*>', html, re.IGNORECASE)
    if m:
        end = _find_balanced_div_end(html, m.start())
        if end > 0:
            return (html[:end] + '\n' + DISCLAIMER_BLOCK + html[end:], 'bottomline')

    # 2. Fallback: after the <div class="ar-meta">...</div>
    m = re.search(r'<div\b[^>]*class="ar-meta"[^>]*>.*?</div>', html,
                  re.IGNORECASE | re.DOTALL)
    if m:
        end = m.end()
        return (html[:end] + '\n' + DISCLAIMER_BLOCK + html[end:], 'meta')

    # 3. Last resort: after the <h1>...</h1>
    m = re.search(r'</h1>', html, re.IGNORECASE)
    if m:
        end = m.end()
        return (html[:end] + '\n' + DISCLAIMER_BLOCK + html[end:], 'h1')

    return (html, 'none')


def _inject_css(html: str) -> tuple[str, bool]:
    """Inject .ar-disclaim CSS into the first <style> block of <head>.
    Returns (new_html, did_inject)."""
    if CSS_MARKER in html:
        return (html, False)
    # We look for the .ar-foot rule and insert the .ar-disclaim rules right
    # after it, since every article template has .ar-foot in its inline style.
    pattern = re.compile(
        r'(\.ar-foot a \{[^}]*\}\s*\n)',
        re.IGNORECASE,
    )
    m = pattern.search(html)
    if m:
        end = m.end()
        return (html[:end] + DISCLAIMER_CSS + html[end:], True)
    # Fallback: stick the rules just before the first </style>.
    m = re.search(r'</style>', html, re.IGNORECASE)
    if m:
        end = m.start()
        return (html[:end] + DISCLAIMER_CSS + html[end:], True)
    return (html, False)


def process_file(path: str, check_only: bool) -> dict:
    with open(path, 'r', encoding='utf-8') as f:
        original = f.read()

    if MARKER_PRESENT in original:
        return {'path': path, 'status': 'in_sync', 'anchor': None}

    html, anchor = _insert_disclaimer_html(original)
    if anchor == 'none':
        return {'path': path, 'status': 'no_anchor', 'anchor': None}

    html, css_added = _inject_css(html)

    if not check_only:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
    return {
        'path': path,
        'status': 'would_update' if check_only else 'updated',
        'anchor': anchor,
        'css_added': css_added,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true',
                    help='report what would change, do not write')
    ap.add_argument('paths', nargs='*', help='specific files (default: all /a/*.html)')
    args = ap.parse_args()

    if args.paths:
        files = args.paths
    else:
        # Resolve repo root from this script's location.
        here = os.path.dirname(os.path.abspath(__file__))
        repo = os.path.dirname(here)
        files = sorted(glob.glob(os.path.join(repo, 'a', '*.html')))

    counts = {
        'updated': 0,
        'would_update': 0,
        'in_sync': 0,
        'no_anchor': 0,
    }
    anchors = {'bottomline': 0, 'meta': 0, 'h1': 0}
    no_anchor_files = []

    for path in files:
        result = process_file(path, args.check)
        counts[result['status']] = counts.get(result['status'], 0) + 1
        if result['anchor']:
            anchors[result['anchor']] += 1
        if result['status'] == 'no_anchor':
            no_anchor_files.append(path)

    print()
    if args.check:
        print(f"  would update: {counts['would_update']}")
    else:
        print(f"  updated:      {counts['updated']}")
    print(f"  in sync:      {counts['in_sync']}")
    print(f"  no anchor:    {counts['no_anchor']}")
    print()
    print(f"  by anchor: bottomline={anchors['bottomline']}, "
          f"meta={anchors['meta']}, h1={anchors['h1']}")

    if no_anchor_files:
        print()
        print(f"  Files with no suitable anchor (first 10):")
        for p in no_anchor_files[:10]:
            print(f"    {p}")


if __name__ == '__main__':
    main()
