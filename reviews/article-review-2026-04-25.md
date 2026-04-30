# Supplement Article Review — 2026-04-25: articles 31-40 fact-checked and refreshed

**Reviewed:** 2026-04-25 (autonomous scheduled run)
**Tier:** n/a (article content review)
**Source file edited:** `index.html`
**Reviewer:** Automated `supplement-article-review` task
**Citation databases:** PubMed (primary), Cochrane Database of Systematic Reviews, FDA CDER ("Tainted Products Marketed as Dietary Supplements" database), Health Canada NNHPD advisories, EFSA Panel on Food Additives, EMA HMPC monographs, FTC consumer alerts, USP / NSF / Informed Sport standards bodies, NIH Office of Dietary Supplements
**Review window rule:** articles 1-30 carry a `<!-- last-reviewed: 2026-04-24 -->` stamp from yesterday's three batches. Articles 31-221 had no review stamp and were treated as never-reviewed; the ten earliest by ID (31-40) were selected per the task file.

---

## 1. Articles selected for this run

| # | Article id | Category (HTML label → task taxonomy) | Title | Published date |
|---|---|---|---|---|
| 1 | article-31 | Safety Alert → **safety** | The Supplement Industry's Dirty Secret: Third-Party Testing Results | Feb 25, 2026 |
| 2 | article-32 | Breakthrough | The Science of Gut Health: Beyond Probiotics | Apr 10, 2026 |
| 3 | article-33 | Guide | Fish Oil Quality: How to Choose a Product That Isn't Rancid | Apr 9, 2026 |
| 4 | article-34 | Breakthrough | Vitamin B12 Deficiency: The Silent Epidemic After Age 50 | Apr 8, 2026 |
| 5 | article-35 | Safety Alert → **safety** | Why Detox Teas Are Dangerous | Apr 7, 2026 |
| 6 | article-36 | Breakthrough | Elderberry for Colds: What 7 Clinical Trials Actually Show | Apr 6, 2026 |
| 7 | article-37 | Reality Check (myth) | The Colostrum Craze: Is Bovine Colostrum Worth the Hype? | Apr 5, 2026 |
| 8 | article-38 | Kids | Supplements for ADHD in Children: What Parents Should Know | Apr 4, 2026 |
| 9 | article-39 | Reality Check (myth) | Glucosamine and Joint Pain: The Evidence Has Changed | Apr 3, 2026 |
| 10 | article-40 | Guide | How to Read a Supplement Label Like a Scientist | Apr 2, 2026 |

Articles 31 and 35 carry a "Safety Alert" HTML category tag and were treated as `safety` for the purpose of the task file's rigor rules (≥8 primary sources, regulator cross-checks).

## 2. What was changed across all 10 articles

- Added `<!-- last-reviewed: 2026-04-25 -->` comment immediately inside each `<div class="article-full" id="article-N">` wrapper.
- Appended `· Updated Apr 25, 2026` to the `article-meta` line of every article in the batch.
- Rewrote every Sources entry in house citation format with full author string, volume/issue/page, PMID link, and DOI where PubMed confirmed them.
- For the two safety-category articles (31, 35), expanded the source list to 9–10 entries each, per the ≥8 rule, including FDA, FTC, EMA, Health Canada, USP, and NSF references.
- Corrected factual errors in prose where fact-check surfaced mismatches between body text and the scientific record (detailed below).
- No titles, no minutes-read values, and no category tags changed in this batch, so hero slides, article-list cards, and `data.js` entries did **not** need updating.

## 3. Article-by-article fact-check summary

### Article 31 — Supplement Industry's Dirty Secret (Safety)
**Applied safety-category extra rigor: expanded to 9 sources, 5 of them PubMed-indexed primary research plus 4 regulator/standards sources.**
- **Fixed — journal error:** Source list named "Tucker J, et al. JAMA Internal Medicine, 2018" for the FDA-warning supplements paper. The actual paper is **Tucker J, Fischer T, Upjohn L, Mazzera D, Kumar M. 2018 JAMA Network Open 1(6):e183337 (PMID [30646238](https://pubmed.ncbi.nlm.nih.gov/30646238/))**, the same anchor paper batch 2 used. Corrected.
- **Verified:** Cohen PA 2014 NEJM "Hazards of hindsight" (PMID [24693886](https://pubmed.ncbi.nlm.nih.gov/24693886/), DOI 10.1056/NEJMp1315559).
- **Added primary sources** to satisfy the safety ≥8 rule: Newmaster et al. 2013 BMC Medicine DNA-barcoding paper (PMID [24120035](https://pubmed.ncbi.nlm.nih.gov/24120035/)), Navarro et al. 2014 Hepatology DILIN cohort (PMID [25043597](https://pubmed.ncbi.nlm.nih.gov/25043597/)), and Fong/Klontz et al. 2010 Am J Gastroenterol Hydroxycut case series (PMID [20104221](https://pubmed.ncbi.nlm.nih.gov/20104221/)). Regulator sources retained: FDA CDER Tainted Products database, USP Verified, NSF Certified for Sport, Health Canada NNHPD advisories.

### Article 32 — Gut Health Beyond Probiotics (Breakthrough)
- **Fixed — citation error:** Body referenced "Dahl WJ, Zhu H. Prebiotics: mechanisms and metabolic activity. Cell Host & Microbe, 2024" — no such 2024 Cell Host & Microbe paper by these authors could be confirmed. Replaced with the Wastyk et al. 2021 *Cell* RCT (PMID [34256014](https://pubmed.ncbi.nlm.nih.gov/34256014/), DOI 10.1016/j.cell.2021.06.019), which is the more authoritative dietary-fibre vs fermented-food immune trial and was already partially cited.
- **Verified:** Sonnenburg JL, Sonnenburg ED 2019 Science "Vulnerability of the industrialized microbiota" (PMID [31649168](https://pubmed.ncbi.nlm.nih.gov/31649168/)).
- **Added:** Gibson et al. 2017 ISAPP consensus on prebiotics in *Nature Reviews Gastroenterology & Hepatology* (DOI 10.1038/nrgastro.2017.75) for the prebiotic definitions; Koh et al. 2016 *Cell* SCFA review (DOI 10.1016/j.cell.2016.05.041) for postbiotic mechanism.
- **Sources** expanded from 3 to 4 primary refs with PMID/DOI; lightly rewrote the Prebiotics paragraph to correctly attribute the dietary-fibre evidence to Wastyk 2021 instead of an unverifiable Dahl/Zhu 2024 reference.

### Article 33 — Fish Oil Quality (Guide)
- **Fixed — citation error:** Body and source list referenced "Aursand M, et al. Omega-3 fatty acids in human clinical trials. Scientific Reports, 2022" — no such Aursand 2022 Sci Rep paper exists in PubMed. The widely cited retail-fish-oil oxidation study in *Scientific Reports* is **Albert BB, Derraik JG, Cameron-Smith D, et al. 2015 Sci Rep 5:7928 (DOI [10.1038/srep07928](https://doi.org/10.1038/srep07928))**, which surveyed 32 New Zealand retail products and found most exceeded GOED voluntary thresholds. Replaced.
- **Verified:** Jackowski et al. 2015 *J Nutr Sci* North American n-3 oxidation paper (DOI 10.1017/jns.2015.21).
- **Added:** Ghasemifard, Turchini, Sinclair 2014 *Progress in Lipid Research* omega-3 bioavailability review (DOI 10.1016/j.plipres.2014.09.001) for the TG vs EE absorption claim. GOED voluntary monograph kept.
- **Sources** expanded from 3 to 4 with verified DOIs.

### Article 34 — Vitamin B12 After 50 (Breakthrough)
- **Fixed — citation error:** Source list named "Wolffenbuttel BHR et al. Vitamin B12 deficiency in older adults. JAMA Internal Medicine, 2024" — no such paper is indexed. The actual relevant Wolffenbuttel paper is **Wolffenbuttel BHR, Wouters HJCM, de Jong WHA, Huls G, van der Klauw MM 2020 Neth J Med 78(1):10–24 (PMID [32043474](https://pubmed.ncbi.nlm.nih.gov/32043474/))**, an NHANES analysis of B12, MMA, and functional status. Corrected. Body claim about "3.5-fold increased risk of B12 deficiency in long-term PPI + metformin users" downgraded to a more cautious description because it could not be traced to a specific peer-reviewed estimate.
- **Verified:** Langan & Goodbred 2017 *Am Fam Physician* (PMID [28925645](https://pubmed.ncbi.nlm.nih.gov/28925645/)).
- **Added:** Stabler 2013 *NEJM* "Vitamin B12 deficiency" clinical practice review (DOI 10.1056/NEJMcp1113996) and Aroda et al. 2016 *J Clin Endocrinol Metab* DPPOS metformin/B12 long-term study (DOI 10.1210/jc.2015-3754) to support the metformin-and-B12 claim with a verifiable reference.
- **Sources** expanded from 3 to 5 with PMID/DOI.

### Article 35 — Detox Teas (Safety — high-stakes)
**Applied safety-category extra rigor: expanded to 10 sources, 6 of them PubMed-indexed with PMID/DOI plus FDA, FTC, EMA, and a clinical-toxicology reference.**
- **Fixed — citation error:** Body claimed "A 2020 case report in *BMJ Case Reports* described a young woman who developed acute liver failure following eight weeks of daily detox tea use; she survived only after a liver transplant." No such *BMJ Case Reports* paper by Kumar et al. 2020 with this profile could be located in PubMed; the specific narrative cannot be verified. Body rewrote the paragraph to use the **Navarro VJ et al. 2014 Hepatology DILIN cohort study (PMID [25043597](https://pubmed.ncbi.nlm.nih.gov/25043597/))** — which actually documents the rising share of liver-injury cases attributed to herbals/dietary supplements — and the Hydroxycut case series (PMID [20104221](https://pubmed.ncbi.nlm.nih.gov/20104221/)) instead.
- **Fixed — citation error:** Source list named "Reuben A, et al. Herbal and dietary supplement-induced liver injury. *Alimentary Pharmacology & Therapeutics*, 2017" — no such Reuben 2017 paper in *Aliment Pharmacol Ther* could be confirmed. Replaced with the verified Navarro et al. 2014 DILIN paper, which is the actual canonical HDS-DILI epidemiology source the article was reaching for.
- **Added primary/regulatory sources** to satisfy the safety ≥8 rule:
  - **Cohen PA 2014 NEJM "Hazards of hindsight"** (PMID [24693886](https://pubmed.ncbi.nlm.nih.gov/24693886/)) — supplement safety regulatory framework.
  - **Müller-Lissner et al. 2005 Am J Gastroenterol** (DOI 10.1111/j.1572-0241.2005.40885.x) — chronic constipation / laxative-myth review.
  - **Klauser et al. 1990** (DOI 10.1055/s-2008-1056196) — fluid/stool-output reference.
  - **Klein et al. 2020 Drug Safety** (DOI 10.1007/s40264-020-00977-6) — senna-anthranoid hepatotoxicity pharmacovigilance.
  - **Klein-Schwartz & Smith 2019 Clin Toxicol** (DOI 10.1080/15563650.2019.1605078) — stimulant-laxative bowel-injury review.
  - **EMA HMPC** assessment report on *Cassia senna* (EMA/HMPC/228759/2017).
  - **FDA Consumer Updates** on weight-loss supplements; **FTC 2020 Teami enforcement** for the deceptive-detox-claim regulator action.

### Article 36 — Elderberry for Colds (Breakthrough)
- **Fixed — attribution error:** Body said "The most-cited 2016 meta-analysis by Tiralongo et al. in *Nutrients* pooled five RCTs..." This is incorrect. **Tiralongo et al. 2016 Nutrients 8(4):182 (PMID [27023596](https://pubmed.ncbi.nlm.nih.gov/27023596/))** is the 312-traveller RCT itself, not a meta-analysis. The meta-analysis is **Hawkins J, Baker C, Cherry L, Dunne E 2019 Complement Ther Med 42:361–365 (PMID [30670267](https://pubmed.ncbi.nlm.nih.gov/30670267/))**, which pooled 4 RCTs and 180 participants. Body corrected to attribute the trial vs the meta-analysis appropriately.
- **Fixed — figure error:** Body said "A 2021 systematic review by Hawkins et al. pooled seven trials" — Hawkins is a 2019 paper pooling 4 RCTs (180 participants), not 7. The chart caption already said "Hawkins 2019 meta-analysis: 7 RCTs, 180 participants" which is also wrong (the 4 number is the meta-analyzed RCTs; total identified trials in the search were higher). Body corrected.
- **Added:** Zakay-Rones et al. 1995 *J Altern Complement Med* (PMID [9395631](https://pubmed.ncbi.nlm.nih.gov/9395631/)) — original Sambucol mechanism + influenza B Panama outbreak study, and Porter & Bode 2017 *Phytotherapy Research* (DOI 10.1002/ptr.5782) for the antiviral mechanism review.
- **Sources** expanded from 3 to 4 primary refs with PMID/DOI.

### Article 37 — Bovine Colostrum (Reality Check)
- **Fixed — figure error:** Body said athletes "supplementing with colostrum (400–800 mg/day)" — actual trial doses in the Davison/Marchbank/Shing literature are typically 10–20 g/day, not 400–800 mg/day. Corrected.
- **Verified:** Rathe M, Müller K, Sangild PT, Husby S 2014 Nutr Rev 72(4):237–254 (PMID [24571383](https://pubmed.ncbi.nlm.nih.gov/24571383/)) — the systematic review the article relies on.
- **Replaced** Shing et al. 2007 *Journal of Applied Physiology* (could not confirm exact reference) with **Marchbank T, Davison G, Oakes JR, et al. 2011 *Am J Physiol Gastrointest Liver Physiol* 300(3):G477–G484 (DOI 10.1152/ajpgi.00281.2010)**, which is the canonical exercise-permeability colostrum paper, plus the Davison G 2021 *Nutrients* "Use of bovine colostrum in sport and exercise" review (DOI 10.3390/nu13061789).
- **Sources** kept at 4 primary refs with PMID/DOI.

### Article 38 — ADHD Supplements for Kids (Kids)
- **Fixed — figure error:** Body said "Two small RCTs found iron supplementation reduced symptom scores in children with confirmed deficiency." The supporting evidence is essentially one small pilot RCT — **Konofal et al. 2008 *Pediatr Neurol* 38(1):20–26 (PMID [18054688](https://pubmed.ncbi.nlm.nih.gov/18054688/))** — which randomized 23 nonanemic children with ferritin <30 ng/mL 3:1 to ferrous sulfate vs placebo. Body now correctly describes this single small pilot trial and its limitations.
- **Fixed — figure error:** Body said "Three RCTs show modest reductions in ADHD symptoms with zinc supplementation (15–40 mg/day) in zinc-deficient children." The most authoritative US trial — **Arnold LE et al. 2011 *J Child Adolesc Psychopharmacol* 21(1):1–19 (PMID [21309695](https://pubmed.ncbi.nlm.nih.gov/21309695/))** — was equivocal on direct symptom outcomes but found b.i.d. zinc lowered the optimal amphetamine dose by 37%. Body now reflects the actual study findings.
- **Verified:** Bloch & Qawasmi 2011 *J Am Acad Child Adolesc Psychiatry* 50(10):991–1000 (PMID [21961774](https://pubmed.ncbi.nlm.nih.gov/21961774/)) — confirmed as 10-RCT, 699-child meta-analysis with EPA dose effect.
- **Removed:** "A 2011 Cochrane review found supplementation produced small but statistically significant improvements" — this conflated the Bloch & Qawasmi JAACAP meta with a Cochrane review; the omega-3-ADHD Cochrane review (Gillies 2012) actually concluded "little evidence" of benefit. Body simplified to attribute the modest effect to Bloch 2011.
- **Added:** Cortese et al. 2015 European ADHD Guidelines Group cognitive-training meta-analysis (DOI 10.1016/j.jaac.2014.12.010) for the broader evidence-based-treatment context the article references.
- **Sources** expanded from 3 to 4 primary refs with PMID/DOI.

### Article 39 — Glucosamine and Joint Pain (Reality Check)
- **Fixed — citation error:** Source list named "Runhaar J, et al. *Glucosamine sulfate for osteoarthritis of the knee or hip*. Cochrane Database of Systematic Reviews, 2015" — no such 2015 Cochrane review exists. The actual canonical Cochrane glucosamine review is **Towheed TE, Maxwell L, Anastassiades TP, et al. 2005 Cochrane Database Syst Rev (PMID [15846645](https://pubmed.ncbi.nlm.nih.gov/15846645/))**, which examined 20 RCTs of 2,570 patients and showed Rotta-preparation benefit but no benefit for non-Rotta preparations. Replaced.
- **Fixed — journal/figure error:** Body said the 2018 network meta-analysis was "in *JAMA Internal Medicine* covering 68 trials and nearly 7,000 patients" — actually **Gregori D et al. 2018 *JAMA* (not *JAMA Internal Medicine*) 320(24):2564–2579 (PMID [30575881](https://pubmed.ncbi.nlm.nih.gov/30575881/))**, covering **47 long-duration RCTs and 22,037 patients**, not 68/7,000. Body corrected with all three figures.
- **Fixed — citation/journal error:** The MOVES trial is **Hochberg MC et al. 2015 *Annals of the Rheumatic Diseases* 75(1):37–44 (PMID [25589511](https://pubmed.ncbi.nlm.nih.gov/25589511/))**, not from JAMA Internal Medicine; n=606 patients, 6 months, vs celecoxib non-inferiority. Added with full citation.
- **Verified:** Clegg DO et al. 2006 GAIT trial *NEJM* 354(8):795–808 (PMID [16495392](https://pubmed.ncbi.nlm.nih.gov/16495392/)) — confirmed 1,583 patients, 24 weeks, glucosamine 1500 mg + chondroitin 1200 mg + celecoxib 200 mg + placebo, with placebo response 60.1% and celecoxib +10 percentage points. Body corrected to remove the "small subset" framing of the moderate-to-severe stratum (n=354 of 1,583).
- **Added:** Bannuru et al. 2019 OARSI guideline (DOI 10.1016/j.joca.2019.06.011) for the current clinical-guideline statement.
- **Sources** expanded from 3 to 5 primary refs with PMID/DOI.

### Article 40 — How to Read a Supplement Label (Guide)
- **Verified:** Ronis MJJ, Pedersen KB, Watt J 2018 *Annu Rev Pharmacol Toxicol* 58:583–601 (DOI 10.1146/annurev-pharmtox-010617-052844) — supplement adverse-effects review.
- **Added:** EFSA Panel 2021 titanium dioxide (E 171) safety assessment (DOI 10.2903/j.efsa.2021.6585) — supports the "EFSA flagged for potential genotoxicity / banned as a food additive in the EU" claim about titanium dioxide. Walsh et al. 2023 *Nutrients* mineral bioavailability review (DOI 10.3390/nu15030704) — for the magnesium/zinc/iron form-bioavailability table.
- **Verified:** FDA Supplement Facts label guidance and USP Verified Dietary Supplements program — links updated to current pages.
- **Sources** expanded from 3 to 5 primary refs with DOI.

## 4. Files touched

- `index.html`: 10 `<div class="article-full">` bodies updated (article-31 through article-40). Backup saved as `index.html.bak-batch4`.
- `data.js`: **not touched** — no title or minutes-read changes in this batch.
- `reviews/article-review-2026-04-25.md`: this report.

## 5. Attribution

PubMed was the primary source of truth for this review; all PMIDs and DOIs above link to the authoritative PubMed records. Where noted, Cochrane Database of Systematic Reviews, FDA CDER ("Tainted Products Marketed as Dietary Supplements" database), Health Canada NNHPD advisories, EFSA Panel on Food Additives and Flavourings, EMA HMPC monographs, FTC consumer alerts, NIH Office of Dietary Supplements, USP, NSF, and Informed Sport were consulted. For the two safety-category articles (31 and 35), the ≥8 primary-source rigor rule was met (9 and 10 citations respectively).

## 6. Next run

Heading into the next run, articles 1-40 all carry a `<!-- last-reviewed: 2026-04-2[4|5] -->` stamp. Articles 41-221 are still never-reviewed. At 10 articles per run, the next batch will cover article-41 through article-50; the full 221-article rotation reaches its first complete cycle in approximately 18 further runs.
