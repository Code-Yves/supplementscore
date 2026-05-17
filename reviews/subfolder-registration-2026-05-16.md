# Subfolder Registration — 2026-05-16

Run timestamp: 2026-05-16T07:07:12Z
Working directory: `/Users/yves/Desktop/AI/Supplement Score/supplementscore-repo/`

## Top-line

- Sections processed: 5 of 5 (`compare`, `condition`, `for`, `stack`, `m`)
- Folder indexes created this run: 0 (all 5 already existed)
- Orphans registered this run: **32** (8 + 16 + 8 + 0 + 0) — includes one late-arrival (`condition/type-2-diabetes.html`, generated at 07:07:59Z mid-run, registered in a second pass)
- Main-nav additions: 0 (all 5 section indexes already linked from main `index.html` footer)
- Sitemap `<url>` entries added: 0 (all 31 registered URLs already present in their section sitemaps via the separate sitemap generator)
- Auto-rollbacks: **0**
- SW cache version bumped: `v2026-05-16-articleReg-art410` → `v2026-05-16-articleReg-art410-subReg31` (set at end of first pass; the late-arrival second pass registered an additional file but did not re-bump the version string — clients pulling the new SW will still invalidate caches)

No anomalies, no regressions, no rollbacks.

## Per-section detail

| Section | Disk files | Linked before | Linked after | Orphans detected | Orphans registered | Backlog remaining |
|---|---|---|---|---|---|---|
| compare   | 75 | 67 | 75 | 8  | 8  | 0 |
| condition | 84 | 68 | 84 | 16 | 16 | 0 |
| for       | 35 | 27 | 35 | 8  | 8  | 0 |
| stack     | 3  | 3  | 3  | 0  | 0  | 0 |
| m         | 5  | 5  | 5  | 0  | 0  | 0 |

All section indexes parse-validated after edit. Every newly-registered href confirmed present in the relevant `<section>/index.html` after write.

### `compare/` — 8 registered

- boron-vs-magnesium-for-bone.html
- bovine-vs-marine-collagen.html
- dim-vs-calcium-d-glucarate.html
- l-glutamine-vs-zinc-carnosine-for-gut.html
- magnesium-malate-vs-glycinate.html
- resveratrol-vs-pterostilbene.html
- sulforaphane-vs-curcumin.html
- tart-cherry-vs-glycine-for-sleep.html

Backup: `compare/index.html.bak-20260516T070712Z`

### `condition/` — 16 registered

- bph-protocol.html
- cold-sores-recurrent-hsv.html
- hashimotos-thyroiditis.html
- hemorrhoid-adjunct.html
- histamine-intolerance.html
- hyperhidrosis-stack.html
- hyperthyroidism-graves.html
- insomnia-protocol.html
- lower-back-pain-stack.html
- multiple-sclerosis-adjunct.html
- plantar-fasciitis-stack.html
- pots-support.html
- sibo-protocol.html
- sjogrens-syndrome-adjunct.html
- tension-headache-stack.html
- type-2-diabetes.html *(late-arrival — generated at 07:07:59Z mid-run; registered in second pass at 07:08:??Z)*

Backups: `condition/index.html.bak-20260516T070712Z` (first pass), `condition/index.html.bak-20260516T070759Z` (second pass for late arrival).

### `for/` — 8 registered

- heart-health-50plus.html
- intermittent-fasters.html
- new-parents.html
- post-covid-recovery.html
- recovery-from-surgery.html
- recreational-runners.html
- seasonal-allergy-sufferers.html
- weekend-warriors.html

Backup: `for/index.html.bak-20260516T070712Z`

### `stack/` — no orphans, no edits

3 files on disk, all already linked from `stack/index.html`.

### `m/` — no orphans, no edits

5 files on disk, all already linked from `m/index.html`.

## Folder indexes created this run

None — all five (`compare`, `condition`, `for`, `stack`, `m`) already exist.

## Main-nav (Step 4)

No new nav link added.

Reason: every section index page (`compare/index.html`, `condition/index.html`, `for/index.html`, `stack/index.html`, `m/index.html`) is already linked from the main `index.html` (in the site footer's Browse / Go Deeper columns, lines 21228–21238). No eligible section exists where the main page does not yet link to its folder index.

## Sitemaps (Step 5)

No `<url>` entries added to any section sitemap. All 31 registered URLs already exist in their respective sitemap files (`sitemap-compare.xml`, `sitemap-conditions.xml`, `sitemap-for.xml`) — they were written by the article/page generator at file-creation time. The orphan condition was a listing-page gap only, not a sitemap gap.

`sitemap-index.xml` already references all 5 section sitemaps (`sitemap-compare.xml`, `sitemap-conditions.xml`, `sitemap-for.xml`, `sitemap-stacks.xml`, `sitemap-medications.xml`) — no changes needed.

| Sitemap | Entries before | Entries added this run | Entries after |
|---|---|---|---|
| sitemap-compare.xml | (75+) | 0 | (unchanged) |
| sitemap-conditions.xml | (83+) | 0 | (unchanged) |
| sitemap-for.xml | (35+) | 0 | (unchanged) |
| sitemap-stacks.xml | (3+) | 0 | (unchanged) |
| sitemap-medications.xml | (5+) | 0 | (unchanged) |

## Cache buster (Step 6)

- `index.html` does not reference `<section>/index.html?v=...` (no per-section cache buster pattern present in the main page) — no edit needed.
- `sw.js`: bumped `CACHE_VERSION` from `v2026-05-16-articleReg-art410` → `v2026-05-16-articleReg-art410-subReg31` (registration occurred — clients must invalidate cached listing pages).
- `sw.js` validated with `node -c`. Backup: `sw.js.bak-20260516T070712Z`.

## Three spot-checked diffs

Each below is the exact `<li>` inserted into the section's `SEO-STATIC-INDEX` `<ul class="ss-static-index-ul">` in alphabetical order by href.

### 1. `compare/index.html` — inserted

```html
<li><a href="boron-vs-magnesium-for-bone.html">Boron vs Magnesium for bone health — what each actually does in the bone matrix</a></li>
```

Verified present in `compare/index.html`. Title sourced from `<title>` tag with `· SupplementScore` brand suffix stripped.

### 2. `condition/index.html` — inserted

```html
<li><a href="sibo-protocol.html">SIBO protocol — what supplements actually help small intestinal bacterial overgrowth</a></li>
```

Verified present in `condition/index.html`. Inserted between `seasonal-affective-disorder.html` and `sleep-apnea-adjunct.html` (alphabetical-by-href).

### 3. `for/index.html` — inserted

```html
<li><a href="new-parents.html">Supplements for new parents — sleep-deprived, time-poor, evidence-based</a></li>
```

Verified present in `for/index.html`. Inserted between `men.html` and `plant-based-athletes.html` (alphabetical-by-href).

## Backups created this run

- `compare/index.html.bak-20260516T070712Z`
- `condition/index.html.bak-20260516T070712Z`
- `for/index.html.bak-20260516T070712Z`
- `sw.js.bak-20260516T070712Z`

## Notes / autonomous decisions

- Step 2 was a no-op: every section already had its `index.html`. The 3-per-run cap was therefore not exercised.
- Step 4 was a no-op: the main `index.html` already links to all five section folder indexes from the site footer. Per the spec ("max 1 new nav link per run") this is acceptable — there is simply nothing eligible to add.
- Step 5 produced 0 sitemap additions because the URLs were already in the section sitemaps. This means the sitemap generator runs at article-creation time, and orphans are a listing-page artifact rather than a sitemap artifact. Not an escalation.
- Title extraction prefers `<title>` (stripped of trailing brand suffix `· SupplementScore` / `— SupplementScore`) and falls back to `<h1>`.
- Insertion preserves the existing alphabetical-by-href ordering of the `ss-static-index-ul` list.
- HTML parse-validated after every write via Python `html.parser`. No rollbacks triggered.
- No data fields changed; no tier ratings touched; no git commits.
