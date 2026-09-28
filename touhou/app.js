const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const state={
  tracks:[],originals:[],arrangements:[],visible:[],mode:"all",filter:"전체",sort:"recommend",selected:null,
  favorites:new Set(JSON.parse(localStorage.getItem("touhoudive:favorites")||"[]")),
  history:JSON.parse(localStorage.getItem("touhoudive:history")||"[]")
};
const player=new window.TouhouMediaPlayer();

boot();

async function boot(){
  try{
    const [o,a]=await Promise.all([
      fetch("./data/originals.json",{cache:"no-store"}).then(r=>r.json()),
      fetch("./data/arrangements.json",{cache:"no-store"}).then(r=>r.json())
    ]);
    state.originals=o.map(x=>({...x,type:"original",circle:"ZUN",album:x.work,originalIds:[]}));
    state.arrangements=a.map(x=>({...x,type:"arrangement"}));
    state.tracks=[...state.originals,...state.arrangements];
    bind();
    updateStats();
    applyCatalog("오늘의 다이브 입구");
    $("#datasetStatus").textContent=`${state.tracks.length}곡 · 원곡/어레인지 분리 로드`;
    if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }catch(err){
    console.error(err);
    $("#datasetStatus").textContent="데이터 로드 실패";
    $("#trackGrid").innerHTML='<div class="empty-state" style="grid-column:1/-1;min-height:220px"><strong>데이터를 불러오지 못했습니다.</strong><span>새로고침 후 다시 시도해 주세요.</span></div>';
  }
}
function bind(){
  $("#searchInput").addEventListener("input",()=>applyCatalog());
  $("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;applyCatalog();});
  $("#randomBtn").onclick=randomDive;
  $("#heroDiveBtn").onclick=randomDive;
  $("#playableBtn").onclick=()=>{state.mode="all";state.filter="영상 있음";syncModeTabs();applyCatalog("인앱 재생 가능한 곡");};
  $("#refreshBtn").onclick=()=>applyCatalog("새 추천");
  $("#panelClose").onclick=closePanel;
  $("#scrim").onclick=()=>{closePanel();closeMenu();};
  $("#menuBtn").onclick=()=>{ $("#sidebar").classList.toggle("is-open"); syncScrim(); };
  $("#themeBtn").onclick=toggleTheme;
  $$("#modeTabs .mode-tab").forEach(btn=>btn.onclick=()=>{
    state.mode=btn.dataset.mode;state.filter="전체";syncModeTabs();applyCatalog();
  });
  $$(".nav-item").forEach(btn=>btn.onclick=()=>nav(btn.dataset.view,btn));
  document.addEventListener("keydown",e=>{
    if(e.key==="/"&&document.activeElement!==$("#searchInput")){e.preventDefault();$("#searchInput").focus();}
    if(e.key==="Escape"){closePanel();closeMenu();if(!player.shell.classList.contains("is-mini")&&!player.shell.hidden)player.minimize();}
  });
}
function nav(view,btn){
  $$(".nav-item").forEach(x=>x.classList.toggle("is-active",x===btn));
  closeMenu();
  if(!player.shell.hidden)player.minimize();
  if(view==="home"){state.mode="all";state.filter="전체";syncModeTabs();$("#searchInput").value="";applyCatalog("오늘의 다이브 입구");window.scrollTo({top:0,behavior:"smooth"});}
  else if(view==="discover"){applyCatalog("전체 탐색");$("#catalogSection").scrollIntoView({behavior:"smooth"});}
  else if(view==="dive"){$("#diveSection").scrollIntoView({behavior:"smooth"});}
  else if(view==="lineage"){renderLineageOverview();$("#catalogSection").scrollIntoView({behavior:"smooth"});}
  else if(view==="library"){renderSpecial(state.tracks.filter(t=>state.favorites.has(t.id)),"보관한 곡");}
  else if(view==="history"){const m=new Map(state.tracks.map(t=>[t.id,t]));renderSpecial(state.history.map(id=>m.get(id)).filter(Boolean),"최근 본 곡");}
}
function syncModeTabs(){
  $$("#modeTabs .mode-tab").forEach(x=>x.classList.toggle("is-active",x.dataset.mode===state.mode));
}
function updateStats(){
  $("#statOriginal").textContent=state.originals.length.toLocaleString();
  $("#statArrangement").textContent=state.arrangements.length.toLocaleString();
  $("#statMedia").textContent=state.tracks.filter(t=>player.playable(t)).length.toLocaleString();
  $("#statLinks").textContent=state.arrangements.reduce((n,t)=>n+(t.originalIds||[]).length,0).toLocaleString();
}
function modeBase(){
  if(state.mode==="original")return state.originals;
  if(state.mode==="arrangement")return state.arrangements;
  return state.tracks;
}
function filterOptions(){
  const base=modeBase(),out=["전체","영상 있음"];
  if(state.mode==="arrangement"){
    [...new Set(base.map(x=>x.circle).filter(Boolean))].slice(0,8).forEach(x=>out.push(x));
  }else{
    [...new Set(base.map(x=>x.work).filter(Boolean))].slice(0,8).forEach(x=>out.push(x));
  }
  return out;
}
function renderFilters(){
  const opts=filterOptions();
  if(!opts.includes(state.filter))state.filter="전체";
  $("#quickFilters").innerHTML=opts.map(x=>`<button class="filter-chip ${x===state.filter?"is-active":""}" data-filter="${escAttr(x)}">${esc(x)}</button>`).join("");
  $$("#quickFilters .filter-chip").forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;applyCatalog();});
}
function applyCatalog(title){
  renderFilters();
  let list=modeBase().slice();
  if(state.filter==="영상 있음")list=list.filter(t=>player.playable(t));
  else if(state.filter!=="전체")list=list.filter(t=>t.work===state.filter||t.circle===state.filter);
  const q=$("#searchInput").value.trim().toLowerCase();
  if(q)list=list.filter(t=>searchBlob(t).includes(q));
  list=sortList(list,state.sort);
  if(!q&&state.filter==="전체"&&state.sort==="recommend")list=shuffle(list).slice(0,12);
  state.visible=list;
  renderGrid(list);
  $("#sectionTitle").textContent=title||catalogTitle(q,list.length);
}
function catalogTitle(q,count){
  if(q)return `검색 결과 ${count}곡`;
  if(state.filter!=="전체")return state.filter;
  if(state.mode==="original")return "동방 원곡";
  if(state.mode==="arrangement")return "동방 2차창작";
  return "원곡 + 2차창작";
}
function renderSpecial(list,title){
  state.visible=list;renderGrid(list);$("#sectionTitle").textContent=title;renderFilters();
  $("#catalogSection").scrollIntoView({behavior:"smooth"});
}
function renderLineageOverview(){
  const list=state.originals.slice().sort((a,b)=>{
    const ac=countChildren(a.id),bc=countChildren(b.id);return bc-ac||a.year-b.year;
  });
  state.visible=list;
  renderGrid(list);
  $("#sectionTitle").textContent="원곡 → 2차창작 계보";
}
function countChildren(id){return state.arrangements.filter(a=>(a.originalIds||[]).includes(id)).length}
function sortList(list,sort){
  if(sort==="year-desc")return list.sort((a,b)=>(b.year||0)-(a.year||0));
  if(sort==="year-asc")return list.sort((a,b)=>(a.year||0)-(b.year||0));
  if(sort==="title")return list.sort((a,b)=>a.title.localeCompare(b.title,"ja"));
  return list.sort((a,b)=>recommendScore(b)-recommendScore(a));
}
function recommendScore(t){
  let n=0;if(player.playable(t))n+=5;if(t.type==="arrangement")n+=2;
  if((t.originalIds||[]).length)n+=3;n+=(t.moods||[]).length*.25;return n+Math.random();
}
function renderGrid(list){
  const grid=$("#trackGrid");
  if(!list.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1;min-height:190px"><strong>표시할 곡이 없습니다.</strong><span>필터나 검색어를 바꿔보세요.</span></div>';return;}
  grid.innerHTML=list.map(card).join("");
  grid.querySelectorAll("[data-open]").forEach(b=>b.onclick=e=>{e.stopPropagation();openTrack(byId(b.dataset.open));});
  grid.querySelectorAll("[data-dive]").forEach(b=>b.onclick=e=>{e.stopPropagation();startDive(byId(b.dataset.dive));});
  grid.querySelectorAll("[data-play]").forEach(b=>b.onclick=e=>{e.stopPropagation();playTrack(byId(b.dataset.play));});
}
function card(t){
  const playable=player.playable(t),origins=originalNames(t),by=t.type==="arrangement"
    ? [t.circle,(t.artists?.vocal||[]).join(", ")].filter(Boolean).join(" · ")
    : [t.work,t.role,t.character].filter(Boolean).join(" · ");
  const glow=t.type==="arrangement"?"#ff5d7960":"#8c71ff55";
  return `<article class="track-card" style="--card-glow:${glow}" data-open="${t.id}">
    <div class="track-top">
      <span class="type-badge ${t.type}">${t.type==="original"?"ORIGINAL":"ARRANGEMENT"}</span>
      ${playable?'<span class="media-badge">▶ VIDEO</span>':""}
    </div>
    <h3>${esc(t.title)}</h3>
    <div class="byline">${esc(by||"정보 준비 중")}</div>
    <div class="origin-line">${t.type==="arrangement"?"원곡 · "+esc(origins.join(" / ")||"매칭 준비 중"):`${t.year} · ${countChildren(t.id)}개 어레인지 연결`}</div>
    <div class="tag-row">${(t.moods||[]).slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>
    <div class="card-actions">
      <button data-open="${t.id}">상세</button>
      <button class="play-btn" data-play="${t.id}" ${playable?"":"disabled"}>${playable?"▶ 재생":"영상 없음"}</button>
      <button class="dive-btn" data-dive="${t.id}">다이브</button>
    </div>
  </article>`;
}
function openTrack(t){
  if(!t)return;state.selected=t;pushHistory(t.id);
  const fav=state.favorites.has(t.id),origins=originalTracks(t),children=state.arrangements.filter(a=>(a.originalIds||[]).includes(t.id));
  const artistLine=t.type==="arrangement"
    ? [
        t.circle&&"Circle "+t.circle,
        (t.artists?.arranger||[]).length&&"Arrange "+t.artists.arranger.join(", "),
        (t.artists?.vocal||[]).length&&"Vocal "+t.artists.vocal.join(", ")
      ].filter(Boolean).join("<br>")
    : [t.work,t.role,t.character&&"Character "+t.character].filter(Boolean).join("<br>");
  const source=t.media?.url||t.source?.url||"";
  $("#detailContent").innerHTML=`
    <div class="detail-hero">
      <div class="detail-kicker">${t.type==="original"?"ORIGINAL · ZUN":"ARRANGEMENT · "+esc(t.circle||"")}</div>
      <h2>${esc(t.title)}</h2>
      <div class="detail-meta">${artistLine}<br>${t.year||""}${t.album?" · "+esc(t.album):""}</div>
    </div>
    <div class="tag-row">${(t.moods||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>
    <div class="detail-actions">
      <button class="hot" id="detailPlay" ${player.playable(t)?"":"disabled"}>${player.playable(t)?"▶ 앱에서 재생":"영상 준비 중"}</button>
      <button id="detailDive">다이브</button>
      <button id="favBtn">${fav?"♥ 보관됨":"♡ 보관하기"}</button>
      ${source?`<a href="${escAttr(source)}" target="_blank" rel="noopener">원본 링크 ↗</a>`:'<button disabled>원본 링크 없음</button>'}
    </div>
    ${t.type==="arrangement"?lineageBox("이 어레인지의 원곡",origins):lineageBox("이 원곡을 사용한 어레인지",children)}
    <div class="fact-box"><label>다이브 기준</label><div class="detail-meta">${esc(relationText(t))}</div></div>`;
  $("#detailPanel").classList.add("is-open");$("#detailPanel").setAttribute("aria-hidden","false");syncScrim();
  const play=$("#detailPlay");if(play)play.onclick=()=>{if(player.playable(t)){playTrack(t);closePanel();}};
  $("#detailDive").onclick=()=>{startDive(t);closePanel();};
  $("#favBtn").onclick=()=>toggleFavorite(t.id);
  $("#detailContent").querySelectorAll("[data-lineage]").forEach(b=>b.onclick=()=>openTrack(byId(b.dataset.lineage)));
}
function lineageBox(label,tracks){
  if(!tracks.length)return `<div class="lineage-box"><label>${label}</label><div class="detail-meta">아직 연결 데이터가 없습니다.</div></div>`;
  return `<div class="lineage-box"><label>${label}</label>${tracks.slice(0,12).map(x=>`<button class="lineage-link" data-lineage="${x.id}"><strong>${esc(x.title)}</strong><small>${esc(x.type==="arrangement"?(x.circle||""):(x.work||""))}</small></button>`).join("")}</div>`;
}
function playTrack(t){
  if(!t||!player.playable(t)){toast("확인된 인앱 영상이 아직 없습니다.");return;}
  const queue=state.visible.length?state.visible:state.tracks;
  player.play(t,queue);pushHistory(t.id);
}
function startDive(t){
  if(!t)return;state.selected=t;pushHistory(t.id);
  const related=relations(t).slice(0,9);
  $("#diveMap").classList.remove("empty-state");
  $("#diveMap").innerHTML=`<div class="dive-origin"><div><small>START · ${t.type.toUpperCase()}</small><strong>${esc(t.title)}</strong></div><span>${esc(t.type==="arrangement"?(t.circle||""):(t.work||""))}</span></div>
  <div class="relation-list">${related.map(r=>`<button class="relation-card" data-rel="${r.track.id}"><small>${esc(r.reason)}</small><strong>${esc(r.track.title)}</strong><span>${esc(r.track.type==="arrangement"?(r.track.circle||""):(r.track.work||""))}</span></button>`).join("")}</div>`;
  $("#diveMap").querySelectorAll("[data-rel]").forEach(b=>b.onclick=()=>startDive(byId(b.dataset.rel)));
  $("#diveSection").scrollIntoView({behavior:"smooth",block:"start"});
  if(!player.shell.hidden)player.minimize();
}
function relations(t){
  const tOrig=new Set(t.type==="original"?[t.id]:(t.originalIds||[]));
  return state.tracks.filter(x=>x.id!==t.id).map(x=>{
    let score=0,reasons=[];
    const xOrig=new Set(x.type==="original"?[x.id]:(x.originalIds||[]));
    const sharedOrig=[...tOrig].filter(id=>xOrig.has(id));
    if(sharedOrig.length){score+=12*sharedOrig.length;reasons.push("같은 원곡 계보");}
    if(t.type==="original"&&(x.originalIds||[]).includes(t.id)){score+=16;reasons.unshift("이 원곡의 어레인지");}
    if(x.type==="original"&&(t.originalIds||[]).includes(x.id)){score+=16;reasons.unshift("원곡으로 이동");}
    if(t.work&&x.work===t.work){score+=5;reasons.push("같은 작품");}
    if(t.circle&&x.circle&&t.circle===x.circle&&t.circle!=="ZUN"){score+=7;reasons.push("같은 서클");}
    const tv=t.artists?.vocal||[],xv=x.artists?.vocal||[];if(tv.some(v=>xv.includes(v))){score+=6;reasons.push("같은 보컬");}
    const moods=(t.moods||[]).filter(m=>(x.moods||[]).includes(m));if(moods.length){score+=2*moods.length;reasons.push("분위기 "+moods[0]);}
    const yd=Math.abs((t.year||2000)-(x.year||2000));score+=Math.max(0,2-yd/5);
    if(player.playable(x))score+=.5;
    return {track:x,score,reason:reasons[0]||"시대·분위기 브리지"};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
}
function relationText(t){const r=relations(t).slice(0,3);return r.length?`${r.map(x=>x.track.title).join(" → ")} 쪽으로 이어지는 ${r[0].reason} 흐름이 강합니다.`:"연결 데이터를 확장 중입니다."}
function originalTracks(t){return (t.originalIds||[]).map(byId).filter(Boolean)}
function originalNames(t){return originalTracks(t).map(x=>x.title)}
function byId(id){return state.tracks.find(t=>t.id===id)}
function searchBlob(t){
  const originals=originalNames(t).join(" ");
  const artists=t.artists?Object.values(t.artists).flat().join(" "):"";
  return [t.title,t.work,t.role,t.character,t.circle,t.album,artists,originals,...(t.moods||[])].filter(Boolean).join(" ").toLowerCase();
}
function randomDive(){
  const pool=(state.visible.length?state.visible:modeBase()).filter(Boolean);
  if(!pool.length)return;startDive(pool[Math.floor(Math.random()*pool.length)]);
}
function toggleFavorite(id){
  state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);
  localStorage.setItem("touhoudive:favorites",JSON.stringify([...state.favorites]));
  openTrack(byId(id));toast(state.favorites.has(id)?"보관함에 저장했습니다.":"보관함에서 제거했습니다.");
}
function pushHistory(id){
  state.history=[id,...state.history.filter(x=>x!==id)].slice(0,50);
  localStorage.setItem("touhoudive:history",JSON.stringify(state.history));
}
function closePanel(){$("#detailPanel").classList.remove("is-open");$("#detailPanel").setAttribute("aria-hidden","true");syncScrim();}
function closeMenu(){$("#sidebar").classList.remove("is-open");syncScrim();}
function syncScrim(){const on=$("#detailPanel").classList.contains("is-open")||$("#sidebar").classList.contains("is-open");$("#scrim").classList.toggle("is-open",on);}
function toggleTheme(){
  const html=document.documentElement,next=html.dataset.theme==="light"?"dark":"light";
  html.dataset.theme=next;localStorage.setItem("touhoudive:theme",next);
}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove("show"),1700);}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function escAttr(v){return esc(v)}
document.documentElement.dataset.theme=localStorage.getItem("touhoudive:theme")||"dark";