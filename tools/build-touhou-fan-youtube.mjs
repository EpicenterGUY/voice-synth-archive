import fs from "node:fs/promises";

const KEY=String(process.env.YOUTUBE_API_KEY||"").trim();
const LIMIT=Math.max(0,Math.min(90,Number(process.env.YOUTUBE_SEARCH_LIMIT)||75));
const MATCHER_VERSION=3;
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
  const tracks=flatten(seeds,manifest);
  const retry=tracks.filter(t=>{
    const row=cache.items[t.id];
    return row&&!row.videoId&&Number(row.matcherVersion||0)<MATCHER_VERSION;
  });
  const fresh=tracks.filter(t=>!cache.items[t.id]);
  const pending=[...retry,...fresh].slice(0,LIMIT);
  let matched=0,checked=0;
  for(const track of pending){
    try{
      const hit=await youtubeSearch(track);checked++;
      cache.items[track.id]=hit
        ?{...hit,title:track.title,artist:track.artist}
        :{videoId:"",score:0,title:track.title,artist:track.artist,matchedAt:new Date().toISOString(),matcherVersion:MATCHER_VERSION};
      if(hit)matched++;
    }catch(e){
      console.warn("youtube match failed",track.id,e?.message||e);
      if(/quota|403/i.test(String(e?.message||e)))break;
    }
    await sleep(80);
  }
  const stats=await refreshYoutubeStats(cache);
  cache.version=3;
  cache.matcherVersion=MATCHER_VERSION;
  cache.updated=new Date().toISOString();
  cache.totalTracks=tracks.length;
  cache.checkedTracks=Object.keys(cache.items).length;
  cache.matchedTracks=Object.values(cache.items).filter(x=>x?.videoId&&!x?.videoUnavailable).length;
  cache.viewCountTracks=Object.values(cache.items).filter(x=>x?.videoId&&Number.isFinite(Number(x?.viewCount))).length;
  cache.policy="Exact/near-exact title + artist/channel checks; embeddable syndicated YouTube videos only. Public views/likes/comments refreshed for every cached match.";
  await fs.writeFile(OUT,JSON.stringify(cache,null,2)+"\n");
  console.log(JSON.stringify({checked,matched,total:tracks.length,cached:cache.checkedTracks,video:cache.matchedTracks,viewCountTracks:cache.viewCountTracks,stats},null,2));
}
main().catch(err=>{console.error(err);process.exit(1)});