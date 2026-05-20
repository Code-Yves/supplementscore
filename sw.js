/* sw.js — service worker for SupplementScore
 * Strategy: network-first with stale-while-revalidate fallback.
 * Critical assets are pre-cached on install so the next visit feels instant
 * even on a flaky connection. Repeat visitors load offline.
 *
 * Cache names are versioned — bump CACHE_VERSION on data.js / app.js changes
 * so users always get fresh data within one navigation.
 */

/* CACHE_VERSION bumped 2026-05-18 (v26) to invalidate stale caches after
   a batch of JS/CSS edits: modal back-stack (modal-stack.js + closeArtModal
   pop, supplement-modal.js push), Further Reading reroute (supplement.html),
   Recommended For de-link, autocomplete z-index, supplement footer removal,
   V2 brand-teal filter buttons (styles.css). Without this bump, the SW's
   stale-while-revalidate flow serves users yesterday's JS even after a
   hard-reload — bumping forces a full SW reinstall and cache wipe. */
const CACHE_VERSION = 'v2026-05-20-art-reg-523';
const PRECACHE = 'ssc-precache-' + CACHE_VERSION;
const RUNTIME = 'ssc-runtime-' + CACHE_VERSION;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/landing.html',
  '/styles.css',
  '/index.css',
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
