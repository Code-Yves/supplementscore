const fs=require('fs');
const lib=require(__dirname+'/_inj_lib.js');
const REPO=__dirname+'/..';
function show(f){
  const html=fs.readFileSync(REPO+'/a/'+f,'utf8');
  const out=lib.processArticle(html).html;
  console.log('\n##### '+f);
  // find the injected anchors and print context
  const re=/<a href="\.\.\/supplement\.html\?slug=[a-z0-9-]+">[^<]+<\/a>/g; let m;
  // only show anchors that are NEW (diff): compare by scanning out where original had plain text.
  // simpler: print 90 chars around each anchor whose exact string is absent in original html
  while((m=re.exec(out))){
    if(html.indexOf(m[0])===-1){
      const i=m.index;
      console.log('…'+out.slice(i-60,i+m[0].length+30).replace(/\s+/g,' ')+'…');
    }
  }
}
['fat-soluble-vs-water-soluble-supplements-when-to-take-with-food.html',
 'prenatal-vitamins-how-to-choose-one-that-meets-acog-standards.html',
 'supplements-during-pregnancy-the-essential-guide.html',
 'ginger-for-nausea-stronger-than-you-rsquo-d-expect.html'].forEach(show);
