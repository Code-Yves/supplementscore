#!/usr/bin/env node
/**
 * validate_dietarysupplement_schema.mjs
 * Smoke-test the DietarySupplement JSON-LD generator from supplement-detail.js
 * by re-implementing the same logic in Node and rendering 3 sample slugs.
 *
 * USAGE:  node scripts/validate_dietarysupplement_schema.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../data.js', import.meta.url), 'utf8');
// data.js uses bare `const` — eval into a sandbox so we can read S, TIERS, etc.
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src.replace(/^\s*const\s+/gm, 'var '), ctx);
const S = ctx.S;
if (!Array.isArray(S)) throw new Error('S not found in data.js');

// Same function as supplement-detail.js injectSchema, sans DOM injection.
function buildSchema(s, slug) {
  const url = 'https://supplementscore.org/supplement.html?slug=' + encodeURIComponent(slug);
  const name = s.n || '';
  const altMatch = name.match(/\(([^)]+)\)/);
  const altName = altMatch ? altMatch[1].trim() : null;
  const bareName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  let desc = (s.desc || '').replace(/\s+/g, ' ').trim();
  if (desc.length > 480) desc = desc.slice(0, 477).trim() + '…';
  const safetyByTier = {
    t1: 'Strong evidence base; safe for adult use at standard doses. SupplementScore Tier 1.',
    t2: 'Promising or situational evidence; benefits depend on indication and dosing. SupplementScore Tier 2.',
    t3: 'Trending in wellness culture but limited clinical evidence. SupplementScore Tier 3.',
    t4: 'Documented safety risks including possible organ damage, drug interactions, or regulatory warnings. Do not use without clinician supervision. SupplementScore Tier 4.'
  };
  const safety = safetyByTier[s.t] || 'See methodology for current evidence rating.';
  let doseObj = null;
  if (s.dose) {
    doseObj = {
      "@type": "RecommendedDoseSchedule",
      "doseUnit": "varies — see description",
      "doseSchedule": String(s.dose).slice(0, 200)
    };
  }
  const supplement = {
    "@context": "https://schema.org",
    "@type": "DietarySupplement",
    "name": name,
    "description": desc || (name + ' — evidence-based supplement detail.'),
    "activeIngredient": bareName || name,
    "isProprietary": false,
    "safetyConsideration": safety,
    "url": url,
    "image": "https://supplementscore.org/og/default.png",
    "inLanguage": "en-US",
    "publisher": {
      "@type": "Organization",
      "name": "SupplementScore",
      "url": "https://supplementscore.org",
      "logo": {"@type": "ImageObject", "url": "https://supplementscore.org/og/default.png"}
    },
    "mainEntityOfPage": {"@type": "WebPage", "@id": url}
  };
  if (altName) supplement.alternateName = altName;
  if (doseObj) supplement.recommendedIntake = doseObj;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://supplementscore.org/"},
      {"@type": "ListItem", "position": 2, "name": "Supplements", "item": "https://supplementscore.org/browse.html"},
      {"@type": "ListItem", "position": 3, "name": name, "item": url}
    ]
  };
  return { supplement, breadcrumb };
}

function slugify(n) {
  return String(n).toLowerCase()
    .replace(/['"]+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pick three samples covering different tier + name shapes
const wanted = ['Creatine monohydrate', 'Vitamin D3', 'Omega-3 (EPA/DHA)', 'Ashwagandha (KSM-66)', '2,4-Dinitrophenol (DNP)'];
const samples = wanted.map(n => S.find(s => s.n === n)).filter(Boolean);

let errors = 0;
for (const s of samples) {
  const slug = slugify(s.n);
  const { supplement, breadcrumb } = buildSchema(s, slug);
  // Round-trip JSON to validate syntax
  let ok = true;
  try {
    JSON.parse(JSON.stringify(supplement));
    JSON.parse(JSON.stringify(breadcrumb));
  } catch (e) {
    ok = false;
    errors++;
  }
  console.log(`\n──────────  ${s.n} [tier=${s.t}]  ──────────`);
  console.log(`slug:           ${slug}`);
  console.log(`json valid:     ${ok ? 'YES' : 'NO'}`);
  console.log(`name:           ${supplement.name}`);
  console.log(`alternateName:  ${supplement.alternateName || '(none)'}`);
  console.log(`activeIngred:   ${supplement.activeIngredient}`);
  console.log(`safetyConsid:   ${supplement.safetyConsideration.slice(0, 100)}…`);
  console.log(`hasDose:        ${!!supplement.recommendedIntake}`);
  console.log(`desc length:    ${supplement.description.length}`);
}

console.log(`\nValidation complete. errors=${errors}, samples=${samples.length}`);
process.exit(errors > 0 ? 1 : 0);
