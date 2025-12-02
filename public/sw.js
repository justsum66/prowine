/**
 * Service Worker
 * 用於緩存靜態資源和提供離線支持
 */

const CACHE_NAME = "prowine-v1";
const STATIC_CACHE_NAME = "prowine-static-v1";
const DYNAMIC_CACHE_NAME = "prowine-dynamic-v1";

// 需要緩存的靜態資源
const STATIC_ASSETS = [
  "/",
  "/wines",
  "/wineries",
  "/about",
  "/contact",
  "/favicon.ico",
];

// 安裝 Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 攔截網絡請求
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== "GET") {
    return;
  }

  // 跳過外部資源
  if (url.origin !== self.location.origin) {
    return;
  }

  // 策略：緩存優先，網絡回退
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // 只緩存成功的響應
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // 網絡失敗時，如果是導航請求，返回離線頁面
          if (request.mode === "navigate") {
            return caches.match("/offline");
          }
        });
    })
  );
});
