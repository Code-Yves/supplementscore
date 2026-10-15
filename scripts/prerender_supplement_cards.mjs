#!/usr/bin/env node
/**
 * Bake the full supplement card into each /supplement/<slug>.html.
 *
 * supplement-detail.js used to replace #det-root after data.js arrived, so
 * the largest paint was the hydration, not the HTML. This runs that same
 * renderer once at build time and writes the card into the page. The browser
 * still loads data.js later, and only for compare / guides / brands / show-more.
 *
 * Head tags (title, description, canonical, JSON-LD) are left as they are.
 * Redirect stubs (meta refresh) are skipped.
 *
 * Usage: node scripts/prerender_supplement_cards.mjs [slug ...]
 */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'supplement');

function buildSandbox() {
  const sandbox = {
    console,
    URL,
    URLSearchParams,
    Promise,
    setTimeout,
    clearTimeout,
    encodeURIComponent,
    decodeURIComponent,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.top = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.history = { replaceState() {}, pushState() {} };
  sandbox.fetch = function () {
    return Promise.reject(new Error('prerender'));
  };
  sandbox.location = {
    search: '',
    href: 'https://supplementscore.org/supplement.html',
    pathname: '/supplement.html',
    origin: 'https://supplementscore.org',
    hash: '',
    replace() {},
  };
  vm.createContext(sandbox);

  const dataSrc = fs.readFileSync(path.join(REPO, 'data.js'), 'utf8')
    .replace(/^\s*const\s+/gm, 'var ');
  vm.runInContext(dataSrc, sandbox, { filename: 'data.js' });
  vm.runInContext(fs.readFileSync(path.join(REPO, 'search-index.js'), 'utf8'), sandbox, { filename: 'search-index.js' });
  vm.runInContext(fs.readFileSync(path.join(REPO, 'a/manifest.js'), 'utf8'), sandbox, { filename: 'a/manifest.js' });
  vm.runInContext(fs.readFileSync(path.join(REPO, 'pairings-data.js'), 'utf8'), sandbox, { filename: 'pairings-data.js' });
  return sandbox;
}

function makeEl(tag) {
  return {
    tagName: String(tag || 'div').toUpperCase(),
    id: '',
    className: '',
    textContent: '',
    innerHTML: '',
    children: [],
    attributes: {},
    style: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'id') this.id = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attributes, k) ? this.attributes[k] : null; },
    appendChild(c) { this.children.push(c); return c; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

const sandbox = buildSandbox();
const SS = sandbox.window.SS;
if (!SS || typeof SS.getSupplement !== 'function') {
  throw new Error('window.SS.getSupplement missing');
}
const detail = new vm.Script(
  fs.readFileSync(path.join(REPO, 'supplement-detail.js'), 'utf8'),
  { filename: 'supplement-detail.js' }
);

const only = process.argv.slice(2);
const files = fs.readdirSync(OUT).filter(f => f.endsWith('.html'));
const scriptRe = /<script src="data\.js\?v=[^"]+" defer><\/script>[\s\S]*?<script src="supplement-detail\.js\?v=[^"]+" defer><\/script>/;
const mainRe = /<main class="det-wrap" id="det-root"(?: data-prerendered="1")?>[\s\S]*?<\/main>/;

let wrote = 0;
let skipped = 0;
const failed = [];

for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  if (only.length && !only.includes(slug)) continue;
  const fp = path.join(OUT, file);
  let html = fs.readFileSync(fp, 'utf8');
  if (html.includes('http-equiv="refresh"') || !html.includes('id="det-root"')) {
    skipped++;
    continue;
  }
  if (!SS.getSupplement(slug)) {
    failed.push(slug + ' (unresolved)');
    continue;
  }

  const root = makeEl('main');
  root.id = 'det-root';
  root.attributes.id = 'det-root';
  const head = makeEl('head');
  const body = makeEl('body');
  sandbox.document = {
    documentElement: { classList: { add() {} }, setAttribute() {} },
    head,
    body,
    title: '',
    getElementById(id) {
      if (id === 'det-root') return root;
      return head.children.find(c => c.id === id) || null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(tag); },
    addEventListener() {},
  };
  sandbox.location.search = '';
  sandbox.location.href = 'https://supplementscore.org/supplement/' + slug + '.html';
  sandbox.location.pathname = '/supplement/' + slug + '.html';
  sandbox.window.__SS_SLUG = slug;

  try {
    detail.runInContext(sandbox);
  } catch (err) {
    failed.push(slug + ' (' + (err && err.message) + ')');
    continue;
  }
  const card = root.innerHTML;
  if (!card || card.indexOf('det-score-num') < 0 || card.indexOf('det-prose') < 0) {
    failed.push(slug + ' (card incomplete)');
    continue;
  }
  if (!mainRe.test(html)) {
    failed.push(slug + ' (main not found)');
    continue;
  }
  html = html.replace(mainRe, '<main class="det-wrap" id="det-root" data-prerendered="1">' + card + '</main>');
  if (scriptRe.test(html)) {
    const srcs = [];
    const block = html.match(scriptRe)[0];
    for (const m of block.matchAll(/src="([^"]+)"/g)) srcs.push(m[1]);
    const loader =
      '<script>\n' +
      '/* The card is already in the HTML. Load the full stylesheet and the dataset after first paint. The dataset is only for compare, guides, brands, and show-more. */\n' +
      '(function(){\n' +
      '  var srcs=' + JSON.stringify(srcs) + ';\n' +
      '  function start(){\n' +
      '    var l=document.createElement("link"); l.rel="stylesheet"; l.href="/styles.css?v=8a19440e"; document.head.appendChild(l);\n' +
      '    for (var i=0;i<srcs.length;i++){\n' +
      '      var s=document.createElement("script");\n' +
      '      s.src=srcs[i]; s.async=false; document.body.appendChild(s);\n' +
      '    }\n' +
      '  }\n' +
      '  setTimeout(start, 300);\n' +
      '})();\n' +
      '</script>';
    html = html.replace(scriptRe, loader);
  } else if (!html.includes('setTimeout(start, 300)')) {
    failed.push(slug + ' (scripts not found)');
    continue;
  }
  fs.writeFileSync(fp, html);
  wrote++;
}

console.log('prerendered ' + wrote + ', skipped ' + skipped + ', failed ' + failed.length);
if (failed.length) {
  console.log(failed.slice(0, 30).join('\n'));
  process.exit(1);
}
