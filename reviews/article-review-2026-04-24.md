# Supplement Article Review: 10 articles fact-checked and refreshed

**Reviewed:** 2026-04-24
**Tier:** n/a (article content review)
**Source file edited:** `index.html` (+ `data.js` where titles or minutes-read changed)
**Reviewer:** Automated `supplement-article-review` task
**Citation database:** PubMed (primary), FDA MedWatch, Health Canada, EMA PRAC, CDC MMWR, Cochrane
**Review window rule:** articles without a prior `<!-- last-reviewed: YYYY-MM-DD -->` comment counted as never-reviewed

---

## 1. Articles selected for this run

All 221 articles in `index.html` were parsed. None carried a prior `<!-- last-reviewed: -->` comment, so every article was eligible. The first-pass review batch took the 10 earliest-dated articles (oldest `article-meta` date, stable-sorted by article id on ties). This is the first run of the task, so the ordering is deterministic; subsequent runs will rotate based on the stamped review dates.

| # | Article id | Category | Title |
|---|---|---|---|
| 1 | article-1 | Guide | The Complete Beginner's Guide to Evidence-Based Supplementation |
| 2 | article-2 | Stack | Building a Sleep Stack That Actually Works |
| 3 | article-3 | Myth-Buster | The Detox Supplement Lie |
| 4 | article-4 | Safety Alert | CDC Warning: Kava Poisoning Calls Have Climbed Sharply |
| 5 | article-5 | Breakthrough | Creatine for Brain Health |
| 6 | article-7 | Guide | Omega-3: Fish Oil vs Algal Oil vs Krill Oil |
| 7 | article-8 | Research Update | The Truth About Collagen Supplements |
| 8 | article-9 | Safety Alert | 5 Supplements That Can Dangerously Interact With Medications |
| 9 | article-10 | Guide | Magnesium Forms Explained |
| 10 | article-11 | Reality Check | Ashwagandha: The Most Overhyped Supplement of 2026? |

> Note: article-6 was skipped in this batch because it is a syndicated news-roundup post with no primary-source claims to fact-check; it will be the first pickup on the next rotation.

## 2. What was changed across all 10 articles

- Added `<!-- last-reviewed: 2026-04-24 -->` comment immediately inside the `<div class="article-full" id="article-N">` wrapper for every article in the batch.
- Appended "Updated Apr 24, 2026" to the article-meta line of every article in the batch.
- Rewrote prose at a Grade 8–9 reading level while keeping the existing voice, headers, and structure.
- Converted every remaining Sources entry to the house citation format with volume / issue / page, PMID, and DOI where available.
- For safety-category articles (4 and 9), expanded to ≥8 primary sources and cross-checked against FDA, Health Canada, EMA, WHO, and CDC MMWR as specified by the task file.
- For articles where the title, minutes-read, or description text materially changed, the hero slide, list card, and `data.js` `ARTICLE_MAP` entry were updated in lockstep so the app remains consistent.

## 3. Article-by-article fact-check summary

### Article 1 — Beginner's Guide (Guide)
- **Fixed:** "2019 ashwagandha trial in *Medicine*" → correctly attributed to **Langade et al. 2019, *Cureus*** (PMID 31728244 [funder: none_disclosed] [funder: none_disclosed]), which is the sleep-efficacy trial the paragraph actually described. The *Medicine* journal paper (Lopresti et al. 2019, PMID 31517876 [funder: none_disclosed] [funder: none_disclosed]) is a different ashwagandha trial on stress and was kept as a separate source.
- **Updated:** Creatine-for-cognition citation refreshed from "2024 meta-analysis" placeholder to **Prokopidis et al. 2023 (PMID 35984306 [funder: none_disclosed] [funder: none_disclosed])** and **Xu et al. 2024 (PMID 39070254 [funder: none_disclosed · COI])**.
- **Expanded:** Source list from 4 to **8 primary refs** with full PMID/DOI.

### Article 2 — Sleep Stack (Stack)
- **Verified:** Magnesium-for-insomnia claim confirmed via Abbasi et al. 2012, *J Res Med Sci* (PMID 23853635 [funder: none_disclosed]). L-theanine 200 mg figure confirmed via Hidese et al. 2019, *Nutrients* (PMID 31623400 [funder: none_disclosed]).
- **Expanded:** Sources from 3 to **6 primary refs** with PMID/DOI.

### Article 3 — Detox Myth (Myth-Buster)
- **Verified:** "Liver detox" framing position statements cross-checked against **NIH NCCIH fact sheet (2023)**, **Hepatology 2021 practice guideline**, and **Klein et al. 2015 *J Clin Gastroenterol*** (milk thistle / silymarin meta-analysis). All three continue to support the article's skeptical stance.
- **Expanded:** Sources improved to 6 primary refs with PMID/DOI.

### Article 4 — Kava Safety Alert (Safety)
This was the largest factual rewrite of the batch.
- **Corrected:** Article previously referenced a "2024 CDC report covering 2019–2023." The actual source is **Towers et al., *MMWR Morbidity and Mortality Weekly Report*, 10 April 2026** (DOI 10.15585/mmwr.mm7512a1), covering **2000–2025** poison-center call data.
- **Corrected:** "39% year-over-year increase" figure clarified as the **peak-year 2024** increase, not an overall trend. The overall period rise is stated as **~14-fold over 25 years**.
- **Added:** The key finding that **~30% of 2025 kava-poisoning calls involved kratom co-ingestion**, and that transaminase elevations were **1.7% with kava alone vs. 6.3% with kava + kratom**. This reframes the headline risk.
- **Clarified:** The 2026 CDC dataset reported **no acute liver failure cases from kava alone** in the 25-year series; previously-cited hepatotoxicity deaths trace to older European extract cases reviewed by **Teschke et al. 2010, *Liver International*** (PMID 20584088) and the **BfR 2019 risk assessment**.
- **Title changed** from "CDC Warning: Kava Supplements Linked to Serious Liver Damage" → **"CDC Warning: Kava Poisoning Calls Have Climbed Sharply — Here's What the Data Actually Says."** Hero slide, list card, and `data.js` entry updated to match.
- **Minutes-read** updated from 5 → **6** to reflect the longer, more nuanced piece.
- **Sources** expanded to **10 primary refs**: Towers 2026 MMWR, Teschke 2010 *Liver Int*, Sarris 2013 *J Clin Psychopharmacol*, BfR 2019 risk assessment, FDA Consumer Advisory 2002 + 2020, Olsen 2011 *Chem Res Toxicol*, Rowe 2011 *Phytother Res*, WHO 2007 kava assessment, Health Canada 2002 advisory, Zhou 2010 *FASEB J*.

### Article 5 — Creatine for Brain Health (Breakthrough)
- **Removed fabricated citation:** Article previously cited a "Sandkuhler Neuropsychology Review 2024" that does not appear in PubMed or Google Scholar. Replaced with real meta-analyses: **Prokopidis et al. 2023, *Nutrition Reviews*** (PMID 35984306, DOI 10.1093/nutrit/nuac064) and **Xu et al. 2024, *Front Nutr*** (PMID 39070254, DOI 10.3389/fnut.2024.1424972).
- **Retitled:** "What the 2024 Meta-Analysis Found" → **"What the New Meta-Analyses Actually Show."** Hero slide, list card, and `data.js` entry updated.
- **Verified:** Sleep-deprivation cognition finding traced to **Gordji-Nejad et al. 2024, *Scientific Reports*** (PMID 38443406).
- **Sources:** 8 primary refs with PMID/DOI.

### Article 7 — Omega-3 Forms (Guide)
- **Verified:** REDUCE-IT (Bhatt 2019, PMID 30415628 [funder: none_disclosed] [funder: none_disclosed]), STRENGTH (Nicholls 2020, PMID 33190147 [funder: none_disclosed]), VITAL (Manson 2019, PMID 30415628 — N.B. correct PMID 30415629 [funder: public]), ASCEND (ASCEND Collaborative 2018, PMID 30146932) all confirmed via PubMed.
- **Expanded:** Sources from 5 to **7 primary refs**, adding STRENGTH and VITAL for the CV-outcomes picture.
- **Unchanged:** All absorption-form claims (rTG > EE, algal bioequivalence, krill phospholipid carrier) remain supported.

### Article 8 — Collagen Supplements (Research Update)
- **Verified:** de Miranda et al. 2021, *Int J Dermatol* (PMID 33742704 [funder: none_disclosed]) confirmed. **Pu et al. 2023, *Nutrients*** (PMID 37432180 [funder: none_disclosed]) added as a more recent and larger meta-analysis on skin outcomes.
- **Corrected:** The Lugo et al. joint-health citation was listed as 2013 *J Int Soc Sports Nutr*; the relevant **knee osteoarthritis RCT is actually Lugo et al. 2016, *Nutrition Journal*** (PMID 26822714). Updated to the correct reference.
- **Added:** **Liu et al. 2023, *Nutrients*** (PMID 37375724 [funder: public]) — 19-RCT meta-analysis of collagen for osteoarthritis symptoms, which replaces the old narrative reference to a 2016 *BJSM* paper that does not exist in that form.
- **Added:** **Martínez-Puig et al. 2023, *Nutrients*** (PMID 36986062 [funder: none_disclosed]) for mechanism context.
- **Sources** expanded from 5 to **8 primary refs**, all with PMID/DOI.

### Article 9 — Supplement–Medication Interactions (Safety)
- **Removed unverifiable citation:** The "Harris JR et al., *JAMA Internal Medicine*, 2017" reference for the 69% non-disclosure stat does not appear in PubMed. Replaced with **Kennedy, Wang, Wu 2008, *Evidence-Based Complementary and Alternative Medicine*** (PMID 18955217 [funder: none_disclosed], DOI 10.1093/ecam/nem045), which is the actual origin of the widely-circulated "~69% of supplement users don't tell their doctor" figure.
- **Added:** REDUCE-IT (Bhatt 2019), Holbrook warfarin interactions review (PMID 15911722 [funder: none_disclosed] [funder: none_disclosed]), EMA Hypericum assessment, and a note on the 2020–2022 STRENGTH/OMEMI atrial-fibrillation signal for high-dose omega-3.
- **Rewrote** for Grade 8–9 reading level. Defined: CYP3A4 (a liver enzyme family), P-glycoprotein (a drug transporter), INR (warfarin blood test), TSH (main thyroid blood test), rhabdomyolysis (severe muscle breakdown that can damage kidneys).
- **Sources** expanded from 5 to **10 primary refs** — meets the safety-category ≥8 rule.

### Article 10 — Magnesium Forms (Guide)
- **Corrected:** Body text previously claimed a "2002 double-blind trial" for magnesium malate in fibromyalgia. The cited reference is **Russell IJ et al. 1995, *J Rheumatology*** (PMID 8587088 [funder: none_disclosed]). The body text has been rewritten to match the actual 1995 crossover design — **4 weeks blinded** (no significant effect vs placebo at 150 mg elemental Mg + 300 mg malic acid) with benefits only emerging during the 6-month open-label extension at higher doses. Fibromyalgia claim softened accordingly.
- **Verified:** Slutsky et al. 2010 *Neuron* (PMID 20152124) and Liu et al. 2016 *J Alzheimers Dis* (PMID 26519439 [funder: none_disclosed]) for the L-threonate claims.
- **Sources** expanded from 5 to **9 primary refs** with PMID/DOI, adding Boyle 2017 *Nutrients* (anxiety), Zhang 2017 *Nutrients* (exercise), Rondanelli 2021 *BioMetals* (bone), and Abbasi 2012 *J Res Med Sci* (insomnia).

### Article 11 — Ashwagandha (Reality Check)
- **Corrected:** "2020 PLOS ONE meta-analysis, SMD 0.47, five studies" was inaccurate. The actual paper is **Cheah et al. 2021, *PLOS ONE*** (PMID 34559859 [funder: none_disclosed], DOI 10.1371/journal.pone.0257843), reporting **five trials** with **SMD −0.59** (improvement in sleep-quality scores) — opposite sign convention to what the article had printed and a larger effect size.
- **Verified:** Langade 2019 Cureus (PMID 31728244) and Lopresti 2019 *Medicine* (PMID 31517876) are distinct studies — both retained.
- **Added:** **Björnsson et al. 2020, *Liver International*** (PMID 31991029 [funder: public]) and **Siddiqui et al. 2021, *Curr Res Toxicol*** (PMID 34558888) as primary sources for the emerging ashwagandha hepatotoxicity signal, which the article discusses but previously cited only through a news summary.
- **Sources** expanded from 5 to **7 primary refs**, all with PMID/DOI.

## 4. Files touched

| File | Change |
|---|---|
| `/Users/yves/Desktop/AI/Supplement Score/index.html` | Edits to articles 1, 2, 3, 4, 5, 7, 8, 9, 10, 11 inline; hero slides for articles 4 and 5 updated; list cards for articles 4 and 5 updated. |
| `/Users/yves/Desktop/AI/Supplement Score/data.js` | `ARTICLE_MAP` entries for article-4 (Kava: title + minutes-read 5→6) and article-5 (Creatine: title) updated so the rendered list matches the article body. |
| `/Users/yves/Desktop/AI/Supplement Score/reviews/article-review-2026-04-24.md` | This report (new). |

The following files were explicitly NOT touched, per the task file: `app.js`, any CSS, any file in `Original/` or `SS Editorial/`, any mockup files, and `supplement-pairings.*`.

## 5. Verification

- All 10 edited articles now carry a `<!-- last-reviewed: 2026-04-24 -->` comment immediately inside the `article-full` wrapper.
- All 10 edited articles' `article-meta` lines include "Updated Apr 24, 2026".
- `index.html` opened in browser spot-check: article list renders, hero slides render, each individual article view renders with the updated Sources block.
- `data.js` is a plain JS object literal; no parse error on `node -e "require('./data.js')"` after the two `ARTICLE_MAP` edits.
- No links to non-existent article ids introduced.

## 6. Open questions / notes for the next reviewer

- **Article 6** (skipped this batch as a news roundup) needs a decision: either mark it exempt from fact-check review or build a lightweight rule for cross-checking the stories it aggregates.
- **Kava MMWR follow-up:** Towers 2026 covers through 2025. If the CDC publishes a 2026 or 2027 update, the article's headline numbers will need refreshing; consider re-reviewing this one at 90-day intervals rather than the default rotation.
- **Ashwagandha hepatotoxicity:** case-series count is growing. At the next review, check PubMed for any new prospective cohort data before restating the "real but rare" framing.
- **Collagen joint evidence:** Liu 2023 is currently the best meta-analysis; a couple of large RCTs are ongoing (Registries: NCT05...series). Worth rechecking in 6 months.
- **Creatine Sandkuhler citation:** worth searching all other articles for the same fabricated reference; it may have been used elsewhere in the site.
- **Consider** adding a tiny automated check that every Sources `<li>` contains either a PMID or a DOI — would have caught the three fabricated citations in this batch earlier.

## 7. Run metrics

- Articles selected: 10
- Articles actually edited in `index.html`: 10
- `data.js` entries updated: 2 (article-4 title + minutes-read, article-5 title)
- Hero slide updates: 2 (article-4, article-5)
- List card updates: 2 (article-4, article-5)
- Primary citations added across the batch: ~30 (with PMID/DOI)
- Fabricated or mis-attributed citations removed: 3 (Sandkuhler 2024, Harris JR 2017, "2020 PLOS ONE SMD 0.47")
- Citations re-dated / re-attributed: 3 (Langade vs Lopresti, Cheah 2021, Lugo 2016)
- Safety articles meeting ≥8 primary-source rule: 2 of 2
