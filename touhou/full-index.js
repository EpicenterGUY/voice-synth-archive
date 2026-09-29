(function(){
"use strict";
const BASE="./data/full/";
let manifestCache=null,works=[];
const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
function inferWork(r){
  const hay=[r.l,...arr(r.g),r.n,...arr(r.x)].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
  return works.find(w=>[w.title,w.tag,...(w.aliases||[])].some(v=>v&&hay.includes(String(v).normalize("NFKC").toLowerCase())))||null;
}
function mediaOf(p){
  const provider=clean(p?.[0]),id=clean(p?.[1]),url=clean(p?.[2]),name=clean(p?.[3]);
  if(!provider||(!id&&!url))return null;
  const numeric=/^\d+$/.test(id);
  const embeddable=
    provider==="soundcloud"?!!url:
    provider==="youtube"||provider==="niconico"||provider==="piapro"?!!id:
    provider==="bilibili"?numeric:
    provider==="bandcamp"?numeric:false;
  return{provider,id,url,name,mode:embeddable?"embed":"external"};
}
function toTrack(r){
  const work=inferWork(r),mediaCandidates=arr(r.p).map(mediaOf).filter(Boolean);
  const search=[r.n,...arr(r.x),r.c,r.a,r.l,...arr(r.g)].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
  return{
    id:"tdb-"+r.i,touhoudbId:Number(r.i)||0,type:r.t?"arrangement":"original",
    title:clean(r.n)||("TouhouDB #"+r.i),aliases:arr(r.x),year:Number(r.y)||null,
    work:work?.title||"",workId:work?.id||"",workIds:work?[work.id]:[],
    role:r.t?"Arrangement":"Original",character:"",
    circle:clean(r.c)||(r.t?"":"ZUN"),album:clean(r.l),moods:arr(r.g),
    originalIds:r.o?["tdb-"+r.o]:[],artists:r.ar||{},artistString:clean(r.a),
    media:mediaCandidates[0]||null,mediaCandidates,
    thumb:clean(r.th),source:{name:"TouhouDB",url:"https://touhoudb.com/S/"+r.i},
    ratingScore:Number(r.r)||0,favoritedTimes:Number(r.f)||0,hitCount:Number(r.h)||0,
    globalRank:Number(r.q)||null,globalScore:Number(r.s)||0,
    popularityRank:Number(r.qp)||null,popularityScore:Number(r.sp)||0,
    influenceRank:Number(r.qi)||null,influenceScore:Number(r.si)||0,
    derivativeCount:Number(r.dc)||0,derivativeCircleCount:Number(r.dsc)||0,derivativeAlbumCount:Number(r.da)||0,
    _search:search,remote:true,fullIndex:true
  };
}
async function manifest(force=false){
  if(manifestCache&&!force)return manifestCache;
  const url=BASE+"manifest.json"+(force?"?t="+Date.now():"");
  const res=await fetch(url,{cache:force?"no-store":"default"});
  if(!res.ok)throw new Error("full index manifest HTTP "+res.status);
  const data=await res.json();
  if(!data?.indexed||!Array.isArray(data.files))throw new Error("invalid full index manifest");
  manifestCache=data;return data;
}
async function prepareCache(meta){
  const key="touhoudive:full-index:generation";
  const prev=localStorage.getItem(key);
  if(prev&&prev!==meta.generatedAt&&"caches" in window){try{await caches.delete("touhoudive-full-index")}catch(_){}}
  localStorage.setItem(key,meta.generatedAt||"");
}
async function fetchShard(file,generation){
  const res=await fetch(BASE+file+"?g="+encodeURIComponent(generation||""),{cache:"default"});
  if(!res.ok)throw new Error(file+" HTTP "+res.status);
  const rows=await res.json();
  return arr(rows).map(toTrack);
}
async function loadAll(opts={}){
  const meta=await manifest(!!opts.force),files=meta.files.slice();
  await prepareCache(meta);
  const chunks=new Array(files.length);
  let cursor=0,loaded=0;
  const concurrency=Math.max(1,Math.min(6,Number(opts.concurrency)||4));
  const worker=async()=>{
    while(true){
      const idx=cursor++;if(idx>=files.length)return;
      const rows=await fetchShard(files[idx].file,meta.generatedAt);
      chunks[idx]=rows;loaded+=rows.length;
      opts.onProgress?.({loaded,total:meta.indexed,shards:idx+1,shardCount:files.length,manifest:meta});
    }
  };
  await Promise.all(Array.from({length:concurrency},worker));
  return{manifest:meta,tracks:chunks.flat()};
}
function setWorks(v){works=Array.isArray(v)?v:[]}
window.TouhouFullIndex={manifest,loadAll,toTrack,setWorks,base:BASE};
})();