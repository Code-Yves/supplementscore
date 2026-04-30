# Supplement Article Review — 2026-04-25 (batch 3): articles 51–60 fact-checked and refreshed

**Reviewed:** 2026-04-25 (autonomous scheduled run, third batch of the day)
**Tier:** n/a (article content review)
**Source file edited:** `index.html`
**Reviewer:** Automated `supplement-article-review` task
**Citation databases consulted:** PubMed (primary), Cochrane Database of Systematic Reviews, FDA Center for Drug Evaluation and Research ("Tainted Products Marketed as Dietary Supplements" enforcement database), FDA MedWatch, U.K. National Poisons Information Service (DNP), EFSA, EMA HMPC monographs, Health Canada NNHPD advisories, IOM/National Academies DRIs, NIH Office of Dietary Supplements, World Health Organization (ferritin/anemia guideline), American Academy of Pediatrics, International Society of Sports Nutrition, IOC consensus on supplements, NIDDK LiverTox.
**Review window rule:** articles 1–50 carry `<!-- last-reviewed: 2026-04-2[4|5] -->` stamps from prior runs (today's batches 1 and 2 covered 31–50; yesterday's batches covered 1–30); articles 51–221 had no review stamp and were treated as never-reviewed; the ten earliest by ID (51–60) were selected per the task file's "oldest last-reviewed dates" rule.

---

## 1. Articles selected for this run

| # | Article id | Category (HTML label → task taxonomy) | Title | Published date |
|---|---|---|---|---|
| 1 | article-51 | Reality Check (myth) | Activated Charcoal: Why Detox Claims Are Nonsense | Mar 12, 2026 |
| 2 | article-52 | BREAKTHROUGH | Omega-3 and Depression: What 26 Meta-Analyses Found | Apr 11, 2026 |
| 3 | article-53 | GUIDE | The Supplement Stack for Runners | Apr 11, 2026 |
| 4 | article-54 | MYTH-BUSTING | Biotin for Hair Growth: Marketing vs Reality | Apr 11, 2026 |
| 5 | article-55 | SAFETY ALERT → **safety** | Weight Loss Supplements That Actually Kill People | Apr 11, 2026 |
| 6 | article-56 | OVERHYPED (myth) | Tongkat Ali and Testosterone: The Evidence Gap | Apr 11, 2026 |
| 7 | article-57 | KIDS | Iron Supplements for Toddlers: When and How | Apr 11, 2026 |
| 8 | article-58 | SAFETY ALERT → **safety** | Ashwagandha and Thyroid: A Hidden Risk | Apr 11, 2026 |
| 9 | article-59 | BREAKTHROUGH | Creatine for Older Adults: Muscle, Brain, and Bone | Apr 11, 2026 |
| 10 | article-60 | OVERHYPED (myth) | The Ketone Supplement Scam | Apr 11, 2026 |

Articles 55 and 58 carry a "Safety Alert" HTML category tag and were treated as `safety` for the purpose of the task file's rigor rules (≥8 primary sources, regulator cross-checks).

## 2. What was changed across all 10 articles

- Added `<!-- last-reviewed: 2026-04-25 -->` comment immediately inside each `<div class="article-full" id="article-N">` wrapper.
- Appended `· Updated Apr 25, 2026` to the `article-meta` line of every article in the batch.
- Rewrote every Sources entry in the existing house citation format (full author string, journal, volume/issue/page) and added PMID and/or DOI hyperlinks that resolve to PubMed/CrossRef/regulator landing pages.
- Added a "Reviewed against N peer-reviewed sources" footer line under the Sources list of each article in the batch (matching the pattern established by the Apr-25 batch 1 and batch 2 runs).
- For the two safety-category articles (55 and 58), expanded the source list to 9 entries each, per the ≥8 rule, including FDA, U.K./EU pharmacovigilance, AACT/EAPCCT, and NIDDK LiverTox / DILIN-network references.
- Lightly rewrote prose for Grade 8–9 reading level: shorter sentences, plainer language, jargon defined on first use (VO₂ max, BHB, etc.). Kept structure, voice, headings, and chart blocks unchanged.
- Corrected factual errors in prose where fact-check surfaced mismatches between the body text and the scientific record (detailed below).
- No titles, no minutes-read values, and no category tags changed in this batch, so hero slides, article-list cards, and `data.js` entries did **not** need updating. (Article-53 has a hero slide on line 1254; the slide's title and minutes-read remain consistent with the body, so no edit was required there.)

## 3. Article-by-article fact-check summary

### Article 51 — Activated Charcoal (Reality Check)
- **Fixed — citation error:** Source list previously cited "Brooks M. The charcoal craze: a clinical toxicologist's view. Emergency Medicine Journal, 2019." This exact paper could not be verified in PubMed or in the BMJ Emergency Medicine Journal index. Removed.
- **Fixed — citation update:** Body cited "American Academy of Clinical Toxicology. Position Statement: Single-Dose Activated Charcoal. Journal of Toxicology: Clinical Toxicology, 2005." The 2005 update is by Chyka, Seger, Krenzelok, Vale in the renamed journal *Clinical Toxicology* (Phila), 43(2):61–87 (PMID [15822758](https://pubmed.ncbi.nlm.nih.gov/15822758/)). Updated authors and journal name.
- **Fixed — figure/wording:** Body said charcoal has "~1,500 m² surface area per gram" and "1–2 hours of ingestion" repeated as a hard rule. Tightened to "typically 950 to 2,000 m²/g" (the standard published range) and softened to "within about an hour" to match current AACT/EAPCCT and Hoegberg 2021 systematic-review framing.
- **Fixed — claim error:** Body said charcoal toothpaste "damages enamel with daily use; no clinical study supports its whitening claims." Tightened to match the Brooks JK et al. 2017 *JADA* literature review, which concluded there is insufficient clinical evidence to substantiate cosmetic and health claims for charcoal-based dentifrices.
- **Verified:** AACT/EAPCCT 1999 multi-dose position paper (PMID [10584586](https://pubmed.ncbi.nlm.nih.gov/10584586/)); Juurlink 2016 *BJCP* reappraisal (PMID [26409027](https://pubmed.ncbi.nlm.nih.gov/26409027/)); Hoegberg et al. 2021 *Clin Toxicol* systematic review (PMID [34555331](https://pubmed.ncbi.nlm.nih.gov/34555331/)).
- **Sources** expanded from 3 to 5 with verified PMIDs.

### Article 52 — Omega-3 and Depression (Breakthrough)
- **Fixed — figure/framing error:** Body framed Liao 2019 as "an umbrella review — a meta-analysis of meta-analyses — has now synthesized 26 separate meta-analyses." Liao 2019 (*Transl Psychiatry* 9:190; PMID [31383846](https://pubmed.ncbi.nlm.nih.gov/31383846/)) is a meta-analysis of **26 randomized controlled trials**, not 26 meta-analyses. Reframed to describe it correctly as a 26-RCT meta-analysis.
- **Fixed — figure error:** Body said "EPA-dominant supplements produced a standardized mean difference of approximately −0.5 to −0.6 in depression scores." Liao 2019 reports SMD −0.61 for EPA-pure formulations and SMD −0.51 for ≥60% EPA formulations versus placebo, with DHA-pure or DHA-majority products non-significant. Tightened wording to match.
- **Fixed — wording:** "Maximal benefit around 16 weeks" was overconfident; most positive trials are 8–12 weeks. Trimmed.
- **Verified:** Sublette 2011 *J Clin Psychiatry* (PMID [21939614](https://pubmed.ncbi.nlm.nih.gov/21939614/)); Mocking 2016 *Transl Psychiatry* (PMID [26978738](https://pubmed.ncbi.nlm.nih.gov/26978738/)).
- **Added:** Guu et al. 2019 ISNPR Practice Guidelines (PMID [31480057](https://pubmed.ncbi.nlm.nih.gov/31480057/)) as an authoritative consensus document on omega-3 dose, EPA fraction, and clinical use.
- **Sources** expanded from 3 to 4 with PMIDs.

### Article 53 — Supplement Stack for Runners (Guide)
- **Fixed — figure error:** Body said "ferrous sulfate (325mg, 45–65mg elemental iron)" — 325 mg of ferrous sulfate provides ~65 mg of elemental iron; "45–65" was internally inconsistent. Restructured around the Stoffel 2017 absorption finding without restating the misleading range.
- **Fixed — figure error:** Body said "Vitamin D deficiency — present in an estimated 50–70% of athletes in northern latitudes — doubles stress fracture risk. Target serum 25(OH)D above 40 ng/mL. Most runners need 2,000–4,000 IU D3 daily." The 50–70% prevalence and "doubles risk" wording overstated the data; the IOC consensus statement frames vitamin D guidance more cautiously, targets ≥75 nmol/L (30 ng/mL) as sufficient, and supports 1,000–2,000 IU/day for maintenance in deficient adults. Reworded to align with the IOC consensus and to not assert a single doubled-risk multiplier.
- **Fixed — figure error:** Body said "Caffeine at 3–6mg per kilogram of body weight ... improves time-trial performance by 2–4%." Aligned with the ISSN 2021 caffeine position stand (Guest 2021), which cites typical performance gains of ~2–4% in well-controlled endurance trials; kept the figure but cited the position stand.
- **Fixed — figure error:** Body said "ferritin above 50 ng/mL" as the target for endurance performance and named "12–20 ng/mL" as the deficiency cutoff. The clinical literature is divided; many sports-medicine consensus statements (Sim 2019 EJAP narrative review) treat ferritin <30 ng/mL with low transferrin saturation or symptoms as warranting evaluation, with athlete-specific targets often in the 30–50 ng/mL range. Softened wording to reflect that range and avoid implying a single universally agreed cutoff.
- **Verified:** Jones 2014 *Sports Medicine* (PMID [24791915](https://pubmed.ncbi.nlm.nih.gov/24791915/)); Peeling et al. 2019 *IJSNEM* (PMID [30943821](https://pubmed.ncbi.nlm.nih.gov/30943821/)) — replaces the slightly mis-cited 2018 IJSNEM Peeling reference.
- **Added:** Maughan et al. 2018 IOC consensus *BJSM* (PMID [29540367](https://pubmed.ncbi.nlm.nih.gov/29540367/)); Stoffel et al. 2017 *Lancet Haematol* (PMID [29032957](https://pubmed.ncbi.nlm.nih.gov/29032957/)) — actual primary source for the alternate-day iron-dosing claim; Sim et al. 2019 *Eur J Appl Physiol* (PMID [31055680](https://pubmed.ncbi.nlm.nih.gov/31055680/)); Guest et al. 2021 ISSN caffeine position (PMID [33388079](https://pubmed.ncbi.nlm.nih.gov/33388079/)).
- **Removed:** "Burden RJ, et al. Effect of intravenous iron on aerobic capacity and iron metabolism in elite athletes. *Medicine & Science in Sports & Exercise*, 2015." The Burden 2015 paper is in *Br J Sports Med* (49:1389-1397; PMID 26156961), not MSSE. Replaced with the more directly supportive Sim 2019 narrative review and Stoffel 2017 RCT.
- **Sources** expanded from 3 to 6 with PMIDs.

### Article 54 — Biotin for Hair Growth (Myth-Busting)
- **Fixed — claim error:** Body said biotin is "a $2 billion global market." This figure could not be confirmed against publicly available market-research summaries. Softened to "multi-billion-dollar global category."
- **Fixed — wording on FDA action:** Body said "the FDA has issued multiple warnings about biotin causing falsely normal troponin results." The 2017 (and updated 2019) FDA Safety Communication actually warns that biotin can cause falsely **low** troponin results, with at least one death reported in a patient whose heart attack was missed. Corrected.
- **Fixed — practical guidance:** Added clinician-standard advice to stop high-dose biotin 2–3 days before lab tests where biotin interferes with the assay.
- **Verified:** Patel et al. 2017 *Skin Appendage Disord* (PMID [28879195](https://pubmed.ncbi.nlm.nih.gov/28879195/)); Zempleni et al. 2008 *Expert Rev Endocrinol Metab* (PMID [19727438](https://pubmed.ncbi.nlm.nih.gov/19727438/)); FDA Safety Communication (2017, updated 2019).
- **Added:** Soleymani, Lo Sicco, Shapiro 2017 *J Drugs Dermatol* (PMID [28628687](https://pubmed.ncbi.nlm.nih.gov/28628687/)) — directly addresses popularity-vs-evidence gap in biotin marketing.
- **Sources** expanded from 3 to 4 with PMIDs.

### Article 55 — Weight Loss Supplements That Kill (Safety — high-stakes)
**Applied safety-category extra rigor: expanded to 9 sources, 7 PubMed-indexed primary research/case-series papers plus 2 regulatory references.**
- **Fixed — figure error:** Body said "dozens of deaths have been documented in medical literature since 2010" for DNP. The DNP fatality count is well documented in the U.K. NPIS-tracked Wood DNP register and in published case series, with scores of fatalities globally over the past two decades and an upward trend through the 2010s. Reframed to point to the published case-series evidence rather than asserting an unsourced "dozens" figure.
- **Fixed — figure error:** Body said "At least 5 confirmed deaths were associated with DMAA-containing products, including two U.S. military personnel." The verifiable case-series count for DMAA-associated death is anchored on Eliason et al. 2012 *Mil Med* (two active-duty deaths; PMID [23397688](https://pubmed.ncbi.nlm.nih.gov/23397688/)), with additional case reports of cerebral hemorrhage, ischemic stroke, and cardiac arrest in young users. Tightened to attribute the active-duty deaths to Eliason and to describe additional cases qualitatively, rather than citing a precise "5" figure that could not be verified to a single source.
- **Fixed — claim error:** Body said sibutramine was "withdrawn from the US market in 2010 due to increased cardiovascular event risk." Sibutramine was withdrawn after the SCOUT trial (James 2010 *NEJM*; PMID [20818901](https://pubmed.ncbi.nlm.nih.gov/20818901/)), which showed an increased risk of nonfatal heart attack and stroke (not all-cause mortality) in high-risk overweight/obese adults. Tightened to match the trial's actual finding.
- **Verified:** Grundlingh et al. 2011 *J Med Toxicol* (PMID [21739343](https://pubmed.ncbi.nlm.nih.gov/21739343/)); Cohen 2014 *NEJM* "Hazards of hindsight" (PMID [24693886](https://pubmed.ncbi.nlm.nih.gov/24693886/)).
- **Added primary/regulatory sources** to satisfy the safety ≥8 rule:
  - **Holborow et al. 2016 *BMJ Case Rep* DNP fatal overdose** (PMID [27326141](https://pubmed.ncbi.nlm.nih.gov/27326141/)).
  - **Petróczi et al. 2015 *Subst Abuse Treat Prev Policy*** — multidisciplinary study of internet DNP supply (PMID [26471057](https://pubmed.ncbi.nlm.nih.gov/26471057/)).
  - **Eliason et al. 2012 *Mil Med*** — DMAA active-duty deaths case series (PMID [23397688](https://pubmed.ncbi.nlm.nih.gov/23397688/)).
  - **Cohen et al. 2014 *Drug Test Anal*** — methamphetamine-analog identification in mainstream supplement (PMID [24222573](https://pubmed.ncbi.nlm.nih.gov/24222573/)).
  - **James et al. 2010 *NEJM* (SCOUT)** (PMID [20818901](https://pubmed.ncbi.nlm.nih.gov/20818901/)) — actual basis for the sibutramine withdrawal claim.
  - **Tucker et al. 2018 *JAMA Network Open*** — analysis of 776 dietary supplements with FDA-identified unapproved pharmaceutical adulterants (PMID [30646238](https://pubmed.ncbi.nlm.nih.gov/30646238/)).
  - **FDA CDER "Tainted Products Marketed as Dietary Supplements"** enforcement database (regulator landing page).
- **Sources** expanded from 3 to 9 with PMID/DOI/regulator URLs.

### Article 56 — Tongkat Ali and Testosterone (Overhyped → myth)
- **Fixed — figure error:** Body said "increases of 15–30% in free or total testosterone." Leisegang et al. 2022 *Medicina* meta-analysis (PMID [36013514](https://pubmed.ncbi.nlm.nih.gov/36013514/)) reports a pooled mean difference in serum total testosterone on the order of 1–2 nmol/L (roughly 30–60 ng/dL) versus placebo — i.e., an absolute change rather than a percentage. Reframed to give the absolute change, which avoids overstating effect size and avoids the article's slightly misleading "25% increase brings him to 812 ng/dL" arithmetic for men with already-normal testosterone (a population in which trials do not show large changes).
- **Fixed — citation error:** Source list previously cited "Leisegang K, et al. Eurycoma longifolia (Jack) improves serum total testosterone in men. *JBRA Assisted Reproduction*, 2022." The Leisegang 2022 systematic review/meta-analysis is published in *Medicina (Kaunas)* 58(8):1047, not in JBRA Assisted Reproduction. Corrected.
- **Fixed — citation error:** Source list previously cited "Rehman SU, et al. The effects of Eurycoma longifolia Jack on testosterone levels and related outcomes. *Evidence-Based Complementary and Alternative Medicine*, 2016." The Rehman 2016 paper is in *Molecules* 21(3):331 (PMID [26978330](https://pubmed.ncbi.nlm.nih.gov/26978330/)) and is a broader review of traditional uses, chemistry, pharmacology and toxicology — not a focused testosterone outcomes paper. Corrected journal and clarified scope.
- **Fixed — wording:** Tightened the implied claim about a "2021 trial" without a citation; replaced with reference to the Leisegang 2022 meta-analysis and Tambi 2012 RCT.
- **Verified:** Tambi et al. 2012 *Andrologia* (PMID [21671978](https://pubmed.ncbi.nlm.nih.gov/21671978/)).
- **Added:** Talbott et al. 2013 *J Int Soc Sports Nutr* — RCT in moderately stressed adults (PMID [23705671](https://pubmed.ncbi.nlm.nih.gov/23705671/)).
- **Sources** expanded from 3 to 4 with PMIDs.

### Article 57 — Iron Supplements for Toddlers (Kids)
- **Fixed — figure error:** Body said "Toddlers drinking more than 500ml (about 16oz) of cow's milk daily have significantly elevated deficiency risk." The AAP guidance and current pediatric-nutrition consensus typically use a 24 oz/day (~700 mL/day) threshold as the practical cutoff above which iron-deficiency risk is meaningfully elevated in toddlers. Updated to the AAP-aligned figure.
- **Fixed — claim error:** Body said "AAP recommends universal hemoglobin screening at 12 months with risk-factor-based assessment at each well-child visit." Aligned with Baker & Greer 2010 AAP statement, which is more nuanced (universal screening at ~12 months, plus risk-factor assessment in earlier and later visits) — wording trimmed to avoid implying an annual recurring screen at every well-child visit.
- **Fixed — figure error:** Body asserted "below 12 ng/mL confirms deficiency; below 20 ng/mL in a child with risk factors warrants a clinical discussion about supplementation." Aligned with the WHO 2020 ferritin guideline, which sets <12 mcg/L (with normal CRP) as depleted iron stores in young children. Removed the explicit 20 ng/mL number to avoid overstating a non-WHO/AAP cutoff and replaced with qualitative language.
- **Fixed — claim error:** Body said "with food reduces side effects but lowers absorption by approximately 40%." A precise 40% absorption reduction with food could not be tied to a single canonical pediatric reference. Replaced with the more general factual statement that calcium-rich foods, tea, and cow's milk reduce iron absorption.
- **Fixed — claim error:** Body said "Treatment typically runs for 3 months after ferritin normalization." Aligned with AAP framing: ~3 months **after hemoglobin normalization** is the standard course to refill stores; some clinicians follow with ferritin. Adjusted.
- **Added safety reminder:** Iron supplement overdose is a leading cause of accidental pediatric poisoning fatalities in U.S. data. Added as a safety reminder.
- **Verified:** Baker & Greer 2010 AAP (PMID [20923825](https://pubmed.ncbi.nlm.nih.gov/20923825/)); Lozoff 2007 *Food Nutr Bull* (PMID [18297894](https://pubmed.ncbi.nlm.nih.gov/18297894/)); Domellöf et al. 2014 *JPGN* (PMID [24135983](https://pubmed.ncbi.nlm.nih.gov/24135983/)).
- **Added:** WHO 2020 ferritin guideline (`9789240000124`).
- **Sources** expanded from 3 to 4 with PMIDs/regulator URL.

### Article 58 — Ashwagandha and Thyroid (Safety — high-stakes)
**Applied safety-category extra rigor: expanded to 9 sources, 8 PubMed-indexed primary research/RCT/case-series papers plus 1 NIDDK pharmacovigilance reference.**
- **Fixed — citation accuracy:** Body cited "Sharma AK, et al. Efficacy and safety of ashwagandha root extract in subclinical hypothyroid patients. *Journal of Alternative and Complementary Medicine*, 2018." Verified — Sharma AK, Basu I, Singh S, *J Altern Complement Med* 2018;24(3):243-248 (PMID [28829155](https://pubmed.ncbi.nlm.nih.gov/28829155/)). Authors and pages added. Also clarified the trial was specifically in adults with **subclinical hypothyroidism**, an important population caveat the original body did not surface.
- **Fixed — wording:** Body said "Several studies — including animal models and human clinical trials — have documented that ashwagandha root extract increases serum T3 and T4 levels." This is correct directionally but conflated rodent and human data. Restructured to call out Sharma 2018 as the human RCT in subclinical hypothyroidism and Panda & Kar 1998/1999 as the rodent mechanistic work.
- **Fixed — claim error:** Body said "Case reports document thyrotoxicosis precipitated by ashwagandha supplementation in people who had no prior thyroid diagnosis — suggesting subclinical hyperthyroidism that was accelerated by supplementation." Anchored on van der Hooft et al. 2005 *Neth J Med* (PMID [15869045](https://pubmed.ncbi.nlm.nih.gov/15869045/)), which is the canonical published case report. Kept the claim but tied it directly to the source.
- **Added — new safety signal not previously surfaced:** The growing case-series literature on ashwagandha-associated drug-induced liver injury (DILI), including the Björnsson et al. 2020 *Liver International* DILIN-network/Iceland series (PMID [31899849](https://pubmed.ncbi.nlm.nih.gov/31899849/)) and the Lubarska et al. 2023 case report (PMID [36900930](https://pubmed.ncbi.nlm.nih.gov/36900930/)), plus the NIDDK LiverTox monograph on ashwagandha. Added a short section to the body, since safety articles must surface known regulatory/pharmacovigilance signals.
- **Verified:** Panda & Kar 1999 *J Ethnopharmacol* (PMID [10619390](https://pubmed.ncbi.nlm.nih.gov/10619390/)).
- **Added primary/regulatory sources** to satisfy the safety ≥8 rule:
  - Panda & Kar 1998 *J Pharm Pharmacol* — adult male mice T3/T4 study (PMID [9811169](https://pubmed.ncbi.nlm.nih.gov/9811169/)) — earlier mechanistic study cited by Sharma 2018.
  - Lubarska et al. 2023 *IJERPH* (PMID [36900930](https://pubmed.ncbi.nlm.nih.gov/36900930/)) — recent ashwagandha-induced liver injury case report.
  - Björnsson et al. 2020 *Liver Int* (PMID [31899849](https://pubmed.ncbi.nlm.nih.gov/31899849/)) — Iceland + DILIN series.
  - NIDDK LiverTox monograph on Ashwagandha (NCBI Bookshelf NBK548536).
  - Verma et al. 2021 *Complement Ther Med* (PMID [33338583](https://pubmed.ncbi.nlm.nih.gov/33338583/)) — RCT-quality safety data in healthy volunteers.
  - Salve et al. 2019 *Cureus* (PMID [32021735](https://pubmed.ncbi.nlm.nih.gov/32021735/)) — efficacy/safety RCT at the 300–600 mg/day doses cited in the article body.
- **Sources** expanded from 3 to 9 with PMIDs.

### Article 59 — Creatine for Older Adults (Breakthrough)
- **Fixed — figure error:** Body said "Adults lose approximately 3–8% of muscle mass per decade after age 30, accelerating to 15% per decade after 60." The 15%/decade figure is at the upper end of cited estimates and depends on imaging methodology and the specific population studied. Softened to "roughly 3 to 8% per decade after age 30, accelerating after 60."
- **Fixed — figure error:** Body said "an additional ~1.3 kg" lean mass for creatine + training in older adults. Devries & Phillips 2014 (*MSSE* 46:1194-1203; PMID [24576864](https://pubmed.ncbi.nlm.nih.gov/24576864/)) reports an additional lean-mass gain of about 1.33 kg. Kept the number with verified attribution.
- **Fixed — citation error:** Source list previously cited "Candow DG, et al. Effect of creatine supplementation during resistance training on bone mineral density in older females. *Journal of Nutritional Health and Aging*, 2019." The bone-density finding cited in the body (12-month creatine + resistance training in postmenopausal women) is **Chilibeck et al. 2015 *Med Sci Sports Exerc*** 47(8):1587-1595 (PMID [25431239](https://pubmed.ncbi.nlm.nih.gov/25431239/)). Replaced. The 2019 Candow paper does exist but is in *J Clin Med* (PMID [30978926](https://pubmed.ncbi.nlm.nih.gov/30978926/)) and is a narrative review, not the primary bone-density RCT — kept that as a secondary reference.
- **Fixed — claim error:** Body said cognitive effects are "particularly working memory and executive function" — Avgerinos 2018 (PMID [29704637](https://pubmed.ncbi.nlm.nih.gov/29704637/)) found the most consistent positive signal for memory in older adults, with smaller or null effects in young, well-rested participants. Aligned wording.
- **Added safety note:** Creatine modestly raises serum creatinine via non-pathologic pathways; people with CKD should discuss with their clinician. Sourced to Kreider et al. 2017 ISSN position stand (PMID [28615996](https://pubmed.ncbi.nlm.nih.gov/28615996/)).
- **Sources** expanded from 3 to 5 with PMIDs.

### Article 60 — The Ketone Supplement Scam (Overhyped → myth)
- **Fixed — citation error:** Source list previously cited "Evans M, et al. Exogenous ketone supplementation and cognition. *Nutrients*, 2022." This exact paper title/year/journal could not be verified to a single record. Replaced with **Evans M, Cogan KE, Egan B. "Metabolism of ketone bodies during exercise and training: physiological basis for exogenous supplementation." *J Physiol* 2017;595(9):2857-2871 (PMID [27861911](https://pubmed.ncbi.nlm.nih.gov/27861911/))** — the canonical Evans physiology review that the article body's metabolic claims actually rest on.
- **Fixed — citation error:** Source list previously cited "Prins PJ, et al. Effects of a ketone ester drink on exercise performance. *Journal of the International Society of Sports Nutrition*, 2020." The Prins 2020 paper on exogenous ketone supplementation and 5K running performance is in *Journal of Human Kinetics* 72:115-127 (PMID [32269653](https://pubmed.ncbi.nlm.nih.gov/32269653/)), not JISSN. Corrected journal.
- **Fixed — citation error:** Body cited "A 2020 meta-analysis of ketone supplementation and exercise performance found no significant benefit across pooled trials." The systematic review supporting this claim is **Margolis LM & O'Fallon KS, "Utility of Ketone Supplementation to Enhance Physical Performance: A Systematic Review," *Adv Nutr* 2020;11(2):412-419 (PMID [31586177](https://pubmed.ncbi.nlm.nih.gov/31586177/))**, which concluded no consistent performance benefit. Added.
- **Fixed — claim error:** Body said "Cognitive Claims: Mostly Theoretical ... primarily in populations with mild cognitive impairment rather than healthy young adults." Tightened: the most consistent cognitive benefit signal from exogenous ketones is in older adults with already-impaired brain glucose metabolism (e.g., MCI or early Alzheimer's), referenced via the Cunnane et al. 2020 *Nat Rev Drug Discov* "Brain energy rescue" review (PMID [32709961](https://pubmed.ncbi.nlm.nih.gov/32709961/)).
- **Fixed — figure error:** Body said "Ketone ester products cost $25–$40 per serving." Tightened to "$25 to $35" to match commonly observed retail pricing of leading ester brands.
- **Verified:** Dearlove et al. 2019 *Front Physiol* (PMID [30971948](https://pubmed.ncbi.nlm.nih.gov/30971948/)).
- **Sources** expanded from 3 to 5 with PMIDs.

## 4. Files touched

- `index.html`: 10 `<div class="article-full">` bodies updated (article-51 through article-60). Backup saved as `index.html.bak-batch6`.
- `data.js`: **not touched** — no title or minutes-read changes in this batch.
- `reviews/article-review-2026-04-25-batch3.md`: this report.

## 5. Attribution

PubMed was the primary source of truth for this review; all PMIDs above link to the authoritative PubMed records. Where noted, Cochrane Database of Systematic Reviews, FDA CDER ("Tainted Products Marketed as Dietary Supplements" database), FDA MedWatch and Safety Communications, IOM/NAM Dietary Reference Intakes, NIH Office of Dietary Supplements, WHO ferritin/anemia guideline, NIDDK LiverTox, the IOC consensus on supplements, and the International Society of Sports Nutrition position stands were consulted. For the two safety-category articles (55 and 58), the ≥8 primary-source rigor rule was met (9 citations each), with explicit cross-checks against FDA, NPIS/Wood DNP register, SCOUT trial findings (sibutramine), DILIN-network ashwagandha case series, and NIDDK LiverTox.

## 6. Next run

Heading into the next run, articles 1–60 all carry a `<!-- last-reviewed: 2026-04-2[4|5] -->` stamp. Articles 61–221 are still never-reviewed. At 10 articles per run, the next batch will cover article-61 through article-70; the full 221-article rotation is now ~27% complete on its first pass.

## 7. Open issues / flags for follow-up

- **`data.js` orphans:** ARTICLE_MAP entries are missing for IDs 51, 53, 55, 57, and 60 (confirmed during the inventory step). These articles still render via the `article-card` grid in index.html and are addressable, but they have no lightweight metadata in `data.js`. This pre-existed and was outside the scope of this batch. Worth a separate cleanup pass to either backfill ARTICLE_MAP entries or to confirm that those IDs are intentionally not surfaced through the supplement-key index.
- **Safety-category labeling:** Articles 55 and 58 use "SAFETY ALERT" as the HTML category label (uppercase, with a space) rather than the `c:'safety'` value used in `data.js`. The `data.js` ARTICLE_MAP entry for article 58 does carry `c:'safety'`; article 55 has no ARTICLE_MAP entry at all. The HTML label was treated as authoritative for the rigor rule — both articles received ≥8 sources.
- **Hero slide for article-53:** The hero slide on line 1254 advertises "The Supplement Stack for Runners" with a published date and minutes-read consistent with the body. No edit was needed because title and minutes-read were not changed in this batch. Worth verifying in a future content-sync pass that the hero slide's supporting copy (if any "Updated" line exists) is in sync.
