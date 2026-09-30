(function(){
"use strict";
const NICO_ORIGIN="https://embed.nicovideo.jp";
const PLAYER_ID="touhouDivePlayer";
const AUTO_KEY="touhoudive:player:autoNext";
const BAD_MEDIA_KEY="touhoudive:media:unavailable:v1";

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
    this.title=document.getElementById("playerTitle");
    this.meta=document.getElementById("playerMeta");
    this.type=document.getElementById("playerType");
    this.source=document.getElementById("playerSource");
    this.playBtn=document.getElementById("playerPlay");
    this.autoBtn=document.getElementById("playerAuto");
    this.relatedEl=document.getElementById("playerRelated");
    this.lyricsEl=document.getElementById("playerLyrics");
    this.relatedTab=document.getElementById("playerTabRelated");
    this.lyricsTab=document.getElementById("playerTabLyrics");
    this.current=null;this.queue=[];this.index=-1;this.frame=null;this.yt=null;this.playing=true;this.activeTab="related";
    this.autoNext=localStorage.getItem(AUTO_KEY)!=="0";
    try{this.badMedia=new Set(JSON.parse(localStorage.getItem(BAD_MEDIA_KEY)||"[]"))}catch(_){this.badMedia=new Set()}
    document.getElementById("playerClose").onclick=()=>this.close();
    document.getElementById("playerMini").onclick=()=>this.minimize();
    document.getElementById("playerExpand").onclick=()=>this.expand();
    document.getElementById("playerPrev").onclick=()=>this.relative(-1);
    document.getElementById("playerNext").onclick=()=>this.relative(1);
    this.playBtn.onclick=()=>this.togglePlayback();
    this.autoBtn.onclick=()=>this.setAutoNext(!this.autoNext);
    if(this.relatedTab)this.relatedTab.onclick=()=>this.setTab("related");
    if(this.lyricsTab)this.lyricsTab.onclick=()=>this.setTab("lyrics");
    window.addEventListener("message",e=>this.onMessage(e));
    this.bindMediaSession();
    this.syncControls();
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
    return out;
  }
  playable(track){return this.candidates(track).length>0}
  selectPlayableMedia(track){
    const media=this.candidates(track)[0]||null;
    if(track)track.media=media;
    return media;
  }
  play(track,queue){
    if(!track||!this.selectPlayableMedia(track))return false;
    const q=(queue||[]).filter(x=>this.playable(x));
    this.queue=q.length?q:[track];
    this.index=Math.max(0,this.queue.findIndex(x=>x.id===track.id));
    this.current=this.queue[this.index]||track;this.playing=true;
    this.renderCurrent(true);
    this.expand();
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
    this.shell.hidden=false;
    this.syncMeta();this.syncControls();this.syncMediaSession();this.renderPanels();
    if(provider==="youtube"){
      const expectedTrack=this.current.id,expectedVideo=this.current.media.id;
      const mount=document.createElement("div");mount.id="tdYoutubeMount-"+Date.now();this.video.appendChild(mount);
      ensureYoutubeApi().then(YT=>{
        if(!this.current||this.current.id!==expectedTrack||this.current.media?.id!==expectedVideo||!mount.isConnected)return;
        this.yt=new YT.Player(mount,{
          videoId:this.current.media.id,
          playerVars:{autoplay:autoplay?1:0,playsinline:1,rel:0,modestbranding:1},
          events:{
            onReady:e=>{if(autoplay)try{e.target.playVideo()}catch(_){}},
            onStateChange:e=>{
              if(!window.YT)return;
              if(e.data===YT.PlayerState.PLAYING){this.playing=true;this.syncControls();this.setPlaybackState("playing")}
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
  thumbFor(track){
    if(track?.thumb)return track.thumb;
    const m=this.candidates(track).find(x=>x.provider==="youtube"&&x.id);
    return m?"https://i.ytimg.com/vi/"+encodeURIComponent(m.id)+"/mqdefault.jpg":"";
  }
  setTab(tab){
    this.activeTab=tab==="lyrics"?"lyrics":"related";
    if(this.relatedEl)this.relatedEl.hidden=this.activeTab!=="related";
    if(this.lyricsEl)this.lyricsEl.hidden=this.activeTab!=="lyrics";
    if(this.relatedTab){this.relatedTab.classList.toggle("is-active",this.activeTab==="related");this.relatedTab.setAttribute("aria-selected",this.activeTab==="related"?"true":"false")}
    if(this.lyricsTab){this.lyricsTab.classList.toggle("is-active",this.activeTab==="lyrics");this.lyricsTab.setAttribute("aria-selected",this.activeTab==="lyrics"?"true":"false")}
  }
  renderPanels(){
    this.renderRelated();
    this.renderLyrics();
    this.setTab(this.activeTab);
  }
  renderRelated(){
    if(!this.relatedEl)return;
    if(!this.queue.length){this.relatedEl.innerHTML='<div class="player-panel-empty">연관곡을 불러오지 못했습니다.</div>';return}
    const order=[];
    for(let i=this.index+1;i<this.queue.length;i++)order.push(i);
    for(let i=0;i<this.index;i++)order.push(i);
    const rows=order.slice(0,24).map(i=>{
      const t=this.queue[i],thumb=this.thumbFor(t);
      const by=t.type==="arrangement"?(t.circle||t.artistString||"Arrangement"):(t.work||t.artistString||"Original");
      return '<button class="player-related-item" data-player-index="'+i+'">'+
        '<span class="player-related-thumb '+(thumb?"":"no-image")+'"'+(thumb?' style="background-image:url(&quot;'+this.esc(thumb)+'&quot;)"':"")+'><b>▶</b></span>'+
        '<span class="player-related-copy"><strong>'+this.esc(t.title)+'</strong><small>'+this.esc(by)+'</small><em>'+(i===this.index+1?"다음 재생":"연관곡")+'</em></span>'+
      '</button>';
    });
    this.relatedEl.innerHTML=rows.length?rows.join(""):'<div class="player-panel-empty">재생 가능한 연관곡이 없습니다.</div>';
    this.relatedEl.querySelectorAll("[data-player-index]").forEach(btn=>btn.onclick=()=>this.jumpTo(Number(btn.dataset.playerIndex)));
  }
  renderLyrics(){
    if(!this.lyricsEl||!this.current)return;
    const rows=Array.isArray(this.current.lyrics)?this.current.lyrics:[];
    const best=rows.find(x=>/original/i.test(x?.translationType||""))||rows.find(x=>(x?.cultureCodes||[]).some(c=>/^ja/i.test(c)))||rows[0]||null;
    const sourceUrl=(best?.source&&/^https?:\/\//i.test(best.source)?best.source:"")||this.current.lyricsSource||(this.current.touhoudbId?"https://touhoudb.com/S/"+this.current.touhoudbId+"/lyrics":"");
    if(best?.text){
      this.lyricsEl.innerHTML='<div class="lyrics-head"><strong>가사</strong><small>TouhouDB 제공 데이터</small></div>'+
        '<div class="lyrics-text">'+this.esc(best.text).replace(/\r?\n/g,"<br>")+'</div>'+
        (sourceUrl?'<a class="lyrics-source" href="'+this.esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer">가사 출처 열기 ↗</a>':"");
      return;
    }
    if(this.current.lyricsAvailable||sourceUrl){
      this.lyricsEl.innerHTML='<div class="player-panel-empty"><strong>가사 데이터가 있는 곡입니다.</strong><span>현재 인앱 데이터가 비어 있으면 TouhouDB 원문에서 확인할 수 있습니다.</span>'+
        (sourceUrl?'<a class="lyrics-source" href="'+this.esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer">가사 원문 열기 ↗</a>':"")+'</div>';
      return;
    }
    this.lyricsEl.innerHTML='<div class="player-panel-empty"><strong>등록된 가사가 없습니다.</strong><span>가사가 있는 곡은 이 탭에 자동으로 표시됩니다.</span></div>';
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
  handleMediaError(code=0){
    this.playing=false;this.syncControls();
    const media=this.current?.media,key=this.mediaKey(media);
    if(key&&(code===100||code===101||code===150||code===2||code===5)){this.badMedia.add(key);this.persistBadMedia()}
    if(this.current){
      const next=this.candidates(this.current)[0]||null;
      if(next&&this.mediaKey(next)!==key){this.current.media=next;this.renderCurrent(true);return}
      this.current.media=null;this.current.mediaUnavailable=true;
      window.dispatchEvent(new CustomEvent("touhoudive:media-unavailable",{detail:{trackId:this.current.id,code}}));
      this.destroySurface();
      this.video.innerHTML='<div class="player-unavailable"><strong>이 영상은 재생할 수 없습니다.</strong><span>비공개·삭제·임베드 제한 영상은 자동으로 제외합니다.</span></div>';
      this.setPlaybackState("none");
      if(this.autoNext)setTimeout(()=>this.relative(1,true),650);
    }
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
  }
  destroySurface(){
    if(this.yt){try{this.yt.destroy()}catch(_){} this.yt=null}
    if(this.frame){try{this.frame.src="about:blank";this.frame.remove()}catch(_){} this.frame=null}
    this.video.innerHTML="";
  }
  onMessage(e){
    if(!this.current||this.current.media?.provider!=="niconico"||e.origin!==NICO_ORIGIN||!this.frame||e.source!==this.frame.contentWindow)return;
    const msg=e.data||{};if(msg.playerId!==PLAYER_ID)return;
    const st=Number(msg?.data?.playerStatus)||0;
    if(msg.eventName==="playerStatusChange"){
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
    this.syncControls();this.setPlaybackState(this.playing?"playing":"paused");
  }
  relative(dir,fromEnded=false){
    if(!this.queue.length)return false;
    const next=this.index+dir;if(next<0||next>=this.queue.length)return false;
    const mini=this.shell.classList.contains("is-mini");
    this.index=next;this.current=this.queue[next];this.playing=true;
    this.renderCurrent(true);
    if(mini)this.minimize();else if(!fromEnded)this.expand();
    return true;
  }
  minimize(){
    if(!this.current)return;
    this.shell.classList.add("is-mini");
    document.body.classList.remove("player-open");
    document.getElementById("playerExpand").hidden=false;
    this.syncMeta();
  }
  expand(){
    if(!this.current)return;
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
    this.autoBtn.textContent="자동재생";
    this.autoBtn.setAttribute("aria-pressed",this.autoNext?"true":"false");
  }
  syncMeta(){
    if(!this.current)return;
    const base=this.current.type==="arrangement"
      ? [this.current.circle,this.current.album,this.current.year].filter(Boolean).join(" · ")
      : [this.current.work||this.current.artistString,this.current.role,this.current.year].filter(Boolean).join(" · ");
    const q=this.queue.length>1?" · "+(this.index+1)+"/"+this.queue.length:"";
    this.meta.textContent=base+q+" · 자동재생 "+(this.autoNext?"ON":"OFF");
  }
  bindMediaSession(){
    if(!("mediaSession" in navigator))return;
    try{navigator.mediaSession.setActionHandler("play",()=>{if(!this.playing)this.togglePlayback()})}catch(_){}
    try{navigator.mediaSession.setActionHandler("pause",()=>{if(this.playing)this.togglePlayback()})}catch(_){}
    try{navigator.mediaSession.setActionHandler("nexttrack",()=>this.relative(1))}catch(_){}
    try{navigator.mediaSession.setActionHandler("previoustrack",()=>this.relative(-1))}catch(_){}
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
    this.destroySurface();this.current=null;this.queue=[];this.index=-1;this.playing=false;
    this.shell.hidden=true;this.shell.classList.remove("is-mini");document.body.classList.remove("player-open");this.setPlaybackState("none");
    try{if("mediaSession" in navigator)navigator.mediaSession.metadata=null}catch(_){}
    this.renderPanels();this.syncControls();
  }
}
window.TouhouMediaPlayer=TouhouMediaPlayer;
})();