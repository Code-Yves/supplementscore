**P0 — meta description coverage gap** (98 pages missing meta descriptions)

# Title & Meta Audit — 2026-05-21

Run mode: **auto-apply medium** (safe fixes only). Modification cap: 80.

## Pages scanned

Total: **1,406**

- `a/` — 519
- `compare/` — 123
- `condition/` — 130
- `for/` — 56
- `m/` — 11
- `root/` — 27
- `s/` — 533
- `stack/` — 7

## Issues by category

| Category | Pages |
|---|---|
| title-too-long | 713 |
| title-no-suffix | 0 |
| title-too-short | 6 |
| keyword-position | 6 |
| desc-empty | 98 |
| desc-too-short | 1 |
| desc-too-long | 528 |
| duplicate-title (unique pages) | 0 |

## Auto-fixed this run

Total fixes applied: **80** / 80 cap.

- Sentence-aware meta description trims: **80**
- Duplicate-suffix strips: **0**
- Suffix appends: **0**

### 3 spot-checked diffs

**1. `a/2-fucosyllactose-and-other-hmos-as-adult-supplements-emerging-but-not-proven.html`**

- desc (182c → 151c)
  - before: _Human milk oligosaccharides — once available only in breast milk — are now produced by microbial fermentation and sold as adult gut-health supplements. The infant data are excellent;_
  - after:  _Human milk oligosaccharides — once available only in breast milk — are now produced by microbial fermentation and sold as adult gut-health supplements._

**2. `a/adrenal-cortex-extract-bovine-gland-tablets-sold-as-adrenal-support.html`**

- desc (189c → 136c)
  - before: _Adrenal cortex extract is desiccated bovine adrenal gland sold as a supplement. The historical injectable was banned by the FDA in 1996. The oral version remains, with predictable problems._
  - after:  _Adrenal cortex extract is desiccated bovine adrenal gland sold as a supplement. The historical injectable was banned by the FDA in 1996._

**3. `a/apple-polyphenols-what-apple-peel-extract-claims-actually-deliver.html`**

- desc (177c → 100c)
  - before: _Apple peel extract supplements promise the polyphenol benefit of eating apples in concentrated form. The pharmacokinetic and clinical data are weaker than the marketing implies._
  - after:  _Apple peel extract supplements promise the polyphenol benefit of eating apples in concentrated form._

## Rewrite queue

- Appended this run: **828** new entries
- Total queue length: **1271**
- File: `reviews/action-queues/title-meta-rewrite.json`
- Read by: `supplement-article-review` (daily), `weekly-content-polish-pass` (random 8/wk)

Queue breakdown by issue (this run):

- `desc-empty` — 97
- `desc-too-long` — 448
- `keyword-position` — 2
- `title-too-long` — 281

## Top-10 worst offenders

1. `discover.html` — desc-too-long, keyword-position, title-too-long (title 77c / ~654px, desc 205c)
2. `a/fo-ti-he-shou-wu-the-traditional-tonic-with-a-real-hepatotoxicity-signal.html` — desc-too-long, title-too-long (title 93c / ~790px, desc 177c)
3. `a/vitamin-d-and-falls-in-older-adults-the-conflicting-sturdy-and-vital-trial-record.html` — desc-too-long, title-too-long (title 100c / ~850px, desc 96c)
4. `a/ginkgo-biloba-egb-761-why-the-dementia-evidence-hasn-rsquo-t-translated.html` — desc-too-long, title-too-long (title 84c / ~714px, desc 156c)
5. `a/orac-antioxidant-supplement-claims-why-the-usda-removed-the-database.html` — desc-too-long, title-too-long (title 87c / ~740px, desc 153c)
6. `a/honokiol-the-anxiolytic-compound-hidden-in-magnolia-bark.html` — desc-too-long, title-too-long (title 75c / ~638px, desc 156c)
7. `a/beta-alanine-why-the-tingle-is-worth-it-for-athletes.html` — desc-too-long, title-too-long (title 71c / ~604px, desc 156c)
8. `a/ceylon-cinnamon-for-blood-sugar-small-effect-big-marketing.html` — desc-too-long, title-too-long (title 78c / ~663px, desc 156c)
9. `a/tributyrin-the-butyrate-prodrug-and-its-gut-barrier-evidence.html` — desc-too-long, title-too-long (title 79c / ~672px, desc 157c)
10. `a/omega-3-and-depression-what-26-meta-analyses-found.html` — desc-too-long, title-too-long (title 69c / ~586px, desc 156c)
