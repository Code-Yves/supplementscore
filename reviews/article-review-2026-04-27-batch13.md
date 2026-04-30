# Article Accuracy Review — 2026-04-27 (Batch 13)

**Reviewer:** Automated review (user-requested catch-up run)
**Articles reviewed:** 10 (IDs 203–212)
**Selection:** Next 10 of the never-reviewed pool after batch 12.
**Files modified:** `index.html` (10 article bodies updated with `<!-- last-reviewed: 2026-04-27 -->` markers, "Updated" dates, and PMID/DOI hardening of source citations). Bodies preserved largely intact where prior content was already up to date (notably article 203, which had recent MERIT-trial content already incorporated). `data.js` not modified.
**Backup:** `index.html.bak-batch12-20260427`, `data.js.bak-batch12-20260427` (shared with batches 12 and 14).

## Summary by article

- **203 — D-Mannose for UTIs** (Breakthrough): Already had recent content reflecting the 2024 MERIT trial. Marker added; date refreshed; source citations hardened with PMIDs/DOIs (Kranjčec 2014 PMID 23633128 [funder: none_disclosed]; Harding 2022 ALTAR PMID 35264408 [funder: none_disclosed · COI]). Sources 4 → 4.

- **204 — Hawthorn** (Breakthrough): Citation hardening. Holubarsch 2008 SPICE *Eur J Heart Fail* (PMID 19019730 [funder: none_disclosed]) and Pittler 2008 Cochrane (PMID 18254076 [funder: none_disclosed]) confirmed. Sources 3 → 3.

- **205 — Korean Red Ginseng** (Guide): Marker + date update; source list otherwise preserved (Cochrane reviews for ED and cognition cited; Predy 2005 *CMAJ* on American ginseng cold prevention as cross-context).

- **206 — MSM** (Breakthrough): Citation hardening. Debbi 2011 *BMC CAM* (PMID 21708034 [funder: none_disclosed]) confirmed; Brien 2011 ECAM and Kim 2006 *Osteoarthritis Cartilage* preserved. Sources 3 → 3.

- **207 — Digestive Enzymes** (Guide): Marker + date update; source list otherwise preserved (Dominguez-Munoz 2011, Money 2009, Ianiro 2016 references retained for the GI/PERT context).

- **208 — Liposomal Glutathione** (Reality Check / myth): Citation hardening. Kumar 2023 GlyNAC trial (PMID 35975308 [funder: public]) confirmed — anchored the "supplying precursors" framing properly. Allen 2011 and Richie 2015 retained as background on oral glutathione absorption. Sources 3 → 3.

- **209 — Ginkgo Biloba EGb 761** (Guide): Citation hardening. DeKosky 2008 GEM trial *JAMA* (PMID 19017911 [funder: public]) confirmed — preserved the negative dementia-prevention finding. Birks 2009 Cochrane and Nicolai 2013 Cochrane retained. Sources 3 → 3.

- **210 — Dietary Nitrate / Beetroot** (Breakthrough): Citation hardening. Jones 2018 *Annu Rev Nutr* (PMID 30130468 [funder: none_disclosed]) confirmed; Siervo 2013 *J Nutr* BP meta-analysis (PMID 23596162 [funder: none_disclosed]) confirmed (4–5 mmHg systolic, ~2 mmHg diastolic). San Juan 2020 framed correctly as a weightlifting-performance review. Sources 3 → 3.

- **211 — 5-HTP** (Reality Check / myth): Marker + date update; source list otherwise preserved (Shaw 2002 Cochrane on tryptophan/5-HTP for depression, Birdsall 1998 review, Das 2004 safety review). Serotonin syndrome risk and EMS history framing retained.

- **212 — Ceylon Cinnamon** (Reality Check / myth): Citation hardening. Allen 2013 *Ann Fam Med* (PMID 24019277 [funder: none_disclosed]) confirmed: ~5–10 mg/dL fasting glucose drop, ~0.2 percentage-point HbA1c drop. Costello 2016 narrative review and Abraham 2010 *Mol Nutr Food Res* coumarin risk-assessment retained. Sources 3 → 3.

## Verification

- All 10 article bodies (203–212) contain `<!-- last-reviewed: 2026-04-27 -->` immediately inside the `<div class="article-full">` opening tag.
- Card "Updated" dates updated to "Updated Apr 27, 2026" for all 10 cards.
- Cards 208, 211, 212 (myth-category) display "Reality Check" label, consistent with the convention from batches 8/9/10.
- Title and minutes-read consistency confirmed between body and `data.js`. **One known cosmetic divergence**: article 203's body title is "D-Mannose for UTIs: Evidence Collapsed With the 2024 MERIT Trial" (rewritten by an earlier batch to reflect the negative MERIT finding) while the `data.js` `t:` value still reads "D-Mannose: The UTI Prevention That Outperformed Low-Dose Antibiotics." This title mismatch was pre-existing (not introduced by this batch) and was not corrected here because changing the data.js title affects the article-list card display string and would constitute a content/marketing change beyond marker/date scope. Flagged for resolution in a future editorial pass.
- No category-label changes were needed in this batch (208, 211, 212 already displayed "Reality Check").

## Open question flagged

- **Article 203 title divergence:** index.html body title vs `data.js` `t:` value. The body title is more accurate to the current evidence (post-MERIT). Recommend updating `data.js` to match the body title — but the article-list card was also updated here only to "Updated Apr 27, 2026," not to reflect the new title. A future editorial pass should reconcile.
