// Phase 1 verification — static + isolated function tests for items #5, #1, #7.
// Run from project root: `node scripts/phase1_verify.js`
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Module = require('module');
const projDir = '/sessions/stoic-cool-cerf/mnt/Supplement Score';
// When run from a different cwd, fall back to the directory containing this script.
const ROOT = fs.existsSync(projDir) ? projDir : path.resolve(__dirname, '..');
const projRequire = Module.createRequire(ROOT + '/');
const { JSDOM } = projRequire('jsdom');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css  = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const data = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const app  = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

const pass = [], fail = [];
const t = (name, cond, detail) => (cond ? pass : fail).push({ name, detail: detail||'' });

function syntaxOK(file) {
  try { execSync(`node --check "${file}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
}

// ── Step 1: data.js + app.js still parse ──
t('SYNTAX data.js parses', syntaxOK(path.join(ROOT, 'data.js')));
t('SYNTAX app.js parses', syntaxOK(path.join(ROOT, 'app.js')));

// ── Step 2: #5 cadence helpers ──
const cadenceFns = `
const CADENCE_POLICY={t1:30,t2:60,t3:60,t4:14,safety:14,kids:30,breakthrough:30,guide:90,myth:90};
function cadenceForSupp(supp){if(!supp)return 60;if(supp.lr_cadence)return Number(supp.lr_cadence)||60;const t=supp.t||'t2';return CADENCE_POLICY[t]||60;}
function cadenceForArticle(articleId){const rec=ABID[articleId];if(!rec)return 90;if(rec.cadence)return Number(rec.cadence)||90;const c=rec.c||'guide';return CADENCE_POLICY[c]||90;}
function daysSinceReviewed(d){if(!d||!/^\\d{4}-\\d{2}-\\d{2}$/.test(d))return null;const tt=new Date(d+'T00:00:00Z').getTime();const now=new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z').getTime();return Math.max(0,Math.round((now-tt)/86400000));}
`;
const dataMod = new Module('check');
dataMod._compile(data + ';module.exports={ARTICLES_BY_ID};', 'check.js');
const ABID = dataMod.exports.ARTICLES_BY_ID;
const sandbox = {};
new Function('ABID', cadenceFns + 'this.cadenceForSupp = cadenceForSupp; this.cadenceForArticle = cadenceForArticle; this.daysSinceReviewed = daysSinceReviewed; this.CADENCE_POLICY = CADENCE_POLICY;').call(sandbox, ABID);

t('#5 cadenceForSupp(t1) = 30', sandbox.cadenceForSupp({t:'t1'}) === 30);
t('#5 cadenceForSupp(t4) = 14', sandbox.cadenceForSupp({t:'t4'}) === 14);
t('#5 cadenceForSupp(t2) = 60', sandbox.cadenceForSupp({t:'t2'}) === 60);
t('#5 cadenceForSupp(no tier) = 60', sandbox.cadenceForSupp({}) === 60);
t('#5 cadenceForSupp(override) honored', sandbox.cadenceForSupp({t:'t1', lr_cadence: 7}) === 7);
t('#5 cadenceForArticle(safety article) = 14',
  sandbox.cadenceForArticle(4) === 14, 'article 4 cat=' + (ABID[4]||{}).c);
t('#5 cadenceForArticle(breakthrough article) = 30',
  sandbox.cadenceForArticle(5) === 30, 'article 5 cat=' + (ABID[5]||{}).c);
t('#5 cadenceForArticle(guide article) = 90',
  sandbox.cadenceForArticle(7) === 90, 'article 7 cat=' + (ABID[7]||{}).c);
t('#5 cadenceForArticle(kids article) = 30',
  sandbox.cadenceForArticle(139) === 30, 'article 139 cat=' + (ABID[139]||{}).c);
t('#5 daysSinceReviewed(today) = 0',
  sandbox.daysSinceReviewed(new Date().toISOString().slice(0,10)) === 0);
t('#5 daysSinceReviewed(garbage) = null',
  sandbox.daysSinceReviewed('not-a-date') === null);

// Verify the helpers are present in app.js
t('#5 app.js has CADENCE_POLICY', /const CADENCE_POLICY=\{[^}]*t4:14/.test(app));
t('#5 app.js has cadenceForSupp', /function cadenceForSupp\(/.test(app));
t('#5 app.js has cadenceForArticle', /function cadenceForArticle\(/.test(app));
t('#5 app.js has daysSinceReviewed', /function daysSinceReviewed\(/.test(app));
t('#5 app.js has isOverdueSupp', /function isOverdueSupp\(/.test(app));
t('#5 app.js has isOverdueArticle', /function isOverdueArticle\(/.test(app));
t('#5 docs/cadence-policy.md exists', fs.existsSync(path.join(ROOT, 'docs/cadence-policy.md')));
t('#5 scripts/check_regulator_alerts.py exists', fs.existsSync(path.join(ROOT, 'scripts/check_regulator_alerts.py')));

// ── Step 3: #1 source diversification framework ──
t('#1 sources/_schema.md exists', fs.existsSync(path.join(ROOT, 'sources/_schema.md')));
t('#1 sources/registry.json exists', fs.existsSync(path.join(ROOT, 'sources/registry.json')));
t('#1 sources/fetch_all.py exists', fs.existsSync(path.join(ROOT, 'sources/fetch_all.py')));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources/registry.json'), 'utf8'));
t('#1 registry has at least 8 sources', registry.sources.length >= 8);
const sourceKeys = new Set(registry.sources.map(s => s.key));
const phase1Keys = ['ods','efsa','ema','cochrane','openfda','health_canada','who','medlineplus'];
phase1Keys.forEach(k => t('#1 registry includes ' + k, sourceKeys.has(k)));
const liveSources = registry.sources.filter(s => s.status === 'live').map(s => s.key);
['ods','cochrane','openfda'].forEach(k => t('#1 ' + k + ' is live', liveSources.includes(k)));
// NB: Phase 3 follow-ups (FU-D, FU-E, FU-I) promoted EFSA, EMA, Health Canada, WHO,
// MedlinePlus from stub to live. The earlier "is stub" assertions were Phase-1-time
// expectations. This verifier now only requires the source key to be in the registry.
['efsa','ema','health_canada','medlineplus','who'].forEach(k => t('#1 ' + k + ' is registered', sourceKeys.has(k)));
for (const s of registry.sources) {
  t('#1 adapter exists: ' + s.key, fs.existsSync(path.join(ROOT, 'sources', s.adapter)));
}
t('#1 sources/adapters/_common.py exists', fs.existsSync(path.join(ROOT, 'sources/adapters/_common.py')));

// ── Step 4: #1 source-logo rendering integrates with processArticleSources ──
t('#1 app.js has SOURCE_LOGOS map', /const SOURCE_LOGOS=\{[^}]*ods:/.test(app));
t('#1 SOURCE_LOGOS has all 8 source keys',
  ['ods','efsa','ema','cochrane','openfda','health_canada','who','medlineplus']
    .every(k => app.includes(k+':{logo:')));
t('#1 processArticleSources reads data-source-key',
  /processArticleSources[\s\S]*?getAttribute\('data-source-key'\)/.test(app));
t('#1 processArticleSources adds cite-has-src class',
  /processArticleSources[\s\S]*?cite-has-src/.test(app));
t('#1 CSS .cite-src-tag', css.includes('.cite-src-tag'));
t('#1 CSS .cite-src-logo', css.includes('.cite-src-logo'));

// Functional test: render a synthetic Sources block with data-source-key
const srcLogosOrig = app.match(/const SOURCE_LOGOS=\{[\s\S]*?\};/)[0].replace('const SOURCE_LOGOS', 'var SOURCE_LOGOS');
const procOrig = app.match(/function processArticleSources\([\s\S]*?return sourcesDiv;\s*\}/)[0];
const dom = new JSDOM('<div id="x"></div>');
global.document = dom.window.document;
global.window = dom.window;
global.escAttr = s => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
global.escHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
(0, eval)(srcLogosOrig);
(0, eval)(procOrig);
const wrap = dom.window.document.createElement('div');
wrap.innerHTML = '<h3>Sources</h3><ol>'+
  '<li data-source-key="ods" data-funder-type="public">Smith J. "Vitamin D fact sheet." 2024.</li>'+
  '<li data-source-key="cochrane" data-funder-type="nonprofit">Smith J et al. "Cochrane review." 2024.</li>'+
  '<li data-source-key="openfda">openFDA FAERS query for melatonin. 2026.</li>'+
  '<li data-source-key="efsa">"EFSA opinion." 2018.</li>'+
  '<li>Smith J. "Plain citation." 2023.</li>'+
  '</ol>';
processArticleSources(wrap);
const lis = wrap.querySelectorAll('ol li');
t('#1 ODS li has cite-has-src', lis[0].classList.contains('cite-has-src'));
t('#1 ODS li renders nih.svg logo', lis[0].innerHTML.includes('source-logos/nih.svg'));
t('#1 ODS li shows "NIH ODS" label', /<span[^>]*cite-src-tag[^>]*>[^<]*<img[^>]+>NIH ODS<\/span>/.test(lis[0].innerHTML));
t('#1 Cochrane li uses cochrane.svg', lis[1].innerHTML.includes('source-logos/cochrane.svg'));
t('#1 openFDA li uses fda.svg', lis[2].innerHTML.includes('source-logos/fda.svg'));
t('#1 EFSA li uses efsa.svg', lis[3].innerHTML.includes('source-logos/efsa.svg'));
t('#1 Plain li has NO source tag', !lis[4].innerHTML.includes('cite-src-tag'));

// ── Step 5: #7 methodology page ──
t('#7 methodology.html exists', fs.existsSync(path.join(ROOT, 'methodology.html')));
const methHtml = fs.existsSync(path.join(ROOT, 'methodology.html')) ? fs.readFileSync(path.join(ROOT, 'methodology.html'),'utf8') : '';
t('#7 methodology has Tiers section', methHtml.includes('id="tiers"'));
t('#7 methodology has Sub-scores section', methHtml.includes('id="scores"'));
t('#7 methodology has Source hierarchy section', methHtml.includes('id="sources"'));
t('#7 methodology has Funding-source policy section', methHtml.includes('id="funding"'));
t('#7 methodology has Review cadence section', methHtml.includes('id="cadence"'));
t('#7 methodology has Interactions section', methHtml.includes('id="interactions"'));
t('#7 methodology has limits section', methHtml.includes('id="limits"'));
t('#7 methodology has feedback section', methHtml.includes('id="feedback"'));
t('#7 methodology mentions "25%" funding discount', methHtml.includes('25%'));
t('#7 methodology mentions all 4 tiers', /Tier 1.*Tier 2.*Tier 3.*Tier 4/s.test(methHtml));
t('#7 methodology references all 6 sub-scores', ['Efficacy','Safety','Research depth','Onset','Cost','interaction'].every(k => methHtml.includes(k)));
t('#7 methodology has back-to-home link', methHtml.includes('href="index.html"'));
t('#7 index.html footer links to methodology', /href="methodology\.html"/.test(html));

// ── Step 6: regulator-alert script smoke ──
const regScript = path.join(ROOT, 'scripts/check_regulator_alerts.py');
t('#5 regulator-alert script syntax OK', (() => {
  try { execSync(`python3 -m py_compile "${regScript}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
})());

// Print summary
console.log('\n=== Phase 1 verification ===\n');
console.log('PASS: ' + pass.length);
pass.forEach(p => console.log('  PASS  ' + p.name + (p.detail?' — '+p.detail:'')));
if (fail.length) {
  console.log('\nFAIL: ' + fail.length);
  fail.forEach(f => console.log('  FAIL  ' + f.name + (f.detail?' — '+f.detail:'')));
  process.exit(1);
}
console.log('\nAll Phase 1 checks passed.');
