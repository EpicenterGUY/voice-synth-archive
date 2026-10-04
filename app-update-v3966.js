/* VocaDive Direct APK Updater · v39.119.0 */
(function(){
"use strict";

var VERSION="39.122.0";
var RELEASE_API="https://api.github.com/repos/EpicenterGUY/voice-synth-archive/releases/latest";
var PREF_CHECK="vocadive.update.autoCheck";
var PREF_WIFI="vocadive.update.autoDownloadWifi";
var LAST_CHECK="vocadive.update.lastCheck";
var PENDING="vocadive.update.pending.v1";
var state={
  phase:"idle",
  appInfo:null,
  latest:null,
  progress:0,
  path:"",
  error:"",
  dismissed:false,
  listenerBound:false
};

function isAndroidNative(){
  try{return !!(window.VocaDivePlatform&&VocaDivePlatform.isNative&&VocaDivePlatform.isNative()&&VocaDivePlatform.platform()==="android")}catch(_){return false}
}
function isLiveShell(){
  try{return isAndroidNative()&&String(location.hostname||"").toLowerCase()==="epicenterguy.github.io"}catch(_){return false}
}
function plugin(){
  try{return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.VocaDiveUpdater?Capacitor.Plugins.VocaDiveUpdater:null}catch(_){return null}
}
function networkPlugin(){
  try{return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.Network?Capacitor.Plugins.Network:null}catch(_){return null}
}
function pref(key,def){
  try{var v=localStorage.getItem(key);return v==null?def:v!=="0"}catch(_){return def}
}
function setPref(key,v){try{localStorage.setItem(key,v?"1":"0")}catch(_){}}
function toast3966(msg){
  try{if(typeof window.toast==="function"){window.toast(msg);return}}catch(_){}
  try{console.info("[VocaDive Update]",msg)}catch(_){}
}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function versionParts(v){return String(v||"0").replace(/^app-v/i,"").replace(/^v/i,"").split(/[.+-]/).slice(0,3).map(function(x){return Number(x)||0})}
function compareVersion(a,b){
  var A=versionParts(a),B=versionParts(b);
  for(var i=0;i<3;i++){if((A[i]||0)>(B[i]||0))return 1;if((A[i]||0)<(B[i]||0))return-1}
  return 0
}
function versionCode(v){var p=versionParts(v);return (p[0]||0)*1000000+(p[1]||0)*1000+(p[2]||0)}
function humanBytes(n){
  n=Number(n)||0;if(!n)return"";
  if(n<1024*1024)return Math.max(1,Math.round(n/1024))+"KB";
  return (n/1024/1024).toFixed(n<10*1024*1024?1:0)+"MB"
}
function savePending(){
  try{
    if(state.path&&state.latest)localStorage.setItem(PENDING,JSON.stringify({path:state.path,version:state.latest.version,url:state.latest.url,sha256:state.latest.sha256||"",at:Date.now()}));
    else localStorage.removeItem(PENDING)
  }catch(_){}
}
function loadPending(){
  try{
    var x=JSON.parse(localStorage.getItem(PENDING)||"null");
    if(!x||!x.path||Date.now()-(+x.at||0)>24*60*60*1000)return null;
    return x
  }catch(_){return null}
}
function phaseText(){
  if(state.appInfo&&state.appInfo.debuggable)return isLiveShell()?"Live Shell · 웹 UI v"+VERSION+" 자동 동기화":"디버그 APK · 정식 서명 업데이트 채널 대기";
  if(state.phase==="checking")return"새 버전 확인 중…";
  if(state.phase==="available")return"v"+state.latest.version+" 업데이트 사용 가능";
  if(state.phase==="downloading")return"업데이트 다운로드 "+Math.max(0,state.progress||0)+"%";
  if(state.phase==="permission")return"다운로드 완료 · APK 설치 권한 필요";
  if(state.phase==="ready")return"다운로드 완료 · 설치 준비됨";
  if(state.phase==="installing")return"Android 설치 확인창을 여는 중…";
  if(state.phase==="latest")return"최신 버전 사용 중";
  if(state.phase==="error")return state.error||"업데이트 확인 실패";
  return"직접 APK 업데이트 채널";
}
function ensureStyle(){
  if(document.getElementById("v3966UpdateStyle"))return;
  var s=document.createElement("style");s.id="v3966UpdateStyle";s.textContent=[
    ".v3966-update-banner{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(84px + env(safe-area-inset-bottom));z-index:1000002;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 13px;border:1px solid rgba(91,224,204,.24);border-radius:16px;background:rgba(4,27,33,.96);box-shadow:0 18px 48px rgba(0,0,0,.42);backdrop-filter:blur(16px);color:#eafffb}",
    ".v3966-update-banner[hidden]{display:none!important}.v3966-update-banner small{display:block;color:#6ccfc3;font-size:7px;font-weight:950;letter-spacing:.08em}.v3966-update-banner b{display:block;margin-top:2px;font-size:10px}.v3966-update-banner em{display:block;margin-top:3px;color:#87aaa6;font-size:7px;font-style:normal}",
    ".v3966-update-actions{display:flex;gap:5px;align-items:center}.v3966-update-actions button{min-height:36px;padding:0 12px;border:1px solid rgba(102,220,207,.18);border-radius:11px;background:#123a42;color:#dffffa;font-size:7px;font-weight:950}.v3966-update-actions button.primary{background:linear-gradient(135deg,#54d7ca,#6b76ef);color:#071b20;border:0}.v3966-update-actions button.quiet{padding:0 8px;background:transparent;color:#749b97}",
    ".v3966-update-progress{height:3px;margin-top:7px;border-radius:99px;background:#12343a;overflow:hidden}.v3966-update-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#59ddd0,#7476f1);transition:width .18s}",
    ".v3966-update-card{grid-column:1/-1;padding:10px;border:1px solid rgba(109,202,195,.13);border-radius:13px;background:#071f25}.v3966-update-card-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.v3966-update-card h3{margin:0;font-size:10px}.v3966-update-card p{margin:4px 0 8px;color:#739d98;font-size:7px;line-height:1.5}.v3966-update-card .row{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.v3966-update-card label{display:flex;align-items:center;gap:5px;color:#9dc1bc;font-size:7px}.v3966-update-card button{min-height:32px;padding:0 10px;border:1px solid #24535a;border-radius:9px;background:#0c3037;color:#d9fffa;font-size:7px;font-weight:900}",
    "@media(max-width:560px){.v3966-update-banner{grid-template-columns:1fr;bottom:calc(78px + env(safe-area-inset-bottom))}.v3966-update-actions{justify-content:flex-end}}"
  ].join("");
  document.head.appendChild(s)
}
function ensureBanner(){
  ensureStyle();
  var b=document.getElementById("v3966UpdateBanner");
  if(b)return b;
  b=document.createElement("div");b.id="v3966UpdateBanner";b.className="v3966-update-banner";b.hidden=true;
  b.innerHTML='<div><small>VOCADIVE · APK UPDATE</small><b data-v3966-title></b><em data-v3966-sub></em><div class="v3966-update-progress" data-v3966-progress-wrap hidden><i data-v3966-progress></i></div></div><div class="v3966-update-actions"><button type="button" class="primary" data-v3966-main></button><button type="button" class="quiet" data-v3966-dismiss>닫기</button></div>';
  document.body.appendChild(b);
  b.addEventListener("click",function(e){
    if(e.target.closest("[data-v3966-dismiss]")){state.dismissed=true;b.hidden=true;return}
    if(e.target.closest("[data-v3966-main]"))handleMainAction()
  });
  return b
}
function renderBanner(force){
  var b=ensureBanner(),show=!!force||["available","downloading","permission","ready","installing","error"].includes(state.phase);
  if(state.appInfo&&state.appInfo.debuggable)show=false;
  if(state.dismissed&&!force&&state.phase!=="permission")show=false;
  b.hidden=!show;if(!show)return;
  var title=b.querySelector("[data-v3966-title]"),sub=b.querySelector("[data-v3966-sub]"),btn=b.querySelector("[data-v3966-main]"),wrap=b.querySelector("[data-v3966-progress-wrap]"),bar=b.querySelector("[data-v3966-progress]");
  title.textContent=phaseText();
  sub.textContent=state.latest?("현재 v"+(state.appInfo&&state.appInfo.versionName||VERSION)+" → v"+state.latest.version+(state.latest.size?" · "+humanBytes(state.latest.size):"")):"";
  wrap.hidden=state.phase!=="downloading";bar.style.width=Math.max(0,state.progress||0)+"%";
  if(state.phase==="available"){btn.textContent="다운로드";btn.hidden=false}
  else if(state.phase==="permission"){btn.textContent="설치 허용";btn.hidden=false}
  else if(state.phase==="ready"){btn.textContent="지금 설치";btn.hidden=false}
  else if(state.phase==="error"){btn.textContent="다시 확인";btn.hidden=false}
  else{btn.textContent=state.phase==="downloading"?"다운로드 중…":"설치 중…";btn.hidden=false;btn.disabled=true;return}
  btn.disabled=false
}
function ensureSettingsCard(){
  ensureStyle();
  var grid=document.querySelector("#settingsPanel .settings-grid");if(!grid||document.getElementById("v3966UpdateCard"))return;
  var card=document.createElement("div");card.id="v3966UpdateCard";card.className="v3966-update-card";
  card.innerHTML='<div class="v3966-update-card-head"><h3>앱 업데이트</h3><span data-v3966-current>웹 v'+esc(VERSION)+'</span></div><p data-v3966-status>앱 셸과 웹 UI 버전을 확인합니다.</p><div class="row"><label><input type="checkbox" data-v3966-auto-check> 시작할 때 자동 확인</label><label><input type="checkbox" data-v3966-auto-wifi> Wi-Fi에서 APK 자동 다운로드</label><button type="button" data-v3966-web-refresh>웹 업데이트 적용</button><button type="button" data-v3966-check>APK 확인</button></div>';
  grid.appendChild(card);
  var ac=card.querySelector("[data-v3966-auto-check]"),aw=card.querySelector("[data-v3966-auto-wifi]");
  ac.checked=pref(PREF_CHECK,true);aw.checked=pref(PREF_WIFI,true);
  ac.addEventListener("change",function(){setPref(PREF_CHECK,ac.checked)});
  aw.addEventListener("change",function(){setPref(PREF_WIFI,aw.checked)});
  card.querySelector("[data-v3966-check]").addEventListener("click",function(){checkForUpdate(true)});
  card.querySelector("[data-v3966-web-refresh]").addEventListener("click",function(){applyWebUpdate()});
  updateSettings()
}
function updateSettings(){
  var card=document.getElementById("v3966UpdateCard");if(!card)return;
  var cur=card.querySelector("[data-v3966-current]"),st=card.querySelector("[data-v3966-status]");
  if(cur){
    var shell=state.appInfo&&state.appInfo.versionName;
    cur.textContent=isLiveShell()&&shell?("앱 셸 v"+shell+" · 웹 v"+VERSION):("v"+(shell||VERSION))
  }
  if(st)st.textContent=phaseText()
}
async function releaseInfo(){
  var res=await fetch(RELEASE_API+"?t="+Date.now(),{cache:"no-store",headers:{"Accept":"application/vnd.github+json"}});
  if(!res.ok)throw new Error(res.status===404?"아직 정식 APK 릴리스가 없습니다.":"릴리스 확인 HTTP "+res.status);
  var rel=await res.json(),assets=Array.isArray(rel.assets)?rel.assets:[];
  var apk=assets.find(function(a){return /^VocaDive\.apk$/i.test(a.name||"")})||assets.find(function(a){return /vocadive.*\.apk$/i.test(a.name||"")&&!/debug/i.test(a.name||"")});
  if(!apk)throw new Error("최신 릴리스에 설치용 APK가 없습니다.");
  var v=String(rel.tag_name||rel.name||"").replace(/^app-v/i,"").replace(/^v/i,"").trim();
  if(!/^\d+\.\d+\.\d+/.test(v))throw new Error("릴리스 버전을 확인할 수 없습니다.");
  var digest=String(apk.digest||"").replace(/^sha256:/i,"");
  return{version:v,versionCode:versionCode(v),url:String(apk.browser_download_url||""),sha256:digest,size:Number(apk.size)||0,name:String(apk.name||"VocaDive.apk"),releaseUrl:String(rel.html_url||"")}
}
async function getAppInfo(){
  var p=plugin();if(!p||!p.getAppInfo)return null;
  try{state.appInfo=await p.getAppInfo();return state.appInfo}catch(_){return null}
}

async function applyWebUpdate(){
  try{
    toast3966("최신 웹 UI를 적용하는 중…");
    if("serviceWorker" in navigator){
      try{
        var regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function(r){try{return r.update()}catch(_){return null}}))
      }catch(_){}
    }
    try{
      if(window.caches){
        var keys=await caches.keys();
        await Promise.all(keys.filter(function(k){return /voca|vocadive|app-shell/i.test(k)}).map(function(k){return caches.delete(k)}))
      }
    }catch(_){}
    var u=new URL(location.href);
    u.searchParams.set("ui",VERSION);
    u.searchParams.set("_refresh",String(Date.now()));
    location.replace(u.toString())
  }catch(e){
    try{location.reload()}catch(_){}
  }
}

async function checkWebUiVersion(auto){
  try{
    var r=await fetch("./web-latest.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok)return false;
    var info=await r.json();
    var remote=String(info&&info.version||"");
    if(!/^\d+\.\d+\.\d+/.test(remote))return false;
    if(compareVersion(remote,VERSION)<=0)return false;
    var key="vocadive.web.refresh."+remote;
    if(auto){
      try{if(sessionStorage.getItem(key)==="1")return false;sessionStorage.setItem(key,"1")}catch(_){}
      await applyWebUpdate();return true
    }
    toast3966("웹 UI v"+remote+" 업데이트가 있습니다.");
    return true
  }catch(_){return false}
}
async function onWifi(){
  try{
    var n=networkPlugin();if(n&&n.getStatus){var s=await n.getStatus();return s&&s.connected&&s.connectionType==="wifi"}
  }catch(_){}
  try{
    var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    if(c&&c.type)return c.type==="wifi"
  }catch(_){}
  return false
}
function bindProgress(){
  if(state.listenerBound)return;var p=plugin();if(!p||!p.addListener)return;
  state.listenerBound=true;
  try{p.addListener("downloadProgress",function(x){state.progress=Math.max(0,Number(x&&x.percent)||0);renderBanner();updateSettings()})}catch(_){}
}
async function checkForUpdate(manual){
  if(!isAndroidNative()){
    if(manual)toast3966("APK 자동 업데이트는 Android 앱에서 사용할 수 있습니다.");
    return false
  }
  var p=plugin();if(!p){if(manual)toast3966("업데이트 모듈을 찾지 못했습니다.");return false}
  await getAppInfo();ensureSettingsCard();
  if(state.appInfo&&state.appInfo.debuggable){
    state.phase="idle";updateSettings();
    if(manual)toast3966(isLiveShell()?"Live Shell은 GitHub Pages 최신 UI를 자동으로 불러옵니다. 네이티브 코드 변경만 새 APK가 필요합니다.":"현재 디버그 APK입니다. 정식 서명 APK를 한 번 설치한 뒤 직접 APK 업데이트가 활성화됩니다.");
    return false
  }
  state.phase="checking";state.error="";updateSettings();if(manual)renderBanner(true);
  try{
    var info=await releaseInfo();state.latest=info;
    localStorage.setItem(LAST_CHECK,String(Date.now()));
    var current=state.appInfo&&state.appInfo.versionName||VERSION;
    if(compareVersion(info.version,current)<=0){
      state.phase="latest";updateSettings();
      if(manual){toast3966("이미 최신 버전입니다.");renderBanner(false)}
      return false
    }
    state.phase="available";state.dismissed=false;updateSettings();renderBanner();
    if(!manual&&pref(PREF_WIFI,true)&&await onWifi())await downloadUpdate();
    return true
  }catch(e){
    state.phase="error";state.error=String(e&&e.message||e);updateSettings();
    if(manual){renderBanner(true);toast3966(state.error)}
    return false
  }
}
async function downloadUpdate(){
  var p=plugin();if(!p||!state.latest||state.phase==="downloading")return false;
  bindProgress();state.phase="downloading";state.progress=0;state.error="";renderBanner();updateSettings();
  try{
    var result=await p.download({url:state.latest.url,sha256:state.latest.sha256||"",fileName:"VocaDive-"+state.latest.version+".apk"});
    state.path=result&&result.path||"";state.progress=100;savePending();
    var perm=await p.canInstallPackages();
    if(perm&&perm.allowed){
      state.phase="ready";renderBanner();updateSettings();
      // Wi-Fi 자동 다운로드는 완료 후 Android 시스템 설치 확인창까지 바로 이어간다.
      await installPending(true)
    }else{
      state.phase="permission";renderBanner();updateSettings()
    }
    return true
  }catch(e){
    state.phase="error";state.error=String(e&&e.message||e);renderBanner();updateSettings();return false
  }
}
async function installPending(auto){
  var p=plugin();if(!p)return false;
  if(!state.path){
    var saved=loadPending();if(saved){state.path=saved.path;state.latest=state.latest||{version:saved.version,url:saved.url,sha256:saved.sha256||""}}
  }
  if(!state.path)return downloadUpdate();
  try{
    var perm=await p.canInstallPackages();
    if(!(perm&&perm.allowed)){
      state.phase="permission";renderBanner();updateSettings();
      if(!auto)await p.openInstallSettings();
      return false
    }
    state.phase="installing";renderBanner();updateSettings();
    var r=await p.install({path:state.path});
    if(r&&r.permissionRequired){state.phase="permission";renderBanner();updateSettings();return false}
    return !!(r&&r.launched)
  }catch(e){
    state.phase="error";state.error=String(e&&e.message||e);renderBanner();updateSettings();return false
  }
}
async function handleMainAction(){
  if(state.phase==="available")return downloadUpdate();
  if(state.phase==="permission"){
    try{var p=plugin();if(p&&p.openInstallSettings)await p.openInstallSettings()}catch(_){}
    return
  }
  if(state.phase==="ready")return installPending(false);
  return checkForUpdate(true)
}
async function resumeInstall(){
  if(!isAndroidNative())return;
  var saved=loadPending();if(!saved)return;
  var p=plugin();if(!p)return;
  try{
    var perm=await p.canInstallPackages();
    if(perm&&perm.allowed){
      state.path=saved.path;state.latest=state.latest||{version:saved.version,url:saved.url,sha256:saved.sha256||""};
      state.phase="ready";renderBanner();updateSettings()
    }
  }catch(_){}
}
function boot(){
  ensureStyle();
  var tries=0,t=setInterval(function(){tries++;ensureSettingsCard();if(document.getElementById("v3966UpdateCard")||tries>30)clearInterval(t)},500);
  setTimeout(function(){checkWebUiVersion(true)},1800);
  if(!isAndroidNative())return;
  bindProgress();getAppInfo().then(function(){
    ensureSettingsCard();
    var saved=loadPending();
    if(saved){
      state.path=saved.path;state.latest={version:saved.version,url:saved.url,sha256:saved.sha256||""};state.phase="ready";renderBanner();updateSettings()
    }
    var last=Number(localStorage.getItem(LAST_CHECK)||0);
    if(pref(PREF_CHECK,true)&&Date.now()-last>6*60*60*1000)setTimeout(function(){checkForUpdate(false)},2600)
  });
  window.addEventListener("vocadive:native-resume",function(){
    resumeInstall();
    setTimeout(function(){checkWebUiVersion(true)},350);
    var last=Number(localStorage.getItem(LAST_CHECK)||0);
    if(pref(PREF_CHECK,true)&&Date.now()-last>6*60*60*1000)setTimeout(function(){checkForUpdate(false)},800)
  })
}

window.VocaDiveUpdater={
  version:VERSION,
  check:checkForUpdate,
  download:downloadUpdate,
  install:installPending,
  applyWebUpdate:applyWebUpdate,
  checkWebUi:checkWebUiVersion,
  state:function(){return Object.assign({},state)}
};

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
