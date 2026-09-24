/* Voice Synth Archive Detective v13
 * Progressive UI, broad source-context clues, and automatic staged recovery.
 */
(function(){
  "use strict";

  const V13_VOCADB_API="https://vocadb.net/api";
  const panel=document.getElementById("detectivePanel");

  function arr(v){return Array.isArray(v)?v:[]}
  function nameOf(x){return String((x&&(x.value||x.name||x.defaultName))||"").trim()}
  function isMobile(){return window.matchMedia("(max-width:699px)").matches}

  // ===== Where-heard context =====
  const baseCollect=collectDetectiveClues;
  collectDetectiveClues=function(){
    const c=baseCollect();
    c.contexts=Array.from(document.querySelectorAll('.detective-chip[data-group="context"].active'))
      .map(function(b){return b.dataset.context||""}).filter(Boolean);
    c.autoStage=(document.getElementById("detectiveAutoStage")||{}).checked!==false;
    return c;
  };

  const baseUnits=detectiveClueUnits;
  detectiveClueUnits=function(c){
    let n=baseUnits(c);
    if(c&&c.contexts&&c.contexts.length)n+=1;
    return n;
  };

  function sourceServices(song){
    return arr(song&&song.vocadbPVs).map(function(p){return String((p&&p.service)||"").toLowerCase();});
  }
  function webUrls(song){
    return arr(song&&song.webLinks).map(function(x){return String((x&&(x.url||x.description))||"").toLowerCase();});
  }
  function hasAny(hay,needles){
    return needles.some(function(n){return hay.some(function(x){return x.includes(n);});});
  }
  function contextMatch(song,ctx){
    const services=sourceServices(song);
    const urls=webUrls(song);
    const sources=arr(song&&song.__sources);
    const tags=parseTags(song&&song.tags).join(" ").toLowerCase();
    const desc=String((song&&song.description)||"").toLowerCase();

    if(ctx==="niconico")return sources.includes("niconico")||hasAny(services,["niconicodouga"]);
    if(ctx==="youtube")return hasAny(services,["youtube"])||hasAny(urls,["youtube.com","youtu.be"]);
    if(ctx==="bilibili")return hasAny(services,["bilibili"])||hasAny(urls,["bilibili.com"]);
    if(ctx==="shorts")return hasAny(urls,["tiktok.com","youtube.com/shorts"])||/tiktok|shorts/.test(desc);
    if(ctx==="x")return hasAny(urls,["twitter.com","x.com"])||/twitter|x\.com/.test(desc);
    if(ctx==="spotify")return hasAny(urls,["spotify.com"]);
    if(ctx==="applemusic")return hasAny(urls,["music.apple.com","itunes.apple.com"]);
    if(ctx==="cd")return arr(song&&song.albums).length>0;
    if(ctx==="live")return /ライブ|concert|live/.test(tags+" "+desc);
    if(ctx==="mad")return /\bmad\b|音mad|meme|ミーム/.test(tags+" "+desc);
    if(ctx==="osu")return /\bosu!?\b/.test(tags+" "+desc);
    if(ctx==="dam")return /dam配信|karaoke.*dam|カラオケ.*dam/.test(tags+" "+desc);
    if(ctx==="game-other")return /収録曲|ゲーム|game/.test(tags+" "+desc);
    return false; // friend / playlist / unknown-web are contextual only: never penalize.
  }
  function contextLabel(ctx){
    return ({
      niconico:"Niconico",youtube:"YouTube",shorts:"TikTok/Shorts",x:"X/Twitter",bilibili:"Bilibili",
      spotify:"Spotify",applemusic:"Apple Music",cd:"CD/앨범",live:"라이브",mad:"MAD/밈",
      osu:"osu!",dam:"DAM", "game-other":"다른 게임",friend:"친구 추천",playlist:"자동추천","unknown-web":"웹 영상"
    })[ctx]||ctx;
  }

  const baseEvidence=detectiveEvidence;
  detectiveEvidence=function(song,c){
    const ev=baseEvidence(song,c);
    const ctx=arr(c&&c.contexts);
    const searchable=ctx.filter(function(x){return !["friend","playlist","unknown-web"].includes(x);});
    const matched=searchable.filter(function(x){return contextMatch(song,x);});
    if(matched.length){
      ev.score=Math.min(99.9,ev.score+Math.min(10,3+matched.length*2.5));
      ev.matchedCount++;
      ev.matches.push({text:"들은 곳 단서: "+matched.slice(0,3).map(contextLabel).join(" · "),strong:false});
    }else if(ctx.length){
      ev.matches.push({text:"들은 곳 단서는 확인 가능한 데이터가 적어 중립 처리",strong:false});
    }
    return ev;
  };

  // ===== Desktop progressive disclosure =====
  function setMode(detail){
    if(!panel)return;
    panel.classList.toggle("detective-simple",!detail);
    const a=document.getElementById("detectiveSimpleMode");
    const b=document.getElementById("detectiveDetailMode");
    if(a)a.classList.toggle("active",!detail);
    if(b)b.classList.toggle("active",detail);
    try{localStorage.setItem("detectiveUiDetail",detail?"1":"0");}catch{}
    if(!detail&&!isMobile()){
      document.querySelectorAll("#detectivePanel .detective-section").forEach(function(d,i){
        if(i===0)d.open=true;
        else d.open=false;
      });
    }
  }

  // ===== Mobile one-screen step wizard =====
  let mobileStep=0;
  function setMobileStep(i){
    const sections=Array.from(document.querySelectorAll("#detectivePanel .detective-questionnaire .detective-section"));
    if(!sections.length)return;
    mobileStep=Math.max(0,Math.min(sections.length-1,Number(i)||0));
    sections.forEach(function(s,idx){
      s.classList.toggle("mobile-active",idx===mobileStep);
      s.open=idx===mobileStep;
    });
    document.querySelectorAll("#detectiveMobileSteps button").forEach(function(b,idx){
      b.classList.toggle("active",idx===mobileStep);
    });
  }

  function showMobileResults(){
    if(panel&&isMobile())panel.classList.add("mobile-show-results");
  }
  function showMobileClues(){
    if(panel)panel.classList.remove("mobile-show-results");
    setMobileStep(mobileStep);
  }

  function ensureMobileBack(){
    if(!panel||document.getElementById("detectiveMobileBack"))return;
    const status=document.getElementById("detectiveStatus");
    if(!status)return;
    const b=document.createElement("button");
    b.type="button";
    b.id="detectiveMobileBack";
    b.className="btn detective-mobile-back";
    b.textContent="← 단서 수정";
    b.onclick=showMobileClues;
    status.parentNode.insertBefore(b,status);
  }

  // ===== Stage 3 broad recovery =====
  function v13ArtistNames(item){
    return arr(item&&item.artists).map(function(x){return nameOf((x&&x.artist)||x);}).filter(Boolean);
  }
  function v13Tags(item){
    return arr(item&&item.tags).map(function(x){return nameOf((x&&x.tag)||x);}).filter(Boolean);
  }
  function v13Aliases(item){
    const a=[];
    if(item&&item.additionalNames)String(item.additionalNames).split(/[,、]/).forEach(function(x){x=x.trim();if(x)a.push(x);});
    arr(item&&item.names).forEach(function(x){const v=nameOf(x);if(v)a.push(v);});
    return Array.from(new Set(a));
  }
  function v13NicoPv(item){
    return arr(item&&item.pvs).find(function(p){
      return /NicoNicoDouga/i.test(String((p&&p.service)||""))&&p&&p.pvId;
    })||null;
  }
  function v13VocaSong(item){
    const artists=v13ArtistNames(item);
    const aliases=v13Aliases(item);
    const nico=v13NicoPv(item);
    const id=Number(item&&item.id)||0;
    const nicoId=nico&&nico.pvId?String(nico.pvId):"";
    return {
      contentId:nicoId||("vocadb:"+id),
      title:(item&&(item.name||item.defaultName))||aliases[0]||("VocaDB #"+id),
      description:[item&&item.additionalNames,artists.join(" "),aliases.join(" ")].filter(Boolean).join(" · "),
      viewCounter:null,commentCounter:0,mylistCounter:0,likeCounter:0,
      startTime:(item&&item.publishDate)||"",
      lengthSeconds:Number(item&&item.lengthSeconds)||0,
      thumbnailUrl:(item&&item.thumbUrl)||(item&&item.mainPicture&&(item.mainPicture.urlThumb||item.mainPicture.urlSmallThumb))||"",
      tags:Array.from(new Set(v13Tags(item).concat(artists))),
      aliases:aliases,
      artistString:(item&&item.artistString)||artists.join(", "),
      lyrics:arr(item&&item.lyrics).map(function(x){return {value:String((x&&x.value)||"")};}).filter(function(x){return x.value;}),
      minBpm:item&&item.minMilliBpm!=null?Number(item.minMilliBpm)/1000:null,
      maxBpm:item&&item.maxMilliBpm!=null?Number(item.maxMilliBpm)/1000:null,
      bpm:(item&&item.minMilliBpm!=null&&item.maxMilliBpm!=null)
        ? (Number(item.minMilliBpm)+Number(item.maxMilliBpm))/2000
        : (item&&item.minMilliBpm!=null?Number(item.minMilliBpm)/1000:null),
      vocadbId:id,
      vocadbUrl:"https://vocadb.net/S/"+id,
      vocadbPVs:arr(item&&item.pvs),
      webLinks:arr(item&&item.webLinks),
      albums:arr(item&&item.albums),
      __nicoId:nicoId,
      __source:"vocadb",
      __sources:["vocadb"]
    };
  }
  function vocaUrl(c,start,sort){
    const p=new URLSearchParams();
    p.set("songTypes","Original");
    p.set("maxResults","50");
    p.set("start",String(start||0));
    p.set("getTotalCount","false");
    p.set("fields","AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Bpm,Lyrics,WebLinks,Albums");
    p.set("lang","Japanese");
    p.set("sort",sort||"FavoritedTimes");
    if(c.yearFrom)p.set("afterDate",c.yearFrom+"-01-01T00:00:00Z");
    if(c.yearTo)p.set("beforeDate",(c.yearTo+1)+"-01-01T00:00:00Z");
    const bounds=(function(k){
      if(k==="short")return [0,119];if(k==="2-3")return [120,179];if(k==="3-4")return [180,239];
      if(k==="4-5")return [240,299];if(k==="long")return [300,null];return [0,null];
    })(c.duration);
    if(c.duration){
      if(bounds[0])p.set("minLength",String(bounds[0]));
      if(bounds[1]!=null)p.set("maxLength",String(bounds[1]));
    }
    return V13_VOCADB_API+"/songs?"+p.toString();
  }
  async function fetchVocaPool(c){
    const urls=[
      vocaUrl(c,0,"FavoritedTimes"),vocaUrl(c,50,"FavoritedTimes"),
      vocaUrl(c,0,"PublishDate"),vocaUrl(c,50,"PublishDate")
    ];
    const batches=await Promise.all(urls.map(async function(url){
      try{
        const r=await fetch(url,{headers:{"Accept":"application/json"}});
        if(!r.ok)return [];
        const d=await r.json();
        return arr(d&&d.items).map(v13VocaSong);
      }catch{return []}
    }));
    return batches.flat();
  }
  function candidateKey(song){
    const id=String((song&&song.__nicoId)||(song&&song.contentId)||"");
    if(/^(sm|nm|so)\d+$/i.test(id))return "nico:"+id.toLowerCase();
    if(song&&song.vocadbId)return "vocadb:"+song.vocadbId;
    return "other:"+id;
  }
  function mergeSong(a,b){
    if(!a)return b;if(!b)return a;
    const an=/^(sm|nm|so)\d+$/i.test(String(a.contentId||""));
    const bn=/^(sm|nm|so)\d+$/i.test(String(b.contentId||""));
    const p=an?a:(bn?b:a),s=p===a?b:a;
    const m=Object.assign({},s,p);
    m.tags=Array.from(new Set(parseTags(a.tags).concat(parseTags(b.tags))));
    m.aliases=Array.from(new Set(arr(a.aliases).concat(arr(b.aliases))));
    m.__sources=Array.from(new Set(arr(a.__sources||[a.__source||"niconico"]).concat(arr(b.__sources||[b.__source||"niconico"]))));
    m.__source=m.__sources.length>1?"cross":(m.__sources[0]||"niconico");
    m.vocadbId=a.vocadbId||b.vocadbId||null;
    m.vocadbUrl=a.vocadbUrl||b.vocadbUrl||"";
    m.vocadbPVs=a.vocadbPVs||b.vocadbPVs||[];
    m.webLinks=a.webLinks||b.webLinks||[];
    m.albums=a.albums||b.albums||[];
    m.lyrics=a.lyrics||b.lyrics||[];
    m.artistString=a.artistString||b.artistString||"";
    return m;
  }

  async function deepRecovery(c){
    const status=document.getElementById("detectiveSourceStatus");
    if(status)status.textContent="3차 광역 복구 수사 중…";
    state.detectiveStageUsed=3;

    const tasks=[];
    if((document.getElementById("detectiveUseNico")||{}).checked!==false&&relayBase()){
      ["-mylistCounter","-viewCounter","+viewCounter","-startTime","+startTime"].forEach(function(sort){
        tasks.push(detectiveFallback(c,sort));
      });
    }
    const voca=(document.getElementById("detectiveUseVocaDB")||{}).checked!==false
      ? fetchVocaPool(c):Promise.resolve([]);

    const all=await Promise.all([Promise.all(tasks),voca]);
    const map=new Map();
    (state.detectiveCandidates||[]).forEach(function(x){map.set(candidateKey(x.song),x.song);});
    all[0].flat().forEach(function(s){
      if(!s||!s.contentId||state.detectiveExcluded.has(s.contentId))return;
      s.__source=s.__source||"niconico";s.__sources=s.__sources||["niconico"];
      const k=candidateKey(s);map.set(k,map.has(k)?mergeSong(map.get(k),s):s);
    });
    all[1].forEach(function(s){
      if(!s||!s.contentId||state.detectiveExcluded.has(s.contentId))return;
      const k=candidateKey(s);map.set(k,map.has(k)?mergeSong(map.get(k),s):s);
    });

    const rule=detectiveRuleFor(c,detectiveClueUnits(c));
    let rows=Array.from(map.values()).map(function(song){
      const ev=detectiveEvidence(song,c);
      if(arr(song.__sources).length>=2){
        ev.score=Math.min(99.9,ev.score+5);
        ev.matches.unshift({text:"Niconico + VocaDB 교차 확인",strong:true});
      }
      return Object.assign({song:song},ev);
    });

    rows.sort(function(a,b){return b.score-a.score;});
    try{await enrichImageSimilarity(rows.slice(0,72));}catch{}

    const explicitStrict=["strict","very_strict"].includes(c.strictness);
    rows=rows.filter(function(ev){
      if(explicitStrict&&ev.hardFailures.length)return false;
      if(ev.matchedCount<1&&detectiveClueUnits(c)>1)return false;
      return ev.score>=Math.max(8,rule.minScore-18);
    });
    rows.sort(function(a,b){return b.score-a.score||b.matchedCount-a.matchedCount||((+b.song.viewCounter||0)-(+a.song.viewCounter||0));});

    state.detectiveCandidates=rows.slice(0,Math.max(20,rule.maxResults));
    renderDetectiveResults(c,{
      raw:map.size,hardRejected:0,scoreRejected:0,matchRejected:0,
      rule:rule,clueCount:detectiveClueUnits(c),kept:rows.length,stage:3
    });
  }

  // Decorate results with the stage actually used.
  const baseRender=renderDetectiveResults;
  renderDetectiveResults=function(c,stats){
    baseRender(c,stats);
    const status=document.getElementById("detectiveStatus");
    if(status&&state.detectiveStageUsed){
      const label=state.detectiveStageUsed===1?"1차 직접 대조":state.detectiveStageUsed===2?"2차 조건 완화":"3차 광역 복구";
      status.insertAdjacentHTML("afterbegin",'<span class="detective-stage-progress">'+label+'</span> ');
    }
  };

  // Run direct -> relaxed -> broad, while respecting explicitly selected strict modes.
  const baseSearch=detectiveSearch;
  async function v13Search(){
    if(state.busy)return;
    const auto=(document.getElementById("detectiveAutoStage")||{}).checked!==false;
    const strict=document.getElementById("detectiveStrictness");
    const hardTags=document.getElementById("detectiveHardTags");
    const before={
      strictness:strict?strict.value:"auto",
      hardTags:hardTags?hardTags.checked:false
    };

    state.detectiveStageUsed=1;
    const sourceStatus=document.getElementById("detectiveSourceStatus");
    if(sourceStatus)sourceStatus.textContent="1차 직접 대조 중…";
    await baseSearch();

    let count=(state.detectiveCandidates||[]).length;
    let topScore=count?Number(state.detectiveCandidates[0].score||0):0;
    if(auto&&(count<6||topScore<54)&&!["strict","very_strict"].includes(before.strictness)){
      state.detectiveStageUsed=2;
      if(sourceStatus)sourceStatus.textContent="2차 조건 완화 수사 중…";
      if(strict)strict.value="balanced";
      if(hardTags)hardTags.checked=false;
      await baseSearch();
      count=(state.detectiveCandidates||[]).length;
      topScore=count?Number(state.detectiveCandidates[0].score||0):0;
      if(strict)strict.value=before.strictness;
      if(hardTags)hardTags.checked=before.hardTags;
    }

    // 후보 수가 많아도 최고 점수가 낮으면 '많지만 다 애매한 후보'이므로 3차 수사를 진행한다.
    if(auto&&(count<8||topScore<62)){
      const c=collectDetectiveClues();
      // Restore the user's requested UI settings before final broad scoring.
      c.strictness=before.strictness;
      c.hardTags=before.hardTags;
      try{await deepRecovery(c);}catch(e){console.warn("deep recovery failed",e);}
    }

    if(sourceStatus){
      const n=(state.detectiveCandidates||[]).length;
      sourceStatus.textContent=(state.detectiveStageUsed===3?"광역 복구 완료":state.detectiveStageUsed===2?"조건 완화 완료":"직접 대조 완료")+" · 후보 "+n+"곡";
    }
    showMobileResults();
  }
  detectiveSearch=v13Search;

  // ===== Whole-app mobile pager =====
  let mainMobileView="icebergPanel";
  function setMainMobileView(id){
    const app=document.querySelector(".app");
    if(!app||!isMobile())return;
    mainMobileView=id||"icebergPanel";
    app.classList.add("mobile-paged");
    ["icebergPanel","resultsPanel","universePanel","settingsPanel"].forEach(function(pid){
      const el=document.getElementById(pid);
      if(el)el.classList.toggle("mobile-main-active",pid===mainMobileView);
    });
    document.querySelectorAll("#mobileSectionNav button").forEach(function(b){
      b.classList.toggle("active",b.dataset.target===mainMobileView);
    });
    window.scrollTo({top:0,behavior:"auto"});
  }

  function wireMainMobilePager(){
    const nav=document.getElementById("mobileSectionNav");
    if(!nav)return;
    Array.from(nav.querySelectorAll("button")).forEach(function(old){
      const fresh=old.cloneNode(true);
      old.parentNode.replaceChild(fresh,old);
      fresh.addEventListener("click",function(){
        if(fresh.dataset.action==="tools"){
          openToolsModal("detective");
          return;
        }
        setMainMobileView(fresh.dataset.target||"icebergPanel");
      });
    });

    ["apiSearchBtn","songsBtn"].forEach(function(id){
      const b=document.getElementById(id);
      if(b)b.addEventListener("click",function(){
        if(isMobile())setTimeout(function(){setMainMobileView("resultsPanel");},30);
      });
    });
    const openTools=document.getElementById("openToolsBtn");
    if(openTools)openTools.addEventListener("click",function(){
      if(isMobile())mainMobileView=mainMobileView||"icebergPanel";
    });

    if(isMobile())setMainMobileView(mainMobileView);
  }

  // ===== Boot/UI wiring =====
  function boot(){
    if(!panel)return;
    let detail=false;
    try{detail=localStorage.getItem("detectiveUiDetail")==="1";}catch{}
    setMode(detail);

    const simple=document.getElementById("detectiveSimpleMode");
    const detailBtn=document.getElementById("detectiveDetailMode");
    if(simple)simple.onclick=function(){setMode(false)};
    if(detailBtn)detailBtn.onclick=function(){setMode(true)};

    document.querySelectorAll("#detectiveMobileSteps button").forEach(function(b){
      b.onclick=function(){setMobileStep(Number(b.dataset.dstep)||0)};
    });
    setMobileStep(0);
    ensureMobileBack();

    // v11 installed its own click listener; clone once so v13 owns the primary search action.
    const old=document.getElementById("detectiveSearchBtn");
    if(old){
      const fresh=old.cloneNode(true);
      old.parentNode.replaceChild(fresh,old);
      fresh.addEventListener("click",v13Search);
    }

    wireMainMobilePager();
    window.addEventListener("resize",function(){
      if(isMobile()){
        setMobileStep(mobileStep);
        setMainMobileView(mainMobileView);
      }else{
        if(panel)panel.classList.remove("mobile-show-results");
        const app=document.querySelector(".app");
        if(app)app.classList.remove("mobile-paged");
        ["icebergPanel","resultsPanel","universePanel","settingsPanel"].forEach(function(pid){
          const el=document.getElementById(pid);if(el)el.classList.remove("mobile-main-active");
        });
      }
    });

    // Small desktop simplification: advanced detective tuning stays available only in detailed mode.
    const style=document.createElement("style");
    style.textContent=
      '.detective-panel.detective-simple .detective-controlbar>.control:first-child,'+
      '.detective-panel.detective-simple .detective-controlbar>.detective-toggle{display:none}'+
      '.detective-mobile-back{display:none}'+
      '@media(max-width:699px){.detective-panel.mobile-show-results .detective-mobile-back{display:block;margin:5px 6px 0;height:30px;font-size:8px;padding:0 9px}}'+
      '@media(max-width:699px){'+
      '.app.mobile-paged{height:100dvh;overflow:hidden;padding:6px 7px calc(8px + var(--safe-bottom))!important}'+
      '.app.mobile-paged .topbar{height:54px;display:flex!important;align-items:center!important;margin:0!important;padding:2px 1px!important}'+
      '.app.mobile-paged .brand .sub{display:none}.app.mobile-paged .logo{width:34px;height:34px}.app.mobile-paged h1{font-size:15px}'+
      '.app.mobile-paged .status{margin-left:auto;max-width:48%;padding:0!important}.app.mobile-paged #snapshotLabel{display:none}.app.mobile-paged .status .pill{font-size:7.5px;padding:4px 6px}'+
      '.app.mobile-paged #openToolsBtn{display:none}'+
      '.app.mobile-paged .mobile-section-nav{position:static;margin:3px 0 5px;height:38px;padding:3px 4px;border-radius:10px}'+
      '.app.mobile-paged .mobile-section-nav button{min-height:30px;padding:0 9px;font-size:8px}'+
      '.app.mobile-paged .fold-settings-toggle{min-height:34px;margin:0 0 5px;font-size:9px}'+
      '.app.mobile-paged .summary{display:flex!important;overflow-x:auto;gap:5px;margin:0 0 5px;padding-bottom:2px;scrollbar-width:none}'+
      '.app.mobile-paged .summary::-webkit-scrollbar{display:none}.app.mobile-paged .summary .card{flex:0 0 132px;padding:7px 8px;border-radius:10px;scroll-snap-align:start}'+
      '.app.mobile-paged .summary .k{font-size:7px}.app.mobile-paged .summary .v{font-size:14px}.app.mobile-paged .summary .note{font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
      '.app.mobile-paged #icebergPanel,.app.mobile-paged #resultsPanel,.app.mobile-paged #universePanel,.app.mobile-paged #settingsPanel{display:none!important}'+
      '.app.mobile-paged #icebergPanel.mobile-main-active,.app.mobile-paged #resultsPanel.mobile-main-active,.app.mobile-paged #universePanel.mobile-main-active,.app.mobile-paged #settingsPanel.mobile-main-active{display:block!important}'+
      '.app.mobile-paged .gem-panel{display:none!important}'+
      '.app.mobile-paged .main{display:block!important;min-height:0}'+
      '.app.mobile-paged .mobile-main-active{height:calc(100dvh - 54px - 43px - 39px - 63px - var(--safe-bottom));min-height:260px;overflow:auto;margin:0!important;border-radius:12px}'+
      '.app.mobile-paged #icebergPanel .panel-head{padding:7px 8px 5px}.app.mobile-paged #icebergPanel .panel-head p{display:none}.app.mobile-paged #icebergPanel .panel-head h2{font-size:12px}'+
      '.app.mobile-paged #icebergPanel .iceberg-wrap{padding:5px}.app.mobile-paged #icebergPanel .iceberg{display:grid!important;grid-template-columns:1fr 1fr;height:auto!important;gap:4px!important}'+
      '.app.mobile-paged #icebergPanel .tier{min-height:42px!important;padding:4px 7px!important;border-radius:8px!important}.app.mobile-paged #icebergPanel .tier .name{font-size:9px!important}.app.mobile-paged #icebergPanel .tier .range{font-size:7px!important}.app.mobile-paged #icebergPanel .tier .count{font-size:10px!important}.app.mobile-paged #icebergPanel .tier .pct{font-size:7px!important}'+
      '.app.mobile-paged #icebergPanel .legend{display:none}'+
      '.app.mobile-paged #resultsPanel .panel-head{padding:7px 8px}.app.mobile-paged #resultsPanel .free-search{padding:6px}.app.mobile-paged #resultsPanel .song{grid-template-columns:24px 58px minmax(0,1fr);padding:5px 3px}.app.mobile-paged #resultsPanel .thumb{width:58px}.app.mobile-paged #resultsPanel .song-title{font-size:10px}'+
      '.app.mobile-paged #universePanel .panel-head,.app.mobile-paged #settingsPanel .panel-head{padding:7px 8px}'+
      '}';
    document.head.appendChild(style);
  }

  boot();
})();