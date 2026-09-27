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
const lastRender=index.lastIndexOf("window.renderUniverse=");
const finalRender=index.lastIndexOf("window.renderUniverse=render58");
if(finalRender<0||finalRender!==lastRender)fail("Relation Bridge is not the final window.renderUniverse owner");
if(!index.includes('window.__VSA_DIVE_RENDER_OWNER="relation58"'))fail("Dive render owner guard missing");
if(!index.includes("if(!ok)return false"))fail("lazy sequential loader does not fail closed");
if(!index.includes("delete jobs[src]"))fail("failed lazy asset is not retryable");
if(!index.includes("delete groups[name]"))fail("failed lazy feature group is not retryable");

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
