/* VocaDive in-app Nico player v39.24 · Playback 2.2 */
(function(){
"use strict";
var modal=null,mini=null,frame=null,fullStage=null,miniStage=null,currentId="",currentTitle="",pushed=false,queue=[],queueIndex=-1,autoNext=true,pipWindow=null,pipClosing=false,lastPlayerStatus=0,maxVolume=true,volumeAppliedFor="";
var PLAYER_ID="vsaPlayer",NICO_ORIGIN="https://embed.nicovideo.jp",MAX_VOLUME_KEY="vsa.player.maxVolume";
try{autoNext=localStorage.getItem("vsa.player.autoNext")!=="0";maxVolume=localStorage.getItem(MAX_VOLUME_KEY)!=="0"}catch(e){}

function videoIdFromUrl(url){
  try{var u=new URL(url,location.href);if(!/(\.|^)nicovideo\.jp$/i.test(u.hostname))return"";var m=u.pathname.match(/\/watch\/([^/?#]+)/);return m?decodeURIComponent(m[1]):""}catch(e){return""}
}
function findSong(id,anchor){
  if(anchor){
    var card=anchor.closest(".v28-card,.song,.us-result,.v331-song");
    var t=card&&card.querySelector(".v28-title,.song-title,.us-copy b,.v331-song b");
    var img=card&&card.querySelector("img");
    if(t)return{title:t.textContent.trim()||id,thumb:img&&img.src||""};
  }
  try{
    var groups=[state.songs,state.tasteSongs,state.guideSongs,state.hiddenGems,state.hiddenGemPool,state.detectiveCandidates];
    for(var g=0;g<groups.length;g++){var a=groups[g];if(!Array.isArray(a))continue;for(var i=0;i<a.length;i++){var s=a[i]&&a[i].song?a[i].song:a[i];if(s&&s.contentId===id)return{title:s.title||id,thumb:s.thumbnailUrl||""}}}
  }catch(e){}
  return{title:id,thumb:""};
}
function addStyle(){
  if(document.getElementById("v331PlayerStyle"))return;
  var s=document.createElement("style");s.id="v331PlayerStyle";s.textContent=[
    ".v331-player[hidden],.v331-mini[hidden]{display:none!important}",
    ".v331-player{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:18px;background:rgba(0,7,10,.84);backdrop-filter:blur(14px)}",
    ".v331-player-shell{width:min(980px,96vw);max-height:94dvh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;border:1px solid #28545b;border-radius:20px;overflow:hidden;background:#06161b;box-shadow:0 30px 100px #000d}",
    ".v331-player-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #17383e;background:#092128}.v331-player-head>div{min-width:0;flex:1}.v331-player-head small{display:block;font-size:7px;font-weight:950;letter-spacing:.12em;color:#70d9d0}.v331-player-head b{display:block;margin-top:2px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v331-player-head button{width:38px;height:38px;border:1px solid #2a555c;border-radius:11px;background:#0b2930;color:#dff7f3;font-size:17px}.v331-player-head #v3921PipFull,.v331-player-head #v3923VolumeFull{font-size:9px;font-weight:950;letter-spacing:.03em}.v331-player-head #v3923VolumeFull.active{border-color:#54bdb4;background:#17464c;color:#effffb}",
    ".v331-player-stage{position:relative;aspect-ratio:16/9;background:#000;min-height:220px}.v331-player-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}",
    ".v331-player-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 11px;background:#071b20;border-top:1px solid #17383e}.v331-player-foot span{min-width:0;font-size:8px;color:#739794;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v331-player-foot a{flex:0 0 auto;min-height:34px;display:inline-flex;align-items:center;padding:0 10px;border:1px solid #2a565d;border-radius:10px;background:#0c2b31;color:#cde9e5;text-decoration:none;font-size:8px;font-weight:900}",
    ".v331-mini{position:fixed;left:50%;bottom:calc(74px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:22000;width:min(720px,calc(100vw - 16px));height:70px;display:grid;grid-template-columns:108px minmax(0,1fr) auto auto auto auto auto auto;align-items:center;gap:6px;padding:7px;border:1px solid #2a555c;border-radius:15px;background:rgba(6,24,29,.97);box-shadow:0 18px 60px #000c;backdrop-filter:blur(20px)}",
    ".v331-mini-stage{width:108px;aspect-ratio:16/9;overflow:hidden;border-radius:9px;background:#000;pointer-events:none}.v331-mini-stage iframe{width:100%;height:100%;border:0}",
    ".v331-mini-copy{min-width:0}.v331-mini-copy b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v331-mini-copy small{display:block;margin-top:3px;font-size:7px;color:#6d928e}.v331-mini button{width:34px;height:34px;border:1px solid #2b565d;border-radius:10px;background:#0b2930;color:#dff7f3;font-size:15px}.v331-mini #v3924VolumeMini{font-size:11px;font-weight:950}.v331-mini #v3924VolumeMini.active{border-color:#54bdb4;background:#17464c;color:#effffb}.v331-player button[hidden],.v331-mini button[hidden]{display:none!important}",
    "body.v331-player-open{overflow:hidden!important}body.v331-player-open .v33-dock{display:none!important}",
    "body[data-vsa-theme='light'] .v331-player-shell,body[data-vsa-theme='light'] .v331-mini{background:rgba(249,253,252,.98);border-color:#bdd8d4;color:#17312f}body[data-vsa-theme='light'] .v331-player-head,body[data-vsa-theme='light'] .v331-player-foot{background:#eef7f5;border-color:#cfe3df}body[data-vsa-theme='light'] .v331-player-head button,body[data-vsa-theme='light'] .v331-mini button{background:#fff;border-color:#c4ddd8;color:#234744}body[data-vsa-theme='light'] .v331-mini-copy small,body[data-vsa-theme='light'] .v331-player-foot span{color:#67827e}",
    "@media(min-width:900px){.v331-mini{bottom:16px}}",
    "@media(max-width:699px){.v331-player{padding:0;place-items:stretch}.v331-player-shell{width:100vw;height:100dvh;max-height:none;border:0;border-radius:0;grid-template-rows:auto auto 1fr}.v331-player-stage{aspect-ratio:16/9;min-height:0}.v331-player-foot{align-self:end}.v331-player-head{padding-top:max(9px,env(safe-area-inset-top))}.v331-player-head .v332-queue-nav{display:none}.v331-mini{left:10px;right:10px;bottom:calc(78px + env(safe-area-inset-bottom));transform:none;width:auto;height:58px;grid-template-columns:64px minmax(0,1fr) auto auto auto auto;gap:5px;padding:5px 6px;border-radius:13px}.v331-mini-stage{width:64px;border-radius:8px}.v331-mini-copy b{font-size:8px}.v331-mini-copy small{font-size:6.5px}.v331-mini #v332PrevMini,.v331-mini #v332NextMini{display:none}.v331-mini button{width:30px;height:30px;font-size:12px}.v331-mini #v3924VolumeMini{display:grid!important}}"
  ].join("");document.head.appendChild(s);
}
function sendNico(eventName,data){
  if(!frame||!frame.contentWindow||!currentId)return;
  try{frame.contentWindow.postMessage({sourceConnectorType:1,playerId:PLAYER_ID,eventName:eventName,data:data||{}},NICO_ORIGIN)}catch(e){}
}
function updateVolumeUi(){
  var on=maxVolume;
  var full=document.getElementById("v3923VolumeFull");
  if(full){
    full.classList.toggle("active",on);
    full.textContent=on?"MAX":"VOL";
    full.title=on?"니코니코 플레이어 내부 음량 100% · 누르면 해제":"플레이어 내부 최대 음량 사용";
    full.setAttribute("aria-pressed",on?"true":"false")
  }
  var miniBtn=document.getElementById("v3924VolumeMini");
  if(miniBtn){
    miniBtn.classList.toggle("active",on);
    miniBtn.textContent=on?"🔊":"🔉";
    miniBtn.title=on?"음량 MAX 켜짐 · 누르면 해제":"음량 MAX 켜기";
    miniBtn.setAttribute("aria-label",on?"음량 MAX 켜짐":"음량 MAX 꺼짐");
    miniBtn.setAttribute("aria-pressed",on?"true":"false")
  }
}
function applyPlayerVolume(force){
  if(!maxVolume||!currentId)return;
  if(!force&&volumeAppliedFor===currentId)return;
  sendNico("volumeChange",{volume:1});
  volumeAppliedFor=currentId
}
function setMaxVolume(on){
  maxVolume=!!on;volumeAppliedFor="";
  try{localStorage.setItem(MAX_VOLUME_KEY,maxVolume?"1":"0")}catch(e){}
  updateVolumeUi();
  if(maxVolume){
    applyPlayerVolume(true);
    setTimeout(function(){applyPlayerVolume(true)},450)
  }
  try{toast(maxVolume?"음량 MAX · 니코 플레이어 100%":"음량 MAX 해제")}catch(_){}
  updateQueueUi()
}
function syncMediaSession(){
  if(!("mediaSession" in navigator)||!currentId)return;
  try{
    var info=findSong(currentId),art=info&&info.thumb?[{src:info.thumb,sizes:"512x512"}]:undefined;
    navigator.mediaSession.metadata=new MediaMetadata({title:currentTitle||currentId,artist:"VocaDive · 니코니코",album:"VocaDive",artwork:art});
  }catch(e){
    try{navigator.mediaSession.metadata=new MediaMetadata({title:currentTitle||currentId,artist:"VocaDive · 니코니코"})}catch(_){}
  }
}
function setMediaPlaybackState(v){try{if("mediaSession" in navigator)navigator.mediaSession.playbackState=v}catch(e){}}
function setMediaPosition(data){
  if(!("mediaSession" in navigator)||!navigator.mediaSession.setPositionState)return;
  var d=Number(data&&data.duration),p=Number(data&&data.currentTime);
  if(Number.isFinite(d)&&d>0&&Number.isFinite(p)&&p>=0){
    try{navigator.mediaSession.setPositionState({duration:d,playbackRate:1,position:Math.min(p,d)})}catch(e){}
  }
}
function initMediaSession(){
  if(!("mediaSession" in navigator))return;
  try{navigator.mediaSession.setActionHandler("play",function(){sendNico("play")})}catch(e){}
  try{navigator.mediaSession.setActionHandler("pause",function(){sendNico("pause")})}catch(e){}
  try{navigator.mediaSession.setActionHandler("nexttrack",function(){playRelative(1)})}catch(e){}
  try{navigator.mediaSession.setActionHandler("previoustrack",function(){playRelative(-1)})}catch(e){}
}
function handleNicoMessage(e){
  if(e.origin!==NICO_ORIGIN||!frame||e.source!==frame.contentWindow)return;
  var msg=e.data||{};if(msg.playerId!==PLAYER_ID)return;
  var data=msg.data||{};
  if(msg.eventName==="playerMetadataChange"){
    setMediaPosition(data);
    if(maxVolume&&volumeAppliedFor!==currentId&&data.volume!==undefined)applyPlayerVolume(true);
    return
  }
  if(msg.eventName==="loadComplete"){
    syncMediaSession();volumeAppliedFor="";
    setTimeout(function(){applyPlayerVolume(true)},80);
    setTimeout(function(){applyPlayerVolume(true)},650);
    return
  }
  if(msg.eventName!=="playerStatusChange")return;
  lastPlayerStatus=Number(data.playerStatus)||0;
  if(lastPlayerStatus===2)setMediaPlaybackState("playing");
  else if(lastPlayerStatus===3)setMediaPlaybackState("paused");
  else if(lastPlayerStatus===4){
    setMediaPlaybackState("none");
    var endedId=currentId;
    if(autoNext&&queueIndex>=0&&queueIndex<queue.length-1)setTimeout(function(){
      if(currentId===endedId&&lastPlayerStatus===4)playRelative(1)
    },220)
  }
}
function canDocumentPip(){return !!(window.documentPictureInPicture&&window.documentPictureInPicture.requestWindow)}
function syncPipButtons(){
  ["v3921PipFull","v3921PipMini"].forEach(function(id){var b=document.getElementById(id);if(b)b.hidden=!canDocumentPip()})
}
function restoreFromPip(showMini){
  try{if(frame&&frame.ownerDocument!==document&&miniStage)miniStage.appendChild(frame)}catch(e){}
  pipWindow=null;
  if(showMini&&currentId&&mini){modal.hidden=true;mini.hidden=false;document.body.classList.remove("v331-player-open")}
}
async function openPictureInPicture(e){
  if(e&&e.stopPropagation)e.stopPropagation();
  if(!currentId||!canDocumentPip()){
    try{toast("이 브라우저는 웹앱 작은 창(PiP)을 지원하지 않습니다. 니코 플레이어의 PiP 버튼을 이용해 주세요.")}catch(_){}
    return;
  }
  if(pipWindow&&!pipWindow.closed)return;
  try{
    pipClosing=false;
    var w=await window.documentPictureInPicture.requestWindow({width:480,height:300});
    pipWindow=w;
    var st=w.document.createElement("style");
    st.textContent="html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}#vsaPipHost{width:100%;height:100%}#vsaPipHost iframe{width:100%;height:100%;border:0}";
    w.document.head.appendChild(st);
    var host=w.document.createElement("div");host.id="vsaPipHost";w.document.body.appendChild(host);host.appendChild(frame);
    modal.hidden=true;mini.hidden=true;document.body.classList.remove("v331-player-open");
    w.addEventListener("message",handleNicoMessage);
    w.addEventListener("pagehide",function(){restoreFromPip(!pipClosing)},{once:true});
  }catch(err){
    pipWindow=null;
    try{toast("작은 창을 열지 못했습니다. 니코 플레이어의 PiP 버튼을 이용해 주세요.")}catch(_){}
  }
}

function build(){
  if(modal)return;addStyle();
  frame=createFrame32();
  modal=document.createElement("div");modal.className="v331-player";modal.hidden=true;modal.innerHTML='<div class="v331-player-shell" role="dialog" aria-modal="true" aria-label="앱 내부 니코니코 플레이어"><div class="v331-player-head"><div><small>NOW PLAYING</small><b id="v331PlayerTitle">재생 준비</b></div><div class="v332-queue-nav"><button type="button" id="v332PrevFull" aria-label="이전 곡">‹</button><button type="button" id="v332NextFull" aria-label="다음 곡">›</button></div><button type="button" id="v3923VolumeFull" aria-label="플레이어 최대 음량" aria-pressed="true" title="플레이어 최대 음량">MAX</button><button type="button" id="v3921PipFull" aria-label="작은 창으로 보기" title="작은 창" hidden>PiP</button><button type="button" id="v331Collapse" aria-label="미니 플레이어로">—</button><button type="button" id="v331Close" aria-label="닫기">×</button></div><div class="v331-player-stage" id="v331FullStage"></div><div class="v331-player-foot"><span id="v331PlayerMeta">백그라운드 재생 · 자동 다음곡</span><a id="v331External" href="#" target="_blank" rel="noopener">니코동에서 열기 ↗</a></div></div>';
  mini=document.createElement("div");mini.className="v331-mini";mini.hidden=true;mini.innerHTML='<div class="v331-mini-stage" id="v331MiniStage"></div><div class="v331-mini-copy"><b id="v331MiniTitle">재생 중</b><small id="v332MiniMeta">백그라운드 재생 · 자동 다음곡</small></div><button type="button" id="v332PrevMini" aria-label="이전 곡">‹</button><button type="button" id="v332NextMini" aria-label="다음 곡">›</button><button type="button" id="v3924VolumeMini" aria-label="음량 MAX 켜짐" aria-pressed="true" title="음량 MAX">🔊</button><button type="button" id="v3921PipMini" aria-label="작은 창으로 보기" title="작은 창" hidden>▣</button><button type="button" id="v331Expand" aria-label="펼치기">⌃</button><button type="button" id="v331MiniClose" aria-label="닫기">×</button>';
  document.body.appendChild(modal);document.body.appendChild(mini);fullStage=document.getElementById("v331FullStage");miniStage=document.getElementById("v331MiniStage");fullStage.appendChild(frame);
  document.getElementById("v331Close").onclick=function(){closePlayer(true)};document.getElementById("v331Collapse").onclick=function(){collapsePlayer()};document.getElementById("v331Expand").onclick=function(){expandPlayer()};document.getElementById("v331MiniClose").onclick=function(e){e.stopPropagation();closePlayer(true)};document.getElementById("v332PrevFull").onclick=function(){playRelative(-1)};document.getElementById("v332NextFull").onclick=function(){playRelative(1)};document.getElementById("v332PrevMini").onclick=function(e){e.stopPropagation();playRelative(-1)};document.getElementById("v332NextMini").onclick=function(e){e.stopPropagation();playRelative(1)};document.getElementById("v3923VolumeFull").onclick=function(){setMaxVolume(!maxVolume)};document.getElementById("v3924VolumeMini").onclick=function(e){e.stopPropagation();setMaxVolume(!maxVolume)};document.getElementById("v3921PipFull").onclick=openPictureInPicture;document.getElementById("v3921PipMini").onclick=openPictureInPicture;mini.addEventListener("click",function(e){if(!e.target.closest("button"))expandPlayer()});modal.addEventListener("click",function(e){if(e.target===modal)collapsePlayer()});document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(!modal.hidden)collapsePlayer();else if(!mini.hidden)closePlayer(true)}});window.addEventListener("popstate",function(){if(!modal.hidden||!mini.hidden)closePlayer(false)});window.addEventListener("message",handleNicoMessage);initMediaSession();syncPipButtons();updateVolumeUi();
}
function normalizeQueue(items){
  var seen=new Set(),out=[];
  (items||[]).forEach(function(x){
    if(!x)return;
    var id=typeof x==="string"?x:x.id||x.contentId;
    if(!id||seen.has(id))return;
    seen.add(id);
    out.push({id:id,title:typeof x==="string"?id:(x.title||id)});
  });
  return out;
}
function queueFromAnchor(anchor,id,title){
  var container=anchor&&anchor.closest(".v28-cards,.v331-songgrid,.v332-feed-grid,.v332-lib-grid,.v22-card-grid,.list,.us-results");
  if(!container)return[{id:id,title:title||id}];
  var out=[];
  container.querySelectorAll('a[href*="nicovideo.jp/watch/"]').forEach(function(a){
    var qid=videoIdFromUrl(a.href);if(!qid)return;
    var info=findSong(qid,a);
    out.push({id:qid,title:info.title||qid});
  });
  out=normalizeQueue(out);
  if(!out.some(function(x){return x.id===id}))out.unshift({id:id,title:title||id});
  return out;
}
function markPlaying(){
  document.querySelectorAll(".v332-playing").forEach(function(x){x.classList.remove("v332-playing")});
  if(!currentId)return;
  document.querySelectorAll('a[href*="nicovideo.jp/watch/'+CSS.escape(currentId)+'"]').forEach(function(a){
    var card=a.closest(".v28-card,.v331-song,.v22-song-card,.song,.us-result");
    if(card)card.classList.add("v332-playing");
  });
}
function updateQueueUi(){
  var prev=queueIndex>0,next=queueIndex>=0&&queueIndex<queue.length-1;
  ["v332PrevFull","v332PrevMini"].forEach(function(id){var b=document.getElementById(id);if(b)b.disabled=!prev});
  ["v332NextFull","v332NextMini"].forEach(function(id){var b=document.getElementById(id);if(b)b.disabled=!next});
  var m=document.getElementById("v332MiniMeta");
  if(m)m.textContent=queue.length>1?(queueIndex+1)+" / "+queue.length+" · 자동 다음곡"+(maxVolume?" · MAX":""):"백그라운드 재생 · 자동 다음곡"+(maxVolume?" · 음량 MAX":"");
}
function createFrame32(){
  var f=document.createElement("iframe");
  f.allow="autoplay; fullscreen; picture-in-picture; encrypted-media";
  f.allowFullscreen=true;
  f.referrerPolicy="strict-origin-when-cross-origin";
  return f
}
function stopFrame32(){
  if(!frame)return;
  sendNico("pause");
  try{frame.src="about:blank"}catch(e){}
  try{frame.remove()}catch(e){}
  frame=createFrame32();
  if(fullStage)fullStage.appendChild(frame)
}
function loadCurrent(id,title,keepQueue){
  if(!id)return;
  currentId=id;currentTitle=title||id;
  if(!keepQueue){queue=[{id:id,title:currentTitle}];queueIndex=0}
  document.getElementById("v331PlayerTitle").textContent=currentTitle;
  document.getElementById("v331MiniTitle").textContent=currentTitle;
  document.getElementById("v331PlayerMeta").textContent=id+" · 백그라운드 재생 · 자동 다음곡"+(maxVolume?" · 음량 MAX":"");
  document.getElementById("v331External").href="https://www.nicovideo.jp/watch/"+encodeURIComponent(id);
  lastPlayerStatus=1;volumeAppliedFor="";frame.src=NICO_ORIGIN+"/watch/"+encodeURIComponent(id)+"?jsapi=1&playerId="+encodeURIComponent(PLAYER_ID)+"&autoplay=1";syncMediaSession();
  updateQueueUi();setTimeout(markPlaying,0);
}
function setQueue(items,current){
  queue=normalizeQueue(items);
  if(!queue.length&&current)queue=[{id:current,title:current}];
  queueIndex=Math.max(0,queue.findIndex(function(x){return x.id===current}));
  updateQueueUi();
}
function playRelative(delta){
  var next=queueIndex+delta;if(next<0||next>=queue.length)return;
  queueIndex=next;var item=queue[next];loadCurrent(item.id,item.title,true);
}
function openPlayer(id,title,items){
  build();if(!id)return;
  if(items&&items.length)setQueue(items,id);else if(!queue.length||!queue.some(function(x){return x.id===id}))setQueue([{id:id,title:title||id}],id);else queueIndex=queue.findIndex(function(x){return x.id===id});
  if(frame.parentNode!==fullStage)fullStage.appendChild(frame);
  loadCurrent(id,title||((queue[queueIndex]||{}).title)||id,true);
  mini.hidden=true;modal.hidden=false;document.body.classList.add("v331-player-open");
  if(!pushed){try{history.pushState({vsaPlayer:true},"",location.href);pushed=true}catch(e){}}
}
function openMiniPlayer(id,title,items){
  openPlayer(id,title,items);
  setTimeout(function(){if(modal&&!modal.hidden)collapsePlayer()},0)
}
function collapsePlayer(){if(!modal||modal.hidden)return;if(pipWindow&&!pipWindow.closed)return;if(frame.parentNode!==miniStage)miniStage.appendChild(frame);modal.hidden=true;mini.hidden=false;document.body.classList.remove("v331-player-open")}
function expandPlayer(){if(!mini||mini.hidden)return;if(pipWindow&&!pipWindow.closed)return;if(frame.parentNode!==fullStage)fullStage.appendChild(frame);mini.hidden=true;modal.hidden=false;document.body.classList.add("v331-player-open")}
function closePlayer(back){
  if(!modal)return;
  pipClosing=true;try{if(pipWindow&&!pipWindow.closed)pipWindow.close()}catch(e){}restoreFromPip(false);pipClosing=false;
  modal.hidden=true;mini.hidden=true;document.body.classList.remove("v331-player-open");
  stopFrame32();
  currentId="";currentTitle="";queue=[];queueIndex=-1;lastPlayerStatus=0;setMediaPlaybackState("none");try{if("mediaSession" in navigator)navigator.mediaSession.metadata=null}catch(e){}markPlaying();
  if(back&&pushed){pushed=false;try{history.back()}catch(e){}}else pushed=false;
}
function intercept(){
  document.addEventListener("click",function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href*="nicovideo.jp/watch/"]');if(!a||a.id==="v331External"||a.dataset.external==="1")return;
    var id=videoIdFromUrl(a.href);if(!id)return;var info=findSong(id,a),items=queueFromAnchor(a,id,info.title);e.preventDefault();e.stopPropagation();openPlayer(id,info.title,items);
  },true);
}
function boot(){build();intercept();window.VSANicoPlayer={open:openPlayer,openMini:openMiniPlayer,close:function(){closePlayer(true)},collapse:collapsePlayer,expand:expandPlayer,setQueue:setQueue,next:function(){playRelative(1)},prev:function(){playRelative(-1)},setMaxVolume:setMaxVolume,state:function(){return{currentId:currentId,queue:queue.slice(),index:queueIndex,maxVolume:maxVolume}}}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();