// Never keep stale HTML pointing to deleted Next.js build hashes.
const CACHE_NAME = 'everrae-public-v2';
const PUBLIC_ASSETS = ['/manifest.json', '/favicon.ico', '/icons/icon-192.png', '/icons/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key === 'wedding-planner-v1' || (key.startsWith('everrae-public-') && key !== CACHE_NAME))
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Only public home HTML: no authenticated pages, API data or query tokens.
  const publicNavigation = request.mode === 'navigate' && url.pathname === '/' && !url.search;
  const staticAsset = !url.search && (PUBLIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/images/'));
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (publicNavigation && response.ok && response.headers.get('content-type')?.includes('text/html')) {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = publicNavigation ? await cache.match(request) : undefined;
        return cached || new Response('EverRae is offline. Reconnect to open this page.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
  } else if (staticAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    })());
  }
});
