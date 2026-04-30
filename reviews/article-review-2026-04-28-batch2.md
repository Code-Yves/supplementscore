# Article Review — 2026-04-28 (batch 2)

**Mode:** no-action
**Cadence policy:** docs/cadence-policy.md (tiered — first run under the new policy)
**Regulator alerts checked:** FDA MedWatch + EFSA News (last 7 days, since 2026-04-21)

> Note: an earlier run today produced `article-review-2026-04-28.md` under the
> previous fixed 20-day rolling cycle. This batch re-evaluates the queue under
> the **new tiered cadence** (`CADENCE_POLICY` in `app.js`:
> t1:30, t2:60, t3:60, t4:14, safety:14, kids:30, breakthrough:30,
> guide:90, myth:90). Conclusion is the same: nothing is eligible today.

## Step 1 — Sanity checks

All required files present:

| File | Status |
|---|---|
| `data.js` (S, ARTICLE_MAP, ARTICLES_BY_ID, LAST_REVIEW, LAST_REVIEW_DEFAULT) | OK |
| `app.js` (CADENCE_POLICY, cadenceForArticle, cadenceForSupp) | OK (line 22–24) |
| `index.html` | OK (241 articles, all carry a `<!-- last-reviewed: -->` comment) |
| `docs/cadence-policy.md` | OK |
| `docs/citation-schema.md` | OK |
| `sources/registry.json` | OK |
| `scripts/check_regulator_alerts.py` | OK |
| `reviews/` | OK |

## Step 2 — Regulator alerts

```
python3 scripts/check_regulator_alerts.py --since 2026-04-21 --quiet --json /tmp/reg_alerts.json
→ /tmp/reg_alerts.json = []
```

**No FDA MedWatch or EFSA alerts in the last 7 days.** Nothing pulled forward.

## Step 3 — Eligibility under tiered cadence

Eligibility test: `(today - last_reviewed) >= cadence_for_category`

- Today: 2026-04-28
- Oldest `last-reviewed` comment in `index.html`: **2026-04-24** (4 days ago)
- Smallest cadence in policy: **14 days** (safety / t4)

`4 < 14` for every article in the corpus → **0 articles eligible.**

### Last-reviewed distribution

| Date       | Articles |
|------------|---------:|
| 2026-04-24 |       30 |
| 2026-04-25 |       40 |
| 2026-04-26 |      112 |
| 2026-04-27 |       59 |
| **Total**  |  **241** |

### Corpus by category (all 241 now have a `c:` field — backfill from
`reviews/category-backfill-2026-04-28.md` is complete)

| Category     | Count | Cadence |
|--------------|------:|--------:|
| breakthrough |    62 |   30 d  |
| guide        |    63 |   90 d  |
| kids         |    38 |   30 d  |
| myth         |    49 |   90 d  |
| safety       |    29 |   14 d  |

## Step 4 — Today's budget

Eligible: 0. Budget unused. Per SKILL Step 4 — "If zero are eligible, write a
'no-action' report and stop — do not force reviews." No edits made.

## Eligible queue (priority order)

_Empty._ The next articles to come due under the new cadence are listed below
for visibility — they are **not** reviewed today.

## Reviewed today

_None._

## Next eligible (visibility, not action)

Earliest eligibility windows by category:

| Category     | Cadence | Earliest eligible | Articles tied at that date |
|--------------|--------:|-------------------|---------------------------:|
| safety       |   14 d  | **2026-05-08**    |                          5 |
| kids         |   30 d  | 2026-05-24        |                          2 |
| breakthrough |   30 d  | 2026-05-24        |                          7 |
| myth         |   90 d  | 2026-07-23        |                          7 |
| guide        |   90 d  | 2026-07-23        |                          9 |

First articles to come due (next 10):

| ID | Category | Last reviewed | Eligible on |
|---:|----------|---------------|-------------|
|  4 | safety   | 2026-04-24    | 2026-05-08  |
|  9 | safety   | 2026-04-24    | 2026-05-08  |
| 17 | safety   | 2026-04-24    | 2026-05-08  |
| 21 | safety   | 2026-04-24    | 2026-05-08  |
| 29 | safety   | 2026-04-24    | 2026-05-08  |
| 31 | safety   | 2026-04-25    | 2026-05-09  |
| 35 | safety   | 2026-04-25    | 2026-05-09  |
| 41 | safety   | 2026-04-25    | 2026-05-09  |
| 46 | safety   | 2026-04-25    | 2026-05-09  |
| 55 | safety   | 2026-04-25    | 2026-05-09  |

## Stats

- Articles eligible today: **0**
- Articles reviewed: **0** (budget: 10 — unused)
- Tier movements: **0**
- New industry-funded citations flagged: 0
- Files touched: **none** (no `index.html` or `data.js` edits)
- Regulator alerts triggered: 0
- Verification scripts: not run (no edits to verify)

## Notes for the next run

- The first non-zero queue under the new cadence opens **2026-05-08** with the
  five safety articles last reviewed on 2026-04-24.
- All 241 articles now carry both a `last-reviewed` HTML comment and a `c:`
  field in `ARTICLES_BY_ID` — the cadence machinery has full coverage.
- `LAST_REVIEW_DEFAULT` is `2026-04-27`. Two per-supplement entries override it
  (`'NMN / NAD+ precursors':'2026-04-23'`, `"Lion's mane mushroom":'2026-04-25'`).
  Nothing requires bumping today.
