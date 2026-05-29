/* ============================================================================
   scripts/check_internal_links.mjs — deterministic internal-link checker.

   Replaces the old "does s/<slug>.html exist on disk?" audit oracle, which was
   wrong on both sides after the 2026-05-25 tombstoning: it passed dead /s/
   files and FAILED valid supplement.html?slug= links. This checker validates:

     • supplement.html?slug=<slug>  -> via the shared two-tier resolver (slug.mjs)
     • legacy ../s/<slug>.html      -> resolver on <slug> (tombstone redirects to
                                        ?slug=<slug>; flagged as "rewrite me")
     • /for/*.html                  -> always flagged (directory retired/deleted)
     • a/ condition/ compare/ stack/ sx/ medication/ m/ links -> file on disk

   Usage:
     node scripts/check_internal_links.mjs            # scan default dirs
     node scripts/check_internal_links.mjs a/ es/     # scan specific dirs
     node scripts/check_internal_links.mjs --json     # machine-readable
   Exit code 1 if any GENUINE break is found (so it can gate CI / the audit).
   ============================================================================ */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isValidSupplementSlug } from './slug.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SCRIPT_DIR, '..');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const dirArgs = argv.filter(a => !a.startsWith('--'));
const DEFAULT_DIRS = ['a', 'condition', 'compare', 'stack', 'sx', 'hub', 'm', 'es', 'fr', '.'];
const SCAN_DIRS = dirArgs.length ? dirArgs : DEFAULT_DIRS;

// dirs we never recurse into
const SKIP = new Set(['node_modules', '_archive', '_site_excluded', 'dist', 'mockups', 'docs', '.git', 'reviews', 'scripts', 's']);
// NOTE: 's' (tombstones) is skipped as a *source* of links, but is still a valid
// *target* via redirect — handled in the legacy branch below.

function walk(dir, acc) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      walk(full, acc);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

let files = [];
for (const d of SCAN_DIRS) {
  const abs = path.resolve(REPO, d);
  if (d === '.') {
    // only top-level *.html, don't recurse the whole repo from root
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (e.isFile() && e.name.endsWith('.html')) files.push(path.join(abs, e.name));
    }
  } else {
    walk(abs, files);
  }
}
files = [...new Set(files)];

const HREF = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const stats = { files: files.length, supplementOK: 0, supplementBroken: 0, legacyS: 0, legacySBroken: 0, forLinks: 0, fileOK: 0, fileMissing: 0 };
const breaks = [];      // genuine breaks (fail the run)
const legacyRewrite = []; // legacy /s/ links that resolve — should be rewritten, not a hard failure
const fileTargetDirs = ['a', 'condition', 'compare', 'stack', 'sx', 'hub', 'm', 'es', 'fr'];

for (const file of files) {
  const rel = path.relative(REPO, file);
  const src = fs.readFileSync(file, 'utf8');
  let m;
  HREF.lastIndex = 0;
  while ((m = HREF.exec(src))) {
    let href = m[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')
        || href.startsWith('data:') || href.startsWith('http://') || href.startsWith('https://')
        || href.startsWith('//') || href.startsWith('javascript:')) continue;

    const noHash = href.split('#')[0];

    // 1. Canonical supplement link: supplement.html?slug=<slug>
    const supM = noHash.match(/supplement\.html\?(?:[^#]*&)?slug=([^&]+)/i);
    if (supM) {
      const slug = decodeURIComponent(supM[1]).toLowerCase();
      if (isValidSupplementSlug(slug)) stats.supplementOK++;
      else { stats.supplementBroken++; breaks.push({ file: rel, href, kind: 'supplement-slug-unresolved', slug }); }
      continue;
    }

    // 2. Legacy /s/<slug>.html (tombstone → redirects to ?slug=<slug>)
    const legM = noHash.match(/(?:^|\/)s\/([a-z0-9-]+)\.html$/i);
    if (legM) {
      stats.legacyS++;
      const slug = legM[1].toLowerCase();
      if (isValidSupplementSlug(slug)) legacyRewrite.push({ file: rel, href, slug });
      else { stats.legacySBroken++; breaks.push({ file: rel, href, kind: 'legacy-s-unresolved', slug }); }
      continue;
    }

    // 3. Retired /for/ directory
    if (/(?:^|\/)for\/[a-z0-9-]+\.html$/i.test(noHash)) {
      stats.forLinks++;
      breaks.push({ file: rel, href, kind: 'for-retired' });
      continue;
    }

    // 4. Other internal .html links -> must exist on disk
    if (noHash.endsWith('.html') && !noHash.includes('?')) {
      // resolve relative to the linking file's directory, then to REPO for absolute
      let targetAbs;
      if (noHash.startsWith('/')) targetAbs = path.join(REPO, noHash);
      else targetAbs = path.resolve(path.dirname(file), noHash);
      const within = targetAbs.startsWith(REPO);
      const topDir = path.relative(REPO, targetAbs).split(path.sep)[0];
      if (within && fileTargetDirs.includes(topDir)) {
        if (fs.existsSync(targetAbs)) stats.fileOK++;
        else { stats.fileMissing++; breaks.push({ file: rel, href, kind: 'file-missing' }); }
      }
    }
  }
}

if (asJson) {
  console.log(JSON.stringify({ stats, breaks, legacyRewriteCount: legacyRewrite.length }, null, 2));
} else {
  console.log(`Internal-link check — scanned ${stats.files} files`);
  console.log(`  supplement ?slug= links: ${stats.supplementOK} resolve, ${stats.supplementBroken} BROKEN`);
  console.log(`  legacy ../s/ links:      ${stats.legacyS} total (${legacyRewrite.length} resolve via redirect → rewrite to ?slug=, ${stats.legacySBroken} BROKEN)`);
  console.log(`  /for/ links:             ${stats.forLinks} (retired dir)`);
  console.log(`  other file links:        ${stats.fileOK} OK, ${stats.fileMissing} MISSING`);
  const genuine = breaks.filter(b => b.kind !== 'for-retired' || true);
  console.log(`\nGENUINE BREAKS: ${breaks.length}`);
  const byKind = {};
  for (const b of breaks) (byKind[b.kind] ||= []).push(b);
  for (const [k, arr] of Object.entries(byKind)) {
    console.log(`  [${k}] ${arr.length}`);
    for (const b of arr.slice(0, 25)) console.log(`     ${b.file}  ->  ${b.href}${b.slug ? `  (slug=${b.slug})` : ''}`);
    if (arr.length > 25) console.log(`     …and ${arr.length - 25} more`);
  }
}

process.exit(breaks.length ? 1 : 0);
