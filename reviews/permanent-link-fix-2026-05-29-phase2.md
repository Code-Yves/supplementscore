# Phase 2 — deferred scheduled-task decisions (2026-05-29)

## Key discovery: where the live prompts actually live
The scheduler runs task prompts from **`/Users/yves/Documents/Claude/Scheduled/<id>/SKILL.md`**, which is outside the repo and returns EPERM to my tools. The `Scheduled/` folder *inside the repo* is a **separate mirror** — editing it does not change live behavior. The two have drifted (different task sets). So I updated the live tasks through the scheduler API (`mcp__scheduled-tasks__update_scheduled_task`) and kept the repo mirror in sync. Validate task state with `list_scheduled_tasks`, not the repo folder.

A latent landmine found along the way: **`scripts/generate_static_pages.py` still wrote full `/s/` pages** — running it would have *un-tombstoned* the 548 redirect stubs and reversed the 2026-05-25 rewire. It's now guarded (no-op unless `--allow-tombstone-rebuild`).

## Live changes made (via the scheduler API)
- **`weekly-supplement-page-polish` → DISABLED.** Its job (polishing per-supplement `/s/` HTML) no longer exists — those are tombstones; data-field audits are already covered by `supplement-trending-review`, cross-links by `weekly-internal-link-injector`.
- **`weekly-seo-audit` → prompt replaced.** It was auto-*adding* `/s/` tombstones to `sitemap-supplements.xml` (a tug-of-war with `reconcile_sitemaps.py`) and treating `/for/` as live. Now: validates the supplement sitemap against `data.js`, never adds `/s/` tombstones, drops `/for/`.
- **`monthly-og-png-converter` → prompt replaced.** Dropped Step 3 (editing og:image on `/s/` tombstones); keeps the SVG→PNG asset conversion.
- **`weekly-mobile-pass` → prompt replaced.** Stops sampling `/s/` tombstones; samples `a/ condition/ compare/ stack/` instead.
- (Phase 1 already pushed live: **`weekly-internal-link-audit`** → resolver-based checker, **`weekly-internal-link-injector`** → canonical `?slug=`.)

## Code change
- **`scripts/generate_static_pages.py`** — guarded against regenerating `/s/` (would un-tombstone). No-op unless explicitly overridden.

## Decisions on the other flagged tasks
- **`monthly-faq-schema-injection`** — its Step 2 injected FAQ JSON-LD into `/s/` tombstones (wasted). But it is **not a live scheduled task** (not in the registry; the live FAQ task `monthly-faq-generate-and-inject` is already disabled). Mirror left as-is; no live action needed. If you ever re-enable FAQ injection, keep it to `/a/` articles only, or add per-supplement FAQ at runtime in `supplement-detail.js`.
- **`weekly-medication-page-builder`** — emitted `/s/` links; **not a live task** (not registered). Mirror fixed; nothing to push.
- **`weekly-accessibility-audit`** / **`monthly-static-page-rebuild`** — both already **disabled**. Mirror fixed (accessibility `/for/` ref; static-rebuild still describes `/s/`+`/for/` in prose — its generator is the thing that matters and that's now guarded).

## Left for you (low priority)
- **3 enabled content generators still emit legacy `../s/` links** (which redirect, so not breaks — the checker classifies them "rewrite", exit 0): `weekly-content-polish-pass`, `weekly-condition-deep-dive`, `weekly-stack-recommendation-builder`. I corrected the repo mirror for all three; say the word and I'll push them live, or they'll land when you next sync the repo mirror.
- **Stale hardcoded counts** in a few prompts ("250+ articles", "133 conditions", "781", "214") — cosmetic; I left them rather than blind-overwrite live prompts for a number.
- **`condition/prostate-health.html` missing `_research-chrome.js`** — pre-existing, unrelated drift (caught by the smoke test). There's a bulk injector (`scripts/inject_research_chrome.py`) if you want it swept across condition pages.

## Verified
Internal-link checker: **0 genuine breaks** (5343 `?slug=` resolve, 0 `/for/`, 0 missing files). Sitemap integrity passes. `generate_static_pages.py` compiles. Five live task prompts confirmed updated; one disabled.
