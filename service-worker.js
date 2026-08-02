// Pointliner service worker — makes the app installable + cached for true offline use
// when served over https (e.g. https://zntznt.com/pointliner/). It is PURE ENHANCEMENT:
// the app is a single self-contained index.html with zero dependencies, so it already
// runs offline from a saved file. This SW only adds the install/standalone experience
// for the hosted copy; if it is absent (a downloaded index.html opened from disk, or any
// host without these companion files) the app is unaffected.
//
// Freshness model (this is the part that decides whether an install traps you on an old
// build — it does NOT): navigations are NETWORK-FIRST, so an online open/refresh always
// fetches the live index.html and only falls back to the cache when offline. The cache is
// the offline safety net, not the source of truth. Static assets (the icon) are cache-
// first; bump CACHE_VERSION to force those (and a cold offline shell) to refresh.
// skipWaiting + clients.claim mean a new SW takes over immediately, never waiting for all
// tabs to close. There is no backend/API/runtime fetch, so the shell IS the app.
const CACHE_VERSION = 'pointliner-v4';
// Relative URLs: the app is served from a subpath (/pointliner/), so the SW scope is its
// own directory. './' caches the directory index (index.html) under the navigated URL.
const SHELL = ['./', './index.html', './icon.svg'];

self.addEventListener('install', (event) => {
  // Take over as soon as installed so the first visit can go offline immediately.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Don't let one missing optional asset (e.g. icon.svg on an old deploy) fail the
      // whole install — add what we can, ignore individual misses.
      Promise.allSettled(SHELL.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('activate', (event) => {
  // Drop old caches from previous versions, then claim open clients.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;            // never intercept non-GET (nothing to cache)
  // Navigations (opening the app, refresh): NETWORK-FIRST — go to the network so an online
  // open always gets the live build, and fall back to the cached './index.html' (then to the
  // cached './') only when the fetch fails. This is the freshness model described up top; the
  // cache is the offline safety net here, not the source of truth. Do not "fix" this into
  // cache-first: that is what traps an installed copy on a stale build.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }
  // Everything else (the icon, etc.): cache-first, fall back to network.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
