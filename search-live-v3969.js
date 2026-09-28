/* VocaDive Search 5.0 · One Search + Live Results · v39.96.0 */
(function(){
"use strict";

var VERSION="39.96.0";
var QUICK_DELAY=320;
var FULL_DELAY=720;
var QUICK_TTL=5*60*1000;
var quickTimer=0;
var fullTimer=0;
var quickSeq=0;
var quickCache=new Map();
var bound=false;

function el(id){return document.getElementById(id)}
function esc(v){
  return String(v==null?"":v).replace(/[&<>"']/g,function(m){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]
  })
}
function fmt(v){
  var n=Number(v);
  return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"
}
function norm(v){
  try{return String(v||"").normalize("NFKC").toLowerCase().replace(/[\s　・･_\-]+/g,"")}
  catch(_){return String(v||"").toLowerCase()}
}
function readyQuery(q){
  q=String(q||"").trim();
  return /^(?:sm|nm|so)\d+$/i.test(q)||q.length>=2
}
function isSearchRoute(){
  return String(window.__VSA37_CURRENT_ROUTE||"")==="search29"
}
function filterKey(){
  var scope=el("searchScope"),year=el("v398Year"),tier=el("v398Tier"),sort=el("v398Sort");
  return [
    scope&&scope.value||"all_voice_synth",
    year&&year.value||"all",
    tier&&tier.value||"",
    sort&&sort.value||"-viewCounter"
  ].join("|")
}
function currentFullKey(q){
  return String(q||"").trim()+"|"+filterKey()
}
function recentDirectRunMatches(q){
  try{
    var x=window.__VSA398_LAST_RUN;
    if(!x||Date.now()-Number(x.at||0)>2500)return false;
    return String(x.key||"")===currentFullKey(q)
  }catch(_){return false}
}
function setHint(text,state){
  var box=el("v3969LiveHint");
  if(!box)return;
  var copy=el("v3969LiveHintText");
  if(copy)copy.textContent=text;else box.textContent=text;
  box.dataset.state=state||"idle";
  var actions=el("v3969LiveHintActions");
  if(actions)actions.hidden=(state!=="error")
}
function ensureHint(){
  var shell=el("v397SearchShell"),main=el("v398MainRow");
  if(!shell||!main||el("v3969LiveHint"))return;
  var box=document.createElement("div");
  box.id="v3969LiveHint";
  box.className="v3969-live-hint";
  box.dataset.state="idle";
  box.innerHTML='<span id="v3969LiveHintText">자동 검색 ON · 입력을 멈추면 결과가 바로 갱신됩니다.</span><span class="v3969-live-actions" id="v3969LiveHintActions" hidden><button type="button" data-v3969-retry>다시 검색</button><button type="button" data-v3969-worker>Worker 설정</button></span>';
  var chips=el("v398ActiveFilters");
  if(chips)chips.insertAdjacentElement("afterend",box);
  else main.insertAdjacentElement("afterend",box)
}
function scoreSong(song,q){
  var nq=norm(q),title=norm(song&&song.title),id=norm(song&&song.contentId),score=0;
  if(!nq)return 0;
  if(title===nq||id===nq)score+=1000;
  else if(title.startsWith(nq)||id.startsWith(nq))score+=650;
  else if(title.includes(nq)||id.includes(nq))score+=420;
  else{
    var blob=norm([song&&song.description,song&&song.tags].filter(Boolean).join(" "));
    if(blob.includes(nq))score+=180
  }
  score+=Math.min(150,Math.log10(Math.max(1,Number(song&&song.viewCounter)||1))*20);
  return score
}
function cacheGet(q){
  var k=norm(q),x=quickCache.get(k);
  if(!x)return null;
  if(Date.now()-x.at>QUICK_TTL){quickCache.delete(k);return null}
  return x.rows
}
function cacheSet(q,rows){
  var k=norm(q);
  quickCache.set(k,{at:Date.now(),rows:rows});
  if(quickCache.size>40){
    var first=quickCache.keys().next().value;
    quickCache.delete(first)
  }
}
async function fetchQuick(q){
  var cached=cacheGet(q);
  if(cached)return cached.slice();
  if(typeof window.fetchNico!=="function")return [];
  var d=await window.fetchNico({
    year:"all",
    limit:40,
    offset:0,
    mode:"free",
    query:q,
    scope:"all",
    sort:"-viewCounter",
    applyYear:false,
    applyTier:false
  });
  var rows=Array.isArray(d&&d.data)?d.data.slice():[];
  try{
    if(typeof window.songMatchesScope==="function"){
      var scoped=rows.filter(function(s){return window.songMatchesScope(s,"all_voice_synth")});
      if(scoped.length)rows=scoped
    }
  }catch(_){}
  try{
    if(window.VSA37AdultFilterRows)rows=window.VSA37AdultFilterRows(rows,"search5_quick").rows
  }catch(_){}
  var seen=new Set();
  rows=rows.filter(function(s){
    var id=String(s&&s.contentId||"");
    if(!id||seen.has(id))return false;
    seen.add(id);return true
  }).sort(function(a,b){
    return scoreSong(b,q)-scoreSong(a,q)
  }).slice(0,8);
  cacheSet(q,rows);
  return rows.slice()
}
function quickHtml(q,rows){
  var cards=(rows||[]).map(function(s){
    var year="-";
    try{if(s.startTime)year=new Date(s.startTime).getFullYear()}catch(_){}
    return '<button type="button" class="v3969-quick-item" data-v397-top-type="song" data-v397-top-id="'+esc(s.contentId)+'" data-v397-top-value="'+esc(s.title||s.contentId)+'">'+
      '<span class="v3969-quick-thumb">'+(s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" alt="">':'<i>♪</i>')+'</span>'+
      '<span class="v3969-quick-copy"><b>'+esc(s.title||s.contentId)+'</b><small>'+esc(s.contentId)+' · '+year+' · 조회 '+fmt(s.viewCounter||0)+'</small></span>'+
      '<em>›</em></button>'
  }).join("");
  return '<section class="v3969-quick-section" id="v3969RemoteQuick">'+
    '<div class="v3969-quick-head"><span><b>바로 검색 결과</b><small>니코니코 · 음성합성 우선</small></span>'+
    '<button type="button" data-v397-top-type="recent" data-v397-top-value="'+esc(q)+'">전체 결과</button></div>'+
    (cards?'<div class="v3969-quick-list">'+cards+'</div>':'<div class="v3969-quick-empty">온라인 결과를 찾지 못했습니다.</div>')+
    '</section>'
}
function paintQuick(q,rows,seq){
  if(seq!==quickSeq)return;
  var top=el("v39GlobalSearch"),box=el("v397TopSuggest");
  if(!top||!box||String(top.value||"").trim()!==q)return;
  var old=el("v3969RemoteQuick");if(old)old.remove();
  box.insertAdjacentHTML("beforeend",quickHtml(q,rows));
  var form=top.closest("form");
  if(form)form.classList.add("v397-suggest-open")
}
function scheduleQuick(){
  clearTimeout(quickTimer);
  var input=el("v39GlobalSearch");
  if(!input||input.dataset.composing3969==="1")return;
  var q=String(input.value||"").trim();
  if(!readyQuery(q)){
    var old=el("v3969RemoteQuick");if(old)old.remove();
    return
  }
  var seq=++quickSeq;
  quickTimer=setTimeout(function(){
    fetchQuick(q).then(function(rows){paintQuick(q,rows,seq)}).catch(function(){})
  },QUICK_DELAY)
}
async function runFull(q){
  if(!isSearchRoute()||!readyQuery(q))return false;
  if(recentDirectRunMatches(q))return false;
  if(typeof window.VSARunSearch398!=="function")return false;
  setHint("자동 검색 중…","busy");
  try{
    await window.VSARunSearch398();
    setHint("자동 검색 ON · 검색 결과가 갱신됐습니다.","ok");
    return true
  }catch(e){
    setHint("자동 검색 실패 · 다시 검색하거나 Worker 연결을 확인하세요.","error");
    return false
  }
}
function scheduleFull(delay){
  clearTimeout(fullTimer);
  var input=el("globalSearchInput");
  if(!input||input.dataset.composing3969==="1"||!isSearchRoute())return;
  var q=String(input.value||"").trim();
  if(!readyQuery(q)){
    setHint(q?"두 글자 이상 입력하면 자동 검색합니다.":"자동 검색 ON · 입력을 멈추면 결과가 바로 갱신됩니다.","idle");
    return
  }
  setHint("입력이 끝나면 자동 검색합니다…","wait");
  var key=currentFullKey(q);
  fullTimer=setTimeout(function(){
    if(!isSearchRoute())return;
    var now=String((el("globalSearchInput")||{}).value||"").trim();
    if(now!==q||currentFullKey(now)!==key)return;
    runFull(q)
  },Number.isFinite(delay)?delay:FULL_DELAY)
}
function bindInput(input,kind){
  if(!input||input.dataset.v3969Bound)return;
  input.dataset.v3969Bound="1";
  input.addEventListener("compositionstart",function(){input.dataset.composing3969="1"});
  input.addEventListener("compositionend",function(){
    input.dataset.composing3969="0";
    if(kind==="top")scheduleQuick();else scheduleFull(160)
  });
  input.addEventListener("input",function(e){
    if(e&&e.isComposing)return;
    if(kind==="top")scheduleQuick();else scheduleFull()
  });
  if(kind==="top")input.addEventListener("focus",scheduleQuick)
}
function bindFilters(){
  ["searchScope","v398Year","v398Tier","v398Sort"].forEach(function(id){
    var x=el(id);if(!x||x.dataset.v3969Bound)return;
    x.dataset.v3969Bound="1";
    x.addEventListener("change",function(){scheduleFull(180)})
  })
}
function syncRoute(){
  var on=isSearchRoute();
  document.body.classList.toggle("v3969-search-route",on);
  ensureHint();
  if(on){
    bindInput(el("globalSearchInput"),"main");
    bindFilters()
  }
  bindInput(el("v39GlobalSearch"),"top")
}
function injectStyle(){
  if(el("v3969SearchStyle"))return;
  var style=document.createElement("style");style.id="v3969SearchStyle";
  style.textContent=`
body.v3969-search-route .topbar .v39-global-search{display:none!important}
.v3969-live-hint{display:flex;align-items:center;gap:6px;min-height:28px;margin:6px 1px 1px;padding:4px 9px;border-radius:9px;border:1px solid rgba(111,213,203,.10);background:#071c22;color:#739a96;font-size:7px;font-weight:800}
.v3969-live-hint>span:first-child{min-width:0;flex:1}
.v3969-live-actions{display:flex;align-items:center;gap:4px;flex:0 0 auto}.v3969-live-actions[hidden]{display:none!important}
.v3969-live-actions button{min-height:25px;padding:0 7px;border:1px solid rgba(111,213,203,.14);border-radius:7px;background:#0d2b31;color:#b8e9e3;font-size:6.5px;font-weight:900}
.v3969-live-hint:before{content:"●";font-size:6px;color:#63d6cb}
.v3969-live-hint[data-state="busy"]:before{animation:v3969pulse .8s infinite alternate}
.v3969-live-hint[data-state="error"]{color:#d8a9a9;border-color:rgba(230,126,126,.16)}
.v3969-live-hint[data-state="error"]:before{color:#e27d7d}
@keyframes v3969pulse{from{opacity:.35}to{opacity:1}}
.v3969-quick-section{margin-top:7px;padding-top:7px;border-top:1px solid rgba(113,205,197,.10)}
.v3969-quick-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 3px 6px}
.v3969-quick-head>span b{display:block;color:#dff8f4;font-size:8px}.v3969-quick-head>span small{display:block;margin-top:1px;color:#688e8a;font-size:6.5px}
.v3969-quick-head>button{min-height:27px;padding:0 8px;border:1px solid rgba(113,205,197,.13);border-radius:8px;background:#0b2b31;color:#83d8d0;font-size:6.5px;font-weight:900}
.v3969-quick-list{display:grid;gap:4px}
.v3969-quick-item{width:100%;display:grid;grid-template-columns:46px minmax(0,1fr) 14px;gap:7px;align-items:center;padding:5px;border:0;border-radius:9px;background:transparent;color:inherit;text-align:left}
.v3969-quick-item:hover,.v3969-quick-item:focus-visible{background:#0b2b31}
.v3969-quick-thumb{width:46px;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#0f3036;display:grid;place-items:center;color:#73d8ce}
.v3969-quick-thumb img{width:100%;height:100%;object-fit:cover}.v3969-quick-copy{min-width:0}
.v3969-quick-copy b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e9faf7;font-size:8px}
.v3969-quick-copy small{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6f9490;font-size:6.2px}
.v3969-quick-item em{font-style:normal;color:#65bdb5;font-size:14px}.v3969-quick-empty{padding:10px;color:#71948f;font-size:7px;text-align:center}
@media(max-width:699px){
  body.v3969-search-route .topbar{grid-template-columns:minmax(0,1fr) auto!important}
  .v3969-live-hint{font-size:7.2px;min-height:30px;flex-wrap:wrap}
  .v3969-live-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}.v3969-live-actions button{min-height:31px;font-size:7px}
  .v3969-quick-item{grid-template-columns:56px minmax(0,1fr) 14px;padding:6px}.v3969-quick-thumb{width:56px}
  .v3969-quick-copy b{font-size:9px}.v3969-quick-copy small{font-size:6.8px}
}
`;
  document.head.appendChild(style)
}
function boot(){
  injectStyle();
  syncRoute();
  if(bound)return;
  bound=true;
  window.addEventListener("vsa:route-change",function(){setTimeout(syncRoute,0)});
  window.addEventListener("popstate",function(){setTimeout(syncRoute,0)});
  document.addEventListener("focusin",function(e){
    if(e.target&&e.target.id==="v39GlobalSearch")bindInput(e.target,"top");
    if(e.target&&e.target.id==="globalSearchInput"){bindInput(e.target,"main");ensureHint()}
  });
  document.addEventListener("click",function(e){
    if(e.target&&e.target.closest("[data-v3969-retry]")){scheduleFull(0);return}
    if(e.target&&e.target.closest("[data-v3969-worker]")){
      var pill=document.getElementById("v3982WorkerPill");
      if(pill){pill.click();return}
      try{if(typeof window.openToolsModal==="function")window.openToolsModal("settings29")}catch(_){}
    }
  });
  var searchSelector="#v39GlobalSearch,#globalSearchInput,#v397SearchShell,#v398MainRow,#searchScope,#v398Year,#v398Tier,#v398Sort";
  var syncQueued=false;
  function queueSync(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(function(){syncQueued=false;syncRoute()})
  }
  var observer=new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      var groups=[muts[i].addedNodes||[],muts[i].removedNodes||[]];
      for(var g=0;g<groups.length;g++)for(var j=0;j<groups[g].length;j++){
        var n=groups[g][j];
        if(!n||n.nodeType!==1)continue;
        if((n.matches&&n.matches(searchSelector))||(n.querySelector&&n.querySelector(searchSelector))){queueSync();return}
      }
    }
  });
  observer.observe(document.body,{childList:true,subtree:true})
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(boot,30)});
else setTimeout(boot,30);

window.VSASearch5={
  version:VERSION,
  schedule:function(){scheduleFull(0)},
  quick:function(){scheduleQuick()},
  refresh:syncRoute
};
})();
