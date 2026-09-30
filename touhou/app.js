const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const catalog=window.TouhouCatalog;
const fullIndex=window.TouhouFullIndex;
const player=new window.TouhouMediaPlayer();

const state={
  localOriginals:[],localArrangements:[],known:new Map(),aliases:new Map(),identities:new Map(),remoteItems:[],fullItems:[],works:[],archiveSource:null,
  mode:"all",filter:"전체",workFilter:"",sort:"recommend",selected:null,view:"home",diveDepth:0,diveRoot:null,icebergMode:"visibility",rankIndex:new Map(),rankTotal:0,enriching:new Map(),
  full:{available:false,loading:false,loaded:false,manifest:null,loadedCount:0,error:""},displayLimit:60,renderKey:"",lastMatchCount:0,childCounts:new Map(),
  remote:{available:false,loading:false,start:0,total:0,catalogTotal:0,key:"",error:"",counts:{},seq:0},
  favorites:new Set(readJson("touhoudive:favorites",[])),
  history:readJson("touhoudive:history",[]),
  snapshots:readJson("touhoudive:snapshots",{})
};
let searchTimer=0;

boot();

async function boot(){
  try{
    const [o,a,w,archiveSource]=await Promise.all([
      fetch("./data/originals.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("./data/arrangements.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("./data/works.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("./data/archive-sources.json",{cache:"no-store"}).then(r=>r.json()).catch(()=>null)
    ]);
    state.works=w;
    state.archiveSource=archiveSource;
    catalog?.setWorks?.(w);
    fullIndex?.setWorks?.(w);
    state.localOriginals=o.map(x=>({...x,type:"original",circle:"ZUN",album:x.work,originalIds:[],remote:false}));
    state.localArrangements=a.map(x=>({...x,type:"arrangement",remote:false}));
    [...state.localOriginals,...state.localArrangements].forEach(remember);
    Object.values(state.snapshots||{}).forEach(x=>x&&remember({...x,snapshot:true}));
    normalizePersistentIds();
    renderWorkSelect();
    setView("home");
    renderLocalFirst();
    bind();
    if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js?v=0.9.3").then(r=>r.update()).catch(()=>{});
    connectFullDataset();
    await connectRemote();
  }catch(err){
    console.error(err);
    setDataHealth("error","로컬 데이터 로드 실패");
    $("#trackGrid").innerHTML='<div class="empty-state" style="grid-column:1/-1;min-height:220px"><strong>데이터를 불러오지 못했습니다.</strong><span>새로고침 후 다시 시도해 주세요.</span></div>';
  }
}
function bind(){
  $("#searchInput").addEventListener("input",()=>{
    $("#searchClear").hidden=!$("#searchInput").value;
    if($("#searchInput").value&&state.view!=="discover")setView("discover");
    renderCatalog();
    clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>loadRemote(true),300);
  });
  $("#searchClear").onclick=()=>{
    $("#searchInput").value="";
    $("#searchClear").hidden=true;
    renderCatalog();
    loadRemote(true);
    $("#searchInput").focus();
  };
  $("#workSelect").addEventListener("change",e=>{state.workFilter=e.target.value;if(state.workFilter&&state.view==="home")setView("discover");if(state.view==="iceberg")renderIceberg();else renderCatalog();loadRemote(true);});
  $("#sortSelect").addEventListener("change",e=>{
    state.sort=e.target.value;
    if(state.sort==="influence"){state.mode="original";state.filter="전체";syncModeTabs();}
    renderCatalog();loadRemote(true);
  });
  $("#loadMoreBtn").onclick=()=>state.full.loaded?showMoreFull():loadRemote(false);
  $("#randomBtn").onclick=randomDive;$("#heroDiveBtn").onclick=randomDive;
  $("#playableBtn").onclick=()=>{state.mode="all";state.filter="영상 있음";syncModeTabs();renderCatalog("인앱 재생 가능한 곡");loadRemote(true);};
  $("#refreshBtn").onclick=()=>loadRemote(true,true);
  $("#icebergRefresh").onclick=()=>renderIceberg();
  $$("#icebergModeTabs [data-ice-mode]").forEach(btn=>btn.onclick=()=>{
    state.icebergMode=btn.dataset.iceMode;
    $$("#icebergModeTabs [data-ice-mode]").forEach(x=>x.classList.toggle("is-active",x===btn));
    renderIceberg();
  });
  $("#panelClose").onclick=closePanel;
  $("#scrim").onclick=()=>{closePanel();closeMenu();};
  $("#menuBtn").onclick=()=>{$("#sidebar").classList.toggle("is-open");syncScrim();};
  $("#themeBtn").onclick=toggleTheme;
  window.addEventListener("touhoudive:media-unavailable",e=>{
    const t=byId(e.detail?.trackId);if(t)t.mediaUnavailable=true;
    if(state.view==="discover"||state.view==="home")renderCatalog();
    toast("비공개·삭제·임베드 제한 영상은 자동 제외했습니다.");
  });
  $$("#modeTabs .mode-tab").forEach(btn=>btn.onclick=()=>{
    state.mode=btn.dataset.mode;state.filter="전체";syncModeTabs();
    if(state.view==="iceberg"){renderIceberg();loadRemote(true).then(()=>renderIceberg());}
    else{renderCatalog();loadRemote(true);}
  });
  $$(".nav-item[data-view]").forEach(btn=>btn.onclick=()=>nav(btn.dataset.view));
  document.addEventListener("keydown",e=>{
    if(e.key==="/"&&document.activeElement!==$("#searchInput")){e.preventDefault();$("#searchInput").focus();}
    if(e.key==="Escape"){closePanel();closeMenu();if(!player.shell.classList.contains("is-mini")&&!player.shell.hidden)player.minimize();}
  });
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(entries=>{
      if(!entries.some(x=>x.isIntersecting))return;
      if(!["home","discover","lineage"].includes(state.view))return;
      if(state.full.loaded){
        if(state.displayLimit<state.lastMatchCount)showMoreFull();
        return;
      }
      if(!state.remote.available||state.remote.loading||state.remote.start>=state.remote.total)return;
      loadRemote(false);
    },{rootMargin:"700px 0px"});
    io.observe($("#catalogFooter"));
  }
}
function renderLocalFirst(){
  state.remoteItems=[];
  updateStats();
  renderCatalog("로컬 카탈로그");
  setDataHealth("loading","로컬 "+state.known.size+"곡 · TouhouDB 연결 중");
  $("#catalogMeta").textContent="로컬 seed 표시 중 · 라이브 카탈로그 연결 확인 중";
}
async function connectFullDataset(){
  if(!fullIndex)return;
  try{
    const meta=await fullIndex.manifest();
    state.full.available=true;state.full.loading=true;state.full.manifest=meta;state.full.loadedCount=0;
    setDataHealth("loading","전체 인덱스 준비 · "+fmt(meta.indexed)+"곡");
    updateStats();
    const result=await fullIndex.loadAll({
      concurrency:4,
      onProgress:p=>{
        state.full.loadedCount=p.loaded;
        const pct=p.total?Math.min(100,p.loaded/p.total*100):0;
        setDataHealth("loading","전체 인덱스 "+pct.toFixed(1)+"% · "+fmt(p.loaded)+"/"+fmt(p.total));
        $("#heroCatalogCount").textContent=fmt(p.loaded)+" / "+fmt(p.total);
      }
    });
    state.fullItems=result.tracks.map(t=>remember(t));
    state.childCounts=new Map();
    for(const t of state.fullItems){
      for(const oid of (t.originalIds||[])){
        const canonical=resolveId(oid);
        state.childCounts.set(canonical,(state.childCounts.get(canonical)||0)+1);
      }
    }
    state.full.loaded=true;state.full.loading=false;state.full.loadedCount=state.fullItems.length;
    state.rankIndex.clear();state.rankTotal=result.manifest.indexed;
    setDataHealth("ok","FULL INDEX · "+fmt(state.fullItems.length)+"곡");
    state.displayLimit=60;state.renderKey="";
    renderCatalog("전체 인덱스");
    updateStats();
    if(state.view==="iceberg")renderIceberg();
  }catch(e){
    state.full.loading=false;state.full.error=String(e?.message||e);
    // Full index is optional until the first server-side build finishes.
    if(state.remote.available)setDataHealth("ok","TouhouDB LIVE · "+fmt(state.remote.catalogTotal)+"곡");
  }
}
function showMoreFull(){
  if(!state.full.loaded)return;
  state.displayLimit=Math.min(state.lastMatchCount||state.fullItems.length,state.displayLimit+60);
  renderCatalog();
}
async function connectRemote(){
  if(!catalog){remoteFail("TouhouDB 어댑터 없음");return;}
  try{
    const status=await catalog.status();
    if(!status.ok)throw new Error(status.error||"TouhouDB unavailable");
    state.remote.available=true;state.remote.catalogTotal=status.total||0;state.remote.total=state.remote.catalogTotal;
    setDataHealth("ok","TouhouDB LIVE · "+fmt(state.remote.catalogTotal)+"곡");
    updateCatalogTotal();
    loadRemoteCounts();
    await loadRemote(true);
    warmCatalog();
  }catch(e){remoteFail(String(e?.message||e));}
}
async function loadRemoteCounts(){
  try{
    const [orig,arr]=await Promise.all([
      catalog.search({mode:"original",start:0,maxResults:1,sort:"RatingScore"}),
      catalog.search({mode:"arrangement",start:0,maxResults:1,sort:"RatingScore"})
    ]);
    state.remote.counts={
      original:orig.typed?(orig.total||0):0,
      arrangement:arr.typed?(arr.total||0):0
    };
    updateStats();
  }catch(e){}
}
function remoteFail(msg){
  state.remote.available=false;state.remote.error=msg||"연결 실패";
  setDataHealth("error","TouhouDB 오프라인 · 로컬 모드");
  $("#catalogMeta").textContent="라이브 카탈로그 연결 실패 · 로컬 데이터로 계속 사용 가능";
  $("#loadMoreBtn").disabled=true;$("#loadMoreBtn").textContent="라이브 DB 연결 안 됨";
}
function remoteKey(){
  return JSON.stringify({q:$("#searchInput").value.trim(),mode:state.mode,filter:state.filter,work:state.workFilter,sort:state.sort});
}
function selectedWork(){return state.works.find(w=>w.id===state.workFilter)||null}
function remoteSort(){
  if(state.sort==="year-desc"||state.sort==="year-asc")return"PublishDate";
  if(state.sort==="title")return"Name";
  return"RatingScore";
}
async function loadRemote(reset=false,force=false){
  if(state.full.loaded)return;
  if(!state.remote.available)return;
  if(!reset&&state.remote.loading)return;
  const key=remoteKey();
  if(reset||key!==state.remote.key){state.remote.start=0;state.remoteItems=[];state.remote.key=key}
  const seq=++state.remote.seq;
  const start=state.remote.start;
  state.remote.loading=true;
  setDataHealth("loading","TouhouDB 불러오는 중");
  syncCatalogFooter();
  if(force&&catalog?.clearCache)catalog.clearCache();
  try{
    const work=selectedWork();
    const res=await catalog.search({
      query:$("#searchInput").value.trim(),mode:state.mode,start,maxResults:50,
      sort:remoteSort(),onlyWithPvs:state.filter==="영상 있음",tagName:work?.tag||"",force
    });
    if(seq!==state.remote.seq||key!==remoteKey())return;
    let incoming=(res.items||[]).map(t=>{const work=selectedWork();return remember(work?{...t,workId:work.id,work:t.work||work.title}:t)});
    if(state.mode==="original")incoming=incoming.filter(t=>t.type==="original");
    if(state.mode==="arrangement")incoming=incoming.filter(t=>t.type==="arrangement");
    state.remoteItems=dedupe([...state.remoteItems,...incoming]);
    state.remote.start=start+(Number(res.consumed)||Number(res.raw?.items?.length)||res.items?.length||0);
    state.remote.total=Number(res.total)||state.remote.total;
    state.remote.error="";
    renderCatalog(force?"새 추천":undefined);
    setDataHealth("ok","TouhouDB LIVE · "+fmt(state.remoteItems.length)+"곡 로드");
    updateCatalogTotal();
  }catch(e){
    if(seq!==state.remote.seq)return;
    state.remote.error=String(e?.message||e);
    setDataHealth("error","TouhouDB 요청 실패 · 캐시 유지");
  }finally{
    if(seq===state.remote.seq){state.remote.loading=false;syncCatalogFooter()}
  }
}
async function warmCatalog(){
  if(!state.remote.available||state.remote.warming)return;
  state.remote.warming=true;
  const key=remoteKey();
  try{
    for(let i=0;i<6;i++){
      await new Promise(r=>setTimeout(r,220));
      if(key!==remoteKey()||state.remote.loading||state.remote.start>=state.remote.total)break;
      await loadRemote(false);
    }
  }finally{state.remote.warming=false}
}
function uniqMedia(list){
  const seen=new Set(),out=[];
  for(const m of list||[]){
    if(!m?.provider||(!m?.id&&!m?.url))continue;
    const k=m.provider+":"+(m.id||m.url);
    if(seen.has(k))continue;
    seen.add(k);out.push(m);
  }
  return out;
}
function identityKey(t){
  if(!t)return"";
  const title=normKey(t.title);
  if(!title)return"";
  if(t.type==="original")return"original|"+title;
  return"arrangement|"+title+"|"+normKey(t.circle||t.artistString||"");
}
function mergeArtists(a={},b={}){
  const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]),out={};
  keys.forEach(k=>out[k]=uniq([...(a?.[k]||[]),...(b?.[k]||[])]));
  return out;
}
function mergeTrack(base,incoming){
  const localBase=base.remote===false;
  const out={...base,...incoming,id:base.id};
  out.remote=localBase?false:(base.remote||incoming.remote||false);
  out.fullIndex=!!(base.fullIndex||incoming.fullIndex);
  out.title=base.title||incoming.title;
  out.type=base.type||incoming.type;
  out.category=base.category||incoming.category||"";
  out.songTypeRaw=incoming.songTypeRaw||base.songTypeRaw||"";
  out.work=base.work||incoming.work||"";
  out.workId=base.workId||incoming.workId||"";
  out.workIds=uniq([...(base.workIds||[]),...(incoming.workIds||[])]);
  out.role=base.role||incoming.role||"";
  out.character=base.character||incoming.character||"";
  out.circle=base.circle||incoming.circle||"";
  out.album=(base.album&&!/^東方.+$/.test(base.album))?base.album:(incoming.album||base.album||"");
  out.media=base.media||incoming.media||null;
  out.mediaCandidates=uniqMedia([...(base.mediaCandidates||[]),...(incoming.mediaCandidates||[]),base.media,incoming.media]);
  if(!out.media&&out.mediaCandidates.length)out.media=out.mediaCandidates[0];
  out.lyricsLoaded=!!(base.lyricsLoaded||incoming.lyricsLoaded);
  out.lyrics=incoming.lyricsLoaded?(incoming.lyrics||[]):((base.lyrics&&base.lyrics.length)?base.lyrics:(incoming.lyrics||[]));
  out.lyricsAvailable=!!(out.lyrics?.length||base.lyricsAvailable||incoming.lyricsAvailable);
  out.lyricsSource=incoming.lyricsSource||base.lyricsSource||"";
  out.lyricsSearchTitle=base.lyricsSearchTitle||incoming.lyricsSearchTitle||"";
  out.thumb=base.thumb||incoming.thumb||"";
  out.source=incoming.source||base.source||null;
  out.touhoudbId=incoming.touhoudbId||base.touhoudbId;
  out.aliases=uniq([...(base.aliases||[]),...(incoming.aliases||[])]);
  out.moods=uniq([...(base.moods||[]),...(incoming.moods||[])]);
  out.originalIds=uniq([...(base.originalIds||[]),...(incoming.originalIds||[])]);
  out.artists=mergeArtists(base.artists,incoming.artists);
  out.artistString=base.artistString||incoming.artistString||"";
  out.ratingScore=Math.max(Number(base.ratingScore)||0,Number(incoming.ratingScore)||0);
  out.favoritedTimes=Math.max(Number(base.favoritedTimes)||0,Number(incoming.favoritedTimes)||0);
  out.hitCount=Math.max(Number(base.hitCount)||0,Number(incoming.hitCount)||0);
  const minRank=(a,b)=>{a=Number(a)||0;b=Number(b)||0;return a&&b?Math.min(a,b):(a||b||null)};
  out.globalRank=minRank(base.globalRank,incoming.globalRank);
  out.globalScore=Math.max(Number(base.globalScore)||0,Number(incoming.globalScore)||0);
  out.popularityRank=minRank(base.popularityRank,incoming.popularityRank);
  out.popularityScore=Math.max(Number(base.popularityScore)||0,Number(incoming.popularityScore)||0);
  out.influenceRank=minRank(base.influenceRank,incoming.influenceRank);
  out.influenceScore=Math.max(Number(base.influenceScore)||0,Number(incoming.influenceScore)||0);
  out.derivativeCount=Math.max(Number(base.derivativeCount)||0,Number(incoming.derivativeCount)||0);
  out.derivativeCircleCount=Math.max(Number(base.derivativeCircleCount)||0,Number(incoming.derivativeCircleCount)||0);
  out.derivativeAlbumCount=Math.max(Number(base.derivativeAlbumCount)||0,Number(incoming.derivativeAlbumCount)||0);
  out.year=base.year||incoming.year||null;
  return out;
}
function remember(t){
  if(!t?.id)return t;
  const direct=state.known.get(t.id);
  if(direct){
    const merged=mergeTrack(direct,t);
    state.known.set(direct.id,merged);
    return merged;
  }
  const key=identityKey(t),canonicalId=key&&state.identities.get(key);
  if(canonicalId&&state.known.has(canonicalId)){
    const base=state.known.get(canonicalId),merged=mergeTrack(base,t);
    state.known.set(canonicalId,merged);
    state.aliases.set(t.id,canonicalId);
    return merged;
  }
  state.known.set(t.id,t);
  state.aliases.set(t.id,t.id);
  if(key)state.identities.set(key,t.id);
  return t;
}
function resolveId(id){
  let cur=String(id||"");
  for(let i=0;i<8;i++){
    const next=state.aliases.get(cur);
    if(!next||next===cur)break;
    cur=next;
  }
  return cur;
}
function byId(id){return state.known.get(resolveId(id))||null}
function originalIds(t){return uniq((t?.originalIds||[]).map(resolveId))}
function originalTracks(t){return originalIds(t).map(byId).filter(Boolean)}
function originalNames(t){return originalTracks(t).map(x=>x.title)}
function dedupe(list){
  const seen=new Set(),out=[];
  for(const raw of list){
    const t=byId(raw?.id)||remember(raw);
    if(!t)continue;
    const id=resolveId(t.id);
    if(seen.has(id))continue;
    seen.add(id);out.push(t);
  }
  return out;
}
function currentPool(){
  let pool;
  if(state.full.loaded)pool=state.fullItems;
  else{
    const local=[...state.localOriginals,...state.localArrangements].map(x=>byId(x.id)||x);
    pool=dedupe([...local,...state.remoteItems]);
  }
  if(state.mode==="original")pool=pool.filter(t=>t.type==="original");
  if(state.mode==="arrangement")pool=pool.filter(t=>t.type==="arrangement");
  return pool;
}
function renderCatalog(title){
  refreshRanks();
  renderFilters();
  let list=currentPool();
  if(state.filter==="영상 있음")list=list.filter(t=>hasMediaCandidate(t));
  else if(state.filter!=="전체")list=list.filter(t=>t.circle===state.filter);
  const work=selectedWork();
  if(work)list=list.filter(t=>trackMatchesWork(t,work));
  const q=$("#searchInput").value.trim().toLowerCase();
  if(q)list=list.filter(t=>searchBlob(t).includes(q));
  list=sortList(list,state.sort);
  const key=JSON.stringify({q,mode:state.mode,filter:state.filter,work:state.workFilter,sort:state.sort,full:state.full.loaded});
  if(key!==state.renderKey){state.renderKey=key;state.displayLimit=state.full.loaded?60:Math.max(60,list.length)}
  state.lastMatchCount=list.length;
  const visible=state.full.loaded?list.slice(0,state.displayLimit):list;
  if(!q&&state.filter==="전체"&&state.sort==="recommend"&&!state.remoteItems.length&&!state.full.loaded)renderGrid(shuffle(visible).slice(0,12));
  else renderGrid(visible);
  $("#sectionTitle").textContent=title||catalogTitle(q,list.length);
  updateStats();syncCatalogFooter();
}
function renderWorkSelect(){
  const select=$("#workSelect");
  const groups=[["pc98","PC-98 · TH01–05"],["main","Windows 본편 · TH06–20"],["spinoff","공식 외전"]];
  select.innerHTML='<option value="">전체 작품 · '+state.works.length+'게임</option>'+groups.map(([kind,label])=>{
    const options=state.works.filter(w=>w.kind===kind).map(w=>'<option value="'+escAttr(w.id)+'">TH'+esc(w.number)+' · '+esc(w.title)+'</option>').join("");
    return '<optgroup label="'+escAttr(label)+'">'+options+'</optgroup>';
  }).join("");
  select.value=state.workFilter||"";
}
function trackMatchesWork(t,work){
  if(!work)return true;
  if(t.workId===work.id)return true;
  const hay=[t.work,t.album,...(t.moods||[]),...(t.aliases||[])].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
  return [work.title,work.tag,...(work.aliases||[])].some(v=>v&&hay.includes(String(v).normalize("NFKC").toLowerCase()));
}
function renderFilters(){
  const base=currentPool(),out=["전체","영상 있음"];
  if(state.mode==="arrangement"){
    uniq(base.map(x=>x.circle).filter(Boolean)).slice(0,10).forEach(x=>out.push(x));
  }
  if(!out.includes(state.filter))state.filter="전체";
  $("#quickFilters").innerHTML=out.map(x=>'<button class="filter-chip '+(x===state.filter?"is-active":"")+'" data-filter="'+escAttr(x)+'">'+esc(x)+'</button>').join("");
  $$("#quickFilters .filter-chip").forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;renderCatalog();loadRemote(true);});
}
function updateStats(){
  const meta=state.full.manifest;
  const loaded=[...state.known.values()];
  const localOrig=state.localOriginals.length,localArr=state.localArrangements.length;
  const originalCount=meta?.counts?.original||state.remote.counts.original||loaded.filter(x=>x.type==="original").length||localOrig;
  const arrangementCount=meta?.counts?.arrangement||state.remote.counts.arrangement||loaded.filter(x=>x.type==="arrangement").length||localArr;
  const mediaCount=meta?.counts?.mediaCandidates??null;
  $("#statOriginal").textContent=fmt(originalCount);
  $("#statArrangement").textContent=fmt(arrangementCount);
  $("#statMedia").textContent=mediaCount===null?"집계 중":fmt(mediaCount);
  $("#statOriginalMeta").textContent=meta?"공식 작품/ZUN 기준":"TouhouDB 공식 원곡 분류";
  $("#statArrangementMeta").textContent=meta?"전체 인덱스":"TouhouDB 어레인지 분류";
  $("#statMediaMeta").textContent=meta?"전체 "+fmt(meta.indexed)+"곡에서 PV 후보 확인":"전수 인덱스 생성 후 확정";
  updateCatalogTotal();
}
function updateCatalogTotal(){
  const n=state.full.manifest?.indexed||state.remote.catalogTotal||state.remote.total||state.known.size;
  $("#statLinks").textContent=fmt(n);
  $("#statLinksMeta").textContent=state.full.manifest?"전수 샤드 인덱스":state.remote.catalogTotal?"TouhouDB 전체 등록곡":"현재 로드";
  $("#heroCatalogCount").textContent=state.full.loading?fmt(state.full.loadedCount)+" / "+fmt(n):fmt(n)+" tracks";
}
function syncCatalogFooter(){
  const btn=$("#loadMoreBtn"),meta=$("#catalogMeta");
  const special=state.view==="library"||state.view==="history";
  $("#catalogFooter").hidden=special;
  if(special)return;
  if(state.full.loaded){
    const shown=Math.min(state.displayLimit,state.lastMatchCount);
    btn.disabled=shown>=state.lastMatchCount;
    btn.textContent=btn.disabled?"조건 일치 곡 모두 표시":"60곡 더 표시";
    meta.innerHTML='<span class="remote-pulse">FULL INDEX</span> · 전체 '+fmt(state.full.manifest?.indexed||state.fullItems.length)+'곡 · 조건 일치 '+fmt(state.lastMatchCount)+'곡 · 화면 '+fmt(shown)+'곡';
    return;
  }
  if(state.full.loading){
    btn.disabled=true;btn.textContent="전체 인덱스 받는 중…";
    meta.innerHTML='<span class="remote-pulse">FULL INDEX</span> · '+fmt(state.full.loadedCount)+' / '+fmt(state.full.manifest?.indexed||0)+'곡 다운로드 중';
    return;
  }
  if(!state.remote.available){
    btn.disabled=true;btn.textContent="라이브 DB 오프라인";return;
  }
  btn.disabled=state.remote.loading||(state.remote.total>0&&state.remote.start>=state.remote.total);
  btn.textContent=state.remote.loading?"다음 페이지 불러오는 중…":(btn.disabled?"현재 API 범위 모두 로드":"다음 50곡");
  meta.innerHTML='<span class="remote-pulse">TouhouDB</span> · 현재 캐시 '+fmt(state.remoteItems.length)+'곡'+
    (state.remote.total?" / API "+fmt(state.remote.total)+"곡":"")+
    (!btn.disabled?" · 전체 인덱스 준비 전 임시 페이지 로딩":"")+
    (state.remote.error?" · 오류 있음":"");
}
function catalogTitle(q,count){
  if(q)return `전체 DB 검색 · ${count}곡 표시`;
  const work=selectedWork();
  if(work)return "TH"+work.number+" · "+work.title;
  if(state.filter!=="전체")return state.filter;
  if(state.mode==="original")return "동방 공식 원곡 전체 탐색";
  if(state.mode==="arrangement")return "동방 2차창작 전체 탐색";
  return state.view==="home"?"오늘의 다이브 입구":"전체 카탈로그";
}
function renderGrid(list){
  const grid=$("#trackGrid");
  if(!list.length){
    grid.innerHTML=emptyCard("표시할 곡이 없습니다.","검색어나 필터를 바꿔보세요.");
    return;
  }
  grid.innerHTML=list.map(card).join("");
  grid.querySelectorAll("[data-open]").forEach(b=>b.onclick=e=>{e.stopPropagation();openTrack(byId(b.dataset.open))});
  grid.querySelectorAll("[data-dive]").forEach(b=>b.onclick=e=>{e.stopPropagation();startDive(byId(b.dataset.dive))});
  grid.querySelectorAll("[data-play]").forEach(b=>b.onclick=e=>{e.stopPropagation();playTrack(byId(b.dataset.play))});
  grid.querySelectorAll("[data-origin]").forEach(b=>b.onclick=e=>{e.stopPropagation();goToOriginal(byId(b.dataset.origin))});
  grid.querySelectorAll("[data-external]").forEach(b=>b.onclick=e=>{e.stopPropagation();openTrustedExternal(byId(b.dataset.external))});
}
function typeLabel(t){
  if(t?.category==="official-original"||t?.type==="original")return"OFFICIAL ORIGINAL";
  if(t?.category==="fan-original")return"FAN ORIGINAL";
  if(t?.category==="other")return"OTHER";
  return"ARRANGE";
}
function typeClass(t){
  if(t?.category==="fan-original")return"fan-original";
  if(t?.category==="other")return"other";
  return t?.type==="original"?"original":"arrangement";
}
function card(t){
  const playable=player.playable(t),external=trustedExternalMedia(t),canLookup=!playable&&!external&&state.remote.available,origins=originalNames(t);
  const rank=trackRank(t);
  const by=t.type==="arrangement"
    ? [t.circle,(t.artists?.vocal||[]).join(", ")].filter(Boolean).join(" · ")
    : [t.work||t.artistString,t.role,t.character].filter(Boolean).join(" · ");
  const thumb=t.thumb?' style="background-image:url(&quot;'+escAttr(t.thumb)+'&quot;)"':"";
  const originLine=t.type==="arrangement"
    ? "원곡 · "+(origins.join(" / ")||(t.originalIds?.length?"계보 연결 가능":"원곡 정보 확인 가능"))
    : (t.year||"연도 미상")+" · "+countChildren(t.id)+"개 연결";
  const originButton=t.type==="arrangement"
    ? '<button class="origin-jump" data-origin="'+escAttr(t.id)+'"><span>↖</span><strong>원곡</strong></button>'
    : "";
  return '<article class="track-card">'+
    '<button class="track-main" data-open="'+escAttr(t.id)+'">'+
      '<div class="track-thumb '+(t.thumb?"":"no-image")+'"'+thumb+'>'+
        '<div class="track-badges"><span class="type-badge '+escAttr(typeClass(t))+'">'+esc(typeLabel(t))+'</span><span class="rank-badge">'+esc(rankText(rank))+'</span><span class="percent-badge">'+esc(rankPercentText(rank))+'</span>'+(playable?'<span class="media-badge">▶ VIDEO</span>':'')+'</div>'+
      '</div>'+
      '<div class="track-copy"><h3>'+esc(t.title)+'</h3><div class="byline">'+esc(by||"정보 준비 중")+'</div><div class="origin-line">'+esc(originLine)+'</div>'+
        '<div class="tag-row">'+(t.moods||[]).slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div>'+
      '</div>'+
    '</button>'+
    '<div class="card-actions '+(originButton?"has-origin":"")+'">'+
      (playable?'<button class="play-btn" data-play="'+escAttr(t.id)+'">▶ 재생</button>':external?'<button class="play-btn external-play" data-external="'+escAttr(t.id)+'">↗ 외부 재생</button>':'<button class="play-btn" data-play="'+escAttr(t.id)+'" '+(canLookup?"":"disabled")+'>'+(canLookup?"⌕ 영상 찾기":"영상 없음")+'</button>')+
      originButton+'<button class="dive-btn" data-dive="'+escAttr(t.id)+'">⌁ 다이브</button></div>'+
  '</article>';
}
function openTrack(t,opts={}){
  if(!t)return;
  t=byId(t.id)||t;
  state.selected=t;pushHistory(t.id,t);
  refreshRanks();
  const canonicalId=resolveId(t.id);
  const fav=state.favorites.has(canonicalId),origins=originalTracks(t),children=[...state.known.values()].filter(a=>originalIds(a).includes(canonicalId));
  const artistLine=t.type==="arrangement"
    ? [t.circle&&"Circle "+t.circle,(t.artists?.arranger||[]).length&&"Arrange "+t.artists.arranger.join(", "),(t.artists?.vocal||[]).length&&"Vocal "+t.artists.vocal.join(", ")].filter(Boolean).join("<br>")
    : [t.work||t.artistString,t.role,t.character&&"Character "+t.character].filter(Boolean).join("<br>");
  const external=trustedExternalMedia(t);
  const source=t.media?.url||external?.url||t.source?.url||"";
  const rank=trackRank(t),popRank=popularityRankInfo(t),infRank=influenceRankInfo(t),links=trustedLinks(t);
  const canLookup=!player.playable(t)&&!external&&state.remote.available;
  const missing=(t.originalIds||[]).filter(id=>!byId(id));
  $("#detailContent").innerHTML=`
    <div class="detail-hero"><div class="detail-kicker">${typeLabel(t)} · ${t.touhoudbId?(t.remote?"TOUHOUDB LIVE":"LOCAL + TOUHOUDB"):"LOCAL VERIFIED"}</div><div class="detail-rank"><strong>종합 · ${rankText(rank)}</strong><span>${rankPercentText(rank)} · ${rank.fullScale?"전수 189,002곡 백분위 기반":"현재 표본 환산"} · ${rank.score.toFixed(1)}pt</span></div>
    <div class="rank-breakdown">
      <div><label>인기</label><strong>${popRank.rank?fmt(popRank.total)+"곡 중 "+fmt(popRank.rank)+"위":"집계 중"}</strong><small>${popRank.percent!==null?"상위 "+(popRank.percent<0.01?"<0.01":popRank.percent.toFixed(2))+"%":""}</small></div>
      ${infRank?'<div><label>원곡 영향력</label><strong>'+fmt(infRank.total)+'원곡 중 '+(infRank.rank?fmt(infRank.rank)+'위':"집계 중")+'</strong><small>파생 '+fmt(infRank.children)+'곡 · '+fmt(infRank.circles)+'서클 · '+fmt(infRank.albums)+'앨범</small></div>':""}
    </div><h2>${esc(t.title)}</h2><div class="detail-meta">${artistLine}<br>${t.year||""}${t.album?" · "+esc(t.album):""}</div></div>
    <div class="tag-row">${(t.moods||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>
    <div class="detail-actions"><button class="hot" id="detailPlay" ${player.playable(t)||external||canLookup?"":"disabled"}>${player.playable(t)?"▶ 앱에서 재생":external?"↗ 외부 재생":canLookup?"⌕ 영상 찾기":"영상 없음"}</button><button id="detailDive">⌁ 다이브</button>${t.type==="arrangement"?'<button class="origin-jump" id="detailOrigin"><span>↖</span><strong>원곡으로</strong></button>':""}<button id="favBtn">${fav?"♥ 보관됨":"♡ 보관하기"}</button>${source?`<a href="${escAttr(source)}" target="_blank" rel="noopener">원본 링크 ↗</a>`:'<button disabled>원본 링크 없음</button>'}</div>
    ${t.type==="arrangement"?lineageBox("이 어레인지의 원곡",origins,missing):lineageBox("이 원곡을 사용한 현재 로드 어레인지",children,[])}
    <div class="fact-box"><label>순위 기준</label><div class="detail-meta">종합 = 인기 + 원곡 영향력. 인기는 rating · 즐겨찾기 · DB 조회 · 재생 소스 다양성을 사용하고, 원곡 영향력은 파생 어레인지 수 · 파생 서클 수 · 파생 앨범 수를 사용합니다. 메인 표시는 전수 189,002곡 점수 백분위를 128,040곡 스케일로 변환합니다.</div></div>
    ${links.length?'<div class="fact-box trusted-links"><label>확인된 링크</label><div class="trusted-link-list">'+links.slice(0,12).map(x=>'<a href="'+escAttr(x.url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.provider)+' ↗</a>').join("")+'</div></div>':""}
    <div class="fact-box"><label>다이브 기준</label><div class="detail-meta">${esc(relationText(t))}</div></div>
    ${!opts.skipEnrich&&!t.touhoudbId&&state.remote.available?'<div class="detail-sync">TouhouDB에서 영상·통계를 보강하는 중…</div>':""}`;
  $("#detailPanel").classList.add("is-open");$("#detailPanel").setAttribute("aria-hidden","false");syncScrim();
  const play=$("#detailPlay");if(play)play.onclick=async()=>{
    if(!player.playable(t)&&trustedExternalMedia(t)){openTrustedExternal(t);closePanel();return}
    const ok=await playTrack(t);if(ok)closePanel();
  };
  $("#detailDive").onclick=()=>{startDive(t,{fresh:true});closePanel();};
  const originBtn=$("#detailOrigin");if(originBtn)originBtn.onclick=()=>goToOriginal(t);
  $("#favBtn").onclick=()=>toggleFavorite(t);
  $("#detailContent").querySelectorAll("[data-lineage]").forEach(b=>b.onclick=()=>openTrack(byId(b.dataset.lineage)));
  $("#detailContent").querySelectorAll("[data-hydrate]").forEach(b=>b.onclick=()=>hydrateAndOpen(b.dataset.hydrate));
  if(!opts.skipEnrich&&!t.touhoudbId&&state.remote.available){
    enrichTrack(t).then(enriched=>{
      if(enriched&&state.selected&&resolveId(state.selected.id)===resolveId(t.id)&&$("#detailPanel").classList.contains("is-open"))openTrack(enriched,{skipEnrich:true});
    }).catch(()=>{});
  }
}
async function enrichTrack(t){
  if(!t||!catalog?.lookupByTitle)return t;
  const id=resolveId(t.id);
  if(t.touhoudbId)return t;
  if(state.enriching.has(id))return state.enriching.get(id);
  const promise=(async()=>{
    const work=state.works.find(w=>w.id===t.workId)||state.works.find(w=>trackMatchesWork(t,w));
    const candidate=await catalog.lookupByTitle(t.title,{mode:t.type,tagName:work?.tag||""});
    if(!candidate)return t;
    const exact=normKey(candidate.title)===normKey(t.title)||(candidate.aliases||[]).some(a=>normKey(a)===normKey(t.title));
    if(!exact)return t;
    remember(candidate);
    refreshRanks();
    return byId(id)||byId(candidate.id)||t;
  })().finally(()=>state.enriching.delete(id));
  state.enriching.set(id,promise);
  return promise;
}
async function goToOriginal(t){
  if(!t||t.type!=="arrangement")return;
  let current=byId(t.id)||t;
  let ids=originalIds(current);
  if(!ids.length&&catalog&&String(current.id).startsWith("tdb-")){
    try{
      const hydrated=await catalog.hydrate(current.id);
      if(hydrated){current=remember(hydrated);ids=originalIds(current)}
    }catch(e){}
  }
  if(!ids.length){
    toast("이 곡은 TouhouDB에 원곡 연결 정보가 없습니다.");
    return;
  }
  let original=byId(ids[0]);
  if(!original&&catalog&&String(ids[0]).startsWith("tdb-")){
    try{original=remember(await catalog.hydrate(ids[0]))}catch(e){}
  }
  if(!original){toast("원곡 정보를 불러오지 못했습니다.");return}
  closePanel();
  state.mode="original";state.filter="전체";syncModeTabs();
  setView("discover");
  renderCatalog("원곡으로 이동");
  openTrack(original);
}
function lineageBox(label,tracks,missing){
  const rows=tracks.slice(0,12).map(x=>`<button class="lineage-link" data-lineage="${x.id}"><strong>${esc(x.title)}</strong><small>${esc(x.type==="arrangement"?(x.circle||""):(x.work||x.artistString||""))}</small></button>`);
  for(const id of missing.slice(0,5))rows.push(`<button class="lineage-link" data-hydrate="${escAttr(id)}"><strong>원곡 정보 불러오기</strong><small>${esc(id)} · TouhouDB</small></button>`);
  return `<div class="lineage-box"><label>${label}</label>${rows.length?rows.join(""):'<div class="detail-meta">아직 연결 데이터가 없습니다.</div>'}</div>`;
}
async function hydrateAndOpen(id){
  if(!catalog||!String(id).startsWith("tdb-"))return;
  try{const t=await catalog.hydrate(id);if(t){remember(t);openTrack(t);renderCatalog();}}catch(e){toast("원곡 계보를 불러오지 못했습니다.");}
}
function hasMediaCandidate(t){return !!(t&&(player.playable(t)||trustedExternalMedia(t)||(t.mediaCandidates||[]).length))}
function trustedExternalMedia(t){
  return (t?.mediaCandidates||[]).find(m=>m?.mode==="external"&&/^https?:\/\//.test(String(m.url||"")))||null;
}
function openTrustedExternal(t){
  const media=trustedExternalMedia(t);if(!media?.url)return false;
  try{window.open(media.url,"_blank","noopener,noreferrer");return true}catch(_){return false}
}
async function playTrack(t){
  if(!t)return false;
  t=byId(t.id)||t;
  if(state.remote.available&&catalog){
    try{
      if(!t.touhoudbId)t=await enrichTrack(t);
      if(t?.touhoudbId&&!t.lyricsLoaded){
        const hydrated=await catalog.hydrate(t.id);
        if(hydrated){remember(hydrated);t=byId(t.id)||remember(hydrated)}
      }
    }catch(e){}
  }
  if(!player.playable(t)&&state.remote.available){
    toast("재생 가능한 영상을 찾는 중…");
    try{t=await enrichTrack(t)}catch(e){}
  }
  if(!player.playable(t)){toast("재생 가능한 공개 영상이 없습니다.");return false}
  const relatedQueue=relations(t)
    .filter(r=>player.playable(r.track))
    .slice(0,24)
    .map(r=>({...r.track,_queueReason:r.reason}));
  const fallback=sortList(currentPool().filter(x=>resolveId(x.id)!==resolveId(t.id)&&player.playable(x)),"recommend")
    .slice(0,24);
  const queue=dedupe([{...t,_queueReason:"현재 재생"},...relatedQueue,...fallback]);
  const current=queue.find(x=>resolveId(x.id)===resolveId(t.id))||t;
  const ok=player.play(current,queue);
  if(ok)pushHistory(t.id,t);
  return ok;
}
function nav(view){
  closeMenu();
  player.routeChange();
  setView(view);
  if(view==="home"){
    state.mode="all";state.filter="전체";state.workFilter="";syncModeTabs();$("#workSelect").value="";
    $("#searchInput").value="";$("#searchClear").hidden=true;
    renderCatalog("오늘의 다이브 입구");loadRemote(true);
  }else if(view==="discover"){
    renderCatalog("전체 카탈로그");
  }else if(view==="dive"){
    const stage=$("#diveStage"),empty=$("#diveEmpty");
    if(state.selected)startDive(state.selected,{fresh:true});
    else{stage.hidden=true;empty.hidden=false;}
  }else if(view==="lineage"){
    renderLineageOverview();
  }else if(view==="iceberg"){
    renderIceberg();
  }else if(view==="library"){
    renderSpecial([...state.favorites].map(byId).filter(Boolean),"보관함");
  }else if(view==="history"){
    renderSpecial(state.history.map(byId).filter(Boolean),"최근 기록");
  }
  window.scrollTo({top:0,behavior:"smooth"});
}
function setView(view){
  state.view=view;
  document.body.dataset.view=view;
  $$(".nav-item[data-view]").forEach(x=>x.classList.toggle("is-active",x.dataset.view===view));
  const labels={home:"HOME",discover:"DISCOVER",lineage:"LINEAGE",iceberg:"ICEBERG",library:"LIBRARY",history:"HISTORY",dive:"DEEP DIVE"};
  $("#sectionEyebrow").textContent=labels[view]||"DISCOVER";
  $("#catalogTools").hidden=view==="library"||view==="history"||view==="iceberg"||view==="dive";
  syncCatalogFooter();
}
function renderSpecial(list,title){
  renderGrid(dedupe(list));
  $("#sectionTitle").textContent=title;
  updateStats();syncCatalogFooter();
}
function renderLineageOverview(){
  const list=currentPool().filter(t=>t.type==="original").sort((a,b)=>countChildren(b.id)-countChildren(a.id)||(a.year||9999)-(b.year||9999));
  renderGrid(list);
  $("#sectionTitle").textContent="원곡 → 2차창작 계보";
  syncCatalogFooter();
}
function startDive(t,opts={}){
  if(!t)return;
  t=byId(t.id)||t;
  const continuing=!!opts.continue;
  if(opts.fresh||!state.diveRoot||!continuing){
    state.diveRoot=resolveId(t.id);
    state.diveDepth=0;
  }else{
    state.diveDepth=Math.min(24,state.diveDepth+1);
  }
  state.selected=t;
  pushHistory(t.id,t);
  setView("dive");
  refreshRanks();
  const mobile=window.matchMedia("(max-width:860px)").matches;
  const related=relations(t).slice(0,mobile?6:9);
  const origin=originalTracks(t)[0]||null;
  const depthMeters=state.diveDepth*180;
  const stage=$("#diveStage"),empty=$("#diveEmpty");
  empty.hidden=true;stage.hidden=false;
  const positions=[[18,54],[50,57],[82,54],[12,72],[38,74],[65,74],[88,72],[28,90],[72,90]];
  const originNode=t.type==="arrangement"
    ? '<button class="dive-origin-node" data-current-origin="'+escAttr(t.id)+'">↖ 원곡 · '+esc(origin?.title||"원곡 정보 불러오기")+'</button>'
    : "";
  const playAction=player.playable(t)?'<button data-current-play="'+escAttr(t.id)+'">▶ 재생</button>':"";
  const originAction=t.type==="arrangement"?'<button class="origin-jump" data-current-origin="'+escAttr(t.id)+'">↖ 원곡</button>':"";
  const currentRank=trackRank(t);
  stage.innerHTML=originNode+
    '<article class="dive-current"><small>CURRENT DEPTH · '+depthMeters+'m · '+rankText(currentRank)+' · '+rankPercentText(currentRank)+'</small><h3>'+esc(t.title)+'</h3><p>'+esc(t.type==="arrangement"?(t.circle||"Arrangement"):(t.work||t.artistString||"Original"))+'</p><div class="dive-current-actions">'+playAction+originAction+'<button data-current-open="'+escAttr(t.id)+'">상세</button></div></article>'+
    related.map((r,i)=>{
      const p=positions[i]||[50,88];
      const rank=trackRank(r.track);
      return '<button class="dive-node" style="--x:'+p[0]+'%;--y:'+p[1]+'%" data-rel="'+escAttr(r.track.id)+'"><small>'+esc(r.reason)+' · '+rankText(rank)+' · '+rankPercentText(rank)+'</small><strong>'+esc(r.track.title)+'</strong><span>'+esc(r.track.type==="arrangement"?(r.track.circle||""):(r.track.work||r.track.artistString||""))+'</span></button>';
    }).join("")+
    '<div class="dive-depth-chip">DIVE '+(state.diveDepth+1)+' · '+depthMeters+'m · '+related.length+' SIGNALS</div>';
  stage.querySelectorAll("[data-rel]").forEach(b=>b.onclick=()=>startDive(byId(b.dataset.rel),{continue:true}));
  stage.querySelectorAll("[data-current-origin]").forEach(b=>b.onclick=()=>goToOriginal(t));
  const play=stage.querySelector("[data-current-play]");if(play)play.onclick=()=>playTrack(t);
  const open=stage.querySelector("[data-current-open]");if(open)open.onclick=()=>openTrack(t);
  window.scrollTo({top:0,behavior:"smooth"});
  player.routeChange();
}
function icebergVisibilityScore(t){
  const rating=Math.max(0,Number(t.ratingScore)||0);
  const favorites=Math.max(0,Number(t.favoritedTimes)||0);
  const hits=Math.max(0,Number(t.hitCount)||0);
  const media=player.playable(t)?6:0;
  const links=(t.type==="original"?countChildren(t.id):originalIds(t).length)*1.5;
  const meta=(t.album?1:0)+(t.circle?1:0)+(t.year?1:0);
  return rating*4+Math.log10(favorites+1)*10+Math.log10(hits+1)*2+media+links+meta;
}
function icebergMetricValue(t,mode=state.icebergMode){
  if(mode==="favorites")return Math.max(0,Number(t.favoritedTimes)||0);
  if(mode==="hits")return Math.max(0,Number(t.hitCount)||0);
  if(mode==="relations")return t.type==="original"?countChildren(t.id):originalIds(t).length;
  if(mode==="popularity"){
    const rating=Math.max(0,Number(t.ratingScore)||0);
    const favorites=Math.max(0,Number(t.favoritedTimes)||0);
    const hits=Math.max(0,Number(t.hitCount)||0);
    return rating*3+Math.log10(favorites+1)*12+Math.log10(hits+1)*3;
  }
  return icebergVisibilityScore(t);
}
function icebergModeMeta(){
  const map={
    visibility:{label:"가시성",help:"rating · favorite · DB 조회 · 영상 · 관계량을 혼합한 가시성"},
    popularity:{label:"인기도",help:"TouhouDB rating · favorite · DB 조회를 합성한 인기도"},
    favorites:{label:"즐겨찾기",help:"TouhouDB favoritedTimes가 많은 순서"},
    hits:{label:"DB 조회",help:"TouhouDB/VocaDB 항목 Hits 기준 · 영상 플랫폼 조회수와 별개"},
    relations:{label:"관계량",help:"원곡↔2차창작으로 현재 앱에서 연결된 곡 수"}
  };
  return map[state.icebergMode]||map.visibility;
}
function icebergPool(){
  let pool=state.full.loaded?state.fullItems:dedupe([...state.known.values()]);
  if(state.mode==="original")pool=pool.filter(t=>t.type==="original");
  if(state.mode==="arrangement")pool=pool.filter(t=>t.type==="arrangement");
  const work=selectedWork();if(work)pool=pool.filter(t=>trackMatchesWork(t,work));
  return pool;
}
function median(nums){
  const a=nums.filter(Number.isFinite).sort((x,y)=>x-y);
  if(!a.length)return 0;
  const m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function statValue(n){
  const v=Number(n)||0;
  if(v>=1000000)return (v/1000000).toFixed(v>=10000000?0:1)+"M";
  if(v>=1000)return (v/1000).toFixed(v>=10000?0:1)+"K";
  if(Number.isInteger(v))return v.toLocaleString();
  return v.toFixed(1);
}
function renderIcebergStats(pool,layerRows){
  const sampleTotal=pool.length;
  const archiveTracks=Math.max(0,Number(state.archiveSource?.arrangementTracks)||0);
  const originals=pool.filter(t=>t.type==="original").length;
  const arrangements=pool.filter(t=>t.type==="arrangement").length;
  const circles=new Set(pool.filter(t=>t.type==="arrangement").map(t=>t.circle).filter(Boolean)).size;
  const works=new Set(pool.flatMap(t=>t.workIds?.length?t.workIds:(t.work?[t.work]:[])).filter(Boolean)).size;
  const playable=pool.filter(t=>player.playable(t)).length;
  const hitCoverage=pool.filter(t=>Number(t.hitCount)>0).length;
  const values=pool.map(t=>icebergMetricValue(t)).filter(Number.isFinite);
  const avg=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
  const max=values.length?Math.max(...values):0;
  const coverage=archiveTracks?sampleTotal/archiveTracks*100:0;
  const meta=icebergModeMeta();
  $("#icebergModeHelp").textContent=meta.help;
  $("#icebergStats").innerHTML=[
    ["2차창작 아카이브",archiveTracks?fmt(archiveTracks):"—",state.archiveSource?.source||"외부 전체 규모"],
    ["현재 빙산 표본",fmt(sampleTotal),archiveTracks?"전체 규모 대비 "+(coverage<0.01?coverage.toFixed(3):coverage.toFixed(2))+"%":"현재 로드/필터"],
    ["공식 원곡",fmt(originals),sampleTotal?Math.round(originals/sampleTotal*100)+"%":"0%"],
    ["2차창작 표본",fmt(arrangements),sampleTotal?Math.round(arrangements/sampleTotal*100)+"%":"0%"],
    ["서클 표본",fmt(circles),state.archiveSource?.circles?"/ 아카이브 "+fmt(state.archiveSource.circles):"중복 제외"],
    ["작품 표본",fmt(works),"현재 식별됨"],
    ["영상 표본",fmt(playable),sampleTotal?Math.round(playable/sampleTotal*100)+"%":"0%"],
    [meta.label+" 평균",statValue(avg),"중앙 "+statValue(median(values))],
    [meta.label+" 최고",statValue(max),state.icebergMode==="hits"?"Hits 보유 "+hitCoverage+"곡":"현재 표본"],
    ["앨범 아카이브",state.archiveSource?.albums?fmt(state.archiveSource.albums):"—",state.archiveSource?.events?fmt(state.archiveSource.events)+" 이벤트":"외부 통계"]
  ].map(x=>'<article><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></article>').join("");

  const title=archiveTracks?"전체 아카이브 환산 · 권역별 곡 수":"현재 빙산 표본 · 권역별 곡 수";
  $("#icebergRegionStats").innerHTML='<div class="region-stat-title"><strong>'+title+'</strong><span>'+(archiveTracks?fmt(archiveTracks)+"곡 전체 규모":fmt(sampleTotal)+"곡 표본")+'</span></div>'+
    layerRows.map(row=>{
      const pct=Math.round((row.archiveShare||0)*100);
      const mainCount=archiveTracks?row.archiveCount:row.items.length;
      return '<div class="region-stat-row"><span>'+esc(row.layer.name)+'</span><div class="region-stat-bar"><i style="width:'+pct+'%"></i></div><strong>'+fmt(mainCount)+'곡</strong><small>'+pct+'% · 표본 '+fmt(row.items.length)+'</small></div>';
    }).join("")+
    '<div class="region-stat-foot">'+(archiveTracks
      ?'큰 숫자는 '+fmt(archiveTracks)+'곡 전체 규모를 현재 빙산 권역 비율로 환산한 값입니다. 실제 12.8만곡 전수 분류가 붙기 전까지 표본 실측값은 옆에 따로 표시합니다.'
      :'현재 로드된 '+fmt(sampleTotal)+'곡 표본으로 계산됩니다.')+'</div>';
}
function renderIceberg(){
  const layers=[
    {name:"수면",sub:"상위 가시성권",a:"#173a55",b:"#102c47"},
    {name:"얕은층",sub:"높은 인지도권",a:"#12304d",b:"#0d263f"},
    {name:"중층",sub:"중상위 탐색권",a:"#0e2741",b:"#0a2037"},
    {name:"심층",sub:"깊게 파고들수록 보이는 곡",a:"#0b2037",b:"#08192d"},
    {name:"해구",sub:"낮은 가시성권",a:"#08182b",b:"#061321"},
    {name:"심연",sub:"현재 풀의 최심부",a:"#06111f",b:"#030912"}
  ];
  let pool=icebergPool();
  pool=pool.sort((a,b)=>icebergMetricValue(b)-icebergMetricValue(a)||recommendScore(b)-recommendScore(a));
  const root=$("#iceberg");
  if(!pool.length){
    $("#icebergStats").innerHTML="";
    $("#icebergRegionStats").innerHTML="";
    root.innerHTML='<div class="iceberg-empty">빙산에 표시할 곡이 없습니다.</div>';
    return;
  }
  // 상층은 좁고 중·심층이 넓도록 실제 빙산 같은 분포 폭을 사용.
  const cuts=[0,.07,.20,.40,.65,.85,1];
  const archiveTracks=Math.max(0,Number(state.archiveSource?.arrangementTracks)||0);
  const rows=layers.map((layer,i)=>{
    const start=Math.round(pool.length*cuts[i]);
    const end=Math.round(pool.length*cuts[i+1]);
    const archiveStart=archiveTracks?Math.round(archiveTracks*cuts[i]):0;
    const archiveEnd=archiveTracks?Math.round(archiveTracks*cuts[i+1]):0;
    return{
      layer,start,end,items:pool.slice(start,end),
      archiveShare:cuts[i+1]-cuts[i],
      archiveCount:archiveTracks?archiveEnd-archiveStart:0
    };
  });
  renderIcebergStats(pool,rows);
  const metric=icebergModeMeta();
  root.innerHTML=rows.map((row,i)=>{
    const display=row.items.slice(0,12);
    const values=row.items.map(t=>icebergMetricValue(t));
    const lo=values.length?Math.min(...values):0,hi=values.length?Math.max(...values):0;
    return '<section class="ice-layer" style="--ice-a:'+row.layer.a+';--ice-b:'+row.layer.b+'">'+
      '<div class="ice-layer-head"><div><small>LAYER '+(i+1)+'</small><strong>'+row.layer.name+'</strong><span>'+row.layer.sub+'</span></div>'+
      '<span>'+(archiveTracks?'전체 환산 '+fmt(row.archiveCount)+'곡 · ':'')+'표본 '+fmt(row.items.length)+'곡 · '+metric.label+' '+statValue(lo)+'–'+statValue(hi)+'</span></div>'+
      '<div class="ice-tracks">'+display.map(t=>{const rank=trackRank(t);return '<button class="ice-track" data-ice-dive="'+escAttr(t.id)+'"><span class="ice-rank">종합 #'+rank.rank+'</span><b>'+esc(t.title)+'</b><small>'+esc(t.type==="arrangement"?(t.circle||"Arrangement"):(t.work||"Original"))+'</small><small class="ice-metric">'+esc(metric.label)+' · '+esc(statValue(icebergMetricValue(t)))+'</small>'+(t.type==="arrangement"?'<small class="ice-origin">↖ '+esc(originalNames(t)[0]||"원곡 연결 확인")+'</small>':'')+'</button>'}).join("")+'</div>'+
      (row.items.length>display.length?'<div class="ice-layer-more">이 권역 '+fmt(row.items.length-display.length)+'곡 더 있음</div>':"")+
    '</section>';
  }).join("");
  root.querySelectorAll("[data-ice-dive]").forEach(b=>b.onclick=()=>startDive(byId(b.dataset.iceDive),{fresh:true}));
}
function relations(t){
  const pool=[...state.known.values()];
  const tOrig=new Set(t.type==="original"?[resolveId(t.id)]:originalIds(t));
  return pool.filter(x=>resolveId(x.id)!==resolveId(t.id)).map(x=>{
    let score=0,reasons=[];
    const xOrig=new Set(x.type==="original"?[resolveId(x.id)]:originalIds(x));
    const shared=[...tOrig].filter(id=>xOrig.has(id));
    if(shared.length){score+=12*shared.length;reasons.push("같은 원곡 계보")}
    if(t.type==="original"&&originalIds(x).includes(resolveId(t.id))){score+=16;reasons.unshift("이 원곡의 어레인지")}
    if(x.type==="original"&&originalIds(t).includes(resolveId(x.id))){score+=16;reasons.unshift("원곡으로 이동")}
    if(t.work&&x.work===t.work){score+=5;reasons.push("같은 작품")}
    if(t.circle&&x.circle&&t.circle===x.circle&&t.circle!=="ZUN"){score+=7;reasons.push("같은 서클")}
    const tv=t.artists?.vocal||[],xv=x.artists?.vocal||[];
    if(tv.some(v=>xv.includes(v))){score+=6;reasons.push("같은 보컬")}
    const moods=(t.moods||[]).filter(m=>(x.moods||[]).includes(m));
    if(moods.length){score+=2*moods.length;reasons.push("태그 "+moods[0])}
    const yd=Math.abs((t.year||2000)-(x.year||2000));
    score+=Math.max(0,2-yd/5);
    if(player.playable(x))score+=.5;
    return{track:x,score,reason:reasons[0]||"시대·태그 브리지"};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
}
function relationText(t){
  const r=relations(t).slice(0,3);
  return r.length?r.map(x=>x.track.title).join(" → ")+" · "+r[0].reason:"전체 DB에서 연결 후보를 더 불러오면 관계가 확장됩니다.";
}
function countChildren(id){
  const target=resolveId(id);
  if(state.full.loaded)return state.childCounts.get(target)||0;
  return [...state.known.values()].filter(a=>originalIds(a).includes(target)).length;
}
function searchBlob(t){
  if(t._search)return t._search;
  const originals=originalNames(t).join(" "),artists=t.artists?Object.values(t.artists).flat().join(" "):"";
  return [t.title,...(t.aliases||[]),t.work,t.role,t.character,t.circle,t.album,t.artistString,artists,originals,...(t.moods||[])].filter(Boolean).join(" ").toLowerCase();
}
function popularityScore(t){
  const rating=Math.max(0,Number(t.ratingScore)||0);
  const favorites=Math.max(0,Number(t.favoritedTimes)||0);
  const hits=Math.max(0,Number(t.hitCount)||0);
  const providers=new Set((t.mediaCandidates||[]).map(m=>m?.provider).filter(Boolean)).size;
  return rating*5+Math.log10(favorites+1)*18+Math.log10(hits+1)*6+Math.min(4,providers)*2;
}
function influenceScore(t){
  if(t?.type!=="original")return 0;
  const children=Math.max(0,Number(t.derivativeCount)||countChildren(t.id));
  const circles=Math.max(0,Number(t.derivativeCircleCount)||0);
  const albums=Math.max(0,Number(t.derivativeAlbumCount)||0);
  return Math.log10(children+1)*34+Math.log10(circles+1)*22+Math.log10(albums+1)*14;
}
function overallRankScore(t){return popularityScore(t)+influenceScore(t)}
function refreshRanks(){
  if(state.full.loaded){
    state.rankTotal=state.full.manifest?.indexed||state.fullItems.length;
    return;
  }
  const pool=dedupe([...state.known.values()]).sort((a,b)=>overallRankScore(b)-overallRankScore(a)||recommendScore(b)-recommendScore(a)||a.title.localeCompare(b.title,"ja"));
  state.rankIndex=new Map(pool.map((t,i)=>[resolveId(t.id),{rank:i+1,score:overallRankScore(t)}]));
  state.rankTotal=pool.length;
}
function archiveRankTotal(){
  return Math.max(Number(state.archiveSource?.arrangementTracks)||128040,1);
}
function projectArchiveRank(sampleRank,sampleTotal,archiveTotal){
  const r=Number(sampleRank),n=Number(sampleTotal),a=Number(archiveTotal);
  if(!Number.isFinite(r)||r<1)return null;
  if(!Number.isFinite(a)||a<1||a<=n||n<=1)return r;
  return Math.max(1,Math.min(a,1+Math.round((r-1)*(a-1)/(n-1))));
}
function trackRank(t){
  if(!t)return{rank:null,sampleRank:null,score:0,total:archiveRankTotal(),sampleTotal:state.rankTotal||0,estimated:false,fullScale:false};
  const total=archiveRankTotal();
  if(t.globalRank&&state.full.manifest){
    const fullTotal=Number(state.full.manifest.indexed)||state.fullItems.length||1;
    const scaled=projectArchiveRank(t.globalRank,fullTotal,total);
    return{
      rank:scaled,sampleRank:t.globalRank,score:Number(t.globalScore)||overallRankScore(t),
      total,sampleTotal:fullTotal,estimated:false,fullScale:true
    };
  }
  if(!state.rankIndex.size||!state.rankIndex.has(resolveId(t.id)))refreshRanks();
  const row=state.rankIndex.get(resolveId(t.id))||{rank:null,score:overallRankScore(t)};
  const projected=projectArchiveRank(row.rank,state.rankTotal,total);
  return{rank:projected,sampleRank:row.rank,score:row.score,total,sampleTotal:state.rankTotal,estimated:total>state.rankTotal,fullScale:false};
}
function rankPercentValue(rank){
  if(!rank?.rank||!rank?.total)return null;
  return rank.rank/rank.total*100;
}
function rankPercentText(rank){
  const p=rankPercentValue(rank);
  if(p===null)return"상위 —";
  if(p<0.01)return"상위 <0.01%";
  return "상위 "+p.toFixed(2)+"%";
}
function rankText(rank){
  if(!rank||!rank.rank)return fmt(archiveRankTotal())+"곡 중 —위";
  return fmt(rank.total)+"곡 중 "+fmt(rank.rank)+"위";
}
function scaleFullRank(rawRank,rawTotal=state.full.manifest?.indexed||state.fullItems.length||1){
  return projectArchiveRank(Number(rawRank)||0,Number(rawTotal)||1,archiveRankTotal());
}
function popularityRankInfo(t){
  const total=archiveRankTotal();
  if(t?.popularityRank&&state.full.manifest){
    const rank=scaleFullRank(t.popularityRank);
    return{rank,total,percent:rank/total*100,score:Number(t.popularityScore)||popularityScore(t),rawRank:t.popularityRank};
  }
  return{rank:null,total,percent:null,score:popularityScore(t),rawRank:null};
}
function influenceRankInfo(t){
  const originals=Number(state.full.manifest?.counts?.original)||state.fullItems.filter(x=>x.type==="original").length||1;
  if(t?.type!=="original")return null;
  return{
    rank:Number(t.influenceRank)||null,total:originals,score:Number(t.influenceScore)||influenceScore(t),
    children:Number(t.derivativeCount)||countChildren(t.id),
    circles:Number(t.derivativeCircleCount)||0,
    albums:Number(t.derivativeAlbumCount)||0
  };
}
function trustedLinks(t){
  const seen=new Set(),out=[];
  for(const m of t?.mediaCandidates||[]){
    const url=String(m?.url||"").trim();
    if(!url||!/^https?:\/\//.test(url))continue;
    const key=(m.provider||"link")+":"+url;
    if(seen.has(key))continue;
    seen.add(key);out.push({provider:m.provider||"link",url});
  }
  return out;
}
function sortList(list,sort){
  if(sort==="year-desc")return [...list].sort((a,b)=>(b.year||0)-(a.year||0));
  if(sort==="year-asc")return [...list].sort((a,b)=>(a.year||9999)-(b.year||9999));
  if(sort==="title")return [...list].sort((a,b)=>a.title.localeCompare(b.title,"ja"));
  if(sort==="popularity"){
    return [...list].sort((a,b)=>(Number(a.popularityRank)||1e12)-(Number(b.popularityRank)||1e12)||popularityScore(b)-popularityScore(a));
  }
  if(sort==="influence"){
    return [...list].sort((a,b)=>{
      if(a.type!==b.type)return a.type==="original"?-1:1;
      return (Number(a.influenceRank)||1e12)-(Number(b.influenceRank)||1e12)||influenceScore(b)-influenceScore(a);
    });
  }
  if(state.full.loaded)return list;
  return [...list].sort((a,b)=>overallRankScore(b)-overallRankScore(a)||recommendScore(b)-recommendScore(a));
}
function recommendScore(t){return (Number(t.ratingScore)||0)*3+(Number(t.favoritedTimes)||0)*.08+(player.playable(t)?5:0)+(t.type==="arrangement"?2:0)+(t.originalIds?.length?3:0)+(t.moods?.length||0)*.2}
function randomDive(){const pool=currentPool();if(pool.length)startDive(pool[Math.floor(Math.random()*pool.length)])}
function snapshotTrack(t){
  return{id:t.id,type:t.type,category:t.category||"",songTypeRaw:t.songTypeRaw||"",title:t.title,aliases:t.aliases||[],year:t.year||null,work:t.work||"",workId:t.workId||"",workIds:t.workIds||[],role:t.role||"",character:t.character||"",circle:t.circle||"",album:t.album||"",moods:t.moods||[],originalIds:t.originalIds||[],artists:t.artists||{},artistString:t.artistString||"",media:t.media||null,mediaCandidates:t.mediaCandidates||[],mediaUnavailable:!!t.mediaUnavailable,thumb:t.thumb||"",source:t.source||null,touhoudbId:t.touhoudbId||null,ratingScore:Number(t.ratingScore)||0,favoritedTimes:Number(t.favoritedTimes)||0,hitCount:Number(t.hitCount)||0,globalRank:Number(t.globalRank)||null,globalScore:Number(t.globalScore)||0,popularityRank:Number(t.popularityRank)||null,popularityScore:Number(t.popularityScore)||0,influenceRank:Number(t.influenceRank)||null,influenceScore:Number(t.influenceScore)||0,derivativeCount:Number(t.derivativeCount)||0,derivativeCircleCount:Number(t.derivativeCircleCount)||0,derivativeAlbumCount:Number(t.derivativeAlbumCount)||0,remote:!!t.remote};
}
function persistSnapshot(t){
  if(!t)return;
  const s=snapshotTrack(t);state.snapshots[s.id]=s;
  const keys=Object.keys(state.snapshots);
  if(keys.length>120)for(const k of keys.slice(0,keys.length-120))delete state.snapshots[k];
  writeJson("touhoudive:snapshots",state.snapshots);
}
function toggleFavorite(t){
  const id=resolveId(t.id);
  state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);
  persistSnapshot(t);writeJson("touhoudive:favorites",[...state.favorites]);
  openTrack(byId(id)||t);
  toast(state.favorites.has(id)?"보관함에 저장했습니다.":"보관함에서 제거했습니다.");
}
function pushHistory(id,t){
  id=resolveId(id);
  state.history=[id,...state.history.map(resolveId).filter(x=>x!==id)].slice(0,60);
  if(t)persistSnapshot(t);
  writeJson("touhoudive:history",state.history);
}
function normalizePersistentIds(){
  state.favorites=new Set([...state.favorites].map(resolveId));
  state.history=state.history.map(resolveId);
  writeJson("touhoudive:favorites",[...state.favorites]);
  writeJson("touhoudive:history",state.history);
}
function syncModeTabs(){$$("#modeTabs .mode-tab").forEach(x=>x.classList.toggle("is-active",x.dataset.mode===state.mode))}
function setDataHealth(kind,text){
  const el=$("#dataHealth");
  el.classList.toggle("is-loading",kind==="loading");
  el.classList.toggle("is-error",kind==="error");
  $("#datasetStatus").textContent=text;
}
function closePanel(){$("#detailPanel").classList.remove("is-open");$("#detailPanel").setAttribute("aria-hidden","true");syncScrim();}
function closeMenu(){$("#sidebar").classList.remove("is-open");syncScrim();}
function syncScrim(){const on=$("#detailPanel").classList.contains("is-open")||$("#sidebar").classList.contains("is-open");$("#scrim").classList.toggle("is-open",on);}
function toggleTheme(){const html=document.documentElement,next=html.dataset.theme==="light"?"dark":"light";html.dataset.theme=next;localStorage.setItem("touhoudive:theme",next);}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),1700);}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function uniq(a){return [...new Set((a||[]).filter(Boolean))]}
function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||"")||fallback}catch{return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function emptyCard(title,sub){return '<div class="empty-state" style="grid-column:1/-1;min-height:190px"><div class="empty-icon">東</div><strong>'+esc(title)+'</strong><span>'+esc(sub)+'</span></div>'}
function fmt(n){return Number(n||0).toLocaleString()}
function normKey(v){return String(v||"").normalize("NFKC").toLowerCase().replace(/[\s\u3000\p{P}\p{S}]+/gu,"")}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function escAttr(v){return esc(v)}
document.documentElement.dataset.theme=localStorage.getItem("touhoudive:theme")||"dark";