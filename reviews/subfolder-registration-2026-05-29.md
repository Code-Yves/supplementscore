# Subfolder Registration — 2026-05-29

_Autonomous nightly run. No anomalies, no regressions, no auto-rollbacks._

## Summary

All five section folders were already fully linked from their respective `index.html` — **zero orphans detected anywhere**. The registration backlog is clear across the board for the second consecutive run (matching 2026-05-28). Steps 2 (create indexes) and 3 (register orphans) were therefore no-ops. One main-nav surfacing change shipped (Step 4).

## Per-section table

| Section | Files on disk | Linked before | Linked after | Orphans detected | Registered this run | Backlog remaining |
|---|---|---|---|---|---|---|
| compare   | 127 | 127 | 127 | 0 | 0 | 0 |
| condition | 55  | 55  | 55  | 0 | 0 | 0 |
| for       | 46  | 46  | 46  | 0 | 0 | 0 |
| stack     | 9   | 9   | 9   | 0 | 0 | 0 |
| m         | 10  | 10  | 10  | 0 | 0 | 0 |

Note: `stack/` grew from 6 files (2026-05-28) to 9 today; all 3 new files were already linked by the generator, so registration kept pace — no orphans created.

## Folder indexes created this run
None. All five section index pages (`compare`, `condition`, `for`, `stack`, `m`) already exist.

## Main-nav additions this run
**1 addition (at the per-run cap).** Added a crawlable hub `article-card` linking `for/index.html` ("By Population") into the homepage `#research-list-view` card grid, as a sibling to the existing `condition/index.html` and `stack/index.html` hub cards (inserted at `index.html` line 3356, just before the legacy 2026-05-25 `/for/` JS-modal catch-all card).

Rationale: `/for/` (46 pages) was previously reachable from the homepage only via `onclick="showArticle(2)"` (a JS modal), i.e. not a crawlable link. The new card gives crawlers a direct `<a href="for/index.html">`, surfacing the population hub for SEO. Used `data-category="guide"` (an existing filter chip) to avoid breaking the dropdown counters scoped to `#research-list-view .article-card`. `index.html` validated with `html.parser` post-edit (PARSE OK); `for/index.html` href count = 1.

Backup: `index.html.bak-20260529-070711Z`.

## Sitemap entries added
None — no orphans were registered, so no new `<url>` entries were required. All sitemaps were validated as well-formed XML and `sitemap-index.xml` references every section map:

| Sitemap | Status | locs |
|---|---|---|
| sitemap-compare.xml | valid | 128 |
| sitemap-conditions.xml | valid | 134 |
| sitemap-for.xml | valid | 47 |
| sitemap-stacks.xml | valid | 10 |
| sitemap-medications.xml | valid | 11 |
| sitemap-index.xml | valid | 10 (references all section maps) |

`/for/` landing page is already present in `sitemap-for.xml`, so the newly surfaced card needs no sitemap addition.

## Cache buster / SW version
**Not bumped — intentional.** The only change this run is HTML-only (the `index.html` hub card). `sw.js`'s authoritative header explicitly states: _"Do NOT bump for: HTML-only changes (network-first picks them up automatically)."_ Bumping `CACHE_VERSION` would force a full SW reinstall and runtime-cache drop for all users with no benefit. Section index references in `index.html` carry no `?v=` query strings, so there was nothing to bump there either. `CACHE_VERSION` left at `v2026-05-28-perfAuditb`.

## Spot-checked diffs
1. **`index.html` card insertion** — `diff` confirms exactly two added lines containing `for/index.html` (the comment at 3352 and the anchor at 3356); no other `for/index.html` occurrences. The card markup mirrors the proven `condition/index.html` "See all" card structure.
2. **`index.html` parse** — `html.parser` feed completed with PARSE OK after the edit; the new card sits before the `end research-list-view` marker (inside the correct container).
3. **Sitemap XML validity** — all 11 `sitemap*.xml` files parsed via `xml.etree.ElementTree` without error; counts consistent with disk (files + index) for every section except `condition` (134 ≥ 55 disk — superset, no missing entries, not pruned per "never lose entries" rule).

## Acceptance criteria
- [x] All 5 section folders processed.
- [x] Each `index.html` validates after edits (`index.html` PARSE OK; other section indexes unmodified).
- [x] Sitemap files validate as XML.
- [x] No section lost entries (only the one homepage nav addition).
