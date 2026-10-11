// Beikost – Offline-Speicher der App-Dateien
const CACHE = "beikost-v2.0";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Mit Internet: neueste Version holen und merken. Ohne Internet: gemerkte Version.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(req, { signal: ctrl.signal, cache: "no-cache" });
      clearTimeout(t);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true })
        || (req.mode === "navigate" ? (await cache.match("./index.html")) || (await cache.match("./")) : null);
      return hit || Response.error();
    }
  })());
});
