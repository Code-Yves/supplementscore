#!/usr/bin/env node
/**
 * Build the cited interaction checker and the crawlable drug-class pages
 * from data/interactions.json. Re-run after editing that file.
 *
 *   node scripts/gen_interaction_pages.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/interactions.json'), 'utf8'));
const partial = fs.readFileSync(path.join(root, '_partials/footer.html'), 'utf8');
const footer = partial.slice(
  partial.indexOf('<!-- SS_FOOTER_BEGIN -->'),
  partial.indexOf('<!-- SS_FOOTER_END -->') + '<!-- SS_FOOTER_END -->'.length
);
if (!footer.includes('SS_FOOTER_BEGIN')) throw new Error('footer markers missing');

const outDir = path.join(root, 'interactions');
fs.mkdirSync(outDir, { recursive: true });

const SEV = [
  ['avoid', 'Do not combine on your own'],
  ['caution', 'Ask before you combine'],
  ['separate', 'Separate the doses'],
  ['labs', 'Can skew a lab test'],
  ['monitor', 'A reason to check levels']
];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function card(row) {
  const links = row.supplements.map((s) =>
    `<a href="/supplement/${esc(s.slug)}.html">${esc(s.name)}</a>`
  ).join('');
  const sources = row.sources.map((src) =>
    `<li><a href="${esc(src.url)}" rel="noopener noreferrer">${esc(src.label)}</a> <span class="ix-kind">${esc(src.kind)}</span></li>`
  ).join('');
  return `<article class="ix-card ix-${esc(row.severity)}">
    <p class="ix-sev">${esc(SEV.find((s) => s[0] === row.severity)?.[1] || row.severity)}</p>
    <h3>${esc(row.title)}</h3>
    <p>${esc(row.explanation)}</p>
    <p class="ix-supps">${links}</p>
    <ol class="ix-sources">${sources}</ol>
  </article>`;
}

function rowsFor(classIds) {
  const want = new Set(classIds);
  return data.interactions
    .filter((row) => row.classes.some((id) => want.has(id)))
    .sort((a, b) => {
      const ar = SEV.findIndex((s) => s[0] === a.severity);
      const br = SEV.findIndex((s) => s[0] === b.severity);
      return ar - br;
    });
}

const css = `
    body{background:var(--color-background-primary);color:var(--color-text-primary)}
    .ix-page{max-width:680px;margin:0 auto;padding:16px 16px 32px;line-height:1.6;font-size:16px;box-sizing:border-box}
    .ix-warn{margin:0 0 16px;padding:8px 16px;border-left:4px solid var(--color-brand);background:var(--color-warn-bg);color:var(--color-warn-text-strong);font-size:16px;line-height:1.4}
    .ix-lede,.ix-note,.ix-card p,.ix-sources{font-size:16px;line-height:1.6;color:var(--color-text-primary)}
    .ix-lede{margin:0 0 16px;max-width:680px}
    .ix-note{margin:0 0 16px;color:var(--color-text-secondary);max-width:680px}
    .ix-page h2{font-size:1.25rem;margin:24px 0 8px}
    .ix-card{border:1px solid var(--color-border-tertiary);padding:16px;margin:0 0 16px;background:var(--color-background-primary);max-width:680px}
    .ix-card h3{font-size:1.125rem;line-height:1.35;margin:0 0 8px}
    .ix-sev{display:block;margin:0 0 8px;font-size:16px;font-weight:700;line-height:1.4;color:var(--color-brand);background:none;border:0;padding:0}
    .ix-supps{display:flex;flex-wrap:wrap;gap:8px 16px;margin:8px 0}
    .ix-supps a{display:inline-flex;align-items:center;min-height:44px;padding:8px 0;color:var(--color-brand);background:none;border-radius:0;text-decoration:underline;text-underline-offset:4px;font-size:16px}
    .ix-supps a:hover,.ix-supps a:focus-visible{color:var(--color-brand-hover, #0f4a41)}
    .ix-supps a:focus-visible{outline:2px solid var(--color-brand);outline-offset:2px}
    .ix-sources{margin:8px 0 0 16px;padding:0}
    .ix-sources li{margin:0 0 8px}
    .ix-kind{color:var(--color-text-tertiary)}
    .ix-links{display:flex;flex-direction:column;gap:8px;margin:8px 0 0}
    .ix-links a{display:block;padding:16px;min-height:44px;border:1px solid var(--color-border-tertiary);border-radius:0;background:var(--color-background-secondary);color:var(--color-text-primary);text-decoration:none}
    .ix-links a:hover{color:var(--color-brand);border-color:var(--color-brand)}
    .ix-links a:focus-visible{outline:2px solid var(--color-brand);outline-offset:2px;color:var(--color-brand)}
    .site-nav{margin:0;width:100%}
    html.rc-chrome-active main.ix-page.ar-wrap .ar-column{max-width:680px;font-size:16px}
    @media (min-width:768px){
      .ix-page{font-size:18px;padding:24px 24px 32px}
      .ix-lede,.ix-note,.ix-card p,.ix-sources{font-size:18px}
      html.rc-chrome-active main.ix-page.ar-wrap .ar-column,
      html.rc-chrome-active main.ix-page.ar-wrap .ar-column p:not(.ar-kicker):not(.ar-byline){font-size:18px}
    }
    @media (max-width:767px){
      html.rc-chrome-active main.ix-page.ar-wrap .ar-column p:not(.ar-kicker):not(.ar-byline){font-size:16px}
    }
    @media (max-width:600px){
      body:has(main.ix-page){padding-top:0 !important}
    }
`;

function head(opts) {
  const url = opts.file === 'index.html'
    ? 'https://supplementscore.org/interactions/'
    : `https://supplementscore.org/interactions/${opts.file}`;
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://supplementscore.org/" },
    { "@type": "ListItem", position: 2, name: "Interaction guides", item: "https://supplementscore.org/interactions/" }
  ];
  if (opts.file !== 'index.html') {
    crumbs.push({ "@type": "ListItem", position: 3, name: opts.crumb, item: url });
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(opts.title)}</title>
  <meta name="description" content="${esc(opts.description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${esc(opts.title)}">
  <meta property="og:description" content="${esc(opts.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="SupplementScore">
  <meta property="og:image" content="https://supplementscore.org/og/default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(opts.title)}">
  <meta name="twitter:description" content="${esc(opts.description)}">
  <meta name="twitter:image" content="https://supplementscore.org/og/default.png">
  <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
  <script>document.documentElement.setAttribute('data-theme','light');</script>
  <style>html{color-scheme:light}</style>
  <link rel="stylesheet" href="/critical.css?v=design3">
  <link rel="stylesheet" href="/styles.css?v=design3" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="/styles.css?v=design3"></noscript>
  <style>${css}</style>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https://formspree.io; base-uri 'self'; form-action 'self' https://formspree.io;">
  <script type="application/ld+json">
  ${JSON.stringify({ "@context": "https://schema.org", "@type": "Article", "headline": opts.h1, "articleSection": "Interactions", "dateModified": data.updated, "author": { "@type": "Organization", "name": "SupplementScore team" } })}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs })}
  </script>
  <script src="/_site-ux.js?v=design3" defer></script>
  <script src="/_research-chrome.js?v=design3" defer></script>
</head>
<body>
<main class="ar-wrap ix-page">
  <h1>${esc(opts.h1)}</h1>
  <p class="ix-warn">Ask a pharmacist before you change a supplement.</p>
  ${opts.lede ? `<p class="ix-lede">${esc(opts.lede)}</p>` : ''}
  ${opts.note ? `<p class="ix-note">${esc(opts.note)}</p>` : ''}
  ${opts.body}
</main>
${footer}
</body>
</html>
`;
}

const pageLinks = data.pages.map((p) =>
  `<a href="/interactions/${esc(p.slug)}.html"><strong>${esc(p.title)}</strong><br>${esc(p.lede)}</a>`
).join('\n');

const indexBody = `
  <h2>Guides by medicine</h2>
  <div class="ix-links">${pageLinks}</div>
`;

fs.writeFileSync(path.join(outDir, 'index.html'), head({
  file: 'index.html',
  title: 'Supplement and medication interaction guides — SupplementScore',
  description: 'Cited pairs for common medicines. Warfarin, SSRIs, statins, thyroid medicine, diabetes drugs, blood pressure, birth control, and immunosuppressants.',
  crumb: 'Interaction guides',
  kicker: 'No ads · cited pairs only',
  h1: 'Interaction guides',
  lede: '',
  note: '',
  body: indexBody
}));

for (const page of data.pages) {
  const rows = rowsFor(page.classes);
  if (!rows.length) throw new Error('page has no rows: ' + page.slug);
  const grouped = SEV.map(([key, label]) => {
    const items = rows.filter((r) => r.severity === key);
    if (!items.length) return '';
    return `<h2>${esc(label)}</h2>\n${items.map(card).join('\n')}`;
  }).join('\n');
  const body = `
    <p class="ix-note">Names people search: ${esc(page.also)}</p>
    ${grouped}
    <p><a href="/interactions/">All interaction guides</a></p>
  `;
  fs.writeFileSync(path.join(outDir, page.slug + '.html'), head({
    file: page.slug + '.html',
    title: page.title + ' — SupplementScore',
    description: page.description,
    crumb: page.title,
    kicker: page.kicker,
    h1: page.title,
    lede: page.lede,
    note: page.note,
    body
  }));
}

const slugs = new Set();
for (const row of data.interactions) {
  for (const s of row.supplements) {
    const file = path.join(root, 'supplement', s.slug + '.html');
    if (!fs.existsSync(file)) throw new Error('missing supplement page ' + s.slug);
    slugs.add(s.slug);
  }
  for (const src of row.sources) {
    if (!/^https:\/\//.test(src.url)) throw new Error('source must be https: ' + src.url);
  }
}

const detailPath = path.join(root, 'supplement-detail.js');
let detail = fs.readFileSync(detailPath, 'utf8');
const block = '/* SS_IX_SLUGS_BEGIN */\n  var SS_IX_SLUGS = ' +
  JSON.stringify(Object.fromEntries([...slugs].sort().map((s) => [s, 1]))) +
  ';\n  /* SS_IX_SLUGS_END */';
if (detail.includes('/* SS_IX_SLUGS_BEGIN */')) {
  detail = detail.replace(/\/\* SS_IX_SLUGS_BEGIN \*\/[\s\S]*?\/\* SS_IX_SLUGS_END \*\//, block);
  fs.writeFileSync(detailPath, detail);
}

const needle = '<a href="/about.html#transparency">Funding, brand listings, and corrections</a>';
let linked = 0;
let skipped = 0;
for (const slug of slugs) {
  const file = path.join(root, 'supplement', slug + '.html');
  let html = fs.readFileSync(file, 'utf8');
  const href = `<a href="/interactions/#s=${slug}">Cited medication interactions</a>`;
  if (html.includes(href)) { linked++; continue; }
  if (!html.includes(needle)) { skipped++; continue; }
  html = html.replace(needle, needle + href);
  fs.writeFileSync(file, html);
  linked++;
}

const locs = ['index.html', ...data.pages.map((p) => p.slug + '.html')];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map((f) => `  <url><loc>https://supplementscore.org/interactions/${f === 'index.html' ? '' : f}</loc><lastmod>${data.updated}</lastmod><changefreq>monthly</changefreq><priority>${f === 'index.html' ? '0.8' : '0.7'}</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(root, 'sitemap-interactions.xml'), xml);

const indexPath = path.join(root, 'sitemap-index.xml');
let indexXml = fs.readFileSync(indexPath, 'utf8');
if (!indexXml.includes('sitemap-interactions.xml')) {
  indexXml = indexXml.replace(
    '</sitemapindex>',
    `  <sitemap>\n    <loc>https://supplementscore.org/sitemap-interactions.xml</loc>\n    <lastmod>${data.updated}</lastmod>\n  </sitemap>\n</sitemapindex>\n`
  );
  fs.writeFileSync(indexPath, indexXml);
}

const medHub = path.join(root, 'm/index.html');
let hub = fs.readFileSync(medHub, 'utf8');
const hubLine = '<p class="hub-lede" style="margin-top:-12px">For cited supplement interactions by medicine, see the <a href="/interactions/">interaction guides</a>. The medicine pages below are a separate, older set.</p>';
if (!hub.includes('/interactions/')) {
  hub = hub.replace('</p>\n\n  <div class="hub-grid">', '</p>\n' + hubLine + '\n  <div class="hub-grid">');
  fs.writeFileSync(medHub, hub);
}

console.log(`pages ${data.pages.length + 1} interactions ${data.interactions.length} supplement links ${linked} skipped ${skipped}`);
