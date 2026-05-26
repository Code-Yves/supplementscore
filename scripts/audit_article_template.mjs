#!/usr/bin/env node
/**
 * audit_article_template.mjs — verify every /a/<slug>.html article matches
 * the unified template shape.
 *
 * Required markers (must all be present in each article):
 *   1. <meta name="viewport" content="...viewport-fit=cover">
 *   2. JSON-LD Article schema with "reviewedBy" field (full E-E-A-T)
 *   3. BreadcrumbList JSON-LD (between SEO-BC-SCHEMA:start/end markers)
 *   4. <script src="..._site-ux.js?...">
 *   5. <script src="..._research-chrome.js?...">
 *   6. RC_PREVNEXT placeholder markers
 *   7. <body><main class="ar-wrap"> exact pattern
 *   8. SS_FOOTER_BEGIN / SS_FOOTER_END site-footer block
 *
 * Forbidden markers (must NOT be present — these are legacy/duplicate chrome
 * that breaks the unified shell):
 *   - <a ... class="pg-close-fab">  (chrome injects its own close X)
 *   - <div class="ar-cat">          (chrome shows the category chip)
 *
 * Tombstone files (15-line redirect stubs with noindex + meta refresh) are
 * exempt — they intentionally have minimal chrome.
 *
 * Exit codes: 0 = all articles compliant. 1 = drift detected.
 *
 * Usage:
 *   node scripts/audit_article_template.mjs          # report
 *   node scripts/audit_article_template.mjs --fail-on-drift   # exit 1 if any drift
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const A_DIR = path.resolve(__dirname, '..', 'a');

const REQUIRED = [
  { name: 'viewport-fit=cover',        re: /viewport-fit=cover/ },
  { name: 'JSON-LD reviewedBy',        re: /"reviewedBy":\s*\{/ },
  { name: 'BreadcrumbList schema',     re: /SEO-BC-SCHEMA:start[\s\S]*?BreadcrumbList[\s\S]*?SEO-BC-SCHEMA:end/ },
  { name: '_site-ux.js script',        re: /<script\s+[^>]*src="[^"]*_site-ux\.js[^"]*"[^>]*>/ },
  { name: '_research-chrome.js script',re: /<script\s+[^>]*src="[^"]*_research-chrome\.js[^"]*"[^>]*>/ },
  { name: 'RC_PREVNEXT placeholder',   re: /<!--\s*RC_PREVNEXT:start[\s\S]*?RC_PREVNEXT:end\s*-->/ },
  { name: 'body><main ar-wrap',        re: /<body>\s*<main class="ar-wrap">/ },
  { name: 'SS_FOOTER block',           re: /<!--\s*SS_FOOTER_BEGIN[\s\S]*?SS_FOOTER_END\s*-->/ },
];

const FORBIDDEN = [
  { name: 'pg-close-fab (legacy chrome)', re: /class="pg-close-fab"/ },
  { name: 'ar-cat div (legacy chrome)',   re: /<div\s+class="ar-cat"/ },
];

function isTombstone(html) {
  // 15-line redirect stubs: meta refresh + noindex, no real article body
  return /http-equiv="refresh"/i.test(html)
      && /noindex/i.test(html)
      && !/<main\s+class="ar-wrap"/i.test(html);
}

const files = fs.readdirSync(A_DIR).filter(f => f.endsWith('.html'));
const drift = [];
const tombstones = [];
const passed = [];

for (const f of files) {
  const full = path.join(A_DIR, f);
  const html = fs.readFileSync(full, 'utf8');

  if (isTombstone(html)) {
    tombstones.push(f);
    continue;
  }

  const missing = REQUIRED.filter(r => !r.re.test(html)).map(r => r.name);
  const present = FORBIDDEN.filter(r => r.re.test(html)).map(r => r.name);

  if (missing.length === 0 && present.length === 0) {
    passed.push(f);
  } else {
    drift.push({ file: f, missing, forbidden: present });
  }
}

console.log(`Audited ${files.length} files in /a/`);
console.log(`  Passed (unified):      ${passed.length}`);
console.log(`  Tombstones (skipped):  ${tombstones.length}`);
console.log(`  Drift detected:        ${drift.length}`);

if (drift.length > 0) {
  console.log('\nFiles with drift:');
  for (const d of drift.slice(0, 50)) {
    console.log(`  - ${d.file}`);
    if (d.missing.length)   console.log(`      missing:   ${d.missing.join(', ')}`);
    if (d.forbidden.length) console.log(`      forbidden: ${d.forbidden.join(', ')}`);
  }
  if (drift.length > 50) console.log(`  ... and ${drift.length - 50} more`);
}

if (process.argv.includes('--fail-on-drift') && drift.length > 0) {
  process.exit(1);
}
process.exit(0);
