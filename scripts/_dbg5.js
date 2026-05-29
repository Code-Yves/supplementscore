const fs=require('fs');
const lib=require(__dirname+'/_inj_lib.js');
const REPO=__dirname+'/..';
const a=require(REPO+'/../reviews/action-queues/internal-link-injection-targets.json');
const list=a.missing_supplement_link_in_articles.map(r=>r.replace(/^a\//,''));
let need=0,missing=0,noar=0;const winners=[];
for(const rel of list){
  const fp=REPO+'/a/'+rel;
  if(!fs.existsSync(fp)){missing++;console.log('MISSING FILE:',rel);continue;}
  const html=fs.readFileSync(fp,'utf8');
  if(!/class\s*=\s*"[^"]*\bar-content\b/.test(html)){noar++;continue;}
  const links=lib.processArticle(html).links;
  if(links.length){need++;winners.push(rel+' -> '+links.map(l=>l.label+'>'+l.slug).join(', '));}
}
console.log('\ncanonical-25: still-need-links:',need,'| missing files:',missing,'| no ar-content:',noar);
winners.forEach(w=>console.log('  STILL UNLINKED:',w));
