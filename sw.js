/* TSK ARŞİV · çevrimdışı açılış: uygulamanın kendisi ve kütüphaneler telefonda saklanır.
   Veriler (GitHub API) asla önbelleğe alınmaz; onlar zaten uygulamanın kendi cihaz deposunda durur. */
const AD = "tsk-arsiv-v3";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(AD).then(c => c.addAll(["./", "./manifest.webmanifest", "./icon-v3-192.png"])).catch(() => {})); });
self.addEventListener("activate", e => e.waitUntil((async () => { for(const k of await caches.keys()) if(k !== AD) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener("fetch", e => {
  const r = e.request; if(r.method !== "GET") return; const u = new URL(r.url);
  if(u.hostname === "api.github.com") return;
  if(u.origin === location.origin){   // önce internet, yoksa saklanan
    e.respondWith(fetch(r, { cache: "no-cache" }).then(res =>   /* tarayıcı önbelleğindeki eski sürümü değil, sunucudakini al */ { if(res.ok && !u.search){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("./"))));
    return; }
  if(/(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)){   // kütüphaneler: önce saklanan
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if(res.ok || res.type === "opaque"){ const c = res.clone(); caches.open(AD).then(x => x.put(r, c)); } return res; }))); }
});
