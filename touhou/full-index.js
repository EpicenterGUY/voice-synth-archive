(function(){
"use strict";
const BASE="./data/full/";
let manifestCache=null,works=[];
const lookupCache=new Map();
const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
function inferWork(r){
  const hay=[r.l,...arr(r.g),r.n,...arr(r.x)].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
  return works.find(w=>[w.title,w.tag,...(w.aliases||[])].some(v=>v&&hay.includes(String(v).normalize("NFKC").toLowerCase())))||null;
}
function mediaOf(p){
  const provider=clean(p?.[0]),id=clean(p?.[1]),url=clean(p?.[2]),name=clean(p?.[3]),viewCount=Number(p?.[4]);
  if(!provider||(!id&&!url))return null;
  const numeric=/^\d+$/.test(id);
  const embeddable=
    provider==="soundcloud"?!!url:
    provider==="youtube"||provider==="niconico"||provider==="piapro"?!!id:
    provider==="bilibili"?numeric:
    provider==="bandcamp"?numeric:false;
  return{provider,id,url,name,viewCount:Number.isFinite(viewCount)&&viewCount>=0?viewCount:null,mode:embeddable?"embed":"external"};
}
function relationCategory(r){
  const raw=clean(r?.k).toLowerCase();
  if(!r?.t)return"official-original";
  if(raw==="original")return"fan-original";
  if(/rearrangement/.test(raw))return"rearrangement";
  if(/remix/.test(raw))return"remix";
  if(/cover/.test(raw))return"cover";
  if(/remaster/.test(raw))return"remaster";
  if(/instrumental|off.?vocal/.test(raw))return"instrumental";
  if(/mashup/.test(raw))return"mashup";
  if(/short/.test(raw))return"short-version";
  if(/arrangement/.test(raw))return"arrangement";
  return"other-related";
}
function toTrack(r){
  const work=inferWork(r),mediaCandidates=arr(r.p).map(mediaOf).filter(Boolean);
  const search=[r.n,...arr(r.x),r.c,r.a,r.l,...arr(r.g),r.k].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
  const rawType=clean(r.k),category=relationCategory(r);
  const type=category==="official-original"?"original":category==="fan-original"?"fan-original":"arrangement";
  return{
    id:"tdb-"+r.i,touhoudbId:Number(r.i)||0,type,category,songTypeRaw:rawType,
    title:clean(r.n)||("TouhouDB #"+r.i),aliases:arr(r.x),year:Number(r.y)||null,
    work:work?.title||"",workId:work?.id||"",workIds:work?[work.id]:[],
    role:category==="official-original"?"Official Original":category==="fan-original"?"Fan Original":rawType||"Touhou Related",character:"",
    circle:clean(r.c)||(r.t?"":"ZUN"),album:clean(r.l),moods:arr(r.g),
    originalIds:r.o?["tdb-"+r.o]:[],artists:r.ar||{},artistString:clean(r.a),
    media:mediaCandidates[0]||null,mediaCandidates,
    thumb:clean(r.th),source:{name:"TouhouDB",url:"https://touhoudb.com/S/"+r.i},
    ratingScore:Number(r.r)||0,favoritedTimes:Number(r.f)||0,hitCount:Number(r.h)||0,
    globalRank:Number(r.q)||null,globalScore:Number(r.s)||0,
    popularityRank:Number(r.qp)||null,popularityScore:Number(r.sp)||0,
    influenceRank:Number(r.qi)||null,influenceScore:Number(r.si)||0,
    viewRank:Number(r.qv)||null,viewScore:Number(r.sv)||0,viewTotal:Number(r.vt)||0,viewMax:Number(r.vm)||0,viewPlatformCount:Number(r.vp)||0,viewMediaCount:Number(r.vc)||0,
    derivativeCount:Number(r.dc)||0,derivativeCircleCount:Number(r.dsc)||0,derivativeAlbumCount:Number(r.da)||0,derivativeMediaCount:Number(r.dm)||0,
    _search:search,remote:true,fullIndex:true
  };
}
async function manifest(force=false){
  if(manifestCache&&!force)return manifestCache;
  // The manifest is the generation pointer. Never let a service-worker/browser
  // cache pin the app to an older dataset after a successful index rebuild.
  const url=BASE+"manifest.json?fresh="+Date.now();
  const res=await fetch(url,{cache:"no-store"});
  if(!res.ok)throw new Error("full index manifest HTTP "+res.status);
  const data=await res.json();
  if(!data?.indexed||!Array.isArray(data.files))throw new Error("invalid full index manifest");
  manifestCache=data;return data;
}
async function prepareCache(meta){
  const key="touhoudive:full-index:generation";
  const prev=localStorage.getItem(key);
  if(prev&&prev!==meta.generatedAt&&"caches" in window){
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith("touhoudive-full-index")).map(k=>caches.delete(k)));
    }catch(_){}
    lookupCache.clear();
  }
  localStorage.setItem(key,meta.generatedAt||"");
}
async function fetchShard(file,generation,expectedCount=0){
  const url=BASE+file+"?g="+encodeURIComponent(generation||"");
  let res=await fetch(url,{cache:"default"});
  if(!res.ok)throw new Error(file+" HTTP "+res.status);
  let rows=await res.json();
  if(expectedCount&&arr(rows).length!==expectedCount){
    try{
      if("caches" in window){
        const cache=await caches.open("touhoudive-full-index");
        await cache.delete(new URL(url,location.href).href);
      }
    }catch(_){}
    const repair=url+"&repair="+Date.now();
    res=await fetch(repair,{cache:"no-store"});
    if(!res.ok)throw new Error(file+" repair HTTP "+res.status);
    rows=await res.json();
  }
  if(expectedCount&&arr(rows).length!==expectedCount)throw new Error(file+" row mismatch "+arr(rows).length+"/"+expectedCount);
  return arr(rows).map(toTrack);
}
async function lookupBucket(bucket,meta){
  if(lookupCache.has(bucket))return lookupCache.get(bucket);
  const cfg=meta?.lookup;if(!cfg?.path||!cfg?.bucketSize)return [];
  const file="lookup-"+String(bucket).padStart(4,"0")+".json";
  const url=BASE+cfg.path+"/"+file+"?g="+encodeURIComponent(meta.generatedAt||"");
  const promise=fetch(url,{cache:"default"}).then(async res=>{
    if(res.status===404)return [];
    if(!res.ok)throw new Error(file+" HTTP "+res.status);
    return arr(await res.json());
  }).catch(()=>[]);
  lookupCache.set(bucket,promise);
  return promise;
}
function statsFromLookupRow(r){
  if(!Array.isArray(r)||!r.length)return null;
  return{
    touhoudbId:Number(r[0])||0,
    globalRank:Number(r[1])||null,globalScore:Number(r[2])||0,
    popularityRank:Number(r[3])||null,popularityScore:Number(r[4])||0,
    influenceRank:Number(r[5])||null,influenceScore:Number(r[6])||0,
    viewRank:Number(r[7])||null,viewScore:Number(r[8])||0,
    viewTotal:Number(r[9])||0,viewMax:Number(r[10])||0,viewPlatformCount:Number(r[11])||0,viewMediaCount:Number(r[12])||0,
    derivativeCount:Number(r[13])||0,derivativeCircleCount:Number(r[14])||0,derivativeAlbumCount:Number(r[15])||0,derivativeMediaCount:Number(r[16])||0,
    viewMedia:arr(r[17]).map(mediaOf).filter(Boolean)
  };
}
async function lookupStats(id){
  const n=Number(String(id||"").replace(/^tdb-/,""));if(!n)return null;
  const meta=await manifest(),cfg=meta?.lookup;if(!cfg?.bucketSize)return null;
  const bucket=Math.floor(n/Number(cfg.bucketSize));
  const rows=await lookupBucket(bucket,meta);
  const row=rows.find(x=>Number(x?.[0])===n);
  return statsFromLookupRow(row);
}
async function enrichTrack(track){
  if(!track)return track;
  const stats=await lookupStats(track.touhoudbId||track.id);
  if(!stats)return track;
  const media=[...(track.mediaCandidates||[])],index=new Map();
  media.forEach((m,i)=>index.set((m?.provider||"")+":"+(m?.id||m?.url||""),i));
  for(const m of stats.viewMedia||[]){
    const key=(m?.provider||"")+":"+(m?.id||m?.url||"");
    if(index.has(key)){
      const i=index.get(key);media[i]={...media[i],...m,viewCount:Math.max(Number(media[i]?.viewCount)||0,Number(m.viewCount)||0)};
    }else{index.set(key,media.length);media.push(m)}
  }
  const out={...track,...stats,mediaCandidates:media};
  delete out.viewMedia;
  if(out.media){
    const key=(out.media.provider||"")+":"+(out.media.id||out.media.url||"");
    const rich=media[index.get(key)];
    if(rich)out.media={...out.media,...rich};
  }else if(media.length)out.media=media[0];
  return out;
}
async function loadAll(opts={}){
  const meta=await manifest(!!opts.force),files=meta.files.slice();
  await prepareCache(meta);
  const chunks=new Array(files.length);
  let cursor=0,loaded=0,completed=0;
  const concurrency=Math.max(1,Math.min(6,Number(opts.concurrency)||4));
  const worker=async()=>{
    while(true){
      const idx=cursor++;if(idx>=files.length)return;
      const rows=await fetchShard(files[idx].file,meta.generatedAt,Number(files[idx].count)||0);
      chunks[idx]=rows;loaded+=rows.length;completed++;
      opts.onProgress?.({loaded,total:meta.indexed,shards:completed,shardCount:files.length,manifest:meta});
    }
  };
  await Promise.all(Array.from({length:concurrency},worker));
  return{manifest:meta,tracks:chunks.flat()};
}
function setWorks(v){works=Array.isArray(v)?v:[]}
window.TouhouFullIndex={manifest,loadAll,lookupStats,enrichTrack,toTrack,setWorks,base:BASE};
})();