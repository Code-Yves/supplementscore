# Title & Meta Audit — 2026-05-14

Run mode: **auto-apply medium** (safe fixes only). Modification cap: 80.

## Pages scanned

Total: **1,085**

- `a/` — 379
- `compare/` — 53
- `condition/` — 59
- `for/` — 24
- `m/` — 6
- `root/` — 27
- `s/` — 533
- `stack/` — 4

## Issues by category

| Category | Pages |
|---|---|
| title-too-long | 435 |
| title-no-suffix | 123 |
| title-too-short | 6 |
| keyword-position | 6 |
| desc-empty | 1 |
| desc-too-short | 1 |
| desc-too-long | 436 |
| duplicate-title | 0 |

## Auto-fixed this run

Total fixes applied: **50** / 80 cap.

- Sentence-aware meta description trims: **50**
- Duplicate-suffix strips: **0** (none found this run)
- Suffix appends: **0** committed

> **Note:** Two suffix-append candidates (`404.html` `Page not found · SupplementScore`, `methodology.html` `Methodology — Supplement Score`) were initially appended but reverted from backup — both already contained the brand in a non-canonical form, so re-suffixing would have produced double-brand titles (`… SupplementScore — SupplementScore`). These are now queued as `title-no-suffix-variant` candidates for human review; the suffix-add rule needs a case-insensitive substring check on "supplementscore"/"supplement score" before appending. Tracked in memory.

### 3 spot-checked diffs

**1. `a/10-supplements-that-interact-with-the-most-prescription-drugs.html`**

- desc (171c → 121c)
  - before: _St. John's Wort, berberine, magnesium, melatonin — the supplements that interact with the most prescription drug classes. If you take a prescription, scan this list first._
  - after:  _St. John's Wort, berberine, magnesium, melatonin — the supplements that interact with the most prescription drug classes._

**2. `a/12-supplement-mistakes-you-should-literally-never-make.html`**

- desc (171c → 134c)
  - before: _Twelve supplement mistakes with documented hospital outcomes — pediatric melatonin, St. John's Wort + SSRIs, kava + alcohol, and more. Print this and put it on the fridge._
  - after:  _Twelve supplement mistakes with documented hospital outcomes — pediatric melatonin, St. John's Wort + SSRIs, kava + alcohol, and more._

**3. `a/13-top-10-lists-from-our-discover-page-the-complete-cheat-sheet.html`**

- desc (201c → 146c)
  - before: _One perfect score. One supplement that turns your skin permanently blue. One $5 capsule with more clinical evidence than every $1,500 IV combined. The 13 Top 10s on the Discover page, all in one place._
  - after:  _One perfect score. One supplement that turns your skin permanently blue. One $5 capsule with more clinical evidence than every $1,500 IV combined._

## Rewrite queue

- Appended this run: **443** new entries
- Total queue length: **443**
- File: `reviews/action-queues/title-meta-rewrite.json`
- Read by: `supplement-article-review` (daily), `weekly-content-polish-pass` (random 8/wk)

Queue breakdown by issue:

- `title-too-long` — 435
- `keyword-position` — 6
- `desc-too-short` — 1
- `desc-empty` — 1

## Top-10 worst offenders

1. `landing.html` — title-too-long, title-no-suffix, keyword-position, desc-too-long (title 69c / ~586px, desc 158c)
2. `discover.html` — title-too-long, keyword-position, desc-too-long (title 77c / ~654px, desc 205c)
3. `compare/alpha-lipoic-acid-vs-acetyl-l-carnitine.html` — title-too-long, title-no-suffix, desc-too-long (title 114c / ~969px, desc 157c)
4. `compare/apigenin-vs-magnesium-for-sleep.html` — title-too-long, title-no-suffix, desc-too-long (title 89c / ~756px, desc 175c)
5. `compare/ashwagandha-vs-l-theanine-for-stress.html` — title-too-long, title-no-suffix, desc-too-long (title 111c / ~943px, desc 161c)
6. `compare/beta-alanine-vs-citrulline.html` — title-too-long, title-no-suffix, desc-too-long (title 98c / ~833px, desc 160c)
7. `compare/collagen-vs-vitamin-c-for-skin.html` — title-too-long, title-no-suffix, desc-too-long (title 92c / ~782px, desc 170c)
8. `compare/creatine-forms.html` — title-too-long, title-no-suffix, desc-too-long (title 119c / ~1011px, desc 168c)
9. `compare/curcumin-formulations.html` — title-too-long, title-no-suffix, desc-too-long (title 133c / ~1130px, desc 190c)
10. `compare/curcumin-vs-boswellia.html` — title-too-long, title-no-suffix, desc-too-long (title 112c / ~952px, desc 169c)

## Escalations

None this run.

Notes for next iteration:

- 435 title-too-long is dominated by the `compare/` and longer-form `a/` slugs — comparison titles trend 90–130 chars because they spell out both supplements. A standardized template (e.g. `X vs Y: Which Wins for [Use]? — SupplementScore` constrained to ≤65 chars) would clear the bulk.
- 436 desc-too-long is widespread but mostly mild (155–170 chars). The sentence-aware trimmer only catches descriptions with clean sentence boundaries inside the 155-char window; the rest are queued for editorial.
- 123 title-no-suffix is concentrated in the `compare/` section (matches the long-title cluster) — most don't have headroom for a suffix without rewriting the body first.
