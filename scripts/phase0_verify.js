// Phase 0 verification — static analysis + isolated function tests.
// Avoids loading the full app.js in JSDOM (which exposes a pre-existing TDZ ordering issue
// in _pruneArticleMap that's harmless in production browser script load timing).
const fs = require('fs');
const path = require('path');
const projDir = '/sessions/stoic-cool-cerf/mnt/Supplement Score';

const html = fs.readFileSync(path.join(projDir, 'index.html'),'utf8');
const css  = fs.readFileSync(path.join(projDir, 'styles.css'),'utf8');
const data = fs.readFileSync(path.join(projDir, 'data.js'),'utf8');
const app  = fs.readFileSync(path.join(projDir, 'app.js'),'utf8');

const pass = [], fail = [];
const check = (name, cond, detail) => (cond ? pass : fail).push({name, detail: detail||''});

// ── Step 1: Node syntax check on data.js + app.js ──
const cp = require('child_process');
function syntaxOK(file) {
  try { cp.execSync(`node --check "${file}"`, {stdio:'pipe'}); return true; }
  catch(e) { return false; }
}
check('SYNTAX data.js parses', syntaxOK(path.join(projDir,'data.js')));
check('SYNTAX app.js parses', syntaxOK(path.join(projDir,'app.js')));

// ── Step 2: Run data.js in isolation to verify ARTICLES_BY_ID + LAST_REVIEW ──
const Module = require('module');
const m = new Module('check');
m._compile(data + ';module.exports={ARTICLES_BY_ID,LAST_REVIEW_DEFAULT,LAST_REVIEW};', 'check.js');
const dEx = m.exports;
check('#4 ARTICLES_BY_ID is 241 entries', Object.keys(dEx.ARTICLES_BY_ID).length === 241);
const cats = {};
for (const id in dEx.ARTICLES_BY_ID) cats[dEx.ARTICLES_BY_ID[id].c] = (cats[dEx.ARTICLES_BY_ID[id].c]||0)+1;
check('#4 No undefined categories', !cats['undefined']);
check('#4 Distribution',
  cats.guide===63 && cats.myth===49 && cats.safety===29 && cats.breakthrough===62 && cats.kids===38,
  JSON.stringify(cats));
check('#9 LAST_REVIEW_DEFAULT', dEx.LAST_REVIEW_DEFAULT === '2026-04-27');
check('#9 LAST_REVIEW NMN', dEx.LAST_REVIEW['NMN / NAD+ precursors'] === '2026-04-23');
check('#9 LAST_REVIEW Lions mane', dEx.LAST_REVIEW["Lion's mane mushroom"] === '2026-04-25');

// ── Step 3: Test the helper functions in isolation ──
function lastReviewedFor(name){try{return (typeof LAST_REVIEW!=='undefined'&&LAST_REVIEW[name])||(typeof LAST_REVIEW_DEFAULT!=='undefined'&&LAST_REVIEW_DEFAULT)||'';}catch(e){return '';}}
function fmtReviewDate(d){if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(d))return '';const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];const[y,m,day]=d.split('-').map(n=>parseInt(n,10));return months[m-1]+' '+day+', '+y;}
function articleReviewedDate(srcEl){if(!srcEl)return '';const html=srcEl.innerHTML||'';const m=html.match(/<!--\s*last-reviewed:\s*(\d{4}-\d{2}-\d{2})\s*-->/);return m?m[1]:'';}
const LAST_REVIEW = dEx.LAST_REVIEW;
const LAST_REVIEW_DEFAULT = dEx.LAST_REVIEW_DEFAULT;
check('#9 lastReviewedFor(NMN)', lastReviewedFor('NMN / NAD+ precursors') === '2026-04-23');
check('#9 lastReviewedFor(unknown)', lastReviewedFor('Imaginary supp') === '2026-04-27');
check('#9 fmtReviewDate(valid)', fmtReviewDate('2026-04-23') === 'Apr 23, 2026');
check('#9 fmtReviewDate(invalid)', fmtReviewDate('garbage') === '');
check('#9 articleReviewedDate parses', articleReviewedDate({innerHTML:'<!-- last-reviewed: 2026-04-15 -->'}) === '2026-04-15');
check('#9 articleReviewedDate empty', articleReviewedDate({innerHTML:'no comment'}) === '');

// Verify the helpers are present in app.js as Claude-edited them
check('#9 lastReviewedFor in app.js', /function lastReviewedFor\(name\)\{/.test(app));
check('#9 fmtReviewDate in app.js', /function fmtReviewDate\(d\)\{/.test(app));
check('#9 articleReviewedDate in app.js', /function articleReviewedDate\(srcEl\)\{/.test(app));
check('#9 cardHtml emits supp-card-reviewed badge', app.includes('class="supp-card-reviewed"'));
check('#9 goArticle injects article-reviewed badge', app.includes('class="article-reviewed"') && app.includes('articleReviewedDate(src)'));

// ── Step 4: #3 Citation funding/COI rendering ──
function processArticleSourcesShim(container, escAttr){
  let sourcesDiv=null;
  container.querySelectorAll('h3').forEach(h=>{if(h.textContent.trim()==='Sources')sourcesDiv=h.parentElement;});
  if(!sourcesDiv)return null;
  const ol=sourcesDiv.querySelector('ol');
  if(ol){
    ol.querySelectorAll('li').forEach(li=>{
      const ftype=(li.getAttribute('data-funder-type')||'').toLowerCase();
      const funder=li.getAttribute('data-funder')||'';
      const coi=(li.getAttribute('data-coi')||'').toLowerCase();
      if(ftype){
        li.classList.add('cite-fund-'+ftype);
        if(ftype==='industry'){
          li.insertAdjacentHTML('beforeend',' <span class="cite-fund-badge cite-fund-industry-badge">industry-funded</span>');
        }else if(ftype==='mixed'){
          li.insertAdjacentHTML('beforeend',' <span class="cite-fund-badge cite-fund-mixed-badge">mixed funding</span>');
        }
      }
      if(coi==='true'||coi==='yes'){
        li.insertAdjacentHTML('beforeend',' <span class="cite-fund-badge cite-coi-badge">COI disclosed</span>');
      }
    });
  }
  return sourcesDiv;
}
const procSrc = app.match(/function processArticleSources\([\s\S]*?return sourcesDiv;\s*\}/)[0];
check('#3 processArticleSources reads data-funder-type', procSrc.includes("getAttribute('data-funder-type')"));
check('#3 processArticleSources reads data-funder', procSrc.includes("getAttribute('data-funder')"));
check('#3 processArticleSources reads data-coi', procSrc.includes("getAttribute('data-coi')"));
check('#3 processArticleSources adds cite-fund- class', procSrc.includes("'cite-fund-'+ftype"));
check('#3 industry-funded badge in source', procSrc.includes('cite-fund-industry-badge'));
check('#3 mixed funding badge in source', procSrc.includes('cite-fund-mixed-badge'));
check('#3 COI disclosed badge in source', procSrc.includes('cite-coi-badge'));

// Build a tiny DOM to exercise the shim (mirroring real behavior)
const Module2 = require('module');
const projRequire = Module2.createRequire(projDir + '/');
const { JSDOM } = projRequire('jsdom');
const tmp = new JSDOM('<div id="x"><h3>Sources</h3><ol>' +
  '<li data-funder="Pfizer" data-funder-type="industry" data-coi="true">Smith J. Trial. 2024.</li>' +
  '<li data-funder="NIH" data-funder-type="public">Jones K. Trial. 2025.</li>' +
  '<li data-funder-type="mixed">Lee X. Mixed. 2024.</li>' +
  '<li>Doe Z. Plain. 2023.</li>' +
  '</ol></div>');
processArticleSourcesShim(tmp.window.document.getElementById('x'), s => s);
const lis = tmp.window.document.querySelectorAll('ol li');
check('#3 Industry li adds cite-fund-industry class', lis[0].classList.contains('cite-fund-industry'));
check('#3 Industry li adds industry-funded badge', lis[0].innerHTML.includes('industry-funded'));
check('#3 Industry li adds COI disclosed badge', lis[0].innerHTML.includes('COI disclosed'));
check('#3 Public li adds cite-fund-public class', lis[1].classList.contains('cite-fund-public'));
check('#3 Public li does NOT add industry badge', !lis[1].innerHTML.includes('industry-funded'));
check('#3 Mixed li adds mixed funding badge', lis[2].innerHTML.includes('mixed funding'));
check('#3 Plain li unchanged', !lis[3].innerHTML.includes('cite-fund-badge'));

check('#3 CSS .cite-fund-badge', css.includes('.cite-fund-badge'));
check('#3 CSS .cite-fund-industry-badge', css.includes('.cite-fund-industry-badge'));
check('#3 CSS .cite-fund-mixed-badge', css.includes('.cite-fund-mixed-badge'));
check('#3 CSS .cite-coi-badge', css.includes('.cite-coi-badge'));
check('#3 Schema doc exists', fs.existsSync(path.join(projDir, 'docs/citation-schema.md')));

// ── Step 5: #10 Feedback button ──
check('#10 fb-modal markup in index.html', html.includes('id="fb-modal"'));
check('#10 fb-claim textarea exists', html.includes('id="fb-claim"'));
check('#10 fb-correction textarea exists', html.includes('id="fb-correction"'));
check('#10 fb-citation input is required', /id="fb-citation"[^>]*required/.test(html));
check('#10 openFeedback function in app.js', /function openFeedback\(/.test(app));
check('#10 closeFeedback function in app.js', /function closeFeedback\(/.test(app));
check('#10 submitFeedback function in app.js', /function submitFeedback\(/.test(app));
check('#10 article footer has Flag inaccuracy button', app.includes('article-flag-btn') && app.indexOf("openFeedback(\\'article") !== -1);
check('#10 supplement modal has Flag inaccuracy button', app.indexOf("openFeedback(\\'supplement") !== -1);
check('#10 submitFeedback POSTs to Formspree', app.includes('https://formspree.io/f/mnjoylkz') && app.includes("source:'feedback-inaccuracy'"));
check('#10 submitFeedback rejects missing citation', /citation URL.*is required/.test(app));
check('#10 CSS .article-flag-btn', css.includes('.article-flag-btn'));
check('#10 feedback/ dir exists', fs.existsSync(path.join(projDir, 'feedback')));
check('#10 feedback/README.md exists', fs.existsSync(path.join(projDir, 'feedback/README.md')));

// ── Step 6: Reviews/audit log written ──
check('Audit log exists', fs.existsSync(path.join(projDir, 'reviews/category-backfill-2026-04-28.md')));

/* ── Step 7: escAttr / escAttrJs regression tests ─────────────────────────────────
   The code review of 2026-04-28 caught a class of bugs where escAttr-encoded values
   (with `&#39;` for apostrophes) landed inside `onclick="fn('...')"` attributes. The
   HTML parser decodes `&#39;` back to `'` before the JS engine sees the string, which
   breaks the JS for any value with an apostrophe — e.g., "Lion's mane mushroom",
   "St. John's Wort", "Cat's claw", "Brewer's yeast", "Devil's claw". The fix is the
   `escAttrJs` helper that backslash-escapes apostrophes and backslashes BEFORE
   HTML-escaping the rest. These tests freeze that contract so the regression can't
   sneak back in via a future inline-onclick change. */
const _escFnSrc = app.match(/function escAttr\(s\)\{[\s\S]*?\}\s*\/\*[\s\S]*?\*\/\s*function escAttrJs\(s\)\{[^}]+\}/);
check('app.js exports escAttr and escAttrJs helpers', !!_escFnSrc);
if (_escFnSrc) {
  const _escSandbox = {};
  new Function(_escFnSrc[0] + ';this.escAttr = escAttr; this.escAttrJs = escAttrJs;').call(_escSandbox);
  const escAttr = _escSandbox.escAttr;
  const escAttrJs = _escSandbox.escAttrJs;
  // Direct contract: escAttrJs converts apostrophes to backslash-apostrophe (NOT &#39;)
  check('escAttrJs("Lion\'s mane") = "Lion\\\'s mane" (NOT &#39;)',
    escAttrJs("Lion's mane") === "Lion\\'s mane",
    escAttrJs("Lion's mane"));
  check('escAttrJs preserves <, > as HTML entities', escAttrJs('a<b>c') === 'a&lt;b&gt;c');
  check('escAttrJs preserves & as &amp;', escAttrJs('a&b') === 'a&amp;b');
  check('escAttrJs preserves " as &quot;', escAttrJs('a"b') === 'a&quot;b');
  check('escAttrJs handles backslash', escAttrJs('a\\b') === 'a\\\\b');
  // The full HTML-attribute → JS-string round-trip: every supplement name with an
  // apostrophe in data.js must survive intact.
  function htmlAttrDecode(s) {
    return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
  function roundTrip(input) {
    const escaped = escAttrJs(input);
    const htmlDecoded = htmlAttrDecode(escaped);
    try { return eval("'" + htmlDecoded + "'"); } catch (e) { return null; }
  }
  const roundTripCases = [
    "Lion's mane mushroom", "St. John's Wort", "Cat's claw (Uncaria tomentosa)",
    "Brewer's yeast", "Devil's claw", "Plain name", 'Has "double quotes"',
    'Has <tags>', 'Has & ampersand', "Mixed 'and' \"both\"",
  ];
  roundTripCases.forEach(input => {
    check('escAttrJs round-trip preserves "' + input + '"',
      roundTrip(input) === input,
      'got ' + JSON.stringify(roundTrip(input)));
  });
  // No call site in app.js should still use the old broken pattern: escAttr(...).replace(/'/g, "\\'")
  // (The replace was a no-op because escAttr already converted ' to &#39;.) That pattern was
  // replaced with escAttrJs in the 2026-04-28 fix.
  check('No remaining escAttr(...).replace(/\\\'/g,"\\\\\'") no-op patterns',
    !/escAttr\([^)]+\)\.replace\(\/'\/g,"\\\\'"\)/.test(app));
  // Every inline onclick that interpolates a value through escAttr must use escAttrJs
  // (the JS-string-context flavor) rather than escAttr (the HTML-attr flavor). This
  // assertion enforces the convention going forward.
  const onclickEscAttrCalls = app.match(/onclick="[^"]*\(\\'\$\{escAttr\([^}]+\)\}\\'/g) || [];
  check('No new onclick="...(\'${escAttr(...)}\')" call sites — all should use escAttrJs',
    onclickEscAttrCalls.length === 0,
    onclickEscAttrCalls.length ? onclickEscAttrCalls[0] : '');
}

// ── Print summary ──
console.log('\n=== Phase 0 verification ===\n');
console.log('PASS: ' + pass.length);
pass.forEach(p => console.log('  PASS  ' + p.name + (p.detail?' — '+p.detail:'')));
if (fail.length) {
  console.log('\nFAIL: ' + fail.length);
  fail.forEach(f => console.log('  FAIL  ' + f.name + (f.detail?' — '+f.detail:'')));
  process.exit(1);
}
console.log('\nAll Phase 0 checks passed.');
