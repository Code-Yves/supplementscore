# Weekly Mobile Pass — 2026-05-12

Reference viewports: 375 px (iPhone SE) and 414 px (iPhone 14 Pro Max).
Site mobile breakpoint: `≤ 768 px` (verified by grep; most rules cluster at 600 px / 560 px / 500 px / 420 px).

## Pages sampled (27)

Live root pages (7): `index.html`, `discover.html`, `supplement.html`, `article.html`, `compare.html`, `condition.html`, `symptom.html`.

Random `s/` (5): `squalene.html`, `betaine-tmg.html`, `red-yeast-rice.html`, `magnesium-l-threonate.html`, `palmitoylethanolamide.html`.

Random `a/` (5): `the-10-most-studied-supplements-on-earth.html`, `ginkgo-biloba-egb-761-why-the-dementia-evidence-hasn-rsquo-t-translated.html`, `l-reuteri-dsm-17938-for-infant-colic-the-strongest-probiotic-evidence-in-pediatr.html`, `hmb-for-muscle-after-50-why-older-adults-need-it-most.html`, `cdc-warning-kava-poisoning-calls-have-climbed-sharply-here-s-what-the-data-actua.html`.

Random `condition/` (5): `hangover-recovery.html`, `peripheral-neuropathy.html`, `raynauds-protocol.html`, `nafld-protocol.html`, `macular-degeneration.html`.

Random `compare/` (5): `serotonin-precursors.html`, `fish-oil-vs-algal-oil.html`, `inositol-vs-berberine-for-pcos.html`, `nac-vs-glutathione.html`, `zinc-picolinate-vs-zinc-citrate.html`.

## Auto-fixes applied

0 auto-fixes applied. Every `position: sticky` rule in `styles.css` / `index.css` either has an explicit `top:` value or is intentionally bottom-anchored (`.sel-bar`, `.wiz-nav` both `bottom:0`). No CSS files were modified; no `.bak-2026-05-12*` files were written.

## Findings by sweep

### Sweep 1 — Touch-target audit (P0 + several P1/P2)

P0 — single critical regression
- **`.site-nav-tab` at `@media(max-width:420px)`** (`styles.css:1180`) sets `height:20px; min-height:20px`. At iPhone-SE width these are 20 px tall — less than half of the 44 px guideline. The pseudo-element extension at `styles.css:838` (`top:-12px;bottom:-12px;` on `::before`) gives a 48 px _vertical_ hit slot, but the horizontal hit area is still bounded by the visual button. Mitigation in place is partial; full audit warranted.

P1 — interactive < 32 px in mobile
- `.site-nav-tabs .site-nav-tab` at `≤600 px` — 24 px tall (`styles.css:833`). Pseudo-element extends the touch slot to 48 px but the visual target is still 24 px.
- `.site-nav-tabs .site-nav-tab.site-nav-tab-icon` at `≤600 px` — 24 × 24 (`styles.css:834`).
- `.cat-hero-cta` at `≤600 px` — `padding:6px 11px; font-size:10px` ≈ 24 px tall (`styles.css:2083`).
- `.cat-hero-arrow` — 24 × 24 (`styles.css:2081`).
- `.cond-chip` / `.cond-group-more-btn` — `min-height:28px` (`styles.css:307–308`).
- `.drug-chip-remove` — `min-width:28px; min-height:28px` (`styles.css:350`).
- `.plan-close-btn` — 32 × 32 (`styles.css:1957`).
- `.b-cta` — `min-height:32px` (`styles.css:2702`).

P2 — between 32–43 px
- `.az-letter-btn` — mobile rule bumps to 36 × 36 with `!important` (`styles.css:1126`).
- `.hero-cta` at `≤600 px` — `padding:10px 14px; font-size:12px` ≈ 38 px tall (`styles.css:1240`).
- `.hero-arrow` at `≤600 px` — 36 × 36 (`styles.css:1240`).
- `.med-chip` — `min-height:36px` (`styles.css:256`).
- `.art-nav-btn`, `.art-modal-close`, `.art-share-btn` — 36 × 36 (`styles.css:1816, 1819, 1822`); `.art-share-btn` becomes 36 × 36 square at `≤500 px` (`styles.css:1827` hides the label).
- `.reader-close-fab`, `.pg-close-fab` at `≤760 px` — 36 × 36 (`styles.css:2110, 2387`).
- `.rn-cta` — `min-height:38px` (`styles.css:2638`).
- `.age-stepper-btn` — 36 × 36 (`styles.css:238`).

All flagged for human / `weekly-ux-exploration` review — touch-target fixes need layout judgement and were not auto-applied.

### Sweep 2 — Sticky-element regression check

12 `position: sticky` declarations across `styles.css` and `index.css`:

| File:line | Selector | `top` | `bottom` | Status |
|---|---|---|---|---|
| styles.css:343 | dropdown header | `0` | — | OK |
| styles.css:627 | `.beta-bar` | `0` | — | OK |
| styles.css:675 | `.az-letter-bar` | `90px` | — | OK |
| styles.css:683 | `.site-nav` | `32px` | — | OK |
| styles.css:1056 | `.sticky-bar`, `#main-sticky` (mobile) | `calc(70px + env(safe-area-inset-top))` | — | OK |
| styles.css:1531 | `.wiz-nav` | — | `0` | OK (intentional) |
| styles.css:1814 | `.art-modal-chrome` | `0` | — | OK |
| styles.css:1942 | `.sel-bar` | — | `0` | OK (intentional) |
| index.css:102 | toolbar | present | — | OK |
| index.css:487 | filter/sort | present | — | OK |

No missing-`top` regressions. **No auto-fix applied.**

Ancestor `overflow-x` is already mitigated: `body{ overflow-x: clip; }` at `styles.css:1159` (explicit comment notes the prior `overflow-x:hidden` sticky bug — current fix in place).

### Sweep 3 — Viewport meta tag

All 27 sampled pages contain a viewport tag with `width=device-width, initial-scale=1.0`. Every page uses the extended form `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`. The `viewport-fit=cover` token is a strict superset of the spec and is required for `env(safe-area-inset-*)` to resolve on iOS notch devices. **Not flagged as malformed.**

### Sweep 4 — iOS quirks

P2 — `-webkit-tap-highlight-color`
- Not set anywhere in `styles.css`, `index.css`, or `_site-ux.js`. Default iOS tap flash will render on every interactive element. Adding `-webkit-tap-highlight-color: transparent` to a global `a, button, [role="button"]` selector would suppress the default highlight; CSS-only and safe. **Flagged** (skipped from auto-fix because it's a global stylistic change rather than a sticky-`top` fix).

iOS auto-zoom — already mitigated
- `styles.css:795–807` forces every text-class `input` and `textarea` to `font-size: 16px !important` at `≤600 px`. Selects/checkboxes/radios excluded (intentional, they don't trigger zoom). **No action needed.** Individual rules with sub-16 px font-size (e.g. `.gate-input` 13 px, `.dl-prompt-input` 13.5 px, `.plan-email-input` 13 px, `.add-supp-input` 13 px, `.bw-review-input` 13 px, `.ea-input` 13 px, `.drug-typeahead-input` 13 px, `.abt-cta-email input` 11 px, `.bw-row input` 11 px, `#fb-modal input/textarea` 13 px, `.abt-m1-cta-row input` 13.5 px) are all overridden by the global `!important` rule on mobile.

### Sweep 5 — Image-CLS audit

22 `<img>` elements across the sampled pages, all on `index.html`. The 26 other sampled pages contain zero `<img>` tags.

10 of 22 `<img>` lack `width` / `height` attributes — every `.lk` logo in the `.ix-sources` strip:

```
<img src="source-logos/nih.svg"       alt="NIH" loading="lazy" decoding="async">
<img src="source-logos/cochrane.svg"  alt="Cochrane" loading="lazy" decoding="async">
<img src="source-logos/pubmed.svg"    alt="PubMed" loading="lazy" decoding="async">
<img src="source-logos/who.svg"       alt="WHO" loading="lazy" decoding="async">
<img src="source-logos/fda.svg"       alt="FDA" loading="lazy" decoding="async">
<img src="source-logos/harvard.svg"   alt="Harvard" loading="lazy" decoding="async">
<img src="source-logos/jhu.svg"       alt="Johns Hopkins" loading="lazy" decoding="async">
<img src="source-logos/lancet.svg"    alt="The Lancet" loading="lazy" decoding="async">
<img src="source-logos/nejm.svg"      alt="NEJM" loading="lazy" decoding="async">
<img src="source-logos/stanford.svg"  alt="Stanford" loading="lazy" decoding="async">
```

CLS impact on mobile is currently zero because `.ix-sources` is `display:none` at `≤600 px` (see Sweep 6). On tablet/desktop the `.lk` class enforces `width:140px;height:32px` (`styles.css:81`), so the SVGs render at fixed CSS-controlled dimensions even without HTML attrs. P2 — flag for follow-up to add explicit HTML `width="140" height="32"` for spec compliance and to remove any pre-CSS-paint reflow.

### Sweep 6 — Mobile-only orphan elements

Elements `display:none` only inside mobile media queries:

| File:line | Selector | Breakpoint | Risk |
|---|---|---|---|
| styles.css:634 | `.beta-bar-tag`, `.beta-bar-sep` | ≤560 | Decorative — OK |
| styles.css:813 | `.site-nav-brand` | ≤600 | Logo — intentional |
| styles.css:830 | `.site-nav-tabs::-webkit-scrollbar` | ≤600 | Scroller chrome — OK |
| **styles.css:844** | **`#tab-discover`** | **≤600** | **Discover nav tab hidden — load-bearing**, but per inline comment relocated to the footer's Browse column |
| styles.css:862 | `.site-nav-tabs .site-nav-tab.site-nav-tab-icon svg` | ≤600 | Icon swapped for "Profile" text — OK |
| styles.css:1043 | `#ix-sticky-bar` | ≤600 | Sticky search bar hidden on mobile (replaced by nav search pill) — intentional |
| styles.css:1044 | `.ix-hero #ix-hero-form` | ≤600 | Hero duplicate search hidden — intentional |
| styles.css:1460 | `.pf-divider` | ≤600 | Decorative — OK |
| styles.css:1628 | `.bw-list-mini` | ≤560 | Content collapse — OK |
| styles.css:1827 | `.art-share-label` | ≤500 | Button text → icon-only — OK |
| **index.css:314** | **`.ix-sources`** | **≤600** | **Source-logos trust strip hidden on mobile**, intentional per inline comment ("eats vertical space") — worth a UX check given ~60% of traffic is mobile |
| styles.css:3035 | `.art-modal.v2-chrome .art-share-label` | ≤500 | Modal variant of above — OK |

Two items worth a second look (`#tab-discover` and `.ix-sources`) — both have inline comments justifying the hide, both are flagged for `weekly-ux-exploration` rather than treated as bugs.

### Sweep 7 — Performance proxy

| Asset | Bytes | KB |
|---|---:|---:|
| `index.html` | 2,252,371 | 2199.6 |
| `styles.css` (head) | 243,926 | 238.2 |
| `index.css` (head) | 41,960 | 41.0 |
| `_site-ux.js` (head) | 32,577 | 31.8 |
| **First-paint bundle (HTML + head CSS + head JS)** | **2,570,834** | **2510.6** |
| `app.js` (doc) | 501,932 | 490.2 |
| `data.js` (doc) | 891,996 | 871.1 |
| `index.js` (doc) | 48,729 | 47.6 |
| `pairings-data.js` (doc) | 83,969 | 82.0 |
| `pdf-export.js` (doc) | 72,143 | 70.5 |
| `search-index.js` (doc) | 9,798 | 9.6 |
| `nav-search.js` (doc) | 7,555 | 7.4 |
| `supplement-modal.js` (doc) | 13,251 | 12.9 |
| **Full doc local bundle** | **4,200,207** | **4101.8 (≈ 4.1 MB)** |

External: Google Fonts CSS, pdf.js (CDN), jsPDF (CDN), Plausible analytics (CDN).

No prior `mobile-pass-*.md` in `reviews/` — this is the first run, so no week-over-week delta. Baseline established. Future runs should diff `index.html`, `app.js`, `data.js`, `styles.css`, `index.css` against this row.

**Observation (not flagged):** `index.html` is 2.2 MB inlined and `data.js` is 871 KB. On a 4G mobile link (~5 Mbit/s real-world) the doc parses in ~3–5 s pre-app-init. This is well-known and outside this audit's scope, but documenting it so the trend can be tracked across passes.

## Top 5 issues for human / `weekly-ux-exploration`

1. **`.site-nav-tab` height: 20 px at `≤420 px`** (`styles.css:1180`) — well below WCAG 2.5.5 (24 px) and Apple HIG (44 px). The `::before` pseudo extends the vertical hit area to ~48 px but visual confidence is poor. Bump min-height to 32 px or restore icon glyphs alongside the text label.
2. **No `-webkit-tap-highlight-color` site-wide** — every tap shows the default iOS gray flash. One-line CSS fix on a global `a, button, [role=button], summary` selector; intentionally left for human approval since it changes the touch feedback for every interactive element on the site.
3. **`.ix-sources` hidden on mobile** (`index.css:314`) — the trust-building "as cited by NIH/FDA/Cochrane/…" logo strip is the cheapest credibility signal we have, and 60%+ of traffic never sees it. Consider a condensed two-row strip at ≤600 px instead of full hide.
4. **`#tab-discover` removed from primary nav on mobile** (`styles.css:844`) — relocated to the footer Browse column per comment. Footers under-perform vs. nav by 5–10× on click-through. Worth checking Plausible to confirm Discover engagement on mobile hasn't dropped vs. desktop.
5. **`.cat-hero-cta` at 24 px tall** (`styles.css:2083`) — the primary CTA inside the category-hero carousel is sub-WCAG on mobile. Easy fix: increase `padding` to `8px 14px` and keep `font-size:11px` — adds ~10 px to the touch slot without breaking the 104 px hero height.

## Forbidden constraints honored

- No HTML structural changes.
- No JS edits.
- No `data.js` changes.
- No `prefers-color-scheme: dark` blocks introduced (light-mode-only respected).
- No git commits.
