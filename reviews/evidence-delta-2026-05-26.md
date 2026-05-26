# Evidence Delta — 2026-05-26

Closes the loop between this week's research-feed outputs and the SupplementScore database. Reads `reviews/` for new findings, maps them to `data.js` records, and produces a prioritized action list.

## Inputs scanned

| Feed | This week's file | Status |
|---|---|---|
| `weekly-faers-supplement-signals` | `reviews/faers-signals-2026-05-26.md` | Present — no signals, no watch list (data-lag artifact persists) |
| `weekly-literature-scan` | `reviews/literature-scan-*.md` / `pubmed-scan-*.md` | **Missing** — third consecutive week without output |
| `weekly-regulator-alerts` | `reviews/regulator-alerts-*.md` | **Missing** — third consecutive week without output |

**Adjunct used as literature proxy this week:** `article-generation-log.md` rows dated 2026-05-20 → 2026-05-24 (next-week articles 2026-05-25/26 not yet in log under the new Stack/Condition/Top-10 quota — see project memory `project_article_category_focus_2026_05_25`). 60 new articles published in the window, of which ~35 are explicit Research-Update/Safety/Breakthrough entries that anchor on 2024-2026 RCTs, meta-analyses, or cohort updates.

## Headline

No safety flags — FAERS came in clean again with the same OpenFDA refresh-lag artifact (r90 counts decayed −18% to −43% across high-volume entries; not a real adverse-event drop). The article pipeline surfaced **eleven evidence drops on ten core supplements**, with two stand-outs:

- **Berberine — 17-RCT meta-analysis on NAFLD** (2026-05-24). Tier-2/e=4 supplement. A 17-trial confirmatory result on a new clinical indication (liver enzymes + steatosis) is the strongest single signal in this week's window.
- **Curcumin (bioavailable) — non-inferiority RCT vs diclofenac for knee OA + head-to-head vs SSRI for major depression** (2026-05-24 + 2026-05-21). Tier-2/e=3. Two active-comparator wins in the same week is unusual; pulls toward `e=3→4`. Counter-signal: `curcumin-induced-liver-injury-the-dilin-case-series` (2026-05-20) reinforces the current `s=4` safety score.

Operational concern carried from last two weeks: the `weekly-literature-scan` and `weekly-regulator-alerts` scheduled tasks **still aren't writing output files**. See §6.

---

## 1. 🔴 Urgent

_None._ No FAERS signals, no regulator alerts, no overdue safety articles.

All 31 Tier-4 supplements with explicit `LAST_REVIEW` entries are within the 14-day safety cadence (oldest: Licorice high-dose, Black cohosh high-dose, Essential oils, Androstenedione, 1,3-DMBA at 2026-05-18 → 8 days). Top-10-by-FAERS-volume safety pages are all fresh — Tianeptine 2026-05-22 (4d), Methylene blue 2026-05-24 (2d), High-dose A/E 2026-05-20 (6d).

---

## 2. 🟡 Tier review candidates

New evidence-driven articles this week map to ten supplements where the current `data.js` tier/evidence-score may be due for a conversation. Ranked by priority (popularity × significance × tier-distance).

### Priority 5 — Berberine (T2, e=4, s=3)

- **New evidence:** `berberine-for-nafld-what-17-rcts-show-on-liver-enzymes-and-steatosis` (2026-05-24). 17-RCT meta-analysis on a new clinical indication (NAFLD — ALT/AST + hepatic steatosis on imaging). Combines with last week's SIBO + GLP-1-mechanism pieces.
- **Recommended next step:** No tier change (Tier-2 safety ceiling holds — drug-interaction caveats with statins/metformin still apply). But `e` is a candidate to move from 4 to "4 with active expansion" — and the `desc` field needs to acknowledge NAFLD as a third validated indication alongside glycemic/lipid effects. The existing description already references the 2025 metabolic review; fold the 17-RCT NAFLD result in alongside it.

### Priority 5 — Curcumin (bioavailable form) (T2, e=3, s=4)

- **New evidence:** Three drops in five days — `curcumin-for-knee-osteoarthritis-vs-diclofenac-the-non-inferiority-trial-record` (2026-05-24, active-comparator non-inferiority), `curcumin-for-major-depression-the-head-to-head-ssri-trial-record` (2026-05-21, active-comparator head-to-head), `curcumin-phytosome-vs-piperine-enhanced-curcumin-the-absorption-head-to-head` (2026-05-20, formulation comparison). Counter-signal: `curcumin-induced-liver-injury-the-dilin-case-series` (2026-05-20).
- **Recommended next step:** Tier-upgrade candidate from `e=3` → `e=4` on the strength of two active-comparator trials in the same week. Tier stays T2 — the DILIN liver-injury case series is consistent with the current `s=4` and shouldn't move it lower, but the `desc` field needs an explicit hepatotoxicity caveat (currently it doesn't have one). Highest-leverage update of the week.

### Priority 4 — Vitamin D3 (T1, e=4, s=4)

- **New evidence:** `vitamin-d-and-falls-in-older-adults-the-conflicting-sturdy-and-vital-trial-record` (2026-05-21) — STURDY trial signaled *harm* at higher doses, VITAL was null. Plus `vitamin-d-for-long-covid-recovery-what-the-2025-2026-rcts-show` (2026-05-24) and `vitamin-d-dosing-daily-vs-weekly-vs-monthly-bolus-pharmacokinetics` (2026-05-20).
- **Recommended next step:** No tier change (T1 holds — VITAL extended follow-up still positive for autoimmune/cancer mortality from last week's review). But the `desc` should drop the implicit fall-prevention framing — STURDY's harm signal at high doses means fall prevention is now actively *against* high doses, not for them. This is the third consecutive week Vitamin D3 has had new evidence drops; LAST_REVIEW is still at default 2026-05-01 (25 days old) — bump the explicit `LAST_REVIEW` entry to 2026-05-26.

### Priority 4 — Iron (T2, e=4, s=3)

- **New evidence:** Three pieces this week — `iron-supplement-forms-guide-ferrous-sulfate-vs-bisglycinate-vs-heme-iron` (2026-05-20, Guide), `iron-overload-from-daily-high-dose-supplements-why-most-men-do-not-need-a-65-mg-tablet` (2026-05-24, Safety), `lactobacillus-plantarum-299v-iron-absorption-ibs-and-the-strain-specific-trial-record` (2026-05-24, absorption mechanism).
- **Recommended next step:** No tier change. The iron-overload piece sharpens the safety framing — `desc` should add an explicit "most men do not need supplemental iron" caveat (the s=3 already implies caution but the current text doesn't say it directly). The L. plantarum 299v co-ingestion mechanism is a useful cross-reference. LAST_REVIEW still at default — bump to 2026-05-26.

### Priority 4 — Selenium (T2, e=3, s=3)

- **New evidence:** `selenium-and-prostate-cancer-the-select-trial-long-term-follow-up` (2026-05-21). SELECT originally found increased prostate cancer risk in the selenium-only arm; long-term follow-up may resolve whether that signal persists.
- **Recommended next step:** Probably no score change (s=3 already encodes caution from the original SELECT data), but if the long-term follow-up confirms the harm signal, the `desc` should call SELECT out by name. Currently the description mentions selenium as a trace mineral without naming the trial that established the upper-bound caution. Connects to `project_top100_audit_2026_05_25` Zinc→Prostate caution work — the same prostate-cancer carve-out logic applies here.

### Priority 3 — Saw palmetto (T2, e=2, s=4)

- **New evidence:** `saw-palmetto-plus-nettle-root-for-bph-the-2024-2025-combination-trial-evidence` (2026-05-21). Combination evidence is consistent with a moderate BPH effect — modestly confirmatory.
- **Recommended next step:** Tier-upgrade candidate from `e=2` → `e=3` *only if* the combination data is interpreted as confirming the standalone effect. Conservative read: combination ≠ standalone, so leave at e=2 and update `desc` to cross-reference Stinging nettle root co-ingestion.

### Priority 3 — Tongkat Ali (T3, e=2, s=3)

- **New evidence:** `tongkat-ali-for-testosterone-the-2024-2025-trial-evidence-update` (2026-05-20). Trial-evidence update on the testosterone indication.
- **Recommended next step:** Candidate for `e=2` → `e=3` if the trial record is consistently positive on free or total T. Tier-3 with rising evidence is exactly the watchlist segment this delta task is meant to surface. Worth a 15-min decision after reading the article body.

### Priority 3 — L. plantarum 299v (T2, e=4, s=4)

- **New evidence:** `lactobacillus-plantarum-299v-iron-absorption-ibs-and-the-strain-specific-trial-record` (2026-05-24). Strain-specific confirmation on two indications (iron absorption + IBS-D).
- **Recommended next step:** No tier change (already e=4). Confirm the existing `desc` covers both indications; if not, expand. This entry exists separately from generic "Probiotics" (T2, e=3) — the data-side benefit of keeping strain-specific entries is exactly this kind of distinct trial-record update.

### Priority 2 — Pyruvate / calcium pyruvate (T3, e=2, s=4)

- **New evidence:** `pyruvate-for-endurance-and-body-composition-what-the-trial-record-shows-in-2026` (2026-05-24). Trial-record review.
- **Recommended next step:** Most likely no tier change (T3/e=2 is consistent with the "small effects, mixed evidence" pyruvate story). Read article body to confirm; if 2026 trial record is unambiguously null, consider e=2 → e=1.

### Priority 2 — Resveratrol (T3, e=1, s=3)

- **New evidence:** `resveratrol-and-metabolic-markers-the-2024-2025-glucose-and-lipid-trial-update` (2026-05-21). Metabolic-marker trial update.
- **Recommended next step:** Candidate for `e=1` → `e=2` *only if* the 2024-2025 trials are consistently positive on glucose/lipid endpoints. Resveratrol has a long history of bioavailability-vs-clinical-effect mismatch; conservative read keeps at e=1.

### Priority 2 — Beta-glucan (1,3/1,6) (T2, e=3, s=5)

- **New evidence:** `yeast-beta-glucan-vs-oat-beta-glucan-immune-and-cholesterol-trial-divergence` (2026-05-21). Mechanism-split — yeast for immune, oat for cholesterol. Refines existing single-entry framing.
- **Recommended next step:** No tier change. `desc` should acknowledge that the two forms have different clinical targets — currently the entry treats them as a single supplement.

---

## 3. 🟢 Article update opportunities

Driven by new-article topic overlap with existing articles where citations may now be stale:

- **Berberine: Is It Really Nature's Ozempic? (article id 18)** — repeat from last week + now also missing the NAFLD 17-RCT cross-reference. Refresh to cross-link the 2026-05-17 SIBO piece, 2026-05-18 GLP-1 mechanism piece, and 2026-05-24 NAFLD meta-analysis.
- **CoQ10 and Statins (article id 49)** — carried from last week; still missing the Q-SYMBIO follow-up and 2024-2025 heart-failure meta-analyses cross-link. No new CoQ10 evidence this week, so this is now the third week the item has been open.
- **Vitamin D: How Much Do You Really Need? (article id 12)** — carryover from last week, now also needs the STURDY/VITAL fall-prevention conflict and the long-COVID RCT update. The article's "how much" framing should explicitly distinguish replacement (deficiency) from bolus-dose fall-prevention (now harm-signal).
- **Glucosamine and Joint Pain: The Evidence Has Changed (article id 39)** — carryover from last week. Still no UK Biobank cohort cross-reference. No new glucosamine evidence this week.
- **Curcumin standalone article** — if it exists, refresh to cite the 2026-05-21 SSRI head-to-head trial and 2026-05-24 diclofenac non-inferiority trial. Cross-link to 2026-05-20 DILIN liver-injury safety piece for balanced framing.

---

## 4. 📝 New article opportunities

- **"Should you take berberine instead of Ozempic?" consumer translation** — carried from last week, still unwritten. Now even more relevant with the NAFLD 17-RCT result expanding berberine's evidence base. Medium priority.
- **"Why FAERS counts don't mean a supplement is dangerous"** — carried from last 2 weeks. The 2026-05-26 FAERS scan again leans on the methodology caveat about OpenFDA refresh lag; a permanent explainer would let future FAERS reports link out instead of repeating it. Medium priority.
- **Curcumin safety + efficacy combined explainer** — three new evidence drops this week including a safety case-series piece. A consumer-facing piece that holds the SSRI head-to-head and DILIN data together would catch the "is curcumin actually safe?" search intent. Low/medium priority.
- **Vitamin D dosing decision-tree** — given STURDY/VITAL conflict at high doses, a decision-tree piece that distinguishes "correct a deficiency" from "prevent X outcome" would let the existing tier-1 framing breathe. Medium priority.

Note: Article generation policy changed 2026-05-25 to Stack/Condition/Top-10-Lists only (see `project_article_category_focus_2026_05_25`). The new-article opportunities above are *content gaps*, not generator-task slots — they would need to be authored manually or via a one-off generation.

---

## 5. 📋 Top-10 supplement article-recency check

Cadence policy: 14d safety / 30d Tier 1 / 60d Tier 2/3. Top-10 anchored on FAERS recent_90 volume.

| Supplement | Tier | `LAST_REVIEW` date | Age (d) | Cadence | Status |
|---|---|---|---:|---|---|
| Vitamin D3 | T1 | _default 2026-05-01_ | 25 | 30d | ✅ within window — **refresh recommended** (STURDY/VITAL + long-COVID + dosing, §2) — bump explicit LAST_REVIEW |
| Magnesium | T1 | 2026-05-26 | 0 | 30d | ✅ fresh — no action |
| Melatonin | T2 | _default 2026-05-01_ | 25 | 60d | ✅ within window |
| Iron | T2 | _default 2026-05-01_ | 25 | 60d | ✅ within window — **refresh recommended** (form-guide + overload + 299v, §2) — bump explicit LAST_REVIEW |
| Zinc | T1 | 2026-05-01 | 25 | 30d | ✅ within window (5d remaining) |
| High-dose fat-soluble vitamins (A, E) | T4 | 2026-05-20 | 6 | 14d | ✅ within window |
| Collagen for muscle strength | T3 | 2026-05-01 | 25 | 60d | ✅ within window |
| Alpha-Lipoic Acid (ALA) | T3 | 2026-05-01 | 25 | 60d | ✅ within window — minor refresh option (Hirata-disease safety piece 2026-05-20) |
| Berberine | T2 | _default 2026-05-01_ | 25 | 60d | ✅ within window — **refresh recommended** (NAFLD 17-RCT, §2 priority 5) — bump explicit LAST_REVIEW |
| Tianeptine ("gas station heroin") | T4 | 2026-05-22 | 4 | 14d | ✅ within window |

All ten within cadence. Three with "refresh recommended" flags (Vitamin D3, Iron, Berberine) are not overdue by date — they have substantive new evidence this week that warrants a `desc`-field update *and* an explicit `LAST_REVIEW` bump (currently riding the default). Note: Zinc at age 25/30 will tip overdue around 2026-05-31; pre-empt next week.

---

## 6. ⚙️ Pipeline note (action for Yves) — third week running

The `weekly-literature-scan` and `weekly-regulator-alerts` scheduled tasks **still aren't writing output files** — third consecutive week. This evidence-delta task is supposed to consume three feeds (FAERS + literature + regulator). With two of the three silent, signal density is bounded.

This week I again worked around it by treating the article-generation log as a soft literature proxy. That continues to produce a useful action list because the article pipeline is itself evidence-anchored, but it biases the delta toward "evidence we already decided to publish about" and misses "evidence we should know about but haven't acted on yet." Three weeks of the same workaround is a real gap — the literature-scan and regulator-alerts tasks should be diagnosed.

**Recommended next step (carry-over):** Either (1) verify the two missing scheduled tasks exist in the scheduled-tasks list (`mcp__scheduled-tasks__list_scheduled_tasks`) and are enabled, or (2) check whether they exist but failed silently — look in this task's runtime log for error rows. If they exist and ran, confirm the output-filename pattern matches `literature-scan-*.md` / `pubmed-scan-*.md` / `regulator-alerts-*.md` — this task's glob may be looking in the wrong place.

---

## Methodology / assumptions for this run

- **Literature substitute:** Used `article-generation-log.md` rows dated 2026-05-20 → 2026-05-24 (60 rows total; filtered to ~35 Research-Update / Safety / Breakthrough entries with explicit 2024-2026 trial/meta-analysis/cohort anchors). Rows 2026-05-13 → 2026-05-19 were covered by last week's evidence-delta and are not double-counted.
- **Tier/score lookup:** Pulled from the `S` array (line 606 in `data.js`). Used `t`, `e`, `s`, `r`, `o`, `c`, `d` fields. Last-reviewed dates from `LAST_REVIEW` (line 514), with fallback to `LAST_REVIEW_DEFAULT = '2026-05-01'`.
- **Priority scoring** (1-5): heuristic composite of popularity (FAERS volume + Tier-1/2 status), significance (meta-analysis > active-comparator RCT > single RCT/cohort > mechanism), and tier-distance (how far the current tier sits from where new evidence might move it). Not a formal model.
- **FAERS:** As noted in `faers-signals-2026-05-26.md`, OpenFDA's refresh lag persists — recent_90 counts decayed −18% to −43% across high-volume entries (Vitamin D3, Magnesium, Melatonin, Iron, Zinc). All-time totals shifted on only 6/50 supplements within ±2 reports. The FAERS feed contributed zero new signal this week beyond confirming the lag pattern. If next week's r90 *increases* relative to this week (rather than continuing to decay), that would indicate an OpenFDA refresh has landed and would be worth re-running on the new baseline.
- **No direct PubMed/regulator queries made:** Task brief reads existing weekly outputs, not original literature. Spinning up direct PubMed/regulator-source queries to fill the gap was out of scope and would also duplicate what `weekly-literature-scan` and `weekly-regulator-alerts` are supposed to do.

**Next run** (2026-06-02) should expect a similar signal density unless the literature-scan and regulator-alerts feeds come online. The Stack/Condition/Top-10-only article policy that took effect 2026-05-25 means the article-generation-log proxy will lose its Research-Update/Safety/Breakthrough density going forward — the literature-scan feed becoming functional is now a hard dependency for this task's quality.

---

_Generated 2026-05-26 by the weekly evidence-delta scheduled task. Next run: 2026-06-02._
