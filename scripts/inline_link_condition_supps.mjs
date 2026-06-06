#!/usr/bin/env node
/* Inline-link, in each condition page's body, the FIRST plain-text mention of
 * each supplement the page ALREADY lists in its SS-AUTOLINKS "Supplement
 * details" section. Safe by construction: only links supplements the page has
 * already vetted as recommended (never the avoid-list / interaction mentions),
 * first occurrence only, never inside an existing tag or <a>. Idempotent.
 * Usage: node scripts/inline_link_condition_supps.mjs [--apply] [file...]
 */
import fs from 'node:fs'; import path from 'node:path';
const apply = process.argv.includes('--apply');
const argFiles = process.argv.slice(2).filter(a=>!a.startsWith('--'));
const dir='condition';
const files = (argFiles.length?argFiles:fs.readdirSync(dir).filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>path.join(dir,f)));
let totalLinks=0, pagesChanged=0; const summary=[];
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  if(/http-equiv="refresh"/i.test(html)&&/noindex/i.test(html))continue; // tombstone
  const blockM=html.match(/<!--\s*SS-AUTOLINKS:start[\s\S]*?SS-AUTOLINKS:end\s*-->/i);
  if(!blockM)continue;
  // pairs from the Supplement details list (only supplement.html slugs)
  const pairs=[...blockM[0].matchAll(/<a[^>]*href="\.\.\/supplement\.html\?slug=([a-z0-9-]+)"[^>]*>([^<]+)<\/a>/g)]
    .map(m=>({slug:m[1], text:m[2].trim()}))
    .filter(p=>p.text.length>=4);
  if(!pairs.length)continue;
  const blockStart=html.indexOf(blockM[0]);
  // ONLY operate inside the rendered body: from <main ...> to the SS-AUTOLINKS
  // block. This excludes the entire <head> (JSON-LD, og/meta) so we can never
  // inject a link inside a <script type="application/ld+json"> "name" value
  // (which would corrupt the structured data — caught 2026-06-06).
  const mainStart=html.search(/<main\b/i);
  if(mainStart<0||mainStart>blockStart)continue;
  const pre=html.slice(0,mainStart);
  const region=html.slice(mainStart,blockStart);
  const tail=html.slice(blockStart);
  const tokens=region.split(/(<[^>]+>)/);
  // Idempotency: skip any supplement already linked in the BODY region.
  const done=new Set([...region.matchAll(/supplement\.html\?slug=([a-z0-9-]+)/g)].map(m=>m[1]));
  let inA=false, inSkip=false; let pageLinks=0; const linkedTerms=[];
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i];
    if(t.startsWith('<')){
      if(/^<a\b/i.test(t))inA=true; else if(/^<\/a>/i.test(t))inA=false;
      if(/^<(script|style)\b/i.test(t))inSkip=true; else if(/^<\/(script|style)>/i.test(t))inSkip=false;
      continue; }
    if(inA||inSkip||!t.trim())continue;
    for(const p of pairs){
      if(done.has(p.slug))continue;
      const idx=t.indexOf(p.text);
      if(idx<0)continue;
      // boundary check: char before is non-word, char after is non-word
      const before=t[idx-1]||' '; const after=t[idx+p.text.length]||' ';
      if(/[A-Za-z0-9]/.test(before))continue;
      if(/[A-Za-z0-9]/.test(after))continue;
      const rep='<a href="../supplement.html?slug='+p.slug+'">'+p.text+'</a>';
      tokens[i]=t.slice(0,idx)+rep+t.slice(idx+p.text.length);
      done.add(p.slug); pageLinks++; linkedTerms.push(p.text);
      break; // one replacement per text token pass to keep indices sane; loop continues to next token
    }
  }
  if(pageLinks){ const out=pre+tokens.join('')+tail;
    summary.push(path.basename(file)+': +'+pageLinks+' ('+linkedTerms.join(', ')+')');
    totalLinks+=pageLinks; pagesChanged++;
    if(apply)fs.writeFileSync(file,out); }
}
console.log((apply?'APPLIED':'DRY-RUN')+': '+totalLinks+' inline links across '+pagesChanged+' condition pages');
summary.slice(0,8).forEach(s=>console.log('  '+s));
