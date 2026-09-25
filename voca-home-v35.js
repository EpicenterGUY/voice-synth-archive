/* Voca Support v35 — real single-feed home */
(function(){
"use strict";
var HK="vsa.home.v28",SK="vsa.smart.v23",OK="vsa.organizer.v22",ACTIVE_KEY="vsa.home.active.v35",active=localStorage.getItem(ACTIVE_KEY)||"DAILY",busy=false;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function load(k,f){try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function tags(s){var r=s&&s.tags;return Array.isArray(r)?r.map(String):String(r||"").split(/[\s,、]+/).filter(Boolean)}
function addStyle(){if(document.getElementById("v35Style"))return;var s=document.createElement("style");s.id="v35Style";s.textContent="\n#v28Home,.mobile-section-nav,.v33-dock,#v30BottomDock{display:none!important}\n#v35Home{display:block;min-height:100%;padding:0 0 96px}\n.v35-head{display:flex;align-items:end;justify-content:space-between;gap:10px;padding:14px 2px 10px}.v35-head small{display:block;color:#72d9d0;font-size:7px;font-weight:950;letter-spacing:.14em}.v35-head h1{margin:4px 0 2px;font-size:26px;letter-spacing:-.05em}.v35-head p{margin:0;color:#779b97;font-size:8px}\n.v35-tabs{display:flex;gap:6px;overflow-x:auto;padding:0 0 10px;scrollbar-width:none}.v35-tabs::-webkit-scrollbar{display:none}.v35-tabs button{flex:0 0 auto;min-height:34px;padding:0 12px;border:1px solid #285159;border-radius:999px;background:#092329;color:#91b8b4;font-size:8px;font-weight:900}.v35-tabs button.active{background:#16434a;color:#effffc;border-color:#4e8585}\n.v35-feature{position:relative;overflow:hidden;min-height:260px;border:1px solid #285159;border-radius:20px;background:#081d22}.v35-feature>a{display:block;position:absolute;inset:0;color:#fff;text-decoration:none}.v35-feature img{width:100%;height:100%;object-fit:cover}.v35-feature-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 15%,rgba(0,0,0,.12) 45%,rgba(0,0,0,.82) 100%)}.v35-feature-copy{position:absolute;left:18px;right:70px;bottom:16px}.v35-feature-copy small{display:block;color:#72e0d6;font-size:8px;font-weight:950}.v35-feature-copy b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:5px;font-size:clamp(18px,4.5vw,28px);line-height:1.2;letter-spacing:-.03em}.v35-feature-copy span{display:block;margin-top:6px;color:#bad0cd;font-size:8px}.v35-feature-play{position:absolute;right:16px;bottom:16px;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#effffb;color:#061316;font-size:16px;font-weight:950}\n.v35-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 2px 8px}.v35-toolbar h2{margin:0;font-size:18px}.v35-toolbar small{display:block;margin-top:2px;color:#6d918e;font-size:7px}.v35-toolbar button{flex:0 0 auto;min-height:34px;padding:0 10px;border:1px solid #285159;border-radius:10px;background:#0b2930;color:#c2e3df;font-size:8px;font-weight:900}\n.v35-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.v35-card{min-width:0}.v35-thumb{position:relative;display:block;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#0b252b}.v35-thumb img{width:100%;height:100%;object-fit:cover}.v35-thumb .play{position:absolute;right:8px;bottom:8px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#effffb;color:#061316;font-size:11px}\n.v35-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:7px 3px 0;color:#effaf8;text-decoration:none;font-size:10px;font-weight:900;line-height:1.4}.v35-meta{margin:4px 3px 0;color:#678d89;font-size:7px}.v35-reason{margin:4px 3px 0;color:#73aaa5;font-size:7px}.v35-actions{display:flex;gap:5px;margin-top:7px}.v35-actions button{min-height:31px;border:1px solid #285159;border-radius:10px;background:#0a262c;color:#9fc4bf;font-size:7px;font-weight:850;padding:0 9px}.v35-actions .danger{border-color:#573943;background:#261b1f;color:#dfadb4}\n.v35-empty{padding:50px 14px;text-align:center;border:1px dashed #285159;border-radius:16px;color:#729592;font-size:9px;line-height:1.6}.v35-empty button{margin-top:10px;min-height:36px;border:1px solid #2b565d;border-radius:10px;background:#0b2930;color:#c6e5e1;font-size:8px;font-weight:900;padding:0 12px}\n.v35-skeleton{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.v35-skeleton span{display:block;aspect-ratio:16/9;border-radius:14px;background:linear-gradient(90deg,#0b252b,#103038,#0b252b);background-size:200% 100%;animation:v35sh 1.1s linear infinite}@keyframes v35sh{to{background-position:-200% 0}}\n@media(max-width:699px){#v35Home{padding-left:0;padding-right:0}.v35-head{padding-top:9px}.v35-head h1{font-size:22px}.v35-head p{display:none}.v35-feature{min-height:230px;border-radius:16px}.v35-feature-copy{left:14px;right:62px;bottom:14px}.v35-feature-copy b{font-size:20px}.v35-feature-play{right:12px;bottom:12px;width:44px;height:44px}.v35-grid{grid-template-columns:1fr;gap:16px}.v35-card{padding-bottom:2px}.v35-thumb{border-radius:13px}.v35-title{font-size:11px}.v35-toolbar{padding-top:14px}}\n@media(min-width:700px) and (max-width:1100px){.v35-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n";document.head.appendChild(s)}
function feed(){var f=load(HK,null);if(f)return f;var p=window.VSAV33&&window.VSAV33.localPool?window.VSAV33.localPool():[];return{daily:p.slice(0,12),taste:p.slice(12,24),newer:p.slice(24,36),hidden:p.slice(36,48)}}
function key(mark){return mark==="DAILY"?"daily":mark==="FOR YOU"?"taste":mark==="NEW"?"newer":"hidden"}
function label(mark){return mark==="DAILY"?"추천":mark==="FOR YOU"?"내 취향":mark==="NEW"?"신곡":"숨은 곡"}
function subtitle(mark){return mark==="DAILY"?"오늘 골라볼 만한 곡":mark==="FOR YOU"?"보관함과 피드백을 반영":mark==="NEW"?"최근 올라온 음성합성곡":"조회수 아래 묻힌 곡"}
function reason(song,mark){
  if(mark==="NEW")return"최근 업로드";
  if(mark==="DEEP")return"낮은 조회수에서 발견";
  if(mark==="DAILY")return"오늘의 추천";
  try{var sig=window.VSAV33&&window.VSAV33.tasteSignals?window.VSAV33.tasteSignals().tags:[],set=new Set(tags(song)),hit=sig.find(function(x){return set.has(x[0])});return hit?"취향 태그 · "+hit[0]:"내 취향과 유사"}catch(e){return"내 취향과 유사"}
}
function getSong(id){var f=feed(),ks=["daily","taste","newer","hidden"];for(var i=0;i<ks.length;i++){var s=(f[ks[i]]||[]).find(function(x){return x.contentId===id});if(s)return s}return null}
function ensureRoot(){
  var root=document.getElementById("v35Home");
  if(!root){
    root=document.createElement("main");root.id="v35Home";
    var app=document.querySelector(".app")||document.body,top=document.querySelector(".app>.topbar");
    if(top)top.insertAdjacentElement("afterend",root);else app.prepend(root);
  }
  var old=document.getElementById("v28Home");if(old)old.remove();
  return root;
}
function card(s,mark){
  var y=s.startTime?new Date(s.startTime).getFullYear():"-";
  return '<article class="v35-card"><a class="v35-thumb" href="https://www.nicovideo.jp/watch/'+encodeURIComponent(s.contentId)+'" target="_blank" rel="noopener">'+(s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" decoding="async" alt="">':'')+'<span class="play">▶</span></a><a class="v35-title" href="https://www.nicovideo.jp/watch/'+encodeURIComponent(s.contentId)+'" target="_blank" rel="noopener">'+esc(s.title||s.contentId)+'</a><div class="v35-meta">조회 '+fmt(s.viewCounter||0)+' · '+y+'</div><div class="v35-reason">✦ '+esc(reason(s,mark))+'</div><div class="v35-actions"><button data-v35-save="'+esc(s.contentId)+'">♡ 보관</button><button data-v35-sim="'+esc(s.contentId)+'">비슷한 곡</button><button class="danger" data-v35-dislike="'+esc(s.contentId)+'">관심없음</button></div></article>';
}
function render(){
  var root=ensureRoot();if(!root)return;
  var f=feed(),rows=(f[key(active)]||[]).slice(),hero=rows[0]||null,list=rows.slice(hero?1:0,13),date=new Date().toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"});
  root.innerHTML='<div class="v35-head"><div><small>VOCALO SUPPORT · '+esc(date)+'</small><h1>오늘의 보카로</h1><p>한 화면에서는 한 피드만. 필요한 추천만 골라서 봅니다.</p></div></div>'+
    '<nav class="v35-tabs">'+[["DAILY","추천"],["FOR YOU","내 취향"],["NEW","신곡"],["DEEP","숨은 곡"],["PRODUCER","프로듀서"]].map(function(x){return'<button type="button" class="'+(active===x[0]?"active":"")+'" data-v35-tab="'+x[0]+'">'+x[1]+'</button>'}).join("")+'</nav>'+
    (hero?'<section class="v35-feature"><a href="https://www.nicovideo.jp/watch/'+encodeURIComponent(hero.contentId)+'" target="_blank" rel="noopener">'+(hero.thumbnailUrl?'<img src="'+esc(hero.thumbnailUrl)+'" loading="lazy" decoding="async" alt="">':'')+'<div class="v35-feature-shade"></div><div class="v35-feature-copy"><small>'+label(active)+' PICK</small><b>'+esc(hero.title||hero.contentId)+'</b><span>조회 '+fmt(hero.viewCounter||0)+' · '+esc(reason(hero,active))+'</span></div><span class="v35-feature-play">▶</span></a></section>':'')+
    '<div class="v35-toolbar"><div><h2>'+label(active)+'</h2><small>'+subtitle(active)+'</small></div><button type="button" id="v35Refresh">'+(busy?"갱신 중…":"다른 곡 ↻")+'</button></div>'+
    (list.length?'<div class="v35-grid">'+list.map(function(s){return card(s,active)}).join("")+'</div>':'<div class="v35-empty">표시할 추천 데이터가 아직 없습니다.<br><button type="button" id="v35Load">추천 불러오기</button></div>');
}
async function refresh(){
  if(busy)return;busy=true;render();
  try{
    if(window.VSAHome28&&window.VSAHome28.refreshSection)await window.VSAHome28.refreshSection(active);
    else if(window.VSAHome28&&window.VSAHome28.loadFeed)await window.VSAHome28.loadFeed(true);
  }catch(e){}
  busy=false;render();
}
function keep(id){
  var s=getSong(id);if(!s)return;
  if(window.VSAOrganizer22&&window.VSAOrganizer22.setSongStatus)window.VSAOrganizer22.setSongStatus(id,"interest",s);
  try{toast("관심곡으로 보관했습니다.")}catch(e){}
}
function dislike(id){
  var s=getSong(id),sm=load(SK,{feedback:{},tagPrefs:{}});sm.feedback=sm.feedback||{};sm.feedback[id]={value:-1,at:Date.now(),song:s};save(SK,sm);
  var f=feed();["daily","taste","newer","hidden"].forEach(function(k){f[k]=(f[k]||[]).filter(function(x){return x.contentId!==id})});save(HK,f);render();
  try{toast("관심없음으로 반영했습니다.")}catch(e){}
}
function similar(id){
  var s=getSong(id);if(!s)return;
  if(window.VSAV33&&window.VSAV33.openView)window.VSAV33.openView("universe29");else try{openToolsModal("universe29")}catch(e){}
  setTimeout(function(){try{if(typeof buildUniverse==="function")buildUniverse(s,false)}catch(e){}},40);
}
function bind(){
  document.addEventListener("click",function(e){
    var tab=e.target.closest&&e.target.closest("[data-v35-tab]");if(tab){var v=tab.dataset.v35Tab;if(v==="PRODUCER"){if(window.VSAV33&&window.VSAV33.openView)window.VSAV33.openView("explore33");return}active=v;localStorage.setItem(ACTIVE_KEY,active);render();return}
    if(e.target.id==="v35Refresh"||e.target.id==="v35Load"){refresh();return}
    var sv=e.target.closest&&e.target.closest("[data-v35-save]");if(sv){keep(sv.dataset.v35Save);return}
    var ds=e.target.closest&&e.target.closest("[data-v35-dislike]");if(ds){dislike(ds.dataset.v35Dislike);return}
    var sm=e.target.closest&&e.target.closest("[data-v35-sim]");if(sm){similar(sm.dataset.v35Sim);return}
  });
}
function observe(){
  window.addEventListener("storage",function(e){if(e.key===HK)render()});
}
function boot(){addStyle();ensureRoot();render();bind();observe();document.body.classList.add("v35-home-active");window.VSAHome35={render:render,refresh:refresh}}
if(document.body)boot();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();