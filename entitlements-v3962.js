/* VocaDive Entitlement Foundation · v39.71.0 */
(function(){
"use strict";

var VERSION="39.89.0";
var STORAGE_KEY="vocadive.entitlements.session.v1";

var FEATURES={
  "core.search":{tier:"free",label:"검색"},
  "core.playback":{tier:"free",label:"재생"},
  "core.recommend":{tier:"free",label:"기본 추천"},
  "core.dive":{tier:"free",label:"기본 다이브"},
  "core.detective":{tier:"free",label:"기본 탐정"},
  "core.iceberg":{tier:"free",label:"빙산"},
  "core.library":{tier:"free",label:"기본 보관함"},

  "pro.cloud_sync":{tier:"pro",label:"클라우드 동기화"},
  "pro.detective_unlimited":{tier:"pro",label:"고급 탐정"},
  "pro.dive_deep_bridge":{tier:"pro",label:"심층 장르 브리지"},
  "pro.analytics_advanced":{tier:"pro",label:"고급 통계"},
  "pro.library_plus":{tier:"pro",label:"확장 보관함"},
  "pro.export_plus":{tier:"pro",label:"고급 내보내기"},
  "pro.theme_pack":{tier:"pro",label:"Pro 테마"}
};

var state={
  plan:"free",
  status:"active",
  source:"default",
  expiresAt:null,
  entitlements:[],
  products:[],
  updatedAt:Date.now()
};

function safeParse(v){try{return JSON.parse(v)}catch(_){return null}}
function isLocalDev(){
  try{return ["localhost","127.0.0.1","::1"].includes(location.hostname)}catch(_){return false}
}
function normalizePlan(v){return String(v||"").toLowerCase()==="pro"?"pro":"free"}
function validExpiry(v){
  if(!v)return null;
  var t=Date.parse(v);return Number.isFinite(t)?new Date(t).toISOString():null
}
function isExpired(){
  if(!state.expiresAt)return false;
  return Date.parse(state.expiresAt)<=Date.now()
}
function saveSession(){
  try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_){}
}
function loadSession(){
  try{
    var x=safeParse(sessionStorage.getItem(STORAGE_KEY)||"");
    if(!x||typeof x!=="object")return;
    state.plan=normalizePlan(x.plan);
    state.status=String(x.status||"active");
    state.source=String(x.source||"session");
    state.expiresAt=validExpiry(x.expiresAt);
    state.entitlements=Array.isArray(x.entitlements)?x.entitlements.map(String):[];
    state.products=Array.isArray(x.products)?x.products.map(String):[];
    state.updatedAt=Number(x.updatedAt)||Date.now();
    if(isExpired()){state.plan="free";state.status="expired";state.entitlements=[]}
  }catch(_){}
}
function snapshot(){
  return {
    version:VERSION,
    plan:isExpired()?"free":state.plan,
    status:isExpired()?"expired":state.status,
    source:state.source,
    expiresAt:state.expiresAt,
    entitlements:state.entitlements.slice(),
    products:state.products.slice(),
    updatedAt:state.updatedAt
  }
}
function featureMeta(id){return FEATURES[String(id||"")]||null}
function has(id){
  var meta=featureMeta(id);
  if(!meta)return false;
  if(meta.tier==="free")return true;
  if(isExpired())return false;
  return state.plan==="pro"||state.entitlements.includes(String(id))
}
function explain(id){
  var meta=featureMeta(id);
  if(!meta)return {allowed:false,reason:"unknown_feature",feature:String(id||"")};
  if(has(id))return {allowed:true,reason:"entitled",feature:id,tier:meta.tier,label:meta.label};
  return {allowed:false,reason:meta.tier==="pro"?"pro_required":"not_available",feature:id,tier:meta.tier,label:meta.label}
}
function emit(){
  try{window.dispatchEvent(new CustomEvent("vocadive:entitlements-changed",{detail:snapshot()}))}catch(_){}
}
function applyServerState(payload){
  payload=payload&&typeof payload==="object"?payload:{};
  state.plan=normalizePlan(payload.plan);
  state.status=String(payload.status||"active");
  state.source="server";
  state.expiresAt=validExpiry(payload.expiresAt);
  state.entitlements=Array.isArray(payload.entitlements)?payload.entitlements.map(String):[];
  state.products=Array.isArray(payload.products)?payload.products.map(String):[];
  state.updatedAt=Date.now();
  if(isExpired()){state.plan="free";state.status="expired";state.entitlements=[]}
  saveSession();emit();return snapshot()
}
function clear(){
  state={plan:"free",status:"active",source:"default",expiresAt:null,entitlements:[],products:[],updatedAt:Date.now()};
  try{sessionStorage.removeItem(STORAGE_KEY)}catch(_){}
  emit();return snapshot()
}
function guard(id,onAllowed,onBlocked){
  var ok=has(id);
  try{
    if(ok&&typeof onAllowed==="function")onAllowed();
    if(!ok&&typeof onBlocked==="function")onBlocked(explain(id))
  }catch(_){}
  if(!ok){
    try{window.dispatchEvent(new CustomEvent("vocadive:pro-required",{detail:explain(id)}))}catch(_){}
  }
  return ok
}
function setPreviewPlan(plan){
  if(!isLocalDev())return false;
  state.plan=normalizePlan(plan);state.status="preview";state.source="local-preview";state.expiresAt=null;state.updatedAt=Date.now();
  saveSession();emit();return true
}

loadSession();

window.VocaDiveEntitlements={
  version:VERSION,
  features:Object.freeze(Object.assign({},FEATURES)),
  snapshot:snapshot,
  has:has,
  explain:explain,
  guard:guard,
  applyServerState:applyServerState,
  clear:clear,
  setPreviewPlan:setPreviewPlan
};

setTimeout(emit,0);
})();
