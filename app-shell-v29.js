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
    "@media(max-width:699px){.v29-module{padding:7px}.v29-module-head{padding:10px;border-radius:14px}.v29-module-head h2{font-size:16px}.v29-module[data-tool-view='search29'] #resultsPanel{min-height:0!important}}"
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

function routeDock(){
  var nav=document.getElementById("mobileSectionNav");
  if(!nav||nav.dataset.v29)return;
  nav.dataset.v29="1";
  nav.addEventListener("click",function(e){
    var btn=e.target.closest("button");
    if(!btn)return;
    var view=btn.dataset.action==="tools"?"studioHome":ROUTES[btn.dataset.target];
    if(!view)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openRoute(view);
  },true);

  var specs=[
    ["◇","빙산"],
    ["⌕","검색"],
    ["◈","메뉴"],
    ["✦","우주"],
    ["⚙","설정"]
  ];
  var buttons=nav.querySelectorAll("button");
  for(var i=0;i<buttons.length;i++){
    if(!specs[i])continue;
    buttons[i].innerHTML='<span class="v27-dock-icon">'+specs[i][0]+'</span><span class="v27-dock-label">'+specs[i][1]+'</span>';
  }
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