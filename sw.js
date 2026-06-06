/* sw.js — service worker for SupplementScore
 *
 * ═══════════════════════════════════════════════════════════════════
 * CACHE STRATEGY (one source of truth — read before editing)
 * ═══════════════════════════════════════════════════════════════════
 *
 *  HTML, CSS         → network-first (see fetch handler, lines below)
 *                      • Always fetched fresh on a normal page load.
 *                      • Cache is consulted ONLY when the network is
 *                        unreachable (true offline). That means CSS
 *                        edits ship the moment the file is deployed;
 *                        you do NOT need to bump a version to "wake up"
 *                        users — a normal page load already does it.
 *
 *  JS, JSON, images  → stale-while-revalidate
 *                      • Cached copy is served immediately for speed,
 *                      • Fresh copy is fetched in the background and
 *                        stored for the NEXT request.
 *                      • A code change ships on the user's second load.
 *                        If you need a hard cut (data.js schema change,
 *                        breaking app.js refactor), bump CACHE_VERSION
 *                        below — that triggers a full SW reinstall and
 *                        drops the runtime cache, forcing fresh JS on
 *                        the very next request.
 *
 *  PRECACHE_URLS     → offline-first install only.
 *                      The list below is fetched at SW install time so
 *                      a fresh visitor with a flaky connection still
 *                      gets a usable shell. It is NOT the runtime cache
 *                      that serves requests — that's RUNTIME, populated
 *                      lazily by the fetch handler. CSS is intentionally
 *                      OMITTED from this list now: network-first makes
 *                      precaching it pointless (the cached copy is never
 *                      consulted except offline, and a fallback offline
 *                      copy isn't worth the cache-version coordination
 *                      headache when it gets stale).
 *
 *  ?v=<hash> on <link href> / <script src> in HTML
 *                    → cosmetic / defensive only. The SW's network-first
 *                      flow already guarantees freshness for CSS and
 *                      HTML; the ?v= parameter is a belt-and-braces hint
 *                      to any CDN or browser HTTP-cache layer in front
 *                      of us. Do NOT rely on it as the primary
 *                      invalidation mechanism — bump CACHE_VERSION here
 *                      instead when you need a guaranteed cut.
 *
 * ═══════════════════════════════════════════════════════════════════
 *
 * When to bump CACHE_VERSION:
 *   • Breaking schema change in data.js / data/pairings.json
 *   • Major refactor across app.js / supplement-modal.js that older
 *     cached versions can't co-exist with
 *   • A bug where users report stale JS persisting past a normal reload
 * Do NOT bump for:
 *   • CSS-only changes (network-first picks them up automatically)
 *   • HTML-only changes (same)
 *   • Small JS tweaks (stale-while-revalidate picks them up next load)
 */
const CACHE_VERSION = 'v2026-06-06-reg601';
const PRECACHE = 'ssc-precache-' + CACHE_VERSION;
const RUNTIME = 'ssc-runtime-' + CACHE_VERSION;

/* CSS is intentionally OMITTED from this list — see the header comment.
   Network-first makes a pre-warmed CSS cache pointless, and removing it
   eliminates the "bump CACHE_VERSION just for a CSS change" trap. */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/landing.html',
  '/data.js',
  '/app.js',
  '/index.js',
  '/search-index.js',
  '/nav-search.js',
  '/supplement-modal.js',
  '/modal-stack.js',
  '/data/pairings.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {/* tolerate 404s */}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Drop caches from prior versions
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== PRECACHE && k !== RUNTIME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Don't cache cross-origin (Google Fonts, Formspree, PubMed, etc.)
  if (url.origin !== location.origin) return;

  // HTML navigations and the CSS files MUST be network-first so users always
  // get the latest layout / nav / search-bar updates as soon as we deploy.
  // Falling back to cache only when the network is unreachable preserves
  // offline support without the previous cache-first staleness bug that
  // pinned the iPhone to month-old CSS even after we bumped ?v= params.
  const isHtml = req.mode === 'navigate' || req.destination === 'document'
                 || url.pathname.endsWith('.html') || url.pathname === '/';
  const isStyle = req.destination === 'style' || url.pathname.endsWith('.css');
  if (isHtml || isStyle) {
    event.respondWith(
      fetch(req).then(response => {
        if (response && response.status === 200) {
          const respClone = response.clone();
          caches.open(RUNTIME).then(cache => cache.put(req, respClone));
        }
        return response;
      }).catch(() => caches.match(req)) // offline fallback
    );
    return;
  }

  // Everything else (JS, JSON, images): stale-while-revalidate is fine —
  // freshness matters less and the speed win on flaky mobile is real.
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(response => {
        if (response && response.status === 200) {
          const respClone = response.clone();
          caches.open(RUNTIME).then(cache => cache.put(req, respClone));
        }
        return response;
      }).catch(() => cached); // offline fallback

      return cached || fetchPromise;
    })
  );
});
