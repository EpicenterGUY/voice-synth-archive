/* VocaDive Iceberg Focus Dive · v39.107.0
 * Second-stage same-layer focus + adjacent-tier vertical relation bridges.
 * Loaded by vocadive-ui-v3980.js to keep the ~1MB index stable.
 */
(function(){
"use strict";
var VERSION="39.107.0";
if(window.__VSA_ICEBERG_39107)return;
window.__VSA_ICEBERG_39107=true;

var focusId="";
var bridgeState={focusId:"",loading:false,up:[],down:[]};
var bridgeSeq=0;
var longTimer=0;
var longReady=false;
var longId="";
var suppressClickUntil=0;
var originalRequestTier=typeof requestTierLoad103==="function"?requestTierLoad103:null;

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
@media(prefers-reduced-motion:reduce){#icebergPanel .ice107-focus-neighbor{animation:none!important}}
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
function bridgeCard(x){
  if(!x||!x.song)return"";
  var song=x.song,rel=x.rel;
  var img=song.thumbnailUrl?'<img src="'+esc107(song.thumbnailUrl)+'" loading="lazy" alt="">':'<span class="ice107-noimg">♪</span>';
  return '<button type="button" class="ice107-bridge-card" data-kind="'+esc107(rel&&rel.kind||"tag")+'" data-v399-play="'+esc107(song.contentId)+'" title="'+esc107(song.title||song.contentId)+'">'+img+
    '<span><b>'+esc107(song.title||song.contentId)+'</b><small>'+esc107(rel?rel.label:"유사곡")+' · 조회 '+fmt107(song.viewCounter||0)+'</small></span></button>'
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
  else if(rows&&rows.length)body='<div class="ice107-bridge-cards">'+rows.map(bridgeCard).join("")+'</div>';
  else body='<div class="ice107-bridge-empty">강한 종단 연결 없음</div>';
  return '<div class="ice107-bridge-lane '+direction+'"><div class="ice107-bridge-label">'+esc107(label)+'</div>'+body+'</div>'
}
function focusBar(center){
  if(!center)return"";
  return '<div class="ice107-focusbar"><div><small>SECOND DIVE · CENTER SONG</small><b>'+esc107(center.title||center.contentId)+'</b></div>'+
    '<button type="button" data-ice107-clear>포커스 해제 ×</button></div>'
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
  var song=(state.songs||[]).find(function(s){return s&&String(s.contentId)===String(id)});
  if(!song)return;
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
      return originalRequestTier(tierId)
    }
  }
  document.documentElement.dataset.vocaUi=VERSION;
  var footer=document.querySelector(".footer");
  if(footer)footer.textContent=footer.textContent.replace(/^v\d+\.\d+\.\d+/, "v"+VERSION);
  window.VSAIceberg107={version:VERSION,setFocus:setFocus,clearFocus:function(){clearFocus(true)},getFocus:function(){return focusId},bridge:function(){return bridgeState}};
  bind();
  try{renderIceberg()}catch(_){}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",patch,{once:true});else patch();
})();
