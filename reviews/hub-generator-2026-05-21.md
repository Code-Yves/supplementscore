# Hub generator run — 2026-05-21

Generated 3 new topic hub pages and seeded them into the hub directory and sitemap.

## Topics picked

| Hub | Slug | Supplements | Articles | Conditions | Stacks | Compares | Total internal links | Word count |
|-----|------|-------------|----------|------------|--------|----------|----------------------|------------|
| Omega-3 | `hub/omega-3.html` | 10 | 17 | 7 | 0 | 4 | **38** | 1526 |
| Vitamin D | `hub/vitamin-d.html` | 4 | 16 | 5 | 0 | 2 | **27** | 1580 |
| Athletic performance | `hub/athletic-performance.html` | 10 | 27 | 6 | 1 | 13 | **57** | 1692 |

## Cross-links added per topic

- **omega-3** — 20 cluster-member pages updated (cap = 20)
  - Breakdown by type: s=10, a=10
  - appended: `s/omega-3.html`
  - appended: `s/dha.html`
  - appended: `s/algal-dha.html`
  - appended: `s/algal-oil.html`
  - appended: `s/omega-3-dha-dominant.html`
- **vitamin-d** — 20 cluster-member pages updated (cap = 20)
  - Breakdown by type: s=4, a=14, condition=2
  - appended: `s/vitamin-d3.html`
  - appended: `s/vitamin-d3-liquid-drops.html`
  - appended: `s/k2-d3-combo.html`
  - appended: `s/vitamin-d2.html`
  - appended: `a/vitamin-d-and-cancer-mortality-what-the-vital-extended-follow-up-shows.html`
- **athletic-performance** — 20 cluster-member pages updated (cap = 20)
  - Breakdown by type: s=10, a=10
  - appended: `s/creatine-monohydrate.html`
  - appended: `s/caffeine.html`
  - appended: `s/electrolyte-complex.html`
  - appended: `s/sodium-bicarbonate.html`
  - appended: `s/whey-protein.html`

## Files modified

### New files
- `hub/omega-3.html` — omega-3 topic hub
- `hub/vitamin-d.html` — vitamin D topic hub
- `hub/athletic-performance.html` — athletic performance topic hub
- `reviews/hub-generator-2026-05-21.md` — this report

### Modified files
- `hub/index.html` — appended 3 cards and 3 hasPart entries; bumped lastreviewed to 2026-05-21 (`.bak-hub-2026-05-21` saved)
- `sitemap-hubs.xml` — added 3 `<url>` entries and bumped hub-index lastmod (`.bak-hub-2026-05-21` saved)
- `reviews/hub-history.json` — appended 3 new entries
- `reviews/hub-generator-log.md` — appended 3 rolling-log rows
- 60 cluster-member pages — appended a `HUB-FEATURED:start:<hub>` block before `</main>` (`.bak-hub-2026-05-21` saved on first touch only)

## Topics chosen (rationale)

- **omega-3** — Large nutrient family with 10 distinct supplement pages (EPA, DHA, ALA forms; krill, algal, cod liver, rTG, calamari, omega-7) and 17 articles covering REDUCE-IT/STRENGTH/OMEMI cardiac signal, pediatric ADHD evidence, fish-oil quality (TOTOX/peroxide/anisidine), and pregnancy DHA needs. High SEO value for "fish oil vs algal oil", "EPA vs DHA", "omega-3 and AF".
- **vitamin-d** — Only 4 supplement pages but 16 strong articles covering VITAL/STURDY/post-VITAL respiratory infections, bolus-dosing harm, pediatric/infant dosing, and the AAP 400 IU rule. Cluster is article-heavy rather than supplement-heavy — perfect for an aggregation hub. High-intent searches: "vitamin D dosing", "vitamin D for kids", "vitamin D and cancer".
- **athletic-performance** — Largest goal cluster picked so far: 10 evidence-graded supplements (creatine, caffeine, whey, sodium bicarbonate, beta-alanine, citrulline, nitrate, etc.), 27 articles spanning research updates, guides, safety (DMAA/SARMs), and teen/kids, plus 6 conditions, 1 stack, and 13 head-to-head compares. High commercial-search intent for "creatine for older adults", "pre-workout safety", "BCAA vs EAA".

## Acceptance criteria
- ✅ 3 hubs generated, each with ≥10 internal links to cluster members (got 38, 27, 57)
- ✅ Each hub validates as HTML (parsed)
- ✅ All 3 JSON-LD blocks per hub (CollectionPage, BreadcrumbList, FAQPage) parse cleanly
- ✅ Light-mode only (`<style>html{color-scheme:light}</style>`)
- ✅ Word counts in target range (1500-3000): omega-3 1526, vitamin-d 1580, athletic-performance 1692
- ✅ `sitemap-hubs.xml` parses; `sitemap-index.xml` already references it

## Notes / autonomous decisions

- Cluster slug validation was run before composition. All 119 internal links (across the 3 hubs) resolve to existing files in `s/`, `a/`, `condition/`, `stack/`, `compare/`.
- Score values on supplement cards are computed live from `data.js` using the canonical `e*7+s*4+r*3+o*2+c*2+d*2` formula from `app.js`.
- Cross-linking was capped at 20 per topic per the spec. Vitamin-D's article shelf is deep (14 articles linked + 4 supplements + 2 conditions = 20), so 0 condition slots remained for it after articles consumed the cap. Conditions, stacks, and compares still receive inbound traffic via the hub page itself.
- Used the same `HUB-FEATURED:start:<hub_slug>` block scheme as the 2026-05-17 run for idempotence — re-running this script will detect existing blocks and skip.
- The vitamin-d hub initially came in at 1328 words; one FAQ pair was added on testing and overdose risk plus 1 paragraph in the overview to clear the 1500-word minimum without padding.

## Escalations / flags

- None this run. All 3 picked clusters had ≥5 members across categories (omega-3: 38, vitamin-d: 27, athletic-performance: 57).
- Supplements appearing in >5 hubs after this run: 0. Highest individual-supplement hub presence so far is `magnesium` (in magnesium + sleep hubs = 2 hubs). `omega-3` and `vitamin-d3` are now each in 1 hub. No clustering issue surfaced.
