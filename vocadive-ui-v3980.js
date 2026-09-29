/* VocaDive Unified UI v39.115.0
 * YouTube-style app shell, cards, player continuity and route recovery.
 */
(function(){
"use strict";

var VERSION="39.115.0";
var raf=0,observer=null,lastRoute="home",navSeq3985=0,workerCheckTimer3986=0;
var workerState3986={ok:null,reason:"",endpoint:"",at:0};

function q(sel,root){return (root||document).querySelector(sel)}
function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}

function addStyle(){
  if(document.getElementById("v3980UnifiedUiStyle"))return;
  var s=document.createElement("style");
  s.id="v3980UnifiedUiStyle";
  s.textContent=`
:root{
 --vd-bg:#091113;
 --vd-surface:#10191b;
 --vd-surface-2:#152124;
 --vd-elevated:#182326;
 --vd-control:#0d1618;
 --vd-hover:#1a2729;
 --vd-line:rgba(192,211,209,.10);
 --vd-line-strong:rgba(151,202,196,.22);
 --vd-text:#eef4f3;
 --vd-muted:#91a3a1;
 --vd-soft:#819491;
 --vd-accent:#63d8cf;
 --vd-accent-2:#7a8ef2;
 --vd-success:#58c7a7;
 --vd-warning:#d7b66b;
 --vd-danger:#d97882;
 --vd-danger-bg:#1b1517;
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
 position:fixed;z-index:23500;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));pointer-events:auto;
 left:12px;right:12px;bottom:max(8px,env(safe-area-inset-bottom));
 min-height:var(--vd-dock-h);padding:5px;gap:3px;
 border:1px solid rgba(176,224,219,.16);border-radius:20px;
 background:rgba(8,19,22,.96);box-shadow:0 14px 38px rgba(0,0,0,.38);
 backdrop-filter:blur(16px);transition:transform .18s ease,opacity .18s ease
}
#v3980Dock button{
 min-width:0;min-height:56px;border:0;border-radius:15px;background:transparent;color:#819996;
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
 font-size:8px;font-weight:800;cursor:pointer
}
#v3980Dock button i{font-style:normal;font-size:18px;line-height:1}
#v3980Dock button.active,#v3980Dock button[aria-current="page"]{background:#17343a;color:#f1fffd}
#v3980Dock button.active i,#v3980Dock button[aria-current="page"] i{color:var(--vd-accent)}
#v3980Dock button.loading{cursor:wait;opacity:.78}
#v3980Dock button.loading i{animation:v3984DockPulse .72s ease-in-out infinite alternate}
@keyframes v3984DockPulse{from{transform:scale(.84);opacity:.55}to{transform:scale(1.08);opacity:1}}
body.v331-player-open #v3980Dock{display:none!important}
body.v3986-keyboard #v3980Dock{transform:translateY(calc(100% + 24px));opacity:0;pointer-events:none}

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

/* Dive-first Home · v39.89 */
.v3989-home-meta{
 display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px;color:var(--vd-soft)
}
.v3989-home-meta small{font-size:7px;font-weight:900;letter-spacing:.12em}
.v3989-home-meta button{
 min-height:31px;padding:0 10px;border:0;border-radius:999px;background:#142326;color:#b7cbc8;font-size:7.5px;font-weight:900
}
.v3989-dive-entry{
 position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(330px,.85fr);gap:18px;align-items:end;
 min-height:282px;margin-bottom:18px;padding:24px;border:1px solid rgba(119,223,213,.15);border-radius:22px;
 background:
 radial-gradient(circle at 8% 0%,rgba(83,220,207,.14),transparent 34%),
 radial-gradient(circle at 90% 18%,rgba(103,123,232,.16),transparent 36%),
 linear-gradient(155deg,#09252e 0%,#071820 54%,#050e16 100%);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.025)
}
.v3989-dive-entry:after{
 content:"";position:absolute;left:-8%;right:-8%;bottom:-72px;height:150px;border-radius:50%;
 border:1px solid rgba(102,219,208,.08);box-shadow:0 -20px 80px rgba(47,157,168,.06);pointer-events:none
}
.v3989-dive-entry-copy{position:relative;z-index:1;max-width:760px}
.v3989-dive-entry-copy>small{display:block;color:#75ded4;font-size:8px;font-weight:950;letter-spacing:.14em}
.v3989-dive-entry-copy h1{margin:7px 0 8px;color:#f2fffd;font-size:39px;line-height:1.02;letter-spacing:-.055em}
.v3989-dive-entry-copy p{max-width:680px;margin:0;color:#91aca9;font-size:10.5px;line-height:1.6}
.v3989-dive-flags{display:flex;gap:6px;flex-wrap:wrap;margin-top:15px}
.v3989-dive-flags span{
 min-height:25px;display:inline-flex;align-items:center;padding:0 8px;border:1px solid rgba(131,218,209,.10);
 border-radius:999px;background:rgba(6,31,39,.58);color:#8fb7b3;font-size:6.5px;font-weight:850
}
.v3989-dive-actions{position:relative;z-index:1;display:grid;grid-template-columns:1fr;gap:7px}
.v3989-dive-actions button{
 min-width:0;min-height:61px;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;column-gap:10px;
 padding:9px 12px;border:1px solid rgba(137,222,213,.13);border-radius:14px;background:rgba(8,30,37,.86);
 color:#e2f5f2;text-align:left;touch-action:manipulation
}
.v3989-dive-actions button:hover{background:rgba(13,44,51,.94);border-color:rgba(125,225,215,.28)}
.v3989-dive-actions button.primary{border-color:rgba(117,229,217,.30);background:linear-gradient(135deg,rgba(26,93,99,.96),rgba(45,65,111,.94))}
.v3989-dive-actions button.resume{background:linear-gradient(135deg,rgba(11,56,61,.94),rgba(16,39,55,.94))}
.v3989-dive-actions button span{grid-row:1 / span 2;color:#77ddd4;font-size:9px;font-weight:950;white-space:nowrap}
.v3989-dive-actions button b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1fffd;font-size:10px}
.v3989-dive-actions button[aria-busy="true"]{cursor:wait;opacity:.72}
.v3989-gateway-head{
 display:flex;align-items:end;justify-content:space-between;gap:12px;margin:0 2px 9px;padding-top:4px
}
.v3989-gateway-head small{display:block;color:#62a6a0;font-size:6.5px;font-weight:950;letter-spacing:.13em}
.v3989-gateway-head h2{margin:3px 0 2px;font-size:20px;letter-spacing:-.04em}
.v3989-gateway-head p{margin:0;color:var(--vd-muted);font-size:8.5px}
.v3989-gateway-head>button{
 flex:0 0 auto;min-height:33px;padding:0 11px;border:0;border-radius:999px;background:#152629;color:#c7dad7;font-size:8px;font-weight:900
}
.v3989-gateway-row{margin-bottom:9px!important}
.v3989-gateway-row button{touch-action:manipulation}
@media(min-width:700px) and (max-width:1099px){
 .v3989-dive-entry{grid-template-columns:1fr;min-height:0;padding:20px}
 .v3989-dive-actions{grid-template-columns:repeat(3,minmax(0,1fr))}
 .v3989-dive-actions button{grid-template-columns:1fr;align-content:center;gap:3px;min-height:64px;text-align:center}
 .v3989-dive-actions button span{grid-row:auto}
}
@media(max-width:699px){
 .v3989-home-meta{margin:0 1px 7px}
 .v3989-dive-entry{grid-template-columns:1fr;gap:14px;min-height:0;margin-bottom:14px;padding:16px 14px;border-radius:18px}
 .v3989-dive-entry-copy h1{font-size:28px;margin:6px 0 7px}
 .v3989-dive-entry-copy p{font-size:9px;line-height:1.5}
 .v3989-dive-flags{margin-top:11px;gap:4px}
 .v3989-dive-flags span{min-height:22px;padding:0 6px;font-size:6px}
 .v3989-dive-actions{grid-template-columns:1fr 1fr;gap:6px}
 .v3989-dive-actions button{min-height:54px;padding:7px 9px;grid-template-columns:1fr;align-content:center;gap:2px;text-align:center}
 .v3989-dive-actions button span{grid-row:auto;font-size:8px}
 .v3989-dive-actions button b{font-size:8px}
 .v3989-dive-actions button:nth-child(3){grid-column:1/-1}
 .v3989-gateway-head{align-items:center}
 .v3989-gateway-head h2{font-size:18px}
 .v3989-gateway-head p{display:none}
 .v3989-gateway-head>button{min-height:31px;font-size:7px}
 .v3989-gateway-row{padding-bottom:8px!important}
}
@media(max-width:420px){
 .v3989-dive-entry{padding:13px 11px}
 .v3989-dive-entry-copy h1{font-size:25px}
 .v3989-dive-entry-copy p{font-size:8.5px}
 .v3989-dive-actions button{min-height:50px}
 .v3989-home-meta button{min-height:29px;padding:0 8px;font-size:6.5px}
}

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

/* Explore entry map · v39.90 */
.v3990-map-hero{
 display:flex;align-items:end;justify-content:space-between;gap:16px;
 margin:0 0 14px;padding:8px 2px 16px;border-bottom:1px solid var(--vd-line)
}
.v3990-map-hero small{display:block;color:var(--vd-accent);font-size:8px;font-weight:950;letter-spacing:.14em}
.v3990-map-hero h2{margin:5px 0 5px;font-size:31px;letter-spacing:-.05em}
.v3990-map-hero p{max-width:760px;margin:0;color:var(--vd-muted);font-size:10px;line-height:1.55}
.v3990-map-hero-actions{display:flex;gap:6px;flex-wrap:wrap}
.v3990-map-hero-actions button{
 min-height:38px;padding:0 12px;border:0;border-radius:999px;background:#152629;color:#c8dad8;font-size:8px;font-weight:950
}
.v3990-map-hero-actions button.primary{background:#e7f6f4;color:#071012}
.v3990-entry-zones{display:grid;gap:10px}
.v3990-zone{
 position:relative;overflow:hidden;padding:13px;border:1px solid var(--vd-line);border-radius:17px;background:var(--vd-surface)
}
.v3990-zone:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#35545a}
.v3990-zone.primary:before{background:linear-gradient(#6de0d5,#4c8593)}
.v3990-zone.discovery:before{background:linear-gradient(#698bdd,#6b65a6)}
.v3990-zone.archive:before{background:linear-gradient(#7c6699,#465a77)}
.v3990-zone-head{display:flex;gap:10px;align-items:center;margin-bottom:9px}
.v3990-zone-head>span{
 width:31px;height:31px;display:grid;place-items:center;flex:0 0 31px;border-radius:10px;background:#13282c;color:#80c8c1;font-size:7px;font-weight:950
}
.v3990-zone-head>div{display:grid;min-width:0}
.v3990-zone-head small{color:#5f9692;font-size:6px;font-weight:950;letter-spacing:.13em}
.v3990-zone-head b{margin-top:1px;font-size:13px;color:var(--vd-text)}
.v3990-zone-head em{margin-top:2px;color:var(--vd-muted);font-size:7px;font-style:normal}
.v3990-zone-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.v3990-zone-grid.wide{grid-template-columns:repeat(4,minmax(0,1fr))}
.v3990-zone .v3919-intent,
.v3990-zone .v37-hub-card{
 min-width:0!important;min-height:88px!important;padding:10px!important;border:1px solid rgba(172,220,215,.10)!important;
 border-radius:13px!important;background:#0b181b!important;box-shadow:none!important
}
.v3990-zone .v3919-intent:hover,
.v3990-zone .v37-hub-card:hover{background:#122326!important;border-color:rgba(128,221,211,.23)!important}
.v3990-zone .v37-hub-copy b,.v3990-zone .v3919-intent b{font-size:10px!important}
.v3990-zone .v37-hub-copy small,.v3990-zone .v3919-intent small{font-size:7px!important;line-height:1.35!important}
.v3990-map-history{margin-top:12px!important}
@media(max-width:899px){
 .v3990-map-hero{align-items:flex-start;flex-direction:column}
 .v3990-zone-grid,.v3990-zone-grid.wide{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:699px){
 .v3990-map-hero{padding:4px 1px 12px;margin-bottom:9px}
 .v3990-map-hero h2{font-size:25px}
 .v3990-map-hero p{font-size:8.5px}
 .v3990-map-hero-actions{width:100%;display:grid;grid-template-columns:1fr auto}
 .v3990-zone{padding:10px;border-radius:14px}
 .v3990-zone-head{margin-bottom:7px}
 .v3990-zone-head em{display:none}
 .v3990-zone-grid,.v3990-zone-grid.wide{grid-template-columns:1fr}
 .v3990-zone .v3919-intent,.v3990-zone .v37-hub-card{min-height:76px!important;padding:9px!important}
}

/* Dive relation density · v39.90 */
#universePanel.v3958-rel .mr90-node-reason{
 display:block;margin-top:4px;color:#83c5bf;font-size:7px;font-style:normal;font-weight:900;
 white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}
#universePanel.v3958-rel .mr90-side-close{
 position:absolute;right:8px;top:8px;z-index:6;width:32px;height:32px;padding:0;border:1px solid rgba(161,222,216,.14);
 border-radius:50%;background:rgba(6,25,31,.88);color:#d9efec;font-size:18px;line-height:1;touch-action:manipulation
}
#universePanel.v3958-rel .mr58-side{position:relative}
#universePanel.v3958-rel .mr90-more-reasons{margin-top:6px;border-top:1px solid rgba(143,207,201,.10);padding-top:6px}
#universePanel.v3958-rel .mr90-more-reasons>summary{
 cursor:pointer;list-style:none;color:#78aaa5;font-size:7px;font-weight:900
}
#universePanel.v3958-rel .mr90-more-reasons>summary::-webkit-details-marker{display:none}
#universePanel.v3958-rel .mr90-more-reasons .mr61-reason-list{margin-top:6px}
@media(max-width:699px){
 #universePanel.v3958-rel.mr77-candidate-selected .universe-side{margin-bottom:88px!important;padding:9px!important}
 #universePanel.v3958-rel .mr58-side-cover{max-height:118px;overflow:hidden;border-radius:12px}
 #universePanel.v3958-rel .mr58-side-cover img,
 #universePanel.v3958-rel .mr58-side-cover .noimg{height:118px!important;aspect-ratio:auto!important}
 #universePanel.v3958-rel .mr58-side h3{padding-right:34px;font-size:13px!important}
 #universePanel.v3958-rel .mr58-side-meta{font-size:7px!important}
 #universePanel.v3958-rel .mr61-reason-list{gap:4px!important}
 #universePanel.v3958-rel .mr61-reason-list>div{padding:7px!important}
 #universePanel.v3958-rel .mr90-node-reason{font-size:7.5px}
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
 display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 12px!important
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
 .v3983-settings-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}
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
   min-height:62px!important;grid-template-columns:78px minmax(0,1fr) repeat(5,32px)!important;
   gap:4px!important;padding:5px!important;border-radius:13px!important
 }
 .v331-mini-stage{width:78px!important;height:44px!important}
 .v331-mini-copy b{font-size:8.5px!important}
 .v331-mini-copy small{font-size:6.5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
 .v331-mini button{width:32px!important;height:32px!important}
 #v332PrevMini,#v3921PipMini{display:none!important}
 #v332NextMini{display:grid!important}
 .v331-mini.v3987-mini-ready{animation:v3987MiniReady .18s ease-out}
 @keyframes v3987MiniReady{from{opacity:.55;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
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
 .v39-media-grid{display:flex!important;overflow-x:auto!important;gap:10px!important;scroll-snap-type:x proximity;scroll-padding:0 6px 0 0!important;padding-right:6px!important}
 .v39-media-card{flex:0 0 min(68vw,280px)!important;scroll-snap-align:start;min-width:220px!important}
 .v39-thumb{aspect-ratio:16/9!important}
 .v39-media-title{font-size:11.5px!important;line-height:1.35!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden!important}
 .v39-media-meta,.v39-media-reason{font-size:8.5px!important}
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


@media(max-width:420px){
 #v3982WorkerPill{max-width:84px!important}
 .v39-media-card{flex-basis:min(72vw,250px)!important;min-width:210px!important}
 .v331-mini{
  min-height:54px!important;height:54px!important;
  grid-template-columns:60px minmax(0,1fr) repeat(4,28px)!important;
  gap:3px!important;padding:4px!important
 }
 .v331-mini-stage{width:60px!important;height:34px!important}
 .v331-mini-copy small{display:none!important}
 .v331-mini button{width:28px!important;height:28px!important}
 #v3924VolumeMini{display:none!important}
}

/* Fold / compact viewport recovery · v39.78 */
@media(min-width:700px) and (max-width:1099px){
 .v3983-settings-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}
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

/* Natural palette · v39.92
   Neutral surfaces carry the product; cyan is reserved for focus/action and Dive depth. */
body.v37-ready>.app>.topbar{
 background:rgba(9,17,19,.94)!important;
 border-bottom-color:var(--vd-line)!important
}
#v3980SearchForm{background:var(--vd-control)!important;border-color:var(--vd-line-strong)!important}
#v3980SearchForm:focus-within{border-color:rgba(99,216,207,.52)!important;box-shadow:0 0 0 2px rgba(99,216,207,.07)!important}
#v3980SearchBtn,#v3980MenuBtn{background:var(--vd-elevated)!important;color:var(--vd-text)!important}
#v3980Dock{background:rgba(10,18,20,.96)!important;border-color:var(--vd-line)!important}
#v3980Dock button{color:#829390!important}
#v3980Dock button.active,#v3980Dock button[aria-current="page"]{background:#172326!important;color:var(--vd-text)!important}

body.v37-ready :is(.v37-hub-card,.v37-intent-card,.v33-card,.v333-follow-card,.discovery-card,.gem-card,.v37-producer-card,.v37-diag-card,.v37-safety-card,.v37-ice-extra,.v37-vocal-rank-note,.v37-analysis-card,.v37-era-card){
 background:var(--vd-surface)!important;border-color:var(--vd-line)!important
}
body.v37-ready :is(.v37-hub-card,.v37-intent-card,.v33-card,.v333-follow-card,.discovery-card,.gem-card,.v37-producer-card):hover{
 background:var(--vd-hover)!important;border-color:var(--vd-line-strong)!important
}
body.v37-ready :is(input,select,textarea){background:var(--vd-control)!important;border-color:var(--vd-line)!important}
body.v37-ready :is(input,select,textarea):focus{border-color:rgba(99,216,207,.48)!important;box-shadow:0 0 0 2px rgba(99,216,207,.07)!important}

.v396-home-top-actions button,.v396-topic-row button,.v37-tabs button,.v35-tabs button,
.v3989-home-meta button,.v3989-gateway-head>button,.v3990-map-hero-actions button,
.v37-producer-actions button,.v37-ice-actions button,.v37-rank-more,.v37-diag-actions button{
 background:var(--vd-elevated)!important;border-color:var(--vd-line)!important;color:#c8d4d2!important
}
.v396-home-top-actions button.primary,.v3990-map-hero-actions button.primary,.v3981-explore-hero>button,.v33-search-box button{
 background:var(--vd-accent)!important;color:#071210!important;border-color:transparent!important
}
.v37-producer-controls button,.v37-vocal-rank-controls button,.v3989-dive-actions button.primary{
 background:linear-gradient(135deg,var(--vd-accent),var(--vd-accent-2))!important;color:#071210!important;border-color:transparent!important
}
.v396-hero,.v396-hero-copy,.v396-hero-media,.v3990-zone,.v3981-explore-card,
.v3990-zone .v3919-intent,.v3990-zone .v37-hub-card{
 background:var(--vd-surface)!important;border-color:var(--vd-line)!important
}
.v3990-zone .v3919-intent:hover,.v3990-zone .v37-hub-card:hover,.v3981-explore-card:hover{background:var(--vd-hover)!important}
.v3981-explore-icon,.v3990-zone-head>span{background:#182729!important;color:#8fd9d2!important}
.v396-hero-tags span,.v396-badge,.v37-producer-card .score,.v37-producer-meta span{background:var(--vd-surface-2)!important;border-color:var(--vd-line)!important}

.v3989-dive-entry{
 border-color:rgba(132,176,172,.13)!important;
 background:
 radial-gradient(circle at 8% 0%,rgba(99,216,207,.08),transparent 34%),
 radial-gradient(circle at 90% 18%,rgba(122,142,242,.09),transparent 36%),
 linear-gradient(155deg,#111c20 0%,#0c161a 55%,#091115 100%)!important
}
.v3989-dive-actions button{background:#132024!important;border-color:var(--vd-line)!important;color:var(--vd-text)!important}
.v3989-dive-actions button:hover{background:#19282b!important;border-color:var(--vd-line-strong)!important}
.v3989-dive-actions button.resume{background:#142126!important}

/* Errors/statuses use semantic accents instead of full saturated panels. */
.v3973-worker-note{
 background:#181813!important;border-color:rgba(215,182,107,.26)!important;color:#e7dcc0!important
}
.v3973-worker-copy span{color:#a79c7e!important}
.v3973-worker-actions button{background:#22211b!important;border-color:rgba(215,182,107,.20)!important;color:#d8cba7!important}
.v3973-worker-note.good{background:#111b1a!important;border-color:rgba(88,199,167,.28)!important;color:#cae9df!important}
.v3973-worker-note.good .v3973-worker-copy span{color:#86aaa1!important}
.v3973-worker-note.good .v3973-worker-actions button{background:#172522!important;border-color:rgba(88,199,167,.22)!important;color:#c7dfd8!important}
.v3973-worker-note.bad{background:var(--vd-danger-bg)!important;border-color:rgba(217,120,130,.34)!important;color:#ecc9cd!important}
.v3973-worker-note.bad .v3973-worker-copy span{color:#b99298!important}
.v3973-worker-note.bad .v3973-worker-actions button{background:#251b1d!important;border-color:rgba(217,120,130,.25)!important;color:#dfc2c6!important}
.v37-route-error>div{background:var(--vd-danger-bg)!important;border-color:rgba(217,120,130,.34)!important}
.v37-route-error h2{color:#f0dadd!important}.v37-route-error p{color:#b99399!important}
.v37-route-error button{background:#251b1d!important;border-color:rgba(217,120,130,.28)!important;color:#ead6d9!important}
#v3982WorkerPill[data-state="live"]{border-color:rgba(88,199,167,.26)!important;background:#121d1b!important}
#v3982WorkerPill[data-state="err"]{border-color:rgba(217,120,130,.32)!important;background:var(--vd-danger-bg)!important}
#v3982WorkerPill[data-state="warn"]{border-color:rgba(215,182,107,.24)!important;background:#181813!important}

/* Producer discovery: compact evidence-first cards. */
.v37-producer-controls{background:var(--vd-surface)!important;border-color:var(--vd-line)!important}
.v37-producer-status{background:#0e1719!important;border-color:var(--vd-line)!important;color:var(--vd-muted)!important}
.v37-producer-card{padding:13px!important;background:var(--vd-surface)!important}
.v37-producer-source{display:block;color:#78aaa5!important;font-size:6.5px!important;font-weight:900;letter-spacing:.055em}
.v37-producer-card .score{padding:5px 7px!important;color:#8fdad3!important;font-size:7.5px!important}
.v37-producer-reason{margin-top:8px;padding:7px 8px;border-left:2px solid rgba(99,216,207,.45);background:#0d1719;color:#bac9c7;font-size:7.5px;line-height:1.45}
.v37-producer-meta{gap:4px!important}
.v37-producer-meta span{color:#95a8a5!important}
.v37-producer-meta span.evidence{color:#8fd1c9!important;border-color:rgba(99,216,207,.22)!important}
.v37-producer-songs{display:grid!important;gap:5px!important;margin-top:9px!important}
.v37-producer-song{display:grid;grid-template-columns:58px minmax(0,1fr);gap:8px;align-items:center;min-width:0;padding:5px;border-radius:9px;background:#0d1719}
.v37-producer-song img,.v37-producer-song-noimg{width:58px;height:33px;object-fit:cover;border-radius:6px;background:#182326}
.v37-producer-song-noimg{display:grid;place-items:center;color:#75918e}
.v37-producer-song span{min-width:0}.v37-producer-song b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#dce6e4;font-size:7.5px}
.v37-producer-song small{display:block;margin-top:2px;color:#738582;font-size:6.5px}
@media(max-width:420px){.v37-producer-song{grid-template-columns:52px minmax(0,1fr)}.v37-producer-song img,.v37-producer-song-noimg{width:52px;height:30px}}

/* Dive keeps depth, but saturation falls with depth rather than tinting the whole app. */
#universePanel.v3958-rel .mr74-depth-0{background:linear-gradient(180deg,#173a43 0%,#12313b 38%,#0d2631 100%)!important}
#universePanel.v3958-rel .mr74-depth-1{background:linear-gradient(180deg,#122f39 0%,#0d2631 45%,#0a1d27 100%)!important}
#universePanel.v3958-rel .mr74-depth-2{background:linear-gradient(180deg,#0e2832 0%,#0a202a 48%,#081821 100%)!important}
#universePanel.v3958-rel .mr74-depth-3{background:linear-gradient(180deg,#0b202a 0%,#081922 48%,#07131b 100%)!important}
#universePanel.v3958-rel .mr74-depth-4{background:linear-gradient(180deg,#091820 0%,#071219 48%,#060c12 100%)!important}

/* Light mode gets the same neutral hierarchy instead of mint-tinting every surface. */
body[data-vsa-theme="light"]{
 --vd-bg:#f3f6f5;--vd-surface:#ffffff;--vd-surface-2:#f1f4f3;--vd-elevated:#edf1f0;--vd-control:#ffffff;
 --vd-hover:#f0f4f3;--vd-line:rgba(49,76,72,.12);--vd-line-strong:rgba(36,111,103,.25);
 --vd-text:#17302e;--vd-muted:#536b68;--vd-soft:#5c716e;--vd-danger-bg:#fff7f8
}
body[data-vsa-theme="light"] .v3989-dive-entry{
 background:linear-gradient(155deg,#ffffff,#f0f5f4)!important;border-color:rgba(49,76,72,.12)!important
}
body[data-vsa-theme="light"] .v37-producer-reason,
body[data-vsa-theme="light"] .v37-producer-song,
body[data-vsa-theme="light"] .v37-producer-status{background:#f5f7f6!important}
body[data-vsa-theme="light"] .v3973-worker-note{background:#fffaf0!important}
body[data-vsa-theme="light"] .v3973-worker-note.good{background:#f3faf7!important}
body[data-vsa-theme="light"] .v3973-worker-note.bad{background:#fff7f8!important}
body[data-vsa-theme="light"].v37-ready>.app>.topbar{background:rgba(255,255,255,.94)!important;border-bottom-color:var(--vd-line)!important}
body[data-vsa-theme="light"] #v3980Dock{background:rgba(255,255,255,.96)!important;border-color:var(--vd-line)!important;box-shadow:0 12px 28px rgba(31,55,52,.08)!important}
body[data-vsa-theme="light"] #v3980Dock button{color:#536b68!important}
body[data-vsa-theme="light"] #v3980Dock button.active,
body[data-vsa-theme="light"] #v3980Dock button[aria-current="page"]{background:#edf1f0!important;color:#17302e!important}
body[data-vsa-theme="light"] .v3981-explore-icon,
body[data-vsa-theme="light"] .v3990-zone-head>span{background:#eaf0ee!important;color:#2f716a!important}
body[data-vsa-theme="light"] .v3989-dive-actions button{background:#f2f5f4!important;color:#203b38!important;border-color:var(--vd-line)!important}
body[data-vsa-theme="light"] .v3989-dive-actions button.resume{background:#edf2f1!important}
body[data-vsa-theme="light"] .v3989-dive-actions button.primary{background:linear-gradient(135deg,#63d8cf,#7a8ef2)!important;color:#071210!important}
body[data-vsa-theme="light"] #v3982WorkerPill[data-state="live"]{background:#f3faf7!important}
body[data-vsa-theme="light"] #v3982WorkerPill[data-state="warn"]{background:#fffaf0!important}
body[data-vsa-theme="light"] #v3982WorkerPill[data-state="err"]{background:#fff7f8!important}

/* Active controls stay subtle; only primary CTAs carry the full accent. */
.v37-safety-modes button.active,.v37-vocal-rank-tabs button.active,.v37-ice-mode-tabs button.active,
.v3981-producer-section .v33-chip.active{
 background:#1b2a2c!important;border-color:rgba(99,216,207,.24)!important;color:var(--vd-text)!important
}
body[data-vsa-theme="light"] :is(.v37-safety-modes button.active,.v37-vocal-rank-tabs button.active,.v37-ice-mode-tabs button.active,.v3981-producer-section .v33-chip.active){
 background:#eaf1ef!important;border-color:rgba(47,113,106,.22)!important;color:#17302e!important
}
.v3941-device-sync-entry{background:var(--vd-surface)!important;border-color:var(--vd-line)!important}
.v3941-device-sync-entry button{background:var(--vd-elevated)!important;border-color:var(--vd-line)!important;color:var(--vd-text)!important}
.v37-reaction-iceberg{background:linear-gradient(180deg,var(--vd-surface),#0c1517)!important;border-color:var(--vd-line)!important}
body[data-vsa-theme="light"] .v37-reaction-iceberg{background:linear-gradient(180deg,#fff,#f3f6f5)!important}

/* Producer result actions · v39.93 */
.v37-producer-song{grid-template-columns:58px minmax(0,1fr) auto!important}
.v37-producer-song-actions{display:flex;gap:4px;align-items:center}
.v37-producer-song-actions button{
 min-height:28px;padding:0 7px;border:1px solid var(--vd-line);border-radius:8px;
 background:var(--vd-elevated);color:#c7d3d1;font-size:6.5px;font-weight:900;white-space:nowrap
}
.v37-producer-song-actions button:last-child{border-color:rgba(99,216,207,.24);color:#91d8d1}
@media(max-width:520px){
 .v37-producer-song{grid-template-columns:52px minmax(0,1fr)!important}
 .v37-producer-song-actions{grid-column:2;justify-content:flex-start}
}

/* Light mode contrast repair · v39.93
   Old component-level dark text colors must not win over the neutral light palette. */
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]),
body[data-vsa-theme="light"] .tools-body>.panel{
 color:var(--vd-text)!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(h1,h2,h3,h4,b,strong,label,summary),
body[data-vsa-theme="light"] .tools-body>.panel :is(h1,h2,h3,h4,b,strong,label,summary){
 color:var(--vd-text)!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(p,small,em,.meta,.sub,.v37-producer-source,.v37-producer-song small,.v37-producer-songs,.v37-producer-status,.v37-producer-reason),
body[data-vsa-theme="light"] .tools-body>.panel :is(p,small,em,.meta,.sub){
 color:var(--vd-muted)!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(button,.mini-btn,.v37-producer-actions button,.v37-producer-song-actions button,.v37-ice-actions button,.v37-rank-more,.v37-diag-actions button){
 color:#29423f!important;background:var(--vd-elevated)!important;border-color:var(--vd-line)!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(input,select,textarea){
 color:#17302e!important;background:#fff!important;border-color:var(--vd-line)!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(input,textarea)::placeholder{color:#5c716e!important}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) .v37-producer-card .score,
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) .v37-producer-meta span{
 color:#4f6966!important;background:#f0f4f3!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) .v37-producer-meta span.evidence{
 color:#2c7169!important;border-color:rgba(47,113,106,.20)!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) .v37-producer-song b{color:#203936!important}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) .v37-producer-song-noimg{background:#e8eeec!important;color:#4f6966!important}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(.primary,.v37-producer-controls button,.v37-vocal-rank-controls button){
 background:linear-gradient(135deg,var(--vd-accent),var(--vd-accent-2))!important;color:#071210!important;border-color:transparent!important
}
body[data-vsa-theme="light"] #v3982Menu{background:#fff!important;border-color:var(--vd-line)!important;box-shadow:0 18px 40px rgba(31,55,52,.12)!important}
body[data-vsa-theme="light"] #v3982Menu button{color:#17302e!important}
body[data-vsa-theme="light"] #v3982Menu button:hover{background:#f0f4f3!important}
body[data-vsa-theme="light"] #v3982Menu button i{background:#e8efed!important;color:#2f716a!important}
body[data-vsa-theme="light"] #v3982Menu button small,
body[data-vsa-theme="light"] #v3982Menu button em{color:#536b68!important}
body[data-vsa-theme="light"] #v3983SurfaceNotice{background:#fff!important;color:#29423f!important;border-color:var(--vd-line)!important}

/* Home Dive entry and Worker pill were still using dark-theme foregrounds on light surfaces. */
body[data-vsa-theme="light"] .v3989-dive-entry-copy>small{color:#2f716a!important}
body[data-vsa-theme="light"] .v3989-dive-entry-copy h1{color:#17302e!important}
body[data-vsa-theme="light"] .v3989-dive-entry-copy p{color:#536b68!important}
body[data-vsa-theme="light"] .v3989-dive-flags span{background:#edf3f1!important;color:#4f6966!important;border-color:var(--vd-line)!important}
body[data-vsa-theme="light"] .v3989-dive-actions button b{color:#17302e!important}
body[data-vsa-theme="light"] .v3989-dive-actions button span{color:#2f716a!important}
body[data-vsa-theme="light"] .v3989-dive-actions button.primary b,
body[data-vsa-theme="light"] .v3989-dive-actions button.primary span{color:#071210!important}
body[data-vsa-theme="light"] #v3982WorkerPill{color:#405c58!important}
body[data-vsa-theme="light"] #v3982WorkerPill[data-state="live"]{color:#2f716a!important}
body[data-vsa-theme="light"] #v3982WorkerPill[data-state="warn"]{color:#7d672f!important}
body[data-vsa-theme="light"] #v3982WorkerPill[data-state="err"]{color:#994b55!important}
body[data-vsa-theme="light"] #v3980SearchBtn,
body[data-vsa-theme="light"] #v3980MenuBtn{background:#edf1f0!important;color:#17302e!important}




/* Theme contrast contract · v39.102
   Light pages use darker secondary text; Dive remains intentionally dark in both themes. */
body[data-vsa-theme="light"] #v3980Dock button{color:#536b68!important}
body[data-vsa-theme="light"] #v3982Menu button small,
body[data-vsa-theme="light"] #v3982Menu button em{color:#536b68!important}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(p,small,em,.meta,.sub,.v37-hub-copy small,.v3919-intent small,.v39-media-meta,.v39-media-reason){
 color:var(--vd-muted)!important
}
body[data-vsa-theme="light"] .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(input,textarea)::placeholder{color:var(--vd-soft)!important}
body[data-vsa-theme="light"] .v3989-dive-entry-copy p,
body[data-vsa-theme="light"] .v3989-gateway-head p,
body[data-vsa-theme="light"] .v3990-map-hero p,
body[data-vsa-theme="light"] .v3990-zone-head em,
body[data-vsa-theme="light"] .v3990-zone .v37-hub-copy small,
body[data-vsa-theme="light"] .v3990-zone .v3919-intent small{color:var(--vd-muted)!important}

/* Dark mode: prevent legacy light-text overrides from leaving secondary copy too dim. */
body:not([data-vsa-theme="light"]) .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(h1,h2,h3,h4,b,strong,label,summary){color:var(--vd-text)!important}
body:not([data-vsa-theme="light"]) .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(p,small,em,.meta,.sub){color:var(--vd-muted)!important}
body:not([data-vsa-theme="light"]) .tools-body>.tool-view:not([data-tool-view="universe29"]) :is(input,textarea)::placeholder{color:var(--vd-soft)!important}

/* The global light theme used dark heading/body colors. Restore the dark-ocean contract inside Dive. */
body[data-vsa-theme="light"] #universePanel.v3958-rel{
 color:#dff5f2!important;background:#091820!important
}
body[data-vsa-theme="light"] #universePanel.v3958-rel :is(.mr58-head h3,.mr58-center h2,.mr58-side h3,.mr71-start h3,.mr77-route-head b){
 color:#effffc!important
}
body[data-vsa-theme="light"] #universePanel.v3958-rel :is(.mr58-head p,.mr71-start p,.mr58-side-meta,.mr77-route-head i){
 color:#9bb8b4!important
}
body[data-vsa-theme="light"] #universePanel.v3958-rel :is(.mr58-head small,.mr58-center small,.mr71-start small,.mr72-depth-head small,.mr77-route-head small){
 color:#7fd3cb!important
}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr58-node-copy b{color:#f0fffd!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr58-node-copy small{color:#9db8b4!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr90-node-reason{color:#8fcac4!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr61-reason-list b{color:#8ee0d7!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr61-reason-list span{color:#b8d5d1!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr58-side-section small,
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr90-more-reasons>summary{color:#89aaa6!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel :is(.mr58-center-actions button,.mr58-side-actions button,.mr58-node-go,.mr95-node-peek-actions button){
 color:#dcefed!important;background:#103039!important
}
body[data-vsa-theme="light"] #universePanel.v3958-rel :is(.mr58-center-actions button.primary,.mr58-side-actions button.primary){
 color:#071210!important;background:linear-gradient(135deg,#63d8cf,#7a8ef2)!important
}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr58-filter{color:#a7c4c0!important;background:#0d3239!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr58-filter.active{color:#effffc!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr61-match button{color:#9fb8b5!important}
body[data-vsa-theme="light"] #universePanel.v3958-rel .mr61-match button.active{color:#effffc!important}
body[data-vsa-theme="light"] .mr74-transition :is(small,b,span){color:#effffc!important}
body[data-vsa-theme="light"] .mr74-transition .mr75-trans-depth i{border-color:rgba(213,245,241,.20)!important}

/* Legacy light-mode copy that sat below 4.5:1 on white cards is overridden here. */
body[data-vsa-theme="light"] :is(
 .v393-native-explore .v37-hub-section-head small,
 .v393-native-explore .v3922-group-head small,
 .v393-native-explore .v37-hub-copy small,
 .v393-native-explore .v37-quick-chip small,
 .v3922-rank-hero p,
 .v3925-keyword-head small,
 .v3925-ice-control small,
 .v3929-guide-scope-head small,
 .v395-action small,
 .v3920-fold-body>p
){color:#536b68!important}

/* Keep Watch's dark player shell readable while the surrounding page is light. */
body[data-vsa-theme="light"] .tools-modal[data-current-view="songDetail39"] .v399-player-shell :is(small,span,b,strong,p){
 color:#e6f2f0!important
}

/* Dive inline detail + compact Explore · v39.95 */
#universePanel.v3958-rel .mr95-node-peek{display:none}
@media(max-width:699px){
 /* Candidate details stay with the tapped card instead of forcing a jump to the old side panel. */
 #universePanel.v3958-rel.mr77-candidate-selected .universe-side{display:none!important}
 #universePanel.v3958-rel .mr58-node.selected{
   border-color:rgba(99,216,207,.42)!important;
   background:linear-gradient(110deg,rgba(10,48,55,.98),rgba(8,34,43,.98))!important
 }
 #universePanel.v3958-rel .mr58-node.selected .mr95-node-peek{
   display:grid;grid-column:1/-1;gap:7px;margin-top:2px;padding-top:7px;
   border-top:1px solid rgba(151,214,207,.12)
 }
 #universePanel.v3958-rel .mr95-node-peek-reasons{display:grid;gap:4px}
 #universePanel.v3958-rel .mr95-node-peek-reasons>div{
   display:grid;grid-template-columns:72px minmax(0,1fr);gap:7px;align-items:start;
   padding:6px 7px;border-radius:9px;background:rgba(5,28,35,.72)
 }
 #universePanel.v3958-rel .mr95-node-peek-reasons b{color:#83d6ce;font-size:6.5px}
 #universePanel.v3958-rel .mr95-node-peek-reasons span{color:#a8c4c0;font-size:7px;line-height:1.4}
 #universePanel.v3958-rel .mr95-node-peek-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
 #universePanel.v3958-rel .mr95-node-peek-actions button{
   min-height:36px;border:1px solid rgba(139,211,204,.15);border-radius:9px;
   background:#102f36;color:#c6dfdc;font-size:7.5px;font-weight:900;touch-action:manipulation
 }
 #universePanel.v3958-rel .mr58-node.selected .mr58-node-main{align-self:start}
}

/* Explore is an entry map, so compact phones keep two readable columns instead of a long one-card list. */
@media(min-width:380px) and (max-width:699px){
 .v3990-zone-grid,.v3990-zone-grid.wide{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
 .v3990-zone .v3919-intent,.v3990-zone .v37-hub-card{
   min-height:72px!important;padding:8px!important;border-radius:12px!important
 }
 .v3990-zone .v37-hub-icon,.v3990-zone .v3919-intent>i{width:32px!important;height:32px!important;min-width:32px!important}
 .v3990-zone .v37-hub-copy b,.v3990-zone .v3919-intent b{font-size:9.5px!important}
 .v3990-zone .v37-hub-copy small,.v3990-zone .v3919-intent small{
   font-size:6.7px!important;line-height:1.32!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden
 }
}
@media(max-width:379px){
 .v3990-zone-grid,.v3990-zone-grid.wide{grid-template-columns:1fr!important}
}

/* Make busy controls visibly non-interactive instead of looking broken. */
body.v37-ready button[aria-busy="true"]{cursor:wait!important;pointer-events:none!important;opacity:.68!important}
/* Dive interaction polish · v39.94 */
@media(max-width:699px){
 #universePanel.v3958-rel .mr58-map>.mr58-node{
   content-visibility:auto!important;contain-intrinsic-size:88px!important;
   scroll-margin-top:82px!important
 }
 #universePanel.v3958-rel .mr58-node-go{
   touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important
 }
 #universePanel.v3958-rel .mr58-node-main{
   touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important
 }
 #universePanel.v3958-rel .mr90-node-reason{
   color:#8fb9b5!important;font-weight:800!important
 }
}
body[data-vsa-theme="light"] #v3982Menu,
body[data-vsa-theme="light"] #v3980Dock,
body[data-vsa-theme="light"] .topbar{color:#17302e!important}



/* Light discovery + high-definition thumbnail contract · v39.102
   Legacy discovery/taste cards had dark-theme !important rules that survived light mode.
   Keep Dive dark, but make normal discovery surfaces genuinely light and readable. */
body.v37-ready[data-vsa-theme="light"] :is(.discovery-card,.gem-card){
 background:#fff!important;border-color:#cbdedb!important;color:#183432!important;
 box-shadow:0 9px 24px rgba(28,63,59,.07)!important
}
body.v37-ready[data-vsa-theme="light"] :is(.discovery-card:hover,.gem-card:hover){
 border-color:#9fc8c2!important;box-shadow:0 12px 28px rgba(28,63,59,.10)!important
}
body.v37-ready[data-vsa-theme="light"] :is(.discovery-title,.gem-title,.gem-topline a){
 color:#123936!important
}
body.v37-ready[data-vsa-theme="light"] :is(.discovery-meta,.gem-meta,.discovery-reason,.rank-note,.gem-status,.taste-summary,.route-info,.help,.gem-explain){
 color:#526a67!important
}
body.v37-ready[data-vsa-theme="light"] .discovery-tag{
 background:#0f625c!important;border-color:#0f625c!important;color:#f8fffd!important
}
body.v37-ready[data-vsa-theme="light"] :is(.gem-reason,.v37-producer-meta span){
 background:#e8f3f1!important;border-color:#c5dcd8!important;color:#315f59!important
}
body.v37-ready[data-vsa-theme="light"] :is(.recommend-prompt-box,.taste-builder,.discovery-controls,.gem-controls,.detective-controlbar,.v37-producer-controls,.v37-safety-card,.v37-ice-extra){
 background:#fff!important;border-color:#cbdedb!important;box-shadow:none!important
}
body.v37-ready[data-vsa-theme="light"] :is(.btn,.mini-btn,.taste-chip,.detective-chip,.detective-mode-btn){
 background:#f4f8f7!important;border-color:#c6d9d6!important;color:#183432!important;
 box-shadow:none!important
}
body.v37-ready[data-vsa-theme="light"] .btn.primary{
 background:linear-gradient(135deg,#71ddd2 0%,#74b9ee 52%,#887cff 100%)!important;
 border-color:transparent!important;color:#07171b!important
}
body.v37-ready[data-vsa-theme="light"] :is(input,textarea,select){
 background:#fff!important;border-color:#c5d9d5!important;color:#173431!important
}
body.v37-ready[data-vsa-theme="light"] :is(input,textarea)::placeholder{color:#6a7d7a!important}
body.v37-ready[data-vsa-theme="light"] .control label{color:#405a57!important}
body.v37-ready[data-vsa-theme="light"] :is(.discovery-card img,.gem-card img,.v39-thumb img,.v399-related-thumb img){
 background:#e8efed!important;image-rendering:auto!important
}



/* Internal discovery playback · v39.102 */
.discovery-title.vsa-play-title,.gem-title.vsa-play-title{
 display:block;width:100%;padding:0;border:0;background:transparent;text-align:left;
 color:inherit;font:inherit;font-weight:inherit;line-height:inherit;cursor:pointer
}
.discovery-title.vsa-play-title:hover,.gem-title.vsa-play-title:hover{text-decoration:underline}



/* Broken thumbnail placeholder · v39.102 */
.vsa-play-title{
 display:block;width:100%;padding:0;border:0;background:transparent!important;
 color:inherit!important;font:inherit;font-weight:inherit;line-height:inherit;text-align:left;cursor:pointer
}
.vsa-play-title:hover{text-decoration:underline}
.v3999-thumb-fallback{
 display:grid!important;place-items:center!important;flex:0 0 auto;
 background:linear-gradient(145deg,#183033,#102326)!important;color:#86b9b3!important;
 font-size:22px!important;font-weight:900!important;line-height:1!important;overflow:hidden
}
.discovery-card .v3999-thumb-fallback{width:100%!important;aspect-ratio:16/9!important}
.gem-card .v3999-thumb-fallback{width:100%!important;aspect-ratio:16/8.5!important}
.detective-card .v3999-thumb-fallback{aspect-ratio:16/9!important}
.song .v3999-thumb-fallback{aspect-ratio:16/9!important}
body[data-vsa-theme="light"] .v3999-thumb-fallback{
 background:linear-gradient(145deg,#e8f1ef,#dce9e6)!important;color:#4d7771!important
}



/* Performance frame budget · v39.102
   Long recommendation/ranking lists skip off-screen paint work; Dive movement
   stays on compositor-friendly layers without permanently pinning GPU memory. */
@supports(content-visibility:auto){
  :is(.song,.discovery-card,.gem-card,.detective-card,.v37-producer-song,.v399-related-row){
    content-visibility:auto;
    contain-intrinsic-size:auto 170px
  }
}
:is(.song,.discovery-card,.gem-card,.detective-card,.v37-producer-song,.v399-related-row){
  contain:layout paint style
}
#universePanel.v3958-rel .mr58-node{contain:layout paint style}
#universePanel.v3958-rel.mr75-moving .mr58-map,
#universePanel.v3958-rel .mr58-shell.mr75-moving .mr58-map,
#mr74DiveTransition.active{will-change:transform,opacity}
#universePanel.v3958-rel:not(.mr75-moving) .mr58-map,
#universePanel.v3958-rel .mr58-shell:not(.mr75-moving) .mr58-map{will-change:auto}

@media(prefers-reduced-motion:reduce){
 *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;
  document.head.appendChild(s)
}


/* HQ thumbnail recovery · v39.102 */
var thumbObserver3997=null;
function highResThumbnailUrl3997(raw){
  var src=String(raw||"").trim();if(!src)return src;
  try{
    var u=new URL(src,location.href),host=String(u.hostname||"").toLowerCase();
    if(host==="nicovideo.cdn.nimg.jp"&&/^\/thumbnails\/\d+\/[^/]+$/i.test(u.pathname)){
      if(/\.M$/i.test(u.pathname))u.pathname=u.pathname.replace(/\.M$/i,".L");
      else if(!/\.L$/i.test(u.pathname))u.pathname+=".L";
      return u.href
    }
    if(/(^|\.)smilevideo\.jp$/i.test(host)){
      var id=u.searchParams.get("i");
      if(id&&/^\d+(?:\.[A-Za-z0-9]+)?$/.test(id)){
        id=id.replace(/\.M$/i,"").replace(/\.L$/i,"");
        u.searchParams.set("i",id+".L");
        return u.href
      }
    }
  }catch(_){}
  return src
}
function upgradeThumbnail3997(img){
  if(!img||img.nodeType!==1||String(img.tagName).toUpperCase()!=="IMG")return;
  var src=String(img.getAttribute("src")||"").trim();if(!src)return;
  if(img.dataset.v3997HqFailed===src)return;
  var hq=highResThumbnailUrl3997(src);if(!hq||hq===src)return;
  if(img.dataset.v3997HqSrc===hq&&String(img.getAttribute("src")||"")===hq)return;
  img.dataset.v3997OriginalSrc=src;
  img.dataset.v3997HqSrc=hq;
  img.decoding="async";
  img.addEventListener("error",function(){
    if(img.dataset.v3997HqSrc!==hq)return;
    var fallback=img.dataset.v3997OriginalSrc||src;
    img.dataset.v3997HqFailed=fallback;
    img.removeAttribute("srcset");
    img.addEventListener("load",function(){
      if(String(img.getAttribute("src")||"")===fallback){
        img.style.visibility="";
        img.style.opacity=""
      }
    },{once:true});
    if(String(img.getAttribute("src")||"")!==fallback)img.setAttribute("src",fallback)
  },{once:true});
  img.setAttribute("src",hq)
}
var thumbScanRaf39101=0,thumbScanRoots39101=new Set();
function scanThumbnails3997(root){
  if(!root)return;
  if(root.nodeType===1&&String(root.tagName).toUpperCase()==="IMG")upgradeThumbnail3997(root);
  if(root.querySelectorAll)Array.prototype.forEach.call(root.querySelectorAll("img"),upgradeThumbnail3997)
}
function flushThumbnailScans39101(){
  thumbScanRaf39101=0;
  var roots=Array.from(thumbScanRoots39101);thumbScanRoots39101.clear();
  roots.forEach(scanThumbnails3997)
}
function queueThumbnailScan39101(root){
  if(!root)return;
  thumbScanRoots39101.add(root);
  if(thumbScanRaf39101)return;
  thumbScanRaf39101=requestAnimationFrame(flushThumbnailScans39101)
}
function installHiResThumb3997(){
  window.VSAHighResThumbnail3997=highResThumbnailUrl3997;
  var initial=function(){queueThumbnailScan39101(document.documentElement)};
  if("requestIdleCallback" in window)requestIdleCallback(initial,{timeout:500});else setTimeout(initial,80);
  if(thumbObserver3997||!window.MutationObserver)return;
  thumbObserver3997=new MutationObserver(function(muts){
    muts.forEach(function(m){
      if(m.type==="attributes"){queueThumbnailScan39101(m.target);return}
      Array.prototype.forEach.call(m.addedNodes||[],queueThumbnailScan39101)
    })
  });
  thumbObserver3997.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src"]})
}


function installBrokenThumbFallback3999(){
  if(window.__VSA_BROKEN_THUMB_3999)return;
  window.__VSA_BROKEN_THUMB_3999=true;
  document.addEventListener("error",function(ev){
    var img=ev&&ev.target;
    if(!img||img.nodeType!==1||String(img.tagName).toUpperCase()!=="IMG")return;
    try{
      var current=String(img.getAttribute("src")||"");
      var hq=String(img.dataset&&img.dataset.v3997HqSrc||"");
      if(hq&&current===hq)return;
      if(!img.matches(".thumb,.gem-thumb,.detective-thumb,.discovery-card img,.v39-thumb img,.v399-related-thumb img,.v37-producer-song img"))return;
      var fb=document.createElement("span");
      fb.className=(String(img.className||"").trim()+" v3999-thumb-fallback").trim();
      fb.setAttribute("aria-hidden","true");
      fb.textContent="♪";
      if(img.width)fb.style.width=img.width+"px";
      if(img.height)fb.style.minHeight=img.height+"px";
      img.replaceWith(fb)
    }catch(_){}
  },true)
}


/* Route visibility watchdog · v39.102
   Repairs the recurring "black tools screen" state where the modal/backdrop
   is visible but the requested tool-view was left hidden by a late async route. */
var routeRepairTimers39100=[];
function routeLooksHealthy39100(route){
  var modal=document.getElementById("toolsModal");
  if(!modal||modal.hidden)return false;
  var target=modal.querySelector('.tool-view[data-tool-view="'+String(route||"")+'"]');
  if(!target||target.hidden||!target.classList.contains("active"))return false;
  try{
    var cs=getComputedStyle(target);
    if(cs.display==="none"||cs.visibility==="hidden")return false
  }catch(_){}
  return modal.dataset.currentView===route
}
function repairRoute39100(route,reason){
  route=String(route||window.__VSA37_CURRENT_ROUTE||"").trim();
  if(!route||route==="home")return true;
  if(routeLooksHealthy39100(route))return true;
  try{if(typeof window.ensureCorePages37==="function")window.ensureCorePages37()}catch(_){}
  var modal=document.getElementById("toolsModal");
  if(!modal)return false;
  var target=modal.querySelector('.tool-view[data-tool-view="'+route+'"]');
  if(!target)return false;

  modal.hidden=false;
  modal.dataset.currentView=route;
  document.body.classList.add("tools-open");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("overflow");

  modal.querySelectorAll(".tool-view").forEach(function(v){
    var on=v===target;
    v.classList.toggle("active",on);
    v.hidden=!on;
    if(on){
      v.style.removeProperty("display");
      v.style.removeProperty("visibility");
      v.style.removeProperty("opacity")
    }else{
      v.style.setProperty("display","none","important")
    }
  });
  document.querySelectorAll("#toolsTabs button").forEach(function(b){
    b.classList.toggle("active",b.dataset.tool===route)
  });
  window.__VSA37_CURRENT_ROUTE=route;
  window.__VSA_ROUTE_REPAIR_39100={route:route,reason:String(reason||""),at:Date.now()};
  try{
    if(typeof window.recordRuntimeError37==="function"){
      window.recordRuntimeError37("route-watchdog-repair","숨겨진 화면을 자동 복구했습니다.",{route:route,reason:String(reason||"")})
    }
  }catch(_){}
  return routeLooksHealthy39100(route)
}
function scheduleRouteRepair39100(route,reason){
  route=String(route||window.__VSA37_CURRENT_ROUTE||"").trim();
  if(!route||route==="home")return;
  while(routeRepairTimers39100.length){
    try{clearTimeout(routeRepairTimers39100.pop())}catch(_){}
  }
  [24,220,700].forEach(function(delay){
    routeRepairTimers39100.push(setTimeout(function(){
      repairRoute39100(route,reason+"@"+delay)
    },delay))
  })
}
function installRouteWatchdog39100(){
  if(window.__VSA_ROUTE_WATCHDOG_39100)return;
  window.__VSA_ROUTE_WATCHDOG_39100=true;
  window.addEventListener("vsa:route-change",function(e){
    var route=e&&e.detail&&e.detail.route;
    if(route&&route!=="home")scheduleRouteRepair39100(route,"route-change")
  });
  window.addEventListener("pageshow",function(){
    var route=window.__VSA37_CURRENT_ROUTE;
    if(route&&route!=="home")scheduleRouteRepair39100(route,"pageshow")
  });
  document.addEventListener("visibilitychange",function(){
    if(document.hidden)return;
    var route=window.__VSA37_CURRENT_ROUTE;
    if(route&&route!=="home")scheduleRouteRepair39100(route,"visibility")
  });
  window.VSARepairRoute39100=repairRoute39100
}

function syncWorkerPill(){
  var old=q(".topbar .status>.pill:first-child"),txt=q("#statusText"),dot=q("#statusDot");
  if(!old)return;
  old.id="v3982WorkerPill";
  var text=String(txt&&txt.textContent||"").trim();
  var state=/연결됨|live/i.test(text)?"live":/실패|오프라인|error/i.test(text)?"err":"warn";
  old.dataset.state=state;
  old.title=(text||"Worker 상태")+" · 눌러서 Worker 주소 설정";
  old.setAttribute("aria-label",(text||"Worker 상태")+". Worker 주소 설정 열기");
  if(dot&&!dot.className.includes("dot"))dot.classList.add("dot")
}
function workerBase3986(){
  try{return String(localStorage.getItem("vocaloidIcebergProxy")||"").trim().replace(/\/+$/,"").replace(/\/(api|health)$/i,"")}catch(_){return""}
}
function applyWorkerEvent3986(detail){
  detail=detail||{};
  var base=workerBase3986(),endpoint=String(detail.endpoint||base||"").replace(/\/+$/,""),txt=document.getElementById("statusText"),snap=document.getElementById("snapshotLabel");
  if(base&&endpoint&&endpoint!==base)return;
  var ok=detail.ok===true,missing=!base||detail.reason==="missing",source=String(detail.source||"");
  if(detail.ok===false&&!missing&&source!=="health"){
    // 개별 API 요청 실패만으로 Worker 자체를 끊김 처리하지 않는다.
    // 짧은 지연 뒤 /health 결과가 실제 연결 상태를 확정한다.
    checkWorker3986(160);
    return
  }
  workerState3986={ok:ok,reason:String(detail.reason||""),endpoint:endpoint||base,at:Date.now()};
  window.__VSA_WORKER_STATE3986=workerState3986;
  var label=ok?"Worker 연결됨":missing?"Worker 설정 필요":"Worker 연결 실패";
  try{
    if(typeof window.setStatus==="function")window.setStatus(ok?"live":missing?"warn":"err",label);
    else if(txt)txt.textContent=label
  }catch(_){if(txt)txt.textContent=label}
  if(snap)snap.textContent=ok?(detail.reason==="api-error"?"Worker 정상 · 요청 오류":"검색 연결 정상"):missing?"웹검색은 사용 가능":"Worker 연결 확인 필요";
  try{
    if(ok)localStorage.setItem("vsa.worker.lastOk3986",JSON.stringify({endpoint:endpoint||base,at:Date.now()}));
    else if(detail.ok===false)localStorage.removeItem("vsa.worker.lastOk3986")
  }catch(_){}
  syncWorkerPill()
}
function checkWorker3986(delay){
  clearTimeout(workerCheckTimer3986);
  workerCheckTimer3986=setTimeout(function(){
    var base=workerBase3986();
    if(!base){applyWorkerEvent3986({ok:false,reason:"missing",endpoint:""});return}
    try{
      if(window.VSADataBridge73&&typeof window.VSADataBridge73.check==="function"){
        Promise.resolve(window.VSADataBridge73.check(false)).catch(function(){});
        return
      }
    }catch(_){}
    var ctl=null,timer=0;
    try{
      ctl=new AbortController();timer=setTimeout(function(){try{ctl.abort()}catch(_){}},6000);
      fetch(base+"/health?t="+Date.now(),{cache:"no-store",signal:ctl.signal,headers:{"Accept":"application/json"}}).then(function(r){
        return r.json().catch(function(){return{}}).then(function(data){
          clearTimeout(timer);
          var ok=!!(r.ok&&data&&data.ok===true);
          var d={ok:ok,reason:ok?"":"network",endpoint:base,message:ok?"":"Worker /health 응답 이상",source:"health"};
          try{window.dispatchEvent(new CustomEvent("vsa:worker-status",{detail:d}))}catch(_){applyWorkerEvent3986(d)}
        })
      }).catch(function(e){
        clearTimeout(timer);
        var d={ok:false,reason:"network",endpoint:base,message:String(e&&e.message||e),source:"health"};
        try{window.dispatchEvent(new CustomEvent("vsa:worker-status",{detail:d}))}catch(_){applyWorkerEvent3986(d)}
      })
    }catch(_){}
  },Math.max(0,Number(delay)||0))
}
var viewportRaf39101=0;
function syncViewport3986(){
  if(!window.visualViewport){document.body.classList.remove("v3986-keyboard");return}
  var vv=window.visualViewport,base=Math.max(document.documentElement.clientHeight||0,window.innerHeight||0);
  var ae=document.activeElement,typing=!!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));
  var diff=Math.max(0,base-vv.height),keyboard=window.innerWidth<900&&typing&&diff>180&&vv.height<base*.78;
  document.body.classList.toggle("v3986-keyboard",keyboard)
}
function scheduleViewport39101(){
  if(viewportRaf39101)return;
  viewportRaf39101=requestAnimationFrame(function(){viewportRaf39101=0;syncViewport3986()})
}
function cleanupLegacyNav(){
  qa(".v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,.mobile-bottom-nav,.bottom-nav,.app-bottom-nav,.mobile-section-nav").forEach(function(el){
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
  var page=document.querySelector('[data-tool-view="settings29"].active'),panel=document.getElementById("settingsPanel");
  if(!page||page.hidden)return false;
  qa("details",page).forEach(function(d){d.open=true});
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
  var tries=0;
  function aim(){
    openSettingsDetails3983();
    if(focusWorkerInput3984())return;
    tries++;
    if(tries<4)setTimeout(aim,tries===1?120:220)
  }
  setTimeout(aim,70)
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
  var summaryHtml=
   '<button type="button" data-v3983-setting="worker"><small>WORKER</small><b>'+esc(workerState)+'</b><span>'+esc(worker)+'</span></button>'+
   '<button type="button" data-v3983-setting="autonext" aria-pressed="'+(autoNext?"true":"false")+'"><small>PLAYER</small><b>다음 곡 자동재생 '+(autoNext?"켬":"끔")+'</b><span>곡이 끝나면 재생 큐의 다음 곡으로 자동 이동</span></button>'+
   '<button type="button" data-v3983-setting="web"><small>WEB UI</small><b>v'+esc(web)+'</b><span>Live Shell 최신 UI</span></button>'+
   '<button type="button" data-v3983-setting="app"><small>APP SHELL</small><b>'+(shell?"v"+esc(shell):"확인 중")+'</b><span>Android 네이티브 셸</span></button>';
  if(summary.innerHTML!==summaryHtml)summary.innerHTML=summaryHtml;
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
      if(card&&card.parentElement&&card!==card.parentElement.lastElementChild)card.parentElement.appendChild(card)
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
          if(n.namespaceURI&&n.namespaceURI!=="http://www.w3.org/1999/xhtml")continue;
          if(n.matches&&n.matches(".v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,.mobile-bottom-nav,.bottom-nav,.app-bottom-nav,.mobile-section-nav"))needs=true;
          else if(n.querySelector&&n.children&&n.children.length&&n.querySelector(".v37-dock,.v36-dock,.v34-dock,.v33-dock,#v30BottomDock,.mobile-bottom-nav,.bottom-nav,.app-bottom-nav,.mobile-section-nav"))needs=true
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

function handleDockClick3988(e){
  var b=e.target&&e.target.closest?e.target.closest("button[data-v3980]"):null;if(!b)return;
  e.preventDefault();e.stopPropagation();
  var v=b.dataset.v3980;
  document.body.classList.remove("v3986-keyboard");
  if(v==="home")goHome();
  else if(v==="explore")openRoute("hub37");
  else if(v==="dive"){
    if(b.classList.contains("loading"))return;
    b.classList.add("loading");b.setAttribute("aria-busy","true");
    Promise.resolve(openDive3985()).then(function(ok){
      if(ok===false&&typeof toast==="function")toast("다이브 화면을 열지 못했습니다. 다시 눌러주세요.")
    }).catch(function(){
      if(typeof toast==="function")toast("다이브 화면을 열지 못했습니다. 다시 눌러주세요.")
    }).finally(function(){b.classList.remove("loading");b.removeAttribute("aria-busy")})
  }
  else if(v==="library")openLibrary()
}
function ensureDock(){
  var d=document.getElementById("v3980Dock");
  if(!d){
    d=document.createElement("nav");d.id="v3980Dock";d.setAttribute("aria-label","VocaDive 주요 메뉴");
    d.innerHTML=[
      ["home","⌂","홈"],
      ["explore","✦","탐색"],
      ["dive","◉","다이브"],
      ["library","♡","보관함"]
    ].map(function(x){return'<button type="button" data-v3980="'+x[0]+'" aria-label="'+x[2]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>'}).join("");
    document.body.appendChild(d)
  }
  if(d.dataset.v3988Bound!=="1"){
    d.dataset.v3988Bound="1";
    d.addEventListener("click",handleDockClick3988,true)
  }
  d.style.pointerEvents="auto";
  if(!q("#v3980Dock button.active"))setDock(dockForRoute(window.__VSA37_CURRENT_ROUTE||"home"))
}
function setDock(v){
  qa("#v3980Dock button").forEach(function(b){
    var on=b.dataset.v3980===v;
    b.classList.toggle("active",on);
    b.setAttribute("aria-current",on?"page":"false");
    b.setAttribute("aria-pressed",on?"true":"false")
  })
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
    if(typeof window.setToolView==="function"){
      window.setToolView(name);
      if(routeIsActive3985(name))return true
    }
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
  document.body.classList.remove("v3986-keyboard");
  setDock("dive");
  function lockDive(){
    if(ticket!==navSeq3985)return false;
    var ok=verifyRoute3985("universe29",ticket);
    if(ok){
      lastRoute="dive";setDock("dive");scheduleRepair();
      requestAnimationFrame(function(){
        try{
          var page=document.querySelector('[data-tool-view="universe29"].active');
          if(page&&page.scrollTop>24)page.scrollTo({top:0,behavior:"smooth"})
        }catch(_){}
      })
    }
    return ok
  }
  try{
    if(typeof window.openUniverseHub3931==="function"){
      var launched=window.openUniverseHub3931();
      return Promise.resolve(launched).then(function(){
        if(ticket!==navSeq3985)return false;
        if(lockDive())return true;
        return openRoute("universe29",ticket).then(function(){lockDive();return routeIsActive3985("universe29")})
      }).catch(function(){
        return openRoute("universe29",ticket).then(function(){lockDive();return routeIsActive3985("universe29")})
      })
    }
  }catch(_){}
  return openRoute("universe29",ticket).then(function(){lockDive();return routeIsActive3985("universe29")})
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
  var query=String(value||"").trim(),ticket=++navSeq3985;
  return ensureV33().then(function(ok){
    if(ticket!==navSeq3985)return false;
    if(!ok){return openRoute("search29",ticket)}
    openRaw("searchHub33");
    if(ticket!==navSeq3985)return false;
    verifyRoute3985("searchHub33",ticket);lastRoute="explore";setDock("explore");
    var tries=0;
    function fill(){
      if(ticket!==navSeq3985)return;
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
  window.addEventListener("vsa:worker-status",function(e){setTimeout(function(){applyWorkerEvent3986(e&&e.detail||{});scheduleRepair()},0)});
  window.addEventListener("vsa:worker-config-changed",function(){syncWorkerPill();checkWorker3986(180)});
  document.addEventListener("visibilitychange",function(){if(!document.hidden){scheduleRepair();checkWorker3986(250)}});
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize",scheduleViewport39101,{passive:true});
    window.visualViewport.addEventListener("scroll",scheduleViewport39101,{passive:true})
  }
  window.addEventListener("resize",scheduleViewport39101,{passive:true});
  document.addEventListener("focusout",function(){setTimeout(scheduleViewport39101,80)},true);
  document.addEventListener("pointerdown",function(e){
    if(e.target&&e.target.closest&&e.target.closest("#v3980Dock"))document.body.classList.remove("v3986-keyboard")
  },true);
  document.addEventListener("click",function(e){
    var dive=e.target&&e.target.closest?e.target.closest('#v3980Dock button[data-v3980="dive"]'):null;
    if(!dive)return;
    if(e.__v3986DiveSafetyHandled)return;
    e.__v3986DiveSafetyHandled=true;
    e.preventDefault();e.stopImmediatePropagation();
    if(dive.classList.contains("loading"))return;
    dive.classList.add("loading");dive.setAttribute("aria-busy","true");
    Promise.resolve(openDive3985()).then(function(ok){
      if(ok===false){
        try{
          if(typeof window.openUniverseHub3931==="function")window.openUniverseHub3931();
          else forceRoute3985("universe29")
        }catch(_){}
      }
    }).catch(function(){
      try{
        if(typeof window.openUniverseHub3931==="function")window.openUniverseHub3931();
        else forceRoute3985("universe29")
      }catch(_){}
    }).finally(function(){dive.classList.remove("loading");dive.removeAttribute("aria-busy")})
  },true);
  document.addEventListener("click",function(e){
    var m=document.getElementById("v3982Menu"),b=document.getElementById("v3980MenuBtn");
    if(m&&!m.hidden&&!m.contains(e.target)&&e.target!==b)closeMenu3982()
  },true);
  document.addEventListener("click",function(e){
    var dive=e.target&&e.target.closest?e.target.closest("[data-v39-open-universe]"):null;
    if(dive){
      setTimeout(function(){
        if(!routeIsActive3985("universe29")){
          try{if(typeof window.openUniverseHub3931==="function")window.openUniverseHub3931();else forceRoute3985("universe29")}catch(_){}
        }
      },0);
      return
    }
    var homeDive=e.target&&e.target.closest?e.target.closest("[data-v3989-search],[data-v3989-random],[data-v3989-resume]"):null;
    if(homeDive){
      setTimeout(function(){
        if(!routeIsActive3985("universe29")){
          try{openDive3985()}catch(_){try{forceRoute3985("universe29")}catch(__){}}
        }
      },140);
      return
    }
    var featureEl=e.target&&e.target.closest?e.target.closest("[data-v37-feature-id]"):null;
    if(featureEl){
      var featureId=featureEl.dataset?featureEl.dataset.v37FeatureId:"";
      setTimeout(function(){
        try{
          var reg=window.VSA37FeatureRegistry&&window.VSA37FeatureRegistry[featureId],expected=reg&&reg.route;
          if(expected&&!routeIsActive3985(expected)&&typeof window.VSAOpenFeature37==="function")window.VSAOpenFeature37(featureId)
        }catch(_){}
      },220);
      return
    }
    var routeEl=e.target&&e.target.closest?e.target.closest("[data-v3981-route]"):null;
    var route=routeEl&&routeEl.dataset?routeEl.dataset.v3981Route:"";
    if(route){
      setTimeout(function(){if(!routeIsActive3985(route))openRoute(route)},0)
    }
  },true);
  var statusText=document.getElementById("statusText");
  if(statusText&&window.MutationObserver)new MutationObserver(syncWorkerPill).observe(statusText,{childList:true,subtree:true,characterData:true});
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest('a[href*="nicovideo.jp/watch/"]');
    if(a)setTimeout(scheduleRepair,80)
  },true);
  var modal=document.getElementById("toolsModal");
  if(modal&&window.MutationObserver){
    observer=new MutationObserver(function(muts){
      var relevant=false;
      for(var i=0;i<muts.length&&!relevant;i++){
        var m=muts[i],t=m.target;
        if(m.type==="attributes"){
          relevant=!!(t===modal||(t&&t.classList&&(t.classList.contains("tool-view")||t.classList.contains("tools-body"))))
        }else if(m.type==="childList"){
          relevant=!!(t===modal||(t&&t.classList&&t.classList.contains("tools-body")))
        }
      }
      if(relevant)scheduleRepair()
    });
    observer.observe(modal,{attributes:true,attributeFilter:["hidden","class","data-current-view"],childList:true,subtree:true})
  }
}
function boot(){
  window.__VSA_WORKER_TOP_OWNER=true;
  addStyle();installHiResThumb3997();installBrokenThumbFallback3999();installRouteWatchdog39100();ensureTopbar();ensureDock();watchLegacyNav3983();bind();scheduleRepair();syncViewport3986();
  document.documentElement.dataset.vocaUi=VERSION;
  checkWorker3986(420);
  setTimeout(function(){ensureTopbar();ensureDock();cleanupLegacyNav();scheduleRepair();syncViewport3986()},250);
  setTimeout(function(){ensureTopbar();ensureDock();cleanupLegacyNav();scheduleRepair()},900);
  setTimeout(function(){ensureTopbar();ensureDock();cleanupLegacyNav();scheduleRepair()},2200)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

;(()=>{try{
  if(document.querySelector('script[data-vsa-iceberg-39115]'))return;
  const x=document.createElement("script");
  x.src="./iceberg-v39115.js?v=39.115.0";
  x.async=false;
  x.dataset.vsaIceberg39115="1";
  document.head.appendChild(x);
}catch(e){console.warn("[VocaDive] iceberg v39.107 loader",e)}})();
