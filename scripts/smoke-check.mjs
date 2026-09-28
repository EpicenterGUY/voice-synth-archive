import { readFile, readdir, access } from "node:fs/promises";
import { extname, join } from "node:path";
import vm from "node:vm";

const root=process.cwd();
const errors=[],notes=[];
const fail=(m)=>errors.push(m);
const note=(m)=>notes.push(m);

async function text(path){return readFile(join(root,path),"utf8")}
async function exists(path){try{await access(join(root,path));return true}catch{return false}}
function versionOf(src,re,label){const m=src.match(re);if(!m){fail(label+" version not found");return""}return m[1]}

const index=await text("index.html");
const androidRelease=await text(".github/workflows/android-release.yml");
const androidDebug=await text(".github/workflows/android-debug.yml");

// 1. Classic root JS syntax.
for(const ent of await readdir(root,{withFileTypes:true})){
  if(!ent.isFile()||extname(ent.name)!==".js")continue;
  const src=await text(ent.name);
  try{new vm.Script(src,{filename:ent.name})}catch(e){fail(ent.name+": "+e.message)}
}

// 2. Inline script syntax.
let inline=0;
for(const m of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/\bsrc\s*=/.test(m[1]))continue;
  inline++;
  try{new vm.Script(m[2],{filename:"index.html:inline-"+inline})}catch(e){fail("index inline "+inline+": "+e.message)}
}

// 3. JSON files.
for(const path of ["package.json","manifest.webmanifest","capacitor.config.json","changelog.json"]){
  try{JSON.parse(await text(path))}catch(e){fail(path+": "+e.message)}
}

// 4. Referenced local assets.
const refs=new Set();
for(const re of [/<script[^>]+src=["']([^"']+)["']/gi,/<link[^>]+href=["']([^"']+)["']/gi,/<img[^>]+src=["']([^"']+)["']/gi]){
  for(const m of index.matchAll(re)){
    const raw=m[1];
    if(!raw.startsWith("./"))continue;
    const path=raw.slice(2).split(/[?#]/)[0];
    if(path)refs.add(path)
  }
}
for(const path of refs)if(!(await exists(path)))fail("missing local asset: "+path);

// 5. Duplicate real DOM IDs (ignore id-like strings inside style/script content).
const domOnly=index.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi,"$1$2").replace(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/gi,"$1$2");
const idCounts=new Map();
for(const m of domOnly.matchAll(/<([a-zA-Z][\w:-]*)([^<>]*?)>/g)){
  const id=m[2].match(/(?:^|\s)id=["']([^"']+)["']/i)?.[1];
  if(id)idCounts.set(id,(idCounts.get(id)||0)+1)
}
for(const [id,n] of idCounts)if(n>1)fail("duplicate DOM id: "+id+" x"+n);

// 6. Runtime version consistency.
const pkg=JSON.parse(await text("package.json"));
const expected=String(pkg.version);
const versionFiles=[
  ["service-worker.js",/SW_VERSION=["']([^"']+)/,"service worker"],
  ["app-update-v3966.js",/var VERSION=["']([^"']+)/,"APK updater"],
  ["pwa-v21.js",/const APP_VERSION=["']([^"']+)/,"PWA"],
  ["native-shell-v3963.js",/var VERSION=["']([^"']+)/,"native shell"],
  ["app-platform-v3962.js",/var BUILD=["']([^"']+)/,"app platform"],
  ["entitlements-v3962.js",/var VERSION=["']([^"']+)/,"entitlements"],
  ["account-v3962.js",/var VERSION=["']([^"']+)/,"account"],
  ["search-live-v3969.js",/var VERSION=["']([^"']+)/,"search"],
  ["device-sync-v3938.js",/var VERSION=["']([^"']+)/,"device sync"]
];
for(const [path,re,label] of versionFiles){
  const v=versionOf(await text(path),re,label);
  if(v&&v!==expected)fail(label+" version "+v+" != package "+expected)
}
if(!index.includes("v"+expected))fail("index.html does not expose package version "+expected);

// 7. Critical Dive ownership / lazy loader invariants.
const relationRender=index.lastIndexOf("window.renderUniverse=render58");
if(relationRender<0)fail("Relation Bridge render assignment missing");
if(!index.includes('window.__VSA_DIVE_RENDER_OWNER="relation58"'))fail("Dive render owner guard missing");
for(const legacy of ["window.renderUniverse=render46","window.renderUniverse=renderSea48","window.renderUniverse=render49","window.renderUniverse=render50"]){
  const p=index.lastIndexOf(legacy);
  if(p>relationRender)fail("legacy Dive renderer reclaims UI after Relation Bridge: "+legacy)
}
const wrap59=index.lastIndexOf("var oldRender59=window.renderUniverse");
const wrap60=index.lastIndexOf("var oldRender60=window.renderUniverse");
if(wrap59<relationRender||wrap60<wrap59)fail("Relation candidate/trust wrappers are not chained after Relation Bridge");
if(!index.includes("if(!ok)return false"))fail("lazy sequential loader does not fail closed");
if(!index.includes("delete jobs[src]"))fail("failed lazy asset is not retryable");
if(!index.includes("delete groups[name]"))fail("failed lazy feature group is not retryable");

// 8. UI observer / settings render-loop regressions.
const unifiedUi=await text("vocadive-ui-v3980.js");
if(!unifiedUi.includes("summary.innerHTML!==summaryHtml"))fail("settings summary render guard missing");
if(!unifiedUi.includes("card!==card.parentElement.lastElementChild"))fail("settings update-card move guard missing");
if(!unifiedUi.includes('n.namespaceURI&&n.namespaceURI!=="http://www.w3.org/1999/xhtml"'))fail("legacy nav observer still scans non-HTML Dive nodes");
if(!unifiedUi.includes('t.classList.contains("tool-view")||t.classList.contains("tools-body")'))fail("route observer target filter missing");

const liveSearch=await text("search-live-v3969.js");
if(liveSearch.includes("new MutationObserver(function(){syncRoute()})"))fail("search observer still reacts to every body mutation");
if(!liveSearch.includes('var searchSelector="#v39GlobalSearch,#globalSearchInput,#v397SearchShell'))fail("search observer selector guard missing");

if(!index.includes('source:"core-dive"'))fail("core Dive route activation event missing");
if(!index.includes('modal.dataset.currentView="universe29"'))fail("core Dive direct route activation missing");
if(!unifiedUi.includes('button[data-v3980="dive"]'))fail("Dive dock safety handler missing");
if(!unifiedUi.includes("__v3986DiveSafetyHandled"))fail("Dive dock duplicate-tap safety marker missing");

// 9. Dive / Fold performance regressions.
if(!index.includes("taskLimit=lite?10:23"))fail("mobile Dive candidate task cap regressed");
if(!index.includes("mapLimit(batchTasks,batchTasks.length<=10?3:4,fetchTask59)"))fail("mobile Dive candidate concurrency guard missing");
if(!index.includes('window.matchMedia("(pointer:coarse)").matches)?28:36'))fail("mobile Dive fetch-size guard missing");
if(!index.includes(".mr58-map>.mr58-node:nth-of-type(n+7){display:none!important}"))fail("compact Dive six-card cap missing");
const player=await text("nico-player-v32.js");
if(!player.includes('t.classList&&t.classList.contains("tool-view")'))fail("player route observer is not scoped to tool views");
if(player.includes('new MutationObserver(function(){scheduleSurfaceRepair("mutation")})'))fail("player observer still reacts to every toolsModal mutation");
if(!unifiedUi.includes('#v3924VolumeMini{display:none!important}'))fail("compact Fold mini-player control reduction missing");
if(!unifiedUi.includes('[data-v39-open-universe]'))fail("home Dive route safety fallback missing");

// 10. Dive transition latency / staged mobile relation search.
if(!index.includes("Promise.all([transitionJob,buildJob])"))fail("Dive route build no longer overlaps transition");
if(!index.includes("setTimeout(resolve,450)"))fail("Dive center metadata budget missing");
if(!index.includes("if(lite&&tasks.length>7)"))fail("mobile Dive staged candidate search missing");
if(!index.includes("if(map.size<44)await runBatch"))fail("mobile Dive second-wave threshold missing");
if(!index.includes('p.setAttribute("aria-busy","true")'))fail("Dive moving aria-busy feedback missing");
if(!index.includes('id="v3988DiveSpeedFeedback"'))fail("Dive lightweight move feedback style missing");

// 11. Dive-first Home identity / entry action regressions.
if(!index.includes("function homeDiveEntry3989()"))fail("Dive-first Home entry renderer missing");
if(!index.includes("한 곡에서 시작해, 더 깊이."))fail("Dive-first Home identity copy missing");
if(!index.includes('data-v3989-search'))fail("Home Dive search entry missing");
if(!index.includes('data-v3989-random'))fail("Home random Dive entry missing");
if(!index.includes('data-v3989-resume'))fail("Home resume Dive entry missing");
if(!index.includes("focusSearch:focusSearch58"))fail("Dive search focus API missing");
if(!index.includes("↓ 이 곡에서 다이브"))fail("home recommendation does not prioritize Dive");
if(!index.includes('data-v39-feature="archive"'))fail("Home archive entry point missing");
if(!unifiedUi.includes(".v3989-dive-entry"))fail("Dive-first Home responsive style missing");
if(!unifiedUi.includes("[data-v3989-search],[data-v3989-random],[data-v3989-resume]"))fail("Home Dive route safety fallback missing");

// 12. Explore entry-map / Dive detail regressions.
if(!index.includes("VOCADIVE · ENTRY MAP 3.1"))fail("Explore entry-map identity missing");
if(!index.includes('className="tool-view v37-native-hub v393-native-explore v3990-entry-map"'))fail("Explore entry-map DOM marker missing");
if(!index.includes('!v.classList.contains("v3990-entry-map")'))fail("stale Explore hub rebuild guard missing");
if(!index.includes("function featureRouteActive3990(route)"))fail("feature route verification helper missing");
if(!index.includes("verifyFeatureRoute3990(id,f.route)"))fail("generic feature route recovery missing");
if(!index.includes("function primaryReason58(r)"))fail("Dive primary relation reason missing");
if(!index.includes("mr90-node-reason"))fail("Dive card primary reason output missing");
if(!index.includes("data-mr58-close-side"))fail("Dive detail close action missing");
if(!index.includes("mainReasons=reasons.slice(0,3)"))fail("Dive detail reason cap missing");
if(!index.includes("mr90-more-reasons"))fail("Dive extra reasons disclosure missing");
if(!unifiedUi.includes(".v3990-map-hero"))fail("Explore entry-map responsive style missing");
if(!unifiedUi.includes(".mr90-side-close"))fail("Dive compact detail style missing");
if(!index.includes("window.VSAOpenFeature37=openFeatureById37"))fail("feature opener export missing");
if(!unifiedUi.includes("window.VSAOpenFeature37"))fail("feature-card route recovery caller missing");
if(!unifiedUi.includes("[data-v37-feature-id]"))fail("feature-card recovery listener missing");
if(!index.includes("data-feature-id=\"'+id+'\" data-v37-feature-id=\"'+id+'\""))fail("Explore feature cards bypass route recovery");
if(!index.includes("card.scrollIntoView({behavior:\"smooth\",block:\"nearest\"})"))fail("mobile Dive selected-card scroll guard missing");

// 13. Worker truth / invalid Niconico target regressions.
if(!index.includes("e.workerReachable=true"))fail("HTTP response reachability marker missing");
if(!index.includes('reason:"api-error"'))fail("Worker API-error classification missing");
if(index.includes('queryTargets:"contentId"'))fail("invalid Niconico contentId search target returned");
if(!index.includes('source:"health"'))fail("authoritative Worker health event source missing");
if(!index.includes("__VSA_WORKER_TOP_OWNER"))fail("top Worker status ownership guard missing");
if(!unifiedUi.includes("__VSA_WORKER_TOP_OWNER=true"))fail("unified UI does not claim Worker status pill");
if(!unifiedUi.includes('source!=="health"'))fail("non-health Worker failure debounce missing");

// 14. Natural palette / producer discovery regressions.
if(!unifiedUi.includes("--vd-bg:#091113"))fail("neutral VocaDive background token missing");
if(!unifiedUi.includes("--vd-danger-bg:#1b1517"))fail("semantic error surface token missing");
if(!unifiedUi.includes("Natural palette · v39.92"))fail("natural palette override missing");
if(!unifiedUi.includes('body[data-vsa-theme="light"]{'))fail("light palette token override missing");
if(!unifiedUi.includes('body[data-vsa-theme="light"] #v3980Dock'))fail("light dock palette override missing");
if(!unifiedUi.includes('body[data-vsa-theme="light"].v37-ready>.app>.topbar'))fail("light topbar palette override missing");
if(!index.includes("sampleLimit=Math.min(220"))fail("producer discovery sample cap missing");
if(!index.includes("resolveSongProducers37(song,{fast:true,allowSibling:false})"))fail("producer fast first pass missing");
if(!index.includes("Math.min(36,count*3)"))fail("producer rescue cap missing");
if(!index.includes("producerEvidence37(x)"))fail("producer evidence model missing");
if(!index.includes("v37-producer-reason"))fail("producer discovery reason card missing");
if(!index.includes("4500"))fail("VocaDB timeout guard missing");

// 15. Producer action flow / light-mode contrast.
if(!index.includes("__VSA37_PRODUCER_SONG_MAP"))fail("producer song map missing");
if(!index.includes("data-v37-producer-song"))fail("producer result detail action missing");
if(!index.includes("data-v37-producer-dive"))fail("producer result Dive action missing");
if(!index.includes("Promise.resolve(VSAEnsureFeatures(\"v33\")).then"))fail("producer detail fallback chain missing");
if(!unifiedUi.includes("Light mode contrast repair · v39.93"))fail("light-mode contrast repair missing");
if(!unifiedUi.includes('body[data-vsa-theme="light"] .v3989-dive-entry-copy h1'))fail("light Home Dive title contrast guard missing");
if(!unifiedUi.includes('body[data-vsa-theme="light"] #v3982WorkerPill[data-state="err"]'))fail("light Worker pill contrast guard missing");
if(!unifiedUi.includes(".v37-producer-song-actions"))fail("producer song action styles missing");

// 16. Dive deck / Worker fallback / stale mobile nav regressions.
if(index.includes(".mr58-node:nth-of-type(n+5){display:none}"))fail("legacy mobile Dive four-card cap returned");
if(index.includes(".mr58-map>.mr58-node:nth-of-type(n+5){display:none!important}"))fail("compact phone Dive four-card cap returned");
if(!index.includes("function transitionColor58(depth)"))fail("depth-aware Dive transition palette missing");
if(!index.includes('dir==="side"?180:300'))fail("mobile Dive transition latency guard missing");
if(!unifiedUi.includes('message:ok?"":"Worker /health 응답 이상",source:"health"'))fail("fallback Worker health source missing");
if(!unifiedUi.includes('message:String(e&&e.message||e),source:"health"'))fail("fallback Worker network failure is not authoritative");
if(!unifiedUi.includes(".app-bottom-nav,.mobile-section-nav"))fail("stale mobile section nav cleanup missing");
if(!unifiedUi.includes("Dive interaction polish · v39.94"))fail("Dive interaction polish missing");

// 17. Inline Dive detail / compact Explore / action semantics.
if(!index.includes("function moveActionLabel58(c,n)"))fail("direction-aware Dive action label missing");
if(!index.includes('class="mr95-node-peek"'))fail("mobile inline Dive detail missing");
if(!index.includes('setAttribute("aria-expanded",on?"true":"false")'))fail("Dive candidate expanded state missing");
if(!index.includes('VSAOpenSong39(det.dataset.mr58Detail,false)'))fail("Dive detail still autoplays");
if(!index.includes('recordRuntimeError37("producer-hub-load"'))fail("Producer hub lazy-load failure recovery missing");
if(!unifiedUi.includes("Dive inline detail + compact Explore · v39.95"))fail("v39.95 UI polish missing");
if(!unifiedUi.includes(".mr58-node.selected .mr95-node-peek"))fail("selected Dive inline detail style missing");
if(!unifiedUi.includes("@media(min-width:380px) and (max-width:699px)"))fail("compact Explore two-column breakpoint missing");
if(!unifiedUi.includes('button[aria-busy="true"]'))fail("busy control interaction guard missing");

// 18. Theme contrast integrity / runtime audit.
if(!unifiedUi.includes("Theme contrast contract · v39.100"))fail("v39.100 theme contrast contract missing");
if(!unifiedUi.includes("--vd-soft:#819491"))fail("dark soft-text contrast token missing");
if(!unifiedUi.includes("--vd-text:#17302e;--vd-muted:#536b68;--vd-soft:#5c716e"))fail("light readable text tokens missing");
if(!unifiedUi.includes('body[data-vsa-theme="light"] #universePanel.v3958-rel'))fail("light-mode Dive dark-ocean restore missing");
if(!unifiedUi.includes('body[data-vsa-theme="light"] .mr74-transition :is(small,b,span)'))fail("light-mode Dive transition text restore missing");
if(!index.includes("function themeContrastAudit37()"))fail("runtime theme contrast audit missing");
if(!index.includes("window.VSAThemeContrastAudit37=themeContrastAudit37"))fail("theme contrast audit export missing");
if(!index.includes("contrast:themeContrastAudit37()"))fail("diagnostics contrast collection missing");
if(!index.includes("THEME CONTRAST"))fail("diagnostics theme contrast card missing");
if(!index.includes('new CustomEvent("vsa:theme-change"'))fail("theme-change event missing");
if(!index.includes('bcs.backgroundImage&&bcs.backgroundImage!=="none"'))fail("contrast gradient false-positive guard missing");
function hexLum3996(hex){
  hex=String(hex).replace("#","");
  if(hex.length===3)hex=hex.split("").map(x=>x+x).join("");
  const v=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));
  return v[0]*.2126+v[1]*.7152+v[2]*.0722
}
function hexContrast3996(a,b){
  let A=hexLum3996(a),B=hexLum3996(b);if(A<B)[A,B]=[B,A];return(A+.05)/(B+.05)
}
for(const src of [index,unifiedUi]){
  for(const m of src.matchAll(/(body\[data-vsa-theme="light"\][^{]*)\{([^{}]+)\}/g)){
    const color=m[2].match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,6})/i);
    const bg=m[2].match(/(?:^|;)\s*background(?:-color)?\s*:\s*(#[0-9a-f]{3,6})/i);
    if(color&&bg&&hexContrast3996(color[1],bg[1])<4.5)fail("low light-mode static contrast: "+m[1].trim()+" "+color[1]+" on "+bg[1])
  }
}


// 19. Light discovery readability + HQ thumbnail regressions.
if(!unifiedUi.includes("Light discovery + high-definition thumbnail contract · v39.100"))fail("v39.100 light discovery/HQ thumbnail contract missing");
if(!unifiedUi.includes('body.v37-ready[data-vsa-theme="light"] :is(.discovery-card,.gem-card)'))fail("light discovery card surface override missing");
if(!unifiedUi.includes('body.v37-ready[data-vsa-theme="light"] :is(.discovery-title,.gem-title,.gem-topline a)'))fail("light discovery title override missing");
if(!unifiedUi.includes("function highResThumbnailUrl3997("))fail("HQ Niconico thumbnail resolver missing");
if(!unifiedUi.includes('u.pathname+=".L"'))fail("Niconico large-thumbnail upgrade missing");
if(!unifiedUi.includes("v3997HqFailed"))fail("HQ thumbnail fallback guard missing");
if(!unifiedUi.includes("installHiResThumb3997();"))fail("HQ thumbnail installer is not wired into boot");



// 20. In-app recommendation playback / HQ fallback recovery / signed-release trigger safety.
if(!unifiedUi.includes("Internal discovery playback · v39.100"))fail("v39.100 internal discovery playback style missing");
if(!index.includes('class="discovery-title vsa-play-title" data-v399-play="${esc(s.contentId)}"'))fail("guide/taste title no longer routes to in-app Watch");
if(!index.includes('class="gem-title vsa-play-title" data-v399-play="${esc(s.contentId)}"'))fail("hidden-gem title no longer routes to in-app Watch");
if(!index.includes(">▶ 앱에서 듣기</button>"))fail("recommendation in-app listen action missing");
if(!unifiedUi.includes('img.addEventListener("load",function(){'))fail("HQ thumbnail fallback load recovery missing");
if(!unifiedUi.includes('img.style.visibility=""'))fail("HQ fallback does not restore hidden thumbnails");
if(androidRelease.includes("branches:\n      - main"))fail("signed release still auto-runs on ordinary main pushes without signing secrets");
if(!androidRelease.includes('tags:\n      - "app-v*"'))fail("signed release tag trigger missing");
if(!androidRelease.includes("actions/setup-java@v5"))fail("signed release still uses deprecated setup-java v4");
if(!androidDebug.includes("actions/setup-java@v5"))fail("debug build still uses deprecated setup-java v4");
if(!androidRelease.includes("missing=()"))fail("signed release does not collect all missing signing secrets");



// 21. Detective/ranking in-app playback + terminal thumbnail placeholder.
if(!unifiedUi.includes("Broken thumbnail placeholder · v39.100"))fail("v39.100 broken-thumbnail placeholder style missing");
if(!unifiedUi.includes("function installBrokenThumbFallback3999()"))fail("broken-thumbnail fallback handler missing");
if(!unifiedUi.includes('img.matches(".thumb,.gem-thumb,.detective-thumb,.discovery-card img,.v39-thumb img,.v399-related-thumb img,.v37-producer-song img")'))fail("thumbnail fallback scope missing");
if(!unifiedUi.includes("img.replaceWith(fb)"))fail("terminal broken thumbnail is not replaced with placeholder");
if(!unifiedUi.includes("installBrokenThumbFallback3999();"))fail("broken-thumbnail fallback is not wired into boot");
if(!index.includes('class="detective-card-title vsa-play-title" data-v399-play="${esc(s.contentId)}"'))fail("detective title still bypasses in-app Watch");
if(!index.includes(">▶ 앱에서 확인</button>"))fail("detective in-app confirm action missing");
if(!index.includes('class="song-title vsa-play-title" data-v399-play="${esc(s.contentId)}"'))fail("ranking title still bypasses in-app Watch");
if(!index.includes('data-v399-play="${esc(s.contentId)}">▶ 앱에서 듣기</button>'))fail("ranking in-app listen action missing");



// 22. Tool-route black-screen watchdog / stable playback hooks.
if(!unifiedUi.includes("Route visibility watchdog · v39.100"))fail("v39.100 route visibility watchdog missing");
if(!unifiedUi.includes("function routeLooksHealthy39100(route)"))fail("route health checker missing");
if(!unifiedUi.includes("function repairRoute39100(route,reason)"))fail("route repair function missing");
if(!unifiedUi.includes('modal.querySelectorAll(".tool-view").forEach'))fail("route repair does not normalize competing tool views");
if(!unifiedUi.includes('v.style.removeProperty("display")'))fail("route repair does not clear stale display:none");
if(!unifiedUi.includes('document.body.classList.add("tools-open")'))fail("route repair does not restore tools-open shell");
if(!unifiedUi.includes("installRouteWatchdog39100();"))fail("route watchdog is not wired into boot");
if(!unifiedUi.includes("window.VSARepairRoute39100=repairRoute39100"))fail("manual route repair export missing");
if(index.includes("v3998-play-title")||index.includes("v3999-play-title"))fail("versioned playback title hooks returned");
if(!index.includes('class="discovery-title vsa-play-title"'))fail("stable discovery playback title hook missing");
if(!index.includes('class="detective-card-title vsa-play-title"'))fail("stable detective playback title hook missing");
if(!index.includes('class="song-title vsa-play-title"'))fail("stable ranking playback title hook missing");

note("classic JS syntax checked");
note("inline scripts checked: "+inline);
note("local references checked: "+refs.size);
note("package/runtime version: "+expected);

if(errors.length){
  console.error("\nVocaDive static smoke check FAILED");
  for(const e of errors)console.error(" - "+e);
  process.exit(1)
}
console.log("VocaDive static smoke check OK");
for(const n of notes)console.log(" - "+n);
