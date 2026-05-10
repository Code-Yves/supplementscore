# Content polish pass — 2026-05-10 (ISO week 19)

First run of `weekly-content-polish-pass`. No prior history; no exclusions applied. Pages selected by ISO-week-19 deterministic shuffle of the oldest pool (pages without a `last-reviewed:` marker).

## Pages polished (verdict)

| Path | Verdict | Changes |
| --- | --- | --- |
| `a/black-cohosh-for-menopause-cautious-yes-cautious-no.html` | Tightened | 7 (1 microcopy, 5 hierarchy, 1 cross-link batch, +cadence) |
| `a/tianeptine-the-legal-opioid-hiding-in-gas-station-supplements.html` | Tightened | 8 (1 lede rewrite, 6 hierarchy, +cadence) |
| `a/the-protein-supplement-guide-whey-vs-plant-vs-casein.html` | Tightened | 9 (5 hierarchy, 3 cross-link inserts, 2 microcopy / hedge trim, +cadence) |
| `s/l-serine.html` | Largely reaffirmed | 3 (1 microcopy tighten, 1 cross-link, +cadence) |
| `s/vinpocetine.html` | Tightened | 5 (3 cross-link inserts, 1 en-dash fix, +cadence) |
| `s/japanese-knotweed.html` | Tightened | 4 (1 microcopy + en-dash fix, 1 hedge trim, 1 article-tightening, +cadence) |
| `condition/long-covid-evidence.html` | Tightened | 6 (4 cross-link inserts on bullet items, 1 microcopy clarification, +cadence) |
| `compare/coq10-vs-pqq.html` | Tightened | 4 (3 cross-link inserts, +cadence) |

All pages received the cadence-comment update (`<!-- last-reviewed: 2026-05-10 -->`). All 8 pages had a backup written as `<filepath>.bak-2026-05-10T064500Z`.

## Per-page change counts by category

| Page | Hook | Hierarchy | Microcopy | Cross-link |
| --- | --- | --- | --- | --- |
| black-cohosh-for-menopause | 0 | 5 | 0 | 2 |
| tianeptine-the-legal-opioid | 1 (lede) | 6 | 0 | 0 |
| the-protein-supplement-guide | 0 | 5 | 2 | 3 |
| s/l-serine | 0 | 0 | 1 | 1 |
| s/vinpocetine | 0 | 0 | 1 (en-dash) | 3 |
| s/japanese-knotweed | 0 | 0 | 2 | 0 |
| condition/long-covid-evidence | 0 | 0 | 1 | 5 |
| compare/coq10-vs-pqq | 0 | 0 | 0 | 3 |
| **Total** | **1** | **16** | **7** | **17** |

## Lede before/after (only rewrites)

**`a/tianeptine-the-legal-opioid-hiding-in-gas-station-supplements.html`** — surfaced the opioid mechanism into the first sentence; the original buried it behind two regulatory sentences.

- *Before:* "Tianeptine is a prescription antidepressant in parts of Europe, Asia, and Latin America. In the US it has never been approved as a medication but is not a controlled substance, creating a regulatory loophole. Products marketed as 'nootropics,' 'mood enhancers,' or 'research chemicals' — with brand names like Za Za and Tianaa — have been implicated in a growing number of hospitalisations and deaths."
- *After:* "Tianeptine is sold in US gas stations as a 'nootropic' or 'mood enhancer' — but at the doses people actually take, it acts on the same mu-opioid receptors as oxycodone. It's a prescription antidepressant in parts of Europe, Asia, and Latin America; in the US it has never been approved as a medication and is not a federally controlled substance, creating a loophole that brands like Za Za and Tianaa have ridden to a growing toll of hospitalisations and deaths."

(Net delta ≈ +5 words, well under the ±50-word cap.)

## Escalation queue

No factual or safety concerns surfaced that require routing to `supplement-article-review` or `supplement-trending-review`. Specifically:

- No claim contradicted `data.js` for the affected supplements (no `data.js` reads were performed in the polish step; this is a "nothing-jumped-out" pass on already-internal content).
- No safety/contraindication mention struck me as missing for any of the eight pages — the long-COVID page is unusually thorough on what to skip; the tianeptine page already calls out withdrawal, ED presentations, and SAMHSA referral; the black-cohosh page already calls out hepatotoxicity and pregnancy/breast-cancer cautions.
- No tier or score mismatch between page text and the visible `ss-tier`/`ss-score` chips on the supplement pages.
- All cited PMIDs / DOIs on these pages look real and well-formed; no broken DOIs detected (no live-link checks performed — judgment based on syntax and recognisable identifiers).

If a downstream task wants nominal flags to spot-check anyway: `s/vinpocetine.html` carries a Tier-3 chip on a compound the FDA has explicitly ruled is *not* a legal supplement — that's a self-consistent stance (the page surfaces the regulatory call clearly), but a future authoritative review might confirm whether Tier-3-Trending is the correct classification for an FDA-disallowed substance versus a "Tier-?-Avoid"-style category.

## Notes

- Lede policy: I kept the lede on `a/black-cohosh-for-menopause-cautious-yes-cautious-no.html` and `compare/coq10-vs-pqq.html` because each already led with the most counterintuitive finding (regulator-mandated liver warnings, and "marketing implies parity, evidence does not"). A rewrite would have been cosmetic, not load-bearing.
- Hierarchy policy: where the in-article body skipped from `h1` directly to `h3` (the three articles in `a/`), I promoted in-article section headings to `h2` and left the `h3` in `Sources` and `SS-AUTOLINKS:start` blocks untouched (those are document-meta blocks, not in-article structure). Supplement, condition, and compare pages already had clean `h1` → `h2` → `h3` hierarchy.
- Cross-link policy: wrapped first body-text occurrence only, never wrapped headings, only used links to slugs that exist on disk. Skipped wraps where the slug was missing (e.g. `gabapentin`, `methylene-blue`, `resveratrol`, `ubiquinol`, `tianeptine`, `creatine`, `vincamine`, `b12`/`als`/`nmda`).
- Per-page change cap (12) was not hit on any page; smallest delta was 3 (`s/l-serine.html`), largest was 9 (`a/the-protein-supplement-guide-whey-vs-plant-vs-casein.html`).
- No `data.js`, `app.js`, `pairings-data.js`, `medications.json`, tier, score, dose-range, or PMID changes. No git commits. Light-mode-only respected (no theme CSS touched).
