const fs=require('fs');
const lib=require(__dirname+'/_inj_lib.js');
const REPO=__dirname+'/..';
const A=REPO+'/a';
const files=fs.readdirSync(A).filter(f=>f.endsWith('.html')&&!f.includes('.bak'));
let wouldModify=0, totalLinks=0, noAr=0; const winners=[];
for(const f of files){
  const html=fs.readFileSync(A+'/'+f,'utf8');
  if(!/class\s*=\s*"[^"]*\bar-content\b/.test(html)){noAr++;continue;}
  const links=lib.processArticle(html).links;
  if(links.length){wouldModify++;totalLinks+=links.length; if(winners.length<25) winners.push(f+'  ['+links.map(l=>l.label+'>'+l.slug).join(', ')+']');}
}
console.log('total /a/ files:',files.length,'| no ar-content:',noAr);
console.log('articles that WOULD get >=1 link:',wouldModify,'| total links:',totalLinks);
console.log('--- sample winners ---');
console.log(winners.join('\n'));
