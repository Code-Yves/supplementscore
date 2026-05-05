/* sw.js — service worker for SupplementScore
 * Strategy: network-first with stale-while-revalidate fallback.
 * Critical assets are pre-cached on install so the next visit feels instant
 * even on a flaky connection. Repeat visitors load offline.
 *
 * Cache names are versioned — bump CACHE_VERSION on data.js / app.js changes
 * so users always get fresh data within one navigation.
 */

const CACHE_VERSION = 'v2026-05-04-batch3';
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

  // Stale-while-revalidate for HTML / JS / CSS / JSON
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
