/* ============================================================================
   scripts/gen_supplement_meta.mjs — (re)generate supplement-meta.json

   supplement-meta.json powers the scored "Supplements in this article" cards
   that _research-chrome.js renders on standalone /a/<slug>.html pages
   (Tier badge + Efficacy x/5 · Safety y/5 + tag). The chrome parses the slug
   out of each `supplement.html?slug=<slug>` link and looks it up in this file.

   PROBLEM this fixes: the file was historically keyed ONLY by canonical slugs
   (e.g. `omega-3-epa-dha`, `coq10-ubiquinol`), but articles link the SHORT
   slug form (`omega-3`, `coq10`). The lookup missed, so cards never upgraded.

   FIX: emit an entry for EVERY slug the shared resolver accepts
   (scripts/slug.mjs → validSupplementSlugs()), which includes both the
   full-name slug AND the parenthetical-stripped short slug for each
   supplement. Each alias maps to the SAME scored data as its canonical entry.

   The entry shape + scoring exactly mirror the runtime (app.js):
     name     = s.n
     score    = calcScore(s)          // s.e*7 + s.s*4 + r*3 + o*2 + c*2 + d*2
     tier     = "Tier N" from s.t      // authored tier field, NOT eTier()
     efficacy = s.e
     safety   = s.s
     tag      = s.tag                  // full tag string (not the 2-sliced card form)

   This script is ADDITIVE-SAFE: any pre-existing key in supplement-meta.json
   is preserved byte-for-byte (its value is never overwritten). New alias keys
   are merged in and the file is re-serialised with existing keys first (in
   their original order) followed by the newly added keys (sorted).

   Usage:  node scripts/gen_supplement_meta.mjs
           node scripts/gen_supplement_meta.mjs --check   (dry-run, no write)
   ============================================================================ */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validSupplementSlugs, resolveSupplement } from './slug.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SCRIPT_DIR, '..');
const OUT = path.join(REPO, 'supplement-meta.json');

/* Canonical scorer — kept identical to app.js calcScore(). */
function calcScore(s) {
  const rd = s.r || 1, so = s.o || 1, sco = s.c || 1, sd = s.d || 1;
  return Math.round(s.e * 7 + s.s * 4 + rd * 3 + so * 2 + sco * 2 + sd * 2);
}

/* Tier string from the authored s.t field (matches the existing file:
   stored tier follows s.t, NOT the score-derived eTier). */
function tierLabel(t) {
  return t === 't1' ? 'Tier 1'
       : t === 't2' ? 'Tier 2'
       : t === 't3' ? 'Tier 3'
       : 'Tier 4';
}

function entryFor(s) {
  return {
    name: s.n,
    score: calcScore(s),
    tier: tierLabel(s.t),
    efficacy: s.e,
    safety: s.s,
    tag: s.tag || ''
  };
}

function main() {
  const check = process.argv.includes('--check');

  // 1. Load existing file (preserve key order + any hand-tuned values).
  let existing = {};
  let existingOrder = [];
  if (fs.existsSync(OUT)) {
    const raw = fs.readFileSync(OUT, 'utf8');
    existing = JSON.parse(raw);
    existingOrder = Object.keys(existing);
  }
  const beforeCount = existingOrder.length;

  // 2. Compute an entry for every resolver-accepted slug.
  const slugs = validSupplementSlugs();
  const generated = {};       // slug -> entry (freshly computed)
  let unresolved = 0;
  for (const slug of slugs) {
    const rec = resolveSupplement(slug);
    if (!rec || rec.n == null) { unresolved++; continue; }
    generated[slug] = entryFor(rec);
  }

  // 3. Merge ADDITIVELY: existing keys win (never overwritten); new keys added.
  const merged = {};
  const newKeys = [];
  for (const k of existingOrder) merged[k] = existing[k];   // preserve, in order
  for (const k of Object.keys(generated)) {
    if (Object.prototype.hasOwnProperty.call(merged, k)) continue; // keep existing
    merged[k] = generated[k];
    newKeys.push(k);
  }
  newKeys.sort();

  // 4. Re-serialise: existing keys first (original order), then new keys (sorted).
  const ordered = {};
  for (const k of existingOrder) ordered[k] = merged[k];
  for (const k of newKeys) ordered[k] = merged[k];

  const afterCount = Object.keys(ordered).length;

  console.log('supplement-meta.json (re)generation');
  console.log('  resolver-accepted slugs : ' + slugs.size);
  console.log('  unresolved (skipped)     : ' + unresolved);
  console.log('  keys before              : ' + beforeCount);
  console.log('  new alias keys added     : ' + newKeys.length);
  console.log('  keys after               : ' + afterCount);

  if (check) {
    console.log('  (--check) no file written.');
    return;
  }

  fs.writeFileSync(OUT, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
  console.log('  WROTE ' + path.relative(REPO, OUT));
}

main();
