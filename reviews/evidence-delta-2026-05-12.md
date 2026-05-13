# Evidence Delta — 2026-05-12

Closes the loop between this week's research-feed outputs and the SupplementScore database. Reads `reviews/` for new findings, maps them to `data.js` records, and produces a prioritized action list.

## Inputs scanned

| Feed | This week's file | Status |
|---|---|---|
| `weekly-faers-supplement-signals` | `reviews/faers-signals-2026-05-12.md` | Present — baseline run, no signals |
| `weekly-literature-scan` | `reviews/literature-scan-*.md` / `pubmed-scan-*.md` | **Missing** — no file produced for this week |
| `weekly-regulator-alerts` | `reviews/regulator-alerts-*.md` | **Missing** — no file produced for this week |

Adjunct context also read: `article-generation-log.md` (40 evergreen articles published 2026-05-10/11), `content-polish-2026-05-10.md` (8 pages tightened, no escalation).

## Headline

Nothing urgent. The FAERS scan was a baseline run that produced no signals (FDA refresh-lag artifact, as documented in that report), and the literature-scan and regulator-alerts feeds did not produce outputs this week. **No supplement currently meets the threshold for tier review, safety review, or article re-write driven by new evidence.** The most actionable item is operational: the literature-scan and regulator-alerts tasks appear to be missing or failed silently this week — that's worth a 5-minute check.

---

## 1. 🔴 Urgent

_None._ No safety flags in FAERS this week. No safety articles overdue against the 14-day cadence (Black cohosh — top safety article in the high-volume list — was tightened on 2026-05-10 by the content-polish pass, so it sits at 2 days old).

---

## 2. 🟡 Tier review candidates

_None triggered by this week's research feeds._ No new confirmatory or null evidence surfaced for any Tier 1, 2, or 3 supplement. Pre-existing tier-review candidates that should still be on Yves's radar (carried from earlier weeks, not new this week):
- **Berberine (T2)** — 2026-05-11 article `same-s-adenosylmethionine` and existing meta-analyses already capture metabolic effect strength. No new evidence today, but worth a tier-1 conversation next time a confirmatory RCT lands.
- **Magnesium L-threonate (T2)** — new article published 2026-05-11; tier remains T2 since the human trial base is still small and industry-funded.

---

## 3. 🟢 Article update opportunities

Driven by content gaps, not new evidence — none of these is overdue against cadence:
- **Alpha-Lipoic Acid (T3)** — top-of-list FAERS volume, article last updated 2026-04-26. Within 60d cadence, but a fresh pass would re-anchor citations.
- **High-dose fat-soluble vitamins (T4)** — no dedicated article currently maps to this label in `ARTICLE_MAP`. The FAERS top-list places it at 6,167 reports; readers searching this term hit only general vitamin pages.

---

## 4. 📝 New article opportunities

- **"Why FAERS Counts Don't Mean a Supplement Is Dangerous"** — explainer triggered by this week's baseline FAERS table. Would let future weekly FAERS deltas link to a single shared methodology piece instead of repeating caveats. Low priority, high reuse value.

---

## 5. 📋 Top-10 supplement article-recency check

Cadence policy: 14d safety / 30d Tier 1 / 60d Tier 2/3.

| Supplement | Tier | Top article | Last update | Cadence | Status |
|---|---|---|---|---|---|
| Vitamin D3 | T1 | `why-most-vitamin-d-studies-are-misleading` | 2026-04-26 | 30d | ✅ within window |
| Magnesium | T1 | `the-complete-guide-to-magnesium-forms` | 2026-04-26 | 30d | ✅ within window |
| Melatonin | T2 | `the-complete-sleep-supplement-guide-beyond-melatonin` | 2026-04-26 | 60d | ✅ within window |
| Iron | T2 | `iron-supplements-why-most-people-take-them-wrong` | 2026-04-24 | 60d | ✅ within window |
| Zinc | T1 | `zinc-and-immunity-separating-science-from-cold-season-marketing` | 2026-04-24 | 30d | ✅ within window |
| High-dose fat-soluble vitamins (A, E) | T4 | _no direct article in ARTICLE_MAP_ | — | 14d | ⚠️ coverage gap (no article = no review window) |
| Collagen for muscle strength | T3 | `the-truth-about-collagen-supplements-what-13-clinical-trials-actually-show` | 2026-04-24 | 60d | ✅ within window |
| Alpha-Lipoic Acid (ALA) | T3 | `alpha-lipoic-acid-the-antioxidant-for-nerve-health` | 2026-04-26 | 60d | ✅ within window |
| Berberine | T2 | `berberine-is-it-really-nature-s-ozempic` | 2026-04-24 | 60d | ✅ within window |
| Black cohosh high-dose | T4 | `black-cohosh-for-menopause-cautious-yes-cautious-no` | 2026-05-10 (polish) | 14d | ✅ within window |

Only flag: high-dose fat-soluble vitamins has no dedicated article in `ARTICLE_MAP`, so cadence can't even be measured. See §3 (article update opportunities).

---

## 6. ⚙️ Pipeline note (action for Yves)

The `weekly-literature-scan` and `weekly-regulator-alerts` scheduled tasks did not write output files this week. This task assumes their outputs as inputs, so missing them blanks out two of the four finding channels.

Likely causes (in priority order):
1. Tasks haven't been created yet — only `weekly-faers-supplement-signals` produced output this run.
2. Tasks were created but failed silently (API timeout, MCP auth lapse on a literature/regulator source).
3. Output filename pattern differs from the `literature-scan-*.md` / `pubmed-scan-*.md` / `regulator-alerts-*.md` glob that this task searches.

**Recommended next step:** Confirm in the scheduled-tasks list whether those two tasks exist and ran. If they don't exist yet, this task's input surface will remain ~25% of intended until they're added.

---

## Methodology / assumptions for this run

- "Priority score" scoring (popularity × significance × tier-distance) wasn't applied this week because no findings emerged from the feed scans — the task spec's scoring framework only matters when there are findings to rank.
- Article-recency dates were read from the `ar-meta` div in each `/a/` article (the "Updated …" string), not from a `last-reviewed:` HTML comment. Most of the older articles use the visible "Updated" date; newer May-10/11 articles use both. Where both existed, the more recent date was used.
- "High-dose fat-soluble vitamins (A, E)" in `data.js` has no specific article mapping in `ARTICLE_MAP`; the closest related article is `nicotinic-acid-vs-niacinamide-flushing-hepatotoxicity-and-dose-differences` (water-soluble, not a fit). Flagged as a content gap rather than an overdue review.
- The black-cohosh article's effective freshness comes from `content-polish-2026-05-10.md` recording a tightening pass; the visible ar-meta date is 2026-04-27. Treated as fresh because the polish pass set a `<!-- last-reviewed: 2026-05-10 -->` marker.

**Next run** should show a non-empty action list if the literature-scan and regulator-alerts feeds come online, and FAERS week-over-week deltas start producing real signals once a true baseline-to-current comparison is possible.
