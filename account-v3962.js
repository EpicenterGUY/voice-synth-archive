/* VocaDive Account + Cloud Foundation · v39.71.0 */
(function(){
"use strict";

var VERSION="39.100.0";
var DEVICE_KEY="vocadive.device.id.v1";
var API_KEY="vocadive.app.apiBase.v1";
var SESSION_KEY="vocadive.account.session.v1";
var session={status:"anonymous",user:null,provider:null,updatedAt:Date.now()};

function id(){
  var x="";
  try{x=localStorage.getItem(DEVICE_KEY)||""}catch(_){}
  if(x)return x;
  var r="";
  try{
    if(crypto&&typeof crypto.randomUUID==="function")r=crypto.randomUUID()
  }catch(_){}
  if(!r)r="vd-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,12);
  try{localStorage.setItem(DEVICE_KEY,r)}catch(_){}
  return r
}
function apiBase(){
  try{return String(localStorage.getItem(API_KEY)||"").replace(/\/+$/,"")}catch(_){return ""}
}
function setApiBase(v){
  v=String(v||"").trim().replace(/\/+$/,"");
  if(v&&!/^https:\/\//i.test(v))return false;
  try{if(v)localStorage.setItem(API_KEY,v);else localStorage.removeItem(API_KEY)}catch(_){}
  return true
}
function loadSession(){
  try{
    var x=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
    if(x&&typeof x==="object"){
      session.status=String(x.status||"anonymous");
      session.user=x.user&&typeof x.user==="object"?x.user:null;
      session.provider=x.provider||null;
      session.updatedAt=Number(x.updatedAt)||Date.now()
    }
  }catch(_){}
}
function saveSession(){
  try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(session))}catch(_){}
}
function snapshot(){
  return {
    version:VERSION,
    deviceId:id(),
    status:session.status,
    user:session.user?Object.assign({},session.user):null,
    provider:session.provider,
    apiBase:apiBase(),
    updatedAt:session.updatedAt
  }
}
function emit(type,detail){
  try{window.dispatchEvent(new CustomEvent("vocadive:"+type,{detail:detail}))}catch(_){}
}
function setSession(next){
  next=next&&typeof next==="object"?next:{};
  session.status=next.user?"authenticated":"anonymous";
  session.user=next.user&&typeof next.user==="object"?{
    id:String(next.user.id||""),
    displayName:String(next.user.displayName||""),
    avatarUrl:String(next.user.avatarUrl||"")
  }:null;
  session.provider=next.provider?String(next.provider):null;
  session.updatedAt=Date.now();
  saveSession();emit("account-changed",snapshot());return snapshot()
}
function signOutLocal(){
  session={status:"anonymous",user:null,provider:null,updatedAt:Date.now()};
  try{sessionStorage.removeItem(SESSION_KEY)}catch(_){}
  try{if(window.VocaDiveEntitlements)window.VocaDiveEntitlements.clear()}catch(_){}
  emit("account-changed",snapshot());return snapshot()
}
async function bootstrap(){
  var base=apiBase();
  if(!base)return {ok:false,reason:"api_not_configured",account:snapshot()};
  try{
    var res=await fetch(base+"/app/bootstrap",{
      method:"GET",
      credentials:"include",
      headers:{
        "Accept":"application/json",
        "X-VocaDive-Device":id(),
        "X-VocaDive-App-Version":VERSION
      }
    });
    if(!res.ok)throw new Error("HTTP "+res.status);
    var data=await res.json();
    if(data&&data.user)setSession({user:data.user,provider:data.provider||"server"});
    else if(data&&data.user===null)setSession({user:null,provider:null});
    if(data&&data.entitlements&&window.VocaDiveEntitlements){
      window.VocaDiveEntitlements.applyServerState(data.entitlements)
    }
    emit("bootstrap",data);
    return {ok:true,data:data,account:snapshot()}
  }catch(e){
    return {ok:false,reason:"network_error",message:String(e&&e.message||e),account:snapshot()}
  }
}
function syncEnvelope(namespace,payload,version){
  return {
    schema:1,
    namespace:String(namespace||"default"),
    version:Number(version)||1,
    deviceId:id(),
    clientUpdatedAt:new Date().toISOString(),
    payload:payload
  }
}
async function pushSync(namespace,payload,version){
  var base=apiBase();
  if(!base)return {ok:false,reason:"api_not_configured"};
  try{
    var res=await fetch(base+"/app/sync/"+encodeURIComponent(String(namespace||"default")),{
      method:"PUT",
      credentials:"include",
      headers:{
        "Content-Type":"application/json",
        "Accept":"application/json",
        "X-VocaDive-Device":id(),
        "X-VocaDive-App-Version":VERSION
      },
      body:JSON.stringify(syncEnvelope(namespace,payload,version))
    });
    var data=await res.json().catch(function(){return{}});
    return res.ok?{ok:true,data:data}:{ok:false,reason:"http_error",status:res.status,data:data}
  }catch(e){return {ok:false,reason:"network_error",message:String(e&&e.message||e)}}
}
async function pullSync(namespace){
  var base=apiBase();
  if(!base)return {ok:false,reason:"api_not_configured"};
  try{
    var res=await fetch(base+"/app/sync/"+encodeURIComponent(String(namespace||"default")),{
      method:"GET",
      credentials:"include",
      headers:{
        "Accept":"application/json",
        "X-VocaDive-Device":id(),
        "X-VocaDive-App-Version":VERSION
      }
    });
    var data=await res.json().catch(function(){return{}});
    return res.ok?{ok:true,data:data}:{ok:false,reason:"http_error",status:res.status,data:data}
  }catch(e){return {ok:false,reason:"network_error",message:String(e&&e.message||e)}}
}

loadSession();

window.VocaDiveAccount={
  version:VERSION,
  deviceId:id,
  snapshot:snapshot,
  apiBase:apiBase,
  setApiBase:setApiBase,
  setSession:setSession,
  signOutLocal:signOutLocal,
  bootstrap:bootstrap,
  sync:{envelope:syncEnvelope,push:pushSync,pull:pullSync}
};

setTimeout(function(){emit("account-ready",snapshot())},0);
})();
