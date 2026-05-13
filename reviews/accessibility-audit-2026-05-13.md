# Accessibility audit — 2026-05-13 (ISO week 20)

Scope: weekly automated WCAG 2.1 AA spot-check + safe auto-fixes.
Site is **light-mode only** (per project policy, dark mode permanently removed 2026-04-29). No dark-mode CSS recommended or applied.

## Sample

Seed: ISO week **20** (deterministic `random.seed(20)`).

Always-pages:

- `index.html`
- `discover.html`
- `search.html`
- `compare/citrulline-vs-arginine.html` (seeded pick)
- `condition/hangover-recovery.html` (seeded pick)
- `for/pregnancy.html` (seeded pick)
- `accessibility.html`
- `bibliography.html`

Rotation (5 random `s/*.html` + 5 random `a/*.html`, week-20 seed):

- `s/d-chiro-inositol.html`
- `s/korean-red-ginseng.html`
- `s/caralluma-fimbriata.html`
- `s/milk-thistle.html`
- `s/eaas.html`
- `a/aged-garlic-extract-the-kyolic-evidence-for-cardiovascular-risk.html`
- `a/olive-leaf-extract-and-blood-pressure-the-oleuropein-trials-and-the-captopril-head-to-head.html`
- `a/nmn-at-100-month-what-are-you-actually-buying.html`
- `a/bilberry-extract-what-the-eye-health-evidence-actually-shows.html`
- `a/calcium-carbonate-vs-citrate-which-form-to-pick-and-when.html`

Recently-modified structural pages (representative sub-sample; `git log` shows nearly every HTML file touched in the last 7 days via a bulk styles/template update, so exhaustive inclusion was impossible under the 40-file cap — the structural templates below cover the shared markup that the bulk update propagated):

- `supplement.html`
- `article.html`
- `methodology.html`
- `about.html`
- `terms.html`
- `privacy.html`

**Total: 24 pages.**

## Headline

- **Auto-fixes applied: 0** — every Phase B whitelist category came back empty on this sample; the codebase is already in good shape for the safe-to-fix patterns.
- **0 files modified** (no `.bak-*` backups created).
- **No fix-cap reached** (cap 30 fixes / 40 files).

## Phase A — Findings

### Color contrast (CSS-token-level)

Computed against the production light-mode palette in `styles.css`:

| Pair | Ratio | Verdict |
|---|---|---|
| `--color-text-primary` `#0c0a09` on `--color-background-primary` `#f6f2ea` | 17.69:1 | OK |
| `--color-text-primary` on `--color-background-secondary` `#ebe5d9` | 15.75:1 | OK |
| `--color-text-secondary` `#57534e` on bg-primary | 6.83:1 | OK |
| `--color-text-secondary` on bg-secondary | 6.08:1 | OK |
| **`--color-text-tertiary` `#a8a29e` on bg-primary** | **2.26:1** | **FAIL** body, FAIL large |
| **`--color-text-tertiary` on bg-secondary** | **2.01:1** | **FAIL** body, FAIL large |
| `--color-brand` `#1F7A6B` on bg-primary | 4.64:1 | OK body |
| `--color-brand` on bg-secondary | 4.13:1 | LARGE only (PASS for ≥18pt/14pt-bold) |
| `--color-brand-hover` `#176258` on bg-primary | 6.43:1 | OK |
| **`--color-brand-soft` `#7CC4B6` on bg-primary** | **1.80:1** | **FAIL** (used as accent / fill — verify no text use) |
| `#fff` on `--color-brand` | 5.18:1 | OK |
| `#fff` on `--color-brand-hover` | 7.18:1 | OK |
| `--color-warn-text` `#6B4716` on `--color-warn-bg` `#FBF1DE` | 7.38:1 | OK |
| **`--color-accent-coral` `#E8967A` on bg-primary** | **2.07:1** | **FAIL** if used as text (accent only — verify) |
| `--color-border-primary` `#78716c` as text on bg-primary | 4.30:1 | LARGE only |

Findings table (per-page) — full audit JSON in `outputs/a11y/findings.json` (working dir).

| Page | Severity | Rule | Element / Locator | Recommendation |
|---|---|---|---|---|
| `index.html` (line 1147) | P2 | `input-only-placeholder-label` | `<input id="drug-typeahead-input" type="text">` | Add `<label for>` or `aria-label`; placeholder ≠ label |
| `index.html` (line 1215) | P0→P2 | `input-no-label` | `<input id="bw-file" type="file" style="display:none">` | False-positive — input is hidden and triggered via labeled wrapper (`#bw-upload`, `role="button"`, `aria-label="Upload lab report PDF"`). Downgrade. |
| `index.html` (×267) | P1 | `onclick-no-keyboard` | `<div … onclick="…">` — `.article-card`, `.wiz-plan-card`, `.dl-prompt-bd`, etc. | Convert click-divs to `<button>` (preferred) or add `role="button" tabindex="0"` + key handler. Some surfaces (`.sc`, `.hero-slide`) are covered by the consolidated global keydown delegate at `app.js:6258`; the rest are not. |
| `index.html` (×12) | P2 | `heading-skip` | `h2 → h4` | Promote inner h4s to h3 in the affected sections (lines 6163, 6248, 6469, 6611, 6706, 6802, 7644, 7804, 7889, 8023, 8152, 11077). |
| `index.html` | P2 | `multiple-h1` (×4) | h1 tags in JS templates | Conditional/state h1s rendered alternately — at most one is in the live DOM. Annotate or consolidate. |
| `index.html` (line 1312) | P1 | `inline-outline-none` | `<input id="report-email" … style="…outline:none">` | Remove `outline:none` from inline style OR rely on `:focus-visible` from container. Inline style currently strips the focus ring on `#report-email`. |
| `search.html` (line 280) | P2 | `heading-skip` | `h1 → h3` | Promote intervening h3 to h2. |
| `bibliography.html` (line 71) | P2 | `input-only-placeholder-label` | `<input id="bib-search" placeholder="Filter by PMID, author, journal, year…">` | Add visible/visually-hidden `<label>` or `aria-label="Filter bibliography"`. |
| `a/*.html` × 5 | P2 | `heading-skip` | `h1 → h3` | Article template skips heading level. Recommend template change: section h3s → h2s in `a/`-page boilerplate. Affects all 358 article pages. |
| `supplement.html`, `article.html` | P2 | `multiple-h1` (×3 each) | h1 tags in JS-rendered state templates | False-positive at static-scan level — only one renders at runtime (loading, error, content). Document with a comment to silence future scans. |
| Modals (`#supp-modal`, `#art-modal`) | P1 | `focus-trap` | `supplement-modal.js` handles Esc but no Tab trap; previous active element not restored on close | Plan modal (`#plan-overlay`) is already correctly trapped (`_bindPlanModalA11y` in `app.js:2717`). Extend the same pattern to `supp-modal` and `art-modal`. |
| `styles.css` mobile breakpoint | P1 | `touch-target-too-small` | `.site-nav-tab` (h:20px), `.site-nav-tabs .site-nav-tab` (h:24px), `.site-nav-search-pill form` (h:32px) | <24×24 fails WCAG 2.5.8 (Target Size Minimum, AA 2.2). Increase to ≥24×24 with adequate spacing, or add tap-target padding. |
| Global tokens | P1 | `contrast-fail` | `--color-text-tertiary` 2.26:1 / 2.01:1 | If used for any human-readable text (helper text, captions, empty-state copy, placeholder text on `.sbox`/`.gs-inp`), darken to at least `#737067` (≈4.5:1) or restrict to decorative roles only. |
| Global tokens | P2 | `contrast-fail` | `--color-brand-soft` 1.80:1, `--color-accent-coral` 2.07:1 | Verify these are used purely as fills/bars/icons (already paired with text in higher-contrast tones). If used as text or essential icon-on-bg, swap to brand/brand-hover. |

### Other checks — clean on this sample

- `<img>` alt text — 22 images, 0 missing `alt`.
- Icon-only `<button>` / `<a>` without `aria-label` — 0 found (all 7 icon-only buttons in `index.html` already labeled).
- Decorative inline `<svg>` inside aria-labeled buttons missing `aria-hidden` — 0 found.
- CSS `outline:none` outside a `:focus-visible` rule with no replacement (`box-shadow` ring, border, etc.) — 0 found.

## Phase B — Auto-fixes applied

**Count: 0 / 30.**

No matching candidates in the Phase B whitelist:

| Fix-class | Candidates this run |
|---|---|
| `alt=""` on decorative images | 0 |
| `aria-hidden="true"` on decorative svg in labeled button/link | 0 |
| `aria-label` on icon-only button (whitelist labels) | 0 — all icon-only buttons already labeled |
| Wrap `<input>` in `<label>` (unambiguous adjacent text) | 0 — the two flagged inputs (`#drug-typeahead-input`, `#bib-search`) lack adjacent text within the same parent; flagged for human |
| `:focus-visible` rule appended to a stylesheet where naked `outline:none` exists | 0 — every CSS `outline:none` / `outline:0` is inside a `:focus-visible` rule with a paired `box-shadow` / `border-color` replacement |

**Files modified: 0.** No `.bak-*` backups created.

## Flagged for human (priority order)

**P0 — block / fix this week**

- *(none surfaced as true P0 on this sample — the only static-scan P0 was a false positive on the hidden `#bw-file` input.)*

**P1 — fix soon**

1. **267 `<div onclick>` click-surfaces in `index.html` without keyboard support.** Highest-impact gap: `.article-card`, `.wiz-plan-card`, `.dl-prompt-bd`, `.hero-slide` (mostly covered by global keydown), category cards. Either convert to `<button>` or wire each into the consolidated keydown delegate at `app.js:6258`.
2. **Focus traps in `#supp-modal` and `#art-modal`.** Plan modal has a working trap; copy the pattern.
3. **Mobile touch-target sizes < 24px** on `.site-nav-tab` (20px) and 24px nav tab icons. Layout decision required.
4. **`--color-text-tertiary` contrast 2.26:1 / 2.01:1.** If used for any helper/empty-state text (see `.bw-secondary`, `bw-count`, sub-captions in plan modal, placeholder defaults), darken token or restrict to decorative use. Brand-color decision required.
5. **Inline `outline:none` on `#report-email`** (`index.html:1312`) strips focus ring on a single live input — remove the inline style.

**P2 — backlog**

- Heading hierarchy: `a/` article template skips `h1 → h3`. Promote section headings to `h2` in the article boilerplate (affects ~358 pages — coordinate with template owner).
- `index.html`: 12 `h2 → h4` skips in the Research tab feed. Promote inner h4s.
- `bibliography.html`: add label/aria-label to `#bib-search`.
- `index.html`: add label/aria-label to `#drug-typeahead-input`.
- `--color-brand-soft` (1.80:1) and `--color-accent-coral` (2.07:1): verify they are only used as fills/borders, not text or essential meaning-bearing icons.
- Multiple-`h1` static-scan false positives in `index.html`, `supplement.html`, `article.html`: leave a `<!-- a11y: only one h1 rendered at runtime -->` annotation to silence future scans.

## Spot-checked diffs

No auto-fixes were applied this run, so no before/after diffs are included. Sanity-check diffs are required by the task spec only when fixes are made.

## Anomaly note

- Bulk template/styles update on 2026-05-11 touched essentially every HTML file (`git log --since=7.days --name-only` returned `index.js`, `styles.css`, `app.js` only at the commit-payload level, but the resulting `mtime`s on every page changed). Strict "include any page modified in the last 7 days" cannot fit under the 40-file cap, so the structural template pages (`supplement.html`, `article.html`, `methodology.html`, `about.html`, `terms.html`, `privacy.html`) were taken as a representative proxy for what the bulk update propagated. If next week's run again sees every page recently modified, consider tightening the rule to "modified outside of bulk template commits".
- No commits made (task spec forbids).
- No dark-mode CSS recommended or introduced.

## Artifacts

- Full findings JSON: `outputs/a11y/findings.json` (working dir)
- Audit script: `outputs/a11y/audit.py`
