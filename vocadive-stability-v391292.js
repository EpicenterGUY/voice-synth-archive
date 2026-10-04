/* VocaDive 39.129.2 · landscape stability + tap reliability hotfix */
(function(){
"use strict";
var VER="39.129.2",resizeTimer=0,lastRoute="";
function style(){
 if(document.getElementById("v391292LandscapeFix"))return;
 var s=document.createElement("style");s.id="v391292LandscapeFix";s.textContent=`
/* Stale/invisible layers must never eat taps. */
[hidden]{pointer-events:none!important}
#v398FilterBackdrop:not(.open),
#toolsBackdrop:not(.open),
.v22-compare-modal:not(.open),
.v398-more-menu:not(.open),
#v3982Menu[hidden],
.v331-player[hidden],
.v331-mini[hidden]{pointer-events:none!important}
#v398FilterSheet.open,#v398FilterBackdrop.open,#toolsModal:not([hidden]),#v3982Menu:not([hidden]){pointer-events:auto!important}
body.v37-ready button:not([disabled]),body.v37-ready a,body.v37-ready select,body.v37-ready input{
 touch-action:manipulation
}

/* Landscape: prefer a stable bottom dock over the experimental left rail.
   This also removes the wide invisible rail hit-area on Fold/tablet landscape. */
@media (orientation:landscape) and (max-height:900px) and (max-width:1500px){
 body.v125-touhou-shell>.app{padding-left:0!important}
 body.v125-touhou-shell #v3980Dock{
  position:fixed!important;left:10px!important;right:10px!important;top:auto!important;
  bottom:max(6px,env(safe-area-inset-bottom))!important;width:auto!important;min-height:58px!important;
  display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;grid-template-rows:1fr!important;
  padding:4px!important;border-radius:16px!important;transform:none!important
 }
 body.v125-touhou-shell #v3980Dock button{
  min-height:50px!important;padding:2px 4px!important;display:flex!important;flex-direction:column!important;
  align-items:center!important;justify-content:center!important;gap:2px!important
 }
 body.v125-touhou-shell #v3980Dock button i{font-size:16px!important}
 body.v125-touhou-shell #v3980Dock button span{font-size:7px!important}
 body.v125-touhou-shell #v37Home,
 body.v125-touhou-shell .tools-body>.tool-view.active{
  padding-bottom:82px!important
 }
 body.v125-touhou-shell .v331-mini{
  left:10px!important;right:10px!important;width:auto!important;bottom:70px!important;transform:none!important
 }
 body.v125-touhou-shell>.app>.topbar,
 body.v125-touhou-shell #v3980Dock,
 body.v125-touhou-shell .v331-mini,
 body.v125-touhou-shell #v39123Bar{
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important
 }
 #v37Home.v39123 .v39-media-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
 #v37Home.v39123 .v396-hero{grid-template-columns:minmax(280px,.8fr) minmax(0,1.2fr)!important}
 #v37Home.v39123 .v396-hero-media{min-height:190px!important;max-height:260px!important}
 #v37Home.v39123 .v3989-dive-entry{grid-template-columns:minmax(0,1fr) minmax(270px,.65fr)!important;padding:16px!important}
 .v398-search-page #songList{display:block!important}
 .v398-search-page #songList .song{
  display:grid!important;grid-template-columns:42px 112px minmax(0,1fr) auto!important;
  width:100%!important;min-height:82px!important;margin:0!important;padding:8px!important
 }
 .v398-search-page #songList .views{display:block!important}
 .v398-search-page #songList .song-actions{max-width:180px!important}
 .v398-filter-sheet.open{
  left:50%!important;right:auto!important;bottom:72px!important;width:min(720px,calc(100vw - 24px))!important;
  max-height:calc(100dvh - 92px)!important;transform:translateX(-50%)!important
 }
}

/* Very short landscape phones/Fold: simplify aggressively. */
@media (orientation:landscape) and (max-height:620px){
 body.v37-ready>.app>.topbar{padding:5px 8px!important;min-height:48px!important}
 body.v37-ready .topbar .brand .sub,
 #v3982WorkerPill{display:none!important}
 #v3980SearchForm{height:36px!important}
 #v37Home.v39123 .v3989-dive-entry{grid-template-columns:1fr!important}
 #v37Home.v39123 .v3989-dive-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important}
 #v37Home.v39123 .v39-media-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
 #v37Home.v39123 .v39-media-card:nth-child(n+7){display:none!important}
}

/* Reduce expensive compositing in interaction-heavy surfaces. */
.v398-filter-backdrop.open{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.v331-player,.v3926-volume-popover,.v22-compare-backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
`;
 document.head.appendChild(s)
}
function cleanup(){
 var sheet=document.getElementById("v398FilterSheet"),bd=document.getElementById("v398FilterBackdrop");
 if(bd&&(!sheet||!sheet.classList.contains("open")))bd.classList.remove("open");
 var more=document.getElementById("v398MoreMenu"),shell=document.getElementById("v397SearchShell");
 if(more&&shell&&!shell.classList.contains("more-open"))more.style.pointerEvents="none";
 else if(more)more.style.removeProperty("pointer-events");
 var modal=document.getElementById("toolsModal"),back=document.getElementById("toolsBackdrop");
 if(back&&(!modal||modal.hidden))back.classList.remove("open");
 document.body.classList.toggle("v1292-landscape",innerWidth>innerHeight)
}
function repairTap(e){
 var t=e.target&&e.target.closest&&e.target.closest("button,a,select,input,label,[role=button]");
 if(!t)return;
 if(t.matches("button")&&!t.disabled&&t.getAttribute("aria-busy")!=="true")t.style.pointerEvents="auto";
}
function boot(){
 style();cleanup();
 document.addEventListener("pointerdown",repairTap,true);
 window.addEventListener("resize",function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(cleanup,100)},{passive:true});
 window.addEventListener("orientationchange",function(){setTimeout(cleanup,140)},{passive:true});
 window.addEventListener("vsa:route-change",function(e){lastRoute=String(e&&e.detail&&e.detail.route||"");setTimeout(cleanup,40)});
 document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(cleanup,80)})
}
window.VSALandscape391292={version:VER,refresh:cleanup};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();