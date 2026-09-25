/* Voice Synth Archive Adaptive UI v31
 * ResizeObserver-driven layouts for phones, Fold, tablets, desktop and resizable windows.
 */
(function(){
"use strict";

var shell=null, ro=null;

function addStyle(){
  if(document.getElementById("v31AdaptiveStyle"))return;
  var s=document.createElement("style");
  s.id="v31AdaptiveStyle";
  s.textContent=[
    "html,body{max-width:100%;overflow-x:hidden}",
    "#toolsModal .tools-shell{box-sizing:border-box;max-width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}",
    "#toolsModal .tools-shell *{box-sizing:border-box}",
    ".tools-shell.v25-studio{width:min(1480px,calc(100vw - 24px));height:min(960px,calc(100dvh - 24px))}",
    ".v25-workspace{grid-template-columns:clamp(174px,18vw,238px) minmax(0,1fr)!important;min-width:0}",
    ".v25-content,.tools-body,.tool-view,.v29-module{min-width:0;max-width:100%;overflow-x:hidden}",
    ".v25-contextbar>div,.panel-head>div:first-child{min-width:0}",
    ".v25-contextbar small,.panel-head p{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}",
    ".v29-module{padding:clamp(7px,1vw,12px)!important}",
    ".v29-module>.panel,.v29-module>.settings,.v29-module>.summary,.v29-module>.v26-filter-shell{width:100%!important;max-width:100%!important;min-width:0!important}",
    ".v29-module-head{align-items:flex-start!important}.v29-module-head>div{min-width:0}",
    ".v26-filter-shell,.controls,.sourcebar,.summary,.settings-grid,.detective-grid,.v24-layout,.v24-controls,.v24-sliders,.v23-grid{min-width:0;max-width:100%}",
    "#filterControls{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))!important;gap:8px!important;align-items:end!important;padding:10px!important}",
    "#filterControls>.control,#filterControls>button{min-width:0!important;width:100%!important}",
    "#filterControls select,#filterControls input,#filterControls button{width:100%!important;max-width:100%!important;min-width:0!important}",
    "#sourceControls{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))!important;gap:8px!important;padding:10px!important}",
    "#sourceControls>*{min-width:0!important;max-width:100%!important}",
    "#sourceControls input,#sourceControls select{width:100%!important;max-width:100%!important;min-width:0!important}",
    ".summary{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))!important;gap:8px!important}",
    ".summary>.card{min-width:0!important}",
    ".settings-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))!important;gap:10px!important}",
    ".settings-grid>*{min-width:0!important}",
    ".search-row{min-width:0}.search-row>*{min-width:0;max-width:100%}",
    ".results-toolbar{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:6px!important}",
    ".results-toolbar input{min-width:0!important}",
    ".universe-layout{grid-template-columns:minmax(0,1fr) minmax(230px,320px)!important;min-width:0}",
    ".universe-stage,.universe-side{min-width:0}",
    ".v24-layout{grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr)!important;min-width:0}",
    ".v24-controls{grid-template-columns:minmax(0,1fr) minmax(100px,140px) minmax(80px,100px) auto!important}",
    ".v25-home-groups{grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))!important}",
    ".v25-home-card,.v25-home-group{min-width:0}",

    /* wide desktop / large tablet */
    ".v31-wide .v25-workspace{grid-template-columns:clamp(205px,17vw,245px) minmax(0,1fr)!important}",
    ".v31-wide #toolsTabs{padding:12px!important}",

    /* Fold unfolded / small tablet: keep side rail, but make it compact */
    ".v31-medium .v25-workspace{grid-template-columns:150px minmax(0,1fr)!important}",
    ".v31-medium #toolsTabs{padding:8px!important;gap:5px!important}",
    ".v31-medium .v25-nav-copy small{display:none!important}",
    ".v31-medium .v25-nav-group-title{padding:5px 4px 2px!important}",
    ".v31-medium .v25-nav-group-title small{display:none!important}",
    ".v31-medium #toolsTabs>button,.v31-medium .v25-nav-group>button{grid-template-columns:30px minmax(0,1fr)!important;gap:6px!important;min-height:44px!important;padding:6px!important}",
    ".v31-medium .v25-nav-icon{width:30px!important;height:30px!important;font-size:13px!important}",
    ".v31-medium .v25-nav-copy b{font-size:9px!important}",
    ".v31-medium .v25-contextbar{min-height:54px!important;padding:8px 10px!important}",
    ".v31-medium .v25-contextbar b{font-size:13px!important}",
    ".v31-medium .v25-contextbar small{font-size:8px!important}",
    ".v31-medium .v29-module-head{padding:10px 11px!important}",
    ".v31-medium .summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}",
    ".v31-medium .v24-layout{grid-template-columns:1fr!important}",
    ".v31-medium .universe-layout{grid-template-columns:1fr!important}",
    ".v31-medium .universe-side{max-height:300px;overflow:auto}",

    /* narrow tablet / landscape phone: horizontal tool rail */
    ".v31-narrow{width:calc(100vw - 12px)!important;height:calc(100dvh - 12px)!important;max-width:none!important;max-height:none!important}",
    ".v31-narrow .v25-workspace{grid-template-columns:1fr!important;grid-template-rows:auto minmax(0,1fr)!important}",
    ".v31-narrow #toolsTabs{display:flex!important;flex-direction:row!important;gap:5px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:6px 7px!important;border-right:0!important;border-bottom:1px solid #1c3047!important;scroll-snap-type:x proximity}",
    ".v31-narrow .v25-nav-group{display:flex!important;flex-direction:row!important;gap:4px!important;padding:0!important}",
    ".v31-narrow .v25-nav-group-title{display:none!important}",
    ".v31-narrow #toolsTabs>button,.v31-narrow .v25-nav-group>button{width:auto!important;min-width:max-content!important;grid-template-columns:26px auto!important;gap:5px!important;min-height:38px!important;padding:5px 8px!important;scroll-snap-align:start}",
    ".v31-narrow .v25-nav-icon{width:26px!important;height:26px!important;font-size:12px!important}",
    ".v31-narrow .v25-nav-copy b{font-size:8px!important}",
    ".v31-narrow .v25-nav-copy small{display:none!important}",
    ".v31-narrow .v25-content{min-height:0!important}",
    ".v31-narrow .v25-contextbar{min-height:48px!important;padding:6px 8px!important}",
    ".v31-narrow .v25-contextbar small{display:none!important}",
    ".v31-narrow .v25-context-home{min-height:30px!important}",
    ".v31-narrow .tools-body{min-height:0!important}",
    ".v31-narrow #filterControls{grid-template-columns:repeat(2,minmax(0,1fr))!important}",
    ".v31-narrow #sourceControls{grid-template-columns:1fr!important}",
    ".v31-narrow .summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}",
    ".v31-narrow .v24-layout,.v31-narrow .universe-layout{grid-template-columns:1fr!important}",
    ".v31-narrow .v25-home-groups{grid-template-columns:1fr 1fr!important}",

    /* phone / Fold cover */
    ".v31-compact{width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;border-radius:0!important}",
    ".v31-compact .tools-header{padding:9px 10px!important}",
    ".v31-compact .tools-title{font-size:16px!important}",
    ".v31-compact .tools-sub{font-size:8px!important}",
    ".v31-compact #filterControls{grid-template-columns:1fr!important}",
    ".v31-compact #sourceControls{grid-template-columns:1fr!important}",
    ".v31-compact .summary{grid-template-columns:1fr 1fr!important}",
    ".v31-compact .settings-grid{grid-template-columns:1fr!important}",
    ".v31-compact .v25-home-groups{grid-template-columns:1fr!important}",
    ".v31-compact .v25-home-cards{grid-template-columns:1fr 1fr!important}",
    ".v31-compact .v24-controls{grid-template-columns:1fr 1fr!important}",
    ".v31-compact .v24-controls input{grid-column:1/-1!important}",
    ".v31-compact .v24-sliders{grid-template-columns:1fr!important}",
    ".v31-compact .universe-layout{grid-template-columns:1fr!important}",

    /* generic overflow protection */
    ".v31-medium input,.v31-medium select,.v31-medium textarea,.v31-narrow input,.v31-narrow select,.v31-narrow textarea,.v31-compact input,.v31-compact select,.v31-compact textarea{max-width:100%!important;min-width:0!important}",
    ".v31-medium .control,.v31-narrow .control,.v31-compact .control{min-width:0!important}",
    ".v31-medium .panel,.v31-narrow .panel,.v31-compact .panel{max-width:100%!important;min-width:0!important;overflow:hidden}",
    ".v31-medium .song,.v31-narrow .song,.v31-compact .song{min-width:0!important}",
    ".v31-medium .song-title,.v31-narrow .song-title,.v31-compact .song-title{overflow-wrap:anywhere}",

    "@media(max-width:520px){.v31-compact .v25-home-cards{grid-template-columns:1fr!important}.v31-compact .summary{grid-template-columns:1fr 1fr!important}.v31-compact .search-row{grid-template-columns:1fr!important}.v31-compact .search-row>*{grid-column:auto!important}.v31-compact .results-toolbar{grid-template-columns:1fr!important}}"
  ].join("");
  document.head.appendChild(s);
}

function classify(width){
  if(width<560)return "compact";
  if(width<780)return "narrow";
  if(width<1120)return "medium";
  return "wide";
}
function apply(){
  shell=document.querySelector("#toolsModal .tools-shell");
  if(!shell)return;
  var w=shell.getBoundingClientRect().width||window.innerWidth;
  var mode=classify(w);
  shell.classList.remove("v31-compact","v31-narrow","v31-medium","v31-wide");
  shell.classList.add("v31-"+mode);
  shell.dataset.v31Layout=mode;
  document.documentElement.style.setProperty("--v31-shell-width",Math.round(w)+"px");
}
function observe(){
  shell=document.querySelector("#toolsModal .tools-shell");
  if(!shell)return;
  if(ro)ro.disconnect();
  ro=new ResizeObserver(function(){requestAnimationFrame(apply);});
  ro.observe(shell);
  var body=document.querySelector("#toolsModal .tools-body");
  if(body)ro.observe(body);
}
function boot(){
  addStyle();
  apply();
  observe();
  window.addEventListener("resize",function(){requestAnimationFrame(apply)},{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener("resize",function(){requestAnimationFrame(apply)},{passive:true});
  var modal=document.getElementById("toolsModal");
  if(modal){
    new MutationObserver(function(){if(!modal.hidden)setTimeout(apply,0);}).observe(modal,{attributes:true,attributeFilter:["hidden","class"]});
  }
  setTimeout(apply,250);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();