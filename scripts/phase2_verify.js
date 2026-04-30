// Phase 2 verification — static + isolated function tests for drug↔supplement interactions.
// Run from project root: `node scripts/phase2_verify.js`
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Module = require('module');
const projDir = '/sessions/stoic-cool-cerf/mnt/Supplement Score';
const ROOT = fs.existsSync(projDir) ? projDir : path.resolve(__dirname, '..');
const projRequire = Module.createRequire(ROOT + '/');
const { JSDOM } = projRequire('jsdom');

const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const data = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const app  = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

const pass = [], fail = [];
const t = (name, cond, detail) => (cond ? pass : fail).push({ name, detail: detail||'' });

function syntaxOK(file) {
  try { execSync(`node --check "${file}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
}

// ── #2 DRUG_INTERACTIONS schema ──
t('SYNTAX app.js parses', syntaxOK(path.join(ROOT, 'app.js')));
t('#2 DRUG_INTERACTIONS exists in app.js', /const DRUG_INTERACTIONS=\{/.test(app));
t('#2 DRUG_INTERACTIONS has drug_groups', /DRUG_INTERACTIONS=\{[\s\S]*?drug_groups:\{/.test(app));
t('#2 DRUG_INTERACTIONS has drugs', /drugs:\{[\s\S]*?'atorvastatin'/.test(app));
t('#2 DRUG_INTERACTIONS has pairs', /pairs:\[[\s\S]*?drug:'warfarin'/.test(app));
t('#2 drug_groups includes anticoagulant', /anticoagulant:\{[^}]*supp_group:'bleed'/.test(app));
t('#2 drug_groups includes ssri w/ serotonin', /ssri:\{[^}]*supp_group:'serotonin'/.test(app));
t('#2 drug_groups includes statin w/ hepatotoxic', /statin:\{[^}]*supp_group:'hepatotoxic'/.test(app));

// ── #2 helper functions present ──
t('#2 drugClassFor function defined', /function drugClassFor\(/.test(app));
t('#2 resolveDrugKey function defined', /function resolveDrugKey\(/.test(app));
t('#2 getDrugSuppCautions function defined', /function getDrugSuppCautions\(/.test(app));
t('#2 getMedClassConflicts function defined', /function getMedClassConflicts\(/.test(app));
t('#2 getAllDrugConflicts function defined', /function getAllDrugConflicts\(/.test(app));
t('#2 computeDrugStackConflicts function defined', /function computeDrugStackConflicts\(/.test(app));
t('#2 selectedDrugs Set declared', /\blet\s+selectedDrugs\s*=\s*new\s+Set/.test(app));

// ── Functional tests on the helpers ──
const dom = new JSDOM('<div></div>');
global.document = dom.window.document;
global.window = dom.window;
global.localStorage = { getItem: ()=>null, setItem: ()=>{}, removeItem: ()=>{} };
function inject(src) {
  (0, eval)(src.replace(/\b(?:const|let)\s+(SUPP_INTERACTIONS|DRUG_INTERACTIONS|MEDS|S|TIERS|TM|EL|SL|RL|OL|CL|DL|OL_SHORT|CONDITIONS|BIOMARKERS|ARTICLE_MAP|ARTICLES_BY_ID|LAST_REVIEW|LAST_REVIEW_DEFAULT|CADENCE_POLICY|SOURCE_LOGOS|_pairPartner|_brandToDrug|_suppByName|selectedDrugs|selectedMeds|selectedSupps|_drugTaIdx|_lastRecs|_lastMi|_lastBwResults|_stackNames|_stackPairMap|profileUnlocked)\b/g, 'var $1'));
}
inject(data);
inject(app);

t('functional: drugClassFor("atorvastatin") = statin', drugClassFor('atorvastatin') === 'statin');
t('functional: drugClassFor("Lipitor") = statin (brand)', drugClassFor('Lipitor') === 'statin');
t('functional: drugClassFor("Ozempic") = glp1 (brand)', drugClassFor('Ozempic') === 'glp1');
t('functional: drugClassFor("Synthroid") = levothyroxine', drugClassFor('Synthroid') === 'levothyroxine');
t('functional: drugClassFor("xyz") = null', drugClassFor('xyz fake') === null);

t('functional: resolveDrugKey("Coumadin") = warfarin', resolveDrugKey('Coumadin') === 'warfarin');

const w_k2 = getDrugSuppCautions('Vitamin K2 (MK-7)', ['warfarin']);
t('functional: warfarin × K2 returns 1 conflict', w_k2.length === 1);
t('functional: warfarin × K2 severity = avoid', w_k2[0] && w_k2[0].severity === 'avoid');

const w_o3 = getDrugSuppCautions('Omega-3 (EPA/DHA)', ['warfarin']);
t('functional: warfarin × Omega-3 → class-level conflict', w_o3.length >= 1);
t('functional: warfarin × Omega-3 severity = avoid', w_o3[0] && w_o3[0].severity === 'avoid');

const m_b12 = getDrugSuppCautions('Vitamin B12', ['metformin']);
t('functional: metformin × B12 → extra (depletion)', m_b12.length >= 1 && m_b12[0].severity === 'extra');

const ser_5htp = getDrugSuppCautions('5-HTP', ['sertraline']);
t('functional: sertraline × 5-HTP → avoid', ser_5htp.length >= 1 && ser_5htp[0].severity === 'avoid');

const lipitor_coq10 = getDrugSuppCautions('CoQ10 (Ubiquinol)', ['Lipitor']);
t('functional: Lipitor (brand) × CoQ10 → extra', lipitor_coq10.length >= 1 && lipitor_coq10[0].severity === 'extra');

const class_only = getMedClassConflicts('Vitamin K2 (MK-7)', new Set(['warfarin']));
t('functional: getMedClassConflicts uses MEDS data', class_only.length >= 1);

const combined = getAllDrugConflicts('5-HTP', new Set(['ssri']), ['sertraline']);
t('functional: getAllDrugConflicts merges class + specific drugs', combined.length >= 1);

const stack = computeDrugStackConflicts(['Vitamin K2 (MK-7)','Vitamin B12'], ['warfarin','metformin']);
t('functional: stack-level returns object keyed by supplement',
  typeof stack === 'object' && stack['Vitamin K2 (MK-7)'] && stack['Vitamin B12']);
t('functional: stack does NOT include unaffected supplements', !stack['Magnesium glycinate']);

// No drugs → no conflicts
t('functional: empty drugs → no conflicts',
  getAllDrugConflicts('Magnesium glycinate', new Set(), []).length === 0);

// ── #2 UI rendering: cardHtml emits drug-conflict block, disclaimer, tag ──
t('#2 cardHtml emits supp-card-drug-conflicts class', app.includes('class="supp-card-conflicts supp-card-drug-conflicts"'));
t('#2 cardHtml emits not-medical-advice disclaimer', /Not medical advice\. Talk to your pharmacist/.test(app));
t('#2 cardHtml conditionally renders drugConflictBlock', /\$\{drugConflictBlock\}/.test(app));
t('#2 cardHtml shows "Do not combine with" for avoid', /Do not combine with/.test(app));
t('#2 cardHtml shows "Recommended with" for extra', /Recommended with/.test(app));

// ── #2 CSS for drug-conflict styles ──
t('#2 CSS .supp-card-drug-conflicts', css.includes('.supp-card-drug-conflicts'));
t('#2 CSS .supp-card-drug-avoid', css.includes('.supp-card-drug-avoid'));
t('#2 CSS .supp-card-drug-caution', css.includes('.supp-card-drug-caution'));
t('#2 CSS .supp-card-drug-extra', css.includes('.supp-card-drug-extra'));
t('#2 CSS .supp-card-drug-disclaimer', css.includes('.supp-card-drug-disclaimer'));

// ── #2 openFDA SPL adapter ──
t('#2 openfda_drugs.py exists', fs.existsSync(path.join(ROOT, 'sources/adapters/openfda_drugs.py')));
t('#2 openfda_drugs adapter syntax OK', (() => {
  try { execSync(`python3 -m py_compile "${path.join(ROOT, 'sources/adapters/openfda_drugs.py')}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
})());
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources/registry.json'), 'utf8'));
const ofdSrc = reg.sources.find(s => s.key === 'openfda_drugs');
t('#2 openfda_drugs registered in registry.json', !!ofdSrc);
t('#2 openfda_drugs marked status=live', ofdSrc && ofdSrc.status === 'live');
t('#2 registry has at least 9 sources (8 phase1 + openfda_drugs)', reg.sources.length >= 9);

// Severity classifier smoke test
const py = execSync(`cd "${ROOT}" && python3 -c "
import sys; sys.path.insert(0,'.')
from sources.adapters import openfda_drugs as o
cases = [
  ('contraindicated in patients on warfarin','avoid'),
  ('avoid concomitant use','avoid'),
  ('depletes vitamin B12','extra'),
  ('depleted of folate','extra'),
  ('reduces absorption of magnesium','extra'),
  ('monitor INR closely','caution'),
  ('may increase bleeding','caution'),
]
ok=fail=0
for s,exp in cases:
  out=o._classify_severity(s)
  print('OK' if out==exp else 'FAIL', repr(s), '->', out, '(expected', exp+')')
  if out==exp: ok+=1
  else: fail+=1
print('SUMMARY', ok, 'pass', fail, 'fail')
"`, { encoding: 'utf8' });
t('#2 openFDA classifier smoke (7/7 cases)', /SUMMARY 7 pass 0 fail/.test(py), py.split('\n').slice(-2,-1)[0]);

// ── Follow-up 1: Typeahead UI for specific drugs ──
t('FU1 drug-typeahead-input in index.html', fs.readFileSync(path.join(ROOT, 'index.html'),'utf8').includes('id="drug-typeahead-input"'));
t('FU1 drug-chips container in index.html', fs.readFileSync(path.join(ROOT, 'index.html'),'utf8').includes('id="drug-chips"'));
t('FU1 onDrugTypeaheadInput function defined', /function onDrugTypeaheadInput\(/.test(app));
t('FU1 onDrugTypeaheadKey function defined', /function onDrugTypeaheadKey\(/.test(app));
t('FU1 addSelectedDrug function defined', /function addSelectedDrug\(/.test(app));
t('FU1 removeSelectedDrug function defined', /function removeSelectedDrug\(/.test(app));
t('FU1 renderDrugChips function defined', /function renderDrugChips\(/.test(app));
t('FU1 _drugSuggestions function defined', /function _drugSuggestions\(/.test(app));
t('FU1 CSS .drug-typeahead-input', css.includes('.drug-typeahead-input'));
t('FU1 CSS .drug-typeahead-list', css.includes('.drug-typeahead-list'));
t('FU1 CSS .drug-chip', css.includes('.drug-chip'));
t('FU1 CSS .drug-ta-active (keyboard nav)', css.includes('.drug-ta-active'));

// Functional: typeahead suggestion algorithm
t('FU1 _drugSuggestions("ato") finds atorvastatin', _drugSuggestions('ato').some(s=>s.key==='atorvastatin'));
t('FU1 _drugSuggestions("Lip") finds atorvastatin via brand', _drugSuggestions('Lip').some(s=>s.key==='atorvastatin'));
t('FU1 _drugSuggestions caps at 8 results', _drugSuggestions('a').length <= 8);
t('FU1 _drugSuggestions("xy") returns empty (too short threshold ok)',
  _drugSuggestions('xy').length === 0 || _drugSuggestions('xy').every(s=>s.key.includes('xy')||(DRUG_INTERACTIONS.drugs[s.key].brand||[]).some(b=>b.toLowerCase().includes('xy'))));
selectedDrugs.clear();
addSelectedDrug('warfarin');
t('FU1 addSelectedDrug populates selectedDrugs', selectedDrugs.has('warfarin'));
t('FU1 already-added drug excluded from suggestions',
  !_drugSuggestions('warf').some(s=>s.key==='warfarin'));
removeSelectedDrug('warfarin');
t('FU1 removeSelectedDrug clears selection', !selectedDrugs.has('warfarin'));

// ── Follow-up 2: Bulk SPL mining run produced a candidate file ──
const today = new Date().toISOString().slice(0,10);
const candFile = path.join(ROOT, 'reviews/spl-mining-candidates-' + today + '.md');
t('FU2 mine_drug_labels.py exists', fs.existsSync(path.join(ROOT, 'scripts/mine_drug_labels.py')));
t('FU2 SPL candidates file written today', fs.existsSync(candFile));
if (fs.existsSync(candFile)) {
  const md = fs.readFileSync(candFile, 'utf8');
  t('FU2 candidates file has summary header', /Candidate pairs surfaced:\*?\*?\s+\d+/.test(md));
  t('FU2 candidates file has severity sections', md.includes('## AVOID') || md.includes('## CAUTION') || md.includes('## EXTRA'));
  t('FU2 candidates file has at least 5 candidates', (md.match(/^- \[ \]/gm)||[]).length >= 5);
  t('FU2 candidates file has SPL set_id refs', md.includes('SPL set_id:'));
}

// ── Follow-up 3: DrugBank stub adapter + integration doc ──
t('FU3 sources/adapters/drugbank.py exists', fs.existsSync(path.join(ROOT, 'sources/adapters/drugbank.py')));
t('FU3 drugbank.py syntax OK', (() => {
  try { execSync(`python3 -m py_compile "${path.join(ROOT, 'sources/adapters/drugbank.py')}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
})());
const reg2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources/registry.json'), 'utf8'));
const dbSrc = reg2.sources.find(s => s.key === 'drugbank');
t('FU3 drugbank registered in registry.json', !!dbSrc);
t('FU3 drugbank marked status=stub', dbSrc && dbSrc.status === 'stub');
t('FU3 registry now has 10 sources', reg2.sources.length === 10);
t('FU3 docs/drugbank-integration.md exists', fs.existsSync(path.join(ROOT, 'docs/drugbank-integration.md')));
const dbDoc = fs.existsSync(path.join(ROOT, 'docs/drugbank-integration.md'))
  ? fs.readFileSync(path.join(ROOT, 'docs/drugbank-integration.md'), 'utf8') : '';
t('FU3 doc covers application process', dbDoc.includes('How to apply'));
t('FU3 doc covers integration plan', dbDoc.includes('Integration plan'));
t('FU3 doc covers compliance', dbDoc.includes('compliance') || dbDoc.includes('Compliance'));

// Print summary
console.log('\n=== Phase 2 verification ===\n');
console.log('PASS: ' + pass.length);
pass.forEach(p => console.log('  PASS  ' + p.name + (p.detail?' — '+p.detail:'')));
if (fail.length) {
  console.log('\nFAIL: ' + fail.length);
  fail.forEach(f => console.log('  FAIL  ' + f.name + (f.detail?' — '+f.detail:'')));
  process.exit(1);
}
console.log('\nAll Phase 2 checks passed.');
