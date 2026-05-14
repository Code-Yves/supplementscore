# Stack-builder run — 2026-05-14

First run of `weekly-stack-recommendation-builder`. Bootstrapped the `stack/` directory (only `index.html` existed) with three goal-based stack pages.

## Pages generated

| Slug | Supplements | Layer mix | Citations | Word count |
| --- | --- | --- | ---:| ---:|
| `stack/sleep-onset.html` | Magnesium glycinate (T1), Glycine (T2), L-Theanine (T2), Melatonin 0.3–0.5 mg (T1), Tart cherry (T2), Lavender oil oral / Silexan (T2), Apigenin (T3) | 2 Foundation / 2 Performance / 3 Optional | 15 PMIDs | ~1,700 |
| `stack/focus-without-stimulants.html` | Creatine monohydrate (T1), L-Theanine (T2), Citicoline (T2), Magnesium L-threonate (T2), Bacopa monnieri (T3), Tyrosine (T2), Saffron (T1) | 2 Foundation / 3 Performance / 2 Optional | 12 PMIDs | ~1,800 |
| `stack/immune-prevention.html` | Vitamin D3 (T1), Zinc (T1), Vitamin C moderate-dose (T2), Beta-glucan 1,3/1,6 (T2), Probiotics RTI strains (T2) | 3 Foundation / 2 Performance | 13 PMIDs | ~1,650 |

## Acceptance-criteria check

- [x] 3 pages generated
- [x] Each stack has 5–10 supplements with ≥1 PMID per recommended supplement
- [x] Each "don't bother" item has a contradicting PMID (Cochrane retired echinacea, GEM trial for ginkgo, Hemilä Cochrane for vitamin C megadose, Davison 2021 for colostrum, Leach 2015 for valerian, Boonstra 2015 for GABA, Bonn-Miller 2017 for CBD mislabelling, Turner 2006 for 5-HTP)
- [x] `sitemap-stacks.xml` updated and `sitemap-index.xml` lastmod refreshed
- [x] `stack/index.html` grid populated (was empty before this run)
- [x] All pages light-mode only (per `feedback_no_dark_mode.md`)
- [x] JSON-LD `Article` with `articleSection: "Supplement Stack"` on each page
- [x] OG/Twitter meta + canonical + last-reviewed comment on each page

## Tier composition (escalation check)

Brief flags any stack where >50% of recommended supplements are Tier-3 or below.

- `sleep-onset` — 1 of 7 Tier-3 (apigenin, optional). 14% — under threshold. ✓
- `focus-without-stimulants` — 1 of 7 Tier-3 (bacopa, performance layer). 14% — under threshold. ✓
- `immune-prevention` — 0 of 5 Tier-3. ✓

## Within-stack pairing antagonism check

Per pairings-data.js, none of the within-stack combinations are antagonistic.

- Sleep-onset: Mg glycinate + Glycine + L-Theanine is a documented synergy (p87, strength 3). Melatonin + caffeine is an absorption-conflict (p120) so caffeine cutoff at 14:00 is called out in the timing diagram. Sedating-supplement risk-additive entry (p133) is surfaced in interactions.
- Focus-without-stimulants: Theanine-only is used; the caffeine pairing (p5/p115) is intentionally out of scope and the page says so explicitly.
- Immune-prevention: Zinc + copper depletion-offset (p6) called out for >25 mg/day long-term. Probiotics + hot beverage absorption-conflict (p119) called out. D3 + Mg cofactor (p88) and D3 + K2 (p1) called out as adjacent-but-out-of-scope cofactor pairings. No antagonisms within the stack.

## Cross-link follow-up (handed to `weekly-supplement-page-polish`)

These supplement pages should reference the new stack page from their own `/s/` page. Flagging here rather than double-editing per the brief.

| Stack page | Supplement pages to back-link |
| --- | --- |
| `stack/sleep-onset.html` | `s/magnesium-glycinate.html`, `s/glycine.html`, `s/l-theanine.html`, `s/melatonin.html`, `s/tart-cherry.html`, `s/lavender-oil-oral.html`, `s/apigenin.html` |
| `stack/focus-without-stimulants.html` | `s/creatine-monohydrate.html`, `s/l-theanine.html`, `s/citicoline.html`, `s/magnesium-l-threonate.html`, `s/bacopa-monnieri.html`, `s/tyrosine.html`, `s/saffron.html` |
| `stack/immune-prevention.html` | `s/vitamin-d3.html`, `s/zinc.html`, `s/vitamin-c.html`, `s/beta-glucan.html`, `s/probiotics.html` |

## Notes & decisions

- Bootstrapped: `stack/index.html` had an empty grid and a "stacks coming soon" empty-state. Added three cards and removed the empty-state placeholder.
- Bootstrapped: `reviews/stack-builder-log.md` did not exist — created with header + first row.
- "Don't bother" link to `s/cbd.html` was omitted in `stack/sleep-onset.html` because that supplement page does not exist; cited in plain text with PMID instead.
- 5-HTP also has no `s/5-htp.html` slug; same handling — text-only mention with PMID.
- Brief asked for ≥10 PMIDs across the stack; each page hits or exceeds this individually.
- Probiotics for immune prevention: brief `data.js` entry covers RTI strains generically but recommends B. animalis specifically (per the existing entry's prose); page reflects strain-specificity rather than a "take any probiotic" recommendation.

## Escalations

None this run. All stacks have majority Tier-1/Tier-2 evidence and no within-stack antagonisms.
