/* Bibliography count, supplement total, and baked scores.
   node scripts/site_counts.mjs --write   refresh the generated files
   node scripts/site_counts.mjs --check   fail if a page disagrees with the data
*/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { allSupplements, resolveSupplement, slugify } from './slug.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIR = new Set(['.git', 'node_modules', 'test-results', 'playwright-report', '.worktrees', 'og']);
const SCAN_EXT = new Set(['.html', '.js', '.mjs', '.md', '.csv']);
const PMID_RE = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d{5,9})|PMID[:\s#]*(\d{5,9})|pmid=(\d{5,9})/gi;
const SCORE_FN = 'function calcScore(s){const rd=s.r||1,so=s.o||1,sco=s.c||1,sd=s.d||1;return Math.round(s.e*7+s.s*4+rd*3+so*2+sco*2+sd*2);}';

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') && ent.name !== '.') continue;
    if (SKIP_DIR.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (SCAN_EXT.has(path.extname(ent.name))) out.push(full);
  }
  return out;
}

function calcScore(s) {
  const rd = s.r || 1, so = s.o || 1, sco = s.c || 1, sd = s.d || 1;
  return Math.round(s.e * 7 + s.s * 4 + rd * 3 + so * 2 + sco * 2 + sd * 2);
}

function band(sc) {
  if (sc >= 72) return 'hi';
  if (sc >= 60) return 'mid';
  if (sc >= 40) return 'low';
  return 'bad';
}

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  ndash: '\u2013', mdash: '\u2014', hellip: '\u2026',
  rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201d', ldquo: '\u201c',
  aacute: '\u00e1', acirc: '\u00e2', aelig: '\u00e6', agrave: '\u00e0', aring: '\u00e5', atilde: '\u00e3', auml: '\u00e4',
  ccedil: '\u00e7', eacute: '\u00e9', ecirc: '\u00ea', egrave: '\u00e8', euml: '\u00eb',
  iacute: '\u00ed', icirc: '\u00ee', igrave: '\u00ec', iuml: '\u00ef',
  ntilde: '\u00f1', oacute: '\u00f3', ocirc: '\u00f4', ograve: '\u00f2', oslash: '\u00f8', otilde: '\u00f5', ouml: '\u00f6',
  uacute: '\u00fa', ucirc: '\u00fb', ugrave: '\u00f9', uuml: '\u00fc', yacute: '\u00fd', yuml: '\u00ff',
  szlig: '\u00df', thorn: '\u00fe', eth: '\u00f0',
  alpha: '\u03b1', beta: '\u03b2', gamma: '\u03b3', delta: '\u03b4', epsilon: '\u03b5', kappa: '\u03ba',
  lambda: '\u03bb', mu: '\u03bc', nu: '\u03bd', omega: '\u03c9', pi: '\u03c0', sigma: '\u03c3', tau: '\u03c4', theta: '\u03b8',
  prime: '\u2032', reg: '\u00ae', copy: '\u00a9', trade: '\u2122',
  times: '\u00d7', divide: '\u00f7', minus: '\u2212', micro: '\u00b5', deg: '\u00b0',
  bull: '\u2022', middot: '\u00b7',
};

function decodeEntities(s) {
  let prev = '';
  let cur = String(s);
  for (let i = 0; i < 4 && cur !== prev; i++) {
    prev = cur;
    cur = cur
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&([a-z]+);/gi, (full, name) => {
        const ch = NAMED_ENTITIES[name.toLowerCase()];
        return ch == null ? full : ch;
      });
  }
  return cur;
}

function esc(s) {
  return decodeEntities(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

function canonicalPages() {
  const pages = new Map();
  for (const s of allSupplements()) {
    if (!s || !s.n) continue;
    const slug = slugify(s.n);
    const hit = resolveSupplement(slug);
    if (!hit || hit.n !== s.n) continue;
    pages.set(slug, hit);
  }
  return pages;
}

function scoreBySlug() {
  const map = new Map();
  for (const [slug, rec] of canonicalPages()) map.set(slug, calcScore(rec));
  // Alias slugs still resolve to a real page. The number next to the link
  // has to match the page the link opens.
  const extra = [];
  const files = walk(REPO, []);
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    const re = /\/supplement\/([a-z0-9-]+)\.html/g;
    let m;
    while ((m = re.exec(html))) {
      if (map.has(m[1])) continue;
      const hit = resolveSupplement(m[1]);
      if (hit) map.set(m[1], calcScore(hit));
      else extra.push(m[1]);
    }
  }
  return { map, unresolved: [...new Set(extra)] };
}

function collectPmids(files) {
  const cites = new Map();
  const funders = new Map();
  const refs = new Map();
  for (const file of files) {
    const rel = path.relative(REPO, file);
    if (rel === 'bibliography.html' || rel.startsWith('data/pmids') || rel === 'data/site-counts.json') continue;
    const text = fs.readFileSync(file, 'utf8');
    PMID_RE.lastIndex = 0;
    let m;
    while ((m = PMID_RE.exec(text))) {
      const id = m[1] || m[2] || m[3];
      cites.set(id, (cites.get(id) || 0) + 1);
      const back = text.slice(Math.max(0, m.index - 400), m.index);
      const fund = back.match(/data-funder-type="([a-z_]+)"/g);
      if (fund && fund.length) {
        const type = fund[fund.length - 1].replace(/.*="([a-z_]+)".*/, '$1');
        if (!funders.has(id)) funders.set(id, new Map());
        const bag = funders.get(id);
        bag.set(type, (bag.get(type) || 0) + 1);
      }
      const lineStart = text.lastIndexOf('\n', m.index) + 1;
      const lineEnd = text.indexOf('\n', m.index);
      const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (line.length >= 40 && line.length <= 500 && /\b(19|20)\d{2}\b/.test(line) && !refs.has(id)) {
        refs.set(id, line);
      }
    }
  }
  return { cites, funders, refs };
}

function existingBibRefs() {
  const out = new Map();
  const jsonFile = path.join(REPO, 'data/bibliography.json');
  if (fs.existsSync(jsonFile)) {
    const rows = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    for (const row of rows) {
      const text = decodeEntities(row.reference || '').replace(/\s+/g, ' ').trim();
      if (text && !/Citation text is not stored/i.test(text)) out.set(String(row.pmid), text);
    }
    if (out.size) return out;
  }
  const file = path.join(REPO, 'bibliography.html');
  if (!fs.existsSync(file)) return out;
  const html = fs.readFileSync(file, 'utf8');
  const re = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\/"[^>]*>[^<]*<\/a><\/td><td\b[^>]*>[\s\S]*?<\/td><td class="num"[^>]*>\d+<\/td><td class="bib-text">([\s\S]*?)<\/td>/g;
  let m;
  while ((m = re.exec(html))) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (text && !/Citation text is not stored/i.test(text)) out.set(m[1], text);
  }
  return out;
}

function funderOf(bag) {
  if (!bag || !bag.size) return 'none_disclosed';
  const ranked = [...bag.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return 'mixed';
  const type = ranked[0][0];
  return ['public', 'nonprofit', 'industry', 'mixed', 'none_disclosed'].includes(type) ? type : 'none_disclosed';
}

const FUNDER_LABEL = {
  public: 'public',
  nonprofit: 'nonprofit',
  industry: 'industry',
  mixed: 'mixed',
  none_disclosed: 'none disclosed',
};
const FUNDER_COLOR = {
  public: ['#155A50', '#155A50'],
  nonprofit: ['#4B7BE5', '#4B7BE5'],
  industry: ['#CA8A04', '#CA8A04'],
  mixed: ['#7B1FA2', '#7B1FA2'],
  none_disclosed: ['#57534E', '#57534E'],
};

function letterOf(reference) {
  const text = decodeEntities(reference || '');
  const match = text.match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : '#';
}

const BIB_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

const BIB_CLIENT = `<!-- BIB_SCRIPT:start -->
<script>
(function(){
  var body = document.getElementById('bib-body');
  var search = document.getElementById('bib-search');
  var status = document.getElementById('bib-status');
  var letters = document.getElementById('bib-letters');
  var filter = 'all';
  var letter = (letters && letters.getAttribute('data-default')) || 'A';
  var rows = [];
  var SEARCH_CAP = 60;
  var COLORS = { public:'#155A50', nonprofit:'#4B7BE5', industry:'#CA8A04', mixed:'#7B1FA2', none_disclosed:'#57534E' };
  var LABELS = { public:'public', nonprofit:'nonprofit', industry:'industry', mixed:'mixed', none_disclosed:'none disclosed' };
  function esc(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function fmt(n){
    return Number(n).toLocaleString('en-US');
  }
  function paintLetters(){
    if (!letters) return;
    var searching = !!(search && search.value.trim());
    [].forEach.call(letters.querySelectorAll('[data-letter]'), function(x){
      var on = !searching && x.getAttribute('data-letter') === letter;
      x.classList.toggle('on', on);
      x.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function render(list, note, cap){
    var shown = cap ? list.slice(0, cap) : list;
    body.innerHTML = shown.map(function(row){
      var color = COLORS[row.funder] || COLORS.none_disclosed;
      var label = LABELS[row.funder] || row.funder;
      var ref = row.reference ? esc(row.reference) : 'Cited on SupplementScore. Citation text is not stored separately from the page that links this PMID.';
      return '<tr data-funder="'+row.funder+'"><td class="bib-pmid" data-label="PMID"><a href="https://pubmed.ncbi.nlm.nih.gov/'+row.pmid+'/" target="_blank" rel="noopener">'+row.pmid+'</a></td><td class="bib-funder" data-label="Funder"><span class="bib-fpill" style="background:'+color+'1a;color:'+color+';border:1px solid '+color+'55">'+esc(label)+'</span></td><td class="num" data-label="Cites">'+row.cites+'</td><td class="bib-text">'+ref+'</td></tr>';
    }).join('');
    if (status) status.textContent = note;
  }
  function apply(){
    paintLetters();
    var q = search.value.trim().toLowerCase();
    var pool = rows.filter(function(r){ return filter === 'all' || r.funder === filter; });
    if (q) {
      var hits = pool.filter(function(r){
        return String(r.pmid).indexOf(q) !== -1 || String(r.reference || '').toLowerCase().indexOf(q) !== -1;
      });
      render(hits, 'Showing ' + fmt(Math.min(hits.length, SEARCH_CAP)) + ' of ' + fmt(hits.length) + ' matches', SEARCH_CAP);
      return;
    }
    var inLetter = pool.filter(function(r){ return r.letter === letter; });
    render(inLetter, 'Showing ' + letter + ' · ' + fmt(inLetter.length) + ' of ' + fmt(rows.length));
  }
  fetch('/data/bibliography.json').then(function(r){ return r.json(); }).then(function(data){
    rows = data;
    apply();
  }).catch(function(){
    if (status) status.textContent = 'The bibliography could not be loaded.';
  });
  search.addEventListener('input', apply);
  if (letters) letters.addEventListener('click', function(e){
    var b = e.target.closest('[data-letter]');
    if (!b) return;
    letter = b.getAttribute('data-letter');
    [].forEach.call(letters.querySelectorAll('[data-letter]'), function(x){
      var on = x === b;
      x.classList.toggle('on', on);
      x.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    search.value = '';
    apply();
  });
  [].forEach.call(document.querySelectorAll('.bib-stat'), function(b){
    b.addEventListener('click', function(){
      [].forEach.call(document.querySelectorAll('.bib-stat'), function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      filter = b.dataset.filter;
      apply();
    });
  });
})();
</script>
<!-- BIB_SCRIPT:end -->`;

function buildBibliography(rows) {
  const counts = { all: rows.length, public: 0, nonprofit: 0, industry: 0, mixed: 0, none_disclosed: 0 };
  const letterCounts = {};
  const stored = rows.map((row) => {
    counts[row.funder] = (counts[row.funder] || 0) + 1;
    const reference = decodeEntities(row.reference || '');
    const letter = letterOf(reference);
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    return { pmid: row.pmid, cites: row.cites, funder: row.funder, reference, letter };
  });
  fs.mkdirSync(path.join(REPO, 'data'), { recursive: true });
  fs.writeFileSync(path.join(REPO, 'data/bibliography.json'), JSON.stringify(stored));
  const defaultLetter = letterCounts.A ? 'A' : (BIB_LETTERS.find((letter) => letterCounts[letter]) || 'A');
  const buttons = BIB_LETTERS.filter((letter) => letterCounts[letter]).map((letter) => {
    const on = letter === defaultLetter;
    return `<button type="button" data-letter="${letter}" class="${on ? 'on' : ''}" aria-pressed="${on ? 'true' : 'false'}">${letter}</button>`;
  }).join('');
  const letters = `<!-- BIB_LETTERS:start -->\n  <div class="bib-letters" id="bib-letters" data-default="${defaultLetter}" role="group" aria-label="Jump to a letter">\n    ${buttons}\n  </div>\n  <p class="bib-status" id="bib-status" aria-live="polite">Loading ${defaultLetter}…</p>\n  <!-- BIB_LETTERS:end -->`;
  const file = path.join(REPO, 'bibliography.html');
  let html = fs.readFileSync(file, 'utf8');
  const n = fmt(rows.length);
  if (!html.includes('.bib-letters{')) {
    html = html.replace('</style>', `    .bib-letters{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}\n    .bib-letters button{min-height:44px;min-width:44px;padding:0 12px;border-radius:8px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);color:var(--color-text-primary);font:inherit;font-size:14px;cursor:pointer}\n    .bib-letters button.on,.bib-letters button:hover{background:var(--color-brand);color:#fff;border-color:var(--color-brand)}\n    .bib-status{font-size:13px;color:var(--color-text-secondary);margin:0 0 12px}\n  </style>`);
  }
  html = html.replace(/Every PMID cited across SupplementScore — [\d,]+ unique PubMed sources/g, `Every PMID cited across SupplementScore — ${n} unique PubMed sources`);
  html = html.replace(/<button class="bib-stat on" data-filter="all" type="button">All \([\d,]+\)<\/button>/, `<button class="bib-stat on" data-filter="all" type="button">All (${n})</button>`);
  html = html.replace(/<button class="bib-stat" data-filter="public" type="button">Public \([\d,]+\)<\/button>/, `<button class="bib-stat" data-filter="public" type="button">Public (${fmt(counts.public || 0)})</button>`);
  html = html.replace(/<button class="bib-stat" data-filter="nonprofit" type="button">Nonprofit \([\d,]+\)<\/button>/, `<button class="bib-stat" data-filter="nonprofit" type="button">Nonprofit (${fmt(counts.nonprofit || 0)})</button>`);
  html = html.replace(/<button class="bib-stat" data-filter="industry" type="button">Industry \([\d,]+\)<\/button>/, `<button class="bib-stat" data-filter="industry" type="button">Industry (${fmt(counts.industry || 0)})</button>`);
  html = html.replace(/<button class="bib-stat" data-filter="mixed" type="button">Mixed \([\d,]+\)<\/button>/, `<button class="bib-stat" data-filter="mixed" type="button">Mixed (${fmt(counts.mixed || 0)})</button>`);
  html = html.replace(/<button class="bib-stat" data-filter="none_disclosed" type="button">No funder disclosed \([\d,]+\)<\/button>/, `<button class="bib-stat" data-filter="none_disclosed" type="button">No funder disclosed (${fmt(counts.none_disclosed || 0)})</button>`);
  if (html.includes('<!-- BIB_LETTERS:start -->')) {
    html = html.replace(/<!-- BIB_LETTERS:start -->[\s\S]*?<!-- BIB_LETTERS:end -->/, letters);
  } else {
    html = html.replace('<input type="text" id="bib-search"', `${letters}\n\n  <input type="text" id="bib-search"`);
  }
  html = html.replace(/<tbody id="bib-body">[\s\S]*?<\/tbody>/, '<tbody id="bib-body">\n    </tbody>');
  if (html.includes('<!-- BIB_SCRIPT:start -->')) {
    html = html.replace(/<!-- BIB_SCRIPT:start -->[\s\S]*?<!-- BIB_SCRIPT:end -->/, BIB_CLIENT);
  } else {
    html = html.replace(/<script>\s*\(function\(\)\{\s*var rows = \[\].slice.call\(document\.querySelectorAll\('#bib-body tr'\)\);[\s\S]*?\}\)\(\);\s*<\/script>/, BIB_CLIENT);
  }
  html = html.replace(/Browse [\d,+]+ supplement entries/, `Browse ${fmt(canonicalPages().size)} supplement entries`);
  fs.writeFileSync(file, html);
}

function applyTotals(supp, studies) {
  const suppTxt = fmt(supp);
  const studyTxt = fmt(studies);
  const files = ['index.html', 'about.html', 'browse.html', 'app.js', 'bibliography.html'];
  for (const rel of files) {
    const file = path.join(REPO, rel);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    const next = html
      .replace(/780\+/g, suppTxt)
      .replace(/3,200\+/g, studyTxt)
      .replace(/780 supplements scored/g, `${suppTxt} supplements scored`)
      .replace(/780 supplement scores/g, `${suppTxt} supplement scores`)
      .replace(/780-supplement/g, `${suppTxt}-supplement`)
      .replace(/780 supplements/g, `${suppTxt} supplements`)
      .replace(/3,223/g, studyTxt)
      .replace(/Filtering 733 supplements/g, `Filtering ${suppTxt} supplements`)
      .replace(/full 733-supp/g, `full ${suppTxt}-supp`);
    if (next !== html) fs.writeFileSync(file, next);
  }
}

function replaceScore(html, slugMap) {
  let changes = 0;
  function paint(block, slug) {
    const sc = slugMap.get(slug);
    if (sc == null) return block;
    const b = band(sc);
    let next = block;
    next = next.replace(/hub-sup-score s-[a-z]+/g, `hub-sup-score s-${b}`);
    next = next.replace(/(<span class="hub-sup-score-num">)\d+(<\/span>)/g, `$1${sc}$2`);
    next = next.replace(/sx-score s-[a-z]+/g, `sx-score s-${b}`);
    next = next.replace(/(<div class="sx-score s-[a-z]+">)\d+(<\/div>)/g, `$1${sc}$2`);
    next = next.replace(/score-pill score-[a-z]+/g, `score-pill score-${b}`);
    next = next.replace(/(<span class="score-pill score-[a-z]+">)\d+(<\/span>)/g, `$1${sc}$2`);
    if (next !== block) changes++;
    return next;
  }
  html = html.replace(/<a class="hub-sup-card" href="\/supplement\/([a-z0-9-]+)\.html">[\s\S]*?<\/a>/g, (block, slug) => paint(block, slug));
  html = html.replace(/<a href="\/supplement\/([a-z0-9-]+)\.html" class="sx-row">[\s\S]*?<\/a>/g, (block, slug) => paint(block, slug));
  html = html.replace(/<tr>[\s\S]*?<\/tr>/g, (block) => {
    const m = block.match(/\/supplement\/([a-z0-9-]+)\.html/);
    if (!m || !block.includes('score-pill')) return block;
    return paint(block, m[1]);
  });
  html = html.replace(/(href="\/supplement\/([a-z0-9-]+)\.html"[\s\S]{0,500}?class="score-pill score-)[a-z]+">\d+/g, (full, prefix, slug) => {
    const sc = slugMap.get(slug);
    if (sc == null) return full;
    const next = `${prefix}${band(sc)}">${sc}`;
    if (next !== full) changes++;
    return next;
  });
  return { html, changes };
}

function proseNames() {
  const names = [];
  for (const s of allSupplements()) {
    if (!s || !s.n) continue;
    const slug = slugify(s.n);
    const hit = resolveSupplement(slug);
    if (!hit || hit.n !== s.n) continue;
    names.push({ name: s.n, score: calcScore(s) });
  }
  names.sort((a, b) => b.name.length - a.name.length);
  return names;
}

function replaceProse(html, names) {
  let changes = 0;
  for (const { name, score } of names) {
    const escName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const paren = new RegExp(`(${escName}) \\((\\d{2,3})\\)`, 'gi');
    html = html.replace(paren, (full, label, num) => {
      const n = Number(num);
      if (n < 20 || n > 100 || n === score) return full;
      changes++;
      return `${label} (${score})`;
    });
    const scored = new RegExp(`(${escName}[^\\n]{0,90}?\\bscore )(\\d{2,3})`, 'gi');
    html = html.replace(scored, (full, prefix, num) => {
      const n = Number(num);
      if (n < 20 || n > 100 || n === score) return full;
      changes++;
      return `${prefix}${score}`;
    });
  }
  return { html, changes };
}

function syncScores(slugMap) {
  let changes = 0;
  const names = proseNames();
  for (const dir of ['hub', 'sx', 'stack']) {
    const root = path.join(REPO, dir);
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root, [])) {
      if (!file.endsWith('.html')) continue;
      let html = fs.readFileSync(file, 'utf8');
      const a = replaceScore(html, slugMap);
      const b = replaceProse(a.html, names);
      changes += a.changes + b.changes;
      if (b.html !== html) fs.writeFileSync(file, b.html);
    }
  }
  return changes;
}

function mismatches(slugMap) {
  const bad = [];
  const names = proseNames();
  for (const dir of ['hub', 'sx', 'stack']) {
    const root = path.join(REPO, dir);
    if (!fs.existsSync(root)) continue;
    for (const file of walk(root, [])) {
      if (!file.endsWith('.html')) continue;
      const html = fs.readFileSync(file, 'utf8');
      const rel = path.relative(REPO, file);
      const blocks = [];
      const patterns = [
        /<a class="hub-sup-card" href="\/supplement\/([a-z0-9-]+)\.html">[\s\S]*?<\/a>/g,
        /<a href="\/supplement\/([a-z0-9-]+)\.html" class="sx-row">[\s\S]*?<\/a>/g,
      ];
      for (const re of patterns) {
        let m;
        while ((m = re.exec(html))) blocks.push([m[1], m[0]]);
      }
      const tr = /<tr>[\s\S]*?<\/tr>/g;
      let m;
      while ((m = tr.exec(html))) {
        const slug = (m[0].match(/\/supplement\/([a-z0-9-]+)\.html/) || [])[1];
        if (slug && m[0].includes('score-pill')) blocks.push([slug, m[0]]);
      }
      const near = /href="\/supplement\/([a-z0-9-]+)\.html"[\s\S]{0,500}?class="score-pill score-[a-z]+">\d+/g;
      while ((m = near.exec(html))) blocks.push([m[1], m[0]]);
      for (const [slug, block] of blocks) {
        const sc = slugMap.get(slug);
        if (sc == null) continue;
        const nums = [...block.matchAll(/(?:hub-sup-score-num">|sx-score s-[a-z]+">|score-pill score-[a-z]+">)(\d+)/g)].map((x) => Number(x[1]));
        for (const n of nums) if (n !== sc) bad.push(`${rel} ${slug} shows ${n}, data says ${sc}`);
      }
      for (const { name, score } of names) {
        const escName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const paren = new RegExp(`${escName} \\((\\d{2,3})\\)`, 'gi');
        let hit;
        while ((hit = paren.exec(html))) {
          const n = Number(hit[1]);
          if (n >= 20 && n <= 100 && n !== score) bad.push(`${rel} prose ${name} (${n}) data ${score}`);
        }
      }
    }
  }
  return bad;
}

function readHeroNumbers() {
  const index = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
  const bib = fs.readFileSync(path.join(REPO, 'bibliography.html'), 'utf8');
  const about = fs.readFileSync(path.join(REPO, 'about.html'), 'utf8');
  const browse = fs.readFileSync(path.join(REPO, 'browse.html'), 'utf8');
  const app = fs.readFileSync(path.join(REPO, 'app.js'), 'utf8');
  return { index, bib, about, browse, app };
}

function check(expect) {
  const errors = [];
  const { index, bib, about, browse, app } = readHeroNumbers();
  const supp = fmt(expect.supplements);
  const studies = fmt(expect.studies);
  if (!index.includes(`>${supp}<`) && !index.includes(`>${supp}</`)) {
    /* hero uses the number as text inside a span */
  }
  for (const [name, text] of [['index', index], ['about', about], ['browse', browse]]) {
    if (text.includes('780+')) errors.push(`${name} still says 780+`);
    if (text.includes('3,200+')) errors.push(`${name} still says 3,200+`);
    if (!text.includes(supp)) errors.push(`${name} does not include the supplement total ${supp}`);
  }
  if (/780 supplements|780-supplement|780 supplement scores|>780</.test(index)) {
    errors.push('homepage still says 780 supplements');
  }
  if (!index.includes('Independent · No industry funding')) errors.push('homepage meta is missing Independent · No industry funding');
  if (/Non-profit, evidence-based/.test(index)) errors.push('homepage meta description still says Non-profit');
  if (!about.includes('Independent · No industry funding')) errors.push('about is missing Independent · No industry funding');
  if (/free, public, non-profit reference/i.test(about)) errors.push('about still calls the site a non-profit reference');
  if (/itself is a non-profit/i.test(about)) errors.push('about still says the site itself is a non-profit');
  if (!index.includes(studies) || !about.includes(studies) || !bib.includes(studies)) {
    errors.push(`study total ${studies} is missing from the homepage, about, or bibliography`);
  }
  const tbody = bib.match(/<tbody id="bib-body">([\s\S]*?)<\/tbody>/);
  if (!tbody || /<tr[\s>]/.test(tbody[1])) errors.push('bibliography still inlines every row');
  if (/&amp;[a-z]+;/.test(bib)) errors.push('bibliography HTML has a broken named entity');
  if (!bib.includes('id="bib-letters"')) errors.push('bibliography is missing A–Z sections');
  const bibFile = path.join(REPO, 'data/bibliography.json');
  if (!fs.existsSync(bibFile)) errors.push('data/bibliography.json is missing');
  else {
    const bibJson = JSON.parse(fs.readFileSync(bibFile, 'utf8'));
    if (!Array.isArray(bibJson) || bibJson.length !== expect.studies) {
      errors.push(`bibliography json rows ${bibJson && bibJson.length} != ${expect.studies}`);
    } else if (bibJson.some((row) => /&amp;[a-z]+;|&(?:auml|beta|ouml|uuml|eacute|ntilde);/.test(row.reference || ''))) {
      errors.push('bibliography json still has a broken named entity');
    }
  }
  if (!bib.includes(`${studies} unique PubMed sources`)) errors.push('bibliography heading count does not match');
  if (app.includes('Top ' ) && app.includes('supplements by evidence score')) errors.push('trending list is still labeled as a top-by-score list');
  if (!app.includes('Trending supplements')) errors.push('trending list is not labeled Trending supplements');
  if (!app.includes(SCORE_FN)) errors.push('calcScore in app.js drifted from the checker');
  const stored = JSON.parse(fs.readFileSync(path.join(REPO, 'data/site-counts.json'), 'utf8'));
  if (stored.supplements !== expect.supplements || stored.studies !== expect.studies) {
    errors.push(`data/site-counts.json is ${stored.supplements}/${stored.studies}, live data is ${expect.supplements}/${expect.studies}`);
  }
  const pmidFile = JSON.parse(fs.readFileSync(path.join(REPO, 'data/pmids.json'), 'utf8'));
  if (!Array.isArray(pmidFile) || pmidFile.length !== expect.studies) errors.push('data/pmids.json length disagrees');
  const bad = mismatches(expect.slugMap);
  errors.push(...bad.slice(0, 30));
  if (bad.length > 30) errors.push(`... ${bad.length - 30} more score mismatches`);
  return errors;
}

function trendingCopy() {
  const file = path.join(REPO, 'app.js');
  let src = fs.readFileSync(file, 'utf8');
  const next = src
    .replace(
      "const m={desc:'Highest evidence scores first. Show more reveals the rest of this ranked list, 10 at a time.',icon:'<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\"/><polyline points=\"16 7 22 7 22 13\"/>'};",
      "const m={desc:'A trending subset, ranked inside this list. It is not the highest scores on the site. Show more reveals the rest, 10 at a time.',icon:'<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\"/><polyline points=\"16 7 22 7 22 13\"/>'};"
    )
    .replace(
      "const banner=_filterBanner('Top '+shownN+' supplements by evidence score','Ranked list',m.desc,m.icon,'t3');",
      "const banner=_filterBanner('Trending supplements','Showing '+shownN+' of '+items.length,m.desc,m.icon,'t3');"
    );
  if (next === src) {
    if (!src.includes('Trending supplements') || !src.includes('It is not the highest scores on the site')) {
      throw new Error('Could not relabel the trending banner in app.js');
    }
    return;
  }
  fs.writeFileSync(file, next);
}

function main() {
  const write = process.argv.includes('--write');
  const pages = canonicalPages();
  const files = walk(REPO, []);
  const savedRefs = existingBibRefs();
  const { cites, funders, refs } = collectPmids(files);
  for (const [id, text] of savedRefs) refs.set(id, text);
  const rows = [...cites.keys()].sort((a, b) => (cites.get(b) - cites.get(a)) || (Number(b) - Number(a))).map((pmid) => ({
    pmid,
    cites: cites.get(pmid),
    funder: funderOf(funders.get(pmid)),
    reference: refs.get(pmid) || '',
  }));
  const { map } = scoreBySlug();
  const expect = { supplements: pages.size, studies: rows.length, slugMap: map };
  if (write) {
    fs.mkdirSync(path.join(REPO, 'data'), { recursive: true });
    fs.writeFileSync(path.join(REPO, 'data/site-counts.json'), JSON.stringify({
      supplements: expect.supplements,
      studies: expect.studies,
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(REPO, 'data/pmids.json'), JSON.stringify(rows.map(({ pmid, cites, funder }) => ({ pmid, cites, funder }))));
    buildBibliography(rows);
    applyTotals(expect.supplements, expect.studies);
    trendingCopy();
    const scoreChanges = syncScores(map);
    console.log(`Wrote ${expect.supplements} supplements, ${expect.studies} PMIDs, ${scoreChanges} score blocks.`);
  }
  const errors = check(expect);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`PASS supplements=${expect.supplements} studies=${expect.studies}`);
}

main();
