import fs from "node:fs/promises";
import path from "node:path";

const API=process.env.TOUHOUDb_API||"https://touhoudb.com/api";
const OUT=process.env.OUT_DIR||"touhou/data/full";
const WORKS_FILE=process.env.WORKS_FILE||"touhou/data/works.json";
let OFFICIAL_WORKS=[];
const PAGE_SIZE=Math.max(25,Math.min(100,Number(process.env.PAGE_SIZE)||100));
const SHARD_SIZE=Math.max(500,Math.min(2000,Number(process.env.SHARD_SIZE)||1000));
const CONCURRENCY=Math.max(1,Math.min(6,Number(process.env.CONCURRENCY)||3));
const WAIT_MS=Math.max(40,Number(process.env.WAIT_MS)||90);
const VIEW_CONCURRENCY=Math.max(1,Math.min(12,Number(process.env.VIEW_CONCURRENCY)||6));
const YOUTUBE_API_KEY=String(process.env.YOUTUBE_API_KEY||"").trim();
const FETCH_VIEWS=String(process.env.FETCH_VIEWS||"1")!=="0";
const NICO_API="https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search";
const ALLOWED=new Set(["youtube","niconico","soundcloud","piapro","bilibili","bandcamp"]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const arr=v=>Array.isArray(v)?v:[];
const clean=v=>String(v??"").trim();
const uniq=xs=>[...new Set(xs.filter(Boolean))];
const nameValue=x=>clean(x?.value||x?.name||x?.defaultName);
const norm=v=>clean(v).normalize("NFKC").toLowerCase().replace(/[\s\u3000\p{P}\p{S}]+/gu,"");
const OFFICIAL_COMPOSER_ALIASES=new Set([
  "zun","あきやまうに","秋山うに","u2","u2akiyama","uniakiyama","nkz","ziki7"
].map(norm));
function artistNorms(item){
  return uniq([
    ...artistNames(item),
    clean(item?.artistString),
    ...arr(item?.artists).map(x=>nameValue(x?.artist||x))
  ]).flatMap(x=>clean(x).split(/[,/・&]/)).map(norm).filter(Boolean);
}
function hasZunArtist(item){return artistNorms(item).includes(norm("ZUN"))}
function hasOfficialCollaborator(item){
  return artistNorms(item).some(x=>OFFICIAL_COMPOSER_ALIASES.has(x)&&x!==norm("ZUN"));
}
function matchesOfficialWork(item){
  if(!OFFICIAL_WORKS.length)return false;
  const names=[
    clean(item?.name),clean(item?.defaultName),clean(item?.additionalNames),albumName(item),
    ...arr(item?.tags).map(x=>nameValue(x?.tag||x)),
    ...arr(item?.names).map(nameValue)
  ].filter(Boolean).map(norm);
  return OFFICIAL_WORKS.some(w=>{
    const aliases=[w.title,w.tag,...arr(w.aliases)].filter(Boolean).map(norm);
    return aliases.some(a=>a&&names.some(n=>n.includes(a)||a.includes(n)));
  });
}

function artistRoles(item){
  const out={arranger:[],vocal:[],lyricist:[],composer:[],other:[]};
  for(const row of arr(item?.artists)){
    const name=nameValue(row?.artist||row);if(!name)continue;
    const role=clean(row?.effectiveRoles||row?.roles||row?.categories||row?.artist?.artistType).toLowerCase();
    if(/arrang/.test(role))out.arranger.push(name);
    else if(/vocal|singer/.test(role))out.vocal.push(name);
    else if(/lyric/.test(role))out.lyricist.push(name);
    else if(/composer/.test(role))out.composer.push(name);
    else out.other.push(name);
  }
  for(const k of Object.keys(out))out[k]=uniq(out[k]);
  return out;
}
function artistNames(item){return arr(item?.artists).map(x=>nameValue(x?.artist||x)).filter(Boolean)}
function albumName(item){const a=arr(item?.albums)[0];return nameValue(a?.album||a)||clean(item?.album?.name)}
function circleName(item,roles){
  for(const row of arr(item?.artists)){
    const name=nameValue(row?.artist||row);if(!name)continue;
    const kind=clean(row?.artist?.artistType||row?.categories||"").toLowerCase();
    if(/circle|label|producer/.test(kind))return name;
  }
  return roles.arranger[0]||artistNames(item)[0]||clean(item?.artistString);
}
function typeOf(item){
  const s=clean(item?.songType).toLowerCase();
  const parent=Number(item?.originalVersionId)||Number(item?.originalVersion?.id)||Number(item?.parentSongId)||0;
  const officialOriginal=s==="original"&&!parent&&(
    hasZunArtist(item)||
    (hasOfficialCollaborator(item)&&matchesOfficialWork(item))
  );
  return officialOriginal?0:1;
}
function yearOf(item){
  const p=clean(item?.publishDate||item?.createDate),y=Number(p.slice(0,4));
  if(y>1900&&y<2200)return y;
  const a=arr(item?.albums)[0],ay=Number(a?.album?.releaseDate?.year||a?.releaseDate?.year);
  return ay||0;
}
function serviceKey(service){
  const s=clean(service).toLowerCase();
  if(s.includes("youtube"))return"youtube";
  if(s.includes("niconico"))return"niconico";
  if(s.includes("soundcloud"))return"soundcloud";
  if(s.includes("piapro"))return"piapro";
  if(s.includes("bilibili"))return"bilibili";
  if(s.includes("bandcamp"))return"bandcamp";
  return"";
}
function safeUrl(v){
  try{const u=new URL(clean(v));return /^https?:$/.test(u.protocol)?u:null}catch{return null}
}
function providerFromUrl(v){
  const u=safeUrl(v);if(!u)return"";
  const h=u.hostname.toLowerCase().replace(/^www\./,"").replace(/^m\./,"");
  if(h==="youtu.be"||h==="youtube.com"||h.endsWith(".youtube.com"))return"youtube";
  if(h==="nicovideo.jp"||h.endsWith(".nicovideo.jp")||h==="nico.ms")return"niconico";
  if(h==="soundcloud.com"||h.endsWith(".soundcloud.com"))return"soundcloud";
  if(h==="piapro.jp"||h.endsWith(".piapro.jp"))return"piapro";
  if(h==="bilibili.com"||h.endsWith(".bilibili.com")||h==="b23.tv")return"bilibili";
  if(h==="bandcamp.com"||h.endsWith(".bandcamp.com"))return"bandcamp";
  return"";
}
function idFromUrl(provider,v){
  const u=safeUrl(v);if(!u)return"";
  if(provider==="youtube"){
    if(u.hostname.toLowerCase().includes("youtu.be"))return clean(u.pathname.split("/").filter(Boolean)[0]);
    return clean(u.searchParams.get("v")||u.pathname.match(/\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1]);
  }
  if(provider==="niconico")return clean(u.pathname.match(/\/watch\/([^/?#]+)/)?.[1]||u.pathname.split("/").filter(Boolean)[0]);
  if(provider==="piapro")return clean(u.pathname.match(/\/content\/([^/?#]+)/)?.[1]);
  if(provider==="bilibili")return clean(u.pathname.match(/\/video\/(BV[0-9A-Za-z]+|av\d+)/i)?.[1]||u.searchParams.get("aid"));
  return"";
}
function media(item){
  const out=[],seen=new Set();
  const add=(provider,id,url,name)=>{
    if(!ALLOWED.has(provider))return;
    id=clean(id);url=clean(url);
    const key=provider+":"+(id||url);if((!id&&!url)||seen.has(key))return;
    seen.add(key);out.push([provider,id,url,clean(name)]);
  };
  for(const pv of arr(item?.pvs)){
    const provider=serviceKey(pv?.service)||providerFromUrl(pv?.url);
    add(provider,clean(pv?.pvId)||idFromUrl(provider,pv?.url),pv?.url,pv?.name);
  }
  for(const link of arr(item?.webLinks)){
    const url=clean(link?.url||link?.value||link);
    const provider=providerFromUrl(url);if(!provider)continue;
    add(provider,idFromUrl(provider,url),url,link?.description||link?.name||"WebLink");
  }
  return out;
}

function mediaKey(p){return clean(p?.[0])+":"+clean(p?.[1]||p?.[2])}
function uniqueMediaIds(tracks,provider){
  const out=[],seen=new Set();
  for(const t of tracks)for(const p of arr(t?.p)){
    if(p?.[0]!==provider)continue;
    const id=clean(p?.[1]);if(!id||seen.has(id))continue;
    seen.add(id);out.push(id);
  }
  return out;
}
async function mapLimit(items,limit,fn){
  const out=new Array(items.length);let cursor=0;
  const worker=async()=>{
    while(true){
      const i=cursor++;if(i>=items.length)return;
      try{out[i]=await fn(items[i],i)}catch(e){out[i]=null}
    }
  };
  await Promise.all(Array.from({length:Math.max(1,Math.min(limit,items.length||1))},worker));
  return out;
}
async function fetchYoutubeViews(ids){
  const map=new Map();
  if(!YOUTUBE_API_KEY||!ids.length)return map;
  const chunks=[];for(let i=0;i<ids.length;i+=50)chunks.push(ids.slice(i,i+50));
  await mapLimit(chunks,VIEW_CONCURRENCY,async(group,idx)=>{
    const p=new URLSearchParams({part:"statistics",id:group.join(","),key:YOUTUBE_API_KEY});
    const r=await fetch("https://www.googleapis.com/youtube/v3/videos?"+p.toString(),{headers:{"Accept":"application/json","User-Agent":"TouhouDive-ViewIndex/1.0"}});
    if(!r.ok)throw new Error("YouTube HTTP "+r.status);
    const d=await r.json();
    for(const item of arr(d?.items)){
      const id=clean(item?.id),v=Number(item?.statistics?.viewCount);
      if(id&&Number.isFinite(v)&&v>=0)map.set(id,v);
    }
    if(idx%100===0)console.log("youtube view chunks",idx,"/",chunks.length);
  });
  return map;
}
async function fetchNicoViews(ids){
  const map=new Map();
  if(!ids.length)return map;
  const chunks=[];for(let i=0;i<ids.length;i+=20)chunks.push(ids.slice(i,i+20));
  await mapLimit(chunks,Math.min(VIEW_CONCURRENCY,6),async(group,idx)=>{
    const p=new URLSearchParams();
    p.set("q",group.join(" OR "));
    p.set("targets","contentId");
    p.set("fields","contentId,viewCounter");
    p.set("_sort","-viewCounter");
    p.set("_limit","100");
    p.set("_offset","0");
    p.set("_context","touhoudive_full_view_index");
    const r=await fetch(NICO_API+"?"+p.toString(),{headers:{"Accept":"application/json","User-Agent":"TouhouDive-ViewIndex/1.0"}});
    if(!r.ok)throw new Error("Nico HTTP "+r.status);
    const d=await r.json();
    for(const item of arr(d?.data)){
      const id=clean(item?.contentId),v=Number(item?.viewCounter);
      if(id&&Number.isFinite(v)&&v>=0)map.set(id,v);
    }
    if(idx%100===0)console.log("nico view chunks",idx,"/",chunks.length);
  });
  return map;
}
async function fetchBilibiliViews(ids){
  const map=new Map();
  if(!ids.length)return map;
  await mapLimit(ids,Math.min(VIEW_CONCURRENCY,5),async(id,idx)=>{
    const raw=clean(id);
    const qs=/^BV/i.test(raw)?"bvid="+encodeURIComponent(raw):"aid="+encodeURIComponent(raw.replace(/^av/i,""));
    const r=await fetch("https://api.bilibili.com/x/web-interface/view?"+qs,{
      headers:{"Accept":"application/json","User-Agent":"Mozilla/5.0 TouhouDive/1.0","Referer":"https://www.bilibili.com/"}
    });
    if(!r.ok)return;
    const d=await r.json();
    const v=Number(d?.data?.stat?.view);
    if(Number.isFinite(v)&&v>=0)map.set(raw,v);
    if(idx%100===0)console.log("bilibili views",idx,"/",ids.length);
    await sleep(20);
  });
  return map;
}
async function enrichPlatformViews(tracks){
  const coverage={providers:{},tracks:0,media:0,youtubeKeyConfigured:!!YOUTUBE_API_KEY};
  if(!FETCH_VIEWS)return coverage;
  const youtubeIds=uniqueMediaIds(tracks,"youtube");
  const nicoIds=uniqueMediaIds(tracks,"niconico");
  const biliIds=uniqueMediaIds(tracks,"bilibili");
  console.log("view candidates",{youtube:youtubeIds.length,niconico:nicoIds.length,bilibili:biliIds.length,youtubeKey:!!YOUTUBE_API_KEY});
  const [youtube,niconico,bilibili]=await Promise.all([
    fetchYoutubeViews(youtubeIds),
    fetchNicoViews(nicoIds),
    fetchBilibiliViews(biliIds)
  ]);
  const maps={youtube,niconico,bilibili};
  const trackSet=new Set();
  for(const t of tracks){
    let any=false;
    for(const p of arr(t.p)){
      const m=maps[p?.[0]],id=clean(p?.[1]);
      if(!m||!id||!m.has(id))continue;
      p[4]=m.get(id);
      coverage.media++;any=true;
      coverage.providers[p[0]]=(coverage.providers[p[0]]||0)+1;
    }
    if(any){coverage.tracks++;trackSet.add(t.i)}
  }
  return coverage;
}
function platformViewStats(t){
  const seen=new Set(),byProvider=new Map();
  let total=0,max=0,mediaCount=0;
  for(const p of arr(t?.p)){
    const key=mediaKey(p);if(!key||seen.has(key))continue;seen.add(key);
    const views=Number(p?.[4]);
    if(!Number.isFinite(views)||views<0)continue;
    const provider=clean(p?.[0]);mediaCount++;
    total+=views;max=Math.max(max,views);
    byProvider.set(provider,(byProvider.get(provider)||0)+views);
  }
  return{total,max,platforms:byProvider.size,mediaCount,byProvider};
}
function viewSignal(t){
  const v=platformViewStats(t);
  if(!v.mediaCount)return 0;
  return Math.log10(v.total+1)*12+Math.log10(v.max+1)*4+Math.min(3,v.platforms)*2;
}
function compact(item){
  const id=Number(item?.id)||0,roles=artistRoles(item),type=typeOf(item);
  const aliases=uniq([...arr(item?.names).map(nameValue),...clean(item?.additionalNames).split(/[,、]/).map(x=>x.trim())]);
  const artistString=clean(item?.artistString)||artistNames(item).join(", ");
  const title=clean(item?.name||item?.defaultName||aliases[0]||("TouhouDB #"+id));
  const original=Number(item?.originalVersionId)||Number(item?.originalVersion?.id)||Number(item?.parentSongId)||0;
  const tags=uniq(arr(item?.tags).map(x=>nameValue(x?.tag||x)).filter(Boolean)).slice(0,12);
  return{
    i:id,t:type,k:clean(item?.songType),n:title,x:aliases.slice(0,8),y:yearOf(item),o:original,
    c:type?circleName(item,roles):(artistString||"ZUN"),a:artistString,l:albumName(item),
    g:tags,ar:roles,p:media(item),
    r:Number(item?.ratingScore)||0,f:Number(item?.favoritedTimes)||0,h:Number(item?.hitCount)||Number(item?.hits)||0,
    th:clean(item?.thumbUrl||item?.mainPicture?.urlThumb||item?.mainPicture?.urlSmallThumb||item?.mainPicture?.urlOriginal)
  };
}
async function fetchPage(start,pageSize=PAGE_SIZE,attempt=0){
  const p=new URLSearchParams({
    start:String(start),maxResults:String(pageSize),getTotalCount:"true",nameMatchMode:"Partial",
    fields:"AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Albums,MainPicture,WebLinks",
    lang:"Japanese",sort:"RatingScore"
  });
  const url=API+"/songs?"+p;
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),45000);
  try{
    const res=await fetch(url,{signal:ctl.signal,headers:{Accept:"application/json","User-Agent":"TouhouDive-Full-Index/1.0"}});
    if(!res.ok){
      if((res.status===429||res.status>=500)&&attempt<6){await sleep(1000*Math.pow(2,attempt));return fetchPage(start,pageSize,attempt+1)}
      if(res.status===400&&pageSize>50&&attempt===0)return fetchPage(start,50,1);
      throw new Error("HTTP "+res.status+" @ start="+start);
    }
    return await res.json();
  }catch(err){
    if(attempt<6){await sleep(900*Math.pow(2,attempt));return fetchPage(start,pageSize,attempt+1)}
    throw err;
  }finally{clearTimeout(timer)}
}
async function main(){
  try{OFFICIAL_WORKS=JSON.parse(await fs.readFile(WORKS_FILE,"utf8"))}catch(e){console.warn("works registry unavailable",e?.message||e);OFFICIAL_WORKS=[]}
  console.log("official work registry",OFFICIAL_WORKS.length);
  await fs.rm(OUT,{recursive:true,force:true});await fs.mkdir(OUT,{recursive:true});
  const first=await fetchPage(0),total=Number(first?.totalCount)||0;
  if(!total)throw new Error("TouhouDB returned no totalCount");
  const firstItems=arr(first?.items),actualPage=Math.max(1,firstItems.length);
  console.log("TouhouDB total",total,"page",actualPage);
  const pages=Math.ceil(total/actualPage),results=new Array(pages);
  results[0]=firstItems.map(compact);
  let cursor=1,done=firstItems.length;
  const worker=async()=>{
    while(true){
      const page=cursor++;if(page>=pages)return;
      const start=page*actualPage,d=await fetchPage(start,actualPage);
      results[page]=arr(d?.items).map(compact);done+=results[page].length;
      if(page%25===0)console.log("fetched",done,"/",total);
      await sleep(WAIT_MS);
    }
  };
  await Promise.all(Array.from({length:CONCURRENCY},worker));
  let tracks=results.flat().filter(x=>x?.i);
  const viewCoverage=await enrichPlatformViews(tracks);
  console.log("view coverage",viewCoverage);
  const byId=new Map(tracks.map(x=>[x.i,x]));
  const relations=new Map(),childCircles=new Map(),childAlbums=new Map(),childMedia=new Map();
  for(const t of tracks){
    if(!t.o)continue;
    relations.set(t.o,(relations.get(t.o)||0)+1);
    if(t.c){
      if(!childCircles.has(t.o))childCircles.set(t.o,new Set());
      childCircles.get(t.o).add(t.c);
    }
    if(t.l){
      if(!childAlbums.has(t.o))childAlbums.set(t.o,new Set());
      childAlbums.get(t.o).add(t.l);
    }
    if(t.p?.length)childMedia.set(t.o,(childMedia.get(t.o)||0)+1);
  }
  const popularity=t=>{
    const rating=Math.max(0,Number(t.r)||0),fav=Math.max(0,Number(t.f)||0),hits=Math.max(0,Number(t.h)||0);
    const providers=new Set((t.p||[]).map(x=>x?.[0]).filter(Boolean)).size;
    return rating*5+Math.log10(fav+1)*18+Math.log10(hits+1)*6+Math.min(4,providers)*2+viewSignal(t);
  };
  const influence=t=>{
    if(t.t)return 0;
    const children=relations.get(t.i)||0,circles=childCircles.get(t.i)?.size||0,albums=childAlbums.get(t.i)?.size||0,mediaChildren=childMedia.get(t.i)||0;
    return Math.log10(children+1)*34+Math.log10(circles+1)*22+Math.log10(albums+1)*14+Math.log10(mediaChildren+1)*6;
  };
  const composite=t=>popularity(t)+influence(t);
  const byComposite=[...tracks].sort((a,b)=>composite(b)-composite(a)||popularity(b)-popularity(a)||b.r-a.r||a.i-b.i);
  byComposite.forEach((t,idx)=>{t.q=idx+1;t.s=Math.round(composite(t)*100)/100});
  const byPopularity=[...tracks].sort((a,b)=>popularity(b)-popularity(a)||b.r-a.r||a.i-b.i);
  byPopularity.forEach((t,idx)=>{t.qp=idx+1;t.sp=Math.round(popularity(t)*100)/100});
  const originals=tracks.filter(t=>!t.t).sort((a,b)=>influence(b)-influence(a)||popularity(b)-popularity(a)||a.i-b.i);
  originals.forEach((t,idx)=>{
    t.qi=idx+1;t.si=Math.round(influence(t)*100)/100;
    t.dc=relations.get(t.i)||0;t.dsc=childCircles.get(t.i)?.size||0;t.da=childAlbums.get(t.i)?.size||0;t.dm=childMedia.get(t.i)||0;
  });
  const withViews=tracks.filter(t=>platformViewStats(t).mediaCount>0).sort((a,b)=>viewSignal(b)-viewSignal(a)||platformViewStats(b).total-platformViewStats(a).total||a.i-b.i);
  withViews.forEach((t,idx)=>{
    const v=platformViewStats(t);
    t.qv=idx+1;t.sv=Math.round(viewSignal(t)*100)/100;t.vt=v.total;t.vm=v.max;t.vp=v.platforms;t.vc=v.mediaCount;
  });
  tracks=byComposite;
  const LOOKUP_BUCKET_SIZE=1000;
  const lookupDir=path.join(OUT,"lookup");
  await fs.mkdir(lookupDir,{recursive:true});
  const lookupBuckets=new Map();
  for(const t of tracks){
    const bucket=Math.floor((Number(t.i)||0)/LOOKUP_BUCKET_SIZE);
    if(!lookupBuckets.has(bucket))lookupBuckets.set(bucket,[]);
    const viewMedia=arr(t.p).filter(p=>Number.isFinite(Number(p?.[4]))).map(p=>[p[0],p[1],p[2],p[3],Number(p[4])]);
    lookupBuckets.get(bucket).push([
      t.i,t.q||0,t.s||0,t.qp||0,t.sp||0,t.qi||0,t.si||0,t.qv||0,t.sv||0,
      t.vt||0,t.vm||0,t.vp||0,t.vc||0,t.dc||0,t.dsc||0,t.da||0,t.dm||0,viewMedia
    ]);
  }
  for(const [bucket,rows] of lookupBuckets){
    const name="lookup-"+String(bucket).padStart(4,"0")+".json";
    await fs.writeFile(path.join(lookupDir,name),JSON.stringify(rows));
  }
  const providers={},counts={original:0,arrangement:0,mediaCandidates:0};
  for(const t of tracks){
    t.t?counts.arrangement++:counts.original++;
    if(t.p.length)counts.mediaCandidates++;
    for(const p of t.p)providers[p[0]]=(providers[p[0]]||0)+1;
  }
  const shardCount=Math.ceil(tracks.length/SHARD_SIZE),files=[];
  for(let i=0;i<shardCount;i++){
    const name="shard-"+String(i).padStart(3,"0")+".json";
    const part=tracks.slice(i*SHARD_SIZE,(i+1)*SHARD_SIZE);
    await fs.writeFile(path.join(OUT,name),JSON.stringify(part));
    files.push({file:name,start:i*SHARD_SIZE,count:part.length});
  }
  const manifest={
    schema:2,source:"TouhouDB",api:API,generatedAt:new Date().toISOString(),
    totalCount:total,indexed:tracks.length,shardSize:SHARD_SIZE,shardCount,files,
    counts,providers,allowedProviders:[...ALLOWED],
    viewCoverage:{...viewCoverage,rankedTracks:tracks.filter(t=>Number(t.qv)>0).length,supportedProviders:["youtube","niconico","bilibili"]},
    lookup:{path:"lookup",bucketSize:LOOKUP_BUCKET_SIZE,bucketCount:lookupBuckets.size,format:"[id,q,s,qp,sp,qi,si,qv,sv,vt,vm,vp,vc,dc,dsc,da,dm,viewMedia]"},
    ranking:{
      version:3,
      composite:"popularity + original influence",
      popularity:"rating*5 + log10(favorites+1)*18 + log10(hits+1)*6 + media-provider bonus + verified platform view signal",
      views:"log10(sum verified views+1)*12 + log10(max video views+1)*4 + verified-platform bonus",
      influence:"official original only: derivative tracks + distinct circles + distinct albums + playable derivative bonus"
    },
    classification:{
      original:"SongType Original AND no parent AND (ZUN artist OR official collaborator + official-work match)",
      secondary:"all other TouhouDB entries, including fan originals and derivative entries"
    }
  };
  await fs.writeFile(path.join(OUT,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
  console.log(JSON.stringify(manifest,null,2));
}
main().catch(err=>{console.error(err);process.exit(1)});