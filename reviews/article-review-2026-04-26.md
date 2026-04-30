# Daily Article Accuracy Review — 2026-04-26

**Reviewer run:** scheduled `supplement-article-review` (autonomous)
**Articles reviewed today:** 10 (IDs 71–80)
**Cumulative coverage:** 80 / 221 articles now have a `last-reviewed` stamp (≈36% of catalog).
**Backups:** `index.html.bak-batch8-20260426`, `data.js.bak-batch8-20260426`

## Selection logic

Per task spec, articles with the oldest `last-reviewed` dates are reviewed first; articles missing the stamp count as "never reviewed" and are oldest. The 10 lowest-numbered never-reviewed articles in document order were selected: **71, 72, 73, 74, 75, 76, 77, 78, 79, 80**. Categories: 2 Guide, 2 Breakthrough, 1 Reality Check (myth), 1 Reality Check (myth), 1 Safety Alert, 1 Reality Check (myth), 1 Kids, 1 Breakthrough, 1 Reality Check (myth), 1 Guide.

One safety-category article (article-75, Contaminated Protein Powders) was reviewed with extra rigor — minimum 8 primary/regulatory sources, FDA, Health Canada, EFSA, USP, NSF, and Clean Label Project's 2018 + 2025 reports cross-checked.

## Summary of changes per article

### article-71 — Fasting and Supplements: What to Take and When to Stop
- **Class:** Guide. Title and minutes-read unchanged (7 min).
- **Edits:** Tightened prose (Grade 8–9). Clarified that creatine monohydrate has been clinically tested and shown not to raise insulin in healthy adults (added Kreider 2017 ISSN position stand). Replaced vague "magnesium glycinate, etc." with cleaner list. Added Templeman 2021 *Sci Transl Med* time-restricted feeding RCT.
- **Sources:** 3 → 5 peer-reviewed (added 2 PMID-citable references; PMIDs added to all).
- **Risk flags:** None new. No safety claims requiring escalation.

### article-72 — Probiotics and Antibiotics: Timing Matters
- **Class:** Breakthrough. Title and minutes-read unchanged (6 min).
- **Edits:** **Corrected key statistic.** Original said "Cochrane meta-analysis of 82 randomized trials and over 11,000 patients found probiotics reduced AAD risk by approximately 42%". The Goldenberg 2017 Cochrane review actually pooled **31 RCTs (8,672 patients)** and found a **~60% reduction in C. difficile-associated diarrhea** (with ~70% reduction in higher-risk subgroups, NNT ≈12). Updated body text to reflect the corrected n, k, and effect size, and to clarify the outcome (CDAD, not all AAD). Updated chart row "4+ hr apart [Hempel 2012 data]" to "Probiotic + abx (Cochrane 2017) [~60% C. diff risk drop]" since the 4-hr cutoff was not from Hempel; chart footnote rewritten to "bacterial probiotics 2+ hours offset" instead of 4+ hours, which matches the bulk of the literature. **Updated C. difficile US burden** from "~450,000 infections" to current CDC estimate (~250,000 hospitalized cases per year, with community-associated cases rising). Suez 2018 *Cell* finding restated more accurately: probiotic group showed delayed/incomplete reconstitution; aFMT recovered within days (the original "five months vs three weeks" was a paraphrase that does not appear verbatim in the paper).
- **Sources:** 3 → 5 (added Guo 2019 pediatric Cochrane and CDC surveillance page). PMIDs added.
- **Risk flags:** Pre-existing inconsistency between data.js (`m:7`) and rendered card (`6 min read`). Not introduced by this review; not corrected because the rewrite did not change minutes — left as-is per spec.

### article-73 — The Best Supplements for Vegetarians and Vegans
- **Class:** Guide. Title and minutes-read unchanged (8 min).
- **Edits:** Removed implication that methylcobalamin is meaningfully better than cyanocobalamin — head-to-head data shows them comparable (some evidence cyanocobalamin maintains levels equally well in vegans). Replaced sentence implying lanolin-based D3 is the only "non-vegan" issue with clearer description: vegan D3 from lichen (not "algae" — original said algae, which is wrong; algae are the source of vegan EPA/DHA, not D3). Tightened ALA→DHA conversion language with Brenna 2009 reference (≤8% to EPA, ≤4% to DHA). Added new section on creatine and choline as evidence-based supplements vegetarians often miss.
- **Sources:** 3 → 6. Added NIH ODS B12 fact sheet, Brenna 2009 PUFA conversion, Burns-Whitmore 2019, Kanter calcium bioavailability. PMIDs added.
- **Risk flags:** None.

### article-74 — Tribulus Terrestris: Zero Evidence for Testosterone
- **Class:** Reality Check (myth). Title and minutes-read unchanged (5 min).
- **Edits:** Replaced original chart row "RCTs: serum T change [12/12 trials, 0/12]" with the more defensible 2025 Camargos *Nutrients* systematic review (10 trials, 483 men, no robust testosterone increase, only 2 studies showed small intra-group changes in hypogonadal men). The "twelve placebo-controlled human trials" framing was a paraphrase that doesn't map to a single published count — replaced with the citable systematic-review summary. Tempered "zero published RCT showing testosterone increase" claim — the 2025 systematic review found 2 studies with low-magnitude positive intra-group changes in hypogonadal subjects, so the absolute "zero" framing in the body was tightened to "no robust evidence." Added Qureshi 2014 systematic review.
- **Sources:** 3 → 5; added Camargos 2025 *Nutrients* (key new evidence) and Qureshi 2014. PMIDs added.
- **Risk flags:** Pre-existing inconsistency between data.js (`m:6`) and rendered card (`5 min read`). Not introduced by this review.

### article-75 — Contaminated Protein Powders: Lead, Arsenic, and BPA  ⚠️ SAFETY CATEGORY
- **Class:** Safety Alert. Title and minutes-read unchanged (7 min).
- **Edits (extra rigor applied):** Validated all original Clean Label Project 2018 numbers against secondary sources (Food Safety News, Nutraceuticals World, Consumer Reports). Numbers held: 70% lead, 74% cadmium, 55% BPA across 134 products. Added the corrected detail that **75% of plant-based products had detectable lead vs ~10% of whey-based products** and **plant-based had ~5× more cadmium than whey on average** — both from the underlying CLP report. Added the **2025 Clean Label Project "Protein Study 2.0"** as a follow-up data point showing the problem persists. Corrected Meharg citation: original cited "Inorganic arsenic levels in rice milk… *Journal of Environmental Monitoring*, 2008" — Meharg's 2008 *Environmental Pollution* "Inorganic arsenic levels in baby rice are of concern" (PMID 18258336 [funder: none_disclosed]) is the more relevant primary source and was substituted. Added new "Special Populations" section flagging pregnant/breastfeeding women and young children with FDA, Health Canada, and EFSA citations.
- **Sources:** 3 → 9 (safety threshold ≥8 met). Added: CLP 2025 follow-up, FDA arsenic risk assessment, Health Canada cadmium document, EFSA lead opinion, USP <2232> elemental impurities, NSF Certified for Sport.
- **Risk flags / cross-checked authorities:** FDA, Health Canada, EFSA, USP, NSF, Clean Label Project, Consumer Reports. Where industry trade groups have disputed CLP methodology, that disagreement is now noted in the body.

### article-76 — Turkey Tail Mushroom: Cancer Claims vs Reality
- **Class:** Reality Check. Title and minutes-read unchanged (6 min).
- **Edits:** Strengthened the PSK adjuvant evidence section by citing the 2017 Oba et al. *Oncotarget* network meta-analysis (23 trials, 10,684 patients) and the 2007 Sakamoto/MAGIC IPD meta-analysis (HR 0.88 for OS in curative gastric resections). Original chart referenced "USDA-funded 2012 study" — the 2012 Torkelson phase 1 trial (n=11) was funded by NIH/NCI through Bastyr, not USDA. Corrected. Clarified that Torkelson 2012 was a small phase 1 dose-escalation safety study not powered for clinical efficacy. Replaced "3 g/day pure PSK" claim with accurate dose statement (Torkelson tested 3, 6, 9 g/day of T. versicolor preparation). Added MSKCC About Herbs as authoritative reference.
- **Sources:** 3 → 6. PMIDs added.
- **Risk flags:** None new. Existing safety statement re: chemotherapy/immunosuppression preserved and slightly broadened.

### article-77 — Omega-3 DHA During Pregnancy: Critical for Brain Development
- **Class:** Kids. Title and minutes-read unchanged (7 min).
- **Edits:** **Updated Cochrane reference details.** Middleton 2018 actually pooled **70 RCTs in 19,927 women** (the original article cited "11 RCTs"). Restated the headline findings: **11% reduction in preterm birth <37 weeks; 42% reduction in early preterm birth <34 weeks**. Added 2021 ADORE trial (Carlson et al., *EClinicalMedicine*) for higher-dose DHA evidence in low-baseline women. Confirmed FDA/EPA "Advice About Eating Fish" current as updated 2024. Added ACOG 2024 endorsement of ≥200 mg DHA/day. Adjusted the WHO recommendation framing: the standard reference is FAO 2010, "200 mg DHA/day during pregnancy and lactation" (often cited as "WHO/FAO"). Clarified the optimum dose finding (500–1,000 mg long-chain omega-3 with ≥500 mg DHA from the Middleton 2018 review).
- **Sources:** 3 → 6. Added ADORE trial, ACOG 2024, FAO 2010. PMIDs added.
- **Risk flags:** None new. Mercury guidance is current.

### article-78 — NAC for Mental Health: OCD, Addiction, and Depression
- **Class:** Breakthrough. Title and minutes-read unchanged (7 min).
- **Edits:** Original cited "*Journal of Clinical Psychiatry*" for Afshar 2012 — Afshar's NAC OCD trial was actually published in *Journal of Clinical Psychopharmacology* (PMID 23026744 [funder: none_disclosed]). Corrected. Added 2024 Hinkle systematic review/meta-analysis in *Frontiers in Psychiatry* (6 RCTs, n=195, with the nuance that 4/5 main adjunctive trials showed Y-BOCS reductions and one 20-week trial did not). Tempered the original framing — the evidence is "promising but not definitive" rather than uniformly "clinically significant." Re-checked Gray 2012 cannabis trial (American Journal of Psychiatry, adolescents, dosing 1,200 mg twice daily). Re-checked Berk 2008 bipolar depression trial (*Biological Psychiatry*, 1,000 mg twice daily, 24 weeks). Updated dosing range to 1,800–3,000 mg/day based on the meta-analytic dose distribution.
- **Sources:** 3 → 5. Added Hinkle 2024 meta-analysis and Deepmala 2015 systematic review. PMIDs added.
- **Risk flags:** Added drug-interaction caveat for blood thinners and nitroglycerin alongside the existing psychiatric-medication note.

### article-79 — The Supplement Industry Greenwashing Problem
- **Class:** Reality Check. Title and minutes-read unchanged (6 min).
- **Edits:** Important historical correction: the chart row originally said "NYSAG DNA barcoding 2015" with the implication "4 of 5 products had none of the labeled herb." The correct figure from the 2015 NY Attorney General investigation (Schneiderman) is **~21% of store-brand herbal supplements contained DNA from the labeled plant** — so roughly 4-of-5 products *failed* DNA matching (close to the original framing, but the chart has been restated as "21% label-matched" for clarity). Added important context: the underlying DNA-barcoding methodology was disputed by the herbal-products industry, and the Newmaster journal paper that originated DNA barcoding for herbal supplements was retracted in 2024. The NYAG agreements with retailers nonetheless remain in effect. Added clarification that "organic" does not mean "low in heavy metals" — Clean Label Project data has repeatedly shown organic protein powders test higher for cadmium and lead.
- **Sources:** 3 → 6. Added direct NY AG press release, USP Verified, NSF, and replaced Roe et al. 2014 *J Food Products Marketing* (which did not exist as cited) with Roe & Sheldon 2007 *AJAE* on credence-good labeling.
- **Risk flags:** None safety-related; historical accuracy correction.

### article-80 — Boswellia vs NSAIDs for Joint Pain
- **Class:** Guide. Title and minutes-read unchanged (7 min).
- **Edits:** Added 2020 Yu et al. *BMC Complementary Medicine and Therapies* systematic review and meta-analysis (7 RCTs, 545 patients) as the strongest current evidence summary, replacing the 2011 Siddiqui overview as the lead citation. Original cited a "2011 systematic review in Phytomedicine" of 5 RCTs — this paraphrase does not match a single specific publication; replaced with the 2020 Yu meta-analysis which is the current gold standard. Replaced the unsourced "valdecoxib comparator" sentence with the Vishal 2024 *Frontiers in Pharmacology* multi-center RCT showing benefit within 5 days. Added 2024 Aflapin sub-group meta-analysis. Cleaned up dosing guidance with specific ranges per product type (100–250 mg AKBA-enriched extract, or 300–400 mg t.i.d. of standardized total extract). Added safety section noting interactions with anticoagulants and CYP3A4-metabolized drugs and the 1–2 week pre-surgical hold.
- **Sources:** 3 → 6. PMIDs added.
- **Risk flags:** Added clinically relevant drug-interaction note.

## Cross-checking and consistency

- All 10 articles now carry `<!-- last-reviewed: 2026-04-26 -->` immediately inside the article-full container.
- All 10 article-meta lines updated to `Apr 11, 2026 · Updated Apr 26, 2026 · X min read`.
- All 10 article-list cards updated from `Updated Apr 11, 2026` to `Updated Apr 26, 2026`.
- All 10 source blocks now end with a `Reviewed against N peer-reviewed sources` line in the existing format.
- No hero slides reference articles 71–80 (verified via `showArticle(N)` search), so no hero updates required.
- No cross-references in other article bodies (verified via `showArticle(N)` count = 1 per article — the card itself).
- No titles changed → no `data.js` ARTICLE_MAP entries needed updates.
- No minutes changed → no `data.js` `m:` values needed updates.
- Pre-existing inconsistencies between `data.js` minutes and rendered card minutes (article-72: data.js `m:7` vs card `6 min read`; article-74: data.js `m:6` vs card `5 min read`) were noted but not corrected, since spec restricts data.js edits to cases where the rewrite changed length. Recommend logging these for a separate cleanup pass.

## Verification

```
Total article-full divs:        221  (unchanged)
Unique IDs:                     221  (unchanged)
Total last-reviewed comments:    80  (was 70; +10 today)
Today's last-reviewed (4-26):    10  (matches selection)
Total article-card divs:        220  (unchanged)
Boundary 70->71:                ok
Boundary 80->81:                ok
<div tag balance:               unchanged from baseline (pre-existing -2)
```

File size grew from 1,731,215 → 1,745,736 bytes (+14.5 KB), consistent with added citations and tightened prose.

## Notes for next run

1. After today's batch, the next 10 articles to review will be **81–90** (still inside the never-reviewed pool).
2. Article-81 ("SARMs: The Illegal Supplements in Your Gym") and article-91 (Colloidal Silver) are safety-category and will both need ≥8 sources, FDA MedWatch and Health Canada cross-checks.
3. Pre-existing data.js / card minutes inconsistencies for articles 72 and 74 should eventually be reconciled — recommend a separate sweep pass rather than mixing into rewrite work.
4. Two 2018 sources used (Suez *Cell*; Clean Label Project) are now >5 years old. Both have been cross-referenced against newer sources (Cochrane 2017 / 2019 updates; CLP 2025 follow-up) and remain the seminal primary references in their respective domains.
