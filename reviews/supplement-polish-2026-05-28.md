# Weekly supplement-page polish — 2026-05-28 (ISO 2026-W22)

## Scope note (auto-applied, important)

The task SKILL.md targets `supplementscore-repo/s/` and describes syncing
**tier badge, sub-scores, description, dose, tips, cycle** plus injecting
**"Featured in our articles"** / pairing cross-link sections on each detail
page. As of 2026-05-25 every file in `s/` is a 15-line redirect tombstone
that forwards to `/supplement.html?slug=<slug>` — the dynamic renderer in
`supplement.html` now pulls all of that content directly from `data.js`
(see memory `project_s_legacy_tombstone_2026_05_25.md`).

That means most of the SKILL.md polish actions no longer have a render
surface inside `/s/` to act on:

| SKILL action                | Still applies on tombstones?           |
| --------------------------- | -------------------------------------- |
| Sync tier / sub-scores      | No — tombstone has no score block      |
| Sync desc / dose / tips     | No — tombstone has no body content     |
| Add "Featured in" links     | No — tombstone has no body content     |
| Add pairing cross-links     | No — tombstone has no body content     |
| Heading hierarchy           | N/A — only `<title>` + redirect `<p>`  |
| Image attributes / og:image | N/A — tombstone has no `<img>` / og    |
| `<!-- last-reviewed: -->`   | **Yes — added on all 10**              |
| Microcopy / typo sweep      | **Yes — caught a real escape bug**     |

I executed what *does* still apply (microcopy + last-reviewed stamp),
audited each pick at the data-layer for cross-link coverage, and logged
data-layer drift to the escalation queue. Recommend updating SKILL.md so
this task points at the dynamic renderer (`supplement.html`) and at
`data.js` itself rather than at the tombstoned `/s/` directory.

---

## Pick rationale (10 supplements, seeded by 2026-W22)

W20 and W21 exclusions honored from `reviews/supplement-polish-history.json`
(20 supplements skipped).

**Forced picks (7)** — every tombstone with double-escaped HTML entities
(`&amp;#39;` instead of `&#39;`) in title or link text. These are
concrete, high-confidence fixes:

1. `2-fucosyllactose`
2. `brewer-s-yeast`
3. `chromium-gtf`
4. `devil-s-claw`
5. `lion-s-mane-mushroom`
6. `lion-s-mane`
7. `st-john-s-wort`

**Filler picks (3)** — deterministic shuffle of the remaining 525-page
pool seeded by `sha256("2026-W22")`:

8. `cistus-incanus`
9. `uridine-monophosphate`
10. `zinc`

---

## Per-page verdict

| # | Slug                      | Verdict             | Changes |
|---|---------------------------|---------------------|---------|
| 1 | `2-fucosyllactose`        | escalated (orphan)  | 2       |
| 2 | `brewer-s-yeast`          | synced              | 2       |
| 3 | `chromium-gtf`            | synced              | 2       |
| 4 | `devil-s-claw`            | synced              | 2       |
| 5 | `lion-s-mane-mushroom`    | escalated (slug)    | 2       |
| 6 | `lion-s-mane`             | synced              | 2       |
| 7 | `st-john-s-wort`          | escalated (orphan)  | 2       |
| 8 | `cistus-incanus`          | largely-reaffirmed  | 1       |
| 9 | `uridine-monophosphate`   | largely-reaffirmed  | 1       |
| 10| `zinc`                    | largely-reaffirmed  | 1       |

Total changes applied: **17** edits across 10 files.
Backups written: `s/<slug>.html.bak-20260528-utc` for every modified file.

---

## Change detail (high-confidence, auto-applied)

For all 10 picks:

- Added `<!-- last-reviewed: 2026-05-28 -->` before `</head>` (was missing
  on every tombstone — they predate the convention).

For the 7 double-escape picks (1–7 above):

- Replaced `&amp;#39;` with `&#39;` in the `<title>` and in the visible
  link text inside `<body>`. Before the fix, browsers were rendering
  literal `&#39;` instead of the intended apostrophe — e.g. `Lion&#39;s
  mane` instead of `Lion's mane`.

No prose body content existed to sweep for doubled spaces / doubled
punctuation. No `<img>`, `og:image`, or heading-hierarchy fixes were
possible (tombstones contain none of these).

---

## Cross-link audit (data layer — escalations only, nothing pushed)

Because the page itself can't carry cross-links, the audit ran on
`data.js → ARTICLE_MAP`, `pairings-data.js`, and a grep over `a/*.html`
mentions. Findings logged here for the next `supplement-trending-review`
pass — not auto-corrected.

| Slug                      | ARTICLE_MAP IDs | Pairings | Articles in `/a/` mentioning name |
|---------------------------|------------------|----------|------------------------------------|
| `2-fucosyllactose`        | 0                | 0        | 0  *(name absent from data.js)*    |
| `brewer-s-yeast`          | 0                | 0        | 0                                  |
| `chromium-gtf`            | 0                | 0        | 0                                  |
| `devil-s-claw`            | 0                | 0        | 0                                  |
| `lion-s-mane-mushroom`    | 2*               | 0        | 0  *(slug ≠ data.js short-form)*   |
| `lion-s-mane`             | 2*               | 0        | 0                                  |
| `st-john-s-wort`          | 0                | 0        | 0  *(name absent from data.js)*    |
| `cistus-incanus`          | 0                | 0        | 0                                  |
| `uridine-monophosphate`   | 0                | 1        | 0                                  |
| `zinc`                    | 16               | 10       | **123**                            |

\* `lion-s-mane*` is mapped via the canonical name
  `Lion's mane (Hericium erinaceus, fruiting body)`.

---

## Escalation queue

These need `supplement-trending-review` (or a human) to reconcile —
**not auto-fixed** per the SKILL.md guardrail.

### Orphan tombstones (page → no data.js entry)

Tombstone exists in `/s/` but the underlying supplement was removed from
`data.js`. The redirect target (`/supplement.html?slug=<slug>`) now
renders the "Supplement not found" message via
`supplement-detail.js` line 129.

- **`s/st-john-s-wort.html`** — no SUPS entry for `St. John's Wort`
  (or any apostrophe / period variant). Either restore the entry or
  retire the tombstone via a 410 / sitemap removal.
- **`s/2-fucosyllactose.html`** — no SUPS entry for `2'-Fucosyllactose`.
  Per memory `project_article_generator_dedup.md` the user has overridden
  the "never delete orphans" rule for *confirmed title-dups* — these are
  not dups, they are simply unbacked, so I left them in place.

### Broken-slug tombstone (page → data.js entry exists but with a
different slug)

- **`s/lion-s-mane-mushroom.html`** redirects to
  `/supplement.html?slug=lion-s-mane-mushroom`. `getSupplement()` in
  `search-index.js` tries both the full canonical slug
  (`lion-s-mane-hericium-erinaceus-fruiting-body`) and the short-form
  slug (`lion-s-mane`). Neither equals `lion-s-mane-mushroom`, so the
  page renders "Supplement not found".
  Fix options: (a) point the redirect to `?slug=lion-s-mane`, or
  (b) add a third short-form alias to `getSupplement()` that strips a
  trailing noun like "mushroom" / "extract". `s/lion-s-mane.html` works
  correctly via the existing short-form fallback, so duplicates the same
  destination — consider deduping.

### Under-linking in `ARTICLE_MAP` (page-level OK, data-level thin)

Pages whose detail view will render with *zero* article chips because
`ARTICLE_MAP['<name>']` is missing or empty. Cross-checked against
grepping for the supplement name in `a/*.html`:

- `brewer-s-yeast` — 0 articles mapped. /a/ grep also returns 0 — site
  has no editorial coverage at all; this is consistent, not a gap.
- `chromium-gtf` — 0 articles mapped. /a/ grep 0. Consistent.
- `devil-s-claw` — 0 articles mapped. /a/ grep 0. Consistent.
- `cistus-incanus` — 0 articles mapped. /a/ grep 0. Consistent.
- `uridine-monophosphate` — 0 articles mapped, but **1 pairing** in
  `pairings-data.js` (with Choline + Omega-3 EPA/DHA). Consider adding
  an ARTICLE_MAP entry once the nootropic stack article is written.
- **`zinc` — major drift**. 16 article IDs mapped, but **123 articles in
  `a/` actually mention "Zinc"**. The ARTICLE_MAP coverage is
  ~13% of the editorially-present pool. This is the biggest gap in
  today's pick set — flag for a dedicated reverse-lookup pass.

### No safety-claim conflicts found

Tombstones carry no prose, so the "safety claim on page vs data.js
desc" check is vacuously clean for all 10. Re-run this lane against the
dynamic renderer once the SKILL.md is updated.

### No pairing contradictions found

`zinc` has 10 pairings (Calcium, Coffee tannins, Copper×2, Elderberry,
…). None contradict each other within `pairings-data.js`. Other picks
have ≤1 pairing or none.

---

## Cross-links added (per page)

Vacuous — all 10 pages are content-less tombstones. The
"Featured in our articles" / "Read more" / pairing-partner injection
step had no target surface to write to. Once the SKILL.md is updated to
target the dynamic page (or to mutate `data.js → ARTICLE_MAP` directly,
which today's run is *explicitly forbidden* from doing), this column
will start carrying real numbers.

---

## Files modified

```
s/2-fucosyllactose.html
s/brewer-s-yeast.html
s/chromium-gtf.html
s/cistus-incanus.html
s/devil-s-claw.html
s/lion-s-mane-mushroom.html
s/lion-s-mane.html
s/st-john-s-wort.html
s/uridine-monophosphate.html
s/zinc.html
```

Backups (all): `<filepath>.bak-20260528-utc`

---

## Guardrails honored

- ✓ No tier / score / dose pushed back to `data.js`
- ✓ No invented PMIDs or evidence
- ✓ No git commits
- ✓ Light-mode-only — no dark-mode CSS touched
- ✓ No `.hold` files present on any of the 10 picks (checked)
- ✓ Backups taken before each edit
- ✓ History.json updated so these 10 stay out of the pool for 8 weeks
