/* VocaDive Iceberg Continuous Voyage · v39.108.0
 * Second-stage same-layer focus + adjacent-tier vertical relation bridges.
 * Loaded by vocadive-ui-v3980.js to keep the ~1MB index stable.
 */
(function(){
"use strict";
var VERSION="39.108.0";
if(window.__VSA_ICEBERG_39108)return;
window.__VSA_ICEBERG_39108=true;

var focusId="";
var bridgeState={focusId:"",loading:false,up:[],down:[]};
var bridgeSeq=0;
var longTimer=0;
var longReady=false;
var longId="";
var suppressClickUntil=0;
var voyageHistory108=[];
var pendingSail108=null;
var voyageSeq108=0;
var voyageSongCache108=new Map();
var originalRequestTier=typeof requestTierLoad103==="function"?requestTierLoad103:null;
var originalGetAnySong39=typeof getAnySong39==="function"?getAnySong39:null;

function addStyle(){
  if(document.getElementById("v39107IcebergFocusBridgeStyle"))return;
  var el=document.createElement("style");
  el.id="v39107IcebergFocusBridgeStyle";
  el.textContent=`
#icebergPanel .ice107-focusbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 8px;border:1px solid rgba(191,236,255,.16);border-radius:10px;background:linear-gradient(135deg,rgba(8,31,48,.70),rgba(18,28,50,.66));position:relative;z-index:4}
#icebergPanel .ice107-focusbar small{display:block;color:#83cce7;font-size:6px;font-weight:950;letter-spacing:.09em}
#icebergPanel .ice107-focusbar b{display:block;margin-top:2px;color:inherit;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice107-focusbar button{min-height:28px;padding:0 9px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(7,24,37,.46);color:inherit;font-size:7px;font-weight:950}
#icebergPanel .ice107-bridge-wrap{position:relative;display:grid;gap:5px;padding:2px 0;z-index:1}
#icebergPanel .ice107-bridge-wrap:before{content:"";position:absolute;left:50%;top:0;bottom:0;border-left:1px dashed rgba(164,225,248,.28);transform:translateX(-50%);pointer-events:none}
#icebergPanel .ice107-bridge-lane{display:grid;grid-template-columns:82px minmax(0,1fr);gap:6px;align-items:center;min-height:36px;position:relative;z-index:2}
#icebergPanel .ice107-bridge-lane.down{grid-template-columns:minmax(0,1fr) 82px}
#icebergPanel .ice107-bridge-lane.down .ice107-bridge-label{order:2}
#icebergPanel .ice107-bridge-lane.down .ice107-bridge-cards,#icebergPanel .ice107-bridge-lane.down .ice107-bridge-empty{order:1}
#icebergPanel .ice107-bridge-label{display:flex;align-items:center;justify-content:center;min-height:30px;padding:0 6px;border:1px solid rgba(167,225,247,.11);border-radius:9px;background:rgba(5,20,32,.30);color:inherit;font-size:6px;font-weight:950;text-align:center}
#icebergPanel .ice107-bridge-cards{display:flex;gap:5px;min-width:0}
#icebergPanel .ice107-bridge-card{flex:1 1 0;min-width:0;display:grid;grid-template-columns:32px minmax(0,1fr);gap:5px;align-items:center;min-height:36px;padding:4px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(6,24,38,.42);color:inherit;text-align:left;cursor:pointer}
#icebergPanel .ice107-bridge-card:hover{border-color:rgba(188,235,252,.30);background:rgba(10,37,55,.58)}
#icebergPanel .ice107-bridge-card img,#icebergPanel .ice107-bridge-card .ice107-noimg{width:32px;height:32px;border-radius:7px;object-fit:cover;background:#0d2c3f;display:grid;place-items:center}
#icebergPanel .ice107-bridge-card b{display:block;font-size:6.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice107-bridge-card small{display:block;margin-top:2px;font-size:5.5px;opacity:.62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice107-bridge-empty{min-height:34px;display:flex;align-items:center;justify-content:center;padding:0 8px;border:1px dashed rgba(255,255,255,.10);border-radius:9px;font-size:6px;opacity:.52}
#icebergPanel .ice107-focus-btn{position:absolute;right:5px;top:5px;z-index:4;width:24px;height:24px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(3,17,28,.66);color:#c9f3ff;font-size:10px;font-weight:950;display:grid;place-items:center;opacity:.84;cursor:pointer}
#icebergPanel .ice107-focus-btn:hover{opacity:1;background:#153e53}
#icebergPanel .ice105-song-node{position:relative}
#icebergPanel .ice105-song-node.ice107-center{border-color:rgba(202,245,255,.55)!important;background:rgba(20,57,76,.64)!important;box-shadow:0 0 0 1px rgba(185,235,255,.12),0 0 22px rgba(114,208,241,.18)}
#icebergPanel .ice105-song-node.ice107-center:after{content:"CENTER";position:absolute;left:5px;top:5px;padding:2px 4px;border-radius:999px;background:rgba(6,26,39,.78);color:#d7f8ff;font-size:5px;font-weight:950;letter-spacing:.08em}
#icebergPanel .ice107-focus-neighbor{animation:ice107Spread .34s ease both}
#icebergPanel .ice107-focus-neighbor:nth-of-type(2){animation-delay:35ms}
#icebergPanel .ice107-focus-neighbor:nth-of-type(3){animation-delay:70ms}
#icebergPanel .ice107-focus-neighbor:nth-of-type(4){animation-delay:105ms}
#icebergPanel .ice107-focus-neighbor:nth-of-type(5){animation-delay:140ms}
#icebergPanel .ice107-bridge-card[data-kind="producer"]{border-color:rgba(243,181,255,.28)}
#icebergPanel .ice107-bridge-card[data-kind="vocal"]{border-color:rgba(145,230,255,.28)}
#icebergPanel .ice107-bridge-card[data-kind="music"]{border-color:rgba(149,240,201,.28)}
#icebergPanel .ice107-bridge-card[data-kind="tag"]{border-color:rgba(255,217,149,.28)}
@keyframes ice107Spread{from{opacity:.35;transform:scale(.96) translateY(5px)}to{opacity:1;transform:none}}
@media(max-width:699px){
 #icebergPanel .ice107-bridge-lane,#icebergPanel .ice107-bridge-lane.down{grid-template-columns:64px minmax(0,1fr)}
 #icebergPanel .ice107-bridge-lane.down .ice107-bridge-label{order:0}
 #icebergPanel .ice107-bridge-lane.down .ice107-bridge-cards,#icebergPanel .ice107-bridge-lane.down .ice107-bridge-empty{order:1}
 #icebergPanel .ice107-bridge-cards .ice107-bridge-card:nth-child(n+2){display:none}
}
@media(max-width:480px){
 #icebergPanel .ice107-bridge-card{grid-template-columns:28px minmax(0,1fr)}
 #icebergPanel .ice107-bridge-card img,#icebergPanel .ice107-bridge-card .ice107-noimg{width:28px;height:28px}
}
#icebergPanel .ice108-voyage-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin-top:4px}
#icebergPanel .ice108-voyage-chip{display:inline-flex;align-items:center;min-height:18px;padding:0 6px;border:1px solid rgba(149,225,250,.14);border-radius:999px;background:rgba(5,22,35,.34);color:#9edaf0;font-size:5.5px;font-weight:900}
#icebergPanel .ice108-back{border-color:rgba(166,225,247,.24)!important;background:rgba(14,48,67,.52)!important}
#icebergPanel .ice107-bridge-card:after{content:"↕";position:absolute;right:5px;bottom:3px;color:#9bdcf2;font-size:7px;font-weight:950;opacity:.72}
#icebergPanel .ice107-bridge-card{position:relative}
#icebergPanel .ice107-bridge-card.ice108-sailing{pointer-events:none;opacity:.6}
#icebergPanel .ice107-bridge-card.ice108-sailing:after{content:"…";animation:ice108Pulse .7s infinite alternate}
#icebergPanel .ice108-trail{display:flex;gap:4px;overflow-x:auto;padding:2px 0 1px;scrollbar-width:none}
#icebergPanel .ice108-trail::-webkit-scrollbar{display:none}
#icebergPanel .ice108-trail span{flex:0 0 auto;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:18px;display:inline-flex;align-items:center;padding:0 6px;border-radius:999px;background:rgba(7,27,42,.36);color:inherit;opacity:.58;font-size:5.5px}
@keyframes ice108Pulse{from{opacity:.35}to{opacity:1}}
@media(prefers-reduced-motion:reduce){#icebergPanel .ice107-focus-neighbor{animation:none!important}#icebergPanel .ice107-bridge-card.ice108-sailing:after{animation:none!important}}
`;
  document.head.appendChild(el);
}
function esc107(v){
  if(typeof esc==="function")return esc(v);
  return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})
}
function fmt107(v){try{return typeof fmt==="function"?fmt(v):(Number(v)||0).toLocaleString("ko-KR")}catch(_){return String(v||0)}}
function focusSong(){
  if(!focusId||!window.state&&typeof state==="undefined")return null;
  return (state.songs||[]).find(function(s){return s&&String(s.contentId)===String(focusId)})||null
}
function clearFocus(doRender){
  focusId="";
  bridgeState={focusId:"",loading:false,up:[],down:[]};
  bridgeSeq++;
  if(doRender!==false&&typeof renderIceberg==="function")renderIceberg()
}
function relation(center,song){
  try{
    if(typeof icebergRelationKind106==="function")return icebergRelationKind106(center,song)
  }catch(_){}
  try{
    var d=similarityBreakdown50(center,song);
    if(d.producer)return{kind:"producer",label:"같은 P",score:d.score+1,raw:d};
    if(d.vocal)return{kind:"vocal",label:"같은 보컬",score:d.score+.72,raw:d};
    if(d.music>0)return{kind:"music",label:"장르·분위기",score:d.score+.46+d.music*.18,raw:d};
    if(d.tag>=.12)return{kind:"tag",label:"핵심 태그",score:d.score+d.tag*.22,raw:d}
  }catch(_){}
  return null
}
function rankedNeighbors(center,pool,count){
  count=count||4;
  return (pool||[]).filter(function(s){return s&&s.contentId!==center.contentId}).map(function(song){
    var rel=relation(center,song),score=0;
    try{score=rel?rel.score:weightedTagSimilarity(center,song)}catch(_){}
    return{song:song,rel:rel,score:score}
  }).sort(function(a,b){
    return (b.rel?1:0)-(a.rel?1:0)||b.score-a.score||(+b.song.viewCounter||0)-(+a.song.viewCounter||0)
  }).slice(0,count).map(function(x){return x.song})
}
function focusRows(pool){
  var center=focusSong();if(!center)return null;
  return [center].concat(rankedNeighbors(center,pool,4))
}
function focusRelations(rows){
  if(!focusId||!rows||!rows[0]||String(rows[0].contentId)!==String(focusId))return null;
  return rows.slice(1).map(function(song,i){
    var rel=relation(rows[0],song);
    return rel?{a:0,b:i+1,kind:rel.kind,label:rel.label,score:rel.score,raw:rel.raw}:null
  }).filter(Boolean)
}
function compactVoyageSong108(song){
  if(!song)return null;
  return {contentId:song.contentId,title:song.title||song.contentId,thumbnailUrl:song.thumbnailUrl||"",viewCounter:+song.viewCounter||0,mylistCounter:+song.mylistCounter||0,commentCounter:+song.commentCounter||0,likeCounter:+song.likeCounter||0,startTime:song.startTime||"",tags:song.tags||[],description:song.description||""}
}
function voyageTrailHtml108(){
  if(!voyageHistory108.length)return"";
  var rows=voyageHistory108.slice(-5);
  return '<div class="ice108-trail">'+rows.map(function(x){return '<span>'+esc107((x.tierName||x.tierId||"층")+" · "+(x.song&&x.song.title||"탐사"))+'</span>'}).join("")+'</div>'
}
function bridgeCard(x,targetTier,direction){
  if(!x||!x.song)return"";
  var song=x.song,rel=x.rel;
  voyageSongCache108.set(String(song.contentId),song);
  var img=song.thumbnailUrl?'<img src="'+esc107(song.thumbnailUrl)+'" loading="lazy" alt="">':'<span class="ice107-noimg">♪</span>';
  return '<button type="button" class="ice107-bridge-card" data-kind="'+esc107(rel&&rel.kind||"tag")+'" data-ice108-sail="'+esc107(song.contentId)+'" data-ice108-tier="'+esc107(targetTier.id)+'" data-ice108-direction="'+esc107(direction)+'" title="'+esc107(song.title||song.contentId)+' · '+esc107(targetTier.name)+'로 항해">'+img+
    '<span><b>'+esc107(song.title||song.contentId)+'</b><small>'+esc107(rel?rel.label:"유사곡")+' · '+esc107(targetTier.name)+'로 이동</small></span></button>'
}
function bridgeLane(direction){
  if(!focusId)return"";
  var idx=typeof currentTierIndex104==="function"?currentTierIndex104():-1;
  var targetIdx=idx+(direction==="up"?-1:1);
  if(idx<0||targetIdx<0||targetIdx>=TIERS.length)return"";
  var target=TIERS[targetIdx],rows=direction==="up"?bridgeState.up:bridgeState.down;
  var label=(direction==="up"?"↑ ":"↓ ")+target.name;
  var body="";
  if(bridgeState.loading&&bridgeState.focusId===focusId)body='<div class="ice107-bridge-empty">인접 수심 연결 탐색 중…</div>';
  else if(rows&&rows.length)body='<div class="ice107-bridge-cards">'+rows.map(function(x){return bridgeCard(x,target,direction)}).join("")+'</div>';
  else body='<div class="ice107-bridge-empty">강한 종단 연결 없음</div>';
  return '<div class="ice107-bridge-lane '+direction+'"><div class="ice107-bridge-label">'+esc107(label)+'</div>'+body+'</div>'
}
function focusBar(center){
  if(!center)return"";
  var idx=typeof currentTierIndex104==="function"?currentTierIndex104():-1,tier=idx>=0?TIERS[idx]:null;
  return '<div class="ice107-focusbar"><div><small>CONTINUOUS DIVE · CENTER SONG</small><b>'+esc107(center.title||center.contentId)+'</b>'+
    '<div class="ice108-voyage-meta"><span class="ice108-voyage-chip">'+esc107(tier?tier.name:"현재 층")+'</span><span class="ice108-voyage-chip">항해 '+voyageHistory108.length+'단계</span></div>'+voyageTrailHtml108()+'</div>'+
    '<div><button type="button" class="ice108-back" data-ice108-back '+(voyageHistory108.length?'':'disabled')+'>← 항해 뒤로</button> <button type="button" data-ice107-clear>포커스 해제 ×</button></div></div>'
}
function findBridgeSong108(id){
  id=String(id||"");
  if(voyageSongCache108.has(id))return voyageSongCache108.get(id);
  var groups=[bridgeState.up||[],bridgeState.down||[]];
  for(var g of groups){for(var x of g){if(x&&x.song&&String(x.song.contentId)===id)return x.song}}
  return null
}
function pushVoyage108(){
  var center=focusSong();if(!center||state.tier==="all")return;
  var tier=TIERS.find(function(t){return t.id===state.tier});
  var item={tierId:state.tier,tierName:tier?tier.name:state.tier,song:compactVoyageSong108(center),at:Date.now()};
  var last=voyageHistory108[voyageHistory108.length-1];
  if(last&&last.tierId===item.tierId&&last.song&&item.song&&last.song.contentId===item.song.contentId)return;
  voyageHistory108.push(item);if(voyageHistory108.length>16)voyageHistory108.shift()
}
function waitForSail108(ticket,tries){
  tries=tries||0;
  if(!pendingSail108||pendingSail108.seq!==ticket.seq)return;
  if(state.tier!==ticket.tierId||state.busy){
    if(tries<60)setTimeout(function(){waitForSail108(ticket,tries+1)},120);
    else{pendingSail108=null;try{toast("층 이동은 완료했지만 중심곡 승계가 지연되었습니다.")}catch(_){}}
    return
  }
  pendingSail108=null;
  var song=ticket.song;
  voyageSongCache108.set(String(song.contentId),song);
  var exists=(state.songs||[]).some(function(x){return x&&String(x.contentId)===String(song.contentId)});
  if(!exists&&Array.isArray(state.songs))state.songs.unshift(song);
  focusId=song.contentId;
  bridgeState={focusId:song.contentId,loading:true,up:[],down:[]};
  try{if(typeof renderSongs==="function"&&!exists)renderSongs()}catch(_){}
  try{renderIceberg()}catch(_){}
  loadBridges(song);
  try{toast((ticket.direction==="down"?"더 깊은 ":"더 얕은 ")+(TIERS.find(function(t){return t.id===ticket.tierId})||{}).name+"으로 항해했습니다.")}catch(_){}
}
function sailBridge108(id,tierId,direction){
  var song=findBridgeSong108(id);if(!song||!tierId)return;
  if(pendingSail108)return;
  pushVoyage108();
  var ticket={seq:++voyageSeq108,tierId:tierId,direction:direction||"",song:song};
  pendingSail108=ticket;
  var card=document.querySelector('[data-ice108-sail="'+CSS.escape(String(id))+'"]');if(card)card.classList.add("ice108-sailing");
  focusId="";bridgeState={focusId:"",loading:false,up:[],down:[]};
  try{requestTierLoad103(tierId)}catch(e){pendingSail108=null;throw e}
  setTimeout(function(){waitForSail108(ticket,0)},80)
}
function voyageBack108(){
  if(!voyageHistory108.length||pendingSail108)return;
  var item=voyageHistory108.pop();if(!item||!item.song)return;
  var ticket={seq:++voyageSeq108,tierId:item.tierId,direction:"back",song:item.song};
  pendingSail108=ticket;focusId="";bridgeState={focusId:"",loading:false,up:[],down:[]};
  requestTierLoad103(item.tierId);
  setTimeout(function(){waitForSail108(ticket,0)},80)
}
async function loadBridges(center){
  var idx=typeof currentTierIndex104==="function"?currentTierIndex104():-1;
  if(!center||idx<0)return;
  var seq=++bridgeSeq;
  bridgeState={focusId:center.contentId,loading:true,up:[],down:[]};
  async function one(targetIdx){
    if(targetIdx<0||targetIdx>=TIERS.length)return[];
    try{
      var d=await fetchNico({tier:TIERS[targetIdx],year:state.year,sort:"-viewCounter",limit:36,offset:0,mode:"ranking",applyYear:true,applyTier:true});
      var rows=(d.data||[]);
      try{rows=filterAdultRows37(rows,"iceberg_bridge").rows}catch(_){}
      return rows.filter(function(s){return s&&s.contentId!==center.contentId}).map(function(song){
        var rel=relation(center,song),score=0;
        try{score=rel?rel.score:weightedTagSimilarity(center,song)}catch(_){}
        return{song:song,rel:rel,score:score}
      }).filter(function(x){return x.rel||x.score>=.16}).sort(function(a,b){
        return (b.rel?1:0)-(a.rel?1:0)||b.score-a.score
      }).slice(0,2)
    }catch(_){return[]}
  }
  var both=await Promise.all([one(idx-1),one(idx+1)]);
  if(seq!==bridgeSeq||String(focusId)!==String(center.contentId))return;
  bridgeState={focusId:center.contentId,loading:false,up:both[0],down:both[1]};
  if(typeof renderIceberg==="function")renderIceberg()
}
function setFocus(id){
  var song=(state.songs||[]).find(function(s){return s&&String(s.contentId)===String(id)})||voyageSongCache108.get(String(id));
  if(!song)return;
  voyageSongCache108.set(String(song.contentId),song);
  focusId=song.contentId;
  bridgeState={focusId:song.contentId,loading:true,up:[],down:[]};
  if(typeof renderIceberg==="function")renderIceberg();
  loadBridges(song)
}
function relationDots107(index,relations){
  try{return typeof relationDots106==="function"?relationDots106(index,relations):""}catch(_){return""}
}
function nodeHtml(){
  var pool=typeof icebergRepresentativePool106==="function"?icebergRepresentativePool106():[];
  if(!pool.length){
    return state.busy?'<div class="ice105-nodefield"><div class="ice105-node-loading">이 수심의 대표곡을 찾는 중…</div></div>':""
  }
  var maxPage=Math.max(0,Math.ceil(pool.length/ICE106_PAGE_SIZE)-1);
  var page=Math.min(maxPage,icebergNodePage106(state.tier));
  var centered=focusRows(pool);
  var rows=centered||pool.slice(page*ICE106_PAGE_SIZE,page*ICE106_PAGE_SIZE+ICE106_PAGE_SIZE);
  var relations=centered?focusRelations(rows):icebergRelationGraph106(rows);
  var cards=rows.map(function(song,i){
    var img=song.thumbnailUrl?'<img src="'+esc107(song.thumbnailUrl)+'" loading="lazy" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ice105-noimg\',textContent:\'♪\'}))">':'<span class="ice105-noimg">♪</span>';
    var dots=relationDots107(i,relations),center=String(focusId)===String(song.contentId);
    return '<article role="button" tabindex="0" class="ice105-song-node'+(dots?' ice106-related':'')+(center?' ice107-center':'')+(focusId&&!center?' ice107-focus-neighbor':'')+'" style="--node-i:'+i+'" data-v399-play="'+esc107(song.contentId)+'" data-ice106-node="'+i+'" data-song-id="'+esc107(song.contentId)+'" title="'+esc107(song.title||song.contentId)+'">'+
      img+'<span class="ice105-nodecopy"><b>'+esc107(song.title||song.contentId)+'</b><small>조회 '+fmt107(song.viewCounter||0)+' · #'+fmt107(song.__rank||i+1)+'</small>'+dots+'</span>'+
      '<button type="button" class="ice107-focus-btn" data-ice107-focus="'+esc107(song.contentId)+'" aria-label="이 곡 중심으로 미니 다이브">◎</button></article>'
  }).join("");
  var nav=focusId?'':('<div class="ice106-node-nav"><button type="button" data-ice106-page-dir="-1" '+(page<=0?'disabled':'')+' aria-label="이전 곡 노드">←</button><span>'+(page+1)+' / '+(maxPage+1)+'</span><button type="button" data-ice106-page-dir="1" '+(page>=maxPage?'disabled':'')+' aria-label="다음 곡 노드">→</button></div>');
  var center=focusSong();
  return '<div class="ice105-nodefield" data-ice106-page="'+page+'">'+
    (center?focusBar(center):'')+
    (center?'<div class="ice107-bridge-wrap">'+bridgeLane("up")+'</div>':'')+
    '<div class="ice106-node-head"><small>'+(center?'SECOND DIVE · SAME LAYER':'CURRENT LAYER · MINI UNIVERSE')+'</small>'+nav+'</div>'+
    '<div class="ice106-node-stage"><svg class="ice106-link-layer" aria-hidden="true"></svg>'+cards+'<span class="ice106-empty-rel" '+(relations.length?'hidden':'')+'>현재 곡 사이에 강한 P·보컬·장르 연결이 없습니다.</span></div>'+
    (center?'<div class="ice107-bridge-wrap">'+bridgeLane("down")+'</div>':'')+
    '<div class="ice106-legend"><span class="producer"><i></i>같은 P</span><span class="vocal"><i></i>같은 보컬</span><span class="music"><i></i>장르·분위기</span><span class="tag"><i></i>핵심 태그</span></div>'+
  '</div>'
}
function drawRelations(){
  cancelAnimationFrame(window.__ICE107_RAF||0);
  window.__ICE107_RAF=requestAnimationFrame(function(){
    var stage=document.querySelector("#icebergPanel .tier.active .ice106-node-stage");if(!stage)return;
    var svg=stage.querySelector(".ice106-link-layer");
    var nodes=[].slice.call(stage.querySelectorAll(".ice105-song-node")).filter(function(el){return getComputedStyle(el).display!=="none"});
    if(!svg||nodes.length<2)return;
    var rows=nodes.map(function(el){return (state.songs||[]).find(function(s){return String(s.contentId)===String(el.dataset.songId)})}).filter(Boolean);
    var rels=focusRelations(rows)||icebergRelationGraph106(rows);
    var sr=stage.getBoundingClientRect(),w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
    svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.setAttribute("width",w);svg.setAttribute("height",h);
    svg.innerHTML=rels.map(function(rel){
      var A=nodes[rel.a],B=nodes[rel.b];if(!A||!B)return"";
      var ar=A.getBoundingClientRect(),br=B.getBoundingClientRect();
      var x1=ar.left-sr.left+ar.width/2,y1=ar.top-sr.top+ar.height/2,x2=br.left-sr.left+br.width/2,y2=br.top-sr.top+br.height/2;
      var strong=rel.score>1.2||rel.raw&&rel.raw.score>.4?"strong":"normal";
      return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" data-kind="'+esc107(rel.kind)+'" data-strength="'+strong+'"><title>'+esc107(rel.label)+'</title></line>'
    }).join("");
    var empty=stage.querySelector(".ice106-empty-rel");if(empty)empty.hidden=!!rels.length
  })
}
function bind(){
  var panel=document.getElementById("icebergPanel");if(!panel||panel.dataset.ice107Bound)return;
  panel.dataset.ice107Bound="1";
  panel.addEventListener("click",function(e){
    var sail=e.target.closest("[data-ice108-sail]");
    if(sail){e.preventDefault();e.stopPropagation();sailBridge108(sail.dataset.ice108Sail,sail.dataset.ice108Tier,sail.dataset.ice108Direction);return}
    var back=e.target.closest("[data-ice108-back]");
    if(back&&!back.disabled){e.preventDefault();e.stopPropagation();voyageBack108();return}
    var clear=e.target.closest("[data-ice107-clear]");
    if(clear){e.preventDefault();e.stopPropagation();clearFocus(true);return}
    var focus=e.target.closest("[data-ice107-focus]");
    if(focus){e.preventDefault();e.stopPropagation();setFocus(focus.dataset.ice107Focus);return}
  });
  panel.addEventListener("keydown",function(e){
    var node=e.target.closest(".ice105-song-node");if(!node)return;
    if(e.key==="Enter"||e.key===" "){e.preventDefault();node.click()}
    if((e.key==="f"||e.key==="F")&&node.dataset.songId){e.preventDefault();setFocus(node.dataset.songId)}
  });
  panel.addEventListener("pointerdown",function(e){
    var node=e.target.closest(".ice105-song-node");if(!node||e.target.closest("[data-ice107-focus]"))return;
    clearTimeout(longTimer);longReady=false;longId=node.dataset.songId||"";
    longTimer=setTimeout(function(){longReady=true;try{navigator.vibrate&&navigator.vibrate(18)}catch(_){}},520)
  });
  panel.addEventListener("pointerup",function(e){
    clearTimeout(longTimer);longTimer=0;
    if(longReady&&longId){
      e.preventDefault();e.stopPropagation();
      suppressClickUntil=Date.now()+420;
      var id=longId;longReady=false;longId="";setFocus(id)
    }else{longReady=false;longId=""}
  });
  ["pointercancel","pointerleave"].forEach(function(type){panel.addEventListener(type,function(){clearTimeout(longTimer);longTimer=0;longReady=false;longId=""})});
  document.addEventListener("click",function(e){
    if(Date.now()<suppressClickUntil&&e.target.closest&&e.target.closest("#icebergPanel")){e.preventDefault();e.stopImmediatePropagation()}
  },true)
}
function patch(){
  addStyle();
  if(typeof icebergSongNodesHtml105==="function")icebergSongNodesHtml105=nodeHtml;
  if(typeof drawIcebergRelations106==="function")drawIcebergRelations106=drawRelations;
  if(typeof scheduleIcebergRelations106==="function"){
    scheduleIcebergRelations106=function(){
      try{bindIcebergNodePager106()}catch(_){}
      bind();drawRelations()
    }
  }
  if(originalRequestTier){
    requestTierLoad103=function(tierId){
      var from=typeof currentTierIndex104==="function"?currentTierIndex104():-1;
      var to=tierId==="all"?-1:TIERS.findIndex(function(t){return t.id===tierId});
      if(tierId!=="all"&&to!==from)try{setIcebergNodePage106(tierId,0)}catch(_){}
      if(to!==from)clearFocus(false);
      if(to!==from&&!pendingSail108)voyageHistory108=[];
      return originalRequestTier(tierId)
    }
  }
  if(originalGetAnySong39){
    getAnySong39=function(id){return voyageSongCache108.get(String(id))||originalGetAnySong39(id)}
  }
  document.documentElement.dataset.vocaUi=VERSION;
  var footer=document.querySelector(".footer");
  if(footer)footer.textContent=footer.textContent.replace(/^v\d+\.\d+\.\d+/, "v"+VERSION);
  window.VSAIceberg108={version:VERSION,setFocus:setFocus,clearFocus:function(){clearFocus(true)},getFocus:function(){return focusId},bridge:function(){return bridgeState},sail:sailBridge108,back:voyageBack108,history:function(){return voyageHistory108.slice()}};
  bind();
  try{renderIceberg()}catch(_){}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",patch,{once:true});else patch();
})();
