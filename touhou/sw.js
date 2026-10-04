const CACHE="touhoudive-v0.9.39";
const FULL_CACHE="touhoudive-full-index-v5";
const CORE=[
  "./","./index.html",
  "./styles.css?v=0.9.39","./app.js?v=0.9.39","./catalog.js?v=0.9.39","./media.js?v=0.9.39","./full-index.js?v=0.9.39",
  "./data/originals.json","./data/works.json","./data/archive-sources.json","./data/arrangements.json","./data/fan-originals.json","./data/fan-original-albums.json","./data/fan-youtube.json","./data/schema.json",
  "./manifest.webmanifest","./icon.svg","./version.json"
];
self.addEventListener("install",e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())
));
self.addEventListener("activate",e=>e.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==FULL_CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(u.pathname.includes("/touhou/data/full/")){
    const isManifest=u.pathname.endsWith("/manifest.json");
    if(isManifest){
      e.respondWith(
        fetch(e.request,{cache:"no-store"}).catch(()=>caches.match(e.request))
      );
      return;
    }
    e.respondWith(
      caches.open(FULL_CACHE).then(async cache=>{
        const hit=await cache.match(e.request);
        if(hit)return hit;
        const r=await fetch(e.request);
        if(r.ok)cache.put(e.request,r.clone());
        return r;
      }).catch(()=>fetch(e.request))
    );
    return;
  }
  const isShell=/\.(?:html|css|js)$/.test(u.pathname)||u.pathname.endsWith("/touhou/")||u.pathname.endsWith("/touhou");
  const network=()=>fetch(e.request,isShell?{cache:"no-cache"}:undefined).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
  });
  e.respondWith(network().catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});