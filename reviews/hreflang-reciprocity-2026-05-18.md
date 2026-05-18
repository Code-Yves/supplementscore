# Hreflang Reciprocity Audit — 2026-05-18

**Status:** All translated pages have complete hreflang coverage. No auto-fixes required.

## Summary

| Metric | Count |
|---|---|
| Total EN pages with at least one translation | 4 |
| EN pages missing hreflang tags | 0 |
| ES pages missing hreflang tags | 0 |
| FR pages missing hreflang tags | 0 |
| Pages auto-fixed this run | 0 |
| Orphan translations (no EN counterpart) | 0 |
| Stale translations (EN > 30 days newer) | 0 |

Auto-fix cap: 150 files per run (not reached).

## Pages with translations

All four pages have ES + FR translations and full hreflang coverage on every side (EN, ES, FR, x-default):

| Page | EN | ES | FR | EN mtime (UTC) |
|---|---|---|---|---|
| `index.html` | OK | OK | OK | 2026-05-18 |
| `landing.html` | OK | OK | OK | 2026-05-17 |
| `condition/pcos-protocol.html` | OK | OK | OK | 2026-05-14 |
| `condition/anxiety-stack.html` | OK | OK | OK | 2026-05-14 |

For each page, the four required `<link rel="alternate" hreflang="...">` tags are present: `en`, `es`, `fr`, and `x-default` (pointing to the EN canonical). Canonical tags are also present on every side.

## EN-side audit detail

For each EN page with a translation, the audit verified:

- `<link rel="alternate" hreflang="en" href="<canonical-en-url>">` — **present on all 4**
- `<link rel="alternate" hreflang="es" href="<canonical-es-url>">` — **present on all 4** (ES translation exists for all)
- `<link rel="alternate" hreflang="fr" href="<canonical-fr-url>">` — **present on all 4** (FR translation exists for all)
- `<link rel="alternate" hreflang="x-default" href="<canonical-en-url>">` — **present on all 4**

No missing tags.

## Translation-side audit detail (ES + FR, 8 files)

For each translated page, the audit verified:

- `<link rel="alternate" hreflang="en" href="<canonical-en-url>">` (back to source) — **present on all 8**
- `<link rel="alternate" hreflang="<self>" href="<canonical-self-url>">` — **present on all 8**
- `<link rel="alternate" hreflang="<sibling-translation>" href="..."` — **present on all 8** (each ES page references FR and vice versa)
- `<link rel="alternate" hreflang="x-default" href="<canonical-en-url>">` — **present on all 8**

No missing tags.

## Auto-fix this run

None. All 12 (4 pages × 3 languages) audited HTML files already satisfy the reciprocity requirements. No `.bak-2026-05-18` backup files were created.

## Orphan translations

None. Every translated page (`es/*` and `fr/*`) has a matching EN counterpart at the corresponding `<relative-path>` on disk.

## Stale translations

None. For all 8 translation files, the EN mtime is not more than 30 days newer than the translation mtime. The largest delta observed:

- `index.html`: EN newer than translations by < 1 day
- `landing.html`: EN newer than ES/FR by ~3 days
- `condition/pcos-protocol.html`: EN newer than ES/FR by < 1 day
- `condition/anxiety-stack.html`: EN newer than ES/FR by < 1 day

The `monthly-translation-refresh` consumer has no work to pick up from this run.

## Acceptance criteria

- [x] Audit covered every page with at least one translation (4/4).
- [x] Auto-fix count (0) ≤ 150 cap.
- [x] No HTML modifications were made; no validation failures.

## Notes / autonomous choices

- The translation map was built by walking `supplementscore-repo/{es,fr}/` recursively for `*.html` files. Only HTML pages were considered; non-HTML assets (images, JSON, etc.) were ignored.
- `index.html` translation URLs are normalized to the directory form (e.g., `https://supplementscore.org/es/`) to match the canonical convention already used in the EN `index.html`. All other paths use the explicit `.html` suffix, matching existing canonicals on disk.
- The auto-fix script inserts new hreflang tags immediately after the existing `<link rel="canonical">` tag and writes a `.bak-2026-05-18` backup before modifying. No files were modified this run, so no backups exist.
- Per the task contract, no git commits were made, no body content was touched, and no translated pages were deleted. Site remains light-mode only.

## Escalations

None.
