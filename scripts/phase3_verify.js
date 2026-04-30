// Phase 3 verification — depth + polish.
// Run from project root: `node scripts/phase3_verify.js`
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Module = require('module');
const projDir = '/sessions/stoic-cool-cerf/mnt/Supplement Score';
const ROOT = fs.existsSync(projDir) ? projDir : path.resolve(__dirname, '..');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const data = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const app  = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

const pass = [], fail = [];
const t = (name, cond, detail) => (cond ? pass : fail).push({ name, detail: detail||'' });

function syntaxOK(file) {
  try { execSync(`node --check "${file}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
}
function pySyntaxOK(file) {
  try { execSync(`python3 -m py_compile "${file}"`, { stdio: 'pipe' }); return true; }
  catch (e) { return false; }
}

// ── #6 Form-specific evidence callouts ──
t('SYNTAX data.js parses', syntaxOK(path.join(ROOT, 'data.js')));
t('SYNTAX app.js parses', syntaxOK(path.join(ROOT, 'app.js')));
t('#6 FORM_EVIDENCE_NOTES exists in data.js', /^const FORM_EVIDENCE_NOTES=\{/m.test(data));

// Functional: data has the expected clusters covered
const dm = new Module('check'); dm._compile(data + ';module.exports={FORM_EVIDENCE_NOTES,S};', 'check.js');
const FN = dm.exports.FORM_EVIDENCE_NOTES;
const allFormKeys = Object.keys(FN);
t('#6 FORM_EVIDENCE_NOTES has at least 25 entries', allFormKeys.length >= 25, 'count=' + allFormKeys.length);
['Magnesium glycinate','Magnesium L-threonate','Magnesium citrate','Magnesium malate','Magnesium taurate','Magnesium orotate','Magnesium bisglycinate'].forEach(k => {
  t('#6 magnesium variant: ' + k, !!FN[k] && typeof FN[k].note === 'string' && FN[k].note.length > 30);
});
['Calcium carbonate/citrate (bone health)','Calcium hydroxyapatite (MCHC)','Calcium alpha-ketoglutarate (Ca-AKG)'].forEach(k => {
  t('#6 calcium variant: ' + k, !!FN[k]);
});
['Zinc gluconate','Zinc picolinate','Zinc bisglycinate','Zinc carnosine'].forEach(k => {
  t('#6 zinc variant: ' + k, !!FN[k]);
});
['Choline bitartrate','Alpha-GPC','Citicoline (CDP-Choline)'].forEach(k => {
  t('#6 choline variant: ' + k, !!FN[k]);
});
['Vitamin B1 (Thiamine)','Benfotiamine','TTFD / Allithiamine (fat-soluble B1)'].forEach(k => {
  t('#6 thiamine variant: ' + k, !!FN[k]);
});
['Whey protein','Casein protein','L-Leucine (standalone)'].forEach(k => {
  t('#6 protein variant: ' + k, !!FN[k]);
});
['Myo-inositol','Inositol (high-dose, psychiatric)'].forEach(k => {
  t('#6 inositol variant: ' + k, !!FN[k]);
});
t('#6 Vitamin B12 has form note', !!FN['Vitamin B12']);

// Functional: each note has substantive content (>50 chars) and not a placeholder
const shortNotes = allFormKeys.filter(k => (FN[k].note || '').length < 50);
t('#6 all form notes are substantive (≥50 chars)', shortNotes.length === 0, shortNotes.join(', '));

// Render path: openSuppModal injects the form-note when present
t('#6 openSuppModal reads FORM_EVIDENCE_NOTES', /FORM_EVIDENCE_NOTES\[s\.n\]/.test(app));
t('#6 openSuppModal renders supp-form-note', /supp-form-note/.test(app));
t('#6 CSS .supp-form-note', css.includes('.supp-form-note'));
t('#6 CSS .supp-form-note-label', css.includes('.supp-form-note-label'));
t('#6 docs/form-evidence-policy.md exists', fs.existsSync(path.join(ROOT, 'docs/form-evidence-policy.md')));

// ── #3 Funding/COI backfill ──
t('#3 backfill_funding.py exists', fs.existsSync(path.join(ROOT, 'scripts/backfill_funding.py')));
t('#3 backfill_funding.py syntax OK', pySyntaxOK(path.join(ROOT, 'scripts/backfill_funding.py')));

// Run the classifier as a Python smoke test
const py = execSync(`cd "${ROOT}" && python3 -c "
import importlib.util
spec = importlib.util.spec_from_file_location('bf','scripts/backfill_funding.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
cases = [('NIH R01-AG12345','public'),('Pfizer Inc.','industry'),('NIH grant, Pfizer travel','mixed'),('American Heart Association','nonprofit'),('','none_disclosed')]
fail=0
for txt,exp in cases:
    out,_ = m.classify_funders(txt)
    if out != exp: fail += 1
print('FAIL_COUNT', fail)
print('COI_NEG', m.classify_coi('The authors declare no competing interests.'))
print('COI_POS', m.classify_coi('JS reports consultancy fees from Pfizer.'))
"`, { encoding: 'utf8' });
t('#3 funder classifier all 5 cases pass', /FAIL_COUNT 0/.test(py));
t('#3 COI classifier rejects negative', /COI_NEG False/.test(py));
t('#3 COI classifier accepts positive', /COI_POS True/.test(py));

// Backfill report exists for today (since we ran it earlier)
const today = new Date().toISOString().slice(0,10);
const backfillReport = path.join(ROOT, 'reviews/funding-backfill-' + today + '.md');
t('#3 funding-backfill report written today', fs.existsSync(backfillReport));
if (fs.existsSync(backfillReport)) {
  const md = fs.readFileSync(backfillReport, 'utf8');
  t('#3 report has Funder-type distribution table', md.includes('Funder-type distribution'));
  t('#3 report has Industry section', md.includes('Industry-funded citations'));
  t('#3 report has methodology notes', md.includes('Methodology notes'));
}

// index.html has at least some patched <li> elements with data-funder-type
const patchedCount = (html.match(/<li[^>]*data-funder-type="/g) || []).length;
t('#3 index.html has patched <li> elements', patchedCount >= 5, 'patched=' + patchedCount);

// ── QA pass on tier assignments ──
t('QA tier_qa_pass.py exists', fs.existsSync(path.join(ROOT, 'scripts/tier_qa_pass.py')));
t('QA tier_qa_pass.py syntax OK', pySyntaxOK(path.join(ROOT, 'scripts/tier_qa_pass.py')));
const qaReport = path.join(ROOT, 'reviews/tier-qa-' + today + '.md');
t('QA tier-qa report written today', fs.existsSync(qaReport));
if (fs.existsSync(qaReport)) {
  const md = fs.readFileSync(qaReport, 'utf8');
  t('QA report has all 4 tiers', md.includes('Tier 1') && md.includes('Tier 2') && md.includes('Tier 3') && md.includes('Tier 4'));
  t('QA report has 40 sampled entries', (md.match(/^- \[ \] \*\*/gm) || []).length === 40);
  t('QA report has Summary section', md.includes('## Summary'));
}

// ── Print summary ──
console.log('\n=== Phase 3 verification ===\n');
console.log('PASS: ' + pass.length);
pass.forEach(p => console.log('  PASS  ' + p.name + (p.detail?' — '+p.detail:'')));
if (fail.length) {
  console.log('\nFAIL: ' + fail.length);
  fail.forEach(f => console.log('  FAIL  ' + f.name + (f.detail?' — '+f.detail:'')));
  process.exit(1);
}
console.log('\nAll Phase 3 checks passed.');
