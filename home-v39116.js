/* VocaDive Home Explorer + Watch History · v39.116.0 */
(function(){
"use strict";
var VERSION="39.116.0";
if(window.__VSA_HOME_39116)return;
window.__VSA_HOME_39116=true;

var FEED_KEY="vsa.home.v28.3960";
var ORG_KEY="vsa.organizer.v22";
var PREF_KEY="vsa.home.filters.v39116";
var HISTORY_VIEW="watchHistory39116";
var enhancing=false,homeObs=null,toolsObs=null,refreshingPools=false;

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key)||"null")||fallback}catch(_){return fallback}}
function save(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(_){}}
function feed(){return load(FEED_KEY,{daily:[],taste:[],newer:[],hidden:[]})}
function organizer(){return load(ORG_KEY,{version:1,library:{},recentViews:[],recentSearches:[],cases:[],compare:[],snapshots:{}})}
function tags(song){var r=song&&song.tags;return Array.isArray(r)?r.map(String):String(r||"").split(/[\s,、，]+/).filter(Boolean)}
function yearOf(song){if(!song||!song.startTime)return 0;var y=new Date(song.startTime).getFullYear();return Number.isFinite(y)?y:0}
function viewedSet(){return new Set((organizer().recentViews||[]).map(function(x){return String(x&&x.id||"")}).filter(Boolean))}
function markKey(mark){return mark==="DAILY"?"daily":mark==="FOR YOU"?"taste":mark==="NEW"?"newer":"hidden"}
function defaults(mark){
  return {
    field:"all",query:"",views:"all",era:"all",unseen:false,
    sort:"default",count:(mark==="DAILY"||mark==="DEEP")?24:18
  }
}
function loadPrefs(){
  var p=load(PREF_KEY,{});
  ["DAILY","FOR YOU","NEW","DEEP"].forEach(function(mark){p[mark]=Object.assign(defaults(mark),p[mark]||{})});
  return p
}
var prefs=loadPrefs();
function savePrefs(){save(PREF_KEY,prefs)}

function addStyle(){
  if(document.getElementById("v39116HomeStyle"))return;
  var s=document.createElement("style");s.id="v39116HomeStyle";s.textContent=`
#v37Home .v39116-home-tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#v37Home .v39116-home-tools button{min-height:31px;padding:0 10px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(7,29,35,.64);color:inherit;font-size:7px;font-weight:900}
#v37Home .v39116-home-tools .history{border-color:rgba(113,201,239,.28);background:rgba(18,51,68,.72)}
#v37Home .v39116-shelf-controls{display:grid;grid-template-columns:minmax(150px,1.3fr) repeat(4,minmax(90px,.7fr)) auto;gap:6px;align-items:center;margin:5px 0 10px;padding:8px;border:1px solid rgba(121,206,199,.12);border-radius:13px;background:rgba(5,23,29,.54)}
#v37Home .v39116-shelf-controls input,#v37Home .v39116-shelf-controls select{min-width:0;width:100%;height:32px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#071c22;color:#e8f7f4;padding:0 8px;font-size:7px}
#v37Home .v39116-shelf-controls label{display:flex;align-items:center;gap:5px;min-height:32px;padding:0 7px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.025);font-size:6px;white-space:nowrap}
#v37Home .v39116-shelf-controls input[type="checkbox"]{width:14px;height:14px}
#v37Home .v39116-filter-meta{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:-4px 2px 8px;color:#789b97;font-size:6px}
#v37Home .v39116-filter-meta button{min-height:24px;border:0;background:transparent;color:#83cfc7;font-size:6px;font-weight:900}
#v37Home .v39116-filter-empty{padding:18px;border:1px dashed rgba(255,255,255,.1);border-radius:12px;text-align:center;color:#7d9c98;font-size:7px}
#v37Home .v39116-feed-note{display:inline-flex;margin-left:6px;padding:2px 5px;border:1px solid rgba(115,210,201,.13);border-radius:999px;color:#75bdb6;font-size:5.5px;vertical-align:middle}
#v37Home .v396-continue{display:none!important}

.v39116-history-page{width:100%;max-width:1180px;margin:0 auto;padding:14px 4px 100px;box-sizing:border-box}
.v39116-history-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;padding:10px 2px 14px;border-bottom:1px solid #18393e}
.v39116-history-head small{display:block;color:#77d8cf;font-size:8px;font-weight:950;letter-spacing:.12em}
.v39116-history-head h2{margin:4px 0 4px;font-size:24px;letter-spacing:-.04em}
.v39116-history-head p{margin:0;color:#7f9f9b;font-size:8px}
.v39116-history-head-actions{display:flex;gap:6px;flex-wrap:wrap}
.v39116-history-head button{min-height:36px;padding:0 11px;border:1px solid #27545a;border-radius:10px;background:#0a2930;color:#dff8f4;font-size:7px;font-weight:900}
.v39116-history-head button.danger{border-color:#60404a;background:#2a171d;color:#f5cbd4}
.v39116-history-toolbar{display:grid;grid-template-columns:minmax(180px,1.3fr) repeat(2,minmax(100px,.6fr));gap:7px;margin:10px 0}
.v39116-history-toolbar input,.v39116-history-toolbar select{height:38px;border:1px solid #20474d;border-radius:10px;background:#071b20;color:#e8f8f5;padding:0 10px;font-size:8px}
.v39116-history-summary{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0 10px}
.v39116-history-summary span{padding:4px 7px;border-radius:999px;background:#09252b;border:1px solid #21464b;color:#87aaa6;font-size:6px}
.v39116-history-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.v39116-history-card{display:grid;grid-template-columns:112px minmax(0,1fr) auto;gap:9px;align-items:center;padding:8px;border:1px solid #1e4146;border-radius:14px;background:linear-gradient(145deg,#082329,#06191e);min-width:0}
.v39116-history-thumb{width:112px;aspect-ratio:16/9;border:0;border-radius:10px;overflow:hidden;background:#0a2931;color:#9edbd4;display:grid;place-items:center;padding:0}
.v39116-history-thumb img{width:100%;height:100%;object-fit:cover}
.v39116-history-copy{min-width:0}.v39116-history-copy b{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v39116-history-copy small{display:block;margin-top:4px;color:#779b97;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v39116-history-card-actions{display:flex;gap:5px;flex-direction:column}.v39116-history-card-actions button{min-height:30px;padding:0 8px;border:1px solid #285159;border-radius:9px;background:#0c2a30;color:#dbf4f0;font-size:6px;font-weight:900}.v39116-history-card-actions button.remove{border-color:#533942;background:#26171c;color:#eabec8}
.v39116-history-empty{padding:34px 12px;border:1px dashed #24474b;border-radius:14px;text-align:center;color:#7d9d99;font-size:8px}
@media(max-width:920px){#v37Home .v39116-shelf-controls{grid-template-columns:1fr 1fr 1fr}.v39116-history-list{grid-template-columns:1fr}}
@media(max-width:620px){
 #v37Home .v39116-shelf-controls{grid-template-columns:1fr 1fr}.v39116-history-toolbar{grid-template-columns:1fr}.v39116-history-head{align-items:flex-start;flex-direction:column}
 .v39116-history-card{grid-template-columns:92px minmax(0,1fr)}.v39116-history-thumb{width:92px}.v39116-history-card-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}
}
`;document.head.appendChild(s)
}

function sectionMark(section){
  var t=(section.querySelector("h2")||{}).textContent||"";
  if(t.indexOf("숨은 곡")>=0)return"DEEP";
  if(t.indexOf("내 취향")>=0)return"FOR YOU";
  if(t.indexOf("신곡")>=0)return"NEW";
  return"DAILY"
}
function songHay(song,field){
  var title=String(song.title||""),id=String(song.contentId||""),meta=tags(song).concat(song.producerHints||[]).join(" ");
  if(field==="title")return title;
  if(field==="meta")return meta;
  if(field==="id")return id;
  return [title,id,meta].join(" ")
}
function viewPass(v,band){
  v=Number(v)||0;
  if(band==="0_499")return v<=499;
  if(band==="500_1999")return v>=500&&v<=1999;
  if(band==="2000_9999")return v>=2000&&v<=9999;
  if(band==="10000_49999")return v>=10000&&v<=49999;
  if(band==="50000_99999")return v>=50000&&v<=99999;
  if(band==="100000_499999")return v>=100000&&v<=499999;
  if(band==="500000_plus")return v>=500000;
  return true
}
function eraPass(y,era){
  if(era==="2007_2010")return y>=2007&&y<=2010;
  if(era==="2011_2015")return y>=2011&&y<=2015;
  if(era==="2016_2020")return y>=2016&&y<=2020;
  if(era==="2021_2024")return y>=2021&&y<=2024;
  if(era==="2025_plus")return y>=2025;
  return true
}
function reaction(song){
  var v=Math.max(1,Number(song.viewCounter)||1);
  return ((Number(song.mylistCounter)||0)*2+(Number(song.commentCounter)||0)+(Number(song.likeCounter)||0))/v
}
function filteredRows(mark){
  var p=prefs[mark]||defaults(mark),rows=((feed()[markKey(mark)]||[]).filter(Boolean)).slice(),seen=viewedSet();
  var q=String(p.query||"").trim().toLowerCase();
  if(window.VSA37AdultFilterRows)try{rows=window.VSA37AdultFilterRows(rows,"home39116_"+mark).rows}catch(_){}
  rows=rows.filter(function(song){
    if(q&&!songHay(song,p.field).toLowerCase().includes(q))return false;
    if(!viewPass(song.viewCounter,p.views))return false;
    if(!eraPass(yearOf(song),p.era))return false;
    if(p.unseen&&seen.has(String(song.contentId)))return false;
    return true
  });
  if(p.sort==="views_desc")rows.sort(function(a,b){return(+b.viewCounter||0)-(+a.viewCounter||0)});
  else if(p.sort==="views_asc")rows.sort(function(a,b){return(+a.viewCounter||0)-(+b.viewCounter||0)});
  else if(p.sort==="mylist")rows.sort(function(a,b){return(+b.mylistCounter||0)-(+a.mylistCounter||0)});
  else if(p.sort==="comments")rows.sort(function(a,b){return(+b.commentCounter||0)-(+a.commentCounter||0)});
  else if(p.sort==="reaction")rows.sort(function(a,b){return reaction(b)-reaction(a)});
  else if(p.sort==="newest")rows.sort(function(a,b){return new Date(b.startTime||0)-new Date(a.startTime||0)});
  else if(p.sort==="oldest")rows.sort(function(a,b){return new Date(a.startTime||0)-new Date(b.startTime||0)});
  return rows
}
function card(song,mark){
  var y=yearOf(song)||"-";
  return '<article class="v39-media-card" data-v39-song="'+esc(song.contentId)+'" tabindex="0">'+
    '<button type="button" class="v39-thumb" data-v399-play="'+esc(song.contentId)+'" aria-label="'+esc(song.title||song.contentId)+' 재생">'+
      (song.thumbnailUrl?'<img src="'+esc(song.thumbnailUrl)+'" loading="lazy" decoding="async" alt="">':'<span class="v39-no-thumb">♪</span>')+'<span class="v39-thumb-play">▶</span></button>'+
    '<div class="v39-media-copy"><button type="button" class="v39-media-title" data-v399-play="'+esc(song.contentId)+'">'+esc(song.title||song.contentId)+'</button>'+
      '<div class="v39-media-meta">조회 '+fmt(song.viewCounter||0)+' · '+y+'</div>'+
      '<div class="v39-media-reason">'+(mark==="DEEP"?"숨은 곡 발굴":mark==="FOR YOU"?"취향 추천":mark==="NEW"?"최근 투고":"추천 후보")+'</div></div></article>'
}
function toolbar(mark){
  var p=prefs[mark]||defaults(mark);
  function op(v,t,cur){return'<option value="'+v+'"'+(cur===v?' selected':'')+'>'+t+'</option>'}
  return '<div class="v39116-shelf-controls" data-v39116-controls="'+mark+'">'+
    '<input type="search" data-v39116-query placeholder="곡명 · P · 보컬 · 태그 검색" value="'+esc(p.query)+'">'+
    '<select data-v39116-field>'+op("all","전체 기준",p.field)+op("title","곡명",p.field)+op("meta","P·보컬·태그",p.field)+op("id","콘텐츠 ID",p.field)+'</select>'+
    '<select data-v39116-views>'+op("all","모든 조회수",p.views)+op("0_499","0~499",p.views)+op("500_1999","500~1,999",p.views)+op("2000_9999","2천~9,999",p.views)+op("10000_49999","1만~4.9만",p.views)+op("50000_99999","5만~9.9만",p.views)+op("100000_499999","10만~49만",p.views)+op("500000_plus","50만+",p.views)+'</select>'+
    '<select data-v39116-era>'+op("all","전체 연도",p.era)+op("2007_2010","2007~2010",p.era)+op("2011_2015","2011~2015",p.era)+op("2016_2020","2016~2020",p.era)+op("2021_2024","2021~2024",p.era)+op("2025_plus","2025~",p.era)+'</select>'+
    '<select data-v39116-sort>'+op("default","기본 추천순",p.sort)+op("views_desc","조회수 높은순",p.sort)+op("views_asc","조회수 낮은순",p.sort)+op("mylist","마이리스트순",p.sort)+op("comments","댓글순",p.sort)+op("reaction","반응률순",p.sort)+op("newest","최신순",p.sort)+op("oldest","오래된순",p.sort)+'</select>'+
    '<label><input type="checkbox" data-v39116-unseen'+(p.unseen?' checked':'')+'> 미시청만</label>'+
  '</div><div class="v39116-filter-meta" data-v39116-meta="'+mark+'"><span></span><div><select data-v39116-count>'+[12,18,24,36].map(function(n){return'<option value="'+n+'"'+(+p.count===n?' selected':'')+'>'+n+'곡 표시</option>'}).join("")+'</select> <button type="button" data-v39116-reset="'+mark+'">필터 초기화</button></div></div>'
}
function renderShelf(section,mark){
  var all=filteredRows(mark),p=prefs[mark]||defaults(mark),rows=all.slice(0,Math.max(1,+p.count||24));
  var grid=section.querySelector(".v39-media-grid"),empty=section.querySelector(".v39-shelf-empty");
  if(!grid){grid=document.createElement("div");grid.className="v39-media-grid";section.appendChild(grid)}
  if(empty)empty.remove();
  grid.innerHTML=rows.map(function(x){return card(x,mark)}).join("");
  if(!rows.length)grid.innerHTML='<div class="v39116-filter-empty">현재 필터에 맞는 곡이 없습니다.</div>';
  var meta=section.querySelector('[data-v39116-meta="'+mark+'"] span');
  if(meta)meta.textContent="후보 "+all.length+"곡 · 현재 "+rows.length+"곡 표시";
}
function enhanceShelf(section){
  var mark=sectionMark(section);section.dataset.v39116Mark=mark;
  var head=section.querySelector(".v39-shelf-head h2");
  if(head&&!head.querySelector(".v39116-feed-note"))head.insertAdjacentHTML("beforeend",'<span class="v39116-feed-note">'+((mark==="DAILY"||mark==="DEEP")?"최대 36곡 풀":"확장 탐색")+'</span>');
  if(!section.querySelector("[data-v39116-controls]")){
    var headBox=section.querySelector(".v39-shelf-head");if(headBox)headBox.insertAdjacentHTML("afterend",toolbar(mark))
  }
  renderShelf(section,mark)
}
function enhanceHome(){
  if(enhancing)return;enhancing=true;
  try{
    var root=document.getElementById("v37Home");if(!root)return;
    var cont=root.querySelector(".v396-continue");if(cont)cont.remove();
    var meta=root.querySelector(".v3989-home-meta");
    if(meta&&!meta.querySelector(".v39116-home-tools")){
      var old=meta.querySelector("button[data-v396-personal]");
      if(old)old.remove();
      meta.insertAdjacentHTML("beforeend",'<div class="v39116-home-tools"><button type="button" class="history" data-v39116-history>◷ 시청기록</button><button type="button" data-v396-personal>MY</button></div>')
    }
    root.querySelectorAll(".v39-shelf").forEach(enhanceShelf)
  }finally{enhancing=false}
}
function scheduleEnhance(){requestAnimationFrame(enhanceHome)}

function historyRows(){
  var db=organizer(),rows=(db.recentViews||[]).filter(function(x){return x&&x.id}).slice();
  var page=document.querySelector('[data-tool-view="'+HISTORY_VIEW+'"]');
  var q=page&&page.querySelector("[data-v39116-history-query]")?page.querySelector("[data-v39116-history-query]").value.trim().toLowerCase():"";
  var range=page&&page.querySelector("[data-v39116-history-range]")?page.querySelector("[data-v39116-history-range]").value:"all";
  var sort=page&&page.querySelector("[data-v39116-history-sort]")?page.querySelector("[data-v39116-history-sort]").value:"recent";
  var now=Date.now(),days=range==="today"?1:range==="7d"?7:range==="30d"?30:0;
  rows=rows.filter(function(x){
    var song=x.song||{},hay=[x.title,song.title,song.contentId,tags(song).join(" ")].join(" ").toLowerCase();
    if(q&&!hay.includes(q))return false;
    if(days&&now-(+x.viewedAt||0)>days*86400000)return false;
    return true
  });
  if(sort==="oldest")rows.sort(function(a,b){return(+a.viewedAt||0)-(+b.viewedAt||0)});
  else if(sort==="views")rows.sort(function(a,b){return(+((b.song||{}).viewCounter)||0)-(+((a.song||{}).viewCounter)||0)});
  else rows.sort(function(a,b){return(+b.viewedAt||0)-(+a.viewedAt||0)});
  return rows
}
function when(ts){try{return new Date(ts).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch(_){return"-"}}
function historyCard(x){
  var s=x.song||{contentId:x.id,title:x.title||x.id},y=yearOf(s)||"-";
  return '<article class="v39116-history-card"><button type="button" class="v39116-history-thumb" data-v399-play="'+esc(x.id)+'">'+(s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" alt="">':'♪')+'</button>'+
    '<div class="v39116-history-copy"><b>'+esc(s.title||x.title||x.id)+'</b><small>'+esc(x.id)+' · '+y+' · 조회 '+fmt(s.viewCounter||0)+'</small><small>시청 '+esc(when(x.viewedAt))+'</small></div>'+
    '<div class="v39116-history-card-actions"><button type="button" data-v399-play="'+esc(x.id)+'">다시 보기</button><button type="button" class="remove" data-v39116-remove-history="'+esc(x.id)+'">기록 삭제</button></div></article>'
}
function ensureHistoryPage(){
  var body=document.querySelector("#toolsModal .tools-body");if(!body)return null;
  var page=body.querySelector('[data-tool-view="'+HISTORY_VIEW+'"]');
  if(!page){page=document.createElement("section");page.className="tool-view v39116-history-page";page.dataset.toolView=HISTORY_VIEW;body.prepend(page)}
  return page
}
function renderHistory(){
  var page=ensureHistoryPage();if(!page)return;
  var q=page.querySelector("[data-v39116-history-query]")?.value||"";
  var range=page.querySelector("[data-v39116-history-range]")?.value||"all";
  var sort=page.querySelector("[data-v39116-history-sort]")?.value||"recent";
  var all=(organizer().recentViews||[]).length;
  page.innerHTML='<div class="v39116-history-head"><div><small>WATCH HISTORY</small><h2>시청 기록</h2><p>홈 추천과 분리된 개인 시청 기록 페이지 · 현재 기기 기준</p></div>'+
    '<div class="v39116-history-head-actions"><button type="button" data-v39116-history-home>홈으로</button><button type="button" class="danger" data-v39116-history-clear>전체 기록 삭제</button></div></div>'+
    '<div class="v39116-history-toolbar"><input type="search" data-v39116-history-query placeholder="곡명 · sm번호 · 태그 검색" value="'+esc(q)+'">'+
      '<select data-v39116-history-range><option value="all"'+(range==="all"?" selected":"")+'>전체 기간</option><option value="today"'+(range==="today"?" selected":"")+'>오늘</option><option value="7d"'+(range==="7d"?" selected":"")+'>최근 7일</option><option value="30d"'+(range==="30d"?" selected":"")+'>최근 30일</option></select>'+
      '<select data-v39116-history-sort><option value="recent"'+(sort==="recent"?" selected":"")+'>최근 시청순</option><option value="oldest"'+(sort==="oldest"?" selected":"")+'>오래된순</option><option value="views"'+(sort==="views"?" selected":"")+'>조회수순</option></select></div>'+
    '<div class="v39116-history-summary"><span>전체 '+all+'곡</span><span data-v39116-history-visible></span></div><div class="v39116-history-list" data-v39116-history-list></div>';
  renderHistoryList()
}
function renderHistoryList(){
  var page=document.querySelector('[data-tool-view="'+HISTORY_VIEW+'"]');if(!page)return;
  var rows=historyRows(),list=page.querySelector("[data-v39116-history-list]"),sum=page.querySelector("[data-v39116-history-visible]");
  if(sum)sum.textContent="현재 "+rows.length+"곡";
  if(list)list.innerHTML=rows.length?rows.map(historyCard).join(""):'<div class="v39116-history-empty">조건에 맞는 시청 기록이 없습니다.</div>'
}
function openHistory(){
  var page=ensureHistoryPage();if(!page)return;renderHistory();
  var modal=document.getElementById("toolsModal");if(!modal)return;
  document.querySelectorAll("#toolsModal .tool-view").forEach(function(v){var on=v===page;v.classList.toggle("active",on);v.hidden=!on;if(on)v.style.removeProperty("display");else v.style.setProperty("display","none","important")});
  modal.hidden=false;modal.dataset.currentView=HISTORY_VIEW;document.body.classList.add("tools-open");window.__VSA37_CURRENT_ROUTE=HISTORY_VIEW;
  document.querySelectorAll(".v37-dock button").forEach(function(b){b.classList.remove("active")});
  window.scrollTo({top:0,behavior:"auto"})
}
function openHome(){
  var modal=document.getElementById("toolsModal");if(modal)modal.hidden=true;document.body.classList.remove("tools-open");window.__VSA37_CURRENT_ROUTE="home";
  document.querySelectorAll(".v37-dock button").forEach(function(b){b.classList.toggle("active",b.dataset.v37==="home")});
  window.VSAHome37&&window.VSAHome37.render&&window.VSAHome37.render();setTimeout(enhanceHome,0);window.scrollTo({top:0,behavior:"auto"})
}
function removeHistory(id){
  var db=organizer();db.recentViews=(db.recentViews||[]).filter(function(x){return String(x&&x.id)!==String(id)});save(ORG_KEY,db);
  try{window.VSAOrganizer22&&window.VSAOrganizer22.reload&&window.VSAOrganizer22.reload()}catch(_){}
  renderHistoryList()
}
function clearHistory(){
  if(!confirm("시청 기록을 전부 지울까요? 이 기기의 기록만 삭제됩니다."))return;
  var db=organizer();db.recentViews=[];save(ORG_KEY,db);try{window.VSAOrganizer22&&window.VSAOrganizer22.reload&&window.VSAOrganizer22.reload()}catch(_){}
  renderHistory()
}
function cleanPersonalRecent(){
  var page=document.querySelector('[data-tool-view="personal395"]');if(!page)return;
  page.querySelectorAll(".v395-section").forEach(function(sec){var h=sec.querySelector("h3");if(h&&h.textContent.indexOf("최근 활동")>=0)sec.remove()});
  page.querySelectorAll('[data-v395-open="recent"]').forEach(function(b){var title=b.querySelector("b"),small=b.querySelector("small");if(title)title.textContent="시청 기록";if(small)small.textContent="별도 시청 기록 페이지에서 다시 보기"})
}
async function ensureExpandedPools(){
  if(refreshingPools)return;refreshingPools=true;
  try{
    if(window.VSAEnsureFeatures)await window.VSAEnsureFeatures("homeData");
    var f=feed(),needs=[];
    if((f.daily||[]).length<24)needs.push("DAILY");
    if((f.hidden||[]).length<24)needs.push("DEEP");
    for(var mark of needs){
      if(window.VSAHome28&&window.VSAHome28.refreshSection)await window.VSAHome28.refreshSection(mark)
    }
    if(needs.length&&window.VSAHome37&&window.VSAHome37.render){window.VSAHome37.render();setTimeout(enhanceHome,0)}
  }catch(_){}
  refreshingPools=false
}
function bind(){
  document.addEventListener("click",function(e){
    var h=e.target.closest("[data-v39116-history]");if(h){e.preventDefault();e.stopPropagation();openHistory();return}
    if(e.target.closest("[data-v39116-history-home]")){e.preventDefault();e.stopPropagation();openHome();return}
    if(e.target.closest("[data-v39116-history-clear]")){e.preventDefault();e.stopPropagation();clearHistory();return}
    var rm=e.target.closest("[data-v39116-remove-history]");if(rm){e.preventDefault();e.stopPropagation();removeHistory(rm.dataset.v39116RemoveHistory);return}
    var reset=e.target.closest("[data-v39116-reset]");if(reset){e.preventDefault();e.stopPropagation();var mark=reset.dataset.v39116Reset;prefs[mark]=defaults(mark);savePrefs();var sec=document.querySelector('.v39-shelf[data-v39116-mark="'+mark+'"]');if(sec){sec.querySelector("[data-v39116-controls]").outerHTML=toolbar(mark).split('<div class="v39116-filter-meta"')[0];enhanceHome()}return}
    var recent=e.target.closest('[data-v395-open="recent"]');if(recent){e.preventDefault();e.stopImmediatePropagation();openHistory();return}
  },true);
  document.addEventListener("input",function(e){
    var c=e.target.closest&&e.target.closest("[data-v39116-controls]");if(c){
      var mark=c.dataset.v39116Controls,p=prefs[mark];if(e.target.matches("[data-v39116-query]"))p.query=e.target.value||"";savePrefs();var sec=c.closest(".v39-shelf");if(sec)renderShelf(sec,mark);return
    }
    if(e.target.matches&&e.target.matches("[data-v39116-history-query]"))renderHistoryList()
  });
  document.addEventListener("change",function(e){
    var c=e.target.closest&&e.target.closest("[data-v39116-controls]");if(c){
      var mark=c.dataset.v39116Controls,p=prefs[mark];
      if(e.target.matches("[data-v39116-field]"))p.field=e.target.value;
      if(e.target.matches("[data-v39116-views]"))p.views=e.target.value;
      if(e.target.matches("[data-v39116-era]"))p.era=e.target.value;
      if(e.target.matches("[data-v39116-sort]"))p.sort=e.target.value;
      if(e.target.matches("[data-v39116-unseen]"))p.unseen=!!e.target.checked;
      savePrefs();var sec=c.closest(".v39-shelf");if(sec)renderShelf(sec,mark);return
    }
    if(e.target.matches&&e.target.matches("[data-v39116-count]")){var meta=e.target.closest("[data-v39116-meta]"),mark=meta&&meta.dataset.v39116Meta;if(mark){prefs[mark].count=+e.target.value||24;savePrefs();var sec=document.querySelector('.v39-shelf[data-v39116-mark="'+mark+'"]');if(sec)renderShelf(sec,mark)}return}
    if(e.target.matches&&e.target.matches("[data-v39116-history-range],[data-v39116-history-sort]"))renderHistoryList()
  })
}
function observe(){
  var root=document.getElementById("v37Home");if(root){homeObs=new MutationObserver(function(){if(!root.querySelector(".v39116-home-tools"))scheduleEnhance()});homeObs.observe(root,{childList:true,subtree:true})}
  var tools=document.querySelector("#toolsModal .tools-body");if(tools){toolsObs=new MutationObserver(function(){cleanPersonalRecent()});toolsObs.observe(tools,{childList:true,subtree:true})}
}
function patchHomeApi(){
  if(window.VSAHome37&&window.VSAHome37.render&&!window.VSAHome37.__v39116){
    var old=window.VSAHome37.render;
    window.VSAHome37.render=function(){var r=old.apply(this,arguments);setTimeout(enhanceHome,0);return r};
    window.VSAHome37.__v39116=true
  }
}
function boot(){
  addStyle();patchHomeApi();ensureHistoryPage();bind();observe();enhanceHome();cleanPersonalRecent();
  setTimeout(ensureExpandedPools,550);
  window.VSAHomeExplorer39116={version:VERSION,enhance:enhanceHome,openHistory:openHistory,renderHistory:renderHistory,filters:function(){return JSON.parse(JSON.stringify(prefs))}}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();