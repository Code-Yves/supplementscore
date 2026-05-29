/* ============================================================================
   scripts/slug.mjs — THE single shared slug resolver for all Node tooling.

   Loads data.js + search-index.js into one VM realm and re-uses the EXACT
   runtime `window.SS.slugify` and `window.SS.getSupplement`. This guarantees
   Node generators/validators and the browser can NEVER disagree about whether
   a `supplement.html?slug=<slug>` link resolves — they run the same code.

   Resolution is two-tier (same as runtime getSupplement):
     tier 1  slugify(full name)                       e.g. "coq10-ubiquinol"
     tier 2  slugify(name with parenthetical removed)  e.g. "coq10"

   Use this instead of re-deriving slugs with an ad-hoc regex, and instead of
   checking whether `s/<slug>.html` exists on disk (those are tombstones now).

   API:
     slugify(name)                 -> canonical kebab slug
     resolveSupplement(slug)       -> the data.js record, or null
     isValidSupplementSlug(slug)   -> boolean
     validSupplementSlugs()        -> Set<string> of every accepted slug
   ============================================================================ */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SCRIPT_DIR, '..');

function buildContext() {
  const sandbox = {};
  sandbox.window = sandbox;        // browser code does `window.SS = {...}`
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.console = console;
  // Minimal DOM/location stubs so a stray reference can't throw at load.
  sandbox.document = {
    documentElement: { setAttribute() {}, classList: { add() {} } },
    addEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  sandbox.location = { search: '', href: '', origin: '', replace() {}, assign() {} };
  vm.createContext(sandbox);

  // data.js declares top-level `const S = [...]` etc. Converting the leading
  // `const ` to `var ` makes those bindings attach to the context object so
  // search-index.js (run next, same realm) can read them — exactly what the
  // nightly generator already does.
  const dataSrc = fs.readFileSync(path.join(REPO, 'data.js'), 'utf8')
    .replace(/^\s*const\s+/gm, 'var ');
  vm.runInContext(dataSrc, sandbox, { filename: 'data.js' });

  const siSrc = fs.readFileSync(path.join(REPO, 'search-index.js'), 'utf8');
  vm.runInContext(siSrc, sandbox, { filename: 'search-index.js' });

  return sandbox;
}

const ctx = buildContext();
const SS = ctx.window && ctx.window.SS ? ctx.window.SS : ctx.SS;
if (!SS || typeof SS.getSupplement !== 'function' || typeof SS.slugify !== 'function') {
  throw new Error('slug.mjs: failed to load window.SS.{slugify,getSupplement} from search-index.js');
}

export function slugify(name) { return SS.slugify(name); }
export function resolveSupplement(slug) { return SS.getSupplement(String(slug == null ? '' : slug)); }
export function isValidSupplementSlug(slug) { return !!resolveSupplement(slug); }

export function validSupplementSlugs() {
  const S = (ctx.S || (ctx.window && ctx.window.S) || []);
  const set = new Set();
  for (const s of S) {
    if (!s || s.n == null) continue;
    set.add(SS.slugify(s.n));
    const short = String(s.n).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    set.add(SS.slugify(short));
  }
  set.delete('');
  return set;
}

export default { slugify, resolveSupplement, isValidSupplementSlug, validSupplementSlugs };
