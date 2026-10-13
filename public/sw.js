const CACHE = "spice-grille-v3";
const URLS = ["/", "/menu", "/cart"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => {
      return Promise.allSettled(URLS.map((u) =>
        fetch(u).then((r) => { if (r.ok) c.put(u, r); }).catch(() => {})
      ));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    ])
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Never intercept or cache admin, api, dispatcher, employee, auth, debug, or internal routes
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/employee") ||
    url.pathname.startsWith("/dispatcher") ||
    url.pathname.startsWith("/debug") ||
    url.pathname.startsWith("/auth") ||
    url.protocol.startsWith("chrome") ||
    url.protocol.startsWith("ws")
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r && r.status === 200 && r.type === "basic" && !r.bodyUsed) {
          try {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          } catch {}
        }
        return r;
      })
      .catch(async () => {
        try {
          const cached = await caches.match(e.request);
          if (cached) return cached;
          if (e.request.mode === "navigate") {
            const fallback = await caches.match("/");
            if (fallback) return fallback;
          }
        } catch {}
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      })
  );
});
