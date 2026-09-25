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
    ".v29-flow-context{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:-2px 0 9px;padding:8px 10px;border:1px solid #1b3b42;border-radius:12px;background:#081d22;color:#88aaa7;font-size:8px}.v29-flow-context b{color:#dff6f2}.v29-back{margin-left:auto;min-height:30px;padding:0 9px;border:1px solid #2b565c;border-radius:9px;background:#0c2a30;color:#c8e6e2;font-size:8px;font-weight:850}",
    "#mobileSectionNav{display:none!important}",
    ".v30-bottom-dock{display:none}",
    "body.v29-compact .v30-bottom-dock{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:9999;padding:5px;gap:3px;border:1px solid #28555b;border-radius:18px;background:rgba(5,22,27,.97);box-shadow:0 18px 50px #000c;backdrop-filter:blur(22px)}",
    "body.v29-compact .v30-bottom-dock button{min-width:0;min-height:48px;border:0;border-radius:13px;background:transparent;color:#769c99;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:7px;font-weight:850}",
    "body.v29-compact .v30-bottom-dock button.active{background:#103139;color:#effffc}body.v29-compact .v30-dock-icon{font-size:15px;line-height:1;color:#91c0bb}body.v29-compact .v30-bottom-dock button.active .v30-dock-icon{color:#77e3d8}body.v29-compact.tools-open .v30-bottom-dock{display:none!important}",
    "body.v29-compact .app{padding:0 8px calc(82px + env(safe-area-inset-bottom))!important}",
    "body.v29-compact .topbar{position:sticky!important;top:0!important;z-index:105!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;min-height:48px!important;margin:0 -8px 5px!important;padding:6px 10px!important;border:0!important;border-bottom:1px solid #17383d!important;border-radius:0!important;background:rgba(4,17,21,.96)!important;box-shadow:none!important;backdrop-filter:blur(18px)!important;overflow:hidden!important}",
    "body.v29-compact .topbar:after{display:none!important}body.v29-compact .brand{min-width:0!important;gap:7px!important}body.v29-compact .logo{width:30px!important;height:30px!important;min-width:30px!important;border-radius:9px!important;font-size:14px!important}body.v29-compact .brand h1{font-size:15px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}body.v29-compact .brand .sub{display:none!important}",
    "body.v29-compact .status{width:auto!important;max-width:none!important;display:block!important;padding:0!important}body.v29-compact .status>.pill:first-child{width:26px!important;height:26px!important;display:grid!important;place-items:center!important;padding:0!important;border-radius:50%!important;font-size:0!important;background:#0a292c!important}body.v29-compact .status>.pill:first-child #statusText{display:none!important}body.v29-compact .status>.pill:first-child .dot{margin:0!important}body.v29-compact .status>#snapshotLabel,body.v29-compact .status>#openToolsBtn,body.v29-compact .status>.pwa-actions{display:none!important}",
    "body.v29-compact .mobile-section-nav{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;position:fixed!important;left:8px!important;right:8px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;top:auto!important;z-index:115!important;margin:0!important;padding:5px!important;gap:3px!important;border:1px solid #245057!important;border-radius:18px!important;background:rgba(5,22,27,.97)!important;box-shadow:0 18px 50px #000b!important;backdrop-filter:blur(20px)!important;overflow:visible!important}",
    "body.v29-compact .mobile-section-nav button{min-width:0!important;min-height:48px!important;padding:4px 2px!important;border:0!important;border-radius:13px!important;background:transparent!important;color:#759a98!important;font-size:7px!important;font-weight:850!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important}body.v29-compact .mobile-section-nav button.active{background:#103139!important;color:#e9fffb!important}body.v29-compact .v27-dock-icon{font-size:15px!important;line-height:1!important}body.v29-compact .v27-dock-label{font-size:7px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%}",
    "body.v29-compact.tools-open #mobileSectionNav{display:none!important}body.v29-compact .v28-home{margin-top:0!important}body.v29-compact .v28-hero{border-radius:0 0 16px 16px!important;border-top:0!important;padding-top:12px!important}",
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
  if(search&&!search.querySelector(".v29-flow-context")){
    var ctx=document.createElement("div");
    ctx.className="v29-flow-context";
    ctx.id="v29SearchContext";
    ctx.innerHTML='<span>현재 조건</span><b>자유 검색</b><button type="button" class="v29-back" data-v29-back="archive29">← 빙산 설정</button>';
    var head=search.querySelector(".v29-module-head");
    if(head)head.insertAdjacentElement("afterend",ctx);
  }

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
  var dock=document.getElementById("v30BottomDock");
  if(!dock)return;
  var buttons=dock.querySelectorAll("button[data-v30-view]");
  for(var i=0;i<buttons.length;i++)buttons[i].classList.toggle("active",buttons[i].dataset.v30View===view);
}
function goHome(){
  try{closeToolsModal();}catch(e){}
  setDockActive("home29");
  var home=document.getElementById("v28Home");
  if(home)home.scrollIntoView({behavior:"smooth",block:"start"});else window.scrollTo({top:0,behavior:"smooth"});
}
function routeDock(){
  var old=document.getElementById("mobileSectionNav");
  if(old){
    old.hidden=true;
    old.setAttribute("aria-hidden","true");
    old.style.setProperty("display","none","important");
  }
  var dock=document.getElementById("v30BottomDock");
  if(!dock){
    dock=document.createElement("nav");
    dock.id="v30BottomDock";
    dock.className="v30-bottom-dock";
    dock.setAttribute("aria-label","보카로 서포터 빠른 메뉴");
    var specs=[
      ["⌂","홈","home29"],
      ["⌕","검색","search29"],
      ["◈","메뉴","studioHome"],
      ["✦","우주","universe29"],
      ["♡","보관","library22"]
    ];
    dock.innerHTML=specs.map(function(x){
      return '<button type="button" data-v30-view="'+x[2]+'"><span class="v30-dock-icon">'+x[0]+'</span><span>'+x[1]+'</span></button>';
    }).join("");
    document.body.appendChild(dock);
    dock.addEventListener("click",function(e){
      var btn=e.target.closest("button[data-v30-view]");
      if(!btn)return;
      var view=btn.dataset.v30View;
      if(view==="home29"){goHome();return;}
      setDockActive(view);
      if(view==="library22"&&window.VSAOrganizer22&&window.VSAOrganizer22.openLibrary){
        window.VSAOrganizer22.openLibrary("saved");
        return;
      }
      openRoute(view);
    });
  }
  setDockActive("home29");
}


function compactMode(){
  var vv=window.visualViewport;
  var w=Math.min(window.innerWidth||9999,vv&&vv.width||9999);
  var h=Math.max(window.innerHeight||0,vv&&vv.height||0);
  var coarse=window.matchMedia&&window.matchMedia("(pointer:coarse)").matches;
  var portrait=h>=w;
  document.body.classList.toggle("v29-compact",portrait&&(w<=980||coarse));
}
function searchContext(){
  var box=document.getElementById("v29SearchContext");
  if(!box)return;
  var label="자유 검색";
  try{
    var tier=typeof TIERS!=="undefined"?TIERS.find(function(x){return x.id===state.tier;}):null;
    var year=state.year==="all"?"전체 연도":state.year+"년";
    var source=typeof sourceDefinition==="function"?sourceDefinition().label:"음성합성 전체";
    label=year+" · "+(tier?tier.name+" "+tier.range:"전체 구간")+" · "+source;
  }catch(e){}
  var b=box.querySelector("b");
  if(b)b.textContent=label;
}
function bindArchiveFlow(){
  if(document.body.dataset.v29Flow)return;
  document.body.dataset.v29Flow="1";
  document.addEventListener("click",function(e){
    var back=e.target.closest&&e.target.closest("[data-v29-back]");
    if(back){e.preventDefault();openRoute(back.dataset.v29Back);return;}
    var tier=e.target.closest&&e.target.closest("#iceberg .tier");
    var songs=e.target.closest&&e.target.closest("#songsBtn");
    if(tier||songs){
      setTimeout(function(){
        searchContext();
        openRoute("search29");
      },30);
    }
  });
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
  bindArchiveFlow();
  compactMode();
}

var __booted=false;
function boot(){if(__booted)return;__booted=true;
  addStyle();
  ensureViews();
  setTimeout(ensureViews,150);
  setTimeout(ensureViews,500);
  window.addEventListener("resize",function(){requestAnimationFrame(compactMode)},{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener("resize",function(){requestAnimationFrame(compactMode)},{passive:true});
}
if(document.body)boot();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();