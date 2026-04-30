# SS Interactions — Negative Supplement-Supplement Interaction Audit

**Run:** 2026-04-25 (scheduled `ss-interactions` task)
**Scope:** All 729 supplements in `data.js`. Reviewed for negative supplement–supplement
interactions, expanded the canonical interaction map, and verified that warnings flow into
both the per-supplement cards and the My Profile recommendation summary.

---

## What was already in place

The codebase already contained a structured `SUPP_INTERACTIONS` block in `app.js` (line ~1285)
with three sections:

- `pairs` — positive synergies (D3 + K2, Iron + Vit C, etc.).
- `cautions` — explicit named negative pair interactions with severity (`caution` / `avoid`).
- `groups` — mechanism clusters (every member cross-pairs with every other member). Original
  groups: `bleed`, `serotonin`, `sedation`, `stimulant`, `hepatotoxic`, `hypoglycemic`,
  `hypotensive`, `seizure_lowering`, `nephrotoxic_minerals`, `heavy_metal_risk`.

The lookup helpers (`getSuppCautionsIn`, `computeStackConflicts`, `getAllSuppCautions`) were
already wired into:

- **Per-card display** (`cardHtml` in `renderSuppCards`) — a card shows a red/amber
  `Stack caution`/`Do-not-stack` chip plus a grouped row of conflicts naming each partner
  also in the user's stack (essential + recommended + consider + user-added).
- **My Profile summary alert** (`renderSuppStackAlerts`) — a top-of-plan banner enumerates
  every conflict pair and totals the avoid vs. caution counts.
- **Catalog cards** (`renderCard` in the broader supplement library) — `suppInteractPills`
  shows a count chip; `suppInteractSectionHtml` renders the full mechanism breakdown when
  the card is expanded.

Pre-audit coverage: ~245 of 729 supplements (33 %) referenced in the interaction map.

---

## What changed in this run

### 1. Expanded existing mechanism groups

| Group | Members before | Members after | Notes |
|---|---:|---:|---|
| `bleed` | ~50 | ~95 | Added remaining omega-3 sources (flax, hemp, chia, perilla, sacha inchi, algal, mussel), GLA sources (borage, EPO, GLA), polyphenols with antiplatelet activity (cocoa flavanols, theaflavins, hesperidin, rutin, diosmin), other commonly-stacked items (ginsengs, reishi, cordyceps, holy basil, bilberry, saw palmetto, vinpocetine, nettle, mastic, bee propolis, bee pollen, royal jelly, sea buckthorn, pomegranate). |
| `serotonin` | 10 | 13 | Pulled `St. John's Wort`, `Methylene blue`, `Sibutramine` from `dangerous_pairings` into the auto-pairing group so they cross-flag with 5-HTP, tryptophan, SAMe, saffron etc. |
| `sedation` | ~30 | ~50 | Added bacopa, holy basil, reishi, sage, hops, jujube, polygala, damiana, ashitaba, sabroxy, butterbur, black cohosh, phosphatidylserine, magnesium glycinate / L-threonate / taurate / bisglycinate, lemon verbena. |
| `stimulant` | ~16 | ~30 | Added phenylpiracetam, semax, selank, sibutramine, clenbuterol, DNP, ginsengs (panax / Korean / American / fermented), eleuthero, cordyceps, schisandra, rhodiola. |
| `hepatotoxic` | ~22 | ~45 | Added pennyroyal, sassafras, calamus, garcinia (HCA), hydrazine, mistletoe, ashwagandha, turmeric/curcumin (high dose), turkesterone, SARMs (general/Andarine/Ostarine), methyl-1-test, androstenedione, DHEA, black cohosh, aloe, senna, cascara, tung oil, camphor, oil of wintergreen. |
| `hypoglycemic` | ~25 | ~45 | Added apple cider vinegar, holy basil, goldenseal, maitake, aloe, goji, 5-ALA, bergamot, nopal, ecklonia, damiana, chromium GTF, vanadium, olive leaf, oat beta-glucan, glucomannan, white kidney bean. |
| `hypotensive` | ~20 | ~35 | Added MitoQ, pomegranate, reishi, holy basil, cocoa flavanols, theaflavins, hibiscus, magnesium forms, quercetin, resveratrol, pterostilbene, bergamot. |
| `seizure_lowering` | 6 | 14 | Added wormwood, sage, rosemary, camphor, phenibut, kratom, phenylpiracetam. |
| `nephrotoxic_minerals` | 7 | 19 | Added all calcium forms (hydroxyapatite, coral, D-glucarate, fructoborate, Ca-AKG, pantothenate), strontium, vanadium, boron forms, horsetail, phosphoric acid, cranberry PAC. |
| `heavy_metal_risk` | 10 | 22 | Added kelp, bladderwrack, phycocyanin, silver protein, bone broth protein, bentonite, diatomaceous earth, zeolite, cesium chloride forms, calomel, MMS / sodium chlorite, aristolochic acid. |

### 2. New mechanism groups

| New group | Severity | Why it matters | Members (count) |
|---|---|---|---|
| `thyroid_modulator` | caution | Compounds thyroid hormone effect — risk of hyper/hypothyroid swings; common conflict pattern with iodine + adaptogens + glandulars. | 14 |
| `potassium_loss` | caution | Stimulant laxatives, diuretic herbs, licorice, ACV, hibiscus, goldenseal — additive K+ loss can drive arrhythmia. | 13 |
| `vitamin_a_overlap` | caution | Cod liver oil, beef organ powder, retinol, beta-carotene, sea buckthorn, mixed carotenoids, multivitamins — easy to exceed the 10,000 IU/day upper limit. | 13 |
| `estrogen_modulator` | caution | Phytoestrogens (soy, red clover, kudzu, hops, pueraria), DIM/I3C, calcium D-glucarate, vitex, black cohosh, dong quai, maca, wild yam, white peony, shatavari. | 21 |
| `immune_stimulant` | caution | Echinacea, astragalus, andrographis, mushroom polysaccharides, beta-glucans, mistletoe, larch arabinogalactan, pelargonium, lactoferrin, colostrum — flag for autoimmune patients and counteracts immunosuppressants. | 27 |
| `androgenic` | caution | DHEA + 7-Keto + pregnenolone + androstenedione + methyl-test + tongkat + fadogia + tribulus + turkesterone + horny goat weed + cistanche + maca + SARMs + ashwagandha + D-aspartic. | 24 |

### 3. ~150 new explicit `cautions` rows

The cautions array gained a large 2026-04-25 expansion block covering:

- **Duplicate / overlapping forms** that shouldn't be stacked:
  B12 forms (cyano-, methyl-, hydroxo-, adenosyl-), folate forms (5-MTHF, folinic, folic),
  B6 (P5P), thiamine forms (B1, benfotiamine, TTFD), riboflavin, B5 (pantothenic acid /
  calcium pantothenate / pantethine), niacin (nicotinic acid + nicotinamide + inositol
  hexanicotinate), biotin, B-complex / activated B-complex / multivitamin overlap, all
  zinc salts (gluconate / picolinate / bisglycinate / carnosine), all calcium forms
  (hydroxyapatite, coral, D-glucarate, fructoborate, Ca-AKG, pantothenate, AEP), all
  choline sources (alpha-GPC, CDP-choline, GPC, phosphatidylcholine, choline bitartrate),
  vitamin D2/D3/drops, vitamin K1 vs K2, glucosamine + chondroitin standalone vs combo,
  L-carnitine forms, inositol forms, beta-alanine / carnosine, boswellia serrata vs
  AKBA, taurine forms, citrulline forms + arginine, glutamine forms, betaine / TMG forms,
  HMB forms, tributyrin forms, kava, ashwagandha forms, lion's mane forms, olive
  polyphenol forms, sambucol vs elderberry, mushroom blends auto-flagging single-species
  add-ons.

- **Combo product self-conflicts**: any "X + Y stack" entry now flags both ingredient
  entries to avoid double-dosing (Adaptogen stack, Fenugreek + Ashwagandha, Andrographis
  + Echinacea, Elderberry + Zinc, HMB + Creatine, Collagen + Vit C, K2 + D3, NR +
  Pterostilbene, CoQ10 + PQQ, Berberine + Cinnamon, Quercetin Phytosome + Bromelain,
  Pterostilbene + Resveratrol).

- **Iodine / thyroid extras**: iodine ⨯ TRIAC ⨯ raw thyroid ⨯ sea moss / kelp /
  bladderwrack now all "avoid" (additive thyroid load).

- **Estrogen pathway extras**: Vitex variants ⨯ soy / black cohosh / maca; wild yam ⨯
  DHEA; black cohosh duplicate forms.

- **Methyl-donor overload**: TMG + Methyl B12 + Methylfolate combo flagged as caution.

- **Choline mass-action**: Huperzine A ⨯ Alpha-GPC / CDP / phosphatidylcholine
  (additive cholinergic activation).

- **Vinpocetine**: explicitly flagged with warfarin (antiplatelet activity).

- **Activated charcoal / clays / zeolite**: bind nutrients — flagged with iron, calcium,
  multivitamins, probiotics, folate, B12.

- **Hidden adulterants**: sibutramine ↔ SSRIs, phenolphthalein ↔ senna / cascara /
  aloe; pennyroyal ↔ acetaminophen.

- **Tongkat / Fadogia / Turkesterone "T-stack"**: cross-flagged.

- **Glutathione precursors**: NAC + GlyNAC + Glycine + Glutathione precursors blend —
  prevent triple-dosing.

- **5-HTP / L-tryptophan / SAMe / saffron / St John's Wort / methylene blue**: full
  cross-pairing in addition to mechanism group.

- **Apple cider vinegar / dihydromyricetin / lithium orotate / coleus / fucoxanthin /
  L-histidine** — niche but well-documented interaction warnings.

### 4. My Profile summary now includes user-added supplements

`renderSuppStackAlerts(recs)` previously only scanned `essential + recommended` items. It
now also includes anything in `userAddedSupps` (the persisted list a user has manually
added), de-duplicated via `Set`. This matches the per-card behaviour and prevents the
common case where a user adds (e.g.) extra magnesium glycinate that conflicts with their
already-recommended magnesium L-threonate but no banner appears.

---

## Coverage delta

| | Before | After |
|---|---:|---:|
| Distinct supplements explicitly named in `SUPP_INTERACTIONS` | ~245 | ~495 |
| Coverage of the 729-supplement library | ~33 % | ~68 % |
| Mechanism groups | 10 | 16 |
| Explicit `cautions` rows | ~60 | ~210 |
| Pairwise negative interactions surfaced (groups expand to N×(N-1)/2 each) | ~3,000 | ~10,000+ |

Coverage measurement is approximate (regex-based) — the real lookup count is higher because
duplicate-form entries cascade through the cautions list.

---

## Where users see this

1. **Per-card "Stack caution" / "Do-not-stack" chip** — on every card in the My Profile
   recommendations list, a coloured chip appears in the tag row when the supplement
   conflicts with another item in the user's plan. Clicking expands an itemised conflict
   block listing each partner and the mechanism (e.g. "additive bleeding /
   anticoagulant effect — with Ginkgo biloba, Vitamin E").

2. **My Profile summary banner** (`#supp-alert-box`) — a top-of-plan red/amber alert that
   summarises every conflict in the active stack with severity counts ("⚠ 2 do-not-stack
   conflicts and 5 cautions in your stack"). Now also reflects user-added items.

3. **Library catalog cards** (`renderCard`) — the standalone supplement-library cards
   already showed a `suppInteractPills` count chip in the always-visible badge row; the
   expanded view shows a full mechanism breakdown via `suppInteractSectionHtml`. With
   the expansion, many more catalog entries now have an interaction chip.

4. **Footer attribution** — the My Profile alert footer dynamically reads from
   `_suppCautionMap.size`, so the "cross-checked against our N-supplement interaction
   library" wording will reflect the new larger library size automatically.

---

## Verification

- `app.js` parses cleanly after every edit (`new Function(code)` round-trip OK).
- The expanded `SUPP_INTERACTIONS` map evaluates and the `getSuppCautionsIn(name, others)`
  lookup returns the expected groups for spot checks:
  - `Ashwagandha (KSM-66)` ↔ `Iodine` / `TRIAC` (thyroid_modulator).
  - `Aloe vera (oral)` ↔ `Senna` / `Cascara` / `Licorice` (potassium_loss + duplicate
    laxative class).
  - `Omega-3 (EPA/DHA)` ↔ `Krill oil` / `Cod liver oil` / `Ginkgo` (overlap + bleed).
  - `Soy isoflavones` ↔ `Red clover` / `Vitex` / `Black cohosh` (estrogen_modulator +
    explicit pair).
  - `Echinacea` ↔ `Astragalus` / `Reishi` / `Andrographis` (immune_stimulant — new
    group).
  - `Berberine` ↔ `Goldenseal` (avoid: goldenseal contains berberine).
  - `5-HTP` ↔ `Tryptophan` / `Saffron` / `St John's Wort` (serotonin group + explicit
    pairs).

---

## Files changed

- `app.js` — `SUPP_INTERACTIONS.cautions` extended (new 2026-04-25 block); `bleed`,
  `serotonin`, `sedation`, `stimulant`, `hepatotoxic`, `hypoglycemic`, `hypotensive`,
  `seizure_lowering`, `nephrotoxic_minerals`, `heavy_metal_risk` group memberships
  expanded; six new groups added (`thyroid_modulator`, `potassium_loss`,
  `vitamin_a_overlap`, `estrogen_modulator`, `immune_stimulant`, `androgenic`);
  `renderSuppStackAlerts(recs)` widened to include `userAddedSupps`.
- No changes to `data.js`, `index.html`, `styles.css`, or PDF/email templates — the
  existing rendering pipeline already consumes the expanded interaction data.

---

## Open items / suggestions for follow-up

- **Citation depth**: the new mechanism groups and cautions are written from established
  pharmacology and the existing supplement-pairings.md / .json knowledge base; a future
  pass could attach a per-row citation (PubMed ID or NCCIH page) so each warning links to
  evidence, mirroring how the supplement-card footers already cite individual studies.
- **Coverage of remaining 32 %**: roughly 230 supplements still have no negative-interaction
  flag — the remainder are mostly very-low-evidence Tier-3/Tier-4 obscurities (single
  herbs, niche peptides, pregnancy-toning herbs, esoteric food extracts) where the
  primary risk is "no human data" rather than a known supplement-supplement interaction.
  A second pass focused on Tier-3 trending supplements (e.g. spermidine, urolithin A,
  C60 fullerene, oleoylethanolamide, BPC-157, palmitoylethanolamide, MOTS-c, idebenone,
  ergothioneine, fisetin) would round out coverage.
- **PDF export**: the same `getSuppCautionsIn` helper is referenced from the PDF/email
  renderer (line ~1932 in `app.js`); the expanded map will automatically flow through —
  no template work required, but worth visually QAing one printed plan to confirm.
