/* Voice Synth Archive Discovery v20
 * Rich free-text recommendation, broad multi-choice filters, diverse selection.
 */
(function(){
  "use strict";

  const guideTerms=new Set();
  const gemTerms=new Set();

  const V20_MAP=[
    [/어둡|다크|음침|암울|dark/i,["ダーク","鬱","病み"]],
    [/우울|퇴폐|절망/i,["鬱","病み","絶望"]],
    [/기괴|괴상|호러|공포|무서|광기/i,["ホラー","狂気","不気味"]],
    [/밝|청량|상쾌|爽/i,["爽やか","ポップ"]],
    [/신나|흥겨|에너지/i,["元気","アップテンポ","ポップ"]],
    [/감성|애절|슬프|눈물/i,["切ない","泣ける"]],
    [/몽환|환상|꿈같/i,["幻想的","浮遊感","アンビエント"]],
    [/귀여|카와이|cute/i,["かわいい","可愛い"]],
    [/질주|빠르|속도|업템포/i,["疾走感","アップテンポ"]],
    [/잔잔|힐링|편안|느리/i,["バラード","スローテンポ","ピアノ"]],
    [/중독|반복해서 듣/i,["中毒性"]],
    [/록|락|rock/i,["VOCAROCK","ロック"]],
    [/메탈|헤비|metal/i,["メタル","VOCALOUD"]],
    [/전자|일렉|테크노|edm|electro/i,["エレクトロ","テクノ"]],
    [/드럼.?앤.?베이스|dnb|드럼베이스/i,["ドラムンベース"]],
    [/트랜스|trance/i,["トランス"]],
    [/재즈|jazz/i,["ジャズ"]],
    [/발라드|ballad/i,["バラード"]],
    [/피아노|piano/i,["ピアノ"]],
    [/오케스트|orchestra/i,["オーケストラ"]],
    [/힙합|랩|hip.?hop|rap/i,["ラップ","ヒップホップ"]],
    [/칩튠|chiptune|8비트/i,["チップチューン"]],
    [/슈게이|shoegaze/i,["シューゲイザー"]],
    [/실험|전위|변박|변칙/i,["変拍子","実験音楽","前衛"]],
    [/화풍|일본풍|와후/i,["和風"]],
    [/민족|에스닉/i,["民族調"]],
    [/미쿠|miku/i,["初音ミク"]],
    [/린(?!렌)|rin/i,["鏡音リン"]],
    [/렌|len/i,["鏡音レン"]],
    [/루카|luka/i,["巡音ルカ"]],
    [/구미|gumi/i,["GUMI"]],
    [/아이에이|\bia\b/i,["IA"]],
    [/플라워|flower/i,["flower"]],
    [/유카리/i,["結月ゆかり"]],
    [/우나/i,["音街ウナ"]],
    [/테토|teto/i,["重音テト"]],
    [/카후|kafu/i,["可不"]],
    [/치세이|chisei/i,["知声"]],
    [/손그림|수제.?그림/i,["手描き"]],
    [/한.?장|정지.?그림/i,["一枚絵"]],
    [/문자.?pv|글자.?pv|텍스트.?pv/i,["文字PV"]]
  ];

  const EXTRA_MAP={
    eerie:["ホラー","狂気","不気味"],
    melancholic:["鬱","病み","切ない"],
    healing:["バラード","ピアノ","スローテンポ"],
    chaotic:["変拍子","狂気","中毒性"],
    cool:["スタイリッシュ","エレクトロ"],
    retro:["レトロ","チップチューン"],
    piano:["ピアノ"],
    orchestral:["オーケストラ"],
    dnb:["ドラムンベース"],
    trance:["トランス"],
    hiphop:["ラップ","ヒップホップ"],
    chiptune:["チップチューン"],
    shoegaze:["シューゲイザー"],
    wafu:["和風","民族調"]
  };

  Object.assign(TASTE_MAP,EXTRA_MAP);
  Object.assign(GEM_PRESETS,{
    reaction:{label:"반응률 최우선",minViews:300,sorts:["-mylistCounter","-commentCounter","-likeCounter","+viewCounter"]},
    cult:{label:"컬트/마니아 반응",minViews:100,sorts:["-commentCounter","-mylistCounter","+viewCounter"]},
    weird:{label:"괴작/실험 발굴",minViews:100,sorts:["-commentCounter","-mylistCounter","+viewCounter","-startTime"]}
  });

  function uniq(xs){return [...new Set(xs.filter(Boolean))]}
  function splitTerms(v){
    return String(v||"").split(/[,/|、\n]+/).map(x=>x.trim()).filter(Boolean);
  }
  function promptTerms(prompt){
    const out=[];
    for(const [re,terms] of V20_MAP){
      re.lastIndex=0;
      if(re.test(prompt||""))out.push(...terms);
    }
    const raw=String(prompt||"");
    const jp=raw.match(/[一-龯ぁ-ゟ゠-ヿＡ-Ｚａ-ｚA-Za-z0-9_*＋+#.-]{2,}/g)||[];
    for(const x of jp){
      if(!/^(예|곡|추천|노래|위주)$/i.test(x))out.push(x);
    }
    return uniq(out);
  }
  function selectedChipTerms(root){
    return [...document.querySelectorAll(root+" .taste-chip.active")].map(x=>x.dataset.term).filter(Boolean);
  }
  function songText(song){
    return (String(song.title||"")+" "+String(song.description||"")+" "+parseTags(song.tags).join(" ")).toLowerCase();
  }
  function termMatch(song,term){
    const t=String(term||"").toLowerCase();
    if(!t)return false;
    return songText(song).includes(t);
  }
  function avoidSong(song,avoid){
    if(!avoid.length)return false;
    const raw=songText(song);
    return avoid.some(x=>raw.includes(String(x).toLowerCase()));
  }
  function matchRatio(song,terms){
    if(!terms.length)return .4;
    let score=0;
    for(const t of terms){
      if(termMatch(song,t))score+=Math.max(.65,Math.min(1.8,tagWeight(t)/2));
    }
    return clamp01(score/Math.max(1,terms.length));
  }
  function randomJitter(song){
    let h=2166136261;
    const s=String(song.contentId||song.title||"");
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return ((h>>>0)%1000)/1000;
  }
  function diverseV20(scored,count){
    const pool=scored.slice(0,Math.min(180,scored.length));
    const chosen=[],used=new Set();
    while(chosen.length<count&&chosen.length<pool.length){
      let best=null,bestScore=-Infinity;
      for(const x of pool){
        const id=(x.song||x).contentId;
        if(used.has(id))continue;
        let sim=0;
        for(const y of chosen)sim=Math.max(sim,weightedTagSimilarity(x.song,y.song));
        const year=songYear(x.song);
        const sameEra=chosen.filter(y=>Math.abs(songYear(y.song)-year)<=1).length;
        const adjusted=x.score-sim*.18-sameEra*.012+randomJitter(x.song)*.006;
        if(adjusted>bestScore){best=x;bestScore=adjusted}
      }
      if(!best)break;
      used.add(best.song.contentId);
      chosen.push(best);
    }
    return chosen;
  }
  function scrollResults(id){
    if(window.matchMedia("(max-width:699px)").matches){
      const el=document.getElementById(id);
      if(el)setTimeout(()=>el.scrollIntoView({behavior:"smooth",block:"start"}),60);
    }
  }

  async function fetchExactTerm(term,min,max,sort="-mylistCounter"){
    const nf={viewCounter:{gte:Math.max(0,min||0)}};
    if(max!=null)nf.viewCounter.lte=max;
    try{
      const d=await fetchNico({
        year:"all",limit:100,offset:0,mode:"ranking",sort,
        applyYear:false,applyTier:false,numericFilters:nf,extraExactTag:term
      });
      return d.data||[];
    }catch{return []}
  }
  async function fetchBroad(min,max,sort){
    const nf={viewCounter:{gte:Math.max(0,min||0)}};
    if(max!=null)nf.viewCounter.lte=max;
    try{
      const d=await fetchNico({
        year:"all",limit:100,offset:0,mode:"ranking",sort,
        applyYear:false,applyTier:false,numericFilters:nf
      });
      return d.data||[];
    }catch{return []}
  }

  // ---------- General recommendation / guide ----------
  async function buildGuideV20(){
    if(state.busy)return;
    if(!relayBase()){toast("먼저 Worker를 연결하세요.");return}
    const level=state.guideLevel;
    const preset=GUIDE_PRESETS[level];
    const count=+document.getElementById("guideCount").value||12;
    const era=eraBounds(document.getElementById("guideEra").value);
    const prompt=document.getElementById("guidePrompt").value.trim();
    const direct=splitTerms(document.getElementById("guideTag").value);
    const avoid=uniq([...splitTerms(document.getElementById("guideAvoid").value),...prompt.match(/(?:빼|제외|싫)[^,.\n]*/g)||[]].flatMap(splitTerms));
    const terms=uniq([...promptTerms(prompt),...guideTerms,...direct]).slice(0,12);

    state.busy=true;
    const btn=document.getElementById("buildGuideBtn");btn.disabled=true;
    document.getElementById("guideGrid").innerHTML='<div class="discovery-empty">조건을 넓게 비교해서 추천하는 중…</div>';
    try{
      const map=new Map();
      const termBatches=await mapLimit(terms.slice(0,8),3,t=>fetchExactTerm(t,preset.min,preset.max,"-mylistCounter"));
      for(const s of termBatches.flat())map.set(s.contentId,s);
      const broad=await mapLimit(preset.sorts.slice(0,4),3,sort=>fetchBroad(preset.min,preset.max,sort));
      for(const s of broad.flat())map.set(s.contentId,s);

      let rows=[...map.values()].filter(s=>(!era||inEra(s,era))&&!avoidSong(s,avoid));
      if(!rows.length)throw new Error("조건에 맞는 후보를 찾지 못했습니다.");
      const maxV=Math.max(...rows.map(s=>+s.viewCounter||0),1);
      const maxM=Math.max(...rows.map(s=>+s.mylistCounter||0),1);
      const scored=rows.map(song=>{
        const V=+song.viewCounter||0,M=+song.mylistCounter||0,C=+song.commentCounter||0,L=+song.likeCounter||0;
        const pop=Math.log1p(V)/Math.log1p(maxV);
        const react=clamp01((M+2)/(V+900)*48+(L+3)/(V+1200)*14+(C+3)/(V+900)*6);
        const match=matchRatio(song,terms);
        let base=level==="beginner"?.52*pop+.24*react:level==="intermediate"?.30*pop+.36*react:.12*pop+.48*react+.18*(1-pop);
        return {song,score:clamp01(base+(terms.length?.28*match:.10))};
      }).sort((a,b)=>b.score-a.score);
      state.guideSongs=diverseV20(scored,count);
      renderGuide(preset);
      const summary=document.getElementById("guideSummary");
      summary.innerHTML='추천 조건: <b>'+(terms.length?terms.slice(0,10).map(esc).join(" · "):"레벨 코스 자동")+'</b> · '+state.guideSongs.length+'곡 · 다양성 보정';
      scrollResults("guideSummary");
    }catch(e){
      document.getElementById("guideGrid").innerHTML='<div class="discovery-empty">추천 실패<br><small>'+esc(String(e?.message||e))+'</small></div>';
    }finally{state.busy=false;btn.disabled=false}
  }

  // ---------- Taste ----------
  function tasteParams(){
    const prompt=document.getElementById("tastePrompt").value.trim();
    const terms=new Set([...promptTerms(prompt),...selectedChipTerms("#tasteChips")]);
    const mood=document.getElementById("tasteMood").value;
    const genre=document.getElementById("tasteGenre").value;
    for(const x of (TASTE_MAP[mood]||[]))terms.add(x);
    for(const x of (TASTE_MAP[genre]||[]))terms.add(x);
    for(const x of splitTerms(document.getElementById("tasteTag").value))terms.add(x);
    return {
      prompt,terms:[...terms].slice(0,16),
      avoid:uniq([...splitTerms(document.getElementById("tasteAvoid").value)]),
      fame:document.getElementById("tasteFame").value,
      era:eraBounds(document.getElementById("tasteEra").value),
      count:+document.getElementById("tasteCount").value||20
    };
  }
  async function recommendTasteV20(){
    if(state.busy)return;
    if(!relayBase()){toast("먼저 Worker를 연결하세요.");return}
    const p=tasteParams(),fb=fameBounds(p.fame);
    state.busy=true;
    const btn=document.getElementById("tasteRecommendBtn");btn.disabled=true;
    document.getElementById("tasteGrid").innerHTML='<div class="discovery-empty">여러 취향 조건을 섞어 후보를 찾는 중…</div>';
    try{
      const map=new Map();
      const batches=await mapLimit(p.terms.slice(0,9),3,t=>fetchExactTerm(t,fb[0],fb[1],"-mylistCounter"));
      for(const s of batches.flat())map.set(s.contentId,s);
      const fallback=await mapLimit(["-mylistCounter","-viewCounter","-commentCounter","-startTime"],3,sort=>fetchBroad(fb[0],fb[1],sort));
      for(const s of fallback.flat())map.set(s.contentId,s);

      let rows=[...map.values()].filter(s=>(!p.era||inEra(s,p.era))&&!avoidSong(s,p.avoid));
      if(!rows.length)throw new Error("조건에 맞는 후보가 없습니다.");
      const scored=rows.map(song=>{
        const V=+song.viewCounter||0,M=+song.mylistCounter||0,L=+song.likeCounter||0,C=+song.commentCounter||0;
        const reaction=clamp01((M+2)/(V+900)*48+(L+3)/(V+1200)*15+(C+3)/(V+900)*5);
        const match=matchRatio(song,p.terms);
        const fameOk=(!p.fame)||(V>=fb[0]&&(fb[1]==null||V<=fb[1]));
        const score=clamp01(.56*match+.25*reaction+.10*(fameOk?1:.15)+.09*(p.era?1:.65));
        return {song,score};
      }).sort((a,b)=>b.score-a.score);
      state.tasteSongs=diverseV20(scored,p.count);
      renderTaste({prompt:p.prompt,terms:p.terms});
      document.getElementById("tasteSummary").innerHTML='해석한 취향: <b>'+(p.terms.length?p.terms.slice(0,12).map(esc).join(" · "):"자동 다양화")+'</b> · '+state.tasteSongs.length+'곡 · 비슷한 곡 도배 방지';
      scrollResults("tasteSummary");
    }catch(e){
      document.getElementById("tasteGrid").innerHTML='<div class="discovery-empty">추천 실패<br><small>'+esc(String(e?.message||e))+'</small></div>';
    }finally{state.busy=false;btn.disabled=false}
  }

  // ---------- Hidden gems ----------
  function gemPreset(mode){
    return GEM_PRESETS[mode]||GEM_PRESETS.smart;
  }
  function gemPreferenceScore(x,terms,mode){
    let bonus=terms.length?matchRatio(x.song,terms)*16:0;
    if(mode==="reaction")bonus+=(x.pm*.42+x.pl*.28+x.pc*.30)*18;
    if(mode==="cult")bonus+=(x.pc*.52+x.hidden*.30+x.pm*.18)*18;
    if(mode==="weird")bonus+=matchRatio(x.song,["変拍子","実験音楽","前衛","ホラー","狂気","不気味"])*20;
    return bonus;
  }
  async function findGemsV20(reroll=false){
    if(state.busy)return;
    if(!relayBase()){toast("먼저 Worker를 연결하세요.");return}
    const mode=document.getElementById("gemMode").value;
    const preset=gemPreset(mode);
    const maxViews=Math.max(preset.minViews+1,+document.getElementById("gemMaxViews").value||100000);
    const count=+document.getElementById("gemCount").value||12;
    const prompt=document.getElementById("gemPrompt").value.trim();
    let terms=uniq([...promptTerms(prompt),...gemTerms,...splitTerms(document.getElementById("gemTag").value)]);
    if(mode==="weird")terms=uniq([...terms,"変拍子","実験音楽","ホラー","狂気"]);
    const avoid=splitTerms(document.getElementById("gemAvoid").value);
    const useYear=document.getElementById("gemApplyYear").checked&&state.year!=="all";

    state.busy=true;
    document.getElementById("findGemsBtn").disabled=true;
    document.getElementById("rerollGemsBtn").disabled=true;
    document.getElementById("gemStatusText").textContent=reroll?"다른 조합을 고르는 중…":"취향을 반영해 숨은 후보를 발굴하는 중…";
    document.getElementById("gemProgress").style.width="5%";
    try{
      if(!reroll||!state.hiddenGemPool.length){
        const map=new Map();
        let done=0;
        const termBatches=await mapLimit(terms.slice(0,7),3,async term=>{
          const x=await fetchExactTerm(term,preset.minViews,maxViews,"-mylistCounter");
          done++;document.getElementById("gemProgress").style.width=(10+done*5)+"%";
          return x;
        });
        for(const s of termBatches.flat())map.set(s.contentId,s);

        const broad=await mapLimit(preset.sorts.slice(0,5),3,async sort=>{
          const opts={year:useYear?state.year:"all",limit:100,offset:0,mode:"ranking",sort,applyYear:useYear,applyTier:false,numericFilters:{viewCounter:{gte:preset.minViews,lte:maxViews}}};
          try{return (await fetchNico(opts)).data||[]}catch{return[]}
        });
        for(const s of broad.flat())map.set(s.contentId,s);

        let pool=[...map.values()].filter(s=>modeEligible(s,mode)&&!avoidSong(s,avoid));
        if(!pool.length)throw new Error("조건에 맞는 숨은 곡 후보가 없습니다.");
        let scored=scoreGemPool(pool,["deep","recent","classic"].includes(mode)?mode:"smart");
        for(const x of scored)x.score=Math.min(100,x.score+gemPreferenceScore(x,terms,mode));
        scored.sort((a,b)=>b.score-a.score);
        state.hiddenGemPool=scored;
      }

      state.hiddenGemSeed=(state.hiddenGemSeed+Date.now()+31)>>>0;
      state.hiddenGems=diverseGemSelection(state.hiddenGemPool,count,state.hiddenGemSeed);
      renderHiddenGems();
      document.getElementById("gemProgress").style.width="100%";
      document.getElementById("gemStatusText").textContent='후보 '+fmt(state.hiddenGemPool.length)+'곡 → '+state.hiddenGems.length+'곡 · '+preset.label+(terms.length?' · 취향 '+terms.slice(0,5).join(" / "):"");
      document.getElementById("rerollGemsBtn").disabled=false;
      scrollResults("gemStatusText");
    }catch(e){
      document.getElementById("gemGrid").innerHTML='<div class="gem-empty">발굴 실패<br><small>'+esc(String(e?.message||e))+'</small></div>';
      document.getElementById("gemProgress").style.width="0%";
      document.getElementById("gemStatusText").textContent="발굴하지 못했습니다.";
    }finally{
      state.busy=false;
      document.getElementById("findGemsBtn").disabled=false;
    }
  }

  function cloneBind(id,handler){
    const old=document.getElementById(id);
    if(!old)return null;
    const fresh=old.cloneNode(true);
    old.parentNode.replaceChild(fresh,old);
    fresh.addEventListener("click",handler);
    return fresh;
  }
  function bindToggleChips(root,set){
    document.querySelectorAll(root+" .taste-chip").forEach(btn=>{
      btn.addEventListener("click",()=>{
        btn.classList.toggle("active");
        const t=btn.dataset.term;
        if(btn.classList.contains("active"))set.add(t);else set.delete(t);
      });
    });
  }

  // Replace old button handlers captured by the inline script.
  cloneBind("buildGuideBtn",buildGuideV20);
  cloneBind("tasteRecommendBtn",recommendTasteV20);
  cloneBind("findGemsBtn",()=>findGemsV20(false));
  cloneBind("rerollGemsBtn",()=>findGemsV20(true));

  // Remove the old Ctrl+Enter handler by replacing the textarea.
  const oldTaste=document.getElementById("tastePrompt");
  if(oldTaste){
    const fresh=oldTaste.cloneNode(true);
    oldTaste.parentNode.replaceChild(fresh,oldTaste);
    fresh.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")recommendTasteV20()});
  }
  const guidePrompt=document.getElementById("guidePrompt");
  if(guidePrompt)guidePrompt.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")buildGuideV20()});
  const gemPrompt=document.getElementById("gemPrompt");
  if(gemPrompt)gemPrompt.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")findGemsV20(false)});

  bindToggleChips("#guideQuickChips",guideTerms);
  bindToggleChips("#gemQuickChips",gemTerms);

  // Old taste chip listeners are already bound by the inline app and remain valid.
  // Make result counts reflect the new selector if the old renderer is called elsewhere.
  window.buildGuideV20=buildGuideV20;
  window.recommendTasteV20=recommendTasteV20;
  window.findGemsV20=findGemsV20;
})();