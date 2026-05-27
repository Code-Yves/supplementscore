# Article Registration Watchdog — 2026-05-27

**Trigger:** orphanCount > 0 (20 orphans detected on initial scan).

## Summary

| State            | Count |
|------------------|-------|
| Orphans detected | 20    |
| Registered new   | 0     |
| Skipped (title-dup of existing ABI entry) | 16 |
| Deleted (title-dup files)                 | 16 |
| Remaining orphans after run               | 4  |
| ABI before / after                        | 597 / 597 |
| `rolledBack`                               | false |

ABI count unchanged — every "orphan" that looked like a missing-registration was actually a title-duplicate of an article that's already in ABI. No new articles entered the catalog. The 16 dup files were deleted per the 2026-05-22 policy.

## Generator-bug evidence

This is *not* a clean "watchdog finds nothing" run. The pattern is concerning and matches the failure mode the watchdog was built to catch:

The `reviews/article-registration-log.md` rolling log shows these slugs being *successfully* registered earlier (e.g. `the-gut-restoration-stack-phgg-... | 706 | stack`, `sibo-the-evidence-based-... | 698 | condition`, `bph-... | 653`, `statin-myopathy-... | 699`). Yet the matching slugs are absent from current `data.js`:

```
grep -c "the-gut-restoration-stack-phgg" data.js  →  0
grep -c "sibo-the-evidence-based"        data.js  →  0
grep -c "bph-the-evidence-based"         data.js  →  0
```

The corresponding titles (e.g. "Gut Restoration Stack", "SIBO", "BPH", "Statin Myopathy") DO appear in `data.js`, but under *different* slugs (hence the script flagging them as title-duplicates). So the inline registrations from `nightly-article-generation` 2026-05-26 wrote the article under one slug into data.js, and at the same time wrote *another* HTML file under a longer slug into `a/`. The two slugs diverged.

A few backup files were checked (`data.js.bak-preunify-182259`, `data.js.bak-coverage-20260527-065616`, `data.js.bak-nattokinase-dedup-011711`) — none of them contained the long-form slug variants either, confirming the diverged slug was *never* committed to data.js. This rules out "rolled back later" and points squarely at the generator producing two slug variants for the same title within one run.

**Hypothesis for the generator bug:** the slug used to name the HTML file is being computed from a different source string than the slug used by the inline registration call. Possibly title → file-name uses `decodeAndNorm` while registration uses a stripped-token form (or vice versa). Worth checking `nightly-article-generation` slug-derivation against `slugify()` in `scripts/register-articles.mjs` line 116 — both paths should funnel through the same helper.

Affected slugs (16 deleted, all confirmed dups):

```
the-gut-restoration-stack-phgg-l-rhamnosus-gg-saccharomyces-boulardii-and-zinc-carnosine   →  dup of ABI 706
the-strength-training-stack-creatine-beta-alanine-caffeine-and-citrulline                  →  dup of ABI 704
sibo-the-evidence-based-supplement-protocol                                                 →  dup of ABI 698
dysmenorrhea-the-evidence-based-supplement-protocol                                         →  dup of ABI 662
recurrent-cold-sores-the-evidence-based-supplement-protocol                                 →  dup of ABI 657
ibs-diarrhea-predominant-the-evidence-based-supplement-protocol                             →  dup of ABI 672
dry-eye-the-evidence-based-supplement-protocol                                              →  dup of ABI 661
bph-the-evidence-based-supplement-protocol                                                  →  dup of ABI 653
peptic-ulcer-the-evidence-based-supplement-protocol                                         →  dup of ABI 688
age-related-macular-degeneration-the-evidence-based-supplement-protocol                     →  dup of ABI 676
crohns-disease-the-evidence-based-supplement-protocol                                       →  dup of ABI 659
ibs-constipation-predominant-the-evidence-based-supplement-protocol                         →  dup of ABI 671
bifidobacterium-lactis-bb-12-and-hn019-the-dairy-strain-with-the-strongest-immune-and-laxation-evidence  →  dup of ABI 636
bifidobacterium-longum-bb536-japans-most-studied-longum-strain                              →  dup of ABI 638
nafld-fatty-liver-the-evidence-based-supplement-protocol                                    →  dup of ABI 683
statin-myopathy-the-evidence-based-supplement-protocol                                      →  dup of ABI 699
```

## Persistent noindex-stub false positives (4 remaining)

After the registration sweep, scan still reports 4 orphans:

```
a/index.html                                                                                — directory redirect to /article.html
a/st-johns-wort-drug-interactions-the-cyp3a4-inducer-problem.html                          — consolidation redirect to /a/10-supplements-that-interact-with-the-most-prescription-drugs.html
a/nicotinic-acid-vs-niacinamide-flushing-hepatotoxicity-and-dose-differences.html          — consolidation redirect to a niacin page
a/anthocyanin-concentrate.html                                                              — consolidation redirect to a polyphenol page
```

All four are 19-line `<meta name="robots" content="noindex,follow">` redirect stubs with `meta http-equiv="refresh"`. They are intentional canonical redirects (the script's parser even has a comment about this case at line 165-167: *"ship with minimal chrome and noindex"*). They are not bugs and should not be deleted.

**Script bug:** `findOrphans()` in `scripts/register-articles.mjs` (line 124) only checks slug-against-ABI; it does not exclude HTML files that are `<meta robots=noindex>` stubs. Result: this watchdog will write a dated report every single day forever, defeating the "only-on-events" policy.

**Suggested fix (out of scope for the watchdog itself):** in `findOrphans`, after reading each file's first 4-8 KB, skip files matching `/<meta[^>]+name="robots"[^>]+noindex/i`. Keeps the script as the single source of truth while letting the watchdog reach `orphanCount: 0` on clean days.

## Files modified

- `a/<16 slugs>.html` — deleted (per title-dup policy)
- No data.js / index.html / sitemap-articles.xml changes (no successful registrations)
- No backup files created by the script this run (the registration codepath wasn't entered because all 16 attempts hit the title-dup guard before backup-taking)

## Spot-check

n/a — zero new registrations to spot-check.

## Action items for human review

1. **Generator slug-derivation bug.** Investigate why `nightly-article-generation` is producing HTML files under one slug while inline-registering the same title under a different (shorter) slug in data.js. 16 occurrences in a single generator run on 2026-05-26 ≈ 2.3 % of catalog churn, not a one-off.
2. **Scanner enhancement.** Teach `findOrphans()` to skip noindex stubs so the watchdog can go quiet again on clean days.
