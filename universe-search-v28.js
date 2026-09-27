/* VocaDive Dive Start v39.54 · Search Recall 2.0 */
(function(){
"use strict";
var recentKey="vsa.universe.search.v28";
var results=[];
function diveMode53(){try{return window.VSA53DiveContent?window.VSA53DiveContent.get():"original"}catch(e){return "original"}}
function diveModeLabel53(){try{return window.VSA53DiveContent?window.VSA53DiveContent.label(diveMode53()):"오리지널곡"}catch(e){return "오리지널곡"}}
function filterDiveRows53(rows,context){try{return window.VSA53DiveFilterRows?window.VSA53DiveFilterRows(rows,context,diveMode53()).rows:rows}catch(e){return rows}}
function randomQuery53(){
  var m=diveMode53();
  if(m==="cover")return "歌ってみた OR カバー曲 OR VOCALOIDカバー曲 OR UTAUカバー曲 OR SynthesizerVカバー曲 OR cover";
  if(m==="derivative")return "歌ってみた OR カバー曲 OR 踊ってみた OR 演奏してみた OR 弾いてみた OR 吹いてみた OR MMD OR ニコカラ";
  return "オリジナル曲"
}
function syncDiveType53(){
  var mode=diveMode53(),scope=document.getElementById("universeSearchScope");
  document.querySelectorAll("[data-us-type]").forEach(function(b){b.classList.toggle("active",b.dataset.usType===mode)});
  if(scope){
    if(mode==="original"){
      scope.disabled=false;
      if(scope.value==="all")scope.value="all_voice_synth"
    }else{
      scope.value="all";scope.disabled=true
    }
  }
  var badge=document.getElementById("universeTypeHint");
  if(badge)badge.textContent=mode==="original"?"기본 · 오리지널곡만":mode==="cover"?"별도 · 歌ってみた/커버만":"별도 · 커버/연주/댄스/MMD 등 파생"
}

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
function normalizedSearchText(v){
  return String(v==null?"":v).normalize("NFKC").trim().toLowerCase()
}
function exactSongMatch(song,q){
  var n=normalizedSearchText(q);
  return normalizedSearchText(song&&song.contentId)===n||normalizedSearchText(song&&song.title)===n
}
function compactTitle54(v){return normalizedSearchText(v).replace(/[\s　・·_\-—–:：/／\\|｜()[\]{}【】『』「」"'!?！？.,，。]+/g,"")}
function strongTitleMatch54(song,q){
  var n=normalizedSearchText(q),title=normalizedSearchText(song&&song.title),id=normalizedSearchText(song&&song.contentId);
  if(!n)return false;
  if(id===n||title===n)return true;
  var cq=compactTitle54(q),ct=compactTitle54(song&&song.title);
  if(cq.length>=3&&ct.indexOf(cq)>=0)return true;
  return title.indexOf(n)>=0
}
function scopeMatch54(song,scope){
  if(!scope||scope==="all"||scope==="all_voice_synth")return true;
  try{return typeof songMatchesScope==="function"?songMatchesScope(song,scope):true}catch(e){return true}
}
function originalRecallEvidence54(song,q,scope){
  if(!strongTitleMatch54(song,q)||!scopeMatch54(song,scope))return false;
  try{
    var ev=window.VSA54DiveSearchOriginalEvidence?window.VSA54DiveSearchOriginalEvidence(song):null;
    return !!(ev&&ev.ok)
  }catch(e){return false}
}
async function remoteSearch(q,scope){
  var isId=/^(sm|nm|so|lv)?\d+$/i.test(q),selected=scope||"all_voice_synth",contentMode=diveMode53();
  var targets=isId?["contentId","title,description,tags"]:["title","title,description,tags","tags"];
  var scopes=contentMode==="original"?(selected==="all"?["all"]:[selected,"all"]):["all"];
  var out=[],seen=new Set();remoteSearch.expanded=false;remoteSearch.recallAttempted=false;
  for(var s=0;s<scopes.length;s++){
    var sc=scopes[s];
    for(var i=0;i<targets.length;i++){
      try{
        var data=await fetchNico({
          year:"all",limit:50,offset:0,mode:"free",query:q,scope:sc,
          queryTargets:targets[i],sort:"-viewCounter",applyYear:false,applyTier:false
        });
        (data.data||[]).forEach(function(song){
          if(song&&song.contentId&&!seen.has(song.contentId)){seen.add(song.contentId);out.push(song)}
        });
        if(out.some(function(song){return exactSongMatch(song,q)}))break
      }catch(e){}
    }
    if(out.some(function(song){return exactSongMatch(song,q)}))break;
    if(selected==="all"&&out.length)break;
    if(s===1&&out.length)remoteSearch.expanded=true
  }
  if(contentMode==="original"){
    var hasRescuable=out.some(function(song){
      if(!strongTitleMatch54(song,q))return false;
      try{return filterDiveRows53([song],"universe_search_probe").length>0||originalRecallEvidence54(song,q,selected)}catch(e){return false}
    });
    if(!hasRescuable){
      remoteSearch.recallAttempted=true;
      try{
        var broad=await fetchNico({
          year:"all",limit:100,offset:0,mode:"free",query:q,scope:"all",
          queryTargets:"title",sort:"-viewCounter",applyYear:false,applyTier:false
        });
        (broad.data||[]).forEach(function(song){
          if(!song||!song.contentId||seen.has(song.contentId))return;
          if(originalRecallEvidence54(song,q,selected)){
            song.__diveRecall54=true;seen.add(song.contentId);out.push(song)
          }
        })
      }catch(e){}
      if(!out.some(function(song){return song&&song.__diveRecall54})){
        try{
          var broad2=await fetchNico({
            year:"all",limit:100,offset:0,mode:"free",query:q,scope:"all",
            queryTargets:"title,description,tags",sort:"-viewCounter",applyYear:false,applyTier:false
          });
          (broad2.data||[]).forEach(function(song){
            if(!song||!song.contentId||seen.has(song.contentId))return;
            if(originalRecallEvidence54(song,q,selected)){
              song.__diveRecall54=true;seen.add(song.contentId);out.push(song)
            }
          })
        }catch(e){}
      }
    }
  }
  return out;
}
function merge(a,b,q,scope){
  var map=new Map();
  a.concat(b).forEach(function(song){
    if(song&&song.contentId&&!map.has(song.contentId))map.set(song.contentId,song);
  });
  var raw=Array.from(map.values()),rows=[],rejected=0,rescued=0,mode=diveMode53();
  raw.forEach(function(song){
    var strict=filterDiveRows53([song],"universe_search_one").length>0;
    if(strict){rows.push(song);return}
    if(mode==="original"&&originalRecallEvidence54(song,q,scope)){
      song.__diveRecall54=true;rows.push(song);rescued++;return
    }
    rejected++
  });
  var exact=rows.filter(function(song){return exactSongMatch(song,q)}),
      strong=rows.filter(function(song){return !exactSongMatch(song,q)&&strongTitleMatch54(song,q)}),
      rest=rows.filter(function(song){return !exactSongMatch(song,q)&&!strongTitleMatch54(song,q)});
  rows=exact.concat(strong,rest);
  try{if(window.VSA37AdultFilterRows)rows=window.VSA37AdultFilterRows(rows,"universe_search").rows}catch(e){}
  merge.lastStats={raw:raw.length,kept:rows.length,rescued:rescued,rejected:rejected,recall:!!remoteSearch.recallAttempted};
  return rows.slice(0,30);
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
  if(status){
    var stats=merge.lastStats||{};
    status.textContent=rows.length
      ? rows.length+"곡 찾음"+(stats.rescued?" · 태그 누락 원곡 "+stats.rescued+"곡 확장 판정":"")+" · 중심곡을 선택하세요"
      : "검색 결과 없음"+(stats.recall?" · 니코동 전체까지 재검색했지만 원곡 증거를 확인하지 못했습니다.":"");
  }
  if(!box)return;
  if(!rows.length){
    box.innerHTML='<div class="us-empty">검색 결과가 없습니다.<br><small>오리지널곡 모드는 니코동 전체 제목까지 재검색합니다. 그래도 없으면 sm번호·P명 또는 다른 표기로 검색해보세요.</small></div>';
    return;
  }
  box.innerHTML=rows.map(function(song,i){
    var year=song.startTime?new Date(song.startTime).getFullYear():"-";
    var raw=Array.isArray(song.tags)?song.tags:String(song.tags||"").split(/[\s,、]+/);
    var tagText=raw.filter(Boolean).slice(0,3).map(esc).join(" · ");
    var img=song.thumbnailUrl?'<img src="'+esc(song.thumbnailUrl)+'" loading="lazy" alt="">':'<span class="us-noimg">♪</span>';
    var recall=song.__diveRecall54?'<em class="us-recall">확장 판정</em>':"";
    return '<button type="button" class="us-result" data-us-index="'+i+'">'+img+
      '<span class="us-copy"><b>'+esc(song.title||song.contentId)+recall+'</b><small>'+esc(song.contentId)+' · '+year+' · 조회 '+fmt(song.viewCounter||0)+'</small><i>'+tagText+'</i></span>'+
      '<strong>다이브 시작 ›</strong></button>';
  }).join("");
}
async function runSearch(){
  var shell=document.getElementById("universeSearchBar");if(shell)shell.classList.remove("center-selected");
  var input=document.getElementById("universeSearchInput");
  var scope=document.getElementById("universeSearchScope");
  var status=document.getElementById("universeSearchStatus");
  var button=document.getElementById("universeSearchBtn");
  var q=input?input.value.trim():"";
  if(!q)return;
  remember(q);
  renderRecent();
  if(button)button.disabled=true;
  if(status)status.textContent=diveModeLabel53()+" 기준으로 시작곡을 찾는 중…";
  var local=filterDiveRows53(localSearch(q),"universe_search_local");
  var remote=[];
  try{
    if(typeof relayBase!=="function"||relayBase()){
      remote=await remoteSearch(q,scope?scope.value:"all_voice_synth");
    }
  }catch(e){}
  var selectedScope=scope?scope.value:"all_voice_synth";
  var merged=merge(local,remote,q,selectedScope);
  render(merged);
  if(status&&merged.length&&remoteSearch.expanded&&!(merge.lastStats&&merge.lastStats.rescued))status.textContent=merged.length+"곡 찾음 · 선택 범위에서 없어 니코동 전체까지 찾았습니다.";
  if(button)button.disabled=false;
}

async function randomStart(){
  var button=document.getElementById("universeRandomStartBtn");
  var status=document.getElementById("universeSearchStatus");
  if(button&&button.disabled)return;
  if(button)button.disabled=true;
  if(status)status.textContent="랜덤 시작곡을 찾는 중…";
  var recentIds=new Set();
  try{(state.universeHistory||[]).slice(-12).forEach(function(x){if(x&&x.contentId)recentIds.add(x.contentId)})}catch(e){}
  var local=filterDiveRows53(localPool(),"universe_random_local").filter(function(x){return x&&x.contentId&&!recentIds.has(x.contentId)});
  var bands=[
    {name:"수면층",min:1000000,max:null},
    {name:"얕은층",min:250000,max:999999},
    {name:"중층",min:50000,max:249999},
    {name:"심층",min:5000,max:49999},
    {name:"심해층",min:0,max:4999}
  ];
  // 매번 시작 수층을 섞어서 수면/심해 한쪽으로 몰리지 않게 한다.
  bands.sort(function(){return Math.random()-.5});
  try{
    if(typeof relayBase==="function"&&relayBase()){
      for(var bi=0;bi<bands.length;bi++){
        var band=bands[bi],filters={viewCounter:{gte:band.min}},rq=randomQuery53();
        if(band.max!=null)filters.viewCounter.lte=band.max;
        var probe=await fetchNico({year:"all",limit:1,offset:0,mode:"ranking",sort:"-viewCounter",applyYear:false,applyTier:false,numericFilters:filters,overrideQuery:rq,overrideTargets:"tags"});
        var total=probe&&probe.meta?+probe.meta.totalCount||0:0;
        if(!total)continue;
        var span=Math.max(0,Math.min(total-1,1500)),offset=Math.floor(Math.random()*(span+1));
        var data=await fetchNico({year:"all",limit:30,offset:offset,mode:"ranking",sort:"-viewCounter",applyYear:false,applyTier:false,numericFilters:filters,overrideQuery:rq,overrideTargets:"tags"});
        var rows=filterDiveRows53(data.data||[],"universe_random_start").filter(function(x){return x&&x.contentId&&!recentIds.has(x.contentId)});
        try{if(window.VSA37AdultFilterRows)rows=window.VSA37AdultFilterRows(rows,"universe_random_start").rows}catch(e){}
        if(!rows.length)continue;
        var song=rows[Math.floor(Math.random()*rows.length)];
        state.universeCenter=song;
        await Promise.resolve(buildUniverse(song,false));
        var shell=document.getElementById("universeSearchBar");if(shell)shell.classList.add("center-selected");
        if(status)status.textContent="랜덤 시작 · "+diveModeLabel53()+" · "+band.name+" · "+(song.title||song.contentId);
        var stage=document.querySelector(".universe-stage");if(stage)stage.scrollIntoView({behavior:"smooth",block:"start"});
        return
      }
    }
    if(local.length){
      var song=local[Math.floor(Math.random()*local.length)];
      state.universeCenter=song;
      await Promise.resolve(buildUniverse(song,false));
      var shell=document.getElementById("universeSearchBar");if(shell)shell.classList.add("center-selected");
      if(status)status.textContent="랜덤 시작 · 보관된 후보 · "+(song.title||song.contentId);
      var stage=document.querySelector(".universe-stage");if(stage)stage.scrollIntoView({behavior:"smooth",block:"start"});
      return
    }
    if(status)status.textContent="랜덤 시작 후보를 찾지 못했습니다. Worker 연결 또는 검색 결과를 확인해 주세요.";
  }catch(e){
    if(status)status.textContent="랜덤 시작 실패 · "+String(e&&e.message?e.message:e);
  }finally{
    if(button)button.disabled=false
  }
}

function choose(index){
  var song=results[index];
  if(!song)return;
  try{
    state.universeCenter=song;
    buildUniverse(song,false);
    var shell=document.getElementById("universeSearchBar");if(shell)shell.classList.add("center-selected");
    var status=document.getElementById("universeSearchStatus");
    if(status)status.textContent="중심곡: "+(song.title||song.contentId)+" · 다이브 준비 중";
    var stage=document.querySelector(".universe-stage");
    if(stage)stage.scrollIntoView({behavior:"smooth",block:"center"});
  }catch(e){
    try{toast("다이브를 시작하지 못했습니다.");}catch(_){}
  }
}
function addStyle(){
  if(document.getElementById("universeSearchStyle"))return;
  var style=document.createElement("style");
  style.id="universeSearchStyle";
  style.textContent=[
    ".v394-universe-panel .universe-search{display:block;margin:0 0 10px;padding:10px;border:1px solid rgba(113,209,200,.13);border-radius:15px;background:linear-gradient(145deg,rgba(10,39,46,.94),rgba(7,29,35,.94));box-shadow:none}",
    ".v394-universe-panel .us-main{min-width:0}.v394-universe-panel .us-title{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.v394-universe-panel .us-title b{display:block;color:#eafffb;font-size:10px}.v394-universe-panel .us-title small{display:block;margin-top:2px;color:#6f9692;font-size:7px}.v394-universe-panel .us-random-start{min-height:37px;padding:0 12px;border:1px solid rgba(111,223,212,.28);border-radius:11px;background:linear-gradient(135deg,#12444b,#263e72);color:#effffc;font-size:8px;font-weight:950;white-space:nowrap}.v394-universe-panel .us-random-start:disabled{opacity:.5}",
    ".v394-universe-panel .us-types{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-top:8px}.v394-universe-panel .us-types button{min-height:31px;padding:0 9px;border:1px solid #285159;border-radius:999px;background:#08252c;color:#8eb5b1;font-size:7px;font-weight:900}.v394-universe-panel .us-types button.active{border-color:#5fcac0;background:#15444b;color:#effffc}.v394-universe-panel .us-types button em{margin-left:3px;color:#71ded3;font-size:5.5px;font-style:normal}.v394-universe-panel .us-types span{margin-left:auto;color:#628b87;font-size:6.5px}.v394-universe-panel .us-row{display:grid;grid-template-columns:minmax(0,1fr) 165px auto;gap:7px;margin-top:8px}.v394-universe-panel .us-row input,.v394-universe-panel .us-row select{min-width:0;min-height:41px!important;border:1px solid rgba(121,206,199,.20)!important;border-radius:11px!important;background:#071f25!important;color:#effbf9!important;padding:0 10px!important}.v394-universe-panel .us-row select option{background:#0b252c;color:#eaf9f6}.v394-universe-panel .us-row button{min-height:41px;padding:0 15px;border:0;border-radius:11px;background:linear-gradient(135deg,#6edfd4,#758ff0);color:#061719;font-size:9px;font-weight:950}",
    ".v394-universe-panel .us-recent{display:flex;gap:4px;align-items:center;overflow-x:auto;margin-top:6px;min-height:24px;scrollbar-width:none}.v394-universe-panel .us-recent::-webkit-scrollbar{display:none}.v394-universe-panel .us-recent:before{content:'최근';flex:0 0 auto;font-size:7px;color:#547b78;margin-right:2px}.v394-universe-panel .us-recent button{flex:0 0 auto;min-height:24px;border:1px solid #24484e;border-radius:999px;padding:0 7px;background:#0a262c;color:#8fb9b5;font-size:7px}.v394-universe-panel .us-recent span{font-size:7px;color:#557875}.v394-universe-panel .us-status{margin-top:4px;font-size:7px;color:#668f8b}",
    ".v394-universe-panel .us-results{display:flex;gap:7px;overflow-x:auto;overflow-y:hidden;margin-top:9px;padding:1px 1px 4px;scrollbar-width:none}.v394-universe-panel .us-results::-webkit-scrollbar{display:none}.v394-universe-panel .universe-search:not(.has-results) .us-results{display:none}.v394-universe-panel .universe-search.center-selected .us-results,.v394-universe-panel .universe-search.center-selected .us-recent{display:none!important}.v394-universe-panel .universe-search.center-selected{padding:8px 10px}.v394-universe-panel .universe-search.center-selected .us-status{margin-top:6px;color:#7fd9d0}",
    ".v394-universe-panel .us-result{flex:0 0 min(360px,42vw);min-width:0;display:grid;grid-template-columns:82px minmax(0,1fr);gap:8px;align-items:center;padding:7px;border:1px solid rgba(112,205,197,.14);border-radius:12px;background:#0a2930;color:#dff5f1;text-align:left}.v394-universe-panel .us-result:hover{border-color:rgba(111,225,213,.36);background:#10343b}.v394-universe-panel .us-result img,.v394-universe-panel .us-noimg{width:82px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#123037;display:grid;place-items:center}.v394-universe-panel .us-copy{min-width:0}.v394-universe-panel .us-copy b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v394-universe-panel .us-copy small,.v394-universe-panel .us-copy i{display:block;margin-top:2px;font-size:7px;color:#719492;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:normal}.v394-universe-panel .us-result strong{grid-column:2;font-size:7px;color:#75ded4;white-space:nowrap}.v394-universe-panel .us-empty{flex:1 0 100%;min-height:62px;display:grid;place-items:center;text-align:center;color:#678b88;font-size:8px;border:1px dashed #24464c;border-radius:11px}",
    "@media(max-width:699px){.v394-universe-panel .universe-search{padding:8px;overscroll-behavior:contain}.v394-universe-panel .us-title{grid-template-columns:1fr}.v394-universe-panel .us-title small{display:none}.v394-universe-panel .us-random-start{width:100%;min-height:42px}.v394-universe-panel .us-types{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.v394-universe-panel .us-types button{min-width:0;padding:0 4px;font-size:6.5px}.v394-universe-panel .us-types span{grid-column:1/-1;margin:0;text-align:center}.v394-universe-panel .us-row{grid-template-columns:1fr auto}.v394-universe-panel .us-row input{grid-column:1/-1}.v394-universe-panel .us-row select{min-height:39px!important}.v394-universe-panel .us-row button{min-height:39px}.v394-universe-panel .us-results{display:grid;grid-template-columns:1fr;gap:7px;max-height:46vh;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;padding:2px 1px 8px}.v394-universe-panel .us-result{width:100%;max-width:100%;min-width:0;flex:none;grid-template-columns:72px minmax(0,1fr);box-sizing:border-box}.v394-universe-panel .us-result img,.v394-universe-panel .us-noimg{width:72px}.v394-universe-panel .us-empty{width:100%;box-sizing:border-box}}"
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
    '<div class="us-main"><div class="us-title"><span><b>중심곡 검색</b><small>기본은 음성합성 오리지널곡. 커버·파생은 별도 모집단으로 탐색합니다.</small></span><button type="button" class="us-random-start" id="universeRandomStartBtn">🎲 랜덤곡으로 시작</button></div>'+
    '<div class="us-types" id="universeContentTypes"><button type="button" data-us-type="original">오리지널곡 <em>기본</em></button><button type="button" data-us-type="cover">歌ってみた·커버</button><button type="button" data-us-type="derivative">파생 전체</button><span id="universeTypeHint">기본 · 오리지널곡만</span></div>'+
    '<div class="us-row"><input id="universeSearchInput" placeholder="곡명 · P명 · 보컬 · 태그 · sm번호">'+
    '<select id="universeSearchScope"><option value="all_voice_synth">음성합성 전체</option><option value="all">니코동 전체</option><option value="vocaloid">VOCALOID</option><option value="utau">UTAU</option><option value="synthv">Synthesizer V</option><option value="cevio">CeVIO</option><option value="voisona">VoiSona</option><option value="neutrino">NEUTRINO</option><option value="voicevox">VOICEVOX</option></select>'+
    '<button type="button" id="universeSearchBtn">검색</button></div>'+
    '<div class="us-recent" id="universeRecent"></div><div class="us-status" id="universeSearchStatus">곡명·P명·보컬·태그·sm번호로 중심곡을 검색할 수 있습니다.</div></div>'+
    '<div class="us-results" id="universeSearchResults"><div class="us-empty">검색하면 후보곡이 여기에 표시됩니다.</div></div>';
  var journey=document.getElementById("v39UniverseJourney");
  panel.insertBefore(wrap,journey||layout);
  renderRecent();
  document.getElementById("universeSearchBtn").addEventListener("click",runSearch);
  document.getElementById("universeRandomStartBtn").addEventListener("click",randomStart);
  document.getElementById("universeContentTypes").addEventListener("click",function(e){
    var b=e.target.closest("[data-us-type]");if(!b)return;
    if(window.VSA53DiveContent)window.VSA53DiveContent.set(b.dataset.usType);
    results=[];
    var shell=document.getElementById("universeSearchBar");if(shell)shell.classList.remove("has-results","center-selected");
    var box=document.getElementById("universeSearchResults");if(box)box.innerHTML='<div class="us-empty">이 모집단에서 검색하거나 랜덤곡으로 시작하세요.</div>';
    var stage=document.querySelector(".universe-stage");if(stage)stage.innerHTML='<div class="us-empty">새 중심곡을 고르면 다이브가 시작됩니다.</div>';
    var info=document.getElementById("universeInfo");if(info)info.innerHTML="";
    var status=document.getElementById("universeSearchStatus");if(status)status.textContent=(window.VSA53DiveContent?window.VSA53DiveContent.label():"오리지널곡")+" 모집단으로 전환했습니다.";
    syncDiveType53()
  });
  syncDiveType53();
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
function boot(){addStyle();inject();syncDiveType53()}
document.addEventListener("vsa:dive-content-mode",function(){syncDiveType53()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();