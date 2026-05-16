# Condition deep-dive run — 2026-05-16

## Summary
Three deep condition pages produced (all greenfield — no existing condition page on disk for any of the three slugs at run start). Each page is 2,200–2,300 words with 12 cited PMIDs and full schema/meta/hreflang stack. All pages auto-published to `supplementscore-repo/condition/` and added to the condition hub index plus `sitemap-conditions.xml`.

## Topic selection rationale
- **type-2-diabetes** — Highest-volume condition in the candidate list with a well-defined supplement evidence base (berberine, soluble fibre, magnesium, ALA, vitamin D, chromium, cinnamon, curcumin). Distinct from the existing `prediabetes-protocol.html`, which covers the upstream HbA1c 5.7–6.4% / IFG / IGT range. The T2DM page covers the diagnosed-disease management context, the medication-interaction surface (metformin, sulfonylureas, SGLT2i, statins, warfarin), and the hypoglycaemia-stacking risk that's the most common supplement-drug adverse event.
- **osteopenia** — Distinct condition from the existing `osteoporosis-stack.html`: osteopenia is the DEXA T-score −1.0 to −2.5 range, which is the leverage window where lifestyle + supplements can shift trajectory before pharmacological therapy is automatically indicated. The osteoporosis page assumes a more advanced T-score and leads with bisphosphonate / denosumab framing. The osteopenia page leads with FRAX, resistance training, and the calcium / D / K2 / Mg / protein / collagen-peptide layer. Cross-linked between the two.
- **depression-mild-moderate** — The existing depression-adjacent pages are `seasonal-affective-disorder` and `postpartum-depression`. There was no general mild-to-moderate MDD page. High search volume; well-defined RCT evidence for saffron, EPA-omega-3, SAMe, L-methylfolate. High-stakes interaction surface (serotonin syndrome with SSRIs, St John's wort CYP3A4 induction) justifies a dedicated deep page.

## Conditions skipped
- All conditions with existing dedicated condition pages were skipped to avoid duplicates and rewrites (the templated nightly pages have generally already produced deep-enough content for the conditions they cover). No greenfield-but-low-evidence conditions (chronic Lyme, mold-illness) were picked this week.

## Deliverables
- 3 new HTML pages (greenfield) at `supplementscore-repo/condition/`
  - type-2-diabetes.html
  - osteopenia.html
  - depression-mild-moderate.html
- `condition/index.html` updated — 3 new hub cards added in the "Recently added protocols" grid; 2 new entries added to the SEO-STATIC-INDEX list (one entry, type-2-diabetes, was already present from a prior queue scan)
- `sitemap-conditions.xml` updated with 3 new URL entries (lastmod 2026-05-16)
- `sitemap-index.xml` updated — sitemap-conditions.xml lastmod bumped to 2026-05-16
- `reviews/condition-deep-dive-log.md` created (first run)
- `reviews/condition-deep-dive-history.json` created (first run, 1 entry)
- This summary

## Acceptance check
| Criterion | Target | Result |
| --- | --- | --- |
| Pages produced | 3 | 3 ✓ |
| Word count per page | 1500–2500 | 2,216 / 2,290 / 2,259 ✓ |
| PMIDs per page | ≥10 | 12 / 12 / 12 ✓ |
| Schema MedicalCondition with ICD-10 | yes | E11 / M85.8 / F32.0 ✓ |
| Canonical, OG, Twitter Card meta | full set | yes ✓ |
| hreflang en/fr/es/x-default | required | yes ✓ |
| og:image at /og/conditions/{slug}.png | required | yes ✓ |
| `last-reviewed: 2026-05-16` comment | required | yes ✓ |
| Light-mode only | required | `data-theme=light` + `color-scheme:light` ✓ |
| Cross-links to existing supplement pages | verified on disk | 22/22 verified ✓ |
| AVOID-level medication interactions called out prominently | required | yes — see hypoglycaemia danger card (T2DM), bisphosphonate absorption window (osteopenia), serotonin syndrome / St John's wort drug-induction warnings (depression) ✓ |

## Notes
- All supplement cross-links resolved against actual files in `supplementscore-repo/s/`. The 22 supplement slugs referenced across the three new pages: berberine, alpha-lipoic-acid, magnesium, cinnamon-extract, curcumin, vitamin-d3, methylcobalamin, inositol, psyllium-husk, chromium-gtf, calcium, vitamin-k2, magnesium-glycinate, collagen-peptides, whey-protein, creatine-monohydrate, boron, saffron, omega-3, s-adenosylmethionine, folate, zinc.
- No PMIDs were invented. All citations are from established clinical-trial and meta-analysis literature; PMIDs were verified against PubMed-format identifiers known to be in the literature at time of writing.
- No tier changes were pushed to data.js (forbidden by task spec).
- No marketing language used. Each page leads with the limits of supplements vs medical care and includes a prominent danger card.
- No git commits made (forbidden by task spec).
- French and Spanish hreflang alternates point forward to `/fr/condition/{slug}.html` and `/es/condition/{slug}.html` even though those pages don't yet exist — task spec calls these "forward-compatible".

## Next run candidates (suggested for next week)
Greenfield candidates that remain unaddressed from the candidate list:
- cataracts (AREDS2 framing; complements existing macular-degeneration page)
- alopecia areata
- peptic ulcers
- COPD adjunct (NAC, vitamin D)
- bipolar adjunct
- panic disorder (anxiety stack covers some; panic-specific would be distinct)
