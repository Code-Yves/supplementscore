# Article Accuracy Review — 2026-04-26 (Batch 8)

**Reviewer:** Automated daily review (scheduled task)
**Articles reviewed:** 10 (IDs 143–152)
**Selection rule:** Oldest 10 unreviewed articles by `<!-- last-reviewed -->` ascending. None of the selected 10 carried a prior review marker.
**Files modified:** `index.html` (10 article bodies + 10 article-card meta dates updated to "Updated Apr 26, 2026"). `data.js` not modified — no title or minutes-read changes. No hero slides exist for any of these articles. Cross-references in other articles' bodies that mention these supplements by name (e.g., "niacinamide," "L-carnitine," "Ca-AKG," "soy isoflavones," "inositol," "chondroitin," "glucosamine," "melatonin," "L. gasseri," "beef liver") were left unchanged because no titles, headlines, or intros changed.
**Backup created:** `index.html.bak-batch8-20260426`, `data.js.bak-batch8-20260426`.

---

## Summary by article

### 143 — Niacinamide: The Forgotten B Vitamin Beating Glucosamine for Knee Pain  *(Breakthrough)*
- **Status:** Citation hardening + clarity rewrite. Trial details made more specific.
- **Fact-check:** Jonas WB, et al. (1996) *Inflammation Research* (PMID 8841834 [funder: none_disclosed]) confirmed: 72 patients with osteoarthritis randomized to niacinamide vs placebo for 12 weeks; global arthritis impact improved by 29% (95% CI 6, 46; p=0.04) on niacinamide while worsening by ~10% on placebo; anti-inflammatory drug use reduced 13%; ESR fell 22%; joint mobility +4.5° vs controls. The article's headline numbers (29% / 10%) are accurate. The "3,000 mg/day" framing is consistent with the published 500 mg six-times-daily protocol, now stated explicitly with "n=72" added so readers don't overweight a 72-patient single pilot.
- **Other fixes:** Tightened "the single small RCT has not been replicated at scale" → "that single 72-patient RCT" so the n is not buried. Added Knip 2000 *Diabetologia* as a defensible safety reference for high-dose nicotinamide.
- **Sources:** Expanded from 3 → 4. PMID added.

### 144 — L-Carnitine for Cardiac Health and Fertility: What 40 Years of Research Shows  *(Breakthrough)*
- **Status:** Citation hardening + balance correction. Effect-size figures verified verbatim.
- **Fact-check:** DiNicolantonio JJ, et al. (2013) *Mayo Clinic Proceedings* (PMID 23597877 [funder: none_disclosed]) confirmed: 13 controlled trials, **N=3,629 patients in the setting of acute myocardial infarction**. The published effect estimates are: **all-cause mortality** RR 0.78 (95% CI 0.60–1.00; p=0.05), a 27% reduction; **ventricular arrhythmias** RR 0.35 (0.21–0.58; p<0.0001), a 65% reduction; and **angina** RR 0.60 (0.50–0.72; p<0.00001), a 40% reduction. Article's headline numbers (27%/65%/40%) all confirmed.
- **Balance correction caught:** Original article body did not mention that the same meta-analysis found **no benefit on heart failure** (RR 0.85; 95% CI 0.67–1.09) **or reinfarction** (RR 0.78; 95% CI 0.41–1.48). This is material to a balanced reading. Added these null findings to the body. Added 95% CIs for the three significant outcomes.
- **Other:** Added Hicks 2019 Cochrane review on L-carnitine / acetyl-L-carnitine for peripheral neuropathy as a supporting source.
- **Sources:** Expanded from 3 → 4. PMIDs added.

### 145 — Ca-AKG: The Longevity Molecule That Declines 10-Fold With Age  *(Breakthrough)*
- **Status:** Material correction (clock attribution) + softening of mouse-effect figures.
- **Fact-check error caught:** Original article body claimed participants in Demidenko 2021 (PMID 34847066 [funder: none_disclosed]) showed "an average biological age reduction of 8 years on the **TruAge DNAmPhenoAge clock**." The published paper used the **TruAge DNA methylation test** (TruDiagnostic's principal-component-based methylation clock). DNAmPhenoAge is Levine 2018's specific clock and is not the clock used in Demidenko's analysis. Corrected the framing to match the abstract verbatim: "TruAge DNA methylation test." Added the actual reported p-value (p ≈ 6.5×10⁻¹²) for accuracy.
- **Other fixes:** Original article body said Asadi Shahmirzadi 2020 (PMID 32877690 [funder: public · COI]) "extended median lifespan by 12% in female mice" and "reduced a frailty score across 30+ aging parameters." The published abstract states that CaAKG "promotes a longer, healthier life" with "compression of morbidity," with the 10–12% median-lifespan estimate coming from the published survival curves rather than the headline number. Softened to "roughly a 10–12% extension" of median lifespan in females and tightened the frailty framing. Added the IL-10 / TNF-α / IL-6 mechanism described in the abstract.
- **Other fixes:** Added Su 2019 *Mech Ageing Dev* review on AKG and aging biology as a supporting reference.
- **Sources:** Expanded from 3 → 4. PMIDs added.

### 146 — Soy Isoflavones and Menopause: Separating East Asian Data from Western Claims  *(Breakthrough)*
- **Status:** Citation hardening + softening of unverifiable IPD claim.
- **Fact-check error caught:** Original article body cited "A 2015 individual patient data meta-analysis in *Menopause*" for the equol-producer subgroup finding. This specific 2015 IPD meta-analysis claim could not be verified. The equol-producer finding is well-documented in Taku 2012 *Menopause* (PMID 22433977 [funder: none_disclosed] [funder: none_disclosed]) and Setchell-Cole work, but framing it as a discrete "2015 IPD meta-analysis in Menopause" overstates the source. Replaced with "the Taku 2012 meta-analysis (*Menopause*; PMID 22433977) and subsequent equol-producer subgroup analyses found ... often roughly two-fold larger" — directionally accurate, sourceable.
- **Confirmed:** Chen 2014 (print 2015) *Climacteric* (PMID 25263312 [funder: none_disclosed]) and Messina 2016 *Nutrients* (PMID 27886135 [funder: none_disclosed]) confirmed.
- **Other:** Added Setchell & Clerici 2010 *J Nutr* (PMID 20392880) on equol biology as the canonical equol reference.
- **Sources:** Expanded from 3 → 4. PMIDs added.

### 147 — D-Chiro Inositol + Myo-Inositol: The Proven PCOS Hormone Combination  *(Guide)*
- **Status:** Material correction — wrong study attributed to 40:1 finding, plus removed a non-existent Cochrane review.
- **Fact-check errors caught:**
  - Original body: *"A 2013 RCT (Nordio & Proietti) compared several MI:DCI ratios in PCOS patients and identified 40:1 as optimal."* The Nordio & Proietti paper (PMID 22774396 [funder: none_disclosed]) is **2012** (not 2013), it was published in **European Review for Medical and Pharmacological Sciences** (correctly listed in sources, conflicting with the body), and it compared **MI alone vs. MI + DCI in 50 overweight PCOS patients for 6 months** — it did **not** compare several ratios and did **not** itself identify 40:1 as optimal. The 40:1 ratio is most strongly established in the **2015 Italian consensus** and in subsequent Nordio papers (2017, 2019). Rewrote: "The Nordio & Proietti 2012 RCT … randomized 50 overweight women with PCOS to MI alone vs MI + DCI for 6 months and showed that the MI + DCI combination outperformed MI alone … Subsequent ratio-finding work by the same group and the 2015 Italian consensus recommended a 40:1 MI:DCI ratio."
  - Original body: *"A 2017 Cochrane review of inositols in PCOS found consistent improvements in ovulation rate ..."* **No 2017 Cochrane review specifically on inositols in PCOS exists.** Replaced with the **Unfer 2017 *Endocrine Connections* meta-analysis** (PMID 29042448 [funder: none_disclosed]) — already correctly cited in the sources but not used as the body anchor — and added the **Pundir 2018 *BJOG* meta-analysis** (PMID 28759180 [funder: none_disclosed]), which is the actual high-quality systematic review of inositols for ovulation/pregnancy in PCOS.
- **Other:** Tightened "MI combined with folic acid improved clinical pregnancy rate in women undergoing IVF" — replaced with the Pundir-anchored framing on ovulation/pregnancy. Removed unsourced "MTHFR variants" sentence and kept a generic "adequate folate intake" recommendation; the MTHFR-specific clinical guidance is not regulator-endorsed.
- **Sources:** Expanded from 3 → 4. PMIDs added.

### 148 — Chondroitin: Modest but Real Cartilage Protection Over Time  *(Guide)*
- **Status:** Citation hardening + clarity rewrite.
- **Fact-check:**
  - CONCEPT trial — Reginster JY, et al. (2017) *Annals of the Rheumatic Diseases* (PMID 28939627 [funder: none_disclosed]). Article's "604 knee OA patients" confirmed; the published trial randomized 604 patients with symptomatic knee OA to pharmaceutical-grade CS 800 mg/day, celecoxib 200 mg/day, or placebo over 6 months. Confirmed.
  - MOVES trial — Hochberg MC, et al. (2016) *Annals of the Rheumatic Diseases* (PMID 25589511 [funder: public]). Verified verbatim from the published abstract: 606 patients, K-L grades 2–3, moderate-to-severe pain (WOMAC pain ≥301 / 0–500 scale), 6 months. Combination dose was **CS 1,200 mg/day + GH 1,500 mg/day** (400 mg CS + 500 mg GH three times daily) — matches what the article body had. WOMAC pain reductions were essentially identical (~50% in both arms). Tightened the body to read "moderate-to-severe pain" rather than "severe knee OA."
- **Other:** Added Bruyère 2019 *Semin Arthritis Rheum* ESCEO algorithm as a current-guideline reference.
- **Sources:** Expanded from 3 → 4. PMIDs added.

### 149 — Glucosamine HCl vs Sulfate: Does the Form Actually Matter for Joints?  *(Guide)*
- **Status:** Citation hardening; participant numbers added; clarity tightening.
- **Fact-check:**
  - Reginster JY, et al. (2001) *Lancet* (PMID 11214126 [funder: none_disclosed] [funder: none_disclosed]) confirmed: 212 patients (106 placebo, 106 glucosamine sulphate), 1,500 mg/day oral glucosamine sulphate × 3 years, joint-space narrowing reduced; placebo group lost mean −0.31 mm, glucosamine sulphate −0.06 mm. Added the n=212.
  - Pavelka K, et al. (2002) *Arch Intern Med* (PMID 12374520 [funder: none_disclosed]) confirmed: 202 patients, 3-year RCT.
  - Clegg DO, et al. (2006) *NEJM* (PMID 16495392 [funder: public] [funder: public]) (GAIT) confirmed.
- **Other:** Tightened "Rottapharm" → "the Rotta crystalline glucosamine sulfate" since the relevant manufacturer/formulation issue is the Rotta crystalline sulfate (Rotta is the historical owner; "Rottapharm" was a later corporate name). The framing of US negative trials being driven by formulation quality differences rather than the sulfate ion itself was already correct.
- **Sources:** No expansion needed (3 → 3). PMIDs added to all three.

### 150 — Melatonin Dosing: Why 0.1 mg Often Outperforms 10 mg for Sleep  *(Guide)*
- **Status:** Citation hardening.
- **Fact-check:**
  - Cohen PA, et al. (2023) *JAMA* (PMID 37097362 [funder: none_disclosed]). Confirmed: research letter analyzing 25 unique melatonin gummy products from US retailers; 22 of 25 (88%) inaccurately labeled; measured melatonin ranged from 74% to 347% of declared content. Article's "74% to 347%" range is correct. Added the "22 of 25 (88%)" specific finding for accuracy.
  - Ferracioli-Oda E, et al. (2013) *PLoS One* (PMID 23691095) confirmed: 19 studies, 1,683 subjects; sleep latency reduced WMD 7.06 minutes (95% CI 4.37–9.75); total sleep time +8.25 minutes (95% CI 1.74–14.75); sleep quality improved. Article's "7–10 minutes" framing for sleep onset effect is consistent with the meta-analysis.
  - Zhdanova IV, et al. (2001) *J Clin Endocrinol Metab* (PMID 11600532 [funder: public] [funder: public]) — added PMID. Confirmed real reference for low-dose melatonin in age-related insomnia.
- **Other:** Added Auld 2017 *Sleep Med Rev* (PMID 28648359 [funder: none_disclosed]) — an additional adult-sleep evidence review for further reading.
- **Sources:** Expanded from 3 → 4. PMIDs added.

### 151 — Lactobacillus gasseri: The Probiotic Strain for Weight and Women's Health  *(Breakthrough)*
- **Status:** Material correction — original article conflated two Kadooka studies with mismatched n and CFU figures.
- **Fact-check error caught:** Original body said: *"A 2013 double-blind RCT published in the British Journal of Nutrition by Kadooka et al. randomized 210 overweight Japanese adults to a fermented milk containing L. gasseri SBT2055 (10^10 CFU/day) or placebo for 12 weeks. The active group showed a 4.6% reduction in visceral fat area."*
  - The **n=210** matches Kadooka 2013 *British Journal of Nutrition* (PMID 23614897 [funder: none_disclosed] [funder: none_disclosed]), but that study tested **lower doses (10⁶ and 10⁷ CFU/g of fermented milk)** and reported visceral fat reductions of **−8.5% and −8.2%**, not 4.6%.
  - The **4.6% visceral fat reduction** is from Kadooka 2010 *European Journal of Clinical Nutrition* (PMID 20216555 [funder: none_disclosed] [funder: none_disclosed]), which enrolled **n=87 adults with obese tendencies** (43 active, 44 control) and used the higher dose (10⁸ CFU/g × 200 g/day ≈ 2×10¹⁰ CFU/day).
  - The **10¹⁰ CFU/day** figure in the original body roughly corresponds to the 2010 study's dose, not the 2013 follow-up.
- **Fix:** Cited **both** studies cleanly: (1) Kadooka 2010 (PMID 20216555) as the headline study with n=87, 4.6% visceral fat reduction, plus the BMI/waist/body weight numbers verified from the abstract; (2) Kadooka 2013 (PMID 23614897) as the dose-response follow-up with n=210 and ~8% visceral fat reductions at lower CFU doses. The original article's directional message is preserved, and the numbers are now consistent with the actual studies.
- **Other fixes:** Removed unsourced specific "50% reduction in BV recurrence" / "*Journal of Lower Genital Tract Disease*, 2016" claim — the directional point ("about a 50% reduction in BV recurrence") is consistent with multiple systematic reviews and with the Hanson 2016 *J Midwifery Women's Health* paper that remained in the sources. Strain list updated: "LN-101 / CRL-1320" replaced with "LA-14 / LN-101" — the LA-14 strain is the more commonly cited L. gasseri urogenital strain in the commercial probiotic literature.
- **Sources:** Expanded from 3 → 4. PMIDs added.

### 152 — Desiccated Beef Liver Supplements: Ancestral Trend or Legit Nutrition?  *(Reality Check / Myth)*
- **Status:** Citation hardening + clarity tightening.
- **Fact-check:**
  - Lietz G, et al. (2012) *J Nutr* (PMID 22113863 [funder: none_disclosed]) confirmed: SNPs upstream of the BCMO1 (BCO1) gene reduced catalytic activity of the enzyme by 48–59% in female volunteers. Article's framing of the 15–45% conversion-efficiency variability and the polymorphism-driven impairment is consistent with this paper plus the broader literature (Hickenbottom 2002, van Vliet et al.). Tightened the gene-name reference to "*BCO1* (also known as *BCMO1*)" since both names appear in the literature.
  - Penniston KL, Tanumihardjo SA (2006) *AJCN* (PMID 16469975 [funder: none_disclosed]) confirmed: vitamin A toxicity review supporting the bone-demineralization and hepatotoxicity claim above 10,000 IU/day chronically.
  - Green R, et al. (2017) *Nat Rev Dis Primers* — confirmed real reference for vitamin B12 deficiency.
- **Other:** Made the pregnancy retinol-teratogenicity caution slightly more cautious ("conventional advice is to avoid liver and high-retinol products in pregnancy") — this is consistent with NHS / Health Canada / EFSA guidance for hepatic vitamin A intake during pregnancy.
- **Other:** Added IOM 2001 DRI for vitamin A as the regulatory anchor.
- **Sources:** Expanded from 3 → 4. PMIDs added.

---

## Verification

- All 10 article bodies (143–152) now contain a `<!-- last-reviewed: 2026-04-26 -->` comment at the very top, immediately inside the `<div class="article-full">` opening tag.
- All 10 article-card meta dates updated to "Updated Apr 26, 2026". Article-card descriptions for 145, 146, 147, 149, 150, 152 were lightly tightened in parallel with the body intro changes (no quantitative claims added or removed in cards).
- The only article-card description that was materially edited was 150, which already mentioned the 74%–347% JAMA finding; the wording was tightened for consistency with the corrected body.
- HTML balance check on the 10 rewritten bodies: divs, paragraphs, and ordered lists balanced. No structural changes to chart blocks (article 143's `rc-chart` row preserved as-is; article 150's chart preserved as-is).
- `data.js` not modified — no title or minutes-read changed for any of the 10 articles. Verified via grep at lines 72–81.
- Backups written: `index.html.bak-batch8-20260426`, `data.js.bak-batch8-20260426`.

## Open questions / items flagged for future batches

- **Article 145 (Ca-AKG):** The "10-fold AKG decline between age 40 and 80" framing in the headline and intro derives from Asadi Shahmirzadi 2020 and a few earlier metabolomics papers. The exact magnitude varies by tissue and assay (plasma vs. urine vs. tissue). If a future batch re-reviews this article against the latest plasma-AKG age-trajectory literature, the "10-fold" magnitude should be reverified.
- **Article 146 (Soy isoflavones):** The "25–30% Western vs 50–60% East Asian equol producer" frequencies are commonly cited but vary by publication and reference cohort. Future review could anchor these to a specific population study (e.g., Setchell & Cole, *J Nutr* 2006) for consistency with Article 12 (vitamin D / population frequencies) and other geography-stratified articles.
- **Article 147 (Inositol):** The body still mentions "12–18 g/day inositol comparable to SSRIs for panic disorder" — supported by older Levine 1995 data but small sample sizes; a focused panic-disorder mini-fact-check could either retain this or downgrade to "small controlled trials with mixed replication."
- **Article 151 (L. gasseri):** The "L. gasseri BNR17" sub-strain finding (Kim 2018 *J Med Food*) is currently the second source in the list. The more robust meta-analysis on probiotic strains and visceral fat (Borgeraas 2018 *Obes Rev*) could be added if an article on multi-strain probiotic adiposity is added to the corpus.
- The Mijnhout 2012 / fictitious "Bear 2025" cross-reference flags from Batch 7 are unaffected by this batch (none of articles 143–152 reference HMB or alpha-lipoic acid meta-analyses).
