const CACHE_NAME = 'epub-s2tw-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/worker.js',
  '/epub-s2tw_web.py',
  '/icon.png',
  '/icon-192.png',
  '/icon-180.png',
  '/style.css',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.asm.wasm',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/python_stdlib.zip',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.asm.js',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/micropip-0.5.0-py3-none-any.whl',
  'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/packaging-23.1-py3-none-any.whl',
  'https://pypi.org/simple/opencc-python-reimplemented/',
  'https://files.pythonhosted.org/packages/30/6b/055b7806f320cc8f2cdf23c5f70221c0dc1683fca9ffaf76dfc2ad4b91b6/opencc_python_reimplemented-0.1.7-py2.py3-none-any.whl',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
        });
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
