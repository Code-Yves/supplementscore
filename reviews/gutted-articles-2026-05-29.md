# 30 gutted / empty articles — discovered 2026-05-29

## What happened
While sweeping the missing-`_research-chrome.js` issue across condition pages, the chrome gap on `/a/` pages turned out to be a symptom of a much bigger problem: **30 article files under `/a/` have no body content.** They keep the `<head>` metadata (and footer) but the `</head>`, `<body>`, `<main class="ar-wrap">`, `<h1>`, and the entire article prose are gone.

Git history shows these were once complete (e.g. `type-2-diabetes…` was ~21 KB with `</head>`/`<h1>`/`ar-content`) and got **stripped to ~13 KB by a bad commit** (body removed). Four others (`anthocyanin-concentrate`, `high-dose-vitamin-d-bolus…`, `nicotinic-acid-vs-niacinamide…`, `st-johns-wort-drug-interactions…`) were truncated even further to ~1–1.8 KB stubs.

This is **pre-existing and unrelated to the link/`/for/`/scheduled-task work** — those files were already committed broken; nothing in this session caused it.

## Why I did NOT just restore from git
I tried restoring the last-good git version of all 30. It recovers the prose, but the old versions link to a **past site state**: it reintroduced **52 broken links** — 38 inline links to companion articles that have since been deleted (e.g. `psyllium-husk-420-…`, `bergamot-citrus-extract-…`, `ginkgo-biloba-egb-761-…`, `sam-e-for-depression-…`), plus a few legacy `/s/…-.html` trailing-hyphen slugs and 3 registration orphans. Cleaning that means unwrapping ~38 dead links (degrading the articles) and re-registering — a large, judgment-heavy job. So I **reverted the restore**; the repo is back to 0 link-checker breaks and 0 orphans.

## Current state
- The actual ask is done: **both condition pages that lacked chrome are fixed** (`prostate-health`, `kidney-stones`); 0/58 condition pages now missing chrome. Chrome also kept on `a/index.html`.
- These 30 `/a/` files remain empty (chrome is moot until they have content). Link checker: **0 genuine breaks**.

## The 30 (29 registered + 1 debris)
1. adhd-the-evidence-based-supplement-protocol
2. age-related-cognitive-decline-the-evidence-based-supplement-protocol
3. anxiety-the-evidence-based-supplement-protocol
4. cataract-prevention-the-evidence-based-supplement-protocol
5. chronic-constipation-the-evidence-based-supplement-protocol
6. fibromyalgia-the-evidence-based-supplement-protocol
7. functional-dyspepsia-the-evidence-based-supplement-protocol
8. glycerol-hyperhydration-the-iso-osmotic-pre-event-hydration-protocol
9. high-cholesterol-the-evidence-based-supplement-protocol
10. high-dose-vitamin-d-bolus-therapy-why-large-single-doses-increased-fractures-and (stub)
11. iron-deficiency-anemia-the-evidence-based-supplement-protocol
12. lactobacillus-casei-shirota-what-the-yakult-trials-actually-show
13. metabolic-syndrome-the-evidence-based-supplement-protocol
14. mild-to-moderate-depression-the-evidence-based-supplement-protocol
15. nicotinic-acid-vs-niacinamide-flushing-hepatotoxicity-and-dose-differences (stub)
16. prediabetes-the-evidence-based-supplement-protocol
17. st-johns-wort-drug-interactions-the-cyp3a4-inducer-problem (stub)
18. the-anti-anxiety-stack-l-theanine-magnesium-and-ashwagandha
19. the-cholesterol-lowering-stack-psyllium-plant-sterols-oat-beta-glucan-and-bergamot
20. the-cognitive-performance-stack-caffeine-l-theanine-creatine-and-citicoline
21. the-eye-health-stack-lutein-zeaxanthin-astaxanthin-and-omega-3
22. the-hair-growth-stack-iron-zinc-saw-palmetto-and-pumpkin-seed-oil
23. the-iron-deficiency-recovery-stack-iron-vitamin-c-lactoferrin-and-b12
24. the-liver-support-stack-nac-tudca-vitamin-e-and-milk-thistle
25. the-migraine-prevention-stack-magnesium-riboflavin-coq10-and-feverfew
26. the-pcos-stack-inositol-vitamin-d-nac-and-omega-3
27. the-pre-diabetes-stack-berberine-chromium-alpha-lipoic-acid-and-fiber
28. the-skin-health-stack-collagen-vitamin-c-zinc-and-omega-3
29. type-2-diabetes-the-evidence-based-supplement-protocol
- **anthocyanin-concentrate** — NOT registered in data.js, never a real article in git history; debris → delete candidate.

## Recommended fix (your call)
1. **Regenerate the 29 fresh (recommended).** Rewrite each registered title with the current unified article template (the `nightly-article-generation` template + the new slug-resolution gate), so they get valid `?slug=` links, correct chrome, CSP, and pass the checker. Clean and current; avoids the deleted-past link problem. It's ~29 evidence-based articles (600–1,000 words + real PMIDs each) — a sizable batch.
2. **Restore + strip dead links.** Faster; recovers the original prose but turns ~38 cross-links into plain text and needs orphan re-registration. Lower quality than (1).
3. **Delete `anthocyanin-concentrate`** regardless (unregistered, no content, no recoverable version).

Until fixed, these 30 are thin/empty pages — worth a `noindex` or removal from sitemaps in the interim if launch is near.
