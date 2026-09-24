/* Voice Synth Archive Detective v12
 * Lyrics evidence, rejection learning, and last-resort web hunt.
 */
(function(){
  "use strict";

  function d12Norm(s){
    return String(s||"").normalize("NFKC").toLowerCase()
      .replace(/[\s\u3000\p{P}\p{S}]+/gu,"");
  }
  function d12LyricValues(song){
    return Array.isArray(song&&song.lyrics)
      ? song.lyrics.map(function(x){return String((x&&x.value)||"");}).filter(Boolean)
      : [];
  }
  function d12LyricPhrases(text){
    const out=[];
    String(text||"").split(/\n+/).forEach(function(line){
      line=line.trim();
      if(line.length>=2)out.push(line);
    });
    const quoted=String(text||"").match(/[「『"'“”](.+?)[」』"'“”]/g)||[];
    quoted.forEach(function(q){
      const v=q.replace(/^[「『"'“”]|[」』"'“”]$/g,"").trim();
      if(v.length>=2)out.push(v);
    });
    return Array.from(new Set(out)).slice(0,8);
  }

  function ensureFeedback(){
    if(!state.detectiveFeedback){
      state.detectiveFeedback={
        rejectedVocals:new Set(),
        rejectedEras:new Set(),
        rejectedTitleStyles:new Set(),
        negativeTags:new Set(),
        history:[]
      };
    }
    return state.detectiveFeedback;
  }

  const baseCollect=collectDetectiveClues;
  collectDetectiveClues=function(){
    const c=baseCollect();
    const el=document.getElementById("detectiveLyrics");
    const lyrics=el?el.value.trim():"";
    const phrases=d12LyricPhrases(lyrics);
    const atoms=lyrics ? extractDetectiveAtoms(lyrics) : [];
    const strong=lyrics ? strongDetectiveAtoms(lyrics) : [];
    c.lyrics=lyrics;
    c.lyricCertainty=(document.getElementById("detectiveLyricCertainty")||{}).value||"likely";
    c.lyricTokens=(strong.length?strong:atoms).slice(0,10);
    c.lyricPhrases=phrases.length?phrases:c.lyricTokens.slice(0,5);
    c.lyricKanjiHints=lyrics ? koreanKanjiExpansions(lyrics) : [];
    c.deepLyrics=(document.getElementById("detectiveDeepLyrics")||{}).checked!==false;
    return c;
  };

  const baseClueUnits=detectiveClueUnits;
  detectiveClueUnits=function(c){
    let n=baseClueUnits(c);
    if(c&&c.lyrics)n+=c.lyricCertainty==="exact"?2:1;
    return n;
  };

  const baseEvidence=detectiveEvidence;
  detectiveEvidence=function(song,c){
    const ev=baseEvidence(song,c);
    const fb=ensureFeedback();

    if(c&&c.lyrics){
      const values=d12LyricValues(song);
      const hay=d12Norm(values.join("\n"));
      const phrases=(c.lyricPhrases||[]).filter(function(x){return d12Norm(x).length>=2;});
      const tokens=(c.lyricTokens||[]).filter(function(x){return d12Norm(x).length>=2;});
      let exactHit="";
      let tokenHits=[];

      if(hay){
        exactHit=phrases.find(function(p){return hay.includes(d12Norm(p));})||"";
        tokenHits=tokens.filter(function(t){return hay.includes(d12Norm(t));});
        for(const h of (c.lyricKanjiHints||[])){
          if(h&&h.kanji&&hay.includes(d12Norm(h.kanji))&&!tokenHits.includes(h.kanji))tokenHits.push(h.kanji);
        }

        if(exactHit){
          ev.score=Math.min(99.9,ev.score+(c.lyricCertainty==="exact"?20:16));
          ev.matchedCount++;
          ev.matches.unshift({text:"가사 일치: "+exactHit.slice(0,34),strong:true});
        }else if(tokenHits.length){
          const ratio=Math.min(1,tokenHits.length/Math.max(1,tokens.length));
          ev.score=Math.min(99.9,ev.score+7+ratio*7);
          ev.matchedCount++;
          ev.matches.unshift({text:"가사 단어: "+tokenHits.slice(0,4).join(" · "),strong:c.lyricCertainty==="exact"});
        }else{
          const penalty=c.lyricCertainty==="exact"?13:c.lyricCertainty==="likely"?7:3;
          ev.score=Math.max(0,ev.score-penalty);
          ev.misses.push("VocaDB 가사와 기억 단서 불일치");
        }
      }else{
        ev.matches.push({text:"가사 데이터 없음 · 중립 처리",strong:false});
      }
    }

    const vocal=detectCandidateVocal(song);
    if(vocal && fb.rejectedVocals.has(vocal)){
      ev.score=Math.max(0,ev.score-24);
      ev.hardFailures.push("피드백: "+vocal+" 보컬은 아님");
    }

    const era=detectiveYearBucket(song);
    if(era && fb.rejectedEras.has(era)){
      ev.score=Math.max(0,ev.score-18);
      ev.hardFailures.push("피드백: "+era+" 시기는 아님");
    }

    const style=d12TitleStyle(song);
    if(style && fb.rejectedTitleStyles.has(style)){
      ev.score=Math.max(0,ev.score-12);
      ev.misses.push("피드백: 제목 표기 느낌 불일치");
    }

    let negativeHit=0;
    for(const t of fb.negativeTags){
      if(detectiveTagContains(song,t)){
        negativeHit++;
        ev.misses.push("피드백 제외 특징: "+t);
      }
    }
    if(negativeHit)ev.score=Math.max(0,ev.score-Math.min(22,negativeHit*6));

    return ev;
  };

  function d12TitleStyle(song){
    const t=String((song&&song.title)||"");
    const jp=(t.match(/[\u3040-\u30ff\u3400-\u9fff]/g)||[]).length;
    const latin=(t.match(/[A-Za-z]/g)||[]).length;
    if(jp&&latin)return "mixed";
    if(/[0-9★☆!?！？#@]/.test(t)&&!jp&&!latin)return "symbol";
    if(latin>=3&&latin>jp)return "latin";
    if(jp)return "jp";
    return "other";
  }

  function d12MoodTags(song){
    const re=/VOCAROCK|ロック|エレクトロ|テクノ|トランス|バラード|メタル|ジャズ|ダーク|鬱|切ない|幻想|かわいい|可愛い|ホラー|不気味|疾走|中毒|爽やか|チップチューン|和風|民族|ドラムンベース/i;
    return informativeTags(song).filter(function(t){return re.test(t);}).slice(0,5);
  }
  function d12VisualTags(song){
    const re=/手描き|一枚絵|MMD|モノクロ|白黒|アニメ|歌詞動画|実写|3D|PV/i;
    return informativeTags(song).filter(function(t){return re.test(t);}).slice(0,5);
  }

  function renderFeedbackSummary(){
    const box=document.getElementById("detectiveFeedbackSummary");
    if(!box)return;
    const fb=ensureFeedback();
    const chips=[];
    fb.rejectedVocals.forEach(function(v){chips.push("보컬≠"+v);});
    fb.rejectedEras.forEach(function(v){chips.push("시기≠"+v);});
    fb.rejectedTitleStyles.forEach(function(v){
      const m={jp:"일본어/한자",latin:"영문",mixed:"혼합",symbol:"기호"};
      chips.push("제목≠"+(m[v]||v));
    });
    fb.negativeTags.forEach(function(v){chips.push("특징≠"+v);});

    if(!chips.length){
      box.innerHTML='<span>후보를 제외할 때 이유를 고르면 다음 수색이 그 피드백을 기억합니다.</span>';
      return;
    }
    box.innerHTML='<b>수사 피드백</b> '+chips.slice(0,14).map(function(x){return '<span class="detective-feedback-chip">'+esc(x)+'</span>';}).join("")+
      '<button type="button" class="mini-btn" id="detectiveClearFeedback">피드백 초기화</button>';
    const clear=document.getElementById("detectiveClearFeedback");
    if(clear)clear.onclick=function(){
      state.detectiveFeedback=null;
      renderFeedbackSummary();
      toast("탐정 피드백을 초기화했습니다.");
    };
  }

  function attachRejectMenus(){
    const cards=document.querySelectorAll("#detectiveResults .detective-card");
    cards.forEach(function(card,idx){
      const candidate=(state.detectiveCandidates||[])[idx];
      if(!candidate)return;
      const id=candidate.song.contentId;
      const buttons=Array.from(card.querySelectorAll(".detective-actions-row button"));
      const reject=buttons.find(function(b){return b.textContent.trim()==="이 곡 아님";});
      if(!reject)return;

      reject.removeAttribute("onclick");
      reject.onclick=function(){
        let menu=card.querySelector(".detective-reject-menu");
        if(menu){menu.hidden=!menu.hidden;return;}
        menu=document.createElement("div");
        menu.className="detective-reject-menu";
        menu.innerHTML=
          '<span>왜 아닌가요?</span>'+
          '<button data-r="vocal">보컬이 다름</button>'+
          '<button data-r="era">시대가 다름</button>'+
          '<button data-r="mood">분위기/장르가 다름</button>'+
          '<button data-r="visual">MV 느낌이 다름</button>'+
          '<button data-r="title">제목 느낌이 다름</button>'+
          '<button data-r="plain">그냥 이 곡 아님</button>';
        card.querySelector(".detective-actions-row").insertAdjacentElement("afterend",menu);
        menu.querySelectorAll("button[data-r]").forEach(function(b){
          b.onclick=function(){rejectDetectiveWithReason(id,b.dataset.r);};
        });
      };
    });
  }

  window.rejectDetectiveWithReason=function(id,reason){
    const x=(state.detectiveCandidates||[]).find(function(v){return v.song.contentId===id;});
    if(!x)return;
    const song=x.song;
    const fb=ensureFeedback();

    if(reason==="vocal"){
      const v=detectCandidateVocal(song);
      if(v&&v!=="기타/불명")fb.rejectedVocals.add(v);
      fb.history.push({id:id,reason:reason,value:v});
    }else if(reason==="era"){
      const v=detectiveYearBucket(song);
      if(v&&v!=="불명")fb.rejectedEras.add(v);
      fb.history.push({id:id,reason:reason,value:v});
    }else if(reason==="mood"){
      const ts=d12MoodTags(song);
      ts.forEach(function(t){fb.negativeTags.add(t);});
      fb.history.push({id:id,reason:reason,value:ts.join(", ")});
    }else if(reason==="visual"){
      const ts=d12VisualTags(song);
      ts.forEach(function(t){fb.negativeTags.add(t);});
      fb.history.push({id:id,reason:reason,value:ts.join(", ")});
    }else if(reason==="title"){
      const v=d12TitleStyle(song);
      if(v&&v!=="other")fb.rejectedTitleStyles.add(v);
      fb.history.push({id:id,reason:reason,value:v});
    }else{
      fb.history.push({id:id,reason:"plain",value:""});
    }

    state.detectiveExcluded.add(id);
    state.detectiveCandidates=state.detectiveCandidates.filter(function(v){return v.song.contentId!==id;});
    renderFeedbackSummary();
    toast("제외 이유를 다음 수색에 반영합니다.");

    setTimeout(function(){
      if(!state.busy && detectiveClueUnits(collectDetectiveClues())>0)detectiveSearch();
    },180);
  };

  const baseRender=renderDetectiveResults;
  renderDetectiveResults=function(c,stats){
    baseRender(c,stats);
    attachRejectMenus();
    renderFeedbackSummary();
  };

  function updateLyricsPreview(){
    const el=document.getElementById("detectiveLyricsPreview");
    const input=document.getElementById("detectiveLyrics");
    if(!el||!input)return;
    const raw=input.value.trim();
    if(!raw){
      el.textContent="일본어 원문 일부가 기억나면 가장 강한 단서가 됩니다. 한국어로 기억난 뜻도 적을 수 있습니다.";
      return;
    }
    const atoms=extractDetectiveAtoms(raw);
    const hints=koreanKanjiExpansions(raw);
    const p=d12LyricPhrases(raw);
    let html="가사 핵심어: <b>"+(p.length?p.slice(0,3):atoms.slice(0,5)).map(esc).join(" · ")+"</b>";
    if(hints.length)html+="<br>한국어 의미 보조: <b>"+hints.slice(0,5).map(function(x){return esc(x.ko+"→"+x.kanji);}).join(" · ")+"</b>";
    el.innerHTML=html;
  }

  function detectiveWebQuery(){
    const c=collectDetectiveClues();
    const bits=[];
    if(c.lyrics)bits.push('"'+c.lyrics.split(/\n/)[0].slice(0,60)+'"');
    else if(c.words)bits.push(c.words.slice(0,70));
    if(c.producer)bits.push(c.producer);
    if(c.vocal)bits.push(c.vocal);
    if(!bits.length)bits.push("VOCALOID オリジナル曲");
    return bits.join(" ");
  }

  function renderWebHunt(){
    const box=document.getElementById("detectiveWebHunt");
    if(!box)return;
    const q=detectiveWebQuery();
    const qVoice=q+" VOCALOID UTAU Synthesizer V";
    const links=[
      ["Google 전체 웹","https://www.google.com/search?q="+encodeURIComponent(qVoice)],
      ["Niconico","https://www.nicovideo.jp/search/"+encodeURIComponent(q)],
      ["YouTube","https://www.youtube.com/results?search_query="+encodeURIComponent(qVoice)],
      ["VocaDB","https://vocadb.net/Search?searchType=Song&filter="+encodeURIComponent(q)]
    ];
    box.hidden=false;
    box.innerHTML='<div class="detective-web-title"><b>최후의 웹 확장 수색</b><span>앱 DB에서 안 잡히면 같은 단서를 외부 검색으로 넘깁니다.</span></div>'+
      '<div class="detective-web-links">'+links.map(function(x){return '<a target="_blank" rel="noopener" href="'+esc(x[1])+'">'+esc(x[0])+'</a>';}).join("")+'</div>'+
      '<div class="detective-db-note">가사 검색은 VocaDB에 등록된 가사가 있는 후보를 우선 대조합니다. 웹 검색은 새 탭으로 열립니다.</div>';
  }

  const baseReset=resetDetective;
  resetDetective=function(){
    baseReset();
    const l=document.getElementById("detectiveLyrics");
    if(l)l.value="";
    const lc=document.getElementById("detectiveLyricCertainty");
    if(lc)lc.value="likely";
    const deep=document.getElementById("detectiveDeepLyrics");
    if(deep)deep.checked=true;
    const useNico=document.getElementById("detectiveUseNico");
    const useVoca=document.getElementById("detectiveUseVocaDB");
    const sourceStatus=document.getElementById("detectiveSourceStatus");
    if(useNico)useNico.checked=true;
    if(useVoca)useVoca.checked=true;
    if(sourceStatus)sourceStatus.textContent="두 소스를 교차 수색합니다.";
    state.detectiveFeedback=null;
    const hunt=document.getElementById("detectiveWebHunt");
    if(hunt){hunt.hidden=true;hunt.innerHTML="";}
    updateLyricsPreview();
    renderFeedbackSummary();
  };

  function boot(){
    const lyric=document.getElementById("detectiveLyrics");
    if(lyric){
      lyric.addEventListener("input",function(){updateLyricsPreview();updateDetectiveClueMeter();});
      lyric.addEventListener("keydown",function(e){
        if((e.ctrlKey||e.metaKey)&&e.key==="Enter")detectiveSearch();
      });
    }
    const cert=document.getElementById("detectiveLyricCertainty");
    if(cert)cert.addEventListener("change",updateDetectiveClueMeter);
    const deep=document.getElementById("detectiveDeepLyrics");
    if(deep)deep.addEventListener("change",updateDetectiveClueMeter);
    const hunt=document.getElementById("detectiveWebHuntBtn");
    if(hunt)hunt.addEventListener("click",renderWebHunt);

    // 메인 스크립트가 먼저 걸어둔 초기화 리스너를 제거하고 v12 초기화로 교체.
    const resetBtn=document.getElementById("detectiveResetBtn");
    if(resetBtn){
      const fresh=resetBtn.cloneNode(true);
      resetBtn.parentNode.replaceChild(fresh,resetBtn);
      fresh.addEventListener("click",resetDetective);
    }

    updateLyricsPreview();
    renderFeedbackSummary();
    updateDetectiveClueMeter();
  }

  boot();
})();