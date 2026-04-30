# SPL Drug-Label Mining — 2026-04-28

**Phase:** 2 / Item #2 of IMPLEMENTATION_ROADMAP.md
**Source:** openFDA Drug Labels (`sources/adapters/openfda_drugs.py`)
**Targets:** 18 curated high-value supplements
**Candidate pairs surfaced:** 29
**Already in DRUG_INTERACTIONS.pairs:** 0
**Need review:** 29

---

## How to use this file

Each candidate below is a drug-supplement pair surfaced from FDA's drug-label `drug_interactions` section. The severity is heuristic — based on the snippet text. **Read the snippet carefully** before promoting to `DRUG_INTERACTIONS.pairs` in `app.js`.

Workflow:
1. Read each candidate's snippet.
2. If the interaction is real and the severity is right, copy the suggested snippet into `DRUG_INTERACTIONS.pairs`.
3. If the snippet doesn't actually describe an interaction (false positive — e.g. the supplement was just mentioned in a list), mark `[skip]`.
4. If the severity should be different, edit before promoting.

Severity heuristic legend:
- `avoid`: snippet contains 'contraindicated', 'avoid', 'do not'
- `caution`: snippet contains 'monitor', 'may increase/decrease', 'interact'
- `extra`: snippet contains 'depletes', 'reduces absorption', 'increases requirements'

---

## AVOID — 3 candidate(s)

- [ ] **cladribine** × **Curcumin (bioavailable form)**
  - brands: Cladribine
  - snippet: > …on of cladribine may be altered by potent ENT1, CNT3, and BCRP transporter inhibitors. Prevention or Management Avoid co-administration of potent ENT1, CNT3, or BCRP transporter inhibitors (e.g., ritonavir, eltrombopag, curcumin, cyclosporine, dilazep, nifedipine, nimodipine, cilostazol, sulindac, dipyridamole, or reserpine) during the 4 to 5 day cladribine treatment cycles. If this is not possible, consider selection of alternative concomitant…
  - SPL set_id: `407c52d5-6498-7da5-da35-acc9ca73ced3`

- [ ] **capecitabine** × **Folate (5-MTHF)**
  - brands: capecitabine
  - snippet: > …3 )], which may decrease efficacy. Avoid concomitant use of allopurinol with capecitabine tablets. Leucovorin The concentration of fluorouracil is increased and its toxicity may be enhanced by leucovorin, folic acid, or folate analog products. Deaths from severe enterocolitis, diarrhea, and dehydration have been reported in elderly patients receiving weekly leucovorin and fluorouracil. Instruct patients not to take products containing folic a…
  - SPL set_id: `007e3432-c8aa-2a76-52ba-c346924c08a7`

- [ ] **deferiprone** × **Milk thistle (Silymarin)**
  - brands: Deferiprone
  - snippet: > …e absolute neutrophil count [see Warnings and Precautions (5.1) ] . 7.2 Effect of Other Drugs on Deferiprone UDP-Glucuronosyltransferases (UGT) Avoid use of UGT1A6 inhibitors (e.g., diclofenac, probenecid, or silymarin (milk thistle)) with deferiprone [see Dosage and Administration (2) , Adverse Reactions (6.1) , Clinical Pharmacology (12.3) ] . Polyvalent Cations Deferiprone has the potential to bind polyvalent cations (e.g., iron, aluminum, and z…
  - SPL set_id: `5af1643d-4c6e-4668-ae9b-1046f0ad6d8a`

---

## CAUTION — 24 candidate(s)

- [ ] **calcium acetate** × **Calcium**
  - brands: Calcium Acetate
  - snippet: > 7 DRUG INTERACTIONS The drug interaction of calcium acetate is characterized by the potential of calcium to bind to drugs with anionic functions (e.g., carboxyl, and hydroxyl groups). Calcium acetate may decrease the bioavailability of tetracyclines or fluoroquinolones v…
  - SPL set_id: `000c044a-12ef-4484-942e-99552b777d58`

- [ ] **methotrexate** × **Folate (5-MTHF)**
  - brands: METHOTREXATE
  - snippet: > …e is coadministered with hepatotoxic or nephrotoxic products. If coadministration cannot be avoided, monitor closely for methotrexate adverse reactions when coadministered with: Oral antibiotics (including neomycin) Antifolate drugs (e.g., dapsone, pemetrexed, pyrimethamine and sulfonamides) Oral or intravenous penicillin or sulfonamide antibiotics Aspirin and other nonsteroidal anti- inflammatory drugs Hepatotoxic products Highly protein-bou…
  - SPL set_id: `04a95db9-a124-4b97-bd71-1c37a6b3b0c8`

- [ ] **estradiol** × **Iodine**
  - brands: Estradiol Vaginal
  - snippet: > … of fibrinogen and fibrinogen activity; increased plasminogen antigen and activity. 2. Increased thyroid-binding globulin (TBG) leading to increased circulating total thyroid hormone levels, as measured by protein-bound iodine (PBI), T 4 levels (by column or by radioimmunoassay) or T 3 levels by radioimmunoassay. T 3 resin uptake is decreased, reflecting the elevated TBG. Free T 4 and free T 3 concentrations are unaltered. Women on thyroid re…
  - SPL set_id: `0137d491-6917-4060-9b32-e0cd7b0badbb`

- [ ] **medroxyprogesterone acetate** × **Iodine**
  - brands: MEDROXYPROGESTERONE ACETATE
  - snippet: > …steroid levels are decreased (e.g., progesterone, estradiol, pregnanediol, testosterone, cortisol). (b) Gonadotropin levels are decreased. (c) Sex-hormone-binding-globulin concentrations are decreased. (d) Protein-bound iodine and butanol extractable protein-bound iodine may increase. T3-uptake values may decrease. (e) Coagulation test values for prothrombin (Factor II), and Factors VII, VIII, IX, and X may increase. (f) Sulfobromophthalein a…
  - SPL set_id: `01e28bef-9758-40cf-a4ff-86ae9f4f5105`

- [ ] **esomeprazole magnesium** × **Iron**
  - brands: Esomeprazole Magnesium
  - snippet: > …ntion: See Contraindications, Warnings and Precautions in prescribing information for clarithromycin. See Drug Interactions in prescribing information for amoxicillin. Drugs Dependent on Gastric pH for Absorption (e.g., iron salts, erlotinib, dasatinib, nilotinib, mycophenolate mofetil, ketoconazole/itraconazole) Clinical Impact: Esomeprazole can reduce the absorption of other drugs due to its effect on reducing intragastric acidity Interve…
  - SPL set_id: `009794ae-8199-4176-9dc6-4c5e752d845c`

- [ ] **lansoprazole** × **Iron**
  - brands: Lansoprazole
  - snippet: > …ual patients may require additional titration of their theophylline dosage when Lansoprazole is started or stopped to ensure clinically effective blood concentrations. Drugs Dependent on Gastric pH for Absorption (e.g., iron salts, erlotinib, dasatinib, nilotinib, mycophenolate mofetil, ketoconazole/itraconazole) Clinical Impact: Lansoprazole can reduce the absorption of other drugs due to its effect on reducing intragastric acidity. Interv…
  - SPL set_id: `00a574e0-bd03-deea-9f85-b108f78982ba`

- [ ] **sevelamer carbonate** × **Iron**
  - brands: Sevelamer Carbonate
  - snippet: > … levels of concomitant drugs that have a narrow therapeutic range. Table 5. Sevelamer Drug Interactions Oral drugs for which sevelamer did not alter the pharmacokinetics when administered concomitantly Digoxin Enalapril Iron Metoprolol Warfarin Oral drugs that have demonstrated interaction with sevelamer and are to be dosed separately from sevelamer carbonate Ciprofloxacin Mycophenolate mofetil Dosing Recommendations Take at least 2 hours b…
  - SPL set_id: `0085356d-5fec-3cce-2bd3-108be70e515d`

- [ ] **naproxen** × **Magnesium**
  - brands: Naproxen
  - snippet: > …ing these NSAIDs should interrupt dosing for at least five days before, the day of, and two days following pemetrexed administration. Antacids and Sucralfate Clinical Impact: Concomitant administration of some antacids (magnesium oxide or aluminum hydroxide) and sucralfate can delay the absorption of naproxen. Intervention: Concomitant administration of antacids such as magnesium oxide or aluminum hydroxide, and sucralfate with naproxen tablets …
  - SPL set_id: `000155a8-709c-44e5-a75f-cd890f3a7caf`

- [ ] **olanzapine** × **Magnesium**
  - brands: Olanzapine
  - snippet: > …dministration of diazepam with olanzapine potentiated the orthostatic hypotension observed with olanzapine [see Drug Interactions ( 7.2 )] . Cimetidine and Antacids — Single doses of cimetidine (800 mg) or aluminum- and magnesium-containing antacids did not affect the oral bioavailability of olanzapine. Inducers of CYP1A2 — Carbamazepine therapy (200 mg bid) causes an approximately 50% increase in the clearance of olanzapine. This increase is li…
  - SPL set_id: `002dd00f-7946-ea4f-e063-6294a90a5916`

- [ ] **atorvastatin calcium** × **Niacin (Vitamin B3)**
  - brands: Atorvastatin calcium
  - snippet: > …gns and symptoms of myopathy particularly during initiation of therapy and during upward dose titration of either drug. Examples: Erythromycin, clarithromycin, itraconazole, ketoconazole, posaconazole, and voriconazole. Niacin Clinical Impact: Cases of myopathy and rhabdomyolysis have been observed with concomitant use of lipid modifying dosages of niacin ( > 1 gram/day niacin) with atorvastatin. Intervention: Consider if the benefit of using…
  - SPL set_id: `00afce9b-48c9-487a-a738-e359c005c707`

- [ ] **simvastatin** × **Niacin (Vitamin B3)**
  - brands: SIMVASTATIN
  - snippet: > …he risk of myopathy and rhabdomyolysis may be increased by coadministration. Intervention: If treatment with daptomycin is required, consider temporarily suspending simvastatin during the course of daptomycin treatment. Niacin Clinical Impact: Cases of myopathy and rhabdomyolysis have been observed with concomitant use of lipid modifying dosages of niacin-containing products (≥1 gram/day niacin) with simvastatin. The risk of myopathy is great…
  - SPL set_id: `00896fff-081d-4553-be8c-1999a8a73dda`

- [ ] **icosapent ethyl** × **Omega-3 (EPA/DHA)**
  - brands: ICOSAPENT ETHYL
  - snippet: > 7 DRUG INTERACTIONS Increased Bleeding Risk with Anticoagulants and Antiplatelet Agents: Some published studies with omega-3 fatty acids have demonstrated prolongation of bleeding time. Monitor patients receiving icosapent ethyl and concomitant anticoagulants and/or antiplatelet agents for bleeding. (7) 7.1 Increased Bleeding Risk with Antico…
  - SPL set_id: `019cc0ac-0c2f-426d-996a-6d932f954443`

- [ ] **omega-3-acid ethyl esters** × **Omega-3 (EPA/DHA)**
  - brands: Omega-3-acid ethyl esters
  - snippet: > 7 DRUG INTERACTIONS Omega-3-acids may prolong bleeding time. Patients taking omega-3-acid ethyl esters capsules and an anticoagulant or other drug affecting coagulation (e.g., anti-platelet agents) should be monitored periodically. (7.1) 7.1 Antic…
  - SPL set_id: `034045d6-5308-4701-b97b-8873e053ec17`

- [ ] **naldemedine** × **Quercetin**
  - brands: SYMPROIC
  - snippet: > … [see Clinical Pharmacology (12.3) ] Intervention Monitor for potential naldemedine-related adverse reactions [see Adverse Reactions (6.1) ] . P-glycoprotein (P-gp) Inhibitors (e.g., amiodarone, captopril, cyclosporine, quercetin, quinidine, verapamil) Clinical Impact Increase in plasma naldemedine concentrations [see Clinical Pharmacology (12.3) ] Intervention Monitor for potential naldemedine-related adverse reactions [see Adverse Reactions (6…
  - SPL set_id: `b1a1256c-a1eb-4abe-ab1e-30e4711afd16`

- [ ] **diltiazem hydrochloride** × **SAMe (S-Adenosyl-L-Methionine)**
  - brands: diltiazem hydrochloride
  - snippet: > …ssover study, coadministration of diltiazem (120 mg BID diltiazem SR for 2 weeks) with a single 20 mg dose of lovastatin resulted in 3- to 4-fold increase in mean lovastatin AUC and C max versus lovastatin alone. In the same study, there was no significant change in 20 mg single dose pravastatin AUC and C max during diltiazem coadministration. Diltiazem plasma levels were not significantly affected by lovastatin or pravastatin. Alcohol: Alc…
  - SPL set_id: `0089fc7a-a7aa-4873-b699-39a1b21616ca`

- [ ] **sertraline hydrochloride** × **SAMe (S-Adenosyl-L-Methionine)**
  - brands: Sertraline Hydrochloride
  - snippet: > …here was a dose-related increase of liver adenomas in male mice receiving sertraline at 10-40 mg/kg (0.25-1.0 times the MRHD on a mg/m 2 basis). No increase was seen in female mice or in rats of either sex receiving the same treatments, nor was there an increase in hepatocellular carcinomas. Liver adenomas have a variable rate of spontaneous occurrence in the CD-1 mouse and are of unknown significance to humans. There was an increase in fol…
  - SPL set_id: `00179766-980b-44b0-99d3-1fee2bb27e37`

- [ ] **duloxetine hydrochloride** × **Tryptophan**
  - brands: Duloxetine Delayed-Release
  - snippet: > …nd Warnings and Precautions (5.4) ]. 7.14 Other Serotonergic Drugs The concomitant use of serotonergic drugs (including other SNRIs, SSRIs, triptans, tricyclic antidepressants, opioids, lithium, buspirone, amphetamines, tryptophan, and St. John's Wort) with Duloxetine delayed-release capsules increases the risk of serotonin syndrome. Monitor patients for signs and symptoms of serotonin syndrome, particularly during treatment initiation and dosage…
  - SPL set_id: `00628e5e-4c5b-2573-e063-6294a90a0e3b`

- [ ] **ziprasidone** × **Tryptophan**
  - brands: ziprasidone
  - snippet: > …ay antagonize the effects of levodopa and dopamine agonists. Risk of serotonin syndrome with concomitant therapy with other serotonergic drugs such as SNRIs, SSRIs, triptans, tricyclic antidepressants, opioids, lithium, tryptophan, buspirone, amphetamines, and St. John’s Wort [see Contraindications ( 4.3 ), Warnings and Precautions ( 5.4 ), Adverse Reactions ( 6.2 )]. 7.4 Pharmacokinetic Interactions Carbamazepine Carbamazepine is an inducer of C…
  - SPL set_id: `0071a228-21cc-56a6-dcc9-a7a6ceea758c`

- [ ] **multiple vitamins injection** × **Vitamin B12**
  - brands: Infuvite Adult
  - snippet: > …n of hydralazine or isoniazid may increase pyridoxine requirements ( 7.2 ). • Phenytoin: May decrease folic acid concentrations ( 7.2 ) • Chloramphenicol : In patients with pernicious anemia, the hematologic response to vitamin B12 therapy may be inhibited ( 7.2 ) 7.1 Drug Interactions Affecting Co-Administered Drugs Warfarin : Vitamin K, a component of INFUVITE ADULT, antagonizes the anticoagulant action of warfarin. In patients who are co-admini…
  - SPL set_id: `14c7bfc5-07e8-400f-b8ff-5e4794dd2805`

- [ ] **linezolid** × **Vitamin E (mixed tocopherols)**
  - brands: Linezolid
  - snippet: > … together. Gentamicin : The pharmacokinetics of linezolid or gentamicin are not altered when administered together. Antioxidants The potential for drug-drug interactions with linezolid and the antioxidants Vitamin C and Vitamin E was studied in healthy volunteers. Subjects were administered a 600 mg oral dose of linezolid on Day 1, and another 600 mg dose of linezolid on Day 8. On Days 2–9, subjects were given either Vitamin C (1,000 mg/day) or …
  - SPL set_id: `374af2a7-d994-40bd-a86a-cd9038d0b72c`

- [ ] **orlistat** × **Vitamin E (mixed tocopherols)**
  - brands: Xenical
  - snippet: > …n Supplements and Analogues Data from a pharmacokinetic interaction study showed that the absorption of beta-carotene supplement is reduced when concomitantly administered with XENICAL. XENICAL inhibited absorption of a vitamin E acetate supplement. The effect of XENICAL on the absorption of supplemental vitamin D, vitamin A, and nutritionally-derived vitamin K is not known at this time [see Clinical Pharmacology (12.3) , and Warnings and Precau…
  - SPL set_id: `6240792b-9224-2d10-e053-2a91aa0a2c3e`

- [ ] **soybean oil** × **Vitamin K1 (Phylloquinone)**
  - brands: NutriLipid I.V. Fat Emulsion
  - snippet: > …ONS Coumarin and coumarin derivatives, including warfarin: Anticoagulant activity may be counteracted; monitor laboratory parameters (7.1) 7.1 Coumarin and Coumarin Derivatives The soybean oil in Nutrilipid 20% contains vitamin K1. Vitamin K can reverse the anticoagulant activity of coumarin and coumarin derivatives, including warfarin, which work by blocking recycling of vitamin K. Monitor laboratory parameters for anticoagulant activity in pati…
  - SPL set_id: `193290b1-a0a1-4054-a22a-de5c9e7a8b73`

- [ ] **moxifloxacin hydrochloride** × **Zinc**
  - brands: MOXIFLOXACIN HYDROCHLORIDE
  - snippet: > … and transition metal cations. Oral administration of moxifloxacin hydrochloride with antacids containing aluminum or magnesium, with sucralfate, with metal cations such as iron, or with multivitamins containing iron or zinc, or with formulations containing divalent and trivalent cations such as didanosine buffered tablets for oral suspension or the pediatric powder for oral solution, may substantially interfere with the absorption of moxif…
  - SPL set_id: `02c29e8e-8346-4e28-b7fc-2f4cb61ad37d`

- [ ] **tetracycline hydrochloride** × **Zinc**
  - brands: Tetracycline Hydrochloride
  - snippet: > …are on anticoagulant therapy may require downward adjustment of their anticoagulant dosage. Absorption of tetracyclines is impaired by antacids containing aluminum, calcium or magnesium and preparations containing iron, zinc, or sodium bicarbonate. Concurrent use of tetracycline may render oral contraceptives less effective.
  - SPL set_id: `00acf413-c5d2-4a54-9d0d-56266cbc9edc`

---

## EXTRA (drug depletes nutrient) — 2 candidate(s)

- [ ] **drospirenone, ethinyl estradiol and levomefolate calcium and levomefolate calcium** × **Vitamin B12**
  - brands: drospirenone, ethinyl estradiol and levomefolate calcium and levomefolate calcium
  - snippet: > …such as coagulation factors, lipids, glucose tolerance, and binding proteins. DRSP causes an increase in plasma renin activity and plasma aldosterone induced by its mild anti-mineralocorticoid activity. Folates may mask vitamin B12 deficiency. [see Warnings And Precautions ( 5.12 ) and Drug Interactions ( 7.2 ).]
  - SPL set_id: `48f4301c-0426-43cd-af37-c4d8fc7aeb67`

- [ ] **drospirenone/ethinyl estradiol/levomefolate calcium and levomefolate calcium** × **Vitamin B12**
  - brands: Drospirenone/Ethinyl Estradiol/Levomefolate Calcium and Levomefolate Calcium
  - snippet: > …such as coagulation factors, lipids, glucose tolerance, and binding proteins. DRSP causes an increase in plasma renin activity and plasma aldosterone induced by its mild anti-mineralocorticoid activity. Folates may mask vitamin B12 deficiency. [See Warnings and Precautions ( 5.12 ) and Drug Interactions ( 7.2 ).]
  - SPL set_id: `58cd12d3-39b1-4375-b7e0-09ba2378a52b`

---

## Per-supplement summary

| Supplement | Candidates |
|---|---:|
| Vitamin K1 (Phylloquinone) | 1 |
| Omega-3 (EPA/DHA) | 2 |
| Curcumin (bioavailable form) | 1 |
| Vitamin E (mixed tocopherols) | 2 |
| Tryptophan | 2 |
| SAMe (S-Adenosyl-L-Methionine) | 2 |
| Niacin (Vitamin B3) | 2 |
| Milk thistle (Silymarin) | 1 |
| Calcium | 1 |
| Iron | 3 |
| Magnesium | 2 |
| Zinc | 2 |
| Iodine | 2 |
| CoQ10 (Ubiquinol) | 0 |
| Vitamin B12 | 3 |
| Folate (5-MTHF) | 2 |
| Vitamin D3 | 0 |
| Quercetin | 1 |
