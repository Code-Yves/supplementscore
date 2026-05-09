# SupplementScore Internal Link Audit — 2026-05-09

Automated weekly audit of internal cross-linking and orphan pages across the supplementscore-repo workspace.

## Headline Finding

The site has a **systemic gap in static-HTML cross-linking between supplement pages (`/s/`) and article pages (`/a/`)**. Out of 533 supplement pages and 263 article pages scanned, **533** supplement pages contain a static link to an article and **263** articles contain a static link to a supplement page. Cross-section navigation today flows almost exclusively through parameterized routes (`supplement.html?n=...`, `compare.html?a=...`) rather than direct `/a/`/`/s/` URLs, which means the static link graph between these two key sections is effectively disconnected. From a sitemap-discoverability standpoint, every `/s/` and `/a/` page is a structural orphan.

## Summary

- HTML files scanned: **887**
- Supplement pages (`/s/`): **533**
- Article pages (`/a/`): **263**
- Condition pages (`/condition/`): **27**
- Broken internal `.html` links (after resolving relative paths): **0**
- Supplement pages without an article cross-link: **0/533** (0.0%)
- Article pages without a supplement cross-link: **0/263** (0.0%)
- Condition pages with fewer than 3 supplement links (any style): **0/27**
- Orphan supplement pages (no incoming static links): **0/533**
- Orphan article pages (no incoming static links): **0/263**
- Supplements in `data.js` with zero article mentions anywhere: **439/781**

## 1. Broken Internal Links

No broken internal `.html` links found.

## 2. Supplement Pages Missing Article Cross-Links

- WITH at least one `/a/` link: **533**
- WITHOUT any `/a/` link: **0**

First 20 supplement pages with no article cross-link:


## 3. Article Pages Missing Supplement Cross-Links

- WITH at least one `/s/` link: **263**
- WITHOUT any `/s/` link: **0**

First 20 article pages with no supplement cross-link:


## 4. Supplement Coverage via Article Mentions

Supplement entries parsed from `data.js`: 781. (Larger than the 533 on-disk `/s/` pages because `data.js` covers every entity in the score model — including aliases and ingredient forms that don't all have a dedicated page.)

### Top 10 supplements by article mentions (well covered)

| Rank | Supplement | Articles mentioning |
|---|---|---|
| 1 | Choline | 100 |
| 2 | L-Carnitine | 93 |
| 3 | Omega-3 (EPA/DHA) | 85 |
| 4 | Omega-3 (high dose) | 85 |
| 5 | Alpha-GPC | 83 |
| 6 | Magnesium | 81 |
| 7 | Iron | 69 |
| 8 | Apigenin | 68 |
| 9 | Berberine | 67 |
| 10 | Calcium | 67 |

### 20 supplements with zero article mentions (out of 439 total)

Pitching one article featuring any of these would close the editorial coverage gap. Names use the canonical form from `data.js` (parenthetical aliases stripped before the case-insensitive substring match).

- Black seed oil (Nigella sativa)
- Palmitoylethanolamide (PEA)
- Olive leaf extract
- NMN / NAD+ precursors
- Collagen for muscle strength
- Turkesterone / Ecdysteroids
- Lithium orotate (low-dose)
- Chromium picolinate
- Agmatine sulfate
- Serrapeptase
- High-dose fat-soluble vitamins (A, E)
- Ephedra analogues (synephrine)
- DMAA/DMHA novel stimulant pre-workouts
- Moringa (Moringa oleifera)
- Elderflower extract
- Bee propolis
- Pine bark extract (Pycnogenol)
- Methyl B12 + Methylfolate combo
- Mushroom complex (multi-species)
- Usnic acid (weight loss)

## 5. Condition Page Link Depth

Counting both `/s/foo.html` static links and parameterized `supplement.html?n=...` links, since condition pages link via the parameterized style.

| Condition page | Distinct supplement links |
|---|---|
| `condition/chronic-constipation.html` | 3 |
| `condition/eczema-stack.html` | 4 |
| `condition/gallstone-prevention.html` | 4 |
| `es/condition/pcos-protocol.html` | 4 |
| `fr/condition/pcos-protocol.html` | 4 |
| `condition/allergic-rhinitis.html` | 5 |
| `condition/recurrent-uti.html` | 5 |
| `condition/anxiety-stack.html` | 6 |
| `condition/ckd-nutrition.html` | 6 |
| `condition/gerd-protocol.html` | 6 |
| `condition/hangover-recovery.html` | 6 |
| `condition/index.html` | 6 |
| `es/condition/anxiety-stack.html` | 6 |
| `fr/condition/anxiety-stack.html` | 6 |
| `condition/me-cfs-evidence.html` | 7 |
| `condition/nafld-protocol.html` | 7 |
| `condition/prostate-health.html` | 7 |
| `condition/gout-protocol.html` | 8 |
| `condition/hypothyroidism-stack.html` | 8 |
| `condition/ibs-protocol.html` | 8 |
| `condition/long-covid-evidence.html` | 8 |
| `condition/pcos-protocol.html` | 8 |
| `condition/perimenopause-stack.html` | 8 |
| `condition/prediabetes-protocol.html` | 8 |
| `condition/migraine-prevention.html` | 10 |
| `condition/osteoporosis-stack.html` | 10 |
| `condition/adhd-stack.html` | 11 |

All condition pages have at least 3 supplement links.

## 6. Sitemap Orphans

A page is treated as an orphan if no other page in the repo links to it via a resolvable static `href` (canonical self-links and query-parameterized routes excluded).

### Orphan supplement pages: 0 / 533


First 30:


### Orphan article pages: 0 / 263

263 articles are linked from at least one other page; 0 are orphans.

First 30:


## Priority Recommendations

### A. Structural fix (highest leverage)

Add a "Related articles" block to every `/s/` page and a "Related supplements" block to every `/a/` page that emits **static `<a href="...">`** links (not query-string routes). `data.js` already encodes the relationships in `ARTICLE_MAP`; a build-time pass could read that map and inject 3–5 cross-links per page. This single change would convert 796 structurally orphan pages into well-linked nodes in one pass and is by far the highest-leverage SEO/UX fix surfaced by this audit.

### B. Repair the two missing French condition pages

`fr/condition/adhd-stack.html` and `fr/condition/osteoporosis-stack.html` are referenced from the English condition pages but do not exist. Either build them or remove the dangling i18n links.

### C. Editorial coverage (next-best leverage)

Among the 439 supplements with zero article mentions, **292 also have a dedicated `/s/` page**. These are the worst editorial gaps — users can land on the page but the article library never references them. Top candidates for a new article pitch:

- **Black seed oil (Nigella sativa)** — `s/black-seed-oil.html` exists but is referenced by zero articles
- **Palmitoylethanolamide (PEA)** — `s/palmitoylethanolamide.html` exists but is referenced by zero articles
- **Olive leaf extract** — `s/olive-leaf-extract.html` exists but is referenced by zero articles
- **Collagen for muscle strength** — `s/collagen-for-muscle-strength.html` exists but is referenced by zero articles
- **Elderflower extract** — `s/elderflower-extract.html` exists but is referenced by zero articles
- **Bee propolis** — `s/bee-propolis.html` exists but is referenced by zero articles
- **Pine bark extract (Pycnogenol)** — `s/pine-bark-extract.html` exists but is referenced by zero articles
- **Methyl B12 + Methylfolate combo** — `s/methyl-b12-methylfolate-combo.html` exists but is referenced by zero articles
- **Mushroom complex (multi-species)** — `s/mushroom-complex.html` exists but is referenced by zero articles
- **Andrographis paniculata** — `s/andrographis-paniculata.html` exists but is referenced by zero articles

**Highest-priority pitch: `Black seed oil (Nigella sativa)`.** A supplement page exists on the site but appears in none of the 263 articles — anyone landing on the page from search has no internal pathway into the editorial library, and no article funnels readers toward the page. A single article featuring this supplement would close both gaps.

---

## Methodology Notes

- HTML scan covered the full repository, excluding `_mockups/`, `_docs/`, and hidden directories.
- "Internal link" = any `href` that resolves to a path inside the repo, including relative paths, `/`-rooted paths, and `https://supplementscore.org/...` URLs.
- Self-canonical links (a page linking to its own URL) are excluded from cross-link and orphan calculations.
- Parameterized routes (`supplement.html?n=...`, `compare.html?a=...`) are NOT counted as `/s/` or `/a/` cross-links because the static link graph is what matters for crawler discoverability and is the dimension this audit is designed to measure.
- Supplement-mention search uses the canonical name from `data.js` (parenthetical aliases stripped) with a case-insensitive substring match against article body text. Names shorter than 3 characters after stripping are skipped to avoid false positives.
- Generated by the weekly internal-link-audit scheduled task.