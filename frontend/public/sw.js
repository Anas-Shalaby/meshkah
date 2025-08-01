const CACHE_NAME = "meshkah-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  "/icons/16x16.png",
  "/icons/32x32.png",
  "/icons/180x180.png",
  "/icons/192x192.png",
  "/icons/512-512-01.png",
  "/fonts/Foda-Free-Font.ttf",
  "/fonts/Ya-ModernPro-Bold.otf",
];

// Add specific font cache
const FONT_CACHE = "font-cache-v1";
const FONT_FILES = [
  "/fonts/Foda-Free-Font.ttf",
  "/fonts/Ya-ModernPro-Bold.otf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
      // Separate cache for fonts
      caches.open(FONT_CACHE).then((cache) => cache.addAll(FONT_FILES)),
      self.skipWaiting(),
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key !== FONT_CACHE) {
              return caches.delete(key);
            }
          })
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-HTTP(S) requests
  if (!request.url.startsWith("http")) {
    return;
  }

  // Special handling for font requests
  if (request.url.includes("/fonts/")) {
    event.respondWith(
      caches.match(request).then(
        (response) =>
          response ||
          fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(FONT_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
      )
    );
    return;
  }

  // Don't cache POST or DELETE requests
  if (request.method === "POST" || request.method === "DELETE") {
    return fetch(request);
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache if not a valid response or if it's not a GET request
          if (
            !response ||
            response.status !== 200 ||
            !response.url.startsWith("http") ||
            request.method !== "GET"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            // Only cache GET requests
            if (request.url.startsWith("http") && request.method === "GET") {
              cache.put(request, responseToCache);
            }
          });

          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});

// Handle updates
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
