# FAERS Adverse Event Signal Scan — 2026-05-12

**Source:** OpenFDA FAERS `drug/event` endpoint  
**FAERS data last updated by FDA:** 2026-04-28 (≈14 days behind report date)  
**Supplements checked:** 50  
**API calls made:** 68  
**Baseline file written:** `reviews/faers-counts-latest.json`

## Important caveat — first run / data lag

This is the **first run** of the weekly FAERS scan, so there is no prior-week baseline file to compare against. Signal detection in this run relies only on the in-FAERS recent-90 vs prior-90 windows.

OpenFDA FAERS data was last refreshed on 2026-04-28. Since today is 2026-05-12, the trailing 90-day window only contains data through approximately mid-to-late April 2026, while the prior 90-day window is fully populated. The "recent_90 < prior_90" pattern visible across nearly every supplement below is therefore an **artifact of FAERS update cadence and reporting lag**, not a genuine drop in adverse events. Next week's run will produce the first true week-over-week delta from the saved baseline.

## 🚨 New signals

_None._ No supplement showed a >100% quarter-over-quarter increase or ≥3 serious/life-threatening reports in the last 30 days (caveat above).

## ⚠️ Watch list

_None._ No supplement showed a >50% quarter-over-quarter increase (caveat above).

## ✅ No change — but worth noting for baseline

These supplements had the most FAERS volume in the trailing 90 days (incomplete window) and represent the most-watched-by-FAERS items in our checked set:

| Supplement | Tier | Total all-time | Last 90d | Prior 90d | Ser/30d |
|---|---|---:|---:|---:|---:|
| Vitamin D3 | T1 | 169,824 | 2,184 | 3,975 | 0 |
| Magnesium | T1 | 79,281 | 873 | 1,694 | 0 |
| Melatonin | T2 | 52,804 | 702 | 1,216 | 0 |
| Iron | T2 | 65,123 | 551 | 1,080 | 0 |
| Zinc | T1 | 17,414 | 288 | 494 | 0 |
| High-dose fat-soluble vitamins (A, E) | T4 | 6,167 | 50 | 138 | 0 |
| Collagen for muscle strength | T3 | 2,634 | 44 | 92 | 0 |
| Alpha-Lipoic Acid (ALA) | T3 | 4,684 | 36 | 110 | 0 |
| Berberine | T2 | 612 | 27 | 32 | 0 |
| Black cohosh high-dose | T4 | 883 | 8 | 12 | 0 |
| Tianeptine ("gas station heroin") | T4 | 483 | 5 | 15 | 0 |
| Glutamine (standalone, healthy adults) | T3 | 878 | 5 | 12 | 0 |
| Licorice root high-dose | T4 | 124 | 3 | 7 | 0 |
| Creatine monohydrate | T1 | 146 | 2 | 10 | 0 |
| Collagen peptides | T1 | 22 | 1 | 0 | 0 |

## All-time volume (full checked set)

<details><summary>Click to expand — all 50 supplements checked, sorted by all-time report count</summary>

| Supplement | Tier | Reason | Total | Last 90d | Prior 90d |
|---|---|---|---:|---:|---:|
| Vitamin D3 | T1 | high-use | 169,824 | 2,184 | 3,975 |
| Magnesium | T1 | high-use | 79,281 | 873 | 1,694 |
| Iron | T2 | high-use | 65,123 | 551 | 1,080 |
| Melatonin | T2 | high-use | 52,804 | 702 | 1,216 |
| Multivitamins (healthy adults) | T3 | T3-trending | 48,902 | 0 | 0 |
| Zinc | T1 | high-use | 17,414 | 288 | 494 |
| High-dose fat-soluble vitamins (A, E) | T4 | T4-risky | 6,167 | 50 | 138 |
| Alpha-Lipoic Acid (ALA) | T3 | T3-trending | 4,684 | 36 | 110 |
| Probiotics | T2 | high-use | 4,593 | 0 | 0 |
| Collagen for muscle strength | T3 | T3-trending | 2,634 | 44 | 92 |
| Ginkgo biloba | T3 | T3-trending | 1,431 | 0 | 0 |
| Black cohosh high-dose | T4 | T4-risky | 883 | 8 | 12 |
| Glutamine (standalone, healthy adults) | T3 | T3-trending | 878 | 5 | 12 |
| Resveratrol | T3 | T3-trending | 735 | 0 | 1 |
| NAC (N-Acetyl Cysteine) | T2 | high-use | 638 | 0 | 0 |
| Berberine | T2 | high-use | 612 | 27 | 32 |
| Tianeptine ("gas station heroin") | T4 | T4-risky | 483 | 5 | 15 |
| Omega-3 (EPA/DHA) | T1 | high-use | 407 | 0 | 0 |
| Kratom (Mitragyna speciosa) | T4 | T4-risky | 395 | 0 | 0 |
| Valerian root | T3 | T3-trending | 296 | 0 | 0 |
| Phosphoric acid (urinary) | T4 | T4-risky | 238 | 1 | 2 |
| Spirulina | T3 | T3-trending | 206 | 0 | 0 |
| Green tea extract (EGCG) | T3 | T3-trending | 187 | 0 | 0 |
| Creatine monohydrate | T1 | high-use | 146 | 2 | 10 |
| Ashwagandha (KSM-66) | T2 | high-use | 140 | 0 | 0 |
| Licorice root high-dose | T4 | T4-risky | 124 | 3 | 7 |
| Methyl-1-testosterone (oral steroid) | T4 | T4-risky | 85 | 1 | 0 |
| Colloidal silver | T4 | T4-risky | 82 | 0 | 1 |
| Kava (high-dose/extract) | T4 | T4-risky | 54 | 1 | 8 |
| 5-HTP | T3 | T3-trending | 53 | 0 | 0 |
| Phenibut | T4 | T4-risky | 45 | 0 | 0 |
| Panax ginseng | T3 | T3-trending | 41 | 0 | 0 |
| Collagen peptides | T1 | high-use | 22 | 1 | 0 |
| Androstenedione (prohormone) | T4 | T4-risky | 14 | 0 | 0 |
| Lion's mane mushroom | T3 | T3-trending | 14 | 0 | 0 |
| Aristolochic acid (in some herbal products) | T4 | T4-risky | 11 | 0 | 0 |
| Bacopa monnieri | T3 | T3-trending | 10 | 0 | 0 |
| Detox supplements | T3 | T3-trending | 10 | 0 | 0 |
| Colostrum (bovine) | T3 | T3-trending | 7 | 0 | 0 |
| Ephedra analogues (synephrine) | T4 | T4-risky | 6 | 0 | 0 |
| DMAA/DMHA novel stimulant pre-workouts | T4 | T4-risky | 4 | 0 | 0 |
| Essential oils (oral, general) | T4 | T4-risky | 4 | 0 | 0 |
| Greater celandine (Chelidonium majus) | T4 | T4-risky | 3 | 0 | 0 |
| Black seed oil (Nigella sativa) | T3 | T3-trending | 3 | 0 | 0 |
| NMN / NAD+ precursors | T3 | T3-trending | 3 | 0 | 0 |
| Usnic acid (weight loss) | T4 | T4-risky | 2 | 0 | 0 |
| Bitter orange (Citrus aurantium) | T4 | T4-risky | 2 | 0 | 0 |
| Turkesterone / Ecdysteroids | T3 | T3-trending | 1 | 0 | 0 |
| Fo-Ti (Polygonum multiflorum / He Shou Wu) | T4 | T4-risky | 0 | 0 | 0 |
| 1,3-DMBA (dimethylbutylamine) | T4 | T4-risky | 0 | 0 | 0 |

</details>

## Supplements with no FAERS records

These supplements returned zero FAERS records under the queried product name. May indicate a) genuinely no reports, or b) the supplement is reported under a different product name in FAERS (e.g., a branded formulation):

- **Fo-Ti (Polygonum multiflorum / He Shou Wu)** (queried as `POLYGONUM MULTIFLORUM`)
- **1,3-DMBA (dimethylbutylamine)** (queried as `1,3`)

## Errors

_None — all API calls completed successfully._

## Methodology notes

**Query template:** `patient.drug.medicinalproduct.exact:"<NAME>"` with date counting (`count=receivedate`) and a follow-up serious-only query when last-90-day activity is non-zero.

**Supplement selection (this run, 50 total):**

- 12 high-use supplements explicitly listed in the task (creatine, fish oil, vitamin D, magnesium, ashwagandha, melatonin, berberine, NAC, collagen, probiotics, iron, zinc)
- 20 Tier 4 ("Risky / Avoid") supplements — highest a-priori safety concern
- 18 Tier 3 ("Trending") supplements — second-highest priority per task brief

**Signal thresholds:**

- 🚨 New signal: `recent_90 > 2× prior_90` (with `prior_90 ≥ 5` to suppress small-number noise) **OR** `serious_30 ≥ 3`
- ⚠️ Watch:      `recent_90 > 1.5× prior_90` (with `prior_90 ≥ 5`)
- Once weekly history accumulates, week-over-week deltas against the saved baseline file will be the primary comparator.

**Known limitations:**

1. FAERS `medicinalproduct.exact` matching depends on how reporters wrote the product name. Branded supplements (e.g. specific KSM-66 ashwagandha SKUs) may be split across many product-name variants. Volume here is a lower bound.
2. FAERS counts disproportionate adverse events; it does not measure incidence or causality. A supplement appearing in many reports is often just a popular supplement — not a dangerous one.
3. The "serious_30" metric is effectively zero for every supplement this week because FAERS data hadn't been updated to within 30 days of run date. Expect this metric to populate as the FDA refresh cycle catches up.
4. Multivitamins and broad categories ("multivitamin", "probiotic") aggregate many distinct products. Treat their totals as scale indicators, not safety signals.

## Content gap check

Step 4 of the task calls for checking site content against any flagged supplements. **No supplements were flagged in this baseline run**, so no content-gap audit is required. Next week's run, with a true week-over-week baseline, will surface gaps for any newly-flagged items.

## Next run

Next week's scan will compare against `reviews/faers-counts-latest.json` (just written) for true week-over-week deltas. Expect more meaningful signals once the comparison baseline exists.
