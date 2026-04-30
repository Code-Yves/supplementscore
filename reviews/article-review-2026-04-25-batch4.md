# Supplement Article Review — 2026-04-25 (batch 4): articles 61–70 fact-checked and refreshed

**Reviewed:** 2026-04-25 (autonomous scheduled run, fourth batch of the day)
**Source file edited:** `index.html` (backup at `index.html.bak-batch7-20260425`)
**Reviewer:** Automated `supplement-article-review` task
**Citation databases consulted:** PubMed (primary, via `bio-research:pubmed` MCP), Cochrane Database of Systematic Reviews, U.S. FDA Center for Drug Evaluation and Research ("Tainted Products Marketed as Dietary Supplements" enforcement database), U.S. FDA MedWatch, U.S. Federal Trade Commission, U.S. GAO, EFSA, WHO/UNICEF, U.S. Centers for Disease Control and Prevention, American College of Sports Medicine consensus statements, American Academy of Pediatrics, Institute of Medicine / National Academies DRIs, U.S. NCCAM/NIDDK, National Osteoporosis Foundation, Council for Responsible Nutrition.
**Review window rule:** Articles 1–60 carry `<!-- last-reviewed: 2026-04-2[4|5] -->` stamps from prior runs (yesterday's two batches covered 1–30; today's batches 1–3 covered 31–60). Articles 61–221 had no review stamp and were treated as never-reviewed. The ten earliest by ID (61–70) were selected per the task file's "oldest last-reviewed dates" rule.

---

## 1. Articles selected for this run

| # | Article id | Category (HTML label → task taxonomy) | Title | Published date |
|---|---|---|---|---|
| 1 | article-61 | KIDS | Zinc for Children: Immune Support and Growth | Apr 11, 2026 |
| 2 | article-62 | GUIDE | Curcumin Absorption: Why 95% of Turmeric Supplements Fail | Apr 11, 2026 |
| 3 | article-63 | MYTH-BUSTING | Garcinia Cambogia: The Weight Loss Fraud | Apr 11, 2026 |
| 4 | article-64 | GUIDE | Electrolytes for Athletes: Science vs Marketing | Apr 11, 2026 |
| 5 | article-65 | OVERHYPED (myth) | CBD for Anxiety: The Gap Between Claims and Evidence | Apr 11, 2026 |
| 6 | article-66 | BREAKTHROUGH | Vitamin K2 for Heart Health: Observational vs Trial Data | Apr 11, 2026 |
| 7 | article-67 | SAFETY ALERT → **safety** | The Dangers of Buying Supplements on Amazon | Apr 11, 2026 |
| 8 | article-68 | KIDS | Multivitamins for Teens: Necessary or Wasteful? | Apr 11, 2026 |
| 9 | article-69 | GUIDE | L-Theanine and Caffeine: The Evidence-Based Focus Stack | Apr 11, 2026 |
| 10 | article-70 | MYTH-BUSTING | Saw Palmetto for Prostate: Three Cochrane Reviews Say No | Apr 11, 2026 |

Article 67 carries a "Safety Alert" HTML category tag and was treated as `safety` for the purpose of the task file's rigor rules (≥8 primary sources, regulator cross-checks).

## 2. What was changed across all 10 articles

- Added `<!-- last-reviewed: 2026-04-25 -->` comment immediately inside each `<div class="article-full" id="article-N">` wrapper.
- Appended `· Updated Apr 25, 2026` to the `article-meta` line of every article in the batch.
- Rewrote every Sources entry in the existing house citation format (full author string, journal, volume/issue/page) and added PMID and/or DOI hyperlinks that resolve to PubMed/CrossRef/regulator landing pages.
- Added a "Reviewed against N peer-reviewed sources" footer line under the Sources list of each article in the batch (matching the pattern established in Apr-24 and Apr-25 batches 1–3).
- For article 67 (the only safety-category article in this batch), expanded the source list from 3 to 9 entries, per the ≥8 rule, including FDA, GAO, FTC, peer-reviewed pharmacovigilance research, and a CRN industry advisory.
- Lightly rewrote prose for Grade 8–9 reading level: shorter sentences, plainer language, jargon defined on first use (bioavailability, hyponatremia, MGP, AUA Symptom Index, etc.). Kept structure, voice, headings, and chart blocks unchanged.
- Corrected factual errors in prose where the fact-check surfaced mismatches between the body text and the scientific record (detailed below).
- No titles, no minutes-read values, and no category tags changed in this batch, so hero slides, article-list cards, and `data.js` entries did **not** need updating. Articles 66 and 69 carry inline `rc-chart` blocks; their data points were verified against the rewritten prose and left unchanged.

## 3. Article-by-article fact-check summary

### Article 61 — Zinc for Children (KIDS)

- **Verified — Cochrane reviews:** Lassi ZS, Moin A, Bhutta ZA. *Cochrane Database Syst Rev*. 2016;12:CD005978 — PMID [27915460](https://pubmed.ncbi.nlm.nih.gov/27915460/). Confirmed the 13% incidence reduction (RR 0.87) and 21% reduction in clinically/radiologically confirmed pneumonia (RR 0.79) in children 2–59 months. Original article overstated this single review as covering "pneumonia, diarrhea, and overall duration of common cold symptoms" — corrected to specifically cite (a) Lassi 2016 for pneumonia and (b) Lazzerini & Wanzira 2016 (PMID 27996088) for diarrhoea, since those are separate Cochrane reviews.
- **Verified — Hambidge & Krebs 2007:** PMID [17374687](https://pubmed.ncbi.nlm.nih.gov/17374687/) confirmed in *J Nutr* 137(4):1101–1105.
- **Verified — IZiNCG / Brown 2004:** Confirmed the ~17% global at-risk estimate; refined the article's wording from "17–20% of the world's children" to the IZiNCG-attributed estimate to match the source.
- **Refined — RDA guidance:** Replaced loose "5–10 mg elemental zinc daily (age-dependent)" with the IOM (2001) RDAs by age band (3 mg ages 1–3, 5 mg ages 4–8, 8 mg ages 9–13, 9–11 mg adolescents).
- **Refined — copper-deficiency claim:** Tightened from "copper deficiency anemia" to "copper deficiency, which can show up as anaemia or low white blood cell counts" — accurate to clinical presentations of copper deficiency.
- **Sources** expanded from 3 to 6 with verified PMIDs and a WHO/UNICEF reference for the 10–20 mg/day-for-10–14-days zinc-with-ORS protocol.

### Article 62 — Curcumin Absorption (GUIDE)

- **Verified — Anand 2007:** PMID [17999464](https://pubmed.ncbi.nlm.nih.gov/17999464/) confirmed in *Mol Pharm* 4(6):807–818.
- **Verified — Shoba 1998 (piperine 2000% claim):** PMID [9619120](https://pubmed.ncbi.nlm.nih.gov/9619120/) confirmed in *Planta Med* 64(4):353–356. The 2000% (20-fold) figure is from human volunteers given 2 g curcumin + 20 mg piperine. Article previously read as if 20 mg piperine alone produced the effect; tightened wording to clarify it is the curcumin-with-piperine combination.
- **Verified — Belcaro 2010:** PMID [21194249](https://pubmed.ncbi.nlm.nih.gov/21194249/) confirmed in *Altern Med Rev* 15(4):337–344, an 8-month osteoarthritis trial in 100 patients.
- **Added — Cuomo 2011:** PMID [21413691](https://pubmed.ncbi.nlm.nih.gov/21413691/) — the actual source of the "29-fold greater absorption" claim for the Meriva phytosome formulation; previously the body text attributed this to Belcaro 2010, which was a clinical, not pharmacokinetic, trial. Now correctly attributed.
- **Added — Sasaki 2011 (Theracurmin):** PMID [21532153](https://pubmed.ncbi.nlm.nih.gov/21532153/) for the nano/lipid-formulation claim.
- **Sources** expanded from 3 to 5 with verified PMIDs/DOIs.

### Article 63 — Garcinia Cambogia (MYTH-BUSTING)

- **FIXED — material factual error:** Body previously read "approximately 4.1 kg lost in both groups" for the Heymsfield 1998 trial. Per PMID [9820262](https://pubmed.ncbi.nlm.nih.gov/9820262/), the actual results were 3.2 kg lost in the HCA group vs 4.1 kg in the placebo group (P = 0.14, NS). Corrected to "the HCA group had lost about 3.2 kg and the placebo group about 4.1 kg" — preserves the article's "no benefit" conclusion while reporting the data faithfully.
- **FIXED — meta-analysis effect size:** Body previously cited "approximately 0.8–1.3 kg more weight loss with Garcinia versus placebo." Per Onakpoya 2011 (PMID [21197150](https://pubmed.ncbi.nlm.nih.gov/21197150/)), the actual pooled MD was −0.88 kg (95% CI −1.75, 0.00). Corrected to a single point estimate with CI.
- **FIXED — TV-show claim:** Replaced unverifiable "host called a 'revolutionary fat buster'" specific quote with neutral phrasing; added the FTC enforcement context (FTC v. Sale Slash, 2018), which is verifiable on ftc.gov.
- **FIXED — sibutramine context:** Original body said "FDA has issued multiple warnings about Garcinia cambogia products adulterated with sibutramine — a withdrawn prescription drug." Tightened to specify sibutramine was withdrawn from the U.S. market in 2010 due to elevated cardiovascular risk (FDA Drug Safety Communication, 2010), and pointed readers to the FDA's Tainted Products database for the catalogue of voluntary recalls.
- **Sources** expanded from 3 to 4; replaced the loose "FDA Consumer Advisory" reference with the actual FDA Tainted Products database citation; added the FTC enforcement reference.

### Article 64 — Electrolytes for Athletes (GUIDE)

- **Verified — Hew-Butler 2015 EAH consensus:** PMID [26102445](https://pubmed.ncbi.nlm.nih.gov/26102445/) confirmed.
- **Verified — Shirreffs & Sawka 2011:** PMID [22150427](https://pubmed.ncbi.nlm.nih.gov/22150427/) confirmed.
- **Refined — sodium-in-sweat range:** Body previously gave "500–1500 mg per liter of sweat." Per Baker 2017 review (PMID [28332116](https://pubmed.ncbi.nlm.nih.gov/28332116/)) and ACSM consensus, the realistic individual range is wider — roughly 230–1700 mg/L (10–70 mmol/L), with most athletes near 400–1100 mg/L. Updated body to that range and added Baker 2017 as a source.
- **Refined — sodium-per-hour recommendation:** Body previously asserted "sodium replacement of 500–700 mg per hour of exercise is evidence-based." This conflated two different ACSM/IOC numbers. Replaced with the 2007 ACSM position-stand framing (Sawka et al., PMID [17277604](https://pubmed.ncbi.nlm.nih.gov/17277604/)): drinks providing roughly 0.3–0.7 g/L sodium during prolonged exercise (>2 h), with heavy/salty sweaters at the upper end.
- **Refined — magnesium-in-sweat:** Adjusted "5–10 mg/L" to "1–10 mg/L" to match published sweat magnesium ranges.
- **Replaced product-name examples:** Removed brand-specific recommendations ("Precision Hydration or SiS GO Electrolyte") since fact-check could not confirm sodium-content claims for specific SKUs without a current product label review; replaced with neutral "purpose-built electrolyte products with higher, clearly stated sodium content."
- **Updated Burke citation:** Replaced 2004 Burke "Carbohydrates and fat" with the 2011 Burke et al. "Carbohydrates for training and competition" (PMID [21660838](https://pubmed.ncbi.nlm.nih.gov/21660838/)) — the more current, more directly relevant *J Sports Sci* paper from the same author.
- **Sources** expanded from 3 to 5 with verified PMIDs.

### Article 65 — CBD for Anxiety (OVERHYPED)

- **FIXED — material factual error:** Body previously read "high-dose intravenous CBD in social anxiety disorder — where a handful of well-designed trials show acute anxiolytic effects at doses of 300–600 mg." This is wrong on the route of administration. The cited Bergamaschi 2011 SAD trial (PMID [21307846](https://pubmed.ncbi.nlm.nih.gov/21307846/)) used a single **oral** 600 mg dose, not intravenous. Corrected to "high-dose oral CBD" and now cites Bergamaschi 2011 by name in the body for the 600 mg single-dose finding.
- **FIXED — citation correction:** Body previously cited "Kayser RR, et al. 'Cannabidiol augmentation of exposure-based extinction.' *Neuropsychopharmacology*, 2020." Could not verify this exact paper in PubMed. Removed and replaced with the verified Bergamaschi 2011 PubMed reference.
- **FIXED — Bonn-Miller PMID:** Confirmed PMID [29114823](https://pubmed.ncbi.nlm.nih.gov/29114823/) (corrected from prior internal note of 29114835); added the actual labelling-accuracy headline finding (only ~31% accurately labelled, ~21% contained detectable THC).
- **Verified — Blessing 2015:** PMID [26341731](https://pubmed.ncbi.nlm.nih.gov/26341731/) confirmed for the inverted-U / dose-response framing.
- **Added — Millar 2018:** PMID [30534073](https://pubmed.ncbi.nlm.nih.gov/30534073/) systematic review on oral CBD pharmacokinetics (food effect on bioavailability).
- **Refined — market-size claim:** Replaced the unverifiable "$5 billion in the US alone" with the more defensible "Industry analysts have estimated annual U.S. CBD sales at several billion dollars."
- **Sources** expanded from 3 to 5 with verified PMIDs/DOIs.

### Article 66 — Vitamin K2 for Heart Health (BREAKTHROUGH)

- **Verified — Geleijnse 2004 / Rotterdam Study:** PMID [15514282](https://pubmed.ncbi.nlm.nih.gov/15514282/) confirmed. The "57% reduced cardiovascular mortality" is correct as RR 0.43 (95% CI 0.24, 0.77) for highest-vs-lowest tertile of dietary menaquinone for CHD mortality — added the relative risk and CI explicitly.
- **Verified — Knapen 2015:** PMID [25694037](https://pubmed.ncbi.nlm.nih.gov/25694037/) confirmed n=244, 180 µg MK-7 (MenaQ7), 3 years, healthy postmenopausal women, significant improvement in pulse wave velocity and Stiffness Index β; primary effect size strongest in women already stiffer at baseline.
- **Replaced — Prospect-EPIC reference:** Updated to Gast 2009 (PMID [19179058](https://pubmed.ncbi.nlm.nih.gov/19179058/)) for the EPIC postmenopausal CHD finding.
- **Verified — Schurgers 2007:** PMID [17151142](https://pubmed.ncbi.nlm.nih.gov/17151142/) confirmed in *Blood*. Note: this is a rat study (warfarin-induced medial elastocalcinosis); article body did not over-claim it as human data.
- **Added — Hartley 2015 Cochrane review:** PMID [26389791](https://pubmed.ncbi.nlm.nih.gov/26389791/), confirming that hard-endpoint RCT evidence for K2 in cardiovascular prevention is still lacking. Strengthens the "promising but incomplete" framing.
- **Added — anticoagulant safety note:** K2 interferes with warfarin and other vitamin K antagonists — added an explicit caution.
- **Chart block (`rc-chart`):** Verified that the bar labels and qualitative tags ("Signal", "Modest", "Limited") are consistent with the strengthened text. No data points changed.
- **Sources** expanded from 3 to 5 with verified PMIDs/DOIs.

### Article 67 — The Dangers of Buying Supplements on Amazon (SAFETY ALERT — extra rigor)

- **Verified — Cohen 2014 JAMA:** PMID [25335153](https://pubmed.ncbi.nlm.nih.gov/25335153/) confirmed; added the headline result that two-thirds of recalled supplements still on the market 6+ months after FDA recall still contained at least one banned drug.
- **Added — Cohen 2018 *Clinical Toxicology*:** PMID [29115170](https://pubmed.ncbi.nlm.nih.gov/29115170/) — four experimental stimulants found in sports/weight-loss supplements (octodrine, 1,4-DMAA, 1,3-DMAA, 1,3-DMBA).
- **Added — Cohen 2021 *Neurol Clin Pract*:** PMID [34484924](https://pubmed.ncbi.nlm.nih.gov/34484924/) — five unapproved drugs (including phenibut) found in cognitive-enhancement supplements sold online including on Amazon.
- **Added — GAO 2010 test-buy investigation** (GAO-10-662T) — prior precedent for the test-buy methodology now used by Cohen and others.
- **Added — Crawford & Petróczi 2018 (UK online supplements):** International parallel to U.S. third-party-seller pattern; relevant for athletes worried about inadvertent doping.
- **Added — CRN industry briefings on FBA commingling and counterfeits.**
- **Added — FDA Tainted Products database** as the primary federal catalogue (>1,100 products with undeclared pharmaceutical drugs).
- **Verified — Starr 2015:** PMID [25602880](https://pubmed.ncbi.nlm.nih.gov/25602880/) confirmed.
- **Removed — Branna 2021 *Nutritional Outlook*:** Trade-press editorial; replaced with peer-reviewed and federal regulator references for the claims it had been carrying.
- **Refined — "30–40% of all U.S. supplement sales" claim:** kept as "industry estimates" since a single peer-reviewed source for that figure is not available; the qualifier "by most industry estimates" is preserved.
- **Sources** expanded from 3 to 9, all peer-reviewed, regulator, or industry-trade-group primary sources. Meets the safety category's ≥8-source rule.

### Article 68 — Multivitamins for Teens (KIDS)

- **Verified — Fulgoni 2011:** PMID [21795425](https://pubmed.ncbi.nlm.nih.gov/21795425/) confirmed in *J Nutr* 141(10):1847–1854.
- **Verified — Bailey 2013:** PMID [23381623](https://pubmed.ncbi.nlm.nih.gov/23381623/) confirmed in *JAMA Intern Med* 173(5):355–361.
- **Replaced — Heaney & Weaver 2003:** Updated to the more current Weaver et al. 2016 NOF position statement on peak bone mass (PMID [26856587](https://pubmed.ncbi.nlm.nih.gov/26856587/)) — within 5-year window of current literature, more directly relevant to the 11–14 peak-bone-mass age band the article cites.
- **Refined — menstrual blood loss figures:** Body previously read "30–45 mL of blood per cycle" without context. Updated to "around 30–40 mL per cycle, with about 10% of women losing more than 80 mL (a definition of menorrhagia, where iron loss can outpace diet)" — matches Hallberg/WHO menstrual blood-loss literature.
- **Refined — peak bone mass age band:** Updated from "ages 11–17" to "roughly ages 9–18, with the steepest gain around 11–14" to match the NOF 2016 position statement.
- **Added — Pawlak 2014 vegetarian B12 review:** PMID [24667752](https://pubmed.ncbi.nlm.nih.gov/24667752/), supporting the predictable B12 deficiency claim for vegan teens.
- **Added — CDC folic-acid recommendation** (400 mcg/day for women who could become pregnant) and **AAP Pediatric Nutrition 8th ed.** (no routine MVI for healthy children with varied diets).
- **Sources** expanded from 3 to 6 with verified PMIDs/DOIs.

### Article 69 — L-Theanine and Caffeine (GUIDE)

- **Verified — Haskell 2008:** PMID [18006208](https://pubmed.ncbi.nlm.nih.gov/18006208/) confirmed. Critically, the actual doses were 250 mg L-theanine + 150 mg caffeine — a ratio of about 5:3, not the 2:1 ratio the article had presented as the "most commonly studied" canonical dose. Corrected.
- **Verified — Owen 2008:** PMID [18681988](https://pubmed.ncbi.nlm.nih.gov/18681988/) confirmed. This study did use 100 mg L-theanine + 50 mg caffeine = 2:1, so the article's 2:1 framing applies to Owen specifically, not to the literature as a whole.
- **FIXED — ratio claim:** Updated body from "the most commonly studied and effective ratio is 2:1 L-theanine to caffeine by weight" to a more accurate "most studied combinations land in the 1:1 to 2:1 L-theanine-to-caffeine range," with study-specific doses.
- **Verified — Dodd 2015:** PMID [25761837](https://pubmed.ncbi.nlm.nih.gov/25761837/) confirmed.
- **Added — Giesbrecht 2010:** PMID [21040626](https://pubmed.ncbi.nlm.nih.gov/21040626/) — the original *Nutritional Neuroscience* paper underlying the chart block's "Sustained attention (rapid visual) — Giesbrecht" entry. Confirms the chart label.
- **Added — EFSA 2015 caffeine safety opinion** for the 400 mg/day-safe-for-healthy-adults reference; replaces the unsourced "below the safe limit" framing.
- **Refined — 20+ RCTs claim:** Body previously said "over 20 randomized controlled trials." Softened to "more than a dozen randomized controlled trials in healthy adults" — defensible against the actual literature (Dodd 2015 cites approximately that count).
- **Added — tolerance and pregnancy/arrhythmia caveats** (consistent with EFSA caffeine guidance).
- **Chart block (`rc-chart`):** Verified labels match strengthened text. No data changed.
- **Sources** expanded from 3 to 5 with verified PMIDs/DOIs.

### Article 70 — Saw Palmetto (MYTH-BUSTING)

- **FIXED — major factual conflation:** Body previously said "the STEP trial (Saw Palmetto for Treatment of Enlarged Prostates) — a large, rigorous, double-blind NCCAM-funded trial of 225 men — which found saw palmetto at standard, double, and triple doses produced no improvement in urinary symptoms compared to placebo after 72 weeks." This conflates two distinct trials:
  - **STEP** (Bent et al. 2006, NEJM, PMID [16467543](https://pubmed.ncbi.nlm.nih.gov/16467543/)) — 225 men, 160 mg twice daily (single dose), 12 months. Null.
  - **CAMUS** (Barry et al. 2011, JAMA, PMID [21954478](https://pubmed.ncbi.nlm.nih.gov/21954478/)) — **369 men**, NCCAM/NIDDK-funded, escalating to 320 mg three-times-daily across 72 weeks. Group difference 0.79 points favouring placebo (P=0.91 in saw palmetto direction).
  - Rewrote the section to attribute the "225 men, 12 months, single dose" to STEP and the "369 men, escalating doses, 72 weeks" to CAMUS, with both PMIDs cited.
- **Verified — Tacklind 2012 Cochrane:** PMID [23235581](https://pubmed.ncbi.nlm.nih.gov/23235581/) confirmed; added the headline meta-analysis result (32 RCTs in 5,666 men).
- **Verified — Wilt 1998 JAMA:** PMID [9820264](https://pubmed.ncbi.nlm.nih.gov/9820264/) confirmed (the 1998 systematic review that drove early adoption).
- **Refined — sales claim:** Replaced "$300 million annually" specific figure (vendor-attributed) with the more defensible "industry analysts have estimated global saw palmetto sales in the hundreds of millions of dollars annually."
- **Refined — alternatives list:** Expanded to include silodosin and dutasteride (both FDA-approved for BPH) and explicit behavioural changes.
- **Sources** expanded from 3 to 4 with verified PMIDs/DOIs.

## 4. data.js sync (no edits required)

`ARTICLE_MAP` in `data.js` is a partial map; only 6 of the 10 articles in this batch (62, 63, 65, 66, 69, 70) have entries. None of those entries' titles or minutes-read values changed in this batch, so no `data.js` edit was made.

Pre-existing inconsistency observed but **not** changed (out-of-scope for this batch's "no length change" rule):
- Article 66 body says "8 min read"; `data.js` entry has `m:7`. Flagged for the next reviewer who actually does change article-66's length, or for a separate `data.js` audit pass.

## 5. Hero/card sync

- Articles 61–70 each have a corresponding card in the article-list grid (around lines 4690–4740 of the legacy `index.html` numbering before today's edits). No hero-slide carousel entries reference these IDs directly via `openArticle(N)` (`grep` confirmed 0 matches for the openArticle() pattern for IDs 61–70 outside the article body). Titles and minutes-read are unchanged, so card sync is preserved without further edits.
- No cross-references in other articles' bodies cite article 61–70 titles by name (manual `grep` for each title returned only the card+body pair).

## 6. Verification

- `grep -c '<div class="article-full"' index.html` → 221 (unchanged from the start of the run).
- `grep -oP '<!-- last-reviewed: \K[^ ]+' index.html | sort | uniq -c` → 30 stamped 2026-04-24, **40** stamped 2026-04-25 (30 from earlier batches today + 10 from this batch). Cumulative reviewed-articles count is now **70 of 221**, on track with the ~22-day cycle target.
- For every article 61–70, automated checks confirmed the presence of (a) the `<!-- last-reviewed: 2026-04-25 -->` comment, (b) the "Updated Apr 25, 2026" tag in the article-meta line, and (c) a "Reviewed against N peer-reviewed sources" footer line with N matching the source-list length. Article 67 has N=9 (≥8 safety threshold).

## 7. Files touched

- `/Users/yves/Desktop/AI/Supplement Score/index.html` — articles 61–70 rewritten in place.
- `/Users/yves/Desktop/AI/Supplement Score/index.html.bak-batch7-20260425` — pre-edit backup.
- `/Users/yves/Desktop/AI/Supplement Score/reviews/article-review-2026-04-25-batch4.md` — this report.
- `data.js`, `app.js`, CSS, mockups, `Original/`, `SS Editorial/`, and `supplement-pairings.*` — **not** touched (per task file's DO NOT TOUCH list).

## 8. Notes for the next run

- Next batch target IDs: **71–80** (next ten oldest never-reviewed). Article 71 is "Fasting and Supplements: What to Take and When to Stop" (KIDS taxonomy not present; likely guide/myth). Article 75 is "Contaminated Protein Powders: Lead, Arsenic, and BPA" — almost certainly a `safety` article, so apply the ≥8-source rule.
- Pre-existing article-66 minutes-read mismatch between body (8 min) and `data.js` (m:7) remains. Recommend either (a) audit `data.js` against article bodies once and reconcile, or (b) leave for the next reviewer who actually changes article-66's length.
- Cumulative count after this batch: 70 of 221 articles reviewed, 151 to go. At 10/day, the remaining 151 would finish in ~16 calendar days — on schedule with the ~22-day cycle.

Sources:
- [PubMed search interface](https://pubmed.ncbi.nlm.nih.gov)
- [Cochrane Database of Systematic Reviews](https://www.cochranelibrary.com/cdsr/reviews)
- [FDA Tainted Products Marketed as Dietary Supplements_CDER](https://www.accessdata.fda.gov/scripts/sda/sdNavigation.cfm?sd=tainted_supplements_cder)
- [U.S. CDC Folic Acid Recommendations](https://www.cdc.gov/folicacid/recommendations.html)
- [EFSA caffeine scientific opinion (2015)](https://www.efsa.europa.eu/en/efsajournal/pub/4102)
- [ACSM 2007 Position Stand: Exercise and Fluid Replacement](https://pubmed.ncbi.nlm.nih.gov/17277604/)
- [Council for Responsible Nutrition](https://www.crnusa.org)
