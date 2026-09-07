#!/usr/bin/env node
/**
 * Generate /s/<slug>.html redirect tombstones for every slug accepted by
 * runtime SS.getSupplement (full-name + parenthetical-stripped aliases).
 *
 * Legacy Google hits on /s/<slug>.html get a durable noindex meta-refresh +
 * location.replace to the canonical /supplement.html?slug=… page.
 *
 * Usage: node scripts/gen_s_tombstones.mjs
 */
import { resolveSupplement, slugify } from './slug.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S_DIR = path.join(REPO, 's');

const sitemap = new Set(
  [...fs.readFileSync(path.join(REPO, 'sitemap-supplements.xml'), 'utf8')
    .matchAll(/slug=([a-z0-9-]+)/g)].map((m) => m[1]),
);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function preferredSlug(alias) {
  const s = resolveSupplement(alias);
  if (!s) return null;
  const full = slugify(s.n);
  const short = slugify(String(s.n).replace(/\s*\([^)]*\)\s*/g, ' ').trim());
  for (const cand of [full, short, alias]) {
    if (cand && sitemap.has(cand)) return cand;
  }
  return full || short || alias;
}

function stubHtml(alias, targetSlug, title) {
  const dest = `/supplement.html?slug=${targetSlug}`;
  const abs = `https://supplementscore.org${dest}`;
  const t = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t} — SupplementScore</title>
  <link rel="canonical" href="${abs}">
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0;url=${dest}">
  <script>location.replace('${dest}');</script>
</head>
<body>
  <p>Redirecting to <a href="${dest}">${t}</a>…</p>
</body>
</html>
`;
}

const stubs = new Set(
  fs.readdirSync(S_DIR).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')),
);
const metaKeys = Object.keys(
  JSON.parse(fs.readFileSync(path.join(REPO, 'supplement-meta.json'), 'utf8')),
);
const candidates = new Set([...metaKeys, ...stubs]);

let created = 0;
let updated = 0;
let skipped = 0;
const failed = [];

for (const alias of [...candidates].sort()) {
  const rec = resolveSupplement(alias);
  if (!rec) {
    failed.push(alias);
    continue;
  }
  const target = preferredSlug(alias);
  if (!target) {
    failed.push(alias);
    continue;
  }
  const html = stubHtml(alias, target, rec.n || alias);
  const out = path.join(S_DIR, `${alias}.html`);
  if (fs.existsSync(out)) {
    const prev = fs.readFileSync(out, 'utf8');
    const needsFix = !prev.includes(`slug=${target}`) || prev.includes('url=/s/');
    if (needsFix) {
      fs.writeFileSync(out, html);
      updated++;
    } else {
      skipped++;
    }
  } else {
    fs.writeFileSync(out, html);
    created++;
  }
}

console.log(
  JSON.stringify(
    {
      created,
      updated,
      skipped,
      failed: failed.length,
      totalStubs: fs.readdirSync(S_DIR).filter((f) => f.endsWith('.html')).length,
    },
    null,
    2,
  ),
);
if (failed.length) process.exitCode = 1;
