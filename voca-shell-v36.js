/* Voca Support v36 — conflict-free shell */
(function(){
"use strict";
var started=false,observer=null;
function addStyle(){
  if(document.getElementById("v36ShellStyle"))return;
  var s=document.createElement("style");s.id="v36ShellStyle";
  s.textContent=[
    "html{overflow-x:hidden!important;scroll-behavior:auto!important}",
    "body.v36-ready{overflow-x:hidden!important;min-height:100dvh;background:#041115!important}",
    "body.v36-ready:not(.tools-open):not(.v331-player-open){overflow-y:auto!important;touch-action:pan-y!important;overscroll-behavior-y:auto!important}",
    "body.v36-ready>.app{min-height:100dvh;overflow:visible!important;padding:0 10px calc(82px + env(safe-area-inset-bottom))!important;background:#041115!important}",
    "body.v36-ready>.app>.topbar{position:sticky!important;top:0;z-index:120;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important;margin:0 -10px 6px!important;padding:8px 12px!important;border:0!important;border-bottom:1px solid #17383d!important;border-radius:0!important;background:rgba(4,17,21,.96)!important;backdrop-filter:blur(18px)!important;box-shadow:none!important;overflow:visible!important}",
    "body.v36-ready>.app>.topbar .brand{min-width:0!important;gap:8px!important}body.v36-ready>.app>.topbar .logo{width:36px!important;height:36px!important;min-width:36px!important;border-radius:11px!important}",
    "body.v36-ready>.app>.topbar .brand h1{font-size:17px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.brand .sub{display:none!important}",
    "body.v36-ready>.app>.topbar .status{display:flex!important;align-items:center!important;gap:5px!important;max-width:none!important;overflow:visible!important}",
    "body.v36-ready>.app>.topbar .status>.pill:not(:first-child),body.v36-ready>.app>.topbar .status>.btn,body.v36-ready>.app>.topbar .pwa-actions{display:none!important}",
    "body.v36-ready>.app>.topbar .status>.pill:first-child{display:inline-flex!important;min-height:31px!important;padding:0 9px!important;border:1px solid #285159!important;border-radius:999px!important;background:#0a272d!important;color:#96bbb7!important;font-size:7px!important}",
    "body.v36-ready>.app>#mobileSectionNav,body.v36-ready .mobile-section-nav,body.v36-ready .v33-dock,body.v36-ready #v30BottomDock,body.v36-ready #v28Home,body.v36-ready>.app>#foldFilterToggle,body.v36-ready>.app>#filterControls,body.v36-ready>.app>#sourceControls,body.v36-ready>.app>.summary,body.v36-ready>.app>.main{display:none!important}",
    ".v36-dock{position:fixed;left:10px;right:10px;bottom:max(8px,env(safe-area-inset-bottom));z-index:22000;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;padding:5px;border:1px solid #28555b;border-radius:18px;background:rgba(5,22,27,.97);box-shadow:0 18px 50px #000c;backdrop-filter:blur(22px)}",
    ".v36-dock button{min-width:0;min-height:49px;border:0;border-radius:13px;background:transparent;color:#789d99;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:7px;font-weight:850}",
    ".v36-dock button.active{background:#103139;color:#effffc}.v36-dock i{font-style:normal;font-size:15px;line-height:1}",
    "body.tools-open .v36-dock,body.v331-player-open .v36-dock{display:none!important}",
    "@media(min-width:900px){body.v36-ready>.app{padding:0 16px 28px!important}.v36-dock{left:50%;right:auto;width:540px;transform:translateX(-50%)}}"
  ].join("");
  document.head.appendChild(s);
}
function compactBrand(){
  var h=document.querySelector(".topbar .brand h1");if(h)h.textContent="Voca Support";
}
function cleanLegacy(){
  ["mobileSectionNav","v30BottomDock","v28Home"].forEach(function(id){var el=document.getElementById(id);if(el)el.remove()});
  document.querySelectorAll(".mobile-section-nav,.v33-dock").forEach(function(el){el.remove()});
  var tm=document.getElementById("toolsModal"),player=document.querySelector(".v331-player:not([hidden])");
  var modalOpen=tm&&!tm.hidden&&tm.classList.contains("open");
  if(!modalOpen&&!player){document.body.classList.remove("tools-open");document.body.style.removeProperty("overflow")}
}
function openView(name){
  if(window.VSAV33&&window.VSAV33.openView){window.VSAV33.openView(name);return}
  try{if(typeof openToolsModal==="function")openToolsModal(name)}catch(e){}
}
function active(v){document.querySelectorAll(".v36-dock button").forEach(function(b){b.classList.toggle("active",b.dataset.v36===v)})}
function home(){try{if(typeof closeToolsModal==="function")closeToolsModal()}catch(e){}active("home");var h=document.getElementById("v35Home");if(h)h.scrollIntoView({block:"start"})}
function dock(){
  var d=document.querySelector(".v36-dock");if(d)return;
  d=document.createElement("nav");d.className="v36-dock";d.setAttribute("aria-label","Voca Support");
  d.innerHTML=[["home","⌂","홈"],["explore","✦","탐색"],["search","⌕","검색"],["library","▣","보관함"],["taste","♡","내 취향"]].map(function(x){return'<button type="button" data-v36="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>'}).join("");
  document.body.appendChild(d);active("home");
  d.addEventListener("click",function(e){
    var b=e.target.closest("button[data-v36]");if(!b)return;var v=b.dataset.v36;active(v);
    if(v==="home"){home();return}
    if(v==="explore"){openView("explore33");return}
    if(v==="search"){openView("searchHub33");return}
    if(v==="library"){if(window.VSA332Library&&window.VSA332Library.open)window.VSA332Library.open();else openView("libraryHub33");return}
    if(v==="taste")openView("tasteHub33");
  });
}
function guard(){
  cleanLegacy();dock();compactBrand();
  if(!document.getElementById("v35Home")&&window.VSAHome35&&window.VSAHome35.render)window.VSAHome35.render();
}
function boot(){
  if(started)return;started=true;addStyle();document.body.classList.add("v36-ready");guard();
  observer=new MutationObserver(function(){requestAnimationFrame(guard)});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener("pageshow",guard,{passive:true});
  window.addEventListener("resize",function(){requestAnimationFrame(guard)},{passive:true});
}
if(document.body)boot();else document.addEventListener("DOMContentLoaded",boot,{once:true});
})();