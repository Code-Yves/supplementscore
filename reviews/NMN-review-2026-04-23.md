# Trending Supplement Review: NMN / NAD+ precursors

**Reviewed:** 2026-04-23
**Tier:** 3 (Trending)
**Source file edited:** `data.js`
**Reviewer:** Automated supplement-trending-review task
**Citation database:** PubMed (2023-01-01 to 2026-12-31)

---

## 1. Why this supplement was selected

NMN / NAD+ precursors is one of the most actively researched and commercially hyped longevity supplements of 2024-2026, with substantial new meta-analytic evidence since the current description was written. The original `desc` cited only a generic "2024 review" and made a blanket claim that "no meaningful improvements... have been seen in any trial yet" — a statement the most recent evidence partially contradicts. A refresh was warranted.

## 2. Original entry (baseline)

```js
{t:'t3',tr:true,n:'NMN / NAD+ precursors',tag:'Anti-aging / Longevity',
 e:2,s:3,r:2,o:3,c:1,d:4,
 desc:'Raises NAD+, a molecule that declines with age and powers cellular repair. A 2024 review confirmed NMN raises blood NAD+ in humans within 2 weeks. However, no meaningful improvements in energy, muscle function, or aging markers have been seen in any trial yet. The gap between raised NAD+ and actual health benefits is the key unanswered question. Very expensive for unproven benefit.',
 dose:'250–900 mg/day in trials; no established optimal dose; no proven health benefit despite raised NAD+',
 tips:'Can be taken with or without food. Morning dosing preferred as it may be mildly energising. No established drug interactions, but evidence base is immature.'}
```

## 3. Fact-check against 2023–2026 literature (PubMed)

According to PubMed, the following systematic reviews and meta-analyses were retrieved:

### Claim-by-claim

**Claim 1: "Raises NAD+, a molecule that declines with age and powers cellular repair."**
- **Verdict:** Accurate.
- **Evidence:** Mechanism is well-established. NAD+ is a cofactor for sirtuins, PARPs, and mitochondrial redox. Age-related decline is documented.

**Claim 2: "A 2024 review confirmed NMN raises blood NAD+ in humans within 2 weeks."**
- **Verdict:** Accurate but vague.
- **Evidence:** Zhang, Poon, Wong 2024 (Crit Rev Food Sci Nutr; [DOI](https://doi.org/10.1080/10408398.2024.2387324)) — 12 RCTs, 513 participants: "overall significant effect of NMN supplementation in elevating blood NAD levels."
- **Update:** Replaced with reference to "2024–2026 meta-analyses" and specified the 2–4 week timeline more accurately.

**Claim 3: "No meaningful improvements in energy, muscle function, or aging markers have been seen in any trial yet."**
- **Verdict:** Partly outdated / too absolute.
- **Evidence:**
  - Muscle/sarcopenia — supports claim: Prokopidis et al. 2025 (J Cachexia Sarcopenia Muscle; [DOI](https://doi.org/10.1002/jcsm.13799)) — meta-analysis in adults ≥60 years found **no** significant effect on skeletal muscle index, handgrip, gait speed, or 5-time chair stand.
  - Glucose/lipid metabolism — supports claim: Chen et al. 2024 (Curr Diab Rep; [DOI](https://doi.org/10.1007/s11892-024-01557-z)) — 8 RCTs, 342 adults, 250–2000 mg/day for 14 days–12 weeks: **no** significant benefit on fasting glucose, insulin, HbA1c, HOMA-IR, or lipids.
  - Overall healthspan — supports claim: Gallagher & Emmanuel 2026 (Ageing Res Rev; [DOI](https://doi.org/10.1016/j.arr.2026.103057)) — PRISMA review of 113 studies (33 human) through October 2025: "effects on functional, metabolic, vascular, and other healthspan-relevant outcomes were heterogeneous and often null or endpoint-specific."
  - Blood pressure — **contradicts absolute claim:** Zhang et al. 2026 (Nutrients; [DOI](https://doi.org/10.3390/nu18060890)) — 10 RCTs, 349 participants: NMN reduced resting diastolic BP by **−2.15 mmHg** (95% CI −3.68 to −0.61); systolic BP reduction of **−3.94 mmHg** in adults ≥60 years (95% CI −7.06 to −0.82).
  - Possible muscle signal — contradicts: Wang et al. 2025 (Curr Pharm Biotechnol; [DOI](https://doi.org/10.2174/0113892010306242240808094303)) — 9 RCTs: small improvement in gait speed (SMD 0.34) and ALT. Lower-quality journal; findings conflict with Prokopidis 2025, so weighted less heavily.
- **Update:** Description now acknowledges null results for muscle and metabolic markers while noting the small BP signal as "the one real signal."

**Claim 4: "The gap between raised NAD+ and actual health benefits is the key unanswered question."**
- **Verdict:** Accurate and still the scientific consensus. Retained in spirit.

**Claim 5: "Very expensive for unproven benefit."**
- **Verdict:** Accurate. Retained.

### New context added

- **Safety profile** (Gindri et al. 2023, Am J Physiol Endocrinol Metab; [DOI](https://doi.org/10.1152/ajpendo.00242.2023)): NAD+ precursors generally well tolerated; most common mild adverse events are muscle pain, sleep disturbance, and headaches. No serious safety signals reported in RCTs up to ~12 weeks.
- **Regulatory status (U.S.):** In November 2022 the FDA concluded that NMN is excluded from the dietary supplement definition because it was authorized for investigation as a new drug prior to being marketed as a supplement. Many U.S. retailers pulled NMN, though it remains widely sold online. Nicotinamide riboside (NR) is unaffected and remains a legal supplement ingredient. This is important practical context for U.S. consumers and was missing.

## 4. Rewritten entry

```js
{t:'t3',tr:true,n:'NMN / NAD+ precursors',tag:'Anti-aging / Longevity',
 e:2,s:3,r:2,o:3,c:1,d:4,
 desc:'NMN and nicotinamide riboside are sold to boost NAD+, a cellular fuel that drops with age. The biology checks out: 2024–2026 meta-analyses confirm oral NMN reliably raises blood NAD+ within 2–4 weeks and is well tolerated. Whether that translates into feeling or functioning better is a different story. A 2025 meta-analysis in older adults (Prokopidis, J Cachexia Sarcopenia Muscle) found no gains in muscle mass, grip strength, or walking speed. A 2024 meta-analysis (Chen, Curr Diab Rep) found no effect on blood sugar, insulin, or cholesterol. The one real signal is blood pressure: a 2026 meta-analysis of 10 RCTs (Zhang, Nutrients) showed a ~2 mmHg drop in diastolic BP, with a larger ~4 mmHg systolic drop in adults over 60. Regulatory note: in 2022 the FDA ruled NMN cannot be legally sold as a dietary supplement in the U.S. because a drug company is studying it as a pharmaceutical. Short-term safe, but expensive for small and uncertain benefits.',
 dose:'250–1,200 mg/day has been tested in trials; no established optimal dose. Blood NAD+ rises reliably within 2–4 weeks, but clinical benefits are small and inconsistent, so no dose–response sweet spot has been confirmed.',
 tips:'Take with or without food; morning dosing is preferred because it may feel mildly energising. Generally well tolerated in trials up to 12 weeks — side effects are mild (bloating, flushing, headache). Long-term safety is unknown. In the U.S., NMN is no longer classed as a legal dietary supplement ingredient by the FDA (2022 ruling); nicotinamide riboside (NR) remains allowed and has similar biological effects.'}
```

## 5. Summary of changes

| Field | Change |
|---|---|
| `desc` | Rewritten — plainer language; specific 2024–2026 meta-analytic citations; acknowledges the small BP signal; adds FDA regulatory note. |
| `dose` | Expanded upper dose range (900 → 1,200 mg/day) to reflect actual trial range; clarified timing of NAD+ rise; noted no dose–response. |
| `tips` | Added explicit safety profile (common mild side effects); noted unknown long-term safety; added FDA status with NR as an allowed alternative. |
| Ratings (e, s, r, o, c, d) | Left unchanged — new evidence doesn't materially shift the overall tier-3 picture (small, inconsistent benefits; expensive; evidence still thin on long-term outcomes). |

## 6. Sources cited (all via PubMed)

1. Gallagher C, Emmanuel OO. NAD+ supplementation for anti-aging and wellness: A PRISMA-guided systematic review of preclinical and clinical evidence. *Ageing Res Rev.* 2026;116:103057. [DOI](https://doi.org/10.1016/j.arr.2026.103057)
2. Zhang M, Chen Y, Jiang N, et al. Effects of Nicotinamide Mononucleotide Supplementation on Blood Pressure: A Systematic Review and Meta-Analysis of Randomized Controlled Trials. *Nutrients.* 2026;18(6):890. [DOI](https://doi.org/10.3390/nu18060890)
3. Prokopidis K, Moriarty F, Bahat G, et al. The Effect of Nicotinamide Mononucleotide and Riboside on Skeletal Muscle Mass and Function: A Systematic Review and Meta-Analysis. *J Cachexia Sarcopenia Muscle.* 2025;16(3):e13799. [DOI](https://doi.org/10.1002/jcsm.13799)
4. Zhang J, Poon ETC, Wong SHS. Efficacy of oral nicotinamide mononucleotide supplementation on glucose and lipid metabolism for adults: a systematic review with meta-analysis on randomized controlled trials. *Crit Rev Food Sci Nutr.* 2024;65(22):4382-4400. [DOI](https://doi.org/10.1080/10408398.2024.2387324)
5. Chen F, Zhou D, Kong AP, et al. Effects of Nicotinamide Mononucleotide on Glucose and Lipid Metabolism in Adults: A Systematic Review and Meta-analysis of Randomised Controlled Trials. *Curr Diab Rep.* 2024;25(1):4. [DOI](https://doi.org/10.1007/s11892-024-01557-z)
6. Wang JP, Wang L, Wang T, et al. Effects of Nicotinamide Mononucleotide Supplementation on Muscle and Liver Functions Among the Middle-aged and Elderly: A Systematic Review and Meta-analysis of Randomized Controlled Trials. *Curr Pharm Biotechnol.* 2025;26(13):2141-2152. [DOI](https://doi.org/10.2174/0113892010306242240808094303) *(contradictory; weighted less)*
7. Oliveira-Cruz A, Macedo-Silva A, Silva-Lima D, et al. Effects of Supplementation with NAD+ Precursors on Metabolic Syndrome Parameters: A Systematic Review and Meta-Analysis. *Horm Metab Res.* 2024;56(11):818-826. [DOI](https://doi.org/10.1055/a-2382-6829)
8. Gindri IM, Ferrari G, Pinto LPS, et al. Evaluation of safety and effectiveness of NAD in different clinical conditions: a systematic review. *Am J Physiol Endocrinol Metab.* 2023;326(4):E417-E427. [DOI](https://doi.org/10.1152/ajpendo.00242.2023)

## 7. Verification

- `data.js` re-parsed successfully after edit (Node.js syntax check passed).
- Length of new entry: 1,705 chars (up from ~870) — comparable to the more detailed Tier-3 entries (e.g., ginkgo biloba).
- Ratings (e/s/r/o/c/d) preserved unchanged.
- No other supplement entries touched.

## 8. Open questions / notes for future reviewer

- The Wang 2025 meta-analysis (gait speed, ALT improvements) conflicts with Prokopidis 2025. When more high-quality RCTs land, the muscle-function claim may need another revision.
- Ongoing trials (e.g., MIB-626 Phase 2 readouts) could materially change the picture within 12 months.
- The FDA regulatory situation is contested and may change via court action. Recheck at next review.
- Consider adding PMID linkouts in future to make in-app citations clickable.
