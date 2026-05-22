# Content polish pass — 2026-05-22 (ISO week 21)

Third run of `weekly-content-polish-pass`. Prior-8-weeks history applied: the 16 pages from the 2026-05-10 (W19) and 2026-05-17 (W20) runs were excluded from this week's eligible pool. Pages selected via ISO-week-21 deterministic shuffle (SHA-256 of `2026-W21|<category>|<rel>`) of the oldest-quartile pool per category (oldest = no `last-reviewed` marker, then oldest mtime). All backups written as `<filepath>.bak-2026-05-22T173000Z`.

## Pages polished (verdict)

| Path | Verdict | Changes |
| --- | --- | --- |
| `a/ginger-for-nausea-stronger-than-you-rsquo-d-expect.html` | Tightened | 6 (4 hierarchy h3→h2, 1 cross-link, +cadence) |
| `a/hawthorn-berry-for-heart-failure-a-european-mainstay.html` | Tightened | 7 (1 lede rewrite bundled with hierarchy on first heading, 5 hierarchy h3→h2 total, +cadence) |
| `a/saccharomyces-boulardii-the-yeast-probiotic-backed-by-strong-trials.html` | Tightened | 7 (4 hierarchy h3→h2, 2 cross-links bundled into lede edit, +cadence) |
| `s/akkermansia-muciniphila.html` | Tightened | 3 (2 cross-links bundled into 1 edit, +cadence) |
| `s/coconut-oil.html` | Tightened | 2 (1 cross-link, +cadence) |
| `s/copper.html` | Tightened | 4 (3 cross-links across two edits, +cadence) |
| `condition/nafld-protocol.html` | Tightened | 7 (6 cross-links across 5 edits, +cadence) |
| `compare/inositol-vs-berberine-for-pcos.html` | Tightened | 6 (5 cross-links bundled into 2 edits, +cadence updated from 2026-05-10) |

## Per-page change counts by category

| Page | Hook | Hierarchy | Microcopy | Cross-link |
| --- | --- | --- | --- | --- |
| ginger-for-nausea | 0 | 4 | 0 | 1 |
| hawthorn-berry-heart-failure | 1 (lede) | 5 | 0 | 0 |
| saccharomyces-boulardii-yeast-probiotic | 0 | 4 | 0 | 2 |
| s/akkermansia-muciniphila | 0 | 0 | 0 | 2 |
| s/coconut-oil | 0 | 0 | 0 | 1 |
| s/copper | 0 | 0 | 0 | 3 |
| condition/nafld-protocol | 0 | 0 | 0 | 6 |
| compare/inositol-vs-berberine-for-pcos | 0 | 0 | 0 | 5 |
| **Total** | **1** | **13** | **0** | **20** |

(Cross-link totals count individual `<a>` wraps inserted; several were bundled into single Edit operations where the original text contained adjacent supplement names — e.g. inositol-vs-berberine bundled myo-inositol + D-chiro-inositol + inositol + berberine in the lede edit.)

## Lede before/after (only rewrites)

**`a/hawthorn-berry-for-heart-failure-a-european-mainstay.html`** — surfaced the "supplement that is also a prescription drug" hook into the first clause, and folded the 2,681-patient SPICE mortality-trial size into the lede; the original opened on "used in European cardiology for over a century" history-of-use framing and buried the WS 1442 reimbursement signal in sentence two.

- *Before:* "Hawthorn (Crataegus species) extracts have been used in European cardiology for over a century for mild heart failure and angina. The standardised extract WS 1442 is prescribed as a drug in Germany and several other EU countries with reimbursement. Its evidence base is more substantial than most supplement consumers realise."
- *After:* "Hawthorn (Crataegus species) is one of the few supplements that is also a prescription cardiology drug: the standardised extract WS 1442 is reimbursed as a heart-failure medicine in Germany and several other EU countries, with over a century of clinical use behind it. Its evidence base is correspondingly more substantial than most supplement consumers realise — including a 2,681-patient mortality trial."

(Net delta ≈ +8 words; under the ±50-word cap. SPICE trial size pulled from the page's own body text — no new numbers invented.)

## Escalation queue

No tier/score/safety/dose escalations surfaced on this run. Authoritative-touch checks:

- **No factual-claim/`data.js` contradictions** on the polished supplement slugs (akkermansia-muciniphila, coconut-oil, copper, plus cross-link target slugs: vitamin-b6, saccharomyces-boulardii, probiotics, mct-oil, pomegranate-extract, fibre, iron, zinc, vitamin-c, vitamin-e, choline, phosphatidylcholine, curcumin, vitamin-d3, egcg-concentrate, inositol, myo-inositol, d-chiro-inositol, berberine, nac). The polish pass did not modify data.js; this check is "nothing-jumped-out" on the polished pages.
- **No missing safety/contraindication mention** on the polished pages. Ginger article calls out the antiplatelet caution alongside warfarin/DOACs/clopidogrel/NSAIDs and the heartburn-at-≥2 g/day GI side effect. Hawthorn article calls out the digoxin/nitrate/antihypertensive additive interaction and the 2-weeks-pre-surgery stop. Saccharomyces boulardii article calls out the rare-but-serious Saccharomyces fungaemia signal in severely immunocompromised / central-line / NICU patients. Copper page calls out the zinc time-of-day separation and the vitamin C simultaneous-dose interaction. NAFLD condition page leads with a danger-card on weight-loss-first messaging and embeds the prostate-cancer-signal caveat for high-dose vitamin E plus the contraindicated-in-pregnancy flag for berberine. Inositol-vs-berberine compare page has a danger-card and a "Who should skip each" section that surface the pregnancy contraindication on berberine and the CYP3A4-drug-interaction list.
- **All cited PMIDs / DOIs look real and well-formed** on the polished articles (ginger: 26348534, 21818642; hawthorn: SPICE/Pittler-Cochrane referenced by description, no PMID in body but the Sources block was not modified; saccharomyces: 26216624, 20458757; nafld-protocol: PIVENS/Genazzani/Pundir/Wei references by name; inositol-vs-berberine: 28544572, 24576223, 22019891, 23869585, 22296306, 32849316). No live-link checks performed.

## Notes

- **Hierarchy bias on `a/` pages continues.** All three `a/` articles polished this week jumped directly from `h1` to `h3` in the in-article body (continuing the recurring pattern flagged in W19 and W20). Promoted in-article section heads to `h2` and left `<h3>` in `Sources` blocks and `SS-AUTOLINKS` related-links untouched (same policy as prior runs). This is now the third consecutive week the same systemic issue has surfaced — a downstream `a/` bulk-fix task would be more efficient than reaching it page-by-page through the polish pipeline.
- **Lede policy.** Kept the lede on `ginger-for-nausea` (already leads with the strongest "clinically-meaningful effect + safety profile beats prescription antiemetics" framing), `saccharomyces-boulardii-yeast-probiotic` (already leads with the yeast-not-bacterium / antibiotic-co-administration hook), `condition/nafld-protocol.html` (already leads with the MASLD nomenclature change + "supplement aisle's other favourite hunting ground" framing), and `compare/inositol-vs-berberine-for-pcos.html` (already leads with the head-to-head-vs-metformin and phenotype-matching framing). Rewrote only the hawthorn lede, which buried its strongest evidence signal (reimbursed-as-a-drug + 2,681-patient SPICE trial) behind history-of-use boilerplate.
- **Cross-link policy.** Wrapped first body-text occurrence only, never wrapped headings or table-of-contents / related-link blocks. Skipped wraps where the slug was missing or ambiguous (`chromium` ambiguous between `chromium-gtf` and `chromium-nicotinate` on the inositol-vs-berberine page; `vitamin D` ambiguous between generic and `vitamin-d3` on the same page; `resveratrol` not in `s/`; `coffee` not in `s/`; `silymarin` standalone slug missing — only `milk-thistle` exists). Verified every target slug existed before wrapping.
- **Soft observation — tier label-string drift (not escalated).** On the three `s/` pages polished, the chip uses "Tier N — Trending"/"Tier N — Promising" while the auto-generated lede and FAQ blocks use "Tier N — emerging evidence"/"Tier N — promising evidence". The tier *number* is consistent across chip/lede/FAQ on all three pages (so this is *not* a repeat of the W20 choline-bitartrate escalation, which was a tier-number drift). Noting it here so a future template-consistency task can decide whether to standardise label strings. Not in scope for this polish pass.
- **Per-page edit budget (12) was not hit on any page.** Smallest delta was 2 (`s/coconut-oil.html`: one cross-link + cadence), largest was 7 (`a/hawthorn-berry-heart-failure.html` and `a/saccharomyces-boulardii-yeast-probiotic.html` and `condition/nafld-protocol.html`).
- **EGCG cross-link target.** On `condition/nafld-protocol.html`, used `egcg-concentrate.html` as the slug target since no standalone `egcg.html` exists; this is the same call the W20 run made on similar pages.
- No `data.js`, `app.js`, `pairings-data.js`, `medications.json`, tier, score, dose-range, or PMID changes. No git commits. Light-mode-only respected (no theme CSS touched). All 8 backups present on disk at `<filepath>.bak-2026-05-22T173000Z`.
