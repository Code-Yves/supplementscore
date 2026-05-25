# Weekly Pairing Coverage Refresh — 2026-05-25

**Run mode:** auto-apply  
**Task:** weekly-pairing-coverage-refresh  
**Backup stamp:** `20260525T113825Z`  
**Supplements processed:** 20 / 20 (cap)

## Top-line counts

| Bucket | Count |
| --- | --- |
| Total proposals derived | 65 |
| Auto-applied (appended to pairings.json + pairings-data.js) | 38 |
| Queued — low-confidence (review file) | 22 |
| Tier-1 escalations (held for human review) | 2 |
| Skipped (duplicate or partner-not-in-data) | 3 |
| Auto-apply cap utilisation | 38 / 80 |

**Missing-pairings (`<4` entries) across S[]:**
- Before this run: **726** supplements
- After this run: **716** supplements
- Net reduction this week: **10**

## Escalations — REVIEW REQUIRED

Two Tier-1 antagonism / timing-with-Rx proposals were held for human review (not auto-applied):

- **Potassium citrate** ↔ **ACE inhibitors / ARBs (lisinopril, ramipril, losartan, valsartan)** (antagonism, confidence `high`) — ACE-I/ARBs reduce renal K excretion; supplemental potassium can precipitate hyperkalemia, especially in CKD or when co-administered with K-sparing diuretics. Routine K supplementation in patients on these agents requires monitoring (label warning).  
  → File: `reviews/pairing-tier1-flag-2026-05-25.json`
- **Casein protein** ↔ **Levothyroxine / Thyroid meds** (timing-separation, confidence `high`) — Dairy-derived calcium/protein in casein binds levothyroxine and lowers absorption (label warning recommends taking T4 separate from food/calcium/iron). Separate by ≥4 hours.  
  → File: `reviews/pairing-tier1-flag-2026-05-25.json`

## Per-supplement table

| Tier | Supplement | Before | After | Auto | Queued | Escalated | Skipped |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | Chamomile extract (Matricaria chamomilla) | 3 | 7 | 3 | 0 | 0 | 0 |
| T1 | Potassium citrate | 2 | 4 | 2 | 1 | 1 | 0 |
| T1 | Ginger (Zingiber officinale) | 3 | 4 | 1 | 1 | 0 | 1 |
| T1 | Casein protein | 3 | 3 | 0 | 2 | 1 | 1 |
| T1 | Collagen peptides | 3 | 4 | 1 | 2 | 0 | 0 |
| T2 | Iberogast (STW 5) | 1 | 2 | 1 | 1 | 0 | 1 |
| T2 | EGCG concentrate (decaffeinated green-tea catechin) | 3 | 4 | 1 | 2 | 0 | 0 |
| T2 | Sulforaphane (broccoli isothiocyanate) | 2 | 3 | 1 | 2 | 0 | 0 |
| T2 | Eggshell membrane (NEM) | 1 | 2 | 1 | 2 | 0 | 0 |
| T2 | Phytosterols (beta-sitosterol complex) | 2 | 4 | 2 | 1 | 0 | 0 |
| T2 | Fenugreek seed extract (Testofen / standardised) | 0 | 2 | 2 | 1 | 0 | 0 |
| T2 | Chia seed oil | 0 | 3 | 3 | 0 | 0 | 0 |
| T2 | Algal oil (vegan DHA/EPA) | 0 | 5 | 3 | 1 | 0 | 0 |
| T2 | Perilla oil | 0 | 3 | 3 | 0 | 0 | 0 |
| T2 | Sacha inchi oil (Plukenetia volubilis) | 0 | 3 | 3 | 0 | 0 | 0 |
| T2 | Zinc gluconate | 0 | 4 | 4 | 0 | 0 | 0 |
| T2 | Zinc bisglycinate | 0 | 4 | 4 | 0 | 0 | 0 |
| T2 | Bacillus clausii | 0 | 1 | 1 | 2 | 0 | 0 |
| T2 | Bacillus subtilis (spore probiotic) | 0 | 1 | 1 | 2 | 0 | 0 |
| T2 | DMG (Dimethylglycine) | 0 | 1 | 1 | 2 | 0 | 0 |

## Confidence histogram (all proposals)

| Confidence | Count |
| --- | ---: |
| high | 43 |
| medium | 21 |
| low | 1 |

## Direction histogram (all proposals)

| Direction | Count |
| --- | ---: |
| synergy | 30 |
| antagonism | 2 |
| redundancy | 26 |
| timing-separation | 7 |

## Skipped proposals (validation reasons)

| Target | Partner | Reason |
| --- | --- | --- |
| Ginger (Zingiber officinale) | Vitamin B6 (P5P) | duplicate |
| Casein protein | Whey protein | duplicate |
| Iberogast (STW 5) | Peppermint oil (enteric-coated) | duplicate |

## Spot-checked diff entries from `pairings-data.js`

Three randomly chosen auto-applied entries — verified to round-trip between `pairings.json` and `pairings-data.js`:

### `p234` — Chamomile extract (Matricaria chamomilla) ↔ Lemon balm (Melissa officinalis)

```json
{
  "id": "p234",
  "members": [
    "Chamomile extract (Matricaria chamomilla)",
    "Lemon balm (Melissa officinalis)"
  ],
  "kind": "mechanism-complementary",
  "strength": 3,
  "goal": "Mild anxiolysis and sleep onset",
  "rationale": "Both modulate GABA-A receptors; combined use in traditional formulas for sleep/anxiety relies on additive sedative/anxiolytic effects with low side-effect burden.",
  "direction": "synergy",
  "confidence": "high"
}
```

### `p245` — Phytosterols (beta-sitosterol complex) ↔ Red yeast rice

```json
{
  "id": "p245",
  "members": [
    "Phytosterols (beta-sitosterol complex)",
    "Red yeast rice"
  ],
  "kind": "mechanism-complementary",
  "strength": 4,
  "goal": "LDL reduction — dual-mechanism stack",
  "rationale": "Phytosterols block intestinal cholesterol absorption; monacolin K (red yeast rice) inhibits hepatic HMG-CoA reductase. Mechanisms are complementary in LDL lowering — classic dual-pathway stack.",
  "direction": "synergy",
  "confidence": "high"
}
```

### `p260` — Sacha inchi oil (Plukenetia volubilis) ↔ Vitamin E (mixed tocopherols)

```json
{
  "id": "p260",
  "members": [
    "Sacha inchi oil (Plukenetia volubilis)",
    "Vitamin E (mixed tocopherols)"
  ],
  "kind": "mechanism-complementary",
  "strength": 2,
  "goal": "Oxidation protection",
  "rationale": "Tocopherols protect ALA from oxidation; small additions stabilize potency.",
  "direction": "synergy",
  "confidence": "high"
}
```

## Verification

- `node --check supplementscore-repo/pairings-data.js` → **PASS**
- `python -c "import json; json.load(open('supplementscore-repo/data/pairings.json'))"` → **PASS** (271 pairings)
- Cross-check `pairings-data.js` ⟷ `pairings.json` array equality → **PASS**
- Backup files exist:
  - `supplementscore-repo/pairings-data.js.bak-20260525T113825Z`
  - `supplementscore-repo/data/pairings.json.bak-20260525T113825Z`

## Output files

- `reviews/pairing-coverage-2026-05-25.md` (this report)
- `reviews/pairing-low-confidence-2026-05-25.json` (22 proposals queued)
- `reviews/pairing-tier1-flag-2026-05-25.json` (2 Tier-1 escalations)

## Acceptance criteria

- [x] Report exists
- [x] Up to 20 supplements processed (20)
- [x] `pairings-data.js` and `pairings.json` validate after the run
- [x] Backup files exist for every edit
- [x] Every auto-applied entry has a citable PMID OR is `confidence: high`

## Notes

- No `last_reviewed`-per-supplement field exists in `data.js`; the sort substituted file-position-descending (most-recently-added proxy) after Tier 1, as the spec's secondary criterion.
- Conservative PMID policy this run: per the "No invented PMIDs" rule, antagonism/safety proposals lacking a verified PMID were demoted to `low` confidence and queued for human review rather than auto-applied with a guessed citation. This is why the auto-apply set is dominated by `high`-confidence synergy/redundancy/timing entries (none of which require a PMID per spec).
- Per the schema convention used in pairings ≥ p201, new entries include `direction`, `confidence`, and (when present) `evidence_pmids` fields alongside the original `kind`/`strength`/`goal`/`rationale` shape.
- 3 proposals were dropped as duplicates of existing pairings: Ginger+B6, Casein+Whey, Iberogast+Peppermint.
