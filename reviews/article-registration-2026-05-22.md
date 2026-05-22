# Article Registration Report — 2026-05-22

## Trigger
- 17 skipped articles (17 title-duplicates)
- 4 non-standard category remappings

## Summary
- **Orphan articles detected:** 72
- **Registered this run:** 13 (IDs 554–566)
- **Skipped:** 17
- **Backlog remaining after run:** 42 unregistered + 17 duplicates needing human review

## Counts before/after
| Artifact | Before | After |
|---|---|---|
| `ARTICLES_BY_ID` | 553 | 566 |
| `ARTICLE_MAP` keys | 351 | 355 (4 new) |
| `S` (supplements) | 781 | 781 (unchanged — expected) |

## Registered articles
- **554** `research-update` · 3min · 1 supp · Creatine and brain function in older adults: the 2024-2025 RCT update
- **555** `kids` · 3min · 2 supp · Vitamin D for autistic children: what the RCTs actually show
- **556** `guide` · 3min · 2 supp · Vitamin D dosing: daily vs weekly vs monthly bolus pharmacokinetics
- **557** `guide` · 3min · 4 supp · Reading omega-3 labels: EPA, DHA, and the ratio that actually matters
- **558** `safety` · 4min · 8 supp · Supplements and Thyroid Medication: What Blocks Absorption
- **559** `guide` · 4min · 10 supp · Reading a magnesium label: matching the form to the goal
- **560** `research-update` · 4min · 3 supp · Phosphatidylserine and Memory: What 19 RCTs Show
- **561** `research-update` · 3min · 2 supp · Selenium and Hashimoto's Thyroiditis: Why Brazil Nuts Aren't a Drug
- **562** `guide` · 4min · 6 supp · Reading a probiotic label: strain identifiers and CFU at end of shelf life
- **563** `research-update` · 3min · 2 supp · L-Tryptophan vs 5-HTP: Serotonin Precursors with Different Safety Profiles
- **564** `myth` · 3min · 2 supp · Hydrogen water: the antioxidant claim and the dissolution problem
- **565** `breakthrough` · 3min · 1 supp · DHEA and aging: what the 2024-2025 trials show in older adults
- **566** `research-update` · 3min · 3 supp · Bovine colostrum for athlete immunity: what the 2024-2025 trials measured

## Skipped (with reasons)
- `how-to-read-a-fish-oil-coa-peroxide-value-anisidine-value-and-totox-explained` — title-duplicate of ABI id 537
- `liver-detox-supplements-what-milk-thistle-actually-does-and-doesnt-do` — title-duplicate of ABI id 246
- `alkaline-water-and-ph-supplements-why-the-chemistry-doesnt-work-that-way` — title-duplicate of ABI id 248
- `st-johns-wort-drug-interactions-the-cyp3a4-inducer-problem` — title-duplicate of ABI id 461
- `recent-supplement-recalls-and-fda-warnings-the-roll-call` — title-duplicate of ABI id 500
- `pterostilbene-resveratrols-better-absorbed-cousin` — title-duplicate of ABI id 513
- `mitoq-for-parkinsons-disease-where-the-evidence-stands` — title-duplicate of ABI id 499
- `zinc-lozenges-for-childrens-colds-what-the-pediatric-trials-show` — title-duplicate of ABI id 442
- `youth-hockey-supplements-boys-10-14-what-to-take-and-avoid` — title-duplicate of ABI id 485
- `wild-yam-cream-for-menopause-why-diosgenin-doesnt-become-progesterone-in-humans` — title-duplicate of ABI id 493
- `vitamin-a-megadose-teratogenicity-why-pregnancy-and-retinol-dont-mix` — title-duplicate of ABI id 503
- `nicotinamide-riboside-plus-pterostilbene-basis-and-the-combination-nad-product-trial-legacy` — title-duplicate of ABI id 497
- `mushroom-coffee-for-focus-what-the-lions-mane-and-cordyceps-claims-actually-show` — title-duplicate of ABI id 550
- `cats-claw-uncaria-tomentosa-for-immunity-and-arthritis-big-claims-thin-trial-record` — title-duplicate of ABI id 490
- `c15-pentadecanoic-acid-the-odd-chain-fatty-acid-marketed-as-the-first-essential-nutrient-in-90-years` — title-duplicate of ABI id 410
- `b-complex-timing-and-absorption-why-morning-isnt-always-best` — title-duplicate of ABI id 507
- `yeast-beta-glucan-vs-oat-beta-glucan-immune-and-cholesterol-trial-divergence` — title-duplicate of ABI id 539

### Why so many title-duplicates?
The article generator (`nightly-article-generation`) appears to be regenerating articles whose titles already exist in `ARTICLES_BY_ID` but writing them to disk under a slightly different slug (typically due to apostrophe / hyphen / entity-encoding differences in the slugify step). For example:
- existing ABI id 550 "Mushroom coffee for focus: what the lion's mane and cordyceps claims actually show" → slug `mushroom-coffee-for-focus-what-the-lion-s-mane-and-cordyceps-claims-actually-show`
- orphan file `mushroom-coffee-for-focus-what-the-lions-mane-and-cordyceps-claims-actually-show.html` (note `lions` vs `lion-s`)

These near-duplicate orphans cannot be auto-registered without creating two ABI rows for the same article. They were skipped, not deleted (per the "never delete" rule). The generator's slugify or de-dup logic needs investigation — this is the likely root cause of the 72-orphan backlog persisting.

## Category remappings applied
- recent-supplement-recalls-and-fda-warnings-the-roll-call: cat "Quick Reads" → "guide"
- phosphatidylserine-and-memory-what-19-rcts-show: cat "Research Update" → "research-update"
- selenium-and-hashimoto-s-thyroiditis-why-brazil-nuts-aren-t-a-drug: cat "Research Update" → "research-update"
- l-tryptophan-vs-5-htp-serotonin-precursors-with-different-safety-profiles: cat "Research Update" → "research-update"

`Quick Reads` was mapped to `guide` because it isn't a known ABI category — only the 13 `Quick Reads` articles already in index.html use that label. `Research Update` (with space) was normalized to `research-update` (the existing canonical form, used in 6 ABI entries).

## New ARTICLE_MAP keys (supplements gaining their first article)
- `Vitamin D2 (ergocalciferol)`
- `Kelp (iodine-rich)`
- `VSL#3 / Visbiome (multi-strain)`
- `Hydrogen water (molecular hydrogen)`

## Auto-rollbacks
_(none — all updates validated and verified)_

## Spot check — 3 sampled entries verified consistent across all 4 artifacts
- **id 554** `creatine-and-brain-function-in-older-adults-the-2024-2025-rct-update`
  - ABI: ✓ | AM: yes | index.html: ✓ | sitemap: ✓
- **id 560** `phosphatidylserine-and-memory-what-19-rcts-show`
  - ABI: ✓ | AM: yes | index.html: ✓ | sitemap: ✓
- **id 566** `bovine-colostrum-for-athlete-immunity-what-the-2024-2025-trials-measured`
  - ABI: ✓ | AM: yes | index.html: ✓ | sitemap: ✓

## Files modified
- `data.js` (backup: `data.js.bak-20260522`)
- `index.html` (backup: `index.html.bak-20260522`)
- `sitemap-articles.xml` (backup: `sitemap-articles.xml.bak-20260522`; all 13 new slugs were already present, no insertion needed)
- `sw.js` (cache version bumped to `v2026-05-22-reg566`)
- `reviews/article-registration-log.md` (appended 13 lines)

## Note on parsing
First parse pass failed for one article (`recent-supplement-recalls-and-fda-warnings-the-roll-call`) because its HTML uses `<div class="ar-foot">` inside the content area instead of a top-level `<footer class="ar-foot">` — extraction was made more robust by stripping autolinks/hub-featured/footer divs separately. That article ended up being a title-duplicate of ABI id 500 and was skipped anyway, but the robustness improvement will help future runs.
