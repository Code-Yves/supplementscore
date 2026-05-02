/* pdf-export.js
 * Extracted from app.js on 2026-05-01.
 * Defines the global generatePDF(mode) used by sendPlanEmail() in app.js.
 * Loaded statically alongside app.js — splitting just keeps each file under
 * 3,500 lines so they're easier to navigate and review.
 */

function generatePDF(mode){
  if(!window.jspdf)return null;
  const isSummaryOnly=(mode==='summary');
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const pw=doc.internal.pageSize.getWidth();
  const ph=doc.internal.pageSize.getHeight();
  const M=18;const TW=pw-M*2;
  // Brand palette — Supplement Score (navy + green on white).
  // Kept the original constant names so the rest of the renderer is untouched;
  // semantics: DARK=navy ink, GOLD=brand green accent, PUR=dark green kicker,
  // CREAM/WARM=white surfaces, RULE/TBRD=light gray hairlines, GRY=muted text.
  const DARK=[31,42,61];const GOLD=[139,195,74];const PUR=[107,143,42];
  const CREAM=[255,255,255];const WARM=[255,255,255];const RULE=[229,231,235];
  const ALT=[249,250,247];const TBRD=[229,231,235];const GRY=[107,114,128];
  let pageNum=1;
  // Data
  const recs=_allRecs();
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
  function sCol(sc){return sc>=80?GOLD:sc>=60?PUR:sc>=40?[140,150,150]:[180,185,185];}
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
  // Brand logo lockup — leaf badge (navy outline, green ascending bar chart, green growth
  // curve emerging from a gap in the lower-left of the leaf) + "Supplement Score" wordmark.
  // Traced from the source artwork: asymmetric elongated leaf with a pointed top-right tip,
  // soft right and left bulges, and a deliberate break in the outline where the stem exits.
  function drawBrandLogo(x,y,opts){
    opts=opts||{};
    const s=opts.scale||1;
    const layout=opts.layout||'stacked';
    const iconOnly=!!opts.iconOnly;
    const darkBg=!!opts.darkBg;
    const showTagline=opts.tagline!==false;
    const ink=darkBg?[255,255,255]:[31,42,61];
    const grn=[139,195,74];
    const W=14*s, H=18*s;
    // Helper: stroke a multi-segment cubic bezier from absolute coordinates.
    // segs is an array of [c1x,c1y, c2x,c2y, endX,endY] — all absolute mm.
    function bezPath(startX,startY,segs){
      const rels=[];let px=startX, py=startY;
      for(let i=0;i<segs.length;i++){
        const sg=segs[i];
        rels.push([sg[0]-px,sg[1]-py, sg[2]-px,sg[3]-py, sg[4]-px,sg[5]-py]);
        px=sg[4];py=sg[5];
      }
      doc.lines(rels,startX,startY,[1,1],'S',false);
    }
    doc.setDrawColor(ink[0],ink[1],ink[2]);
    doc.setLineWidth(Math.max(0.55,0.95*s));
    doc.setLineJoin('round');doc.setLineCap('round');
    // Path A — right side: top-tip → right shoulder → right peak → bottom-right close
    bezPath(x+W*0.58, y+H*0.03, [
      [x+W*0.94,y+H*0.07, x+W*1.02,y+H*0.34, x+W*0.94,y+H*0.50],
      [x+W*0.88,y+H*0.74, x+W*0.74,y+H*0.95, x+W*0.55,y+H*0.97]
    ]);
    // Path B — left side: a hair below the bottom-right close (this gap is where the stem exits) up to top-tip
    bezPath(x+W*0.22, y+H*0.86, [
      [x+W*0.06,y+H*0.78, x+W*-0.02,y+H*0.58, x+W*0.05,y+H*0.42],
      [x+W*0.10,y+H*0.20, x+W*0.30,y+H*0.05, x+W*0.58,y+H*0.03]
    ]);
    // === BARS — three vertical green rectangles, ascending right ===
    doc.setFillColor(grn[0],grn[1],grn[2]);
    const barBase=y+H*0.78;
    const barW=1.65*s, barGap=1.0*s;
    const heights=[4.5*s, 6.7*s, 8.7*s];
    const totalW=barW*3+barGap*2;
    const clusterCx=x+W*0.56;
    const firstX=clusterCx-totalW/2;
    for(let i=0;i<3;i++){
      const bx=firstX+i*(barW+barGap);
      doc.rect(bx, barBase-heights[i], barW, heights[i], 'F');
    }
    // === GROWTH CURVE — emerges from below-left of the leaf, sweeps up to base of the first bar ===
    doc.setDrawColor(grn[0],grn[1],grn[2]);
    doc.setLineWidth(Math.max(0.7,1.15*s));
    bezPath(x+W*0.02, y+H*1.03, [
      [x+W*0.10,y+H*0.99, x+W*0.20,y+H*0.92, firstX+barW*0.5, barBase]
    ]);
    // === WORDMARK ===
    if(!iconOnly){
      if(layout==='horizontal'){
        const wmX=x+W+3*s;
        const wmY=y+H*0.58+1.5*s;
        doc.setFont('helvetica','bold');
        doc.setFontSize(Math.max(8,12*s));
        doc.setTextColor(ink[0],ink[1],ink[2]);
        doc.text('Supplement ',wmX,wmY);
        const wSupp=doc.getTextWidth('Supplement ');
        doc.setTextColor(grn[0],grn[1],grn[2]);
        doc.text('Score',wmX+wSupp,wmY);
      } else {
        const wmY=y+H+6*s;
        const wmCx=x+W/2;
        doc.setFont('helvetica','bold');
        doc.setFontSize(11*s);
        const wSupp=doc.getTextWidth('Supplement ');
        const wScore=doc.getTextWidth('Score');
        const wTot=wSupp+wScore;
        doc.setTextColor(ink[0],ink[1],ink[2]);
        doc.text('Supplement ',wmCx-wTot/2,wmY);
        doc.setTextColor(grn[0],grn[1],grn[2]);
        doc.text('Score',wmCx-wTot/2+wSupp,wmY);
        if(showTagline){
          doc.setFont('helvetica','normal');
          doc.setFontSize(Math.max(5,5.5*s));
          doc.setTextColor(ink[0],ink[1],ink[2]);
          doc.text('KNOW WHAT WORKS.',wmCx,wmY+5*s,{align:'center'});
        }
      }
    }
    doc.setLineCap('butt');doc.setLineJoin('miter');
  }
  function footer(){
    doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,ph-12,pw-M,ph-12);
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
    doc.text('SUPPLEMENTSCORE.ORG',M,ph-7);
    doc.setFont('times','italic');doc.setFontSize(7.5);doc.text('Page '+pageNum+' / '+totalPages,pw/2,ph-7,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.text(monthYear.toUpperCase(),pw-M,ph-7,{align:'right'});
  }
  const totalPages=isSummaryOnly?1:(allItems.length+2+((typeof bloodWork!=='undefined'&&Object.keys(bloodWork).length>0)?1:0));
  const essN=allItems.filter(x=>x.r.p==='essential').length;
  const recN=allItems.filter(x=>x.r.p==='recommended').length;
  const conN=allItems.filter(x=>x.r.p==='consider').length;
  const intItems=allItems.filter(x=>x.hasMedInt);
  if(!isSummaryOnly){
  // ═══════════════════════════════════════
  // PAGE 1 — COVER
  // ═══════════════════════════════════════
  // Masthead
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,0,pw,15,'F');
  drawBrandLogo(M,3,{layout:'horizontal',scale:0.45,darkBg:true});
  doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('PERSONALISED  \u00B7  EVIDENCE-BASED  \u00B7  '+monthYear.toUpperCase(),pw-M,9,{align:'right'});
  // Hero — extends to y=131 so meta values (at y=117) sit on dark background before gold band
  doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,15,pw,116,'F');
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('PERSONALISED SUPPLEMENT REPORT',M,34);
  doc.setFont('times','normal');doc.setFontSize(46);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  doc.text('Your',M,56);doc.text('Optimal',M,72);doc.text('Protocol',M,88);
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
  // Next-up cue (single line, no faux contents box)
  cy+=2;
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('NEXT  \u00B7  PROTOCOL OVERVIEW, THEN '+allItems.length+' SUPPLEMENT DETAIL PAGES',M,cy+4);
  // Disclaimer band at the foot of the cover (replaces the standalone disclaimer page when there's no blood work)
  const dy=ph-30;
  doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,dy,pw-M,dy);
  doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('IMPORTANT',M,dy+6);
  doc.setFont('times','italic');doc.setFontSize(8);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
  doc.splitTextToSize('Informational only. Not medical advice. Consult a qualified healthcare provider before starting any supplement regimen, especially if you have medical conditions or take prescription medications.',TW).forEach((l,i)=>{doc.text(l,M,dy+11+i*4.2);});
  footer();
  } // end !isSummaryOnly (cover)
  // ═══════════════════════════════════════
  // PAGE — SUMMARY TABLE (page 2 in full guide, page 1 in summary card)
  // ═══════════════════════════════════════
  if(!isSummaryOnly){doc.addPage();pageNum++;}
  // Masthead — skipped in summary card for ink-friendly printing
  if(!isSummaryOnly){
    doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,0,pw,20,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    drawBrandLogo(M,4.5,{layout:'horizontal',scale:0.5,darkBg:true});
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.text('SECTION 01  \u00B7  SUMMARY OVERVIEW',pw-M,12,{align:'right'});
  } else {
    drawBrandLogo(M,5,{layout:'horizontal',scale:0.55});
  }
  let y=isSummaryOnly?23:28;
  // ── Display helpers (defined early so top-right interaction card can use them) ──
  // WinAnsi-safe text normalizer — jsPDF's built-in Helvetica/Times use WinAnsi
  // encoding. Most common unicode glyphs (ellipsis, en/em dash, smart quotes,
  // middle dot, ×) are in WinAnsi, but mathematical comparison operators and a
  // few other glyphs are NOT — jsPDF falls back in a way that disrupts kerning
  // (the "3 0 0  m g  e x t r a c t" letter-spacing artefact). Only replace the
  // codepoints that are actually outside WinAnsi.
  const _winAnsiSafe=(s)=>{
    if(!s)return s;
    return String(s)
      .replace(/\u2265/g,'>=')   // ≥ (not in WinAnsi)
      .replace(/\u2264/g,'<=')   // ≤ (not in WinAnsi)
      .replace(/\u2212/g,'-')    // unicode minus → hyphen
      .replace(/\u200B/g,'');    // zero-width space
  };
  // Compact display form of a supplement name for the "paired with …" label
  // and the interaction-notes card. Strips parentheticals and abbreviates a
  // few long canonical names so the reference fits without clipping.
  const _shortSuppName=(n)=>{
    if(!n)return '';
    const _aliases={
      'Vitamin K2 (MK-7)':'K2',
      'Vitamin D3':'D3',
      'Vitamin C (moderate dose)':'Vitamin C',
      'Vitamin E (mixed tocopherols)':'Vitamin E',
      'NAC (N-Acetyl Cysteine)':'NAC',
      'Omega-3 (EPA/DHA)':'Omega-3',
      'Curcumin (bioavailable form)':'Curcumin',
      'CoQ10 (Ubiquinol)':'CoQ10',
      'Ferrous bisglycinate (gentle iron)':'Iron',
      'Psyllium husk (Plantago ovata)':'Psyllium',
      'Tart cherry (Montmorency)':'Tart cherry',
      'EAAs (Essential amino acids)':'EAAs',
      'Boswellia serrata':'Boswellia',
      'Magnesium glycinate':'Magnesium',
      'Collagen peptides':'Collagen'
    };
    if(Object.prototype.hasOwnProperty.call(_aliases,n))return _aliases[n];
    let s=String(n).replace(/\([^)]*\)/g,'').trim().replace(/\s+/g,' ');
    if(s.length>14)s=s.substring(0,13).trim()+'\u2026';
    return s;
  };
  // ── INTERACTION NOTES data + render ──────────────────────────────────────
  // Surfaces the "why" behind every red ⚠ on the rows below — which supp × which med
  // and the clinical reason. The full guide draws this as a top-right floating card.
  // The summary card stashes the data here and renders a full-width panel below the
  // supplement list (so it never overlaps the title).
  let _summaryNotesData=null;
  {
    const _selMedLabels=new Set([...selectedMeds].map(k=>MEDS[k]?.label).filter(Boolean));
    const _hasSelMeds=selectedMeds.size>0;
    // ─ (1) MED × SUPP rows — ONLY when a med is actually ticked on the intake form ─
    const _medRows=[];const _medSeen=new Set();
    if(_hasSelMeds){
      allItems.forEach(item=>{
        (item.ints||[]).forEach(int=>{
          if(!_selMedLabels.has(int.med))return;
          const k=item.r.n+'|'+int.med;
          if(_medSeen.has(k))return;_medSeen.add(k);
          _medRows.push({a:item.r.n,b:int.med,type:int.type,kind:'med'});
        });
      });
    }
    // ─ (2) SUPP × SUPP rows — only when BOTH supps are in the recommendation list ─
    const _suppRows=[];const _suppSeen=new Set();
    const _selNames=allItems.map(x=>x.r.n);
    if(typeof getSuppCautionsIn==='function'){
      allItems.forEach(item=>{
        const hits=getSuppCautionsIn(item.r.n,_selNames);
        hits.forEach(h=>{
          // Dedup by unordered pair
          const pairKey=[item.r.n,h.with].sort().join('||');
          if(_suppSeen.has(pairKey))return;_suppSeen.add(pairKey);
          _suppRows.push({a:item.r.n,b:h.with,type:h.severity||'caution',reason:h.reason||'',kind:'supp'});
        });
      });
    }
    // Per-(supp,med) short "why" strings. Falls back to a generic reason if no entry.
    const _medReasonFor=(supp,med,type)=>{
      const key=supp+'||'+med;
      const map={
        'CoQ10 (Ubiquinol)||Statins (cholesterol)':'Statins deplete CoQ10 — pair them',
        'Berberine||Statins (cholesterol)':'Additive statin-like effect; watch LFTs',
        'Vitamin B12||Metformin':'Metformin reduces B12 absorption',
        'Berberine||Metformin':'Additive glucose lowering — hypoglycemia',
        'Vitamin B12||PPIs (omeprazole, lansoprazole)':'Long-term PPIs reduce B12 absorption',
        'Magnesium||PPIs (omeprazole, lansoprazole)':'Long-term PPIs deplete Mg',
        'Vitamin K2 (MK-7)||Warfarin / Blood thinners':'Directly antagonises warfarin — avoid',
        'Omega-3 (EPA/DHA)||Warfarin / Blood thinners':'Bleeding risk at high doses',
        'Curcumin (bioavailable form)||Warfarin / Blood thinners':'May raise bleeding risk',
        'Ginger (Zingiber officinale)||Warfarin / Blood thinners':'Mild antiplatelet — additive',
        'NAC (N-Acetyl Cysteine)||Warfarin / Blood thinners':'May mildly raise INR',
        'Iron||Levothyroxine / Thyroid meds':'Blocks thyroid absorption — space 4h',
        'Calcium||Levothyroxine / Thyroid meds':'Blocks thyroid absorption — space 4h',
        'Magnesium||Levothyroxine / Thyroid meds':'Blocks thyroid absorption — space 4h',
        'Iodine||Levothyroxine / Thyroid meds':'Adds iodine load — monitor TSH',
        'Selenium||Levothyroxine / Thyroid meds':'Alters thyroid hormone metabolism',
        'Iron||Antibiotics':'Chelation — space >=2h apart',
        'Calcium||Antibiotics':'Chelation — space >=2h apart',
        'Magnesium||Antibiotics':'Chelation — space >=2h apart',
        'Zinc||Antibiotics':'Chelation — space >=2h apart',
        'Ashwagandha (KSM-66)||Benzodiazepines (Xanax, Valium)':'Additive sedation',
        'L-Theanine||Benzodiazepines (Xanax, Valium)':'Additive sedation',
        'Magnesium||Benzodiazepines (Xanax, Valium)':'Additive sedation',
        'Melatonin||Benzodiazepines (Xanax, Valium)':'Additive sedation',
        'Melatonin||Prescription sleep aids (Ambien, trazodone)':'Additive sedation',
        'Ashwagandha (KSM-66)||Prescription sleep aids (Ambien, trazodone)':'Additive sedation',
        'L-Theanine||Prescription sleep aids (Ambien, trazodone)':'Additive sedation',
        'Glycine||Prescription sleep aids (Ambien, trazodone)':'Additive sedation',
        'Magnesium||Prescription sleep aids (Ambien, trazodone)':'Additive sedation',
        '5-HTP||SSRIs / SNRIs (antidepressants)':'Serotonin syndrome risk — avoid',
        "St. John's Wort||SSRIs / SNRIs (antidepressants)":'Serotonin syndrome — avoid',
        'Saffron (Crocus sativus)||SSRIs / SNRIs (antidepressants)':'Mild serotonergic effect',
        'Berberine||Diabetes meds (insulin / sulfonylurea)':'Additive glucose lowering',
        'Alpha-Lipoic Acid (ALA)||Diabetes meds (insulin / sulfonylurea)':'Additive glucose lowering',
        'Chromium picolinate||Diabetes meds (insulin / sulfonylurea)':'Additive glucose lowering',
        'Berberine||Blood pressure medication':'Additive BP lowering',
        'CoQ10 (Ubiquinol)||Blood pressure medication':'Mild additive BP lowering',
        'Taurine||Blood pressure medication':'Mild additive BP lowering',
        'Omega-3 (EPA/DHA)||NSAIDs (ibuprofen, naproxen)':'Additive bleeding risk',
        'NAC (N-Acetyl Cysteine)||Chemotherapy':'May blunt chemo — consult oncologist',
        'Curcumin (bioavailable form)||Chemotherapy':'Consult oncologist — antioxidant',
        'Omega-3 (EPA/DHA)||Chemotherapy':'Consult oncologist — antioxidant',
        'Calcium||Corticosteroids (prednisone)':'Steroid-induced bone loss — replete',
        'Vitamin D3||Corticosteroids (prednisone)':'Steroid-induced bone loss — replete',
        'Zinc||Corticosteroids (prednisone)':'Steroid-induced Zn depletion'
      };
      if(map[key])return map[key];
      return type==='avoid'?'Avoid combining — consult clinician':'Use with care — monitor';
    };
    // Sort: avoid before caution within each section
    const _sortBySev=(a,b)=>(a.type==='avoid'?0:1)-(b.type==='avoid'?0:1);
    _medRows.sort(_sortBySev);_suppRows.sort(_sortBySev);
    // Summary card: stash data and render the panel later (full-width, below the list).
    if(isSummaryOnly && (_medRows.length||_suppRows.length)){
      _summaryNotesData={medRows:_medRows.slice(),suppRows:_suppRows.slice(),medReasonFor:_medReasonFor};
    }
    // Full guide: keep the existing top-right floating card behaviour.
    if(!isSummaryOnly && (_medRows.length||_suppRows.length)){
      const boxW=78;
      const boxX=pw-M-boxW;
      const boxY=isSummaryOnly?14:22;
      const hdrH=5.8;
      const subHdrH=4.2;
      const rowH=4.4;
      const moreH=3.6;
      const padBottom=2.5;
      const sectionGap=1.2;
      // Budget: up to ~5 total rows across both sections. Favor meds, then supp-supp.
      const totalBudget=5;
      const medShow=Math.min(_medRows.length,Math.max(totalBudget-Math.min(_suppRows.length,2),_suppRows.length?3:totalBudget));
      const suppShow=Math.min(_suppRows.length,totalBudget-medShow);
      const medOver=_medRows.length-medShow;
      const suppOver=_suppRows.length-suppShow;
      // Compute height
      let boxH=hdrH+padBottom;
      if(medShow>0)boxH+=subHdrH+medShow*rowH+(medOver>0?moreH:0);
      if(suppShow>0)boxH+=(medShow>0?sectionGap:0)+subHdrH+suppShow*rowH+(suppOver>0?moreH:0);
      // Background — warm cream with amber hairline border
      doc.setFillColor(253,244,226);
      doc.setDrawColor(180,140,50);doc.setLineWidth(0.35);
      doc.roundedRect(boxX,boxY,boxW,boxH,1.8,1.8,'FD');
      // Main header
      doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(140,70,20);
      doc.text('INTERACTION NOTES',boxX+3,boxY+4);
      doc.setDrawColor(210,185,140);doc.setLineWidth(0.2);
      doc.line(boxX+3,boxY+hdrH-0.4,boxX+boxW-3,boxY+hdrH-0.4);
      // Row renderer
      const renderRow=(ry,rec,leftLabel,rightLabel)=>{
        const typeLbl=rec.type==='avoid'?'AVOID':'CAUTION';
        const typeCol=rec.type==='avoid'?[185,28,28]:[160,95,20];
        doc.setFont('helvetica','bold');doc.setFontSize(5.5);doc.setTextColor(typeCol[0],typeCol[1],typeCol[2]);
        doc.text(typeLbl,boxX+3,ry);
        const typeW=doc.getTextWidth(typeLbl);
        // Pair line
        doc.setFont('helvetica','bold');doc.setFontSize(6.2);doc.setTextColor(60,45,30);
        const pair=leftLabel+' + '+rightLabel;
        const pairMaxW=boxW-6-typeW-2.5;
        let pairTxt=pair;
        while(doc.getTextWidth(pairTxt)>pairMaxW && pairTxt.length>3){
          pairTxt=pairTxt.substring(0,pairTxt.length-1);
        }
        if(pairTxt!==pair)pairTxt=pairTxt.substring(0,pairTxt.length-1)+'\u2026';
        doc.text(pairTxt,boxX+3+typeW+2.5,ry);
        // Reason line
        const reason=_winAnsiSafe(rec.kind==='med'?_medReasonFor(rec.a,rec.b,rec.type):(rec.reason||'Space apart — see full guide'));
        doc.setFont('helvetica','normal');doc.setFontSize(5.8);doc.setTextColor(110,80,50);
        const reasonMaxW=boxW-6;
        let reasonTxt=reason;
        while(doc.getTextWidth(reasonTxt)>reasonMaxW && reasonTxt.length>3){
          reasonTxt=reasonTxt.substring(0,reasonTxt.length-1);
        }
        if(reasonTxt!==reason)reasonTxt=reasonTxt.substring(0,reasonTxt.length-1)+'\u2026';
        doc.text(reasonTxt,boxX+3,ry+2.1);
      };
      let ry=boxY+hdrH+1.6;
      // ── Section: With your meds ──
      if(medShow>0){
        doc.setFont('helvetica','bold');doc.setFontSize(5.5);doc.setTextColor(130,95,45);
        doc.text('WITH YOUR MEDS',boxX+3,ry+1);
        ry+=subHdrH;
        _medRows.slice(0,medShow).forEach(n=>{
          const suppShort=_winAnsiSafe(_shortSuppName(n.a));
          const medShort=_winAnsiSafe(n.b).replace(/\s*\([^)]*\)\s*/g,' ').trim();
          renderRow(ry,n,suppShort,medShort);
          ry+=rowH;
        });
        if(medOver>0){
          doc.setFont('helvetica','italic');doc.setFontSize(5.5);doc.setTextColor(140,100,60);
          doc.text('+ '+medOver+' more — see full guide',boxX+3,ry+1.4);
          ry+=moreH;
        }
      }
      // ── Section: Within your stack ──
      if(suppShow>0){
        if(medShow>0)ry+=sectionGap;
        doc.setFont('helvetica','bold');doc.setFontSize(5.5);doc.setTextColor(130,95,45);
        doc.text('WITHIN YOUR STACK',boxX+3,ry+1);
        ry+=subHdrH;
        _suppRows.slice(0,suppShow).forEach(n=>{
          const aShort=_winAnsiSafe(_shortSuppName(n.a));
          const bShort=_winAnsiSafe(_shortSuppName(n.b));
          renderRow(ry,n,aShort,bShort);
          ry+=rowH;
        });
        if(suppOver>0){
          doc.setFont('helvetica','italic');doc.setFontSize(5.5);doc.setTextColor(140,100,60);
          doc.text('+ '+suppOver+' more — see full guide',boxX+3,ry+1.4);
        }
      }
    }
  }
  // "SUMMARY" label
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('SUMMARY',M,y);y+=8;
  // Title — two lines
  doc.setFont('times','normal');doc.setFontSize(22);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.text(allItems.length+' Supplements,',M,y);y+=9;
  doc.setFont('times','italic');doc.setFontSize(22);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('One Coherent Protocol',M,y);y+=5;
  doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,y,pw-M,y);y+=6;
  // Food-icon + warning drawing helpers
  const FOOD_COL={with:[139,195,74],away:[31,42,61]}; // brand: green for "with food", navy for "away"
  // Explicit, evidence-based overrides where the tips-keyword sniff is unreliable.
  // Keys are supplement names (must match r.n); value is the canonical foodCat.
  const _foodCatOverride={
    'Berberine':'with',                         // always with meals — blunts post-prandial glucose
    'Berberine HCl (sustained release)':'with',
    'Dihydroberberine (DHB)':'with',
    'Psyllium husk (Plantago ovata)':'any',     // psyllium itself: any timing. Separation from other supps handled in Full Guide
    'Psyllium husk (soluble fibre)':'any',
    'Iron':'away',                              // absorbs far better on an empty stomach
    'Ferrous bisglycinate (gentle iron)':'away',
    'NAC (N-Acetyl Cysteine)':'any',            // flexible — no strict food rule
    'Creatine monohydrate':'any',
    'Collagen peptides':'any',
    'Tart cherry (Montmorency)':'any',
    'EAAs (Essential amino acids)':'any',
    'Glycine':'any',
    'L-Theanine':'any',
    'Vitamin D3':'with',                        // fat-soluble — with a fatty meal
    'Vitamin K2 (MK-7)':'with',
    'Vitamin E (mixed tocopherols)':'with',
    'Omega-3 (EPA/DHA)':'with',
    'Curcumin (bioavailable form)':'with',
    'Boswellia serrata':'with',
    'CoQ10 (Ubiquinol)':'with',
    'Zinc':'with'                               // with food to reduce nausea
  };
  const _foodCat=(fh,name)=>{
    if(name && Object.prototype.hasOwnProperty.call(_foodCatOverride,name)){
      return _foodCatOverride[name];
    }
    if(!fh)return'any';
    const f=fh.toLowerCase();
    // "empty stomach" and "without food" collapsed into a single "away from food" category
    if(f.includes('empty')||f.includes('without food')||f.includes('fasted'))return'away';
    if(f.includes('food')||f.includes('fat')||f.includes('meal'))return'with';
    return'any';
  };
  const drawFoodIcon=(cx,cy,cat)=>{
    const r=2.2;
    if(cat==='any'){
      doc.setDrawColor(170,160,145);doc.setLineWidth(0.45);
      doc.circle(cx,cy,r,'S');
    } else {
      const c=FOOD_COL[cat];
      doc.setFillColor(c[0],c[1],c[2]);doc.circle(cx,cy,r,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(6);doc.setTextColor(255,255,255);
      // Use ASCII letters — jsPDF's built-in fonts don't support Unicode glyphs
      const ch=cat==='with'?'F':'A';
      doc.text(ch,cx,cy+1.05,{align:'center'});
    }
  };
  const drawWarnIcon=(cx,cy)=>{
    doc.setFillColor(254,226,226);
    doc.roundedRect(cx-2.2,cy-2.2,4.4,4.4,0.8,0.8,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(185,28,28);
    doc.text('!',cx,cy+1.1,{align:'center'});
  };
  // Small chain-link glyph to indicate "this row is paired with another supplement"
  const drawPairIcon=(cx,cy)=>{
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);doc.setLineWidth(0.55);
    // two interlocked ellipses — reads as a chain link at small size
    doc.ellipse(cx-1.1,cy,1.4,0.85,'S');
    doc.ellipse(cx+1.1,cy,1.4,0.85,'S');
  };
  // Legend bar (warm background with gold left bar)
  const legH=8.5;
  doc.setFillColor(WARM[0],WARM[1],WARM[2]);doc.rect(M,y,TW,legH,'F');
  doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(M,y,1.2,legH,'F');
  let lx=M+5;
  doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('FOOD',lx,y+5.5);lx+=doc.getTextWidth('FOOD')+3.5;
  const legItems=[['with','With food'],['away','Away from food'],['any','Doesn\u2019t matter']];
  legItems.forEach(([cat,lbl])=>{
    drawFoodIcon(lx+2,y+4.2,cat);
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
    doc.text(lbl,lx+5,y+5.5);
    lx+=5+doc.getTextWidth(lbl)+4.5;
  });
  // Separator between FOOD and INTERACTION sections
  doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.3);
  doc.line(lx-1.5,y+1.8,lx-1.5,y+legH-1.8);lx+=1.5;
  drawPairIcon(lx+2.2,y+4.2);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.text('Pair w/ \u2026',lx+5.5,y+5.5);
  lx+=5.5+doc.getTextWidth('Pair w/ \u2026')+4.5;
  doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.3);
  doc.line(lx-1.5,y+1.8,lx-1.5,y+legH-1.8);lx+=1.5;
  drawWarnIcon(lx+2,y+4.2);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
  doc.text('May interact',lx+5,y+5.5);
  y+=legH+5;
  // ── Build row order: within each timing group, away-from-food first (score desc), then others (score desc), then apply pair adjacency ──
  const _groupBy=(arr,keyFn)=>{const o={};arr.forEach(x=>{const k=keyFn(x);if(!o[k])o[k]=[];o[k].push(x);});return o;};
  const _timeGrp=(t)=>t==='Night'?'Night':(t==='Morning'?'Morning':'Daytime');
  const itemsWithCat=allItems.map(it=>({...it,foodCat:_foodCat(it.foodHint,it.r.n),timeGroup:_timeGrp(it.timing.time)}));
  const selNames=itemsWithCat.map(x=>x.r.n);
  // Pair-follow overrides — when a flexible-timing supp and its clinically-anchored pair
  // partner are both selected, move the flexible one into the partner's timing group so
  // they're taken together. This is the whole point of flagging pairs.
  // Format: [flexibleSupp, anchorSupp, targetGroup, foodHintOverride?]
  const _pairFollowRules=[
    // D3's "morning" placement is soft (cortisol/energy folklore); D3 is fat-soluble and stored.
    // If Mg glycinate is selected, co-locate D3 with Mg at night ("with dinner, fat").
    ['Vitamin D3','Magnesium glycinate','Night','With dinner (fatty meal)'],
    ['Vitamin D3','Magnesium L-threonate','Night','With dinner (fatty meal)'],
    ['Vitamin D3','Magnesium','Night','With dinner (fatty meal)'],
    // NAC: do NOT auto-relocate to Night. The Glycine pairing is a glutathione-synthesis
    // pairing (both contribute to the GSH pool over the day), not a co-timing requirement.
    // Keeping NAC in its natural slot also balances stack density when night is heavy.
    // Collagen is flexible; Vit C anchors morning (iron absorption). Move Collagen to morning.
    ['Collagen peptides','Vitamin C (moderate dose)','Morning',null],
    // Vit E piggybacks on Omega-3's morning fatty-meal window (same absorption requirement).
    ['Vitamin E (mixed tocopherols)','Omega-3 (EPA/DHA)','Morning',null],
    // Curcumin + Boswellia is a classic anti-inflammatory pair (synergistic joint/inflammation
    // support). Both need a meal containing fat for absorption — co-locate at Daytime (lunch)
    // so the user takes them together with the same fatty meal.
    ['Boswellia serrata','Curcumin (bioavailable form)','Daytime','With a meal containing fat'],
    ['Curcumin (bioavailable form)','Boswellia serrata','Daytime','With a meal containing fat']
  ];
  {
    const _selNameSet=new Set(selNames);
    _pairFollowRules.forEach(([flex,anchor,tgt,foodHintOverride])=>{
      if(!_selNameSet.has(flex)||!_selNameSet.has(anchor))return;
      itemsWithCat.forEach(it=>{
        if(it.r.n!==flex)return;
        it.timeGroup=tgt;
        if(it.timing)it.timing={...it.timing,time:tgt};
        if(foodHintOverride)it.foodHint=foodHintOverride;
      });
    });
  }
  const byGroup=_groupBy(itemsWithCat,x=>x.timeGroup);
  const groupOrder=['Morning','Daytime','Night'];
  const orderedByGroup={};
  groupOrder.forEach(gName=>{
    const items=byGroup[gName]||[];
    // sort: away-from-food first (strictest timing), then rest; each by score desc
    const away=items.filter(x=>x.foodCat==='away').sort((a,b)=>b.sc-a.sc);
    const rest=items.filter(x=>x.foodCat!=='away').sort((a,b)=>b.sc-a.sc);
    let ordered=[...away,...rest];
    // Apply pair adjacency — pull each item's partner right after it if both in this group
    const placed=new Set();const result=[];
    ordered.forEach(it=>{
      if(placed.has(it.r.n))return;
      result.push(it);placed.add(it.r.n);
      const partners=getPairPartners(it.r.n);
      partners.forEach(pn=>{
        if(placed.has(pn))return;
        const partner=ordered.find(x=>x.r.n===pn&&!placed.has(x.r.n));
        if(partner){result.push({...partner,_pairAnchor:it.r.n});placed.add(pn);}
      });
    });
    orderedByGroup[gName]=result;
  });
  // Cross-group pair annotation — if a supplement's partner is in the protocol but not
  // adjacent (e.g. Vitamin D3 in Morning pairs with Vitamin K2 (MK-7) in Daytime), surface
  // the partner with a "Pairs with …" label on the row, even across timing groups.
  {
    const _selSet=new Set(selNames);
    // Build a per-item lookup of which partner it is already adjacent-paired with (either
    // the row's own _pairAnchor, or the next row if this one IS the anchor).
    const _adjPartnerByName=new Map();
    groupOrder.forEach(gName=>{
      const arr=orderedByGroup[gName]||[];
      arr.forEach((it,i)=>{
        if(it._pairAnchor){
          _adjPartnerByName.set(it.r.n,it._pairAnchor);
          // Mark the anchor too so it doesn't also get a cross-group label for the same partner.
          if(!_adjPartnerByName.has(it._pairAnchor))_adjPartnerByName.set(it._pairAnchor,it.r.n);
        }
      });
    });
    groupOrder.forEach(gName=>{
      const arr=orderedByGroup[gName]||[];
      arr.forEach(it=>{
        if(it._pairAnchor)return; // already labelled by adjacent pair
        const adjPartner=_adjPartnerByName.get(it.r.n);
        const partners=getPairPartners(it.r.n).filter(pn=>_selSet.has(pn)&&pn!==adjPartner);
        if(partners.length){
          // Prefer a partner in a different timing group (more useful cue for the reader).
          const otherGroup=partners.find(pn=>{
            for(const g of groupOrder){
              if((orderedByGroup[g]||[]).some(x=>x.r.n===pn))return g!==gName;
            }
            return false;
          });
          it._remotePair=otherGroup||partners[0];
        }
      });
    });
  }
  // Row geometry
  const rH=7.5;                   // row height
  const iconX=M+4;                 // food icon center x
  const nameX=M+9;                 // supplement name start x
  const doseOffsetPad=2;           // px padding between name end and dose start
  const intRightX=pw-M-2;          // right edge for interaction text
  // Helper: does name pair bar need to extend top/bottom? computed as adjacent pairing
  const drawGroupBand=(label,count)=>{
    if(isSummaryOnly){
      // Print-friendly: small label + supplement count + thin hairline
      y+=3;
      doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
      doc.text(label.toUpperCase(),M,y);
      if(typeof count==='number'){
        doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
        doc.text(count+' supplement'+(count===1?'':'s'),pw-M,y,{align:'right'});
      }
      y+=1.6;
      doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.3);
      doc.line(M,y,pw-M,y);
      y+=2.8;
    } else {
      const bH=6;
      doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(M,y,TW,bH,'F');
      doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
      doc.text(label.toUpperCase(),M+3,y+4.2);
      y+=bH+1;
    }
  };
  // Pair-group bracket — draws a "[" with rounded-feel corners and a midline tick
  // along the left margin spanning the rows of an adjacent-pair block. Summary card only.
  const drawPairBracket=(y1,y2)=>{
    const bx=M-3.0;       // bracket vertical x — sits in the left margin
    const arm=1.6;         // length of the top/bottom horizontal arms
    const inset=1.8;       // top/bottom inset so tips align with icon centers
    const top=y1+inset;
    const bot=y2-inset;
    if(bot<=top)return;
    doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);doc.setLineWidth(0.5);
    doc.line(bx+arm,top,bx,top);
    doc.line(bx,top,bx,bot);
    doc.line(bx,bot,bx+arm,bot);
    // small inward tick at the midline (curly-brace cue)
    const my=(top+bot)/2;
    doc.line(bx-0.7,my,bx,my);
  };
  // Draw rows per group
  groupOrder.forEach(gName=>{
    const items=orderedByGroup[gName];
    if(!items||!items.length)return;
    drawGroupBand(gName,items.length);
    // Pre-compute which rows are part of a pair block (item i pairs with item i-1 or i+1)
    const isPairBlock=items.map((it,i)=>{
      const prev=items[i-1];const next=items[i+1];
      const partnersOf=getPairPartners(it.r.n);
      const prevPaired=prev&&partnersOf.includes(prev.r.n);
      const nextPaired=next&&partnersOf.includes(next.r.n);
      return prevPaired||nextPaired;
    });
    let rowIdx=0;
    let pairStartY=null; // tracks the top of the current adjacent-pair run (summary card only)
    items.forEach((item,i)=>{
      const inPair=isPairBlock[i];
      // Row background:
      //   • full guide → cream highlight + gold left bar across pair rows, zebra elsewhere
      //   • summary card → no fill on pair rows; we draw a green left bracket once the run ends
      if(!isSummaryOnly){
        if(inPair){
          doc.setFillColor(255,251,232);doc.rect(M,y,TW,rH,'F');
          // Gold left bar (3px wide) — only across paired rows
          doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);doc.rect(M,y,1.2,rH,'F');
        } else if(rowIdx%2===1){
          doc.setFillColor(ALT[0],ALT[1],ALT[2]);doc.rect(M,y,TW,rH,'F');
        }
      } else if(inPair && pairStartY===null){
        pairStartY=y;
      }
      // Food icon
      drawFoodIcon(iconX,y+rH/2,item.foodCat);
      // Name (WinAnsi-normalised)
      doc.setFont('times','normal');doc.setFontSize(10);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
      const nmRaw=_winAnsiSafe(item.r.n);
      const nm=nmRaw.length>42?nmRaw.substring(0,41)+'\u2026':nmRaw;
      doc.text(nm,nameX,y+rH/2+1.3);
      const nameW=doc.getTextWidth(nm);
      // Width-based truncation helper (used for both partner label and dose text)
      const truncToWidth=(txt,maxW)=>{
        if(doc.getTextWidth(txt)<=maxW)return txt;
        let t=txt;
        while(t.length>1 && doc.getTextWidth(t+'\u2026')>maxW)t=t.substring(0,t.length-1);
        return t+'\u2026';
      };
      // Chain-link glyph + compact "w/ <partner>" label when paired with another listed supplement
      const pairPartnerName=item._pairAnchor||item._remotePair;
      let afterNameX=nameX+nameW;
      if(pairPartnerName){
        drawPairIcon(afterNameX+3.5,y+rH/2);
        afterNameX+=6.2;
        // Partner name in muted gold so the pairing is legible at a glance
        const partnerShort=_winAnsiSafe(_shortSuppName(pairPartnerName));
        doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(150,115,40);
        // Budget: reserve space for dose (~24mm) and the right-side interaction icon
        const partnerMaxW=Math.max(8, intRightX - afterNameX - 24 - 7);
        const partnerFit=truncToWidth(partnerShort, partnerMaxW);
        doc.text(partnerFit, afterNameX+1.5, y+rH/2+1.1);
        afterNameX += 1.5 + doc.getTextWidth(partnerFit) + 2;
      }
      // Dose (beside name, grey) — width-based truncation so the full dose shows when space allows
      const sd=_winAnsiSafe(item.dose.split(';')[0].trim());
      doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(GRY[0],GRY[1],GRY[2]);
      const doseX=afterNameX+doseOffsetPad+1;
      // Reserve ~7mm at the right for the interaction warning icon
      const hasMedIntSel=(function(){
        const ints=item.ints||[];
        if(!ints.length)return false;
        const selectedMedLabels=new Set([...selectedMeds].map(k=>MEDS[k]?.label).filter(Boolean));
        return ints.some(it=>selectedMedLabels.has(it.med));
      })();
      const needsIntIcon=(item.ints||[]).length>0;
      const rightReserve=needsIntIcon?(hasMedIntSel&&!isSummaryOnly?14:7):0;
      const doseMaxW=Math.max(10,intRightX-doseX-rightReserve);
      const sdFit=truncToWidth(sd,doseMaxW);
      doc.text(sdFit,doseX,y+rH/2+1.1);
      const doseW=doc.getTextWidth(sdFit);
      let extraRight=doseX+doseW+3;
      // Supp-supp caution note (red) — FULL GUIDE ONLY. The Summary Card keeps rows quiet.
      if(!isSummaryOnly){
        const cau=getSuppCaution(item.r.n,selNames);
        if(cau){
          const cauLbl=_winAnsiSafe(cau.reason+' with '+cau.with);
          // Clip to the space actually available so nothing overflows the page margin
          const cauMaxW=Math.max(10,intRightX-extraRight-rightReserve-2);
          const cauShort=truncToWidth(cauLbl,cauMaxW-4);
          doc.setFont('helvetica','normal');doc.setFontSize(6.8);
          const cw=doc.getTextWidth(cauShort)+4;
          doc.setFillColor(253,228,228);doc.roundedRect(extraRight,y+rH/2-2.5,cw,4.6,1,1,'F');
          doc.setTextColor(138,42,42);doc.text(cauShort,extraRight+2,y+rH/2+0.9);
        }
      }
      // Medication interaction (right-aligned "!" icon, optional med label in full guide only)
      if(needsIntIcon){
        if(hasMedIntSel && !isSummaryOnly){
          const ints=item.ints||[];
          const selectedMedLabels=new Set([...selectedMeds].map(k=>MEDS[k]?.label).filter(Boolean));
          const hitSel=ints.filter(it=>selectedMedLabels.has(it.med));
          const medLblRaw=_winAnsiSafe(hitSel[0].med);
          const medLbl=medLblRaw.length>18?medLblRaw.substring(0,17)+'\u2026':medLblRaw;
          doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(185,28,28);
          const tw=doc.getTextWidth(medLbl);
          doc.text(medLbl,intRightX,y+rH/2+1.1,{align:'right'});
          drawWarnIcon(intRightX-tw-3,y+rH/2);
        } else {
          drawWarnIcon(intRightX-1.5,y+rH/2);
        }
      }
      // Bottom border
      doc.setDrawColor(TBRD[0],TBRD[1],TBRD[2]);doc.setLineWidth(0.15);doc.line(M,y+rH,pw-M,y+rH);
      y+=rH;rowIdx++;
      // Summary card: when a paired run ends, draw the bracket spanning the run.
      if(isSummaryOnly){
        const nextInPair=(i+1<items.length)&&isPairBlock[i+1];
        if(inPair && !nextInPair && pairStartY!==null){
          drawPairBracket(pairStartY,y);
          pairStartY=null;
        }
      }
    });
  });
  y+=8;
  // ── Bottom INTERACTION NOTES panel (summary card only) ───────────────────
  // Replaces the old top-right floating box that overlapped the title. Renders
  // a full-width tinted panel with a 2-column grid of caution/avoid items.
  if(isSummaryOnly && _summaryNotesData){
    const ntData=_summaryNotesData;
    const allItms=[
      ...ntData.medRows.map(r=>({...r,_kind:'med'})),
      ...ntData.suppRows.map(r=>({...r,_kind:'supp'}))
    ];
    if(allItms.length){
      const padX=4,padY=4,headerH=5,rowGap=4.4;
      const cols=2;
      const rowsCt=Math.ceil(allItms.length/cols);
      const boxH=headerH+padY+rowsCt*rowGap+padY*0.5;
      const boxX=M,boxY=y,boxW=TW;
      // Background — very light green tint with subtle green border
      doc.setFillColor(249,250,247);
      doc.setDrawColor(215,228,189);doc.setLineWidth(0.3);
      doc.roundedRect(boxX,boxY,boxW,boxH,1.8,1.8,'FD');
      // Header
      doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
      doc.text('INTERACTION NOTES — WITHIN YOUR STACK',boxX+padX,boxY+4.2);
      // 2-column grid of items
      const colW=(boxW-padX*2-3)/cols;
      const colX=[boxX+padX,boxX+padX+colW+3];
      allItms.forEach((rec,i)=>{
        const c=i%2;
        const r=Math.floor(i/2);
        const ix=colX[c];
        const iy=boxY+headerH+padY+(r*rowGap);
        // Tag pill (red — caution/avoid both critical)
        const tagLbl=rec.type==='avoid'?'AVOID':'CAUTION';
        doc.setFont('helvetica','bold');doc.setFontSize(5.2);
        const tw=doc.getTextWidth(tagLbl)+2.6;
        doc.setFillColor(185,28,28);
        doc.roundedRect(ix,iy-2.6,tw,3.5,0.5,0.5,'F');
        doc.setTextColor(255,255,255);
        doc.text(tagLbl,ix+1.3,iy);
        // Pair label
        const lab1=_winAnsiSafe(_shortSuppName(rec.a));
        const lab2=rec._kind==='med'
          ?_winAnsiSafe(rec.b).replace(/\s*\([^)]*\)\s*/g,' ').trim()
          :_winAnsiSafe(_shortSuppName(rec.b));
        doc.setFont('helvetica','normal');doc.setFontSize(6.2);doc.setTextColor(DARK[0],DARK[1],DARK[2]);
        const pairTxt=lab1+' + '+lab2;
        const pairMaxW=colW-tw-2;
        let pTxt=pairTxt;
        while(doc.getTextWidth(pTxt)>pairMaxW&&pTxt.length>3){
          pTxt=pTxt.substring(0,pTxt.length-1);
        }
        if(pTxt!==pairTxt)pTxt=pTxt.substring(0,pTxt.length-1)+'…';
        doc.text(pTxt,ix+tw+1.5,iy);
      });
      y=boxY+boxH+4;
    }
  }
  // Summary card stops here — nothing below the table, print-friendly
  if(isSummaryOnly){footer();return doc;}
  // Overall plan strength bar
  const avg=Math.round(allItems.reduce((s,x)=>s+x.sc,0)/Math.max(allItems.length,1));
  const strength=avg>=85?'Exceptional':avg>=75?'Excellent':avg>=65?'Good':'Fair';
  doc.setFillColor(PUR[0],PUR[1],PUR[2]);doc.rect(M,y,TW,20,'F');
  doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
  doc.text('OVERALL PLAN STRENGTH',M+5,y+6);
  doc.setFont('times','italic');doc.setFontSize(16);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
  doc.text(strength,M+5,y+16);
  doc.setFont('times','normal');doc.setFontSize(8);doc.setTextColor(220,235,210);
  doc.text(essN+' Essential  \u00B7  '+recN+' Recommended  \u00B7  '+conN+' Consider',pw-M-5,y+16,{align:'right'});
  // ── Scoring methodology section ─────────────────────────────────────────────
  let ky=y+28;
  doc.setDrawColor(RULE[0],RULE[1],RULE[2]);doc.setLineWidth(0.25);doc.line(M,ky,pw-M,ky);ky+=9;
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(PUR[0],PUR[1],PUR[2]);
  doc.text('HOW YOUR SUPPLEMENTS ARE SCORED',M,ky);ky+=7;
  doc.setFont('times','italic');doc.setFontSize(9.5);doc.setTextColor(80,80,80);
  doc.splitTextToSize('Each supplement receives a composite score from 0\u2013100 weighted across clinical efficacy, safety profile, and research depth. Scores reflect the current published evidence and are adjusted for your specific health profile.',TW).forEach(l=>{doc.text(l,M,ky);ky+=5;});ky+=8;
  const guide=[
    // Brand-aligned ramp: brand green for the strongest tier, then darker green, muted gray, light gray.
    {range:'80\u2013100',label:'Exceptional Evidence',col:GOLD,desc:'Multiple large RCTs, consistent meta-analyses, and validated mechanisms of action'},
    {range:'60\u201379',label:'Good Evidence',col:PUR,desc:'Several controlled trials and positive systematic reviews with reliable safety data'},
    {range:'40\u201359',label:'Moderate Evidence',col:[140,150,150],desc:'Small trials, observational studies, and promising mechanistic or in-vivo research'},
    {range:'0\u201339',label:'Limited / Emerging',col:[180,185,185],desc:'Anecdotal reports, in-vitro studies, or theoretical mechanisms requiring more research'},
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
    doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,4,pw,40,'F');
    drawBrandLogo(M,7,{layout:'horizontal',scale:0.4,darkBg:true});
    doc.setFont('helvetica','normal');doc.setFontSize(6.5);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.text('SUPPLEMENT  \u00B7  '+(idx+1).toString().padStart(2,'0')+' / '+allItems.length.toString().padStart(2,'0'),pw-M,12,{align:'right'});
    const tSz=r.n.length>32?22:r.n.length>24?28:32;
    doc.setFont('times','normal');doc.setFontSize(tSz);doc.setTextColor(CREAM[0],CREAM[1],CREAM[2]);
    doc.text(r.n,M,36);
    // (Removed the SCORE/TIER/TIME subtitle — it duplicated the score circle, tier badge, and side-rail timing.)
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
    // Tier badge — Essential = filled green, Recommended = green outline, Consider = gray outline
    const tierKind=item.r.p; // 'essential' | 'recommended' | 'consider'
    doc.setFont('helvetica','bold');doc.setFontSize(7.5);
    const ptL=item.priLabel.toUpperCase();const ptW=doc.getTextWidth(ptL)+8;
    if(tierKind==='essential'){
      doc.setFillColor(GOLD[0],GOLD[1],GOLD[2]);
      doc.rect(rx,ry,ptW,8,'F');
      doc.setTextColor(255,255,255);
    } else if(tierKind==='recommended'){
      doc.setDrawColor(GOLD[0],GOLD[1],GOLD[2]);doc.setLineWidth(0.6);
      doc.rect(rx,ry,ptW,8,'S');
      doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    } else {
      doc.setDrawColor(GRY[0],GRY[1],GRY[2]);doc.setLineWidth(0.5);
      doc.rect(rx,ry,ptW,8,'S');
      doc.setTextColor(GRY[0],GRY[1],GRY[2]);
    }
    doc.text(ptL,rx+4,ry+5.7);ry+=15;
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
      doc.setFillColor(252,235,235);doc.rect(rx,ry,rW,iH,'F');
      doc.setDrawColor(185,28,28);doc.setLineWidth(0.4);doc.rect(rx,ry,rW,iH,'S');
      doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(185,28,28);
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
    // (Removed the bottom 4-pill metrics row — Efficacy / Safety / Research Depth / Med. Interaction
    //  were all already shown in the score circle, side rail, tier badge, and med-interaction box above.)
    footer();
  });
  // ═══════════════════════════════════════
  // FINAL PAGE — BLOOD WORK (conditional)
  // ═══════════════════════════════════════
  // Only emit a clinical-notes page when there's actual biomarker data to show.
  // The disclaimer itself already lives on the cover, so we don't need a near-empty
  // standalone page just to repeat it.
  const hasBW=typeof bloodWork!=='undefined'&&Object.keys(bloodWork).length>0;
  if(hasBW){
    doc.addPage();pageNum++;
    doc.setFillColor(DARK[0],DARK[1],DARK[2]);doc.rect(0,0,pw,20,'F');
    drawBrandLogo(M,5,{layout:'horizontal',scale:0.45,darkBg:true});
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(GOLD[0],GOLD[1],GOLD[2]);
    doc.text('CLINICAL NOTES',pw-M,12,{align:'right'});
    let fy=32;
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
    });
    footer();
  }
  return doc;
}
