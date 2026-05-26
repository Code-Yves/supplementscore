# FAERS Adverse Event Signal Scan — 2026-05-26

**Source:** OpenFDA FAERS `drug/event` endpoint  
**Prior baseline run:** 2026-05-19 (week-over-week comparison anchor)  
**Supplements checked:** 50  
**API calls made:** 200  
**Errors:** 0  
**Baseline file written:** `reviews/faers-counts-latest.json` (overwrites prior week)

## Methodology

For each supplement, queried OpenFDA FAERS for: all-time `total`, reports in the trailing 90 days (`recent_90`), reports in the preceding 90 days (`prior_90`, i.e. 180–90 days ago), and serious reports in the last 30 days (`serious_30`). Compared week-over-week against the saved baseline from 2026-05-19.

Signal thresholds:

- 🚨 **New signal:** `serious_30 ≥ 3`, OR `recent_90 > prior_90 × 2` (and recent_90 ≥ 5), OR all-time total grew >100% week-over-week.
- ⚠️ **Watch:** `recent_90 > prior_90 × 1.5` (and recent_90 ≥ 3), OR `prior_90 = 0` with recent_90 ≥ 3 (n=1-2 reports are treated as noise), OR all-time total grew >50% WoW.
- ✅ **No change** otherwise.

## Important caveat — FAERS data lag persists

OpenFDA FAERS continues to update on a multi-week cadence. The trailing 90-day window again came in lower than the preceding 90-day window across nearly every supplement with non-trivial volume — that's a window-sliding artifact, not a real drop in adverse events. Compared to the 2026-05-19 baseline, trailing-90 counts decreased again across the high-volume entries: Vitamin D3 (1,794 → 1,349), Magnesium (744 → 588), Melatonin (603 → 474), Iron (462 → 363), Zinc (231 → 189). The 90-day window slid forward 7 days while FAERS itself only registered de-minimis changes.

All-time totals shifted on **6 of 50** supplements this week, and all shifts were within ±2 reports (
Vitamin D3: 169824→169825, Magnesium: 79281→79279, Iron: 65123→65125, High-dose fat-soluble vitamins (A, E): 6167→6166, Multivitamins (healthy adults): 48902→48900, Glutamine (standalone, healthy adults): 878→879
). This is consistent with FAERS post-hoc deduplication/correction rather than a full data refresh.

## 🚨 New signals

_None._ No supplement crossed the new-signal thresholds (serious_30 ≥ 3; recent_90 > prior_90 × 2 with recent_90 ≥ 5; or total +100% WoW).

## ⚠️ Watch list

_None._ No supplement crossed the watch-list thresholds (recent_90 > prior_90 × 1.5 with recent_90 ≥ 3; or total +50% WoW).

## ✅ No change — items with non-trivial recent activity

Sorted by `recent_90` desc. These are the supplements FAERS is actively receiving reports on (lag-affected window, but still useful for surveillance).

| Supplement | Tier | Total all-time | r90 (this run) | r90 (last week) | p90 | Serious 30d |
|---|---|---:|---:|---:|---:|---:|
| Vitamin D3 | T1 | 169,825 | 1349 | 1794 | 4096 | 0 |
| Magnesium | T1 | 79,279 | 588 | 744 | 1693 | 0 |
| Melatonin | T2 | 52,804 | 474 | 603 | 1252 | 0 |
| Iron | T2 | 65,125 | 363 | 462 | 1123 | 0 |
| Zinc | T1 | 17,414 | 189 | 231 | 542 | 0 |
| High-dose fat-soluble vitamins (A, E) | T4 | 6,166 | 38 | 42 | 130 | 0 |
| Collagen for muscle strength | T3 | 2,634 | 23 | 33 | 95 | 0 |
| Alpha-Lipoic Acid (ALA) | T3 | 4,684 | 22 | 28 | 109 | 0 |
| Berberine | T2 | 612 | 18 | 24 | 37 | 0 |
| Tianeptine ("gas station heroin") | T4 | 483 | 5 | 5 | 11 | 0 |
| Black cohosh high-dose | T4 | 883 | 4 | 7 | 15 | 0 |
| Glutamine (standalone, healthy adults) | T3 | 879 | 4 | 4 | 10 | 0 |
| Creatine monohydrate | T1 | 146 | 2 | 2 | 5 | 0 |
| Kava (high-dose/extract) | T4 | 54 | 1 | 1 | 7 | 0 |
| Phosphoric acid (urinary) | T4 | 238 | 1 | 1 | 1 | 0 |
| Methyl-1-testosterone (oral steroid) | T4 | 85 | 1 | 1 | 0 | 0 |

## Week-over-week delta on `recent_90`

Compares trailing 90-day count this run vs last week. Negative deltas reflect the FAERS update lag described above.

| Supplement | r90 last week | r90 this week | Δ | Δ % |
|---|---:|---:|---:|---:|
| Vitamin D3 | 1794 | 1349 | -445 | -25% |
| Magnesium | 744 | 588 | -156 | -21% |
| Melatonin | 603 | 474 | -129 | -21% |
| Iron | 462 | 363 | -99 | -21% |
| Zinc | 231 | 189 | -42 | -18% |
| Collagen for muscle strength | 33 | 23 | -10 | -30% |
| Berberine | 24 | 18 | -6 | -25% |
| Alpha-Lipoic Acid (ALA) | 28 | 22 | -6 | -21% |
| High-dose fat-soluble vitamins (A, E) | 42 | 38 | -4 | -10% |
| Black cohosh high-dose | 7 | 4 | -3 | -43% |
| Licorice root high-dose | 1 | 0 | -1 | -100% |
| Creatine monohydrate | 2 | 2 | +0 | +0% |
| Kava (high-dose/extract) | 1 | 1 | +0 | +0% |
| Tianeptine ("gas station heroin") | 5 | 5 | +0 | +0% |
| Phosphoric acid (urinary) | 1 | 1 | +0 | +0% |
| Methyl-1-testosterone (oral steroid) | 1 | 1 | +0 | +0% |
| Glutamine (standalone, healthy adults) | 4 | 4 | +0 | +0% |

## Site content-gap check

No supplement crossed the signal threshold this week, so no on-site content gap analysis was warranted. Continue routine surveillance — if Vitamin D3/Magnesium/Melatonin r90 *increases* in a future week (rather than continuing to decay), that would indicate a FAERS refresh has landed and would be worth re-running with the updated lag baseline.

## Run quality

All 200 API calls completed without errors. 50/50 supplements returned counts cleanly.
