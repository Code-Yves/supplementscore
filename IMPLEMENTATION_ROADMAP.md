# Accuracy Improvement Roadmap — Supplement Score

**Created:** 2026-04-28
**Owner:** Yves (solo + Claude)
**Budget:** Free / open-source resources only
**Format:** Phased delivery, ~14 weeks of part-time work

---

## Parameters that shape this plan

- **No paid databases.** Natural Medicines, Lexicomp, UpToDate, Embase full-text are out. The plan substitutes a stack of free authoritative sources (NIH ODS, EFSA, EMA, openFDA, Cochrane abstracts, Health Canada NHP, WHO, DrugBank academic).
- **No paid human reviewer.** Item #8 (credentialed reviewer of record) is deferred to a "Phase 5 — when budget arrives" stub. The plan substitutes a volunteer advisory ask and self-imposed peer-review checkpoints.
- **Solo + Claude.** Effort estimates assume a single person doing ~5–10 hrs/week, with Claude handling code generation, schema migration, and bulk content updates inside the existing automated review pipeline.
- **Existing infrastructure leveraged, not rebuilt.** The 22-day cycle, `SUPP_INTERACTIONS` block, `data.js`, and review-doc convention are all kept. Changes are additive.

---

## Sequencing logic

The 10 items have real dependencies. Schema changes (#3) need to land before bulk content backfills depending on the new field. Source diversification (#1) is the prerequisite for differentiated cadence (#5) and the drug-interaction work (#2). Methodology page (#7) is a content task that benefits from #3 being done first because it documents the funding-source policy. Form-specific work (#6) is best done after #1 because new sources will surface form-specific evidence.

```
Phase 0 (Foundation)        →  #4 categories, #9 last-reviewed UI, #3 schema, #10 feedback
Phase 1 (Sources + docs)    →  #1 source diversification, #7 methodology, #5 cadence
Phase 2 (Drug interactions) →  #2 drug-supp block
Phase 3 (Depth + polish)    →  #6 form-specific, #3 backfill funding data, QA pass
Phase 4 (Deferred)          →  #8 human reviewer (when budget allows)
```

---

## Phase 0 — Foundation (Weeks 1–2, ~12 hours)

Quick wins and schema prep. None of these block on external data.

### #4 Backfill missing categories on 75 articles

The most recent article-review log flags 75 articles with no `c` field in `data.js`. These are likely IDs above the original 166 block. Without categories, the cadence/filtering and category-specific behavior on the site won't work properly.

**Steps**
1. Generate the list of article IDs missing `c` in `data.js` (Claude can do this in one pass).
2. For each, infer category from the title and `index.html` content (`breakthrough` / `guide` / `myth` / `kids` / `safety`).
3. Patch `data.js` with the inferred values, write a `reviews/category-backfill-2026-MM-DD.md` audit log naming each ID and chosen category.
4. Spot-check 10 random reassignments by hand.

**Done when** every article in `data.js` has a `c` value and the category counts in the daily article-review log no longer show "(no `c` set)".

**Effort:** 2–3 hrs.

### #9 Visible "last reviewed" badge on each article and supplement card

The `<!-- last-reviewed: YYYY-MM-DD -->` HTML comment is already there for articles. Surface it.

**Steps**
1. Add a small footer line on article pages: "Last reviewed: 2026-04-26" with the date pulled from the existing comment at render time.
2. Add a `lastReviewed` field to the `data.js` supplement entries (default to today for everything modified in the most recent run; future entries should write the date when the entry is changed).
3. Add a subtle badge on each supplement card showing the date.
4. Add a tooltip explaining "Reviewed every 22 days against PubMed and the listed sources."

**Done when** every article and every supplement card shows a date and tooltip in the live UI.

**Effort:** 3–4 hrs (mostly UI work in `app.js` / `styles.css` / `index.html`).

### #3 Schema additions for funding source / COI tracking

This lands the data model now so subsequent reviews can populate it incrementally. No backfill yet — that lives in Phase 3.

**Steps**
1. Extend the citation object schema in review docs (and any structured citation list in `data.js` if one exists) to include:
   - `funder` — string (e.g., "NIH R01", "Pfizer", "Examine.com", "no disclosure")
   - `funder_type` — enum: `public` | `industry` | `mixed` | `nonprofit` | `none_disclosed`
   - `coi_flag` — boolean (true if any author declared a competing interest related to the supplement)
2. Update the SKILL.md / review prompts so future automated reviews capture these fields from the paper's "Funding" and "Competing Interests" sections.
3. Add a CSS class for citations rendered with `funder_type: "industry"` so the UI can flag them when surfaced.

**Done when** the schema is documented, the review prompts capture it, and at least one new review (e.g., next NMN cycle) populates the fields end-to-end.

**Effort:** 2 hrs.

### #10 Reader feedback button (citation-required)

Goal: a structured signal channel for inaccuracies that a solo operator can actually triage.

**Steps**
1. Add a small "Flag inaccuracy" link in the article footer and on each supplement card.
2. Use a free Formspree or Netlify Forms endpoint (no backend needed, free tiers cover ~50 submissions/month, sufficient for this site's traffic).
3. Required fields: `claim` (free text), `suggested_correction` (free text), `citation_url` (URL, required, must look like a URL).
4. Submissions email Yves; create a `feedback/` directory in the workspace where flagged items are dropped as markdown for triage.

**Done when** the button is live, a test submission emails through, and the triage process is documented in `SKILL.md`.

**Effort:** 3 hrs.

---

## Phase 1 — Source diversification + methodology (Weeks 3–6, ~30 hours)

This phase moves the citation database from "PubMed only" to a multi-source corpus and publishes a methodology page that documents how scoring works.

### #1 Diversify beyond PubMed (free sources only)

Eight free sources, ranked roughly by accuracy uplift per hour of integration effort.

| Tier | Source | What it adds | Access | Integration |
|---|---|---|---|---|
| 1 | **NIH Office of Dietary Supplements (ODS)** | Authoritative consumer + professional fact sheets on ~80 supplements; updated regularly; curated citations | Free, stable URLs (`ods.od.nih.gov/factsheets/{name}-HealthProfessional/`) | HTML scrape; map ~80 entries to your `data.js` names |
| 1 | **EFSA Scientific Opinions** | EU-level dossiers with hard upper-limit values; covers ~150 supplement-relevant substances | Free PDFs on `efsa.europa.eu` | Manual ingestion of the most relevant ~50 dossiers; structured extract of UL values |
| 1 | **EMA Herbal Medicinal Products Committee monographs** | ~150 herbal supplement monographs with EU regulatory positions | Free, stable URLs on `ema.europa.eu` | HTML/PDF scrape per herbal entry |
| 1 | **Cochrane Library — abstracts and Plain Language Summaries** | Risk-of-bias-graded systematic reviews. Full text is paid; abstracts + PLS are free and usually sufficient for tier calls | Free abstracts on `cochranelibrary.com` | Search API (free CRSO endpoint) |
| 2 | **openFDA Drug Adverse Events (FAERS)** | Real-world safety signals; useful for tier-4 risk content | Free REST API | Already structured; query by supplement name |
| 2 | **Health Canada Natural and Non-prescription Health Products Directorate (NNHPD) monographs** | ~600 structured monographs with approved doses, claims, contraindications | Free, downloadable monograph database | Bulk download once, parse, cross-reference |
| 2 | **WHO monographs on selected medicinal plants** | 4 published volumes covering ~120 plants with extensive evidence reviews | Free PDFs | Manual ingestion |
| 3 | **NIH MedlinePlus / NCCIH** | Consumer-facing redundancy check — useful as a sanity check on tier calls | Free | Light cross-reference |

**Steps**
1. Build a `sources/` folder with one Python script per source (or one consolidated script with adapters). Each script normalizes its output to a common schema: `{ supplement_name, source, source_url, last_updated, evidence_summary, key_claims[], cited_studies[] }`.
2. Run the scripts to populate a local `sources_cache.json` (keep it out of git or compress; this is just a working cache for review runs).
3. Update the SKILL.md / review prompts so the automated review cycle pulls from this cache **before** touching PubMed. PubMed becomes the deep-dive layer; ODS/EFSA/EMA/Cochrane become the "what does the regulator say" layer.
4. Add the source logo to each supplement card / article when that source has been used (you already have the logo SVGs).

**Mapping coverage targets**
- 100% of Tier 4 (Risky/Avoid) supplements should reference at least one regulator source (FDA, EFSA, EMA, Health Canada).
- 100% of Tier 1 (Strong Evidence) should reference at least one Cochrane review or NIH ODS fact sheet.
- 80%+ of all entries should cite ≥2 of the free sources besides PubMed.

**Done when** the cache is populated, the review pipeline pulls from it, and a sample audit shows ≥80% of supplements have at least 2 non-PubMed sources cited.

**Effort:** 18–22 hrs (most of the phase). Roughly 2 hrs per source script, plus 2–3 hrs of pipeline integration.

### #5 Differentiated review cadence by tier

The current 22-day uniform cycle treats Phenibut and Caffeine the same. They should not be on the same cycle.

**Proposed cadence**
| Tier / Category | Cadence | Trigger sources |
|---|---|---|
| Tier 4 (Risky/Avoid) + `safety` articles | Every 14 days OR on regulator alert | PubMed + openFDA FAERS + FDA MedWatch RSS + EFSA alerts |
| Tier 1 (Strong Evidence) + `breakthrough` | Every 30 days | PubMed + Cochrane |
| Tier 2 + Tier 3 | Every 60 days | PubMed + ODS/EMA |
| `guide`, `myth` (evergreen) | Every 90 days | PubMed |
| `kids` | Every 30 days (higher-stakes population) | PubMed + AAP guidance + NIH ODS pediatric |

**Steps**
1. Add a `cadence_days` field to each entry, defaulting based on tier/category but overridable.
2. Refactor the daily article-review selection rule in SKILL.md to use per-entry cadence instead of the global 20-day floor.
3. Add a regulator-alert listener (a small script that polls FDA MedWatch and EFSA alert RSS feeds; if a feed hit mentions a supplement in `data.js`, that supplement jumps to the front of the queue regardless of last-reviewed date).
4. Update the daily report to show "regulator-triggered" entries separately.

**Done when** the daily review run respects per-entry cadences and at least one regulator alert successfully triggers an out-of-cycle review.

**Effort:** 6 hrs.

### #7 Methodology page

Publish a public page (`methodology.html` or similar) explaining how scores are computed, what evidence triggers a tier change, the funding-source policy, the review cadence, and the source list. Sites that publish this rubric are perceived as more accurate *and* tend to be more accurate, because the rubric forces internal consistency.

**Sections to include**
1. **The 4 tiers** — verbatim from `data.js` plus what kind of evidence moves a supplement between tiers.
2. **The 6 sub-scores** (`e`, `s`, `r`, `o`, `c`, `d`) — what each letter means, how it's scored 1–5, and what evidence justifies each level.
3. **Source hierarchy** — meta-analyses > Cochrane > regulator dossiers > RCTs > cohorts > mechanistic > anecdote. Diagram preferred.
4. **Funding-source policy** — industry-funded effect estimates are discounted by ~25%; tier 1 calls require at least one independently-funded confirmatory study.
5. **Review cadence** — the table from #5.
6. **How interactions are modeled** — explain the `pairs` / `cautions` / `groups` system in plain English.
7. **What we don't claim** — explicit limits: not medical advice, no individual dosing recommendations, no diagnosis.
8. **How to flag an error** — link to the #10 feedback flow.

**Done when** the page is linked from the site's main navigation and reviewed for accuracy against your actual code (no claim should describe behavior you haven't built).

**Effort:** 6–8 hrs. Best done late in Phase 1 once the source list and cadence rules are stable.

---

## Phase 2 — Drug-supplement interactions (Weeks 7–10, ~25 hours)

This is the highest-liability content gap and likely the biggest single accuracy uplift on the site. Build a `DRUG_INTERACTIONS` block parallel to the existing `SUPP_INTERACTIONS`.

### #2 Drug-supplement interaction system

**Free data sources for this**
- **DrugBank academic license** — free for non-commercial use; gives you structured drug↔supplement interaction tables. Apply for access; ~2–3 day approval. **Pre-check that a supplement-information site qualifies; if it monetizes (ads, affiliate links), DrugBank may classify it as commercial.** If denied, fall back to:
- **openFDA Drug Labeling API** — every FDA-approved drug has a structured product label (SPL) with a "Drug Interactions" section. Free, no auth. Less curated than DrugBank but covers ~20,000 drugs.
- **NIH Drug-Nutrient Interactions tables** — published free; smaller but high-quality.
- **PubMed targeted searches** — for known high-risk pairs (warfarin × everything, statins × everything, SSRIs × serotonergic supplements).

**Schema (parallel to `SUPP_INTERACTIONS`)**
```js
DRUG_INTERACTIONS = {
  pairs: [
    { drug: 'warfarin', supplement: 'Vitamin K2 (MK-7)', severity: 'avoid',
      mechanism: 'antagonism', evidence: 'A', sources: ['DrugBank:DB00682', ...] },
    ...
  ],
  drug_groups: { /* SSRIs, statins, anticoagulants, antiplatelet, etc. */ },
  supplement_groups: /* reuse from SUPP_INTERACTIONS */
}
```

**Coverage target**
- Top 50 prescribed drugs in the US (data: openFDA prescription frequency or KFF rx tracker — free) × all 733 supplements = 36,650 cells. Most are null. Aim to populate the ~500 cells that are non-null.
- Plus: 100% of supplements in the existing `bleed`, `serotonin`, `hepatotoxic`, `hypoglycemic`, `hypotensive` mechanism groups must have explicit interactions modeled against the corresponding drug class.

**Steps**
1. Apply for DrugBank academic access. While waiting, scope what openFDA SPL parsing can give you as a fallback.
2. Build the cross-reference: for each supplement name (and synonyms), search the SPL "Drug Interactions" sections; emit candidate pairs with severity heuristics.
3. Manual review pass on the top 50 drugs. This is unavoidable — you don't want auto-generated drug interaction claims going live unreviewed. Budget ~10 hrs for this review.
4. Wire the new `DRUG_INTERACTIONS` block into `app.js`, the per-card display, and the My Profile alert (mirroring the existing `SUPP_INTERACTIONS` plumbing).
5. Add a "Take any prescription medications?" question to the My Profile flow if it doesn't exist; surface drug-supplement conflicts in the same alert banner.
6. Add a clear "This is not medical advice — talk to your pharmacist" disclaimer on any drug-interaction warning.

**Done when** the top 50 drugs × 733 supplements grid is populated, the My Profile flow surfaces drug conflicts, and a manual audit of 20 random pairs against UpToDate (you can use a library card for this) confirms no false-positive "avoid" calls.

**Effort:** 22–26 hrs (most concentrated work in the plan).

---

## Phase 3 — Depth + polish (Weeks 11–14, ~22 hours)

### #6 Form-specific evidence

You have 7 magnesium forms, multiple B12 forms, multiple choline forms, etc. Most share a single article. Some forms (L-threonate vs oxide, methyl- vs cyano-B12, alpha-GPC vs CDP-choline) have meaningfully different evidence and shouldn't be treated as interchangeable.

**Steps**
1. Generate the list of supplement entries that share an article ID (the `Magnesium Forms Explained` article is linked from 7 magnesium variants — that's fine for a *guide* but each variant should also link to form-specific evidence where it exists).
2. For each shared cluster, identify which forms have a distinct evidence base (Phase 1's source diversification helps here — NIH ODS often distinguishes forms).
3. Either (a) split into separate articles, or (b) add a "Form differences" callout on the shared article that explains where the trial data is vs isn't form-specific.
4. Add a `form_evidence_note` field on supplement entries that share articles, pointing to which trial data is form-specific vs class-level.

**Done when** at least the magnesium, B12, choline, calcium, and zinc clusters have form-specific evidence callouts; spot-check shows users can tell when "magnesium" trial data does or doesn't apply to L-threonate.

**Effort:** 10 hrs.

### #3 (continued) Backfill funding source on existing PubMed citations

Schema landed in Phase 0; this is the data backfill.

**Steps**
1. PubMed records have a `GRANT` element and many include a structured `COI Statement`. Pull these for every cited PMID across the corpus.
2. Auto-classify funder by name (NIH, USDA, Wellcome, MRC → `public`; Pfizer, Bayer, Pharmavite, Nestlé Health Sciences, Thorne, etc. → `industry`; mixed grant lists → `mixed`).
3. Patch citations in review docs and any structured citation list with the inferred values; flag low-confidence inferences for manual review.
4. Update tier assignments where industry-only evidence drove a high tier — apply the ~25% effect-size discount and re-evaluate.

**Done when** ≥90% of cited PMIDs have a populated `funder_type`, and every Tier 1 entry has at least one `public` or `nonprofit`-funded confirmatory citation.

**Effort:** 8 hrs.

### QA pass on tier assignments

After Phase 1 + 2 + form-specific work, some tier calls may now look out of date. Spot-check 30 random entries (10 per tier) against the new evidence base. Promote/demote where warranted.

**Effort:** 4 hrs.

---

## Phase 4 — Deferred until budget allows

These don't fit the free-only constraint but stay on the roadmap because they're the next-highest-impact moves.

### #8 Human reviewer of record

A credentialed reviewer (PharmD, RD, MD) on retainer for ~10 hrs/month spot-checks 20 entries. Adds a public byline. Likely $1.5–3k/month depending on credential.

**Stand-in for now:** invite 2–3 credentialed friends/colleagues to be informal advisory readers. Send them 5 entries each per quarter for spot-check feedback. Offer to credit them.

### Paid databases

Natural Medicines Comprehensive Database (~$200/yr) is the single biggest paid-tier upgrade if budget appears later. It's the industry standard for supplement evidence and interaction grading and would replace several of the manual integration efforts in Phase 1.

---

## Per-phase effort summary

| Phase | Calendar | Solo effort | Items addressed |
|---|---|---|---|
| 0 — Foundation | Weeks 1–2 | ~12 hrs | #4, #9, #3 (schema), #10 |
| 1 — Sources + methodology | Weeks 3–6 | ~30 hrs | #1, #5, #7 |
| 2 — Drug interactions | Weeks 7–10 | ~25 hrs | #2 |
| 3 — Depth + polish | Weeks 11–14 | ~22 hrs | #6, #3 (backfill), QA |
| **Total** | **~14 weeks** | **~90 hrs** | **9 of 10 items shipped; #8 deferred** |

At ~5–10 hrs/week, that's a ~10–18 week calendar window. Buffer it to 16 weeks.

---

## Success metrics

Track these monthly so you can tell whether the work is paying off.

1. **Source diversity** — % of entries with ≥2 non-PubMed sources cited. Target: 80% by end of Phase 1.
2. **Drug-interaction coverage** — number of populated drug-supplement pairs. Target: 500+ by end of Phase 2.
3. **Funding-source coverage** — % of citations with `funder_type` populated. Target: 90% by end of Phase 3.
4. **Cadence freshness** — days since last review, weighted by tier. Tier 4 should average <14 days; Tier 1 average <30; overall average <50.
5. **Flagged inaccuracies** — submissions through #10. Track count, time-to-resolution, and which subset turned out to be real corrections vs noise. A *rising* count of valid corrections found by readers is a bad signal; ideally this number stays low or flat as the source diversification fixes problems before users see them.
6. **Tier movement** — how many entries change tier per quarter. A small steady number (~5–10%) suggests the evidence base is being actively reviewed; zero suggests the cycle is rubber-stamping.

---

## Risks and what to do about them

- **DrugBank denies non-commercial access.** Fall back to openFDA SPL parsing + manual curation of top 50 drugs. Slower, less complete, still better than nothing.
- **Source scrapers break when sites redesign.** ODS/EFSA/EMA do redesign occasionally. Build the scrapers defensively (small, single-purpose, easy to fix); add a weekly cron that fails loudly if a fetch returns empty.
- **Solo bandwidth.** The plan assumes 5–10 hrs/week. If a real-life bottleneck hits, drop Phase 3 first (it's polish), keep Phases 0–2.
- **Without a credentialed reviewer, accuracy claims have a ceiling.** The methodology page should be honest about this — call it "evidence-graded" rather than "expert-reviewed" until that's actually true.
- **Industry-funded effect-size discount of 25% is a judgment call.** Document it in the methodology page and be willing to revise if your own data suggests a different number.

---

## What's intentionally not in this plan

- A rebuild of the existing review pipeline (it works, build on it).
- Switching the site off `data.js` to a real DB (premature for the scale).
- A mobile app, an API for third parties, an account system — none of these improve accuracy.
- Translation into other languages — accuracy first, reach later.

---

## Next concrete step

Start Phase 0 this week. Specifically:

1. Run the category-backfill (#4) — Claude can do this in one session.
2. Add the visible "last reviewed" badge (#9) — small UI change, immediate trust win.
3. Stand up the schema additions for funding source (#3) so the next scheduled review run starts populating them.
4. Wire up Formspree for the feedback button (#10).

Phase 0 is achievable in a single weekend. Everything after that should compound.
