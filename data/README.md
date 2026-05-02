# SupplementScore Open Data

Released under [Creative Commons Attribution 4.0 (CC-BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

## Files

| File | Description | Records |
|---|---|---:|
| `supplements.json` | Full supplement DB with composite + sub-scores, dose, timing, cycling | 734 |
| `supplements.csv`  | Same data flattened for spreadsheets | 734 |
| `medications.json` | Medication categories with avoid / caution / depleted-replace lists | 70 categories, 1473 interaction lines |
| `pairings.json`    | Supplement-supplement pairings with rationale + dose | 87 pairings |

## Schema

Each supplement record:

```json
{
  "name": "Creatine monohydrate",
  "tier": "t1",
  "trending": true,
  "tag": "Performance · Cognition",
  "scores": {
    "composite": 96,
    "efficacy": 5,
    "safety": 5,
    "research": 5,
    "onset": 3,
    "cost": 5,
    "drug_interaction_inverse": 5
  },
  "description": "...",
  "dose": "3-5 g/day continuously...",
  "tips": "Take with water at any time...",
  "cycle": "Safe for continuous daily use..."
}
```

`drug_interaction_inverse`: 5 = no known interactions, 1 = severe interactions documented.

`tier`:
  - `t1` Strong evidence (cited public/nonprofit-funded RCTs/meta-analyses)
  - `t2` Promising / situational
  - `t3` Trending (popular but evidence is limited)
  - `t4` Risky / avoid

## Citation

If you use this data in research, please cite:

> SupplementScore Open Data, version 2026-05-01. https://supplementscore.org/data/

## Update cadence

Regenerated whenever `data.js` changes upstream. Verify the publish date in any
file's metadata before relying on a snapshot.

## Contact

For questions, errors, or contribution opportunities: see the contact in the
[main site footer](https://supplementscore.org/).
