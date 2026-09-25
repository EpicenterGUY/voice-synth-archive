/* Voice Synth Archive Smart v23
 * Auto playlist, learned taste feedback, and saved-song view growth tracking.
 */
(function(){
"use strict";

const SMART_KEY = "vsa.smart.v23";
const ORG_KEY = "vsa.organizer.v22";
const MAX_MIX = 40;
let smart = loadSmart();
let mixPool = [];
let currentMix = [];

function blankSmart(){
  return {version:1, feedback:{}, lastMix:[], lastMixMeta:null};
}
function loadSmart(){
  try{
    const parsed = JSON.parse(localStorage.getItem(SMART_KEY) || "null");
    return Object.assign(blankSmart(), parsed || {});
  }catch(e){
    return blankSmart();
  }
}
function saveSmart(){
  try{ localStorage.setItem(SMART_KEY, JSON.stringify(smart)); }catch(e){}
}
function loadOrganizer(){
  try{
    const parsed = JSON.parse(localStorage.getItem(ORG_KEY) || "null");
    if(parsed && typeof parsed === "object") return parsed;
  }catch(e){}
  return {library:{}, snapshots:{}};
}
function saveOrganizer(data){
  try{ localStorage.setItem(ORG_KEY, JSON.stringify(data)); }catch(e){}
}
function esc23(v){
  return String(v == null ? "" : v).replace(/[&<>"']/g, function(m){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
  });
}
function fmt23(v){
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("ko-KR") : "-";
}
function clamp23(v, min, max){
  min = min == null ? 0 : min;
  max = max == null ? 1 : max;
  return Math.max(min, Math.min(max, v));
}
function uniq23(xs){
  return Array.from(new Set((xs || []).filter(Boolean)));
}
function normalizeSong23(song){
  if(!song) return null;
  return {
    contentId:String(song.contentId || ""),
    title:String(song.title || song.contentId || ""),
    description:String(song.description || ""),
    viewCounter:Number(song.viewCounter) || 0,
    commentCounter:Number(song.commentCounter) || 0,
    mylistCounter:Number(song.mylistCounter) || 0,
    likeCounter:Number(song.likeCounter) || 0,
    startTime:String(song.startTime || ""),
    lengthSeconds:Number(song.lengthSeconds) || 0,
    thumbnailUrl:String(song.thumbnailUrl || ""),
    tags:Array.isArray(song.tags) ? song.tags.slice(0,100) : String(song.tags || "")
  };
}
function tags23(song){
  const raw = song && song.tags;
  if(Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return String(raw || "").split(/[,\s　、]+/).map(function(x){ return x.trim(); }).filter(Boolean);
}
function genericTag23(tag){
  return /^VOCALOID$/i.test(tag) ||
    /オリジナル曲|伝説入り|殿堂入り|神話入り|ミリオン/.test(tag) ||
    /^(初音ミク|鏡音リン|鏡音レン|巡音ルカ|GUMI|IA|flower|KAITO|MEIKO)$/.test(tag);
}
function findSong23(id){
  id = String(id || "");
  try{
    const groups = [
      state.songs,
      state.tasteSongs,
      state.guideSongs,
      state.hiddenGems,
      state.hiddenGemPool,
      state.detectiveCandidates
    ];
    for(const group of groups){
      if(!Array.isArray(group)) continue;
      for(const item of group){
        const song = item && item.song ? item.song : item;
        if(song && song.contentId === id) return normalizeSong23(song);
      }
    }
  }catch(e){}
  const org = loadOrganizer();
  if(org.library && org.library[id]) return normalizeSong23(org.library[id].song);
  const fb = smart.feedback && smart.feedback[id];
  if(fb && fb.song) return normalizeSong23(fb.song);
  return null;
}

function feedbackValue23(id){
  return smart.feedback && smart.feedback[id] ? Number(smart.feedback[id].value) || 0 : 0;
}
function setFeedback23(id, value, song){
  id = String(id || "");
  if(!id) return;
  if(!value){
    delete smart.feedback[id];
  }else{
    smart.feedback[id] = {
      value:value,
      at:Date.now(),
      song:normalizeSong23(song || findSong23(id)) || {contentId:id,title:id}
    };
  }
  saveSmart();
  syncFeedback23(id);
  renderTasteProfile23();
  try{
    toast(value > 0 ? "이 곡 취향을 추천에 반영합니다." : value < 0 ? "이 곡과 비슷한 요소를 줄입니다." : "취향 피드백을 해제했습니다.");
  }catch(e){}
}
function syncFeedback23(id){
  document.querySelectorAll('[data-v23-like="'+id+'"]').forEach(function(btn){
    btn.classList.toggle("active", feedbackValue23(id) > 0);
  });
  document.querySelectorAll('[data-v23-dislike="'+id+'"]').forEach(function(btn){
    btn.classList.toggle("active", feedbackValue23(id) < 0);
  });
}
function libraryWeight23(status){
  if(status === "favorite") return 3.2;
  if(status === "interest") return 2.1;
  if(status === "investigate") return 1.1;
  if(status === "heard") return 0.35;
  return 0;
}
function buildTasteProfile23(){
  const org = loadOrganizer();
  const weights = new Map();
  let signalCount = 0;

  function addSong(song, weight){
    if(!song || !weight) return;
    signalCount++;
    for(const tag of tags23(song)){
      if(!tag || tag.length < 2 || genericTag23(tag)) continue;
      const important = /ロック|メタル|エレクトロ|テクノ|トランス|EDM|ジャズ|バラード|ピアノ|和風|民族調|チップチューン|シューゲイザー|ドラムンベース|変拍子|ホラー|ダーク|鬱|幻想|疾走感|中毒性|かわいい|切ない|爽やか|狂気/.test(tag);
      const multiplier = important ? 1.55 : 1;
      weights.set(tag, (weights.get(tag) || 0) + weight * multiplier);
    }
  }

  Object.keys(org.library || {}).forEach(function(id){
    const item = org.library[id];
    addSong(item.song, libraryWeight23(item.status));
  });
  Object.keys(smart.feedback || {}).forEach(function(id){
    const item = smart.feedback[id];
    addSong(item.song, (Number(item.value) || 0) * 3.5);
  });

  const positive = Array.from(weights.entries())
    .filter(function(x){ return x[1] > 0.3; })
    .sort(function(a,b){ return b[1] - a[1]; });
  const negative = Array.from(weights.entries())
    .filter(function(x){ return x[1] < -0.3; })
    .sort(function(a,b){ return a[1] - b[1]; });

  return {weights:weights, positive:positive, negative:negative, signalCount:signalCount};
}
function profileTerms23(count){
  return buildTasteProfile23().positive.slice(0, count || 8).map(function(x){ return x[0]; });
}
function parsePrompt23(text){
  const out = [];
  const map = [
    [/어둡|다크|음침/i,["ダーク","鬱"]],
    [/기괴|호러|공포|광기/i,["ホラー","狂気","不気味"]],
    [/몽환|환상/i,["幻想的","浮遊感"]],
    [/빠르|질주|업템포/i,["疾走感","アップテンポ"]],
    [/록|락/i,["VOCAROCK","ロック"]],
    [/전자|일렉|테크노/i,["エレクトロ","テクノ"]],
    [/변박|실험|전위/i,["変拍子","実験音楽"]],
    [/재즈/i,["ジャズ"]],
    [/피아노/i,["ピアノ"]],
    [/화풍|와후|일본풍/i,["和風"]],
    [/미쿠/i,["初音ミク"]],
    [/린/i,["鏡音リン"]],
    [/렌/i,["鏡音レン"]],
    [/루카/i,["巡音ルカ"]],
    [/구미/i,["GUMI"]],
    [/플라워|flower/i,["flower"]],
    [/테토/i,["重音テト"]]
  ];
  map.forEach(function(pair){
    pair[0].lastIndex = 0;
    if(pair[0].test(text || "")) out.push.apply(out, pair[1]);
  });

  String(text || "").split(/[,、/|\n]+/).map(function(x){ return x.trim(); }).forEach(function(x){
    if(x.length >= 2 && x.length < 32 && /[ぁ-ゟ゠-ヿ一-龯A-Za-z]/.test(x)) out.push(x);
  });
  return uniq23(out);
}
async function fetchTag23(term, minViews, maxViews, sort){
  const filters = {viewCounter:{gte:Math.max(0, minViews || 0)}};
  if(maxViews != null) filters.viewCounter.lte = maxViews;
  try{
    const data = await fetchNico({
      year:"all",
      limit:100,
      offset:0,
      mode:"ranking",
      sort:sort || "-mylistCounter",
      applyYear:false,
      applyTier:false,
      numericFilters:filters,
      extraExactTag:term
    });
    return data.data || [];
  }catch(e){
    return [];
  }
}
async function fetchBroad23(minViews, maxViews, sort){
  const filters = {viewCounter:{gte:Math.max(0, minViews || 0)}};
  if(maxViews != null) filters.viewCounter.lte = maxViews;
  try{
    const data = await fetchNico({
      year:"all",
      limit:100,
      offset:0,
      mode:"ranking",
      sort:sort || "-mylistCounter",
      applyYear:false,
      applyTier:false,
      numericFilters:filters
    });
    return data.data || [];
  }catch(e){
    return [];
  }
}
async function mapLimit23(items, limit, fn){
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({length:Math.min(limit, items.length)}, async function(){
    while(true){
      const i = cursor++;
      if(i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
function reaction23(song){
  const V = Number(song.viewCounter) || 0;
  const M = Number(song.mylistCounter) || 0;
  const L = Number(song.likeCounter) || 0;
  const C = Number(song.commentCounter) || 0;
  return clamp23((M+2)/(V+1000)*42 + (L+3)/(V+1400)*12 + (C+3)/(V+1000)*5);
}
function similarity23(a,b){
  const A = new Set(tags23(a).filter(function(t){ return !genericTag23(t); }));
  const B = new Set(tags23(b).filter(function(t){ return !genericTag23(t); }));
  if(!A.size || !B.size) return 0;
  let intersection = 0;
  A.forEach(function(t){ if(B.has(t)) intersection++; });
  return intersection / Math.max(1, new Set(Array.from(A).concat(Array.from(B))).size);
}
function scoreSong23(song, profile, mode, terms){
  const songTags = new Set(tags23(song));
  let positive = 0;
  let negative = 0;
  let matched = 0;

  profile.weights.forEach(function(weight, tag){
    if(songTags.has(tag)){
      if(weight > 0) positive += Math.min(6, weight);
      else negative += Math.min(8, -weight);
    }
  });
  terms.forEach(function(term){
    if(songTags.has(term) || String(song.title || "").includes(term)) matched++;
  });

  const views = Number(song.viewCounter) || 0;
  const hidden = 1 - clamp23(Math.log1p(views) / Math.log1p(10000000));
  const year = song.startTime ? new Date(song.startTime).getFullYear() : 0;
  const recent = year ? clamp23((year - (new Date().getFullYear()-8)) / 8) : 0.3;

  let score = 0.40*clamp23(positive/14) + 0.22*reaction23(song) +
    0.18*(terms.length ? matched/terms.length : 0.45) - 0.30*clamp23(negative/10);

  if(mode === "hidden") score += 0.24*hidden;
  else if(mode === "recent") score += 0.24*recent;
  else if(mode === "balanced") score += 0.10*hidden + 0.08*recent;
  else score += 0.08*hidden;

  if(feedbackValue23(song.contentId) < 0) score -= 1;
  if(feedbackValue23(song.contentId) > 0) score += 0.05;
  return score;
}
function diversify23(scored, count){
  const pool = scored.slice(0,180);
  const chosen = [];
  while(chosen.length < count && chosen.length < pool.length){
    let best = null;
    let bestValue = -Infinity;
    for(const x of pool){
      if(chosen.some(function(y){ return y.song.contentId === x.song.contentId; })) continue;
      let maxSimilarity = 0;
      for(const y of chosen) maxSimilarity = Math.max(maxSimilarity, similarity23(x.song,y.song));
      const adjusted = x.score - maxSimilarity*0.23;
      if(adjusted > bestValue){
        bestValue = adjusted;
        best = x;
      }
    }
    if(!best) break;
    chosen.push(best);
  }
  return chosen;
}
async function generateMix23(reroll){
  if(typeof relayBase === "function" && !relayBase()){
    try{ toast("먼저 Worker를 연결하세요."); }catch(e){}
    return;
  }
  const button = document.getElementById("v23GenerateMix");
  const status = document.getElementById("v23MixStatus");
  if(button) button.disabled = true;
  if(status) status.textContent = reroll ? "후보 풀에서 다른 조합을 고르는 중…" : "취향 프로필을 읽고 후보를 모으는 중…";

  try{
    const profile = buildTasteProfile23();
    const mode = (document.getElementById("v23MixMode") || {}).value || "balanced";
    const count = Math.min(MAX_MIX, Number((document.getElementById("v23MixCount") || {}).value) || 20);
    const prompt = (document.getElementById("v23MixPrompt") || {}).value || "";
    const manualTerms = parsePrompt23(prompt);
    const terms = uniq23(manualTerms.concat(profile.positive.slice(0,8).map(function(x){ return x[0]; }))).slice(0,10);

    const minViews = mode === "hidden" ? 100 : 0;
    const maxViews = mode === "hidden" ? 100000 : null;

    if(!reroll || !mixPool.length){
      const map = new Map();
      const termBatches = await mapLimit23(terms.slice(0,7), 3, function(term){
        return fetchTag23(term, minViews, maxViews, "-mylistCounter");
      });
      termBatches.flat().forEach(function(song){
        if(song && song.contentId) map.set(song.contentId, song);
      });

      const broadBatches = await mapLimit23(["-mylistCounter","-commentCounter","-startTime"], 3, function(sort){
        return fetchBroad23(minViews, maxViews, sort);
      });
      broadBatches.flat().forEach(function(song){
        if(song && song.contentId) map.set(song.contentId, song);
      });

      const org = loadOrganizer();
      let songs = Array.from(map.values()).filter(function(song){
        return feedbackValue23(song.contentId) >= 0;
      });
      if(mode === "recent"){
        const cutoff = new Date().getFullYear() - 4;
        songs = songs.filter(function(song){
          return !song.startTime || new Date(song.startTime).getFullYear() >= cutoff;
        });
      }
      songs = songs.filter(function(song){
        return !(org.library && org.library[song.contentId] && org.library[song.contentId].status === "heard");
      });

      mixPool = songs.map(function(song){
        return {song:song, score:scoreSong23(song, profile, mode, terms)};
      }).sort(function(a,b){ return b.score-a.score; });
    }else{
      mixPool = mixPool.map(function(x){
        return {song:x.song, score:x.score + (Math.random()-0.5)*0.06};
      }).sort(function(a,b){ return b.score-a.score; });
    }

    if(!mixPool.length) throw new Error("추천 후보를 만들지 못했습니다.");
    currentMix = diversify23(mixPool, count);
    smart.lastMix = currentMix.map(function(x){ return normalizeSong23(x.song); });
    smart.lastMixMeta = {at:Date.now(), mode:mode, terms:terms};
    saveSmart();
    renderMix23(currentMix, terms);

    if(status){
      status.textContent = "후보 "+fmt23(mixPool.length)+"곡 → "+currentMix.length+"곡 · "+
        (terms.length ? "취향 "+terms.slice(0,5).join(" / ") : "자동 다양화");
    }
  }catch(e){
    const grid = document.getElementById("v23MixGrid");
    if(grid) grid.innerHTML = '<div class="v23-empty">플레이리스트 생성 실패<br><small>'+esc23(e && e.message || e)+'</small></div>';
    if(status) status.textContent = "생성하지 못했습니다.";
  }finally{
    if(button) button.disabled = false;
  }
}
function mixReason23(song, terms){
  const profile = buildTasteProfile23();
  const songTags = new Set(tags23(song));
  const profileMatches = profile.positive.filter(function(x){ return songTags.has(x[0]); }).slice(0,3).map(function(x){ return x[0]; });
  const directMatches = terms.filter(function(t){ return songTags.has(t) || String(song.title || "").includes(t); }).slice(0,2);
  const reason = uniq23(directMatches.concat(profileMatches));
  return reason.length ? reason.join(" · ") : "반응률·다양성 보정";
}
function renderMix23(rows, terms){
  const grid = document.getElementById("v23MixGrid");
  if(!grid) return;
  grid.innerHTML = rows.map(function(x,i){
    const song = x.song;
    const year = song.startTime ? new Date(song.startTime).getFullYear() : "-";
    return '<article class="v23-mix-card">'+
      '<span class="v23-num">'+(i+1)+'</span>'+
      (song.thumbnailUrl ? '<img src="'+esc23(song.thumbnailUrl)+'" loading="lazy">' : '')+
      '<div class="v23-mix-main">'+
        '<a href="https://www.nicovideo.jp/watch/'+encodeURIComponent(song.contentId)+'" target="_blank" rel="noopener">'+esc23(song.title || song.contentId)+'</a>'+
        '<small>'+year+' · 조회 '+fmt23(song.viewCounter || 0)+' · '+esc23(mixReason23(song,terms))+'</small>'+
        '<div class="v23-actions">'+
          '<button class="mini-btn v23-feedback" data-v23-like="'+esc23(song.contentId)+'">👍 취향</button>'+
          '<button class="mini-btn v23-feedback" data-v23-dislike="'+esc23(song.contentId)+'">👎 제외</button>'+
          '<button class="mini-btn" data-v23-universe="'+esc23(song.contentId)+'">우주</button>'+
        '</div>'+
      '</div>'+
    '</article>';
  }).join("");
  rows.forEach(function(x){ syncFeedback23(x.song.contentId); });
}
function copyMix23(){
  if(!currentMix.length) return;
  const text = currentMix.map(function(x,i){
    return (i+1)+". "+(x.song.title || x.song.contentId)+" https://www.nicovideo.jp/watch/"+x.song.contentId;
  }).join("\n");

  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(function(){
      try{ toast("플레이리스트 목록을 복사했습니다."); }catch(e){}
    });
  }else{
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    try{ toast("플레이리스트 목록을 복사했습니다."); }catch(e){}
  }
}

function recordSnapshot23(org, song){
  if(!song || !song.contentId || !song.viewCounter) return;
  if(!org.snapshots) org.snapshots = {};
  const id = song.contentId;
  const day = new Date().toISOString().slice(0,10);
  const rows = Array.isArray(org.snapshots[id]) ? org.snapshots[id] : [];
  const last = rows[rows.length-1];
  if(last && last.day === day) last.views = Number(song.viewCounter) || 0;
  else rows.push({day:day, views:Number(song.viewCounter)||0});
  org.snapshots[id] = rows.slice(-30);
}
async function fetchFreshSong23(savedSong){
  if(!savedSong || !savedSong.contentId) return null;
  const queries = [];
  if(savedSong.title) queries.push({q:savedSong.title, targets:"title"});
  queries.push({q:savedSong.contentId, targets:"title,description,tags"});

  for(const item of queries){
    try{
      const data = await fetchNico({
        year:"all",
        limit:20,
        offset:0,
        mode:"free",
        query:item.q,
        queryTargets:item.targets,
        scope:"all",
        sort:"-viewCounter",
        applyYear:false,
        applyTier:false
      });
      const rows = data.data || [];
      const exact = rows.find(function(x){ return x.contentId === savedSong.contentId; });
      if(exact) return exact;
    }catch(e){}
  }
  return null;
}
function trendMetric23(id, org){
  const rows = org.snapshots && Array.isArray(org.snapshots[id]) ? org.snapshots[id] : [];
  if(rows.length < 2) return {ready:false};

  const first = rows[0];
  const last = rows[rows.length-1];
  const daysRaw = (new Date(last.day) - new Date(first.day)) / 86400000;
  const days = Math.max(1, daysRaw);
  const delta = (Number(last.views)||0) - (Number(first.views)||0);
  const daily = delta / days;
  const pctDaily = Number(first.views) ? delta / Number(first.views) / days : 0;
  const score = Math.log1p(Math.max(0,daily)) + Math.max(0,pctDaily)*16;

  let label = "안정";
  if(daily >= 1000 || pctDaily >= 0.02) label = "급상승";
  else if(daily >= 100 || pctDaily >= 0.005) label = "상승";

  return {ready:true, delta:delta, daily:daily, pctDaily:pctDaily, score:score, label:label};
}
async function refreshTrends23(){
  if(typeof relayBase === "function" && !relayBase()){
    try{ toast("먼저 Worker를 연결하세요."); }catch(e){}
    return;
  }
  const org = loadOrganizer();
  const ids = Object.keys(org.library || {}).slice(0,50);
  const button = document.getElementById("v23RefreshTrend");
  const status = document.getElementById("v23TrendStatus");

  if(!ids.length){
    if(status) status.textContent = "보관함에 곡이 없습니다.";
    return;
  }
  if(button) button.disabled = true;

  let done = 0;
  const updated = await mapLimit23(ids, 3, async function(id){
    const saved = org.library[id] && org.library[id].song;
    const fresh = await fetchFreshSong23(saved);
    done++;
    if(status) status.textContent = done+" / "+ids.length+"곡 갱신 중…";
    if(fresh){
      org.library[id] = Object.assign({}, org.library[id], {
        song:normalizeSong23(fresh),
        updatedAt:Date.now()
      });
      recordSnapshot23(org, fresh);
      return true;
    }
    return false;
  });

  saveOrganizer(org);
  renderTrends23();
  try{
    if(window.VSAOrganizer22 && window.VSAOrganizer22.renderLibrary) window.VSAOrganizer22.renderLibrary();
  }catch(e){}

  if(status){
    status.textContent = updated.filter(Boolean).length+"곡 갱신 완료 · 날짜가 쌓일수록 급상승 판정이 정확해집니다.";
  }
  if(button) button.disabled = false;
}
function renderTrends23(){
  const box = document.getElementById("v23TrendList");
  if(!box) return;
  const org = loadOrganizer();
  const rows = Object.keys(org.library || {}).map(function(id){
    return {id:id, item:org.library[id], metric:trendMetric23(id,org)};
  }).sort(function(a,b){
    return (b.metric.score || -1) - (a.metric.score || -1);
  });

  if(!rows.length){
    box.innerHTML = '<div class="v23-empty">보관한 곡이 없습니다.</div>';
    return;
  }

  box.innerHTML = rows.slice(0,30).map(function(row){
    const song = row.item.song || {contentId:row.id,title:row.id};
    const m = row.metric;
    const right = m.ready
      ? '<div class="v23-trend-num '+(m.label === "급상승" ? "hot" : "")+'"><b>'+m.label+'</b><span>'+(m.delta>=0?"+":"")+fmt23(Math.round(m.delta))+' · 하루 '+fmt23(Math.round(m.daily))+'</span></div>'
      : '<div class="v23-trend-num"><b>기준 수집 중</b><span>다른 날짜 기록 1회 더 필요</span></div>';
    return '<div class="v23-trend-row"><div><b>'+esc23(song.title || row.id)+'</b><small>조회 '+fmt23(song.viewCounter || 0)+'</small></div>'+right+'</div>';
  }).join("");
}
function renderTasteProfile23(){
  const box = document.getElementById("v23Profile");
  if(!box) return;
  const p = buildTasteProfile23();
  const positive = p.positive.slice(0,10);
  const negative = p.negative.slice(0,6);

  box.innerHTML =
    '<div class="v23-profile-head"><b>학습 신호 '+p.signalCount+'개</b><span>최애·관심곡 + 👍/👎</span></div>'+
    '<div class="v23-profile-tags">'+
      (positive.length ? positive.map(function(x){
        return '<span>+'+esc23(x[0])+' <small>'+x[1].toFixed(1)+'</small></span>';
      }).join("") : '<em>곡에 👍 취향을 누르면 자동 추천이 학습됩니다.</em>')+
    '</div>'+
    (negative.length ? '<div class="v23-profile-tags negative">'+negative.map(function(x){
      return '<span>−'+esc23(x[0])+' <small>'+Math.abs(x[1]).toFixed(1)+'</small></span>';
    }).join("")+'</div>' : '');
}
function songIdFromCard23(card){
  const link = card.querySelector('a[href*="nicovideo.jp/watch/"]');
  if(!link) return "";
  const match = link.href.match(/\/watch\/([^?/#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
function patchFeedbackCards23(){
  document.querySelectorAll(".song,.discovery-card,.gem-card,.detective-card").forEach(function(card){
    const id = card.dataset.contentId || songIdFromCard23(card);
    if(!id) return;
    const row = card.querySelector(".song-actions,.gem-actions,.detective-actions-row");
    if(!row) return;
    if(!row.querySelector("[data-v23-like]")){
      row.insertAdjacentHTML("beforeend",
        '<button class="mini-btn v23-feedback" data-v23-like="'+esc23(id)+'">👍 취향</button>'+
        '<button class="mini-btn v23-feedback" data-v23-dislike="'+esc23(id)+'">👎 제외</button>'
      );
    }
    syncFeedback23(id);
  });
}
function patchTasteButton23(){
  const panel = document.getElementById("tastePanel");
  if(panel && !document.getElementById("v23TasteLearn")){
    const target = panel.querySelector(".taste-builder");
    if(target){
      const bar = document.createElement("div");
      bar.className = "v23-taste-learn";
      bar.id = "v23TasteLearn";
      bar.innerHTML = '<label class="check"><input type="checkbox" id="v23TasteAuto" checked> 내 취향 학습 자동 반영</label><span>최애·관심곡·피드백의 상위 태그를 추천 조건에 보조로 넣습니다.</span>';
      target.insertAdjacentElement("afterbegin",bar);
    }
  }

  const current = document.getElementById("tasteRecommendBtn");
  if(current && !current.dataset.v23){
    const fresh = current.cloneNode(true);
    fresh.dataset.v23 = "1";
    current.parentNode.replaceChild(fresh,current);

    fresh.addEventListener("click", async function(){
      const run = window.recommendTasteV20 || window.recommendTaste;
      if(typeof run!=="function") return;
      const tag = document.getElementById("tasteTag");
      const auto = document.getElementById("v23TasteAuto");
      const old = tag ? tag.value : "";
      if(tag && auto && auto.checked){
        const learned = profileTerms23(5);
        if(learned.length) tag.value = uniq23([old].concat(learned)).filter(Boolean).join(", ");
      }
      try{
        await run();
      }finally{
        if(tag) tag.value = old;
      }
    });
  }
}
function openUniverse23(id){
  const song = findSong23(id) || currentMix.map(function(x){ return x.song; }).find(function(x){ return x.contentId === id; });
  if(!song) return;
  try{ closeToolsModal(); }catch(e){
    const modal = document.getElementById("toolsModal");
    if(modal) modal.hidden = true;
  }
  const target = document.getElementById("universePanel");
  if(target) target.scrollIntoView({behavior:"smooth",block:"start"});
  try{ buildUniverse(song,false); }catch(e){}
}

function addStyle23(){
  const style = document.createElement("style");
  style.textContent = [
    ".v23-feedback.active{border-color:#63d9c0;background:#123b38;color:#e5fff9}",
    ".v23-feedback[data-v23-dislike].active{border-color:#ef8291;background:#3b1820;color:#ffe9ed}",
    ".v23-taste-learn{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:9px 10px;border:1px solid #29445f;border-radius:12px;background:#091827;margin-bottom:9px}",
    ".v23-taste-learn span{font-size:9px;color:#7f9bb3}",
    ".v23-smart{min-height:620px}",
    ".v23-smart-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:10px;padding:10px}",
    ".v23-box{border:1px solid #203a55;border-radius:15px;background:#091624;overflow:hidden}",
    ".v23-box-head{padding:11px 12px;border-bottom:1px solid #203a55}",
    ".v23-box-head b{font-size:12px}",
    ".v23-box-head small{display:block;color:#7f9bb3;font-size:9px;margin-top:3px}",
    ".v23-mix-controls{display:grid;grid-template-columns:1fr 145px 100px auto;gap:7px;padding:10px}",
    ".v23-mix-actions{display:flex;gap:6px;flex-wrap:wrap;padding:0 10px 10px}",
    ".v23-status{font-size:9px;color:#82a0b8;padding:0 10px 10px}",
    ".v23-mix-grid{padding:0 8px 8px}",
    ".v23-mix-card{display:grid;grid-template-columns:25px 82px 1fr;gap:8px;align-items:center;padding:7px;border-bottom:1px solid #142b41}",
    ".v23-mix-card img{width:82px;aspect-ratio:16/9;object-fit:cover;border-radius:8px}",
    ".v23-num{font-weight:900;text-align:center;color:#7fa8c6}",
    ".v23-mix-main{min-width:0}",
    ".v23-mix-main>a{display:block;color:#eaf7ff;text-decoration:none;font-size:10px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".v23-mix-main small{display:block;color:#7995ad;font-size:8px;margin-top:3px}",
    ".v23-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}",
    ".v23-profile{padding:10px}",
    ".v23-profile-head{display:flex;justify-content:space-between;gap:8px}",
    ".v23-profile-head b{font-size:11px}",
    ".v23-profile-head span{font-size:8px;color:#7895ad}",
    ".v23-profile-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}",
    ".v23-profile-tags span{font-size:9px;border:1px solid #2a5261;border-radius:999px;padding:5px 7px;background:#0d292e;color:#c8f6ef}",
    ".v23-profile-tags.negative span{border-color:#5d3340;background:#29131a;color:#ffc2cc}",
    ".v23-profile-tags em{font-size:9px;color:#7895ad;font-style:normal}",
    ".v23-trend-actions{display:flex;gap:6px;padding:10px}",
    ".v23-trend-list{padding:0 8px 8px}",
    ".v23-trend-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #142b41}",
    ".v23-trend-row b{font-size:9px}",
    ".v23-trend-row small{display:block;color:#7895ad;font-size:8px;margin-top:3px}",
    ".v23-trend-num{text-align:right}",
    ".v23-trend-num>b{display:block;color:#a8c0d5}",
    ".v23-trend-num.hot>b{color:#ffbc7b}",
    ".v23-trend-num span{display:block;font-size:8px;color:#718aa1}",
    ".v23-empty{padding:32px 15px;text-align:center;font-size:10px;color:#7895ad;line-height:1.6}",
    "@media(max-width:760px){.v23-smart-grid{grid-template-columns:1fr}.v23-mix-controls{grid-template-columns:1fr 1fr}.v23-mix-controls input{grid-column:1/-1}.v23-mix-card{grid-template-columns:22px 72px 1fr}.v23-mix-card img{width:72px}}"
  ].join("");
  document.head.appendChild(style);
}
function addUi23(){
  addStyle23();

  const tabs = document.getElementById("toolsTabs");
  const body = document.querySelector("#toolsModal .tools-body");
  if(tabs && body && !document.querySelector('[data-tool="smart23"]')){
    const tab = document.createElement("button");
    tab.dataset.tool = "smart23";
    tab.textContent = "스마트 믹스";
    tabs.appendChild(tab);

    const section = document.createElement("section");
    section.className = "panel tool-view v23-smart";
    section.dataset.toolView = "smart23";
    section.id = "v23SmartPanel";
    section.innerHTML =
      '<div class="panel-head"><div><h2>스마트 믹스 · 취향 학습 · 급상승 추적</h2><p>보관함과 👍/👎 피드백을 학습해 자동 플레이리스트를 만들고 저장곡 조회수 변화를 추적합니다.</p></div><div class="pill">v23</div></div>'+
      '<div class="v23-smart-grid">'+
        '<div class="v23-box">'+
          '<div class="v23-box-head"><b>자동 플레이리스트</b><small>취향 우선 + 비슷한 곡 도배 방지</small></div>'+
          '<div class="v23-mix-controls">'+
            '<input id="v23MixPrompt" placeholder="추가 조건: 기괴한 록, flower, 변박 등">'+
            '<select id="v23MixMode"><option value="profile">내 취향</option><option value="balanced" selected>균형 추천</option><option value="hidden">숨은 곡 위주</option><option value="recent">최근 곡 위주</option></select>'+
            '<select id="v23MixCount"><option>10</option><option selected>20</option><option>30</option><option>40</option></select>'+
            '<button class="btn primary" id="v23GenerateMix">만들기</button>'+
          '</div>'+
          '<div class="v23-mix-actions"><button class="mini-btn" id="v23RerollMix">다시 섞기</button><button class="mini-btn" id="v23CopyMix">목록 복사</button></div>'+
          '<div class="v23-status" id="v23MixStatus">취향 신호를 모으면 자동 믹스가 더 정확해집니다.</div>'+
          '<div class="v23-mix-grid" id="v23MixGrid"><div class="v23-empty">‘만들기’를 누르면 자동 플레이리스트가 생성됩니다.</div></div>'+
        '</div>'+
        '<div>'+
          '<div class="v23-box"><div class="v23-box-head"><b>내 취향 프로필</b><small>최애·관심곡과 직접 👍/👎 피드백을 함께 학습</small></div><div class="v23-profile" id="v23Profile"></div></div>'+
          '<div class="v23-box" style="margin-top:10px">'+
            '<div class="v23-box-head"><b>저장곡 급상승 감지</b><small>날짜별 조회수 스냅샷으로 일평균 증가량 계산</small></div>'+
            '<div class="v23-trend-actions"><button class="mini-btn" id="v23RefreshTrend">최신 조회수 갱신</button></div>'+
            '<div class="v23-status" id="v23TrendStatus">첫 기록만 있는 곡은 다음 날짜부터 상승 판정이 가능합니다.</div>'+
            '<div class="v23-trend-list" id="v23TrendList"></div>'+
          '</div>'+
        '</div>'+
      '</div>';
    body.appendChild(section);
  }

  bindUi23();
  renderTasteProfile23();
  renderTrends23();
  patchFeedbackCards23();
  patchTasteButton23();
}
function bindUi23(){
  document.addEventListener("click", function(e){
    const button = e.target.closest ? e.target.closest("button") : null;
    if(!button) return;

    if(button.matches('#toolsTabs [data-tool="smart23"]')){
      e.preventDefault();
      try{ setToolView("smart23"); }catch(err){}
      renderTasteProfile23();
      renderTrends23();
      return;
    }
    if(button.dataset.v23Like){
      e.preventDefault();
      const id = button.dataset.v23Like;
      setFeedback23(id, feedbackValue23(id) > 0 ? 0 : 1, findSong23(id));
      return;
    }
    if(button.dataset.v23Dislike){
      e.preventDefault();
      const id = button.dataset.v23Dislike;
      setFeedback23(id, feedbackValue23(id) < 0 ? 0 : -1, findSong23(id));
      return;
    }
    if(button.dataset.v23Universe){
      e.preventDefault();
      openUniverse23(button.dataset.v23Universe);
      return;
    }
  });

  const generate = document.getElementById("v23GenerateMix");
  if(generate) generate.addEventListener("click", function(){ generateMix23(false); });
  const reroll = document.getElementById("v23RerollMix");
  if(reroll) reroll.addEventListener("click", function(){ generateMix23(true); });
  const copy = document.getElementById("v23CopyMix");
  if(copy) copy.addEventListener("click", copyMix23);
  const trends = document.getElementById("v23RefreshTrend");
  if(trends) trends.addEventListener("click", refreshTrends23);

  const prompt = document.getElementById("v23MixPrompt");
  if(prompt) prompt.addEventListener("keydown", function(e){
    if((e.ctrlKey || e.metaKey) && e.key === "Enter") generateMix23(false);
  });
}
function boot23(){
  addUi23();
  ["songList","guideGrid","tasteGrid","gemGrid","detectiveResults"].forEach(function(id){
    const node = document.getElementById(id);
    if(node) new MutationObserver(function(){ patchFeedbackCards23(); }).observe(node,{childList:true,subtree:true});
  });
  setTimeout(function(){
    patchFeedbackCards23();
    patchTasteButton23();
  },200);
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded",boot23,{once:true});
}else{
  boot23();
}

window.VSASmart23 = {
  generateMix:generateMix23,
  refreshTrends:refreshTrends23,
  renderProfile:renderTasteProfile23
};
})();