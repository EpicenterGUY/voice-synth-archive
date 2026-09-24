/* Voice Synth Archive Detective v14
 * Better visual fingerprints + BPM-aware audio evidence + humming pitch contour.
 */
(function(){
  "use strict";

  const IMG_CACHE=new Map();

  function clamp(v){return Math.max(0,Math.min(1,v))}
  function arr(v){return Array.isArray(v)?v:[]}

  // ---------- Advanced visual fingerprint ----------
  function histSimilarity(a,b){
    if(!a||!b||a.length!==b.length)return .5;
    let d=0;
    for(let i=0;i<a.length;i++)d+=Math.abs((a[i]||0)-(b[i]||0));
    return clamp(1-d/2);
  }
  function vectorSimilarity(a,b){
    if(!a||!b||a.length!==b.length)return .5;
    let d=0;
    for(let i=0;i<a.length;i++)d+=Math.abs((a[i]||0)-(b[i]||0));
    return clamp(1-d/a.length);
  }
  function hashSimilarity(a,b){
    if(!a||!b||a.length!==b.length)return .5;
    let same=0;
    for(let i=0;i<a.length;i++)if(a[i]===b[i])same++;
    return same/a.length;
  }
  function gridSimilarity(a,b){
    if(!a||!b||a.length!==b.length)return .5;
    let total=0;
    for(let i=0;i<a.length;i++){
      const x=a[i],y=b[i];
      if(!x||!y){total+=1;continue}
      const dr=(x.r-y.r)/255,dg=(x.g-y.g)/255,db=(x.b-y.b)/255;
      total+=Math.sqrt((dr*dr+dg*dg+db*db)/3);
    }
    return clamp(1-total/a.length);
  }

  async function advancedImageFeatures(blob){
    const bmp=await createImageBitmap(blob);
    const size=128;
    const canvas=document.createElement("canvas");
    canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    ctx.drawImage(bmp,0,0,size,size);
    const img=ctx.getImageData(0,0,size,size);
    const px=img.data;
    const legacy=analyzePixelData(px,size,size);

    const hueHist=new Array(12).fill(0);
    const lumHist=new Array(8).fill(0);
    const satHist=new Array(6).fill(0);
    const grid=Array.from({length:16},()=>({r:0,g:0,b:0,n:0}));
    const grays=new Float32Array(size*size);

    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        const p=(y*size+x)*4;
        const r=px[p],g=px[p+1],b=px[p+2];
        const lum=.2126*r+.7152*g+.0722*b;
        grays[y*size+x]=lum;
        const cell=(Math.floor(y/(size/4))*4)+Math.floor(x/(size/4));
        const z=grid[Math.max(0,Math.min(15,cell))];
        z.r+=r;z.g+=g;z.b+=b;z.n++;
        if((x&1)||(y&1))continue;
        const hsv=rgbToHsv(r,g,b);
        hueHist[Math.min(11,Math.floor((hsv.h||0)/30))]++;
        lumHist[Math.min(7,Math.floor(lum/32))]++;
        satHist[Math.min(5,Math.floor(clamp(hsv.s||0)*6))]++;
      }
    }

    function normalizeHist(h){
      const s=h.reduce((a,b)=>a+b,0)||1;
      return h.map(x=>x/s);
    }

    const edgeHist=[0,0,0,0];
    let edgeSum=0,edgeN=0;
    for(let y=1;y<size-1;y+=2){
      for(let x=1;x<size-1;x+=2){
        const i=y*size+x;
        const gx=
          -grays[i-size-1]+grays[i-size+1]
          -2*grays[i-1]+2*grays[i+1]
          -grays[i+size-1]+grays[i+size+1];
        const gy=
          -grays[i-size-1]-2*grays[i-size]-grays[i-size+1]
          +grays[i+size-1]+2*grays[i+size]+grays[i+size+1];
        const mag=Math.sqrt(gx*gx+gy*gy);
        if(mag<28)continue;
        let angle=Math.atan2(gy,gx);
        if(angle<0)angle+=Math.PI;
        if(angle>=Math.PI)angle-=Math.PI;
        const bin=Math.min(3,Math.floor(angle/(Math.PI/4)));
        edgeHist[bin]+=mag;edgeSum+=mag;edgeN++;
      }
    }
    const es=edgeHist.reduce((a,b)=>a+b,0)||1;

    const small=document.createElement("canvas");
    small.width=9;small.height=8;
    const sctx=small.getContext("2d",{willReadFrequently:true});
    sctx.drawImage(bmp,0,0,9,8);
    const sd=sctx.getImageData(0,0,9,8).data;
    const dhash=[];
    for(let y=0;y<8;y++){
      for(let x=0;x<8;x++){
        const p=(y*9+x)*4,q=(y*9+x+1)*4;
        const a=.2126*sd[p]+.7152*sd[p+1]+.0722*sd[p+2];
        const b=.2126*sd[q]+.7152*sd[q+1]+.0722*sd[q+2];
        dhash.push(a>b?1:0);
      }
    }

    const gridOut=grid.map(z=>({
      r:z.n?z.r/z.n:0,g:z.n?z.g/z.n:0,b:z.n?z.b/z.n:0
    }));

    return Object.assign({},legacy,{
      hueHist:normalizeHist(hueHist),
      lumHist:normalizeHist(lumHist),
      satHist:normalizeHist(satHist),
      grid:gridOut,
      edgeHist:edgeHist.map(x=>x/es),
      edgeStrength:edgeN?edgeSum/edgeN/1024:0,
      dhash:dhash
    });
  }

  function compareImages(a,b,type){
    if(!a||!b)return {score:.5,parts:{}};
    const global=imageFeatureSimilarityLegacy
      ? imageFeatureSimilarityLegacy(a,b)
      : clamp(1-(
          Math.abs((a.brightness||0)-(b.brightness||0))/255*.35+
          Math.abs((a.grayRatio||0)-(b.grayRatio||0))*.25+
          Math.abs((a.edgeDensity||0)-(b.edgeDensity||0))*.4
        ));
    const parts={
      global:global,
      grid:gridSimilarity(a.grid,b.grid),
      hue:histSimilarity(a.hueHist,b.hueHist),
      lum:histSimilarity(a.lumHist,b.lumHist),
      sat:histSimilarity(a.satHist,b.satHist),
      edge:vectorSimilarity(a.edgeHist,b.edgeHist),
      hash:hashSimilarity(a.dhash,b.dhash)
    };
    let w;
    if(type==="thumbnail"){
      w={global:.10,grid:.24,hue:.14,lum:.08,sat:.06,edge:.10,hash:.28};
    }else if(type==="frame"){
      w={global:.18,grid:.27,hue:.19,lum:.10,sat:.08,edge:.11,hash:.07};
    }else{
      w={global:.25,grid:.14,hue:.05,lum:.13,sat:.04,edge:.34,hash:.05};
    }
    let score=0;
    for(const k of Object.keys(w))score+=(parts[k]||0)*w[k];
    return {score:clamp(score),parts:parts};
  }

  const imageFeatureSimilarityLegacy=typeof imageFeatureSimilarity==="function"
    ? imageFeatureSimilarity
    : null;

  imageFeaturesFromBlob=advancedImageFeatures;
  imageFeatureSimilarity=function(a,b){return compareImages(a,b,"frame").score};

  candidateThumbnailFeatures=async function(song){
    if(!song||!song.thumbnailUrl)return null;
    const key=String(song.thumbnailUrl);
    const hit=IMG_CACHE.get(key);
    if(hit&&Date.now()-hit.at<30*60*1000)return hit.features;

    async function getBlob(url){
      const r=await fetch(url,{cache:"force-cache"});
      if(!r.ok)throw new Error("image "+r.status);
      return await r.blob();
    }

    try{
      let blob=null;
      try{
        blob=await getBlob(song.thumbnailUrl);
      }catch(e){
        if(relayBase()){
          const proxy=relayBase()+"/image?url="+encodeURIComponent(song.thumbnailUrl);
          blob=await getBlob(proxy);
        }else throw e;
      }
      const features=await advancedImageFeatures(blob);
      IMG_CACHE.set(key,{at:Date.now(),features:features});
      return features;
    }catch{return null}
  };

  analyzeDetectiveImage=async function(file){
    const preview=document.getElementById("detectiveImagePreview");
    const info=document.getElementById("detectiveImageAnalysis");
    const fp=document.getElementById("detectiveImageFingerprint");
    if(!file){
      state.detectiveImageEvidence=null;
      if(preview)preview.textContent="이미지 없음";
      if(fp)fp.textContent="시각 지문 대기 · 색 분포 / 4×4 구도 / 윤곽 / 퍼셉추얼 해시";
      return;
    }
    try{
      const features=await advancedImageFeatures(file);
      const type=(document.getElementById("detectiveImageType")||{}).value||"drawing";
      state.detectiveImageEvidence={file:file,features:features,type:type,v14:true};
      const url=URL.createObjectURL(file);
      if(preview)preview.innerHTML='<img src="'+url+'" alt="업로드 이미지">';
      const tone=features.grayRatio>.72?"흑백에 가까움":features.brightness<75?"어두운 화면":features.brightness>185?"밝은 화면":"중간 밝기";
      const color=features.saturation<.18?"저채도":features.hue<30||features.hue>330?"붉은 계열":features.hue<90?"노랑/초록 계열":features.hue<210?"청록/파랑 계열":"보라 계열";
      if(info)info.innerHTML='분석: <b>'+tone+'</b> · '+color+' · 화면 복잡도 '+(features.edgeDensity*100).toFixed(0)+'%';
      if(fp)fp.innerHTML='시각 지문 생성 완료 · <b>4×4 구도</b> · 색상 12구간 · 명도 8구간 · 윤곽 4방향 · dHash 64비트';
      updateDetectiveClueMeter();
    }catch(e){
      state.detectiveImageEvidence=null;
      if(info)info.textContent="이미지 분석 실패: "+String((e&&e.message)||e);
      if(fp)fp.textContent="시각 지문 생성 실패";
    }
  };

  enrichImageSimilarity=async function(rows){
    const ev=state.detectiveImageEvidence;
    if(!ev||!rows||!rows.length)return rows;
    const target=ev.features;
    const limit=Math.min(rows.length,72);
    await mapLimit(rows.slice(0,limit),5,async function(row){
      const f=await candidateThumbnailFeatures(row.song);
      if(!f)return;
      const cmp=compareImages(target,f,ev.type);
      row.imageSimilarity=cmp.score;
      row.imageSimilarityParts=cmp.parts;
      const weight=ev.type==="thumbnail"?7:ev.type==="frame"?4.2:2.6;
      row.score=Math.max(0,Math.min(99.9,row.score+(cmp.score-.5)*weight*10));
      if(cmp.score>.72){
        row.matches.push({
          text:"시각지문 "+(cmp.score*100).toFixed(0)+"% · 구도 "+(cmp.parts.grid*100).toFixed(0)+" · 색 "+(cmp.parts.hue*100).toFixed(0),
          strong:ev.type==="thumbnail"&&cmp.score>.84
        });
      }
      if(ev.type==="thumbnail"&&cmp.score<.16){
        row.hardFailures.push("썸네일 시각 지문 불일치");
      }
    });
    return rows;
  };

  // ---------- Humming pitch contour ----------
  function median(values){
    const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);
    if(!a.length)return null;
    const m=Math.floor(a.length/2);
    return a.length%2?a[m]:(a[m-1]+a[m])/2;
  }
  function percentile(values,p){
    const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);
    if(!a.length)return null;
    const idx=Math.max(0,Math.min(a.length-1,Math.round((a.length-1)*p)));
    return a[idx];
  }
  function extractPitchContour(buffer){
    const targetSr=8000;
    const src=buffer.getChannelData(0);
    const srcSr=buffer.sampleRate;
    const maxSec=Math.min(buffer.duration,25);
    const n=Math.floor(maxSec*targetSr);
    const ds=new Float32Array(n);
    const ratio=srcSr/targetSr;
    for(let i=0;i<n;i++)ds[i]=src[Math.min(src.length-1,Math.floor(i*ratio))]||0;

    const frame=1024,hop=640;
    const lagMin=Math.floor(targetSr/700),lagMax=Math.ceil(targetSr/70);
    const raw=[];
    let voiced=0,total=0;

    for(let pos=0;pos+frame<n;pos+=hop){
      total++;
      let mean=0,rms=0;
      for(let j=0;j<frame;j++)mean+=ds[pos+j];
      mean/=frame;
      for(let j=0;j<frame;j++){const v=ds[pos+j]-mean;rms+=v*v}
      rms=Math.sqrt(rms/frame);
      if(rms<.012){raw.push(null);continue}

      let bestLag=0,bestCorr=0;
      for(let lag=lagMin;lag<=lagMax;lag++){
        let xy=0,xx=0,yy=0;
        const end=frame-lag;
        for(let j=0;j<end;j+=2){
          const a=ds[pos+j]-mean,b=ds[pos+j+lag]-mean;
          xy+=a*b;xx+=a*a;yy+=b*b;
        }
        const corr=xy/Math.sqrt(Math.max(1e-12,xx*yy));
        if(corr>bestCorr){bestCorr=corr;bestLag=lag}
      }
      if(bestLag&&bestCorr>.42){
        const hz=targetSr/bestLag;
        const midi=69+12*Math.log2(hz/440);
        raw.push(midi);voiced++;
      }else raw.push(null);
    }

    const smooth=raw.map(function(v,i){
      if(v==null)return null;
      const near=[];
      for(let k=Math.max(0,i-2);k<=Math.min(raw.length-1,i+2);k++)if(raw[k]!=null)near.push(raw[k]);
      return median(near);
    });
    const values=smooth.filter(Number.isFinite);
    const center=median(values);
    const rel=smooth.map(v=>v==null?null:v-center);
    const usable=rel.filter(Number.isFinite);
    const p10=percentile(usable,.10),p90=percentile(usable,.90);
    const range=(p10==null||p90==null)?0:p90-p10;

    let up=0,down=0,flat=0;
    let prev=null;
    for(const v of rel){
      if(v==null)continue;
      if(prev!=null){
        const d=v-prev;
        if(d>.7)up++;
        else if(d<-.7)down++;
        else flat++;
      }
      prev=v;
    }
    let motion="완만";
    if(up+down>flat*1.3)motion="움직임 많음";
    if(up>down*1.8)motion="상행 경향";
    else if(down>up*1.8)motion="하행 경향";
    if(range>12)motion+=" · 음역 넓음";
    else if(range<4)motion+=" · 음역 좁음";

    const maxPoints=90;
    let compact=rel;
    if(rel.length>maxPoints){
      compact=[];
      const step=rel.length/maxPoints;
      for(let i=0;i<maxPoints;i++){
        const a=Math.floor(i*step),b=Math.max(a+1,Math.floor((i+1)*step));
        compact.push(median(rel.slice(a,b)));
      }
    }
    return {
      contour:compact,
      range:range,
      motion:motion,
      voicedRatio:total?voiced/total:0,
      centerMidi:center,
      up:up,down:down,flat:flat
    };
  }

  function drawPitchContour(data){
    const canvas=document.getElementById("detectivePitchCanvas");
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#07121e";ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#1b3349";ctx.lineWidth=1;
    for(let i=1;i<4;i++){
      const y=i*h/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
    }
    if(!data||!data.contour||!data.contour.length)return;
    const vals=data.contour.filter(Number.isFinite);
    if(!vals.length)return;
    const lo=Math.min(-8,Math.floor(Math.min(...vals)-2));
    const hi=Math.max(8,Math.ceil(Math.max(...vals)+2));
    ctx.strokeStyle="#69d4ff";ctx.lineWidth=3;ctx.lineJoin="round";ctx.lineCap="round";
    let pen=false;
    data.contour.forEach(function(v,i){
      if(v==null){pen=false;return}
      const x=i/Math.max(1,data.contour.length-1)*w;
      const y=h-(v-lo)/(hi-lo)*h;
      if(!pen){ctx.beginPath();ctx.moveTo(x,y);pen=true}
      else ctx.lineTo(x,y);
      if(i===data.contour.length-1&&pen)ctx.stroke();
    });
    if(pen)ctx.stroke();
    ctx.strokeStyle="#45687d";ctx.lineWidth=1;
    const zero=h-(0-lo)/(hi-lo)*h;
    ctx.beginPath();ctx.moveTo(0,zero);ctx.lineTo(w,zero);ctx.stroke();
  }

  function bpmSimilarity(song,ev){
    if(!ev||!ev.bpm)return null;
    let min=Number(song&&song.minBpm),max=Number(song&&song.maxBpm);
    let center=Number(song&&song.bpm);
    if(!Number.isFinite(center)&&Number.isFinite(min)&&Number.isFinite(max))center=(min+max)/2;
    if(!Number.isFinite(center))return null;
    if(!Number.isFinite(min))min=center;
    if(!Number.isFinite(max))max=center;

    const variants=[ev.bpm,ev.bpm*2,ev.bpm/2].filter(x=>x>=45&&x<=260);
    let best=Infinity,chosen=ev.bpm;
    for(const v of variants){
      let d=0;
      if(v<min)d=min-v;
      else if(v>max)d=v-max;
      if(d<best){best=d;chosen=v}
    }
    const score=Math.exp(-Math.pow(best/18,2));
    return {score:clamp(score),diff:best,matchedBpm:chosen,min:min,max:max,center:center};
  }

  const baseAudioEvidenceScore=typeof audioEvidenceScore==="function"?audioEvidenceScore:null;
  audioEvidenceScore=function(song,c){
    const ev=state.detectiveAudioEvidence;
    if(!ev)return null;
    const bp=bpmSimilarity(song,ev);
    if(bp){
      const base=baseAudioEvidenceScore?baseAudioEvidenceScore(song,c):null;
      const score=clamp(bp.score*.78+(base?base.score:.5)*.22);
      const range=Math.abs(bp.max-bp.min)>1?(Math.round(bp.min)+"~"+Math.round(bp.max)):Math.round(bp.center);
      return {score:score,reason:"BPM 직접 대조 · 후보 "+range+" / 녹음 "+Math.round(ev.bpm)};
    }
    return baseAudioEvidenceScore?baseAudioEvidenceScore(song,c):{score:.5,reason:"녹음 특징 보조"};
  };

  analyzeDetectiveAudio=async function(file){
    if(!file){state.detectiveAudioEvidence=null;drawPitchContour(null);return}
    const player=document.getElementById("detectiveAudioPlayer");
    if(player){player.src=URL.createObjectURL(file);player.style.display="block"}
    const info=document.getElementById("detectiveAudioAnalysis");
    const meta=document.getElementById("detectivePitchMeta");
    try{
      const ab=await file.arrayBuffer();
      const AC=window.AudioContext||window.webkitAudioContext;
      const ac=new AC();
      const buffer=await ac.decodeAudioData(ab.slice(0));
      const d=buffer.getChannelData(0),limit=Math.min(d.length,buffer.sampleRate*60);
      let sum=0,z=0;
      for(let i=1;i<limit;i++){
        const v=d[i];sum+=v*v;
        if((v>=0)!==(d[i-1]>=0))z++;
      }
      const rms=Math.sqrt(sum/Math.max(1,limit));
      const zcr=z/Math.max(1,limit);
      const bpm=estimateTempoFromBuffer(buffer);
      const tempo=bpm>=160?"veryfast":bpm>=115?"fast":bpm<82?"slow":"mid";
      const brightness=zcr>.13?"밝고 거친 편":zcr<.055?"부드럽고 어두운 편":"중간";
      const type=(document.getElementById("detectiveAudioType")||{}).value||"humming";
      const pitch=(type==="humming"||type==="excerpt")?extractPitchContour(buffer):null;

      state.detectiveAudioEvidence={
        type:type,duration:buffer.duration,bpm:bpm,tempo:tempo,rms:rms,zcr:zcr,brightness:brightness,
        pitchContour:pitch&&pitch.contour||[],pitchRange:pitch&&pitch.range||0,
        pitchMotion:pitch&&pitch.motion||"",voicedRatio:pitch&&pitch.voicedRatio||0
      };

      if(info)info.innerHTML='분석: 약 <b>'+(bpm||"?")+' BPM</b> · '+brightness+' · 파일 길이 '+buffer.duration.toFixed(1)+'초';
      if(pitch){
        drawPitchContour(pitch);
        if(meta)meta.innerHTML='허밍 윤곽: <b>'+pitch.motion+'</b> · 상대 음역 '+pitch.range.toFixed(1)+'반음 · 검출 신뢰 '+(pitch.voicedRatio*100).toFixed(0)+'%';
      }else{
        drawPitchContour(null);
        if(meta)meta.textContent="전체 파일은 길이·BPM 중심으로 대조합니다.";
      }

      if(type==="full"){
        const dur=buffer.duration;
        const el=document.getElementById("detectiveDuration");
        if(el)el.value=dur<120?"short":dur<180?"2-3":dur<240?"3-4":dur<300?"4-5":"long";
      }
      updateDetectiveClueMeter();
      await ac.close();
    }catch(e){
      state.detectiveAudioEvidence=null;
      if(info)info.textContent="녹음 분석 실패: "+String((e&&e.message)||e);
      if(meta)meta.textContent="음높이 윤곽을 만들지 못했습니다.";
      drawPitchContour(null);
    }
  };

  // Add stronger direct BPM / duration evidence on top of the existing detective score.
  const baseEvidence=detectiveEvidence;
  detectiveEvidence=function(song,c){
    const ev=baseEvidence(song,c);
    const audio=state.detectiveAudioEvidence;
    if(!audio)return ev;

    const bp=bpmSimilarity(song,audio);
    if(bp){
      if(bp.score>=.82){
        ev.score=Math.min(99.9,ev.score+7);
        ev.matchedCount++;
        const range=Math.abs(bp.max-bp.min)>1?(Math.round(bp.min)+"~"+Math.round(bp.max)):Math.round(bp.center);
        ev.matches.unshift({text:"BPM 일치: "+range+" ↔ "+Math.round(audio.bpm),strong:true});
      }else if(bp.score>=.55){
        ev.score=Math.min(99.9,ev.score+3.5);
        ev.matches.push({text:"BPM 근접",strong:false});
      }else if(bp.score<.18){
        ev.score=Math.max(0,ev.score-4);
        ev.misses.push("BPM 차이 큼");
      }
      ev.audioBpmSimilarity=bp.score;
    }

    if(audio.type==="full"&&song&&song.lengthSeconds){
      const d=Math.abs(Number(song.lengthSeconds)-audio.duration);
      if(d<=4){
        ev.score=Math.min(99.9,ev.score+5);
        ev.matchedCount++;
        ev.matches.unshift({text:"곡 길이 거의 일치",strong:true});
      }else if(d<=12){
        ev.score=Math.min(99.9,ev.score+2);
        ev.matches.push({text:"곡 길이 근접",strong:false});
      }else if(d>45){
        ev.score=Math.max(0,ev.score-3);
      }
    }

    return ev;
  };

  // Small UX: clear visual/pitch extras on reset.
  const resetBtn=document.getElementById("detectiveResetBtn");
  if(resetBtn){
    resetBtn.addEventListener("click",function(){
      const fp=document.getElementById("detectiveImageFingerprint");
      const pm=document.getElementById("detectivePitchMeta");
      if(fp)fp.textContent="시각 지문 대기 · 색 분포 / 4×4 구도 / 윤곽 / 퍼셉추얼 해시";
      if(pm)pm.textContent="음높이 윤곽 대기 · 허밍이면 키와 무관한 상대 음정 흐름을 추출합니다.";
      drawPitchContour(null);
    });
  }
})();