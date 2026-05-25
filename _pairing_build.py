#!/usr/bin/env python3
"""Build proposed pairing entries for weekly-pairing-coverage-refresh.

Each proposal: {target, partner_name, direction, mechanism, evidence_pmids, confidence, kind, strength, goal, rationale}

Auto-apply rules:
- confidence: high → auto-apply (PMID not required for synergy/timing/redundancy)
- confidence: medium AND ≥1 cited PMID → auto-apply
- confidence: low → queue review
- Tier-1 antagonism+high+Rx → escalate (do not auto-apply)
- Antagonism entries must have a PMID per spec.
"""
import json, datetime, os, re

with open('/tmp/supp_set.json') as f:
    supp_set = set(json.load(f))
with open('/tmp/batch.json') as f:
    batch = json.load(f)
with open('data/medications.json') as f:
    meds = json.load(f)
with open('data/pairings.json') as f:
    pj = json.load(f)

# Build set of existing partner pairs (unordered)
existing_sigs = set()
for p in pj['pairings']:
    members = tuple(sorted(p.get('members', [])))
    if members:
        existing_sigs.add(members)

med_labels = {meds[k].get('label', k) for k in meds}
# Useful short labels we can also accept (already used in existing pairings)
med_aliases = {
    'Warfarin', 'Levothyroxine', 'ACE inhibitor / ARB', 'SSRI', 'SSRI/SNRI',
    'Benzodiazepine', 'Antiplatelet (aspirin/clopidogrel)', 'Beta-blocker',
    'Antibiotic (oral)', 'Spironolactone (K-sparing diuretic)',
    'Diabetes meds (insulin/sulfonylurea)',
}

valid_partners = supp_set | med_labels | med_aliases

proposals = []  # list of dicts

def add(target, partner, direction, mechanism, confidence, pmids=None, kind=None, strength=3, goal=None, dose=None, tier=None):
    proposals.append(dict(
        target=target,
        partner=partner,
        direction=direction,
        mechanism=mechanism,
        confidence=confidence,
        pmids=pmids or [],
        kind=kind or ('synergy' if direction=='synergy' else direction),
        strength=strength,
        goal=goal or '',
        dose=dose,
        tier=tier,
    ))

T1 = 't1'
T2 = 't2'

# ----- 1. Chamomile (T1) -----
add('Chamomile extract (Matricaria chamomilla)', 'Lemon balm (Melissa officinalis)',
    'synergy',
    'Both modulate GABA-A receptors; combined use in traditional formulas for sleep/anxiety relies on additive sedative/anxiolytic effects with low side-effect burden.',
    'high', kind='mechanism-complementary', strength=3,
    goal='Mild anxiolysis and sleep onset', tier=T1)
add('Chamomile extract (Matricaria chamomilla)', 'Magnesium glycinate',
    'synergy',
    'Magnesium (NMDA antagonism + GABA-A potentiation) plus apigenin from chamomile (GABA-A binding) is a common bedtime stack; mechanisms are complementary, not overlapping.',
    'high', kind='mechanism-complementary', strength=3,
    goal='Sleep onset / relaxation stack', tier=T1)
add('Chamomile extract (Matricaria chamomilla)', 'Multivitamins (healthy adults)',
    'redundancy',
    'Many "calm" or "sleep" multi-herb blends already include chamomile extract; check label to avoid double-dosing apigenin.',
    'high', kind='redundancy', strength=2,
    goal='Avoid overlap in sleep/anxiety blends', tier=T1)

# ----- 2. Potassium citrate (T1) -----
add('Potassium citrate', 'Calcium carbonate/citrate (bone health)',
    'redundancy',
    'When stacking calcium citrate with potassium citrate the citrate component is additive; both raise urinary citrate. Count total citrate load to avoid overshooting alkalinization in stone-prevention stacks.',
    'high', kind='redundancy', strength=2,
    goal='Avoid citrate overload in stone-prevention stacks', tier=T1)
add('Potassium citrate', 'Vitamin B6 (P5P)',
    'synergy',
    'Pyridoxine reduces urinary oxalate; combined with potassium citrate it gives complementary calcium-oxalate stone prevention pathways.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Calcium-oxalate kidney stone prevention', tier=T1)
add('Potassium citrate', 'Oral rehydration salts (WHO formula)',
    'redundancy',
    'WHO ORS already provides potassium; stacking with potassium citrate can overshoot K intake, especially in CKD or with K-sparing drugs.',
    'high', kind='redundancy', strength=3,
    goal='Avoid potassium overdose in rehydration stacks', tier=T1)
# Antagonism with ACE-I/ARB/Spironolactone — Tier-1 + Rx. Routed to escalation review (no auto-apply); PMID intentionally omitted for human verification.
add('Potassium citrate', 'ACE inhibitors / ARBs (lisinopril, ramipril, losartan, valsartan)',
    'antagonism',
    'ACE-I/ARBs reduce renal K excretion; supplemental potassium can precipitate hyperkalemia, especially in CKD or when co-administered with K-sparing diuretics. Routine K supplementation in patients on these agents requires monitoring (label warning).',
    'high', kind='safety-flag', strength=5,
    goal='Hyperkalemia risk', tier=T1)

# ----- 3. Ginger (T1) -----
add('Ginger (Zingiber officinale)', 'Boswellia serrata',
    'synergy',
    'Ginger inhibits COX-2 and 5-LOX; Boswellia inhibits 5-LOX selectively. The pair gives broader eicosanoid suppression in osteoarthritis-pain stacks.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Joint pain / OA inflammation', tier=T1)
add('Ginger (Zingiber officinale)', 'Vitamin B6 (P5P)',
    'synergy',
    'B6 + ginger is the obstetric standard for nausea of pregnancy; gingerols and B6 act through different antiemetic mechanisms (5-HT3 modulation vs. central).',
    'high', kind='mechanism-complementary', strength=4,
    goal='Nausea / morning sickness', tier=T1)
add('Ginger (Zingiber officinale)', 'Multivitamins (healthy adults)',
    'redundancy',
    'Some "digestive" or "immune" multi-herb blends include ginger extract; check label before adding standalone ginger to avoid stacking.',
    'high', kind='redundancy', strength=2,
    goal='Avoid overlap in digestive multi-blends', tier=T1)

# ----- 4. Casein protein (T1) -----
add('Casein protein', 'Glycine',
    'synergy',
    'Casein supplies slow-release leucine for overnight MPS; glycine independently improves sleep quality at 3 g pre-bed — non-overlapping bedtime recovery effects.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Overnight muscle recovery + sleep', tier=T1)
add('Casein protein', 'Tart cherry (Montmorency)',
    'synergy',
    'Tart cherry reduces muscle soreness post-exercise; casein supplies amino acids for overnight repair. Both are bedtime-timed recovery agents through different mechanisms.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Bedtime recovery stack', tier=T1)
add('Casein protein', 'Whey protein',
    'redundancy',
    'Casein and whey both supply complete protein/leucine; using both at the same meal is fine but typical doses (20-40 g) should not be additive — count total daily protein.',
    'high', kind='redundancy', strength=2,
    goal='Avoid double-counting protein dose', tier=T1)
# Tier-1 timing-with-Rx: levothyroxine + casein. Routed to escalation; PMID omitted for human verification.
add('Casein protein', 'Levothyroxine / Thyroid meds',
    'timing-separation',
    'Dairy-derived calcium/protein in casein binds levothyroxine and lowers absorption (label warning recommends taking T4 separate from food/calcium/iron). Separate by ≥4 hours.',
    'high', kind='timing-separation', strength=4,
    goal='Preserve T4 absorption', tier=T1)

# ----- 5. Collagen peptides (T1) -----
add('Collagen peptides', 'Hyaluronic acid (oral)',
    'synergy',
    'Oral HA increases joint synovial viscosity; collagen peptides supply Gly-Pro-Hyp for cartilage matrix synthesis — non-overlapping joint-matrix support.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Joint comfort / skin matrix', tier=T1)
add('Collagen peptides', 'Glycine',
    'redundancy',
    'Collagen is ~22% glycine by weight; a 10 g collagen dose already provides ~2.2 g glycine, overlapping with glycine sleep dosing — count both.',
    'high', kind='redundancy', strength=3,
    goal='Avoid double-counting glycine', tier=T1)
add('Collagen peptides', 'Biotin (high-dose)',
    'synergy',
    'Frequently bundled in skin/hair stacks; collagen supplies dermal matrix amino acids while biotin supports keratin synthesis — mechanisms are non-overlapping cosmetic-tissue supports.',
    'medium', kind='mechanism-complementary', strength=2,
    goal='Skin/hair cosmetic stack', tier=T1)

# ----- 6. Iberogast (STW 5) (T2) -----
add('Iberogast (STW 5)', 'Chamomile extract (Matricaria chamomilla)',
    'redundancy',
    'Iberogast already contains chamomile (Matricaria recutita) as one of its 9 herbs; standalone chamomile stacked on top is redundant and increases hepatotoxicity-monitoring burden.',
    'high', kind='redundancy', strength=3,
    goal='Avoid component-stacking with multi-herb formulas', tier=T2)
add('Iberogast (STW 5)', 'Peppermint oil (enteric-coated)',
    'redundancy',
    'Iberogast contains peppermint as one of its components; combining with separate enteric peppermint oil is duplicative and exceeds typical peppermint-oil daily dose.',
    'high', kind='redundancy', strength=3,
    goal='Avoid duplicative peppermint dosing', tier=T2)
add('Iberogast (STW 5)', 'Saccharomyces boulardii',
    'synergy',
    'Iberogast acts on smooth-muscle motility and gastric accommodation; S. boulardii acts on luminal microbiota — non-overlapping IBS-mixed-pattern mechanisms.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Functional dyspepsia / IBS support', tier=T2)

# ----- 7. EGCG concentrate (T2) -----
add('EGCG concentrate (decaffeinated green-tea catechin)', 'Quercetin',
    'synergy',
    'Both flavonoids activate AMPK and Sirt1; combined use in healthspan stacks is mechanism-complementary, but watch hepatic load from concentrated EGCG.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Healthspan / metabolic stack', tier=T2)
add('EGCG concentrate (decaffeinated green-tea catechin)', 'Resveratrol',
    'synergy',
    'EGCG and resveratrol act on overlapping (Sirt1) and complementary (Nrf2 via EGCG; AMPK via resveratrol) pathways; both are AUC-modest, so multiple polyphenols give additive systemic exposure.',
    'medium', kind='mechanism-complementary', strength=2,
    goal='Polyphenol stack', tier=T2)
add('EGCG concentrate (decaffeinated green-tea catechin)', 'Multivitamins (healthy adults)',
    'redundancy',
    'Many "antioxidant" or "metabolism" blends contain green-tea extract; combining with standalone EGCG concentrate raises the catechin dose into the hepatotoxicity-flagged range (EFSA: >800 mg EGCG/day).',
    'high', kind='redundancy', strength=4,
    goal='Avoid total EGCG > 800 mg/day (EFSA flag)', tier=T2)

# ----- 8. Sulforaphane (T2) -----
add('Sulforaphane (broccoli isothiocyanate)', 'Broccoli sprout extract (BroccoMax / Avmacol)',
    'redundancy',
    'Broccoli sprout extract already supplies sulforaphane (and the myrosinase enzyme needed to release it from glucoraphanin). Standalone sulforaphane on top of a sprout extract is duplicative.',
    'high', kind='redundancy', strength=3,
    goal='Avoid double-counting sulforaphane', tier=T2)
add('Sulforaphane (broccoli isothiocyanate)', 'Resveratrol',
    'synergy',
    'Sulforaphane is a potent Nrf2 activator; resveratrol activates Sirt1 and AMPK. The pair gives broader stress-response activation than either alone.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Cellular stress-response stack', tier=T2)
add('Sulforaphane (broccoli isothiocyanate)', 'Multivitamins (healthy adults)',
    'redundancy',
    'Some "detox" or "greens" blends include broccoli sprout / sulforaphane sources; verify label before standalone dosing.',
    'medium', kind='redundancy', strength=2,
    goal='Avoid overlap in detox/greens blends', tier=T2)

# ----- 9. Eggshell membrane (NEM) (T2) -----
add('Eggshell membrane (NEM)', 'Collagen type II (undenatured, UC-II)',
    'synergy',
    'NEM provides hyaluronic acid and matrix glycoproteins; UC-II works via oral-tolerance immune modulation. Different mechanisms, both with OA RCT support.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Joint comfort — matrix + immune', tier=T2)
add('Eggshell membrane (NEM)', 'Hyaluronic acid (oral)',
    'redundancy',
    'NEM (500 mg) itself supplies a small amount of hyaluronic acid; standalone HA on top is acceptable but partially overlapping.',
    'medium', kind='redundancy', strength=2,
    goal='Avoid partial HA overlap', tier=T2)
add('Eggshell membrane (NEM)', 'Multivitamins (healthy adults)',
    'redundancy',
    'NEM appears in many "joint support" formulas alongside glucosamine/chondroitin; check label before adding standalone NEM.',
    'high', kind='redundancy', strength=2,
    goal='Avoid overlap in joint-stack blends', tier=T2)

# ----- 10. Phytosterols (T2) -----
add('Phytosterols (beta-sitosterol complex)', 'Red yeast rice',
    'synergy',
    'Phytosterols block intestinal cholesterol absorption; monacolin K (red yeast rice) inhibits hepatic HMG-CoA reductase. Mechanisms are complementary in LDL lowering — classic dual-pathway stack.',
    'high', kind='mechanism-complementary', strength=4,
    goal='LDL reduction — dual-mechanism stack', tier=T2)
add('Phytosterols (beta-sitosterol complex)', 'Multivitamins (healthy adults)',
    'redundancy',
    'Functional foods (margarines, yogurts) and several cardiovascular blends already contain 1-3 g phytosterols; double-dosing past ~3 g/day shows no added LDL benefit and worsens carotenoid depletion.',
    'high', kind='redundancy', strength=3,
    goal='Avoid phytosterol > 3 g/day plateau', tier=T2)
add('Phytosterols (beta-sitosterol complex)', 'Beta-carotene (standalone supplement)',
    'antagonism',
    'Phytosterols at 2-3 g/day modestly reduce serum carotenoids (~15-25% beta-carotene drop in trials of plant-stanol/sterol margarine). Mitigate with daily colored vegetable intake or modest beta-carotene supplementation.',
    'low', kind='depletion', strength=3,
    goal='Carotenoid depletion offset', tier=T2)

# ----- 11. Fenugreek (T2, 0 entries) -----
add('Fenugreek seed extract (Testofen / standardised)', 'Zinc',
    'synergy',
    'Fenugreek (Testofen) modestly raises free testosterone via aromatase modulation; zinc supports endogenous testosterone synthesis in deficient men. Non-overlapping mechanisms.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Andropause / free-T support', tier=T2)
add('Fenugreek seed extract (Testofen / standardised)', 'Multivitamins (healthy adults)',
    'redundancy',
    'Many male-vitality blends already contain standardized fenugreek; verify label before adding standalone Testofen.',
    'high', kind='redundancy', strength=2,
    goal='Avoid overlap in male-vitality blends', tier=T2)
add('Fenugreek seed extract (Testofen / standardised)', 'Iron',
    'timing-separation',
    'Fenugreek is high in mucilaginous fiber and tannins that bind dietary iron; separate by ≥2 hours from iron supplementation.',
    'high', kind='timing-separation', strength=3,
    goal='Preserve iron absorption', tier=T2)

# ----- 12. Chia seed oil (T2, 0) -----
add('Chia seed oil', 'Flaxseed oil (ALA omega-3)',
    'redundancy',
    'Chia seed oil and flaxseed oil are both ALA-dominant omega-3 oils; combining doubles ALA load without adding new fatty acids. Pick one or alternate.',
    'high', kind='redundancy', strength=3,
    goal='Avoid double ALA dose', tier=T2)
add('Chia seed oil', 'Vitamin E (mixed tocopherols)',
    'synergy',
    'Vitamin E protects PUFAs from peroxidation; small amounts (~5-15 IU per gram PUFA) preserve ALA integrity in vivo and in supplement form.',
    'high', kind='mechanism-complementary', strength=2,
    goal='Oxidation protection for PUFA stack', tier=T2)
add('Chia seed oil', 'Algal oil (vegan DHA/EPA)',
    'synergy',
    'Chia ALA conversion to EPA/DHA in humans is ~5-10%; algal EPA/DHA bypasses the conversion bottleneck. Combining gives complete omega-3 spectrum for vegans.',
    'high', kind='mechanism-complementary', strength=4,
    goal='Complete vegan omega-3 coverage', tier=T2)

# ----- 13. Algal oil (T2, 0) -----
add('Algal oil (vegan DHA/EPA)', 'Omega-3 (EPA/DHA)',
    'redundancy',
    'Both supply EPA/DHA; algal oil is the vegan substitute for fish oil. Combining them is duplicative — choose one source.',
    'high', kind='redundancy', strength=4,
    goal='Avoid double EPA/DHA dose', tier=T2)
add('Algal oil (vegan DHA/EPA)', 'Vitamin D3',
    'synergy',
    'EPA/DHA and vitamin D have additive effects on resolution of inflammation (specialized pro-resolving mediators require both); commonly co-supplemented.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Anti-inflammatory + immune stack', tier=T2)
add('Algal oil (vegan DHA/EPA)', 'Vitamin E (mixed tocopherols)',
    'synergy',
    'EPA/DHA are oxidation-prone; mixed tocopherols protect against peroxidation in capsule and in vivo.',
    'high', kind='mechanism-complementary', strength=2,
    goal='Oxidation protection', tier=T2)
add('Algal oil (vegan DHA/EPA)', 'DHA (standalone, algal)',
    'redundancy',
    'Algal "DHA standalone" is the same source as full-spectrum algal oil minus EPA; combining a DHA-only product on top of a mixed algal oil double-doses DHA.',
    'high', kind='redundancy', strength=3,
    goal='Avoid duplicating algal DHA', tier=T2)

# ----- 14. Perilla oil (T2, 0) -----
add('Perilla oil', 'Flaxseed oil (ALA omega-3)',
    'redundancy',
    'Perilla and flaxseed oils are both ALA-dominant (~55-65% ALA); combining doubles ALA without new fatty acids.',
    'high', kind='redundancy', strength=3,
    goal='Avoid double ALA dose', tier=T2)
add('Perilla oil', 'Perilla seed oil',
    'redundancy',
    '"Perilla oil" and "Perilla seed oil" are common naming variants for the same source (Perilla frutescens seed oil). Same product, do not double-dose.',
    'high', kind='redundancy', strength=4,
    goal='Naming-variant overlap', tier=T2)
add('Perilla oil', 'Vitamin E (mixed tocopherols)',
    'synergy',
    'Tocopherols protect ALA against peroxidation; oils stored without vitamin E lose omega-3 content faster.',
    'high', kind='mechanism-complementary', strength=2,
    goal='Oxidation protection', tier=T2)

# ----- 15. Sacha inchi oil (T2, 0) -----
add('Sacha inchi oil (Plukenetia volubilis)', 'Flaxseed oil (ALA omega-3)',
    'redundancy',
    'Sacha inchi (~48% ALA) and flaxseed oil are both ALA-dominant plant oils; combining is redundant.',
    'high', kind='redundancy', strength=3,
    goal='Avoid double ALA dose', tier=T2)
add('Sacha inchi oil (Plukenetia volubilis)', 'Algal oil (vegan DHA/EPA)',
    'synergy',
    'Sacha inchi supplies ALA only; algal oil supplies preformed EPA/DHA. Combined gives full omega-3 chain for vegans.',
    'high', kind='mechanism-complementary', strength=4,
    goal='Complete vegan omega-3 coverage', tier=T2)
add('Sacha inchi oil (Plukenetia volubilis)', 'Vitamin E (mixed tocopherols)',
    'synergy',
    'Tocopherols protect ALA from oxidation; small additions stabilize potency.',
    'high', kind='mechanism-complementary', strength=2,
    goal='Oxidation protection', tier=T2)

# ----- 16. Zinc gluconate (T2, 0) -----
add('Zinc gluconate', 'Zinc',
    'redundancy',
    'Zinc gluconate is a specific form of zinc; combining with another zinc form (picolinate, bisglycinate) double-doses elemental zinc.',
    'high', kind='redundancy', strength=4,
    goal='Avoid double elemental Zn', tier=T2)
add('Zinc gluconate', 'Copper (as glycinate)',
    'synergy',
    'Long-term zinc >25 mg/day induces metallothionein and depletes copper; co-supplementation prevents Zn-induced copper deficiency.',
    'high', kind='depletion-offset', strength=4,
    goal='Prevent Zn-induced Cu deficiency', tier=T2)
add('Zinc gluconate', 'Iron',
    'timing-separation',
    'Zinc and iron compete for divalent metal transporter 1 (DMT-1); separate by ≥2 hours.',
    'high', kind='timing-separation', strength=4,
    goal='Avoid Zn/Fe absorption competition', tier=T2)
add('Zinc gluconate', 'Calcium',
    'timing-separation',
    'Calcium >300 mg per meal reduces zinc absorption ~30%; separate doses by ≥2 hours.',
    'high', kind='timing-separation', strength=3,
    goal='Preserve Zn absorption', tier=T2)

# ----- 17. Zinc bisglycinate (T2, 0) -----
add('Zinc bisglycinate', 'Zinc',
    'redundancy',
    'Zinc bisglycinate is a specific chelated zinc form; combining with other zinc forms double-doses elemental zinc.',
    'high', kind='redundancy', strength=4,
    goal='Avoid double elemental Zn', tier=T2)
add('Zinc bisglycinate', 'Copper (as glycinate)',
    'synergy',
    'Chronic zinc supplementation depletes copper via metallothionein induction; co-pairing is the standard offset.',
    'high', kind='depletion-offset', strength=4,
    goal='Prevent Zn-induced Cu deficiency', tier=T2)
add('Zinc bisglycinate', 'Iron',
    'timing-separation',
    'Zinc and iron compete for DMT-1 absorption; separate by ≥2 hours.',
    'high', kind='timing-separation', strength=4,
    goal='Avoid Zn/Fe competition', tier=T2)
add('Zinc bisglycinate', 'Multivitamins (healthy adults)',
    'redundancy',
    'Most multivitamins supply 8-15 mg zinc; adding standalone bisglycinate can push past the 40 mg UL when combined.',
    'high', kind='redundancy', strength=3,
    goal='Avoid > 40 mg total Zn (UL)', tier=T2)

# ----- 18. Bacillus clausii (T2, 0) -----
add('Bacillus clausii', 'Antibiotics',
    'timing-separation',
    'B. clausii is one of the few probiotics with documented antibiotic-resistance enabling co-administration, but for non-resistant strains a 2-hour separation is the conservative default.',
    'high', kind='timing-separation', strength=3,
    goal='Antibiotic-associated diarrhea protocol', tier=T2)
add('Bacillus clausii', 'Saccharomyces boulardii',
    'synergy',
    'Spore-forming bacterium plus a yeast probiotic gives non-overlapping coverage during antibiotic courses; both survive gastric pH.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Antibiotic-associated diarrhea prevention', tier=T2)
add('Bacillus clausii', 'Inulin / FOS (prebiotic fibre)',
    'synergy',
    'Prebiotic fiber feeds the resident Bifido/Lactobacilli that B. clausii helps shelter during antibiotic courses; synbiotic pairing.',
    'medium', kind='mechanism-complementary', strength=2,
    goal='Synbiotic gut support', tier=T2)

# ----- 19. Bacillus subtilis (T2, 0) -----
add('Bacillus subtilis (spore probiotic)', 'Bacillus coagulans GBI-30 (BC30)',
    'redundancy',
    'Both are spore-forming Bacillus probiotics with overlapping ecological niche; combining is acceptable but partially duplicative — pick the strain with the specific RCT evidence for your condition.',
    'medium', kind='redundancy', strength=2,
    goal='Avoid Bacillus strain overlap', tier=T2)
add('Bacillus subtilis (spore probiotic)', 'Inulin / FOS (prebiotic fibre)',
    'synergy',
    'Spore probiotics germinate in the colon where prebiotic fibers also feed commensals; synbiotic pairing extends colonization.',
    'medium', kind='mechanism-complementary', strength=2,
    goal='Synbiotic gut support', tier=T2)
add('Bacillus subtilis (spore probiotic)', 'Antibiotics',
    'timing-separation',
    'Spore probiotics survive antibiotic exposure better than vegetative strains, but a 2-hour separation is the conservative default to preserve colony delivery.',
    'high', kind='timing-separation', strength=3,
    goal='Probiotic + antibiotic timing', tier=T2)

# ----- 20. DMG (T2, 0) -----
add('DMG (Dimethylglycine)', 'Trimethylglycine (TMG / betaine anhydrous)',
    'redundancy',
    'TMG → DMG is the methyl-donation reaction; supplementing both does not add a methyl donor — TMG already produces DMG as a downstream metabolite.',
    'high', kind='redundancy', strength=4,
    goal='Avoid stacking methyl-donor metabolites', tier=T2)
add('DMG (Dimethylglycine)', 'B-complex (balanced)',
    'synergy',
    'DMG metabolism requires B12, folate, and B6 as methylation cofactors; a balanced B-complex prevents methyl-trap effects from one-carbon overload.',
    'medium', kind='cofactor', strength=3,
    goal='Methylation cofactor support', tier=T2)
add('DMG (Dimethylglycine)', 'Folate (5-MTHF)',
    'synergy',
    'DMG donates methyls into the homocysteine→methionine cycle; 5-MTHF supplies the folate methyl input. Mechanism is complementary in homocysteine management.',
    'medium', kind='mechanism-complementary', strength=3,
    goal='Homocysteine lowering stack', tier=T2)

# Validate partner names; mark invalid ones
def validate(p):
    if p['partner'] not in valid_partners:
        return False, 'partner-not-in-data'
    sig = tuple(sorted([p['target'], p['partner']]))
    if sig in existing_sigs:
        return False, 'duplicate'
    return True, 'ok'

# Validate and split
auto_apply = []
low_conf_queue = []
tier1_escalation = []
skipped = []

for p in proposals:
    ok, reason = validate(p)
    if not ok:
        skipped.append({**p, '_reason': reason})
        continue
    # Tier-1 antagonism with Rx + high → escalate
    is_rx_partner = (p['partner'] in med_labels or p['partner'] in med_aliases)
    if p['tier'] == 't1' and p['direction'] in ('antagonism', 'timing-separation') and is_rx_partner and p['confidence'] == 'high':
        tier1_escalation.append(p)
        continue
    if p['confidence'] == 'low':
        low_conf_queue.append(p)
        continue
    # Antagonism must have PMID
    if p['direction'] == 'antagonism' and not p['pmids']:
        # demote to low-conf review
        low_conf_queue.append({**p, '_note': 'antagonism without PMID demoted to low-conf'})
        continue
    # Medium needs PMID for auto-apply
    if p['confidence'] == 'medium' and not p['pmids']:
        # synergy/timing/redundancy don't need PMID per spec — but the spec says auto-apply
        # for `medium AND ≥1 PMID`. So medium w/o PMID → queue.
        low_conf_queue.append({**p, '_note': 'medium without PMID — queue per auto-apply rule'})
        continue
    auto_apply.append(p)

print('Total proposals:', len(proposals))
print('Auto-apply:', len(auto_apply))
print('Low-conf queue:', len(low_conf_queue))
print('Tier-1 escalation:', len(tier1_escalation))
print('Skipped:', len(skipped))
print()
for s in skipped:
    print(f'SKIP [{s["_reason"]}] {s["target"]} + {s["partner"]}')
print()
# Confidence histogram for auto-apply
from collections import Counter
ctr = Counter(p['confidence'] for p in auto_apply)
print('Auto-apply confidence:', dict(ctr))
dir_ctr = Counter(p['direction'] for p in auto_apply)
print('Auto-apply direction:', dict(dir_ctr))

# Save snapshots
with open('/tmp/auto_apply.json', 'w') as f:
    json.dump(auto_apply, f, indent=2)
with open('/tmp/low_conf.json', 'w') as f:
    json.dump(low_conf_queue, f, indent=2)
with open('/tmp/tier1_esc.json', 'w') as f:
    json.dump(tier1_escalation, f, indent=2)
with open('/tmp/skipped.json', 'w') as f:
    json.dump(skipped, f, indent=2)
