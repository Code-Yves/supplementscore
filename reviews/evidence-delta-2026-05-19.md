# Evidence Delta — 2026-05-19

Closes the loop between this week's research-feed outputs and the SupplementScore database. Reads `reviews/` for new findings, maps them to `data.js` records, and produces a prioritized action list.

## Inputs scanned

| Feed | This week's file | Status |
|---|---|---|
| `weekly-faers-supplement-signals` | `reviews/faers-signals-2026-05-19.md` | Present — no signals, no watch list (data-lag artifact) |
| `weekly-literature-scan` | `reviews/literature-scan-*.md` / `pubmed-scan-*.md` | **Missing** — second consecutive week without output |
| `weekly-regulator-alerts` | `reviews/regulator-alerts-*.md` | **Missing** — second consecutive week without output |

**Adjunct used as literature proxy this week:** `article-generation-log.md`. The site's evergreen-article pipeline published ~80 new pieces 2026-05-13 → 2026-05-18, many of them framed around 2024-2025 trials, meta-analyses, and cohort updates. These were treated as a soft literature feed — the *team has already decided* this evidence is publishable, which is exactly the surface the evidence-delta task is supposed to act on.

## Headline

No safety flags. FAERS was clean (the report itself notes the OpenFDA refresh-lag artifact). But the article pipeline surfaced **eight evidence drops on six core supplements** that warrant a tier-review conversation or a database-description refresh: glucosamine, CoQ10, berberine, magnesium, vitamin D3, and calcium. Highest-leverage item is **glucosamine** — a new UK Biobank cohort article was published 2026-05-18, and the supplement currently sits at T2 / e=2 in `data.js` ("Evidence Has Changed"). If the cardiovascular-mortality signal is real, a tier review is warranted.

Operational concern carried from last week: the `weekly-literature-scan` and `weekly-regulator-alerts` scheduled tasks still aren't writing output files. See §6.

---

## 1. 🔴 Urgent

_None._ No FAERS signals, no regulator alerts, no overdue safety articles.

T4 safety pages were almost all refreshed in the 2026-05-17 batch (Kava, Kratom, Phenibut, Yohimbe, SARMs, BPC-157, Methylene blue, Bitter orange, Higenamine, Licorice high-dose, Black cohosh high-dose, Comfrey, DMAA/DMHA, High-dose fat-soluble A/E) — all 2 days old, well inside the 14-day safety cadence. Black cohosh high-dose moved from a polish-pass freshness date to an explicit `LAST_REVIEW` entry, closing the gap that existed last week.

---

## 2. 🟡 Tier review candidates

New evidence-driven articles published this week map to six supplements where the current `data.js` tier/evidence-score may be due for a conversation. Ranked by priority (popularity × significance × tier-distance).

### Priority 5 — Glucosamine / Chondroitin (T2, e=2, s=4)

- **New evidence:** Article `glucosamine-and-cardiovascular-mortality-what-the-uk-biobank-cohort-shows` (2026-05-18). UK Biobank cohort signal — if the all-cause and CV mortality association is robust, the current "Evidence Has Changed" myth-tier framing in article #39 is in tension with it.
- **Recommended next step:** Review whether the cardiovascular-mortality cohort evidence is enough to move the standalone joint-effect framing. Decision pivot: cohort ≠ RCT, so probably NO tier change, but the `desc` field in `data.js` should be updated to acknowledge the UK Biobank signal alongside the joint-pain null finding.

### Priority 4 — CoQ10 (Ubiquinol) (T2, e=3, s=4)

- **New evidence:** Article `coq10-in-heart-failure-q-symbio-follow-up-and-the-2024-2025-meta-analyses` (2026-05-18). Q-SYMBIO follow-up + recent meta-analyses converge on a heart-failure mortality benefit. Combined with the earlier `coq10-for-migraine-prevention` (2026-05-14, controlled-trial evidence), CoQ10 has two parallel evidence streams now reading positive.
- **Recommended next step:** Tier-upgrade candidate from T2 to T1 contingent on heart-failure effect size and replication. Likely outcome is keeping T2 but raising `e` from 3 → 4. Worth a 15-minute decision.

### Priority 4 — Berberine (T2, e=4, s=3)

- **New evidence:** Two articles this week — `berberine-for-sibo-the-2024-2025-evidence-update` (2026-05-17) and `glp-1-mimicking-supplements-what-berberine-gymnema-and-bitter-melon-actually-do` (2026-05-18). SIBO is a new clinical indication beyond the existing "Nature's Ozempic" framing; the GLP-1 mechanism piece is the mechanism story for the metabolic effect.
- **Recommended next step:** Already at T2/e=4 — likely no tier change, but the `desc` field should expand beyond the current glycemic-only framing to include SIBO and the GLP-1 mechanistic context. The "Berberine: Is It Really Nature's Ozempic?" article (id 18) is the one most likely to read as out-of-date now.

### Priority 4 — Magnesium (T1, e=4, s=5)

- **New evidence:** Article `magnesium-and-glycemic-control-what-the-2025-meta-analysis-actually-found` (2026-05-17). 2025 meta-analysis on glycemic control adds a confirmatory data point to existing T1 evidence.
- **Recommended next step:** No tier change (already T1), but worth folding the 2025 glycemic meta-analysis into the `desc` field, which currently focuses on cognition/anxiety/forms rather than glycemic control. Low-friction update.

### Priority 3 — Vitamin D3 (T1, e=4, s=4)

- **New evidence:** Three converging articles this week — `vitamin-d-and-cancer-mortality-what-the-vital-extended-follow-up-shows` (2026-05-17), `vitamin-d-and-respiratory-infections-the-post-vital-2024-2025-update` (2026-05-18), `vitamin-d-for-fall-prevention-in-older-adults-what-recent-meta-analyses-show` (2026-05-18).
- **Recommended next step:** No tier change (T1 stable, evidence reinforcing). The `desc` currently references the 2018 VITAL primary endpoint but not the extended follow-up. Refresh the description to reflect the post-VITAL evidence trio.

### Priority 3 — Calcium (T1, e=4, s=4)

- **New evidence:** Article `calcium-and-cardiovascular-risk-the-2024-cochrane-update` (2026-05-18). If the Cochrane update tightens or reverses prior CV-risk signals, the existing T1 framing may need a safety caveat.
- **Recommended next step:** Read the 2024 Cochrane finding direction — if neutral/reassuring, leave alone; if it amplifies CV risk, the `desc` should add the caveat that the safety score `s=4` already implies.

### Priority 2 — NMN / NAD+ precursors (T3, e=2, s=3)

- **New evidence:** Article `nmn-oral-bioavailability-what-the-2024-2025-plasma-response-trials-show` (2026-05-18). Plasma-response data — useful for the "are we even raising NAD" question, but does not address the "does raising NAD improve clinical outcomes" question that keeps NMN at T3.
- **Recommended next step:** No tier change. Bioavailability ≠ outcome. The article already exists; no `desc` update needed unless the trials report new outcome data beyond plasma.

### Priority 2 — Quercetin (T3, e=2, s=4)

- **New evidence:** Article `dasatinib-plus-quercetin-senolytic-therapy-the-2024-2025-human-trial-update` (2026-05-18). Senolytic-protocol trial update.
- **Recommended next step:** Quercetin standalone tier stays T3 (the senolytic protocol uses prescription dasatinib, not a standalone supplement context). Note in `desc` that the senolytic indication is now in human trials.

---

## 3. 🟢 Article update opportunities

Driven by new-article topic overlap with existing articles where citations may now be stale:

- **Berberine: Is It Really Nature's Ozempic? (article id 18)** — written before the SIBO + GLP-1-mechanism pieces. Refresh to add cross-references to articles #428 (SIBO) and #444 (GLP-1 mechanism).
- **Vitamin D: How Much Do You Really Need? (article id 12)** — predates the VITAL extended follow-up trio. Refresh to cross-link the three new 2026-05-17/18 articles (#429 cancer mortality, #455 fall prevention, #460 respiratory infections).
- **Glucosamine and Joint Pain: The Evidence Has Changed (article id 39)** — pre-UK Biobank cohort article. Worst-case the article's "Evidence Has Changed" frame reads as outdated against the new cardiovascular-mortality signal. Refresh required if §2 priority-5 tier review confirms the signal is robust.
- **CoQ10 and Statins (article id 49)** — does not currently reference Q-SYMBIO follow-up or recent heart-failure meta-analyses. Refresh with a "heart-failure context" subsection or cross-link article #458.

---

## 4. 📝 New article opportunities

- **Tier-3 / Tier-4 weight-loss stimulants explainer** — six T4 weight-loss-adjacent items were refreshed on 2026-05-17 (Bitter orange, Higenamine, DMAA/DMHA, Yohimbe, plus prior Phenibut and Tianeptine). A hub piece tying these together would let weekly FAERS deltas link to a single category page when stimulant signals re-emerge. Low priority but reusable.
- **GLP-1-mimicking supplements consumer explainer** — article #444 covers berberine/gymnema/bitter-melon at a research level. A consumer-facing translation ("Should you take berberine instead of Ozempic? Here's what the trials actually show.") would catch the SEO traffic this category is generating. Medium priority.
- **"Why FAERS Counts Don't Mean a Supplement Is Dangerous"** — carried from last week's report. Still unwritten. The 2026-05-19 FAERS scan again leans on a long methodology caveat about data-update lag; a permanent explainer would let future weekly FAERS reports link out instead of repeating the caveat.

---

## 5. 📋 Top-10 supplement article-recency check

Cadence policy: 14d safety / 30d Tier 1 / 60d Tier 2/3. Top-10 anchored on FAERS recent_90 volume.

| Supplement | Tier | `LAST_REVIEW` date | Age (d) | Cadence | Status |
|---|---|---|---:|---|---|
| Vitamin D3 | T1 | 2026-05-01 | 18 | 30d | ✅ within window — **refresh recommended** (post-VITAL trio, §2/§3) |
| Magnesium | T1 | _default 2026-05-01_ | 18 | 30d | ✅ within window — **refresh recommended** (2025 glycemic meta, §2) |
| Iron | T2 | _default 2026-05-01_ | 18 | 60d | ✅ within window |
| Melatonin | T2 | _default 2026-05-01_ | 18 | 60d | ✅ within window |
| Zinc | T1 | 2026-05-01 | 18 | 30d | ✅ within window |
| Multivitamins (healthy adults) | T3 | _default 2026-05-01_ | 18 | 60d | ✅ within window |
| High-dose fat-soluble vitamins (A, E) | T4 | 2026-05-17 | 2 | 14d | ✅ within window — gap from last week now closed |
| Alpha-Lipoic Acid (ALA) | T3 | _default 2026-05-01_ | 18 | 60d | ✅ within window |
| Probiotics | T2 | _default 2026-05-01_ | 18 | 60d | ✅ within window |
| Collagen for muscle strength | T3 | _default 2026-05-01_ | 18 | 60d | ✅ within window |

All ten within cadence. The two with explicit "refresh recommended" flags are not overdue — they have new evidence drops this week that warrant a `desc`-field update even though the date-based window hasn't expired.

---

## 6. ⚙️ Pipeline note (action for Yves) — repeated from last week

The `weekly-literature-scan` and `weekly-regulator-alerts` scheduled tasks **still aren't writing output files** — second consecutive week. This evidence-delta task is supposed to consume all three feeds (FAERS + literature + regulator). With two of the three silent, this report's signal density is bounded.

This week I worked around it by treating `article-generation-log.md` as a soft literature proxy — the team has been publishing 8–15 evidence-anchored articles per day, many of them tied to specific 2024-2025 trials/meta-analyses, so the de facto literature feed is the article pipeline. But that's a workaround, not a fix: the article pipeline is the *output* of evidence selection, not the *input*. It biases the delta toward "evidence we already decided to publish about" and misses "evidence we should know about but haven't acted on yet."

**Recommended next step:** Either (1) create the two missing scheduled tasks if they don't exist yet, or (2) check whether they exist but failed silently. If they exist and ran, verify their output-filename pattern matches `literature-scan-*.md` / `pubmed-scan-*.md` / `regulator-alerts-*.md` — this task's glob may be looking in the wrong place.

---

## Methodology / assumptions for this run

- **Literature substitute:** Used `article-generation-log.md` rows dated 2026-05-13 → 2026-05-18 as the literature proxy this week. Filtered to research-update/breakthrough/safety categories that reference specific 2024-2025 trials, meta-analyses, or cohort studies. Articles with no specific evidence anchor (general guides, myth-busting pieces without a citation hook) were excluded.
- **Tier/score lookup:** Pulled from the `S` array in `data.js` (line 479). Used the `t`, `e`, `s` fields. Last-reviewed dates from the `LAST_REVIEW` object (line 388), with fallback to `LAST_REVIEW_DEFAULT = '2026-05-01'`.
- **Priority scoring** (1-5): heuristic composite of popularity (FAERS volume + Tier-1/2 status), significance (meta-analysis > cohort > single RCT > mechanism), and tier-distance (how far a current tier sits from where the new evidence might move it). Not a formal model.
- **FAERS:** As noted in `faers-signals-2026-05-19.md`, the OpenFDA database did not refresh between 2026-05-12 and 2026-05-19 — all-time totals unchanged across all 50 supplements. So the FAERS feed effectively contributed zero new signal this week, beyond confirming the data-lag pattern.
- **No PubMed/regulator MCP queries made:** The task brief reads existing weekly outputs, not original literature. Spinning up direct PubMed queries to fill the gap was out of scope and would also duplicate what `weekly-literature-scan` is supposed to do once it's running.

**Next run** should still expect a non-empty action list — the article pipeline cadence (~8 articles/day) means new evidence anchors keep landing. But the report quality will improve substantially once the literature-scan and regulator-alerts feeds come online.

---

_Generated 2026-05-19 by the weekly evidence-delta scheduled task. Next run: 2026-05-26._
