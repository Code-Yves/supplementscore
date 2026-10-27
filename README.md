# SupplementScore

**[supplementscore.org](https://supplementscore.org/)** — Independent · No industry funding. Evidence-based supplement reference. No sponsorships, no affiliate links, no paid placements.

Every supplement is scored from peer-reviewed clinical trials and meta-analyses. Sources are weighted by funding independence and methodological strength. When the evidence changes, the score changes — and we keep a [public log](https://supplementscore.org/changed-our-mind.html) of every reversal.

---

## What's in this repo

This is the static site that powers `supplementscore.org`. It deploys directly to GitHub Pages from `main`.

| Surface | Count | Path |
|---|---|---|
| Supplements scored | 780 | `data.js` (canonical); `/s/<slug>` aliases redirect to `supplement.html?slug=` |
| Articles | ~590 | `a/*.html` |
| Condition deep-dives | 61 | `condition/*.html` (plus two legacy redirect stubs) |
| Comparison guides | 128 | `compare/*.html` |
| Symptom-domain hubs | 16 | `sx/*.html` |
| OG social cards | auto-generated | `og/` |
| Languages | English only | Former `/fr/` and `/es/` URLs redirect to the matching English page |

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

Tier 1 placement requires at least one **independently funded** randomised controlled trial confirming the effect — industry-only evidence cannot drive a Tier 1 call. See [About — Methodology](https://supplementscore.org/about.html#methodology), [editorial-pipeline.html](https://supplementscore.org/editorial-pipeline.html), and [funder-policy.html](https://supplementscore.org/funder-policy.html) for the full framework.

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
├── about.html              # About, methodology, and transparency
├── compare.html            # Two-supplement side-by-side tool
├── symptom.html            # Symptom-to-supplement picker
├── build.html              # Personalized stack wizard
├── changed-our-mind.html   # Public log of score reversals
│
├── a/                      # Article detail pages (~590)
├── s/                      # Short-slug aliases → supplement.html?slug=
├── condition/              # Condition deep-dive protocols (61)
├── compare/                # Comparison guides
├── sx/                     # Symptom-domain hubs (16)
├── fr/, es/                # English-only redirect stubs for retired locales
├── og/                     # OG social cards
├── data/                   # Open-data exports (JSON + CSV)
│
├── data.js                 # Master supplement dataset (780 entries)
├── app.js                  # Main app logic (filtering, rendering, search)
├── styles.css              # Direction C brand system
├── sw.js                   # Service worker (offline support)
├── tests/                  # Playwright regression suite and link crawl
└── .github/workflows/ci.yml
```

---

## How to contribute

The site lives off curated evidence — anyone can flag inaccuracies or suggest additions.

**For data corrections** (wrong dose, missing interaction, stale citation): open an issue using the [`data-correction`](.github/ISSUE_TEMPLATE/data-correction.md) template.

**For missing supplements**: use the [`missing-supplement`](.github/ISSUE_TEMPLATE/missing-supplement.md) template with at least one peer-reviewed citation.

**For broken citations**: use the [`broken-citation`](.github/ISSUE_TEMPLATE/broken-citation.md) template.

See [CONTRIBUTING.md](https://github.com/Code-Yves/supplementscore/blob/main/.github/CONTRIBUTING.md) (when present) for the full process. All contributions are reviewed against the [editorial pipeline](https://supplementscore.org/editorial-pipeline.html).

---

## Local preview

GitHub Pages publishes the `main` branch only, so a pull request has no public preview URL. To click through a branch the way it will ship:

```bash
npm install
npm run preview
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Preview needs Python 3. It does not need Playwright.

## Regression suite

`.github/workflows/ci.yml` runs the suite on every pull request and on every push to `main`. The check name is **Regression / regression**. A failing run fails the pull request. A repository admin should mark that check as required under branch protection for `main` if it is not required already, so GitHub blocks the merge.

Install once, then run everything:

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

The suite uses two viewports: desktop 1280×900 and iPhone 390×844. It clicks every option in every homepage category menu and checks a single selected button, the loader text, the results, Show more, scroll position, an in-flow menu that does not cover the list, and Escape / outside click. It also covers search, the magazine hero arrows, keyboard, and swipe, article Prev/Next, Share, the table of contents, and the footer newsletter form. Pages must load with no console errors. axe-core flags serious and critical issues, and the controls the suite clicks must be at least 44px.

A filesystem crawl of every internal link fails on a 404 and on double-encoded entities such as `&amp;#39;` or text that still shows `&#39;` after the browser decodes markup. A normal source entity that the browser renders as an apostrophe is left alone.

Visual snapshots of the homepage, one article, one supplement page, one topic page, and About are committed for both widths. They are the approved baseline. After this branch is on `main`, later pull requests are diffed against those files. When a visual change is intentional, refresh the baselines and commit the new PNGs:

```bash
npm run test:update-snapshots
```

Linux font rendering is pinned with `tests/fonts/local.conf` (Noto Sans) so local runs and GitHub Actions compare the same outlines. Install `fonts-noto-core` if `fc-match sans-serif` is not Noto Sans.

---

## License

[MIT](LICENSE) for code and site infrastructure. Supplement data and editorial content are released as a public reference under the same license — reuse is welcome, attribution appreciated.

---

## Disclaimer

This site is an educational reference, not medical advice. Supplements can interact with prescription medications and underlying conditions. Always consult a qualified clinician before starting, stopping, or changing any supplement regimen.
