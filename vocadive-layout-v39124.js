/* VocaDive 39.124.0 · tablet portrait/landscape + YouTube Music inspired responsive polish */
(function(){
"use strict";
var VER="39.129.1";
function style(){
  if(document.getElementById("v39124LayoutStyle"))return;
  var s=document.createElement("style");s.id="v39124LayoutStyle";s.textContent=`
/* Shared polish */
:root{--v124-touch:42px}
body.v124-tablet{--v124-touch:44px}
body.v124-tablet button,body.v124-tablet input,body.v124-tablet select{touch-action:manipulation}
body.v124-tablet .app{max-width:none!important}
body.v124-tablet #v37Home{padding-inline:clamp(10px,2vw,24px)!important}
body.v124-tablet #v37Home .v3989-home-meta{margin:6px 2px 9px!important}
body.v124-tablet #v37Home .v3989-home-meta small{font-size:9px!important}
body.v124-tablet #v37Home .v3989-home-meta button{min-height:34px!important;font-size:9px!important}
body.v124-tablet #v39123Bar{top:6px!important;margin-bottom:14px!important}
body.v124-tablet #v39123Bar form{height:46px!important}
body.v124-tablet #v39123Bar form input{height:44px!important;font-size:12px!important}
body.v124-tablet #v39123Bar .acts button{height:44px!important;font-size:10px!important;padding-inline:14px!important}
body.v124-tablet #v39123Bar .tabs23 button{min-height:32px!important;font-size:9px!important;padding-inline:11px!important}
body.v124-tablet #v39123Status{font-size:8px!important}
body.v124-tablet #v37Home .v3989-dive-entry-copy small,
body.v124-tablet #v37Home .v3989-gateway-head small{font-size:8px!important}
body.v124-tablet #v37Home .v3989-dive-entry-copy p,
body.v124-tablet #v37Home .v3989-gateway-head p{font-size:10px!important;line-height:1.6!important}
body.v124-tablet #v37Home .v3989-dive-flags span{font-size:8px!important}
body.v124-tablet #v37Home .v3989-dive-actions button{min-height:58px!important}
body.v124-tablet #v37Home .v3989-dive-actions button span{font-size:9px!important}
body.v124-tablet #v37Home .v3989-dive-actions button b{font-size:11px!important}
body.v124-tablet #v37Home .v3989-gateway-head{margin:18px 2px 8px!important;align-items:end!important}
body.v124-tablet #v37Home .v3989-gateway-head h2{font-size:20px!important}
body.v124-tablet #v37Home .v3989-gateway-head>button{min-height:36px!important}
body.v124-tablet #v37Home .v3989-gateway-row{padding-bottom:4px!important;scroll-snap-type:x proximity}
body.v124-tablet #v37Home .v3989-gateway-row button{min-width:126px!important;min-height:46px!important;font-size:9.5px!important;scroll-snap-align:start}
body.v124-tablet #v37Home .v396-hero{box-shadow:none!important}
body.v124-tablet #v37Home .v396-hero-copy p{font-size:10px!important;line-height:1.6!important}
body.v124-tablet #v37Home .v396-hero-meta span,
body.v124-tablet #v37Home .v396-hero-tags span{font-size:8px!important}
body.v124-tablet #v37Home .v396-hero-actions button{min-height:42px!important;font-size:9px!important}
body.v124-tablet #v37Home .v396-continue{border-radius:18px!important}
body.v124-tablet #v37Home .v396-continue-head h2{font-size:18px!important}
body.v124-tablet #v37Home .v396-continue-head p{font-size:9px!important;line-height:1.5!important}
body.v124-tablet #v37Home .v39-shelf{scroll-margin-top:104px}
body.v124-tablet #v37Home .v39-shelf-head{align-items:end!important}
body.v124-tablet #v37Home .v39-shelf-head h2{font-size:19px!important}
body.v124-tablet #v37Home .v39-shelf-head p{font-size:9px!important;line-height:1.4!important}
body.v124-tablet #v37Home .v39-shelf-head button{min-height:34px!important;font-size:8.5px!important}
body.v124-tablet #v37Home .v39-media-title{font-size:12px!important;line-height:1.35!important;min-height:33px!important}
body.v124-tablet #v37Home .v39-media-meta{font-size:9px!important}
body.v124-tablet #v37Home .v39-media-reason{font-size:8px!important;min-height:16px}
body.v124-tablet #v37Home .v39-more{width:32px!important;height:32px!important}
body.v124-tablet #v37Home .v396-priority-note{font-size:7px!important}
body.v124-tablet .v39-media-card:focus-visible,
body.v124-tablet button:focus-visible,
body.v124-tablet input:focus-visible{outline:2px solid rgba(113,224,213,.8)!important;outline-offset:2px}

/* Search: YouTube Music-like top result/list hierarchy */
.v398-search-page #songList .song.v124-top-hit{position:relative;border-color:rgba(111,222,211,.26)!important;background:linear-gradient(110deg,rgba(12,53,61,.96),rgba(9,30,40,.96))!important}
.v398-search-page #songList .song.v124-top-hit:before{content:"가장 유사";position:absolute;left:8px;top:7px;z-index:2;padding:3px 6px;border-radius:999px;background:rgba(99,222,210,.16);color:#bffaf4;font-size:7px;font-weight:950;letter-spacing:.04em}
.v398-search-page #songList .song.v124-top-hit .rank{padding-top:15px}
.v398-search-page #songList .song{transition:background .15s,border-color .15s}
body.v124-tablet .v398-search-page .v398-main-row{grid-template-columns:minmax(0,1fr) auto auto!important;gap:8px!important}
body.v124-tablet .v398-search-page .v398-main-input-wrap input{min-height:48px!important;font-size:12px!important}
body.v124-tablet .v398-search-page .v398-main-row>button{min-height:48px!important}
body.v124-tablet .v398-search-page .v398-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
body.v124-tablet .v398-search-page #songList .song{grid-template-columns:50px 112px minmax(0,1fr) auto!important;gap:12px!important;padding:10px!important;border-radius:14px!important}
body.v124-tablet .v398-search-page #songList .thumb{width:112px!important;border-radius:10px!important}
body.v124-tablet .v398-search-page #songList .song-title{font-size:12px!important}
body.v124-tablet .v398-search-page #songList .meta{font-size:8.5px!important}
body.v124-tablet .v398-search-page #songList .mini-btn{min-height:32px!important;font-size:8px!important}
body.v124-tablet .v398-search-page #songList .views{font-size:12px!important}

/* tablet portrait: YouTube Music mobile-tablet hybrid, horizontal recommendation shelves */
@media (min-width:700px) and (max-width:1050px) and (orientation:portrait){
 body.v124-tablet #v39123Bar{grid-template-columns:minmax(0,1fr) auto!important}
 body.v124-tablet #v39123Bar .brand23{display:none!important}
 body.v124-tablet #v39123Bar form{grid-column:1/2!important}
 body.v124-tablet #v39123Bar .tabs23{grid-column:1/-1!important}
 body.v124-tablet #v37Home .v3989-dive-entry{grid-template-columns:1fr!important;padding:20px!important}
 body.v124-tablet #v37Home .v3989-dive-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important}
 body.v124-tablet #v37Home .v396-hero{grid-template-columns:1fr!important}
 body.v124-tablet #v37Home .v396-hero-media{min-height:260px!important;max-height:320px!important}
 body.v124-tablet #v37Home .v396-hero-copy{padding:15px 10px 10px!important}
 body.v124-tablet #v37Home .v39-media-grid{
   display:flex!important;grid-template-columns:none!important;gap:12px!important;overflow-x:auto!important;
   overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;scroll-padding-inline:2px;padding:2px 2px 9px!important;
   scrollbar-width:none!important
 }
 body.v124-tablet #v37Home .v39-media-grid::-webkit-scrollbar{display:none}
 body.v124-tablet #v37Home .v39-media-card{flex:0 0 clamp(220px,38vw,280px)!important;scroll-snap-align:start!important}
 body.v124-tablet #v37Home .v39-thumb{aspect-ratio:16/9!important}
 body.v124-tablet #v37Home .v396-continue .v39-media-card{flex-basis:245px!important}
 body.v124-tablet .v398-search-page #songList .song{grid-template-columns:42px 104px minmax(0,1fr)!important}
 body.v124-tablet .v398-search-page #songList .views{display:none!important}
 body.v124-tablet .v398-search-page #songList .song-actions{display:flex!important;overflow-x:auto!important;flex-wrap:nowrap!important}
}

/* tablet landscape: denser desktop/music-station layout */
@media (min-width:900px) and (max-width:1366px) and (orientation:landscape){
 body.v124-tablet #v37Home{max-width:1320px!important;margin-inline:auto!important}
 body.v124-tablet #v39123Bar{grid-template-columns:170px minmax(280px,1fr) auto!important}
 body.v124-tablet #v37Home .v3989-dive-entry{grid-template-columns:minmax(0,1.35fr) minmax(330px,.65fr)!important}
 body.v124-tablet #v37Home .v3989-dive-actions{grid-template-columns:1fr!important}
 body.v124-tablet #v37Home .v396-hero{grid-template-columns:minmax(330px,.8fr) minmax(0,1.2fr)!important}
 body.v124-tablet #v37Home .v39-media-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:11px!important}
 body.v124-tablet #v37Home .v39-media-card{min-width:0!important}
 body.v124-tablet #v37Home .v39-media-card:nth-child(n+9){display:none}
 body.v124-tablet .v398-search-page #songList{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;padding:9px!important}
 body.v124-tablet .v398-search-page #songList .song{grid-template-columns:42px 96px minmax(0,1fr)!important;border:1px solid rgba(106,191,184,.09)!important;background:#081c25!important}
 body.v124-tablet .v398-search-page #songList .views{display:none!important}
 body.v124-tablet .v398-search-page #songList .song-actions .mini-btn:nth-child(n+3){display:none!important}
}

/* narrow / fold cleanup */
@media (max-width:699px){
 #v37Home.v39123{padding-inline:8px!important}
 #v39123Bar{border-radius:14px!important}
 #v37Home.v39123 .v39-shelf{border-radius:15px!important}
 #v37Home.v39123 .v39-media-grid{gap:8px!important}
 #v37Home.v39123 .v39-media-title{font-size:10.5px!important}
 #v37Home.v39123 .v39-media-meta{font-size:7.5px!important}
 .v398-search-page #songList .song.v124-top-hit:before{left:6px;top:5px;font-size:6px}
}

/* remove awkward legacy overlaps while new home is active */
body.v37-ready #v37Home~#filterControls,
body.v37-ready #v37Home~#sourceControls{scroll-margin-top:80px}
body.v124-tablet .tools-modal .tools-shell,
body.v124-tablet #toolsModal .tools-shell{max-width:min(1180px,calc(100vw - 24px))!important}
body.v124-tablet #toolsModal .tools-body{padding-bottom:calc(90px + env(safe-area-inset-bottom))!important}
body.v124-tablet .v39-mini-player{max-width:min(620px,calc(100vw - 28px))!important}
`;
  document.head.appendChild(s)
}
function device(){
  var w=Math.min(window.innerWidth||0,window.innerHeight||0),W=Math.max(window.innerWidth||0,window.innerHeight||0);
  var tablet=(w>=600&&W>=800&&W<=1500)||(navigator.maxTouchPoints>1&&w>=600&&w<=1100);
  document.body.classList.toggle("v124-tablet",tablet);
  document.body.classList.toggle("v124-tablet-portrait",tablet&&window.innerHeight>=window.innerWidth);
  document.body.classList.toggle("v124-tablet-landscape",tablet&&window.innerWidth>window.innerHeight)
}
function markTop(){
  document.querySelectorAll(".v398-search-page #songList .song.v124-top-hit").forEach(function(x){x.classList.remove("v124-top-hit")});
  var first=document.querySelector(".v398-search-page #songList .song");
  if(first)first.classList.add("v124-top-hit")
}
function observe(){
  var root=document.getElementById("songList");
  if(!root){markTop();return}
  var pending=0,mo=new MutationObserver(function(){clearTimeout(pending);pending=setTimeout(markTop,60)});
  mo.observe(root,{childList:true});
  markTop()
}
function boot(){
  style();device();observe();
  var timer=0,onresize=function(){clearTimeout(timer);timer=setTimeout(device,80)};
  window.addEventListener("resize",onresize,{passive:true});
  window.addEventListener("orientationchange",function(){setTimeout(device,120)},{passive:true});
  document.addEventListener("click",function(e){
    var card=e.target.closest&&e.target.closest(".v39-media-card");
    if(card&&window.matchMedia("(hover:none)").matches&&!e.target.closest("button,a")){var b=card.querySelector("[data-v39-song]");if(b)b.click()}
  },false)
}
window.VSAResponsive39124={version:VER,refresh:function(){device();markTop()}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();