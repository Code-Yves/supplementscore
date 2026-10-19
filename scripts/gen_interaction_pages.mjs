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
    .ix-wrap{max-width:760px;margin:0 auto;padding:28px 18px 72px;line-height:1.6}
    .ix-kicker{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-text-tertiary);margin:0 0 8px}
    .ix-wrap h1{font-size:1.7rem;line-height:1.2;margin:0 0 12px}
    .ix-lede{font-size:1.05rem;margin:0 0 14px}
    .ix-note{font-size:14.5px;color:var(--color-text-secondary);margin:0 0 16px}
    .ix-disclaimer{background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:14px 16px;margin:0 0 22px}
    .ix-disclaimer strong{display:block;margin-bottom:4px}
    .ix-disclaimer p{margin:0;font-size:15px}
    .ix-meta{font-size:13px;color:var(--color-text-tertiary);margin:0 0 22px}
    .ix-wrap h2{font-size:1.25rem;margin:28px 0 10px}
    .ix-card{border:1px solid var(--color-border-tertiary);border-radius:12px;padding:14px 14px 12px;margin:0 0 12px;background:var(--color-background-primary)}
    .ix-card h3{font-size:1.05rem;line-height:1.35;margin:0 0 8px}
    .ix-sev{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.02em;margin:0 0 8px;padding:3px 8px;border-radius:999px}
    .ix-avoid .ix-sev{background:#fee2e2;color:#991b1b}
    .ix-caution .ix-sev{background:#ffedd5;color:#9a3412}
    .ix-separate .ix-sev{background:#e0f2fe;color:#075985}
    .ix-labs .ix-sev{background:#ede9fe;color:#5b21b6}
    .ix-monitor .ix-sev{background:#ccfbf1;color:#115e59}
    .ix-supps{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
    .ix-supps a,.ix-links a{display:inline-block;padding:6px 10px;border-radius:999px;background:var(--color-background-secondary);text-decoration:none}
    .ix-sources{margin:8px 0 0 18px;padding:0;font-size:14px}
    .ix-sources li{margin:0 0 4px}
    .ix-kind{color:var(--color-text-tertiary)}
    .ix-links{display:flex;flex-direction:column;gap:8px;margin:8px 0 0}
    .ix-links a{border-radius:10px}
    .ix-check{border-top:1px solid var(--color-border-tertiary);padding-top:8px}
    .ix-cols{display:grid;grid-template-columns:1fr;gap:16px}
    @media(min-width:760px){.ix-cols{grid-template-columns:1fr 1fr}}
    .ix-check label{display:block;font-weight:650;margin-bottom:6px}
    .ix-check input{width:100%;font-size:16px;padding:12px 12px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--color-background-primary);color:inherit}
    .ix-picks{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;max-height:280px;overflow:auto}
    .ix-picks button{font:inherit;font-size:14px;min-height:44px;padding:8px 12px;border-radius:999px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);color:inherit}
    .ix-picks button.on{background:#115e59;color:#fff;border-color:#115e59}
    .ix-selected{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
    .ix-chip,.ix-clear{font:inherit;min-height:44px;padding:8px 12px;border-radius:999px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);color:inherit}
    .ix-hit{outline:2px solid #115e59}
    .ix-none,.ix-prompt,.ix-empty{font-size:15px}
    .ix-results-h{margin-top:8px}
    .ix-wrap a{color:var(--color-text-primary)}
    .ix-disclaimer a{color:inherit}
`;

function head(opts) {
  const url = opts.file === 'index.html'
    ? 'https://supplementscore.org/interactions/'
    : `https://supplementscore.org/interactions/${opts.file}`;
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://supplementscore.org/" },
    { "@type": "ListItem", position: 2, name: "Interaction checker", item: "https://supplementscore.org/interactions/" }
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
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%231F7A6B'/%3E%3Cpath d='M5 19C5 11 11 5 19 5C19 13 13 19 5 19Z' fill='%23F8F4ED'/%3E%3Cpath d='M5 19C9 15 13 11 19 5' stroke='%231F7A6B' stroke-width='1.4' stroke-linecap='round' fill='none'/%3E%3C/svg%3E">
  <script>document.documentElement.setAttribute('data-theme','light');</script>
  <style>html{color-scheme:light}</style>
  <link rel="stylesheet" href="/critical.css?v=2cd7a7c1">
  <link rel="stylesheet" href="/styles.css?v=b12faq01" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="/styles.css?v=b12faq01"></noscript>
  <style>${css}</style>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https://formspree.io; base-uri 'self'; form-action 'self' https://formspree.io;">
  <script type="application/ld+json">
  ${JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs })}
  </script>
</head>
<body>
<main class="ix-wrap">
  <p class="ix-kicker">${esc(opts.kicker)}</p>
  <h1>${esc(opts.h1)}</h1>
  <div class="ix-disclaimer" role="note">
    <strong>Talk to a pharmacist before you change anything.</strong>
    <p>This is an educational list of interactions tied to a public source. It is not a complete medication review and it is not medical advice. Ask a pharmacist, or the clinician who prescribes the medicine, before you start, stop, or change a supplement. A pair that is missing here is not a safety clearance. SupplementScore takes no ads, sponsorships, or affiliate income. <a href="/transparency.html">How this site is funded</a>.</p>
  </div>
  <p class="ix-lede">${esc(opts.lede)}</p>
  ${opts.note ? `<p class="ix-note">${esc(opts.note)}</p>` : ''}
  <p class="ix-meta">Last reviewed <time datetime="${data.updated}">15 October 2026</time> · <a href="/transparency.html">SupplementScore team</a></p>
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
  <section class="ix-check" id="checker">
    <h2>Check a combination</h2>
    <p class="ix-help">Pick one or more medicines and one or more supplements. You can also pick just a medicine to see every cited flag for that group.</p>
    <div class="ix-cols">
      <div>
        <label for="ix-med-q">Medicine or drug class</label>
        <input id="ix-med-q" type="search" placeholder="Search warfarin, metformin, lisinopril" autocomplete="off" enterkeyhint="search">
        <div id="ix-meds" class="ix-picks"></div>
      </div>
      <div>
        <label for="ix-sup-q">Supplement</label>
        <input id="ix-sup-q" type="search" placeholder="Search vitamin K, berberine, iron" autocomplete="off" enterkeyhint="search">
        <div id="ix-sups" class="ix-picks"></div>
      </div>
    </div>
    <div id="ix-selected" class="ix-selected" aria-live="polite"></div>
    <div id="ix-results"></div>
  </section>
  <h2>Guides by medicine</h2>
  <p>These pages are the same cited lists, written out so they can be read without running a script.</p>
  <div class="ix-links">${pageLinks}</div>
  <script type="application/json" id="ix-data">${JSON.stringify(data)}</script>
  <script src="/interactions/checker.js?v=1" defer></script>
`;

fs.writeFileSync(path.join(outDir, 'index.html'), head({
  file: 'index.html',
  title: 'Supplement and medication interaction checker — SupplementScore',
  description: 'Check cited interactions between supplements and common medicines: warfarin, SSRIs, statins, thyroid medicine, diabetes drugs, blood pressure pills, birth control, and immunosuppressants. Talk to a pharmacist. No ads.',
  crumb: 'Interaction checker',
  kicker: 'No ads · cited pairs only',
  h1: 'Supplement and medication interaction checker',
  lede: 'Pick a medicine, a supplement, or both. Each flag has a plain-language explanation and a link to NIH ODS, NCCIH, a regulator page, or a peer-reviewed review. We do not fill gaps with guesses.',
  note: 'The checker runs in your browser. It does not send the medicines you select to us.',
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
    <p><a href="/interactions/">Check a different combination</a></p>
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
if (!detail.includes('/* SS_IX_SLUGS_BEGIN */')) throw new Error('slug marker missing');
detail = detail.replace(/\/\* SS_IX_SLUGS_BEGIN \*\/[\s\S]*?\/\* SS_IX_SLUGS_END \*\//, block);
fs.writeFileSync(detailPath, detail);

const needle = '<a href="/transparency.html">Funding, brand listings, and corrections</a>';
let linked = 0;
for (const slug of slugs) {
  const file = path.join(root, 'supplement', slug + '.html');
  let html = fs.readFileSync(file, 'utf8');
  const href = `<a href="/interactions/#s=${slug}">Cited medication interactions</a>`;
  if (html.includes(href)) { linked++; continue; }
  if (!html.includes(needle)) {
    console.warn('no sources block', slug);
    continue;
  }
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

const robotsPath = path.join(root, 'robots.txt');
let robots = fs.readFileSync(robotsPath, 'utf8');
if (!robots.includes('sitemap-interactions.xml')) {
  robots = robots.trimEnd() + '\nSitemap: https://supplementscore.org/sitemap-interactions.xml\n';
  fs.writeFileSync(robotsPath, robots);
}

const medHub = path.join(root, 'm/index.html');
let hub = fs.readFileSync(medHub, 'utf8');
const hubLine = '<p class="hub-lede" style="margin-top:-12px">For a shorter checker limited to pairs we can cite, use the <a href="/interactions/">supplement and medication interaction checker</a>. The medicine pages below are a separate, older set.</p>';
if (!hub.includes('/interactions/')) {
  hub = hub.replace('</p>\n\n  <div class="hub-grid">', '</p>\n' + hubLine + '\n  <div class="hub-grid">');
  fs.writeFileSync(medHub, hub);
}

console.log(`pages ${data.pages.length + 1} interactions ${data.interactions.length} supplement links ${linked}`);
