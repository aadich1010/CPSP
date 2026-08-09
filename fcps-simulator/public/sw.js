/*
 * FCPS Part 1 CBT Simulator — Service Worker
 *
 * SECURITY NOTE (deliberate design):
 * This app is an authenticated, subscription-gated exam platform with
 * device-session control. Authenticated HTML, API responses and exam
 * payloads are NEVER written to CacheStorage — caching them would leave
 * question-bank content and session data readable on a shared device.
 *
 * We therefore cache ONLY:
 *   1. Content-hashed immutable build assets (/_next/static/*)
 *   2. Public static files we ship ourselves (icons, manifest)
 *   3. A single offline fallback page
 *
 * Everything else (navigations, /api/*, /auth/*, Supabase, exam data)
 * always goes to the network. The fetch handler still exists, which is
 * what makes the app installable as a standalone Android/iOS app.
 */

const VERSION = 'fcps-sw-v1';
const STATIC_CACHE = `${VERSION}-static`;
const ASSET_CACHE = `${VERSION}-assets`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

// ─── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // addAll is atomic: one 404 aborts everything. Add individually so a
      // single missing optional asset can never break the install.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
        )
      );
      await self.skipWaiting();
    })()
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// ─── HELPERS ──────────────────────────────────────────────────────
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/manifest.json' ||
    /^\/(icon-|apple-touch-icon)/.test(url.pathname) ||
    /\.(?:woff2?|ttf|otf|svg|png|jpe?g|webp|avif|ico)$/i.test(url.pathname)
  );
}

function isPrivatePath(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/admin/')
  );
}

// ─── FETCH ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever touch GET.
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Same-origin only — Supabase and any third party pass straight through.
  if (url.origin !== self.location.origin) return;

  // Never intercept auth / API / admin traffic.
  if (isPrivatePath(url)) return;

  // Range requests (media streaming) must not be served from cache.
  if (request.headers.has('range')) return;

  // 1. Immutable, public build assets → stale-while-revalidate.
  if (isImmutableAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(request);

        const network = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => null);

        return cached || (await network) || Response.error();
      })()
    );
    return;
  }

  // 2. Page navigations → always network. Offline page only as fallback.
  //    Authenticated HTML is intentionally never stored.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse;
          if (preloaded) return preloaded;
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return (
            offline ||
            new Response('You are offline.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        }
      })()
    );
    return;
  }

  // 3. Everything else → untouched network behaviour.
});
