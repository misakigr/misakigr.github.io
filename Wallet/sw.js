const CACHE_NAME = "wallet-pwa-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./fonts/Manrope-Cyrillic.woff2",
  "./fonts/Manrope-Latin.woff2",
  "./fonts/SpaceGrotesk-500.woff2",
  "./fonts/SpaceGrotesk-700.woff2",
  "./libs/html5-qrcode.min.js",
  "./barcodes/lenta.svg",
  "./barcodes/okey.svg",
  "./barcodes/x5.svg",
  "./barcodes/mvideo.svg",
  "./barcodes/auchan.svg",
  "./barcodes/health.svg",
  "./barcodes/placeholder.svg",
  "./barcodes/data.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isDocument = event.request.mode === "navigate" || event.request.destination === "document";

  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(event.request)) ||
            (await caches.match("./index.html")) ||
            Response.error()
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response && (response.ok || response.type === "opaque")) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetched;
    })
  );
});
