/* VocaDive Universe Search v39.4 · Universe 3.0 bridge */
(function(){
"use strict";
var recentKey="vsa.universe.search.v28";
var results=[];

function esc(v){
  return String(v==null?"":v).replace(/[&<>"']/g,function(m){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
  });
}
function fmt(v){
  var n=Number(v);
  return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-";
}
function recent(){
  try{return JSON.parse(localStorage.getItem(recentKey)||"[]")||[];}catch(e){return [];}
}
function remember(q){
  var a=recent().filter(function(x){return x!==q;});
  a.unshift(q);
  try{localStorage.setItem(recentKey,JSON.stringify(a.slice(0,8)));}catch(e){}
}
function localPool(){
  var map=new Map();
  try{
    [state.songs,state.tasteSongs,state.guideSongs,state.hiddenGems,state.hiddenGemPool,state.detectiveCandidates].forEach(function(group){
      if(!Array.isArray(group))return;
      group.forEach(function(item){
        var song=item&&item.song?item.song:item;
        if(song&&song.contentId)map.set(song.contentId,song);
      });
    });
    if(state.universeData&&Array.isArray(state.universeData.nodes)){
      state.universeData.nodes.forEach(function(song){
        if(song&&song.contentId)map.set(song.contentId,song);
      });
    }
  }catch(e){}
  try{
    var org=JSON.parse(localStorage.getItem("vsa.organizer.v22")||"null");
    Object.values(org&&org.library||{}).forEach(function(item){
      if(item.song&&item.song.contentId)map.set(item.song.contentId,item.song);
    });
  }catch(e){}
  return Array.from(map.values());
}
function localScore(song,q){
  var needle=q.toLowerCase();
  var title=String(song.title||"").toLowerCase();
  var desc=String(song.description||"").toLowerCase();
  var tag=Array.isArray(song.tags)?song.tags.join(" ").toLowerCase():String(song.tags||"").toLowerCase();
  var id=String(song.contentId||"").toLowerCase();
  if(id===needle)return 100;
  if(title===needle)return 90;
  var score=0;
  if(title.indexOf(needle)>=0)score+=45;
  if(id.indexOf(needle)>=0)score+=40;
  if(tag.indexOf(needle)>=0)score+=25;
  if(desc.indexOf(needle)>=0)score+=10;
  return score;
}
function localSearch(q){
  return localPool().map(function(song){return {song:song,score:localScore(song,q)};})
    .filter(function(x){return x.score>0;})
    .sort(function(a,b){return b.score-a.score;})
    .slice(0,12).map(function(x){return x.song;});
}
async function remoteSearch(q,scope){
  var isId=/^(sm|nm|so|lv)?\d+$/i.test(q);
  var targets=isId?["contentId","title,description,tags"]:["title,description,tags","tags"];
  for(var i=0;i<targets.length;i++){
    try{
      var data=await fetchNico({
        year:"all",limit:30,offset:0,mode:"free",query:q,scope:scope||"all_voice_synth",
        queryTargets:targets[i],sort:"-viewCounter",applyYear:false,applyTier:false
      });
      if(data.data&&data.data.length)return data.data;
    }catch(e){}
  }
  return [];
}
function merge(a,b){
  var map=new Map();
  a.concat(b).forEach(function(song){
    if(song&&song.contentId&&!map.has(song.contentId))map.set(song.contentId,song);
  });
  var rows=Array.from(map.values());
  try{if(window.VSA37DiscoveryOriginalRows)rows=window.VSA37DiscoveryOriginalRows(rows,"universe_search").rows}catch(e){}
  try{if(window.VSA37AdultFilterRows)rows=window.VSA37AdultFilterRows(rows,"universe_search").rows}catch(e){}
  return rows.slice(0,24);
}
function renderRecent(){
  var box=document.getElementById("universeRecent");
  if(!box)return;
  var a=recent();
  if(!a.length){
    box.innerHTML="<span>최근 검색 없음</span>";
    return;
  }
  box.innerHTML=a.map(function(q){
    return '<button type="button" data-us-recent="'+esc(q)+'">'+esc(q)+'</button>';
  }).join("");
}
function render(rows){
  results=rows;
  var shell=document.getElementById("universeSearchBar");
  if(shell)shell.classList.add("has-results");
  var box=document.getElementById("universeSearchResults");
  var status=document.getElementById("universeSearchStatus");
  if(status)status.textContent=rows.length?rows.length+"곡 찾음 · 중심곡을 선택하세요":"검색 결과 없음";
  if(!box)return;
  if(!rows.length){
    box.innerHTML='<div class="us-empty">검색 결과가 없습니다.<br><small>곡명·P명·보컬·태그·sm번호를 바꿔보세요.</small></div>';
    return;
  }
  box.innerHTML=rows.map(function(song,i){
    var year=song.startTime?new Date(song.startTime).getFullYear():"-";
    var raw=Array.isArray(song.tags)?song.tags:String(song.tags||"").split(/[\s,、]+/);
    var tagText=raw.filter(Boolean).slice(0,3).map(esc).join(" · ");
    var img=song.thumbnailUrl?'<img src="'+esc(song.thumbnailUrl)+'" loading="lazy" alt="">':'<span class="us-noimg">♪</span>';
    return '<button type="button" class="us-result" data-us-index="'+i+'">'+img+
      '<span class="us-copy"><b>'+esc(song.title||song.contentId)+'</b><small>'+esc(song.contentId)+' · '+year+' · 조회 '+fmt(song.viewCounter||0)+'</small><i>'+tagText+'</i></span>'+
      '<strong>우주 생성 ›</strong></button>';
  }).join("");
}
async function runSearch(){
  var input=document.getElementById("universeSearchInput");
  var scope=document.getElementById("universeSearchScope");
  var status=document.getElementById("universeSearchStatus");
  var button=document.getElementById("universeSearchBtn");
  var q=input?input.value.trim():"";
  if(!q)return;
  remember(q);
  renderRecent();
  if(button)button.disabled=true;
  if(status)status.textContent="우주 중심곡을 찾는 중…";
  var local=localSearch(q);
  var remote=[];
  try{
    if(typeof relayBase!=="function"||relayBase()){
      remote=await remoteSearch(q,scope?scope.value:"all_voice_synth");
    }
  }catch(e){}
  render(merge(local,remote));
  if(button)button.disabled=false;
}
function choose(index){
  var song=results[index];
  if(!song)return;
  try{
    state.universeCenter=song;
    buildUniverse(song,false);
    var status=document.getElementById("universeSearchStatus");
    if(status)status.textContent="중심곡: "+(song.title||song.contentId)+" · 우주 생성 중";
    var stage=document.querySelector(".universe-stage");
    if(stage)stage.scrollIntoView({behavior:"smooth",block:"center"});
  }catch(e){
    try{toast("우주를 만들지 못했습니다.");}catch(_){}
  }
}
function addStyle(){
  if(document.getElementById("universeSearchStyle"))return;
  var style=document.createElement("style");
  style.id="universeSearchStyle";
  style.textContent=[
    ".v394-universe-panel .universe-search{display:block;margin:0 0 10px;padding:10px;border:1px solid rgba(113,209,200,.13);border-radius:15px;background:linear-gradient(145deg,rgba(10,39,46,.94),rgba(7,29,35,.94));box-shadow:none}",
    ".v394-universe-panel .us-main{min-width:0}.v394-universe-panel .us-title{display:flex;align-items:end;justify-content:space-between;gap:12px}.v394-universe-panel .us-title b{display:block;color:#eafffb;font-size:10px}.v394-universe-panel .us-title small{display:block;margin-top:2px;color:#6f9692;font-size:7px}",
    ".v394-universe-panel .us-row{display:grid;grid-template-columns:minmax(0,1fr) 165px auto;gap:7px;margin-top:8px}.v394-universe-panel .us-row input,.v394-universe-panel .us-row select{min-width:0;min-height:41px!important;border:1px solid rgba(121,206,199,.20)!important;border-radius:11px!important;background:#071f25!important;color:#effbf9!important;padding:0 10px!important}.v394-universe-panel .us-row select option{background:#0b252c;color:#eaf9f6}.v394-universe-panel .us-row button{min-height:41px;padding:0 15px;border:0;border-radius:11px;background:linear-gradient(135deg,#6edfd4,#758ff0);color:#061719;font-size:9px;font-weight:950}",
    ".v394-universe-panel .us-recent{display:flex;gap:4px;align-items:center;overflow-x:auto;margin-top:6px;min-height:24px;scrollbar-width:none}.v394-universe-panel .us-recent::-webkit-scrollbar{display:none}.v394-universe-panel .us-recent:before{content:'최근';flex:0 0 auto;font-size:7px;color:#547b78;margin-right:2px}.v394-universe-panel .us-recent button{flex:0 0 auto;min-height:24px;border:1px solid #24484e;border-radius:999px;padding:0 7px;background:#0a262c;color:#8fb9b5;font-size:7px}.v394-universe-panel .us-recent span{font-size:7px;color:#557875}.v394-universe-panel .us-status{margin-top:4px;font-size:7px;color:#668f8b}",
    ".v394-universe-panel .us-results{display:flex;gap:7px;overflow-x:auto;overflow-y:hidden;margin-top:9px;padding:1px 1px 4px;scrollbar-width:none}.v394-universe-panel .us-results::-webkit-scrollbar{display:none}.v394-universe-panel .universe-search:not(.has-results) .us-results{display:none}",
    ".v394-universe-panel .us-result{flex:0 0 min(360px,42vw);min-width:0;display:grid;grid-template-columns:82px minmax(0,1fr);gap:8px;align-items:center;padding:7px;border:1px solid rgba(112,205,197,.14);border-radius:12px;background:#0a2930;color:#dff5f1;text-align:left}.v394-universe-panel .us-result:hover{border-color:rgba(111,225,213,.36);background:#10343b}.v394-universe-panel .us-result img,.v394-universe-panel .us-noimg{width:82px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#123037;display:grid;place-items:center}.v394-universe-panel .us-copy{min-width:0}.v394-universe-panel .us-copy b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v394-universe-panel .us-copy small,.v394-universe-panel .us-copy i{display:block;margin-top:2px;font-size:7px;color:#719492;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:normal}.v394-universe-panel .us-result strong{grid-column:2;font-size:7px;color:#75ded4;white-space:nowrap}.v394-universe-panel .us-empty{flex:1 0 100%;min-height:62px;display:grid;place-items:center;text-align:center;color:#678b88;font-size:8px;border:1px dashed #24464c;border-radius:11px}",
    "@media(max-width:699px){.v394-universe-panel .universe-search{padding:8px}.v394-universe-panel .us-title small{display:none}.v394-universe-panel .us-row{grid-template-columns:1fr auto}.v394-universe-panel .us-row input{grid-column:1/-1}.v394-universe-panel .us-row select{min-height:39px!important}.v394-universe-panel .us-row button{min-height:39px}.v394-universe-panel .us-result{flex-basis:min(84vw,330px);grid-template-columns:72px minmax(0,1fr)}.v394-universe-panel .us-result img,.v394-universe-panel .us-noimg{width:72px}}"
  ].join("");
  document.head.appendChild(style);
}
function inject(){
  var panel=document.getElementById("universePanel");
  var layout=panel&&panel.querySelector(".universe-layout");
  if(!panel||!layout||document.getElementById("universeSearchBar"))return;
  var wrap=document.createElement("div");
  wrap.id="universeSearchBar";
  wrap.className="universe-search";
  wrap.innerHTML=
    '<div class="us-main"><div class="us-title"><b>중심곡 검색</b><small>곡명·P명·보컬·태그·sm번호로 새 중심곡을 찾습니다.</small></div>'+
    '<div class="us-row"><input id="universeSearchInput" placeholder="곡명 · P명 · 보컬 · 태그 · sm번호">'+
    '<select id="universeSearchScope"><option value="all_voice_synth">음성합성 전체</option><option value="vocaloid">VOCALOID</option><option value="utau">UTAU</option><option value="synthv">Synthesizer V</option><option value="cevio">CeVIO</option><option value="voisona">VoiSona</option><option value="neutrino">NEUTRINO</option><option value="voicevox">VOICEVOX</option></select>'+
    '<button type="button" id="universeSearchBtn">검색</button></div>'+
    '<div class="us-recent" id="universeRecent"></div><div class="us-status" id="universeSearchStatus">곡명·P명·보컬·태그·sm번호로 중심곡을 검색할 수 있습니다.</div></div>'+
    '<div class="us-results" id="universeSearchResults"><div class="us-empty">검색하면 후보곡이 여기에 표시됩니다.</div></div>';
  var journey=document.getElementById("v39UniverseJourney");
  panel.insertBefore(wrap,journey||layout);
  renderRecent();
  document.getElementById("universeSearchBtn").addEventListener("click",runSearch);
  document.getElementById("universeSearchInput").addEventListener("keydown",function(e){if(e.key==="Enter")runSearch();});
  wrap.addEventListener("click",function(e){
    var result=e.target.closest("[data-us-index]");
    if(result){choose(Number(result.dataset.usIndex));return;}
    var chip=e.target.closest("[data-us-recent]");
    if(chip){
      document.getElementById("universeSearchInput").value=chip.dataset.usRecent;
      runSearch();
    }
  });
}
function boot(){addStyle();inject();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();