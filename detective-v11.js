/* Voice Synth Archive Detective v11.5
 * Niconico + VocaDB cross-search, adaptive follow-up questions.
 */
(function(){
  "use strict";

  const V11_VOCADB_API = "https://vocadb.net/api";
  const v11Cache = new Map();

  function v11Arr(v){ return Array.isArray(v) ? v : []; }
  function v11Name(x){ return String((x && (x.value || x.name || x.defaultName)) || "").trim(); }

  async function v11FetchJson(url){
    const hit=v11Cache.get(url);
    if(hit && Date.now()-hit.at < 30*60*1000) return hit.data;
    const ctl=new AbortController();
    const timer=setTimeout(function(){ctl.abort();},10000);
    try{
      const r=await fetch(url,{signal:ctl.signal,headers:{"Accept":"application/json"}});
      if(!r.ok) throw new Error("VocaDB HTTP "+r.status);
      const data=await r.json();
      v11Cache.set(url,{at:Date.now(),data:data});
      return data;
    }finally{clearTimeout(timer);}
  }

  function v11ArtistNames(item){
    return v11Arr(item && item.artists).map(function(x){return v11Name((x && x.artist)||x);}).filter(Boolean);
  }
  function v11TagNames(item){
    return v11Arr(item && item.tags).map(function(x){return v11Name((x && x.tag)||x);}).filter(Boolean);
  }
  function v11Aliases(item){
    const a=[];
    if(item && item.additionalNames) String(item.additionalNames).split(/[,、]/).forEach(function(x){x=x.trim();if(x)a.push(x);});
    v11Arr(item && item.names).forEach(function(x){const v=v11Name(x);if(v)a.push(v);});
    return Array.from(new Set(a));
  }
  function v11NicoPv(item){
    return v11Arr(item && item.pvs).find(function(p){
      return /NicoNicoDouga/i.test(String((p&&p.service)||"")) && p && p.pvId;
    }) || null;
  }
  function v11BestPv(item){
    return v11NicoPv(item) || v11Arr(item && item.pvs).find(function(p){return p && (p.url||p.pvId);}) || null;
  }
  function v11ItemToSong(item){
    const artists=v11ArtistNames(item);
    const tags=v11TagNames(item).concat(artists);
    const aliases=v11Aliases(item);
    const nico=v11NicoPv(item);
    const best=v11BestPv(item);
    const nicoId=nico && nico.pvId ? String(nico.pvId) : "";
    const id=Number(item && item.id)||0;
    const thumb=(item && item.thumbUrl) || (item && item.mainPicture && (item.mainPicture.urlThumb||item.mainPicture.urlSmallThumb)) || "";
    return {
      contentId:nicoId || ("vocadb:"+id),
      title:(item && (item.name||item.defaultName)) || aliases[0] || ("VocaDB #"+id),
      description:[item&&item.additionalNames,artists.join(" "),aliases.join(" ")].filter(Boolean).join(" · "),
      viewCounter:null, commentCounter:0, mylistCounter:0, likeCounter:0,
      startTime:(item&&item.publishDate) || (best&&best.publishDate) || "",
      lengthSeconds:Number(item&&item.lengthSeconds)||0,
      thumbnailUrl:thumb,
      tags:Array.from(new Set(tags)),
      aliases:aliases,
      artistString:(item&&item.artistString) || artists.join(", "),
      lyrics:v11Arr(item&&item.lyrics).map(function(x){return {
        value:String((x&&x.value)||""),
        translationType:String((x&&x.translationType)||""),
        cultureCodes:v11Arr(x&&x.cultureCodes),
        source:String((x&&x.source)||""),
        url:String((x&&x.url)||"")
      };}).filter(function(x){return x.value;}),
      bpm:(item&&item.bpm)||null,
      vocadbId:id,
      vocadbUrl:"https://vocadb.net/S/"+id,
      vocadbPVs:v11Arr(item&&item.pvs),
      webLinks:v11Arr(item&&item.webLinks),
      albums:v11Arr(item&&item.albums),
      __nicoId:nicoId,
      __source:"vocadb",
      __sources:["vocadb"]
    };
  }

  function v11DurationBounds(kind){
    if(kind==="short")return [0,119];
    if(kind==="2-3")return [120,179];
    if(kind==="3-4")return [180,239];
    if(kind==="4-5")return [240,299];
    if(kind==="long")return [300,null];
    return [0,null];
  }

  function v11SongUrl(opts){
    opts=opts||{};
    const c=opts.clues||{};
    const p=new URLSearchParams();
    if(opts.query)p.set("query",opts.query);
    p.set("songTypes","Original");
    p.set("maxResults","50");
    p.set("getTotalCount","false");
    p.set("nameMatchMode","Partial");
    p.set("preferAccurateMatches","true");
    p.set("fields","AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Bpm,Lyrics,WebLinks,Albums");
    p.set("lang","Japanese");
    p.set("sort",opts.sort||"FavoritedTimes");
    if(opts.artistId!=null)p.append("artistId",String(opts.artistId));
    if(opts.start!=null)p.set("start",String(opts.start));
    if(c.yearFrom)p.set("afterDate",c.yearFrom+"-01-01T00:00:00Z");
    if(c.yearTo)p.set("beforeDate",(c.yearTo+1)+"-01-01T00:00:00Z");
    if(c.duration){
      const b=v11DurationBounds(c.duration);
      if(b[0])p.set("minLength",String(b[0]));
      if(b[1]!=null)p.set("maxLength",String(b[1]));
    }
    return V11_VOCADB_API+"/songs?"+p.toString();
  }

  async function v11SearchVocaDB(query,c){
    if(!query)return [];
    try{
      const data=await v11FetchJson(v11SongUrl({query:query,clues:c}));
      state.detectiveVocaDBError="";
      return v11Arr(data&&data.items).map(v11ItemToSong);
    }catch(e){
      state.detectiveVocaDBError=String((e&&e.message)||e);
      return [];
    }
  }

  async function v11FindArtists(query){
    if(!query)return [];
    try{
      const p=new URLSearchParams();
      p.set("query",query);
      p.set("nameMatchMode","Partial");
      p.set("maxResults","8");
      p.set("getTotalCount","false");
      p.set("fields","AdditionalNames");
      p.set("lang","Japanese");
      const data=await v11FetchJson(V11_VOCADB_API+"/artists?"+p.toString());
      return v11Arr(data&&data.items);
    }catch(e){ return []; }
  }

  async function v11SearchByArtist(name,c){
    const artists=await v11FindArtists(name);
    const batches=await Promise.all(artists.slice(0,3).map(async function(a){
      try{
        const data=await v11FetchJson(v11SongUrl({artistId:a.id,clues:c}));
        return v11Arr(data&&data.items).map(v11ItemToSong);
      }catch(e){return [];}
    }));
    return batches.flat();
  }

  function v11LyricHaystack(song){
    return v11Arr(song&&song.lyrics).map(function(x){return String((x&&x.value)||"");}).join("\n");
  }

  function v11NormText(s){
    return String(s||"").normalize("NFKC").toLowerCase().replace(/[\s\u3000\p{P}\p{S}]+/gu,"");
  }

  function v11LyricsMatch(song,terms){
    if(!terms||!terms.length)return true;
    const hay=v11NormText(v11LyricHaystack(song));
    if(!hay)return false;
    return terms.some(function(t){
      const n=v11NormText(t);
      return n.length>=2 && hay.includes(n);
    });
  }

  async function v11SearchLyricsPool(c){
    if(!c||!c.lyrics||!c.deepLyrics)return [];
    const terms=(c.lyricPhrases||c.lyricTokens||[]).filter(Boolean).slice(0,6);
    if(!terms.length)return [];

    const pages=[];
    // 한 번의 수사에서 최대 150곡만 읽고, 같은 URL은 v11Cache가 30분 재사용한다.
    for(let start=0;start<150;start+=50){
      pages.push((async function(offset){
        try{
          const data=await v11FetchJson(v11SongUrl({
            query:"",
            clues:c,
            sort:c.yearFrom||c.yearTo?"PublishDate":"FavoritedTimes",
            start:offset
          }));
          return v11Arr(data&&data.items).map(v11ItemToSong);
        }catch(e){return [];}
      })(start));
    }

    const rows=(await Promise.all(pages)).flat();
    const matched=rows.filter(function(song){return v11LyricsMatch(song,terms);});
    // 가사가 VocaDB에 없어서 직접 매치가 불가능한 경우도 있으므로,
    // 다른 강한 단서가 있을 때는 일부 후보를 보존한다.
    if(matched.length)return matched;
    if(c.vocal||c.producer||c.yearFrom||c.yearTo)return rows.slice(0,80);
    return [];
  }

  function v11Key(song){
    const id=String((song&&song.__nicoId)||(song&&song.contentId)||"");
    if(/^(sm|nm|so)\d+$/i.test(id))return "nico:"+id.toLowerCase();
    if(song&&song.vocadbId)return "vocadb:"+song.vocadbId;
    return "other:"+String((song&&song.contentId)||(song&&song.title)||"");
  }
  function v11Merge(a,b){
    if(!a)return b;if(!b)return a;
    const an=/^(sm|nm|so)\d+$/i.test(String(a.contentId||""));
    const bn=/^(sm|nm|so)\d+$/i.test(String(b.contentId||""));
    const primary=an?a:(bn?b:a);
    const secondary=primary===a?b:a;
    const m=Object.assign({},secondary,primary);
    m.tags=Array.from(new Set(parseTags(a.tags).concat(parseTags(b.tags))));
    m.aliases=Array.from(new Set((a.aliases||[]).concat(b.aliases||[])));
    m.__sources=Array.from(new Set((a.__sources||[a.__source||"niconico"]).concat(b.__sources||[b.__source||"niconico"])));
    m.__source=m.__sources.length>1?"cross":(m.__sources[0]||"niconico");
    m.vocadbId=a.vocadbId||b.vocadbId||null;
    m.vocadbUrl=a.vocadbUrl||b.vocadbUrl||"";
    m.vocadbPVs=a.vocadbPVs||b.vocadbPVs||[];
    m.artistString=a.artistString||b.artistString||"";
    return m;
  }
  function v11Add(map,song){
    if(!song||!song.contentId)return;
    const k=v11Key(song);
    map.set(k,map.has(k)?v11Merge(map.get(k),song):song);
  }
  function v11PrimaryUrl(song){
    if(/^(sm|nm|so)\d+$/i.test(String((song&&song.contentId)||"")))return "https://www.nicovideo.jp/watch/"+encodeURIComponent(song.contentId);
    return (song&&song.vocadbUrl)||"#";
  }

  const oldTextContains=detectiveTextContains;
  detectiveTextContains=function(song,token){
    const t=String(token||"").toLowerCase();
    if(!t)return false;
    if(oldTextContains(song,token))return true;
    const aliases=(song&&song.aliases||[]).join(" ").toLowerCase();
    const artists=String((song&&song.artistString)||"").toLowerCase();
    return aliases.includes(t)||artists.includes(t);
  };

  function v11Evidence(song,c){
    const cc=Object.assign({},c);
    if(song.__source==="vocadb" && !song.viewCounter)cc.fame="";
    const ev=detectiveEvidence(song,cc);
    if((song.__sources||[]).length>=2){
      ev.score=Math.min(99.9,ev.score+5);
      ev.matches.unshift({text:"Niconico + VocaDB 교차 확인",strong:true});
    }else if(song.__source==="vocadb"){
      ev.score=Math.min(99.9,ev.score+1.5);
      ev.matches.unshift({text:"VocaDB 곡 엔트리",strong:false});
    }
    return ev;
  }

  async function v11DetectiveSearch(){
    if(state.busy)return;
    const c=collectDetectiveClues();
    c.useNico=document.getElementById("detectiveUseNico") ? document.getElementById("detectiveUseNico").checked : true;
    c.useVocaDB=document.getElementById("detectiveUseVocaDB") ? document.getElementById("detectiveUseVocaDB").checked : true;

    if(!c.useNico&&!c.useVocaDB){toast("수색 데이터베이스를 하나 이상 선택하세요.");return;}
    if(c.useNico&&!relayBase()&&!c.useVocaDB){toast("Niconico 수색을 쓰려면 Worker를 연결하세요.");return;}

    const clueCount=detectiveClueUnits(c);
    const rule=detectiveRuleFor(c,clueCount);
    if(clueCount<rule.minClues){toast(rule.label+" 수색에는 단서가 최소 "+rule.minClues+"개 필요합니다.");return;}

    state.busy=true;
    const btn=document.getElementById("detectiveSearchBtn");
    if(btn)btn.disabled=true;
    state.detectiveVocaDBError="";
    const sourceNames=[c.useNico?"Niconico":"",c.useVocaDB?"VocaDB":""].filter(Boolean).join(" + ");
    const sourceStatus=document.getElementById("detectiveSourceStatus");
    if(sourceStatus)sourceStatus.textContent=sourceNames+" 수색 중…";
    document.getElementById("detectiveStatus").innerHTML="<b>"+esc(rule.label)+"</b> · "+esc(sourceNames)+"에서 "+clueCount+"개 기억 단서를 교차 대조합니다.";
    document.getElementById("detectiveResults").innerHTML='<div class="detective-empty">후보 수집 중…<br><small>곡명·별칭·아티스트·PV·니코동 태그를 함께 조사합니다.</small></div>';

    try{
      const nicoTasks=[],vocaTasks=[],titleTerms=[];
      if(c.words){
        const atoms=(c.strongWordTokens&&c.strongWordTokens.length)?c.strongWordTokens:c.wordTokens;
        titleTerms.push.apply(titleTerms,atoms.slice(0,5));
        (c.kanjiHints||[]).slice(0,5).forEach(function(x){titleTerms.push(x.kanji);});
        if(c.useNico&&relayBase()){
          atoms.slice(0,5).forEach(function(token){
            nicoTasks.push(detectiveFetchText(token,c,"-viewCounter"));
            if(c.textCertainty==="exact"||c.textCertainty==="likely")nicoTasks.push(detectiveFetchText(token,c,"-viewCounter","title"));
          });
          (c.kanjiHints||[]).slice(0,5).forEach(function(h){
            nicoTasks.push(detectiveFetchText(h.kanji,c,"-viewCounter"));
            nicoTasks.push(detectiveFetchText(h.kanji,c,"-viewCounter","title"));
          });
        }
      }

      if(c.lyrics){
        const lyricTerms=(c.lyricPhrases||c.lyricTokens||[]).filter(Boolean).slice(0,4);
        if(c.useNico&&relayBase()){
          lyricTerms.forEach(function(term){
            nicoTasks.push(detectiveFetchText(term,c,"-viewCounter","description"));
          });
        }
        if(c.useVocaDB&&c.deepLyrics){
          vocaTasks.push(v11SearchLyricsPool(c));
        }
      }

      if(c.useVocaDB){
        Array.from(new Set(titleTerms)).slice(0,6).forEach(function(term){vocaTasks.push(v11SearchVocaDB(term,c));});
        if(c.producer)vocaTasks.push(v11SearchByArtist(c.producer,c));
        if(c.vocal)vocaTasks.push(v11SearchByArtist(c.vocal,c));
      }

      if(c.useNico&&relayBase()){
        if(c.producer)c.producerTokens.slice(0,3).forEach(function(t){nicoTasks.push(detectiveFetchText(t,c,"-viewCounter"));});
        if(c.vocal)nicoTasks.push(detectiveFetchTag(c.vocal,c));
        const semantic=Array.from(new Set(c.inferred.concat((c.kanjiHints||[]).map(function(x){return x.kanji;}))));
        const strong=c.sourceTags.concat(c.genre.slice(0,3),c.visualTags.slice(0,2),c.mood.slice(0,2),semantic.slice(0,5));
        strong.slice(0,7).forEach(function(t){nicoTasks.push(detectiveFetchTag(t,c));});
        if(nicoTasks.length<2){
          nicoTasks.push(detectiveFallback(c,"-mylistCounter"));
          nicoTasks.push(detectiveFallback(c,"-viewCounter"));
          nicoTasks.push(detectiveFallback(c,"+viewCounter"));
        }
      }

      if(c.useVocaDB&&vocaTasks.length===0){
        try{
          const data=await v11FetchJson(v11SongUrl({query:"",clues:c,sort:"FavoritedTimes"}));
          vocaTasks.push(Promise.resolve(v11Arr(data&&data.items).map(v11ItemToSong)));
        }catch(e){}
      }

      const both=await Promise.all([
        Promise.all(nicoTasks.slice(0,14)),
        Promise.all(vocaTasks.slice(0,12))
      ]);
      const uniq=new Map();

      both[0].flat().forEach(function(s){
        if(!s||!s.contentId||state.detectiveExcluded.has(s.contentId))return;
        s.__source=s.__source||"niconico";
        s.__sources=s.__sources||["niconico"];
        v11Add(uniq,s);
      });
      both[1].flat().forEach(function(s){
        if(!s||!s.contentId||state.detectiveExcluded.has(s.contentId))return;
        v11Add(uniq,s);
      });

      if(!uniq.size&&c.useNico&&relayBase()){
        const fb=await Promise.all([detectiveFallback(c,"-mylistCounter"),detectiveFallback(c,"-viewCounter"),detectiveFallback(c,"-startTime")]);
        fb.flat().forEach(function(s){
          if(!s||!s.contentId||state.detectiveExcluded.has(s.contentId))return;
          s.__source="niconico";s.__sources=["niconico"];v11Add(uniq,s);
        });
      }

      const raw=Array.from(uniq.values());
      let hardRejected=0,scoreRejected=0,matchRejected=0;
      let prelim=raw.map(function(song){return Object.assign({song:song},v11Evidence(song,c));});
      prelim.sort(function(a,b){return b.score-a.score;});
      await enrichImageSimilarity(prelim);

      const scored=[];
      prelim.forEach(function(ev){
        const hardFail=ev.hardFailures.length>0;
        const hardReject=(c.strictness==="strict"||c.strictness==="very_strict"||(c.strictness==="auto"&&clueCount>=3));
        if(hardReject&&hardFail){hardRejected++;return;}
        if(ev.matchedCount<rule.minMatches){matchRejected++;return;}
        if(ev.score<rule.minScore){scoreRejected++;return;}
        scored.push(ev);
      });
      scored.sort(function(a,b){return b.score-a.score||b.matchedCount-a.matchedCount||((+b.song.viewCounter||0)-(+a.song.viewCounter||0));});
      state.detectiveCandidates=scored.slice(0,rule.maxResults);

      const nc=raw.filter(function(s){return (s.__sources||[]).includes("niconico");}).length;
      const vc=raw.filter(function(s){return (s.__sources||[]).includes("vocadb");}).length;
      const xc=raw.filter(function(s){return (s.__sources||[]).length>=2;}).length;
      if(sourceStatus)sourceStatus.textContent="Niconico "+nc+" · VocaDB "+vc+" · 교차 "+xc+(state.detectiveVocaDBError?" · VocaDB 일부 실패":"");

      renderDetectiveResults(c,{raw:raw.length,hardRejected:hardRejected,scoreRejected:scoreRejected,matchRejected:matchRejected,rule:rule,clueCount:clueCount,kept:scored.length,nicoCount:nc,vocaCount:vc,crossCount:xc});
    }catch(e){
      document.getElementById("detectiveResults").innerHTML='<div class="detective-empty">수색 실패<br><small>'+esc(String((e&&e.message)||e))+"</small></div>";
      document.getElementById("detectiveStatus").textContent="후보를 불러오지 못했습니다.";
    }finally{
      state.busy=false;
      if(btn)btn.disabled=false;
      updateDetectiveClueMeter();
    }
  }

  function v11TitleLength(song){
    const n=Array.from(String((song&&song.title)||"").replace(/\s+/g,"")).length;
    return n<=5?"짧음":n<=12?"보통":"김";
  }
  function v11TitleStyle(song){
    const t=String((song&&song.title)||"");
    const jp=(t.match(/[\u3040-\u30ff\u3400-\u9fff]/g)||[]).length;
    const latin=(t.match(/[A-Za-z]/g)||[]).length;
    if(jp&&latin)return "일본어+영문 혼합";
    if(latin>=3&&latin>jp)return "영문/로마자 중심";
    return jp?"일본어/한자 중심":"기타";
  }
  function v11Fame(song){
    if(!song||song.viewCounter==null)return "불명";
    return detectiveFameBucket(song);
  }
  function v11Utility(dist,total){
    const usable=dist.filter(function(x){return x[0]!=="불명"&&x[0]!=="기타/불명"&&x[0]!=="기타"&&x[1]>0;});
    const covered=usable.reduce(function(s,x){return s+x[1];},0);
    if(usable.length<2||covered<Math.max(3,total*.35))return -1;
    let h=0;
    usable.forEach(function(x){const p=x[1]/covered;h-=p*Math.log2(p);});
    const norm=h/Math.log2(usable.length);
    const coverage=covered/total;
    const largest=Math.max.apply(null,usable.map(function(x){return x[1];}))/covered;
    return norm*coverage*(1-Math.max(0,largest-.72));
  }

  renderDetectiveFollowup=function(c,rows){
    const box=document.getElementById("detectiveFollowup");
    if(!box||!rows||rows.length<3){if(box)box.style.display="none";return;}
    const qs=[];
    function add(type,q,dist){
      const score=v11Utility(dist,rows.length);
      if(score>0)qs.push({type:type,q:q,dist:dist,score:score});
    }
    if(!c.vocal)add("vocal","보컬은 이 중 하나였나요?",topDistribution(rows,detectCandidateVocal,5));
    if(!c.yearFrom&&!c.yearTo)add("year","대략 어느 시기 곡이었나요?",topDistribution(rows,detectiveYearBucket,5));
    if(!c.fame)add("fame","현재 조회수는 어느 정도였나요?",topDistribution(rows,v11Fame,5));
    if(!c.titleLength)add("titleLength","제목 길이는 어느 쪽에 가까웠나요?",topDistribution(rows,v11TitleLength,4));
    if(!c.titleStyle)add("titleStyle","제목 표기는 어떤 느낌이었나요?",topDistribution(rows,v11TitleStyle,4));
    qs.sort(function(a,b){return b.score-a.score;});
    if(!qs.length){box.style.display="none";return;}
    const o=qs[0];
    const buttons=o.dist.filter(function(x){return x[0]!=="불명"&&x[0]!=="기타/불명"&&x[0]!=="기타";}).slice(0,5).map(function(x){
      return '<button type="button" onclick="applyDetectiveFollowup(\''+o.type+'\',\''+esc(String(x[0]))+'\')">'+esc(x[0])+" ("+x[1]+")</button>";
    }).join("");
    box.style.display="block";
    box.innerHTML='<div class="detective-followup-title">다음 질문 · 후보를 가장 많이 줄일 수 있는 단서</div><div class="detective-followup-sub">'+esc(o.q)+'</div><div class="detective-followup-options">'+buttons+'<button type="button" onclick="document.getElementById(\'detectiveFollowup\').style.display=\'none\'">모름 / 건너뛰기</button></div>';
  };

  const oldApply=applyDetectiveFollowup;
  applyDetectiveFollowup=function(type,value){
    if(type==="titleLength"){
      const m={"짧음":"short","보통":"medium","김":"long"};
      document.getElementById("detectiveTitleLength").value=m[value]||"";
      updateDetectiveClueMeter();v11DetectiveSearch();return;
    }
    if(type==="titleStyle"){
      const m={"일본어/한자 중심":"jp","영문/로마자 중심":"latin","일본어+영문 혼합":"mixed"};
      document.getElementById("detectiveTitleStyle").value=m[value]||"";
      updateDetectiveClueMeter();v11DetectiveSearch();return;
    }
    oldApply(type,value);
  };

  renderDetectiveResults=function(c,stats){
    const rows=state.detectiveCandidates||[];
    const follow=document.getElementById("detectiveFollowup");
    if(!rows.length){
      document.getElementById("detectiveResults").innerHTML='<div class="detective-zero"><b>조건을 통과한 후보가 없습니다.</b><br>단서를 자동으로 크게 풀지는 않았습니다. 확실도가 낮은 조건 하나를 완화하거나 다른 표현을 추가해보세요.</div>';
      document.getElementById("detectiveStatus").innerHTML='후보 <b>0곡</b>';
      if(follow)follow.style.display="none";
      return;
    }
    const clueCount=detectiveClueUnits(c);
    const rule=detectiveRuleFor(c,clueCount);
    document.getElementById("detectiveStatus").innerHTML='<span class="detective-stage-badge">'+esc(rule.label)+'</span> · 수집 '+(stats?stats.raw:rows.length)+'곡 → 상위 <b>'+rows.length+'곡</b> 표시';
    renderDetectiveFollowup(c,rows);

    document.getElementById("detectiveResults").innerHTML=rows.map(function(x,i){
      const s=x.song;
      const y=songYear(s)||"-";
      const conf=detectiveConfidenceLabel(x.score);
      const good=x.matches.slice(0,8);
      const bad=x.hardFailures.slice(0,3);
      const sec=+s.lengthSeconds||0;
      const primary=v11PrimaryUrl(s);
      const hasNico=/^(sm|nm|so)\d+$/i.test(String(s.contentId||""));
      const sources=s.__sources||[s.__source||"niconico"];
      const sourceBadge=sources.length>1?'<span class="detective-source-badge cross">Niconico × VocaDB</span>':sources.includes("vocadb")?'<span class="detective-source-badge vocadb">VocaDB</span>':'<span class="detective-source-badge">Niconico</span>';
      const meta=[sourceBadge,'<span>'+y+'년</span>'];
      if(hasNico&&s.viewCounter!=null)meta.push('<span>조회 '+fmt(s.viewCounter||0)+'</span>');
      if(s.artistString)meta.push('<span>'+esc(s.artistString)+'</span>');
      if(sec)meta.push('<span>'+Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")+'</span>');
      const actions=[
        '<a class="mini-btn" href="'+esc(primary)+'" target="_blank" rel="noopener">확인하기</a>'
      ];
      if(s.vocadbUrl&&hasNico)actions.push('<a class="mini-btn" href="'+esc(s.vocadbUrl)+'" target="_blank" rel="noopener">VocaDB 정보</a>');
      actions.push('<button class="mini-btn detective-near" onclick="markDetectiveNear(\''+esc(s.contentId)+'\')">이 느낌에 가까움</button>');
      if(hasNico)actions.push('<button class="mini-btn" onclick="detectiveSimilar(\''+esc(s.contentId)+'\')">비슷한 곡 보기</button>');
      actions.push('<button class="mini-btn" onclick="excludeDetective(\''+esc(s.contentId)+'\')">이 곡 아님</button>');

      return '<article class="detective-card"><img class="detective-thumb" src="'+esc(s.thumbnailUrl||"")+'" loading="lazy" onerror="this.style.visibility=\'hidden\'"><div>'+
        '<a class="detective-card-title" href="'+esc(primary)+'" target="_blank" rel="noopener">'+(i+1)+'. '+esc(s.title||s.contentId)+'</a>'+
        '<div class="detective-card-meta">'+meta.join("")+'</div>'+
        '<div class="detective-scoreline"><span class="detective-score">'+x.score.toFixed(1)+'%</span><span class="detective-confidence '+conf[1]+'">'+conf[0]+'</span><div class="detective-meter"><i style="width:'+x.score+'%"></i></div></div>'+
        '<div class="detective-statline"><span class="detective-stat">일치 '+x.matchedCount+'개</span><span class="detective-stat">확실단서 위반 '+x.hardFailures.length+'</span>'+(x.imageSimilarity!=null?'<span class="detective-stat">이미지 '+(x.imageSimilarity*100).toFixed(0)+'%</span>':'')+'</div>'+
        '<div class="detective-matches">'+good.map(function(m){return '<span class="detective-match '+(m.strong?"strong":"")+'">'+esc(m.text)+'</span>';}).join("")+bad.map(function(m){return '<span class="detective-match bad">'+esc(m)+'</span>';}).join("")+'</div>'+
        '<div class="detective-actions-row">'+actions.join("")+'</div></div></article>';
    }).join("");
  };

  detectiveSearch=v11DetectiveSearch;

  const oldBtn=document.getElementById("detectiveSearchBtn");
  if(oldBtn){
    const newBtn=oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn,oldBtn);
    newBtn.addEventListener("click",v11DetectiveSearch);
  }
  ["detectiveUseNico","detectiveUseVocaDB"].forEach(function(id){
    const el=document.getElementById(id);
    if(el)el.addEventListener("change",updateDetectiveClueMeter);
  });
  const reset=document.getElementById("detectiveResetBtn");
  if(reset)reset.addEventListener("click",function(){
    const n=document.getElementById("detectiveUseNico"),v=document.getElementById("detectiveUseVocaDB"),s=document.getElementById("detectiveSourceStatus");
    if(n)n.checked=true;if(v)v.checked=true;if(s)s.textContent="두 소스를 교차 수색합니다.";
  });
})();