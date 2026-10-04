(function(){
"use strict";
const BASE="./data/full/";
let manifestCache=null,works=[],fanVideoOverlay=null;
const lookupCache=new Map(),circleSearchCache=new Map(),beginnerSearchCache=new Map(),derivedSearchCache=new Map(),querySearchCache=new Map();
const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
async function loadFanVideoOverlay(force=false){
  if(fanVideoOverlay&&!force)return fanVideoOverlay;
  try{
    const res=await fetch("./data/fan-youtube.json?fresh="+Date.now(),{cache:"no-store"});
    if(!res.ok)throw new Error("fan video overlay HTTP "+res.status);
    const data=await res.json();
    fanVideoOverlay=data&&typeof data==="object"?data:{items:{}};
  }catch(_){fanVideoOverlay={items:{}}}
  return fanVideoOverlay;
}
function fanOverlayMedia(id){
  const row=fanVideoOverlay?.items?.["tdb-"+String(id)];
  if(!row?.videoId||row.videoUnavailable||row.embeddable===false)return null;
  return{
    provider:"youtube",id:clean(row.videoId),
    url:"https://www.youtube.com/watch?v="+encodeURIComponent(clean(row.videoId)),
    name:clean(row.videoTitle)||"YouTube",
    viewCount:Number.isFinite(Number(row.viewCount))?Number(row.viewCount):null,
    likeCount:Number.isFinite(Number(row.likeCount))?Number(row.likeCount):null,
    commentCount:Number.isFinite(Number(row.commentCount))?Number(row.commentCount):null,
    mode:"embed",fallbackMatch:true
  };
}
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
  const fallback=fanOverlayMedia(r.i);
  if(fallback&&!mediaCandidates.some(m=>m.provider==="youtube"&&m.id===fallback.id))mediaCandidates.unshift(fallback);
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
  await loadFanVideoOverlay(force);
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
async function fetchShardRows(file,generation,expectedCount=0){
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
  return arr(rows);
}
async function fetchShard(file,generation,expectedCount=0){
  return (await fetchShardRows(file,generation,expectedCount)).map(toTrack);
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
function normCircle(v){
  return clean(v).normalize("NFKC").toLowerCase().replace(/[\s\u3000&＋+・_.\-—:：'"“”‘’()[\]{}]+/g,"");
}
function rawCircleHay(r){
  const artists=r?.ar&&typeof r.ar==="object"?Object.values(r.ar).flat():[];
  return [r?.c,r?.a,r?.l,...artists].filter(Boolean).map(normCircle).join(" ");
}
async function searchByCircleAliases(aliases,opts={}){
  const list=arr(aliases).map(normCircle).filter(Boolean);
  if(!list.length)return{tracks:[],total:0,manifest:await manifest()};
  const meta=await manifest(!!opts.force);
  await prepareCache(meta);
  const key=meta.generatedAt+"|"+list.slice().sort().join("|");
  if(circleSearchCache.has(key)&&!opts.force)return circleSearchCache.get(key);
  const promise=(async()=>{
    const files=meta.files.slice(),hits=[];
    let cursor=0,scanned=0;
    const concurrency=Math.max(1,Math.min(5,Number(opts.concurrency)||3));
    const worker=async()=>{
      while(true){
        const idx=cursor++;if(idx>=files.length)return;
        const cfg=files[idx];
        const rows=await fetchShardRows(cfg.file,meta.generatedAt,Number(cfg.count)||0);
        for(const r of rows){
          const hay=rawCircleHay(r);
          if(list.some(term=>hay.includes(term)))hits.push(r);
        }
        scanned+=rows.length;
        opts.onProgress?.({scanned,total:meta.indexed,hits:hits.length,shards:idx+1,shardCount:files.length});
      }
    };
    await Promise.all(Array.from({length:concurrency},worker));
    const tracks=hits.map(toTrack);
    return{manifest:meta,tracks,total:tracks.length};
  })();
  circleSearchCache.set(key,promise);
  try{return await promise}catch(err){circleSearchCache.delete(key);throw err}
}
function rawMediaProviders(r){
  return new Set(arr(r?.p).map(p=>clean(p?.[0])).filter(Boolean));
}
function rawHasVideo(r){
  const providers=rawMediaProviders(r);
  return providers.has("youtube")||providers.has("niconico")||providers.has("bilibili");
}
function rawHasExplicitMv(r){
  return arr(r?.p).some(p=>{
    const provider=clean(p?.[0]),name=clean(p?.[3]),url=clean(p?.[2]);
    if(!["youtube","niconico","bilibili"].includes(provider))return false;
    return /(?:^|\b)(?:mv|pv)(?:\b|$)|music\s*video|official\s*(?:video|mv|pv)|公式(?:mv|pv|動画|映像)|ミュージック(?:ビデオ|ビデオ)|映像作品/i.test(name+" "+url);
  });
}
function rawTitleHay(r){
  return [r?.n,...arr(r?.x)].filter(Boolean).map(normCircle).join(" ");
}
function normSearch(v){
  return clean(v).normalize("NFKC").toLowerCase().replace(/[\s\u3000\p{P}\p{S}]+/gu,"");
}
function searchTokens(v){
  return clean(v).normalize("NFKC").toLowerCase().split(/[\s\u3000\p{P}\p{S}]+/u).map(normSearch).filter(Boolean);
}
function searchBigrams(v){
  const s=normSearch(v),out=[];if(s.length<2)return out;
  for(let i=0;i<s.length-1;i++)out.push(s.slice(i,i+2));
  return [...new Set(out)];
}
function rawSearchScore(r,query){
  const q=clean(query),qn=normSearch(q);if(!qn)return 0;
  const names=[r?.n,...arr(r?.x)].filter(Boolean).map(normSearch).filter(Boolean);
  if(names.some(x=>x===qn))return 1000;
  if(names.some(x=>x.startsWith(qn)))return 930;
  if(names.some(x=>x.includes(qn)))return 890;
  const meta=normSearch([r?.n,...arr(r?.x),r?.c,r?.a,r?.l,...arr(r?.g),r?.k].filter(Boolean).join(" "));
  if(meta.includes(qn))return 780;
  const tokens=searchTokens(q);
  if(tokens.length>1&&tokens.every(x=>meta.includes(x)))return 710;
  if(qn.length>=4){
    const grams=searchBigrams(qn);let best=0;
    for(const name of names){
      let hit=0;for(const g of grams)if(name.includes(g))hit++;
      best=Math.max(best,grams.length?hit/grams.length:0);
    }
    if(best>=.82)return 640+Math.round(best*40);
    if(qn.length>=6&&best>=.68)return 560+Math.round(best*40);
  }
  return 0;
}
async function searchByQuery(query,opts={}){
  const q=clean(query),qn=normSearch(q),limit=Math.max(40,Math.min(600,Number(opts.limit)||260));
  const meta=await manifest(!!opts.force);
  if(!qn)return{manifest:meta,tracks:[],total:0,scanned:0};
  await prepareCache(meta);
  const key=meta.generatedAt+"|query:"+qn+"|"+limit;
  if(querySearchCache.has(key)&&!opts.force)return querySearchCache.get(key);
  const promise=(async()=>{
    const files=meta.files.slice(),hits=[];
    let cursor=0,scanned=0,completed=0;
    const concurrency=Math.max(1,Math.min(5,Number(opts.concurrency)||3));
    const worker=async()=>{
      while(true){
        const idx=cursor++;if(idx>=files.length)return;
        const cfg=files[idx],rows=await fetchShardRows(cfg.file,meta.generatedAt,Number(cfg.count)||0);
        for(const r of rows){
          const score=rawSearchScore(r,q);
          if(score>0)hits.push({r,score});
        }
        scanned+=rows.length;completed++;
        opts.onProgress?.({scanned,total:meta.indexed,hits:hits.length,shards:completed,shardCount:files.length});
      }
    };
    await Promise.all(Array.from({length:concurrency},worker));
    hits.sort((a,b)=>b.score-a.score||(Number(a.r?.qp)||1e12)-(Number(b.r?.qp)||1e12)||(Number(a.r?.q)||1e12)-(Number(b.r?.q)||1e12));
    const picked=hits.slice(0,limit).map(x=>{const t=toTrack(x.r);t.searchRelevance=x.score;return t});
    return{manifest:meta,tracks:picked,total:hits.length,scanned};
  })();
  querySearchCache.set(key,promise);
  try{return await promise}catch(err){querySearchCache.delete(key);throw err}
}

function rawBeginnerRankScore(r){
  const gr=Number(r?.q)||0,pr=Number(r?.qp)||0,vr=Number(r?.qv)||0,views=Math.max(0,Number(r?.vt)||0);
  let score=0;
  if(gr>0)score+=Math.max(0,72-Math.log10(gr+1)*14);
  if(pr>0)score+=Math.max(0,78-Math.log10(pr+1)*15);
  if(vr>0)score+=Math.max(0,62-Math.log10(vr+1)*12);
  if(views>0)score+=Math.min(38,Math.log10(views+1)*6);
  return score;
}

async function searchByOriginalId(originalId,opts={}){
  const id=Number(String(originalId||"").replace(/^tdb-/,""));
  const meta=await manifest(!!opts.force);
  if(!id)return{manifest:meta,tracks:[],total:0,scanned:0};
  await prepareCache(meta);
  const key=meta.generatedAt+"|original:"+id;
  if(derivedSearchCache.has(key)&&!opts.force)return derivedSearchCache.get(key);
  const promise=(async()=>{
    const files=meta.files.slice(),hits=[];
    let cursor=0,scanned=0,completed=0;
    const concurrency=Math.max(1,Math.min(6,Number(opts.concurrency)||4));
    const worker=async()=>{
      while(true){
        const idx=cursor++;if(idx>=files.length)return;
        const cfg=files[idx],rows=await fetchShardRows(cfg.file,meta.generatedAt,Number(cfg.count)||0);
        for(const r of rows)if(Number(r?.o)===id)hits.push(r);
        scanned+=rows.length;completed++;
        opts.onProgress?.({scanned,total:meta.indexed,hits:hits.length,shards:completed,shardCount:files.length});
      }
    };
    await Promise.all(Array.from({length:concurrency},worker));
    const tracks=hits.map(toTrack);
    tracks.sort((a,b)=>
      (Number(a.popularityRank)||1e12)-(Number(b.popularityRank)||1e12)||
      (Number(b.popularityScore)||0)-(Number(a.popularityScore)||0)||
      String(a.title||"").localeCompare(String(b.title||""),"ja")
    );
    return{manifest:meta,tracks,total:tracks.length,scanned};
  })();
  derivedSearchCache.set(key,promise);
  try{return await promise}catch(err){derivedSearchCache.delete(key);throw err}
}

async function searchBeginnerCandidates(opts={}){
  const meta=await manifest(!!opts.force);
  await prepareCache(meta);
  const titleSeeds=arr(opts.titleSeeds).map(normCircle).filter(Boolean);
  const circleAliases=arr(opts.circleAliases).map(normCircle).filter(Boolean);
  const limit=Math.max(300,Math.min(6000,Number(opts.limit)||3200));
  const key=meta.generatedAt+"|"+limit+"|"+titleSeeds.slice().sort().join(",")+"|"+circleAliases.slice().sort().join(",");
  if(beginnerSearchCache.has(key)&&!opts.force)return beginnerSearchCache.get(key);
  const promise=(async()=>{
    const files=meta.files.slice(),candidates=[];
    let cursor=0,scanned=0;
    const concurrency=Math.max(1,Math.min(5,Number(opts.concurrency)||3));
    const worker=async()=>{
      while(true){
        const idx=cursor++;if(idx>=files.length)return;
        const cfg=files[idx],rows=await fetchShardRows(cfg.file,meta.generatedAt,Number(cfg.count)||0);
        for(const r of rows){
          const titleHay=rawTitleHay(r),circleHay=rawCircleHay(r);
          const iconic=titleSeeds.some(x=>x&&titleHay.includes(x));
          const knownCircle=circleAliases.some(x=>x&&circleHay.includes(x));
          const video=rawHasVideo(r),explicitMv=rawHasExplicitMv(r);
          const gr=Number(r?.q)||0,pr=Number(r?.qp)||0,vr=Number(r?.qv)||0;
          const official=!r?.t;
          const ranked=(gr>0&&gr<=40000)||(pr>0&&pr<=40000)||(vr>0&&vr<=40000);
          const videoRanked=video&&((gr>0&&gr<=80000)||(pr>0&&pr<=80000)||(vr>0&&vr<=80000));
          if(!(iconic||knownCircle||official||ranked||videoRanked))continue;
          let score=rawBeginnerRankScore(r);
          if(explicitMv)score+=125;
          else if(video)score+=72;
          if(iconic)score+=100;
          if(knownCircle)score+=46;
          if(official)score+=30;
          const providers=rawMediaProviders(r);
          if(providers.has("youtube"))score+=10;
          if(providers.has("niconico"))score+=9;
          if(providers.has("bilibili"))score+=7;
          score+=Math.min(12,providers.size*3);
          candidates.push({r,score,explicitMv,video});
        }
        scanned+=rows.length;
        opts.onProgress?.({scanned,total:meta.indexed,candidates:candidates.length,shards:idx+1,shardCount:files.length});
      }
    };
    await Promise.all(Array.from({length:concurrency},worker));
    candidates.sort((a,b)=>b.score-a.score||(Number(a.r?.qp)||9999999)-(Number(b.r?.qp)||9999999)||(Number(a.r?.q)||9999999)-(Number(b.r?.q)||9999999));
    const picked=candidates.slice(0,limit).map(x=>{
      const t=toTrack(x.r);
      t.beginnerIndexScore=x.score;
      t.beginnerExplicitMv=!!x.explicitMv;
      t.beginnerVideo=!!x.video;
      return t;
    });
    return{
      manifest:meta,tracks:picked,total:picked.length,
      explicitMv:picked.filter(x=>x.beginnerExplicitMv).length,
      video:picked.filter(x=>x.beginnerVideo).length,
      scanned:meta.indexed
    };
  })();
  beginnerSearchCache.set(key,promise);
  try{return await promise}catch(err){beginnerSearchCache.delete(key);throw err}
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
window.TouhouFullIndex={manifest,loadAll,lookupStats,enrichTrack,toTrack,setWorks,loadFanVideoOverlay,searchByCircleAliases,searchByQuery,searchByOriginalId,searchBeginnerCandidates,base:BASE};
})();