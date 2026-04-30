# Supplement Deep Audit — 2026-04-28

**Mode:** no-action
**Cadence policy:** docs/cadence-policy.md (per-tier)
**Regulator window:** last 14 days (2026-04-14 → 2026-04-28)

## Sanity checks

All required files present:

- `data.js` ✓ — contains `S` (733 entries), `LAST_REVIEW`, `LAST_REVIEW_DEFAULT='2026-04-27'`
- `app.js` ✓ — contains `CADENCE_POLICY` and `cadenceForSupp`
- `docs/cadence-policy.md` ✓
- `docs/citation-schema.md` ✓
- `sources/registry.json` ✓
- `scripts/check_regulator_alerts.py` ✓ (exit 0)
- `reviews/` ✓

## Regulator alerts triggered

None. `python3 scripts/check_regulator_alerts.py --since 2026-04-14 --quiet` returned an empty array (`[]`). No FDA/EFSA/EMA/Health Canada items in the 14-day window matched any supplement in `S`.

## Eligible queue (priority order)

| Priority | Tier | Name | Last reviewed | Days overdue |
|---|---|---|---|---|
| — | — | — | — | — |

**Eligible count: 0.**

### Why nothing is eligible today

`LAST_REVIEW_DEFAULT` is `2026-04-27` — set yesterday by an earlier task in the cadence chain. Today is `2026-04-28`, so for every supplement that relies on the default, days-since-last-review = 1.

Per-tier cadence vs. days elapsed:

| Tier | Count | Cadence | Earliest eligible (default lr) |
|---|---|---|---|
| t1 (Strong Evidence) | 29 | 30 d | 2026-05-27 |
| t2 | 298 | 60 d | 2026-06-26 |
| t3 (Trending) | 317 | 60 d | 2026-06-26 |
| t4 (Risky/Avoid) | 89 | 14 d | 2026-05-11 |

The two per-supplement overrides (`NMN / NAD+ precursors` → 2026-04-23; `Lion's mane mushroom` → 2026-04-25) are also well inside their cadence windows.

## Audited today (count: 0)

No per-supplement audits were performed. No `data.js` edits, no `LAST_REVIEW` updates, no per-supplement review files written.

## Stats

- Eligible this week: 0
- Audited: 0 (budget: 15)
- Tier movements: 0
- New industry-funded citations flagged: 0
- Files touched: none

## Verification

Skipped — no edits to verify. `data.js` is unchanged from its pre-task state.

## Notes for next run

- The earliest the default-lr cohort becomes eligible again is **2026-05-11** (t4 supplements relying on the default).
- The next routine surfaces of t4 supplements (89 entries) on 2026-05-11 will be the largest queue and should be expected to saturate the 15-supplement budget for that week.
- Consider whether `LAST_REVIEW_DEFAULT` ratcheting to "yesterday" by upstream tasks is intentional. If the daily article-review task is rolling the default forward without per-supplement evidence work, the deep-audit cadence will rarely fire. Worth a human eye on `LAST_REVIEW_DEFAULT` semantics, but not in scope to change here.
