#!/usr/bin/env node
// Cổng V-C5: mỗi bài có mục video (đã xác minh) hoặc "none" có lý do + từ khoá tìm.
// Dùng: node scripts/check-videos.mjs [src/data/videos/part-2.json]  (mặc định src/data/videos.json, phải phủ đủ 299 bài)
import { readFileSync } from "node:fs";

const EX = JSON.parse(readFileSync("src/data/exercises.json", "utf8"));
const file = process.argv[2] || "src/data/videos.json";
const V = JSON.parse(readFileSync(file, "utf8"));
const partial = !!process.argv[2];
const ids = new Set(EX.map((e) => e.id));
const errs = [];
const scope = partial ? Object.keys(V) : EX.map((e) => e.id);
const byVid = new Map();
let withVideo = 0, none = 0;
for (const id of scope) {
  const v = V[id];
  if (!ids.has(id)) { errs.push(`${id}: không phải bài trong exercises.json`); continue; }
  if (!v) { errs.push(`${id}: thiếu mục video`); continue; }
  if (v.none) {
    none++;
    if (!v.reason || v.reason.length < 15) errs.push(`${id}: none nhưng thiếu lý do`);
    if (!v.query) errs.push(`${id}: none nhưng thiếu từ khoá tìm (query)`);
    continue;
  }
  withVideo++;
  if (!/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId || "")) errs.push(`${id}: youtubeId sai dạng "${v.youtubeId}"`);
  for (const k of ["title", "channel", "channelUrl", "note"]) if (!v[k] || typeof v[k] !== "string") errs.push(`${id}: thiếu ${k}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.checked || "")) errs.push(`${id}: thiếu ngày kiểm tra (checked)`);
  if (v.channelUrl && !/^https:\/\/www\.youtube\.com\//.test(v.channelUrl)) errs.push(`${id}: channelUrl không phải YouTube`);
  (byVid.get(v.youtubeId) || byVid.set(v.youtubeId, []).get(v.youtubeId)).push(id);
}
const shared = [...byVid].filter(([, a]) => a.length > 1);
for (const [vid, a] of shared) {
  // Cho phép dùng chung khi các bài là biến thể gần (ghi rõ trong note của từng bài)
  for (const id of a) if (!/(chung|shared|variant|biến thể)/i.test(V[id].note)) errs.push(`${id}: video ${vid} dùng chung với ${a.filter((x) => x !== id).join(",")} nhưng note không giải thích`);
}
console.log(JSON.stringify({ file, entries: scope.length, withVideo, none, coverage: +(withVideo / scope.length * 100).toFixed(1), sharedVideos: shared.length, errors: errs.length }));
if (errs.length) { console.error("FAIL videos\n" + errs.slice(0, 40).join("\n")); process.exit(1); }
console.log("PASS videos");
