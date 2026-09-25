/* Voca Support v34 — reliable landing shell and legacy-home fail-safe */
(function(){
"use strict";
var booted=false;

function addStyle(){
  if(document.getElementById("v34ShellStyle"))return;
  var s=document.createElement("style");s.id="v34ShellStyle";
  s.textContent=[
    "body.v34-ready>.app>#mobileSectionNav,body.v34-ready>.app>#foldFilterToggle,body.v34-ready>.app>#filterControls,body.v34-ready>.app>#sourceControls,body.v34-ready>.app>.summary,body.v34-ready>.app>.main{display:none!important}",
    "body.v34-ready #v28Home{display:block!important;visibility:visible!important;opacity:1!important}",
    "body.v34-ready>.app{min-height:100dvh;background:#041115}",
    "body.v34-ready>.app>.topbar{position:sticky;top:0;z-index:120;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;margin:0;padding:8px 10px;border:0;border-bottom:1px solid #17383d;border-radius:0;background:rgba(4,17,21,.97);backdrop-filter:blur(18px);box-shadow:none}",
    "body.v34-ready>.app>.topbar .brand{min-width:0;gap:8px}body.v34-ready>.app>.topbar .logo{width:34px;height:34px;min-width:34px;border-radius:10px;font-size:15px}",
    "body.v34-ready>.app>.topbar .brand h1{font-size:16px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.v34-ready>.app>.topbar .brand .sub{display:none!important}",
    "body.v34-ready>.app>.topbar .status{display:flex;gap:5px;align-items:center;justify-content:flex-end;min-width:0}",
    "body.v34-ready>.app>.topbar .status>.pill:not(:first-child),body.v34-ready>.app>.topbar .status>.btn:not(#openToolsBtn){display:none!important}",
    "body.v34-ready>.app>.topbar #openToolsBtn{min-height:34px;padding:0 10px;border:1px solid #285159;border-radius:10px;background:#0a262c;color:#cbe9e5;font-size:8px;font-weight:900}",
    "body.v34-ready>.app>.topbar .status>.pill:first-child{min-height:30px;padding:0 8px;border:1px solid #265158;border-radius:999px;background:#0a272d;color:#93bab6;font-size:7px}",
    ".v34-dock{display:none}",
    "body.v34-compact .v34-dock{position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:22000;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;padding:5px;border:1px solid #28555b;border-radius:18px;background:rgba(5,22,27,.97);box-shadow:0 18px 50px #000c;backdrop-filter:blur(22px)}",
    "body.v34-compact .v34-dock button{min-width:0;min-height:48px;border:0;border-radius:13px;background:transparent;color:#789d99;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:7px;font-weight:850}",
    "body.v34-compact .v34-dock button.active{background:#103139;color:#effffc}.v34-dock i{font-style:normal;font-size:15px;line-height:1}",
    "body.v34-compact>.app{padding:0 8px calc(82px + env(safe-area-inset-bottom))!important}body.v34-compact>.app>.topbar{margin:0 -8px 5px!important}",
    "body.tools-open .v34-dock,body.v331-player-open .v34-dock{display:none!important}",
    "@media(min-width:900px){body.v34-ready>.app{padding-left:14px;padding-right:14px}body.v34-ready>.app>.topbar{margin:0 -14px 8px}}"
  ].join("");
  document.head.appendChild(s);
}
function compact(){
  var vv=window.visualViewport,w=Math.min(window.innerWidth||9999,vv&&vv.width||9999),h=Math.max(window.innerHeight||0,vv&&vv.height||0);
  document.body.classList.toggle("v34-compact",h>=w&&w<=980);
}
function setBrand(){
  var h=document.querySelector(".topbar .brand h1");if(h)h.textContent="Voca Support";
  var sub=document.querySelector(".topbar .brand .sub");if(sub)sub.textContent="추천 · 탐색 · 검색 · 보관 · 취향";
  var open=document.getElementById("openToolsBtn");if(open)open.textContent="전체 기능";
}
function ensureHome(){
  if(!document.getElementById("v28Home")&&window.VSAHome28&&window.VSAHome28.boot){try{window.VSAHome28.boot()}catch(e){}}
  var home=document.getElementById("v28Home");
  if(home){
    home.hidden=false;
    home.style.removeProperty("display");
    if(!home.children.length&&window.VSAHome28&&window.VSAHome28.loadFeed){try{window.VSAHome28.loadFeed(false)}catch(e){}}
  }
}
function openView(name){
  if(window.VSAV33&&window.VSAV33.openView){window.VSAV33.openView(name);return}
  try{openToolsModal(name);setTimeout(function(){try{setToolView(name)}catch(e){}},0)}catch(e){}
}
function goHome(){
  try{if(typeof closeToolsModal==="function")closeToolsModal()}catch(e){}
  var h=document.getElementById("v28Home");if(h)h.scrollIntoView({behavior:"smooth",block:"start"});
  setActive("home");
}
function setActive(v){document.querySelectorAll(".v34-dock button").forEach(function(b){b.classList.toggle("active",b.dataset.v34===v)})}
function buildDock(){
  var old=document.querySelector(".v33-dock");if(old)old.remove();
  var old2=document.getElementById("v30BottomDock");if(old2)old2.remove();
  var dock=document.querySelector(".v34-dock");if(dock)return;
  dock=document.createElement("nav");dock.className="v34-dock";dock.setAttribute("aria-label","Voca Support");
  dock.innerHTML=[["home","⌂","홈"],["explore","✦","탐색"],["search","⌕","검색"],["library","▣","보관함"],["taste","♡","내 취향"]].map(function(x){return'<button type="button" data-v34="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>'}).join("");
  document.body.appendChild(dock);setActive("home");
  dock.addEventListener("click",function(e){
    var b=e.target.closest("button[data-v34]");if(!b)return;var v=b.dataset.v34;setActive(v);
    if(v==="home"){goHome();return}
    if(v==="explore"){openView("explore33");return}
    if(v==="search"){openView("searchHub33");return}
    if(v==="library"){if(window.VSA332Library&&window.VSA332Library.open)window.VSA332Library.open();else openView("libraryHub33");return}
    if(v==="taste")openView("tasteHub33");
  });
}
function directLegacyCleanup(){
  var old=document.getElementById("mobileSectionNav");if(old){old.hidden=true;old.style.setProperty("display","none","important")}
  document.body.classList.add("v34-ready","v33-shell","v33-home-polish");
}
function run(){
  addStyle();directLegacyCleanup();compact();setBrand();ensureHome();buildDock();
}
function boot(){
  if(booted)return;booted=true;run();
  [120,400,1000].forEach(function(ms){setTimeout(run,ms)});
  window.addEventListener("resize",function(){requestAnimationFrame(function(){compact();run()})},{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener("resize",function(){requestAnimationFrame(function(){compact();run()})},{passive:true});
}
if(document.body)boot();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();