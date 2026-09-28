(function(){
"use strict";
const NICO_ORIGIN="https://embed.nicovideo.jp";
const PLAYER_ID="touhouDivePlayer";
const AUTO_KEY="touhoudive:player:autoNext";

function clean(v){return String(v??"").trim()}
function srcFor(media){
  if(!media)return"";
  if(media.provider==="youtube"&&media.id)return "youtube:"+media.id;
  if(media.provider==="niconico"&&media.id)return NICO_ORIGIN+"/watch/"+encodeURIComponent(media.id)+"?jsapi=1&playerId="+encodeURIComponent(PLAYER_ID)+"&autoplay=1";
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
    setTimeout(()=>{if(window.YT&&window.YT.Player)resolve(window.YT)},2500);
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
    this.current=null;this.queue=[];this.index=-1;this.frame=null;this.yt=null;this.playing=true;
    this.autoNext=localStorage.getItem(AUTO_KEY)!=="0";
    document.getElementById("playerClose").onclick=()=>this.close();
    document.getElementById("playerMini").onclick=()=>this.minimize();
    document.getElementById("playerExpand").onclick=()=>this.expand();
    document.getElementById("playerPrev").onclick=()=>this.relative(-1);
    document.getElementById("playerNext").onclick=()=>this.relative(1);
    this.playBtn.onclick=()=>this.togglePlayback();
    this.autoBtn.onclick=()=>this.setAutoNext(!this.autoNext);
    window.addEventListener("message",e=>this.onMessage(e));
    this.bindMediaSession();
    this.syncControls();
  }
  playable(track){return !!(track&&track.media&&srcFor(track.media))}
  play(track,queue){
    if(!this.playable(track))return false;
    const q=(queue||[]).filter(x=>this.playable(x));
    this.queue=q.length?q:[track];
    this.index=Math.max(0,this.queue.findIndex(x=>x.id===track.id));
    this.current=track;this.playing=true;
    this.renderCurrent(true);
    this.expand();
    return true;
  }
  renderCurrent(autoplay=true){
    if(!this.current)return;
    this.destroySurface();
    const provider=this.current.media?.provider||"video";
    this.title.textContent=this.current.title;
    this.type.textContent=provider.toUpperCase()+" · IN-APP PLAYER";
    this.source.href=this.current.media?.url||this.current.source?.url||"#";
    this.source.hidden=this.source.href.endsWith("#");
    this.shell.hidden=false;
    this.syncMeta();this.syncControls();this.syncMediaSession();
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
            onError:()=>{this.playing=false;this.syncControls()}
          }
        });
      }).catch(()=>this.renderIframeFallback());
    }else{
      this.renderIframeFallback();
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
    this.shell.classList.add("is-mini");document.getElementById("playerExpand").hidden=false;this.syncMeta();
  }
  expand(){
    if(!this.current)return;
    this.shell.classList.remove("is-mini");document.getElementById("playerExpand").hidden=true;this.shell.hidden=false;this.syncMeta();
  }
  routeChange(){if(this.current&&!this.shell.hidden)this.minimize()}
  setAutoNext(on){
    this.autoNext=!!on;localStorage.setItem(AUTO_KEY,this.autoNext?"1":"0");this.syncControls();this.syncMeta();
  }
  syncControls(){
    document.getElementById("playerPrev").disabled=!(this.index>0);
    document.getElementById("playerNext").disabled=!(this.index>=0&&this.index<this.queue.length-1);
    this.playBtn.textContent=this.playing?"❚❚":"▶";
    this.playBtn.title=this.playing?"일시정지":"재생";
    this.autoBtn.classList.toggle("active",this.autoNext);
    this.autoBtn.textContent=this.autoNext?"A✓":"A";
    this.autoBtn.setAttribute("aria-pressed",this.autoNext?"true":"false");
  }
  syncMeta(){
    if(!this.current)return;
    const base=this.current.type==="arrangement"
      ? [this.current.circle,this.current.album,this.current.year].filter(Boolean).join(" · ")
      : [this.current.work||this.current.artistString,this.current.role,this.current.year].filter(Boolean).join(" · ");
    const q=this.queue.length>1?" · "+(this.index+1)+"/"+this.queue.length:"";
    this.meta.textContent=base+q+" · 자동 다음곡 "+(this.autoNext?"ON":"OFF");
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
    this.shell.hidden=true;this.shell.classList.remove("is-mini");this.setPlaybackState("none");
    try{if("mediaSession" in navigator)navigator.mediaSession.metadata=null}catch(_){}
    this.syncControls();
  }
}
window.TouhouMediaPlayer=TouhouMediaPlayer;
})();