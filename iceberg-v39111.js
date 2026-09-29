/* VocaDive Iceberg Expedition Analytics · v39.111.0
 * Second-stage same-layer focus + adjacent-tier vertical relation bridges.
 * Loaded by vocadive-ui-v3980.js to keep the ~1MB index stable.
 */
(function(){
"use strict";
var VERSION="39.111.0";
if(window.__VSA_ICEBERG_39111)return;
window.__VSA_ICEBERG_39111=true;

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
var diveLogOpen109=false;
var DIVE_LOG_KEY109="vsa.iceberg.diveLog.v1";
var SAVED_EXPEDITIONS_KEY110="vsa.iceberg.savedExpeditions.v1";
var savedExpeditions110=[];
var expeditionReportOpen111=new Set();
var replayState110={active:false,id:"",index:0,timer:0};
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
#icebergPanel .ice109-log-btn{border-color:rgba(131,213,242,.28)!important;background:linear-gradient(135deg,rgba(13,52,72,.68),rgba(31,39,78,.62))!important}
#icebergPanel .ice109-log{
  display:grid;grid-template-columns:minmax(0,1fr) 72px;gap:10px;
  padding:10px;border:1px solid rgba(137,213,239,.18);border-radius:14px;
  background:linear-gradient(180deg,rgba(8,32,48,.82),rgba(3,13,24,.90));
  position:relative;z-index:5;overflow:hidden
}
#icebergPanel .ice109-log:before{content:"";position:absolute;left:22px;top:44px;bottom:13px;border-left:1px dashed rgba(138,216,244,.22);pointer-events:none}
#icebergPanel .ice109-log-head{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:8px}
#icebergPanel .ice109-log-head small{display:block;color:#7dc8e3;font-size:6px;font-weight:950;letter-spacing:.11em}
#icebergPanel .ice109-log-head b{display:block;margin-top:2px;color:inherit;font-size:9px}
#icebergPanel .ice109-log-head div:last-child{display:flex;gap:4px}
#icebergPanel .ice109-log-head button{min-height:27px;padding:0 8px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(8,27,42,.5);color:inherit;font-size:6px;font-weight:900}
#icebergPanel .ice109-route{display:flex;flex-direction:column;gap:6px;min-width:0}
#icebergPanel .ice109-stop{
  display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:7px;align-items:center;
  width:100%;min-height:44px;padding:5px 7px 5px 4px;border:1px solid rgba(255,255,255,.10);
  border-radius:11px;background:rgba(6,24,37,.42);color:inherit;text-align:left;position:relative;cursor:pointer
}
#icebergPanel .ice109-stop:hover{border-color:rgba(174,230,250,.28);background:rgba(10,38,56,.58)}
#icebergPanel .ice109-stop.current{border-color:rgba(188,239,255,.42);background:rgba(16,55,73,.64)}
#icebergPanel .ice109-stop:before{
  content:"";position:absolute;left:13px;top:50%;width:7px;height:7px;border-radius:50%;
  transform:translate(-50%,-50%);background:#8bdaf5;box-shadow:0 0 10px rgba(126,218,250,.48);z-index:2
}
#icebergPanel .ice109-stop img,#icebergPanel .ice109-stop .ice109-noimg{
  width:34px;height:34px;border-radius:8px;object-fit:cover;background:#0c2c3f;display:grid;place-items:center;
  margin-left:15px
}
#icebergPanel .ice109-stop-copy{min-width:0}
#icebergPanel .ice109-stop-copy b{display:block;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice109-stop-copy small{display:block;margin-top:2px;font-size:5.5px;opacity:.62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice109-stop em{font-style:normal;font-size:5.5px;opacity:.52;white-space:nowrap}
#icebergPanel .ice109-depth-axis{
  position:relative;min-height:100%;border-left:1px solid rgba(120,198,226,.16);margin-left:13px
}
#icebergPanel .ice109-depth-axis span{
  position:absolute;left:8px;top:var(--p);transform:translateY(-50%);font-size:5.5px;opacity:.48;white-space:nowrap
}
#icebergPanel .ice109-depth-axis span:before{content:"";position:absolute;left:-10px;top:50%;width:7px;border-top:1px solid rgba(120,198,226,.24)}
#icebergPanel .ice109-summary{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
#icebergPanel .ice109-summary span{min-height:18px;display:inline-flex;align-items:center;padding:0 6px;border-radius:999px;background:rgba(7,27,42,.4);font-size:5.5px;opacity:.7}
@media(max-width:560px){
 #icebergPanel .ice109-log{grid-template-columns:minmax(0,1fr) 54px;padding:8px;gap:7px}
 #icebergPanel .ice109-stop{grid-template-columns:30px minmax(0,1fr);padding-right:5px}
 #icebergPanel .ice109-stop em{display:none}
 #icebergPanel .ice109-stop img,#icebergPanel .ice109-stop .ice109-noimg{width:30px;height:30px;margin-left:12px}
 #icebergPanel .ice109-log:before{left:19px}
}
#icebergPanel .ice110-actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
#icebergPanel .ice110-actions button{min-height:28px;padding:0 8px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(8,28,43,.52);color:inherit;font-size:6px;font-weight:900}
#icebergPanel .ice110-save{border-color:rgba(124,223,205,.28)!important;background:linear-gradient(135deg,rgba(18,65,65,.7),rgba(28,54,81,.66))!important}
#icebergPanel .ice110-saved{grid-column:1/-1;display:grid;gap:6px;margin-top:5px}
#icebergPanel .ice110-saved-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
#icebergPanel .ice110-saved-head small{font-size:6px;font-weight:950;letter-spacing:.1em;color:#75c7df}
#icebergPanel .ice110-saved-head span{font-size:5.5px;opacity:.55}
#icebergPanel .ice110-card{
  display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:8px;align-items:center;
  min-height:58px;padding:7px;border:1px solid rgba(255,255,255,.1);border-radius:12px;
  background:linear-gradient(135deg,rgba(7,28,42,.58),rgba(10,24,40,.54))
}
#icebergPanel .ice110-card-cover{width:46px;height:46px;border-radius:10px;overflow:hidden;background:#0d2c3f;position:relative}
#icebergPanel .ice110-card-cover img{width:100%;height:100%;object-fit:cover}
#icebergPanel .ice110-card-cover span{position:absolute;left:4px;bottom:4px;padding:2px 4px;border-radius:999px;background:rgba(3,17,27,.75);font-size:5px;font-weight:950;color:#ccefff}
#icebergPanel .ice110-card-main{min-width:0}
#icebergPanel .ice110-card-main b{display:block;font-size:7.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice110-card-main small{display:block;margin-top:2px;font-size:5.5px;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice110-statline{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
#icebergPanel .ice110-statline span{min-height:17px;display:inline-flex;align-items:center;padding:0 5px;border-radius:999px;background:rgba(255,255,255,.045);font-size:5.2px;opacity:.72}
#icebergPanel .ice110-card-actions{display:flex;gap:4px;flex-direction:column}
#icebergPanel .ice110-card-actions button{min-height:28px;padding:0 8px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(7,26,40,.52);color:inherit;font-size:5.7px;font-weight:900}
#icebergPanel .ice110-card-actions .replay{border-color:rgba(112,206,241,.28);background:rgba(16,54,74,.62)}
#icebergPanel .ice110-card-actions .delete{opacity:.58}
#icebergPanel .ice110-replaybar{
  grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:8px;
  min-height:34px;padding:6px 8px;border:1px solid rgba(124,211,243,.2);border-radius:10px;
  background:linear-gradient(90deg,rgba(10,39,57,.74),rgba(24,33,68,.66))
}
#icebergPanel .ice110-replaybar b{font-size:6.5px}
#icebergPanel .ice110-replaybar small{display:block;margin-top:2px;font-size:5.3px;opacity:.6}
#icebergPanel .ice110-replaybar button{min-height:26px;padding:0 8px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:rgba(8,24,38,.55);color:inherit;font-size:5.7px;font-weight:900}
#icebergPanel .ice110-rarity{color:#9eead4!important}
@media(max-width:560px){
 #icebergPanel .ice110-card{grid-template-columns:40px minmax(0,1fr);gap:7px}
 #icebergPanel .ice110-card-cover{width:40px;height:40px}
 #icebergPanel .ice110-card-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}
 #icebergPanel .ice110-card-actions button{width:100%}
}
#icebergPanel .ice111-report{
  grid-column:1/-1;display:grid;gap:8px;margin-top:2px;padding:9px;
  border:1px solid rgba(133,213,240,.15);border-radius:11px;
  background:linear-gradient(180deg,rgba(5,23,36,.64),rgba(4,17,28,.72))
}
#icebergPanel .ice111-report-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
#icebergPanel .ice111-report-head small{font-size:5.5px;font-weight:950;letter-spacing:.1em;color:#76cbe6}
#icebergPanel .ice111-report-head span{font-size:5.2px;opacity:.48}
#icebergPanel .ice111-report-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#icebergPanel .ice111-panel{min-width:0;padding:7px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.025)}
#icebergPanel .ice111-panel>small{display:block;color:#7cbdd3;font-size:5.3px;font-weight:950;letter-spacing:.07em}
#icebergPanel .ice111-panel>b{display:block;margin-top:3px;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice111-panel p{margin:3px 0 0;font-size:5.4px;line-height:1.45;opacity:.58}
#icebergPanel .ice111-bars{display:grid;gap:4px;margin-top:5px}
#icebergPanel .ice111-bar{display:grid;grid-template-columns:minmax(0,62px) 1fr 24px;gap:4px;align-items:center}
#icebergPanel .ice111-bar label{font-size:5.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#icebergPanel .ice111-bar i{display:block;height:5px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden}
#icebergPanel .ice111-bar i:before{content:"";display:block;width:var(--w);height:100%;border-radius:inherit;background:linear-gradient(90deg,#68d6cf,#7790ee)}
#icebergPanel .ice111-bar em{font-style:normal;text-align:right;font-size:5.1px;opacity:.5}
#icebergPanel .ice111-highlight{display:grid;grid-template-columns:1fr 1fr;gap:6px}
#icebergPanel .ice111-highlight .ice111-panel{background:linear-gradient(135deg,rgba(10,37,51,.56),rgba(20,26,50,.48))}
#icebergPanel .ice111-profile{grid-column:1/-1;padding:8px;border-radius:10px;border:1px solid rgba(126,220,199,.16);background:linear-gradient(135deg,rgba(11,46,45,.45),rgba(12,31,52,.48))}
#icebergPanel .ice111-profile small{display:block;font-size:5.3px;color:#8edbcc;font-weight:950;letter-spacing:.08em}
#icebergPanel .ice111-profile b{display:block;margin-top:3px;font-size:8px}
#icebergPanel .ice111-profile p{margin:3px 0 0;font-size:5.5px;line-height:1.45;opacity:.62}
#icebergPanel .ice111-analysis-btn{border-color:rgba(135,211,240,.22)!important}
@media(max-width:780px){#icebergPanel .ice111-report-grid{grid-template-columns:1fr 1fr}}
@media(max-width:520px){
 #icebergPanel .ice111-report-grid,#icebergPanel .ice111-highlight{grid-template-columns:1fr}
 #icebergPanel .ice111-bar{grid-template-columns:minmax(0,54px) 1fr 22px}
}
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
function saveDiveLog109(){
  try{sessionStorage.setItem(DIVE_LOG_KEY109,JSON.stringify(voyageHistory108.slice(-16)))}catch(_){}
}
function loadDiveLog109(){
  try{
    var rows=JSON.parse(sessionStorage.getItem(DIVE_LOG_KEY109)||"[]");
    if(Array.isArray(rows))voyageHistory108=rows.filter(function(x){return x&&x.tierId&&x.song&&x.song.contentId}).slice(-16)
  }catch(_){}
  voyageHistory108.forEach(function(x){if(x&&x.song)voyageSongCache108.set(String(x.song.contentId),x.song)})
}
function diveLogEntries109(){
  var rows=voyageHistory108.slice();
  var center=focusSong();
  if(center&&state.tier!=="all"){
    var tier=TIERS.find(function(t){return t.id===state.tier});
    var current={tierId:state.tier,tierName:tier?tier.name:state.tier,song:compactVoyageSong108(center),at:Date.now(),current:true};
    var last=rows[rows.length-1];
    if(!last||last.tierId!==current.tierId||!last.song||last.song.contentId!==current.song.contentId)rows.push(current);
    else rows[rows.length-1]=Object.assign({},last,{current:true})
  }
  return rows.slice(-17)
}
function tierDepthPct109(tierId){
  var idx=TIERS.findIndex(function(t){return t.id===tierId});
  if(idx<0)return 0;
  return Math.round((idx/Math.max(1,TIERS.length-1))*100)
}
function diveLogStats109(rows){
  if(!rows.length)return{deepest:null,delta:0,unique:0};
  var unique=new Set(),deepest=rows[0],min=99,max=-1;
  rows.forEach(function(x){
    if(x.song&&x.song.contentId)unique.add(x.song.contentId);
    var i=TIERS.findIndex(function(t){return t.id===x.tierId});
    if(i>=0){if(i>max){max=i;deepest=x}if(i<min)min=i}
  });
  return{deepest:deepest,delta:max>=0&&min<99?max-min:0,unique:unique.size}
}
function loadSavedExpeditions110(){
  try{
    var rows=JSON.parse(localStorage.getItem(SAVED_EXPEDITIONS_KEY110)||"[]");
    if(Array.isArray(rows))savedExpeditions110=rows.filter(function(x){return x&&x.id&&Array.isArray(x.route)&&x.route.length}).slice(0,20)
  }catch(_){savedExpeditions110=[]}
  savedExpeditions110.forEach(function(card){(card.route||[]).forEach(function(x){if(x&&x.song)voyageSongCache108.set(String(x.song.contentId),x.song)})})
}
function persistSavedExpeditions110(){
  try{localStorage.setItem(SAVED_EXPEDITIONS_KEY110,JSON.stringify(savedExpeditions110.slice(0,20)))}catch(_){}
}
function routeSignature110(rows){
  return (rows||[]).map(function(x){return String(x.tierId||"")+"@"+String(x.song&&x.song.contentId||"")}).join(">")
}
function routeStats110(rows){
  var unique=new Map(),sumViews=0,maxIdx=-1,depthSum=0,validDepth=0,deepest=null;
  (rows||[]).forEach(function(x){
    var song=x.song||{},id=String(song.contentId||"");
    if(id&&!unique.has(id))unique.set(id,song);
    var idx=TIERS.findIndex(function(t){return t.id===x.tierId});
    if(idx>=0){depthSum+=idx/Math.max(1,TIERS.length-1);validDepth++;if(idx>maxIdx){maxIdx=idx;deepest=x}}
  });
  unique.forEach(function(song){sumViews+=Math.max(0,+song.viewCounter||0)});
  var avgViews=unique.size?sumViews/unique.size:0;
  var depthFactor=validDepth?depthSum/validDepth:0;
  var viewRarity=1-Math.min(1,Math.log10(avgViews+1)/7);
  var rarity=Math.max(0,Math.min(100,Math.round((depthFactor*.58+viewRarity*.42)*100)));
  return{
    unique:unique.size,
    avgViews:Math.round(avgViews),
    rarity:rarity,
    deepest:deepest,
    deepestIndex:maxIdx,
    steps:rows?rows.length:0
  }
}
function expeditionTitle110(rows,stats){
  var last=rows&&rows[rows.length-1],deep=stats&&stats.deepest;
  var tier=deep?(deep.tierName||deep.tierId):"빙산";
  var song=last&&last.song&&(last.song.title||last.song.contentId)||"탐사";
  if(song.length>20)song=song.slice(0,20)+"…";
  return tier+" 항해 · "+song
}
function saveCurrentExpedition110(){
  var rows=diveLogEntries109().map(function(x){return{tierId:x.tierId,tierName:x.tierName,song:compactVoyageSong108(x.song),at:+x.at||Date.now()}});
  if(!rows.length){try{toast("저장할 항해 기록이 없습니다.")}catch(_){}return}
  var sig=routeSignature110(rows),dup=savedExpeditions110.find(function(x){return x.signature===sig});
  if(dup){try{toast("같은 경로가 이미 저장되어 있습니다.")}catch(_){}return}
  var stats=routeStats110(rows),card={
    id:"exp_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7),
    title:expeditionTitle110(rows,stats),
    createdAt:Date.now(),
    signature:sig,
    sourceMode:state.sourceMode||"",
    year:state.year||"all",
    route:rows,
    stats:stats
  };
  savedExpeditions110.unshift(card);if(savedExpeditions110.length>20)savedExpeditions110.length=20;
  persistSavedExpeditions110();
  try{toast("탐사 기록 카드를 저장했습니다.")}catch(_){}
  renderIceberg()
}
function deleteExpedition110(id){
  expeditionReportOpen111.delete(id);
  savedExpeditions110=savedExpeditions110.filter(function(x){return x.id!==id});
  persistSavedExpeditions110();
  if(replayState110.id===id)stopReplay110();
  renderIceberg()
}
function countMapTop111(map,limit){
  return [...map.entries()].sort(function(a,b){return b[1]-a[1]||String(a[0]).localeCompare(String(b[0]))}).slice(0,limit||5)
}
function vocalTags111(song){
  var raw=[];
  try{raw=typeof parseTags==="function"?parseTags(song&&song.tags):Array.isArray(song&&song.tags)?song.tags:[]}catch(_){raw=[]}
  var names=["初音ミク","鏡音リン","鏡音レン","巡音ルカ","MEIKO","KAITO","GUMI","Megpoid","IA","flower","v flower","音街ウナ","結月ゆかり","重音テト","波音リツ","可不","星界","裏命","知声","小春六花","夏色花梨","花隈千冬","宮舞モカ","Synthesizer V","UTAU"];
  var out=[];
  raw.forEach(function(tag){names.forEach(function(n){if(String(tag).toLowerCase().includes(String(n).toLowerCase()))out.push(n)})});
  return [...new Set(out)]
}
function producerTags111(song){
  var raw=[];
  try{raw=typeof parseTags==="function"?parseTags(song&&song.tags):Array.isArray(song&&song.tags)?song.tags:[]}catch(_){raw=[]}
  return [...new Set(raw.filter(function(tag){
    tag=String(tag||"").trim();
    if(!tag||tag.length>32)return false;
    if(/^(VOCALOID|UTAU|Synthesizer|初音ミク|鏡音リン|鏡音レン|巡音ルカ|GUMI|IA|flower|KAITO|MEIKO)$/i.test(tag))return false;
    return /(?:^|[^A-Za-z0-9])[A-Za-z0-9ぁ-んァ-ヶ一-龠々ー・_.-]{1,24}P$/i.test(tag)||/P名|プロデューサー/i.test(tag)
  }))]
}
function genreTags111(song){
  var raw=[];
  try{raw=typeof parseTags==="function"?parseTags(song&&song.tags):Array.isArray(song&&song.tags)?song.tags:[]}catch(_){raw=[]}
  var keys=(typeof MUSIC_TAG_HINTS!=="undefined"&&Array.isArray(MUSIC_TAG_HINTS))?MUSIC_TAG_HINTS:[
    "ロック","ROCK","VOCAROCK","エレクトロ","テクノ","トランス","EDM","ハウス","ポップ","バラード","ジャズ","メタル","ピアノ","和風","民族調","オーケストラ","シューゲイザー","ドラムンベース","DnB","ダブステップ","チップチューン","ファンク","ラップ","ヒップホップ","ダーク","幻想","疾走感","かわいい","可愛い"
  ];
  var out=[];
  raw.forEach(function(tag){
    var low=String(tag).toLowerCase();
    keys.forEach(function(k){if(low.includes(String(k).toLowerCase()))out.push(String(k))})
  });
  return [...new Set(out)]
}
function distribution111(rows,extractor){
  var m=new Map();
  (rows||[]).forEach(function(x){(extractor(x.song||{})||[]).forEach(function(k){m.set(k,(m.get(k)||0)+1)})});
  return countMapTop111(m,5)
}
function rarestSong111(rows){
  var best=null;
  (rows||[]).forEach(function(x){
    var v=+((x.song||{}).viewCounter)||0;
    if(v<=0)return;
    if(!best||v<best.views)best={song:x.song,views:v,tierName:x.tierName||x.tierId}
  });
  return best
}
function biggestViewJump111(rows){
  var best=null;
  for(var i=1;i<(rows||[]).length;i++){
    var a=rows[i-1]&&rows[i-1].song||{},b=rows[i]&&rows[i].song||{};
    var va=Math.max(1,+a.viewCounter||0),vb=Math.max(1,+b.viewCounter||0);
    var ratio=Math.max(va,vb)/Math.min(va,vb),score=Math.abs(Math.log10(vb)-Math.log10(va));
    if(!best||score>best.score)best={from:a,to:b,fromTier:rows[i-1].tierName||rows[i-1].tierId,toTier:rows[i].tierName||rows[i].tierId,ratio:ratio,score:score,direction:vb<va?"down":"up"}
  }
  return best
}
function expeditionProfile111(rows,stats){
  var avgDepth=0,n=0,deepMoves=0,upMoves=0;
  (rows||[]).forEach(function(x,i){
    var idx=TIERS.findIndex(function(t){return t.id===x.tierId});
    if(idx>=0){avgDepth+=idx/Math.max(1,TIERS.length-1);n++}
    if(i){var prev=TIERS.findIndex(function(t){return t.id===rows[i-1].tierId});if(prev>=0&&idx>=0){if(idx>prev)deepMoves++;if(idx<prev)upMoves++}}
  });
  avgDepth=n?avgDepth/n:0;
  var label="균형 탐사형",desc="표층과 심층을 비교적 고르게 오가며 관계곡을 따라간 경로입니다.";
  if(avgDepth>.68&&stats.rarity>=60){label="심해 발굴형";desc="깊은 층과 낮은 조회수 곡 비중이 높아 발굴 성향이 강한 항해입니다."}
  else if(avgDepth>.62){label="심층 추적형";desc="심층권 체류가 길고 아래 방향 브리지를 꾸준히 따라간 경로입니다."}
  else if(avgDepth<.28){label="표층 순회형";desc="상위 조회수 층 중심으로 유명곡 관계망을 넓게 훑은 경로입니다."}
  else if(deepMoves>=upMoves+2){label="하강 탐사형";desc="상승보다 하강 이동이 많아 점점 더 깊은 곡으로 파고든 경로입니다."}
  else if(upMoves>=deepMoves+2){label="역상승 추적형";desc="깊은 곳에서 출발해 관계를 따라 더 알려진 상위층으로 거슬러 올라간 경로입니다."}
  return{label:label,desc:desc,avgDepth:avgDepth,deepMoves:deepMoves,upMoves:upMoves}
}
function expeditionAnalysis111(rows){
  var stats=routeStats110(rows),producer=distribution111(rows,producerTags111),vocal=distribution111(rows,vocalTags111),genre=distribution111(rows,genreTags111);
  return{stats:stats,producer:producer,vocal:vocal,genre:genre,rarest:rarestSong111(rows),jump:biggestViewJump111(rows),profile:expeditionProfile111(rows,stats)}
}
function barsHtml111(title,rows){
  if(!rows||!rows.length)return '<div class="ice111-panel"><small>'+esc107(title)+'</small><b>확인 가능한 태그 없음</b><p>저장된 곡 태그에서 식별되는 항목만 집계합니다.</p></div>';
  var max=Math.max.apply(null,rows.map(function(x){return x[1]}))||1;
  return '<div class="ice111-panel"><small>'+esc107(title)+'</small><div class="ice111-bars">'+rows.map(function(x){
    return '<div class="ice111-bar"><label title="'+esc107(x[0])+'">'+esc107(x[0])+'</label><i style="--w:'+Math.round(x[1]/max*100)+'%"></i><em>'+x[1]+'</em></div>'
  }).join("")+'</div></div>'
}
function expeditionReportHtml111(card){
  if(!expeditionReportOpen111.has(card.id))return"";
  var a=expeditionAnalysis111(card.route||[]),rare=a.rarest,jump=a.jump;
  var rareTitle=rare&&rare.song?(rare.song.title||rare.song.contentId):"조회수 정보 없음";
  var rareMeta=rare?"조회 "+fmt107(rare.views)+" · "+(rare.tierName||""):"유효한 조회수 데이터를 찾지 못했습니다.";
  var jumpTitle=jump?(jump.from.title||jump.from.contentId)+" → "+(jump.to.title||jump.to.contentId):"급변 구간 없음";
  var jumpMeta=jump?(jump.direction==="down"?"조회수 하락 ":"조회수 상승 ")+jump.ratio.toFixed(jump.ratio>=10?0:1)+"배 · "+(jump.fromTier||"")+" → "+(jump.toTier||""):"경로가 2지점 미만입니다.";
  return '<div class="ice111-report"><div class="ice111-report-head"><small>EXPEDITION ANALYSIS · 태그 기반</small><span>P/보컬/장르는 저장 곡 태그에서 확인 가능한 항목만 집계</span></div>'+
    '<div class="ice111-report-grid">'+
      barsHtml111("P / 프로듀서 태그",a.producer)+
      barsHtml111("보컬 분포",a.vocal)+
      barsHtml111("장르·분위기 분포",a.genre)+
    '</div>'+
    '<div class="ice111-highlight">'+
      '<div class="ice111-panel"><small>가장 희귀했던 곡</small><b>'+esc107(rareTitle)+'</b><p>'+esc107(rareMeta)+'</p></div>'+
      '<div class="ice111-panel"><small>조회수 급변 구간</small><b>'+esc107(jumpTitle)+'</b><p>'+esc107(jumpMeta)+'</p></div>'+
    '</div>'+
    '<div class="ice111-profile"><small>EXPLORATION PROFILE</small><b>'+esc107(a.profile.label)+'</b><p>'+esc107(a.profile.desc)+' · 하강 '+a.profile.deepMoves+'회 / 상승 '+a.profile.upMoves+'회</p></div>'+
  '</div>'
}
function expeditionCardHtml110(card){
  var rows=card.route||[],stats=card.stats||routeStats110(rows);
  var last=rows[rows.length-1]||{},song=last.song||{},cover=song.thumbnailUrl?'<img src="'+esc107(song.thumbnailUrl)+'" loading="lazy" alt="">':'';
  var deepest=stats.deepest?(stats.deepest.tierName||stats.deepest.tierId):"-";
  var date="";
  try{date=new Date(card.createdAt||Date.now()).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch(_){}
  var open=expeditionReportOpen111.has(card.id);
  return '<div class="ice110-card"><div class="ice110-card-cover">'+cover+'<span>'+esc107(deepest)+'</span></div>'+
    '<div class="ice110-card-main"><b>'+esc107(card.title||"저장된 탐사")+'</b><small>'+esc107(date)+' · '+stats.steps+'단계</small>'+
    '<div class="ice110-statline"><span>'+stats.unique+'곡</span><span>평균 '+fmt107(stats.avgViews)+'회</span><span>최심 '+esc107(deepest)+'</span><span class="ice110-rarity">희귀도 '+stats.rarity+'</span></div></div>'+
    '<div class="ice110-card-actions"><button type="button" class="ice111-analysis-btn" data-ice111-analysis="'+esc107(card.id)+'">'+(open?'분석 닫기':'탐사 분석')+'</button><button type="button" class="replay" data-ice110-replay="'+esc107(card.id)+'">▶ 경로 재생</button><button type="button" class="delete" data-ice110-delete="'+esc107(card.id)+'">삭제</button></div>'+
    expeditionReportHtml111(card)+'</div>'
}
function savedExpeditionsHtml110(){
  if(!savedExpeditions110.length)return '<div class="ice110-saved"><div class="ice110-saved-head"><small>SAVED EXPEDITIONS</small><span>저장된 탐사 없음</span></div></div>';
  return '<div class="ice110-saved"><div class="ice110-saved-head"><small>SAVED EXPEDITIONS</small><span>'+savedExpeditions110.length+'개 저장</span></div>'+savedExpeditions110.slice(0,8).map(expeditionCardHtml110).join("")+'</div>'
}
function replayBarHtml110(){
  if(!replayState110.active)return"";
  var card=savedExpeditions110.find(function(x){return x.id===replayState110.id});
  var total=card&&card.route?card.route.length:0;
  return '<div class="ice110-replaybar"><div><b>REPLAY VOYAGE · '+esc107(card&&card.title||"저장 경로")+'</b><small>'+(replayState110.index+1)+' / '+total+' 지점 재생 중</small></div><button type="button" data-ice110-stop>중지</button></div>'
}
function stopReplay110(){
  replayState110.active=false;replayState110.id="";replayState110.index=0;
  clearTimeout(replayState110.timer);replayState110.timer=0
}
function handoffReplayStop110(item,callback){
  var ticket={seq:++voyageSeq108,tierId:item.tierId,direction:"replay",song:item.song};
  pendingSail108=ticket;focusId="";bridgeState={focusId:"",loading:false,up:[],down:[]};
  requestTierLoad103(item.tierId);
  var tries=0;
  (function poll(){
    if(!replayState110.active||!pendingSail108||pendingSail108.seq!==ticket.seq)return;
    if(state.tier!==ticket.tierId||state.busy){
      if(tries++<70){setTimeout(poll,120);return}
      pendingSail108=null;stopReplay110();try{toast("저장 경로 재생이 중단되었습니다.")}catch(_){};renderIceberg();return
    }
    pendingSail108=null;
    voyageSongCache108.set(String(item.song.contentId),item.song);
    var exists=(state.songs||[]).some(function(x){return x&&String(x.contentId)===String(item.song.contentId)});
    if(!exists&&Array.isArray(state.songs))state.songs.unshift(item.song);
    focusId=item.song.contentId;bridgeState={focusId:focusId,loading:true,up:[],down:[]};
    try{renderIceberg()}catch(_){}
    loadBridges(item.song);
    callback()
  })()
}
function replaySavedRoute110(id){
  var card=savedExpeditions110.find(function(x){return x.id===id});
  if(!card||!card.route||!card.route.length||pendingSail108)return;
  stopReplay110();
  replayState110={active:true,id:id,index:0,timer:0};
  voyageHistory108=[];saveDiveLog109();diveLogOpen109=true;
  function step(){
    if(!replayState110.active)return;
    var route=card.route||[],i=replayState110.index,item=route[i];
    if(!item){stopReplay110();try{toast("저장 경로 재생을 완료했습니다.")}catch(_){};renderIceberg();return}
    handoffReplayStop110(item,function(){
      voyageHistory108=route.slice(0,i).map(function(x){return{tierId:x.tierId,tierName:x.tierName,song:x.song,at:x.at||Date.now()}});
      saveDiveLog109();
      renderIceberg();
      replayState110.index=i+1;
      replayState110.timer=setTimeout(step,900)
    })
  }
  step()
}
function diveLogHtml109(){
  if(!diveLogOpen109)return"";
  var rows=diveLogEntries109(),stats=diveLogStats109(rows);
  if(!rows.length)return '<div class="ice109-log"><div class="ice109-log-head"><div><small>DIVE LOG · DEPTH MAP</small><b>아직 현재 항해 기록이 없습니다.</b></div><div><button type="button" data-ice109-close>닫기</button></div></div>'+replayBarHtml110()+savedExpeditionsHtml110()+'</div>';
  var stops=rows.map(function(x,i){
    var song=x.song||{},img=song.thumbnailUrl?'<img src="'+esc107(song.thumbnailUrl)+'" loading="lazy" alt="">':'<span class="ice109-noimg">♪</span>';
    var depth=(typeof ICEBERG_DEPTH_LABELS_103!=="undefined"&&ICEBERG_DEPTH_LABELS_103[TIERS.findIndex(function(t){return t.id===x.tierId})])||x.tierName||x.tierId;
    return '<button type="button" class="ice109-stop'+(x.current?' current':'')+'" data-ice109-jump="'+i+'" '+(x.current?'disabled':'')+'>'+img+
      '<span class="ice109-stop-copy"><b>'+esc107(song.title||song.contentId||"탐사")+'</b><small>'+esc107(x.tierName||x.tierId)+' · '+esc107(depth)+'</small></span><em>'+tierDepthPct109(x.tierId)+'%</em></button>'
  }).join("");
  var deepest=stats.deepest?(stats.deepest.tierName||stats.deepest.tierId):"-";
  var richStats=routeStats110(rows);
  return '<div class="ice109-log"><div class="ice109-log-head"><div><small>DIVE LOG · DEPTH MAP</small><b>이번 항해의 수심 경로</b><div class="ice109-summary"><span>'+rows.length+' 지점</span><span>'+stats.unique+'곡</span><span>최심 '+esc107(deepest)+'</span><span>평균 '+fmt107(richStats.avgViews)+'회</span><span class="ice110-rarity">희귀도 '+richStats.rarity+'</span></div></div>'+
    '<div><button type="button" class="ice110-save" data-ice110-save>＋ 탐사 카드 저장</button><button type="button" data-ice109-clearlog>기록 초기화</button><button type="button" data-ice109-close>닫기</button></div></div>'+
    replayBarHtml110()+
    '<div class="ice109-route">'+stops+'</div>'+
    '<div class="ice109-depth-axis"><span style="--p:0%">SURFACE</span><span style="--p:33%">1,500m</span><span style="--p:66%">3,000m</span><span style="--p:100%">ABYSS</span></div>'+
    savedExpeditionsHtml110()+'</div>'
}
function jumpDiveLog109(index){
  var rows=diveLogEntries109(),item=rows[index];
  if(!item||!item.song||pendingSail108)return;
  if(item.current){diveLogOpen109=false;renderIceberg();return}
  voyageHistory108=rows.slice(0,index).filter(function(x){return !x.current});
  saveDiveLog109();
  var ticket={seq:++voyageSeq108,tierId:item.tierId,direction:"log",song:item.song};
  pendingSail108=ticket;focusId="";bridgeState={focusId:"",loading:false,up:[],down:[]};
  requestTierLoad103(item.tierId);
  setTimeout(function(){waitForSail108(ticket,0)},80)
}
function clearDiveLog109(){
  voyageHistory108=[];saveDiveLog109();diveLogOpen109=false;
  try{renderIceberg()}catch(_){}
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
    '<div><button type="button" class="ice109-log-btn" data-ice109-log>⌁ DIVE LOG</button> <button type="button" class="ice108-back" data-ice108-back '+(voyageHistory108.length?'':'disabled')+'>← 항해 뒤로</button> <button type="button" data-ice107-clear>포커스 해제 ×</button></div></div>'
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
  voyageHistory108.push(item);if(voyageHistory108.length>16)voyageHistory108.shift();saveDiveLog109()
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
  var item=voyageHistory108.pop();if(!item||!item.song)return;saveDiveLog109();
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
    (center?diveLogHtml109():'')+
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
    var analysis=e.target.closest("[data-ice111-analysis]");
    if(analysis){
      e.preventDefault();e.stopPropagation();
      var id=analysis.dataset.ice111Analysis;
      if(expeditionReportOpen111.has(id))expeditionReportOpen111.delete(id);else expeditionReportOpen111.add(id);
      renderIceberg();return
    }
    var saveExp=e.target.closest("[data-ice110-save]");
    if(saveExp){e.preventDefault();e.stopPropagation();saveCurrentExpedition110();return}
    var replay=e.target.closest("[data-ice110-replay]");
    if(replay){e.preventDefault();e.stopPropagation();replaySavedRoute110(replay.dataset.ice110Replay);return}
    var del=e.target.closest("[data-ice110-delete]");
    if(del){e.preventDefault();e.stopPropagation();deleteExpedition110(del.dataset.ice110Delete);return}
    var stop=e.target.closest("[data-ice110-stop]");
    if(stop){e.preventDefault();e.stopPropagation();stopReplay110();renderIceberg();return}
    var log=e.target.closest("[data-ice109-log]");
    if(log){e.preventDefault();e.stopPropagation();diveLogOpen109=!diveLogOpen109;renderIceberg();return}
    var closeLog=e.target.closest("[data-ice109-close]");
    if(closeLog){e.preventDefault();e.stopPropagation();diveLogOpen109=false;renderIceberg();return}
    var clearLog=e.target.closest("[data-ice109-clearlog]");
    if(clearLog){e.preventDefault();e.stopPropagation();clearDiveLog109();return}
    var jump=e.target.closest("[data-ice109-jump]");
    if(jump&&!jump.disabled){e.preventDefault();e.stopPropagation();jumpDiveLog109(+jump.dataset.ice109Jump);return}
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
  loadDiveLog109();
  loadSavedExpeditions110();
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
      if(to!==from&&!pendingSail108){stopReplay110();voyageHistory108=[];diveLogOpen109=false;saveDiveLog109()}
      return originalRequestTier(tierId)
    }
  }
  if(originalGetAnySong39){
    getAnySong39=function(id){return voyageSongCache108.get(String(id))||originalGetAnySong39(id)}
  }
  document.documentElement.dataset.vocaUi=VERSION;
  var footer=document.querySelector(".footer");
  if(footer)footer.textContent=footer.textContent.replace(/^v\d+\.\d+\.\d+/, "v"+VERSION);
  window.VSAIceberg111={version:VERSION,setFocus:setFocus,clearFocus:function(){clearFocus(true)},getFocus:function(){return focusId},bridge:function(){return bridgeState},sail:sailBridge108,back:voyageBack108,history:function(){return voyageHistory108.slice()},openLog:function(){diveLogOpen109=true;renderIceberg()},clearLog:clearDiveLog109,saved:function(){return savedExpeditions110.slice()},save:saveCurrentExpedition110,replay:replaySavedRoute110,stopReplay:stopReplay110,analyze:function(id){var c=savedExpeditions110.find(function(x){return x.id===id});return c?expeditionAnalysis111(c.route||[]):null}};
  bind();
  try{renderIceberg()}catch(_){}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",patch,{once:true});else patch();
})();
