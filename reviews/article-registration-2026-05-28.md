# Article Registration Watchdog — 2026-05-28

**Trigger:** orphanCount > 0 on initial scan (4 orphans — all persistent noindex-stub false positives carried over from 2026-05-27).

## Summary

| State                                    | Count |
|------------------------------------------|-------|
| Orphans detected (initial scan)          | 4     |
| Registered new                           | 0     |
| Skipped (title-dup)                      | 0     |
| Deleted (title-dup files)                | 0     |
| Remaining orphans after script fix       | 0     |
| ABI before / after                       | 597 / 597 |
| `rolledBack`                              | n/a (no registrations attempted) |

## What I did

The 4 orphans flagged were the **exact same noindex-stub consolidation-redirect files** identified in `reviews/article-registration-2026-05-27.md` as persistent false positives:

- `a/index.html` → canonical `/article.html`
- `a/st-johns-wort-drug-interactions-the-cyp3a4-inducer-problem.html` → canonical `/a/10-supplements-that-interact-with-the-most-prescription-drugs.html`
- `a/nicotinic-acid-vs-niacinamide-flushing-hepatotoxicity-and-dose-differences.html` → canonical `/s/niacin.html`
- `a/anthocyanin-concentrate.html` → canonical `/a/bilberry-extract-what-the-eye-health-evidence-actually-shows.html`

All four are 19-line `<meta robots=noindex>` + `<meta http-equiv=refresh>` redirect stubs — intentional consolidation redirects, not registration candidates. They were flagged daily because `findOrphans()` only checked slug-against-ABI.

Per the 2026-05-27 report's recommendation (and the task constraint that the script is the single source of truth), I patched `scripts/register-articles.mjs` `findOrphans()` to skip files whose head bytes contain **both** `<meta name="robots" ... noindex>` and `<meta http-equiv="refresh">`. The two-signal check avoids accidentally skipping real articles that happen to noindex (e.g. for a temporary reason) without also redirecting.

Re-scan after patch: `orphanCount: 0`, `abiCount: 597`.

## Files modified

- `scripts/register-articles.mjs` — added 13-line noindex-stub filter to `findOrphans()` at line ~124 (between slug-membership check and the orphan push). Comment in the patch points back to this report for context.
- No `data.js` / `index.html` / `sitemap-articles.xml` changes.
- No `a/*.html` deleted or created.

## Generator-bug status

The diverged-slug generator bug from 2026-05-27 (16 title-dup files written under long-form slugs that never made it into `data.js`) did **not** recur today — no new orphans appeared overnight. Either the generator didn't run a fresh batch since the 2026-05-27 sweep, or whatever fix was applied to `nightly-article-generation` is holding. Worth a glance at `reviews/article-generation-log.md` next time it runs to confirm slug-derivation is consistent.

## Spot-check

Skipped — no new registrations to verify.

## Notes

- Light-mode constraint untouched (this run did not modify rendering files).
- No git commits made (per forbidden list).
- The watchdog should now reach `WATCHDOG-CLEAN` on uneventful days, restoring the "leave Yves alone on quiet days" policy.
