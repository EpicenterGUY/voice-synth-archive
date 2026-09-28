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
if(!index.includes(".mr58-map>.mr58-node:nth-of-type(n+5){display:none!important}"))fail("compact Dive card cap missing");
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
