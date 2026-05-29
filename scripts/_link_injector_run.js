#!/usr/bin/env node
/* weekly-internal-link-injector — single-run helper (2026-05-29).
   Wraps first unlinked supplement mention in each /a/ article with <a href="../s/{slug}.html">.
   Respects ar-content scope; never touches <a>, h1-h3, <ol> (Sources), titles/meta. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..');
const A_DIR = path.join(REPO, 'a');
const S_DIR = path.join(REPO, 's');
// Canonical action-queues live at the WORKSPACE root reviews/ (one level above the
// repo), where weekly-internal-link-audit writes the fresh queue. (A stale copy also
// exists under supplementscore-repo/reviews/ — do not use it.)
const QUEUE = path.join(REPO, '..', 'reviews/action-queues/internal-link-injection-targets.json');
const CAP = 120;
const STAMP = new Date().toISOString().replace(/[:.]/g, '').replace('T', 'T').replace(/Z$/, 'Z'); // utc stamp
const BAK_SUFFIX = '.bak-' + new Date().toISOString().slice(0,10) + 'T' +
  new Date().toISOString().slice(11,19).replace(/:/g,'') + 'Z';

// ---- slugify (matches search-index.js) ----
function slugify(s){
  return String(s==null?'':s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'')
    .replace(/[^\w\s-]/g,' ').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
const exists = slug => fs.existsSync(path.join(S_DIR, slug + '.html'));

// ---- load data.js ----
let src = fs.readFileSync(path.join(REPO,'data.js'),'utf8') + '\n;this.__S=S;';
const ctx={}; vm.createContext(ctx); vm.runInContext(src,ctx);
const S = ctx.__S;

// ---- build term list: surface form -> slug (existing /s/ file only) ----
const termMap = new Map(); // term -> slug
for (const s of S){
  if(!s.n) continue;
  const canon = slugify(s.n);
  const shortName = String(s.n).replace(/\s*\([^)]*\)\s*/g,' ').trim();
  const shortSlug = slugify(shortName);
  let slug=null;
  if(exists(canon)) slug=canon; else if(exists(shortSlug)) slug=shortSlug;
  if(!slug) continue;
  const forms = new Set([s.n, shortName]);
  for(let term of forms){
    term = term.trim();
    if(!term) continue;
    // length / generic guard
    const compact = term.replace(/[^A-Za-z0-9]/g,'');
    if(compact.length < 3) continue;
    if(compact.length === 3){
      // only keep 3-char terms that are acronym-like (have uppercase or digit)
      if(!/[A-Z0-9]/.test(term)) continue;
    }
    if(!termMap.has(term)) termMap.set(term, slug);
  }
}
// sort terms longest first
const terms = [...termMap.keys()].sort((a,b)=> b.length - a.length || a.localeCompare(b));

function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
// precompile regexes
const termRe = new Map();
for(const t of terms){
  termRe.set(t, new RegExp('(?<![A-Za-z0-9])'+reEsc(t)+'(?![A-Za-z0-9])', t.replace(/[^A-Za-z0-9]/g,'').length===3 ? 'g' : 'gi'));
}

// ---- tokenizer: returns linkable text segments [{start,end}] over full html ----
function linkableSegments(html){
  const segs=[];
  let divDepth=0, arDepth=null, aDepth=0, hDepth=0, olDepth=0, scriptDepth=0;
  const tagRe=/<[^>]+>/g;
  let last=0, m;
  function pushText(s,e){
    if(e>s && arDepth!==null && aDepth===0 && hDepth===0 && olDepth===0 && scriptDepth===0){
      segs.push({start:s,end:e});
    }
  }
  while((m=tagRe.exec(html))){
    pushText(last, m.index);
    const tag=m[0];
    const nm=/^<\s*(\/?)\s*([a-zA-Z0-9]+)/.exec(tag);
    if(nm){
      const closing=nm[1]==='/';
      const name=nm[2].toLowerCase();
      const selfClose=/\/>\s*$/.test(tag);
      if(name==='div'){
        if(closing){ if(arDepth!==null && divDepth===arDepth) arDepth=null; divDepth--; }
        else if(!selfClose){ divDepth++; if(arDepth===null && /class\s*=\s*"[^"]*\bar-content\b/.test(tag)) arDepth=divDepth; }
      } else if(name==='a'){
        if(closing) aDepth=Math.max(0,aDepth-1); else if(!selfClose) aDepth++;
      } else if(name==='h1'||name==='h2'||name==='h3'){
        if(closing) hDepth=Math.max(0,hDepth-1); else if(!selfClose) hDepth++;
      } else if(name==='ol'){
        if(closing) olDepth=Math.max(0,olDepth-1); else if(!selfClose) olDepth++;
      } else if(name==='script'||name==='style'){
        if(closing) scriptDepth=Math.max(0,scriptDepth-1); else if(!selfClose) scriptDepth++;
      }
    }
    last=tagRe.lastIndex;
  }
  pushText(last, html.length);
  return segs;
}

// Return [start,end) of the FIRST ar-content div's inner content.
function arContentRange(html){
  let divDepth=0, arDepth=null, contentStart=null;
  const tagRe=/<[^>]+>/g; let m;
  while((m=tagRe.exec(html))){
    const tag=m[0];
    const nm=/^<\s*(\/?)\s*([a-zA-Z0-9]+)/.exec(tag); if(!nm) continue;
    const closing=nm[1]==='/'; const name=nm[2].toLowerCase();
    const selfClose=/\/>\s*$/.test(tag);
    if(name==='div'){
      if(closing){ if(arDepth!==null && divDepth===arDepth){ return {start:contentStart, end:m.index}; } divDepth--; }
      else if(!selfClose){ divDepth++; if(arDepth===null && /class\s*=\s*"[^"]*\bar-content\b/.test(tag)){ arDepth=divDepth; contentStart=tagRe.lastIndex; } }
    }
  }
  return arDepth!==null ? {start:contentStart, end:html.length} : null;
}

function alreadyLinkedSlugs(html){
  const set=new Set(); let m;
  const re1=/\/s\/([a-z0-9-]+)\.html/gi;            // legacy /s/ form
  const re2=/supplement\.html\?slug=([a-z0-9-]+)/gi; // live canonical form
  while((m=re1.exec(html))) set.add(m[1].toLowerCase());
  while((m=re2.exec(html))) set.add(m[1].toLowerCase());
  return set;
}

function processArticle(html){
  const segs=linkableSegments(html);
  if(!segs.length) return {html, links:[]};
  const arr=arContentRange(html);
  const linkedSlugs=alreadyLinkedSlugs(arr ? html.slice(arr.start,arr.end) : html);
  const usedSlugs=new Set();
  const insertions=[]; // {start,end,label,slug}
  for(const term of terms){
    const slug=termMap.get(term);
    if(usedSlugs.has(slug)||linkedSlugs.has(slug)) continue;
    const re=termRe.get(term);
    let found=null;
    for(const seg of segs){
      re.lastIndex=0;
      const text=html.slice(seg.start,seg.end);
      const mm=re.exec(text);
      if(mm){ found={start:seg.start+mm.index, end:seg.start+mm.index+mm[0].length, label:mm[0], slug}; break; }
    }
    if(found){
      // overlap check
      const overlap=insertions.some(i=> found.start<i.end && found.end>i.start);
      if(!overlap){ insertions.push(found); usedSlugs.add(slug); }
    }
  }
  if(!insertions.length) return {html, links:[]};
  insertions.sort((a,b)=>a.start-b.start);
  let out=html, links=[];
  for(let i=insertions.length-1;i>=0;i--){
    const ins=insertions[i];
    const repl='<a href="../supplement.html?slug='+ins.slug+'">'+ins.label+'</a>';
    out=out.slice(0,ins.start)+repl+out.slice(ins.end);
    links.push({slug:ins.slug,label:ins.label});
  }
  links.reverse();
  return {html:out, links};
}

// ---- build prioritized file list ----
const queue=JSON.parse(fs.readFileSync(QUEUE,'utf8'));
const prioRaw=(queue.missing_supplement_link_in_articles||[]);
const seen=new Set();
const ordered=[];
for(const rel of prioRaw){
  const base=rel.replace(/^a\//,'');
  if(seen.has(base)) continue; seen.add(base);
  ordered.push(base);
}
// remaining /a/ files. The queue (2026-05-22) is already well-linked; genuine
// unlinked mentions live in OTHER articles. To deliver value within the 120 cap,
// front-load non-queue articles that actually yield a link (cheap read-only
// pre-scan), then the rest alphabetically. Queue still has top priority.
const allA=fs.readdirSync(A_DIR).filter(f=>f.endsWith('.html')&&!f.includes('.bak'));
const remaining=allA.filter(f=>!seen.has(f));
const remWinners=[], remRest=[];
for(const f of remaining){
  const fp=path.join(A_DIR,f);
  const html=fs.readFileSync(fp,'utf8');
  if(!/class\s*=\s*"[^"]*\bar-content\b/.test(html)){ remRest.push(f); continue; }
  if(/href\s*=\s*"[^"]*</.test(html)){ remRest.push(f); continue; } // skip corrupt-source
  (processArticle(html).links.length ? remWinners : remRest).push(f);
}
for(const f of remWinners){ if(!seen.has(f)){seen.add(f);ordered.push(f);} }
for(const f of remRest){ if(!seen.has(f)){seen.add(f);ordered.push(f);} }

// ---- run ----
let processed=0, modified=0, totalLinks=0, queueProcessed=0;
const skipped=[]; const suppCounts={}; const sampleDiffs=[];
const isPrio = new Set(prioRaw.map(r=>r.replace(/^a\//,'')));

for(const f of ordered){
  if(processed>=CAP) break;
  const fp=path.join(A_DIR,f);
  if(!fs.existsSync(fp)){ skipped.push({file:f,reason:'queue entry file not found'}); continue; }
  const html=fs.readFileSync(fp,'utf8');
  if(!/class\s*=\s*"[^"]*\bar-content\b/.test(html)){ skipped.push({file:f,reason:'no .ar-content div'}); processed++; if(isPrio.has(f))queueProcessed++; continue; }
  // SAFETY: a prior run corrupted some files with an <a> nested inside an href value
  // (e.g. href="../s/myo-<a href=...>inositol</a>.html"). The tag tokenizer cannot
  // trust structure in such files, so skip them entirely and flag for human review.
  if(/href\s*=\s*"[^"]*</.test(html)){ skipped.push({file:f,reason:'malformed href in source (pre-existing corruption) — skipped, needs human review'}); processed++; if(isPrio.has(f))queueProcessed++; continue; }
  processed++; if(isPrio.has(f)) queueProcessed++;
  const {html:out, links}=processArticle(html);
  if(links.length && out!==html){
    if(!process.env.DRY){
      fs.writeFileSync(fp+BAK_SUFFIX, html);
      fs.writeFileSync(fp, out);
    }
    modified++; totalLinks+=links.length;
    for(const l of links){ suppCounts[l.slug]=(suppCounts[l.slug]||0)+1; }
    if(sampleDiffs.length<3){
      sampleDiffs.push({file:f, links:links.map(l=>l.label+' -> ../supplement.html?slug='+l.slug)});
    }
  }
}

const top10=Object.entries(suppCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
const report={
  date:new Date().toISOString().slice(0,10),
  terms:terms.length,
  processed, queueProcessed, modified, totalLinks,
  cap:CAP, queueSize:prioRaw.length,
  top10, sampleDiffs, skipped,
  bakSuffix:BAK_SUFFIX
};
fs.writeFileSync('/sessions/vigilant-determined-knuth/mnt/outputs/_injector_report.json', JSON.stringify(report,null,2));
console.log(JSON.stringify({processed,queueProcessed,modified,totalLinks,terms:terms.length,top10,skipped:skipped.length,sampleDiffs},null,2));
