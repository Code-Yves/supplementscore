# Scripts

## phase0_verify.js

Static-analysis + isolated-function regression test for Phase 0 of the
accuracy improvement roadmap. Run from the project root:

```
node scripts/phase0_verify.js
```

Exits 0 when all checks pass, 1 with a list of failures otherwise.

What it checks:

- **#4 Category backfill** — `ARTICLES_BY_ID` exists in `data.js` with 241
  entries, no undefined categories, expected distribution.
- **#9 Last-reviewed badge** — `LAST_REVIEW_DEFAULT` and `LAST_REVIEW` data,
  the three helper functions (`lastReviewedFor`, `fmtReviewDate`,
  `articleReviewedDate`), and the badge HTML in `cardHtml` and `goArticle`.
- **#3 Citation funding/COI** — `processArticleSources` reads
  `data-funder-type` / `data-funder` / `data-coi` attributes and renders the
  expected badges. CSS classes exist. Schema doc exists.
- **#10 Feedback button** — modal markup, required citation field,
  function definitions, Formspree endpoint reuse, "Flag inaccuracy" buttons
  on both article and supplement modals, missing-citation guard, feedback
  triage docs.

It also runs `node --check` on `data.js` and `app.js`.

The script avoids loading the full app.js inside JSDOM because of a
pre-existing TDZ ordering issue in `_pruneArticleMap` that's harmless under
normal browser script-load timing. Static analysis + isolated function tests
catch the same regressions without that interference.
