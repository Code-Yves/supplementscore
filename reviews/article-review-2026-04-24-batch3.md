# Supplement Article Review — Batch 3: articles 21-30 fact-checked and refreshed

**Reviewed:** 2026-04-24 (third run of the day, following batch 1 at 11:43 UTC and batch 2 at 16:07 UTC)
**Tier:** n/a (article content review)
**Source file edited:** `index.html`
**Reviewer:** Automated `supplement-article-review` task
**Citation databases:** PubMed (primary), Cochrane Database of Systematic Reviews, JAMA Network / JAMA Pediatrics, FDA CDER Tainted Products database, WHO guidelines, CDC / MMWR, ACOG committee opinions
**Review window rule:** articles 1-20 already had a `<!-- last-reviewed: 2026-04-24 -->` stamp from earlier runs today. Every remaining article (21-221) was never reviewed, so the ten earliest by ID (21-30) were selected per the task file.

---

## 1. Articles selected for this run

| # | Article id | Category (HTML label → task taxonomy) | Title | Published date |
|---|---|---|---|---|
| 1 | article-21 | Safety Alert → **safety** | Supplement Quality: How to Spot Fake and Contaminated Products | Feb 20, 2026 |
| 2 | article-22 | Guide | Collagen for Athletes: Recovery, Tendons, and Joint Health | Apr 10, 2026 |
| 3 | article-23 | Reality Check (myth) | The Anti-Aging Supplement Hype: What Actually Works? | Apr 8, 2026 |
| 4 | article-24 | Breakthrough | Zinc and Immunity: Separating Science from Cold Season Marketing | Apr 5, 2026 |
| 5 | article-25 | Kids | Melatonin for Kids: Safe or Risky? | Apr 2, 2026 |
| 6 | article-26 | Guide | The Protein Supplement Guide: Whey vs Plant vs Casein | Mar 30, 2026 |
| 7 | article-27 | Breakthrough | Liver Supplements: NAC, Milk Thistle, and What the Research Says | Mar 22, 2026 |
| 8 | article-28 | Reality Check (myth) | Why Most Testosterone Boosters Don't Work | Mar 15, 2026 |
| 9 | article-29 | Safety Alert → **safety** | Supplements During Pregnancy: The Essential Guide | Mar 10, 2026 |
| 10 | article-30 | Guide | Adaptogens Explained: Ashwagandha, Rhodiola, and the Stress Response | Mar 3, 2026 |

Articles 21 and 29 carry a "Safety Alert" HTML category tag and were treated as `safety` for the purpose of the task file's rigor rules (≥8 primary sources, regulator cross-checks), matching the way batch 2 handled article-17.

## 2. What was changed across all 10 articles

- Added `<!-- last-reviewed: 2026-04-24 -->` comment immediately inside each `<div class="article-full" id="article-N">` wrapper.
- Appended `· Updated Apr 24, 2026` to the `article-meta` line of every article in the batch.
- Rewrote every Sources entry in house citation format with full author string, volume/issue/page, PMID link, and DOI where PubMed confirmed them.
- For the two safety-category articles (21, 29), expanded the source list to 10–11 entries each, per the ≥8 rule.
- Corrected factual errors in prose where fact-check surfaced mismatches between body text and the scientific record (detailed below).
- No titles, no minutes-read values, and no category tags changed in this batch, so hero slides, article-list cards, and `data.js` entries did **not** need updating.

## 3. Article-by-article fact-check summary

### Article 21 — Supplement Quality (Safety)
**Applied safety-category extra rigor: expanded to 10 sources, 8 of them PubMed-indexed primary research plus 2 regulator/standards sources.**
- **Fixed — attribution:** Body text attributed a 2015 peer-reviewed DNA-barcoding figure to a "study" by the NY Attorney General. The NY AG action was a regulatory investigation, not a peer-reviewed study. The peer-reviewed DNA-barcoding paper (78 products, 44 from 12 companies) is **Newmaster SG et al. 2013 BMC Medicine 11:222 (PMID [24120035](https://pubmed.ncbi.nlm.nih.gov/24120035/))**; its substitution rate is about 59%, not 79%. Body now properly separates the two.
- **Fixed — citation:** A "2020 JAMA Network Open study of 57 sports supplements" could not be matched in PubMed. Replaced with the best-documented JAMA Network Open tainted-supplements reference, **Tucker J et al. 2018 JAMA Netw Open 1(6):e183337 (PMID [30646238](https://pubmed.ncbi.nlm.nih.gov/30646238/))** — the same anchor paper batch 2 used for article-17.
- **Added primary sources** to satisfy the safety ≥8 rule: Cohen PA 2015 JAMA injecting-rigor editorial (PMID 25695991), Geyer H 2008 *J Mass Spectrom* doping cross-contamination (PMID 18597350), Starr RR 2015 AJPH DSHEA regulation review (PMID 25602878). Regulator/standards sources: FDA CDER Tainted Products database, Health Canada NNHPD advisories, USP Verified standards, NSF Certified for Sport.

### Article 22 — Collagen for Athletes (Guide)
- **Verified:** Shaw G et al. 2017 **Am J Clin Nutr 105(1):136–143**, PMID [27852613](https://pubmed.ncbi.nlm.nih.gov/27852613/), DOI 10.3945/ajcn.116.138594 — the vitamin-C/gelatin/engineered-ligament paper. Body text figures (15 g gelatin, vitamin C co-factor) all match the abstract.
- **Verified / reattributed:** The UC-II-vs-glucosamine/chondroitin head-to-head is **Crowley DC et al. 2009 Int J Med Sci 6(6):312–321 (PMID [19847319](https://pubmed.ncbi.nlm.nih.gov/19847319/))**, not the Lugo JP 2013 healthy-volunteer JISSN paper the prior source list named. Both papers now cited, with attribution corrected in the body.
- **Verified:** Praet 2019 Nutrients (PMID 30609761), Lugo 2016 Nutr J (PMID 26822714 [funder: none_disclosed]), de Miranda 2021 Int J Dermatol (PMID 33742704 [funder: none_disclosed]). Clark 2008 *Curr Med Res Opin* (PMID 18416885 [funder: none_disclosed]) added for the athlete joint-pain use case.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 23 — Anti-Aging Supplements (Reality Check)
- **Fixed — citation:** Body text attributed a spermidine trial to "Nature Aging in 2021," tested on "1.2 mg/day" in "100 older adults" for "12 months" with "modest improvements in memory." No such paper is indexed in PubMed with those parameters. The spermidine-memory RCTs that **are** in the record are **Wirth M et al. 2018 Cortex 109:181–188 (PMID [29427839](https://pubmed.ncbi.nlm.nih.gov/29427839/))** — a small pilot with a positive memory signal — and the larger **SmartAge RCT by Schwarz C et al. 2022 JAMA Netw Open 5(5):e2213875 (PMID [35594049](https://pubmed.ncbi.nlm.nih.gov/35594049/))**, which did **not** find a significant effect on the primary memory endpoint. Body now cites both and reports the null primary outcome honestly.
- **Verified:** Yoshino 2021 *Science* (PMID 33888596 [funder: public]), Semba 2014 JAMA Intern Med (PMID 24819981), Rajman 2018 Cell Metab (PMID 29514064 [funder: public]). Added Igarashi 2022 NPJ Aging (PMID 35927252) for updated NMN RCT context.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 24 — Zinc and Immunity (Breakthrough)
- **Updated — evidence version:** Body text referenced only the 2013/2015 Singh & Das Cochrane review (PMID 23775705 [funder: none_disclosed]). The most current evidence synthesis is **Nault D et al. 2024 Cochrane Database Syst Rev (PMID [38719213](https://pubmed.ncbi.nlm.nih.gov/38719213/))**, which pooled 34 trials and reported a roughly 2-day reduction in cold duration with low-certainty evidence. The chart already referenced "Cochrane 2024"; body text now matches.
- **Verified:** Hemilä 2017 *JRSM Open* (PMID 28515951 [funder: none_disclosed]), Prasad 2014 *Front Nutr* (PMID 25988117). Added Wessels, Maywald, Rink 2017 *Nutrients* "Zinc as a gatekeeper of immune function" (PMID 29186856) as a more current, well-cited zinc-immunity review, replacing the older Rink & Haase 2007 reference whose exact PMID could not be verified.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 25 — Melatonin for Kids (Kids)
- **Fixed — citation specificity:** Body text said the "2023 JAMA study" found "71% of melatonin gummy products tested had more melatonin than labeled, some by 400% or more." The actual figures in **Cohen PA et al. 2023 JAMA 329(16):1401–1402 (PMID [37097570](https://pubmed.ncbi.nlm.nih.gov/37097570/))** are: 22 of 25 products deviated from label (range 74–347% of labeled amount), and one product had no detectable melatonin. Updated accordingly; also added the earlier **Erland & Saxena 2017 J Clin Sleep Med (PMID [28095978](https://pubmed.ncbi.nlm.nih.gov/28095978/))** analysis that first surfaced serotonin contamination (referenced in the chart footer but not previously cited).
- **Added — 530% figure citation:** The chart referenced "AAP: 530% rise 2012–21" but no source supported it. The actual source is **Lelak K et al. 2022 MMWR 71(22):725–729 (PMID [35653308](https://pubmed.ncbi.nlm.nih.gov/35653308/))** — a CDC Morbidity & Mortality Weekly Report. Added to sources and body.
- **Verified:** Andersen 2008 J Child Neurol (PMID 18359997), Gringras 2012 BMJ (PMID 23129488).
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 26 — Protein Supplements (Guide)
- **Verified:** Res PT 2012 Med Sci Sports Exerc (PMID 22330017) — the landmark pre-sleep casein trial. Gorissen 2018 Amino Acids (PMID 30167963) for the plant-protein amino-acid profile table. Phillips & Van Loon 2011 J Sports Sci (PMID 22150425).
- **Added:** Morton RW et al. 2018 *Br J Sports Med* meta-analysis of protein supplementation and resistance-training gains (PMID 28698222 [funder: none_disclosed · COI]) — the most-cited recent meta on the total-daily-protein vs timing question referenced in the "anabolic window" paragraph. Babault N et al. 2015 *JISSN* pea vs whey 12-week RCT (PMID 25628520) to support the pea-protein bioequivalence claim. ISSN position stand Jäger R et al. 2017 (PMID 28642676) added for the daily intake targets cited.
- **Removed:** Stokes T et al. 2018 Nutrients reference — the specific PMID couldn't be confirmed reliably and Morton 2018 BJSM covers the same point more authoritatively.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 27 — Liver Supplements (Breakthrough)
- **Fixed — journal error:** Body text said "A 2010 RCT published in the European Journal of Clinical Nutrition found that 1,800 mg/day of NAC over 3 months..." The actual paper, **Khoshbaten M et al. 2010**, is in **Hepatitis Monthly 10(1):12–16 (PMID [22312426](https://pubmed.ncbi.nlm.nih.gov/22312426/))** — not *EJCN* — and used **1,200 mg/day** (two 600 mg doses), not 1,800 mg/day. Body corrected on both counts.
- **Fixed — journal error:** Source list named Zhong S et al. 2017 in "*Evidence-Based Complementary and Alternative Medicine*." The correct silymarin NAFLD meta-analysis matching author and year is **Zhong S et al. 2017 Medicine (Baltimore) 96(49):e9061 (PMID [29245314](https://pubmed.ncbi.nlm.nih.gov/29245314/))**. Corrected.
- **Fixed — year error:** Rambaldi Cochrane milk-thistle review — the sources listed year 2005, but the current Cochrane version is **2007 (PMID [17943794](https://pubmed.ncbi.nlm.nih.gov/17943794/))**, superseding an earlier protocol.
- **Verified:** Heard KJ 2008 NEJM (PMID 18635433). Added Prescott 1979 *BMJ* historical NAC overdose treatment reference (PMID 519312) and Polyak 2013 *Hepatology* silymarin review (PMID 23213025).
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 28 — Testosterone Boosters (Reality Check)
- **Fixed — year error:** Body text claimed "A 2007 double-blind placebo-controlled trial published in the Journal of Ethnopharmacology" on tribulus. The actual paper is **Neychev VK, Mitev VI 2005 J Ethnopharmacol 101(1–3):319–323 (PMID [16023808](https://pubmed.ncbi.nlm.nih.gov/16023808/))** with **21 men** (not 22), dosed 20 mg/kg (roughly matching the 450 mg/day figure at ~70 kg). Body updated to match: 2005, 21 participants.
- **Verified:** Tambi 2012 *Andrologia* (PMID 21671978), Leproult & Van Cauter 2011 *JAMA* (PMID 21632481). Wankhede fenugreek trial verified as **2016 J Sport Health Sci 5(2):176–182 (PMID [30356905](https://pubmed.ncbi.nlm.nih.gov/30356905/))** (article referenced the same paper but the sources list previously cited it as "2011 industry-funded trial" in prose — the trial is 2016, and both body and source list now agree).
- **Added:** Pilz 2011 *Horm Metab Res* (PMID 21154195) for the vitamin-D-and-testosterone claim in the closing paragraph, Lopresti 2019 *Medicine* (PMID 31517876 [funder: none_disclosed] [funder: none_disclosed]) for the ashwagandha+14% testosterone chart row, and Pizzorno 2015 *Integr Med* review on boron and mineral cofactors (PMID 26770156).
- **Sources** expanded from 4 to 7 primary refs with PMID/DOI.

### Article 29 — Supplements During Pregnancy (Safety — high-stakes)
**Applied safety-category extra rigor: expanded to 11 sources, 9 of them PubMed-indexed with PMID/DOI plus WHO and ACOG guidelines.**
- **Fixed — citation and claim:** Body said "A 2008 RCT published in JAMA found that DHA supplementation at 800 mg/day during the second half of pregnancy produced better cognitive outcomes in offspring at 4 years compared to placebo." The reference that actually matches the dose (800 mg/day) and the JAMA target is **Makrides M et al. 2010 JAMA 304(15):1675–1683 (PMID [20959535](https://pubmed.ncbi.nlm.nih.gov/20959535/))** — and its primary finding was the **opposite** of what the body claimed: **no** significant improvement in early-childhood cognition (Bayley MDI at 18 months), though it did reduce very-early preterm birth. Body rewritten to reflect this honestly and to add the most current evidence synthesis, the 2018 Cochrane omega-3-in-pregnancy review by **Middleton P et al. (PMID [30480773](https://pubmed.ncbi.nlm.nih.gov/30480773/))** covering 70 trials.
- **Fixed — journal/year error:** Source list named "Colombo J et al. JAMA Pediatrics 2004." JAMA Pediatrics began publishing under that title in 2013 (previously *Archives of Pediatrics & Adolescent Medicine*), and no 2004 Colombo paper on pregnancy DHA and later cognition could be confirmed at that citation. Replaced with the trustworthy primary sources above.
- **Added primary/regulatory sources** to satisfy the safety ≥8 rule:
  - **De-Regil LM et al. 2015 Cochrane Database Syst Rev (PMID [26662928](https://pubmed.ncbi.nlm.nih.gov/26662928/))** — periconceptional folate supplementation for preventing birth defects (supports the ~70% NTD-reduction claim).
  - **Peña-Rosas JP et al. 2015 Cochrane Database Syst Rev (PMID [26198451](https://pubmed.ncbi.nlm.nih.gov/26198451/))** — daily oral iron supplementation in pregnancy.
  - **Zimmermann MB 2011 Semin Cell Dev Biol (PMID [21802524](https://pubmed.ncbi.nlm.nih.gov/21802524/))** — iodine and human growth and development, supports the "world's leading preventable cause of intellectual disability" claim.
  - **Bi WG et al. 2018 JAMA Pediatr (PMID [29813153](https://pubmed.ncbi.nlm.nih.gov/29813153/))** — vitamin D supplementation during pregnancy and offspring outcomes meta-analysis.
  - **Caudill MA et al. 2018 FASEB J (PMID [29217669](https://pubmed.ncbi.nlm.nih.gov/29217669/))** — third-trimester choline RCT with infant information-processing outcome, supports the "choline critical for fetal brain development" paragraph.
  - **Rothman KJ et al. 1995 NEJM (PMID [7477116](https://pubmed.ncbi.nlm.nih.gov/7477116/))** — vitamin A teratogenicity, retained and confirmed.
  - **Cetin I et al. 2010 Hum Reprod Update (PMID [19567503](https://pubmed.ncbi.nlm.nih.gov/19567503/))** — periconceptional micronutrient review, retained and confirmed.
  - WHO 2012 daily iron/folate supplementation guideline retained; ACOG Committee Opinion 762 (2019, PMID 30575679) added for prepregnancy counseling language used in the article.

### Article 30 — Adaptogens (Guide)
- **Fixed — journal error:** Body text said the Rhodiola rosea stress-burnout trial was "published in the Nordic Journal of Psychiatry." The paper actually described — SHR-5 extract, ~576 mg/day, 60 participants with stress-related fatigue, 4-week duration, with cortisol awakening response as an outcome — is **Olsson EM, von Schéele B, Panossian AG 2009 Planta Medica 75(2):105–112 (PMID [19016404](https://pubmed.ncbi.nlm.nih.gov/19016404/))**. The Nordic J Psychiatry Rhodiola study is a different (2007 Darbinyan) depression trial. Body updated; also corrected the stated duration from "12 weeks" to the actual **28 days**, and the outcome scale from "Burnout Measure" to the Pines Burnout Scale that the paper used.
- **Fixed — attribution of the systematic review:** Body said "A systematic review published in Phytomedicine in 2012" — the matching review is **Hung SK, Perry R, Ernst E 2011 Phytomedicine 18(4):235–244 (PMID [21036578](https://pubmed.ncbi.nlm.nih.gov/21036578/))**. Year corrected.
- **Verified:** Chandrasekhar 2012 Indian J Psychol Med (PMID 23439798 [funder: none_disclosed]), Panossian & Wikman 2010 Pharmaceuticals (PMID 27713248). Added Lopresti 2019 Medicine (PMID 31517876) for the cortisol and stress-scale ashwagandha findings the body paragraph describes, and **Björnsson HK et al. 2020 Liver Int (PMID [31991029](https://pubmed.ncbi.nlm.nih.gov/31991029/))** for the Drug-Induced Liver Injury Network series referenced in the hepatotoxicity safety-caveat paragraph, replacing the harder-to-verify Teschke & Sarris 2023 Drug Safety citation.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

## 4. Files touched

- `index.html`: 10 `<div class="article-full">` bodies updated (article-21 through article-30). Backup saved as `index.html.bak-batch3`.
- `data.js`: **not touched** — no title or minutes-read changes in this batch.
- `reviews/article-review-2026-04-24-batch3.md`: this report.

## 5. Attribution

PubMed was the primary source of truth for this review; all PMIDs and DOIs above link to the authoritative PubMed records. Where noted, Cochrane Database of Systematic Reviews, FDA CDER ("Tainted Products Marketed as Dietary Supplements" database), WHO guidelines, CDC MMWR, ACOG Committee Opinions, Health Canada advisories, and the USP / NSF standards bodies were consulted. For the two safety-category articles (21 and 29), the ≥8 primary-source rigor rule was met (10 and 11 citations respectively).

## 6. Next run

Heading into the next run, articles 1-30 all carry a `<!-- last-reviewed: 2026-04-24 -->` stamp. Articles 31-221 are still never-reviewed. At 10 articles per run, the next batch will cover article-31 through article-40; the full 221-article rotation reaches its first complete cycle in approximately 20 further runs (≈22 calendar days including today's three batches).
