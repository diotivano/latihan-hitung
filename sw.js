// Service worker: aplikasi bisa dibuka tanpa internet setelah kunjungan pertama.
// Semua path relatif agar berjalan di GitHub Pages (subpath /<repo>/) maupun domain root.
// Naikkan nomor VERSION setiap kali index.html, style.css, atau app.js diubah.
const VERSION = "v13";
const PREFIX = "hitung-dasar-";
const CACHE = PREFIX + VERSION;
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(PREFIX) && k !== CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function networkFirstWithTimeout(e, req, cacheKeys, allowCache) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (r) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const fallback = () =>
      cacheKeys.reduce(
        (p, k) => p.then((hit) => hit || caches.match(k, { ignoreSearch: true })),
        Promise.resolve(undefined)
      );

    const timer = setTimeout(() => {
      fallback().then((hit) => {
        if (hit) finish(hit);
      });
    }, 3500);

    const net = fetch(req)
      .then((res) => {
        clearTimeout(timer);
        if (res && res.ok && allowCache) {
          const clones = cacheKeys.map(() => res.clone());
          e.waitUntil(
            caches
              .open(CACHE)
              .then((c) => Promise.all(cacheKeys.map((k, idx) => c.put(k, clones[idx]))))
          );
        }
        finish(res);
        return res;
      })
      .catch((err) => {
        clearTimeout(timer);
        fallback().then((hit) => {
          if (hit) finish(hit);
          else if (!settled) {
            settled = true;
            reject(err);
          }
        });
      });

    e.waitUntil(net.catch(() => {}));
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const basePath = new URL("./", self.location).pathname;
  if (!url.pathname.startsWith(basePath)) return;

  if (req.mode === "navigate") {
    const isAppPage =
      url.pathname === basePath || url.pathname === basePath + "index.html";
    e.respondWith(networkFirstWithTimeout(e, req, ["./", "./index.html"], isAppPage));
    return;
  }

  if (url.pathname === basePath + "style.css" || url.pathname === basePath + "app.js") {
    const rel = "./" + url.pathname.slice(basePath.length);
    e.respondWith(networkFirstWithTimeout(e, req, [rel], true));
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req))
  );
});
