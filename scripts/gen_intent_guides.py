#!/usr/bin/env python3
"""Write the October 2026 high-intent guides and certification comparisons.

Brand tables are built only from data/verified-brands.json. Study identifiers
below were checked against PubMed titles on 15 October 2026.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOOTER = (ROOT / "_partials" / "footer.html").read_text()
FOOTER = FOOTER[FOOTER.find("<!-- SS_FOOTER_BEGIN -->"):]
BRANDS = json.loads((ROOT / "data" / "verified-brands.json").read_text())["brands"]
TODAY = "2026-10-15"
PRETTY = "15 October 2026"


def esc(s):
    return html.escape(s, quote=True)


def page(slug, title, description, bottom, body, sources):
    citations = []
    for src in sources:
        item = {"@type": "CreativeWork", "name": src["name"]}
        if src.get("url"):
            item["url"] = src["url"]
        citations.append(item)
    cite_json = json.dumps(citations, ensure_ascii=False, indent=2)
    src_li = []
    for i, src in enumerate(sources, 1):
        extra = ""
        if src.get("pmid"):
            extra += f' PMID: <a href="https://pubmed.ncbi.nlm.nih.gov/{src["pmid"]}/">{src["pmid"]}</a>.'
        if src.get("url") and not src.get("pmid"):
            extra += f' <a href="{esc(src["url"])}">{esc(src.get("url_label") or "Source")}</a>.'
        src_li.append(
            f'<li data-coi="false" data-funder="{esc(src.get("funder","Public record"))}" '
            f'data-funder-type="{esc(src.get("ftype","public"))}" data-source-key="pubmed">'
            f'{esc(src["cite"])}{extra}</li>'
        )
    desc = esc(description)
    h = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://plausible.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://formspree.io https://plausible.io https://www.fda.gov https://www.efsa.europa.eu; base-uri 'self'; form-action 'self' https://formspree.io;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{esc(title)}</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%231F7A6B'/%3E%3Cpath d='M5 19C5 11 11 5 19 5C19 13 13 19 5 19Z' fill='%23F8F4ED'/%3E%3Cpath d='M5 19C9 15 13 11 19 5' stroke='%231F7A6B' stroke-width='1.4' stroke-linecap='round' fill='none'/%3E%3C/svg%3E">
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://supplementscore.org/a/{slug}.html">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="https://supplementscore.org/a/{slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="SupplementScore">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="https://supplementscore.org/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:image" content="https://supplementscore.org/og/default.png">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{desc}">
  <script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": {json.dumps(title)},
  "description": {json.dumps(description)},
  "author": [{{"@type": "Organization", "name": "SupplementScore Editorial Team", "url": "https://supplementscore.org/about.html#editorial"}}],
  "reviewedBy": {{"@type": "Organization", "name": "SupplementScore Editorial Team", "url": "https://supplementscore.org/about.html#editorial"}},
  "publisher": {{"@type": "Organization", "name": "SupplementScore", "url": "https://supplementscore.org"}},
  "datePublished": "{TODAY}",
  "dateModified": "{TODAY}",
  "url": "https://supplementscore.org/a/{slug}.html",
  "mainEntityOfPage": "https://supplementscore.org/a/{slug}.html",
  "articleSection": "Guide",
  "inLanguage": "en-US",
  "isAccessibleForFree": true,
  "citation": {cite_json}
}}
  </script>
  <script>document.documentElement.setAttribute('data-theme','light');</script>
  <style>html {{color-scheme:light}}</style>
  <link rel="stylesheet" href="/critical.css?v=1">
  <link rel="stylesheet" href="/styles.css?v=1df1892f" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="/styles.css?v=1df1892f"></noscript>
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#1F7A6B">
  <style>
    body {{ background: var(--color-background-primary); color: var(--color-text-primary); }}
    .ar-wrap {{ max-width: 760px; margin: 0 auto; padding: 32px 22px 64px; line-height: 1.7; }}
    .ar-wrap h1 {{ font-size: clamp(1.7rem, 4vw, 2.2rem); line-height: 1.15; margin: 0 0 10px; }}
    .ar-wrap h2 {{ font-size: 1.25rem; margin: 28px 0 8px; }}
    .ar-wrap a {{ color: var(--color-brand); }}
    .ar-wrap table {{ width: 100%; border-collapse: collapse; font-size: 14px; margin: 8px 0 16px; }}
    .ar-wrap th, .ar-wrap td {{ text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--color-border-tertiary); vertical-align: top; }}
    .ar-meta {{ font-size: 13px; color: var(--color-text-tertiary); margin-bottom: 18px; }}
    .ar-bottomline {{ border-left: 3px solid var(--color-brand); padding: 4px 0 4px 14px; margin: 0 0 22px; }}
    .ar-bottomline-label {{ font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }}
    .ar-content button {{ display: none; }}
  </style>
  <script defer data-domain="supplementscore.org" src="https://plausible.io/js/script.js"></script>
  <script src="../_site-ux.js?v=b12faq01" defer></script>
  <!-- SEO-BC-SCHEMA:start -->
  <script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {{"@type":"ListItem","position":1,"name":"SupplementScore","item":"https://supplementscore.org/"}},
  {{"@type":"ListItem","position":2,"name":"Articles","item":"https://supplementscore.org/#articles"}},
  {{"@type":"ListItem","position":3,"name":{json.dumps(title)},"item":"https://supplementscore.org/a/{slug}.html"}}
]}}
  </script>
  <!-- SEO-BC-SCHEMA:end -->
  <script src="../_research-chrome.js?v=0a0ffb41" defer></script>
  <!-- RC_PREVNEXT:start -->
  <meta name="rc-prev" content="">
  <meta name="rc-next" content="">
  <!-- RC_PREVNEXT:end -->
</head>
<body><main class="ar-wrap">
  <h1>{esc(title)}</h1>
<div class="ar-meta">By the <a href="/about.html#editorial" rel="author">SupplementScore Editorial Team</a> &middot; <span class="ss-last-reviewed">Updated <time datetime="{TODAY}">{PRETTY}</time></span> &middot; <a href="/transparency.html">No ads or affiliate links</a> <!-- last-reviewed: {TODAY} --></div>
<div class="ar-bottomline">
  <div class="ar-bottomline-label">Bottom line</div>
  <p>{bottom}</p>
</div>
<div class="ar-content">
{body}
<div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--color-border-tertiary)">
  <h3>Sources</h3>
  <ol>
{''.join(src_li)}
  </ol>
</div>
</div>
<aside class="ar-editorial" style="margin-top:28px;padding-top:14px;border-top:1px solid var(--color-border-tertiary);font-size:0.92rem"><strong>About this page.</strong> Written by the SupplementScore editorial team. No named clinician has reviewed it. It is education, not medical advice. Funding and corrections: <a href="/transparency.html">transparency</a>.</aside>
</main>
{FOOTER}
</body>
</html>
"""
    out = ROOT / "a" / f"{slug}.html"
    out.write_text(h)
    return slug


def src(cite, name, pmid=None, url=None, funder="Published study", ftype="public", url_label="Source"):
    d = {"cite": cite, "name": name, "funder": funder, "ftype": ftype, "url_label": url_label}
    if pmid:
        d["pmid"] = pmid
        d["url"] = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
    elif url:
        d["url"] = url
    return d


def guides():
    slugs = []
    slugs.append(page(
        "best-magnesium-for-sleep",
        "Best magnesium for sleep",
        "Which magnesium form has actual sleep trials, why glycinate is usually chosen for the stomach, and how to read elemental milligrams.",
        "No head-to-head trial shows that magnesium glycinate beats magnesium citrate for sleep. The insomnia trial people quote most often used magnesium in older adults and was not a glycinate study. Glycinate is a reasonable pick when oxide or citrate upsets the stomach. Citrate is the form with clearer absorption data and a laxative effect. Read the elemental magnesium line, and stay near the 350 mg a day supplemental upper limit unless a clinician sets a different dose.",
        """
<p>Sleep labels lean on the word glycinate. The capsule weight is usually the whole salt, not the magnesium. A 400 mg glycinate capsule often holds far less elemental magnesium than 400 mg. That is the number that matters for <a href="/supplement/magnesium-glycinate.html">magnesium glycinate</a> and for <a href="/supplement/magnesium-citrate.html">magnesium citrate</a>.</p>
<h2>What the sleep trials actually used</h2>
<p>A double-blind trial in older adults with primary insomnia found better sleep measures with magnesium than with placebo (Abbasi and colleagues, 2012, PMID 23853635). It did not establish glycinate as the winning form. A 2021 systematic review of oral magnesium for insomnia in older adults (PMID 33865376) and a 2023 review of magnesium and sleep (PMID 35184264) both describe a modest signal, mostly in people who sleep poorly, not a guarantee for every healthy adult. A 2024 review of supplemental magnesium, anxiety, and sleep (PMID 38817505) is in the same direction and is still not a form-versus-form test.</p>
<h2>Glycinate, citrate, and oxide</h2>
<p>Citrate has come out ahead of other common salts on absorption in a randomized comparison (PMID 14596323). Commercial oxide preparations are the poorly absorbed end of the range (PMID 11794633). An updated review of magnesium absorption makes the same practical point: the salt and the dose both change how much you take up (PMID 29123461). Glycinate is popular because it is easier on the gut than oxide and less likely than citrate to loosen stools. That is a tolerability reason, not a sleep-trial win.</p>
<h2>Glycine is a separate question</h2>
<p>Glycine itself, at a multi-gram dose, has a small sleep study (PMID 22293292). The glycine riding along in a typical glycinate capsule is a fraction of that dose. Do not treat a magnesium capsule as if it were a glycine sleep trial. The <a href="/supplement/glycine.html">glycine</a> card is the place for that ingredient.</p>
<h2>A sensible way to choose</h2>
<p>If sleep is the goal and your stomach is fine, citrate is the form with the better absorption record. If citrate sends you to the bathroom, glycinate is the usual switch. Oxide is the one to stop buying for this purpose. Take it in the evening if that is when you want the effect, and do not stack several magnesium products until the elemental total is clear. People with kidney disease need advice before any extra magnesium.</p>
<p>Forms are compared in more detail in <a href="/a/magnesium-forms-explained-glycinate-vs-citrate-vs-threonate-vs-oxide.html">magnesium forms explained</a>. Products that actually appear on a public certification list are in <a href="/a/certified-magnesium-products-compared.html">certified magnesium products compared</a>.</p>
""",
        [
            src("Abbasi B, et al. The effect of magnesium supplementation on primary insomnia in elderly. J Res Med Sci. 2012.", "Magnesium and primary insomnia in older adults", pmid="23853635"),
            src("Oral magnesium supplementation for insomnia in older adults: a systematic review and meta-analysis. BMC Complement Med Ther. 2021.", "Oral magnesium for insomnia in older adults", pmid="33865376"),
            src("The role of magnesium in sleep health: a systematic review of available literature. Biol Trace Elem Res. 2023.", "Magnesium and sleep health review", pmid="35184264"),
            src("Examining the effects of supplemental magnesium on self-reported anxiety and sleep quality: a systematic review. Cureus. 2024.", "Supplemental magnesium, anxiety, and sleep", pmid="38817505"),
            src("New therapeutic strategy for amino acid medicine: glycine improves the quality of sleep. J Pharmacol Sci. 2012.", "Glycine and sleep quality", pmid="22293292"),
            src("Walker AF, et al. Mg citrate found more bioavailable than other Mg preparations in a randomised, double-blind study. Magnes Res. 2003.", "Magnesium citrate bioavailability", pmid="14596323"),
            src("Firoz M, Graber M. Bioavailability of US commercial magnesium preparations. Magnes Res. 2001.", "Bioavailability of commercial magnesium preparations", pmid="11794633"),
            src("Schuchardt JP, Hahn A. Intestinal absorption and factors influencing bioavailability of magnesium — an update. Curr Nutr Food Sci. 2017.", "Magnesium absorption update", pmid="29123461"),
        ],
    ))
    slugs.append(page(
        "creatine-vs-whey-protein",
        "Creatine vs whey protein",
        "Creatine and whey do different jobs. One fills the muscle creatine store. The other is food protein. Most people who train can use both, and neither replaces the other.",
        "Creatine monohydrate and whey protein are not substitutes. Creatine is a few grams a day that raises the creatine store in muscle. Whey is a convenient protein food that helps you hit a daily protein target. The International Society of Sports Nutrition supports creatine monohydrate at about 3 to 5 grams a day, and a higher daily protein intake for people who train. You do not have to pick one. You also do not need a blend that hides the dose of either.",
        """
<p>Store shelves put <a href="/supplement/creatine-monohydrate.html">creatine monohydrate</a> and <a href="/supplement/whey-protein.html">whey protein</a> in the same tub aisle. The labels both say muscle. The evidence says they work on different parts of training.</p>
<h2>What creatine is doing</h2>
<p>The ISSN position stand on creatine (PMID 28615996) is the practical summary: creatine monohydrate raises muscle creatine, it is the form with the trials, and the maintenance dose used across sports research is about 3 to 5 grams a day. A loading week is optional. That question is covered in <a href="/a/creatine-loading-or-a-daily-dose.html">creatine loading or a daily dose</a>. Creatine is not a protein and it does not replace a meal.</p>
<h2>What whey is doing</h2>
<p>The ISSN protein stand (PMID 28642676) treats protein supplements as a way to reach a daily intake, not as a drug with a special clock. A meta-analysis of protein supplementation with resistance training (Morton and colleagues, PMID 28698222) found that extra protein increased gains, with diminishing returns as the daily intake got higher. Whey is simply a fast, complete protein. Casein is slower. Neither one stocks the muscle creatine pool.</p>
<h2>How to use them together</h2>
<p>A typical training day can include 3 to 5 grams of creatine monohydrate and enough protein from food plus whey to meet the day's target. The creatine can sit in any drink. It does not have to be mixed into the whey. If the budget only covers one, food protein comes first for people who are short on protein, and creatine comes first for people who already eat enough protein and want the creatine effect.</p>
<p>Certified examples, limited to names that were on a public list, are in <a href="/a/certified-creatine-products-compared.html">certified creatine products compared</a>. This page does not link to a store.</p>
""",
        [
            src("Kreider RB, et al. International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine. J Int Soc Sports Nutr. 2017.", "ISSN creatine position stand", pmid="28615996"),
            src("Jäger R, et al. International Society of Sports Nutrition position stand: protein and exercise. J Int Soc Sports Nutr. 2017.", "ISSN protein and exercise position stand", pmid="28642676"),
            src("Morton RW, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength. Br J Sports Med. 2018.", "Protein supplementation and resistance training", pmid="28698222"),
        ],
    ))
    slugs.append(page(
        "vitamin-d-in-a-canadian-winter",
        "Vitamin D in a Canadian winter",
        "How much vitamin D Canadian adults are advised to get, why winter sun is a poor plan, and which certified products are actually on a public list.",
        "Canadian winters are a weak source of vitamin D from skin. The dietary allowance used in Canada and the United States is 600 IU a day from ages 1 to 70 and 800 IU a day from age 71, with an adult upper limit of 4,000 IU. A children's 400 IU chewable is not an adult winter dose. Products at 5,000 IU sit above that upper limit unless a clinician is treating a measured deficiency. Certification tells you the bottle matched a public list. It does not pick the dose for you.",
        """
<p>From roughly October through March, a walk at Canadian latitudes is a poor way to make vitamin D. Reviews of sun exposure and vitamin D status describe how little useful ultraviolet reaches the skin in the cold months (PMID 37691266, PMID 32918230). Northern populations also show high rates of low vitamin D in winter in the European surveys that mapped the same problem (Cashman and colleagues, PMID 26864360).</p>
<h2>The dose on the public reference sheets</h2>
<p>The National Academies figures, republished by the NIH Office of Dietary Supplements, set the recommended dietary allowance at 15 micrograms (600 IU) a day for ages 1 to 70 and 20 micrograms (800 IU) a day for ages 71 and older. The adult tolerable upper intake level is 100 micrograms (4,000 IU) a day. Health Canada directs readers to those same reference intakes on its vitamin D page. Food plus a supplement is how many adults get there when the sun is not contributing.</p>
<p>A blood test is the way to find a deficiency. This page is not a target for a 25-hydroxyvitamin D number, and it is not a prescription.</p>
<h2>What "best" cannot mean here</h2>
<p>We do not name a best brand. We can say which doses match the allowance, and which named products were on a public list on 15 October 2026. <a href="/supplement/vitamin-d3.html">Vitamin D3</a> is the form used in most of those products and in most trials. D2 exists and is a different card.</p>
<p>Jamieson Kids Chewable Vitamin D3 400 IU holds a Health Canada licence, NPN 80015933: 10 micrograms (400 IU), ages 3 and older. A licence means it may be sold in Canada. It is not a purity seal, and it is a children's product. It is the wrong bottle to treat as an adult winter supplement.</p>
<p>USP Verified vitamin D3 products on the public directory included Nature Made at 1,000 IU and 2,000 IU and Member's Mark at 2,000 IU. Several brands also list 5,000 IU softgels. That dose is above the 4,000 IU adult upper limit. It belongs with a clinician who has seen a low blood result, not in a default winter routine.</p>
<p>The product-by-product list is <a href="/a/certified-vitamin-d-products-compared.html">certified vitamin D products compared</a>. Dose timing across the week is a separate article, <a href="/a/vitamin-d-how-much-do-you-really-need.html">vitamin D: how much do you really need</a>.</p>
""",
        [
            src("NIH Office of Dietary Supplements. Vitamin D fact sheet for health professionals.", "NIH ODS vitamin D fact sheet", url="https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/", funder="NIH Office of Dietary Supplements", url_label="NIH ODS"),
            src("Health Canada. Vitamin D.", "Health Canada vitamin D page", url="https://www.canada.ca/en/health-canada/services/nutrients/vitamin-d.html", funder="Health Canada", url_label="Health Canada"),
            src("Cashman KD, et al. Vitamin D deficiency in Europe: pandemic? Am J Clin Nutr. 2016.", "Vitamin D deficiency across northern populations", pmid="26864360"),
            src("Webb AR, et al. Making the sunshine vitamin — how much sun exposure is needed to maintain 25-hydroxy vitamin D concentration? Photochem Photobiol. 2024.", "Sun exposure and maintaining vitamin D", pmid="37691266"),
            src("Webb AR, Engelsen O. Ultraviolet exposure scenarios: risks of erythema and benefits of cutaneous vitamin D synthesis. Adv Exp Med Biol. 2020.", "Ultraviolet exposure and vitamin D synthesis", pmid="32918230"),
        ],
    ))
    slugs.append(page(
        "how-much-omega-3-per-day",
        "How much omega-3 per day",
        "The everyday EPA and DHA range, the prescription-strength dose used in REDUCE-IT, and why a high dose is not a do-it-yourself plan.",
        "For general health, food-based guidance clusters around a few hundred milligrams of EPA plus DHA a day, not several grams. The 4 gram icosapent ethyl dose in REDUCE-IT was a prescription regimen in a selected high-risk group, and a different high-dose product failed in the STRENGTH trial. Higher omega-3 intakes have also been tied to a higher chance of atrial fibrillation. Read the EPA and DHA lines on the label. The milligrams of fish oil are not the same number.",
        """
<p>A fish-oil softgel that says 1,000 mg is usually the weight of the oil, not the weight of EPA plus DHA. <a href="/supplement/omega-3.html">Omega-3 (EPA/DHA)</a> dosing starts with those two numbers added together.</p>
<h2>Everyday intake versus a treatment dose</h2>
<p>European dietary-reference work set an adequate intake of 250 mg of EPA plus DHA a day for healthy adults (EFSA Journal 2010). That is a diet target, not a treatment. A 2017 American Heart Association science advisory reviewed fish-oil supplements for preventing clinical cardiovascular disease (PMID 28289069). It is not a blank check for high-dose capsules in people who have never had heart disease.</p>
<h2>The trials people mix up</h2>
<p>REDUCE-IT tested 4 grams a day of icosapent ethyl, a purified EPA prescription product, in people with high triglycerides who were already on a statin (PMID 30415628). Cardiovascular events were lower in that selected group. STRENGTH tested a different high-dose omega-3 carboxylic acid against corn oil and did not show a benefit (PMID 33190147). Those two results do not average out to "take 4 grams of the grocery-store bottle."</p>
<p>A 2025 review of omega-3 and atrial fibrillation describes a higher rhythm risk as the dose goes up (PMID 39617283). Chest symptoms, a racing heart, or a known rhythm problem are reasons to talk to a clinician before a high dose. Blood-thinning drugs are another.</p>
<h2>A practical label check</h2>
<p>Add EPA and DHA. Something in the few-hundred-milligram range matches the general-health target. Jamieson Omega 3 Select, Health Canada NPN 80002596, lists fish oil 1,000 mg providing 300 mg EPA and 200 mg DHA. That is 500 mg of the two acids, and the NPN is a licence to sell in Canada, not a purity seal. Prescription-strength EPA is a different product and a different decision.</p>
<p>Names that were on a public certification list are in <a href="/a/certified-omega-3-products-compared.html">certified omega-3 products compared</a>.</p>
""",
        [
            src("EFSA Panel on Dietetic Products, Nutrition and Allergies. Scientific opinion on dietary reference values for fats. EFSA Journal. 2010;8(3):1461.", "EFSA dietary reference values for fats", url="https://www.efsa.europa.eu/en/efsajournal/pub/1461", funder="European Food Safety Authority", url_label="EFSA Journal"),
            src("Siscovick DS, et al. Omega-3 polyunsaturated fatty acid (fish oil) supplementation and the prevention of clinical cardiovascular disease. Circulation. 2017.", "AHA science advisory on fish oil", pmid="28289069", funder="American Heart Association"),
            src("Bhatt DL, et al. Cardiovascular risk reduction with icosapent ethyl for hypertriglyceridemia. N Engl J Med. 2019.", "REDUCE-IT icosapent ethyl", pmid="30415628"),
            src("Nicholls SJ, et al. Effect of high-dose omega-3 fatty acids vs corn oil on major adverse cardiovascular events. The STRENGTH randomized clinical trial. JAMA. 2020.", "STRENGTH high-dose omega-3 trial", pmid="33190147"),
            src("Omega-3 and risk of atrial fibrillation: vagally-mediated double-edged sword. Prog Cardiovasc Dis. 2025.", "Omega-3 and atrial fibrillation", pmid="39617283"),
        ],
    ))
    slugs.append(page(
        "creatine-loading-or-a-daily-dose",
        "Creatine loading or a daily dose",
        "Loading creatine for a week raises muscle stores faster. A steady 3 to 5 grams a day gets you to the same place. Loading is optional.",
        "You do not have to load creatine. A daily 3 to 5 grams of creatine monohydrate reaches the muscle store over a few weeks. A short loading phase, about 0.3 grams per kilogram of body weight for five to seven days, fills that store sooner. The later maintenance dose is still 3 to 5 grams. More is not a better long-term plan, and other forms have not replaced monohydrate.",
        """
<p>The loading debate is about speed, not about a different supplement. <a href="/supplement/creatine-monohydrate.html">Creatine monohydrate</a> is the form the sports-nutrition position stand is written around.</p>
<h2>What the loading study showed</h2>
<p>Hultman and colleagues measured muscle creatine while men took a loading dose and then a smaller daily dose (PMID 8828669). The muscle store rose quickly with the load and could then be held with a few grams a day. People who skipped the load and took a smaller daily amount still raised the store. It just took longer.</p>
<h2>The maintenance dose</h2>
<p>The ISSN creatine stand (PMID 28615996) describes about 0.3 grams per kilogram per day for five to seven days as a load, then 3 to 5 grams a day. The same 3 to 5 grams, without a load, is the simpler plan for anyone who is not in a hurry. Split the load across the day if you use it. A single huge scoop is what usually causes the stomach complaint.</p>
<h2>What not to add</h2>
<p>Buffered creatine, creatine HCl, and creatine mixed with HMB are marketing variants. The outcome evidence that the position stand relies on is monohydrate. <a href="/a/creatine-monohydrate-vs-other-forms.html">Creatine monohydrate versus other forms</a> stays on that point. Drink water as you usually would. Creatine is not a reason to dry out.</p>
""",
        [
            src("Hultman E, et al. Muscle creatine loading in men. J Appl Physiol. 1996.", "Muscle creatine loading in men", pmid="8828669"),
            src("Kreider RB, et al. International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation. J Int Soc Sports Nutr. 2017.", "ISSN creatine position stand", pmid="28615996"),
        ],
    ))
    slugs.append(page(
        "magnesium-glycinate-vs-citrate",
        "Magnesium glycinate vs citrate",
        "Citrate has the clearer absorption trials. Glycinate is the gentler pick for many stomachs. They are not interchangeable for constipation.",
        "Choose magnesium citrate when you want the form with a published absorption edge and you can tolerate looser stools. Choose magnesium glycinate when citrate or oxide bothers your stomach. Neither form is proven better for sleep in a head-to-head trial. Oxide is the one that is absorbed poorly. Count elemental magnesium, not the weight of the salt.",
        """
<p>These two salts solve different complaints. <a href="/supplement/magnesium-citrate.html">Magnesium citrate</a> pulls water into the gut. <a href="/supplement/magnesium-glycinate.html">Magnesium glycinate</a> is the chelate people switch to when they want less of that effect.</p>
<h2>Absorption</h2>
<p>A randomized comparison found citrate more bioavailable than other common magnesium preparations (PMID 14596323). Tests of US commercial products put oxide at the low end of absorption (PMID 11794633). A later review of intestinal absorption reaches the same practical conclusion: the compound on the label changes the dose you actually take up (PMID 29123461).</p>
<h2>Sleep and constipation are different jobs</h2>
<p>If the goal is sleep, read <a href="/a/best-magnesium-for-sleep.html">best magnesium for sleep</a>. The short version is that glycinate won the marketing, not a head-to-head sleep trial. If the goal is constipation, citrate is the form that matches that effect, and the dose should stay in a range you can live with. Kidney disease is a reason to ask before either one.</p>
<p>Certified bottles, where a public list actually named them, are in <a href="/a/certified-magnesium-products-compared.html">certified magnesium products compared</a>.</p>
""",
        [
            src("Walker AF, et al. Mg citrate found more bioavailable than other Mg preparations. Magnes Res. 2003.", "Magnesium citrate bioavailability", pmid="14596323"),
            src("Firoz M, Graber M. Bioavailability of US commercial magnesium preparations. Magnes Res. 2001.", "Commercial magnesium bioavailability", pmid="11794633"),
            src("Schuchardt JP, Hahn A. Intestinal absorption and factors influencing bioavailability of magnesium — an update. Curr Nutr Food Sci. 2017.", "Magnesium absorption update", pmid="29123461"),
        ],
    ))
    slugs.append(page(
        "iron-bisglycinate-vs-ferrous-sulfate",
        "Iron bisglycinate vs ferrous sulfate",
        "Elemental iron is the dose that matters. Bisglycinate is often easier to take. It is not a reason to skip a blood test or to treat your own anemia.",
        "Ferrous sulfate is the form most public-health programs have used. Ferrous bisglycinate is a chelate that many people tolerate with less stomach upset. A review of iron formulations in children describes real trade-offs and does not turn a chelate into a do-it-yourself anemia treatment. Compare elemental milligrams, take iron away from calcium, tea, and coffee, and get a ferritin or a clinician involved before a long course.",
        """
<p>Both <a href="/supplement/ferrous-bisglycinate.html">ferrous bisglycinate</a> and ordinary ferrous sulfate are ways of delivering elemental iron. The salt weight on the front of the bottle is the wrong number to compare. <a href="/supplement/iron.html">Iron</a> dosing in trials and guidelines is written in elemental milligrams.</p>
<h2>What we can and cannot say</h2>
<p>A 2026 narrative review of iron therapy in children walks through efficacy, safety, and formulation-specific trade-offs (PMID 41562673). It is about pediatric deficiency, not a licence for adults to pick a chelate from a shelf and skip follow-up. Stomach upset, constipation, and a metallic taste are the usual sulfate complaints. Bisglycinate is sold as the gentler option. Gentler does not mean the deficiency is gone.</p>
<h2>How to take it if a clinician has said you need it</h2>
<p>The NIH iron fact sheet is the reference for dietary allowances and upper limits, and for the interactions that block absorption. Calcium, tea, and coffee taken at the same time reduce what you absorb. Vitamin C with the dose is the old practical pairing. People who are pregnant, who have inflammatory bowel disease, or who have been told their iron is high should not start either form from an article.</p>
<p>This site does not sell either product and does not rank them by price.</p>
""",
        [
            src("Iron therapy in pediatric iron deficiency and iron-deficiency anemia: efficacy, safety, and formulation-specific trade-offs. Hematol Rep. 2026.", "Pediatric iron formulations review", pmid="41562673"),
            src("NIH Office of Dietary Supplements. Iron fact sheet for health professionals.", "NIH ODS iron fact sheet", url="https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/", funder="NIH Office of Dietary Supplements", url_label="NIH ODS"),
        ],
    ))
    slugs.append(page(
        "collagen-peptides-vs-whey-protein",
        "Collagen peptides vs whey protein",
        "Whey is a complete protein for muscle. Collagen is an incomplete protein studied for skin and joints and, with training, in one sarcopenia trial. They are not swaps.",
        "Use whey when the job is daily protein and muscle. Collagen peptides are low in essential amino acids, especially tryptophan, so they do not replace whey or food protein. One trial in older adults with sarcopenia found that collagen plus resistance training changed body composition. That is not a finding that collagen beats whey. If you want both, count collagen as extra, not as the protein target.",
        """
<p><a href="/supplement/whey-protein.html">Whey protein</a> is a complete protein. <a href="/supplement/collagen-peptides.html">Collagen peptides</a> are a partial one. Comparing them as if they were two flavors of the same tub is how people under-eat essential amino acids.</p>
<h2>Muscle protein</h2>
<p>The ISSN protein stand (PMID 28642676) and the Morton meta-analysis of protein plus lifting (PMID 28698222) are about reaching a daily protein intake. Whey is a convenient way to do that because it contains the essential amino acids muscle protein synthesis uses. Collagen does not match that amino acid pattern.</p>
<h2>What the collagen trial showed</h2>
<p>Zdzieblik and colleagues gave specific collagen peptides plus resistance training to older men with sarcopenia and reported better body composition and strength than training alone (PMID 26353786). The control was not whey. The people in the trial were not young athletes swapping shakes. Skin and joint claims live on the collagen card and should be read there, at the dose the trial used, not at "a scoop instead of dinner."</p>
<h2>If you already take whey</h2>
<p>Adding collagen on top does not require you to drop whey. Replacing whey with collagen does. <a href="/a/creatine-vs-whey-protein.html">Creatine vs whey</a> is the other common mix-up, and creatine is a third ingredient, not a protein.</p>
""",
        [
            src("Jäger R, et al. International Society of Sports Nutrition position stand: protein and exercise. J Int Soc Sports Nutr. 2017.", "ISSN protein position stand", pmid="28642676"),
            src("Morton RW, et al. Protein supplementation and resistance training-induced gains. Br J Sports Med. 2018.", "Protein meta-analysis", pmid="28698222"),
            src("Zdzieblik D, et al. Collagen peptide supplementation in combination with resistance training improves body composition and increases muscle strength in elderly sarcopenic men. Br J Nutr. 2015.", "Collagen peptides plus training in sarcopenia", pmid="26353786"),
        ],
    ))
    return slugs + rest()


def rest():
    slugs = []
    slugs.append(page(
        "ashwagandha-for-stress-what-dose-was-studied",
        "Ashwagandha for stress: what dose was studied",
        "A standardized ashwagandha extract reduced stress scores in a randomized trial. Root powder from a random bottle is not the same product.",
        "Ashwagandha has a real stress trial, and it used a standardized extract, not an unspecified root powder. Match the extract if you are trying to match the study. Do not stack it on thyroid medicine, sedatives, or pregnancy without advice. A lower score on a stress questionnaire is not a treatment for an anxiety disorder.",
        """
<p>The searchable claim is that <a href="/supplement/ashwagandha.html">ashwagandha</a> "lowers cortisol." The careful version is smaller. A randomized trial of a standardized Withania somnifera extract reported stress-relieving effects compared with placebo (PMID 31517876). The product in that paper is the product the result belongs to.</p>
<h2>Why the bottle matters</h2>
<p>Withanolide content varies. A capsule that only says "ashwagandha root" does not tell you it matches the extract in the trial. KSM-66 and Shoden are different extracts with different papers. Read the methods of the paper you are relying on before you copy a milligram number from a label.</p>
<h2>Who should not treat this as a casual add-on</h2>
<p>Thyroid disease, thyroid hormone, sedating drugs, and pregnancy are the situations where this root stops being a simple stress supplement. Stop and ask if you develop liver symptoms. The trial record is not a personality transplant and it is not a replacement for sleep, therapy, or prescribed care.</p>
""",
        [
            src("Lopresti AL, et al. An investigation into the stress-relieving and pharmacological actions of an ashwagandha (Withania somnifera) extract. Medicine (Baltimore). 2019.", "Ashwagandha extract and stress", pmid="31517876"),
        ],
    ))
    slugs.append(page(
        "zinc-for-colds-lozenges-vs-tablets",
        "Zinc for colds: lozenges versus daily tablets",
        "Zinc acetate lozenges, started early, are what the cold trials tested. A daily 15 mg tablet all winter is a different product and a different claim.",
        "If zinc helps a cold, the evidence is about lozenges used early, not about a daily tablet taken for months. An individual-patient meta-analysis of zinc acetate lozenges found shorter colds when the lozenges were the treatment. Long high-dose zinc can upset the stomach and can interfere with copper. Do not turn a five-day lozenge study into a permanent high dose.",
        """
<p>Cold-season marketing treats every <a href="/supplement/zinc.html">zinc</a> bottle as the same intervention. The lozenge trials are narrower than that.</p>
<h2>The lozenge evidence</h2>
<p>Hemilä and colleagues pooled individual patient data from zinc acetate lozenge trials and reported shorter colds (PMID 27378206). The lozenges were started when symptoms started. A zinc gluconate or bisglycinate tablet swallowed with breakfast is not that intervention. <a href="/supplement/zinc-bisglycinate.html">Zinc bisglycinate</a> is a form question about tolerability and absorption, not a cold cure.</p>
<h2>Dose and duration</h2>
<p>The lozenge trials used a high short course, well above a standard daily allowance. Nausea and a bad taste are common. Weeks of high-dose zinc are how people develop copper deficiency and neurologic symptoms. When the cold is over, stop. Children, pregnancy, and anyone on chronic zinc should follow a clinician rather than a lozenge label.</p>
""",
        [
            src("Hemilä H, et al. Zinc acetate lozenges for treating the common cold: an individual patient data meta-analysis. Br J Clin Pharmacol. 2016.", "Zinc acetate lozenges and the common cold", pmid="27378206"),
        ],
    ))
    slugs.append(page(
        "how-much-protein-powder-per-day",
        "How much protein powder per day",
        "Protein powder fills a gap. The target is daily protein from all food, and for lifters the ISSN range is about 1.4 to 2.0 grams per kilogram.",
        "Protein powder is optional. The ISSN range for exercising people is about 1.4 to 2.0 grams of protein per kilogram of body weight per day from food and supplements combined. A large meta-analysis found extra protein helped lifters, with little added benefit once daily intake was already high. One scoop is not a target. The gap between what you eat and that range is the scoop.",
        """
<p><a href="/supplement/whey-protein.html">Whey protein</a>, casein, and other powders are foods with a nutrition label. <a href="/supplement/protein-supplementation.html">Protein supplementation</a> in the trials means "more daily protein," not a specific brand.</p>
<h2>The range the position stand uses</h2>
<p>The ISSN protein stand puts exercising people around 1.4 to 2.0 grams per kilogram per day (PMID 28642676). A 70 kilogram adult at the low end is about 100 grams of protein from all sources, not 100 grams of powder. Morton's meta-analysis (PMID 28698222) found gains from added protein during resistance training and a flattening of the benefit as intake rose, around 1.6 grams per kilogram in that analysis.</p>
<h2>How to use a scoop</h2>
<p>Add up the protein you already eat. If you are short, one scoop of whey or <a href="/supplement/casein-protein.html">casein protein</a> can close the gap. If you are already in the range, another scoop is calories. Older adults who eat little protein are the group where the gap is most worth closing. Kidney disease is the situation where a high protein target needs a clinician, not a tub.</p>
""",
        [
            src("Jäger R, et al. International Society of Sports Nutrition position stand: protein and exercise. J Int Soc Sports Nutr. 2017.", "ISSN protein position stand", pmid="28642676"),
            src("Morton RW, et al. Protein supplementation and resistance-training gains. Br J Sports Med. 2018.", "Protein supplementation meta-analysis", pmid="28698222"),
        ],
    ))
    slugs.append(page(
        "coq10-ubiquinone-vs-ubiquinol",
        "CoQ10 ubiquinone vs ubiquinol",
        "The heart-failure outcome trial used ubiquinone. Ubiquinol is the reduced form and is not a second copy of that result.",
        "In the Q-SYMBIO trial, coenzyme Q10 reduced major cardiovascular events in people with chronic heart failure, and that result was statistically significant on the primary long-term outcome. The studied product was the oxidized form, ubiquinone, at 300 mg a day. Ubiquinol is sold as the reduced form. Better absorption on a lab test is not the same as a repeat of Q-SYMBIO. People on warfarin need specific advice before either form.",
        """
<p>Labels treat ubiquinol as the upgraded <a href="/supplement/coq10.html">CoQ10</a>. The trial that changed practice used <a href="/supplement/coq10-ubiquinone-classic-form.html">ubiquinone</a>.</p>
<h2>Q-SYMBIO</h2>
<p>Mortensen and colleagues randomized people with chronic heart failure to coenzyme Q10 or placebo and followed major adverse cardiovascular events (PMID 25282031). The primary long-term outcome favored coenzyme Q10. The dose was 100 mg three times a day, 300 mg total, of ubiquinone, on top of standard heart-failure care. It was not a wellness capsule for people with normal hearts, and it was not a reason to stop prescribed drugs.</p>
<h2>What ubiquinol adds</h2>
<p><a href="/supplement/coq10.html">CoQ10 (ubiquinol)</a> is the reduced molecule. Some pharmacokinetic comparisons show higher blood levels from ubiquinol at the same milligram dose. Those comparisons are not outcome trials in heart failure. If you are trying to follow Q-SYMBIO, ubiquinone at the studied dose is the match. If you take warfarin, CoQ10 can affect the INR. That conversation happens with the prescriber, not on a product page.</p>
""",
        [
            src("Mortensen SA, et al. The effect of coenzyme Q10 on morbidity and mortality in chronic heart failure: results from Q-SYMBIO. JACC Heart Fail. 2014.", "Q-SYMBIO coenzyme Q10 in heart failure", pmid="25282031"),
        ],
    ))
    slugs.append(page(
        "do-you-need-vitamin-k2-with-vitamin-d",
        "Do you need vitamin K2 with vitamin D?",
        "Vitamin D does not require a K2 add-on to be useful. A randomized trial of K2 plus D did not slow aortic valve calcification.",
        "You do not need vitamin K2 just because you take vitamin D. The randomized AVADEC trial gave vitamin K2 and vitamin D to people with aortic valve calcification and did not show slower valve disease. Vitamin D still has a dietary allowance of its own. K2 has a separate, thinner evidence file. Buy the combination only if you have a reason for both, not because a label says they belong together.",
        """
<p>The combination bottle is one of the most common add-ons sold next to <a href="/supplement/vitamin-d3.html">vitamin D3</a>. <a href="/supplement/vitamin-k2.html">Vitamin K2 (MK-7)</a> is a real compound with its own research. It is not a required partner.</p>
<h2>The valve trial</h2>
<p>The AVADEC trial randomized people with aortic valve calcification to vitamin K2 plus vitamin D or to placebo (PMID 35465686, Circulation). The combination did not slow the valve disease the trial was built to measure. That is a direct answer to the claim that the pair protects arteries or valves in this setting. It is not a finding that vitamin D itself is useless for its actual jobs, which are nutritional.</p>
<h2>When K is a drug interaction</h2>
<p>Vitamin K interferes with warfarin. A K2 softgel is not a casual add for anyone on that drug. For everyone else, a vitamin D product in the 600 to 2,000 IU range does not become incomplete because K2 is missing. See <a href="/a/vitamin-d-in-a-canadian-winter.html">vitamin D in a Canadian winter</a> for the allowance and the upper limit.</p>
""",
        [
            src("Vitamin K2 and D in patients with aortic valve calcification: a randomized double-blinded clinical trial. Circulation. 2022.", "AVADEC vitamin K2 and vitamin D", pmid="35465686"),
            src("NIH Office of Dietary Supplements. Vitamin D fact sheet for health professionals.", "NIH ODS vitamin D fact sheet", url="https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/", funder="NIH Office of Dietary Supplements", url_label="NIH ODS"),
        ],
    ))
    slugs.append(page(
        "caffeine-and-l-theanine",
        "Caffeine and L-theanine",
        "A controlled study found that caffeine plus L-theanine changed attention and mood versus either alone or placebo. It is a modest cognitive pairing, not a focus drug.",
        "Caffeine plus L-theanine has a real, small human study on attention and mood. The combination beat placebo on some tasks and was not the same as caffeine alone. It will not replace sleep. People who are pregnant, anxious, or sensitive to caffeine should not treat a stack as harmless because theanine is in tea. The study dose is in the paper, and a random focus gummy may not match it.",
        """
<p>Tea already contains both <a href="/supplement/caffeine.html">caffeine</a> and <a href="/supplement/l-theanine.html">L-theanine</a>. The supplement version is <a href="/supplement/l-theanine-caffeine.html">L-theanine plus caffeine</a> in capsule form, at doses higher than a cup of tea.</p>
<h2>The trial</h2>
<p>Haskell and colleagues tested L-theanine, caffeine, and the combination against placebo on cognition and mood (PMID 18006208). The combination had effects that neither component fully copied. That is the evidence. It is one controlled study of healthy adults, not a semester-long focus program and not a treatment for ADHD.</p>
<h2>Practical limits</h2>
<p>Caffeine later in the day costs sleep, and lost sleep costs the next day's attention. Theanine does not cancel that. If a product hides the caffeine milligrams inside a proprietary blend, skip it. Match a published dose or do not bother. Blood pressure, pregnancy, and panic symptoms are reasons to leave caffeine stacks alone.</p>
""",
        [
            src("Haskell CF, et al. The effects of L-theanine, caffeine and their combination on cognition and mood. Biol Psychol. 2008.", "L-theanine and caffeine on cognition and mood", pmid="18006208"),
        ],
    ))
    slugs.append(page(
        "berberine-and-blood-sugar",
        "Berberine and blood sugar",
        "Berberine lowered glucose in a meta-analysis of people with type 2 diabetes. It also behaves like a drug, with interactions, and it is not a substitute for prescribed care.",
        "Berberine has trial evidence for blood glucose in type 2 diabetes, summarized in a systematic review and meta-analysis. The doses in those trials are drug-like, often split across the day, and the side effect is often diarrhea. Berberine affects drug metabolism. It is not an over-the-counter replacement for metformin, and it is not appropriate in pregnancy. Anyone on glucose-lowering prescriptions should involve the prescriber.",
        """
<p><a href="/supplement/berberine.html">Berberine</a> is sold as a metabolic supplement. The papers are closer to a drug trial than to a vitamin.</p>
<h2>The glucose evidence</h2>
<p>A systematic review and meta-analysis of berberine in type 2 diabetes reported lower blood glucose (PMID 30393248). The people in the included studies already had diabetes. The result does not say a healthy person with a normal A1C should start it for prevention, and it does not say berberine replaces prescribed treatment.</p>
<h2>Why the dose is not casual</h2>
<p>Trial regimens are hundreds of milligrams at a time, more than once a day. Cramping and loose stools are common reasons people stop. Berberine inhibits pathways that clear other drugs, so transplant drugs, anticoagulants, and other narrow-window medicines are a hard stop for self-experimentation. <a href="/supplement/dihydroberberine.html">Dihydroberberine</a> is a different molecule and does not inherit this meta-analysis.</p>
""",
        [
            src("Effects of berberine on blood glucose in patients with type 2 diabetes mellitus: a systematic literature review and a meta-analysis. Endocr J. 2019.", "Berberine and blood glucose meta-analysis", pmid="30393248"),
        ],
    ))
    slugs.append(page(
        "psyllium-for-cholesterol",
        "Psyllium for cholesterol",
        "A 2024 review found that plantain-seed fiber lowers total and LDL cholesterol. The dose is several grams of husk with water, and it is one ingredient.",
        "Psyllium husk lowers total cholesterol and LDL cholesterol in the 2024 systematic review of Plantago trials. Take it with a full glass of water, start low if you bloat, and separate it from medicines by a couple of hours so it does not carry them through. It is a fiber, not a statin. People with swallowing problems or bowel narrowing should not start a bulking fiber.",
        """
<p><a href="/supplement/psyllium-husk.html">Psyllium husk</a> is the soluble fiber behind a lot of "cholesterol fiber" claims. The useful version is the husk itself, not a blend of ten powders.</p>
<h2>The 2024 review</h2>
<p>Zhu and colleagues, at Jilin University, systematically reviewed Plantago intake and found lower total cholesterol and lower LDL cholesterol in adults (PMID 38688104, Nutrition Research). That is a food-fiber result. It does not replace a statin for someone whose clinician has already prescribed one, and it does not justify a megadose.</p>
<h2>How to take it</h2>
<p>The trials use grams of husk per day, split, always with water. Taken dry, it can swell and obstruct. It can also bind other medicines, so leave a gap between psyllium and pills. Gas is the usual early effect and often fades if the dose rises slowly. One ingredient is the whole intervention. Added laxative stimulants are a different and harsher product.</p>
""",
        [
            src("Zhu R, et al. Plantago consumption significantly reduces total cholesterol and low-density lipoprotein cholesterol in adults: a systematic review and meta-analysis. Nutr Res. 2024.", "Plantago and LDL cholesterol", pmid="38688104", funder="Jilin University"),
        ],
    ))
    slugs.append(page(
        "creatine-monohydrate-vs-other-forms",
        "Creatine monohydrate vs HCl and other forms",
        "Creatine monohydrate is the form with the safety and efficacy record. HCl, buffered creatine, and blends have not replaced it.",
        "Buy creatine monohydrate unless you have a specific reason not to. The ISSN position stand is written around that form, at about 3 to 5 grams a day. Creatine HCl and buffered products are sold as easier on the stomach or as a smaller dose. Those marketing claims are not a second evidence base. A certified monohydrate powder is a quality question, covered separately, and it is still monohydrate.",
        """
<p>The form debate exists because <a href="/supplement/creatine-hcl.html">creatine HCl</a> and buffered salts can be sold at a higher price than <a href="/supplement/creatine-monohydrate.html">creatine monohydrate</a>. Price is not a trial.</p>
<h2>What the position stand supports</h2>
<p>The ISSN stand (PMID 28615996) reviews creatine monohydrate for strength, power, and lean mass alongside training, and it reviews safety at the doses used in those trials. Maintenance is about 3 to 5 grams a day. Loading is optional and is explained in <a href="/a/creatine-loading-or-a-daily-dose.html">creatine loading or a daily dose</a>.</p>
<h2>The other forms</h2>
<p>Creatine HCl dissolves in less water. That is a kitchen fact. It is not evidence that a smaller dose matches monohydrate's effect on muscle creatine. Buffered creatine has the same problem: a pH claim is not an outcome trial. If monohydrate upsets your stomach, split the 3 to 5 grams across the day before you pay for a different molecule.</p>
<p>Powders that were actually named on a certifier list are in <a href="/a/certified-creatine-products-compared.html">certified creatine products compared</a>.</p>
""",
        [
            src("Kreider RB, et al. International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation. J Int Soc Sports Nutr. 2017.", "ISSN creatine position stand", pmid="28615996"),
        ],
    ))
    slugs.append(page(
        "whey-protein-vs-casein-at-night",
        "Whey protein vs casein",
        "Whey is faster and casein is slower. For muscle, the day's total protein matters more than which one you drink at night.",
        "Whey protein is a fast protein and casein protein is a slow one. That difference is real and it is smaller than the internet claims. Total daily protein, in the range of about 1.4 to 2.0 grams per kilogram for people who train, is the decision that shows up in the trials. A casein shake at night is optional. It is not required for the gains, and it is not a fat-loss drug.",
        """
<p>Nighttime casein is a schedule, not a different goal. <a href="/supplement/whey-protein.html">Whey protein</a> empties from the stomach faster. <a href="/supplement/casein-protein.html">Casein protein</a> clots and digests more slowly. Both are complete proteins.</p>
<h2>What the protein evidence actually ranks</h2>
<p>The ISSN stand (PMID 28642676) spends its attention on daily intake, distribution across meals, and training. It does not require casein at bedtime. Morton's meta-analysis (PMID 28698222) ties extra daily protein to better gains from lifting, then shows the benefit flattening as intake rises. A slow protein at 10 p.m. cannot fix a day that was short on protein, and it adds little if the day was already sufficient.</p>
<h2>When the slower protein is the point</h2>
<p>People who wake hungry, or who struggle to eat enough at dinner, sometimes prefer casein because it is more filling. That is a preference. Lactose intolerance, milk allergy, and a need for a plant protein are reasons to leave both dairy proteins. A head-to-head product page on this site is <a href="/compare/whey-vs-casein.html">whey vs casein</a>.</p>
""",
        [
            src("Jäger R, et al. International Society of Sports Nutrition position stand: protein and exercise. J Int Soc Sports Nutr. 2017.", "ISSN protein position stand", pmid="28642676"),
            src("Morton RW, et al. Protein supplementation and resistance-training gains. Br J Sports Med. 2018.", "Protein supplementation meta-analysis", pmid="28698222"),
        ],
    ))
    slugs.append(page(
        "methylcobalamin-vs-cyanocobalamin",
        "Methylcobalamin vs cyanocobalamin",
        "The coenzyme forms of vitamin B12 are not clearly better than cyanocobalamin for preventing or treating deficiency. Dose and absorption are the real issues.",
        "Methylcobalamin is not a proven upgrade over cyanocobalamin for preventing or treating B12 deficiency. A review of the coenzyme forms reached that conclusion directly. What matters is whether you absorb B12 at all, especially after 50, on metformin, or on a vegan diet, and whether the dose is oral and high enough or given by injection. A pretty form on the label does not fix an absorption problem.",
        """
<p>Supplement aisles price <a href="/supplement/methylcobalamin.html">methylcobalamin</a> above cyanocobalamin and call it the active form. <a href="/supplement/vitamin-b12.html">Vitamin B12</a> chemistry is real. The clinical ranking is less dramatic.</p>
<h2>The comparison that exists</h2>
<p>Obeid and colleagues reviewed the coenzyme forms and concluded they are not likely to be superior to cyano- and hydroxocobalamin for preventing or treating deficiency (PMID 25820384). "Active" on a label is not a trial result. People who cannot absorb B12 from food, including many older adults and people with pernicious anemia, need a route and a dose that bypass the missing step. That is a clinician's decision, often an injection or a defined high oral dose, not a form upgrade.</p>
<h2>Who should actually supplement</h2>
<p>Vegan diets do not contain reliable B12. Metformin and long-term acid-suppressing drugs are common reasons a level falls. A multivitamin amount can be enough for prevention in someone who absorbs normally. It can be nowhere near enough for treatment of a deficiency. Test, do not guess, if there are neurologic symptoms.</p>
""",
        [
            src("Obeid R, et al. Cobalamin coenzyme forms are not likely to be superior to cyano- and hydroxyl-cobalamin in prevention or treatment of cobalamin deficiency. Mol Nutr Food Res. 2015.", "Cobalamin forms and deficiency", pmid="25820384"),
        ],
    ))
    return slugs


def is_creatine(name):
    return "creatine" in name.lower()


def is_vitamin_d(name):
    n = name.lower()
    if "omega" in n and "vitamin d" not in n:
        return False
    return "vitamin d" in n or re.search(r"\bd3\b", name, re.I)


def is_omega(name):
    return re.search(r"omega|fish oil|\bepa\b|\bdha\b|biomega", name, re.I)


def is_magnesium(name):
    return "magnesium" in name.lower()


def comparison_table(pred, prefer):
    rows = []
    for b in BRANDS:
        hits = [p for p in b["products"] if pred(p["name"])]
        if not hits:
            continue
        hits.sort(key=lambda p: (0 if prefer(p["name"]) else 1, len(p["name"])))
        best = hits[0]
        rows.append((b, best, len(hits)))
    rows.sort(key=lambda r: (r[1]["program"], r[0]["name"].lower()))
    trs = []
    for b, best, n in rows:
        more = f"{n - 1} other named product{'s' if n != 2 else ''} on the brand page" if n > 1 else "Only this match on the brand page"
        listing = best.get("listing") or next(pr["listing"] for pr in b["programs"] if pr["id"] == best["program"])
        trs.append(
            "<tr><td><a href=\"/brand/" + b["slug"] + ".html\">" + esc(b["name"]) + "</a></td>"
            "<td>" + esc(best["name"]) + "</td>"
            "<td><a href=\"" + esc(listing) + "\" rel=\"noopener noreferrer\">" + esc(best["program"]) + "</a></td>"
            "<td>" + esc(more) + "</td></tr>"
        )
    return len(rows), "".join(trs)


def comparisons():
    slugs = []
    n, table = comparison_table(
        is_creatine,
        lambda name: "monohydrate" in name.lower() and "hmb" not in name.lower() and "hcl" not in name.lower(),
    )
    slugs.append(page(
        "certified-creatine-products-compared",
        "Certified creatine products compared",
        "Creatine products that appeared on a public USP, NSF, Informed-Sport, or Informed-Choice list on 15 October 2026. Not a ranking and not a store.",
        f"This page compares certification, not muscle gain. {n} brands had at least one creatine product on a public list when we checked on 15 October 2026. The table shows one example per brand, preferring plain monohydrate when that exact name was listed. Flavors and blends stay on the brand page. A seal applies only to the named product. SupplementScore is not paid by any of these brands and does not link to a shop.",
        f"""
<p>Creatine quality and creatine efficacy are different questions. Efficacy is <a href="/supplement/creatine-monohydrate.html">creatine monohydrate</a> at about 3 to 5 grams a day. Quality, here, means only that the product name was on a certifier's public list. ConsumerLab results are not included because they are not on a public page.</p>
<h2>How to read the table</h2>
<p>NSF Certified for Sport and Informed-Sport test for banned substances as well as identity. Informed-Choice is the consumer version of the LGC program, not the same list as Informed-Sport. NOW Sports creatine on the Informed-Sport list is included. That does not mean NOW vitamin products are USP Verified. They were not on the USP directory. Transparent Labs entries on the list are creatine HMB products, so the example is HMB, not a plain monohydrate we did not see.</p>
<table>
<thead><tr><th>Brand</th><th>Example on the list</th><th>Program</th><th>Rest of the list</th></tr></thead>
<tbody>{table}</tbody>
</table>
<p>Doses and loading are in <a href="/a/creatine-loading-or-a-daily-dose.html">creatine loading or a daily dose</a>. Creatine versus protein powder is <a href="/a/creatine-vs-whey-protein.html">creatine vs whey protein</a>. The directory is <a href="/brands.html">verified brands</a>.</p>
""",
        [
            src("NSF Certified for Sport public product search.", "NSF Certified for Sport", url="https://www.nsfsport.com/certified-products/", funder="NSF", url_label="NSF"),
            src("Informed-Sport and Informed-Choice public lists, checked October 2026.", "Informed-Sport", url="https://sport.wetestyoutrust.com/", funder="LGC", url_label="Informed-Sport"),
            src("Kreider RB, et al. ISSN position stand: creatine. J Int Soc Sports Nutr. 2017.", "ISSN creatine position stand", pmid="28615996"),
        ],
    ))
    n, table = comparison_table(
        is_vitamin_d,
        lambda name: "vitamin d" in name.lower() and "5000" not in name and "gumm" not in name.lower(),
    )
    slugs.append(page(
        "certified-vitamin-d-products-compared",
        "Certified vitamin D products compared",
        "Vitamin D products named on a public USP, NSF, Informed-Sport, Informed-Choice, or Health Canada list on 15 October 2026.",
        f"These are not ranked by how well they raise a blood level. {n} brands had a vitamin D product on a public list on 15 October 2026. The adult upper limit is 4,000 IU a day, so a 5,000 IU softgel is above that limit unless a clinician is treating a deficiency. Jamieson's listed vitamin D licence is a 400 IU children's chewable. An NPN is a licence to sell in Canada, not a purity seal. We do not use affiliate links.",
        f"""
<p>Dose first, seal second. The allowance and the winter context are in <a href="/a/vitamin-d-in-a-canadian-winter.html">vitamin D in a Canadian winter</a>. <a href="/supplement/vitamin-d3.html">Vitamin D3</a> is the form on most of these labels. This table only includes names we saw on a certifier or licence page.</p>
<h2>What the programs mean</h2>
<p>USP Verified is a specific formula on the USP list. NSF Certified for Sport and Informed-Sport are aimed at drug-tested athletes. Informed-Choice is a separate consumer list. A Health Canada NPN is permission to sell that natural health product. Nature Made, Kirkland Signature, and Member's Mark vitamin D softgels in the table are USP examples where the directory named them. Nordic Naturals sport vitamin D gummies are NSF examples. They are not automatically better than a USP 1,000 IU softgel for an adult who only needs the dietary allowance.</p>
<table>
<thead><tr><th>Brand</th><th>Example on the list</th><th>Program</th><th>Rest of the list</th></tr></thead>
<tbody>{table}</tbody>
</table>
<p>Full product names, including flavors, are on each <a href="/brands.html">brand page</a>. K2 is not required: <a href="/a/do-you-need-vitamin-k2-with-vitamin-d.html">do you need vitamin K2 with vitamin D?</a></p>
""",
        [
            src("USP Verified product directory.", "USP Verified products", url="https://www.quality-supplements.org/usp_verified_products", funder="USP", url_label="USP"),
            src("Health Canada Licensed Natural Health Products Database.", "Health Canada LNHPD", url="https://health-products.canada.ca/lnhpd-bdpsnh/", funder="Health Canada", url_label="LNHPD"),
            src("NIH Office of Dietary Supplements. Vitamin D fact sheet for health professionals.", "NIH ODS vitamin D fact sheet", url="https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/", funder="NIH Office of Dietary Supplements", url_label="NIH ODS"),
        ],
    ))
    n, table = comparison_table(
        is_omega,
        lambda name: "fish oil" in name.lower() or "omega" in name.lower(),
    )
    slugs.append(page(
        "certified-omega-3-products-compared",
        "Certified omega-3 products compared",
        "Fish oil and omega-3 products named on a public certification or Health Canada licence list on 15 October 2026. No IFOS scores and no store links.",
        f"{n} brands had an omega-3 or fish-oil product on a public list we could open on 15 October 2026. The table is one example per brand. It is not an IFOS ranking, because IFOS scores were not used. Nordic Naturals entries are the Sport SKUs that appeared in the NSF search, not a claim about every Ultimate Omega bottle. Jamieson Omega 3 Select is a Canadian licence for a defined EPA and DHA amount, not a purity seal.",
        f"""
<p>Add EPA and DHA before you compare bottles. How those numbers relate to trials is in <a href="/a/how-much-omega-3-per-day.html">how much omega-3 per day</a>. <a href="/supplement/omega-3.html">Omega-3 (EPA/DHA)</a> is the ingredient page. Nothing here is a paid placement.</p>
<h2>Seals that are easy to mix up</h2>
<p>USP Verified fish oils, including several Nature Made and Kirkland Signature softgels, were on the USP directory. NSF Sport and Informed-Sport products were on those athletic lists. A product on one list is not on the others by default. We did not mark any product "IFOS 5-star" or "ConsumerLab approved." Those results were not on a public page we rechecked.</p>
<table>
<thead><tr><th>Brand</th><th>Example on the list</th><th>Program</th><th>Rest of the list</th></tr></thead>
<tbody>{table}</tbody>
</table>
<p>Recheck a seal on the certifier's own site before you treat it as current. Lists move. Our check date is 15 October 2026.</p>
""",
        [
            src("USP Verified product directory.", "USP Verified products", url="https://www.quality-supplements.org/usp_verified_products", funder="USP", url_label="USP"),
            src("NSF Certified for Sport public product search.", "NSF Certified for Sport", url="https://www.nsfsport.com/certified-products/", funder="NSF", url_label="NSF"),
            src("Bhatt DL, et al. REDUCE-IT. N Engl J Med. 2019.", "REDUCE-IT", pmid="30415628"),
        ],
    ))
    n, table = comparison_table(is_magnesium, lambda name: "glycinate" in name.lower() or "bisglycinate" in name.lower() or "citrate" in name.lower())
    slugs.append(page(
        "certified-magnesium-products-compared",
        "Certified magnesium products compared",
        "Magnesium products named on a public NSF, Informed-Sport, Informed-Choice, or USP list on 15 October 2026.",
        f"A certification is not a sleep study. {n} brands had a magnesium product on a public list on 15 October 2026. Where the list included a glycinate, bisglycinate, or citrate, that name is the example. Combination calcium tablets are included only when magnesium is in the product name that appeared on the list. The seal covers that product, not every magnesium the brand sells.",
        f"""
<p>Which salt to take is <a href="/a/magnesium-glycinate-vs-citrate.html">magnesium glycinate vs citrate</a> and <a href="/a/best-magnesium-for-sleep.html">best magnesium for sleep</a>. This page does not repeat that choice. It lists products whose names we saw on a certifier page. <a href="/supplement/magnesium-glycinate.html">Magnesium glycinate</a> and <a href="/supplement/magnesium-citrate.html">magnesium citrate</a> are the ingredient pages.</p>
<h2>The list</h2>
<p>Kirkland Signature magnesium citrate softgels were on the USP Verified directory. Thorne, Momentous, Designs for Sport, Klean Athlete, Bulk Supplements, and others had magnesium names on NSF Certified for Sport. Kaged and a few Informed-Sport brands had a magnesium name on that list. None of this is an affiliate offer.</p>
<table>
<thead><tr><th>Brand</th><th>Example on the list</th><th>Program</th><th>Rest of the list</th></tr></thead>
<tbody>{table}</tbody>
</table>
<p>Elemental magnesium, not the salt weight, is the dose. The supplemental upper limit for adults is 350 mg a day of elemental magnesium from supplements unless a clinician says otherwise.</p>
""",
        [
            src("USP Verified product directory.", "USP Verified products", url="https://www.quality-supplements.org/usp_verified_products", funder="USP", url_label="USP"),
            src("NSF Certified for Sport public product search.", "NSF Certified for Sport", url="https://www.nsfsport.com/certified-products/", funder="NSF", url_label="NSF"),
            src("Firoz M, Graber M. Bioavailability of US commercial magnesium preparations. Magnes Res. 2001.", "Commercial magnesium bioavailability", pmid="11794633"),
        ],
    ))
    return slugs


if __name__ == "__main__":
    done = guides() + comparisons()
    print("wrote", len(done))
    for s in done:
        print(s)

