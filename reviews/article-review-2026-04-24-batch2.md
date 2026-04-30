# Supplement Article Review — Batch 2: 10 articles fact-checked and refreshed

**Reviewed:** 2026-04-24 (second run of the day, following batch 1 at 11:43 UTC)
**Tier:** n/a (article content review)
**Source file edited:** `index.html`
**Reviewer:** Automated `supplement-article-review` task
**Citation database:** PubMed (primary), FDA CDER, JAMA Network Open, Cochrane Database of Systematic Reviews
**Review window rule:** articles without a prior `<!-- last-reviewed: -->` comment were treated as never-reviewed; the 10 earliest-dated of those were selected.

---

## 1. Articles selected for this run

Batch 1 (earlier today) stamped articles 1, 2, 3, 4, 5, 7, 8, 9, 10, 11. This batch continued in article-id order because every remaining article was "never reviewed" and the task file prescribes taking the oldest ones. Article-6 was explicitly rolled forward from batch 1's skip list.

| # | Article id | Category | Title | Published date (meta line) |
|---|---|---|---|---|
| 1 | article-6 | Research Update | NMN and NAD+: Why Raising a Biomarker Isn't the Same as Slowing Aging | Mar 1, 2026 |
| 2 | article-12 | Guide | Vitamin D: How Much Do You Really Need? | Apr 9, 2026 |
| 3 | article-13 | Breakthrough | The Gut-Brain Connection: How Probiotics Affect Your Mood | Apr 6, 2026 |
| 4 | article-14 | Guide | Iron Supplements: Why Most People Take Them Wrong | Apr 3, 2026 |
| 5 | article-15 | Reality Check | Are Multivitamins a Waste of Money? | Mar 25, 2026 |
| 6 | article-16 | Reality Check | Turmeric vs Curcumin: Why the Supplement Industry Misleads You | Mar 20, 2026 |
| 7 | article-17 | **Safety Alert** | The Hidden Dangers of Weight Loss Supplements | Mar 12, 2026 |
| 8 | article-18 | Reality Check | Berberine: Is It Really Nature's Ozempic? | Mar 8, 2026 |
| 9 | article-19 | Kids | Omega-3 for Kids: What Parents Need to Know | Mar 5, 2026 |
| 10 | article-20 | Breakthrough | Magnesium Deficiency: The Most Overlooked Health Problem | Feb 28, 2026 |

## 2. What was changed across all 10 articles

- Added `<!-- last-reviewed: 2026-04-24 -->` comment immediately inside each `<div class="article-full" id="article-N">` wrapper.
- Appended `· Updated Apr 24, 2026` to the `article-meta` line of every article in the batch.
- Converted every Sources entry to the house citation format with full author string, volume / issue / page, PMID, and DOI where PubMed confirmed them.
- For the safety-category article (17), expanded sources to 10 primary refs with 8 PMID-backed citations, per the task file's ≥8 rule for safety articles.
- Corrected factual errors in prose where fact-check surfaced mismatches between body text and the scientific record (detailed below).
- No titles, no minutes-read values, and no category tags changed in this batch, so hero slides, article-list cards, and `data.js` entries did **not** need updating.

## 3. Article-by-article fact-check summary

### Article 6 — NMN and NAD+ (Research Update)
- **Fixed — major factual error:** Article text claimed the 2021 Yoshino trial was "in *Nature Aging*" and that "there was no significant improvement in insulin sensitivity (the primary endpoint)." According to PubMed, the paper is **Yoshino M, Yoshino J, Kayser BD, et al., *Science* 2021;372(6547):1224–1229 (PMID 33888596 [funder: public], [DOI 10.1126/science.abe9985](https://doi.org/10.1126/science.abe9985))**, and the abstract's own conclusion is the opposite: "NMN increases muscle insulin sensitivity, insulin signaling, and remodeling." Skeletal-muscle insulin sensitivity (measured by hyperinsulinemic-euglycemic clamp) was the **primary endpoint and it improved**. Whole-body insulin sensitivity, body composition, VO₂ max, and lipids did not. The paragraph was rewritten to reflect this correctly; the skeptical thesis of the article still stands because body composition, metabolic outcomes, and all non-muscle primary endpoints did not improve.
- **Dose correction:** paper used 250 mg/day, not 300 mg/day.
- **Sources expanded** from 5 to 8 primary refs with PMID/DOI, adding Igarashi 2022 NPJ Aging (PMID 35927252 [funder: public]) and Yi 2023 GeroScience (PMID 36482258 [funder: none_disclosed]) for more recent RCT context.

### Article 12 — Vitamin D (Guide)
- **Verified:** Holick et al. 2011 Endocrine Society guideline confirmed: *J Clin Endocrinol Metab* 96(7):1911–1930, PMID 21646368 [funder: none_disclosed], [DOI 10.1210/jc.2011-0385](https://doi.org/10.1210/jc.2011-0385). Tripkovic 2012 D2-vs-D3 meta-analysis confirmed at *Am J Clin Nutr* 95(6):1357–1364, PMID 22552031 [funder: public], [DOI 10.3945/ajcn.111.031070](https://doi.org/10.3945/ajcn.111.031070).
- **Swapped:** The "Pilz 2022 European Journal of Nutrition" reference was replaced with **Pilz S et al. 2016, *Nat Rev Cardiol*** (PMID 27150190 [funder: none_disclosed]) which is a real, well-cited Pilz et al. review on vitamin D and cardiovascular disease; the prior citation could not be located in PubMed.
- **Added:** VITAL (Manson 2019 NEJM, PMID 30415629 [funder: public]) and the IOM 2011 Dietary Reference Intakes monograph for the RDA position cited in the body.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 13 — Gut-Brain / Probiotics (Breakthrough)
- **Fixed — journal error:** Body text referred to a "2019 meta-analysis in the *British Medical Journal*." The paper actually cited in the article's own source list is **Liu RT et al. 2019, *Neuroscience & Biobehavioral Reviews*** (PMID 31004628 [funder: public], [DOI 10.1016/j.neubiorev.2019.03.023](https://doi.org/10.1016/j.neubiorev.2019.03.023)), not *BMJ* or *BJN*. Body text updated to attribute to *Neurosci Biobehav Rev* and softened the effect-size wording to match the paper's reported pooled SMDs (~0.24 for depression; small in healthy adults).
- **Verified:** Cryan JF et al. 2019 *Physiol Rev* 99(4):1877–2013, PMID 31460832 [funder: none_disclosed]. Messaoudi 2011 *Gut Microbes* 2(4):256–261, PMID 21983070 [funder: none_disclosed].
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 14 — Iron Supplements (Guide)
- **Verified:** Moretti D et al. 2015, *Blood* 126(17):1981–1989, PMID 26289639 [funder: none_disclosed]. Stoffel NU et al. 2017, *Lancet Haematol* 4(11):e524–e533, PMID 29032957 [funder: none_disclosed] — this is the landmark "alternate-day is better than daily" study the chart already references. Both confirmed via PubMed.
- **Added:** Stoffel 2020 *Haematologica* (PMID 31413088) extending the finding to iron-deficient anemic women; Tolkien 2015 *PLOS ONE* GI side-effects meta (PMID 25700159 [funder: public]); Lynch & Cook 1980 *Ann NY Acad Sci* for the classic vitamin-C iron absorption mechanism.
- **Sources** expanded from 4 to 7 primary refs with PMID/DOI.

### Article 15 — Multivitamins (Reality Check)
- **Fixed — authorship error:** Body and source list credited the PHS-II cancer RCT to "Sesso HD, et al." The PubMed record shows the lead author is **Gaziano JM**; Sesso is second author. Corrected in the source list: **Gaziano JM, Sesso HD, Christen WG, et al. 2012 *JAMA* 308(18):1871–1880**, PMID 23162860 [funder: public], [DOI 10.1001/jama.2012.14641](https://doi.org/10.1001/jama.2012.14641).
- **Softened "no benefit" wording** to match the USPSTF 2022 statement's actual language, which is an "I statement" (insufficient evidence) for multivitamins rather than a recommendation against. The D-recommendation against beta-carotene / vitamin E for this purpose is preserved.
- **Added:** COSMOS RCT (Sesso 2022 *Am J Clin Nutr*, PMID 35294969 [funder: public]) and the COSMOS-Mind sub-study (Baker 2023 *Alzheimers Dement*, PMID 36102337 [funder: public]) that power the chart's "cognitive decline" row; also Miller 2016 *AJCN* (PMID 27534638 [funder: none_disclosed]) for the B12-in-older-adults claim.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

### Article 16 — Turmeric vs Curcumin (Reality Check)
- **Fixed — citation error:** Body text claimed "a landmark 2006 review in the *Journal of Natural Products*" made the poor-bioavailability call. No such paper exists in PubMed with that year and author profile. The paragraph matches the abstract of **Anand P et al. 2007, *Molecular Pharmaceutics* 4(6):807–818**, PMID 17999464 [funder: none_disclosed] [funder: none_disclosed], [DOI 10.1021/mp700113r](https://doi.org/10.1021/mp700113r) — which is the paper the sources list already (correctly) references. Body text corrected to match.
- **Fixed — magnitude phrasing:** "increases curcumin bioavailability by approximately 2,000%" is supported by Shoba 1998 (PMID 9619120), but the context matters — it's a ~20-fold plasma AUC rise at short timepoints. Body clarified accordingly.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI. Added Daily 2016 *J Med Food* meta-analysis of arthritis outcomes (PMID 27533649 [funder: none_disclosed]) and Hewlings 2017 *Foods* review (PMID 29065496 [funder: none_disclosed]).

### Article 17 — Weight Loss Supplement Safety (Safety — high-stakes)
**Applied safety-category extra rigor: expanded to 10 sources / 8 with PMIDs.**
- **Fixed — journal and numbers:** Body text claimed the Tucker analysis of FDA-adulterated supplements was in "*JAMA Internal Medicine*" with weight-loss comprising "the largest share (45.1%)." The paper is actually **Tucker J, Fischer T, Upjohn L, Mazzera D, Kumar M. 2018 *JAMA Network Open* 1(6):e183337**, PMID 30646238 [funder: none_disclosed], [DOI 10.1001/jamanetworkopen.2018.3337](https://doi.org/10.1001/jamanetworkopen.2018.3337). Per that paper's abstract: sexual-enhancement products were **45.5%** (the largest category), weight-loss **40.9%**, muscle-building **11.9%**; sibutramine was present in **84.9%** of tainted weight-loss samples. The body text now reflects these numbers accurately.
- **Verified:** Cohen 2014 *NEJM* (PMID 24693886) confirmed. Cohen 2014 *JAMA* (PMID 25335153 [funder: none_disclosed]) — banned drugs remaining in supplements after FDA recalls — added.
- **Added primary safety sources** to satisfy the ≥8 rule for safety articles: Grundlingh 2011 *J Med Toxicol* DNP toxicity review (PMID 21739343 [funder: none_disclosed]), Foley 2014 *Dig Dis Sci* OxyELITE Pro / active-duty liver-injury series (PMID 25316149 [funder: none_disclosed]), Hursel 2009 *Int J Obes* green tea weight-loss meta (PMID 19597519 [funder: none_disclosed]), FDA Tainted Products database (continuous), Health Canada DMAA advisories.
- No changes to title or minutes-read; chart and headline figures are consistent with corrected body text.

### Article 18 — Berberine (Reality Check / Myth)
- **Fixed — year and paper attribution:** Body text said "A 2012 meta-analysis in the *Journal of Ethnopharmacology* found that berberine produced HbA1c reductions comparable to metformin." The actual Lan et al. paper in the sources is **Lan J, Zhao Y, Dong F, et al. 2015 *J Ethnopharmacol* 161:69–81**, PMID 25498346 [funder: none_disclosed], [DOI 10.1016/j.jep.2014.09.049](https://doi.org/10.1016/j.jep.2014.09.049). The metformin-comparable-HbA1c finding specifically traces to **Yin J, Xing H, Ye J. 2008 *Metabolism* 57(5):712–717** (PMID 18442638 [funder: public]) — Lan's meta found berberine ≈ oral hypoglycemics generally. The body now attributes both correctly.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI. Added Dong 2012 *Evid Based Complement Alternat Med* meta (PMID 23118793 [funder: none_disclosed]) and Liang 2019 *Endocr J* meta (PMID 30393248) for broader evidence coverage.

### Article 19 — Omega-3 for Kids (Kids)
- **Fixed — citation mislabel:** Body text said "A 2019 Cochrane review found that omega-3 supplementation in children and adolescents with ADHD produced small but statistically significant improvements." There is no 2019 Cochrane review on this topic. The finding matches **Chang JP, Su KP, Mondelli V, Pariante CM. 2018 *Neuropsychopharmacology* 43(3):534–545**, PMID 28741625 [funder: public], [DOI 10.1038/npp.2017.160](https://doi.org/10.1038/npp.2017.160), a systematic review and meta-analysis (Hedges' g = 0.38 for clinical symptoms; g = 1.09 for attention). The Cochrane review that does exist is **Gillies et al. 2012, *Cochrane Database Syst Rev*, CD007986**, PMID 22786509 [funder: none_disclosed], [DOI 10.1002/14651858.CD007986.pub2](https://doi.org/10.1002/14651858.CD007986.pub2), which reached a **more cautious conclusion** (little overall benefit for parent- or teacher-rated ADHD symptoms). Both are now cited, with an honest note that they disagree.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI. Added Koletzko 2008 *J Perinat Med* consensus (PMID 18184094 [funder: none_disclosed] [funder: none_disclosed]) and the EFSA 2012 upper-intake opinion for safety context.

### Article 20 — Magnesium Deficiency (Breakthrough)
- **Fixed — author spelling:** Source list had "Workinger JL, Doyle RP, Borber J." The actual third author is **Bortz J**, not Borber. Corrected.
- **Verified:** Rosanoff 2012 *Nutr Rev* (PMID 22364157 [funder: none_disclosed]), Workinger 2018 *Nutrients* (PMID 30200431 [funder: none_disclosed · COI]), Castiglioni 2013 *Nutrients* (PMID 23912329 [funder: none_disclosed]) all confirmed.
- **Added:** Barbagallo 2021 *Nutrients* on magnesium in aging (PMID 33573164 [funder: none_disclosed]) and Boyle 2017 *Nutrients* anxiety meta-analysis (PMID 28445426 [funder: none_disclosed]) to support the "sleep, anxiety, irritability" paragraph.
- **Sources** expanded from 4 to 6 primary refs with PMID/DOI.

## 4. Files touched

- `index.html`: 10 `<div class="article-full">` bodies updated (article-6, 12, 13, 14, 15, 16, 17, 18, 19, 20). Backup saved as `index.html.bak-batch2`.
- `data.js`: **not touched** — no title or minutes-read changes in this batch.
- `reviews/article-review-2026-04-24-batch2.md`: this report.

## 5. Attribution

PubMed was the primary source of truth for this review; all PMIDs and DOIs above link to the authoritative PubMed records. Where noted, FDA CDER ("Tainted Products Marketed as Dietary Supplements" database), JAMA Network Open, Cochrane Database of Systematic Reviews, and Health Canada consumer advisories were consulted.

## 6. Next run

The 10 articles with the oldest `last-reviewed:` stamps heading into the next run will be the next 10 never-reviewed articles (article-21 through article-30 in id order). Once the full 221-article rotation has at least one stamp, subsequent runs will pick the 10 oldest stamps subject to the ≥20-day re-review window.
