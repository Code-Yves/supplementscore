#!/usr/bin/env node
/**
 * Prerender /supplement/<slug>.html for every slug in sitemap-supplements.xml.
 *
 * Why (2026-10-12): every /supplement.html?slug=… URL returned byte-identical
 * raw HTML (generic title, no canonical), so Google grouped them as duplicates
 * and picked its own canonical (GSC "Duplicate, Google chose different
 * canonical than user"). Static pages give each supplement unique raw HTML:
 * title, description, self-canonical, OG tags, H1 + summary, JSON-LD.
 * The same supplement-detail.js SPA then hydrates the page as before.
 *
 * 2026-10-14 — also bake a self-URL into the raw JSON-LD (the shell's
 * WebPage block pointed every page at /supplement.html), a real social
 * image, and a short related-supplement list so crawlers see internal
 * links before JavaScript runs.
 *
 * Usage: node scripts/gen_supplement_static.mjs   (re-run after data.js edits)
 */
import { resolveSupplement } from './slug.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'supplement');
const ORIGIN = 'https://supplementscore.org';
const smPath = path.join(REPO, 'sitemap-supplements.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const slugs = [...new Set([...sm.matchAll(/(?:slug=|\/supplement\/)([a-z0-9-]+)(?:\.html)?</g)].map(m => m[1]))];

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function clip(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const sentences = s.split(/(?<=[.!?])\s+(?=[A-Z])/);
  let out = '';
  for (const sent of sentences) {
    const candidate = (out + ' ' + sent).trim();
    if (candidate.length <= n) { out = candidate; continue; }
    if (out) break;
    const chunk = sent.slice(0, n + 1);
    const cut = Math.max(...['. ', '; ', ', ', ' — '].map(sep => chunk.lastIndexOf(sep)));
    if (cut >= 50) {
      let piece = sent.slice(0, cut).replace(/[,;:\s]+$/, '');
      if (!/[.!?]$/.test(piece)) piece += '.';
      return piece;
    }
    let piece = sent.slice(0, n).replace(/\s+\S*$/, '').replace(/[,;:\s]+$/, '');
    if (!/[.!?]$/.test(piece)) piece += '.';
    return piece;
  }
  return out;
}
const json = obj => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
const TIER = { t1:'Tier 1 — strong evidence', t2:'Tier 2 — promising', t3:'Tier 3 — weak evidence', t4:'Tier 4 — risky / avoid' };
const SAFETY = {
  t1: 'Strong evidence base; safe for adult use at standard doses. SupplementScore Tier 1.',
  t2: 'Promising or situational evidence; benefits depend on indication and dosing. SupplementScore Tier 2.',
  t3: 'Trending in wellness culture but limited clinical evidence. SupplementScore Tier 3.',
  t4: 'Documented safety risks including possible organ damage, drug interactions, or regulatory warnings. Do not use without clinician supervision. SupplementScore Tier 4.'
};
// First match wins. More specific families come before broader ones.
const HUB_RULES = [
  [/creatine/i, 'creatine', 'Creatine hub'],
  [/vitamin d|cholecalciferol/i, 'vitamin-d', 'Vitamin D hub'],
  [/omega-3|fish oil|\bepa\b|\bdha\b|algal oil/i, 'omega-3', 'Omega-3 hub'],
  [/magnesium/i, 'magnesium', 'Magnesium hub'],
  [/probiotic|lactobacillus|bifidobacterium|saccharomyces|boulardii/i, 'probiotics', 'Probiotics hub'],
  [/ashwagandha|rhodiola|ginseng|schisandra|holy basil|tulsi|eleuthero|adaptogen/i, 'adaptogens', 'Adaptogens hub'],
  [/collagen|glucosamine|chondroitin|boswellia|curcumin|hyaluronic/i, 'joint-health', 'Joint health hub'],
  [/melatonin|theanine|valerian|\bgaba\b|\bglycine\b/i, 'sleep', 'Sleep hub'],
  [/caffeine|beta-alanine|citrulline|\bwhey\b|dietary nitrate|\bhmb\b/i, 'athletic-performance', 'Athletic performance hub'],
];

function topicOf(s) {
  return String(s.tag || '').split('·')[0].trim().toLowerCase();
}
function scoreOf(s) {
  return (s.e||0)*7 + (s.s||0)*4 + (s.r||0)*3 + (s.o||0)*2 + (s.c||0)*2 + (s.d||0)*2;
}
function hubFor(s, slug) {
  const blob = `${s.n || ''} ${s.tag || ''} ${slug}`;
  for (const [re, id, label] of HUB_RULES) {
    if (re.test(blob)) return { href: `/hub/${id}.html`, label };
  }
  return null;
}
function ogImageFor(slug) {
  if (fs.existsSync(path.join(REPO, 'og', slug + '.webp'))) return `${ORIGIN}/og/${slug}.webp`;
  if (fs.existsSync(path.join(REPO, 'og', slug + '.png'))) return `${ORIGIN}/og/${slug}.png`;
  return `${ORIGIN}/og/default.png`;
}

const pages = [];
for (const slug of slugs) {
  const s = resolveSupplement(slug);
  if (!s) { console.warn('unresolved', slug); continue; }
  pages.push({ slug, s });
}

// 1. Inline the static-slug list into supplement.html so ?slug= URLs canonicalise to the static page.
const shellPath = path.join(REPO, 'supplement.html');
let shell = fs.readFileSync(shellPath, 'utf8');
const listJs = `<script id="ss-static-slugs">window.__SS_STATIC=${JSON.stringify(Object.fromEntries(slugs.map(s=>[s,1])))};window.__SS_CANON=function(s){return 'https://supplementscore.org'+(window.__SS_STATIC[s]?'/supplement/'+s+'.html':'/supplement.html?slug='+s);};</script>`;
if (/<script id="ss-static-slugs">[\s\S]*?<\/script>/.test(shell)) shell = shell.replace(/<script id="ss-static-slugs">[\s\S]*?<\/script>/, listJs);
else shell = shell.replace('<head>\n', '<head>\n' + listJs + '\n');
fs.writeFileSync(shellPath, shell);

// Keep search-index.js pointed at the same set so cards, search, and pairings
// link to the prerendered page instead of the old query address.
const siPath = path.join(REPO, 'search-index.js');
let si = fs.readFileSync(siPath, 'utf8');
const slugBlock = `/* SS_STATIC_SLUGS:start */\n  var STATIC_SUPPLEMENT_SLUGS = ${JSON.stringify(Object.fromEntries(slugs.map(s=>[s,1])))};\n  /* SS_STATIC_SLUGS:end */`;
if (/\/\* SS_STATIC_SLUGS:start \*\/[\s\S]*?\/\* SS_STATIC_SLUGS:end \*\//.test(si)) {
  si = si.replace(/\/\* SS_STATIC_SLUGS:start \*\/[\s\S]*?\/\* SS_STATIC_SLUGS:end \*\//, slugBlock);
  fs.writeFileSync(siPath, si);
} else {
  console.warn('search-index.js is missing the SS_STATIC_SLUGS marker');
}

// 2. Write one static page per slug.
let n = 0;
for (const { slug, s } of pages) {
  const url = `${ORIGIN}/supplement/${slug}.html`;
  const title = `${s.n} — SupplementScore`;
  const desc = clip(s.desc, 155) || `${s.n}: evidence tier, dose, interactions and citations on SupplementScore.`;
  const img = ogImageFor(slug);
  const altMatch = String(s.n || '').match(/\(([^)]+)\)/);
  let h = shell;
  h = h.replace('<head>\n', `<head>\n<base href="/">\n<script>window.__SS_SLUG=${JSON.stringify(slug)};</script>\n`);
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>\n<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(desc)}`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`);
  if (!h.includes('property="og:image"')) {
    h = h.replace(
      /(<meta property="og:url" content="[^"]*">)/,
      `$1\n<meta property="og:image" content="${img}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="${esc(title)}">\n<meta name="twitter:image" content="${img}">`
    );
  }

  const longDesc = String(s.desc || '').replace(/\s+/g, ' ').trim();
  const schemaDesc = clip(longDesc, 480);
  const webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: desc,
    url,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'SupplementScore', url: ORIGIN },
    publisher: { '@type': 'Organization', name: 'SupplementScore' }
  };
  const dietary = {
    '@context': 'https://schema.org',
    // MedicalEntity, not DietarySupplement. DietarySupplement subclasses Product,
    // so Google demands offers/review/aggregateRating this non-profit site does not have.
    '@type': 'MedicalEntity',
    name: s.n,
    description: schemaDesc || `${s.n} — evidence-based supplement detail.`,
    safetyConsideration: SAFETY[s.t] || 'See methodology for current evidence rating.',
    url,
    image: img,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'SupplementScore',
      url: ORIGIN,
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/og/default.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }
  };
  if (altMatch) dietary.alternateName = altMatch[1].trim();
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Supplements', item: `${ORIGIN}/browse.html` },
      { '@type': 'ListItem', position: 3, name: s.n, item: url }
    ]
  };
  h = h.replace(
    /<script type="application\/ld\+json">\s*\{[\s\S]*?"@type": "WebPage"[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${json(webpage)}\n</script>\n<script type="application/ld+json" id="ss-jsonld-dietarysupplement">\n${json(dietary)}\n</script>`
  );
  h = h.replace(
    /<!-- SEO-BREADCRUMB:start -->[\s\S]*?<!-- SEO-BREADCRUMB:end -->/,
    `<!-- SEO-BREADCRUMB:start -->\n<script type="application/ld+json" id="ss-jsonld-breadcrumb">\n${json(breadcrumb)}\n</script>\n<!-- SEO-BREADCRUMB:end -->`
  );

  const topic = topicOf(s);
  const related = (topic && topic.length > 2)
    ? pages.filter(p => p.slug !== slug && topicOf(p.s) === topic)
        .sort((a, b) => scoreOf(b.s) - scoreOf(a.s))
        .slice(0, 5)
    : [];
  const hub = hubFor(s, slug);
  const relItems = related.map(p => `<li><a href="/supplement/${p.slug}.html">${esc(p.s.n)}</a></li>`).join('');
  const hubItem = hub ? `<li><a href="${hub.href}">${esc(hub.label)}</a></li>` : '';
  const relatedNav = `<nav class="det-related-supps" aria-label="Related supplements"><h2>Related</h2><ul>${relItems}${hubItem}<li><a href="/browse.html">Browse all supplements</a></li></ul></nav>`;

  const reviewed = `<p class="ss-last-reviewed">Last reviewed <time datetime="2026-10-15">15 October 2026</time> · <a href="/about.html#transparency">SupplementScore team</a></p>`;
  const sources = `<section class="det-sources" id="det-sources"><h2 class="det-sources-h">Sources</h2><div class="det-sources-grid"><a href="/about.html#methodology">How scores are calculated</a><a href="/about.html#transparency">Funding, brand listings, and corrections</a><a href="/about.html#editorial">Who writes the pages</a></div></section>`;
  const body = `<main class="det-wrap" id="det-root"><h1 class="det-h1">${esc(s.n)}</h1>`
    + reviewed
    + (TIER[s.t] ? `<p><b>${esc(TIER[s.t])}</b>${s.tag ? ' · ' + esc(s.tag) : ''}</p>` : '')
    + `<p>${esc(clip(s.desc, 600))}</p>`
    + (s.dose ? `<p><b>Dose:</b> ${esc(clip(s.dose, 300))}</p>` : '')
    + sources
    + relatedNav
    + `</main>`;
  h = h.replace('<main class="det-wrap" id="det-root"></main>', body
    + `\n<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var id=a.getAttribute('href').slice(1);if(!id)return;var t=document.getElementById(id);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});history.replaceState(null,'',location.pathname+'#'+id);}});</script>`);
  fs.writeFileSync(path.join(OUT, slug + '.html'), h);
  n++;
}

// 3. Point the sitemap at the static URLs.
sm = sm.replace(/https:\/\/supplementscore\.org\/supplement\.html\?slug=([a-z0-9-]+)/g, `${ORIGIN}/supplement/$1.html`);
fs.writeFileSync(smPath, sm);
console.log(`wrote ${n} static supplement pages`);
