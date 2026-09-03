// Pointliner service worker — makes the app installable + cached for true offline use
// when served over https (e.g. https://zntznt.com/pointliner/). It is PURE ENHANCEMENT:
// the app is a single self-contained index.html with zero dependencies, so it already
// runs offline from a saved file. This SW only adds the install/standalone experience
// for the hosted copy; if it is absent (a downloaded index.html opened from disk, or any
// host without these companion files) the app is unaffected.
//
// Freshness model (this is the part that decides whether an install traps you on an old
// build — it does NOT): navigations are NETWORK-FIRST, so an online open/refresh fetches
// the live index.html and only falls back to the cache when the network fails OR is too
// slow to be worth waiting for. The cache is the offline safety net, not the source of
// truth. Static assets (the icon) are cache-first; bump CACHE_VERSION to force those (and
// a cold offline shell) to refresh. skipWaiting + clients.claim mean a new SW takes over
// immediately, never waiting for all tabs to close. There is no backend/API/runtime fetch,
// so the shell IS the app.
const CACHE_VERSION = 'pointliner-v5';

// ONE entry, not two. './' and './index.html' are different URLs holding identical bytes,
// so caching both made a first visit pull the whole ~3.4 MB document twice over on top of
// the page load itself — measured at the server, three full transfers for one visit. The
// navigate handler reads this single entry whichever URL was navigated to.
// Relative URL: the app is served from a subpath (/pointliner/), so the SW scope is its
// own directory and './index.html' resolves inside it.
const SHELL = './index.html';
// Not required. One missing optional asset must never cost the offline shell (see install).
const OPTIONAL = ['./icon.svg'];

// How long a navigation waits for the network before serving the cached shell instead.
// THIS IS THE CASE .catch() CANNOT SEE. A dead link rejects and the fallback runs; a link
// that is merely SLOW never rejects, so without a timer the cached copy is never reached
// and every open on a weak connection re-downloads the entire app. Measured on a throttled
// link with a fully warm cache: time-to-usable was identical to having no service worker
// at all, while reading the same bytes back out of the cache took ~0 ms.
// Long enough that a healthy connection always wins the race (so the live build is what
// you get), short enough that a bad one does not strand you on a blank page.
const NET_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  // Take over as soon as installed so the first visit can go offline immediately.
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // The shell is REQUIRED, and addAll is what makes that true: it rejects if the fetch
    // fails, which fails the install, which means this version never activates and the
    // activate handler below never deletes the previous cache. So a precache that dies on
    // a flaky link leaves the last WORKING offline copy in place and retries next visit.
    //
    // This was allSettled for every entry, and that is a defect with teeth: a precache in
    // which every fetch failed still resolved, install reported success, activate then
    // deleted the old cache, and the app was left with no offline copy at all — silently,
    // until the next load on a good connection. Reproduced: the cache went from
    // ['/', '/index.html', '/icon.svg'] to ['/icon.svg'] and offline open then failed outright.
    await cache.addAll([SHELL]);
    // The icon is genuinely optional, so it keeps the tolerant path.
    await Promise.allSettled(OPTIONAL.map((url) => cache.add(url)));
  })());
});

self.addEventListener('activate', (event) => {
  // Drop old caches from previous versions, then claim open clients. Reaching here at all
  // means install succeeded, which now means the shell is genuinely cached — that coupling
  // is what stops this line from deleting a working copy and leaving nothing behind it.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;            // never intercept non-GET (nothing to cache)
  // waitUntil throws once the event has settled, which is exactly the late-refresh case
  // below (the network answering after the cached copy was already served). Best-effort by
  // design: if the SW is torn down first, the next open simply refreshes it instead.
  const keepAlive = (p) => { try { event.waitUntil(p); } catch (_) { /* event already done */ } };

  // Navigations (opening the app, refresh): NETWORK-FIRST — the live build wins whenever it
  // answers in time, and the cache is reached only when the network fails or exceeds
  // NET_TIMEOUT_MS. This is the freshness model described up top. Do not "fix" this into
  // cache-first: that is what traps an installed copy on a stale build. The timeout is not
  // cache-first — the network still leads and still wins every healthy race.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const net = fetch(req).then(async (res) => {
        if (!res || !res.ok) return res;      // a real error goes through untouched
        // READ THE BODY TO COMPLETION, and race THAT. This is the whole trick, and racing
        // fetch() alone is the trap: fetch resolves as soon as the HEADERS land, so a race
        // on it measures the handshake and never the download. On ordinary weak cellular —
        // headers in 300 ms, body crawling behind them — the network "wins" instantly and
        // the page still takes seven seconds. Measured exactly that way before this line.
        const body = await res.arrayBuffer();
        // Rebuild with only the content type. NOT res.headers: the body above is already
        // decoded, while the headers still say `content-encoding: gzip` (which every real
        // host sends, this app's included) and carry the COMPRESSED content-length. Copying
        // them hands the browser a decoded body labelled as compressed.
        const make = () => new Response(body, {
          status: res.status,
          statusText: res.statusText,
          headers: { 'content-type': res.headers.get('content-type') || 'text/html; charset=utf-8' },
        });
        // A completed download always refreshes the shell, even when the race was already
        // lost and this arrived too late to be shown: a fallback served later is then the
        // newest build the network ever actually delivered. Only ok responses get this far,
        // so a 503 or a captive-portal page can never overwrite a working offline copy.
        keepAlive(caches.open(CACHE_VERSION).then((c) => c.put(SHELL, make())).catch(() => {}));
        return make();
      });
      // The race may discard `net` entirely (cache answered first), and a mobile link that dies
      // mid-download then rejects it with nobody listening — an unhandled rejection inside the
      // worker, in exactly the flaky-connection case this handler exists for. This attaches a
      // handler without consuming the promise: the catch arm below can still fall back to it.
      net.catch(() => {});
      let timer;
      try {
        return await Promise.race([
          net,
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('slow network')), NET_TIMEOUT_MS);
          }),
        ]);
      } catch (_) {
        // Failed or too slow. Serve the cached shell; with nothing cached, hand back the
        // real network result (and its real error) rather than inventing one.
        return (await caches.match(SHELL)) || net;
      } finally {
        clearTimeout(timer);
      }
    })());
    return;
  }
  // Everything else (the icon, etc.): cache-first, fall back to network.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
