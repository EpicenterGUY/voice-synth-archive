/* Voice Synth Archive Voca Support Home v28 */
(function(){
"use strict";
var CK="vsa.home.v28",OK="vsa.organizer.v22",SK="vsa.smart.v23",REFRESH_KEY="vsa.home.refresh.v31",feed=null,busy=false,busySince=0;
function esc(v){return String(v==null?"":v).replace(/[&<>"\']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function day(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(a,seed){var o=a.slice(),x=seed||1;for(var i=o.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;var j=x%(i+1),t=o[i];o[i]=o[j];o[j]=t}return o}
function load(k,f){try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function norm(s){if(!s)return null;return{contentId:String(s.contentId||""),title:String(s.title||s.contentId||""),viewCounter:Number(s.viewCounter)||0,commentCounter:Number(s.commentCounter)||0,mylistCounter:Number(s.mylistCounter)||0,likeCounter:Number(s.likeCounter)||0,startTime:String(s.startTime||""),thumbnailUrl:String(s.thumbnailUrl||""),tags:Array.isArray(s.tags)?s.tags.slice(0,80):String(s.tags||"")}}
function tags(s){var r=s&&s.tags;if(Array.isArray(r))return r.map(String).filter(Boolean);return String(r||"").split(/[,\\s　、]+/).map(function(x){return x.trim()}).filter(Boolean)}
function generic(t){return /オリジナル曲|伝説入り|殿堂入り|神話入り|ミリオン/.test(t)||/^VOCALOID$/i.test(t)}
function pool(){var m=new Map();try{[state.songs,state.tasteSongs,state.guideSongs,state.hiddenGems,state.hiddenGemPool,state.detectiveCandidates].forEach(function(g){if(!Array.isArray(g))return;g.forEach(function(x){var s=x&&x.song?x.song:x;if(s&&s.contentId)m.set(s.contentId,norm(s))})})}catch(e){}var sm=load(SK,{});(sm.lastMix||[]).forEach(function(s){if(s&&s.contentId)m.set(s.contentId,norm(s))});var org=load(OK,{library:{}});Object.values(org.library||{}).forEach(function(x){if(x.song&&x.song.contentId)m.set(x.song.contentId,norm(x.song))});var neg=(load(SK,{feedback:{}}).feedback||{});return Array.from(m.values()).filter(function(s){return !(neg[s.contentId]&&Number(neg[s.contentId].value)<0)})}
function pref(){var sm=load(SK,{feedback:{},tagPrefs:{}}),org=load(OK,{library:{}}),m=new Map();function add(song,w){tags(song).filter(function(t){return t.length>1&&!generic(t)}).forEach(function(t){m.set(t,(m.get(t)||0)+w)})}Object.values(org.library||{}).forEach(function(x){var w=x.status==="favorite"?4:x.status==="interest"?2.5:x.status==="investigate"?1:0;if(w&&x.song)add(x.song,w)});Object.values(sm.feedback||{}).forEach(function(x){var w=(Number(x.value)||0)*4;if(w&&x.song)add(x.song,w)});Object.entries(sm.tagPrefs||{}).forEach(function(x){m.set(x[0],(m.get(x[0])||0)+(Number(x[1])||0)*5)});return Array.from(m.entries()).sort(function(a,b){return b[1]-a[1]})}
function tasteScore(s,p){var st=new Set(tags(s)),x=0;p.forEach(function(v){if(st.has(v[0]))x+=v[1]});var V=Number(s.viewCounter)||0,M=Number(s.mylistCounter)||0,C=Number(s.commentCounter)||0;return x+(M+2)/(V+1200)*18+(C+2)/(V+1200)*4}
function hiddenScore(s){var V=Math.max(1,Number(s.viewCounter)||1),M=Number(s.mylistCounter)||0,C=Number(s.commentCounter)||0,L=Number(s.likeCounter)||0;return(M+2)/V*160+(C+2)/V*35+(L+2)/V*20}
async function broad(sort,filter,offset){try{var d=await fetchNico({year:"all",limit:100,offset:offset||0,mode:"ranking",sort:sort,applyYear:false,applyTier:false,numericFilters:filter||{}});return d.data||[]}catch(e){return[]}}
async function tagFetch(t){try{var d=await fetchNico({year:"all",limit:100,offset:0,mode:"ranking",sort:"-mylistCounter",applyYear:false,applyTier:false,numericFilters:{viewCounter:{gte:100}},extraExactTag:t});return d.data||[]}catch(e){return[]}}
function refreshState(){var x=load(REFRESH_KEY,{daily:0,taste:0,newer:0,hidden:0});return{daily:Number(x.daily)||0,taste:Number(x.taste)||0,newer:Number(x.newer)||0,hidden:Number(x.hidden)||0}}
function saveRefreshState(x){save(REFRESH_KEY,x)}
function bump(kind){var x=refreshState();x[kind]=((Number(x[kind])||0)+1)%9;saveRefreshState(x);return x}
function bumpAll(){var x=refreshState();["daily","taste","newer","hidden"].forEach(function(k){x[k]=((Number(x[k])||0)+1)%9});saveRefreshState(x);return x}
function negativeMap(){return(load(SK,{feedback:{}}).feedback||{})}
function clean(rows){var neg=negativeMap(),m=new Map();(rows||[]).map(norm).filter(Boolean).forEach(function(song){if(!(neg[song.contentId]&&Number(neg[song.contentId].value)<0)&&!m.has(song.contentId))m.set(song.contentId,song)});return Array.from(m.values())}
async function gather(){var d=day(),seed=hash(d),p=pref(),pages=refreshState(),m=new Map();pool().forEach(function(song){m.set(song.contentId,song)});
  var jobs=[
    broad("-mylistCounter",{viewCounter:{gte:1000,lte:1500000}},((seed%3)+pages.daily)%9*100),
    broad("-commentCounter",{viewCounter:{gte:500,lte:700000}},pages.daily*100),
    broad("-mylistCounter",{viewCounter:{gte:100}},pages.taste*100),
    broad("-startTime",{viewCounter:{gte:0}},pages.newer*100),
    broad("-mylistCounter",{viewCounter:{gte:100,lte:50000}},pages.hidden*100),
    broad("-commentCounter",{viewCounter:{gte:100,lte:50000}},pages.hidden*100)
  ];
  p.filter(function(x){return x[1]>0}).slice(0,4).forEach(function(x){jobs.push(tagFetch(x[0]))});
  var groups=await Promise.all(jobs);groups.flat().map(norm).filter(Boolean).forEach(function(song){m.set(song.contentId,song)});
  var all=clean(Array.from(m.values()));
  var daily=shuffle(all.filter(function(song){return song.viewCounter>=1000&&song.viewCounter<=1500000}),hash(d+"-daily-"+pages.daily)).slice(0,12);
  var rankedTaste=all.slice().sort(function(a,b){return tasteScore(b,p)-tasteScore(a,p)}).filter(function(song){return tasteScore(song,p)>0});
  var taste=shuffle(rankedTaste.slice(0,Math.min(72,rankedTaste.length)),hash(d+"-taste-"+pages.taste)).slice(0,12);
  var newer=clean(groups[3]).sort(function(a,b){return new Date(b.startTime)-new Date(a.startTime)}).slice(0,12);
  var rankedHidden=clean(groups[4].concat(groups[5])).filter(function(song){return song.viewCounter>=100&&song.viewCounter<=50000}).sort(function(a,b){return hiddenScore(b)-hiddenScore(a)});
  var hidden=shuffle(rankedHidden.slice(0,Math.min(72,rankedHidden.length)),hash(d+"-hidden-"+pages.hidden)).slice(0,12);
  var out={date:d,at:Date.now(),daily:daily,taste:taste,newer:newer,hidden:hidden,signals:p.slice(0,8).map(function(x){return x[0]}),refresh:pages};
  save(CK,out);return out
}
function card(s){if(!s)return"";var y=s.startTime?new Date(s.startTime).getFullYear():"-",tg=tags(s).filter(function(t){return !generic(t)}).slice(0,2),h="";h+='<article class="v28-card"><a class="v28-thumb" href="https://www.nicovideo.jp/watch/'+encodeURIComponent(s.contentId)+'" target="_blank" rel="noopener">';h+=s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" alt="">':'<span>♪</span>';h+='<span class="v28-play">▶</span></a><div class="v28-card-body"><a class="v28-title" href="https://www.nicovideo.jp/watch/'+encodeURIComponent(s.contentId)+'" target="_blank" rel="noopener">'+esc(s.title||s.contentId)+'</a><div class="v28-meta">조회 '+fmt(s.viewCounter)+' · '+y+'</div>';if(tg.length)h+='<div class="v28-tags">'+tg.map(function(t){return'<span>'+esc(t)+'</span>'}).join("")+'</div>';h+='<div class="v28-card-actions"><button data-save="'+esc(s.contentId)+'">♡ 보관</button><button data-sim="'+esc(s.contentId)+'">비슷한 곡</button><button class="v28-dislike" data-dislike="'+esc(s.contentId)+'">관심없음</button></div></div></article>';return h}
function refreshLabel(mark){return mark==="DAILY"?"다른 추천":mark==="FOR YOU"?"다른 취향":mark==="NEW"?"새 곡 더 보기":"다른 숨은 곡"}
function rail(title,sub,a,mark){return'<section class="v28-rail" data-v28-rail="'+mark+'"><div class="v28-rail-head"><div><h3>'+title+'</h3><p>'+sub+'</p></div><div class="v32-rail-actions"><span class="v28-rail-mark">'+mark+'</span><button type="button" class="v32-refresh" data-v28-refresh="'+mark+'">'+refreshLabel(mark)+' ↻</button></div></div><div class="v28-cards">'+(a&&a.length?a.map(card).join(""):'<div class="v28-empty">추천 데이터가 아직 없습니다.</div>')+'</div></section>'}
function render(f){feed=f;var root=document.getElementById("v28Home");if(!root)return;var first=(f.daily||[])[0]||(f.taste||[])[0]||(f.newer||[])[0],date=new Date().toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"}),h="";h+='<section class="v28-hero"><div class="v28-hero-copy"><span class="v28-kicker">VOCALO SUPPORT · '+esc(date)+'</span><h2>오늘 뭐 들을까?</h2><p>매일 추천, 내 취향, 신곡, 숨은 곡을 첫 화면에서 바로 골라 들을 수 있어.</p><div class="v28-search"><input id="v28SearchInput" placeholder="곡명 · P명 · 보컬 · 태그 · sm번호"><button id="v28SearchBtn">검색</button><button class="secondary" id="v28MenuBtn">보카로 메뉴</button></div>';if(f.signals&&f.signals.length)h+='<div class="v28-signals">취향 신호 '+f.signals.slice(0,5).map(function(t){return'<span>'+esc(t)+'</span>'}).join("")+'</div>';h+='</div>';if(first){h+='<a class="v28-pick" href="https://www.nicovideo.jp/watch/'+encodeURIComponent(first.contentId)+'" target="_blank" rel="noopener">'+(first.thumbnailUrl?'<img src="'+esc(first.thumbnailUrl)+'" alt="">':"")+'<div class="v28-pick-shade"></div><div class="v28-pick-copy"><small>오늘의 한 곡</small><b>'+esc(first.title)+'</b><span>조회 '+fmt(first.viewCounter)+'</span></div></a>'}else h+='<div class="v28-pick v28-pick-empty">추천 준비 중</div>';h+='</section><div class="v28-homebar"><b>For You</b><div><button id="v28Refresh">피드 갱신</button><button id="v28OpenMenu">전체 기능</button></div></div>';h+=rail("오늘의 추천","오늘 날짜를 기준으로 매일 바뀌는 추천곡",f.daily,"DAILY");h+=rail("내 취향으로 골랐어","최애·관심곡과 피드백을 반영",f.taste,"FOR YOU");h+=rail("새로 올라온 곡","최근 등록된 음성합성 오리지널곡",f.newer,"NEW");h+=rail("조회수 아래 숨어있는 곡","낮은 조회수 대비 반응이 좋은 곡",f.hidden,"DEEP");root.innerHTML=h;bindLocal()}
function find(id){if(feed){var ks=["daily","taste","newer","hidden"];for(var i=0;i<ks.length;i++){var x=(feed[ks[i]]||[]).find(function(s){return s.contentId===id});if(x)return x}}return pool().find(function(s){return s.contentId===id})||null}
function keep(id){var s=find(id);if(!s)return;try{if(window.VSAOrganizer22&&window.VSAOrganizer22.setSongStatus){window.VSAOrganizer22.setSongStatus(id,"interest",s);toast("관심곡으로 보관했습니다.");return}}catch(e){}var db=load(OK,{version:1,library:{},recentViews:[],recentSearches:[],cases:[],compare:[],snapshots:{}});db.library=db.library||{};db.library[id]={status:"interest",song:norm(s),savedAt:Date.now(),updatedAt:Date.now()};save(OK,db);try{if(window.VSAOrganizer22&&window.VSAOrganizer22.reload)window.VSAOrganizer22.reload();if(window.VSAOrganizer22&&window.VSAOrganizer22.renderLibrary)window.VSAOrganizer22.renderLibrary()}catch(e){}try{toast("관심곡으로 보관했습니다.")}catch(e){}}
function dislike(id){var s=find(id);if(!s)return;var sm=load(SK,{feedback:{},tagPrefs:{}});sm.feedback=sm.feedback||{};sm.feedback[id]={value:-1,at:Date.now(),song:norm(s)};save(SK,sm);if(feed){["daily","taste","newer","hidden"].forEach(function(k){feed[k]=(feed[k]||[]).filter(function(x){return x.contentId!==id})});save(CK,feed);render(feed)}try{toast("관심없음으로 반영했습니다.")}catch(e){}}
function similar(id){var s=find(id);if(!s)return;try{openToolsModal("universe29")}catch(e){}setTimeout(function(){try{buildUniverse(s,false)}catch(e){}},30)}
function search(){var i=document.getElementById("v28SearchInput"),q=i?i.value.trim():"";if(!q)return;var g=document.getElementById("globalSearchInput");if(g)g.value=q;try{openToolsModal("search29")}catch(e){}setTimeout(function(){var b=document.getElementById("apiSearchBtn");if(b)b.click()},40)}
function menu(){try{openToolsModal("studioHome")}catch(e){}}
async function fetchSection(mark){
  var pages=refreshState(),p=pref(),rows=[];
  if(mark==="DAILY"){
    rows=clean((await Promise.all([
      broad("-mylistCounter",{viewCounter:{gte:1000,lte:1500000}},pages.daily*100),
      broad("-commentCounter",{viewCounter:{gte:500,lte:700000}},pages.daily*100)
    ])).flat()).filter(function(song){return song.viewCounter>=1000&&song.viewCounter<=1500000});
    return shuffle(rows,hash(day()+"-daily-"+pages.daily)).slice(0,12);
  }
  if(mark==="FOR YOU"){
    var jobs=[broad("-mylistCounter",{viewCounter:{gte:100}},pages.taste*100),broad("-commentCounter",{viewCounter:{gte:100}},pages.taste*100)];
    p.filter(function(x){return x[1]>0}).slice(0,3).forEach(function(x){jobs.push(tagFetch(x[0]))});
    rows=clean((await Promise.all(jobs)).flat()).sort(function(a,b){return tasteScore(b,p)-tasteScore(a,p)}).filter(function(song){return tasteScore(song,p)>0});
    return shuffle(rows.slice(0,Math.min(72,rows.length)),hash(day()+"-taste-"+pages.taste)).slice(0,12);
  }
  if(mark==="NEW"){
    rows=clean(await broad("-startTime",{viewCounter:{gte:0}},pages.newer*100)).sort(function(a,b){return new Date(b.startTime)-new Date(a.startTime)});
    return rows.slice(0,12);
  }
  rows=clean((await Promise.all([
    broad("-mylistCounter",{viewCounter:{gte:100,lte:50000}},pages.hidden*100),
    broad("-commentCounter",{viewCounter:{gte:100,lte:50000}},pages.hidden*100)
  ])).flat()).filter(function(song){return song.viewCounter>=100&&song.viewCounter<=50000}).sort(function(a,b){return hiddenScore(b)-hiddenScore(a)});
  return shuffle(rows.slice(0,Math.min(72,rows.length)),hash(day()+"-hidden-"+pages.hidden)).slice(0,12);
}
function keyForMark(mark){return mark==="DAILY"?"daily":mark==="FOR YOU"?"taste":mark==="NEW"?"newer":"hidden"}
async function refreshSection(mark){
  var btn=document.querySelector('[data-v28-refresh="'+mark+'"]');
  if(btn){btn.disabled=true;btn.textContent="불러오는 중…"}
  try{
    bump(keyForMark(mark));
    var rows=await fetchSection(mark);
    if(!rows.length){
      var local=pool(),pages=refreshState(),pm=pref(),k=keyForMark(mark);
      if(mark==="DAILY")rows=shuffle(local,hash(day()+"-daily-local-"+pages[k])).slice(0,12);
      else if(mark==="FOR YOU")rows=shuffle(local.slice().sort(function(a,b){return tasteScore(b,pm)-tasteScore(a,pm)}).slice(0,72),hash(day()+"-taste-local-"+pages[k])).slice(0,12);
      else if(mark==="NEW"){var sorted=local.filter(function(x){return x.startTime}).sort(function(a,b){return new Date(b.startTime)-new Date(a.startTime)});var start=(pages[k]*12)%Math.max(1,sorted.length);rows=sorted.slice(start,start+12);if(rows.length<12)rows=rows.concat(sorted.slice(0,12-rows.length));}
      else rows=shuffle(local.filter(function(x){return x.viewCounter>0&&x.viewCounter<=50000}).sort(function(a,b){return hiddenScore(b)-hiddenScore(a)}).slice(0,72),hash(day()+"-hidden-local-"+pages[k])).slice(0,12);
    }
    if(!feed)feed={date:day(),daily:[],taste:[],newer:[],hidden:[],signals:pref().slice(0,8).map(function(x){return x[0]})};
    if(mark==="DAILY")feed.daily=rows;
    else if(mark==="FOR YOU")feed.taste=rows;
    else if(mark==="NEW")feed.newer=rows;
    else feed.hidden=rows;
    feed.refresh=refreshState();feed.at=Date.now();save(CK,feed);
    render(feed);
    try{toast((mark==="DAILY"?"오늘의 추천":mark==="FOR YOU"?"취향 추천":mark==="NEW"?"신곡":"숨은 곡")+"을 새로 골랐습니다.")}catch(e){}
  }catch(e){
    try{toast("새 곡을 불러오지 못했습니다.")}catch(_){}
  }finally{
    var b=document.querySelector('[data-v28-refresh="'+mark+'"]');
    if(b){b.disabled=false;b.textContent=refreshLabel(mark)+" ↻"}
  }
}
async function refreshAll(){
  var btn=document.getElementById("v28Refresh");
  if(btn){btn.disabled=true;btn.textContent="전체 갱신 중…"}
  try{bumpAll();await loadFeed(true)}finally{var b=document.getElementById("v28Refresh");if(b){b.disabled=false;b.textContent="전체 새로고침"}}
}
function bindLocal(){var a=document.getElementById("v28SearchBtn");if(a)a.onclick=search;var i=document.getElementById("v28SearchInput");if(i)i.onkeydown=function(e){if(e.key==="Enter")search()};var m=document.getElementById("v28MenuBtn");if(m)m.onclick=menu;var o=document.getElementById("v28OpenMenu");if(o)o.onclick=menu;var r=document.getElementById("v28Refresh");if(r){r.textContent="전체 새로고침";r.onclick=refreshAll}var retry=document.getElementById("v28Retry");if(retry)retry.onclick=function(){loadFeed(true)};document.querySelectorAll("[data-v28-refresh]").forEach(function(b){b.onclick=function(){refreshSection(b.dataset.v28Refresh)}})}
function addStyle(){var s=document.createElement("style");s.id="v28Style";s.textContent="\n.v28-home{margin:10px 0 14px}.v28-hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(340px,.95fr);gap:12px;padding:14px;border:1px solid #1f464b;border-radius:24px;background:radial-gradient(circle at 15% 0,rgba(111,229,219,.13),transparent 34%),linear-gradient(135deg,#0a2429,#08191f 65%,#0a1721);box-shadow:0 22px 65px #0005}.v28-hero-copy{padding:14px 12px}.v28-kicker{font-size:8px;font-weight:950;letter-spacing:.14em;color:#72ddd4}.v28-hero h2{margin:8px 0 5px;font-size:clamp(26px,4vw,44px);letter-spacing:-.05em}.v28-hero p{margin:0;color:#88aaa7;font-size:11px}.v28-search{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;margin-top:17px}.v28-search button,.v28-homebar button{min-height:42px;border:1px solid #2d5960;border-radius:12px;padding:0 13px;background:linear-gradient(135deg,#70e6dc,#79aafa);color:#061316;font-weight:900}.v28-search .secondary,.v28-homebar button{background:#0d2b31;color:#d9f4f0}.v28-signals{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;font-size:8px;color:#719592}.v28-signals span{padding:4px 7px;border:1px solid #255057;border-radius:999px;background:#0a252b;color:#9dccca}\n.v28-pick{position:relative;min-height:230px;border-radius:18px;overflow:hidden;background:#07161b;color:#fff;text-decoration:none}.v28-pick img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}.v28-pick-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 28%,rgba(2,10,13,.88) 100%)}.v28-pick-copy{position:absolute;left:15px;right:15px;bottom:14px}.v28-pick-copy small{display:block;font-size:8px;color:#86e4db;font-weight:900}.v28-pick-copy b{display:block;margin-top:4px;font-size:18px}.v28-pick-copy span{display:block;margin-top:4px;font-size:8px;color:#acc7c4}.v28-pick-empty{display:grid;place-items:center;color:#7fa19e;text-align:center}\n.v28-homebar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:13px 2px 8px}.v28-homebar>b{font-size:18px}.v28-homebar>div{display:flex;gap:5px}.v28-homebar button{min-height:34px;font-size:8px;padding:0 10px}.v28-rail{margin:8px 0 16px}.v28-rail-head{display:flex;justify-content:space-between;align-items:flex-end;margin:0 3px 7px}.v28-rail-head h3{margin:0;font-size:16px}.v28-rail-head p{margin:3px 0 0;color:#739794;font-size:8px}.v28-rail-mark{font-size:7px;font-weight:950;letter-spacing:.14em;color:#69cfc7}.v32-rail-actions{display:flex;align-items:center;gap:6px}.v32-refresh{min-height:30px;padding:0 9px;border:1px solid #285159;border-radius:9px;background:#0d2b31;color:#bfe5df;font-size:7px;font-weight:900}.v32-refresh:disabled{opacity:.55}.v28-cards{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(190px,1fr);gap:9px;overflow-x:auto;padding:2px 2px 7px;scroll-snap-type:x proximity}.v28-card{scroll-snap-align:start;min-width:0}.v28-thumb{display:block;position:relative;aspect-ratio:16/9;border-radius:13px;overflow:hidden;background:#0b252b}.v28-thumb img{width:100%;height:100%;object-fit:cover}.v28-play{position:absolute;right:8px;bottom:7px;width:31px;height:31px;display:grid;place-items:center;border-radius:50%;background:#e8fffb;color:#082027;font-size:10px}.v28-card-body{padding:7px 3px}.v28-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#eaf9f6;text-decoration:none;font-size:10px;font-weight:850;line-height:1.35;min-height:27px}.v28-meta{margin-top:4px;font-size:7px;color:#70918f}.v28-tags{display:flex;gap:4px;margin-top:5px;overflow:hidden}.v28-tags span{font-size:6px;padding:3px 5px;border-radius:999px;background:#0d292f;color:#83b6b1;white-space:nowrap}.v28-card-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.v28-card-actions button{min-height:28px;border:1px solid #254a50;border-radius:8px;background:#0a2227;color:#9fc5c1;font-size:7px;padding:0 7px}.v28-card-actions .v28-dislike{border-color:#503740;color:#cfa7ad;background:#25171b}.v28-empty{min-height:120px;display:grid;place-items:center;color:#6f9290;font-size:9px;border:1px dashed #24474d;border-radius:13px;text-align:center;padding:12px}\n@media(min-width:1100px){.v28-cards{grid-auto-columns:calc((100% - 45px)/6)}}@media(max-width:699px){.v28-home{margin:7px 0 10px}.v28-hero{grid-template-columns:1fr;padding:10px;border-radius:18px}.v28-hero-copy{padding:8px 5px 2px}.v28-hero h2{font-size:27px}.v28-hero p{font-size:9px}.v28-search{grid-template-columns:1fr auto;margin-top:12px}.v28-search input{grid-column:1/-1}.v28-search button{min-height:40px;font-size:9px}.v28-pick{min-height:190px}.v28-homebar>b{font-size:15px}.v28-cards{grid-auto-columns:72vw}.v28-rail-head h3{font-size:14px}.v28-rail-head p{font-size:7px}}\n";document.head.appendChild(s)}
function build(){if(document.getElementById("v28Home"))return;var r=document.createElement("section");r.id="v28Home";r.className="v28-home";r.innerHTML='<div class="v28-empty">오늘의 보카로 피드를 준비하는 중…</div>';var a=document.querySelector(".v26-filter-shell")||document.getElementById("foldFilterToggle")||document.querySelector(".summary");if(a)a.parentNode.insertBefore(r,a);else{var app=document.querySelector(".app");if(app)app.appendChild(r)}}
function localFeedSnapshot(){
  var p=pool(),pages=refreshState(),pm=pref(),sortedNew=p.filter(function(s){return s.startTime}).sort(function(a,b){return new Date(b.startTime)-new Date(a.startTime)}),newStart=(pages.newer*12)%Math.max(1,sortedNew.length),localNew=sortedNew.slice(newStart,newStart+12);
  if(localNew.length<12)localNew=localNew.concat(sortedNew.slice(0,12-localNew.length));
  return{date:day(),at:Date.now(),daily:shuffle(p,hash(day()+"-daily-local-"+pages.daily)).slice(0,12),taste:shuffle(p.slice().sort(function(a,b){return tasteScore(b,pm)-tasteScore(a,pm)}).slice(0,72),hash(day()+"-taste-local-"+pages.taste)).slice(0,12),newer:localNew,hidden:shuffle(p.filter(function(s){return s.viewCounter>0&&s.viewCounter<=50000}).sort(function(a,b){return hiddenScore(b)-hiddenScore(a)}).slice(0,72),hash(day()+"-hidden-local-"+pages.hidden)).slice(0,12),signals:pm.slice(0,8).map(function(x){return x[0]}),refresh:pages};
}
function hasFeedData(x){return !!(x&&(["daily","taste","newer","hidden"].some(function(k){return Array.isArray(x[k])&&x[k].length})))}
function withTimeout(promise,ms){
  return Promise.race([promise,new Promise(function(_,reject){setTimeout(function(){reject(new Error("timeout"))},ms)})]);
}
async function loadFeed(force){
  var now=Date.now();
  if(busy&&now-busySince<9000)return;
  busy=true;busySince=now;
  var root=document.getElementById("v28Home"),cached=load(CK,null),showing=false;
  try{
    if(cached&&hasFeedData(cached)){
      render(cached);showing=true;
      if(!force&&cached.date===day())return;
    }else{
      var local=localFeedSnapshot();
      if(hasFeedData(local)){render(local);showing=true}
      else if(root&&!root.children.length)root.innerHTML='<div class="v28-empty">추천 피드를 준비하는 중…</div>';
    }

    if(typeof relayBase==="function"&&!relayBase()){
      var fallback=localFeedSnapshot();
      if(hasFeedData(fallback)){save(CK,fallback);render(fallback)}
      return;
    }

    var fresh=await withTimeout(gather(),6500);
    if(hasFeedData(fresh)){save(CK,fresh);render(fresh);return}

    if(!showing){
      var again=localFeedSnapshot();
      if(hasFeedData(again)){save(CK,again);render(again);return}
      if(root)root.innerHTML='<div class="v28-empty">추천 데이터를 아직 불러오지 못했습니다.<br><button class="v32-refresh" id="v28Retry" type="button">다시 시도</button></div>';
    }
  }catch(e){
    var backup=load(CK,null);
    if(backup&&hasFeedData(backup)){render(backup);try{toast("네트워크가 느려 저장된 추천을 먼저 표시합니다.")}catch(_){}}
    else{
      var local2=localFeedSnapshot();
      if(hasFeedData(local2)){save(CK,local2);render(local2)}
      else if(root)root.innerHTML='<div class="v28-empty">추천 피드 연결이 지연되고 있습니다.<br><button class="v32-refresh" id="v28Retry" type="button">다시 시도</button></div>';
    }
  }finally{
    busy=false;busySince=0;
    var retry=document.getElementById("v28Retry");if(retry)retry.onclick=function(){loadFeed(true)};
  }
}
function clicks(){document.addEventListener("click",function(e){var b=e.target.closest?e.target.closest("button"):null;if(!b)return;if(b.dataset.save){keep(b.dataset.save);return}if(b.dataset.sim){similar(b.dataset.sim);return}if(b.dataset.dislike){dislike(b.dataset.dislike);return}})}
function polish(){var n=document.querySelector('#mobileSectionNav [data-action="tools"] .v27-dock-label');if(n)n.textContent="메뉴";var s=document.querySelector(".brand .sub");if(s)s.textContent="매일 추천 · 취향 추천 · 곡 탐정 · 음성합성 아카이브"}
var __booted=false;
function boot(){if(__booted)return;__booted=true;addStyle();build();clicks();polish();loadFeed(false);setTimeout(polish,300)}
window.VSAHome28={boot:boot,loadFeed:loadFeed};
if(document.body)boot();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();