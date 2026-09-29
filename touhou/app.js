const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const catalog=window.TouhouCatalog;
const player=new window.TouhouMediaPlayer();

const state={
  localOriginals:[],localArrangements:[],known:new Map(),aliases:new Map(),identities:new Map(),remoteItems:[],works:[],
  mode:"all",filter:"전체",workFilter:"",sort:"recommend",selected:null,view:"home",diveDepth:0,diveRoot:null,
  remote:{available:false,loading:false,start:0,total:0,catalogTotal:0,key:"",error:"",counts:{},seq:0},
  favorites:new Set(readJson("touhoudive:favorites",[])),
  history:readJson("touhoudive:history",[]),
  snapshots:readJson("touhoudive:snapshots",{})
};
let searchTimer=0;

boot();

async function boot(){
  try{
    const [o,a,w]=await Promise.all([
      fetch("./data/originals.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("./data/arrangements.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("./data/works.json",{cache:"no-store"}).then(r=>r.json())
    ]);
    state.works=w;
    catalog?.setWorks?.(w);
    state.localOriginals=o.map(x=>({...x,type:"original",circle:"ZUN",album:x.work,originalIds:[],remote:false}));
    state.localArrangements=a.map(x=>({...x,type:"arrangement",remote:false}));
    [...state.localOriginals,...state.localArrangements].forEach(remember);
    Object.values(state.snapshots||{}).forEach(x=>x&&remember({...x,snapshot:true}));
    normalizePersistentIds();
    renderWorkSelect();
    setView("home");
    renderLocalFirst();
    bind();
    if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
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
  $("#workSelect").addEventListener("change",e=>{state.workFilter=e.target.value;if(state.workFilter&&state.view==="home")setView("discover");renderCatalog();loadRemote(true);});
  $("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderCatalog();loadRemote(true);});
  $("#loadMoreBtn").onclick=()=>loadRemote(false);
  $("#randomBtn").onclick=randomDive;$("#heroDiveBtn").onclick=randomDive;
  $("#playableBtn").onclick=()=>{state.mode="all";state.filter="영상 있음";syncModeTabs();renderCatalog("인앱 재생 가능한 곡");loadRemote(true);};
  $("#refreshBtn").onclick=()=>loadRemote(true,true);
  $("#icebergRefresh").onclick=()=>renderIceberg();
  $("#panelClose").onclick=closePanel;
  $("#scrim").onclick=()=>{closePanel();closeMenu();};
  $("#menuBtn").onclick=()=>{$("#sidebar").classList.toggle("is-open");syncScrim();};
  $("#themeBtn").onclick=toggleTheme;
  $$("#modeTabs .mode-tab").forEach(btn=>btn.onclick=()=>{
    state.mode=btn.dataset.mode;state.filter="전체";syncModeTabs();renderCatalog();loadRemote(true);
  });
  $$(".nav-item[data-view]").forEach(btn=>btn.onclick=()=>nav(btn.dataset.view));
  document.addEventListener("keydown",e=>{
    if(e.key==="/"&&document.activeElement!==$("#searchInput")){e.preventDefault();$("#searchInput").focus();}
    if(e.key==="Escape"){closePanel();closeMenu();if(!player.shell.classList.contains("is-mini")&&!player.shell.hidden)player.minimize();}
  });
}
function renderLocalFirst(){
  state.remoteItems=[];
  updateStats();
  renderCatalog("로컬 카탈로그");
  setDataHealth("loading","로컬 "+state.known.size+"곡 · TouhouDB 연결 중");
  $("#catalogMeta").textContent="로컬 seed 표시 중 · 라이브 카탈로그 연결 확인 중";
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
  out.title=base.title||incoming.title;
  out.type=base.type||incoming.type;
  out.work=base.work||incoming.work||"";
  out.role=base.role||incoming.role||"";
  out.character=base.character||incoming.character||"";
  out.circle=base.circle||incoming.circle||"";
  out.album=(base.album&&!/^東方.+$/.test(base.album))?base.album:(incoming.album||base.album||"");
  out.media=base.media||incoming.media||null;
  out.thumb=base.thumb||incoming.thumb||"";
  out.source=base.source||incoming.source||null;
  out.touhoudbId=incoming.touhoudbId||base.touhoudbId;
  out.aliases=uniq([...(base.aliases||[]),...(incoming.aliases||[])]);
  out.moods=uniq([...(base.moods||[]),...(incoming.moods||[])]);
  out.originalIds=uniq([...(base.originalIds||[]),...(incoming.originalIds||[])]);
  out.artists=mergeArtists(base.artists,incoming.artists);
  out.artistString=base.artistString||incoming.artistString||"";
  out.ratingScore=Math.max(Number(base.ratingScore)||0,Number(incoming.ratingScore)||0);
  out.favoritedTimes=Math.max(Number(base.favoritedTimes)||0,Number(incoming.favoritedTimes)||0);
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
  const local=[...state.localOriginals,...state.localArrangements].map(x=>byId(x.id)||x);
  let pool=dedupe([...local,...state.remoteItems]);
  if(state.mode==="original")pool=pool.filter(t=>t.type==="original");
  if(state.mode==="arrangement")pool=pool.filter(t=>t.type==="arrangement");
  return pool;
}
function renderCatalog(title){
  renderFilters();
  let list=currentPool();
  if(state.filter==="영상 있음")list=list.filter(t=>player.playable(t));
  else if(state.filter!=="전체")list=list.filter(t=>t.circle===state.filter);
  const work=selectedWork();
  if(work)list=list.filter(t=>trackMatchesWork(t,work));
  const q=$("#searchInput").value.trim().toLowerCase();
  if(q)list=list.filter(t=>searchBlob(t).includes(q));
  list=sortList(list,state.sort);
  if(!q&&state.filter==="전체"&&state.sort==="recommend"&&!state.remoteItems.length)list=shuffle(list).slice(0,12);
  renderGrid(list);
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
  const loaded=[...state.known.values()];
  const localOrig=state.localOriginals.length,localArr=state.localArrangements.length;
  $("#statOriginal").textContent=fmt(state.remote.counts.original||loaded.filter(x=>x.type==="original").length||localOrig);
  $("#statArrangement").textContent=fmt(state.remote.counts.arrangement||loaded.filter(x=>x.type==="arrangement").length||localArr);
  $("#statMedia").textContent=fmt(loaded.filter(t=>player.playable(t)).length);
  $("#statOriginalMeta").textContent=state.remote.counts.original?"TouhouDB 원곡 분류":"로컬 + 현재 로드";
  $("#statArrangementMeta").textContent=state.remote.counts.arrangement?"TouhouDB 어레인지 분류":"로컬 + 현재 로드";
  updateCatalogTotal();
}
function updateCatalogTotal(){
  const n=state.remote.catalogTotal||state.remote.total||state.known.size;
  $("#statLinks").textContent=fmt(n);
  $("#statLinksMeta").textContent=state.remote.catalogTotal?"TouhouDB 전체 등록곡":"현재 로드";
  $("#heroCatalogCount").textContent=fmt(n)+" tracks";
}
function syncCatalogFooter(){
  const btn=$("#loadMoreBtn"),meta=$("#catalogMeta");
  const special=state.view==="library"||state.view==="history";
  $("#catalogFooter").hidden=special;
  if(special)return;
  if(!state.remote.available){
    btn.disabled=true;btn.textContent="라이브 DB 오프라인";return;
  }
  btn.disabled=state.remote.loading||(state.remote.total>0&&state.remote.start>=state.remote.total);
  btn.textContent=state.remote.loading?"불러오는 중…":(btn.disabled?"현재 범위 모두 로드":"더 불러오기");
  meta.innerHTML='<span class="remote-pulse">TouhouDB</span> · '+fmt(state.remoteItems.length)+'곡 로드'+(state.remote.total?" / "+fmt(state.remote.total):"")+(state.remote.error?" · 오류 있음":"");
}
function catalogTitle(q,count){
  if(q)return `전체 DB 검색 · ${count}곡 표시`;
  const work=selectedWork();
  if(work)return "TH"+work.number+" · "+work.title;
  if(state.filter!=="전체")return state.filter;
  if(state.mode==="original")return "동방 원곡 전체 탐색";
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
}
function card(t){
  const playable=player.playable(t),origins=originalNames(t);
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
        '<div class="track-badges"><span class="type-badge '+escAttr(t.type)+'">'+(t.type==="original"?"ORIGINAL":"ARRANGE")+'</span>'+(playable?'<span class="media-badge">▶ VIDEO</span>':'')+'</div>'+
      '</div>'+
      '<div class="track-copy"><h3>'+esc(t.title)+'</h3><div class="byline">'+esc(by||"정보 준비 중")+'</div><div class="origin-line">'+esc(originLine)+'</div>'+
        '<div class="tag-row">'+(t.moods||[]).slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'</div>'+
      '</div>'+
    '</button>'+
    '<div class="card-actions '+(originButton?"has-origin":"")+'"><button class="play-btn" data-play="'+escAttr(t.id)+'" '+(playable?"":"disabled")+'>'+(playable?"▶ 재생":"영상 없음")+'</button>'+originButton+'<button class="dive-btn" data-dive="'+escAttr(t.id)+'">⌁ 다이브</button></div>'+
  '</article>';
}
function openTrack(t){
  if(!t)return;
  t=byId(t.id)||t;
  state.selected=t;pushHistory(t.id,t);
  const canonicalId=resolveId(t.id);
  const fav=state.favorites.has(canonicalId),origins=originalTracks(t),children=[...state.known.values()].filter(a=>originalIds(a).includes(canonicalId));
  const artistLine=t.type==="arrangement"
    ? [t.circle&&"Circle "+t.circle,(t.artists?.arranger||[]).length&&"Arrange "+t.artists.arranger.join(", "),(t.artists?.vocal||[]).length&&"Vocal "+t.artists.vocal.join(", ")].filter(Boolean).join("<br>")
    : [t.work||t.artistString,t.role,t.character&&"Character "+t.character].filter(Boolean).join("<br>");
  const source=t.media?.url||t.source?.url||"";
  const missing=(t.originalIds||[]).filter(id=>!byId(id));
  $("#detailContent").innerHTML=`
    <div class="detail-hero"><div class="detail-kicker">${t.type==="original"?"ORIGINAL":"ARRANGEMENT"} · ${t.remote?"TOUHOUDB LIVE":"LOCAL VERIFIED"}</div><h2>${esc(t.title)}</h2><div class="detail-meta">${artistLine}<br>${t.year||""}${t.album?" · "+esc(t.album):""}</div></div>
    <div class="tag-row">${(t.moods||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>
    <div class="detail-actions"><button class="hot" id="detailPlay" ${player.playable(t)?"":"disabled"}>${player.playable(t)?"▶ 앱에서 재생":"영상 준비 중"}</button><button id="detailDive">⌁ 다이브</button>${t.type==="arrangement"?'<button class="origin-jump" id="detailOrigin"><span>↖</span><strong>원곡으로</strong></button>':""}<button id="favBtn">${fav?"♥ 보관됨":"♡ 보관하기"}</button>${source?`<a href="${escAttr(source)}" target="_blank" rel="noopener">원본 링크 ↗</a>`:'<button disabled>원본 링크 없음</button>'}</div>
    ${t.type==="arrangement"?lineageBox("이 어레인지의 원곡",origins,missing):lineageBox("이 원곡을 사용한 현재 로드 어레인지",children,[])}
    <div class="fact-box"><label>다이브 기준</label><div class="detail-meta">${esc(relationText(t))}</div></div>`;
  $("#detailPanel").classList.add("is-open");$("#detailPanel").setAttribute("aria-hidden","false");syncScrim();
  const play=$("#detailPlay");if(play)play.onclick=()=>{if(player.playable(t)){playTrack(t);closePanel();}};
  $("#detailDive").onclick=()=>{startDive(t,{fresh:true});closePanel();};
  const originBtn=$("#detailOrigin");if(originBtn)originBtn.onclick=()=>goToOriginal(t);
  $("#favBtn").onclick=()=>toggleFavorite(t);
  $("#detailContent").querySelectorAll("[data-lineage]").forEach(b=>b.onclick=()=>openTrack(byId(b.dataset.lineage)));
  $("#detailContent").querySelectorAll("[data-hydrate]").forEach(b=>b.onclick=()=>hydrateAndOpen(b.dataset.hydrate));
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
function playTrack(t){
  if(!t||!player.playable(t)){toast("확인된 인앱 영상이 아직 없습니다.");return;}
  const queue=currentPool().filter(x=>player.playable(x));
  player.play(t,queue);pushHistory(t.id,t);
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
  }else if(view==="lineage"){
    renderLineageOverview();
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
  const labels={home:"HOME",discover:"DISCOVER",lineage:"LINEAGE",library:"LIBRARY",history:"HISTORY",dive:"DIVE PATH"};
  $("#sectionEyebrow").textContent=labels[view]||"DISCOVER";
  $("#catalogTools").hidden=view==="library"||view==="history";
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
function startDive(t){
  if(!t)return;
  t=byId(t.id)||t;
  state.selected=t;pushHistory(t.id,t);setView("dive");
  const related=relations(t).slice(0,9);
  $("#diveMap").classList.remove("empty-state");
  $("#diveMap").innerHTML=`<div class="dive-origin"><div><small>START · ${t.type.toUpperCase()}</small><strong>${esc(t.title)}</strong></div><span>${esc(t.type==="arrangement"?(t.circle||""):(t.work||t.artistString||""))}</span></div><div class="relation-list">${related.map(r=>`<button class="relation-card" data-rel="${r.track.id}"><small>${esc(r.reason)}</small><strong>${esc(r.track.title)}</strong><span>${esc(r.track.type==="arrangement"?(r.track.circle||""):(r.track.work||r.track.artistString||""))}</span></button>`).join("")}</div>`;
  $("#diveMap").querySelectorAll("[data-rel]").forEach(b=>b.onclick=()=>startDive(byId(b.dataset.rel)));
  window.scrollTo({top:0,behavior:"smooth"});player.routeChange();
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
  return [...state.known.values()].filter(a=>originalIds(a).includes(target)).length;
}
function searchBlob(t){
  const originals=originalNames(t).join(" "),artists=t.artists?Object.values(t.artists).flat().join(" "):"";
  return [t.title,...(t.aliases||[]),t.work,t.role,t.character,t.circle,t.album,t.artistString,artists,originals,...(t.moods||[])].filter(Boolean).join(" ").toLowerCase();
}
function sortList(list,sort){
  if(sort==="year-desc")return [...list].sort((a,b)=>(b.year||0)-(a.year||0));
  if(sort==="year-asc")return [...list].sort((a,b)=>(a.year||9999)-(b.year||9999));
  if(sort==="title")return [...list].sort((a,b)=>a.title.localeCompare(b.title,"ja"));
  return [...list].sort((a,b)=>recommendScore(b)-recommendScore(a));
}
function recommendScore(t){return (Number(t.ratingScore)||0)*3+(Number(t.favoritedTimes)||0)*.08+(player.playable(t)?5:0)+(t.type==="arrangement"?2:0)+(t.originalIds?.length?3:0)+(t.moods?.length||0)*.2}
function randomDive(){const pool=currentPool();if(pool.length)startDive(pool[Math.floor(Math.random()*pool.length)])}
function snapshotTrack(t){
  return{id:t.id,type:t.type,title:t.title,aliases:t.aliases||[],year:t.year||null,work:t.work||"",role:t.role||"",character:t.character||"",circle:t.circle||"",album:t.album||"",moods:t.moods||[],originalIds:t.originalIds||[],artists:t.artists||{},artistString:t.artistString||"",media:t.media||null,thumb:t.thumb||"",source:t.source||null,touhoudbId:t.touhoudbId||null,remote:!!t.remote};
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