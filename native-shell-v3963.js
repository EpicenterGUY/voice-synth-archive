/* VocaDive Native Shell 0.1 · v39.88.0 */
(function(){
"use strict";

var VERSION="39.88.0";
var PLAYBACK_KEY="vocadive.native.playback.v1";
var ROUTE_KEY="vocadive.native.routes.v1";
var routeStack=["home"],suppressRoute=false,bound=false,lastBackgroundAt=0;

function platform(){
  try{return window.VocaDivePlatform&&VocaDivePlatform.platform?VocaDivePlatform.platform():"web"}catch(_){return"web"}
}
function isNative(){
  try{return window.VocaDivePlatform&&VocaDivePlatform.isNative&&VocaDivePlatform.isNative()}catch(_){return false}
}
function appPlugin(){
  try{return window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.App?Capacitor.Plugins.App:null}catch(_){return null}
}
function currentRoute(){return String(window.__VSA37_CURRENT_ROUTE||"home")}
function currentPlayer(){
  try{return window.VSANicoPlayer&&VSANicoPlayer.state?VSANicoPlayer.state():null}catch(_){return null}
}
function routeExists(route){
  if(route==="home")return true;
  try{return !!document.querySelector('#toolsModal [data-tool-view="'+CSS.escape(String(route))+'"]')}catch(_){return false}
}
function saveRoutes(){
  try{sessionStorage.setItem(ROUTE_KEY,JSON.stringify(routeStack.slice(-24)))}catch(_){}
}
function loadRoutes(){
  try{
    var x=JSON.parse(sessionStorage.getItem(ROUTE_KEY)||"null");
    if(Array.isArray(x)&&x.length)routeStack=x.map(String).filter(routeExists).slice(-24)
  }catch(_){}
  if(!routeStack.length)routeStack=["home"];
  var cur=currentRoute();
  if(routeStack[routeStack.length-1]!==cur)routeStack.push(cur)
}
function pushRoute(route){
  route=String(route||"home");
  if(suppressRoute)return;
  var last=routeStack[routeStack.length-1];
  if(last===route)return;
  routeStack.push(route);
  if(routeStack.length>24)routeStack=routeStack.slice(-24);
  saveRoutes()
}
function savePlayback(reason){
  try{
    var snap=window.VSANicoPlayer&&VSANicoPlayer.snapshot?VSANicoPlayer.snapshot():null;
    if(!snap&&currentRoute()==="songDetail39"){
      var song=window.__VSA39_DETAIL_SONG,inline=document.getElementById("v399InlineFrame");
      if(song&&song.contentId&&inline){
        var q=[{id:String(song.contentId),title:String(song.title||song.contentId)}];
        try{if(typeof window.watchQueue399==="function")q=window.watchQueue399(song)}catch(_){}
        snap={
          schema:1,currentId:String(song.contentId),currentTitle:String(song.title||song.contentId),
          queue:q,index:0,volume:100,playing:true,mini:false,inline:true,full:false,capturedAt:Date.now()
        }
      }
    }
    if(!snap){localStorage.removeItem(PLAYBACK_KEY);return false}
    snap.reason=String(reason||"lifecycle");
    snap.route=currentRoute();
    snap.savedAt=Date.now();
    localStorage.setItem(PLAYBACK_KEY,JSON.stringify(snap));
    return true
  }catch(_){return false}
}
function readPlayback(){
  try{
    var x=JSON.parse(localStorage.getItem(PLAYBACK_KEY)||"null");
    if(!x||!x.currentId)return null;
    var at=Number(x.savedAt||x.capturedAt)||0;
    if(!at||Date.now()-at>12*60*60*1000){localStorage.removeItem(PLAYBACK_KEY);return null}
    return x
  }catch(_){return null}
}
function ensurePlayer(){
  if(window.VSANicoPlayer)return Promise.resolve(true);
  if(window.VSAEnsureFeatures)return Promise.resolve(VSAEnsureFeatures("player")).then(function(){return !!window.VSANicoPlayer}).catch(function(){return false});
  return Promise.resolve(false)
}
async function restoreColdPlayback(){
  var snap=readPlayback(),ps=currentPlayer();
  if(!snap||(ps&&ps.currentId))return false;
  var ok=await ensurePlayer();if(!ok||!window.VSANicoPlayer||!VSANicoPlayer.restore)return false;
  try{
    // Cold start always restores paused to avoid surprise autoplay after process death.
    return !!VSANicoPlayer.restore(snap,{autoplay:false,surface:"mini"})
  }catch(_){return false}
}
function repairPlayback(reason){
  setTimeout(function(){
    try{
      if(currentRoute()==="songDetail39"&&typeof window.ensureWatch399==="function")window.ensureWatch399();
      else if(window.VSANicoPlayer&&VSANicoPlayer.syncSurface)VSANicoPlayer.syncSurface("native:"+String(reason||"resume"));
      else if(window.VSANicoPlayer&&VSANicoPlayer.ensureVisible)VSANicoPlayer.ensureVisible()
    }catch(_){}
  },90)
}
function minimizeRoot(){
  var app=appPlugin();
  savePlayback("root-back");
  if(app&&typeof app.minimizeApp==="function"){
    try{return Promise.resolve(app.minimizeApp()).then(function(){return true}).catch(function(){return false})}catch(_){}
  }
  return Promise.resolve(false)
}
function navigateRoute(route){
  route=String(route||"home");
  suppressRoute=true;
  try{
    if(route==="home"){
      if(typeof window.closeToolsModal==="function")window.closeToolsModal();
      else{
        var m=document.getElementById("toolsModal");if(m)m.hidden=true;
        window.__VSA37_CURRENT_ROUTE="home"
      }
    }else if(typeof window.openToolsModal==="function")window.openToolsModal(route);
    else if(typeof window.setToolView==="function")window.setToolView(route)
  }catch(_){}
  setTimeout(function(){suppressRoute=false},40)
}
function previousRoute(){
  var cur=currentRoute();
  while(routeStack.length&&routeStack[routeStack.length-1]===cur)routeStack.pop();
  while(routeStack.length){
    var prev=routeStack.pop();
    if(routeExists(prev)){saveRoutes();return prev}
  }
  routeStack=["home"];saveRoutes();return"home"
}
async function handleBack(){
  var p=currentPlayer();
  try{
    if(p&&p.full&&window.VSANicoPlayer&&VSANicoPlayer.collapse){VSANicoPlayer.collapse();return true}
  }catch(_){}
  var cur=currentRoute();
  if(cur!=="home"){
    var prev=previousRoute();
    navigateRoute(prev);
    try{window.VocaDivePlatform&&VocaDivePlatform.haptic&&VocaDivePlatform.haptic("Light")}catch(_){}
    return true
  }
  return await minimizeRoot()
}
function onBackground(){
  lastBackgroundAt=Date.now();
  var handoff=null;
  try{
    if(currentRoute()==="songDetail39"&&typeof window.handoffWatchToMini399==="function")handoff=window.handoffWatchToMini399()
  }catch(_){}
  savePlayback("background");
  if(handoff&&typeof handoff.finally==="function")handoff.finally(function(){savePlayback("background-handoff")});
  try{document.documentElement.dataset.vocadiveAppState="background"}catch(_){}
}
function onForeground(){
  try{document.documentElement.dataset.vocadiveAppState="active"}catch(_){}
  var away=lastBackgroundAt?Date.now()-lastBackgroundAt:0;
  repairPlayback(away>30000?"resume-long":"resume");
  try{window.dispatchEvent(new CustomEvent("vocadive:native-resume",{detail:{awayMs:away,route:currentRoute()}}))}catch(_){}
}
function bindNative(){
  if(bound||!isNative())return false;
  var app=appPlugin();if(!app||typeof app.addListener!=="function")return false;
  bound=true;
  try{document.documentElement.classList.add("vocadive-native");document.body&&document.body.classList.add("vocadive-native")}catch(_){}
  try{
    app.addListener("backButton",function(){handleBack()});
    app.addListener("appStateChange",function(s){if(s&&s.isActive)onForeground();else onBackground()});
    app.addListener("pause",onBackground);
    app.addListener("resume",onForeground)
  }catch(_){}
  return true
}
function installNativeStyle(){
  if(document.getElementById("v3963NativeStyle"))return;
  var s=document.createElement("style");s.id="v3963NativeStyle";
  s.textContent=[
    "html.vocadive-native{overscroll-behavior:none;background:#041115}",
    "html.vocadive-native body{min-height:100dvh;overscroll-behavior-y:none}",
    "html.vocadive-native body.v37-ready>.app>.topbar{padding-top:calc(8px + env(safe-area-inset-top))!important}",
    "html.vocadive-native .v331-player{padding-top:calc(18px + env(safe-area-inset-top));padding-bottom:calc(18px + env(safe-area-inset-bottom))}",
    "html.vocadive-native .v331-mini{bottom:calc(76px + env(safe-area-inset-bottom))!important}",
    "html.vocadive-native[data-vocadive-app-state=background] body{pointer-events:none}"
  ].join("");
  document.head.appendChild(s)
}
function boot(){
  installNativeStyle();
  loadRoutes();
  window.addEventListener("vsa:route-change",function(e){
    var r=e&&e.detail&&e.detail.route?String(e.detail.route):currentRoute();
    pushRoute(r)
  });
  window.addEventListener("pagehide",function(){savePlayback("pagehide")});
  document.addEventListener("visibilitychange",function(){
    if(document.hidden)savePlayback("hidden");
    else repairPlayback("visible")
  });
  bindNative();
  if(isNative())setTimeout(restoreColdPlayback,650);
  try{document.documentElement.dataset.vocadiveShell=VERSION}catch(_){}
  try{window.dispatchEvent(new CustomEvent("vocadive:native-shell-ready",{detail:{version:VERSION,platform:platform(),native:isNative()}}))}catch(_){}
}

window.VocaDiveNativeShell={
  version:VERSION,
  isNative:isNative,
  routes:function(){return routeStack.slice()},
  currentRoute:currentRoute,
  savePlayback:savePlayback,
  restorePlayback:restoreColdPlayback,
  handleBack:handleBack,
  repairPlayback:repairPlayback
};

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
