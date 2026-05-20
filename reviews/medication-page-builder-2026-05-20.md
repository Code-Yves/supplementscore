# Weekly Medication Page Builder — 2026-05-20 Run Summary

**Scheduled task:** `weekly-medication-page-builder`
**Working directory:** `/Users/yves/Desktop/AI/Supplement Score`
**Run mode:** autonomous (scheduled, user not present)

## Selection rationale

The five medications selected this week were chosen using the priority order in the task spec:

1. **Most-recent `last_reviewed` in `data/meds-detail.json`.** Five entries share the latest review date (`2026-05-18`): hydrochlorothiazide, furosemide, bupropion, fluoxetine, prednisone.
2. **Not yet present in `supplementscore-repo/m/`.** Confirmed — existing `m/` pages are only amlodipine, gabapentin, semaglutide, sertraline, tramadol. All five 2026-05-18-reviewed entries are greenfield.
3. **From the top-50 US Rx list.** All five are routinely in the top-25 most-prescribed US drugs by claim volume (HCTZ, furosemide, prednisone) or top-40 by prescription volume (fluoxetine, bupropion).

The five lined up exactly — no backups needed.

## Pages generated

| Slug | File | Words | AVOID | CAUTION | MONITOR | SAFE | PMID-cites |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| hydrochlorothiazide | `m/hydrochlorothiazide.html` | ~1,320 | 1 | 6 | 2 | 3 | 12 |
| furosemide | `m/furosemide.html` | ~1,375 | 1 | 5 | 2 | 7 | 10 |
| bupropion | `m/bupropion.html` | ~1,255 | 5 | 9 | 0 | 3 | 11 |
| fluoxetine | `m/fluoxetine.html` | ~1,295 | 8 | 7 | 2 | 2 | 16 |
| prednisone | `m/prednisone.html` | ~1,410 | 3 | 9 | 1 | 7 | 11 |

All within the 800–1500 word target. All citation totals comfortably exceed the ≥6 PMID acceptance threshold.

## Sitemap update

`sitemap-medications.xml` updated:
- Backup saved at `sitemap-medications.xml.bak-20260520-buildermed`
- `m/index.html` `lastmod` bumped to 2026-05-20
- 5 new `<url>` entries appended for the new pages

`sitemap-index.xml` already references `sitemap-medications.xml` — no changes needed.

## Bucket-structure notes / decisions

- **bupropion has 0 MONITOR entries.** The underlying `meds-detail.json` data for bupropion has no items tagged `MONITOR` (all overrides are AVOID, CAUTION, or NONE). I left MONITOR off the page rather than forcing a hollow section. This is honest to the data; the acceptance criterion ("substantive evidence for at least 2 buckets") is met with AVOID, CAUTION, and SAFE all populated.
- **Some supplements lack dedicated `s/{slug}.html` pages** — specifically: high-dose licorice (DGL exists but isn't the right link), 5-HTP (existing pages map this to `tryptophan.html` — I followed the convention used in `m/sertraline.html`), hibiscus, kava, bitter orange, grapefruit, horsetail. For these I rendered the supplement name as a non-linked `<span class="np">` styled identically to the linked cards (extended the existing `.sup-list` selector to include `span.np`). This keeps the visual grid intact without producing 404s.
- **No filled-card callouts.** Followed the prior feedback memo — bucket cards use the existing left-bar / pill treatment; no separate "act now" filled blocks beyond the standard "What to do" prose section.
- **Light mode forced** via the existing `<script>document.documentElement.setAttribute('data-theme','light');</script>` + `color-scheme:light` block, matching the rest of the medication pages.

## Cross-linking

Each page's "Related on SupplementScore" panel cross-links to:
- The class-level SPA route (`medication.html?slug={class}`) for broader comparison
- The opposite-class diuretic (HCTZ ↔ furosemide) where mechanistically informative
- Other m/ pages already published (e.g., bupropion links to sertraline & fluoxetine)
- 2–3 of the highest-leverage supplement pages mentioned in the buckets

Supplement-page back-reference updates are deliberately NOT made here — per task spec, the Thursday `weekly-supplement-page-polish` job picks those up via the data drift detector.

## Forbidden actions confirmed not taken

- No edits to `data/medications.json` or `data/meds-detail.json` (read only).
- No invented PMIDs — all PMIDs in pages match those present in `meds-detail.json` overrides plus the small set of canonical citations already used on `m/amlodipine.html` and `m/sertraline.html` (e.g., 11963641 grapefruit, 25933483 CoQ10, 34182907 polyphenol CYP inhibition, 36285406 glycyrrhizin, 40530753 diuretic electrolytes, 37845798 ACR GIOP, 38025741 SJW, 33498694 omega-3, 23212058 L-methylfolate, 24259638 herbal seizure, 14982105 SJW antidepressants, 17934195 serotonin syndrome, 36299970 SSRI supplement combos, 37846572 HCTZ Ca/D, 37884467 furosemide thiamine, 30574464 diuretic thiamine).
- No git commits.

## Acceptance criteria status

- [x] 5 pages generated
- [x] Sitemap updated
- [x] Each page has ≥6 cited PMIDs (range: 10–16)
- [x] Light-mode only
- [x] Run log appended
- [x] Per-run report written (this file)

## Open follow-ups (for downstream tasks)

- **OG image generation** — each new page declares `https://supplementscore.org/og/medications/{slug}.png`. The OG-converter scheduled task should pick these up on its next run.
- **Cross-link drift** — supplement pages referenced in the AVOID/CAUTION buckets (e.g., `s/echinacea-purpurea.html`, `s/dandelion-root.html`, `s/yohimbine-hcl.html`, `s/lavender-oil-oral.html`) should grow back-references to the new med pages. Defer to `weekly-supplement-page-polish` as designed.
- **Hub link audit** — `m/index.html` may need to surface the 5 new pages in any "recently added" or category listings. Out of scope for this task.
