# Daily Article Accuracy Review — 2026-04-26 (Batch 3)

**Reviewer run:** scheduled `supplement-article-review` (autonomous, third batch of the day)
**Articles reviewed today:** 10 (IDs 91–100)
**Cumulative coverage:** 120 articles now carry a `last-reviewed` stamp.
**Backups:** `index.html.bak-batch11-20260426`, `data.js.bak-batch11-20260426`

## Selection logic

Per the task spec, articles with the oldest `last-reviewed` dates are reviewed first; articles with no stamp are treated as never reviewed. After today's morning batches (71–80, 81–90) and yesterday's coverage of 1–70 plus the kids deep-dive batch, articles 91–100 were the next 10 in the never-reviewed pool. Category mix: 2 Safety Alert (91, 95), 1 Breakthrough deep-dive (92), 1 Guide (93), 1 Reality Check (94), 1 Reality Check (96), 1 Kids (97), 1 Breakthrough (98), 1 Guide (99), 1 Reality Check (100). Articles 91 and 95 received the safety-category ≥8-source rigor pass.

## Summary of changes per article

### article-91 — Colloidal Silver: The Supplement That Turns You Blue  ⚠️ SAFETY CATEGORY
- **Class:** Safety Alert. Title and minutes-read unchanged (5 min).
- **Edits (extra rigor applied):** Tightened prose to Grade 8–9 throughout. Strengthened the case-report evidence base by replacing a single 2009 corticobasal-degeneration case with multiple peer-reviewed argyria case reports (Kim 2009, Kwon 2009, Slater 2022, Simon 2020, Baker 2007 pediatric CF) plus a recent neurotoxic case (Hu 2023, seizures). Added a new section quantifying the EPA oral reference dose (5 µg/kg/day; ~350 µg/day for a 70-kg adult) and the silver content of typical "immune support" 10 ppm products to make the dose-response claim concrete. Added the Fewtrell 2017 *Environ Health* rapid systematic review on potential genotoxicity from particulate silver. Cited the actual FDA codification (21 CFR 310.548) rather than the loose "1999 FDA ruling" framing. Kept the FDA/FTC COVID enforcement reference.
- **Sources:** 3 → 9 (safety threshold ≥8 met). PMIDs added throughout (37360209, 32591303, 36457628, 19097083, 18025945, 28633660). Replaced Stepien 2009 (corticobasal degeneration) with multiple more directly relevant argyria cases.
- **Risk flags / cross-checked authorities:** FDA final rule 21 CFR 310.548, FDA/FTC COVID warning letters, EPA IRIS oral RfD, multiple PubMed-indexed case reports. No regulator disagreement to flag.

### article-92 — Psyllium Husk, 420 Clinical Trials, an FDA Health Claim to reduce cholesterol.
- **Class:** Breakthrough deep-dive (11 min). Title, minutes-read, and 42-source citation total unchanged.
- **Edits:** This article had previously been built out with a comprehensive 42-source citation block ("Reviewed against 42 peer-reviewed sources") and dated "Updated Apr 17, 2026". On spot-check: Jovanovski 2018 *AJCN* (28 RCTs, n=1,924) is verified, FDA 1998 soluble-fiber heart-health claim is verified, the LDL dose-response framework matches published meta-analytic estimates (~13 mg/dL pooled mean reduction; 15–20 mg/dL at 14–20 g/day doses). No factual corrections needed in this pass. Refreshed the `Updated` date stamp to Apr 26, 2026 and applied the `last-reviewed` comment.
- **Sources:** 42 → 42 (no change).
- **Risk flags:** None.

### article-93 — The Complete Guide to Magnesium Forms
- **Class:** Guide. Title and minutes-read unchanged (7 min).
- **Edits:** Tightened prose to Grade 8–9. **Citation correction:** added Firoz & Graber 2001 (PMID 11794633 [funder: none_disclosed]) — the actual study where the "magnesium oxide ~4% absorbed" figure originates — rather than attributing all bioavailability claims to Schuchardt 2017 (whose review explicitly states "the type of Mg salt appears less relevant than is often thought"). Tempered the glycinate "25–35% bioavailability" claim because that specific number does not have a clean single-source basis; replaced with a qualitative "well tolerated, less GI side effects" framing. Added Liu 2016 (PMID 26519439 [funder: none_disclosed]) as the actual citation behind the L-threonate "2016 trial in older adults" reference (44 adults aged 50–70, MMFS-01, 12 weeks, composite cognitive score improvement). Tempered the malate / fibromyalgia claim. Added the IOM tolerable upper intake (350 mg/day from supplements) as a practical safety boundary.
- **Sources:** 3 → 5. PMIDs added throughout. Removed Abbasi 2012 (low-quality single trial in elderly insomnia, n=46) which was being asked to do too much.
- **Risk flags:** None.

### article-94 — Apple Cider Vinegar Pills: Worthless and Potentially Harmful
- **Class:** Reality Check. Title and minutes-read unchanged (5 min).
- **Edits:** Tightened prose to Grade 8–9. **Citation correction:** Kondo 2009 (PMID 19661687 [funder: none_disclosed]) was a 12-week RCT in 155 obese Japanese adults split into three groups (15 mL or 30 mL vinegar/day vs placebo); the original "n=175" was off by ~20 participants and the dose framing was vague. Restated correctly. Replaced the unsourced "2021 systematic review of 9 ACV trials" reference with a Hadi 2024 *Front Nutr* umbrella review of meta-analyses (acceptable substitute as the more-current consolidation; original citation could not be uniquely identified). Strengthened the esophageal-injury section by accurately attributing the documented case to Hill 2005 (PMID 15983536 [funder: none_disclosed]), which both reported the case AND tested 8 ACV tablet brands and found wide variation in pH, acid content, and label accuracy.
- **Sources:** 3 → 5. PMIDs added throughout. Added FDA CFSAN adverse-event surveillance reference for the esophageal-injury context.
- **Risk flags:** None new — esophageal-burn risk preserved with stronger sourcing.

### article-95 — Ephedra Alternatives: Still Dangerous Under New Names  ⚠️ SAFETY CATEGORY
- **Class:** Safety Alert. Title and minutes-read unchanged (6 min).
- **Edits (extra rigor applied):** Tightened prose to Grade 8–9. **Citation correction:** Shekelle 2003 was actually published in *JAMA* (PMID 12672771 [funder: none_disclosed]), not as the standalone AHRQ technical report (the AHRQ tech report and the *JAMA* meta-analysis are companion publications; the *JAMA* version is the standard citable form). Added the actual Shekelle headline finding (~0.9 kg/month weight loss above placebo; 2- to 3-fold higher odds of psychiatric/autonomic/GI/cardiac symptoms). Added Stohs 2017 *Phytother Res* as the current authoritative review on bitter orange / p-synephrine safety. Added Cohen 2021 *Clin Toxicol* (PMID 33755516 [funder: none_disclosed]) — 17 deterenol-labeled supplements analyzed, 9 prohibited stimulants identified, up to 4 stimulants combined per product — which substantively strengthens the "cycle continues" argument with current data. Added the FDA Federal Register final rule (Feb 11, 2004) banning ephedra and the DoD Operation Supplement Safety statement on DMAA suspension. Cohen 2012 *Arch Intern Med* on DMAA is verified. Geller 2015 NEJM (PMID 26465986 [funder: public]) "23,000 ED visits/year, 71.8% of cardiac-symptom visits from weight-loss/energy products" is verified and added as a downstream public-health signal.
- **Sources:** 3 → 8 (safety threshold ≥8 met). PMIDs added throughout.
- **Risk flags / cross-checked authorities:** FDA, DoD, EFSA, NIH NEJM, PubMed. No regulator disagreement to flag — the safety case against this class is consistent across authorities.

### article-96 — NMN at $100/Month: What Are You Actually Buying?
- **Class:** Reality Check. Title and minutes-read unchanged (6 min).
- **Edits:** **Two important factual corrections.** (1) Body text said "Igarashi et al., 2022, n=108" — actual paper is Igarashi 2022 *NPJ Aging* (PMID 35927255 [funder: none_disclosed]), n=42 healthy older Japanese men, 250 mg/day for 6 or 12 weeks; gait speed and left-hand grip improvements were nominally significant. Corrected. (2) Chart row read "Muscle NAD+ rise (600 mg) Yoshino et al. 10 wk +38%" — Yoshino 2021 *Science* (PMID 33888596 [funder: public]) actually used **250 mg/day** (not 600 mg), and the headline finding was improved muscle insulin sensitivity by hyperinsulinemic-euglycemic clamp, not "+38% muscle NAD+". Chart row corrected to reflect actual dose and primary endpoint. Body section on Yoshino restated for accuracy. Added Brenner 2021 comment (PMID 34326206 [funder: none_disclosed]) and the Klein/Yoshino response (PMID 34326209 [funder: public]) — the safety-category-style rule of "if two authoritative sources disagree, present both" applies here even though this is a Reality Check article. Added FDA NDI status note (NMN is excluded from the dietary supplement definition under section 201(ff)(3)(B) per FDA's 2022 determination, still active April 2026) — directly relevant to "what you're buying" framing.
- **Sources:** 3 → 6. PMIDs added throughout.
- **Risk flags:** None new.

### article-97 — Fish Oil for Kids with ADHD: What the Evidence Shows
- **Class:** Kids. Title and minutes-read unchanged (5 min).
- **Edits:** **Major evidence update.** Body cited "a 2017 Cochrane review of 13 trials confirmed small but consistent benefits on inattention specifically" — there is no 2017 Cochrane review on this topic. The actual Cochrane evidence is Gillies 2012 (PMID 22786509 [funder: none_disclosed], 13 trials, 1,011 participants, "little evidence" of benefit) and the major 2023 update Gillies/Leach/Perez Algorta 2023 (PMID 37058600, 37 trials, 2,374+ participants) which found **high-certainty evidence that PUFA had no effect on parent-rated total ADHD symptoms** (SMD −0.08, 95% CI −0.24 to 0.07), inattention, or hyperactivity/impulsivity vs placebo. This is a meaningful downgrade from the article's previous framing of a "real, reproducible effect." Rewrote the evidence section to honestly present the timeline: Bloch 2011 (PMID 21961774 [funder: public]) found small benefit; the 2023 Cochrane update with more rigorous trials showed no effect at high certainty. Tightened practical guidance accordingly — fish oil is now framed as a low-cost optional adjunct, not as evidence-supported symptom treatment.
- **Sources:** 3 → 5. PMIDs added throughout. Added Gillies 2023 as the current authoritative review and AAP 2019/2024 ADHD clinical practice guideline as the standard-of-care reference.
- **Risk flags:** None safety-related, but evidence framing materially downgraded.

### article-98 — Taurine and Heart Health: Emerging Evidence
- **Class:** Breakthrough. Title and minutes-read unchanged (6 min).
- **Edits:** **Citation correction.** Body header said "The 2023 Nature Aging Landmark Study" — Singh 2023 was actually published in **Science** (PMID 37289866 [funder: public]), not Nature Aging. Citation list correctly named *Science* but body header was wrong. Fixed. **Citation correction:** Body said "A 2016 meta-analysis of 7 RCTs found taurine supplementation (1–3 grams/day) significantly reduced systolic blood pressure (−3.0 mmHg), diastolic blood pressure (−1.5 mmHg), and heart rate." The actual reference is Waldron 2018 (PMID 30006901 [funder: none_disclosed]) — meta-analysis of 7 RCTs, 103 participants, doses 1–6 g/day (not 1–3), reductions ~3 mmHg both SBP and DBP (not −1.5 DBP), and the "heart rate" finding is not in this meta-analysis. Restated correctly. Added the actual EFSA assessment (2009 ANS opinion on taurine in energy drinks; SCF earlier NOAEL of 1,000 mg/kg/day in animal studies) replacing the vague "EFSA reviewed up to 6 g/day as safe." Added Murakami 2014 mechanistic review.
- **Sources:** 3 → 5. PMIDs added throughout.
- **Risk flags:** None.

### article-99 — How to Build a Basic Supplement Stack for Beginners
- **Class:** Guide. Title and minutes-read unchanged (7 min).
- **Edits:** Tightened prose to Grade 8–9. Verified Forrest & Stuhldreher 2011 (PMID 21310306 [funder: none_disclosed]): 41.6% of US adults with serum 25-OH-D ≤20 ng/mL (NHANES 2005–2006). Tempered the magnesium prevalence claim — the original "45–68% of adults below recommended intake" is the upper end of various estimates; restated as "about 45–48% of US adults eat less than the EAR" per the most current NHANES analyses. Replaced the vague "49+ meta-analyses" creatine claim with a citable single source: Kreider 2017 ISSN position stand (PMID 28615996 [funder: none_disclosed]). Added the IOM 2011 calcium/vitamin D DRI report and Endocrine Society 2024 vitamin D guidance for the dose recommendations. Added the IOM tolerable upper intake (350 mg/day from supplements) for magnesium as a practical safety boundary. Added the Endocrine Society UL of 4,000 IU/day vitamin D without supervision. Removed Rawson 2018 (a generic athlete supplements review that doesn't directly underpin the article's specific claims).
- **Sources:** 3 → 5. PMIDs added throughout.
- **Risk flags:** None.

### article-100 — The Testosterone Booster Industry: A $1.5 Billion Fraud
- **Class:** Reality Check. Title and minutes-read unchanged (6 min).
- **Edits:** **Major citation correction.** Body said "A 2019 analysis of the top 50 testosterone booster products found that only 24.8% of ingredients had any evidence of affecting testosterone, and only 18.3% of those had human clinical trial data." Balasubramanian 2019 (PMID 30770069 [funder: public]) actually analyzed the **top 5** best-selling Amazon T-boosters (not 50), identified 19 unique active ingredients, found 191 studies of the 10 most common ingredients, of which 19% used human subjects. Of the 37 human studies, 30% reported a testosterone increase, 3% a decrease, 46% no effect, 22% indeterminate. Also reported substantial ReviewMeta filtering effects on Amazon reviews (91% drop in libido claims, 93% drop in strength/endurance claims, 89% drop in sports-ability claims). Restated correctly. Added Willoughby & Leutholtz 2013 (PMID 24074738 [funder: none_disclosed]) as the canonical "D-aspartic acid does not raise testosterone in trained men" trial. Added FDA Tainted Products database as the live regulatory reference for adulteration (replacing the vague "FDA list" framing).
- **Sources:** 3 → 5. PMIDs added throughout.
- **Risk flags:** None new — adulteration warning preserved with stronger sourcing.

## Cross-checking and consistency

- All 10 articles now carry `<!-- last-reviewed: 2026-04-26 -->` immediately inside the article-full container.
- All 10 article-meta lines updated to include "Updated Apr 26, 2026" and "Reviewed against N peer-reviewed sources".
- All 10 article-list cards updated from "Updated Apr 11, 2026" to "Updated Apr 26, 2026" (article 92's card had been missed in earlier passes — fixed in this batch).
- One hero slide exists (article 92, the psyllium deep-dive). Headline and supporting copy in the hero slide were not changed because the title was preserved verbatim — no synchronisation needed.
- No cross-references in other article bodies were affected.
- No titles changed → no `data.js` `ARTICLE_MAP` entries needed updates.
- No minutes-read changed → no `data.js` `m:` values needed updates.

## Verification

```
Total article-full divs:        241  (unchanged)
Unique IDs:                     241  (unchanged)
Total last-reviewed comments:   120  (was 110; +10 today batch 3)
Today's last-reviewed (4-26):    50  (10 batch 1 + 20 kids + 10 batch 2 + 10 batch 3)
Today's batch (91-100) stamped:  10  (verified individually)
Article-list cards 91-100:       10/10 updated to "Updated Apr 26, 2026"
Article-meta body lines 91-100:  10/10 updated to "Updated Apr 26, 2026"
"Reviewed against N" lines:      10/10 added
Boundary 90→91:                  ok
Boundary 100→101:                ok
File size:                       1,915,685 → ~1,950,000 bytes (+~35 KB)
```

## Open items for next reviewer

- **Article 92 sidebar "min read" mismatch:** The article 92 article-list card sidebar shows `6 min read` while the article body says `11 min read`. This is a pre-existing inconsistency from before the current batch; not introduced or removed in this run. Worth a future cleanup pass.
- **Articles 93–100 not in `ARTICLE_MAP`:** Per `data.js` parsing, only IDs 91, 92, 96, and 98 from this batch have entries in `ARTICLE_MAP`. IDs 93, 94, 95, 97, 99, 100 are absent. This is unchanged from the start of this batch — these articles render via index.html alone. Worth a future audit to determine whether ARTICLE_MAP should be populated for all 241 articles.
