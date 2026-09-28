(function(){
"use strict";
const API="https://touhoudb.com/api";
const TTL=20*60*1000;
const cache=new Map();
let workRegistry=[];

function arr(v){return Array.isArray(v)?v:[]}
function clean(v){return String(v??"").trim()}
function uniq(xs){return [...new Set(xs.filter(Boolean))]}
function nameValue(x){return clean(x?.value||x?.name||x?.defaultName)}
function parseYoutubeId(v){
  const s=clean(v); if(!s)return"";
  if(/^[A-Za-z0-9_-]{11}$/.test(s))return s;
  try{const u=new URL(s);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];return u.searchParams.get("v")||u.pathname.match(/\/embed\/([^/?#]+)/)?.[1]||""}catch{return""}
}
function parseNicoId(v){
  const s=clean(v);if(/^(sm|nm|so)\d+$/i.test(s))return s;
  try{const u=new URL(s);return u.pathname.match(/\/watch\/([^/?#]+)/)?.[1]||""}catch{return""}
}
function artistNames(item){
  return arr(item?.artists).map(x=>nameValue(x?.artist||x)).filter(Boolean);
}
function artistRoles(item){
  const out={arranger:[],vocal:[],lyricist:[],composer:[],other:[]};
  for(const row of arr(item?.artists)){
    const name=nameValue(row?.artist||row); if(!name)continue;
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
function tags(item){
  return uniq(arr(item?.tags).map(x=>nameValue(x?.tag||x)).filter(Boolean)).slice(0,18);
}
function inferWorks(item){
  const hay=[...tags(item),albumName(item),clean(item?.name),clean(item?.defaultName),clean(item?.additionalNames)].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
  return workRegistry.filter(w=>[w.title,w.tag,...(w.aliases||[])].some(v=>v&&hay.includes(String(v).normalize("NFKC").toLowerCase())));
}
function albumName(item){
  const a=arr(item?.albums)[0];
  return nameValue(a?.album||a)||clean(item?.album?.name);
}
function circleName(item,roles){
  for(const row of arr(item?.artists)){
    const name=nameValue(row?.artist||row);if(!name)continue;
    const kind=clean(row?.artist?.artistType||row?.categories||"").toLowerCase();
    if(/circle|label|producer/.test(kind))return name;
  }
  return roles.arranger[0]||artistNames(item)[0]||clean(item?.artistString);
}
function bestMedia(item){
  const pvs=arr(item?.pvs);
  const yt=pvs.find(p=>/youtube/i.test(clean(p?.service))&&(p?.pvId||p?.url));
  if(yt){const id=parseYoutubeId(yt.pvId||yt.url);if(id)return{provider:"youtube",id,url:yt.url||("https://www.youtube.com/watch?v="+id)}}
  const nico=pvs.find(p=>/niconico/i.test(clean(p?.service))&&(p?.pvId||p?.url));
  if(nico){const id=parseNicoId(nico.pvId||nico.url);if(id)return{provider:"niconico",id,url:nico.url||("https://www.nicovideo.jp/watch/"+id)}}
  return null;
}
function yearFrom(item){
  const p=clean(item?.publishDate||item?.createDate);
  const y=Number(p.slice(0,4)); if(y>1900&&y<2200)return y;
  const a=arr(item?.albums)[0];
  const ay=Number(a?.album?.releaseDate?.year||a?.releaseDate?.year);
  return ay||null;
}
function trackType(item){
  const s=clean(item?.songType).toLowerCase();
  return /arrangement|remix|cover|remaster|instrumental|mashup/.test(s)?"arrangement":"original";
}
function toTrack(item){
  const id=Number(item?.id)||0;
  const roles=artistRoles(item);
  const type=trackType(item);
  const originalVersionId=Number(item?.originalVersionId)||Number(item?.parentSongId)||0;
  const aliases=uniq([
    ...arr(item?.names).map(nameValue),
    ...clean(item?.additionalNames).split(/[,、]/).map(x=>x.trim())
  ]);
  const artistString=clean(item?.artistString)||artistNames(item).join(", ");
  const title=clean(item?.name||item?.defaultName||aliases[0]||("TouhouDB #"+id));
  const media=bestMedia(item);
  const works=inferWorks(item);
  return {
    id:"tdb-"+id,
    touhoudbId:id,
    type,
    title,
    aliases,
    year:yearFrom(item),
    work:works[0]?.title||"",
    workId:works[0]?.id||"",
    workIds:works.map(w=>w.id),
    role:clean(item?.songType)||"Song",
    character:"",
    circle:type==="arrangement"?circleName(item,roles):(artistString||"ZUN"),
    album:albumName(item),
    moods:tags(item),
    originalIds:originalVersionId?["tdb-"+originalVersionId]:[],
    artists:roles,
    artistString,
    media,
    thumb:clean(item?.thumbUrl||item?.mainPicture?.urlThumb||item?.mainPicture?.urlSmallThumb||item?.mainPicture?.urlOriginal),
    source:{name:"TouhouDB",url:id?("https://touhoudb.com/S/"+id):"https://touhoudb.com"},
    songType:clean(item?.songType),
    ratingScore:Number(item?.ratingScore)||0,
    favoritedTimes:Number(item?.favoritedTimes)||0,
    publishDate:clean(item?.publishDate),
    remote:true
  };
}
async function fetchJson(url,force=false){
  const hit=cache.get(url);if(!force&&hit&&Date.now()-hit.at<TTL)return hit.data;
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch(url,{signal:ctl.signal,headers:{Accept:"application/json"}});
    if(!r.ok)throw new Error("TouhouDB HTTP "+r.status);
    const d=await r.json();cache.set(url,{at:Date.now(),data:d});return d;
  }finally{clearTimeout(timer)}
}
function modeSongTypes(mode){
  if(mode==="original")return"Original";
  if(mode==="arrangement")return"Arrangement,Remix,Cover,Remaster";
  return"";
}
async function search(opts={}){
  const p=new URLSearchParams();
  if(opts.query)p.set("query",opts.query);
  const st=modeSongTypes(opts.mode);if(st)p.set("songTypes",st);
  p.set("start",String(Math.max(0,Number(opts.start)||0)));
  p.set("maxResults",String(Math.max(1,Math.min(50,Number(opts.maxResults)||50))));
  p.set("getTotalCount","true");
  p.set("nameMatchMode","Partial");
  p.set("preferAccurateMatches","true");
  p.set("fields","AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Albums,MainPicture,WebLinks");
  p.set("lang","Japanese");
  p.set("sort",opts.sort||"RatingScore");
  if(opts.onlyWithPvs)p.set("onlyWithPvs","true");
  if(opts.tagName){p.append("tagName",opts.tagName);p.set("childTags","true");}
  let url=API+"/songs?"+p.toString(),d,typedOk=true;
  try{
    d=await fetchJson(url,!!opts.force);
  }catch(e){
    // Some TouhouDB deployments are stricter about multi-value SongType flags.
    // Fall back to an untyped page and classify it client-side instead of losing the whole catalog.
    if(!st)throw e;
    typedOk=false;
    p.delete("songTypes");
    url=API+"/songs?"+p.toString();
    d=await fetchJson(url,!!opts.force);
  }
  const consumed=arr(d?.items).length;
  let items=arr(d?.items).map(toTrack);
  if(opts.mode==="original")items=items.filter(x=>x.type==="original");
  if(opts.mode==="arrangement")items=items.filter(x=>x.type==="arrangement");
  return {
    items,
    total:Number(d?.totalCount)||items.length,
    start:Number(opts.start)||0,
    raw:d,
    typed:!st||typedOk,
    consumed
  };
}
async function hydrate(id){
  const n=String(id||"").replace(/^tdb-/,"");
  if(!/^\d+$/.test(n))return null;
  const d=await fetchJson(API+"/songs/"+n+"?fields=AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Albums,MainPicture,WebLinks&lang=Japanese");
  return toTrack(d);
}
async function status(opts={}){
  try{
    const d=await search({start:0,maxResults:1,sort:"RatingScore",force:!!opts.force});
    return {ok:true,total:d.total};
  }catch(e){return{ok:false,error:String(e?.message||e)}}
}
function clearCache(){cache.clear()}
function setWorks(works){workRegistry=Array.isArray(works)?works:[]}
window.TouhouCatalog={search,hydrate,status,clearCache,setWorks,toTrack,apiBase:API};
})();