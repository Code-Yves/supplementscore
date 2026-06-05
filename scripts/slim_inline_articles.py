#!/usr/bin/env python3
"""Slim the homepage's inline #article-N bodies to metadata stubs.

Background: index.html ships 592 inline `<div class="article-full" id="article-N">`
full article bodies (~2.2 MB). Since article clicks now redirect to the standalone
/a/ page (goArticle reads the body's `a.ar-readmore` link and navigates), the full
prose is dead weight for every article that has an /a/ page — the visible cards are
separate self-contained `.article-card` elements, search reads ARTICLES_BY_ID from
data.js, and the per-article JSON-LD / trust-strip / reviewed-date are only built
on modal-open (which the redirecting articles never reach).

This replaces each redirecting article's body with a stub that keeps ONLY what
goArticle consumes — the wrapper div (so getElementById still resolves) and the
`a.ar-readmore` redirect link:

    <div class="article-full" id="article-N" style="display:none"><a class="ar-readmore" href="a/<slug>.html" hidden aria-hidden="true"></a></div>

Articles with NO ar-readmore /a/ link (page-less fallbacks that still open the modal)
are left FULL and untouched. Idempotent: re-running on an already-slim stub is a no-op.

Usage:  python3 scripts/slim_inline_articles.py [--check]
  --check : report what would change, write nothing (exit 1 if any non-stub bodies
            remain, for use as a build-gate size guard).
"""
import re, sys, os

OPEN = re.compile(r'<div class="article-full" id="article-(\d+)"[^>]*>')
ARM  = re.compile(r'<a class="ar-readmore"[^>]*href="(a/[^"]+\.html)"')

def matched_close(s, end):
    """Return offset just past the </div> that closes the div opened before `end`."""
    depth = 1
    for m in re.finditer(r'<div\b|</div>', s[end:]):
        if m.group(0) == '</div>':
            depth -= 1
            if depth == 0:
                return end + m.end()
        else:
            depth += 1
    return -1

def main():
    check = '--check' in sys.argv
    path = 'index.html'
    s = open(path, encoding='utf-8').read()
    orig = len(s)
    opens = [(m.group(1), m.start(), m.end(), m.group(0)) for m in OPEN.finditer(s)]
    starts = [o[1] for o in opens]
    repl = []          # (start, close, stub)
    slimmed = kept = nonstub_remaining = 0
    for i, (aid, st, en, opentag) in enumerate(opens):
        close = matched_close(s, en)
        nxt = starts[i+1] if i+1 < len(opens) else len(s)
        if close == -1 or close > nxt:
            print(f"ABORT: balanced match failed for article-{aid} (close={close}, next={nxt})")
            return 2
        span = s[st:close]
        arm = ARM.search(span)
        if not arm:
            kept += 1                      # page-less fallback — leave full
            continue
        stub = opentag + '<a class="ar-readmore" href="' + arm.group(1) + '" hidden aria-hidden="true"></a></div>'
        if span == stub:
            continue                       # already slim — no-op (idempotent)
        # body still has prose beyond the stub
        nonstub_remaining += 1
        repl.append((st, close, stub))
        slimmed += 1

    if check:
        print(f"[check] article-full divs: {len(opens)} | would slim: {slimmed} | kept-full (fallbacks): {kept}")
        return 1 if slimmed else 0

    for st, close, stub in sorted(repl, key=lambda x: -x[0]):
        s = s[:st] + stub + s[close:]
    open(path, 'w', encoding='utf-8').write(s)
    # sanity: div count unchanged
    after_divs = len(OPEN.findall(s))
    print(f"slimmed {slimmed}, kept-full {kept}; article-full divs {len(opens)} -> {after_divs}; "
          f"index.html {orig//1024} KB -> {len(s)//1024} KB")
    return 0 if after_divs == len(opens) else 2

if __name__ == '__main__':
    sys.exit(main())
