/* Voca Support in-app Nico player v33.1 */
(function(){
"use strict";
var modal=null,mini=null,frame=null,fullStage=null,miniStage=null,currentId="",currentTitle="",pushed=false,queue=[],queueIndex=-1;

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
    ".v331-player-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #17383e;background:#092128}.v331-player-head>div{min-width:0;flex:1}.v331-player-head small{display:block;font-size:7px;font-weight:950;letter-spacing:.12em;color:#70d9d0}.v331-player-head b{display:block;margin-top:2px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v331-player-head button{width:38px;height:38px;border:1px solid #2a555c;border-radius:11px;background:#0b2930;color:#dff7f3;font-size:17px}",
    ".v331-player-stage{position:relative;aspect-ratio:16/9;background:#000;min-height:220px}.v331-player-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}",
    ".v331-player-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 11px;background:#071b20;border-top:1px solid #17383e}.v331-player-foot span{min-width:0;font-size:8px;color:#739794;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v331-player-foot a{flex:0 0 auto;min-height:34px;display:inline-flex;align-items:center;padding:0 10px;border:1px solid #2a565d;border-radius:10px;background:#0c2b31;color:#cde9e5;text-decoration:none;font-size:8px;font-weight:900}",
    ".v331-mini{position:fixed;left:50%;bottom:calc(74px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:22000;width:min(680px,calc(100vw - 16px));height:70px;display:grid;grid-template-columns:108px minmax(0,1fr) auto auto auto auto;align-items:center;gap:6px;padding:7px;border:1px solid #2a555c;border-radius:15px;background:rgba(6,24,29,.97);box-shadow:0 18px 60px #000c;backdrop-filter:blur(20px)}",
    ".v331-mini-stage{width:108px;aspect-ratio:16/9;overflow:hidden;border-radius:9px;background:#000;pointer-events:none}.v331-mini-stage iframe{width:100%;height:100%;border:0}",
    ".v331-mini-copy{min-width:0}.v331-mini-copy b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v331-mini-copy small{display:block;margin-top:3px;font-size:7px;color:#6d928e}.v331-mini button{width:34px;height:34px;border:1px solid #2b565d;border-radius:10px;background:#0b2930;color:#dff7f3;font-size:15px}",
    "body.v331-player-open{overflow:hidden!important}body.v331-player-open .v33-dock{display:none!important}",
    "@media(min-width:900px){.v331-mini{bottom:16px}}",
    "@media(max-width:699px){.v331-player{padding:0;place-items:stretch}.v331-player-shell{width:100vw;height:100dvh;max-height:none;border:0;border-radius:0;grid-template-rows:auto auto 1fr}.v331-player-stage{aspect-ratio:16/9;min-height:0}.v331-player-foot{align-self:end}.v331-player-head{padding-top:max(9px,env(safe-area-inset-top))}.v331-player-head .v332-queue-nav{display:none}.v331-mini{height:66px;grid-template-columns:78px minmax(0,1fr) auto auto auto auto}.v331-mini-stage{width:78px}.v331-mini button{width:30px;height:30px;font-size:13px}}"
  ].join("");document.head.appendChild(s);
}
function build(){
  if(modal)return;addStyle();
  frame=document.createElement("iframe");frame.allow="autoplay; fullscreen; picture-in-picture; encrypted-media";frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";
  modal=document.createElement("div");modal.className="v331-player";modal.hidden=true;modal.innerHTML='<div class="v331-player-shell" role="dialog" aria-modal="true" aria-label="앱 내부 니코니코 플레이어"><div class="v331-player-head"><div><small>NOW PLAYING</small><b id="v331PlayerTitle">재생 준비</b></div><div class="v332-queue-nav"><button type="button" id="v332PrevFull" aria-label="이전 곡">‹</button><button type="button" id="v332NextFull" aria-label="다음 곡">›</button></div><button type="button" id="v331Collapse" aria-label="미니 플레이어로">—</button><button type="button" id="v331Close" aria-label="닫기">×</button></div><div class="v331-player-stage" id="v331FullStage"></div><div class="v331-player-foot"><span id="v331PlayerMeta">니코니코 임베드 플레이어</span><a id="v331External" href="#" target="_blank" rel="noopener">니코동에서 열기 ↗</a></div></div>';
  mini=document.createElement("div");mini.className="v331-mini";mini.hidden=true;mini.innerHTML='<div class="v331-mini-stage" id="v331MiniStage"></div><div class="v331-mini-copy"><b id="v331MiniTitle">재생 중</b><small id="v332MiniMeta">탭해서 플레이어 열기</small></div><button type="button" id="v332PrevMini" aria-label="이전 곡">‹</button><button type="button" id="v332NextMini" aria-label="다음 곡">›</button><button type="button" id="v331Expand" aria-label="펼치기">⌃</button><button type="button" id="v331MiniClose" aria-label="닫기">×</button>';
  document.body.appendChild(modal);document.body.appendChild(mini);fullStage=document.getElementById("v331FullStage");miniStage=document.getElementById("v331MiniStage");fullStage.appendChild(frame);
  document.getElementById("v331Close").onclick=function(){closePlayer(true)};document.getElementById("v331Collapse").onclick=function(){collapsePlayer()};document.getElementById("v331Expand").onclick=function(){expandPlayer()};document.getElementById("v331MiniClose").onclick=function(e){e.stopPropagation();closePlayer(true)};document.getElementById("v332PrevFull").onclick=function(){playRelative(-1)};document.getElementById("v332NextFull").onclick=function(){playRelative(1)};document.getElementById("v332PrevMini").onclick=function(e){e.stopPropagation();playRelative(-1)};document.getElementById("v332NextMini").onclick=function(e){e.stopPropagation();playRelative(1)};mini.addEventListener("click",function(e){if(!e.target.closest("button"))expandPlayer()});modal.addEventListener("click",function(e){if(e.target===modal)collapsePlayer()});document.addEventListener("keydown",function(e){if(e.key==="Escape"){if(!modal.hidden)collapsePlayer();else if(!mini.hidden)closePlayer(true)}});window.addEventListener("popstate",function(){if(!modal.hidden||!mini.hidden)closePlayer(false)});
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
  var container=anchor&&anchor.closest(".v28-cards,.v331-songgrid,.v22-card-grid,.list,.us-results");
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
  if(m)m.textContent=queue.length>1?(queueIndex+1)+" / "+queue.length+" · 탭해서 펼치기":"탭해서 플레이어 열기";
}
function loadCurrent(id,title,keepQueue){
  if(!id)return;
  currentId=id;currentTitle=title||id;
  if(!keepQueue){queue=[{id:id,title:currentTitle}];queueIndex=0}
  document.getElementById("v331PlayerTitle").textContent=currentTitle;
  document.getElementById("v331MiniTitle").textContent=currentTitle;
  document.getElementById("v331PlayerMeta").textContent=id+" · 앱 내부 재생";
  document.getElementById("v331External").href="https://www.nicovideo.jp/watch/"+encodeURIComponent(id);
  frame.src="https://embed.nicovideo.jp/watch/"+encodeURIComponent(id)+"?jsapi=1&playerId=vsaPlayer";
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
function collapsePlayer(){if(!modal||modal.hidden)return;if(frame.parentNode!==miniStage)miniStage.appendChild(frame);modal.hidden=true;mini.hidden=false;document.body.classList.remove("v331-player-open")}
function expandPlayer(){if(!mini||mini.hidden)return;if(frame.parentNode!==fullStage)fullStage.appendChild(frame);mini.hidden=true;modal.hidden=false;document.body.classList.add("v331-player-open")}
function closePlayer(back){
  if(!modal)return;modal.hidden=true;mini.hidden=true;document.body.classList.remove("v331-player-open");frame.src="about:blank";currentId="";currentTitle="";queue=[];queueIndex=-1;markPlaying();
  if(back&&pushed){pushed=false;try{history.back()}catch(e){}}else pushed=false;
}
function intercept(){
  document.addEventListener("click",function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href*="nicovideo.jp/watch/"]');if(!a||a.id==="v331External"||a.dataset.external==="1")return;
    var id=videoIdFromUrl(a.href);if(!id)return;var info=findSong(id,a),items=queueFromAnchor(a,id,info.title);e.preventDefault();e.stopPropagation();openPlayer(id,info.title,items);
  },true);
}
function boot(){build();intercept();window.VSANicoPlayer={open:openPlayer,close:function(){closePlayer(true)},collapse:collapsePlayer,expand:expandPlayer,setQueue:setQueue,next:function(){playRelative(1)},prev:function(){playRelative(-1)},state:function(){return{currentId:currentId,queue:queue.slice(),index:queueIndex}}}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();