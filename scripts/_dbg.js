const fs=require('fs');
const mod=fs.readFileSync(__dirname+'/_link_injector_run.js','utf8');
const cut=mod.indexOf('// ---- build prioritized');
const head=mod.slice(0,cut)+'\nmodule.exports={linkableSegments,arContentRange,alreadyLinkedSlugs,terms,termMap,processArticle};\n';
fs.writeFileSync(__dirname+'/_inj_lib.js',head);
const lib=require(__dirname+'/_inj_lib.js');
const REPO=__dirname+'/..';
function dbg(f){
  const html=fs.readFileSync(REPO+'/'+f,'utf8');
  const arr=lib.arContentRange(html);
  const body=arr?html.slice(arr.start,arr.end):html;
  console.log('\n=== '+f);
  console.log('arRange:',arr&&(arr.start+'..'+arr.end),'len',html.length,'segs',lib.linkableSegments(html).length);
  console.log('linkedSlugs(body) count:',[...lib.alreadyLinkedSlugs(body)].length,'->',[...lib.alreadyLinkedSlugs(body)].slice(0,40).join(', '));
  console.log('links:',JSON.stringify(lib.processArticle(html).links));
}
dbg('a/magnesium-for-restless-legs-syndrome-dosing-form-and-the-trial-record.html');
dbg('a/taurine-and-blood-pressure-what-the-prehypertension-trial-actually-found.html');
dbg('a/quercetin-and-exercise-performance-the-vo2max-and-post-exercise-immune-trials.html');
