const fs=require('fs');
const lib=require(__dirname+'/_inj_lib.js');
const REPO=__dirname+'/..';
const f='a/taurine-and-blood-pressure-what-the-prehypertension-trial-actually-found.html';
const html=fs.readFileSync(REPO+'/'+f,'utf8');
const segs=lib.linkableSegments(html);
const arr=lib.arContentRange(html);
const linked=lib.alreadyLinkedSlugs(html.slice(arr.start,arr.end));
const bodyText=segs.map(s=>html.slice(s.start,s.end)).join(' • ');
// find every term that appears in body linkable text
let hits=[];
for(const t of lib.terms){
  const slug=lib.termMap.get(t);
  const re=new RegExp('(?<![A-Za-z0-9])'+t.replace(/[.*+?^${}()|[\]\\\/-]/g,m=>'\\'+m)+'(?![A-Za-z0-9])', t.replace(/[^A-Za-z0-9]/g,'').length===3?'':'i');
  if(re.test(bodyText)) hits.push(t+' [slug='+slug+(linked.has(slug)?' ALREADY-LINKED':' UNLINKED')+']');
}
console.log('linkable body chars:',bodyText.length);
console.log('term hits in body ('+hits.length+'):');
console.log(hits.slice(0,40).join('\n'));
console.log('\n--- raw body text (first 1200 chars) ---');
console.log(bodyText.slice(0,1200));
