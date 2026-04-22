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
// Escape a value for safe use inside an HTML attribute (single or double quoted)
function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function renderMedChips(){const el=document.getElementById('med-chips');el.innerHTML=Object.entries(MEDS).map(([k,m])=>`<div class="med-chip ${selectedMeds.has(k)?'on':''}" onclick="toggleMed('${escAttr(k)}')">${escHtml(m.label)}</div>`).join('');updateMedNote();}
function toggleMed(k){selectedMeds.has(k)?selectedMeds.delete(k):selectedMeds.add(k);renderMedChips();updatePfCounts();}
function updateMedNote(){const n=document.getElementById('med-note');if(selectedMeds.size===0){n.style.display='none';return;}n.style.display='block';const avoidAll=new Set(),cautionAll=new Set(),extraAll=new Set();selectedMeds.forEach(k=>{const m=MEDS[k];m.avoid.forEach(x=>avoidAll.add(x));m.caution.forEach(x=>cautionAll.add(x));m.extra.forEach(x=>extraAll.add(x));});n.innerHTML=`${avoidAll.size>0?'⚠ Will exclude: '+[...avoidAll].join(', ')+'. ':''}${cautionAll.size>0?'⚡ Will flag cautions on: '+[...cautionAll].join(', ')+'. ':''}${extraAll.size>0?'✚ Will add: '+[...extraAll].join(', ')+'.':''}`;}
function getMedInteractions(){const avoidAll=new Set(),cautionMap={},extraAll=new Set(),notes=[];selectedMeds.forEach(k=>{const m=MEDS[k];m.avoid.forEach(x=>avoidAll.add(x));m.caution.forEach(x=>{if(!cautionMap[x])cautionMap[x]=[];cautionMap[x].push(m.label);});m.extra.forEach(x=>extraAll.add(x));notes.push({med:m.label,note:m.note});});return{avoid:avoidAll,caution:cautionMap,extra:[...extraAll],notes};}
function dots(n,tp){return Array.from({length:5},(_,i)=>`<div class="rt-dot ${i<n?'on-'+tp:''}"></div>`).join('');}
function rHtml(e,s,r,o,c,d){return`<div class="rt-section">${e!=null?`<div class="rt-row"><span class="rt-lbl">Efficacy</span><div class="rt-dots">${dots(e,'e')}</div><span class="rt-text">${EL[e]||''}</span></div>`:''}${s!=null?`<div class="rt-row"><span class="rt-lbl">Safety</span><div class="rt-dots">${dots(s,s<=2?'d':'s')}</div><span class="rt-text">${SL[s]||''}</span></div>`:''}${r!=null?`<div class="rt-row"><span class="rt-lbl">Research</span><div class="rt-dots">${dots(r,r<=2?'d':'e')}</div><span class="rt-text">${RL[r]||''}</span></div>`:''}${o!=null?`<div class="rt-row"><span class="rt-lbl">Onset</span><div class="rt-dots">${dots(o,o<=2?'d':'s')}</div><span class="rt-text">${OL[o]||''}</span></div>`:''}${c!=null?`<div class="rt-row"><span class="rt-lbl">Value</span><div class="rt-dots">${dots(c,c<=2?'d':'e')}</div><span class="rt-text">${CL[c]||''}</span></div>`:''}${d!=null?`<div class="rt-row"><span class="rt-lbl">Interact.</span><div class="rt-dots">${dots(d,d<=2?'d':'s')}</div><span class="rt-text">${DL[d]||''}</span></div>`:''}</div>`;}

function toggleSrcSidebar(){const d=document.getElementById('src-detail2'),open=d.classList.toggle('open');document.getElementById('chv2').classList.toggle('open',open);document.getElementById('sml2').textContent=open?'Hide sources':'More info on sources';}
function toggleMeth(){const d=document.getElementById('meth-body'),open=d.classList.toggle('open');document.getElementById('meth-chv').classList.toggle('open',open);}
function decodeContact(e){e.preventDefault();const p=['yvese','ggleston','@','gm','ail','.com'];window.location.href='mai'+'lto:'+p.join('');}
// Minimal email format validator — accepts nearly anything with a local@domain.tld shape.
function isValidEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function submitContrib(){const email=document.getElementById('contrib-email').value.trim();if(!isValidEmail(email)){document.getElementById('contrib-email').style.borderColor='var(--t4c)';return;}const btn=document.querySelector('.abt-cta-email button');btn.textContent='Sending...';btn.disabled=true;fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,source:'contributor',date:new Date().toISOString()})}).then(r=>{if(r.ok){document.querySelector('.abt-cta-email').style.display='none';document.getElementById('contrib-success').style.display='block';}else{btn.textContent='Try again';btn.disabled=false;}}).catch(err=>{console.warn('[SupplementScore] contrib submission failed',err);btn.textContent='Try again';btn.disabled=false;});}
function submitEarlyAccess(){const email=document.getElementById('ea-email').value.trim();if(!isValidEmail(email)){document.getElementById('ea-email').style.borderColor='var(--t4c)';return;}const btn=document.querySelector('.ea-btn');btn.textContent='Sending...';btn.disabled=true;fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,source:'early-access',date:new Date().toISOString()})}).then(r=>{if(r.ok){document.getElementById('ea-form').style.display='none';document.getElementById('ea-success').style.display='block';}else{btn.textContent='Try again';btn.disabled=false;}}).catch(err=>{console.warn('[SupplementScore] early-access submission failed',err);btn.textContent='Try again';btn.disabled=false;});}
function ageGroup(a){if(a<26)return'Young adult (18–25)';if(a<31)return'Young adult (26–30)';if(a<46)return'Adult (31–45)';if(a<61)return'Middle-aged adult (46–60)';if(a<76)return'Senior adult (61–75)';return'Older adult (76+)';}
function updAge(v){document.getElementById('age-grp').textContent=ageGroup(parseInt(v));}
function stepAge(d){const el=document.getElementById('asl');let v=parseInt(el.value||35)+d;v=Math.max(18,Math.min(90,v));el.value=v;updAge(v);}
function clampAge(el){let v=parseInt(el.value);if(isNaN(v))v=35;v=Math.max(18,Math.min(90,v));el.value=v;updAge(v);}
const _ageInput=document.getElementById('asl');
if(_ageInput){
  _ageInput.addEventListener('input',function(){updAge(this.value);});
  updAge(_ageInput.value);
}
let sex=null;
function pickSex(s){sex=s;const bm=document.getElementById('bm'),bf=document.getElementById('bf'),bp=document.getElementById('bp');bm.className='pf-sex-opt sx-btn'+(s==='m'?' on-m':'');bf.className='pf-sex-opt sx-btn'+(s==='f'?' on-f':'');bp.className='pf-sex-opt sx-btn'+(s==='fp'?' on-fp':'');document.getElementById('serr').style.display='none';}
function editP(){
  document.getElementById('v-res').style.display='none';
  document.getElementById('v-input').style.display='block';
  // Collapse all accordion sections
  document.querySelectorAll('.pf-section').forEach(s=>s.classList.remove('pf-open'));
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
      if(s)recs.push({n:s.n,p:'recommended',tier:s.t,tf:false,e:s.e,s:s.s,
        why:`Recommended because of your selected medication(s) — ${Object.entries(MEDS).filter(([,m])=>m.extra.includes(n)).map(([,m])=>m.label).join(', ')}.`,
        dose:s.dose,_medExtra:true});
    }
  });
}
function renderMedAlerts(mi){
  const ab=document.getElementById('med-alert-box');
  if(selectedMeds.size===0||(!mi.avoid.size&&!Object.keys(mi.caution).length&&!mi.notes.length)){ab.innerHTML='';return;}
  let html='<div class="med-alert"><div class="med-alert-hdr">\u26A0 Medication interactions considered</div>';
  if(mi.avoid.size>0)html+=`<div class="med-alert-item"><b>Removed from your list:</b> ${[...mi.avoid].join(', ')}</div>`;
  Object.entries(mi.caution).forEach(([n,meds])=>{html+=`<div class="med-alert-item"><b>${n}</b> — caution with: ${meds.join(', ')}</div>`;});
  mi.notes.forEach(x=>{html+=`<div class="med-alert-item"><b>${x.med}:</b> ${x.note}</div>`;});
  ab.innerHTML=html+'</div>';
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
const _morningSupps=new Set(['Vitamin D3','Iron','Vitamin B12','Folate (5-MTHF)','Vitamin B6 (P5P)','S-Adenosylmethionine (SAMe)','Rhodiola rosea','Tyrosine (L-tyrosine)','Acetyl-L-Carnitine (ALCAR)','Vitamin D3 liquid drops','Omega-3 (EPA/DHA)','CoQ10 (Ubiquinol)','Choline','Zinc','Iodine']);
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
    return`<div class="bw-row" id="bw-row-${key}"><div class="bw-row-icon" style="background:linear-gradient(135deg,${bio.gradient[0]},${bio.gradient[1]})">${BW_ICONS[bio.icon]||''}</div><div class="bw-row-info"><div class="bw-row-name">${bio.name}</div><div class="bw-row-range">${rangeText}</div></div><input type="text" id="bw-${key}" placeholder="\u2014" oninput="updateBwRow('${key}',this.value)"><div class="bw-row-unit">${bio.unit}</div><div class="bw-row-dot"></div></div>`;
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
  const open=m.style.display==='none';
  m.style.display=open?'block':'none';
  btn.innerHTML=open?'Hide manual entry &#9652;':'Enter values manually &#9662;';
}

// Each biomarker: name patterns to find on a line, and a unit-conversion map
// (source unit string -> multiplier that converts the raw value into the canonical
// unit used by BIOMARKERS). "exclude" patterns disqualify a line for this biomarker
// (used so that e.g. "HDL CHOLESTEROL" doesn't get claimed as total cholesterol).
const BW_ALIASES={
  hdl:{names:[/\bhdl[\s\-]*(?:cholesterol|chol|c)?\b/i,/high[\s\-]*density\s*lipo/i],
    exclude:[/non[\s\-]*hdl/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':38.67,'mmol/L':38.67}},
  ldl:{names:[/\bldl[\s\-]*(?:cholesterol|chol|c)?(?:[\s\-]*calc\.?)?\b/i,/low[\s\-]*density\s*lipo/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':38.67,'mmol/L':38.67}},
  triglycerides:{names:[/triglycerides?/i,/\btrig\b/i,/\btg\b/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':88.57,'mmol/L':88.57}},
  totalChol:{names:[/total\s*cholesterol/i,/cholesterol[\s,]*total/i,/^\s*cholesterol\b/i,/\bcholesterol\b/i],
    exclude:[/\bhdl\b/i,/\bldl\b/i,/non[\s\-]*hdl/i,/vldl/i,/tc\s*\//i,/ratio/i],
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':38.67,'mmol/L':38.67}},
  vitD:{names:[/25[\s\-]*hydroxy\s*vitamin\s*d\b/i,/vitamin\s*d[,.\s]*25[\s\-]*(?:oh|hydroxy)/i,/25[\s\-]*\(?\s*oh\s*\)?[\s\-]*d\b/i,/25[\s\-]*(?:oh|hydroxy)/i,/\bvit(?:amin)?\s*d[23]?\b/i],
    units:{'ng/ml':1,'ng/mL':1,'nmol/l':0.4,'nmol/L':0.4}},
  b12:{names:[/\bvitamin\s*b[\s\-]*12\b/i,/\bb[\s\-]*12\b/i,/\bcobalamin\b/i,/methylcobalamin/i,/cyanocobalamin/i],
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
    units:{'mg/dl':1,'mg/dL':1,'mmol/l':18.02,'mmol/L':18.02}}
};

// Order matters: specific patterns first so "HDL CHOLESTEROL" doesn't get
// claimed by totalChol. Total cholesterol is deliberately placed after lipids.
const BW_PARSE_ORDER=['hdl','ldl','triglycerides','freeTesto','testosterone','folateRbc','folate','magRbc','totalChol','vitD','b12','ferritin','tsh','crp','omega3','zinc','hba1c','fastingGlucose'];

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

// Per-biomarker line parser. Returns {extracted:{key:canonicalValue}, found:count}.
function parseBiomarkers(text){
  const lines=text.split(/\r?\n/).map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
  const claimed=new Set();
  const extracted={};
  for(const key of BW_PARSE_ORDER){
    const def=BW_ALIASES[key];
    const bio=BIOMARKERS[key];
    if(!def||!bio)continue;
    for(let li=0;li<lines.length;li++){
      if(claimed.has(li))continue;
      const line=lines[li];
      // Exclude lines the user has said don't count for this biomarker
      if(def.exclude&&def.exclude.some(rx=>rx.test(line)))continue;
      // Find the earliest name match. If multiple patterns match at the same
      // start, take the longest (skips past compound-name tokens like "25-HYDROXY").
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
      // Sanity-check: reject values wildly outside plausible range (catches OCR blips
      // and cases where we guessed the wrong unit). Allow up to 5x the "high" bound.
      const ceiling=bio.high*5;
      if(!isFinite(canonical)||canonical<0||canonical>ceiling)continue;
      extracted[key]=Math.round(canonical*100)/100;
      claimed.add(li);
      break;
    }
  }
  return {extracted,found:Object.keys(extracted).length};
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
    const {extracted,found}=parseBiomarkers(text);
    // Apply extracted values into bloodWork + manual grid
    for(const[k,v]of Object.entries(extracted)){
      bloodWork[k]=v;
      const input=document.getElementById('bw-'+k);
      if(input){input.value=v;updateBwRow(k,String(v));}
    }
    // Swap upload zone for "uploaded" bar
    setBwUploadStatus(null);
    uploadEl.style.display='none';
    uploadedEl.style.display='flex';
    document.getElementById('bw-file-name').textContent=file.name;
    document.getElementById('bw-extracted-count').textContent=found+' biomarker'+(found!==1?'s':'')+' extracted';
    // Auto-expand the manual grid so user can verify / correct
    document.getElementById('bw-manual').style.display='block';
    document.getElementById('bw-manual-toggle').innerHTML='Hide manual entry &#9652;';
    updateBwCount();
    if(typeof updatePfCounts==='function')updatePfCounts();
    if(!found){
      setTimeout(()=>{alert('We could not identify any recognized biomarkers in this report. Please enter values manually below.');},50);
    }
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

  let html='';
  results.forEach(r=>{
    // Range bar position
    const range=r.bio.high-((r.bio.highOnly)?0:(r.bio.low||0));
    const base=r.bio.highOnly?0:(r.bio.low||0);
    const pct=Math.max(2,Math.min(98,((r.val-base)/range)*100));

    let suppHtml='';
    if(r.needsAction&&r.bio.supps){
      r.bio.supps.forEach(sr=>{
        const sup=_suppByName.get(sr.name);
        const sc=sup?calcScore(sup):0;
        const scGrad=sc>=72?'linear-gradient(180deg,var(--t1c),#0F766E)':sc>=60?'linear-gradient(180deg,var(--t2c),#3B5FC0)':sc>=40?'linear-gradient(180deg,var(--t3c),#A16207)':'linear-gradient(180deg,var(--t4c),#991B1B)';
        suppHtml+=`<div class="bw-supp-rec"><div style="width:28px;height:28px;border-radius:7px;background:${scGrad};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0">${sc}</div><div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:600">${sr.name} \u2014 ${sr.dose}</div><div style="font-size:9px;color:var(--color-text-tertiary);margin-top:1px">${sr.note}</div></div></div>`;
      });
    }

    html+=`<div class="bw-def-card ${statusClass[r.status]||''}"><div style="width:36px;text-align:center;flex-shrink:0"><div style="font-size:16px;font-weight:700;color:${colorMap[r.color]};line-height:1">${r.val}</div><div style="font-size:7px;color:var(--color-text-tertiary);margin-top:2px">${r.bio.unit}</div></div><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:5px;margin-bottom:2px"><div style="font-size:12px;font-weight:600">${r.bio.name}</div><div style="font-size:8px;font-weight:600;padding:1px 6px;border-radius:8px;background:${bgMap[r.color]};color:${txMap[r.color]}">${r.statusLabel}</div></div><div style="font-size:10px;color:var(--color-text-secondary);line-height:1.4">${r.bio.desc}</div>${!r.bio.highOnly?`<div style="display:flex;align-items:center;gap:6px;margin-top:5px"><div style="flex:1;height:5px;border-radius:3px;background:#eee;position:relative;overflow:visible"><div style="height:100%;border-radius:3px;width:100%;background:linear-gradient(90deg,var(--t4c),var(--t3c) 35%,var(--t1c) 55%,var(--t2c));position:absolute;left:0;top:0"></div><div style="width:8px;height:8px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);position:absolute;top:-1.5px;left:${pct}%;background:${colorMap[r.color]};z-index:1"></div></div></div><div style="display:flex;justify-content:space-between;font-size:7px;color:var(--color-text-tertiary);margin-top:2px"><span>${r.bio.low||0}</span><span>${r.bio.optLow}-${r.bio.optHigh} Optimal</span><span>${r.bio.high}</span></div>`:''}`+suppHtml+`</div></div>`;
  });

  cards.innerHTML=html;
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
  if(!sex){document.getElementById('serr').style.display='block';return;}
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
  const recs=getRecs(age,sex).filter(r=>!mi.avoid.has(r.n));
  applyMedExtras(recs,mi);
  // Add condition-based and goal-based supplements
  const condSupps=getCondSupps();
  const goalSupps=getGoalSupps();
  goalSupps.forEach(n=>{if(!mi.avoid.has(n)&&!recs.find(r=>r.n===n)){const s=_suppByName.get(n);if(s){const matchedGoals=[...selectedGoals].filter(k=>GOALS[k]&&GOALS[k].supps.includes(n)).map(k=>GOALS[k].label);const goalStr=matchedGoals.length?matchedGoals.join(' & '):'your selected goals';recs.push({n:s.n,p:'consider',tier:s.t,tf:false,e:s.e,s:s.s,why:`Matches your "${goalStr}" goal.`,dose:s.dose,_goalExtra:true});}}});
  condSupps.forEach(n=>{if(!mi.avoid.has(n)&&!recs.find(r=>r.n===n)){const s=_suppByName.get(n);if(s){const matchedConds=[...selectedConds].filter(k=>CONDITIONS[k]&&CONDITIONS[k].supps.includes(n)).map(k=>CONDITIONS[k].label);const condStr=matchedConds.length?matchedConds.join(' & '):'your selected conditions';recs.push({n:s.n,p:'consider',tier:s.t,tf:false,e:s.e,s:s.s,why:`Recommended for ${condStr}.`,dose:s.dose,_condExtra:true});}}});

  // Blood work integration — boost supplements matching deficiencies
  const bwResults=Object.keys(bloodWork).length>0?analyzeBloodWork():[];
  if(bwResults.length>0){
    bwResults.forEach(r=>{
      if(!r.needsAction)return;
      r.bio.supps.forEach(sr=>{
        // Add supplement if not already in recs
        const existing=recs.find(x=>x.n===sr.name);
        if(!existing&&!mi.avoid.has(sr.name)){
          const s=_suppByName.get(sr.name);
          if(s)recs.push({n:s.n,p:r.status==='critical'?'essential':'recommended',tier:s.t,tf:false,e:s.e,s:s.s,why:'Based on your blood work results.',dose:s.dose,_bwExtra:true});
        }else if(existing){
          if(existing.p==='consider')existing.p='recommended';
          if(r.status==='critical'&&existing.p==='recommended')existing.p='essential';
          if(!existing._bwExtra)existing.why=(existing.why||'')+' Also supported by your blood work.';
          existing._bwExtra=true;
        }
      });
    });
    renderBwResults(bwResults);
    document.getElementById('bw-results').style.display='block';
  }else{
    document.getElementById('bw-results').style.display='none';
  }

  const sexLabel=sex==='fp'?'pregnant woman':sex==='m'?'man':'woman';
  document.getElementById('res-hd').textContent='Your recommendations';
  document.getElementById('res-sh').textContent=`${age}-year-old ${sexLabel} \u00B7 Last updated today`;

  // Banner chips
  const essCount=recs.filter(x=>x.p==='essential').length;
  const recCount=recs.filter(x=>x.p==='recommended').length;
  const conCount=recs.filter(x=>x.p==='consider').length;
  const resChips=document.getElementById('res-chips');
  if(resChips)resChips.innerHTML=[
    {n:essCount,l:'Essential',c:'#34D399'},{n:recCount,l:'Recommended',c:'#60A5FA'},{n:conCount,l:'Consider',c:'#FBBF24'}
  ].map(s=>`<div class="res-chip"><div class="rc-dot" style="background:${s.c}"></div><span class="rc-num">${s.n}</span> ${s.l}</div>`).join('');

  renderMedAlerts(mi);

  // Store recs globally for plan modal access
  _lastRecs=recs;
  _lastMi=mi;
  _lastBwResults=bwResults;

  // Render selectable supplement cards
  renderSuppCards(recs,mi,bwResults);

  document.getElementById('v-input').style.display='none';
  document.getElementById('v-res').style.display='block';
  saveProfile();
  // Pre-fill email field if provided (user must click Send manually)
  const profEmail=document.getElementById('prof-email')?.value?.trim();
  if(profEmail&&profEmail.includes('@')){document.getElementById('report-email').value=profEmail;document.getElementById('email-report-box').style.display='flex';}
}

/* ══ Selectable supplement cards ══ */
let selectedSupps=new Set();
// Module-level state shared between _showRecs, openPlanModal, sendPlanEmail etc.
let _lastRecs=[],_lastMi={avoid:new Set(),caution:{},extra:[],notes:[]},_lastBwResults=[];

function renderSuppCards(recs,mi,bwResults){
  const container=document.getElementById('supp-cards-container');
  if(!container)return;

  const essItems=recs.filter(x=>x.p==='essential');
  const recItems=recs.filter(x=>x.p==='recommended');
  const conItems=recs.filter(x=>x.p==='consider');

  // Pre-select essential + recommended
  selectedSupps=new Set();
  essItems.forEach(r=>selectedSupps.add(r.n));
  recItems.forEach(r=>selectedSupps.add(r.n));

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
    tags+=`<span class="supp-card-tag ${eff>=4?'sct-eff':'sct-dim'}">Efficacy ${eff}/5</span>`;
    tags+=`<span class="supp-card-tag ${saf>=4?'sct-safe':'sct-dim'}">Safety ${saf}/5</span>`;
    const tierLabel=r.tier==='t1'?'Tier 1':r.tier==='t2'?'Tier 2':r.tier==='t3'?'Tier 3':'';
    if(tierLabel)tags+=`<span class="supp-card-tag sct-tier">${tierLabel} evidence</span>`;
    // Add category tags from supplement data
    if(sup&&sup.tag){sup.tag.split(' · ').forEach(t=>{const tt=t.trim();if(tt)tags+=`<span class="supp-card-tag sct-cat">${tt}</span>`;});}
    // Description — show full supplement desc
    const desc=sup?sup.desc:'';
    // Why recommended — always show
    const why=r.why||'';

    return`<div class="supp-card${isSelected?' sc-selected':''}" data-supp="${escAttr(r.n)}" onclick="toggleSuppCard(this)"><div class="supp-card-check"></div><div class="supp-card-top"><div class="supp-card-score" style="background:${scoreBg}">${sc}</div><div class="supp-card-name">${escHtml(r.n)}</div></div><div class="supp-card-tags">${tags}${bwBadge}</div>${desc?`<div class="supp-card-desc">${escHtml(desc)}</div>`:''}<div class="supp-card-why"><span class="supp-card-why-label">Why recommended</span>${escHtml(why)}</div></div>`;
  }

  let html='';

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
  const recs=_lastRecs;
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

  document.getElementById('plan-body').innerHTML=html;

  // Email report preview
  const age=document.getElementById('asl').value;
  const sexLabel=sex==='fp'?'pregnant woman':sex==='m'?'man':'woman';
  let prev='<div class="plan-ep-label">Your full personalized report</div>';
  prev+=`<div class="plan-ep-card">`;
  prev+=`<div class="plan-ep-hdr"><h3>Your Supplement Report</h3><p>${age}-year-old ${sexLabel} \u00B7 ${selected.length} supplements \u00B7 ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p></div>`;
  prev+=`<div class="plan-ep-body">`;
  // Show first 3 items as detailed preview
  const previewItems=items.slice(0,3);
  prev+=`<div class="plan-ep-sec-title"><span class="plan-ep-dot" style="background:#0D9488"></span>Essential \u2014 Take daily</div>`;
  previewItems.forEach(item=>{
    const scoreBg=item.score>=80?'#0D9488':item.score>=60?'#4B7BE5':item.score>=40?'#CA8A04':'#B91C1C';
    const timingStr=item.timing?item.timing.time:'';
    prev+=`<div class="plan-ep-row"><div class="plan-ep-badge" style="background:${scoreBg}">${item.score}</div><div class="plan-ep-info"><div class="plan-ep-name">${item.name}</div><div class="plan-ep-dose">${item.dose}${timingStr?' \u00B7 '+timingStr:''}</div><div class="plan-ep-why">${item.why}</div></div></div>`;
  });
  if(items.length>3)prev+=`<div class="plan-ep-more">+ ${items.length-3} more supplements in full report</div>`;
  prev+=`</div></div>`;
  document.getElementById('plan-preview').innerHTML=prev;

  document.getElementById('plan-sub').textContent=selected.length+' supplement'+(selected.length!==1?'s':'')+' \u00B7 Personalized for your profile';
  document.getElementById('plan-overlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function closePlanModal(){
  document.getElementById('plan-overlay').classList.remove('open');
  document.body.style.overflow='';
}

async function sendPlanEmail(){
  const email=document.getElementById('plan-email').value.trim();
  if(!email||!email.includes('@')){document.getElementById('plan-email').focus();return;}
  const btn=document.getElementById('plan-send-btn');btn.disabled=true;btn.textContent='Preparing…';
  // Collect email via Formspree (fire & forget)
  const age=document.getElementById('asl').value;
  const sexLabel=sex==='fp'?'Pregnant woman':sex==='m'?'Male':'Female';
  const recs=_lastRecs;
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
function onSearch(q){q=q.trim();const clr=document.getElementById('gs-clr'),res=document.getElementById('gs-res'),mui=document.getElementById('main-ui');clr.classList.toggle('vis',q.length>0);if(!q){res.classList.remove('vis');mui.style.display='';return;}const ql=q.toLowerCase();const hits=S.filter(s=>[s.n,s.tag,s.desc,s.dose].some(x=>x&&x.toLowerCase().includes(ql)));mui.style.display='none';res.classList.add('vis');const safeQ=escHtml(q);document.getElementById('gs-meta').innerHTML=hits.length?`<b>${hits.length}</b> supplement${hits.length!==1?'s':''} found for "<b>${safeQ}</b>"`:`No results for "<b>${safeQ}</b>"`;document.getElementById('gs-cards').innerHTML=hits.length?'<div class="scards">'+hits.map(s=>renderCard(s,'')).join('')+'</div>':'<div style="text-align:center;padding:2rem;color:var(--color-text-tertiary);font-size:13px">Try a different name, ingredient, or health goal.</div>';}
function clearSearch(){const i=document.getElementById('gs-inp');i.value='';onSearch('');}
let acIdx=-1;
function showAc(q){const ac=document.getElementById('gs-ac');if(!q||q.length<2){ac.classList.remove('vis');acIdx=-1;return;}const ql=q.toLowerCase();const hits=S.filter(s=>s.n.toLowerCase().includes(ql)).slice(0,8);if(!hits.length){ac.classList.remove('vis');acIdx=-1;return;}ac.innerHTML=hits.map((s,i)=>`<div class="gs-ac-item${i===acIdx?' active':''}" onmousedown="pickAc('${escAttr(s.n)}')"><span>${escHtml(s.n)}</span><span class="gs-ac-tag">${escHtml(s.tag.split(' · ')[0])}</span></div>`).join('');ac.classList.add('vis');}
function pickAc(name){const inp=document.getElementById('gs-inp');inp.value=name;document.getElementById('gs-ac').classList.remove('vis');acIdx=-1;onSearch(name);}
function hideAc(){setTimeout(()=>document.getElementById('gs-ac').classList.remove('vis'),150);}
function debounce(fn,ms){let t;return function(...args){clearTimeout(t);t=setTimeout(()=>fn.apply(this,args),ms);};}
const _gsInp=document.getElementById('gs-inp');
if(_gsInp){
  const _debouncedShowAc=debounce(v=>showAc(v),160);
  _gsInp.addEventListener('input',e=>{_debouncedShowAc(e.target.value.trim());});
  _gsInp.addEventListener('blur',hideAc);
  _gsInp.addEventListener('keydown',e=>{const ac=document.getElementById('gs-ac');const items=ac.classList.contains('vis')?ac.querySelectorAll('.gs-ac-item'):[];if(e.key==='ArrowDown'&&items.length){e.preventDefault();acIdx=Math.min(acIdx+1,items.length-1);items.forEach((it,i)=>it.classList.toggle('active',i===acIdx));}else if(e.key==='ArrowUp'&&items.length){e.preventDefault();acIdx=Math.max(acIdx-1,0);items.forEach((it,i)=>it.classList.toggle('active',i===acIdx));}else if(e.key==='Enter'){e.preventDefault();if(acIdx>=0&&items[acIdx]){pickAc(items[acIdx].querySelector('span').textContent);}else{ac.classList.remove('vis');onSearch(e.target.value);}}else if(e.key==='Escape'){ac.classList.remove('vis');acIdx=-1;}});
}else{console.warn('[SupplementScore] search input #gs-inp not found');}
let af='az';
function match(s,q){if(!q)return true;const l=q.toLowerCase();return[s.n,s.tag,s.desc,s.dose].some(x=>x&&x.toLowerCase().includes(l));}
function toggleCard(btn){const inner=btn.closest('.sc-inner');const wrap=inner.querySelector('.sc-expand');const chv=btn.querySelector('.sc-toggle-chv');const isOpen=wrap.classList.toggle('open');chv.classList.toggle('open');btn.querySelector('span:first-child').textContent=isOpen?'Less':'More';const preview=inner.querySelector('.sc-desc-preview');if(preview)preview.style.display=isOpen?'none':'';const chip=inner.querySelector('.art-chip');if(chip)chip.style.display=isOpen?'none':'';}
// Build reverse interaction map: supplement name -> [{med, type}]
const INTERACT_MAP={};Object.entries(MEDS).forEach(([k,m])=>{m.avoid.forEach(n=>{if(!INTERACT_MAP[n])INTERACT_MAP[n]=[];INTERACT_MAP[n].push({med:m.label,type:'avoid'});});m.caution.forEach(n=>{if(!INTERACT_MAP[n])INTERACT_MAP[n]=[];INTERACT_MAP[n].push({med:m.label,type:'caution'});});});
function interactHtml(name){const ints=INTERACT_MAP[name];if(!ints||!ints.length)return'<div class="sc-interact"><div class="sc-interact-title">Medication interactions</div><div class="sc-interact-safe">No known major interactions identified.</div></div>';return'<div class="sc-interact"><div class="sc-interact-title">Medication interactions</div><div class="sc-interact-list">'+ints.map(i=>`<span class="sc-interact-pill${i.type==='avoid'?' danger':''}">${i.type==='avoid'?'Avoid with':'Caution with'}: ${i.med}</span>`).join('')+'</div></div>';}
function barClr(v){return v>=4?'var(--t1c)':v>=3?'var(--t2c)':v>=2?'var(--t3c)':'var(--t4c)';}
function bar(label,v){return`<div class="sc-bar-item"><div class="sc-bar-label">${label}</div><div class="sc-bar-track"><div class="sc-bar-fill" style="width:${v*20}%;background:${barClr(v)}"></div></div></div>`;}
function getColsPerRow(){const w=window.innerWidth;if(w<640)return 1;if(w<960)return 2;return 3;}
function loadMoreTier(btn,tierId){btn.classList.add('loading');btn.disabled=true;const sec=btn.closest('.tier-sec');setTimeout(()=>{const hidden=sec.querySelectorAll('.sc.tier-hidden');let shown=0;hidden.forEach(c=>{if(shown<10){c.classList.replace('tier-hidden','tier-visible');shown++;}});btn.classList.remove('loading');btn.disabled=false;const rem=sec.querySelectorAll('.sc.tier-hidden').length;if(!rem)btn.remove();else btn.querySelector('.tier-more-text').textContent=`Load more (${rem} remaining)`;},600);}
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
function suppCardForArticle(name){const s=_suppByName.get(name);if(!s)return'';const sc=calcScore(s),et=eTier(s),rd=s.r||1,scCls=sc>=72?'score-high':sc>=60?'score-mid':sc>=40?'score-low':'score-bad';const grad=sc>=60?'linear-gradient(180deg,#16A34A,#15803D)':sc>=40?'linear-gradient(180deg,#CA8A04,#A16207)':'linear-gradient(180deg,#DC2626,#B91C1C)';return`<div class="art-supp-card" onclick="event.stopPropagation();openSuppModal('${escAttr(name)}')"><div class="art-supp-score" style="background:${grad}"><div class="art-supp-score-num">${sc}</div><div class="art-supp-score-label">Score</div></div><div class="art-supp-body"><div class="art-supp-name">${escHtml(s.n)}</div><div class="art-supp-meta">Efficacy ${s.e}/5 · Safety ${s.s}/5 · ${escHtml(s.tag.split(' · ').slice(0,2).join(' · '))}</div></div></div>`;}
function articleSuppsHtml(articleId){const names=ARTICLE_SUPPS[articleId];if(!names||!names.length)return'';return`<div class="art-supps-section"><div class="art-supps-title"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>Supplements mentioned in this article</div><div class="art-supps-grid">${names.map(n=>suppCardForArticle(n)).join('')}</div></div>`;}
function articleKeyPointsHtml(body){const firstP=body.querySelector('p');if(!firstP)return'';const text=firstP.textContent.trim();const parts=text.replace(/([.!?])\s+([A-Z\u201c\u2018\u0022])/g,'$1\n$2').split('\n').map(s=>s.trim()).filter(s=>s.length>25);if(!parts.length)return'';const items=parts.slice(0,3).map((s,i)=>`<li class="art-kp-item"><span class="art-kp-num">${i+1}</span><span>${s}</span></li>`).join('');return`<div class="art-kp-card"><div class="art-kp-label">Key Points</div><ul class="art-kp-list">${items}</ul></div>`;}
function articleSuppsTopHtml(id){const names=ARTICLE_SUPPS[id];if(!names||!names.length)return'';const icon=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 3H5a2 2 0 00-2 2v4m4-4h6l6 6v12a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>`;return`<div class="art-supps-top"><div class="art-supps-top-label">${icon}Supplement${names.length>1?'s':''} in this article</div><div class="art-supps-grid">${names.map(n=>suppCardForArticle(n)).join('')}</div></div>`;}
let _allArtsCache=null;
function _buildAllArts(){if(_allArtsCache)return _allArtsCache;const m={};Object.values(ARTICLE_MAP).forEach(arts=>arts.forEach(a=>{m[a.id]=a;}));_allArtsCache=m;return m;}
function getRelatedArticles(articleId,max){max=max||4;const allArts=_buildAllArts();const thisArt=allArts[articleId];const thisSupps=ARTICLE_SUPPS[articleId]||[];const scores={};thisSupps.forEach(name=>{(ARTICLE_MAP[name]||[]).forEach(a=>{if(a.id!==articleId)scores[a.id]=(scores[a.id]||0)+2;});});if(thisArt)Object.values(allArts).forEach(a=>{if(a.id!==articleId&&a.c===thisArt.c)scores[a.id]=(scores[a.id]||0)+1;});return Object.entries(scores).filter(([,s])=>s>0).sort((a,b)=>b[1]-a[1]).slice(0,max).map(([id])=>allArts[parseInt(id)]).filter(Boolean);}
function articleRelatedHtml(articleId){const arts=getRelatedArticles(articleId);if(!arts.length)return'';const svgDoc=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>`;const cards=arts.map(a=>{var clr=ART_CAT_CLR[a.c]||'#7B1FA2';return`<div class="art-mini" role="link" tabindex="0" onclick="goArticle(${a.id},event)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goArticle(${a.id},event);}"><div class="art-mini-ic" style="background:${clr}1a;color:${clr}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div><div class="art-mini-mid"><div class="art-mini-t">${a.t}</div><div class="art-mini-m" style="color:${clr}">${ART_CAT_LBL[a.c]||''}<span class="art-mini-dot">·</span>${a.m} min</div></div><div class="art-mini-arr">›</div></div>`;}).join('');return`<div class="art-related-section"><div class="art-related-label">${svgDoc}Related Articles</div><div class="art-list">${cards}</div></div>`;}
function openSuppModal(name){const s=_suppByName.get(name);if(!s)return;const sc=calcScore(s),rd=s.r||1,so=s.o||1,et=eTier(s);const grad=sc>=80?'linear-gradient(180deg,#16A34A,#15803D)':sc>=60?'linear-gradient(180deg,#CA8A04,#A16207)':sc>=40?'linear-gradient(180deg,#CA8A04,#A16207)':'linear-gradient(180deg,#DC2626,#B91C1C)';const tags=s.tag.split(' · ').map(t=>'<span style="font-size:9px;padding:2px 7px;border-radius:7px;background:'+TM[et].bg+';color:'+TM[et].tx+'">'+t.trim()+'</span>').join('');const modal=document.getElementById('supp-modal');const body=document.getElementById('supp-modal-body');body.innerHTML=`<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><div style="width:56px;height:56px;border-radius:12px;background:${grad};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0"><div style="font-size:22px;font-weight:800;color:#fff">${sc}</div><div style="font-size:6px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.65)">Score</div></div><div><div style="font-size:18px;font-weight:700;color:var(--color-text-primary)">${s.n}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${tags}</div></div></div><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;font-size:11px;color:var(--color-text-tertiary)"><span>Efficacy: <b style="color:${barClr(s.e)}">${s.e}/5</b></span><span>Safety: <b style="color:${barClr(s.s)}">${s.s}/5</b></span><span>Research: <b style="color:${barClr(rd)}">${rd}/5</b></span><span>Onset: <b style="color:var(--color-text-secondary)">${OL_SHORT[so]||'Varies'}</b></span></div><div class="supp-modal-section"><div class="supp-modal-label">Dose</div><div class="supp-modal-val">${s.dose}</div></div>${s.tips?'<div class="supp-modal-section"><div class="supp-modal-label">How to take</div><div class="supp-modal-val">'+s.tips+'</div></div>':''}<div class="supp-modal-section"><div class="supp-modal-label">Cycling &amp; Duration</div><div class="supp-modal-val">${cycleInfo(s)}</div></div><div class="supp-modal-section"><div class="supp-modal-label">Overview</div><div class="supp-modal-val">${s.desc}</div></div>`;modal.classList.add('open');document.body.style.overflow='hidden';modal.scrollTop=0;}
function closeSuppModal(){document.getElementById('supp-modal').classList.remove('open');document.body.style.overflow='';}
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
    });
  }
  return sourcesDiv;
}
let _artReturnScrollY=0,_currentArticleId=null,_artNavList=[];
function _buildArtNavList(){const out=[];document.querySelectorAll('[id^="article-"]').forEach(el=>{const m=el.id.match(/^article-(\d+)$/);if(m)out.push(parseInt(m[1],10));});return out.sort((a,b)=>a-b);}
function goArticle(id,ev){const _ev=ev||(typeof window!=='undefined'?window.event:null);if(_ev&&_ev.stopPropagation)_ev.stopPropagation();const src=document.getElementById('article-'+id);if(!src)return;const modal=document.getElementById('art-modal');const isOpen=modal.classList.contains('open');if(!isOpen){_artReturnScrollY=window.pageYOffset;if(!_artNavList.length)_artNavList=_buildArtNavList();}_currentArticleId=id;const body=document.getElementById('art-modal-body');const artInner=src.querySelector('[style*="padding"]')||src;body.innerHTML=artInner.innerHTML;const backBtn=body.querySelector('button');if(backBtn&&backBtn.textContent.includes('Back'))backBtn.remove();const kpHtml=articleKeyPointsHtml(body);if(kpHtml){const metaEl=body.querySelector('.article-meta');if(metaEl){metaEl.style.marginBottom='0';metaEl.insertAdjacentHTML('afterend',kpHtml);}else{body.insertAdjacentHTML('afterbegin',kpHtml);}const firstP=body.querySelector('p');if(firstP)firstP.classList.add('art-body-first');}const suppsHtml=articleSuppsHtml(id);const sourcesDiv=processArticleSources(body);if(suppsHtml){if(sourcesDiv)sourcesDiv.insertAdjacentHTML('beforebegin',suppsHtml);else body.insertAdjacentHTML('beforeend',suppsHtml);}const relHtml=articleRelatedHtml(id);if(relHtml)body.insertAdjacentHTML('beforeend',relHtml);if(sourcesDiv)body.appendChild(sourcesDiv);_updateArtNav();if(!isOpen){modal.classList.add('open');document.body.style.overflow='hidden';}modal.scrollTop=0;_setArticleHash(id);}
function closeArtModal(){document.getElementById('art-modal').classList.remove('open');document.body.style.overflow='';window.scrollTo({top:_artReturnScrollY,behavior:'instant'});_currentArticleId=null;try{if(location.hash&&/^#article-\d+$/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);}catch(e){}}
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
function artMiniHtml(arts){if(!arts||!arts.length)return'';return'<div class="art-list"><div class="art-list-h">Related article'+(arts.length>1?'s':'')+'</div>'+arts.map(a=>{var clr=ART_CAT_CLR[a.c]||'#7B1FA2';return'<div class="art-mini" role="link" tabindex="0" onclick="goArticle('+a.id+',event)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();goArticle('+a.id+',event);}"><div class="art-mini-ic" style="background:'+clr+'1a;color:'+clr+'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg></div><div class="art-mini-mid"><div class="art-mini-t">'+a.t+'</div><div class="art-mini-m" style="color:'+clr+'">'+ART_CAT_LBL[a.c]+'<span class="art-mini-dot">·</span>'+a.m+' min</div></div><div class="art-mini-arr">›</div></div>';}).join('')+'</div>';}
function renderCard(s,hidden){const rd=s.r||1,so=s.o||1,sco=s.c||1,sd=interactBarScore(s.n),sc=calcScore(s),scCls=sc>=72?'score-high':sc>=60?'score-mid':sc>=40?'score-low':'score-bad';const ints=INTERACT_MAP[s.n];const hasInts=ints&&ints.length;const intPills=hasInts?ints.map(i=>`<span style="font-size:10px;padding:2px 6px;border-radius:8px;background:${i.type==='avoid'?'var(--t4bg)':'var(--t3bg)'};color:${i.type==='avoid'?'var(--t4tx)':'var(--t3tx)'}">${i.type==='avoid'?'Avoid':'Caution'}: ${escHtml(i.med.split(' ')[0])}</span>`).join(''):'';const et=eTier(s);const arts=ARTICLE_MAP[s.n]||null;const _fi=getFoodInfo(s);const _ei=getExcessInfo(s);return`<div class="sc${hidden}" data-tier="${et}" onclick="const b=this.querySelector('.sc-toggle');if(b)toggleCard(b);"><div class="sc-score-side ${scCls}"><div class="sc-score-num">${sc}</div><div class="sc-score-label">Score</div></div><div class="sc-inner"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px"><div style="font-size:15px;font-weight:600;color:var(--color-text-primary)">${escHtml(s.n)}</div><div style="display:flex;gap:4px;flex-shrink:0">${s.tag.split(' · ').slice(0,3).map(t=>'<span style="font-size:10px;padding:2px 6px;border-radius:8px;background:'+TM[et].bg+';color:'+TM[et].tx+'">'+escHtml(t.trim())+'</span>').join('')}</div></div><div style="display:flex;gap:8px;margin:4px 0 6px;font-size:11px;color:var(--color-text-tertiary);flex-wrap:wrap"><span>Efficacy <b style="color:${barClr(s.e)}">${s.e}★</b></span><span>Safety <b style="color:${barClr(s.s)}">${s.s}★</b></span><span>Research <b style="color:${barClr(rd)}">${rd}★</b></span><span>Onset <b style="color:var(--color-text-secondary)">${OL_SHORT[so]||'Varies'}</b></span></div>${hasInts?'<div style="display:flex;gap:5px;flex-wrap:wrap;font-size:11px;margin-bottom:6px">'+intPills+'</div>':''}<div class="sc-desc-preview" style="font-size:12px;color:var(--color-text-secondary);line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${escHtml(s.desc)}</div><div class="sc-expand"><div class="sc-desc sc-desc-top">${escHtml(s.desc)}</div><div class="sc-info-table"><div class="sc-info-row"><div class="sc-info-lbl">Dose</div><div class="sc-info-val">${escHtml(s.dose)}</div></div>${s.tips?`<div class="sc-info-row"><div class="sc-info-lbl">How to take</div><div class="sc-info-val">${escHtml(s.tips)}</div></div>`:''}<div class="sc-info-row sc-info-tinted"><div class="sc-info-lbl">Food</div><div class="sc-info-val"><span style="color:var(--t1c);font-weight:600;font-size:10px">PAIR:</span> ${escHtml(_fi.pair)}<br><span style="color:var(--t4c);font-weight:600;font-size:10px">AVOID:</span> ${escHtml(_fi.avoid)}</div></div><div class="sc-info-row"><div class="sc-info-lbl">Cycling</div><div class="sc-info-val">${escHtml(cycleInfo(s))}</div></div><div class="sc-info-row"><div class="sc-info-lbl">Onset</div><div class="sc-info-val"><span class="sc-info-badge">${OL_SHORT[so]||'Varies'}</span>${so>=5?'Effects felt almost immediately after taking. Ideal for acute, time-sensitive use.':so>=4?'Noticeable effects within hours to a few days. Works relatively quickly compared to most supplements.':so>=3?'Typically takes 1 to 4 weeks of consistent daily use before benefits become noticeable. Be patient and stay consistent.':so>=2?'Requires 4 to 8 weeks of regular use to build up in your system. Do not expect immediate results.':'Very slow acting. May take 8 weeks or longer before any measurable benefit. Long-term commitment required.'}</div></div></div><div class="sc-dose-warn-h"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t4c)" stroke-width="2.2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>If you exceed the dose</div><div class="sc-dose-steps"><div class="sc-ds-row sc-ds-risk"><div class="sc-ds-num">1</div><div class="sc-ds-body"><div class="sc-ds-k">Risks</div><div class="sc-ds-v">${escHtml(_ei.risk)}</div></div></div><div class="sc-ds-row sc-ds-upper"><div class="sc-ds-num">2</div><div class="sc-ds-body"><div class="sc-ds-k">Upper limit</div><div class="sc-ds-v">${escHtml(_ei.threshold)}</div></div></div><div class="sc-ds-row sc-ds-long"><div class="sc-ds-num">3</div><div class="sc-ds-body"><div class="sc-ds-k">Long-term</div><div class="sc-ds-v">${escHtml(_ei.long)}</div></div></div></div>${hasInts?`<div class="sc-mi-h"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14l-7 7-7-7M5 10l7-7 7 7"/></svg>Medication interactions</div><div class="sc-mi-wrap${ints.length>1?' sc-mi-rail':''}">${ints.map((i,idx)=>{const m=Object.entries(MEDS).find(([k,v])=>v.label===i.med);const note=m?m[1].note:'';const sev=i.type==='avoid'?'avoid':'caution';const sevLbl=i.type==='avoid'?'Avoid':'Caution';return`<div class="sc-mi-row sc-mi-${sev}"><div class="sc-mi-num">${idx+1}</div><div class="sc-mi-body"><div class="sc-mi-k">${sevLbl} <span class="sc-mi-dot">·</span> <span class="sc-mi-med">${escHtml(i.med)}</span></div><div class="sc-mi-v">${escHtml(note)}</div></div></div>`;}).join('')}</div>`:''}${artMiniHtml(arts)}</div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><button type="button" class="sc-toggle" onclick="event.stopPropagation();toggleCard(this)" style="padding:6px 0 2px;flex:none"><span>More</span><svg class="sc-toggle-chv" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>${artChipHtml(arts)}</div></div></div>`;}
function renderAll(){const q=(document.getElementById('gs-inp')||{}).value||'';const initShow=10;
if(af==='unproven'){let items=S.filter(s=>eTier(s)==='t3'&&match(s,q)).sort((a,b)=>calcScore(b)-calcScore(a));const hasMore=items.length>10&&!q;const m=TIER_META.unproven||{};const banner=items.length?_filterBanner('Unproven \u00b7 '+items.length+' supplement'+(items.length>1?'s':''),m.lead||'Evidence still unclear',m.desc||'',m.icon||'<circle cx="12" cy="12" r="10"/>','unproven'):'';document.getElementById('s-content').innerHTML=items.length?`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=initShow?' tier-hidden':'')).join('')}</div>${hasMore?`<button type="button" class="tier-more" onclick="loadMoreTier(this,'unproven')"><span class="tier-more-spin"></span><span class="tier-more-text">Load more (${items.length-initShow} remaining)</span></button>`:''}</div>`:'<div class="empty">No supplements found.</div>';return;}
if(af==='az'){let items=S.filter(s=>match(s,q)).sort((a,b)=>a.n.localeCompare(b.n));const groups={};items.forEach(s=>{const letter=s.n.charAt(0).toUpperCase().replace(/[^A-Z]/,'#');if(!groups[letter])groups[letter]=[];groups[letter].push(s);});let html='';Object.keys(groups).sort((a,b)=>a==='#'?-1:b==='#'?1:a.localeCompare(b)).forEach(letter=>{const grp=groups[letter];html+=`<div class="az-letter-heading">${letter} <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">${grp.length}</span></div><div class="tier-sec"><div class="scards">${grp.map(s=>renderCard(s,'')).join('')}</div></div>`;});document.getElementById('s-content').innerHTML=html;return;}
const tiers=af==='all'?TIERS:TIERS.filter(t=>t.id===af);const singleTier=af!=='all';let html='';tiers.forEach(t=>{const items=S.filter(s=>t.id==='t3'?(s.tr&&match(s,q)):(eTier(s)===t.id&&match(s,q))).sort((a,b)=>calcScore(b)-calcScore(a));if(!items.length)return;const hasMore=items.length>10&&!q;let banner='';if(singleTier){const m=TIER_META[t.id]||{};banner=_filterBanner(escHtml(t.label)+' \u00b7 '+items.length+' supplement'+(items.length>1?'s':''),m.lead||t.badge||'Tier',m.desc||t.desc||'',m.icon||'<circle cx="12" cy="12" r="10"/>',t.id);}html+=`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=initShow?' tier-hidden':'')).join('')}</div>${hasMore?`<button type="button" class="tier-more" onclick="loadMoreTier(this,'${t.id}')"><span class="tier-more-spin"></span><span class="tier-more-text">Load more (${items.length-initShow} remaining)</span></button>`:''}</div>`;});document.getElementById('s-content').innerHTML=html||'<div class="empty">No supplements match your search.</div>';}
function setCatFilter(cat){if(!cat){af='az';renderAll();document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');document.querySelectorAll('.sfbtn')[0].className='sfbtn on-az';return;}_ddLabel('tier-filter','Tier\u2026');_ddLabel('az-filter','A\u2013Z');_ddLabel('pop-filter','For');document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');af='cat';const q=(document.getElementById('srch')||{}).value||'';const cols=getColsPerRow();const rowLimit=cols*2;let items=S.filter(s=>s.tag.toLowerCase().includes(cat.toLowerCase())&&match(s,q));items.sort((a,b)=>calcScore(b)-calcScore(a));const hasMore=items.length>10&&!q;const m=CAT_META[cat]||{};const banner=items.length?_filterBanner(escHtml(cat)+' \u00b7 '+items.length+' supplement'+(items.length>1?'s':''),m.lead||'Category overview',m.desc||'Supplements grouped by their primary benefit area.',m.icon||'<circle cx="12" cy="12" r="10"/>'):'';let html=`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=rowLimit?' tier-hidden':'')).join('')}</div>${hasMore?`<button type="button" class="tier-more" onclick="loadMoreTier(this,'cat')"><span class="tier-more-spin"></span><span class="tier-more-text">Load more (${items.length-rowLimit} remaining)</span></button>`:''}</div>`;document.getElementById('s-content').innerHTML=items.length?html:'<div class="empty">No supplements found for this category.</div>';document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.getBoundingClientRect().bottom+12:128;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
var _initialLoad=true;
function setFilter(id,el){_ddLabel('cat-filter','Category');_ddLabel('az-filter','A\u2013Z');_ddLabel('tier-filter','Tier\u2026');_ddLabel('pop-filter','For');_ddActive(null);af=id;document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');if(el)el.className=`sfbtn on-${id}`;renderAll();if(_initialLoad){_initialLoad=false;return;}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
function setAzFilter(val){if(!val)return;document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');_ddLabel('cat-filter','Category');_ddLabel('tier-filter','Tier\u2026');_ddLabel('pop-filter','For');if(val==='all'){af='az';renderAll();}else{af='azpair';const letters=val.split('');const q=(document.getElementById('srch')||{}).value||'';let items=S.filter(s=>{const c=s.n.charAt(0).toUpperCase();return(c===letters[0]||c===letters[1])&&match(s,q);}).sort((a,b)=>a.n.localeCompare(b.n));const groups={};items.forEach(s=>{const l=s.n.charAt(0).toUpperCase();if(!groups[l])groups[l]=[];groups[l].push(s);});let html='';Object.keys(groups).sort().forEach(letter=>{const grp=groups[letter];html+=`<div class="az-letter-heading">${letter} <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">${grp.length}</span></div><div class="tier-sec"><div class="scards">${grp.map(s=>renderCard(s,'')).join('')}</div></div>`;});document.getElementById('s-content').innerHTML=html||'<div class="empty">No supplements found.</div>';}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
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
function toggleDD(id){const m=document.getElementById(id+'-menu');const open=m.classList.toggle('open');if(open){document.querySelectorAll('.cdd-menu.open').forEach(x=>{if(x.id!==id+'-menu')x.classList.remove('open');});}document.getElementById(id+'-wrap').classList.toggle('cdd-open',open);}
function closeDD(id){document.getElementById(id+'-menu').classList.remove('open');document.getElementById(id+'-wrap').classList.remove('cdd-open');}
function _ddLabel(id,txt){const btn=document.querySelector('#'+id+'-wrap .cdd-btn');if(btn)btn.firstChild.textContent=txt+' ';}
function _ddActive(id){document.querySelectorAll('.cdd-btn').forEach(b=>b.classList.remove('on'));if(!id)return;const btn=document.querySelector('#'+id+'-wrap .cdd-btn');if(btn)btn.classList.add('on');}
document.addEventListener('click',function(e){if(!e.target.closest('.cdd'))document.querySelectorAll('.cdd-menu.open').forEach(m=>{m.classList.remove('open');m.parentElement.classList.remove('cdd-open');});});
function initAllTab(){if(_allTabInit)return;_allTabInit=true;const tierCounts=TIERS.map(t=>({...t,count:t.id==='t3'?S.filter(s=>s.tr).length:S.filter(s=>eTier(s)===t.id).length}));const azOpts=[{val:'all',label:'All A\u2013Z ('+S.length+')'}].concat(AZ_PAIRS.map(p=>{const count=S.filter(s=>{const c=s.n.charAt(0).toUpperCase();return c===p[0]||c===p[1];}).length;return{val:p[0]+p[1],label:p[0]+' & '+p[1]+' ('+count+')'};}));const catOpts=CATS.map(c=>({val:c,label:c}));const popOpts=Object.entries(POPULATIONS).map(([k,p])=>({val:k,label:'<span class="pop-lbl">'+p.label+'</span><span class="pop-ct">'+p.supps.length+' supplement'+(p.supps.length>1?'s':'')+'</span>'}));const unpCount=S.filter(s=>eTier(s)==='t3').length;const tr=tierCounts.find(x=>x.id==='t3');const tierOpts=[{val:'t3',label:'Trending ('+tr.count+')'}];['t1','t2','t4'].forEach(id=>{const t=tierCounts.find(x=>x.id===id);tierOpts.push({val:t.id,label:t.badge+' ('+t.count+')'});});tierOpts.splice(3,0,{val:'unproven',label:'Unproven ('+unpCount+')'});document.getElementById('sfbar-main').innerHTML=_dd('tier-filter','Tier\u2026',tierOpts,'_tierPick')+_dd('cat-filter','Category',catOpts,'_catPick')+_dd('pop-filter','For',popOpts,'_popPick')+_dd('az-filter','A\u2013Z',azOpts,'_azPick');_tierPick('t3');}
function _tierPick(v){_ddLabel('tier-filter',v==='unproven'?'Unproven':(TIERS.find(x=>x.id===v)||{}).badge||'Tier');document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');_ddLabel('cat-filter','Category');_ddLabel('az-filter','A\u2013Z');_ddLabel('pop-filter','For');_ddActive('tier-filter');af=v;renderAll();if(_initialLoad){_initialLoad=false;return;}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
function _azPick(v){_ddLabel('az-filter',v==='all'?'All A\u2013Z':v.charAt(0)+' & '+v.charAt(1));_ddActive(v==='all'?null:'az-filter');setAzFilter(v);}
function _catPick(v){_ddLabel('cat-filter',v);_ddActive('cat-filter');setCatFilter(v);}
function _popPick(v){const p=POPULATIONS[v];if(!p)return;_ddLabel('pop-filter',p.label);_ddActive('pop-filter');setPopFilter(v);}
function setPopFilter(key){const p=POPULATIONS[key];if(!p)return;_ddLabel('cat-filter','Category');_ddLabel('tier-filter','Tier\u2026');_ddLabel('az-filter','A\u2013Z');document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');af='pop';const q=(document.getElementById('srch')||{}).value||'';const cols=getColsPerRow();const rowLimit=cols*2;const wanted=new Set(p.supps);let items=S.filter(s=>wanted.has(s.n)&&match(s,q));items.sort((a,b)=>calcScore(b)-calcScore(a));const hasMore=items.length>10&&!q;const m=POP_META[key]||{};const banner=_filterBanner('Recommended for <b>'+escHtml(p.label)+'</b> \u00b7 '+items.length+' supplement'+(items.length>1?'s':''),m.lead||'Targeted supplement recommendations',m.desc||'Supplements selected for this group based on clinical relevance and safety. Always consult a clinician for personalised guidance.',m.icon||'<circle cx="12" cy="12" r="10"/>');const html=items.length?`<div class="tier-sec">${banner}<div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=rowLimit?' tier-hidden':'')).join('')}</div>${hasMore?`<button type="button" class="tier-more" onclick="loadMoreTier(this,'pop')"><span class="tier-more-spin"></span><span class="tier-more-text">Load more (${items.length-rowLimit} remaining)</span></button>`:''}</div>`:'<div class="empty">No supplements found for this group.</div>';document.getElementById('s-content').innerHTML=html;const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.getBoundingClientRect().bottom+12:128;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
function sw(n){const p1=document.getElementById('p1'),p2=document.getElementById('p2');if(p1)p1.style.display=n===1?'block':'none';if(p2)p2.style.display=n===2?'block':'none';const tb1=document.getElementById('tb1'),tb2=document.getElementById('tb2');if(tb1){tb1.classList.toggle('active',n===1);tb1.setAttribute('aria-pressed',n===1);}if(tb2){tb2.classList.toggle('active',n===2);tb2.setAttribute('aria-pressed',n===2);}if(n===2&&typeof initAllTab==='function')initAllTab();}
let selectedConds=new Set();
function renderCondChips(){const el=document.getElementById('cond-chips');el.innerHTML=Object.entries(CONDITIONS).map(([k,c])=>`<div class="med-chip cond-chip ${selectedConds.has(k)?'on':''}" onclick="toggleCond('${escAttr(k)}')">${escHtml(c.label)}</div>`).join('');}
function toggleCond(k){selectedConds.has(k)?selectedConds.delete(k):selectedConds.add(k);renderCondChips();updatePfCounts();}
function getCondSupps(){const s=new Set();selectedConds.forEach(k=>{const c=CONDITIONS[k];if(c)c.supps.forEach(n=>s.add(n));});return s;}

/* ── Goals ── */
const GOALS={
  muscle:{label:'Build muscle',supps:['Creatine monohydrate','Whey protein','EAAs (Essential amino acids)','HMB (β-Hydroxy-β-methylbutyrate)','Citrulline malate','Beta-Alanine']},
  weight_loss:{label:'Lose weight',supps:['Glucomannan (konjac root)','Berberine','Psyllium husk (Plantago ovata)','Green tea extract (EGCG)']},
  cognition:{label:'Improve cognition',supps:['Creatine monohydrate','Citicoline (CDP-Choline)','Bacopa monnieri','Alpha-GPC','Phosphatidylserine',"Lion's mane mushroom"]},
  energy:{label:'Boost energy',supps:['Creatine monohydrate','Rhodiola rosea','CoQ10 (Ubiquinol)','Acetyl-L-Carnitine (ALCAR)']},
  sleep:{label:'Better sleep',supps:['Magnesium','L-Theanine','Glycine','Melatonin','Tart cherry (Montmorency)','Ashwagandha (KSM-66)']},
  stress:{label:'Reduce stress',supps:['Ashwagandha (KSM-66)','L-Theanine','Rhodiola rosea','Saffron (Crocus sativus)','Magnesium']},
  immunity:{label:'Strengthen immunity',supps:['Vitamin D3','Zinc','Vitamin C (moderate dose)','Elderberry (Sambucus nigra)','Probiotics']},
  skin:{label:'Improve skin',supps:['Collagen peptides','Omega-3 (EPA/DHA)','Astaxanthin','Vitamin C (moderate dose)']},
  longevity:{label:'Longevity / Anti-aging',supps:['Creatine monohydrate','Omega-3 (EPA/DHA)','Vitamin D3','Magnesium','CoQ10 (Ubiquinol)','NMN / NAD+ precursors']},
  gut:{label:'Gut health',supps:['Probiotics','Psyllium husk (Plantago ovata)','Fibre (general dietary)','Saccharomyces boulardii']},
  joints:{label:'Joint support',supps:['Boswellia serrata','Collagen peptides','Curcumin (bioavailable form)','Omega-3 (EPA/DHA)']},
  hair:{label:'Hair & nails',supps:['Collagen peptides','Biotin (low-dose, deficiency)','Iron','Zinc']},
  heart:{label:'Heart health',supps:['Omega-3 (EPA/DHA)','Vitamin K2 (MK-7)','CoQ10 (Ubiquinol)','Magnesium','Berberine']}
};
let selectedGoals=new Set();
function renderGoalChips(){const el=document.getElementById('goal-chips');if(!el)return;el.innerHTML=Object.entries(GOALS).map(([k,g])=>`<div class="med-chip ${selectedGoals.has(k)?'on':''}" onclick="toggleGoal('${escAttr(k)}')">${escHtml(g.label)}</div>`).join('');}
function toggleGoal(k){selectedGoals.has(k)?selectedGoals.delete(k):selectedGoals.add(k);renderGoalChips();updatePfCounts();}
function getGoalSupps(){const s=new Set();selectedGoals.forEach(k=>{const g=GOALS[k];if(g)g.supps.forEach(n=>s.add(n));});return s;}

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
function generatePDF(){
  if(!window.jspdf)return null;
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const pw=doc.internal.pageSize.getWidth();
  const ph=doc.internal.pageSize.getHeight();
  const M=18;const TW=pw-M*2;
  // Magazine palette
  const DARK=[26,26,26];const GOLD=[201,150,58];const PUR=[61,26,91];
  const CREAM=[250,248,244];const WARM=[240,235,227];const RULE=[212,201,187];
  const ALT=[245,240,234];const TBRD=[232,224,216];const GRY=[153,153,153];
  let pageNum=1;
  // Data
  const recs=_lastRecs;
  const selRecs=recs.filter(r=>selectedSupps.has(r.n));
  const age=document.getElementById('asl').value;
  const sexLabel=sex==='fp'?'Pregnant woman':sex==='m'?'Male':'Female';
  const monthYear=new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const condLabel=selectedConds.size?[...selectedConds].map(k=>CONDITIONS[k]?.label||k).join(', '):'General Wellbeing';
  const medsLabel=selectedMeds.size?[...selectedMeds].map(k=>MEDS[k]?.label||k).join(', '):'None';
  const allItems=selRecs.map(r=>{
    const sup=_suppByName.get(r.n);const sc=sup?calcScore(sup):0;
    const timing=getTimingLabel(r);const ints=INTERACT_MAP[r.n]||[];const hasMedInt=ints.length>0;
    const tips=sup?.tips||'';
    const foodHint=tips.toLowerCase().includes('fat')?'With fat':tips.toLowerCase().includes('empty stomach')?'Empty stomach':(tips.toLowerCase().includes('with food')||tips.toLowerCase().includes('with meal'))?'With food':'Any';
    const effi=sup?.e||1;const safe=sup?.s||1;const rd=sup?.r||1;const so=sup?.o||1;
    const onsetLabel=so>=5?'Immediate':so>=4?'Hours\u2013days':so>=3?'1\u20134 wks':so>=2?'4\u20138 wks':'8+ wks';
    const tierLabel=sup?.t==='t1'?'Tier 1 \u2014 Highest Evidence':sup?.t==='t2'?'Tier 2 \u2014 Good Evidence':'Tier 3 \u2014 Emerging Evidence';
    const cycleInfo=(function(s){if(!s)return'Continuous';const n=s.n.toLowerCase(),tag=(s.tag||'').toLowerCase();if(n.includes('ashwagandha'))return'8\u201312 wks on, 2\u20134 off';if(n.includes('rhodiola'))return'6\u20138 wks on, 2\u20134 off';if(n.includes('melatonin'))return'2\u20134 wks, reassess';if(tag.includes('adaptogen')||n.includes('ginseng'))return'6\u20138 wks on, 2\u20134 off';return'Continuous';})(sup);
    const priLabel=r.p==='essential'?'Essential':r.p==='recommended'?'Recommended':'Consider';
    const desc=sup?.desc||r.why||'';const dose=r.dose||'';
    const intText=ints.map(i=>(i.type==='avoid'?'Avoid':'Caution')+' with '+(i.med||'')).join('; ');
    return{r,sup,sc,timing,hasMedInt,ints,intText,foodHint,effi,safe,rd,so,onsetLabel,tierLabel,cycleInfo,priLabel,desc,dose,tips};
  });
  // Helpers
  function sCol(sc){return sc>=80?PUR:sc>=60?[90,40,130]:sc>=40?[130,70,180]:[170,110,210];}
  function drawCircle(cx,cy,r,sc){
    const c=sCol(sc);doc.setFillColor(c[0],c[1],c[2]);doc.circle(cx,cy,r,'F');
    doc.setFont('times','normal');doc.setFontSize(r*2.9);doc.setTextColor(250,248,244);
    doc.text(String(sc),cx,cy+r*0.4,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.text('SCORE',cx,cy+r*0.88,{align:'center'});
  }
  function drawPips(x,y,n,total,pW=8,gap=1.5){
    const pH=2.5;
    for(let i=0;i<total;i++){
      i<n?doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]):doc.setFillColor(TBRD[0],TBRD[1],TBRD[2]);
      doc.roundedRect(x+i*(pW+gap),y,pW,pH,1,1,'F');
    }
  }
  function footer(){
    doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,ph-12,pw-M,ph-12);
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
    doc.text('SUPPLEMENTSCORE.ORG',M,ph-7);
    doc.setFont('times','italic');doc.setFontSize(7.5);doc.text('Page '+pageNum+' / '+totalPages,pw/2,ph-7,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.text(monthYear.toUpperCase(),pw-M,ph-7,{align:'right'});
  }
  const totalPages=allItems.length+3;
  const essN=allItems.filter(x=>x.r.p==='essential').length;
  const recN=allItems.filter(x=>x.r.p==='recommended').length;
  const conN=allItems.filter(x=>x.r.p==='consider').length;
  const intItems=allItems.filter(x=>x.hasMedInt);
  // ═══════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════
  // Masthead
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,0,pw,15,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('SUPPLEMENTSCORE  \u00B7  YOUR SUPPLEMENT PLAN',M,9);
  doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(200,195,190);
  doc.text('PERSONALISED  \u00B7  EVIDENCE-BASED  \u00B7  '+monthYear.toUpperCase(),pw-M,9,{align:'right'});
  // Hero — extends to y=131 so meta values (at y=117) sit on dark background before gold band
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,15,pw,116,'F');
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('PERSONALISED SUPPLEMENT REPORT',M,30);
  doc.setFont('times','normal');doc.setFontSize(46);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  doc.text('Your',M,52);doc.text('Optimal',M,68);doc.text('Protocol',M,84);
  doc.setFont('times','italic');doc.setFontSize(14);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  const goalStr=condLabel.length>40?condLabel.substring(0,39)+'\u2026':condLabel;
  doc.text('A curated plan for '+goalStr.toLowerCase(),M,97);
  doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);doc.setLineWidth(1);doc.line(M,103,M+20,103);doc.setLineWidth(0.2);
  // Meta items
  const mItms=[['PREPARED FOR',sexLabel+', '+age+' yrs'],['PRIMARY GOAL',condLabel.length>22?condLabel.substring(0,21)+'\u2026':condLabel],['MEDICATION',medsLabel.length>22?medsLabel.substring(0,21)+'\u2026':medsLabel],['SUPPLEMENTS',allItems.length+' in plan']];
  mItms.forEach(([lbl,val],i)=>{
    const mx=M+i*(TW/4);
    doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);doc.text(lbl,mx,110);
    doc.setFont('times','italic');doc.setFontSize(10);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);doc.text(val,mx,117);
  });
  // Gold band — starts after hero area (y=131), meta values safely on dark bg above
  doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(0,131,pw,14,'F');
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.text(allItems.length+' SUPPLEMENTS  \u00B7  EVIDENCE-RANKED  \u00B7  INTERACTION-CHECKED',M,140);
  doc.setFont('times','italic');doc.setFontSize(8);doc.text('SupplementScore.org',pw-M,140,{align:'right'});
  // Intro
  let cy=153;
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('EDITORIAL NOTE',M,cy);cy+=8;
  doc.setFont('times','normal');doc.setFontSize(10);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  const introTxt='This report presents your personalised supplement protocol, ranked by scientific evidence and tailored to your '+goalStr.toLowerCase()+' goals. Each recommendation has been cross-referenced against your medications to flag any clinically relevant interactions.';
  doc.splitTextToSize(introTxt,TW).forEach(l=>{doc.text(l,M,cy);cy+=5.2;});cy+=4;
  // Pull quote
  const qTxt='\u201CThe ideal protocol is not the most complex one \u2014 it is the one built on the clearest evidence and aligned most precisely with who you are.\u201D';
  const qLines=doc.setFont('times','italic').setFontSize(11).splitTextToSize(qTxt,TW-8);
  const qH=qLines.length*5.5;
  doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);doc.setLineWidth(1.2);doc.line(M,cy,M,cy+qH+2);doc.setLineWidth(0.2);
  doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  qLines.forEach(l=>{doc.text(l,M+6,cy+4.5);cy+=5.5;});cy+=5;
  // Second para
  doc.setFont('times','normal');doc.setFontSize(10);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.splitTextToSize('Your supplements have been scored across three dimensions: clinical efficacy, safety profile, and depth of research. Scores above 80 represent strong evidence. Recommendations are tiered as Essential, Recommended, or Consider.',TW).forEach(l=>{doc.text(l,M,cy);cy+=5.2;});cy+=3;
  // Contents box
  const boxY=Math.min(Math.max(cy,240),ph-53);const boxH=38;
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(M,boxY,TW,boxH,'F');
  const ccW=TW/3;
  doc.setFont('helvetica','bold');doc.setFontSize(6);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('IN THIS REPORT',M+4,boxY+8);
  doc.setFont('times','italic');doc.setFontSize(8.5);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  doc.text('P.2  Summary Overview',M+4,boxY+16);
  if(allItems[0])doc.text('P.3  '+allItems[0].r.n.substring(0,22),M+4,boxY+23);
  if(allItems[1])doc.text('P.4  '+allItems[1].r.n.substring(0,22),M+4,boxY+30);
  doc.setDrawColor(51,51,51);doc.setLineWidth(0.3);
  doc.line(M+ccW,boxY+4,M+ccW,boxY+boxH-4);doc.line(M+ccW*2,boxY+4,M+ccW*2,boxY+boxH-4);
  doc.setFont('times','italic');doc.setFontSize(8.5);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  if(allItems[2])doc.text('P.5  '+allItems[2].r.n.substring(0,22),M+ccW+4,boxY+16);
  if(allItems[3])doc.text('P.6  '+allItems[3].r.n.substring(0,22),M+ccW+4,boxY+23);
  if(allItems[4])doc.text('P.7  '+allItems[4].r.n.substring(0,22),M+ccW+4,boxY+30);
  doc.setFont('helvetica','bold');doc.setFontSize(6);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('KEY NOTES',M+ccW*2+4,boxY+8);
  doc.setFont('times','italic');doc.setFontSize(8.5);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  if(intItems.length===0){doc.text('No interactions noted',M+ccW*2+4,boxY+16);}
  else{intItems.slice(0,2).forEach((it,i)=>doc.text(it.r.n.substring(0,20)+' \u2014 interact.',M+ccW*2+4,boxY+16+i*7));}
  doc.text('All doses: daily maintenance',M+ccW*2+4,boxY+30);
  footer();
  // ═══════════════════════════════════════
  // PAGE 2 — SUMMARY TABLE
  // ═══════════════════════════════════════
  doc.addPage();pageNum++;
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,0,pw,20,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('SECTION 01  \u00B7  SUMMARY OVERVIEW',M,12);
  doc.setFont('times','italic');doc.setFontSize(9);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  doc.text('Your complete supplement plan at a glance',pw-M,12,{align:'right'});
  let y=32;
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('SUPPLEMENT SUMMARY',M,y);y+=7;
  doc.setFont('times','normal');doc.setFontSize(22);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.text(allItems.length+' Supplements,',M,y);y+=8;
  doc.setFont('times','italic');doc.setFontSize(22);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('One Coherent Protocol',M,y);y+=8;
  doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,y,pw-M,y);y+=7;
  doc.setFont('times','italic');doc.setFontSize(10);doc.setTextColor(80,80,80);
  doc.splitTextToSize('The following table presents your complete supplement plan ranked by score. Each score reflects a composite of clinical efficacy, safety data, and research volume, weighted for your specific health profile and medication context.',TW).forEach(l=>{doc.text(l,M,y);y+=5;});y+=7;
  // Table header
  const tc=[M,M+52,M+82,M+100,M+126,M+148,M+162];
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(M,y-4,TW,10,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  ['SUPPLEMENT','PRIORITY','SCORE','DAILY DOSE','TIMING','FOOD','INT'].forEach((h,i)=>{doc.text(h,i===2?tc[2]+9:tc[i]+2,y+2,i===2?{align:'center'}:{});});
  y+=8;
  // Table rows
  allItems.forEach((item,idx)=>{
    const rH=13;
    if(idx%2===1){doc.setFillColor(ALT[0],ALT[1],ALT[2]);doc.rect(M,y-3,TW,rH,'F');}
    const sd=item.dose.split(';')[0].split('(')[0].trim();
    doc.setFont('times','normal');doc.setFontSize(9.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text(item.r.n.length>28?item.r.n.substring(0,27)+'\u2026':item.r.n,tc[0]+2,y+2);
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
    doc.text(sd.length>28?sd.substring(0,27)+'\u2026':sd,tc[0]+2,y+7);
    const pc=item.r.p==='essential'?GOLD:item.r.p==='recommended'?PUR:GRY;
    doc.setFont('helvetica','bold');doc.setFontSize(6);doc.setTextColor(pc[0],pc[1],pc[2]);
    doc.setDrawColor(pc[0],pc[1],pc[2]);doc.setLineWidth(0.4);
    const pl=item.priLabel.toUpperCase();const pW2=Math.min(doc.getTextWidth(pl)+5,26);
    doc.rect(tc[1]+2,y-1,pW2,6,'S');doc.text(pl,tc[1]+4.5,y+3.8);
    const sc2=sCol(item.sc);
    doc.setFillColor(sc2[0],sc2[1],sc2[2]);doc.circle(tc[2]+9,y+3,5.5,'F');
    doc.setFont('times','normal');doc.setFontSize(8);doc.setTextColor(250,248,244);
    doc.text(String(item.sc),tc[2]+9,y+5.6,{align:'center'});
    doc.setFont('times','normal');doc.setFontSize(8.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text(sd.length>16?sd.substring(0,15)+'\u2026':sd,tc[3]+2,y+3);
    doc.text(item.timing.time||'Any',tc[4]+2,y+3);
    doc.setFontSize(8);doc.text(item.foodHint,tc[5]+2,y+3);
    if(item.hasMedInt){
      doc.setFillColor(254,226,226);doc.roundedRect(tc[6]+2,y-1,8,6,1.5,1.5,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(185,28,28);
      doc.text('!',tc[6]+6,y+3.8,{align:'center'});
    } else {
      doc.setFont('times','normal');doc.setFontSize(9);doc.setTextColor(13,148,136);doc.text('\u2713',tc[6]+6,y+4);
    }
    doc.setDrawColor(TBRD[0],TBRD[1],TBRD[2]);doc.setLineWidth(0.2);doc.line(M,y+rH-3,pw-M,y+rH-3);
    y+=rH;
  });
  y+=10;
  // Overall plan strength bar
  const avg=Math.round(allItems.reduce((s,x)=>s+x.sc,0)/Math.max(allItems.length,1));
  const strength=avg>=85?'Exceptional':avg>=75?'Excellent':avg>=65?'Good':'Fair';
  doc.setFillColor(PUR[0],PUR[1],PUR[2]);doc.rect(M,y,TW,20,'F');
  doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('OVERALL PLAN STRENGTH',M+5,y+6);
  doc.setFont('times','italic');doc.setFontSize(16);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  doc.text(strength,M+5,y+16);
  doc.setFont('times','normal');doc.setFontSize(8);doc.setTextColor(200,190,210);
  doc.text(essN+' Essential  \u00B7  '+recN+' Recommended  \u00B7  '+conN+' Consider',pw-M-5,y+16,{align:'right'});
  // ── Scoring methodology section ─────────────────────────────────────────────
  let ky=y+28;
  doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,ky,pw-M,ky);ky+=9;
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('HOW YOUR SUPPLEMENTS ARE SCORED',M,ky);ky+=7;
  doc.setFont('times','italic');doc.setFontSize(9.5);doc.setTextColor(80,80,80);
  doc.splitTextToSize('Each supplement receives a composite score from 0\u2013100 weighted across clinical efficacy, safety profile, and research depth. Scores reflect the current published evidence and are adjusted for your specific health profile.',TW).forEach(l=>{doc.text(l,M,ky);ky+=5;});ky+=8;
  const guide=[
    {range:'80\u2013100',label:'Exceptional Evidence',col:PUR,desc:'Multiple large RCTs, consistent meta-analyses, and validated mechanisms of action'},
    {range:'60\u201379',label:'Good Evidence',col:[90,40,130],desc:'Several controlled trials and positive systematic reviews with reliable safety data'},
    {range:'40\u201359',label:'Moderate Evidence',col:[130,70,180],desc:'Small trials, observational studies, and promising mechanistic or in-vivo research'},
    {range:'0\u201339',label:'Limited / Emerging',col:[170,110,210],desc:'Anecdotal reports, in-vitro studies, or theoretical mechanisms requiring more research'},
  ];
  guide.forEach(g=>{
    doc.setFillColor(g.col[0],g.col[1],g.col[2]);doc.roundedRect(M,ky,22,8,2,2,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
    doc.text(g.range,M+11,ky+5.5,{align:'center'});
    doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text(g.label,M+27,ky+5.5);
    doc.setFont('times','normal');doc.setFontSize(8);doc.setTextColor(80,80,80);
    doc.splitTextToSize(g.desc,TW-29).forEach((l,li)=>{doc.text(l,M+27,ky+11+li*4.2);});ky+=17;
  });
  ky+=4;
  doc.setFont('times','italic');doc.setFontSize(8);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
  doc.splitTextToSize('Scores are generated at report time and reflect published research available to that date. Consult your healthcare provider before starting any protocol.',TW).forEach(l=>{doc.text(l,M,ky);ky+=4.5;});
  footer();
  // ═══════════════════════════════════════
  // DETAIL PAGES
  // ═══════════════════════════════════════
  allItems.forEach((item,idx)=>{
    doc.addPage();pageNum++;
    const r=item.r;
    doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(0,0,pw,4,'F');
    doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,4,pw,44,'F');
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.text('SECTION 02  \u00B7  SUPPLEMENT DETAIL  \u00B7  '+(idx+1).toString().padStart(2,'0')+' OF '+allItems.length.toString().padStart(2,'0'),M,18);
    const tSz=r.n.length>32?22:r.n.length>24?28:34;
    doc.setFont('times','normal');doc.setFontSize(tSz);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
    doc.text(r.n,M,38);
    doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(180,170,160);
    doc.text('SCORE '+item.sc+'  \u00B7  '+item.priLabel.toUpperCase()+'  \u00B7  '+(item.timing.time||'ANY TIME').toUpperCase(),M,46);
    // Layout
    const lW=46;const rx=M+lW+10;const rW=TW-lW-10;
    const by=58;
    // Left col: score circle
    drawCircle(M+lW/2,by+16,14,item.sc);
    let sy=by+36;
    [['EFFICACY',null,item.effi,5],['SAFETY',null,item.safe,5],['TIMING',item.timing.time||'Any',null,null],['FOOD',item.foodHint,null,null],['CYCLING',item.cycleInfo,null,null],['ONSET',item.onsetLabel,null,null]].forEach(([lbl,val,rat,tot])=>{
      doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(GRY[0],GRY[1],GRY[2]);doc.text(lbl,M,sy);sy+=3.5;
      if(rat!==null){drawPips(M,sy,rat,tot);sy+=5.5;}
      else{doc.setFont('times','normal');doc.setFontSize(8.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);doc.splitTextToSize(val||'\u2014',lW).slice(0,2).forEach(l=>{doc.text(l,M,sy);sy+=4.5;});}
      sy+=1.5;
    });
    // Right col
    let ry=by;
    const ptC=item.r.p==='essential'?GOLD:item.r.p==='recommended'?PUR:GRY;
    doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(ptC[0],ptC[1],ptC[2]);
    doc.setDrawColor(ptC[0],ptC[1],ptC[2]);doc.setLineWidth(0.5);
    const ptL=item.priLabel.toUpperCase();const ptW=doc.getTextWidth(ptL)+8;
    doc.rect(rx,ry,ptW,8,'S');doc.text(ptL,rx+4,ry+5.7);ry+=15;
    const descFull=item.desc||'';const dotIdx=descFull.indexOf('.');
    const headline=dotIdx>0?descFull.substring(0,dotIdx+1):descFull.substring(0,80);
    const bodyTxt=dotIdx>0?descFull.substring(dotIdx+1).trim():'';
    doc.setFont('times','normal');doc.setFontSize(13);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.splitTextToSize(headline,rW).slice(0,3).forEach(l=>{doc.text(l,rx,ry);ry+=6.5;});ry+=2;
    if(bodyTxt){
      doc.setFont('times','normal');doc.setFontSize(9.5);doc.setTextColor(60,60,60);
      doc.splitTextToSize(bodyTxt,rW).slice(0,7).forEach(l=>{doc.text(l,rx,ry);ry+=4.8;});ry+=3;
    }
    const stripH=20;
    doc.setFillColor(WARM[0],WARM[1],WARM[2]);doc.rect(rx,ry,rW,stripH,'F');
    doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(rx,ry,2,stripH,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
    doc.text('DOSING PROTOCOL',rx+6,ry+6);
    doc.setFont('times','italic');doc.setFontSize(9.5);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.splitTextToSize(item.dose.split(';')[0].trim(),rW-12).slice(0,2).forEach((l,i)=>{doc.text(l,rx+6,ry+12+(i*5));});ry+=stripH+8;
    if(item.hasMedInt){
      const iH=18;
      doc.setFillColor(244,240,250);doc.rect(rx,ry,rW,iH,'F');
      doc.setDrawColor(PUR[0],PUR[1],PUR[2]);doc.setLineWidth(0.4);doc.rect(rx,ry,rW,iH,'S');
      doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
      doc.text('MEDICATION INTERACTION NOTED',rx+5,ry+6);
      doc.setFont('times','normal');doc.setFontSize(9);doc.setTextColor(60,60,60);
      doc.splitTextToSize(item.intText,rW-10).slice(0,2).forEach((l,i)=>{doc.text(l,rx+5,ry+12+(i*5));});
      ry+=iH; // track right-col end past the interaction box
    }
    // Practitioner notes (tips) — fills the gap between body and metrics
    let noteEndY=Math.max(sy,ry);
    if(item.tips&&item.tips.trim().length>15){
      noteEndY+=8;
      doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.2);doc.line(M,noteEndY,pw-M,noteEndY);
      noteEndY+=7;
      doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
      doc.text('PRACTITIONER NOTES',M,noteEndY);noteEndY+=5;
      doc.setFont('times','italic');doc.setFontSize(9.5);doc.setTextColor(60,60,60);
      doc.splitTextToSize(item.tips,TW).forEach(l=>{doc.text(l,M,noteEndY);noteEndY+=5.2;});
      noteEndY+=4;
    }
    // Metrics row — positioned right below content, not hard-coded to bottom
    const mY=Math.min(Math.max(noteEndY+10,by+115),ph-52);
    const mCW=TW/4;
    doc.setFillColor(WARM[0],WARM[1],WARM[2]);doc.rect(M,mY,TW,26,'F');
    doc.setDrawColor(TBRD[0],TBRD[1],TBRD[2]);doc.setLineWidth(0.3);doc.rect(M,mY,TW,26,'S');
    const effLabels=['Exceptional','Excellent','Good','Fair','Limited'];
    const safLabels=['Excellent','Excellent','Good','Fair','Caution'];
    const mData=[
      {lbl:'EFFICACY',val:effLabels[5-Math.min(item.effi,5)],rat:item.effi},
      {lbl:'SAFETY',val:safLabels[5-Math.min(item.safe,5)],rat:item.safe},
      {lbl:'RESEARCH DEPTH',val:item.tierLabel.includes('\u2014')?item.tierLabel.split('\u2014 ')[1]:item.tierLabel,rat:item.rd},
      {lbl:'MED. INTERACTION',val:item.hasMedInt?'Interaction noted':'None identified',rat:null},
    ];
    mData.forEach((m,i)=>{
      const mx=M+i*mCW;
      if(i>0){doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.3);doc.line(mx,mY,mx,mY+26);}
      doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(GRY[0],GRY[1],GRY[2]);doc.text(m.lbl,mx+4,mY+8);
      if(m.rat){drawPips(mx+4,mY+11,m.rat,5,5.5,0.8);}
      const mvc=(m.lbl==='MED. INTERACTION'&&item.hasMedInt)?[185,28,28]:(m.lbl==='MED. INTERACTION')?[13,148,136]:DARK;
      doc.setFont('times','italic');doc.setFontSize(8.5);doc.setTextColor(mvc[0],mvc[1],mvc[2]);doc.text(m.val,mx+4,mY+22);
    });
    footer();
  });
  // ═══════════════════════════════════════
  // FINAL PAGE — BLOOD WORK + DISCLAIMER
  // ═══════════════════════════════════════
  doc.addPage();pageNum++;
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,0,pw,20,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('SUPPLEMENTSCORE  \u00B7  CLINICAL NOTES',M,12);
  let fy=30;
  const hasBW=typeof bloodWork!=='undefined'&&Object.keys(bloodWork).length>0;
  if(hasBW){
    const bwRes=analyzeBloodWork();
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
    doc.text('BLOOD WORK ANALYSIS',M,fy);fy+=8;
    doc.setFont('times','normal');doc.setFontSize(18);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text('Your Biomarker Results',M,fy);fy+=6;
    doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,fy,pw-M,fy);fy+=8;
    bwRes.forEach(bwr=>{
      const sc3={critical:[185,28,28],low:[202,138,4],optimal:[13,148,136],high:[75,123,229]};
      doc.setFont('times','bold');doc.setFontSize(9);doc.setTextColor(...(sc3[bwr.status]||[60,60,60]));
      doc.text(bwr.bio.name+': '+bwr.val+' '+bwr.bio.unit+'  \u2014  '+bwr.statusLabel,M,fy);fy+=5;
      if(bwr.needsAction&&bwr.bio.supps.length){
        doc.setFont('times','italic');doc.setFontSize(8);doc.setTextColor(80,80,80);
        bwr.bio.supps.forEach(s=>{doc.text('\u2192 '+s.name+': '+s.dose,M+4,fy);fy+=4;});
      }fy+=3;
    });fy+=8;
  }
  doc.setFillColor(WARM[0],WARM[1],WARM[2]);doc.rect(M,fy,TW,30,'F');
  doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(M,fy,2,30,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('IMPORTANT DISCLAIMER',M+6,fy+8);
  doc.setFont('times','normal');doc.setFontSize(9);doc.setTextColor(60,60,60);
  doc.splitTextToSize('This report is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider before starting any supplement regimen, especially if you have medical conditions or take prescription medications. Individual results may vary. Supplement interactions listed are not exhaustive.',TW-12).forEach((l,i)=>{doc.text(l,M+6,fy+15+(i*5));});
  footer();
  return doc;
}

async function downloadPDF(){
  try{await loadJsPDF();}catch(e){console.error('PDF library failed to load:',e);alert('Could not generate PDF — please check your internet connection and try again.');return;}
  const doc=generatePDF();
  if(!doc)return;
  const age=document.getElementById('asl').value;
  doc.save('SupplementScore-'+age+'yo-recommendations.pdf');
}

function loadProfile(){
  try{
    const saved=lsGet('ss-profile');
    if(!saved)return false;
    const p=JSON.parse(saved);
    if(p.age){document.getElementById('asl').value=p.age;updAge(p.age);}
    if(p.sex)pickSex(p.sex);
    if(p.meds){selectedMeds=new Set(p.meds);renderMedChips();}
    if(p.conds){selectedConds=new Set(p.conds);renderCondChips();}
    if(p.goals){selectedGoals=new Set(p.goals);renderGoalChips();}
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
  document.getElementById('asl').value=35;updAge(35);
  sex=null;document.getElementById('bm').className='sx-btn';document.getElementById('bf').className='sx-btn';document.getElementById('bp').className='sx-btn';
  selectedMeds=new Set();renderMedChips();
  selectedConds=new Set();renderCondChips();
  selectedGoals=new Set();renderGoalChips();
  ['prof-height-ft','prof-height-in','prof-weight'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  bloodWork={};renderBwGrid();clearBwUpload();
  const bmi=document.getElementById('bmi-display');if(bmi)bmi.textContent='';
  const wb=document.getElementById('welcome-back');if(wb)wb.style.display='none';
  document.getElementById('v-res').style.display='none';
  document.getElementById('v-input').style.display='block';
}
function getShareUrl(){
  const age=document.getElementById('asl').value;
  const params=new URLSearchParams();
  params.set('age',age);
  if(sex)params.set('sex',sex);
  if(selectedMeds.size)params.set('meds',[...selectedMeds].join(','));
  if(selectedConds.size)params.set('conds',[...selectedConds].join(','));
  if(selectedGoals.size)params.set('goals',[...selectedGoals].join(','));
  if(Object.keys(bloodWork).length>0)params.set('bw',Object.entries(bloodWork).map(([k,v])=>k+':'+v).join(','));
  return window.location.origin+window.location.pathname+'?'+params.toString();
}
function loadFromUrl(){
  const params=new URLSearchParams(window.location.search);
  if(!params.has('age')&&!params.has('sex'))return false;
  const age=params.get('age')||'35';
  document.getElementById('asl').value=age;updAge(age);
  const s=params.get('sex');if(s)pickSex(s);
  const meds=params.get('meds');if(meds){selectedMeds=new Set(meds.split(','));renderMedChips();}
  const conds=params.get('conds');if(conds){selectedConds=new Set(conds.split(','));renderCondChips();}
  const goals=params.get('goals');if(goals){selectedGoals=new Set(goals.split(','));renderGoalChips();}
  const bw=params.get('bw');if(bw){const _allowedBwKeys=(typeof BIOMARKERS==='object'&&BIOMARKERS)?Object.keys(BIOMARKERS):[];bw.split(',').forEach(pair=>{const[k,v]=pair.split(':');if(k&&v&&_allowedBwKeys.indexOf(k)!==-1){const parsed=parseFloat(v);if(isFinite(parsed)){bloodWork[k]=parsed;const input=document.getElementById('bw-'+k);if(input){input.value=v;updateBwRow(k,v);}}}});}
  updatePfCounts();
  return true;
}
function shareProfile(){
  const url=getShareUrl();
  navigator.clipboard.writeText(url).then(()=>{
    const btn=document.getElementById('share-btn');
    const orig=btn.textContent;btn.textContent='Copied!';
    setTimeout(()=>btn.textContent=orig,2000);
  }).catch(()=>{prompt('Copy this link:',url);});
}
function showEmailReport(){
  const box=document.getElementById('email-report-box');
  box.style.display=box.style.display==='none'?'flex':'none';
}
function sendEmailReport(){
  const email=document.getElementById('report-email').value.trim();
  if(!email||!email.includes('@'))return;
  const btn=document.getElementById('send-report-btn');btn.textContent='Sending...';btn.disabled=true;
  const age=document.getElementById('asl').value;
  const sexLabel=sex==='fp'?'Pregnant woman':sex==='m'?'Male':'Female';
  let summary='SupplementScore Recommendations\n';
  summary+='Profile: '+age+' year old '+sexLabel+'\n';
  if(selectedMeds.size)summary+='Medications: '+[...selectedMeds].map(k=>MEDS[k]?.label||k).join(', ')+'\n';
  if(selectedConds.size)summary+='Conditions: '+[...selectedConds].map(k=>CONDITIONS[k]?.label||k).join(', ')+'\n';
  const recs=_lastRecs;
  const selRecs=recs.filter(r=>selectedSupps.has(r.n));
  summary+='\n--- Essential ---\n';
  selRecs.filter(r=>r.p==='essential').forEach(r=>{summary+=r.n+' — '+r.dose.split(';')[0]+'\n';});
  summary+='\n--- Recommended ---\n';
  selRecs.filter(r=>r.p==='recommended').forEach(r=>{summary+=r.n+' — '+r.dose.split(';')[0]+'\n';});
  summary+='\n--- Worth Considering ---\n';
  selRecs.filter(r=>r.p==='consider').forEach(r=>{summary+=r.n+' — '+r.dose.split(';')[0]+'\n';});
  summary+='\nView full details: '+getShareUrl()+'\n';
  summary+='\nGenerated by SupplementScore.org';
  fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,subject:'Your SupplementScore Recommendations',message:summary,source:'email-report',date:new Date().toISOString()})}).then(r=>{
    if(r.ok){btn.textContent='Sent!';setTimeout(()=>{document.getElementById('email-report-box').style.display='none';btn.textContent='Send';btn.disabled=false;},2000);}
    else{btn.textContent='Try again';btn.disabled=false;}
  }).catch(()=>{btn.textContent='Try again';btn.disabled=false;});
}

/* ── Profile accordion toggle ── */
function pfToggle(btn){btn.closest('.pf-section').classList.toggle('pf-open');}
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
  if(tab==='profile'){
    views.supplements.style.display='';
    document.getElementById('p2').style.display='none';
    document.getElementById('main-sticky')&&(document.getElementById('main-sticky').style.display='none');
    // Hide header and stats on profile page
    const hdr=document.querySelector('.page-header');if(hdr)hdr.style.display='none';
    const evCard=document.querySelector('.ev-card');if(evCard)evCard.style.display='none';
    // Show gate or real profile
    if(profileUnlocked){
      document.getElementById('profile-gate').style.display='none';
      document.getElementById('p1').style.display='block';
    }else{
      document.getElementById('p1').style.display='none';
      document.getElementById('profile-gate').style.display='block';
    }
  }else if(tab==='supplements'){
    document.getElementById('profile-gate').style.display='none';
    document.getElementById('p1').style.display='none';
    document.getElementById('p2').style.display='block';
    // Show header and stats on supplements page
    const hdr=document.querySelector('.page-header');if(hdr)hdr.style.display='';
    const evCard=document.querySelector('.ev-card');if(evCard)evCard.style.display='';
    document.getElementById('main-sticky')&&(document.getElementById('main-sticky').style.display='');
  }
  // Update active tab
  Object.keys(tabs).forEach(k=>{if(tabs[k])tabs[k].classList.toggle('active',k===tab);});
  if(tab==='about'){
    const src=document.getElementById('about-content-inline');
    const tgt=document.getElementById('about-content-target');
    if(src&&tgt&&!tgt.children.length){tgt.appendChild(src);src.style.display='';}
  }
  window.scrollTo({top:0,behavior:'smooth'});
}

/* Profile gate: secret code or email signup */
function handleGateSubmit(e){
  e.preventDefault();
  const inp=document.getElementById('gate-email');
  const val=(inp.value||'').trim();
  if(!val)return false;
  // Secret unlock code
  if(val==='12345'){
    profileUnlocked=true;
    document.getElementById('profile-gate').style.display='none';
    document.getElementById('p1').style.display='block';
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
  document.querySelector('.gate-form').style.display='none';
  document.getElementById('gate-success').style.display='flex';
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
