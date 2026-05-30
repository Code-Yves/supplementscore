# Article regeneration spec (2026-05-30)

You are regenerating gutted SupplementScore articles. Each is ALREADY registered in
data.js (title, slug, category fixed) — your job is to write a fresh, accurate body
and produce a template-perfect file. Workspace:
`/Users/yves/Desktop/AI/Supplement Score/supplementscore-repo/` (cd here first).

## Read these first
- `a/type-2-diabetes-the-evidence-based-supplement-protocol.html` — the EXEMPLAR. Mirror its structure, tone, citation format, and body shape exactly.

## How to produce each article
1. Write the body block to `/tmp/<slug>.body.html`. It must start with `<div class="ar-content">` (including the `← Back to articles` button) and end with `</footer>` — copy the exemplar's exact opening/closing boilerplate (back-button, Sources `<ol>` wrapper, empty `<!-- SS-AUTOLINKS:start -->`/`<!-- SS-AUTOLINKS:end -->` markers, and the `<footer class="ar-foot">` block). Do NOT include `<main>`, `<h1>`, or `</main>` — the scaffold keeps those and swaps the `<h1>` to your title.
2. Run:
   ```
   python3 scripts/_regen_scaffold.py --slug <slug> --title "<Exact Title>" \
     --desc "<150-char meta description>" --minutes <int> --body /tmp/<slug>.body.html
   ```
   (Title = exactly as given, NO " — SupplementScore" suffix.)
3. Validate your file (see Self-check).

## Body requirements (HARD — each article)
- **≥ 650 words** of body prose (aim 700–900), excluding the Sources list and back-button.
- **3–6 `<h2>` sections.** Reserve `<h3>` for "Sources" only.
  - **Condition protocol:** intro `<p>` → one `<h2>` per recommended supplement (heading includes the dose, e.g. `<h2>Magnesium, 300 mg Daily</h2>`) with what trials show + mechanism + cautions → `<h2>What NOT to Take</h2>` → `<h2>How to Run the Protocol</h2>` → Sources.
  - **Stack:** intro → one `<h2>` per component named in the title (dose + evidence) → `<h2>How to Run the Stack</h2>` → Sources.
  - **Guide:** intro → 4–6 topical `<h2>` sections → practical takeaway → Sources.
- **≥ 5 internal links**, ALL of the form `../supplement.html?slug=<slug>` (relative, from /a/). You may add at most 1–2 links to an EXISTING `/compare/…`, `/condition/…`, or other `/a/…` file (verify the file exists on disk first). NEVER link `/s/<slug>.html`, NEVER `/for/…`, NEVER nest an `<a>` inside another `<a>`.
- **VERIFY every supplement slug resolves** before using it:
  ```
  node --input-type=module -e "import {isValidSupplementSlug as v} from './scripts/slug.mjs'; for (const s of ['magnesium-glycinate','omega-3-epa-dha','alpha-lipoic-acid']) console.log(v(s), s)"
  ```
  Canonical slugs = slugify(full data.js name): e.g. `omega-3-epa-dha`, `magnesium-glycinate`, `alpha-lipoic-acid`, `chromium-picolinate`, `vitamin-d3`, `coq10-ubiquinol`, `saccharomyces-cerevisiae-beta-glucan`. If a supplement isn't in data.js, mention it WITHOUT a link.
- **≥ 4 citations with REAL PMIDs.** Use the `pubmed` / `consensus` MCP tools to find and verify actual studies — DO NOT invent PMIDs. Each `<li>` carries funding metadata exactly like the exemplar: `<li data-funder-type="public|industry|mixed|nonprofit|none_disclosed" data-funder="…" data-coi="true|false">Authors. "Title." <em>Journal</em>, YEAR;VOL(ISSUE):PAGES. PMID: XXXXXXXX. DOI: …</li>`. If you cannot verify a specific PMID after searching, describe the study accurately and set `data-funder-type="none_disclosed"` rather than fabricating an identifier.
- Clear, direct prose; distinguish RCT/meta-analysis evidence from mechanism/epidemiology; end with practical dosing/where-to-start guidance. No prices, no brand endorsements, no "best/miracle". Light-mode only.

## Self-check (run for each file you write)
```
f=a/<slug>.html
grep -c '<h1' $f        # = 1
grep -c 'class="ar-content"' $f   # ≥ 1
grep -c research-chrome $f        # = 1
grep -oc 'PMID:' $f               # ≥ 4
awk '/<div class="ar-content">/{x=1} /<h3[^>]*>Sources/{x=0} x' $f | sed 's/<[^>]*>//g' | wc -w   # ≥ 650
```
Confirm every `?slug=` you used returned `true` from slug.mjs. Report any slug you wanted but couldn't resolve (content-gap signal).

Do NOT run `register-articles.mjs` (these are already registered) and do NOT edit data.js, sitemaps, or any file other than the `a/<slug>.html` files you are assigned. Report a concise list of files written + any issues.
