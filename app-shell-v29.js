/* Voice Synth Archive App Shell v29
 * Home is feed-only. Archive/search/universe/settings live inside the Voca menu.
 */
(function(){
"use strict";

var ROUTES={
  icebergPanel:"archive29",
  resultsPanel:"search29",
  universePanel:"universe29",
  settingsPanel:"settings29"
};

function addStyle(){
  if(document.getElementById("v29ShellStyle"))return;
  var s=document.createElement("style");
  s.id="v29ShellStyle";
  s.textContent=[
    ".v29-module{display:none;min-height:100%;padding:10px;background:#061519}",
    ".v29-module.active{display:block}",
    ".v29-module-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;padding:12px 13px;margin-bottom:9px;border:1px solid #1e4047;border-radius:16px;background:linear-gradient(135deg,#0a252b,#091a22)}",
    ".v29-module-head span{display:block;font-size:7px;font-weight:950;letter-spacing:.14em;color:#6fd9d0}",
    ".v29-module-head h2{margin:3px 0 0;font-size:18px;letter-spacing:-.03em}",
    ".v29-module-head p{margin:3px 0 0;font-size:8px;color:#779b98}",
    ".v29-module>.panel,.v29-module>.settings,.v29-module>.v26-filter-shell,.v29-module>.summary{margin-top:0!important}",
    ".v29-module>.summary{margin-bottom:10px!important}",
    ".v29-module[data-tool-view='archive29'] #icebergPanel{width:100%;max-width:none}",
    ".v29-module[data-tool-view='search29'] #resultsPanel{width:100%;max-width:none;min-height:620px!important}",
    ".v29-module[data-tool-view='universe29'] #universePanel{margin-top:0!important}",
    ".v29-module[data-tool-view='settings29'] #settingsPanel{margin-top:0!important}",
    "body.v29-feed-home>.app>.main{display:none!important}",
    "body.v29-feed-home>.app>#universePanel,body.v29-feed-home>.app>#settingsPanel{display:none!important}",
    "body.v29-feed-home>.app>.summary,body.v29-feed-home>.app>.v26-filter-shell{display:none!important}",
    "@media(max-width:920px) and (orientation:portrait){.app{padding:0 8px calc(82px + env(safe-area-inset-bottom))!important}.topbar{position:sticky!important;top:0!important;z-index:105!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;min-height:54px!important;margin:0 -8px 6px!important;padding:7px 10px!important;border:0!important;border-bottom:1px solid #17383d!important;border-radius:0!important;background:rgba(4,17,21,.94)!important;box-shadow:none!important;backdrop-filter:blur(18px)!important;overflow:hidden!important}.topbar:after{display:none!important}.brand{min-width:0!important;gap:8px!important}.logo{width:34px!important;height:34px!important;min-width:34px!important;border-radius:10px!important}.brand h1{font-size:17px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.brand .sub{display:none!important}.status{width:auto!important;max-width:none!important;display:block!important;padding:0!important}.status>.pill:first-child{width:30px!important;height:30px!important;display:grid!important;place-items:center!important;padding:0!important;border-radius:50%!important;font-size:0!important;background:#0a292c!important}.status>.pill:first-child #statusText{display:none!important}.status>.pill:first-child .dot{margin:0!important}.status>#snapshotLabel,.status>#openToolsBtn,.status>.pwa-actions{display:none!important}.mobile-section-nav{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;position:fixed!important;left:8px!important;right:8px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;top:auto!important;z-index:115!important;margin:0!important;padding:5px!important;gap:3px!important;border:1px solid #245057!important;border-radius:18px!important;background:rgba(5,22,27,.96)!important;box-shadow:0 18px 50px #000b!important;backdrop-filter:blur(20px)!important;overflow:visible!important}.mobile-section-nav button{min-width:0!important;min-height:48px!important;padding:4px 2px!important;border:0!important;border-radius:13px!important;background:transparent!important;color:#759a98!important;font-size:7px!important;font-weight:850!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important}.mobile-section-nav button.active{background:#103139!important;color:#e9fffb!important}.v27-dock-icon{font-size:15px!important;line-height:1!important}.v27-dock-label{font-size:7px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%}body.tools-open #mobileSectionNav{display:none!important}.v28-home{margin-top:0!important}.v28-hero{border-radius:0 0 19px 19px!important;border-top:0!important}.v28-homebar{padding:0 2px!important}.v29-module{padding:7px}.v29-module-head{padding:10px;border-radius:14px}.v29-module-head h2{font-size:16px}.v29-module[data-tool-view='search29'] #resultsPanel{min-height:0!important}}"
  ].join("");
  document.head.appendChild(s);
}

function makeView(name,title,desc){
  var body=document.querySelector("#toolsModal .tools-body");
  if(!body)return null;
  var existing=body.querySelector('[data-tool-view="'+name+'"]');
  if(existing)return existing;
  var sec=document.createElement("section");
  sec.className="tool-view v29-module";
  sec.dataset.toolView=name;
  sec.innerHTML='<div class="v29-module-head"><div><span>VOCALO SUPPORT</span><h2>'+title+'</h2><p>'+desc+'</p></div></div>';
  body.appendChild(sec);
  return sec;
}

function moveNode(node,view){
  if(node&&view&&node.parentElement!==view)view.appendChild(node);
}

function buildModules(){
  var archive=makeView("archive29","빙산 · 통계","조회수 빙산과 모집단 통계를 별도 화면에서 탐색합니다.");
  var search=makeView("search29","곡 검색","곡명·P명·보컬·태그·sm번호를 검색하고 결과를 관리합니다.");
  var universe=makeView("universe29","보카로 우주","중심곡을 검색하고 비슷한 곡의 관계를 별자리처럼 탐색합니다.");
  var settings=makeView("settings29","앱 설정","Worker 연결, 설치 상태, 업데이트와 기술 설정을 관리합니다.");

  moveNode(document.querySelector(".v26-filter-shell"),archive);
  moveNode(document.querySelector(".summary"),archive);
  moveNode(document.getElementById("icebergPanel"),archive);

  moveNode(document.getElementById("resultsPanel"),search);
  moveNode(document.getElementById("universePanel"),universe);
  moveNode(document.getElementById("settingsPanel"),settings);

  var main=document.querySelector(".app>.main");
  if(main&&!main.children.length)main.hidden=true;

  document.body.classList.add("v29-feed-home");
}

function openRoute(view){
  try{openToolsModal(view);}catch(e){}
}

function setDockActive(view){
  var nav=document.getElementById("mobileSectionNav");
  if(!nav)return;
  var buttons=nav.querySelectorAll("button[data-v29-view]");
  for(var i=0;i<buttons.length;i++)buttons[i].classList.toggle("active",buttons[i].dataset.v29View===view);
}
function goHome(){
  try{closeToolsModal();}catch(e){}
  setDockActive("home29");
  var home=document.getElementById("v28Home");
  if(home)home.scrollIntoView({behavior:"smooth",block:"start"});else window.scrollTo({top:0,behavior:"smooth"});
}
function routeDock(){
  var nav=document.getElementById("mobileSectionNav");
  if(!nav||nav.dataset.v29)return;
  nav.dataset.v29="1";

  var specs=[
    ["⌂","홈","home29"],
    ["⌕","검색","search29"],
    ["◈","메뉴","studioHome"],
    ["✦","우주","universe29"],
    ["♡","보관","library22"]
  ];
  var buttons=nav.querySelectorAll("button");
  for(var i=0;i<buttons.length;i++){
    if(!specs[i])continue;
    buttons[i].removeAttribute("data-target");
    buttons[i].removeAttribute("data-action");
    buttons[i].dataset.v29View=specs[i][2];
    buttons[i].innerHTML='<span class="v27-dock-icon">'+specs[i][0]+'</span><span class="v27-dock-label">'+specs[i][1]+'</span>';
  }
  setDockActive("home29");

  nav.addEventListener("click",function(e){
    var btn=e.target.closest("button[data-v29-view]");
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var view=btn.dataset.v29View;
    if(view==="home29"){goHome();return;}
    setDockActive(view);
    openRoute(view);
  },true);
}

function routeLegacyRequests(){
  window.VSAOpenArchive=function(){openRoute("archive29");};
  window.VSAOpenSearch=function(){openRoute("search29");};
  window.VSAOpenUniverse=function(){openRoute("universe29");};
  window.VSAOpenSettings=function(){openRoute("settings29");};
}

function ensureViews(){
  buildModules();
  routeDock();
  routeLegacyRequests();
}

function boot(){
  addStyle();
  ensureViews();
  setTimeout(ensureViews,150);
  setTimeout(ensureViews,500);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();