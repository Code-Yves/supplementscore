# Permanent fix — recurring internal-link / slug churn (2026-05-29)

## Root cause (recap)
The weekly audits kept "finding issues" for two reasons, only one of which was a real bug:

1. **The validator measured a dead architecture.** `/s/<slug>.html` pages were tombstoned on 2026-05-25; supplement links now resolve at runtime against `data.js` via a two-tier resolver. But the audit still decided "valid link?" by checking whether `s/<slug>.html` existed on disk — wrong on both sides. Of the ~51 "dangling" links it reported, a resolver-accurate scan showed **only ~3 actually broke**; the rest resolve fine for users.
2. **No shared slug oracle.** Producers (the article generator, the link injector) derived slugs with their own ad-hoc regex and nothing validated the result against the resolver before publishing, so each generation cycle minted a fresh batch of near-miss slugs (`?slug=chromium` for "Chromium picolinate", etc.). Fixes were always applied downstream (clean the pages) instead of upstream (the generator), so they recurred.

Plus a half-finished deprecation: `/for/` was "retired" in prompts on 2026-05-24 but 47 pages, `sitemap-for.xml`, and inbound links were still live.

## What changed (the permanent fix)

### New shared machinery
- **`scripts/slug.mjs`** — the single slug resolver for all Node tooling. It loads `data.js` + `search-index.js` into one VM and reuses the **exact** runtime `slugify` + `getSupplement`, so Node and the browser can never disagree. Exposes `resolveSupplement`, `isValidSupplementSlug`, `slugify`, `validSupplementSlugs`.
- **`scripts/check_internal_links.mjs`** — deterministic checker that validates `supplement.html?slug=` links via the resolver (not file existence), flags any remaining legacy `../s/` links as "rewrite", treats `/for/` as retired, and checks real file links on disk. Exit 1 on any genuine break. This is the new audit oracle.

### Fail-closed at the source
- **`scripts/register-articles.mjs`** now runs a slug-resolution gate in `parseArticle`: any article whose `supplement.html?slug=` link doesn't resolve is **rejected and rolled back** (it already deletes the orphan file). Verified: colloquial (`chromium`) and malformed nested-tag slugs are rejected; valid ones pass; `--scan` still works (abiCount 597).

### Audit / injector rewritten to use the resolver
- **`weekly-internal-link-audit`** now runs `check_internal_links.mjs` instead of the file-existence scan. This alone removes the ~90% false positives that made it look like the site was perpetually broken.
- **`weekly-internal-link-injector`** now emits canonical `../supplement.html?slug=` links (not legacy `../s/`), derives/validates slugs through `slug.mjs`, forbids nested-anchor output (the bug that produced `slug=saccharomyces-cerevisiae-<a href=…`), and runs the checker to verify.
- **`weekly-build-validation`** gained a step 8 that runs the checker as a build guard.

### The genuine breaks (fixed in place)
- `a/the-immune-prevention-stack-…-yeast-beta-glucan.html` — repaired the malformed double-injected nested `<a>` → single `?slug=saccharomyces-cerevisiae-beta-glucan`.
- `compare/berberine-vs-ala-vs-chromium-vs-banaba-glycemic-control.html` — `?slug=chromium` → `?slug=chromium-picolinate`.

### `/for/` hard-deleted (as you chose)
- Deleted all **47** `for/*.html` and `sitemap-for.xml`.
- Removed the `sitemap-for.xml` entry from `sitemap-index.xml` and the 4 `/for/` URLs from `sitemap.xml`; removed the `Sitemap:` line from `robots.txt`.
- Repointed/unwrapped the 4 inbound links (homepage population card, `condition/iron-deficiency-anemia`, es/fr `pcos-protocol` — the latter pointed at `for/women.html`, which never existed).
- **Upstream:** patched `scripts/generate_landing_pages.py` to stop generating population/`for` pages (keeps `sx/`) and to not recreate the `for/` dir, and removed `for` from `_subreg_sitemaps.py` so `sitemap-for.xml` can't regenerate.

### GROUP 1 prompt fixes (legacy `../s/` link emission → canonical `?slug=`)
Fixed in `weekly-condition-deep-dive`, `weekly-content-polish-pass`, `weekly-medication-page-builder`, `weekly-stack-recommendation-builder`, `weekly-supplement-page-polish`. Also repointed dead `for/*.html` structural references in `weekly-stack-recommendation-builder` and `weekly-accessibility-audit`.

## Verification
- `check_internal_links.mjs`: **0 genuine breaks** (5343 `?slug=` links resolve, 0 broken; 0 `/for/`; 0 missing file links).
- `check_sitemap_integrity.py`: **PASS** — 1433 URLs all exist/crawlable/indexable after the `/for/` removal.
- `supplements.json` vs `data.js`: **in sync** (780 = 780); already auto-derived by `export_supplements_json.py` (step 1 of `run_all_seo_refresh.py`).
- Syntax: `slug.mjs`, `check_internal_links.mjs`, `register-articles.mjs`, `_subreg_sitemaps.py`, `generate_landing_pages.py` all pass.
- Smoke test: 1 failure, **pre-existing and unrelated** to this work — see below.

## "Report the rest" — items needing your decision (not changed)

1. **Tasks that still operate ON `/s/` tombstones (wasted/again-and-again work).** `weekly-supplement-page-polish` (its entire purpose is polishing `/s/` pages, which are now 10-line redirect stubs), `monthly-og-png-converter`, `monthly-faq-schema-injection`, and the `/s/` *samples* in `weekly-accessibility-audit` / `weekly-mobile-pass`. The fix is a judgment call: **retire** these or **repoint** them at the runtime surface (`supplement.html` + `data.js`). I left them so you can choose; `supplement-page-polish` likely becomes a no-op and should probably be retired.
2. **`weekly-seo-audit` and `monthly-static-page-rebuild`** still describe `/s/` and `/for/` as live in their page-universe prose. `static-page-rebuild`'s *generator* is already neutralized for `/for/`; the prompt text and the `/s/` handling need a rewrite that depends on the decision in (1).
3. **CWD footgun (not a bug today).** The "missing scripts" a sub-audit flagged are all present — at the **top-level** `scripts/`, not `supplementscore-repo/scripts/`. Tasks like `weekly-seo-schema-refresh` call `python3 scripts/run_all_seo_refresh.py`, which only resolves when run from `/Users/yves/Desktop/AI/Supplement Score`. Worth standardizing the CWD in those prompts.
4. **Stale hardcoded counts (cosmetic).** Several prompts hardcode catalog sizes ("533 supplement pages", "243 articles", "133 condition pages", "250+ articles"). Harmless but drift-prone — better computed at runtime.
5. **Pre-existing, unrelated drift:** `condition/prostate-health.html` is missing `_research-chrome.js` (caught by the smoke test's random sample). Same *class* as the recurring drift but a different symptom; the durable fix is the condition-page template/generator plus a bulk pass. I did not touch it.

## Backups / rollback
- `/for/` + `sitemap-for.xml`: recoverable via git (47 tracked deletions) and `../for-dir-backup-20260529.tar.gz`.
- Timestamped `.bak-20260529*` copies of every edited script, sitemap, and SKILL.md sit beside the originals (your existing convention).
