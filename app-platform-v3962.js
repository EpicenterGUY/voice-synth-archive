/* VocaDive App Platform Foundation · v39.98.0 */
(function(){
"use strict";

var BUILD="39.98.0";
var listeners=new Map();

function cap(){
  try{return window.Capacitor||null}catch(_){return null}
}
function platform(){
  try{
    var c=cap();
    if(c&&typeof c.getPlatform==="function"){
      var p=c.getPlatform();
      if(p)return p
    }
  }catch(_){}
  try{
    if(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)return "pwa";
    if(window.navigator&&window.navigator.standalone)return "pwa"
  }catch(_){}
  return "web"
}
function isNative(){
  var p=platform();
  return p==="android"||p==="ios"
}
function plugin(name){
  try{
    var c=cap();
    return c&&c.Plugins&&c.Plugins[name]?c.Plugins[name]:null
  }catch(_){return null}
}
function emit(type,detail){
  var rows=listeners.get(type)||[];
  rows.slice().forEach(function(fn){try{fn(detail)}catch(_){}});
  try{window.dispatchEvent(new CustomEvent("vocadive:"+type,{detail:detail}))}catch(_){}
}
function on(type,fn){
  if(typeof fn!=="function")return function(){};
  var rows=listeners.get(type)||[];rows.push(fn);listeners.set(type,rows);
  return function(){var cur=listeners.get(type)||[];listeners.set(type,cur.filter(function(x){return x!==fn}))}
}
async function openExternal(url){
  url=String(url||"").trim();if(!/^https?:\/\//i.test(url))return false;
  var b=plugin("Browser");
  try{
    if(isNative()&&b&&typeof b.open==="function"){await b.open({url:url});return true}
  }catch(_){}
  try{window.open(url,"_blank","noopener,noreferrer");return true}catch(_){return false}
}
async function haptic(style){
  var h=plugin("Haptics");if(!isNative()||!h)return false;
  try{
    if(typeof h.impact==="function"){await h.impact({style:style||"Light"});return true}
  }catch(_){}
  return false
}
async function storageGet(key){
  key=String(key||"");if(!key)return null;
  var p=plugin("Preferences");
  try{
    if(isNative()&&p&&typeof p.get==="function"){
      var r=await p.get({key:key});return r&&typeof r.value==="string"?r.value:null
    }
  }catch(_){}
  try{return localStorage.getItem(key)}catch(_){return null}
}
async function storageSet(key,value){
  key=String(key||"");if(!key)return false;value=String(value==null?"":value);
  var p=plugin("Preferences");
  try{
    if(isNative()&&p&&typeof p.set==="function"){await p.set({key:key,value:value});return true}
  }catch(_){}
  try{localStorage.setItem(key,value);return true}catch(_){return false}
}
async function storageRemove(key){
  key=String(key||"");if(!key)return false;
  var p=plugin("Preferences");
  try{
    if(isNative()&&p&&typeof p.remove==="function"){await p.remove({key:key});return true}
  }catch(_){}
  try{localStorage.removeItem(key);return true}catch(_){return false}
}
function capabilities(){
  var p=platform(),native=isNative();
  return {
    build:BUILD,
    platform:p,
    native:native,
    installed:native||p==="pwa",
    billingBridge:false,
    accountBridge:false,
    cloudSyncBridge:false,
    appLifecycle:native&&!!plugin("App"),
    haptics:native&&!!plugin("Haptics"),
    externalBrowser:native&&!!plugin("Browser"),
    nativePreferences:native&&!!plugin("Preferences")
  }
}

var api={
  build:BUILD,
  platform:platform,
  isNative:isNative,
  isInstalled:function(){var p=platform();return isNative()||p==="pwa"},
  capabilities:capabilities,
  openExternal:openExternal,
  haptic:haptic,
  storage:{get:storageGet,set:storageSet,remove:storageRemove},
  on:on,
  emit:emit
};

window.VocaDivePlatform=api;
try{document.documentElement.dataset.vocadivePlatform=platform()}catch(_){}
setTimeout(function(){emit("platform-ready",capabilities())},0);
})();
