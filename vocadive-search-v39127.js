/* VocaDive 39.127.0 · unified search filters + exhaustive title relation rescue */
(function(){
"use strict";
var VER="39.127.0",baseFreeSearch127=null,searchToken127=0,titleState127={query:"",key:"",total:0,seen:0,nextOffset:300,loading:false,done:false};
function q(sel,root){return (root||document).querySelector(sel)}
function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
function norm(v){
  try{return String(v||"").normalize("NFKC").toLowerCase().replace(/[\s　・･_\-—–~～!！?？"'“”‘’`´.,，。:：;；/\\|()\[\]{}【】「」『』〈〉《》<>]+/g,"")}
  catch(_){return String(v||"").toLowerCase().replace(/\s+/g,"")}
}
function coreTitle(v){
  var s=String(v||"").normalize?String(v||"").normalize("NFKC"):String(v||"");
  var meta=/(?:vocaloid|utau|synth(?:esizer)?\s*v|cevio|voisona|neutrino|voicevox|初音ミク|鏡音(?:リン|レン)?|巡音ルカ|重音テト|gumi|flower|可不|オリジナル|original|music\s*video|mv|pv)/i;
  for(var i=0;i<3;i++){
    s=s.replace(/^\s*[【\[][^[\]【】]{0,42}[】\]]\s*/,function(m){return meta.test(m)?"":m});
    s=s.replace(/\s*[【\[][^[\]【】]{0,42}[】\]]\s*$/,function(m){return meta.test(m)?"":m});
  }
  s=s.replace(/\s+(?:feat\.?|ft\.?)\s+.+$/ig," ");
  return s.trim()
}
function editRatio(a,b){
  a=norm(a);b=norm(b);if(!a||!b)return 0;if(a===b)return 1;
  if(a.length>72)a=a.slice(0,72);if(b.length>72)b=b.slice(0,72);
  var prev=new Array(b.length+1),cur=new Array(b.length+1);
  for(var j=0;j<=b.length;j++)prev[j]=j;
  for(var i=1;i<=a.length;i++){
    cur[0]=i;
    for(var k=1;k<=b.length;k++)cur[k]=Math.min(cur[k-1]+1,prev[k]+1,prev[k-1]+(a.charAt(i-1)===b.charAt(k-1)?0:1));
    var t=prev;prev=cur;cur=t
  }
  return 1-prev[b.length]/Math.max(a.length,b.length)
}
function titleTier(song,query){
  var nq=norm(query),raw=norm(song&&song.title),core=norm(coreTitle(song&&song.title));
  if(!nq)return 0;
  if(raw===nq||core===nq)return 6;
  if(core&&((core.startsWith(nq)&&nq.length>=2)||(nq.startsWith(core)&&core.length>=3)))return 5;
  if(raw.includes(nq)||core.includes(nq))return 5;
  var words=String(query||"").normalize("NFKC").toLowerCase().split(/[\s　・･_\-—–/]+/).map(function(x){return norm(x)}).filter(Boolean);
  if(words.length>1&&words.every(function(x){return raw.includes(x)||core.includes(x)}))return 4;
  var er=editRatio(nq,core||raw);
  if(er>=.88)return 4;
  if(er>=.76)return 3;
  if(er>=.64&&nq.length>=4)return 2;
  return song&&song.__v127TitleHit?1:0
}
function oldScore(song,query){
  try{if(typeof window.__VSA127_OLD_SCORE==="function")return window.__VSA127_OLD_SCORE(song,query)}catch(_){}
  try{if(typeof window.searchRelevanceScore124==="function")return window.searchRelevanceScore124(song,query)}catch(_){}
  return Math.min(900,Math.log10(Math.max(1,Number(song&&song.viewCounter)||1))*90)
}
function sortTie(a,b,sort){
  if(sort==="+viewCounter")return (+a.viewCounter||0)-(+b.viewCounter||0);
  if(sort==="-startTime")return new Date(b.startTime||0)-new Date(a.startTime||0);
  if(sort==="+startTime")return new Date(a.startTime||0)-new Date(b.startTime||0);
  if(sort==="-mylistCounter")return (+b.mylistCounter||0)-(+a.mylistCounter||0);
  if(sort==="-likeCounter")return (+b.likeCounter||0)-(+a.likeCounter||0);
  if(sort==="-commentCounter")return (+b.commentCounter||0)-(+a.commentCounter||0);
  return (+b.viewCounter||0)-(+a.viewCounter||0)
}
function sortRows(rows,query,sort){
  return (rows||[]).slice().sort(function(a,b){
    var ta=titleTier(a,query),tb=titleTier(b,query);
    if(tb!==ta)return tb-ta;
    var sa=oldScore(a,query),sb=oldScore(b,query);
    return (sb-sa)||sortTie(a,b,sort)
  })
}
function escapeHtml(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function addStyle(){
  if(document.getElementById("v39127SearchStyle"))return;
  var s=document.createElement("style");s.id="v39127SearchStyle";s.textContent=`
/* Search 5.0: one scope control, no blurred page. */
.v398-search-page .v3923-scope-chips,
.v398-search-page .v3923-search-more{display:none!important}
.v398-filter-backdrop.open{
 display:block!important;position:fixed!important;inset:0!important;z-index:28010!important;
 background:rgba(1,9,12,.18)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important
}
.v398-filter-sheet{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.v398-filter-sheet .v127-filter-note{grid-column:1/-1;margin-top:-2px;color:#6f918d;font-size:7px;line-height:1.45}
.v398-filter-sheet .v127-scope-status{display:flex;gap:5px;align-items:center;margin-top:6px;min-width:0}
.v398-filter-sheet .v127-scope-status span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#86aaa6;font-size:7px}
.v398-filter-sheet .v127-scope-status button{min-height:27px;padding:0 8px;border:0;border-radius:999px;background:#123138;color:#b9d7d3;font-size:6.5px;font-weight:900}
.v398-search-page #v398FilterToggle .v127-filter-label{max-width:88px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v398-search-page #songList .song.v127-exact-title{border-color:rgba(104,225,213,.23)!important;background:linear-gradient(90deg,rgba(11,49,55,.72),transparent)!important}
.v398-search-page #songList .song.v127-title-related:not(.v127-exact-title){background:linear-gradient(90deg,rgba(8,35,40,.34),transparent)!important}
.v398-search-page #songList .v127-match-badge{
 display:inline-flex;align-items:center;min-height:21px;margin:5px 5px 0 0;padding:0 7px;border-radius:999px;
 background:#123a40;color:#9ce6de;font-size:6.5px;font-weight:950
}
.v398-search-page #songList .v127-match-badge.exact{background:#e9f8f5;color:#071311}
.v398-search-page #songList .v127-result-divider{
 grid-column:1/-1;margin:9px 0 2px;padding:10px 2px 5px;border-top:1px solid rgba(155,211,205,.10);
 color:#77938f;font-size:8px;font-weight:900
}
.v398-search-page #songList .v127-result-divider strong{color:#c6dad7;font-size:10px;margin-right:6px}
#v127TitleMore{
 width:100%;min-height:42px;margin:8px 0 4px;border:1px solid rgba(111,207,198,.13);border-radius:12px;
 background:#0d272c;color:#b9d5d1;font-size:8px;font-weight:900
}
#v127TitleMore[disabled]{opacity:.55;cursor:wait}
#v127TitleInfo{display:block;margin:5px 1px 0;color:#6d918d;font-size:7px}
.v398-search-page #songList .song.v124-top-hit.v127-exact-title:before{content:"정확한 제목"!important;background:#eaf8f5!important;color:#071311!important}
@media(max-width:699px){
 .v398-filter-backdrop.open{background:rgba(1,9,12,.12)!important}
 .v398-filter-sheet{left:7px!important;right:7px!important;bottom:calc(76px + env(safe-area-inset-bottom))!important;max-height:min(72dvh,650px)!important}
 .v398-filter-grid{gap:9px!important}
 .v398-filter-head small{font-size:7px!important}
 .v398-search-page #songList .v127-result-divider{padding-left:4px}
}
`;
  document.head.appendChild(s)
}
function scopeLabel(){
  var s=document.getElementById("searchScope");
  return s&&s.selectedOptions&&s.selectedOptions[0]?String(s.selectedOptions[0].textContent||"").replace(/\s*오리지널곡만$/,""):"검색 범위"
}
function cleanDuplicateScopeUi(){
  qa(".v398-search-page .v3923-scope-chips,.v398-search-page .v3923-search-more").forEach(function(x){x.hidden=true;x.setAttribute("aria-hidden","true")})
}
function upgradeFilter(){
  cleanDuplicateScopeUi();
  var sheet=document.getElementById("v398FilterSheet"),scope=document.getElementById("searchScope"),toggle=document.getElementById("v398FilterToggle");
  if(!sheet||!scope)return;
  if(!sheet.querySelector(".v127-filter-note")){
    var grid=sheet.querySelector(".v398-filter-grid");
    if(grid){
      var note=document.createElement("div");note.className="v127-filter-note";note.textContent="검색 범위는 이 필터에서만 설정합니다. 화면 위의 예전 범위 버튼은 통합되어 더 이상 따로 표시하지 않습니다.";
      grid.appendChild(note)
    }
    var slot=document.getElementById("v398ScopeSlot");
    if(slot){
      var st=document.createElement("div");st.className="v127-scope-status";st.innerHTML='<span></span><button type="button" data-v127-scope-default>기본 범위</button>';slot.appendChild(st);
      st.querySelector("button").addEventListener("click",function(){
        scope.value="all_voice_synth";scope.dispatchEvent(new Event("change",{bubbles:true}))
      })
    }
  }
  var status=sheet.querySelector(".v127-scope-status span");if(status)status.textContent="현재 · "+scopeLabel();
  if(toggle){
    var label=toggle.querySelector(".v127-filter-label");
    if(!label){
      var first=toggle.querySelector("span:first-child");if(first){first.classList.add("v127-filter-label");label=first}
    }
    if(label)label.textContent="필터";
    toggle.title="검색 범위 · 연도 · 빙산 · 정렬"
  }
  if(!scope.dataset.v127){
    scope.dataset.v127="1";scope.addEventListener("change",function(){upgradeFilter()})
  }
}
function currentOptions(){
  var f={scope:"all_voice_synth",year:"all",tier:"",sort:"-viewCounter"};
  try{if(typeof currentSearchFilters398==="function")f=currentSearchFilters398()}catch(_){}
  var tier=null;
  try{if(f.tier&&typeof TIERS!=="undefined")tier=TIERS.find(function(x){return x.id===f.tier})||null}catch(_){}
  return{scope:f.scope||"all_voice_synth",year:f.year||"all",tier:tier,sort:f.sort||"-viewCounter",applyYear:!!(f.year&&f.year!=="all"),applyTier:!!f.tier}
}
async function fetchTitlePage(query,offset,sort){
  if(typeof fetchNico!=="function")return{data:[],meta:{totalCount:0}};
  var o=currentOptions();
  return fetchNico({
    tier:o.tier,year:o.year,sort:sort||"-viewCounter",limit:100,offset:offset||0,
    mode:"free",query:query,scope:"all",queryTargets:"title",
    applyYear:o.applyYear,applyTier:o.applyTier
  }).catch(function(){return{data:[],meta:{totalCount:0}}})
}
function keyFor(query){
  var o=currentOptions();
  return [String(query||""),o.year,o.tier&&o.tier.id||"",o.sort].join("|")
}
function mergeTitleRows(rows,query){
  if(!window.state||String(state.freeQuery||"")!==String(query||"")||state.listMode!=="free")return 0;
  var map=new Map((state.songs||[]).map(function(x){return[x.contentId,x]})),added=0;
  (rows||[]).forEach(function(s){
    if(!s||!s.contentId)return;
    s.__v127TitleHit=true;
    var prev=map.get(s.contentId);
    if(prev)map.set(s.contentId,Object.assign({},prev,s,{__v127TitleHit:true}));
    else{map.set(s.contentId,s);added++}
  });
  var o=currentOptions(),sorted=sortRows(Array.from(map.values()),query,o.sort);
  state.songs=sorted.map(function(x,i){return Object.assign({},x,{__rank:i+1,__v127TitleTier:titleTier(x,query)})});
  state.offset=state.songs.length;
  try{if(typeof renderSongs==="function")renderSongs()}catch(_){}
  setTimeout(patchResults,0);
  return added
}
async function expandInitial(query,token){
  if(!query||titleState127.loading)return;
  var key=keyFor(query);titleState127={query:query,key:key,total:0,seen:0,nextOffset:300,loading:true,done:false};
  updateMore();
  try{
    var first=await fetchTitlePage(query,0,"-viewCounter");
    if(token!==searchToken127||String(state&&state.freeQuery||"")!==query)return;
    var total=Number(first&&first.meta&&first.meta.totalCount)||0,rows=(first&&first.data)||[];
    var jobs=[];
    if(total>100)jobs.push(fetchTitlePage(query,100,"-viewCounter"));
    if(total>200)jobs.push(fetchTitlePage(query,200,"-viewCounter"));
    jobs.push(fetchTitlePage(query,0,"+viewCounter"));
    jobs.push(fetchTitlePage(query,0,"-startTime"));
    var extra=await Promise.all(jobs),all=rows.slice();
    extra.forEach(function(d){all=all.concat(d&&d.data||[])});
    if(token!==searchToken127||String(state&&state.freeQuery||"")!==query)return;
    var ded=new Map();all.forEach(function(s){if(s&&s.contentId)ded.set(s.contentId,s)});
    titleState127.total=total||ded.size;titleState127.seen=ded.size;titleState127.nextOffset=Math.min(Math.max(300,Math.ceil(Math.min(total||300,300)/100)*100),Math.max(300,total||300));
    mergeTitleRows(Array.from(ded.values()),query);
    titleState127.done=!!total&&titleState127.nextOffset>=total;
  }finally{
    titleState127.loading=false;updateMore();patchResults()
  }
}
async function loadMoreTitles(){
  if(titleState127.loading||titleState127.done||!titleState127.query)return;
  var query=titleState127.query,token=searchToken127,start=titleState127.nextOffset;
  titleState127.loading=true;updateMore();
  try{
    var total=titleState127.total||0,end=total?Math.min(total,start+400):start+400,jobs=[];
    for(var off=start;off<end;off+=100)jobs.push(fetchTitlePage(query,off,"-viewCounter"));
    var pages=await Promise.all(jobs),rows=[];pages.forEach(function(d){rows=rows.concat(d&&d.data||[]);if(!total)total=Number(d&&d.meta&&d.meta.totalCount)||total});
    if(token!==searchToken127||String(state&&state.freeQuery||"")!==query)return;
    var ded=new Map();rows.forEach(function(s){if(s&&s.contentId)ded.set(s.contentId,s)});
    mergeTitleRows(Array.from(ded.values()),query);
    titleState127.total=total||titleState127.total;titleState127.seen+=ded.size;titleState127.nextOffset=end;titleState127.done=!!titleState127.total&&end>=titleState127.total
  }finally{titleState127.loading=false;updateMore();patchResults()}
}
function ensureMoreHost(){
  var panel=document.getElementById("resultsPanel"),list=document.getElementById("songList");if(!panel||!list)return null;
  var btn=document.getElementById("v127TitleMore");
  if(!btn){
    var info=document.createElement("small");info.id="v127TitleInfo";
    btn=document.createElement("button");btn.id="v127TitleMore";btn.type="button";btn.addEventListener("click",loadMoreTitles);
    list.insertAdjacentElement("afterend",info);info.insertAdjacentElement("afterend",btn)
  }
  return btn
}
function updateMore(){
  var btn=ensureMoreHost(),info=document.getElementById("v127TitleInfo");if(!btn)return;
  var active=!!titleState127.query,total=titleState127.total||0;
  if(info){
    if(!active)info.textContent="";
    else if(total)info.textContent="제목 검색에서 "+total.toLocaleString("ko-KR")+"건 확인 · 같은 제목과 가까운 제목을 결과 상단에 우선 배치";
    else info.textContent="제목 관련 결과를 추가로 확인하는 중…"
  }
  btn.hidden=!active||titleState127.done||(!titleState127.loading&&total>0&&titleState127.nextOffset>=total);
  btn.disabled=!!titleState127.loading;
  btn.textContent=titleState127.loading?"제목 관련 결과 확인 중…":"제목 관련 결과 더 보기"
}
function patchResults(){
  upgradeFilter();
  var list=document.getElementById("songList");if(!list||!window.state)return;
  qa(".v127-result-divider",list).forEach(function(x){x.remove()});
  var query=String(state.freeQuery||"").trim(),cards=qa(".song[data-content-id]",list),firstWeak=null,titleCount=0,exactCount=0;
  cards.forEach(function(card){
    var s=(state.songs||[]).find(function(x){return x&&x.contentId===card.dataset.contentId}),tier=titleTier(s,query);
    card.classList.toggle("v127-exact-title",tier===6);
    card.classList.toggle("v127-title-related",tier>0);
    card.querySelectorAll(".v127-match-badge").forEach(function(x){x.remove()});
    if(tier>0){
      titleCount++;if(tier===6)exactCount++;
      var target=card.querySelector(".song-title"),badge=document.createElement("span");badge.className="v127-match-badge"+(tier===6?" exact":"");badge.textContent=tier===6?"정확한 제목":tier>=5?"제목 포함":tier>=3?"유사 제목":"제목 관련";
      if(target)target.insertAdjacentElement("afterend",badge)
    }else if(!firstWeak)firstWeak=card
  });
  if(firstWeak&&titleCount){
    var div=document.createElement("div");div.className="v127-result-divider";div.innerHTML='<strong>그 외 결과</strong> 태그·설명·P·보컬 등에서 검색어와 연결된 결과';firstWeak.parentNode.insertBefore(div,firstWeak)
  }
  var sum=document.getElementById("v398ResultSummary");
  if(sum&&query&&cards.length)sum.textContent=(exactCount?("정확한 제목 "+exactCount+"곡 · "):"")+"제목 관련 "+titleCount+"곡 · 전체 "+cards.length+"곡";
  updateMore()
}
function patchFreeSearch(){
  if(window.__VSA127_FREE_PATCHED)return;
  var fn=window.freeSearch;if(typeof fn!=="function")return;
  window.__VSA127_FREE_PATCHED=true;baseFreeSearch127=fn;
  window.freeSearch=async function(reset){
    var args=arguments,result=await baseFreeSearch127.apply(this,args);
    var query="";
    try{query=String(state&&state.freeQuery||"").trim()}catch(_){}
    if(reset&&query){
      var token=++searchToken127;
      titleState127={query:query,key:keyFor(query),total:0,seen:0,nextOffset:300,loading:false,done:false};
      setTimeout(function(){expandInitial(query,token)},0)
    }else setTimeout(patchResults,0);
    return result
  }
}
function improveLiveScore(){
  if(window.__VSA127_SCORE_PATCHED)return;
  var old=window.VSAQueryScore124;
  if(typeof old!=="function")return;
  window.__VSA127_SCORE_PATCHED=true;window.__VSA127_OLD_SCORE=old;
  window.VSAQueryScore124=function(song,query){return titleTier(song,query)*1000000+old(song,query)}
}
function observe(){
  var root=document.getElementById("toolsModal")||document.body;if(!root)return;
  var timer=0,mo=new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(function(){upgradeFilter();patchResults()},20)});
  mo.observe(root,{childList:true,subtree:true});return mo
}
function boot(){
  addStyle();patchFreeSearch();improveLiveScore();upgradeFilter();patchResults();obs=observe();
  window.addEventListener("vsa:route-change",function(e){if(!e||!e.detail||e.detail.route==="search29")setTimeout(function(){patchFreeSearch();upgradeFilter();patchResults()},0)});
}
window.VSASearch39127={version:VER,refresh:function(){patchFreeSearch();upgradeFilter();patchResults()},titleTier:titleTier};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();