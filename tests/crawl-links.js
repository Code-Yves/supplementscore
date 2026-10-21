/**
 * Filesystem crawl of internal links and HTML-entity leaks.
 * A single encoded &#39; in markup is valid HTML. Double encoding
 * (&amp;#39;, &amp;amp;) and text that still contains an entity after
 * one decode are leaks. _archive/ is retired markup and is not a crawl
 * source; a live page that links into it is still checked.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'http://supplementscore.org';
const SKIP_DIRS = new Set([
  'node_modules', 'test-results', 'playwright-report', 'blob-report', '.git',
  '_archive', 'reviews', '_mockups',
]);
/* Fragments are inserted into the homepage, so their relative links
   resolve from / when a browser renders them. */
const FRAGMENT_BASE = {
  'data/article-cards-deferred.html': ORIGIN + '/',
  'data/article-stubs.html': ORIGIN + '/',
};
const DOUBLE_RE = /&amp;#(?:x[0-9a-fA-F]+|\d+);|&amp;amp;|&amp;apos;|&amp;quot;/i;
const LEFT_RE = /&#\d+;|&#x[0-9a-fA-F]+;|&amp;#|&amp;amp;/i;

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = path.join(dir, name);
    let st;
    try { st = fs.statSync(abs); } catch (e) { continue; }
    if (st.isDirectory()) walk(abs, out);
    else if (name.endsWith('.html') && !/mockup/i.test(name)) out.push(abs);
  }
  return out;
}

function decodeOnce(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = parseInt(n, 10);
      return code > 0 ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = parseInt(n, 16);
      return code > 0 ? String.fromCodePoint(code) : _;
    });
}

function markupOf(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

function extractRefs(markup) {
  const refs = [];
  const attr = /\b(?:href|src|action)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;
  while ((match = attr.exec(markup))) refs.push(match[1] != null ? match[1] : match[2]);
  const srcset = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  while ((match = srcset.exec(markup))) {
    const raw = match[1] != null ? match[1] : match[2];
    for (const part of raw.split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url) refs.push(url);
    }
  }
  return refs;
}

function localPath(raw, fromAbs) {
  const trimmed = String(raw || '').trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (/^(mailto|tel|javascript|data):/i.test(trimmed)) return null;
  if (/['+`${}<>`,]/.test(trimmed)) return null;
  const rel = path.relative(ROOT, fromAbs).split(path.sep).join('/');
  const base = FRAGMENT_BASE[rel] || new URL(rel, ORIGIN + '/').href;
  let url;
  try { url = new URL(trimmed, base); } catch (e) { return null; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'supplementscore.org') return null;
  return url.pathname;
}

function fileForPath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch (e) { return null; }
  if (decoded.includes('\0')) return null;
  const rel = decoded.replace(/^\/+/, '');
  const abs = path.resolve(ROOT, rel);
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return null;
  if (fs.existsSync(abs)) {
    const st = fs.statSync(abs);
    if (st.isFile()) return abs;
    if (st.isDirectory()) {
      const index = path.join(abs, 'index.html');
      return fs.existsSync(index) ? index : null;
    }
  }
  if (!path.extname(abs) && fs.existsSync(abs + '.html')) return abs + '.html';
  return null;
}

function crawl(root) {
  const siteRoot = root || ROOT;
  if (siteRoot !== ROOT) throw new Error('crawl root is fixed to the repo');
  const files = walk(ROOT, []);
  const broken = [];
  const leaks = [];
  const seen = new Map();

  for (const file of files) {
    let html;
    try { html = fs.readFileSync(file, 'utf8'); } catch (e) { continue; }
    const relFile = path.relative(ROOT, file);

    const double = html.match(DOUBLE_RE);
    if (double) leaks.push(relFile + ' double-encoded ' + double[0]);

    const visible = markupOf(html).replace(/<[^>]+>/g, ' ');
    const decoded = decodeOnce(visible);
    const left = decoded.match(LEFT_RE);
    if (left) leaks.push(relFile + ' rendered entity ' + left[0]);

    for (const ref of extractRefs(markupOf(html))) {
      const pathname = localPath(ref, file);
      if (!pathname) continue;
      if (seen.has(pathname)) continue;
      seen.set(pathname, relFile);
      if (!fileForPath(pathname)) broken.push(relFile + ' -> ' + ref + ' (' + pathname + ')');
    }
  }

  return { files: files.length, urls: seen.size, broken, leaks };
}

function main() {
  const result = crawl();
  console.log('html files ' + result.files + ', internal urls ' + result.urls + ', broken ' + result.broken.length + ', entity leaks ' + result.leaks.length);
  result.broken.slice(0, 40).forEach((line) => console.log('404 ' + line));
  result.leaks.slice(0, 40).forEach((line) => console.log('ENT ' + line));
  if (result.broken.length || result.leaks.length) process.exit(1);
}

if (require.main === module) main();

module.exports = { crawl };
