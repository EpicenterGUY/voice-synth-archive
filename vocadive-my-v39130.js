/* VocaDive 39.130.0 · simplified MY + playlist-first listening */
(function(){
"use strict";
var VER="39.130.0",PK="vsa.playlists.v24",busy=false;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function loadPlaylists(){
 try{var x=JSON.parse(localStorage.getItem(PK)||"null")||{};return Array.isArray(x.playlists)?x.playlists:[]}catch(e){return[]}
}
function style(){
 if(document.getElementById("v39130MyStyle"))return;
 var s=document.createElement("style");s.id="v39130MyStyle";s.textContent=`
/* MY: music first, management second */
[data-tool-view="personal395"].v130-my{max-width:1320px!important;margin:0 auto!important;padding:8px 4px 110px!important}
[data-tool-view="personal395"].v130-my .v395-personal-hero{
 display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:14px!important;align-items:end!important;
 padding:20px!important;border:0!important;border-radius:20px!important;background:linear-gradient(135deg,#0b2227,#0b171b 68%,#111828)!important
}
[data-tool-view="personal395"].v130-my .v395-personal-title h2{font-size:34px!important;letter-spacing:-.055em!important}
[data-tool-view="personal395"].v130-my .v395-personal-title p{max-width:58ch!important;font-size:9px!important;color:#839a97!important}
[data-tool-view="personal395"].v130-my .v395-personal-hero-actions{display:none!important}
.v130-quick{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}
.v130-quick button{min-height:38px;padding:0 13px;border:0;border-radius:999px;background:#15272a;color:#c6d7d4;font-size:8px;font-weight:900}
.v130-quick button.primary{background:#eef8f6;color:#071210}
[data-tool-view="personal395"].v130-my .v395-personal-stats{
 display:flex!important;gap:6px!important;overflow-x:auto!important;padding:10px 0 2px!important;scrollbar-width:none!important
}
[data-tool-view="personal395"].v130-my .v395-personal-stats::-webkit-scrollbar{display:none}
[data-tool-view="personal395"].v130-my .v395-stat{
 flex:0 0 150px!important;min-height:74px!important;padding:10px!important;border:0!important;border-radius:13px!important;background:#0d1c1f!important
}
[data-tool-view="personal395"].v130-my .v395-stat small{font-size:7px!important}
[data-tool-view="personal395"].v130-my .v395-stat b{font-size:20px!important}
[data-tool-view="personal395"].v130-my .v395-stat em{font-size:6.5px!important;color:#718b87!important}
[data-tool-view="personal395"].v130-my .v395-personal-grid{grid-template-columns:1fr!important;margin-top:10px!important}
[data-tool-view="personal395"].v130-my .v395-personal-grid>.v395-card:nth-child(2){display:none!important}
[data-tool-view="personal395"].v130-my .v395-card{border:0!important;background:#0c1a1d!important;box-shadow:none!important}
[data-tool-view="personal395"].v130-my .v395-profile-note{border:0!important;background:#101f22!important}
.v130-playlists{margin-top:16px;padding-top:14px;border-top:1px solid rgba(164,218,212,.08)}
.v130-playlists-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:0 2px 9px}
.v130-playlists-head h3{margin:0;font-size:18px;letter-spacing:-.04em}
.v130-playlists-head p{margin:3px 0 0;color:#748d89;font-size:8px}
.v130-playlists-head button{min-height:32px;padding:0 10px;border:0;border-radius:999px;background:#14262a;color:#9fc0bc;font-size:7.5px;font-weight:900}
.v130-playlist-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
.v130-playlist-card{min-width:0;padding:11px;border:0;border-radius:14px;background:#0d1b1e}
.v130-playlist-cover{position:relative;aspect-ratio:1/1;border-radius:12px;overflow:hidden;background:linear-gradient(145deg,#163239,#111c24)}
.v130-playlist-cover img{position:absolute;width:50%;height:50%;object-fit:cover}
.v130-playlist-cover img:nth-child(1){left:0;top:0}.v130-playlist-cover img:nth-child(2){right:0;top:0}.v130-playlist-cover img:nth-child(3){left:0;bottom:0}.v130-playlist-cover img:nth-child(4){right:0;bottom:0}
.v130-playlist-cover.noimg{display:grid;place-items:center;color:#74b7b0;font-size:30px;font-weight:900}
.v130-playlist-card b{display:block;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}
.v130-playlist-card small{display:block;margin-top:3px;color:#748d89;font-size:7px}
.v130-playlist-actions{display:flex;gap:5px;margin-top:8px}
.v130-playlist-actions button{flex:1;min-height:32px;border:0;border-radius:999px;background:#14272a;color:#b9cecb;font-size:7px;font-weight:900}
.v130-playlist-actions button.primary{background:#eaf7f5;color:#071210}

/* Playlist page follows the same music-app hierarchy. */
[data-tool-view="playlist24"]{max-width:1320px!important;margin:0 auto!important;padding:8px 4px 110px!important}
[data-tool-view="playlist24"]>.panel-head{padding:18px 2px 10px!important;border:0!important;background:transparent!important}
[data-tool-view="playlist24"]>.panel-head h2{font-size:28px!important;letter-spacing:-.05em!important}
.v24-layout{grid-template-columns:minmax(0,1.45fr) minmax(280px,.55fr)!important;gap:10px!important;padding:0!important}
.v24-box{border:0!important;border-radius:14px!important;background:#0c1a1d!important}
.v24-head{border-bottom:1px solid rgba(164,218,212,.08)!important}
.v24-toolbar,.v24-options,.v24-savebar,.v24-tagadd{padding:9px!important}
.v24-row{border-bottom:1px solid rgba(164,218,212,.07)!important;background:transparent!important}
.v24-row img,.v24-noimg{border-radius:9px!important}
.v24-title-play:hover{color:#8fe2da!important}
.v24-actions button,.v24-saved button{border:0!important;border-radius:999px!important;background:#14272a!important}
.v24-saved button.primary{background:#eaf7f5!important;color:#071210!important}
.v24-saved{border-bottom:1px solid rgba(164,218,212,.07)!important}
.v24-slider{border:0!important;background:#101f22!important}
.v24-pref{border:0!important;background:#132629!important}
@media(max-width:980px){
 .v130-playlist-row{grid-template-columns:repeat(2,minmax(0,1fr))}
 .v24-layout{grid-template-columns:1fr!important}
}
@media(max-width:699px){
 [data-tool-view="personal395"].v130-my{padding-inline:8px!important}
 [data-tool-view="personal395"].v130-my .v395-personal-hero{grid-template-columns:1fr!important;padding:16px!important}
 [data-tool-view="personal395"].v130-my .v395-personal-title h2{font-size:28px!important}
 .v130-playlist-row{display:flex;overflow-x:auto;gap:10px;scroll-snap-type:x proximity;scrollbar-width:none}
 .v130-playlist-row::-webkit-scrollbar{display:none}
 .v130-playlist-card{flex:0 0 68vw;max-width:260px;scroll-snap-align:start}
 [data-tool-view="playlist24"]{padding-inline:8px!important}
 .v24-layout{grid-template-columns:1fr!important}
}
`;
 document.head.appendChild(s)
}
function coverHtml(p){
 var imgs=(p.songs||[]).map(function(s){return s&&s.thumbnailUrl||""}).filter(Boolean).slice(0,4);
 if(!imgs.length)return '<div class="v130-playlist-cover noimg">♪</div>';
 while(imgs.length<4)imgs.push(imgs[imgs.length-1]);
 return '<div class="v130-playlist-cover">'+imgs.map(function(x){return'<img src="'+esc(x)+'" loading="lazy" alt="">'}).join("")+'</div>'
}
function playlistsHtml(){
 var rows=loadPlaylists().slice(0,8);
 if(!rows.length)return '<div class="v395-empty">저장한 플레이리스트가 없습니다.<br>스마트 믹스나 플레이리스트 화면에서 목록을 저장해보세요.</div>';
 return '<div class="v130-playlist-row">'+rows.map(function(p){
  return '<article class="v130-playlist-card">'+coverHtml(p)+'<b>'+esc(p.name||"플레이리스트")+'</b><small>'+((p.songs||[]).length)+'곡</small><div class="v130-playlist-actions"><button type="button" class="primary" data-v130-play="'+esc(p.id)+'">▶ 재생</button><button type="button" data-v130-edit="'+esc(p.id)+'">편집</button></div></article>'
 }).join("")+'</div>'
}
function ensurePlaylistApi(cb){
 if(window.VSAPlaylist24){cb();return}
 if(!window.VSAEnsureFeatures)return;
 if(busy)return;busy=true;
 Promise.resolve(VSAEnsureFeatures("personal")).finally(function(){busy=false;cb()})
}
function playPlaylist(id){
 ensurePlaylistApi(function(){
  try{if(window.VSAPlaylist24&&VSAPlaylist24.playSaved)VSAPlaylist24.playSaved(id)}catch(_){}
 })
}
function editPlaylist(id){
 ensurePlaylistApi(function(){
  try{
   if(window.VSAPlaylist24&&VSAPlaylist24.refresh)VSAPlaylist24.refresh();
   if(typeof openToolsModal==="function")openToolsModal("playlist24");
   var b=document.querySelector('[data-load="'+CSS.escape(id)+'"]');if(b)setTimeout(function(){b.click()},50)
  }catch(_){}
 })
}
function enhance(){
 var p=document.querySelector('[data-tool-view="personal395"]');if(!p)return false;
 p.classList.add("v130-my");
 var title=p.querySelector(".v395-personal-title");
 if(title&&!title.querySelector(".v130-quick")){
  var q=document.createElement("div");q.className="v130-quick";q.innerHTML='<button type="button" class="primary" data-v130-open="library">보관함</button><button type="button" data-v130-open="smart">스마트 믹스</button><button type="button" data-v130-open="playlist">플레이리스트</button><button type="button" data-v130-open="recent">최근 재생</button>';title.appendChild(q)
 }
 var existing=p.querySelector(".v130-playlists");
 if(existing)existing.remove();
 var firstSection=p.querySelector(".v395-section");
 var sec=document.createElement("section");sec.className="v130-playlists";sec.innerHTML='<div class="v130-playlists-head"><div><h3>내 플레이리스트</h3><p>저장한 목록을 바로 재생</p></div><button type="button" data-v130-open="playlist">전체 보기</button></div>'+playlistsHtml();
 if(firstSection)firstSection.parentNode.insertBefore(sec,firstSection);else p.appendChild(sec);
 return true
}
function openKind(k){
 try{
  if(typeof openPersonalRoute395==="function"){openPersonalRoute395(k);return}
  if(window.VSAOpenPersonal395&&k==="my"){VSAOpenPersonal395();return}
 }catch(_){}
 if(window.VSAEnsureFeatures)Promise.resolve(VSAEnsureFeatures("personal")).then(function(){
  try{
   if(k==="library"&&window.VSAOrganizer22)VSAOrganizer22.openLibrary("saved");
   else if(k==="recent"&&window.VSAOrganizer22)VSAOrganizer22.openLibrary("recent");
   else if(typeof openToolsModal==="function")openToolsModal(k==="playlist"?"playlist24":k==="smart"?"smart23":"personal395")
  }catch(_){}
 })
}
function boot(){
 style();enhance();
 document.addEventListener("click",function(e){
  var p=e.target.closest&&e.target.closest("[data-v130-play]");if(p){playPlaylist(p.dataset.v130Play);return}
  var ed=e.target.closest&&e.target.closest("[data-v130-edit]");if(ed){editPlaylist(ed.dataset.v130Edit);return}
  var o=e.target.closest&&e.target.closest("[data-v130-open]");if(o){openKind(o.dataset.v130Open);return}
 },false);
 window.addEventListener("vsa:route-change",function(e){
  var r=String(e&&e.detail&&e.detail.route||"");
  if(r==="personal395")setTimeout(enhance,60)
 });
 window.addEventListener("storage",function(e){if(e.key===PK)setTimeout(enhance,60)})
}
window.VSAMy39130={version:VER,refresh:enhance};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();