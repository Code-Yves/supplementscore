# Content polish pass — 2026-05-24 (ISO week 21, run #2)

Fourth run of `weekly-content-polish-pass`. Today is 2026-05-24 (Sunday), which falls in ISO W21 — the same week as the prior run (2026-05-22, Friday). Because two same-week runs would collide under the documented ISO-week seed, this run uses **date seed `2026-05-24`** for the deterministic per-category shuffle while still applying the W19/W20/W21 exclusion. The 24 pages touched by the three prior runs (2026-05-10, -05-17, -05-22) were excluded from the eligible pool. All backups written as `<filepath>.bak-2026-05-24T071511Z`.

## Pages polished (verdict)

| Path | Verdict | Changes |
| --- | --- | --- |
| `a/bitter-orange-and-synephrine-the-ephedra-substitute-with-its-own-cardiac-risks.html` | Tightened | 8 (6 hierarchy h3→h2, 1 cross-link, +cadence) |
| `a/black-seed-oil-nigella-sativa-what-the-thymoquinone-trials-show.html` | **Escalated** | 2 (1 cross-link, +cadence) — page is a stub, escalated |
| `a/berberine-and-gut-health-a-double-edged-sword.html` | Tightened | 5 (3 hierarchy h3→h2, 1 cross-link, +cadence) |
| `s/anthocyanin-concentrate.html` | Tightened | 2 (1 cross-link, +cadence) |
| `s/bacillus-clausii.html` | Tightened | 2 (1 microcopy fix on truncated lede, +cadence) |
| `s/aniracetam.html` | Tightened | 2 (1 cross-link, +cadence) |
| `condition/pcos-protocol.html` | Tightened | 5 (4 cross-links, +cadence) |
| `compare/l-theanine-vs-magnesium-for-sleep.html` | Tightened | 3 (2 cross-links, +cadence updated from 2026-05-10) |

## Per-page change counts by category

| Page | Hook | Hierarchy | Microcopy | Cross-link |
| --- | --- | --- | --- | --- |
| bitter-orange-synephrine | 0 | 6 | 0 | 1 |
| black-seed-oil-thymoquinone | 0 | 0 | 0 | 1 |
| berberine-and-gut-health | 0 | 3 | 0 | 1 |
| s/anthocyanin-concentrate | 0 | 0 | 0 | 1 |
| s/bacillus-clausii | 0 | 0 | 1 | 0 |
| s/aniracetam | 0 | 0 | 0 | 1 |
| condition/pcos-protocol | 0 | 0 | 0 | 4 |
| compare/l-theanine-vs-magnesium-for-sleep | 0 | 0 | 0 | 2 |
| **Total** | **0** | **9** | **1** | **11** |

## Lede before/after (only rewrites)

No lede rewrites this run. All eight ledes already led with the most interesting / counterintuitive finding:

- **bitter-orange-synephrine** opens with the FDA ephedra ban → bitter orange pivot, which is the strongest framing for a safety article.
- **black-seed-oil-thymoquinone** lede is the only paragraph on the page (stub); content gap is escalated rather than rewritten in polish scope.
- **berberine-and-gut-health** opens with the viral metformin comparison and surfaces the microbiome twist in the same paragraph.
- **anthocyanin-concentrate** "What it is" already leads with the bilberry/microcirculation framing and the surprising eye/endothelium tissue-concentration vs plasma signal.
- **bacillus-clausii** "What it is" already leads with the antibiotic-co-administration uniqueness.
- **aniracetam** "What it is" already leads with AMPA modulation and EU-prescription status (the strongest "why this isn't just another nootropic" framing).
- **pcos-protocol** lede already opens with "single most common endocrine disorder + most heavily marketed-to" — the strongest hook.
- **l-theanine-vs-magnesium-for-sleep** lede already opens with the trazodone/melatonin framing and the racing-mind-vs-restless-legs differentiator.

## Microcopy fixes

- **`s/bacillus-clausii.html`** — generator-truncated SEO lede ended mid-phrase ("...taken in 1–3 divided doses with or."). Closed the sentence cleanly at "...taken in 1–3 divided doses." (drop "with or" tail). No facts altered; the missing tail was duplicating dose-with-or-without-food which is already covered in the Dose section below.

## Escalation queue

### **HIGH — content gap on a discoverable URL**

- **`a/black-seed-oil-nigella-sativa-what-the-thymoquinone-trials-show.html`** is a stub: the page renders only a 1-paragraph teaser plus a "Read the full article →" link that points to itself (`href="a/black-seed-oil-nigella-sativa-what-the-thymoquinone-trials-show.html"`, resolving from `/a/` → `/a/a/...`, which 404s). The longer-slug companion page (`...-for-metabolic-and-allergic-disease.html`, which was polished in the 2026-05-17 W20 run) is gone — consistent with the 2026-05-22 title-level dedup that removed 38 duplicate orphans. The stub kept this slug as the survivor of the dedup but its body content was apparently lost in the process.
  - **Owner suggestion:** `supplement-article-review` to decide between (a) regenerating the body for this slug from the article generator, (b) restoring from a backup of the longer-slug variant, or (c) redirecting this slug to the canonical companion article. Polish pass should not regenerate article body.
  - Polish-pass touch was limited to: wrapping "black seed" → `s/black-seed-oil.html` in the lede sentence, and adding the cadence comment. The broken self-link was **not** modified (out of scope; needs an editorial decision).
  - Also flag for `project_article_generator_dedup` follow-up: the dedup logic deleted the longer companion but kept a content-empty stub — the dedup script's "keep" rule should prefer the variant with non-empty body.

### **No tier/score/dose escalations**

Cross-checked all three picked supplement pages against `data.js`:

| Page | data.js entry | Page chip | Match |
| --- | --- | --- | --- |
| `s/anthocyanin-concentrate.html` | `t:'t3'`, e=3 s=5 r=3 o=3 c=3 d=5 | Tier 3 — Trending, 3/5 5/5 3/5 3/5 3/5 5/5 | ✓ |
| `s/bacillus-clausii.html` | `t:'t2'`, e=3 s=4 r=3 o=4 c=3 d=4 | Tier 2 — Promising, 3/5 4/5 3/5 4/5 3/5 4/5 | ✓ |
| `s/aniracetam.html` | `t:'t3'`, e=2 s=3 r=2 o=4 c=3 d=3 | Tier 3 — Trending, 2/5 3/5 2/5 4/5 3/5 3/5 | ✓ |

### **No safety-mention gaps**

- **bitter-orange** — already lists the at-risk populations explicitly (hypertension, CAD, arrhythmia, anxiety disorders, MAOIs, pregnancy as absolute contraindication, cardiac risk factors), the WADA / sports drug-test caution, and dosing co-stimulant amplification (caffeine, octopamine, hordenine, yohimbine).
- **berberine-and-gut-health** — already calls out the additive-hypoglycaemia caution with metformin / sulfonylureas / insulin and the cycling guidance (8–12 wk on / 4 wk off).
- **anthocyanin-concentrate** — low-risk supplement (safety 5/5 in data.js); no contraindication block needed.
- **bacillus-clausii** — already has the sensitive-populations callout (pregnancy/pediatric).
- **aniracetam** — already calls out the US not-approved / regulatory-grey-area status and the choline-pairing caution to avoid headaches.
- **pcos-protocol** — already has the danger card on weight-management-and-metformin-first sequencing, the pregnancy/planning-pregnancy caution on the whole protocol, the berberine CYP3A4/P-gp interaction list (ciclosporin, tacrolimus, statins, DOACs) plus pregnancy contraindication, the NAC nitroglycerin / anticoagulant flags, and the biotin/thyroid-lab interference note.
- **l-theanine-vs-magnesium-for-sleep** — already has the CKD stage 3+ magnesium caution, the quinolone / tetracycline / bisphosphonate separation guidance, the antihypertensive additive caution for L-theanine, and pregnancy/lactation hedge for L-theanine.

### **No shaky-citation flags**

PMIDs present and well-formed on the article pages with Sources blocks:
- bitter-orange: 16436104 (Haaz 2006 Obesity Reviews), plus 6 named-by-journal/DOI Stohs, Firenzuoli, Bui, Penzak, Stephensen, Nasir refs.
- berberine: 18397984 (Yin 2008 Metabolism), 23118768 (Dong 2012), 25579796 (Lan 2015), 15531889 (Kong 2004), 22939542 (Pisciotta 2012), 27703510 (Liu 2016), 32346077 (Zhang 2020), 32694566 (Sun 2020).
- l-theanine-vs-magnesium: 31623400 (Hidese 2019), 21208586 (Ritsner 2011), 23853635 (Abbasi 2012), 33865375 (Mah & Pitre 2021), 32056538 (Lopresti 2020), 31758301 (Williams 2020).
- pcos-protocol: trial-name references (no PMIDs in body; Sources block not in this page's template — that's a separate template-class observation, not a citation issue for this article).
- black-seed-oil: stub — body has no Sources block; can't audit. Folded into the escalation above.

No live-link checks performed.

## Notes

- **Hierarchy bias on `a/` pages continues — fourth consecutive week.** Two of the three `a/` articles polished today (bitter-orange and berberine-and-gut-health) jumped directly from `h1` to `h3` in the in-article body, repeating the systemic issue flagged in W19, W20, and W21. Promoted in-article section heads to `h2` and left `<h3>` in `Sources` and `SS-AUTOLINKS` blocks untouched (same policy as prior runs). **Recommendation reiterated from prior week:** a bulk `a/`-corpus h3→h2 fixer task would be more efficient than reaching it page-by-page through the polish pipeline. The third `a/` article today (black-seed-oil) has no body headings at all — it's the stub case escalated above.
- **Cross-link policy.** Wrapped first body-text occurrence only, never wrapped headings (h1/h2/h3), table cells, or table-of-contents / related-link blocks. Verified every target slug existed before wrapping. Skipped slugs that don't exist (`metformin`, `octopamine`, `hordenine`, `ephedrine`, `synephrine`, `coffee`, `bitter-orange`, `nigella-sativa`, `thymoquinone`, `bilberry`, `blackcurrant`, `anthocyanin` standalone, `spearmint` / `spearmint-tea`, `n-acetylcysteine` long-form, `dhea`, `vitamin-d` generic) and ambiguous targets (`chromium` between `chromium-gtf` / `chromium-nicotinate`, `vitamin D` between generic / `vitamin-d3` / `vitamin-d3-liquid-drops`).
- **Cadence anchor handling.** Six of eight pages had no prior cadence comment — inserted `<!-- last-reviewed: 2026-05-24 -->` before `</body>`. Two pages (compare/l-theanine-vs-magnesium-for-sleep, which had `2026-05-10`; bacillus-clausii, which only had the visible `SEO-LASTREVIEWED` block dated `2026-05-23`) had their cadence comment updated in place. The visible `SEO-LASTREVIEWED` HTML block (which renders as "Last reviewed: ... · Editorial team" on s/ and condition/ pages) is owned by `supplement-freshness-refresh` and was not modified; the cadence *comment* and the visible display block are intentionally separate signals.
- **Aniracetam / bacillus-clausii / anthocyanin all had a `SEO-LASTREVIEWED` block dated `2026-05-23`** — likely freshness-refresh ran the day before. The polish-pass cadence comment is independent and reflects today's polish touch.
- **Tier label-string drift noted in prior week (chip "Tier N — Trending"/"Promising" vs SEO-LEDE/FAQ "emerging evidence"/"promising evidence") persists** on s/anthocyanin-concentrate.html and s/aniracetam.html (both Tier 3 chip "Trending" / lede & FAQ "emerging evidence") and s/bacillus-clausii.html (Tier 2 chip "Promising" / lede & FAQ "promising evidence"). Tier *numbers* are consistent on all three (matching data.js). Not escalated as a content issue — this is template-string drift owned by a future template-consistency pass.
- **Per-page edit budget (12) was not hit on any page.** Smallest delta was 2 (`s/anthocyanin-concentrate`, `s/bacillus-clausii`, `s/aniracetam`, `a/black-seed-oil-thymoquinone`); largest was 8 (`a/bitter-orange-synephrine`, almost entirely hierarchy).
- **Vitamin K2 vs Vitamin K wrap on PCOS protocol.** The body mentions "Pair with K2" — wrapped to `s/vitamin-k2.html` (exists). The same paragraph also mentions "vitamin D" earlier; left unwrapped since the generic `s/vitamin-d.html` slug does not exist and the page already routes to `s/vitamin-d3.html` via the schema and the h3 heading.
- **Compare-page table cells (`l-theanine-vs-magnesium-for-sleep`).** The Quick-verdict table uses `<strong>L-Theanine</strong>` and `<strong>Magnesium</strong>` in `<td>` cells as label text. Per the cross-link policy, table cells aren't wrapped on the first occurrence — wrapped only the prose lede.
- No `data.js`, `app.js`, `pairings-data.js`, `medications.json`, tier, score, dose-range, or PMID changes. No git commits. Light-mode-only respected (no theme CSS touched). All 8 backups present on disk at `<filepath>.bak-2026-05-24T071511Z`.
