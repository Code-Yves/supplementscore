# SupplementScore Internal Link Audit — 2026-05-09

Automated weekly audit of internal cross-linking and orphan pages across the supplementscore-repo workspace.

## Headline Finding

The site has a **systemic gap in static-HTML cross-linking between supplement pages (`/s/`) and article pages (`/a/`)**. Out of 533 supplement pages and 263 article pages scanned, **0** supplement pages contain a static link to an article and **0** articles contain a static link to a supplement page. Cross-section navigation today flows almost exclusively through parameterized routes (`supplement.html?n=...`, `compare.html?a=...`) rather than direct `/a/`/`/s/` URLs, which means the static link graph between these two key sections is effectively disconnected. From a sitemap-discoverability standpoint, every `/s/` and `/a/` page is a structural orphan.

## Summary

- HTML files scanned: **887**
- Supplement pages (`/s/`): **533**
- Article pages (`/a/`): **263**
- Condition pages (`/condition/`): **27**
- Broken internal `.html` links (after resolving relative paths): **2**
- Supplement pages without an article cross-link: **533/533** (100.0%)
- Article pages without a supplement cross-link: **263/263** (100.0%)
- Condition pages with fewer than 3 supplement links (any style): **24/27**
- Orphan supplement pages (no incoming static links): **533/533**
- Orphan article pages (no incoming static links): **263/263**
- Supplements in `data.js` with zero article mentions anywhere: **453/781**

## 1. Broken Internal Links

Found 2 broken internal links.

| Source page | href | Missing target |
|---|---|---|
| `condition/adhd-stack.html` | `https://supplementscore.org/fr/condition/adhd-stack.html` | `fr/condition/adhd-stack.html` |
| `condition/osteoporosis-stack.html` | `https://supplementscore.org/fr/condition/osteoporosis-stack.html` | `fr/condition/osteoporosis-stack.html` |

Notes:
- Broken targets above are pages that other repo pages link to but that don't exist on disk. The two French-locale condition pages (`fr/condition/adhd-stack.html`, `fr/condition/osteoporosis-stack.html`) are referenced from English condition pages' hreflang/i18n links but were never built.
- Parameterized routes (e.g. `supplement.html?n=Foo`) are not flagged because the underlying `supplement.html` shell exists; the parameter is resolved client-side from `data.js`.

## 2. Supplement Pages Missing Article Cross-Links

- WITH at least one `/a/` link: **0**
- WITHOUT any `/a/` link: **533**

First 20 supplement pages with no article cross-link:

- `s/2-fucosyllactose.html`
- `s/5-ala.html`
- `s/acacia-fiber.html`
- `s/acerola-cherry-extract.html`
- `s/acetyl-l-carnitine.html`
- `s/activated-b-complex.html`
- `s/adaptogen-stack.html`
- `s/adenosylcobalamin.html`
- `s/aged-garlic-extract.html`
- `s/akkermansia-muciniphila.html`
- `s/alfalfa-leaf.html`
- `s/algal-dha.html`
- `s/algal-epa.html`
- `s/algal-oil.html`
- `s/aloe-vera.html`
- `s/alpha-gpc.html`
- `s/alpha-lipoic-acid.html`
- `s/amalaki-amla.html`
- `s/american-ginseng.html`
- `s/amla-indian-gooseberry.html`

## 3. Article Pages Missing Supplement Cross-Links

- WITH at least one `/s/` link: **0**
- WITHOUT any `/s/` link: **263**

First 20 article pages with no supplement cross-link:

- `a/5-aminolevulinic-acid-the-mitochondrial-compound-for-blood-sugar-control.html`
- `a/5-htp-the-supplement-ssris-replaced-mdash-and-why.html`
- `a/5-supplements-that-can-dangerously-interact-with-common-medications.html`
- `a/acacia-fiber-the-gentle-prebiotic-that-even-sensitive-guts-tolerate.html`
- `a/acetyl-l-carnitine-vs-l-carnitine-when-the-acetyl-group-actually-matters.html`
- `a/activated-charcoal-why-detox-claims-are-nonsense.html`
- `a/adaptogens-explained-ashwagandha-rhodiola-and-the-stress-response.html`
- `a/aged-garlic-extract-the-kyolic-evidence-for-cardiovascular-risk.html`
- `a/alpha-gpc-the-choline-form-with-the-best-cognitive-trial-data.html`
- `a/alpha-lipoic-acid-the-antioxidant-for-nerve-health.html`
- `a/apigenin-from-chamomile-tea-to-senolytic-hype.html`
- `a/apple-cider-vinegar-pills-worthless-and-potentially-harmful.html`
- `a/are-multivitamins-a-waste-of-money.html`
- `a/ashwagandha-and-thyroid-a-hidden-risk.html`
- `a/ashwagandha-for-anxious-kids-why-pediatric-evidence-doesn-t-exist-yet.html`
- `a/ashwagandha-the-most-overhyped-supplement-of-2026.html`
- `a/astaxanthin-the-red-algal-antioxidant-with-specific-uses.html`
- `a/astragalus-traditional-tonic-modern-evidence-gap.html`
- `a/bacopa-monnieri-the-ayurvedic-nootropic-that-survived-modern-trials.html`
- `a/barley-grass-vs-wheatgrass-what-the-superfood-powders-actually-do.html`

## 4. Supplement Coverage via Article Mentions

Supplement entries parsed from `data.js`: 781. (Larger than the 533 on-disk `/s/` pages because `data.js` covers every entity in the score model — including aliases and ingredient forms that don't all have a dedicated page.)

### Top 10 supplements by article mentions (well covered)

| Rank | Supplement | Articles mentioning |
|---|---|---|
| 1 | Iron | 52 |
| 2 | DHA (standalone, algal) | 40 |
| 3 | Calcium | 35 |
| 4 | Magnesium | 34 |
| 5 | NAC (N-Acetyl Cysteine) | 34 |
| 6 | Zinc | 27 |
| 7 | Vitamin C (megadose) | 27 |
| 8 | Vitamin C (moderate dose) | 27 |
| 9 | Vitamin C (liposomal) | 27 |
| 10 | Omega-3 (EPA/DHA) | 25 |

### 20 supplements with zero article mentions (out of 453 total)

Pitching one article featuring any of these would close the editorial coverage gap. Names use the canonical form from `data.js` (parenthetical aliases stripped before the case-insensitive substring match).

- Dietary Nitrate / Beetroot
- Black seed oil (Nigella sativa)
- Palmitoylethanolamide (PEA)
- Olive leaf extract
- NMN / NAD+ precursors
- Glucosamine / Chondroitin
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

## 5. Condition Page Link Depth

Counting both `/s/foo.html` static links and parameterized `supplement.html?n=...` links, since condition pages link via the parameterized style.

| Condition page | Distinct supplement links |
|---|---|
| `condition/allergic-rhinitis.html` | 0 ⚠️ |
| `condition/anxiety-stack.html` | 0 ⚠️ |
| `condition/ckd-nutrition.html` | 0 ⚠️ |
| `condition/gerd-protocol.html` | 0 ⚠️ |
| `condition/index.html` | 0 ⚠️ |
| `condition/recurrent-uti.html` | 0 ⚠️ |
| `es/condition/anxiety-stack.html` | 0 ⚠️ |
| `es/condition/pcos-protocol.html` | 0 ⚠️ |
| `fr/condition/anxiety-stack.html` | 0 ⚠️ |
| `fr/condition/pcos-protocol.html` | 0 ⚠️ |
| `condition/chronic-constipation.html` | 1 ⚠️ |
| `condition/hangover-recovery.html` | 1 ⚠️ |
| `condition/me-cfs-evidence.html` | 1 ⚠️ |
| `condition/nafld-protocol.html` | 1 ⚠️ |
| `condition/prostate-health.html` | 1 ⚠️ |
| `condition/eczema-stack.html` | 2 ⚠️ |
| `condition/gallstone-prevention.html` | 2 ⚠️ |
| `condition/gout-protocol.html` | 2 ⚠️ |
| `condition/hypothyroidism-stack.html` | 2 ⚠️ |
| `condition/ibs-protocol.html` | 2 ⚠️ |
| `condition/long-covid-evidence.html` | 2 ⚠️ |
| `condition/pcos-protocol.html` | 2 ⚠️ |
| `condition/perimenopause-stack.html` | 2 ⚠️ |
| `condition/prediabetes-protocol.html` | 2 ⚠️ |
| `condition/migraine-prevention.html` | 4 |
| `condition/osteoporosis-stack.html` | 4 |
| `condition/adhd-stack.html` | 5 |

**24 condition pages have fewer than 3 supplement links.** These pages should be expanded with more relevant cross-links to improve topical depth and SEO.

## 6. Sitemap Orphans

A page is treated as an orphan if no other page in the repo links to it via a resolvable static `href` (canonical self-links and query-parameterized routes excluded).

### Orphan supplement pages: 533 / 533

Every supplement page is structurally orphaned at the static-HTML link layer. They are reachable via the parameterized `supplement.html?n=...` route and the XML sitemap, but no static page in the repo contains a direct `<a href="s/<slug>.html">` link to them.

First 30:

- `s/2-fucosyllactose.html`
- `s/5-ala.html`
- `s/acacia-fiber.html`
- `s/acerola-cherry-extract.html`
- `s/acetyl-l-carnitine.html`
- `s/activated-b-complex.html`
- `s/adaptogen-stack.html`
- `s/adenosylcobalamin.html`
- `s/aged-garlic-extract.html`
- `s/akkermansia-muciniphila.html`
- `s/alfalfa-leaf.html`
- `s/algal-dha.html`
- `s/algal-epa.html`
- `s/algal-oil.html`
- `s/aloe-vera.html`
- `s/alpha-gpc.html`
- `s/alpha-lipoic-acid.html`
- `s/amalaki-amla.html`
- `s/american-ginseng.html`
- `s/amla-indian-gooseberry.html`
- `s/andrographis-echinacea-combo.html`
- `s/andrographis-paniculata.html`
- `s/andrographis.html`
- `s/aniracetam.html`
- `s/anthocyanin-concentrate.html`
- `s/apigenin.html`
- `s/apple-cider-vinegar.html`
- `s/arachidonic-acid.html`
- `s/arjuna-bark.html`
- `s/artichoke-extract.html`

### Orphan article pages: 263 / 263

Every article page is also structurally orphaned. Articles are surfaced through the home-page article feed (rendered client-side from a JSON list) and via search, but no static page contains a direct `<a href="a/<slug>.html">` link to them.

First 30:

- `a/5-aminolevulinic-acid-the-mitochondrial-compound-for-blood-sugar-control.html`
- `a/5-htp-the-supplement-ssris-replaced-mdash-and-why.html`
- `a/5-supplements-that-can-dangerously-interact-with-common-medications.html`
- `a/acacia-fiber-the-gentle-prebiotic-that-even-sensitive-guts-tolerate.html`
- `a/acetyl-l-carnitine-vs-l-carnitine-when-the-acetyl-group-actually-matters.html`
- `a/activated-charcoal-why-detox-claims-are-nonsense.html`
- `a/adaptogens-explained-ashwagandha-rhodiola-and-the-stress-response.html`
- `a/aged-garlic-extract-the-kyolic-evidence-for-cardiovascular-risk.html`
- `a/alpha-gpc-the-choline-form-with-the-best-cognitive-trial-data.html`
- `a/alpha-lipoic-acid-the-antioxidant-for-nerve-health.html`
- `a/apigenin-from-chamomile-tea-to-senolytic-hype.html`
- `a/apple-cider-vinegar-pills-worthless-and-potentially-harmful.html`
- `a/are-multivitamins-a-waste-of-money.html`
- `a/ashwagandha-and-thyroid-a-hidden-risk.html`
- `a/ashwagandha-for-anxious-kids-why-pediatric-evidence-doesn-t-exist-yet.html`
- `a/ashwagandha-the-most-overhyped-supplement-of-2026.html`
- `a/astaxanthin-the-red-algal-antioxidant-with-specific-uses.html`
- `a/astragalus-traditional-tonic-modern-evidence-gap.html`
- `a/bacopa-monnieri-the-ayurvedic-nootropic-that-survived-modern-trials.html`
- `a/barley-grass-vs-wheatgrass-what-the-superfood-powders-actually-do.html`
- `a/berberine-and-gut-health-a-double-edged-sword.html`
- `a/berberine-is-it-really-nature-s-ozempic.html`
- `a/bergamot-citrus-extract-italy-s-answer-to-high-cholesterol.html`
- `a/beta-alanine-why-the-tingle-is-worth-it-for-athletes.html`
- `a/betaine-tmg-the-methyl-donor-that-lowers-homocysteine-and-boosts-performance.html`
- `a/bifidobacterium-infantis-35624-the-ibs-strain-with-gold-standard-data.html`
- `a/bilberry-extract-what-the-eye-health-evidence-actually-shows.html`
- `a/biotin-for-hair-growth-marketing-vs-reality.html`
- `a/bitter-orange-and-synephrine-the-ephedra-substitute-with-its-own-cardiac-risks.html`
- `a/black-cohosh-for-menopause-cautious-yes-cautious-no.html`

## Priority Recommendations

### A. Structural fix (highest leverage)

Add a "Related articles" block to every `/s/` page and a "Related supplements" block to every `/a/` page that emits **static `<a href="...">`** links (not query-string routes). `data.js` already encodes the relationships in `ARTICLE_MAP`; a build-time pass could read that map and inject 3–5 cross-links per page. This single change would convert 796 structurally orphan pages into well-linked nodes in one pass and is by far the highest-leverage SEO/UX fix surfaced by this audit.

### B. Repair the two missing French condition pages

`fr/condition/adhd-stack.html` and `fr/condition/osteoporosis-stack.html` are referenced from the English condition pages but do not exist. Either build them or remove the dangling i18n links.

### C. Editorial coverage (next-best leverage)

Among the 453 supplements with zero article mentions, **306 also have a dedicated `/s/` page**. These are the worst editorial gaps — users can land on the page but the article library never references them. Top candidates for a new article pitch:

- **Dietary Nitrate / Beetroot** — `s/dietary-nitrate-beetroot.html` exists but is referenced by zero articles
- **Black seed oil (Nigella sativa)** — `s/black-seed-oil.html` exists but is referenced by zero articles
- **Palmitoylethanolamide (PEA)** — `s/palmitoylethanolamide.html` exists but is referenced by zero articles
- **Olive leaf extract** — `s/olive-leaf-extract.html` exists but is referenced by zero articles
- **Glucosamine / Chondroitin** — `s/glucosamine-chondroitin.html` exists but is referenced by zero articles
- **Collagen for muscle strength** — `s/collagen-for-muscle-strength.html` exists but is referenced by zero articles
- **Elderflower extract** — `s/elderflower-extract.html` exists but is referenced by zero articles
- **Bee propolis** — `s/bee-propolis.html` exists but is referenced by zero articles
- **Pine bark extract (Pycnogenol)** — `s/pine-bark-extract.html` exists but is referenced by zero articles
- **Methyl B12 + Methylfolate combo** — `s/methyl-b12-methylfolate-combo.html` exists but is referenced by zero articles

**Highest-priority pitch: `Dietary Nitrate / Beetroot`.** A supplement page exists on the site but appears in none of the 263 articles — anyone landing on the page from search has no internal pathway into the editorial library, and no article funnels readers toward the page. A single article featuring this supplement would close both gaps.

---

## Methodology Notes

- HTML scan covered the full repository, excluding `_mockups/`, `_docs/`, and hidden directories.
- "Internal link" = any `href` that resolves to a path inside the repo, including relative paths, `/`-rooted paths, and `https://supplementscore.org/...` URLs.
- Self-canonical links (a page linking to its own URL) are excluded from cross-link and orphan calculations.
- Parameterized routes (`supplement.html?n=...`, `compare.html?a=...`) are NOT counted as `/s/` or `/a/` cross-links because the static link graph is what matters for crawler discoverability and is the dimension this audit is designed to measure.
- Supplement-mention search uses the canonical name from `data.js` (parenthetical aliases stripped) with a case-insensitive substring match against article body text. Names shorter than 3 characters after stripping are skipped to avoid false positives.
- Generated by the weekly internal-link-audit scheduled task.