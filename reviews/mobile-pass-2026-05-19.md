# Weekly Mobile Pass — 2026-05-19

Reference viewports: 375 px (iPhone SE) and 414 px (iPhone 14 Pro Max).
Site mobile breakpoint: `≤ 768 px` (verified via grep of `@media` rules in `styles.css` / `index.css`; most rules cluster at 600 px / 560 px / 500 px / 420 px).
Prior pass for delta comparison: `reviews/mobile-pass-2026-05-12.md` (one week ago).

## Pages sampled (27)

Live root pages (7): `index.html`, `discover.html`, `supplement.html`, `article.html`, `compare.html`, `condition.html`, `symptom.html`.

Random `s/` (5): `bifidobacterium-lactis.html`, `cordyceps-militaris.html`, `monolaurin.html`, `methylcobalamin.html`, `probiotics.html`.

Random `a/` (5): `how-to-build-a-basic-supplement-stack-for-beginners.html`, `vitex-agnus-castus-chasteberry-for-pms-and-pmdd-what-rcts-show.html`, `gotu-kola-centella-asiatica-for-venous-insufficiency-and-cognition.html`, `calcium-supplements-when-they-help-and-when-they-harm.html`, `calcium-and-cardiovascular-risk-the-2024-cochrane-update.html`.

Random `condition/` (5): `male-fertility.html`, `atrial-fibrillation-protocol.html`, `insomnia-protocol.html`, `depression-mild-moderate.html`, `endometriosis-protocol.html`.

Random `compare/` (5): `fish-oil-vs-algal-oil.html`, `ginger-vs-peppermint-for-nausea.html`, `saw-palmetto-vs-beta-sitosterol.html`, `coq10-vs-magnesium-for-migraine.html`, `selenium-vs-iodine-for-thyroid.html`.

## Auto-fixes applied

**0 auto-fixes applied.** Every `position: sticky` rule in `styles.css` / `index.css` carries an explicit `top:` (or is intentionally bottom-anchored: `.wiz-nav`, `.sel-bar`). No CSS files modified; no `.bak-20260519*` files written.

## Findings by sweep

### Sweep 1 — Touch-target audit (P0 + several P1/P2)

P0 — single remaining critical sub-32 px in nav
- **`.site-nav-tab` at `@media(max-width:420px)`** (`styles.css:1182`) now sets `min-height:24px;height:24px`. **Improvement vs. last week:** bumped from 20 px → 24 px since `2026-05-12`. Still below the WCAG 2.5.5 minimum of 24×24 CSS px applied as a hit box on the iPhone-SE width — note the visible target is now at the WCAG floor but Apple HIG (44 px) is still missed. The `::before` pseudo at `styles.css:838` extends the hit slot to ~48 px vertical, but the horizontal hit area is still bounded by the visual button. The 4 px bump narrows the gap from "obviously too small" to "matches WCAG minimum"; flagging stays P0 only because the site-nav is the most-tapped element on the page.

P1 — interactive < 32 px in mobile (unchanged vs. last week)
- `.site-nav-tabs .site-nav-tab` at `≤600 px` — 24 px tall (`styles.css:833`). Pseudo-element extends slot to 48 px; visual target still 24 px.
- `.site-nav-tabs .site-nav-tab.site-nav-tab-icon` at `≤600 px` — 24 × 24 (`styles.css:834`).
- `.cat-hero-cta` at `≤600 px` — `padding:6px 11px; font-size:10px` ≈ 24 px tall (`styles.css:2095`).
- `.cat-hero-arrow` — 24 × 24 (`styles.css:2093`).
- `.cond-chip` — `min-height:28px` (`styles.css:307`).
- `.drug-chip-remove` — `min-width:28px; min-height:28px` (`styles.css:350`).
- `.plan-close-btn` — 32 × 32 (`styles.css:1969`).
- `.b-cta` — `min-height:32px` (`styles.css:2728`).

P2 — 32–43 px (unchanged vs. last week)
- `.az-letter-btn` — mobile rule bumps to 36 × 36 with `!important` (`styles.css:1128`).
- `.hero-cta` at `≤600 px` — `padding:10px 14px; font-size:12px` ≈ 38 px tall (`styles.css:1242`).
- `.hero-arrow` at `≤600 px` — 36 × 36 (`styles.css:1242`).
- `.med-chip` — `min-height:36px` (`styles.css:256`).
- `.art-nav-btn`, `.art-modal-close`, `.art-share-btn` — 36 × 36 (`styles.css:1828–1834`); `.art-share-btn` becomes 36 × 36 square at `≤500 px` (`styles.css:1839` hides the label).
- `.reader-close-fab`, `.pg-close-fab` at `≤760 px` — 36 × 36 (`styles.css:2122, 2413`).
- `.rn-cta` — `min-height:38px` (`styles.css:2664`).
- `.age-stepper-btn` — 36 × 36 (`styles.css:238`).

All flagged for human / `weekly-ux-exploration` — touch-target fixes need layout judgement and were not auto-applied.

### Sweep 2 — Sticky-element regression check

11 `position: sticky` declarations across `styles.css` / `index.css`. All have an explicit `top:` value or are intentionally `bottom`-anchored:

| File:line | Selector | `top` | `bottom` | Status |
|---|---|---|---|---|
| styles.css:343 | dropdown header (drug-typeahead) | `0` | — | OK |
| styles.css:627 | `.beta-bar` | `0` | — | OK |
| styles.css:675 | `.az-letter-bar` | `90px` | — | OK |
| styles.css:683 | `.site-nav` | `32px` | — | OK |
| styles.css:1056 | `.sticky-bar`, `#main-sticky` (mobile) | `calc(70px + env(safe-area-inset-top))` | — | OK |
| styles.css:1538 | `.wiz-nav` | — | `0` | OK (intentional) |
| styles.css:1826 | `.art-modal-chrome` | `0` | — | OK |
| styles.css:1954 | `.sel-bar` | — | `0` | OK (intentional) |
| index.css:102 | `.rs-toolbar` | `84px` | — | OK |
| index.css:487 | `#main-sticky` | `90px` | — | OK |

`body{ overflow-x: clip }` (`styles.css:1161`) is still in place — the explicit comment notes the prior `overflow-x: hidden` sticky-break incident, current fix retained. **No missing-top regressions. No auto-fix applied.**

### Sweep 3 — Viewport meta tag

All 27 sampled pages contain `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`. The `viewport-fit=cover` token is a strict superset of the spec and is required for `env(safe-area-inset-*)` to resolve on iOS notch devices. **No flags.**

### Sweep 4 — iOS quirks

P2 — `-webkit-tap-highlight-color` (unchanged vs. last week)
- Not set anywhere in `styles.css`, `index.css`, or `_site-ux.js`. Default iOS gray tap flash will render on every interactive element. CSS-only fix is one global selector; **flagged** — left for human approval rather than auto-fix because it's a global stylistic change, not the sticky-`top` case the task file authorises.

iOS auto-zoom — still mitigated (no regression)
- `styles.css:795–807` forces every text-class `input` and `textarea` to `font-size: 16px !important` at `≤600 px`. Selects/checkboxes/radios excluded (intentional). Sub-16 px font rules elsewhere are all overridden by the global `!important` rule on mobile. **No action needed.**

### Sweep 5 — Image-CLS audit

22 `<img>` elements across the sampled pages, all on `index.html`. The 26 other sampled pages contain zero `<img>` tags.

**RESOLVED vs. last week.** Last week 10 of 22 `<img>` lacked `width`/`height` attributes (the `.lk` logo strip in `.ix-sources`). This week every `<img>` carries explicit `width="120"` and either `height="22"` (`.mk` markings in the trust strip) or `height="32"` (`.ix-sources` logos). CLS audit now passes; previous P2 is closed. No flags.

### Sweep 6 — Mobile-only orphan elements (unchanged set)

| File:line | Selector | Breakpoint | Risk |
|---|---|---|---|
| styles.css:634 | `.beta-bar-tag`, `.beta-bar-sep` | ≤560 | Decorative — OK |
| styles.css:814 | `.site-nav-brand` | ≤600 | Logo intentional |
| styles.css:831 | `.site-nav-tabs::-webkit-scrollbar` | ≤600 | Scroller chrome — OK |
| **styles.css:844** | **`#tab-discover`** | **≤600** | **Discover nav tab hidden — load-bearing**, per comment relocated to footer Browse column. Repeat flag from 2026-05-12. |
| styles.css:863 | `.site-nav-tabs .site-nav-tab.site-nav-tab-icon svg` | ≤600 | Icon swapped for "Profile" text — OK |
| styles.css:1044 | `#ix-sticky-bar` | ≤600 | Sticky search bar replaced by nav search pill — intentional |
| styles.css:1046 | `.ix-hero #ix-hero-form` | ≤600 | Hero duplicate search hidden — intentional |
| styles.css:1467 | `.pf-divider` | ≤600 | Decorative — OK |
| styles.css:1635 | `.bw-list-mini` | ≤560 | Content collapse — OK |
| styles.css:1839 | `.art-share-label` | ≤500 | Button text → icon-only — OK |
| **index.css:314** | **`.ix-sources`** | **≤600** | **Source-logos trust strip hidden on mobile.** Repeat flag from 2026-05-12. |
| styles.css:3062 | `.art-modal.v2-chrome .art-share-label` | ≤500 | Modal variant — OK |

Same two items worth a second look (`#tab-discover` and `.ix-sources`) — both have inline comments justifying the hide. Re-flagged for `weekly-ux-exploration`.

### Sweep 7 — Performance proxy (week-over-week)

Bytes shipped to a mobile user, compared to `reviews/mobile-pass-2026-05-12.md`:

| Asset | 2026-05-12 | 2026-05-19 | Δ bytes | Δ % | Status |
|---|---:|---:|---:|---:|---|
| `index.html` | 2,252,371 | 2,723,824 | +471,453 | **+20.9 %** | **FLAG (P0)** |
| `styles.css` | 243,926 | 247,104 | +3,178 | +1.3 % | OK |
| `index.css` | 41,960 | 43,527 | +1,567 | +3.7 % | OK |
| `_site-ux.js` | 32,577 | 43,201 | +10,624 | **+32.6 %** | **FLAG (P1)** |
| **First-paint bundle (HTML + head CSS + head JS)** | **2,570,834** | **3,057,656** | **+486,822** | **+18.9 %** | **FLAG (P0)** |
| `app.js` | 501,932 | 504,216 | +2,284 | +0.5 % | OK |
| `data.js` | 891,996 | 1,013,515 | +121,519 | **+13.6 %** | **FLAG (P1)** |
| `index.js` | 48,729 | 50,777 | +2,048 | +4.2 % | OK |
| `pairings-data.js` | 83,969 | 102,305 | +18,336 | **+21.8 %** | **FLAG (P1)** |
| `pdf-export.js` | 72,143 | 72,143 | 0 | 0 % | OK |
| `search-index.js` | 9,798 | 9,798 | 0 | 0 % | OK |
| `nav-search.js` | 7,555 | 7,555 | 0 | 0 % | OK |
| `supplement-modal.js` | 13,251 | 15,544 | +2,293 | **+17.3 %** | **FLAG (P2)** |
| `modal-stack.js` (new) | — | 4,974 | +4,974 | new | OK (small) |
| **Full doc local bundle** | **4,200,207** | **4,838,483** | **+638,276** | **+15.2 %** | **FLAG (P0)** |

Notes:
- `index.html` crossed 2.6 MB → 2.7 MB inlined; the 471 KB jump is the largest weekly delta yet recorded. Likely root cause is the article-registration + hub-generator + recommendation-coverage runs this week (cross-check `reviews/article-registration-2026-05-17.md`, `reviews/hub-generator-2026-05-17.md`, `reviews/recommendation-coverage-2026-05-18.md`). No cap is hit, but at ~5 Mbit/s the doc now parses in ~4.5–7 s pre-app-init.
- `data.js` crossed 1 MB for the first time (1,013,515 bytes / 989.8 KB) — net new supplements/articles registered this week.
- `_site-ux.js` grew 32 % — second-largest relative jump after the new `modal-stack.js`. Worth confirming the additions are intentional and not duplicated logic.
- `pairings-data.js` grew 22 % — consistent with `_pairings_buckets_20260518.json` / `_pairings_proposed_20260518.json` activity in the working tree.
- `modal-stack.js` is new this week and is loaded synchronously before `supplement-modal.js` in `index.html` — not in last week's bundle list. Small (4.9 KB).

External: Google Fonts CSS, pdf.js (CDN), jsPDF (CDN), Plausible analytics (CDN). No change.

## Top 5 issues for human / `weekly-ux-exploration`

1. **First-paint bundle +18.9 % WoW (3.06 MB).** `index.html` alone added 471 KB this week. Whatever this week's hub/article/recommendation registration runs added, it landed in the document rather than in a lazy-loaded chunk. Consider whether the article cards, pairing buckets, or recommendation hints that ship inline at first paint can move to a deferred fetch — this is the single highest-leverage mobile-LCP fix available right now.
2. **`data.js` crossed 1 MB.** 989.8 KB of supplements/articles now ships on every page that loads it (every live page). The blocking script tag in `index.html` doesn't use `defer`. Defer-loading or code-splitting `data.js` is the second-biggest perf lever; needs careful testing because `app.js` reads from `window.DATA` synchronously.
3. **`.site-nav-tab` is at 24 px at `≤420 px`** (`styles.css:1182`). Improved from 20 → 24 px this week — at the WCAG floor but still below the Apple HIG 44 px guideline. The `::before` extends the vertical hit slot, but a 24 px visible target on the primary nav is still the worst-confidence tap target on the site. Consider 32 px min-height.
4. **No `-webkit-tap-highlight-color` site-wide** — repeat flag. Every tap on mobile shows the default iOS gray flash. One-line global CSS fix; left for human approval because it changes feedback for every interactive element.
5. **`.ix-sources` still hidden on mobile** (`index.css:314`) and **`#tab-discover` still removed from the primary nav** (`styles.css:844`). Repeat from 2026-05-12. Worth pulling Plausible numbers before deciding either way; both are intentional but neither has been validated against the ~60 % mobile traffic share.

## Forbidden constraints honored

- No HTML structural changes.
- No JS edits.
- No `data.js` changes.
- No `prefers-color-scheme: dark` blocks introduced (light-mode-only respected per [[feedback_no_dark_mode]]).
- No git commits.
