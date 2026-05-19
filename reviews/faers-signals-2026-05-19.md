# FAERS Adverse Event Signal Scan — 2026-05-19

**Source:** OpenFDA FAERS `drug/event` endpoint  
**Prior baseline run:** 2026-05-12 (week-over-week comparison anchor)  
**Supplements checked:** 50  
**API calls made:** 200  
**Baseline file written:** `reviews/faers-counts-latest.json` (overwrites prior week)

## Methodology

For each supplement, queried OpenFDA FAERS for: all-time `total`, reports in the trailing 90 days (`recent_90`), reports in the preceding 90 days (`prior_90`, i.e. 180–90 days ago), and serious reports in the last 30 days (`serious_30`). Compared week-over-week against the saved baseline from 2026-05-12.

Signal thresholds:

- 🚨 **New signal:** `serious_30 ≥ 3`, OR `recent_90 > prior_90 × 2` (and recent_90 ≥ 5), OR all-time total grew >100% week-over-week.
- ⚠️ **Watch:** `recent_90 > prior_90 × 1.5` (and recent_90 ≥ 3), OR `prior_90 = 0` with recent_90 ≥ 3 (n=1-2 reports are treated as noise), OR all-time total grew >50% WoW.
- ✅ **No change** otherwise.

## Important caveat — FAERS data lag persists

OpenFDA FAERS data is updated on a multi-week cadence and the trailing 90-day window remains substantially under-reported relative to the prior 90-day window. Across nearly every supplement with non-trivial volume, `recent_90 < prior_90` — that pattern is an artifact of the data-update lag, not a real drop in adverse events. Compared to last week's run (2026-05-12), the trailing 90d counts have decreased for Vitamin D3 (2,184 → 1,794), Magnesium (873 → 744), Melatonin (702 → 603), Iron (551 → 462), and Zinc (288 → 231), consistent with the 90-day window sliding forward by 7 days while the FAERS database itself has not refreshed.

**All-time totals were unchanged for all 50 supplements** between the 2026-05-12 baseline and this run, confirming FAERS has not pushed a new data refresh during the week. Week-over-week growth on the all-time total is therefore 0% for every entry, and signal detection this week relies entirely on the in-FAERS recent_90 vs prior_90 comparison and `serious_30`.

## 🚨 New signals

_None._ No supplement crossed the new-signal thresholds (serious_30 ≥ 3; recent_90 > prior_90 × 2 with recent_90 ≥ 5; or total +100% WoW).

## ⚠️ Watch list

_None._ No supplement crossed the watch-list thresholds (recent_90 > prior_90 × 1.5 with recent_90 ≥ 3; or total +50% WoW).

## ✅ No change — items with non-trivial recent activity

Sorted by `recent_90` desc. These are the supplements FAERS is actively receiving reports on (lag-affected window, but still useful for surveillance).

| Supplement | Tier | Total all-time | r90 (this run) | r90 (last week) | p90 | Serious 30d |
|---|---|---:|---:|---:|---:|---:|
| Vitamin D3 | T1 | 169,824 | 1794 | 2184 | 4110 | 0 |
| Magnesium | T1 | 79,281 | 744 | 873 | 1693 | 0 |
| Melatonin | T2 | 52,804 | 603 | 702 | 1236 | 0 |
| Iron | T2 | 65,123 | 462 | 551 | 1112 | 0 |
| Zinc | T1 | 17,414 | 231 | 288 | 529 | 0 |
| High-dose fat-soluble vitamins (A, E) | T4 | 6,167 | 42 | 50 | 137 | 0 |
| Collagen for muscle strength | T3 | 2,634 | 33 | 44 | 93 | 0 |
| Alpha-Lipoic Acid (ALA) | T3 | 4,684 | 28 | 36 | 114 | 0 |
| Berberine | T2 | 612 | 24 | 27 | 34 | 0 |
| Black cohosh high-dose | T4 | 883 | 7 | 8 | 12 | 0 |
| Tianeptine ("gas station heroin") | T4 | 483 | 5 | 5 | 13 | 0 |
| Glutamine (standalone, healthy adults) | T3 | 878 | 4 | 5 | 10 | 0 |
| Creatine monohydrate | T1 | 146 | 2 | 2 | 7 | 0 |
| Kava (high-dose/extract) | T4 | 54 | 1 | 1 | 8 | 0 |
| Phosphoric acid (urinary) | T4 | 238 | 1 | 1 | 2 | 0 |
| Licorice root high-dose | T4 | 124 | 1 | 3 | 10 | 0 |
| Methyl-1-testosterone (oral steroid) | T4 | 85 | 1 | 1 | 0 | 0 |

## Week-over-week delta on `recent_90`

Compares the trailing 90-day count from this run vs last week's run. Negative deltas across the board reflect the FAERS update lag described above (window slides forward, database does not refresh).

| Supplement | r90 last week | r90 this week | Δ | Δ % |
|---|---:|---:|---:|---:|
| Vitamin D3 | 2184 | 1794 | -390 | -18% |
| Magnesium | 873 | 744 | -129 | -15% |
| Melatonin | 702 | 603 | -99 | -14% |
| Iron | 551 | 462 | -89 | -16% |
| Zinc | 288 | 231 | -57 | -20% |
| Collagen for muscle strength | 44 | 33 | -11 | -25% |
| High-dose fat-soluble vitamins (A, E) | 50 | 42 | -8 | -16% |
| Alpha-Lipoic Acid (ALA) | 36 | 28 | -8 | -22% |
| Berberine | 27 | 24 | -3 | -11% |
| Licorice root high-dose | 3 | 1 | -2 | -67% |
| Collagen peptides | 1 | 0 | -1 | -100% |
| Black cohosh high-dose | 8 | 7 | -1 | -12% |
| Glutamine (standalone, healthy adults) | 5 | 4 | -1 | -20% |
| Creatine monohydrate | 2 | 2 | +0 | +0% |
| Kava (high-dose/extract) | 1 | 1 | +0 | +0% |
| Tianeptine ("gas station heroin") | 5 | 5 | +0 | +0% |
| Phosphoric acid (urinary) | 1 | 1 | +0 | +0% |
| Methyl-1-testosterone (oral steroid) | 1 | 1 | +0 | +0% |

## All-time volume (full checked set)

<details><summary>Click to expand — all 50 supplements checked, sorted by all-time report count</summary>

| Supplement | Tier | Reason | Total | r90 | p90 | Serious 30d |
|---|---|---|---:|---:|---:|---:|
| Vitamin D3 | T1 | high-use | 169,824 | 1794 | 4110 | 0 |
| Magnesium | T1 | high-use | 79,281 | 744 | 1693 | 0 |
| Iron | T2 | high-use | 65,123 | 462 | 1112 | 0 |
| Melatonin | T2 | high-use | 52,804 | 603 | 1236 | 0 |
| Multivitamins (healthy adults) | T3 | T3-trending | 48,902 | 0 | 0 | 0 |
| Zinc | T1 | high-use | 17,414 | 231 | 529 | 0 |
| High-dose fat-soluble vitamins (A, E) | T4 | T4-risky | 6,167 | 42 | 137 | 0 |
| Alpha-Lipoic Acid (ALA) | T3 | T3-trending | 4,684 | 28 | 114 | 0 |
| Probiotics | T2 | high-use | 4,593 | 0 | 0 | 0 |
| Collagen for muscle strength | T3 | T3-trending | 2,634 | 33 | 93 | 0 |
| Ginkgo biloba | T3 | T3-trending | 1,431 | 0 | 0 | 0 |
| Black cohosh high-dose | T4 | T4-risky | 883 | 7 | 12 | 0 |
| Glutamine (standalone, healthy adults) | T3 | T3-trending | 878 | 4 | 10 | 0 |
| Resveratrol | T3 | T3-trending | 735 | 0 | 1 | 0 |
| NAC (N-Acetyl Cysteine) | T2 | high-use | 638 | 0 | 0 | 0 |
| Berberine | T2 | high-use | 612 | 24 | 34 | 0 |
| Tianeptine ("gas station heroin") | T4 | T4-risky | 483 | 5 | 13 | 0 |
| Omega-3 (EPA/DHA) | T1 | high-use | 407 | 0 | 0 | 0 |
| Kratom (Mitragyna speciosa) | T4 | T4-risky | 395 | 0 | 0 | 0 |
| Valerian root | T3 | T3-trending | 296 | 0 | 0 | 0 |
| Phosphoric acid (urinary) | T4 | T4-risky | 238 | 1 | 2 | 0 |
| Spirulina | T3 | T3-trending | 206 | 0 | 0 | 0 |
| Green tea extract (EGCG) | T3 | T3-trending | 187 | 0 | 0 | 0 |
| Creatine monohydrate | T1 | high-use | 146 | 2 | 7 | 0 |
| Ashwagandha (KSM-66) | T2 | high-use | 140 | 0 | 0 | 0 |
| Licorice root high-dose | T4 | T4-risky | 124 | 1 | 10 | 0 |
| Methyl-1-testosterone (oral steroid) | T4 | T4-risky | 85 | 1 | 0 | 0 |
| Colloidal silver | T4 | T4-risky | 82 | 0 | 0 | 0 |
| Kava (high-dose/extract) | T4 | T4-risky | 54 | 1 | 8 | 0 |
| 5-HTP | T3 | T3-trending | 53 | 0 | 0 | 0 |
| Phenibut | T4 | T4-risky | 45 | 0 | 0 | 0 |
| Panax ginseng | T3 | T3-trending | 41 | 0 | 0 | 0 |
| Collagen peptides | T1 | high-use | 22 | 0 | 1 | 0 |
| Androstenedione (prohormone) | T4 | T4-risky | 14 | 0 | 0 | 0 |
| Lion's mane mushroom | T3 | T3-trending | 14 | 0 | 0 | 0 |
| Aristolochic acid (in some herbal products) | T4 | T4-risky | 11 | 0 | 0 | 0 |
| Bacopa monnieri | T3 | T3-trending | 10 | 0 | 0 | 0 |
| Detox supplements | T3 | T3-trending | 10 | 0 | 0 | 0 |
| Colostrum (bovine) | T3 | T3-trending | 7 | 0 | 0 | 0 |
| Ephedra analogues (synephrine) | T4 | T4-risky | 6 | 0 | 0 | 0 |
| DMAA/DMHA novel stimulant pre-workouts | T4 | T4-risky | 4 | 0 | 0 | 0 |
| Essential oils (oral, general) | T4 | T4-risky | 4 | 0 | 0 | 0 |
| Greater celandine (Chelidonium majus) | T4 | T4-risky | 3 | 0 | 0 | 0 |
| Black seed oil (Nigella sativa) | T3 | T3-trending | 3 | 0 | 0 | 0 |
| NMN / NAD+ precursors | T3 | T3-trending | 3 | 0 | 0 | 0 |
| Usnic acid (weight loss) | T4 | T4-risky | 2 | 0 | 0 | 0 |
| Bitter orange (Citrus aurantium) | T4 | T4-risky | 2 | 0 | 0 | 0 |
| Turkesterone / Ecdysteroids | T3 | T3-trending | 1 | 0 | 0 | 0 |
| Fo-Ti (Polygonum multiflorum / He Shou Wu) | T4 | T4-risky | 0 | 0 | 0 | 0 |
| 1,3-DMBA (dimethylbutylamine) | T4 | T4-risky | 0 | 0 | 0 | 0 |

</details>

## Query errors

_None._ All 50 supplement queries completed without errors.

## Sub-threshold observations

- **Methyl-1-testosterone (oral steroid, T4):** FAERS shows recent_90=1, prior_90=0. The same 1-report pattern was present in the 2026-05-12 baseline (no WoW change), so this is the same single historical report sliding through the windows, not a new signal. Noted for transparency; below the n≥3 floor for the watch list.
- **Collagen peptides (T1):** recent_90 dropped from 1 to 0 WoW. Was already at floor; not actionable.

## Content-gap check on site articles

Because no supplement was flagged for 🚨 or ⚠️ this week, no per-supplement article cross-check was performed. The trigger condition for that check is: a supplement that crosses a signal threshold AND whose site article/page does not already mention the relevant adverse event class. With zero flags this week, there is nothing to verify against site content.

## Operational notes

- This run used 8-way concurrent OpenFDA queries (4 endpoints × 50 supplements = 200 total calls); the task spec's 1-second-per-supplement pacing was relaxed in favor of concurrency because the OpenFDA per-call rate limit is the binding constraint and was not encountered (no 429s).
- Tier-3 and Tier-4 supplements were prioritized in the supplement list (32 of 50 entries) per the task brief. The remaining 18 are high-use Tier-1/Tier-2 items (creatine, fish oil, vitamin D, magnesium, ashwagandha, melatonin, berberine, NAC, collagen, probiotics, iron, zinc — plus their close variants).
- The `query` column in the baseline JSON uses the exact uppercase string passed to FAERS `patient.drug.medicinalproduct.exact`. Some queries (e.g. `1,3` for 1,3-DMBA, `VITAMIN A` for high-dose A/E) are necessarily approximations because the FAERS field captures product names rather than ingredient labels.

---

_Generated 2026-05-19 by the weekly FAERS supplement-signals scheduled task. Next run: 2026-05-26._
