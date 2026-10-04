/* VocaDive 39.125.0 · TouhouDive-first information architecture + YouTube Music shell */
(function(){
"use strict";
var VER="39.129.1",muting=false,observer=null,resizeTimer=0;
function addStyle(){
  if(document.getElementById("v39125TouhouStyle"))return;
  var s=document.createElement("style");s.id="v39125TouhouStyle";s.textContent=`
:root{
 --v125-gap:12px;
 --v125-card:#0d191c;
 --v125-card2:#112125;
 --v125-line:rgba(176,222,217,.11);
 --v125-text:#eef8f6;
 --v125-muted:#8da3a0;
 --v125-accent:#68ddd2;
}
body.v125-touhou-shell #v3980Dock{grid-template-columns:repeat(5,minmax(0,1fr))!important}
body.v125-touhou-shell #v3980Dock button{min-height:56px!important}
body.v125-touhou-shell #v3980Dock button span{font-size:8px!important}
body.v125-touhou-shell #v3980Dock button i{font-size:17px!important}
body.v125-touhou-shell #v37Home.v125-home{max-width:1360px!important;margin-inline:auto!important}
body.v125-touhou-shell #v37Home.v125-home>.v3989-home-meta{order:-20}
body.v125-touhou-shell #v37Home .v396-hero{
 margin-top:4px!important;margin-bottom:18px!important;border:1px solid var(--v125-line)!important;
 background:linear-gradient(135deg,#0a2228,#0b171e 62%,#11182a)!important;
 box-shadow:none!important
}
body.v125-touhou-shell #v37Home .v396-hero-copy{display:flex!important;flex-direction:column!important;justify-content:center!important}
body.v125-touhou-shell #v37Home .v396-hero-kicker{color:var(--v125-accent)!important;font-size:8px!important;font-weight:950!important;letter-spacing:.08em!important}
body.v125-touhou-shell #v37Home .v396-hero-copy h2{letter-spacing:-.045em!important;line-height:1.1!important}
body.v125-touhou-shell #v37Home .v396-hero-copy p{max-width:62ch!important;color:var(--v125-muted)!important}
body.v125-touhou-shell #v37Home .v396-hero-actions{margin-top:12px!important}
body.v125-touhou-shell #v37Home .v396-hero-actions button{border-radius:999px!important}
body.v125-touhou-shell #v37Home .v396-hero-actions button.primary{background:#edf9f7!important;color:#071210!important}
body.v125-touhou-shell #v37Home .v39-shelf{
 border:0!important;background:transparent!important;padding:0!important;margin:0 0 24px!important
}
body.v125-touhou-shell #v37Home .v39-shelf-head{padding:0 2px 9px!important}
body.v125-touhou-shell #v37Home .v39-shelf-head h2{letter-spacing:-.035em!important}
body.v125-touhou-shell #v37Home .v39-shelf-head p{color:var(--v125-muted)!important}
body.v125-touhou-shell #v37Home .v39-shelf-head button{
 border:0!important;border-radius:999px!important;background:#152326!important;color:#c4d5d2!important
}
body.v125-touhou-shell #v37Home .v39-media-card{
 border:0!important;background:transparent!important;box-shadow:none!important
}
body.v125-touhou-shell #v37Home .v39-thumb{border-radius:12px!important;overflow:hidden!important;background:#101d20!important}
body.v125-touhou-shell #v37Home .v39-media-copy{padding:8px 2px 2px!important}
body.v125-touhou-shell #v37Home .v39-media-title{color:var(--v125-text)!important;font-weight:850!important}
body.v125-touhou-shell #v37Home .v39-media-meta{color:var(--v125-muted)!important}
body.v125-touhou-shell #v37Home .v39-media-reason{color:#72aaa4!important}
body.v125-touhou-shell #v37Home .v39-more{
 border:0!important;background:rgba(6,16,19,.82)!important;color:#d9e9e7!important;border-radius:50%!important
}

/* Deep tools move below music content and read as a compact secondary layer. */
body.v125-touhou-shell #v37Home .v3989-dive-entry{
 min-height:0!important;margin:2px 0 14px!important;padding:16px 18px!important;
 grid-template-columns:minmax(0,1fr) minmax(280px,.7fr)!important;
 border:1px solid var(--v125-line)!important;border-radius:18px!important;
 background:linear-gradient(135deg,#0d2025,#0b171b)!important
}
body.v125-touhou-shell #v37Home .v3989-dive-entry-copy h1{font-size:22px!important;line-height:1.1!important}
body.v125-touhou-shell #v37Home .v3989-dive-entry-copy p{font-size:9px!important;color:var(--v125-muted)!important}
body.v125-touhou-shell #v37Home .v3989-dive-flags{margin-top:8px!important}
body.v125-touhou-shell #v37Home .v3989-dive-flags span{font-size:7px!important}
body.v125-touhou-shell #v37Home .v3989-dive-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important;align-content:center!important}
body.v125-touhou-shell #v37Home .v3989-dive-actions button{min-height:48px!important;border-radius:12px!important}
body.v125-touhou-shell #v37Home .v3989-gateway-head{margin:16px 2px 8px!important}
body.v125-touhou-shell #v37Home .v3989-gateway-head h2{font-size:18px!important}
body.v125-touhou-shell #v37Home .v3989-gateway-head p{font-size:8px!important;color:var(--v125-muted)!important}
body.v125-touhou-shell #v37Home .v3989-gateway-row{gap:6px!important;padding-bottom:6px!important}
body.v125-touhou-shell #v37Home .v3989-gateway-row button{
 min-width:112px!important;min-height:40px!important;border-radius:999px!important;background:#152326!important
}
body.v125-touhou-shell #v37Home .v396-continue{
 margin-top:4px!important;border:1px solid var(--v125-line)!important;border-radius:18px!important;background:#0b171a!important
}

/* Explore becomes a clean tool map instead of another home page. */
body.v125-touhou-shell .v393-native-explore .v37-hub-card,
body.v125-touhou-shell .v3990-zone .v3919-intent{
 border:1px solid var(--v125-line)!important;background:#0e1b1e!important;box-shadow:none!important
}
body.v125-touhou-shell .v393-native-explore .v37-hub-copy small,
body.v125-touhou-shell .v3990-zone .v3919-intent small{color:var(--v125-muted)!important}
body.v125-touhou-shell .v3990-zone-grid{gap:9px!important}

/* Search results: music-first, technical explanation second. */
body.v125-touhou-shell .v398-search-page .v397-search-hero{padding-bottom:10px!important}
body.v125-touhou-shell .v398-search-page .v397-search-hero p{max-width:62ch!important}
body.v125-touhou-shell .v398-search-page #songList .song{
 border-bottom:1px solid var(--v125-line)!important;border-radius:0!important;background:transparent!important
}
body.v125-touhou-shell .v398-search-page #songList .song:hover{background:#101d20!important}
body.v125-touhou-shell .v398-search-page #songList .rank-note{display:none!important}
body.v125-touhou-shell .v398-search-page #songList .rankbox{opacity:.82!important}
body.v125-touhou-shell .v398-search-page #songList .song-actions .mini-btn:nth-child(n+2){display:none!important}
body.v125-touhou-shell .v398-search-page #songList .song-title{font-weight:900!important}
body.v125-touhou-shell .v398-search-page #songList .meta{color:var(--v125-muted)!important}

/* Watch page: YouTube Music/TouhouDive style hierarchy. */
body.v125-touhou-shell .tools-modal[data-current-view="songDetail39"] .tools-body{max-width:1380px!important;margin-inline:auto!important}
body.v125-touhou-shell .v399-watch-layout.v3920-watch{
 display:grid!important;grid-template-columns:minmax(0,1.72fr) minmax(300px,.68fr)!important;
 gap:18px!important;align-items:start!important
}
body.v125-touhou-shell .v399-watch-main{min-width:0!important}
body.v125-touhou-shell .v399-player-shell{
 border-radius:16px!important;overflow:hidden!important;background:#000!important;box-shadow:none!important
}
body.v125-touhou-shell .v399-player-shell iframe{width:100%!important;aspect-ratio:16/9!important;min-height:0!important;display:block!important}
body.v125-touhou-shell .v399-watch-info.v3920-info{padding:14px 2px 4px!important}
body.v125-touhou-shell .v399-watch-info h2{font-size:clamp(22px,3vw,34px)!important;line-height:1.15!important;letter-spacing:-.045em!important;margin:8px 0!important}
body.v125-touhou-shell .v399-watch-kicker{gap:6px!important}
body.v125-touhou-shell .v399-watch-kicker span{border-radius:999px!important}
body.v125-touhou-shell .v399-watch-meta{color:var(--v125-muted)!important}
body.v125-touhou-shell .v3920-credit-strip{
 display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:12px!important
}
body.v125-touhou-shell .v3920-credit{
 border:1px solid var(--v125-line)!important;border-radius:12px!important;background:#0e191c!important;padding:9px!important
}
body.v125-touhou-shell .v3920-actions{
 display:flex!important;gap:7px!important;flex-wrap:wrap!important;margin-top:12px!important
}
body.v125-touhou-shell .v3920-actions>button,
body.v125-touhou-shell .v3920-actions>a{
 min-height:40px!important;border-radius:999px!important;padding-inline:14px!important
}
body.v125-touhou-shell .v3920-actions .primary{background:#edf9f7!important;color:#071210!important}
body.v125-touhou-shell .v3920-actions .quiet{display:none!important}
body.v125-touhou-shell .v3920-stats{
 display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin-top:12px!important
}
body.v125-touhou-shell .v399-watch-stat{
 border:0!important;border-radius:10px!important;background:#101d20!important;padding:9px!important
}
body.v125-touhou-shell .v399-watch-stat small{color:var(--v125-muted)!important}
body.v125-touhou-shell .v399-side.v3920-side{
 position:sticky!important;top:70px!important;max-height:calc(100dvh - 88px)!important;overflow:auto!important;
 border:1px solid var(--v125-line)!important;border-radius:16px!important;background:#0b171a!important;padding:10px!important
}
body.v125-touhou-shell .v399-side-head{padding:4px 4px 9px!important}
body.v125-touhou-shell .v399-side-head h3{font-size:17px!important}
body.v125-touhou-shell .v399-side-head small{color:var(--v125-muted)!important}
body.v125-touhou-shell .v399-related-list{display:grid!important;gap:4px!important}
body.v125-touhou-shell .v3920-below{max-width:calc(100% - 340px)!important;margin-top:8px!important}
body.v125-touhou-shell .v3920-fold{
 border:1px solid var(--v125-line)!important;border-radius:14px!important;background:#0b171a!important
}

/* Tablet landscape = TouhouDive/YouTube Music rail; portrait = bottom dock. */
@media (min-width:900px) and (max-width:1366px) and (orientation:landscape){
 body.v125-touhou-shell>.app{padding-left:86px!important}
 body.v125-touhou-shell #v3980Dock{
   left:10px!important;right:auto!important;top:76px!important;bottom:auto!important;width:68px!important;min-height:0!important;
   grid-template-columns:1fr!important;grid-template-rows:repeat(5,60px)!important;padding:5px!important;border-radius:18px!important
 }
 body.v125-touhou-shell #v3980Dock button{min-height:60px!important;padding:0 2px!important}
 body.v125-touhou-shell #v3980Dock button span{font-size:7px!important}
 body.v125-touhou-shell #v3980Dock button i{font-size:18px!important}
 body.v125-touhou-shell #v37Home{padding-bottom:40px!important}
 body.v125-touhou-shell .tools-modal{padding-left:0!important}
 body.v125-touhou-shell .v39-mini-player{left:94px!important}
}
@media (min-width:700px) and (max-width:1050px) and (orientation:portrait){
 body.v125-touhou-shell #v3980Dock{grid-template-columns:repeat(5,minmax(0,1fr))!important}
 body.v125-touhou-shell #v37Home .v396-hero{grid-template-columns:1fr!important}
 body.v125-touhou-shell #v37Home .v3989-dive-entry{grid-template-columns:1fr!important}
 body.v125-touhou-shell #v37Home .v3989-dive-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important}
 body.v125-touhou-shell .v399-watch-layout.v3920-watch{grid-template-columns:1fr!important}
 body.v125-touhou-shell .v399-side.v3920-side{position:static!important;max-height:none!important}
 body.v125-touhou-shell .v3920-below{max-width:none!important}
}
@media (max-width:699px){
 body.v125-touhou-shell #v3980Dock{grid-template-columns:repeat(5,minmax(0,1fr))!important;left:7px!important;right:7px!important}
 body.v125-touhou-shell #v3980Dock button{min-height:52px!important}
 body.v125-touhou-shell #v3980Dock button span{font-size:7px!important}
 body.v125-touhou-shell #v37Home .v396-hero{grid-template-columns:1fr!important}
 body.v125-touhou-shell #v37Home .v396-hero-media{min-height:210px!important}
 body.v125-touhou-shell #v37Home .v396-hero-copy{padding:13px 4px 5px!important}
 body.v125-touhou-shell #v37Home .v3989-dive-entry{grid-template-columns:1fr!important;padding:14px!important}
 body.v125-touhou-shell #v37Home .v3989-dive-actions{grid-template-columns:1fr!important}
 body.v125-touhou-shell #v37Home .v3989-gateway-head{align-items:start!important;flex-direction:column!important}
 body.v125-touhou-shell .v399-watch-layout.v3920-watch{grid-template-columns:1fr!important;gap:10px!important}
 body.v125-touhou-shell .v399-side.v3920-side{position:static!important;max-height:none!important;border-radius:12px!important}
 body.v125-touhou-shell .v3920-credit-strip{grid-template-columns:1fr!important}
 body.v125-touhou-shell .v3920-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 body.v125-touhou-shell .v3920-actions>a{display:none!important}
 body.v125-touhou-shell .v3920-below{max-width:none!important}
}
`;
  document.head.appendChild(s)
}
function moveAfter(node,anchor){
  if(!node||!anchor||node===anchor||anchor.nextSibling===node)return node;
  anchor.parentNode.insertBefore(node,anchor.nextSibling);return node
}
function reorderHome(){
  if(muting)return;
  var root=document.getElementById("v37Home");if(!root)return;
  root.classList.add("v125-home");
  var bar=document.getElementById("v39123Bar"),meta=root.querySelector(".v3989-home-meta"),hero=root.querySelector(".v396-hero");
  var shelves=[].slice.call(root.querySelectorAll(".v39-shelf"));
  var dive=root.querySelector(".v3989-dive-entry"),ghead=root.querySelector(".v3989-gateway-head"),grow=root.querySelector(".v3989-gateway-row"),cont=root.querySelector(".v396-continue");
  muting=true;
  try{
    var anchor=bar||meta;
    if(hero&&anchor){moveAfter(hero,anchor);anchor=hero}
    shelves.forEach(function(x){if(anchor){moveAfter(x,anchor);anchor=x}});
    if(dive&&anchor){moveAfter(dive,anchor);anchor=dive}
    if(ghead&&anchor){moveAfter(ghead,anchor);anchor=ghead}
    if(grow&&anchor){moveAfter(grow,anchor);anchor=grow}
    if(cont&&anchor){moveAfter(cont,anchor)}
  }finally{muting=false}
}
function simplifySearch(){
  var rows=document.querySelectorAll(".v398-search-page #songList .song");
  rows.forEach(function(row,i){row.classList.toggle("v125-best-match",i===0)})
}
function sync(){
  document.body.classList.add("v125-touhou-shell");
  reorderHome();simplifySearch()
}
function watch(){
  var roots=[document.getElementById("v37Home"),document.getElementById("toolsModal")].filter(Boolean);
  if(!roots.length)return false;
  if(observer)observer.disconnect();
  observer=new MutationObserver(function(){
    if(muting)return;
    requestAnimationFrame(sync)
  });
  roots.forEach(function(r){observer.observe(r,{childList:true})});
  return true
}
function boot(){
  addStyle();sync();
  if(!watch()){var tries=0,t=setInterval(function(){sync();if(watch()||++tries>50)clearInterval(t)},100)}
  window.addEventListener("resize",function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(sync,90)},{passive:true});
  window.addEventListener("orientationchange",function(){setTimeout(sync,150)},{passive:true});
  window.addEventListener("vsa:route-change",function(){setTimeout(sync,0)})
}
window.VSATouhouShell39125={version:VER,refresh:sync};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();