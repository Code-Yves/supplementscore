#!/usr/bin/env python3
"""Article formatting / readability guardrail for SupplementScore.

Catches regressions that slipped past the smoke test. HARD-FAIL issues fail the
build (exit 1); jargon is advisory.

HARD-FAIL:
  1. DOUBLE-NUMBERED ordered lists — an <ol><li> whose visible text starts with
     "N." (the <ol> already auto-numbers, so the literal number is a duplicate).
  2. BOTTOM LINE DUPLICATES PARAGRAPH 1 — the authored Bottom Line box and the
     first body paragraph say the same thing, so the reader sees the verdict
     twice. The body should start with real content, not repeat the verdict.
  3. BOTTOM LINE TOO SHORT — fewer than 3 sentences. The Bottom Line is the
     summary a reader leans on; it must be a real 3+ sentence synopsis.
  4. BOTTOM LINE TRUNCATED — ends in an ellipsis ("…" / "..."), i.e. a cut-off
     fragment rather than a finished thought.

ADVISORY (warn only):
  5. JARGON in the Bottom Line / opening lede — 2+ distinct technical concepts an
     average reader won't follow (HPA axis, GABAergic, pharmacokinetic, ...).

Run from the repo root:  python3 scripts/check_article_formatting.py
Exit code 1 if any HARD-FAIL issue is found, else 0. Wire into the build/smoke gate.
"""
import glob, re, os, sys, html, difflib

JARGON = re.compile(
    r'\b(HPA[- ]axis|autonomic|catecholamine[s]?|GABAergic|glutamatergic|'
    r'sympathetic tone|monoaminergic|serotonergic|dopaminergic|'
    r'pharmacokinetic[s]?|pharmacodynamic[s]?|endothelial|vasodilat\w*|'
    r'nitric[- ]oxide synthase|down[- ]?regulat\w*|up[- ]?regulat\w*|'
    r'11-beta|11β|pseudoaldosteron\w*|cytochrome|CYP\d)\b', re.I)

# Duplication threshold: BL vs first body paragraph similarity at/above this = dup.
DUP_RATIO = 0.82

def visible(h):
    """Strip tags, decode entities, collapse whitespace."""
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()

def norm(t):
    return visible(t).lower()

def sentence_count(t):
    """Conservative sentence count. Protects decimals + common abbreviations so
    they don't read as sentence ends, then counts terminators followed by a
    capital/open-quote/digit (next sentence) or end-of-string. Undercounting is
    the safe direction here (it flags more Bottom Lines for review)."""
    t = visible(t)
    t = re.sub(r'(\d)\.(\d)', r'\1\2', t)                      # 4.5 -> 45
    for ab in ('e.g.', 'i.e.', 'vs.', 'etc.', 'Dr.', 'approx.', 'Inc.',
               'cf.', ' al.', 'U.S.', 'Fig.', 'No.', 'mg.', 'kg.', 'mcg.'):
        t = t.replace(ab, ab.replace('.', ''))
    return len(re.findall(r'[.!?]+(?=\s+[A-Z(“"0-9]|\s*$)', t))

def is_truncated(t):
    v = visible(t)
    return v.endswith('…') or v.endswith('...')

def bottomline_text(s):
    """Visible text of the authored Bottom Line box's <p>. Scoped to the box
    (uniform structure: <div class="ar-bottomline"><div class="ar-bottomline-label">
    …</div><p>…</p></div>) so it never sweeps the article body."""
    m = (re.search(r'<div class="ar-bottomline">\s*<div class="ar-bottomline-label">.*?</div>\s*<p>(.*?)</p>', s, re.S)
         or re.search(r'<div class="ar-bottomline">.*?<p>(.*?)</p>', s, re.S))
    return m.group(1) if m else None

def first_body_paragraph(s):
    c = re.search(r'class="ar-content"[^>]*>(.*?)$', s, re.S)
    if not c:
        return None
    p = re.search(r'<p>(.*?)</p>', c.group(1), re.S)
    return p.group(1) if p else None

def main():
    dbl, bl_dup, bl_short, bl_trunc, bl_missing, jarg = [], [], [], [], [], []
    for f in sorted(glob.glob('a/*.html')):
        s = open(f, encoding='utf-8', errors='ignore').read()
        if 'http-equiv="refresh"' in s.lower():
            continue
        if re.search(r'<meta[^>]+name=["\']robots["\'][^>]*noindex', s, re.I):
            continue
        b = os.path.basename(f)

        # 1. double-numbered <ol><li>
        bad = False
        for ol in re.findall(r'<ol[^>]*>(.*?)</ol>', s, re.S):
            for li in re.findall(r'<li[^>]*>(.*?)</li>', ol, re.S):
                if re.match(r'^\d+[.)]\s', visible(li)):
                    bad = True
                    break
            if bad:
                break
        if bad:
            dbl.append(b)

        # Bottom Line checks
        blt = bottomline_text(s)
        if blt is None:
            # 0. no authored Bottom Line box at all. Every indexable article must
            #    ship one (the runtime chrome only synthesizes a fallback for >=3
            #    H2s, so a short page with no authored BL would render none).
            bl_missing.append(b)
        else:
            # 2. duplicates first body paragraph
            fbp = first_body_paragraph(s)
            if fbp is not None:
                r = difflib.SequenceMatcher(None, norm(blt), norm(fbp)).ratio()
                if r >= DUP_RATIO:
                    bl_dup.append((b, round(r, 2)))
            # 3. too short
            sc = sentence_count(blt)
            if sc < 3:
                bl_short.append((b, sc))
            # 4. truncated
            if is_truncated(blt):
                bl_trunc.append(b)

        # 5. jargon (advisory) — Bottom Line box + first lede paragraph
        lede = re.search(r'class="ar-content".*?<p>(.*?)</p>', s, re.S)
        ledet = visible(lede.group(1)) if lede else ''
        def concept(t):
            t = t.lower()
            if 'pharmacokinet' in t or 'pharmacodynam' in t: return 'PK/PD'
            if 'vasodilat' in t: return 'vasodilation'
            if 'regulat' in t: return 'regulation'
            if 'catecholamine' in t: return 'catecholamine'
            if '11-beta' in t or '11β' in t or 'pseudoaldosteron' in t: return '11beta-HSD'
            if 'hpa' in t: return 'HPA-axis'
            if 'cytochrome' in t or t.startswith('cyp'): return 'cytochrome'
            return t
        hits = sorted({concept(m) for m in JARGON.findall((visible(blt) if blt else '') + ' ' + ledet)})
        if len(hits) >= 2:
            jarg.append((b, hits))

    print("== Article formatting guardrail ==")
    print(f"[FAIL-if-any] Double-numbered <ol> lists      : {len(dbl)}")
    for b in dbl:
        print("   -", b)
    print(f"[FAIL-if-any] Bottom Line == paragraph 1 (dup): {len(bl_dup)}")
    for b, r in bl_dup:
        print(f"   - {b}  (similarity {r})")
    print(f"[FAIL-if-any] Bottom Line < 3 sentences       : {len(bl_short)}")
    for b, sc in bl_short[:60]:
        print(f"   - {b}  ({sc} sentence{'s' if sc != 1 else ''})")
    if len(bl_short) > 60:
        print(f"   ... and {len(bl_short) - 60} more")
    print(f"[FAIL-if-any] Bottom Line truncated (ellipsis): {len(bl_trunc)}")
    for b in bl_trunc:
        print("   -", b)
    print(f"[FAIL-if-any] No authored Bottom Line box      : {len(bl_missing)}")
    for b in bl_missing:
        print("   -", b)
    print(f"[warn] Jargon in Bottom Line / lede           : {len(jarg)}")
    for b, h in jarg:
        print("   -", b, h)

    fails = len(dbl) + len(bl_dup) + len(bl_short) + len(bl_trunc) + len(bl_missing)
    if fails:
        print(f"\nFAIL: {fails} hard issue(s). Bottom Lines must be a finished, "
              "3+ sentence summary that does NOT repeat paragraph 1; ordered lists "
              "must not carry literal 'N.' numbers.")
        return 1
    print("\nPASS. Jargon entries above (if any) are advisory.")
    return 0

if __name__ == '__main__':
    sys.exit(main())
