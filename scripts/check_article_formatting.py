#!/usr/bin/env python3
"""Article formatting / readability guardrail for SupplementScore.

Catches regressions that slipped past the smoke test:
  1. DOUBLE-NUMBERED ordered lists — an <ol><li> whose visible text starts with
     "N." (the <ol> already auto-numbers, so the literal number is a duplicate).
     -> HARD FAIL (objective bug).
  2. JARGON in the Bottom Line / opening lede — technical terms an average reader
     won't follow (HPA axis, GABAergic, pharmacokinetic, ...). The Bottom Line is
     the first thing a reader sees; it should be plain.
     -> WARNING (surfaces candidates to simplify; does not fail the build).

Run from the repo root:  python3 scripts/check_article_formatting.py
Exit code 1 if any HARD-FAIL issue is found, else 0. Wire into the build/smoke gate.
"""
import glob, re, os, sys

JARGON = re.compile(
    r'\b(HPA[- ]axis|autonomic|catecholamine[s]?|GABAergic|glutamatergic|'
    r'sympathetic tone|monoaminergic|serotonergic|dopaminergic|'
    r'pharmacokinetic[s]?|pharmacodynamic[s]?|endothelial|vasodilat\w*|'
    r'nitric[- ]oxide synthase|down[- ]?regulat\w*|up[- ]?regulat\w*|'
    r'11-beta|11β|pseudoaldosteron\w*|cytochrome|CYP\d)\b', re.I)

def visible(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html)).strip()

def main():
    dbl, jarg = [], []
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
        # 2. jargon in the Bottom Line block + the first ar-content paragraph (lede)
        # Capture ONLY the authored Bottom Line box (uniform structure:
        # <div class="ar-bottomline"><div class="ar-bottomline-label">…</div><p>…</p></div>).
        # The old `ar-bottomline.*?</div>\s*</div>` pattern was greedy: because the box
        # is immediately followed by a sibling <div class="ar-content"> (not a nested
        # </div></div>), it ran on to the closing of ar-content and swept the entire
        # article body into the "Bottom Line" text — flagging body-only jargon (mechanism
        # sections, Sources) as if it were in the verdict the reader sees first. Scope it
        # to the box's own <p>, matching the script's documented intent (Bottom Line + lede).
        bl = (re.search(r'<div class="ar-bottomline">\s*<div class="ar-bottomline-label">.*?</div>\s*<p>.*?</p>\s*</div>', s, re.S)
              or re.search(r'<div class="ar-bottomline">.*?<p>(.*?)</p>', s, re.S))
        blt = visible(bl.group(0)) if bl else ''
        lede = re.search(r'class="ar-content".*?<p>(.*?)</p>', s, re.S)
        ledet = visible(lede.group(1)) if lede else ''
        # Flag only DENSE jargon (2+ distinct technical CONCEPTS) in the verdict the
        # reader sees first — a single in-context term (e.g. "pharmacokinetics" in
        # an absorption piece) is acceptable; stacking several distinct ones is what
        # reads as "too technical for the average reader". Normalise variant families
        # (pharmacokinetic/-s, vasodilat*, up/down-regulat*, ...) to one concept.
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
        hits = sorted({concept(m) for m in JARGON.findall(blt + ' ' + ledet)})
        if len(hits) >= 2:
            jarg.append((b, hits))

    print("== Article formatting guardrail ==")
    print(f"[FAIL-if-any] Double-numbered <ol> lists: {len(dbl)}")
    for b in dbl:
        print("   -", b)
    print(f"[warn] Jargon in Bottom Line / lede: {len(jarg)}")
    for b, h in jarg:
        print("   -", b, h)

    if dbl:
        print("\nFAIL: double-numbered lists must be fixed (strip the literal 'N.' "
              "from <ol><li> items; the list auto-numbers).")
        return 1
    print("\nPASS (double-numbering clean). Jargon entries above are advisory.")
    return 0

if __name__ == '__main__':
    sys.exit(main())
