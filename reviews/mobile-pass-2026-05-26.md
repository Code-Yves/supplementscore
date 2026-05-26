# Weekly Mobile Pass — 2026-05-26

Reference viewports: 375 px (iPhone SE) and 414 px (iPhone 14 Pro Max).
Site mobile breakpoint: `≤ 768 px` (verified via grep of `@media` rules in `styles.css` / `index.css`; the actual rule corpus clusters at 600 px, 560 px, 500 px, 480 px, 420 px).
Prior pass for delta comparison: `reviews/mobile-pass-2026-05-19.md` (one week ago).

## Pages sampled (27)

Live root pages (7): `index.html`, `discover.html`, `supplement.html`, `article.html`, `compare.html`, `condition.html`, `symptom.html`.

Random `s/` (5): `ttfd-allithiamine.html`, `sea-buckthorn-oil.html`, `l-cysteine.html`, `galacto-oligosaccharides.html`, `saccharomyces-boulardii-cncm-i-745.html`. (Note: all `/s/` pages are 15-line redirect tombstones as of 2026-05-25 — they each carry the correct viewport meta but are otherwise inert.)

Random `a/` (5): `sodium-bicarbonate-the-cheapest-legal-ergogenic-in-sport.html`, `supplement-anticonvulsant-interactions-what-neurologists-watch-for.html`, `magnesium-and-glycemic-control-what-the-2025-meta-analysis-actually-found.html`, `melatonin-dosing-why-0-1-mg-often-outperforms-10-mg-for-sleep.html`, `cellular-hydration-supplements-the-marketing-claim-with-no-biological-basis.html`.

Random `condition/` (5): `vertigo-bppv.html`, `cluster-headache-protocol.html`, `hypothyroidism-stack.html`, `histamine-intolerance.html`, `restless-legs-syndrome.html`.

Random `compare/` (5): `pomegranate-vs-beetroot-for-blood-pressure.html`, `epa-vs-dha.html`, `dhea-vs-pregnenolone.html`, `glycine-vs-l-theanine.html`, `milk-thistle-vs-tudca-for-liver.html`.

## Auto-fixes applied

**0 auto-fixes applied.** All 11 `position: sticky` declarations across `styles.css` / `index.css` carry an explicit `top:` value or are intentionally `bottom`-anchored. No CSS files modified; no `.bak-20260526*` files written.

## Findings by sweep

### Sweep 1 — Touch-target audit (P0 + several P1/P2)

Line numbers shifted by ~150–200 lines vs. last week (styles.css grew ~44 KB / +17.8 % — see Sweep 7). All findings re-anchored to their current location.

P0 — single remaining critical sub-32 px in the primary nav (unchanged WoW)
- **`.site-nav-tab` at `@media(max-width:420px)`** (`styles.css:1354`) — `min-height:24px; height:24px`. Identical to last week. The `::before` pseudo at `styles.css:989` extends the vertical hit slot to ~48 px, but the visible target is still at the WCAG 2.5.5 floor of 24 CSS px and below the Apple HIG 44 px guideline. Flagged P0 because the site-nav is the most-tapped element on the page.

P1 — interactive < 32 px in mobile (unchanged set vs. last week — line numbers re-anchored)
- `.site-nav-tabs .site-nav-tab` at `≤600 px` — 24 px tall (`styles.css:984`).
- `.site-nav-tabs .site-nav-tab.site-nav-tab-icon` at `≤600 px` — 24 × 24 (`styles.css:985`).
- `.cat-hero-cta` at `≤600 px` — `padding:6px 11px; font-size:10px` ≈ 24 px tall (`styles.css:2289`).
- `.cat-hero-arrow` — 24 × 24 (`styles.css:2287`).
- `.cond-chip` — `min-height:28px` (`styles.css:391`).
- `.drug-chip-remove` — `min-width:28px; min-height:28px` (`styles.css:434`).
- `.plan-close-btn` — 32 × 32 (`styles.css:2163`).
- `.b-cta` — `min-height:32px` (`styles.css:3107`).

P1 — new sub-32 px targets surfaced by a more permissive scanner this week
- `.dl-prompt-x` — 30 × 30 download-prompt close X (`styles.css:1744`). Visible only when the embed/download prompt is open; modal-overlay tap-to-dismiss also works, so finger-fit is recoverable.
- `.src-modal-close` — 28 × 28 source-modal close (`index.css:592`).
- `.smb` ("show more body") — 30 px tall (`styles.css:138`); spans the full row width so the horizontal hit area is generous.
- `.rn-undo-btn` — ~19 px tall undo button inside an ephemeral toast (`styles.css:3115`). Toast auto-dismisses, so missed taps simply expire the action — lowest urgency in this group.

These were on previous passes too but lived below the automated scanner's threshold; logging them now so they're tracked rather than re-rediscovered each week.

P2 — 32–43 px (unchanged set vs. last week — line numbers re-anchored)
- `.az-letter-btn` — mobile rule bumps to 36 × 36 with `!important` (`styles.css:1296`).
- `.hero-cta` at `≤600 px` — `padding:10px 14px; font-size:11px` ≈ 38 px tall (`styles.css:1420`).
- `.hero-arrow` at `≤600 px` — 36 × 36 (`styles.css:1420`).
- `.med-chip` — `min-height:36px` (`styles.css:340`).
- `.art-nav-btn`, `.art-modal-close`, `.art-share-btn` — 36 × 36 (`styles.css:2022–2031`); `.art-share-btn` becomes 36 × 36 square at `≤500 px` (`styles.css:2033`).
- `.reader-close-fab`, `.pg-close-fab` at `≤760 px` — 36 × 36 (`styles.css:2316`, `styles.css:2700`).
- `.rn-cta` — `min-height:38px` (`styles.css:3043`).
- `.age-stepper-btn` — 36 × 36 (`styles.css:322`).

All flagged for human / `weekly-ux-exploration` — touch-target fixes need layout judgement and were not auto-applied.

### Sweep 2 — Sticky-element regression check

11 `position: sticky` declarations across `styles.css` / `index.css`. All have an explicit `top:` value or are intentionally `bottom`-anchored:

| File:line | Selector | `top` | `bottom` | Status |
|---|---|---|---|---|
| styles.css:427 | dropdown header (drug-typeahead) | `0` | — | OK |
| styles.css:815 | `.az-letter-bar` | `90px` | — | OK |
| styles.css:826 | `.site-nav` | `0` | — | OK |
| styles.css:1220 | `.sticky-bar`, `#main-sticky` (mobile) | `calc(70px + env(safe-area-inset-top))` | — | OK |
| styles.css:1732 | `.wiz-nav` | — | `0` | OK (intentional) |
| styles.css:2020 | `.art-modal-chrome` | `0` | — | OK |
| styles.css:2148 | `.sel-bar` | — | `0` | OK (intentional) |
| index.css:123 | `.rs-toolbar` | `0` | — | OK |
| index.css:550 | `#main-sticky` | `90px` | — | OK |
| index.css:1070 | `#main-sticky.sticky-bar` | `0` | — | OK |
| index.css:1284 | mobile main-sticky (≤600px) | `22px` | — | OK |

`body { overflow-x: clip }` (`styles.css:1333`) is still in place — the explicit comment at `styles.css:1323` notes the prior `overflow-x: hidden` sticky-break incident and the current `clip` fix retained. The `_site-ux.js`-injected `.ssa-chrome` sticky string at `_site-ux.js:177` also carries `top:0`. **No missing-top regressions. No auto-fix applied.**

### Sweep 3 — Viewport meta tag

26 of the 27 sampled pages contain the canonical `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (most with `, viewport-fit=cover` appended).

One exception:

- **`discover.html`** — no viewport meta. Inspection shows the page is now an intentional redirect tombstone (`<meta http-equiv="refresh" content="0; url=/">` plus `location.replace('/')`). The Discover tab was retired and redirects to home. Tombstone files don't *need* viewport meta because the browser doesn't render them, but for consistency with the `/s/` tombstone pattern shipped 2026-05-25 (which *do* carry viewport), this is a P2 inconsistency — flagged for housekeeping.

A separate sweep across the entire repo (`1,440` HTML files scanned) found 9 files without viewport meta. Six of these are intentional redirect tombstones (`discover.html`, `funder-policy.html`, `changed-our-mind.html`, `methodology.html`, `sources.html`, plus two Google Search Console verification files and `_iframe-test.html`). All are noindex / redirect / internal. **No production-critical viewport regressions.**

### Sweep 4 — iOS quirks

P2 — `-webkit-tap-highlight-color` (unchanged vs. last week)
- Not set anywhere in `styles.css`, `index.css`, or `_site-ux.js`. Default iOS gray tap flash will render on every interactive element. CSS-only fix is one global selector. **Flagged** — left for human approval rather than auto-fix because it's a global stylistic change, not the sticky-`top` case the task file authorises.

iOS auto-zoom — still mitigated (no regression)
- `styles.css:946–957` forces every text-class `input` and `textarea` to `font-size:16px !important` at `≤600 px`. (Line moved from 795 → 946 this week as styles.css grew.) Selects/checkboxes/radios excluded (intentional). Cross-checked all rules in mobile media queries: no sub-16 px input font-size rule slips through the global `!important`. The `.site-nav-search-pill input` at `styles.css:913` independently locks `font-size:16px` for the nav-pill input. **No action needed.**

### Sweep 5 — Image-CLS audit

22 `<img>` elements across the 27 sampled pages, all on `index.html`. The other 26 sampled pages contain zero `<img>` tags.

**No regression.** All 22 `<img>` carry explicit `width` and `height` attributes (logo strip `.mk` and `.ix-sources` `.lk` images). CLS audit passes. No flags.

### Sweep 6 — Mobile-only orphan elements

19 `display: none` rules within mobile media queries (up from 12 last week). The increase reflects new mobile-only collapse rules on the reality-check / `.rc-*` recommendation hub, plus the `tab-supplements` belt-and-suspenders rule shipped 2026-05-21.

| File:line | Selector | Breakpoint | Risk |
|---|---|---|---|
| styles.css:766 | `body.hero-search-gone .beta-bar-search` | ≤600 | State-conditional — OK |
| styles.css:774 | `.beta-bar-tag`, `.beta-bar-sep` | ≤560 | Decorative — OK |
| styles.css:964 | `.site-nav-brand` | ≤600 | Logo intentional |
| styles.css:981 | `.site-nav-tabs::-webkit-scrollbar` | ≤600 | Scroller chrome — OK |
| **styles.css:995** | **`.site-nav-tabs #tab-discover`** | **≤600** | **Discover nav tab hidden — load-bearing**, per inline comment relocated to footer Browse column. Repeat flag from 2026-05-12 and 2026-05-19. |
| styles.css:1013 | `.site-nav-tabs .site-nav-tab.site-nav-tab-icon svg` | ≤600 | Icon swapped for "Profile" text — OK |
| styles.css:1175 | `.beta-bar-pulse` | ≤600 | Dot dropped from compressed mobile banner — OK |
| styles.css:1206 | `#ix-sticky-bar` | ≤600 | Sticky search bar replaced by nav search pill — intentional |
| styles.css:1208 | `.ix-hero #ix-hero-form` | ≤600 | Hero duplicate search hidden — intentional |
| styles.css:1265 | non-`tab-supplements` body sticky-bars | ≤600 | Belt-and-suspenders against tab-transition flash — OK |
| styles.css:1661 | `.pf-divider` | ≤600 | Decorative — OK |
| styles.css:1829 | `.bw-list-mini` | ≤560 | Content collapse — OK |
| styles.css:2033 | `.art-share-label` | ≤500 | Button text → icon-only — OK |
| **styles.css:4072** | **`.rc-supp-row-tier`** | **≤600** | **NEW this week.** Reality-Check supplement-row tier badge hidden on mobile. Inline comment indicates this is a density tradeoff; flag for `weekly-ux-exploration` to confirm the tier info is still surfaced elsewhere in the mobile row. |
| **styles.css:4108** | **`.rc-toc-m`** | **≤600** | **NEW this week.** Mobile-only TOC variant hidden — suggests two TOC variants exist and we're falling back to the desktop one on mobile; worth double-checking against an actual `/rc/` page to confirm a TOC is rendering. |
| styles.css:3495 | `.art-modal.v2-chrome .art-share-label` | ≤500 | Modal variant — OK |
| **index.css:374** | **`.ix-sources`** | **≤600** | **Source-logos trust strip hidden on mobile.** Repeat flag from 2026-05-12 and 2026-05-19. |
| index.css:1396 | `#main-sticky .sticky-bar-search` | ≤600 | Intentional — search lives in nav-pill on mobile |

Three items worth re-examination: `#tab-discover` and `.ix-sources` are repeat flags from prior weeks; `.rc-supp-row-tier` and `.rc-toc-m` are new and should be cross-checked against a live `/rc/` rendering to confirm nothing critical drops out on mobile.

### Sweep 7 — Performance proxy (week-over-week)

Bytes shipped to a mobile user, compared to `reviews/mobile-pass-2026-05-19.md`:

| Asset | 2026-05-19 | 2026-05-26 | Δ bytes | Δ % | Status |
|---|---:|---:|---:|---:|---|
| `index.html` | 2,723,824 | 2,747,510 | +23,686 | +0.9 % | OK (stabilized after last week's +20.9 %) |
| `styles.css` | 247,104 | 291,140 | +44,036 | **+17.8 %** | **FLAG (P0)** |
| `index.css` | 43,527 | 69,844 | +26,317 | **+60.5 %** | **FLAG (P0)** |
| `_site-ux.js` | 43,201 | 41,049 | −2,152 | −5.0 % | OK (small reduction) |
| **First-paint bundle (HTML + head CSS + head JS)** | **3,057,656** | **3,149,543** | **+91,887** | **+3.0 %** | **OK** (under 5 % WoW threshold) |
| `app.js` | 504,216 | 518,374 | +14,158 | +2.8 % | OK |
| `data.js` | 1,013,515 | 1,059,266 | +45,751 | +4.5 % | OK (under threshold, but second week >1 MB) |
| `index.js` | 50,777 | 55,617 | +4,840 | **+9.5 %** | **FLAG (P1)** |
| `pairings-data.js` | 102,305 | 120,672 | +18,367 | **+18.0 %** | **FLAG (P0)** |
| `pdf-export.js` | 72,143 | 72,143 | 0 | 0 % | OK |
| `search-index.js` | 9,798 | 9,798 | 0 | 0 % | OK |
| `nav-search.js` | 7,555 | 7,555 | 0 | 0 % | OK |
| `supplement-modal.js` | 15,544 | 18,183 | +2,639 | **+17.0 %** | **FLAG (P0)** |
| `modal-stack.js` | 4,974 | 4,974 | 0 | 0 % | OK |
| **Full doc local bundle** | **4,838,483** | **5,016,125** | **+177,642** | **+3.7 %** | **OK** (per-bundle, but several individual files crossed the 5 % flag line) |

Notes:
- **CSS is the headline change this week.** `styles.css` +44 KB / +17.8 %, `index.css` +26 KB / +60.5 %. Cross-referenced against the working-tree memory: this aligns with **the wrapper-typography unification on 2026-05-25** (132 condition pages restyled, `.ar/.ca/.sk/.sx-wrap` rules added; see `[[project_wrapper_typography_unify]]`) and the **modal-iframe Share/X chrome dedup shipped 2026-05-25** (two-surface CSS+JS guard; see `[[project_modal_chrome_dedup]]`). The growth is intentional but worth budgeting — first-paint bundle still only +3 % thanks to index.html staying flat, but the CSS files are not lazy-loaded, so every page pays this cost.
- **`pairings-data.js` grew +18 %** for the second week in a row (+22 % last week, +18 % this week). Memory note `[[project_top100_audit_2026_05_25.md]]` indicates the Top-100 audit on 2026-05-25 added 566 article-supplement edges; pairings data has likely absorbed some of that. Worth confirming this file is actually needed at first paint or whether it can defer.
- **`supplement-modal.js` +17 %.** Matches the modal-iframe chrome dedup work — chrome-suppression logic was added.
- **`index.html` essentially flat (+0.9 %)** — last week's +20.9 % jump did not repeat, so the article/hub/recommendation registration loads from 2026-05-17/18 appear to have been a one-off rather than an ongoing trend. Good signal.
- **`data.js` +4.5 %** — under the 5 % WoW flag line but second consecutive week above 1 MB. The Top-100 audit added 566 edges + ~85 removals net 2026-05-25, which is the likely driver.
- **`_site-ux.js` shrank 5 %** — first week-over-week reduction in months. Worth checking the change-log to learn what was removed (likely the dedup work consolidated some inline logic).
- First-paint bundle finally landed under the 5 % WoW threshold despite individual CSS file flags, because `index.html` stabilized.

External: Google Fonts CSS, pdf.js (CDN), jsPDF (CDN), Plausible analytics (CDN). No change.

## Top 5 issues for human / `weekly-ux-exploration`

1. **CSS bundle inflation (`styles.css` +17.8 %, `index.css` +60.5 % WoW).** The wrapper-typography unification on 2026-05-25 and the modal-chrome dedup added ~70 KB of CSS in a single week. CSS is not lazy-loaded, so every page pays this cost. Two specific levers: (a) the 132 condition pages now share the `.ar/.ca/.sk/.sx-wrap` typography — confirm there's no leftover per-page CSS that's now dead and can be removed; (b) the modal-iframe chrome guard exists in both CSS and JS — confirm one can be retired once the other ships cleanly.
2. **`pairings-data.js` +18 % for the second consecutive week (now 120.7 KB).** It's loaded on every page that uses pairings. Top-100 audit added 566 edges this week. The growth trajectory is steeper than the supplement count justifies; worth checking whether the file is now carrying redundant or unfiltered edges (e.g. low-confidence pairings that could be tier-gated out of first paint).
3. **Two new `.rc-*` orphans on mobile** (`.rc-supp-row-tier`, `.rc-toc-m`). The new Reality-Check hub adds mobile-only collapses on the supplement-row tier badge and the mobile TOC variant. Both have inline justifications, but neither has been visually verified against a live `/rc/` rendering. UX-exploration should screenshot a `/rc/` page at 375 px to confirm.
4. **`.site-nav-tab` is still 24 px at `≤420 px`** (`styles.css:1354`). No change WoW. Repeat flag from 2026-05-12 and 2026-05-19. The `::before` pseudo extends the slot to 48 px, but the visible target is at the WCAG floor and below Apple HIG. Bumping to 32 px would close most of the gap with negligible layout impact.
5. **No `-webkit-tap-highlight-color` site-wide.** Repeat flag. Every tap on mobile shows the default iOS gray flash. One-line global CSS fix; left for human approval because it changes feedback for every interactive element on the site.

Carry-over from last week now closed or downgraded:
- `index.html` +20.9 % WoW (last week) — now +0.9 %, stabilized. Closed.
- `_site-ux.js` +32.6 % WoW (last week) — now −5 %, reversed. Closed.
- Image-CLS attribute gaps — resolved two weeks ago, still passing.

## Forbidden constraints honored

- No HTML structural changes.
- No JS edits.
- No `data.js` changes.
- No `prefers-color-scheme: dark` blocks introduced (light-mode-only respected per [[feedback_no_dark_mode]] / [[feedback_mockups_light_mode]]).
- No git commits.
