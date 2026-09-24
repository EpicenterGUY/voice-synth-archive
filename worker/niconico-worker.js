/**
 * Voice Synth Niconico Archive relay v10
 * - /api   : Niconico Snapshot Search API relay
 * - /image : safe thumbnail proxy for nimg.jp / nicovideo.jp hosts
 * - /health
 */
const NICO_API = "https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept",
    "Access-Control-Max-Age": "86400"
  };
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8",...cors()}
  });
}
function safeImageHost(host){
  host=String(host||"").toLowerCase();
  return host==="nicovideo.jp" ||
         host.endsWith(".nicovideo.jp") ||
         host==="nimg.jp" ||
         host.endsWith(".nimg.jp");
}

export default {
  async fetch(request) {
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors()});
    const u=new URL(request.url);

    if(u.pathname==="/" || u.pathname==="/health"){
      return json({ok:true,service:"voice-synth-niconico-relay",version:"10.0"});
    }
    if(request.method!=="GET") return json({ok:false,error:"GET only"},405);

    if(u.pathname==="/image"){
      const target=u.searchParams.get("url");
      if(!target)return json({ok:false,error:"missing url"},400);
      let tu;
      try{tu=new URL(target)}catch{return json({ok:false,error:"invalid url"},400)}
      if(tu.protocol!=="https:" || !safeImageHost(tu.hostname)){
        return json({ok:false,error:"image host not allowed"},403);
      }
      try{
        const r=await fetch(tu.toString(),{
          headers:{"Accept":"image/avif,image/webp,image/apng,image/*,*/*;q=0.8"},
          cf:{cacheEverything:true,cacheTtl:86400}
        });
        if(!r.ok)return json({ok:false,error:"upstream image "+r.status},r.status);
        return new Response(r.body,{
          status:200,
          headers:{
            "Content-Type":r.headers.get("content-type")||"image/jpeg",
            "Cache-Control":"public,max-age=86400",
            ...cors()
          }
        });
      }catch(e){
        return json({ok:false,error:String(e?.message||e)},502);
      }
    }

    if(u.pathname!=="/api") return json({ok:false,error:"Not found"},404);

    const out=new URL(NICO_API);
    for(const [k,v] of u.searchParams)out.searchParams.append(k,v);
    if(!out.searchParams.has("_context"))out.searchParams.set("_context","voice_synth_archive_v10");
    if(!out.searchParams.has("_limit"))out.searchParams.set("_limit","20");

    const limit=Math.min(100,Math.max(0,Number(out.searchParams.get("_limit"))||20));
    const offset=Math.min(100000,Math.max(0,Number(out.searchParams.get("_offset"))||0));
    out.searchParams.set("_limit",String(limit));
    out.searchParams.set("_offset",String(offset));

    try{
      const r=await fetch(out.toString(),{
        headers:{
          "Accept":"application/json",
          "User-Agent":"voice-synth-niconico-archive/10.0"
        }
      });
      const body=await r.text();
      return new Response(body,{
        status:r.status,
        headers:{
          "Content-Type":r.headers.get("content-type")||"application/json; charset=utf-8",
          "Cache-Control":"public,max-age=300",
          ...cors()
        }
      });
    }catch(e){
      return json({ok:false,error:String(e?.message||e)},502);
    }
  }
};
