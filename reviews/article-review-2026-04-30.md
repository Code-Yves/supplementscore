# Article Review — 2026-04-30

**Mode:** no-action
**Cadence policy:** docs/cadence-policy.md (tiered)
**Regulator alerts checked:** FDA MedWatch + EFSA News (last 7 days, since 2026-04-23)

## Sanity checks

All required project files present:

- `data.js` ✓ (S, ARTICLE_MAP, ARTICLES_BY_ID, LAST_REVIEW, LAST_REVIEW_DEFAULT)
- `app.js` ✓ (CADENCE_POLICY, cadenceForArticle, cadenceForSupp present at lines 22–24)
- `index.html` ✓
- `docs/cadence-policy.md` ✓
- `docs/citation-schema.md` ✓
- `sources/registry.json` ✓
- `scripts/check_regulator_alerts.py` ✓
- `reviews/` ✓

## Regulator alerts triggered

`scripts/check_regulator_alerts.py --since 2026-04-23 --quiet --json /tmp/reg_alerts.json`
returned 1 hit:

| Supplement | Source | Title | Date | Status |
|---|---|---|---|---|
| Comfrey root tea (internal) | FDA MedWatch | Insulin Pump Recall: Insulet Removes Certain Omnipod 5 Pods | 2026-04-30 | **False positive — keyword "internal" in device-recall text matched the parenthetical in the supplement name; alert is a medical-device pump recall and has no relationship to comfrey or any supplement.** |

No genuine supplement-targeting regulator action in the last 7 days. No supplements pulled forward.

> Note for next run: `scripts/check_regulator_alerts.py` should probably exclude generic English words ("internal", "external", "oral") from the matched-term list, or only match against tokens that aren't English stopwords. Documenting here rather than editing the script — script changes are out of scope for the daily review task.

## Eligible queue (priority order)

Computed today − last-reviewed for all 241 article IDs in `ARTICLES_BY_ID` and compared against
`CADENCE_POLICY` ({t1:30, t2:60, t3:60, t4:14, safety:14, kids:30, breakthrough:30, guide:90, myth:90})
plus per-article `cadence` overrides. Result:

- Articles with `<!-- last-reviewed -->` comment in `index.html`: **241 / 241** (no missing comments)
- Last-reviewed date span: **2026-04-24 → 2026-04-27**
- Distribution: 2026-04-24=30, 2026-04-25=40, 2026-04-26=113, 2026-04-27=59
- Range of days since review (vs today 2026-04-30): **3 to 6 days**
- Minimum cadence in policy: **14 days** (safety, t4)

**Eligible today: 0**

| Priority | ID | Category | Tier | Last reviewed | Days overdue |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

The youngest cadence bucket (safety, 14 days) is at minimum 8 days from triggering. Earliest a routine cadence review will fire is **2026-05-08** (the 2026-04-24 safety articles will hit 14 days).

## Reviewed today

None — no eligible articles, no genuine regulator alerts.

## Stats

- Articles eligible today: **0**
- Articles reviewed: **0** (budget: 10)
- Tier movements: 0
- New industry-funded citations flagged: 0
- Files touched: none (no edits made; backups not created)

## Verification

Skipped (`phase0_verify.js` / `phase1_verify.js`) — no edits to verify. Both scripts ran clean on yesterday's batch (per `reviews/article-review-2026-04-29.md`).

## Next-run forecast

The first articles will become eligible **2026-05-08** (safety / t4 cadence = 14 d, against the 30 articles last-reviewed on 2026-04-24). Breakthrough/kids (cadence 30 d) won't fire until 2026-05-24+. Guide/myth (90 d) won't fire until late July 2026.
