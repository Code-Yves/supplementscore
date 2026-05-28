#!/usr/bin/env node
/**
 * register-articles.mjs — single source of truth for registering articles
 * across data.js (ARTICLES_BY_ID + ARTICLE_MAP), index.html (article-full
 * blocks), and sitemap-articles.xml.
 *
 * Replaces the two-script pipeline (nightly-article-generation writes HTML;
 * daily-article-registration sweeps it later). The generator now calls this
 * directly after writing each article. The watchdog calls --scan to confirm
 * no orphans exist.
 *
 * Usage:
 *   node scripts/register-articles.mjs <slug1> [slug2 ...]
 *     Register the named slugs. Files must already exist in a/. Atomic:
 *     backups taken, all 3 artifacts updated, validated, and on any failure
 *     ALL changes are rolled back (including the .html file if --delete-on-fail
 *     is passed).
 *
 *   node scripts/register-articles.mjs --scan
 *     Scan a/ for unregistered HTML files. Exits 0 if none, 1 if orphans
 *     found. Prints JSON report to stdout. Does not modify anything.
 *
 *   node scripts/register-articles.mjs --orphans [--limit N]
 *     Register up to N (default 30) orphans, newest mtime first. Same atomic
 *     guarantees. Used by the watchdog when it detects orphans created by a
 *     generator run that failed mid-loop.
 *
 * Exit codes:
 *   0 — success (all requested slugs registered, or no orphans found in --scan)
 *   1 — orphans found (scan mode) OR registration failure (rolled back)
 *   2 — invalid arguments / setup error
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SCRIPT_DIR, '..');
const A_DIR = path.join(REPO, 'a');
const DATA_JS = path.join(REPO, 'data.js');
const INDEX_HTML = path.join(REPO, 'index.html');
const SITEMAP = path.join(REPO, 'sitemap-articles.xml');
const SW_JS = path.join(REPO, 'sw.js');
const LOG = path.join(REPO, 'reviews/article-registration-log.md');

const TODAY = new Date().toISOString().slice(0, 10);
const STAMP = TODAY.replace(/-/g, '');

// ---------------- shared helpers ----------------

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeAndNorm(t) {
  return t
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'").replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
    .replace(/&ndash;/g, '-').replace(/&mdash;/g, '—').replace(/&hellip;/g, '…')
    .replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-').replace(/&#8212;/g, '—')
    .replace(/[^a-zA-Z0-9]+/g, ' ').toLowerCase().trim();
}

function dropSingleTokens(n) {
  return n.split(' ').filter(t => t.length > 1).join(' ');
}

function jsStr(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function escHtml(s) {
  return s.replace(/&(?![a-zA-Z]+;|#x?[0-9a-f]+;)/gi, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeCategory(raw) {
  const lc = raw.toLowerCase().trim();
  return {
    'research-update': 'research-update', 'research update': 'research-update',
    'quick reads': 'guide', 'reality check': 'myth', 'safety alert': 'safety',
    'breakthrough': 'breakthrough', 'guide': 'guide', 'myth': 'myth',
    'safety': 'safety', 'kids': 'kids', 'overhyped': 'myth',
    'myth-busting': 'myth', 'stacks': 'guide', 'featured guide': 'guide',
  }[lc] || lc;
}

function categoryDisplayName(c) {
  return {
    'breakthrough': 'Breakthrough', 'guide': 'Guide', 'myth': 'Myth',
    'safety': 'Safety', 'kids': 'Kids', 'research-update': 'Research Update',
  }[c] || (c.charAt(0).toUpperCase() + c.slice(1));
}

// ---------------- state loaders ----------------

function loadData() {
  const src = fs.readFileSync(DATA_JS, 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src.replace(/^\s*const\s+/gm, 'var '), ctx);
  return { src, ABI: ctx.ARTICLES_BY_ID, AM: ctx.ARTICLE_MAP, S: ctx.S || [] };
}

function buildDedupSets(ABI) {
  const slugSet = new Set();
  const titleNormSet = new Map(); // norm -> id
  const titleNormDropSet = new Map();
  for (const id of Object.keys(ABI)) {
    const t = ABI[id].t;
    slugSet.add(slugify(t));
    const n = decodeAndNorm(t);
    titleNormSet.set(n, id);
    titleNormDropSet.set(dropSingleTokens(n), id);
  }
  return { slugSet, titleNormSet, titleNormDropSet };
}

function findOrphans(slugSet) {
  const files = fs.readdirSync(A_DIR).filter(f => f.endsWith('.html') && !f.includes('.bak-'));
  const orphans = [];
  for (const f of files) {
    const slug = f.replace(/\.html$/, '');
    if (slugSet.has(slug)) continue;
    // Skip noindex consolidation-redirect stubs (intentional canonical redirects,
    // not registration candidates). Two-signal check on the head bytes only.
    // Fix added 2026-05-28 — previously these stubs were flagged daily as orphans
    // (see reviews/article-registration-2026-05-27.md, "Persistent noindex-stub
    // false positives"). Tombstones are also exempted in parseArticle().
    try {
      const fd = fs.openSync(path.join(A_DIR, f), 'r');
      const buf = Buffer.alloc(4096);
      const n = fs.readSync(fd, buf, 0, 4096, 0);
      fs.closeSync(fd);
      const head = buf.slice(0, n).toString('utf8');
      if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(head)
          && /<meta[^>]+http-equiv=["']refresh["']/i.test(head)) {
        continue;
      }
    } catch { /* fall through and treat as orphan */ }
    orphans.push({ slug, file: f, mtime: fs.statSync(path.join(A_DIR, f)).mtime.getTime() });
  }
  orphans.sort((a, b) => b.mtime - a.mtime);
  return orphans;
}

// ---------------- article parsing ----------------

function parseArticle(slug, S) {
  const file = path.join(A_DIR, `${slug}.html`);
  if (!fs.existsSync(file)) return { error: `file not found: ${slug}.html` };
  const html = fs.readFileSync(file, 'utf8');

  const h1m = html.match(/<h1>([\s\S]*?)<\/h1>/);
  if (!h1m) return { error: 'missing <h1>' };
  const title = h1m[1].trim();

  // Category source — preferred: JSON-LD articleSection (unified template).
  // Fallback: legacy <div class="ar-cat"> for older articles still being
  // updated. After cleanup_legacy_chrome.py runs site-wide we can drop the
  // fallback entirely.
  let rawCat = null;
  const sectionM = html.match(/"articleSection":\s*"([^"]+)"/);
  if (sectionM) {
    rawCat = sectionM[1].trim();
  } else {
    const catm = html.match(/<div class="ar-cat">([\s\S]*?)<\/div>/);
    if (catm) rawCat = catm[1].trim();
  }
  if (!rawCat) return { error: 'missing articleSection (JSON-LD) and <div class="ar-cat">' };
  const cat = normalizeCategory(rawCat);

  // Unified-template drift check — fail fast on legacy chrome / missing chrome.
  // Tombstones (15-line meta-refresh stubs) are exempt since they correctly
  // ship with minimal chrome and noindex.
  const isTombstone = /http-equiv="refresh"/i.test(html)
      && /noindex/i.test(html)
      && !/<main\s+class="ar-wrap"/i.test(html);
  if (!isTombstone) {
    const driftErrors = [];
    if (!/viewport-fit=cover/.test(html))                       driftErrors.push('missing viewport-fit=cover');
    if (!/"reviewedBy":\s*\{/.test(html))                       driftErrors.push('missing reviewedBy E-E-A-T schema');
    if (!/SEO-BC-SCHEMA:start[\s\S]*?BreadcrumbList/.test(html))driftErrors.push('missing BreadcrumbList JSON-LD');
    if (!/_research-chrome\.js/.test(html))                     driftErrors.push('missing _research-chrome.js');
    if (!/_site-ux\.js/.test(html))                             driftErrors.push('missing _site-ux.js');
    if (!/<!--\s*RC_PREVNEXT:start[\s\S]*?RC_PREVNEXT:end/.test(html)) driftErrors.push('missing RC_PREVNEXT placeholder');
    if (!/<!--\s*SS_FOOTER_BEGIN[\s\S]*?SS_FOOTER_END/.test(html))     driftErrors.push('missing SS_FOOTER block');
    if (/class="pg-close-fab"/.test(html))                      driftErrors.push('legacy pg-close-fab present (chrome injects its own close)');
    if (/<div\s+class="ar-cat"/.test(html))                     driftErrors.push('legacy <div class="ar-cat"> present (chrome shows the category chip)');
    if (driftErrors.length) {
      return { error: 'unified-template drift: ' + driftErrors.join('; ') };
    }
  }

  let lr = (html.match(/<!--\s*last-reviewed:\s*([0-9-]+)\s*-->/) || [])[1];
  let lrSrc = 'comment';
  if (!lr) {
    const md = html.match(/<div class="ar-meta">[^<]*?(\d{4}-\d{2}-\d{2}|[A-Z][a-z]+\s+\d+,\s+\d{4})/);
    if (md) {
      const v = md[1];
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) lr = v;
      else { const d = new Date(v); if (!isNaN(d)) lr = d.toISOString().slice(0, 10); }
      lrSrc = 'meta-date-fallback';
    }
  }
  if (!lr) { lr = TODAY; lrSrc = 'today-fallback'; }

  // Robust content extraction: from after </h1> or after ar-meta to </main>
  let startSearchFrom = html.indexOf('</div>', html.indexOf('<div class="ar-meta"'));
  if (startSearchFrom < 0) startSearchFrom = html.indexOf('</h1>');
  if (startSearchFrom < 0) startSearchFrom = 0;
  const mainEnd = html.indexOf('</main>');
  let contentHtml = (mainEnd > 0) ? html.slice(startSearchFrom, mainEnd) : '';
  contentHtml = contentHtml
    .replace(/<ol[\s\S]*?<\/ol>/gi, ' ')
    .replace(/<h3[^>]*>\s*Sources\s*<\/h3>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<div[^>]*class="ar-foot"[\s\S]*?<\/div>/gi, ' ')
    .replace(/<!--\s*SS-AUTOLINKS:start[\s\S]*?SS-AUTOLINKS:end\s*-->/gi, ' ')
    .replace(/<!--\s*HUB-FEATURED[\s\S]*?HUB-FEATURED:end[\s\S]*?-->/gi, ' ')
    .replace(/<div[^>]*class="hub-featured-link"[\s\S]*?<\/div>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const contentText = contentHtml.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
    .replace(/&#x?[0-9a-f]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const wc = contentText ? contentText.split(/\s+/).length : 0;
  const minutes = Math.max(3, Math.round(wc / 200));

  const paraMatches = [...contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
  let firstPara = '';
  for (const pm of paraMatches) {
    const txt = pm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (txt.length > 30) { firstPara = txt; break; }
  }
  const excerpt = firstPara.slice(0, 240) + (firstPara.length > 240 ? '…' : '');

  // Supplement matching
  function normMatch(s) {
    return s.toLowerCase().replace(/&[a-z]+;/g, ' ').replace(/&#x?[0-9a-f]+;/gi, ' ')
      .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function stripParen(s) { return s.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim(); }
  const suppEntries = S.map(s => ({ n: s.n, key: normMatch(stripParen(s.n)) }))
    .filter(x => x.key.length >= 4)
    .sort((a, b) => b.key.length - a.key.length);
  const hayNorm = ' ' + normMatch(title + ' ' + contentText.slice(0, 4000)) + ' ';
  const supplements = [];
  for (const e of suppEntries) {
    if (hayNorm.includes(' ' + e.key + ' ')) supplements.push(e.n);
  }

  return {
    slug, title, rawCat, cat, lr, lrSrc, wc, minutes, excerpt, supplements
  };
}

// ---------------- registration (atomic) ----------------

function backup(file) {
  const bak = `${file}.bak-${STAMP}`;
  // Don't overwrite an existing same-day backup (preserves the original pre-edit state)
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
  return bak;
}

function rollback(backups) {
  for (const [orig, bak] of Object.entries(backups)) {
    if (fs.existsSync(bak)) fs.copyFileSync(bak, orig);
  }
}

function buildDataJsUpdate(src, regs, AM) {
  const lines = src.split('\n');

  // Locate ARTICLES_BY_ID end
  let abiLineIdx = -1, abiEndIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('const ARTICLES_BY_ID=')) abiLineIdx = i;
    if (abiLineIdx >= 0 && i >= abiLineIdx && lines[i].endsWith('};')) { abiEndIdx = i; break; }
  }
  if (abiEndIdx < 0) throw new Error('Could not find ARTICLES_BY_ID end');

  const abiEntries = regs.map(r => {
    const audience = r.cat === 'kids' ? 'parents' : 'general';
    const rs = r.supplements.length > 0
      ? `,related_supplements:[${r.supplements.map(jsStr).join(',')}]`
      : '';
    return `${r.id}:{c:${jsStr(r.cat)},t:${jsStr(r.title)},m:${r.minutes}${rs},primary_audience:${jsStr(audience)}}`;
  }).join(',');

  const lastABI = lines[abiEndIdx];
  const m = lastABI.match(/^(.*?)(\}\s*;)$/);
  if (!m) throw new Error('Could not split ABI tail');
  lines[abiEndIdx] = m[1] + ',' + abiEntries + m[2];

  // Locate ARTICLE_MAP end
  let amLineIdx = -1, amEndIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('const ARTICLE_MAP=')) amLineIdx = i;
    if (amLineIdx >= 0 && i >= amLineIdx && lines[i].endsWith('};')) { amEndIdx = i; break; }
  }

  // Group new AM entries by supplement
  const perSupp = {};
  for (const r of regs) {
    for (const s of r.supplements) {
      const entry = `{id:${r.id},t:${jsStr(r.title)},c:${jsStr(r.cat)},m:${r.minutes}}`;
      if (!perSupp[s]) perSupp[s] = [];
      perSupp[s].push(entry);
    }
  }

  const amBlockText = lines.slice(amLineIdx, amEndIdx + 1).join('\n');
  let updatedAmText = amBlockText;
  const newKeys = [];

  for (const [suppName, entryList] of Object.entries(perSupp)) {
    const entriesStr = entryList.join(',');
    if (AM[suppName]) {
      // Match existing key with single or double quote
      const esc = suppName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\\\?'");
      let re = new RegExp(`('${esc}':\\[)([\\s\\S]*?)(\\])`);
      let found = updatedAmText.match(re);
      if (!found) {
        re = new RegExp(`("${esc}":\\[)([\\s\\S]*?)(\\])`);
        found = updatedAmText.match(re);
      }
      if (found) {
        const existing = found[2];
        const sep = existing.trim().length === 0 ? '' : ',';
        // Use function form to avoid $-interpolation in replacement string
        // (titles like "A $1.5 Billion Fraud" contain literal $ which String.replace
        // would otherwise treat as backreferences and corrupt adjacent data).
        const replacement = found[1] + existing + sep + entriesStr + found[3];
        updatedAmText = updatedAmText.replace(re, () => replacement);
      } else {
        newKeys.push([suppName, entryList]);
      }
    } else {
      newKeys.push([suppName, entryList]);
    }
  }

  if (newKeys.length > 0) {
    const newKeyStrs = newKeys.map(([k, list]) => `${jsStr(k)}:[${list.join(',')}]`).join(',');
    updatedAmText = updatedAmText.replace(/\}\s*;$/, ',' + newKeyStrs + '};');
  }

  const updatedAmLines = updatedAmText.split('\n');
  lines.splice(amLineIdx, amEndIdx - amLineIdx + 1, ...updatedAmLines);

  return { newSrc: lines.join('\n'), newAmKeys: newKeys.map(k => k[0]) };
}

// Per-category icon SVG used in article-card .article-side. Kept inline so the
// index.html stays self-contained.
const CARD_ICONS = {
  stack:        '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  condition:    '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>',
  quickread:    '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h12"/></svg>',
  guide:        '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
  breakthrough: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
  kids:         '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  myth:         '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
  safety:       '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 6v6c0 5 4 9 8 10 4-1 8-5 8-10V6l-8-4z"/></svg>',
  'research-update': '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
};

function buildIndexHtmlUpdate(src, regs) {
  // Cards MUST go inside #research-list-view so the dropdown counter sees them.
  // The dropdown reads `document.querySelectorAll('#research-list-view .article-card')`,
  // so any card inserted outside this scope shows up on the page but is silently
  // missed by the per-category counter (this caused "Stack (7)" vs actual 27 on
  // 2026-05-27). Anchor cards on `</div><!-- end research-list-view -->`.
  //
  // Article-full divs (the modal content blocks) live AFTER research-list-view
  // closes; they're inserted before `</div><!-- end articles-section -->`.
  const cardAnchor = '</div><!-- end research-list-view -->';
  const cardIdx = src.indexOf(cardAnchor);
  if (cardIdx < 0) throw new Error('Could not find research-list-view anchor in index.html');

  const fullAnchor = '</div><!-- end articles-section -->';
  const fullIdx = src.indexOf(fullAnchor);
  if (fullIdx < 0) throw new Error('Could not find articles-section anchor in index.html');

  const cardBlocks = regs.map(r => {
    const icon = CARD_ICONS[r.cat] || CARD_ICONS.guide;
    const catLabel = categoryDisplayName(r.cat);
    const cardDesc = escHtml(r.excerpt).slice(0, 160);
    const cardTitle = escHtml(r.title).slice(0, 200);
    return `      <a href="a/${r.slug}.html" class="article-card" data-category="${r.cat}" style="cursor:pointer;text-decoration:none;color:inherit;display:flex">
        <div class="article-side">
          ${icon}
          <div class="article-side-div"></div><div class="article-side-stat">${r.minutes}</div><div class="article-side-label">min read</div>
        </div>
        <div class="article-content">
          <div class="article-cat">${catLabel}</div>
          <div class="article-title">${cardTitle}</div>
          <div class="article-desc">${cardDesc}</div>
          <div class="article-meta">${r.lr || TODAY}</div>
        </div>
      </a>
`;
  }).join('');

  const fullBlocks = regs.map(r => {
    const catLabel = categoryDisplayName(r.cat);
    return `  <div class="article-full" id="article-${r.id}" style="display:none">
    <!-- last-reviewed: ${r.lr} -->
    <div style="padding:1.5rem;max-width:740px;margin:0 auto">
      <button onclick="showArticleList()" style="background:none;border:1px solid #e5e7eb;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.9rem;color:#6b7280;margin-bottom:1.5rem">&#8592; Back to articles</button>
      <div class="article-cat">${catLabel}</div>
      <h2 style="font-size:1.75rem;font-weight:700;margin:0.5rem 0 0.4rem;line-height:1.25">${escHtml(r.title)}</h2>
      <div class="article-meta" style="margin-bottom:1.5rem">${r.minutes} min read</div>
      <p>${escHtml(r.excerpt)}</p>
      <p style="margin-top:1.5rem"><a class="ar-readmore" href="a/${r.slug}.html" style="color:#1F7A6B;text-decoration:underline">Read the full article &rarr;</a></p>
    </div>
  </div><!-- end article-${r.id} -->
`;
  }).join('');

  // Insert cards BEFORE the RLV close (inside the container),
  // then insert article-full blocks BEFORE the articles-section close.
  let next = src.slice(0, cardIdx) + cardBlocks + '  ' + src.slice(cardIdx);
  // Re-locate the articles-section anchor now that we changed earlier offsets
  const fullIdxNew = next.indexOf(fullAnchor);
  next = next.slice(0, fullIdxNew) + fullBlocks + '  ' + next.slice(fullIdxNew);
  return next;
}

function buildSitemapUpdate(src, regs) {
  const toAdd = regs.filter(r => src.indexOf(`/a/${r.slug}.html`) < 0);
  if (toAdd.length === 0) return { newSrc: src, added: 0 };
  const newUrls = toAdd.map(r =>
    `  <url>\n    <loc>https://supplementscore.org/a/${r.slug}.html</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
  ).join('\n');
  return {
    newSrc: src.replace(/<\/urlset>\s*$/, newUrls + '\n</urlset>\n'),
    added: toAdd.length,
  };
}

function bumpCacheBusters(state) {
  // sw.js: const CACHE_VERSION = 'v...'
  const swSrc = fs.readFileSync(SW_JS, 'utf8');
  const newCacheVer = `v${TODAY}-reg${state.postABI}`;
  const newSw = swSrc.replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = '${newCacheVer}';`);
  if (newSw !== swSrc) fs.writeFileSync(SW_JS, newSw);
  // index.html: data.js?v=...
  const idxSrc = fs.readFileSync(INDEX_HTML, 'utf8');
  const newDataVer = `${STAMP}-art${state.postABI}`;
  const newIdx = idxSrc.replace(/data\.js\?v=[^"]+/, `data.js?v=${newDataVer}`);
  if (newIdx !== idxSrc) fs.writeFileSync(INDEX_HTML, newIdx);
  return { cacheVersion: newCacheVer, dataVersion: newDataVer };
}

function appendLog(regs, newAmKeys) {
  if (regs.length === 0) return;
  let log = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8') : '# Article Registration Rolling Log\n\n| Date | Slug | New ID | Category | Words | # Supplements |\n|---|---|---|---|---|---|\n';
  if (!log.endsWith('\n')) log += '\n';
  const lines = regs.map(r => {
    const newSupps = r.supplements.filter(s => newAmKeys.includes(s));
    const note = newSupps.length > 0 ? ` [new AM keys: ${newSupps.join('; ')}]` : '';
    return `| ${TODAY} | ${r.slug} | ${r.id} | ${r.cat} | ${r.wc} | ${r.supplements.length}${note} |`;
  }).join('\n');
  fs.writeFileSync(LOG, log + lines + '\n');
}

// ---------------- main register flow (atomic) ----------------

function registerSlugs(slugs, opts = {}) {
  const { dryRun = false, deleteOnFail = false } = opts;

  const { src: origDataSrc, ABI, AM, S } = loadData();
  const dedup = buildDedupSets(ABI);
  let nextId = Math.max(...Object.keys(ABI).map(Number)) + 1;

  const parsed = [];
  const skipped = [];

  for (const slug of slugs) {
    const p = parseArticle(slug, S);
    if (p.error) { skipped.push({ slug, reason: p.error }); continue; }
    // Dedup check
    if (dedup.slugSet.has(slug)) {
      skipped.push({ slug, reason: 'slug already registered' });
      continue;
    }
    const n = decodeAndNorm(p.title);
    const nd = dropSingleTokens(n);
    const dupId = dedup.titleNormSet.get(n) || dedup.titleNormDropSet.get(nd);
    if (dupId) {
      skipped.push({ slug, reason: `title-duplicate of ABI id ${dupId}`, dupOf: Number(dupId) });
      continue;
    }
    // Add to live dedup sets so subsequent slugs in same call don't collide
    dedup.slugSet.add(slug);
    dedup.titleNormSet.set(n, 'pending');
    dedup.titleNormDropSet.set(nd, 'pending');
    p.id = nextId++;
    parsed.push(p);
  }

  const result = {
    requested: slugs.length,
    registered: 0,
    skipped,
    registrations: [],
    newAmKeys: [],
    preABI: Object.keys(ABI).length,
    postABI: Object.keys(ABI).length,
    rolledBack: false,
  };

  if (parsed.length === 0) {
    // Nothing to do — still consider this success (skipped ≠ error)
    return result;
  }

  if (dryRun) {
    result.registered = parsed.length;
    result.registrations = parsed;
    result.postABI = Object.keys(ABI).length + parsed.length;
    return result;
  }

  // Backups
  const backups = { [DATA_JS]: backup(DATA_JS), [INDEX_HTML]: backup(INDEX_HTML), [SITEMAP]: backup(SITEMAP) };

  try {
    // data.js
    const dj = buildDataJsUpdate(origDataSrc, parsed, AM);
    fs.writeFileSync(DATA_JS, dj.newSrc);
    execSync(`node --check "${DATA_JS}"`, { stdio: 'pipe' });

    // Verify via eval
    const ctx2 = {}; vm.createContext(ctx2);
    vm.runInContext(dj.newSrc.replace(/^\s*const\s+/gm, 'var '), ctx2);
    for (const r of parsed) {
      if (!ctx2.ARTICLES_BY_ID[r.id]) throw new Error(`ABI insert failed for id ${r.id}`);
      for (const s of r.supplements) {
        if (!ctx2.ARTICLE_MAP[s]?.find(e => e.id === r.id)) {
          throw new Error(`AM insert failed for ${s} → ${r.id}`);
        }
      }
    }

    // index.html
    const idxSrc = fs.readFileSync(INDEX_HTML, 'utf8');
    const newIdx = buildIndexHtmlUpdate(idxSrc, parsed);
    fs.writeFileSync(INDEX_HTML, newIdx);
    execSync(`python3 -c "from html.parser import HTMLParser; HTMLParser().feed(open('${INDEX_HTML}').read())"`, { stdio: 'pipe' });

    // sitemap
    const smSrc = fs.readFileSync(SITEMAP, 'utf8');
    const sm = buildSitemapUpdate(smSrc, parsed);
    fs.writeFileSync(SITEMAP, sm.newSrc);
    execSync(`python3 -c "import xml.etree.ElementTree as ET; ET.parse('${SITEMAP}')"`, { stdio: 'pipe' });

    // Cache busters + log
    const stateForCache = { postABI: Object.keys(ctx2.ARTICLES_BY_ID).length };
    const cacheInfo = bumpCacheBusters(stateForCache);
    appendLog(parsed, dj.newAmKeys);

    result.registered = parsed.length;
    result.registrations = parsed;
    result.newAmKeys = dj.newAmKeys;
    result.postABI = stateForCache.postABI;
    result.cacheInfo = cacheInfo;
    return result;
  } catch (err) {
    rollback(backups);
    // If --delete-on-fail: also remove the .html files for any newly-attempted slugs
    // (so the generator doesn't leave orphans behind from a failed run).
    if (deleteOnFail) {
      for (const r of parsed) {
        const f = path.join(A_DIR, `${r.slug}.html`);
        if (fs.existsSync(f)) {
          try { fs.unlinkSync(f); } catch (e) { /* tolerate */ }
        }
      }
    }
    result.rolledBack = true;
    result.error = err.message;
    return result;
  }
}

// ---------------- CLI ----------------

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: register-articles.mjs <slug>... | --scan | --orphans [--limit N]');
    process.exit(2);
  }

  if (args[0] === '--scan') {
    const { ABI } = loadData();
    const { slugSet } = buildDedupSets(ABI);
    const orphans = findOrphans(slugSet);
    console.log(JSON.stringify({
      orphanCount: orphans.length,
      orphans: orphans.map(o => ({ slug: o.slug, mtime: new Date(o.mtime).toISOString() })),
      abiCount: Object.keys(ABI).length,
    }, null, 2));
    process.exit(orphans.length === 0 ? 0 : 1);
  }

  if (args[0] === '--orphans') {
    const limitIdx = args.indexOf('--limit');
    const limit = limitIdx > 0 ? Number(args[limitIdx + 1]) : 30;
    const { ABI } = loadData();
    const { slugSet } = buildDedupSets(ABI);
    const orphans = findOrphans(slugSet).slice(0, limit);
    const result = registerSlugs(orphans.map(o => o.slug));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.rolledBack ? 1 : 0);
  }

  // Treat all args as slugs to register
  const deleteOnFail = args.includes('--delete-on-fail');
  const dryRun = args.includes('--dry-run');
  const slugs = args.filter(a => !a.startsWith('--'));
  const result = registerSlugs(slugs, { dryRun, deleteOnFail });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.rolledBack ? 1 : 0);
}

main();
