"use strict";

const APP_VERSION = "v10";
const CACHE_NAME = `wallet-${APP_VERSION}`;
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./app.js?v=10",
  "./styles.css",
  "./styles.css?v=10",
  "./manifest.json",
  "./version.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./barcodes/data.json",
  "./barcodes/lenta.png",
  "./barcodes/okey.png",
  "./barcodes/x5.png",
  "./barcodes/auchan.png",
  "./barcodes/magnit.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}
