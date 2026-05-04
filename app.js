let profileUnlocked=false;
let selectedMeds=new Set();
// Safe localStorage wrappers — Safari ITP, private browsing, and quota-exceeded all throw.
// Wrap reads + writes so a thrown exception never breaks the app flow.
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function lsRemove(k){try{localStorage.removeItem(k);}catch(e){}}
// Guard: if data.js failed to load, fail gracefully instead of white-screening.
if(typeof S==='undefined'){console.error('[SupplementScore] data.js failed to load');window.S=[];}
// O(1) supplement lookup — avoids repeated S.find() O(n) scans in hot paths
const _suppByName=new Map(S.map(s=>[s.n,s]));
// Phase 0 / Item #9: last-reviewed date per supplement. Falls back to LAST_REVIEW_DEFAULT.
function lastReviewedFor(name){try{return (typeof LAST_REVIEW!=='undefined'&&LAST_REVIEW[name])||(typeof LAST_REVIEW_DEFAULT!=='undefined'&&LAST_REVIEW_DEFAULT)||'';}catch(e){return '';}}
// Format a YYYY-MM-DD date as "Apr 27, 2026" for display. Returns '' on bad input.
function fmtReviewDate(d){if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(d))return '';const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];const[y,m,day]=d.split('-').map(n=>parseInt(n,10));return months[m-1]+' '+day+', '+y;}
// Extract the "<!-- last-reviewed: YYYY-MM-DD -->" comment from an article source div.
function articleReviewedDate(srcEl){if(!srcEl)return '';const html=srcEl.innerHTML||'';const m=html.match(/<!--\s*last-reviewed:\s*(\d{4}-\d{2}-\d{2})\s*-->/);return m?m[1]:'';}
/* Phase 1 / Item #5: review cadence in days, derived from tier + category. Higher-stakes
   content (safety, Tier 4, kids) gets a faster cadence. Per-entry override possible via
   `lr_cadence` field on a supplement or `cadence` in an ARTICLES_BY_ID record. See
   docs/cadence-policy.md for the policy and the SKILL.md update needed for the daily run. */
const CADENCE_POLICY={t1:30,t2:60,t3:60,t4:14,safety:14,kids:30,breakthrough:30,guide:90,myth:90};
function cadenceForSupp(supp){if(!supp)return 60;if(supp.lr_cadence)return Number(supp.lr_cadence)||60;const t=supp.t||'t2';return CADENCE_POLICY[t]||60;}
function cadenceForArticle(articleId){const rec=(typeof ARTICLES_BY_ID!=='undefined')?ARTICLES_BY_ID[articleId]:null;if(!rec)return 90;if(rec.cadence)return Number(rec.cadence)||90;const c=rec.c||'guide';return CADENCE_POLICY[c]||90;}
/* Days since YYYY-MM-DD relative to today's UTC date — handy for "is this stale?" checks. */
function daysSinceReviewed(d){if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(d))return null;const t=new Date(d+'T00:00:00Z').getTime();const now=new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z').getTime();return Math.max(0,Math.round((now-t)/86400000));}
/* True when an entry is overdue for review per the cadence policy. */
function isOverdueSupp(supp){const lr=lastReviewedFor(supp.n);const d=daysSinceReviewed(lr);return d!==null&&d>=cadenceForSupp(supp);}
function isOverdueArticle(articleId,reviewedDate){const d=daysSinceReviewed(reviewedDate);return d!==null&&d>=cadenceForArticle(articleId);}
/* Phase 1 / Item #1: source-key -> {logo, label, tip} mapping for the citation renderer.
   Logo files live in /source-logos/. Stub adapters use a "regulator" fallback when no
   specific logo exists for a source. See sources/registry.json for the canonical source list. */
const SOURCE_LOGOS={
  ods:{logo:'nih.svg',label:'NIH ODS',tip:'NIH Office of Dietary Supplements — health-professional fact sheet'},
  efsa:{logo:'efsa.svg',label:'EFSA',tip:'European Food Safety Authority scientific opinion'},
  ema:{logo:'efsa.svg',label:'EMA',tip:'European Medicines Agency — herbal monograph'},
  cochrane:{logo:'cochrane.svg',label:'Cochrane',tip:'Cochrane systematic review'},
  openfda:{logo:'fda.svg',label:'openFDA',tip:'openFDA Drug Adverse Events (FAERS)'},
  health_canada:{logo:'who.svg',label:'Health Canada',tip:'Health Canada NNHPD monograph'},
  who:{logo:'who.svg',label:'WHO',tip:'WHO monograph on selected medicinal plants'},
  medlineplus:{logo:'nih.svg',label:'MedlinePlus',tip:'NIH MedlinePlus / NCCIH consumer summary'},
  pubmed:{logo:'pubmed.svg',label:'PubMed',tip:'PubMed indexed primary study'},
  nih:{logo:'nih.svg',label:'NIH',tip:'National Institutes of Health'},
  fda:{logo:'fda.svg',label:'FDA',tip:'U.S. Food and Drug Administration'},
  cdc:{logo:'cdc.svg',label:'CDC',tip:'U.S. Centers for Disease Control and Prevention'},
  nejm:{logo:'nejm.svg',label:'NEJM',tip:'New England Journal of Medicine'},
  lancet:{logo:'lancet.svg',label:'Lancet',tip:'The Lancet journal family'},
  harvard:{logo:'harvard.svg',label:'Harvard',tip:'Harvard health publication'},
  jhu:{logo:'jhu.svg',label:'Johns Hopkins',tip:'Johns Hopkins Medicine publication'},
  stanford:{logo:'stanford.svg',label:'Stanford',tip:'Stanford Medicine publication'}
};
/* Phase 0 / Item #10: reader feedback modal — citation-required inaccuracy reports.
   Posts to the existing Formspree endpoint with a 'feedback' source tag. */
let _fbCtx={kind:'',ref:''};
function openFeedback(kind,ref){_fbCtx={kind:kind||'',ref:ref||''};const m=document.getElementById('fb-modal');if(!m)return;const ctxEl=document.getElementById('fb-context');if(ctxEl){if(kind==='article'&&ref)ctxEl.textContent='Reporting on: article #'+ref;else if(kind==='supplement'&&ref)ctxEl.textContent='Reporting on: '+ref;else ctxEl.textContent='';}const f=document.getElementById('fb-form');if(f)f.reset();const ok=document.getElementById('fb-success');if(ok)ok.style.display='none';const err=document.getElementById('fb-err');if(err){err.style.display='none';err.textContent='';}const submit=document.getElementById('fb-submit');if(submit){submit.disabled=false;submit.textContent='Send';}m.classList.add('open');document.body.style.overflow='hidden';setTimeout(()=>{const c=document.getElementById('fb-claim');if(c)c.focus();},80);}
function closeFeedback(){const m=document.getElementById('fb-modal');if(m)m.classList.remove('open');document.body.style.overflow='';}
function submitFeedback(ev){if(ev&&ev.preventDefault)ev.preventDefault();const claim=(document.getElementById('fb-claim')||{}).value||'';const correction=(document.getElementById('fb-correction')||{}).value||'';const citation=((document.getElementById('fb-citation')||{}).value||'').trim();const email=((document.getElementById('fb-email')||{}).value||'').trim();const err=document.getElementById('fb-err');function showErr(msg){if(err){err.textContent=msg;err.style.display='block';}}if(!claim.trim()){showErr('Please describe the inaccurate claim.');return;}if(!correction.trim()){showErr('Please suggest a correction.');return;}if(!citation||!/^https?:\/\//i.test(citation)){showErr('A citation URL (PubMed, DOI, or regulator dossier) is required.');return;}if(email&&!isValidEmail(email)){showErr('Email looks invalid — leave blank if you don\'t want a reply.');return;}const submit=document.getElementById('fb-submit');if(submit){submit.disabled=true;submit.textContent='Sending...';}const payload={source:'feedback-inaccuracy',context_kind:_fbCtx.kind,context_ref:_fbCtx.ref,page_url:location.href,claim:claim,correction:correction,citation_url:citation,email:email||'(none provided)',submitted_at:new Date().toISOString()};fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)}).then(r=>{if(r.ok){const f=document.getElementById('fb-form');const ok=document.getElementById('fb-success');if(ok)ok.style.display='block';if(f){['fb-claim','fb-correction','fb-citation','fb-email'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});const submit=document.getElementById('fb-submit');if(submit){submit.style.display='none';}}setTimeout(closeFeedback,2200);}else{if(submit){submit.disabled=false;submit.textContent='Try again';}showErr('Submission failed — please try again or email yves@blueprintbuilds.com.');}}).catch(e=>{console.warn('[SupplementScore] feedback submit failed',e);if(submit){submit.disabled=false;submit.textContent='Try again';}showErr('Network error — please try again.');});}
// Escape a value for safe use inside an HTML attribute (single or double quoted)
function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
/* Escape a value for use inside a JavaScript string literal that lives in an HTML
   attribute, e.g. onclick="fn('<value>')". The HTML attribute parser would decode
   `&#39;` (escAttr's apostrophe escape) back to `'` and break the JS string for any
   value containing an apostrophe like "Lion's mane". This helper backslash-escapes
   apostrophes and backslashes (JS-string-safe) before HTML-escaping the rest. */
function escAttrJs(s){return escAttr(String(s).replace(/\\/g,'\\\\')).replace(/&#39;/g,"\\'");}
/* 2026-04-28 UX simplification: surface only the 4 most-prevalent medication classes
   as chips (statin, BP med, thyroid, SSRI). Anything else the user reaches via the
   "Specific medications" typeahead below the chips. Selected items NOT in TOP_4
   still render as chips so the user can see what they picked previously. */
const TOP_MED_CLASSES=['statin','bp','thyroid','ssri'];
function renderMedChips(){const el=document.getElementById('med-chips');if(!el)return;const keys=[...new Set([...TOP_MED_CLASSES,...Array.from(selectedMeds||[])])].filter(k=>MEDS[k]);el.innerHTML=keys.map(k=>{const m=MEDS[k];return`<div class="med-chip ${selectedMeds.has(k)?'on':''}" onclick="toggleMed('${escAttrJs(k)}')">${escHtml(m.label)}</div>`;}).join('');updateMedNote();}
function toggleMed(k){selectedMeds.has(k)?selectedMeds.delete(k):selectedMeds.add(k);renderMedChips();updatePfCounts();}
function updateMedNote(){const n=document.getElementById('med-note');if(!n)return;if(selectedMeds.size===0){n.style.display='none';return;}n.style.display='block';const avoidAll=new Set(),cautionAll=new Set(),extraAll=new Set();selectedMeds.forEach(k=>{const m=MEDS[k];if(!m)return;m.avoid.forEach(x=>avoidAll.add(x));m.caution.forEach(x=>cautionAll.add(x));m.extra.forEach(x=>extraAll.add(x));});n.innerHTML=`${avoidAll.size>0?'⚠ Will exclude: '+[...avoidAll].join(', ')+'. ':''}${cautionAll.size>0?'⚡ Will flag cautions on: '+[...cautionAll].join(', ')+'. ':''}${extraAll.size>0?'✚ Will add: '+[...extraAll].join(', ')+'.':''}`;}
function getMedInteractions(){const avoidAll=new Set(),cautionMap={},extraAll=new Set(),notes=[];selectedMeds.forEach(k=>{const m=MEDS[k];if(!m)return;m.avoid.forEach(x=>avoidAll.add(x));m.caution.forEach(x=>{if(!cautionMap[x])cautionMap[x]=[];cautionMap[x].push(m.label);});m.extra.forEach(x=>extraAll.add(x));notes.push({med:m.label,note:m.note});});return{avoid:avoidAll,caution:cautionMap,extra:[...extraAll],notes};}
function dots(n,tp){return Array.from({length:5},(_,i)=>`<div class="rt-dot ${i<n?'on-'+tp:''}"></div>`).join('');}
function rHtml(e,s,r,o,c,d){return`<div class="rt-section">${e!=null?`<div class="rt-row"><span class="rt-lbl">Efficacy</span><div class="rt-dots">${dots(e,'e')}</div><span class="rt-text">${EL[e]||''}</span></div>`:''}${s!=null?`<div class="rt-row"><span class="rt-lbl">Safety</span><div class="rt-dots">${dots(s,s<=2?'d':'s')}</div><span class="rt-text">${SL[s]||''}</span></div>`:''}${r!=null?`<div class="rt-row"><span class="rt-lbl">Research</span><div class="rt-dots">${dots(r,r<=2?'d':'e')}</div><span class="rt-text">${RL[r]||''}</span></div>`:''}${o!=null?`<div class="rt-row"><span class="rt-lbl">Onset</span><div class="rt-dots">${dots(o,o<=2?'d':'s')}</div><span class="rt-text">${OL[o]||''}</span></div>`:''}${c!=null?`<div class="rt-row"><span class="rt-lbl">Value</span><div class="rt-dots">${dots(c,c<=2?'d':'e')}</div><span class="rt-text">${CL[c]||''}</span></div>`:''}${d!=null?`<div class="rt-row"><span class="rt-lbl">Interact.</span><div class="rt-dots">${dots(d,d<=2?'d':'s')}</div><span class="rt-text">${DL[d]||''}</span></div>`:''}</div>`;}

function toggleSrcSidebar(){const d=document.getElementById('src-detail2');if(!d)return;const open=d.classList.toggle('open');const chv=document.getElementById('chv2');if(chv)chv.classList.toggle('open',open);const sml=document.getElementById('sml2');if(sml)sml.textContent=open?'Hide sources':'More info on sources';}
function decodeContact(e){e.preventDefault();const p=['yvese','ggleston','@','gm','ail','.com'];window.location.href='mai'+'lto:'+p.join('');}
// Minimal email format validator — accepts nearly anything with a local@domain.tld shape.
function isValidEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function submitContrib(){const inp=document.getElementById('contrib-email');if(!inp)return;const email=inp.value.trim();if(!isValidEmail(email)){inp.style.borderColor='var(--t4c)';return;}const btn=document.querySelector('.abt-cta-email button');if(!btn)return;btn.textContent='Sending...';btn.disabled=true;fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,source:'contributor',date:new Date().toISOString()})}).then(r=>{if(r.ok){const form=document.querySelector('.abt-cta-email');if(form)form.style.display='none';const ok=document.getElementById('contrib-success');if(ok)ok.style.display='block';}else{btn.textContent='Try again';btn.disabled=false;}}).catch(err=>{console.warn('[SupplementScore] contrib submission failed',err);btn.textContent='Try again';btn.disabled=false;});}
function ageGroup(a){if(a<26)return'Young adult (18–25)';if(a<31)return'Young adult (26–30)';if(a<46)return'Adult (31–45)';if(a<61)return'Middle-aged adult (46–60)';if(a<76)return'Senior adult (61–75)';return'Older adult (76+)';}
function updAge(v){const el=document.getElementById('age-grp');if(el)el.textContent=ageGroup(parseInt(v));}
function stepAge(d){const el=document.getElementById('asl');if(!el)return;let v=parseInt(el.value||35)+d;v=Math.max(18,Math.min(90,v));el.value=v;updAge(v);}
function clampAge(el){if(!el)return;let v=parseInt(el.value);if(isNaN(v))v=35;v=Math.max(18,Math.min(90,v));el.value=v;updAge(v);}
const _ageInput=document.getElementById('asl');
if(_ageInput){
  _ageInput.addEventListener('input',function(){updAge(this.value);});
  updAge(_ageInput.value);
}
let sex=null;
function pickSex(s){if(s!=='m'&&s!=='f'&&s!=='fp')return;sex=s;const bm=document.getElementById('bm'),bf=document.getElementById('bf'),bp=document.getElementById('bp');if(bm)bm.className='pf-sex-opt sx-btn'+(s==='m'?' on-m':'');if(bf)bf.className='pf-sex-opt sx-btn'+(s==='f'?' on-f':'');if(bp)bp.className='pf-sex-opt sx-btn'+(s==='fp'?' on-fp':'');const serr=document.getElementById('serr');if(serr)serr.style.display='none';}
function editP(){
  const vres=document.getElementById('v-res');if(vres)vres.style.display='none';
  const vin=document.getElementById('v-input');if(vin)vin.style.display='block';
  // Sections are always-expanded in the current design (see styles.css comment at .pf-sec-header).
  // The legacy collapse-all here was leaving every section locked shut with no toggle to reopen them.
  // Force every section back to .pf-open in case any stale state lingers.
  document.querySelectorAll('.pf-section').forEach(s=>s.classList.add('pf-open'));
  // Change submit button text
  const btn=document.querySelector('.pf-submit');
  if(btn)btn.textContent='Update my supplement plan \u2192';
  // Update hint
  const hint=document.querySelector('.pf-hint');
  if(hint)hint.textContent='Make changes above, then update your plan';
  // Scroll to top
  window.scrollTo(0,0);
}
function tbadge(t){const m=TM[t];return m&&(t==='t1'||t==='t2')?`<span class="tbadge" style="background:${m.bg};color:${m.tx}">${t==='t1'?'Tier 1':'Tier 2'}</span>`:'';}
function getRecs(age,sx){const iF=sx==='f'||sx==='fp',isPreg=sx==='fp',repAge=iF&&age>=18&&age<=50,young=age<31,midA=age>=31&&age<46,midAged=age>=46&&age<61,senior=age>=61;const r=[];r.push({n:'Vitamin D3',p:'essential',tier:'t1',tf:true,e:4,s:4,why:'Deficiency affects ~40% of adults globally. VITAL trial: 2,000 IU/day reduced cancer mortality 17% and autoimmune disease risk significantly.',dose:'1,000–2,000 IU/day maintenance (test 25-OH-D first; 4,000 IU/day to correct deficiency)'});r.push({n:'Magnesium',p:'essential',tier:'t1',tf:false,e:4,s:5,why:'NIH ODS: ~48% of Americans fall below the EAR. Supports sleep, insulin sensitivity, cardiovascular, and cognitive health.',dose:'200–400 mg/day magnesium glycinate (sleep/CNS) or malate (energy/exercise); 30–45 min before bed for sleep support'});if(sx==='m')r.push({n:'Zinc',p:'recommended',tier:'t1',tf:false,e:4,s:4,why:'Men lose zinc through sweat at higher rates and require it for testosterone biosynthesis, immune function, and prostate health.',dose:'15–25 mg/day zinc picolinate or bisglycinate (do not exceed 40 mg/day)'});if(repAge){r.push({n:'Iron',p:'essential',tier:'t2',tf:true,e:4,s:3,why:'WHO: iron deficiency anaemia affects 24.8% of the global population, disproportionately women of reproductive age.',dose:'30–60 mg/day ferrous bisglycinate — test ferritin first'});r.push({n:'Folate (5-MTHF)',p:'essential',tier:'t2',tf:false,e:4,s:4,why:'USPSTF Grade A. WHO: 400 mcg daily for all women of reproductive age. Neural tube defects form days 21–28 — must begin before conception.',dose:'400–600 mcg/day 5-MTHF (methylfolate), preferred over synthetic folic acid'});}if(isPreg){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'DHA is the primary structural fat in the foetal brain and retina. WHO recommends 300 mg DHA/day during pregnancy. CHILD cohort: higher maternal DHA linked to improved neurodevelopmental outcomes.',dose:'300–600 mg DHA/day (from 1–2 g EPA+DHA); choose a prenatal-formulated fish or algal oil'});r.push({n:'Calcium',p:'essential',tier:'t2',tf:false,e:4,s:4,why:'Foetal skeletal mineralisation draws heavily from maternal stores. NIH: requirements increase to 1,000–1,300 mg/day during pregnancy. WHO meta-analysis: calcium supplementation reduces preeclampsia risk by 55% in low-intake populations.',dose:'500 mg elemental calcium × 2 daily with meals; space 2 hours from iron'});r.push({n:'Ginger (Zingiber officinale)',p:'recommended',tier:'t2',tf:false,e:4,s:5,why:'Cochrane meta-analysis: significant reduction in nausea and vomiting of pregnancy. First-line non-pharmacological therapy.',dose:'1–1.5 g/day in divided doses for NVP'});r.push({n:'Vitamin B6 (P5P)',p:'recommended',tier:'t2',tf:false,e:3,s:3,why:'USPSTF recommends 10–25 mg TID for nausea and vomiting of pregnancy. ACOG first-line monotherapy for mild NVP.',dose:'10–25 mg × 3 daily. Do not exceed 100 mg/day.'});r.push({n:'Choline',p:'recommended',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: essential for foetal brain development and neural tube closure. Most prenatal vitamins do not contain adequate choline.',dose:'450–550 mg/day from food + supplementation'});r.push({n:'Iodine',p:'essential',tier:'t2',tf:false,e:4,s:3,why:'WHO: iodine requirements increase 50% during pregnancy. Deficiency is the most preventable cause of cognitive impairment in newborns.',dose:'220 mcg/day total from diet + supplementation'});}if(young){r.push({n:'Creatine monohydrate',p:'recommended',tier:'t1',tf:false,e:5,s:5,why:'ISSN Level A — most evidence-backed performance supplement. NIH ODS: strong long-term safety record. 2024 data confirmed cognitive benefits.',dose:'3–5 g/day — no loading needed'});r.push({n:'Omega-3 (EPA/DHA)',p:'recommended',tier:'t1',tf:false,e:4,s:4,why:'NIH VITAL trial (25,871 participants): 2,000 mg/day cut MI by 28% and reduced cancer mortality 17%. Building cardiovascular foundation now maximises cumulative benefit.',dose:'1–2 g/day EPA+DHA from a quality fish oil'});r.push({n:'Ashwagandha (KSM-66)',p:'consider',tier:'t2',tf:false,e:4,s:3,why:'Reduces cortisol and stress reactivity — highly relevant during high-demand academic or work phases. Works cumulatively over 4–8 weeks.',dose:'300 mg KSM-66 with dinner; cycle 8 wks on, 2–4 wks off'});r.push({n:'L-Theanine',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'Promotes relaxed alertness without sedation. Particularly effective for exam stress and focus during cognitive work.',dose:'100–200 mg for focus; 200–400 mg alone for calm/sleep support'});r.push({n:'Rhodiola rosea',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'2025 meta-analysis (26 RCTs): significant improvements in VO2max and time to exhaustion. Also reduces perceived mental fatigue under stress.',dose:'200–400 mg/day standardised extract; 6–8 wks on, 2–4 wks off'});}if(midA){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'CVD risk begins its meaningful rise in this decade. NIH VITAL trial and 2025 meta-analysis (42 RCTs) both confirm significant CVD mortality and MI reduction.',dose:'1–2 g/day EPA+DHA. Higher (2–4 g/day) if triglycerides are elevated.'});r.push({n:'Creatine monohydrate',p:'recommended',tier:'t1',tf:false,e:5,s:5,why:'Muscle mass declines from the early 30s at ~1% per year. Creatine with resistance training is the most evidence-backed intervention.',dose:'3–5 g/day continuously'});r.push({n:'Vitamin K2 (MK-7)',p:'recommended',tier:'t2',tf:false,e:3,s:5,why:'Arterial calcification risk begins rising in the 30s. Rotterdam Study: 57% reduced cardiac mortality in those with highest MK-7 intake. Pairs synergistically with Vitamin D3.',dose:'90–200 mcg/day MK-7 alongside Vitamin D3'});r.push({n:'Ashwagandha (KSM-66)',p:'consider',tier:'t2',tf:false,e:4,s:3,why:'Cortisol dysregulation peaks in this career and life stage. HPA axis modulation is most clinically relevant from age 30–55.',dose:'300–600 mg/day; cycle 8–12 wks on, 2–4 wks off'});r.push({n:'L-Theanine',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'Supports calm focus and sleep quality without dependency — particularly useful if stress is impacting sleep or daytime performance.',dose:'200–400 mg/day; 30–45 min before bed for sleep support'});if(iF)r.push({n:'Saffron (Crocus sativus)',p:'consider',tier:'t2',tf:false,e:4,s:4,why:'2024 systematic review (46 RCTs): depression ES=−4.26, anxiety ES=−3.75. Particularly relevant for perimenopause mood changes. Non-inferior to conventional drugs.',dose:'28–30 mg/day standardised saffron extract'});}if(midAged){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'CVD risk accelerates significantly in this decade. 2025 meta-analysis (42 RCTs, 176K+) and VITAL trial both confirm meaningful CVD mortality reduction.',dose:'2–4 g/day EPA+DHA — higher if cardiovascular risk factors are present'});r.push({n:'Vitamin B12',p:'recommended',tier:'t1',tf:true,e:4,s:5,why:'NIH ODS: B12 absorption requires intrinsic factor that declines with age; PPIs and metformin significantly impair uptake. Deficiency affects ~20% of adults over 50.',dose:'500–1,000 mcg/day oral cyanocobalamin. Test serum B12 and MMA.'});r.push({n:'Creatine monohydrate',p:'recommended',tier:'t1',tf:false,e:5,s:5,why:'Muscle loss accelerates in this decade. Creatine with resistance training is the most evidence-backed strategy for preserving lean mass and cognitive function.',dose:'3–5 g/day continuously'});if(iF)r.push({n:'Vitamin K2 (MK-7)',p:'essential',tier:'t2',tf:false,e:3,s:5,why:'Declining oestrogen during perimenopause sharply accelerates bone loss. MK-7 activates osteocalcin (bone calcium) and matrix Gla protein (arterial protection).',dose:'90–200 mcg/day MK-7 alongside Vitamin D3'});else r.push({n:'Vitamin K2 (MK-7)',p:'recommended',tier:'t2',tf:false,e:3,s:5,why:'Arterial calcification risk rises meaningfully from middle age. Rotterdam Study: 57% reduced cardiac mortality in highest MK intake group.',dose:'90–200 mcg/day MK-7 alongside Vitamin D3'});r.push({n:'Lutein + Zeaxanthin',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'AMD risk begins rising now. AREDS2 trial (NIH-funded): confirmed ~26% AMD progression risk reduction.',dose:'10 mg lutein + 2 mg zeaxanthin/day (AREDS2 formula) with a fatty meal'});r.push({n:'CoQ10 (Ubiquinol)',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: statins block CoQ10 synthesis; mitochondrial CoQ10 declines with age. 2024 meta-analysis (33 RCTs): reduces all-cause mortality in heart failure.',dose:'100–200 mg/day ubiquinol with a fatty meal'});r.push({n:'Saffron (Crocus sativus)',p:'consider',tier:'t2',tf:false,e:4,s:4,why:'Among the most evidence-backed botanicals for mood. 2024 review (46 RCTs): depression ES=−4.26. Relevant for both stress-related mood changes and sleep quality.',dose:'28–30 mg/day standardised saffron extract'});}if(senior){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'CVD is the leading cause of death in this age group. NIH VITAL trial and 2025 meta-analysis confirm significant reductions in CV mortality, MI, and CHD.',dose:'2–4 g/day EPA+DHA. Consider icosapent ethyl if CVD diagnosed.'});r.push({n:'Vitamin B12',p:'essential',tier:'t1',tf:true,e:4,s:5,why:'NIH ODS: deficiency affects ~20% of adults over 60; absorption impaired by gastric acid decline, PPIs, and metformin. Neurological damage is progressive.',dose:'500–1,000 mcg/day oral cyanocobalamin. Discuss IM injections with GP if absorption impaired.'});r.push({n:'Vitamin K2 (MK-7)',p:'essential',tier:'t2',tf:false,e:3,s:5,why:'Bone fracture and arterial calcification risk accelerate sharply after 60. K2 activates proteins that direct calcium into bone and away from arteries.',dose:'90–200 mcg/day MK-7, paired with Vitamin D3'});r.push({n:'Creatine monohydrate',p:'essential',tier:'t1',tf:false,e:5,s:5,why:'Sarcopenia is the primary driver of frailty and falls. NIH ODS: creatine with resistance training is the most evidence-backed intervention for preserving muscle and cognitive function after 60.',dose:'3–5 g/day — no loading needed. Take consistently including rest days.'});r.push({n:'Calcium',p:'essential',tier:'t2',tf:false,e:4,s:4,why:'Bone mineral density declines progressively after 60. NIH ODS: most older adults do not meet the 1,200 mg/day calcium requirement from diet alone. Paired with D3 and K2 for maximum skeletal benefit.',dose:'500 mg elemental calcium × 2 daily with meals; do not take single doses above 500 mg'});r.push({n:'Lutein + Zeaxanthin',p:'recommended',tier:'t2',tf:false,e:3,s:5,why:'AMD is the leading cause of blindness in adults over 60. AREDS2 trial (NIH-funded, 4,203 participants): ~26% AMD progression risk reduction.',dose:'10 mg lutein + 2 mg zeaxanthin/day (AREDS2 formula) with a fatty meal'});r.push({n:'HMB (β-Hydroxy-β-methylbutyrate)',p:'recommended',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: evidence strongest in older adults. 2025 meta-analysis (21 RCTs, 1,935 adults >50): significant improvements in lean mass.',dose:'3 g/day (1 g × 3 with meals). Allow ≥12 weeks alongside resistance exercise.'});r.push({n:'Whey protein',p:'recommended',tier:'t1',tf:false,e:4,s:5,why:'Appetite decreases with age while protein requirements increase. NIH ODS: adequate dietary protein is essential.',dose:'20–40 g/serving after resistance exercise. Target ≥1.2–1.6 g/kg body weight/day.'});r.push({n:'CoQ10 (Ubiquinol)',p:'recommended',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: CoQ10 depleted by statins and declines with age. 2024 meta-analysis (33 RCTs): reduces all-cause mortality (RR=0.64) in heart failure.',dose:'200–400 mg/day ubiquinol in 2 doses with fatty meals'});r.push({n:'Acetyl-L-Carnitine (ALCAR)',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: L-carnitine synthesis declines with age. Multiple meta-analyses confirm significant cognitive improvement in older adults with MCI.',dose:'1,500–2,000 mg/day in 2–3 divided doses (morning and early afternoon; avoid evening)'});r.push({n:'Phosphatidylserine',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'FDA qualified health claim for cognitive decline. Multiple RCTs confirm improvements in memory, recall, and learning in older adults. Supports cortisol regulation and neuronal membrane integrity.',dose:'300–400 mg/day in 2–3 divided doses with meals; allow 4–8 weeks for full benefit'});r.push({n:'Ashwagandha (KSM-66)',p:'consider',tier:'t2',tf:false,e:4,s:3,why:'Supports HPA axis resilience, preserves lean muscle mass, and improves sleep quality — all key concerns in older adults.',dose:'300 mg KSM-66 with dinner; cycle 8 wks on, 2–4 wks off'});r.push({n:'L-Theanine',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'Supports sleep quality and calm focus without drug interactions or dependency — ideal for older adults managing multiple medications.',dose:'200–400 mg/day; 30–45 min before bed for sleep support'});}const seen=new Set();return r.filter(x=>{if(seen.has(x.n))return false;seen.add(x.n);return true;});}
function applyMedExtras(recs,mi){
  mi.extra.forEach(n=>{
    if(!recs.find(r=>r.n===n)){
      const s=_suppByName.get(n);
      // Build the "because of …" attribution from currently selected meds only.
      // Filtering by selectedMeds keeps the attribution honest if the global MEDS
      // table later lists the supplement as an extra of a med the user didn't pick.
      // Defensive lookup: skip selected keys that no longer exist in MEDS (stale URL/localStorage).
      const _selMedLabels=[...selectedMeds].map(k=>MEDS[k]).filter(m=>m&&m.extra&&m.extra.includes(n)).map(m=>m.label);
      const _why=_selMedLabels.length
        ?`Recommended because of your selected medication(s) — ${_selMedLabels.join(', ')}.`
        :`Recommended because of your selected medication(s).`;
      if(s)recs.push({n:s.n,p:'recommended',tier:s.t,tf:false,e:s.e,s:s.s,
        why:_why,
        dose:s.dose,_medExtra:true});
    }
  });
}
function renderMedAlerts(mi){
  const ab=document.getElementById('med-alert-box');
  if(!ab)return;
  if(selectedMeds.size===0||(!mi.avoid.size&&!Object.keys(mi.caution).length&&!mi.notes.length)){ab.innerHTML='';return;}
  let html='<div class="med-alert"><div class="med-alert-hdr">\u26A0 Medication interactions considered</div>';
  if(mi.avoid.size>0)html+=`<div class="med-alert-item"><b>Removed from your list:</b> ${[...mi.avoid].join(', ')}</div>`;
  Object.entries(mi.caution).forEach(([n,meds])=>{html+=`<div class="med-alert-item"><b>${n}</b> — caution with: ${meds.join(', ')}</div>`;});
  mi.notes.forEach(x=>{html+=`<div class="med-alert-item"><b>${x.med}:</b> ${x.note}</div>`;});
  ab.innerHTML=html+'</div>';
}
// Render the "My Profile" supplement-stack interaction alert.
// Input: the recommended/essential/consider rec list. Flags any cross-conflicts across the stack.
function renderSuppStackAlerts(recs){
  // Banner disabled per user request — the in-stack supplement-interaction summary is
  // no longer shown on the My Profile page. The same warnings are still surfaced inline
  // on each supplement card (the "Stack caution" chip and the "INTERACTS WITH OTHER
  // SUPPLEMENTS IN YOUR PLAN" panel inside the card), so the information is still where
  // a user would act on it. To re-enable, restore the previous body from git history.
  const box=document.getElementById('supp-alert-box');
  if(box)box.innerHTML='';
}
function getWeightDose(r){
  const wt=parseFloat(document.getElementById('prof-weight')?.value)||0;
  if(!wt)return null;
  const wtKg=wt*0.453592;
  // Weight-based supplements
  const wbDoses={'Creatine monohydrate':{perKg:0.07,unit:'g',min:3,max:5,note:'daily'},'Whey protein':{perKg:0.4,unit:'g',min:20,max:50,note:'per serving'},'Sodium bicarbonate (sports)':{perKg:0.25,unit:'g',min:15,max:25,note:'pre-exercise'}};
  const wb=wbDoses[r.n];
  if(!wb)return null;
  const dose=Math.round(wtKg*wb.perKg);
  const clamped=Math.max(wb.min,Math.min(wb.max,dose));
  return clamped+wb.unit+' '+wb.note+' (based on your weight)';
}
const _svgIcons={
  morning:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  daytime:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B7BE5" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>',
  night:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
};
function getFoodInfo(s){const n=s.n.toLowerCase(),tag=(s.tag||'').toLowerCase();
if(n.includes('ashwagandha'))return{pair:'Take with food or warm milk. No specific pairing needed.',avoid:'Avoid combining with thyroid medications, sedatives, or immunosuppressants.',note:'Food reduces stomach upset. Traditional Ayurvedic use pairs it with warm milk before bed.'};
if(n.includes('vitamin d'))return{pair:'Eggs, avocado, nuts, olive oil, salmon — any meal with healthy fats',avoid:'Do not take on an empty stomach. Avoid excess alcohol which impairs vitamin D metabolism.',note:'Fat-soluble — absorption increases 30–50% when taken with a fat-containing meal.'};
if(n.includes('vitamin k'))return{pair:'Fatty meal: eggs, cheese, avocado, olive oil',avoid:'If on warfarin, keep vitamin K intake consistent day to day — sudden changes alter anticoagulation.',note:'Fat-soluble — requires dietary fat for absorption. Best paired with your vitamin D3 dose.'};
if(n.includes('omega')||n.includes('fish oil')||n.includes('epa')||(n.includes('dha')&&!n.includes('gandha'))||n.includes('krill'))return{pair:'Any meal containing fat — eggs, nuts, avocado, cheese',avoid:'Avoid on an empty stomach (fishy burps, nausea). Store capsules in the fridge.',note:'Absorbs significantly better with dietary fat. Refrigeration reduces oxidation and aftertaste.'};
if(n.includes('coq10')||n.includes('ubiquinol'))return{pair:'Fatty meal: eggs, nuts, avocado, olive oil, salmon',avoid:'Avoid taking in the evening — can be mildly stimulating.',note:'Fat-soluble — absorption is dramatically better with dietary fat. Split high doses across meals.'};
if(n.includes('curcumin')||n.includes('turmeric'))return{pair:'Fatty meal + black pepper (piperine). Pair with olive oil, coconut oil, or eggs.',avoid:'Avoid on an empty stomach (GI upset). Avoid grapefruit juice. Caution with blood thinners.',note:'Piperine increases curcumin absorption by 2,000%. Always choose a bioavailable form or add black pepper.'};
if(n.includes('lutein')||n.includes('zeaxanthin'))return{pair:'Eggs (yolks are rich in lutein), avocado, olive oil',avoid:'Do not take on an empty stomach — these are fat-soluble carotenoids.',note:'Fat-soluble. Absorption is negligible without dietary fat in the same meal.'};
if(n.includes('astaxanthin'))return{pair:'Salmon, eggs, avocado, olive oil — any fat-containing meal',avoid:'Avoid on an empty stomach.',note:'Fat-soluble carotenoid. Always take with dietary fat for meaningful absorption.'};
if(n==='iron'||n.includes('ferrous')||(n.includes('iron')&&!n.includes('lion')))return{pair:'Vitamin C sources: orange juice, bell peppers, strawberries, broccoli',avoid:'Dairy, tea, coffee, calcium, whole grains, and legumes within 2 hours — they block iron absorption by up to 60%.',note:'Vitamin C paired with iron boosts absorption by 2–3×. Take on an empty stomach if tolerated.'};
if(n.includes('zinc'))return{pair:'Take with a light meal. Meat, pumpkin seeds, and eggs enhance zinc absorption.',avoid:'Calcium, iron, coffee, high-phytate foods (whole grains, legumes) within 2 hours — they reduce zinc uptake.',note:'Competes with copper and iron for absorption. If taking >25 mg/day, add 1–2 mg copper.'};
if(n.includes('magnesium'))return{pair:'Take with food to reduce GI upset. No specific pairing needed.',avoid:'Calcium, iron, and zinc in the same meal — they compete for absorption. Avoid excess alcohol.',note:'Space 2 hours from other minerals. Glycinate form is gentlest on the stomach.'};
if(n.includes('calcium'))return{pair:'Take with meals. Vitamin D3 and K2 enhance calcium absorption and directing to bones.',avoid:'Iron, zinc, magnesium, and thyroid medication within 2 hours. Avoid spinach/oxalates in same meal.',note:'Never exceed 500 mg per dose — absorption drops sharply above this. Split throughout the day.'};
if(n.includes('creatine'))return{pair:'No strict food pairing needed. Some evidence suggests carbs + protein may enhance muscle uptake.',avoid:'No foods to avoid. Stay well hydrated throughout the day.',note:'Absorbs well regardless of meal timing. Consistency matters more than food pairing.'};
if(n.includes('whey')||n.includes('casein'))return{pair:'Mix with water, milk, or blend into a smoothie. Post-workout with carbs for recovery.',avoid:'No foods to avoid. Isolate form if lactose-sensitive.',note:'Complete protein. Ideally taken within 2 hours post-exercise, but total daily protein matters more than timing.'};
if(n.includes('collagen'))return{pair:'Pair with 50 mg vitamin C (citrus, berries) — required for collagen synthesis in the body.',avoid:'No specific foods to avoid. Can be added to hot or cold beverages.',note:'Vitamin C is essential for your body to use the collagen peptides. Without it, supplementation is less effective.'};
if(n.includes('probiotic')||n.includes('lactobacillus')||n.includes('bifidobacterium'))return{pair:'Prebiotic fibre: bananas, garlic, onion, oats — feeds the probiotic bacteria.',avoid:'Hot drinks (kills bacteria). Antibiotics within 2 hours (kills the probiotic).',note:'Some strains survive stomach acid better with food, others without — check product label.'};
if(n.includes('berberine'))return{pair:'Always take with meals — reduces blood sugar crash risk and stomach upset. Add piperine for absorption.',avoid:'Never on an empty stomach. Avoid grapefruit. Space 2+ hours from other medications.',note:'Taking with food slows absorption and prevents sudden blood sugar drops. Medical supervision essential.'};
if(n.includes('rhodiola'))return{pair:'Best on an empty stomach, 30 min before breakfast.',avoid:'Avoid caffeine within 1 hour (both stimulating). Avoid late-day dosing — can disrupt sleep.',note:'Empty stomach maximises absorption. Stimulating nature means morning-only dosing.'};
if(n.includes('b12'))return{pair:'Sublingual: dissolve under tongue (no food needed). Oral: take with breakfast.',avoid:'PPIs, antacids, metformin within 2 hours — they reduce B12 absorption significantly.',note:'Sublingual bypasses the gut and is ideal for those with absorption issues. Morning dosing preferred.'};
if(n.includes('folate')||n.includes('folic'))return{pair:'Take with any meal. No specific pairing needed.',avoid:'No significant food interactions. Alcohol impairs folate metabolism long-term.',note:'5-MTHF form is absorbed regardless of MTHFR genetics. Start before conception.'};
if(n.includes('theanine'))return{pair:'For focus: pair with caffeine (100–200 mg theanine : 50–100 mg caffeine). Green tea is a natural combo.',avoid:'No foods to avoid. No significant interactions.',note:'One of the few supplements that works synergistically with caffeine, reducing jitters while enhancing focus.'};
if(n.includes('melatonin'))return{pair:'Take on an empty or very light stomach for faster onset.',avoid:'Alcohol — disrupts sleep architecture and counteracts melatonin. Heavy meals delay absorption.',note:'Darkness amplifies melatonin\'s effects. Dim lights and avoid screens 30 min before and after taking.'};
if(n.includes('nac')||n.includes('n-acetyl cysteine'))return{pair:'Take with food to reduce stomach upset.',avoid:'Activated charcoal (binds to NAC). Space from chemotherapy drugs unless supervised.',note:'Food reduces the sulfurous taste and GI side effects common with NAC.'};
if(n.includes('elderberry'))return{pair:'Can be taken with or without food. Syrup form mixes into drinks.',avoid:'Only use commercially prepared extracts — raw elderberry contains cyanogenic glycosides.',note:'Best started within 48 hours of first symptoms. No significant food interactions.'};
if(n.includes('boswellia'))return{pair:'Always with a fat-containing meal — fat doubles absorption of boswellic acids.',avoid:'Do not take on an empty stomach.',note:'Fat is critical for boswellia absorption. Without it, most of the active compound passes through unabsorbed.'};
if(n.includes('bacopa'))return{pair:'Always take with food — significantly reduces nausea and cramps.',avoid:'Empty stomach causes GI distress in most people.',note:'Bacosides are fat-soluble. Taking with a meal containing fat improves both absorption and tolerance.'};
if(n.includes('caffeine')||n.includes('green tea extract'))return{pair:'Light food or empty stomach for faster effect.',avoid:'Iron supplements — caffeine reduces iron absorption. Avoid late in the day (sleep disruption).',note:'Half-life is 5–6 hours. Afternoon caffeine significantly impairs sleep quality even if you fall asleep fine.'};
if(n.includes('beta-alanine'))return{pair:'Take with meals to reduce tingling (paresthesia).',avoid:'No specific foods to avoid.',note:'Splitting doses across meals minimises the harmless but uncomfortable tingling sensation.'};
if(n.includes('citrulline'))return{pair:'Take on an empty stomach or light meal 60 min before exercise.',avoid:'No significant food interactions.',note:'Empty stomach allows faster absorption and peak nitric oxide levels before training.'};
if(n.includes('beetroot')||n.includes('nitrate'))return{pair:'Take 2–3 hours before exercise. Can mix juice with other beverages.',avoid:'Antibacterial mouthwash — kills oral bacteria needed to convert nitrate. Avoid brushing teeth right after.',note:'Oral bacteria are essential for nitrate → nitric oxide conversion. Mouthwash eliminates the benefit.'};
if(n.includes('hmb'))return{pair:'Take with meals. Split into 3 doses of 1 g each.',avoid:'No significant food interactions.',note:'Consistent timing with meals helps maintain stable blood levels throughout the day.'};
if(n.includes('saffron'))return{pair:'Take with any meal. No specific pairing needed.',avoid:'No significant food interactions.',note:'Standardised extract (30 mg/day) is well absorbed regardless of food timing.'};
if(n.includes('ginger'))return{pair:'Can be taken with food, tea, or on an empty stomach.',avoid:'Blood thinners at high doses — ginger has mild antiplatelet activity.',note:'For nausea: ginger tea or capsules before meals. Cooking does not destroy active compounds.'};
if(n.includes('saw palmetto'))return{pair:'Take with a fat-containing meal for better absorption.',avoid:'No significant food interactions.',note:'Fat-soluble extract. Absorption improves with dietary fat.'};
if(n.includes('echinacea'))return{pair:'Take with or without food.',avoid:'Avoid if on immunosuppressants.',note:'Short-term use at first sign of cold. Not for daily preventive use.'};
if(n.includes('vitamin a')||n.includes('beta-carotene'))return{pair:'Fatty meal: eggs, avocado, olive oil, butter',avoid:'Avoid excess alcohol. Do not combine with retinoid medications.',note:'Fat-soluble — requires dietary fat for absorption.'};
if(n.includes('vitamin e'))return{pair:'Fatty meal: nuts, seeds, avocado, olive oil',avoid:'Blood thinners at high doses. Do not combine with vitamin K antagonists.',note:'Fat-soluble antioxidant. High-dose supplementation (>400 IU/day) is controversial.'};
if(n.includes('vitamin b6')||n.includes('p5p'))return{pair:'Take with food in the morning.',avoid:'Avoid late-day dosing — may cause vivid dreams. Do not exceed 100 mg/day.',note:'P5P (pyridoxal-5-phosphate) is the active form, preferred over pyridoxine.'};
if(n.includes('vitamin c')||n.includes('ascorbic'))return{pair:'Take with iron to boost iron absorption. Can take with any meal.',avoid:'Mega-doses (>2 g) on an empty stomach may cause GI upset and diarrhea.',note:'Enhances iron and collagen absorption. Excess is excreted in urine.'};
if(n.includes('choline'))return{pair:'Take with meals. Eggs are the richest food source.',avoid:'Excess choline (>3.5 g/day) can cause fishy body odour and GI distress.',note:'Most prenatal vitamins lack adequate choline — supplementation often needed.'};
if(n.includes('iodine'))return{pair:'Take with food. Seaweed and dairy are rich food sources.',avoid:'Excess iodine can worsen thyroid conditions. Do not combine with thyroid medication without supervision.',note:'Requirements increase 50% during pregnancy. Both deficiency and excess harm the thyroid.'};
// Generics based on properties
if(tag.includes('sleep')||tag.includes('relaxation'))return{pair:'Light meal or warm drink before bed.',avoid:'Caffeine, heavy meals, and bright screens within 2 hours of dosing.',note:'Sleep supplements work best as part of a consistent wind-down routine.'};
if(tag.includes('performance')||tag.includes('endurance'))return{pair:'Take 30–60 min before exercise. Light carbs may enhance uptake.',avoid:'No specific foods to avoid.',note:'Timing relative to exercise matters more than food pairing for most performance supplements.'};
const def={pair:'Can generally be taken with food.',avoid:'No significant food interactions established.',note:s.s>=4?'Well-tolerated supplement. Follow product label for specific guidance.':'Follow product label. Take with food if stomach upset occurs.'};
return def;}
function getExcessInfo(s){const n=s.n.toLowerCase(),tag=(s.tag||'').toLowerCase();
if(n.includes('ashwagandha'))return{risk:'Rare but serious liver injury reported. May suppress thyroid function excessively.',threshold:'Do not exceed 600 mg/day. Limit to 8–12 week cycles.',long:'Safety beyond 3 months not well established. Stop immediately if abdominal pain or jaundice occur. NCCIH recommends caution.'};
if(n.includes('vitamin d'))return{risk:'Hypercalcemia: nausea, kidney stones, vascular calcification, and organ damage.',threshold:'Do not exceed 10,000 IU/day without medical supervision. Toxic levels at 25-OH-D >150 ng/mL.',long:'Monitor blood levels every 6–12 months. Reduce dose in summer if sun exposure increases.'};
if(n.includes('vitamin k'))return{risk:'No established toxicity at supplemental doses.',threshold:'If on warfarin: even moderate doses alter anticoagulation dangerously.',long:'Safe for long-term use. Critical to maintain consistent intake if on blood thinners.'};
if(n.includes('omega')||n.includes('fish oil')||n.includes('epa')||(n.includes('dha')&&!n.includes('gandha')))return{risk:'Increased bleeding risk, immune suppression, raised LDL cholesterol.',threshold:'Doses above 5 g/day EPA+DHA increase bleeding risk significantly.',long:'Safe indefinitely at recommended doses. Blood-thinning effect is cumulative.'};
if(n.includes('coq10')||n.includes('ubiquinol'))return{risk:'Mild: GI upset, insomnia at high doses (>300 mg). May reduce warfarin effectiveness.',threshold:'No serious toxicity reported even at 1,200 mg/day in studies.',long:'Safe for long-term daily use. No cycling needed.'};
if(n.includes('curcumin')||n.includes('turmeric'))return{risk:'GI distress, nausea, diarrhea. Mild anticoagulant effect increases bleeding risk.',threshold:'Avoid >2,000 mg/day curcuminoids. Caution with blood thinners and gallbladder disease.',long:'Safe for continuous use at recommended doses. Take breaks if digestive discomfort occurs.'};
if(n.includes('lutein')||n.includes('zeaxanthin'))return{risk:'Very safe. Extremely high doses may cause harmless temporary skin yellowing (carotenodermia).',threshold:'No established toxicity at supplemental doses.',long:'Safe for indefinite daily use. AREDS2 formula studied for 5+ years safely.'};
if(n==='iron'||n.includes('ferrous')||(n.includes('iron')&&!n.includes('lion')))return{risk:'Excess iron is toxic — oxidative damage to liver, heart, and pancreas. Acute overdose is a medical emergency.',threshold:'Do not supplement without testing ferritin first. Upper limit 45 mg/day elemental iron.',long:'Retest ferritin every 8–12 weeks. Stop supplementing once levels normalise. Chronic excess causes hemochromatosis.'};
if(n.includes('zinc'))return{risk:'Copper depletion leading to anemia, weakened immunity, and neurological damage.',threshold:'Do not exceed 40 mg/day long-term. Add 1–2 mg copper if taking >25 mg/day.',long:'Chronic high-dose zinc without copper causes irreversible nerve damage. Always pair with copper.'};
if(n.includes('magnesium'))return{risk:'Diarrhea and GI distress (especially oxide form). In kidney disease: dangerous hypermagnesemia.',threshold:'Supplemental upper limit 350 mg/day (excluding food). Kidney patients require medical supervision.',long:'Safe long-term in healthy individuals — kidneys excrete excess. Dangerous if kidney function is impaired.'};
if(n.includes('calcium'))return{risk:'Kidney stones, hypercalcemia, arterial calcification. May increase cardiovascular risk at high doses.',threshold:'Do not exceed 2,500 mg/day total (food + supplements). Never >500 mg per single dose.',long:'Pair with D3 and K2 to direct calcium to bones. Excess calcium without K2 may calcify arteries.'};
if(n.includes('creatine'))return{risk:'Very safe — no credible evidence of kidney or liver harm in healthy people. Minor: water retention, mild GI discomfort.',threshold:'Even 30 g/day showed no adverse effects in studies. Standard 3–5 g/day is extremely well tolerated.',long:'One of the most studied supplements for long-term safety. Safe indefinitely. Stay hydrated.'};
if(n.includes('whey')||n.includes('casein'))return{risk:'Excessive protein (>3 g/kg/day) may strain kidneys in those with pre-existing kidney disease. Bloating, acne.',threshold:'Safe within 1.6–2.2 g/kg/day total protein from all sources.',long:'Safe for long-term daily use. Adequate hydration important at high intake.'};
if(n.includes('collagen'))return{risk:'Very safe. Minor: bloating or GI discomfort at very high doses (>20 g/day).',threshold:'No established toxicity. Avoid marine collagen if allergic to fish/shellfish.',long:'Safe for indefinite daily use. Effects reverse gradually if stopped.'};
if(n.includes('berberine'))return{risk:'Hypoglycemia (dangerously low blood sugar), especially with diabetes drugs. GI distress. Statin toxicity risk.',threshold:'Do not exceed 1,500 mg/day. Never combine with statins without medical supervision.',long:'Requires ongoing medical supervision. Monitor liver enzymes every 3–6 months.'};
if(n.includes("john's wort")||n.includes('st. john'))return{risk:'Dramatically reduces blood levels of warfarin, contraceptives, HIV meds, chemotherapy. Fatal serotonin syndrome with SSRIs.',threshold:'Do not exceed 900 mg/day. Never self-prescribe — medical supervision essential.',long:'Do not use long-term without regular medication reviews. Dangerous interactions are dose-dependent.'};
if(n.includes('melatonin'))return{risk:'Morning grogginess, worsened depression, suppressed natural melatonin production.',threshold:'Optimal dose is 0.3–1 mg. Most products contain 10–30× more than needed.',long:'Chronic nightly use >1 mg may reduce your body\'s own melatonin production. Use situationally.'};
if(n.includes('b12'))return{risk:'Very safe — excess excreted in urine. Very rare: may aggravate acne in some individuals.',threshold:'No established toxicity even at high doses.',long:'Safe for indefinite daily use. Essential to continue if vegan, elderly, or on PPIs/metformin.'};
if(n.includes('folate')||n.includes('folic'))return{risk:'Doses >1,000 mcg/day may mask B12 deficiency, allowing irreversible nerve damage to progress.',threshold:'Upper limit 1,000 mcg/day for folic acid. 5-MTHF form may be safer at higher doses.',long:'Safe long-term at recommended doses. Always ensure adequate B12 status when supplementing folate.'};
if(n.includes('theanine'))return{risk:'Extremely safe. Mild drowsiness at very high doses (>600 mg).',threshold:'No serious adverse effects reported in studies up to 900 mg/day.',long:'Safe for indefinite daily use. One of the safest supplements known.'};
if(n.includes('rhodiola'))return{risk:'Overstimulation, insomnia, irritability, elevated blood pressure at high doses.',threshold:'Do not exceed 600 mg/day. Avoid afternoon/evening dosing.',long:'Effectiveness may diminish with continuous use. Cycle 6–8 weeks on, 2–4 off.'};
if(n.includes('bacopa'))return{risk:'Significant GI distress: nausea, cramps, diarrhea. May lower heart rate excessively.',threshold:'Do not exceed 450 mg/day. Always take with food.',long:'Long-term safety beyond 6 months not established. Some recommend 12 weeks on, 4 weeks off.'};
if(n.includes('beta-alanine'))return{risk:'Paresthesia (skin tingling) at doses >800 mg at once — harmless but uncomfortable.',threshold:'No serious toxicity known. Upper limit not established.',long:'Safe for long-term daily use. Muscle carnosine benefits require continuous supplementation.'};
if(n.includes('nac')||n.includes('n-acetyl cysteine'))return{risk:'Nausea, vomiting, diarrhea at high doses. Paradoxical pro-oxidant effect possible.',threshold:'Do not exceed 2,400 mg/day without medical supervision. Mild anticoagulant effect.',long:'Safe for continuous use at standard doses. Used clinically for years for OCD and respiratory conditions.'};
if(n.includes('elderberry'))return{risk:'Raw elderberry contains cyanogenic glycosides (toxic). Only use commercial extracts.',threshold:'Follow product dosing. Use for 3–5 days during illness, not indefinitely.',long:'Not recommended as a daily preventive. Prolonged immune stimulation is not advisable.'};
if(n.includes('boswellia'))return{risk:'GI distress, acid reflux, skin rash at high doses.',threshold:'Generally well tolerated. No established toxicity at supplemental doses.',long:'Safe for continuous use based on studies up to 6 months.'};
if(n.includes('citrulline'))return{risk:'Very safe. Minor GI discomfort at very high doses (>15 g).',threshold:'No established toxicity. Well tolerated even at high doses.',long:'Safe for long-term daily use as a pre-workout supplement.'};
if(n.includes('beetroot')||n.includes('nitrate'))return{risk:'Red/pink urine and stool (harmless). Additive hypotension with blood pressure meds.',threshold:'Monitor blood pressure if on antihypertensives. Standard doses well tolerated.',long:'Safe for regular use. No cycling needed.'};
if(n.includes('saffron'))return{risk:'Doses >5 g are toxic (abortifacient). Nausea and vomiting at >200 mg/day.',threshold:'Absolutely do not exceed 30 mg/day of standardised extract. Toxic dose is relatively low.',long:'Safe at 28–30 mg/day for up to 12 weeks in studies.'};
if(n.includes('ginger'))return{risk:'Heartburn, GI upset at high doses. Mild blood-thinning effect.',threshold:'Do not exceed 4 g/day. Caution with blood thinners at high doses.',long:'Safe for continuous use at culinary and standard supplemental doses.'};
if(n.includes('vitamin b6')||n.includes('p5p'))return{risk:'Peripheral neuropathy (nerve damage) from chronic high doses — numbness, tingling in hands and feet.',threshold:'Do not exceed 100 mg/day. Nerve damage reported at 200+ mg/day chronically.',long:'Safe at recommended doses (10–50 mg). Nerve damage from excess is usually reversible if caught early.'};
if(n.includes('vitamin c')||n.includes('ascorbic'))return{risk:'Kidney stones, GI distress, diarrhea at mega-doses.',threshold:'Upper limit 2,000 mg/day. Excess is excreted in urine but still stresses kidneys.',long:'Safe at moderate doses long-term. Mega-dosing (>2 g/day) not recommended.'};
if(n.includes('vitamin a'))return{risk:'Liver toxicity, birth defects (teratogenic), increased intracranial pressure.',threshold:'Do not exceed 10,000 IU/day preformed retinol. Beta-carotene form is much safer.',long:'Chronic excess causes liver damage. Pregnant women must not exceed 3,000 IU/day retinol.'};
if(n.includes('choline'))return{risk:'Fishy body odour, GI distress, excessive sweating.',threshold:'Upper limit 3,500 mg/day. Most experience side effects above 1,000 mg.',long:'Safe at recommended doses (450–550 mg/day) long-term.'};
if(n.includes('iodine'))return{risk:'Both excess and deficiency harm the thyroid. Can trigger hyper- or hypothyroidism.',threshold:'Upper limit 1,100 mcg/day. Excess especially dangerous with pre-existing thyroid conditions.',long:'Safe at recommended doses. Monitor thyroid function if supplementing long-term.'};
if(n.includes("lion's mane"))return{risk:'Mild GI upset. One case report of respiratory distress. Avoid if mushroom allergy.',threshold:'No established toxicity. Long-term data is limited.',long:'Benefits reverse within 4 weeks of stopping. Safety beyond a few months not well characterised.'};
if(n.includes('saw palmetto'))return{risk:'GI upset, headache. Rare: liver injury.',threshold:'Standard 320 mg/day well tolerated. Do not exceed without supervision.',long:'Studies up to 2 years show good tolerance.'};
if(n.includes('hmb'))return{risk:'Very safe. No significant adverse effects reported.',threshold:'Standard 3 g/day well tolerated in studies.',long:'Safe for long-term daily use alongside resistance training.'};
if(n.includes('probiotics')||n.includes('probiotic'))return{risk:'Generally safe. Rare: infections in severely immunocompromised. Temporary bloating when starting.',threshold:'No upper limit established for healthy individuals.',long:'Safe for indefinite daily use. Benefits depend on consistent supplementation.'};
// Generic fallback
if(s.s>=4)return{risk:'Generally well tolerated. Minor GI discomfort possible at high doses.',threshold:'Follow product label. Do not exceed recommended dose without medical advice.',long:'Safe for long-term use at recommended doses based on current evidence.'};
if(s.s===3)return{risk:'Moderate safety profile — side effects more likely at higher doses.',threshold:'Do not exceed recommended dose. Medical supervision advised for prolonged use.',long:'Consider periodic breaks. Long-term data may be limited.'};
return{risk:'Limited safety data. Side effects possible even at standard doses.',threshold:'Do not exceed recommended dose. Consult a healthcare provider before use.',long:'Use the shortest effective duration. Medical supervision recommended.'};}
const _nightSupps=new Set(['Magnesium','L-Theanine','Ashwagandha (KSM-66)','Glycine','Melatonin','Tart cherry (Montmorency)','Magnesium L-threonate','Magnolia bark (honokiol + magnolol)','Valerian root','Apigenin','Saffron (Crocus sativus)','Lemon balm (Melissa officinalis)','Passionflower (Passiflora incarnata)','California poppy (Eschscholzia californica)','Jujube (Ziziphus jujuba)','Chamomile extract (Matricaria chamomilla)','5-HTP','Tryptophan (L-tryptophan)','Lavender oil oral (Silexan)','Phosphatidylserine']);
const _morningSupps=new Set(['Vitamin D3','Iron','Vitamin B12','Folate (5-MTHF)','Vitamin B6 (P5P)','S-Adenosylmethionine (SAMe)','Rhodiola rosea','Tyrosine (L-tyrosine)','Acetyl-L-Carnitine (ALCAR)','Vitamin D3 liquid drops','Omega-3 (EPA/DHA)','CoQ10 (Ubiquinol)','Choline','Zinc','Iodine','Vitamin K2 (MK-7)','Ferrous bisglycinate (gentle iron)','Vitamin C (moderate dose)']);
function getTimingLabel(r){
  if(_nightSupps.has(r.n))return{time:'Night',icon:_svgIcons.night,cat:'night'};
  if(_morningSupps.has(r.n))return{time:'Morning',icon:_svgIcons.morning,cat:'morning'};
  const s=_suppByName.get(r.n);
  if(!s||!s.tips)return{time:'Daytime',icon:_svgIcons.daytime,cat:'daytime'};
  const t=s.tips.toLowerCase();
  if(t.includes('before bed')||t.includes('evening')||t.includes('before sleep')||t.includes('at night'))return{time:'Night',icon:_svgIcons.night,cat:'night'};
  if(t.includes('morning')||t.includes('empty stomach'))return{time:'Morning',icon:_svgIcons.morning,cat:'morning'};
  return{time:'Daytime',icon:_svgIcons.daytime,cat:'daytime'};
}
function renderRecCard(r,mi){
  const cList=mi.caution[r.n]||[];
  const hasWarn=cList.length>0;
  const warnHtml=hasWarn?`<div class="rc-warn">\u26A1 Caution with: ${cList.join(', ')} — monitor closely and consult your prescriber.</div>`:'';
  const medExtraNote=r._medExtra?'<span class="warn-badge">+ from your meds</span>':'';
  const goalExtraNote=r._goalExtra?'<span class="warn-badge" style="background:var(--t2bg);color:var(--t2tx)">+ from your goals</span>':'';
  const condExtraNote=r._condExtra?'<span class="warn-badge" style="background:var(--t1bg);color:var(--t1tx)">+ from your conditions</span>':'';
  // Score
  const sup=_suppByName.get(r.n);
  const sc=sup?calcScore(sup):0;
  const scCls=sc>=72?'score-high':sc>=60?'score-mid':sc>=40?'score-low':'score-bad';
  // Weight-based dose
  const wDose=getWeightDose(r);
  // Timing
  const timing=getTimingLabel(r);
  // Tips
  const tips=sup?.tips||'';
  return`<div class="rc${hasWarn?' has-warn':''}" style="display:flex;gap:0;overflow:hidden;padding:0"><div style="width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;flex-shrink:0;background:${scCls==='score-high'?'linear-gradient(180deg,var(--t1c),#0F766E)':scCls==='score-mid'?'linear-gradient(180deg,var(--t2c),#3B5FC0)':scCls==='score-low'?'linear-gradient(180deg,var(--t3c),#A16207)':'linear-gradient(180deg,var(--t4c),#991B1B)'};border-radius:10px 0 0 10px"><span style="font-size:18px;font-weight:700;color:#fff;line-height:1">${sc}</span><span style="font-size:7px;color:rgba(255,255,255,.7);text-transform:uppercase;margin-top:2px">Score</span></div><div style="flex:1;padding:.75rem .9rem"><div class="rc-top"><span class="rc-name">${r.n}</span>${r.tf?'<span class="tfirst">test first</span>':''}${medExtraNote}${goalExtraNote}${condExtraNote}</div><div class="rc-why">${r.why}</div>${warnHtml}${timing?`<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;color:var(--color-text-secondary);background:var(--color-background-secondary);padding:5px 9px;border-radius:6px;border:0.5px solid var(--color-border-tertiary)">${timing.icon}<b>${timing.time}</b></div>`:''}<div class="rc-dose"><b>Dose:</b> ${r.dose}</div>${wDose?`<div style="font-size:11px;color:var(--t1tx);background:var(--t1bg);padding:4px 9px;border-radius:6px;margin-top:4px">📏 <b>Your dose:</b> ${wDose}</div>`:''} ${tips?`<div style="font-size:10px;color:var(--color-text-tertiary);margin-top:5px;font-style:italic">${tips}</div>`:''}</div></div>`;
}
function renderPriSection(prefix,items,mkC){
  const el=document.getElementById(prefix+'-cards');
  const cnt=document.getElementById(prefix+'-cnt');
  const sec=document.getElementById(prefix+'-sec');
  cnt.textContent=`${items.length} supplement${items.length!==1?'s':''}`;
  el.innerHTML=items.length?items.map(mkC).join(''):'<div class="empty">None identified for this profile.</div>';
  sec.style.display=items.length?'block':'none';
}
/* ── Blood work ── */
let bloodWork={};

const BW_ICONS={
  sun:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/></svg>',
  pulse:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  clock:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  moon:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
  leaf:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22c-4-3.5-8-7-8-12a8 8 0 1116 0c0 5-4 8.5-8 12z"/></svg>',
  thyroid:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>',
  bolt:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  globe:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  shield:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  droplet:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
  heart:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>',
  heartPlus:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/><path d="M12 11v4M10 13h4"/></svg>'
};

function renderBwGrid(){
  const grid=document.getElementById('bw-grid');
  if(!grid)return;
  grid.innerHTML=Object.entries(BIOMARKERS).map(([key,bio])=>{
    const rangeText=bio.highOnly?'Optimal: <'+bio.optHigh+' '+bio.unit:'Optimal: '+bio.optLow+'-'+bio.optHigh+' '+bio.unit;
    return`<div class="bw-row" id="bw-row-${key}"><div class="bw-row-icon" style="background:linear-gradient(135deg,${bio.gradient[0]},${bio.gradient[1]})">${BW_ICONS[bio.icon]||''}</div><div class="bw-row-info"><div class="bw-list-name">${bio.name}</div><div class="bw-row-range">${rangeText}</div></div><input type="text" id="bw-${key}" placeholder="\u2014" oninput="updateBwRow('${key}',this.value)"><div class="bw-list-unit">${bio.unit}</div><div class="bw-list-dot"></div></div>`;
  }).join('');
}

function updateBwRow(key,val){
  const num=parseFloat(val);
  const row=document.getElementById('bw-row-'+key);
  const input=document.getElementById('bw-'+key);
  const dot=row?.querySelector('.bw-row-dot');
  if(!row||!input)return;
  const isEmpty=val==null||(typeof val==='string'&&val.trim()==='');
  if(isNaN(num)||isEmpty){
    delete bloodWork[key];
    row.classList.remove('has-val');
    input.style.borderColor='';input.style.color='';input.style.fontWeight='';
    if(dot)dot.style.background='';
  }else{
    bloodWork[key]=num;
    row.classList.add('has-val');
    const bio=BIOMARKERS[key];
    let color;
    if(bio.highOnly){
      color=num<=bio.optHigh?'var(--t1c)':num<=bio.high?'var(--t3c)':'var(--t4c)';
    }else if(bio.higherBetter){
      if(num<bio.low)color='var(--t4c)';
      else if(num<bio.optLow)color='var(--t3c)';
      else if(num<=bio.high)color='var(--t1c)';
      else color='var(--t2c)';
    }else{
      if(num<bio.low)color='var(--t4c)';
      else if(num<bio.optLow)color='var(--t3c)';
      else if(num<=bio.optHigh)color='var(--t1c)';
      else if(num<=bio.high)color='var(--t2c)';
      else color='var(--t4c)';
    }
    input.style.borderColor=color;input.style.color=color;input.style.fontWeight='700';
    if(dot)dot.style.background=color;
  }
  updateBwCount();
  if(typeof updatePfCounts==='function')updatePfCounts();
}

function updateBwCount(){
  const ct=document.getElementById('bw-count');
  if(!ct)return;
  const total=Object.keys(BIOMARKERS).length;
  const filled=Object.keys(bloodWork).length;
  if(!filled){ct.textContent='';return;}
  let critical=0,low=0,elevated=0;
  for(const[k,v]of Object.entries(bloodWork)){
    const b=BIOMARKERS[k];if(!b)continue;
    if(b.highOnly){
      if(v>b.high)critical++;
      else if(v>b.optHigh)elevated++;
    }else if(b.higherBetter){
      if(v<b.low)critical++;
      else if(v<b.optLow)low++;
      else if(v>b.high)elevated++;
    }else{
      if(v<b.low||v>b.high)critical++;
      else if(v<b.optLow)low++;
      else if(v>b.optHigh)elevated++;
    }
  }
  let txt=`<b>${filled}</b> of ${total} entered`;
  if(critical)txt+=` \u00B7 <span style="color:var(--t4c);font-weight:600">${critical} critical</span>`;
  if(low)txt+=` \u00B7 <span style="color:var(--t3c);font-weight:600">${low} below optimal</span>`;
  if(elevated)txt+=` \u00B7 <span style="color:var(--t2c);font-weight:600">${elevated} elevated</span>`;
  ct.innerHTML=txt;
}

function toggleBwManual(){
  const m=document.getElementById('bw-manual');
  const btn=document.getElementById('bw-manual-toggle');
  if(!m)return;
  // Use computed style in case display isn't set inline yet.
  const computed=m.style.display||getComputedStyle(m).display;
  const open=computed==='none';
  m.style.display=open?'block':'none';
  if(btn)btn.innerHTML=open?'Hide manual entry &#9652;':'Enter values manually &#9662;';
}

// Each biomarker: name patterns to find on a line, and a unit-conversion map
// (source unit string -> multiplier that converts the raw value into the canonical
// unit used by BIOMARKERS). "exclude" patterns disqualify a line for this biomarker
// (used so that e.g. "HDL CHOLESTEROL" doesn't get claimed as total cholesterol).
const BW_ALIASES={
  hdl:{names:[/\bhdl[\s\-]*(?:cholesterol|chol|c|ceolester[oa]l|cho?les?ter[oa]l)?\b/i,/high[\s\-]*density\s*lipo/i],
    exclude:[/non[\s\-]*hdl/i,/non[\s\-]*hd1/i,/\bratio\b/i,/tc\s*\/[\s\-]*hdl/i,/hdl[\s\-]*\/[\s\-]*ldl/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':38.67,'mmol/L':38.67}},
  ldl:{names:[/\bldl[\s\-]*(?:cholesterol|chol|c|ceolester[oa]l|cho?les?ter[oa]l)?(?:[\s\-]*calc\.?)?\b/i,/low[\s\-]*density\s*lipo/i],
    exclude:[/\bratio\b/i,/hdl[\s\-]*\/[\s\-]*ldl/i,/ldl[\s\-]*\/[\s\-]*hdl/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':38.67,'mmol/L':38.67}},
  triglycerides:{names:[/triglycerides?/i,/\btrig\b/i,/\btg\b/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':88.57,'mmol/L':88.57}},
  totalChol:{names:[/total\s*cholesterol/i,/cholesterol[\s,]*total/i,/^\s*cholesterol\b/i,/\bcholesterol\b/i,
    // OCR-resilient variants — tesseract.js commonly mangles CHOLESTEROL → CEOLESTEROL
    // (H↔E confusion at index 1) and a few other letter-substitutions seen in the wild.
    /total\s*ce?olester[oa]l/i,/\bce?olester[oa]l\b/i,/\bcholestrol\b/i,/\bcholestoral\b/i,
    /\bcho?les?ter[oa]l\b/i],
    exclude:[/\bhdl\b/i,/\bldl\b/i,/non[\s\-]*hdl/i,/non[\s\-]*hd1/i,/vldl/i,/tc\s*\//i,/ratio/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':38.67,'mmol/L':38.67}},
  vitD:{names:[/25[\s\-]*hydroxy\s*vitamin\s*d\b/i,/vitamin\s*d[,.\s]*25[\s\-]*(?:oh|hydroxy)/i,/25[\s\-]*\(?\s*oh\s*\)?[\s\-]*d\b/i,/25[\s\-]*(?:oh|hydroxy)/i,/\bvit(?:amin)?\s*d[23]?\b/i],
    units:{'ng/ml':1,'ng/mL':1,'nmol/l':0.4,'nmol/L':0.4}},
  b12:{names:[/\bvitamin\s*b[\s\-]*12\b/i,/\bb[\s\-]*12\b/i,/\bcobalamin\b/i,/methylcobalamin/i,/cyanocobalamin/i,
    // OCR variants — B↔8 confusion ("VITAMIN 812", "8-12")
    /\bvitamin\s*8[\s\-]*?12\b/i,/\b8[\s\-]*?12\s*(?:vitamin|level)?\b/i],
    units:{'pg/ml':1,'pg/mL':1,'pmol/l':1.355,'pmol/L':1.355}},
  folateRbc:{names:[/folate[\s,]*rbc/i,/rbc\s*folate/i,/red\s*(?:blood\s*)?cell\s*folate/i,/erythrocyte\s*folate/i],
    units:{'ng/ml':1,'ng/mL':1,'nmol/l':0.441,'nmol/L':0.441}},
  folate:{names:[/\bfolate\b/i,/\bfolic\s*acid\b/i,/5[\s\-]*mthf\b/i],
    exclude:[/\brbc\b/i,/erythrocyte/i,/red\s*(?:blood\s*)?cell/i],
    units:{'ng/ml':1,'ng/mL':1,'nmol/l':0.441,'nmol/L':0.441}},
  ferritin:{names:[/\bferritin\b/i],
    units:{'ng/ml':1,'ng/mL':1,'ug/l':1,'µg/l':1,'mcg/l':1}},
  magRbc:{names:[/magnesium[\s,]*(?:rbc|red\s*blood|erythrocyte)/i,/(?:rbc|erythrocyte)[\s,]*mag/i,/mag[\s,]*rbc/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':2.43,'mmol/L':2.43,'mEq/L':1.216,'meq/l':1.216}},
  tsh:{names:[/\btsh\b/i,/thyroid\s*stim/i,/thyrotropin/i],
    units:{'miu/l':1,'mIU/L':1,'uiu/ml':1,'µIU/mL':1,'mu/l':1}},
  crp:{names:[/(?:hs[\s\-]?)?c[\s\-]?reactive\s*protein/i,/\bhs[\s\-]?crp\b/i,/\bcrp\b/i,/high[\s\-]*sensitivity\s*crp/i],
    units:{'mg/l':1,'mg/L':1,'nmol/l':0.105,'mg/dl':10,'mg/dL':10}},
  omega3:{names:[/omega[\s\-]*3\s*index/i,/epa[\s\+]*dha\s*index/i,/omega[\s\-]*3/i],
    units:{'%':1}},
  zinc:{names:[/\bzinc\b/i,/\bzn\b/i],
    exclude:[/\bzinc\s*(?:hair|urine)\b/i],
    units:{'mcg/dl':1,'ug/dl':1,'µg/dl':1,'umol/l':6.538,'µmol/l':6.538}},
  hba1c:{names:[/\bhba1c\b/i,/\bhgba1c\b/i,/\ba1c\b/i,/hemoglobin\s*a1c/i,/glyc(?:ated|osylated)\s*(?:hemo|haemo)/i],
    units:{'%':1}},
  testosterone:{names:[/\btestosterone[\s,]*total\b/i,/total[\s,]*testosterone/i,/\btestosterone\b/i],
    exclude:[/\bfree\b/i,/\bbio(?:available)?\b/i,/shbg/i],
    units:{'ng/dl':1,'ng/dL':1,'nmol/l':28.85,'nmol/L':28.85,'ng/ml':100,'ng/mL':100}},
  freeTesto:{names:[/free\s*testosterone/i,/testosterone[\s,]*free/i],
    units:{'pg/ml':1,'pg/mL':1,'pmol/l':0.288,'pmol/L':0.288,'ng/dl':10,'ng/dL':10}},
  fastingGlucose:{names:[/fasting\s*glucose/i,/glucose[\s,]*fasting/i,/\bglucose\b/i],
    exclude:[/urine/i,/tolerance/i,/2[\s\-]*h(?:our|r)/i,/post[\s\-]*prandial/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':18.02,'mmol/L':18.02}},
  // ── Cardiometabolic ────────────────────────────────────────────────────
  apoB:{names:[/apolipo[\s\-]*protein\s*b(?:[\s\-]*100)?/i,/\bapo[\s\-]*b(?:100)?\b/i],
    units:{'mg/dl':1,'mg/dL':1,'g/l':100,'g/L':100}},
  lpA:{names:[/lipoprotein[\s\-]*\(?\s*a\s*\)?/i,/\blp\s*\(?\s*a\s*\)?\b/i],
    units:{'nmol/l':1,'nmol/L':1,'mg/dl':2.5,'mg/dL':2.5}},
  fastingInsulin:{names:[/fasting\s*insulin/i,/insulin[\s,]*fasting/i,/\binsulin\b/i],
    exclude:[/urine/i,/c[\s\-]*peptide/i,/glucose/i,/igf/i,/like\s*growth/i],
    units:{'uiu/ml':1,'µiu/ml':1,'miu/l':1,'mU/L':1,'pmol/l':0.144,'pmol/L':0.144}},
  homaIR:{names:[/\bhoma[\s\-]*ir\b/i,/homeostatic\s*model.*?insulin/i,/insulin\s*resistance\s*index/i],
    units:{'':1,'index':1}},
  // ── Liver enzymes ──────────────────────────────────────────────────────
  alt:{names:[/\balt\b/i,/alanine\s*amino[\s\-]*transferase/i,/\bsgpt\b/i,/serum\s*glutamic[\s\-]*pyruvic/i],
    exclude:[/\bsalt\b/i,/altitude/i,/\balternati/i],
    units:{'u/l':1,'U/L':1,'iu/l':1,'IU/L':1,'units/l':1}},
  ast:{names:[/\bast\b/i,/aspartate\s*amino[\s\-]*transferase/i,/\bsgot\b/i,/serum\s*glutamic[\s\-]*oxaloacetic/i],
    exclude:[/\bfast\b/i,/asthma/i,/\bastra/i,/\bpast\b/i],
    units:{'u/l':1,'U/L':1,'iu/l':1,'IU/L':1,'units/l':1}},
  ggt:{names:[/\bggt\b/i,/gamma[\s\-]*glutamyl[\s\-]*transferase/i,/gamma[\s\-]*gt/i,/\bggtp\b/i],
    units:{'u/l':1,'U/L':1,'iu/l':1,'IU/L':1,'units/l':1}},
  // ── Kidney ─────────────────────────────────────────────────────────────
  eGFR:{names:[/\begfr\b/i,/estimated\s*gfr/i,/glomerular\s*filtration/i,/e[\s\-]*gfr/i],
    units:{'ml/min/1.73m2':1,'mL/min/1.73m²':1,'ml/min':1,'mL/min':1}},
  // ── Thyroid panel (beyond TSH) ─────────────────────────────────────────
  freeT3:{names:[/free\s*t[\s\-]*3/i,/\bft3\b/i,/triiodothyronine[\s,]*free/i,/free[\s,]*triiodothyronine/i],
    exclude:[/total/i,/reverse/i,/\brt3\b/i],
    units:{'pg/ml':1,'pg/mL':1,'pmol/l':0.651,'pmol/L':0.651}},
  freeT4:{names:[/free\s*t[\s\-]*4/i,/\bft4\b/i,/thyroxine[\s,]*free/i,/free[\s,]*thyroxine/i],
    exclude:[/total/i],
    units:{'ng/dl':1,'ng/dL':1,'pmol/l':0.0777,'pmol/L':0.0777}},
  // ── Hormonal ───────────────────────────────────────────────────────────
  dheaS:{names:[/\bdhea[\s\-]*s\b/i,/dhea[\s\-]*sulfate/i,/dehydroepiandrosterone[\s\-]*sulfate/i,/dehydroepiandrosterone\s*s/i],
    units:{'ug/dl':1,'mcg/dl':1,'µg/dl':1,'umol/l':36.84,'µmol/l':36.84}},
  shbg:{names:[/\bshbg\b/i,/sex[\s\-]*hormone[\s\-]*binding\s*globulin/i],
    units:{'nmol/l':1,'nmol/L':1}},
  // ── Methylation / Cardio risk ──────────────────────────────────────────
  homocysteine:{names:[/homocyste(?:ine)?/i,/\bhcy\b/i],
    units:{'umol/l':1,'µmol/l':1,'mg/l':7.397,'mg/L':7.397}},
  // ── Other ──────────────────────────────────────────────────────────────
  uricAcid:{names:[/uric\s*acid/i,/\burate\b/i],
    units:{'mg/dl':1,'mg/dL':1,'umol/l':0.0168,'µmol/l':0.0168}},
  selenium:{names:[/\bselenium\b/i,/\bse\s*serum\b/i],
    exclude:[/\bsemen\b/i,/\bsensitiv/i],
    units:{'ug/l':1,'µg/l':1,'mcg/l':1,'umol/l':78.96,'µmol/l':78.96,'ng/ml':1,'ng/mL':1}},
  nonHdl:{names:[/non[\s\-]*hdl[\s\-]*(?:cholesterol|chol|c|ceolester[oa]l|cho?les?ter[oa]l)?/i,/non[\s\-]*hd1[\s\-]*(?:cholesterol|chol|c)?/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':38.67,'mmol/L':38.67}},
  vitA:{names:[/vitamin\s*a\b/i,/\bretinol\b/i],
    exclude:[/vitamin\s*a\s*(?:and|&|\+)/i,/vitamin\s*a[a-z]/i],
    units:{'umol/l':1,'µmol/l':1,'ug/dl':0.0349,'mcg/dl':0.0349,'µg/dl':0.0349,'iu/dl':0.00105,'iu/l':0.0000105}}
};

// Order matters: specific patterns first so "HDL CHOLESTEROL" doesn't get
// claimed by totalChol. Total cholesterol is deliberately placed after lipids.
const BW_PARSE_ORDER=['apoB','lpA','homaIR','homocysteine','dheaS','shbg','freeT3','freeT4','eGFR','nonHdl','hdl','ldl','triglycerides','freeTesto','testosterone','folateRbc','folate','magRbc','totalChol','vitD','vitA','b12','ferritin','tsh','crp','omega3','selenium','zinc','hba1c','fastingInsulin','fastingGlucose','alt','ast','ggt','uricAcid'];

// Update the upload zone's text to show progress. msg=null resets to default.
function setBwUploadStatus(msg){
  const up=document.getElementById('bw-upload');
  if(!up)return;
  const primary=up.querySelector('[data-bw-primary]');
  const secondary=up.querySelector('[data-bw-secondary]');
  if(msg){
    up.style.pointerEvents='none';up.style.opacity='0.75';
    if(primary)primary.textContent='Reading your lab report...';
    if(secondary)secondary.textContent=msg;
  }else{
    up.style.pointerEvents='';up.style.opacity='';
    if(primary)primary.textContent='Drop lab report PDF here';
    if(secondary)secondary.textContent='or click to choose file';
  }
}

// Pull text from a text-layer PDF via pdf.js. Groups items by y-coordinate so
// same-row items stay on the same logical line (preserves the results column
// vs. reference-range column ordering).
async function extractPdfTextLayer(file){
  if(typeof pdfjsLib==='undefined')throw new Error('pdf.js not loaded');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const buf=await file.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  const lines=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const tc=await page.getTextContent();
    const byY=new Map();
    for(const it of tc.items){
      if(!it.transform)continue;
      const y=Math.round(it.transform[5]);
      if(!byY.has(y))byY.set(y,[]);
      byY.get(y).push(it);
    }
    const ys=[...byY.keys()].sort((a,b)=>b-a); // pdf.js y-origin is bottom-left, so top first
    for(const y of ys){
      const items=byY.get(y).sort((a,b)=>a.transform[4]-b.transform[4]);
      lines.push(items.map(it=>it.str).join(' '));
    }
  }
  return lines.join('\n');
}

// Lazy-load Tesseract.js from CDN on first use so users who only type values
// manually don't pay the ~200KB library + 13MB traineddata download cost.
let _tesseractLoadPromise=null;
function loadTesseract(){
  if(window.Tesseract)return Promise.resolve(window.Tesseract);
  if(_tesseractLoadPromise)return _tesseractLoadPromise;
  _tesseractLoadPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js';
    s.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(new Error('Tesseract load failed'));
    s.onerror=()=>reject(new Error('Could not load OCR library'));
    document.head.appendChild(s);
  });
  return _tesseractLoadPromise;
}

// OCR fallback: render each PDF page to canvas via pdf.js, run Tesseract, concatenate.
async function extractPdfViaOcr(file,onProgress){
  if(typeof pdfjsLib==='undefined')throw new Error('pdf.js not loaded');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  onProgress&&onProgress('Loading OCR engine (first run only)...');
  const T=await loadTesseract();
  const buf=await file.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  const worker=await T.createWorker('eng');
  const parts=[];
  try{
    for(let i=1;i<=pdf.numPages;i++){
      onProgress&&onProgress('Scanning page '+i+' of '+pdf.numPages+'...');
      const page=await pdf.getPage(i);
      const viewport=page.getViewport({scale:2.0});
      const canvas=document.createElement('canvas');
      canvas.width=viewport.width;canvas.height=viewport.height;
      const ctx=canvas.getContext('2d');
      await page.render({canvasContext:ctx,viewport}).promise;
      const r=await worker.recognize(canvas);
      parts.push((r&&r.data&&r.data.text)||'');
    }
  }finally{
    try{await worker.terminate();}catch(_){}
  }
  return parts.join('\n');
}

// Count alphanumeric chars to decide if the text layer has real content.
function _alphaNumCount(s){let n=0;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if((c>=48&&c<=57)||(c>=65&&c<=90)||(c>=97&&c<=122))n++;}return n;}

// Find the first plausible numeric value after the biomarker-name match position.
// Returns {value, endIdx} or null. Skips numbers glued to letters (e.g. the "25"
// in "25-HYDROXY"), date fragments like "12/18", and year-like integers.
function _firstNumberAfter(line,afterIdx){
  const rx=/-?\d+(?:[.,]\d+)?/g;
  rx.lastIndex=afterIdx;
  let m;
  while((m=rx.exec(line))){
    const raw=m[0].replace(',','.');
    const v=parseFloat(raw);
    if(!isFinite(v))continue;
    const endIdx=m.index+m[0].length;
    const before=line[m.index-1]||'';
    const after=line[endIdx]||'';
    // Skip date fragments (d/d or d-d where both sides are digits)
    if(before==='/'||(before==='-'&&/\d/.test(line[m.index-2]||'')))continue;
    if(after==='/'||(after==='-'&&/\d/.test(line[endIdx+1]||'')))continue;
    // Skip numbers stuck to letters (part of a compound name like "25-HYDROXY" or "B12")
    if(/[A-Za-z]/.test(before))continue;
    if(/[A-Za-z]/.test(after))continue;
    if(before==='-'&&/[A-Za-z]/.test(line[m.index-2]||''))continue;
    if(after==='-'&&/[A-Za-z]/.test(line[endIdx+1]||''))continue;
    // Skip year-like integers (1900-2100)
    if(Number.isInteger(v)&&v>=1900&&v<=2100)continue;
    return {value:v,endIdx:endIdx};
  }
  return null;
}

// Find the unit on the line that is closest to the value's position.
// After-value positions beat before-value, and closer beats farther. This
// handles dual-unit lines like "48 ng/mL (120 nmol/L)" where we want ng/mL.
function _detectUnitFactor(line,unitsMap,valuePos){
  const norm=line.replace(/[µμ]/g,'u');
  const keys=Object.keys(unitsMap).sort((a,b)=>b.length-a.length);
  let bestFactor=null,bestScore=Infinity;
  for(const k of keys){
    const pat=k.replace(/[/.+*?^$()[\]{}|\\]/g,'\\$&');
    const m=norm.match(new RegExp('(?:^|[\\s(=,:])'+pat+'(?:$|[\\s).,;])','i'));
    if(!m)continue;
    const unitPos=m.index+(m[0].length-k.length);
    // after-value positions preferred; penalize before-value positions heavily
    const score=unitPos>=valuePos?unitPos-valuePos:(valuePos-unitPos)+10000;
    if(score<bestScore){bestScore=score;bestFactor=unitsMap[k];}
  }
  return bestFactor;
}

// Per-biomarker line parser. Returns {extracted, found, sources} where sources[key]
// records the original line, matched name span, raw value, and canonical value — used
// by the review modal so the user can verify each extraction against the source PDF text.
function parseBiomarkers(text){
  const lines=text.split(/\r?\n/).map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
  const claimed=new Set();
  const extracted={};
  const sources={};
  for(const key of BW_PARSE_ORDER){
    const def=BW_ALIASES[key];
    const bio=BIOMARKERS[key];
    if(!def||!bio)continue;
    for(let li=0;li<lines.length;li++){
      if(claimed.has(li))continue;
      const line=lines[li];
      if(def.exclude&&def.exclude.some(rx=>rx.test(line)))continue;
      let bestStart=-1,bestEnd=-1;
      for(const rx of def.names){
        const m=line.match(rx);
        if(!m)continue;
        const s=m.index,e=m.index+m[0].length;
        if(bestStart===-1||s<bestStart||(s===bestStart&&e>bestEnd)){bestStart=s;bestEnd=e;}
      }
      if(bestStart===-1)continue;
      const num=_firstNumberAfter(line,bestEnd);
      if(num==null)continue;
      const factor=_detectUnitFactor(line,def.units,num.endIdx);
      const canonical=factor!=null?num.value*factor:num.value;
      const ceiling=bio.high*5;
      if(!isFinite(canonical)||canonical<0||canonical>ceiling)continue;
      const rounded=Math.round(canonical*100)/100;
      extracted[key]=rounded;
      sources[key]={
        line:line,
        matchStart:bestStart,
        matchEnd:bestEnd,
        rawValue:num.value,
        rawValueEnd:num.endIdx,
        unitFactor:factor,
        canonical:rounded,
        lineIndex:li
      };
      claimed.add(li);
      break;
    }
  }
  return {extracted,found:Object.keys(extracted).length,sources};
}

// Review modal between PDF parse and bloodWork[] commit. Shows each extracted value
// with the original line of text it came from (matched name span highlighted), an
// editable numeric input, and an accept/skip checkbox. "Confirm" commits accepted
// values; "Cancel" discards everything; "Skip review" commits all original values.
function _showBwReviewModal(opts){
  const {extracted,sources,fileName,onCommit,onCancel}=opts;
  const keys=Object.keys(extracted);
  // Build modal scaffold
  const overlay=document.createElement('div');
  overlay.className='bw-review-overlay';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Review extracted biomarker values');
  const modal=document.createElement('div');
  modal.className='bw-review-modal';
  // Header
  const fileHtml=fileName?`<div class="bw-review-file" title="${escAttr(fileName)}">${escHtml(fileName)}</div>`:'';
  modal.innerHTML=`<div class="bw-review-hdr">
    <div>
      <div class="bw-review-title">Review extracted values</div>
      <div class="bw-review-sub">Confirm or correct each value before it commits to your profile.</div>
      ${fileHtml}
    </div>
    <button type="button" class="bw-review-x" aria-label="Close review">\u00D7</button>
  </div>
  <div class="bw-review-body" id="bw-review-body"></div>
  <div class="bw-review-foot">
    <button type="button" class="bw-review-skip" id="bw-review-skip">Skip review &middot; commit all</button>
    <div style="flex:1"></div>
    <button type="button" class="bw-review-cancel" id="bw-review-cancel">Cancel</button>
    <button type="button" class="bw-review-confirm" id="bw-review-confirm">Confirm</button>
  </div>`;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow='hidden';
  // Build one row per extracted value
  const body=modal.querySelector('#bw-review-body');
  body.innerHTML=keys.map(k=>{
    const bio=BIOMARKERS[k];const src=sources[k];
    if(!bio||!src)return '';
    // Highlight the matched substring in the source line
    const before=escHtml(src.line.substring(0,src.matchStart));
    const match=escHtml(src.line.substring(src.matchStart,src.matchEnd));
    const after=escHtml(src.line.substring(src.matchEnd));
    const lineHtml=`${before}<mark>${match}</mark>${after}`;
    return `<div class="bw-review-row" data-key="${escAttr(k)}">
      <label class="bw-review-check">
        <input type="checkbox" class="bw-review-accept" data-key="${escAttr(k)}" checked>
        <span></span>
      </label>
      <div class="bw-review-info">
        <div class="bw-review-name">${escHtml(bio.name)}</div>
        <div class="bw-review-source">From PDF: <span class="bw-review-line">${lineHtml}</span></div>
      </div>
      <div class="bw-review-val">
        <input type="number" step="0.01" inputmode="decimal" class="bw-review-input" data-key="${escAttr(k)}" value="${src.canonical}">
        <span class="bw-review-unit">${escHtml(bio.unit||'')}</span>
      </div>
    </div>`;
  }).join('');
  // Wire interactions — toggling the accept checkbox dims/restores the row
  body.querySelectorAll('.bw-review-accept').forEach(chk=>{
    chk.addEventListener('change',()=>{
      const row=chk.closest('.bw-review-row');
      if(row)row.classList.toggle('bw-review-row-skipped',!chk.checked);
    });
  });
  // Close handlers
  const _close=()=>{
    document.body.style.overflow='';
    if(overlay.parentNode)overlay.parentNode.removeChild(overlay);
  };
  modal.querySelector('.bw-review-x').addEventListener('click',()=>{_close();onCancel&&onCancel();});
  modal.querySelector('#bw-review-cancel').addEventListener('click',()=>{_close();onCancel&&onCancel();});
  modal.querySelector('#bw-review-skip').addEventListener('click',()=>{
    _close();
    onCommit&&onCommit(Object.assign({},extracted));
  });
  modal.querySelector('#bw-review-confirm').addEventListener('click',()=>{
    const accepted={};
    body.querySelectorAll('.bw-review-row').forEach(row=>{
      const key=row.getAttribute('data-key');
      const chk=row.querySelector('.bw-review-accept');
      if(!chk||!chk.checked)return;
      const inp=row.querySelector('.bw-review-input');
      const val=parseFloat(inp&&inp.value);
      if(isFinite(val))accepted[key]=val;
    });
    _close();
    onCommit&&onCommit(accepted);
  });
  // Escape closes (treats as cancel)
  const _esc=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',_esc);_close();onCancel&&onCancel();}};
  document.addEventListener('keydown',_esc);
}

async function handleBwUpload(file){
  if(!file)return;
  const uploadEl=document.getElementById('bw-upload');
  const uploadedEl=document.getElementById('bw-uploaded');
  if(!uploadEl||!uploadedEl)return;
  try{
    if(typeof pdfjsLib==='undefined'){alert('PDF.js not loaded. Please enter values manually.');return;}
    setBwUploadStatus('Reading PDF text...');
    let text='';
    try{text=await extractPdfTextLayer(file);}catch(e){console.warn('text-layer extract failed',e);}
    // If the text layer is empty/sparse (scanned/faxed PDF), fall back to OCR.
    if(_alphaNumCount(text)<80){
      setBwUploadStatus('No text layer found. Preparing OCR...');
      try{
        text=await extractPdfViaOcr(file,setBwUploadStatus);
      }catch(e){
        console.warn('OCR failed',e);
        setBwUploadStatus(null);
        alert('Could not read this PDF (OCR failed to load). Please enter values manually.');
        return;
      }
    }
    const {extracted,found,sources}=parseBiomarkers(text);
    setBwUploadStatus(null);
    if(!found){
      // Nothing recognized — let the user fall back to manual entry without a modal.
      uploadEl.style.display='none';
      uploadedEl.style.display='flex';
      const _fn=document.getElementById('bw-file-name');if(_fn)_fn.textContent=file.name;
      const _ec=document.getElementById('bw-extracted-count');if(_ec)_ec.textContent='0 biomarkers extracted';
      const _bm=document.getElementById('bw-manual');if(_bm)_bm.style.display='block';
      const _bmt=document.getElementById('bw-manual-toggle');if(_bmt)_bmt.innerHTML='Hide manual entry &#9652;';
      setTimeout(()=>{alert('We could not identify any recognized biomarkers in this report. Please enter values manually below.');},50);
      return;
    }
    // Show the review modal — the user can accept, edit, or skip each extracted value
    // before anything is committed to bloodWork[]. Prevents OCR blips from silently
    // driving recommendations.
    _showBwReviewModal({extracted,sources,fileName:file.name,
      onCommit:(accepted)=>{
        const acceptedCount=Object.keys(accepted).length;
        for(const[k,v]of Object.entries(accepted)){
          bloodWork[k]=v;
          const input=document.getElementById('bw-'+k);
          if(input){input.value=v;updateBwRow(k,String(v));}
        }
        uploadEl.style.display='none';
        uploadedEl.style.display='flex';
        const _fn=document.getElementById('bw-file-name');if(_fn)_fn.textContent=file.name;
        const _ec=document.getElementById('bw-extracted-count');if(_ec)_ec.textContent=acceptedCount+' biomarker'+(acceptedCount!==1?'s':'')+' extracted';
        const _bm=document.getElementById('bw-manual');if(_bm)_bm.style.display='block';
        const _bmt=document.getElementById('bw-manual-toggle');if(_bmt)_bmt.innerHTML='Hide manual entry &#9652;';
        updateBwCount();
        if(typeof updatePfCounts==='function')updatePfCounts();
      },
      onCancel:()=>{
        // User backed out — leave upload zone untouched and the manual grid empty.
      }
    });
  }catch(e){
    console.warn('PDF parse error:',e);
    setBwUploadStatus(null);
    alert('Could not parse this PDF. Please enter values manually.');
  }
}

function clearBwUpload(){
  const up=document.getElementById('bw-upload');if(up)up.style.display='flex';
  const ud=document.getElementById('bw-uploaded');if(ud)ud.style.display='none';
  const fi=document.getElementById('bw-file');if(fi)fi.value='';
  // Clear extracted values so re-uploading starts fresh
  bloodWork={};
  for(const key of Object.keys(BIOMARKERS)){
    const input=document.getElementById('bw-'+key);
    if(input){input.value='';updateBwRow(key,'');}
  }
  updateBwCount();
  if(typeof updatePfCounts==='function')updatePfCounts();
}

function analyzeBloodWork(){
  const results=[];
  for(const[key,val]of Object.entries(bloodWork)){
    const bio=BIOMARKERS[key];
    if(!bio)continue;
    let status,statusLabel,color;
    if(bio.highOnly){
      if(val<=bio.optHigh){status='optimal';statusLabel='Optimal';color='t1';}
      else if(val<=bio.high){status='high';statusLabel='Elevated';color='t3';}
      else{status='critical';statusLabel='High';color='t4';}
    }else if(bio.higherBetter){
      if(val<bio.low){status='critical';statusLabel='Low';color='t4';}
      else if(val<bio.optLow){status='low';statusLabel='Below optimal';color='t3';}
      else if(val<=bio.high){status='optimal';statusLabel='Optimal';color='t1';}
      else{status='high';statusLabel='Very high';color='t2';}
    }else{
      if(val<bio.low){status='critical';statusLabel='Deficient';color='t4';}
      else if(val<bio.optLow){status='low';statusLabel='Below optimal';color='t3';}
      else if(val<=bio.optHigh){status='optimal';statusLabel='Optimal';color='t1';}
      else if(val<=bio.high){status='high';statusLabel='Elevated';color='t2';}
      else{status='critical';statusLabel='High';color='t4';}
    }
    results.push({key,val,bio,status,statusLabel,color,needsAction:status!=='optimal'});
  }
  const order={critical:0,low:1,high:2,optimal:3};
  results.sort((a,b)=>order[a.status]-order[b.status]);
  return results;
}

function renderBwResults(results){
  const hdr=document.getElementById('bw-results-header');
  const strip=document.getElementById('bw-summary-strip');
  const cards=document.getElementById('bw-deficiency-cards');
  if(!hdr||!strip||!cards)return;

  const needsAtt=results.filter(r=>r.needsAction).length;
  const total=results.length;

  hdr.innerHTML=`<div class="bw-score-badge"><div style="font-size:18px;font-weight:700;color:#fff;line-height:1">${needsAtt}</div><div style="font-size:7px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.05em;margin-top:2px">of ${total}</div></div><div style="flex:1"><div style="font-size:14px;font-weight:700">Blood Work Analysis</div><div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px">${needsAtt?needsAtt+' biomarker'+(needsAtt!==1?'s':'')+' need attention':'All biomarkers in optimal range'}</div></div>`;

  const counts={critical:0,low:0,optimal:0,high:0};
  results.forEach(r=>counts[r.status]=(counts[r.status]||0)+1);

  strip.innerHTML=[
    {n:counts.critical,l:'Critical',c:'var(--t4c)'},
    {n:counts.low,l:'Below optimal',c:'var(--t3c)'},
    {n:counts.optimal,l:'Optimal',c:'var(--t1c)'},
    {n:counts.high,l:'Elevated',c:'var(--t2c)'}
  ].map(s=>`<div class="bw-summary-item"><div style="font-size:18px;font-weight:700;color:${s.c};line-height:1">${s.n}</div><div style="font-size:8px;color:var(--color-text-tertiary);margin-top:3px;text-transform:uppercase;letter-spacing:.04em">${s.l}</div></div>`).join('');

  const colorMap={t1:'var(--t1c)',t2:'var(--t2c)',t3:'var(--t3c)',t4:'var(--t4c)'};
  const bgMap={t1:'var(--t1bg)',t2:'var(--t2bg)',t3:'var(--t3bg)',t4:'var(--t4bg)'};
  const txMap={t1:'var(--t1tx)',t2:'var(--t2tx)',t3:'var(--t3tx)',t4:'var(--t4tx)'};
  const statusClass={critical:'bw-critical',low:'bw-low',optimal:'bw-optimal',high:'bw-high'};

  // Mockup-1 compact list — one row per biomarker, click to expand for description + supps.
  // Optimal markers collapse into a single summary row at the bottom (kept tappable so
  // they can still be expanded into a small list).
  const _scGrad=(sc)=>sc>=72?'linear-gradient(180deg,var(--t1c),#0F766E)':sc>=60?'linear-gradient(180deg,var(--t2c),#3B5FC0)':sc>=40?'linear-gradient(180deg,var(--t3c),#A16207)':'linear-gradient(180deg,var(--t4c),#991B1B)';
  const _markPct=(r)=>{
    if(r.bio.highOnly)return Math.max(2,Math.min(98,(r.val/r.bio.high)*100));
    const range=r.bio.high-(r.bio.low||0);
    const base=r.bio.low||0;
    return Math.max(2,Math.min(98,((r.val-base)/range)*100));
  };
  const _statusClass=(s)=>s==='critical'?'bw-list-crit':s==='high'?'bw-list-elev':s==='low'?'bw-list-low':'bw-list-opt';
  const _rangeBar=(r)=>{
    const pct=_markPct(r);
    const fillClass=r.bio.highOnly?'bw-list-fill bw-list-fill-highonly':'bw-list-fill';
    const labels=r.bio.highOnly
      ?`<span>0</span><span>Optimal &lt; ${r.bio.optHigh}</span><span>${r.bio.high}</span>`
      :`<span>${r.bio.low||0}</span><span>${r.bio.optLow}-${r.bio.optHigh} Optimal</span><span>${r.bio.high}</span>`;
    return `<div class="bw-list-bar"><div class="${fillClass}"></div><div class="bw-list-mark" style="left:${pct}%;background:${colorMap[r.color]}"></div></div><div class="bw-list-labels">${labels}</div>`;
  };
  const _suppChips=(r)=>{
    if(!r.needsAction||!r.bio.supps||!r.bio.supps.length)return '';
    let chips='';
    r.bio.supps.forEach(sr=>{
      const sup=_suppByName.get(sr.name);
      const sc=sup?calcScore(sup):0;
      chips+=`<div class="bw-supp-rec"><div class="bw-supp-rec-sc" style="background:${_scGrad(sc)}">${sc}</div><div class="bw-supp-rec-body"><div class="bw-supp-rec-name">${escHtml(sr.name)} \u2014 ${escHtml(sr.dose)}</div><div class="bw-supp-rec-note">${escHtml(sr.note||'')}</div></div></div>`;
    });
    return chips;
  };

  // Split into attention-needing + optimal
  const attention=results.filter(r=>r.needsAction);
  const optimal=results.filter(r=>!r.needsAction);

  let html='';
  attention.forEach((r,i)=>{
    const id=`bw-row-${escAttr(r.key)}-${i}`;
    const miniPct=_markPct(r);
    html+=`<div class="bw-list-row ${_statusClass(r.status)}" data-bw-row="${id}" onclick="_toggleBwRow(this)">
      <span class="bw-list-dot"></span>
      <div class="bw-list-name">${escHtml(r.bio.name)} <span class="bw-list-pill" style="background:${bgMap[r.color]};color:${txMap[r.color]}">${escHtml(r.statusLabel)}</span></div>
      <div class="bw-list-mini"><div class="bw-list-mini-fill"></div><div class="bw-list-mini-mark" style="left:${miniPct}%;background:${colorMap[r.color]}"></div></div>
      <div class="bw-list-val" style="color:${colorMap[r.color]}">${r.val}<span class="bw-list-unit">${escHtml(r.bio.unit||'')}</span></div>
    </div>
    <div class="bw-list-detail" data-bw-detail="${id}">
      <div class="bw-list-desc">${escHtml(r.bio.desc||'')}</div>
      ${_rangeBar(r)}
      ${_suppChips(r)?'<div class="bw-list-supps">'+_suppChips(r)+'</div>':''}
    </div>`;
  });
  if(optimal.length){
    const id='bw-row-optimal-summary';
    const names=optimal.map(o=>escHtml(o.bio.name)).join(' · ');
    html+=`<div class="bw-list-row bw-list-opt bw-list-summary" data-bw-row="${id}" onclick="_toggleBwRow(this)">
      <span class="bw-list-dot"></span>
      <div class="bw-list-name" style="font-weight:500;color:var(--color-text-secondary)">${escHtml(optimal.length+' optimal')} <span class="bw-list-pill bw-list-pill-opt">In range</span></div>
      <div class="bw-list-mini"><div class="bw-list-mini-fill"></div><div class="bw-list-mini-mark" style="left:50%;background:var(--t1c)"></div></div>
      <div class="bw-list-val" style="color:var(--t1c);font-size:11px">${optimal.length} markers</div>
    </div>
    <div class="bw-list-detail" data-bw-detail="${id}">
      <div class="bw-list-optimal-list">`+
        optimal.map(o=>`<div class="bw-list-optimal-item"><span>${escHtml(o.bio.name)}</span><span class="bw-list-optimal-val">${o.val} <span class="bw-list-optimal-unit">${escHtml(o.bio.unit||'')}</span></span></div>`).join('')
      +`</div>
    </div>`;
  }

  cards.innerHTML=html;
}

// Toggle the inline detail beneath a clicked biomarker row.
function _toggleBwRow(rowEl){
  if(!rowEl)return;
  const id=rowEl.getAttribute('data-bw-row');
  if(!id)return;
  const detail=document.querySelector('[data-bw-detail="'+id+'"]');
  if(!detail)return;
  const expanded=rowEl.classList.toggle('bw-list-open');
  detail.classList.toggle('bw-list-detail-open',expanded);
}

const LOAD_STEPS=[
  {at:0,text:'Analyzing your profile…',sub:'Matching against 733 supplements'},
  {at:20,text:'Checking medication interactions…',sub:'Cross-referencing drug-supplement data'},
  {at:45,text:'Evaluating clinical evidence…',sub:'Reviewing RCTs and meta-analyses'},
  {at:70,text:'Ranking by efficacy and safety…',sub:'Building your personalised list'},
  {at:90,text:'Finalising recommendations…',sub:'Almost ready'}
];
let _genRecsRaf=null;
function genRecs(){
  if(!sex){const serr=document.getElementById('serr');if(serr)serr.style.display='block';return;}
  // Show loading
  const btn=document.querySelector('.go-btn');if(btn)btn.disabled=true;
  const vin=document.getElementById('v-input');if(vin)vin.style.display='none';
  const lo=document.getElementById('v-loading');if(lo)lo.classList.add('vis');
  const bar=document.getElementById('load-bar');
  const lt=document.getElementById('load-text'),ls=document.getElementById('load-sub');
  if(bar)bar.style.width='0%';
  const total=5000;
  const start=performance.now();
  // Cancel any in-flight loader before starting a new one
  if(_genRecsRaf){cancelAnimationFrame(_genRecsRaf);_genRecsRaf=null;}
  function step(now){
    // Bail if the loader UI was torn down (modal closed / view swapped)
    if(!bar||!lo||!lo.classList.contains('vis')){_genRecsRaf=null;return;}
    const elapsed=now-start;
    const pct=Math.min((elapsed/total)*100,100);
    bar.style.width=pct+'%';
    for(let i=LOAD_STEPS.length-1;i>=0;i--){if(pct>=LOAD_STEPS[i].at){if(lt)lt.textContent=LOAD_STEPS[i].text;if(ls)ls.textContent=LOAD_STEPS[i].sub;break;}}
    if(elapsed>=total){_genRecsRaf=null;lo.classList.remove('vis');if(btn)btn.disabled=false;_showRecs();return;}
    _genRecsRaf=requestAnimationFrame(step);
  }
  _genRecsRaf=requestAnimationFrame(step);
}
function _showRecs(){
  const age=parseInt(document.getElementById('asl').value);
  const mi=getMedInteractions();
  let recs=getRecs(age,sex).filter(r=>!mi.avoid.has(r.n)&&!hiddenSupps.has(r.n));
  applyMedExtras(recs,mi);
  // Add condition-based and goal-based supplements
  const condSupps=getCondSupps();
  const goalSupps=getGoalSupps();
  goalSupps.forEach(n=>{if(!mi.avoid.has(n)&&!hiddenSupps.has(n)&&!recs.find(r=>r.n===n)){const s=_suppByName.get(n);if(s){const matchedGoals=[...selectedGoals].filter(k=>GOALS[k]&&GOALS[k].supps.includes(n)).map(k=>GOALS[k].label);const goalStr=matchedGoals.length?matchedGoals.join(' & '):'your selected goals';recs.push({n:s.n,p:'consider',tier:s.t,tf:false,e:s.e,s:s.s,why:`Matches your "${goalStr}" goal.`,dose:s.dose,_goalExtra:true});}}});
  condSupps.forEach(n=>{if(!mi.avoid.has(n)&&!hiddenSupps.has(n)&&!recs.find(r=>r.n===n)){const s=_suppByName.get(n);if(s){const matchedConds=[...selectedConds].filter(k=>CONDITIONS[k]&&CONDITIONS[k].supps.includes(n)).map(k=>CONDITIONS[k].label);const condStr=matchedConds.length?matchedConds.join(' & '):'your selected conditions';recs.push({n:s.n,p:'consider',tier:s.t,tf:false,e:s.e,s:s.s,why:`Recommended for ${condStr}.`,dose:s.dose,_condExtra:true});}}});

  // Blood work integration — boost supplements matching deficiencies, and credit each
  // recommendation back to the specific biomarker(s) that triggered it.
  // Direction-aware: each biomarker's supps move the marker in one direction (raise or
  // lower). We only push raisers when the value is BELOW optimal, and lowerers when the
  // value is ABOVE optimal — so an elevated B12 doesn't pull in more methylcobalamin and
  // a high-normal testosterone doesn't pull in more D3/Zinc/Ashwagandha.
  const bwResults=Object.keys(bloodWork).length>0?analyzeBloodWork():[];
  if(bwResults.length>0){
    const _bwCause=(r,sr)=>{
      const bm=r.bio.name||r.key;
      const v=r.val;
      const u=r.bio.unit||'';
      const status=r.statusLabel||r.status;
      const tail=sr&&sr.note?' '+sr.note+'.':'';
      return `${bm} = ${v} ${u} (${status}).${tail}`.replace(/\s+/g,' ').trim();
    };
    // Direction defaults: highOnly markers (CRP, HbA1c, ApoB, LDL, TG, etc.) → 'lower';
    // higherBetter markers (HDL, eGFR) → 'raise'; everything else → 'raise' (deficiency
    // pattern). Explicit `direction` on the biomarker overrides this default.
    const _bwDirection=(bio)=>{
      if(bio.direction)return bio.direction;
      if(bio.highOnly)return 'lower';
      if(bio.higherBetter)return 'raise';
      return 'raise';
    };
    bwResults.forEach(r=>{
      if(!r.needsAction)return;
      const dir=_bwDirection(r.bio);
      const optLow=r.bio.optLow!=null?r.bio.optLow:0;
      const optHigh=r.bio.optHigh!=null?r.bio.optHigh:Infinity;
      // Raisers only fire when the value is BELOW the optimal floor.
      // Lowerers only fire when the value is ABOVE the optimal ceiling.
      // Elevated raisers / deficient lowerers are silently skipped (still surfaced on
      // the deficiency card so the user sees them, just no supplement is pushed).
      if(dir==='raise' && r.val>=optLow)return;
      if(dir==='lower' && r.val<=optHigh)return;
      r.bio.supps.forEach(sr=>{
        const existing=recs.find(x=>x.n===sr.name);
        if(!existing&&!mi.avoid.has(sr.name)&&!hiddenSupps.has(sr.name)){
          const s=_suppByName.get(sr.name);
          if(s){
            const why='Triggered by '+_bwCause(r,sr);
            recs.push({n:s.n,p:r.status==='critical'?'essential':'recommended',tier:s.t,tf:false,e:s.e,s:s.s,why,dose:s.dose,_bwExtra:true,_bwTriggers:[{key:r.key,name:r.bio.name,val:r.val,unit:r.bio.unit,status:r.statusLabel}]});
          }
        }else if(existing){
          if(existing.p==='consider')existing.p='recommended';
          if(r.status==='critical'&&existing.p==='recommended')existing.p='essential';
          // Build/extend the trigger list and the why-line so multiple biomarkers driving
          // the same supplement are all surfaced (e.g. low B12 + high homocysteine both
          // recommending Vitamin B12).
          existing._bwTriggers=existing._bwTriggers||[];
          if(!existing._bwTriggers.some(t=>t.key===r.key)){
            existing._bwTriggers.push({key:r.key,name:r.bio.name,val:r.val,unit:r.bio.unit,status:r.statusLabel});
          }
          const cause=_bwCause(r,sr);
          if(!existing._bwExtra){
            // First bw evidence: append to whatever non-bw why already existed.
            existing.why=(existing.why||'').trim();
            existing.why=(existing.why?existing.why+' Also supported by '+cause:'Triggered by '+cause);
          }else{
            // Subsequent bw evidence: append the new biomarker.
            existing.why=(existing.why||'')+' Also supported by '+cause;
          }
          existing._bwExtra=true;
        }
      });
    });
    // Final-pass bw suppression — strip any rec whose supplement would push a marker
    // that's already out of range further OUT. Catches cross-path conflicts: e.g.
    // metformin (in selectedMeds) auto-adds Vitamin B12 to recs.extra, but the user's
    // actual B12 = 1006 pg/mL is already above the optimal ceiling. No matter which
    // path added it, a raiser-on-already-high (or lowerer-on-already-low) is wrong.
    const _suppressNames=new Set();
    bwResults.forEach(r=>{
      if(!r.bio||!r.bio.supps)return;
      const dir=_bwDirection(r.bio);
      const optLow=r.bio.optLow!=null?r.bio.optLow:0;
      const optHigh=r.bio.optHigh!=null?r.bio.optHigh:Infinity;
      // Raisers must not be recommended when the marker is at or above the optimal ceiling.
      if(dir==='raise' && r.val>optHigh){
        r.bio.supps.forEach(sr=>_suppressNames.add(sr.name));
      }
      // Lowerers must not be recommended when the marker is at or below the optimal floor.
      if(dir==='lower' && r.val<optLow){
        r.bio.supps.forEach(sr=>_suppressNames.add(sr.name));
      }
    });
    if(_suppressNames.size){
      const before=recs.length;
      recs=recs.filter(rec=>{
        if(!_suppressNames.has(rec.n))return true;
        // Annotate so the deficiency card UI can explain the absence if needed.
        return false;
      });
      if(recs.length!==before){

      }
    }
    renderBwResults(bwResults);
    const bwResEl=document.getElementById('bw-results');if(bwResEl)bwResEl.style.display='block';
  }else{
    const bwResEl=document.getElementById('bw-results');if(bwResEl)bwResEl.style.display='none';
  }

  const sexLabel=sex==='fp'?'pregnant woman':sex==='m'?'man':'woman';
  const resHd=document.getElementById('res-hd');if(resHd)resHd.textContent='Your recommendations';
  const resSh=document.getElementById('res-sh');if(resSh)resSh.textContent=`${age}-year-old ${sexLabel} \u00B7 Last updated today`;

  // Banner chips
  const essCount=recs.filter(x=>x.p==='essential').length;
  const recCount=recs.filter(x=>x.p==='recommended').length;
  const conCount=recs.filter(x=>x.p==='consider').length;
  const resChips=document.getElementById('res-chips');
  if(resChips)resChips.innerHTML=[
    {n:essCount,l:'Essential',c:'#16A34A'},{n:recCount,l:'Recommended',c:'#2563EB'},{n:conCount,l:'Consider',c:'#D97706'}
  ].map(s=>`<div class="res-chip"><div class="rc-dot" style="background:${s.c}"></div><span class="rc-num">${s.n}</span> ${s.l}</div>`).join('');

  renderMedAlerts(mi);
  renderSuppStackAlerts(recs);

  // Store recs globally for plan modal access
  _lastRecs=recs;
  _lastMi=mi;
  _lastBwResults=bwResults;

  // Render selectable supplement cards — fresh plan, so restart selection defaults
  _selInitialized=false;
  renderSuppCards(recs,mi,bwResults);

  const _vInput=document.getElementById('v-input');if(_vInput)_vInput.style.display='none';
  const _vRes=document.getElementById('v-res');if(_vRes)_vRes.style.display='block';
  saveProfile();
  // Pre-fill email field if provided (user must click Send manually)
  const profEmail=document.getElementById('prof-email')?.value?.trim();
  if(profEmail&&profEmail.includes('@')){
    const _re=document.getElementById('report-email');if(_re)_re.value=profEmail;
    const _erb=document.getElementById('email-report-box');if(_erb)_erb.style.display='flex';
  }
}

/* ══ Selectable supplement cards ══ */
let selectedSupps=new Set();
let _selInitialized=false; // set false before the first render of a fresh plan; kept true on incremental re-renders
// Module-level state shared between _showRecs, openPlanModal, sendPlanEmail etc.
let _lastRecs=[],_lastMi={avoid:new Set(),caution:{},extra:[],notes:[]},_lastBwResults=[];

/* ══ User-added supplements (persisted to localStorage) ══ */
let userAddedSupps=[];
try{const _ua=lsGet('ss-user-added');if(_ua){const parsed=JSON.parse(_ua);if(Array.isArray(parsed))userAddedSupps=parsed.filter(n=>_suppByName.has(n));}}catch(e){userAddedSupps=[];}
function saveUserAdded(){lsSet('ss-user-added',JSON.stringify(userAddedSupps));}

/* ══ Hidden supplements — user dismissed via the card X button (persisted) ══
   These are items the user never wants to see again on their plan. Filtered out of
   the recs list at render time so they stop showing up even when the recommendation
   engine would otherwise surface them. Separate from the checkbox (which only toggles
   whether the item is included in the exported plan/PDF). */
let hiddenSupps=new Set();
try{const _hs=lsGet('ss-hidden-supps');if(_hs){const parsed=JSON.parse(_hs);if(Array.isArray(parsed))hiddenSupps=new Set(parsed);}}catch(e){hiddenSupps=new Set();}
function saveHiddenSupps(){lsSet('ss-hidden-supps',JSON.stringify([...hiddenSupps]));}
function hideSupp(name,ev){
  if(ev){ev.stopPropagation();ev.preventDefault();}
  if(!name)return;
  // If it was user-added, drop it from that list so it doesn't get re-surfaced as "added by you".
  userAddedSupps=userAddedSupps.filter(n=>n!==name);
  saveUserAdded();
  selectedSupps.delete(name);
  hiddenSupps.add(name);
  saveHiddenSupps();
  // Prune the hidden name from the cached recs list rather than re-running _showRecs().
  // Re-running _showRecs() would reset _selInitialized and wipe every user-made check/uncheck
  // choice on the other cards — the hide action must not disturb selection state anywhere else.
  _lastRecs=(_lastRecs||[]).filter(r=>r.n!==name);
  renderSuppCards(_lastRecs,_lastMi,_lastBwResults);
  updateSelCount();
}
function unhideAllSupps(){hiddenSupps=new Set();saveHiddenSupps();if(typeof _showRecs==='function')_showRecs();}

function filterSuppSearch(q){
  const dd=document.getElementById('add-supp-dropdown');
  if(!dd)return;
  q=(q||'').trim().toLowerCase();
  // Empty query (focus with no text) → show 8 highest-scoring supplements as "popular".
  if(!q){
    const popular=S.slice().sort((a,b)=>calcScore(b)-calcScore(a)).slice(0,8);
    const recNames=new Set((_lastRecs||[]).map(r=>r.n));
    const addedNames=new Set(userAddedSupps||[]);
    dd.innerHTML='<div class="ac-hdr">Popular supplements</div>'+popular.map((s,i)=>{
      const sc=calcScore(s);
      const scBg=sc>=72?'#0D9488':sc>=60?'#4B7BE5':sc>=40?'#CA8A04':'#B91C1C';
      const tierLabel=s.t==='t1'?'Tier 1':s.t==='t2'?'Tier 2':s.t==='t3'?'Tier 3':'Tier 4';
      const already=recNames.has(s.n)||addedNames.has(s.n);
      const catHtml=s.tag?'<span style="color:#888">'+escHtml(s.tag)+'</span>':'';
      return`<div class="ac-row${i===0?' on':''}" data-supp="${escAttr(s.n)}" onmousedown="event.preventDefault();addSuppFromSearch(this.getAttribute('data-supp'))"><div class="ac-score" style="background:${scBg}">${sc}</div><div class="ac-info"><div class="ac-name">${escHtml(s.n)}</div><div class="ac-meta"><span class="ac-tag eff">Efficacy ${s.e}/5</span><span class="ac-tag safe">Safety ${s.s}/5</span><span class="ac-tag tier">${tierLabel}</span>${catHtml}</div></div>${already?'<span class="ac-tag already">Already on list</span>':''}</div>`;
    }).join('');
    dd.style.display='block';
    return;
  }
  // Fuzzy-ish match on name or tag (category). Prefer name matches first.
  const scored=[];
  for(const s of S){
    const nm=s.n.toLowerCase();
    const tg=(s.tag||'').toLowerCase();
    const nmIdx=nm.indexOf(q);
    const tgIdx=tg.indexOf(q);
    if(nmIdx>=0)scored.push({s,rank:nmIdx===0?0:1+nmIdx});
    else if(tgIdx>=0)scored.push({s,rank:100+tgIdx});
  }
  scored.sort((a,b)=>a.rank-b.rank);
  const matches=scored.slice(0,8).map(x=>x.s);
  if(!matches.length){dd.innerHTML='<div class="ac-empty">No supplements match \u201C'+escHtml(q)+'\u201D</div>';dd.style.display='block';return;}
  const recNames=new Set(_lastRecs.map(r=>r.n));
  const addedNames=new Set(userAddedSupps);
  dd.innerHTML=header+matches.map((s,i)=>{
    const sc=calcScore(s);
    const scBg=sc>=72?'#0D9488':sc>=60?'#4B7BE5':sc>=40?'#CA8A04':'#B91C1C';
    const tierLabel=s.t==='t1'?'Tier 1':s.t==='t2'?'Tier 2':s.t==='t3'?'Tier 3':'Tier 4';
    const already=recNames.has(s.n)||addedNames.has(s.n);
    const catHtml=s.tag?'<span style="color:#888">'+escHtml(s.tag)+'</span>':'';
    return`<div class="ac-row${i===0?' on':''}" data-supp="${escAttr(s.n)}" onmousedown="event.preventDefault();addSuppFromSearch(this.getAttribute('data-supp'))"><div class="ac-score" style="background:${scBg}">${sc}</div><div class="ac-info"><div class="ac-name">${escHtml(s.n)}</div><div class="ac-meta"><span class="ac-tag eff">Efficacy ${s.e}/5</span><span class="ac-tag safe">Safety ${s.s}/5</span><span class="ac-tag tier">${tierLabel}</span>${catHtml}</div></div>${already?'<span class="ac-tag already">Already on list</span>':''}</div>`;
  }).join('');
  dd.style.display='block';
}

function hideSuppDropdown(){const dd=document.getElementById('add-supp-dropdown');if(dd){dd.style.display='none';dd.innerHTML='';}}

function _flashCard(name,color){
  const sel='.supp-card[data-supp="'+String(name).replace(/"/g,'\\"').replace(/&/g,'&amp;')+'"]';
  const card=document.querySelector(sel);
  if(!card)return;
  card.scrollIntoView({behavior:'smooth',block:'center'});
  card.style.transition='box-shadow .25s';
  card.style.boxShadow='0 0 0 3px '+color;
  setTimeout(()=>{card.style.boxShadow='';},1500);
  return card;
}

function addSuppFromSearch(name){
  const inp=document.getElementById('add-supp-search');
  // If the user had previously hidden this item, adding it via search signals they want it back.
  const wasHidden=hiddenSupps.has(name);
  if(wasHidden){hiddenSupps.delete(name);saveHiddenSupps();}
  const alreadyInRecs=_lastRecs.some(r=>r.n===name);
  const alreadyAdded=userAddedSupps.includes(name);
  if(wasHidden&&!alreadyInRecs&&!alreadyAdded){
    // Re-running _showRecs will re-surface engine recommendations; for non-engine picks fall through to the
    // userAddedSupps path so the supplement appears even if it isn't in the engine's list.
    // _showRecs() resets _selInitialized=false and rebuilds selectedSupps from defaults — that would
    // wipe every check/uncheck the user has made on the other cards. Snapshot and restore so only
    // the newly-unhidden item changes selection state.
    const _savedSel=new Set(selectedSupps);
    if(typeof _showRecs==='function')_showRecs();
    selectedSupps=_savedSel;
    _selInitialized=true;
    if(!_lastRecs.some(r=>r.n===name)&&_suppByName.has(name)){
      userAddedSupps.push(name);
      saveUserAdded();
    }
    selectedSupps.add(name);
    renderSuppCards(_lastRecs,_lastMi,_lastBwResults);
    setTimeout(()=>_flashCard(name,'rgba(75,123,229,.45)'),30);
  }else if(alreadyInRecs||alreadyAdded){
    selectedSupps.add(name);
    // Re-render so the card reflects its selected state
    renderSuppCards(_lastRecs,_lastMi,_lastBwResults);
    setTimeout(()=>_flashCard(name,'rgba(31,122,107,.35)'),30);
  }else if(_suppByName.has(name)){
    userAddedSupps.push(name);
    saveUserAdded();
    selectedSupps.add(name);
    renderSuppCards(_lastRecs,_lastMi,_lastBwResults);
    setTimeout(()=>_flashCard(name,'rgba(75,123,229,.45)'),30);
  }
  if(inp)inp.value='';
  hideSuppDropdown();
}

function removeUserSupp(name,ev){
  if(ev){ev.stopPropagation();ev.preventDefault();}
  userAddedSupps=userAddedSupps.filter(n=>n!==name);
  saveUserAdded();
  selectedSupps.delete(name);
  renderSuppCards(_lastRecs,_lastMi,_lastBwResults);
  updateSelCount();
}

// Returns _lastRecs combined with synthetic recs for user-added supplements,
// so the plan modal, email report, and PDF all include items the user added.
function _allRecs(){
  const recNamesSet=new Set(_lastRecs.map(r=>r.n));
  const addedRecs=userAddedSupps.filter(n=>!recNamesSet.has(n)&&_suppByName.has(n)).map(n=>{
    const sup=_suppByName.get(n);
    return{n:sup.n,p:'added',tier:sup.t,tf:false,e:sup.e,s:sup.s,why:'Added by you from the supplement database.',dose:sup.dose,_userAdded:true};
  });
  return addedRecs.concat(_lastRecs);
}

function handleSearchKeydown(e){
  const dd=document.getElementById('add-supp-dropdown');
  if(!dd||dd.style.display==='none'){if(e.key==='Escape'){const inp=document.getElementById('add-supp-search');if(inp)inp.blur();}return;}
  const rows=dd.querySelectorAll('.ac-row');
  if(!rows.length){if(e.key==='Escape')hideSuppDropdown();return;}
  let idx=Array.from(rows).findIndex(r=>r.classList.contains('on'));
  if(idx<0)idx=0;
  if(e.key==='ArrowDown'){e.preventDefault();if(idx<rows.length-1)idx++;rows.forEach(r=>r.classList.remove('on'));rows[idx].classList.add('on');rows[idx].scrollIntoView({block:'nearest'});}
  else if(e.key==='ArrowUp'){e.preventDefault();if(idx>0)idx--;rows.forEach(r=>r.classList.remove('on'));rows[idx].classList.add('on');rows[idx].scrollIntoView({block:'nearest'});}
  else if(e.key==='Enter'){e.preventDefault();const name=rows[idx]&&rows[idx].getAttribute('data-supp');if(name)addSuppFromSearch(name);}
  else if(e.key==='Escape'){hideSuppDropdown();const inp=document.getElementById('add-supp-search');if(inp)inp.blur();}
}

function renderSuppCards(recs,mi,bwResults){
  const container=document.getElementById('supp-cards-container');
  if(!container)return;

  const essItems=recs.filter(x=>x.p==='essential');
  const recItems=recs.filter(x=>x.p==='recommended');
  const conItems=recs.filter(x=>x.p==='consider');

  // Sort "Worth considering" from highest to lowest composite score
  const _scoreOf=n=>{const sup=_suppByName.get(n);return sup?calcScore(sup):0;};
  conItems.sort((a,b)=>_scoreOf(b.n)-_scoreOf(a.n));

  // User-added supplements — dedupe against anything already in recs
  const recNamesSet=new Set(recs.map(r=>r.n));
  const userAddedRecs=userAddedSupps.filter(n=>!recNamesSet.has(n)&&_suppByName.has(n)).map(n=>{
    const sup=_suppByName.get(n);
    return{n:sup.n,p:'added',tier:sup.t,tf:false,e:sup.e,s:sup.s,why:'Added by you from the supplement database.',dose:sup.dose,_userAdded:true};
  });

  // On the first render of a freshly-generated plan, pre-select essentials/recommended/user-added.
  // On incremental re-renders (e.g. after add/remove), preserve the user's manual check/uncheck state.
  if(!_selInitialized){
    selectedSupps=new Set();
    essItems.forEach(r=>selectedSupps.add(r.n));
    recItems.forEach(r=>selectedSupps.add(r.n));
    userAddedRecs.forEach(r=>selectedSupps.add(r.n));
    _selInitialized=true;
  }else{
    // Still auto-select newly added user supplements (otherwise they'd render unchecked)
    userAddedRecs.forEach(r=>selectedSupps.add(r.n));
  }

  function scoreFor(r){const sup=_suppByName.get(r.n);return sup?calcScore(sup):0;}

  function bwBadgeFor(r){
    if(!bwResults||!bwResults.length)return'';
    let badges='';
    bwResults.forEach(bw=>{
      if(!bw.needsAction)return;
      bw.bio.supps.forEach(sr=>{
        if(sr.name===r.n){
          const label=bw.status==='critical'?'Deficient':bw.status==='low'?'Below optimal':'Elevated';
          badges+=`<span class="supp-card-bw">\uD83E\uDE78 ${bw.bio.name.split(',')[0].split('(')[0].trim()}: ${label}</span>`;
        }
      });
    });
    return badges;
  }

  // Names in the current stack (essential + recommended + consider + user-added). Used to flag cross-conflicts on each card.
  // We include consider-tier items so interactions surface across the entire Recommended Supplements List, not just the top two tiers.
  const _stackNames=recs.map(x=>x.n).concat(userAddedRecs.map(x=>x.n));
  // ── Positive pairings within the user's stack ──
  // For every item in the stack, find a partner that is ALSO in the stack. Prefer a partner
  // that shares the same timing slot (Morning/Daytime/Night) — that's the "take them
  // together" case. Fall back to any cross-timing partner so the pairing is still surfaced
  // (e.g. Vitamin D3 in Morning pairs with Vitamin K2 in Daytime). Mirrors PDF logic.
  const _pairSet=new Set(_stackNames);
  const _recByName=new Map();recs.concat(userAddedRecs).forEach(rr=>{if(!_recByName.has(rr.n))_recByName.set(rr.n,rr);});
  const _timingOf=(n)=>{const rr=_recByName.get(n);if(!rr)return 'Daytime';const t=getTimingLabel(rr);return t?t.time:'Daytime';};
  const _stackPairMap=new Map();
  _stackNames.forEach(n=>{
    if(typeof getPairPartners!=='function')return;
    const partners=getPairPartners(n).filter(p=>_pairSet.has(p));
    if(!partners.length)return;
    const tn=_timingOf(n);
    const sameSlot=partners.find(p=>_timingOf(p)===tn);
    _stackPairMap.set(n,sameSlot||partners[0]);
  });
  function cardHtml(r,tier){
    const sc=scoreFor(r);
    const sup=_suppByName.get(r.n);
    const isSelected=selectedSupps.has(r.n);
    const scoreBg=sc>=72?'#0D9488':sc>=60?'#4B7BE5':sc>=40?'#CA8A04':'#B91C1C';
    const bwBadge=bwBadgeFor(r);
    // Tags: always show efficacy, safety, tier, then categories
    let tags='';
    const eff=sup?sup.e:r.e;
    const saf=sup?sup.s:r.s;
    const rd=sup?sup.r||1:1;
    // Inline rating row — matches the detail-page treatment (Efficacy 4\u2605 Safety 4\u2605 Research 4\u2605).
    // No pill backgrounds; small label + bold number + teal star. Drops the old "Tier N evidence" pill
    // in favour of a numeric Research rating drawn from the same `rd` field the detail page uses.
    tags+=`<span class="sct-rating"><span class="sct-rating-lbl">Efficacy</span><span class="sct-rating-num">${eff}</span><span class="sct-rating-star">\u2605</span></span>`;
    tags+=`<span class="sct-rating"><span class="sct-rating-lbl">Safety</span><span class="sct-rating-num">${saf}</span><span class="sct-rating-star">\u2605</span></span>`;
    tags+=`<span class="sct-rating"><span class="sct-rating-lbl">Research</span><span class="sct-rating-num">${rd}</span><span class="sct-rating-star">\u2605</span></span>`;
    // Add category tags from supplement data
    if(sup&&sup.tag){sup.tag.split(' · ').forEach(t=>{const tt=t.trim();if(tt)tags+=`<span class="supp-card-tag sct-cat">${tt}</span>`;});}
    if(r._userAdded)tags+=`<span class="supp-card-tag sct-added">Added by you</span>`;
    // ── Positive pairing — surface a partner that's also in the user's stack ──
    // Adjacent same-slot partner is preferred, cross-slot partner falls through.
    const pairPartner=_stackPairMap.get(r.n);
    if(pairPartner){
      tags+=`<span class="supp-card-tag sct-pair">\u{1F517} Pairs with ${escHtml(pairPartner)}</span>`;
    }
    // ── Supplement-supplement conflicts with items ALSO in the current stack ──
    const stackConflicts=(typeof getSuppCautionsIn==='function')?getSuppCautionsIn(r.n,_stackNames):[];
    let conflictBlock='';
    if(stackConflicts.length){
      const hasAvoid=stackConflicts.some(c=>c.severity==='avoid');
      // Removed the top-row "Stack caution · N supps" pill — the same information is
      // surfaced more clearly by the inline-chip "Caution with [chip] [chip]" line below.
      // Inline-chip layout: one line per reason, with conflicting partners as chips.
      // Drops the nested header + outer panel of the previous treatment in favour of a
      // single tight row that reads "Caution with [Omega-3] [Curcumin] [NAC] — reason".
      const byR={};
      stackConflicts.forEach(c=>{if(!byR[c.reason])byR[c.reason]={severity:c.severity,partners:[]};if(!byR[c.reason].partners.includes(c.with))byR[c.reason].partners.push(c.with);});
      const lines=Object.entries(byR).map(([reason,v])=>{
        const sev=v.severity==='avoid'?'avoid':'caution';
        const lead=v.severity==='avoid'?'\u26A0 Do not stack with':'\u26A0 Caution with';
        const chips=v.partners.map(p=>`<span class="sc-conflict-chip sc-conflict-chip-${sev}">${escHtml(p)}</span>`).join('');
        return `<div class="sc-conflict-line"><span class="sc-conflict-lead sc-conflict-lead-${sev}">${lead}</span>${chips}<span class="sc-conflict-why">\u2014 ${escHtml(reason)}</span></div>`;
      }).join('');
      conflictBlock=`<div class="sc-conflicts">${lines}</div>`;
    }
    // ── Phase 2 / Item #2: drug-supplement conflicts ──
    // Pulls from selectedMeds (class chips) + selectedDrugs (specific drugs the user typed).
    const drugConflicts=(typeof getAllDrugConflicts==='function')?getAllDrugConflicts(r.n,selectedMeds,Array.from(selectedDrugs||[])):[];
    let drugConflictBlock='';
    if(drugConflicts.length){
      const hasAvoidDr=drugConflicts.some(c=>c.severity==='avoid');
      const allExtra=drugConflicts.every(c=>c.severity==='extra');
      const dTagCls=hasAvoidDr?'sct-danger':(allExtra?'sct-pair':'sct-warn');
      const dTagLbl=hasAvoidDr?'Do not combine with':(allExtra?'\u{1F48A} Recommended with':'Drug caution');
      const uniqDrugs=[...new Set(drugConflicts.map(c=>c.drug_label||c.drug))];
      tags+=`<span class="supp-card-tag ${dTagCls}">⚠ ${dTagLbl} · ${uniqDrugs.length} med${uniqDrugs.length!==1?'s':''}</span>`;
      const byM={};
      drugConflicts.forEach(c=>{const k=c.mechanism||c.drug_label;if(!byM[k])byM[k]={severity:c.severity,drugs:[]};if(!byM[k].drugs.includes(c.drug_label||c.drug))byM[k].drugs.push(c.drug_label||c.drug);});
      const dRows=Object.entries(byM).map(([mech,v])=>{
        const sev=v.severity==='avoid'?'avoid':(v.severity==='extra'?'extra':'caution');
        const sevLbl=v.severity==='avoid'?'Do not combine':v.severity==='extra'?'Often recommended':'Caution';
        return `<div class="supp-card-conflict-row supp-card-drug-${sev}"><span class="supp-card-conflict-sev">${sevLbl}</span><span class="supp-card-conflict-reason">${escHtml(mech)}</span><span class="supp-card-conflict-with">with ${v.drugs.map(d=>escHtml(d)).join(', ')}</span></div>`;
      }).join('');
      const header=hasAvoidDr
        ?'Interacts with medication(s) you take — talk to your pharmacist before combining'
        :(allExtra
          ?'Often clinically recommended alongside this medication — confirm with your prescriber'
          :'Interacts with medication(s) you take');
      drugConflictBlock=`<div class="supp-card-conflicts supp-card-drug-conflicts"><div class="supp-card-conflicts-hdr">${header}</div>${dRows}<div class="supp-card-drug-disclaimer">Not medical advice. Talk to your pharmacist or prescriber before any change.</div></div>`;
    }
    // Description — show full supplement desc
    const desc=sup?sup.desc:'';
    // Why recommended — always show
    const why=r.why||'';
    const whyLabel=r._userAdded?'You added this':'Why recommended';
    // X button appears on every card. For user-added items it removes them from the "added" list; for
    // engine recommendations it hides them so they don't keep showing up on future recalculations.
    // The checkbox state (elsewhere) is independent — users can still simply uncheck to exclude from
    // the exported plan while keeping the card on screen.
    const removeBtn=`<button class="sc-remove" title="${r._userAdded?'Remove from your list':'Hide this recommendation'}" aria-label="${r._userAdded?'Remove':'Hide'} ${escAttr(r.n)}" onclick="${r._userAdded?'removeUserSupp':'hideSupp'}(this.closest('.supp-card').getAttribute('data-supp'),event)">\u00D7</button>`;

    // Phase 0 / Item #9: last-reviewed date footer — small, subtle, with tooltip.
    const lr=lastReviewedFor(r.n);
    const lrLine=lr?`<div class="supp-card-reviewed" title="Reviewed against PubMed and listed sources every 22 days. Tier-4 safety entries are reviewed more often.">Last reviewed: ${fmtReviewDate(lr)}</div>`:'';
    return`<div class="supp-card${isSelected?' sc-selected':''}${stackConflicts.length||drugConflicts.length?' supp-card-has-conflict':''}" data-supp="${escAttr(r.n)}" onclick="toggleSuppCard(this)"><div class="supp-card-check"></div>${removeBtn}<div class="supp-card-top"><div class="supp-card-score" style="background:${scoreBg}">${sc}</div><div class="supp-card-name">${escHtml(r.n)}</div></div><div class="supp-card-tags">${tags}${bwBadge}</div>${desc?`<div class="supp-card-desc">${escHtml(desc)}</div>`:''}${conflictBlock}${drugConflictBlock}<div class="supp-card-why"><span class="supp-card-why-label">${whyLabel}</span>${escHtml(why)}</div>${lrLine}</div>`;
  }

  let html='';

  // Added by you (user-added) — always first
  if(userAddedRecs.length){
    html+=`<div class="tier-sec-hdr"><div class="tier-sec-dot" style="background:#4B7BE5"></div> Added by you <span class="tier-sec-count">${userAddedRecs.length} supplement${userAddedRecs.length!==1?'s':''}</span></div>`;
    html+=`<div class="supp-cards">${userAddedRecs.map(r=>cardHtml(r,'added')).join('')}</div>`;
  }

  // Essential
  if(essItems.length){
    html+=`<div class="tier-sec-hdr"><div class="tier-sec-dot" style="background:var(--t1c)"></div> Essential \u2014 Take these daily <span class="tier-sec-count">${essItems.length} supplement${essItems.length!==1?'s':''}</span></div>`;
    html+=`<div class="supp-cards">${essItems.map(r=>cardHtml(r,'essential')).join('')}</div>`;
  }

  // Recommended
  if(recItems.length){
    html+=`<div class="tier-sec-hdr"><div class="tier-sec-dot" style="background:var(--t2c)"></div> Recommended \u2014 Strong evidence <span class="tier-sec-count">${recItems.length} supplement${recItems.length!==1?'s':''}</span></div>`;
    html+=`<div class="supp-cards">${recItems.map(r=>cardHtml(r,'recommended')).join('')}</div>`;
  }

  // Consider — show first 4, expandable
  if(conItems.length){
    html+=`<div class="tier-sec-hdr"><div class="tier-sec-dot" style="background:var(--t3c)"></div> Worth considering <span class="tier-sec-count">${conItems.length} supplement${conItems.length!==1?'s':''}</span></div>`;
    html+=`<div class="supp-cards" id="con-cards-grid">`;
    conItems.forEach(r=>{
      html+=`<div>${cardHtml(r,'consider')}</div>`;
    });
    html+=`</div>`;
  }

  container.innerHTML=html;

  // Show selection bar
  updateSelCount();
  const _selBar=document.getElementById('sel-bar');if(_selBar)_selBar.style.display='block';
}

function _getFoodInfo(name){
  const sup=_suppByName.get(name);
  if(!sup||!sup.tips)return{withFood:true};
  const t=sup.tips.toLowerCase();
  if(t.includes('take on an empty stomach')||t.includes('take on empty stomach'))return{withFood:false};
  if(t.includes('any time')||t.includes('with or without'))return{either:true};
  if(t.includes('empty stomach')&&!t.includes('not')&&!t.includes('avoid'))return{withFood:false};
  return{withFood:true};
}

function toggleSuppCard(el){
  const name=el.dataset.supp;
  if(selectedSupps.has(name)){selectedSupps.delete(name);el.classList.remove('sc-selected');}
  else{selectedSupps.add(name);el.classList.add('sc-selected');}
  updateSelCount();
}

function updateSelCount(){
  const n=selectedSupps.size;
  const cnt=document.getElementById('sel-count');
  if(cnt)cnt.textContent=n;
}


function openPlanModal(){
  const recs=_allRecs();
  const selected=recs.filter(r=>selectedSupps.has(r.n));
  if(!selected.length){alert('Select at least one supplement to view your plan.');return;}

  // Build flat supplement list
  const items=selected.map(r=>{
    const sup=_suppByName.get(r.n);
    const sc=sup?calcScore(sup):0;
    const tags=sup&&sup.tag?sup.tag.split(' · ').slice(0,2):[];
    return{name:r.n,dose:r.dose.split(';')[0].split('.')[0],score:sc,pri:r.p,why:r.why||'',timing:getTimingLabel(r),tags};
  });

  // Summary body — flat list with edit link
  let html='';
  items.forEach(item=>{
    const scoreBg=item.score>=80?'#0D9488':item.score>=60?'#4B7BE5':item.score>=40?'#CA8A04':'#B91C1C';
    const tagHtml=item.tags.map(t=>`<span class="plan-row-tag">${t.trim()}</span>`).join('');
    html+=`<div class="plan-row"><div class="plan-row-score" style="background:${scoreBg}">${item.score}</div><div class="plan-row-name">${item.name}</div><div class="plan-row-tags">${tagHtml}</div></div>`;
  });
  html+=`<div class="plan-edit-row"><button class="plan-edit-btn" onclick="closePlanModal()">Make changes</button></div>`;

  const _pb=document.getElementById('plan-body');if(_pb)_pb.innerHTML=html;

  // Note: in-modal "Your full personalized report" preview was removed 2026-04-28 per UX feedback.
  // The PDF still contains the full report — see downloadPDF() / sendPlanEmail() for the export path.

  const _ps=document.getElementById('plan-sub');if(_ps)_ps.textContent=selected.length+' supplement'+(selected.length!==1?'s':'')+' \u00B7 Personalized for your profile';
  const _po=document.getElementById('plan-overlay');if(_po)_po.classList.add('open');
  document.body.style.overflow='hidden';
}

function closePlanModal(){
  const _po=document.getElementById('plan-overlay');if(_po)_po.classList.remove('open');
  document.body.style.overflow='';
}

async function sendPlanEmail(){
  const _pe=document.getElementById('plan-email');
  if(!_pe)return;
  const email=_pe.value.trim();
  if(!email||!email.includes('@')){_pe.focus();return;}
  const btn=document.getElementById('plan-send-btn');
  if(!btn)return;
  btn.disabled=true;btn.textContent='Preparing…';
  // Collect email via Formspree (fire & forget)
  const _aslEl=document.getElementById('asl');const age=_aslEl?_aslEl.value:'';
  const sexLabel=sex==='fp'?'Pregnant woman':sex==='m'?'Male':'Female';
  const recs=_allRecs();
  const selRecs=recs.filter(r=>selectedSupps.has(r.n));
  const suppNames=selRecs.map(r=>r.n).join(', ');
  fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,profile:age+' '+sexLabel,supplements:suppNames,count:selRecs.length,source:'pdf-download',date:new Date().toISOString()})}).catch(()=>{});
  // Download PDF
  try{
    await downloadPDF();
    btn.textContent='Downloaded ✓';btn.style.background='#0D9488';
    setTimeout(()=>{btn.textContent='Download PDF';btn.style.background='';btn.disabled=false;},2500);
  }catch(e){btn.textContent='Download PDF';btn.disabled=false;}
}

// Close plan on Escape
/* NOTE: global keydown handlers are consolidated at the bottom of this file. */

function escHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function hl(t,q){if(!q)return t;const eq=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return t.replace(new RegExp(`(${eq})`,'gi'),'<mark>$1</mark>');}
/* Generic-search (#gs-inp) listener cluster removed — markup gone since
   the index hero redesign. Site-wide search lives in nav-search.js. */
let af='az';
function match(s,q){if(!q)return true;const l=q.toLowerCase();return[s.n,s.tag,s.desc,s.dose].some(x=>x&&x.toLowerCase().includes(l));}
function toggleCard(btn){const inner=btn.closest('.sc-inner');const wrap=inner.querySelector('.sc-expand');const chv=btn.querySelector('.sc-toggle-chv');const isOpen=wrap.classList.toggle('open');chv.classList.toggle('open');btn.querySelector('span:first-child').textContent=isOpen?'Less':'More';const preview=inner.querySelector('.sc-desc-preview');if(preview)preview.style.display=isOpen?'none':'';const chip=inner.querySelector('.art-chip');if(chip)chip.style.display=isOpen?'none':'';}
// Build reverse interaction map: supplement name -> [{med, type}]
const INTERACT_MAP={};Object.entries(MEDS).forEach(([k,m])=>{m.avoid.forEach(n=>{if(!INTERACT_MAP[n])INTERACT_MAP[n]=[];INTERACT_MAP[n].push({med:m.label,type:'avoid'});});m.caution.forEach(n=>{if(!INTERACT_MAP[n])INTERACT_MAP[n]=[];INTERACT_MAP[n].push({med:m.label,type:'caution'});});});
// ── Supplement-to-supplement interactions ──
// pairs: positive synergies — paired items are placed adjacent in the Section 01 table
// cautions: negative combinations — shown as a red inline note on the row
// groups: mechanism-based clusters that auto-expand to every pairwise combination.
// Every pair inside a group inherits the group's `reason` and `severity`.
const SUPP_INTERACTIONS={
  pairs:[
    // Order within each anchor matters: the first selected partner is surfaced on the
    // anchor's row when there is no adjacent same-timing pair. Put the highest-priority
    // pairing (bone/cardio for D3+K2) first.
    ['Vitamin D3','Vitamin K2 (MK-7)'],
    ['Vitamin D3','Magnesium glycinate'],
    ['Vitamin D3','Magnesium'],
    ['Iron','Vitamin C (moderate dose)'],
    ['Ferrous bisglycinate (gentle iron)','Vitamin C (moderate dose)'],
    ['CoQ10 (Ubiquinol)','Omega-3 (EPA/DHA)'],
    ['Magnesium L-threonate','Glycine'],
    ['Magnesium glycinate','Glycine'],
    ['Magnesium','Glycine'],
    ['Glycine','L-Theanine'],
    ['Glycine','NAC (N-Acetyl Cysteine)'],
    ['Folate (5-MTHF)','Vitamin B12'],
    ['Curcumin (bioavailable form)','Black pepper extract (piperine)'],
    ['Curcumin (bioavailable form)','Boswellia serrata'],
    ['Rhodiola rosea','Tyrosine (L-tyrosine)'],
    ['5-HTP','Vitamin B6 (P5P)'],
    ['Zinc','Copper (as glycinate)'],
    ['Ashwagandha (KSM-66)','L-Theanine'],
    ['Omega-3 (EPA/DHA)','Vitamin E (mixed tocopherols)'],
    ['Calcium','Vitamin D3'],
    ['Calcium','Vitamin K2 (MK-7)'],
    ['Magnesium','Vitamin B6 (P5P)'],
    ['Collagen peptides','Vitamin C (moderate dose)'],
    ['Probiotics','Fibre (general dietary)'],
    ['Probiotics','Psyllium husk (soluble fibre)'],
    ['Lactobacillus rhamnosus GG','Fibre (general dietary)'],
    ['Myo-inositol','D-Chiro Inositol'],
    ['Inositol myo-form (PCOS/metabolic)','D-Chiro Inositol'],
    ['Lutein (standalone)','Zeaxanthin (standalone)'],
    ['L-Carnitine','CoQ10 (Ubiquinol)'],
    ['Whey protein','L-Leucine (standalone)'],
    ['Protein supplementation (clinical sarcopenia)','L-Leucine (standalone)'],
    ['Nicotinamide riboside (NR)','Pterostilbene'],
    ['Elderberry (Sambucus nigra)','Zinc'],
    ['Tart cherry (Montmorency)','Magnesium glycinate'],
    ['Aniracetam','Alpha-GPC'],
    ['Oxiracetam','Alpha-GPC'],
    ['Piracetam','Alpha-GPC']
  ],
  // Explicit, named caution pairs — for interactions that don't cleanly fit a group.
  cautions:[
    ['Ashwagandha (KSM-66)','Apigenin','may increase sedation','caution'],
    ['Ashwagandha (KSM-66)','Raw thyroid glandulars','can raise T4 — stacks on thyroid load','caution'],
    ['Ashwagandha (KSM-66)','Thyroid glandular supplements (desiccated)','can raise T4 — stacks on thyroid load','caution'],
    ['Iron','Calcium','absorption interference — space by ≥2 h','caution'],
    ['Iron','Zinc','compete for intestinal absorption','caution'],
    ['Iron','Green tea extract (EGCG)','EGCG chelates iron — take ≥2 h apart','caution'],
    ['Iron','Magnesium','reduces iron absorption — space by ≥2 h','caution'],
    ['Calcium','Magnesium','compete for absorption at high single doses','caution'],
    ['Calcium','Zinc','compete for absorption','caution'],
    ['Zinc','Copper (as glycinate)','long-term zinc depletes copper','caution'],
    ['Zinc','Manganese','compete for absorption','caution'],
    ['Green tea extract (EGCG)','Iron','EGCG chelates iron — take apart','caution'],
    ['Niacin (Vitamin B3)','Niacinamide (nicotinamide)','redundant — pick one form','caution'],
    ['Niacin (Vitamin B3)','Nicotinic acid (Niacin, flush form)','same vitamin in two forms — do not stack','caution'],
    ['Folic acid (synthetic)','Folate (5-MTHF)','redundant — pick one folate form','caution'],
    ['Beta-carotene (standalone supplement)','Vitamin A (retinol, low-dose)','combined can exceed safe vitamin A load','caution'],
    ['DHEA (Dehydroepiandrosterone)','7-Keto DHEA','overlapping precursor load — pick one','caution'],
    ['DHEA (Dehydroepiandrosterone)','Pregnenolone','stacks hormonal precursors','caution'],
    ['DHEA (Dehydroepiandrosterone)','Androstenedione (prohormone)','severe androgenic load — do not stack','avoid'],
    ['Androstenedione (prohormone)','Methyl-1-testosterone (oral steroid)','prohormone stacking — hepatic and cardiac risk','avoid'],
    ['Tribulus terrestris','DHEA (Dehydroepiandrosterone)','compounds androgenic signalling','caution'],
    ['Tongkat ali (Eurycoma longifolia)','Fadogia agrestis','popular "T-stack" with no safety data together','caution'],
    ['Indole-3-Carbinol (I3C)','DIM (Diindolylmethane)','I3C converts to DIM in the gut — redundant','caution'],
    ['Indole-3-Carbinol (I3C)','DIM (Diindolylmethane)','I3C converts to DIM in the gut — redundant','caution'],
    ['Indole-3-Carbinol (I3C)','Diindolylmethane (DIM)','I3C converts to DIM in the gut — redundant','caution'],
    ['Soy isoflavones','Red clover (Trifolium pratense)','additive phytoestrogen load','caution'],
    ['Soy isoflavones','Pueraria mirifica (Kwao Krua)','additive phytoestrogen load','caution'],
    ['Red clover (Trifolium pratense)','Pueraria mirifica (Kwao Krua)','additive phytoestrogen load','caution'],
    ['Black cohosh (Cimicifuga racemosa)','Dong quai (Angelica sinensis)','overlapping hormonal modulation','caution'],
    ['Melatonin','Valerian root','additive sedation','caution'],
    ['Melatonin','Melatonin (high-dose, nightly)','same molecule — do not double-dose','avoid'],
    ['Melatonin','Melatonin extended-release','same molecule — do not double-dose','avoid'],
    ['Melatonin','Melatonin gummies (high dose 5–10 mg)','same molecule — do not double-dose','avoid'],
    ['Iodine','Kelp (iodine-rich)','iodine stacking — thyroid risk','avoid'],
    ['Iodine','Bladderwrack (Fucus vesiculosus)','iodine stacking — thyroid risk','avoid'],
    ['Iodine','Sea moss (Irish moss)','iodine stacking — thyroid risk','avoid'],
    ['Kelp (iodine-rich)','Bladderwrack (Fucus vesiculosus)','iodine stacking — thyroid risk','avoid'],
    ['Kelp (iodine-rich)','Sea moss (Irish moss)','iodine stacking — thyroid risk','avoid'],
    ['Bladderwrack (Fucus vesiculosus)','Sea moss (Irish moss)','iodine stacking — thyroid risk','avoid'],
    ['Licorice root (high-dose/chronic)','Diuretic supplements (herbal water pills)','potassium loss compounded — cardiac risk','avoid'],
    ['Licorice root high-dose','Diuretic supplements (herbal water pills)','potassium loss compounded — cardiac risk','avoid'],
    ['Licorice root (high-dose/chronic)','Potassium citrate','licorice wastes potassium while supplement loads it — monitor','caution'],
    ['Red yeast rice','Niacin (Vitamin B3)','both stress liver lipid pathways','caution'],
    ['Red yeast rice','CoQ10 (Ubiquinol)','needed because red yeast rice depletes CoQ10 — pair, don\'t avoid','caution'],
    ['Magnesium','Magnesium glycinate','redundant — pick one magnesium form','caution'],
    ['Magnesium','Magnesium L-threonate','redundant — pick one magnesium form','caution'],
    ['Magnesium','Magnesium citrate','redundant — pick one magnesium form','caution'],
    ['Magnesium','Magnesium malate','redundant — pick one magnesium form','caution'],
    ['Magnesium','Magnesium taurate','redundant — pick one magnesium form','caution'],
    ['Magnesium','Magnesium orotate','redundant — pick one magnesium form','caution'],
    ['Magnesium','Magnesium bisglycinate','redundant — pick one magnesium form','caution'],
    ['CoQ10 (Ubiquinol)','CoQ10 (ubiquinone, classic form)','redundant — pick one CoQ10 form','caution'],
    ['Omega-3 (EPA/DHA)','Flaxseed oil (ALA omega-3)','redundant omega-3 — prioritise EPA/DHA','caution'],
    ['Omega-3 (EPA/DHA)','Krill oil','overlapping EPA/DHA load','caution'],
    ['Omega-3 (EPA/DHA)','Cod liver oil','overlapping EPA/DHA + vitamin A load','caution'],
    ['Krill oil','Cod liver oil','overlapping omega-3 dose','caution'],
    ['Algal DHA (vegan omega-3)','Omega-3 (EPA/DHA)','overlapping DHA — pick one source','caution'],
    ['Creatine monohydrate','Creatine HCl','same compound, different salt — pick one','caution'],
    ['Whey protein','Casein protein','fine together, but watch total protein load in kidney disease','caution'],
    ['Alpha-Lipoic Acid (ALA)','Biotin (high-dose)','ALA competes with biotin transport — space apart','caution'],
    // ── 2026-04-25 negative-interaction expansion (ss-interactions task) ──
    // Duplicate / overlapping forms — pick one to avoid double-dosing.
    ['Vitamin B12','Methylcobalamin (high-dose neurological)','same vitamin in two forms — pick one','caution'],
    ['Vitamin B12','Hydroxocobalamin','same vitamin in two forms — pick one','caution'],
    ['Vitamin B12','Adenosylcobalamin (dibencozide)','same vitamin in two forms — pick one','caution'],
    ['Vitamin B12','Methyl B12 + Methylfolate combo','overlapping B12 dose — do not double-dose','caution'],
    ['Methylcobalamin (high-dose neurological)','Hydroxocobalamin','duplicate B12 form — pick one','caution'],
    ['Methylcobalamin (high-dose neurological)','Adenosylcobalamin (dibencozide)','duplicate B12 form — pick one','caution'],
    ['Hydroxocobalamin','Adenosylcobalamin (dibencozide)','duplicate B12 form — pick one','caution'],
    ['Folate (5-MTHF)','Methyl B12 + Methylfolate combo','overlapping folate dose — do not double-dose','caution'],
    ['Folate (5-MTHF)','Folinic acid (5-formyl-THF)','redundant folate forms — pick one','caution'],
    ['Folic acid (synthetic)','Folinic acid (5-formyl-THF)','redundant folate forms — pick one','caution'],
    ['Vitamin B6 (P5P)','Pyridoxal 5-phosphate (P5P)','same vitamin form — pick one','caution'],
    ['Vitamin B1 (Thiamine)','Vitamin B1 (Thiamine, clinical)','same vitamin in two forms — pick one','caution'],
    ['Vitamin B1 (Thiamine)','Benfotiamine','overlapping thiamine forms — typically pick one','caution'],
    ['Vitamin B1 (Thiamine)','Benfotiamine (fat-soluble B1)','overlapping thiamine forms — pick one','caution'],
    ['Vitamin B1 (Thiamine)','TTFD / Allithiamine (fat-soluble B1)','overlapping thiamine forms — pick one','caution'],
    ['Benfotiamine','Benfotiamine (fat-soluble B1)','duplicate thiamine form — pick one','caution'],
    ['Benfotiamine (fat-soluble B1)','TTFD / Allithiamine (fat-soluble B1)','overlapping thiamine forms — pick one','caution'],
    ['Vitamin B2 (Riboflavin low-dose)','Riboflavin (Vitamin B2)','same vitamin form — pick one','caution'],
    ['Pantothenic acid (Vitamin B5)','Calcium pantothenate (Vitamin B5)','same vitamin form — pick one','caution'],
    ['Pantothenic acid (Vitamin B5)','Pantethine','overlapping B5 forms — pick one','caution'],
    ['Calcium pantothenate (Vitamin B5)','Pantethine','overlapping B5 forms — pick one','caution'],
    ['Niacin (Vitamin B3)','Inositol hexanicotinate','overlapping niacin forms — pick one','caution'],
    ['Niacinamide (nicotinamide)','Inositol hexanicotinate','overlapping niacin forms — pick one','caution'],
    ['Biotin (high-dose)','Biotin (low-dose, deficiency)','same vitamin in two forms — pick one','caution'],
    ['B-complex (balanced)','Activated B complex (methylated)','duplicate B-complex products — pick one','caution'],
    ['B-complex (balanced)','Vitamin B12','if B-complex already includes B12, watch total dose','caution'],
    ['B-complex (balanced)','Folate (5-MTHF)','if B-complex already includes folate, watch total dose','caution'],
    ['B-complex (balanced)','Vitamin B6 (P5P)','if B-complex already includes B6, do not exceed 100 mg/day total','caution'],
    ['Activated B complex (methylated)','Vitamin B12','duplicate B12 — already in B-complex','caution'],
    ['Activated B complex (methylated)','Folate (5-MTHF)','duplicate folate — already in B-complex','caution'],
    ['Multivitamins (healthy adults)','B-complex (balanced)','overlapping B vitamins — watch total dose','caution'],
    ['Multivitamins (healthy adults)','Iron','many multivitamins already contain iron — do not stack without testing ferritin','caution'],
    ['Multivitamins (healthy adults)','Vitamin A (retinol, low-dose)','duplicate vitamin A — risk of exceeding 10,000 IU/day','caution'],
    ['Multivitamins (healthy adults)','Beta-carotene (standalone supplement)','overlapping vitamin A activity — risk of exceeding upper limit','caution'],
    // Zinc family (multiple zinc salts)
    ['Zinc','Zinc bisglycinate','redundant — pick one zinc form','caution'],
    ['Zinc','Zinc gluconate','redundant — pick one zinc form','caution'],
    ['Zinc','Zinc picolinate','redundant — pick one zinc form','caution'],
    ['Zinc','Zinc carnosine','redundant — pick one zinc form','caution'],
    ['Zinc bisglycinate','Zinc gluconate','redundant — pick one zinc form','caution'],
    ['Zinc bisglycinate','Zinc picolinate','redundant — pick one zinc form','caution'],
    ['Zinc bisglycinate','Zinc carnosine','redundant — pick one zinc form','caution'],
    ['Zinc gluconate','Zinc picolinate','redundant — pick one zinc form','caution'],
    ['Zinc gluconate','Zinc carnosine','redundant — pick one zinc form','caution'],
    ['Zinc picolinate','Zinc carnosine','redundant — pick one zinc form','caution'],
    ['Zinc bisglycinate','Copper (as glycinate)','long-term zinc depletes copper','caution'],
    ['Zinc gluconate','Copper (as glycinate)','long-term zinc depletes copper','caution'],
    ['Zinc picolinate','Copper (as glycinate)','long-term zinc depletes copper','caution'],
    ['Zinc carnosine','Copper (as glycinate)','long-term zinc depletes copper','caution'],
    // Calcium forms
    ['Calcium','Calcium carbonate/citrate (bone health)','same mineral in two forms — pick one','caution'],
    ['Calcium','Calcium hydroxyapatite (MCHC)','overlapping calcium load — watch total intake','caution'],
    ['Calcium','Coral calcium','overlapping calcium load — watch total intake','caution'],
    ['Calcium','Calcium D-glucarate','overlapping calcium load — watch total intake','caution'],
    ['Calcium','Calcium fructoborate','overlapping calcium load — watch total intake','caution'],
    ['Calcium','Calcium alpha-ketoglutarate (Ca-AKG)','overlapping calcium load — watch total intake','caution'],
    ['Calcium','Calcium pantothenate (Vitamin B5)','adds to total calcium load — watch total intake','caution'],
    ['Calcium','Calcium AEP (2-aminoethylphosphoric acid)','overlapping calcium load — watch total intake','caution'],
    ['Calcium hydroxyapatite (MCHC)','Coral calcium','overlapping calcium load — pick one','caution'],
    ['Calcium hydroxyapatite (MCHC)','Calcium carbonate/citrate (bone health)','overlapping calcium load — pick one','caution'],
    // Choline source overlap (racetam users typically pick one)
    ['Alpha-GPC','Citicoline (CDP-Choline)','overlapping choline source — typically pick one','caution'],
    ['Alpha-GPC','Choline','overlapping choline source — pick one','caution'],
    ['Alpha-GPC','Choline bitartrate','overlapping choline source — pick one','caution'],
    ['Alpha-GPC','Glycerophosphocholine (GPC)','same compound, different label — pick one','avoid'],
    ['Alpha-GPC','Phosphatidylcholine','overlapping choline source — typically pick one','caution'],
    ['Citicoline (CDP-Choline)','Choline','overlapping choline source — pick one','caution'],
    ['Citicoline (CDP-Choline)','Choline bitartrate','overlapping choline source — pick one','caution'],
    ['Choline','Choline bitartrate','same compound — pick one','avoid'],
    ['Choline','Phosphatidylcholine','overlapping choline source — typically pick one','caution'],
    // Estrogen-pathway overlap
    ['DIM (Diindolylmethane)','Diindolylmethane (DIM)','same compound — pick one','avoid'],
    ['DIM (Diindolylmethane)','Calcium D-glucarate','overlapping estrogen-clearance support — typically used together but watch total load','caution'],
    ['Vitex / Chasteberry (Vitex agnus-castus)','Chasteberry/Vitex standardised (BNO 1095)','same herb in two forms — pick one','caution'],
    ['Vitex / Chasteberry (Vitex agnus-castus)','Soy isoflavones','overlapping hormonal modulation — discuss with clinician','caution'],
    ['Vitex / Chasteberry (Vitex agnus-castus)','Black cohosh (Cimicifuga racemosa)','overlapping hormonal modulation','caution'],
    ['Vitex / Chasteberry (Vitex agnus-castus)','Maca (Lepidium meyenii)','overlapping hormonal modulation','caution'],
    ['Maca (Lepidium meyenii)','Soy isoflavones','overlapping phytoestrogen / endocrine effects','caution'],
    ['Black cohosh (Cimicifuga racemosa)','Black cohosh high-dose','duplicate herb — pick one','avoid'],
    ['Black cohosh high-dose','Red clover (Trifolium pratense)','overlapping menopausal phytoestrogen load','caution'],
    ['Wild yam (Dioscorea villosa)','DHEA (Dehydroepiandrosterone)','wild yam is marketed as a DHEA precursor — watch hormonal load','caution'],
    // Iodine extras
    ['Iodine','Tiratricol (TRIAC, thyroid hormone analogue)','additive thyroid hormone load — risk of thyrotoxicosis','avoid'],
    ['Iodine','Raw thyroid glandulars','additive thyroid hormone load — risk of thyrotoxicosis','avoid'],
    ['Iodine','Thyroid glandular supplements (desiccated)','additive thyroid hormone load — risk of thyrotoxicosis','avoid'],
    ['Sea moss (Irish moss)','Tiratricol (TRIAC, thyroid hormone analogue)','additive thyroid load','avoid'],
    ['Kelp (iodine-rich)','Tiratricol (TRIAC, thyroid hormone analogue)','additive thyroid load','avoid'],
    ['Bladderwrack (Fucus vesiculosus)','Tiratricol (TRIAC, thyroid hormone analogue)','additive thyroid load','avoid'],
    // Adaptogen stacking — already covered partially via dedicated pairs, but flag the bundled "stack" entry
    ['Adaptogen stack (Ashwagandha + Rhodiola)','Ashwagandha (KSM-66)','already contains ashwagandha — do not double-dose','avoid'],
    ['Adaptogen stack (Ashwagandha + Rhodiola)','Shoden ashwagandha (high-withanolide)','already contains ashwagandha — do not double-dose','avoid'],
    ['Adaptogen stack (Ashwagandha + Rhodiola)','Rhodiola rosea','already contains rhodiola — do not double-dose','avoid'],
    ['Adaptogen stack (Ashwagandha + Rhodiola)','Rhodiola crenulata','already contains rhodiola — do not double-dose','avoid'],
    ['Fenugreek + Ashwagandha stack','Ashwagandha (KSM-66)','already contains ashwagandha — do not double-dose','avoid'],
    ['Fenugreek + Ashwagandha stack','Fenugreek (Trigonella foenum-graecum)','already contains fenugreek — do not double-dose','avoid'],
    ['Fenugreek + Ashwagandha stack','Fenugreek seed extract (Testofen / standardised)','already contains fenugreek — do not double-dose','avoid'],
    ['Andrographis + Echinacea combo','Andrographis paniculata','already contains andrographis — do not double-dose','avoid'],
    ['Andrographis + Echinacea combo','Andrographis (maintenance dose)','already contains andrographis — do not double-dose','avoid'],
    ['Andrographis + Echinacea combo','Echinacea purpurea','already contains echinacea — do not double-dose','avoid'],
    ['Elderberry + Zinc combo','Elderberry (Sambucus nigra)','already contains elderberry — do not double-dose','avoid'],
    ['Elderberry + Zinc combo','Sambucol (elderberry extract, maintenance)','already contains elderberry — do not double-dose','avoid'],
    ['Elderberry + Zinc combo','Zinc','already contains zinc — watch total daily zinc','avoid'],
    ['HMB + Creatine stack','HMB (β-Hydroxy-β-methylbutyrate)','already contains HMB — do not double-dose','avoid'],
    ['HMB + Creatine stack','HMB free acid','already contains HMB — do not double-dose','avoid'],
    ['HMB + Creatine stack','Creatine monohydrate','already contains creatine — do not double-dose','avoid'],
    ['HMB (β-Hydroxy-β-methylbutyrate)','HMB free acid','same compound — pick one','avoid'],
    ['HMB (β-Hydroxy-β-methylbutyrate)','Beta-hydroxy-beta-methylbutyrate free acid (HMB-FA)','same compound — pick one','avoid'],
    ['Collagen + Vitamin C stack','Collagen peptides','already contains collagen — do not double-dose','avoid'],
    ['K2 + D3 combo','Vitamin D3','already contains vitamin D3 — watch total dose','avoid'],
    ['K2 + D3 combo','Vitamin D3 liquid drops','already contains vitamin D3 — watch total dose','avoid'],
    ['K2 + D3 combo','Vitamin K2 (MK-7)','already contains K2 — do not double-dose','avoid'],
    ['NR + Pterostilbene stack (basis-type)','Nicotinamide riboside (NR)','already contains NR — do not double-dose','avoid'],
    ['NR + Pterostilbene stack (basis-type)','Pterostilbene','already contains pterostilbene — do not double-dose','avoid'],
    ['Enzyme CoQ10 + PQQ stack','CoQ10 (Ubiquinol)','already contains CoQ10 — do not double-dose','avoid'],
    ['Enzyme CoQ10 + PQQ stack','CoQ10 (ubiquinone, classic form)','already contains CoQ10 — do not double-dose','avoid'],
    ['Enzyme CoQ10 + PQQ stack','PQQ (Pyrroloquinoline quinone)','already contains PQQ — do not double-dose','avoid'],
    ['Berberine + Ceylon cinnamon combo','Berberine','already contains berberine — do not double-dose','avoid'],
    ['Berberine + Ceylon cinnamon combo','Cinnamon extract (Ceylon)','already contains cinnamon — do not double-dose','avoid'],
    ['Quercetin phytosome + Bromelain','Quercetin','already contains quercetin — do not double-dose','avoid'],
    ['Quercetin phytosome + Bromelain','Bromelain','already contains bromelain — do not double-dose','avoid'],
    ['Pterostilbene + resveratrol combo','Pterostilbene','already contains pterostilbene — do not double-dose','avoid'],
    ['Pterostilbene + resveratrol combo','Resveratrol','already contains resveratrol — do not double-dose','avoid'],
    // Vitamin D forms
    ['Vitamin D3','Vitamin D3 liquid drops','same vitamin in two forms — pick one','caution'],
    ['Vitamin D3','Vitamin D2 (ergocalciferol)','overlapping vitamin D — pick one','caution'],
    ['Vitamin D3 liquid drops','Vitamin D2 (ergocalciferol)','overlapping vitamin D — pick one','caution'],
    // Vitamin K
    ['Vitamin K2 (MK-7)','Vitamin K1 (phylloquinone)','overlapping vitamin K — typically pick K2','caution'],
    ['Vitamin K1 (phylloquinone)','Warfarin','vitamin K antagonises warfarin — keep intake consistent and supervised','avoid'],
    // Vitamin C forms
    ['Vitamin C (megadose)','Vitamin C (liposomal)','overlapping vitamin C dose — watch GI tolerance','caution'],
    // Glucosamine / Chondroitin
    ['Glucosamine / Chondroitin','Glucosamine HCl (standalone)','already contains glucosamine — do not double-dose','avoid'],
    ['Glucosamine / Chondroitin','Chondroitin sulfate (standalone)','already contains chondroitin — do not double-dose','avoid'],
    ['Glucosamine / Chondroitin','N-Acetyl glucosamine','overlapping glucosamine source — typically pick one','caution'],
    ['Hyaluronic acid + Chondroitin stack','Hyaluronic acid (oral)','already contains hyaluronic acid — do not double-dose','avoid'],
    ['Hyaluronic acid + Chondroitin stack','Chondroitin sulfate (standalone)','already contains chondroitin — do not double-dose','avoid'],
    // L-Carnitine forms
    ['L-Carnitine','Acetyl-L-Carnitine (ALCAR)','overlapping carnitine source — typically pick one','caution'],
    ['L-Carnitine','Carnitine tartrate','overlapping carnitine source — typically pick one','caution'],
    ['Acetyl-L-Carnitine (ALCAR)','Carnitine tartrate','overlapping carnitine source — typically pick one','caution'],
    // Inositol forms
    ['Myo-inositol','Inositol myo-form (PCOS/metabolic)','same compound — pick one','avoid'],
    ['Myo-inositol','Inositol (high-dose, psychiatric)','overlapping inositol — watch total dose','caution'],
    // Beta-Alanine forms
    ['Beta-Alanine','Carnosyn beta-alanine (sustained release)','overlapping beta-alanine — pick one','caution'],
    ['Beta-Alanine','Carnosine (L-carnosine)','beta-alanine is the rate-limiting precursor of carnosine — watch overlap','caution'],
    ['Beta-Alanine','L-Carnosine','beta-alanine is the rate-limiting precursor of carnosine — watch overlap','caution'],
    // Boswellia forms
    ['Boswellia serrata','Boswellic acids AKBA (standardised)','overlapping boswellic acids — pick one','caution'],
    // Probiotic strain duplication
    ['Probiotics','Lactobacillus rhamnosus GG','already covered if multi-strain probiotic includes LGG — check label','caution'],
    ['Probiotics','VSL#3 / Visbiome (multi-strain)','overlapping multi-strain probiotic — pick one','caution'],
    ['VSL#3 / Visbiome (multi-strain)','Lactobacillus rhamnosus GG','VSL#3 is multi-strain — check overlap','caution'],
    // Mushroom blends
    ['Mushroom complex (multi-species)',"Lion's mane mushroom",'already contains lion’s mane — do not double-dose','caution'],
    ['Mushroom complex (multi-species)','Reishi (Ganoderma lucidum)','already contains reishi — do not double-dose','caution'],
    ['Mushroom complex (multi-species)','Cordyceps militaris','already contains cordyceps — do not double-dose','caution'],
    ['Mushroom complex (multi-species)','Chaga (Inonotus obliquus)','already contains chaga — do not double-dose','caution'],
    ['Mushroom complex (multi-species)','Turkey tail (Trametes versicolor)','already contains turkey tail — do not double-dose','caution'],
    ['Mushroom complex (multi-species)','Maitake mushroom (Grifola frondosa)','already contains maitake — do not double-dose','caution'],
    ['Mushroom complex (multi-species)','Shiitake extract (lentinan)','already contains shiitake — do not double-dose','caution'],
    // NAD+ precursor overlap
    ['NMN / NAD+ precursors','Nicotinamide riboside (NR)','overlapping NAD+ precursors — pick one','caution'],
    ['NMN / NAD+ precursors','NAD+ (direct oral supplement)','overlapping NAD+ load — pick one','caution'],
    ['Nicotinamide riboside (NR)','NAD+ (direct oral supplement)','overlapping NAD+ load — pick one','caution'],
    // GLA overlap with Borage already in bleed group; Evening primrose oil
    ['Evening primrose oil (EPO)','Borage oil (GLA)','overlapping GLA source — pick one','caution'],
    ['Evening primrose oil (EPO)','Gamma-linolenic acid (GLA)','same fatty acid — pick one','caution'],
    ['Borage oil (GLA)','Gamma-linolenic acid (GLA)','same fatty acid — pick one','caution'],
    // 5-HTP, L-Tryptophan, SAMe, Saffron — flagged in dangerous_pairings vs SSRIs etc. Add cross-pairs:
    ['5-HTP','Tryptophan (L-tryptophan)','both serotonin precursors — additive risk; do not stack','avoid'],
    ['5-HTP','S-Adenosylmethionine (SAMe)','both serotonergic — additive risk','avoid'],
    ['5-HTP','Saffron (Crocus sativus)','both serotonergic — additive risk at high doses','avoid'],
    ['5-HTP',"St. John's Wort",'both serotonergic — risk of serotonin syndrome','avoid'],
    ['Tryptophan (L-tryptophan)',"St. John's Wort",'both serotonergic — risk of serotonin syndrome','avoid'],
    ['Tryptophan (L-tryptophan)','S-Adenosylmethionine (SAMe)','both serotonergic — additive risk','avoid'],
    ['S-Adenosylmethionine (SAMe)',"St. John's Wort",'both serotonergic — risk of serotonin syndrome','avoid'],
    ['Saffron (Crocus sativus)',"St. John's Wort",'both serotonergic — risk of serotonin syndrome at high doses','avoid'],
    // Methylene blue extras
    ['Methylene blue (pharmaceutical grade)','5-HTP','MAOI-like activity stacks with 5-HTP — serotonin syndrome','avoid'],
    ['Methylene blue (pharmaceutical grade)','Tryptophan (L-tryptophan)','MAOI-like activity stacks with tryptophan — serotonin syndrome','avoid'],
    ['Methylene blue (pharmaceutical grade)',"St. John's Wort",'MAOI-like activity + St. John’s Wort — serotonin syndrome','avoid'],
    // Phosphatidylserine vs cholinergics — additive cholinergic
    ['Huperzine A','Alpha-GPC','additive cholinergic activation — start low','caution'],
    ['Huperzine A','Citicoline (CDP-Choline)','additive cholinergic activation — start low','caution'],
    ['Huperzine A','Phosphatidylcholine','additive cholinergic activation — start low','caution'],
    // Vinpocetine — anticoagulant flag
    ['Vinpocetine','Warfarin','vinpocetine has antiplatelet activity — bleeding risk','avoid'],
    // Apple cider vinegar enamel/potassium
    ['Apple cider vinegar (supplement)','Diuretic supplements (herbal water pills)','can compound potassium loss','caution'],
    // Dihydromyricetin — alcohol/sedative
    ['Dihydromyricetin (DHM)','Alcohol','DHM accelerates alcohol metabolism — false sense of sobriety','caution'],
    // Fucoxanthin — already a small entry; cross with thyroid (low evidence)
    ['Fucoxanthin','Iodine','contains trace iodine — watch total iodine','caution'],
    // L-Histidine + zinc/copper competition
    ['L-Histidine','Zinc','histidine chelates zinc and copper — space apart','caution'],
    ['L-Histidine','Copper (as glycinate)','histidine chelates zinc and copper — space apart','caution'],
    // Lithium orotate flags
    ['Lithium orotate (low-dose)','Iodine','low-dose lithium can suppress thyroid — pair with iodine cautiously','caution'],
    ['Lithium orotate (low-dose)','5-HTP','additive serotonergic activity','caution'],
    ['Lithium orotate (low-dose)',"St. John's Wort",'additive serotonergic activity','caution'],
    // Activated charcoal — binds drugs and supplements
    ['Activated charcoal (oral)','Multivitamins (healthy adults)','binds vitamins — space ≥2 h apart from any supplement or medication','caution'],
    ['Activated charcoal (oral)','Probiotics','binds probiotics — space ≥2 h apart','caution'],
    ['Activated charcoal (oral)','Iron','binds iron — space ≥2 h apart','caution'],
    ['Activated charcoal (oral)','Folate (5-MTHF)','binds folate — space ≥2 h apart','caution'],
    ['Activated charcoal (oral)','Vitamin B12','binds B12 — space ≥2 h apart','caution'],
    // Bentonite / diatomaceous / zeolite — also bind nutrients and may carry heavy metals (already in heavy_metal_risk; cross to common minerals)
    ['Bentonite clay (oral)','Iron','clay binds iron — space ≥2 h apart','caution'],
    ['Bentonite clay (oral)','Calcium','clay binds calcium — space ≥2 h apart','caution'],
    ['Bentonite clay (oral)','Multivitamins (healthy adults)','clay binds vitamins/minerals — space ≥2 h apart','caution'],
    ['Diatomaceous earth (food grade)','Iron','clay/silica binds iron — space ≥2 h apart','caution'],
    ['Zeolite (clinoptilolite)','Iron','zeolite binds iron — space ≥2 h apart','caution'],
    ['Zeolite (clinoptilolite)','Multivitamins (healthy adults)','zeolite binds minerals — space ≥2 h apart','caution'],
    // Detox / chelation umbrellas
    ['Detox supplements','Multivitamins (healthy adults)','many detox blends include binders that strip minerals — verify formula','caution'],
    // Saw palmetto + finasteride-type / antiplatelet
    ['Saw palmetto (Serenoa repens)','Pygeum africanum','overlapping prostate herbs — typically pick one','caution'],
    ['Saw palmetto (Serenoa repens)','Stinging nettle root (Urtica dioica)','commonly stacked but evidence for combo is weak','caution'],
    // Spirulina + Chlorella overlap (already in heavy metal group; flag duplicate algae intake)
    ['Spirulina','Chlorella','overlapping algae products — watch heavy-metal load','caution'],
    ['Spirulina','Blue-green algae (AFA)','overlapping algae products — watch heavy-metal load','caution'],
    // Wormwood — neurotoxic/seizure
    ['Wormwood high-dose (Artemisia absinthium)','Caffeine (standardised)','additive CNS stimulation; thujone may lower seizure threshold','caution'],
    // Glutamine — high doses + glutamate concerns
    ['Glutamine (standalone, healthy adults)','L-Glutamine (post-infectious IBS)','same amino acid — pick one','avoid'],
    // Coleus / forskolin + thyroid/BP
    ['Coleus forskohlii (Forskolin)','Tiratricol (TRIAC, thyroid hormone analogue)','additive thyroid stimulation','caution'],
    // Goldenseal contains berberine
    ['Goldenseal (Hydrastis canadensis)','Berberine','goldenseal contains berberine — do not double-dose','avoid'],
    ['Goldenseal (Hydrastis canadensis)','Berberine HCl (sustained release)','goldenseal contains berberine — do not double-dose','avoid'],
    // Taurine forms
    ['Taurine','Taurine (cardiac and metabolic)','same amino acid — pick one','avoid'],
    // Citrulline forms
    ['Citrulline (L-citrulline, pure form)','Citrulline malate','same amino acid in two forms — pick one','caution'],
    ['Citrulline (L-citrulline, pure form)','L-Arginine','overlapping nitric-oxide precursors — typically pick one','caution'],
    ['L-Arginine','Citrulline malate','overlapping nitric-oxide precursors — typically pick one','caution'],
    // Liver / Beef organ + iron + vitamin A
    ['Beef organ complex (desiccated)','Iron','organ powders are high in iron — watch total iron and ferritin','caution'],
    ['Beef organ complex (desiccated)','Vitamin A (retinol, low-dose)','organ powders are high in retinol — risk of exceeding upper limit','caution'],
    ['Cod liver oil','Vitamin A (retinol, low-dose)','cod liver oil contains retinol — risk of exceeding upper limit','caution'],
    ['Cod liver oil','Vitamin D3','cod liver oil contains vitamin D3 — watch total dose','caution'],
    ['Cod liver oil','Beta-carotene (standalone supplement)','overlapping vitamin A activity','caution'],
    ['Sea buckthorn oil (full spectrum)','Vitamin A (retinol, low-dose)','sea buckthorn is rich in carotenoids — overlapping vitamin A activity','caution'],
    ['Sea buckthorn oil (full spectrum)','Beta-carotene (standalone supplement)','overlapping carotenoid load','caution'],
    // BCAAs vs leucine
    ['BCAAs (standalone)','L-Leucine (standalone)','BCAAs already contain leucine — do not double-dose','caution'],
    ['BCAAs (standalone)','EAAs (Essential amino acids)','EAAs already contain BCAAs — pick one','avoid'],
    // Tributyrin / butyrate forms
    ['Tributyrin / Butyrate','Tributyrin (gut barrier, targeted)','same compound — pick one','avoid'],
    ['Tributyrin / Butyrate','Butyrate tributyrin (odourless)','same compound — pick one','avoid'],
    ['Tributyrin / Butyrate','Butyrate (calcium/magnesium)','overlapping butyrate sources — pick one','caution'],
    // Hidden adulterants
    ['Sibutramine (hidden in supplements)','SSRIs (unspecified)','sibutramine is itself an SNRI — serotonin syndrome with SSRIs','avoid'],
    ['Phenolphthalein (hidden laxative)','Senna leaf (Cassia senna)','additive laxative stimulation — watch electrolyte/dehydration risk','avoid'],
    // Senna / cascara overlap
    ['Senna leaf (Cassia senna)','Cascara sagrada','same class of stimulant laxative — pick one','avoid'],
    ['Senna leaf (Cassia senna)','Aloe vera (oral supplement)','additive stimulant-laxative effect; potassium loss','caution'],
    ['Cascara sagrada','Aloe vera (oral supplement)','additive stimulant-laxative effect; potassium loss','caution'],
    // Pennyroyal / sassafras (Tier 4) — clear avoid lookups
    ['Pennyroyal oil (Mentha pulegium)','Acetaminophen (paracetamol)','combined hepatic stress — fatal liver failure reported','avoid'],
    // Tongkat / Fadogia / Turkesterone (T-stack)
    ['Tongkat ali (Eurycoma longifolia)','Tongkat ali (Eurycoma longifolia, standardised)','same herb — pick one','avoid'],
    ['Turkesterone / Ecdysteroids','Tongkat ali (Eurycoma longifolia)','common gym “T-stack” with no human data on safety together','caution'],
    ['Turkesterone / Ecdysteroids','Fadogia agrestis','common gym “T-stack” with no human data on safety together','caution'],
    // Glycine/NAC pair already in groups; flag GlyNAC product overlap
    ['NAC (N-Acetyl Cysteine)','GlyNAC (Glycine + NAC)','GlyNAC already contains NAC — do not double-dose','avoid'],
    ['Glycine','GlyNAC (Glycine + NAC)','GlyNAC already contains glycine — do not double-dose','avoid'],
    // Glutathione precursor overlap
    ['Glutathione (liposomal)','NAC (N-Acetyl Cysteine)','overlapping glutathione support — pick one','caution'],
    ['Glutathione (liposomal)','Glutathione precursors blend','overlapping glutathione support — pick one','caution'],
    ['Glutathione precursors blend','NAC (N-Acetyl Cysteine)','already contains NAC — do not double-dose','avoid'],
    ['Glutathione precursors blend','Glycine','already contains glycine — do not double-dose','avoid'],
    // SAMe + Methylation cofactor overlap (mild)
    ['S-Adenosylmethionine (SAMe)','Betaine (TMG)','overlapping methyl donors — pick one for primary support','caution'],
    ['S-Adenosylmethionine (SAMe)','Betaine TMG (trimethylglycine)','overlapping methyl donors — pick one for primary support','caution'],
    ['Betaine (TMG)','Betaine TMG (trimethylglycine)','same compound — pick one','avoid'],
    // Pomegranate / olive / hawthorn — hypotensive (handled by group); flag duplicates
    ['Olive leaf extract','Olive polyphenol complex (EVOO)','overlapping olive polyphenols — pick one','caution'],
    ['Olive leaf extract','Hydroxytyrosol (olive extract)','overlapping olive polyphenols — pick one','caution'],
    ['Olive leaf extract','Oleuropein (olive extract)','overlapping olive polyphenols — pick one','caution'],
    // Lion's mane forms
    ["Lion's mane mushroom",'Hericium erinaceus mycelium (Amyloban 3399)','same mushroom in two forms — pick one','caution'],
    // Ashwagandha forms
    ['Ashwagandha (KSM-66)','Shoden ashwagandha (high-withanolide)','same herb in two forms — pick one','avoid'],
    // Bilberry — flag w/ blood thinners by adding to bleed group below; also dose-overlap with eye stack
    // Kava forms
    ['Kava (high-dose/extract)','Kava (high-dose/extract)','duplicate entry placeholder','caution'],
    // Sambucol vs Elderberry
    ['Elderberry (Sambucus nigra)','Sambucol (elderberry extract, maintenance)','same berry in two products — pick one','caution'],
    // Phenylpiracetam stacking
    ['Phenylpiracetam (Phenotropil)','Caffeine (standardised)','additive stimulant load — cardiac risk in sensitive users','caution'],
    ['Phenylpiracetam (Phenotropil)','Aniracetam','overlapping racetam class — choline depletion risk','caution'],
    ['Phenylpiracetam (Phenotropil)','Oxiracetam','overlapping racetam class — choline depletion risk','caution'],
    ['Phenylpiracetam (Phenotropil)','Piracetam','overlapping racetam class — choline depletion risk','caution'],
    // Methyl donors overlap watch (Choline + TMG + Folate methylated + B12 methylated)
    ['Betaine (TMG)','Methyl B12 + Methylfolate combo','large combined methyl-donor load — start low to avoid “overmethylation” in sensitive users','caution']
  ],
  // Mechanism groups — every member interacts with every other member with the stated reason/severity.
  groups:{
    bleed:{reason:'additive bleeding / anticoagulant effect',severity:'caution',members:[
      'Omega-3 (EPA/DHA)','Omega-3 DHA-dominant','Omega-3 triglyceride form (rTG)','Algal DHA (vegan omega-3)','Algal EPA (standalone)','Algal oil (vegan DHA/EPA)','Cod liver oil','Krill oil','Calamari oil (high-DHA)','Flaxseed oil (ALA omega-3)','Hemp seed oil','Chia seed oil','Sacha inchi oil (Plukenetia volubilis)','Perilla oil','Perilla seed oil','DHA (standalone, algal)','Green-lipped mussel (Perna canaliculus)','Omega-3-6-9 blends','Omega-7 (Palmitoleic acid)','Resolvins / SPMs (Specialised Pro-resolving Mediators)',
      'Ginkgo biloba','Ginkgo biloba EGb 761','Vitamin E (mixed tocopherols)','Tocotrienols (vitamin E fraction)','Tocotrienols (annatto-derived)','Delta-tocotrienol','Gamma-tocopherol',
      'Curcumin (bioavailable form)','Curcumin Meriva (phytosome)','Meriva curcumin (phytosome)','Turmeric whole root powder',
      'Ginger (Zingiber officinale)','Feverfew (Tanacetum parthenium)','White willow bark (Salix alba)','Meadowsweet (Filipendula ulmaria)',
      'Aged garlic extract (Kyolic)','Black garlic extract','Nattokinase','Lumbrokinase','Serrapeptase','Wobenzym (systemic enzymes)','Bromelain','Papain',
      'Quercetin','Quercetin phytosome + Bromelain','Resveratrol','Pterostilbene + resveratrol combo','Pterostilbene',
      'Dong quai (Angelica sinensis)','Dong quai (Angelica sinensis, low-dose)','Red clover (Trifolium pratense)','Red sage / Danshen (Salvia miltiorrhiza)','Dan Shen compound (Salvia miltiorrhiza)',
      'Horse chestnut (Aesculus)','Gotu kola (Centella asiatica)','Centella asiatica (Gotu kola, standardised TTFCA)',
      'NAC (N-Acetyl Cysteine)','GlyNAC (Glycine + NAC)','Glutathione precursors blend','Fucoidan','Pine bark extract (Pycnogenol)','Pycnogenol (pine bark, branded)','Grape seed extract (OPC)',
      'Saw palmetto (Serenoa repens)','Bilberry extract','Boswellia serrata','Boswellic acids AKBA (standardised)','Black seed oil (Nigella sativa)','Nigella sativa standardised (TQ)','Holy basil (Tulsi)','Korean red ginseng (Panax ginseng)','Panax ginseng','American ginseng (Panax quinquefolius)','Korean red ginseng (fermented)','Cordyceps militaris','Reishi (Ganoderma lucidum)','Bee propolis','Bee pollen','Royal jelly','Vinpocetine','Mastic gum (Pistacia lentiscus)','Maitake mushroom (Grifola frondosa)','Bamboo extract (silica)','Stinging nettle root (Urtica dioica)','Nettle leaf (Urtica dioica leaf)','Borage oil (GLA)','Evening primrose oil (EPO)','Gamma-linolenic acid (GLA)','Squalene','Pomegranate extract (ellagic acid)','Cacao flavanols','Theaflavins (black tea extract)','Epicatechin (dark chocolate flavanol)','Hesperidin','Hesperidin methyl chalcone','Rutin','Diosmin','Naringenin'
    ]},
    serotonin:{reason:'serotonin syndrome risk — do not stack',severity:'avoid',members:[
      '5-HTP','Tryptophan (L-tryptophan)','S-Adenosylmethionine (SAMe)','Saffron (Crocus sativus)','Saffron Affron (standardised extract)','Rhodiola rosea','Rhodiola crenulata','Mucuna pruriens','DLPA (DL-Phenylalanine)','Tianeptine ("gas station heroin")',
      "St. John's Wort",'Methylene blue (pharmaceutical grade)','Sibutramine (hidden in supplements)'
    ]},
    sedation:{reason:'additive CNS sedation — avoid driving / mixing',severity:'caution',members:[
      'Melatonin','Melatonin (0.1-0.5 mg physiological dose)','Melatonin (high-dose, nightly)','Melatonin extended-release','Melatonin gummies (high dose 5–10 mg)',
      'Valerian root','Passionflower (Passiflora incarnata)','Chamomile extract (Matricaria chamomilla)','Lemon balm (Melissa officinalis)','Lavender oil oral (Silexan)','California poppy (Eschscholzia californica)','Skullcap (Scutellaria lateriflora)','Magnolia bark (honokiol + magnolol)','Honokiol (magnolia bark isolate)',
      'Ashwagandha (KSM-66)','Shoden ashwagandha (high-withanolide)','Apigenin','L-Theanine','Glycine','GABA (standalone supplement)','PharmaGABA','Taurine','Taurine (cardiac and metabolic)',
      'CBD (Cannabidiol)','Cannabigerol (CBG)','Kava (high-dose/extract)','Phenibut','Kratom (Mitragyna speciosa)',
      'Bacopa monnieri','Holy basil (Tulsi)','Reishi (Ganoderma lucidum)','Sage extract (Salvia officinalis)','Hops (Humulus lupulus)','Jujube (Ziziphus jujuba)','Polygala tenuifolia (Yuan Zhi)','Damiana (Turnera diffusa)','Mucuna pruriens','Ashitaba (Angelica keiskei)','Sabroxy (Oroxylum indicum)','Butterbur (Petasites hybridus)','Black cohosh (Cimicifuga racemosa)','Black cohosh high-dose','Phosphatidylserine','Phosphatidylserine (plant-derived)','Magnesium glycinate','Magnesium L-threonate','Magnesium taurate','Magnesium bisglycinate','Adaptogen stack (Ashwagandha + Rhodiola)','Lemon verbena extract'
    ]},
    stimulant:{reason:'stimulant stacking — blood pressure / heart rate risk',severity:'caution',members:[
      'Caffeine (standardised)','Guarana (Paullinia cupana)','Yerba mate (Ilex paraguayensis)','Theacrine (TeaCrine)','Green tea extract (EGCG)',
      'Yohimbe bark (Pausinystalia yohimbe)','Yohimbine HCl','Bitter orange (Citrus aurantium)','Synephrine (Citrus aurantium extract)','Higenamine (norcoclaurine, pre-workout)','Methyl synephrine','Ephedra analogues (synephrine)','Ma huang (raw Ephedra herb)','DMAA/DMHA novel stimulant pre-workouts','1,3-DMBA (dimethylbutylamine)','Khat (Catha edulis)','Khat extract (Catha edulis)',
      'Phenylpiracetam (Phenotropil)','Semax (synthetic ACTH analogue)','Nootropic peptide selank (synthetic)','Sibutramine (hidden in supplements)','Clenbuterol (weight loss/muscle)','2,4-Dinitrophenol (DNP)','DNP (2,4-Dinitrophenol)',
      'Rhodiola rosea','Rhodiola crenulata','Eleuthero (Eleutherococcus senticosus)','Korean red ginseng (Panax ginseng)','Panax ginseng','Korean red ginseng (fermented)','American ginseng (Panax quinquefolius)','Cordyceps militaris','Schisandra (Schisandra chinensis)'
    ]},
    hepatotoxic:{reason:'compounded hepatotoxicity risk — monitor ALT/AST',severity:'avoid',members:[
      'Kava (high-dose/extract)','Green tea extract (EGCG)','Usnic acid (weight loss)','Comfrey (Symphytum officinale, oral)','Comfrey root tea (internal)','Coltsfoot (Tussilago farfara)','Borage oil (GLA)','Chaparral (Larrea tridentata)','Germander (Teucrium chamaedrys)','Black cohosh high-dose','Pyrrolizidine alkaloid herbs (comfrey/borage/coltsfoot)','Niacin (Vitamin B3)','Nicotinic acid (Niacin, flush form)','Red yeast rice','Greater celandine (Chelidonium majus)','Fo-Ti (Polygonum multiflorum / He Shou Wu)','He Shou Wu (processed Polygonum multiflorum)','Japanese knotweed (Polygonum cuspidatum)','Japanese knotweed (Reynoutria japonica)','Aristolochic acid (in some herbal products)','Thunder god vine (Tripterygium wilfordii)',
      'Pennyroyal oil (Mentha pulegium)','Sassafras oil','Calamus root (Acorus calamus)','Garcinia cambogia (HCA)','Hydrazine sulfate','Korean mistletoe (Viscum album)','Ashwagandha (KSM-66)','Shoden ashwagandha (high-withanolide)','Turmeric whole root powder','Curcumin (bioavailable form)','Turkesterone / Ecdysteroids','SARMs (Selective Androgen Receptor Modulators)','Andarine (S-4, SARM)','Ostarine (MK-2866/Enobosarm, SARM)','Methyl-1-testosterone (oral steroid)','Androstenedione (prohormone)','DHEA (Dehydroepiandrosterone)','Black cohosh (Cimicifuga racemosa)','Aloe vera (oral supplement)','Senna leaf (Cassia senna)','Cascara sagrada','Tung oil tree extract (Vernicia fordii)','Camphor oil (oral)','Oil of wintergreen (oral)'
    ]},
    hypoglycemic:{reason:'additive glucose-lowering — hypoglycaemia risk',severity:'caution',members:[
      'Berberine','Berberine HCl (sustained release)','Dihydroberberine (DHB)','Berberine + Ceylon cinnamon combo','Berberine-containing Coptis (Huang Lian)','Barberry (Berberis vulgaris)','Berberis aristata (Indian barberry)',
      'Gymnema sylvestre','Bitter melon (Momordica charantia)','Banaba leaf (corosolic acid)','Fenugreek (Trigonella foenum-graecum)','Fenugreek seed extract (Testofen / standardised)','Cinnamon extract (Ceylon)','Chromium picolinate','Chromium nicotinate (polynicotinate)','Alpha-Lipoic Acid (ALA)','R-Alpha lipoic acid','White mulberry leaf (Morus alba)','Salacia reticulata','Pterocarpus marsupium (Vijaysar)','Myo-inositol','D-Chiro Inositol','Inositol myo-form (PCOS/metabolic)',
      'Apple cider vinegar (supplement)','Holy basil (Tulsi)','Goldenseal (Hydrastis canadensis)','Maitake mushroom (Grifola frondosa)','Aloe vera (oral supplement)','Goji berry extract (Lycium barbarum)','Lycium barbarum (goji berry extract, standardised)','5-ALA (5-aminolevulinic acid)','Bergamot citrus polyphenol extract','Nopal cactus / Prickly pear (Opuntia ficus-indica)','Ecklonia cava (brown seaweed)','Damiana (Turnera diffusa)','Chromium GTF (brewer\'s yeast form)','Vanadium','Olive leaf extract','Oat beta-glucan (cholesterol)','Glucomannan (konjac root)','White kidney bean extract'
    ]},
    hypotensive:{reason:'additive blood-pressure lowering — monitor BP',severity:'caution',members:[
      'CoQ10 (Ubiquinol)','CoQ10 (ubiquinone, classic form)','Hawthorn berry (Crataegus)','Olive leaf extract','Olive polyphenol complex (EVOO)','Hydroxytyrosol (olive extract)','Oleuropein (olive extract)','Taurine','Taurine (cardiac and metabolic)','Dietary Nitrate / Beetroot','Magnesium taurate','Arjuna bark (Terminalia arjuna)','Terminalia arjuna (Arjuna standardised extract)','L-Arginine','Citrulline (L-citrulline, pure form)','Citrulline malate','Aged garlic extract (Kyolic)','Pine bark extract (Pycnogenol)',
      'MitoQ','Pomegranate extract (ellagic acid)','Reishi (Ganoderma lucidum)','Holy basil (Tulsi)','Cacao flavanols','Theaflavins (black tea extract)','Hibiscus (Hibiscus sabdariffa)','Magnesium','Magnesium glycinate','Magnesium L-threonate','Magnesium bisglycinate','Magnesium citrate','Magnesium chloride (topical)','Quercetin','Quercetin phytosome + Bromelain','Resveratrol','Pterostilbene','Bergamot citrus polyphenol extract'
    ]},
    seizure_lowering:{reason:'may lower seizure threshold together',severity:'caution',members:[
      'Ginkgo biloba','Ginkgo biloba EGb 761','Evening primrose oil (EPO)','Borage oil (GLA)','Huperzine A','Caffeine (standardised)','Wormwood high-dose (Artemisia absinthium)','Sage extract (Salvia officinalis)','Rosemary extract (carnosic acid)','Camphor oil (oral)','Phenibut','Kratom (Mitragyna speciosa)','Phenylpiracetam (Phenotropil)'
    ]},
    nephrotoxic_minerals:{reason:'renal stress when stacked — space doses and hydrate',severity:'caution',members:[
      'Vitamin C (megadose)','Calcium','Calcium carbonate/citrate (bone health)','Calcium hydroxyapatite (MCHC)','Coral calcium','Calcium D-glucarate','Calcium fructoborate','Calcium alpha-ketoglutarate (Ca-AKG)','Calcium pantothenate (Vitamin B5)','D-Mannose','Cranberry extract','Cranberry PAC (A-type proanthocyanidins)','Uva ursi (Arctostaphylos uva-ursi)','Horsetail (Equisetum)','Phosphoric acid (urinary)','Strontium (strontium citrate)','Vanadium','Boron','Boron glycinate','Borax (boron supplement form)'
    ]},
    heavy_metal_risk:{reason:'products overlap on lead / arsenic / mercury contamination — avoid stacking',severity:'avoid',members:[
      'Ayurvedic rasayana blends','Shilajit (Mumie)','Colloidal silver','Colloidal gold','Colloidal minerals','Silver protein (mild silver protein)','Sea moss (Irish moss)','Kelp (iodine-rich)','Bladderwrack (Fucus vesiculosus)','Spirulina','Chlorella','Phycocyanin (spirulina blue pigment)','Blue-green algae (AFA)','Beef organ complex (desiccated)','Bentonite clay (oral)','Diatomaceous earth (food grade)','Zeolite (clinoptilolite)','Bone broth protein','Cesium chloride (alkaline therapy)','Cesium chloride (high pH therapy)','Calomel (mercurous chloride)','Miracle Mineral Supplement (MMS / chlorine dioxide)','Sodium chlorite (MMS/Miracle Mineral Supplement)','Aristolochic acid (in some herbal products)'
    ]},
    // ── 2026-04-25: new mechanism groups (negative-interaction expansion) ──
    thyroid_modulator:{reason:'compounds thyroid hormone effect — risk of hyper/hypothyroid swings',severity:'caution',members:[
      'Iodine','Kelp (iodine-rich)','Bladderwrack (Fucus vesiculosus)','Sea moss (Irish moss)','Tiratricol (TRIAC, thyroid hormone analogue)','Raw thyroid glandulars','Thyroid glandular supplements (desiccated)','Selenium','Ashwagandha (KSM-66)','Shoden ashwagandha (high-withanolide)','Guggul (Commiphora mukul)','Coleus forskohlii (Forskolin)','Lithium orotate (low-dose)','Fucoxanthin'
    ]},
    potassium_loss:{reason:'compounded potassium loss / electrolyte disturbance — risk of arrhythmia',severity:'caution',members:[
      'Licorice root (high-dose/chronic)','Licorice root high-dose','Diuretic supplements (herbal water pills)','Senna leaf (Cassia senna)','Cascara sagrada','Aloe vera (oral supplement)','Phenolphthalein (hidden laxative)','Dandelion root (Taraxacum officinale)','Horsetail (Equisetum)','Uva ursi (Arctostaphylos uva-ursi)','Apple cider vinegar (supplement)','Hibiscus (Hibiscus sabdariffa)','Goldenseal (Hydrastis canadensis)'
    ]},
    vitamin_a_overlap:{reason:'overlapping retinol / carotenoid load — risk of exceeding upper limit',severity:'caution',members:[
      'Vitamin A (retinol, low-dose)','Beta-carotene (standalone supplement)','Mixed carotenoids','Cod liver oil','Sea buckthorn oil (full spectrum)','Beef organ complex (desiccated)','Astaxanthin','Lutein + Zeaxanthin','Lutein (standalone)','Zeaxanthin (standalone)','Lycopene','High-dose fat-soluble vitamins (A, E)','Multivitamins (healthy adults)'
    ]},
    estrogen_modulator:{reason:'overlapping estrogen-pathway modulation — may interfere with endocrine balance or HRT',severity:'caution',members:[
      'Soy isoflavones','Red clover (Trifolium pratense)','Pueraria mirifica (Kwao Krua)','Black cohosh (Cimicifuga racemosa)','Black cohosh high-dose','Dong quai (Angelica sinensis)','Dong quai (Angelica sinensis, low-dose)','Vitex / Chasteberry (Vitex agnus-castus)','Chasteberry/Vitex standardised (BNO 1095)','Maca (Lepidium meyenii)','Hops (Humulus lupulus)','DIM (Diindolylmethane)','Diindolylmethane (DIM)','Indole-3-Carbinol (I3C)','Indole-3-Carbinol (I3C)','Calcium D-glucarate','Wild yam (Dioscorea villosa)','Sage extract (Salvia officinalis)','White peony (Paeonia lactiflora)','Shatavari (Asparagus racemosus)','Kudzu (Pueraria lobata)'
    ]},
    immune_stimulant:{reason:'compounded immune activation — counteracts immunosuppressants; flare risk in autoimmune disease',severity:'caution',members:[
      'Echinacea purpurea','Astragalus (Astragalus membranaceus)','Astragalus membranaceus (Huang Qi)','Astragaloside IV (isolated)','Cycloastragenol (TA-65)',"Cat's claw (Uncaria tomentosa)",'Andrographis paniculata','Andrographis (maintenance dose)','Andrographis + Echinacea combo','Elderberry (Sambucus nigra)','Sambucol (elderberry extract, maintenance)','Reishi (Ganoderma lucidum)','Cordyceps militaris','Maitake mushroom (Grifola frondosa)','Shiitake extract (lentinan)','Turkey tail (Trametes versicolor)','Coriolus versicolor PSP/PSK (turkey tail polysaccharide)','Chaga (Inonotus obliquus)','Mushroom complex (multi-species)','Beta-glucan (1,3/1,6)','Saccharomyces cerevisiae beta-glucan','Korean mistletoe (Viscum album)','Larch arabinogalactan','Pelargonium sidoides (Umckaloabo)','Spirulina','Phycocyanin (spirulina blue pigment)','Lactoferrin','Colostrum (bovine)','AHCC (active hexose correlated compound)','Agaricus blazei (Royal Sun mushroom)'
    ]},
    androgenic:{reason:'overlapping androgenic / hormonal-precursor load — endocrine and hepatic risk',severity:'caution',members:[
      'DHEA (Dehydroepiandrosterone)','7-Keto DHEA','DHEA topical cream','Pregnenolone','Androstenedione (prohormone)','Androsterone','Methyl-1-testosterone (oral steroid)','Tongkat ali (Eurycoma longifolia)','Tongkat ali (Eurycoma longifolia, standardised)','Fadogia agrestis','Tribulus terrestris','Turkesterone / Ecdysteroids','Fenugreek seed extract (Testofen / standardised)','Pine pollen extract','Horny goat weed (Epimedium)','Icariin (Epimedium extract)','Cistanche tubulosa (Rou Cong Rong)','Cistanche deserticola','Maca (Lepidium meyenii)','SARMs (Selective Androgen Receptor Modulators)','Andarine (S-4, SARM)','Ostarine (MK-2866/Enobosarm, SARM)','Ashwagandha (KSM-66)','Shoden ashwagandha (high-withanolide)','D-Aspartic acid'
    ]}
  }
};
/* ──────────────────────────────────────────────────────────────────────────
   Phase 2 / Item #2 — DRUG_INTERACTIONS
   Drug↔supplement interactions parallel to SUPP_INTERACTIONS. Three layers:

   1. drug_groups: drug-class definitions (SSRIs, statins, anticoagulants…). Each
      class maps to a supp_group key from SUPP_INTERACTIONS.groups, so adding any
      member of a supp_group automatically flags it against every member of the
      drug class. This keeps coverage scaling without explicit per-pair rows.

   2. drugs: ~50 of the most-prescribed drugs in the US, each mapped to a class.
      Generic + common brand names. Lets users enter "atorvastatin" or "Lipitor"
      and have it resolve to the statin class.

   3. pairs: drug-specific overrides where the class-level rule isn't sharp enough.
      e.g. warfarin × vitamin K2 needs an explicit "avoid" severity even though
      the broader anticoagulant×bleed interaction is just "caution".

   Backward compat: the existing MEDS constant in data.js is preserved for the
   chip-style class picker in My Profile. DRUG_INTERACTIONS adds drug-level
   granularity on top.
   See docs/drug-interactions-policy.md for the policy and rationale. */
const DRUG_INTERACTIONS={
  drug_groups:{
    anticoagulant:{label:'Anticoagulants / blood thinners',severity:'avoid',supp_group:'bleed',mechanism:'additive bleeding / clotting interference',disclaimer:'Consult your anticoagulation clinic before any supplement change.'},
    antiplatelet:{label:'Antiplatelets (aspirin, clopidogrel)',severity:'caution',supp_group:'bleed',mechanism:'additive antiplatelet effect — bruising / bleeding risk'},
    ssri:{label:'SSRIs / SNRIs (antidepressants)',severity:'avoid',supp_group:'serotonin',mechanism:'serotonin syndrome risk — combined serotonergic load'},
    maoi:{label:'MAOIs',severity:'avoid',supp_group:'serotonin',mechanism:'severe serotonergic / hypertensive crisis risk'},
    tricyclic:{label:'Tricyclic antidepressants',severity:'caution',supp_group:'serotonin',mechanism:'additive serotonergic and anticholinergic effects'},
    statin:{label:'Statins (cholesterol)',severity:'caution',supp_group:'hepatotoxic',mechanism:'additive hepatic load — monitor liver enzymes'},
    metformin:{label:'Metformin',severity:'caution',supp_group:'hypoglycemic',mechanism:'additive glucose-lowering — hypoglycemia risk'},
    sulfonylurea:{label:'Sulfonylureas (glipizide, glyburide)',severity:'caution',supp_group:'hypoglycemic',mechanism:'additive hypoglycemia risk — narrower therapeutic window'},
    insulin:{label:'Insulin',severity:'caution',supp_group:'hypoglycemic',mechanism:'additive glucose-lowering — risk of severe hypoglycemia'},
    sglt2:{label:'SGLT2 inhibitors (empagliflozin, dapagliflozin)',severity:'caution',supp_group:'hypoglycemic',mechanism:'additive glucose-lowering plus dehydration risk'},
    glp1:{label:'GLP-1 agonists (semaglutide, liraglutide)',severity:'caution',supp_group:'hypoglycemic',mechanism:'additive glucose-lowering and gastric emptying delays — affects supplement absorption'},
    levothyroxine:{label:'Levothyroxine',severity:'caution',supp_group:'thyroid_modulator',mechanism:'absorption interference with minerals and altered thyroid load with iodine/adaptogens',disclaimer:'Take levothyroxine ≥4 hours apart from any mineral supplement.'},
    ppi:{label:'PPIs (omeprazole, esomeprazole)',severity:'caution',supp_group:null,mechanism:'long-term PPIs deplete magnesium and B12 — supplementation often indicated'},
    h2_blocker:{label:'H2 blockers (famotidine, ranitidine)',severity:'caution',supp_group:null,mechanism:'reduce gastric acid — affects mineral and B12 absorption'},
    bp_med:{label:'Blood-pressure medication',severity:'caution',supp_group:'hypotensive',mechanism:'additive hypotension risk'},
    ace_arb:{label:'ACE inhibitors / ARBs',severity:'caution',supp_group:'potassium_loss',mechanism:'potassium handling — risk of hyperkalemia with supplemental potassium'},
    diuretic:{label:'Diuretics (furosemide, HCTZ)',severity:'caution',supp_group:'potassium_loss',mechanism:'electrolyte loss — potassium and magnesium often depleted'},
    nsaid:{label:'NSAIDs (ibuprofen, naproxen)',severity:'caution',supp_group:'bleed',mechanism:'additive bleeding risk; long-term NSAIDs deplete gut lining'},
    benzo:{label:'Benzodiazepines (alprazolam, lorazepam)',severity:'caution',supp_group:'sedation',mechanism:'additive CNS depression'},
    z_drug:{label:'Non-benzo sleep aids (zolpidem, eszopiclone)',severity:'caution',supp_group:'sedation',mechanism:'additive CNS depression'},
    opioid:{label:'Opioids',severity:'avoid',supp_group:'sedation',mechanism:'severe additive CNS and respiratory depression'},
    antibiotic:{label:'Antibiotics',severity:'caution',supp_group:null,mechanism:'mineral chelation interferes with antibiotic absorption — space ≥2 h; probiotics often beneficial during/after course'},
    chemo:{label:'Chemotherapy',severity:'avoid',supp_group:null,mechanism:'antioxidants may interfere with chemo efficacy — clear all supplements with oncology team',disclaimer:'No supplement changes without oncology approval.'},
    immuno:{label:'Immunosuppressants',severity:'avoid',supp_group:'immune_stimulant',mechanism:'immune-stimulant supplements counteract immunosuppressive therapy'},
    cortico:{label:'Corticosteroids (prednisone)',severity:'caution',supp_group:null,mechanism:'long-term steroids deplete calcium, vitamin D, and zinc — supplementation indicated'},
    seizure:{label:'Anti-seizure medications',severity:'caution',supp_group:'seizure_lowering',mechanism:'lowered seizure threshold; some anti-epileptics deplete folate and vitamin D'},
    lithium:{label:'Lithium',severity:'caution',supp_group:'thyroid_modulator',mechanism:'iodine, NSAIDs and certain herbs alter lithium levels and thyroid function'},
    ocp:{label:'Oral contraceptive pill',severity:'caution',supp_group:null,mechanism:"St. John's Wort and CYP3A4 inducers reduce OCP efficacy — contraception failure risk"},
    antifungal:{label:'Azole antifungals',severity:'caution',supp_group:'hepatotoxic',mechanism:'CYP-mediated drug interactions and additive hepatic load'},
    antiretroviral:{label:'HIV antiretrovirals',severity:'avoid',supp_group:null,mechanism:"St. John's Wort and CYP inducers can drop antiretroviral levels — virologic failure risk"},
    digoxin:{label:'Digoxin',severity:'avoid',supp_group:null,mechanism:'narrow therapeutic window — many supplements (St John\'s Wort, calcium, magnesium, fiber) shift levels'}
  },
  drugs:{
    // Cardiovascular — statins
    'atorvastatin':{label:'Atorvastatin',class:'statin',brand:['Lipitor']},
    'simvastatin':{label:'Simvastatin',class:'statin',brand:['Zocor']},
    'rosuvastatin':{label:'Rosuvastatin',class:'statin',brand:['Crestor']},
    'pravastatin':{label:'Pravastatin',class:'statin',brand:['Pravachol']},
    'lovastatin':{label:'Lovastatin',class:'statin',brand:['Mevacor']},
    // Cardiovascular — BP
    'lisinopril':{label:'Lisinopril',class:'ace_arb',brand:['Prinivil','Zestril']},
    'enalapril':{label:'Enalapril',class:'ace_arb',brand:['Vasotec']},
    'losartan':{label:'Losartan',class:'ace_arb',brand:['Cozaar']},
    'valsartan':{label:'Valsartan',class:'ace_arb',brand:['Diovan']},
    'amlodipine':{label:'Amlodipine',class:'bp_med',brand:['Norvasc']},
    'metoprolol':{label:'Metoprolol',class:'bp_med',brand:['Lopressor','Toprol XL']},
    'carvedilol':{label:'Carvedilol',class:'bp_med',brand:['Coreg']},
    'hydrochlorothiazide':{label:'Hydrochlorothiazide (HCTZ)',class:'diuretic',brand:['Microzide']},
    'furosemide':{label:'Furosemide',class:'diuretic',brand:['Lasix']},
    // Anticoagulants
    'warfarin':{label:'Warfarin',class:'anticoagulant',brand:['Coumadin','Jantoven']},
    'apixaban':{label:'Apixaban',class:'anticoagulant',brand:['Eliquis']},
    'rivaroxaban':{label:'Rivaroxaban',class:'anticoagulant',brand:['Xarelto']},
    'dabigatran':{label:'Dabigatran',class:'anticoagulant',brand:['Pradaxa']},
    'aspirin':{label:'Aspirin (low-dose, cardiac)',class:'antiplatelet'},
    'clopidogrel':{label:'Clopidogrel',class:'antiplatelet',brand:['Plavix']},
    // Diabetes
    'metformin':{label:'Metformin',class:'metformin',brand:['Glucophage']},
    'glipizide':{label:'Glipizide',class:'sulfonylurea',brand:['Glucotrol']},
    'glyburide':{label:'Glyburide',class:'sulfonylurea',brand:['DiaBeta','Glynase']},
    'insulin':{label:'Insulin (any form)',class:'insulin'},
    'empagliflozin':{label:'Empagliflozin',class:'sglt2',brand:['Jardiance']},
    'dapagliflozin':{label:'Dapagliflozin',class:'sglt2',brand:['Farxiga']},
    'semaglutide':{label:'Semaglutide',class:'glp1',brand:['Ozempic','Wegovy','Rybelsus']},
    'liraglutide':{label:'Liraglutide',class:'glp1',brand:['Victoza','Saxenda']},
    'tirzepatide':{label:'Tirzepatide',class:'glp1',brand:['Mounjaro','Zepbound']},
    // Thyroid
    'levothyroxine':{label:'Levothyroxine',class:'levothyroxine',brand:['Synthroid','Levoxyl','Tirosint']},
    // GI
    'omeprazole':{label:'Omeprazole',class:'ppi',brand:['Prilosec']},
    'esomeprazole':{label:'Esomeprazole',class:'ppi',brand:['Nexium']},
    'pantoprazole':{label:'Pantoprazole',class:'ppi',brand:['Protonix']},
    'lansoprazole':{label:'Lansoprazole',class:'ppi',brand:['Prevacid']},
    'famotidine':{label:'Famotidine',class:'h2_blocker',brand:['Pepcid']},
    // Mental health
    'sertraline':{label:'Sertraline',class:'ssri',brand:['Zoloft']},
    'fluoxetine':{label:'Fluoxetine',class:'ssri',brand:['Prozac']},
    'citalopram':{label:'Citalopram',class:'ssri',brand:['Celexa']},
    'escitalopram':{label:'Escitalopram',class:'ssri',brand:['Lexapro']},
    'paroxetine':{label:'Paroxetine',class:'ssri',brand:['Paxil']},
    'venlafaxine':{label:'Venlafaxine',class:'ssri',brand:['Effexor']},
    'duloxetine':{label:'Duloxetine',class:'ssri',brand:['Cymbalta']},
    'bupropion':{label:'Bupropion',class:'tricyclic',brand:['Wellbutrin']},
    'amitriptyline':{label:'Amitriptyline',class:'tricyclic',brand:['Elavil']},
    'trazodone':{label:'Trazodone',class:'tricyclic'},
    // Sleep / anxiety
    'alprazolam':{label:'Alprazolam',class:'benzo',brand:['Xanax']},
    'lorazepam':{label:'Lorazepam',class:'benzo',brand:['Ativan']},
    'clonazepam':{label:'Clonazepam',class:'benzo',brand:['Klonopin']},
    'zolpidem':{label:'Zolpidem',class:'z_drug',brand:['Ambien']},
    'eszopiclone':{label:'Eszopiclone',class:'z_drug',brand:['Lunesta']},
    // Pain
    'ibuprofen':{label:'Ibuprofen',class:'nsaid',brand:['Advil','Motrin']},
    'naproxen':{label:'Naproxen',class:'nsaid',brand:['Aleve','Naprosyn']},
    'tramadol':{label:'Tramadol',class:'opioid',brand:['Ultram']},
    'oxycodone':{label:'Oxycodone',class:'opioid',brand:['OxyContin']},
    'gabapentin':{label:'Gabapentin',class:'seizure',brand:['Neurontin']},
    // Antibiotics / antifungals
    'amoxicillin':{label:'Amoxicillin',class:'antibiotic'},
    'azithromycin':{label:'Azithromycin',class:'antibiotic',brand:['Zithromax','Z-Pak']},
    'ciprofloxacin':{label:'Ciprofloxacin',class:'antibiotic',brand:['Cipro']},
    'doxycycline':{label:'Doxycycline',class:'antibiotic'},
    'fluconazole':{label:'Fluconazole',class:'antifungal',brand:['Diflucan']},
    'ketoconazole':{label:'Ketoconazole',class:'antifungal'},
    // Hormonal / steroids
    'prednisone':{label:'Prednisone',class:'cortico'},
    'levonorgestrel':{label:'Oral contraceptive (combined)',class:'ocp'},
    // Other
    'lithium':{label:'Lithium',class:'lithium'},
    'digoxin':{label:'Digoxin',class:'digoxin'},
    'phenytoin':{label:'Phenytoin',class:'seizure',brand:['Dilantin']},
    'valproate':{label:'Valproate',class:'seizure',brand:['Depakote']},
    'cyclosporine':{label:'Cyclosporine',class:'immuno'},
    'tacrolimus':{label:'Tacrolimus',class:'immuno',brand:['Prograf']}
  },
  // Drug-specific overrides — the class-level rule isn't sharp enough.
  pairs:[
    {drug:'warfarin',supp:'Vitamin K2 (MK-7)',severity:'avoid',mechanism:'direct antagonism — K2 reduces warfarin efficacy and destabilizes INR',evidence:'A',source:'FDA label (Coumadin) + DrugBank DB00682'},
    {drug:'warfarin',supp:'Vitamin K1 (Phylloquinone)',severity:'avoid',mechanism:'direct antagonism — used as warfarin reversal agent',evidence:'A',source:'FDA label (Coumadin)'},
    {drug:'warfarin',supp:"St. John's Wort",severity:'avoid',mechanism:'CYP3A4 induction lowers warfarin levels — unstable INR',evidence:'A',source:'FDA label (Coumadin)'},
    {drug:'levothyroxine',supp:'Calcium',severity:'caution',mechanism:'reduces levothyroxine absorption ~30% — space by ≥4 h',evidence:'A',source:'FDA label (Synthroid)'},
    {drug:'levothyroxine',supp:'Iron',severity:'caution',mechanism:'reduces levothyroxine absorption — space by ≥4 h',evidence:'A',source:'FDA label (Synthroid)'},
    {drug:'levothyroxine',supp:'Magnesium',severity:'caution',mechanism:'forms insoluble complexes with levothyroxine — space by ≥4 h',evidence:'B',source:'FDA label (Synthroid)'},
    {drug:'metformin',supp:'Vitamin B12',severity:'extra',mechanism:'metformin depletes B12 — supplementation often indicated; monitor levels every 1-2 years',evidence:'A',source:'NIH ODS B12 fact sheet'},
    {drug:'omeprazole',supp:'Magnesium',severity:'extra',mechanism:'long-term PPIs deplete magnesium — supplementation may be indicated; monitor levels',evidence:'A',source:'FDA safety communication 2011'},
    {drug:'omeprazole',supp:'Vitamin B12',severity:'extra',mechanism:'PPIs reduce gastric acid needed for B12 absorption — supplementation often indicated',evidence:'A',source:'NIH ODS B12 fact sheet'},
    {drug:'simvastatin',supp:'CoQ10 (Ubiquinol)',severity:'extra',mechanism:'statins deplete CoQ10 — ubiquinol supplementation clinically supported for muscle symptoms',evidence:'B',source:'NCCIH + multiple RCTs'},
    {drug:'atorvastatin',supp:'CoQ10 (Ubiquinol)',severity:'extra',mechanism:'statins deplete CoQ10 — ubiquinol supplementation clinically supported',evidence:'B',source:'NCCIH'},
    {drug:'rosuvastatin',supp:'CoQ10 (Ubiquinol)',severity:'extra',mechanism:'statins deplete CoQ10 — ubiquinol supplementation clinically supported',evidence:'B',source:'NCCIH'},
    {drug:'sertraline',supp:'5-HTP',severity:'avoid',mechanism:'serotonin syndrome — direct precursor stacking on SSRI activity',evidence:'A',source:'FDA label (Zoloft)'},
    {drug:'sertraline',supp:'Tryptophan',severity:'avoid',mechanism:'serotonin syndrome — precursor stacking on SSRI activity',evidence:'A',source:'FDA label'},
    {drug:'sertraline',supp:"St. John's Wort",severity:'avoid',mechanism:'serotonin syndrome — additive serotonergic plus CYP3A4 induction',evidence:'A',source:'FDA label'},
    {drug:'fluoxetine',supp:'5-HTP',severity:'avoid',mechanism:'serotonin syndrome — direct precursor stacking',evidence:'A',source:'FDA label (Prozac)'},
    {drug:'levonorgestrel',supp:"St. John's Wort",severity:'avoid',mechanism:'CYP3A4 induction reduces oral contraceptive efficacy — contraception failure risk',evidence:'A',source:'FDA boxed warning'},
    {drug:'cyclosporine',supp:"St. John's Wort",severity:'avoid',mechanism:'CYP3A4 + P-gp induction lowers cyclosporine levels — transplant rejection risk documented',evidence:'A',source:'FDA boxed warning + multiple case reports'},
    {drug:'tacrolimus',supp:"St. John's Wort",severity:'avoid',mechanism:'CYP3A4 induction lowers tacrolimus levels — transplant rejection risk',evidence:'A',source:'FDA boxed warning'},
    {drug:'digoxin',supp:"St. John's Wort",severity:'avoid',mechanism:'P-glycoprotein induction lowers digoxin levels — therapeutic failure',evidence:'A',source:'FDA label'},
    {drug:'lithium',supp:'Iodine',severity:'caution',mechanism:'iodine + lithium combine to suppress thyroid — monitor TSH',evidence:'B',source:'NIH ODS iodine fact sheet'},
    {drug:'prednisone',supp:'Calcium',severity:'extra',mechanism:'corticosteroids deplete calcium — supplementation indicated for bone protection',evidence:'A',source:'ACR osteoporosis guidance'},
    {drug:'prednisone',supp:'Vitamin D3',severity:'extra',mechanism:'corticosteroids reduce vitamin D activity — supplementation indicated',evidence:'A',source:'ACR osteoporosis guidance'},
    {drug:'phenytoin',supp:'Folate (5-MTHF)',severity:'extra',mechanism:'phenytoin depletes folate — supplementation indicated; coordinate with prescriber for dose',evidence:'A',source:'NIH ODS folate fact sheet'},
    {drug:'phenytoin',supp:'Vitamin D3',severity:'extra',mechanism:'phenytoin accelerates vitamin D metabolism — supplementation indicated',evidence:'A',source:'NIH ODS vitamin D fact sheet'},
    {drug:'valproate',supp:'L-Carnitine',severity:'extra',mechanism:'valproate depletes carnitine — supplementation indicated, particularly in pediatric or hepatic patients',evidence:'A',source:'AAN guideline'},
    {drug:'ciprofloxacin',supp:'Calcium',severity:'caution',mechanism:'mineral chelation reduces fluoroquinolone absorption — space by ≥2 h',evidence:'A',source:'FDA label'},
    {drug:'ciprofloxacin',supp:'Iron',severity:'caution',mechanism:'mineral chelation — space by ≥2 h',evidence:'A',source:'FDA label'},
    {drug:'doxycycline',supp:'Calcium',severity:'caution',mechanism:'tetracycline-mineral chelation — space by ≥2 h',evidence:'A',source:'FDA label'},
    {drug:'ibuprofen',supp:'Probiotics',severity:'extra',mechanism:'long-term NSAID use depletes gut lining — probiotics may help',evidence:'B',source:'multiple RCTs'},
    {drug:'furosemide',supp:'Potassium citrate',severity:'extra',mechanism:'loop diuretics waste potassium — supplementation often clinically indicated',evidence:'A',source:'standard of care'},
    {drug:'furosemide',supp:'Magnesium',severity:'extra',mechanism:'loop diuretics waste magnesium — supplementation often indicated',evidence:'A',source:'standard of care'}
  ]
};
// ── Build lookup structures ──
const _pairPartner=new Map();SUPP_INTERACTIONS.pairs.forEach(([a,b])=>{if(!_pairPartner.has(a))_pairPartner.set(a,new Set());_pairPartner.get(a).add(b);if(!_pairPartner.has(b))_pairPartner.set(b,new Set());_pairPartner.get(b).add(a);});
function getPairPartners(name){return _pairPartner.has(name)?[..._pairPartner.get(name)]:[];}
/* Phase 2 helpers — drug↔supplement interaction lookups.
   drugClassFor: resolves "atorvastatin" or "Lipitor" → "statin" class key.
   getDrugSuppCautions(suppName, drugList): returns conflict records {drug,severity,mechanism,source}. */
const _brandToDrug=new Map();
Object.entries(DRUG_INTERACTIONS.drugs).forEach(([k,v])=>{(v.brand||[]).forEach(b=>_brandToDrug.set(b.toLowerCase(),k));});
function drugClassFor(drug){if(!drug)return null;const k=String(drug).toLowerCase().trim();if(DRUG_INTERACTIONS.drugs[k])return DRUG_INTERACTIONS.drugs[k].class;if(_brandToDrug.has(k)){const generic=_brandToDrug.get(k);return DRUG_INTERACTIONS.drugs[generic]&&DRUG_INTERACTIONS.drugs[generic].class;}return null;}
function resolveDrugKey(drug){if(!drug)return null;const k=String(drug).toLowerCase().trim();if(DRUG_INTERACTIONS.drugs[k])return k;if(_brandToDrug.has(k))return _brandToDrug.get(k);return null;}
/* Lookup: for a given supplement and a list of drugs the user takes, return all conflicts.
   Resolves through three layers — explicit pair → drug-class supp_group → MEDS class fallback. */
function getDrugSuppCautions(suppName,drugs){if(!suppName||!drugs||!drugs.length)return[];const out=[];const seen=new Set();
  const drugKeys=drugs.map(resolveDrugKey).filter(Boolean);
  // Layer 1: explicit pairs
  for(const p of DRUG_INTERACTIONS.pairs){if(drugKeys.includes(p.drug)&&p.supp===suppName){const sig=p.drug+'|'+p.severity+'|'+p.mechanism;if(!seen.has(sig)){seen.add(sig);out.push({drug:p.drug,drug_label:(DRUG_INTERACTIONS.drugs[p.drug]||{}).label||p.drug,severity:p.severity,mechanism:p.mechanism,source:p.source||''});}}}
  // Layer 2: drug-class via supp_group
  const suppGroups=new Set();for(const[gk,g]of Object.entries(SUPP_INTERACTIONS.groups)){if((g.members||[]).includes(suppName))suppGroups.add(gk);}
  for(const k of drugKeys){const cls=drugClassFor(k);if(!cls)continue;const gd=DRUG_INTERACTIONS.drug_groups[cls];if(!gd||!gd.supp_group)continue;if(suppGroups.has(gd.supp_group)){const sig=k+'|'+gd.severity+'|'+gd.mechanism;if(!seen.has(sig)){seen.add(sig);out.push({drug:k,drug_label:(DRUG_INTERACTIONS.drugs[k]||{}).label||k,severity:gd.severity,mechanism:gd.mechanism,source:'class:'+cls});}}}
  return out;}
/* Convenience: for an ARRAY of supplement names (a stack), return all drug-conflicts grouped by supplement. */
function computeDrugStackConflicts(suppNames,drugs){const out={};(suppNames||[]).forEach(n=>{const c=getDrugSuppCautions(n,drugs||[]);if(c.length)out[n]=c;});return out;}
/* Bridge to the existing MEDS class-level data (the chip picker in My Profile). For each
   class the user has selected (e.g. 'ssri', 'statin'), check if the supplement is in any
   of avoid/caution/extra. Returns conflicts in the same shape as getDrugSuppCautions for
   uniform rendering. */
function getMedClassConflicts(suppName,medClassKeys){
  if(!suppName||!medClassKeys||!medClassKeys.size&&!medClassKeys.length)return[];
  const keys=medClassKeys.size?Array.from(medClassKeys):medClassKeys;
  const out=[];
  for(const k of keys){
    const m=(typeof MEDS!=='undefined')?MEDS[k]:null;
    if(!m)continue;
    if(m.avoid&&m.avoid.includes(suppName))out.push({drug:k,drug_label:m.label,severity:'avoid',mechanism:m.note,source:'class'});
    else if(m.caution&&m.caution.includes(suppName))out.push({drug:k,drug_label:m.label,severity:'caution',mechanism:m.note,source:'class'});
    else if(m.extra&&m.extra.includes(suppName))out.push({drug:k,drug_label:m.label,severity:'extra',mechanism:m.note,source:'class'});
  }
  return out;
}
/* Combined: drug-class conflicts + specific-drug conflicts, deduped by severity+mechanism. */
function getAllDrugConflicts(suppName,medClassKeys,specificDrugs){
  const a=getMedClassConflicts(suppName,medClassKeys||new Set());
  const b=getDrugSuppCautions(suppName,specificDrugs||[]);
  const seen=new Set();const out=[];
  for(const c of[...a,...b]){const sig=c.drug+'|'+c.severity+'|'+(c.mechanism||'').slice(0,80);if(!seen.has(sig)){seen.add(sig);out.push(c);}}
  return out;
}
// User's specific-drug selections (alongside the existing class-level selectedMeds Set).
let selectedDrugs=new Set();
/* Phase 2 / Item #2 — typeahead UI for specific drug entry. Searches DRUG_INTERACTIONS.drugs
   by generic + brand names, lets user pick chips that go into selectedDrugs. */
let _drugTaIdx=-1;  // currently highlighted suggestion in dropdown
function _drugSuggestions(q){
  q=String(q||'').trim().toLowerCase();
  if(q.length<1)return[];
  const out=[];const seen=new Set();
  for(const[k,v]of Object.entries(DRUG_INTERACTIONS.drugs)){
    if(seen.has(k))continue;
    if(selectedDrugs.has(k))continue;
    let match=false;let displayLabel=v.label;
    if(k.includes(q)){match=true;}
    else if(v.label.toLowerCase().includes(q)){match=true;}
    else if((v.brand||[]).some(b=>b.toLowerCase().includes(q))){match=true;
      const matchedBrand=(v.brand||[]).find(b=>b.toLowerCase().includes(q));
      if(matchedBrand)displayLabel=v.label+' ('+matchedBrand+')';}
    if(match){seen.add(k);out.push({key:k,label:displayLabel,class:v.class});}
    if(out.length>=8)break;
  }
  return out;
}
function onDrugTypeaheadInput(ev){
  const input=ev&&ev.target?ev.target:document.getElementById('drug-typeahead-input');
  if(!input)return;
  const q=input.value;
  const qTrim=q.trim();
  const list=document.getElementById('drug-typeahead-list');
  if(!list)return;
  _drugTaIdx=-1;
  // Empty input on focus → show first 8 popular medications as suggestions.
  if(qTrim.length<1){
    const all=Object.entries(DRUG_INTERACTIONS.drugs).filter(([k])=>!selectedDrugs.has(k)).slice(0,8);
    if(!all.length){list.style.display='none';list.innerHTML='';return;}
    list.style.display='block';
    list.innerHTML='<div class="drug-typeahead-hdr">Popular medications</div>'+all.map(([k,v],i)=>{
      const cls=DRUG_INTERACTIONS.drug_groups[v.class];
      const groupLabel=cls?cls.label:'';
      return '<div class="drug-typeahead-item" role="option" data-key="'+escAttr(k)+'" data-idx="'+i+'" onclick="addSelectedDrug(\''+escAttrJs(k)+'\')"><span class="drug-ta-name">'+escHtml(v.label)+'</span>'+(groupLabel?'<span class="drug-ta-class">'+escHtml(groupLabel)+'</span>':'')+'</div>';
    }).join('');
    return;
  }
  // Drop malformed entries (missing label) defensively so the dropdown never renders empty rows.
  const sugs=_drugSuggestions(q).filter(s=>s&&s.label);
  // No matches → show a single "No matches" empty-state row instead of an empty white box.
  if(!sugs.length){
    list.style.display='block';
    list.innerHTML='<div class="drug-typeahead-empty">No matches for \u201C'+escHtml(qTrim)+'\u201D. Try a generic name.</div>';
    return;
  }
  list.style.display='block';
  list.innerHTML=header+sugs.map((s,i)=>{
    const cls=DRUG_INTERACTIONS.drug_groups[s.class];
    const groupLabel=cls?cls.label:'';
    return '<div class="drug-typeahead-item" role="option" data-key="'+escAttr(s.key)+'" data-idx="'+i+'" onclick="addSelectedDrug(\''+escAttrJs(s.key)+'\')"><span class="drug-ta-name">'+escHtml(s.label)+'</span>'+(groupLabel?'<span class="drug-ta-class">'+escHtml(groupLabel)+'</span>':'')+'</div>';
  }).join('');
}
function onDrugTypeaheadKey(ev){
  const list=document.getElementById('drug-typeahead-list');
  if(!list||list.style.display==='none')return;
  const items=list.querySelectorAll('.drug-typeahead-item');
  if(!items.length)return;
  if(ev.key==='ArrowDown'){ev.preventDefault();_drugTaIdx=Math.min(items.length-1,_drugTaIdx+1);_drugTaHighlight(items);}
  else if(ev.key==='ArrowUp'){ev.preventDefault();_drugTaIdx=Math.max(0,_drugTaIdx-1);_drugTaHighlight(items);}
  else if(ev.key==='Enter'){ev.preventDefault();const idx=_drugTaIdx>=0?_drugTaIdx:0;const k=items[idx].getAttribute('data-key');if(k)addSelectedDrug(k);}
  else if(ev.key==='Escape'){list.style.display='none';list.innerHTML='';_drugTaIdx=-1;}
}
function _drugTaHighlight(items){items.forEach((el,i)=>el.classList.toggle('drug-ta-active',i===_drugTaIdx));}
function addSelectedDrug(key){
  if(!key)return;
  selectedDrugs.add(key);
  const input=document.getElementById('drug-typeahead-input');if(input)input.value='';
  const list=document.getElementById('drug-typeahead-list');if(list){list.style.display='none';list.innerHTML='';}
  renderDrugChips();
  /* Re-render the recommendation cards so drug-conflict blocks update. */
  if(typeof _lastRecs!=='undefined'&&_lastRecs)renderSuppCards(_lastRecs,_lastMi,_lastBwResults);
  updatePfCounts&&updatePfCounts();
}
function removeSelectedDrug(key){
  selectedDrugs.delete(key);
  renderDrugChips();
  if(typeof _lastRecs!=='undefined'&&_lastRecs)renderSuppCards(_lastRecs,_lastMi,_lastBwResults);
  updatePfCounts&&updatePfCounts();
}
function renderDrugChips(){
  const wrap=document.getElementById('drug-chips');if(!wrap)return;
  const list=Array.from(selectedDrugs);
  if(!list.length){wrap.innerHTML='';wrap.style.display='none';return;}
  wrap.style.display='flex';
  wrap.innerHTML=list.map(k=>{
    const d=DRUG_INTERACTIONS.drugs[k];
    const label=d?d.label:k;
    return '<span class="drug-chip" title="Click to remove"><span class="drug-chip-name">'+escHtml(label)+'</span><button type="button" class="drug-chip-remove" aria-label="Remove '+escAttr(label)+'" onclick="removeSelectedDrug(\''+escAttrJs(k)+'\')">×</button></span>';
  }).join('');
}
/* Close the typeahead suggestion list when the user clicks anywhere outside it. */
document.addEventListener('click',function(ev){
  if(!ev.target.closest('.drug-typeahead-input-wrap')){
    const list=document.getElementById('drug-typeahead-list');if(list){list.style.display='none';list.innerHTML='';_drugTaIdx=-1;}
  }
});
// _suppCautionMap: name -> [{with, reason, severity, source}]
const _suppCautionMap=new Map();
function _addCaution(a,b,reason,severity,source){
  if(a===b)return;
  if(!_suppCautionMap.has(a))_suppCautionMap.set(a,[]);
  const arr=_suppCautionMap.get(a);
  if(!arr.some(x=>x.with===b))arr.push({with:b,reason,severity:severity||'caution',source:source||'pair'});
}
(SUPP_INTERACTIONS.cautions||[]).forEach(row=>{
  const a=row[0],b=row[1],reason=row[2]||'clinically reported interaction',severity=row[3]||'caution';
  _addCaution(a,b,reason,severity,'pair');
  _addCaution(b,a,reason,severity,'pair');
});
Object.entries(SUPP_INTERACTIONS.groups||{}).forEach(([gKey,g])=>{
  const mem=g.members||[];
  for(let i=0;i<mem.length;i++){for(let j=i+1;j<mem.length;j++){
    const a=mem[i],b=mem[j];
    // Documented complementary pairs (SUPP_INTERACTIONS.pairs) override mechanism-group cautions.
    // Example: Boswellia + Curcumin both share the `bleed` group at the molecular level, but they
    // are an explicitly endorsed 5-LOX/COX-2 anti-inflammatory pair at standard doses. Showing
    // "Pairs with" and "Caution with" on the same card is contradictory; the curated pair wins.
    const aPartners=_pairPartner.get(a);
    if(aPartners&&aPartners.has(b))continue;
    _addCaution(a,b,g.reason,g.severity,gKey);
    _addCaution(b,a,g.reason,g.severity,gKey);
  }}
});
function getAllSuppCautions(name){return _suppCautionMap.get(name)||[];}
// Returns all cautions for `name` where the other party is in `otherNames` (typically the user's stack).
function getSuppCautionsIn(name,otherNames){const all=_suppCautionMap.get(name)||[];const set=new Set(otherNames||[]);return all.filter(c=>set.has(c.with));}
// Back-compat single-match helper (used by the PDF renderer). Returns the first conflict it finds.
function getSuppCaution(name,otherNames){const hits=getSuppCautionsIn(name,otherNames);return hits.length?hits[0]:null;}
// Given a list of supplements in the stack, return array of conflict pairs (deduplicated).
function computeStackConflicts(names){
  const seen=new Set();const conflicts=[];
  names.forEach(a=>{
    getSuppCautionsIn(a,names).forEach(c=>{
      const key=[a,c.with].sort().join('||')+'||'+c.source;
      if(seen.has(key))return;seen.add(key);
      conflicts.push({a,b:c.with,reason:c.reason,severity:c.severity,source:c.source});
    });
  });
  return conflicts.sort((x,y)=>(x.severity==='avoid'?0:1)-(y.severity==='avoid'?0:1));
}
function interactHtml(name){const ints=INTERACT_MAP[name];if(!ints||!ints.length)return'<div class="sc-interact"><div class="sc-interact-title">Medication interactions</div><div class="sc-interact-safe">No known major interactions identified.</div></div>';return'<div class="sc-interact"><div class="sc-interact-title">Medication interactions</div><div class="sc-interact-list">'+ints.map(i=>`<span class="sc-interact-pill${i.type==='avoid'?' danger':''}">${i.type==='avoid'?'Avoid with':'Caution with'}: ${i.med}</span>`).join('')+'</div></div>';}
// Render the "Supplement interactions" expanded section for a single supplement card.
/* Collapse supplement-name variations (different doses, formulations, gummies/ER, etc.)
   to a canonical base so 5+ Melatonin variants don't render as 5+ separate pills. Keeps
   chemical-form distinctions intact (Magnesium glycinate stays distinct from Magnesium
   citrate — those are pharmacologically different). Only strips dose/format qualifiers. */
function _canonicalSuppName(name){
  if(!name)return'';
  return String(name)
    .replace(/\s*\([^)]*\)\s*/g,' ')
    .replace(/\s*,.*$/,'')
    .replace(/\s+(extended[\s-]release|sustained[\s-]release|controlled[\s-]release|delayed[\s-]release|slow[\s-]release|immediate[\s-]release|gummies|gummy|tablets|tablet|capsules|capsule|powder|drops|liquid|spray|syrup|lozenges?|softgels?|chewable|sublingual|topical|oral|nightly|daily|low[\s-]dose|high[\s-]dose|mega[\s-]dose|physiological[\s-]dose)\s*$/gi,'')
    .replace(/\s+/g,' ')
    .trim()||String(name).trim();
}
/* Toggle the hidden remainder of partner pills inside an interaction row. Triggered by the
   "+N more" button. Phase-0-follow-up fix: previously the +N pill was a static span. */
function toggleInteractMore(btn,ev){
  if(ev){if(ev.stopPropagation)ev.stopPropagation();if(ev.preventDefault)ev.preventDefault();}
  const row=btn.parentElement;if(!row)return;
  const expanded=btn.getAttribute('aria-expanded')==='true';
  const hidden=row.querySelectorAll('.sc-si-pill-hidden');
  hidden.forEach(h=>{h.style.display=expanded?'none':'inline-flex';});
  btn.setAttribute('aria-expanded',expanded?'false':'true');
  const n=btn.getAttribute('data-more-count')||hidden.length;
  btn.textContent=expanded?('+'+n+' more'):'Show fewer';
}
function suppInteractSectionHtml(name){
  const cautions=getAllSuppCautions(name);
  if(!cautions||!cautions.length)return'';
  // Group by reason, then within each group dedupe partners by canonical base name so
  // the user sees one "Melatonin" pill instead of five form-specific entries.
  const byReason={};
  cautions.forEach(c=>{
    const k=c.severity+'||'+c.reason;
    if(!byReason[k])byReason[k]={severity:c.severity,reason:c.reason,baseMap:{}};
    const base=_canonicalSuppName(c.with);
    if(!byReason[k].baseMap[base])byReason[k].baseMap[base]=[];
    if(!byReason[k].baseMap[base].includes(c.with))byReason[k].baseMap[base].push(c.with);
  });
  const groups=Object.values(byReason).sort((a,b)=>(a.severity==='avoid'?0:1)-(b.severity==='avoid'?0:1));
  // Total = sum of unique base partners across groups (matches what the user actually sees rendered)
  const total=groups.reduce((acc,g)=>acc+Object.keys(g.baseMap).length,0);
  const rows=groups.map((g,i)=>{
    const sev=g.severity==='avoid'?'avoid':'caution';
    const sevLbl=g.severity==='avoid'?'Avoid':'Caution';
    const bases=Object.keys(g.baseMap);
    const SHOW=6;
    const renderPill=(b,hidden)=>{
      const variants=g.baseMap[b];
      const cls='sc-si-pill'+(hidden?' sc-si-pill-hidden':'');
      const style=hidden?' style="display:none"':'';
      if(variants.length>1){
        const tip=variants.length+' forms grouped: '+variants.join(' · ');
        return '<span class="'+cls+'"'+style+' title="'+escAttr(tip)+'">'+escHtml(b)+' <span class="sc-si-pill-count">('+variants.length+')</span></span>';
      }
      return '<span class="'+cls+'"'+style+'>'+escHtml(b)+'</span>';
    };
    const visible=bases.slice(0,SHOW).map(b=>renderPill(b,false)).join('');
    const hidden=bases.slice(SHOW).map(b=>renderPill(b,true)).join('');
    const extra=bases.length-SHOW;
    const moreBtn=extra>0?'<button type="button" class="sc-si-pill sc-si-pill-more" onclick="toggleInteractMore(this,event)" aria-expanded="false" data-more-count="'+extra+'">+'+extra+' more</button>':'';
    return'<div class="sc-mi-row sc-mi-'+sev+'"><div class="sc-mi-num">'+(i+1)+'</div><div class="sc-mi-body"><div class="sc-mi-k">'+sevLbl+' <span class="sc-mi-dot">·</span> <span class="sc-mi-med">'+escHtml(g.reason)+'</span></div><div class="sc-si-partners">'+visible+hidden+moreBtn+'</div></div></div>';
  }).join('');
  return'<div class="sc-mi-h sc-si-h"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v4M16 3v4M4 7h16M4 11h16M4 15h16M4 19h16"/></svg>Supplement interactions <span class="sc-si-count">'+total+'</span></div><div class="sc-mi-wrap'+(groups.length>1?' sc-mi-rail':'')+'">'+rows+'</div>';
}
// Compact pill shown in the always-visible card area so a user scanning cards sees conflict hints without expanding.
function suppInteractPills(name){
  const cautions=getAllSuppCautions(name);
  if(!cautions||!cautions.length)return'';
  // Use the deduped base-name count to match what the expanded section shows.
  const baseSet=new Set();cautions.forEach(c=>baseSet.add(c.severity+'||'+c.reason+'||'+_canonicalSuppName(c.with)));
  const cnt=baseSet.size;
  const hasAvoid=cautions.some(c=>c.severity==='avoid');
  const cls=hasAvoid?'danger':'';
  const label=hasAvoid?'Supp conflicts (do-not-stack)':'Supplement cautions';
  return`<span class="sc-si-chip ${cls}" title="${cnt} supplement${cnt!==1?'s':''} interact with this one">⚠ ${label} · ${cnt}</span>`;
}
function barClr(v){return v>=4?'var(--t1c)':v>=3?'var(--t2c)':v>=2?'var(--t3c)':'var(--t4c)';}
function bar(label,v){return`<div class="sc-bar-item"><div class="sc-bar-label">${label}</div><div class="sc-bar-track"><div class="sc-bar-fill" style="width:${v*20}%;background:${barClr(v)}"></div></div></div>`;}
function getColsPerRow(){const w=window.innerWidth;if(w<640)return 1;if(w<960)return 2;return 3;}
function _loadMoreBtn(tierId, total, shown){
  var pct = Math.max(0, Math.min(100, (shown/total)*100));
  return '<button type="button" class="tier-more" onclick="loadMoreTier(this,\''+tierId+'\')" data-total="'+total+'">'
    +   '<span class="tier-more-l">'
    +     '<span class="tier-more-cta"><span class="tier-more-spin"></span><span class="tier-more-text">Load more</span></span>'
    +     '<span class="tier-more-progress">Showing <b class="tier-more-shown">'+shown+'</b> of <b>'+total+'</b><span class="tier-more-bar"><span class="tier-more-fill" style="width:'+pct.toFixed(1)+'%"></span></span></span>'
    +   '</span>'
    +   '<span class="tier-more-arr">›</span>'
    + '</button>';
}
function loadMoreTier(btn,tierId){
  btn.classList.add('loading');
  btn.disabled=true;
  var sec=btn.closest('.tier-sec');
  setTimeout(function(){
    var hidden=sec.querySelectorAll('.sc.tier-hidden');
    var shown=0;
    hidden.forEach(function(c){if(shown<10){c.classList.replace('tier-hidden','tier-visible');shown++;}});
    btn.classList.remove('loading');
    btn.disabled=false;
    var rem=sec.querySelectorAll('.sc.tier-hidden').length;
    if(!rem){btn.remove();return;}
    var total=parseInt(btn.dataset.total,10)||0;
    var visible=total-rem;
    var shownEl=btn.querySelector('.tier-more-shown');
    var fillEl=btn.querySelector('.tier-more-fill');
    if(shownEl) shownEl.textContent=visible;
    if(fillEl) fillEl.style.width=((visible/total)*100).toFixed(1)+'%';
  },600);
}
function calcScore(s){const rd=s.r||1,so=s.o||1,sco=s.c||1,sd=s.d||1;return Math.round(s.e*7+s.s*4+rd*3+so*2+sco*2+sd*2);}
var cycleInfo=function(s){if(s.cycle)return s.cycle;var n=s.n.toLowerCase(),t=s.t,tag=(s.tag||'').toLowerCase(),tips=(s.tips||'').toLowerCase(),dose=(s.dose||'').toLowerCase();if(t==='t4')return 'Do not take. This supplement has documented safety risks.';if(tips.includes('cycle')||dose.includes('cycle'))return tips.includes('cycle')?s.tips:s.dose;if(n.includes('ashwagandha'))return 'Cycle 8-12 weeks on, 2-4 weeks off. Long-term safety beyond 3 months not well established.';if(n.includes('rhodiola'))return 'Cycle 6-8 weeks on, 2-4 weeks off. Effectiveness may diminish with continuous use.';if(n.includes('vitamin')||n.includes('magnesium')||n.includes('zinc')||n.includes('calcium')||n.includes('iron')||n.includes('selenium')||n.includes('iodine')||n.includes('folate')||n.includes('b12'))return 'Safe for continuous daily use. No cycling needed. Retest blood levels annually if correcting a deficiency.';if(tag.includes('gut')&&(n.includes('lactobacillus')||n.includes('bifidobacterium')||n.includes('probiotic')||n.includes('saccharomyces')))return 'Safe for continuous daily use. No cycling needed. Benefits may diminish if stopped.';if(n.includes('creatine')||n.includes('whey')||n.includes('protein')||n.includes('eaa')||n.includes('glycine')||n.includes('taurine'))return 'Safe for continuous daily use. No cycling needed. Well-studied for long-term safety.';if(n.includes('omega')||n.includes('fish oil')||n.includes('krill')||(n.includes('dha')&&!n.includes('gandha'))||n.includes('epa'))return 'Safe for continuous daily use. No cycling needed. Benefits reverse if stopped.';if(n.includes('melatonin'))return 'Use situationally, not nightly long-term. Best for jet lag or short-term sleep reset (2-4 weeks).';if(tag.includes('adaptogen')||n.includes('ginseng')||n.includes('eleuthero')||n.includes('schisandra'))return 'Cycle 6-8 weeks on, 2-4 weeks off. Not recommended for continuous long-term use.';if(n.includes('john')||n.includes('kava')||n.includes('valerian')||n.includes('black cohosh'))return 'Short-term use recommended (4-8 weeks). Consult a provider before extending.';if(tag.includes('fibre')||tag.includes('prebiotic')||n.includes('psyllium')||n.includes('inulin'))return 'Safe for continuous daily use. No cycling needed.';if(s.s>=4)return 'Generally safe for continuous use at recommended doses. No specific cycling protocol established.';if(s.s===3)return 'Use with caution long-term. Consider cycling 8-12 weeks on, 2-4 weeks off.';return 'Limited long-term safety data. Use for the shortest effective duration.';}
function eTier(s){const sc=calcScore(s);if(sc>=72)return 't1';if(sc>=60)return 't2';if(sc>=40)return 't3';return 't4';}
function first2(txt){const m=txt.match(/[^.!?]*[.!?]/g);if(!m||m.length<=2)return{preview:txt,rest:''};return{preview:m.slice(0,2).join(''),rest:m.slice(2).join('')};}
function interactBarScore(name){const ints=INTERACT_MAP[name];if(!ints||!ints.length)return 5;if(ints.some(i=>i.type==='avoid'))return 1;return 2;}
const ART_CAT_GRAD={guide:'linear-gradient(180deg,#2563EB,#1D4ED8)',breakthrough:'linear-gradient(180deg,#16A34A,#15803D)',myth:'linear-gradient(180deg,#EA580C,#C2410C)',safety:'linear-gradient(180deg,#DC2626,#B91C1C)',kids:'linear-gradient(180deg,#0D9488,#0F766E)'};
const ART_CAT_CLR={guide:'#2563EB',breakthrough:'#16A34A',myth:'#EA580C',safety:'#DC2626',kids:'#0D9488'};
const ART_CAT_LBL={guide:'Guide',breakthrough:'Breakthrough',myth:'Reality Check',safety:'Safety',kids:'Kids'};
/* Reverse map: article ID → supplement names */
let ARTICLE_SUPPS={};
function _rebuildArticleSupps(){ARTICLE_SUPPS={};Object.entries(ARTICLE_MAP).forEach(([name,arts])=>{arts.forEach(a=>{if(!ARTICLE_SUPPS[a.id])ARTICLE_SUPPS[a.id]=[];if(!ARTICLE_SUPPS[a.id].includes(name))ARTICLE_SUPPS[a.id].push(name);});});}
_rebuildArticleSupps();
// Prune ARTICLE_MAP entries whose article divs do not exist in the DOM — prevents dead goArticle() clicks
(function _pruneArticleMap(){if(typeof document==='undefined')return;const prune=()=>{const valid=new Set();document.querySelectorAll('[id^="article-"]').forEach(el=>{const id=parseInt(el.id.replace('article-',''));if(!isNaN(id))valid.add(id);});let pruned=0;Object.keys(ARTICLE_MAP).forEach(name=>{const before=ARTICLE_MAP[name].length;ARTICLE_MAP[name]=ARTICLE_MAP[name].filter(a=>valid.has(a.id));pruned+=(before-ARTICLE_MAP[name].length);if(!ARTICLE_MAP[name].length)delete ARTICLE_MAP[name];});if(pruned)_rebuildArticleSupps();if(typeof _allArtsCache!=='undefined')_allArtsCache=null;};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prune);else prune();})();
function suppCardForArticle(name){const s=_suppByName.get(name);if(!s)return'';const sc=calcScore(s),et=eTier(s),rd=s.r||1,scCls=sc>=72?'score-high':sc>=60?'score-mid':sc>=40?'score-low':'score-bad';const grad=sc>=60?'linear-gradient(180deg,#16A34A,#15803D)':sc>=40?'linear-gradient(180deg,#CA8A04,#A16207)':'linear-gradient(180deg,#DC2626,#B91C1C)';return`<div class="art-supp-card" onclick="event.stopPropagation();openSuppModal('${escAttrJs(name)}')"><div class="art-supp-score" style="background:${grad}"><div class="art-supp-score-num">${sc}</div><div class="art-supp-score-label">Score</div></div><div class="art-supp-body"><div class="art-supp-name">${escHtml(s.n)}</div><div class="art-supp-meta">Efficacy ${s.e}/5 · Safety ${s.s}/5 · ${escHtml(s.tag.split(' · ').slice(0,2).join(' · '))}</div></div></div>`;}
function articleSuppsHtml(articleId){const names=ARTICLE_SUPPS[articleId];if(!names||!names.length)return'';return`<div class="art-supps-section"><div class="art-supps-title"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>Supplements mentioned in this article</div><div class="art-supps-grid">${names.map(n=>suppCardForArticle(n)).join('')}</div></div>`;}
function articleKeyPointsHtml(body){const firstP=body.querySelector('p');if(!firstP)return'';const text=firstP.textContent.trim();const parts=text.replace(/([.!?])\s+([A-Z\u201c\u2018\u0022])/g,'$1\n$2').split('\n').map(s=>s.trim()).filter(s=>s.length>25);if(!parts.length)return'';const items=parts.slice(0,3).map((s,i)=>`<li class="art-kp-item"><span class="art-kp-num">${i+1}</span><span>${s}</span></li>`).join('');return`<div class="art-kp-card"><div class="art-kp-label">Key Points</div><ul class="art-kp-list">${items}</ul></div>`;}
function articleSuppsTopHtml(id){const names=ARTICLE_SUPPS[id];if(!names||!names.length)return'';const icon=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 3H5a2 2 0 00-2 2v4m4-4h6l6 6v12a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>`;return`<div class="art-supps-top"><div class="art-supps-top-label">${icon}Supplement${names.length>1?'s':''} in this article</div><div class="art-supps-grid">${names.map(n=>suppCardForArticle(n)).join('')}</div></div>`;}
let _allArtsCache=null;
function _buildAllArts(){if(_allArtsCache)return _allArtsCache;const m={};Object.values(ARTICLE_MAP).forEach(arts=>arts.forEach(a=>{m[a.id]=a;}));_allArtsCache=m;return m;}
function getRelatedArticles(articleId,max){max=max||4;const allArts=_buildAllArts();const thisArt=allArts[articleId];const thisSupps=ARTICLE_SUPPS[articleId]||[];const scores={};thisSupps.forEach(name=>{(ARTICLE_MAP[name]||[]).forEach(a=>{if(a.id!==articleId)scores[a.id]=(scores[a.id]||0)+2;});});if(thisArt)Object.values(allArts).forEach(a=>{if(a.id!==articleId&&a.c===thisArt.c)scores[a.id]=(scores[a.id]||0)+1;});return Object.entries(scores).filter(([,s])=>s>0).sort((a,b)=>b[1]-a[1]).slice(0,max).map(([id])=>allArts[parseInt(id)]).filter(Boolean);}
function articleRelatedHtml(articleId){const arts=getRelatedArticles(articleId);if(!arts.length)return'';const svgDoc=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>`;const cards=arts.map(a=>{var clr=ART_CAT_CLR[a.c]||'#1F7A6B';return`<div class="art-mini" role="link" tabindex="0" onclick="goArticle(${a.id},event)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goArticle(${a.id},event);}"><div class="art-mini-ic" style="background:${clr}1a;color:${clr}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div><div class="art-mini-mid"><div class="art-mini-t">${a.t}</div><div class="art-mini-m" style="color:${clr}">${ART_CAT_LBL[a.c]||''}<span class="art-mini-dot">·</span>${a.m} min</div></div><div class="art-mini-arr">›</div></div>`;}).join('');return`<div class="art-related-section"><div class="art-related-label">${svgDoc}Related Articles</div><div class="art-list">${cards}</div></div>`;}
function openSuppModal(name){const s=_suppByName.get(name);if(!s)return;const sc=calcScore(s),rd=s.r||1,so=s.o||1,et=eTier(s);const grad=sc>=80?'linear-gradient(180deg,#16A34A,#15803D)':sc>=60?'linear-gradient(180deg,#CA8A04,#A16207)':sc>=40?'linear-gradient(180deg,#CA8A04,#A16207)':'linear-gradient(180deg,#DC2626,#B91C1C)';const tags=s.tag.split(' · ').map(t=>'<span style="font-size:9px;padding:2px 7px;border-radius:7px;background:'+TM[et].bg+';color:'+TM[et].tx+'">'+t.trim()+'</span>').join('');const modal=document.getElementById('supp-modal');const body=document.getElementById('supp-modal-body');/* Phase 0 / Item #9 + #10: last-reviewed badge and feedback trigger in supp modal. */
const _lrSupp=lastReviewedFor(s.n);
const _lrSuppHtml=_lrSupp?'<span class="article-reviewed" title="Reviewed against PubMed and listed sources. Tier-4 safety entries are reviewed more often.">Last reviewed: '+fmtReviewDate(_lrSupp)+'</span>':'';
const _flagSuppBtn='<button type="button" class="article-flag-btn" onclick="openFeedback(\'supplement\',\''+escAttr(s.n)+'\')">Flag inaccuracy</button>';
/* Phase 3 / Item #6 — form-specific evidence callout when the supplement is one of
   several forms sharing an article. */
const _formNote=(typeof FORM_EVIDENCE_NOTES!=='undefined'&&FORM_EVIDENCE_NOTES[s.n])?FORM_EVIDENCE_NOTES[s.n]:null;
const _formNoteHtml=_formNote?'<div class="supp-modal-section supp-form-note"><div class="supp-modal-label supp-form-note-label">Form-specific evidence</div><div class="supp-modal-val">'+escHtml(_formNote.note)+'</div></div>':'';
body.innerHTML=`<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><div style="width:56px;height:56px;border-radius:12px;background:${grad};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0"><div style="font-size:22px;font-weight:800;color:#fff">${sc}</div><div style="font-size:6px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.65)">Score</div></div><div><div style="font-size:18px;font-weight:700;color:var(--color-text-primary)">${s.n}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${tags}</div></div></div><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;font-size:11px;color:var(--color-text-tertiary)"><span>Efficacy: <b style="color:${barClr(s.e)}">${s.e}/5</b></span><span>Safety: <b style="color:${barClr(s.s)}">${s.s}/5</b></span><span>Research: <b style="color:${barClr(rd)}">${rd}/5</b></span><span>Onset: <b style="color:var(--color-text-secondary)">${OL_SHORT[so]||'Varies'}</b></span></div><div class="supp-modal-section"><div class="supp-modal-label">Dose</div><div class="supp-modal-val">${s.dose}</div></div>${s.tips?'<div class="supp-modal-section"><div class="supp-modal-label">How to take</div><div class="supp-modal-val">'+s.tips+'</div></div>':''}<div class="supp-modal-section"><div class="supp-modal-label">Cycling &amp; Duration</div><div class="supp-modal-val">${cycleInfo(s)}</div></div><div class="supp-modal-section"><div class="supp-modal-label">Overview</div><div class="supp-modal-val">${s.desc}</div></div>${_formNoteHtml}<div class="article-meta-row" style="margin-top:18px;padding-top:14px;border-top:1px dashed #e5e7eb">${_lrSuppHtml}${_flagSuppBtn}</div>`;modal.classList.add('open');document.body.style.overflow='hidden';modal.scrollTop=0;}
function closeSuppModal(){const m=document.getElementById('supp-modal');if(m)m.classList.remove('open');document.body.style.overflow='';}
/* Find Sources section, shrink text, linkify citations → returns the sources wrapper div or null */
function processArticleSources(container){
  let sourcesDiv=null;
  container.querySelectorAll('h3').forEach(h=>{if(h.textContent.trim()==='Sources')sourcesDiv=h.parentElement;});
  if(!sourcesDiv)return null;
  sourcesDiv.classList.add('art-sources');
  const ol=sourcesDiv.querySelector('ol');
  if(ol){
    ol.style.fontSize='0.68rem';ol.style.lineHeight='1.65';
    ol.querySelectorAll('li').forEach(li=>{
      const m=li.innerHTML.match(/\u201c([^\u201d]+)\u201d|"([^"]+)"/);
      if(m){
        const title=m[1]||m[2];
        const url='https://scholar.google.com/scholar?q='+encodeURIComponent(title);
        li.innerHTML=li.innerHTML.replace(m[0],
          m[0].charAt(0)+'<a href="'+url+'" target="_blank" rel="noopener noreferrer" class="src-link">'+title+'</a>'+m[0].charAt(m[0].length-1));
      }
      /* Phase 1 / Item #1: source-logo rendering \u2014 when a <li> declares data-source-key,
         prepend the matching logo + label so readers see WHICH source (NIH ODS / EFSA /
         Cochrane / openFDA / etc.) backs the citation. See sources/_schema.md. */
      const skey=(li.getAttribute('data-source-key')||'').toLowerCase();
      if(skey&&typeof SOURCE_LOGOS!=='undefined'&&SOURCE_LOGOS[skey]){
        const sm=SOURCE_LOGOS[skey];
        const tag='<span class="cite-src-tag" title="'+escAttr(sm.tip||sm.label)+'"><img src="source-logos/'+sm.logo+'" alt="" class="cite-src-logo">'+escHtml(sm.label)+'</span> ';
        li.insertAdjacentHTML('afterbegin',tag);
        li.classList.add('cite-has-src');
      }
      /* Phase 0 / Item #3: funding/COI flag rendering \u2014 see docs/citation-schema.md */
      const ftype=(li.getAttribute('data-funder-type')||'').toLowerCase();
      const funder=li.getAttribute('data-funder')||'';
      const coi=(li.getAttribute('data-coi')||'').toLowerCase();
      if(ftype){
        li.classList.add('cite-fund-'+ftype);
        if(ftype==='industry'){
          const tip='Industry-funded'+(funder?' \u2014 '+funder:'')+'. Effect estimates from industry-funded supplement trials run ~20\u201330% larger on average than independent ones; weighted accordingly in our tier calls.';
          li.insertAdjacentHTML('beforeend',' <span class="cite-fund-badge cite-fund-industry-badge" title="'+escAttr(tip)+'">industry-funded</span>');
        }else if(ftype==='mixed'){
          const tip='Mixed funding'+(funder?' \u2014 '+funder:'')+'. Some industry support disclosed.';
          li.insertAdjacentHTML('beforeend',' <span class="cite-fund-badge cite-fund-mixed-badge" title="'+escAttr(tip)+'">mixed funding</span>');
        }
      }
      if(coi==='true'||coi==='yes'){
        li.insertAdjacentHTML('beforeend',' <span class="cite-fund-badge cite-coi-badge" title="One or more authors disclosed a competing interest related to the supplement.">COI disclosed</span>');
      }
    });
  }
  return sourcesDiv;
}
let _artReturnScrollY=0,_currentArticleId=null,_artNavList=[],_artNavStack=[];
function _buildArtNavList(){const out=[];document.querySelectorAll('[id^="article-"]').forEach(el=>{const m=el.id.match(/^article-(\d+)$/);if(m)out.push(parseInt(m[1],10));});return out.sort((a,b)=>a-b);}
function goArticle(id,ev,_skipStackPush){const _ev=ev||(typeof window!=='undefined'?window.event:null);if(_ev&&_ev.stopPropagation)_ev.stopPropagation();const src=document.getElementById('article-'+id);if(!src)return;const modal=document.getElementById('art-modal');if(!modal)return;const isOpen=modal.classList.contains('open');if(!isOpen){_artReturnScrollY=window.pageYOffset;if(!_artNavList.length)_artNavList=_buildArtNavList();_artNavStack=[];try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'ss-art-modal',state:'open'},'*');}catch(_){}}else if(_currentArticleId&&_currentArticleId!==id&&!_skipStackPush){_artNavStack.push(_currentArticleId);}_currentArticleId=id;const body=document.getElementById('art-modal-body');if(!body)return;const artInner=src.querySelector('[style*="padding"]')||src;body.innerHTML=artInner.innerHTML;const backBtn=body.querySelector('button');if(backBtn&&backBtn.textContent.includes('Back'))backBtn.remove();const kpHtml=articleKeyPointsHtml(body);if(kpHtml){const metaEl=body.querySelector('.article-meta');if(metaEl){metaEl.style.marginBottom='0';metaEl.insertAdjacentHTML('afterend',kpHtml);}else{body.insertAdjacentHTML('afterbegin',kpHtml);}const firstP=body.querySelector('p');if(firstP)firstP.classList.add('art-body-first');}const suppsHtml=articleSuppsHtml(id);const sourcesDiv=processArticleSources(body);if(suppsHtml){if(sourcesDiv)sourcesDiv.insertAdjacentHTML('beforebegin',suppsHtml);else body.insertAdjacentHTML('beforeend',suppsHtml);}const relHtml=articleRelatedHtml(id);if(relHtml)body.insertAdjacentHTML('beforeend',relHtml);if(sourcesDiv)body.appendChild(sourcesDiv);/* Phase 0 / Item #9: surface last-reviewed date from the source article comment.
   Phase 0 / Item #10: also render an inline "Flag inaccuracy" trigger next to the date. */const _lr=articleReviewedDate(src);const _flagLink='<button type="button" class="article-flag-btn" onclick="openFeedback(\'article\',\''+id+'\')">Flag inaccuracy</button>';if(_lr){const _meta=body.querySelector('.article-meta');const _badge='<div class="article-meta-row"><span class="article-reviewed" title="Reviewed against PubMed and the listed sources every 22 days. Tier-4 safety entries are reviewed more often.">Last reviewed: '+fmtReviewDate(_lr)+'</span>'+_flagLink+'</div>';if(_meta){_meta.insertAdjacentHTML('afterend',_badge);}else{body.insertAdjacentHTML('afterbegin',_badge);}}else{const _meta=body.querySelector('.article-meta');const _row='<div class="article-meta-row">'+_flagLink+'</div>';if(_meta){_meta.insertAdjacentHTML('afterend',_row);}else{body.insertAdjacentHTML('afterbegin',_row);}}_updateArtNav();if(!isOpen){modal.classList.add('open');document.body.style.overflow='hidden';}modal.scrollTop=0;_setArticleHash(id);}
function closeArtModal(){if(_artNavStack.length){const prev=_artNavStack.pop();if(document.getElementById('article-'+prev)){goArticle(prev,null,true);return;}}const m=document.getElementById('art-modal');if(m)m.classList.remove('open');document.body.style.overflow='';window.scrollTo({top:_artReturnScrollY,behavior:'instant'});_currentArticleId=null;_artNavStack=[];try{if(location.hash&&/^#article-\d+$/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);}catch(e){}try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'ss-art-modal',state:'close'},'*');}catch(_){}}
function _setArticleHash(id){try{history.replaceState(null,'','#article-'+id);}catch(e){}}
function _showShareToast(msg){const t=document.getElementById('art-share-toast');if(!t)return;t.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'+escHtml(String(msg||''));t.classList.add('show');clearTimeout(_showShareToast._t);_showShareToast._t=setTimeout(()=>{t.classList.remove('show');},1800);}
function shareArticle(){const id=_currentArticleId;if(!id)return;const body=document.getElementById('art-modal-body');const titleEl=body?body.querySelector('h2'):null;const title=titleEl?titleEl.textContent.trim():'Supplement Score';const url=location.origin+location.pathname+'#article-'+id;const shareData={title:title,text:title+' — via Supplement Score',url:url};const btn=document.getElementById('art-share-btn');const flashCopied=()=>{if(btn){btn.classList.add('copied');setTimeout(()=>btn.classList.remove('copied'),1400);}};const copyFallback=()=>{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(()=>{_showShareToast('Link copied');flashCopied();}).catch(()=>{_legacyCopy(url);_showShareToast('Link copied');flashCopied();});}else{_legacyCopy(url);_showShareToast('Link copied');flashCopied();}};if(navigator.share&&/Mobi|Android|iPhone|iPad/.test(navigator.userAgent)){navigator.share(shareData).catch(err=>{if(err&&err.name!=='AbortError')copyFallback();});}else{copyFallback();}}
function _legacyCopy(txt){try{const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}catch(e){}}
window.addEventListener('DOMContentLoaded',function(){const m=location.hash.match(/^#article-(\d+)$/);if(m){const id=parseInt(m[1],10);setTimeout(()=>{if(document.getElementById('article-'+id))goArticle(id);},120);}});
window.addEventListener('hashchange',function(){const m=location.hash.match(/^#article-(\d+)$/);if(m){const id=parseInt(m[1],10);if(id!==_currentArticleId&&document.getElementById('article-'+id))goArticle(id);}else if(_currentArticleId&&!location.hash){closeArtModal();}});
function _updateArtNav(){const idx=_artNavList.indexOf(_currentArticleId);const p=document.getElementById('art-prev-btn');const n=document.getElementById('art-next-btn');if(p)p.disabled=idx<=0;if(n)n.disabled=idx<0||idx>=_artNavList.length-1;}
function artNavPrev(){const idx=_artNavList.indexOf(_currentArticleId);if(idx>0)goArticle(_artNavList[idx-1]);}
function artNavNext(){const idx=_artNavList.indexOf(_currentArticleId);if(idx>=0&&idx<_artNavList.length-1)goArticle(_artNavList[idx+1]);}
/* NOTE: modal/arrow keydown logic is now part of the consolidated handler at the bottom of this file. */
function artChipHtml(arts){if(!arts||!arts.length)return'';const n=arts.length;return'<span class="art-chip"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>'+n+' Article'+(n>1?'s':'')+' available</span>';}
function artMiniHtml(arts){if(!arts||!arts.length)return'';return'<div class="art-list"><div class="art-list-h">Related article'+(arts.length>1?'s':'')+'</div>'+arts.map(a=>{var clr=ART_CAT_CLR[a.c]||'#1F7A6B';return'<div class="art-mini" role="link" tabindex="0" onclick="goArticle('+a.id+',event)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();goArticle('+a.id+',event);}"><div class="art-mini-ic" style="background:'+clr+'1a;color:'+clr+'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div><div class="art-mini-mid"><div class="art-mini-t">'+a.t+'</div><div class="art-mini-m" style="color:'+clr+'">'+ART_CAT_LBL[a.c]+'<span class="art-mini-dot">·</span>'+a.m+' min</div></div><div class="art-mini-arr">›</div></div>';}).join('')+'</div>';}
/* Card v2 (2026-04-29): minimal click-through. The detail modal handles depth.
   Renders an <a> so supplement-modal.js' click interception opens the modal. */
function _slcSlug(name){
  if (window.SS && typeof window.SS.slugify === 'function') return window.SS.slugify(name);
  return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function _slcCaution(s, et, ints){
  if (et === 't4') return 'Tier 4 risk profile';
  if (!ints || !ints.length) return '';
  if (ints.length === 1) return ints[0].med;
  var avoid = ints.filter(function(i){ return i.type === 'avoid'; }).length;
  if (avoid && avoid === ints.length) return ints.length + ' avoid';
  return ints.length + ' drug interactions';
}
function renderCard(s, hidden){
  var sc   = calcScore(s);
  var et   = eTier(s);
  var slug = _slcSlug(s.n);
  var ints = INTERACT_MAP[s.n] || [];
  var cau  = _slcCaution(s, et, ints);
  var cauHtml = cau ? '<span class="lc-cau">' + escHtml(cau) + '</span>' : '';
  return '<a class="sc ' + et + (hidden || '') + '" href="supplement.html?slug=' + encodeURIComponent(slug) + '" data-tier="' + et + '">'
    +   '<div class="lc-score"><div class="lc-score-num">' + sc + '</div></div>'
    +   '<div class="lc-mid">'
    +     '<div class="lc-row1"><span class="lc-name">' + escHtml(s.n) + '</span><span class="lc-cats">' + escHtml(s.tag || '') + '</span></div>'
    +     '<div class="lc-row2">'
    +       '<span class="lc-desc">' + escHtml(s.desc || '') + '</span>'
    +       cauHtml
    +     '</div>'
    +   '</div>'
    +   '<div class="lc-arr">›</div>'
    + '</a>';
}
function renderAll(){const q=(document.getElementById('gs-inp')||{}).value||'';const initShow=10;
if(af==='unproven'){let items=S.filter(s=>eTier(s)==='t3'&&match(s,q)).sort((a,b)=>calcScore(b)-calcScore(a));const hasMore=items.length>10&&!q;const m=TIER_META.unproven||{};const banner=items.length?_filterBanner('Unproven',items.length+' supplement'+(items.length===1?'':'s'),m.desc||'',m.icon||'<circle cx="12" cy="12" r="10"/>','unproven'):'';document.getElementById('s-content').innerHTML=items.length?`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=initShow?' tier-hidden':'')).join('')}</div>${hasMore?_loadMoreBtn('unproven',items.length,initShow):''}</div>`:'<div class="empty">No supplements found.</div>';return;}
if(af==='az'){let items=S.filter(s=>match(s,q)).sort((a,b)=>a.n.localeCompare(b.n));const groups={};items.forEach(s=>{const letter=s.n.charAt(0).toUpperCase().replace(/[^A-Z]/,'#');if(!groups[letter])groups[letter]=[];groups[letter].push(s);});let html='';Object.keys(groups).sort((a,b)=>a==='#'?-1:b==='#'?1:a.localeCompare(b)).forEach(letter=>{const grp=groups[letter];html+=`<div class="az-letter-heading">${letter} <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">${grp.length}</span></div><div class="tier-sec"><div class="scards">${grp.map(s=>renderCard(s,'')).join('')}</div></div>`;});document.getElementById('s-content').innerHTML=html;return;}
const tiers=af==='all'?TIERS:TIERS.filter(t=>t.id===af);const singleTier=af!=='all';let html='';tiers.forEach(t=>{const items=S.filter(s=>t.id==='t3'?(s.tr&&match(s,q)):(eTier(s)===t.id&&match(s,q))).sort((a,b)=>calcScore(b)-calcScore(a));if(!items.length)return;const hasMore=items.length>10&&!q;let banner='';if(singleTier){const m=TIER_META[t.id]||{};banner=_filterBanner(escHtml(t.label),items.length+' supplement'+(items.length===1?'':'s'),m.desc||t.desc||'',m.icon||'<circle cx="12" cy="12" r="10"/>',t.id);}html+=`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=initShow?' tier-hidden':'')).join('')}</div>${hasMore?_loadMoreBtn(t.id,items.length,initShow):''}</div>`;});document.getElementById('s-content').innerHTML=html||'<div class="empty">No supplements match your search.</div>';}
function setCatFilter(cat){if(!cat){af='az';renderAll();document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');document.querySelectorAll('.sfbtn')[0].className='sfbtn on-az';return;}_ddLabel('tier-filter','Tier\u2026');_ddLabel('az-filter','A\u2013Z');_ddLabel('pop-filter','Age & Sex');document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');af='cat';const q=(document.getElementById('srch')||{}).value||'';const rowLimit=20;let items=S.filter(s=>s.tag.toLowerCase().includes(cat.toLowerCase())&&match(s,q));items.sort((a,b)=>calcScore(b)-calcScore(a));const hasMore=items.length>20&&!q;const m=CAT_META[cat]||{};const banner=items.length?_filterBanner(escHtml(cat),items.length+' supplement'+(items.length===1?'':'s'),m.desc||'Supplements grouped by their primary benefit area.',m.icon||'<circle cx="12" cy="12" r="10"/>'):'';let html=`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=rowLimit?' tier-hidden':'')).join('')}</div>${hasMore?_loadMoreBtn('cat',items.length,rowLimit):''}</div>`;document.getElementById('s-content').innerHTML=items.length?html:'<div class="empty">No supplements found for this category.</div>';document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.getBoundingClientRect().bottom+12:128;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
var _initialLoad=true;
function setFilter(id,el){_ddLabel('cat-filter','Helps With');_ddLabel('az-filter','A\u2013Z');_ddLabel('tier-filter','Tier\u2026');_ddLabel('pop-filter','Age & Sex');_ddActive(null);af=id;document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');if(el)el.className=`sfbtn on-${id}`;renderAll();if(_initialLoad){_initialLoad=false;return;}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
function setAzFilter(val){if(!val)return;document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');_ddLabel('cat-filter','Helps With');_ddLabel('tier-filter','Tier\u2026');_ddLabel('pop-filter','Age & Sex');if(val==='all'){af='az';renderAll();}else{af='azpair';const letters=val.split('');const q=(document.getElementById('srch')||{}).value||'';let items=S.filter(s=>{const c=s.n.charAt(0).toUpperCase();return(c===letters[0]||c===letters[1])&&match(s,q);}).sort((a,b)=>a.n.localeCompare(b.n));const groups={};items.forEach(s=>{const l=s.n.charAt(0).toUpperCase();if(!groups[l])groups[l]=[];groups[l].push(s);});let html='';Object.keys(groups).sort().forEach(letter=>{const grp=groups[letter];html+=`<div class="az-letter-heading">${letter} <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">${grp.length}</span></div><div class="tier-sec"><div class="scards">${grp.map(s=>renderCard(s,'')).join('')}</div></div>`;});document.getElementById('s-content').innerHTML=html||'<div class="empty">No supplements found.</div>';}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
let _allTabInit=false;
const CATS=['Performance','Cognition','Sleep','Immunity','Cardiovascular','Joint','Mood','Gut','Metabolic','Inflammation','Skin','Bone','Energy','Hormonal','Neuropathy','Antioxidant','Weight','UTI','Migraine','Liver','Eye health','Pregnancy'];
const AZ_PAIRS=[['A','B'],['C','D'],['E','F'],['G','H'],['I','J'],['K','L'],['M','N'],['O','P'],['Q','R'],['S','T'],['U','V'],['W','X'],['Y','Z']];
const POPULATIONS={
  infant_toddler:{label:'Infants & toddlers (0\u20133)',supps:['Vitamin D3','Iron','Probiotics','Omega-3 (EPA/DHA)','Algal DHA (vegan omega-3)','Zinc','Vitamin C (moderate dose)','Saccharomyces boulardii']},
  children:{label:'Children (4\u201312)',supps:['Multivitamins (healthy adults)','Vitamin D3','Omega-3 (EPA/DHA)','Algal DHA (vegan omega-3)','Iron','Probiotics','Calcium','Magnesium','Melatonin','Zinc','Vitamin C (moderate dose)','Fibre (general dietary)','Saccharomyces boulardii','B-complex (balanced)']},
  teens:{label:'Teens (13\u201317)',supps:['Creatine monohydrate','Whey protein','Vitamin D3','Omega-3 (EPA/DHA)','Iron','Magnesium','Zinc','B-complex (balanced)','Probiotics','Ashwagandha (KSM-66)','L-Theanine','Collagen peptides','Calcium','Vitamin C (moderate dose)','Melatonin','Folate (5-MTHF)']},
  men_adult:{label:'Men (18\u201349)',supps:['Creatine monohydrate','Whey protein','Vitamin D3','Omega-3 (EPA/DHA)','Magnesium','Zinc','Ashwagandha (KSM-66)','L-Theanine','CoQ10 (Ubiquinol)','Vitamin K2 (MK-7)','B-complex (balanced)','Probiotics','Fibre (general dietary)','Rhodiola rosea','Curcumin (bioavailable form)','Citrulline malate','Beta-Alanine','HMB (\u03b2-Hydroxy-\u03b2-methylbutyrate)','Multivitamins (healthy adults)','Boswellia serrata','NMN / NAD+ precursors','Saffron (Crocus sativus)','Tart cherry (Montmorency)','EAAs (Essential amino acids)','Acetyl-L-Carnitine (ALCAR)','Glycine','Astaxanthin','Vitamin C (moderate dose)','Vitamin B12']},
  women_adult:{label:'Women (18\u201349)',supps:['Iron','Folate (5-MTHF)','Vitamin D3','Magnesium','Calcium','Omega-3 (EPA/DHA)','B-complex (balanced)','Collagen peptides','Probiotics','Vitamin K2 (MK-7)','Ashwagandha (KSM-66)','L-Theanine','Maca (Lepidium meyenii)','Vitex / Chasteberry (Vitex agnus-castus)','Curcumin (bioavailable form)','Zinc','Biotin (low-dose, deficiency)','Multivitamins (healthy adults)','Saffron (Crocus sativus)','CoQ10 (Ubiquinol)','Evening primrose oil (EPO)','Astaxanthin','Vitamin C (moderate dose)','Vitamin B12','Melatonin','Glycine','Whey protein','Creatine monohydrate','Rhodiola rosea']},
  pregnant:{label:'Pregnant',supps:['Folate (5-MTHF)','Folic acid (synthetic)','Iron','Iodine','Choline','Omega-3 (EPA/DHA)','Algal DHA (vegan omega-3)','Vitamin D3','Calcium','Magnesium','Vitamin B12','Probiotics']},
  breastfeeding:{label:'Breastfeeding',supps:['Vitamin D3','Omega-3 (EPA/DHA)','Algal DHA (vegan omega-3)','Iodine','Choline','Iron','Vitamin B12','Calcium','Magnesium','Fenugreek (Trigonella foenum-graecum)','Probiotics','Folate (5-MTHF)','B-complex (balanced)']},
  perimenopause:{label:'Peri / Menopause',supps:['Vitamin D3','Calcium','Magnesium','Vitamin K2 (MK-7)','Omega-3 (EPA/DHA)','Black cohosh (Cimicifuga racemosa)','Red clover (Trifolium pratense)','Soy isoflavones','Ashwagandha (KSM-66)','Collagen peptides','Maca (Lepidium meyenii)','Evening primrose oil (EPO)','DHEA (Dehydroepiandrosterone)','Dong quai (Angelica sinensis)','Vitex / Chasteberry (Vitex agnus-castus)','Saffron (Crocus sativus)','B-complex (balanced)','Iron','Rhodiola rosea','L-Theanine','Melatonin','CoQ10 (Ubiquinol)']},
  senior_men:{label:'Senior men (65+)',supps:['Vitamin D3','Vitamin B12','Omega-3 (EPA/DHA)','Creatine monohydrate','Whey protein','HMB (\u03b2-Hydroxy-\u03b2-methylbutyrate)','Magnesium','CoQ10 (Ubiquinol)','Vitamin K2 (MK-7)','Zinc','Saw palmetto (Serenoa repens)','Curcumin (bioavailable form)','Probiotics','Fibre (general dietary)','B-complex (balanced)','Calcium','Boswellia serrata','Collagen type II (undenatured, UC-II)','Multivitamins (healthy adults)','NMN / NAD+ precursors','Acetyl-L-Carnitine (ALCAR)','Astaxanthin','Psyllium husk (Plantago ovata)']},
  senior_women:{label:'Senior women (65+)',supps:['Vitamin D3','Calcium','Vitamin B12','Omega-3 (EPA/DHA)','Magnesium','Vitamin K2 (MK-7)','Collagen peptides','Creatine monohydrate','Whey protein','HMB (\u03b2-Hydroxy-\u03b2-methylbutyrate)','CoQ10 (Ubiquinol)','Curcumin (bioavailable form)','Probiotics','Fibre (general dietary)','B-complex (balanced)','Boswellia serrata','Collagen type II (undenatured, UC-II)','Multivitamins (healthy adults)','Astaxanthin','Psyllium husk (Plantago ovata)','Saffron (Crocus sativus)','Zinc','Melatonin']}
};
const POP_META={
  infant_toddler:{lead:'Nutritional support for the earliest years',desc:'Essential nutrients for brain and immune development from birth to age 3. Always consult a paediatrician before supplementing.',icon:'<circle cx="12" cy="10" r="2.5"/><path d="M15 6V4M9 6V4M6 10c0-3 2-5 6-5s6 2 6 5v7c0 2-2 3-6 3s-6-1-6-3v-7zM8 13s1.5 2 4 2 4-2 4-2"/>'},
  children:{lead:'Growing bodies and minds',desc:'Supplements that support growth, cognition, and immunity in school-age children, plus common deficiencies like iron and vitamin D.',icon:'<circle cx="12" cy="9" r="3.5"/><path d="M5 21v-2a7 7 0 0114 0v2"/><path d="M9.5 9h.01M14.5 9h.01M10.5 11s.5 1 1.5 1 1.5-1 1.5-1"/>'},
  teens:{lead:'Puberty, athletics, and academic stress',desc:'Nutrients to support growing bodies, iron for menstruating teens, and safe performance support for young athletes.',icon:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5"/>'},
  men_adult:{lead:'Performance, recovery, and daily wellness',desc:'Commonly used by adult men for muscle, energy, cognition, cardiovascular health, and long-term prevention.',icon:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-1a8 8 0 0116 0v1"/>'},
  women_adult:{lead:'Cycle, mood, energy, and bone health',desc:'Addresses iron needs for menstruating women, hormonal balance, skin and hair, and long-term bone and cardiovascular health.',icon:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-1a8 8 0 0116 0v1"/><path d="M7 4c0-2 2-3 5-3s5 1 5 3"/>'},
  pregnant:{lead:'Prenatal support for mother and baby',desc:'Evidence-based nutrients shown to support fetal development and maternal health during pregnancy. Always take under medical supervision.',icon:'<circle cx="12" cy="5" r="3"/><path d="M8 22v-7c0-3 2-5 4-5s4 2 4 5v7"/><circle cx="15" cy="15" r="3"/>'},
  breastfeeding:{lead:'Postpartum recovery and milk quality',desc:'Nutrients that support maternal recovery, infant development through breast milk, and milk supply during lactation.',icon:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>'},
  perimenopause:{lead:'Hormonal transition and bone support',desc:'Supplements that can ease hot flashes, mood shifts, and sleep issues while protecting bone and cardiovascular health during perimenopause and menopause.',icon:'<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'},
  senior_men:{lead:'Cognition, strength, and heart health',desc:'Addresses muscle loss, B12 absorption changes, bone density, and cardiovascular and cognitive health in men over 65.',icon:'<circle cx="9" cy="7" r="3.5"/><path d="M3 21v-2a6 6 0 0112 0v2"/><path d="M16 11l2 2 4-4"/>'},
  senior_women:{lead:'Bone, cognition, and longevity',desc:'Addresses post-menopausal bone health, B12 absorption, muscle maintenance, and cognitive function in women over 65.',icon:'<circle cx="9" cy="7" r="3.5"/><path d="M3 21v-2a6 6 0 0112 0v2"/><path d="M18 5l1 2 2 .3-1.5 1.5.3 2-1.8-1-1.8 1 .3-2L15 7.3 17 7z"/>'}
};
const CAT_META={
  'Performance':{lead:'Strength, power, and athletic output',desc:'Supplements shown to improve muscle strength, endurance, recovery, and athletic performance in training and competition.',icon:'<path d="M6.5 6.5l11 11M21 21l-1.5-1.5M3 3l1.5 1.5M18 22l4-4M6 2l-4 4M14.5 4l-2.5 2.5M7.5 14l-2.5 2.5"/>'},
  'Cognition':{lead:'Focus, memory, and mental clarity',desc:'Nutrients and compounds supporting memory, attention, processing speed, and long-term brain health.',icon:'<path d="M12 2a4 4 0 00-4 4v14a3 3 0 006 0v-3a3 3 0 013-3h1a4 4 0 000-8 4 4 0 00-4-4z"/>'},
  'Sleep':{lead:'Better rest and circadian rhythm',desc:'Supplements that support falling asleep faster, staying asleep longer, and aligning the body\u2019s natural sleep-wake cycle.',icon:'<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'},
  'Immunity':{lead:'Defense against infection and illness',desc:'Supports immune function, reduces severity and duration of common colds, and helps maintain baseline resilience.',icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'},
  'Cardiovascular':{lead:'Heart health and circulation',desc:'Supplements that support healthy cholesterol, blood pressure, vascular function, and reduce long-term cardiovascular risk.',icon:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>'},
  'Joint':{lead:'Joint mobility and cartilage support',desc:'Supports joint function, reduces stiffness and pain, and may slow cartilage breakdown in osteoarthritis.',icon:'<circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="M9 9l6 6"/>'},
  'Mood':{lead:'Emotional balance and mental wellbeing',desc:'Supplements with evidence for supporting mood, reducing anxiety or depressive symptoms, and improving emotional regulation.',icon:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'},
  'Gut':{lead:'Digestion and microbiome health',desc:'Supports healthy digestion, regularity, gut-barrier function, and a balanced microbiome.',icon:'<path d="M5 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7c-3 0-5-2-5-5s1-4 3-4 3 1 3 2-.5 1.5-1 1.5"/>'},
  'Metabolic':{lead:'Blood sugar, energy, and metabolism',desc:'Supports glucose control, insulin sensitivity, and metabolic health \u2014 relevant for pre-diabetes, weight management, and energy.',icon:'<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/>'},
  'Inflammation':{lead:'Reducing chronic inflammation',desc:'Compounds shown to lower systemic inflammation markers, relevant to joint, cardiovascular, and metabolic health.',icon:'<path d="M12 2.5s-6 8-6 12a6 6 0 0012 0c0-4-6-12-6-12z"/>'},
  'Skin':{lead:'Complexion, texture, and radiance',desc:'Supports skin elasticity, hydration, pigmentation, and overall appearance from the inside out.',icon:'<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>'},
  'Bone':{lead:'Bone density and skeletal strength',desc:'Supports mineral deposition, reduces fracture risk, and helps maintain bone mass through life \u2014 especially critical post-menopause.',icon:'<path d="M17 10L8.5 1.5A4 4 0 002 6l.5.5a4 4 0 000 5.5L7 16.5a4 4 0 005.5 0l.5.5a4 4 0 005.5 0 4 4 0 000-5.5z"/>'},
  'Energy':{lead:'Sustained physical and mental energy',desc:'Supports mitochondrial function, reduces fatigue, and improves energy availability for both body and brain.',icon:'<path d="M13 2L3 14h7l-2 8L20 10h-7l2-8z"/>'},
  'Hormonal':{lead:'Hormone balance and regulation',desc:'Supplements that support healthy hormone production, regulation, and symptoms of hormonal imbalance.',icon:'<path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>'},
  'Neuropathy':{lead:'Nerve function and peripheral health',desc:'Supports nerve signaling, reduces symptoms of peripheral neuropathy, and maintains long-term nervous-system health.',icon:'<path d="M9 3v6a3 3 0 006 0V3M9 21v-6a3 3 0 016 0v6M3 9h6M15 9h6M3 15h6M15 15h6"/>'},
  'Antioxidant':{lead:'Cellular defense and oxidative stress',desc:'Compounds that neutralize free radicals, reduce oxidative damage, and support cellular resilience over time.',icon:'<path d="M11 20A7 7 0 014 13V8s3-3 7-3 7 3 7 3v5a7 7 0 01-7 7z"/>'},
  'Weight':{lead:'Appetite, fat loss, and body composition',desc:'Supplements with evidence for supporting appetite control, fat loss, or body-composition improvements alongside diet and exercise.',icon:'<path d="M12 3l8 4-8 4-8-4zM4 7v10l8 4 8-4V7"/>'},
  'UTI':{lead:'Urinary tract support',desc:'Supports bladder health and may reduce the frequency and severity of urinary-tract infections.',icon:'<path d="M12 2.5s-6 8-6 12a6 6 0 0012 0c0-4-6-12-6-12z"/>'},
  'Migraine':{lead:'Headache and migraine relief',desc:'Supplements with evidence for reducing migraine frequency, duration, or severity in people prone to chronic headaches.',icon:'<path d="M12 2a7 7 0 017 7c0 3-2 5-4 6v3h-6v-3c-2-1-4-3-4-6a7 7 0 017-7z"/>'},
  'Liver':{lead:'Liver detoxification and function',desc:'Supports liver enzyme function, reduces oxidative damage, and protects against diet- and alcohol-related liver stress.',icon:'<path d="M2 12c0-5 4-9 10-9s10 4 10 9c0 4-3 7-7 8l-3 2v-3c-6 0-10-3-10-7z"/>'},
  'Eye health':{lead:'Vision and eye protection',desc:'Supports retinal health, reduces macular degeneration risk, and protects against oxidative stress and blue light damage.',icon:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'},
  'Pregnancy':{lead:'Maternal and fetal support',desc:'Supplements with evidence for supporting a healthy pregnancy, fetal development, and reducing complications.',icon:'<circle cx="12" cy="5" r="3"/><path d="M8 22v-7c0-3 2-5 4-5s4 2 4 5v7"/><circle cx="15" cy="15" r="3"/>'}
};
const TIER_META={
  t1:{lead:'Highest evidence \u00b7 proven benefits',desc:'Backed by consistent, high-quality randomised clinical trials and meta-analyses. Benefits are well-established in healthy populations.',icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'},
  t2:{lead:'Strong evidence \u00b7 consistent effects',desc:'Good evidence from multiple studies for specific, well-defined benefits. Less conclusive than Tier 1 but still reliable.',icon:'<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>'},
  t3:{lead:'Trending but evidence still limited',desc:'Popular, widely-discussed supplements where meaningful clinical evidence is still building or mixed. Use with caution.',icon:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'},
  t4:{lead:'Ineffective or risky',desc:'Supplements where evidence does not support common claims, or where documented risks outweigh benefits.',icon:'<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'},
  unproven:{lead:'Evidence still unclear',desc:'Popular, widely-discussed supplements where meaningful clinical evidence is still building or mixed. Use with caution.',icon:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'}
};
function _filterBanner(title,lead,desc,icon,accentKey){const cls=accentKey?' head-'+accentKey:'';return`<div class="pop-head${cls}"><div class="pop-head-ic"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></div><div class="pop-head-mid"><div class="pop-head-lbl">${escHtml(lead)}</div><div class="pop-head-t">${title}</div><div class="pop-head-m">${escHtml(desc)}</div></div></div>`;}
function _dd(id,label,opts,onSelect){
  return`<div class="cdd" id="${id}-wrap">
    <button type="button" class="cdd-btn" onclick="toggleDD('${id}')">${label} <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <div class="cdd-menu" id="${id}-menu">${opts.map(o=>`<div class="cdd-item" data-val="${o.val}" onclick="${onSelect}('${o.val}');closeDD('${id}')">${o.label}</div>`).join('')}</div>
  </div>`;
}
function toggleDD(id){const m=document.getElementById(id+'-menu');if(!m)return;const open=m.classList.toggle('open');if(open){document.querySelectorAll('.cdd-menu.open').forEach(x=>{if(x.id!==id+'-menu')x.classList.remove('open');});}const wrap=document.getElementById(id+'-wrap');if(wrap)wrap.classList.toggle('cdd-open',open);}
function closeDD(id){document.getElementById(id+'-menu').classList.remove('open');document.getElementById(id+'-wrap').classList.remove('cdd-open');}
function _ddLabel(id,txt){const btn=document.querySelector('#'+id+'-wrap .cdd-btn');if(btn)btn.firstChild.textContent=txt+' ';}
function _ddActive(id){document.querySelectorAll('.cdd-btn').forEach(b=>b.classList.remove('on'));if(!id)return;const btn=document.querySelector('#'+id+'-wrap .cdd-btn');if(btn)btn.classList.add('on');}
document.addEventListener('click',function(e){if(!e.target.closest('.cdd'))document.querySelectorAll('.cdd-menu.open').forEach(m=>{m.classList.remove('open');m.parentElement.classList.remove('cdd-open');});});
function initAllTab(){if(_allTabInit)return;const sfbar=document.getElementById('sfbar-main');if(!sfbar)return;_allTabInit=true;const tierCounts=TIERS.map(t=>({...t,count:t.id==='t3'?S.filter(s=>s.tr).length:S.filter(s=>eTier(s)===t.id).length}));const azOpts=[{val:'all',label:'All A\u2013Z ('+S.length+')'}].concat(AZ_PAIRS.map(p=>{const count=S.filter(s=>{const c=s.n.charAt(0).toUpperCase();return c===p[0]||c===p[1];}).length;return{val:p[0]+p[1],label:p[0]+' & '+p[1]+' ('+count+')'};}));const trCount=S.filter(s=>s.tr).length;const catOpts=CATS.map(c=>({val:c,label:c}));const popOpts=Object.entries(POPULATIONS).map(([k,p])=>({val:k,label:'<span class="pop-lbl">'+p.label+'</span><span class="pop-ct">'+p.supps.length+' supplement'+(p.supps.length>1?'s':'')+'</span>'}));const unpCount=S.filter(s=>eTier(s)==='t3').length;const tr=tierCounts.find(x=>x.id==='t3');const tierOpts=[{val:'t3',label:'Trending ('+(tr?tr.count:0)+')'}];['t1','t2','t4'].forEach(id=>{const t=tierCounts.find(x=>x.id===id);if(t)tierOpts.push({val:t.id,label:t.badge+' ('+t.count+')'});});tierOpts.splice(3,0,{val:'unproven',label:'Unproven ('+unpCount+')'});var sxOpts=[
  {val:'Sleep',label:'Sleep'},
  {val:'Anxiety',label:'Anxiety / Stress'},
  {val:'Mood',label:'Mood / Depression'},
  {val:'Cognition',label:'Memory / Focus'},
  {val:'Cardio',label:'Cardiovascular'},
  {val:'Glucose',label:'Blood sugar'},
  {val:'Joint',label:'Joint / Pain'},
  {val:'Gut',label:'Gut / Digestion'},
  {val:'Immunity',label:'Immunity'},
  {val:'Skin',label:'Skin / Hair / Nails'},
  {val:'Energy',label:'Energy / Fatigue'},
  {val:'Performance',label:'Athletic performance'},
  {val:'Bone',label:'Bone / Calcium'},
  {val:'Hormone',label:'Hormonal balance'},
  {val:'Liver',label:'Liver'},
  {val:'Eye',label:'Eye / Vision'},
  {val:'Pregnancy',label:'Pregnancy / Fertility'},
  {val:'Kids',label:'Kids / Pediatric'}
];
// "Filter by:" inline label — anchors the row left so the filter chips read
// as a coherent group. The legacy Sort dropdown was removed; default sort
// (by composite score) is applied at render time and not user-configurable.
var filterByLbl='<span class="sfbar-filter-by" aria-hidden="true">'
  +'<svg class="sfbar-filter-by-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>'
  +'Filter by:'
  +'</span>';
sfbar.innerHTML=filterByLbl+_dd('cat-filter','Goal',catOpts,'_catPick')+_dd('pop-filter','Age & Sex',popOpts,'_popPick')+_dd('sx-filter','Symptom',sxOpts,'_sxPick');_catPick('__trending__');_ddLabel('cat-filter','Goal');_ddActive(null);_initialLoad=false;}
var SX_KEYWORDS = {
  Sleep:['sleep','insomnia'],
  Anxiety:['anxiety','stress','adapt'],
  Mood:['mood','depress','antidepres'],
  Cognition:['cognit','memory','focus','nootropic','attention','brain'],
  Cardio:['cardiov','heart','blood pressure','cholesterol','lipid'],
  Glucose:['glucose','insulin','metabolic','diabet','a1c'],
  Joint:['joint','pain','arthri','inflamm'],
  Gut:['gut','digest','probiotic','ibs','prebiot','fiber','fibre'],
  Immunity:['immun','cold','flu','antiviral'],
  Skin:['skin','hair','nail','collag','derma'],
  Energy:['energy','fatigu','endurance','stamina','vitality'],
  Performance:['performance','muscle','strength','recovery','sarcopen','hypertroph'],
  Bone:['bone','osteo','fracture','calcium'],
  Hormone:['hormonal','testosterone','estrogen','menopau','pms','menstru','thyroid'],
  Liver:['liver','hepatic','detox','nafld'],
  Eye:['eye','vision','macular','retina'],
  Pregnancy:['pregnan','prenatal','fetal','fertili','reproduct'],
  Kids:['kid','child','pediatric','infant']
};
var SX_LABELS = {
  Sleep:'Sleep',Anxiety:'Anxiety / Stress',Mood:'Mood / Depression',Cognition:'Memory / Focus',
  Cardio:'Cardiovascular',Glucose:'Blood sugar',Joint:'Joint / Pain',Gut:'Gut / Digestion',
  Immunity:'Immunity',Skin:'Skin / Hair / Nails',Energy:'Energy / Fatigue',Performance:'Athletic performance',
  Bone:'Bone / Calcium',Hormone:'Hormonal balance',Liver:'Liver',Eye:'Eye / Vision',
  Pregnancy:'Pregnancy / Fertility',Kids:'Kids / Pediatric'
};
/* Per-symptom banner copy. Each entry feeds the filter banner: a one-line
   subtitle replaces the previous generic "Filtered to supplements with
   evidence..." placeholder so the description actually informs. */
var SX_META = {
  Sleep:{desc:'Supplements with trial evidence for falling asleep faster, staying asleep, or improving sleep architecture. Most useful when paired with consistent sleep hygiene — never a replacement for it.',icon:'<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'},
  Anxiety:{desc:'Adaptogens, amino acids, and minerals shown to lower subjective stress, salivary cortisol, or generalized anxiety symptoms. Effects are typically modest; persistent anxiety warrants clinical care.',icon:'<circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01"/>'},
  Mood:{desc:'Supplements with RCT evidence for reducing depressive symptoms or supporting day-to-day mood. Adjunct to therapy or medication, not a replacement — coordinate with your clinician.',icon:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'},
  Cognition:{desc:'Nutrients and nootropics with measurable effects on attention, working memory, processing speed, or long-term cognitive resilience. Effects are modest; sleep, exercise, and cardiovascular health still dominate.',icon:'<path d="M12 2a4 4 0 00-4 4v14a3 3 0 006 0v-3a3 3 0 013-3h1a4 4 0 000-8 4 4 0 00-4-4z"/>'},
  Cardio:{desc:'Compounds shown to lower LDL cholesterol, blood pressure, triglycerides, or cardiovascular event risk. Several here carry an FDA-authorized health claim — rare for supplements.',icon:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>'},
  Glucose:{desc:'Supplements with RCT evidence for lowering fasting glucose, post-meal spikes, or HbA1c. Most useful for prediabetes and metabolic syndrome — not a substitute for metformin or GLP-1 medications.',icon:'<path d="M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M12 15s-2 0-2-2 2-2 2-4 2 2 2 4-2 2-2 2z"/>'},
  Joint:{desc:'Supplements that reduce stiffness, ease osteoarthritis pain, or slow cartilage breakdown. Effects are typically modest — best paired with progressive strength training.',icon:'<circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="M9 9l6 6"/>'},
  Gut:{desc:'Strain-specific probiotics, soluble and insoluble fibres, and digestive aids with evidence for IBS, regularity, gut-barrier function, or microbiome diversity. Strain matters — generic "probiotic" doesn\'t.',icon:'<path d="M5 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7c-3 0-5-2-5-5s1-4 3-4 3 1 3 2-.5 1.5-1 1.5"/>'},
  Immunity:{desc:'Compounds shown to reduce the frequency, severity, or duration of upper respiratory infections — plus support baseline immune resilience. Vitamin D status matters more than any single supplement here.',icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'},
  Skin:{desc:'Nutrients and bioactives with evidence for skin elasticity, hydration, photoprotection, hair quality, and nail strength — from the inside out. Topical care still does most of the heavy lifting.',icon:'<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>'},
  Energy:{desc:'Mitochondrial cofactors, B-vitamins, and adaptogens with evidence for reducing chronic fatigue and supporting sustained physical and mental energy. Rule out iron, B12, and thyroid deficiency first.',icon:'<path d="M13 2L3 14h7l-2 8L20 10h-7l2-8z"/>'},
  Performance:{desc:'The most-studied category in the database. Evidence-graded for muscle hypertrophy, strength gains, endurance, power output, and post-exercise recovery. Creatine leads the field.',icon:'<path d="M6.5 6.5l11 11M21 21l-1.5-1.5M3 3l1.5 1.5M18 22l4-4M6 2l-4 4M14.5 4l-2.5 2.5M7.5 14l-2.5 2.5"/>'},
  Bone:{desc:'Critical for post-menopausal women, older adults, and anyone with low bone density. Best paired with weight-bearing exercise and adequate dietary protein — supplements alone are not enough.',icon:'<path d="M17 10L8.5 1.5A4 4 0 002 6l.5.5a4 4 0 000 5.5L7 16.5a4 4 0 005.5 0l.5.5a4 4 0 005.5 0 4 4 0 000-5.5z"/>'},
  Hormone:{desc:'Adaptogens, herbs, and nutrients with evidence for testosterone, estrogen, thyroid, or HPA-axis regulation. Effects are modest and highly individual — get bloodwork before chasing symptoms.',icon:'<path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>'},
  Liver:{desc:'Compounds with evidence for protecting liver enzymes, supporting NAFLD, and reducing oxidative damage. Important caveat: several popular &ldquo;liver&rdquo; herbs are actually hepatotoxic — read safety notes carefully.',icon:'<path d="M2 12c0-5 4-9 10-9s10 4 10 9c0 4-3 7-7 8l-3 2v-3c-6 0-10-3-10-7z"/>'},
  Eye:{desc:'Carotenoids, omega-3s, and antioxidants with evidence for retinal health, macular degeneration prevention (AREDS-2 formula), and protection against oxidative damage to the lens.',icon:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'},
  Pregnancy:{desc:'Evidence-graded supplements for fetal development, maternal nutrient status, and fertility. Always coordinate with an OB or reproductive endocrinologist before starting anything new — some common supplements are contraindicated.',icon:'<circle cx="12" cy="5" r="3"/><path d="M8 22v-7c0-3 2-5 4-5s4 2 4 5v7"/><circle cx="15" cy="15" r="3"/>'},
  Kids:{desc:'Supplements with pediatric safety data and dosing — covers common childhood deficiencies (iron, vitamin D), growth support, and developmental nutrients. Always consult a pediatrician before supplementing children.',icon:'<circle cx="12" cy="9" r="3.5"/><path d="M5 21v-2a7 7 0 0114 0v2"/>'}
};
function _sxPick(v){
  var keys=SX_KEYWORDS[v]||[];var label=SX_LABELS[v]||v;
  _ddLabel('sx-filter',label);_ddActive('sx-filter');
  _ddLabel('cat-filter','Goal');_ddLabel('pop-filter','Age & Sex');
  document.querySelectorAll('.sfbtn').forEach(function(b){b.className='sfbtn';});
  af='sx';
  var items=S.filter(function(s){
    if(s.t==='t4')return false;
    var hay=((s.tag||'')+' '+(s.desc||'')).toLowerCase();
    return keys.some(function(k){return hay.indexOf(k)!==-1;});
  }).map(function(s){return Object.assign({},s,{_sc:calcScore(s)});})
    .sort(function(a,b){return b._sc-a._sc;});
  var rowLimit=20;var hasMore=items.length>rowLimit;
  var m=(typeof SX_META!=='undefined'&&SX_META[v])||{};
  var icon=m.icon||'<circle cx="12" cy="12" r="10"/>';
  var defaultDesc='Filtered to supplements with evidence for this symptom or goal. Use as a research starting point — talk to a clinician before changing your regimen.';
  var banner=_filterBanner('Supplements for <b>'+label+'</b>',
    items.length+' supplement'+(items.length===1?'':'s'),
    m.desc||defaultDesc,
    icon);
  var html=items.length
    ? '<div class="tier-sec">'+banner+'<div class="scards">'+items.map(function(s,i){return renderCard(s,hasMore&&i>=rowLimit?' tier-hidden':'');}).join('')+'</div>'+(hasMore?_loadMoreBtn('sx',items.length,rowLimit):'')+'</div>'
    : '<div class="empty">No supplements matched this symptom.</div>';
  document.getElementById('s-content').innerHTML=html;
  var content=document.getElementById('s-content');
  if(content){var stickyH=document.querySelector('.sticky-bar');var offset=stickyH?stickyH.getBoundingClientRect().bottom+12:128;var top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}
}
function _tierPick(v){_ddLabel('tier-filter',v==='unproven'?'Unproven':(TIERS.find(x=>x.id===v)||{}).badge||'Tier');document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');_ddLabel('cat-filter','Goal');_ddLabel('az-filter','A\u2013Z');_ddLabel('pop-filter','Age & Sex');_ddActive('tier-filter');af=v;renderAll();if(_initialLoad){_initialLoad=false;return;}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
function _azPick(v){_ddLabel('az-filter',v==='all'?'All A\u2013Z':v.charAt(0)+' & '+v.charAt(1));_ddActive(v==='all'?null:'az-filter');setAzFilter(v);}
function _catPick(v){
  if(v==='__trending__'){
    _ddLabel('cat-filter','\u{1F4C8} Trending');_ddActive('cat-filter');
    _ddLabel('pop-filter','Age & Sex');
    document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');
    af='t3';
    const items=S.filter(s=>s.tr).sort((a,b)=>calcScore(b)-calcScore(a));
    const rowLimit=20;const hasMore=items.length>20;
    const m={lead:'Popular, widely-discussed supplements',desc:'Supplements trending in health communities where meaningful clinical evidence is still building or mixed. Use with caution.',icon:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'};
    const banner=_filterBanner('Trending',items.length+' supplement'+(items.length===1?'':'s'),m.desc,m.icon,'t3');
    document.getElementById('s-content').innerHTML=items.length?`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=rowLimit?' tier-hidden':'')).join('')}</div>${hasMore?_loadMoreBtn('t3',items.length,rowLimit):''}</div>`:'<div class="empty">No trending supplements found.</div>';
    return;
  }
  _ddLabel('cat-filter',v);_ddActive('cat-filter');setCatFilter(v);
}
function _popPick(v){const p=POPULATIONS[v];if(!p)return;_ddLabel('pop-filter',p.label);_ddActive('pop-filter');setPopFilter(v);}
function setPopFilter(key){const p=POPULATIONS[key];if(!p)return;_ddLabel('cat-filter','Goal');_ddLabel('tier-filter','Tier\u2026');_ddLabel('az-filter','A\u2013Z');document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');af='pop';const q=(document.getElementById('srch')||{}).value||'';const rowLimit=20;const wanted=new Set(p.supps);let items=S.filter(s=>wanted.has(s.n)&&match(s,q));items.sort((a,b)=>calcScore(b)-calcScore(a));const hasMore=items.length>20&&!q;const m=POP_META[key]||{};const banner=_filterBanner('Recommended for <b>'+escHtml(p.label)+'</b>',items.length+' supplement'+(items.length===1?'':'s'),m.desc||'Supplements selected for this group based on clinical relevance and safety. Always consult a clinician for personalised guidance.',m.icon||'<circle cx="12" cy="12" r="10"/>');const html=items.length?`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=rowLimit?' tier-hidden':'')).join('')}</div>${hasMore?_loadMoreBtn('pop',items.length,rowLimit):''}</div>`:'<div class="empty">No supplements found for this group.</div>';document.getElementById('s-content').innerHTML=html;const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.getBoundingClientRect().bottom+12:128;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
function sw(n){const p1=document.getElementById('p1'),p2=document.getElementById('p2');if(p1)p1.style.display=n===1?'block':'none';if(p2)p2.style.display=n===2?'block':'none';const tb1=document.getElementById('tb1'),tb2=document.getElementById('tb2');if(tb1){tb1.classList.toggle('active',n===1);tb1.setAttribute('aria-pressed',n===1);}if(tb2){tb2.classList.toggle('active',n===2);tb2.setAttribute('aria-pressed',n===2);}if(n===2&&typeof initAllTab==='function')initAllTab();}
let selectedConds=new Set();
/* 2026-04-28 UX simplification (v2): surface ALL supplement-relevant conditions as
   selectable pills — typeahead removed. Order is roughly by population prevalence so
   the most common chips render first. Anything in CONDITIONS but missing from this
   list still gets appended below by renderCondChips so we never silently drop a key. */
const TOP_CONDS=['bp','cholesterol','anxiety','gut','inflammation','diabetes','thyroid','depression','allergy','bone','migraine','iron_def','eye','hair','liver','menopause','prostate','pcos','uti'];
function renderCondChips(){
  const el=document.getElementById('cond-chips');if(!el)return;
  // Render every CONDITIONS key as a pill — TOP_CONDS controls the order (most-prevalent first),
  // any new keys added to CONDITIONS later get appended automatically so we never silently drop one.
  const seen=new Set();
  const ordered=[...TOP_CONDS.filter(k=>CONDITIONS[k]&&!seen.has(k)&&seen.add(k)),
                 ...Object.keys(CONDITIONS).filter(k=>!seen.has(k))];
  el.innerHTML=ordered.map(k=>{const c=CONDITIONS[k];return`<div class="med-chip cond-chip ${selectedConds.has(k)?'on':''}" onclick="toggleCond('${escAttrJs(k)}')">${escHtml(c.label)}</div>`;}).join('');
  renderCondExtras();
}
/* Show selected conditions that AREN'T in TOP_CONDS as removable chips below the typeahead. */
function renderCondExtras(){
  const wrap=document.getElementById('cond-chips-extra');if(!wrap)return;
  const extras=Array.from(selectedConds||[]).filter(k=>!TOP_CONDS.includes(k)&&CONDITIONS[k]);
  if(!extras.length){wrap.innerHTML='';wrap.style.display='none';return;}
  wrap.style.display='flex';
  wrap.innerHTML=extras.map(k=>{
    const c=CONDITIONS[k];
    return '<span class="drug-chip" title="Click to remove"><span class="drug-chip-name">'+escHtml(c.label)+'</span><button type="button" class="drug-chip-remove" aria-label="Remove '+escAttr(c.label)+'" onclick="toggleCond(\''+escAttrJs(k)+'\')">×</button></span>';
  }).join('');
}
function toggleCond(k){selectedConds.has(k)?selectedConds.delete(k):selectedConds.add(k);renderCondChips();updatePfCounts();}
/* Phase 4 — typeahead for searching the full CONDITIONS list (19+ conditions) so
   users can find any condition not in the TOP_CONDS chips. Mirrors the drug typeahead. */
let _condTaIdx=-1;
function _condSuggestions(q){
  q=String(q||'').trim().toLowerCase();
  if(q.length<1)return[];
  const out=[];
  for(const[k,c]of Object.entries(CONDITIONS)){
    if(selectedConds.has(k))continue;
    if(TOP_CONDS.includes(k))continue;
    if(c.label.toLowerCase().includes(q)||k.toLowerCase().includes(q)){
      out.push({key:k,label:c.label});
    }
    if(out.length>=8)break;
  }
  return out;
}
function onCondTypeaheadInput(ev){
  const input=ev&&ev.target?ev.target:document.getElementById('cond-typeahead-input');
  if(!input)return;
  const q=String(input.value||'').trim();
  const list=document.getElementById('cond-typeahead-list');if(!list)return;
  _condTaIdx=-1;
  // Empty input on focus → show 8 popular non-top-tier conditions as suggestions.
  if(q.length<1){
    const popular=Object.entries(CONDITIONS||{}).filter(([k])=>!(selectedConds.has(k)||TOP_CONDS.includes(k))).slice(0,8);
    if(!popular.length){list.style.display='none';list.innerHTML='';return;}
    list.style.display='block';
    list.innerHTML='<div class="drug-typeahead-hdr">More conditions</div>'+popular.map(([k,c],i)=>'<div class="drug-typeahead-item" role="option" data-key="'+escAttr(k)+'" data-idx="'+i+'" onclick="addSelectedCondition(\''+escAttrJs(k)+'\')"><span class="drug-ta-name">'+escHtml(c.label)+'</span></div>').join('');
    return;
  }
  const sugs=_condSuggestions(q);
  if(!sugs.length){list.style.display='none';list.innerHTML='';return;}
  list.style.display='block';
  list.innerHTML=sugs.map((s,i)=>'<div class="drug-typeahead-item" role="option" data-key="'+escAttr(s.key)+'" data-idx="'+i+'" onclick="addSelectedCondition(\''+escAttrJs(s.key)+'\')"><span class="drug-ta-name">'+escHtml(s.label)+'</span></div>').join('');
}
function onCondTypeaheadKey(ev){
  const list=document.getElementById('cond-typeahead-list');
  if(!list||list.style.display==='none')return;
  const items=list.querySelectorAll('.drug-typeahead-item');
  if(!items.length)return;
  if(ev.key==='ArrowDown'){ev.preventDefault();_condTaIdx=Math.min(items.length-1,_condTaIdx+1);items.forEach((el,i)=>el.classList.toggle('drug-ta-active',i===_condTaIdx));}
  else if(ev.key==='ArrowUp'){ev.preventDefault();_condTaIdx=Math.max(0,_condTaIdx-1);items.forEach((el,i)=>el.classList.toggle('drug-ta-active',i===_condTaIdx));}
  else if(ev.key==='Enter'){ev.preventDefault();const idx=_condTaIdx>=0?_condTaIdx:0;const k=items[idx].getAttribute('data-key');if(k)addSelectedCondition(k);}
  else if(ev.key==='Escape'){list.style.display='none';list.innerHTML='';_condTaIdx=-1;}
}
function addSelectedCondition(key){
  if(!key||!CONDITIONS[key])return;
  selectedConds.add(key);
  const input=document.getElementById('cond-typeahead-input');if(input)input.value='';
  const list=document.getElementById('cond-typeahead-list');if(list){list.style.display='none';list.innerHTML='';}
  renderCondChips();
  updatePfCounts&&updatePfCounts();
}
/* Close the condition typeahead suggestion list when the user clicks outside it. */
document.addEventListener('click',function(ev){
  if(!ev.target.closest('#cond-typeahead-input')&&!ev.target.closest('#cond-typeahead-list')){
    const list=document.getElementById('cond-typeahead-list');if(list){list.style.display='none';list.innerHTML='';_condTaIdx=-1;}
  }
});
function getCondSupps(){const s=new Set();selectedConds.forEach(k=>{const c=CONDITIONS[k];if(c&&Array.isArray(c.supps))c.supps.forEach(n=>s.add(n));});return s;}

/* ── Goals ── */
const GOALS={
  muscle:{label:'Muscle',supps:['Creatine monohydrate','Whey protein','EAAs (Essential amino acids)','HMB (β-Hydroxy-β-methylbutyrate)','Citrulline malate','Beta-Alanine']},
  weight_loss:{label:'Weight',supps:['Glucomannan (konjac root)','Berberine','Psyllium husk (Plantago ovata)','Green tea extract (EGCG)']},
  cognition:{label:'Cognition',supps:['Creatine monohydrate','Citicoline (CDP-Choline)','Bacopa monnieri','Alpha-GPC','Phosphatidylserine',"Lion's mane mushroom"]},
  energy:{label:'Energy',supps:['Creatine monohydrate','Rhodiola rosea','CoQ10 (Ubiquinol)','Acetyl-L-Carnitine (ALCAR)']},
  sleep:{label:'Sleep',supps:['Magnesium','L-Theanine','Glycine','Melatonin','Tart cherry (Montmorency)','Ashwagandha (KSM-66)']},
  mood:{label:'Mood',supps:['Saffron (Crocus sativus)','Omega-3 (EPA/DHA)','S-Adenosylmethionine (SAMe)','Vitamin D3','Folate (5-MTHF)']},
  immunity:{label:'Immunity',supps:['Vitamin D3','Zinc','Vitamin C (moderate dose)','Elderberry (Sambucus nigra)','Probiotics']},
  skin:{label:'Skin',supps:['Collagen peptides','Omega-3 (EPA/DHA)','Astaxanthin','Vitamin C (moderate dose)']},
  longevity:{label:'Anti-Aging',supps:['Creatine monohydrate','Omega-3 (EPA/DHA)','Vitamin D3','Magnesium','CoQ10 (Ubiquinol)','NMN / NAD+ precursors']},
  gut:{label:'Gut Health',supps:['Probiotics','Psyllium husk (Plantago ovata)','Fibre (general dietary)','Saccharomyces boulardii']},
  joints:{label:'Joints',supps:['Boswellia serrata','Collagen peptides','Curcumin (bioavailable form)','Omega-3 (EPA/DHA)']},
  recovery:{label:'Recovery',supps:['Tart cherry (Montmorency)','Curcumin (bioavailable form)','Magnesium','Omega-3 (EPA/DHA)','Collagen peptides','Glycine']},
  libido:{label:'Libido',supps:['Maca (Lepidium meyenii)','Tongkat ali (Eurycoma longifolia)','Ashwagandha (KSM-66)','Zinc','Citrulline (L-citrulline, pure form)']},
  heart:{label:'Heart',supps:['Omega-3 (EPA/DHA)','Vitamin K2 (MK-7)','CoQ10 (Ubiquinol)','Magnesium','Berberine']}
};
let selectedGoals=new Set();
function renderGoalChips(){const el=document.getElementById('goal-chips');if(!el)return;el.innerHTML=Object.entries(GOALS).map(([k,g])=>`<div class="med-chip ${selectedGoals.has(k)?'on':''}" onclick="toggleGoal('${escAttrJs(k)}')">${escHtml(g.label)}</div>`).join('');}
function toggleGoal(k){selectedGoals.has(k)?selectedGoals.delete(k):selectedGoals.add(k);renderGoalChips();updatePfCounts();}
function getGoalSupps(){const s=new Set();selectedGoals.forEach(k=>{const g=GOALS[k];if(g&&Array.isArray(g.supps))g.supps.forEach(n=>s.add(n));});return s;}

/* ── BMI calculator ── */
function calcBMI(){
  const ft=parseInt(document.getElementById('prof-height-ft')?.value)||0;
  const inch=parseInt(document.getElementById('prof-height-in')?.value)||0;
  const lbs=parseInt(document.getElementById('prof-weight')?.value)||0;
  const el=document.getElementById('bmi-display');
  if(!el||!ft||!lbs)return void(el&&(el.textContent=''));
  const totalIn=ft*12+inch;
  const bmi=(lbs*703)/(totalIn*totalIn);
  if(bmi<10||bmi>80)return void(el.textContent='');
  const cat=bmi<18.5?'Underweight':bmi<25?'Normal':bmi<30?'Overweight':'Obese';
  el.textContent='BMI: '+bmi.toFixed(1)+' ('+cat+')';
}

/* ── Profile persistence: localStorage + URL + email ── */
function saveProfile(){
  const profile={age:document.getElementById('asl').value,sex:sex,meds:[...selectedMeds],conds:[...selectedConds],goals:[...selectedGoals],
    heightFt:document.getElementById('prof-height-ft')?.value||'',heightIn:document.getElementById('prof-height-in')?.value||'',weight:document.getElementById('prof-weight')?.value||'',
    bloodWork:Object.keys(bloodWork).length>0?bloodWork:undefined};
  lsSet('ss-profile',JSON.stringify(profile));
}

/* ── PDF generation ── */
function loadJsPDF(){
  return new Promise((resolve,reject)=>{
    if(window.jspdf)return resolve();
    const s=document.createElement('script');
    s.src='https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js';
    s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
}
/* generatePDF moved to pdf-export.js — loaded via index.html */

async function downloadPDF(){
  try{await loadJsPDF();}catch(e){console.error('PDF library failed to load:',e);alert('Could not generate PDF — please check your internet connection and try again.');return;}
  const age=document.getElementById('asl').value;
  // Generate two PDFs: Summary Card (1 page) and Full Guide (complete)
  const summaryDoc=generatePDF('summary');
  if(summaryDoc)summaryDoc.save('SupplementScore-'+age+'yo-SummaryCard.pdf');
  const fullDoc=generatePDF('full');
  if(fullDoc)fullDoc.save('SupplementScore-'+age+'yo-FullGuide.pdf');
}

function loadProfile(){
  try{
    const saved=lsGet('ss-profile');
    if(!saved)return false;
    const p=JSON.parse(saved);
    if(p.age){const asl=document.getElementById('asl');if(asl){asl.value=p.age;updAge(p.age);}}
    // Validate sex against the known set; an invalid value silently falls through to
    // sex==='' default elsewhere, which was previously the source of subtle "looks like
    // female by default" bugs after a tampered or stale localStorage payload.
    if(p.sex&&(p.sex==='m'||p.sex==='f'||p.sex==='fp'))pickSex(p.sex);
    // Filter persisted Set members against the live key tables. A previous session may
    // have saved a med/condition/goal key that has since been removed from data.js;
    // without this filter, downstream code would do MEDS[k].avoid.forEach(...) and crash.
    if(Array.isArray(p.meds)){selectedMeds=new Set(p.meds.filter(k=>MEDS&&MEDS[k]));renderMedChips();}
    if(Array.isArray(p.conds)){selectedConds=new Set(p.conds.filter(k=>CONDITIONS&&CONDITIONS[k]));renderCondChips();}
    if(Array.isArray(p.goals)){selectedGoals=new Set(p.goals.filter(k=>GOALS&&GOALS[k]));renderGoalChips();}
    if(p.heightFt){const el=document.getElementById('prof-height-ft');if(el)el.value=p.heightFt;}
    if(p.heightIn){const el=document.getElementById('prof-height-in');if(el)el.value=p.heightIn;}
    if(p.weight){const el=document.getElementById('prof-weight');if(el)el.value=p.weight;}
    if(p.bloodWork&&typeof p.bloodWork==='object'){
      bloodWork={};
      for(const[key,val]of Object.entries(p.bloodWork)){
        // Only restore numeric values for known biomarkers; discard anything unexpected
        if(BIOMARKERS[key]){
          const num=parseFloat(val);
          if(!isNaN(num)){
            bloodWork[key]=num;
            const input=document.getElementById('bw-'+key);
            if(input){input.value=num;updateBwRow(key,String(num));}
          }
        }
      }
    }
    calcBMI();
    updatePfCounts();
    return true;
  }catch(e){console.warn('loadProfile: failed to restore saved profile',e);return false;}
}
function clearProfile(){
  lsRemove('ss-profile');
  const asl=document.getElementById('asl');if(asl){asl.value=35;updAge(35);}
  sex=null;
  ['bm','bf','bp'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='sx-btn';});
  selectedMeds=new Set();renderMedChips();
  selectedConds=new Set();renderCondChips();
  selectedGoals=new Set();renderGoalChips();
  ['prof-height-ft','prof-height-in','prof-weight'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  bloodWork={};renderBwGrid();clearBwUpload();
  const bmi=document.getElementById('bmi-display');if(bmi)bmi.textContent='';
  const wb=document.getElementById('welcome-back');if(wb)wb.style.display='none';
  const vres=document.getElementById('v-res');if(vres)vres.style.display='none';
  const vin=document.getElementById('v-input');if(vin)vin.style.display='block';
}
function getShareUrl(){
  const ageEl=document.getElementById('asl');
  const age=ageEl?ageEl.value:'';
  const params=new URLSearchParams();
  params.set('age',age);
  if(sex)params.set('sex',sex);
  if(selectedMeds.size)params.set('meds',[...selectedMeds].join(','));
  if(selectedConds.size)params.set('conds',[...selectedConds].join(','));
  if(selectedGoals.size)params.set('goals',[...selectedGoals].join(','));
  if(Object.keys(bloodWork).length>0)params.set('bw',Object.entries(bloodWork).filter(([,v])=>Number.isFinite(v)).map(([k,v])=>k+':'+v).join(','));
  return window.location.origin+window.location.pathname+'?'+params.toString();
}
function loadFromUrl(){
  const params=new URLSearchParams(window.location.search);
  if(!params.has('age')&&!params.has('sex'))return false;
  const age=params.get('age')||'35';
  const asl=document.getElementById('asl');if(asl){asl.value=age;updAge(age);}
  // Validate sex against the allowed set so a tampered URL like ?sex=foo can't
  // leave the app in an inconsistent state where downstream code assumes 'm'|'f'|'fp'.
  const s=params.get('sex');if(s&&(s==='m'||s==='f'||s==='fp'))pickSex(s);
  // Filter URL-supplied Set keys against the live tables. A bookmarked URL or shared
  // link may reference a med/condition/goal that has since been renamed or removed;
  // without filtering, downstream MEDS[k].avoid.forEach(...) calls would throw.
  const meds=params.get('meds');if(meds){selectedMeds=new Set(meds.split(',').filter(k=>MEDS&&MEDS[k]));renderMedChips();}
  const conds=params.get('conds');if(conds){selectedConds=new Set(conds.split(',').filter(k=>CONDITIONS&&CONDITIONS[k]));renderCondChips();}
  const goals=params.get('goals');if(goals){selectedGoals=new Set(goals.split(',').filter(k=>GOALS&&GOALS[k]));renderGoalChips();}
  const bw=params.get('bw');if(bw){const _allowedBwKeys=(typeof BIOMARKERS==='object'&&BIOMARKERS)?Object.keys(BIOMARKERS):[];bw.split(',').forEach(pair=>{const[k,v]=pair.split(':');if(k&&v&&_allowedBwKeys.indexOf(k)!==-1){const parsed=parseFloat(v);if(isFinite(parsed)){bloodWork[k]=parsed;const input=document.getElementById('bw-'+k);if(input){input.value=v;updateBwRow(k,v);}}}});}
  updatePfCounts();
  return true;
}
function shareProfile(){
  const url=getShareUrl();
  const btn=document.getElementById('share-btn');
  const fallback=()=>{try{prompt('Copy this link:',url);}catch(_){}};
  if(!navigator.clipboard||typeof navigator.clipboard.writeText!=='function'){fallback();return;}
  navigator.clipboard.writeText(url).then(()=>{
    if(!btn)return;
    const orig=btn.textContent;btn.textContent='Copied!';
    setTimeout(()=>{btn.textContent=orig;},2000);
  }).catch(fallback);
}
function showEmailReport(){
  const box=document.getElementById('email-report-box');
  if(!box)return;
  // Initial display may come from CSS rather than inline; fall back to computed.
  const computed=box.style.display||getComputedStyle(box).display;
  box.style.display=computed==='none'?'flex':'none';
}
function sendEmailReport(){
  const inp=document.getElementById('report-email');
  if(!inp)return;
  const email=inp.value.trim();
  if(!email||!email.includes('@'))return;
  const btn=document.getElementById('send-report-btn');
  if(!btn)return;
  btn.textContent='Sending...';btn.disabled=true;
  // Safety net: re-enable the button if the network call never settles.
  const hangGuard=setTimeout(()=>{if(btn.disabled){btn.textContent='Try again';btn.disabled=false;}},15000);
  const ageEl=document.getElementById('asl');
  const age=ageEl?ageEl.value:'';
  const sexLabel=sex==='fp'?'Pregnant woman':sex==='m'?'Male':'Female';
  let summary='SupplementScore Recommendations\n';
  summary+='Profile: '+age+' year old '+sexLabel+'\n';
  if(selectedMeds.size)summary+='Medications: '+[...selectedMeds].map(k=>MEDS[k]?.label||k).join(', ')+'\n';
  if(selectedConds.size)summary+='Conditions: '+[...selectedConds].map(k=>CONDITIONS[k]?.label||k).join(', ')+'\n';
  const recs=_allRecs();
  const selRecs=recs.filter(r=>selectedSupps.has(r.n));
  const addedSel=selRecs.filter(r=>r.p==='added');
  if(addedSel.length){summary+='\n--- Added by you ---\n';addedSel.forEach(r=>{summary+=r.n+' — '+r.dose.split(';')[0]+'\n';});}
  summary+='\n--- Essential ---\n';
  selRecs.filter(r=>r.p==='essential').forEach(r=>{summary+=r.n+' — '+r.dose.split(';')[0]+'\n';});
  summary+='\n--- Recommended ---\n';
  selRecs.filter(r=>r.p==='recommended').forEach(r=>{summary+=r.n+' — '+r.dose.split(';')[0]+'\n';});
  summary+='\n--- Worth Considering ---\n';
  selRecs.filter(r=>r.p==='consider').forEach(r=>{summary+=r.n+' — '+r.dose.split(';')[0]+'\n';});
  summary+='\nView full details: '+getShareUrl()+'\n';
  summary+='\nGenerated by SupplementScore.org';
  fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,subject:'Your SupplementScore Recommendations',message:summary,source:'email-report',date:new Date().toISOString()})}).then(r=>{
    clearTimeout(hangGuard);
    if(r.ok){btn.textContent='Sent!';setTimeout(()=>{const box=document.getElementById('email-report-box');if(box)box.style.display='none';btn.textContent='Send';btn.disabled=false;},2000);}
    else{btn.textContent='Try again';btn.disabled=false;}
  }).catch(()=>{clearTimeout(hangGuard);btn.textContent='Try again';btn.disabled=false;});
}

/* ── Profile accordion toggle ── */
function pfToggle(btn){if(!btn)return;const sec=btn.closest('.pf-section');if(sec)sec.classList.toggle('pf-open');}
function updatePfCounts(){
  const gc=document.getElementById('pf-count-goals'),cc=document.getElementById('pf-count-conds'),mc=document.getElementById('pf-count-meds'),bc=document.getElementById('pf-count-bw');
  if(gc){const n=selectedGoals.size;gc.textContent=n?n+' selected':'';gc.classList.toggle('has-count',n>0);}
  if(cc){const n=selectedConds.size;cc.textContent=n?n+' selected':'';cc.classList.toggle('has-count',n>0);}
  if(mc){const n=selectedMeds.size;mc.textContent=n?n+' selected':'';mc.classList.toggle('has-count',n>0);}
  if(bc){const n=Object.keys(bloodWork).length;bc.textContent=n?n+' entered':'optional';bc.style.color='';bc.style.background='';bc.classList.toggle('has-count',n>0);}
}

/* ── Init: load profile from URL or localStorage ── */
renderMedChips();
renderCondChips();
renderGoalChips();
renderBwGrid();
updatePfCounts();
['prof-height-ft','prof-height-in','prof-weight'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',calcBMI);});
initAllTab();

(function(){
  // Reader mode: ?article=N opens a clean article-only view in a separate window
  const artMatch = window.location.search.match(/[?&]article=(\d+)/);
  if(artMatch){
    const artId = parseInt(artMatch[1], 10);
    document.body.classList.add('reader-mode');
    document.title = 'Article · SupplementScore';
    // Show research view container (articles live inside it)
    const rv = document.getElementById('research-view');
    if(rv) rv.style.display = '';
    const sv = document.getElementById('supplements-view');
    if(sv) sv.style.display = 'none';
    // Inject floating close button (no sticky nav = no content clip)
    const readerFab = document.createElement('button');
    readerFab.className = 'reader-close-fab';
    readerFab.setAttribute('onclick', 'readerClose()');
    readerFab.setAttribute('aria-label', 'Close article');
    readerFab.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    document.body.appendChild(readerFab);
    // Render the article
    if(typeof _renderArticleInline === 'function'){
      _renderArticleInline(artId);
    }
    return; // skip normal init
  }
  if(loadFromUrl()){
    // URL params present — switch to profile tab and auto-generate
    sw(1);genRecs();
    window.history.replaceState({},'',window.location.pathname);
  }else if(loadProfile()){
    // Restored from localStorage — stay on profile tab, profile fields pre-filled
    const wb=document.getElementById('welcome-back');if(wb)wb.style.display='flex';
  }else{
    // First visit — start fresh
    selectedGoals=new Set();renderGoalChips();
    selectedConds=new Set();renderCondChips();
    selectedMeds=new Set();renderMedChips();
    bloodWork={};
    updatePfCounts();
  }
})();

/* Ensure SVG title attributes show as native tooltips */
document.querySelectorAll('svg.logo-icon[title]').forEach(function(svg){
  const wrapper=document.createElement('span');
  wrapper.title=svg.getAttribute('title');
  wrapper.style.display='inline-block';
  svg.parentNode.insertBefore(wrapper,svg);
  wrapper.appendChild(svg);
});

/* Tab switching: Supplements / Profile / Articles / About */
function switchTab(tab){
  const views={supplements:document.getElementById('supplements-view'),research:document.getElementById('research-view'),about:document.getElementById('about-view')};
  const tabs={supplements:document.getElementById('tab-supplements'),profile:document.getElementById('tab-profile'),research:document.getElementById('tab-research'),about:document.getElementById('tab-about')};
  // Show/hide main views
  Object.keys(views).forEach(k=>{if(views[k])views[k].style.display=k===tab?'':'none';});
  // Reset articles to list view when switching to articles tab
  if(tab==='research'&&typeof showArticleList==='function')showArticleList();
  // Profile is inside supplements-view as p1, so handle specially
  const setDisp=(id,v)=>{const el=document.getElementById(id);if(el)el.style.display=v;};
  const ixHero=document.querySelector('.ix-hero');
  if(tab==='profile'){
    if(views.supplements)views.supplements.style.display='';
    setDisp('p2','none');
    setDisp('main-sticky','none');
    if(ixHero)ixHero.style.display='none';
    // Hide header and stats on profile page
    const hdr=document.querySelector('.page-header');if(hdr)hdr.style.display='none';
    const evCard=document.querySelector('.ev-card');if(evCard)evCard.style.display='none';
    // Show gate or real profile
    if(profileUnlocked){
      setDisp('profile-gate','none');
      setDisp('p1','block');
    }else{
      setDisp('p1','none');
      setDisp('profile-gate','block');
    }
  }else if(tab==='supplements'){
    setDisp('profile-gate','none');
    setDisp('p1','none');
    setDisp('p2','block');
    if(ixHero)ixHero.style.display='';
    // Show header and stats on supplements page
    const hdr=document.querySelector('.page-header');if(hdr)hdr.style.display='';
    const evCard=document.querySelector('.ev-card');if(evCard)evCard.style.display='';
    setDisp('main-sticky','');
  }
  // Update active tab
  Object.keys(tabs).forEach(k=>{if(tabs[k])tabs[k].classList.toggle('active',k===tab);});
  if(tab==='about'){
    const src=document.getElementById('about-content-inline');
    const tgt=document.getElementById('about-content-target');
    if(src&&tgt&&!tgt.children.length){tgt.appendChild(src);src.style.display='';}
  }
  /* Only scroll to top on USER-initiated tab switches.
     On initial page load (and on history.back()/forward navigation), respect
     the browser's restored scroll position so the user lands where they were.
     Callers pass `true` from click handlers; the page-init applyHash() call
     omits the arg and we keep the existing scroll. */
  if (window._tabSwitchByUser === true) {
    window.scrollTo({top:0,behavior:'smooth'});
  }
}

/* Profile gate: secret code or email signup */
function handleGateSubmit(e){
  e.preventDefault();
  const inp=document.getElementById('gate-email');
  if(!inp)return false;
  const val=(inp.value||'').trim();
  if(!val)return false;
  // Secret unlock code
  if(val==='12345'){
    profileUnlocked=true;
    const gate=document.getElementById('profile-gate');if(gate)gate.style.display='none';
    const p1=document.getElementById('p1');if(p1)p1.style.display='block';
    inp.value='';
    return false;
  }
  // Treat as email signup — basic validation
  if(!val.includes('@')||val.length<5){
    inp.style.borderColor='#B91C1C';
    inp.setAttribute('placeholder','Enter a valid email address');
    inp.value='';
    setTimeout(()=>{inp.style.borderColor='';inp.setAttribute('placeholder','Enter your email for early access');},2000);
    return false;
  }
  // Send to Formspree (same endpoint as PDF/email reports)
  fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:val,source:'early-access-signup',date:new Date().toISOString()})}).catch(()=>{});
  // Show success state
  const gateForm=document.querySelector('.gate-form');if(gateForm)gateForm.style.display='none';
  const gateSuccess=document.getElementById('gate-success');if(gateSuccess)gateSuccess.style.display='flex';
  return false;
}

/* Keyboard handling for supplement cards is merged into the consolidated handler below. */

/* Logo strip: show only what fits in a single row based on viewport */
function fitLogoStrip(){
  var strips=document.querySelectorAll('.logo-strip');
  strips.forEach(function(strip){
    var icons=strip.querySelectorAll('.logo-icon');
    if(!icons.length)return;
    // Reset: reveal all first so we can measure widths
    icons.forEach(function(i){i.classList.remove('logo-hidden');});
    // Measure available width and cumulative widths
    var available=strip.clientWidth;
    if(!available)return;
    var gapPx=parseFloat(getComputedStyle(strip).gap)||6;
    var used=0,kept=0;
    icons.forEach(function(ic,idx){
      var w=ic.getBoundingClientRect().width;
      var next=used+w+(idx>0?gapPx:0);
      if(next<=available){used=next;kept++;}
      else{ic.classList.add('logo-hidden');}
    });
  });
}
window.addEventListener('load',fitLogoStrip);
window.addEventListener('resize',function(){clearTimeout(window.__fitLST);window.__fitLST=setTimeout(fitLogoStrip,80);});
document.addEventListener('DOMContentLoaded',fitLogoStrip);

/* A11y: make hero slides (clickable divs) keyboard-navigable via a single delegated handler.
   Adds role="link" + tabindex=0 once on load, and routes Enter/Space to their native click. */
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.hero-slide').forEach(function(el){
    if(!el.hasAttribute('role'))el.setAttribute('role','link');
    if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0');
    if(!el.hasAttribute('aria-label')){
      var t=el.querySelector('.hero-slide-title,.hero-title,h2,h3');
      if(t)el.setAttribute('aria-label',t.textContent.trim());
    }
  });
});
/* Consolidated global keydown handler — merges prior plan-modal, article-modal,
   supplement-card, and hero-slide listeners. */
document.addEventListener('keydown',function(e){
  var target=e.target;
  var isFormElement=target&&target.matches&&target.matches('input,textarea,select');

  if(e.key==='Escape'){
    // Close modals in priority order, bailing after the first match.
    var planOverlay=document.getElementById('plan-overlay');
    if(planOverlay&&planOverlay.classList.contains('open')&&typeof closePlanModal==='function'){closePlanModal();return;}
    var suppModal=document.getElementById('supp-modal');
    if(suppModal&&suppModal.classList.contains('open')){closeSuppModal();return;}
    var artModal=document.getElementById('art-modal');
    if(artModal&&artModal.classList.contains('open')){closeArtModal();return;}
  }

  // Article modal: left/right arrow navigation (ignored while typing).
  var artModal2=document.getElementById('art-modal');
  if(artModal2&&artModal2.classList.contains('open')&&!isFormElement){
    if(e.key==='ArrowLeft'){e.preventDefault();artNavPrev();return;}
    if(e.key==='ArrowRight'){e.preventDefault();artNavNext();return;}
  }

  // Enter/Space activation for keyboard-accessible click surfaces.
  if(e.key==='Enter'||e.key===' '){
    if(target&&target.classList){
      if(target.classList.contains('sc')){
        e.preventDefault();
        var btn=target.querySelector('.sc-toggle');
        if(btn)toggleCard(btn);
        return;
      }
      if(target.classList.contains('hero-slide')){
        e.preventDefault();
        target.click();
        return;
      }
    }
  }
});
