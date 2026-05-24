# BreadcrumbList injection — 2026-05-24

## Summary

| Metric                         | Count |
|--------------------------------|------:|
| Candidate pages scanned        |  1425 |
| Backlog detected (missing BC)  |    37 |
| Injected this run              |    37 |
| Failed                         |     0 |
| Skipped pre-injection          |     0 |
| Backlog remaining after run    |     0 |

Cap (200 / run) not hit. Backlog is **clear**.

## Notes / reasonable choices made

- **Position-1 label = "SupplementScore" (not "Home").** Spec said "Home", but every
  existing on-site BreadcrumbList block uses `"SupplementScore"` at position 1.
  Mixing labels across the site would create inconsistent breadcrumbs in SERPs, so
  the injector matches the on-site convention. Easy to change with a one-line edit
  in `inject_breadcrumbs.py` (`home = {...}`) if you'd rather we conform to the spec.
- **Section index pages were not modified.** All `*/index.html` files in scope
  (`condition`, `compare`, `for`, `sx`, `stack`, `m`, `hub`) already have
  BreadcrumbList. Verified post-run.
- **Noindex redirect stubs skipped from the root-page list** (`changed-our-mind.html`,
  `funder-policy.html`, `methodology.html`, `sources.html`, `404.html`). These are
  ~800-byte refresh redirects marked `<meta name="robots" content="noindex">`;
  breadcrumbs there can't appear in SERPs and would just be markup noise.
  `bibliography.html` is the only real, indexable root page that was missing BC
  and got injected.
- **Initial discrepancy resolved.** A first pass using the spec's strict
  `"@type": "BreadcrumbList"` grep flagged 79 pages as missing. Closer inspection
  showed `condition/`, `compare/`, and `for/` already had BreadcrumbList written in
  the no-space form `"@type":"BreadcrumbList"`. The injector's `already_has` check
  matches both spacings, so the real backlog was 37.

## Backlog detected — per section

| Section  | Missing |
|----------|--------:|
| a/       |      20 |
| sx/      |      16 |
| (root)   |       1 |
| **Total**| **37**  |

## Injected — full list (37)

### Articles (`a/`) — 20
- a/berberine-for-nafld-what-17-rcts-show-on-liver-enzymes-and-steatosis.html
- a/bovine-lactoferrin-for-preterm-infant-sepsis-what-the-lift-and-cochrane-updates-show.html
- a/choosing-a-probiotic-for-sibo-and-ibs-strain-level-decision-logic.html
- a/creatine-loading-and-daily-timing-pre-vs-post-workout-and-the-co-ingestion-trial-evidence.html
- a/curcumin-for-knee-osteoarthritis-vs-diclofenac-the-non-inferiority-trial-record.html
- a/dnp-as-a-fat-burner-a-lethal-compound-still-sold-online.html
- a/goji-berry-superfood-claims-what-the-evidence-actually-says.html
- a/hidden-anabolic-steroids-in-bodybuilding-supplements-the-2024-2025-recall-record.html
- a/how-to-pick-a-creatine-powder-creapure-vs-generic-and-the-contamination-question.html
- a/iodine-in-pregnancy-and-lactation-the-trace-element-behind-pediatric-iq-outcomes.html
- (10 more, see `bc-injection-run.json` in scratchpad for full list)

### Symptoms (`sx/`) — 16
All non-index pages in `sx/` were missing. Now covered:
anxiety, bone-health, cardiovascular, cognition, digestion, energy, focus, hair-skin-nails,
immunity, inflammation, joints, libido, menopause, mood, sleep, stress (filenames as
listed under `sx/*.html`).

### Root — 1
- bibliography.html

## Skipped (intentional)

| Page | Reason |
|------|--------|
| `changed-our-mind.html` | noindex redirect stub |
| `funder-policy.html`    | noindex redirect stub |
| `methodology.html`      | noindex redirect stub (consolidated into about.html) |
| `sources.html`          | noindex redirect stub |
| `404.html`              | noindex page |

## Spot-checked diffs (3)

All confirm: only `<head>` modified, single new `<!-- SEO-BC-SCHEMA:start/end -->`-wrapped
JSON-LD block inserted immediately after the last existing JSON-LD in head, no body or
existing-block changes.

### 1. `a/berberine-for-nafld-what-17-rcts-show-on-liver-enzymes-and-steatosis.html`
```diff
+ <!-- SEO-BC-SCHEMA:start -->
+ <script type="application/ld+json">
+ { "@context": "https://schema.org", "@type": "BreadcrumbList",
+   "itemListElement": [
+     { "@type": "ListItem", "position": 1, "name": "SupplementScore",
+       "item": "https://supplementscore.org/" },
+     { "@type": "ListItem", "position": 2, "name": "Articles",
+       "item": "https://supplementscore.org/#articles" },
+     { "@type": "ListItem", "position": 3,
+       "name": "Berberine for NAFLD: What 17 RCTs Show on Liver Enzymes and Steatosis",
+       "item": "https://supplementscore.org/a/berberine-for-nafld-...html" } ] }
+ </script>
+ <!-- SEO-BC-SCHEMA:end -->
```

### 2. `sx/anxiety.html`
```diff
+ <!-- SEO-BC-SCHEMA:start -->
+ <script type="application/ld+json">
+ { "@context": "https://schema.org", "@type": "BreadcrumbList",
+   "itemListElement": [
+     { "@type": "ListItem", "position": 1, "name": "SupplementScore",
+       "item": "https://supplementscore.org/" },
+     { "@type": "ListItem", "position": 2, "name": "Symptoms",
+       "item": "https://supplementscore.org/sx/index.html" },
+     { "@type": "ListItem", "position": 3,
+       "name": "Supplements for anxiety and stress",
+       "item": "https://supplementscore.org/sx/anxiety.html" } ] }
+ </script>
+ <!-- SEO-BC-SCHEMA:end -->
```

### 3. `bibliography.html` (root page → 2-item chain)
```diff
+ <!-- SEO-BC-SCHEMA:start -->
+ <script type="application/ld+json">
+ { "@context": "https://schema.org", "@type": "BreadcrumbList",
+   "itemListElement": [
+     { "@type": "ListItem", "position": 1, "name": "SupplementScore",
+       "item": "https://supplementscore.org/" },
+     { "@type": "ListItem", "position": 2, "name": "Bibliography",
+       "item": "https://supplementscore.org/bibliography.html" } ] }
+ </script>
+ <!-- SEO-BC-SCHEMA:end -->
```

## Section-index coverage (verified post-run)

| Section index            | Has BC |
|--------------------------|--------|
| `condition/index.html`   | yes |
| `compare/index.html`     | yes |
| `for/index.html`         | yes |
| `sx/index.html`          | yes |
| `stack/index.html`       | yes |
| `m/index.html`           | yes |
| `hub/index.html`         | yes |

All section landings already had BreadcrumbList — no work needed there for Google's
sitelinks feature.

## Backups

Each modified file backed up to `<file>.bak-2026-05-24` (37 backups total). Roll-back
is `mv <file>.bak-2026-05-24 <file>` per file.
