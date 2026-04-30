# Category Backfill — 2026-04-28

**Phase:** 0 / Item #4 of `IMPLEMENTATION_ROADMAP.md`
**Trigger:** Daily article-review log on 2026-04-28 flagged 75 articles with `(no c set)`
in the category distribution. These are articles that exist in `index.html` but were
never referenced in `ARTICLE_MAP` (which is keyed by supplement, not article ID), so
the daily review had no way to look up their category.

**Approach:** Additive — introduce a new `ARTICLES_BY_ID` constant in `data.js` that
maps every article ID to `{c, t}`. Existing `ARTICLE_MAP` (supplement → articles) is
unchanged. Future review scripts should look up categories from `ARTICLES_BY_ID`
directly instead of inferring them from `ARTICLE_MAP`.

---

## What changed

### `data.js`
- Inserted a new `const ARTICLES_BY_ID={...};` block immediately after `ARTICLE_MAP`
  (between line 178 and the existing `const EL=...` line).
- 241 entries — one per article in `index.html`.
- No edits to `ARTICLE_MAP`, `TIERS`, `MEDS`, `S`, or any other existing constant.

### `index.html`
- No edits this run.

### Backup
- `data.js.bak-phase0-20260428` saved alongside `data.js` before the patch.

---

## Mapping logic

For each of the 241 article IDs found in `index.html`:

1. **If the ID was already in `ARTICLE_MAP`** (166 of 241): copied the existing `c` value
   verbatim. No conflicts found across multiple references.
2. **If the ID was missing from `ARTICLE_MAP`** (75 of 241): parsed the `<div class="article-cat">`
   label inside the article block and translated using this rule:

   | HTML label                          | data.js category |
   |-------------------------------------|------------------|
   | `Featured Guide`, `Stacks`, `Guide`, `GUIDE` | `guide`        |
   | `Reality Check`, `OVERHYPED`        | `myth`           |
   | `Safety Alert`, `SAFETY ALERT`      | `safety`         |
   | `Kids`, `KIDS`                      | `kids`           |
   | `Breakthrough`                      | `breakthrough`   |

3. All 75 resolved cleanly. Zero unresolved.

---

## Distribution before / after

| Category     | Before (per 04-28 review) | After |
|--------------|--------------------------:|------:|
| breakthrough |                        57 |    62 |
| guide        |                        48 |    63 |
| myth         |                        30 |    49 |
| safety       |                        14 |    29 |
| kids         |                        17 |    38 |
| (no c set)   |                        75 |     0 |
| **Total**    |                   **241** | **241** |

---

## The 75 newly assigned categories

| ID | New `c` | Title |
|---:|---|---|
|   1 | guide        | The Complete Beginner's Guide to Supplements: What Actually Works in 2026 |
|   2 | guide        | The Evidence-Based Sleep Stack: What to Take and When |
|   3 | myth         | Why "Detox" Supplements Are a $3 Billion Scam |
|   9 | safety       | 5 Supplements That Can Dangerously Interact With Common Medications |
|  15 | myth         | Are Multivitamins a Waste of Money? |
|  16 | myth         | Turmeric vs Curcumin: Why the Supplement Industry Misleads You |
|  17 | safety       | The Hidden Dangers of Weight Loss Supplements |
|  19 | kids         | Omega-3 for Kids: What Parents Need to Know |
|  20 | breakthrough | Magnesium Deficiency: The Most Overlooked Health Problem |
|  21 | safety       | Supplement Quality: How to Spot Fake and Contaminated Products |
|  23 | myth         | The Anti-Aging Supplement Hype: What Actually Works? |
|  25 | kids         | Melatonin for Kids: Safe or Risky? |
|  28 | myth         | Why Most Testosterone Boosters Don't Work |
|  29 | safety       | Supplements During Pregnancy: The Essential Guide |
|  31 | safety       | The Supplement Industry's Dirty Secret: Third-Party Testing Results |
|  32 | breakthrough | The Science of Gut Health: Beyond Probiotics |
|  33 | guide        | Fish Oil Quality: How to Choose a Product That Isn't Rancid |
|  35 | safety       | Why Detox Teas Are Dangerous |
|  38 | kids         | Supplements for ADHD in Children: What Parents Should Know |
|  40 | guide        | How to Read a Supplement Label Like a Scientist |
|  41 | safety       | Pre-Workout Supplements: Hidden Stimulants and Heart Risks |
|  43 | kids         | Vitamin D for Kids: Dosing, Deficiency, and When to Test |
|  44 | myth         | The Truth About Alkaline Water and pH Supplements |
|  46 | safety       | Herbal Supplements and Liver Damage: A Growing Concern |
|  48 | kids         | Building Strong Bones in Children: Calcium, D3, and Beyond |
|  51 | myth         | Activated Charcoal: Why Detox Claims Are Nonsense |
|  53 | guide        | The Supplement Stack for Runners |
|  55 | safety       | Weight Loss Supplements That Actually Kill People |
|  57 | kids         | Iron Supplements for Toddlers: When and How |
|  60 | myth         | The Ketone Supplement Scam |
|  61 | kids         | Zinc for Children: Immune Support and Growth |
|  64 | guide        | Electrolytes for Athletes: Science vs Marketing |
|  67 | safety       | The Dangers of Buying Supplements on Amazon |
|  68 | kids         | Multivitamins for Teens: Necessary or Wasteful? |
|  71 | guide        | Fasting and Supplements: What to Take and When to Stop |
|  73 | guide        | The Best Supplements for Vegetarians and Vegans |
|  75 | safety       | Contaminated Protein Powders: Lead, Arsenic, and BPA |
|  76 | myth         | Turkey Tail Mushroom: Cancer Claims vs Reality |
|  77 | kids         | Omega-3 DHA During Pregnancy: Critical for Brain Development |
|  79 | myth         | The Supplement Industry Greenwashing Problem |
|  81 | safety       | SARMs: The Illegal Supplements in Your Gym |
|  83 | kids         | Probiotics for Babies: What Pediatric Research Shows |
|  84 | breakthrough | How Exercise Outperforms Every Supplement |
|  85 | myth         | The Nootropics Myth: Smart Drugs That Aren't Smart |
|  86 | safety       | Supplement Interactions with Blood Pressure Medications |
|  89 | kids         | Melatonin Gummies for Kids: The Overdosing Problem |
|  93 | guide        | The Complete Guide to Magnesium Forms |
|  94 | myth         | Apple Cider Vinegar Pills: Worthless and Potentially Harmful |
|  95 | safety       | Ephedra Alternatives: Still Dangerous Under New Names |
|  97 | kids         | Fish Oil for Kids with ADHD: What the Evidence Shows |
|  99 | guide        | How to Build a Basic Supplement Stack for Beginners |
| 100 | myth         | The Testosterone Booster Industry: A $1.5 Billion Fraud |
| 103 | kids         | Vitamin Gummies for Kids: Sugar, Dosing, and Better Alternatives |
| 105 | guide        | Supplement Timing: Does It Actually Matter? |
| 106 | myth         | Homeopathic Supplements: Why They Cannot Work |
| 108 | myth         | Exogenous Ketones for Weight Loss: Science Says No |
| 109 | kids         | Vitamin A for Children: Essential but Easy to Overdose |
| 110 | breakthrough | The Gut-Immune Connection: Probiotics and Respiratory Health |
| 111 | guide        | Women's Supplement Guide: Evidence-Based Picks by Life Stage |
| 114 | myth         | Detox Foot Pads and Cleanses: Pure Pseudoscience |
| 116 | myth         | Colostrum: Ancient Superfood or Influencer Hype? |
| 117 | kids         | Vitamin C for Kids: How Much Is Too Much? |
| 118 | breakthrough | Boron: The Forgotten Trace Mineral |
| 119 | guide        | The Supplement Stack for Brain Health After 50 |
| 122 | kids         | Probiotics for Kids After Antibiotics |
| 123 | myth         | Why Most Vitamin D Studies Are Misleading |
| 125 | guide        | The Traveler's Supplement Kit: Evidence-Based Picks |
| 126 | safety       | Raw Thyroid Glandulars: The Dangerous Supplement Trend |
| 128 | kids         | DHA and Reading Ability in Children |
| 129 | myth         | Why "Natural" Doesn't Mean Safe |
| 131 | guide        | Joint Supplements Ranked: What Actually Reduces Pain |
| 224 | kids         | Fluoride Drops for Kids: When Pediatricians Still Recommend Them |
| 229 | kids         | Picky Eaters: When a Pediatric Multivitamin Actually Makes Sense |
| 235 | kids         | Kids "Detox" and "Cleanse" Supplements: A Dangerous Wellness Trend |
| 239 | kids         | Lead in Baby Food and Children's Vitamins: 2024–2025 Recall Roundup |

---

## Verification

`node -e "..."` was run to syntax-check the new `data.js`:

```
ARTICLES_BY_ID count: 241
Categories: { guide: 63, myth: 49, safety: 29, breakthrough: 62, kids: 38 }
Sample id=1: guide / "The Complete Beginner's Guide..."
Sample id=139: kids / "Supplements for Kids..."
Sample id=241: kids / "Teen Pre-Workout..."
ARTICLE_MAP keys: 174 (unchanged)
```

The next scheduled article-review run should report **0 articles missing a category**.

---

## Note for SKILL.md (lives outside this workspace)

The daily article-review SKILL infers categories from `ARTICLE_MAP`. After this change,
`ARTICLES_BY_ID` is the authoritative per-article category source. Update the SKILL so:

1. The "Category distribution" table in the daily report reads from `ARTICLES_BY_ID`,
   not `ARTICLE_MAP`.
2. The "(no `c` set)" row should disappear; if it ever reappears, it means a new article
   was added to `index.html` without a corresponding `ARTICLES_BY_ID` entry — that's the
   actionable signal.
3. New articles added going forward must be inserted into both `index.html` and
   `ARTICLES_BY_ID` (the latter as `{N:{c:'...',t:'...'}}` matching the existing pattern).
