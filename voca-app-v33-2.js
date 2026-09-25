/* Voca Support v33.2 — library hub, feed more, recommendation reasons */
(function(){
"use strict";
var OK="vsa.organizer.v22",SK="vsa.smart.v23",HK="vsa.home.v28";
var selected=new Set(),selectMode=false,filter="all",sortMode="updated",query="",statusTarget="";
var statusMeta={interest:["♡","관심곡"],favorite:["★","최애"],investigate:["⌕","나중에 조사"],heard:["✓","들어봄"],dislike:["×","관심없음"]};

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function load(k,f){try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function addStyle(){if(document.getElementById("v332Style"))return;var s=document.createElement("style");s.id="v332Style";s.textContent="\n.v332-lib{min-height:100%}.v332-lib-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}.v332-lib-head small{display:block;color:#6fd9d0;font-size:7px;font-weight:950;letter-spacing:.13em}.v332-lib-head h2{margin:4px 0 3px;font-size:22px;letter-spacing:-.04em}.v332-lib-head p{margin:0;color:#739895;font-size:8px}\n.v332-lib-controls{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;margin-bottom:8px}.v332-lib-controls input,.v332-lib-controls select{min-width:0;min-height:40px}.v332-lib-controls button{min-height:40px;border:1px solid #2b565d;border-radius:11px;background:#0b2930;color:#cae8e4;font-size:8px;font-weight:900;padding:0 11px}\n.v332-lib-chips{display:flex;gap:5px;overflow-x:auto;padding:2px 0 9px;scrollbar-width:none}.v332-lib-chips::-webkit-scrollbar{display:none}.v332-lib-chips button{flex:0 0 auto;min-height:31px;border:1px solid #285159;border-radius:999px;padding:0 10px;background:#092329;color:#8fb7b3;font-size:8px;font-weight:850}.v332-lib-chips button.active{background:#17444a;color:#effffc;border-color:#4e8585}\n.v332-lib-stats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.v332-lib-stats span{padding:5px 8px;border:1px solid #20474e;border-radius:999px;background:#081e23;color:#89afab;font-size:7px}\n.v332-lib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:9px}.v332-lib-card{position:relative;min-width:0;border:1px solid #1e4147;border-radius:15px;background:#081d22;overflow:hidden;transition:.16s transform,.16s border-color}.v332-lib-card:hover{transform:translateY(-1px);border-color:#3b6b70}.v332-lib-card.selected{outline:2px solid #71e1d7;outline-offset:1px}.v332-lib-thumb{position:relative;aspect-ratio:16/9;background:#0b252b;overflow:hidden}.v332-lib-thumb img{width:100%;height:100%;object-fit:cover}.v332-lib-play{position:absolute;right:8px;bottom:7px;width:31px;height:31px;border:0;border-radius:50%;display:grid;place-items:center;background:#effffb;color:#061316;font-size:10px}.v332-lib-select{display:none;position:absolute;left:7px;top:7px;z-index:3;width:31px;height:31px;border:1px solid #4d7b7f;border-radius:10px;background:#08252bda;color:#dff6f2;font-size:12px}.v332-selecting .v332-lib-select{display:block}.v332-lib-card.selected .v332-lib-select{background:#71e1d7;color:#061316}.v332-lib-body{padding:8px}.v332-lib-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:27px;color:#e7f8f5;font-size:10px;font-weight:850;line-height:1.35}.v332-lib-meta{margin-top:4px;color:#688d89;font-size:7px}.v332-lib-foot{display:flex;justify-content:space-between;align-items:center;gap:5px;margin-top:7px}.v332-status{min-width:0;min-height:29px;border:1px solid #285159;border-radius:999px;background:#0b282e;color:#a6cfca;font-size:7px;font-weight:850;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v332-lib-more{width:29px;height:29px;border:1px solid #285159;border-radius:9px;background:#0b282e;color:#8fb7b3}\n.v332-batch[hidden]{display:none}.v332-batch{position:sticky;bottom:8px;z-index:8;display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-top:10px;padding:8px;border:1px solid #37666b;border-radius:14px;background:#08252bf2;box-shadow:0 12px 40px #0009;backdrop-filter:blur(14px)}.v332-batch b{font-size:8px;margin-right:4px}.v332-batch button{min-height:31px;border:1px solid #2d5a60;border-radius:9px;background:#0b2b31;color:#bee0dc;font-size:7px;font-weight:850;padding:0 9px}.v332-empty{padding:50px 12px;text-align:center;color:#729693;font-size:9px}\n.v332-sheet[hidden]{display:none}.v332-sheet{position:fixed;inset:0;z-index:27000;display:grid;place-items:end center;background:rgba(0,7,10,.72);backdrop-filter:blur(8px)}.v332-sheet-panel{width:min(480px,100%);padding:14px;border:1px solid #2b565d;border-bottom:0;border-radius:20px 20px 0 0;background:#071b20}.v332-sheet-panel h3{margin:0 0 10px;font-size:15px}.v332-status-options{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v332-status-options button{min-height:44px;border:1px solid #285159;border-radius:12px;background:#0b2930;color:#d9f4ef;font-size:9px;font-weight:900}.v332-status-options .danger{color:#efb2ba;border-color:#583840;background:#26191d}\n.v332-reason{display:flex;align-items:center;gap:4px;margin-top:5px;color:#72aaa5;font-size:6.5px}.v332-reason:before{content:\"✦\";color:#70ddd3}.v332-more{min-height:30px;border:1px solid #285159;border-radius:9px;background:#0b2930;color:#acd0cc;font-size:7px;font-weight:900;padding:0 9px}.v332-feed-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}.v332-feed-card{min-width:0}.v332-feed-card .v28-card{height:100%}.v332-feed-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.v332-feed-head h2{margin:0;font-size:20px}.v332-feed-head div{display:flex;gap:5px}.v332-feed-head button{min-height:34px;border:1px solid #285159;border-radius:10px;background:#0b2930;color:#b9dbd7;font-size:8px;font-weight:900;padding:0 10px}\n@media(max-width:699px){.v332-lib-controls{grid-template-columns:1fr auto}.v332-lib-controls input{grid-column:1/-1}.v332-lib-grid,.v332-feed-grid{grid-template-columns:1fr 1fr}.v332-lib-head h2{font-size:19px}.v332-lib-grid{gap:7px}.v332-lib-body{padding:7px}.v332-status-options{grid-template-columns:1fr 1fr}}@media(max-width:430px){.v332-lib-grid,.v332-feed-grid{grid-template-columns:1fr}.v332-lib-controls{grid-template-columns:1fr 1fr}}\n";document.head.appendChild(s)}
function songTags(s){var r=s&&s.tags;return Array.isArray(r)?r.map(String):String(r||"").split(/[\s,、]+/).filter(Boolean)}
function homeFeed(){return load(HK,{daily:[],taste:[],newer:[],hidden:[]})}
function getSong(id){
  var f=homeFeed(),keys=["daily","taste","newer","hidden"];
  for(var i=0;i<keys.length;i++){var hit=(f[keys[i]]||[]).find(function(s){return s.contentId===id});if(hit)return hit}
  var org=load(OK,{library:{}});if(org.library&&org.library[id]&&org.library[id].song)return org.library[id].song;
  var sm=load(SK,{feedback:{}});if(sm.feedback&&sm.feedback[id]&&sm.feedback[id].song)return sm.feedback[id].song;
  try{if(window.VSAV33&&window.VSAV33.localPool){var x=window.VSAV33.localPool().find(function(s){return s.contentId===id});if(x)return x}}catch(e){}
  return{contentId:id,title:id};
}
function records(){
  var org=load(OK,{library:{}}),sm=load(SK,{feedback:{}}),map=new Map();
  Object.entries(org.library||{}).forEach(function(pair){var id=pair[0],x=pair[1];map.set(id,{id:id,status:x.status||"interest",song:x.song||getSong(id),updatedAt:x.updatedAt||x.savedAt||0})});
  Object.entries(sm.feedback||{}).forEach(function(pair){var id=pair[0],x=pair[1];if(Number(x.value)<0&&!map.has(id))map.set(id,{id:id,status:"dislike",song:x.song||getSong(id),updatedAt:x.at||0})});
  var a=Array.from(map.values());
  if(filter!=="all")a=a.filter(function(x){return x.status===filter});
  if(query){var q=query.toLowerCase();a=a.filter(function(x){return String(x.song&&x.song.title||x.id).toLowerCase().indexOf(q)>=0||songTags(x.song).join(" ").toLowerCase().indexOf(q)>=0})}
  if(sortMode==="views")a.sort(function(a,b){return(Number(b.song&&b.song.viewCounter)||0)-(Number(a.song&&a.song.viewCounter)||0)});
  else if(sortMode==="title")a.sort(function(a,b){return String(a.song&&a.song.title||a.id).localeCompare(String(b.song&&b.song.title||b.id),"ko")});
  else a.sort(function(a,b){return(b.updatedAt||0)-(a.updatedAt||0)});
  return a;
}
function counts(){
  var out={all:0,interest:0,favorite:0,investigate:0,heard:0,dislike:0},org=load(OK,{library:{}}),sm=load(SK,{feedback:{}});
  Object.values(org.library||{}).forEach(function(x){out.all++;if(out[x.status]!=null)out[x.status]++});
  Object.values(sm.feedback||{}).forEach(function(x){if(Number(x.value)<0){out.dislike++;out.all++}});
  return out;
}
function ensureView(){
  var body=document.querySelector("#toolsModal .tools-body");if(!body)return null;
  var el=body.querySelector('[data-tool-view="libraryHub33"]');
  if(el)return el;
  el=document.createElement("section");el.className="tool-view v33-view v332-lib";el.dataset.toolView="libraryHub33";
  el.innerHTML='<div class="v332-lib-head"><div><small>VOCALO LIBRARY</small><h2>보관함</h2><p>최애부터 관심없음까지 한 곳에서 정리하고 바로 재생합니다.</p></div></div>'+
    '<div class="v332-lib-controls"><input id="v332LibQuery" placeholder="보관한 곡 검색"><select id="v332LibSort"><option value="updated">최근 변경</option><option value="views">조회수</option><option value="title">제목</option></select><button id="v332SelectMode">선택</button></div>'+
    '<div class="v332-lib-chips" id="v332LibChips"></div><div class="v332-lib-stats" id="v332LibStats"></div><div class="v332-lib-grid" id="v332LibGrid"></div>'+
    '<div class="v332-batch" id="v332Batch" hidden><b id="v332BatchCount">0곡 선택</b><button data-batch="favorite">★ 최애</button><button data-batch="interest">♡ 관심</button><button data-batch="heard">✓ 들어봄</button><button data-batch="investigate">⌕ 조사</button><button data-batch="dislike">관심없음</button><button data-batch="remove">삭제</button></div>';
  body.prepend(el);return el;
}
function chipHtml(k,label,c){return'<button type="button" data-lib-filter="'+k+'" class="'+(filter===k?"active":"")+'">'+label+' '+(c[k]||0)+'</button>'}
function statusText(k){var x=statusMeta[k]||["",k];return x[0]+" "+x[1]}
function card(x){
  var s=x.song||{contentId:x.id,title:x.id},y=s.startTime?new Date(s.startTime).getFullYear():"-",sel=selected.has(x.id);
  return '<article class="v332-lib-card'+(sel?" selected":"")+'" data-lib-id="'+esc(x.id)+'"><button type="button" class="v332-lib-select" data-lib-select="'+esc(x.id)+'">'+(sel?"✓":"○")+'</button>'+
    '<div class="v332-lib-thumb">'+(s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" alt="">':'')+'<button type="button" class="v332-lib-play" data-lib-play="'+esc(x.id)+'">▶</button></div>'+
    '<div class="v332-lib-body"><div class="v332-lib-title">'+esc(s.title||x.id)+'</div><div class="v332-lib-meta">조회 '+fmt(s.viewCounter||0)+' · '+y+'</div>'+
    '<div class="v332-lib-foot"><button type="button" class="v332-status" data-lib-status="'+esc(x.id)+'">'+statusText(x.status)+'</button><button type="button" class="v332-lib-more" data-lib-more="'+esc(x.id)+'">•••</button></div></div></article>';
}
function render(){
  ensureView();var c=counts(),chips=document.getElementById("v332LibChips"),stats=document.getElementById("v332LibStats"),grid=document.getElementById("v332LibGrid");
  if(!grid)return;
  chips.innerHTML=chipHtml("all","전체",c)+chipHtml("favorite","★ 최애",c)+chipHtml("interest","♡ 관심",c)+chipHtml("investigate","⌕ 조사",c)+chipHtml("heard","✓ 들어봄",c)+chipHtml("dislike","관심없음",c);
  stats.innerHTML='<span>총 '+c.all+'곡</span><span>최애 '+c.favorite+'</span><span>관심 '+c.interest+'</span><span>관심없음 '+c.dislike+'</span>';
  var a=records();grid.parentElement.classList.toggle("v332-selecting",selectMode);
  grid.innerHTML=a.length?a.map(card).join(""):'<div class="v332-empty">이 조건에 해당하는 곡이 없습니다.</div>';
  var batch=document.getElementById("v332Batch");batch.hidden=!selectMode;document.getElementById("v332BatchCount").textContent=selected.size+"곡 선택";
  var b=document.getElementById("v332SelectMode");if(b)b.textContent=selectMode?"선택 종료":"선택";
}
function updateStatus(id,status){
  var song=getSong(id),sm=load(SK,{feedback:{},tagPrefs:{}});sm.feedback=sm.feedback||{};
  if(status==="dislike"){
    sm.feedback[id]={value:-1,at:Date.now(),song:song};save(SK,sm);
    if(window.VSAOrganizer22&&window.VSAOrganizer22.setSongStatus)window.VSAOrganizer22.setSongStatus(id,null,song);
  }else{
    if(sm.feedback[id]&&Number(sm.feedback[id].value)<0){delete sm.feedback[id];save(SK,sm)}
    if(window.VSAOrganizer22&&window.VSAOrganizer22.setSongStatus)window.VSAOrganizer22.setSongStatus(id,status,song);
    else{var org=load(OK,{library:{}});org.library=org.library||{};org.library[id]={status:status,song:song,savedAt:Date.now(),updatedAt:Date.now()};save(OK,org)}
  }
  render();try{if(window.VSAV33&&window.VSAV33.refreshTaste)window.VSAV33.refreshTaste()}catch(e){}try{if(window.VSARefreshPersonal395)window.VSARefreshPersonal395()}catch(e){}
}
function removeItem(id){
  var org=load(OK,{library:{}}),sm=load(SK,{feedback:{},tagPrefs:{}});if(org.library)delete org.library[id];if(sm.feedback)delete sm.feedback[id];save(OK,org);save(SK,sm);if(window.VSAOrganizer22&&window.VSAOrganizer22.reload)window.VSAOrganizer22.reload();selected.delete(id);render();try{if(window.VSARefreshPersonal395)window.VSARefreshPersonal395()}catch(e){}
}
function visibleQueue(){return records().map(function(x){return{id:x.id,title:x.song&&x.song.title||x.id}})}
function play(id){
  var s=getSong(id);if(window.VSANicoPlayer&&window.VSANicoPlayer.open)window.VSANicoPlayer.open(id,s.title||id,visibleQueue());
  else window.open("https://www.nicovideo.jp/watch/"+encodeURIComponent(id),"_blank","noopener");
}
function buildSheet(){
  if(document.getElementById("v332StatusSheet"))return;
  var sh=document.createElement("div");sh.id="v332StatusSheet";sh.className="v332-sheet";sh.hidden=true;
  sh.innerHTML='<div class="v332-sheet-panel"><h3>곡 상태 변경</h3><div class="v332-status-options"><button data-status="favorite">★ 최애</button><button data-status="interest">♡ 관심곡</button><button data-status="investigate">⌕ 나중에 조사</button><button data-status="heard">✓ 들어봄</button><button data-status="dislike" class="danger">관심없음</button><button data-status="remove" class="danger">보관에서 삭제</button></div></div>';
  document.body.appendChild(sh);sh.addEventListener("click",function(e){if(e.target===sh){sh.hidden=true;return}var b=e.target.closest("[data-status]");if(!b)return;var st=b.dataset.status;sh.hidden=true;if(st==="remove")removeItem(statusTarget);else updateStatus(statusTarget,st)});
}
function openStatus(id){statusTarget=id;buildSheet();document.getElementById("v332StatusSheet").hidden=false}
function batch(status){Array.from(selected).forEach(function(id){if(status==="remove")removeItem(id);else updateStatus(id,status)});selected.clear();render()}
function ensureFeedView(){
  var body=document.querySelector("#toolsModal .tools-body");if(!body)return null;
  var el=body.querySelector('[data-tool-view="feedMore33"]');if(el)return el;
  el=document.createElement("section");el.className="tool-view v33-view";el.dataset.toolView="feedMore33";el.innerHTML='<div class="v332-feed-head"><h2 id="v332FeedTitle">추천</h2><div><button id="v332FeedRefresh">다른 곡 ↻</button><button id="v332FeedBack">홈</button></div></div><div class="v332-feed-grid" id="v332FeedGrid"></div>';body.prepend(el);return el;
}
function feedInfo(mark){return mark==="DAILY"?["오늘의 추천","daily"]:mark==="FOR YOU"?["내 취향 추천","taste"]:mark==="NEW"?["새로 올라온 곡","newer"]:["숨은 곡","hidden"]}
function reason(song,mark){
  if(mark==="NEW")return"최근 업로드";
  if(mark==="DEEP")return"낮은 조회수에서 발견";
  if(mark==="DAILY")return"오늘의 추천 후보";
  var sig=window.VSAV33&&window.VSAV33.tasteSignals?window.VSAV33.tasteSignals().tags:[],tags=new Set(songTags(song)),hit=sig.find(function(x){return tags.has(x[0])});
  return hit?"취향 태그 · "+hit[0]:"보관함 취향과 유사";
}
function feedCard(song,mark){
  var y=song.startTime?new Date(song.startTime).getFullYear():"-";
  return '<article class="v28-card v332-feed-card"><a class="v28-thumb" href="https://www.nicovideo.jp/watch/'+encodeURIComponent(song.contentId)+'" target="_blank" rel="noopener">'+(song.thumbnailUrl?'<img src="'+esc(song.thumbnailUrl)+'" loading="lazy" alt="">':'')+'<span class="v28-play">▶</span></a><div class="v28-card-body"><a class="v28-title" href="https://www.nicovideo.jp/watch/'+encodeURIComponent(song.contentId)+'" target="_blank" rel="noopener">'+esc(song.title||song.contentId)+'</a><div class="v28-meta">조회 '+fmt(song.viewCounter||0)+' · '+y+'</div><div class="v332-reason">'+esc(reason(song,mark))+'</div><div class="v28-card-actions"><button data-save="'+esc(song.contentId)+'">♡ 보관</button><button data-dislike="'+esc(song.contentId)+'">관심없음</button></div></div></article>';
}
function openFeed(mark){
  ensureFeedView();var info=feedInfo(mark),f=homeFeed(),rows=f[info[1]]||[];document.getElementById("v332FeedTitle").textContent=info[0];document.getElementById("v332FeedGrid").dataset.mark=mark;document.getElementById("v332FeedGrid").innerHTML=rows.length?rows.map(function(s){return feedCard(s,mark)}).join(""):'<div class="v332-empty">표시할 곡이 없습니다.</div>';
  if(window.VSAV33&&window.VSAV33.openView)window.VSAV33.openView("feedMore33");
}
function patchHome(){
  document.querySelectorAll(".v28-rail").forEach(function(rail){
    var mark=rail.dataset.v28Rail,actions=rail.querySelector(".v32-rail-actions");
    if(actions&&!actions.querySelector(".v332-more")){var b=document.createElement("button");b.type="button";b.className="v332-more";b.dataset.feedMore=mark;b.textContent="모두 보기";actions.appendChild(b)}
    rail.querySelectorAll(".v28-card").forEach(function(card){
      if(card.querySelector(".v332-reason"))return;var a=card.querySelector('a[href*="nicovideo.jp/watch/"]');if(!a)return;var m=a.href.match(/\/watch\/([^?/#]+)/);if(!m)return;var id=decodeURIComponent(m[1]),song=getSong(id),meta=card.querySelector(".v28-meta");if(meta){var r=document.createElement("div");r.className="v332-reason";r.textContent=reason(song,mark);meta.insertAdjacentElement("afterend",r)}
    });
  });
}
function bind(){
  document.addEventListener("click",function(e){
    var f=e.target.closest&&e.target.closest("[data-lib-filter]");if(f){filter=f.dataset.libFilter;selected.clear();render();return}
    if(e.target.id==="v332SelectMode"){selectMode=!selectMode;if(!selectMode)selected.clear();render();return}
    var sel=e.target.closest&&e.target.closest("[data-lib-select]");if(sel){var id=sel.dataset.libSelect;selected.has(id)?selected.delete(id):selected.add(id);render();return}
    var playBtn=e.target.closest&&e.target.closest("[data-lib-play]");if(playBtn){play(playBtn.dataset.libPlay);return}
    var st=e.target.closest&&e.target.closest("[data-lib-status]");if(st){openStatus(st.dataset.libStatus);return}
    var more=e.target.closest&&e.target.closest("[data-lib-more]");if(more){openStatus(more.dataset.libMore);return}
    var ba=e.target.closest&&e.target.closest("[data-batch]");if(ba){batch(ba.dataset.batch);return}
    var fm=e.target.closest&&e.target.closest("[data-feed-more]");if(fm){openFeed(fm.dataset.feedMore);return}
  });
  var q=document.getElementById("v332LibQuery");if(q)q.addEventListener("input",function(){query=q.value.trim();render()});
  var sort=document.getElementById("v332LibSort");if(sort)sort.addEventListener("change",function(){sortMode=sort.value;render()});
  var rf=document.getElementById("v332FeedRefresh");if(rf)rf.onclick=function(){var grid=document.getElementById("v332FeedGrid"),mark=grid.dataset.mark,btn=document.querySelector('[data-v28-refresh="'+mark+'"]');if(btn){btn.click();setTimeout(function(){openFeed(mark)},500)}};
  var back=document.getElementById("v332FeedBack");if(back)back.onclick=function(){try{closeToolsModal()}catch(e){}};
}
function observe(){
  var home=document.getElementById("v28Home");if(home)new MutationObserver(function(){requestAnimationFrame(patchHome)}).observe(home,{childList:true,subtree:true});
  var modal=document.getElementById("toolsModal");if(modal)new MutationObserver(function(){if(!modal.hidden&&modal.querySelector('[data-tool-view="libraryHub33"].active'))render()}).observe(modal,{attributes:true,attributeFilter:["hidden","class"]});
}
var __booted=false;
function boot(){if(__booted)return;__booted=true;addStyle();ensureView();ensureFeedView();buildSheet();render();patchHome();bind();observe();window.VSA332Library={open:function(){if(window.VSAV33&&window.VSAV33.openView)window.VSAV33.openView("libraryHub33");setTimeout(render,0)},render:render};setTimeout(patchHome,400)}
if(document.body)boot();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();