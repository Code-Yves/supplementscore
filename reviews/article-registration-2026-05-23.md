# Article Registration Watchdog — 2026-05-23

**Trigger:** 69 orphan .html files found on disk (>0 → dated report required).
**Status:** Resolved (all orphans deleted as title-duplicates). **Generator bug remains — needs human attention.**

## Summary

| Metric | Count |
| --- | --- |
| Orphans detected | 69 |
| Orphans registered | 0 |
| Orphans skipped as title-duplicate | 69 |
| Orphan .html files deleted | 69 |
| New ABI entries this run | 0 |
| Final orphan count | 0 |
| ABI total | 600 (unchanged) |
| Script rollbacks | 0 |

Every single orphan was a title-duplicate of an existing ABI entry. Per the 2026-05-22 policy, all 69 .html files were deleted from `a/`. Final `--scan` returns `orphanCount: 0`.

## Generator bug — evidence

All 69 orphans share `mtime: 2026-05-22T23:47:37–38Z`, i.e. they were created in one batch by last night's generator run. The slugs reveal two distinct failure modes that are almost certainly the same root cause:

### Failure mode 1: HTML-entity-encoded apostrophes/quotes/ampersands in slugs

Slugs contain literal `x27`, `39`, `quot`, `amp` substrings, which are the textual remains of `&#x27;`, `&#39;`, `&quot;`, `&amp;` — the HTML entities for `'`, `"`, and `&`. Examples from the orphan list:

- `theacrine-the-caffeine-alternative-from-kucha-tea-with-bold-x27-no-tolerance-x27`
- `theacrine-the-caffeine-alternative-from-kucha-tea-with-bold-39-no-tolerance-39-c`
- `mushroom-coffee-for-focus-what-the-lion-x27-s-mane-and-cordyceps-claims-actually`
- `senna-and-stimulant-laxatives-why-quot-natural-quot-doesn-t-mean-safe-for-daily-`
- `recent-supplement-recalls-amp-fda-warnings-the-roll-call`
- `mitoq-for-parkinson-39-s-disease-where-the-evidence-stands`
- `st-john-39-s-wort-drug-interactions-the-cyp3a4-inducer-problem`

Diagnosis: somewhere in `nightly-article-generation`, article titles are being HTML-escaped (`'` → `&#x27;` / `&#39;`, `"` → `&quot;`, `&` → `&amp;`) **before** the slug-generator runs. The slug function then sees the entity text as plain characters and includes them in the slug.

The presence of **both** `x27` and `39` variants for the same article (e.g., "MitoQ for Parkinson's") suggests at least two different code paths are producing different entity encodings of the same `'` character — i.e. the bug exists in multiple places.

### Failure mode 2: Duplicate articles generated against existing ABI titles

The same `--orphans` run also revealed that the generator is producing articles whose titles already exist in the ABI from earlier runs:

- `mushroom-coffee-for-focus-what-the-lion-x27-s-mane-...` → title-dup of ABI **550** (May 20)
- `mitoq-for-parkinson-x27-s-disease-...` → title-dup of ABI **499**
- `lead-in-baby-food-and-children-x27-s-vitamins-2024-2025-recall-roundup` → title-dup of ABI **523**
- `magnesium-forms-compared-glycinate-citrate-...` → title-dup of ABI **283**
- `apple-pectin-for-heavy-metal-chelation-...` → title-dup of ABI **308**

Diagnosis: the generator's pre-write title-uniqueness check is missing or broken. The script's title-dedup logic in `register-articles.mjs` is what's catching it at registration time, but the generator should never have written these in the first place.

### Knock-on damage already in ABI: entries 588–600

The registration log shows that **13 entries (ABI ids 588–600)** got inline-registered on 2026-05-22 with the *same kind of malformed slugs* and abnormally small word counts:

| ABI id | Slug fragment | Words | Sources |
| --- | --- | --- | --- |
| 588 | `nattokinase-...-soy-enzyme-under-scrutin` | 43 | 1 |
| 589 | `folate-vs-methylfolate-...-don-t-t` | 38 | 1 |
| 590 | `recent-supplement-recalls-amp-fda-warnings-the-roll-call` | 45 | 1 |
| 591 | `cat-s-claw-...-thin-trial-re` | 43 | 1 |
| 592 | `st-john-39-s-wort-drug-interactions-the-cyp3a4-inducer-problem` | 44 | 1 |
| 593 | `mitoq-for-parkinson-39-s-disease-where-the-evidence-stands` | 41 | 1 |
| 594 | `ergothioneine-...-cellular-antioxidant-` | 42 | 1 |
| 595 | `children-s-electrolyte-powders-...-and-a` | 39 | 0 |
| 596 | `senna-and-stimulant-laxatives-why-quot-natural-quot-doesn-t-mean-safe-for-daily-` | 43 | 0 |
| 597 | `theacrine-...-bold-39-no-tolerance-39-c` | 58 | 2 |
| 598 | `kids-39-multivitamin-gummies-...-and-when-just-` | 58 | 0 |
| 599 | `lion-39-s-mane-...-controlled-trials-show` | 60 | 1 |
| 600 | `quot-liver-detox-quot-supplements-...-and-doesn-t-do` | 45 | 2 |

Compare to normal articles in the same run (e.g., ABI 580–587), which all show 500–900 words and 2–8 sources. These 13 entries are **stub registrations of broken content** with html-entity-mangled slugs. They are now permanently in the ABI pointing to the .html files that were just deleted.

**Human action recommended:** review entries 588–600. Almost certainly they should be unregistered (and their slugs added to the generator's avoid-list once it is fixed), so a healthy version of each topic can be regenerated cleanly. This watchdog cannot do that — only the script is allowed to mutate the registry, and it has no unregister mode yet.

## What the watchdog did

1. `--scan` → orphanCount: 69, abiCount: 600.
2. Inspected `reviews/article-generation-log.md` (last entries 2026-05-21 — generator did not log a 2026-05-22 run end marker, suggesting the run crashed or terminated abnormally) and `reviews/article-registration-log.md` (rows 588–600 above, all 2026-05-22, all malformed).
3. `--orphans --limit 80` → 0 registered, 69 skipped (`title-duplicate of ABI id N`), `preABI === postABI === 600`, `rolledBack: false`.
4. Deleted all 69 .html files from `a/` per 2026-05-22 policy. First attempt blocked by sandbox; requested cowork delete permission, retried, all 69 removed cleanly.
5. `--scan` → `orphanCount: 0`. Steady state restored.

## Spot-check

No new registrations this run, so the standard 3-random spot-check does not apply. Instead, spot-checked ABI integrity post-deletion:

- `a/akkermansia-muciniphila-the-next-generation-probiotic-and-what-trials-have-actua.html` — confirmed deleted (file no longer exists).
- ABI count: 600 (unchanged) — script never mutated the registry this run, by design.
- Last successful inline registration in `article-registration-log.md` is ABI 600 dated 2026-05-22, confirming the generator's inline path *does* function — the bug is in slug generation / title dedup, not in the registration script itself.

## Files modified

- `reviews/article-registration-log.md` — one WATCHDOG-ORPHANS line appended.
- `reviews/article-registration-2026-05-23.md` — this file.
- 69 files removed from `a/` (list available in `/tmp/orphan-slugs.txt` from this run; equivalently, every `skipped[].slug` in the `--orphans` JSON output).

No data.js, index.html, or sitemap-articles.xml edits. No git commits.

## Recommendations (for the human)

1. **Fix slug generation in `nightly-article-generation`.** Apply slugification to the *raw* title before any HTML escaping. Add a regression test: any slug containing `x27`, `39`, `quot`, `amp` as standalone segments must throw.
2. **Add a pre-write title-uniqueness check in the generator.** It should query the ABI for the proposed title (case-insensitive, after normalization) and abandon the article before writing the .html file. Currently dedup only happens at registration time, after wasted work.
3. **Decide what to do with ABI 588–600.** They are 13 broken stubs taking up id space, with no usable content (38–60 words, 0–2 sources, malformed slugs). Likely action: extend `register-articles.mjs` with an `--unregister <id>` mode and remove them, then let a future generator run produce clean versions.
4. **Look at why last night's generator wrote 69 dupes in one batch.** Either it bypassed its own dedup, or the dedup compares against a corrupted view of ABI. The batched mtimes (all 23:47:37–38) point to a single failure scope.
