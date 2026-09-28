(function(){
"use strict";
function srcFor(media){
  if(!media)return"";
  if(media.provider==="youtube"){
    return "https://www.youtube-nocookie.com/embed/"+encodeURIComponent(media.id)+"?autoplay=1&playsinline=1&rel=0&enablejsapi=1";
  }
  if(media.provider==="niconico"){
    return "https://embed.nicovideo.jp/watch/"+encodeURIComponent(media.id)+"?autoplay=1&playsinline=1";
  }
  if(media.provider==="touhoudb"&&media.songId){
    return "https://touhoudb.com/Ext/EmbedSong?songId="+encodeURIComponent(media.songId)+"&lang=Default";
  }
  return media.embed||"";
}
class TouhouMediaPlayer{
  constructor(){
    this.shell=document.getElementById("playerShell");
    this.video=document.getElementById("playerVideo");
    this.title=document.getElementById("playerTitle");
    this.meta=document.getElementById("playerMeta");
    this.type=document.getElementById("playerType");
    this.current=null;this.queue=[];this.index=-1;
    document.getElementById("playerClose").onclick=()=>this.close();
    document.getElementById("playerMini").onclick=()=>this.minimize();
    document.getElementById("playerExpand").onclick=()=>this.expand();
    document.getElementById("playerPrev").onclick=()=>this.relative(-1);
    document.getElementById("playerNext").onclick=()=>this.relative(1);
  }
  playable(track){return !!(track&&track.media&&srcFor(track.media))}
  play(track,queue){
    if(!this.playable(track))return false;
    const q=(queue||[]).filter(x=>this.playable(x));
    this.queue=q.length?q:[track];
    this.index=Math.max(0,this.queue.findIndex(x=>x.id===track.id));
    this.current=track;
    this.renderFrame();
    this.expand();
    return true;
  }
  renderFrame(){
    if(!this.current)return;
    const src=srcFor(this.current.media);
    this.video.innerHTML="";
    const f=document.createElement("iframe");
    f.src=src;f.title=this.current.title;
    f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.setAttribute("allowfullscreen","");
    f.referrerPolicy="strict-origin-when-cross-origin";
    this.video.appendChild(f);
    this.title.textContent=this.current.title;
    this.meta.textContent=this.current.type==="arrangement"
      ? [this.current.circle,this.current.album,this.current.year].filter(Boolean).join(" · ")
      : [this.current.work,this.current.role,this.current.year].filter(Boolean).join(" · ");
    this.type.textContent=(this.current.media.provider||"VIDEO").toUpperCase()+" · IN-APP PLAYER";
    this.shell.hidden=false;
    try{navigator.mediaSession&&("metadata" in navigator.mediaSession)&&(navigator.mediaSession.metadata=new MediaMetadata({title:this.current.title,artist:this.current.circle||"ZUN",album:this.current.album||this.current.work||"TouhouDive"}))}catch(e){}
  }
  relative(dir){
    if(!this.queue.length)return;
    const next=this.index+dir;
    if(next<0||next>=this.queue.length)return;
    this.index=next;this.current=this.queue[next];this.renderFrame();
  }
  minimize(){if(!this.current)return;this.shell.classList.add("is-mini");document.getElementById("playerExpand").hidden=false;}
  expand(){if(!this.current)return;this.shell.classList.remove("is-mini");document.getElementById("playerExpand").hidden=true;this.shell.hidden=false;}
  close(){this.current=null;this.queue=[];this.index=-1;this.video.innerHTML="";this.shell.hidden=true;this.shell.classList.remove("is-mini");try{if(navigator.mediaSession)navigator.mediaSession.metadata=null}catch(e){}}
}
window.TouhouMediaPlayer=TouhouMediaPlayer;
})();