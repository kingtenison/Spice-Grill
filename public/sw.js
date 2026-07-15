const CACHE = "spice-grille-v1";
const URLS = ["/", "/menu", "/cart", "/login"];

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
  e.respondWith(
    fetch(e.request)
      .then((r) => { caches.open(CACHE).then((c) => c.put(e.request, r.clone())); return r; })
      .catch(() => caches.match(e.request))
  );
});
