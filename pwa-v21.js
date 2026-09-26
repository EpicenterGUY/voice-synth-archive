/* Voice Synth Archive PWA v21 */
(function(){
"use strict";
const APP_VERSION="39.32.0";
const CHECK_MS=900000;
const MIN_CHECK_GAP=45000;
let lastCheckAt=0;
let deferredInstall=null;
let registration=null;
let latestMeta=null;
let reloading=false;
let applyingUpdate=false;
const DISMISS_KEY="vsa.pwa.dismissedUpdate";
const RUNNING_KEY="vsa.pwa.runningVersion";

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
function dismissedVersion(){
  try{return localStorage.getItem(DISMISS_KEY)||""}catch(e){return""}
}
function setDismissedVersion(v){
  try{if(v)localStorage.setItem(DISMISS_KEY,String(v));else localStorage.removeItem(DISMISS_KEY)}catch(e){}
}
function runtimeVersion(){
  let best=APP_VERSION;
  try{
    const txt=(document.querySelector(".footer")?.textContent||"")+" "+(document.querySelector("[data-app-version]")?.getAttribute("data-app-version")||"");
    const found=txt.match(/\d+\.\d+\.\d+/g)||[];
    found.forEach(v=>{if(newer(v,best))best=v});
  }catch(e){}
  return best;
}
function updateIsReal(version){
  return !!version && newer(version,runtimeVersion());
}
function hideUpdate(){
  const bar=document.getElementById("pwaUpdateBar");
  if(bar)bar.hidden=true;
}

function addStyle(){
  const style=document.createElement("style");
  style.textContent=`
  .pwa-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .pwa-mini{min-height:34px;padding:0 10px;border:1px solid #29445f;border-radius:999px;background:#0b1727cc;color:#d8ecfa;font-size:10px;font-weight:900}
  .pwa-mini:hover{border-color:#61c8f2}.pwa-mini[hidden]{display:none!important}
  .pwa-update-bar{position:fixed;z-index:24010;right:18px;bottom:max(18px,env(safe-area-inset-bottom));width:min(430px,calc(100vw - 36px));display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid rgba(119,221,211,.30);border-radius:15px;background:linear-gradient(145deg,rgba(16,54,62,.96),rgba(10,35,43,.96));box-shadow:0 16px 42px rgba(0,7,10,.35);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2)}
  .pwa-update-bar[hidden]{display:none!important}.pwa-update-copy{flex:1;min-width:0}.pwa-update-copy b{display:block;font-size:10px;color:#f0fffc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pwa-update-copy span{display:block;margin-top:2px;font-size:7.5px;color:#9fc0bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pwa-update-now{min-height:34px;border:0;border-radius:10px;padding:0 10px;background:linear-gradient(135deg,#72ded3,#76b7ef 52%,#8a7fff);color:#07171b;font-weight:950;font-size:8px;white-space:nowrap}
  .pwa-update-later{min-height:34px;border:1px solid rgba(119,221,211,.20);border-radius:10px;padding:0 8px;background:#12343c;color:#b9d7d3;font-weight:850;font-size:7.5px;white-space:nowrap}
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
    .pwa-update-bar{right:10px;bottom:calc(78px + env(safe-area-inset-bottom));width:min(360px,calc(100vw - 20px));padding:8px 9px;gap:6px}
    .pwa-update-copy b{font-size:9px}.pwa-update-copy span{font-size:7px}
    .pwa-update-now{min-height:32px;padding:0 9px;font-size:7.5px}.pwa-update-later{min-height:32px;padding:0 7px;font-size:7px}
  }
  @media(min-width:1100px){
    body.v37-ready .pwa-update-bar{right:20px;bottom:20px}
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
  bar.innerHTML='<div class="pwa-update-copy"><b id="pwaUpdateTitle">새 버전이 있습니다</b><span id="pwaUpdateText">업데이트를 적용할 수 있습니다.</span></div><button class="pwa-update-later" id="pwaUpdateLater">나중에</button><button class="pwa-update-now" id="pwaUpdateNow">업데이트</button>';
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
  document.getElementById("pwaUpdateLater").addEventListener("click",()=>{
    const version=bar.dataset.version||latestMeta?.current?.version||"";
    if(updateIsReal(version))setDismissedVersion(version);
    bar.hidden=true;
  });

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
  if(!bar)return false;
  version=String(version||"").trim();
  if(!updateIsReal(version)||dismissedVersion()===version){
    bar.dataset.version="";
    bar.hidden=true;
    return false;
  }
  bar.dataset.version=version;
  document.getElementById("pwaUpdateTitle").textContent="새 업데이트 v"+version+(title?" · "+title:"");
  document.getElementById("pwaUpdateText").textContent="새 버전이 실제로 확인됐을 때만 이 알림이 표시됩니다.";
  bar.hidden=false;
  return true;
}
async function checkUpdate(force=false){
  const now=Date.now();
  if(!force&&now-lastCheckAt<MIN_CHECK_GAP)return;
  lastCheckAt=now;
  try{
    const r=await fetch("./changelog.json?t="+Date.now(),{cache:"no-store"});
    if(r.ok){
      latestMeta=await r.json();
      const cur=latestMeta?.current||{};
      if(updateIsReal(cur.version))showUpdate(cur.version,cur.title);
      else hideUpdate();
    }
    if(registration){
      await registration.update();
      if(registration.waiting){
        const v=latestMeta?.current?.version||"";
        if(updateIsReal(v)){
          showUpdate(v,latestMeta?.current?.title||"");
        }else{
          // 같은 앱 버전의 SW만 대기 중이면 오래된 업데이트 알림을 띄우지 않고 조용히 활성화한다.
          registration.waiting.postMessage({type:"SKIP_WAITING"});
        }
      }
    }
  }catch{}
}
async function applyUpdate(){
  const btn=document.getElementById("pwaUpdateNow");
  const bar=document.getElementById("pwaUpdateBar");
  if(btn){btn.disabled=true;btn.textContent="업데이트 중…"}
  applyingUpdate=true;
  setDismissedVersion("");
  try{
    if(registration)await registration.update();
    if(registration?.waiting){
      registration.waiting.postMessage({type:"SKIP_WAITING"});
      return;
    }
    location.reload();
  }catch{
    location.reload();
  }finally{
    if(!registration?.waiting&&btn){btn.disabled=false;btn.textContent="업데이트"}
    if(bar&&!registration?.waiting)bar.hidden=true;
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
  if(reloading)return;
  reloading=true;
  hideUpdate();
  if(applyingUpdate){
    setTimeout(()=>location.reload(),120);
  }else{
    // 백그라운드에서 같은 버전 SW가 교체된 경우 팝업을 다시 띄우지 않는다.
    setTimeout(()=>{reloading=false},300);
  }
});

async function boot(){
  try{
    localStorage.setItem(RUNNING_KEY,runtimeVersion());
    if(dismissedVersion()&&!newer(dismissedVersion(),APP_VERSION))setDismissedVersion("");
  }catch(e){}
  buildUi();
  if("serviceWorker" in navigator){
    try{
      registration=await navigator.serviceWorker.register("./service-worker.js",{scope:"./",updateViaCache:"none"});
      registration.addEventListener("updatefound",()=>{
        const worker=registration.installing;
        if(!worker)return;
        worker.addEventListener("statechange",()=>{
          if(worker.state==="installed"&&navigator.serviceWorker.controller){
            // 설치 이벤트만으로 업데이트라고 단정하지 않고 메타 버전을 다시 확인한다.
            setTimeout(checkUpdate,80);
          }
        });
      });
    }catch(e){console.warn("PWA service worker registration failed",e)}
  }
  // 첫 화면 로딩을 방해하지 않도록 업데이트 확인은 뒤로 미룹니다.
  setTimeout(()=>checkUpdate(true),8000);
  setInterval(checkUpdate,CHECK_MS);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(()=>checkUpdate(false),1200)});
  window.addEventListener("online",()=>setTimeout(()=>checkUpdate(true),1200));
}
boot();
})();