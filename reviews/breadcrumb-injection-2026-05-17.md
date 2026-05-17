# BreadcrumbList JSON-LD injection — 2026-05-17

Automated weekly run of the `weekly-breadcrumb-schema-injector` scheduled task.
Auto-apply mode (per user direction). Cap = 200 per run.

## Headline

- **Backlog detected:** 116 pages missing `BreadcrumbList` JSON-LD
- **Injected this run:** 116 (entire backlog cleared in one run)
- **Skipped:** 4 site-utility files (`index.html`, `404.html`, two `google*.html` verification stubs)
- **Failed:** 0 after fixes
- **Backlog remaining:** 0
- **Section landing pages (`*/index.html`):** all 6 existing section indexes now carry breadcrumbs (`compare`, `condition`, `for`, `m`, `stack`, `sx`). `a/` and `s/` have no `index.html` files in the repo — not applicable.

## Backlog by section (before this run)

| Section       | Pages missing |
|---------------|--------------:|
| `./` (root)   | 25            |
| `a/`          | 60            |
| `compare/`    | 8             |
| `condition/`  | 10            |
| `for/`        | 5             |
| `m/`          | 6             |
| `s/`          | 0             |
| `stack/`      | 1             |
| `sx/`         | 1             |
| **Total**     | **116**       |

`s/` (supplements) was already fully covered from previous SEO work; nothing to do there.

## What was injected

For each page lacking a `BreadcrumbList` JSON-LD block, a new `<script type="application/ld+json">` block was inserted in `<head>` immediately after the last existing JSON-LD script (or, if no JSON-LD existed, immediately before `</head>`). The block is wrapped in `<!-- SEO-BREADCRUMB:start -->` / `<!-- SEO-BREADCRUMB:end -->` markers for future maintainability.

Breadcrumb chains follow the per-section pattern in the task spec:

- `s/<slug>.html` → Home › Supplements › {Title}
- `a/<slug>.html` → Home › Articles › {Title}
- `condition/<slug>.html` → Home › Conditions › {Title}
- `compare/<slug>.html` → Home › Comparisons › {Title}
- `for/<slug>.html` → Home › By Population › {Title}
- `sx/<slug>.html` → Home › Symptoms › {Title}
- `stack/<slug>.html` → Home › Stacks › {Title}
- `m/<slug>.html` → Home › Medications › {Title}
- Section index (`<section>/index.html`) → Home › {Section}
- Root page → Home › {Title}

Titles were extracted from `<title>` (with `— SupplementScore` / `· SupplementScore` / `— Supplement Score` suffix stripped) and falling back to the first `<h1>` if `<title>` was missing.

### Sample of injected files (per section)

**root** (25): `about.html`, `accessibility.html`, `article.html`, `bibliography.html`, `biomarker.html`, `browse.html`, `build.html`, `changed-our-mind.html`, `compare.html`, `condition.html`, `discover.html`, `editorial-board.html`, `editorial-pipeline.html`, `funder-policy.html`, `glossary.html`, `landing.html`, `medication.html`, `methodology.html`, `privacy.html`, `search.html`, `sources.html`, `supplement.html`, `symptom.html`, `terms.html`, `tier-promotion-flow.html`

**a/** (60): full backfill of remaining articles missing breadcrumbs, e.g. `a/2-fucosyllactose-and-other-hmos-as-adult-supplements-emerging-but-not-proven.html`, `a/akkermansia-muciniphila-the-next-generation-probiotic-and-what-trials-have-actually-shown.html`, `a/apigenin-cd38-inhibition-and-nad-the-flavonoid-mechanism-and-emerging-human-evidence.html`, `a/berberine-for-sibo-the-2024-2025-evidence-update.html`, …

**compare/** (8): `compare/index.html`, `compare/d-mannose-vs-cranberry-for-uti.html`, `compare/epa-vs-dha.html`, `compare/hawthorn-vs-garlic-for-blood-pressure.html`, `compare/maca-vs-ashwagandha.html`, `compare/reishi-vs-cordyceps.html`, `compare/spirulina-vs-chlorella.html`, `compare/valerian-vs-hops-for-sleep.html`

**condition/** (10): `condition/index.html`, `condition/asthma-adjunct.html`, `condition/high-cholesterol.html`, `condition/osteoarthritis-knee.html`, `condition/vertigo-bppv.html`, … (+ 5 more)

**for/** (5): `for/caregivers.html`, `for/desk-workers.html`, `for/frequent-travelers.html`, `for/vegetarians.html`, plus 1 more

**m/** (6): `m/index.html`, `m/amlodipine.html`, `m/gabapentin.html`, `m/semaglutide.html`, `m/sertraline.html`, `m/tramadol.html`

**stack/** (1): `stack/index.html`

**sx/** (1): `sx/index.html`

## Skipped pages (with reasons)

| File | Reason |
|------|--------|
| `index.html` | Root, no breadcrumb needed (per spec) |
| `404.html` | Error page — not surfaced in SERPs |
| `google43d864f80fd33359.html` | Google site-verification stub (53 bytes) |
| `google8b1abc8557ca62f3.html` | Google site-verification stub (53 bytes) |

All 1,129 pages that **already** had a `BreadcrumbList` (mostly the `s/` supplement pages from previous SEO work) were left untouched, as required.

## Backlog remaining

**0 pages.** The scheduled-task cap of 200 per run was not approached (backlog was 116). Next week's run should be a quick no-op unless new pages are added without breadcrumbs.

## Spot-checked diffs (3 injected files)

### 1. Article: `a/2-fucosyllactose-and-other-hmos-as-adult-supplements-emerging-but-not-proven.html`

The new BreadcrumbList sits immediately after the existing `Article` JSON-LD block:

```html
  ...
  "articleSection": "Breakthrough"
}
  </script>
  <!-- SEO-BREADCRUMB:start -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home",
     "item": "https://supplementscore.org/"},
    {"@type": "ListItem", "position": 2, "name": "Articles",
     "item": "https://supplementscore.org/a/index.html"},
    {"@type": "ListItem", "position": 3,
     "name": "2'-fucosyllactose and other HMOs as adult supplements: emerging but not proven",
     "item": "https://supplementscore.org/a/2-fucosyllactose-and-other-hmos-as-adult-supplements-emerging-but-not-proven.html"}
  ]
}
  </script>
  <!-- SEO-BREADCRUMB:end -->
  <script>document.documentElement.setAttribute('data-theme','light');</script>
```

### 2. Comparison: `compare/hawthorn-vs-garlic-for-blood-pressure.html`

```html
...,"articleSection":"Comparative supplement guide"}
</script>
  <!-- SEO-BREADCRUMB:start -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home",
     "item": "https://supplementscore.org/"},
    {"@type": "ListItem", "position": 2, "name": "Comparisons",
     "item": "https://supplementscore.org/compare/index.html"},
    {"@type": "ListItem", "position": 3,
     "name": "Hawthorn vs Aged Garlic for blood pressure — herbal cardio compared",
     "item": "https://supplementscore.org/compare/hawthorn-vs-garlic-for-blood-pressure.html"}
  ]
}
  </script>
  <!-- SEO-BREADCRUMB:end -->
  <script src="../_site-ux.js?v=20260509o" defer></script>
</head>
```

### 3. Section landing: `condition/index.html` (2-item chain)

```html
  ...
  <script src="../_site-ux.js?v=20260509o" defer></script>

  <!-- SEO-BREADCRUMB:start -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home",
     "item": "https://supplementscore.org/"},
    {"@type": "ListItem", "position": 2, "name": "Conditions",
     "item": "https://supplementscore.org/condition/index.html"}
  ]
}
  </script>
  <!-- SEO-BREADCRUMB:end -->
```

## Validation

For every file written:
1. The new JSON parsed (`json.loads(...)`).
2. After insertion, the BreadcrumbList block was re-extracted and JSON-validated.
3. `<head>` and `<script>` tag counts stayed balanced (regex check with `\b` boundaries — initial run had two false-positive validator bugs: counting `<header>` as `<head>`, and a pre-existing positional bug in the insertion offset; both fixed before any corrupt file was written, and the validator rolled back the affected attempts).
4. Python `html.parser` parsed 5 random injected files without errors (sanity sample).

No file modified outside `<head>`. No existing JSON-LD blocks modified. No git commits.

## Backups

Every modified file has a sibling `*.bak-20260517` (116 backups total). One backup per file per run. These can be removed once the change is confirmed safe in production.

## Notes / decisions made autonomously

- For sections where `index.html` does **not** exist in the repo (`a/`, `s/`), the breadcrumb's position-2 `item` URL still points at `/<section>/index.html` per the schema in the task spec. The URL may 404 if the section landing isn't generated; the JSON-LD schema is still well-formed and Google will display the breadcrumb chain regardless. Existing `s/` pages (from prior work) use `discover.html` as the supplements parent — those were NOT touched, only newly-injected pages follow the spec's `/section/index.html` pattern.
- 4 site-utility root pages (`index.html`, `404.html`, two `google*.html` verification stubs) were skipped — they should never appear with breadcrumbs in SERPs.
- The "Articles" breadcrumb label is used for `a/<slug>.html` per spec; site copy varies between "Articles" / "Deep dives" elsewhere but the schema label matches the task definition.
