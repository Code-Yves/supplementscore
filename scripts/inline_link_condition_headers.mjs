#!/usr/bin/env node
/* Link supplement-name <h3> card headers on condition pages (e.g. "Glycine",
 * "Inositol (myo + D-chiro)") to their supplement page. Many condition pages
 * present supplements as <h3> cards but only SOME were linked — the unlinked
 * ones weren't in the page's bottom "Supplement details" list, so the earlier
 * inline_link_condition_supps.mjs skipped them.
 *
 * Safe by construction:
 *   - Operates ONLY between <main> and </main> (never the <head> / JSON-LD).
 *   - Only links an <h3> whose leading name slugifies to a REAL supplement
 *     (validated via scripts/slug.mjs resolveSupplement) — unknown headers
 *     ("What to skip", "Supplement details", section titles) never resolve, so
 *     they're left alone.
 *   - Skips any <h3> that already contains an <a>. Idempotent.
 *   - Wraps only the leading name; trailing qualifier (e.g. "(low dose)") stays
 *     outside the link, matching the existing linked headers.
 * Usage: node scripts/inline_link_condition_headers.mjs [--apply] [file...]
 */
import fs from 'node:fs'; import path from 'node:path';
import SS from './slug.mjs';
const apply = process.argv.includes('--apply');
const argFiles = process.argv.slice(2).filter(a => !a.startsWith('--'));
const files = argFiles.length ? argFiles
  : fs.readdirSync('condition').filter(f => f.endsWith('.html') && f !== 'index.html').map(f => path.join('condition', f));

const STOP = new Set(['supplement details', 'supplements in this article', 'what to skip', 'what to track', 'what to add', 'what to monitor']);
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();

let totalLinks = 0, pagesChanged = 0; const summary = [];
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  if (/http-equiv="refresh"/i.test(html) && /noindex/i.test(html)) continue; // tombstone
  const mainStart = html.search(/<main\b/i);
  if (mainStart < 0) continue;
  const head = html.slice(0, mainStart);
  let body = html.slice(mainStart);
  let pageLinks = 0; const linked = [];

  body = body.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (m, attrs, inner) => {
    if (/<a\b/i.test(inner)) return m;                 // already linked
    const txt = strip(inner);
    if (!txt || txt.length < 2 || txt.length > 60) return m;
    if (STOP.has(txt.toLowerCase())) return m;
    if (!/^[A-Z0-9]/.test(txt)) return m;
    // candidate names: leading part before a qualifier, then the full text
    const lead = txt.split(/\s*[(–—:]|\s-\s/)[0].trim();
    const cands = [...new Set([lead, txt])].filter(c => c.length >= 3);
    let chosen = null;
    for (const c of cands) {
      const slug = SS.slugify(c);
      if (slug && SS.resolveSupplement(slug)) { chosen = { text: c, slug }; break; }
    }
    if (!chosen) return m;
    // wrap the first plain-text occurrence of chosen.text inside the h3
    const idx = inner.indexOf(chosen.text);
    if (idx < 0) return m;
    const a = '<a href="../supplement.html?slug=' + chosen.slug + '">' + chosen.text + '</a>';
    const newInner = inner.slice(0, idx) + a + inner.slice(idx + chosen.text.length);
    pageLinks++; linked.push(chosen.text);
    return '<h3' + attrs + '>' + newInner + '</h3>';
  });

  if (pageLinks) {
    const out = head + body;
    // safety: every JSON-LD block must still parse (we only touched <main>, but verify)
    let bad = 0;
    for (const j of out.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(j[1].trim()); } catch { bad++; }
    }
    if (bad) { console.log('SKIP (would break ' + bad + ' JSON-LD) ' + path.basename(file)); continue; }
    summary.push(path.basename(file) + ': +' + pageLinks + ' (' + linked.join(', ') + ')');
    totalLinks += pageLinks; pagesChanged++;
    if (apply) fs.writeFileSync(file, out);
  }
}
console.log((apply ? 'APPLIED' : 'DRY-RUN') + ': ' + totalLinks + ' header links across ' + pagesChanged + ' condition pages');
summary.slice(0, 12).forEach(s => console.log('  ' + s));
