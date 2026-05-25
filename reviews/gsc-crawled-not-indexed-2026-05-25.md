# GSC "Crawled — currently not indexed" — 73 URLs (2026-05-25)

## Breakdown by URL pattern

| Pattern | Count | Notes |
|---|---|---|
| `/a/<slug>.html` (articles) | ~40 | Largest bucket — quality threshold concern |
| `/condition/<slug>.html` | ~11 | Templated condition pages |
| `/s/<slug>.html` (supplements) | 8 | Less common supplements (hops, bifido-evc001, perilla, etc.) |
| `/supplement.html?slug=X` (SPA) | 5 | Should clear via dynamic canonical → /s/X.html |
| `/compare/<X>-vs-<Y>.html` | 2 | berberine-vs-cinnamon, sulforaphane-vs-curcumin |
| `/for/<slug>.html` | 2 | gut-health, bariatric-post-op |
| `/stack/<slug>.html` | 1 | gut-restoration |
| `/data/supplements.csv` | 1 | Data file — should be in robots.txt |
| `/feed-guide.xml` | 1 | Should not exist or be discoverable |

## Diagnostic actions taken

- [x] Removed `inositol-myo-form-pcos-metabolic` dup from supplement-meta.json
- [x] Created `/s/inositol-myo-form-pcos-metabolic.html` redirect to canonical
- [x] Created `/a/index.html` redirect to /article.html
- [x] Removed broken es/fr hreflang from 3 condition files (alopecia-areata, copd-adjunct, peptic-ulcer-disease)
- [x] Cleaned dup hreflang on anxiety-stack, pcos-protocol
- [x] Patched 2 generator SKILL.md files to add existence check before emitting es/fr hreflang

## SPA URLs (5)

Already have dynamic canonical script — Google will clear these as it recrawls. No action needed.

- /supplement.html?slug=curcumin → /s/curcumin.html
- /supplement.html?slug=methylfolate → /s/methylfolate.html
- /supplement.html?slug=potassium-citrate → /s/potassium-citrate.html
- /supplement.html?slug=fenugreek-trigonella-foenum-graecum → /s/fenugreek.html
- /supplement.html?slug=lions-mane-mushroom → /s/lions-mane-mushroom.html

## Data/feed files (2)

- /data/supplements.csv — block via robots.txt
- /feed-guide.xml — block via robots.txt OR remove if not needed

## Articles (~40) + Conditions (~11) — quality remediation

These are the actionable bucket. Pattern: many auto-generated /a/ articles + templated /condition/ pages. Google's heuristic: insufficient unique signal to justify indexing.

Sample articles flagged (May 16-23 crawls):
- /a/12-supplement-mistakes-you-should-literally-never-make.html
- /a/the-resveratrol-disappointment-a-decade-of-failed-promises.html
- /a/quercetin-and-immunity-from-antioxidant-to-senolytic.html
- /a/spirulina-nutrient-powerhouse-or-overhyped-algae.html
- /a/anthocyanin-concentrate.html
- /a/the-truth-about-collagen-supplements-what-13-clinical-trials-actually-show.html
- /a/calcium-supplements-when-they-help-and-when-they-harm.html
- /a/comfrey-and-pyrrolizidine-alkaloids-why-the-fda-restricted-the-herb.html
- /a/calcium-dose-splitting-why-doses-above-500-mg-waste-absorption.html
- /a/reading-a-magnesium-label-matching-the-form-to-the-goal.html
- /a/lectin-free-supplements-and-the-plant-paradox-what-the-evidence-shows.html
- /a/proprietary-blends-on-supplement-labels-what-they-actually-hide.html
- /a/hair-skin-and-nails-formulas-what-biotin-and-collagen-trials-actually-show.html
- /a/calcium-and-cardiovascular-risk-the-2024-cochrane-update.html
- /a/intravenous-vitamin-c-megadose-the-marik-protocol-collapse-and-what-replaced-it.html
- /a/probiotic-strain-selection-by-condition-a-practical-guide.html
- /a/how-to-time-iron-supplements-around-coffee-tea-and-calcium.html
- /a/dasatinib-plus-quercetin-senolytic-therapy-the-2024-2025-human-trial-update.html
- /a/glp-1-mimicking-supplements-what-berberine-gymnema-and-bitter-melon-actually-do.html
- /a/how-to-time-iron-supplements-coffee-calcium-vitamin-c-and-ppis.html
- /a/st-johns-wort-drug-interactions-the-cyp3a4-inducer-problem.html
- /a/icosapent-ethyl-vs-mixed-omega-3-reconciling-reduce-it-and-strength.html
- /a/tudca-tauroursodeoxycholic-acid-for-liver-and-bile-flow-what-trials-show.html
- /a/vitex-agnus-castus-chasteberry-for-pms-and-pmdd-what-rcts-show.html
- /a/mct-oil-c8-vs-c10-vs-coconut-oil-which-fatty-acid-actually-matters.html
- /a/borage-oil-gla-for-atopic-dermatitis-where-the-evidence-collapsed.html
- /a/riboflavin-for-pediatric-migraine-prophylaxis-what-the-trials-actually-show.html
- /a/passionflower-passiflora-incarnata-for-anxiety-what-controlled-trials-show.html
- /a/marine-collagen-vs-bovine-collagen-the-amino-acid-profile-is-nearly-identical.html
- /a/licorice-root-glycyrrhizin-the-pseudoaldosteronism-risk-people-keep-missing.html
- /a/zinc-carnosine-for-gastric-ulcers-and-leaky-gut-the-japanese-trial-record.html
- /a/marshmallow-root-althaea-officinalis-for-cough-sore-throat-and-reflux.html
- /a/rosehip-rosa-canina-for-osteoarthritis-the-gopo-trials.html
- /a/apigenin-cd38-inhibition-and-nad-the-flavonoid-mechanism-and-emerging-human-evidence.html
- /a/methylene-blue-cognitive-enhancer-or-serotonin-syndrome-risk.html
- /a/adenosylcobalamin-the-mitochondrial-b12-form-most-supplements-omit.html
- /a/vitamin-b6-pyridoxine-hcl-vs-p5p-bioavailability-and-toxicity-windows.html
- /a/nicotinic-acid-vs-niacinamide-flushing-hepatotoxicity-and-dose-differences.html
- /a/andrographis-paniculata-the-indian-echinacea-for-cold-symptoms.html
- /a/ergothioneine-the-longevity-vitamin-from-mushrooms-and-its-cellular-antioxidant-role.html

Sample conditions flagged:
- /condition/adhd-stack.html
- /condition/statin-myopathy.html
- /condition/chronic-venous-insufficiency.html
- /condition/recurrent-aphthous-mouth-ulcers.html
- /condition/chronic-rhinosinusitis.html
- /condition/premenstrual-dysphoric-disorder.html
- /condition/atrial-fibrillation-protocol.html
- /condition/carpal-tunnel-syndrome.html
- /condition/shingles-postherpetic-neuralgia.html
- /condition/cluster-headache-protocol.html
- /condition/functional-dyspepsia-protocol.html
