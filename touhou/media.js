(function(){
"use strict";
const NICO_ORIGIN="https://embed.nicovideo.jp";
const PLAYER_ID="touhouDivePlayer";
const AUTO_KEY="touhoudive:player:autoNext";
const PLAYBACK_MODE_KEY="touhoudive:player:youtubeMode";
const PLAYBACK_POLICY_KEY="touhoudive:player:youtubeInlinePolicy:v3";
const BAD_MEDIA_KEY="touhoudive:media:unavailable:v1";
const VISUAL_MODE_KEY="touhoudive:player:visualMode:v1";

function clean(v){return String(v??"").trim()}
function srcFor(media){
  if(!media||media.mode==="external")return"";
  if(media.provider==="youtube"&&media.id)return "youtube:"+media.id;
  if(media.provider==="niconico"&&media.id)return NICO_ORIGIN+"/watch/"+encodeURIComponent(media.id)+"?jsapi=1&playerId="+encodeURIComponent(PLAYER_ID)+"&autoplay=1";
  if(media.provider==="soundcloud"&&media.url)return "https://w.soundcloud.com/player/?url="+encodeURIComponent(media.url)+"&auto_play=true&hide_related=true&show_comments=false&show_reposts=false";
  if(media.provider==="piapro"&&media.id)return "https://piapro.jp/content/"+encodeURIComponent(media.id);
  if(media.provider==="bilibili"&&media.id)return "https://player.bilibili.com/player.html?aid="+encodeURIComponent(media.id)+"&page=1&autoplay=1";
  if(media.provider==="bandcamp"&&media.id)return "https://bandcamp.com/EmbeddedPlayer/size=large/bgcol=111827/linkcol=ff607b/tracklist=false/artwork=small/track="+encodeURIComponent(media.id)+"/transparent=true/";
  if(media.provider==="touhoudb"&&media.songId)return "https://touhoudb.com/Ext/EmbedSong?songId="+encodeURIComponent(media.songId)+"&lang=Default";
  return clean(media.embed);
}
function embedSrc(media){
  if(!media)return"";
  if(media.provider==="youtube"&&media.id)return "https://www.youtube-nocookie.com/embed/"+encodeURIComponent(media.id)+"?autoplay=1&playsinline=1&rel=0";
  return srcFor(media);
}
let ytPromise=null;
function ensureYoutubeApi(){
  if(window.YT&&window.YT.Player)return Promise.resolve(window.YT);
  if(ytPromise)return ytPromise;
  ytPromise=new Promise((resolve,reject)=>{
    const old=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=function(){try{old&&old()}catch(_){} resolve(window.YT)};
    const s=document.createElement("script");
    s.src="https://www.youtube.com/iframe_api";s.async=true;
    s.onerror=()=>reject(new Error("YouTube player API load failed"));
    document.head.appendChild(s);
    setTimeout(()=>{if(window.YT&&window.YT.Player)resolve(window.YT);else reject(new Error("YouTube player API timeout"))},4000);
  });
  return ytPromise;
}
class TouhouMediaPlayer{
  constructor(){
    this.shell=document.getElementById("playerShell");
    this.video=document.getElementById("playerVideo");
    // A restored/cached DOM can remember the full-player visibility even though
    // the JS playback state starts empty. Always boot closed and open only from play().
    if(this.shell){
      this.shell.hidden=true;
      this.shell.classList.remove("is-active","is-mini","is-playing");
    }
    document.body.classList.remove("player-open");
    this.title=document.getElementById("playerTitle");
    this.meta=document.getElementById("playerMeta");
    this.type=document.getElementById("playerType");
    this.source=document.getElementById("playerSource");
    this.playBtn=document.getElementById("playerPlay");
    this.autoBtn=document.getElementById("playerAuto");
    this.pipBtn=document.getElementById("playerPip");
    this.rankEl=document.getElementById("playerRanks");
    this.rankDetailEl=document.getElementById("playerRankDetail");
    this.stationFace=document.getElementById("stationPlayerFace");
    this.stationArt=document.getElementById("stationPlayerArt");
    this.stationTitle=document.getElementById("stationPlayerTitle");
    this.stationArtist=document.getElementById("stationPlayerArtist");
    this.stationAlbum=document.getElementById("stationPlayerAlbum");
    this.stationSource=document.getElementById("stationPlayerSource");
    this.stationQueue=document.getElementById("stationPlayerQueue");
    this.artwork=document.getElementById("playerArtwork");
    this.miniArt=document.getElementById("playerMiniArt");
    this.ambient=document.getElementById("playerAmbient");
    this.songModeBtn=document.getElementById("playerSongMode");
    this.videoModeBtn=document.getElementById("playerVideoMode");
    this.seek=document.getElementById("playerSeek");
    this.elapsed=document.getElementById("playerElapsed");
    this.duration=document.getElementById("playerDuration");
    this.favoriteBtn=document.getElementById("playerFavAction");
    this.originBtn=document.getElementById("playerOriginAction");
    this.diveBtn=document.getElementById("playerDiveAction");
    this.detailBtn=document.getElementById("playerDetailAction");
    this.rankDetailKey="";
    this.relatedEl=document.getElementById("playerRelated");
    this.lyricsEl=document.getElementById("playerLyrics");
    this.infoEl=document.getElementById("playerInfo");
    this.relatedTab=document.getElementById("playerTabRelated");
    this.lyricsTab=document.getElementById("playerTabLyrics");
    this.infoTab=document.getElementById("playerTabInfo");
    this.visualMode=localStorage.getItem(VISUAL_MODE_KEY)==="video"?"video":"song";
    this.viewportOrientation=window.innerWidth>window.innerHeight?"landscape":"portrait";
    this.artworkCache=new Map();this.artworkSeq=0;
    this.current=null;this.queue=[];this.index=-1;this.frame=null;this.yt=null;this.playing=true;this.activeTab="related";
    this.pipWindow=null;this.pipHome=null;this.backgroundActive=false;
    this.autoNext=localStorage.getItem(AUTO_KEY)!=="0";
    const migrated=localStorage.getItem(PLAYBACK_POLICY_KEY)==="3";
    this.youtubeMode=migrated&&localStorage.getItem(PLAYBACK_MODE_KEY)==="youtube"?"youtube":"inline";
    if(!migrated){
      try{
        localStorage.setItem(PLAYBACK_MODE_KEY,"inline");
        localStorage.setItem(PLAYBACK_POLICY_KEY,"3");
      }catch(_){}
    }
    try{this.badMedia=new Set(JSON.parse(localStorage.getItem(BAD_MEDIA_KEY)||"[]"))}catch(_){this.badMedia=new Set()}
    document.getElementById("playerClose").onclick=()=>this.close();
    document.getElementById("playerHeadClose").onclick=()=>this.close();
    this.shell.addEventListener("click",e=>{
      const target=e.target.closest?.("#playerHeadClose,#playerClose,#playerHeadMini");
      if(!target)return;
      e.preventDefault();e.stopPropagation();
      if(target.id==="playerHeadMini")this.minimize();else this.close();
    },true);
    if(this.pipBtn)this.pipBtn.onclick=()=>this.requestPip();
    document.getElementById("playerMini").onclick=()=>this.minimize();
    document.getElementById("playerHeadMini").onclick=()=>this.minimize();
    document.getElementById("playerExpand").onclick=()=>this.expand();
    document.getElementById("playerPrev").onclick=()=>this.relative(-1);
    document.getElementById("playerNext").onclick=()=>this.relative(1);
    this.playBtn.onclick=()=>this.togglePlayback();
    this.autoBtn.onclick=()=>this.setAutoNext(!this.autoNext);
    if(this.relatedTab)this.relatedTab.onclick=()=>this.setTab("related");
    if(this.lyricsTab)this.lyricsTab.onclick=()=>this.setTab("lyrics");
    if(this.infoTab)this.infoTab.onclick=()=>this.setTab("info");
    if(this.songModeBtn)this.songModeBtn.onclick=()=>this.setVisualMode("song");
    if(this.videoModeBtn)this.videoModeBtn.onclick=()=>this.setVisualMode("video");
    if(this.seek){
      this.seek.addEventListener("change",()=>{
        if(!this.yt||this.seek.disabled)return;
        const d=Number(this.yt.getDuration?.())||0;
        if(d>0)try{this.yt.seekTo(d*(Number(this.seek.value)||0)/1000,true)}catch(_){}
      });
    }
    const emitAction=action=>window.dispatchEvent(new CustomEvent("touhoudive:player-action",{detail:{action,trackId:this.current?.id||""}}));
    if(this.favoriteBtn)this.favoriteBtn.onclick=()=>emitAction("favorite");
    if(this.originBtn)this.originBtn.onclick=()=>emitAction("origin");
    if(this.diveBtn)this.diveBtn.onclick=()=>emitAction("dive");
    if(this.detailBtn)this.detailBtn.onclick=()=>emitAction("detail");
    window.addEventListener("message",e=>this.onMessage(e));
    document.addEventListener("visibilitychange",()=>this.onVisibilityChange());
    window.addEventListener("pagehide",()=>this.onPageHide());
    this.bindMediaSession();
    window.addEventListener("pageshow",()=>{
      if(!this.current){
        this.shell.hidden=true;
        this.shell.classList.remove("is-active","is-mini","is-playing");
        document.body.classList.remove("player-open");
      }
    });
    const normalizeOrientation=()=>{
      const next=window.innerWidth>window.innerHeight?"landscape":"portrait";
      if(next===this.viewportOrientation)return;
      this.viewportOrientation=next;
      window.setTimeout(()=>{
        if(!this.current||this.shell.hidden||this.shell.classList.contains("is-mini"))return;
        this.shell.scrollTop=0;
        this.syncVisualMode();
        this.syncTimeline();
      },90);
    };
    window.addEventListener("resize",normalizeOrientation,{passive:true});
    window.addEventListener("orientationchange",normalizeOrientation,{passive:true});
    this.timelineTimer=setInterval(()=>this.syncTimeline(),750);
    this.syncControls();
    this.setVisualMode(this.visualMode,false);
    this.setTab("related");
  }
  esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
  mediaKey(media){return media&&media.provider&&media.id?media.provider+":"+media.id:""}
  candidates(track){
    const seen=new Set(),out=[];
    for(const media of [track?.media,...(track?.mediaCandidates||[])]){
      const key=this.mediaKey(media);
      if(!media||!srcFor(media)||!key||seen.has(key)||this.badMedia.has(key))continue;
      seen.add(key);out.push(media);
    }
    return out.sort((a,b)=>this.fallbackPriority(a.provider)-this.fallbackPriority(b.provider));
  }
  fallbackPriority(provider,failedProvider=""){
    let order;
    if(failedProvider==="youtube"){
      order=["bandcamp","soundcloud","niconico","bilibili","piapro","touhoudb","youtube"];
    }else if(this.visualMode!=="video"){
      order=["bandcamp","soundcloud","niconico","bilibili","youtube","piapro","touhoudb"];
    }else{
      order=["youtube","niconico","bilibili","soundcloud","bandcamp","piapro","touhoudb"];
    }
    const i=order.indexOf(provider);
    return i<0?999:i;
  }
  mergeMediaCandidates(track,rows=[]){
    if(!track)return[];
    const seen=new Set(),out=[];
    for(const media of [...(track.mediaCandidates||[]),...(rows||[])]){
      const key=this.mediaKey(media);
      if(!media||!key||seen.has(key))continue;
      seen.add(key);out.push(media);
    }
    track.mediaCandidates=out;
    return out;
  }
  playable(track){return !track?.mediaUnavailable&&this.candidates(track).length>0}
  selectPlayableMedia(track){
    const media=this.candidates(track)[0]||null;
    if(track)track.media=media;
    return media;
  }
  play(track,queue){
    if(!track||!this.selectPlayableMedia(track))return false;
    if(this.youtubeMode==="youtube"&&track.media?.provider==="youtube"){
      return this.openYoutubePremium(track);
    }
    const q=(queue||[]).filter(x=>this.playable(x));
    this.queue=q.length?q:[track];
    this.index=Math.max(0,this.queue.findIndex(x=>x.id===track.id));
    this.current=this.queue[this.index]||track;this.playing=true;
    this.renderCurrent(true);
    this.expand();
    return true;
  }
  setYoutubeMode(mode){
    this.youtubeMode=mode==="youtube"?"youtube":"inline";
    try{localStorage.setItem(PLAYBACK_MODE_KEY,this.youtubeMode)}catch(_){}
    return this.youtubeMode;
  }
  getYoutubeMode(){return this.youtubeMode}
  openYoutubePremium(track){
    const media=track?.media?.provider==="youtube"?track.media:this.candidates(track).find(x=>x.provider==="youtube"&&x.id);
    if(!media?.id)return false;
    const url="https://www.youtube.com/watch?v="+encodeURIComponent(media.id);
    try{
      const w=window.open(url,"_blank","noopener,noreferrer");
      if(!w)window.location.href=url;
    }catch(_){window.location.href=url}
    return true;
  }
  setQueue(queue,currentId){
    if(!this.current)return false;
    const current=this.current;
    const rows=(queue||[]).filter(x=>this.playable(x));
    let index=rows.findIndex(x=>x.id===currentId||x.id===current.id);
    if(index<0){rows.unshift(current);index=0}
    else rows[index]={...rows[index],...current,mediaCandidates:current.mediaCandidates||rows[index].mediaCandidates};
    this.queue=rows.length?rows:[current];
    this.index=index;
    this.current=this.queue[this.index];
    this.syncControls();this.syncMeta();this.syncStationDisplay();this.renderRelated();
    return true;
  }
  renderCurrent(autoplay=true){
    if(!this.current)return;
    this.selectPlayableMedia(this.current);
    this.destroySurface();
    const provider=this.current.media?.provider||"video";
    this.title.textContent=this.current.title;
    this.type.textContent=provider.toUpperCase()+" · TOUHOUDIVE WATCH";
    this.source.href=this.current.media?.url||this.current.source?.url||"#";
    this.source.hidden=this.source.href.endsWith("#");
    this.shell.classList.add("is-active");
    this.shell.hidden=false;
    this.rankDetailKey="";if(this.rankDetailEl){this.rankDetailEl.hidden=true;this.rankDetailEl.innerHTML=""}this.syncMeta();this.syncArtwork();this.syncStationDisplay();this.syncVisualMode();this.syncControls();this.syncMediaSession();this.renderRankings();this.renderPanels();
    window.dispatchEvent(new CustomEvent("touhoudive:player-track",{detail:{trackId:this.current.id,touhoudbId:this.current.touhoudbId||null}}));
    if(provider==="youtube"){
      const expectedTrack=this.current.id,expectedVideo=this.current.media.id;
      const mount=document.createElement("div");mount.id="tdYoutubeMount-"+Date.now();this.video.appendChild(mount);
      ensureYoutubeApi().then(YT=>{
        if(!this.current||this.current.id!==expectedTrack||this.current.media?.id!==expectedVideo||!mount.isConnected)return;
        this.yt=new YT.Player(mount,{
          videoId:this.current.media.id,
          playerVars:{autoplay:autoplay?1:0,playsinline:1,rel:0,modestbranding:1},
          events:{
            onReady:e=>{
              try{
                const iframe=e.target.getIframe?.();
                if(iframe){
                  iframe.setAttribute("allow","autoplay; encrypted-media; picture-in-picture; fullscreen");
                  iframe.setAttribute("allowfullscreen","");
                }
              }catch(_){}
              try{
                const levels=e.target.getAvailableQualityLevels?.()||[];
                const preferred=["highres","hd2160","hd1440","hd1080","hd720","large"].find(q=>levels.includes(q));
                if(preferred)e.target.setPlaybackQuality?.(preferred);
              }catch(_){}
              if(autoplay)try{e.target.playVideo()}catch(_){}
              this.syncPipAvailability();this.syncTimeline();
            },
            onStateChange:e=>{
              if(!window.YT)return;
              if(e.data===YT.PlayerState.PLAYING){
                this.playing=true;
                try{
                  const levels=e.target.getAvailableQualityLevels?.()||[];
                  const preferred=["highres","hd2160","hd1440","hd1080","hd720","large"].find(q=>levels.includes(q));
                  if(preferred)e.target.setPlaybackQuality?.(preferred);
                }catch(_){}
                this.syncControls();this.setPlaybackState("playing")
              }
              else if(e.data===YT.PlayerState.PAUSED){this.playing=false;this.syncControls();this.setPlaybackState("paused")}
              else if(e.data===YT.PlayerState.ENDED){this.playing=false;this.syncControls();this.setPlaybackState("none");if(this.autoNext)this.relative(1,true)}
            },
            onError:e=>this.handleMediaError(Number(e?.data)||0)
          }
        });
      }).catch(()=>this.renderIframeFallback());
    }else{
      this.renderIframeFallback();
    }
  }
  youtubeThumbId(track){
    const direct=this.candidates(track).find(x=>x.provider==="youtube"&&x.id)?.id;
    if(direct)return String(direct);
    const thumb=String(track?.thumb||"");
    const m=thumb.match(/i\.ytimg\.com\/vi\/([^/]+)\//i);
    if(!m)return"";
    const id=decodeURIComponent(m[1]);
    return this.badMedia.has("youtube:"+id)?"":id;
  }
  thumbCandidates(track){
    const out=[],seen=new Set(),push=url=>{
      url=String(url||"").trim();if(!url||seen.has(url))return;seen.add(url);out.push(url);
    };
    const id=this.youtubeThumbId(track);
    if(id){
      const base="https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/";
      push(base+"maxresdefault.jpg");
      push(base+"sddefault.jpg");
      push(base+"hqdefault.jpg");
      push(base+"mqdefault.jpg");
    }
    const raw=String(track?.thumb||"");
    const rm=raw.match(/i\.ytimg\.com\/vi\/([^/]+)\//i);
    const rawBad=rm&&this.badMedia.has("youtube:"+decodeURIComponent(rm[1]));
    if(raw&&!rawBad&&!/i\.ytimg\.com\/vi\/[^/]+\/(?:maxresdefault|sddefault|hqdefault|mqdefault)\.jpg/i.test(raw))push(raw);
    else if(raw&&!rawBad)push(raw);
    return out;
  }
  thumbFor(track){
    const key=String(track?.id||this.youtubeThumbId(track)||"");
    return this.artworkCache.get(key)||this.thumbCandidates(track)[0]||"";
  }
  loadImageMeta(url){
    return new Promise(resolve=>{
      const img=new Image();
      img.decoding="async";img.referrerPolicy="no-referrer";
      const timer=setTimeout(()=>{img.src="";resolve(null)},6500);
      img.onload=()=>{clearTimeout(timer);resolve({url,width:img.naturalWidth||0,height:img.naturalHeight||0})};
      img.onerror=()=>{clearTimeout(timer);resolve(null)};
      img.src=url;
    });
  }
  async resolveArtwork(track){
    const key=String(track?.id||this.youtubeThumbId(track)||"");
    if(key&&this.artworkCache.has(key))return this.artworkCache.get(key);
    const candidates=this.thumbCandidates(track);
    let fallback="";
    for(const url of candidates){
      const meta=await this.loadImageMeta(url);
      if(!meta||meta.width<200||meta.height<120)continue;
      if(!fallback)fallback=url;
      // Prefer genuinely useful large artwork. maxres is normally 1280×720,
      // sddefault 640×480, hqdefault 480×360.
      if(meta.width>=600||meta.height>=480){if(key)this.artworkCache.set(key,url);return url}
    }
    if(key&&fallback)this.artworkCache.set(key,fallback);
    return fallback;
  }
  applyArtwork(url){
    const safe=String(url||"").replace(/"/g,"%22");
    const targets=[this.artwork,this.miniArt];
    for(const el of targets){
      if(!el)continue;
      el.style.backgroundImage=safe?'url("'+safe+'")':"";
      el.style.setProperty("--art-url",safe?'url("'+safe+'")':"none");
      el.classList.toggle("has-art",!!safe);
    }
    if(this.ambient){
      this.ambient.style.backgroundImage=safe?'url("'+safe+'")':"";
      this.ambient.classList.toggle("has-art",!!safe);
    }
  }
  syncArtwork(){
    if(!this.current)return;
    const seq=++this.artworkSeq,track=this.current;
    const immediate=String(track?.thumb||"");
    if(immediate)this.applyArtwork(immediate);
    this.resolveArtwork(track).then(url=>{
      if(seq!==this.artworkSeq||!this.current||this.current.id!==track.id)return;
      if(url)this.applyArtwork(url);
    }).catch(()=>{});
  }
  canVideoVisual(){
    return this.candidates(this.current).some(m=>["youtube","niconico","bilibili"].includes(m?.provider));
  }
  setVisualMode(mode,persist=true){
    const next=mode==="video"&&this.canVideoVisual()?"video":"song";
    this.visualMode=next;
    if(persist)try{localStorage.setItem(VISUAL_MODE_KEY,this.visualMode)}catch(_){}
    if(this.current){
      const preferred=this.candidates(this.current)[0]||null;
      if(preferred&&this.mediaKey(preferred)!==this.mediaKey(this.current.media)){
        this.current.media=preferred;
        this.renderCurrent(true);
        return;
      }
    }
    this.syncVisualMode();
  }
  syncVisualMode(){
    const canVideo=this.canVideoVisual();
    if(this.visualMode==="video"&&!canVideo)this.visualMode="song";
    this.shell.classList.toggle("player-video-mode",this.visualMode==="video");
    this.shell.classList.toggle("player-song-mode",this.visualMode!=="video");
    if(this.songModeBtn){
      const on=this.visualMode!=="video";this.songModeBtn.classList.toggle("is-active",on);this.songModeBtn.setAttribute("aria-selected",on?"true":"false");
    }
    if(this.videoModeBtn){
      const on=this.visualMode==="video";this.videoModeBtn.disabled=!canVideo;this.videoModeBtn.classList.toggle("is-active",on);this.videoModeBtn.setAttribute("aria-selected",on?"true":"false");
    }
  }
  formatTime(sec){
    sec=Math.max(0,Math.floor(Number(sec)||0));
    const m=Math.floor(sec/60),s=sec%60;return m+":"+String(s).padStart(2,"0");
  }
  syncTimeline(){
    if(!this.seek||!this.elapsed||!this.duration)return;
    let now=0,total=0,ok=false;
    if(this.yt&&this.current?.media?.provider==="youtube"){
      try{now=Number(this.yt.getCurrentTime?.())||0;total=Number(this.yt.getDuration?.())||0;ok=total>0}catch(_){}
    }
    this.seek.disabled=!ok;
    if(ok){
      this.seek.value=String(Math.max(0,Math.min(1000,Math.round(now/total*1000))));
      this.elapsed.textContent=this.formatTime(now);this.duration.textContent=this.formatTime(total);
    }else{
      this.seek.value="0";this.elapsed.textContent="--:--";this.duration.textContent="--:--";
    }
  }
  setFavoriteState(on){
    if(this.favoriteBtn)this.favoriteBtn.textContent=on?"♥ 보관됨":"♡ 보관";
  }
  syncStationDisplay(){
    if(!this.current)return;
    const art=this.thumbFor(this.current);
    if(this.stationArt){
      this.stationArt.style.backgroundImage=art?'url("'+String(art).replace(/"/g,'%22')+'")':"";
      this.stationArt.classList.toggle("has-art",!!art);
    }
    if(this.stationTitle)this.stationTitle.textContent=this.current.title||"TouhouDive";
    if(this.stationArtist)this.stationArtist.textContent=this.current.circle||this.current.artistString||this.current.work||"ZUN / Touhou";
    if(this.stationAlbum)this.stationAlbum.textContent=this.current.album||this.current.work||this.current.role||"TOUHOU STATION";
    if(this.stationSource)this.stationSource.textContent=(this.current.media?.provider||"stream").toUpperCase();
    if(this.stationQueue)this.stationQueue.textContent="QUEUE "+(this.index>=0?String(this.index+1).padStart(2,"0"):"--")+"/"+(this.queue.length?String(this.queue.length).padStart(2,"0"):"--");
  }
  setTab(tab){
    this.activeTab=["lyrics","info"].includes(tab)?tab:"related";
    if(this.relatedEl){const show=this.activeTab==="related";this.relatedEl.hidden=!show;this.relatedEl.style.display=show?"grid":"none"}
    if(this.lyricsEl){const show=this.activeTab==="lyrics";this.lyricsEl.hidden=!show;this.lyricsEl.style.display=show?"block":"none"}
    if(this.infoEl){const show=this.activeTab==="info";this.infoEl.hidden=!show;this.infoEl.style.display=show?"grid":"none"}
    if(this.relatedTab){this.relatedTab.classList.toggle("is-active",this.activeTab==="related");this.relatedTab.setAttribute("aria-selected",this.activeTab==="related"?"true":"false")}
    if(this.lyricsTab){this.lyricsTab.classList.toggle("is-active",this.activeTab==="lyrics");this.lyricsTab.setAttribute("aria-selected",this.activeTab==="lyrics"?"true":"false")}
    if(this.infoTab){this.infoTab.classList.toggle("is-active",this.activeTab==="info");this.infoTab.setAttribute("aria-selected",this.activeTab==="info"?"true":"false")}
  }
  updateCurrentData(track){
    if(!track||!this.current||track.id!==this.current.id)return false;
    this.current={...this.current,...track};
    if(this.index>=0&&this.index<this.queue.length)this.queue[this.index]=this.current;
    this.syncMeta();this.syncArtwork();this.syncStationDisplay();this.syncVisualMode();this.syncMediaSession();this.renderRankings();this.renderLyrics();this.renderInfo();
    return true;
  }
  renderRankings(){
    if(!this.rankEl||!this.current)return;
    const meta=this.current._playerRanks||{};
    const rows=[];
    const push=(key,row,accent=false)=>{
      if(!row?.value)return;
      const sig=(row.label||"")+"|"+row.value;
      if(rows.some(x=>x.sig===sig))return;
      rows.push({sig,key,row,accent});
    };
    push("active",meta.active,true);
    push("overall",meta.overall,false);
    push("popularity",meta.popularity,false);
    push("influence",meta.influence,false);
    push("views",meta.views,false);
    this.rankEl.innerHTML=rows.map(({key,row,accent})=>{
      const detail=!!row.detail;
      return '<button type="button" class="player-rank-card '+(accent?"is-current ":"")+(detail?"has-detail":"")+'" data-rank-key="'+this.esc(key)+'" '+(detail?'aria-expanded="'+(this.rankDetailKey===key?"true":"false")+'"':"")+'>'+
        '<span>'+this.esc(row.label||"순위")+'</span>'+
        '<strong>'+this.esc(row.value)+'</strong>'+
        (row.sub?'<small>'+this.esc(row.sub)+'</small>':"")+
        (detail?'<em>근거 보기 ▾</em>':"")+
      '</button>';
    }).join("");
    this.rankEl.querySelectorAll("[data-rank-key]").forEach(btn=>{
      const row=meta[btn.dataset.rankKey];
      if(row?.detail)btn.onclick=()=>this.toggleRankDetail(btn.dataset.rankKey);
    });
    if(this.rankDetailKey)this.renderRankDetail(this.rankDetailKey);
  }
  toggleRankDetail(key){
    if(!this.rankDetailEl||!this.current)return;
    if(this.rankDetailKey===key){
      this.rankDetailKey="";
      this.rankDetailEl.hidden=true;
      this.rankDetailEl.innerHTML="";
      this.renderRankings();
      return;
    }
    this.rankDetailKey=key;
    this.renderRankings();
  }
  renderRankDetail(key){
    if(!this.rankDetailEl||!this.current)return;
    const detail=this.current._playerRanks?.[key]?.detail;
    if(!detail){
      this.rankDetailEl.hidden=true;
      this.rankDetailEl.innerHTML="";
      return;
    }
    const components=(detail.components||[]).map(x=>
      '<div class="rank-evidence-component"><span>'+this.esc(x.label)+'</span><strong>'+(x.value!=null?this.esc(x.value):Number(x.points||0).toFixed(2)+'pt')+'</strong><small>'+this.esc(x.description||"")+'</small></div>'
    ).join("");
    const metrics=(detail.metrics||[]).map(x=>
      '<div class="rank-evidence-row"><span>'+this.esc(x.label)+'</span><b>'+this.esc(x.raw||"")+'</b><small>'+this.esc(x.rule||"")+'</small>'+(x.points==null?'<strong class="is-data">DATA</strong>':'<strong>+'+Number(x.points||0).toFixed(2)+'pt</strong>')+'</div>'
    ).join("");
    this.rankDetailEl.hidden=false;
    this.rankDetailEl.innerHTML=
      '<div class="rank-evidence-head"><div><span>RANK EVIDENCE</span><strong>'+this.esc(detail.title||"순위 산정 근거")+'</strong></div><button type="button" data-rank-close aria-label="닫기">×</button></div>'+
      '<div class="rank-evidence-formula"><b>'+this.esc(detail.formula||"")+'</b><strong>'+Number(detail.score||0).toFixed(2)+'pt</strong></div>'+
      '<div class="rank-evidence-source"><span>'+this.esc(detail.source?.label||"")+'</span><strong>'+this.esc(detail.source?.text||"")+'</strong></div>'+
      '<div class="rank-evidence-components">'+components+'</div>'+
      '<div class="rank-evidence-table">'+metrics+'</div>'+
      (detail.note?'<p class="rank-evidence-note">'+this.esc(detail.note)+'</p>':"");
    const close=this.rankDetailEl.querySelector("[data-rank-close]");
    if(close)close.onclick=()=>this.toggleRankDetail(key);
  }
  renderPanels(){
    this.renderRelated();
    this.renderLyrics();
    this.renderInfo();
    this.setTab(this.activeTab);
  }
  renderRelated(){
    if(!this.relatedEl)return;
    if(!this.queue.length){this.relatedEl.innerHTML='<div class="player-panel-empty">연관곡을 불러오지 못했습니다.</div>';return}
    const order=[];
    for(let i=this.index+1;i<this.queue.length;i++)order.push(i);
    for(let i=0;i<this.index;i++)order.push(i);
    const rows=order.filter(i=>this.playable(this.queue[i])).slice(0,24).map(i=>{
      const t=this.queue[i],thumb=this.thumbFor(t);
      const by=t.type==="arrangement"?(t.circle||t.artistString||"Arrangement"):(t.work||t.artistString||"Original");
      return '<button class="player-related-item" data-player-index="'+i+'">'+
        '<span class="player-related-thumb '+(thumb?"":"no-image")+'"'+(thumb?' style="background-image:url(&quot;'+this.esc(thumb)+'&quot;)"':"")+'><b>▶</b></span>'+
        '<span class="player-related-copy"><strong>'+this.esc(t.title)+'</strong><small>'+this.esc(by)+'</small><em>'+(i===this.index+1?"다음 재생":"연관곡")+'</em></span>'+
      '</button>';
    });
    this.relatedEl.innerHTML=rows.length?rows.join(""):'<div class="player-panel-empty">재생 가능한 연관곡이 없습니다.</div>';
    this.relatedEl.querySelectorAll("[data-player-index]").forEach(btn=>{
      const i=Number(btn.dataset.playerIndex);btn.onclick=()=>this.jumpTo(i);
      const thumbEl=btn.querySelector(".player-related-thumb"),track=this.queue[i];
      if(thumbEl&&track)this.resolveArtwork(track).then(url=>{
        if(!url)return;
        thumbEl.style.backgroundImage='url("'+String(url).replace(/"/g,"%22")+'")';
        thumbEl.classList.remove("no-image");thumbEl.classList.add("has-art");
      }).catch(()=>{});
    });
  }
  renderInfo(){
    if(!this.infoEl||!this.current)return;
    const t=this.current,providers=[...new Set((t.mediaCandidates||[]).map(x=>x?.provider).filter(Boolean))];
    const by=t.circle||t.artistString||((t.artists?.composer||[]).join(", "))||"정보 없음";
    const rows=[
      ["아티스트 / 서클",by],
      ["앨범 / 작품",t.album||t.work||"정보 없음"],
      ["분류",t.role||t.category||t.type||"정보 없음"],
      ["연도",t.year||"정보 없음"],
      ["재생 소스",providers.length?providers.join(" · "):(t.media?.provider||"정보 없음")],
      ["TouhouDB",t.touhoudbId?"#"+t.touhoudbId:"미연결"]
    ];
    this.infoEl.innerHTML='<div class="player-info-grid">'+rows.map(([k,v])=>'<div><span>'+this.esc(k)+'</span><strong>'+this.esc(v)+'</strong></div>').join("")+'</div>';
  }
  renderLyrics(){
    if(!this.lyricsEl||!this.current)return;
    const rows=Array.isArray(this.current.lyrics)?this.current.lyrics:[];
    const best=rows.find(x=>/original/i.test(x?.translationType||""))||rows.find(x=>(x?.cultureCodes||[]).some(c=>/^ja/i.test(c)))||rows[0]||null;
    const sourceUrl=(best?.source&&/^https?:\/\//i.test(best.source)?best.source:"")||this.current.lyricsSource||(this.current.touhoudbId?"https://touhoudb.com/S/"+this.current.touhoudbId+"/lyrics":"");
    if(best?.text){
      this.lyricsEl.innerHTML='<div class="lyrics-head"><strong>가사</strong><small>TouhouDB 곡 항목에서 불러옴</small></div>'+
        '<div class="lyrics-text">'+this.esc(best.text).replace(/\r?\n/g,"<br>")+'</div>'+
        (sourceUrl?'<a class="lyrics-source" href="'+this.esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer">가사 출처 열기 ↗</a>':"");
      return;
    }
    if(this.current.lyricsLoaded){
      this.lyricsEl.innerHTML='<div class="player-panel-empty"><strong>이 TouhouDB 항목에는 가사 본문이 등록되어 있지 않습니다.</strong><span>영상과 곡 항목 연결은 확인됐지만 가사 텍스트가 비어 있습니다.</span>'+
        (sourceUrl?'<a class="lyrics-source" href="'+this.esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer">TouhouDB 곡 페이지 열기 ↗</a>':"")+'</div>';
      return;
    }
    this.lyricsEl.innerHTML='<div class="player-panel-empty"><strong>가사 정보를 불러오지 못했습니다.</strong><span>영상 ID 또는 곡명으로 TouhouDB 연결을 다시 시도한 뒤 표시합니다.</span>'+
      (sourceUrl?'<a class="lyrics-source" href="'+this.esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer">곡 페이지 열기 ↗</a>':"")+'</div>';
  }
  jumpTo(index){
    if(!Number.isInteger(index)||index<0||index>=this.queue.length||index===this.index)return false;
    const mini=this.shell.classList.contains("is-mini");
    this.index=index;this.current=this.queue[index];this.playing=true;
    this.renderCurrent(true);
    if(mini)this.minimize();else this.expand();
    return true;
  }
  persistBadMedia(){
    try{localStorage.setItem(BAD_MEDIA_KEY,JSON.stringify([...this.badMedia].slice(-300)))}catch(_){}
  }
  async recoverAlternativeMedia(code=0,failedMedia=null){
    if(!this.current)return false;
    const trackId=this.current.id;
    const failedKey=this.mediaKey(failedMedia);
    const failedProvider=failedMedia?.provider||"";
    if(this.current.touhoudbId&&window.TouhouCatalog?.hydrate){
      try{
        const hydrated=await window.TouhouCatalog.hydrate(this.current.touhoudbId);
        if(!this.current||this.current.id!==trackId)return false;
        if(hydrated){
          this.mergeMediaCandidates(this.current,hydrated.mediaCandidates||[]);
          if(!this.current.thumb&&hydrated.thumb)this.current.thumb=hydrated.thumb;
          if(!this.current.source&&hydrated.source)this.current.source=hydrated.source;
        }
      }catch(e){console.warn("TouhouDive alternate source refresh failed",e)}
    }
    if(!this.current||this.current.id!==trackId)return false;
    const choices=this.candidates(this.current)
      .filter(x=>this.mediaKey(x)!==failedKey)
      .sort((a,b)=>this.fallbackPriority(a.provider,failedProvider)-this.fallbackPriority(b.provider,failedProvider));
    const next=choices[0]||null;
    if(next){
      this.current.media=next;
      this.current.mediaUnavailable=false;
      this.current.mediaFallback={from:failedProvider||"unknown",to:next.provider||"unknown",code};
      window.dispatchEvent(new CustomEvent("touhoudive:media-fallback",{detail:{
        trackId:this.current.id,
        from:failedProvider||null,
        to:next.provider||null,
        code
      }}));
      this.renderCurrent(true);
      return true;
    }
    this.current.media=null;this.current.mediaUnavailable=true;
    window.dispatchEvent(new CustomEvent("touhoudive:media-unavailable",{detail:{trackId:this.current.id,code}}));
    this.destroySurface();
    this.video.innerHTML='<div class="player-unavailable"><strong>이 곡의 재생 가능한 영상을 찾지 못했습니다.</strong><span>YouTube 비공개·삭제·지역/임베드 제한 영상은 제외하고 NicoNico 등 다른 등록 소스까지 확인했습니다.</span></div>';
    this.setPlaybackState("none");
    if(this.autoNext)setTimeout(()=>this.relative(1,true),650);
    return false;
  }
  handleMediaError(code=0){
    this.playing=false;this.syncControls();
    const media=this.current?.media,key=this.mediaKey(media);
    if(key&&(code===100||code===101||code===150||code===2||code===5)){this.badMedia.add(key);this.persistBadMedia()}
    void this.recoverAlternativeMedia(code,media);
  }
  renderIframeFallback(){
    if(!this.current)return;
    const src=embedSrc(this.current.media);if(!src)return;
    this.video.innerHTML="";
    const f=document.createElement("iframe");this.frame=f;
    f.src=src;f.title=this.current.title;
    f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.setAttribute("allowfullscreen","");f.referrerPolicy="strict-origin-when-cross-origin";
    this.video.appendChild(f);
    this.syncPipAvailability();
  }
  async requestPip(){
    if(!this.current)return false;
    try{
      if(document.pictureInPictureElement){
        await document.exitPictureInPicture();
        return true;
      }
    }catch(_){}
    const nativeVideo=this.video.querySelector("video");
    if(nativeVideo?.requestPictureInPicture){
      try{
        await nativeVideo.requestPictureInPicture();
        return true;
      }catch(_){}
    }
    if("documentPictureInPicture" in window&&window.documentPictureInPicture?.requestWindow){
      try{
        if(this.pipWindow&&!this.pipWindow.closed){this.pipWindow.focus();return true}
        const pip=await window.documentPictureInPicture.requestWindow({width:420,height:300});
        this.pipWindow=pip;
        const doc=pip.document;
        doc.title=this.current.title+" · TouhouDive";
        const style=doc.createElement("style");
        style.textContent="*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#080b12;color:#fff;font-family:system-ui,sans-serif}body{display:grid;grid-template-rows:1fr auto}.pip-video{min-height:0;background:#000;display:grid;place-items:center;overflow:hidden}.pip-video iframe,.pip-video>div{width:100%!important;height:100%!important;border:0}.pip-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;background:#101522}.pip-copy{min-width:0}.pip-copy strong,.pip-copy small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pip-copy strong{font-size:13px}.pip-copy small{margin-top:2px;color:#aab4c6;font-size:10px}.pip-actions{display:flex;gap:6px}.pip-actions button{width:36px;height:36px;border:0;border-radius:10px;background:#20283a;color:#fff;font-size:16px}";
        doc.head.appendChild(style);
        const videoHost=doc.createElement("div");videoHost.className="pip-video";
        const bar=doc.createElement("div");bar.className="pip-bar";
        bar.innerHTML='<div class="pip-copy"><strong></strong><small>TouhouDive · 백그라운드 재생</small></div><div class="pip-actions"><button data-prev>‹</button><button data-play>❚❚</button><button data-next>›</button></div>';
        bar.querySelector("strong").textContent=this.current.title;
        doc.body.append(videoHost,bar);
        this.pipHome={parent:this.video.parentNode,next:this.video.nextSibling};
        videoHost.appendChild(this.video);
        bar.querySelector("[data-prev]").onclick=()=>this.relative(-1);
        bar.querySelector("[data-play]").onclick=()=>this.togglePlayback();
        bar.querySelector("[data-next]").onclick=()=>this.relative(1);
        const sync=()=>{
          const btn=bar.querySelector("[data-play]");if(btn)btn.textContent=this.playing?"❚❚":"▶";
          const title=bar.querySelector("strong");if(title&&this.current)title.textContent=this.current.title;
        };
        this._pipSync=sync;sync();
        pip.addEventListener("pagehide",()=>this.restoreFromDocumentPip(),{once:true});
        return true;
      }catch(e){
        console.warn("Document PiP unavailable",e);
      }
    }
    // Cross-origin iframe players (notably YouTube) cannot be forced into
    // native PiP by the parent page. Keep the in-app mini player and make
    // the iframe eligible for browser/player PiP controls instead.
    this.minimize();
    this.flashPipHint();
    return false;
  }
  restoreFromDocumentPip(){
    if(this.pipHome&&this.video){
      try{
        const {parent,next}=this.pipHome;
        if(parent){
          if(next&&next.parentNode===parent)parent.insertBefore(this.video,next);
          else parent.appendChild(this.video);
        }
      }catch(_){}
    }
    this.pipHome=null;this.pipWindow=null;this._pipSync=null;
    this.syncPipAvailability();
  }
  flashPipHint(){
    try{
      window.dispatchEvent(new CustomEvent("touhoudive:pip-hint",{detail:{
        message:"이 영상은 브라우저가 허용하는 경우 플레이어의 PiP 기능을 사용할 수 있습니다. 앱 안에서는 미니플레이어로 계속 재생합니다."
      }}));
    }catch(_){}
  }
  syncPipAvailability(){
    if(!this.pipBtn)return;
    const native=!!this.video.querySelector("video")&&!!document.pictureInPictureEnabled;
    const docPip=!!window.documentPictureInPicture?.requestWindow;
    const iframe=!!this.current?.media&&["youtube","niconico","soundcloud","bilibili","bandcamp"].includes(this.current.media.provider);
    this.pipBtn.disabled=!(native||docPip||iframe);
    this.pipBtn.title=docPip||native?"화면 밖 작은 창(PiP)":"브라우저/플레이어 PiP 사용";
  }
  onVisibilityChange(){
    if(!this.current)return;
    this.backgroundActive=document.visibilityState==="hidden";
    if(this.backgroundActive){
      this.syncMediaSession();
      this.setPlaybackState(this.playing?"playing":"paused");
    }else{
      this.backgroundActive=false;
      this._pipSync?.();
      this.syncControls();
    }
  }
  onPageHide(){
    if(!this.current)return;
    this.syncMediaSession();
    this.setPlaybackState(this.playing?"playing":"paused");
  }
  destroySurface(){
    if(this.yt){try{this.yt.destroy()}catch(_){} this.yt=null}
    if(this.frame){try{this.frame.src="about:blank";this.frame.remove()}catch(_){} this.frame=null}
    this.video.innerHTML="";
  }
  onMessage(e){
    if(!this.current||this.current.media?.provider!=="niconico"||e.origin!==NICO_ORIGIN||!this.frame||e.source!==this.frame.contentWindow)return;
    const msg=e.data||{};if(msg.playerId!==PLAYER_ID)return;
    const eventName=String(msg.eventName||"");
    const errorCode=Number(msg?.data?.errorCode||msg?.data?.code)||0;
    if(/error|fail/i.test(eventName)||errorCode){
      const media=this.current.media,key=this.mediaKey(media);
      if(key){this.badMedia.add(key);this.persistBadMedia()}
      void this.recoverAlternativeMedia(errorCode||900,media);
      return;
    }
    const st=Number(msg?.data?.playerStatus)||0;
    if(eventName==="playerStatusChange"){
      if(st===2){this.playing=true;this.setPlaybackState("playing")}
      else if(st===3){this.playing=false;this.setPlaybackState("paused")}
      else if(st===4){this.playing=false;this.setPlaybackState("none");if(this.autoNext)this.relative(1,true)}
      this.syncControls();
    }
  }
  sendNico(eventName,data={}){
    if(!this.frame?.contentWindow)return;
    try{this.frame.contentWindow.postMessage({sourceConnectorType:1,playerId:PLAYER_ID,eventName,data},NICO_ORIGIN)}catch(_){}
  }
  togglePlayback(){
    if(!this.current)return;
    if(this.current.media?.provider==="youtube"&&this.yt){
      try{
        const st=this.yt.getPlayerState();
        if(window.YT&&st===YT.PlayerState.PLAYING){this.yt.pauseVideo();this.playing=false}
        else{this.yt.playVideo();this.playing=true}
      }catch(_){}
    }else if(this.current.media?.provider==="niconico"){
      this.sendNico(this.playing?"pause":"play");this.playing=!this.playing;
    }
    this.syncControls();this.setPlaybackState(this.playing?"playing":"paused");this._pipSync?.();
  }
  relative(dir,fromEnded=false){
    if(!this.queue.length)return false;
    const next=this.index+dir;if(next<0||next>=this.queue.length)return false;
    const mini=this.shell.classList.contains("is-mini");
    this.index=next;this.current=this.queue[next];this.playing=true;
    this.renderCurrent(true);
    this._pipSync?.();
    if(mini)this.minimize();else if(!fromEnded)this.expand();
    return true;
  }
  minimize(){
    if(!this.current){this.close();return}
    this.shell.classList.add("is-active","is-mini");
    document.body.classList.remove("player-open");
    document.getElementById("playerExpand").hidden=false;
    this.syncMeta();
  }
  expand(){
    if(!this.current){this.close();return}
    this.shell.classList.add("is-active");
    this.shell.classList.remove("is-mini");
    document.body.classList.add("player-open");
    document.getElementById("playerExpand").hidden=true;
    this.shell.hidden=false;
    this.syncMeta();this.renderPanels();
  }
  routeChange(){if(this.current&&!this.shell.hidden)this.minimize()}
  setAutoNext(on){
    this.autoNext=!!on;localStorage.setItem(AUTO_KEY,this.autoNext?"1":"0");this.syncControls();this.syncMeta();
  }
  syncControls(){
    document.getElementById("playerPrev").disabled=!(this.index>0);
    document.getElementById("playerNext").disabled=!(this.index>=0&&this.index<this.queue.length-1);
    const controllable=["youtube","niconico"].includes(this.current?.media?.provider);
    this.playBtn.disabled=!!this.current&&!controllable;
    this.playBtn.textContent=controllable?(this.playing?"❚❚":"▶"):"▶";
    this.playBtn.title=controllable?(this.playing?"일시정지":"재생"):"이 공급자는 임베드 플레이어에서 직접 조작";
    this.autoBtn.classList.toggle("active",this.autoNext);
    this.shell.classList.toggle("is-playing",!!this.current&&this.playing);
    this.autoBtn.textContent="자동재생";
    this.autoBtn.setAttribute("aria-pressed",this.autoNext?"true":"false");
    this.syncPipAvailability();
    this._pipSync?.();
  }
  syncMeta(){
    if(!this.current)return;
    if(this.originBtn)this.originBtn.hidden=this.current.type!=="arrangement";
    const base=this.current.type==="arrangement"
      ? [this.current.circle,this.current.album,this.current.year].filter(Boolean).join(" · ")
      : [this.current.work||this.current.artistString,this.current.role,this.current.year].filter(Boolean).join(" · ");
    const q=this.queue.length>1?" · "+(this.index+1)+"/"+this.queue.length:"";
    this.meta.textContent=base+q+" · 자동재생 "+(this.autoNext?"ON":"OFF");
    this.syncStationDisplay();
  }
  bindMediaSession(){
    if(!("mediaSession" in navigator))return;
    try{navigator.mediaSession.setActionHandler("play",()=>{if(!this.playing)this.togglePlayback()})}catch(_){}
    try{navigator.mediaSession.setActionHandler("pause",()=>{if(this.playing)this.togglePlayback()})}catch(_){}
    try{navigator.mediaSession.setActionHandler("nexttrack",()=>this.relative(1))}catch(_){}
    try{navigator.mediaSession.setActionHandler("previoustrack",()=>this.relative(-1))}catch(_){}
    try{navigator.mediaSession.setActionHandler("stop",()=>this.close())}catch(_){}
  }
  syncMediaSession(){
    if(!("mediaSession" in navigator)||!this.current)return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({
        title:this.current.title,
        artist:this.current.circle||this.current.artistString||"ZUN",
        album:this.current.album||this.current.work||"TouhouDive",
        artwork:this.current.thumb?[{src:this.current.thumb}]:undefined
      });
    }catch(_){}
  }
  setPlaybackState(v){try{if("mediaSession" in navigator)navigator.mediaSession.playbackState=v}catch(_){}}
  close(){
    try{if(this.pipWindow&&!this.pipWindow.closed)this.pipWindow.close()}catch(_){}
    this.restoreFromDocumentPip();
    this.destroySurface();this.current=null;this.queue=[];this.index=-1;this.playing=false;
    this.shell.classList.remove("is-playing");if(this.seek){this.seek.value="0";this.seek.disabled=true}if(this.elapsed)this.elapsed.textContent="--:--";if(this.duration)this.duration.textContent="--:--";
    this.shell.hidden=true;this.shell.classList.remove("is-active","is-mini","is-playing","player-video-mode");this.shell.classList.add("player-song-mode");document.body.classList.remove("player-open");this.setPlaybackState("none");
    try{if("mediaSession" in navigator)navigator.mediaSession.metadata=null}catch(_){}
    this.renderPanels();this.syncControls();
  }
}
window.TouhouMediaPlayer=TouhouMediaPlayer;
})();