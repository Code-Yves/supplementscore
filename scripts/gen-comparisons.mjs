#!/usr/bin/env node
/**
 * gen-comparisons.mjs — regenerate /data/comparisons.json from compare/index.html
 *
 * Why this exists
 * ---------------
 * The supplement detail page (supplement.html) renders a "Head-to-head
 * comparisons" section by matching the supplement's name against a list of
 * all comparison guides. That list is fetched from /data/comparisons.json.
 *
 * Rather than maintaining the JSON by hand, this script parses every
 * .hub-card in compare/index.html and extracts:
 *   - href            (link to the comparison page)
 *   - title           (card <h2> text)
 *   - sides           (the supplements being compared, derived from the title)
 *   - topic           (primary goal/topic, derived from a keyword taxonomy
 *                      kept in sync with the live filter on compare/index.html)
 *   - kind            ('binary' for 2 sides, 'multi' for 3+)
 *
 * Run it manually after adding or renaming a comparison guide:
 *
 *     node scripts/gen-comparisons.mjs
 *
 * The output is deterministic (stable key order, no timestamps in the data
 * payload itself — only at the top-level for human reference) so it diffs
 * cleanly in git.
 *
 * If the parser ever drops to zero comparisons it exits non-zero — a guard
 * against silently breaking the supplement-page module.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(SCRIPT_DIR, '..');
const SRC        = path.join(REPO_ROOT, 'compare', 'index.html');
const OUT_JSON   = path.join(REPO_ROOT, 'data', 'comparisons.json');
const OUT_JS     = path.join(REPO_ROOT, 'data', 'comparisons.js');

// Keep this taxonomy in sync with the TOPICS array inside compare/index.html.
// If the live filter on the compare index gains a new topic, mirror it here so
// the JSON's primary-topic field matches what users see.
const TOPICS = [
  ['Sleep',                /\b(sleep|insomnia|melatonin|valerian|hops|tart cherry|apigenin|chamomile|bedtime)/i],
  ['Stress & mood',        /\b(stress|anxious|anxiety|cortisol|mood|depress|adaptogen|ashwagandha|rhodiola|holy basil|tulsi|lemon balm|saffron|st\.?\s?john|5-htp|tryptophan|\bsame\b)/i],
  ['Cognition',            /\b(cogniti|memory|focus|nootropic|\bbrain\b|bacopa|lion'?s? mane|ginkgo|alpha-gpc|citicoline|cdp-choline|phosphatidylserine|l-threonate|threonate|attention)/i],
  ['Performance',          /\b(muscle|protein|whey|casein|plant protein|pea protein|leucine|creatine|\bbcaa|beta-alanine|citrulline|arginine|beetroot|pumps|training|performance|ergogenic|\bmps\b)/i],
  ['Heart & BP',           /\b(blood pressure|hypertens|cardio|cardiovascular|lipid|cholesterol|triglycerid|hawthorn|garlic|olive leaf|hibiscus|pomegranate|omega-3|fish oil|krill|algal|\bepa\b|\bdha\b|coq10)/i],
  ['Joints & inflammation', /\b(joint|osteoarthrit|\bknee\b|inflamm|glucosamine|\bmsm\b|curcumin|boswellia|ginger|chondroitin)/i],
  ['Gut',                  /\b(\bgut\b|probiotic|prebiotic|microbiom|psyllium|inulin|fibre|fiber|boulardii|reuteri|\blgg\b|glutamine|zinc carnosine|digest|\bibs\b|\buti\b|d-mannose|cranberry|bowel)/i],
  ['Energy',               /\b(energy|fatigue|mitochondri|coq10|\bpqq\b|\bnmn\b|\bnr\b|nad\+?|carnitine|alpha-lipoic|acetyl-l-carnitine|ribose|ribofla|\biron\b|ferrous|anemi|hemoglob)/i],
  ['Hormones',             /\b(hormone|libido|testosteron|estrogen|oestrogen|menopause|\bpms\b|\bpcos\b|prostate|\bbph\b|tongkat|fadogia|maca|\bdim\b|calcium d-glucarate|black cohosh|red clover|saw palmetto|pygeum|beta-sitosterol)/i],
  ['Bones',                /\b(bone|osteoporos|calcium|vitamin k|\bk2\b|mk-?[47]|fracture|vitamin d|cholecalciferol|ergocalciferol|\bd3\b|\bd2\b)/i],
  ['Skin & eyes',          /\b(skin|collagen|elasticity|wrinkl|aging|\beye\b|vision|macular|\bamd\b|lutein|zeaxanthin|astaxanthin)/i],
  ['Immune',               /\b(immune|\bcold\b|\bflu\b|elderberry|vitamin c|sambucus|\bzinc\b)/i],
  ['Liver',                /\b(liver|hepat|nafld|tudca|\bnac\b|glutathione|cholestasis|milk thistle|silymarin)/i],
  ['Methylation',          /\b(methylation|methylfolate|folic acid|folate|\bb12\b|methylcobalamin|cyanocobalamin|\btmg\b|betaine|homocysteine|mthfr)/i],
  ['Thyroid & metabolic',  /\b(thyroid|hashimoto|hypothyroid|berberine|cinnamon|insulin|glucose|inositol|blood sugar|metabolic|selenium|iodine)/i],
  ['Migraine',             /\b(migraine|headache)/i],
  ['Longevity',            /\b(longevity|anti-aging|spermidine|resveratrol|pterostilbene|sirtuin|telomere|senescence)/i],
];

function primaryTopic(text) {
  for (const [name, re] of TOPICS) if (re.test(text)) return name;
  return 'Other';
}

function decodeEntities(s) {
  return String(s)
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/**
 * Parse a card title into its sides. Examples:
 *   "Magnesium glycinate vs citrate vs L-threonate"  -> ["Magnesium glycinate","citrate","L-threonate"]
 *   "Ashwagandha vs Rhodiola — which adaptogen…"     -> ["Ashwagandha","Rhodiola"]
 *   "Ashwagandha vs L-Theanine for stress — …"       -> ["Ashwagandha","L-Theanine"]
 *
 * Anything after the first em-dash is treated as a subtitle and discarded.
 * "for <X>" trailing the final side is also stripped.
 */
function extractSides(rawTitle) {
  let title = decodeEntities(rawTitle);
  title = title.split(/[—–-]\s+/)[0];                      // drop subtitle
  const parts = title.split(/\s+vs\.?\s+/i);
  if (parts.length < 2) return [title.trim()];
  parts[parts.length - 1] = parts[parts.length - 1].split(/\s+for\s+/i)[0];
  return parts.map(s => s.trim()).filter(Boolean);
}

function parseCards(html) {
  // Each card looks like:
  //   <a href="…" class="hub-card">
  //     <div class="hub-card-tag">…</div>
  //     <h2>…</h2>
  //     <p>…</p>
  //     ...
  //   </a>
  const re = /<a href="([^"]+)" class="hub-card">\s*<div class="hub-card-tag">([^<]+)<\/div>\s*<h2>([^<]+)<\/h2>\s*<p>([^<]+)<\/p>/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    // Hrefs in compare/index.html are sibling-relative ("magnesium-forms.html").
    // Persist them as site-root-relative ("compare/magnesium-forms.html") so the
    // data file can be consumed from any page (supplement.html, future pages)
    // without each consumer having to know about the /compare/ subdirectory.
    let href = m[1];
    if (!/^(https?:)?\//i.test(href) && !href.startsWith('compare/')) {
      href = 'compare/' + href;
    }
    const title = decodeEntities(m[3]);
    const desc  = decodeEntities(m[4]);
    const sides = extractSides(m[3]);
    const topic = primaryTopic((m[3] + ' ' + m[4]).toLowerCase());
    const kind  = sides.length >= 3 ? 'multi' : 'binary';
    out.push({ href, title, sides, topic, kind });
  }
  return out;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`✗ source not found: ${SRC}`);
    process.exit(1);
  }
  const html = fs.readFileSync(SRC, 'utf8');
  const parsed = parseCards(html);

  // De-dupe by href — cards may appear in multiple grids on the index page.
  const seen = new Set();
  const unique = parsed.filter(c => {
    if (seen.has(c.href)) return false;
    seen.add(c.href);
    return true;
  });

  if (!unique.length) {
    console.error('✗ parsed 0 comparisons — refusing to overwrite data/comparisons.json');
    process.exit(2);
  }

  // Stable sort: binary first, then multi-form; alphabetical within each.
  unique.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'binary' ? -1 : 1;
    return a.href.localeCompare(b.href);
  });

  const payload = {
    generated: new Date().toISOString().slice(0, 10),
    source: 'compare/index.html',
    total: unique.length,
    comparisons: unique,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + '\n');

  // Also emit a script-tag-loadable copy. Loaded via <script src="data/comparisons.js">
  // so the supplement page works on file:// previews (where fetch() is blocked
  // for security reasons) without needing a local web server.
  const jsBody =
    '/* data/comparisons.js — auto-generated by scripts/gen-comparisons.mjs. Do not edit by hand. */\n' +
    'window.SS_COMPARISONS = ' + JSON.stringify(payload, null, 2) + ';\n';
  fs.writeFileSync(OUT_JS, jsBody);

  const byTopic = {};
  unique.forEach(c => { byTopic[c.topic] = (byTopic[c.topic] || 0) + 1; });
  const topicSummary = Object.entries(byTopic)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t}=${n}`)
    .join(', ');

  console.log(`✓ wrote ${path.relative(REPO_ROOT, OUT_JSON)}`);
  console.log(`✓ wrote ${path.relative(REPO_ROOT, OUT_JS)}`);
  console.log(`  ${unique.length} comparisons  (${unique.filter(c => c.kind === 'binary').length} binary, ${unique.filter(c => c.kind === 'multi').length} multi-form)`);
  console.log(`  topics: ${topicSummary}`);
}

main();
