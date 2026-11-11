/* TSK ARŞİV · çevrimdışı açılış: uygulamanın kendisi ve kütüphaneler telefonda saklanır.
   Veriler (GitHub API) asla önbelleğe alınmaz; onlar zaten uygulamanın kendi cihaz deposunda durur. */
const AD = "tsk-arsiv-v6";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(AD).then(c => c.addAll(["./", "./manifest.webmanifest", "./icon-v5-192.png", "./fonts/LiberationSerif-Regular.ttf", "./fonts/LiberationSerif-Bold.ttf", "./fonts/LiberationSans-Regular.ttf", "./fonts/LiberationSans-Bold.ttf"])).catch(() => {})); });
self.addEventListener("activate", e => e.waitUntil((async () => { for(const k of await caches.keys()) if(k !== AD) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener("fetch", e => {
  const r = e.request; if(r.method !== "GET") return; const u = new URL(r.url);
  if(u.hostname === "api.github.com") return;
  if(u.origin === location.origin && /\/(fonts|yazi)\/[^/]+\.ttf$/.test(u.pathname)){   // yazı tipleri değişmez: önce saklanan
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if(res.ok){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; }))); return; }
  if(u.origin === location.origin && r.mode === "navigate"){   /* sayfa: telefonda saklanan kopya HEMEN açılır; yeni sürüm arka planda iner.
       İnince açık sayfaya "yeni-surum" haberi gider (sayfa "Yeni sürüm hazır · Yenile" gösterir). Saklanan yoksa internetten gelir. */
    e.respondWith((async () => {
      const c = await caches.open(AD), m = await c.match("./");
      const ag = fetch(r, { cache: "no-cache" }).then(async res => {
        if(res.ok && res.type === "basic"){ const eT = m && (m.headers.get("etag") || m.headers.get("last-modified")), yT = res.headers.get("etag") || res.headers.get("last-modified");
          await c.put("./", res.clone());
          if(m && eT && yT && eT !== yT){ for(const k of await self.clients.matchAll({ type: "window" })) k.postMessage({ tip: "yeni-surum" }); } }
        return res; });
      if(m){ e.waitUntil(ag.catch(() => {})); return m; }
      return ag.catch(() => caches.match("./"));
    })()); return; }
  if(u.origin === location.origin){   // önce internet, yoksa saklanan
    e.respondWith(fetch(r, { cache: "no-cache" }).then(res =>   /* tarayıcı önbelleğindeki eski sürümü değil, sunucudakini al */ { if(res.ok && !u.search){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("./"))));
    return; }
  if(/(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)){   // kütüphaneler: önce saklanan
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if(res.ok || res.type === "opaque"){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; }))); }
});
