/**
 * Voice Synth Archive relay + detective index v16
 *
 * Existing:
 *   GET  /api      -> Niconico Snapshot Search relay
 *   GET  /image    -> safe Niconico thumbnail proxy
 *   GET  /health
 *
 * Detective backend (D1 binding name: DB):
 *   GET  /detective/status
 *   POST /detective/search
 *   POST /detective/warm
 *
 * Optional scheduled trigger:
 *   crawls VocaDB Original songs into D1 in small pages.
 */
const NICO_API = "https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search";
const VOCADB_API = "https://vocadb.net/api";
const INDEX_VERSION = 2;
const EMBED_MODEL = "@cf/baai/bge-m3";
const EMBED_DIMENSIONS = 1024;

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept",
    "Access-Control-Max-Age": "86400"
  };
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...cors()}
  });
}
function safeImageHost(host){
  host=String(host||"").toLowerCase();
  return host==="nicovideo.jp" || host.endsWith(".nicovideo.jp") ||
         host==="nimg.jp" || host.endsWith(".nimg.jp");
}
function arr(v){return Array.isArray(v)?v:[]}
function clean(v){return String(v??"").trim()}
function norm(v){
  return clean(v).normalize("NFKC").toLowerCase()
    .replace(/[\s\u3000\p{P}\p{S}]+/gu,"");
}
function parseJson(v,fallback=[]){
  try{return JSON.parse(v)}catch{return fallback}
}
function uniq(xs){return [...new Set(xs.filter(Boolean))]}
function nameValue(x){return clean(x?.value||x?.name||x?.defaultName)}

function vocadbArtistNames(item){
  return arr(item?.artists).map(x=>nameValue(x?.artist||x)).filter(Boolean);
}
function vocadbTags(item){
  return arr(item?.tags).map(x=>nameValue(x?.tag||x)).filter(Boolean);
}
function vocadbAliases(item){
  const out=[];
  if(item?.additionalNames) clean(item.additionalNames).split(/[,、]/).forEach(x=>x.trim()&&out.push(x.trim()));
  arr(item?.names).forEach(x=>{const v=nameValue(x);if(v)out.push(v)});
  return uniq(out);
}
function vocadbNicoPv(item){
  return arr(item?.pvs).find(p=>/NicoNicoDouga/i.test(clean(p?.service))&&p?.pvId)||null;
}
function vocadbYoutubePv(item){
  return arr(item?.pvs).find(p=>/Youtube/i.test(clean(p?.service))&&(p?.url||p?.pvId))||null;
}
function inferVocals(item){
  const out=[];
  for(const a of arr(item?.artists)){
    const cats=clean(a?.categories||a?.artist?.artistType||"").toLowerCase();
    const name=nameValue(a?.artist||a);
    if(/vocalist|voice|synthesizer|utau|vocaloid/.test(cats)&&name)out.push(name);
  }
  // VocaDB data isn't perfectly categorized; voice-like tags are useful fallbacks.
  for(const t of vocadbTags(item)){
    if(/初音ミク|鏡音|巡音ルカ|GUMI|IA|flower|重音テト|可不|知声|ずんだもん|小春六花|夏色花梨|花隈千冬|宮舞モカ/.test(t))out.push(t);
  }
  return uniq(out);
}
function vocadbToEntity(item){
  const artists=vocadbArtistNames(item);
  const aliases=vocadbAliases(item);
  const tags=vocadbTags(item);
  const vocals=inferVocals(item);
  const nico=vocadbNicoPv(item);
  const youtube=vocadbYoutubePv(item);
  const vocadbId=Number(item?.id)||0;
  const nicoId=nico?.pvId?clean(nico.pvId):"";
  const title=clean(item?.name||item?.defaultName||aliases[0]||("VocaDB #"+vocadbId));
  const lyrics=arr(item?.lyrics).map(x=>clean(x?.value)).filter(Boolean).join("\n\n");
  const minBpm=item?.minMilliBpm!=null?Number(item.minMilliBpm)/1000:null;
  const maxBpm=item?.maxMilliBpm!=null?Number(item.maxMilliBpm)/1000:null;
  const key=nicoId?("nico:"+nicoId.toLowerCase()):("vocadb:"+vocadbId);
  const thumb=clean(item?.thumbUrl||item?.mainPicture?.urlThumb||item?.mainPicture?.urlSmallThumb);
  const publish=clean(item?.publishDate||"");
  const searchBlob=[
    title,...aliases,...artists,...vocals,...tags,lyrics.slice(0,16000)
  ].join(" ");
  return {
    canonical_key:key,
    vocadb_id:vocadbId||null,
    nico_id:nicoId||null,
    title,
    aliases,
    artists,
    vocals,
    tags,
    lyrics,
    publish_date:publish||null,
    publish_year:publish?Number(publish.slice(0,4))||null:null,
    duration_seconds:Number(item?.lengthSeconds)||0,
    min_bpm:minBpm,
    max_bpm:maxBpm,
    thumbnail_url:thumb||null,
    vocadb_url:vocadbId?("https://vocadb.net/S/"+vocadbId):null,
    youtube_url:youtube?.url||null,
    pvs:arr(item?.pvs),
    web_links:arr(item?.webLinks),
    albums:arr(item?.albums),
    search_blob:searchBlob
  };
}

function semanticDocument(e){
  const lyric=e.lyrics ? e.lyrics.replace(/\s+/g," ").slice(0,5000) : "";
  return [
    "title: "+e.title,
    e.aliases?.length ? "aliases: "+e.aliases.join(" / ") : "",
    e.artists?.length ? "artists: "+e.artists.join(" / ") : "",
    e.vocals?.length ? "vocals: "+e.vocals.join(" / ") : "",
    e.tags?.length ? "tags: "+e.tags.slice(0,40).join(" / ") : "",
    lyric ? "lyrics: "+lyric : ""
  ].filter(Boolean).join("\n");
}
function semanticQueryText(body){
  const parts=[];
  if(body?.words)parts.push("remembered title or description: "+clean(body.words));
  if(body?.lyrics)parts.push("remembered lyrics or meaning: "+clean(body.lyrics));
  if(body?.producer)parts.push("producer: "+clean(body.producer));
  if(body?.vocal)parts.push("vocal: "+clean(body.vocal));
  if(arr(body?.genre).length)parts.push("genre: "+body.genre.join(", "));
  if(arr(body?.mood).length)parts.push("mood: "+body.mood.join(", "));
  if(arr(body?.visualTags).length)parts.push("music video: "+body.visualTags.join(", "));
  if(arr(body?.contexts).length)parts.push("heard at: "+body.contexts.join(", "));
  if(body?.yearFrom||body?.yearTo)parts.push("release era: "+clean(body.yearFrom||"?")+"-"+clean(body.yearTo||"?"));
  return parts.join("\n").slice(0,7000);
}
function embeddingRows(result){
  if(Array.isArray(result?.data))return result.data;
  if(Array.isArray(result?.embeddings))return result.embeddings;
  if(Array.isArray(result)&&Array.isArray(result[0]))return result;
  return [];
}
async function embedTexts(env,texts){
  if(!env?.AI||!texts?.length)return [];
  const cleaned=texts.map(x=>clean(x).slice(0,7000));
  const out=await env.AI.run(EMBED_MODEL,{text:cleaned});
  return embeddingRows(out);
}
async function upsertSemanticVectors(env,records){
  if(!env?.AI||!env?.VECTORIZE||!records?.length)return {upserted:0};
  let upserted=0;
  for(let i=0;i<records.length;i+=16){
    const batch=records.slice(i,i+16);
    try{
      const vectors=await embedTexts(env,batch.map(x=>semanticDocument(x.entity)));
      const payload=[];
      for(let j=0;j<Math.min(batch.length,vectors.length);j++){
        const values=vectors[j];
        if(!Array.isArray(values)||values.length!==EMBED_DIMENSIONS)continue;
        payload.push({
          id:String(batch[j].songId),
          values,
          metadata:{
            song_id:batch[j].songId,
            canonical_key:batch[j].entity.canonical_key,
            title:batch[j].entity.title.slice(0,180),
            year:batch[j].entity.publish_year||0
          }
        });
      }
      if(payload.length){
        await env.VECTORIZE.upsert(payload);
        upserted+=payload.length;
      }
    }catch(e){
      console.warn("semantic upsert failed",String(e?.message||e));
    }
  }
  return {upserted};
}
async function semanticSearch(env,body){
  if(!env?.AI||!env?.VECTORIZE||!await dbReady(env))return [];
  const q=semanticQueryText(body);
  if(q.length<2)return [];
  try{
    const vectors=await embedTexts(env,[q]);
    const vector=vectors[0];
    if(!Array.isArray(vector)||vector.length!==EMBED_DIMENSIONS)return [];
    const result=await env.VECTORIZE.query(vector,{topK:90,returnMetadata:"all"});
    const matches=arr(result?.matches||result);
    const ids=[];
    const semScore=new Map();
    for(const m of matches){
      const id=Number(m?.metadata?.song_id||m?.id);
      if(!id)continue;
      ids.push(id);
      semScore.set(id,Number(m?.score)||0);
    }
    if(!ids.length)return [];
    const unique=[...new Set(ids)].slice(0,90);
    const marks=unique.map(()=>"?").join(",");
    const rows=arr((await env.DB.prepare(`SELECT * FROM songs WHERE id IN (${marks})`).bind(...unique).all())?.results);
    for(const row of rows){
      row.__semantic=semScore.get(Number(row.id))||0;
      row.__score=(Number(row.__score)||0)+Math.max(0,row.__semantic)*35;
    }
    rows.sort((a,b)=>Number(b.__semantic)-Number(a.__semantic));
    return rows;
  }catch(e){
    console.warn("semantic search failed",String(e?.message||e));
    return [];
  }
}

function makeNgrams(text){
  const s=norm(text);
  const out=new Set();
  if(!s)return [];
  if(s.length<=3){out.add(s);return [...out]}
  for(let n=2;n<=3;n++){
    for(let i=0;i<=s.length-n;i++)out.add(s.slice(i,i+n));
  }
  return [...out].slice(0,320);
}

async function dbReady(env){
  if(!env?.DB)return false;
  try{
    const row=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='songs'").first();
    return !!row;
  }catch{return false}
}
async function dbCount(env){
  if(!await dbReady(env))return 0;
  const row=await env.DB.prepare("SELECT COUNT(*) AS n FROM songs").first();
  return Number(row?.n)||0;
}

async function upsertEntity(env,e){
  if(!await dbReady(env))return null;
  const now=new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO songs(
      canonical_key,vocadb_id,nico_id,title,aliases_json,artists_json,vocals_json,tags_json,lyrics_text,
      publish_date,publish_year,duration_seconds,min_bpm,max_bpm,thumbnail_url,vocadb_url,youtube_url,
      pvs_json,web_links_json,albums_json,search_blob,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(canonical_key) DO UPDATE SET
      vocadb_id=excluded.vocadb_id,
      nico_id=COALESCE(excluded.nico_id,songs.nico_id),
      title=excluded.title,
      aliases_json=excluded.aliases_json,
      artists_json=excluded.artists_json,
      vocals_json=excluded.vocals_json,
      tags_json=excluded.tags_json,
      lyrics_text=CASE WHEN length(excluded.lyrics_text)>length(songs.lyrics_text) THEN excluded.lyrics_text ELSE songs.lyrics_text END,
      publish_date=COALESCE(excluded.publish_date,songs.publish_date),
      publish_year=COALESCE(excluded.publish_year,songs.publish_year),
      duration_seconds=CASE WHEN excluded.duration_seconds>0 THEN excluded.duration_seconds ELSE songs.duration_seconds END,
      min_bpm=COALESCE(excluded.min_bpm,songs.min_bpm),
      max_bpm=COALESCE(excluded.max_bpm,songs.max_bpm),
      thumbnail_url=COALESCE(excluded.thumbnail_url,songs.thumbnail_url),
      vocadb_url=COALESCE(excluded.vocadb_url,songs.vocadb_url),
      youtube_url=COALESCE(excluded.youtube_url,songs.youtube_url),
      pvs_json=excluded.pvs_json,
      web_links_json=excluded.web_links_json,
      albums_json=excluded.albums_json,
      search_blob=excluded.search_blob,
      updated_at=excluded.updated_at
  `).bind(
    e.canonical_key,e.vocadb_id,e.nico_id,e.title,
    JSON.stringify(e.aliases),JSON.stringify(e.artists),JSON.stringify(e.vocals),JSON.stringify(e.tags),e.lyrics,
    e.publish_date,e.publish_year,e.duration_seconds,e.min_bpm,e.max_bpm,e.thumbnail_url,e.vocadb_url,e.youtube_url,
    JSON.stringify(e.pvs),JSON.stringify(e.web_links),JSON.stringify(e.albums),e.search_blob,now
  ).run();

  const row=await env.DB.prepare("SELECT id FROM songs WHERE canonical_key=?").bind(e.canonical_key).first();
  const id=Number(row?.id)||0;
  if(!id)return null;

  // Refresh lexical FTS document.
  try{
    await env.DB.prepare("DELETE FROM song_fts WHERE song_id=?").bind(id).run();
    await env.DB.prepare("INSERT INTO song_fts(song_id,title,aliases,artists,vocals,tags,lyrics) VALUES(?,?,?,?,?,?,?)")
      .bind(id,e.title,e.aliases.join(" "),e.artists.join(" "),e.vocals.join(" "),e.tags.join(" "),e.lyrics.slice(0,50000))
      .run();
  }catch{}

  // Character ngrams make partial Japanese/CJK title memories fast.
  try{
    await env.DB.prepare("DELETE FROM song_ngrams WHERE song_id=?").bind(id).run();
    const grams=makeNgrams([e.title,...e.aliases].join(" "));
    const stmts=grams.map(g=>env.DB.prepare("INSERT OR IGNORE INTO song_ngrams(gram,song_id) VALUES(?,?)").bind(g,id));
    if(stmts.length)await env.DB.batch(stmts);
  }catch{}
  return id;
}

async function vocadbSearch(query,{start=0,artistId=null,yearFrom=null,yearTo=null,maxResults=50,sort="FavoritedTimes"}={}){
  const p=new URLSearchParams();
  if(query)p.set("query",query);
  p.set("songTypes","Original");
  p.set("maxResults",String(Math.min(50,Math.max(1,maxResults))));
  p.set("start",String(Math.max(0,start)));
  p.set("getTotalCount","false");
  p.set("nameMatchMode","Partial");
  p.set("preferAccurateMatches","true");
  p.set("fields","AdditionalNames,Artists,Names,PVs,Tags,ThumbUrl,Bpm,Lyrics,WebLinks,Albums");
  p.set("lang","Japanese");
  p.set("sort",sort);
  if(artistId!=null)p.append("artistId",String(artistId));
  if(yearFrom)p.set("afterDate",yearFrom+"-01-01T00:00:00Z");
  if(yearTo)p.set("beforeDate",(Number(yearTo)+1)+"-01-01T00:00:00Z");
  const r=await fetch(VOCADB_API+"/songs?"+p.toString(),{headers:{"Accept":"application/json"}});
  if(!r.ok)throw new Error("VocaDB "+r.status);
  const d=await r.json();
  return arr(d?.items);
}

function queryAtoms(body){
  const out=[];
  const push=v=>{
    const s=clean(v);
    if(!s)return;
    s.split(/[\s,、/|]+/).forEach(x=>x.length>=1&&out.push(x));
  };
  push(body?.words);
  push(body?.lyrics);
  push(body?.producer);
  push(body?.vocal);
  for(const x of arr(body?.wordTokens))push(x);
  for(const x of arr(body?.lyricTokens))push(x);
  for(const x of arr(body?.kanjiHints))push(x?.kanji||x);
  return uniq(out).slice(0,18);
}
function rowToSong(row){
  return {
    contentId:row.nico_id||("vocadb:"+row.vocadb_id),
    title:row.title,
    description:[...parseJson(row.aliases_json),...parseJson(row.artists_json)].join(" · "),
    viewCounter:row.view_counter??null,
    commentCounter:row.comment_counter??0,
    mylistCounter:row.mylist_counter??0,
    likeCounter:row.like_counter??0,
    startTime:row.publish_date||"",
    lengthSeconds:Number(row.duration_seconds)||0,
    thumbnailUrl:row.thumbnail_url||"",
    tags:parseJson(row.tags_json),
    aliases:parseJson(row.aliases_json),
    artistString:parseJson(row.artists_json).join(", "),
    vocals:parseJson(row.vocals_json),
    lyrics:row.lyrics_text?[{value:row.lyrics_text}]:[],
    minBpm:row.min_bpm,
    maxBpm:row.max_bpm,
    bpm:(row.min_bpm!=null&&row.max_bpm!=null)?(Number(row.min_bpm)+Number(row.max_bpm))/2:(row.min_bpm??null),
    vocadbId:row.vocadb_id,
    vocadbUrl:row.vocadb_url||"",
    vocadbPVs:parseJson(row.pvs_json),
    webLinks:parseJson(row.web_links_json),
    albums:parseJson(row.albums_json),
    __nicoId:row.nico_id||"",
    __source:"index",
    __sources:row.nico_id?["index","niconico","vocadb"]:["index","vocadb"],
    __indexScore:Number(row.__score)||0
  };
}
function scoreRow(row,body,atoms){
  let s=0;
  const title=norm(row.title);
  const aliases=norm(parseJson(row.aliases_json).join(" "));
  const artists=norm(parseJson(row.artists_json).join(" "));
  const vocals=norm(parseJson(row.vocals_json).join(" "));
  const tags=norm(parseJson(row.tags_json).join(" "));
  const lyrics=norm(row.lyrics_text||"");

  for(const raw of atoms){
    const t=norm(raw);
    if(!t)continue;
    if(title===t)s+=42;
    else if(title.includes(t))s+=28;
    if(aliases.includes(t))s+=22;
    if(artists.includes(t))s+=13;
    if(vocals.includes(t))s+=13;
    if(tags.includes(t))s+=8;
    if(t.length>=2&&lyrics.includes(t))s+=18;
  }

  const y=Number(row.publish_year)||0;
  if(body?.yearFrom&&y&&y>=Number(body.yearFrom))s+=3;
  if(body?.yearTo&&y&&y<=Number(body.yearTo))s+=3;
  if(body?.yearFrom&&y&&y<Number(body.yearFrom)-2)s-=6;
  if(body?.yearTo&&y&&y>Number(body.yearTo)+2)s-=6;

  if(body?.duration){
    const d=Number(row.duration_seconds)||0;
    const ok=
      body.duration==="short"?d>0&&d<120:
      body.duration==="2-3"?d>=120&&d<180:
      body.duration==="3-4"?d>=180&&d<240:
      body.duration==="4-5"?d>=240&&d<300:
      body.duration==="long"?d>=300:true;
    if(ok)s+=5;
  }

  const audio=body?.audio||null;
  if(audio?.bpm&&(row.min_bpm!=null||row.max_bpm!=null)){
    let lo=Number(row.min_bpm??row.max_bpm),hi=Number(row.max_bpm??row.min_bpm);
    const vars=[Number(audio.bpm),Number(audio.bpm)*2,Number(audio.bpm)/2].filter(x=>x>=40&&x<=300);
    let best=999;
    for(const b of vars){
      const diff=b<lo?lo-b:b>hi?b-hi:0;
      if(diff<best)best=diff;
    }
    s+=Math.max(-4,12-best/2.2);
  }
  return s;
}

async function lexicalSearch(env,body){
  if(!await dbReady(env))return [];
  const atoms=queryAtoms(body);
  const ids=new Map();

  // 1) Title/alias character ngrams for very short remembered fragments.
  const ngramAtoms=atoms.filter(x=>norm(x).length>=2).slice(0,6);
  for(const atom of ngramAtoms){
    const grams=makeNgrams(atom).slice(0,24);
    if(!grams.length)continue;
    const marks=grams.map(()=>"?").join(",");
    try{
      const q=`SELECT song_id,COUNT(*) AS hits FROM song_ngrams WHERE gram IN (${marks}) GROUP BY song_id ORDER BY hits DESC LIMIT 120`;
      const res=await env.DB.prepare(q).bind(...grams).all();
      for(const r of arr(res?.results))ids.set(Number(r.song_id),(ids.get(Number(r.song_id))||0)+Number(r.hits||0));
    }catch{}
  }

  // 2) FTS for aliases/artists/tags/lyrics.
  if(atoms.length){
    const fts=atoms.slice(0,8).map(x=>clean(x).replace(/["']/g," ")).filter(Boolean).map(x=>'"'+x+'"').join(" OR ");
    try{
      const res=await env.DB.prepare("SELECT song_id,bm25(song_fts) AS rank FROM song_fts WHERE song_fts MATCH ? ORDER BY rank LIMIT 180")
        .bind(fts).all();
      for(const r of arr(res?.results))ids.set(Number(r.song_id),(ids.get(Number(r.song_id))||0)+10);
    }catch{}
  }

  // 3) Structured fallback when only year/vocal/etc. is known.
  if(!ids.size){
    const where=[];const binds=[];
    if(body?.yearFrom){where.push("publish_year>=?");binds.push(Number(body.yearFrom))}
    if(body?.yearTo){where.push("publish_year<=?");binds.push(Number(body.yearTo))}
    if(body?.vocal){where.push("vocals_json LIKE ?");binds.push("%"+clean(body.vocal)+"%")}
    if(body?.producer){where.push("artists_json LIKE ?");binds.push("%"+clean(body.producer)+"%")}
    const sql="SELECT id AS song_id FROM songs"+(where.length?" WHERE "+where.join(" AND "):"")+" ORDER BY updated_at DESC LIMIT 220";
    try{
      const res=await env.DB.prepare(sql).bind(...binds).all();
      for(const r of arr(res?.results))ids.set(Number(r.song_id),1);
    }catch{}
  }

  const picked=[...ids.entries()].sort((a,b)=>b[1]-a[1]).slice(0,260);
  if(!picked.length)return [];
  const marks=picked.map(()=>"?").join(",");
  const res=await env.DB.prepare(`SELECT * FROM songs WHERE id IN (${marks})`).bind(...picked.map(x=>x[0])).all();
  const rows=arr(res?.results);
  for(const row of rows)row.__score=scoreRow(row,body,atoms)+(ids.get(Number(row.id))||0)*.35;
  rows.sort((a,b)=>Number(b.__score)-Number(a.__score));
  return rows.slice(0,120).map(rowToSong);
}

async function warmFromClues(env,body){
  if(!await dbReady(env))return {added:0,semanticUpserted:0};
  const terms=queryAtoms(body).filter(x=>clean(x).length>=2).slice(0,6);
  const queries=terms.length?terms:[clean(body?.vocal),clean(body?.producer)].filter(Boolean);
  let added=0;
  const seen=new Set();
  const semanticRecords=[];
  for(const q of queries.slice(0,5)){
    try{
      const items=await vocadbSearch(q,{yearFrom:body?.yearFrom,yearTo:body?.yearTo,maxResults:30});
      for(const item of items){
        const e=vocadbToEntity(item);
        if(seen.has(e.canonical_key))continue;
        seen.add(e.canonical_key);
        const songId=await upsertEntity(env,e);
        if(songId){
          semanticRecords.push({songId,entity:e});
          added++;
        }
      }
    }catch{}
  }
  const sem=await upsertSemanticVectors(env,semanticRecords);
  return {added,semanticUpserted:sem.upserted||0};
}
async function handleDetectiveSearch(request,env){
  let body={};
  try{body=await request.json()}catch{return json({ok:false,error:"invalid json"},400)}
  const ready=await dbReady(env);
  if(!ready)return json({ok:false,indexReady:false,error:"D1 detective index is not configured"},503);

  let [lexical,semantic]=await Promise.all([
    lexicalSearch(env,body),
    semanticSearch(env,body)
  ]);

  let warmed=0,semanticUpserted=0;
  if(Math.max(lexical.length,semantic.length)<12){
    const w=await warmFromClues(env,body);
    warmed=w.added||0;
    semanticUpserted=w.semanticUpserted||0;
    if(warmed){
      [lexical,semantic]=await Promise.all([lexicalSearch(env,body),semanticSearch(env,body)]);
    }
  }

  const merged=new Map();
  for(const s of lexical){
    const key=s.vocadbId?("v:"+s.vocadbId):("n:"+s.contentId);
    merged.set(key,s);
  }
  for(const row of semantic){
    const s=rowToSong(row);
    s.__semanticScore=Number(row.__semantic)||0;
    const key=s.vocadbId?("v:"+s.vocadbId):("n:"+s.contentId);
    if(merged.has(key)){
      const old=merged.get(key);
      old.__semanticScore=Math.max(Number(old.__semanticScore)||0,s.__semanticScore);
      old.__indexScore=(Number(old.__indexScore)||0)+(s.__semanticScore*35);
    }else merged.set(key,s);
  }

  const candidates=[...merged.values()];
  candidates.sort((a,b)=>{
    const as=(Number(a.__indexScore)||0)+(Number(a.__semanticScore)||0)*35;
    const bs=(Number(b.__indexScore)||0)+(Number(b.__semanticScore)||0)*35;
    return bs-as;
  });

  const count=await dbCount(env);
  return json({
    ok:true,indexReady:true,indexVersion:INDEX_VERSION,indexedSongs:count,
    semanticReady:!!(env?.AI&&env?.VECTORIZE),
    warmed,semanticUpserted,
    lexicalCandidates:lexical.length,
    semanticCandidates:semantic.length,
    candidates:candidates.slice(0,140),
    mode:semantic.length?"hybrid-index":(lexical.length?"lexical-index":"index-empty")
  });
}
async function handleWarm(request,env){
  if(!await dbReady(env))return json({ok:false,indexReady:false,error:"D1 detective index is not configured"},503);
  let body={};
  try{body=await request.json()}catch{}
  const w=await warmFromClues(env,body);
  return json({ok:true,...w,indexedSongs:await dbCount(env)});
}

async function syncVocaDBPages(env,{pages=4}={}){
  if(!await dbReady(env))return {ok:false,reason:"no-db"};
  const key="vocadb_original_cursor";
  const row=await env.DB.prepare("SELECT value FROM sync_state WHERE key=?").bind(key).first();
  let start=Math.max(0,Number(row?.value)||0);
  let added=0,semanticUpserted=0,lastCount=0;
  const semanticRecords=[];

  for(let page=0;page<Math.max(1,Math.min(8,pages));page++){
    let items=[];
    try{
      items=await vocadbSearch("",{start,maxResults:50,sort:"PublishDate"});
    }catch(e){
      return {ok:false,reason:String(e?.message||e),start,added,semanticUpserted};
    }
    lastCount=items.length;
    if(!items.length){start=0;break}
    for(const item of items){
      try{
        const entity=vocadbToEntity(item);
        const songId=await upsertEntity(env,entity);
        if(songId){semanticRecords.push({songId,entity});added++}
      }catch{}
    }
    start+=items.length;
    if(items.length<50)break;
  }

  const sem=await upsertSemanticVectors(env,semanticRecords);
  semanticUpserted=sem.upserted||0;
  await env.DB.prepare(`
    INSERT INTO sync_state(key,value,updated_at) VALUES(?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at
  `).bind(key,String(start),new Date().toISOString()).run();

  return {ok:true,next:start,added,semanticUpserted,lastCount,indexedSongs:await dbCount(env)};
}

async function handleManualSync(request,env){
  if(!env?.SYNC_TOKEN)return json({ok:false,error:"manual sync disabled"},403);
  const auth=clean(request.headers.get("Authorization"));
  if(auth!=="Bearer "+env.SYNC_TOKEN)return json({ok:false,error:"unauthorized"},401);
  let body={};
  try{body=await request.json()}catch{}
  const pages=Math.max(1,Math.min(8,Number(body?.pages)||4));
  return json(await syncVocaDBPages(env,{pages}));
}

export default {
  async fetch(request,env,ctx) {
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors()});
    const u=new URL(request.url);

    if(u.pathname==="/" || u.pathname==="/health"){
      return json({
        ok:true,service:"voice-synth-archive-worker",version:"17.0",
        detectiveIndex:await dbReady(env),
        semanticIndex:!!(env?.AI&&env?.VECTORIZE),
        embeddingModel:env?.AI?EMBED_MODEL:null,
        indexedSongs:await dbCount(env)
      });
    }

    if(u.pathname==="/detective/status"){
      const ready=await dbReady(env);
      return json({ok:true,indexReady:ready,semanticReady:!!(env?.AI&&env?.VECTORIZE),indexVersion:INDEX_VERSION,embeddingModel:env?.AI?EMBED_MODEL:null,indexedSongs:ready?await dbCount(env):0});
    }
    if(u.pathname==="/detective/search" && request.method==="POST")return handleDetectiveSearch(request,env);
    if(u.pathname==="/detective/warm" && request.method==="POST")return handleWarm(request,env);
    if(u.pathname==="/detective/sync" && request.method==="POST")return handleManualSync(request,env);

    if(request.method!=="GET") return json({ok:false,error:"GET only"},405);

    if(u.pathname==="/image"){
      const target=u.searchParams.get("url");
      if(!target)return json({ok:false,error:"missing url"},400);
      let tu;
      try{tu=new URL(target)}catch{return json({ok:false,error:"invalid url"},400)}
      if(tu.protocol!=="https:" || !safeImageHost(tu.hostname)){
        return json({ok:false,error:"image host not allowed"},403);
      }
      try{
        const r=await fetch(tu.toString(),{
          headers:{"Accept":"image/avif,image/webp,image/apng,image/*,*/*;q=0.8"},
          cf:{cacheEverything:true,cacheTtl:86400}
        });
        if(!r.ok)return json({ok:false,error:"upstream image "+r.status},r.status);
        return new Response(r.body,{
          status:200,
          headers:{
            "Content-Type":r.headers.get("content-type")||"image/jpeg",
            "Cache-Control":"public,max-age=86400",
            ...cors()
          }
        });
      }catch(e){
        return json({ok:false,error:String(e?.message||e)},502);
      }
    }

    if(u.pathname!=="/api") return json({ok:false,error:"Not found"},404);

    const out=new URL(NICO_API);
    for(const [k,v] of u.searchParams)out.searchParams.append(k,v);
    if(!out.searchParams.has("_context"))out.searchParams.set("_context","voice_synth_archive_v17");
    if(!out.searchParams.has("_limit"))out.searchParams.set("_limit","20");

    const limit=Math.min(100,Math.max(0,Number(out.searchParams.get("_limit"))||20));
    const offset=Math.min(100000,Math.max(0,Number(out.searchParams.get("_offset"))||0));
    out.searchParams.set("_limit",String(limit));
    out.searchParams.set("_offset",String(offset));

    try{
      const r=await fetch(out.toString(),{
        headers:{"Accept":"application/json","User-Agent":"voice-synth-niconico-archive/17.0"}
      });
      const body=await r.text();
      return new Response(body,{
        status:r.status,
        headers:{
          "Content-Type":r.headers.get("content-type")||"application/json; charset=utf-8",
          "Cache-Control":"public,max-age=300",
          ...cors()
        }
      });
    }catch(e){
      return json({ok:false,error:String(e?.message||e)},502);
    }
  },

  async scheduled(event,env,ctx){
    ctx.waitUntil(syncVocaDBPages(env,{pages:4}));
  }
};
