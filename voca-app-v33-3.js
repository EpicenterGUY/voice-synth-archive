/* Voca Support v33.3 — followed producer feed and advanced filter UX */
(function(){
"use strict";
var FOLLOW_KEY="vsa.v33.followedProducers",CACHE_KEY="vsa.v333.followFeed";
function api(){return window.VSAV33||null}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function load(k,f){try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function addStyle(){if(document.getElementById("v333Style"))return;var s=document.createElement("style");s.id="v333Style";s.textContent="\n.v333-follow-card{margin-top:10px;border:1px solid #20474e;border-radius:17px;background:linear-gradient(155deg,#0a252b,#071a20);overflow:hidden}\n.v333-follow-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 13px;border-bottom:1px solid #193a40}.v333-follow-head b{display:block;font-size:12px}.v333-follow-head small{display:block;margin-top:2px;color:#688e8b;font-size:7px}.v333-follow-head button{min-height:31px;border:1px solid #2a555c;border-radius:9px;background:#0b2930;color:#bfe0dc;font-size:7px;font-weight:900;padding:0 9px}\n.v333-follow-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;padding:10px}.v333-follow-song{min-width:0}.v333-follow-song a{display:block;color:#eaf9f6;text-decoration:none}.v333-follow-thumb{position:relative;aspect-ratio:16/9;border-radius:11px;overflow:hidden;background:#0b252b}.v333-follow-thumb img{width:100%;height:100%;object-fit:cover}.v333-follow-thumb i{position:absolute;right:7px;bottom:7px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#effffb;color:#061316;font-style:normal;font-size:9px}.v333-follow-song b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:6px;font-size:9px;line-height:1.35}.v333-follow-song small{display:block;margin-top:3px;color:#678c89;font-size:7px}.v333-follow-producer{margin-top:5px;border:0;background:transparent;color:#72d7ce;font-size:7px;font-weight:900;padding:0}\n.v333-active-filters{display:flex;gap:5px;flex-wrap:wrap;margin:-2px 0 10px}.v333-active-filters span{padding:5px 8px;border:1px solid #285159;border-radius:999px;background:#092329;color:#9bc2be;font-size:7px}.v333-active-filters .strong{border-color:#4a7d7e;background:#123a40;color:#e8fffb}\n.v333-empty{padding:28px 14px;text-align:center;color:#719491;font-size:8px;line-height:1.6}.v333-empty button{margin-top:9px;min-height:33px;border:1px solid #2a555c;border-radius:9px;background:#0b2930;color:#bfe0dc;font-size:8px;font-weight:900;padding:0 10px}\n@media(max-width:699px){.v333-follow-grid{grid-template-columns:1fr 1fr}.v333-follow-head{align-items:flex-start}.v333-follow-head button{flex:0 0 auto}}@media(max-width:430px){.v333-follow-grid{grid-template-columns:1fr}}\n";document.head.appendChild(s)}
function followed(){return load(FOLLOW_KEY,[]).filter(Boolean).slice(0,12)}
function badSet(){var sm=load("vsa.smart.v23",{feedback:{}}),set=new Set();Object.entries(sm.feedback||{}).forEach(function(x){if(Number(x[1].value)<0)set.add(x[0])});return set}
function ensureFollowUi(){
  var root=document.querySelector('[data-tool-view="explore33"] .v33-view-body');if(!root||root.querySelector(".v333-follow-card"))return;
  var box=document.createElement("section");box.className="v333-follow-card";box.innerHTML='<div class="v333-follow-head"><div><b>팔로우한 P의 새 곡</b><small>취향에 추가한 프로듀서의 최근 업로드</small></div><button type="button" id="v333FollowRefresh">새로고침 ↻</button></div><div class="v333-follow-grid" id="v333FollowGrid"><div class="v333-empty">불러오는 중…</div></div>';
  root.appendChild(box);document.getElementById("v333FollowRefresh").onclick=function(){refreshFollow(true)};
}
function songCard(row){
  var s=row.song,p=row.producer,y=s.startTime?new Date(s.startTime).toLocaleDateString("ko-KR",{month:"short",day:"numeric"}):"-";
  return '<article class="v333-follow-song"><a href="https://www.nicovideo.jp/watch/'+encodeURIComponent(s.contentId)+'" target="_blank" rel="noopener"><div class="v333-follow-thumb">'+(s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" alt="">':'')+'<i>▶</i></div><b>'+esc(s.title||s.contentId)+'</b><small>'+esc(p)+' · '+y+' · 조회 '+fmt(s.viewCounter||0)+'</small></a><button type="button" class="v333-follow-producer" data-v333-producer="'+esc(p)+'">'+esc(p)+' 상세 ›</button></article>';
}
function renderFollow(rows){
  ensureFollowUi();var grid=document.getElementById("v333FollowGrid");if(!grid)return;
  var fs=followed();
  if(!fs.length){grid.innerHTML='<div class="v333-empty">아직 팔로우한 프로듀서가 없습니다.<br>프로듀서 상세에서 <b>♡ 취향에 추가</b>를 눌러보세요.<br><button type="button" data-v333-open-producers>프로듀서 찾기</button></div>';return}
  grid.innerHTML=rows&&rows.length?rows.slice(0,16).map(songCard).join(""):'<div class="v333-empty">최근 곡을 찾지 못했습니다.</div>';
}
async function fetchForProducer(name){
  try{var d=await fetchNico({year:"all",limit:35,offset:0,mode:"ranking",sort:"-startTime",applyYear:false,applyTier:false,extraExactTag:name,numericFilters:{viewCounter:{gte:0}}});return(d.data||[]).map(function(song){return{song:song,producer:name}})}catch(e){return[]}
}
async function refreshFollow(force){
  ensureFollowUi();var btn=document.getElementById("v333FollowRefresh"),cache=load(CACHE_KEY,null),fs=followed();
  if(!force&&cache&&Date.now()-Number(cache.at||0)<1800000&&JSON.stringify(cache.producers||[])===JSON.stringify(fs)){renderFollow(cache.rows||[]);return}
  if(!fs.length){renderFollow([]);return}
  if(btn){btn.disabled=true;btn.textContent="불러오는 중…"}
  var groups=await Promise.all(fs.slice(0,8).map(fetchForProducer)),bad=badSet(),map=new Map();
  groups.flat().forEach(function(x){var s=x.song;if(!s||!s.contentId||bad.has(s.contentId))return;var old=map.get(s.contentId);if(!old||new Date(s.startTime)>new Date(old.song.startTime))map.set(s.contentId,x)});
  var rows=Array.from(map.values()).sort(function(a,b){return new Date(b.song.startTime||0)-new Date(a.song.startTime||0)}).slice(0,24);
  save(CACHE_KEY,{at:Date.now(),producers:fs,rows:rows});renderFollow(rows);
  if(btn){btn.disabled=false;btn.textContent="새로고침 ↻"}
}
function filterLabels(){
  var a=api();if(!a||!a.filterState)return[];var f=a.filterState(),out=[];
  if((f.vocals||[]).length)out.push({t:(f.vocals||[]).join(" + "),s:true});
  if(f.period)out.push({t:f.period==="7d"?"최근 7일":f.period==="30d"?"최근 30일":"최근 1년"});
  if(f.duration)out.push({t:f.duration==="short"?"2분 미만":f.duration==="normal"?"2~4분":f.duration==="long"?"4~6분":"6분+"});
  if(f.minViews!==""||f.maxViews!=="")out.push({t:"조회 "+(f.minViews||"0")+" ~ "+(f.maxViews||"∞")});
  if(f.excludeHeard)out.push({t:"들어본 곡 제외"});
  if(f.savedOnly)out.push({t:"보관곡만",s:true});
  if(f.excludeDisliked!==false)out.push({t:"관심없음 제외"});
  return out;
}
function renderActiveFilters(){
  var root=document.querySelector('[data-tool-view="searchHub33"] .v33-view-body');if(!root)return;
  var old=root.querySelector(".v333-active-filters"),bar=root.querySelector(".v33-filterbar");
  if(!old){old=document.createElement("div");old.className="v333-active-filters";if(bar)bar.insertAdjacentElement("afterend",old)}
  var labels=filterLabels(),html=labels.length?labels.map(function(x){return'<span class="'+(x.s?"strong":"")+'">'+esc(x.t)+'</span>'}).join(""):'';
  if(old.dataset.v333Html!==html){old.dataset.v333Html=html;old.innerHTML=html}
}
function addQuickChips(){
  var q=document.querySelector(".v33-filter-quick");if(!q||q.dataset.v333)return;q.dataset.v333="1";
  [["short","짧은 곡"],["long","장편"],["month","최근 30일"],["saved","보관곡만"]].forEach(function(x){var b=document.createElement("button");b.type="button";b.className="v33-chip";b.dataset.v333Quick=x[0];b.textContent=x[1];q.appendChild(b)});
}
function applyQuick(k){
  var a=api();if(!a)return;var f=a.filterState();
  if(k==="short")f.duration="short";
  if(k==="long")f.duration="epic";
  if(k==="month")f.period="30d";
  if(k==="saved")f.savedOnly=true;
  localStorage.setItem("vsa.v33.filters",JSON.stringify(f));renderActiveFilters();a.runSearch(f);
}
function bind(){
  document.addEventListener("click",function(e){
    var p=e.target.closest&&e.target.closest("[data-v333-producer]");if(p){if(window.VSAV33ProducerDetail)window.VSAV33ProducerDetail(p.dataset.v333Producer);return}
    if(e.target.closest&&e.target.closest("[data-v333-open-producers]")){api()&&api().openView("explore33");setTimeout(function(){document.getElementById("v33ProducerList")?.scrollIntoView({behavior:"smooth"})},30);return}
    var q=e.target.closest&&e.target.closest("[data-v333-quick]");if(q){applyQuick(q.dataset.v333Quick);return}
    if(e.target.id==="v33FilterApply"||e.target.id==="v33FilterReset")setTimeout(renderActiveFilters,50);
    var follow=e.target.closest&&e.target.closest("[data-v331-follow]");if(follow)setTimeout(function(){refreshFollow(true)},80);
  });
}
var syncQueued=false;
function syncUiSoon(){
  if(syncQueued)return;syncQueued=true;
  requestAnimationFrame(function(){
    syncQueued=false;
    ensureFollowUi();addQuickChips();renderActiveFilters()
  })
}
function observe(){
  var body=document.querySelector("#toolsModal .tools-body");
  if(body)new MutationObserver(function(){syncUiSoon()}).observe(body,{childList:true});
}
var __booted=false;
function boot(){if(__booted)return;__booted=true;addStyle();ensureFollowUi();addQuickChips();renderActiveFilters();bind();observe();var c=load(CACHE_KEY,null);if(c&&c.rows)renderFollow(c.rows);else renderFollow([]);setTimeout(function(){ensureFollowUi();addQuickChips();renderActiveFilters()},500)}
if(document.body)boot();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();