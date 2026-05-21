# SEO editorial pass — 2026-05-21

Follow-up to the weekly SEO audit. This pass tackled the editorial issues the
scheduled audit explicitly does not auto-fix.

## Before vs. after

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Pages scanned | 1,435 | 1,435 | — |
| Pages with canonical | 1,435 | 1,435 | — |
| Pages with og:title / og:description / og:url / og:type / og:site_name | 1,432–1,435 | 1,435 | +0–3 |
| Pages with twitter:card / twitter:title / twitter:description | 1,432–1,435 | 1,435 | +0–3 |
| Meta description missing | 9 | 0 | −9 ✅ |
| Meta description <50 chars | 1 | 1 | — |
| Meta description >160 chars | 268 | 0 | −268 ✅ |
| Title >60 chars | 808 | 339 | −469 (−58%) |
| Title missing brand suffix (no og:site_name fallback) | 0 | 0 | — |
| Duplicate title groups | 1 | 0 | −1 ✅ |
| JSON-LD malformed | 0 | 0 | — |
| Lighthouse-critical pages with desc out of 50–155 | 7 | 0 | −7 ✅ |
| ❌ Critical issues | 7 | 0 | −7 ✅ |

## What was done

### E1. 7 Lighthouse-critical descriptions trimmed (50–150 chars)

Each rewritten to stay under 150 chars while preserving the core value claim:

- `index.html` — 221 → 134 chars
- `discover.html` — 205 → 136 chars
- `es/index.html` — 192 → 136 chars
- `fr/index.html` — 185 → 138 chars
- `methodology.html` — 176 → 131 chars
- `condition/index.html` — 176 → 127 chars
- `compare/index.html` — 158 → 145 chars

### E2. 9 pages with missing meta descriptions repaired

Root cause: 8 of the 9 actually had a `<meta name="description">` tag, but with
unescaped double quotes inside double-quoted content (`content="… "balances pH" …">`).
This silently broke HTML parsing, so the audit's regex couldn't find them and
Google sees no description.

Fix: detected the broken tags, extracted the intended text, escaped the inner
quotes to `&quot;`, and replaced the tag in place. The 9th page
(`tier-promotion-flow.html`) genuinely had no description — added a fresh one.

Files:

- a/alkaline-water-and-ph-supplements-why-the-chemistry-doesnt-work-that-way.html
- a/carnosine-for-skin-glycation-and-aging-the-ages-evidence-so-far.html
- a/cellular-methylation-support-stacks-what-folate-b12-and-tmg-actually-do.html
- a/liver-detox-supplements-what-milk-thistle-actually-does-and-doesnt-do.html
- a/probiotic-strains-for-ibs-which-species-the-evidence-actually-supports.html
- compare/methylfolate-vs-folic-acid.html
- compare/spirulina-vs-chlorella.html
- condition/gallstone-prevention.html
- tier-promotion-flow.html

Heads-up: similar unescaped-quote bugs may exist on other pages outside this
list. Suggest a separate sweep that scans every page's `<meta name="description">`
tag for `"` inside double-quoted content.

### E3. Duplicate title resolved

`for/gut-health.html` and `sx/gut-health.html` shared the same title. Now:

- `for/gut-health.html` → "Supplements for gut health — what actually works"
- `sx/gut-health.html` → "Gut-health supplements by symptom — bloating, reflux"

### E4. 262 long descriptions trimmed (>160 → ≤150 chars)

Used a sentence-boundary-first, then em-dash-clause, then word-boundary trim,
budget 150 chars. No description left in an awkward mid-word state; trailing
`…` only when no clean boundary was reachable.

### E5/E6. 469 long titles fit ≤60 chars

Strategy, in order:

1. **Brand suffix stripped** (245 pages, mostly `/a/`, `/s/`, `/stack/`).
   Brand suffix " — SupplementScore" eats 18 of the 60-char budget. Google
   auto-appends the site name in SERPs from `og:site_name`, so dropping the
   in-title brand is safe and increases keyword headroom.

2. **Per-section template trims** (224 pages):
   - **/m/ (10)**: "X and Supplements: Interactions, Cautions, and Safe Stacks" →
     "X — supplement interactions"
   - **/condition/ (124)**: dropped trailing descriptive clauses ("— what the
     evidence supports", "— what actually works", etc.) while preserving
     supplement framing ("— supplement protocol", "— supplement adjunct").
   - **/compare/ (97)**: dropped trailing clause after "X vs Y", or after
     "X compared:" / "X forms:".
   - **/for/ (11)**: dropped trailing descriptive clause after "Supplements for X".
   - **/stack/ (3)**: dropped trailing descriptive clause.
   - **Manual rewrites** for 6 multi-language landing/index pages and 4 condition
     stragglers that didn't fit any template (iron-deficiency-anemia, MCAS,
     pre-eclampsia-prevention, statin-myopathy).

### What is *not* fixed

**339 `/a/` article headlines remain >60 chars** after brand strip.

These are editorial article headlines, not templated metadata. Examples:

- "Iron supplement forms guide: ferrous sulfate vs bisglycinate vs heme iron" (74)
- "D-Mannose for UTIs: Evidence Collapsed With the 2024 MERIT Trial" (64)
- "Cellular hydration supplements: the marketing claim with no biological basis" (76)
- "Vitamin A Toxicity: Retinol, Beta-Carotene, and the Asymmetric Risks" (68)

Algorithmic trimming damages these — the keyword-rich tail is the reason they
rank. Google handles long titles gracefully in SERPs (truncates with "…") and
the keywords still contribute to ranking. Recommendation: leave them alone, or
do a human editorial pass with the writer.

**1 stub page** (`article.html`, description 34 chars) is below the 50-char
warning threshold. It's a redirect / template stub, not a real page.

## Backups

Every modified file has a `.bak-20260521-edit` backup alongside it. To revert
a single file, copy the .bak over the live version.

## Scripts

- `seo_audit.py` — the weekly audit (run by the scheduled task).
- `seo_editorial.py` — this editorial pass. Idempotent, safe to re-run.

Both live in the outputs directory.
