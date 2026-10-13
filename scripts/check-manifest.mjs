#!/usr/bin/env node
// C7: đủ file bắt buộc (run/manifest.json), không rỗng; thống kê trong README khớp dữ liệu thật.
// README phải có dòng: <!-- stats: muscles=N groups=N exercises=N gym=N calisthenics=N sources=N -->
import { readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
const errs = [];
const { files } = rd("run/manifest.json");
for (const f of files) {
  const p = path.join(root, f);
  if (!existsSync(p)) errs.push(`thiếu: ${f}`);
  else if (statSync(p).size === 0) errs.push(`rỗng: ${f}`);
}
const m = rd("src/data/muscles.json"), ex = rd("src/data/exercises.json"), src = rd("src/data/sources.json");
const actual = {
  muscles: m.muscles.length, groups: m.groups.length, exercises: ex.length,
  gym: ex.filter((e) => e.type === "gym").length, calisthenics: ex.filter((e) => e.type === "calisthenics").length,
  sources: Array.isArray(src) ? src.length : Object.keys(src).length,
};
if (existsSync(path.join(root, "README.md"))) {
  const mm = readFileSync(path.join(root, "README.md"), "utf8").match(/<!--\s*stats:([^>]*)-->/);
  if (!mm) errs.push("README thiếu dòng <!-- stats: ... -->");
  else {
    const claimed = Object.fromEntries(mm[1].trim().split(/\s+/).map((kv) => kv.split("=")).map(([k, v]) => [k, Number(v)]));
    for (const [k, v] of Object.entries(actual)) if (claimed[k] !== v) errs.push(`README stats ${k}=${claimed[k]} ≠ thực tế ${v}`);
  }
}
console.log(JSON.stringify({ required: files.length, actual }));
if (errs.length) { console.error("FAIL C7\n" + errs.join("\n")); process.exit(1); }
console.log(`PASS C7: ${files.length} file bắt buộc có đủ, thống kê README khớp dữ liệu`);
