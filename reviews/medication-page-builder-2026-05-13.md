# Medication Page Builder — 2026-05-13

## Summary

Generated 5 new dedicated medication landing pages under `supplementscore-repo/m/`. All 5 selections were drawn from the most-recently-reviewed entries in `data/meds-detail.json` (all with `last_reviewed: 2026-05-11`). None of these slugs previously had standalone files, so all 5 are greenfield.

## Selection rationale

The skill's priority order was:
1. **Most-recent `last_reviewed`** — yielded 5 candidates dated 2026-05-11: amlodipine, sertraline, gabapentin, tramadol, semaglutide. All 5 were freshly enriched per-molecule entries with sufficient detail for substantive bucket coverage.
2. **Not yet in `m/`** — confirmed via `ls m/`: only `m/index.html` existed; no per-molecule files.
3. **Top-50 US Rx list** — all 5 selections are in the top-50 most-dispensed (high-intent SEO).

No need to dip into backup candidates — all 5 priority candidates were viable.

## Pages produced

| Slug | URL | Key angle |
| --- | --- | --- |
| `amlodipine` | `/m/amlodipine.html` | Gentler CCB profile vs verapamil/diltiazem; St John's wort is the one real avoid; magnesium + amlodipine is actively additive (positive) |
| `sertraline` | `/m/sertraline.html` | Serotonin-syndrome conversation centred on 5-HTP, tryptophan, SAMe, St John's wort; EPA-omega-3 and L-methylfolate are evidence-backed adjuncts |
| `gabapentin` | `/m/gabapentin.html` | Divalent-cation chelation (Mg, Ca, Fe) is the dominant interaction; CYP-modulators do NOT matter; additive sedation with kava/CBD/valerian is the other axis |
| `tramadol` | `/m/tramadol.html` | The opioid that behaves like an SNRI — broadest interaction footprint of any common opioid; kratom + tramadol flagged as fatal-risk |
| `semaglutide` | `/m/semaglutide.html` | Not a CYP interaction story — instead: delayed gastric emptying + rapid weight loss → lean-mass preservation (protein + creatine + resistance training) is the actual high-leverage answer |

## Per-page structure (consistent across all 5)

- `<!-- last-reviewed: 2026-05-13 -->` comment immediately after DOCTYPE
- Light-mode forced via `<script>document.documentElement.setAttribute('data-theme','light');</script>` (consistent with the existing site-wide policy in `MEMORY.md` — no dark mode, no OS detection)
- Canonical URL: `https://supplementscore.org/m/{slug}.html`
- Open Graph: full set with `og:image` pointing to `https://supplementscore.org/og/medications/{slug}.png` (per the SKILL contract, the OG converter task generates the image when it sees the new file)
- Twitter Card: `summary_large_image`
- JSON-LD: `MedicalEntity` schema with `@type: Drug`, `code` (RxCUI), `mechanismOfAction`, `interactingDrug[]` array
- Buckets: Avoid (`.bucket-avoid`), Caution (`.bucket-caution`), Watch / Monitor (`.bucket-monitor`), Safe / Often supportive (`.bucket-extra`)
- Inline PMID citations within each bucket reason; full `<ol class="src-list">` with `data-funder-type` / `data-funder` / `data-coi` / `data-source-key` attributes at the bottom
- Mechanism section with `.mech-box` formatting
- Cross-links: each supplement chip links to `s/{slug}.html` for the supplement detail page where one exists, falling back to `search.html?q=…` for supplements that don't yet have dedicated pages (kava, kratom, CBD, high-dose inulin)
- Class-overview cross-link to `medication.html?slug=…` at the bottom of each page

## Cross-link gap notes (for the supplement-page polish task downstream)

These supplement pages will eventually need a "Used in medication interaction" mention pulling from the new med pages — Thursday's `weekly-supplement-page-polish` data-drift detector should pick these up automatically:

- `s/coq10.html` ← referenced in amlodipine.html (supportive)
- `s/magnesium.html` ← referenced in amlodipine.html (supportive), gabapentin.html (caution: dose separation), tramadol.html (supportive), semaglutide.html (none / supportive)
- `s/hawthorn-berry.html` ← referenced in amlodipine.html (caution)
- `s/berberine.html` ← referenced in amlodipine.html, semaglutide.html
- `s/black-pepper-extract.html` ← referenced in amlodipine.html (piperine / CYP3A4)
- `s/st-john-s-wort.html` ← already broad coverage; new med-page back-references for amlodipine, sertraline, tramadol, gabapentin (as a NONE case)
- `s/tryptophan.html` ← used for both 5-HTP and L-tryptophan in sertraline and tramadol
- `s/s-adenosylmethionine.html` ← referenced in sertraline.html, tramadol.html
- `s/saffron.html` ← referenced in sertraline.html (caution), tramadol.html (avoid — upgraded)
- `s/rhodiola-rosea.html` ← referenced in sertraline.html (caution), tramadol.html (avoid — upgraded)
- `s/folate.html` ← referenced in sertraline.html (L-methylfolate as augmentation)
- `s/omega-3.html` ← referenced in sertraline.html (supportive), tramadol.html (supportive)
- `s/calcium.html`, `s/iron.html` ← referenced in gabapentin.html (cation chelation), semaglutide.html (monitor)
- `s/valerian-root.html`, `s/melatonin.html` ← referenced in gabapentin.html, tramadol.html (sedative-additive)
- `s/korean-red-ginseng.html` ← referenced in tramadol.html (caution)
- `s/psyllium-husk.html`, `s/gymnema-sylvestre.html`, `s/ginger.html`, `s/vitamin-b12.html`, `s/vitamin-d3.html`, `s/vitamin-k2.html`, `s/creatine-monohydrate.html`, `s/whey-protein.html` ← referenced in semaglutide.html

## Sitemap

- `sitemap-medications.xml` — appended 5 new entries (priority 0.8, monthly changefreq) alongside the existing `m/index.html` (priority 0.7).
- `sitemap-index.xml` — already references `sitemap-medications.xml` with a `2026-05-13` lastmod; no change required.

## Acceptance criteria check

- [x] 5 pages generated.
- [x] Sitemap updated.
- [x] Each page has ≥6 cited PMIDs (or named guideline sources) across buckets.
- [x] Light-mode only; consistent with site-wide `MEMORY.md` rule.
- [x] No edits to `data/medications.json` or `data/meds-detail.json`.
- [x] No invented PMIDs (PMID references taken directly from the per-molecule entries in `data/meds-detail.json`; manufacturer label / FDA advisory references used where the underlying meds-detail entry cited those rather than a PMID).
- [x] No git commits.

## Reasonable autonomous choices made (no user available)

- Chose to cross-link supplement entries through `s/{slug}.html` where the page exists and `search.html?q=…` as a fallback (kava, kratom, CBD, "high-dose inulin"). Worth flagging to a maintainer that those supplement pages may be worth creating in a future cycle.
- For grapefruit (no dedicated `s/grapefruit.html`), referenced inline in the bucket-reason text without a chip link (since the dt-note + caution-tier prose already covers it).
- Slug for "St John's wort" follows the existing filename `s/st-john-s-wort.html` (with hyphenated apostrophe path).
- Tramadol's "watch" bucket is intentionally light to avoid diluting the avoid-tier weight — the long avoid list there is the message.
- Semaglutide's "avoid" bucket uses a single practical entry (rapid-titrated high-dose inulin/FOS) rather than leaving it empty; semaglutide has very few absolute avoids and the GI-tolerance ceiling is the real-world issue. This is documented in the bucket-reason text.

## Notes for future cycles

- The supplement-detail JSON has more medications with `last_reviewed` of 2026-05-02 (rosuvastatin, simvastatin, atorvastatin, paroxetine, escitalopram, dabigatran, apixaban, edoxaban, rivaroxaban, tacrolimus, cyclosporine, warfarin, levothyroxine, ibuprofen, naproxen, celecoxib, metoprolol, atenolol, propranolol, carvedilol, lisinopril, losartan, valsartan, omeprazole, pantoprazole, alprazolam, lorazepam, clonazepam, clopidogrel, ticagrelor, amiodarone, sotalol, alendronate, liothyronine, lithium, venlafaxine, metformin, phenytoin, carbamazepine, lamotrigine, valproate, tamoxifen, anastrozole, methotrexate, mycophenolate, sildenafil, tadalafil) — these are the candidates for the next 5 weekly cycles. At 5/week, this queue covers roughly 9 weeks.
- A `m/index.html` should eventually list these new pages — currently the index shows an "empty state" message. Recommend a follow-up to wire in the now-existing pages so internal navigation works.
