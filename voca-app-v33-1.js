/* Voca Support v33.1 — producer detail, filter presets, YouTube-like home polish */
(function(){
"use strict";
var K_PRESETS="vsa.v33.presets",K_FOLLOW="vsa.v33.followedProducers";
function api(){return window.VSAV33||null}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function fmt(v){var n=Number(v);return Number.isFinite(n)?n.toLocaleString("ko-KR"):"-"}
function load(k,f){try{return JSON.parse(localStorage.getItem(k)||"null")||f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function addStyle(){if(document.getElementById("v331Style"))return;var s=document.createElement("style");s.id="v331Style";s.textContent="\n.v331-home-tabs{display:flex;gap:6px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:none}.v331-home-tabs::-webkit-scrollbar{display:none}.v331-home-tabs button{flex:0 0 auto;min-height:34px;padding:0 11px;border:1px solid #285159;border-radius:999px;background:#092329;color:#8eb6b2;font-size:8px;font-weight:900}.v331-home-tabs button:first-child{background:#17434a;color:#effffc;border-color:#4d8584}\n.v331-presetbar{display:flex;gap:6px;align-items:center;overflow-x:auto;padding:0 0 10px;scrollbar-width:none}.v331-presetbar::-webkit-scrollbar{display:none}.v331-preset{flex:0 0 auto;display:inline-flex;align-items:center;min-height:32px;border:1px solid #275159;border-radius:999px;background:#092329;color:#9bc2be;font-size:8px;font-weight:850}.v331-preset>button{height:30px;border:0;background:transparent;color:inherit;font:inherit;padding:0 10px}.v331-preset .v331-del{padding:0 8px;color:#678e8a;border-left:1px solid #23484f}.v331-preset-add{flex:0 0 auto;min-height:32px;border:1px dashed #3b686d;border-radius:999px;background:transparent;color:#7fb0ab;font-size:8px;font-weight:900;padding:0 10px}\n.v331-producer-hero{position:relative;overflow:hidden;border:1px solid #285159;border-radius:20px;background:radial-gradient(circle at 85% 0,rgba(113,225,215,.16),transparent 34%),linear-gradient(145deg,#0b2930,#071820);padding:18px}.v331-producer-hero small{display:block;color:#73dad1;font-size:7px;font-weight:950;letter-spacing:.13em}.v331-producer-hero h2{margin:6px 0 5px;font-size:clamp(24px,5vw,38px);letter-spacing:-.05em}.v331-producer-hero p{margin:0;color:#789c99;font-size:8px}.v331-producer-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.v331-producer-actions button{min-height:36px;border:1px solid #315e64;border-radius:11px;background:#0c2c32;color:#cbe9e5;font-size:8px;font-weight:900;padding:0 11px}.v331-producer-actions .primary{border:0;background:linear-gradient(135deg,#70e5db,#78aafa);color:#061316}\n.v331-producer-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}.v331-producer-stat{padding:10px;border:1px solid #1e4147;border-radius:13px;background:#081d22}.v331-producer-stat small{display:block;color:#698f8b;font-size:7px}.v331-producer-stat b{display:block;margin-top:3px;font-size:15px}\n.v331-section{margin-top:13px}.v331-section-head{display:flex;justify-content:space-between;align-items:end;gap:8px;margin:0 2px 7px}.v331-section-head h3{margin:0;font-size:14px}.v331-section-head small{color:#698d89;font-size:7px}.v331-songgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:8px}.v331-song{min-width:0}.v331-song a{display:block;color:#eaf9f6;text-decoration:none}.v331-song-thumb{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#0b252b}.v331-song-thumb img{width:100%;height:100%;object-fit:cover}.v331-song-thumb i{position:absolute;right:8px;bottom:7px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#effffb;color:#061316;font-style:normal}.v331-song b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:6px;font-size:9px;line-height:1.35}.v331-song small{display:block;margin-top:3px;color:#688d89;font-size:7px}.v331-song-open{width:100%;padding:0;border:0;background:transparent;color:#eaf9f6;text-align:left;cursor:pointer}.v331-song-open:focus-visible{outline:2px solid #70e5db;outline-offset:3px;border-radius:12px}.v331-producer-evidence{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.v331-producer-evidence span{padding:5px 8px;border:1px solid #2b565d;border-radius:999px;background:#092329;color:#9bc4bf;font-size:7px}.v331-producer-evidence .source{border-color:#417276;background:#11383d;color:#dff8f4}.v331-producer-note{margin-top:8px;color:#70938f;font-size:7px;line-height:1.55}\n.v331-sheet[hidden]{display:none}.v331-sheet{position:fixed;inset:0;z-index:26000;display:grid;place-items:end center;background:rgba(0,7,10,.72);backdrop-filter:blur(8px)}.v331-sheet-panel{width:min(520px,100%);padding:14px;border:1px solid #2a565d;border-bottom:0;border-radius:20px 20px 0 0;background:#071b20}.v331-sheet-head{display:flex;justify-content:space-between;align-items:center}.v331-sheet-head h3{margin:0;font-size:15px}.v331-sheet-head button{width:34px;height:34px;border:1px solid #285159;border-radius:10px;background:#0b2930;color:#dff7f3}.v331-sheet-panel input{width:100%;min-height:44px;margin-top:10px}.v331-sheet-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.v331-sheet-actions button{min-height:42px;border:1px solid #2b565d;border-radius:11px;background:#0b2930;color:#d9f4ef;font-weight:900}.v331-sheet-actions .primary{border:0;background:linear-gradient(135deg,#70e5db,#78aafa);color:#061316}\n@media(max-width:699px){.v33-home-polish .v28-hero{display:block!important;padding:8px!important;border-radius:0 0 16px 16px!important}.v33-home-polish .v28-hero-copy{display:none!important}.v33-home-polish .v28-pick{min-height:205px!important;border-radius:15px!important}.v33-home-polish .v28-homebar{position:static!important;padding:5px 2px!important}.v331-home-tabs{padding-top:2px}.v331-producer-stats{grid-template-columns:repeat(3,1fr)}.v331-songgrid{grid-template-columns:1fr 1fr}.v331-song b{font-size:8px}}@media(max-width:430px){.v331-songgrid{grid-template-columns:1fr}}\n";document.head.appendChild(s)}
function ensureProducerView(){
  var body=document.querySelector("#toolsModal .tools-body");if(!body)return null;
  var el=body.querySelector('[data-tool-view="producerDetail33"]');if(el)return el;
  el=document.createElement("section");el.className="tool-view v33-view";el.dataset.toolView="producerDetail33";
  el.innerHTML='<div class="v33-view-body" id="v331ProducerBody"></div>';
  body.prepend(el);return el;
}
function producerAliases(tag){
  var raw=String(tag||"").trim(),a=[raw];
  try{if(window.VSAProducerAliasVariants37)a=window.VSAProducerAliasVariants37(raw)||a}catch(e){}
  return Array.from(new Set(a.map(function(x){return String(x||"").trim()}).filter(Boolean))).slice(0,4)
}
function producerNorm(v){
  try{return String(v||"").normalize("NFKC").toLowerCase().replace(/[\s・･_\-]/g,"")}catch(e){return String(v||"").toLowerCase().replace(/[\s・･_\-]/g,"")}
}
function producerMention(song,aliases){
  aliases=aliases||[];
  var tags=Array.isArray(song&&song.tags)?song.tags:String(song&&song.tags||"").split(/[\s,、]+/),tagSet=new Set(tags.map(producerNorm));
  if(aliases.some(function(a){return tagSet.has(producerNorm(a))}))return true;
  var title=String(song&&song.title||""),desc=String(song&&song.description||"").replace(/<br\s*\/?\s*>/gi,"\n").replace(/<[^>]+>/g," ");
  var lines=desc.split(/[\r\n]+/),joined=producerNorm(title+"\n"+desc);
  return aliases.some(function(alias){
    var n=producerNorm(alias);if(!n)return false;
    if(/prod(?:uced)?\.?\s*(?:by\s*)?[:：]?/i.test(title)&&producerNorm(title).includes(n))return true;
    if(lines.some(function(line){
      var p=String(line||"").match(/^([^:：]{1,48})[:：]\s*(.+)$/);if(!p)return false;
      return /(music|composer|producer|prod\.?|作曲|作詞作曲|作編曲|曲|音楽|詞曲)/i.test(p[1])&&producerNorm(p[2]).includes(n)
    }))return true;
    return n.length>=4&&joined.includes(n)
  })
}
function localProducerSongs(tag){
  var a=api();if(!a||!a.localPool)return[];
  var aliases=producerAliases(tag);
  return a.localPool().filter(function(s){return producerMention(s,aliases)});
}
function rememberProducerSongs(rows){
  var cache=window.VSA331ProducerSongCache;
  if(!(cache instanceof Map))cache=window.VSA331ProducerSongCache=new Map();
  (rows||[]).forEach(function(s){if(s&&s.contentId)cache.set(String(s.contentId),s)})
}
async function fetchProducerRows(tag,sort,filter){
  var aliases=producerAliases(tag);
  var broad=await Promise.all(aliases.map(function(alias){
    return fetchNico({
      year:"all",limit:100,offset:0,mode:"free",query:alias,scope:"all",
      queryTargets:"title,description,tags",sort:sort,applyYear:false,applyTier:false,
      numericFilters:filter||{}
    }).then(function(d){return d.data||[]}).catch(function(){return[]})
  }));
  var exact=await Promise.all(aliases.map(function(alias){
    return fetchNico({
      year:"all",limit:100,offset:0,mode:"free",query:alias,scope:"all",
      queryTargets:"tagsExact",sort:sort,applyYear:false,applyTier:false,
      numericFilters:filter||{}
    }).then(function(d){return d.data||[]}).catch(function(){return[]})
  }));
  var rows=uniq(broad.flat().concat(exact.flat()));
  if(window.VSA37AdultFilterRows)rows=window.VSA37AdultFilterRows(rows,"producer_detail").rows;
  var matched=rows.filter(function(song){return producerMention(song,aliases)});
  if(window.VSA37DiscoveryOriginalRows&&matched.length){
    try{
      var verified=window.VSA37DiscoveryOriginalRows(matched,"producer_detail","all_voice_synth_union").rows;
      if(verified&&verified.length)matched=verified
    }catch(e){}
  }
  rememberProducerSongs(matched);
  return matched
}
function uniq(rows){var m=new Map();(rows||[]).forEach(function(s){if(s&&s.contentId&&!m.has(s.contentId))m.set(s.contentId,s)});return Array.from(m.values())}
function songCard(s){
  var y=s.startTime?new Date(s.startTime).getFullYear():"-";
  return '<article class="v331-song"><button type="button" class="v331-song-open" data-v331-song="'+esc(s.contentId)+'"><div class="v331-song-thumb">'+(s.thumbnailUrl?'<img src="'+esc(s.thumbnailUrl)+'" loading="lazy" alt="">':'')+'<i>▶</i></div><b>'+esc(s.title||s.contentId)+'</b><small>조회 '+fmt(s.viewCounter)+' · '+y+'</small></button></article>';
}
function section(title,sub,rows){
  return '<section class="v331-section"><div class="v331-section-head"><h3>'+title+'</h3><small>'+sub+'</small></div><div class="v331-songgrid">'+(rows.length?rows.slice(0,8).map(songCard).join(""):'<div class="v33-card-body">아직 이 프로듀서의 곡을 찾지 못했어요.</div>')+'</div></section>';
}
function followed(tag){var a=load(K_FOLLOW,[]);return a.indexOf(tag)>=0}
function toggleFollow(tag){
  var a=load(K_FOLLOW,[]),i=a.indexOf(tag),sm=load("vsa.smart.v23",{feedback:{},tagPrefs:{}});
  sm.tagPrefs=sm.tagPrefs||{};
  if(i>=0){a.splice(i,1);delete sm.tagPrefs[tag]}else{a.unshift(tag);a=a.slice(0,40);sm.tagPrefs[tag]=Math.max(2,Number(sm.tagPrefs[tag])||0)}
  save(K_FOLLOW,a);save("vsa.smart.v23",sm);
  try{if(api()&&api().refreshTaste)api().refreshTaste();if(api()&&api().renderProducers)api().renderProducers("taste")}catch(e){}
}
async function openProducer(tag){
  var a=api();if(!a)return;
  ensureProducerView();a.openView("producerDetail33");
  var root=document.getElementById("v331ProducerBody");if(!root)return;
  var aliases=producerAliases(tag),searchName=aliases[0]||tag;
  root.innerHTML='<div class="v331-producer-hero"><small>PRODUCER HUB · P명 확인</small><h2>'+esc(tag)+'</h2><p>니코니코에 적힌 P명과 다른 표기를 함께 찾고 있어요.</p><div class="v331-producer-evidence">'+aliases.map(function(x){return'<span>'+esc(x)+'</span>'}).join("")+'<span class="source">니코니코 정보</span><span class="source">VocaDB 정보</span></div></div>';
  var local=localProducerSongs(tag);
  var packs=await Promise.all([
    fetchProducerRows(tag,"-viewCounter"),
    fetchProducerRows(tag,"-startTime"),
    fetchProducerRows(tag,"+viewCounter",{viewCounter:{gte:100}})
  ]);
  var popular=uniq(packs[0].concat(local)).sort(function(x,y){return(Number(y.viewCounter)||0)-(Number(x.viewCounter)||0)}),
      recent=uniq(packs[1].concat(local)).filter(function(x){return x.startTime}).sort(function(x,y){return new Date(y.startTime)-new Date(x.startTime)}),
      deep=uniq(packs[2].concat(local)).filter(function(x){var v=Number(x.viewCounter)||0;return v>0&&v<=50000}).sort(function(x,y){var xv=(Number(x.mylistCounter)||0)/(Math.max(1,Number(x.viewCounter)||1)),yv=(Number(y.mylistCounter)||0)/(Math.max(1,Number(y.viewCounter)||1));return yv-xv}),
      all=uniq(popular.concat(recent,deep)),views=all.reduce(function(n,x){return n+(Number(x.viewCounter)||0)},0);
  rememberProducerSongs(all);
  root.innerHTML='<div class="v331-producer-hero"><small>PRODUCER HUB · P명 확인</small><h2>'+esc(tag)+'</h2><p>니코니코에 적힌 P명과 별칭을 함께 확인했어요.</p><div class="v331-producer-evidence">'+aliases.map(function(x){return'<span>'+esc(x)+'</span>'}).join("")+'<span class="source">니코니코 정보</span><span class="source">VocaDB 정보</span></div><div class="v331-producer-note">대표곡이 바로 안 나오면 P명 태그로 한 번 더 찾아요. 곡을 누르면 VocaDive에서 바로 재생됩니다.</div><div class="v331-producer-actions"><button class="primary" data-v331-search="'+esc(searchName)+'">전체 곡 검색</button><button data-v331-follow="'+esc(tag)+'">'+(followed(tag)?"팔로우 해제":"♡ 취향에 추가")+'</button></div></div>'+
    '<div class="v331-producer-stats"><div class="v331-producer-stat"><small>확인 곡</small><b>'+all.length+'</b></div><div class="v331-producer-stat"><small>누적 조회</small><b>'+fmt(views)+'</b></div><div class="v331-producer-stat"><small>최신 활동</small><b>'+(recent[0]&&recent[0].startTime?new Date(recent[0].startTime).getFullYear():"-")+'</b></div></div>'+
    section("대표곡","조회수 중심",popular)+section("최근곡","최근 등록순",recent)+section("숨은 곡","5만 조회 이하 반응률 중심",deep);
}
function defaultPresets(){
  var y=String(new Date().getFullYear());
  return[
    {id:"new",name:"신곡",filters:{year:y,sort:"-startTime",fame:""}},
    {id:"deep",name:"심해 발굴",filters:{year:"all",sort:"+viewCounter",fame:"deep"}},
    {id:"miku",name:"미쿠 인기",filters:{vocal:"初音ミク",year:"all",sort:"-mylistCounter",fame:"known"}},
    {id:"teto",name:"테토 신곡",filters:{vocal:"重音テト",year:y,sort:"-startTime",fame:""}},
    {id:"mega",name:"100만+",filters:{year:"all",sort:"-viewCounter",fame:"mega"}}
  ];
}
function customPresets(){return load(K_PRESETS,[])}
function renderPresets(){
  var hub=document.querySelector('[data-tool-view="searchHub33"] .v33-view-body');if(!hub)return;
  var bar=hub.querySelector(".v331-presetbar");
  if(!bar){bar=document.createElement("div");bar.className="v331-presetbar";var filter=hub.querySelector(".v33-filterbar");if(filter)filter.insertAdjacentElement("afterend",bar)}
  var defs=defaultPresets(),custom=customPresets();
  bar.innerHTML=defs.map(function(p){return'<span class="v331-preset"><button type="button" data-v331-preset="'+p.id+'">'+esc(p.name)+'</button></span>'}).join("")+
    custom.map(function(p){return'<span class="v331-preset"><button type="button" data-v331-custom="'+esc(p.id)+'">'+esc(p.name)+'</button><button type="button" class="v331-del" data-v331-delete="'+esc(p.id)+'">×</button></span>'}).join("")+
    '<button type="button" class="v331-preset-add" data-v331-save>＋ 현재 필터 저장</button>';
}
function applyPreset(p){
  var a=api();if(!a)return;var base=a.filterState?a.filterState():{},next=Object.assign({},base,p.filters||{});save("vsa.v33.filters",next);
  var q=document.getElementById("v33Query");if(q&&typeof next.query==="string")q.value=next.query;
  a.runSearch(next);
}
function buildPresetSheet(){
  if(document.getElementById("v331PresetSheet"))return;
  var sh=document.createElement("div");sh.id="v331PresetSheet";sh.className="v331-sheet";sh.hidden=true;
  sh.innerHTML='<div class="v331-sheet-panel"><div class="v331-sheet-head"><h3>필터 프리셋 저장</h3><button type="button" data-v331-sheet-close>×</button></div><input id="v331PresetName" maxlength="24" placeholder="예: 미쿠 2010년대 심해"><div class="v331-sheet-actions"><button type="button" data-v331-sheet-close>취소</button><button type="button" class="primary" id="v331PresetConfirm">저장</button></div></div>';
  document.body.appendChild(sh);
  sh.addEventListener("click",function(e){if(e.target===sh||e.target.closest("[data-v331-sheet-close]"))sh.hidden=true});
  document.getElementById("v331PresetConfirm").onclick=function(){var input=document.getElementById("v331PresetName"),name=input.value.trim();if(!name)return;var a=api(),arr=customPresets(),f=a&&a.filterState?a.filterState():{};arr.unshift({id:"p"+Date.now(),name:name,filters:f});save(K_PRESETS,arr.slice(0,20));input.value="";sh.hidden=true;renderPresets();try{toast("필터 프리셋을 저장했습니다.")}catch(e){}};
}
function installHomeTabs(){
  var root=document.getElementById("v28Home");if(!root||root.querySelector(".v331-home-tabs"))return;
  var nav=document.createElement("div");nav.className="v331-home-tabs";
  nav.innerHTML='<button type="button" data-v331-home="DAILY">추천</button><button type="button" data-v331-home="FOR YOU">내 취향</button><button type="button" data-v331-home="NEW">신곡</button><button type="button" data-v331-home="DEEP">숨은 곡</button><button type="button" data-v331-home="producer">프로듀서</button>';
  root.prepend(nav);
}
function bind(){
  document.addEventListener("click",function(e){
    var hs=e.target.closest&&e.target.closest("[data-v331-home]");if(hs){var v=hs.dataset.v331Home;if(v==="producer"){api()&&api().openView("explore33");return}var rail=document.querySelector('[data-v28-rail="'+v+'"]');if(rail)rail.scrollIntoView({behavior:"smooth",block:"start"});return}
    var mode=e.target.closest&&e.target.closest("[data-v331-preset]");if(mode){var p=defaultPresets().find(function(x){return x.id===mode.dataset.v331Preset});if(p)applyPreset(p);return}
    var cp=e.target.closest&&e.target.closest("[data-v331-custom]");if(cp){var p2=customPresets().find(function(x){return x.id===cp.dataset.v331Custom});if(p2)applyPreset(p2);return}
    var del=e.target.closest&&e.target.closest("[data-v331-delete]");if(del){save(K_PRESETS,customPresets().filter(function(x){return x.id!==del.dataset.v331Delete}));renderPresets();return}
    if(e.target.closest&&e.target.closest("[data-v331-save]")){buildPresetSheet();var sh=document.getElementById("v331PresetSheet");sh.hidden=false;setTimeout(function(){document.getElementById("v331PresetName").focus()},20);return}
    var follow=e.target.closest&&e.target.closest("[data-v331-follow]");if(follow){var tag=follow.dataset.v331Follow;toggleFollow(tag);follow.textContent=followed(tag)?"팔로우 해제":"♡ 취향에 추가";return}
    var song=e.target.closest&&e.target.closest("[data-v331-song]");if(song){
      var id=song.dataset.v331Song;
      if(window.VSAOpenSong39){window.VSAOpenSong39(id,true);return}
      var cached=window.VSA331ProducerSongCache instanceof Map?window.VSA331ProducerSongCache.get(id):null;
      if(cached&&typeof openUniversePage37==="function"){openUniversePage37(cached,false);return}
    }
    var sr=e.target.closest&&e.target.closest("[data-v331-search]");if(sr){api()&&api().searchProducer(sr.dataset.v331Search);return}
  });
}
function observeHome(){
  var root=document.getElementById("v28Home");if(!root)return;
  new MutationObserver(function(){requestAnimationFrame(installHomeTabs)}).observe(root,{childList:true});
}
var __booted=false;
function boot(){if(__booted)return;__booted=true;addStyle();ensureProducerView();buildPresetSheet();renderPresets();installHomeTabs();observeHome();bind();window.VSAV33ProducerDetail=openProducer;setTimeout(function(){renderPresets();installHomeTabs()},500)}
if(document.body)boot();else if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();