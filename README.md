# SupplementScore

**[supplementscore.org](https://supplementscore.org/)** — a non-profit, evidence-based supplement reference. No sponsorships, no affiliate links, no paid placements.

Every supplement is scored from peer-reviewed clinical trials and meta-analyses. Sources are weighted by funding independence and methodological strength. When the evidence changes, the score changes — and we keep a [public log](https://supplementscore.org/changed-our-mind.html) of every reversal.

---

## What's in this repo

This is the static site that powers `supplementscore.org`. It deploys directly to GitHub Pages from `main`.

| Surface | Count | Path |
|---|---|---|
| Supplements scored | 758 | `data.js` (canonical), `s/*.html` (per-supplement detail pages) |
| Articles | 241 | `a/*.html` |
| Condition deep-dives | 20 | `condition/*.html` |
| Comparison guides | 5 | `compare/*.html` |
| Symptom-domain hubs | 16 | `sx/*.html` |
| Population-targeted lists | 7 | `for/*.html` (athletes, kids, women, men, pregnancy, seniors, vegans) |
| OG social cards | 534 | `og/*.svg` (auto-generated, one per supplement) |
| Languages | EN + FR (partial) | `fr/` for French content |

Total: ~850 indexable HTML pages, all with their own canonical URL, meta description, and JSON-LD where appropriate.

---

## Methodology

Each supplement is scored on six independent dimensions, each on a 1–5 scale:

| Dimension | Weight | What it measures |
|---|---|---|
| **Efficacy** | ×7 | Strength + replication of clinical evidence |
| **Safety** | ×4 | Adverse-event profile in healthy adults at recommended dose |
| **Research depth** | ×3 | Number and size of independent trials |
| **Onset** | ×2 | Time-to-effect (acute vs cumulative) |
| **Cost** | ×2 | Per-month cost at clinical dose |
| **Drug-interaction risk** | ×2 | Major-medication interactions (5 = lowest risk) |

Composite score: `e×7 + s×4 + r×3 + o×2 + c×2 + d×2`. Maximum 100.

**Tier mapping:**
- **Tier 1** (≥72): Strong evidence, recommended.
- **Tier 2** (60–71): Promising or situational.
- **Tier 3** (40–59): Trending or thin evidence — use with caution.
- **Tier 4** (<40): Documented harm or banned in major jurisdictions — avoid.

Tier 1 placement requires at least one **independently funded** randomised controlled trial confirming the effect — industry-only evidence cannot drive a Tier 1 call. See [methodology.html](https://supplementscore.org/methodology.html), [editorial-pipeline.html](https://supplementscore.org/editorial-pipeline.html), and [funder-policy.html](https://supplementscore.org/funder-policy.html) for the full framework.

---

## Sources

Scores draw exclusively from peer-reviewed primary literature and credible institutional positions:

- **Primary literature**: PubMed, Cochrane Library, ClinicalTrials.gov, bioRxiv, ChEMBL
- **Institutional positions**: NIH ODS, FDA, EFSA, WHO, EMA, Health Canada, MedlinePlus
- **Tertiary**: Lancet, NEJM, JAMA, BMJ for editorial context only

A complete source registry lives in `sources/registry.json` (in the parent project folder, not the deployed site).

---

## Independence

- No sponsorships
- No affiliate links
- No paid placements
- No supplement company funding (ever)
- All page content is editorially independent

Industry-funded trials are not excluded from scoring, but they cannot solo-promote a supplement to Tier 1, and conflicts of interest are disclosed inline where they exist. See [funder-policy.html](https://supplementscore.org/funder-policy.html).

---

## Site structure

```
.
├── index.html              # Homepage / supplement explorer
├── discover.html           # Discovery hub (articles + topics + tools)
├── methodology.html        # Scoring framework
├── about.html              # Project mission + editorial principles
├── compare.html            # Two-supplement side-by-side tool
├── symptom.html            # Symptom-to-supplement picker
├── build.html              # Personalized stack wizard
├── changed-our-mind.html   # Public log of score reversals
│
├── a/                      # Article detail pages (241)
├── s/                      # Supplement detail pages (533)
├── condition/              # Condition deep-dive protocols (20)
├── compare/                # Comparison guides (5)
├── sx/                     # Symptom-domain hubs (16)
├── for/                    # Population-targeted lists (7)
├── fr/                     # French content (in progress)
├── og/                     # OG social cards (1 per supplement)
├── data/                   # Open-data exports (JSON + CSV)
│
├── data.js                 # Master supplement dataset (758 entries)
├── app.js                  # Main app logic (filtering, rendering, search)
├── styles.css              # Direction C brand system
└── sw.js                   # Service worker (offline support)
```

---

## How to contribute

The site lives off curated evidence — anyone can flag inaccuracies, suggest additions, or contribute translations.

**For data corrections** (wrong dose, missing interaction, stale citation): open an issue using the [`data-correction`](.github/ISSUE_TEMPLATE/data-correction.md) template.

**For missing supplements**: use the [`missing-supplement`](.github/ISSUE_TEMPLATE/missing-supplement.md) template with at least one peer-reviewed citation.

**For broken citations**: use the [`broken-citation`](.github/ISSUE_TEMPLATE/broken-citation.md) template.

**For translation help** (French and beyond): see the FR landing page contact link, or open an issue.

See [CONTRIBUTING.md](https://github.com/Code-Yves/supplementscore/blob/main/.github/CONTRIBUTING.md) (when present) for the full process. All contributions are reviewed against the [editorial pipeline](https://supplementscore.org/editorial-pipeline.html).

---

## License

[MIT](LICENSE) for code and site infrastructure. Supplement data and editorial content are released as a public reference under the same license — reuse is welcome, attribution appreciated.

---

## Disclaimer

This site is an educational reference, not medical advice. Supplements can interact with prescription medications and underlying conditions. Always consult a qualified clinician before starting, stopping, or changing any supplement regimen.
