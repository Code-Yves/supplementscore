# Supplement Article Review — 2026-04-25 (batch 2): articles 41–50 fact-checked and refreshed

**Reviewed:** 2026-04-25 (autonomous scheduled run, second batch of the day)
**Tier:** n/a (article content review)
**Source file edited:** `index.html`
**Reviewer:** Automated `supplement-article-review` task
**Citation databases:** PubMed (primary), Cochrane Database of Systematic Reviews, FDA CDER ("Tainted Products Marketed as Dietary Supplements" database) and FDA Center for Food Safety and Applied Nutrition (CAERS), EFSA Panel on Food Additives and Nutrient Sources, EMA HMPC monographs, Health Canada NNHPD advisories, Institute of Medicine / National Academies DRIs, NIH Office of Dietary Supplements, American Academy of Pediatrics, Endocrine Society
**Review window rule:** articles 1–40 carry `<!-- last-reviewed: 2026-04-2[4|5] -->` stamps from prior runs; articles 41–221 had no review stamp and were treated as never-reviewed; the ten earliest by ID (41–50) were selected per the task file.

---

## 1. Articles selected for this run

| # | Article id | Category (HTML label → task taxonomy) | Title | Published date |
|---|---|---|---|---|
| 1 | article-41 | Safety Alert → **safety** | Pre-Workout Supplements: Hidden Stimulants and Heart Risks | Apr 1, 2026 |
| 2 | article-42 | Reality Check (myth) | Spermidine and Longevity: Promising or Premature? | Mar 31, 2026 |
| 3 | article-43 | Kids | Vitamin D for Kids: Dosing, Deficiency, and When to Test | Mar 30, 2026 |
| 4 | article-44 | Reality Check (myth) | The Truth About Alkaline Water and pH Supplements | Mar 28, 2026 |
| 5 | article-45 | Breakthrough | Magnesium for Anxiety: What the Clinical Trials Show | Mar 26, 2026 |
| 6 | article-46 | Safety Alert → **safety** | Herbal Supplements and Liver Damage: A Growing Concern | Mar 24, 2026 |
| 7 | article-47 | Reality Check (myth) | Sea Moss: TikTok Superfood or Thyroid Risk? | Mar 22, 2026 |
| 8 | article-48 | Kids | Building Strong Bones in Children: Calcium, D3, and Beyond | Mar 20, 2026 |
| 9 | article-49 | Guide | CoQ10 and Statins: Why Your Cardiologist Should Know | Mar 18, 2026 |
| 10 | article-50 | Reality Check (myth) | The Resveratrol Disappointment: A Decade of Failed Promises | Mar 15, 2026 |

Articles 41 and 46 carry a "Safety Alert" HTML category tag and were treated as `safety` for the purpose of the task file's rigor rules (≥8 primary sources, regulator cross-checks).

## 2. What was changed across all 10 articles

- Added `<!-- last-reviewed: 2026-04-25 -->` comment immediately inside each `<div class="article-full" id="article-N">` wrapper.
- Appended `· Updated Apr 25, 2026` to the `article-meta` line of every article in the batch.
- Rewrote every Sources entry in house citation format with full author string, volume/issue/page, and PMID and/or DOI links where PubMed/CrossRef confirmed them.
- Added a "Reviewed against N peer-reviewed sources" footer line under the Sources list of each article in the batch (matching the pattern established by the Apr-25 batch 1 run).
- For the two safety-category articles (41, 46), expanded the source list to 9 entries each, per the ≥8 rule, including FDA, FDA Federal Register rulemaking, EFSA, EMA HMPC, Health Canada and DILIN-network references.
- Lightly rewrote prose for clarity (Grade 8–9 reading level, plainer sentences, jargon defined on first use). Kept structure, voice, and section headings unchanged.
- Corrected factual errors in prose where fact-check surfaced mismatches between body text and the scientific record (detailed below).
- No titles, no minutes-read values, and no category tags changed in this batch, so hero slides, article-list cards, and `data.js` entries did **not** need updating.
- Pre-existing `data.js`/hero/card minutes-read inconsistencies for article-42 (data.js m=7, hero "7 min", card 6 min, body 6 min) and article-50 (data.js m=7, body 6 min, card 6 min) were noticed during review but **not** changed — touching them would cascade across hero/card/body/data.js without a content reason and is outside the scope of this batch. Flagging for a future cleanup pass.

## 3. Article-by-article fact-check summary

### Article 41 — Pre-Workout Supplements (Safety)
**Applied safety-category extra rigor: expanded to 9 sources, 6 PubMed-indexed primary research/case-series papers plus 3 regulator references.**
- **Fixed — citation/figure error:** Body said "A 2023 analysis in *JAMA Internal Medicine* found 68% of 29 products labeled as DMAA-free contained stimulants not declared on the label." This specific finding could not be verified to a 2023 *JAMA Internal Medicine* paper. The relevant peer-reviewed analyses are Cohen et al. 2018 *Clin Toxicol* (PMID [29115866](https://pubmed.ncbi.nlm.nih.gov/29115866/)) and Cohen et al. 2021 *Clin Toxicol* (PMID [33755516](https://pubmed.ncbi.nlm.nih.gov/33755516/)), which together identify nine prohibited stimulants in pre-workout/weight-loss products. Body rewritten to attribute the finding to Cohen's actual analyses without overstating a single percentage.
- **Fixed — figure error:** Body said "Ephedra was banned in 2004 after being linked to 155 deaths" — actual FDA Federal Register Final Rule from 2004 cites thousands of adverse-event reports and over 100 deaths, not specifically 155. Softened to "more than 100 deaths and thousands of adverse-event reports."
- **Fixed — figure error:** Body said "FDA's adverse event database has received over 8,000 reports related to pre-workout and energy supplements since 2010." This precise count could not be verified in CAERS public extracts. Replaced with a more conservative "thousands of reports" framing.
- **Verified:** Geller et al. 2015 NEJM (PMID [26465985](https://pubmed.ncbi.nlm.nih.gov/26465985/)) — confirmed 23,005 ED visits/year average for supplement adverse events.
- **Added:** Cohen 2014 NEJM (PMID [24693886](https://pubmed.ncbi.nlm.nih.gov/24693886/)) — supplement-safety regulatory framework; Eliason et al. 2012 *Mil Med* (PMID [23397688](https://pubmed.ncbi.nlm.nih.gov/23397688/)) — DMAA active-duty-soldier deaths case series; Trexler et al. 2015 ISSN beta-alanine position stand (PMID [26175657](https://pubmed.ncbi.nlm.nih.gov/26175657/)) — for the "what is safe" dosing claims; FDA 2004 Federal Register final rule on ephedra; FDA DMAA dietary supplements page; FDA CDER Tainted Products database.
- **Sources** expanded from 3 to 9 with PMID/DOI.

### Article 42 — Spermidine and Longevity (Reality Check)
- **Fixed — citation error:** Body cited "Wirth M, et al. 'Spermidine supplementation in older adults with memory complaints (MEMO trial).' *GeroScience*, 2021" — the 2021 *GeroScience* MEMO Wirth paper could not be verified at that exact citation. The actual canonical RCT in this space is **Schwarz, Wirth et al. 2022 *JAMA Network Open* 5(5):e2213875 (PMID [35616939](https://pubmed.ncbi.nlm.nih.gov/35616939/))** — the SmartAge trial (n=100, 12 months) — which reported that the pre-specified mnemonic-discrimination outcome did not differ between groups. Body rewritten to correctly describe the SmartAge result rather than implying a positive primary outcome.
- **Fixed — figure error:** Body said the trial used "1.2 mg/day of spermidine from wheat germ extract" — SmartAge actually administered ~0.9 mg/day of spermidine (3 capsules of a wheat-germ extract). Corrected.
- **Fixed — figure error:** Body said the Kiechl 2018 cohort showed "a 40% reduction in all-cause mortality." The Bruneck cohort hazard ratios across spermidine intake tertiles in Kiechl 2018 are HR ~0.59 for high vs low intake, which is roughly a 40% lower hazard, not a 40% reduction in mortality outright. Phrased more cautiously as "hazard ratios near 0.6 in the highest intake tertile."
- **Verified:** Kiechl et al. 2018 AJCN (PMID [29955838](https://pubmed.ncbi.nlm.nih.gov/29955838/)).
- **Added:** Eisenberg et al. 2016 *Nat Med* mouse cardiac/lifespan paper (PMID [27841876](https://pubmed.ncbi.nlm.nih.gov/27841876/)); Madeo et al. 2018 *Science* review (PMID [29371440](https://pubmed.ncbi.nlm.nih.gov/29371440/)); Madeo et al. 2019 *Autophagy* anti-aging-vitamin perspective (PMID [30306826](https://pubmed.ncbi.nlm.nih.gov/30306826/)).
- **Sources** expanded from 3 to 5 with PMID/DOI.

### Article 43 — Vitamin D for Kids (Kids)
- **Fixed — citation error:** Source list named "AAP Committee on Nutrition. 'Prevention of Rickets and Vitamin D Deficiency in Infants, Children, and Adolescents.' *Pediatrics*, 2022." The canonical AAP statement on this topic is **Wagner & Greer 2008 *Pediatrics* 122(5):1142–52 (PMID [18977996](https://pubmed.ncbi.nlm.nih.gov/18977996/))**, since reaffirmed; no new 2022 AAP rickets-prevention clinical report was identified in PubMed at the cited journal. Replaced.
- **Fixed — figure error:** Body said "breast milk contains only 25–35 IU of vitamin D per liter" — published estimates of vitamin D content in unfortified breast milk range much more widely, typically 15–50 IU/L (depending on maternal status). Adjusted to that range.
- **Fixed — figure error:** Body said "A 2024 CDC analysis found that 15% of US children aged 1–11 had vitamin D insufficiency, with rates exceeding 30% in Black and Hispanic children." This precise statistic could not be confirmed against the CDC NCHS biochemical-indicators report. Phrased more conservatively as "roughly 1 in 5 US children and adolescents are at risk of vitamin D inadequacy (serum 25-OH-D below 50 nmol/L)" with a higher risk in Black and Hispanic children, with a CDC NCHS biochemical-indicators citation.
- **Fixed — figure error:** Body said "the target range for 25-OH-D in children is 30–50 ng/mL." Endocrine Society and AAP guidance treat 25-OH-D ≥50 nmol/L (≥20 ng/mL) as adequate for bone health in healthy children; 30 ng/mL is at the upper end of the Endocrine Society sufficiency definition for high-risk groups. Phrased to reflect both thresholds.
- **Verified:** Holick et al. 2011 Endocrine Society guideline (PMID [21646368](https://pubmed.ncbi.nlm.nih.gov/21646368/)).
- **Added:** Munns et al. 2016 *J Clin Endocrinol Metab* Global Consensus on Nutritional Rickets (PMID [26745253](https://pubmed.ncbi.nlm.nih.gov/26745253/)); IOM 2011 *DRIs for Calcium and Vitamin D* (the source of the upper-intake levels and the 600 IU RDA).
- **Sources** expanded from 3 to 5 with PMID/DOI.

### Article 44 — Alkaline Water and pH Supplements (Reality Check)
- **Fixed — citation error:** Source list named "Vormann J, Goedecke T. 'Acid-Base Homeostasis: Latent Acidosis as a Cause of Chronic Diseases.' *Schweizerische Zeitschrift fur GanzheitsMedizin*, 2006." This title and journal could not be verified in PubMed; the journal is not PubMed-indexed and the underlying "latent acidosis" hypothesis itself is contested. Removed.
- **Verified:** Fenton & Huang 2016 *BMJ Open* (PMID [27297014](https://pubmed.ncbi.nlm.nih.gov/27297014/)) and Schwalfenberg 2012 *J Environ Public Health* (PMID [22013455](https://pubmed.ncbi.nlm.nih.gov/22013455/)).
- **Added:** Hamm, Nakhoul, Hering-Smith 2015 *Clin J Am Soc Nephrol* (PMID [26597304](https://pubmed.ncbi.nlm.nih.gov/26597304/)) — canonical acid-base homeostasis review, properly supports the article's central physiology claim. Fenton et al. 2009 *J Bone Miner Res* (PMID [19419322](https://pubmed.ncbi.nlm.nih.gov/19419322/)) — meta-analysis refuting the acid-ash osteoporosis hypothesis.
- **Sources** expanded from 3 to 4 with verified PMID/DOI.

### Article 45 — Magnesium for Anxiety (Breakthrough)
- **Fixed — figure error:** Body said the 2017 Boyle review "identified 18 studies (including six RCTs)" — the actual paper identified 18 studies, but they break down as 8 randomized controlled trials and 10 quasi-experimental designs. Corrected.
- **Fixed — citation error:** Body cited "A 2021 RCT of 126 adults found 248 mg/day of elemental magnesium for 6 weeks produced significant reductions in GAD-7 scores versus placebo (effect size d = 0.41)." This specific 126-adult / 6-week / d=0.41 RCT could not be confirmed in PubMed. The largest, well-cited magnesium-and-stress RCT in this space is **Pouteau et al. 2018 *PLoS ONE* 13(12):e0208454 (PMID [30562392](https://pubmed.ncbi.nlm.nih.gov/30562392/))** — n=264, 8 weeks, ~300 mg/day Mg ± vitamin B6 in mildly stressed adults with low magnesium — which showed greater DASS-42 stress reductions versus placebo. Body rewritten to correctly attribute the canonical evidence.
- **Fixed — claim error:** Body said "Magnesium deficiency affects roughly 48% of Americans based on dietary intake data." This refers to USDA NHANES dietary-intake data showing that a large share of US adults consume less than the EAR for magnesium; the original 48% figure traces back to Rosanoff et al. and earlier USDA reports. Removed the precise figure to avoid overstating an estimate that has shifted with each NHANES cycle.
- **Verified:** Boyle 2017 *Nutrients* (PMID [28445426](https://pubmed.ncbi.nlm.nih.gov/28445426/)); Pickering 2020 *Nutrients* (PMID [33260549](https://pubmed.ncbi.nlm.nih.gov/33260549/)); de Baaij 2015 *Physiol Rev* (PMID [25540137](https://pubmed.ncbi.nlm.nih.gov/25540137/)).
- **Sources** expanded from 3 to 4 with PMID/DOI; trial citation corrected.

### Article 46 — Herbal Supplements and Liver Damage (Safety — high-stakes)
**Applied safety-category extra rigor: expanded to 9 sources, 6 PubMed-indexed primary research/registry papers plus 3 regulator references (FDA, EMA HMPC, Health Canada).**
- **Fixed — citation error:** Source list named "Navarro VJ, et al. 'Liver Injury from Herbals and Dietary Supplements in the U.S. DILIN.' *Hepatology*, 2014" — the 2014 paper is **Navarro et al. 2014 Hepatology 60(4):1399–1408 (PMID [25043597](https://pubmed.ncbi.nlm.nih.gov/25043597/))**, which is a canonical reference and is now cited correctly. Added the **Navarro et al. 2017 *Hepatology* 65(1):363–373 (PMID [27677775](https://pubmed.ncbi.nlm.nih.gov/27677775/))** review which is the actual paper that documents the rise from ~7% to ~20% of DILIN cases attributed to herbal/dietary supplements (the body's central statistic).
- **Fixed — citation error:** Source list named "Serrano JC, et al. 'Green Tea and EGCG-Induced Hepatotoxicity: A Review.' *Food and Chemical Toxicology*, 2023." A 2023 *Food and Chemical Toxicology* review by these authors could not be confirmed. Replaced with the **EFSA 2018 scientific opinion on green tea catechins** (DOI [10.2903/j.efsa.2018.5239](https://doi.org/10.2903/j.efsa.2018.5239)), which is the actual basis for the 800 mg/day-EGCG hepatotoxicity threshold the article reaches for, and **Hoofnagle et al. 2021 *Hepatology* (HLA-B*35:01 and Green Tea-Induced Liver Injury)** (PMID [32892374](https://pubmed.ncbi.nlm.nih.gov/32892374/)) which is the canonical DILIN paper on green-tea-extract DILI.
- **Fixed — figure error:** Body said "high EGCG doses (400–1,000 mg/day or above)" — EFSA's 2018 hepatotoxicity threshold is ≥800 mg/day from supplements; the lower bound was understated. Corrected to "often 700+ mg/day from concentrated extracts."
- **Fixed — figure error:** Body said "By 2023, herbal and dietary supplements accounted for approximately 25% of all DILI cases." A specific 25% by-2023 figure could not be confirmed; DILIN's 2017 update reported ~20% of cases attributed to HDS. Phrased more cautiously as "the share has remained near or above that range, and supplements now sit alongside antibiotics as one of the largest single drug-class causes of severe DILI."
- **Verified:** FDA 2002 kava consumer advisory.
- **Added primary/regulatory sources** to satisfy the safety ≥8 rule:
  - **Teschke et al. 2008 Eur J Gastroenterol Hepatol** (PMID [19279474](https://pubmed.ncbi.nlm.nih.gov/19279474/)) — clinical survey of 26 suspected kava hepatotoxicity cases.
  - **Robles-Diaz et al. 2015 Aliment Pharmacol Ther** (PMID [25394890](https://pubmed.ncbi.nlm.nih.gov/25394890/)) — Spanish DILI Registry analysis of anabolic-steroid-related DILI in young men.
  - **EMA HMPC** assessment report on *Cimicifuga racemosa* (black cohosh) — hepatotoxicity-warning regulatory basis.
  - **Health Canada** 2017 risk-communication update on green tea extract liver-injury labeling.
- **Sources** expanded from 3 to 9 with PMID/DOI.

### Article 47 — Sea Moss (Reality Check)
- **Fixed — citation error:** Source list named "O'Sullivan L, et al. 'Mineral content of Irish seaweeds and their potential for human nutrition.' *Food Chemistry*, 2023" — this exact 2023 paper could not be verified. Removed and replaced with **Rajapakse & Kim 2011 *Adv Food Nutr Res*** (PMID [22054934](https://pubmed.ncbi.nlm.nih.gov/22054934/)) for general seaweed nutrition and **Leung & Braverman 2014 *Nat Rev Endocrinol*** (PMID [24342882](https://pubmed.ncbi.nlm.nih.gov/24342882/)) for the consequences-of-excess-iodine claim.
- **Fixed — figure error:** Body said "A 2023 analysis in *Food Chemistry* found iodine concentrations in commercial sea moss products ranged from 27 to 6,000 mcg per serving — a 200-fold range." That specific paper and statistic could not be verified. Reframed as a directional statement (very wide ranges in published seaweed iodine analyses, with brown seaweeds delivering thousands of mcg/g and red seaweeds typically hundreds of mcg/g but with variation between products).
- **Verified:** Zimmermann & Boelaert 2015 *Lancet Diabetes Endocrinol* (PMID [25591468](https://pubmed.ncbi.nlm.nih.gov/25591468/)) and Teas et al. 2004 *Thyroid* (PMID [15588380](https://pubmed.ncbi.nlm.nih.gov/15588380/)).
- **Added:** IOM 2001 DRI volume that establishes the 1,100 mcg/day adult iodine UL (the body's central dosing claim).
- **Sources** expanded from 3 to 5 with PMID/DOI.

### Article 48 — Strong Bones in Children (Kids)
- **Fixed — figure error:** Body said "Peak bone mass is achieved between ages 25 and 30, and approximately 90% of it is accumulated by late adolescence." The NOF Position Statement (Weaver et al. 2016 *Osteoporos Int*) places peak bone mass in the late teens to mid-20s, with ~90% accumulated by late adolescence. Phrased more cautiously.
- **Fixed — figure error:** Body said "Children who are vitamin D deficient absorb as little as 10–15% of dietary calcium; those who are replete absorb 30–40%." Published vitamin D / calcium absorption ranges in children are less precisely defined than in this assertion; the broader pattern (calcium absorption depends on adequate vitamin D status) is correct. Phrased qualitatively.
- **Fixed — figure error:** Body said "~57% of US adolescents don't meet magnesium RDAs." This specific 57% figure could not be confirmed against current NHANES data (the percentage has fluctuated by survey cycle and intake metric — RDA vs EAR). Phrased qualitatively.
- **Verified:** Golden et al. 2014 *Pediatrics* (PMID [25266429](https://pubmed.ncbi.nlm.nih.gov/25266429/)).
- **Added:** Abrams 2013 *Pediatrics* on enterally-fed preterm infants (PMID [23629620](https://pubmed.ncbi.nlm.nih.gov/23629620/)) — replaces the unverifiable 2017 Abrams *Nutrition Reviews* citation; IOM 2011 *DRIs for Calcium and Vitamin D*; Weaver et al. 2016 *Osteoporos Int* NOF Position Statement (PMID [26856587](https://pubmed.ncbi.nlm.nih.gov/26856587/)) — peak bone mass and lifestyle factors.
- **Sources** expanded from 3 to 5 with PMID/DOI.

### Article 49 — CoQ10 and Statins (Guide)
- **Fixed — citation error:** Body said "the 2015 meta-analysis of 6 trials found CoQ10 significantly reduced myalgia symptoms; a 2018 Cochrane analysis of 12 trials found no significant benefit when higher-quality trials were weighted appropriately." This is reversed and conflates two papers. The actual chronology: **Banach 2015 Mayo Clin Proc** pooled 6 RCTs (n=302) and found *no significant* reduction in muscle pain or CK with CoQ10, while **Qu et al. 2018 *J Am Heart Assoc*** pooled 12 RCTs (n=575) and found *significant* reductions in self-reported myopathy outcomes. Body fully rewritten to correctly attribute each meta-analysis. Note: the 2018 paper is in *JAHA*, not Cochrane.
- **Fixed — figure error:** Body said statin treatment reduces plasma CoQ10 levels by "40–50%." Published RCT data and the Marcoff & Thompson 2007 systematic review give a range closer to 30–50%. Adjusted to "roughly 30–50%."
- **Fixed — figure error:** Body said the Q-SYMBIO trial "confirmed CoQ10's cardiovascular benefits in heart failure patients" — the trial was randomized but the dose and design are worth specifying for the reader: 100 mg three times daily, primary endpoint of major adverse cardiovascular events. Added.
- **Verified:** Mortensen et al. 2014 *JACC HF* (PMID [25282031](https://pubmed.ncbi.nlm.nih.gov/25282031/)); Banach et al. 2015 *Mayo Clin Proc* (PMID [25440725](https://pubmed.ncbi.nlm.nih.gov/25440725/)); Mantle & Hargreaves 2019 *Antioxidants* (PMID [30781472](https://pubmed.ncbi.nlm.nih.gov/30781472/)).
- **Added:** Qu et al. 2018 *JAHA* (PMID [30371340](https://pubmed.ncbi.nlm.nih.gov/30371340/)); Marcoff & Thompson 2007 *JACC* systematic review (PMID [17560286](https://pubmed.ncbi.nlm.nih.gov/17560286/)).
- **Sources** expanded from 3 to 5 with PMID/DOI.

### Article 50 — The Resveratrol Disappointment (Reality Check)
- **Fixed — citation error:** Body said "A 2009 *PLoS Biology* paper found resveratrol's SIRT1 activation in earlier studies was an artifact of the fluorescent protein assay used." The canonical artefact paper is **Pacholec et al. 2010 *J Biol Chem* 285(11):8340–8351 (PMID [20061378](https://pubmed.ncbi.nlm.nih.gov/20061378/))**, not a 2009 *PLoS Biology* paper. Body corrected with the actual reference.
- **Fixed — citation/figure error:** Body said the original Sinclair 2003 paper "extended yeast lifespan by 70%." The original Howitz et al. 2003 *Nature* paper reports a ~70% increase in yeast replicative lifespan in some strains, but this varies by yeast strain and resveratrol concentration. Phrased qualitatively as "extended yeast replicative lifespan."
- **Fixed — figure error:** Body said GSK's Sirtris program "was shut down in 2013." More precisely, GSK folded its standalone Sirtris operations into its main R&D structure in 2013; some sirtuin-activator programs continued for a time. Phrased to reflect that nuance.
- **Fixed — citation error:** Source list previously named "Baur JA, Sinclair DA. 'Therapeutic potential of resveratrol: the in vivo evidence.' *Nature Reviews Drug Discovery*, 2006." This is a real review (DOI 10.1038/nrd2060). However, the more directly relevant paper for the body's high-fat-mouse claim is **Baur et al. 2006 *Nature* 444(7117):337–342 (PMID [17086191](https://pubmed.ncbi.nlm.nih.gov/17086191/))**. Replaced/added.
- **Verified:** Sahebkar 2013 *Nutr Rev* (PMID [24111842](https://pubmed.ncbi.nlm.nih.gov/24111842/)).
- **Added:** Howitz et al. 2003 *Nature* (PMID [12939617](https://pubmed.ncbi.nlm.nih.gov/12939617/)) — original yeast paper; Walle et al. 2004 *Drug Metab Dispos* (PMID [15333514](https://pubmed.ncbi.nlm.nih.gov/15333514/)) — pharmacokinetics paper showing very low resveratrol bioavailability; Berman et al. 2017 *npj Precision Oncology* (PMID [29354782](https://pubmed.ncbi.nlm.nih.gov/29354782/)) — comprehensive clinical-trial review.
- **Removed:** the unverifiable Borra 2005 *Journal of Biological Chemistry* citation framing in favour of the more accurate Pacholec 2010 paper.
- **Sources** expanded from 3 to 6 with PMID/DOI.

## 4. Files touched

- `index.html`: 10 `<div class="article-full">` bodies updated (article-41 through article-50). Backup saved as `index.html.bak-batch5`.
- `data.js`: **not touched** — no title or minutes-read changes in this batch.
- `reviews/article-review-2026-04-25-batch2.md`: this report.

## 5. Attribution

PubMed was the primary source of truth for this review; all PMIDs and DOIs above link to the authoritative PubMed records. Where noted, Cochrane Database of Systematic Reviews, FDA CDER ("Tainted Products Marketed as Dietary Supplements" database), FDA Federal Register, Health Canada NNHPD advisories, EFSA Panel on Food Additives and Nutrient Sources, EMA HMPC monographs, IOM/NAM Dietary Reference Intakes, and NIH Office of Dietary Supplements were consulted. For the two safety-category articles (41 and 46), the ≥8 primary-source rigor rule was met (9 citations each).

## 6. Next run

Heading into the next run, articles 1–50 all carry a `<!-- last-reviewed: 2026-04-2[4|5] -->` stamp. Articles 51–221 are still never-reviewed. At 10 articles per run, the next batch will cover article-51 through article-60; the full 221-article rotation is now ~23% complete on its first pass.

## 7. Open issues / flags for follow-up

- **Cross-surface drift:** `data.js` and the article-list cards diverge from the article body's "min read" line for at least two articles in this batch (article-42: data.js m=7, hero "7 min", body and card "6 min"; article-50: data.js m=7, body and card "6 min"). This pre-existed; a separate cleanup pass would be appropriate to align card/hero/body/data.js without a content change driving it.
- **Hero slide for article-42:** still shows "Updated Apr 6, 2026" but the article body and card have been updated through Apr 25, 2026. The hero slide "Updated [Date]" text is not always synced to the body's "Updated" line; the task file's sync rule applies when title/headline/intro/min-read changes — none changed here, so the hero "Updated" date was left as is. Worth aligning in a future content-sync pass.
