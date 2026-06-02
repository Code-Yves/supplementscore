# FAERS Adverse Event Signal Scan — 2026-06-02

**Source:** OpenFDA FAERS `drug/event` endpoint
**Prior baseline run:** 2026-05-26 (week-over-week comparison anchor)
**Supplements checked:** 50
**API calls made:** 200 signal queries + 5 validation spot-checks
**Errors:** 0
**Baseline file written:** `reviews/faers-counts-latest.json` (overwrites prior week)

## Methodology

For each tracked supplement, queried OpenFDA FAERS for: all-time `total`, reports in the trailing 90 days (`recent_90`), reports in the preceding 90 days (`prior_90`, i.e. 180–90 days ago), and serious reports in the last 30 days (`serious_30`). Query windows anchored to the run date:

- `recent_90`: receivedate `[20260305 TO 20260602]`
- `prior_90`: receivedate `[20251205 TO 20260304]`
- `serious_30`: receivedate `[20260504 TO 20260602]` AND `serious:1`

Compared week-over-week against the saved baseline from 2026-05-26.

The 50-supplement tracking list was carried forward from the established baseline rather than re-derived, to keep week-over-week comparison apples-to-apples (signal detection requires a stable cohort). It covers all Tier 3/Tier 4 entries flagged in prior runs plus the high-use staples (creatine, fish oil, vitamin D, magnesium, ashwagandha, melatonin, berberine, NAC, collagen, probiotics, iron, zinc). `data.js` was confirmed intact this run — it parses cleanly to 780 supplement entries (`const S=[…]`, tier key `t`), and all tracked high-risk names remain present in the dataset.

Signal thresholds:

- 🚨 **New signal:** `serious_30 ≥ 3`, OR `recent_90 > prior_90 × 2` (and recent_90 ≥ 5), OR all-time total grew >100% week-over-week.
- ⚠️ **Watch:** `recent_90 > prior_90 × 1.5` (and recent_90 ≥ 3), OR `prior_90 = 0` with recent_90 ≥ 3 (n=1–2 reports treated as noise), OR all-time total grew >50% WoW.
- ✅ **No change** otherwise.

## 🚨 New signals

_None._ No supplement crossed the new-signal thresholds.

## ⚠️ Watch list

_None._ No supplement crossed the watch-list thresholds.

## Important caveat — FAERS data lag persists (and now fully empties the 30-day serious window)

OpenFDA FAERS continues to update on a multi-week-to-quarterly cadence, so the trailing windows keep decaying week over week as the window slides forward over already-ingested data without new reports landing to replace the oldest days. This is a window-sliding artifact, **not** a real decline in adverse events. Trailing-90 counts fell again across every high-volume entry vs. the 2026-05-26 baseline: Vitamin D3 (1,349 → 1,034, −23%), Magnesium (588 → 459, −22%), Melatonin (474 → 365, −23%), Iron (363 → 270, −26%), Zinc (189 → 141, −25%).

**New observation this week — the `serious_30` window has zero detection power right now.** Direct validation confirmed FAERS currently holds **0 reports of any kind** (serious or not) with a receivedate in the trailing 30 days (`[20260504 TO 20260602]`). For reference, Vitamin D3 shows 95,106 serious reports all-time and 15,855 reports across calendar-year 2024, but 0 in the last 30 days — so the uniform `serious_30 = 0` across all 50 supplements reflects ingestion lag, not an absence of serious events. The 30-day serious tripwire therefore cannot fire until FAERS catches up; the `recent_90 vs prior_90` ratio remains the more meaningful (though still lag-dampened) comparison.

All-time totals shifted on **4 of 50** supplements, every change within ±6 reports (Iron 65,125→65,119; Melatonin 52,804→52,806; Ginkgo biloba 1,431→1,429; Zinc 17,414→17,413). This is consistent with FAERS post-hoc deduplication/correction rather than a fresh data load.

## ✅ No change — items with non-trivial recent activity

Sorted by `recent_90` desc. These are the supplements FAERS is actively holding reports on (lag-affected window, but useful for surveillance continuity).

| Supplement | Tier | Total all-time | r90 (this run) | r90 (last week) | p90 | Serious 30d |
|---|---|---:|---:|---:|---:|---:|
| Vitamin D3 | T1 | 169,825 | 1034 | 1349 | 4043 | 0 |
| Magnesium | T1 | 79,279 | 459 | 588 | 1659 | 0 |
| Melatonin | T2 | 52,806 | 365 | 474 | 1242 | 0 |
| Iron | T2 | 65,119 | 270 | 363 | 1117 | 0 |
| Zinc | T1 | 17,413 | 141 | 189 | 539 | 0 |
| High-dose fat-soluble vitamins (A, E) | T4 | 6,166 | 33 | 38 | 132 | 0 |
| Alpha-Lipoic Acid (ALA) | T3 | 4,684 | 20 | 22 | 102 | 0 |
| Collagen for muscle strength | T3 | 2,634 | 19 | 23 | 92 | 0 |
| Berberine | T2 | 612 | 14 | 18 | 38 | 0 |
| Tianeptine ("gas station heroin") | T4 | 483 | 4 | 5 | 12 | 0 |
| Glutamine (standalone, healthy adults) | T3 | 879 | 3 | 4 | 11 | 0 |
| Creatine monohydrate | T1 | 146 | 2 | 2 | 5 | 0 |
| Black cohosh high-dose | T4 | 883 | 2 | 4 | 17 | 0 |
| Kava (high-dose/extract) | T4 | 54 | 1 | 1 | 7 | 0 |
| Phosphoric acid (urinary) | T4 | 238 | 1 | 1 | 0 | 0 |
| Methyl-1-testosterone (oral steroid) | T4 | 85 | 1 | 1 | 0 | 0 |

The remaining 34 tracked supplements returned `recent_90 = 0` and `serious_30 = 0` (Omega-3, Ashwagandha, NAC, Probiotics, Kratom, Phenibut, Multivitamins, Ginkgo, Green tea extract, Resveratrol, Valerian, Spirulina, 5-HTP, Panax ginseng, Lion's mane, Bacopa, NMN, Colostrum, Black seed oil, Turkesterone, Detox products, Licorice, Colloidal silver, Aristolochic acid, Synephrine, DMAA/DMHA, Usnic acid, Fo-Ti, Essential oils, Greater celandine, Bitter orange, Androstenedione, 1,3-DMBA, Collagen peptides).

## Week-over-week delta on `recent_90`

Compares trailing 90-day count this run vs. last week. All deltas are negative or flat — consistent with the FAERS update lag described above, not a real reduction in events.

| Supplement | r90 last week | r90 this week | Δ | Δ % |
|---|---:|---:|---:|---:|
| Vitamin D3 | 1349 | 1034 | -315 | -23% |
| Magnesium | 588 | 459 | -129 | -22% |
| Melatonin | 474 | 365 | -109 | -23% |
| Iron | 363 | 270 | -93 | -26% |
| Zinc | 189 | 141 | -48 | -25% |
| High-dose fat-soluble vitamins (A, E) | 38 | 33 | -5 | -13% |
| Collagen for muscle strength | 23 | 19 | -4 | -17% |
| Berberine | 18 | 14 | -4 | -22% |
| Alpha-Lipoic Acid (ALA) | 22 | 20 | -2 | -9% |
| Black cohosh high-dose | 4 | 2 | -2 | -50% |
| Tianeptine ("gas station heroin") | 5 | 4 | -1 | -20% |
| Glutamine (standalone, healthy adults) | 4 | 3 | -1 | -25% |
| Creatine monohydrate | 2 | 2 | 0 | 0% |
| Kava (high-dose/extract) | 1 | 1 | 0 | 0% |
| Phosphoric acid (urinary) | 1 | 1 | 0 | 0% |
| Methyl-1-testosterone (oral steroid) | 1 | 1 | 0 | 0% |

## Site content-gap check

No supplement crossed the signal or watch thresholds this week, so no on-site content-gap analysis was warranted (per the task's "for flagged supplements" condition). The high-risk Tier 4 entries that drive most content-gap risk (tianeptine, kava, kratom, black cohosh, DMAA, aristolochic acid) all sit at or below their lag-adjusted baselines with zero serious-30 reports.

## Forward-looking note

This is the fourth consecutive weekly run with no new or watch-list signals, and every run has shown the same monotonic decay of the trailing windows. The meaningful inflection to watch for is the opposite of a signal spike: **a week where `recent_90` *rises* instead of decaying.** That would indicate a FAERS data refresh has finally landed, at which point the trailing-window and serious-30 comparisons regain their detection power and this scan should be re-run with attention to the newly-ingested period. Until then, the surveillance value is primarily continuity and confirmation that no acute reporting surge is present in already-ingested data.

## Run quality

All 200 signal queries completed without errors (50 supplements × 4 queries each). 50/50 supplements returned counts cleanly. 5 additional validation spot-checks confirmed the `serious:1` filter and date-range windowing behave correctly (e.g., Vitamin D3 all-time serious = 95,106; 2024 full-year = 15,855), isolating the uniform `serious_30 = 0` to ingestion lag rather than query error.
