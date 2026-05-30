# Condition deep-dive run — 2026-05-30

## Summary
Three deep condition pages produced — all **greenfield** (no existing condition page on disk for any of the three slugs at run start). Each page is 1,800–2,100 words (main content), carries 11 cited PMIDs, and ships the full schema / meta / hreflang stack. All pages auto-published to `supplementscore-repo/condition/`, added to the condition hub index (Recently-added grid + SEO-STATIC-INDEX list), and appended to `sitemap-conditions.xml` (with `sitemap-index.xml` lastmod bumped to 2026-05-30). This is the third weekly run; the rolling 12-week window now holds 9 topics.

**Every PMID on every page was verified against PubMed (live `pubmed` MCP) before use — no citation was written from memory.** All supplement cross-link slugs were verified to resolve to an on-disk `s/<slug>.html` file.

## Topic selection rationale
- **hashimotos** (Hashimoto's thyroiditis, ICD-10 E06.3) — Greenfield; the most common autoimmune disease and the leading cause of hypothyroidism in iodine-sufficient regions (Caturegli 2014). Distinct from the existing `hypothyroidism-stack.html`, which covers the downstream hypothyroid *state* and levothyroxine management; this page covers the autoimmune *etiology* and the antibody question that drives most searches. Selenium is the rare supplement with a replicated RCT/meta-analysis base in this disease (Gärtner 2002; Wichman 2016), and the levothyroxine-absorption interaction surface (iron/calcium/magnesium/iodine/soy) plus biotin lab-interference make for a uniquely high-value medication section.
- **gout** (ICD-10 M10) — Greenfield; ~9.2 million US adults / 3.9% prevalence and only ~⅓ on urate-lowering therapy (Chen-Xu 2019), so the supplement-instead-of-allopurinol failure mode is common and worth addressing head-on. Vitamin C (Juraschek 2011) and tart cherry (Zhang 2012; Martin 2019) clear the ≥2 strong-evidence bar, *with honest caveats* (Stamp 2013 negative in established gout; omega-3 supplements null for flares per Zhang 2019). The colchicine CYP3A4/P-gp interaction (piperine AVOID-level) is surfaced prominently per the escalation rule.
- **perimenopause** (ICD-10 N95.1) — Greenfield; very high search volume and deliberately distinct from the existing `menopause-hot-flashes.html` (vasomotor-specific). This page frames the whole transition — irregular cycles, sleep, mood, and the *accelerating bone loss* window (Greendale/SWAN 2019) — and leads bone protection with calcium + vitamin D (Weaver 2016). Soy isoflavones/phytoestrogens (Franco 2016; Taku 2012) carry the modest VMS signal. St John's wort is surfaced as the key interaction (CYP3A4 → lowers HRT/contraception; serotonin-syndrome risk with SSRIs).

## Conditions skipped this week
- All conditions with an existing dedicated condition page were skipped to avoid duplicates/rewrites; no existing page met the "shallow (<800 words)" rewrite trigger (the two 11-word stubs `kidney-stones.html` and `prostate-health.html` are redirect tombstones, not shallow content, and have full counterparts at `kidney-stones-prevention.html` / `bph-protocol.html`).
- The 6 in-window topics (type-2-diabetes, osteopenia, depression-mild-moderate, peptic-ulcer-disease, copd-adjunct, alopecia-areata) were excluded per the 12-week rule.
- No low-evidence "limited-evidence" framings were needed; all three picks clear the ≥2 strong-evidence-supplement bar.

## Autonomous choices / assumptions (run unattended)
- **Cross-link style**: used the current house style `../supplement.html?slug=<slug>` (matches the modal system and the live `type-2-diabetes.html` reference), not legacy `../s/<slug>.html`. Every slug was still verified to have an on-disk `s/<slug>.html` file so the "verified to exist on disk" acceptance check passes either way.
- **hreflang**: added forward-compatible `fr` and `es` alternates (plus `en` + `x-default`) per the task spec, even though localized pages don't exist yet.
- **ICD-10 codes**: E06.3 (Hashimoto's), M10 (gout), N95.1 (menopausal/climacteric — used for perimenopause as the closest standard code).
- **Strong/Conditional counts** reflect the on-page section structure; for Hashimoto's, myo-inositol+selenium is presented under "strong evidence" but explicitly tier-3/"promising not definitive."
- **RC_PREVNEXT** prev-pointers set to a related live page each (hypothyroidism-stack / osteoarthritis-knee / menopause-hot-flashes).

## Deliverables
- 3 new HTML pages (greenfield) at `supplementscore-repo/condition/`:
  - `hashimotos.html` (2,119 words, 11 PMIDs)
  - `gout.html` (1,973 words, 11 PMIDs)
  - `perimenopause.html` (1,829 words, 11 PMIDs)
- `condition/index.html` — 3 new hub cards in the "Recently added protocols" grid; 3 new entries in the SEO-STATIC-INDEX list (alphabetical placement).
- `sitemap-conditions.xml` — 3 new URL entries (lastmod 2026-05-30).
- `sitemap-index.xml` — `sitemap-conditions.xml` lastmod bumped to 2026-05-30.
- `reviews/condition-deep-dive-log.md` — 3 rows appended.
- `reviews/condition-deep-dive-history.json` — third run added; 9-topic rolling window.
- This summary.

## Medication-interaction highlights
- **Hashimoto's**: levothyroxine absorption (separate iron/calcium/magnesium/iodine/soy by ≥4h); biotin lab-interference; ashwagandha TSH/T4 shift; selenium over-supplementation → T2D risk (Stranges 2007).
- **Gout** (AVOID-level surfaced prominently): colchicine + piperine (and quercetin/milk thistle/berberine/curcumin/St John's wort) → severe/fatal toxicity via CYP3A4/P-gp; colchicine B12 depletion; allopurinol HLA-B*5801 SCAR risk; NSAID + fish-oil bleeding.
- **Perimenopause**: St John's wort AVOID with hormone therapy and contraception (CYP3A4 induction) and with SSRIs/SNRIs (serotonin syndrome); phytoestrogen disclosure on HRT; levothyroxine timing cross-referenced to the Hashimoto's page.

## Acceptance check
| Criterion | Target | Result |
| --- | --- | --- |
| Pages produced | 3 | 3 ✓ |
| Word count per page | 1500–2500 | 2,119 / 1,973 / 1,829 ✓ |
| PMIDs per page | ≥10 | 11 / 11 / 11 ✓ |
| Strong-evidence supps per page | ≥2 | 3 / 2 / 2 ✓ |
| Supplement cross-links exist on disk | all | all verified ✓ |
| Invented PMIDs / supplement names | none | none — all PubMed-verified ✓ |
| AVOID-level interaction surfaced prominently | required | colchicine box on gout page ✓ |
| Light-mode only | required | forced light theme on all 3 ✓ |
| git commits | forbidden | none made ✓ |

## Candidate topics for future runs (greenfield, ≥2 strong-evidence supplements likely)
- hyperthyroidism (selenium for Graves' orbitopathy; L-carnitine) — pairs with this week's thyroid pages
- periodontal disease (L. reuteri probiotics, omega-3 host modulation, vitamin D)
- raynaud's (omega-3, L-arginine) — verify strong-evidence count
- restless legs already exists; chronic fatigue / fibromyalgia exist
- low-libido-male / low-libido-female, ED non-medication, bruxism, tinnitus (likely "limited-evidence" framings), panic-disorder / OCD-adjunct / PTSD-adjunct, bipolar-adjunct remain open.
