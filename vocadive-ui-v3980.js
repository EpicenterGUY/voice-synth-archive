/* VocaDive Unified UI v39.79.0
 * YouTube-style app shell, cards, player continuity and route recovery.
 */
(function(){
"use strict";

var VERSION="39.79.0";
var raf=0,observer=null,lastRoute="home",navSeq3985=0;

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
body.v37-ready .topbar .status{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:7px!important;min-width:0!important;flex-wrap:nowrap!important;white-space:nowrap!important}
#v3982WorkerPill{cursor:pointer!important;user-select:none;flex:0 1 auto!important}
#v3982WorkerPill:focus-visible{outline:2px solid var(--vd-accent);outline-offset:2px}
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
.v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,#mobileSectionNav,.mobile-section-nav,.mobile-bottom-nav,.bottom-nav,.app-bottom-nav{display:none!important}
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


/* Current Home 3.x + restored Explore hub */
.v396-home-top{padding:8px 2px 14px!important}
.v396-home-top h1{font-size:30px!important;letter-spacing:-.05em!important}
.v396-home-top p{color:var(--vd-muted)!important;font-size:10px!important}
.v396-home-top-actions button,.v396-topic-row button{
 border:0!important;background:#152326!important;color:#bacbc9!important;box-shadow:none!important
}
.v396-home-top-actions button.primary{background:#e7f6f4!important;color:#071012!important}
.v396-hero{
 min-height:370px!important;margin-bottom:22px!important;border:0!important;border-radius:16px!important;
 background:var(--vd-surface)!important;box-shadow:none!important
}
.v396-hero-media{min-height:370px!important;background:#0b171a!important}
.v396-hero-media:after{background:linear-gradient(90deg,transparent 56%,rgba(7,16,18,.93) 100%),linear-gradient(0deg,rgba(4,10,12,.30),transparent 46%)!important}
.v396-hero-copy{padding:26px 24px!important;background:var(--vd-surface)!important}
.v396-hero-copy h2{font-size:28px!important;color:var(--vd-text)!important}
.v396-hero-copy>p{font-size:10px!important;color:var(--vd-muted)!important}
.v396-hero-tags span,.v396-badge{border:0!important;background:#152629!important;backdrop-filter:none!important}
.v396-hero-actions button{
 border:0!important;border-radius:999px!important;background:#17272a!important;color:#d4e4e2!important;box-shadow:none!important
}
.v396-hero-actions .primary{background:#e7f6f4!important;color:#071012!important}
.v396-continue{padding:0 0 20px!important;border:0!important;border-bottom:1px solid var(--vd-line)!important;border-radius:0!important;background:transparent!important}
.v396-continue-head h2{font-size:20px!important}
.v39-shelf{border-top:1px solid var(--vd-line)!important;padding:20px 0 26px!important}
.v39-media-grid{gap:20px 14px!important}
.v39-media-card{background:transparent!important}
.v39-thumb{border-radius:12px!important;background:#101c1f!important}
.v39-media-title{color:var(--vd-text)!important;font-size:12px!important}
.v39-media-meta{color:var(--vd-muted)!important}
.v39-media-reason{color:#75aaa4!important}
.v39-more:hover{background:#182729!important}

/* Explore is a discovery hub, not a producer-only page. */
.v3981-explore-hero{
 display:flex;align-items:end;justify-content:space-between;gap:16px;
 padding:8px 2px 20px;margin-bottom:16px;border-bottom:1px solid var(--vd-line)
}
.v3981-explore-hero small{display:block;color:var(--vd-accent);font-size:8px;font-weight:950;letter-spacing:.14em}
.v3981-explore-hero h2{margin:5px 0 5px;color:var(--vd-text);font-size:30px;letter-spacing:-.05em}
.v3981-explore-hero p{max-width:720px;margin:0;color:var(--vd-muted);font-size:10px;line-height:1.55}
.v3981-explore-hero>button,.v3981-explore-head>button{
 flex:0 0 auto;min-height:38px;padding:0 13px;border:0;border-radius:999px;background:#e7f6f4;color:#071012;font-size:9px;font-weight:950
}
.v3981-explore-section{margin-bottom:25px}
.v3981-explore-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:0 2px 10px}
.v3981-explore-head h3{margin:0;color:var(--vd-text);font-size:18px;letter-spacing:-.035em}
.v3981-explore-head p{margin:3px 0 0;color:var(--vd-muted);font-size:9px}
.v3981-explore-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
.v3981-explore-card{
 min-width:0;min-height:112px;display:grid;grid-template-columns:43px minmax(0,1fr) auto;gap:11px;align-items:center;
 padding:13px;border:1px solid var(--vd-line);border-radius:14px;background:var(--vd-surface);color:var(--vd-text);text-align:left
}
.v3981-explore-card:hover{background:var(--vd-hover);border-color:var(--vd-line-strong)}
.v3981-explore-icon{
 width:43px;height:43px;display:grid;place-items:center;border-radius:13px;background:#173136;color:#9de6de;font-size:16px;font-weight:950
}
.v3981-explore-copy{min-width:0}
.v3981-explore-copy small{display:block;color:#6faaa4;font-size:6.5px;font-weight:900;letter-spacing:.05em}
.v3981-explore-copy b{display:block;margin-top:3px;font-size:12px}
.v3981-explore-copy em{display:block;margin-top:4px;color:var(--vd-muted);font-size:8px;font-style:normal;line-height:1.4}
.v3981-explore-card>i{font-style:normal;color:#698b87;font-size:17px}
.v3981-producer-section{padding-top:18px;border-top:1px solid var(--vd-line)}
.v3981-producer-section .v397-prod-summary{margin:0 0 8px!important}
.v3981-producer-section .v397-prod-summary span{
 border:1px solid var(--vd-line)!important;border-radius:12px!important;background:#0c181b!important
}
.v3981-producer-section .v33-producer-toolbar{display:flex;gap:6px;overflow-x:auto;padding:2px 0 9px;scrollbar-width:none}
.v3981-producer-section .v33-chip{
 flex:0 0 auto;min-height:31px;padding:0 10px;border:0!important;border-radius:999px!important;background:#152326!important;color:#9eb4b1!important
}
.v3981-producer-section .v33-chip.active{background:#e7f6f4!important;color:#071012!important}
.v3981-producer-section .v397-producer-card{
 border:1px solid var(--vd-line)!important;border-radius:12px!important;background:var(--vd-surface)!important;box-shadow:none!important
}

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


/* Search/result list: YouTube-like information density */
body.v37-ready #songList.list{max-height:none!important;padding:0!important;overflow:visible!important}
body.v37-ready #songList .song{
 position:relative!important;display:grid!important;grid-template-columns:34px 156px minmax(0,1fr) auto!important;
 gap:11px!important;align-items:center!important;padding:10px 2px!important;
 border:0!important;border-bottom:1px solid var(--vd-line)!important;border-radius:0!important;background:transparent!important
}
body.v37-ready #songList .song:hover{background:#0b171a!important}
body.v37-ready #songList .rank{font-size:11px!important;font-weight:900!important;color:#77928f!important;text-align:center!important}
body.v37-ready #songList .thumb{
 width:156px!important;height:88px!important;aspect-ratio:16/9!important;border-radius:10px!important;object-fit:cover!important;background:#101c1f!important
}
body.v37-ready #songList .song-title{
 display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden!important;
 color:var(--vd-text)!important;font-size:13px!important;line-height:1.35!important;font-weight:850!important
}
body.v37-ready #songList .meta{margin-top:5px!important;gap:7px!important;color:var(--vd-muted)!important;font-size:8.5px!important}
body.v37-ready #songList .views{min-width:72px!important;color:#d9e7e5!important;font-size:12px!important;text-align:right!important}
body.v37-ready #songList .views small{color:var(--vd-muted)!important;font-size:7px!important}
body.v37-ready #songList .rankbox{margin-top:6px!important;gap:4px!important}
body.v37-ready #songList .rankchip{
 min-height:22px!important;padding:0 7px!important;border:0!important;border-radius:999px!important;
 background:#132326!important;color:#aebfbd!important;font-size:7.5px!important
}
body.v37-ready #songList .rank-note{margin-top:5px!important;color:#657c79!important;font-size:7px!important;line-height:1.4!important}
body.v37-ready #songList .song-actions{margin-top:7px!important;gap:5px!important}
body.v37-ready #songList .mini-btn{
 min-height:29px!important;padding:0 9px!important;border:0!important;border-radius:999px!important;
 background:#152629!important;color:#c7d9d6!important;font-size:8px!important
}
body.v37-ready #songList .mini-btn:last-child{background:#17373c!important;color:#e4fbf7!important}
body.v37-ready #songList+.loadmore{
 width:100%!important;margin:10px 0!important;border:0!important;border-radius:12px!important;background:#142326!important;color:#dceae8!important
}
@media(max-width:699px){
 body.v37-ready #songList .song{
   grid-template-columns:24px 104px minmax(0,1fr)!important;gap:8px!important;padding:9px 0!important;align-items:start!important
 }
 body.v37-ready #songList .rank{font-size:9px!important;padding-top:4px!important}
 body.v37-ready #songList .thumb{width:104px!important;height:59px!important;border-radius:8px!important}
 body.v37-ready #songList .song-title{font-size:10.5px!important;line-height:1.3!important}
 body.v37-ready #songList .meta{margin-top:3px!important;font-size:7px!important;gap:4px!important}
 body.v37-ready #songList .meta span:nth-child(n+3){display:none!important}
 body.v37-ready #songList .views{
   grid-column:3!important;min-width:0!important;margin-top:3px!important;text-align:left!important;font-size:9px!important
 }
 body.v37-ready #songList .views small{display:inline!important;margin-left:3px!important;font-size:6.5px!important}
 body.v37-ready #songList .rankbox{margin-top:4px!important}
 body.v37-ready #songList .rankchip:nth-child(n+3){display:none!important}
 body.v37-ready #songList .rank-note{display:none!important}
 body.v37-ready #songList .song-actions{margin-top:5px!important;flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important}
 body.v37-ready #songList .mini-btn{flex:0 0 auto!important;min-height:27px!important;padding:0 8px!important;font-size:7px!important}
}

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


#v3982Menu{
 position:fixed;z-index:100200;top:58px;right:10px;width:min(280px,calc(100vw - 20px));
 padding:7px;border:1px solid var(--vd-line);border-radius:14px;background:#0a1518;
 box-shadow:0 18px 50px rgba(0,0,0,.46);backdrop-filter:blur(16px)
}
#v3982Menu[hidden]{display:none!important}
#v3982Menu button{
 width:100%;min-height:44px;display:grid;grid-template-columns:31px minmax(0,1fr) auto;gap:9px;align-items:center;
 padding:0 10px;border:0;border-radius:10px;background:transparent;color:var(--vd-text);text-align:left
}
#v3982Menu button:hover{background:#142326}
#v3982Menu button i{width:31px;height:31px;display:grid;place-items:center;border-radius:9px;background:#15272a;color:#9fe6de;font-style:normal}
#v3982Menu button b{font-size:10px}
#v3982Menu button small{display:block;margin-top:2px;color:var(--vd-muted);font-size:7px;font-weight:600}
#v3982Menu button em{font-style:normal;color:#6f8d89;font-size:12px}
#v3982WorkerPill[data-state="live"]{border-color:rgba(86,211,174,.28)!important;color:#a9e9d3!important}
#v3982WorkerPill[data-state="warn"]{border-color:rgba(224,183,92,.28)!important;color:#ead18a!important}
#v3982WorkerPill[data-state="err"]{border-color:rgba(225,112,130,.28)!important;color:#efadb7!important}
#v3982WorkerPill .dot{width:6px!important;height:6px!important}
#v3982MenuBtn{flex:0 0 auto!important}

#v3982WorkerPill{cursor:pointer!important;user-select:none!important}
.v3983-settings-summary{
 display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px!important
}
.v3983-settings-summary button{
 min-width:0;min-height:86px;padding:12px;border:1px solid var(--vd-line);border-radius:13px;
 background:var(--vd-surface);color:var(--vd-text);text-align:left
}
.v3983-settings-summary button:hover{background:var(--vd-hover);border-color:var(--vd-line-strong)}
.v3983-settings-summary small{display:block;color:#6fa9a3;font-size:6.5px;font-weight:950;letter-spacing:.11em}
.v3983-settings-summary b{display:block;margin-top:5px;font-size:12px}
.v3983-settings-summary span{display:block;margin-top:4px;color:var(--vd-muted);font-size:7.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

#v3982WorkerPill:hover{background:#132427!important}
[data-tool-view="settings29"] .settings{display:block!important}
[data-tool-view="settings29"] .settings>details{display:block!important;border:0!important;background:transparent!important}
[data-tool-view="settings29"] .settings>details>summary{display:none!important}
[data-tool-view="settings29"] .settings-grid{
 display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important
}
[data-tool-view="settings29"] .settings-grid>.control,
[data-tool-view="settings29"] .settings-grid>.help,
[data-tool-view="settings29"] #v3966UpdateCard{
 margin:0!important;padding:14px!important;border:1px solid var(--vd-line)!important;border-radius:14px!important;
 background:var(--vd-surface)!important;box-shadow:none!important
}
[data-tool-view="settings29"] #v3966UpdateCard{grid-column:1/-1!important}
[data-tool-view="settings29"] .route-info{
 margin-top:9px!important;padding:10px!important;border-radius:10px!important;background:#091517!important;color:#95aaa7!important
}
#v3983SurfaceNotice{
 position:fixed;z-index:30010;left:50%;bottom:calc(var(--vd-dock-h) + 88px + env(safe-area-inset-bottom));
 transform:translateX(-50%);padding:7px 10px;border:1px solid var(--vd-line);border-radius:999px;
 background:#0b181b;color:#c8ddda;font-size:8px;font-weight:800;box-shadow:0 10px 28px rgba(0,0,0,.34)
}
@media(max-width:699px){
 .v3983-settings-summary{grid-template-columns:1fr!important}
 [data-tool-view="settings29"] .settings-grid{grid-template-columns:1fr!important}
 [data-tool-view="settings29"] #v3966UpdateCard{grid-column:auto!important}
 [data-tool-view="settings29"] .settings-grid>.control,
 [data-tool-view="settings29"] .settings-grid>.help,
 [data-tool-view="settings29"] #v3966UpdateCard{padding:11px!important;border-radius:12px!important}
}

/* General motion restraint: interaction stays crisp. */
body.v37-ready *{scrollbar-color:#34504e transparent}
body.v37-ready :is(button,a){-webkit-tap-highlight-color:transparent}
@media(max-width:899px){
 body.v37-ready>.app>.topbar{
  grid-template-columns:auto minmax(0,1fr) auto!important;gap:8px!important;padding:8px 10px!important
 }
 body.v37-ready .topbar .status>.pill:first-child{display:inline-flex!important}
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
  grid-template-columns:minmax(0,1fr) auto!important;
  grid-template-areas:"brand status" "search search"!important;
  align-items:center!important;gap:7px 8px!important;
  margin:0 -10px 8px!important;padding:8px 10px 10px!important;border-radius:0!important
 }
 body.v37-ready>.app>.topbar>.brand{grid-area:brand!important}
 body.v37-ready>.app>.topbar>.status{grid-area:status!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important}
 body.v37-ready>.app>.topbar>.v39-global-search,
 body.v37-ready>.app>.topbar>#v3980SearchForm{grid-area:search!important;width:100%!important;order:initial!important}
 body.v37-ready .topbar .status>.pill:first-child{
   display:inline-flex!important;min-height:30px!important;max-width:126px!important;padding:0 8px!important;
   overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;
   border:1px solid var(--vd-line)!important;border-radius:999px!important;background:#0d1b1e!important;
   color:#a9bfbc!important;font-size:7px!important
 }
 body.v37-ready .topbar .status>#snapshotLabel,
 body.v37-ready .topbar .status>#openToolsBtn{display:none!important}
 body.v37-ready .topbar .status>.pill:first-child .dot{flex:0 0 auto!important}
 .v39-global-search{
   height:44px!important;padding:4px 5px 4px 11px!important;border-radius:12px!important;
   background:#0a1518!important;box-shadow:none!important
 }
 .v39-global-search input{font-size:11px!important}
 .v39-global-search button{
   min-width:58px!important;height:36px!important;padding:0 10px!important;border-radius:9px!important;
   background:#183239!important;font-size:9px!important
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
@media(max-width:899px){
 .v3981-explore-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:699px){
 .v396-hero{min-height:0!important;border-radius:12px!important}
 .v396-hero-media{min-height:230px!important}
 .v396-hero-copy{padding:16px 13px!important}
 .v396-hero-copy h2{font-size:22px!important}
 .v39-media-grid{display:flex!important;overflow-x:auto!important;gap:12px!important;scroll-snap-type:x proximity}
 .v39-media-card{flex:0 0 min(78vw,300px)!important;scroll-snap-align:start}
 .v3981-explore-hero{align-items:flex-start;flex-direction:column;padding-top:4px}
 .v3981-explore-hero h2{font-size:25px}
 .v3981-explore-hero>button{width:100%}
 .v3981-explore-grid{grid-template-columns:1fr;gap:7px}
 .v3981-explore-card{min-height:88px;padding:10px}
 .v3981-explore-icon{width:39px;height:39px}
 .v3981-explore-copy b{font-size:11px}
 .v3981-explore-copy em{font-size:7.5px}
 .v3981-producer-section .v397-producer-grid{grid-template-columns:1fr!important}
}

/* Fold / compact viewport recovery · v39.78 */
@media(min-width:700px) and (max-width:1099px){
 body.v37-ready>.app>.topbar{grid-template-columns:auto minmax(240px,1fr) auto!important;grid-template-areas:"brand search status"!important;align-items:center!important}
 body.v37-ready>.app>.topbar>.brand{grid-area:brand!important}
 body.v37-ready>.app>.topbar>.v39-global-search,body.v37-ready>.app>.topbar>#v3980SearchForm{grid-area:search!important;width:100%!important;min-width:0!important}
 body.v37-ready>.app>.topbar>.status{grid-area:status!important;flex-wrap:nowrap!important;max-width:100%!important}
 body.v37-ready .topbar #v3918LangSwitch .v3918-lang-full{display:none!important}
 body.v37-ready .topbar #v3918LangSwitch .v3918-lang-short{display:inline!important}
 body.v37-ready .topbar .v3911-theme-toggle span{display:none!important}
}
@media(max-width:699px){
 body.v37-ready>.app>.topbar>.status{flex-wrap:nowrap!important;white-space:nowrap!important;overflow:visible!important;min-width:0!important}
 #v3982WorkerPill{max-width:112px!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important}
 #v3918LangSwitch{flex:0 0 auto!important}
 body.v37-ready .topbar .v3911-theme-toggle{flex:0 0 auto!important;min-width:32px!important;width:32px!important;padding:0!important;overflow:hidden!important}
 body.v37-ready .topbar .v3911-theme-toggle span{display:none!important}
 #v3980MenuBtn{flex:0 0 34px!important}
 body.v37-ready .main,body.v37-ready #resultsPanel,body.v37-ready #resultsPanel .list,body.v37-ready #songList{width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important}
 body.v37-ready #songList .song{width:100%!important;max-width:none!important;min-width:0!important;grid-template-columns:104px minmax(0,1fr)!important;grid-template-rows:auto auto!important;gap:5px 10px!important;padding:10px 0!important;align-items:start!important}
 body.v37-ready #songList .rank{position:absolute!important;z-index:3!important;left:5px!important;top:5px!important;width:auto!important;min-width:0!important;padding:3px 6px!important;border-radius:999px!important;background:rgba(4,18,22,.84)!important;color:#d9eeeb!important;font-size:7px!important;line-height:1!important}
 body.v37-ready #songList .thumb{grid-column:1!important;grid-row:1 / span 2!important;width:104px!important;height:59px!important;min-width:104px!important}
 body.v37-ready #songList .song>div:not(.rank):not(.views){grid-column:2!important;grid-row:1!important;min-width:0!important;width:100%!important}
 body.v37-ready #songList .views{grid-column:2!important;grid-row:2!important;min-width:0!important;margin:0!important;text-align:left!important;font-size:9px!important}
 body.v37-ready #songList .song-actions{max-width:100%!important;min-width:0!important;flex-wrap:wrap!important;overflow:visible!important}
 body.v37-ready #songList .mini-btn{min-width:0!important}
}
@media(max-width:420px){
 body.v37-ready #songList .song{grid-template-columns:94px minmax(0,1fr)!important;gap:5px 8px!important}
 body.v37-ready #songList .thumb{width:94px!important;height:53px!important;min-width:94px!important}
 body.v37-ready #songList .song-title{font-size:10.5px!important}
}
@media(prefers-reduced-motion:reduce){
 *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;
  document.head.appendChild(s)
}

function syncWorkerPill(){
  var old=q(".topbar .status>.pill:first-child"),txt=q("#statusText"),dot=q("#statusDot");
  if(!old)return;
  old.id="v3982WorkerPill";
  var text=String(txt&&txt.textContent||"").trim();
  var state=/연결됨|저장됨|live/i.test(text)?"live":/실패|오프라인|error/i.test(text)?"err":"warn";
  old.dataset.state=state;
  old.title=text||"Worker 상태";
  if(dot&&!dot.className.includes("dot"))dot.classList.add("dot")
}
function cleanupLegacyNav(){
  qa(".v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,.mobile-bottom-nav,.bottom-nav,.app-bottom-nav").forEach(function(el){
    if(el&&el.id!=="v3980Dock")try{el.remove()}catch(_){el.style.display="none"}
  });
  var top=q(".app>.topbar");
  if(top){
    var nativeSearch=q(".v39-global-search",top);
    if(nativeSearch){
      qa("#v3980SearchForm",top).forEach(function(x){x.remove()});
      qa(".status button",top).forEach(function(btn){
        if(btn.id==="v3980MenuBtn"||btn.classList.contains("v3911-theme-toggle"))return;
        var t=(btn.getAttribute("aria-label")||"")+" "+(btn.textContent||"")+" "+(btn.className||"");
        if(/검색|search/i.test(t))btn.remove()
      })
    }
  }
}
function closeMenu3982(){
  var m=document.getElementById("v3982Menu");if(m)m.hidden=true
}
function openSettings3982(){
  closeMenu3982();
  try{
    if(typeof window.ensureCorePages37==="function")window.ensureCorePages37();
    else if(typeof window.openToolsModal==="function"){
      window.openToolsModal("settings29");setTimeout(openSettingsDetails3983,30);scheduleRepair();return
    }
  }catch(_){}
  openRoute("settings29").then(function(){setTimeout(openSettingsDetails3983,30)})
}
function focusWorkerInput3984(){
  var page=document.querySelector('[data-tool-view="settings29"]'),panel=document.getElementById("settingsPanel");
  if(page)qa("details",page).forEach(function(d){d.open=true});
  if(panel){
    var d=panel.closest("details");if(d)d.open=true;
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  }
  var x=document.getElementById("proxyInput");
  if(x){
    try{x.focus({preventScroll:true})}catch(_){try{x.focus()}catch(__){}}
    try{x.select()}catch(_){}
    x.scrollIntoView({behavior:"smooth",block:"center"});
    return true
  }
  return false
}
function openWorkerSettings3984(){
  openSettings3982();
  [70,220,520].forEach(function(ms){setTimeout(function(){openSettingsDetails3983();focusWorkerInput3984()},ms)})
}
function openSettingsDetails3983(){
  var page=document.querySelector('[data-tool-view="settings29"]');
  if(!page)return;
  qa("details",page).forEach(function(d){d.open=true});
  var summary=document.getElementById("v3983SettingsSummary");
  if(!summary){
    summary=document.createElement("section");summary.id="v3983SettingsSummary";summary.className="v3983-settings-summary";
    var head=page.querySelector(".v37-native-head");
    if(head)head.insertAdjacentElement("afterend",summary);else page.prepend(summary)
  }
  var worker=String((document.getElementById("statusText")||{}).textContent||"상태 확인 중");
  var workerState=/연결됨/i.test(worker)?"정상":/실패/i.test(worker)?"오류":/저장됨/i.test(worker)?"미확인":"설정 필요";
  var shell="",web=VERSION;
  try{
    var st=window.VocaDiveUpdater&&window.VocaDiveUpdater.state?window.VocaDiveUpdater.state():null;
    shell=st&&st.appInfo&&st.appInfo.versionName?String(st.appInfo.versionName):"";
  }catch(_){}
  var autoNext=true;try{autoNext=localStorage.getItem("vsa.player.autoNext")!=="0"}catch(_){}
  try{if(window.VSANicoPlayer&&VSANicoPlayer.getAutoNext)autoNext=!!VSANicoPlayer.getAutoNext()}catch(_){}
  summary.innerHTML=
   '<button type="button" data-v3983-setting="worker"><small>WORKER</small><b>'+esc(workerState)+'</b><span>'+esc(worker)+'</span></button>'+
   '<button type="button" data-v3983-setting="autonext" aria-pressed="'+(autoNext?"true":"false")+'"><small>PLAYER</small><b>다음 곡 자동재생 '+(autoNext?"켬":"끔")+'</b><span>곡이 끝나면 재생 큐의 다음 곡으로 자동 이동</span></button>'+
   '<button type="button" data-v3983-setting="web"><small>WEB UI</small><b>v'+esc(web)+'</b><span>Live Shell 최신 UI</span></button>'+
   '<button type="button" data-v3983-setting="app"><small>APP SHELL</small><b>'+(shell?"v"+esc(shell):"확인 중")+'</b><span>Android 네이티브 셸</span></button>';
  if(!summary.dataset.bound){
    summary.dataset.bound="1";
    summary.addEventListener("click",function(e){
      var b=e.target.closest("[data-v3983-setting]");if(!b)return;
      var v=b.dataset.v3983Setting;
      if(v==="worker"){
        openWorkerSettings3984()
      }else if(v==="autonext"){
        var next=true;try{next=localStorage.getItem("vsa.player.autoNext")==="0"}catch(_){}
        try{
          if(window.VSANicoPlayer&&VSANicoPlayer.getAutoNext)next=!VSANicoPlayer.getAutoNext();
          if(window.VSANicoPlayer&&VSANicoPlayer.setAutoNext)VSANicoPlayer.setAutoNext(next,false);
          else{
            localStorage.setItem("vsa.player.autoNext",next?"1":"0");
            window.dispatchEvent(new CustomEvent("vsa:player-autonext",{detail:{enabled:next}}));
            if(typeof toast==="function")toast(next?"다음 곡 자동재생을 켰습니다.":"다음 곡 자동재생을 껐습니다.")
          }
        }catch(_){}
        setTimeout(openSettingsDetails3983,0)
      }else if(v==="web"){
        if(window.VocaDiveUpdater&&window.VocaDiveUpdater.applyWebUpdate)window.VocaDiveUpdater.applyWebUpdate()
      }else{
        var c=document.getElementById("v3966UpdateCard");if(c)c.scrollIntoView({behavior:"smooth",block:"center"})
      }
    })
  }
  try{
    if(window.VocaDiveUpdater&&typeof window.VocaDiveUpdater.state==="function"){
      var card=document.getElementById("v3966UpdateCard");
      if(card&&card.parentElement)card.parentElement.appendChild(card)
    }
  }catch(_){}
}
function ensureMenu3982(){
  var m=document.getElementById("v3982Menu");
  if(m)return m;
  m=document.createElement("div");m.id="v3982Menu";m.hidden=true;
  m.innerHTML=
    '<button type="button" data-v3982="settings"><i>⚙</i><span><b>설정</b><small>Worker · 앱 업데이트 · 기기 동기화</small></span><em>›</em></button>'+
    '<button type="button" data-v3982="update"><i>↻</i><span><b>업데이트</b><small>웹 UI 최신본 적용 / APK 확인</small></span><em>›</em></button>'+
    '<button type="button" data-v3982="diagnostics"><i>＋</i><span><b>진단 센터</b><small>라우팅 · 모듈 · 서비스워커 상태</small></span><em>›</em></button>';
  document.body.appendChild(m);
  m.addEventListener("click",function(e){
    var b=e.target.closest("button[data-v3982]");if(!b)return;
    var v=b.dataset.v3982;
    if(v==="settings"){openSettings3982();return}
    if(v==="diagnostics"){closeMenu3982();openRoute("diagnostics37");return}
    if(v==="update"){
      closeMenu3982();
      if(window.VocaDiveUpdater&&window.VocaDiveUpdater.applyWebUpdate){window.VocaDiveUpdater.applyWebUpdate();return}
      openSettings3982()
    }
  });
  return m
}

var navObserver3983=null,playerHealAt3983=0;
function watchLegacyNav3983(){
  if(navObserver3983||!window.MutationObserver||!document.body)return;
  navObserver3983=new MutationObserver(function(muts){
    var needs=false;
    for(var i=0;i<muts.length&&!needs;i++){
      var added=muts[i].addedNodes||[];
      for(var j=0;j<added.length;j++){
        var n=added[j];
        if(n&&n.nodeType===1){
          if(n.matches&&n.matches(".v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,.mobile-bottom-nav,.bottom-nav,.app-bottom-nav,.mobile-section-nav"))needs=true;
          else if(n.querySelector&&n.querySelector(".v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,.mobile-bottom-nav,.bottom-nav,.app-bottom-nav,.mobile-section-nav"))needs=true
        }
      }
    }
    if(needs){cleanupLegacyNav();ensureDock()}
  });
  navObserver3983.observe(document.body,{childList:true,subtree:true})
}
function healMissingPlayer3983(){
  if(!window.VSANicoPlayer||typeof window.VSANicoPlayer.state!=="function")return false;
  var st=null;try{st=window.VSANicoPlayer.state()}catch(_){return false}
  if(!st||!st.currentId)return false;
  if(st.full||st.mini||st.inline)return false;
  var now=Date.now();if(now-playerHealAt3983<800)return false;playerHealAt3983=now;
  try{
    if(typeof window.VSANicoPlayer.ensureVisible==="function"){
      var ok=window.VSANicoPlayer.ensureVisible();
      if(ok){
        var old=document.getElementById("v3983SurfaceNotice");if(old)old.remove();
        var n=document.createElement("div");n.id="v3983SurfaceNotice";n.textContent="재생 화면을 복구했습니다";
        document.body.appendChild(n);setTimeout(function(){if(n&&n.remove)n.remove()},1300)
      }
      return !!ok
    }
  }catch(_){}
  return false
}
function ensureTopbar(){
  var top=q(".app>.topbar");if(!top)return;
  var brand=q(".brand h1",top);if(brand)brand.textContent="VocaDive";
  var nativeSearch=q(".v39-global-search",top),form=document.getElementById("v3980SearchForm");
  if(nativeSearch){
    if(form)form.remove();
  }else if(!form){
    form=document.createElement("form");form.id="v3980SearchForm";form.setAttribute("role","search");
    form.innerHTML='<input id="v3980SearchInput" autocomplete="off" placeholder="곡명 · P명 · 보컬 · 태그 검색" aria-label="VocaDive 검색"><button id="v3980SearchBtn" type="submit" aria-label="검색">⌕</button>';
    var status=q(".status",top);if(status)top.insertBefore(form,status);else top.appendChild(form);
    form.addEventListener("submit",function(e){e.preventDefault();runSearch(q("#v3980SearchInput").value)})
  }
  var status=q(".status",top);
  if(status&&!document.getElementById("v3980MenuBtn")){
    var b=document.createElement("button");b.type="button";b.id="v3980MenuBtn";b.textContent="⋮";b.setAttribute("aria-label","설정 및 전체 메뉴");
    b.addEventListener("click",function(e){
      e.preventDefault();e.stopPropagation();
      var m=ensureMenu3982();m.hidden=!m.hidden
    });
    status.appendChild(b)
  }
  ensureMenu3982();cleanupLegacyNav();syncWorkerPill();
  var wp=document.getElementById("v3982WorkerPill");
  if(wp&&!wp.dataset.v3983Bound){
    wp.dataset.v3983Bound="1";wp.setAttribute("role","button");wp.tabIndex=0;
    var open=function(){openWorkerSettings3984()};
    wp.addEventListener("click",open);
    wp.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}})
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
    else if(v==="explore")openRoute("hub37");
    else if(v==="dive")openDive3985();
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
  if(["personal395","taste","tasteHub33","smart23","playlist24","libraryHub33","library22","saved","history"].includes(route))return"library";
  if(["hub37","explore33","searchHub33","search29","producerDiscover37","producerDetail33","vocalRank37","archive29","detective","gems","guide"].includes(route))return"explore";
  return lastRoute||"home"
}

function activeToolRoute3985(){
  var modal=document.getElementById("toolsModal");
  if(!modal||modal.hidden)return"";
  var active=q(".tools-body>.tool-view.active",modal);
  return String(active&&active.dataset&&active.dataset.toolView||modal.dataset.currentView||"")
}
function routeIsActive3985(name){
  name=String(name||"");
  var modal=document.getElementById("toolsModal");
  if(!modal||modal.hidden)return false;
  var active=activeToolRoute3985();
  return active===name&&String(window.__VSA37_CURRENT_ROUTE||active)===name
}
function forceRoute3985(name){
  name=String(name||"");
  try{if(typeof window.ensureCorePages37==="function")window.ensureCorePages37()}catch(_){}
  try{
    if(typeof window.setToolView==="function"&&window.setToolView(name)!==false)return routeIsActive3985(name)
  }catch(_){}
  var modal=document.getElementById("toolsModal"),target=modal&&q('.tools-body>[data-tool-view="'+CSS.escape(name)+'"]',modal);
  if(!modal||!target)return false;
  qa(".tools-body>.tool-view",modal).forEach(function(v){
    var on=v===target;v.classList.toggle("active",on);v.hidden=!on;
    if(on)v.style.removeProperty("display");else v.style.setProperty("display","none","important")
  });
  modal.hidden=false;modal.dataset.currentView=name;document.body.classList.add("tools-open");
  window.__VSA37_CURRENT_ROUTE=name;
  try{window.dispatchEvent(new CustomEvent("vsa:route-change",{detail:{route:name}}))}catch(_){}
  return true
}
function verifyRoute3985(name,ticket){
  if(ticket!=null&&ticket!==navSeq3985)return false;
  if(routeIsActive3985(name))return true;
  return forceRoute3985(name)
}
function openDive3985(){
  var ticket=++navSeq3985;
  setDock("dive");
  try{
    if(typeof window.openUniverseHub3931==="function"){
      return Promise.resolve(window.openUniverseHub3931()).then(function(){
        if(ticket!==navSeq3985)return false;
        [0,80,240].forEach(function(ms){setTimeout(function(){verifyRoute3985("universe29",ticket);if(ticket===navSeq3985)setDock("dive")},ms)});
        return true
      }).catch(function(){return openRoute("universe29",ticket)})
    }
  }catch(_){}
  return openRoute("universe29",ticket)
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
    if(window.VSAV33&&window.VSAV33.openView&&(name==="explore33"||name==="searchHub33"||name==="libraryHub33"||name==="tasteHub33")){
      window.VSAV33.openView(name);return true
    }
    if(typeof window.openToolsModal==="function"){
      window.openToolsModal(name);
      if(routeIsActive3985(name))return true;
      return forceRoute3985(name)
    }
  }catch(_){}
  return false
}
function openRoute(name,existingTicket){
  name=String(name||"");
  var ticket=existingTicket==null?++navSeq3985:existingTicket;
  var needsV33=/^(explore33|searchHub33|libraryHub33|tasteHub33)$/.test(name);
  var job=needsV33?ensureV33():Promise.resolve(true);
  return job.then(function(ok){
    if(ticket!==navSeq3985)return false;
    if(needsV33&&!ok){
      if(name==="searchHub33")name="search29";
      else if(name==="libraryHub33")name="library22";
      else if(name==="tasteHub33")name="taste";
      else name="hub37"
    }
    try{if(typeof window.ensureCorePages37==="function")window.ensureCorePages37()}catch(_){}
    var opened=openRaw(name);
    if(!opened&&name!=="hub37"){name="hub37";opened=openRaw(name)}
    if(ticket!==navSeq3985)return false;
    verifyRoute3985(name,ticket);
    lastRoute=dockForRoute(name);setDock(lastRoute);scheduleRepair();
    setTimeout(function(){if(ticket===navSeq3985){verifyRoute3985(name,ticket);lastRoute=dockForRoute(name);setDock(lastRoute)}},90);
    return !!opened
  }).catch(function(){
    if(ticket!==navSeq3985)return false;
    try{openRaw("hub37");verifyRoute3985("hub37",ticket);lastRoute="explore";setDock("explore")}catch(_){}
    scheduleRepair();return false
  })
}
function openLibrary(){
  ++navSeq3985;
  try{
    if(window.VSA332Library&&window.VSA332Library.open){window.VSA332Library.open();lastRoute="library";setDock("library");scheduleRepair();return}
    if(window.VSAOrganizer22&&window.VSAOrganizer22.openLibrary){window.VSAOrganizer22.openLibrary("saved");lastRoute="library";setDock("library");scheduleRepair();return}
  }catch(_){}
  openRoute("libraryHub33")
}
function goHome(){
  ++navSeq3985;
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

function raiseStyle(){
  var st=document.getElementById("v3980UnifiedUiStyle");
  if(st&&st.parentNode===document.head&&st!==document.head.lastElementChild)document.head.appendChild(st)
}
function repairRoute(){
  raf=0;raiseStyle();cleanupLegacyNav();syncWorkerPill();
  var modal=document.getElementById("toolsModal");
  var route=String(window.__VSA37_CURRENT_ROUTE||"");
  var activeRoute=activeToolRoute3985();
  if(modal&&!modal.hidden&&activeRoute&&activeRoute!==route){
    var declaredTarget=route?q('.tools-body>[data-tool-view="'+CSS.escape(route)+'"]',modal):null;
    if(declaredTarget){forceRoute3985(route);activeRoute=route}
    else{route=activeRoute;window.__VSA37_CURRENT_ROUTE=activeRoute}
  }
  var player=q(".v331-player"),mini=q(".v331-mini");
  var playerOpen=!!(player&&!player.hidden);
  var miniOpen=!!(mini&&!mini.hidden);

  if(modal){
    var modalOpen=!modal.hidden;
    document.body.classList.toggle("tools-open",modalOpen);
    if(modalOpen){
      var active=q(".tools-body>.tool-view.active",modal);
      var target=route?q('.tools-body>[data-tool-view="'+CSS.escape(route)+'"]',modal):null;
      if(route&&!target){
        try{if(typeof window.ensureCorePages37==="function")window.ensureCorePages37()}catch(_){}
        target=q('.tools-body>[data-tool-view="'+CSS.escape(route)+'"]',modal);
        if(!target&&route!=="hub37"){
          route="hub37";window.__VSA37_CURRENT_ROUTE="hub37";
          target=q('.tools-body>[data-tool-view="hub37"]',modal)
        }
      }
      if(target&&active!==target){
        try{if(typeof window.setToolView==="function")window.setToolView(route);else{
          qa(".tools-body>.tool-view",modal).forEach(function(v){v.classList.toggle("active",v===target);v.hidden=v!==target});
        }}catch(_){target.classList.add("active");target.hidden=false}
      }
      if(!q(".tools-body>.tool-view.active",modal)){
        var fallback=q('.tools-body>[data-tool-view="hub37"]',modal)||q('.tools-body>[data-tool-view="explore33"]',modal)||q(".tools-body>.tool-view",modal);
        if(fallback){
          try{if(typeof window.setToolView==="function"&&fallback.dataset.toolView)window.setToolView(fallback.dataset.toolView);else fallback.classList.add("active")}catch(_){fallback.classList.add("active")}
        }
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
  }else{
    healMissingPlayer3983()
  }
  if(route==="settings29")openSettingsDetails3983();

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
  window.addEventListener("vsa:worker-status",function(){setTimeout(function(){syncWorkerPill();scheduleRepair()},0)});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)scheduleRepair()});
  document.addEventListener("click",function(e){
    var m=document.getElementById("v3982Menu"),b=document.getElementById("v3980MenuBtn");
    if(m&&!m.hidden&&!m.contains(e.target)&&e.target!==b)closeMenu3982()
  },true);
  var statusText=document.getElementById("statusText");
  if(statusText&&window.MutationObserver)new MutationObserver(syncWorkerPill).observe(statusText,{childList:true,subtree:true,characterData:true});
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
  addStyle();ensureTopbar();ensureDock();watchLegacyNav3983();bind();scheduleRepair();
  document.documentElement.dataset.vocaUi=VERSION;
  setTimeout(function(){ensureTopbar();ensureDock();cleanupLegacyNav();scheduleRepair()},250);
  setTimeout(function(){ensureTopbar();ensureDock();cleanupLegacyNav();scheduleRepair()},900);
  setTimeout(function(){ensureTopbar();ensureDock();cleanupLegacyNav();scheduleRepair()},2200)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
