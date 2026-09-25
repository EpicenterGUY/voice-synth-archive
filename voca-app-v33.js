/* Voice Synth Archive v33 — Voca Support app shell */
(function(){
"use strict";
var K_FILTER="vsa.v33.filters",K_PRODUCER="vsa.v33.producerMode";
var GENERIC_RE=/VOCALOID|UTAU|Synthesizer ?V|SynthV|CeVIO|VoiSona|NEUTRINO|VOICEVOX|初音ミク|鏡音リン|鏡音レン|巡音ルカ|MEIKO|KAITO|GUMI|重音テト|flower|オリジナル曲|伝説入り|殿堂入り|神話入り|ミリオン|VOCAROCK|ボカロック|MMD|歌ってみた|踊ってみた|ゲーム|アニメ|音楽|ニコニコ/i;
var GENRE_RE=/ロック|メタル|ジャズ|テクノ|トランス|バラード|ポップ|エレクトロ|ダーク|ホラー|かわいい|可愛い|切ない|爽やか|和風|民族|ピアノ|ギター|EDM|HOUSE|Dubstep|DnB|Drum|Bass/i;
var VOCALS=[["","보컬 전체"],["初音ミク","初音ミク"],["鏡音リン","鏡音リン"],["鏡音レン","鏡音レン"],["巡音ルカ","巡音ルカ"],["GUMI","GUMI"],["flower","v flower"],["重音テト","重音テト"],["KAITO","KAITO"],["MEIKO","MEIKO"],["IA","IA"],["可不","可不"]];
var FAME=[["","유명도 전체",null,null],["mega","메가 히트",1000000,null],["known","유명곡",100000,999999],["mid","중간층",10000,99999],["deep","숨은 곡",500,9999],["abyss","심해",0,499]];
var KNOWN_PRODUCERS=["DECO*27","wowaka","ryo","ハチ","ピノキオピー","Neru","じん","kz","40mP","Mitchie M","みきとP","Orangestar","ナユタン星人","Ayase","Kanaria","かいりきベア","柊キライ","Chinozo","すりぃ","syudou","ツミキ","wotaku","MARETU","きくお","cosMo@暴走P","OSTER project","sasakure.UK","doriko","164","蝶々P","buzzG","トーマ","れるりり","n-buna","ぬゆり","ユリイ・カノン","Aqu3ra","R Sound Design","はるまきごはん","煮ル果実","いよわ","原口沙輔","なきそ","シャノン","柊マグネタイト","雄之助","Giga","八王子P","電ポルP","TOKOTOKO","西沢さんP","emon(Tes.)","Kairiki bear","Kikuo","PinocchioP","MikitoP","HachiojiP","Surii","Yunosuke"];
var KNOWN_PRODUCER_MAP=new Map(KNOWN_PRODUCERS.map(function(x){return[String(x).toLowerCase(),x]}));
var PRODUCER_EXCLUDE_RE=/初音ミク|鏡音|巡音|重音|GUMI|flower|可不|IA|KAITO|MEIKO|ボカロ|ボーカロイド|VOCALOID|UTAU|Synth|CeVIO|VoiSona|オリジナル|ランキング|メドレー|作業用|高音質|高画質|歌詞|字幕|殿堂|伝説|神話|ミリオン|かわいい|可愛い|切ない|泣ける|中毒|良曲|名曲|神曲|期待の新人|処女作|投稿祭|誕生祭|生誕祭|プロセカ|MMD|歌ってみた|踊ってみた|演奏してみた|ニコカラ|カラオケ|音ゲー|ゲーム|アニメ/i;
function producerHint(tag){
  var raw=String(tag||"").trim(),low=raw.toLowerCase(),known=KNOWN_PRODUCER_MAP.get(low),explicit=/([\-‐‑‒–—ー_ ]?P|Ｐ)$/.test(raw)||/ピー$/.test(raw),followed=load("vsa.v33.followedProducers",[]).some(function(x){return String(x).toLowerCase()===low});
  return{known:!!known,canonical:known||raw,explicit:explicit,followed:followed};
}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function load(k,f){try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function songTags(s){var r=s&&s.tags;return Array.isArray(r)?r.map(String):String(r||"").split(/[\s,、]+/).map(function(x){return x.trim()}).filter(Boolean)}
function localPool(){var m=new Map();try{[state.songs,state.tasteSongs,state.guideSongs,state.hiddenGems,state.hiddenGemPool,state.detectiveCandidates].forEach(function(g){if(!Array.isArray(g))return;g.forEach(function(x){var s=x&&x.song?x.song:x;if(s&&s.contentId)m.set(s.contentId,s)})})}catch(e){}try{var org=load("vsa.organizer.v22",{library:{}});Object.values(org.library||{}).forEach(function(x){if(x.song&&x.song.contentId)m.set(x.song.contentId,x.song)});var smart=load("vsa.smart.v23",{feedback:{},lastMix:[]});(smart.lastMix||[]).forEach(function(s){if(s&&s.contentId)m.set(s.contentId,s)});Object.values(smart.feedback||{}).forEach(function(x){if(x.song&&x.song.contentId)m.set(x.song.contentId,x.song)})}catch(e){}return Array.from(m.values())}
function dislikedSet(){var sm=load("vsa.smart.v23",{feedback:{}}),set=new Set();Object.entries(sm.feedback||{}).forEach(function(x){if(Number(x[1].value)<0)set.add(x[0])});return set}
function heardSet(){var org=load("vsa.organizer.v22",{library:{}}),set=new Set();Object.entries(org.library||{}).forEach(function(x){if(x[1].status==="heard")set.add(x[0])});return set}
function tasteSignals(){var org=load("vsa.organizer.v22",{library:{}}),sm=load("vsa.smart.v23",{feedback:{},tagPrefs:{}}),tag=new Map(),years=new Map();function add(song,w){songTags(song).filter(function(t){return !GENERIC_RE.test(t)&&!GENRE_RE.test(t)&&t.length>1}).forEach(function(t){tag.set(t,(tag.get(t)||0)+w)});if(song&&song.startTime){var y=new Date(song.startTime).getFullYear();if(y){var k=String(Math.floor(y/5)*5);years.set(k,(years.get(k)||0)+w)}}}Object.values(org.library||{}).forEach(function(x){var w=x.status==="favorite"?4:x.status==="interest"?2:x.status==="investigate"?1:0;if(w&&x.song)add(x.song,w)});Object.values(sm.feedback||{}).forEach(function(x){var w=(Number(x.value)||0)*3;if(w&&x.song)add(x.song,w)});Object.entries(sm.tagPrefs||{}).forEach(function(x){tag.set(x[0],(tag.get(x[0])||0)+(Number(x[1])||0)*4)});return{tags:Array.from(tag.entries()).filter(function(x){return x[1]>0}).sort(function(a,b){return b[1]-a[1]}).slice(0,12),years:Array.from(years.entries()).sort(function(a,b){return b[1]-a[1]}).slice(0,4)}}
function producerCandidates(){
  var songs=localPool(),map=new Map(),pref=new Map(tasteSignals().tags),total=Math.max(1,songs.length);
  songs.forEach(function(song){
    var seen=new Set();
    songTags(song).forEach(function(raw){
      var tag=String(raw||"").trim(),hint=producerHint(tag);
      if(!tag||tag.length<2||tag.length>34||GENERIC_RE.test(tag)||GENRE_RE.test(tag)||PRODUCER_EXCLUDE_RE.test(tag)||seen.has(tag)||/^\d+$/.test(tag)||/^[A-Z]{1,3}$/.test(tag))return;
      seen.add(tag);
      var key=String(hint.canonical||tag),x=map.get(key)||{tag:key,count:0,views:0,mylists:0,taste:0,explicit:false,known:false,followed:false};
      x.count++;x.views+=Number(song.viewCounter)||0;x.mylists+=Number(song.mylistCounter)||0;x.taste+=pref.get(tag)||pref.get(key)||0;
      x.explicit=x.explicit||hint.explicit;x.known=x.known||hint.known;x.followed=x.followed||hint.followed;
      map.set(key,x);
    });
  });
  return Array.from(map.values()).map(function(x){
    var common=x.count/total,confidence=(x.known?10:0)+(x.explicit?8:0)+(x.followed?9:0)+Math.min(4,Math.max(0,x.count-1));
    if(common>.28)confidence-=6;if(x.tag.length<=2&&!x.known&&!x.explicit)confidence-=3;
    x.confidence=confidence;x.confidenceLabel=confidence>=10?"확정도 높음":confidence>=7?"추정":"직접 추가";return x;
  }).filter(function(x){return x.known||x.explicit||x.followed||x.confidence>=7});
}
function producerRank(mode){
  var a=producerCandidates();
  function quality(x){return x.confidence*50000+x.views/Math.max(1,x.count)}
  if(mode==="followed")return a.filter(function(x){return x.followed}).sort(function(a,b){return b.views-a.views}).slice(0,20);if(mode==="taste")return a.sort(function(a,b){return(b.taste*140000+quality(b))-(a.taste*140000+quality(a))}).slice(0,20);
  if(mode==="deep")return a.filter(function(x){return x.views/Math.max(1,x.count)<250000}).sort(function(a,b){return((b.mylists+2)/Math.max(1,b.views))*100000+b.confidence*3-(((a.mylists+2)/Math.max(1,a.views))*100000+a.confidence*3)}).slice(0,20);
  return a.sort(function(a,b){return(b.views+b.confidence*80000)-(a.views+a.confidence*80000)}).slice(0,20);
}
function filterState(){var x=Object.assign({query:"",vocal:"",vocals:[],year:"all",fame:"",scope:"all_voice_synth",sort:"-viewCounter",excludeHeard:false,excludeDisliked:true,savedOnly:false,period:"",duration:"",minViews:"",maxViews:""},load(K_FILTER,{}));if(!Array.isArray(x.vocals))x.vocals=x.vocal?[x.vocal]:[];return x}
function filterSummary(){var f=filterState(),fm=FAME.find(function(x){return x[0]===f.fame}),vs=(f.vocals||[]).length?f.vocals.map(function(v){var hit=VOCALS.find(function(x){return x[0]===v});return hit?hit[1]:v}).join(" + "):"보컬 전체",dur=f.duration?({"short":"2분 미만","normal":"2~4분","long":"4~6분","epic":"6분+"}[f.duration]||f.duration):"",per=f.period?({"7d":"7일","30d":"30일","365d":"1년"}[f.period]||""):"",txt=[vs,f.year==="all"?"전체 연도":f.year+"년",fm?fm[1]:"유명도 전체",dur,per].filter(Boolean).join(" · ");var el=document.getElementById("v33FilterSummary");if(el)el.textContent=txt}
function buildSheet(){
  if(document.getElementById("v33FilterSheet"))return;
  var f=filterState(),sheet=document.createElement("div");sheet.id="v33FilterSheet";sheet.className="v33-sheet";sheet.hidden=true;
  var years=['<option value="all">전체 연도</option>'];for(var y=2026;y>=2007;y--)years.push('<option value="'+y+'">'+y+'년</option>');
  sheet.innerHTML='<div class="v33-sheet-panel"><div class="v33-sheet-head"><h3>검색 필터</h3><button class="v33-sheet-close" type="button">×</button></div>'+
    '<div class="v33-field"><label>보컬 · 여러 명 선택 가능</label><div class="v333-vocals">'+VOCALS.filter(function(x){return x[0]}).map(function(x){return'<label><input type="checkbox" data-v333-vocal="'+esc(x[0])+'"> '+esc(x[1])+'</label>'}).join("")+'</div></div>'+
    '<div class="v33-filter-grid"><div class="v33-field"><label>연도</label><select id="v33Year">'+years.join("")+'</select></div>'+
    '<div class="v33-field"><label>최근 업로드</label><select id="v333Period"><option value="">전체 기간</option><option value="7d">최근 7일</option><option value="30d">최근 30일</option><option value="365d">최근 1년</option></select></div>'+
    '<div class="v33-field"><label>유명도</label><select id="v33Fame">'+FAME.map(function(x){return'<option value="'+x[0]+'">'+x[1]+'</option>'}).join("")+'</select></div>'+
    '<div class="v33-field"><label>곡 길이</label><select id="v333Duration"><option value="">전체 길이</option><option value="short">2분 미만</option><option value="normal">2~4분</option><option value="long">4~6분</option><option value="epic">6분+</option></select></div>'+
    '<div class="v33-field"><label>조회수 직접 범위</label><div class="v333-range"><input id="v333MinViews" inputmode="numeric" placeholder="최소"><span>~</span><input id="v333MaxViews" inputmode="numeric" placeholder="최대"></div></div>'+
    '<div class="v33-field"><label>범위</label><select id="v33Scope"><option value="all_voice_synth">음성합성 전체</option><option value="vocaloid">VOCALOID</option><option value="utau">UTAU</option><option value="synthv">Synthesizer V</option><option value="all">니코동 전체</option></select></div>'+
    '<div class="v33-field"><label>정렬</label><select id="v33Sort"><option value="-viewCounter">조회수 높은 순</option><option value="-mylistCounter">마이리스트 순</option><option value="-commentCounter">댓글 반응 순</option><option value="-startTime">최신 순</option><option value="+viewCounter">조회수 낮은 순</option></select></div></div>'+
    '<div class="v33-checks"><label><input type="checkbox" id="v33ExcludeHeard"> 이미 들은 곡 제외</label><label><input type="checkbox" id="v333ExcludeDisliked"> 관심없음 제외</label><label><input type="checkbox" id="v333SavedOnly"> 보관곡만</label></div>'+
    '<div class="v333-note">BPM 수치는 니코니코 검색 데이터에 없어 길이·기간·보컬·조회수 필터를 우선 제공합니다.</div>'+
    '<div class="v33-sheet-actions"><button type="button" id="v33FilterReset">초기화</button><button type="button" class="primary" id="v33FilterApply">적용하고 검색</button></div></div>';
  document.body.appendChild(sheet);
  sheet.querySelectorAll("[data-v333-vocal]").forEach(function(el){el.checked=(f.vocals||[]).indexOf(el.dataset.v333Vocal)>=0});
  sheet.querySelector("#v33Year").value=f.year;sheet.querySelector("#v333Period").value=f.period||"";sheet.querySelector("#v33Fame").value=f.fame;sheet.querySelector("#v333Duration").value=f.duration||"";sheet.querySelector("#v333MinViews").value=f.minViews||"";sheet.querySelector("#v333MaxViews").value=f.maxViews||"";sheet.querySelector("#v33Scope").value=f.scope;sheet.querySelector("#v33Sort").value=f.sort;sheet.querySelector("#v33ExcludeHeard").checked=!!f.excludeHeard;sheet.querySelector("#v333ExcludeDisliked").checked=f.excludeDisliked!==false;sheet.querySelector("#v333SavedOnly").checked=!!f.savedOnly;
  sheet.querySelector(".v33-sheet-close").onclick=function(){sheet.hidden=true};sheet.onclick=function(e){if(e.target===sheet)sheet.hidden=true};
  sheet.querySelector("#v33FilterReset").onclick=function(){save(K_FILTER,{query:"",vocals:[],year:"all",fame:"",scope:"all_voice_synth",sort:"-viewCounter",excludeHeard:false,excludeDisliked:true,savedOnly:false,period:"",duration:"",minViews:"",maxViews:""});sheet.remove();buildSheet();filterSummary()};
  sheet.querySelector("#v33FilterApply").onclick=function(){
    var q=document.getElementById("v33Query"),vocals=Array.from(sheet.querySelectorAll("[data-v333-vocal]:checked")).map(function(x){return x.dataset.v333Vocal}).slice(0,6),x={query:q?q.value.trim():"",vocals:vocals,vocal:vocals[0]||"",year:sheet.querySelector("#v33Year").value,period:sheet.querySelector("#v333Period").value,fame:sheet.querySelector("#v33Fame").value,duration:sheet.querySelector("#v333Duration").value,minViews:sheet.querySelector("#v333MinViews").value.replace(/[^0-9]/g,""),maxViews:sheet.querySelector("#v333MaxViews").value.replace(/[^0-9]/g,""),scope:sheet.querySelector("#v33Scope").value,sort:sheet.querySelector("#v33Sort").value,excludeHeard:sheet.querySelector("#v33ExcludeHeard").checked,excludeDisliked:sheet.querySelector("#v333ExcludeDisliked").checked,savedOnly:sheet.querySelector("#v333SavedOnly").checked};
    save(K_FILTER,x);sheet.hidden=true;filterSummary();runFilteredSearch(x);
  };
}
function durationBounds(kind){if(kind==="short")return[0,119];if(kind==="normal")return[120,239];if(kind==="long")return[240,359];if(kind==="epic")return[360,null];return[null,null]}
function periodRange(period){if(!period)return null;var days=period==="7d"?7:period==="30d"?30:period==="365d"?365:0;if(!days)return null;var d=new Date(Date.now()-days*86400000);return{gte:d.toISOString()}}
function localMatch(song,f,query){
  if(query){var raw=(String(song.title||"")+" "+String(song.description||"")+" "+songTags(song).join(" ")).toLowerCase();if(raw.indexOf(query.toLowerCase())<0)return false}
  if((f.vocals||[]).length){var tags=new Set(songTags(song));if(!(f.vocals||[]).some(function(v){return tags.has(v)}))return false}
  if(f.year!=="all"&&song.startTime&&new Date(song.startTime).getFullYear()!==Number(f.year))return false;
  var dr=durationBounds(f.duration),sec=Number(song.lengthSeconds)||0;if(dr[0]!=null&&(sec<dr[0]||(dr[1]!=null&&sec>dr[1])))return false;
  var v=Number(song.viewCounter)||0,min=f.minViews!==""?Number(f.minViews):null,max=f.maxViews!==""?Number(f.maxViews):null;if(min!=null&&v<min)return false;if(max!=null&&v>max)return false;
  var pr=periodRange(f.period);if(pr&&(!song.startTime||new Date(song.startTime)<new Date(pr.gte)))return false;
  return true;
}
async function runFilteredSearch(override){
  var f=Object.assign(filterState(),override||{}),q=document.getElementById("v33Query"),query=(q?q.value:f.query||"").trim();f.query=query;save(K_FILTER,f);
  var btn=document.getElementById("v33SearchRun");if(btn){btn.disabled=true;btn.textContent="검색 중…"}
  try{
    var fm=FAME.find(function(x){return x[0]===f.fame}),tier=fm&&fm[0]?{min:fm[2],max:fm[3]}:null,dr=durationBounds(f.duration),nf={};
    if(dr[0]!=null){nf.lengthSeconds={gte:dr[0]};if(dr[1]!=null)nf.lengthSeconds.lte=dr[1]}
    var min=f.minViews!==""?Number(f.minViews):null,max=f.maxViews!==""?Number(f.maxViews):null;
    if(min!=null||max!=null){nf.viewCounter={};if(min!=null)nf.viewCounter.gte=min;if(max!=null)nf.viewCounter.lte=max}
    var rows=[];
    if(f.savedOnly){
      var org=load("vsa.organizer.v22",{library:{}});rows=Object.values(org.library||{}).map(function(x){return x.song}).filter(Boolean).filter(function(song){return localMatch(song,f,query)});
    }else{
      var vocals=(f.vocals||[]).slice(0,6),requests=vocals.length?vocals:[""];
      var packs=await Promise.all(requests.map(function(vocal){return fetchNico({year:f.year,limit:100,offset:0,mode:"free",query:query,scope:f.scope,queryTargets:"title,description,tags",sort:f.sort,applyYear:f.year!=="all",applyTier:!!tier,tier:tier,extraExactTag:vocal,numericFilters:nf,dateRange:periodRange(f.period)}).catch(function(){return{data:[]}})}));
      var map=new Map();packs.forEach(function(d){(d.data||[]).forEach(function(song){if(song&&song.contentId&&!map.has(song.contentId))map.set(song.contentId,song)})});rows=Array.from(map.values());
    }
    if(f.excludeDisliked!==false){var bad=dislikedSet();rows=rows.filter(function(song){return!bad.has(song.contentId)})}
    if(f.excludeHeard){var heard=heardSet();rows=rows.filter(function(song){return!heard.has(song.contentId)})}
    if(f.savedOnly&&f.sort==="-viewCounter")rows.sort(function(a,b){return(Number(b.viewCounter)||0)-(Number(a.viewCounter)||0)});
    state.songs=rows;state.offset=rows.length;try{renderSongs()}catch(e){}
    var lc=document.getElementById("loadedCount");if(lc)lc.textContent=rows.length+"곡 표시";
    var lt=document.getElementById("listTitle");if(lt)lt.textContent=query?"검색 · "+query:"필터 검색";
    openView("search29");
  }catch(e){try{toast("검색에 실패했습니다.")}catch(_){}}
  finally{if(btn){btn.disabled=false;btn.textContent="검색"}}
}
function searchProducer(tag){openView("searchHub33");setTimeout(function(){var q=document.getElementById("v33Query");if(q)q.value=tag;runFilteredSearch({query:tag})},30)}
function buildViews(){var ex=ensureView("explore33","탐색","프로듀서·빙산·우주·숨은 곡을 한 곳에서 시작합니다."),se=ensureView("searchHub33","검색","일반 검색과 기억 복원 탐정을 분리하고 필터를 한 곳에서 관리합니다."),ta=ensureView("tasteHub33","내 취향","보관과 피드백에서 학습한 취향을 확인하고 추천으로 연결합니다.");if(ex&&!ex.dataset.ready){ex.dataset.ready="1";ex.querySelector(".v33-view-body").innerHTML=exploreHtml()}if(se&&!se.dataset.ready){se.dataset.ready="1";se.querySelector(".v33-view-body").innerHTML=searchHubHtml();var f=filterState(),q=se.querySelector("#v33Query");if(q)q.value=f.query||""}if(ta&&!ta.dataset.ready){ta.dataset.ready="1";ta.querySelector(".v33-view-body").innerHTML=tasteHubHtml()}renderProducers(load(K_PRODUCER,"popular"));tasteSummary();filterSummary()}
function bind(){document.addEventListener("click",function(e){var legacy=e.target.closest&&e.target.closest("[data-open-legacy]");if(legacy){openView(legacy.dataset.openLegacy);return}var lib=e.target.closest&&e.target.closest("[data-open-library]");if(lib){if(lib.dataset.openLibrary==="saved"&&window.VSA332Library&&window.VSA332Library.open)window.VSA332Library.open();else if(window.VSAOrganizer22&&window.VSAOrganizer22.openLibrary)window.VSAOrganizer22.openLibrary(lib.dataset.openLibrary);else openView("library22");return}var pm=e.target.closest&&e.target.closest("[data-prod-mode]");if(pm){renderProducers(pm.dataset.prodMode);return}var prod=e.target.closest&&e.target.closest("[data-producer]");if(prod){if(window.VSAV33ProducerDetail)window.VSAV33ProducerDetail(prod.dataset.producer);else searchProducer(prod.dataset.producer);return}if(e.target.closest&&e.target.closest("[data-v33-producer-search]")){openView("searchHub33");setTimeout(function(){var q=document.getElementById("v33Query");if(q)q.focus()},30);return}if(e.target.closest&&e.target.closest("[data-scroll-home-new]")){try{closeToolsModal()}catch(_){}setTimeout(function(){var n=document.querySelector('[data-v28-rail="NEW"]');if(n)n.scrollIntoView({behavior:"smooth"})},30);return}});var run=document.getElementById("v33SearchRun");if(run)run.addEventListener("click",function(){runFilteredSearch()});var qi=document.getElementById("v33Query");if(qi)qi.addEventListener("keydown",function(e){if(e.key==="Enter")runFilteredSearch()});var fo=document.getElementById("v33FilterOpen");if(fo)fo.addEventListener("click",function(){buildSheet();document.getElementById("v33FilterSheet").hidden=false});document.querySelectorAll("[data-quick]").forEach(function(b){b.addEventListener("click",function(){var f=filterState(),k=b.dataset.quick;if(k==="miku"){f.vocal="初音ミク";f.vocals=["初音ミク"]}if(k==="teto"){f.vocal="重音テト";f.vocals=["重音テト"]}if(k==="new")f.year="2026";if(k==="deep")f.fame="deep";if(k==="mega")f.fame="mega";save(K_FILTER,f);filterSummary();runFilteredSearch(f)})})}
function homePolish(){document.body.classList.add("v33-shell","v33-home-polish");var top=document.querySelector(".topbar .brand h1");if(top)top.textContent="Voca Support";var sub=document.querySelector(".topbar .brand .sub");if(sub)sub.textContent="추천 · 탐색 · 검색 · 보관 · 취향";var h=document.querySelector(".v28-hero h2");if(h)h.textContent="오늘의 보카로";var p=document.querySelector(".v28-hero p");if(p)p.textContent="추천부터 신곡·숨은 곡까지 바로 듣고, 필요한 기능은 아래 탭에서 찾을 수 있어."}
function boot(){addStyle();homePolish();buildViews();rebuildPrimaryNav();buildDock();buildSheet();bind();window.VSAV33={openView:openView,runSearch:runFilteredSearch,filterState:filterState,localPool:localPool,tasteSignals:tasteSignals,producerRank:producerRank,searchProducer:searchProducer,renderProducers:renderProducers,refreshTaste:tasteSummary};var t=document.querySelector(".tools-title");if(t)t.textContent="Voca Support";setTimeout(function(){buildViews();homePolish();tasteSummary()},350)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();