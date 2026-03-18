/* Service Worker for PWA. Must be in root folder, and do not cache itself. */

const CACHE_NAME = 'epub-s2tw-v1.10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './js/app.js',
  './js/worker.js',
  './epub-s2tw.py',
  './assets/favicon.ico',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon.png',
  './assets/style.css',
  './js/packages/opencc_python_reimplemented-0.1.7-py2.py3-none-any.whl',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.asm.wasm',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/python_stdlib.zip',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.asm.js',
];

// Not used for now.
const CDN_PACKAGES = [
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/micropip-0.5.0-py3-none-any.whl',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/packaging-23.1-py3-none-any.whl',
  'https://files.pythonhosted.org/packages/30/6b/055b7806f320cc8f2cdf23c5f70221c0dc1683fca9ffaf76dfc2ad4b91b6/opencc_python_reimplemented-0.1.7-py2.py3-none-any.whl',
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Started caching resources...');

      // Create multiple `add` requests using map.
      const cachePromises = ASSETS_TO_CACHE.map((url) => {
        return cache.add(url).catch((error) => {
          console.warn(`[SW] Failed (and skipped) on caching: ${url}`, error);
        });
      });

      return Promise.all(cachePromises);
    }).then(() => {
      console.log('[SW] Install completed.');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
	self.skipWaiting();
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
	caches.keys().then(keys => Promise.all(
	    keys.map(key => key !== CACHE_NAME && caches.delete(key))
	)).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
	// Only cache http / https calls.
        const url = new URL(event.request.url);
        if (url.protocol.startsWith('http')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }

	// Do not cache unknown URLs like chrome-extension://
        return fetchResponse;
      });
    })
  );
});
