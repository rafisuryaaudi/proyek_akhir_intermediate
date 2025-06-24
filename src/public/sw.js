const CACHE_NAME = "cerita-rafi-cache-v1";
const API_URL = "https://story-api.dicoding.dev/v1/";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.png",
  "/manifest.json",
  "/styles/styles.css",
  "/scripts/index.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  "https://unpkg.com/leaflet/dist/leaflet.css",
];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.url.startsWith(API_URL)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response dan simpan ke cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request);
      })
    );
  }
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");

  let notificationData = {};

  if (event.data) {
    notificationData = event.data.json();
  }

  const title = notificationData.title || "Notifikasi Baru";
  const options = {
    body: notificationData.body || "Kamu menerima notifikasi push.",
    data: notificationData.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
  );
});
