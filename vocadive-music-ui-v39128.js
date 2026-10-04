/* VocaDive 39.128.0 · unified music cards + YouTube Music style player */
(function(){
"use strict";
var VER="39.129.1",timer=0,lastPlaying="";
function style(){
 if(document.getElementById("v39128MusicUiStyle"))return;
 var s=document.createElement("style");s.id="v39128MusicUiStyle";s.textContent=`
/* ===== Shared music card contract ===== */
:root{
 --m128-bg:#081619;--m128-card:#0c1b1e;--m128-card2:#102226;--m128-line:rgba(165,219,213,.10);
 --m128-text:#eef8f6;--m128-muted:#809995;--m128-accent:#70dbd1
}
:is(.v39-media-card,.v126-card,.v395-saved,.discovery-card,.gem-card){
 border:0!important;background:transparent!important;box-shadow:none!important;transform:none!important
}
:is(.v39-thumb,.v126-thumb,.v395-saved-thumb,.discovery-card>img,.gem-card>img){
 border-radius:12px!important;overflow:hidden!important;background:#101d20!important
}
:is(.v39-thumb,.v126-thumb,.v395-saved-thumb){position:relative}
:is(.v39-media-title,.v126-title,.v395-saved-title,.discovery-title,.gem-title){
 color:var(--m128-text)!important;font-weight:900!important;line-height:1.35!important
}
:is(.v39-media-meta,.v126-meta,.v395-saved-meta,.discovery-meta,.gem-meta){
 color:var(--m128-muted)!important
}
:is(.v39-media-reason,.v126-reason,.discovery-reason,.gem-reason){
 color:#6fa7a1!important
}
:is(.v39-media-card,.v126-card,.v395-saved,.discovery-card,.gem-card).v128-playing :is(.v39-thumb,.v126-thumb,.v395-saved-thumb){
 box-shadow:0 0 0 2px var(--m128-accent)!important
}
:is(.v39-media-card,.v126-card,.v395-saved,.discovery-card,.gem-card).v128-playing :is(.v39-media-title,.v126-title,.v395-saved-title,.discovery-title,.gem-title){
 color:#a7f0e8!important
}
.v128-playing-badge{
 position:absolute;left:7px;bottom:7px;z-index:4;display:inline-flex;align-items:center;gap:4px;min-height:24px;padding:0 7px;
 border-radius:999px;background:rgba(5,20,23,.88);color:#baf5ee;font-size:6.5px;font-weight:950;pointer-events:none
}
.v128-playing-badge:before{content:"●";font-size:7px;color:#75e2d7}
:is(.v39-media-card,.v126-card,.v395-saved) button{touch-action:manipulation}
.v395-saved{border-radius:0!important;overflow:visible!important}
.v395-saved-body{padding:8px 2px 0!important}
.v395-status-chip{margin-top:5px!important;background:#13272b!important}
.v395-saved-actions{margin-top:6px!important}
.v395-saved-actions button{border:0!important;border-radius:999px!important;background:#14262a!important}
.discovery-grid,.v39-media-grid,.v395-saved-row{align-items:start!important}

/* Standard section rhythm */
:is(.v39-shelf-head,.v395-section-head,.v126-discover-head,.discovery-panel .panel-head){
 margin-bottom:9px!important
}
:is(.v39-shelf-head h2,.v395-section-head h3,.v126-discover-head h3,.discovery-panel .panel-head h2){
 letter-spacing:-.04em!important
}

/* ===== Mini player: YouTube Music-like bar ===== */
.v331-mini{
 left:50%!important;right:auto!important;bottom:calc(66px + env(safe-area-inset-bottom))!important;
 transform:translateX(-50%)!important;width:min(980px,calc(100vw - 18px))!important;height:64px!important;
 grid-template-columns:86px minmax(0,1fr) auto auto auto auto auto!important;gap:5px!important;padding:5px 7px!important;
 border:1px solid rgba(176,226,220,.12)!important;border-radius:12px!important;
 background:rgba(10,20,22,.985)!important;box-shadow:0 10px 34px rgba(0,0,0,.42)!important;
 backdrop-filter:none!important;-webkit-backdrop-filter:none!important
}
.v331-mini-stage{width:86px!important;border-radius:8px!important}
.v331-mini-copy b{font-size:9.5px!important;color:#f0f8f7!important}
.v331-mini-copy small{font-size:6.5px!important;color:#809995!important}
.v331-mini button{
 width:34px!important;height:34px!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#dfecea!important
}
.v331-mini button:hover{background:#15272a!important}
.v331-mini #v3937PlayPauseMini{
 width:40px!important;height:40px!important;background:#eff8f6!important;color:#071210!important;font-size:12px!important
}
.v331-mini #v3937PlayPauseMini.playing{background:#eff8f6!important;color:#071210!important}
.v331-mini #v3924VolumeMini{font-size:11px!important}
.v331-mini #v331MiniClose{color:#8ea29f!important}
.v331-mini:after{
 content:"";position:absolute;left:7px;right:7px;bottom:0;height:2px;border-radius:2px;background:rgba(255,255,255,.06);pointer-events:none
}

/* ===== Full player: cleaner music-player shell ===== */
.v331-player{
 padding:14px!important;background:rgba(3,8,10,.94)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important
}
.v331-player-shell{
 width:min(1180px,96vw)!important;max-height:95dvh!important;border:1px solid rgba(178,228,222,.12)!important;
 border-radius:16px!important;background:#081416!important;box-shadow:0 20px 70px rgba(0,0,0,.55)!important
}
.v331-player-head{
 min-height:56px!important;padding:8px 10px!important;border-bottom:1px solid var(--m128-line)!important;background:#0a1719!important
}
.v331-player-head small{font-size:6.5px!important;color:#76b8b1!important;letter-spacing:.08em!important}
.v331-player-head b{font-size:12px!important}
.v331-player-head button{
 width:36px!important;height:36px!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#dce9e7!important
}
.v331-player-head button:hover{background:#142629!important}
.v331-player-stage{min-height:260px!important}
.v331-player-foot{
 grid-template-columns:minmax(0,1fr) minmax(180px,300px) auto auto!important;gap:7px!important;padding:8px 10px!important;
 border-top:1px solid var(--m128-line)!important;background:#0a1719!important
}
.v331-player-foot>span{font-size:7px!important;color:#78928e!important}
.v331-player-foot a,.v3984-autonext{
 min-height:32px!important;border:0!important;border-radius:999px!important;background:#14272a!important;color:#b7ccca!important
}
.v331-player-foot .v3926-volume-strip{gap:6px!important}
.v3926-volume-popover{
 border:1px solid rgba(176,225,219,.12)!important;border-radius:12px!important;background:#0b191b!important;backdrop-filter:none!important
}

/* Watch detail matches full player hierarchy */
.v399-watch-info.v3920-info{padding-top:11px!important}
.v399-watch-actions.v3920-actions button,.v399-watch-actions.v3920-actions a{
 border:0!important;background:#14272a!important
}
.v399-watch-actions.v3920-actions .primary{background:#eff8f6!important;color:#071210!important}
.v399-watch-stat,.v3920-credit{background:#0d1a1d!important;border-color:var(--m128-line)!important}
.v399-side.v3920-side{background:#0b1719!important;border-color:var(--m128-line)!important}

/* Avoid mini player covering app navigation. */
body.v125-touhou-shell .v331-mini{z-index:31990!important}
@media(min-width:900px) and (max-width:1366px) and (orientation:landscape){
 body.v125-touhou-shell .v331-mini{left:calc(50% + 43px)!important;width:min(930px,calc(100vw - 112px))!important;bottom:10px!important}
}
@media(max-width:899px){
 .v331-player{padding:0!important}
 .v331-player-shell{width:100vw!important;max-height:100dvh!important;height:100dvh!important;border-radius:0!important;border:0!important}
 .v331-player-head{padding-top:calc(8px + env(safe-area-inset-top))!important}
 .v331-player-stage{min-height:0!important}
 .v331-player-foot{grid-template-columns:1fr auto!important;padding-bottom:calc(8px + env(safe-area-inset-bottom))!important}
 .v331-player-foot .v3926-volume-strip{grid-column:1/-1!important}
 .v331-player-foot>span{display:none!important}
 .v331-mini{width:calc(100vw - 12px)!important;height:60px!important;grid-template-columns:72px minmax(0,1fr) auto auto auto!important;padding:5px!important}
 .v331-mini-stage{width:72px!important}
 .v331-mini #v332PrevMini,.v331-mini #v3924VolumeMini,.v331-mini #v3921PipMini{display:none!important}
 .v331-mini #v332NextMini{display:block!important}
 .v331-mini #v331Expand{display:block!important}
}
@media(max-width:480px){
 .v331-mini{bottom:calc(58px + env(safe-area-inset-bottom))!important;border-radius:10px!important}
 .v331-mini-copy b{font-size:8.5px!important}
 .v331-mini-copy small{font-size:6px!important}
 .v331-mini #v331MiniClose{display:none!important}
 .v331-mini #v331Expand{display:none!important}
 .v331-mini{grid-template-columns:68px minmax(0,1fr) auto auto!important}
 .v331-mini-stage{width:68px!important}
}

/* Tablet portrait cards use one consistent horizontal rail. */
@media(min-width:700px) and (max-width:1050px) and (orientation:portrait){
 #v37Home .v39-media-grid,.v395-personal .v39-media-grid,.v395-saved-row,.v126-grid{
  display:flex!important;grid-template-columns:none!important;gap:12px!important;overflow-x:auto!important;scroll-snap-type:x proximity!important;scrollbar-width:none!important;padding-bottom:8px!important
 }
 #v37Home .v39-media-grid::-webkit-scrollbar,.v395-personal .v39-media-grid::-webkit-scrollbar,.v395-saved-row::-webkit-scrollbar,.v126-grid::-webkit-scrollbar{display:none}
 #v37Home .v39-media-card,.v395-personal .v39-media-card,.v395-saved,.v126-card{flex:0 0 clamp(220px,37vw,285px)!important;scroll-snap-align:start!important}
}
`;
 document.head.appendChild(s)
}
function cardId(card){
 if(!card)return"";
 var b=card.querySelector("[data-v39-song],[data-v126-open],[data-v395-open-song],[data-v399-play],[data-content-id]");
 if(b){
  return b.dataset.v39Song||b.dataset.v126Open||b.dataset.v395OpenSong||b.dataset.v399Play||b.dataset.contentId||""
 }
 return card.dataset.contentId||card.dataset.v126Id||""
}
function mark(force){
 var id="";
 try{id=window.VSANicoPlayer&&VSANicoPlayer.state?String(VSANicoPlayer.state().currentId||""):""}catch(_){}
 if(!force&&id===lastPlaying)return;
 lastPlaying=id;
 document.querySelectorAll(".v128-playing").forEach(function(x){x.classList.remove("v128-playing")});
 document.querySelectorAll(".v128-playing-badge").forEach(function(x){x.remove()});
 if(!id)return;
 document.querySelectorAll(".v39-media-card,.v126-card,.v395-saved,.discovery-card,.gem-card,.song,.mr58-node").forEach(function(card){
  var cid=cardId(card);
  if(cid!==id)return;
  card.classList.add("v128-playing");
  var thumb=card.querySelector(".v39-thumb,.v126-thumb,.v395-saved-thumb,.thumb,.mr58-node-main");
  if(thumb&&getComputedStyle(thumb).position==="static")thumb.style.position="relative";
  if(thumb&&!thumb.querySelector(".v128-playing-badge")){
   var b=document.createElement("span");b.className="v128-playing-badge";b.textContent="재생 중";thumb.appendChild(b)
  }
 })
}
function normalizeButtons(){
 document.querySelectorAll(".v395-saved-actions,.v126-card-actions").forEach(function(row){
  row.querySelectorAll("button").forEach(function(b){
   if(/상세|곡 보기/.test(b.textContent||""))b.classList.add("v128-primary-action")
  })
 })
}
function sync(){normalizeButtons();mark(true)}
function boot(){
 style();sync();
 timer=setInterval(function(){mark(false)},1800);
 window.addEventListener("vsa:route-change",function(){setTimeout(sync,40)});
 window.addEventListener("pageshow",function(){setTimeout(sync,80)});
 document.addEventListener("click",function(e){
  if(e.target&&e.target.closest&&e.target.closest("[data-v39-song],[data-v126-open],[data-v395-open-song],.v22-song-card,.mr58-node"))setTimeout(function(){mark(true)},120)
 },{passive:true})
}
window.VSAMusicUi39128={version:VER,refresh:sync};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();