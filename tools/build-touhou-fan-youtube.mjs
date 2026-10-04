import fs from "node:fs/promises";

const KEY=String(process.env.YOUTUBE_API_KEY||"").trim();
const LIMIT=Math.max(0,Math.min(90,Number(process.env.YOUTUBE_SEARCH_LIMIT)||90));
const MATCHER_VERSION=4;
const FULL_DIR="touhou/data/full";
const SEEDS="touhou/data/fan-originals.json";
const ALBUMS="touhou/data/fan-original-albums.json";
const OUT="touhou/data/fan-youtube.json";
const clean=v=>String(v??"").trim();
const norm=v=>clean(v).normalize("NFKC").toLowerCase().replace(/[\s\u3000\p{P}\p{S}]+/gu,"");
const words=v=>clean(v).normalize("NFKC").toLowerCase().split(/[\s\u3000~～\-—_:：・/()[\]{}"'“”‘’!?！？.,]+/).map(x=>x.trim()).filter(x=>x.length>=2);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function flatten(seeds,manifest){
  const out=[];
  for(const row of Array.isArray(seeds)?seeds:[]){
    if(!row?.id||!row?.title)continue;
    out.push({id:row.id,title:row.title,artist:row.artistString||row.circle||"",album:row.album||""});
  }
  for(const album of (Array.isArray(manifest?.albums)?manifest.albums:[])){
    (Array.isArray(album?.tracks)?album.tracks:[]).forEach((raw,i)=>{
      const row=typeof raw==="string"?{title:raw}:raw||{};
      const title=clean(row.title);if(!title)return;
      out.push({
        id:"fan-album-"+clean(album.id)+"-"+String(i+1).padStart(2,"0"),
        title,artist:clean(row.artist||album.artist),album:clean(album.title)
      });
    });
  }
  return out;
}
async function flattenDbFanOriginals(){
  let files=[];
  try{files=(await fs.readdir(FULL_DIR)).filter(x=>/^shard-\d+\.json$/.test(x)).sort()}catch{return[]}
  const out=[];
  for(const file of files){
    let rows=[];try{rows=JSON.parse(await fs.readFile(FULL_DIR+"/"+file,"utf8"))}catch{continue}
    for(const r of Array.isArray(rows)?rows:[]){
      const raw=clean(r?.k).toLowerCase();
      if(!r?.t||raw!=="original")continue;
      const hasYoutube=(Array.isArray(r?.p)?r.p:[]).some(p=>clean(p?.[0])==="youtube"&&clean(p?.[1]||p?.[2]));
      if(hasYoutube)continue;
      out.push({
        id:"tdb-"+String(r.i),
        title:clean(r.n)||("TouhouDB #"+String(r.i)),
        artist:clean(r.a||r.c),
        album:clean(r.l),
        sourceKind:"touhoudb-fan-original"
      });
    }
  }
  return out;
}

function overlap(a,b){
  const A=new Set(words(a)),B=new Set(words(b));if(!A.size||!B.size)return 0;
  let hit=0;for(const x of A)if(B.has(x))hit++;
  return hit/Math.max(1,Math.min(A.size,B.size));
}
function scoreCandidate(track,item){
  const title=clean(item?.snippet?.title),channel=clean(item?.snippet?.channelTitle),desc=clean(item?.snippet?.description);
  const nt=norm(track.title),nc=norm(title);let score=0;
  if(nt&&nc&&nc.includes(nt))score+=10;
  else if(nt&&nc&&nt.includes(nc)&&nc.length>=6)score+=5;
  const ov=overlap(track.title,title);if(ov>=.72)score+=6;else if(ov>=.5)score+=3;
  const artistTokens=words(track.artist);
  const hay=norm(title+" "+channel+" "+desc);
  if(artistTokens.some(x=>hay.includes(norm(x))))score+=3;
  if(/touhou|東方/i.test(title+" "+desc))score+=1.5;
  if(track.artist&&norm(channel).includes(norm(track.artist)))score+=4;
  if(/remix|arrange|cover/i.test(title)&&!/remix|arrange|cover/i.test(track.title))score-=2;
  return score;
}
async function youtubeSearch(track){
  const q=[track.title,track.artist].filter(Boolean).join(" ");
  const p=new URLSearchParams({
    part:"snippet",type:"video",maxResults:"5",q,key:KEY,
    videoEmbeddable:"true",videoSyndicated:"true",safeSearch:"none"
  });
  const r=await fetch("https://www.googleapis.com/youtube/v3/search?"+p.toString(),{
    headers:{Accept:"application/json","User-Agent":"TouhouDive-FanVideoMatcher/1.0"}
  });
  if(!r.ok)throw new Error("YouTube search HTTP "+r.status);
  const d=await r.json();
  const ranked=(d.items||[])
    .map(x=>({item:x,score:scoreCandidate(track,x)}))
    .sort((a,b)=>b.score-a.score);
  const best=ranked[0];
  if(!best||best.score<7)return null;
  const id=clean(best.item?.id?.videoId);if(!id)return null;
  return {
    videoId:id,score:Math.round(best.score*100)/100,
    videoTitle:clean(best.item?.snippet?.title),
    channelTitle:clean(best.item?.snippet?.channelTitle),
    matchedAt:new Date().toISOString(),
    matcherVersion:MATCHER_VERSION
  };
}

async function refreshYoutubeStats(cache){
  const ids=[...new Set(Object.values(cache.items||{}).map(x=>clean(x?.videoId)).filter(Boolean))];
  if(!ids.length)return {videos:0,updated:0,missing:0};
  const byId=new Map();
  for(let i=0;i<ids.length;i+=50){
    const group=ids.slice(i,i+50);
    const p=new URLSearchParams({part:"statistics,status",id:group.join(","),key:KEY});
    const r=await fetch("https://www.googleapis.com/youtube/v3/videos?"+p.toString(),{
      headers:{Accept:"application/json","User-Agent":"TouhouDive-FanVideoStats/1.0"}
    });
    if(!r.ok)throw new Error("YouTube stats HTTP "+r.status);
    const d=await r.json();
    for(const item of d.items||[])byId.set(clean(item.id),item);
    await sleep(50);
  }
  let updated=0,missing=0;
  const now=new Date().toISOString();
  for(const row of Object.values(cache.items||{})){
    const id=clean(row?.videoId);if(!id)continue;
    const item=byId.get(id);
    if(!item){row.videoUnavailable=true;missing++;continue}
    const stats=item.statistics||{},status=item.status||{};
    row.viewCount=Number(stats.viewCount)||0;
    row.likeCount=Number(stats.likeCount)||0;
    row.commentCount=Number(stats.commentCount)||0;
    row.embeddable=status.embeddable!==false;
    row.privacyStatus=clean(status.privacyStatus);
    row.statsUpdatedAt=now;
    row.videoUnavailable=status.embeddable===false||status.privacyStatus==="private";
    updated++;
  }
  return {videos:ids.length,updated,missing};
}
async function main(){
  if(!KEY){console.log("No YOUTUBE_API_KEY; preserving fan YouTube cache.");return}
  const [seeds,manifest]=await Promise.all([
    fs.readFile(SEEDS,"utf8").then(JSON.parse),
    fs.readFile(ALBUMS,"utf8").then(JSON.parse)
  ]);
  let cache={version:1,updated:"",items:{}};
  try{cache=JSON.parse(await fs.readFile(OUT,"utf8"))}catch{}
  if(!cache||typeof cache!=="object")cache={version:1,updated:"",items:{}};
  if(!cache.items||typeof cache.items!=="object")cache.items={};
  const curated=flatten(seeds,manifest).map(x=>({...x,sourceKind:"curated"}));
  const dbFan=await flattenDbFanOriginals();
  const pendingFor=tracks=>[
    ...tracks.filter(t=>{const row=cache.items[t.id];return row&&!row.videoId&&Number(row.matcherVersion||0)<MATCHER_VERSION}),
    ...tracks.filter(t=>!cache.items[t.id])
  ];
  const cp=pendingFor(curated),dp=pendingFor(dbFan),pending=[];
  let ci=0,di=0;
  while(pending.length<LIMIT&&(ci<cp.length||di<dp.length)){
    if(ci<cp.length&&pending.length<LIMIT)pending.push(cp[ci++]);
    if(di<dp.length&&pending.length<LIMIT)pending.push(dp[di++]);
  }
  const tracks=[...curated,...dbFan];
  let matched=0,checked=0;
  for(const track of pending){
    try{
      const hit=await youtubeSearch(track);checked++;
      cache.items[track.id]=hit
        ?{...hit,title:track.title,artist:track.artist,sourceKind:track.sourceKind||"curated"}
        :{videoId:"",score:0,title:track.title,artist:track.artist,sourceKind:track.sourceKind||"curated",matchedAt:new Date().toISOString(),matcherVersion:MATCHER_VERSION};
      if(hit)matched++;
    }catch(e){
      console.warn("youtube match failed",track.id,e?.message||e);
      if(/quota|403/i.test(String(e?.message||e)))break;
    }
    await sleep(80);
  }
  const stats=await refreshYoutubeStats(cache);
  const values=Object.entries(cache.items||{});
  const usable=([,x])=>x?.videoId&&!x?.videoUnavailable;
  const measured=([,x])=>usable([null,x])&&Number.isFinite(Number(x?.viewCount));
  cache.version=4;
  cache.matcherVersion=MATCHER_VERSION;
  cache.updated=new Date().toISOString();
  cache.totalTracks=tracks.length;
  cache.curatedTotalTracks=curated.length;
  cache.dbFanMissingYoutubeTargets=dbFan.length;
  cache.checkedTracks=values.length;
  cache.matchedTracks=values.filter(usable).length;
  cache.viewCountTracks=values.filter(measured).length;
  cache.curatedCheckedTracks=values.filter(([id])=>!id.startsWith("tdb-")).length;
  cache.curatedMatchedTracks=values.filter(([id,x])=>!id.startsWith("tdb-")&&usable([id,x])).length;
  cache.curatedViewCountTracks=values.filter(([id,x])=>!id.startsWith("tdb-")&&measured([id,x])).length;
  cache.dbFanFallbackChecked=values.filter(([id])=>id.startsWith("tdb-")).length;
  cache.dbFanFallbackMatched=values.filter(([id,x])=>id.startsWith("tdb-")&&usable([id,x])).length;
  cache.dbFanFallbackViewCountTracks=values.filter(([id,x])=>id.startsWith("tdb-")&&measured([id,x])).length;
  cache.policy="Curated Touhou-style plus TouhouDB fan-original tracks missing an existing YouTube PV. Exact/near-exact title + artist/channel checks; embeddable syndicated videos only. Views/likes/comments refreshed for every cached match.";
  await fs.writeFile(OUT,JSON.stringify(cache,null,2)+"\n");
  console.log(JSON.stringify({checked,matched,curated:curated.length,dbFanMissingYoutubeTargets:dbFan.length,cached:cache.checkedTracks,video:cache.matchedTracks,viewCountTracks:cache.viewCountTracks,stats},null,2));
}
main().catch(err=>{console.error(err);process.exit(1)});