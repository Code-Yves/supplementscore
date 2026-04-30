# Article Accuracy Review — 2026-04-26 (Batch 7)

**Reviewer:** Automated daily review (scheduled task)
**Articles reviewed:** 10 (IDs 133–142)
**Selection rule:** Oldest 10 unreviewed articles by `<!-- last-reviewed -->` ascending. None of the selected 10 had a prior review marker. Article 132 was rewritten in Batch 6 today but its `last-reviewed` marker was missed; this batch added the marker (housekeeping only — no content change to 132).
**Files modified:** `index.html` (10 article bodies + 10 article-card meta dates + article 132 marker housekeeping + article 133 card desc tightening). `data.js` not modified — no title or minutes-read changes. No hero slides exist for any of these articles. Cross-references in other articles' bodies that mention these supplements by name (e.g., "lutein," "spirulina," "HMB," "St. John's Wort") were left as-is because no titles, headlines, or intros changed.
**Backup created:** `index.html.bak-batch7-20260426`.

---

## Summary by article

### 133 — Lutein and Zeaxanthin: Protecting Your Vision After 40  *(Breakthrough)*
- **Status:** Material correction + clarity rewrite. Article-card description also corrected.
- **Fact-check error caught:** Original text claimed AREDS2 showed an "18% reduction in AMD progression" with lutein + zeaxanthin and a "26% reduction in advanced AMD risk" in the 10 mg lutein arm, presented as the headline finding. The AREDS2 primary analysis (Chew et al., *JAMA*, 2013; PMID 23644932 [funder: public]; HR 0.90, 98.7% CI 0.76–1.07; p=0.12) was **not statistically significant** for the whole cohort. The 18% figure is from a pre-planned **secondary** analysis comparing the L+Z-substituted arm vs. the β-carotene-containing AREDS arm. The 26% figure applies only to the **lowest dietary L+Z quintile subgroup**. Rewrote to present primary, secondary, and subgroup results separately and accurately.
- **Other fixes:** Soften "Nurses' Health Study found a 40% lower risk" — that figure varies by exposure cut-point. Replaced with general directional framing and added Christen 2008 (*Arch Ophthalmol*; PMID 18348805 [funder: none_disclosed]) as a defensible carotenoid/vision citation. Replaced unattributed LAMA-trial claim with the Hammond/Stringham/Renzi line of work and Hammond 2017 (*Front Aging Neurosci*; PMID 28223935 [funder: none_disclosed]) as the cleaner cognition citation. Card description also tightened to remove the "25% over five years" overstatement.
- **Sources:** Expanded from 3 → 5, all with PMIDs.

### 134 — Spirulina: Nutrient Powerhouse or Overhyped Algae?  *(Reality Check)*
- **Status:** Citation correction + clarity rewrite. Added regulatory cyanotoxin caveat.
- **Fact-check error caught:** The original article body cited "A 1991 study in the *Journal of Nutrition*" for the spirulina/pseudovitamin-B12 finding. **The actual paper is Watanabe et al., 1999, *Journal of Agricultural and Food Chemistry* (PMID 10552882 [funder: none_disclosed]).** Year, journal, and characterization details were all incorrect in the original body text. Fixed.
- **Iron-per-3g chart row:** Original chart said "40% DV" for 3 g of spirulina. 3 g of spirulina contains roughly 2 mg iron, which is ~11% of the U.S. adult RDA for men or ~25% of the higher absorbable target. Corrected to "~11% DV" — the more defensible per-gram-iron figure.
- **Added:** Cyanotoxin/microcystin contamination note (FDA + Health Canada have both flagged this for blue-green algae products). This is a real and underdiscussed risk for wild-harvested or open-pond products.
- **Sources:** Expanded from 3 → 5, all with PMIDs/DOIs.

### 135 — Alpha-Lipoic Acid: The Antioxidant for Nerve Health  *(Guide)*
- **Status:** Citation tightening + clarity rewrite.
- **Fact-check:**
  - ALADIN I — Ziegler 1995 *Diabetologia*: 328 patients, 600 mg/day IV × 3 weeks. Confirmed.
  - SYDNEY 2 — Ziegler 2006 *Diabetes Care* (PMID 17065669 [funder: none_disclosed]): **181 patients** (the original article framed SYDNEY 2 as a confirmation of oral 600 mg × 5 weeks; n correction now stated explicitly). The 600/1200/1800 mg dose-response and the "600 mg = best risk-benefit" conclusion are preserved.
  - Mijnhout 2012 (PMID 22331979 [funder: none_disclosed]): The original article claimed "1,258 patients" pooled across "four trials." That figure is not in the Mijnhout abstract or paper. Replaced with the actual Mijnhout finding: pooled SMD −2.26 (CI −3.12 to −1.41) across the included trials, with a **Grade A recommendation** for 600 mg IV × 3 weeks. Loose framing replaced with the actual published conclusion.
  - Added Han et al. (*Endocrine*, 2012) as a complementary meta-analysis.
- **Sources:** Expanded from 3 → 4.

### 136 — Beta-Alanine: Why the Tingle Is Worth It for Athletes  *(Breakthrough)*
- **Status:** Dose correction + clarity rewrite.
- **Fact-check error caught:** Original text described the ISSN-recommended protocol as **"3.2–6.4 g/day for a minimum of 4 weeks, with 12 weeks needed to maximize"**. The Trexler et al. ISSN 2015 position stand (PMID 26175657 [funder: none_disclosed]) actually specifies **4–6 g daily for at least 2–4 weeks**, with up to 12 weeks for full carnosine loading, and singles out **1.6 g per dose** as the divided-dose target to attenuate paresthesia. Rewrote to align with the ISSN stand verbatim. The 3.2–6.4 g/day range comes from earlier Harris/Stout-era literature and is still in use, but should not be attributed to ISSN 2015.
- Hobson 2012 meta-analysis (PMID 22270875 [funder: none_disclosed]): 15 manuscripts, 360 participants, 23 exercise tests, median 2.85% improvement for 60–240 s exercise — confirmed and retained.
- Added Saunders 2017 (*BJSM*) as a more recent meta-analysis.
- **Sources:** Expanded from 3 → 4.

### 137 — Choline: The Essential Nutrient 90% of People Lack  *(Guide)*
- **Status:** Citation hardening + clarity rewrite.
- **Fact-check:**
  - Caudill 2018 *FASEB J* (PMID 29217669 [funder: public]): 26 women in third trimester randomized to 480 vs 930 mg choline/day — **confirmed**. Effect on infant information processing speed at 4, 7, 10, 13 months — confirmed and added more specifically.
  - Wallace & Fulgoni 2017 *Nutrients* — kept as primary NHANES citation. Added IOM 1998 DRI as the regulatory anchor for the 550 mg M / 425 mg F / 450 mg pregnancy AI levels, which was previously implicit.
  - da Costa AJCN 2006 paper retained (the actual study examined choline depletion's effects on lymphocyte apoptosis and DNA damage, with stratification by MTHFR status — original framing of "organ dysfunction" was loose; tightened).
  - Added Zeisel 2006 *Annual Review of Nutrition* as a comprehensive choline-essentiality reference.
- **Sources:** Expanded from 3 → 5.

### 138 — Tart Cherry for Recovery: What the Sports Science Says  *(Breakthrough)*
- **Status:** Material correction + clarity rewrite.
- **Fact-check error caught:** Original text described Bowtell 2011 as a study in **"trained cyclists ... 7 days before and during 3 days of simulated road racing"** showing "muscle catabolism reduced by 18%." The actual Bowtell 2011 paper (*Med Sci Sports Exerc*; PMID 21233776 [funder: none_disclosed]) tested **10 well-trained men doing intensive single-leg knee-extension exercise** (10 sets of 10 reps at 80% 1RM), not cycling. The "18%" figure is also not in the abstract. Replaced with the verified Bowtell finding: faster MVC recovery at 24 h and 48 h with cherry, and reduced protein-carbonyl oxidative damage.
- **Howatson 2010 marathon trial (PMID 19883392 [funder: none_disclosed]):** Original "IL-6 levels were 12% lower" — the published abstract reports significant IL-6 reduction (P<0.001) without specifying a single percentage point. Replaced with the verified directional language ("significantly lower IL-6, CRP, uric acid").
- **Pigeon 2010 (PMID 20438325 [funder: public]):** Original text said the trial "confirmed reduced wakefulness after sleep onset" generically. The actual Pigeon pilot was n=15, crossover, with WASO improvement vs placebo but **no significant improvement** in sleep latency, total sleep time, or sleep efficiency vs placebo. Tightened framing.
- **Howatson 2012 sleep RCT (PMID 22038497 [funder: none_disclosed]):** Confirmed: 20 healthy adults, 30 mL twice daily × 7 days; melatonin/sleep findings preserved with the correct citation.
- **Sources:** Expanded from 3 → 4, all with PMIDs.

### 139 — Supplements for Kids: What's Safe, What's Needed, and What to Skip  *(Kids — extra rigor on pediatric dosing)*
- **Status:** Citation tightening + clarity rewrite. Pediatric dosing claims hardened.
- **Fact-check:**
  - AAP vitamin D guidance (Wagner & Greer 2008 *Pediatrics*): 400 IU/day infants from birth, 600 IU/day for children >1 year — confirmed and the Wagner/Greer Clinical Report citation preserved.
  - DOLAB trial (Richardson et al., *PLOS ONE*, 2012; PMID 22970149 [funder: none_disclosed]): 362 children ages 7–9 randomized; the 600 mg/day DHA reading effect was significant **only in the pre-planned ≤20th-centile subgroup of 224 children**, not the full sample. The original article overstated this as a whole-group effect; corrected.
  - Bloch & Qawasmi 2011 *JAACAP* (PMID 21961774 [funder: public]): 10 trials, 699 children — confirmed; small but significant effect on ADHD symptoms with EPA dose correlating to efficacy. Effect size kept but framing now accurate.
  - Iron screening at 12 months — Baker & Greer 2010 *Pediatrics* (PMID 20923825) — confirmed and PMID added.
  - **ConsumerLab claim:** Original article asserted "80% of children's gummy vitamins failed quality testing." ConsumerLab is a commercial subscription testing service whose specific year-on-year results vary. Reframed as "Independent commercial testing services have reported many children's gummy products that do not meet label claims" rather than asserting a specific percentage that cannot be sourced to a peer-reviewed study.
  - AAP melatonin guidance — added explicit AAP HealthyChildren reference (most recent guidance discourages routine pediatric melatonin use without physician oversight).
- **Sources:** Expanded from 3 → 5.

### 140 — Quercetin and Immunity: From Antioxidant to Senolytic  *(Breakthrough)*
- **Status:** Material correction + clarity rewrite.
- **Fact-check error caught:** Original text framed Heinz et al. (PMID 20478383 [funder: none_disclosed]) as a "2011 RCT … significantly reduced the severity and duration of upper respiratory tract infections in physically fit adults over 40, though incidence was not significantly reduced." The paper is from **2010** (*Pharmacological Research*), and the **whole-cohort URTI rate, severity, and duration were all NOT significantly different**. The 36% URTI severity reduction and 31% reduction in sick days appeared **only** in a **pre-specified subgroup of subjects ≥40 rated as physically fit (n = 325)** receiving 1,000 mg/day. This is a meaningful framing difference; corrected.
- **Zhu 2015 *Aging Cell* (PMID 25754370 [funder: public]):** Confirmed Mayo Clinic D+Q senolytic discovery; details and senolysis mechanism preserved.
- **Justice 2019 *EBioMedicine* (PMID 30616998 [funder: public]):** Confirmed: 14 IPF patients, intermittent dasatinib 100 mg/day + quercetin 1,250 mg/day, 3 days/week × 3 weeks, with significant improvement in 6-minute walk distance, gait speed, and chair-stand time. Trial details added with specificity.
- **Bioavailability:** 2–5% figure supported by Walle 2004 review; added as the bioavailability anchor.
- **Sources:** Expanded from 3 → 4, all with PMIDs.

### 141 — HMB for Muscle After 50: Why Older Adults Need It Most  *(Breakthrough)*
- **Status:** Material correction — fictitious citation replaced with real meta-analyses.
- **Fact-check error caught:** Original article cited a **"2025 meta-analysis published in the *Journal of Cachexia, Sarcopenia and Muscle*** (Bear DE et al.) … 16 randomized controlled trials (1,418 participants aged 60+) … HMB at 3 g/day significantly preserved lean body mass (SMD 0.35) and improved leg strength (SMD 0.28)." **No such 2025 paper exists.** The actual Bear et al. meta-analysis is from **2019** in the **American Journal of Clinical Nutrition** (PMID 30982854 [funder: none_disclosed]) and pooled **15 RCTs, 2,137 patients across mixed clinical conditions** with **SMD 0.25 for muscle mass** (95% CI −0.00 to 0.50) and **SMD 0.31 for muscle strength** (95% CI 0.12–0.50) — not 0.35 and 0.28.
  - Replaced the fabricated 2025 citation with the actual Bear 2019 AJCN paper.
  - Added **Lin et al. 2020 *European Geriatric Medicine* (PMID 33034021 [funder: none_disclosed])** as the more older-adult-specific meta-analysis: 9 RCTs, 448 older adults, FFM SMD 0.37 (95% CI 0.16–0.58), with the strongest effect when HMB is given as the sole intervention (rather than added to structured exercise).
  - Updated the chart row "Strength (1RM)" annotation from the fictitious "+10–12%" to "SMD ~0.31" to match the real Bear AJCN result.
- **Deutz 2013 *Clin Nutr* (PMID 23514626 [funder: none_disclosed]):** Confirmed: ~24 enrolled, 19 evaluable per-protocol, ~2 kg LBM loss in placebo prevented by HMB 3 g/day during 10 days bed rest. Tightened the participant N to match the published trial.
- **5% leucine→HMB conversion:** Standard cited figure (Van Koevering & Nissen 1992); kept.
- **Sources:** Expanded from 3 → 5.

### 142 — St. John's Wort: Europe's Most-Studied Herbal Antidepressant  *(Guide — extra rigor for drug-interaction content)*
- **Status:** Citation correction + safety rewrite. Drug-interaction section expanded with regulatory references.
- **Fact-check error caught:** Original text cited "Linde et al., updated 2023" for the Cochrane meta-analysis. **There is no 2023 Cochrane update.** The latest Cochrane review is **Linde et al., 2008** (PMID 18843608 [funder: none_disclosed · COI]; 29 trials, 5,489 patients). Removed the false "(updated 2023)" attribution. Total trials/patients now reflect the actual published Cochrane review.
- **Ng 2017 *Journal of Affective Disorders* (PMID 28064110 [funder: none_disclosed]):** Confirmed: 27 trials, 3,808 patients comparing St. John's Wort with SSRIs; comparable efficacy, lower dropout. Used as the more recent SSRI-comparison anchor.
- **Borrelli & Izzo 2009 *AAPS Journal* (PMID 19859815 [funder: none_disclosed]):** Confirmed comprehensive herb–drug interaction review. Used to anchor the expanded interaction list (oral contraceptives, cyclosporine, tacrolimus, antiretrovirals, anticancer agents, warfarin, SSRIs/serotonin syndrome).
- **Severe-depression null finding:** Added the **Hypericum Depression Trial Study Group, *JAMA*, 2002 (PMID 11926934 [funder: public] [funder: public])** as the explicit citation — 340 outpatients with at least moderate-severity major depression; neither sertraline nor St. John's Wort separated from placebo on primary outcomes.
- **Regulatory context:** Added FDA Public Health Advisory (Feb 2000; indinavir/cyclosporine interactions) and EMA HMPC assessment as authoritative supporting references.
- **Sources:** Expanded from 3 → 6 to apply extra-rigor sourcing for a high-stakes drug-interaction article (mix of peer-reviewed Cochrane/meta-analyses, primary trial, regulator guidance, and a comprehensive interactions review).

---

## Verification

- All 10 article bodies (133–142) now contain a `<!-- last-reviewed: 2026-04-26 -->` comment at the top.
- Article 132 marker added (Batch 6 housekeeping; content unchanged).
- All 10 article-card meta dates updated to "Updated Apr 26, 2026" via `replace_card_meta`.
- Article 133 card description rewritten to remove the previously overstated "~25%" figure.
- HTML balance check on the 10 rewritten bodies: divs, paragraphs, and ordered lists balanced.
- `data.js` not modified — title, category, and minutes-read are unchanged for all 10 articles.
- Pre-existing `article-full` div / `<!-- end article- -->` comment count disparity is unchanged from the prior batch (not introduced by this run).
- Backup of original index.html written to `index.html.bak-batch7-20260426`.

## Open questions / items flagged for future batches

- The Mijnhout 2012 meta-analysis was sometimes cited in the original article corpus as covering "1,258 patients across four trials." That figure does not match the Mijnhout abstract; if other articles in the corpus reuse it, they should be reviewed against the actual paper.
- The fictitious "Bear 2025 / J Cachexia Sarcopenia Muscle / 16 RCTs" citation found in article 141 should be checked for in any other articles that reference HMB meta-analyses (article-level grep showed no other matches in this batch).
- The article on choline (137) implies that "MTHFR carriers" need higher choline as a clinical recommendation. Current evidence supports a mechanistic vulnerability but does not yet anchor a regulator-endorsed elevated AI for MTHFR carriers. The framing was tightened but the underlying nutrigenomics question remains an active research area.
- Articles in the corpus that reference the AAP melatonin/sleep policy should be revisited periodically as AAP guidance is updated.
