/* Voice Synth Archive Studio UI v25 */
(function(){
"use strict";

const META={
  studioHome:{group:"home",title:"보카로 메뉴",short:"메뉴 홈",desc:"탐정·추천·발굴·보관 기능을 목적별로 골라 사용합니다.",icon:"⌂"},
  detective:{group:"detective",title:"기억 복원",short:"기억 복원",desc:"제목·가사·보컬·PV 같은 단서로 잊어버린 곡을 좁혀 찾습니다.",icon:"⌕"},
  gems:{group:"discover",title:"숨은 곡 발굴",short:"숨은 곡",desc:"낮은 조회수 속에서 반응률과 취향을 이용해 묻힌 곡을 발굴합니다.",icon:"✦"},
  guide:{group:"recommend",title:"입문 코스",short:"입문 코스",desc:"난이도와 시대를 정해 단계별로 음성합성곡을 탐색합니다.",icon:"▤"},
  taste:{group:"recommend",title:"취향 추천",short:"취향 추천",desc:"문장과 태그를 섞어 원하는 분위기의 곡을 넓게 추천받습니다.",icon:"♡"},
  smart23:{group:"recommend",title:"스마트 믹스",short:"스마트 믹스",desc:"보관함과 좋아요·제외 피드백을 학습해 자동 믹스를 만듭니다.",icon:"◈"},
  library22:{group:"manage",title:"내 라이브러리",short:"라이브러리",desc:"관심곡·최애·최근 기록·탐정 사건을 한 곳에서 관리합니다.",icon:"▣"},
  playlist24:{group:"manage",title:"플레이리스트",short:"플레이리스트",desc:"믹스를 저장하고 순서를 바꾸거나 한 곡만 교체합니다.",icon:"☷"},
  archive29:{group:"archive",title:"빙산 · 통계",short:"빙산 · 통계",desc:"조회수 빙산과 모집단 통계를 한 화면에서 봅니다.",icon:"◇"},
  search29:{group:"archive",title:"곡 검색",short:"곡 검색",desc:"곡명·P명·보컬·태그·sm번호로 아카이브를 검색합니다.",icon:"⌕"},
  universe29:{group:"archive",title:"보카로 우주",short:"보카로 우주",desc:"곡을 중심으로 비슷한 곡의 관계를 별자리처럼 탐색합니다.",icon:"✦"},
  settings29:{group:"archive",title:"앱 설정",short:"앱 설정",desc:"Worker 연결과 앱·업데이트 설정을 관리합니다.",icon:"⚙"}
};
const GROUPS=[
  {id:"detective",title:"탐정",desc:"잊은 곡 찾기",tools:["detective"]},
  {id:"recommend",title:"추천",desc:"코스·취향·자동 믹스",tools:["guide","taste","smart23"]},
  {id:"discover",title:"발굴",desc:"숨은 곡 찾기",tools:["gems"]},
  {id:"archive",title:"아카이브",desc:"빙산·검색·우주",tools:["archive29","search29","universe29","settings29"]},
  {id:"manage",title:"보관",desc:"라이브러리·플레이리스트",tools:["library22","playlist24"]}
];

function setText(sel,text){
  const el=document.querySelector(sel);
  if(el)el.textContent=text;
}
function buttonMarkup(name){
  const m=META[name];
  return '<span class="v25-nav-icon">'+m.icon+'</span><span class="v25-nav-copy"><b>'+m.short+'</b><small>'+m.desc+'</small></span>';
}
function buildHome(){
  const body=document.querySelector("#toolsModal .tools-body");
  if(!body||document.querySelector('[data-tool-view="studioHome"]'))return;
  const sec=document.createElement("section");
  sec.className="tool-view v25-home";
  sec.dataset.toolView="studioHome";
  sec.innerHTML=
    '<div class="v25-hero"><div><span class="v25-eyebrow">VOCALO SUPPORT MENU</span><h2>보카로 기능 메뉴</h2><p>탐정과 추천을 분리하고, 발굴·보관 기능까지 목적별로 골라 사용합니다.</p></div><div class="v25-hero-badge">v25</div></div>'+
    '<div class="v25-home-groups">'+
      GROUPS.map(function(g){
        return '<section class="v25-home-group"><div class="v25-home-head"><div><b>'+g.title+'</b><small>'+g.desc+'</small></div></div><div class="v25-home-cards">'+
          g.tools.map(function(name){
            const m=META[name];
            return '<button class="v25-home-card" data-v25-open="'+name+'"><span class="v25-card-icon">'+m.icon+'</span><span><b>'+m.title+'</b><small>'+m.desc+'</small></span><i>›</i></button>';
          }).join("")+
        '</div></section>';
      }).join("")+
    '</div>';
  body.prepend(sec);
}
function regroupNavigation(){
  const tabs=document.getElementById("toolsTabs");
  if(!tabs||tabs.dataset.v25)return;
  tabs.dataset.v25="1";
  const existing={};
  tabs.querySelectorAll("button[data-tool]").forEach(function(btn){existing[btn.dataset.tool]=btn});
  tabs.innerHTML="";

  const home=document.createElement("button");
  home.className="v25-home-nav";
  home.dataset.tool="studioHome";
  home.innerHTML=buttonMarkup("studioHome");
  tabs.appendChild(home);

  GROUPS.forEach(function(g){
    const wrap=document.createElement("div");
    wrap.className="v25-nav-group";
    wrap.dataset.group=g.id;
    const head=document.createElement("div");
    head.className="v25-nav-group-title";
    head.innerHTML='<b>'+g.title+'</b><small>'+g.desc+'</small>';
    wrap.appendChild(head);
    g.tools.forEach(function(name){
      const btn=existing[name];
      if(!btn)return;
      btn.innerHTML=buttonMarkup(name);
      btn.title=META[name].title;
      wrap.appendChild(btn);
    });
    tabs.appendChild(wrap);
  });
}
function buildWorkspace(){
  const shell=document.querySelector("#toolsModal .tools-shell");
  const tabs=document.getElementById("toolsTabs");
  const body=document.querySelector("#toolsModal .tools-body");
  if(!shell||!tabs||!body||shell.querySelector(".v25-workspace"))return;

  shell.classList.add("v25-studio");
  const workspace=document.createElement("div");
  workspace.className="v25-workspace";
  const content=document.createElement("div");
  content.className="v25-content";
  const bar=document.createElement("div");
  bar.className="v25-contextbar";
  bar.id="v25Context";
  bar.innerHTML='<div><span id="v25ContextGroup">스튜디오</span><b id="v25ContextTitle">보카로 메뉴</b><small id="v25ContextDesc">탐정·추천·발굴·보관 기능을 선택하세요.</small></div><button class="v25-context-home" data-v25-open="studioHome">⌂ 홈</button>';
  content.appendChild(bar);
  content.appendChild(body);
  workspace.appendChild(tabs);
  workspace.appendChild(content);
  shell.appendChild(workspace);
}
function groupLabel(name){
  const g=GROUPS.find(function(x){return x.id===META[name]?.group});
  return g?g.title:"스튜디오";
}
function updateContext(name){
  const m=META[name]||META.studioHome;
  const title=document.getElementById("v25ContextTitle");
  const desc=document.getElementById("v25ContextDesc");
  const group=document.getElementById("v25ContextGroup");
  if(title)title.textContent=m.title;
  if(desc)desc.textContent=m.desc;
  if(group)group.textContent=name==="studioHome"?"보카로 메뉴":groupLabel(name);
  document.querySelectorAll("#toolsTabs button").forEach(function(b){
    b.classList.toggle("active",b.dataset.tool===name);
  });
}
function openView(name){
  if(typeof setToolView==="function")setToolView(name);
  updateContext(name);
  const body=document.querySelector("#toolsModal .tools-body");
  if(body)body.scrollTop=0;
}
function observeActive(){
  const tabs=document.getElementById("toolsTabs");
  if(!tabs)return;
  const obs=new MutationObserver(function(){
    const active=tabs.querySelector("button.active[data-tool]");
    if(active)updateContext(active.dataset.tool);
  });
  obs.observe(tabs,{subtree:true,attributes:true,attributeFilter:["class"]});
}
function polishLabels(){
  setText(".tools-title","보카로 기능 메뉴");
  setText(".tools-sub","탐정 · 추천 · 발굴 · 보관을 서로 분리해 선택");
  setText("#openToolsBtn","보카로 메뉴");
  const mobile=document.querySelector('#mobileSectionNav [data-action="tools"]');
  if(mobile)mobile.textContent="메뉴";

  setText("#detectivePanel .panel-head h2","기억 복원 탐정");
  setText("#detectivePanel .panel-head p","기억나는 단서를 조합해 후보를 만들고, 틀린 후보의 이유까지 다음 수색에 반영합니다.");
  const guide=document.querySelector('[data-tool-view="guide"] .panel-head h2');
  if(guide)guide.textContent="입문 코스";
  const taste=document.querySelector('[data-tool-view="taste"] .panel-head h2');
  if(taste)taste.textContent="취향 추천";
  const gems=document.querySelector('[data-tool-view="gems"] .panel-head h2');
  if(gems)gems.textContent="숨은 곡 발굴";
}
function addStyle(){
  const s=document.createElement("style");
  s.textContent=[
  ".tools-shell.v25-studio{width:min(1380px,97vw);height:min(930px,96vh);display:grid;grid-template-rows:auto 1fr;background:linear-gradient(145deg,#07111e 0%,#091725 55%,#07111e 100%)}",
  ".v25-workspace{min-height:0;display:grid;grid-template-columns:238px minmax(0,1fr)}",
  ".tools-shell.v25-studio #toolsTabs{min-width:0;display:flex;flex-direction:column;gap:8px;padding:12px;overflow:auto;border:0;border-right:1px solid #1c3047;background:linear-gradient(180deg,#091725,#07111e);scrollbar-width:none}",
  ".tools-shell.v25-studio #toolsTabs::-webkit-scrollbar{display:none}",
  ".tools-shell.v25-studio #toolsTabs>button,.tools-shell.v25-studio .v25-nav-group>button{width:100%;min-height:52px;padding:7px 8px;display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;align-items:center;text-align:left;border:1px solid transparent;border-radius:13px;background:transparent;color:#9eb8cd}",
  ".tools-shell.v25-studio #toolsTabs button:hover{background:#0d2033;border-color:#203e59}",
  ".tools-shell.v25-studio #toolsTabs button.active{background:linear-gradient(135deg,#17354d,#242d55);border-color:#4d7aa4;color:#f2fbff;box-shadow:inset 0 0 0 1px #6cc9e51c}",
  ".v25-nav-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#10253a;border:1px solid #24435d;font-size:16px;font-weight:900}",
  "#toolsTabs button.active .v25-nav-icon{background:linear-gradient(135deg,#55ccec,#7f75ff);border-color:transparent;color:#07131f}",
  ".v25-nav-copy{min-width:0;display:block}.v25-nav-copy b{display:block;font-size:10px;font-weight:900}.v25-nav-copy small{display:block;margin-top:2px;font-size:7px;line-height:1.25;color:#6f8aa2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  "#toolsTabs button.active .v25-nav-copy small{color:#9db9cb}",
  ".v25-nav-group{display:flex;flex-direction:column;gap:4px;padding-top:2px}.v25-nav-group-title{display:flex;justify-content:space-between;align-items:baseline;padding:6px 6px 3px}.v25-nav-group-title b{font-size:9px;letter-spacing:.08em;color:#7e9ab2}.v25-nav-group-title small{font-size:7px;color:#4f6980}",
  ".v25-content{min-width:0;min-height:0;display:grid;grid-template-rows:auto 1fr}",
  ".v25-contextbar{min-height:62px;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 14px;border-bottom:1px solid #1c3047;background:#091522e8;backdrop-filter:blur(12px)}",
  ".v25-contextbar>div{min-width:0}.v25-contextbar span{display:block;font-size:8px;font-weight:900;letter-spacing:.08em;color:#5f839f;text-transform:uppercase}.v25-contextbar b{display:block;margin-top:2px;font-size:15px;color:#eef9ff}.v25-contextbar small{display:block;margin-top:2px;font-size:9px;color:#7f9bb2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".v25-context-home{flex:0 0 auto;min-height:34px;padding:0 10px;border:1px solid #29465f;border-radius:10px;background:#0d1e30;color:#afc7da;font-size:9px;font-weight:850}",
  ".tools-shell.v25-studio .tools-body{min-height:0;background:#07111e}",
  ".v25-home{display:none;min-height:100%;padding:18px!important;background:radial-gradient(circle at 90% 0,#17264c66,transparent 34%),#07111e}.v25-home.active{display:block!important}",
  ".v25-hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding:22px;border:1px solid #29445f;border-radius:20px;background:linear-gradient(135deg,#0c2135,#121c36);box-shadow:0 18px 50px #0004}.v25-eyebrow{font-size:8px;font-weight:900;letter-spacing:.16em;color:#65cbea}.v25-hero h2{margin:7px 0 4px;font-size:27px;letter-spacing:-.03em}.v25-hero p{margin:0;color:#8da8bd;font-size:11px}.v25-hero-badge{min-width:54px;height:34px;display:grid;place-items:center;border-radius:999px;background:linear-gradient(135deg,#55ccec,#8175ff);color:#06121d;font-size:10px;font-weight:950}",
  ".v25-home-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.v25-home-group{border:1px solid #203950;border-radius:18px;background:#091624;overflow:hidden}.v25-home-head{padding:12px 13px;border-bottom:1px solid #1a3046}.v25-home-head b{display:block;font-size:12px}.v25-home-head small{display:block;margin-top:2px;font-size:8px;color:#6f8ca4}.v25-home-cards{padding:7px}.v25-home-card{width:100%;display:grid;grid-template-columns:38px minmax(0,1fr) 18px;gap:8px;align-items:center;padding:9px;border:0;border-radius:12px;background:transparent;color:#dcecf7;text-align:left}.v25-home-card:hover{background:#0f2438}.v25-card-icon{width:38px;height:38px;display:grid;place-items:center;border:1px solid #294a65;border-radius:11px;background:#10273c;font-size:17px}.v25-home-card b{display:block;font-size:10px}.v25-home-card small{display:block;margin-top:2px;color:#6f8aa2;font-size:8px;line-height:1.35}.v25-home-card i{font-size:18px;color:#557590;font-style:normal}",
  ".tools-shell.v25-studio .tools-body>.panel>.panel-head{padding:13px 15px;background:#081522}.tools-shell.v25-studio .tools-body>.panel>.panel-head h2{font-size:16px}.tools-shell.v25-studio .tools-body>.panel>.panel-head p{max-width:760px;font-size:9px;color:#7895ad}",
  "@media(max-width:900px){.v25-workspace{grid-template-columns:188px minmax(0,1fr)}.tools-shell.v25-studio #toolsTabs{padding:9px}.v25-nav-copy small{display:none!important}.tools-shell.v25-studio #toolsTabs>button,.tools-shell.v25-studio .v25-nav-group>button{min-height:47px}.v25-home-groups{grid-template-columns:1fr 1fr}}",
  "@media(max-width:699px){.tools-shell.v25-studio{width:100vw;height:100dvh}.v25-workspace{grid-template-columns:1fr;grid-template-rows:auto 1fr}.tools-shell.v25-studio #toolsTabs{order:0;display:flex;flex-direction:row;gap:6px;overflow-x:auto;overflow-y:hidden;padding:7px 8px;border-right:0;border-bottom:1px solid #1c3047;background:#081522}.v25-nav-group{display:flex;flex-direction:row;gap:5px;padding:0}.v25-nav-group-title{display:none}.tools-shell.v25-studio #toolsTabs>button,.tools-shell.v25-studio .v25-nav-group>button{width:auto;min-width:max-content;min-height:38px;grid-template-columns:26px auto;padding:5px 8px;border-radius:10px}.v25-nav-icon{width:26px;height:26px;border-radius:8px;font-size:12px}.v25-nav-copy b{font-size:9px}.v25-nav-copy small{display:none}.v25-content{min-height:0}.v25-contextbar{min-height:53px;padding:7px 9px}.v25-contextbar b{font-size:13px}.v25-contextbar small{font-size:8px;max-width:72vw}.v25-context-home{display:none}.v25-home{padding:10px!important}.v25-hero{padding:16px;border-radius:16px}.v25-hero h2{font-size:22px}.v25-home-groups{grid-template-columns:1fr;gap:8px;margin-top:9px}.v25-home-group{border-radius:14px}.v25-home-cards{display:grid;grid-template-columns:1fr 1fr;gap:4px}.v25-home-card{grid-template-columns:34px minmax(0,1fr);padding:7px}.v25-home-card i{display:none}.v25-card-icon{width:34px;height:34px}.v25-home-card small{display:none}}",
  "@media(max-width:390px){.v25-home-cards{grid-template-columns:1fr}.v25-contextbar small{max-width:68vw}}"
  ].join("");
  document.head.appendChild(s);
}
function bind(){
  document.addEventListener("click",function(e){
    const open=e.target.closest&&e.target.closest("[data-v25-open]");
    if(open){e.preventDefault();openView(open.dataset.v25Open);return}
    const nav=e.target.closest&&e.target.closest("#toolsTabs button[data-tool]");
    if(nav){setTimeout(function(){updateContext(nav.dataset.tool)},0)}
  });
}
function boot(){
  addStyle();
  buildHome();
  regroupNavigation();
  buildWorkspace();
  polishLabels();
  bind();
  observeActive();
  updateContext("studioHome");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();