/* VocaDive 39.129.3 · Library cleanup + lightweight Up Next */
(function(){
"use strict";
var VER="39.129.3",timer=0,lastSig="";
function style(){
 if(document.getElementById("v391293LibraryStyle"))return;
 var s=document.createElement("style");s.id="v391293LibraryStyle";s.textContent=`
#toolsModal .tool-view[data-tool-view="library22"]{max-width:1320px;margin:0 auto;padding:8px 4px 110px!important}
#v22LibraryPanel>.panel-head{padding:18px 2px 10px!important;border:0!important;background:transparent!important}
#v22LibraryPanel>.panel-head h2{font-size:28px!important;letter-spacing:-.05em!important}
#v22LibraryPanel>.panel-head p{font-size:9px!important;color:#7f9894!important}
.v22-library-tools{position:sticky!important;top:4px!important;z-index:20!important;padding:7px!important;border:1px solid rgba(164,218,212,.10)!important;border-radius:14px!important;background:#0a1719!important}
.v22-library-tools button,.v22-library-tools label{min-height:34px!important;border:0!important;border-radius:999px!important;background:#142629!important;color:#a9bfbc!important}
.v22-library-tools button.active{background:#eef8f6!important;color:#071210!important}
.v22-library-stats{padding:8px 2px!important;border:0!important;gap:5px!important}
.v22-library-stats span{border:0!important;background:#102226!important;color:#93aaa6!important;font-size:8px!important}
.v22-library-stats .wide{flex-basis:auto!important}
.v22-library-body{padding:4px 0!important}
.v22-card-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important}
.v22-song-card{grid-template-columns:118px minmax(0,1fr)!important;gap:10px!important;padding:7px!important;border:0!important;border-radius:12px!important;background:#0c1a1d!important}
.v22-song-card img{width:118px!important;border-radius:9px!important}
.v22-song-main>b{font-size:10.5px!important}
.v22-song-main small{font-size:7.5px!important;color:#7f9793!important}
.v22-row{gap:4px!important}
.v22-row .mini-btn,.v22-save-select{min-height:30px!important;height:30px!important;border:0!important;border-radius:999px!important;background:#14272a!important;color:#b2c8c5!important;font-size:7px!important}
.v22-split{gap:8px!important}
.v22-split section{border:0!important;border-radius:14px!important;background:#0b181b!important}
.v22-history-head{border-bottom:1px solid rgba(164,218,212,.08)!important}
.v22-line,.v22-case{border-bottom:1px solid rgba(164,218,212,.07)!important}
.v22-case-list{border:0!important;background:#0b181b!important}
.v395-card{background:#0b1a1d!important;box-shadow:none!important}
.v395-action{border:0!important;background:#102125!important}
.v395-action:hover{background:#142a2f!important}

#v129QueueBtn{
 position:fixed;right:12px;bottom:calc(144px + env(safe-area-inset-bottom));z-index:31995;display:none;
 min-height:36px;padding:0 11px;border:1px solid rgba(168,222,216,.13);border-radius:999px;background:#102326;color:#d8e8e5;font-size:7.5px;font-weight:950
}
body.v129-has-player #v129QueueBtn{display:block}
#v129Queue{
 position:fixed;right:10px;bottom:calc(114px + env(safe-area-inset-bottom));z-index:32010;width:min(390px,calc(100vw - 20px));max-height:min(68dvh,620px);
 display:none;grid-template-rows:auto minmax(0,1fr);overflow:hidden;border:1px solid rgba(170,224,218,.13);border-radius:16px;background:#0a1719;box-shadow:0 20px 60px #000b
}
#v129Queue.open{display:grid}
.v129-q-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px;border-bottom:1px solid rgba(163,215,209,.09)}
.v129-q-head b{font-size:12px}.v129-q-head small{display:block;margin-top:2px;color:#79918e;font-size:7px}
.v129-q-head button{width:34px;height:34px;border:0;border-radius:50%;background:#14272a;color:#d8e8e5}
.v129-q-list{overflow:auto;padding:6px}
.v129-q-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:8px;align-items:center;min-height:48px;padding:6px;border-radius:10px;color:#e9f3f1}
.v129-q-row.current{background:#113036}
.v129-q-row>span{color:#66817d;font-size:8px;text-align:center}
.v129-q-row b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:9px}
.v129-q-row small{display:block;margin-top:3px;color:#708985;font-size:6.5px}
.v129-q-row button{min-height:30px;padding:0 8px;border:0;border-radius:999px;background:#14272a;color:#b5cac7;font-size:7px}
@media(max-width:980px){.v22-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:699px){
 #toolsModal .tool-view[data-tool-view="library22"]{padding-inline:8px!important}
 .v22-library-tools{top:3px!important;overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none!important}
 .v22-library-tools span[style]{display:none!important}
 .v22-card-grid{grid-template-columns:1fr!important}
 .v22-song-card{grid-template-columns:92px minmax(0,1fr)!important}
 .v22-song-card img{width:92px!important}
 .v22-split{grid-template-columns:1fr!important}
 #v129QueueBtn{right:9px;bottom:calc(126px + env(safe-area-inset-bottom))}
 #v129Queue{left:7px;right:7px;bottom:calc(116px + env(safe-area-inset-bottom));width:auto;max-height:58dvh}
}
@media(orientation:landscape) and (max-height:900px){
 #v129QueueBtn{right:10px;bottom:132px}
 #v129Queue{right:10px;bottom:76px;max-height:calc(100dvh - 90px)}
}
`;
 document.head.appendChild(s)
}
function ensure(){
 if(document.getElementById("v129Queue"))return;
 var btn=document.createElement("button");btn.id="v129QueueBtn";btn.type="button";btn.textContent="다음 곡";
 var q=document.createElement("section");q.id="v129Queue";
 q.innerHTML='<div class="v129-q-head"><div><b>다음 곡</b><small id="v129QueueMeta">재생목록</small></div><button type="button" data-v129-close>×</button></div><div class="v129-q-list" id="v129QueueList"></div>';
 document.body.appendChild(btn);document.body.appendChild(q);
 btn.addEventListener("click",function(){q.classList.toggle("open");render(true)});
 q.addEventListener("click",function(e){
  if(e.target.closest("[data-v129-close]")){q.classList.remove("open");return}
  var b=e.target.closest("[data-v129-play]");if(!b||!window.VSANicoPlayer)return;
  var st=VSANicoPlayer.state(),i=Number(b.dataset.v129Play),row=st.queue[i];if(!row)return;
  VSANicoPlayer.setQueue(st.queue,row.id);VSANicoPlayer.openMini(row.id,row.title||row.id,st.queue)
 })
}
function render(force){
 ensure();
 var st=null;try{st=window.VSANicoPlayer&&VSANicoPlayer.state?VSANicoPlayer.state():null}catch(_){}
 document.body.classList.toggle("v129-has-player",!!(st&&st.currentId));
 var meta=document.getElementById("v129QueueMeta"),list=document.getElementById("v129QueueList");
 if(!list)return;
 if(!st||!st.currentId){lastSig="";if(meta)meta.textContent="재생목록";if(force)list.innerHTML='<div style="padding:24px;text-align:center;color:#708985;font-size:8px">재생 중인 곡이 없습니다.</div>';return}
 var sig=st.currentId+"|"+st.index+"|"+st.queue.map(function(x){return x.id}).join(",");
 if(!force&&sig===lastSig)return;lastSig=sig;
 if(meta)meta.textContent=(st.index+1)+" / "+st.queue.length+" · 자동 다음 "+(st.autoNext?"켜짐":"꺼짐");
 list.innerHTML=st.queue.map(function(x,i){
  return '<div class="v129-q-row '+(i===st.index?"current":"")+'"><span>'+(i+1)+'</span><div><b>'+String(x.title||x.id).replace(/[&<>]/g,"")+'</b><small>'+(i===st.index?"지금 재생 중":i>st.index?"다음 재생 후보":"이전에 재생")+'</small></div><button type="button" data-v129-play="'+i+'">'+(i===st.index?"재생 중":"재생")+'</button></div>'
 }).join("")
}
function boot(){
 style();ensure();render(true);
 timer=setInterval(function(){render(false)},1800);
 window.addEventListener("vsa:route-change",function(){setTimeout(function(){render(true)},80)});
 document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(function(){render(true)},80)})
}
window.VSALibrary391293={version:VER,refresh:function(){render(true)}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();