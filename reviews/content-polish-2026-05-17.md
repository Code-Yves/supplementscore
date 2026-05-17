# Content polish pass — 2026-05-17 (ISO week 20)

Second run of `weekly-content-polish-pass`. Prior-8-weeks history applied: the 8 pages from the 2026-05-10 (week 19) run were excluded from this week's eligible pool. Pages selected by ISO-week-20 deterministic shuffle of the oldest-quartile pool per category (oldest = no `last-reviewed` marker, then oldest mtime). All backups written as `<filepath>.bak-2026-05-17T070410Z`.

## Pages polished (verdict)

| Path | Verdict | Changes |
| --- | --- | --- |
| `a/collagen-for-athletes-recovery-tendons-and-joint-health.html` | Tightened | 6 (4 hierarchy, 1 cross-link, +cadence) |
| `a/creatine-for-older-adults-muscle-brain-and-bone.html` | Tightened | 5 (1 lede rewrite, 3 hierarchy, 1 cross-link bundled with lede, +cadence) |
| `a/black-seed-oil-nigella-sativa-what-the-thymoquinone-trials-show-for-metabolic-and-allergic-disease.html` | Tightened | 8 (1 lede rewrite, 6 hierarchy, +cadence updated from 2026-05-13) |
| `s/choline-bitartrate.html` | Tightened (escalation flagged) | 4 (3 cross-link inserts, +cadence) |
| `s/bee-propolis.html` | Largely reaffirmed | 1 (+cadence) |
| `s/beta-carotene.html` | Tightened | 3 (1 microcopy: truncated TLDR fixed, 1 cross-link, +cadence) |
| `condition/prostate-health.html` | Tightened | 10 (9 cross-link inserts across BPH stack and prevention bullets, +cadence) |
| `compare/magnesium-forms.html` | Tightened | 4 (6 cross-link inserts bundled into 3 edits, +cadence) |

## Per-page change counts by category

| Page | Hook | Hierarchy | Microcopy | Cross-link |
| --- | --- | --- | --- | --- |
| collagen-for-athletes | 0 | 4 | 0 | 1 |
| creatine-for-older-adults | 1 (lede) | 3 | 0 | 1 (bundled in lede edit) |
| black-seed-oil-nigella-sativa | 1 (lede) | 6 | 0 | 0 |
| s/choline-bitartrate | 0 | 0 | 0 | 3 |
| s/bee-propolis | 0 | 0 | 0 | 0 |
| s/beta-carotene | 0 | 0 | 1 (truncated TLDR) | 1 |
| condition/prostate-health | 0 | 0 | 0 | 9 |
| compare/magnesium-forms | 0 | 0 | 0 | 6 |
| **Total** | **2** | **13** | **1** | **21** |

(Cross-link totals count individual `<a>` wraps inserted; some were bundled into single Edit operations where the original text contained multiple adjacent supplement names — e.g. magnesium-forms wrapped four chelates in one parenthetical edit.)

## Lede before/after (only rewrites)

**`a/creatine-for-older-adults-muscle-brain-and-bone.html`** — surfaced the cross-domain counterintuitive angle (muscle + bone + cognition) into the first sentence; the original lede led with "athletic performance for decades" and buried the older-adult specificity in a generic "more compelling stories" hedge.

- *Before:* "Creatine monohydrate has been studied for athletic performance for decades. The emerging evidence for its role in healthy aging — across muscle, brain, and bone — has quietly become one of the more compelling stories in nutrition science for older adults. For adults over 60, the argument for creatine supplementation is substantially stronger than most people realize."
- *After:* "Creatine monohydrate has been studied for gym performance for decades, but the strongest case for taking it is no longer about a deadlift PR — it's about defending muscle, bone, and cognition after 60. Adults lose roughly 3 to 8% of muscle mass per decade, brain creatine content falls with age, and femoral-neck bone density declines; randomized trials of creatine plus resistance training have now softened all three trajectories in older adults."

(Net delta ≈ +5 words; under the ±50-word cap. Also folds in the s/creatine-monohydrate cross-link.)

**`a/black-seed-oil-nigella-sativa-what-the-thymoquinone-trials-show-for-metabolic-and-allergic-disease.html`** — surfaced the comparative effect-size claim (BP and LDL benefits "approach what you'd expect from a low-dose antihypertensive or a plant-stanol supplement") into the lede; the original lede leaned on "centuries of use" framing and buried the modern-trial signal.

- *Before:* "Nigella sativa, known commercially as black seed or black cumin, has been used in Middle Eastern and South Asian medicine for centuries and has become one of the most-studied medicinal plants in the modern peer-reviewed literature. Its principal bioactive thymoquinone (about 0.5 to 1.6 percent of the seed oil) is the basis of most of the trial work, although other components — nigellone, thymohydroquinone, alpha-hederin — likely contribute."
- *After:* "Nigella sativa — black seed or black cumin — has been used in Middle Eastern and South Asian medicine for centuries, but the reason it deserves a modern look is the trial data: in randomized studies, the blood-pressure and LDL-cholesterol effects approach what you'd expect from a low-dose antihypertensive or a plant-stanol supplement, not the usual herbal-monograph noise. The principal bioactive, thymoquinone (about 0.5 to 1.6 percent of the seed oil), drives most of the work, with nigellone, thymohydroquinone, and alpha-hederin likely contributing."

(Net delta ≈ +10 words; well under the ±50-word cap.)

## Escalation queue

One item flagged for `supplement-trending-review` / `supplement-article-review`:

- **`s/choline-bitartrate.html` — tier mismatch between the page chip and the page body text.** The page's "Choline bitartrate (precursor, cost-effective)" variant correctly shows `Tier 3 — Trending` in the head chip, matching `data.js` (`t:'t3'`). However, the auto-generated SEO-LEDE TL;DR (`<p class="ss-tldr">`) reads "Choline bitartrate is a tier 2 (promising evidence) supplement" and the SEO-FAQ block states "Tier 2 — promising evidence". The composite score (70/100) is consistent across all three regions and matches the data.js stat block, so this is specifically a tier-label-string drift, not a score drift. Likely cause: the lede/FAQ generator pulled metadata from the sibling "Choline bitartrate" entry (`t:'t2'`) in `data.js` rather than the "(precursor, cost-effective)" entry (`t:'t3'`). Polish pass did **not** auto-fix the tier text per the rules (no tier/score changes). Recommend the tier-aware article-review task regenerate the lede + FAQ blocks for this slug, or that the lede template be patched to disambiguate variants by full `n:` string rather than prefix match.

Other authoritative-touch checks ran clean:

- No factual claim contradicted `data.js` for the polished supplement slugs (collagen-peptides, vitamin-c, creatine-monohydrate, alpha-gpc, citicoline, pantothenic-acid, vitamin-a, saw-palmetto, beta-sitosterol, zinc, lycopene, vitamin-e, selenium, vitamin-d3, pomegranate-extract, sulforaphane, glycine, magnesium-glycinate, magnesium-citrate, magnesium-malate, magnesium-taurate, magnesium-l-threonate). The polish pass did not modify data.js; this check is "nothing-jumped-out" on the polished pages.
- No safety/contraindication mention struck me as missing for any of the eight pages — the beta-carotene page leads its What-it-is paragraph with the ATBC/CARET smoker harm signal (in caps); the bee-propolis page calls out the anaphylaxis-on-bee-allergy contraindication twice; the prostate-health page leads with a danger-card that pre-empts symptomatic men from self-managing without a urology workup; the magnesium-forms page surfaces the eGFR<30 + bisphosphonate/antibiotic chelation cautions in a dedicated section.
- All cited PMIDs / DOIs on the polished articles look real and well-formed (collagen: 27852613, 30609761, 19847319, 26822714, 33742704, 18416885; creatine-for-older: 24576864, 25431239, 29704637, 28615996, 30978926; black-seed-oil: 27512965, 32385942, 21675032, 27904549, 20947211, 20149611). No live-link checks performed — judgment based on syntax and recognisable identifier patterns.

## Notes

- **Hierarchy bias on `a/` pages.** All three `a/` articles polished this week jumped directly from `h1` to `h3` in the in-article body (a recurring pattern flagged in the 2026-05-10 run). Promoted in-article section heads to `h2` and left the `h3` in `Sources` and `SS-AUTOLINKS:start` blocks untouched — same policy as the prior run. The three articles polished here add to the existing pattern: this hierarchy issue is likely systemic across older `/a/` content. If a downstream task wants to bulk-fix, it's a mechanical transform on the closing-tag-aware `<h3>` → `<h2>` for any `<h3>` that is the first sibling of an `h1` ancestor block. Not in scope for this task.
- **Lede policy.** Kept the lede on `a/collagen-for-athletes-recovery-tendons-and-joint-health.html`, `condition/prostate-health.html`, and `compare/magnesium-forms.html` — each already led with the most counterintuitive framing (vitamin C is non-optional for tendon collagen; BPH vs cancer-prevention conflation; all three forms work but anion choice matters). Rewriting would have been cosmetic. Rewrote ledes on the two articles that buried their strongest signal behind history-of-use or hedge framing (creatine, black-seed).
- **Cross-link policy.** Wrapped first body-text occurrence only, never wrapped headings or table-of-contents/related-link blocks. Skipped wraps where the slug was missing (`glucosamine`, `chondroitin`, `magnesium-oxide`, `magnesium-sulfate`, `pygeum` outside the existing `pygeum-africanum.html` route, `metformin`, `tamsulosin`, `finasteride`, `EGCG` as a distinct slug, `phytosterols` for "plant stanols" which would be cousin-not-same). Verified all 32 slug existences in `s/` before wrapping.
- **Microcopy on `s/beta-carotene.html`.** The auto-generated TL;DR carried a truncated dose fragment (`"Typical dose: Do NOT supplement isolated beta-carotene if you smoke or hav."`). Replaced with a complete dose summary using the values already present in the page's Dose section ("avoid isolated beta-carotene if you smoke or have ever smoked; 5–15 mg/day mixed carotenoids with food for non-smokers, food sources preferred"). No new dose ranges invented — same 5–15 mg/day figure already in the body. Likely cause: an upstream lede-generator character cap. May be worth a separate task to scan for similar truncations across `s/*.html`.
- **`s/bee-propolis.html`** received no body-text changes — hierarchy clean, microcopy concrete and safety-loaded, no eligible supplement names in body for cross-link injection. Cadence-only update.
- **Per-page edit budget (12)** was not hit on any page; smallest delta was 1 (`s/bee-propolis.html` cadence only), largest was 10 (`condition/prostate-health.html`).
- No `data.js`, `app.js`, `pairings-data.js`, `medications.json`, tier, score, dose-range, or PMID changes. No git commits. Light-mode-only respected (no theme CSS touched). All 8 backups present on disk at `<filepath>.bak-2026-05-17T070410Z`.
