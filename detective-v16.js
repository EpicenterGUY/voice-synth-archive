/* Voice Synth Archive Detective v16
 * Backend-first local song index search.
 * Falls back to the existing live Niconico + VocaDB detective when D1 is unavailable.
 */
(function(){
  "use strict";

  const CACHE=new Map();
  let statusCache={at:0,data:null};
  const previousSearch=detectiveSearch;

  function arr(v){return Array.isArray(v)?v:[]}
  function cacheKey(body){
    return JSON.stringify({
      words:body.words||"",lyrics:body.lyrics||"",producer:body.producer||"",vocal:body.vocal||"",
      yearFrom:body.yearFrom||null,yearTo:body.yearTo||null,duration:body.duration||"",
      contexts:body.contexts||[],genre:body.genre||[],mood:body.mood||[],visualTags:body.visualTags||[],
      audio:body.audio?{bpm:Math.round(body.audio.bpm||0),duration:Math.round(body.audio.duration||0),type:body.audio.type||""}:null
    });
  }
  function backendBody(c){
    return {
      words:c.words||"",
      lyrics:c.lyrics||"",
      producer:c.producer||"",
      vocal:c.vocal||"",
      wordTokens:arr(c.wordTokens),
      lyricTokens:arr(c.lyricTokens),
      kanjiHints:arr(c.kanjiHints),
      yearFrom:c.yearFrom||null,
      yearTo:c.yearTo||null,
      duration:c.duration||"",
      contexts:arr(c.contexts),
      genre:arr(c.genre),
      mood:arr(c.mood),
      visualTags:arr(c.visualTags),
      audio:state.detectiveAudioEvidence?{
        type:state.detectiveAudioEvidence.type||"",
        bpm:Number(state.detectiveAudioEvidence.bpm)||0,
        duration:Number(state.detectiveAudioEvidence.duration)||0,
        pitchRange:Number(state.detectiveAudioEvidence.pitchRange)||0,
        pitchMotion:state.detectiveAudioEvidence.pitchMotion||""
      }:null
    };
  }

  async function indexStatus(force=false){
    if(!relayBase())return {ok:false,indexReady:false,indexedSongs:0};
    if(!force&&statusCache.data&&Date.now()-statusCache.at<60000)return statusCache.data;
    try{
      const r=await fetch(relayBase()+"/detective/status",{cache:"no-store"});
      if(!r.ok)throw new Error("status "+r.status);
      const d=await r.json();
      statusCache={at:Date.now(),data:d};
      return d;
    }catch{
      const d={ok:false,indexReady:false,indexedSongs:0};
      statusCache={at:Date.now(),data:d};
      return d;
    }
  }

  function setIndexBadge(d){
    let badge=document.getElementById("detectiveIndexStatus");
    if(!badge){
      const host=document.querySelector(".detective-search-sources");
      if(!host)return;
      badge=document.createElement("span");
      badge.id="detectiveIndexStatus";
      badge.className="detective-index-status";
      host.appendChild(badge);
    }
    if(d?.indexReady){
      badge.className="detective-index-status ready";
      badge.textContent="로컬 인덱스 "+Number(d.indexedSongs||0).toLocaleString("ko-KR")+"곡";
      badge.title="D1에 미리 저장된 곡을 먼저 검색합니다.";
    }else{
      badge.className="detective-index-status";
      badge.textContent="실시간 수색";
      badge.title="D1 인덱스 미설정: 기존 Niconico + VocaDB 실시간 수색을 사용합니다.";
    }
  }

  async function fetchIndexedCandidates(c){
    const st=await indexStatus();
    setIndexBadge(st);
    if(!st.indexReady||!relayBase())return null;
    const body=backendBody(c);
    const key=cacheKey(body);
    const hit=CACHE.get(key);
    if(hit&&Date.now()-hit.at<5*60*1000)return hit.data;

    const r=await fetch(relayBase()+"/detective/search",{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify(body)
    });
    if(!r.ok)throw new Error("detective index "+r.status);
    const d=await r.json();
    CACHE.set(key,{at:Date.now(),data:d});
    setIndexBadge(d);
    return d;
  }

  function songKey(song){
    if(song?.vocadbId)return "v:"+song.vocadbId;
    return "n:"+String(song?.contentId||"");
  }
  function mergeSongs(a,b){
    if(!a)return b;if(!b)return a;
    const aIndex=arr(a.__sources).includes("index");
    const p=aIndex?a:b,s=p===a?b:a;
    return Object.assign({},s,p,{
      tags:[...new Set(parseTags(a.tags).concat(parseTags(b.tags)))],
      aliases:[...new Set(arr(a.aliases).concat(arr(b.aliases)))],
      __sources:[...new Set(arr(a.__sources||[a.__source]).concat(arr(b.__sources||[b.__source]).filter(Boolean)))]
    });
  }

  async function scorePool(songs,c,backendMeta){
    const clueCount=detectiveClueUnits(c);
    const rule=detectiveRuleFor(c,clueCount);
    let rows=songs.map(song=>{
      const ev=detectiveEvidence(song,c);
      const ix=Number(song.__indexScore)||0;
      if(ix>0){
        const bonus=Math.min(9,Math.log2(1+ix)*1.7);
        ev.score=Math.min(99.9,ev.score+bonus);
        ev.matches.unshift({text:"전용 인덱스 후보 · lexical "+ix.toFixed(1),strong:ix>=35});
      }
      return {song,...ev};
    });
    rows.sort((a,b)=>b.score-a.score);
    try{await enrichImageSimilarity(rows.slice(0,80))}catch{}
    rows.sort((a,b)=>b.score-a.score||b.matchedCount-a.matchedCount||(+b.song.viewCounter||0)-(+a.song.viewCounter||0));

    // Backend candidate generation should favor recall. Explicit strict modes still keep hard exclusions.
    const explicitStrict=["strict","very_strict"].includes(c.strictness);
    rows=rows.filter(ev=>{
      if(explicitStrict&&ev.hardFailures.length)return false;
      if(clueCount>=2&&ev.matchedCount<1)return false;
      return ev.score>=Math.max(7,rule.minScore-20);
    });

    state.detectiveCandidates=rows.slice(0,Math.max(24,rule.maxResults));
    state.detectiveStageUsed=0;
    renderDetectiveResults(c,{
      raw:songs.length,hardRejected:0,scoreRejected:0,matchRejected:0,
      rule,clueCount,kept:rows.length,indexed:true,indexedSongs:backendMeta?.indexedSongs||0
    });
    const status=document.getElementById("detectiveStatus");
    if(status){
      status.insertAdjacentHTML("afterbegin",
        '<span class="detective-stage-progress index">전용 인덱스 '+Number(backendMeta?.indexedSongs||0).toLocaleString("ko-KR")+'곡</span> ');
    }
    return rows;
  }

  async function indexedSearch(){
    if(state.detectiveIndexBusy)return;
    const c=collectDetectiveClues();
    const clueCount=detectiveClueUnits(c);
    const rule=detectiveRuleFor(c,clueCount);
    if(clueCount<rule.minClues){
      toast(rule.label+" 수색에는 단서가 최소 "+rule.minClues+"개 필요합니다.");
      updateDetectiveClueMeter();
      return;
    }

    state.detectiveIndexBusy=true;
    const btn=document.getElementById("detectiveSearchBtn");
    if(btn)btn.disabled=true;
    const sourceStatus=document.getElementById("detectiveSourceStatus");
    if(sourceStatus)sourceStatus.textContent="전용 곡 인덱스 우선 검색 중…";

    let indexedData=null,indexedSongs=[];
    try{
      indexedData=await fetchIndexedCandidates(c);
      indexedSongs=arr(indexedData?.candidates);

      if(indexedData?.indexReady&&indexedSongs.length){
        const rows=await scorePool(indexedSongs,c,indexedData);
        if(sourceStatus)sourceStatus.textContent="전용 인덱스 즉시 검색 · "+rows.length+"후보";

        // A healthy local pool is the fast path. Do not make the user wait for external APIs.
        const top=rows[0]?.score||0;
        if(rows.length>=8&&top>=48){
          return;
        }
      }

      // Sparse/young index: run the existing broad live detective, then merge both pools.
      if(sourceStatus)sourceStatus.textContent=indexedData?.indexReady?"인덱스 보강 수사 중…":"Niconico + VocaDB 실시간 수색 중…";
      await previousSearch();
      const liveSongs=arr(state.detectiveCandidates).map(x=>x.song);
      const map=new Map();
      for(const s of indexedSongs)map.set(songKey(s),s);
      for(const s of liveSongs){
        const k=songKey(s);
        map.set(k,map.has(k)?mergeSongs(map.get(k),s):s);
      }
      if(map.size)await scorePool([...map.values()],c,indexedData||{indexedSongs:0});
    }catch(e){
      console.warn("indexed detective fallback",e);
      await previousSearch();
    }finally{
      state.detectiveIndexBusy=false;
      if(btn)btn.disabled=false;
    }
  }

  // Replace the primary search action after all previous detective layers have loaded.
  detectiveSearch=indexedSearch;
  const old=document.getElementById("detectiveSearchBtn");
  if(old){
    const fresh=old.cloneNode(true);
    old.parentNode.replaceChild(fresh,old);
    fresh.addEventListener("click",indexedSearch);
  }

  // Status only; no extra blocking request if Worker has not been configured.
  if(relayBase()){
    setTimeout(async()=>setIndexBadge(await indexStatus(true)),450);
  }else{
    setIndexBadge({indexReady:false,indexedSongs:0});
  }

  const style=document.createElement("style");
  style.textContent=
    '.detective-index-status{display:inline-flex!important;align-items:center;padding:3px 6px;border-radius:999px;border:1px solid #334556;background:#101a25;color:#7890a5;font-size:7px!important;font-weight:900;white-space:nowrap}'+
    '.detective-index-status.ready{border-color:#2e715e;background:#102b24;color:#9ce9ca}'+
    '.detective-stage-progress.index{border-color:#2e715e;background:#102b24;color:#a6efd1}'+
    '@media(max-width:699px){.detective-index-status{font-size:7px!important;padding:3px 5px}}';
  document.head.appendChild(style);
})();