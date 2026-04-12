let selectedMeds=new Set();
function renderMedChips(){const el=document.getElementById('med-chips');el.innerHTML=Object.entries(MEDS).map(([k,m])=>`<div class="med-chip ${selectedMeds.has(k)?'on':''}" onclick="toggleMed('${k}')">${m.label}</div>`).join('');updateMedNote();}
function toggleMed(k){selectedMeds.has(k)?selectedMeds.delete(k):selectedMeds.add(k);renderMedChips();}
function updateMedNote(){const n=document.getElementById('med-note');if(selectedMeds.size===0){n.style.display='none';return;}n.style.display='block';const avoidAll=new Set(),cautionAll=new Set(),extraAll=new Set();selectedMeds.forEach(k=>{const m=MEDS[k];m.avoid.forEach(x=>avoidAll.add(x));m.caution.forEach(x=>cautionAll.add(x));m.extra.forEach(x=>extraAll.add(x));});n.innerHTML=`${avoidAll.size>0?'⚠ Will exclude: '+[...avoidAll].join(', ')+'. ':''}${cautionAll.size>0?'⚡ Will flag cautions on: '+[...cautionAll].join(', ')+'. ':''}${extraAll.size>0?'✚ Will add: '+[...extraAll].join(', ')+'.':''}`;}
function getMedInteractions(){const avoidAll=new Set(),cautionMap={},extraAll=new Set(),notes=[];selectedMeds.forEach(k=>{const m=MEDS[k];m.avoid.forEach(x=>avoidAll.add(x));m.caution.forEach(x=>{if(!cautionMap[x])cautionMap[x]=[];cautionMap[x].push(m.label);});m.extra.forEach(x=>extraAll.add(x));notes.push({med:m.label,note:m.note});});return{avoid:avoidAll,caution:cautionMap,extra:[...extraAll],notes};}
function dots(n,tp){return Array.from({length:5},(_,i)=>`<div class="rt-dot ${i<n?'on-'+tp:''}"></div>`).join('');}
function rHtml(e,s,r,o,c,d){return`<div class="rt-section">${e!=null?`<div class="rt-row"><span class="rt-lbl">Efficacy</span><div class="rt-dots">${dots(e,'e')}</div><span class="rt-text">${EL[e]||''}</span></div>`:''}${s!=null?`<div class="rt-row"><span class="rt-lbl">Safety</span><div class="rt-dots">${dots(s,s<=2?'d':'s')}</div><span class="rt-text">${SL[s]||''}</span></div>`:''}${r!=null?`<div class="rt-row"><span class="rt-lbl">Research</span><div class="rt-dots">${dots(r,r<=2?'d':'e')}</div><span class="rt-text">${RL[r]||''}</span></div>`:''}${o!=null?`<div class="rt-row"><span class="rt-lbl">Onset</span><div class="rt-dots">${dots(o,o<=2?'d':'s')}</div><span class="rt-text">${OL[o]||''}</span></div>`:''}${c!=null?`<div class="rt-row"><span class="rt-lbl">Value</span><div class="rt-dots">${dots(c,c<=2?'d':'e')}</div><span class="rt-text">${CL[c]||''}</span></div>`:''}${d!=null?`<div class="rt-row"><span class="rt-lbl">Interact.</span><div class="rt-dots">${dots(d,d<=2?'d':'s')}</div><span class="rt-text">${DL[d]||''}</span></div>`:''}</div>`;}

function toggleSrcSidebar(){const d=document.getElementById('src-detail2'),open=d.classList.toggle('open');document.getElementById('chv2').classList.toggle('open',open);document.getElementById('sml2').textContent=open?'Hide sources':'More info on sources';}
function toggleMeth(){const d=document.getElementById('meth-body'),open=d.classList.toggle('open');document.getElementById('meth-chv').classList.toggle('open',open);}
function decodeContact(e){e.preventDefault();const p=['yvese','ggleston','@','gm','ail','.com'];window.location.href='mai'+'lto:'+p.join('');}
function submitEarlyAccess(){const email=document.getElementById('ea-email').value.trim();if(!email||!email.includes('@')){document.getElementById('ea-email').style.borderColor='var(--t4c)';return;}const btn=document.querySelector('.ea-btn');btn.textContent='Sending...';btn.disabled=true;fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,source:'early-access',date:new Date().toISOString()})}).then(r=>{if(r.ok){document.getElementById('ea-form').style.display='none';document.getElementById('ea-success').style.display='block';}else{btn.textContent='Try again';btn.disabled=false;}}).catch(()=>{btn.textContent='Try again';btn.disabled=false;});}
function ageGroup(a){if(a<26)return'Young adult (18–25)';if(a<31)return'Young adult (26–30)';if(a<46)return'Adult (31–45)';if(a<61)return'Middle-aged adult (46–60)';if(a<76)return'Senior adult (61–75)';return'Older adult (76+)';}
function updAge(v){document.getElementById('age-grp').textContent=ageGroup(parseInt(v));}
function stepAge(d){const el=document.getElementById('asl');let v=parseInt(el.value||35)+d;v=Math.max(18,Math.min(90,v));el.value=v;updAge(v);}
function clampAge(el){let v=parseInt(el.value);if(isNaN(v))v=35;v=Math.max(18,Math.min(90,v));el.value=v;updAge(v);}
const _ageInput=document.getElementById('asl');
_ageInput.addEventListener('input',function(){updAge(this.value);});
updAge(_ageInput.value);
let sex=null;
function pickSex(s){sex=s;const bm=document.getElementById('bm'),bf=document.getElementById('bf'),bp=document.getElementById('bp');bm.className='sx-btn'+(s==='m'?' on-m':'');bf.className='sx-btn'+(s==='f'?' on-f':'');bp.className='sx-btn'+(s==='fp'?' on-p':'');document.getElementById('serr').style.display='none';}
function editP(){document.getElementById('v-res').style.display='none';document.getElementById('v-input').style.display='block';}
function tbadge(t){const m=TM[t];return m&&(t==='t1'||t==='t2')?`<span class="tbadge" style="background:${m.bg};color:${m.tx}">${t==='t1'?'Tier 1':'Tier 2'}</span>`:'';}
function getRecs(age,sx){const iF=sx==='f'||sx==='fp',isPreg=sx==='fp',repAge=iF&&age>=18&&age<=50,young=age<31,midA=age>=31&&age<46,midAged=age>=46&&age<61,senior=age>=61;const r=[];r.push({n:'Vitamin D3',p:'essential',tier:'t1',tf:true,e:4,s:4,why:'Deficiency affects ~40% of adults globally. VITAL trial: 2,000 IU/day reduced cancer mortality 17% and autoimmune disease risk significantly.',dose:'1,000–2,000 IU/day maintenance (test 25-OH-D first; 4,000 IU/day to correct deficiency)'});r.push({n:'Magnesium',p:'essential',tier:'t1',tf:false,e:4,s:5,why:'NIH ODS: ~48% of Americans fall below the EAR. Supports sleep, insulin sensitivity, cardiovascular, and cognitive health.',dose:'200–400 mg/day magnesium glycinate (sleep/CNS) or malate (energy/exercise); 30–45 min before bed for sleep support'});if(sx==='m')r.push({n:'Zinc',p:'recommended',tier:'t1',tf:false,e:4,s:4,why:'Men lose zinc through sweat at higher rates and require it for testosterone biosynthesis, immune function, and prostate health.',dose:'15–25 mg/day zinc picolinate or bisglycinate (do not exceed 40 mg/day)'});if(repAge){r.push({n:'Iron',p:'essential',tier:'t2',tf:true,e:4,s:3,why:'WHO: iron deficiency anaemia affects 24.8% of the global population, disproportionately women of reproductive age.',dose:'30–60 mg/day ferrous bisglycinate — test ferritin first'});r.push({n:'Folate (5-MTHF)',p:'essential',tier:'t2',tf:false,e:4,s:4,why:'USPSTF Grade A. WHO: 400 mcg daily for all women of reproductive age. Neural tube defects form days 21–28 — must begin before conception.',dose:'400–600 mcg/day 5-MTHF (methylfolate), preferred over synthetic folic acid'});}if(isPreg){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'DHA is the primary structural fat in the foetal brain and retina. WHO recommends 300 mg DHA/day during pregnancy. CHILD cohort: higher maternal DHA linked to improved neurodevelopmental outcomes.',dose:'300–600 mg DHA/day (from 1–2 g EPA+DHA); choose a prenatal-formulated fish or algal oil'});r.push({n:'Calcium',p:'essential',tier:'t2',tf:false,e:4,s:4,why:'Foetal skeletal mineralisation draws heavily from maternal stores. NIH: requirements increase to 1,000–1,300 mg/day during pregnancy. WHO meta-analysis: calcium supplementation reduces preeclampsia risk by 55% in low-intake populations.',dose:'500 mg elemental calcium × 2 daily with meals; space 2 hours from iron'});r.push({n:'Ginger (Zingiber officinale)',p:'recommended',tier:'t2',tf:false,e:4,s:5,why:'Cochrane meta-analysis: significant reduction in nausea and vomiting of pregnancy. First-line non-pharmacological therapy.',dose:'1–1.5 g/day in divided doses for NVP'});r.push({n:'Vitamin B6 (P5P)',p:'recommended',tier:'t2',tf:false,e:3,s:3,why:'USPSTF recommends 10–25 mg TID for nausea and vomiting of pregnancy. ACOG first-line monotherapy for mild NVP.',dose:'10–25 mg × 3 daily. Do not exceed 100 mg/day.'});r.push({n:'Choline',p:'recommended',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: essential for foetal brain development and neural tube closure. Most prenatal vitamins do not contain adequate choline.',dose:'450–550 mg/day from food + supplementation'});r.push({n:'Iodine',p:'essential',tier:'t2',tf:false,e:4,s:3,why:'WHO: iodine requirements increase 50% during pregnancy. Deficiency is the most preventable cause of cognitive impairment in newborns.',dose:'220 mcg/day total from diet + supplementation'});}if(young){r.push({n:'Creatine monohydrate',p:'recommended',tier:'t1',tf:false,e:5,s:5,why:'ISSN Level A — most evidence-backed performance supplement. NIH ODS: strong long-term safety record. 2024 data confirmed cognitive benefits.',dose:'3–5 g/day — no loading needed'});r.push({n:'Omega-3 (EPA/DHA)',p:'recommended',tier:'t1',tf:false,e:4,s:4,why:'NIH VITAL trial (25,871 participants): 2,000 mg/day cut MI by 28% and reduced cancer mortality 17%. Building cardiovascular foundation now maximises cumulative benefit.',dose:'1–2 g/day EPA+DHA from a quality fish oil'});r.push({n:'Ashwagandha (KSM-66)',p:'consider',tier:'t2',tf:false,e:4,s:3,why:'Reduces cortisol and stress reactivity — highly relevant during high-demand academic or work phases. Works cumulatively over 4–8 weeks.',dose:'300 mg KSM-66 with dinner; cycle 8 wks on, 2–4 wks off'});r.push({n:'L-Theanine',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'Promotes relaxed alertness without sedation. Particularly effective for exam stress and focus during cognitive work.',dose:'100–200 mg for focus; 200–400 mg alone for calm/sleep support'});r.push({n:'Rhodiola rosea',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'2025 meta-analysis (26 RCTs): significant improvements in VO2max and time to exhaustion. Also reduces perceived mental fatigue under stress.',dose:'200–400 mg/day standardised extract; 6–8 wks on, 2–4 wks off'});}if(midA){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'CVD risk begins its meaningful rise in this decade. NIH VITAL trial and 2025 meta-analysis (42 RCTs) both confirm significant CVD mortality and MI reduction.',dose:'1–2 g/day EPA+DHA. Higher (2–4 g/day) if triglycerides are elevated.'});r.push({n:'Creatine monohydrate',p:'recommended',tier:'t1',tf:false,e:5,s:5,why:'Muscle mass declines from the early 30s at ~1% per year. Creatine with resistance training is the most evidence-backed intervention.',dose:'3–5 g/day continuously'});r.push({n:'Vitamin K2 (MK-7)',p:'recommended',tier:'t2',tf:false,e:3,s:5,why:'Arterial calcification risk begins rising in the 30s. Rotterdam Study: 57% reduced cardiac mortality in those with highest MK-7 intake. Pairs synergistically with Vitamin D3.',dose:'90–200 mcg/day MK-7 alongside Vitamin D3'});r.push({n:'Ashwagandha (KSM-66)',p:'consider',tier:'t2',tf:false,e:4,s:3,why:'Cortisol dysregulation peaks in this career and life stage. HPA axis modulation is most clinically relevant from age 30–55.',dose:'300–600 mg/day; cycle 8–12 wks on, 2–4 wks off'});r.push({n:'L-Theanine',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'Supports calm focus and sleep quality without dependency — particularly useful if stress is impacting sleep or daytime performance.',dose:'200–400 mg/day; 30–45 min before bed for sleep support'});if(iF)r.push({n:'Saffron (Crocus sativus)',p:'consider',tier:'t2',tf:false,e:4,s:4,why:'2024 systematic review (46 RCTs): depression ES=−4.26, anxiety ES=−3.75. Particularly relevant for perimenopause mood changes. Non-inferior to conventional drugs.',dose:'28–30 mg/day standardised saffron extract'});}if(midAged){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'CVD risk accelerates significantly in this decade. 2025 meta-analysis (42 RCTs, 176K+) and VITAL trial both confirm meaningful CVD mortality reduction.',dose:'2–4 g/day EPA+DHA — higher if cardiovascular risk factors are present'});r.push({n:'Vitamin B12',p:'recommended',tier:'t1',tf:true,e:4,s:5,why:'NIH ODS: B12 absorption requires intrinsic factor that declines with age; PPIs and metformin significantly impair uptake. Deficiency affects ~20% of adults over 50.',dose:'500–1,000 mcg/day oral cyanocobalamin. Test serum B12 and MMA.'});r.push({n:'Creatine monohydrate',p:'recommended',tier:'t1',tf:false,e:5,s:5,why:'Muscle loss accelerates in this decade. Creatine with resistance training is the most evidence-backed strategy for preserving lean mass and cognitive function.',dose:'3–5 g/day continuously'});if(iF)r.push({n:'Vitamin K2 (MK-7)',p:'essential',tier:'t2',tf:false,e:3,s:5,why:'Declining oestrogen during perimenopause sharply accelerates bone loss. MK-7 activates osteocalcin (bone calcium) and matrix Gla protein (arterial protection).',dose:'90–200 mcg/day MK-7 alongside Vitamin D3'});else r.push({n:'Vitamin K2 (MK-7)',p:'recommended',tier:'t2',tf:false,e:3,s:5,why:'Arterial calcification risk rises meaningfully from middle age. Rotterdam Study: 57% reduced cardiac mortality in highest MK intake group.',dose:'90–200 mcg/day MK-7 alongside Vitamin D3'});r.push({n:'Lutein + Zeaxanthin',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'AMD risk begins rising now. AREDS2 trial (NIH-funded): confirmed ~26% AMD progression risk reduction.',dose:'10 mg lutein + 2 mg zeaxanthin/day (AREDS2 formula) with a fatty meal'});r.push({n:'CoQ10 (Ubiquinol)',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: statins block CoQ10 synthesis; mitochondrial CoQ10 declines with age. 2024 meta-analysis (33 RCTs): reduces all-cause mortality in heart failure.',dose:'100–200 mg/day ubiquinol with a fatty meal'});r.push({n:'Saffron (Crocus sativus)',p:'consider',tier:'t2',tf:false,e:4,s:4,why:'Among the most evidence-backed botanicals for mood. 2024 review (46 RCTs): depression ES=−4.26. Relevant for both stress-related mood changes and sleep quality.',dose:'28–30 mg/day standardised saffron extract'});}if(senior){r.push({n:'Omega-3 (EPA/DHA)',p:'essential',tier:'t1',tf:false,e:4,s:4,why:'CVD is the leading cause of death in this age group. NIH VITAL trial and 2025 meta-analysis confirm significant reductions in CV mortality, MI, and CHD.',dose:'2–4 g/day EPA+DHA. Consider icosapent ethyl if CVD diagnosed.'});r.push({n:'Vitamin B12',p:'essential',tier:'t1',tf:true,e:4,s:5,why:'NIH ODS: deficiency affects ~20% of adults over 60; absorption impaired by gastric acid decline, PPIs, and metformin. Neurological damage is progressive.',dose:'500–1,000 mcg/day oral cyanocobalamin. Discuss IM injections with GP if absorption impaired.'});r.push({n:'Vitamin K2 (MK-7)',p:'essential',tier:'t2',tf:false,e:3,s:5,why:'Bone fracture and arterial calcification risk accelerate sharply after 60. K2 activates proteins that direct calcium into bone and away from arteries.',dose:'90–200 mcg/day MK-7, paired with Vitamin D3'});r.push({n:'Creatine monohydrate',p:'essential',tier:'t1',tf:false,e:5,s:5,why:'Sarcopenia is the primary driver of frailty and falls. NIH ODS: creatine with resistance training is the most evidence-backed intervention for preserving muscle and cognitive function after 60.',dose:'3–5 g/day — no loading needed. Take consistently including rest days.'});r.push({n:'Calcium',p:'essential',tier:'t2',tf:false,e:4,s:4,why:'Bone mineral density declines progressively after 60. NIH ODS: most older adults do not meet the 1,200 mg/day calcium requirement from diet alone. Paired with D3 and K2 for maximum skeletal benefit.',dose:'500 mg elemental calcium × 2 daily with meals; do not take single doses above 500 mg'});r.push({n:'Lutein + Zeaxanthin',p:'recommended',tier:'t2',tf:false,e:3,s:5,why:'AMD is the leading cause of blindness in adults over 60. AREDS2 trial (NIH-funded, 4,203 participants): ~26% AMD progression risk reduction.',dose:'10 mg lutein + 2 mg zeaxanthin/day (AREDS2 formula) with a fatty meal'});r.push({n:'HMB (β-Hydroxy-β-methylbutyrate)',p:'recommended',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: evidence strongest in older adults. 2025 meta-analysis (21 RCTs, 1,935 adults >50): significant improvements in lean mass.',dose:'3 g/day (1 g × 3 with meals). Allow ≥12 weeks alongside resistance exercise.'});r.push({n:'Whey protein',p:'recommended',tier:'t1',tf:false,e:4,s:5,why:'Appetite decreases with age while protein requirements increase. NIH ODS: adequate dietary protein is essential.',dose:'20–40 g/serving after resistance exercise. Target ≥1.2–1.6 g/kg body weight/day.'});r.push({n:'CoQ10 (Ubiquinol)',p:'recommended',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: CoQ10 depleted by statins and declines with age. 2024 meta-analysis (33 RCTs): reduces all-cause mortality (RR=0.64) in heart failure.',dose:'200–400 mg/day ubiquinol in 2 doses with fatty meals'});r.push({n:'Acetyl-L-Carnitine (ALCAR)',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'NIH ODS: L-carnitine synthesis declines with age. Multiple meta-analyses confirm significant cognitive improvement in older adults with MCI.',dose:'1,500–2,000 mg/day in 2–3 divided doses (morning and early afternoon; avoid evening)'});r.push({n:'Phosphatidylserine',p:'consider',tier:'t2',tf:false,e:3,s:4,why:'FDA qualified health claim for cognitive decline. Multiple RCTs confirm improvements in memory, recall, and learning in older adults. Supports cortisol regulation and neuronal membrane integrity.',dose:'300–400 mg/day in 2–3 divided doses with meals; allow 4–8 weeks for full benefit'});r.push({n:'Ashwagandha (KSM-66)',p:'consider',tier:'t2',tf:false,e:4,s:3,why:'Supports HPA axis resilience, preserves lean muscle mass, and improves sleep quality — all key concerns in older adults.',dose:'300 mg KSM-66 with dinner; cycle 8 wks on, 2–4 wks off'});r.push({n:'L-Theanine',p:'consider',tier:'t2',tf:false,e:3,s:5,why:'Supports sleep quality and calm focus without drug interactions or dependency — ideal for older adults managing multiple medications.',dose:'200–400 mg/day; 30–45 min before bed for sleep support'});}const seen=new Set();return r.filter(x=>{if(seen.has(x.n))return false;seen.add(x.n);return true;});}
function applyMedExtras(recs,mi){
  mi.extra.forEach(n=>{
    if(!recs.find(r=>r.n===n)){
      const s=S.find(x=>x.n===n);
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
  const wtKg=wt*0.4536;
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
const _nightSupps=new Set(['Magnesium','L-Theanine','Ashwagandha (KSM-66)','Glycine','Melatonin','Tart cherry (Montmorency)','Magnesium L-threonate','Magnolia bark (honokiol + magnolol)','Valerian root','Apigenin','Saffron (Crocus sativus)','Lemon balm (Melissa officinalis)','Passionflower (Passiflora incarnata)','California poppy (Eschscholzia californica)','Jujube (Ziziphus jujuba)','Chamomile extract (Matricaria chamomilla)','5-HTP','Tryptophan (L-tryptophan)','Lavender oil oral (Silexan)','Phosphatidylserine']);
const _morningSupps=new Set(['Vitamin D3','Iron','Vitamin B12','Folate (5-MTHF)','Vitamin B6 (P5P)','SAMe','Rhodiola rosea','Tyrosine (L-tyrosine)','Acetyl-L-Carnitine (ALCAR)','Vitamin D3 liquid drops','Omega-3 (EPA/DHA)','CoQ10 (Ubiquinol)','Choline','Zinc','Iodine']);
function getTimingLabel(r){
  if(_nightSupps.has(r.n))return{time:'Night',icon:_svgIcons.night,cat:'night'};
  if(_morningSupps.has(r.n))return{time:'Morning',icon:_svgIcons.morning,cat:'morning'};
  const s=S.find(x=>x.n===r.n);
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
  const sup=S.find(x=>x.n===r.n);
  const sc=sup?calcScore(sup):0;
  const scCls=sc>=80?'score-high':sc>=60?'score-mid':sc>=40?'score-low':'score-bad';
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
const LOAD_STEPS=[
  {at:0,text:'Analyzing your profile…',sub:'Matching against 528 supplements'},
  {at:20,text:'Checking medication interactions…',sub:'Cross-referencing drug-supplement data'},
  {at:45,text:'Evaluating clinical evidence…',sub:'Reviewing RCTs and meta-analyses'},
  {at:70,text:'Ranking by efficacy and safety…',sub:'Building your personalised list'},
  {at:90,text:'Finalising recommendations…',sub:'Almost ready'}
];
function genRecs(){
  if(!sex){document.getElementById('serr').style.display='block';return;}
  // Show loading
  const btn=document.querySelector('.go-btn');btn.disabled=true;
  document.getElementById('v-input').style.display='none';
  const lo=document.getElementById('v-loading');lo.classList.add('vis');
  const bar=document.getElementById('load-bar');
  const lt=document.getElementById('load-text'),ls=document.getElementById('load-sub');
  bar.style.width='0%';
  let elapsed=0;const total=5000;const interval=50;
  const tick=setInterval(()=>{
    elapsed+=interval;const pct=Math.min((elapsed/total)*100,100);
    bar.style.width=pct+'%';
    for(let i=LOAD_STEPS.length-1;i>=0;i--){if(pct>=LOAD_STEPS[i].at){lt.textContent=LOAD_STEPS[i].text;ls.textContent=LOAD_STEPS[i].sub;break;}}
    if(elapsed>=total){clearInterval(tick);lo.classList.remove('vis');btn.disabled=false;_showRecs();}
  },interval);}
function _showRecs(){
  const age=parseInt(document.getElementById('asl').value);
  const mi=getMedInteractions();
  const recs=getRecs(age,sex).filter(r=>!mi.avoid.has(r.n));
  applyMedExtras(recs,mi);
  // Add condition-based and goal-based supplements
  const condSupps=getCondSupps();
  const goalSupps=getGoalSupps();
  goalSupps.forEach(n=>{if(!mi.avoid.has(n)&&!recs.find(r=>r.n===n)){const s=S.find(x=>x.n===n);if(s)recs.push({n:s.n,p:'consider',tier:s.t,tf:false,e:s.e,s:s.s,why:'Suggested based on your selected goal(s).',dose:s.dose,_goalExtra:true});}});
  condSupps.forEach(n=>{if(!mi.avoid.has(n)&&!recs.find(r=>r.n===n)){const s=S.find(x=>x.n===n);if(s)recs.push({n:s.n,p:'consider',tier:s.t,tf:false,e:s.e,s:s.s,why:`Suggested based on your selected condition(s).`,dose:s.dose,_condExtra:true});}});

  const sexLabel=sex==='fp'?'pregnant woman':sex==='m'?'man':'woman';
  document.getElementById('res-hd').textContent='Your supplement plan';
  document.getElementById('res-sh').textContent=`${age}-year-old ${sexLabel} \u00B7 Last updated today`;

  // Dashboard stat cards
  const essCount=recs.filter(x=>x.p==='essential').length;
  const recCount=recs.filter(x=>x.p==='recommended').length;
  const conCount=recs.filter(x=>x.p==='consider').length;
  const dashStats=document.getElementById('dash-stats');
  if(dashStats)dashStats.innerHTML=[
    {n:essCount,l:'Essential',c:'#0D9488'},{n:recCount,l:'Recommended',c:'#4B7BE5'},
    {n:conCount,l:'Consider',c:'#CA8A04'},{n:recs.length,l:'Total',c:'#7B1FA2'}
  ].map(s=>`<div style="background:var(--color-background-primary);border:1px solid var(--color-border-tertiary);border-radius:10px;padding:12px 14px;text-align:center"><div style="font-size:22px;font-weight:700;color:${s.c};line-height:1">${s.n}</div><div style="font-size:9px;color:var(--color-text-tertiary);margin-top:4px;text-transform:uppercase;letter-spacing:.04em">${s.l}</div></div>`).join('');

  // Profile summary strip
  const dashStrip=document.getElementById('dash-profile-strip');
  if(dashStrip){
    const sep='<div style="width:1px;height:14px;background:var(--color-border-tertiary)"></div>';
    let parts=[];
    parts.push(`<b style="color:var(--color-text-primary)">Age:</b> ${age}`);
    parts.push(`<b style="color:var(--color-text-primary)">Sex:</b> ${sexLabel}`);
    const wt=document.getElementById('prof-weight')?.value;if(wt)parts.push(`<b style="color:var(--color-text-primary)">Weight:</b> ${wt} lbs`);
    if(selectedConds.size)parts.push(`<b style="color:var(--color-text-primary)">Conditions:</b> ${[...selectedConds].map(k=>CONDITIONS[k]?.label||k).join(', ')}`);
    if(selectedGoals.size)parts.push(`<b style="color:var(--color-text-primary)">Goals:</b> ${[...selectedGoals].map(k=>GOALS[k]?.label||k).join(', ')}`);
    dashStrip.innerHTML=parts.map(p=>`<span>${p}</span>`).join(sep)+`${sep}<span style="color:#7B1FA2;cursor:pointer;font-weight:500" onclick="editP()">Edit &rarr;</span>`;
  }

  renderMedAlerts(mi);

  // Build daily schedule — 3 categories: Morning, Daytime, Night
  const schedule={morning:[],daytime:[],night:[]};
  const priLabel={essential:'Essential',recommended:'Recommended',consider:'Worth considering'};
  const priColor={essential:'#065F56',recommended:'#2A4A8E',consider:'#7A5300'};
  recs.forEach(r=>{
    const t=getTimingLabel(r);if(!t)return;
    const entry={name:r.n,dose:r.dose,pri:r.p,priLabel:priLabel[r.p]||'',priColor:priColor[r.p]||''};
    if(t.cat==='night')schedule.night.push(entry);
    else if(t.cat==='morning')schedule.morning.push(entry);
    else schedule.daytime.push(entry);
  });
  const schedBox=document.getElementById('schedule-box');
  if(schedBox){
    // Group by priority, add time badge to each
    const priGroups={essential:[],recommended:[],consider:[]};
    recs.forEach(r=>{
      const t=getTimingLabel(r);
      const sup=S.find(x=>x.n===r.n);
      const sc=sup?calcScore(sup):0;
      const entry={name:r.n,dose:r.dose,cat:t?.cat||'daytime',time:t?.time||'Daytime',score:sc};
      if(priGroups[r.p])priGroups[r.p].push(entry);
    });
    const timeBg={Morning:'#FEF6E0',Daytime:'#EBF0FC',Night:'#EEEDFE'};
    const timeClr={Morning:'#7A5300',Daytime:'#2A4A8E',Night:'#26215C'};
    const priDot={essential:'#0D9488',recommended:'#4B7BE5',consider:'#CA8A04'};
    const priLbl={essential:'Essential — take these daily',recommended:'Recommended — strong evidence for your profile',consider:'Worth considering — based on your goals & conditions'};
    const priLblClr={essential:'#065F56',recommended:'#2A4A8E',consider:'#7A5300'};
    const timeIcon={Morning:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',Daytime:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B7BE5" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="17" r="5"/><path d="M12 2v6M4.22 10.22l1.42 1.42M19.78 10.22l-1.42 1.42"/></svg>',Night:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534AB7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'};
    const foodIcon='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>';
    const noFoodIcon='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6"/></svg>';
    function getFoodInfo(name){
      const sup=S.find(x=>x.n===name);
      if(!sup||!sup.tips)return{withFood:true};
      const t=sup.tips.toLowerCase();
      // "Take on an empty stomach" = empty, "Do not take on an empty stomach" = with food
      if(t.includes('take on an empty stomach')||t.includes('take on empty stomach'))return{withFood:false};
      if(t.includes('any time')||t.includes('with or without'))return{either:true};
      if(t.includes('empty stomach')&&!t.includes('not')&&!t.includes('avoid'))return{withFood:false};
      return{withFood:true};
    }
    const _disabledSupps=JSON.parse(localStorage.getItem('ss-disabled-supps')||'[]');
    const disabledSet=new Set(_disabledSupps);
    function togglePlanItem(name,btn){
      const row=btn.closest('[data-plan-item]');
      if(disabledSet.has(name)){disabledSet.delete(name);btn.classList.add('on');row.classList.remove('plan-item-off');}
      else{disabledSet.add(name);btn.classList.remove('on');row.classList.add('plan-item-off');}
      localStorage.setItem('ss-disabled-supps',JSON.stringify([...disabledSet]));
    }
    function renderItem(item){
      const sup=S.find(x=>x.n===item.name);
      const fi=getFoodInfo(item.name);
      const tIcon=timeIcon[item.time]||timeIcon.Daytime;
      const fIcon=fi.either?`<span style="color:var(--color-text-tertiary)" title="With or without food">${foodIcon}</span>`:fi.withFood?`<span style="color:#0D9488" title="Take with food">${foodIcon}</span>`:`<span style="color:#B91C1C" title="Take on empty stomach">${noFoodIcon}</span>`;
      const isOff=disabledSet.has(item.name);
      return`<div data-plan-item="${item.name}" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f4f4f4" class="${isOff?'plan-item-off':''}"><button type="button" class="plan-toggle ${isOff?'':'on'}" onclick="togglePlanItem('${item.name.replace(/'/g,"\\'")}',this)"></button><div style="width:24px;display:flex;justify-content:center;flex-shrink:0" title="${item.time}">${tIcon}</div><div style="flex:1;min-width:0"><div class="plan-item-name" style="font-size:12px;font-weight:600">${item.name}</div><div style="font-size:10px;color:#57534e;margin-top:2px">${item.dose}</div></div><div style="display:flex;align-items:center;gap:4px;flex-shrink:0">${fIcon}</div></div>`;
    }
    const legend=`<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:10px;color:var(--color-text-tertiary)"><span style="display:flex;align-items:center;gap:4px">${timeIcon.Morning} Morning</span><span style="display:flex;align-items:center;gap:4px">${timeIcon.Daytime} Daytime</span><span style="display:flex;align-items:center;gap:4px">${timeIcon.Night} Night</span><span style="width:1px;height:12px;background:var(--color-border-tertiary)"></span><span style="display:flex;align-items:center;gap:4px;color:#0D9488">${foodIcon} With food</span><span style="display:flex;align-items:center;gap:4px;color:#B91C1C">${noFoodIcon} Empty stomach</span></div>`;
    let sh=`<div style="padding:14px 18px;border-bottom:1px solid #eee"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="font-size:14px;font-weight:700">Your supplement plan</div></div>${legend}</div>`;
    [{key:'essential'},{key:'recommended'},{key:'consider'}].forEach(({key})=>{
      const items=priGroups[key];
      if(!items.length)return;
      sh+=`<div style="padding:12px 18px;border-bottom:1px solid #f4f4f4">`;
      sh+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${priLblClr[key]};margin-bottom:8px;display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;border-radius:50%;background:${priDot[key]};flex-shrink:0"></div>${priLbl[key]}</div>`;
      const limit=key==='consider'?5:999;
      const uid='plan-more-'+key;
      items.forEach((item,i)=>{
        if(i===limit)sh+=`<div id="${uid}" style="display:none">`;
        sh+=renderItem(item);
      });
      if(items.length>limit){
        sh+=`</div>`;
        sh+=`<button type="button" onclick="const el=document.getElementById('${uid}');const open=el.style.display==='none';el.style.display=open?'block':'none';this.textContent=open?'Show less':'See ${items.length-limit} more'" style="width:100%;padding:8px;border:1px solid var(--color-border-tertiary);border-radius:8px;background:none;font-size:11px;font-weight:500;color:var(--color-text-secondary);cursor:pointer;margin-top:6px;font-family:inherit">See ${items.length-limit} more</button>`;
      }
      // Add a supplement row
      const addId='plan-add-'+key;
      sh+=`<div class="plan-add-row" onclick="const s=document.getElementById('${addId}');s.style.display=s.style.display==='none'?'block':'none';if(s.style.display==='block')s.querySelector('input')?.focus()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Add a supplement...</div>`;
      sh+=`<div id="${addId}" style="display:none"><input type="text" class="plan-search" placeholder="Search supplements to add..." oninput="planSearch(this,'${addId}')"><div id="${addId}-results" class="plan-search-results" style="display:none"></div></div>`;
      sh+=`</div>`;
    });
    schedBox.innerHTML=sh;schedBox.style.display='block';
  }
  // Plan search/add functions (defined globally so onclick works)
  window.togglePlanItem=togglePlanItem;
  window.planSearch=function(input,addId){
    const q=input.value.trim().toLowerCase();
    const results=document.getElementById(addId+'-results');
    if(!q||q.length<2){results.style.display='none';return;}
    const existing=new Set(recs.map(r=>r.n));
    const hits=S.filter(s=>!existing.has(s.n)&&(s.n.toLowerCase().includes(q)||s.tag.toLowerCase().includes(q))).slice(0,8);
    if(!hits.length){results.innerHTML='<div style="padding:8px 10px;font-size:10px;color:var(--color-text-tertiary)">No matches found</div>';results.style.display='block';return;}
    results.innerHTML=hits.map(s=>{
      const sc=calcScore(s);
      return`<div class="plan-search-item" onclick="planAddSupp('${s.n.replace(/'/g,"\\'")}','${addId}')"><b>${s.n}</b> <span style="color:var(--color-text-tertiary);font-size:10px">${s.tag} · Score: ${sc}</span></div>`;
    }).join('');
    results.style.display='block';
  };
  window.planAddSupp=function(name,addId){
    const sup=S.find(x=>x.n===name);if(!sup)return;
    const t=getTimingLabel({n:name});
    const item={name:name,dose:sup.dose,time:t?.time||'Daytime'};
    // Add to DOM
    const addRow=document.getElementById(addId);
    const section=addRow.closest('div[style*="padding:12px"]');
    const lastItem=addRow.previousElementSibling;
    const newHtml=renderItem(item);
    // Insert before the add row
    const wrapper=document.createElement('div');wrapper.innerHTML=newHtml;
    if(lastItem.classList?.contains('plan-add-row')){section.insertBefore(wrapper.firstChild,lastItem);}
    else{addRow.parentElement.insertBefore(wrapper.firstChild,addRow.previousElementSibling);}
    // Reset search
    addRow.querySelector('input').value='';
    document.getElementById(addId+'-results').style.display='none';
    addRow.style.display='none';
    // Save to localStorage
    const added=JSON.parse(localStorage.getItem('ss-added-supps')||'[]');
    if(!added.includes(name)){added.push(name);localStorage.setItem('ss-added-supps',JSON.stringify(added));}
  };

  const mkC=r=>{const sup=S.find(x=>x.n===r.n);return sup?renderCard(sup,''):renderRecCard(r,mi);};
  renderPriSection('ess',recs.filter(x=>x.p==='essential'),mkC);
  renderPriSection('rec',recs.filter(x=>x.p==='recommended'),mkC);
  renderPriSection('con',recs.filter(x=>x.p==='consider'),mkC);

  document.getElementById('v-input').style.display='none';
  document.getElementById('v-res').style.display='block';
  saveProfile();
  // Auto-download PDF
  setTimeout(()=>{try{downloadPDF();}catch(e){console.warn('PDF generation failed:',e);}},500);
  // Auto-send email if provided
  const profEmail=document.getElementById('prof-email')?.value?.trim();
  if(profEmail&&profEmail.includes('@')){document.getElementById('report-email').value=profEmail;sendEmailReport();}
}
function escHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function hl(t,q){if(!q)return t;const eq=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return t.replace(new RegExp(`(${eq})`,'gi'),'<mark>$1</mark>');}
function onSearch(q){q=q.trim();const clr=document.getElementById('gs-clr'),res=document.getElementById('gs-res'),mui=document.getElementById('main-ui');clr.classList.toggle('vis',q.length>0);if(!q){res.classList.remove('vis');mui.style.display='';return;}const ql=q.toLowerCase();const hits=S.filter(s=>[s.n,s.tag,s.desc,s.dose].some(x=>x&&x.toLowerCase().includes(ql)));mui.style.display='none';res.classList.add('vis');const safeQ=escHtml(q);document.getElementById('gs-meta').innerHTML=hits.length?`<b>${hits.length}</b> supplement${hits.length!==1?'s':''} found for "<b>${safeQ}</b>"`:`No results for "<b>${safeQ}</b>"`;document.getElementById('gs-cards').innerHTML=hits.length?'<div class="scards">'+hits.map(s=>renderCard(s,'')).join('')+'</div>':'<div style="text-align:center;padding:2rem;color:var(--color-text-tertiary);font-size:13px">Try a different name, ingredient, or health goal.</div>';}
function clearSearch(){const i=document.getElementById('gs-inp');i.value='';onSearch('');}
let acIdx=-1;
function showAc(q){const ac=document.getElementById('gs-ac');if(!q||q.length<2){ac.classList.remove('vis');acIdx=-1;return;}const ql=q.toLowerCase();const hits=S.filter(s=>s.n.toLowerCase().includes(ql)).slice(0,8);if(!hits.length){ac.classList.remove('vis');acIdx=-1;return;}ac.innerHTML=hits.map((s,i)=>`<div class="gs-ac-item${i===acIdx?' active':''}" onmousedown="pickAc('${s.n.replace(/'/g,"\\'")}')"><span>${s.n}</span><span class="gs-ac-tag">${s.tag.split(' · ')[0]}</span></div>`).join('');ac.classList.add('vis');}
function pickAc(name){const inp=document.getElementById('gs-inp');inp.value=name;document.getElementById('gs-ac').classList.remove('vis');acIdx=-1;onSearch(name);}
function hideAc(){setTimeout(()=>document.getElementById('gs-ac').classList.remove('vis'),150);}
const _gsInp=document.getElementById('gs-inp');
_gsInp.addEventListener('input',e=>{const v=e.target.value;showAc(v.trim());});
_gsInp.addEventListener('blur',hideAc);
_gsInp.addEventListener('keydown',e=>{const ac=document.getElementById('gs-ac');const items=ac.classList.contains('vis')?ac.querySelectorAll('.gs-ac-item'):[];if(e.key==='ArrowDown'&&items.length){e.preventDefault();acIdx=Math.min(acIdx+1,items.length-1);items.forEach((it,i)=>it.classList.toggle('active',i===acIdx));}else if(e.key==='ArrowUp'&&items.length){e.preventDefault();acIdx=Math.max(acIdx-1,0);items.forEach((it,i)=>it.classList.toggle('active',i===acIdx));}else if(e.key==='Enter'){e.preventDefault();if(acIdx>=0&&items[acIdx]){pickAc(items[acIdx].querySelector('span').textContent);}else{ac.classList.remove('vis');onSearch(e.target.value);}}else if(e.key==='Escape'){ac.classList.remove('vis');acIdx=-1;}});
let af='az';
function match(s,q){if(!q)return true;const l=q.toLowerCase();return[s.n,s.tag,s.desc,s.dose].some(x=>x&&x.toLowerCase().includes(l));}
function toggleCard(btn){const wrap=btn.previousElementSibling;const chv=btn.querySelector('.sc-toggle-chv');const isOpen=wrap.classList.toggle('open');chv.classList.toggle('open');btn.querySelector('span:first-child').textContent=isOpen?'Less':'More';const preview=btn.closest('.sc-inner').querySelector('.sc-desc-preview');if(preview)preview.style.display=isOpen?'none':'';}
// Build reverse interaction map: supplement name -> [{med, type}]
const INTERACT_MAP={};Object.entries(MEDS).forEach(([k,m])=>{m.avoid.forEach(n=>{if(!INTERACT_MAP[n])INTERACT_MAP[n]=[];INTERACT_MAP[n].push({med:m.label,type:'avoid'});});m.caution.forEach(n=>{if(!INTERACT_MAP[n])INTERACT_MAP[n]=[];INTERACT_MAP[n].push({med:m.label,type:'caution'});});});
function interactHtml(name){const ints=INTERACT_MAP[name];if(!ints||!ints.length)return'<div class="sc-interact"><div class="sc-interact-title">Medication interactions</div><div class="sc-interact-safe">No known major interactions identified.</div></div>';return'<div class="sc-interact"><div class="sc-interact-title">Medication interactions</div><div class="sc-interact-list">'+ints.map(i=>`<span class="sc-interact-pill${i.type==='avoid'?' danger':''}">${i.type==='avoid'?'Avoid with':'Caution with'}: ${i.med}</span>`).join('')+'</div></div>';}
function barClr(v){return v>=4?'var(--t1c)':v>=3?'var(--t2c)':v>=2?'var(--t3c)':'var(--t4c)';}
function bar(label,v){return`<div class="sc-bar-item"><div class="sc-bar-label">${label}</div><div class="sc-bar-track"><div class="sc-bar-fill" style="width:${v*20}%;background:${barClr(v)}"></div></div></div>`;}
function getColsPerRow(){const w=window.innerWidth;if(w<640)return 1;if(w<960)return 2;return 3;}
function loadMoreTier(btn,tierId){btn.classList.add('loading');btn.disabled=true;const sec=btn.closest('.tier-sec');setTimeout(()=>{const hidden=sec.querySelectorAll('.sc.tier-hidden');let shown=0;hidden.forEach(c=>{if(shown<10){c.classList.replace('tier-hidden','tier-visible');shown++;}});btn.classList.remove('loading');btn.disabled=false;const rem=sec.querySelectorAll('.sc.tier-hidden').length;if(!rem)btn.remove();else btn.querySelector('.tier-more-text').textContent=`Load more (${rem} remaining)`;},600);}
function calcScore(s){const rd=s.r||1,so=s.o||1,sco=s.c||1,sd=s.d||1;return Math.round(s.e*7+s.s*4+rd*3+so*2+sco*2+sd*2);}
var cycleInfo=function(s){if(s.cycle)return s.cycle;var n=s.n.toLowerCase(),t=s.t,tag=(s.tag||'').toLowerCase(),tips=(s.tips||'').toLowerCase(),dose=(s.dose||'').toLowerCase();if(t==='t4')return 'Do not take. This supplement has documented safety risks.';if(tips.includes('cycle')||dose.includes('cycle'))return tips.includes('cycle')?s.tips:s.dose;if(n.includes('ashwagandha'))return 'Cycle 8-12 weeks on, 2-4 weeks off. Long-term safety beyond 3 months not well established.';if(n.includes('rhodiola'))return 'Cycle 6-8 weeks on, 2-4 weeks off. Effectiveness may diminish with continuous use.';if(n.includes('vitamin')||n.includes('magnesium')||n.includes('zinc')||n.includes('calcium')||n.includes('iron')||n.includes('selenium')||n.includes('iodine')||n.includes('folate')||n.includes('b12'))return 'Safe for continuous daily use. No cycling needed. Retest blood levels annually if correcting a deficiency.';if(tag.includes('gut')&&(n.includes('lactobacillus')||n.includes('bifidobacterium')||n.includes('probiotic')||n.includes('saccharomyces')))return 'Safe for continuous daily use. No cycling needed. Benefits may diminish if stopped.';if(n.includes('creatine')||n.includes('whey')||n.includes('protein')||n.includes('eaa')||n.includes('glycine')||n.includes('taurine'))return 'Safe for continuous daily use. No cycling needed. Well-studied for long-term safety.';if(n.includes('omega')||n.includes('fish oil')||n.includes('krill')||n.includes('dha')||n.includes('epa'))return 'Safe for continuous daily use. No cycling needed. Benefits reverse if stopped.';if(n.includes('melatonin'))return 'Use situationally, not nightly long-term. Best for jet lag or short-term sleep reset (2-4 weeks).';if(tag.includes('adaptogen')||n.includes('ginseng')||n.includes('eleuthero')||n.includes('schisandra'))return 'Cycle 6-8 weeks on, 2-4 weeks off. Not recommended for continuous long-term use.';if(n.includes('john')||n.includes('kava')||n.includes('valerian')||n.includes('black cohosh'))return 'Short-term use recommended (4-8 weeks). Consult a provider before extending.';if(tag.includes('fibre')||tag.includes('prebiotic')||n.includes('psyllium')||n.includes('inulin'))return 'Safe for continuous daily use. No cycling needed.';if(s.s>=4)return 'Generally safe for continuous use at recommended doses. No specific cycling protocol established.';if(s.s===3)return 'Use with caution long-term. Consider cycling 8-12 weeks on, 2-4 weeks off.';return 'Limited long-term safety data. Use for the shortest effective duration.';}
function eTier(s){const sc=calcScore(s);if(sc>=72)return 't1';if(sc>=60)return 't2';if(sc>=40)return 't3';return 't4';}
function first2(txt){const m=txt.match(/[^.!?]*[.!?]/g);if(!m||m.length<=2)return{preview:txt,rest:''};return{preview:m.slice(0,2).join(''),rest:m.slice(2).join('')};}
function interactBarScore(name){const ints=INTERACT_MAP[name];if(!ints||!ints.length)return 5;if(ints.some(i=>i.type==='avoid'))return 1;return 2;}
function renderCard(s,hidden){const rd=s.r||1,so=s.o||1,sco=s.c||1,sd=interactBarScore(s.n),sc=calcScore(s),scCls=sc>=80?'score-high':sc>=60?'score-mid':sc>=40?'score-low':'score-bad';const ints=INTERACT_MAP[s.n];const hasInts=ints&&ints.length;const intPills=hasInts?ints.map(i=>`<span style="font-size:9px;padding:1px 5px;border-radius:8px;background:${i.type==='avoid'?'var(--t4bg)':'var(--t3bg)'};color:${i.type==='avoid'?'var(--t4tx)':'var(--t3tx)'}">${i.type==='avoid'?'Avoid':'Caution'}: ${i.med.split(' ')[0]}</span>`).join(''):'';const et=eTier(s);return`<div class="sc${hidden}" data-tier="${et}" onclick="const b=this.querySelector('.sc-toggle');if(b)toggleCard(b);"><div class="sc-score-side ${scCls}"><div class="sc-score-num">${sc}</div><div class="sc-score-label">Score</div></div><div class="sc-inner"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px"><div style="font-size:14px;font-weight:600;color:var(--color-text-primary)">${s.n}</div><div style="display:flex;gap:4px;flex-shrink:0">${s.tag.split(' · ').slice(0,3).map(t=>'<span style="font-size:9px;padding:2px 6px;border-radius:8px;background:'+TM[et].bg+';color:'+TM[et].tx+'">'+t.trim()+'</span>').join('')}</div></div><div style="display:flex;gap:8px;margin:4px 0 6px;font-size:10px;color:var(--color-text-tertiary);flex-wrap:wrap"><span>Efficacy: <b style="color:${barClr(s.e)}">${s.e}/5</b></span><span>Safety: <b style="color:${barClr(s.s)}">${s.s}/5</b></span><span>Research: <b style="color:${barClr(rd)}">${rd}/5</b></span><span>Onset: <b style="color:var(--color-text-secondary)">${OL_SHORT[so]||'Varies'}</b></span></div>${hasInts?'<div style="display:flex;gap:5px;flex-wrap:wrap;font-size:10px;margin-bottom:6px">'+intPills+'</div>':''}<div class="sc-desc-preview" style="font-size:11px;color:var(--color-text-secondary);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${s.desc}</div><div class="sc-expand"><div class="sc-onset-info" style="flex-direction:column;align-items:flex-start;gap:2px"><span class="sc-onset-label">Dose</span><span style="font-size:11px;color:var(--color-text-secondary);line-height:1.5">${s.dose}</span></div>${s.tips?`<div class="sc-onset-info" style="flex-direction:column;align-items:flex-start;gap:2px"><span class="sc-onset-label">How to take</span><span style="font-size:11px;color:var(--color-text-secondary);line-height:1.5">${s.tips}</span></div>`:''}<div class="sc-onset-info" style="flex-direction:column;align-items:flex-start;gap:2px"><span class="sc-onset-label">Cycling &amp; Duration</span><span style="font-size:11px;color:var(--color-text-secondary);line-height:1.5">${s.cycle||(function(s){var n=s.n.toLowerCase(),t=s.t,tag=(s.tag||'').toLowerCase();if(t==='t4')return 'Do not take.';if(n.includes('ashwagandha'))return 'Cycle 8-12 weeks on, 2-4 weeks off.';if(n.includes('rhodiola'))return 'Cycle 6-8 weeks on, 2-4 weeks off.';if(n.includes('vitamin')||n.includes('magnesium')||n.includes('zinc')||n.includes('calcium')||n.includes('iron')||n.includes('folate')||n.includes('b12'))return 'Safe for continuous daily use. No cycling needed.';if(n.includes('creatine')||n.includes('whey')||n.includes('protein')||n.includes('omega')||n.includes('fish')||n.includes('eaa')||n.includes('glycine')||n.includes('taurine')||n.includes('fibre')||n.includes('psyllium'))return 'Safe for continuous daily use. No cycling needed.';if(n.includes('melatonin'))return 'Use situationally (2-4 weeks). Not for nightly long-term use.';if(tag.includes('adaptogen')||n.includes('ginseng'))return 'Cycle 6-8 weeks on, 2-4 weeks off.';if(n.includes('john')||n.includes('kava')||n.includes('black cohosh'))return 'Short-term use (4-8 weeks). Consult provider before extending.';if(s.s>=4)return 'Generally safe for continuous use at recommended doses.';if(s.s===3)return 'Consider cycling 8-12 weeks on, 2-4 weeks off.';return 'Limited long-term data. Use shortest effective duration.';})(s)}</span></div><div class="sc-onset-info" style="flex-direction:column;align-items:flex-start;gap:2px"><span class="sc-onset-label">Onset: ${OL_SHORT[so]||'Varies'}</span><span style="font-size:11px;color:var(--color-text-secondary);line-height:1.5">${so>=5?'Effects felt almost immediately after taking. Ideal for acute, time-sensitive use.':so>=4?'Noticeable effects within hours to a few days. Works relatively quickly compared to most supplements.':so>=3?'Typically takes 1 to 4 weeks of consistent daily use before benefits become noticeable. Be patient and stay consistent.':so>=2?'Requires 4 to 8 weeks of regular use to build up in your system. Do not expect immediate results.':'Very slow acting. May take 8 weeks or longer before any measurable benefit. Long-term commitment required.'}</span></div>${hasInts?`<div class="sc-interact"><div class="sc-interact-title">Medication Interactions</div><div style="font-size:11px;color:var(--color-text-secondary);margin-top:4px;line-height:1.5">${ints.map(i=>{const m=Object.entries(MEDS).find(([k,v])=>v.label===i.med);return m?'<b>'+i.med+':</b> '+m[1].note:'';}).filter(Boolean).join('<br>')}</div></div>`:''}<div class="sc-desc">${s.desc}</div></div><button type="button" class="sc-toggle" onclick="event.stopPropagation();toggleCard(this)"><span>More</span><svg class="sc-toggle-chv" width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>`;}
function renderAll(){const q=(document.getElementById('srch')||{}).value||'';const initShow=5;
if(af==='az'){let items=S.filter(s=>match(s,q)).sort((a,b)=>a.n.localeCompare(b.n));const groups={};items.forEach(s=>{const letter=s.n.charAt(0).toUpperCase().replace(/[^A-Z]/,'#');if(!groups[letter])groups[letter]=[];groups[letter].push(s);});let html='';Object.keys(groups).sort((a,b)=>a==='#'?-1:b==='#'?1:a.localeCompare(b)).forEach(letter=>{const grp=groups[letter];html+=`<div class="az-letter-heading">${letter} <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">${grp.length}</span></div><div class="tier-sec"><div class="scards">${grp.map(s=>renderCard(s,'')).join('')}</div></div>`;});document.getElementById('s-content').innerHTML=html;return;}
const tiers=af==='all'?TIERS:TIERS.filter(t=>t.id===af);let html='';tiers.forEach(t=>{const items=S.filter(s=>t.id==='t3'?(s.tr&&match(s,q)):(eTier(s)===t.id&&match(s,q))).sort((a,b)=>calcScore(b)-calcScore(a));if(!items.length)return;const hasMore=items.length>initShow&&!q;html+=`<div class="tier-sec"><div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=initShow?' tier-hidden':'')).join('')}</div>${hasMore?`<button type="button" class="tier-more" onclick="loadMoreTier(this,'${t.id}')"><span class="tier-more-spin"></span><span class="tier-more-text">Load more (${items.length-initShow} remaining)</span></button>`:''}</div>`;});document.getElementById('s-content').innerHTML=html||'<div class="empty">No supplements match your search.</div>';}
function setCatFilter(cat){if(!cat){af='az';renderAll();document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');document.querySelectorAll('.sfbtn')[0].className='sfbtn on-az';return;}af='cat';const q=(document.getElementById('srch')||{}).value||'';const cols=getColsPerRow();const rowLimit=cols*2;let items=S.filter(s=>s.tag.toLowerCase().includes(cat.toLowerCase())&&match(s,q));items.sort((a,b)=>calcScore(b)-calcScore(a));const hasMore=items.length>rowLimit&&!q;let html=`<div class="tier-sec"><div class="scards">${items.map((s,i)=>renderCard(s,hasMore&&i>=rowLimit?' tier-hidden':'')).join('')}</div>${hasMore?`<button type="button" class="tier-more" onclick="loadMoreTier(this,'cat')"><span class="tier-more-spin"></span><span class="tier-more-text">Load more (${items.length-rowLimit} remaining)</span></button>`:''}</div>`;document.getElementById('s-content').innerHTML=html||'<div class="empty">No supplements found for this category.</div>';document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+10:60;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
var _initialLoad=true;
function setFilter(id,el){const catSel=document.getElementById('cat-filter');if(catSel)catSel.value='';const azSel=document.getElementById('az-filter');if(azSel)azSel.value='';af=id;document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');if(el)el.className=`sfbtn on-${id}`;renderAll();if(_initialLoad){_initialLoad=false;return;}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
function setAzFilter(val){if(!val)return;document.querySelectorAll('.sfbtn').forEach(b=>b.className='sfbtn');const catSel=document.getElementById('cat-filter');if(catSel)catSel.value='';if(val==='all'){af='az';renderAll();}else{af='azpair';const letters=val.split('');const q=(document.getElementById('srch')||{}).value||'';let items=S.filter(s=>{const c=s.n.charAt(0).toUpperCase();return(c===letters[0]||c===letters[1])&&match(s,q);}).sort((a,b)=>a.n.localeCompare(b.n));const groups={};items.forEach(s=>{const l=s.n.charAt(0).toUpperCase();if(!groups[l])groups[l]=[];groups[l].push(s);});let html='';Object.keys(groups).sort().forEach(letter=>{const grp=groups[letter];html+=`<div class="az-letter-heading">${letter} <span style="font-size:12px;font-weight:400;color:var(--color-text-tertiary)">${grp.length}</span></div><div class="tier-sec"><div class="scards">${grp.map(s=>renderCard(s,'')).join('')}</div></div>`;});document.getElementById('s-content').innerHTML=html||'<div class="empty">No supplements found.</div>';}const content=document.getElementById('s-content');if(content){const stickyH=document.querySelector('.sticky-bar');const offset=stickyH?stickyH.offsetHeight+76:120;const top=content.getBoundingClientRect().top+window.pageYOffset-offset;window.scrollTo({top:top,behavior:'smooth'});}}
let _allTabInit=false;
const CATS=['Performance','Cognition','Sleep','Immunity','Cardiovascular','Joint','Mood','Gut','Metabolic','Inflammation','Skin','Bone','Energy','Hormonal','Neuropathy','Antioxidant','Weight','UTI','Migraine','Liver','Eye health','Pregnancy'];
const AZ_PAIRS=[['A','B'],['C','D'],['E','F'],['G','H'],['I','J'],['K','L'],['M','N'],['O','P'],['Q','R'],['S','T'],['U','V'],['W','X'],['Y','Z']];
function initAllTab(){if(_allTabInit)return;_allTabInit=true;const tierCounts=TIERS.map(t=>({...t,count:t.id==='t3'?S.filter(s=>s.tr).length:S.filter(s=>eTier(s)===t.id).length}));const azOpts=AZ_PAIRS.map(p=>{const count=S.filter(s=>{const c=s.n.charAt(0).toUpperCase();return c===p[0]||c===p[1];}).length;return`<option value="${p[0]}${p[1]}">${p[0]} & ${p[1]} (${count})</option>`;}).join('');const btnOrder=['t3','t1','t2','t4'];document.getElementById('sfbar-main').innerHTML=btnOrder.map(id=>{const t=tierCounts.find(x=>x.id===id);return`<button type="button" class="sfbtn" title="${t.desc}" onclick="setFilter('${t.id}',this)">${t.badge} <span style="font-size:9px;opacity:.7;margin-left:2px">${t.count}</span></button>`;}).join('')+`<select id="az-filter" onchange="setAzFilter(this.value)" style="padding:6px 10px;border-radius:8px;border:1px solid var(--color-border-secondary);font-size:12px;font-family:inherit;background:var(--color-background-secondary);color:var(--color-text-secondary);cursor:pointer;outline:none"><option value="">A–Z...</option><option value="all">All A–Z (${S.length})</option>${azOpts}</select>`+`<select id="cat-filter" onchange="setCatFilter(this.value)" style="padding:6px 10px;border-radius:8px;border:1px solid var(--color-border-secondary);font-size:12px;font-family:inherit;background:var(--color-background-secondary);color:var(--color-text-secondary);cursor:pointer;outline:none"><option value="">Category...</option>${CATS.map(c=>'<option value="'+c+'">'+c+'</option>').join('')}</select>`;setFilter('t3',document.querySelector('.sfbtn'));}
function sw(n){document.getElementById('p1').style.display=n===1?'block':'none';document.getElementById('p2').style.display=n===2?'block':'none';const tb1=document.getElementById('tb1'),tb2=document.getElementById('tb2');tb1.classList.toggle('active',n===1);tb1.setAttribute('aria-selected',n===1);tb2.classList.toggle('active',n===2);tb2.setAttribute('aria-selected',n===2);if(n===2)initAllTab();}
let selectedConds=new Set();
function renderCondChips(){const el=document.getElementById('cond-chips');el.innerHTML=Object.entries(CONDITIONS).map(([k,c])=>`<div class="med-chip cond-chip ${selectedConds.has(k)?'on':''}" onclick="toggleCond('${k}')">${c.label}</div>`).join('');}
function toggleCond(k){selectedConds.has(k)?selectedConds.delete(k):selectedConds.add(k);renderCondChips();}
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
  endurance:{label:'Improve endurance',supps:['Creatine monohydrate','Dietary Nitrate / Beetroot','Beta-Alanine','Sodium bicarbonate (sports)','Rhodiola rosea']},
  joints:{label:'Joint support',supps:['Boswellia serrata','Collagen peptides','Curcumin (bioavailable form)','Omega-3 (EPA/DHA)']},
  hair:{label:'Hair & nails',supps:['Collagen peptides','Biotin (low-dose, deficiency)','Iron','Zinc']},
  heart:{label:'Heart health',supps:['Omega-3 (EPA/DHA)','Vitamin K2 (MK-7)','CoQ10 (Ubiquinol)','Magnesium','Berberine']},
  mood:{label:'Improve mood',supps:['Saffron (Crocus sativus)','Omega-3 (EPA/DHA)','Vitamin D3','SAMe','Magnesium']}
};
let selectedGoals=new Set();
function renderGoalChips(){const el=document.getElementById('goal-chips');if(!el)return;el.innerHTML=Object.entries(GOALS).map(([k,g])=>`<div class="med-chip ${selectedGoals.has(k)?'on':''}" onclick="toggleGoal('${k}')">${g.label}</div>`).join('');}
function toggleGoal(k){selectedGoals.has(k)?selectedGoals.delete(k):selectedGoals.add(k);renderGoalChips();}
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
    heightFt:document.getElementById('prof-height-ft')?.value||'',heightIn:document.getElementById('prof-height-in')?.value||'',weight:document.getElementById('prof-weight')?.value||''};
  localStorage.setItem('ss-profile',JSON.stringify(profile));
}

/* ── PDF generation ── */
function generatePDF(){
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const pw=doc.internal.pageSize.getWidth();
  const margin=18;
  const tw=pw-margin*2;
  let y=20;

  function checkPage(needed){if(y+needed>275){doc.addPage();y=20;}}

  // Header
  doc.setFillColor(123,31,162);
  doc.rect(0,0,pw,28,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(18);doc.setFont(undefined,'bold');
  doc.text('SupplementScore',margin,14);
  doc.setFontSize(9);doc.setFont(undefined,'normal');
  doc.text('Evidence-Based Supplement Recommendations',margin,21);
  y=36;

  // Profile summary
  const age=document.getElementById('asl').value;
  const sexLabel=sex==='fp'?'Pregnant woman':sex==='m'?'Male':'Female';
  doc.setTextColor(60,60,60);
  doc.setFontSize(12);doc.setFont(undefined,'bold');
  doc.text('Your Profile',margin,y);y+=7;
  doc.setFontSize(10);doc.setFont(undefined,'normal');
  doc.text('Age: '+age+' | Sex: '+sexLabel,margin,y);y+=5;
  const ht=document.getElementById('prof-height-ft')?.value;
  const wt=document.getElementById('prof-weight')?.value;
  if(ht&&wt){doc.text('Height: '+ht+'\''+( document.getElementById('prof-height-in')?.value||'0')+'" | Weight: '+wt+' lbs',margin,y);y+=5;}
  if(selectedMeds.size){doc.text('Medications: '+[...selectedMeds].map(k=>MEDS[k]?.label||k).join(', '),margin,y,{maxWidth:tw});y+=5;}
  if(selectedConds.size){doc.text('Conditions: '+[...selectedConds].map(k=>CONDITIONS[k]?.label||k).join(', '),margin,y,{maxWidth:tw});y+=5;}
  if(selectedGoals.size){doc.text('Goals: '+[...selectedGoals].map(k=>GOALS[k]?.label||k).join(', '),margin,y,{maxWidth:tw});y+=5;}
  y+=4;

  // Draw line
  doc.setDrawColor(200,200,200);doc.line(margin,y,pw-margin,y);y+=8;

  // Recommendations
  function addSection(title,color,cards){
    if(!cards.length)return;
    checkPage(15);
    doc.setFontSize(12);doc.setFont(undefined,'bold');doc.setTextColor(color[0],color[1],color[2]);
    doc.text(title+' ('+cards.length+')',margin,y);y+=7;
    cards.forEach(card=>{
      checkPage(25);
      const name=card.querySelector('.rc-name')?.textContent||'';
      const why=card.querySelector('.rc-why')?.textContent||'';
      const dose=card.querySelector('.rc-dose')?.textContent||'';
      doc.setFontSize(10);doc.setFont(undefined,'bold');doc.setTextColor(30,30,30);
      doc.text(name,margin,y);y+=5;
      doc.setFontSize(8);doc.setFont(undefined,'normal');doc.setTextColor(80,80,80);
      const whyLines=doc.splitTextToSize(why,tw);
      doc.text(whyLines,margin,y);y+=whyLines.length*3.5+1;
      doc.setTextColor(100,100,100);
      const doseLines=doc.splitTextToSize(dose,tw);
      doc.text(doseLines,margin,y);y+=doseLines.length*3.5+4;
    });
    y+=3;
  }

  addSection('Essential for your profile',[13,148,136],Array.from(document.querySelectorAll('#ess-cards .rc')));
  addSection('Recommended',[75,123,229],Array.from(document.querySelectorAll('#rec-cards .rc')));
  addSection('Worth considering',[202,138,4],Array.from(document.querySelectorAll('#con-cards .rc')));

  // Footer
  checkPage(20);
  doc.setDrawColor(200,200,200);doc.line(margin,y,pw-margin,y);y+=6;
  doc.setFontSize(7);doc.setTextColor(150,150,150);doc.setFont(undefined,'normal');
  doc.text('Generated by SupplementScore.org | Not a substitute for medical advice | '+new Date().toLocaleDateString(),margin,y);y+=3;
  doc.text('Share link: '+getShareUrl(),margin,y);

  return doc;
}

function downloadPDF(){
  const doc=generatePDF();
  const age=document.getElementById('asl').value;
  doc.save('SupplementScore-'+age+'yo-recommendations.pdf');
}

function loadProfile(){
  try{
    const saved=localStorage.getItem('ss-profile');
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
    calcBMI();
    return true;
  }catch(e){return false;}
}
function clearProfile(){
  localStorage.removeItem('ss-profile');
  document.getElementById('asl').value=35;updAge(35);
  sex=null;document.getElementById('bm').className='sx-btn';document.getElementById('bf').className='sx-btn';document.getElementById('bp').className='sx-btn';
  selectedMeds=new Set();renderMedChips();
  selectedConds=new Set();renderCondChips();
  selectedGoals=new Set();renderGoalChips();
  ['prof-height-ft','prof-height-in','prof-weight'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
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
  summary+='\n--- Essential ---\n';
  document.querySelectorAll('#ess-cards .rc-name').forEach(el=>{summary+=el.textContent+'\n';});
  summary+='\n--- Recommended ---\n';
  document.querySelectorAll('#rec-cards .rc-name').forEach(el=>{summary+=el.textContent+'\n';});
  summary+='\n--- Worth Considering ---\n';
  document.querySelectorAll('#con-cards .rc-name').forEach(el=>{summary+=el.textContent+'\n';});
  summary+='\nView full details: '+getShareUrl()+'\n';
  summary+='\nGenerated by SupplementScore.org';
  fetch('https://formspree.io/f/mnjoylkz',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,subject:'Your SupplementScore Recommendations',message:summary,source:'email-report',date:new Date().toISOString()})}).then(r=>{
    if(r.ok){btn.textContent='Sent!';setTimeout(()=>{document.getElementById('email-report-box').style.display='none';btn.textContent='Send';btn.disabled=false;},2000);}
    else{btn.textContent='Try again';btn.disabled=false;}
  }).catch(()=>{btn.textContent='Try again';btn.disabled=false;});
}

/* ── Init: load profile from URL or localStorage ── */
renderMedChips();
renderCondChips();
renderGoalChips();
['prof-height-ft','prof-height-in','prof-weight'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',calcBMI);});
initAllTab();

(function(){
  if(loadFromUrl()){
    // URL params present — switch to profile tab and auto-generate
    sw(1);genRecs();
    window.history.replaceState({},'',window.location.pathname);
  }else if(loadProfile()){
    // Saved profile — show welcome back bar without hiding supplement list
    const wb=document.getElementById('welcome-back');if(wb)wb.style.display='flex';
  }
})();

/* Ensure SVG title attributes show as native tooltips */
document.querySelectorAll('svg.logo-icon[title]').forEach(function(svg){
  var wrapper=document.createElement('span');
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
    document.getElementById('p1').style.display='block';
    document.getElementById('p2').style.display='none';
    document.getElementById('main-sticky')&&(document.getElementById('main-sticky').style.display='none');
    // Hide header and stats on profile page
    const hdr=document.querySelector('.page-header');if(hdr)hdr.style.display='none';
    const evCard=document.querySelector('.ev-card');if(evCard)evCard.style.display='none';
  }else if(tab==='supplements'){
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

/* Keyboard accessibility for supplement cards */
document.addEventListener('keydown',function(e){
  if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('sc')){
    e.preventDefault();
    const btn=e.target.querySelector('.sc-toggle');
    if(btn)toggleCard(btn);
  }
});
