#!/usr/bin/env node
/**
 * Build brand pages, the brands directory, sitemap-brands.xml, and data/brands.json
 * from data/verified-brands.json.
 *
 *   node scripts/gen_brand_pages.mjs
 *
 * Every product in the source file was checked against a public certifier list.
 * This script does not invent certifications. It only renders what the JSON names.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { slugify, resolveSupplement } from './slug.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'data', 'verified-brands.json');
const CHECKED = '15 October 2026';

const db = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const brands = db.brands;
if (!Array.isArray(brands) || !brands.length) {
  console.error('verified-brands.json has no brands');
  process.exit(1);
}

const sitemapSlugs = new Set();
const sm = fs.readFileSync(path.join(ROOT, 'sitemap-supplements.xml'), 'utf8');
for (const m of sm.matchAll(/\/supplement\/([a-z0-9-]+)\.html/g)) sitemapSlugs.add(m[1]);

const footer = fs.readFileSync(path.join(ROOT, '_partials', 'footer.html'), 'utf8')
  .replace(/^<!--[\s\S]*?-->\s*/m, '');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pageSlugFor(name) {
  if (!name) return null;
  const full = slugify(name);
  const short = slugify(String(name).replace(/\s*\([^)]*\)\s*/g, ' ').trim());
  for (const c of [short, full]) {
    if (!c || !sitemapSlugs.has(c)) continue;
    if (!fs.existsSync(path.join(ROOT, 'supplement', c + '.html'))) continue;
    const rec = resolveSupplement(c);
    if (rec && rec.n === name) return c;
  }
  return null;
}

const slugCache = new Map();
function supplementHref(name) {
  if (slugCache.has(name)) return slugCache.get(name);
  const slug = pageSlugFor(name);
  const href = slug ? '/supplement/' + slug + '.html' : null;
  slugCache.set(name, href);
  return href;
}

/** First matching rule wins. Specific patterns stay above broad ones. */
const RULES = [
  [/tongkat/i, 'Tongkat ali (Eurycoma longifolia, standardised)'],
  [/ashwagandha/i, 'Ashwagandha (KSM-66)'],
  [/meriva|phytosome/i, 'Meriva curcumin (phytosome)'],
  [/curcumin|turmeric/i, 'Curcumin (bioavailable form)'],
  [/quercetin/i, 'Quercetin'],
  [/krill/i, 'Krill oil'],
  [/flax/i, 'Flaxseed oil (ALA omega-3)'],
  [/ubiquinol/i, 'CoQ10 (Ubiquinol)'],
  [/coq10|coenzyme q10/i, 'CoQ10 (ubiquinone, classic form)'],
  [/prenatal/i, null],
  [/multivitamin|multi-vitamin|multivites|\bmulti\b|daily multi|multiple vitamin/i, 'Multivitamins (healthy adults)'],
  [/klean-?d\b|vitamin d|\bd3\b|super d\b/i, 'Vitamin D3'],
  [/bisglycinate|glycinate/i, 'Magnesium glycinate'],
  [/magnesium citrate/i, 'Magnesium citrate'],
  [/magnesium malate/i, 'Magnesium malate'],
  [/threonate|neuromag/i, 'Magnesium L-threonate'],
  [/magnesium/i, 'Magnesium'],
  [/zinc/i, 'Zinc'],
  [/vitamin c\s*1000|\bc-1000\b/i, 'Vitamin C (megadose)'],
  [/vitamin c|\bascorb|\bnature made c\b/i, 'Vitamin C (moderate dose)'],
  [/melaton/i, 'Melatonin'],
  [/probiotic|culturelle|florasport/i, 'Probiotics'],
  [/\biron\b/i, 'Iron'],
  [/potassium gluconate/i, 'Potassium gluconate'],
  [/calcium/i, 'Calcium'],
  [/collagen/i, 'Collagen peptides'],
  [/casein/i, 'Casein protein'],
  [/pea protein/i, 'Pea protein'],
  [/whey/i, 'Whey protein'],
  [/glucosamine|chondroitin/i, 'Glucosamine / Chondroitin'],
  [/b-?12|b12/i, 'Vitamin B12'],
  [/biotin/i, 'Biotin (high-dose)'],
  [/milk thistle|silymarin/i, 'Milk thistle (Silymarin)'],
  [/lutein/i, 'Lutein + Zeaxanthin'],
  [/beta[- ]?alanine/i, 'Beta-Alanine'],
  [/glutamine/i, 'Glutamine (standalone, healthy adults)'],
  [/psyllium/i, 'Psyllium husk (Plantago ovata)'],
  [/p5p|pyridoxal/i, 'Vitamin B6 (P5P)'],
  [/berberine/i, 'Berberine'],
  [/theanine/i, 'L-Theanine'],
  [/niagen|nicotinamide riboside/i, 'Nicotinamide riboside (NR)'],
  [/beet ?root|beetroot|nitrate/i, 'Dietary Nitrate / Beetroot'],
  [/b-?complex|\bb complex\b/i, 'B-complex (balanced)'],
  [/vitamin k2|\bk2\b/i, 'Vitamin K2 (MK-7)'],
  [/astaxanthin/i, 'Astaxanthin'],
  [/citrulline malate/i, 'Citrulline malate'],
  [/citrulline/i, 'Citrulline (L-citrulline, pure form)'],
  [/sodium bicarbonate|\bbicarb/i, 'Sodium bicarbonate (sports)'],
  [/acetyl-?l-?carnitine|\balcar\b/i, 'Acetyl-L-Carnitine (ALCAR)'],
  [/\bl-carnitine\b|\bcarnitine\b/i, 'L-Carnitine'],
  [/creatine/i, 'Creatine monohydrate'],
  [/\bnac\b|n-acetyl/i, 'NAC (N-Acetyl Cysteine)'],
  [/rhodiola/i, 'Rhodiola rosea'],
  [/resveratrol/i, 'Resveratrol'],
  [/apigenin/i, 'Apigenin'],
  [/alpha gpc|\bgpc\b/i, 'Alpha-GPC'],
  [/inositol/i, 'Myo-inositol'],
  [/tyrosine/i, 'Tyrosine (L-tyrosine)'],
  [/betaine hcl/i, 'Betaine HCl'],
  [/\bbcaa/i, 'BCAAs (standalone)'],
  [/electrolyte|\bhydration\b|(?<!creatine )\bhydrate\b/i, 'Electrolyte complex (Na/K/Mg)'],
  [/omega|fish oil|\bepa\b|\bdha\b/i, 'Omega-3 (EPA/DHA)'],
];

function supplementsFor(product) {
  if (Array.isArray(product.supplements)) return product.supplements.filter(Boolean);
  const hits = [];
  for (const [re, target] of RULES) {
    if (!target) {
      if (re.test(product.name)) return [];
    } else if (re.test(product.name) && !hits.includes(target)) {
      hits.push(target);
    }
  }
  return hits.slice(0, 3);
}

const missing = [];
for (const b of brands) {
  const ids = new Set(b.programs.map(p => p.id));
  for (const product of b.products) {
    if (!ids.has(product.program)) missing.push(b.slug + ' product program ' + product.program);
    product._supplements = supplementsFor(product);
    for (const name of product._supplements) {
      if (!supplementHref(name)) missing.push(b.slug + ' → no static page for "' + name + '" (' + product.name + ')');
    }
    const prog = b.programs.find(p => p.id === product.program);
    product._listing = product.listing || prog.listing;
    if (!/^https:\/\//.test(product._listing)) missing.push(b.slug + ' bad listing ' + product.name);
  }
}
if (missing.length) {
  console.error(missing.slice(0, 40).join('\n'));
  console.error('FAIL', missing.length, 'brand link problems');
  process.exit(1);
}

function sentenceClip(text, max) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > 80 ? cut.slice(0, sp) : cut).replace(/[,:;]$/, '') + '.';
}

function programLinks(b) {
  return b.programs.map(p =>
    '<li><a href="' + esc(p.listing) + '" rel="noopener noreferrer">' + esc(p.id) + '</a> — ' + esc(p.scope) + '</li>'
  ).join('');
}

function productRows(b) {
  return b.products.map((product, i) => {
    const sups = product._supplements.map(name => {
      const href = supplementHref(name);
      return '<a href="' + esc(href) + '">' + esc(name) + '</a>';
    }).join(', ');
    const bits = [product.form, product.note].filter(Boolean).join(' — ');
    return '<tr id="p-' + (i + 1) + '">'
      + '<td>' + esc(product.name) + '</td>'
      + '<td><a href="' + esc(product._listing) + '" rel="noopener noreferrer">' + esc(product.program) + '</a></td>'
      + '<td>' + (sups || '—') + (bits ? '<div class="brand-note">' + esc(bits) + '</div>' : '') + '</td>'
      + '</tr>';
  }).join('');
}

function relatedSupplements(b) {
  const seen = new Set();
  const links = [];
  for (const product of b.products) {
    for (const name of product._supplements) {
      if (seen.has(name)) continue;
      seen.add(name);
      links.push('<a href="' + esc(supplementHref(name)) + '">' + esc(name) + '</a>');
    }
  }
  if (!links.length) return '';
  return '<h2>Supplement pages</h2><p class="brand-p">These links go to the ingredient pages, which describe the evidence. The certification above is about the named product, not about whether the ingredient works.</p><ul class="brand-chips">'
    + links.map(a => '<li>' + a + '</li>').join('') + '</ul>';
}

function guideLinks(b) {
  const names = b.products.map(p => p.name);
  const any = (pred) => names.some(pred);
  const vitD = (n) => {
    const s = n.toLowerCase();
    if (s.includes('omega') && !s.includes('vitamin d')) return false;
    return s.includes('vitamin d') || /\bd3\b/i.test(n);
  };
  const omega = (n) => /omega|fish oil|\bepa\b|\bdha\b/i.test(n);
  const rows = [
    [(n) => /creatine/i.test(n), '/a/certified-creatine-products-compared.html', 'Certified creatine products compared'],
    [(n) => /creatine|whey/i.test(n), '/a/creatine-vs-whey-protein.html', 'Creatine vs whey protein'],
    [vitD, '/a/certified-vitamin-d-products-compared.html', 'Certified vitamin D products compared'],
    [vitD, '/a/vitamin-d-in-a-canadian-winter.html', 'Vitamin D in a Canadian winter'],
    [omega, '/a/certified-omega-3-products-compared.html', 'Certified omega-3 products compared'],
    [omega, '/a/how-much-omega-3-per-day.html', 'How much omega-3 per day'],
    [(n) => /magnesium/i.test(n), '/a/certified-magnesium-products-compared.html', 'Certified magnesium products compared'],
    [(n) => /magnesium/i.test(n), '/a/best-magnesium-for-sleep.html', 'Best magnesium for sleep'],
  ];
  const seen = new Set();
  const items = [];
  for (const [pred, href, label] of rows) {
    if (seen.has(href) || !any(pred)) continue;
    seen.add(href);
    items.push('<li><a href="' + href + '">' + esc(label) + '</a></li>');
  }
  if (!items.length) return '';
  return '<h2>Guides</h2><ul class="brand-list">' + items.join('') + '</ul>\n';
}

function otherBrands(b) {
  const primary = b.programs[0].id;
  const same = brands.filter(x => x.slug !== b.slug && x.programs.some(p => p.id === primary)).slice(0, 6);
  const rest = brands.filter(x => x.slug !== b.slug && !same.includes(x)).slice(0, 6 - same.length);
  return same.concat(rest).map(x =>
    '<li><a href="/brand/' + x.slug + '.html">' + esc(x.name) + '</a> <span>' + esc(x.programs.map(p => p.id).join(', ')) + '</span></li>'
  ).join('');
}

const css = `
body{background:var(--color-background-primary);color:var(--color-text-primary)}
.brand-wrap{max-width:920px;margin:0 auto;padding:28px 22px 64px}
.brand-crumb{font-size:12.5px;color:var(--color-text-tertiary);margin:0 0 14px}
.brand-crumb a{color:inherit;text-decoration:none}
.brand-crumb a:hover{color:var(--color-brand)}
.brand-eye{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--color-brand,#1F7A6B);margin:0 0 6px}
.ss-last-reviewed{font-size:13px;color:var(--color-text-tertiary);margin:0 0 14px}
.ss-last-reviewed a{color:inherit}
h1{font-size:34px;line-height:1.12;letter-spacing:-.4px;margin:0 0 12px}
.brand-p{font-size:15.5px;line-height:1.65;margin:0 0 14px}
h2{font-size:18px;margin:28px 0 10px}
.brand-call{border-left:3px solid var(--color-brand,#1F7A6B);padding:4px 0 4px 14px;margin:16px 0 22px;font-size:15px;line-height:1.6}
.brand-list{margin:0;padding-left:18px}
.brand-list li{margin:0 0 8px;line-height:1.55}
.brand-table{width:100%;border-collapse:collapse;font-size:14px}
.brand-table th,.brand-table td{text-align:left;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--color-border-tertiary,#e5e7eb)}
.brand-table th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-text-tertiary)}
.brand-note{color:var(--color-text-tertiary);font-size:12.5px;margin-top:3px}
.brand-chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}
.brand-chips a{display:inline-block;padding:6px 10px;border:1px solid var(--color-border-tertiary,#e5e7eb);border-radius:999px;text-decoration:none;color:var(--color-text-primary);font-size:13.5px}
.brand-chips a:hover{border-color:var(--color-brand,#1F7A6B)}
.brand-others{list-style:none;padding:0;margin:0}
.brand-others li{padding:8px 0;border-bottom:1px solid var(--color-border-tertiary,#e5e7eb);font-size:14.5px}
.brand-others span{color:var(--color-text-tertiary);font-size:12.5px;margin-left:6px}
.brand-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.brand-card{display:block;padding:14px;border:1px solid var(--color-border-tertiary,#e5e7eb);border-radius:12px;text-decoration:none;color:inherit}
.brand-card:hover{border-color:var(--color-brand,#1F7A6B)}
.brand-card strong{display:block;margin-bottom:4px}
.brand-card span{display:block;color:var(--color-text-secondary);font-size:13px;line-height:1.45}
a{color:var(--color-brand,#1F7A6B)}
`;

function head(title, description, url) {
  const d = esc(description);
  const t = esc(title);
  const u = esc(url);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${u}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://supplementscore.org/og/default.png">
<meta property="og:site_name" content="SupplementScore">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="https://supplementscore.org/og/default.png">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#1F7A6B">
<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
<link rel="stylesheet" href="/critical.css?v=1">
<link rel="stylesheet" href="/styles.css?v=1" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/styles.css?v=1"></noscript>
<link rel="stylesheet" href="/page-chrome.css?v=brandbar1">
<style>${css}</style>
`;
}

/* Same compact bar as the static info pages. The X returns to the
   previous page, or to home when this tab has no history. */
const pageBar = `<header class="ss-pagebar">
  <div class="ss-pagebar-inner">
    <a class="ss-pagebar-brand" href="/">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.5 3.75C4.5 3.75 4.5 3 6 3H18C19.5 3 19.5 3.75 19.5 3.75V13.5C19.5 18.75 15.75 21 12 21.75C8.25 21 4.5 18.75 4.5 13.5V3.75Z"/><rect x="7.1" y="12" width="2.6" height="5.25" rx=".94" fill="white"/><rect x="10.7" y="9" width="2.6" height="8.25" rx=".94" fill="white"/><rect x="14.25" y="6" width="2.6" height="11.25" rx=".94" fill="white"/></svg>
      <span class="ss-pagebar-name">SupplementScore<span>.org</span></span>
    </a>
    <a class="ss-pagebar-x" href="/" aria-label="Close" onclick="if(history.length>1){history.back();return false;}">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </a>
  </div>
</header>
`;

const brandDir = path.join(ROOT, 'brand');
fs.mkdirSync(brandDir, { recursive: true });

const urls = [];
for (const b of brands) {
  const url = 'https://supplementscore.org/brand/' + b.slug + '.html';
  const programs = [...new Set(b.programs.map(p => p.id))].join(', ');
  const title = b.name + ' verified products (' + b.programs[0].id + ') | SupplementScore';
  const description = sentenceClip(b.knownFor, 158);
  const itemList = {
    '@type': 'ItemList',
    name: b.name + ' products checked against a public certifier list',
    numberOfItems: b.products.length,
    itemListElement: b.products.slice(0, 40).map((product, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: product.name,
      url: product._listing
    }))
  };
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: title,
        description,
        isPartOf: { '@type': 'WebSite', name: 'SupplementScore', url: 'https://supplementscore.org/' },
        about: { '@type': 'Brand', name: b.name, description: sentenceClip(b.knownFor, 280) }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://supplementscore.org/' },
          { '@type': 'ListItem', position: 2, name: 'Verified brands', item: 'https://supplementscore.org/brands.html' },
          { '@type': 'ListItem', position: 3, name: b.name, item: url }
        ]
      },
      itemList
    ]
  };
  const html = head(title, description, url)
    + '<script type="application/ld+json">' + JSON.stringify(jsonld) + '</script>\n</head>\n<body>\n' + pageBar + '\n<main class="brand-wrap">\n'
    + '<p class="brand-crumb"><a href="/">Home</a> / <a href="/brands.html">Verified brands</a> / ' + esc(b.name) + '</p>\n'
    + '<p class="brand-eye">Verified brands</p>\n'
    + '<h1>' + esc(b.name) + '</h1>\n'
    + '<p class="ss-last-reviewed">Last reviewed <time datetime="2026-10-15">15 October 2026</time> by the SupplementScore team. No named reviewer. <a href="/transparency.html">How we choose brands</a>.</p>\n'
    + '<p class="brand-p">' + esc(b.knownFor) + '</p>\n'
    + '<p class="brand-call">Checked ' + CHECKED + '. ' + b.products.length + ' product'
    + (b.products.length === 1 ? '' : 's') + ' below. Programs: ' + esc(programs)
    + '. A seal applies to the named product, not to every bottle this brand sells. Lists change; use the certifier link before you treat a seal as current.</p>\n'
    + '<h2 id="sources">Sources</h2>\n<p class="brand-p">Each link is the public certifier or licence page checked on 15 October 2026. A retailer page, an affiliate link, or the brand\'s own advertisement is not a source for these listings.</p>\n<ul class="brand-list">' + programLinks(b) + '</ul>\n'
    + '<h2>Products on the official list</h2>\n'
    + '<table class="brand-table"><thead><tr><th>Product</th><th>Certification</th><th>Ingredient page</th></tr></thead><tbody>'
    + productRows(b) + '</tbody></table>\n'
    + relatedSupplements(b)
    + guideLinks(b)
    + '<h2>Other checked brands</h2>\n<ul class="brand-others">' + otherBrands(b) + '</ul>\n'
    + '<p class="brand-p" style="margin-top:22px"><a href="/brands.html">Full verified-brands directory</a> · <a href="/a/third-party-supplement-certifications-usp-nsf-and-consumerlab-decoded.html">What these seals do and do not mean</a></p>\n'
    + '</main>\n' + footer + '\n</body>\n</html>\n';
  fs.writeFileSync(path.join(brandDir, b.slug + '.html'), html);
  urls.push(url);
}

// Directory page
const byProgram = new Map();
for (const b of brands) {
  for (const p of b.programs) {
    if (!byProgram.has(p.id)) byProgram.set(p.id, []);
    if (!byProgram.get(p.id).includes(b)) byProgram.get(p.id).push(b);
  }
}
const indexUrl = 'https://supplementscore.org/brands.html';
const indexTitle = 'Verified supplement brands: USP, NSF, Informed Sport, and NPN | SupplementScore';
const indexDesc = 'Supplement brands with a product on a public USP, NSF Certified for Sport, Informed-Sport, Informed-Choice, or Health Canada list, checked 15 October 2026.';
const indexLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebPage', '@id': indexUrl, url: indexUrl, name: indexTitle, description: indexDesc },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://supplementscore.org/' },
      { '@type': 'ListItem', position: 2, name: 'Verified brands', item: indexUrl }
    ]},
    { '@type': 'ItemList', name: 'Verified supplement brands', numberOfItems: brands.length,
      itemListElement: brands.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, url: 'https://supplementscore.org/brand/' + b.slug + '.html' })) }
  ]
};
let sections = '';
for (const [pid, list] of byProgram) {
  sections += '<h2>' + esc(pid) + '</h2><div class="brand-grid">' + list.map(b => {
    const n = b.products.filter(p => p.program === pid).length;
    return '<a class="brand-card" href="/brand/' + b.slug + '.html"><strong>' + esc(b.name) + '</strong><span>'
      + n + ' product' + (n === 1 ? '' : 's') + ' on this list</span></a>';
  }).join('') + '</div>';
}
const indexHtml = head(indexTitle, indexDesc, indexUrl)
  + '<script type="application/ld+json">' + JSON.stringify(indexLd) + '</script>\n</head>\n<body>\n' + pageBar + '\n<main class="brand-wrap">\n'
  + '<p class="brand-crumb"><a href="/">Home</a> / Verified brands</p>\n'
  + '<p class="brand-eye">Quality</p>\n<h1>Verified supplement brands</h1>\n'
  + '<p class="ss-last-reviewed">Last reviewed <time datetime="2026-10-15">15 October 2026</time>. <a href="/transparency.html">No ads, sponsors, or affiliate links</a>.</p>\n'
  + '<p class="brand-p">This directory lists brands that have at least one product on a public certification or licence list. Each brand page names the products, the program, and the page where you can recheck the listing. SupplementScore is not paid by any brand here.</p>\n'
  + '<p class="brand-call">' + brands.length + ' brands and ' + brands.reduce((n, b) => n + b.products.length, 0)
  + ' products, checked ' + CHECKED + '.</p>\n'
  + '<h2>What counts</h2><ul class="brand-list">'
  + '<li><a href="https://www.quality-supplements.org/usp_verified_products">USP Verified</a> is the yellow USP mark for a specific formula. "USP grade" on a label is not the same thing.</li>'
  + '<li><a href="https://www.nsfsport.com/certified-products/">NSF Certified for Sport</a> tests identity, dose, contaminants, and substances banned in sport. An NSF gluten-free mark is a different program and is not listed here.</li>'
  + '<li><a href="' + esc('https://sport.wetestyoutrust.com/') + '">Informed-Sport</a> and <a href="https://choice.wetestyoutrust.com/">Informed-Choice</a> are LGC batch-testing programs. Sport is aimed at drug-tested athletes. Choice is the consumer program. A product on one list is not automatically on the other.</li>'
  + '<li><a href="https://health-products.canada.ca/lnhpd-bdpsnh/">Health Canada NPN</a> means that product is licensed for sale in Canada. It is not a purity seal like USP or NSF.</li>'
  + '</ul>'
  + '<h2>What was left off</h2><ul class="brand-list">'
  + '<li>ConsumerLab pass or fail results sit behind a subscription. No product is marked ConsumerLab-approved here, because that result was not on a public page we could recheck.</li>'
  + '<li>Labdoor rankings, "third-party tested" with no named program, patented-ingredient logos, and USDA Organic are not treated as these certifications.</li>'
  + '<li>Older pages on this site named NOW Foods vitamins as USP Verified. NOW was not on the USP Verified directory when we checked. NOW Sports products that are on the Informed-Sport list are on the <a href="/brand/now.html">NOW page</a>.</li>'
  + '</ul>'
  + sections
  + '<p class="brand-p" style="margin-top:28px">Read <a href="/a/third-party-supplement-certifications-usp-nsf-and-consumerlab-decoded.html">what USP, NSF, Informed-Sport, and ConsumerLab actually test</a>. Seals do not show that a supplement works.</p>\n'
  + '</main>\n' + footer + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(ROOT, 'brands.html'), indexHtml);

const outBrands = {
  _meta: {
    version: '2.0.0',
    updated: '2026-10-15',
    policy: 'A product is listed only when its name appeared on the certifier\'s public list on 15 October 2026. Certification is product-specific. SupplementScore receives no payment from listed brands and does not use affiliate links. ConsumerLab approvals are omitted because the product results are not on a public page.',
    sources: {}
  }
};
for (const b of brands) {
  for (const p of b.programs) outBrands._meta.sources[p.id] = p.listing;
  for (const product of b.products) {
    for (const name of product._supplements) {
      const key = name.toLowerCase();
      if (!outBrands[key]) outBrands[key] = [];
      outBrands[key].push({
        brand: product.name,
        brandSlug: b.slug,
        brandName: b.name,
        verified: [product.program],
        listing: product._listing,
        form: product.form || '',
        notes: 'On the ' + product.program + ' public list, checked 15 October 2026.'
      });
    }
  }
}

fs.writeFileSync(path.join(ROOT, 'data', 'brands.json'), JSON.stringify(outBrands, null, 2) + '\n');

const locs = [indexUrl, ...urls].map(u =>
  '  <url><loc>' + u + '</loc><lastmod>2026-10-15</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>'
).join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap-brands.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + locs + '\n</urlset>\n');

console.log('brands', brands.length);
console.log('products', brands.reduce((n, b) => n + b.products.length, 0));
console.log('supplement keys', Object.keys(outBrands).length - 1);
