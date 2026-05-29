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
const QUEUE = path.join(REPO, 'reviews/action-queues/internal-link-injection-targets.json');
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


module.exports={linkableSegments,arContentRange,alreadyLinkedSlugs,terms,termMap,processArticle};
