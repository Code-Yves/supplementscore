// Phase 3 follow-ups verifier — covers FU-A through FU-J.
// Run from project root: `node scripts/phase3_followups_verify.js`
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
const today = new Date().toISOString().slice(0, 10);

const pass = [], fail = [];
const t = (name, cond, detail) => (cond ? pass : fail).push({ name, detail: detail||'' });
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const pyOK = (p) => { try { execSync(`python3 -m py_compile "${path.join(ROOT, p)}"`, { stdio: 'pipe' }); return true; } catch (e) { return false; } };
const jsOK = (p) => { try { execSync(`node --check "${path.join(ROOT, p)}"`, { stdio: 'pipe' }); return true; } catch (e) { return false; } };

// ── FU-A Tier 1 confirmation gate ──
t('FU-A scripts/tier1_gate.py exists', exists('scripts/tier1_gate.py'));
t('FU-A tier1_gate.py syntax OK', pyOK('scripts/tier1_gate.py'));
t('FU-A reviews/tier1-gate report exists', exists('reviews/tier1-gate-' + today + '.md'));

// ── FU-B Drug conflicts in profile banner ──
/* NOTE: the in-banner drug-conflict surface that FU-B originally added was disabled
   by user choice ("Banner disabled per user request" comment in renderSuppStackAlerts).
   Drug-conflict warnings still surface on each supplement card, so the verifier asserts
   the per-card disclaimer rather than the banner one. */
t('FU-B per-card disclaimer "talk to your pharmacist or prescriber"',
  /Talk to your pharmacist or prescriber/i.test(app));
t('FU-B per-card drug-conflict block class still present',
  /supp-card-drug-conflicts/.test(app));
t('FU-B per-card CSS .supp-card-drug-avoid', css.includes('.supp-card-drug-avoid'));
t('FU-B per-card CSS .supp-card-drug-extra', css.includes('.supp-card-drug-extra'));
t('FU-B per-card disclaimer CSS', css.includes('.supp-card-drug-disclaimer'));
t('FU-B renderSuppStackAlerts is intentionally a no-op',
  /Banner disabled per user request/.test(app));

// ── FU-C Full funding backfill complete ──
t('FU-C funding-backfill report written today', exists('reviews/funding-backfill-' + today + '.md'));
if (exists('reviews/funding-backfill-' + today + '.md')) {
  const md = fs.readFileSync(path.join(ROOT, 'reviews/funding-backfill-' + today + '.md'), 'utf8');
  const m = md.match(/PMIDs classified:\*?\*?\s+(\d+)/);
  const classified = m ? parseInt(m[1]) : 0;
  t('FU-C ≥600 PMIDs classified (full corpus)', classified >= 600, 'classified=' + classified);
  t('FU-C report shows distribution table', md.includes('Funder-type distribution'));
}
const patchedLi = (html.match(/<li[^>]*data-funder-type="/g) || []).length;
t('FU-C ≥150 <li> elements patched', patchedLi >= 150, 'patched=' + patchedLi);

// ── FU-D EFSA stub → live ──
const efsaSrc = fs.readFileSync(path.join(ROOT, 'sources/adapters/efsa.py'), 'utf8');
t('FU-D efsa.py is no longer a stub (has _extract_results)', efsaSrc.includes('_extract_results'));
t('FU-D efsa.py syntax OK', pyOK('sources/adapters/efsa.py'));

// ── FU-E EMA stub → live ──
const emaSrc = fs.readFileSync(path.join(ROOT, 'sources/adapters/ema.py'), 'utf8');
t('FU-E ema.py is no longer a stub (has _scientific_name)', emaSrc.includes('_scientific_name'));
t('FU-E ema.py syntax OK', pyOK('sources/adapters/ema.py'));

// ── FU-F Stale-content audit dashboard ──
t('FU-F overdue.html exists', exists('overdue.html'));
const odSrc = exists('overdue.html') ? fs.readFileSync(path.join(ROOT, 'overdue.html'), 'utf8') : '';
t('FU-F dashboard uses cadenceForArticle', odSrc.includes('cadenceForArticle'));
t('FU-F dashboard uses cadenceForSupp', odSrc.includes('cadenceForSupp'));
t('FU-F dashboard uses lastReviewedFor', odSrc.includes('lastReviewedFor'));
t('FU-F dashboard has back-link to index', /href="index\.html"/.test(odSrc));

// ── FU-G Volunteer advisory program docs ──
t('FU-G docs/advisory-program.md exists', exists('docs/advisory-program.md'));
const advSrc = exists('docs/advisory-program.md') ? fs.readFileSync(path.join(ROOT, 'docs/advisory-program.md'), 'utf8') : '';
t('FU-G advisory program covers outreach template', advSrc.includes('Outreach template'));
t('FU-G advisory program covers Formspree intake', advSrc.includes('formspree'));
t('FU-G advisory program covers methodology update', advSrc.includes('Methodology page update') || advSrc.includes('methodology'));
t('FU-G feedback/advisory directory exists', exists('feedback/advisory'));

// ── FU-H Form-evidence cluster expansion ──
const dm = new Module('check'); dm._compile(data + ';module.exports={FORM_EVIDENCE_NOTES};', 'check.js');
const FN = dm.exports.FORM_EVIDENCE_NOTES;
t('FU-H FORM_EVIDENCE_NOTES has ≥50 entries', Object.keys(FN).length >= 50, 'count=' + Object.keys(FN).length);
['Astragalus (Astragalus membranaceus)','Korean red ginseng (Panax ginseng)','Glutathione (liposomal)','Ostarine (MK-2866/Enobosarm, SARM)','Oat beta-glucan (cholesterol)','Ashwagandha (KSM-66)'].forEach(k => {
  t('FU-H expanded form note: ' + k, !!FN[k] && (FN[k].note || '').length > 50);
});

// ── FU-I Activate Health Canada, WHO, MedlinePlus stubs ──
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources/registry.json'), 'utf8'));
const liveKeys = new Set(reg.sources.filter(s => s.status === 'live').map(s => s.key));
['health_canada','who','medlineplus','efsa','ema'].forEach(k => {
  t('FU-I ' + k + ' is now live', liveKeys.has(k));
});
t('FU-I health_canada.py syntax OK', pyOK('sources/adapters/health_canada.py'));
t('FU-I who.py syntax OK', pyOK('sources/adapters/who.py'));
t('FU-I medlineplus.py syntax OK', pyOK('sources/adapters/medlineplus.py'));
const stubKeys = reg.sources.filter(s => s.status === 'stub').map(s => s.key);
t('FU-I only DrugBank remains stub', stubKeys.length === 1 && stubKeys[0] === 'drugbank');

// ── FU-J SPL pair promotion + review-doc backfill ──
t('FU-J scripts/promote_spl_pairs.py exists', exists('scripts/promote_spl_pairs.py'));
t('FU-J promote_spl_pairs.py syntax OK', pyOK('scripts/promote_spl_pairs.py'));
t('FU-J backfill_funding has --annotate-reviews flag',
  fs.readFileSync(path.join(ROOT, 'scripts/backfill_funding.py'), 'utf8').includes('--annotate-reviews'));
// Verify reviews have funder tags inserted
let funderAnnots = 0;
for (const f of fs.readdirSync(path.join(ROOT, 'reviews')).filter(f => f.startsWith('article-review-') && f.endsWith('.md'))) {
  const md = fs.readFileSync(path.join(ROOT, 'reviews', f), 'utf8');
  funderAnnots += (md.match(/\[funder:/g) || []).length;
}
t('FU-J review docs have inline funder annotations', funderAnnots >= 5, 'annotations=' + funderAnnots);

// ── Confirm prior phase verifiers still pass ──
function runVerifier(p) {
  try {
    const out = execSync(`node "${path.join(ROOT, p)}"`, { encoding: 'utf8', stdio: 'pipe' });
    return /All Phase \d+ checks passed/.test(out);
  } catch (e) {
    return false;
  }
}
t('Phase 0 verifier still passes', runVerifier('scripts/phase0_verify.js'));
t('Phase 1 verifier still passes', runVerifier('scripts/phase1_verify.js'));
t('Phase 2 verifier still passes', runVerifier('scripts/phase2_verify.js'));
t('Phase 3 verifier still passes', runVerifier('scripts/phase3_verify.js'));

// ── Print summary ──
console.log('\n=== Phase 3 follow-ups verification ===\n');
console.log('PASS: ' + pass.length);
pass.forEach(p => console.log('  PASS  ' + p.name + (p.detail?' — '+p.detail:'')));
if (fail.length) {
  console.log('\nFAIL: ' + fail.length);
  fail.forEach(f => console.log('  FAIL  ' + f.name + (f.detail?' — '+f.detail:'')));
  process.exit(1);
}
console.log('\nAll Phase 3 follow-ups checks passed.');
