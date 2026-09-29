import fs from "node:fs/promises";
import path from "node:path";

const API=process.env.TOUHOUDb_API||"https://touhoudb.com/api";
const OUT=process.env.OUT_DIR||"touhou/data/full";
const PAGE_SIZE=Math.max(25,Math.min(100,Number(process.env.PAGE_SIZE)||100));
const SHARD_SIZE=Math.max(500,Math.min(2000,Number(process.env.SHARD_SIZE)||1000));
const CONCURRENCY=Math.max(1,Math.min(6,Number(process.env.CONCURRENCY)||3));
const WAIT_MS=Math.max(40,Number(process.env.WAIT_MS)||90);
const ALLOWED=new Set(["youtube","niconico","soundcloud","piapro","bilibili","bandcamp"]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const arr=v=>Array.isArray(v)?v:[];
const clean=v=>String(v??"").trim();
const uniq=xs=>[...new Set(xs.filter(Boolean))];
const nameValue=x=>clean(x?.value||x?.name||x?.defaultName);

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
  return /arrangement|remix|cover|remaster|instrumental|mashup/.test(s)?1:0;
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
function compact(item){
  const id=Number(item?.id)||0,roles=artistRoles(item),type=typeOf(item);
  const aliases=uniq([...arr(item?.names).map(nameValue),...clean(item?.additionalNames).split(/[,、]/).map(x=>x.trim())]);
  const artistString=clean(item?.artistString)||artistNames(item).join(", ");
  const title=clean(item?.name||item?.defaultName||aliases[0]||("TouhouDB #"+id));
  const original=Number(item?.originalVersionId)||Number(item?.originalVersion?.id)||Number(item?.parentSongId)||0;
  const tags=uniq(arr(item?.tags).map(x=>nameValue(x?.tag||x)).filter(Boolean)).slice(0,12);
  return{
    i:id,t:type,n:title,x:aliases.slice(0,8),y:yearOf(item),o:original,
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
  const byId=new Map(tracks.map(x=>[x.i,x])),relations=new Map();
  for(const t of tracks)if(t.o)relations.set(t.o,(relations.get(t.o)||0)+1);
  const score=t=>t.r*4+Math.log10(t.f+1)*14+Math.log10(t.h+1)*4+(relations.get(t.i)||0)*3+(t.p.length?4:0);
  tracks.sort((a,b)=>score(b)-score(a)||b.r-a.r||a.i-b.i);
  tracks.forEach((t,idx)=>{t.q=idx+1;t.s=Math.round(score(t)*100)/100});
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
    schema:1,source:"TouhouDB",api:API,generatedAt:new Date().toISOString(),
    totalCount:total,indexed:tracks.length,shardSize:SHARD_SIZE,shardCount,files,
    counts,providers,allowedProviders:[...ALLOWED],ranking:"full-index composite score"
  };
  await fs.writeFile(path.join(OUT,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
  console.log(JSON.stringify(manifest,null,2));
}
main().catch(err=>{console.error(err);process.exit(1)});