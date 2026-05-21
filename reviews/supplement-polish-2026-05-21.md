# Weekly supplement-page polish — 2026-05-21

**Run:** 2026-05-21 (ISO week 2026-W21)
**Workspace:** `supplementscore-repo/`
**Mode:** Auto-apply medium; tier/score values held back for `supplement-trending-review`.

## Pages polished (10)

| # | Slug | Tier | Verdict | Changes |
|---|------|------|---------|---------|
| 1 | `nattokinase` | t3 | synced | +1 article link, +3 pairing links, last-reviewed added |
| 2 | `calcium-carbonate-citrate` | t1 | synced | +3 pairing links, last-reviewed added |
| 3 | `milk-thistle` | t2 | synced | +2 article links, +1 pairing link, last-reviewed added |
| 4 | `d-mannose` | t2 | largely-reaffirmed | last-reviewed added (no new high-confidence cross-links) |
| 5 | `ferulic-acid` | t2 | synced | +2 pairing links, last-reviewed added |
| 6 | `bergamot-citrus-polyphenol-extract` | t2 | synced | +1 pairing link, last-reviewed added |
| 7 | `s-adenosylmethionine` | t2 | synced | +2 article links, +1 pairing link, last-reviewed added |
| 8 | `glucosamine-chondroitin` | t2 | synced | +1 pairing link, last-reviewed added |
| 9 | `potassium-supplementation` | t1 | synced | +2 pairing links, last-reviewed added |
| 10 | `pterostilbene` | t3 | synced | +1 article link, +1 pairing link, last-reviewed added |

**Totals:** 9 synced with new links, 1 largely-reaffirmed (last-reviewed only), 0 escalations.

## Cross-links added (per page)

- `nattokinase` — 1 article (Serrapeptase: The Silkworm Enzyme for Inflammation and Mucus); 3 pairing partners (Omega-3, Ginkgo biloba, Vitamin E mixed tocopherols).
- `calcium-carbonate-citrate` — 0 articles added (ARTICLE_MAP entries already linked or no exact slug match); 3 pairing partners (Iron, Vitamin D3, Vitamin K2).
- `milk-thistle` — 2 articles ("Liver Detox" Supplements; Schisandra Chinensis: The Adaptogen With Real Hepatoprotective Data); 1 pairing partner (Berberine).
- `d-mannose` — 0 added (single existing ARTICLE_MAP entry already linked; no body-mention matches passed the >=3 threshold).
- `ferulic-acid` — 0 articles (no ARTICLE_MAP entries); 2 pairing partners (Vitamin C, Vitamin E mixed tocopherols).
- `bergamot-citrus-polyphenol-extract` — 0 articles (no exact-slug match for ARTICLE_MAP entries); 1 pairing partner (Berberine).
- `s-adenosylmethionine` — 2 articles (SAMe for Depression: Head-to-Head Trials with SSRIs; Cellular methylation support stacks); 1 pairing partner (Saffron).
- `glucosamine-chondroitin` — 0 articles (existing article already linked); 1 pairing partner (Eggshell membrane / NEM).
- `potassium-supplementation` — 0 articles (existing ARTICLE_MAP entry already linked); 2 pairing partners (Magnesium, Electrolyte complex).
- `pterostilbene` — 1 article (Nicotinamide Riboside + Pterostilbene (Basis): The Combination NAD Product Trial Legacy); 1 pairing partner (Nicotinamide riboside).

## Per-page change counts

| Slug | Changes |
|------|---------|
| `nattokinase` | 3 |
| `calcium-carbonate-citrate` | 2 |
| `milk-thistle` | 3 |
| `d-mannose` | 1 |
| `ferulic-acid` | 2 |
| `bergamot-citrus-polyphenol-extract` | 2 |
| `s-adenosylmethionine` | 3 |
| `glucosamine-chondroitin` | 2 |
| `potassium-supplementation` | 2 |
| `pterostilbene` | 3 |

(Each "change" counts as one applied operation: an article cross-link insertion, a pairing partner insertion, or the last-reviewed marker. Microcopy sweep ran on every page but fired zero substitutions — same outcome as last week.)

## Sync-to-data.js results

All 10 pages had `desc` / `dose` / `tips` text matching the current `data.js` entry verbatim and the displayed tier badge / 6-stat sub-score grid agreed with the entry's `t` and `e/s/r/o/c/d` values. No drift detected; no field rewrites applied.

`data.js` mtime (2026-05-21 07:01 UTC) is from earlier today but reflects edits in unrelated entries — none of the picked 10 had drift downstream of those edits.

## Escalation queue

None. No tier conflicts, no sub-score divergences, no safety-claim divergences, no pairings contradictions found across the 10 picked pages.

## Notes / methodology

- **Selection:** seeded by ISO week 2026-W21 via Mulberry32 over a DJB2 hash of the week label (deterministic, reproducible). Biased toward: no `last-reviewed` marker (+3), in-page article cross-link count < 2 (+2), supplement has at least one `ARTICLE_MAP` entry (+1), supplement appears in `pairings-data.js` (+1). Tier filtered to t1–t3 (active pages); skipped any `tr === false` entry and any page with an active `.hold` file. Last 8 weeks of polished slugs (`reviews/supplement-polish-history.json`) excluded.
- **Backups:** each polished page backed up to `s/<slug>.html.bak-2026-05-21T072735Z` (fixed timestamp for this run so re-runs overwrite cleanly).
- **Cross-link rule:** an article from `a/` was added only if (a) `slugify(ARTICLE_MAP[name].t)` matches an existing file in `a/` exactly (direct-slug), OR (b) the supplement name appears in the resolved article's `<title>`, OR (c) the supplement name appears ≥3 times in the article body text. Candidate files de-duplicated by resolved filename to avoid the multi-entry repeat problem seen in an earlier intermediate run on `pterostilbene` (ARTICLE_MAP listed several distinct titles that all collapsed onto the same file).
- **Pairings:** for each pair in `pairings-data.js` involving the picked supplement, the partner name was slugified (with several fallback rules — strip apostrophes, parens content, `/`) and only added if (a) the partner's slug exists at `s/<slug>.html` and (b) that slug isn't already linked in the page.
- **Held back per task spec:** tier badges, the 6 sub-score grid, and the dose/tips/cycle numerics — never auto-overwritten. These belong to `supplement-trending-review`.
- **Layout:** `og:image` meta tags all already present on the 10 pages; no `<img>` tags requiring width/height/lazy fixes; no h1-count violations; no skipped heading levels.
- **Microcopy sweep:** ran (doubled inline spaces, doubled commas, conservative misspelling list). Zero hits across all 10 pages — the daily-typo task's "recently changed" filter does miss these, but the pages themselves don't accumulate the kind of debt those rules catch. **Sweep was intentionally limited to text nodes only** (not attribute values or markup) after an intermediate revision broke relative `href="../..."` paths via an over-eager doubled-punctuation rule; that revision was reverted from backups before final apply.
- **`.hold` files:** none of the picked pages had an active `.hold` file.

## Forbidden actions confirmed not taken

- No edits to `data.js`.
- No tier / score / dose pushed back to `data.js`.
- No invented PMIDs or evidence.
- No git commits.
- No dark-mode CSS introduced.
