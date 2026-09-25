/* Voice Synth Archive Main UI v26
 * Glacier theme + dashboard polish + real iceberg treatment.
 */
(function(){
"use strict";

const ICE_COLORS=[
  ["#effffd","#bdf8f0"],["#ddfcf8","#a9efe8"],["#cdf7f5","#8ddce5"],["#b8eef2","#74cadb"],["#a3e2ea","#62b5cf"],
  ["#6fc6d1","#3d9aaf"],["#5ab2c1","#34879f"],["#4a9cac","#2b7189"],["#3d8699","#245d74"],["#327283","#1d4c62"],
  ["#285e70","#173f54"],["#204d5e","#123446"],["#183c4c","#0d2938"],["#112e3b","#081f2c"]
];

function addStyle(){
  const s=document.createElement("style");
  s.id="v26Theme";
  s.textContent=[
  ":root{--bg:#061014;--panel:#0a1a1f;--panel2:#0d2229;--line:#1d3b42;--text:#ecfbf8;--muted:#8fb1ae;--accent:#6fe5db;--accent2:#78a7ff;--good:#63e6be;--warn:#ffcf70;--bad:#ff8597;--shadow:0 24px 70px rgba(0,0,0,.34);--glass:rgba(8,25,30,.78);--ice:#bff8f1;--ocean:#0a2a35}",
  "html,body{background:radial-gradient(circle at 18% -12%,#153d43 0,transparent 34%),radial-gradient(circle at 88% 2%,#172b54 0,transparent 30%),linear-gradient(180deg,#071216 0,#051014 46%,#030a0d 100%)!important;color:var(--text)}",
  "body:before{content:'';position:fixed;inset:0;pointer-events:none;z-index:-1;background:linear-gradient(120deg,transparent 0 28%,rgba(90,231,217,.028) 42%,transparent 57%),radial-gradient(circle at 60% 28%,rgba(118,167,255,.06),transparent 26%)}",
  ".app{max-width:1540px!important;padding:16px 18px 28px!important}",
  ".topbar{position:relative;margin:0 0 12px!important;padding:12px 14px;border:1px solid rgba(111,229,219,.14);border-radius:22px;background:linear-gradient(135deg,rgba(9,31,36,.94),rgba(11,24,36,.92));box-shadow:0 18px 50px #0005;overflow:hidden}",
  ".topbar:after{content:'';position:absolute;right:-80px;top:-110px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(111,229,219,.15),transparent 64%);pointer-events:none}",
  ".logo{width:48px!important;height:48px!important;border-radius:16px!important;background:linear-gradient(145deg,#d9fffa,#6fe5db 46%,#78a7ff)!important;color:#061215!important;box-shadow:0 10px 32px rgba(71,221,205,.25)!important}",
  ".brand h1{font-size:clamp(20px,2.6vw,30px)!important;letter-spacing:-.035em}.brand .sub{font-size:11px!important;color:#87aaa8!important;letter-spacing:.01em}",
  ".pill{background:rgba(8,28,33,.82)!important;border-color:#21444b!important;color:#bcd8d4!important;backdrop-filter:blur(12px)}",
  ".btn{border-color:#2a4d55!important;background:#0d272e!important;color:#e8faf7!important;border-radius:12px!important;transition:.16s transform,.16s border-color,.16s background}.btn:hover{transform:translateY(-1px);border-color:#4b7f84!important;background:#123139!important}",
  ".btn.primary{background:linear-gradient(135deg,#7ef0e5,#76b2ff)!important;color:#061316!important;box-shadow:0 8px 24px rgba(83,209,205,.18)!important}",
  "input,select,textarea{border-color:#23474e!important;background:#071a1f!important;color:#eaf9f6!important}input:focus,select:focus,textarea:focus{border-color:#69dcd2!important;box-shadow:0 0 0 3px rgba(105,220,210,.12)!important}",
  ".mobile-section-nav{border-color:#1d3d43!important;background:rgba(6,20,24,.88)!important;backdrop-filter:blur(18px)}.mobile-section-nav button{color:#93b7b4!important}.mobile-section-nav button.active{background:#11333a!important;color:#e9fffb!important}",
  ".v26-filter-shell{margin:10px 0 13px;border:1px solid rgba(111,229,219,.13);border-radius:20px;background:linear-gradient(180deg,rgba(8,27,32,.83),rgba(6,20,25,.78));box-shadow:0 16px 42px #0003;overflow:hidden}",
  ".v26-filter-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 13px;border-bottom:1px solid rgba(111,229,219,.10)}.v26-filter-head div:first-child b{display:block;font-size:11px}.v26-filter-head div:first-child small{display:block;margin-top:2px;font-size:8px;color:#789d9a}.v26-filter-head .v26-filter-tag{font-size:8px;font-weight:900;letter-spacing:.09em;color:#73dcd2}",
  ".v26-filter-shell .controls,.v26-filter-shell .sourcebar{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;backdrop-filter:none!important}.v26-filter-shell .controls{position:static!important;border-bottom:1px solid rgba(111,229,219,.08)!important}",
  ".summary{gap:9px!important;margin:10px 0 13px!important}.card{position:relative;overflow:hidden;background:linear-gradient(160deg,rgba(12,35,40,.96),rgba(7,23,29,.96))!important;border-color:#1e4148!important;border-radius:18px!important;padding:13px 14px!important;box-shadow:0 14px 34px #0003!important}.card:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#6fe5db,#78a7ff)}.card:nth-child(2):before{background:linear-gradient(180deg,#85e9dd,#9b8cff)}.card:nth-child(3):before{background:linear-gradient(180deg,#78a7ff,#8e8cff)}.card:nth-child(4):before{background:linear-gradient(180deg,#ffcc78,#ff8ca4)}.k{font-size:9px!important;color:#79a09d!important;text-transform:uppercase;letter-spacing:.08em}.v{font-size:25px!important}.note{font-size:9px!important;color:#769794!important}",
  ".main{gap:12px!important}.panel{background:linear-gradient(180deg,rgba(8,26,31,.96),rgba(6,20,25,.96))!important;border-color:#1c3d44!important;border-radius:22px!important;box-shadow:0 20px 60px #0004!important}.panel-head{padding:13px 15px 10px!important;border-color:#17353b!important;background:linear-gradient(180deg,rgba(13,37,43,.66),rgba(8,26,31,.35))}.panel-head h2{font-size:16px!important;letter-spacing:-.02em}.panel-head p{font-size:9px!important;color:#7f9f9d!important}",
  "#icebergPanel{overflow:hidden}.iceberg-wrap{min-height:735px!important;padding:18px 14px 14px!important;position:relative!important;overflow:hidden!important;background:radial-gradient(ellipse at 50% 13%,rgba(213,255,250,.20),transparent 28%),linear-gradient(180deg,#143b45 0 31%,#0b303d 31% 37%,#082530 37% 56%,#061c27 56% 74%,#04131c 74% 100%)!important}",
  ".iceberg-wrap:before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 48%,rgba(113,229,219,.06),transparent 20%),radial-gradient(circle at 88% 70%,rgba(120,167,255,.06),transparent 22%),repeating-linear-gradient(105deg,transparent 0 68px,rgba(255,255,255,.008) 69px 70px)}",
  ".iceberg-wrap:after{content:'SURFACE';position:absolute;left:18px;top:28.7%;font-size:8px;font-weight:900;letter-spacing:.16em;color:#8fe9e1;opacity:.8;z-index:5}",
  ".waterline{top:33.2%!important;left:0!important;right:0!important;border:0!important;height:16px!important;z-index:6!important;background:linear-gradient(180deg,rgba(144,244,236,.15),rgba(52,155,174,.08),transparent);box-shadow:0 -1px 0 rgba(170,255,247,.55),0 2px 0 rgba(26,92,107,.45)}",
  ".waterline:before,.waterline:after{content:'';position:absolute;left:-5%;width:110%;height:8px;top:-5px;background:radial-gradient(ellipse at center,rgba(181,255,248,.48) 0 18%,transparent 20%) 0 0/48px 8px repeat-x;opacity:.58}.waterline:after{top:1px;transform:translateX(22px);opacity:.22}",
  ".waterline span{right:16px!important;top:-20px!important;font-size:8px!important;letter-spacing:.08em;color:#b4f5ee!important}",
  ".iceberg{height:690px!important;gap:0!important;justify-content:center!important;filter:drop-shadow(0 25px 36px rgba(0,0,0,.34))}.iceberg:before{content:'';position:absolute;width:70%;height:30%;top:2%;left:15%;clip-path:polygon(48% 0,61% 19%,76% 26%,88% 50%,74% 68%,92% 100%,8% 100%,23% 70%,10% 52%,27% 27%,41% 20%);background:linear-gradient(145deg,rgba(236,255,253,.22),rgba(124,231,225,.05));filter:blur(.2px);pointer-events:none;z-index:-1}",
  ".tier{min-height:43px!important;margin-top:-1px!important;border-radius:0!important;border:1px solid rgba(228,255,252,.16)!important;padding:6px 15px!important;clip-path:polygon(4% 0,96% 3%,100% 38%,97% 100%,5% 97%,0 63%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.17),inset 0 -12px 24px rgba(0,30,40,.12)!important;transition:.16s transform,.16s filter,.16s opacity!important}",
  ".tier:nth-child(even){clip-path:polygon(2% 5%,98% 0,96% 62%,100% 100%,4% 96%,0 39%)!important}.tier:nth-child(3n){clip-path:polygon(5% 0,94% 5%,100% 48%,95% 100%,2% 94%,0 28%)!important}",
  ".tier:before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.17),transparent 28%,transparent 65%,rgba(255,255,255,.05));pointer-events:none}",
  ".tier:after{content:'';position:absolute;left:23%;top:0;width:1px;height:115%;background:linear-gradient(180deg,rgba(255,255,255,.30),transparent 70%);transform:rotate(18deg);opacity:.42;pointer-events:none}",
  ".tier:hover{transform:scale(1.025)!important;filter:brightness(1.12) saturate(1.06)!important;z-index:8}.tier.active{outline:2px solid rgba(234,255,252,.92)!important;outline-offset:-3px!important;filter:brightness(1.12)!important;z-index:9}",
  ".tier .name{font-size:11px!important;letter-spacing:-.01em}.tier .range{font-size:8px!important;opacity:.72!important}.tier .count{font-size:12px!important}.tier .pct{font-size:8px!important}.tier.ice-above{color:#082027!important}.tier.ice-below{color:#e8f8f6!important}.tier.ice-below .range,.tier.ice-below .pct{color:#a7c4c3!important}",
  ".v26-depth-label{position:absolute;left:16px;z-index:4;font-size:7px;font-weight:900;letter-spacing:.13em;color:#577d84;pointer-events:none}.v26-depth-mid{top:52%}.v26-depth-deep{top:76%}",
  ".legend{padding:9px 14px 14px!important;border-top:1px solid #17343b!important;background:#07191e!important}.legend span{font-size:8px!important;border-color:#21454d!important;background:#0b242a!important;color:#86aaa7!important}",
  ".results{min-height:735px!important}.free-search{padding:11px!important;background:linear-gradient(180deg,#0d292f,#091d23)!important;border-color:#17373e!important}.search-row{gap:7px!important}.search-row input{font-weight:700}.results-toolbar{padding:9px 10px!important;border-color:#16353c!important;background:#081b20}.list{padding:7px!important}.song{margin-bottom:4px;padding:8px!important;border:1px solid transparent!important;border-radius:14px!important;background:rgba(9,28,34,.52)!important}.song:hover{background:#0d2b32!important;border-color:#28515a!important;transform:translateY(-1px)}.thumb{border-radius:10px!important}.rank{color:#75dfd5!important}.meta{color:#7e9e9b!important}.views small{color:#73918f!important}",
  ".mini-btn{border-color:#2a4a52!important;background:#0a242a!important;color:#b8d2cf!important}.mini-btn:hover{border-color:#4c7c80!important;background:#103139!important}",
  ".universe-panel{margin-top:12px!important}.universe-stage{background:radial-gradient(circle at center,#10313a 0,#071a20 48%,#041014 100%)!important}.universe-side{background:#07191e!important}",
  ".settings details{border-color:#1d3c43!important;background:#07191e!important}.footer{color:#567875!important;font-size:9px!important}",
  ".tools-shell.v25-studio{background:linear-gradient(145deg,#07171c,#08171e 60%,#07131a)!important;border-color:#21464d!important}.tools-shell.v25-studio #toolsTabs{background:linear-gradient(180deg,#081c21,#061418)!important;border-color:#17373d!important}.tools-shell.v25-studio #toolsTabs button.active{background:linear-gradient(135deg,#153b3f,#203b58)!important;border-color:#3f7277!important}.v25-nav-icon{background:#0c292f!important;border-color:#244b52!important}.v25-contextbar{background:#081c21ef!important;border-color:#17363d!important}.v25-home{background:radial-gradient(circle at 90% 0,#123b4066,transparent 34%),#061519!important}",
  "@media(max-width:980px){.main{grid-template-columns:1fr!important}.iceberg-wrap{min-height:690px!important}.iceberg{height:650px!important}}",
  "@media(max-width:699px){.app{padding:10px 9px 78px!important}.topbar{padding:10px!important;border-radius:17px!important}.brand .sub{display:none}.logo{width:42px!important;height:42px!important}.summary{grid-template-columns:1fr 1fr!important}.card{padding:10px 11px!important}.v{font-size:20px!important}.v26-filter-shell{border-radius:16px!important}.v26-filter-head{padding:8px 10px}.iceberg-wrap{min-height:620px!important;padding:12px 6px!important}.iceberg{height:590px!important}.tier{min-height:38px!important;padding:5px 10px!important}.tier .name{font-size:10px!important}.tier .range{font-size:7px!important}.tier .count{font-size:10px!important}.waterline{top:33%!important}.results{min-height:0!important}.song{grid-template-columns:28px 72px minmax(0,1fr)!important}.thumb{width:72px!important}.mobile-section-nav{position:fixed!important;left:8px!important;right:8px!important;bottom:8px!important;top:auto!important;z-index:90!important;border-radius:16px!important;box-shadow:0 14px 40px #0008!important;padding:6px!important}.mobile-section-nav button{min-height:38px!important;border-radius:10px!important}.fold-settings-toggle{margin-top:9px!important}}",
  "@media(max-width:390px){.summary{grid-template-columns:1fr 1fr!important}.iceberg-wrap{min-height:590px!important}.iceberg{height:560px!important}.tier{min-height:36px!important}}"
  ].join("");
  document.head.appendChild(s);
}

function wrapFilters(){
  const controls=document.getElementById("filterControls");
  const source=document.getElementById("sourceControls");
  if(!controls||!source||controls.closest(".v26-filter-shell"))return;
  const shell=document.createElement("section");
  shell.className="v26-filter-shell fold-collapsible";
  const head=document.createElement("div");
  head.className="v26-filter-head";
  head.innerHTML='<div><b>탐색 범위</b><small>연도 · 빙산 구간 · 모집단을 한 번에 조정</small></div><div class="v26-filter-tag">FILTER DECK</div>';
  controls.parentNode.insertBefore(shell,controls);
  shell.appendChild(head);
  shell.appendChild(controls);
  shell.appendChild(source);
}
function enhanceIceberg(){
  const wrap=document.querySelector(".iceberg-wrap");
  const ice=document.getElementById("iceberg");
  if(!wrap||!ice)return;
  if(!wrap.querySelector(".v26-depth-mid")){
    const a=document.createElement("div");a.className="v26-depth-label v26-depth-mid";a.textContent="DEEP WATER";wrap.appendChild(a);
    const b=document.createElement("div");b.className="v26-depth-label v26-depth-deep";b.textContent="ABYSS";wrap.appendChild(b);
  }
  const tiers=Array.from(ice.children).filter(x=>x.classList.contains("tier"));
  tiers.forEach(function(el,i){
    const colors=ICE_COLORS[i]||ICE_COLORS[ICE_COLORS.length-1];
    el.style.setProperty("background","linear-gradient(105deg,"+colors[0]+","+colors[1]+")","important");
    el.classList.toggle("ice-above",i<5);
    el.classList.toggle("ice-below",i>=5);
    el.dataset.iceDepth=String(i+1);
  });
}
function labelMain(){
  const title=document.querySelector(".brand h1");
  const sub=document.querySelector(".brand .sub");
  if(title)title.textContent="Voice Synth Archive";
  if(sub)sub.textContent="음성합성 오리지널곡 통계 · 발굴 · 추천 · 기억 복원";
  const iceTitle=document.getElementById("icebergTitle");
  const iceSub=document.getElementById("icebergSub");
  if(iceTitle)iceTitle.textContent="오리지널곡 빙산 지도";
  if(iceSub)iceSub.textContent="수면 위는 초대형 히트, 아래로 갈수록 희소·심층·미발견 영역입니다.";
  const listTitle=document.getElementById("listTitle");
  const listSub=document.getElementById("listSub");
  if(listTitle)listTitle.textContent="곡 탐색 결과";
  if(listSub)listSub.textContent="빙산 층이나 검색 조건을 기준으로 곡을 찾고, 전체 순위와 상위 비율을 확인합니다.";
  const fold=document.getElementById("foldFilterToggle");if(fold)fold.textContent="탐색 조건 열기";
  const nav=document.querySelectorAll("#mobileSectionNav button");if(nav.length>=5){nav[0].textContent="빙산 지도";nav[1].textContent="곡 검색";nav[2].textContent="스튜디오";nav[3].textContent="관계도";nav[4].textContent="설정";}
}
function observeIceberg(){
  const ice=document.getElementById("iceberg");
  if(!ice)return;
  new MutationObserver(function(){enhanceIceberg()}).observe(ice,{childList:true,subtree:false});
}
function polishSummary(){
  const cards=document.querySelectorAll(".summary .card");
  const icons=["◌","◆","％","●"];
  cards.forEach(function(c,i){
    if(c.querySelector(".v26-card-icon"))return;
    const icon=document.createElement("span");
    icon.className="v26-card-icon";
    icon.textContent=icons[i]||"·";
    icon.style.cssText="position:absolute;right:12px;top:10px;font-size:18px;opacity:.16";
    c.appendChild(icon);
  });
}
function boot(){
  addStyle();
  wrapFilters();
  labelMain();
  polishSummary();
  enhanceIceberg();
  observeIceberg();
  document.documentElement.dataset.v26="glacier";
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();