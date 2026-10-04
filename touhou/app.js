const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const catalog=window.TouhouCatalog;
const fullIndex=window.TouhouFullIndex;
const player=new window.TouhouMediaPlayer();

const state={
  localOriginals:[],localArrangements:[],localFanOriginals:[],known:new Map(),aliases:new Map(),identities:new Map(),remoteItems:[],fullItems:[],works:[],archiveSource:null,fanYoutubeMeta:null,
  mode:"all",filter:"전체",workFilter:"",sort:"recommend",selected:null,view:"home",diveDepth:0,diveRoot:null,icebergMode:"visibility",rankIndex:new Map(),rankTotal:0,enriching:new Map(),homeMixIds:[],beginnerCircleCache:new Map(),beginnerCircleLoading:new Set(),beginnerIndex:{loaded:false,loading:false,tracks:[],total:0,video:0,explicitMv:0,error:""},
  full:{available:false,loading:false,loaded:false,streaming:false,manifest:null,loadedCount:0,error:""},displayLimit:60,renderKey:"",lastMatchCount:0,childCounts:new Map(),
  relations:{ready:false,building:false,byOriginal:new Map(),byWork:new Map(),byCircle:new Map(),byVocal:new Map(),byMood:new Map()},
  remote:{available:false,loading:false,start:0,total:0,catalogTotal:0,key:"",error:"",counts:{},seq:0},
  favorites:new Set(readJson("touhoudive:favorites",[])),
  history:readJson("touhoudive:history",[]),
  snapshots:readJson("touhoudive:snapshots",{})
};
let searchTimer=0,localSearchTimer=0,uiBound=false,customBgObjectUrl="";
const CUSTOM_SKIN_SETTINGS_KEY="touhoudive:customSkin:v1";

document.documentElement.dataset.theme=localStorage.getItem("touhoudive:theme")||"dark";
document.documentElement.dataset.skin=localStorage.getItem("touhoudive:skin")||"station";
boot();

async function loadLocalJson(path,fallback){
  const url=new URL(path,document.baseURI).href;
  let lastError=null;
  for(const cacheMode of ["no-store","reload"]){
    try{
      const r=await fetch(url,{cache:cacheMode});
      if(!r.ok)throw new Error(path+" HTTP "+r.status);
      return{ok:true,data:await r.json(),source:cacheMode,error:null};
    }catch(e){lastError=e}
  }
  try{
    if("caches" in window){
      const cached=await caches.match(url,{ignoreSearch:true});
      if(cached)return{ok:true,data:await cached.json(),source:"cache-fallback",error:null};
    }
  }catch(e){lastError=e}
  console.warn("local data unavailable",path,lastError);
  return{ok:false,data:fallback,source:"fallback",error:String(lastError?.message||lastError||"unknown")};
}
function expandFanAlbums(raw){
  const albums=Array.isArray(raw?.albums)?raw.albums:Array.isArray(raw)?raw:[];
  const out=[];
  for(const album of albums){
    const tracks=Array.isArray(album?.tracks)?album.tracks:[];
    tracks.forEach((row,i)=>{
      const item=typeof row==="string"?{title:row}:row||{};
      const title=String(item.title||"").trim();if(!title)return;
      const artist=String(item.artist||album.artist||"").trim();
      const provider=album.provider||"bandcamp";
      const mediaUrl=String(item.url||album.url||"").trim();
      const sourceKind=String(album.sourceKind||"touhou-style-catalog");
      out.push({
        id:"fan-album-"+String(album.id||"collection")+"-"+String(i+1).padStart(2,"0"),
        type:"fan-original",category:"fan-original",title,
        year:Number(item.year||album.year)||null,
        circle:String(album.artist||artist||"Touhou-style").trim(),
        artistString:artist||String(album.artist||"").trim(),
        album:String(album.title||"").trim(),
        role:"Touhou-style original",
        moods:uniq(["동방풍","Touhou-style",sourceKind,...(album.tags||[]),...(item.tags||[])]),
        originalIds:[],
        artists:{composer:artist?[artist]:[]},
        aliases:Array.isArray(item.aliases)?item.aliases:[],
        touhouStyle:true,styleClass:"touhou-style-catalog",
        classification:{
          basis:String(album.evidence||"verified-album-source"),
          note:"검증된 동방풍 자작곡/동방 팬게임 오리지널 OST 컬렉션. 공식 동방 원곡·어레인지와 별도 집계.",
          evidenceUrl:String(album.url||""),
          sourceKind
        },
        media:mediaUrl?{provider,url:mediaUrl,mode:"external",name:title+" · "+String(album.title||"source")}:null,
        mediaCandidates:mediaUrl?[{provider,url:mediaUrl,mode:"external",name:title+" · "+String(album.title||"source")}]:[],
        source:mediaUrl?{name:(artist||album.artist||"Touhou-style")+" · "+String(album.title||"source"),url:mediaUrl}:null,
        publishDate:album.year?String(album.year)+"-01-01":"",
        remote:false
      });
    });
  }
  return out;
}
async function boot(){
  try{
    bind();
  }catch(err){
    console.error("UI binding failed",err);
    setDataHealth("error","UI 초기화 오류 · 새로고침 필요");
  }
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js?v=0.9.39").then(r=>r.update()).catch(err=>console.warn("service worker",err));
  }

  const [or,ar,fr,far,fy,wr,sr]=await Promise.all([
    loadLocalJson("./data/originals.json",[]),
    loadLocalJson("./data/arrangements.json",[]),
    loadLocalJson("./data/fan-originals.json",[]),
    loadLocalJson("./data/fan-original-albums.json",{albums:[]}),
    loadLocalJson("./data/fan-youtube.json",{items:{}}),
    loadLocalJson("./data/works.json",[]),
    loadLocalJson("./data/archive-sources.json",null)
  ]);

  state.works=Array.isArray(wr.data)?wr.data:[];
  state.archiveSource=sr.data&&typeof sr.data==="object"?sr.data:null;
  catalog?.setWorks?.(state.works);
  fullIndex?.setWorks?.(state.works);
  state.localOriginals=(Array.isArray(or.data)?or.data:[]).map(x=>({...x,type:"original",circle:"ZUN",album:x.work,originalIds:[],remote:false}));
  state.localArrangements=(Array.isArray(ar.data)?ar.data:[]).map(x=>({...x,type:"arrangement",remote:false}));
  state.localFanOriginals=[
    ...(Array.isArray(fr.data)?fr.data:[]).map(x=>({...x,type:"fan-original",category:"fan-original",originalIds:[],remote:false})),
    ...expandFanAlbums(far.data)
  ];
  state.fanYoutubeMeta=fy.data&&typeof fy.data==="object"?fy.data:null;
  const fanYoutube=fy.data?.items&&typeof fy.data.items==="object"?fy.data.items:{};
  state.localFanOriginals=state.localFanOriginals.map(x=>{
    const hit=fanYoutube[x.id];
    if(!hit?.videoId||hit.videoUnavailable||hit.embeddable===false)return x;
    const yt={
      provider:"youtube",id:String(hit.videoId),
      url:"https://www.youtube.com/watch?v="+encodeURIComponent(hit.videoId),
      name:hit.videoTitle||x.title,mode:"embed",matchScore:Number(hit.score)||0,
      viewCount:Number.isFinite(Number(hit.viewCount))?Number(hit.viewCount):null,
      likeCount:Number.isFinite(Number(hit.likeCount))?Number(hit.likeCount):null,
      commentCount:Number.isFinite(Number(hit.commentCount))?Number(hit.commentCount):null,
      statsUpdatedAt:hit.statsUpdatedAt||""
    };
    return{
      ...x,
      mediaCandidates:uniqMedia([yt,...(x.mediaCandidates||[]),x.media]),
      media:yt,
      thumb:x.thumb||("https://i.ytimg.com/vi/"+encodeURIComponent(hit.videoId)+"/mqdefault.jpg"),
      youtubeMatched:true
    };
  });
  [...state.localOriginals,...state.localArrangements,...state.localFanOriginals].forEach(remember);
  Object.values(state.snapshots||{}).forEach(x=>x&&remember({...x,snapshot:true}));
  normalizePersistentIds();

  try{
    renderWorkSelect();
    setView("home");
    renderLocalFirst();
  }catch(err){
    console.error("initial render failed",err);
    $("#trackGrid").innerHTML='<div class="empty-state" style="grid-column:1/-1;min-height:220px"><strong>초기 화면 구성 중 오류가 발생했습니다.</strong><span>라이브 DB 연결은 계속 시도합니다.</span></div>';
  }

  const criticalFailed=!or.ok||!ar.ok||!fr.ok||!far.ok||!wr.ok;
  if(criticalFailed){
    const failed=[!or.ok&&"원곡",!ar.ok&&"2차창작",!fr.ok&&"동방풍 시드",!far.ok&&"동방풍 대량목록",!wr.ok&&"작품"].filter(Boolean).join(" · ");
    setDataHealth("loading","로컬 일부 재시도 필요("+failed+") · 라이브 DB 연결 중");
  }

  connectFullDataset();
  connectRemote().catch(err=>remoteFail(String(err?.message||err)));
}
function bind(){
  if(uiBound)return;
  $("#searchInput").addEventListener("input",()=>{
    $("#searchClear").hidden=!$("#searchInput").value;
    if($("#searchInput").value&&state.view!=="discover")setView("discover");
    clearTimeout(localSearchTimer);
    localSearchTimer=setTimeout(()=>renderCatalog(),110);
    clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>loadRemote(true),320);
  });
  $("#searchClear").onclick=()=>{
    $("#searchInput").value="";
    $("#searchClear").hidden=true;
    renderCatalog();
    loadRemote(true);
    $("#searchInput").focus();
  };
  $("#workSelect").addEventListener("change",e=>{
    state.workFilter=e.target.value;
    if(state.workFilter&&state.view==="home")setView("discover");
    requestAnimationFrame(()=>state.view==="iceberg"?renderIceberg():renderCatalog());
    loadRemote(true);
  });
  $("#sortSelect").addEventListener("change",e=>{
    state.sort=e.target.value;
    if(state.sort==="influence"){state.mode="original";state.filter="전체";syncModeTabs();}
    requestAnimationFrame(()=>renderCatalog());
    loadRemote(true);
  });
  const playbackMode=$("#playbackMode");
  if(playbackMode){
    playbackMode.value=player.getYoutubeMode?.()||"inline";
    playbackMode.addEventListener("change",e=>{
      const mode=player.setYoutubeMode?.(e.target.value)||"inline";
      toast(mode==="youtube"
        ?"YouTube 영상은 YouTube 앱/브라우저에서 열어 로그인·Premium 상태를 사용합니다."
        :"YouTube 영상을 TouhouDive 안에서 재생합니다.");
    });
  }
  $("#loadMoreBtn").onclick=()=>{
    if(state.full.loaded){showMoreFull();return}
    if(state.full.streaming&&state.displayLimit<state.lastMatchCount){
      state.displayLimit=Math.min(state.lastMatchCount,state.displayLimit+60);
      renderCatalog();
      return;
    }
    loadRemote(false);
  };
  $("#randomBtn").onclick=randomDive;$("#heroDiveBtn").onclick=randomDive;
  $("#playableBtn").onclick=()=>{state.mode="all";state.filter="인앱 재생";syncModeTabs();renderCatalog("인앱 재생 가능한 곡");loadRemote(true);};
  $("#refreshBtn").onclick=()=>{state.homeMixIds=[];renderCatalog(state.view==="home"?"오늘의 스테이션 믹스":undefined);loadRemote(true,true);};
  $("#icebergRefresh").onclick=()=>renderIceberg();
  $$("#icebergModeTabs [data-ice-mode]").forEach(btn=>btn.onclick=()=>{
    state.icebergMode=btn.dataset.iceMode;
    $$("#icebergModeTabs [data-ice-mode]").forEach(x=>x.classList.toggle("is-active",x===btn));
    renderIceberg();
  });
  $("#panelClose").onclick=closePanel;
  $("#skinPanelClose").onclick=closeSkinPanel;
  $("#scrim").onclick=()=>{closePanel();closeMenu();closeSkinPanel();};
  $("#menuBtn").onclick=()=>{$("#sidebar").classList.toggle("is-open");syncScrim();};
  $("#themeBtn").onclick=toggleTheme;
  $("#skinBtn").onclick=openSkinPanel;
  $("#skinTopBtn").onclick=openSkinPanel;
  $$("#skinPanel [data-skin-choice]").forEach(btn=>btn.onclick=()=>setSkin(btn.dataset.skinChoice));
  $("#customBgInput").addEventListener("change",async e=>{
    const file=e.target.files?.[0];e.target.value="";
    if(!file)return;
    if(!String(file.type||"").startsWith("image/")){toast("이미지 파일만 사용할 수 있습니다.");return}
    if(file.size>25*1024*1024){toast("이미지는 25MB 이하로 선택해 주세요.");return}
    try{
      const optimized=await optimizeCustomSkinImage(file);
      await putCustomSkinImage(optimized);
      setSkin("custom");
      await loadCustomSkinImage();
      toast("내 그림을 CUSTOM 배경으로 저장했습니다.");
    }catch(err){
      console.warn("custom skin image save failed",err);
      toast("이미지를 저장하지 못했습니다.");
    }
  });
  $("#customBgDim").addEventListener("input",e=>updateCustomSkinSetting("dim",Number(e.target.value)||0));
  $("#customBgFit").addEventListener("change",e=>updateCustomSkinSetting("fit",e.target.value==="contain"?"contain":"cover"));
  $("#customBgRemove").onclick=async()=>{
    try{await deleteCustomSkinImage();await loadCustomSkinImage();toast("CUSTOM 배경 그림을 제거했습니다.");}
    catch(err){console.warn(err);toast("그림을 제거하지 못했습니다.");}
  };
  applyCustomSkinSettings();
  loadCustomSkinImage().catch(()=>{});
  syncSkinButtons();
  syncSkinPanel();
  window.addEventListener("touhoudive:media-unavailable",e=>{
    const t=byId(e.detail?.trackId);if(t)t.mediaUnavailable=true;
    if(state.view==="discover"||state.view==="home")renderCatalog();
    toast("비공개·삭제·임베드 제한 영상은 자동 제외했습니다.");
  });
  window.addEventListener("touhoudive:pip-hint",e=>toast(e.detail?.message||"이 브라우저에서는 시스템 PiP가 제한됩니다."));
  window.addEventListener("touhoudive:player-track",async e=>{
    const id=e.detail?.trackId,t=byId(id);if(!t)return;
    player.setFavoriteState?.(state.favorites.has(resolveId(t.id)));
    try{
      let merged=t;
      const alreadyRanked=!!(t.globalRank||t.popularityRank||t.influenceRank||t.viewRank);
      if(!alreadyRanked&&fullIndex?.enrichTrack&&t.touhoudbId){
        const rich=await fullIndex.enrichTrack(t);
        if(rich)merged=remember(rich);
      }
      player.updateCurrentData?.({...merged,_playerRanks:playerRankMeta(merged)});
    }catch(_){}
  });
  window.addEventListener("touhoudive:player-action",async e=>{
    const action=e.detail?.action,id=e.detail?.trackId,t=byId(id)||player.current;
    if(!t)return;
    if(action==="favorite"){
      toggleFavorite(t,{open:false});
      player.setFavoriteState?.(state.favorites.has(resolveId(t.id)));
      return;
    }
    if(action==="origin"){
      player.minimize?.();
      await goToOriginal(t);
      return;
    }
    if(action==="dive"){
      player.minimize?.();
      startDive(t,{fresh:true});
      return;
    }
    if(action==="detail"){
      player.minimize?.();
      openTrack(t);
    }
  });
  document.addEventListener("click",e=>{
    const modeBtn=e.target.closest?.("#modeTabs .mode-tab");
    if(modeBtn){
      state.mode=modeBtn.dataset.mode;state.filter="전체";state.homeMixIds=[];
      if(state.mode==="fan-original"||state.mode==="db-fan-original"){state.workFilter="";$("#workSelect").value=""}
      syncModeTabs();
      if(state.mode==="beginner")ensureBeginnerIndex();
      requestAnimationFrame(()=>state.view==="iceberg"?renderIceberg():renderCatalog());
      loadRemote(true);
      return;
    }
    const navBtn=e.target.closest?.(".nav-item[data-view]");
    if(navBtn)nav(navBtn.dataset.view);
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="/"&&document.activeElement!==$("#searchInput")){e.preventDefault();$("#searchInput").focus();}
    if(e.key==="Escape"){closePanel();closeMenu();closeSkinPanel();if(!player.shell.classList.contains("is-mini")&&!player.shell.hidden)player.minimize();}
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
  uiBound=true;
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
    const mobile=window.matchMedia("(max-width:860px)").matches||((navigator.deviceMemory||8)<=4);
    state.full.available=true;state.full.manifest=meta;state.full.loadedCount=0;
    if(mobile){
      state.full.streaming=true;state.full.loading=false;state.full.loaded=false;
      setDataHealth("ok","모바일 스트리밍 · 전체 "+fmt(meta.indexed)+"곡");
      $("#heroCatalogCount").textContent=fmt(meta.indexed)+" tracks";
      updateStats();syncCatalogFooter();
      return;
    }
    state.full.streaming=false;state.full.loading=true;
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
    state.homeMixIds=[];
    state.childCounts=new Map();
    for(const t of state.fullItems){
      for(const oid of (t.originalIds||[])){
        const canonical=resolveId(oid);
        state.childCounts.set(canonical,(state.childCounts.get(canonical)||0)+1);
      }
    }
    state.full.loaded=true;state.full.loading=false;state.full.loadedCount=state.fullItems.length;
    state.rankIndex.clear();state.rankTotal=result.manifest.indexed;
    buildRelationIndex(state.fullItems);
    setDataHealth("ok","FULL INDEX · "+fmt(state.fullItems.length)+"곡");
    state.displayLimit=60;state.renderKey="";
    renderCatalog("전체 인덱스");
    updateStats();
    if(state.view==="iceberg")renderIceberg();
  }catch(e){
    state.full.loading=false;state.full.error=String(e?.message||e);
    if(state.remote.available)setDataHealth("ok",state.full.streaming?"모바일 스트리밍 · 전체 "+fmt(state.full.manifest?.indexed||state.remote.catalogTotal)+"곡":"TouhouDB LIVE · "+fmt(state.remote.catalogTotal)+"곡");
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
    setDataHealth("ok",state.full.streaming?"모바일 스트리밍 · 전체 "+fmt(state.full.manifest?.indexed||state.remote.catalogTotal)+"곡":"TouhouDB LIVE · "+fmt(state.remote.catalogTotal)+"곡");
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
function remoteMode(){
  if(state.mode==="db-fan-original")return"fan-original";
  if(state.mode==="beginner")return"all";
  return state.mode;
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
  if(state.mode==="fan-original"){
    state.remoteItems=[];state.remote.start=0;state.remote.error="";
    renderCatalog("동방풍 오리지널");setDataHealth("ok","동방풍 큐레이션 · "+fmt(state.localFanOriginals.length)+"곡");syncCatalogFooter();
    return;
  }
  if(state.full.loaded)return;
  if(!state.remote.available)return;
  if(!reset&&state.remote.loading)return;
  const key=remoteKey();
  if(reset||key!==state.remote.key){state.remote.start=0;state.remoteItems=[];state.remote.key=key}
  const seq=++state.remote.seq;
  const start=state.remote.start;
  state.remote.loading=true;
  setDataHealth("loading",state.full.streaming?"모바일 스트리밍 로딩 · 전체 "+fmt(state.full.manifest?.indexed||state.remote.catalogTotal||0)+"곡":"TouhouDB 불러오는 중");
  syncCatalogFooter();
  if(force&&catalog?.clearCache)catalog.clearCache();
  try{
    const work=selectedWork();
    const res=await catalog.search({
      query:$("#searchInput").value.trim(),mode:remoteMode(),start,maxResults:50,
      sort:remoteSort(),onlyWithPvs:state.filter==="인앱 재생"||state.filter==="영상 있음",tagName:work?.tag||"",force
    });
    if(seq!==state.remote.seq||key!==remoteKey())return;
    let incoming=(res.items||[]).map(t=>{const work=selectedWork();return remember(work?{...t,workId:work.id,work:t.work||work.title}:t)});
    if(state.mode==="original")incoming=incoming.filter(t=>t.type==="original");
    if(state.mode==="arrangement")incoming=incoming.filter(t=>t.type==="arrangement");
    if(state.mode==="db-fan-original")incoming=incoming.filter(t=>isFanOriginal(t)&&!isCuratedStyle(t));
    if(state.mode==="fan-original")incoming=[];
    state.remoteItems=dedupe([...state.remoteItems,...incoming]);
    if(state.view==="home")state.homeMixIds=[];
    state.remote.start=start+(Number(res.consumed)||Number(res.raw?.items?.length)||res.items?.length||0);
    state.remote.total=Number(res.total)||state.remote.total;
    state.remote.error="";
    renderCatalog(force?"새 추천":undefined);
    setDataHealth("ok",state.full.streaming?"모바일 스트리밍 · 전체 "+fmt(state.full.manifest?.indexed||state.remote.catalogTotal)+"곡 · 현재 "+fmt(state.remoteItems.length)+"곡 캐시":"TouhouDB LIVE · "+fmt(state.remoteItems.length)+"곡 로드");
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
  if(state.full.streaming||window.matchMedia("(max-width:860px)").matches||((navigator.deviceMemory||8)<=4))return;
  state.remote.warming=true;
  const key=remoteKey();
  try{
    for(let i=0;i<2;i++){
      await new Promise(r=>setTimeout(r,500));
      if(key!==remoteKey()||state.remote.loading||state.remote.start>=state.remote.total)break;
      await loadRemote(false);
    }
  }finally{state.remote.warming=false}
}
function uniqMedia(list){
  const index=new Map(),out=[];
  for(const raw of list||[]){
    if(!raw?.provider||(!raw?.id&&!raw?.url))continue;
    const m={...raw},k=m.provider+":"+(m.id||m.url);
    if(!index.has(k)){index.set(k,out.length);out.push(m);continue}
    const i=index.get(k),prev=out[i]||{};
    out[i]={
      ...prev,...m,
      id:prev.id||m.id,url:prev.url||m.url,name:prev.name||m.name,
      viewCount:Math.max(Number(prev.viewCount)||0,Number(m.viewCount)||0)||null
    };
  }
  return out;
}
function nextPaint(){return new Promise(r=>requestAnimationFrame(()=>r()))}
function addRelationIndex(map,key,t,limit=56){
  key=String(key||"").trim();if(!key)return;
  let rows=map.get(key);
  if(!rows){rows=[];map.set(key,rows)}
  if(rows.length<limit)rows.push(t);
}
async function buildRelationIndex(items){
  if(state.relations.building||state.relations.ready||!items?.length)return;
  state.relations.building=true;
  const idx=state.relations;
  try{
    for(let i=0;i<items.length;i++){
      const t=items[i];
      if(t.type==="original")addRelationIndex(idx.byOriginal,resolveId(t.id),t,64);
      for(const oid of originalIds(t))addRelationIndex(idx.byOriginal,oid,t,64);
      addRelationIndex(idx.byWork,t.workId||t.work,t,48);
      if(t.circle&&t.circle!=="ZUN")addRelationIndex(idx.byCircle,t.circle,t,48);
      for(const v of (t.artists?.vocal||[]).slice(0,3))addRelationIndex(idx.byVocal,v,t,40);
      for(const m of (t.moods||[]).slice(0,5))addRelationIndex(idx.byMood,m,t,32);
      if(i&&i%2500===0)await nextPaint();
    }
    idx.ready=true;
  }finally{idx.building=false}
}
function childTracksFor(id,limit=24){
  const target=resolveId(id),indexed=state.relations.byOriginal.get(target)||[];
  if(indexed.length)return indexed.filter(x=>x.type==="arrangement"&&originalIds(x).includes(target)).slice(0,limit);
  const pool=state.full.loaded
    ? dedupe([...state.localArrangements,...state.remoteItems,...state.fullItems.slice(0,1200)])
    : dedupe([...state.localArrangements,...state.remoteItems]);
  return pool.filter(a=>originalIds(a).includes(target)).slice(0,limit);
}
function relationCandidatePool(t){
  const idx=state.relations,out=[t,...state.localOriginals,...state.localArrangements,...state.remoteItems];
  const pushRows=rows=>{if(rows?.length)out.push(...rows)};
  const orig=t.type==="original"?[resolveId(t.id)]:originalIds(t);
  orig.forEach(id=>pushRows(idx.byOriginal.get(id)));
  pushRows(idx.byWork.get(t.workId||t.work));
  if(t.circle&&t.circle!=="ZUN")pushRows(idx.byCircle.get(t.circle));
  for(const v of (t.artists?.vocal||[]).slice(0,3))pushRows(idx.byVocal.get(v));
  for(const m of (t.moods||[]).slice(0,4))pushRows(idx.byMood.get(m));
  for(const x of originalTracks(t))out.push(x);
  if(state.full.loaded&&!idx.ready)out.push(...state.fullItems.slice(0,900));
  return dedupe(out).filter(x=>resolveId(x.id)!==resolveId(t.id));
}
function identityKey(t){
  if(!t)return"";
  const title=normKey(t.title);
  if(!title)return"";
  if(t.type==="original")return"original|"+title;
  if(isFanOriginal(t))return"fan-original|"+title+"|"+normKey(t.artistString||t.circle||"");
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
  out.viewRank=minRank(base.viewRank,incoming.viewRank);
  out.viewScore=Math.max(Number(base.viewScore)||0,Number(incoming.viewScore)||0);
  out.viewTotal=Math.max(Number(base.viewTotal)||0,Number(incoming.viewTotal)||0);
  out.viewMax=Math.max(Number(base.viewMax)||0,Number(incoming.viewMax)||0);
  out.viewPlatformCount=Math.max(Number(base.viewPlatformCount)||0,Number(incoming.viewPlatformCount)||0);
  out.viewMediaCount=Math.max(Number(base.viewMediaCount)||0,Number(incoming.viewMediaCount)||0);
  out.derivativeCount=Math.max(Number(base.derivativeCount)||0,Number(incoming.derivativeCount)||0);
  out.derivativeCircleCount=Math.max(Number(base.derivativeCircleCount)||0,Number(incoming.derivativeCircleCount)||0);
  out.derivativeAlbumCount=Math.max(Number(base.derivativeAlbumCount)||0,Number(incoming.derivativeAlbumCount)||0);
  out.derivativeMediaCount=Math.max(Number(base.derivativeMediaCount)||0,Number(incoming.derivativeMediaCount)||0);
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
function mergeRemoteIntoTrack(base,incoming){
  if(!base||!incoming)return base||incoming;
  const canonical=resolveId(base.id)||base.id;
  const merged=mergeTrack({...base,id:canonical},incoming);
  merged.id=canonical;
  state.known.set(canonical,merged);
  if(incoming.id)state.aliases.set(incoming.id,canonical);
  const key=identityKey(merged);if(key)state.identities.set(key,canonical);
  return merged;
}
function sampleRankByScore(t,scoreFn,pool=currentPool()){
  const score=scoreFn(t);let ahead=0,tiedBefore=0;
  const title=String(t?.title||"");
  for(const x of pool){
    if(resolveId(x.id)===resolveId(t.id))continue;
    const s=scoreFn(x);
    if(s>score)ahead++;
    else if(s===score&&String(x.title||"").localeCompare(title,"ja")<0)tiedBefore++;
  }
  return{rank:ahead+tiedBefore+1,total:pool.length,score};
}
function activeSortRankInfo(t){
  const pool=currentPool();
  if(!t||!pool.length)return null;
  if(state.sort==="popularity"){
    const p=popularityRankInfo(t);
    if(p.rank)return{label:"인기순",value:fmt(p.total)+"곡 중 "+fmt(p.rank)+"위",sub:p.percent!==null?"상위 "+(p.percent<0.01?"<0.01":p.percent.toFixed(2))+"%":""};
    if(p.stale)return{label:"인기순",value:"v6 재집계 중",sub:"이전 랭킹 숨김"};
    const sample=pool.length>5000?pool.slice(0,1200):pool;
    const r=sampleRankByScore(t,popularityScore,sample);return{label:"인기순",value:fmt(p.total)+"곡 전체 · 순위 준비 중",sub:"현재 로드 표본 "+fmt(r.rank)+"/"+fmt(r.total)};
  }
  if(state.sort==="influence"&&t.type==="original"){
    const i=influenceRankInfo(t);
    if(i?.rank)return{label:"영향력순",value:fmt(i.total)+"원곡 중 "+fmt(i.rank)+"위",sub:"파생 "+fmt(i.children)+"곡"};
    if(i?.stale)return{label:"영향력순",value:"v6 재집계 중",sub:"현재 파생 점수만 표시"};
    const originals=pool.filter(x=>x.type==="original").slice(0,1200),r=sampleRankByScore(t,influenceScore,originals);return{label:"영향력순",value:fmt(r.total)+"원곡 중 "+fmt(r.rank)+"위",sub:"현재 로드 표본"};
  }
  if(state.sort==="views"){
    const v=viewRankInfo(t);
    if(v?.rank)return{label:"조회수순",value:fmt(v.total)+"확인곡 중 "+fmt(v.rank)+"위",sub:"부분표본 · "+fmt(v.views)+"회"};
    if(v?.partial)return{label:"조회수순",value:"부분 집계 "+fmt(v.total)+"곡",sub:"앱에서 기다리는 로딩 아님"};
    return{label:"조회수순",value:"조회수 미집계",sub:"실제 조회수 값 없음"};
  }
  if(state.sort==="year-desc"||state.sort==="year-asc"){
    if(!t.year)return{label:state.sort==="year-desc"?"최신순":"오래된순",value:"연도 미상",sub:""};
    let ahead=0;for(const x of pool){if(!x.year||resolveId(x.id)===resolveId(t.id))continue;if(state.sort==="year-desc"&&x.year>t.year)ahead++;if(state.sort==="year-asc"&&x.year<t.year)ahead++}
    return{label:state.sort==="year-desc"?"최신순":"오래된순",value:fmt(pool.length)+"곡 중 약 "+fmt(ahead+1)+"위",sub:String(t.year)};
  }
  if(state.sort==="title"){
    let ahead=0;for(const x of pool){if(resolveId(x.id)!==resolveId(t.id)&&String(x.title||"").localeCompare(String(t.title||""),"ja")<0)ahead++}
    return{label:"제목순",value:fmt(pool.length)+"곡 중 "+fmt(ahead+1)+"위",sub:"가나다/문자 정렬"};
  }
  if(state.mode==="beginner"){
    const pool=currentPool().filter(beginnerEligible),r=sampleRankByScore(t,beginnerScore,pool);
    return{label:"입문 추천",value:fmt(r.total)+"곡 중 "+fmt(r.rank)+"위",sub:beginnerReason(t)+" · "+beginnerScore(t).toFixed(1)+"pt"};
  }
  const r=trackRank(t);return{label:"종합순",value:rankText(r),sub:rankPercentText(r)};
}
function playerRankMeta(t){
  refreshRanks();
  const overall=trackRank(t),pop=popularityRankInfo(t),inf=influenceRankInfo(t),views=viewRankInfo(t);
  let popValue="",popSub="";
  if(pop.rank){popValue=fmt(pop.total)+"곡 중 "+fmt(pop.rank)+"위";popSub=pop.percent!==null?"상위 "+(pop.percent<0.01?"<0.01":pop.percent.toFixed(2))+"%":""}
  else if(pop.stale){popValue="v6 재집계 중";popSub="이전 랭킹 숨김"}
  else{
    const pool=currentPool(),sample=pool.length>5000?pool.slice(0,1200):pool;
    const r=sampleRankByScore(t,popularityScore,sample);popValue=fmt(pop.total)+"곡 전체 · 순위 준비 중";popSub="현재 로드 표본 "+fmt(r.rank)+"/"+fmt(r.total);
  }
  const fan=isCuratedStyle(t);
  return{
    overall:{label:fan?"동방풍 순위":"종합",value:rankText(overall),sub:rankPercentText(overall),detail:overallRankDetail(t)},
    popularity:{label:fan?"동방풍 인기":"인기",value:popValue,sub:popSub,detail:popularityRankDetail(t)},
    influence:inf?{label:"원곡 영향력",value:inf.rank?fmt(inf.total)+"원곡 중 "+fmt(inf.rank)+"위":"현재 표본 계산",sub:"파생 "+fmt(inf.children)+"곡 · "+fmt(inf.circles)+"서클",detail:influenceRankDetail(t)}:null,
    views:views?{label:"플랫폼 조회수",value:views.rank?fmt(views.total)+"확인곡 중 "+fmt(views.rank)+"위":views.partial?"부분 집계 "+fmt(views.total)+"곡":fmt(views.views)+"회",sub:views.partial?"FULL INDEX 재빌드 때 갱신":fmt(views.platforms)+"개 플랫폼 · "+fmt(views.media)+"개 영상",detail:viewRankDetail(t)}:null,
    active:activeSortRankInfo(t)
  };
}
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
const BEGINNER_TITLE_SEEDS=[
  "U.N.オーエンは彼女なのか？","亡き王女の為のセプテット","恋色マスタースパーク","少女綺想曲 ～ Dream Battle",
  "上海紅茶館 ～ Chinese Tea","月まで届け、不死の煙","竹取飛翔 ～ Lunatic Princess","幽雅に咲かせ、墨染の桜 ～ Border of Life",
  "ネイティブフェイス","神々が恋した幻想郷","ハルトマンの妖怪少女","感情の摩天楼 ～ Cosmic Mind",
  "平安のエイリアン","偶像に世界を委ねて ～ Idoratrize World",
  "魔理沙は大変なものを盗んでいきました","チルノのパーフェクトさんすう教室","患部で止まってすぐ溶ける ～ 狂気の優曇華院",
  "ウサテイ","ひれ伏せ愚民どもっ！","Help me, ERINNNNNN!!","Bad Apple!! feat. nomico","ナイト・オブ・ナイツ"
];
const BEGINNER_CIRCLE_GROUPS=[
  {key:"iosys",label:"IOSYS",aliases:["iosys"]},
  {key:"yuuhei",label:"유폐 새틀라이트",aliases:["幽閉サテライト","yuuhei satellite","yuuheisatellite"]},
  {key:"shinra",label:"삼라만상",aliases:["森羅万象","shinra-bansho","shinra bansho","shinrabansho"]},
  {key:"coolcreate",label:"COOL&CREATE",aliases:["cool&create","cool create","coolcreate"]},
  {key:"soundholic",label:"SOUND HOLIC",aliases:["sound holic","soundholic"]},
  {key:"eastnewsound",label:"EastNewSound",aliases:["eastnewsound","east new sound"]},
  {key:"akatsuki",label:"暁Records",aliases:["暁records","akatsuki records","akatsukirecords"]},
  {key:"tamaonsen",label:"魂音泉",aliases:["魂音泉","tamaonsen"]},
  {key:"aone",label:"A-One",aliases:["a-one","a one"]},
  {key:"alstroemeria",label:"Alstroemeria Records",aliases:["alstroemeria records","alstroemeriarecords"]},
  {key:"shibayan",label:"ShibayanRecords",aliases:["shibayanrecords","shibayan records"]},
  {key:"felt",label:"FELT",aliases:["felt"]},
  {key:"digitalwing",label:"DiGiTAL WiNG",aliases:["digital wing","digitalwing"]},
  {key:"halozy",label:"Halozy",aliases:["halozy"]},
  {key:"amateras",label:"Amateras Records",aliases:["amateras records","amaterasrecords"]},
  {key:"silverforest",label:"Silver Forest",aliases:["silver forest","silverforest"]},
  {key:"tumeneco",label:"TUMENECO",aliases:["tumeneco"]},
  {key:"getinthering",label:"GET IN THE RING",aliases:["get in the ring","getinthering"]},
  {key:"active-neets",label:"東京アクティブNEETs",aliases:["東京アクティブneets","tokyo active neets","東京アクティブニーツ"]},
  {key:"dzy",label:"凋叶棕 / RD-Sounds",aliases:["凋叶棕","rd-sounds","rdsounds"]},
  {key:"kishida",label:"岸田教団",aliases:["岸田教団","岸田教団&the明星ロケッツ","kishida kyoudan","kishida教団"]},
  {key:"tamusic",label:"TAMUSIC",aliases:["tamusic"]},
  {key:"cclays",label:"C-CLAYS",aliases:["c-clays","c clays","cclays"]},
  {key:"syncarts",label:"SYNC.ART'S",aliases:["sync.art's","sync arts","syncarts"]},
  {key:"innocentkey",label:"Innocent Key",aliases:["innocent key","innocentkey"]},
  {key:"beatmario",label:"beatMARIO",kind:"creator",aliases:["beatmario","ビートまりお"]},
  {key:"minoshima",label:"Masayoshi Minoshima",kind:"creator",aliases:["masayoshi minoshima","minoshima masayoshi"]},
  {key:"rdsounds",label:"RD-Sounds",kind:"creator",aliases:["rd-sounds","rdsounds"]},
  {key:"shibayan-creator",label:"Shibayan",kind:"creator",aliases:["shibayan"]},
  {key:"redalice",label:"REDALiCE",kind:"creator",aliases:["redalice"]},
  {key:"djcommand",label:"DJ Command",kind:"creator",aliases:["dj command","djcommand"]},
  {key:"elementas",label:"ELEMENTAS",kind:"creator",aliases:["elementas"]},
  {key:"tracy",label:"Tracy",kind:"creator",aliases:["tracy amateras","tracy"]},
  {key:"actrock",label:"ACTRock",kind:"creator",aliases:["actrock"]},
  {key:"kaztora",label:"kaztora",kind:"creator",aliases:["kaztora"]}
];
const BEGINNER_CIRCLES=BEGINNER_CIRCLE_GROUPS.flatMap(x=>x.aliases).map(x=>String(x).normalize("NFKC").toLowerCase());
function beginnerNorm(v){return String(v||"").normalize("NFKC").toLowerCase().replace(/[\s\u3000~～・_\-—:：!?！？.,'"“”‘’()[\]{}&＋+]+/g,"")}
const BEGINNER_TITLE_KEYS=new Set(BEGINNER_TITLE_SEEDS.map(beginnerNorm));
function beginnerTitleHit(t){
  const keys=[t?.title,...(t?.aliases||[]),...originalNames(t)].map(beginnerNorm).filter(Boolean);
  return keys.some(k=>BEGINNER_TITLE_KEYS.has(k));
}
function beginnerCircleKey(t){
  return [t?.circle,t?.artistString,...Object.values(t?.artists||{}).flat()].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
}
function beginnerCircleGroup(key){return BEGINNER_CIRCLE_GROUPS.find(x=>x.key===String(key||"").replace(/^beginner-circle:/,""))||null}
function beginnerCircleMatch(t,group){
  if(!group)return false;
  const hay=beginnerNorm(beginnerCircleKey(t));
  return group.aliases.some(x=>hay.includes(beginnerNorm(x)));
}
function isIosysTrack(t){return beginnerCircleMatch(t,beginnerCircleGroup("iosys"))}
function isBeginnerCircle(t){
  return BEGINNER_CIRCLE_GROUPS.some(group=>beginnerCircleMatch(t,group));
}
async function ensureBeginnerCircleResults(filterKey){
  const group=beginnerCircleGroup(filterKey);
  if(!group||state.beginnerCircleCache.has(group.key)||state.beginnerCircleLoading.has(group.key)||!fullIndex?.searchByCircleAliases)return;
  state.beginnerCircleLoading.add(group.key);renderCatalog();
  try{
    const result=await fullIndex.searchByCircleAliases(group.aliases,{concurrency:3});
    const tracks=dedupe((result?.tracks||[]).map(remember));
    state.beginnerCircleCache.set(group.key,tracks);
  }catch(err){
    console.warn("beginner circle full-index search failed",group.key,err);
    toast(group.label+" 전체 검색에 실패했습니다.");
  }finally{
    state.beginnerCircleLoading.delete(group.key);
    state.renderKey="";renderCatalog();
  }
}
function beginnerVideoInfo(t){
  const rows=(t?.mediaCandidates||[]).filter(m=>["youtube","niconico","bilibili"].includes(m?.provider));
  const explicit=rows.some(m=>/(?:^|\b)(?:mv|pv)(?:\b|$)|music\s*video|official\s*(?:video|mv|pv)|公式(?:mv|pv|動画|映像)|ミュージック(?:ビデオ|ビデオ)|映像作品/i.test(String(m?.name||"")+" "+String(m?.url||"")));
  return{video:rows.length>0,explicit,count:rows.length};
}
async function ensureBeginnerIndex(){
  if(state.beginnerIndex.loaded||state.beginnerIndex.loading||!fullIndex?.searchBeginnerCandidates)return;
  state.beginnerIndex.loading=true;state.beginnerIndex.error="";
  if(state.mode==="beginner"){state.renderKey="";renderCatalog()}
  try{
    const result=await fullIndex.searchBeginnerCandidates({
      titleSeeds:BEGINNER_TITLE_SEEDS,
      circleAliases:BEGINNER_CIRCLE_GROUPS.flatMap(x=>x.aliases),
      limit:3600,concurrency:3
    });
    const tracks=dedupe((result?.tracks||[]).map(remember));
    state.beginnerIndex={loaded:true,loading:false,tracks,total:tracks.length,video:Number(result?.video)||0,explicitMv:Number(result?.explicitMv)||0,error:""};
  }catch(err){
    console.warn("beginner full-index search failed",err);
    state.beginnerIndex.loading=false;state.beginnerIndex.error=String(err?.message||err);
    toast("입문 추천 전체 인덱스 검색에 실패했습니다.");
  }finally{
    state.renderKey="";
    if(state.mode==="beginner")renderCatalog();
  }
}
function isVocalTrack(t){
  return !!((t?.artists?.vocal||[]).length||/(vocal|보컬|歌|feat\.?)/i.test([t?.artistString,...(t?.moods||[])].filter(Boolean).join(" ")));
}
function beginnerScore(t){
  if(!t)return 0;
  const cat=relationCategory(t),views=mediaViewStats(t),popRank=Number(t.popularityRank)||0,globalRank=Number(t.globalRank)||0,video=beginnerVideoInfo(t);
  let score=Math.max(0,Number(t.beginnerIndexScore)||0)*.55;
  if(beginnerTitleHit(t))score+=62;
  if(isIosysTrack(t))score+=48;
  else if(isBeginnerCircle(t))score+=24;
  if(cat==="official-original")score+=26;
  else if(["arrangement","rearrangement","remix","cover"].includes(cat))score+=13;
  if(video.explicit)score+=92;
  else if(video.video)score+=48;
  if(player.playable(t))score+=14;
  if(views.mediaCount)score+=Math.min(34,Math.log10(views.total+1)*5.5);
  if(popRank>0)score+=popRank<=100?30:popRank<=500?24:popRank<=2000?18:popRank<=10000?11:popRank<=30000?5:0;
  if(globalRank>0)score+=globalRank<=200?20:globalRank<=1000?15:globalRank<=5000?10:globalRank<=20000?5:0;
  if(isVocalTrack(t))score+=5;
  if(sourceProviders(t).size>=2)score+=6;
  return score;
}
function beginnerEligible(t){
  return Number(t?.beginnerIndexScore)>0||beginnerTitleHit(t)||isBeginnerCircle(t)||beginnerScore(t)>=28;
}
function beginnerFilterMatch(t,key){
  if(key==="beginner:original")return relationCategory(t)==="official-original";
  if(key==="beginner:arrangement")return ["arrangement","rearrangement","remix","cover","remaster"].includes(relationCategory(t));
  if(key==="beginner:vocal")return isVocalTrack(t)&&relationCategory(t)!=="official-original";
  if(key==="beginner:mv")return beginnerVideoInfo(t).video;
  if(key.startsWith("beginner-circle:"))return beginnerCircleMatch(t,beginnerCircleGroup(key));
  return true;
}
function beginnerFilterLabel(key){
  if(key==="beginner:original")return"유명 원곡";
  if(key==="beginner:arrangement")return"유명 어레인지";
  if(key==="beginner:vocal")return"보컬 입문";
  if(key==="beginner:mv")return"뮤비 · PV 우선";
  const group=beginnerCircleGroup(key);return group?.label||key;
}
function beginnerReason(t){
  const video=beginnerVideoInfo(t);
  if(video.explicit)return"뮤비 · PV 추천";
  const group=BEGINNER_CIRCLE_GROUPS.find(g=>beginnerCircleMatch(t,g));
  if(group)return group.label+" 입문";
  if(beginnerTitleHit(t)&&relationCategory(t)==="official-original")return"대표 원곡";
  if(beginnerTitleHit(t))return"유명 동방곡";
  if(isVocalTrack(t))return"보컬 입문";
  return"인기 입문곡";
}
function currentPool(){
  if(state.mode==="fan-original"){
    return dedupe(state.localFanOriginals.map(x=>byId(x.id)||x)).filter(isCuratedStyle);
  }
  let pool;
  if(state.full.loaded)pool=dedupe([...state.fullItems,...state.localFanOriginals.map(x=>byId(x.id)||x)]);
  else{
    const local=[...state.localOriginals,...state.localArrangements,...state.localFanOriginals].map(x=>byId(x.id)||x);
    pool=dedupe([...local,...state.remoteItems]);
  }
  if(state.mode==="original")pool=pool.filter(t=>t.type==="original");
  if(state.mode==="arrangement")pool=pool.filter(t=>t.type==="arrangement");
  if(state.mode==="db-fan-original")pool=pool.filter(t=>isFanOriginal(t)&&!isCuratedStyle(t));
  return pool;
}
function balancedHomeMix(list,limit=18){
  const rows=dedupe(list),byIdMap=new Map(rows.map(x=>[resolveId(x.id),x]));
  const validSaved=(state.homeMixIds||[]).map(id=>byIdMap.get(resolveId(id))).filter(Boolean);
  if(validSaved.length>=Math.min(10,limit))return validSaved.slice(0,limit);
  const used=new Set(),out=[];
  const take=(pool,n)=>{
    if(n<=0)return;
    const candidates=shuffle(pool.slice(0,Math.max(n*8,24)));
    for(const t of candidates){
      const id=resolveId(t.id);if(used.has(id))continue;
      used.add(id);out.push(t);if(--n<=0)break;
    }
  };
  const official=rows.filter(t=>relationCategory(t)==="official-original");
  const derivatives=rows.filter(t=>["arrangement","rearrangement","remix","cover","remaster","instrumental","mashup","short-version"].includes(relationCategory(t)));
  const dbFan=rows.filter(t=>relationCategory(t)==="fan-original"&&!isCuratedStyle(t));
  const curated=rows.filter(isCuratedStyle);
  const hidden=rows.filter(t=>player.playable(t)&&popularityScore(t)>0&&(!t.globalRank||Number(t.globalRank)>5000));
  take(official,3);take(derivatives,7);take(dbFan,3);take(curated,3);take(hidden,2);
  take(rows,Math.max(0,limit-out.length));
  state.homeMixIds=out.map(x=>resolveId(x.id));
  return out.slice(0,limit);
}
function renderCatalog(title){
  refreshRanks();
  renderFilters();
  let list=currentPool();
  const beginnerCircleFilter=state.mode==="beginner"&&state.filter.startsWith("beginner-circle:");
  if(state.mode==="beginner"&&!state.beginnerIndex.loaded&&!state.beginnerIndex.loading)queueMicrotask(ensureBeginnerIndex);
  if(beginnerCircleFilter){
    const group=beginnerCircleGroup(state.filter),extra=group?state.beginnerCircleCache.get(group.key)||[]:[];
    list=dedupe([...list,...state.beginnerIndex.tracks,...extra]).filter(t=>beginnerFilterMatch(t,state.filter));
  }else if(state.mode==="beginner"){
    list=dedupe([...list,...state.beginnerIndex.tracks]).filter(beginnerEligible);
  }
  if(state.filter==="인앱 재생"||state.filter==="영상 있음")list=list.filter(t=>player.playable(t));
  else if(state.filter.startsWith("beginner:"))list=list.filter(t=>beginnerFilterMatch(t,state.filter));
  else if(state.filter.startsWith("category:")){
    const key=state.filter.slice(9);list=list.filter(t=>relationCategory(t)===key);
  }else if(state.filter!=="전체")list=list.filter(t=>(state.mode==="fan-original"||state.mode==="db-fan-original")?(t.artistString===state.filter||t.circle===state.filter):t.circle===state.filter);
  const work=selectedWork();
  if(work)list=list.filter(t=>trackMatchesWork(t,work));
  const q=$("#searchInput").value.trim().toLowerCase();
  if(q)list=list.filter(t=>searchBlob(t).includes(q));
  list=sortList(list,state.sort);
  const homeStation=state.view==="home"&&state.mode==="all"&&state.filter==="전체"&&state.sort==="recommend"&&!q&&!work;
  const homeVisible=homeStation?balancedHomeMix(list,18):null;
  const pagedRender=state.full.loaded||state.full.streaming;
  const key=JSON.stringify({q,mode:state.mode,filter:state.filter,work:state.workFilter,sort:state.sort,full:state.full.loaded,streaming:state.full.streaming});
  if(key!==state.renderKey){state.renderKey=key;state.displayLimit=pagedRender?60:Math.max(60,list.length)}
  state.lastMatchCount=list.length;
  const visible=homeVisible||(pagedRender?list.slice(0,state.displayLimit):list);
  renderGrid(visible);
  $("#sectionTitle").textContent=title||(homeStation?"오늘의 스테이션 믹스":catalogTitle(q,list.length));
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
  const base=currentPool(),tools=$("#catalogTools"),quick=$("#quickFilters");
  tools?.classList.toggle("is-beginner",state.mode==="beginner");
  const recommendOption=$("#sortSelect option[value='recommend']");
  if(recommendOption)recommendOption.textContent=state.mode==="beginner"?"입문추천순":"종합순위";
  if(state.mode==="beginner"){
    const primary=[
      {key:"전체",label:"★ 입문 전체"},{key:"beginner:original",label:"유명 원곡"},
      {key:"beginner:arrangement",label:"유명 어레인지"},{key:"beginner:vocal",label:"보컬 입문"},
      {key:"beginner:mv",label:"뮤비 · PV"},{key:"인앱 재생",label:"바로 재생"}
    ];
    const valid=new Set(["전체","인앱 재생",...primary.map(x=>x.key),...BEGINNER_CIRCLE_GROUPS.map(x=>"beginner-circle:"+x.key)]);
    if(!valid.has(state.filter))state.filter="전체";
    const buttons=rows=>rows.map(x=>'<button class="filter-chip '+(x.key===state.filter?"is-active":"")+'" data-filter="'+escAttr(x.key)+'" title="'+escAttr(x.label)+'">'+esc(x.label)+'</button>').join("");
    const circleGroups=BEGINNER_CIRCLE_GROUPS.filter(x=>x.kind!=="creator").map(x=>({key:"beginner-circle:"+x.key,label:x.label}));
    const creatorGroups=BEGINNER_CIRCLE_GROUPS.filter(x=>x.kind==="creator").map(x=>({key:"beginner-circle:"+x.key,label:x.label}));
    quick.innerHTML=
      '<div class="beginner-filter-group"><span class="beginner-filter-label">추천 유형</span><div class="beginner-chip-grid beginner-type-grid">'+buttons(primary)+'</div></div>'+
      '<div class="beginner-filter-group"><span class="beginner-filter-label">서클 · 동인 · 밴드</span><div class="beginner-chip-grid beginner-circle-grid">'+buttons(circleGroups)+'</div></div>'+
      '<div class="beginner-filter-group"><span class="beginner-filter-label">프로듀서 · 아티스트</span><div class="beginner-chip-grid beginner-creator-grid">'+buttons(creatorGroups)+'</div></div>';
  }else{
    const out=[{key:"전체",label:"전체"},{key:"인앱 재생",label:"인앱 재생"}];
    if(state.mode==="all"||state.mode==="arrangement"){
      const order=["official-original","fan-original","touhou-style","fan-game-ost","arrangement","rearrangement","remix","cover","remaster","instrumental","mashup","short-version","other-related"];
      const present=new Set(base.map(relationCategory));
      order.filter(x=>present.has(x)).forEach(x=>out.push({key:"category:"+x,label:relationLabel(x)}));
    }
    if(state.mode==="arrangement")uniq(base.map(x=>x.circle).filter(Boolean)).slice(0,8).forEach(x=>out.push({key:x,label:x}));
    if(state.mode==="fan-original"||state.mode==="db-fan-original")uniq(base.map(x=>x.artistString||x.circle).filter(Boolean)).slice(0,10).forEach(x=>out.push({key:x,label:x}));
    if(!out.some(x=>x.key===state.filter))state.filter="전체";
    quick.innerHTML=out.map(x=>'<button class="filter-chip '+(x.key===state.filter?"is-active":"")+'" data-filter="'+escAttr(x.key)+'">'+esc(x.label)+'</button>').join("");
  }
  $$("#quickFilters .filter-chip").forEach(b=>b.onclick=()=>{
    state.filter=b.dataset.filter;state.renderKey="";
    if(state.filter.startsWith("beginner-circle:"))ensureBeginnerCircleResults(state.filter);
    requestAnimationFrame(()=>renderCatalog());
    if(!state.filter.startsWith("beginner-circle:"))loadRemote(true);
  });
}
function updateStats(){
  const meta=state.full.manifest;
  const loaded=[...state.known.values()];
  const localOrig=state.localOriginals.length,localArr=state.localArrangements.length,localFan=state.localFanOriginals.length;
  const originalCount=meta?.counts?.original||state.remote.counts.original||loaded.filter(x=>x.type==="original").length||localOrig;
  const arrangementCount=meta?.counts?.arrangement||state.remote.counts.arrangement||loaded.filter(x=>x.type==="arrangement").length||localArr;
  const fanOriginalCount=Math.max(Number(meta?.counts?.fanOriginal)||0,loaded.filter(t=>isFanOriginal(t)&&!isCuratedStyle(t)).length);
  const mediaCount=meta?.counts?.mediaCandidates??null;
  const fanItems=state.fanYoutubeMeta?.items&&typeof state.fanYoutubeMeta.items==="object"?state.fanYoutubeMeta.items:{};
  const curatedMeasured=Object.entries(fanItems).filter(([id,x])=>!id.startsWith("tdb-")&&x?.videoId&&!x?.videoUnavailable&&Number.isFinite(Number(x?.viewCount))).length;
  const fanMedia=Number(meta?.counts?.categoryMediaCandidates?.["fan-original"])||0;
  const fanYoutube=Number(meta?.counts?.categoryYoutubeCandidates?.["fan-original"])||0;
  const fanViews=Number(meta?.counts?.categoryViewTracks?.["fan-original"])||0;
  $("#statOriginal").textContent=fmt(originalCount);
  $("#statArrangement").textContent=fmt(arrangementCount);
  $("#statFanOriginal").textContent=fmt(fanOriginalCount);
  $("#statCuratedStyle").textContent=fmt(localFan);
  $("#statMedia").textContent=mediaCount===null?"집계 중":fmt(mediaCount);
  $("#statOriginalMeta").textContent=meta?"공식 작품/ZUN 기준":"TouhouDB 공식 원곡 분류";
  $("#statArrangementMeta").textContent=meta?"어레인지·리믹스·커버 등 전체 파생":"TouhouDB 파생곡 분류";
  $("#statFanOriginalMeta").textContent=meta&&fanMedia
    ?"TouhouDB 팬 원곡 · 영상 후보 "+fmt(fanMedia)+" · YouTube "+fmt(fanYoutube)+" · 조회수 "+fmt(fanViews)
    :"TouhouDB 비공식 Original · 동방풍 큐레이션과 별도";
  $("#statCuratedStyleMeta").textContent=fmt(curatedMeasured)+" / "+fmt(localFan)+"곡 영상·반응 실측";
  $("#statMediaMeta").textContent=meta?"전체 "+fmt(meta.indexed)+"곡에서 PV 후보 확인":"전수 인덱스 생성 후 확정";
  const stationCount=$("#stationCatalogCount");if(stationCount)stationCount.textContent=meta?fmt(meta.indexed):fmt(state.known.size);
  updateCatalogTotal();
}
function updateCatalogTotal(){
  const n=Number(state.full.manifest?.totalCount)||Number(state.full.manifest?.indexed)||Number(state.remote.catalogTotal)||Number(state.remote.total)||state.known.size;
  $("#statLinks").textContent=fmt(n);
  $("#statLinksMeta").textContent=state.full.manifest?"TouhouDB FULL INDEX 전체 등록곡":state.remote.catalogTotal?"TouhouDB 전체 등록곡":"현재 로드";
  $("#heroCatalogCount").textContent=state.full.loading?fmt(state.full.loadedCount)+" / "+fmt(n):fmt(n)+" tracks";
}
function syncCatalogFooter(){
  const btn=$("#loadMoreBtn"),meta=$("#catalogMeta");
  const special=state.view==="library"||state.view==="history";
  $("#catalogFooter").hidden=special;
  if(special)return;
  if(state.mode==="fan-original"){
    btn.disabled=true;btn.textContent="동방풍 목록 모두 표시";
    meta.innerHTML='<span class="remote-pulse">TOUHOU-STYLE</span> · 큐레이션 '+fmt(state.lastMatchCount)+'곡 · 공식 원곡/어레인지 순위와 별도 집계';
    return;
  }
  if(state.mode==="beginner"){
    const shown=Math.min(state.displayLimit,state.lastMatchCount),bi=state.beginnerIndex;
    btn.disabled=shown>=state.lastMatchCount;btn.textContent=btn.disabled?"현재 입문 후보 모두 표시":"60곡 더 표시";
    meta.innerHTML='<span class="remote-pulse">BEGINNER INDEX</span> · '+(bi.loading?"18.9만곡 전체에서 후보 검색 중 · ":"")+'입문 후보 '+fmt(state.lastMatchCount)+'곡 · 영상 '+fmt(bi.video||0)+'곡 · 명시 MV/PV '+fmt(bi.explicitMv||0)+'곡 · 화면 '+fmt(shown)+'곡';
    return;
  }
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
  if(state.full.streaming){
    const shown=Math.min(state.displayLimit,state.lastMatchCount);
    const hiddenInCache=shown<state.lastMatchCount;
    const remoteDone=state.remote.total>0&&state.remote.start>=state.remote.total;
    btn.disabled=!hiddenInCache&&(state.remote.loading||remoteDone);
    btn.textContent=hiddenInCache
      ?"현재 캐시 60곡 더 표시"
      :state.remote.loading?"다음 50곡 불러오는 중…":(btn.disabled?"현재 조건 모두 불러옴":"다음 50곡 불러오기");
    meta.innerHTML='<span class="remote-pulse">STREAMING INDEX</span> · 전체 '+fmt(state.full.manifest?.totalCount||state.full.manifest?.indexed||state.remote.catalogTotal||0)+'곡 접근 가능 · 현재 캐시 '+fmt(state.remoteItems.length)+'곡 · 화면 '+fmt(shown)+'곡';
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
  if(state.filter.startsWith("category:"))return relationLabel(state.filter.slice(9));
  if(state.filter.startsWith("beginner:")||state.filter.startsWith("beginner-circle:")){
    const group=beginnerCircleGroup(state.filter),loading=group&&state.beginnerCircleLoading.has(group.key);
    return beginnerFilterLabel(state.filter)+(loading?" · 전체 인덱스 검색 중…":"");
  }
  if(state.filter!=="전체")return state.filter;
  if(state.mode==="beginner")return "처음 듣기 좋은 동방 입문곡";
  if(state.mode==="original")return "동방 공식 원곡 전체 탐색";
  if(state.mode==="arrangement")return "동방 2차창작 전체 탐색";
  if(state.mode==="db-fan-original")return "TouhouDB 팬 원곡 전체 탐색";
  if(state.mode==="fan-original")return "동방풍 오리지널 전체 탐색";
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
function typeLabel(t){return RELATION_BADGES[relationCategory(t)]||"TOUHOU RELATED"}
function typeClass(t){return relationCategory(t)}
function card(t){
  const playable=player.playable(t),external=trustedExternalMedia(t),canLookup=!playable&&state.remote.available,origins=originalNames(t);
  const beginner=state.mode==="beginner";
  const rank=trackRank(t);
  const by=t.type==="arrangement"
    ? [t.circle,(t.artists?.vocal||[]).join(", ")].filter(Boolean).join(" · ")
    : [t.work||t.artistString,t.role,t.character].filter(Boolean).join(" · ");
  const thumb=t.thumb?' style="background-image:url(&quot;'+escAttr(t.thumb)+'&quot;)"':"";
  const originLine=t.type==="arrangement"
    ? "원곡 · "+(origins.join(" / ")||(t.originalIds?.length?"계보 연결 가능":"원곡 정보 확인 가능"))
    : isCuratedStyle(t)
      ? (t.year||"연도 미상")+" · 동방풍 오리지널 · 직접 원곡 없음"
      : (t.year||"연도 미상")+" · "+countChildren(t.id)+"개 연결";
  const originButton=t.type==="arrangement"
    ? '<button class="origin-jump" data-origin="'+escAttr(t.id)+'"><span>↖</span><strong>원곡</strong></button>'
    : "";
  return '<article class="track-card">'+
    '<button class="track-main" data-open="'+escAttr(t.id)+'">'+
      '<div class="track-thumb '+(t.thumb?"":"no-image")+'"'+thumb+'>'+
        '<div class="track-badges"><span class="type-badge '+escAttr(typeClass(t))+'">'+esc(typeLabel(t))+'</span><span class="rank-badge">'+esc(rankText(rank))+'</span><span class="percent-badge">'+esc(rankPercentText(rank))+'</span>'+(playable?'<span class="media-badge">▶ VIDEO</span>':'')+'</div>'+
      '</div>'+
      '<div class="track-copy"><h3>'+esc(t.title)+'</h3><div class="byline">'+esc(by||"정보 준비 중")+'</div>'+(beginner?'<div class="beginner-note">★ '+esc(beginnerReason(t))+'</div>':'')+'<div class="origin-line">'+esc(originLine)+'</div>'+
        '<div class="tag-row">'+(t.moods||[]).slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div>'+
      '</div>'+
    '</button>'+
    '<div class="card-actions '+(originButton?"has-origin":"")+'">'+
      (playable?'<button class="play-btn" data-play="'+escAttr(t.id)+'">▶ 재생</button>':canLookup?'<button class="play-btn" data-play="'+escAttr(t.id)+'">⌕ YouTube/영상 찾기</button>':external?'<button class="play-btn external-play" data-external="'+escAttr(t.id)+'">↗ 외부 재생</button>':'<button class="play-btn" disabled>영상 없음</button>')+
      originButton+'<button class="dive-btn" data-dive="'+escAttr(t.id)+'">⌁ 다이브</button></div>'+
  '</article>';
}
function openTrack(t,opts={}){
  if(!t)return;
  t=byId(t.id)||t;
  state.selected=t;pushHistory(t.id,t);
  refreshRanks();
  const canonicalId=resolveId(t.id);
  const fav=state.favorites.has(canonicalId),origins=originalTracks(t),children=childTracksFor(canonicalId,24);
  const artistLine=t.type==="arrangement"
    ? [t.circle&&"Circle "+t.circle,(t.artists?.arranger||[]).length&&"Arrange "+t.artists.arranger.join(", "),(t.artists?.vocal||[]).length&&"Vocal "+t.artists.vocal.join(", ")].filter(Boolean).join("<br>")
    : [t.work||t.artistString,t.role,t.character&&"Character "+t.character].filter(Boolean).join("<br>");
  const external=trustedExternalMedia(t);
  const source=t.media?.url||external?.url||t.source?.url||"";
  const rank=trackRank(t),popRank=popularityRankInfo(t),infRank=influenceRankInfo(t),links=trustedLinks(t);
  const fan=isCuratedStyle(t),rankLabel=fan?"동방풍 순위":"종합";
  const canLookup=!player.playable(t)&&state.remote.available;
  const missing=(t.originalIds||[]).filter(id=>!byId(id));
  $("#detailContent").innerHTML=`
    <div class="detail-hero"><div class="detail-kicker">${typeLabel(t)} · ${fan?"CURATED STYLE INDEX":t.touhoudbId?(t.remote?"TOUHOUDB LIVE":"LOCAL + TOUHOUDB"):"LOCAL VERIFIED"}</div><div class="detail-rank"><strong>${rankLabel} · ${rankText(rank)}</strong><span>${rankPercentText(rank)} · ${fan?"동방풍 카테고리 내부":rank.fullScale?"전수 "+fmt(rank.total)+"곡 기준":rank.sampleRank?"현재 로드 표본 "+fmt(rank.sampleTotal)+"곡 중 "+fmt(rank.sampleRank)+"위":"전수 순위 준비 중"} · ${rank.score.toFixed(1)}pt</span></div>
    <div class="rank-breakdown">
      <div><label>${fan?"동방풍 인기":"인기"}</label><strong>${popRank.rank?fmt(popRank.total)+"곡 중 "+fmt(popRank.rank)+"위":"집계 중"}</strong><small>${popRank.percent!==null?"상위 "+(popRank.percent<0.01?"<0.01":popRank.percent.toFixed(2))+"%":""}</small></div>
      ${infRank?'<div><label>원곡 영향력</label><strong>'+fmt(infRank.total)+'원곡 중 '+(infRank.rank?fmt(infRank.rank)+'위':"집계 중")+'</strong><small>파생 '+fmt(infRank.children)+'곡 · '+fmt(infRank.circles)+'서클 · '+fmt(infRank.albums)+'앨범</small></div>':""}
    </div><h2>${esc(t.title)}</h2><div class="detail-meta">${artistLine}<br>${t.year||""}${t.album?" · "+esc(t.album):""}</div></div>
    <div class="tag-row">${(t.moods||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>
    <div class="detail-actions"><button class="hot" id="detailPlay" ${player.playable(t)||external||canLookup?"":"disabled"}>${player.playable(t)?(player.getYoutubeMode?.()==="youtube"&&player.candidates?.(t).some(x=>x.provider==="youtube")?"▶ YouTube 앱 재생":"▶ 앱에서 재생"):canLookup?"⌕ YouTube/영상 찾기":external?"↗ 외부 재생":"영상 없음"}</button><button id="detailDive">⌁ 다이브</button>${t.type==="arrangement"?'<button class="origin-jump" id="detailOrigin"><span>↖</span><strong>원곡으로</strong></button>':""}<button id="favBtn">${fav?"♥ 보관됨":"♡ 보관하기"}</button>${source?`<a href="${escAttr(source)}" target="_blank" rel="noopener">원본 링크 ↗</a>`:'<button disabled>원본 링크 없음</button>'}</div>
    ${fan?'<div class="fact-box"><label>분류</label><div class="detail-meta">공식 동방 원곡을 직접 사용하지 않는 동방풍 오리지널입니다. 통합 검색에는 포함하고, 계보·분류·순위 축은 별도로 유지합니다.</div></div>':t.type==="arrangement"?lineageBox("이 어레인지의 원곡",origins,missing):lineageBox("이 원곡을 사용한 현재 로드 어레인지",children,[])}
    <div class="fact-box"><label>순위 기준</label><div class="detail-meta">${fan?"동방풍 순위는 동방풍 큐레이션 내부에서 비교합니다. 곡 자체는 동방 관련 전체 검색에 포함되며 공식 원곡·파생곡 랭킹 축과는 분리합니다.":"종합 = 인기 + 원곡 영향력. 종합·인기 순위의 분모는 FULL INDEX 전체 등록곡 "+fmt(fullRankTotal())+"곡을 그대로 사용하며, 현재 로드된 표본 순위를 전수 순위처럼 환산하지 않습니다. 플랫폼 조회수 순위는 실제 조회수 확인에 성공한 곡만 별도로 집계합니다."}</div></div>
    ${links.length?'<div class="fact-box trusted-links"><label>플랫폼 바로가기</label><div class="trusted-link-list">'+links.slice(0,18).map(x=>'<a class="platform-link platform-'+escAttr(x.provider)+'" href="'+escAttr(x.url)+'" target="_blank" rel="noopener noreferrer"><span>'+esc(platformLabel(x.provider))+'</span><b>↗</b></a>').join("")+'</div></div>':""}
    <div class="fact-box"><label>다이브 기준</label><div class="detail-meta">${esc(relationText(t))}</div></div>
    ${!fan&&!opts.skipEnrich&&!t.touhoudbId&&state.remote.available?'<div class="detail-sync">TouhouDB에서 영상·통계를 보강하는 중…</div>':""}`;
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
  if(!fan&&!opts.skipEnrich&&!t.touhoudbId&&state.remote.available){
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
    const merged=mergeRemoteIntoTrack(t,candidate);
    refreshRanks();
    return merged||byId(id)||byId(candidate.id)||t;
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
function hasMediaCandidate(t){return !!(t&&player.playable(t))}
function trustedExternalMedia(t){
  return (t?.mediaCandidates||[]).find(m=>m?.mode==="external"&&/^https?:\/\//.test(String(m.url||"")))||null;
}
function openTrustedExternal(t){
  const media=trustedExternalMedia(t);if(!media?.url)return false;
  try{window.open(media.url,"_blank","noopener,noreferrer");return true}catch(_){return false}
}
async function hydratePlayingTrack(base){
  let t=byId(base.id)||base;
  try{
    if(state.remote.available&&catalog){
      let candidate=null;
      if(!t.touhoudbId&&catalog.lookupByMedia)candidate=await catalog.lookupByMedia(t);
      if(!candidate&&!t.touhoudbId)candidate=await catalog.lookupByTitle(t.lyricsSearchTitle||t.title,{mode:t.type});
      if(candidate)t=mergeRemoteIntoTrack(t,candidate);
      const remoteId=t.touhoudbId?("tdb-"+t.touhoudbId):(candidate?.id||"");
      if(remoteId&&!t.lyricsLoaded){
        const hydrated=await catalog.hydrate(remoteId);
        if(hydrated)t=mergeRemoteIntoTrack(t,hydrated);
      }
    }
    if(fullIndex?.enrichTrack&&t?.touhoudbId)t=remember(await fullIndex.enrichTrack(t));
    else t=remember(t);
    player.updateCurrentData?.({...t,_playerRanks:playerRankMeta(t)});
  }catch(_){}
}
async function buildPlayingQueue(t){
  await nextPaint();
  if(!player.current||resolveId(player.current.id)!==resolveId(t.id))return;
  const relatedQueue=relations(t)
    .filter(r=>player.playable(r.track))
    .slice(0,24)
    .map(r=>({...r.track,_queueReason:r.reason}));
  const fallbackSource=state.full.loaded
    ? dedupe([...state.remoteItems,...state.localArrangements,...state.localOriginals,...state.fullItems.slice(0,900)])
    : currentPool();
  const fallback=fallbackSource
    .filter(x=>resolveId(x.id)!==resolveId(t.id)&&player.playable(x))
    .slice(0,32);
  const queue=dedupe([{...t,_queueReason:"현재 재생"},...relatedQueue,...fallback]).slice(0,36);
  player.setQueue?.(queue,resolveId(t.id));
}
async function playTrack(t){
  if(!t)return false;
  t=byId(t.id)||t;
  if(!player.playable(t)){
    toast("재생 가능한 영상을 찾는 중…");
    try{t=await enrichTrack(t)}catch(_){}
  }
  if(!player.playable(t)){
    if(trustedExternalMedia(t)){openTrustedExternal(t);toast("인앱 영상이 없어 확인된 외부 소스를 열었습니다.");return true}
    toast("재생 가능한 공개 영상이 없습니다.");return false
  }
  const current={...t,_playerRanks:playerRankMeta(t)};
  const externalYoutube=player.getYoutubeMode?.()==="youtube"&&player.candidates?.(t).some(x=>x.provider==="youtube");
  const ok=player.play(current,[current]);
  if(!ok)return false;
  player.setFavoriteState?.(state.favorites.has(resolveId(t.id)));
  pushHistory(t.id,t);
  if(externalYoutube){
    toast("YouTube 앱/브라우저로 열었습니다 · 로그인된 Premium 계정이 적용됩니다.");
    return true;
  }
  hydratePlayingTrack(t);
  buildPlayingQueue(t);
  return true;
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
    requestAnimationFrame(()=>renderLineageOverview());
  }else if(view==="iceberg"){
    $("#icebergStats").innerHTML='<div class="iceberg-loading">분포 계산 중…</div>';
    requestAnimationFrame(()=>renderIceberg());
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
  const source=state.full.loaded?state.fullItems.filter(t=>t.type==="original"):currentPool().filter(t=>t.type==="original");
  const list=source.sort((a,b)=>countChildren(b.id)-countChildren(a.id)||(a.year||9999)-(b.year||9999));
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
  let pool;
  if(state.full.loaded&&state.fullItems.length>12000){
    const src=state.fullItems,step=src.length/12000,sample=[];
    for(let i=0;i<12000;i++)sample.push(src[Math.min(src.length-1,Math.floor(i*step))]);
    pool=dedupe([...sample,...state.remoteItems,...state.localOriginals,...state.localArrangements]);
  }else pool=state.full.loaded?state.fullItems:dedupe([...state.known.values()]);
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
  const pool=relationCandidatePool(t);
  const tOrig=new Set(t.type==="original"?[resolveId(t.id)]:originalIds(t));
  const scored=[];
  for(const x of pool){
    let score=0,reasons=[];
    const xOrig=new Set(x.type==="original"?[resolveId(x.id)]:originalIds(x));
    let shared=0;
    for(const id of tOrig)if(xOrig.has(id))shared++;
    if(shared){score+=12*shared;reasons.push("같은 원곡 계보")}
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
    if(score>0)scored.push({track:x,score,reason:reasons[0]||"시대·태그 브리지"});
  }
  return scored.sort((a,b)=>b.score-a.score).slice(0,80);
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
  return [t.title,...(t.aliases||[]),t.work,t.role,t.character,t.circle,t.album,t.artistString,artists,originals,t.styleClass,...(t.moods||[])].filter(Boolean).join(" ").toLowerCase();
}
function isFanOriginal(t){return !!t&&(t.type==="fan-original"||t.category==="fan-original")}
function isCuratedStyle(t){return !!t&&!String(t.id||"").startsWith("tdb-")&&(!!t.touhouStyle||!!t.styleClass||!!t.classification?.sourceKind)}
const RELATION_LABELS={
  "official-original":"공식 원곡","fan-original":"팬 오리지널","touhou-style":"동방풍 오리지널","fan-game-ost":"팬게임 OST",
  "arrangement":"어레인지","rearrangement":"재어레인지","remix":"리믹스","cover":"커버",
  "remaster":"리마스터","instrumental":"인스트·오프보컬","mashup":"매시업",
  "short-version":"숏버전·게임컷","other-related":"기타 동방 연관"
};
const RELATION_BADGES={
  "official-original":"OFFICIAL ORIGINAL","fan-original":"FAN ORIGINAL","touhou-style":"TOUHOU-STYLE","fan-game-ost":"FANGAME OST",
  "arrangement":"ARRANGE","rearrangement":"RE-ARRANGE","remix":"REMIX","cover":"COVER",
  "remaster":"REMASTER","instrumental":"INSTRUMENTAL","mashup":"MASHUP",
  "short-version":"SHORT VERSION","other-related":"TOUHOU RELATED"
};
function relationCategory(t){
  if(!t)return"other-related";
  if(isFanOriginal(t)&&t.classification?.sourceKind==="fangame-ost")return"fan-game-ost";
  if(isFanOriginal(t)&&(t.touhouStyle||t.styleClass))return"touhou-style";
  if(isFanOriginal(t))return"fan-original";
  if(t.category)return t.category;
  return t.type==="original"?"official-original":t.type==="arrangement"?"arrangement":"other-related";
}
function relationLabel(key){return RELATION_LABELS[key]||key||"기타 동방 연관"}
function fanOriginalPool(){
  return dedupe(state.localFanOriginals.map(x=>byId(x.id)||x)).filter(isFanOriginal);
}
function fanEngagementStats(t){
  const seen=new Set();let likes=0,comments=0,mediaCount=0;
  for(const m of t?.mediaCandidates||[]){
    const key=(m?.provider||"")+":"+(m?.id||m?.url||"");
    if(!m?.provider||!key||seen.has(key))continue;
    seen.add(key);
    const l=Number(m?.likeCount),c=Number(m?.commentCount);
    if(Number.isFinite(l)&&l>=0)likes+=l;
    if(Number.isFinite(c)&&c>=0)comments+=c;
    if((Number.isFinite(l)&&l>=0)||(Number.isFinite(c)&&c>=0))mediaCount++;
  }
  return{likes,comments,mediaCount};
}
function fanPopularityEvidence(t){
  const views=mediaViewStats(t);
  const db=(Number(t?.ratingScore)||0)+(Number(t?.favoritedTimes)||0)+(Number(t?.hitCount)||0);
  return views.mediaCount>0||db>0;
}
function fanPopularityScore(t){
  const views=mediaViewStats(t),eng=fanEngagementStats(t),community=communitySignal(t),spread=sourceSpreadSignal(t);
  const engagementPts=Math.log10(eng.likes+1)*2+Math.log10(eng.comments+1)*0.8;
  if(views.mediaCount)return viewSignal(t)+spread*.8+engagementPts+community*.25;
  if((community>0||spread>0)&&fanPopularityEvidence(t))return community*.35+spread*.9;
  return 0;
}
function fanOriginalRankInfo(t){
  const pool=fanOriginalPool(),ranked=pool.filter(fanPopularityEvidence).sort((a,b)=>fanPopularityScore(b)-fanPopularityScore(a)||mediaViewStats(b).total-mediaViewStats(a).total||String(a.title||"").localeCompare(String(b.title||""),"ja"));
  const i=ranked.findIndex(x=>resolveId(x.id)===resolveId(t?.id));
  const catalogTotal=Math.max(pool.length,1),total=ranked.length,rank=i>=0?i+1:null;
  return{rank,total,percent:rank&&total?rank/total*100:null,score:fanPopularityScore(t),catalogTotal,coverage:catalogTotal?total/catalogTotal:0,fullScale:false,stale:false,pending:!rank};
}
function mediaViewStats(t){
  const seen=new Set(),byProvider=new Map();
  let total=0,max=0,mediaCount=0;
  for(const m of t?.mediaCandidates||[]){
    const key=(m?.provider||"")+":"+(m?.id||m?.url||"");
    if(!m?.provider||!key||seen.has(key))continue;
    seen.add(key);
    const raw=m?.viewCount;
    if(raw===null||raw===undefined||raw==="")continue;
    const views=Number(raw);
    if(!Number.isFinite(views)||views<0)continue;
    mediaCount++;total+=views;max=Math.max(max,views);
    byProvider.set(m.provider,(byProvider.get(m.provider)||0)+views);
  }
  if(!mediaCount&&Number(t?.viewMediaCount)>0){
    total=Math.max(0,Number(t.viewTotal)||0);
    max=Math.max(0,Number(t.viewMax)||0);
    mediaCount=Number(t.viewMediaCount)||0;
  }
  const providers=[...byProvider.entries()].map(([provider,views])=>({provider,views})).sort((a,b)=>b.views-a.views);
  return{total,max,platforms:byProvider.size||Number(t?.viewPlatformCount)||0,mediaCount,providers};
}
function platformLabel(p){
  return({youtube:"YouTube",niconico:"NicoNico",bilibili:"Bilibili",soundcloud:"SoundCloud",bandcamp:"Bandcamp",piapro:"Piapro",touhoudb:"TouhouDB",source:"원본/공식"})[p]||p;
}
const SOURCE_WEIGHTS={youtube:1,niconico:1.25,bilibili:1,soundcloud:.75,bandcamp:1,piapro:.9};
function sourceProviders(t){
  return new Set((t?.mediaCandidates||[]).map(m=>m?.provider).filter(p=>SOURCE_WEIGHTS[p]!=null));
}
function sourceSpreadSignal(t){
  let score=0;for(const p of sourceProviders(t))score+=SOURCE_WEIGHTS[p]||.5;return score;
}
function viewSignal(t){
  const v=mediaViewStats(t);
  if(!v.mediaCount)return 0;
  let perPlatform=0;
  for(const x of v.providers)perPlatform+=Math.log10(Math.max(0,x.views)+1)*1.25;
  return Math.log10(v.total+1)*6+Math.log10(v.max+1)*1.5+perPlatform+Math.min(6,v.platforms);
}
function rankingV5Ready(){return Number(state.full.manifest?.ranking?.version)>=6}
function platformViewsEligible(){return !!state.full.manifest?.viewCoverage?.popularityEligible}
function communitySignal(t){
  const rating=Math.max(0,Number(t?.ratingScore)||0);
  const favorites=Math.max(0,Number(t?.favoritedTimes)||0);
  const hits=Math.max(0,Number(t?.hitCount)||0);
  return Math.log10(rating+1)*8+Math.log10(favorites+1)*8+Math.log10(hits+1)*2;
}
function popularityScore(t){
  if(isCuratedStyle(t))return fanPopularityScore(t);
  const community=communitySignal(t),views=mediaViewStats(t),spread=sourceSpreadSignal(t);
  if(platformViewsEligible()&&views.mediaCount)return viewSignal(t)+spread*.8+community*.30;
  return community*.45+spread*.9;
}
function influenceScore(t){
  if(t?.type!=="original")return 0;
  const children=Math.max(0,Number(t.derivativeCount)||countChildren(t.id));
  const circles=Math.max(0,Number(t.derivativeCircleCount)||0);
  const albums=Math.max(0,Number(t.derivativeAlbumCount)||0);
  const mediaChildren=Math.max(0,Number(t.derivativeMediaCount)||0);
  return Math.log10(children+1)*14+Math.log10(circles+1)*9+Math.log10(albums+1)*6+Math.log10(mediaChildren+1)*3;
}
function overallRankScore(t){return popularityScore(t)+influenceScore(t)*0.25}
function popularityBreakdown(t){
  const rating=Math.max(0,Number(t?.ratingScore)||0);
  const favorites=Math.max(0,Number(t?.favoritedTimes)||0);
  const hits=Math.max(0,Number(t?.hitCount)||0);
  const providers=sourceProviders(t),providerCount=providers.size,spread=sourceSpreadSignal(t);
  const views=mediaViewStats(t),fan=isCuratedStyle(t),eligible=fan?views.mediaCount>0:platformViewsEligible();
  const eng=fanEngagementStats(t);
  const engagementPts=fan?(Math.log10(eng.likes+1)*2+Math.log10(eng.comments+1)*0.8):0;
  const ratingPts=Math.log10(rating+1)*8;
  const favoritePts=Math.log10(favorites+1)*8;
  const hitPts=Math.log10(hits+1)*2;
  const communityRaw=ratingPts+favoritePts+hitPts;
  const communityWeight=fan?(eligible?0.25:0.35):(eligible&&views.mediaCount?0.30:0.45);
  const communityPts=communityRaw*communityWeight;
  const viewPts=eligible&&views.mediaCount?viewSignal(t):0;
  const sourcePts=spread*(eligible&&views.mediaCount?.8:.9);
  const platformRows=views.providers.map(x=>({label:platformLabel(x.provider)+" 조회수",raw:fmt(x.views)+"회",rule:"서로 다른 영상 ID의 확인 조회수를 합산",points:null}));
  return{
    total:viewPts+communityPts+sourcePts+engagementPts,
    baseTotal:communityPts,
    communityRaw,communityWeight,viewPts,sourcePts,sourceSpread:spread,sourceProviders:[...providers],engagementPts,views,eligible,engagement:eng,
    metrics:[
      {label:"TouhouDB 누적 추천점수",raw:fmt(rating)+"점",rule:"log10(n+1) × 8",points:ratingPts*communityWeight},
      {label:"Favorite 수",raw:fmt(favorites)+"회",rule:"log10(n+1) × 8",points:favoritePts*communityWeight},
      {label:"TouhouDB 조회",raw:fmt(hits)+"회",rule:"log10(n+1) × 2",points:hitPts*communityWeight},
      {label:"플랫폼 확산",raw:fmt(providerCount)+"종",rule:"YouTube 1.0 · NicoNico 1.25 · Bilibili 1.0 · SoundCloud 0.75 · Bandcamp 1.0 · Piapro 0.9",points:sourcePts},
      ...platformRows,
      ...(fan?[{label:"YouTube 좋아요",raw:eng.mediaCount?fmt(eng.likes)+"회":"미집계",rule:"log10(n+1) × 2",points:Math.log10(eng.likes+1)*2},{label:"YouTube 댓글",raw:eng.mediaCount?fmt(eng.comments)+"회":"미집계",rule:"log10(n+1) × 0.8",points:Math.log10(eng.comments+1)*0.8}]:[]),
      {label:"플랫폼 조회수",raw:views.mediaCount?fmt(views.total)+"회":"미집계",rule:eligible&&views.mediaCount?"조회수 점수를 인기의 주 신호로 직접 반영":"실측 조회수 미수집 · 임의 조회수 0점 처리 안 함",points:viewPts}
    ]
  };
}
function influenceBreakdown(t){
  if(t?.type!=="original")return{total:0,metrics:[]};
  const children=Math.max(0,Number(t.derivativeCount)||countChildren(t.id));
  const circles=Math.max(0,Number(t.derivativeCircleCount)||0);
  const albums=Math.max(0,Number(t.derivativeAlbumCount)||0);
  const mediaChildren=Math.max(0,Number(t.derivativeMediaCount)||0);
  const childPts=Math.log10(children+1)*14;
  const circlePts=Math.log10(circles+1)*9;
  const albumPts=Math.log10(albums+1)*6;
  const mediaPts=Math.log10(mediaChildren+1)*3;
  return{
    total:childPts+circlePts+albumPts+mediaPts,
    metrics:[
      {label:"파생 어레인지",raw:fmt(children)+"곡",rule:"log10(n+1) × 14",points:childPts},
      {label:"파생 서클",raw:fmt(circles)+"곳",rule:"log10(n+1) × 9",points:circlePts},
      {label:"파생 앨범",raw:fmt(albums)+"장",rule:"log10(n+1) × 6",points:albumPts},
      {label:"영상 연결 파생곡",raw:fmt(mediaChildren)+"곡",rule:"log10(n+1) × 3",points:mediaPts}
    ]
  };
}
function popularityRankDetail(t){
  const rank=popularityRankInfo(t),b=popularityBreakdown(t);
  let source;
  if(isCuratedStyle(t)){
    source={label:"동방풍 실측 인기",text:(rank.rank?fmt(rank.total)+"곡 중 "+fmt(rank.rank)+"위":"실측 데이터 집계 중")+" · 전체 "+fmt(rank.catalogTotal||fanOriginalPool().length)+"곡"};
  }else if(rank.rawRank&&state.full.manifest){
    source={label:"전수 인기순위",text:fmt(rank.total)+"곡 중 "+fmt(rank.rank)+"위 · 랭킹 v6 전수 인덱스"};
  }else{
    source={label:"현재 로드 기준",text:"랭킹 v6 재빌드가 끝나기 전에는 현재 로드 점수만 임시 표시합니다."};
  }
  return{
    title:"인기순위 산정 근거",
    formula:isCuratedStyle(t)?"인기 점수 = 검증 조회수 + YouTube 반응 + DB 보정":"인기 점수 = YouTube·NicoNico·Bilibili 실측 조회수 + 모든 플랫폼 확산 + TouhouDB 보정",
    score:Number(rank.score)||b.total,
    source,
    components:[
      {label:"플랫폼 조회수",points:b.viewPts,description:b.views.mediaCount?fmt(b.views.total)+"회 · "+fmt(b.views.mediaCount)+"개 영상":"조회수 미확인"},
      ...(isCuratedStyle(t)?[{label:"YouTube 반응",points:b.engagementPts,description:fmt(b.engagement.likes)+" 좋아요 · "+fmt(b.engagement.comments)+" 댓글"}]:[]),
      {label:"플랫폼 확산",points:b.sourcePts,description:(b.sourceProviders||[]).map(platformLabel).join(" · ")||"연결 플랫폼 없음"},
      {label:"커뮤니티 보정",points:b.baseTotal,description:"TouhouDB 추천 · Favorite · DB조회 × "+Math.round(b.communityWeight*100)+"%"}
    ],
    metrics:b.metrics,
    note:isCuratedStyle(t)?"동방풍/팬게임 곡은 조회수·좋아요·댓글을 실측한 곡만 우선 순위에 넣습니다. 아직 미수집인 곡은 0회로 간주하지 않습니다.":"v6에서는 YouTube·NicoNico·Bilibili의 확인 가능한 조회수를 주 신호로 사용하고, SoundCloud·Bandcamp·Piapro는 링크 존재를 낮은 가중치의 확산 신호로 반영합니다. TouhouDB의 소수 투표만으로 상위권에 오르는 현상을 막기 위해 커뮤니티 지표는 보정치로만 반영합니다. 같은 곡의 서로 다른 영상은 합산하고 동일 영상 ID는 중복 제거합니다."
  };
}
function influenceRankDetail(t){
  const rank=influenceRankInfo(t),b=influenceBreakdown(t);
  return{
    title:"원곡 영향력 순위 근거",
    formula:"영향력 점수 = 파생곡 + 서클 + 앨범 + 영상 연결 파생곡",
    score:Number(rank?.score)||b.total,
    source:rank?.rank
      ?{label:"공식 원곡 전수 비교",text:fmt(rank.total)+"개 공식 원곡 중 "+fmt(rank.rank)+"위"}
      :{label:"현재 표본 기준",text:"전수 영향력 순위가 아직 없으면 현재 연결 데이터로 계산합니다."},
    components:[
      {label:"파생 규모",points:b.total,description:"직접 연결된 2차창작의 폭과 다양성"},
      {label:"원곡 여부",points:0,description:"공식 원곡에만 영향력 점수를 부여"}
    ],
    metrics:b.metrics,
    note:"같은 서클이나 같은 앨범에서 파생곡이 많이 나와도 서클·앨범은 중복 제거 후 집계합니다."
  };
}
function fanViewRankInfo(t){
  const pool=fanOriginalPool().filter(x=>mediaViewStats(x).mediaCount>0).sort((a,b)=>viewSignal(b)-viewSignal(a)||mediaViewStats(b).total-mediaViewStats(a).total||String(a.title||"").localeCompare(String(b.title||""),"ja"));
  const i=pool.findIndex(x=>resolveId(x.id)===resolveId(t?.id));
  const stats=mediaViewStats(t),catalogTotal=fanOriginalPool().length;
  if(!stats.mediaCount)return null;
  return{rank:i>=0?i+1:null,total:pool.length,score:viewSignal(t),views:stats.total,platforms:stats.platforms,media:stats.mediaCount,partial:pool.length<catalogTotal,fanOriginal:true,catalogTotal};
}
function viewRankInfo(t){
  if(isCuratedStyle(t))return fanViewRankInfo(t);
  const stats=mediaViewStats(t),coverage=state.full.manifest?.viewCoverage||{};
  const total=Number(coverage.rankedTracks)||0;
  const views=Math.max(Number(t?.viewTotal)||0,stats.total);
  const platforms=Math.max(Number(t?.viewPlatformCount)||0,stats.platforms);
  const media=Math.max(Number(t?.viewMediaCount)||0,stats.mediaCount);
  const storedRank=Number(t?.viewRank)||0;
  const validStoredRank=rankingV5Ready()&&total>0&&media>0&&storedRank>=1&&storedRank<=total;
  if(validStoredRank){
    return{rank:storedRank,total,score:Number(t.viewScore)||viewSignal(t),views,platforms,media,partial:coverage.mode!=="multi-platform",coverage};
  }
  if(!media)return null;
  return{rank:null,total,score:viewSignal(t),views,platforms,media,partial:true,coverage,invalidStoredRank:storedRank>0};
}
function viewRankDetail(t){
  const rank=viewRankInfo(t),v=mediaViewStats(t),coverage=state.full.manifest?.viewCoverage||{};
  const views=rank?.views??Math.max(v.total,Number(t?.viewTotal)||0);
  const maxViews=Math.max(v.max,Number(t?.viewMax)||0);
  const media=rank?.media??Math.max(v.mediaCount,Number(t?.viewMediaCount)||0);
  const platforms=rank?.platforms??Math.max(v.platforms,Number(t?.viewPlatformCount)||0);
  const providerCoverage=coverage.providers||{},candidates=coverage.candidates||{};
  const actual=new Map(v.providers.map(x=>[x.provider,x.views]));
  const measuredProviders=["youtube","niconico","bilibili"],linkOnlyProviders=["soundcloud","bandcamp","piapro"];
  const metrics=measuredProviders.map(p=>{
    if(actual.has(p))return{label:platformLabel(p),raw:fmt(actual.get(p))+"회",rule:"실제 조회수 확인 영상만 합산",points:null};
    if(p==="youtube"&&coverage.youtubeKeyConfigured===false)return{label:"YouTube",raw:"미수집",rule:"YouTube API 키 미설정 · 후보 "+fmt(Number(candidates.youtube)||0)+"개",points:null};
    if(Number(candidates[p])>0)return{label:platformLabel(p),raw:"미확인",rule:"후보 "+fmt(Number(candidates[p])||0)+"개 중 조회수 확인 실패/미수집",points:null};
    return{label:platformLabel(p),raw:"후보 없음",rule:"이 곡에 연결된 조회수 대상 영상 없음",points:null};
  });
  for(const p of linkOnlyProviders){
    const count=(t?.mediaCandidates||[]).filter(m=>m?.provider===p).length;
    metrics.push({label:platformLabel(p),raw:count?fmt(count)+"개 링크":"후보 없음",rule:count?"공개 조회수 미수집 · 링크 존재를 플랫폼 확산 보조점수에 반영":"등록 링크 없음",points:null});
  }
  metrics.push({label:"전체 합산",raw:fmt(views)+"회",rule:"조회수 값이 확인된 영상만 · 중복 영상 ID 제거",points:null});
  metrics.push({label:"최고 단일 영상",raw:fmt(maxViews)+"회",rule:"조회수 확인 성공 PV 중 최댓값",points:null});
  const manifestProviders=state.full.manifest?.providers||{};
  const coverageText=["youtube","niconico","bilibili","soundcloud","bandcamp","piapro"].map(p=>platformLabel(p)+" "+fmt(Number(providerCoverage[p]??manifestProviders[p])||0)+"곡").join(" · ");
  const indexed=Number(state.full.manifest?.indexed)||fullRankTotal();
  const coverageRatio=indexed?((Number(coverage.rankedTracks)||0)/indexed*100):0;
  const youtubeNote=coverage.youtubeKeyConfigured===false
    ?"YouTube 조회수가 0으로 보이는 이유는 현재 FULL INDEX 빌드에 YouTube Data API 키가 설정되지 않아 후보 "+fmt(Number(candidates.youtube)||0)+"개를 조회하지 못했기 때문입니다. "
    :"";
  return{
    title:"플랫폼 조회수 순위 근거",
    formula:"조회수 점수 = 합산 log×6 + 최고 영상 log×1.5 + 플랫폼별 log 기여 + 확인 플랫폼 폭",
    score:Number(rank?.score)||viewSignal(t),
    source:rank?.rank
      ?{label:"부분 조회수 표본 순위",text:fmt(rank.total)+"곡(조회수 확인 성공 곡) 중 "+fmt(rank.rank)+"위 · 합산 "+fmt(views)+"회"}
      :rank?.partial
        ?{label:"부분 조회수 집계",text:"전체 "+fmt(indexed)+"곡 중 "+fmt(rank.total)+"곡("+coverageRatio.toFixed(2)+"%)만 조회수 확인 · 이 화면을 켜둔다고 추가 집계되지는 않습니다."}
        :{label:"조회수 미집계",text:"이 곡은 지원 플랫폼의 공개 조회수 값을 아직 확보하지 못했습니다."},
    components:[
      {label:"실제 확인 조회수",points:viewSignal(t),description:fmt(media)+"개 영상 · "+fmt(platforms)+"개 플랫폼"},
      {label:"수집 커버리지",value:fmt(Number(coverage.rankedTracks)||0)+" / "+fmt(indexed),description:coverageText}
    ],
    metrics,
    note:(rank?.invalidStoredRank?"이전 캐시에 남아 있던 유효하지 않은 조회수 순위 값은 무시했습니다. ":"")+youtubeNote+"순위 데이터는 FULL INDEX 재빌드 때 갱신됩니다. 조회수 값이 없는 영상은 0회로 간주하지 않습니다."
  };
}
function overallRankDetail(t){
  if(isCuratedStyle(t)){
    const r=fanOriginalRankInfo(t),pop=popularityBreakdown(t);
    return{
      title:"동방풍 순위 산정 근거",
      formula:"동방풍 점수 = 실측 조회수 점수 + YouTube 반응 + TouhouDB 반응 보정",
      score:Number(r.score)||pop.total,
      source:{label:"동방풍 실측 랭킹",text:(r.rank?fmt(r.total)+"곡 중 "+fmt(r.rank)+"위":"실측 데이터 집계 중")+" · 전체 "+fmt(r.catalogTotal)+"곡 · 공식 원곡/2차창작 순위와 별도"},
      components:[{label:"플랫폼 조회수",points:pop.viewPts,description:pop.views.mediaCount?fmt(pop.views.total)+"회 확인":"아직 조회수 미수집"},{label:"YouTube 반응",points:pop.engagementPts,description:fmt(pop.engagement.likes)+" 좋아요 · "+fmt(pop.engagement.comments)+" 댓글"},{label:"DB 반응 보정",points:pop.baseTotal,description:"TouhouDB 반응이 있을 때만 보조 반영"}],
      metrics:pop.metrics,
      note:"조회수나 반응을 아직 수집하지 못한 곡은 0회로 취급해 억지 순위를 매기지 않습니다. 실측 데이터가 확보된 곡끼리 먼저 비교하고 수집 범위를 계속 넓힙니다."
    };
  }
  const rank=trackRank(t),pop=popularityBreakdown(t),inf=influenceBreakdown(t);
  const score=Number(rank.score)||pop.total+inf.total*0.35;
  let source;
  if(rank.fullScale){
    source={
      label:"전수 인덱스 기반",
      text:fmt(rank.total)+"곡 전수에서 "+fmt(rank.rank)+"위 · 별도 스케일 환산 없음"
    };
  }else if(rank.sampleRank){
    source={
      label:rank.estimated?"현재 표본에서 환산":"현재 로드 기준",
      text:fmt(rank.sampleTotal)+"곡 표본 "+fmt(rank.sampleRank)+"위"+(rank.estimated?" → "+fmt(rank.total)+"곡 스케일 약 "+fmt(rank.rank)+"위":"")
    };
  }else{
    source={label:"순위 계산 중",text:"현재 곡의 비교 표본이 충분히 로드되면 순위를 다시 계산합니다."};
  }
  return{
    title:"종합순위 산정 근거",
    formula:"종합 점수 = 인기 점수 + 원곡 영향력 점수 × 0.25",
    score,
    source,
    components:[
      {label:"인기 점수",points:pop.total,description:"평점 · 즐겨찾기 · DB 조회 · 플랫폼 조회수"},
      {label:"원곡 영향력 기여",points:inf.total*0.25,description:t?.type==="original"?"영향력 원점수 "+inf.total.toFixed(2)+"pt의 25%만 종합에 반영":"2차창작에는 0점"}
    ],
    metrics:[...pop.metrics,...inf.metrics],
    note:"랭킹 v6는 조회수 기반 인기를 중심으로 계산하고, TouhouDB의 소수 투표는 보정치로만 사용합니다. 원곡 영향력은 공식 원곡에 한해 종합점수의 25% 가중치로 반영합니다."
  };
}
function refreshRanks(){
  if(state.full.loaded){
    state.rankTotal=state.full.manifest?.indexed||state.fullItems.length;
    return;
  }
  const pool=dedupe([...state.known.values()]).filter(t=>!isCuratedStyle(t)).sort((a,b)=>overallRankScore(b)-overallRankScore(a)||recommendScore(b)-recommendScore(a)||a.title.localeCompare(b.title,"ja"));
  state.rankIndex=new Map(pool.map((t,i)=>[resolveId(t.id),{rank:i+1,score:overallRankScore(t)}]));
  state.rankTotal=pool.length;
}
function fullRankTotal(){
  return Math.max(Number(state.full.manifest?.indexed)||Number(state.remote.catalogTotal)||state.rankTotal||state.known.size||1,1);
}
function trackRank(t){
  const total=fullRankTotal();
  if(!t)return{rank:null,sampleRank:null,score:0,total,sampleTotal:state.rankTotal||0,estimated:false,fullScale:false,stale:!rankingV5Ready()};
  if(isCuratedStyle(t)){
    const r=fanOriginalRankInfo(t);
    return{rank:r.rank,sampleRank:r.rank,score:r.score,total:r.total,sampleTotal:r.total,estimated:false,fullScale:false,stale:false,fanOriginal:true,catalogTotal:r.catalogTotal,coverage:r.coverage,pending:r.pending};
  }
  if(rankingV5Ready()&&t.globalRank&&state.full.manifest){
    return{
      rank:Number(t.globalRank),sampleRank:Number(t.globalRank),score:Number(t.globalScore)||overallRankScore(t),
      total,sampleTotal:total,estimated:false,fullScale:true,stale:false
    };
  }
  if(state.full.loaded&&!rankingV5Ready()){
    return{rank:null,sampleRank:null,score:overallRankScore(t),total,sampleTotal:total,estimated:false,fullScale:false,stale:true};
  }
  if(!state.rankIndex.size||!state.rankIndex.has(resolveId(t.id)))refreshRanks();
  const row=state.rankIndex.get(resolveId(t.id))||{rank:null,score:overallRankScore(t)};
  const sampleTotal=state.rankTotal||0;
  if(state.full.manifest?.indexed){
    return{rank:null,sampleRank:row.rank,score:row.score,total,sampleTotal,estimated:false,fullScale:false,stale:false};
  }
  return{rank:row.rank,sampleRank:row.rank,score:row.score,total:sampleTotal||total,sampleTotal,estimated:false,fullScale:false,stale:false};
}
function rankPercentValue(rank){
  if(!rank?.rank||!rank?.total)return null;
  return rank.rank/rank.total*100;
}
function rankPercentText(rank){
  const p=rankPercentValue(rank);
  if(rank?.fanOriginal){
    const coverage=fmt(rank.total||0)+" / "+fmt(rank.catalogTotal||0)+"곡 반응 확인";
    if(p===null)return coverage+" · 집계 중";
    return "상위 "+(p<0.01?"<0.01":p.toFixed(2))+"% · "+coverage;
  }
  if(rank?.stale)return"v6 재집계 중";
  if(p===null&&rank?.sampleRank&&rank?.sampleTotal)return"표본 "+fmt(rank.sampleRank)+"/"+fmt(rank.sampleTotal)+" · 전수 집계 중";
  if(p===null)return"전수 순위 준비 중";
  if(p<0.01)return"상위 <0.01%";
  return "상위 "+p.toFixed(2)+"%";
}
function rankText(rank){
  const total=rank?.total||fullRankTotal();
  if(rank?.fanOriginal){
    if(!rank?.rank)return "전체 "+fmt(rank.catalogTotal||0)+"곡 · 실측 집계 중";
    return "반응 확인 "+fmt(total)+"곡 중 "+fmt(rank.rank)+"위";
  }
  if(!rank?.rank&&state.full.manifest?.indexed)return fmt(total)+"곡 전체 · 순위 준비 중";
  if(!rank?.rank)return fmt(total)+"곡 중 —위";
  return fmt(total)+"곡 중 "+fmt(rank.rank)+"위";
}
function popularityRankInfo(t){
  if(isCuratedStyle(t))return fanOriginalRankInfo(t);
  const total=fullRankTotal();
  if(rankingV5Ready()&&t?.popularityRank&&state.full.manifest){
    const rank=Number(t.popularityRank);
    return{rank,total,percent:rank/total*100,score:Number(t.popularityScore)||popularityScore(t),rawRank:rank,stale:false};
  }
  return{rank:null,total,percent:null,score:popularityScore(t),rawRank:null,stale:state.full.loaded&&!rankingV5Ready()};
}
function influenceRankInfo(t){
  const originals=Number(state.full.manifest?.counts?.original)||state.fullItems.filter(x=>x.type==="original").length||1;
  if(t?.type!=="original")return null;
  const ready=rankingV5Ready();
  return{
    rank:ready?(Number(t.influenceRank)||null):null,total:originals,score:ready?(Number(t.influenceScore)||influenceScore(t)):influenceScore(t),
    children:Number(t.derivativeCount)||countChildren(t.id),
    circles:Number(t.derivativeCircleCount)||0,
    albums:Number(t.derivativeAlbumCount)||0,
    stale:state.full.loaded&&!ready
  };
}
function mediaPublicUrl(m){
  const p=m?.provider,id=String(m?.id||"").trim(),url=String(m?.url||"").trim();
  if(/^https?:\/\//.test(url))return url;
  if(p==="youtube"&&id)return"https://www.youtube.com/watch?v="+encodeURIComponent(id);
  if(p==="niconico"&&id)return"https://www.nicovideo.jp/watch/"+encodeURIComponent(id);
  if(p==="bilibili"&&id)return/^BV/i.test(id)?"https://www.bilibili.com/video/"+encodeURIComponent(id):"https://www.bilibili.com/video/av"+encodeURIComponent(id.replace(/^av/i,""));
  if(p==="piapro"&&id)return"https://piapro.jp/content/"+encodeURIComponent(id);
  return"";
}
function trustedLinks(t){
  const seen=new Set(),out=[],order={youtube:1,niconico:2,bilibili:3,soundcloud:4,bandcamp:5,piapro:6,touhoudb:7,source:8};
  const add=(provider,url)=>{
    url=String(url||"").trim();if(!/^https?:\/\//.test(url))return;
    const key=provider+":"+url;if(seen.has(key))return;seen.add(key);out.push({provider,url});
  };
  for(const m of t?.mediaCandidates||[])add(m?.provider||"source",mediaPublicUrl(m));
  if(t?.touhoudbId)add("touhoudb","https://touhoudb.com/S/"+encodeURIComponent(t.touhoudbId));
  if(t?.source?.url)add(t.source?.name==="TouhouDB"?"touhoudb":"source",t.source.url);
  return out.sort((a,b)=>(order[a.provider]||99)-(order[b.provider]||99));
}
function orderByStoredRank(list,field,totalHint=0){
  const max=Math.max(Number(totalHint)||0,list.length);
  if(max>500000)return [...list].sort((a,b)=>(Number(a?.[field])||1e12)-(Number(b?.[field])||1e12));
  const ranked=new Array(max),unranked=[];
  for(const t of list){
    const r=Number(t?.[field])||0;
    if(r>0&&r<=max&&!ranked[r-1])ranked[r-1]=t;
    else unranked.push(t);
  }
  const out=[];
  for(const t of ranked)if(t)out.push(t);
  if(unranked.length)out.push(...unranked);
  return out;
}
function sortList(list,sort){
  const fanOnly=list.length>0&&list.every(isCuratedStyle);
  if(state.mode==="beginner"&&sort==="recommend")return [...list].sort((a,b)=>{
    const av=beginnerVideoInfo(a),bv=beginnerVideoInfo(b);
    return Number(bv.explicit)-Number(av.explicit)||beginnerScore(b)-beginnerScore(a)||Number(bv.video)-Number(av.video)||popularityScore(b)-popularityScore(a)||String(a.title||"").localeCompare(String(b.title||""),"ja");
  });
  if(sort==="year-desc")return [...list].sort((a,b)=>(b.year||0)-(a.year||0));
  if(sort==="year-asc")return [...list].sort((a,b)=>(a.year||9999)-(b.year||9999));
  if(sort==="title")return [...list].sort((a,b)=>a.title.localeCompare(b.title,"ja"));
  if(sort==="popularity"){
    if(fanOnly)return [...list].sort((a,b)=>popularityScore(b)-popularityScore(a)||recommendScore(b)-recommendScore(a)||a.title.localeCompare(b.title,"ja"));
    if(state.full.loaded)return orderByStoredRank(list,"popularityRank",state.full.manifest?.indexed);
    return [...list].sort((a,b)=>(Number(a.popularityRank)||1e12)-(Number(b.popularityRank)||1e12)||popularityScore(b)-popularityScore(a));
  }
  if(sort==="influence"){
    return [...list].sort((a,b)=>{
      if(a.type!==b.type)return a.type==="original"?-1:1;
      return (Number(a.influenceRank)||1e12)-(Number(b.influenceRank)||1e12)||influenceScore(b)-influenceScore(a);
    });
  }
  if(sort==="views"){
    if(state.full.loaded)return orderByStoredRank(list,"viewRank",state.full.manifest?.viewCoverage?.rankedTracks||state.full.manifest?.indexed);
    return [...list].sort((a,b)=>(Number(a.viewRank)||1e12)-(Number(b.viewRank)||1e12)||viewSignal(b)-viewSignal(a)||a.title.localeCompare(b.title,"ja"));
  }
  if(fanOnly)return [...list].sort((a,b)=>popularityScore(b)-popularityScore(a)||recommendScore(b)-recommendScore(a)||a.title.localeCompare(b.title,"ja"));
  if(state.full.loaded)return list;
  return [...list].sort((a,b)=>overallRankScore(b)-overallRankScore(a)||recommendScore(b)-recommendScore(a));
}
function recommendScore(t){return (Number(t.ratingScore)||0)*3+(Number(t.favoritedTimes)||0)*.08+(player.playable(t)?5:0)+(t.type==="arrangement"?2:0)+(t.originalIds?.length?3:0)+(t.moods?.length||0)*.2}
function randomDive(){const pool=currentPool();if(pool.length)startDive(pool[Math.floor(Math.random()*pool.length)])}
function snapshotTrack(t){
  return{id:t.id,type:t.type,category:t.category||"",songTypeRaw:t.songTypeRaw||"",title:t.title,aliases:t.aliases||[],year:t.year||null,work:t.work||"",workId:t.workId||"",workIds:t.workIds||[],role:t.role||"",character:t.character||"",circle:t.circle||"",album:t.album||"",moods:t.moods||[],originalIds:t.originalIds||[],artists:t.artists||{},artistString:t.artistString||"",media:t.media||null,mediaCandidates:t.mediaCandidates||[],mediaUnavailable:!!t.mediaUnavailable,thumb:t.thumb||"",source:t.source||null,touhoudbId:t.touhoudbId||null,ratingScore:Number(t.ratingScore)||0,favoritedTimes:Number(t.favoritedTimes)||0,hitCount:Number(t.hitCount)||0,globalRank:Number(t.globalRank)||null,globalScore:Number(t.globalScore)||0,popularityRank:Number(t.popularityRank)||null,popularityScore:Number(t.popularityScore)||0,influenceRank:Number(t.influenceRank)||null,influenceScore:Number(t.influenceScore)||0,viewRank:Number(t.viewRank)||null,viewScore:Number(t.viewScore)||0,viewTotal:Number(t.viewTotal)||0,viewMax:Number(t.viewMax)||0,viewPlatformCount:Number(t.viewPlatformCount)||0,viewMediaCount:Number(t.viewMediaCount)||0,derivativeCount:Number(t.derivativeCount)||0,derivativeCircleCount:Number(t.derivativeCircleCount)||0,derivativeAlbumCount:Number(t.derivativeAlbumCount)||0,derivativeMediaCount:Number(t.derivativeMediaCount)||0,remote:!!t.remote};
}
function persistSnapshot(t){
  if(!t)return;
  const s=snapshotTrack(t);state.snapshots[s.id]=s;
  const keys=Object.keys(state.snapshots);
  if(keys.length>120)for(const k of keys.slice(0,keys.length-120))delete state.snapshots[k];
  writeJson("touhoudive:snapshots",state.snapshots);
}
function toggleFavorite(t,opts={}){
  const id=resolveId(t.id);
  state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);
  persistSnapshot(t);writeJson("touhoudive:favorites",[...state.favorites]);
  if(opts.open!==false)openTrack(byId(id)||t);
  player.setFavoriteState?.(state.favorites.has(id));
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
function syncModeTabs(){
  $$("#modeTabs .mode-tab").forEach(x=>x.classList.toggle("is-active",x.dataset.mode===state.mode));
  const work=$("#workSelect");if(work){work.disabled=state.mode==="fan-original"||state.mode==="db-fan-original"||state.mode==="beginner";work.title=work.disabled?"입문/팬 원곡/동방풍은 작품 필터와 별도입니다.":""}
}
function setDataHealth(kind,text){
  const el=$("#dataHealth");
  el.classList.toggle("is-loading",kind==="loading");
  el.classList.toggle("is-error",kind==="error");
  $("#datasetStatus").textContent=text;
}
function closePanel(){$("#detailPanel").classList.remove("is-open");$("#detailPanel").setAttribute("aria-hidden","true");syncScrim();}
function closeMenu(){$("#sidebar").classList.remove("is-open");syncScrim();}
function openSkinPanel(){
  closeMenu();
  const panel=$("#skinPanel");panel.classList.add("is-open");panel.setAttribute("aria-hidden","false");
  syncSkinPanel();syncScrim();
}
function closeSkinPanel(){
  const panel=$("#skinPanel");if(!panel)return;
  panel.classList.remove("is-open");panel.setAttribute("aria-hidden","true");syncScrim();
}
function syncScrim(){
  const on=$("#detailPanel").classList.contains("is-open")||$("#sidebar").classList.contains("is-open")||$("#skinPanel")?.classList.contains("is-open");
  $("#scrim").classList.toggle("is-open",!!on);
}
function toggleTheme(){const html=document.documentElement,next=html.dataset.theme==="light"?"dark":"light";html.dataset.theme=next;localStorage.setItem("touhoudive:theme",next);}
function currentSkin(){const s=document.documentElement.dataset.skin;return["station","graph","custom"].includes(s)?s:"station"}
function setSkin(skin){
  if(!["station","graph","custom"].includes(skin))skin="station";
  document.documentElement.dataset.skin=skin;localStorage.setItem("touhoudive:skin",skin);
  syncSkinButtons();syncSkinPanel();
  toast(skin==="custom"?"CUSTOM · 내 배경 스킨":skin==="station"?"STATION · MP3 스킨":"GRAPH · 아카이브 스킨");
}
function syncSkinButtons(){
  const skin=currentSkin(),side=$("#skinBtn"),top=$("#skinTopBtn");
  const label=skin==="station"?"STATION":skin==="graph"?"GRAPH":"CUSTOM";
  if(side)side.textContent="▣ 스킨 설정 · "+label;
  if(top){top.textContent=skin==="custom"?"▦":skin==="station"?"▣":"◇";top.setAttribute("aria-label","스킨 설정 · "+label)}
}
function customSkinSettings(){
  const raw=readJson(CUSTOM_SKIN_SETTINGS_KEY,{});
  return{dim:Number.isFinite(Number(raw.dim))?Math.max(0,Math.min(80,Number(raw.dim))):46,fit:raw.fit==="contain"?"contain":"cover"};
}
function applyCustomSkinSettings(){
  const cfg=customSkinSettings(),root=document.documentElement;
  root.style.setProperty("--custom-bg-dim",String(cfg.dim/100));
  root.style.setProperty("--custom-bg-fit",cfg.fit);
  const dim=$("#customBgDim"),fit=$("#customBgFit");
  if(dim)dim.value=String(cfg.dim);if(fit)fit.value=cfg.fit;
}
function updateCustomSkinSetting(key,value){
  const cfg=customSkinSettings();cfg[key]=value;writeJson(CUSTOM_SKIN_SETTINGS_KEY,cfg);applyCustomSkinSettings();
}
function syncSkinPanel(){
  const skin=currentSkin();
  $$("#skinPanel [data-skin-choice]").forEach(btn=>{
    const on=btn.dataset.skinChoice===skin;btn.classList.toggle("is-active",on);btn.setAttribute("aria-checked",on?"true":"false");
  });
  const custom=$("#customSkinOptions");if(custom)custom.hidden=skin!=="custom";
  applyCustomSkinSettings();
}
function customSkinDb(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return}
    const req=indexedDB.open("touhoudive-skin-assets",1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("assets"))db.createObjectStore("assets")};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("IndexedDB open failed"));
  });
}
async function optimizeCustomSkinImage(file){
  const src=URL.createObjectURL(file);
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src});
    const maxSide=2400,rawW=Math.max(1,img.naturalWidth||1),rawH=Math.max(1,img.naturalHeight||1);
    const scale=Math.min(1,maxSide/Math.max(rawW,rawH));
    const width=Math.max(1,Math.round(rawW*scale)),height=Math.max(1,Math.round(rawH*scale));
    if(scale===1&&file.size<=3*1024*1024)return file;
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d",{alpha:false});
    ctx.fillStyle="#0b0e12";ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.88));
    return blob||file;
  }finally{URL.revokeObjectURL(src)}
}
async function putCustomSkinImage(blob){
  const db=await customSkinDb();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction("assets","readwrite");tx.objectStore("assets").put(blob,"custom-background");
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error("IndexedDB aborted"));
  });db.close();
}
async function getCustomSkinImage(){
  const db=await customSkinDb();
  const value=await new Promise((resolve,reject)=>{
    const tx=db.transaction("assets","readonly"),req=tx.objectStore("assets").get("custom-background");
    req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
  });db.close();return value;
}
async function deleteCustomSkinImage(){
  const db=await customSkinDb();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction("assets","readwrite");tx.objectStore("assets").delete("custom-background");
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });db.close();
}
async function loadCustomSkinImage(){
  let blob=null;try{blob=await getCustomSkinImage()}catch(_){}
  if(customBgObjectUrl){URL.revokeObjectURL(customBgObjectUrl);customBgObjectUrl=""}
  const root=document.documentElement,preview=$("#customImagePreview"),remove=$("#customBgRemove");
  if(blob instanceof Blob){
    customBgObjectUrl=URL.createObjectURL(blob);
    root.style.setProperty("--custom-bg-image",'url("'+customBgObjectUrl+'")');
    if(preview){preview.style.backgroundImage='url("'+customBgObjectUrl+'")';preview.classList.add("has-image")}
    if(remove)remove.disabled=false;
  }else{
    root.style.setProperty("--custom-bg-image","none");
    if(preview){preview.style.backgroundImage="";preview.classList.remove("has-image")}
    if(remove)remove.disabled=true;
  }
}
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