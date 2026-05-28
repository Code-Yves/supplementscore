# Subfolder Registration — 2026-05-28

**Run:** automated, 02:55 UTC (daily-subfolder-registration)
**Scope:** `compare/`, `condition/`, `for/`, `stack/`, `m/`
**Outcome:** No-op on disk — zero orphans across all 5 sections. No edits to any index/sitemap. Several findings flagged below for review.

---

## ⚠ Findings at the top

### Regression — entries vanished from index (informational)
Two sections show large drops in linked-entry count compared to the prior log entry (2026-05-20). These are below the strict P0 threshold but worth surfacing because they exceed the heuristic in the spec:

| Section | Linked 2026-05-20 | Linked today | Δ |
|---|---|---|---|
| condition | 122 | 55 | **−67** |
| for | 50 | 46 | −4 |

Both drops are consistent with intentional upstream cleanup recorded in memory: wrapper-typography unify on condition pages (2026-05-25) and `/for/` persona-page deprecation (2026-05-25, per the article-catalog focus shift). No files are missing relative to current disk state — every disk file is linked. **Not auto-escalated to P0** because the disk inventory matches the index inventory (no actual desync), but logged here so the maintainer can confirm the cleanup was intentional.

### Sitemap drift — `sitemap-conditions.xml` has 78 stale entries
`sitemap-conditions.xml` references 133 condition URLs, but only 55 exist on disk. 78 URLs in the sitemap point to deleted pages (e.g. `periodontal-disease.html`, `sleep-apnea-adjunct.html`, `mild-cognitive-impairment.html`). Likely fallout from the same cleanup work. **Not auto-pruned** in this run — the spec is conservative about destructive sitemap edits, and 78 deletions exceeds what a routine registration run should attempt without human review. Recommend a dedicated sitemap-reconciliation pass.

### Auto-rollbacks this run
None.

---

## Per-section detail

| Section | Disk files | Linked in index | Orphans detected | Registered this run | Backlog remaining |
|---|---|---|---|---|---|
| compare   | 127 | 127 | 0 | 0 | 0 |
| condition | 55  | 55  | 0 | 0 | 0 |
| for       | 46  | 46  | 0 | 0 | 0 |
| stack     | 6   | 6   | 0 | 0 | 0 |
| m         | 10  | 10  | 0 | 0 | 0 |
| **Total** | **244** | **244** | **0** | **0** | **0** |

All five section folders are fully reconciled — every `<section>/*.html` file on disk is already linked from its `<section>/index.html`. Generators and index pages are in lockstep.

---

## Folder indexes created this run
None — all 5 section indexes already exist:
- `compare/index.html` ✓
- `condition/index.html` ✓
- `for/index.html` ✓
- `stack/index.html` ✓
- `m/index.html` ✓

---

## Main-nav additions this run
None.

The canonical footer nav (`_partials/footer.html`, propagated via `scripts/sync_footers.py`) currently links to: Home / Compare / Research / Profile / About. Eligible candidates for promotion under the spec criteria (folder ≥3 files, index exists, not yet linked from main `index.html`):

| Section | Files | Index | Linked from main? | Recommend? |
|---|---|---|---|---|
| condition | 55 | ✓ | ✓ (article-card on index, not footer) | No — already discoverable |
| for | 46 | ✓ | ✗ | **No** — `/for/` persona pages deprecated per memory (2026-05-25) |
| m | 10 | ✓ | ✗ | **Yes** — recommend adding "Medications" to footer nav |
| stack | 6 | ✓ | ✓ (article-card on index) | No — already discoverable |

Per the "max 1 nav addition per run" rule and the partial-canonicalization rule (`_partials/footer.html` is single source of truth, propagated via `sync_footers.py`), this run defers the `m/` promotion to a maintainer-reviewed change. Editing the partial here would propagate a footer change across ~hundreds of pages, which is outside the safety envelope of a registration-only autonomous task. **Suggested next step (manual):** add `<a href="/m/index.html">Medications</a>` to `_partials/footer.html` between Compare and Research, then run `python3 scripts/sync_footers.py`.

---

## Sitemap status

| Sitemap | Disk count | In sitemap | Missing from sitemap | Stale in sitemap |
|---|---|---|---|---|
| sitemap-compare.xml     | 127 | 127 | 0 | 0 |
| sitemap-conditions.xml  | 55  | 133 | 0 | **78** ⚠ |
| sitemap-for.xml         | 46  | 46  | 0 | 0 |
| sitemap-stacks.xml      | 6   | 6   | 0 | 0 |
| sitemap-medications.xml | 10  | 10  | 0 | 0 |

`sitemap-index.xml` references each per-section sitemap — verified.

**Entries added this run:** 0 (no orphans to register).

The 78 stale entries in `sitemap-conditions.xml` are addressed in the top-of-report finding.

---

## Cache buster
Not bumped — no `<section>/index.html` changes made, no orphan registrations occurred, so no SW cache invalidation needed.

---

## Spot-checked diffs
N/A — no files modified this run. (Spec requires 3 spot-checks when edits happen; none were performed.)

---

## Forbidden-action audit
- ❌ No orphan files deleted (n/a — none detected)
- ❌ No tier ratings or data fields changed
- ❌ No git commits made
- ❌ Light-mode-only confirmed for any index pages touched (none touched)
- ❌ Max 1 nav addition rule respected (0 made, 1 recommended for manual review)
