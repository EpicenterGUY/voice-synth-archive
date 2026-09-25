/* Voice Synth Archive PWA v21 */
(function(){
"use strict";
const APP_VERSION="37.2.1";
const CHECK_MS=60000;
let deferredInstall=null;
let registration=null;
let latestMeta=null;
let reloading=false;

function semver(v){return String(v||"0").split(".").map(x=>parseInt(x,10)||0)}
function newer(a,b){
  const A=semver(a),B=semver(b);
  for(let i=0;i<Math.max(A.length,B.length);i++){
    const x=A[i]||0,y=B[i]||0;
    if(x!==y)return x>y;
  }
  return false;
}
function escPwa(s){
  return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function standalone(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
}

function addStyle(){
  const style=document.createElement("style");
  style.textContent=`
  .pwa-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .pwa-mini{min-height:34px;padding:0 10px;border:1px solid #29445f;border-radius:999px;background:#0b1727cc;color:#d8ecfa;font-size:10px;font-weight:900}
  .pwa-mini:hover{border-color:#61c8f2}.pwa-mini[hidden]{display:none!important}
  .pwa-update-bar{position:fixed;z-index:180;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(560px,calc(100vw - 24px));display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #4a7091;border-radius:15px;background:#0d2034f2;box-shadow:0 14px 45px #0009;backdrop-filter:blur(14px)}
  .pwa-update-bar[hidden]{display:none!important}.pwa-update-copy{flex:1;min-width:0}.pwa-update-copy b{display:block;font-size:11px;color:#e7f7ff}.pwa-update-copy span{display:block;margin-top:2px;font-size:9px;color:#94adc3}
  .pwa-update-now{min-height:38px;border:0;border-radius:11px;padding:0 12px;background:linear-gradient(135deg,#56ccef,#8075ff);color:#06121d;font-weight:950;font-size:10px}
  .pwa-log-modal{position:fixed;inset:0;z-index:190;display:none;place-items:center;padding:14px}.pwa-log-modal.open{display:grid}
  .pwa-log-backdrop{position:absolute;inset:0;background:#01070dcc;backdrop-filter:blur(8px)}
  .pwa-log-sheet{position:relative;z-index:1;width:min(680px,96vw);max-height:min(760px,90dvh);overflow:auto;border:1px solid #29445f;border-radius:20px;background:#07111e;box-shadow:0 25px 80px #000a}
  .pwa-log-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 14px;border-bottom:1px solid #1c3047;background:#0b1a2af2;backdrop-filter:blur(10px)}
  .pwa-log-head b{font-size:15px}.pwa-log-close{width:38px;height:38px;border-radius:11px;border:1px solid #31506d;background:#10243a;color:#eef7ff;font-size:17px}
  .pwa-log-body{padding:12px}.pwa-log-version{padding:12px;border:1px solid #203a55;border-radius:14px;background:#091624;margin-bottom:9px}
  .pwa-log-version.current{border-color:#437b73;background:#0b2424}.pwa-log-title{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.pwa-log-title strong{font-size:13px}.pwa-log-title span{font-size:9px;color:#83a1b9}
  .pwa-log-version ul{margin:8px 0 0;padding-left:18px;color:#a9c2d7;font-size:10px;line-height:1.65}
  .pwa-install-help{margin:8px 0 0;font-size:9px;color:#7f9bb3;line-height:1.5}\n  .pwa-install-hint{flex-basis:100%;font-size:9px;color:#89a8bf;line-height:1.45;padding:2px 4px 0}
  @media(max-width:699px){
    .pwa-actions{gap:3px}.pwa-mini{min-height:28px;padding:0 7px;font-size:7px}
    .pwa-log-modal{padding:0;align-items:end}.pwa-log-sheet{width:100vw;max-height:88dvh;border-radius:18px 18px 0 0;border-bottom:0}
    .pwa-update-bar{bottom:calc(10px + env(safe-area-inset-bottom))}
  }`;
  document.head.appendChild(style);
}

function buildUi(){
  addStyle();
  const status=document.querySelector(".status")||document.querySelector(".topbar")||document.body;
  const actions=document.createElement("div");
  actions.className="pwa-actions";
  actions.innerHTML='<button class="pwa-mini" id="pwaInstallBtn" disabled>설치 확인 중…</button><button class="pwa-mini" id="pwaLogBtn">v'+APP_VERSION+' · 업데이트 로그</button><div class="pwa-install-hint" id="pwaInstallHint" hidden></div>';
  status.appendChild(actions);

  const bar=document.createElement("div");
  bar.id="pwaUpdateBar";bar.className="pwa-update-bar";bar.hidden=true;
  bar.innerHTML='<div class="pwa-update-copy"><b id="pwaUpdateTitle">새 버전이 있습니다</b><span id="pwaUpdateText">업데이트를 적용할 수 있습니다.</span></div><button class="pwa-update-now" id="pwaUpdateNow">지금 업데이트</button>';
  document.body.appendChild(bar);

  const modal=document.createElement("div");
  modal.id="pwaLogModal";modal.className="pwa-log-modal";
  modal.innerHTML='<div class="pwa-log-backdrop" id="pwaLogBackdrop"></div><div class="pwa-log-sheet" role="dialog" aria-modal="true" aria-label="업데이트 로그"><div class="pwa-log-head"><div><b>업데이트 로그</b><div class="pwa-install-help">현재 실행 중 v'+APP_VERSION+'</div></div><button class="pwa-log-close" id="pwaLogClose">✕</button></div><div class="pwa-log-body" id="pwaLogBody">불러오는 중…</div></div>';
  document.body.appendChild(modal);

  document.getElementById("pwaInstallBtn").addEventListener("click",installApp);
  document.getElementById("pwaLogBtn").addEventListener("click",openLog);
  document.getElementById("pwaLogClose").addEventListener("click",closeLog);
  document.getElementById("pwaLogBackdrop").addEventListener("click",closeLog);
  document.getElementById("pwaUpdateNow").addEventListener("click",applyUpdate);

  if(standalone()){
    const b=document.getElementById("pwaInstallBtn");
    b.textContent="설치됨";b.disabled=true;
  }else{
    window.setTimeout(()=>{
      if(deferredInstall||standalone())return;
      showInstallFallback();
    },1800);
  }
}
function showInstallFallback(){
  const b=document.getElementById("pwaInstallBtn");
  const h=document.getElementById("pwaInstallHint");
  if(b){b.disabled=false;b.textContent="⋮ 메뉴에서 설치";}
  if(h){
    h.hidden=false;
    h.textContent="자동 설치 버튼이 아직 준비되지 않았습니다. 브라우저 메뉴(⋮)에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하면 설치할 수 있습니다.";
  }
}
function closeLog(){document.getElementById("pwaLogModal")?.classList.remove("open")}
async function openLog(){
  const modal=document.getElementById("pwaLogModal");
  if(!modal)return;
  modal.classList.add("open");
  await loadLog(true);
}
async function loadLog(force=false){
  const body=document.getElementById("pwaLogBody");
  if(!body)return;
  try{
    if(force||!latestMeta){
      const r=await fetch("./changelog.json?t="+Date.now(),{cache:"no-store"});
      if(!r.ok)throw new Error("HTTP "+r.status);
      latestMeta=await r.json();
    }
    const entries=Array.isArray(latestMeta.entries)?latestMeta.entries:[];
    body.innerHTML=entries.map(e=>'<section class="pwa-log-version '+(e.version===APP_VERSION?"current":"")+'"><div class="pwa-log-title"><strong>v'+escPwa(e.version)+' · '+escPwa(e.title||"업데이트")+'</strong><span>'+escPwa(e.date||"")+'</span></div><ul>'+((e.changes||[]).map(x=>'<li>'+escPwa(x)+'</li>').join(""))+'</ul></section>').join("") || "업데이트 기록이 없습니다.";
  }catch(e){
    body.innerHTML='<section class="pwa-log-version current"><div class="pwa-log-title"><strong>v'+APP_VERSION+'</strong></div><ul><li>설치형 웹앱과 자동 업데이트 기능이 활성화되어 있습니다.</li></ul></section><div class="pwa-install-help">로그를 불러오지 못했습니다: '+escPwa(e?.message||e)+'</div>';
  }
}
function showUpdate(version,title){
  const bar=document.getElementById("pwaUpdateBar");
  if(!bar)return;
  document.getElementById("pwaUpdateTitle").textContent="새 업데이트 v"+(version||"")+(title?" · "+title:"");
  document.getElementById("pwaUpdateText").textContent="작업 중인 입력은 저장한 뒤 적용하는 것을 권장합니다.";
  bar.hidden=false;
}
async function checkUpdate(){
  try{
    const r=await fetch("./changelog.json?t="+Date.now(),{cache:"no-store"});
    if(r.ok){
      latestMeta=await r.json();
      const cur=latestMeta?.current||{};
      if(newer(cur.version,APP_VERSION))showUpdate(cur.version,cur.title);
    }
    if(registration){
      await registration.update();
      if(registration.waiting){
        showUpdate(latestMeta?.current?.version||"",latestMeta?.current?.title||"");
      }
    }
  }catch{}
}
async function applyUpdate(){
  const btn=document.getElementById("pwaUpdateNow");
  if(btn){btn.disabled=true;btn.textContent="업데이트 중…"}
  try{
    if(registration)await registration.update();
    if(registration?.waiting){
      registration.waiting.postMessage({type:"SKIP_WAITING"});
      return;
    }
    location.reload();
  }catch{
    location.reload();
  }
}
async function installApp(){
  if(standalone())return;
  if(deferredInstall){
    const promptEvent=deferredInstall;
    deferredInstall=null;
    promptEvent.prompt();
    let choice=null;
    try{choice=await promptEvent.userChoice}catch{}
    if(choice?.outcome!=="accepted")showInstallFallback();
    return;
  }
  showInstallFallback();
}

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredInstall=e;
  const b=document.getElementById("pwaInstallBtn");
  const h=document.getElementById("pwaInstallHint");
  if(b){b.hidden=false;b.disabled=false;b.textContent="앱 설치"}
  if(h)h.hidden=true;
});
window.addEventListener("appinstalled",()=>{
  deferredInstall=null;
  const b=document.getElementById("pwaInstallBtn");
  const h=document.getElementById("pwaInstallHint");
  if(b){b.textContent="설치됨";b.disabled=true}
  if(h)h.hidden=true;
});
navigator.serviceWorker?.addEventListener("controllerchange",()=>{
  if(reloading)return;reloading=true;
  setTimeout(()=>{reloading=false;showUpdate(APP_VERSION,"업데이트 적용 준비 완료")},300);
});

async function boot(){
  buildUi();
  if("serviceWorker" in navigator){
    try{
      registration=await navigator.serviceWorker.register("./service-worker.js",{scope:"./",updateViaCache:"none"});
      if(registration.waiting)showUpdate("", "");
      registration.addEventListener("updatefound",()=>{
        const worker=registration.installing;
        if(!worker)return;
        worker.addEventListener("statechange",()=>{
          if(worker.state==="installed"&&navigator.serviceWorker.controller){
            showUpdate(latestMeta?.current?.version||"",latestMeta?.current?.title||"");
          }
        });
      });
    }catch(e){console.warn("PWA service worker registration failed",e)}
  }
  // 첫 화면 로딩을 방해하지 않도록 업데이트 확인은 뒤로 미룹니다.
  setTimeout(checkUpdate,8000);
  setInterval(checkUpdate,CHECK_MS);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(checkUpdate,1200)});
  window.addEventListener("online",()=>setTimeout(checkUpdate,1200));
}
boot();
})();