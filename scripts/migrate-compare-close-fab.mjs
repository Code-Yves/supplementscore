#!/usr/bin/env node
/**
 * migrate-compare-close-fab.mjs
 *
 * One-off migration for /compare/*.html guides:
 *   - Removes the "Back to articles" link (.ca-back) at the top of each guide.
 *   - Inserts a top-right close FAB that returns the user to wherever they
 *     came from (history.back when same-origin referrer, otherwise the
 *     compare index as a sensible fallback).
 *
 * Idempotent: re-running is a no-op if the close FAB is already present.
 *
 *     node scripts/migrate-compare-close-fab.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(SCRIPT_DIR, '..');
const COMPARE_DIR = path.join(REPO_ROOT, 'compare');

// We reuse the .reader-close-fab styles already defined in styles.css.
// The FAB markup includes inline onclick rather than a separate handler so
// the behavior travels with the element and doesn't need a shared script.
const FAB_HTML =
'<!-- close FAB → go back to the supplement card / page that linked here -->\n' +
'<a href="../index.html" class="reader-close-fab" aria-label="Close and return"\n' +
'   onclick="event.preventDefault();if(document.referrer&&document.referrer.indexOf(location.origin)===0&&history.length>1){history.back();}else{location.href=\'./index.html\';}">\n' +
'  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>\n' +
'</a>\n';

// Match the existing ca-back element on a guide page. The href varies
// between files ("../index.html#articles", "index.html", etc.) so we match
// on the class alone.
const CA_BACK_RE = /\s*<a [^>]*class="ca-back"[^>]*>[\s\S]*?<\/a>\s*/;

function migrate(file) {
  const src = fs.readFileSync(file, 'utf8');

  // Skip index.html (the hub) — it has its own hub-close-fab already
  if (path.basename(file) === 'index.html') return { file, action: 'skip-index' };

  let out = src;
  const hadBack = CA_BACK_RE.test(out);
  const hadFab = /class="reader-close-fab"/.test(out);

  if (hadBack) out = out.replace(CA_BACK_RE, '\n');
  if (!hadFab) {
    // Insert the FAB just after the opening <body> tag, on its own line
    out = out.replace(/<body>\s*/, (m) => '<body>\n' + FAB_HTML);
  }

  if (out !== src) {
    fs.writeFileSync(file, out);
    return { file, action: 'migrated', removedBack: hadBack, addedFab: !hadFab };
  }
  return { file, action: 'noop' };
}

const files = fs.readdirSync(COMPARE_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(COMPARE_DIR, f));

const results = files.map(migrate);
const migrated = results.filter(r => r.action === 'migrated');
const noop     = results.filter(r => r.action === 'noop');
const skipped  = results.filter(r => r.action === 'skip-index');

console.log(`✓ migrated ${migrated.length} guide${migrated.length === 1 ? '' : 's'}`);
if (noop.length)    console.log(`  ${noop.length} already up-to-date`);
if (skipped.length) console.log(`  ${skipped.length} skipped (index.html)`);
