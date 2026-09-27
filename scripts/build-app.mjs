import { cp, mkdir, readdir, copyFile, rm } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const out = join(root, "dist", "app");

const rootExtensions = new Set([".html", ".js", ".json", ".webmanifest", ".css"]);
const excludedRootFiles = new Set([
  "package.json",
  "package-lock.json",
  "capacitor.config.json"
]);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const entries = await readdir(root, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile()) continue;
  if (excludedRootFiles.has(entry.name)) continue;
  if (!rootExtensions.has(extname(entry.name))) continue;
  await copyFile(join(root, entry.name), join(out, entry.name));
}

for (const dir of ["icons"]) {
  await cp(join(root, dir), join(out, dir), { recursive: true });
}

console.log("VocaDive app web bundle prepared at dist/app");
