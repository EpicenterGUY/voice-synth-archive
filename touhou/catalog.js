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
function parseBilibiliId(v){
  const s=clean(v);if(/^\d+$/.test(s))return s;if(/^av\d+$/i.test(s))return s.slice(2);
  try{const u=new URL(s);const m=u.pathname.match(/\/video\/(?:av)?(\d+)/i);return m?.[1]||u.searchParams.get("aid")||""}catch{return""}
}
function safeHttpUrl(v){
  try{const u=new URL(clean(v));return /^https?:$/.test(u.protocol)?u.toString():""}catch{return""}
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
function mediaCandidates(item){
  const out=[],seen=new Set();
  const add=(provider,id,url,name,mode="embed")=>{
    id=clean(id);url=safeHttpUrl(url)||clean(url);
    const key=provider+":"+(id||url);if(!id&&!url||seen.has(key))return;
    seen.add(key);out.push({provider,id,url,name:clean(name),mode});
  };
  for(const pv of arr(item?.pvs)){
    const service=clean(pv?.service),raw=pv?.pvId||pv?.url,url=safeHttpUrl(pv?.url);
    if(/youtube/i.test(service)&&raw){
      const id=parseYoutubeId(raw);if(id)add("youtube",id,url||("https://www.youtube.com/watch?v="+id),pv?.name);
    }else if(/niconico/i.test(service)&&raw){
      const id=parseNicoId(raw);if(id)add("niconico",id,url||("https://www.nicovideo.jp/watch/"+id),pv?.name);
    }else if(/soundcloud/i.test(service)&&(url||raw)){
      add("soundcloud",clean(pv?.pvId)||url,url||clean(raw),pv?.name);
    }else if(/piapro/i.test(service)&&raw){
      const id=clean(pv?.pvId)||clean(raw).match(/\/content\/([^/?#]+)/)?.[1]||"";
      if(id)add("piapro",id,url||("https://piapro.jp/content/"+id),pv?.name);
    }else if(/bilibili/i.test(service)&&raw){
      const id=parseBilibiliId(raw);if(id)add("bilibili",id,url||("https://www.bilibili.com/video/av"+id),pv?.name);
    }else if(/bandcamp/i.test(service)&&raw){
      const id=clean(pv?.pvId)||"";
      if(id)add("bandcamp",id,url||"https://bandcamp.com",pv?.name);
      else if(url)add("bandcamp-url",url,url,pv?.name,"external");
    }
  }
  return out;
}
function bestMedia(item){return mediaCandidates(item)[0]||null}
function lyricRows(item){
  return arr(item?.lyrics).map(row=>{
    const text=clean(row?.value||row?.lyrics||row?.text);
    if(!text)return null;
    return {
      text,
      source:clean(row?.url||row?.URL||row?.sourceUrl||row?.source),
      translationType:clean(row?.translationType),
      cultureCodes:arr(row?.cultureCodes).map(clean).filter(Boolean)
    };
  }).filter(Boolean);
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
  const originalVersionId=Number(item?.originalVersionId)||Number(item?.originalVersion?.id)||Number(item?.parentSongId)||0;
  const aliases=uniq([
    ...arr(item?.names).map(nameValue),
    ...clean(item?.additionalNames).split(/[,、]/).map(x=>x.trim())
  ]);
  const artistString=clean(item?.artistString)||artistNames(item).join(", ");
  const title=clean(item?.name||item?.defaultName||aliases[0]||("TouhouDB #"+id));
  const candidates=mediaCandidates(item);
  const media=candidates[0]||null;
  const works=inferWorks(item);
  const lyrics=lyricRows(item);
  const lyricsLoaded=Object.prototype.hasOwnProperty.call(item||{},"lyrics");
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
    mediaCandidates:candidates,
    lyrics,
    lyricsLoaded,
    lyricsAvailable:lyrics.length>0,
    lyricsSource:id?("https://touhoudb.com/S/"+id):"",
    thumb:clean(item?.thumbUrl||item?.mainPicture?.urlThumb||item?.mainPicture?.urlSmallThumb||item?.mainPicture?.urlOriginal),
    source:{name:"TouhouDB",url:id?("https://touhoudb.com/S/"+id):"https://touhoudb.com"},
    songType:clean(item?.songType),
    ratingScore:Number(item?.ratingScore)||0,
    favoritedTimes:Number(item?.favoritedTimes)||0,
    hitCount:Number(item?.hitCount)||Number(item?.hits)||0,
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
  const d=await fetchJson(API+"/songs/"+n+"?fields=AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Albums,MainPicture,WebLinks,Lyrics&lang=Japanese");
  return toTrack(d);
}
async function lookupByMedia(track){
  const candidates=arr(track?.mediaCandidates).length?arr(track.mediaCandidates):arr(track?.media?[track.media]:[]);
  for(const media of candidates){
    let service="";
    if(media?.provider==="youtube")service="Youtube";
    else if(media?.provider==="niconico")service="NicoNicoDouga";
    else if(media?.provider==="soundcloud")service="SoundCloud";
    else if(media?.provider==="piapro")service="Piapro";
    else if(media?.provider==="bilibili")service="Bilibili";
    if(!service||!clean(media?.id))continue;
    try{
      const p=new URLSearchParams({
        pvService:service,
        pvId:clean(media.id),
        fields:"AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Albums,MainPicture,WebLinks,Lyrics",
        lang:"Japanese"
      });
      const d=await fetchJson(API+"/songs/byPv?"+p.toString(),true);
      if(d?.id)return toTrack(d);
    }catch(e){}
  }
  return null;
}
async function status(opts={}){
  try{
    const d=await search({start:0,maxResults:1,sort:"RatingScore",force:!!opts.force});
    return {ok:true,total:d.total};
  }catch(e){return{ok:false,error:String(e?.message||e)}}
}
function norm(v){return clean(v).normalize("NFKC").toLowerCase().replace(/[\s\u3000\p{P}\p{S}]+/gu,"")}
async function lookupByTitle(title,opts={}){
  const target=norm(title);if(!target)return null;
  const res=await search({query:title,mode:opts.mode||"",maxResults:10,sort:"RatingScore",tagName:opts.tagName||"",force:!!opts.force});
  const exact=res.items.find(t=>norm(t.title)===target||(t.aliases||[]).some(a=>norm(a)===target));
  return exact||res.items[0]||null;
}
function clearCache(){cache.clear()}
function setWorks(works){workRegistry=Array.isArray(works)?works:[]}
window.TouhouCatalog={search,hydrate,lookupByMedia,lookupByTitle,status,clearCache,setWorks,toTrack,apiBase:API};
})();