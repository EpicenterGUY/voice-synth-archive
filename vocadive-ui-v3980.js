/* VocaDive Unified UI v39.74.0
 * YouTube-style app shell, cards, player continuity and route recovery.
 */
(function(){
"use strict";

var VERSION="39.74.0";
var raf=0,observer=null,lastRoute="home";

function q(sel,root){return (root||document).querySelector(sel)}
function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}

function addStyle(){
  if(document.getElementById("v3980UnifiedUiStyle"))return;
  var s=document.createElement("style");
  s.id="v3980UnifiedUiStyle";
  s.textContent=`
:root{
 --vd-bg:#071012;
 --vd-surface:#0d171a;
 --vd-surface-2:#111e21;
 --vd-hover:#172629;
 --vd-line:rgba(185,230,225,.12);
 --vd-line-strong:rgba(135,224,214,.26);
 --vd-text:#f2f7f6;
 --vd-muted:#8fa4a2;
 --vd-soft:#69807e;
 --vd-accent:#6cddd2;
 --vd-accent-2:#8290f4;
 --vd-danger:#e79aa5;
 --vd-radius:14px;
 --vd-dock-h:68px;
 color-scheme:dark;
}
html,body{background:var(--vd-bg)!important;color:var(--vd-text)!important}
body.v37-ready{background:var(--vd-bg)!important}
body.v37-ready>.app{
 background:var(--vd-bg)!important;
 max-width:none!important;
 width:auto!important;
 box-sizing:border-box!important;
}
body.v37-ready>.app>.topbar{
 position:sticky!important;top:0!important;z-index:24000!important;
 display:grid!important;grid-template-columns:auto minmax(220px,720px) auto!important;
 align-items:center!important;justify-content:space-between!important;gap:14px!important;
 margin:0!important;padding:10px 18px!important;
 border:0!important;border-bottom:1px solid var(--vd-line)!important;border-radius:0!important;
 background:rgba(7,16,18,.94)!important;backdrop-filter:blur(16px)!important;
 box-shadow:none!important;
}
body.v37-ready .topbar .brand{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important}
body.v37-ready .topbar .logo{
 width:38px!important;height:38px!important;min-width:38px!important;border-radius:11px!important;
 background:#10262a!important;box-shadow:none!important;overflow:hidden!important
}
body.v37-ready .topbar .brand h1{font-size:18px!important;letter-spacing:-.04em!important;color:var(--vd-text)!important}
body.v37-ready .topbar .brand .sub{display:none!important}
body.v37-ready .topbar .status{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;min-width:0!important}
body.v37-ready .topbar .status>#snapshotLabel,
body.v37-ready .topbar .status>#openToolsBtn,
body.v37-ready .topbar .status>.pwa-actions{display:none!important}
body.v37-ready .topbar .status>.pill:first-child{
 display:inline-flex!important;align-items:center!important;gap:5px!important;
 min-height:34px!important;padding:0 10px!important;border:1px solid var(--vd-line)!important;
 border-radius:999px!important;background:var(--vd-surface)!important;color:var(--vd-muted)!important;font-size:9px!important
}
#v3980SearchForm{
 min-width:0;height:42px;display:grid;grid-template-columns:minmax(0,1fr) 46px;
 border:1px solid rgba(181,225,220,.18);border-radius:999px;overflow:hidden;
 background:#0a1518;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)
}
#v3980SearchForm:focus-within{border-color:rgba(108,221,210,.58);box-shadow:0 0 0 2px rgba(108,221,210,.08)}
#v3980SearchInput{
 min-width:0!important;height:100%!important;padding:0 16px!important;border:0!important;border-radius:0!important;
 background:transparent!important;color:var(--vd-text)!important;font-size:13px!important;box-shadow:none!important;outline:0!important
}
#v3980SearchInput::placeholder{color:#6f8582!important}
#v3980SearchBtn{
 border:0;border-left:1px solid var(--vd-line);background:#122024;color:#dff5f2;
 font-size:16px;font-weight:900;cursor:pointer
}
#v3980MenuBtn{
 width:36px;height:36px;padding:0;border:1px solid var(--vd-line);border-radius:50%;
 background:var(--vd-surface);color:#d9eeeb;font-size:17px;font-weight:900;cursor:pointer
}

/* One authoritative navigation surface. */
.v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,#mobileSectionNav,.mobile-section-nav{display:none!important}
#v3980Dock{
 position:fixed;z-index:23500;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
 left:12px;right:12px;bottom:max(8px,env(safe-area-inset-bottom));
 min-height:var(--vd-dock-h);padding:5px;gap:3px;
 border:1px solid rgba(176,224,219,.16);border-radius:20px;
 background:rgba(8,19,22,.96);box-shadow:0 14px 38px rgba(0,0,0,.38);
 backdrop-filter:blur(16px)
}
#v3980Dock button{
 min-width:0;min-height:56px;border:0;border-radius:15px;background:transparent;color:#819996;
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
 font-size:8px;font-weight:800;cursor:pointer
}
#v3980Dock button i{font-style:normal;font-size:18px;line-height:1}
#v3980Dock button.active{background:#17343a;color:#f1fffd}
#v3980Dock button.active i{color:var(--vd-accent)}
body.v331-player-open #v3980Dock{display:none!important}

/* Home: image-first, no prototype boxes. */
#v37Home,#v35Home{max-width:1440px!important;margin:0 auto!important;padding:16px 0 calc(100px + env(safe-area-inset-bottom))!important}
.v37-head,.v35-head{padding:6px 2px 14px!important}
.v37-head small,.v35-head small{color:var(--vd-accent)!important;font-size:9px!important;letter-spacing:.12em!important}
.v37-head h1,.v35-head h1{margin:4px 0!important;font-size:30px!important;letter-spacing:-.05em!important}
.v37-head p,.v35-head p{color:var(--vd-muted)!important;font-size:11px!important}
.v37-tabs,.v35-tabs{gap:8px!important;padding-bottom:16px!important}
.v37-tabs button,.v35-tabs button{
 min-height:36px!important;padding:0 14px!important;border:0!important;border-radius:10px!important;
 background:#152326!important;color:#b7c8c6!important;font-size:10px!important
}
.v37-tabs button.active,.v35-tabs button.active{background:#e8f6f4!important;color:#071012!important;box-shadow:none!important}
.v37-hero,.v35-feature{
 min-height:360px!important;border:0!important;border-radius:16px!important;background:#0d171a!important;
 box-shadow:none!important;overflow:hidden!important
}
.v37-shade,.v35-feature-shade{background:linear-gradient(180deg,transparent 24%,rgba(0,0,0,.12) 52%,rgba(0,0,0,.88) 100%)!important}
.v37-toolbar,.v35-toolbar{padding:24px 2px 10px!important}
.v37-toolbar h2,.v35-toolbar h2{font-size:22px!important;letter-spacing:-.04em!important}
.v37-toolbar small,.v35-toolbar small{font-size:10px!important;color:var(--vd-muted)!important}
.v37-toolbar button,.v35-toolbar button{
 min-height:36px!important;border:0!important;border-radius:999px!important;background:#152326!important;color:#dbe9e7!important;font-size:9px!important
}
.v37-grid,.v35-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:20px 14px!important}
.v37-card,.v35-card{
 min-width:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important
}
.v37-thumb,.v35-thumb{border-radius:12px!important;background:#101c1f!important;overflow:hidden!important;box-shadow:none!important}
.v37-title,.v35-title{
 margin:8px 2px 0!important;color:var(--vd-text)!important;font-size:12px!important;font-weight:850!important;line-height:1.35!important
}
.v37-meta,.v35-meta{margin:4px 2px 0!important;color:var(--vd-muted)!important;font-size:9px!important}
.v37-reason,.v35-reason{margin:3px 2px 0!important;color:#76aaa4!important;font-size:9px!important}
.v37-actions,.v35-actions{gap:5px!important;margin:7px 0 0!important}
.v37-actions button,.v35-actions button{
 min-height:30px!important;padding:0 8px!important;border:0!important;border-radius:999px!important;
 background:#142326!important;color:#aebfbd!important;font-size:8px!important
}
.v37-actions .danger,.v35-actions .danger{background:transparent!important;color:#a98a8f!important}

/* Tool pages: clean page, not nested cards inside cards. */
body.v37-ready .tools-modal,body.v37-ready .tools-shell{background:var(--vd-bg)!important}
body.v37-ready .tools-body{padding-top:12px!important;background:var(--vd-bg)!important}
body.v37-ready .tools-body>.tool-view.active,
body.v37-ready .tools-body>.panel{
 border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important
}
body.v37-ready .tools-body .panel-head,
body.v37-ready .v37-native-head,
body.v37-ready .v33-page-head{
 border:0!important;border-bottom:1px solid var(--vd-line)!important;background:transparent!important;
 padding:8px 2px 16px!important;margin-bottom:14px!important
}
body.v37-ready .tools-body .panel-head h2,
body.v37-ready .v37-native-head h2,
body.v37-ready .v33-page-head h2{font-size:26px!important;color:var(--vd-text)!important;letter-spacing:-.045em!important}
body.v37-ready .tools-body .panel-head p,
body.v37-ready .v37-native-head p,
body.v37-ready .v33-page-head p{font-size:11px!important;color:var(--vd-muted)!important;line-height:1.5!important}
body.v37-ready :is(.v37-hub-card,.v37-intent-card,.v33-card,.v333-follow-card,.discovery-card,.gem-card,.v37-producer-card){
 border:1px solid var(--vd-line)!important;border-radius:14px!important;background:var(--vd-surface)!important;box-shadow:none!important
}
body.v37-ready :is(.v37-hub-card,.v37-intent-card,.v33-card,.v333-follow-card):hover{background:var(--vd-hover)!important}
body.v37-ready :is(input,select,textarea){
 border:1px solid rgba(177,222,217,.16)!important;border-radius:10px!important;background:#0b1619!important;color:var(--vd-text)!important;box-shadow:none!important
}
body.v37-ready :is(input,select,textarea):focus{border-color:rgba(108,221,210,.55)!important;box-shadow:0 0 0 2px rgba(108,221,210,.08)!important}
.v33-search-box{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:7px!important;padding:0!important;background:transparent!important;border:0!important}
.v33-search-box input{min-height:46px!important;border-radius:999px!important;padding:0 16px!important}
.v33-search-box button{min-width:68px!important;border:0!important;border-radius:999px!important;background:#e7f6f4!important;color:#071012!important;font-weight:950!important}

/* Dive keeps its world, but content follows the same product UI. */
#universePanel.v3958-rel .mr58-shell{border:0!important;border-radius:16px!important;box-shadow:none!important}
#universePanel.v3958-rel .mr58-content{padding:14px!important}
#universePanel.v3958-rel .mr58-head{padding:0 2px 12px!important}
#universePanel.v3958-rel .mr58-head h3{font-size:24px!important;letter-spacing:-.045em!important}
#universePanel.v3958-rel .mr58-head p{font-size:10px!important;color:#a4b9b6!important}
#universePanel.v3958-rel .mr72-depth,
#universePanel.v3958-rel .mr72-advanced{
 border:1px solid rgba(178,224,219,.12)!important;border-radius:12px!important;background:rgba(6,20,26,.60)!important;box-shadow:none!important
}
#universePanel.v3958-rel .mr76-center{
 border:0!important;border-radius:14px!important;background:rgba(5,23,29,.90)!important;box-shadow:none!important
}
#universePanel.v3958-rel .mr58-node{
 border:0!important;border-bottom:1px solid rgba(177,222,217,.10)!important;border-radius:10px!important;
 background:rgba(7,25,31,.76)!important;box-shadow:none!important
}
#universePanel.v3958-rel .mr58-node.selected{background:rgba(17,52,58,.92)!important}
#universePanel.v3958-rel .mr58-node-go{
 border:0!important;border-radius:999px!important;background:#173b42!important;color:#e9fbf8!important;box-shadow:none!important
}
#universePanel.v3958-rel .mr77-route-head{margin-top:18px!important}

/* Player: one stable YouTube-like surface. */
.v331-player{background:rgba(0,0,0,.72)!important;backdrop-filter:blur(8px)!important}
.v331-player-shell{
 width:min(1120px,calc(100vw - 28px))!important;max-height:calc(100dvh - 28px)!important;
 border:1px solid var(--vd-line)!important;border-radius:16px!important;background:#081114!important;box-shadow:0 24px 70px rgba(0,0,0,.48)!important
}
.v331-player-head{min-height:54px!important;padding:8px 10px!important;border-bottom:1px solid var(--vd-line)!important;background:#081114!important}
.v331-player-head small{color:var(--vd-accent)!important;font-size:7px!important}
.v331-player-head b{font-size:13px!important}
.v331-player-head button{border:0!important;border-radius:999px!important;background:#152326!important;color:#dceae8!important}
.v331-player-stage{background:#000!important;aspect-ratio:16/9!important}
.v331-player-foot{border-top:1px solid var(--vd-line)!important;background:#081114!important}
.v331-mini{
 left:12px!important;right:12px!important;bottom:calc(var(--vd-dock-h) + 18px + env(safe-area-inset-bottom))!important;
 width:auto!important;min-height:68px!important;padding:5px!important;display:grid!important;
 grid-template-columns:104px minmax(0,1fr) repeat(5,36px)!important;gap:6px!important;align-items:center!important;
 border:1px solid var(--vd-line)!important;border-radius:14px!important;background:#0a1417!important;
 box-shadow:0 12px 36px rgba(0,0,0,.42)!important;backdrop-filter:blur(14px)!important
}
.v331-mini[hidden]{display:none!important}
.v331-mini-stage{width:104px!important;height:58px!important;border-radius:9px!important;overflow:hidden!important;background:#000!important}
.v331-mini-copy{min-width:0!important}
.v331-mini-copy b{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:10px!important;color:var(--vd-text)!important}
.v331-mini-copy small{display:block!important;margin-top:3px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:7px!important;color:var(--vd-muted)!important}
.v331-mini button{width:36px!important;height:36px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#152326!important;color:#e4f2f0!important}
#v3924VolumeMini,#v3921PipMini{display:none!important}
.v399-player-shell{border-radius:12px!important;overflow:hidden!important;background:#000!important}
.v399-watch-meta,.v399-song-info,.v399-detail-info{background:transparent!important;border-color:var(--vd-line)!important}

/* General motion restraint: interaction stays crisp. */
body.v37-ready *{scrollbar-color:#34504e transparent}
body.v37-ready :is(button,a){-webkit-tap-highlight-color:transparent}
@media(max-width:899px){
 body.v37-ready>.app>.topbar{
  grid-template-columns:auto minmax(0,1fr) auto!important;gap:8px!important;padding:8px 10px!important
 }
 body.v37-ready .topbar .status>.pill:first-child{display:none!important}
 #v3980SearchForm{height:40px}
 .v37-grid,.v35-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 .v37-hero,.v35-feature{min-height:300px!important}
 body.v37-ready .tools-body>.tool-view.active{padding:8px!important}
}
@media(max-width:699px){
 body.v37-ready>.app{
  padding:0 10px calc(92px + env(safe-area-inset-bottom))!important;margin:0!important;width:100%!important
 }
 body.v37-ready>.app>.topbar{
  grid-template-columns:auto minmax(0,1fr) 36px!important;
  margin:0 -10px 8px!important;padding:8px 10px!important;border-radius:0!important
 }
 body.v37-ready .topbar .logo{width:34px!important;height:34px!important;min-width:34px!important}
 body.v37-ready .topbar .brand>div:last-child{display:none!important}
 #v3980SearchInput{font-size:11px!important;padding:0 12px!important}
 #v3980SearchBtn{width:42px;font-size:14px}
 #v3980MenuBtn{width:34px;height:34px}
 #v3980Dock{left:8px;right:8px;bottom:max(7px,env(safe-area-inset-bottom));min-height:64px;border-radius:18px}
 #v3980Dock button{min-height:52px;font-size:7.5px}
 #v3980Dock button i{font-size:17px}
 #v37Home,#v35Home{padding-top:4px!important}
 .v37-head h1,.v35-head h1{font-size:24px!important}
 .v37-head p,.v35-head p{display:none!important}
 .v37-hero,.v35-feature{min-height:225px!important;border-radius:12px!important}
 .v37-grid,.v35-grid{grid-template-columns:1fr!important;gap:18px!important}
 .v37-card,.v35-card{padding-bottom:0!important}
 .v37-title,.v35-title{font-size:12.5px!important}
 .v37-meta,.v35-meta,.v37-reason,.v35-reason{font-size:9.5px!important}
 .v37-actions,.v35-actions{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none!important}
 body.v37-ready .tools-body{padding:4px 0 calc(94px + env(safe-area-inset-bottom))!important}
 body.v37-ready .tools-body>.tool-view.active{padding:6px!important}
 body.v37-ready .tools-body .panel-head h2,body.v37-ready .v37-native-head h2,body.v37-ready .v33-page-head h2{font-size:22px!important}
 #universePanel.v3958-rel .mr58-content{padding:10px 8px 16px!important}
 .v331-player{padding:0!important;background:#000!important}
 .v331-player-shell{width:100vw!important;height:100dvh!important;max-height:none!important;border:0!important;border-radius:0!important}
 .v331-player-stage{width:100%!important;aspect-ratio:16/9!important}
 .v331-mini{
   left:8px!important;right:8px!important;bottom:calc(72px + env(safe-area-inset-bottom))!important;
   min-height:64px!important;grid-template-columns:92px minmax(0,1fr) repeat(4,34px)!important;
   gap:5px!important;padding:4px!important;border-radius:12px!important
 }
 .v331-mini-stage{width:92px!important;height:52px!important}
 .v331-mini button{width:34px!important;height:34px!important}
 #v332PrevMini{display:none!important}
}
@media(min-width:1100px){
 body.v37-ready>.app{margin-left:86px!important;padding:0 28px 40px!important}
 body.v37-ready>.app>.topbar{margin:0 -28px 18px!important;padding:10px 28px!important}
 #v3980Dock{
  left:10px;right:auto;top:74px;bottom:auto;width:66px;grid-template-columns:1fr;gap:5px;padding:5px;
  border-radius:16px;box-shadow:none;background:#091417
 }
 #v3980Dock button{min-height:64px;padding:4px 2px;font-size:8px}
 #v3980Dock button i{font-size:19px}
 body.v37-ready .tools-modal{width:calc(100% - 86px)!important;margin-left:86px!important}
 .v37-grid,.v35-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}
 .v331-mini{left:98px!important;right:22px!important;bottom:18px!important;max-width:860px!important;margin:auto!important}
}
@media(prefers-reduced-motion:reduce){
 *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;
  document.head.appendChild(s)
}

function ensureTopbar(){
  var top=q(".app>.topbar");if(!top)return;
  var brand=q(".brand h1",top);if(brand)brand.textContent="VocaDive";
  var form=document.getElementById("v3980SearchForm");
  if(!form){
    form=document.createElement("form");form.id="v3980SearchForm";form.setAttribute("role","search");
    form.innerHTML='<input id="v3980SearchInput" autocomplete="off" placeholder="곡명 · P명 · 보컬 · 태그 검색" aria-label="VocaDive 검색"><button id="v3980SearchBtn" type="submit" aria-label="검색">⌕</button>';
    var status=q(".status",top);if(status)top.insertBefore(form,status);else top.appendChild(form);
    form.addEventListener("submit",function(e){e.preventDefault();runSearch(q("#v3980SearchInput").value)})
  }
  var status=q(".status",top);
  if(status&&!document.getElementById("v3980MenuBtn")){
    var b=document.createElement("button");b.type="button";b.id="v3980MenuBtn";b.textContent="⋮";b.setAttribute("aria-label","전체 메뉴");
    b.addEventListener("click",function(){openRoute("studioHome")});
    status.appendChild(b)
  }
}

function ensureDock(){
  if(document.getElementById("v3980Dock"))return;
  var d=document.createElement("nav");d.id="v3980Dock";d.setAttribute("aria-label","VocaDive 주요 메뉴");
  d.innerHTML=[
    ["home","⌂","홈"],
    ["explore","✦","탐색"],
    ["dive","◉","다이브"],
    ["library","♡","보관함"]
  ].map(function(x){return'<button type="button" data-v3980="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>'}).join("");
  document.body.appendChild(d);
  d.addEventListener("click",function(e){
    var b=e.target.closest("button[data-v3980]");if(!b)return;
    var v=b.dataset.v3980;
    if(v==="home")goHome();
    else if(v==="explore")openRoute("explore33");
    else if(v==="dive")openRoute("universe29");
    else if(v==="library")openLibrary()
  });
  setDock("home")
}
function setDock(v){
  qa("#v3980Dock button").forEach(function(b){b.classList.toggle("active",b.dataset.v3980===v)})
}
function dockForRoute(route){
  route=String(route||"");
  if(!route||route==="home"||route==="home29")return"home";
  if(route==="universe29")return"dive";
  if(route==="libraryHub33"||route==="library22"||route==="tasteHub33")return"library";
  if(route==="explore33"||route==="producerDiscover37"||route==="vocalRank37"||route==="archive29"||route==="detective")return"explore";
  if(route==="searchHub33"||route==="search29")return"explore";
  return lastRoute||"home"
}

function ensureV33(){
  if(window.VSAV33)return Promise.resolve(true);
  try{
    if(window.VSAEnsureFeatures)return Promise.resolve(window.VSAEnsureFeatures("v33")).then(function(){return !!window.VSAV33})
  }catch(_){}
  return Promise.resolve(false)
}
function openRaw(name){
  try{
    if(window.VSAV33&&window.VSAV33.openView&&(name==="explore33"||name==="searchHub33"||name==="libraryHub33"||name==="tasteHub33")){window.VSAV33.openView(name);return true}
    if(typeof window.openToolsModal==="function"){window.openToolsModal(name);setTimeout(function(){try{if(typeof window.setToolView==="function")window.setToolView(name)}catch(_){}},0);return true}
  }catch(_){}
  return false
}
function openRoute(name){
  name=String(name||"");
  var needsV33=/^(explore33|searchHub33|libraryHub33|tasteHub33)$/.test(name);
  var job=needsV33?ensureV33():Promise.resolve(true);
  return job.then(function(ok){
    if(needsV33&&!ok){
      if(name==="searchHub33")name="search29";
      else if(name==="libraryHub33")name="library22";
      else name="studioHome"
    }
    openRaw(name);lastRoute=dockForRoute(name);setDock(lastRoute);scheduleRepair();
    return true
  }).catch(function(){openRaw(name);scheduleRepair();return false})
}
function openLibrary(){
  try{
    if(window.VSA332Library&&window.VSA332Library.open){window.VSA332Library.open();lastRoute="library";setDock("library");scheduleRepair();return}
    if(window.VSAOrganizer22&&window.VSAOrganizer22.openLibrary){window.VSAOrganizer22.openLibrary("saved");lastRoute="library";setDock("library");scheduleRepair();return}
  }catch(_){}
  openRoute("libraryHub33")
}
function goHome(){
  try{if(typeof window.closeToolsModal==="function")window.closeToolsModal()}catch(_){}
  try{document.body.classList.remove("tools-open")}catch(_){}
  var h=document.getElementById("v37Home")||document.getElementById("v35Home");
  if(h)h.scrollIntoView({behavior:"smooth",block:"start"});else window.scrollTo({top:0,behavior:"smooth"});
  lastRoute="home";setDock("home");scheduleRepair()
}
function runSearch(value){
  var query=String(value||"").trim();
  return ensureV33().then(function(ok){
    if(!ok){openRoute("search29");return false}
    openRaw("searchHub33");lastRoute="explore";setDock("explore");
    var tries=0;
    function fill(){
      var input=document.getElementById("v33Query"),btn=document.getElementById("v33SearchRun");
      if(input){
        input.value=query;
        try{input.dispatchEvent(new Event("input",{bubbles:true}))}catch(_){}
        if(query&&btn)btn.click();else{try{input.focus()}catch(_){}}
        return
      }
      if(++tries<10)setTimeout(fill,80)
    }
    setTimeout(fill,30);scheduleRepair();return true
  })
}

function repairRoute(){
  raf=0;
  var modal=document.getElementById("toolsModal");
  var route=String(window.__VSA37_CURRENT_ROUTE||"");
  var player=q(".v331-player"),mini=q(".v331-mini");
  var playerOpen=!!(player&&!player.hidden);
  var miniOpen=!!(mini&&!mini.hidden);

  if(modal){
    var modalOpen=!modal.hidden;
    document.body.classList.toggle("tools-open",modalOpen);
    if(modalOpen){
      var active=q(".tools-body>.tool-view.active",modal);
      var target=route?q('.tools-body>[data-tool-view="'+CSS.escape(route)+'"]',modal):null;
      if(!active&&target){
        try{if(typeof window.setToolView==="function")window.setToolView(route);else target.classList.add("active")}catch(_){target.classList.add("active")}
      }
      if(!q(".tools-body>.tool-view.active",modal)){
        var fallback=q(".tools-body>.tool-view",modal);
        if(fallback)fallback.classList.add("active")
      }
    }
  }

  document.body.classList.toggle("v331-player-open",playerOpen);
  if(!playerOpen&&!miniOpen){
    try{document.body.style.removeProperty("overflow")}catch(_){}
  }

  if((playerOpen||miniOpen)&&window.VSANicoPlayer){
    try{
      if(typeof window.VSANicoPlayer.syncSurface==="function")window.VSANicoPlayer.syncSurface("ui3980");
      else if(typeof window.VSANicoPlayer.ensureVisible==="function")window.VSANicoPlayer.ensureVisible()
    }catch(_){}
  }

  if(route){lastRoute=dockForRoute(route);setDock(lastRoute)}
  else if(!modal||modal.hidden){lastRoute="home";setDock("home")}
}
function scheduleRepair(){
  if(raf)return;
  raf=requestAnimationFrame(repairRoute)
}

function bind(){
  window.addEventListener("vsa:route-change",function(e){
    var route=e&&e.detail&&e.detail.route?String(e.detail.route):String(window.__VSA37_CURRENT_ROUTE||"");
    if(route){lastRoute=dockForRoute(route);setDock(lastRoute)}
    scheduleRepair()
  });
  window.addEventListener("popstate",scheduleRepair);
  window.addEventListener("pageshow",scheduleRepair);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)scheduleRepair()});
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest('a[href*="nicovideo.jp/watch/"]');
    if(a)setTimeout(scheduleRepair,80)
  },true);
  var modal=document.getElementById("toolsModal");
  if(modal&&window.MutationObserver){
    observer=new MutationObserver(scheduleRepair);
    observer.observe(modal,{attributes:true,attributeFilter:["hidden","class","data-current-view"],childList:true,subtree:true})
  }
}
function boot(){
  addStyle();ensureTopbar();ensureDock();bind();scheduleRepair();
  document.documentElement.dataset.vocaUi=VERSION;
  setTimeout(function(){ensureTopbar();ensureDock();scheduleRepair()},250);
  setTimeout(function(){ensureTopbar();ensureDock();scheduleRepair()},900)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
