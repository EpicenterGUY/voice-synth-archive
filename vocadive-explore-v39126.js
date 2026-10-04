/* VocaDive 39.126.0 · music-first Explore + simplified Dive route cards */
(function(){
"use strict";
var VER="39.129.1",mode="recommend",seed=0,obs=null,busy=false;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function year(s){try{return s&&s.startTime?new Date(s.startTime).getFullYear():"-"}catch(_){return"-"}}
function addStyle(){
 if(document.getElementById("v39126ExploreDiveStyle"))return;
 var s=document.createElement("style");s.id="v39126ExploreDiveStyle";s.textContent=`
/* ===== Explore: TouhouDive-like music catalog first ===== */
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready{max-width:1380px;margin:0 auto;padding:10px 4px 110px!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-map-hero{
 padding:18px!important;border:1px solid rgba(164,221,215,.11)!important;border-radius:20px!important;
 background:linear-gradient(135deg,#0a2025,#0b171d 66%,#111a29)!important;box-shadow:none!important
}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-map-hero h2{font-size:clamp(24px,4vw,40px)!important;letter-spacing:-.05em!important;margin:5px 0!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-map-hero p{max-width:62ch;color:#8ba29f!important;font-size:10px!important;line-height:1.6!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-map-hero-actions button{min-height:42px!important;border-radius:999px!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-map-hero-actions .primary{background:#edf9f7!important;color:#061311!important}

.v126-discover{margin:14px 0 22px}
.v126-discover-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:0 2px 9px}
.v126-discover-head small{display:block;color:#68d9cf;font-size:7.5px;font-weight:950;letter-spacing:.13em}
.v126-discover-head h3{margin:4px 0 2px;color:#eff9f7;font-size:22px;letter-spacing:-.04em}
.v126-discover-head p{margin:0;color:#809995;font-size:9px}
.v126-discover-head>button{min-height:34px;padding:0 11px;border:0;border-radius:999px;background:#142326;color:#c8d8d5;font-size:8px;font-weight:900}
.v126-tabs{display:flex;gap:6px;overflow-x:auto;padding:0 1px 10px;scrollbar-width:none}
.v126-tabs::-webkit-scrollbar{display:none}
.v126-tabs button{flex:0 0 auto;min-height:34px;padding:0 12px;border:0;border-radius:999px;background:#132124;color:#8fa6a2;font-size:8.5px;font-weight:900}
.v126-tabs button.active{background:#e8f5f3;color:#071211}
.v126-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px 11px}
.v126-card{min-width:0;position:relative}
.v126-thumb{position:relative;width:100%;aspect-ratio:16/9;padding:0;border:0;border-radius:12px;overflow:hidden;background:#0f1c1f;display:block}
.v126-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.v126-thumb .noimg{width:100%;height:100%;display:grid;place-items:center;color:#6f9d97;font-size:25px;background:linear-gradient(145deg,#15282b,#101b20)}
.v126-thumb .play{position:absolute;right:8px;bottom:8px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#f0faf8;color:#071311;font-size:11px;font-weight:950;box-shadow:0 4px 18px #0007}
.v126-copy{padding:7px 2px 0}
.v126-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0;color:#eff7f6;font-size:11px;font-weight:900;line-height:1.35}
.v126-meta{margin-top:4px;color:#819a96;font-size:8px}
.v126-reason{margin-top:4px;color:#6fa9a3;font-size:7.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v126-card-actions{display:flex;gap:5px;margin-top:7px}
.v126-card-actions button{min-height:30px;padding:0 8px;border:0;border-radius:999px;background:#142326;color:#afc3c0;font-size:7.5px;font-weight:900}
.v126-card-actions button.primary{background:#173a3e;color:#dcfffa}
.v126-entity-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.v126-entity{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:9px;align-items:center;min-height:62px;padding:9px;border:1px solid rgba(164,219,214,.10);border-radius:14px;background:#0e1a1d;color:#eaf4f2;text-align:left}
.v126-entity i{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#173238;color:#75d8cf;font-size:10px;font-style:normal;font-weight:950}
.v126-entity b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}
.v126-entity small{display:block;margin-top:3px;color:#809995;font-size:7px}
.v126-entity em{font-style:normal;color:#71918d;font-size:13px}
.v126-empty{padding:28px;border:1px dashed rgba(152,210,203,.15);border-radius:14px;text-align:center;color:#77938f;font-size:9px}

/* Old tool map becomes secondary */
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-entry-zones{margin-top:28px!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-entry-zones:before{content:"탐색 도구";display:block;margin:0 2px 10px;color:#eff8f6;font-size:19px;font-weight:950;letter-spacing:-.035em}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-zone{
 border:0!important;border-top:1px solid rgba(160,216,210,.09)!important;border-radius:0!important;background:transparent!important;padding:14px 0!important
}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-zone-head>span{display:none!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-zone-head b{font-size:14px!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-zone-head em{font-size:8px!important;color:#7e9793!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-zone-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3919-intent,
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v37-hub-card{
 min-height:68px!important;padding:9px!important;border:1px solid rgba(157,212,206,.09)!important;border-radius:12px!important;background:#0e1a1d!important
}
#toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v393-explore-recent{margin-top:18px!important}

/* ===== Dive: center track first, next routes as clean cards ===== */
#universePanel.v3958-rel .v394-universe-header{border:0!important;border-radius:18px!important;background:linear-gradient(135deg,#0a242b,#0a171d 70%,#101828)!important}
#universePanel.v3958-rel .v394-universe-title h2{font-size:28px!important;letter-spacing:-.05em!important}
#universePanel.v3958-rel .v394-universe-title p{max-width:65ch!important;font-size:9px!important;line-height:1.6!important;color:#83a09c!important}
#universePanel.v3958-rel .universe-layout{grid-template-columns:1fr!important;gap:10px!important}
#universePanel.v3958-rel .universe-side{display:none!important}
#universePanel.v3958-rel.mr77-candidate-selected .universe-layout{grid-template-columns:minmax(0,1fr) 320px!important}
#universePanel.v3958-rel.mr77-candidate-selected .universe-side{display:block!important;position:sticky!important;top:72px!important;max-height:calc(100dvh - 88px)!important;overflow:auto!important}
#universePanel.v3958-rel .mr58-shell{min-height:0!important;border-radius:18px!important;overflow:hidden!important}
#universePanel.v3958-rel .mr58-content{min-height:0!important;padding:14px!important;display:block!important}
#universePanel.v3958-rel .mr58-head{margin-bottom:8px!important}
#universePanel.v3958-rel .mr58-head h3{font-size:22px!important}
#universePanel.v3958-rel .mr58-head p{font-size:8.5px!important;color:#8dafaa!important}
#universePanel.v3958-rel .mr58-summary{display:none!important}
#universePanel.v3958-rel .mr72-depth{margin:10px 0!important;padding:10px!important;border-radius:15px!important;background:rgba(5,25,31,.62)!important;border:1px solid rgba(151,216,209,.10)!important}
#universePanel.v3958-rel .mr72-depth-head b{font-size:12px!important}
#universePanel.v3958-rel .mr72-depth-head span{font-size:7.5px!important}
#universePanel.v3958-rel .mr72-depth-actions button{min-height:36px!important;border-radius:999px!important;font-size:8px!important}
#universePanel.v3958-rel .mr72-depth-track{gap:5px!important}
#universePanel.v3958-rel .mr72-depth-track button{min-height:48px!important;border-radius:11px!important}
#universePanel.v3958-rel .mr72-depth-track button span{font-size:8px!important}
#universePanel.v3958-rel .mr72-depth-track button small{font-size:6.5px!important}
#universePanel.v3958-rel .mr72-advanced{margin:8px 0 12px!important;border:0!important;background:transparent!important}
#universePanel.v3958-rel .mr72-advanced>summary{min-height:34px!important;border-radius:999px!important;background:#10242a!important;padding:0 12px!important;font-size:8px!important}
#universePanel.v3958-rel .mr77-route-head{margin:11px 2px 8px!important}
#universePanel.v3958-rel .mr77-route-head b{font-size:15px!important}
#universePanel.v3958-rel .mr77-route-head i{font-size:7px!important;color:#7d9a96!important}
#universePanel.v3958-rel .mr58-map{
 position:relative!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;
 gap:10px!important;min-height:0!important;align-items:stretch!important
}
#universePanel.v3958-rel .mr58-center{
 position:relative!important;left:auto!important;top:auto!important;transform:none!important;width:auto!important;max-width:none!important;
 grid-column:1/-1!important;order:-10!important;margin:0 0 4px!important;padding:11px!important;border-radius:16px!important;
 background:linear-gradient(135deg,rgba(8,43,50,.94),rgba(12,29,39,.94))!important;box-shadow:none!important
}
#universePanel.v3958-rel .mr58-center-main{grid-template-columns:150px minmax(0,1fr)!important;gap:12px!important}
#universePanel.v3958-rel .mr58-center img,#universePanel.v3958-rel .mr58-center .noimg{width:150px!important;border-radius:12px!important}
#universePanel.v3958-rel .mr58-center h2{font-size:17px!important}
#universePanel.v3958-rel .mr58-center p{font-size:8px!important}
#universePanel.v3958-rel .mr58-center-actions{display:flex!important;gap:6px!important;flex-wrap:wrap!important}
#universePanel.v3958-rel .mr58-center-actions button{min-height:36px!important;border-radius:999px!important;padding:0 11px!important;font-size:8px!important}
#universePanel.v3958-rel .mr58-node{
 position:relative!important;left:auto!important;top:auto!important;transform:none!important;width:auto!important;max-width:none!important;
 display:grid!important;grid-template-columns:1fr!important;grid-template-rows:auto auto auto!important;gap:0!important;
 padding:0!important;border:1px solid rgba(153,216,209,.10)!important;border-radius:14px!important;overflow:hidden!important;
 background:rgba(7,27,34,.90)!important;box-shadow:none!important;backdrop-filter:none!important
}
#universePanel.v3958-rel .mr58-node:hover,#universePanel.v3958-rel .mr58-node.selected{border-color:rgba(106,220,209,.32)!important;background:#0b3037!important}
#universePanel.v3958-rel .mr58-node-main{
 display:block!important;padding:0!important;border:0!important;background:transparent!important;text-align:left!important;min-width:0!important
}
#universePanel.v3958-rel .mr58-node-main img,#universePanel.v3958-rel .mr58-node-main .noimg{
 width:100%!important;aspect-ratio:16/9!important;border-radius:0!important;object-fit:cover!important;display:grid!important;place-items:center!important
}
#universePanel.v3958-rel .mr58-node-copy{display:block!important;padding:9px!important}
#universePanel.v3958-rel .mr76-node-kicker{display:flex!important;justify-content:space-between!important;gap:6px!important;margin-bottom:5px!important}
#universePanel.v3958-rel .mr76-node-kicker i,#universePanel.v3958-rel .mr76-node-kicker em{font-size:6.5px!important}
#universePanel.v3958-rel .mr58-node-copy b{font-size:10px!important;line-height:1.35!important;white-space:normal!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;min-height:27px}
#universePanel.v3958-rel .mr58-node-copy small{font-size:7px!important}
#universePanel.v3958-rel .mr90-node-reason{display:block!important;margin-top:5px!important;font-size:7px!important;color:#79aaa5!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#universePanel.v3958-rel .mr76-node-meter{margin-top:7px!important}
#universePanel.v3958-rel .mr58-node-go{
 min-height:36px!important;margin:0 8px 8px!important;border:0!important;border-radius:999px!important;background:#173b40!important;color:#dffaf6!important;font-size:8px!important;font-weight:950!important
}
#universePanel.v3958-rel .mr58-node>.mr58-badges{padding:0 8px 8px!important;margin:0!important;display:flex!important}
#universePanel.v3958-rel .mr58-badge{font-size:6px!important}
#universePanel.v3958-rel .mr58-links{display:none!important}
#universePanel.v3958-rel .mr58-empty{position:relative!important;inset:auto!important;grid-column:1/-1!important;min-height:160px!important}
#universePanel.v3958-rel .mr74-seascape{opacity:.62!important}
#universePanel.v3958-rel .mr74-bubbles{opacity:.45!important}
#universePanel.v3958-rel .mr61-reason-list b{font-size:7px!important}
#universePanel.v3958-rel .mr61-reason-list span{font-size:7.5px!important}
#universePanel.v3958-rel .mr58-side h3{font-size:16px!important}
#universePanel.v3958-rel .mr58-side-meta{font-size:8px!important}
#universePanel.v3958-rel .mr58-side-actions button{font-size:8px!important}

@media(max-width:1180px){
 .v126-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
 .v126-entity-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
 #universePanel.v3958-rel .mr58-map{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}
@media(max-width:900px){
 .v126-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
 .v126-entity-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 #toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-zone-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 #universePanel.v3958-rel .mr58-map{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 #universePanel.v3958-rel.mr77-candidate-selected .universe-layout{grid-template-columns:1fr!important}
 #universePanel.v3958-rel.mr77-candidate-selected .universe-side{display:none!important}
}
@media(max-width:699px){
 #toolsModal .tool-view[data-tool-view="hub37"].v126-ready{padding-inline:8px!important}
 .v126-discover-head{align-items:start}
 .v126-discover-head h3{font-size:19px}
 .v126-grid{display:flex;overflow-x:auto;gap:10px;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:7px}
 .v126-grid::-webkit-scrollbar{display:none}
 .v126-card{flex:0 0 72vw;max-width:285px;scroll-snap-align:start}
 .v126-entity-grid{grid-template-columns:1fr!important}
 #toolsModal .tool-view[data-tool-view="hub37"].v126-ready .v3990-zone-grid{grid-template-columns:1fr!important}
 #universePanel.v3958-rel .mr58-content{padding:9px 8px 92px!important}
 #universePanel.v3958-rel .mr58-head h3{font-size:18px!important}
 #universePanel.v3958-rel .mr72-depth-track{display:flex!important;overflow-x:auto!important;scrollbar-width:none!important}
 #universePanel.v3958-rel .mr72-depth-track button{flex:0 0 90px!important}
 #universePanel.v3958-rel .mr58-map{grid-template-columns:1fr!important;gap:8px!important}
 #universePanel.v3958-rel .mr58-center-main{grid-template-columns:96px minmax(0,1fr)!important}
 #universePanel.v3958-rel .mr58-center img,#universePanel.v3958-rel .mr58-center .noimg{width:96px!important}
 #universePanel.v3958-rel .mr58-node{grid-template-columns:104px minmax(0,1fr) auto!important;grid-template-rows:auto!important;align-items:center!important}
 #universePanel.v3958-rel .mr58-node-main{display:grid!important;grid-template-columns:104px minmax(0,1fr)!important;grid-column:1/3!important}
 #universePanel.v3958-rel .mr58-node-main img,#universePanel.v3958-rel .mr58-node-main .noimg{width:104px!important;height:68px!important;aspect-ratio:auto!important}
 #universePanel.v3958-rel .mr58-node-copy{padding:8px!important}
 #universePanel.v3958-rel .mr58-node-go{grid-column:3!important;grid-row:1!important;min-height:40px!important;margin:0 7px 0 0!important;padding:0 8px!important}
 #universePanel.v3958-rel .mr58-node>.mr58-badges{display:none!important}
 #universePanel.v3958-rel .mr58-node-copy b{min-height:0!important;font-size:9px!important}
}
`;
 document.head.appendChild(s)
}
function feed(){
 try{if(typeof currentFeed==="function")return currentFeed()}catch(_){}
 try{if(window.VSAHome28&&VSAHome28.getFeed)return VSAHome28.getFeed()}catch(_){}
 return{daily:[],taste:[],newer:[],hidden:[]}
}
function pool(){
 var f=feed(),a=[];
 ["daily","taste","newer","hidden"].forEach(function(k){a=a.concat(f[k]||[])});
 try{if(typeof localSearchPool397==="function")a=a.concat(localSearchPool397())}catch(_){}
 var m=new Map();a.forEach(function(s){if(s&&s.contentId&&!m.has(s.contentId))m.set(s.contentId,s)});
 return Array.from(m.values())
}
function shuffle(rows){
 rows=(rows||[]).slice();var x=(seed+1)*1103515245+12345;
 for(var i=rows.length-1;i>0;i--){x=(x*1664525+1013904223)>>>0;var j=x%(i+1),t=rows[i];rows[i]=rows[j];rows[j]=t}
 return rows
}
function rowsFor(m){
 var f=feed(),p=pool(),rows=[];
 if(m==="recommend")rows=(f.daily||[]).slice();
 else if(m==="taste")rows=(f.taste||[]).slice();
 else if(m==="new")rows=(f.newer||[]).slice();
 else if(m==="hidden")rows=(f.hidden||[]).slice();
 else if(m==="popular")rows=p.slice().sort(function(a,b){return (+b.viewCounter||0)-(+a.viewCounter||0)});
 if(!rows.length&&m!=="producer"&&m!=="vocal")rows=shuffle(p);
 return shuffle(rows).slice(0,15)
}
function reason(s,m){
 if(m==="popular")return"현재 후보 중 조회수 상위";
 if(m==="new")return"최근 투고";
 if(m==="hidden")return"낮은 조회수에서 발굴";
 if(m==="taste")return"내 취향 신호 기반";
 return"오늘의 추천"
}
function songCard(s,m){
 return '<article class="v126-card" data-v126-id="'+esc(s.contentId)+'">'+
  '<button type="button" class="v126-thumb" data-v126-open="'+esc(s.contentId)+'">'+(s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" alt="">':'<span class="noimg">♪</span>')+'<span class="play">▶</span></button>'+
  '<div class="v126-copy"><div class="v126-title">'+esc(s.title||s.contentId)+'</div><div class="v126-meta">'+year(s)+' · 조회 '+fmt(s.viewCounter||0)+'</div><div class="v126-reason">'+esc(reason(s,m))+'</div>'+
  '<div class="v126-card-actions"><button type="button" class="primary" data-v126-open="'+esc(s.contentId)+'">곡 보기</button><button type="button" data-v126-dive="'+esc(s.contentId)+'">다이브</button></div></div></article>'
}
function producerRows(){
 try{if(typeof producerNames397==="function")return producerNames397().slice(0,24)}catch(_){}
 return[]
}
function vocalRows(){
 try{
  if(typeof allVoicebanks397==="function"){
   var seen=new Set(),out=[];
   allVoicebanks397().forEach(function(x){var v=String(x&&x.value||"").trim();if(v&&!seen.has(v.toLowerCase())){seen.add(v.toLowerCase());out.push(x)}});
   return out.slice(0,24)
  }
 }catch(_){}
 return[]
}
function entityHtml(m){
 var rows=m==="producer"?producerRows():vocalRows();
 return '<div class="v126-entity-grid">'+rows.map(function(x){
  var name=m==="producer"?String(x):String(x.value||""),meta=m==="producer"?"Producer":String(x.meta||"Vocal");
  return '<button type="button" class="v126-entity" data-v126-search="'+esc(name)+'"><i>'+(m==="producer"?"P":"V")+'</i><span><b>'+esc(name)+'</b><small>'+esc(meta)+' · 검색해서 곡 보기</small></span><em>›</em></button>'
 }).join("")+'</div>'
}
function tabs(){
 return [
  ["recommend","추천"],["taste","내 취향"],["popular","인기"],["new","신곡"],["hidden","숨은 곡"],["producer","P"],["vocal","보컬"]
 ].map(function(x){return'<button type="button" data-v126-mode="'+x[0]+'" class="'+(mode===x[0]?"active":"")+'">'+x[1]+'</button>'}).join("")
}
function renderDiscover(){
 var root=document.getElementById("v126Discover");if(!root)return;
 var box=root.querySelector("#v126DiscoverBody"),rows=rowsFor(mode);
 root.querySelector(".v126-tabs").innerHTML=tabs();
 if(mode==="producer"||mode==="vocal")box.innerHTML=entityHtml(mode);
 else box.innerHTML=rows.length?'<div class="v126-grid">'+rows.map(function(s){return songCard(s,mode)}).join("")+'</div>':'<div class="v126-empty">표시할 곡을 준비하는 중입니다.</div>';
}
function upgradeExplore(){
 var page=document.querySelector('#toolsModal .tool-view[data-tool-view="hub37"]');if(!page)return false;
 page.classList.add("v126-ready");
 if(!document.getElementById("v126Discover")){
  var sec=document.createElement("section");sec.id="v126Discover";sec.className="v126-discover";
  sec.innerHTML='<div class="v126-discover-head"><div><small>VOCADIVE · DISCOVER</small><h3>지금 뭘 들을까요?</h3><p>곡부터 고르고, 필요할 때 P·보컬·빙산·탐정으로 더 깊게 들어갑니다.</p></div><button type="button" data-v126-shuffle>↻ 새로 섞기</button></div><div class="v126-tabs"></div><div id="v126DiscoverBody"></div>';
  var hero=page.querySelector(".v3990-map-hero");if(hero&&hero.nextSibling)page.insertBefore(sec,hero.nextSibling);else page.prepend(sec);
  sec.addEventListener("click",function(e){
   var m=e.target.closest("[data-v126-mode]");if(m){mode=m.dataset.v126Mode;renderDiscover();return}
   if(e.target.closest("[data-v126-shuffle]")){seed++;renderDiscover();return}
   var o=e.target.closest("[data-v126-open]");if(o){try{if(window.VSAOpenSong39)window.VSAOpenSong39(o.dataset.v126Open,true);else if(typeof openSongDetail39==="function")openSongDetail39(o.dataset.v126Open,true)}catch(_){}return}
   var d=e.target.closest("[data-v126-dive]");if(d){
    var id=d.dataset.v126Dive,s=pool().find(function(x){return x&&x.contentId===id});
    try{
     if(s&&typeof openUniversePage37==="function"){openUniversePage37(s,false);return}
     if(window.VSAOpenFeature37)window.VSAOpenFeature37("universe")
    }catch(_){}
    return
   }
   var q=e.target.closest("[data-v126-search]");if(q){try{if(window.VSAGlobalSearch39)window.VSAGlobalSearch39(q.dataset.v126Search)}catch(_){}}
  })
 }
 renderDiscover();
 return true
}
function refreshExploreData(){
 if(busy)return;var r=rowsFor(mode);
 if(r.length>=6||mode==="producer"||mode==="vocal")return;
 busy=true;
 try{
  if(window.VSAHomeStation39123&&VSAHomeStation39123.refresh)Promise.resolve(VSAHomeStation39123.refresh()).finally(function(){busy=false;setTimeout(renderDiscover,50)});
  else if(window.VSAHome28&&VSAHome28.loadFeed)Promise.resolve(VSAHome28.loadFeed(true)).finally(function(){busy=false;setTimeout(renderDiscover,50)});
  else busy=false
 }catch(_){busy=false}
}
function tuneDive(){
 var p=document.getElementById("universePanel");if(!p)return;
 p.classList.add("v126-dive");
 var head=p.querySelector(".v394-universe-title");
 if(head&&!head.dataset.v126){
  head.dataset.v126="1";
  var h=head.querySelector("h2"),desc=head.querySelector("p");
  if(h)h.textContent="다이브";
  if(desc)desc.textContent="중심곡에서 다음 곡을 고르고, 얕은 층에서 심해까지 한 단계씩 이어 듣습니다."
 }
}
function sync(){
 upgradeExplore();refreshExploreData();tuneDive()
}
function boot(){
 addStyle();sync();
 var body=document.querySelector("#toolsModal .tools-body");
 if(body){
  var pending=0;
  obs=new MutationObserver(function(){
   clearTimeout(pending);pending=setTimeout(sync,80)
  });
  obs.observe(body,{childList:true})
 }
 window.addEventListener("vsa:route-change",function(){setTimeout(sync,0)});
 document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(sync,80)})
}
window.VSAExploreDive39126={version:VER,refresh:sync};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();