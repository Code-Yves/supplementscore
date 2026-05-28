# Stack Builder — 2026-05-28 run summary

Three new goal-based stack pages generated this week. All pages:

- Light-mode only (per site convention)
- Use `../supplement.html?slug=…` links (modal-interceptor surface)
- 1,200–2,500 words each
- Article-schema JSON-LD with `articleSection: "Supplement Stack"`
- Full canonical, OG, Twitter Card meta
- `<!-- last-reviewed: 2026-05-28 -->`
- `og:image` at `https://supplementscore.org/og/stacks/{slug}.png` (OG converter handles generation downstream)
- Footer canonicalised via `_partials/footer.html` pattern (footer markup inlined matches existing post-workout-recovery.html template)
- No filled-card callouts; left-bar typographic emphasis only

## Pages

| Slug | Supplements | Don't-bother | PMIDs | Notes |
| --- | ---:| ---:| ---:| --- |
| `stack/pre-workout.html` | 8 | 4 | 17 | Foundation: creatine, beta-alanine. Performance: caffeine, citrulline, nitrate. Optional: bicarbonate, tyrosine, taurine. Don't-bother: L-arginine, BCAAs, DMAA/DMHA, deer antler velvet. |
| `stack/joint-support-non-nsaid.html` | 8 | 4 | 18 | Foundation: collagen peptides, UC-II, omega-3. Performance: curcumin, Boswellia. Optional: glucosamine+chondroitin, MSM, oral HA. Don't-bother: shark cartilage, SAM-e for OA, CBD for hand OA, copper bracelets. |
| `stack/anxiety-non-pharmaceutical.html` | 7 | 4 | 15 | Foundation: ashwagandha KSM-66, Silexan lavender, magnesium glycinate. Performance: L-theanine, saffron. Optional: passionflower, lemon balm. Don't-bother: oral GABA, high-dose kava, CBD for chronic GAD, 5-HTP/tryptophan. |

## Cross-link flags for `weekly-supplement-page-polish`

The polish pass should backlink each supplement on these stacks to the relevant stack page from its own `supplement.html?slug=…` modal section. Specifically:

- **From creatine-monohydrate**: add link to pre-workout.html (in addition to post-workout-recovery.html which already exists)
- **From beta-alanine, caffeine-standardised, citrulline-malate, dietary-nitrate-beetroot, sodium-bicarbonate-sports, tyrosine-l-tyrosine, taurine**: backlink pre-workout.html
- **From collagen-peptides, collagen-type-ii-undenatured-uc-ii, curcumin-bioavailable-form, boswellia-serrata, glucosamine-chondroitin, methylsulfonylmethane-msm, hyaluronic-acid-oral**: backlink joint-support-non-nsaid.html (omega-3 already gets cross-linked)
- **From ashwagandha-ksm-66, lavender-oil-oral-silexan, l-theanine, saffron-crocus-sativus, passionflower-passiflora-incarnata, lemon-balm-melissa-officinalis**: backlink anxiety-non-pharmaceutical.html (magnesium-glycinate already gets cross-linked)

## Escalations

- **Evidence weakness:** the joint-support-non-nsaid optional layer (glucosamine+chondroitin, MSM, oral HA) is Tier-2 with smaller effect sizes than the Foundation layer. The hero and per-supplement cards prominently note onset (8–12 weeks) and frame the stack as adjunct to PT and load management, not a cartilage-modifying intervention. No restructuring needed but worth flagging.
- **UC-II funder concentration:** trials largely InterHealth/Lonza. Noted in the Funder mix and Notes lines on the per-supplement card.
- **Silexan funder concentration:** trials largely Schwabe. Same disclosure handling.
- **No within-stack pairing antagonism detected.** Beetroot/nitrate + caffeine has a small documented antagonism in pure endurance — handled in the within-stack synergies section with explicit guidance to separate or trial individually for endurance-only use.

## Sitemap / index updates

- `sitemap-stacks.xml` updated with 3 new URLs (lastmod 2026-05-28)
- `sitemap-index.xml` `<lastmod>` bumped for `sitemap-stacks.xml`
- `stack/index.html` adds 3 new hub-cards in the existing `.hub-grid` and updates `<!-- last-reviewed: -->` to 2026-05-28
- `reviews/stack-builder-log.md` appended with 3 rows

## Validation notes

- Each "don't bother" item carries ≥1 contradicting PMID
- Each supplement on each stack carries ≥1 supportive PMID
- Total PMIDs per page: 17 (pre-workout), 18 (joint), 15 (anxiety) — all ≥10 acceptance threshold
- No marketing language ("best", "ultimate", "miracle"); outcome-specific descriptions used throughout
- No supplement names invented — all map to entries in `data.js` (verified via `n:'…'` slug derivation)
- Pregnancy/breastfeeding cautions present on all three pages
- All interactions sections include the relevant prescription-drug categories (anticoagulants, antihypertensives, SSRIs/serotonergics, thyroid medication, lithium, immunosuppressants as applicable)
