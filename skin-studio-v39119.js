/* VocaDive Skin Studio v39.119.0
 * MP3 / music-station inspired skin engine with persistent per-device customization.
 */
(function(){
"use strict";

var VERSION="39.119.0";
var STORE="vsa.skin.studio.v1";
var STYLE_ID="v39119SkinStudioStyle";
var DRAWER_ID="v39119SkinDrawer";
var state=null;
var mountTimer=0;

var PRESETS={
  classic:{name:"VocaDive Classic",tag:"ORIGINAL",desc:"현재 VocaDive 디자인을 그대로 사용",accent:"#63d8cf",accent2:"#7a8ef2",bg:"#091113",surface:"#10191b",text:"#eef4f3",muted:"#91a3a1",radius:14,blur:16,grain:0,density:"normal",player:"classic"},
  station:{name:"Music Station 2000",tag:"MP3 STATION",desc:"2000년대 MP3 플레이어와 음악 방송국 패널 감성",accent:"#75f0dd",accent2:"#89a3ff",bg:"#071115",surface:"#0d1d21",text:"#f3fffc",muted:"#8da9a6",radius:10,blur:10,grain:1,density:"compact",player:"station"},
  walkman:{name:"Night Walkman",tag:"NIGHT",desc:"어두운 휴대용 플레이어와 야간 산책 감성",accent:"#b8ff72",accent2:"#68b6ff",bg:"#070b0d",surface:"#11181a",text:"#f2f7ef",muted:"#91a096",radius:8,blur:4,grain:1,density:"compact",player:"walkman"},
  aqua:{name:"Aqua Glass",tag:"GLASS",desc:"투명 아크릴과 수면 반사 같은 밝은 유리 패널",accent:"#79e7ff",accent2:"#a89cff",bg:"#06131b",surface:"#0b2029",text:"#f2fbff",muted:"#91abb6",radius:18,blur:24,grain:0,density:"normal",player:"glass"},
  cassette:{name:"Cassette Warm",tag:"TAPE",desc:"카세트 데크의 따뜻한 조명과 아날로그 질감",accent:"#ffcf79",accent2:"#ed8f72",bg:"#15110d",surface:"#211a13",text:"#fff6e8",muted:"#b8a691",radius:7,blur:3,grain:1,density:"normal",player:"cassette"},
  neon:{name:"Neon Deck",tag:"SYNTH",desc:"보컬로이드 신스와 네온 장비 랙을 섞은 스타일",accent:"#6df7ec",accent2:"#d86dff",bg:"#090713",surface:"#151024",text:"#fbf5ff",muted:"#a79ab4",radius:12,blur:18,grain:1,density:"normal",player:"neon"},
  mono:{name:"Pocket Mono",tag:"MINIMAL",desc:"작은 흑백 MP3 플레이어처럼 정보에 집중",accent:"#d9f5ef",accent2:"#a8b5b2",bg:"#0c1010",surface:"#151a19",text:"#f1f5f4",muted:"#96a09e",radius:5,blur:0,grain:0,density:"dense",player:"mono"}
};

function clamp(v,min,max){v=Number(v);return Number.isFinite(v)?Math.max(min,Math.min(max,v)):min}
function safeHex(v,fallback){v=String(v||"");return /^#[0-9a-f]{6}$/i.test(v)?v:fallback}
function preset(id){return PRESETS[id]||PRESETS.classic}
function defaults(){
  var p=PRESETS.classic;
  return{preset:"classic",accent:p.accent,accent2:p.accent2,bg:p.bg,radius:p.radius,blur:p.blur,grain:p.grain,density:p.density,eq:true,ambient:true,compactMeta:false}
}
function read(){
  var out=defaults();
  try{
    var raw=JSON.parse(localStorage.getItem(STORE)||"null");
    if(raw&&typeof raw==="object")Object.keys(out).forEach(function(k){if(raw[k]!==undefined)out[k]=raw[k]})
  }catch(_){}
  if(!PRESETS[out.preset])out.preset="classic";
  out.accent=safeHex(out.accent,preset(out.preset).accent);
  out.accent2=safeHex(out.accent2,preset(out.preset).accent2);
  out.bg=safeHex(out.bg,preset(out.preset).bg);
  out.radius=clamp(out.radius,2,28);
  out.blur=clamp(out.blur,0,32);
  out.grain=out.grain?1:0;
  out.eq=out.eq!==false;
  out.ambient=out.ambient!==false;
  out.compactMeta=!!out.compactMeta;
  if(["normal","compact","dense"].indexOf(out.density)<0)out.density="normal";
  return out
}
function save(){
  try{localStorage.setItem(STORE,JSON.stringify(state))}catch(_){}
}
function hexRgb(hex){
  var n=parseInt(String(hex).slice(1),16);
  return[(n>>16)&255,(n>>8)&255,n&255]
}
function mix(hex,amount){
  var rgb=hexRgb(hex),to=amount>=0?255:0,a=Math.abs(amount);
  return"rgb("+rgb.map(function(x){return Math.round(x+(to-x)*a)}).join(",")+")"
}
function rgba(hex,a){var r=hexRgb(hex);return"rgba("+r[0]+","+r[1]+","+r[2]+","+a+")"}

function css(){
  return [
  "#"+DRAWER_ID+"{position:fixed;inset:0;z-index:41000;display:grid;grid-template-columns:minmax(0,1fr) min(440px,94vw);background:rgba(0,0,0,.56);backdrop-filter:blur(7px)}",
  "#"+DRAWER_ID+"[hidden]{display:none!important}",
  ".v39119-scrim{min-width:0}",
  ".v39119-drawer{height:100dvh;overflow:auto;padding:18px;background:var(--vd-bg,#091113);border-left:1px solid var(--vd-line,rgba(255,255,255,.12));color:var(--vd-text,#fff);box-shadow:-30px 0 80px rgba(0,0,0,.34)}",
  ".v39119-head{display:flex;align-items:start;justify-content:space-between;gap:12px;padding:4px 2px 14px;border-bottom:1px solid var(--vd-line)}",
  ".v39119-head small{display:block;color:var(--vd-accent);font-size:8px;font-weight:950;letter-spacing:.14em}.v39119-head h2{margin:4px 0 4px;font-size:24px;letter-spacing:-.05em}.v39119-head p{margin:0;color:var(--vd-muted);font-size:9px;line-height:1.5}",
  ".v39119-close{width:38px;height:38px;flex:0 0 38px;border:0;border-radius:50%;background:var(--vd-surface-2);color:var(--vd-text);font-size:21px}",
  ".v39119-section{padding:16px 0;border-bottom:1px solid var(--vd-line)}.v39119-section>h3{margin:0 0 9px;font-size:12px}.v39119-section>p{margin:-4px 0 10px;color:var(--vd-muted);font-size:8px}",
  ".v39119-presets{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v39119-preset{min-height:104px;display:flex;flex-direction:column;align-items:flex-start;gap:5px;padding:11px;border:1px solid var(--vd-line);border-radius:calc(var(--vd-radius) * .85);background:var(--vd-surface);color:var(--vd-text);text-align:left}.v39119-preset:hover{background:var(--vd-hover)}.v39119-preset.active{border-color:var(--vd-accent);box-shadow:inset 0 0 0 1px var(--vd-accent)}",
  ".v39119-preset i{width:100%;height:24px;border-radius:6px;background:linear-gradient(90deg,var(--sw1),var(--sw2));box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}.v39119-preset small{font-size:6px;color:var(--vd-accent);font-weight:950;letter-spacing:.12em}.v39119-preset b{font-size:10px}.v39119-preset span{color:var(--vd-muted);font-size:7px;line-height:1.35}",
  ".v39119-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v39119-field{display:grid;gap:5px;padding:9px;border:1px solid var(--vd-line);border-radius:10px;background:var(--vd-surface)}.v39119-field.wide{grid-column:1/-1}.v39119-field label{font-size:7px;color:var(--vd-muted);font-weight:850}.v39119-field output{justify-self:end;margin-top:-17px;font-size:7px;color:var(--vd-accent)}",
  ".v39119-field input[type='color']{width:100%;height:38px;padding:2px;border:0;border-radius:8px;background:transparent}.v39119-field input[type='range']{width:100%;min-height:28px;padding:0}.v39119-field select{width:100%;min-height:38px}",
  ".v39119-switches{display:grid;gap:6px}.v39119-switch{min-height:46px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;padding:9px 10px;border:1px solid var(--vd-line);border-radius:10px;background:var(--vd-surface)}.v39119-switch b{font-size:9px}.v39119-switch small{display:block;margin-top:2px;color:var(--vd-muted);font-size:7px}.v39119-switch input{width:18px;height:18px;min-height:0}",
  ".v39119-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding-top:14px}.v39119-actions button{min-height:42px;border:0;border-radius:10px;background:var(--vd-surface-2);color:var(--vd-text);font-size:8px;font-weight:900}.v39119-actions .primary{background:var(--vd-accent);color:#07110f}",
  ".v39119-skin-btn{min-height:34px!important;padding:0 10px!important;border:1px solid var(--vd-line)!important;border-radius:999px!important;background:var(--vd-surface)!important;color:var(--vd-text)!important;font-size:8px!important;font-weight:900!important;white-space:nowrap}",
  ".v39119-settings-card{margin:14px 0;padding:14px;border:1px solid var(--vd-line);border-radius:14px;background:var(--vd-surface)}.v39119-settings-card h3{margin:0;font-size:13px}.v39119-settings-card p{margin:5px 0 10px;color:var(--vd-muted);font-size:8px;line-height:1.5}.v39119-settings-card button{min-height:40px;padding:0 12px;border:0;border-radius:999px;background:var(--vd-accent);color:#07110f;font-size:8px;font-weight:950}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']){--vd-radius:var(--skin-radius)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']),body[data-vsa-skin]:not([data-vsa-skin='classic'])>.app{background:var(--skin-bg)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic'])>.app>.topbar{background:var(--skin-topbar)!important;backdrop-filter:blur(var(--skin-blur)) saturate(1.12)!important;border-bottom-color:var(--skin-line)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']) #v3980SearchForm{background:var(--skin-control)!important;border-color:var(--skin-line-strong)!important;border-radius:calc(var(--skin-radius) + 12px)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']) #v3980SearchBtn{background:var(--skin-surface-2)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']) :is(.v396-hero,.v37-hub-card,.v37-intent-card,.v33-card,.v333-follow-card,.discovery-card,.gem-card,.v37-producer-card,.v3990-zone,.v395-personal-card,.v37-diag-card,.v37-safety-card){border-color:var(--skin-line)!important;border-radius:var(--skin-radius)!important;background:var(--skin-surface)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']) :is(.v39-thumb,.v37-thumb,.v35-thumb,.v399-related-thumb,.thumb,.gem-thumb){border-radius:calc(var(--skin-radius) * .72)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']) :is(.v33-dock,#v3980Dock){background:var(--skin-dock)!important;backdrop-filter:blur(var(--skin-blur)) saturate(1.15)!important;border-color:var(--skin-line)!important}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']) :is(button,.v33-chip,.v37-quick-chip){transition:transform .16s ease,background .16s ease,border-color .16s ease}",
  "body[data-vsa-skin]:not([data-vsa-skin='classic']) :is(.v37-hub-card,.v37-intent-card,.v33-card,.discovery-card,.gem-card):hover{transform:translateY(-1px)}",
  "body[data-vsa-skin][data-vsa-density='compact'] .v39-media-grid{gap:14px 10px!important}body[data-vsa-skin][data-vsa-density='compact'] :is(.v37-hub-card,.v37-intent-card,.v3990-zone){padding:10px!important}",
  "body[data-vsa-skin][data-vsa-density='dense'] .v39-media-grid{gap:10px 8px!important}body[data-vsa-skin][data-vsa-density='dense'] :is(.v37-hub-card,.v37-intent-card,.v3990-zone){padding:8px!important}body[data-vsa-skin][data-vsa-density='dense'] .v39-media-meta{font-size:7px!important}",
  "body[data-vsa-skin][data-vsa-grain='1']:after{content:'';position:fixed;inset:0;z-index:39999;pointer-events:none;opacity:.035;background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E\");mix-blend-mode:soft-light}",
  "body[data-vsa-skin][data-vsa-ambient='1'] .v396-hero,body[data-vsa-skin][data-vsa-ambient='1'] .v3989-dive-entry{box-shadow:0 20px 80px var(--skin-glow)!important}",
  "body[data-vsa-skin][data-vsa-compact-meta='1'] :is(.v39-media-reason,.v39-media-meta,.v37-hub-copy small){opacity:.72}.v39119-eq{display:none}",
  "body[data-vsa-eq='1'] .v39119-eq{height:14px;display:inline-flex!important;align-items:flex-end;gap:2px;margin-left:6px;vertical-align:middle}.v39119-eq i{display:block;width:2px;height:6px;border-radius:2px;background:var(--vd-accent);animation:v39119eq .78s ease-in-out infinite alternate}.v39119-eq i:nth-child(2){animation-delay:-.28s;height:11px}.v39119-eq i:nth-child(3){animation-delay:-.52s;height:8px}.v39119-eq i:nth-child(4){animation-delay:-.16s;height:13px}@keyframes v39119eq{to{height:3px;opacity:.55}}",
  "body[data-vsa-skin='station']{font-variant-numeric:tabular-nums}",
  "body[data-vsa-skin='station']>.app>.topbar{box-shadow:inset 0 -1px 0 rgba(117,240,221,.08)!important}",
  "body[data-vsa-skin='station'] .logo{border-radius:7px!important;background:linear-gradient(145deg,#b7d8d3,#4f7777)!important;color:#071113!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)!important}",
  "body[data-vsa-skin='station'] :is(.v37-hub-card,.v37-intent-card,.v33-card,.discovery-card,.gem-card,.v3990-zone){box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important}",
  "body[data-vsa-skin='station'] .v331-mini{border:1px solid var(--skin-line-strong)!important;border-radius:9px!important;background:linear-gradient(180deg,var(--skin-surface-2),var(--skin-surface))!important;box-shadow:0 18px 55px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.05)!important}",
  "body[data-vsa-skin='station'] .v331-mini-copy:before{content:'VOCADIVE // MP3';display:block;margin-bottom:2px;color:var(--vd-accent);font-size:5.5px;font-weight:950;letter-spacing:.18em}",
  "body[data-vsa-skin='station'] .v331-mini button{border-radius:6px!important;background:#172c30!important}",
  "body[data-vsa-skin='station'] .v331-player-shell{border-radius:10px!important;border-color:var(--skin-line-strong)!important;background:var(--skin-surface)!important}",
  "body[data-vsa-skin='station'] .v331-player-head:before{content:'STATION 39.119';color:var(--vd-accent);font-size:6px;font-weight:950;letter-spacing:.13em;margin-right:4px}",
  "body[data-vsa-skin='walkman'] .v331-mini{border-radius:8px!important;border-color:rgba(184,255,114,.28)!important;background:#0c120f!important;box-shadow:0 18px 50px rgba(0,0,0,.55)!important}",
  "body[data-vsa-skin='walkman'] .v331-mini-copy b,body[data-vsa-skin='walkman'] .v331-player-head b{font-family:ui-monospace,SFMono-Regular,Consolas,monospace!important;letter-spacing:.01em}",
  "body[data-vsa-skin='walkman'] .v331-mini-copy:before{content:'PLAY ▸';display:block;color:#b8ff72;font:700 6px ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em}",
  "body[data-vsa-skin='aqua'] :is(.v37-hub-card,.v37-intent-card,.v33-card,.discovery-card,.gem-card,.v3990-zone){background:linear-gradient(160deg,rgba(17,46,58,.82),rgba(8,28,37,.68))!important;backdrop-filter:blur(var(--skin-blur)) saturate(1.2)!important}",
  "body[data-vsa-skin='aqua'] .v331-mini{background:rgba(8,30,39,.88)!important;backdrop-filter:blur(24px) saturate(1.3)!important;border-color:rgba(121,231,255,.24)!important}",
  "body[data-vsa-skin='cassette'] :is(.v331-mini,.v331-player-shell){background:#1d1710!important;border-color:rgba(255,207,121,.24)!important}.v39119-cassette-label{display:none}",
  "body[data-vsa-skin='cassette'] .v331-mini-copy:before{content:'A  ▪  TAPE  ▪  60';display:block;color:#ffcf79;font:800 6px ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em}",
  "body[data-vsa-skin='neon'] .v331-mini{border-color:rgba(109,247,236,.32)!important;box-shadow:0 16px 60px rgba(216,109,255,.12),0 0 30px rgba(109,247,236,.08)!important}",
  "body[data-vsa-skin='mono'] :is(.v39-media-card,.v37-hub-card,.v37-intent-card,.discovery-card,.gem-card){box-shadow:none!important}body[data-vsa-skin='mono'] .v331-mini{border-radius:5px!important;box-shadow:none!important}",
  "@media(max-width:699px){#"+DRAWER_ID+"{grid-template-columns:1fr}.v39119-scrim{display:none}.v39119-drawer{width:100vw;border-left:0;padding:14px 12px calc(18px + env(safe-area-inset-bottom))}.v39119-presets{grid-template-columns:1fr 1fr}.v39119-skin-btn span{display:none}.v39119-skin-btn{width:34px!important;padding:0!important}.v39119-grid{grid-template-columns:1fr 1fr}}",
  "@media(max-width:420px){.v39119-presets{grid-template-columns:1fr}.v39119-head h2{font-size:21px}}"
  ].join("\n")
}
function ensureStyle(){
  var s=document.getElementById(STYLE_ID);
  if(!s){s=document.createElement("style");s.id=STYLE_ID;document.head.appendChild(s)}
  if(!s.textContent)s.textContent=css()
}
function variables(){
  var p=preset(state.preset);
  var accent=safeHex(state.accent,p.accent),accent2=safeHex(state.accent2,p.accent2),bg=safeHex(state.bg,p.bg);
  var surface=state.preset==="classic"?p.surface:mix(bg,.055);
  var surface2=state.preset==="classic"?"#152124":mix(bg,.095);
  var hover=state.preset==="classic"?"#1a2729":mix(bg,.13);
  return{
    "--vd-bg":bg,
    "--vd-surface":surface,
    "--vd-surface-2":surface2,
    "--vd-elevated":mix(bg,.11),
    "--vd-control":mix(bg,.035),
    "--vd-hover":hover,
    "--vd-line":rgba(accent,.10),
    "--vd-line-strong":rgba(accent,.24),
    "--vd-text":p.text,
    "--vd-muted":p.muted,
    "--vd-soft":mix(p.muted,-.12),
    "--vd-accent":accent,
    "--vd-accent-2":accent2,
    "--vd-radius":state.radius+"px",
    "--skin-bg":bg,
    "--skin-surface":surface,
    "--skin-surface-2":surface2,
    "--skin-control":mix(bg,.025),
    "--skin-topbar":rgba(bg,.94),
    "--skin-dock":rgba(bg,.94),
    "--skin-line":rgba(accent,.11),
    "--skin-line-strong":rgba(accent,.28),
    "--skin-glow":rgba(accent,.08),
    "--skin-radius":state.radius+"px",
    "--skin-blur":state.blur+"px"
  }
}
function apply(emit){
  ensureStyle();
  if(!state)state=read();
  var b=document.body;if(!b)return;
  b.dataset.vsaSkin=state.preset;
  b.dataset.vsaDensity=state.density;
  b.dataset.vsaGrain=String(state.grain?1:0);
  b.dataset.vsaEq=String(state.eq?1:0);
  b.dataset.vsaAmbient=String(state.ambient?1:0);
  b.dataset.vsaCompactMeta=String(state.compactMeta?1:0);
  var vars=variables();Object.keys(vars).forEach(function(k){b.style.setProperty(k,vars[k])});
  syncEq();
  refreshUi();
  if(emit!==false){save();try{window.dispatchEvent(new CustomEvent("vsa:skin-change",{detail:Object.assign({version:VERSION},state)}))}catch(_){}}
}
function applyPreset(id){
  var p=preset(id);
  state.preset=PRESETS[id]?id:"classic";
  state.accent=p.accent;state.accent2=p.accent2;state.bg=p.bg;state.radius=p.radius;state.blur=p.blur;state.grain=p.grain;state.density=p.density;
  apply(true)
}
function syncEq(){
  document.querySelectorAll(".v331-mini-copy").forEach(function(host){
    if(!host.querySelector(".v39119-eq")){
      var eq=document.createElement("span");eq.className="v39119-eq";eq.setAttribute("aria-hidden","true");eq.innerHTML="<i></i><i></i><i></i><i></i>";host.appendChild(eq)
    }
  })
}
function button(){
  var status=document.querySelector(".topbar .status");if(!status||status.querySelector(".v39119-skin-btn"))return;
  var b=document.createElement("button");b.type="button";b.className="v39119-skin-btn";b.innerHTML="◫ <span>스킨</span>";b.setAttribute("aria-label","스킨 스튜디오 열기");b.onclick=open;
  status.appendChild(b)
}
function settingsCard(){
  var page=document.querySelector('[data-tool-view="settings29"]')||document.getElementById("settingsPanel");
  if(!page||page.querySelector(".v39119-settings-card"))return;
  var card=document.createElement("section");card.className="v39119-settings-card";
  card.innerHTML="<h3>스킨 스튜디오</h3><p>MP3 플레이어·음악 스테이션 계열 프리셋을 적용하고 색, 모서리, 밀도, 블러, 질감과 플레이어 EQ를 조절합니다. 설정은 이 기기에 저장됩니다.</p><button type='button'>스킨 꾸미기 열기</button>";
  card.querySelector("button").onclick=open;
  var anchor=page.querySelector("#settingsPanel")||page;
  if(anchor.firstChild)anchor.insertBefore(card,anchor.firstChild);else anchor.appendChild(card)
}
function drawer(){
  var d=document.getElementById(DRAWER_ID);if(d)return d;
  d=document.createElement("div");d.id=DRAWER_ID;d.hidden=true;
  d.innerHTML="<div class='v39119-scrim' data-v39119-close></div><aside class='v39119-drawer' role='dialog' aria-modal='true' aria-label='VocaDive 스킨 스튜디오'><header class='v39119-head'><div><small>VOCADIVE · SKIN STUDIO</small><h2>나만의 음악 스테이션</h2><p>프리셋을 고른 뒤 세부 느낌을 바로 조절할 수 있습니다.</p></div><button class='v39119-close' type='button' data-v39119-close aria-label='닫기'>×</button></header><section class='v39119-section'><h3>스킨 프리셋</h3><div class='v39119-presets' data-v39119-presets></div></section><section class='v39119-section'><h3>세부 꾸미기</h3><div class='v39119-grid'><div class='v39119-field'><label>강조색</label><input type='color' data-v39119='accent'></div><div class='v39119-field'><label>보조색</label><input type='color' data-v39119='accent2'></div><div class='v39119-field wide'><label>배경색</label><input type='color' data-v39119='bg'></div><div class='v39119-field'><label>모서리</label><output data-v39119-out='radius'></output><input type='range' min='2' max='28' step='1' data-v39119='radius'></div><div class='v39119-field'><label>블러</label><output data-v39119-out='blur'></output><input type='range' min='0' max='32' step='1' data-v39119='blur'></div><div class='v39119-field wide'><label>정보 밀도</label><select data-v39119='density'><option value='normal'>보통</option><option value='compact'>콤팩트</option><option value='dense'>고밀도 MP3</option></select></div></div></section><section class='v39119-section'><h3>플레이어 감성</h3><div class='v39119-switches'><label class='v39119-switch'><span><b>미니 플레이어 EQ</b><small>재생 바에 움직이는 4밴드 이퀄라이저 표시</small></span><input type='checkbox' data-v39119='eq'></label><label class='v39119-switch'><span><b>앰비언트 글로우</b><small>히어로·다이브 영역에 은은한 스킨색 빛 번짐</small></span><input type='checkbox' data-v39119='ambient'></label><label class='v39119-switch'><span><b>메타 정보 절제</b><small>보조 설명의 존재감을 줄여 MP3 화면처럼 정돈</small></span><input type='checkbox' data-v39119='compactMeta'></label><label class='v39119-switch'><span><b>아날로그 그레인</b><small>카세트·구형 액정 같은 아주 약한 질감 추가</small></span><input type='checkbox' data-v39119='grain'></label></div></section><div class='v39119-actions'><button type='button' data-v39119-export>스킨 코드 복사</button><button type='button' data-v39119-import>스킨 코드 불러오기</button><button type='button' data-v39119-reset>기본으로 초기화</button><button class='primary' type='button' data-v39119-close>완료</button></div></aside>";
  document.body.appendChild(d);
  d.querySelectorAll("[data-v39119-close]").forEach(function(x){x.addEventListener("click",close)});
  d.querySelector("[data-v39119-export]").onclick=exportSkin;
  d.querySelector("[data-v39119-import]").onclick=importSkin;
  d.querySelector("[data-v39119-reset]").onclick=function(){state=defaults();apply(true);renderDrawer()};
  d.querySelectorAll("[data-v39119]").forEach(function(el){
    var key=el.getAttribute("data-v39119");
    var ev=el.type==="range"||el.type==="color"?"input":"change";
    el.addEventListener(ev,function(){
      if(el.type==="checkbox")state[key]=!!el.checked;
      else if(el.type==="range")state[key]=Number(el.value);
      else state[key]=el.value;
      apply(true);renderDrawer(false)
    })
  });
  return d
}
function renderDrawer(rebuildPresets){
  var d=drawer(),wrap=d.querySelector("[data-v39119-presets]");
  if(rebuildPresets!==false||!wrap.children.length){
    wrap.innerHTML=Object.keys(PRESETS).map(function(id){
      var p=PRESETS[id],active=id===state.preset?" active":"";
      return"<button type='button' class='v39119-preset"+active+"' data-v39119-preset='"+id+"' style='--sw1:"+p.accent+";--sw2:"+p.accent2+"'><i></i><small>"+p.tag+"</small><b>"+p.name+"</b><span>"+p.desc+"</span></button>"
    }).join("");
    wrap.querySelectorAll("[data-v39119-preset]").forEach(function(b){b.onclick=function(){applyPreset(b.getAttribute("data-v39119-preset"));renderDrawer(true)}})
  }else{
    wrap.querySelectorAll("[data-v39119-preset]").forEach(function(b){b.classList.toggle("active",b.getAttribute("data-v39119-preset")===state.preset)})
  }
  ["accent","accent2","bg","radius","blur","density","eq","ambient","compactMeta","grain"].forEach(function(k){
    var el=d.querySelector("[data-v39119='"+k+"']");if(!el)return;
    if(el.type==="checkbox")el.checked=!!state[k];else el.value=String(state[k]);
  });
  var ro=d.querySelector("[data-v39119-out='radius']"),bo=d.querySelector("[data-v39119-out='blur']");
  if(ro)ro.textContent=state.radius+"px";if(bo)bo.textContent=state.blur+"px"
}
function open(){renderDrawer(true);var d=drawer();d.hidden=false;document.body.style.overflow="hidden"}
function close(){var d=document.getElementById(DRAWER_ID);if(d)d.hidden=true;document.body.style.overflow=""}
function exportSkin(){
  var payload=JSON.stringify({type:"vocadive-skin",version:1,data:state});
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(payload).then(function(){toast("스킨 코드를 복사했습니다")}).catch(function(){window.prompt("스킨 코드",payload)});
  else window.prompt("스킨 코드",payload)
}
function importSkin(){
  var raw=window.prompt("스킨 코드를 붙여넣으세요");if(!raw)return;
  try{
    var obj=JSON.parse(raw),src=obj&&obj.type==="vocadive-skin"?obj.data:obj;
    if(!src||typeof src!=="object")throw new Error("invalid");
    var next=defaults();Object.keys(next).forEach(function(k){if(src[k]!==undefined)next[k]=src[k]});
    state=next;state.accent=safeHex(state.accent,preset(state.preset).accent);state.accent2=safeHex(state.accent2,preset(state.preset).accent2);state.bg=safeHex(state.bg,preset(state.preset).bg);
    apply(true);renderDrawer(true);toast("스킨을 적용했습니다")
  }catch(_){toast("스킨 코드를 읽을 수 없습니다")}
}
function toast(msg){
  var t=document.querySelector(".toast");if(t){t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show")},1800);return}
  try{window.dispatchEvent(new CustomEvent("vsa:toast",{detail:{message:msg}}))}catch(_){}
}
function refreshUi(){
  var name=preset(state.preset).name;
  document.querySelectorAll(".v39119-skin-btn").forEach(function(b){b.title="현재 스킨 · "+name});
  var card=document.querySelector(".v39119-settings-card p");if(card)card.setAttribute("data-current-skin",name)
}
function mount(){
  ensureStyle();if(!state)state=read();apply(false);button();settingsCard();syncEq()
}
function schedule(){
  clearTimeout(mountTimer);mountTimer=setTimeout(mount,35)
}
function init(){
  state=read();ensureStyle();apply(false);mount();
  document.addEventListener("keydown",function(e){if(e.key==="Escape"){var d=document.getElementById(DRAWER_ID);if(d&&!d.hidden)close()}});
  window.addEventListener("vsa:route-change",schedule);
  window.addEventListener("vsa:theme-change",function(){setTimeout(function(){apply(false)},0)});
  if(window.MutationObserver){
    var ob=new MutationObserver(function(muts){
      var relevant=false;
      for(var i=0;i<muts.length;i++){if(muts[i].addedNodes&&muts[i].addedNodes.length){relevant=true;break}}
      if(relevant)schedule()
    });
    ob.observe(document.body,{childList:true,subtree:true})
  }
}
window.VocaDiveSkinStudio={
  version:VERSION,
  presets:function(){return JSON.parse(JSON.stringify(PRESETS))},
  get:function(){return Object.assign({},state||read())},
  open:open,
  applyPreset:function(id){if(!state)state=read();applyPreset(id);return Object.assign({},state)},
  apply:function(patch){if(!state)state=read();if(patch&&typeof patch==="object")Object.keys(state).forEach(function(k){if(patch[k]!==undefined)state[k]=patch[k]});apply(true);return Object.assign({},state)},
  reset:function(){state=defaults();apply(true);return Object.assign({},state)}
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();