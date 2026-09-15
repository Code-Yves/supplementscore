/* ============================================================================
   scripts/check_slug_aliases.mjs — runtime slug-alias contract.

   Guards the getSupplement fallbacks that recover common typed / legacy URLs
   such as /s/creatine.html (smart-404 → ?slug=creatine) so they no longer
   render "Supplement not found". Fail-closed: exit 1 on any miss or on a
   generic heading that MUST stay unresolved (vitamin, black, l).

   Usage: node scripts/check_slug_aliases.mjs
   ============================================================================ */
import { resolveSupplement, slugify } from './slug.mjs';

const MUST_RESOLVE = {
  creatine: 'Creatine monohydrate',
  'vitamin-d': 'Vitamin D3',
  'lions-mane': "Lion's mane",
  collagen: 'Collagen peptides',
  nmn: 'NMN',
  'omega-3': 'Omega-3',
  curcumin: 'Curcumin',
  magnesium: 'Magnesium',
  zinc: 'Zinc',
  ashwagandha: 'Ashwagandha',
};

const MUST_NOT_RESOLVE = ['vitamin', 'black', 'white', 'l', 'd', '5', 'red', 'green', 'apple', 'st', '1'];

let fail = 0;

console.log('== slug alias contract ==');
for (const [slug, needle] of Object.entries(MUST_RESOLVE)) {
  const hit = resolveSupplement(slug);
  if (!hit) {
    console.log(`  FAIL  ${slug}  ->  null  (expected name containing ${JSON.stringify(needle)})`);
    fail++;
    continue;
  }
  if (!String(hit.n).toLowerCase().includes(needle.toLowerCase())) {
    console.log(`  FAIL  ${slug}  ->  ${hit.n}  (expected name containing ${JSON.stringify(needle)})`);
    fail++;
    continue;
  }
  const canon = slugify(hit.n);
  console.log(`  ok    ${slug}  ->  ${canon}  (${hit.n})`);
}

for (const slug of MUST_NOT_RESOLVE) {
  const hit = resolveSupplement(slug);
  if (hit) {
    console.log(`  FAIL  ${slug}  ->  ${hit.n}  (generic heading must stay unresolved)`);
    fail++;
  } else {
    console.log(`  ok    ${slug}  ->  null`);
  }
}

if (fail) {
  console.log(`FAIL: ${fail} alias contract violation(s)`);
  process.exit(1);
}
console.log('PASS — alias contract holds.');
