# Trending Supplement Review: Lion's mane mushroom (Hericium erinaceus)

**Reviewed:** 2026-04-25 (autonomous scheduled run)
**Tier:** 3 (Trending)
**Source file edited:** `data.js`
**Backup:** `data.js.bak-lionsmane-20260425`
**Reviewer:** Automated `supplement-trending-review` task
**Citation database:** PubMed (primary), 2009 baseline trial through 2026 reviews; NCCIH for clinical-evidence framing

---

## 1. Why this supplement was selected

Lion's mane mushroom (Hericium erinaceus) is the most actively-marketed nootropic mushroom of 2024-2026, with a steady drip of new acute and chronic RCTs in healthy adults plus two new systematic reviews published since the existing entry was written. The previous run in this rotation (2026-04-23) covered NMN / NAD+ precursors. Lion's mane was the next strongest "trending" candidate (`t:'t3', tr:true`) where the existing entry was vague — it cited "small trials" and "a 2025 trial in healthy adults" without naming any of them, and did not distinguish between fruiting body, mycelium, and the erinacine A-enriched mycelium (EAHE) extract that has produced the strongest clinical signal. A rewrite with named studies, doses, and the form distinction was warranted.

## 2. Original entry (baseline)

```js
{t:'t3',tr:true,n:"Lion's mane mushroom",tag:'Cognition · Neuroprotection',
 e:2,s:4,r:3,o:2,c:2,d:4,
 desc:'May support brain health by stimulating nerve growth factor production. Small trials in people with mild cognitive decline showed improved thinking scores after 16 weeks, but benefits reversed within 4 weeks of stopping. A 2025 trial in healthy adults found no benefit. NCCIH says human evidence is still insufficient. Marketing claims far outpace the actual clinical research.',
 dose:'500–3,000 mg/day fruiting body extract; hot-water extract preferred; benefits reverse after stopping',
 tips:'Take with food or water at any time of day. Hot-water extracted powder can be added to coffee or tea. No specific food or timing interactions known.',
 cycle:'Benefits reverse within 4 weeks of stopping. Most studies used 12-16 weeks continuously. No established long-term safety data beyond a few months.'}
```

## 3. Fact-check against current literature (PubMed)

According to PubMed, the following are the canonical clinical trials and recent reviews relevant to each claim:

### Claim-by-claim

**Claim 1: "May support brain health by stimulating nerve growth factor production."**
- **Verdict:** Mechanistically accurate, but only at the in vitro / animal level so far.
- **Evidence:** Hericenones (from the fruiting body) and erinacines (from the mycelium) are diterpenoid compounds that stimulate NGF synthesis in cell and animal models — well documented across multiple reviews including Brandalise et al. 2023 (J Fungi; [DOI](https://doi.org/10.3390/jof9050551)) and Cornford & Charnley 2025 (Nutrition Research Reviews; [DOI](https://doi.org/10.1017/S0954422425000058)). What is not yet shown in humans is that oral intake actually raises NGF in brain tissue.
- **Update:** Prose now names the two compound classes and clarifies "in lab studies" rather than implying a confirmed in vivo mechanism in humans.

**Claim 2: "Small trials in people with mild cognitive decline showed improved thinking scores after 16 weeks, but benefits reversed within 4 weeks of stopping."**
- **Verdict:** Accurate. The "16 weeks → reversal at 4 weeks off" pattern is specifically the Mori 2009 RCT.
- **Evidence:** Mori K, Inatomi S, Ouchi K, Azumi Y, Tuchida T. *Phytother Res* 2009;23(3):367-72 (PMID [18844328](https://pubmed.ncbi.nlm.nih.gov/18844328/); [DOI](https://doi.org/10.1002/ptr.2634)). 30 Japanese adults aged 50-80 with mild cognitive impairment, randomized to 250 mg × 4 capsules × 3/day (≈3 g/day fruiting-body powder, 96% Yamabushitake) or placebo for 16 weeks. Significant Hasegawa Dementia Scale-Revised (HDS-R) gains at weeks 8, 12, 16 vs placebo. At week 4 after stopping, scores fell significantly. No adverse lab signals.
- **Added:** Li IC et al. 2020 *Front Aging Neurosci* 12:155 (PMID [32581767](https://pubmed.ncbi.nlm.nih.gov/32581767/); [DOI](https://doi.org/10.3389/fnagi.2020.00155)) — 49-week pilot RCT in mild Alzheimer's disease using erinacine A-enriched H. erinaceus mycelium (EAHE) at 3 × 350 mg capsules/day (≈1,050 mg/day, containing 5 mg/g erinacine A). Significant improvements in Cognitive Abilities Screening Instrument (CASI), MMSE, IADL, and contrast sensitivity vs placebo. Four dropouts due to abdominal discomfort, nausea, or rash; no other adverse events. This is the longest published RCT and the strongest single positive result for the EAHE form.
- **Added:** Saitsu Y et al. 2019 *Biomed Res (Tokyo)* 40(4):125-131 (PMID [31413233](https://pubmed.ncbi.nlm.nih.gov/31413233/); [DOI](https://doi.org/10.2220/biomedres.40.125)) — 12-week RCT of fruiting-body supplement; MMSE significantly improved, but Benton visual retention test and S-PA verbal paired-associate learning test did not — supports the "narrow, test-specific benefit" framing.

**Claim 3: "A 2025 trial in healthy adults found no benefit."**
- **Verdict:** Accurate when describing the Surendran 2025 acute crossover, but worth being explicit because it is just one trial and other healthy-adult acute trials have been mixed-positive.
- **Evidence:**
  - Surendran G et al. 2025 *Front Nutr* 12:1405796 (PMID [40276537](https://pubmed.ncbi.nlm.nih.gov/40276537/); [DOI](https://doi.org/10.3389/fnut.2025.1405796)) — acute, randomized, double-blind, placebo-controlled crossover in 18 healthy adults aged 18-35; single 3 g dose of 10:1 fruiting-body extract; **no significant overall effect** on global cognition or mood at 90 minutes. One individual test (pegboard) improved.
  - **Counter-evidence:** Docherty S et al. 2023 *Nutrients* 15(22):4842 (PMID [38004235](https://pubmed.ncbi.nlm.nih.gov/38004235/); [DOI](https://doi.org/10.3390/nu15224842)) — 41 healthy adults aged 18-45, 1.8 g/day for 28 days; faster Stroop response time at 60 min after a single dose; trend toward reduced subjective stress at 28 days (p=0.051). Pilot, small.
  - **Counter-evidence:** La Monica MB et al. 2023 *Nutrients* 15(24):5018 (PMID [38140277](https://pubmed.ncbi.nlm.nih.gov/38140277/); [DOI](https://doi.org/10.3390/nu15245018)) — single 1 g dose of Nordic LM extract improved working memory, complex attention, and reaction time at 2 hours, plus subjective happiness ratings.
- **Update:** Description now names Surendran 2025 explicitly *and* notes mixed acute-trial results in healthy adults — "no benefit" was an over-summary.

**Claim 4: "NCCIH says human evidence is still insufficient."**
- **Verdict:** Accurate and worth keeping. NCCIH's plain-language framing on lion's mane and similar functional mushrooms continues to characterize human evidence as "limited" / "insufficient."

**Claim 5: "Marketing claims far outpace the actual clinical research."**
- **Verdict:** Accurate. Retained.

### New context added

- **Form matters.** Three different products are sold as "lion's mane" but tested differently in trials: fruiting-body powder (Mori 2009, Saitsu 2019, Docherty 2023, Surendran 2025), mycelium grown on grain, and erinacine A-enriched mycelium (EAHE — Li 2020). The longest positive trial in mild Alzheimer's is the EAHE form specifically. The new description spells this out so consumers know the label matters.
- **Updated meta-analytic estimate.** Menon A et al. 2025 *Front Nutr* 12:1641246 (PMID [40959699](https://pubmed.ncbi.nlm.nih.gov/40959699/); [DOI](https://doi.org/10.3389/fnut.2025.1641246)) — PRISMA-guided systematic review including 5 RCTs, 3 pilot clinical trials, plus laboratory and case studies. Combined weighted mean MMSE increase of about 1.17 points in the intervention group. Side-effect profile: stomach discomfort, headache, allergic reactions.
- **Cha 2024 review** (PMID [38246232](https://pubmed.ncbi.nlm.nih.gov/38246232/); [DOI](https://doi.org/10.1016/j.neubiorev.2024.105548)) — systematic review of 34 human studies on dietary mushrooms and cognition/mood; found dietary-pattern data positive but intervention-trial data mixed; lion's mane is the most-studied single species, with "some enhancement of mood and cognitive function in middle-aged and older adults."
- **Cornford & Charnley 2025** narrative review (PMID [39988819](https://pubmed.ncbi.nlm.nih.gov/39988819/); [DOI](https://doi.org/10.1017/S0954422425000058)) — included 3 human clinical trials plus 13 animal studies; concluded erinacine A-enriched HE shows the highest bioactive potency and best transport across the blood-brain barrier of the studied compounds.
- **Allergy / safety signal added.** ALSUntangled #73 (Muhanna et al. 2023 *Amyotroph Lateral Scler Frontotemporal Degener* 25(3-4):420-423; PMID [38141002](https://pubmed.ncbi.nlm.nih.gov/38141002/); [DOI](https://doi.org/10.1080/21678421.2023.2296557)) explicitly notes "one anaphylactic case was reported after a patient consumed fresh Lion's Mane mushroom." This is now flagged in `tips`. Most trial side effects are GI (stomach discomfort, nausea), headache, and skin reactions — added to `tips`.

## 4. Rewritten entry

```js
{t:'t3',tr:true,n:"Lion's mane mushroom",tag:'Cognition · Neuroprotection',
 e:2,s:4,r:3,o:2,c:2,d:4,
 desc:'Lion’s mane is an edible mushroom that has been part of East Asian cooking and traditional medicine for centuries. Its appeal as a brain supplement comes from two unusual compounds — hericenones in the fruiting body and erinacines in the mycelium — that boost nerve growth factor (NGF) in lab studies, which could in theory help neurons grow and survive. Real human evidence is small but not zero. In older adults with mild cognitive impairment, the original Mori 2009 RCT (30 Japanese adults, 16 weeks at ~3 g/day powder) showed measurable improvements on a standard dementia screening test — but the gains faded within 4 weeks of stopping. A 49-week 2020 pilot RCT in mild Alzheimer’s using an erinacine A-enriched mycelium extract (Li et al., 1,050 mg/day) reported better MMSE, daily-living, and contrast-sensitivity scores versus placebo. A 2025 PRISMA systematic review of 5 RCTs (Menon et al., Frontiers in Nutrition) found a combined MMSE improvement of about 1.17 points — small but real. In healthy young adults the picture is mixed: some single-dose trials show small wins on individual tests (reaction time, working memory), while a 2025 acute crossover RCT in 18 young adults (Surendran et al.) found no overall cognitive or mood benefit. NCCIH still describes human evidence as insufficient. The popular marketing pitch — instant focus, a "limitless pill" — runs far ahead of what the trials actually show.',
 dose:'Most positive trials used 1–3 g/day of fruiting-body powder, or about 1 g/day of an erinacine A-enriched mycelium extract for cognition; allow 8–16 weeks. Benefits in the Mori 2009 MCI trial faded within 4 weeks of stopping. Hot-water extracts are preferred over raw powder because the active polysaccharides extract better in hot water.',
 tips:'Take with food or water at any time of day; hot-water extracted powder dissolves into coffee, tea, or smoothies. Generally well tolerated — the most common side effects in trials are mild stomach discomfort, occasional headache, and skin reactions. Allergy is real: at least one anaphylaxis case has been reported after eating fresh lion’s mane, so introduce slowly if you have known mushroom allergies. Buy from brands that disclose whether you’re getting fruiting body, mycelium grown on grain, or an erinacine A-enriched mycelium extract — these are not the same product, and only the EAHE form has the longest positive Alzheimer’s trial behind it.',
 cycle:'Most positive trials ran 12–16 weeks of continuous daily use; the longest published RCT in mild Alzheimer’s (Li 2020) ran 49 weeks with no major safety issues. The Mori 2009 MCI trial showed cognitive gains reversed within 4 weeks of stopping, suggesting any benefit is not lasting once you stop. No established cycling protocol; safety data beyond about 12 months is limited.'}
```

## 5. Summary of changes

| Field | Change |
|---|---|
| `desc` | Rewritten — plain language, names the canonical trials (Mori 2009 MCI RCT, Li 2020 EAHE Alzheimer's RCT, Menon 2025 systematic review, Surendran 2025 healthy-adult acute crossover), names the two active compound classes (hericenones, erinacines), corrects "no benefit in healthy adults" over-summary by noting mixed acute-trial results. Length 1,420 chars (up from ~430). |
| `dose` | Expanded — 1–3 g/day fruiting-body or ~1 g/day EAHE; allow 8–16 weeks; explicitly notes Mori 2009 4-week reversal; explains why hot-water extracts are preferred. |
| `tips` | Expanded — added explicit side-effect profile (GI, headache, skin), added the documented anaphylaxis case after fresh mushroom intake, added the form-disclosure consumer guidance (fruiting body vs grain-grown mycelium vs EAHE). |
| `cycle` | Expanded — pinned to specific trials (12-16 wk Mori, 49 wk Li); explicit reversal note from Mori 2009. |
| Ratings (e, s, r, o, c, d) | **Unchanged** — the new evidence is consistent with the existing tier-3 picture: small trials, mostly older-adult MCI/AD populations, signal in older/cognitively compromised cohorts is real but modest, healthy-adult acute trials are mixed-to-null, marketing outpaces evidence. The MMSE +1.17 from Menon 2025 is small. No reason to bump effectiveness or research scores. |

## 6. Sources cited (all via PubMed)

According to PubMed:

1. Mori K, Inatomi S, Ouchi K, Azumi Y, Tuchida T. Improving effects of the mushroom Yamabushitake (Hericium erinaceus) on mild cognitive impairment: a double-blind placebo-controlled clinical trial. *Phytotherapy Research.* 2009;23(3):367-372. PMID [18844328](https://pubmed.ncbi.nlm.nih.gov/18844328/); [DOI](https://doi.org/10.1002/ptr.2634).
2. Li IC, Chang HH, Lin CH, et al. Prevention of Early Alzheimer's Disease by Erinacine A-Enriched Hericium erinaceus Mycelia Pilot Double-Blind Placebo-Controlled Study. *Frontiers in Aging Neuroscience.* 2020;12:155. PMID [32581767](https://pubmed.ncbi.nlm.nih.gov/32581767/); [DOI](https://doi.org/10.3389/fnagi.2020.00155).
3. Saitsu Y, Nishide A, Kikushima K, Shimizu K, Ohnuki K. Improvement of cognitive functions by oral intake of Hericium erinaceus. *Biomedical Research (Tokyo).* 2019;40(4):125-131. PMID [31413233](https://pubmed.ncbi.nlm.nih.gov/31413233/); [DOI](https://doi.org/10.2220/biomedres.40.125).
4. Surendran G, Saye J, Binti Mohd Jalil S, et al. Acute effects of a standardised extract of Hericium erinaceus (Lion's Mane mushroom) on cognition and mood in healthy younger adults: a double-blind randomised placebo-controlled study. *Frontiers in Nutrition.* 2025;12:1405796. PMID [40276537](https://pubmed.ncbi.nlm.nih.gov/40276537/); [DOI](https://doi.org/10.3389/fnut.2025.1405796).
5. Docherty S, Doughty FL, Smith EF. The Acute and Chronic Effects of Lion's Mane Mushroom Supplementation on Cognitive Function, Stress and Mood in Young Adults: A Double-Blind, Parallel Groups, Pilot Study. *Nutrients.* 2023;15(22):4842. PMID [38004235](https://pubmed.ncbi.nlm.nih.gov/38004235/); [DOI](https://doi.org/10.3390/nu15224842).
6. La Monica MB, Raub B, Ziegenfuss EJ, et al. Acute Effects of Naturally Occurring Guayusa Tea and Nordic Lion's Mane Extracts on Cognitive Performance. *Nutrients.* 2023;15(24):5018. PMID [38140277](https://pubmed.ncbi.nlm.nih.gov/38140277/); [DOI](https://doi.org/10.3390/nu15245018).
7. Menon A, Jalal A, Arshad Z, Nawaz FA, Kashyap R. Benefits, side effects, and uses of Hericium erinaceus as a supplement: a systematic review. *Frontiers in Nutrition.* 2025;12:1641246. PMID [40959699](https://pubmed.ncbi.nlm.nih.gov/40959699/); [DOI](https://doi.org/10.3389/fnut.2025.1641246).
8. Cha S, Bell L, Shukitt-Hale B, Williams CM. A review of the effects of mushrooms on mood and neurocognitive health across the lifespan. *Neuroscience and Biobehavioral Reviews.* 2024;158:105548. PMID [38246232](https://pubmed.ncbi.nlm.nih.gov/38246232/); [DOI](https://doi.org/10.1016/j.neubiorev.2024.105548).
9. Cornford N, Charnley M. Hericium erinaceus: A possible future therapeutic treatment for the prevention and delayed progression of Alzheimer's disease? — A narrative review. *Nutrition Research Reviews.* 2025;38(2):613-627. PMID [39988819](https://pubmed.ncbi.nlm.nih.gov/39988819/); [DOI](https://doi.org/10.1017/S0954422425000058).
10. Brandalise F, Roda E, Ratto D, et al. Hericium erinaceus in Neurodegenerative Diseases: From Bench to Bedside and Beyond, How Far from the Shoreline? *Journal of Fungi.* 2023;9(5):551. PMID [37233262](https://pubmed.ncbi.nlm.nih.gov/37233262/); [DOI](https://doi.org/10.3390/jof9050551).
11. Muhanna M, Lund I, Bromberg M, et al. ALSUntangled #73: Lion's Mane. *Amyotrophic Lateral Sclerosis & Frontotemporal Degeneration.* 2023;25(3-4):420-423. PMID [38141002](https://pubmed.ncbi.nlm.nih.gov/38141002/); [DOI](https://doi.org/10.1080/21678421.2023.2296557) — source for the documented anaphylaxis case.

## 7. Verification

- `data.js` re-parsed successfully with Node (`data.js parsed OK. S array length = 733`).
- Lion's mane entry retrieved by name from the parsed array; tier `t3`, `tr:true`, ratings `{e:2,s:4,r:3,o:2,c:2,d:4}` preserved.
- Field lengths after rewrite: `desc` 1,420 chars (was ~430), `dose` 337 chars (was ~95), `tips` 651 chars (was ~145), `cycle` 376 chars (was ~165). Comparable to the more detailed Tier-3 entries (NMN was 1,705 chars in the previous run).
- Backup written to `data.js.bak-lionsmane-20260425` before edit.
- No other supplement entries touched.

## 8. Open questions / notes for future reviewer

- The MMSE +1.17 point pooled effect from the Menon 2025 review is statistically real but clinically modest — there is no agreed minimal clinically important difference for MMSE in MCI / mild dementia, and a 1-point change is within the test's measurement noise. Worth re-examining once a higher-quality (Cochrane-style) meta-analysis lands.
- Mori 2009 (n=30) and Saitsu 2019 (n=31) are both small Japanese RCTs from the same research community using fruiting-body products. Independent replication outside Japan with the same product specification is still missing for the fruiting-body form.
- The Li 2020 EAHE result is the strongest single positive cognitive trial but is still a pilot (n=49 randomized) sponsored by a manufacturer (Grape King Bio). A Phase 3 confirmatory trial would materially change tier scoring; none has been published as of this review.
- No human RCTs in ALS, Parkinson's, or schizophrenia to date; the Baker & Newman 2025 *Psychopharmacol Bull* paper (PMID [39935672](https://pubmed.ncbi.nlm.nih.gov/39935672/); [DOI](https://doi.org/10.64719/pb.4520)) is a theoretical add-on review only — there is no clinical trial in schizophrenia yet.
- Long-term (>12 months) safety data is still missing; the largest dataset is the 49-week Li 2020 trial.
- Acute / single-dose results in healthy young adults remain a coin-flip across La Monica 2023, Docherty 2023, and Surendran 2025. A pre-registered, larger acute crossover with consistent product specification would settle the question.

## 9. Files touched

- `data.js` — single entry rewritten (line ~209, "Lion's mane mushroom").
- `data.js.bak-lionsmane-20260425` — backup of pre-edit file.
- `reviews/Lions-mane-review-2026-04-25.md` — this report.
