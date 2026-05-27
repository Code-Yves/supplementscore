# Recommendation-coverage triage — 2026-05-27

**Mode:** edits
**Pre-run counts:** FM=31 FO=651 FP=76 RM=196
**Post-run counts:** FM=26 FO=651 FP=81 RM=197
**Net change in forward mismatches:** -5 (target: -6 per week)

## Edits applied this run

- **Citrulline (L-citrulline, pure form)** (t1): added to `bp.supps_recommended`. Tag promises "Blood flow · Exercise · Blood pressure" but only `peripheral_artery_disease` and `ed` listed it. Evidence: meta-analyses of L-citrulline 3–6 g/day show consistent systolic BP reduction (~4–7 mmHg) via NO/arginine pathway (Mahboobi 2019, Barkhidarian 2019).
- **L-Carnitine** (t1): added to `male_fertility.supps_recommended`. Tag explicitly names "Male fertility" but only `heart_failure` and `graves` listed the base form (ALCAR and Carnitine tartrate were already in male_fertility; bare L-Carnitine wasn't). Cochrane and recent andrology meta-analyses support L-carnitine for sperm motility.
- **Psyllium husk (soluble fibre)** (t1): added to `cholesterol.supps_recommended`. Tag promises "Cholesterol · Gut regularity · Glucose"; the sibling entry "Psyllium husk (Plantago ovata)" was already in cholesterol but the (soluble fibre) variant wasn't. Bile-acid binding → ~5–10% LDL reduction is the strongest non-statin lipid effect for any fibre.
- **Bromelain** (t2): added to `inflammation.supps_recommended`. Tag promises "Inflammation · Sinusitis · Recovery" but only `allergy` listed it. Multiple RCTs/meta-analyses support post-surgical and acute inflammation use. (Token-matched; FM resolved.)
- **Taurine** (t2): added to `metabolic_syndrome.supps_recommended`. Tag promises "Cardiovascular · Metabolic · Aging"; reverse-mapped only to bp/AFib/heart_failure. Meta-analyses show improvements in insulin sensitivity, triglycerides, and waist circumference in metabolic syndrome.
- **Bifidobacterium lactis (BB-12 / HN019)** (t2): added to `gut.supps_recommended`. Strong RCT evidence for stool frequency and immune endpoints in adults and infants. Edit did not resolve the FM (tag tokens "Gut regularity / Infant health" don't substring-match the "Digestive issues" label), but the data is now correct — the gap is in the script's alias map, not the catalog.

## Forward orphans sampled (seed=17, no edits)

- **L-Cysteine**: coverage-gap — tag "Hair · Skin · Glutathione · Detox" maps to existing `hair` and `skin_aging` conditions; surface next week.
- **Protein supplementation (clinical sarcopenia)**: coverage-gap — `sarcopenia` condition exists; clear add for next week.
- **Amla / Indian gooseberry (Phyllanthus emblica)**: coverage-gap — tag includes "Cholesterol"; `cholesterol` condition exists. Evidence is modest but real.
- **Jimsonweed (Datura stramonium)**: legitimate-no-condition — toxic-plant safety entry, no clinical indication; belongs only in supps_avoid lists, not Recommended-For.
- **VSL#3 / Visbiome (multi-strain)**: coverage-gap — `ibd_uc` and `ibd_crohn` exist; VSL#3 has strongest probiotic evidence in UC and pouchitis. High-priority add next week.

## New CONDITIONS entries proposed (for human review)

- **`cognitive_function`**: "Cognitive function (healthy adults)" — would absorb the Cognition orphan-tag cluster (Creatine monohydrate, Vitamin B12, Panax ginseng, N-Acetyl Tyrosine). Currently no condition row covers non-dementia cognitive support, leaving five+ Tier-1/2 supplements with misleading or empty Recommended-For chips. Candidate seed list: Creatine monohydrate, Omega-3 (EPA/DHA), Vitamin B12, Bacopa monnieri, Panax ginseng.
- **`immune_support`**: "Immune support / cold prevention" — would absorb the Immunity orphan cluster (Zinc, Vitamin C moderate dose, Quercetin phytosome + Bromelain, Bifidobacterium lactis). Candidate seed list: Zinc, Vitamin C (moderate dose), Vitamin D3, Elderberry, Quercetin phytosome + Bromelain.

## Sanity check

- `node --check` on data.js: **pass**
- Backup file: `data.js.bak-coverage-20260527-065616`
- Re-ran coverage script post-edit; no FM regressions, no new entries appeared.
