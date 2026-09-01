const CACHE_NAME = "ielts-pass-shell-2026-09-01-cross-platform-install-1";
const APP_SCOPE = new URL("./", self.registration.scope);
const scopedPath = (path) => new URL(path, APP_SCOPE).pathname;
const OFFLINE_DOCUMENT = scopedPath("__ielts-pass-offline-document__");
const APP_SHELL = [
  scopedPath("manifest.webmanifest"),
  scopedPath("favicon.svg"),
  scopedPath("icon-192.png"),
  scopedPath("icon-512.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith(scopedPath("api/"))) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(OFFLINE_DOCUMENT, copy));
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(OFFLINE_DOCUMENT);
        if (cached) return cached;
        return new Response(
          "<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>IELTS Pass</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f6f8;color:#211e31;font:16px system-ui}.card{width:min(82vw,360px);padding:32px;border-radius:24px;background:white;box-shadow:0 20px 60px #211e3118}.mark{color:#5b54d6;font-weight:800;letter-spacing:.12em}h1{font-size:24px}p{color:#706d76;line-height:1.7}button{border:0;border-radius:12px;padding:12px 18px;color:white;background:#5b54d6;font-weight:700}</style><main class=\"card\"><span class=\"mark\">IELTS PASS</span><h1>暂时无法连接</h1><p>请检查网络后重试。已完成的学习进度仍保存在这台设备中。</p><button onclick=\"location.reload()\">重新连接</button></main></html>",
          { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      })
    );
    return;
  }

  if (["style", "script", "image", "font", "audio"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
