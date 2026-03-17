/* Service Worker for PWA. Must be in root folder. */

const CACHE_NAME = 'epub-s2tw-pwa-cache-v1.1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/worker.js',
  '/epub-s2tw.py',
  '/assets/icon.png',
  '/assets/icon-192.png',
  '/assets/icon-180.png',
  '/assets/style.css',
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
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // 關鍵修正：只快取 http 或 https 的請求
        const url = new URL(event.request.url);
        if (url.protocol.startsWith('http')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }

        // 如果是 chrome-extension 等，直接回傳不快取
        return fetchResponse;
      });
    })
  );
});
