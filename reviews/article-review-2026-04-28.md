# Article Review — 2026-04-28

**Status:** No-action run. The 22-day cycle is intact and no articles meet the
selection criterion today.

## Selection rule (from SKILL.md)

> Pick the 10 articles with the oldest last-reviewed dates that haven't been
> reviewed in the last 20 days (10/day × 221 articles ≈ 22-day cycle).

## State of the corpus

- Articles in `index.html`: **241** (the SKILL still says 221; the corpus has
  grown — flagging for the next time the SKILL is updated).
- Every article carries a `<!-- last-reviewed: YYYY-MM-DD -->` comment.
- Maximum age of any review: **4 days** (the oldest is 2026-04-24).
- Articles ≥20 days since review: **0**.

### Last-reviewed distribution

| Date       | Count |
|------------|------:|
| 2026-04-24 |    30 |
| 2026-04-25 |    40 |
| 2026-04-26 |   112 |
| 2026-04-27 |    59 |
| **Total**  | **241** |

### Category distribution

| Category     | Count |
|--------------|------:|
| breakthrough |    57 |
| guide        |    48 |
| myth         |    30 |
| kids         |    17 |
| safety       |    14 |
| (no `c` set) |    75 |

The 75 articles missing a category in `data.js` are likely the most recently
added titles (IDs above the original 166-article block). Worth a one-time
back-fill but not in scope for an article-accuracy run.

## 10 articles that will be eligible first

These are the next on the queue once they pass the 20-day window
(eligible from **2026-05-14** onward).

| ID | Category     | Last reviewed | Title (from data.js) |
|---:|--------------|---------------|----------------------|
|  1 | (unset)      | 2026-04-24    | (no h1 / no data.js entry — verify) |
|  2 | (unset)      | 2026-04-24    | (no h1 / no data.js entry — verify) |
|  3 | (unset)      | 2026-04-24    | (no h1 / no data.js entry — verify) |
|  4 | safety       | 2026-04-24    | CDC Warning: Kava Poisoning Calls Have Climbed Sharply — Here's What the Data Actually Says |
|  5 | breakthrough | 2026-04-24    | Creatine for Brain Health: What the New Meta-Analyses Actually Show |
|  6 | breakthrough | 2026-04-24    | (no h1 / no data.js entry — verify) |
|  7 | guide        | 2026-04-24    | Omega-3: Fish Oil vs Algal Oil vs Krill Oil — Which Should You Take? |
|  8 | breakthrough | 2026-04-24    | The Truth About Collagen Supplements: What 13 Clinical Trials Actually Show |
|  9 | (unset)      | 2026-04-24    | (no h1 / no data.js entry — verify) |
| 10 | guide        | 2026-04-24    | Magnesium Forms Explained: Glycinate vs Citrate vs Threonate vs Oxide |

The IDs missing both an `<h1>` and a `data.js` entry should be inspected before
the next cycle — they may be hero-only stubs or articles whose titles live in a
different element. None of that affects today's run.

## Why no edits today

Every article was reviewed within the last 4 days. Re-running fact-checks on
content that was just verified would (a) consume PubMed / regulator-API budget
without producing new accuracy signal, (b) churn `index.html` and `data.js`
needlessly, and (c) violate the spirit of the 22-day cadence the SKILL
prescribes. The autonomous-run instruction "When in doubt, producing a report
of what you found is the correct output" applies here.

## Next scheduled action

The first batch of 10 will become eligible on **2026-05-14** (20 days after
the 2026-04-24 reviews). Between now and then, this scheduled run will keep
producing a short status report each day.

If the user wants to override the 20-day floor and force daily reviews,
update the SKILL.md selection rule.

## Files touched this run

- Wrote: `reviews/article-review-2026-04-28.md` (this file)
- No edits to `index.html` or `data.js`.
