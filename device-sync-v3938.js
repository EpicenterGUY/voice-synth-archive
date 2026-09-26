/* VocaDive Device Transfer v39.41 */
(function(){
"use strict";

var VERSION="39.41.0";
var ORG="vsa.organizer.v22",SMART="vsa.smart.v23",PLAYLISTS="vsa.playlists.v24";
var SIMPLE_KEYS=[
  "vsa.v33.followedProducers","vsa.v33.filters","vsa.v33.producerMode",
  "vsa397.search.recent","vsa397.search.mode","vsa.home.active.v37",
  "vsa.player.autoNext","vsa.player.maxVolume","vsa.player.volume",
  "vsa37FeatureHistory","vsa37FeatureStats",
  "vocaloidIcebergSourceMode","vocaloidIcebergCustomTag"
];

function safeParse(v,f){try{return JSON.parse(v)||f}catch(e){return f}}
function read(k){try{return localStorage.getItem(k)}catch(e){return null}}
function write(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function nowIso(){return new Date().toISOString()}

function exportData(){
  var data={};
  [ORG,SMART,PLAYLISTS].concat(SIMPLE_KEYS).forEach(function(k){
    var v=read(k);if(v!=null)data[k]=v;
  });
  return {
    type:"vocadive-device-transfer",
    schema:1,
    appVersion:VERSION,
    createdAt:nowIso(),
    data:data
  }
}
function fileFor(payload){
  var stamp=payload.createdAt.replace(/[:.]/g,"-");
  return new File([JSON.stringify(payload,null,2)],"VOCADive_backup_"+stamp+".json",{type:"application/json"})
}
function downloadPayload(payload){
  var file=fileFor(payload),url=URL.createObjectURL(file),a=document.createElement("a");
  a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)
}
async function sharePayload(payload){
  var file=fileFor(payload);
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    await navigator.share({title:"VOCADive 기록 백업",text:"VOCADive 기기 간 기록 백업 파일",files:[file]});return true
  }
  downloadPayload(payload);return false
}
function uniqRecent(rows,keyFn,timeFn,limit){
  var m=new Map();
  (rows||[]).forEach(function(x){
    if(!x)return;var k=keyFn(x);if(!k)return;
    var old=m.get(k);if(!old||timeFn(x)>=timeFn(old))m.set(k,x)
  });
  return Array.from(m.values()).sort(function(a,b){return timeFn(b)-timeFn(a)}).slice(0,limit)
}
function mergeOrganizer(local,remote){
  local=local&&typeof local==="object"?local:{};remote=remote&&typeof remote==="object"?remote:{};
  var out=Object.assign({version:1,library:{},recentViews:[],recentSearches:[],cases:[],compare:[],snapshots:{}},local);
  out.library=Object.assign({},local.library||{});
  Object.entries(remote.library||{}).forEach(function(pair){
    var id=pair[0],r=pair[1],l=out.library[id];
    var rt=Number(r&&r.updatedAt||r&&r.savedAt||0),lt=Number(l&&l.updatedAt||l&&l.savedAt||0);
    if(!l||rt>=lt)out.library[id]=r
  });
  out.recentViews=uniqRecent([].concat(local.recentViews||[],remote.recentViews||[]),function(x){return String(x.id||"")},function(x){return Number(x.viewedAt)||0},100);
  out.recentSearches=uniqRecent([].concat(local.recentSearches||[],remote.recentSearches||[]),function(x){return String(x.query||"")+"|"+String(x.scope||"")},function(x){return Number(x.searchedAt)||0},60);
  out.cases=uniqRecent([].concat(local.cases||[],remote.cases||[]),function(x){return String(x.id||x.title||"")},function(x){return Number(x.updatedAt||x.createdAt)||0},40);
  var cmp=new Map();[].concat(remote.compare||[],local.compare||[]).forEach(function(x){var id=String(x&&x.id||x&&x.contentId||"");if(id&&!cmp.has(id))cmp.set(id,x)});out.compare=Array.from(cmp.values()).slice(0,5);
  out.snapshots=Object.assign({},local.snapshots||{});
  Object.entries(remote.snapshots||{}).forEach(function(pair){
    var id=pair[0],rows=[].concat(out.snapshots[id]||[],pair[1]||[]),byDay=new Map();
    rows.forEach(function(x){if(x&&x.day)byDay.set(x.day,x)});
    out.snapshots[id]=Array.from(byDay.values()).sort(function(a,b){return String(a.day).localeCompare(String(b.day))}).slice(-20)
  });
  return out
}
function mergeSmart(local,remote){
  local=local&&typeof local==="object"?local:{};remote=remote&&typeof remote==="object"?remote:{};
  var out=Object.assign({version:1,feedback:{},tagPrefs:{},lastMix:[]},local);
  out.feedback=Object.assign({},local.feedback||{});
  Object.entries(remote.feedback||{}).forEach(function(pair){
    var id=pair[0],r=pair[1],l=out.feedback[id];
    if(!l||Number(r&&r.at||0)>=Number(l&&l.at||0))out.feedback[id]=r
  });
  out.tagPrefs=Object.assign({},local.tagPrefs||{});
  Object.entries(remote.tagPrefs||{}).forEach(function(pair){
    var k=pair[0],rv=Number(pair[1])||0,lv=Number(out.tagPrefs[k])||0;
    out.tagPrefs[k]=Math.abs(rv)>=Math.abs(lv)?rv:lv
  });
  if((remote.lastMix||[]).length)out.lastMix=remote.lastMix;
  if(remote.lastMixMeta)out.lastMixMeta=remote.lastMixMeta;
  return out
}
function mergePlaylists(local,remote){
  local=local&&typeof local==="object"?local:{version:1,playlists:[]};remote=remote&&typeof remote==="object"?remote:{version:1,playlists:[]};
  var m=new Map();
  [].concat(local.playlists||[],remote.playlists||[]).forEach(function(x){
    if(!x)return;var id=String(x.id||x.name||"");if(!id)return;
    var old=m.get(id),xt=Number(x.updatedAt||x.createdAt||0),ot=Number(old&&old.updatedAt||old&&old.createdAt||0);
    if(!old||xt>=ot)m.set(id,x)
  });
  return {version:Math.max(Number(local.version)||1,Number(remote.version)||1),playlists:Array.from(m.values())}
}
function mergeArrayStringKey(k,lv,rv){
  var la=safeParse(lv,[]),ra=safeParse(rv,[]);
  if(k==="vsa.v33.followedProducers")return JSON.stringify(Array.from(new Set([].concat(la||[],ra||[]).map(String))).slice(0,60));
  if(k==="vsa397.search.recent"){
    var rows=uniqRecent([].concat(la||[],ra||[]),function(x){return String(x&&x.q||"").toLowerCase()},function(x){return Number(x&&x.at)||0},24);
    return JSON.stringify(rows)
  }
  return rv!=null?rv:lv
}
function applyImport(payload){
  if(!payload||payload.type!=="vocadive-device-transfer"||!payload.data||typeof payload.data!=="object")throw new Error("VOCADive 백업 파일이 아닙니다.");
  var d=payload.data,changed=0;
  if(d[ORG]!=null){
    var mergedOrg=mergeOrganizer(safeParse(read(ORG),{}),safeParse(d[ORG],{}));if(write(ORG,JSON.stringify(mergedOrg)))changed++
  }
  if(d[SMART]!=null){
    var mergedSmart=mergeSmart(safeParse(read(SMART),{}),safeParse(d[SMART],{}));if(write(SMART,JSON.stringify(mergedSmart)))changed++
  }
  if(d[PLAYLISTS]!=null){
    var mergedPl=mergePlaylists(safeParse(read(PLAYLISTS),{}),safeParse(d[PLAYLISTS],{}));if(write(PLAYLISTS,JSON.stringify(mergedPl)))changed++
  }
  SIMPLE_KEYS.forEach(function(k){
    if(d[k]==null)return;
    var cur=read(k),next=mergeArrayStringKey(k,cur,d[k]);
    if(next!=null&&write(k,next))changed++
  });
  return changed
}
function countsFromPayload(payload){
  var d=payload&&payload.data||{},o=safeParse(d[ORG],{}),s=safeParse(d[SMART],{}),p=safeParse(d[PLAYLISTS],{});
  return {
    saved:Object.keys(o.library||{}).length,
    recent:(o.recentViews||[]).length,
    searches:(o.recentSearches||[]).length,
    feedback:Object.keys(s.feedback||{}).length,
    playlists:(p.playlists||[]).length
  }
}
function statusText(payload){
  var c=countsFromPayload(payload);
  return "보관 "+c.saved+" · 최근 본 곡 "+c.recent+" · 검색 "+c.searches+" · 취향 반응 "+c.feedback+" · 플레이리스트 "+c.playlists
}
function toastMsg(s){try{if(typeof toast==="function")toast(s)}catch(e){}}

var SUPABASE_URL="https://qfxyonddffceakmwjdij.supabase.co";
var SUPABASE_KEY="sb_publishable_eX69NiM1dbs3omeSlVw_-Q_0NsCt77k";
var cloudClientPromise=null,cloudTimer=0,cloudBusy=false;
async function cloudClient(){
  if(cloudClientPromise)return cloudClientPromise;
  cloudClientPromise=import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function(mod){
    return mod.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
  });
  return cloudClientPromise
}
async function cloudSession(){
  try{var sb=await cloudClient(),r=await sb.auth.getSession();return r.data&&r.data.session||null}catch(e){return null}
}
function cloudEmailLabel(session){
  var email=session&&session.user&&session.user.email;return email?email:"로그인 안 됨"
}
async function cloudSignUp(email,password){
  var sb=await cloudClient();
  var r=await sb.auth.signUp({email:email,password:password});
  if(r.error)throw r.error;
  return r.data
}
async function cloudSignIn(email,password){
  var sb=await cloudClient();
  var r=await sb.auth.signInWithPassword({email:email,password:password});
  if(r.error)throw r.error;
  return r.data
}
async function cloudSignOut(){
  var sb=await cloudClient();await sb.auth.signOut();refreshCloudUi()
}
async function cloudSyncNow(silent){
  if(cloudBusy)return false;cloudBusy=true;
  var status=document.getElementById("v3938CloudStatus"),btn=document.getElementById("v3938CloudSync");
  try{
    if(btn)btn.disabled=true;
    var sb=await cloudClient(),sr=await sb.auth.getSession(),session=sr.data&&sr.data.session;
    if(!session)throw new Error("먼저 클라우드 계정에 로그인해 주세요.");
    if(status)status.textContent="클라우드 기록을 확인하는 중…";
    var sel=await sb.from("vocadive_user_sync").select("payload,updated_at").eq("user_id",session.user.id).maybeSingle();
    if(sel.error)throw sel.error;
    if(sel.data&&sel.data.payload){
      applyImport(sel.data.payload);
    }
    var merged=exportData();
    var up=await sb.from("vocadive_user_sync").upsert({
      user_id:session.user.id,
      payload:merged,
      schema_version:1,
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(up.error)throw up.error;
    if(status)status.textContent="동기화 완료 · "+cloudEmailLabel(session)+" · "+statusText(merged);
    try{if(window.VSARefreshPersonal395)window.VSARefreshPersonal395()}catch(_){}
    if(!silent)toastMsg("휴대폰·컴퓨터 기록을 동기화했습니다.");
    return true
  }catch(e){
    if(status)status.textContent="동기화 실패 · "+String(e&&e.message||e);
    if(!silent)toastMsg("클라우드 동기화를 확인해 주세요.");
    return false
  }finally{cloudBusy=false;if(btn)btn.disabled=false}
}
function scheduleCloudSync(delay){
  clearTimeout(cloudTimer);
  cloudTimer=setTimeout(function(){cloudSyncNow(true)},Math.max(500,Number(delay)||1500))
}
async function refreshCloudUi(){
  var session=await cloudSession();
  var st=document.getElementById("v3938CloudStatus"),auth=document.getElementById("v3938CloudAuth"),on=document.getElementById("v3938CloudOn");
  if(st)st.textContent=session?"로그인됨 · "+cloudEmailLabel(session)+" · 이 계정으로 기기 간 자동 병합":"로그인하면 같은 계정의 휴대폰·컴퓨터 기록이 합쳐집니다.";
  if(auth)auth.hidden=!!session;
  if(on)on.hidden=!session;
  if(session)scheduleCloudSync(900)
}

function ensureUi(){
  var page=document.querySelector('[data-tool-view="settings29"]');if(!page)return null;
  var old=document.getElementById("v3938DeviceTransfer");if(old)return old;
  var sec=document.createElement("section");sec.id="v3938DeviceTransfer";sec.className="v3938-device-transfer";
  sec.innerHTML='<div class="v3938-sync-head"><div><small>DEVICE SYNC</small><h3>기기 간 기록 동기화</h3><p>휴대폰 ↔ 컴퓨터에서 같은 계정으로 로그인하면 보관함, 최근 본 곡, 검색 기록, 취향 반응과 플레이리스트를 병합합니다. 파일 백업도 그대로 사용할 수 있습니다.</p></div><span class="v3938-local-badge">Cloud + File</span></div>'+
    '<div class="v3938-cloud-box"><div class="v3938-cloud-head"><div><b>클라우드 동기화</b><small>Supabase 서울 리전 · 사용자별 RLS 분리</small></div></div>'+
      '<div id="v3938CloudAuth" class="v3938-cloud-auth"><input id="v3938CloudEmail" type="email" autocomplete="email" placeholder="이메일"><input id="v3938CloudPassword" type="password" autocomplete="current-password" placeholder="비밀번호 (6자 이상)"><button type="button" id="v3938CloudLogin">로그인</button><button type="button" id="v3938CloudSignup">처음이면 가입</button></div>'+
      '<div id="v3938CloudOn" class="v3938-cloud-on" hidden><button type="button" class="primary" id="v3938CloudSync">지금 동기화</button><button type="button" id="v3938CloudLogout">로그아웃</button></div>'+
      '<div class="v3938-sync-status" id="v3938CloudStatus">클라우드 상태 확인 중…</div></div>'+
    '<div class="v3938-file-title"><b>파일 백업</b><small>계정 없이도 직접 옮길 수 있습니다.</small></div>'+
    '<div class="v3938-sync-actions"><button type="button" class="primary" id="v3938Export">백업 파일 만들기</button><button type="button" id="v3938Share">공유</button><button type="button" id="v3938Import">백업 가져오기</button><input type="file" id="v3938ImportFile" accept="application/json,.json" hidden></div>'+
    '<div class="v3938-sync-status" id="v3938SyncStatus"></div>'+
    '<div class="v3938-sync-note"><b>동기화·가져오기는 덮어쓰기보다 병합 우선</b><span>곡 보관 상태·최근 기록·피드백은 더 최신 항목을 남기고, 플레이리스트와 팔로우 P는 합칩니다. Worker 주소와 API 캐시는 공유하지 않습니다.</span></div>';
  page.appendChild(sec);
  var st=document.createElement("style");st.id="v3938DeviceTransferStyle";st.textContent=
    ".v3938-device-transfer{margin-top:14px;padding:15px;border:1px solid rgba(113,205,197,.16);border-radius:18px;background:#071d23}.v3938-sync-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v3938-sync-head small{color:#66d1c7;font-size:7px;font-weight:950;letter-spacing:.12em}.v3938-sync-head h3{margin:4px 0 5px;font-size:18px}.v3938-sync-head p{margin:0;max-width:720px;color:#7fa29e;font-size:9px;line-height:1.65}.v3938-local-badge{flex:0 0 auto;padding:6px 8px;border-radius:999px;background:#0d3036;color:#8fd4cd;font-size:7px;font-weight:900}.v3938-sync-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}.v3938-sync-actions button{min-height:38px;padding:0 12px;border:1px solid #2a565d;border-radius:11px;background:#0b2930;color:#dff7f3;font-size:8px;font-weight:900}.v3938-sync-actions button.primary{background:#17464c;border-color:#3c8f88}.v3938-sync-status{margin-top:10px;padding:10px;border-radius:11px;background:#05181d;color:#89aaa6;font-size:8px}.v3938-sync-note{display:grid;gap:3px;margin-top:9px;padding:10px;border:1px dashed rgba(113,205,197,.14);border-radius:11px}.v3938-sync-note b{font-size:8px}.v3938-sync-note span{color:#6f918d;font-size:7px;line-height:1.55}.v3938-cloud-box{margin-top:13px;padding:12px;border:1px solid rgba(113,205,197,.16);border-radius:14px;background:#06191f}.v3938-cloud-head{display:flex;justify-content:space-between;gap:8px}.v3938-cloud-head b{font-size:10px}.v3938-cloud-head small{display:block;margin-top:3px;color:#739591;font-size:7px}.v3938-cloud-auth{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto auto;gap:7px;margin-top:10px}.v3938-cloud-auth input{min-width:0;min-height:38px}.v3938-cloud-auth button,.v3938-cloud-on button{min-height:38px;padding:0 12px;border:1px solid #2a565d;border-radius:11px;background:#0b2930;color:#dff7f3;font-size:8px;font-weight:900}.v3938-cloud-on{display:flex;gap:7px;margin-top:10px}.v3938-cloud-on .primary{background:#17464c;border-color:#3c8f88}.v3938-file-title{display:flex;justify-content:space-between;align-items:end;margin-top:14px}.v3938-file-title b{font-size:10px}.v3938-file-title small{font-size:7px;color:#6f918d}@media(max-width:699px){.v3938-sync-head{display:grid}.v3938-local-badge{justify-self:start}.v3938-cloud-auth{grid-template-columns:1fr 1fr}.v3938-cloud-auth input{grid-column:1/-1}.v3938-sync-actions{display:grid;grid-template-columns:1fr 1fr}.v3938-sync-actions .primary{grid-column:1/-1}}";
  document.head.appendChild(st);

  var payload=exportData(),status=document.getElementById("v3938SyncStatus");
  if(status)status.textContent="이 기기 기록 · "+statusText(payload);

  var cloudStatus=document.getElementById("v3938CloudStatus");
  document.getElementById("v3938CloudLogin").onclick=function(){
    var email=document.getElementById("v3938CloudEmail").value.trim(),pw=document.getElementById("v3938CloudPassword").value;
    if(!email||pw.length<6){if(cloudStatus)cloudStatus.textContent="이메일과 6자 이상 비밀번호를 입력해 주세요.";return}
    cloudSignIn(email,pw).then(function(){refreshCloudUi();cloudSyncNow(false)}).catch(function(e){if(cloudStatus)cloudStatus.textContent="로그인 실패 · "+String(e&&e.message||e)})
  };
  document.getElementById("v3938CloudSignup").onclick=function(){
    var email=document.getElementById("v3938CloudEmail").value.trim(),pw=document.getElementById("v3938CloudPassword").value;
    if(!email||pw.length<6){if(cloudStatus)cloudStatus.textContent="이메일과 6자 이상 비밀번호를 입력해 주세요.";return}
    cloudSignUp(email,pw).then(function(data){
      if(data&&data.session){refreshCloudUi();cloudSyncNow(false)}
      else if(cloudStatus)cloudStatus.textContent="가입 메일을 확인한 뒤 같은 이메일·비밀번호로 로그인해 주세요."
    }).catch(function(e){if(cloudStatus)cloudStatus.textContent="가입 실패 · "+String(e&&e.message||e)})
  };
  document.getElementById("v3938CloudSync").onclick=function(){cloudSyncNow(false)};
  document.getElementById("v3938CloudLogout").onclick=function(){cloudSignOut()};
  refreshCloudUi();

  document.getElementById("v3938Export").onclick=function(){var p=exportData();downloadPayload(p);if(status)status.textContent="백업 파일을 만들었습니다 · "+statusText(p);toastMsg("VOCADive 기록 백업을 만들었습니다.")};
  document.getElementById("v3938Share").onclick=function(){var p=exportData();sharePayload(p).then(function(shared){if(status)status.textContent=(shared?"공유 메뉴를 열었습니다":"공유 미지원이라 백업 파일로 저장했습니다")+" · "+statusText(p)}).catch(function(){if(status)status.textContent="공유를 취소했거나 열지 못했습니다."})};
  document.getElementById("v3938Import").onclick=function(){document.getElementById("v3938ImportFile").click()};
  document.getElementById("v3938ImportFile").onchange=function(){
    var file=this.files&&this.files[0];if(!file)return;
    file.text().then(function(txt){
      var p=safeParse(txt,null);if(!p)throw new Error("JSON을 읽지 못했습니다.");
      var summary=statusText(p);
      if(!confirm("이 백업을 현재 기기 기록과 병합할까요?\n\n"+summary))return;
      var n=applyImport(p);
      if(status)status.textContent="가져오기 완료 · "+summary+" · 저장소 "+n+"개 반영";
      try{if(window.VSAOrganizer22&&VSAOrganizer22.reload)VSAOrganizer22.reload()}catch(e){}
      try{if(window.VSARefreshPersonal395)window.VSARefreshPersonal395()}catch(e){}
      try{window.dispatchEvent(new Event("storage"))}catch(e){}
      toastMsg("기록을 병합했습니다. 화면을 새로 열면 모두 반영됩니다.")
    }).catch(function(err){if(status)status.textContent="가져오기 실패 · "+String(err&&err.message||err);toastMsg("백업 파일을 확인해 주세요.")})
    .finally(function(){var x=document.getElementById("v3938ImportFile");if(x)x.value=""})
  };
  return sec
}
function open(){return ensureUi()}
window.VSADeviceTransfer3938={open:open,exportData:exportData,applyImport:applyImport,sync:cloudSyncNow};window.addEventListener("focus",function(){scheduleCloudSync(1200)});document.addEventListener("visibilitychange",function(){if(!document.hidden)scheduleCloudSync(1200)});setInterval(function(){cloudSyncNow(true)},60000);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){if(document.querySelector('[data-tool-view="settings29"].active'))ensureUi()},{once:true});
else if(document.querySelector('[data-tool-view="settings29"].active'))ensureUi();
})();