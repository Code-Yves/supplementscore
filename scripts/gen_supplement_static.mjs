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
const clip = (s, n) => { s = String(s||'').replace(/\s+/g,' ').trim(); return s.length > n ? s.slice(0, n-3).replace(/\s+\S*$/,'') + '…' : s; };
const TIER = { t1:'Tier 1 — strong evidence', t2:'Tier 2 — promising', t3:'Tier 3 — weak evidence', t4:'Tier 4 — risky / avoid' };

// 1. Inline the static-slug list into supplement.html so ?slug= URLs canonicalise to the static page.
const shellPath = path.join(REPO, 'supplement.html');
let shell = fs.readFileSync(shellPath, 'utf8');
const listJs = `<script id="ss-static-slugs">window.__SS_STATIC=${JSON.stringify(Object.fromEntries(slugs.map(s=>[s,1])))};window.__SS_CANON=function(s){return 'https://supplementscore.org'+(window.__SS_STATIC[s]?'/supplement/'+s+'.html':'/supplement.html?slug='+s);};</script>`;
if (/<script id="ss-static-slugs">[\s\S]*?<\/script>/.test(shell)) shell = shell.replace(/<script id="ss-static-slugs">[\s\S]*?<\/script>/, listJs);
else shell = shell.replace('<head>\n', '<head>\n' + listJs + '\n');
fs.writeFileSync(shellPath, shell);

// 2. Write one static page per slug.
let n = 0;
for (const slug of slugs) {
  const s = resolveSupplement(slug);
  if (!s) { console.warn('unresolved', slug); continue; }
  const url = `${ORIGIN}/supplement/${slug}.html`;
  const title = `${s.n} — SupplementScore`;
  const desc = clip(s.desc, 155) || `${s.n}: evidence tier, dose, interactions and citations on SupplementScore.`;
  let h = shell;
  h = h.replace('<head>\n', `<head>\n<base href="/">\n<script>window.__SS_SLUG=${JSON.stringify(slug)};</script>\n`);
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>\n<link rel="canonical" href="${url}">`);
  h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${esc(desc)}`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`);
  const body = `<main class="det-wrap" id="det-root"><h1 class="det-h1">${esc(s.n)}</h1>`
    + (TIER[s.t] ? `<p><b>${esc(TIER[s.t])}</b>${s.tag ? ' · ' + esc(s.tag) : ''}</p>` : '')
    + `<p>${esc(clip(s.desc, 600))}</p>`
    + (s.dose ? `<p><b>Dose:</b> ${esc(clip(s.dose, 300))}</p>` : '')
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
