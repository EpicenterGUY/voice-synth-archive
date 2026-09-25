/* Voice Synth Archive in-app Nico player v32 */
(function(){
"use strict";
var modal=null, frame=null, currentId="", currentTitle="", pushed=false;

function esc(v){
  return String(v==null?"":v).replace(/[&<>"']/g,function(m){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
  });
}
function videoIdFromUrl(url){
  try{
    var u=new URL(url,location.href);
    if(!/(\.|^)nicovideo\.jp$/i.test(u.hostname))return "";
    var m=u.pathname.match(/\/watch\/([^/?#]+)/);
    return m?decodeURIComponent(m[1]):"";
  }catch(e){return "";}
}
function findSongTitle(id,anchor){
  if(anchor){
    var card=anchor.closest(".v28-card,.song,.us-result");
    var t=card&&card.querySelector(".v28-title,.song-title,.us-copy b");
    if(t&&t.textContent.trim())return t.textContent.trim();
  }
  try{
    var groups=[state.songs,state.tasteSongs,state.guideSongs,state.hiddenGems,state.hiddenGemPool,state.detectiveCandidates];
    for(var g=0;g<groups.length;g++){
      var a=groups[g];
      if(!Array.isArray(a))continue;
      for(var i=0;i<a.length;i++){
        var s=a[i]&&a[i].song?a[i].song:a[i];
        if(s&&s.contentId===id)return s.title||id;
      }
    }
  }catch(e){}
  return id;
}
function build(){
  if(modal)return;
  var style=document.createElement("style");
  style.id="v32PlayerStyle";
  style.textContent=[
    ".v32-player[hidden]{display:none!important}",
    ".v32-player{position:fixed;inset:0;z-index:20000;display:grid;place-items:center;padding:18px;background:rgba(0,7,10,.84);backdrop-filter:blur(14px)}",
    ".v32-player-shell{width:min(980px,96vw);max-height:94dvh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;border:1px solid #28545b;border-radius:20px;overflow:hidden;background:#06161b;box-shadow:0 30px 100px #000d}",
    ".v32-player-head{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #17383e;background:#092128}",
    ".v32-player-head>div{min-width:0;flex:1}.v32-player-head small{display:block;font-size:7px;font-weight:950;letter-spacing:.12em;color:#70d9d0}.v32-player-head b{display:block;margin-top:2px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".v32-player-close{width:38px;height:38px;border:1px solid #2a555c;border-radius:11px;background:#0b2930;color:#dff7f3;font-size:20px}",
    ".v32-player-stage{position:relative;aspect-ratio:16/9;background:#000;min-height:220px}.v32-player-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}",
    ".v32-player-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 11px;background:#071b20;border-top:1px solid #17383e}.v32-player-foot span{min-width:0;font-size:8px;color:#739794;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v32-player-foot a{flex:0 0 auto;min-height:34px;display:inline-flex;align-items:center;padding:0 10px;border:1px solid #2a565d;border-radius:10px;background:#0c2b31;color:#cde9e5;text-decoration:none;font-size:8px;font-weight:900}",
    "body.v32-player-open{overflow:hidden!important}body.v32-player-open #v30BottomDock{display:none!important}",
    "@media(max-width:699px){.v32-player{padding:0;place-items:stretch}.v32-player-shell{width:100vw;height:100dvh;max-height:none;border:0;border-radius:0;grid-template-rows:auto auto 1fr}.v32-player-stage{aspect-ratio:16/9;min-height:0}.v32-player-foot{align-self:end}.v32-player-head{padding-top:max(9px,env(safe-area-inset-top))}}",
    "@media(min-width:700px) and (max-height:620px){.v32-player-shell{width:min(820px,94vw)}.v32-player-stage{min-height:0}}"
  ].join("");
  document.head.appendChild(style);

  modal=document.createElement("div");
  modal.className="v32-player";
  modal.id="v32Player";
  modal.hidden=true;
  modal.innerHTML=
    '<div class="v32-player-shell" role="dialog" aria-modal="true" aria-label="앱 내부 니코니코 플레이어">'+
      '<div class="v32-player-head"><div><small>IN-APP PLAYER</small><b id="v32PlayerTitle">재생 준비</b></div><button type="button" class="v32-player-close" id="v32PlayerClose" aria-label="닫기">×</button></div>'+
      '<div class="v32-player-stage"><iframe id="v32PlayerFrame" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>'+
      '<div class="v32-player-foot"><span id="v32PlayerMeta">니코니코 임베드 플레이어</span><a id="v32PlayerExternal" href="#" target="_blank" rel="noopener">니코동에서 열기 ↗</a></div>'+
    '</div>';
  document.body.appendChild(modal);
  frame=document.getElementById("v32PlayerFrame");

  document.getElementById("v32PlayerClose").addEventListener("click",function(){closePlayer(true);});
  modal.addEventListener("click",function(e){if(e.target===modal)closePlayer(true);});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!modal.hidden)closePlayer(true);});
  window.addEventListener("popstate",function(){if(modal&&!modal.hidden)closePlayer(false);});
}
function openPlayer(id,title){
  build();
  if(!id)return;
  currentId=id;
  currentTitle=title||id;
  document.getElementById("v32PlayerTitle").textContent=currentTitle;
  document.getElementById("v32PlayerMeta").textContent=id+" · 앱 내부 재생";
  document.getElementById("v32PlayerExternal").href="https://www.nicovideo.jp/watch/"+encodeURIComponent(id);
  frame.src="https://embed.nicovideo.jp/watch/"+encodeURIComponent(id)+"?jsapi=1&playerId=vsaPlayer";
  modal.hidden=false;
  document.body.classList.add("v32-player-open");
  if(!pushed){
    try{history.pushState({vsaPlayer:true},"",location.href);pushed=true;}catch(e){}
  }
}
function closePlayer(back){
  if(!modal||modal.hidden)return;
  modal.hidden=true;
  document.body.classList.remove("v32-player-open");
  if(frame)frame.src="about:blank";
  currentId="";
  if(back&&pushed){
    pushed=false;
    try{history.back();}catch(e){}
  }else pushed=false;
}
function intercept(){
  document.addEventListener("click",function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href*="nicovideo.jp/watch/"]');
    if(!a||a.id==="v32PlayerExternal"||a.dataset.external==="1")return;
    var id=videoIdFromUrl(a.href);
    if(!id)return;
    e.preventDefault();
    e.stopPropagation();
    openPlayer(id,findSongTitle(id,a));
  },true);
}
function boot(){build();intercept();window.VSANicoPlayer={open:openPlayer,close:function(){closePlayer(true)}};}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();