# Article Review — 2026-04-29

**Mode:** no-action
**Cadence policy:** docs/cadence-policy.md (tiered)
**Regulator alerts checked:** FDA MedWatch + EFSA News (last 7 days, since 2026-04-22)

## Regulator alerts triggered

None. `python3 scripts/check_regulator_alerts.py --since 2026-04-22 --quiet --json /tmp/reg_alerts.json` returned an empty array. No supplements were pulled forward outside the routine cadence.

## Eligible queue (priority order)

| Priority | ID | Category | Tier | Last reviewed | Days overdue |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

The eligibility check produced 0 rows. All 241 articles in `ARTICLES_BY_ID` are still inside their cadence window per `CADENCE_POLICY` (t4/safety:14, kids/breakthrough:30, guide/myth:90).

The closest-to-eligible articles are the safety pieces last reviewed on 2026-04-24, which become due on 2026-05-08 (9 days from today). The most recent batch of reviews wrapped on 2026-04-27 and the cadence machinery is functioning as intended: nothing is overdue.

Distribution of last-reviewed dates (most recent batches):
- 2026-04-27 — 59 articles
- 2026-04-26 — 112 articles
- 2026-04-25 — 40 articles
- 2026-04-24 — 30 articles

Category mix across the 241 articles: 63 guide, 62 breakthrough, 49 myth, 38 kids, 29 safety. Cadence assignments: 112 at 90d, 100 at 30d, 29 at 14d.

## Reviewed today

None — no eligible articles and no regulator-driven exceptions.

Per the skill: "If zero are eligible, write a 'no-action' report and stop — do not force reviews." No edits were made to `data.js`, `index.html`, or `LAST_REVIEW`. No `last-reviewed` comments were touched.

## Stats

- Articles eligible today: 0
- Articles reviewed: 0 (budget: 10)
- Tier movements: 0
- New industry-funded citations flagged: 0
- Files touched: none

## Notes for next run

- First articles back in queue on **2026-05-08**: IDs 4, 9, 17, 21, 29 (all `safety`, 14-day cadence, last reviewed 2026-04-24). Expect a heavy safety-tier day on the 8th.
- A second wave (IDs 31, 35, 41, 46, 55, 58, 67) lands on 2026-05-09.
- No verifier scripts were run — the SKILL only requires verification after edits, and this run made none.
- No regulator alerts since 2026-04-22; openFDA / EFSA feeds remain quiet for the supplement set we track.
