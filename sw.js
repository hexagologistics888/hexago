/* ============================================================
   Hexa Go Logistics - Service Worker
   Strategy:
     - HTML pages: network-first with timeout, then cache, then offline fallback
     - CSS/JS: network-first with cache fallback
     - Other assets (images/fonts): cache-first with network fill
   ============================================================ */

const CACHE_NAME = 'hexago-v16';
const OFFLINE_PAGE = '/404.html';
const NAVIGATION_TIMEOUT_MS = 4000;

/* Resources pre-cached on install */
const PRECACHE = [
  '/',
  '/index.html',
  '/about_us.html',
  '/service.html',
  '/ftl.html',
  '/ptl.html',
  '/warehousing.html',
  '/fourpl.html',
  '/contact_us.html',
  '/careers.html',
  '/privacy_policy.html',
  '/404.html',
  '/styles.css',
  '/service-pages.css',
  '/enhancements.css',
  '/enhancements.js',
  '/script.js',
  '/mobile-nav.js',
  '/manifest.json',
  '/images/logo3.png',
  '/images/carousel1.jpeg',
  '/images/carousel2.jpg',
  '/images/carousel3.jpg',
  '/images/service-about.webp',
  '/images/service-warehousing.webp',
  '/images/service-supply-chain.webp',
  '/images/service-fleet.webp',
];

async function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, {
      signal: controller.signal,
      cache: 'no-store'
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/* Install: pre-cache core assets */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    for (const asset of PRECACHE) {
      try {
        await cache.add(asset);
      } catch (error) {
        if (asset === OFFLINE_PAGE) throw error;
      }
    }
  })());

  self.skipWaiting();
});

/* Activate: enable navigation preload and clear old caches */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }

    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
  })());

  self.clients.claim();
});

/* Fetch routing logic */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Only handle same-origin GET requests */
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHTML =
    request.mode === 'navigate' ||
    request.headers.get('Accept')?.includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/';
  const isCriticalAsset =
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  if (isHTML) {
    /* Network-first for HTML pages with timeout + offline fallback */
    event.respondWith((async () => {
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          await cacheResponse(request, preloadResponse);
          return preloadResponse;
        }

        const networkResponse = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
        await cacheResponse(request, networkResponse);
        return networkResponse;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedPage = await cache.match(request);
        if (cachedPage) return cachedPage;

        const offlineFallback = await cache.match(OFFLINE_PAGE);
        if (offlineFallback) return offlineFallback;

        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  if (isCriticalAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request, { cache: 'no-store' });
        await cacheResponse(request, response);
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        return Response.error();
      }
    })());
    return;
  }

  /* Cache-first for assets */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      await cacheResponse(request, response);
      return response;
    } catch (error) {
      if (request.destination === 'document') {
        return (await cache.match(OFFLINE_PAGE)) || Response.error();
      }
      return Response.error();
    }
  })());
});
