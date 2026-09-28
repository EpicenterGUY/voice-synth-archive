const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = {
  tracks: [], filtered: [], selected: null, filter: "전체",
  favorites: new Set(JSON.parse(localStorage.getItem("touhoudive:favorites") || "[]")),
  history: JSON.parse(localStorage.getItem("touhoudive:history") || "[]")
};
const worksOrder = ["전체","東方紅魔郷","東方妖々夢","東方永夜抄","東方風神録","東方地霊殿"];

async function boot(){
  const res = await fetch("./data/originals.json");
  state.tracks = await res.json();
  state.filtered = [...state.tracks];
  renderFilters(); renderRecommendations();
  bind();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
function bind(){
  $("#searchInput").addEventListener("input", e => search(e.target.value));
  $("#randomBtn").onclick = randomDive; $("#heroDiveBtn").onclick = randomDive;
  $("#surpriseBtn").onclick = () => openTrack(sample(hiddenPool()));
  $("#refreshBtn").onclick = renderRecommendations;
  $("#panelClose").onclick = closePanel; $("#scrim").onclick = () => {closePanel();closeMenu()};
  $("#menuBtn").onclick = () => {$("#sidebar").classList.toggle("is-open");$("#scrim").classList.toggle("is-open")};
  $("#themeBtn").onclick = toggleTheme;
  document.addEventListener("keydown", e => {
    if(e.key === "/" && document.activeElement !== $("#searchInput")){ e.preventDefault(); $("#searchInput").focus(); }
    if(e.key === "Escape"){ closePanel(); closeMenu(); }
  });
  $$(".nav-item").forEach(btn => btn.onclick = () => nav(btn.dataset.view, btn));
}
function nav(view, btn){
  $$(".nav-item").forEach(x=>x.classList.toggle("is-active",x===btn));
  closeMenu();
  if(view==="home"){state.filter="전체";renderFilters();renderRecommendations();$("#sectionTitle").textContent="원곡 추천";}
  if(view==="dive"){($("#diveSection")).scrollIntoView({behavior:"smooth"});}
  if(view==="works"){state.filter="전체";renderFilters();renderGrid(state.tracks);$("#sectionTitle").textContent="전체 원곡";}
  if(view==="library"){renderGrid(state.tracks.filter(t=>state.favorites.has(t.id)));$("#sectionTitle").textContent="보관한 원곡";}
  if(view==="history"){const m=new Map(state.tracks.map(t=>[t.id,t]));renderGrid(state.history.map(id=>m.get(id)).filter(Boolean));$("#sectionTitle").textContent="최근 들여다본 원곡";}
}
function renderFilters(){
  $("#quickFilters").innerHTML = worksOrder.map(w=>`<button class="filter-chip ${state.filter===w?"is-active":""}" data-work="${w}">${w}</button>`).join("");
  $$(".filter-chip").forEach(btn=>btn.onclick=()=>{
    state.filter=btn.dataset.work; renderFilters();
    const list = state.filter==="전체" ? state.tracks : state.tracks.filter(t=>t.work===state.filter);
    renderGrid(list); $("#sectionTitle").textContent = state.filter==="전체" ? "원곡 추천" : `${state.filter} 원곡`;
  });
}
function renderRecommendations(){
  const shuffled=[...state.tracks].sort(()=>Math.random()-.5);
  const picks=[]; const used=new Set();
  for(const t of shuffled){ if(!used.has(t.work)){picks.push(t);used.add(t.work)} if(picks.length===8)break; }
  for(const t of shuffled){if(picks.length>=8)break;if(!picks.includes(t))picks.push(t)}
  renderGrid(picks);
}
function renderGrid(list){
  const grid=$("#trackGrid");
  if(!list.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;min-height:180px"><strong>표시할 곡이 없습니다.</strong><span>검색어 또는 보관함을 확인해 주세요.</span></div>`;return;}
  grid.innerHTML=list.map(card).join("");
  grid.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openTrack(byId(b.dataset.open)));
  grid.querySelectorAll("[data-dive]").forEach(b=>b.onclick=e=>{e.stopPropagation();startDive(byId(b.dataset.dive));});
}
function card(t){
  const glow = t.work.includes("紅魔") ? "#ff5b7366" : t.work.includes("妖々") ? "#f0a7ff55" : t.work.includes("永夜") ? "#8477ff55" : t.work.includes("風神") ? "#67d7a855" : "#f38b6655";
  return `<article class="track-card" style="--card-glow:${glow}" data-open="${t.id}">
    <div class="meta">${t.year} · ${t.work}</div><h3>${t.title}</h3><p>${t.role}${t.character ? " · "+t.character : ""}</p>
    <div class="tag-row">${t.moods.slice(0,3).map(x=>`<span class="tag">${x}</span>`).join("")}</div>
    <div class="card-actions"><button data-open="${t.id}">상세</button><button class="dive-btn" data-dive="${t.id}">다이브</button></div>
  </article>`;
}
function search(q){
  q=q.trim().toLowerCase();
  if(!q){renderRecommendations();$("#sectionTitle").textContent="원곡 추천";return;}
  const list=state.tracks.filter(t=>[t.title,t.work,t.character,t.role,...t.moods].filter(Boolean).join(" ").toLowerCase().includes(q));
  renderGrid(list);$("#sectionTitle").textContent=`검색 결과 ${list.length}곡`;
}
function byId(id){return state.tracks.find(t=>t.id===id)}
function openTrack(t){
  if(!t)return; state.selected=t; pushHistory(t.id);
  const fav=state.favorites.has(t.id);
  const yt=`https://www.youtube.com/results?search_query=${encodeURIComponent("東方 "+t.title+" original")}`;
  $("#detailContent").innerHTML=`<div class="detail-hero"><div class="work">${t.work} · ${t.year}</div><h2>${t.title}</h2><div class="detail-meta">${t.role}<br>${t.character||"캐릭터 비지정"} · 작곡 ZUN</div></div>
  <div class="tag-row">${t.moods.map(x=>`<span class="tag">${x}</span>`).join("")}</div>
  <div class="detail-actions"><button class="hot" id="panelDive">이 곡에서 다이브</button><button id="favBtn">${fav?"♥ 보관됨":"♡ 보관하기"}</button><a href="${yt}" target="_blank" rel="noopener">영상 검색</a><button id="copyBtn">곡명 복사</button></div>
  <div class="fact-box"><label>원곡 기준</label><strong>공식 게임 수록곡</strong><div class="detail-meta">어레인지/보컬 어레인지는 이 데이터셋에서 분리됩니다.</div></div>
  <div class="fact-box"><label>탐색 힌트</label><div class="detail-meta">${relationText(t)}</div></div>`;
  $("#detailPanel").classList.add("is-open");$("#detailPanel").setAttribute("aria-hidden","false");$("#scrim").classList.add("is-open");
  $("#panelDive").onclick=()=>{startDive(t);closePanel();};
  $("#favBtn").onclick=()=>toggleFavorite(t.id);
  $("#copyBtn").onclick=()=>navigator.clipboard?.writeText(t.title).then(()=>toast("곡명을 복사했습니다."));
}
function startDive(t){
  state.selected=t; pushHistory(t.id);
  const related=relations(t).slice(0,6);
  $("#diveMap").classList.remove("empty-state");
  $("#diveMap").innerHTML=`<div class="dive-origin"><div><small>START</small><strong>${t.title}</strong></div><span>${t.work}</span></div>
  <div class="relation-list">${related.map(r=>`<button class="relation-card" data-rel="${r.track.id}"><small>${r.reason}</small><strong>${r.track.title}</strong><span>${r.track.work} · ${r.track.role}</span></button>`).join("")}</div>`;
  $("#diveMap").querySelectorAll("[data-rel]").forEach(b=>b.onclick=()=>startDive(byId(b.dataset.rel)));
  $("#diveSection").scrollIntoView({behavior:"smooth",block:"start"});
}
function relations(t){
  return state.tracks.filter(x=>x.id!==t.id).map(x=>{
    let score=0,reasons=[];
    if(x.work===t.work){score+=4;reasons.push("같은 작품")}
    if(x.year===t.year){score+=1}
    const shared=x.moods.filter(m=>t.moods.includes(m)); if(shared.length){score+=shared.length*2;reasons.push("분위기 "+shared[0])}
    if(x.role.includes("Extra")===t.role.includes("Extra") && x.role.includes("Extra")){score+=3;reasons.push("Extra 계보")}
    if((x.role.includes("Boss")||x.character)&&(t.role.includes("Boss")||t.character)){score+=1}
    score += Math.max(0,1-Math.abs(x.year-t.year)/6);
    return {track:x,score,reason:reasons[0]||"시대·구조 브리지"};
  }).sort((a,b)=>b.score-a.score);
}
function relationText(t){const rs=relations(t).slice(0,2);return rs.length?`${rs.map(x=>x.track.title).join(", ")} 쪽으로 이어가면 ${rs[0].reason} 흐름을 볼 수 있습니다.`:"연결 곡을 계산 중입니다."}
function toggleFavorite(id){
  state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);
  localStorage.setItem("touhoudive:favorites",JSON.stringify([...state.favorites]));
  openTrack(byId(id)); toast(state.favorites.has(id)?"보관함에 저장했습니다.":"보관함에서 제거했습니다.");
}
function pushHistory(id){
  state.history=[id,...state.history.filter(x=>x!==id)].slice(0,30);
  localStorage.setItem("touhoudive:history",JSON.stringify(state.history));
}
function hiddenPool(){return state.tracks.filter(t=>!["U.N.オーエンは彼女なのか？","亡き王女の為のセプテット","ネクロファンタジア","ネイティブフェイス","ハルトマンの妖怪少女"].includes(t.title))}
function randomDive(){startDive(sample(state.tracks))}
function sample(a){return a[Math.floor(Math.random()*a.length)]}
function closePanel(){$("#detailPanel").classList.remove("is-open");$("#detailPanel").setAttribute("aria-hidden","true");$("#scrim").classList.remove("is-open")}
function closeMenu(){$("#sidebar").classList.remove("is-open"); if(!$("#detailPanel").classList.contains("is-open"))$("#scrim").classList.remove("is-open")}
function toggleTheme(){const html=document.documentElement;const next=html.dataset.theme==="light"?"dark":"light";html.dataset.theme=next;localStorage.setItem("touhoudive:theme",next)}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1600)}
document.documentElement.dataset.theme=localStorage.getItem("touhoudive:theme")||"dark";
boot();