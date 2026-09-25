/* Voice Synth Archive Organizer v22
 * Library, recent history, detective cases and candidate comparison.
 */
(function(){
"use strict";

const KEY="vsa.organizer.v22";
const MAX_RECENT_VIEWS=80;
const MAX_RECENT_SEARCHES=40;
const MAX_CASES=30;
const MAX_COMPARE=5;
const STATUS_META={
  interest:{label:"❤️ 관심곡",short:"관심곡"},
  favorite:{label:"⭐ 최애",short:"최애"},
  investigate:{label:"🔍 나중에 조사",short:"조사"},
  heard:{label:"✅ 들어봄",short:"들어봄"}
};
let db=loadDb();
let currentLibraryView="saved";

function now(){return Date.now()}
function uid(prefix){return prefix+"_"+now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
function safeText(v){return String(v==null?"":v)}
function esc22(v){return safeText(v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt22(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function parseTags22(v){
  if(Array.isArray(v))return v.map(String);
  if(!v)return [];
  return String(v).split(/[\s,，、]+/).map(function(x){return x.trim()}).filter(Boolean);
}
function blankDb(){return {version:1,library:{},recentViews:[],recentSearches:[],cases:[],compare:[],snapshots:{}}}
function loadDb(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||"null");
    if(!raw||typeof raw!=="object")return blankDb();
    return Object.assign(blankDb(),raw,{
      library:raw.library||{},
      recentViews:Array.isArray(raw.recentViews)?raw.recentViews:[],
      recentSearches:Array.isArray(raw.recentSearches)?raw.recentSearches:[],
      cases:Array.isArray(raw.cases)?raw.cases:[],
      compare:Array.isArray(raw.compare)?raw.compare:[],
      snapshots:raw.snapshots||{}
    });
  }catch(e){return blankDb()}
}
function saveDb(){
  try{localStorage.setItem(KEY,JSON.stringify(db))}
  catch(e){console.warn("v22 organizer save failed",e)}
}
function normalizeSong(song){
  if(!song)return null;
  return {
    contentId:safeText(song.contentId),
    title:safeText(song.title||song.contentId),
    description:safeText(song.description),
    viewCounter:Number(song.viewCounter)||0,
    commentCounter:Number(song.commentCounter)||0,
    mylistCounter:Number(song.mylistCounter)||0,
    likeCounter:Number(song.likeCounter)||0,
    startTime:safeText(song.startTime),
    lengthSeconds:Number(song.lengthSeconds)||0,
    thumbnailUrl:safeText(song.thumbnailUrl),
    tags:Array.isArray(song.tags)?song.tags.slice(0,80):safeText(song.tags)
  };
}
function findSong(id){
  id=safeText(id);
  let s=null;
  try{s=(state.songs||[]).find(function(x){return x.contentId===id})}catch(e){}
  if(!s)try{
    const hit=(state.detectiveCandidates||[]).find(function(x){return x.song&&x.song.contentId===id});
    s=hit&&hit.song;
  }catch(e){}
  if(!s)try{s=(state.hiddenGems||[]).find(function(x){return x.contentId===id})}catch(e){}
  if(!s)try{s=(state.tasteSongs||[]).find(function(x){return x.contentId===id})}catch(e){}
  if(!s)try{s=(state.guideSongs||[]).find(function(x){return x.contentId===id})}catch(e){}
  if(!s&&db.library[id])s=db.library[id].song;
  if(!s){
    const r=db.recentViews.find(function(x){return x.id===id});
    if(r)s=r.song;
  }
  return s?normalizeSong(s):null;
}
function recordSnapshot(song){
  song=normalizeSong(song);
  if(!song||!song.contentId||!song.viewCounter)return;
  const id=song.contentId, day=new Date().toISOString().slice(0,10);
  const arr=Array.isArray(db.snapshots[id])?db.snapshots[id]:[];
  const last=arr[arr.length-1];
  if(last&&last.day===day)last.views=song.viewCounter;
  else arr.push({day:day,views:song.viewCounter});
  db.snapshots[id]=arr.slice(-12);
}
function growthText(id,current){
  const arr=db.snapshots[id]||[];
  if(!arr.length||!current)return "";
  const first=arr[0];
  const d=current-first.views;
  if(!d)return "변화 기록 중";
  return (d>0?"+":"")+fmt22(d)+" · "+first.day+" 대비";
}
function setSongStatus(id,status,song){
  id=safeText(id);
  if(!id)return;
  if(!status){
    delete db.library[id];
  }else{
    const old=db.library[id]||{};
    const normalized=normalizeSong(song||old.song||findSong(id))||{contentId:id,title:id};
    db.library[id]={
      status:status,
      savedAt:old.savedAt||now(),
      updatedAt:now(),
      song:normalized
    };
    recordSnapshot(normalized);
  }
  saveDb();
  syncStatusControls(id);
  renderLibrary();
}
function syncStatusControls(id){
  document.querySelectorAll('.v22-save-select[data-song-id="'+CSS.escape(id)+'"]').forEach(function(el){
    el.value=(db.library[id]&&db.library[id].status)||"";
  });
}
function statusSelectHtml(id){
  const cur=(db.library[id]&&db.library[id].status)||"";
  let html='<select class="v22-save-select" data-song-id="'+esc22(id)+'" aria-label="곡 보관 상태">';
  html+='<option value="">♡ 보관</option>';
  Object.keys(STATUS_META).forEach(function(k){
    html+='<option value="'+k+'"'+(cur===k?' selected':'')+'>'+STATUS_META[k].label+'</option>';
  });
  return html+'</select>';
}
function recordView(id,song){
  song=normalizeSong(song||findSong(id))||{contentId:id,title:id};
  const row={id:id,title:song.title||id,viewedAt:now(),song:song};
  db.recentViews=db.recentViews.filter(function(x){return x.id!==id});
  db.recentViews.unshift(row);
  db.recentViews=db.recentViews.slice(0,MAX_RECENT_VIEWS);
  if(db.library[id])recordSnapshot(song);
  saveDb();
  if(currentLibraryView==="recent")renderLibrary();
}
function recordSearch(){
  const input=document.getElementById("globalSearchInput");
  if(!input)return;
  const q=input.value.trim();
  if(!q)return;
  const row={
    id:uid("search"),
    query:q,
    scope:(document.getElementById("searchScope")||{}).value||"all",
    year:typeof state!=="undefined"?state.year:"all",
    tier:typeof state!=="undefined"?state.tier:"all",
    sourceMode:typeof state!=="undefined"?state.sourceMode:"",
    applyYear:!!(document.getElementById("applyYearToSearch")||{}).checked,
    applyTier:!!(document.getElementById("applyTierToSearch")||{}).checked,
    searchedAt:now()
  };
  db.recentSearches=db.recentSearches.filter(function(x){
    return !(x.query===row.query&&x.scope===row.scope&&x.year===row.year&&x.tier===row.tier);
  });
  db.recentSearches.unshift(row);
  db.recentSearches=db.recentSearches.slice(0,MAX_RECENT_SEARCHES);
  saveDb();
}
function runRecentSearch(id){
  const r=db.recentSearches.find(function(x){return x.id===id});
  if(!r)return;
  const input=document.getElementById("globalSearchInput");
  if(input)input.value=r.query;
  const scope=document.getElementById("searchScope");
  if(scope)scope.value=r.scope||"all";
  if(typeof state!=="undefined"){
    state.year=r.year||"all";
    state.tier=r.tier||"all";
    if(document.getElementById("yearSelect"))document.getElementById("yearSelect").value=state.year;
    if(document.getElementById("tierSelect"))document.getElementById("tierSelect").value=state.tier;
  }
  const ay=document.getElementById("applyYearToSearch"),at=document.getElementById("applyTierToSearch");
  if(ay)ay.checked=!!r.applyYear;
  if(at)at.checked=!!r.applyTier;
  closeTools22();
  setTimeout(function(){
    const b=document.getElementById("apiSearchBtn");
    if(b)b.click();
  },80);
}
function serializeDetectiveForm(){
  const panel=document.getElementById("detectivePanel");
  if(!panel)return {};
  const out={};
  panel.querySelectorAll("input[id],select[id],textarea[id]").forEach(function(el){
    if(el.type==="file")return;
    if(el.type==="checkbox"||el.type==="radio")out[el.id]=!!el.checked;
    else out[el.id]=el.value;
  });
  return out;
}
function restoreDetectiveForm(form){
  Object.keys(form||{}).forEach(function(id){
    const el=document.getElementById(id);
    if(!el)return;
    if(el.type==="checkbox"||el.type==="radio")el.checked=!!form[id];
    else el.value=form[id];
    el.dispatchEvent(new Event("input",{bubbles:true}));
    el.dispatchEvent(new Event("change",{bubbles:true}));
  });
  try{updateDetectiveClueMeter()}catch(e){}
}
function candidateSnapshot(){
  try{
    return (state.detectiveCandidates||[]).slice(0,20).map(function(x){
      return {
        song:normalizeSong(x.song),
        score:Number(x.score)||0,
        matchedCount:Number(x.matchedCount)||0,
        hardFailures:(x.hardFailures||[]).slice(0,6),
        matches:(x.matches||[]).slice(0,10).map(function(m){return {text:safeText(m.text),strong:!!m.strong}})
      };
    });
  }catch(e){return []}
}
function saveDetectiveCase(){
  const form=serializeDetectiveForm();
  const base=safeText(form.detectiveWords||form.detectiveProducer||"").trim();
  const name=(base?base.slice(0,30):"새 탐정 사건")+" · "+new Date().toLocaleDateString("ko-KR");
  const item={
    id:uid("case"),
    name:name,
    savedAt:now(),
    updatedAt:now(),
    form:form,
    candidates:candidateSnapshot()
  };
  db.cases.unshift(item);
  db.cases=db.cases.slice(0,MAX_CASES);
  saveDb();
  toast22("탐정 사건을 저장했습니다.");
  renderLibrary();
}
function restoreCase(id){
  const c=db.cases.find(function(x){return x.id===id});
  if(!c)return;
  setToolView("detective");
  restoreDetectiveForm(c.form);
  if(Array.isArray(c.candidates)&&c.candidates.length){
    try{
      state.detectiveCandidates=c.candidates.map(function(x){return Object.assign({},x,{song:x.song})});
      renderDetectiveResults(collectDetectiveClues(),null);
    }catch(e){}
  }
  toast22("저장한 단서를 복원했습니다.");
}
function deleteCase(id){
  db.cases=db.cases.filter(function(x){return x.id!==id});
  saveDb();renderLibrary();
}
function renameCase(id){
  const c=db.cases.find(function(x){return x.id===id});
  if(!c)return;
  const name=prompt("사건 이름",c.name);
  if(name&&name.trim()){c.name=name.trim().slice(0,60);c.updatedAt=now();saveDb();renderLibrary()}
}
function toggleCompare(id){
  id=safeText(id);
  const i=db.compare.indexOf(id);
  if(i>=0)db.compare.splice(i,1);
  else{
    if(db.compare.length>=MAX_COMPARE){toast22("후보 비교는 최대 "+MAX_COMPARE+"곡까지 가능합니다.");return}
    db.compare.push(id);
  }
  saveDb();
  updateCompareButtons();
}
function updateCompareButtons(){
  document.querySelectorAll(".v22-compare-btn").forEach(function(b){
    const on=db.compare.indexOf(b.dataset.songId)>=0;
    b.classList.toggle("active",on);
    b.textContent=on?"비교 ✓":"비교 담기";
  });
  const count=document.getElementById("v22CompareCount");
  if(count)count.textContent=String(db.compare.length);
}
function scoreInfoFor(id){
  try{return (state.detectiveCandidates||[]).find(function(x){return x.song&&x.song.contentId===id})||null}
  catch(e){return null}
}
function openCompare(){
  if(!db.compare.length){toast22("비교할 후보를 먼저 담아주세요.");return}
  const body=document.getElementById("v22CompareBody");
  if(!body)return;
  const rows=db.compare.map(function(id){
    const info=scoreInfoFor(id);
    const song=(info&&info.song)||findSong(id)||{contentId:id,title:id};
    const y=song.startTime?new Date(song.startTime).getFullYear():"-";
    const sec=Number(song.lengthSeconds)||0;
    const len=sec?Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0"):"-";
    const matches=info?(info.matches||[]).slice(0,5).map(function(m){return m.text}).join(" · "):"저장된 비교 후보";
    const fails=info?(info.hardFailures||[]).slice(0,3).join(" · "):"";
    return '<tr>'+
      '<td><b>'+esc22(song.title||id)+'</b><small>'+esc22(id)+'</small></td>'+
      '<td>'+esc22(y)+'</td>'+
      '<td>'+fmt22(song.viewCounter||0)+'</td>'+
      '<td>'+esc22(len)+'</td>'+
      '<td><b>'+(info?Number(info.score||0).toFixed(1)+"%":"-")+'</b></td>'+
      '<td>'+esc22(matches||"-")+(fails?'<em>위반: '+esc22(fails)+'</em>':"")+'</td>'+
      '<td><button class="mini-btn" data-v22-open="'+esc22(id)+'">열기</button></td>'+
    '</tr>';
  }).join("");
  body.innerHTML='<div class="v22-compare-scroll"><table class="v22-compare-table"><thead><tr><th>후보</th><th>연도</th><th>조회</th><th>길이</th><th>점수</th><th>일치/불일치</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  document.getElementById("v22CompareModal").classList.add("open");
}
function closeCompare(){document.getElementById("v22CompareModal").classList.remove("open")}
function patchSongList(){
  document.querySelectorAll(".song[data-content-id]").forEach(function(card){
    const id=card.dataset.contentId;
    if(!id)return;
    const actions=card.querySelector(".song-actions");
    if(actions&&!actions.querySelector(".v22-save-select")){
      actions.insertAdjacentHTML("beforeend",statusSelectHtml(id));
    }
    const song=findSong(id);
    if(song&&db.library[id])recordSnapshot(song);
  });
  saveDb();
}
function detectiveIdFromCard(card){
  const a=card.querySelector('a[href*="nicovideo.jp/watch/"]');
  if(!a)return "";
  const m=a.href.match(/\/watch\/([^?/#]+)/);
  return m?decodeURIComponent(m[1]):"";
}
function patchDetectiveCards(){
  document.querySelectorAll(".detective-card").forEach(function(card){
    const id=detectiveIdFromCard(card);
    if(!id)return;
    const row=card.querySelector(".detective-actions-row");
    if(!row)return;
    if(!row.querySelector(".v22-save-select"))row.insertAdjacentHTML("beforeend",statusSelectHtml(id));
    if(!row.querySelector(".v22-compare-btn")){
      row.insertAdjacentHTML("beforeend",'<button class="mini-btn v22-compare-btn" data-song-id="'+esc22(id)+'">비교 담기</button>');
    }
  });
  updateCompareButtons();
}
function formatWhen(ts){
  if(!ts)return "-";
  const d=new Date(ts),delta=now()-ts;
  if(delta<60000)return "방금";
  if(delta<3600000)return Math.floor(delta/60000)+"분 전";
  if(delta<86400000)return Math.floor(delta/3600000)+"시간 전";
  return d.toLocaleDateString("ko-KR");
}
function libraryCounts(){
  const out={interest:0,favorite:0,investigate:0,heard:0};
  Object.values(db.library).forEach(function(x){if(out[x.status]!=null)out[x.status]++});
  return out;
}
function topPreferenceTags(){
  const counts=new Map();
  Object.values(db.library).forEach(function(x){
    if(x.status!=="favorite"&&x.status!=="interest")return;
    parseTags22(x.song&&x.song.tags).forEach(function(t){
      if(t.length<2||/^\d+$/.test(t))return;
      counts.set(t,(counts.get(t)||0)+1);
    });
  });
  return Array.from(counts.entries()).sort(function(a,b){return b[1]-a[1]}).slice(0,8);
}
function savedHtml(){
  const items=Object.keys(db.library).map(function(id){return Object.assign({id:id},db.library[id])})
    .sort(function(a,b){return (b.updatedAt||0)-(a.updatedAt||0)});
  if(!items.length)return '<div class="v22-empty">아직 보관한 곡이 없습니다.<br><small>검색 결과나 탐정 후보에서 ‘♡ 보관’을 눌러 저장해보세요.</small></div>';
  return '<div class="v22-card-grid">'+items.map(function(x){
    const s=x.song||{contentId:x.id,title:x.id};
    const growth=growthText(x.id,s.viewCounter);
    return '<article class="v22-song-card">'+
      (s.thumbnailUrl?'<img src="'+esc22(s.thumbnailUrl)+'" loading="lazy">':'')+
      '<div class="v22-song-main"><b>'+esc22(s.title||x.id)+'</b>'+
      '<small>'+esc22(x.id)+' · 조회 '+fmt22(s.viewCounter||0)+(growth?' · '+esc22(growth):'')+'</small>'+
      '<div class="v22-row">'+statusSelectHtml(x.id)+
      '<button class="mini-btn" data-v22-open="'+esc22(x.id)+'">니코동</button>'+
      '<button class="mini-btn" data-v22-universe="'+esc22(x.id)+'">우주</button></div></div>'+
      '</article>';
  }).join("")+'</div>';
}
function recentHtml(){
  const views=db.recentViews.slice(0,40);
  const searches=db.recentSearches.slice(0,25);
  let html='<div class="v22-split"><section><h3>최근 본 곡</h3>';
  html+=views.length?views.map(function(x){
    return '<div class="v22-line"><div><b>'+esc22(x.title||x.id)+'</b><small>'+formatWhen(x.viewedAt)+'</small></div><div class="v22-row">'+statusSelectHtml(x.id)+'<button class="mini-btn" data-v22-open="'+esc22(x.id)+'">다시 열기</button></div></div>';
  }).join(""):'<div class="v22-empty compact">아직 최근 본 곡이 없습니다.</div>';
  html+='</section><section><h3>최근 검색</h3>';
  html+=searches.length?searches.map(function(x){
    return '<div class="v22-line"><div><b>'+esc22(x.query)+'</b><small>'+esc22(x.scope)+' · '+formatWhen(x.searchedAt)+'</small></div><button class="mini-btn" data-v22-search="'+esc22(x.id)+'">다시 검색</button></div>';
  }).join(""):'<div class="v22-empty compact">아직 검색 기록이 없습니다.</div>';
  return html+'</section></div>';
}
function casesHtml(){
  if(!db.cases.length)return '<div class="v22-empty">저장한 탐정 사건이 없습니다.<br><small>곡 탐정에서 ‘사건 저장’을 누르면 현재 단서와 후보를 그대로 남길 수 있습니다.</small></div>';
  return '<div class="v22-case-list">'+db.cases.map(function(c){
    const words=(c.form&&c.form.detectiveWords)||"";
    return '<article class="v22-case"><div><b>'+esc22(c.name)+'</b><small>'+formatWhen(c.updatedAt||c.savedAt)+' · 후보 '+((c.candidates||[]).length)+'곡'+(words?' · '+esc22(words.slice(0,55)):'')+'</small></div><div class="v22-row"><button class="mini-btn" data-v22-case-open="'+esc22(c.id)+'">복원</button><button class="mini-btn" data-v22-case-rename="'+esc22(c.id)+'">이름</button><button class="mini-btn danger" data-v22-case-delete="'+esc22(c.id)+'">삭제</button></div></article>';
  }).join("")+'</div>';
}
function renderLibrary(){
  const panel=document.getElementById("v22LibraryPanel");
  if(!panel)return;
  const counts=libraryCounts();
  const top=topPreferenceTags();
  const stats=document.getElementById("v22LibraryStats");
  if(stats)stats.innerHTML=
    '<span>❤️ '+counts.interest+'</span><span>⭐ '+counts.favorite+'</span><span>🔍 '+counts.investigate+'</span><span>✅ '+counts.heard+'</span>'+
    (top.length?'<span class="wide">취향 태그 · '+top.map(function(x){return esc22(x[0])+" "+x[1]}).join(" · ")+'</span>':'');
  panel.querySelectorAll("[data-v22-libview]").forEach(function(b){b.classList.toggle("active",b.dataset.v22Libview===currentLibraryView)});
  const body=document.getElementById("v22LibraryBody");
  if(!body)return;
  body.innerHTML=currentLibraryView==="recent"?recentHtml():currentLibraryView==="cases"?casesHtml():savedHtml();
}
function exportData(){
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),app:"Voice Synth Archive",organizer:db},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="voice_synth_archive_backup_"+new Date().toISOString().slice(0,10)+".json";
  a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
}
function importData(file){
  if(!file)return;
  file.text().then(function(text){
    const parsed=JSON.parse(text);
    const src=parsed.organizer||parsed;
    if(!src||typeof src!=="object")throw new Error("백업 형식이 아닙니다.");
    db=Object.assign(blankDb(),src);
    saveDb();renderLibrary();patchSongList();patchDetectiveCards();toast22("백업을 불러왔습니다.");
  }).catch(function(e){alert("백업 불러오기 실패: "+safeText(e.message||e))});
}
function toast22(msg){
  try{toast(msg)}catch(e){console.log(msg)}
}
function closeTools22(){
  const m=document.getElementById("toolsModal");
  if(m){m.hidden=true;m.classList.remove("open")}
  document.body.classList.remove("tools-open");
}
function openSong(id){
  const s=findSong(id);
  recordView(id,s);
  window.open("https://www.nicovideo.jp/watch/"+encodeURIComponent(id),"_blank","noopener");
}
function openSavedUniverse(id){
  const s=findSong(id);
  if(!s){toast22("곡 정보가 부족합니다.");return}
  closeTools22();
  setTimeout(function(){
    try{
      document.getElementById("universePanel").scrollIntoView({behavior:"smooth",block:"start"});
      buildUniverse(s,false);
    }catch(e){toast22("우주 보기를 불러오지 못했습니다.")}
  },80);
}
function addUi(){
  const style=document.createElement("style");
  style.textContent=[
    ".v22-save-select{min-height:29px;height:29px;border:1px solid #29445f;border-radius:9px;background:#0c1b2c;color:#dff4ff;padding:0 7px;font-size:10px;font-weight:800;max-width:132px}",
    ".v22-compare-btn.active{border-color:#6bd7c6;background:#123a38;color:#dffff9}",
    ".v22-detective-bar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding:9px 13px;border-bottom:1px solid #1c3047;background:#091827}",
    ".v22-detective-bar small{color:#7896ad;font-size:9px;flex:1;min-width:180px}",
    ".v22-library-panel{min-height:560px}",
    ".v22-library-tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding:12px;border-bottom:1px solid #1c3047}",
    ".v22-library-tools button.active{border-color:#65cff2;background:#15314a}",
    ".v22-library-stats{display:flex;gap:7px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid #1c3047}",
    ".v22-library-stats span{font-size:10px;border:1px solid #29445f;background:#091827;border-radius:999px;padding:5px 8px;color:#bcd4e8}",
    ".v22-library-stats .wide{flex-basis:100%;border-radius:10px;line-height:1.5}",
    ".v22-library-body{padding:10px}",
    ".v22-card-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}",
    ".v22-song-card{display:grid;grid-template-columns:100px 1fr;gap:10px;align-items:center;border:1px solid #203a55;border-radius:14px;background:#091624;padding:8px;min-width:0}",
    ".v22-song-card img{width:100px;aspect-ratio:16/9;object-fit:cover;border-radius:9px;background:#10233a}",
    ".v22-song-main{min-width:0}.v22-song-main>b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v22-song-main small,.v22-line small,.v22-case small{display:block;margin-top:4px;font-size:9px;color:#7f9bb3;line-height:1.45}",
    ".v22-row{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-top:7px}",
    ".v22-split{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v22-split section{border:1px solid #203a55;border-radius:14px;background:#091624;overflow:hidden}.v22-split h3{margin:0;padding:10px 11px;border-bottom:1px solid #203a55;font-size:12px}",
    ".v22-line,.v22-case{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 10px;border-bottom:1px solid #142b41}.v22-line:last-child,.v22-case:last-child{border-bottom:0}.v22-line>div:first-child,.v22-case>div:first-child{min-width:0}.v22-line b,.v22-case b{font-size:10px}",
    ".v22-case-list{border:1px solid #203a55;border-radius:14px;background:#091624;overflow:hidden}",
    ".v22-empty{padding:48px 20px;text-align:center;color:#8ba4ba;font-size:11px;line-height:1.7}.v22-empty.compact{padding:28px 14px}",
    ".mini-btn.danger{border-color:#663440;color:#ffb7c1}",
    ".v22-compare-modal{position:fixed;inset:0;z-index:260;display:none;place-items:center;padding:14px}.v22-compare-modal.open{display:grid}",
    ".v22-compare-backdrop{position:absolute;inset:0;background:#01070ddd;backdrop-filter:blur(8px)}",
    ".v22-compare-sheet{position:relative;z-index:1;width:min(1080px,97vw);max-height:88dvh;overflow:auto;border:1px solid #31506d;border-radius:18px;background:#07111e;box-shadow:0 24px 80px #000b}",
    ".v22-compare-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#0b1a2af2;border-bottom:1px solid #1c3047}.v22-compare-head b{font-size:14px}",
    ".v22-compare-scroll{overflow:auto;padding:10px}.v22-compare-table{width:100%;border-collapse:collapse;min-width:820px}.v22-compare-table th,.v22-compare-table td{padding:9px;border-bottom:1px solid #1c3047;text-align:left;font-size:10px;vertical-align:top}.v22-compare-table th{color:#91adc4;font-size:9px}.v22-compare-table td small,.v22-compare-table td em{display:block;margin-top:4px;color:#7590a8;font-style:normal;font-size:8px}.v22-compare-table td em{color:#e99aa6}",
    "@media(max-width:700px){.v22-card-grid,.v22-split{grid-template-columns:1fr}.v22-song-card{grid-template-columns:82px 1fr}.v22-song-card img{width:82px}.v22-library-tools{position:sticky;top:0;z-index:2;background:#0a1523}.v22-detective-bar small{flex-basis:100%}.v22-save-select{max-width:118px;font-size:9px}}"
  ].join("");
  document.head.appendChild(style);

  const tabs=document.getElementById("toolsTabs");
  const body=document.querySelector("#toolsModal .tools-body");
  if(tabs&&body&&!document.querySelector('[data-tool="library22"]')){
    const tab=document.createElement("button");
    tab.dataset.tool="library22";tab.textContent="보관함·기록";
    tabs.appendChild(tab);

    const section=document.createElement("section");
    section.className="panel tool-view v22-library-panel";
    section.id="v22LibraryPanel";section.dataset.toolView="library22";
    section.innerHTML=
      '<div class="panel-head"><div><h2>보관함 · 최근 기록 · 탐정 사건</h2><p>찾은 곡과 검색 흐름을 잃지 않고 이어서 사용할 수 있습니다.</p></div><div class="pill">기기 내 저장</div></div>'+
      '<div class="v22-library-tools">'+
        '<button class="mini-btn active" data-v22-libview="saved">보관함</button>'+
        '<button class="mini-btn" data-v22-libview="recent">최근 기록</button>'+
        '<button class="mini-btn" data-v22-libview="cases">탐정 사건</button>'+
        '<span style="flex:1"></span>'+
        '<button class="mini-btn" id="v22ExportBtn">백업</button>'+
        '<label class="mini-btn" style="display:inline-flex;align-items:center;cursor:pointer">복원<input id="v22ImportInput" type="file" accept="application/json" hidden></label>'+
      '</div>'+
      '<div class="v22-library-stats" id="v22LibraryStats"></div>'+
      '<div class="v22-library-body" id="v22LibraryBody"></div>';
    body.appendChild(section);
  }

  const dp=document.getElementById("detectivePanel");
  if(dp&&!document.getElementById("v22DetectiveBar")){
    const bar=document.createElement("div");
    bar.className="v22-detective-bar";bar.id="v22DetectiveBar";
    bar.innerHTML='<button class="mini-btn" id="v22SaveCaseBtn">💾 사건 저장</button><button class="mini-btn" id="v22OpenCasesBtn">저장 사건</button><button class="mini-btn" id="v22OpenCompareBtn">후보 비교 <b id="v22CompareCount">0</b></button><small>현재 단서와 후보를 저장하거나, 후보 최대 5곡을 한 화면에서 비교합니다.</small>';
    const head=dp.querySelector(".panel-head");
    if(head)head.insertAdjacentElement("afterend",bar);
  }

  if(!document.getElementById("v22CompareModal")){
    const modal=document.createElement("div");
    modal.id="v22CompareModal";modal.className="v22-compare-modal";
    modal.innerHTML='<div class="v22-compare-backdrop"></div><div class="v22-compare-sheet"><div class="v22-compare-head"><b>탐정 후보 비교</b><div class="v22-row" style="margin:0"><button class="mini-btn" id="v22CompareClear">비우기</button><button class="mini-btn" id="v22CompareClose">닫기</button></div></div><div id="v22CompareBody"></div></div>';
    document.body.appendChild(modal);
  }

  bindUi();
  renderLibrary();
  updateCompareButtons();
}
function bindUi(){
  document.addEventListener("change",function(e){
    const el=e.target;
    if(el&&el.matches(".v22-save-select")){
      setSongStatus(el.dataset.songId,el.value,findSong(el.dataset.songId));
    }
  });

  document.addEventListener("click",function(e){
    const t=e.target.closest?e.target.closest("button,a"):null;
    if(!t)return;
    if(t.id==="apiSearchBtn")recordSearch();
    if(t.matches(".v22-compare-btn")){e.preventDefault();toggleCompare(t.dataset.songId);return}
    if(t.dataset.v22Open){e.preventDefault();openSong(t.dataset.v22Open);return}
    if(t.dataset.v22Universe){e.preventDefault();openSavedUniverse(t.dataset.v22Universe);return}
    if(t.dataset.v22Search){e.preventDefault();runRecentSearch(t.dataset.v22Search);return}
    if(t.dataset.v22CaseOpen){e.preventDefault();restoreCase(t.dataset.v22CaseOpen);return}
    if(t.dataset.v22CaseRename){e.preventDefault();renameCase(t.dataset.v22CaseRename);return}
    if(t.dataset.v22CaseDelete){e.preventDefault();deleteCase(t.dataset.v22CaseDelete);return}
    if(t.matches('a[href*="nicovideo.jp/watch/"]')){
      const m=t.href.match(/\/watch\/([^?/#]+)/);
      if(m)recordView(decodeURIComponent(m[1]),findSong(decodeURIComponent(m[1])));
    }
  },true);

  document.querySelectorAll("[data-v22-libview]").forEach(function(b){
    b.addEventListener("click",function(){currentLibraryView=b.dataset.v22Libview;renderLibrary()});
  });
  const sc=document.getElementById("v22SaveCaseBtn");if(sc)sc.onclick=saveDetectiveCase;
  const oc=document.getElementById("v22OpenCasesBtn");if(oc)oc.onclick=function(){currentLibraryView="cases";setToolView("library22");renderLibrary()};
  const cmp=document.getElementById("v22OpenCompareBtn");if(cmp)cmp.onclick=openCompare;
  const cc=document.getElementById("v22CompareClose");if(cc)cc.onclick=closeCompare;
  const cb=document.querySelector("#v22CompareModal .v22-compare-backdrop");if(cb)cb.onclick=closeCompare;
  const clr=document.getElementById("v22CompareClear");if(clr)clr.onclick=function(){db.compare=[];saveDb();updateCompareButtons();closeCompare()};
  const ex=document.getElementById("v22ExportBtn");if(ex)ex.onclick=exportData;
  const im=document.getElementById("v22ImportInput");if(im)im.onchange=function(){importData(im.files&&im.files[0]);im.value=""};
}
function patchRenderers(){
  try{
    const oldRenderSongs=renderSongs;
    renderSongs=function(){const r=oldRenderSongs.apply(this,arguments);setTimeout(patchSongList,0);return r};
  }catch(e){}
  try{
    const oldRenderDetectiveResults=renderDetectiveResults;
    renderDetectiveResults=function(){const r=oldRenderDetectiveResults.apply(this,arguments);setTimeout(patchDetectiveCards,0);return r};
  }catch(e){}
}
function boot(){
  addUi();
  patchRenderers();
  patchSongList();
  patchDetectiveCards();

  const sl=document.getElementById("songList");
  if(sl)new MutationObserver(function(){patchSongList()}).observe(sl,{childList:true,subtree:true});
  const dr=document.getElementById("detectiveResults");
  if(dr)new MutationObserver(function(){patchDetectiveCards()}).observe(dr,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();

window.VSAOrganizer22={
  saveDetectiveCase:saveDetectiveCase,
  renderLibrary:renderLibrary,
  openCompare:openCompare
};
})();