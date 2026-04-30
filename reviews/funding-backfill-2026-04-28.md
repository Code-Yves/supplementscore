# Funding/COI Backfill — 2026-04-28

**Phase:** 3 / Item #3 of IMPLEMENTATION_ROADMAP.md
**PMIDs classified:** 650
**`<li>` elements patched in index.html:** 162
**Backup:** index.html.bak-funding-20260428

## Funder-type distribution

| funder_type | count | % |
|---|---:|---:|
| public | 134 | 20.6% |
| nonprofit | 1 | 0.2% |
| mixed | 0 | 0.0% |
| industry | 0 | 0.0% |
| none_disclosed | 515 | 79.2% |

**COI disclosed:** 39 (6.0%)

## Industry-funded citations needing manual review

None.

## Methodology notes

- Funder classification uses the regex tables in `scripts/backfill_funding.py`.
- Industry takes precedence on ambiguous cases (conservative): a paper with NIH + Pfizer support is classified `mixed`, not `public`.
- COI is `true` only when an affirmative disclosure pattern matches and no negative pattern ("none declared") is present.
- Where PubMed returns no GrantList element, funder_type is `none_disclosed` — not the same as confirming public funding.

## Next steps

1. Review the industry-funded citations above. Where a Tier 1 supplement has only industry-funded confirmatory studies, demote to Tier 2 per the methodology.
2. Re-run with `--limit` removed to process the remaining PMIDs (use `--resume` to skip already-classified ones).
3. Re-run the daily article-review SKILL after this backfill completes — it should respect the new `data-funder-type` attributes when computing tier calls.