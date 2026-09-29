const CACHE="touhoudive-v0.6.0";
const CORE=[
  "./","./index.html",
  "./styles.css?v=0.6.0","./app.js?v=0.6.0","./catalog.js?v=0.6.0","./media.js?v=0.6.0",
  "./data/originals.json","./data/works.json","./data/archive-sources.json","./data/arrangements.json","./data/schema.json",
  "./manifest.webmanifest","./icon.svg","./version.json"
];
self.addEventListener("install",e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())
));
self.addEventListener("activate",e=>e.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  const isShell=/\.(?:html|css|js)$/.test(u.pathname)||u.pathname.endsWith("/touhou/")||u.pathname.endsWith("/touhou");
  const network=()=>fetch(e.request,isShell?{cache:"no-cache"}:undefined).then(r=>{
    const copy=r.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy));
    return r;
  });
  e.respondWith(network().catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});