const SW_VERSION="26.0.1";
const CACHE_NAME="voice-synth-archive-shell-"+SW_VERSION;
const SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./changelog.json",
  "./icons/app-icon.svg",
  "./icons/app-icon-maskable.svg",
  "./detective-v11.js?v=11.5",
  "./detective-v12.js?v=12.0",
  "./detective-v13.js?v=13.0",
  "./detective-v14.js?v=14.0",
  "./detective-v16.js?v=19.0",
  "./discovery-v20.js?v=20.0",
  "./organizer-v22.js?v=22.0.1",
  "./smart-v23.js?v=23.0.0",
  "./playlist-v24.js?v=24.0.0",
  "./studio-ui-v25.js?v=25.0.0",
  "./main-ui-v26.js?v=26.0.1",
  "./pwa-v21.js?v=26.0.1"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(SHELL.map(url=>cache.add(new Request(url,{cache:"reload"}))));
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith("voice-synth-archive-shell-")&&n!==CACHE_NAME).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING")self.skipWaiting();
  if(event.data?.type==="GET_VERSION"&&event.source){
    event.source.postMessage({type:"SW_VERSION",version:SW_VERSION});
  }
});

async function networkFirst(request,fallback){
  try{
    const fresh=await fetch(new Request(request,{cache:"no-store"}));
    if(fresh&&fresh.ok){
      const cache=await caches.open(CACHE_NAME);
      cache.put(request,fresh.clone()).catch(()=>{});
    }
    return fresh;
  }catch{
    return (await caches.match(request)) || (fallback?await caches.match(fallback):null) || Response.error();
  }
}

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(url.pathname.endsWith("/changelog.json")||url.pathname.endsWith("/manifest.webmanifest")){
    event.respondWith(networkFirst(req));
    return;
  }

  if(req.mode==="navigate"){
    event.respondWith(networkFirst(req,"./index.html"));
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    const network=fetch(req).then(async res=>{
      if(res&&res.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(req,res.clone()).catch(()=>{});
      }
      return res;
    }).catch(()=>null);
    return cached || await network || Response.error();
  })());
});
